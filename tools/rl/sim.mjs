// 强化学习测试：训练一个会打牌的 AI（线性 softmax 策略 + REINFORCE），然后用它打整局，顺便找漏洞。
// 只在 GitHub Actions 上跑（.github/workflows/rl.yml）。用法：node tools/rl/sim.mjs <角色> <训练分钟数> <输出目录>
import { writeFileSync, mkdirSync } from 'fs';
const root = new URL('../../', import.meta.url).href;
const D = await import(root + 'src/data.js'), E = await import(root + 'src/engine.js');
const CH = process.argv[2] || 'hansong', MIN = +(process.argv[3] || 20), OUT = process.argv[4] || 'rl-out';
mkdirSync(OUT, { recursive: true });
const C = D.CARDS, CHAR = D.CHARS[CH];
let seed = 12345 + CH.length * 999; const rng = E.mulberry(seed);
const pick = a => a[Math.floor(rng() * a.length)];

/* —— 漏洞记录：同一类只记前几条 —— */
const BUGS = {}; const bug = (kind, msg, ctx) => { const L = (BUGS[kind] = BUGS[kind] || { n: 0, ex: [] }); L.n++; if (L.ex.length < 6) L.ex.push({ msg: String(msg).slice(0, 300), ...ctx }); };
const wrap = (kind, f, ctx) => { try { return f(); } catch (e) { bug(kind, e && e.stack ? e.stack.split('\n').slice(0, 3).join(' | ') : e, ctx()); return undefined; } };

/* —— 牌池、随身物品 —— */
const ids = Object.keys(C);
const pool = ids.filter(id => { const d = C[id]; return d.rar !== 'basic' && d.rar !== 'loot' && d.rar !== 'curse' && d.rar !== 'status' && !d.colorless && (!d.ch || d.ch === CH); });
const colorless = ids.filter(id => C[id].colorless);
const relPool = Object.values(D.RELICS).filter(r => ['c', 'u', 'r'].includes(r.rar) && (!r.ch || r.ch === CH)).map(r => r.id);
const items = Object.keys(D.ITEMS).filter(k => D.ITEMS[k].battle);
const CIDX = Object.fromEntries(ids.map((id, i) => [id, i]));

/* —— 策略：每个候选动作打一个分，softmax 选。特征 = 牌的编号（学每张牌值多少）+ 局面上下文 —— */
const NC = ids.length, NX = 24;
const W = new Float64Array(NC * 2 + NX + 16); /* [牌基础分 | 牌×危险 | 通用特征 | 角色动作] */
const feat = (B, a) => {
  const f = []; /* 稀疏：[下标, 值] */
  const inc = E.incoming(B), danger = Math.max(0, inc - B.p.block) / Math.max(1, B.R.hp), al = E.alive(B);
  if (a.t === 'card') { const d = C[a.c.id], k = CIDX[a.c.id]; f.push([k, 1], [NC + k, danger]);
    const b = NC * 2; f.push([b, d.type === 'atk' ? 1 : 0], [b + 1, d.type === 'skill' ? danger : 0], [b + 2, d.type === 'power' ? 1 / (B.turn) : 0], [b + 3, a.c.up ? 1 : 0], [b + 4, -a.cost / 3]);
    if (a.tgt) { const t = al.find(e => e.id === a.tgt); if (t) { const lo = Math.min(...al.map(e => e.hp)); f.push([b + 5, t.hp === lo ? 1 : 0], [b + 6, E.intentOf(B, t).i === 'atk' ? 1 : 0], [b + 7, t.d.elite || t.d.boss ? 1 : 0], [b + 8, t.d.intel ? 1 : 0], [b + 9, t.hp / t.max]); } } }
  else if (a.t === 'end') { const b = NC * 2; f.push([b + 10, 1], [b + 11, B.p.energy / 3], [b + 12, danger]); }
  else if (a.t === 'act') { f.push([NC * 2 + NX + (a.k % 16), 1]); }
  return f;
};
const score = f => f.reduce((s, [i, v]) => s + W[i] * v, 0);
function candidates(B) {
  const out = [{ t: 'end' }], al = E.alive(B);
  B.hand.forEach((c, i) => { if (E.cantPlay(B, c)) return; const cost = E.cardCost(B, c);
    if (E.needTarget(c)) al.forEach(e => out.push({ t: 'card', i, c, cost, tgt: e.id })); else out.push({ t: 'card', i, c, cost, tgt: al[0] && al[0].id }); });
  for (const a of E.actions(B) || []) if (!a.dis) out.push({ t: 'act', id: a.id, k: [...String(a.id)].reduce((s, ch) => s + ch.charCodeAt(0), 0) });
  return out;
}
function choose(B, greedy) {
  const cs = candidates(B), fs = cs.map(a => feat(B, a)), sc = fs.map(score);
  const mx = Math.max(...sc), ex = sc.map(s => Math.exp((s - mx) / (greedy ? 0.15 : 1))), Z = ex.reduce((a, b) => a + b, 0);
  let r = rng() * Z, k = 0; for (; k < ex.length - 1; k++) { r -= ex[k]; if (r <= 0) break; }
  return { a: cs[k], probs: ex.map(x => x / Z), fs, k };
}

