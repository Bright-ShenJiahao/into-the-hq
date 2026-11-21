// 整局平衡模拟：战斗只调用游戏引擎；事件收益采用简化模型。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CARDS, CHARS, CHAPTERS, RELICS, ITEMS, ITEM_SLOTS } from '../../src/data.js';
import * as E from '../../src/engine.js';

export const ROOT = fileURLToPath(new URL('../../', import.meta.url));
export const CHARACTERS = Object.keys(CHARS);
// 所有出牌、选牌、路线决策的可调数值统一放在这里。
export const W = Object.freeze({
  powerEarly: 11, powerLate: 3, earlyTurns: 3, attack: 5, damage: .35, lethal: 24,
  blockNeeded: 14, blockIdle: .4, blockAmount: .4, skill: 3, zero: 4, cost: .4,
  ritual: 100, resource: 4, empty: 12, reload: 20, reloadNear: 9, lowAmmo: 2,
  rage: 12, rageDanger: 2, trim: 12, trimWait: -6, disrupt: 18,
  knifeKeep: 3, knifeLow: 2, knifeFull: 5, charge: 4, fort: 3, scry: 4, clue: 5,
  bloodSafe: .5, bloodRisk: 12, rest: .55, itemHp: .65, itemThreat: 8,
  tierC: 2, tierU: 3, tierR: 4, tierLoot: 2, personal: .5, archetype: 3, otherArch: .4,
  needBlock: 1.5, needAttack: 1.5, blockShare: .3, attackShare: .4, duplicate: 1.3,
  powerLimit: 3, powerPenalty: 2, skip: 1.8, deckMax: 24, deckPenalty: .65,
  routeIntel: 18, routeRest: 9, routeTreasure: 5, routeEvent: 2, routeShop: 3, routeElite: -2,
  foodReserve: 2, relicValue: 8, relicEnergy: 6, relicDraw: 3, relicDefense: 3,
  relicHidden: 5, relicWeak: 4, relicReload: 3, relicPersonal: 2,
});
const ARCH = { hansong: [['狙'], ['冲', '手']], chenmo: [['刀'], ['血']], tian: [['怒'], ['守']], zhao: [['爆'], ['工']], shen: [['侦'], ['伏']] };
const text = c => CARDS[c.id].desc(c.up || 0, x => x);
const isBlock = c => /获得\s*\d+\s*格挡|工事|反击/.test(text(c));
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const sum = a => a.reduce((x, y) => x + y, 0);
const choose = (a, rng) => a.length ? a[Math.floor(rng() * a.length)] : null;
const weighted = (entries, rng) => { let x = rng() * sum(entries.map(e => e[1])); for (const [v, n] of entries) { x -= n; if (x <= 0) return v; } return entries.at(-1)?.[0]; };

export function loadWeights(char, overrides) {
  let saved = {};
  const filename = path.join(ROOT, 'tools/bot/weights.json');
  if (fs.existsSync(filename)) saved = JSON.parse(fs.readFileSync(filename, 'utf8'));
  let supplied = overrides;
  if (!supplied && process.env.WEIGHTS) {
    supplied = JSON.parse(process.env.WEIGHTS.trim().startsWith('{') ? process.env.WEIGHTS : fs.readFileSync(process.env.WEIGHTS, 'utf8'));
  }
  const out = { ...W, ...(saved[char] || {}), ...((supplied?.[char]) || supplied || {}) };
  for (const k of Object.keys(W)) if (!Number.isFinite(out[k])) throw new Error(`权重 ${k} 必须是有限数值`);
  return Object.fromEntries(Object.keys(W).map(k => [k, out[k]]));
}

