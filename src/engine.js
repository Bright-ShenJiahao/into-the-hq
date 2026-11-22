// 战斗规则引擎：纯逻辑，不碰页面。界面（game.js）和机器人模拟共用这一份。
// 角色专属的规则（韩松的弹仓、枪感……）在角色模块 B.mech 里；随身物品挂在触发点上（见 content/relics.js）。
import { CARDS, ENEMIES, CHARS, RELICS } from './data.js';

export const mulberry = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
export const shuffle = (a, r) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const ri = (r, a, b) => a + Math.floor(r() * (b - a + 1));
const addSt = (u, k, n) => { u.st[k] = (u.st[k] || 0) + n; if (u.st[k] <= 0) delete u.st[k]; };
export const HAND_MAX = 10, ENERGY = 3, DRAW = 5;
export const RITUAL = ['rt_drum', 'rt_bell', 'rt_knife'];

/* 能打的敌人。平民（文官、商人、高管）不在里面：不能被选成目标、群攻也打不到，打倒护着他们的人就算赢 */
export const alive = B => B.en.filter(e => !e.dead && !e.d.civ);
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
    autoScry: !!opt.autoScry, scryQ: [], p: { energy: 0, block: 0, fort: 0, counter: 0, st: {}, pw: {} } };
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
  p.block = p.pw.stance ? Math.floor(p.block / 2) : 0; /* 扎马步：上回合剩的格挡留一半 */ p.counter = 0; /* 反击只管到敌人回合结束 */ p.energy = ENERGY + sum(B, 'energy', !!first); p.firstGunPlayed = 0;
  p.atkT = 0; p.whetUsed = 0; p.halfHit = 0; p.minus3 = 0;
  B.mech.turnStart(B);
  /* 通用能力（通用卡给的）：防寒大衣、老兵经验 */
  if (p.pw.cblk) { p.block += p.pw.cblk; fx(B, 'hero', '+' + p.pw.cblk, 'blk'); }
  if (p.pw.ePlus) p.energy += p.pw.ePlus;
  let n = DRAW + sum(B, 'draw', !!first) + (p.pw.drawPlus || 0) + (p.nextDraw || 0) - (p.drawLess || 0); p.nextDraw = 0; p.drawLess = 0;
  if (first && B.R.temp < 3 && !flag(B, 'noColdDraw')) { n--; B.msgs.push('体温太低，手脚发僵：第一回合少抽 1 张。'); }
  /* 被「面具」拿走的牌，到时候还回来 */
  if (B.taken && B.taken.length) { for (const x of B.taken) x.t--; const back = B.taken.filter(x => x.t <= 0); B.taken = B.taken.filter(x => x.t > 0); for (const x of back) { B.hand.push(x.c); B.msgs.push(`${CARDS[x.c.id].name}回到了你手里。`); } }
  drawCards(B, n);
  /* 仪式：每回合给你下一张仪式牌（神鼓 → 腰铃 → 神刀），手里已经有了就不再给 */
  /* 洗牌后可能抽回已经用过的旧仪式牌：它们没用了，却会占着名额让下一步的牌发不出来，把仪式卡死，所以先清掉 */
  if (B.ritual && B.ritual.step < 3) {
    for (let i = B.hand.length - 1; i >= 0; i--) if (CARDS[B.hand[i].id].ritual && B.hand[i].id !== RITUAL[B.ritual.step]) B.hand.splice(i, 1);
    if (!B.hand.some(c => CARDS[c.id].ritual)) B.hand.push({ id: RITUAL[B.ritual.step], up: 0, uid: 90000 + B.turn });
  }
  if (B.mech.afterDraw) B.mech.afterDraw(B);
  trigger(B, 'turnStart', B);
}

export function drawCards(B, n) {
  for (let i = 0; i < n; i++) {
    if (B.hand.length >= HAND_MAX) return;
    if (!B.draw.length) { if (!B.disc.length) return; B.draw = shuffle(B.disc, B.rng); B.disc = []; }
    const c = B.draw.pop(); B.hand.push(c);
    const d = CARDS[c.id]; if (d.onDraw && B.G) d.onDraw(B.G, B);
  }
}

