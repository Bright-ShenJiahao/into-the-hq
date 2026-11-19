// 战斗规则引擎：纯逻辑，不碰 DOM。界面（game.js）和以后的机器人模拟共用这一份。
import { CARDS, ENEMIES, WEAPONS, BAYONET } from './data.js';

export const mulberry = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
export const shuffle = (a, r) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const ri = (r, a, b) => a + Math.floor(r() * (b - a + 1));
const addSt = (u, k, n) => { u.st[k] = (u.st[k] || 0) + n; if (u.st[k] <= 0) delete u.st[k]; };
export const HAND_MAX = 10, ENERGY = 3, DRAW = 5, MARK_MAX = 5;

export const alive = B => B.en.filter(e => !e.dead);
export const curW = B => B.w[B.wi];
export const wDef = w => WEAPONS[w.id];

function mkEnemy(B, key) {
  const d = ENEMIES[key], hp = ri(B.rng, d.hp[0], d.hp[1]);
  const e = { id: 'e' + (B.eid++), key, d, hp, max: hp, block: 0, st: {}, armor: d.armor || 0, marks: 0, t: 0, phase: 1 };
  e.move = d.ai(e, B, B.rng); return e;
}

/* 开一场战斗。R 是这一局的存档（hp、牌组、武器、体温），kind = fight/elite/boss */
export function startBattle(R, keys, kind, rng) {
  const B = { R, rng, kind, eid: 1, en: [], hand: [], draw: [], disc: [], exh: [], fx: [], msgs: [], turn: 0, over: null,
    p: { energy: 0, block: 0, st: {}, pw: {} }, wi: 0, magBonus: 0 };
  B.w = R.weapons.map(id => ({ id, cap: WEAPONS[id].mag, ammo: WEAPONS[id].mag }));
  B.en = keys.map(k => mkEnemy(B, k));
  B.draw = shuffle(R.deck.map(c => ({ ...c })), rng);
  B.G = mkG(B);
  startTurn(B, true);
  return B;
}

export function startTurn(B, first) {
  const p = B.p; B.turn++;
  p.block = 0; p.energy = ENERGY; p.reloaded = 0; p.depotLeft = 0; p.firstSniper = 0; p.firstGun = 0; p.nextGun = 0; p.nextSn = 0; p.nextSnPM = 0;
  let n = DRAW; if (first && B.R.temp < 3) { n--; B.msgs.push('体温太低，手脚发僵：第一回合少抽 1 张。'); }
  drawCards(B, n);
}

export function drawCards(B, n) {
  for (let i = 0; i < n; i++) {
    if (B.hand.length >= HAND_MAX) return;
    if (!B.draw.length) { if (!B.disc.length) return; B.draw = shuffle(B.disc, B.rng); B.disc = []; }
    B.hand.push(B.draw.pop());
  }
}

export const cardCost = (B, c) => CARDS[c.id].cost[c.up ? 1 : 0];
export const needTarget = c => CARDS[c.id].tgt === 'one';
/* 这张牌现在打出去会是什么样：'shoot' 射击 / 'bayonet' 拼刺 / null 不是枪械牌 */
export const gunMode = (B, c) => !CARDS[c.id].gun ? null : curW(B).ammo > 0 ? 'shoot' : 'bayonet';

/* 不能打出的原因（能打返回 null） */
export function cantPlay(B, c) {
  const d = CARDS[c.id];
  if (cardCost(B, c) > B.p.energy) return '能量不够';
  if (d.gun && B.p.reloaded && !B.p.depotLeft) return '装填后本回合不能开枪';
  if (d.last && curW(B).ammo !== 1) return '弹仓要刚好剩 1 发';
  return null;
}

function fx(B, who, text, cls) { B.fx.push({ who, text, cls }); }