export function smartScore(c, R, w, build) {
  const d = CARDS[c.id], deck = R.deck;
  let s = ({ c: w.tierC, u: w.tierU, r: w.tierR, loot: w.tierLoot, basic: 0 })[d.rar] ?? -w.empty;
  if (d.ch) s += w.personal;
  const arch = ARCH[R.char];
  if (arch[build].includes(d.sch)) s += w.archetype;
  else if (arch.some(a => a.includes(d.sch))) s += w.otherArch;
  if (isBlock(c) && deck.filter(isBlock).length < deck.length * w.blockShare) s += w.needBlock;
  if (d.type === 'atk' && deck.filter(x => CARDS[x.id].type === 'atk').length < deck.length * w.attackShare) s += w.needAttack;
  if (d.type === 'power' && deck.filter(x => CARDS[x.id].type === 'power').length >= w.powerLimit) s -= w.powerPenalty;
  s -= deck.filter(x => x.id === c.id).length * w.duplicate;
  s -= Math.max(0, deck.length - w.deckMax) * w.deckPenalty;
  return s;
}

// 只用于决策的伤害估值，不结算任何战斗效果。
function estimate(B, c) {
  const d = CARDS[c.id]; if (d.type !== 'atk') return 0;
  if (d.gun) {
    if (!B.ammo) return 5;
    const sh = d.sh(c.up, B), n = sh.mag ? B.ammo : Math.min(B.ammo, sh.n || 1);
    return n * sh.d;
  }
  const tx = text(c), m = tx.match(/(?:造成|每把|每发)\s*(\d+)\s*伤害/);
  return m ? +m[1] : 0;
}

function cardScore(B, c, w, lethal) {
  const d = CARDS[c.id], tx = text(c), cost = E.cardCost(B, c);
  const need = Math.max(0, E.incoming(B) - B.p.block - B.p.fort);
  if (d.ritual) return B.ritual && E.RITUAL[B.ritual.step] === c.id ? w.ritual : -w.ritual;
  let s = d.type === 'power' ? (B.turn <= w.earlyTurns ? w.powerEarly : w.powerLate) : d.type === 'atk' ? w.attack + estimate(B, c) * w.damage + (lethal ? w.lethal : 0) : w.skill;
  if (isBlock(c) && !lethal) s += need > 0 ? w.blockNeeded + Math.min(need, +(tx.match(/获得\s*(\d+)\s*格挡/)?.[1] || 0)) * w.blockAmount : w.blockIdle;
  if (cost === 0) s += w.zero;
  s -= cost * w.cost;
  const p = B.p;
  if (B.R.char === 'hansong' && d.gun && !B.ammo) s -= w.empty;
  if (B.R.char === 'chenmo') {
    if (/得到|获得/.test(tx) && /飞刀/.test(tx)) s += p.knife < w.knifeLow ? w.resource : p.knife >= w.knifeFull ? -w.resource : w.resource / 2;
    if (/扔出/.test(tx)) s += p.knife ? (B.build === 0 && !lethal ? -w.knifeKeep : w.resource) : -w.empty;
    if (/流血/.test(tx) && B.build === 1) s += w.resource;
  }
  if (B.R.char === 'tian') {
    if (/血气/.test(tx) && !p.rage) s += w.resource;
    if (/【怒】/.test(tx) && p.rage) s += w.resource;
    if (/失去\s*\d+\s*生命/.test(tx) && B.R.hp < B.R.maxHp * w.bloodSafe) s -= w.bloodRisk;
  }
  if (B.R.char === 'zhao') {
    if (/炸药包/.test(tx)) s += w.charge;
    if (/工事/.test(tx)) s += p.fort < E.incoming(B) ? w.fort : w.blockIdle;
    if (/引信|引爆/.test(tx) && !E.alive(B).some(e => e.charges?.length)) s -= w.empty;
  }
  if (B.R.char === 'shen') {
    if (/侦明/.test(tx)) s += w.scry;
    if (/情报 \+/.test(tx)) s += w.resource;
    if (/迎击/.test(tx) && need > 0) s += w.resource;
  }
  return s;
}

function resolveScry(B, w) {
  // 线索先弃以触发效果；普通防御在无威胁时弃掉，保留仪式。
  for (let guard = 0; B.scryQ.length; guard++) {
    if (guard >= 100) throw new Error('侦明队列未收敛');
    const top = B.draw.slice(-B.scryQ[0]);
    E.resolveScry(B, top.filter(c => !CARDS[c.id].ritual && (CARDS[c.id].clue && w.clue > 0 || CARDS[c.id].unplay || c.id === 'defend' && E.incoming(B) <= B.p.block + B.p.fort)).map(c => c.uid));
  }
}