/* —— 打一场 —— */
const snapshot = B => ({ hp: B.R.hp, en: B.en.map(e => [e.key, e.hp, e.max]), hand: B.hand.map(c => c.id), turn: B.turn });
function fight(R, enc, kind, opt = {}) {
  const ctx = () => ({ char: CH, enc: enc.join(','), kind, deck: R.deck.map(c => c.id + (c.up ? '+' : '')).join(' '), relics: R.relics.join(' ') });
  const B = wrap('开战报错', () => E.startBattle(R, enc, kind, E.mulberry((rng() * 2 ** 31) | 0), { strong: opt.strong, escort: opt.escort, autoScry: true }), ctx);
  if (!B) return null;
  const traj = [], hp0 = R.hp; let maxTurnDmg = 0, plays = 0, itemUsed = 0;
  for (let t = 0; t < 60; t++) {
    if (E.result(B)) break;
    const hpSum = () => B.en.filter(e => !e.d.nohp && !e.fled).reduce((s, e) => s + Math.max(0, e.hp), 0), enHp0 = hpSum(); let n = 0;
    while (!E.result(B)) {
      if (!itemUsed && R.items.length && t === 1) { itemUsed = 1; const it = D.ITEMS[R.items.pop()]; wrap('用品报错', () => E.useItem(B, it), () => ({ ...ctx(), item: it.name })); }
      const ch = choose(B, opt.greedy); traj.push(ch);
      if (ch.a.t === 'end') break;
      if (++n > 60) { bug('一回合出牌过多（可能无限连锁）', `第 ${B.turn} 回合打了 60 张以上`, { ...ctx(), hand: B.hand.map(c => c.id).join(' '), energy: B.p.energy }); break; }
      const before = JSON.stringify([B.hand.length, B.p.energy, B.en.map(e => e.hp + '/' + e.block + '/' + JSON.stringify(e.st)), B.p.block, B.R.hp, B.draw.length, B.disc.length, B.exh.length, JSON.stringify(B.p.st), JSON.stringify(B.p.pw)]);
      if (ch.a.t === 'card') { const id = ch.a.c.id; plays++;
        wrap('出牌报错', () => E.playCard(B, ch.a.i, ch.a.tgt), () => ({ ...ctx(), card: id, ...snapshot(B) }));
        const after = JSON.stringify([B.hand.length, B.p.energy, B.en.map(e => e.hp + '/' + e.block + '/' + JSON.stringify(e.st)), B.p.block, B.R.hp, B.draw.length, B.disc.length, B.exh.length, JSON.stringify(B.p.st), JSON.stringify(B.p.pw)]);
        if (before === after) bug('打出去什么都没发生', `「${C[id].name}」(${id})`, { ...ctx(), card: id });
      } else if (ch.a.t === 'act') wrap('角色动作报错', () => E.act(B, ch.a.id), () => ({ ...ctx(), action: ch.a.id }));
      if (B.p.energy > 30 || B.hand.length > E.HAND_MAX + 2) bug('数值异常（能量/手牌）', `能量 ${B.p.energy}，手牌 ${B.hand.length}`, ctx());
      if (Number.isNaN(B.R.hp) || B.en.some(e => Number.isNaN(e.hp) || Number.isNaN(e.block))) bug('出现 NaN', '生命或格挡变成 NaN', { ...ctx(), ...snapshot(B) });
    }
    const dealt = enHp0 - hpSum(); maxTurnDmg = Math.max(maxTurnDmg, dealt);
    if (E.result(B)) break;
    wrap('回合结束报错', () => E.endPlayerTurn(B), ctx);
    for (const e of E.alive(B)) { wrap('敌人行动报错', () => { E.intentOf(B, e); E.enemyAct(B, e); }, () => ({ ...ctx(), enemy: e.key, move: e.move })); if (E.result(B)) break; }
    if (E.result(B)) break;
    wrap('回合开始报错', () => E.startTurn(B), ctx);
  }
  const res = E.result(B) || 'stall';
  if (res === 'stall') bug('60 回合打不完（卡死或打不动）', enc.join(','), { ...ctx(), ...snapshot(B) });
  wrap('结束战斗报错', () => E.endBattle(B, res === 'win'), ctx);
  if (res === 'win' && kind === 'boss' && B.turn <= 2) bug('首领两回合内被秒（可能有过强组合）', enc.join(','), { ...ctx(), turns: B.turn, maxTurnDmg });
  if (maxTurnDmg >= 250) bug('一回合打出 250 以上伤害（可能有过强组合）', `${maxTurnDmg}`, ctx());
  return { res, turns: B.turn, lost: hp0 - R.hp, traj, maxTurnDmg, plays };
}