/* 伤害打到敌人身上（已经算好的数值） */
function hitEnemy(B, e, amt, pierce) {
  if (e.dead) return 0;
  amt = Math.max(0, Math.floor(amt));
  if (!pierce) { const u = Math.min(e.block, amt); e.block -= u; amt -= u; }
  e.hp -= amt; fx(B, e.id, amt ? '-' + amt : '格挡', amt ? 'dmg' : 'blk');
  if (e.hp <= 0) { kill(B, e); return amt; }
  if (amt > 0 && e.d.onHurt) e.d.onHurt(e, B.G);
  return amt;
}
function kill(B, e) { e.dead = 1; e.hp = 0; e.marks = 0; e.deadAt = Date.now(); B.R.kills = (B.R.kills || 0) + 1; }

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
  B.last = { id: c.id, mode: gunMode(B, c) };
  if (d.gun) {
    if (B.p.reloaded) B.p.depotLeft--;
    const res = { pre: d.pre ? d.pre(B.G, u, t) : 0 };
    if (curW(B).ammo > 0) Object.assign(res, fire(B, d, u, t));
    else { res.bayonet = 1; fx(B, 'hero', '拼刺！', 'st'); const before = t.dead; hitEnemy(B, t, atkMod(B, t, BAYONET)); res.kill = !before && t.dead; }
    if (d.extra) d.extra(B.G, u, t, res);
  } else if (d.play) d.play(B.G, u, t);
  if (d.type === 'power') { /* 能力牌打出后移出牌组 */ }
  else (d.ex ? B.exh : B.disc).push(c);
  return true;
}

/* 枪械牌射击：计算一次性加成，然后按「发数 × 连射」逐颗打 */
function fire(B, d, u, t) {
  const p = B.p, sh = d.sh(u), w = curW(B), wd = wDef(w), sniper = d.sch === '狙';
  let flat = sh.bonus || 0, pm = sh.pm || 0;
  flat += p.nextGun; p.nextGun = 0;
  if (sniper) { flat += p.nextSn; pm += p.nextSnPM; p.nextSn = 0; p.nextSnPM = 0; }
  let scopeMark = 0;
  if (sniper && p.pw.scope && !p.firstSniper) { p.firstSniper = 1; flat += p.pw.scope[0]; scopeMark = p.pw.scope[1]; }
  if (p.pw.prep && !p.firstGun) { p.firstGun = 1; flat += p.pw.prep; }
  p.firstGun = 1; if (sniper) p.firstSniper = 1;
  const marks = t.marks, base = sh.base != null ? sh.base : wd.dmg;
  const rounds = (sh.n || 1) * (sh.base != null ? 1 : wd.burst);
  let kill = 0, shots = 0;
  for (let k = 0; k < rounds; k++) {
    if (w.ammo <= 0) break;
    let tg = t; if (tg.dead) { const a = alive(B); if (!a.length) break; tg = a[0]; } /* 目标死了，后面的子弹打下一个 */
    w.ammo--; shots++;
    let dmg = base + flat + (tg === t ? marks : tg.marks) * (1 + pm);
    if (sh.exe && tg.hp < tg.max * sh.exe) dmg *= 2;
    const was = tg.dead; fx(B, tg.id, '', 'bul'); hitEnemy(B, tg, atkMod(B, tg, dmg, sh), sh.pierce);
    if (!was && tg.dead && tg === t) kill = 1;
  }
  if (sh.use && !t.dead) t.marks = sh.use === 'all' ? 0 : Math.max(0, t.marks - sh.use);
  if (scopeMark && !t.dead) G_mark(B, t, scopeMark);
  if (!w.ammo) fx(B, 'hero', '空仓', 'st');
  return { kill, shots };
}
function G_mark(B, e, n) { if (!e || e.dead) return; const k = Math.min(MARK_MAX, e.marks + n); if (k !== e.marks) fx(B, e.id, `标尺+${k - e.marks}`, 'st'); e.marks = k; }