function actionScore(B, a, w) {
  if (a.dis) return -Infinity;
  const need = Math.max(0, E.incoming(B) - B.p.block - B.p.fort);
  if (a.id === 'reload') {
    if (!B.hand.some(c => CARDS[c.id].gun)) return -Infinity;
    return B.ammo === 0 ? w.reload : B.ammo <= w.lowAmmo && !B.hand.some(c => CARDS[c.id].last && !E.cantPlay(B, c)) ? w.reloadNear : -Infinity;
  }
  if (a.id === 'rage') return w.rage - need * w.rageDanger / Math.max(1, B.R.hp);
  if (a.id === 'trim') return E.alive(B).some(e => e.charges?.some(c => c.fuse <= 1) && (e.d.intel || need > 0)) ? w.trim : w.trimWait;
  if (a.id === 'disrupt') return need > 0 ? w.disrupt : -Infinity;
  return -Infinity;
}

export function botTurn(B, w, context = () => {}) {
  let played = 0, steps = 0;
  while (!E.result(B) && played < 25 && steps++ < 100) {
    resolveScry(B, w);
    // 背包用品按条件使用；用品不计入每回合 25 张牌的上限。
    const itIndex = B.R.items.findIndex(id => {
      const it = ITEMS[id]; if (!it.battle) return false;
      const tx = it.desc;
      if (/回复/.test(tx)) return B.R.hp < B.R.maxHp * w.itemHp;
      if (/格挡|虚弱/.test(tx)) return E.incoming(B) - B.p.block - B.p.fort >= w.itemThreat;
      if (/驱散黑暗/.test(tx)) return !B.lit && B.R.act === 3;
      return B.turn <= w.earlyTurns;
    });
    if (itIndex >= 0) { const id = B.R.items[itIndex]; context({ item: id }); E.useItem(B, ITEMS[id]); B.R.items.splice(itIndex, 1); continue; }
    const opts = B.hand.map((c, i) => ({ c, i })).filter(o => !E.cantPlay(B, o.c));
    // 按费用装入本回合预算，避免把付不起费用的整手伤害误判为斩杀。
    let budget = B.p.energy, damage = 0;
    for (const o of opts.filter(o => CARDS[o.c.id].type === 'atk').sort((a, b) => E.cardCost(B, a.c) - E.cardCost(B, b.c))) {
      const cost = E.cardCost(B, o.c); if (cost <= budget) { damage += estimate(B, o.c); budget -= cost; }
    }
    const lethal = damage >= sum(E.alive(B).map(e => e.hp + e.block)) && !E.alive(B).some(e => e.d.immune);
    const candidates = opts.map(o => ({ ...o, score: cardScore(B, o.c, w, lethal) }));
    candidates.push(...E.actions(B).map(a => ({ action: a.id, score: actionScore(B, a, w) })));
    candidates.sort((a, b) => b.score - a.score);
    const best = candidates[0]; if (!best || best.score <= 0) break;
    if (best.action) { context({ action: best.action }); if (!E.act(B, best.action)) throw new Error('可用按钮执行失败：' + best.action); }
    else {
      const target = E.alive(B).sort((a, b) => Number(!!b.d.intel) - Number(!!a.d.intel) || a.hp - b.hp)[0];
      context({ card: best.c.id });
      if (!E.playCard(B, best.i, target?.id)) throw new Error('可用卡牌执行失败：' + best.c.id);
      played++;
    }
    if (B.forceEnd) break;
  }
  resolveScry(B, w);
  return played;
}