export const cardCost = (B, c) => { const d = CARDS[c.id]; return Math.max(0, d.cost[c.up ? 1 : 0] + sum(B, 'costMod', d, c) + (B.mech.costMod ? B.mech.costMod(B, d) : 0)); };
export const needTarget = c => CARDS[c.id].tgt === 'one';
/* 这张牌现在打出去是什么样（韩松：'shoot' 射击 / 'bayonet' 拼刺 / null） */
export const cardMode = (B, c) => B.mech.mode ? B.mech.mode(B, CARDS[c.id]) : null;
export const previewDmg = (B, d, x) => B.mech.preview ? B.mech.preview(B, d, x) : x;

/* 不能打出的原因（能打返回 null） */
export function cantPlay(B, c) {
  const d = CARDS[c.id];
  if (d.unplay) return '不能打出';
  if (cardCost(B, c) > B.p.energy) return '能量不够';
  if (d.need && !d.need(B.G)) return d.needTx || '条件不够';
  return B.mech.cantPlay ? B.mech.cantPlay(B, d) : null;
}

function fx(B, who, text, cls) { B.fx.push({ who, text, cls }); }

/* 伤害打到敌人身上（已经算好的数值） */
function hitEnemy(B, e, amt, pierce) {
  if (e.dead) return 0;
  amt = Math.max(0, Math.floor(amt));
  /* 第三章：「它」打不动（只能用仪式封回去）；影子每回合有一次机会「散开」躲掉一下 */
  if (e.d.immune) { fx(B, e.id, '打不动', 'st'); return 0; }
  if (e.d.dodge && !e.dodged && amt > 0 && B.rng() < e.d.dodge) { e.dodged = 1; fx(B, e.id, '散开了', 'st'); return 0; }
  if (e.d.hurtMul) amt = Math.floor(amt * e.d.hurtMul(B));
  /* 滑雪兵：刚打完一下就滑开，这一下躲掉 */
  if (e.st.evade && amt > 0) { delete e.st.evade; fx(B, e.id, '滑开了', 'st'); return 0; }
  if (amt > 0) B.lastHit = amt;
  if (!pierce) { const u = Math.min(e.block, amt); e.block -= u; amt -= u; }
  e.hp -= amt; fx(B, e.id, amt ? '-' + amt : '格挡', amt ? 'dmg' : 'blk');
  if (e.hp <= 0) { kill(B, e); return amt; }
  /* 架势（剑道军官）：这回合每次打到他，他就反击 */
  if (e.st.counter && !B.over) { fx(B, e.id, '居合反击', 'st'); hitPlayer(B, e.st.counter); }
  if (amt > 0 && e.d.onHurt) e.d.onHurt(e, B.G);
  /* 浪人剑客：每挨一下就居合还一刀 */
  if (e.d.riposte && !B.over && !e.dead) { fx(B, e.id, '居合', 'st'); hitPlayer(B, e.d.riposte); }
  /* 步兵炮：蓄力时一回合挨够伤害就被打断 */
  e.dmgT = (e.dmgT || 0) + amt;
  if (e.d.interrupt && !e.dead && e.d.interrupt.moves.includes(e.move) && e.dmgT >= e.d.interrupt.at) { e.move = e.d.interrupt.to; fx(B, e.id, '被打断了', 'st'); }
  return amt;
}
function kill(B, e) { e.dead = 1; e.hp = 0; e.marks = 0; e.deadAt = Date.now(); if (!e.d.noKill) B.R.kills = (B.R.kills || 0) + 1; if (e.d.intel) B.intelGot = 1; trigger(B, 'kill', e); if (B.mech.onKill) B.mech.onKill(B, e); if (e.d.onDeath) e.d.onDeath(e, B, B.G); morale(B); }
/* 第三章用：敌人消失（不算击杀、不掉东西） */
export function vanish(B, e, text) { if (e.dead) return; e.dead = 1; e.fled = 1; e.hp = 0; e.deadAt = Date.now(); if (text) fx(B, e.id, text, 'st'); }
/* 中途加一个敌人（召唤、它醒来） */
export function spawn(B, key, at) { const n = mkEnemy(B, key); if (at != null) B.en.splice(at, 0, n); else B.en.push(n); return n; }
/* 控制（打乱）：同一个敌人每场只吃一次；精英和首领不吃，改为「麻痹」：下一次攻击减半（照通往顶端的规矩） */
function hardCC(B, e) {
  if (!e || e.dead) return;
  if (e.d.elite || e.d.boss || e.ccU) { addSt(e, 'para', 1); fx(B, e.id, '麻痹', 'st'); }
  else { e.ccU = 1; e.st.dazed = 1; fx(B, e.id, '被打乱', 'st'); }
}
export const BLEED_MAX = 12;
/* 流血：敌人行动前失去等于层数的生命（不吃格挡），然后层数 -2；最多 12 层；对有装甲的敌人无效 */
function bleed(B, e, n) {
  if (!e || e.dead || n <= 0) return;
  if (e.armor > 0 || e.d.immune || e.d.noBleed) { fx(B, e.id, '不流血', 'st'); return; }
  if (B.mech.bleedMod) n = B.mech.bleedMod(B, e, n);
  const k = Math.min(BLEED_MAX, (e.st.bleed || 0) + n); if (k > (e.st.bleed || 0)) fx(B, e.id, `流血+${k - (e.st.bleed || 0)}`, 'st'); e.st.bleed = k;
}
/* 士气（伪满军）：同伴倒下一个「动摇」+1；动摇到 2 就溃逃——但有日军（或伪满警察队长）督战时不逃 */
export const supervised = B => alive(B).some(x => x.d.sup);
function morale(B) {
  for (const x of alive(B)) if (x.d.morale) {
    addSt(x, 'shaken', 1); fx(B, x.id, '动摇', 'st');
    if (x.st.shaken >= (x.d.brittle ? 1 : 2) && !supervised(B)) x.move = 'flee'; /* 临时召集的老兵：同伴倒下一个就投降 */
  }
}