/* —— 学习：REINFORCE，回报 = 赢/输 + 剩余生命比例 —— */
let baseline = 0; const LR = 0.03;
function learn(out, R) {
  const G = (out.res === 'win' ? 1 : -1) + 0.6 * (R.hp / R.maxHp) - 0.02 * out.turns; baseline = 0.98 * baseline + 0.02 * G; const adv = G - baseline;
  for (const s of out.traj) { /* ∇log π = φ(a) − Σ p φ */
    s.fs[s.k].forEach(([i, v]) => { W[i] += LR * adv * v / Math.sqrt(out.traj.length); });
    s.fs.forEach((f, j) => f.forEach(([i, v]) => { W[i] -= LR * adv * s.probs[j] * v / Math.sqrt(out.traj.length); })); }
  return G;
}

/* —— 一局的样子：三章，每章 ~11 场（普通、精英、首领），中间拿牌、拿随身物品、休息；第三章打完有真结局的参谋 —— */
const newR = () => ({ char: CH, hp: CHAR.hp, maxHp: CHAR.hp, relics: [CHAR.startRelic], items: [], deck: CHAR.starter.map((id, i) => ({ id, up: 0, uid: i })), temp: 10, awe: 0, flags: [], uid: 100 });
const cardVal = id => W[CIDX[id]] + 0.3 * W[NC + CIDX[id]];
function reward(R, greedy, elite) {
  const offer = [pick(pool), pick(pool), pick(pool)]; if (rng() < 0.1) offer.push(pick(colorless));
  const best = offer.reduce((a, b) => cardVal(a) > cardVal(b) ? a : b);
  if (!greedy && rng() < 0.3) R.deck.push({ id: pick(offer), up: 0, uid: R.uid++ }); else if (cardVal(best) > -0.3 || R.deck.length < 14) R.deck.push({ id: best, up: 0, uid: R.uid++ });
  if (elite) R.relics.push(pick(relPool));
  if (rng() < 0.35 && R.items.length < 3) R.items.push(pick(items));
}
function run(greedy, stats) {
  const R = newR(); const res = { act: 0, fights: 0, died: null };
  for (let ch = 1; ch <= 3; ch++) {
    const P = D.CHAPTERS[ch - 1]; R.act = ch; if (ch === 3) R.san = 10; if (ch === 2) R.sus = 0;
    const encOf = (k, seg) => pick((P.segEnc ? P.segEnc[Math.min(2, seg)] : P.enc)[k]);
    const plan = ['easy', 'easy', 'hard', 'hard', 'elite', 'rest', 'hard', 'strong', 'hard', 'elite', 'rest', 'boss'];
    for (let s = 0; s < plan.length; s++) { const k = plan[s], seg = Math.floor(s / 4);
      if (k === 'rest') { R.hp = Math.min(R.maxHp, R.hp + Math.floor(R.maxHp * 0.3)); const up = R.deck.filter(c => !c.up); if (up.length) up.reduce((a, b) => cardVal(a.id) > cardVal(b.id) ? a : b).up = 1; continue; }
      const enc = k === 'boss' ? pick(P.enc.boss) : k === 'strong' ? encOf('elite', seg) : encOf(k, seg);
      const kind = k === 'boss' ? 'boss' : k === 'elite' || k === 'strong' ? 'elite' : 'fight';
      const out = fight(R, enc, kind, { greedy, strong: k === 'strong', escort: P.escort }); if (!out) continue;
      res.fights++; const key = `${ch}:${kind}:${enc.join('+')}`; const st = (stats[key] = stats[key] || { n: 0, win: 0, lost: 0, turns: 0 }); st.n++; st.lost += out.lost; st.turns += out.turns; if (out.res === 'win') st.win++;
      if (!greedy) learn(out, R);
      if (out.res !== 'win') { res.died = key; res.act = ch; return res; }
      reward(R, greedy, kind !== 'fight');
    }
    if (ch < 3) { R.hp = Math.min(R.maxHp, R.hp + Math.floor(R.maxHp * 0.5)); R.relics.push(pick(relPool)); }
    res.act = ch;
  }
  /* 真结局：参谋 */
  const out = fight(R, ['staff'], 'boss', { greedy }); const st = (stats['真结局:staff'] = stats['真结局:staff'] || { n: 0, win: 0, lost: 0, turns: 0 }); st.n++; if (out) { st.lost += out.lost; st.turns += out.turns; if (out.res === 'win') st.win++; if (!greedy) learn(out, R); res.te = out.res; }
  return res;
}

