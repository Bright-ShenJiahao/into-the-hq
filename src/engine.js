// 战斗规则引擎：纯逻辑，不碰页面。界面（game.js）和机器人模拟共用这一份。
// 角色专属的规则（韩松的弹仓、枪感……）在角色模块 B.mech 里；随身物品挂在触发点上（见 content/relics.js）。
import { CARDS, ENEMIES, CHARS, RELICS } from './data.js';

export const mulberry = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
export const shuffle = (a, r) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const ri = (r, a, b) => a + Math.floor(r() * (b - a + 1));
const addSt = (u, k, n) => { u.st[k] = (u.st[k] || 0) + n; if (u.st[k] <= 0) delete u.st[k]; };
export const HAND_MAX = 10, ENERGY = 3, DRAW = 5;

export const alive = B => B.en.filter(e => !e.dead);
const relicsOf = B => (B.R.relics || []).map(id => RELICS[id]).filter(Boolean);
/* 触发点：让所有随身物品依次响应 */
export function trigger(B, ev, ...a) { for (const r of relicsOf(B)) if (typeof r[ev] === 'function') r[ev](B.G, ...a); }
/* 加成合计：随身物品返回的数字加起来 */
export function sum(B, ev, ...a) { let s = 0; for (const r of relicsOf(B)) if (typeof r[ev] === 'function') s += r[ev](B, ...a) || 0; return s; }
const flag = (B, k) => relicsOf(B).some(r => r[k]);

function mkEnemy(B, key, strong) {
  const d = ENEMIES[key]; const hp = ri(B.rng, d.hp[0], d.hp[1]);
  const e = { id: 'e' + (B.eid++), key, d, hp, max: hp, block: 0, st: {}, armor: d.armor || 0, marks: 0, t: 0, phase: 1, ammo: d.ammo || null };
  e.move = d.ai(e, B, B.rng); return e;
}

/* 开一场战斗。R 是这一局的存档；kind = fight/elite/boss；opt.strong = 加强精英 */
export function startBattle(R, keys, kind, rng, opt = {}) {
  const B = { R, rng, kind, eid: 1, en: [], hand: [], draw: [], disc: [], exh: [], fx: [], msgs: [], turn: 0, over: null, strong: !!opt.strong,
    p: { energy: 0, block: 0, st: {}, pw: {} } };
  B.char = CHARS[R.char || 'hansong']; B.mech = B.char.mech;
  B.K = { fx: (w, t, c) => fx(B, w, t, c), hitEnemy: (e, a, p) => hitEnemy(B, e, a, p), atkMod: (e, d, sh) => atkMod(B, e, d, sh), alive: () => alive(B), drawCards: n => drawCards(B, n), sum: (ev, ...a) => sum(B, ev, ...a) };
  /* 加强精英：多一个押运档案箱的敌人，3 回合内不打倒就带着情报撤走 */
  const esc = opt.escort || 'escort';
  B.en = [...keys, ...(opt.strong && ENEMIES[esc] ? [esc] : [])].map(k => mkEnemy(B, k));
  B.draw = shuffle(R.deck.map(c => ({ ...c })), rng);
  B.G = mkG(B);
  B.mech.init(B);
  trigger(B, 'battleStart');
  startTurn(B, true);
  return B;
}

export function startTurn(B, first) {
  const p = B.p; B.turn++;
  p.block = 0; p.energy = ENERGY + sum(B, 'energy', !!first); p.firstGunPlayed = 0;
  B.mech.turnStart(B);
  let n = DRAW + sum(B, 'draw', !!first);
  if (first && B.R.temp < 3 && !flag(B, 'noColdDraw')) { n--; B.msgs.push('体温太低，手脚发僵：第一回合少抽 1 张。'); }
  drawCards(B, n);
  trigger(B, 'turnStart', B);
}

export function drawCards(B, n) {
  for (let i = 0; i < n; i++) {
    if (B.hand.length >= HAND_MAX) return;
    if (!B.draw.length) { if (!B.disc.length) return; B.draw = shuffle(B.disc, B.rng); B.disc = []; }
    B.hand.push(B.draw.pop());
  }
}

export const cardCost = (B, c) => { const d = CARDS[c.id]; return Math.max(0, d.cost[c.up ? 1 : 0] + sum(B, 'costMod', d, c)); };
export const needTarget = c => CARDS[c.id].tgt === 'one';
/* 这张牌现在打出去是什么样（韩松：'shoot' 射击 / 'bayonet' 拼刺 / null） */
export const cardMode = (B, c) => B.mech.mode ? B.mech.mode(B, CARDS[c.id]) : null;
export const previewDmg = (B, d, x) => B.mech.preview ? B.mech.preview(B, d, x) : x;

/* 不能打出的原因（能打返回 null） */
export function cantPlay(B, c) {
  const d = CARDS[c.id];
  if (cardCost(B, c) > B.p.energy) return '能量不够';
  return B.mech.cantPlay ? B.mech.cantPlay(B, d) : null;
}