/* 你的攻击：虚弱、易伤、装甲 */
function atkMod(B, e, d, sh = {}) {
  const p = B.p; d += (p.str || 0) + (B.mech.atkBonus ? B.mech.atkBonus(B) : 0);
  if (p.pw.whet && !p.whetUsed) { p.whetUsed = 1; d += p.pw.whet; }
  if (B.hand.some(c => CARDS[c.id].shake)) d -= 2;
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
  if (d.type === 'atk') B.p.atkT = (B.p.atkT || 0) + 1;
  return true;
}

/* 卡牌、随身物品、背包用品能用到的接口 */
function mkG(B) {
  const G = {
    B, alive: () => alive(B), rng: B.rng,
    block: n => { n += B.p.dex || 0; if (n <= 0) return; B.p.block += n; fx(B, 'hero', '+' + n, 'blk'); if (B.mech.onBlock) B.mech.onBlock(B, n); },
    /* 近战，对装甲另算（ap：对装甲加成的倍数，无视装甲） */
    meleeAP: (t, n, ap) => { if (t) hitEnemy(B, t, atkMod(B, t, n, { ap })); },
    str: n => { B.p.str = (B.p.str || 0) + n; fx(B, 'hero', `攻击+${n}`, 'st'); },
    dex: n => { B.p.dex = (B.p.dex || 0) + n; },
    nextDraw: n => { B.p.nextDraw = (B.p.nextDraw || 0) + n; },
    halfHit: () => { B.p.halfHit = 1; }, minus3: () => { B.p.minus3 = 1; },
    clearSelf: () => { delete B.p.st.weak; delete B.p.st.vuln; fx(B, 'hero', '缓过来了', 'st'); },
    atkPlayed: () => B.p.atkT || 0,
    draw: n => drawCards(B, n),
    heal: n => { const k = Math.min(n, B.R.maxHp - B.R.hp); if (k > 0) { B.R.hp += k; fx(B, 'hero', '+' + k, 'heal'); } },
    melee: (t, n) => { if (t) hitEnemy(B, t, atkMod(B, t, n)); },
    weak: (e, n) => { if (e && !e.dead) { addSt(e, 'weak', n); fx(B, e.id, `虚弱+${n}`, 'st'); } },
    selfWeak: n => { addSt(B.p, 'weak', n); fx(B, 'hero', `虚弱+${n}`, 'st'); },
    energy: n => { B.p.energy += n; fx(B, 'hero', `能量+${n}`, 'st'); },
    temp: n => { B.R.temp = Math.max(0, Math.min(10, B.R.temp + n)); fx(B, 'hero', `体温+${n}`, 'st'); },
    loseHp: n => { B.R.hp = Math.max(1, B.R.hp - n); fx(B, 'hero', '-' + n, 'dmg'); if (B.mech.onHurt) B.mech.onHurt(B, n); trigger(B, 'hurt', B, n); },
    meleeAll: n => { for (const e of alive(B)) hitEnemy(B, e, atkMod(B, e, n)); },
    vuln: (e, n) => { if (e && !e.dead) { addSt(e, 'vuln', n); fx(B, e.id, `易伤+${n}`, 'st'); } },
    bleed: (e, n) => bleed(B, e, n),
    hardCC: e => hardCC(B, e),
    fort: n => { B.p.fort = Math.min(30, B.p.fort + n); fx(B, 'hero', `工事+${n}`, 'blk'); },
    counter: n => { B.p.counter += n; fx(B, 'hero', `反击+${n}`, 'st'); },
    noise: n => { B.noise = (B.noise || 0) + n; },
    intends: e => !!e && !e.dead && intentOf(B, e).i === 'atk',
    scry: n => scry(B, n),
    surrender: e => { if (!e || e.dead) return; e.dead = 1; e.fled = 1; e.deadAt = Date.now(); fx(B, e.id, '放下武器', 'st'); morale(B); },
    power: (k, v) => { B.p.pw[k] = v; fx(B, 'hero', '能力', 'st'); },
    say: t => B.msgs.push(t), fx: (who, text, cls) => fx(B, who, text, cls),
    san: n => { if (B.R.san == null) return; B.R.san = Math.max(0, Math.min(10, B.R.san + n)); fx(B, 'hero', `理智${n > 0 ? '+' : ''}${n}`, 'st'); },
    /* 仪式牌：按顺序打出，第三张打完「它」就封回去了 */
    ritual: n => { if (!B.ritual || B.ritual.step !== n - 1) return; B.ritual.step = n; fx(B, 'hero', ['', '鼓声', '铃声', '刀光'][n], 'st');
      if (n === 3) { for (const e of alive(B)) vanish(B, e, e.d.sealTx || '退回了黑暗里'); B.msgs.push('鼓声停了。'); } },
    vanish: (e, t) => vanish(B, e, t), spawn: (k, at) => spawn(B, k, at),
  };
  return Object.assign(G, B.mech.G ? B.mech.G(B) : {});
}