/* —— 训练 → 评估 —— */
const t0 = Date.now(), trainMs = MIN * 60e3 * 0.75; let ep = 0; const curve = [];
const trainStats = {};
while (Date.now() - t0 < trainMs) { const r = run(false, trainStats); ep++; if (ep % 50 === 0) curve.push([ep, r.act]); }
const evalStats = {}, runs = []; const tE = Date.now();
while (Date.now() - tE < MIN * 60e3 * 0.25 && runs.length < 400) runs.push(run(true, evalStats));
const n = runs.length, reach = k => runs.filter(r => r.act >= k && !(r.act === k && r.died)).length / n;
const deaths = {}; runs.forEach(r => { if (r.died) deaths[r.died] = (deaths[r.died] || 0) + 1; });
const topCards = ids.filter(id => (!C[id].ch || C[id].ch === CH) && C[id].rar !== 'curse' && C[id].rar !== 'status').map(id => [C[id].name, +cardVal(id).toFixed(2)]).sort((a, b) => b[1] - a[1]);
const report = { char: CH, trainEpisodes: ep, evalRuns: n, clear: { ch1: reach(1), ch2: reach(2), ch3: reach(3), trueEnd: runs.filter(r => r.te === 'win').length / n },
  deaths: Object.entries(deaths).sort((a, b) => b[1] - a[1]).slice(0, 12),
  fights: Object.fromEntries(Object.entries(evalStats).map(([k, s]) => [k, { n: s.n, win: +(s.win / s.n).toFixed(2), lost: +(s.lost / s.n).toFixed(1), turns: +(s.turns / s.n).toFixed(1) }])),
  bestCards: topCards.slice(0, 10), worstCards: topCards.slice(-10), bugs: BUGS };
writeFileSync(`${OUT}/${CH}.json`, JSON.stringify(report, null, 1));
console.log(CH, 'episodes', ep, 'eval', n, JSON.stringify(report.clear), 'bug kinds', Object.keys(BUGS).length);