// 地图拓扑、固定层、相邻特殊节点限制与 game.js 的 genMap 对齐。
export function genMap(C, rng) {
  const cols = C.cols || 5, g = Array.from({ length: C.rows }, () => Array(cols).fill(null));
  const ri = (a, b) => a + Math.floor(rng() * (b - a + 1));
  const node = (r, c) => g[r][c] || (g[r][c] = { r, c, next: [], type: null, jx: ri(-14, 14), jy: ri(-8, 8) });
  const crosses = (r, c, n) => g[r].some(o => o && o.c !== c && o.next.some(n2 => o.c < c && n2 > n || o.c > c && n2 < n));
  let first = -1;
  for (let p = 0; p < 6; p++) {
    let c = ri(0, cols - 1); if (p === 1) while (c === first) c = ri(0, cols - 1); if (!p) first = c;
    for (let r = 0; r < C.rows; r++) {
      const nd = node(r, c); if (r === C.rows - 1) break;
      // 用带种子的洗牌代替随机排序，保持相同的连线候选和不交叉限制。
      const cand = E.shuffle([c - 1, c, c + 1], rng).filter(n => n >= 0 && n < cols && !crosses(r, c, n));
      const n = cand[0] ?? c; if (!nd.next.includes(n)) nd.next.push(n); c = n;
    }
  }
  const special = ['elite', 'rest', 'shop', 'treasure'];
  for (let r = 0; r < C.rows; r++) for (const nd of g[r]) {
    if (!nd) continue;
    if (C.fixed[r]) { nd.type = C.fixed[r]; continue; }
    const parents = g[r - 1]?.filter(o => o && o.next.includes(nd.c)).map(o => o.type) || [];
    const ok = Object.entries(C.nodes).filter(([t]) => !((t === 'elite' || t === 'rest') && r < C.earliest) && t !== C.fixed[r + 1] && !(special.includes(t) && parents.includes(t)));
    nd.type = weighted(ok, rng) || 'fight';
  }
  const all = g.flat().filter(Boolean);
  if (!all.some(n => n.type === 'elite')) { const f = all.filter(n => n.type === 'fight' && n.r >= C.earliest && !C.fixed[n.r]); const nd = choose(f, rng); if (nd) nd.type = 'elite'; }
  const elite = choose(all.filter(n => n.type === 'elite'), rng); if (elite) elite.strong = true;
  return g;
}

function selectNode(g, choices, R, w, rng) {
  if (R.relics.some(id => RELICS[id].hideMap)) return choose(choices, rng);
  const memo = new Map();
  const futureIntel = n => { if (memo.has(n)) return memo.get(n); const v = n.strong ? 1 : Math.max(0, ...n.next.map(c => futureIntel(g[n.r + 1][c]))); memo.set(n, v); return v; };
  const value = n => futureIntel(n) * w.routeIntel + (n.type === 'rest' ? (1 - R.hp / R.maxHp) * w.routeRest : n.type === 'treasure' ? w.routeTreasure : n.type === 'event' ? w.routeEvent : n.type === 'shop' ? (R.food > w.foodReserve ? w.routeShop : 0) : n.type === 'elite' ? w.routeElite : 0);
  return [...choices].sort((a, b) => value(b) - value(a))[0];
}