function fx(B, who, text, cls) { B.fx.push({ who, text, cls }); }

/* 伤害打到敌人身上（已经算好的数值） */
function hitEnemy(B, e, amt, pierce) {
  if (e.dead) return 0;
  amt = Math.max(0, Math.floor(amt));
  if (!pierce) { const u = Math.min(e.block, amt); e.block -= u; amt -= u; }
  e.hp -= amt; fx(B, e.id, amt ? '-' + amt : '格挡', amt ? 'dmg' : 'blk');
  if (e.hp <= 0) { kill(B, e); return amt; }
  /* 架势（剑道军官）：这回合每次打到他，他就反击 */
  if (e.st.counter && !B.over) { fx(B, e.id, '居合反击', 'st'); hitPlayer(B, e.st.counter); }
  if (amt > 0 && e.d.onHurt) e.d.onHurt(e, B.G);
  return amt;
}
function kill(B, e) { e.dead = 1; e.hp = 0; e.marks = 0; e.deadAt = Date.now(); B.R.kills = (B.R.kills || 0) + 1; if (e.d.intel) B.intelGot = 1; trigger(B, 'kill', e); morale(B); }
/* 士气（伪满军）：同伴倒下一个「动摇」+1；动摇到 2 就溃逃——但有日军（或伪满警察队长）督战时不逃 */
export const supervised = B => alive(B).some(x => x.d.sup);
function morale(B) {
  for (const x of alive(B)) if (x.d.morale) {
    addSt(x, 'shaken', 1); fx(B, x.id, '动摇', 'st');
    if (x.st.shaken >= 2 && !supervised(B)) x.move = 'flee';
  }
}

/* 你的攻击：虚弱、易伤、装甲 */
function atkMod(B, e, d, sh = {}) {
  if (B.p.st.weak) d *= .75;
  if (e.st.vuln) d *= 1.5;
  if (e.armor) d = sh.ap != null ? d * (1 + sh.ap) : d - e.armor;
  return Math.max(0, Math.floor(d));
}

/* 打出一张手牌。tid 是目标敌人 id */
export function playCard(B, i, tid) {
  const c = B.hand[i]; if (!c) return false; const d = CARDS[c.id], u = c.up;
  if (cantPlay(B, c)) return false;
  let t = tid ? B.en.find(e => e.id === tid && !e.dead) : null;
  if (d.tgt === 'one' && !t) { const a = alive(B); if (!a.length) return false; t = a[0]; }
  B.p.energy -= cardCost(B, c); B.hand.splice(i, 1);
  /* 空仓拼刺：只造成固定拼刺伤害，牌上其他效果不生效（标了 dry 的牌除外），免得空着枪比有子弹还划算 */
  if (d.gun && B.mech.playGun) { B.p.firstGunPlayed = 1; const res = B.mech.playGun(B, d, u, t); if (d.extra && (!res.bayonet || d.dry)) d.extra(B.G, u, t, res); }
  else if (d.play) d.play(B.G, u, t);
  if (d.type !== 'power') (d.ex ? B.exh : B.disc).push(c); /* 能力牌打出后本场移出牌组 */
  trigger(B, 'cardPlayed', d);
  return true;
}

/* 卡牌、随身物品、背包用品能用到的接口 */
function mkG(B) {
  const G = {
    B, alive: () => alive(B), rng: B.rng,
    block: n => { B.p.block += n; fx(B, 'hero', '+' + n, 'blk'); },
    draw: n => drawCards(B, n),
    heal: n => { const k = Math.min(n, B.R.maxHp - B.R.hp); if (k > 0) { B.R.hp += k; fx(B, 'hero', '+' + k, 'heal'); } },
    melee: (t, n) => { if (t) hitEnemy(B, t, atkMod(B, t, n)); },
    weak: (e, n) => { if (e && !e.dead) { addSt(e, 'weak', n); fx(B, e.id, `虚弱+${n}`, 'st'); } },
    selfWeak: n => { addSt(B.p, 'weak', n); fx(B, 'hero', `虚弱+${n}`, 'st'); },
    energy: n => { B.p.energy += n; fx(B, 'hero', `能量+${n}`, 'st'); },
    temp: n => { B.R.temp = Math.max(0, Math.min(10, B.R.temp + n)); fx(B, 'hero', `体温+${n}`, 'st'); },
    loseHp: n => { B.R.hp = Math.max(1, B.R.hp - n); fx(B, 'hero', '-' + n, 'dmg'); },
    power: (k, v) => { B.p.pw[k] = v; fx(B, 'hero', '能力', 'st'); },
    say: t => B.msgs.push(t), fx: (who, text, cls) => fx(B, who, text, cls),
  };
  return Object.assign(G, B.mech.G ? B.mech.G(B) : {});
}

/* 角色按钮（韩松：装填） */
export const actions = B => B.mech.actions ? B.mech.actions(B) : [];
export const act = (B, id) => B.mech.act ? B.mech.act(B, id) : false;