/* 卡牌效果用到的接口 */
function mkG(B) {
  const G = {
    alive: () => alive(B), marks: e => (e ? e.marks : 0), ammo: () => curW(B).ammo,
    block: n => { B.p.block += n; fx(B, 'hero', '+' + n, 'blk'); },
    draw: n => drawCards(B, n),
    heal: n => { const k = Math.min(n, B.R.maxHp - B.R.hp); if (k > 0) { B.R.hp += k; fx(B, 'hero', '+' + k, 'heal'); } },
    mark: (e, n) => G_mark(B, e, n),
    melee: (t, n) => { if (t) hitEnemy(B, t, atkMod(B, t, n)); },
    switchW: () => { if (B.w.length < 2) return; B.wi = 1 - B.wi; fx(B, 'hero', '换' + wDef(curW(B)).name, 'st'); },
    addAmmo: n => { const w = curW(B); w.ammo = Math.min(w.cap, w.ammo + n); fx(B, 'hero', `子弹+${n}`, 'st'); },
    nextGun: n => { B.p.nextGun += n; }, nextSniper: (n, pm) => { B.p.nextSn += n; B.p.nextSnPM += pm; },
    power: (k, v) => { B.p.pw[k] = v; fx(B, 'hero', '能力', 'st'); },
    magUp: n => { B.w.forEach(w => { w.cap += n; w.ammo = Math.min(w.cap, w.ammo + n); }); fx(B, 'hero', `弹仓+${n}`, 'st'); },
    say: t => B.msgs.push(t), fx: (who, text, cls) => fx(B, who, text, cls),
  };
  return G;
}

/* 装填按钮：0 费，装满当前武器；之后本回合不能开枪（弹药库例外） */
export function reload(B) {
  const w = curW(B); if (w.ammo >= w.cap || B.p.reloaded) return false;
  w.ammo = w.cap; B.p.reloaded = 1; B.p.depotLeft = B.p.pw.depot ? 1 : 0;
  fx(B, 'hero', '装填', 'st'); return true;
}

/* 结束你的回合：弃手牌，你的状态减 1 */
export function endPlayerTurn(B) {
  B.disc.push(...B.hand); B.hand = [];
  for (const k of ['weak', 'vuln']) if (B.p.st[k]) addSt(B.p, k, -1);
}

/* 敌人意图：用于显示 */
export function intentOf(B, e) {
  const m = e.d.moves[e.move]; if (!m) return { i: 'unk', text: '?' };
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
  if (B.R.hp <= 0) { B.R.hp = 0; B.over = 'lose'; }
}

/* 一个敌人行动（界面逐个调用，中间可以加动画） */
export function enemyAct(B, e) {
  if (e.dead || B.over) return;
  e.block = 0;
  const m = e.d.moves[e.move];
  if (m.i === 'flee') { e.dead = 1; e.fled = 1; e.deadAt = Date.now(); fx(B, e.id, '逃跑了', 'st'); return; }
  if (m.d) for (let k = 0; k < (m.x || 1) && !B.over; k++) hitPlayer(B, enemyDmg(B, e, m.d));
  if (m.blk) { e.block += m.blk; fx(B, e.id, '+' + m.blk, 'blk'); }
  if (m.str) { addSt(e, 'str', m.str); fx(B, e.id, `力量+${m.str}`, 'st'); }
  if (m.all) alive(B).forEach(x => { addSt(x, 'str', m.all); fx(B, x.id, `力量+${m.all}`, 'st'); });
  if (m.weak) { addSt(B.p, 'weak', m.weak); fx(B, 'hero', `虚弱+${m.weak}`, 'st'); }
  if (m.vuln) { addSt(B.p, 'vuln', m.vuln); fx(B, 'hero', `易伤+${m.vuln}`, 'st'); }
  for (const k of ['weak', 'vuln']) if (e.st[k]) addSt(e, k, -1);
  if (!e.dead) { e.last = e.move; e.t++; e.move = e.d.ai(e, B, B.rng); }
}

export function result(B) {
  if (B.over) return B.over;
  if (!alive(B).length) return (B.over = 'win');
  return null;
}