function economy(R, rng, w, build) {
  const mk = id => ({ id, up: 0, uid: R.uid++ });
  const addCard = ids => {
    const offer = ids.filter(Boolean).map(id => mk(id)).sort((a, b) => smartScore(b, R, w, build) - smartScore(a, R, w, build));
    if (offer.length && smartScore(offer[0], R, w, build) > w.skip) R.deck.push(offer[0]);
  };
  const cards = elite => {
    const pool = Object.values(CARDS).filter(d => d.rar !== 'basic' && d.rar !== 'loot' && !d.colorless && (!d.ch || d.ch === R.char));
    const out = [];
    for (let k = 0; out.length < 3 && k < 200; k++) {
      const x = rng(), rar = elite === 'boss' ? 'r' : x < (elite ? .2 : .08) ? 'r' : x < (elite ? .6 : .42) ? 'u' : 'c';
      const d = choose(pool.filter(d => d.rar === rar && !out.includes(d.id)), rng); if (d) out.push(d.id);
    }
    return out;
  };
  const relPool = rar => Object.values(RELICS).filter(r => r.rar === rar && (!r.ch || r.ch === R.char) && !R.relics.includes(r.id));
  const relic = (weights = { c: 50, u: 33, r: 17 }, su = true) => {
    for (let i = 0; i < 20; i++) { const p = relPool(weighted(Object.entries(weights), rng)).filter(r => su || !r.su); if (p.length) return choose(p, rng).id; }
    return choose(['c', 'u', 'r'].flatMap(relPool).filter(r => su || !r.su), rng)?.id;
  };
  const gainRelic = id => { if (id && !R.relics.includes(id)) R.relics.push(id); };
  const item = () => choose(Object.keys(ITEMS).filter(id => !ITEMS[id].act || ITEMS[id].act === R.act), rng);
  const gainItem = id => { if (id && R.items.length < ITEM_SLOTS) R.items.push(id); };
  const relicScore = id => {
    const r = RELICS[id]; return w.relicValue + (r.energy ? w.relicEnergy : 0) + (r.draw ? w.relicDraw : 0) + (r.battleEnd || r.lethal || r.turnStart ? w.relicDefense : 0) + (r.ch ? w.relicPersonal : 0) - (r.hideMap ? w.relicHidden : 0) - (id === 'saber' ? w.relicWeak : 0) - (r.reloadCost ? w.relicReload : 0);
  };
  const heal = n => { R.hp = Math.min(R.maxHp, R.hp + n); };
  const mapItems = () => {
    for (const id of [...R.items]) {
      const use = /^(medkit|styptic|shaodaozi)$/.test(id) ? R.hp < R.maxHp * w.itemHp : /^(beef|jerky)$/.test(id) ? R.food <= w.foodReserve : /^(badger|matchbox)$/.test(id) ? R.act === 1 && R.temp < 3 : /^(fakeid|newspaper)$/.test(id) ? R.act === 2 && R.sus >= 5 : id === 'lantern' ? R.act === 3 && R.san <= 8 : false;
      if (use && ITEMS[id].map) { ITEMS[id].map(R, { heal, food: n => R.food += n, temp: n => R.temp = clamp(R.temp + n, 0, 10), sus: n => R.sus = clamp(R.sus + n, 0, 10), san: n => R.san = clamp(R.san + n, 0, 10) }); R.items.splice(R.items.indexOf(id), 1); }
    }
  };
  return { cards, addCard, relic, gainRelic, item, gainItem, heal, mapItems,
    bossRelic() { const opts = E.shuffle(relPool('boss'), rng).slice(0, 3).map(r => r.id).sort((a, b) => relicScore(b) - relicScore(a)); if (opts.length && relicScore(opts[0]) > 0) gainRelic(opts[0]); },
    reward(B) {
      if (B.strong && B.intelGot) R.intel++;
      R.relics.forEach(id => RELICS[id].fightWon?.(R));
      if (R.deck.some(c => c.id === 'it_curse')) R.itN = (R.itN || 0) + 1;
      if (R.act === 2 && B.kind !== 'boss') R.sus = clamp(R.sus + (B.kind === 'elite' ? 2 : 1) + Math.floor((B.noise || 0) / 6), 0, 10);
      if (B.kind === 'boss') { R.food += 3; addCard(cards('boss')); this.bossRelic(); return; }
      R.food += B.kind === 'elite' ? 2 : 1;
      const loot = [];
      for (const e of B.en) if (!e.fled && e.d.loot && rng() < e.d.lootP && !loot.includes(e.d.loot)) loot.push(e.d.loot);
      if (B.kind === 'elite') gainRelic(relic(undefined, false));
      if (rng() < (B.kind === 'elite' ? .5 : .4)) gainItem(item());
      addCard(cards(B.kind === 'elite')); for (const id of loot) addCard([id]);
    },
    rest() {
      R.temp = 10; if (R.act === 2) R.sus = 0; if (R.act === 3) R.san = Math.min(10, R.san + 3);
      const up = R.deck.filter(c => !c.up).sort((a, b) => smartScore(b, R, w, build) - smartScore(a, R, w, build));
      if (R.hp / R.maxHp < w.rest || !up.length) heal(Math.floor(R.maxHp * .3) + sum(R.relics.map(id => RELICS[id].restHeal?.(R) || 0)));
      else up[0].up = 1;
    },
    shop() {
      // 商品生成顺序、普通牌 2 / 无色牌 3 / 用品 2 / 随身物品 5 / 删牌 3 与游戏一致。
      const stock = cards(false).map(id => ({ id, price: 2 }));
      const x = rng(), rar = x < .15 ? 'r' : x < .5 ? 'u' : 'c';
      const colorless = choose(Object.values(CARDS).filter(d => d.colorless && d.rar === rar), rng); if (colorless) stock.push({ id: colorless.id, price: 3 });
      const supply = item(), rel = relic({ c: 40, u: 40, r: 20 });
      if (rel && R.food >= 5 + w.foodReserve && relicScore(rel) > 0) { R.food -= 5; gainRelic(rel); }
      for (const x of stock.sort((a, b) => smartScore({ id: b.id }, R, w, build) - smartScore({ id: a.id }, R, w, build))) {
        if (R.food < x.price + w.foodReserve || smartScore({ id: x.id }, R, w, build) <= w.skip) continue;
        const n = R.deck.length; addCard([x.id]); if (R.deck.length > n) R.food -= x.price;
      }
      const rm = R.deck.filter(c => !CARDS[c.id].noRemove).sort((a, b) => smartScore(a, R, w, build) - smartScore(b, R, w, build))[0];
      if (rm && R.deck.length > 5 && R.food >= 3 + w.foodReserve && (CARDS[rm.id].unplay || R.deck.length > w.deckMax)) { R.deck.splice(R.deck.indexOf(rm), 1); R.food -= 3; }
      if (R.food >= 2 + w.foodReserve && R.items.length < ITEM_SLOTS) { R.food -= 2; gainItem(supply); }
    },
    event() {
      // 用户允许的简化：四种正向收益等概率；不模拟剧情选择与人物拼图。
      const k = Math.floor(rng() * 4);
      if (k === 0) heal(8); else if (k === 1) R.food += 2; else if (k === 2) addCard(cards(false)); else gainRelic(relic());
    },
  };
}