/* 侦明（沈知秋）：看抽牌堆顶 n 张，挑着弃掉。界面弹框让玩家挑；自动模式（模拟、测试）由角色的 scryBot 来挑 */
function scry(B, n) {
  n += B.p.pw.listen || 0;
  const k = Math.min(n, B.draw.length); if (!k) { if (B.mech.onScry) B.mech.onScry(B, 0); return; }
  B.scryQ.push(k); if (B.autoScry) { const top = B.draw.slice(-k).reverse(); resolveScry(B, B.mech.scryBot ? B.mech.scryBot(B, top) : []); }
}
/* 结算一次侦明：uids 是要弃掉的牌。带【线索】的牌被弃掉时生效 */
export function resolveScry(B, uids) {
  const k = B.scryQ.shift(); if (!k) return;
  const top = B.draw.slice(-k), out = top.filter(c => uids.includes(c.uid));
  B.draw = B.draw.filter(c => !out.includes(c)); B.disc.push(...out);
  for (const c of out) { const d = CARDS[c.id]; if (d.clue) { fx(B, 'hero', '线索', 'st'); d.clue(B.G, c.up); trigger(B, 'clue'); } }
  if (B.mech.onScry) B.mech.onScry(B, k, out.length);
  trigger(B, 'scry', B);
}