/* 战斗中使用背包用品 */
export function useItem(B, it) { if (!it.battle) return false; it.battle(B.G); return true; }

/* 结束你的回合：弃手牌，你的状态减 1 */
export function endPlayerTurn(B) {
  B.disc.push(...B.hand); B.hand = [];
  for (const k of ['weak', 'vuln']) if (B.p.st[k]) addSt(B.p, k, -1);
  B.mech.turnEnd(B);
  trigger(B, 'turnEnd', B);
}

/* 敌人意图：用于显示 */
export function intentOf(B, e) {
  const m0 = e.d.moves[e.move]; if (!m0) return { i: 'unk', text: '?' };
  const m = typeof m0.t === 'function' ? { ...m0, t: m0.t(e) } : m0; /* 名字可以随回合变（如「后撤：还剩 2 回合」） */
  if (m.hide) return { i: 'unk', text: '', name: '意图不明' }; /* 便衣、伪装：看不出要干什么 */
  if (m.i === 'atk') { const n = enemyDmg(B, e, m.d); return { i: 'atk', text: m.x ? `${n}×${m.x}` : `${n}`, name: m.t, dmg: n * (m.x || 1) }; }
  if (m.i === 'charge') return { i: 'charge', text: `下回合 ${m.next}`, name: m.t };
  return { i: m.i, text: '', name: m.t };
}
export function enemyDmg(B, e, d) {
  let x = d + (e.st.str || 0); if (e.st.weak) x *= .75; if (B.p.st.vuln) x *= 1.5; return Math.max(0, Math.floor(x));
}
export const incoming = B => alive(B).reduce((s, e) => s + (intentOf(B, e).dmg || 0), 0);

function hitPlayer(B, amt) {
  const u = Math.min(B.p.block, amt); B.p.block -= u; const left = amt - u;
  B.R.hp -= left; fx(B, 'hero', left ? '-' + left : '格挡', left ? 'dmg' : 'blk');
  if (B.R.hp <= 0) { B.R.hp = 0; if (!relicsOf(B).some(r => r.lethal && r.lethal(B.G, B))) B.over = 'lose'; }
}

/* 一个敌人行动（界面逐个调用，中间可以加动画） */
export function enemyAct(B, e) {
  if (e.dead || B.over) return;
  e.block = 0; delete e.st.counter;
  const m = e.d.moves[e.move];
  if (m.i === 'reload') { e.ammo = e.d.ammo; fx(B, e.id, '装弹', 'st'); }
  if (m.shot && e.ammo != null) e.ammo = Math.max(0, e.ammo - 1);
  if (m.i === 'flee') { e.dead = 1; e.fled = 1; e.deadAt = Date.now(); fx(B, e.id, e.d.intel ? '带着档案箱撤走了' : '溃逃了', 'st'); if (e.d.intel) B.intelLost = 1; morale(B); return; }
  if (m.d) for (let k = 0; k < (m.x || 1) && !B.over; k++) hitPlayer(B, enemyDmg(B, e, m.d));
  if (m.blk) { e.block += m.blk; fx(B, e.id, '+' + m.blk, 'blk'); }
  if (m.allBlk) alive(B).forEach(x => { if (x !== e) { x.block += m.allBlk; fx(B, x.id, '+' + m.allBlk, 'blk'); } });
  if (m.str) { addSt(e, 'str', m.str); fx(B, e.id, `力量+${m.str}`, 'st'); }
  if (m.all) alive(B).forEach(x => { addSt(x, 'str', m.all); fx(B, x.id, `力量+${m.all}`, 'st'); });
  if (m.weak) { addSt(B.p, 'weak', m.weak); fx(B, 'hero', `虚弱+${m.weak}`, 'st'); }
  if (m.vuln) { addSt(B.p, 'vuln', m.vuln); fx(B, 'hero', `易伤+${m.vuln}`, 'st'); }
  if (m.counter) { e.st.counter = m.counter; fx(B, e.id, '架势', 'st'); }
  if (m.summon && alive(B).length < 4) { const n = mkEnemy(B, m.summon); B.en.splice(B.en.indexOf(e), 0, n); fx(B, n.id, '增援', 'st'); }
  for (const k of ['weak', 'vuln']) if (e.st[k]) addSt(e, k, -1);
  /* 下回合干什么在这里就定好（意图照此显示，不会临时变卦）：打空了先换弹，溃逃优先 */
  if (!e.dead) { e.last = e.move; e.t++; const nx = e.d.ai(e, B, B.rng); e.move = nx === 'flee' ? 'flee' : e.ammo === 0 ? 'reload' : nx; }
}

export function result(B) {
  if (B.over) return B.over;
  if (!alive(B).length) return (B.over = 'win');
  return null;
}
/* 战斗结束（界面在结算前调用） */
export function endBattle(B, win) { trigger(B, 'battleEnd', win); }