export function runGame(char, seed, overrides) {
  if (!CHARS[char]) throw new Error('未知角色：' + char);
  const w = loadWeights(char, overrides), rng = E.mulberry(seed), nativeRandom = Math.random;
  // content 中少量 pick() 默认用 Math.random；整局同步执行并在 finally 还原。
  Math.random = rng;
  const C0 = CHARS[char], build = (seed >>> 0) % 2;
  const R = { char, hp: C0.hp, maxHp: C0.hp, deck: C0.starter.map((id, i) => ({ id, up: 0, uid: i + 1 })), uid: 100, relics: [C0.startRelic], items: [], intel: 0, temp: 10, food: 6, steps: 0, fights: 0, flags: [], awe: 0, act: 1 };
  const out = { char, seed: seed >>> 0, build, chapters: [false, false, false], trueEnd: false, trueAttempt: false, timeout: false, fights: [], route: [], error: null, death: null };
  const eco = economy(R, rng, w, build);
  let B, stage = '初始化', detail = {};
  const context = x => { detail = x; };
  const battle = (keys, kind, strong, escort) => {
    stage = '战斗初始化'; detail = { enemies: keys }; B = undefined;
    B = E.startBattle(R, keys, kind, E.mulberry(Math.floor(rng() * 2 ** 31)), { strong, escort, autoScry: false }); B.build = build;
    for (let turn = 1; turn <= 60 && !E.result(B); turn++) {
      stage = '机器人出牌'; botTurn(B, w, context);
      if (E.result(B)) break;
      stage = '回合结束'; detail = {}; E.endPlayerTurn(B);
      if (E.result(B)) break;
      for (const e of E.alive(B)) { stage = '敌人行动'; detail = { enemy: e.key, move: e.move }; E.enemyAct(B, e); if (E.result(B)) break; }
      if (E.result(B)) break;
      if (turn < 60) { stage = '回合开始'; detail = {}; E.startTurn(B); }
      if (!Number.isFinite(R.hp) || B.en.some(e => !Number.isFinite(e.hp) || !Number.isFinite(e.block))) throw new Error('生命或格挡出现非有限数值');
      B.fx = []; B.msgs = [];
    }
    const result = E.result(B) || 'timeout', encounter = `${R.act}:${kind}${strong ? '加强' : ''}:${keys.join('+')}`;
    E.endBattle(B, result === 'win');
    out.fights.push({ encounter, act: R.act, kind, enemies: keys, result, turns: B.turn, hp: R.hp });
    if (result !== 'win') { out.death = encounter; out.timeout = result === 'timeout'; return false; }
    stage = '战后奖励'; detail = {};
    if (!keys.includes('staff')) eco.reward(B);
    return true;
  };
  try {
    chapter: for (const C of CHAPTERS) {
      R.act = C.id; R.fights = 0;
      if (C.id > 1) { eco.heal(Math.floor(R.maxHp * .5)); R.food += 3; R.temp = 10; R.sus = 0; R.san = 10; R.lure = 0; }
      stage = '地图生成'; const g = genMap(C, rng), boss = choose(C.enc.boss, rng); let choices = g[0].filter(Boolean);
      for (let r = 0; r < C.rows; r++) {
        stage = '地图节点'; detail = {}; eco.mapItems();
        const nd = selectNode(g, choices, R, w, rng), seg = C.seg ? C.seg(r) : 0;
        out.route.push({ act: C.id, r, c: nd.c, type: nd.type, strong: !!nd.strong });
        R.steps++; if (R.steps % 2 === 0) { if (R.food > 0) R.food--; else R.hp = Math.max(1, R.hp - 3); }
        const losses = R.relics.filter(id => RELICS[id].walkTemp).map(id => RELICS[id].walkTemp(R));
        R.temp = C.res ? 10 : Math.max(0, R.temp - (losses.length ? Math.min(...losses) : 1));
        if (C.res === 'san' && seg >= 2) R.san = Math.max(0, R.san - 1);
        let kind = nd.type, keys, strong = !!nd.strong;
        if (C.res === 'sus' && R.sus >= 10 && C.enc.hunt) { R.sus = 5; keys = choose(C.enc.hunt, rng); kind = 'fight'; strong = false; }
        else if (kind === 'fight' || kind === 'elite') {
          const enc = C.segEnc ? C.segEnc[seg] : C.enc;
          keys = [...choose(kind === 'elite' ? enc.elite : R.fights < C.easyFights ? enc.easy : enc.hard, rng)];
          if (kind === 'fight') R.fights++;
          if (C.res === 'san') { if (R.lure > 0 && keys.length < 4) { R.lure--; keys.push(seg >= 2 ? 'shadow' : 'inf'); } if (R.san <= 0 && keys.length < 4) keys.push('shadow'); }
          if (C.res === 'sus' && R.sus >= 5 && keys.length < (strong ? 3 : 4)) keys.push('patrol');
        }
        if (keys) { if (!battle(keys, kind, strong, C.escort)) break chapter; }
        else if (kind === 'rest') eco.rest(); else if (kind === 'shop') eco.shop(); else if (kind === 'treasure') eco.gainRelic(eco.relic()); else eco.event();
        choices = nd.next.map(c => g[r + 1][c]);
      }
      // 首领入口同样走一格；这一格不触发搜捕或普通节点事件。
      eco.mapItems(); R.steps++; if (R.steps % 2 === 0) { if (R.food > 0) R.food--; else R.hp = Math.max(1, R.hp - 3); }
      if (!C.res) { const loss = R.relics.filter(id => RELICS[id].walkTemp).map(id => RELICS[id].walkTemp(R)); R.temp = Math.max(0, R.temp - (loss.length ? Math.min(...loss) : 1)); }
      if (C.res === 'san' && (C.seg ? C.seg(C.rows) : 0) >= 2) R.san = Math.max(0, R.san - 1);
      if (!battle(boss, 'boss', false, C.escort)) break;
      out.chapters[C.id - 1] = true;
    }
    if (out.chapters[2] && R.intel >= 3) { out.trueAttempt = true; R.te = 1; out.trueEnd = battle(['staff'], 'boss', false, CHAPTERS[2].escort); }
  } catch (error) {
    out.error = { stage, ...detail, message: error.stack || String(error), char, seed: seed >>> 0, weights: w, act: R.act, enemies: B?.en.map(e => ({ id: e.key, hp: e.hp, move: e.move })) || detail.enemies || [], hand: B?.hand.map(c => c.id), deck: R.deck.map(c => c.id + (c.up ? '+' : '')), relics: R.relics, route: [...out.route] };
  } finally { Math.random = nativeRandom; }
  out.hp = R.hp; out.maxHp = R.maxHp; out.intel = R.intel;
  return out;
}