/* 角色按钮（韩松：装填） */
export const actions = B => B.mech.actions ? B.mech.actions(B) : [];
export const act = (B, id) => B.mech.act ? B.mech.act(B, id) : false;

/* 战斗中使用背包用品 */
export function useItem(B, it) { if (!it.battle) return false; it.battle(B.G); return true; }

/* 结束你的回合：弃手牌，你的状态减 1 */
export function endPlayerTurn(B) {
  /* 手里留到回合结束的牌：inHandEnd 生效；「虚无」的直接消耗；「保留」的留在手里 */
  for (const k of ['weak', 'vuln']) if (B.p.st[k]) addSt(B.p, k, -1);
  for (const c of B.hand) { const d = CARDS[c.id]; if (d.inHandEnd) d.inHandEnd(B.G, B); } /* 放在状态减 1 之后：疑心给的虚弱要留到敌人回合 */
  const keep = B.hand.filter(c => CARDS[c.id].retain);
  for (const c of B.hand) if (!CARDS[c.id].retain) (CARDS[c.id].ethereal ? B.exh : B.disc).push(c);
  B.hand = keep;
  B.mech.turnEnd(B);
  trigger(B, 'turnEnd', B);
}

/* 敌人意图：用于显示 */
export function intentOf(B, e) {
  const m0 = e.d.moves[e.move]; if (!m0) return { i: 'unk', text: '?' };
  const m = typeof m0.t === 'function' ? { ...m0, t: m0.t(e) } : m0; /* 名字可以随回合变（如「后撤：还剩 2 回合」） */
  if (e.st.dazed) return { i: 'dazed', text: '', name: '被打乱' };
  if (m.hide && !B.mech.seeHidden) return { i: 'unk', text: '', name: '意图不明' }; /* 便衣、伪装：看不出要干什么（沈知秋看得穿） */
  if (m.echo) { const n = enemyDmg(B, e, B.lastHit || 6); return { i: 'atk', text: `${n}`, name: m.t, dmg: n }; }
  if (m.i === 'atk') { const n = enemyDmg(B, e, m.d); return { i: 'atk', text: m.x ? `${n}×${m.x}` : `${n}`, name: m.t, dmg: n * (m.x || 1) }; }
  if (m.i === 'charge') return { i: 'charge', text: `下回合 ${m.next}`, name: m.t };
  return { i: m.i, text: '', name: m.t };
}
export function enemyDmg(B, e, d) {
  let x = d + (e.st.str || 0); if (e.st.weak) x *= .75; if (B.p.st.vuln) x *= 1.5; if (e.st.para) x *= .5; if (B.mech.takenMul) x *= B.mech.takenMul(B); return Math.max(0, Math.floor(x));
}
export const incoming = B => alive(B).reduce((s, e) => s + (intentOf(B, e).dmg || 0), 0);

/* 你挨打：先扣格挡，再扣工事（赵铁山，不会清零的格挡），最后扣生命；反击（田守义）打回去 */
function hitPlayer(B, amt, src) {
  if (B.p.halfHit && amt > 0) { B.p.halfHit = 0; amt = Math.floor(amt / 2); fx(B, 'hero', '躲开一半', 'st'); }
  if (B.p.minus3 && amt > 0) { B.p.minus3 = 0; amt = Math.max(0, amt - 3); }
  const u = Math.min(B.p.block, amt); B.p.block -= u; let left = amt - u;
  if (left && B.p.fort) { const w = Math.min(B.p.fort, left); B.p.fort -= w; left -= w; fx(B, 'hero', `工事-${w}`, 'blk'); }
  B.R.hp -= left; fx(B, 'hero', left ? '-' + left : '格挡', left ? 'dmg' : 'blk');
  if (left > 0 && B.mech.onHurt) B.mech.onHurt(B, left);
  if (left > 0) trigger(B, 'hurt', B, left);
  const ctr = (B.p.counter || 0) + (B.p.pw.mine || 0);
  if (src && !src.dead && ctr > 0) { fx(B, src.id, '反击', 'st'); hitEnemy(B, src, ctr); }
  if (src && !src.dead && B.mech.onHitBy) B.mech.onHitBy(B, src);
  if (B.R.hp <= 0) { B.R.hp = 0; if (!relicsOf(B).some(r => r.lethal && r.lethal(B.G, B))) B.over = 'lose'; }
}