export function summarize(char, runs) {
  const n = runs.length, ratio = fn => n ? runs.filter(fn).length / n : 0;
  const deaths = {}, bosses = {}, errors = [];
  for (const r of runs) {
    if (r.death) deaths[r.death] = (deaths[r.death] || 0) + 1;
    if (r.error) errors.push(r.error);
    for (const f of r.fights.filter(f => f.kind === 'boss')) { const key = f.enemies.join('+'), s = bosses[key] ||= { attempts: 0, wins: 0 }; s.attempts++; if (f.result === 'win') s.wins++; }
  }
  const winners = runs.filter(r => r.chapters[2] && !r.error && !r.death);
  const chapterHp = [0, 1, 2].map(i => { const fs = runs.flatMap(r => r.fights.filter(f => f.kind === 'boss' && f.act === i + 1 && !f.enemies.includes('staff') && f.result === 'win')); return fs.length ? sum(fs.map(f => f.hp)) / fs.length : null; });
  return { char, n, seeds: runs.map(r => r.seed), chapters: [0, 1, 2].map(i => ratio(r => r.chapters[i])), trueEnd: ratio(r => r.trueEnd), trueAttempts: runs.filter(r => r.trueAttempt).length, trueWins: runs.filter(r => r.trueEnd).length, bosses, chapterHp, clearHp: winners.length ? sum(winners.map(r => r.hp)) / winners.length : null, timeouts: runs.filter(r => r.timeout).length, deaths: Object.entries(deaths).sort((a, b) => b[1] - a[1]).slice(0, 8), errors };
}

export const fitness = s => (s.chapters[0] + s.chapters[1] + 2 * s.chapters[2] + s.trueEnd) / 5 - s.errors.length / Math.max(1, s.n);
export function evaluate(char, seeds, weights) {
  const applied = loadWeights(char, weights);
  return { ...summarize(char, seeds.map(seed => runGame(char, seed, applied))), weights: applied, source: process.env.BOT_SOURCE_SHA || process.env.GITHUB_SHA || null };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const n = Number(process.argv[2] || 5), char = process.argv[3], seed = Number(process.env.SEED || 1);
  if (!Number.isInteger(n) || n < 1 || !Number.isInteger(seed)) throw new Error('局数和种子必须为整数，局数至少为 1');
  const chars = char ? [char] : CHARACTERS;
  const reports = chars.map(ch => evaluate(ch, Array.from({ length: n }, (_, i) => (seed + i) >>> 0), loadWeights(ch)));
  if (process.env.NOWRITE !== '1') {
    fs.mkdirSync(path.join(ROOT, 'data'), { recursive: true });
    for (const r of reports) fs.writeFileSync(path.join(ROOT, `data/bot_balance_${r.char}.json`), JSON.stringify(r, null, 2) + '\n');
  }
  console.log(JSON.stringify(reports));
  if (reports.some(r => r.errors.length)) process.exitCode = 1;
}