/* 一个敌人行动（界面逐个调用，中间可以加动画） */
export function enemyAct(B, e) {
  if (e.dead || B.over) return;
  e.block = 0; delete e.st.counter; e.dodged = 0; e.dmgT = 0; delete e.st.evade;
  /* 流血先结算 */
  if (e.st.bleed) { const n = e.st.bleed; e.hp -= n; fx(B, e.id, '-' + n, 'dmg'); if (B.mech.onBleed) B.mech.onBleed(B, e, n);
    if (e.hp <= 0) { kill(B, e); return; } e.st.bleed = Math.max(0, n - (B.p.pw.bleedSlow ? 1 : 2)); if (!e.st.bleed) delete e.st.bleed; }
  /* 被打乱：这回合什么也不干 */
  if (e.st.dazed) { delete e.st.dazed; fx(B, e.id, '乱了阵脚', 'st'); e.last = e.move; e.t++; const nx = e.d.ai(e, B, B.rng); e.move = nx === 'flee' ? 'flee' : e.ammo === 0 ? 'reload' : nx; return; }
  const m = e.d.moves[e.move];
  if (m.i === 'reload') { e.ammo = e.d.ammo; fx(B, e.id, '装弹', 'st'); }
  if (m.shot && e.ammo != null) e.ammo = Math.max(0, e.ammo - 1);
  if (m.i === 'flee') { e.dead = 1; e.fled = 1; e.deadAt = Date.now(); fx(B, e.id, e.d.fleeTx || (e.d.intel ? '带着档案箱撤走了' : '溃逃了'), 'st'); if (e.d.intel) B.intelLost = 1; if (e.d.onFlee) e.d.onFlee(e, B, B.G); morale(B); return; }
  if (m.d) { for (let k = 0; k < (m.x || 1) && !B.over && !e.dead; k++) hitPlayer(B, enemyDmg(B, e, m.d), e); if (e.st.para) addSt(e, 'para', -1); }
  if (m.echo && !B.over) hitPlayer(B, enemyDmg(B, e, B.lastHit || 6), e); /* 回声：学你上一下打出的伤害 */
  if (m.allHurt) alive(B).forEach(x => { if (x !== e) { fx(B, x.id, '被炸到', 'st'); hitEnemy(B, x, m.allHurt, 1); } }); /* 爆破工兵：连同伙一起炸 */
  if (m.san && B.R.san != null) { B.R.san = Math.max(0, B.R.san - m.san); fx(B, 'hero', `理智-${m.san}`, 'st'); }
  if (m.steal) { /* 面具：把你下回合本来要摸到的一张牌拿走，两回合后才还 */
    const pile = B.draw.length ? B.draw : B.disc; if (pile.length) { const c = pile.splice(pile.length - 1, 1)[0]; (B.taken = B.taken || []).push({ c, t: 2 }); fx(B, 'hero', `「${CARDS[c.id].name}」被拿走了`, 'st'); } }
  if (m.curse) { for (let k = 0; k < (m.cn || 1); k++) B.draw.splice(Math.floor(B.rng() * (B.draw.length + 1)), 0, { id: m.curse, up: 0, uid: 80000 + B.eid * 10 + k + B.turn * 100 }); fx(B, 'hero', `${CARDS[m.curse].name}混进了牌堆`, 'st'); }
  if (m.fn) m.fn(e, B, B.G);
  if (m.evade) e.st.evade = 1;
  if (m.blk) { e.block += m.blk; fx(B, e.id, '+' + m.blk, 'blk'); }
  if (m.allBlk) alive(B).forEach(x => { if (x !== e) { x.block += m.allBlk; fx(B, x.id, '+' + m.allBlk, 'blk'); } });
  if (m.str) { addSt(e, 'str', m.str); fx(B, e.id, `力量+${m.str}`, 'st'); }
  if (m.all) alive(B).forEach(x => { addSt(x, 'str', m.all); fx(B, x.id, `力量+${m.all}`, 'st'); });
  if (m.weak) { addSt(B.p, 'weak', m.weak); fx(B, 'hero', `虚弱+${m.weak}`, 'st'); }
  if (m.vuln) { addSt(B.p, 'vuln', m.vuln); fx(B, 'hero', `易伤+${m.vuln}`, 'st'); }
  if (m.counter) { e.st.counter = m.counter; fx(B, e.id, '架势', 'st'); }
  /* 叫人：场上最多 4 个；一场战斗最多叫来 6 个，叫完了就「没人来了」（防止只打援兵、战斗永远打不完） */
  if (m.summon && alive(B).length < 4) { if ((B.nSum = (B.nSum || 0) + 1) <= 6) { const n = mkEnemy(B, m.summon); B.en.splice(B.en.indexOf(e), 0, n); fx(B, n.id, '增援', 'st'); } else fx(B, e.id, '没人来了', 'st'); }
  for (const k of ['weak', 'vuln']) if (e.st[k]) addSt(e, k, -1);
  /* 下回合干什么在这里就定好（意图照此显示，不会临时变卦）：打空了先换弹，溃逃优先 */
  if (!e.dead) { e.last = e.move; e.t++; const nx = e.d.ai(e, B, B.rng); e.move = nx === 'flee' ? 'flee' : e.ammo === 0 ? 'reload' : nx; }
}

export function result(B) {
  if (B.over) return B.over;
  if (!alive(B).length) { for (const e of B.en) if (!e.dead && e.d.civ) { e.dead = 1; e.fled = 1; e.deadAt = Date.now(); fx(B, e.id, '举手投降', 'st'); } return (B.over = 'win'); }
  return null;
}
/* 战斗结束（界面在结算前调用） */
export function endBattle(B, win) { trigger(B, 'battleEnd', win); }

/* 预览在独立快照里调用同一套出牌规则，不扣真实资源、不推进真实随机数。 */
export function previewCard(B, i, tid) {
  const c = B.hand[i]; if (!c) return null;
  const why = cantPlay(B, c); if (why) return { why, enemies: [] };
  const seen = new WeakMap();
  const copy = value => {
    if (!value || typeof value !== 'object') return value;
    if (seen.has(value)) return seen.get(value);
    const out = Array.isArray(value) ? [] : {}; seen.set(value, out);
    for (const [key, v] of Object.entries(value)) out[key] = copy(v);
    return out;
  };
  const S = {};
  for (const [key, value] of Object.entries(B)) if (!['K', 'G', 'rng', 'char', 'mech', 'fx', 'msgs'].includes(key)) S[key] = copy(value);
  S.char = B.char; S.mech = B.mech; S.fx = []; S.msgs = []; S.autoScry = false;
  let random = false;
  S.rng = () => { random = true; return .5; };
  S.K = { fx: (w, t, c) => fx(S, w, t, c), hitEnemy: (e, a, p) => hitEnemy(S, e, a, p), atkMod: (e, d, sh) => atkMod(S, e, d, sh), alive: () => alive(S), drawCards: n => drawCards(S, n), sum: (ev, ...a) => sum(S, ev, ...a) };
  S.G = mkG(S);
  const nativeRandom = Math.random;
  try {
    Math.random = S.rng;
    playCard(S, i, tid);
  } finally { Math.random = nativeRandom; }
  return { random, enemies: B.en.filter(e => !e.dead && !e.d.civ).map(e => {
    const after = S.en.find(x => x.id === e.id);
    if (!after) return { id: e.id, hp: 0, block: 0, damage: 0, bleed: 0, charges: [], killed: false, phase: false };
    return { id: e.id, hp: Math.max(0, after.hp), block: Math.max(0, after.block),
      damage: Math.max(0, e.hp - Math.max(0, after.hp)), blocked: Math.max(0, e.block - after.block),
      bleed: Math.max(0, (after.st.bleed || 0) - (e.st.bleed || 0)),
      charges: (after.charges || []).slice((e.charges || []).length),
      killed: !!after.dead && !after.fled, phase: after.phase !== e.phase };
  }) };
}

