// 角色模块：沈知秋 · 侦察员（交通员出身，懂俄语）。核心机制只有一个：侦明（照杀戮尖塔观者的「预见」）。
// 侦明 N：看抽牌堆顶 N 张，挑着弃掉。每侦明一次，情报 +1（最多 6）。
// 牌上写【线索】的：被侦明弃掉时触发效果（打出去也有用，但弃掉更值）。
// 情报攒到 3 点，可以点「打乱」：打乱最危险的那个敌人（普通敌人这回合什么也干不了，同一个敌人每场一次；精英、首领改为下一次攻击减半）。每回合一次。
// 她看得穿便衣和伪装：「意图不明」的敌人在她眼里照样显示意图。
// 两套打法：侦（侦明、线索、情报）/ 伏（埋伏、迎击——专打这回合要攻击你的敌人）。
import { V } from './util.js';

export const INTEL_MAX = 6, DISRUPT = 3;
export const KW_SQ = {
  '侦明': '看抽牌堆顶几张，挑着弃掉。每侦明一次，情报 +1。',
  '线索': '这张牌被侦明弃掉时，触发它的线索效果。',
  '情报': '沈知秋侦明攒的，最多 6。攒到 3 点可以「打乱」。',
  '打乱': '花 3 情报，打乱最危险的敌人：普通敌人这回合什么也干不了（同一个敌人每场一次）；精英、首领改为下一次攻击减半。每回合一次。',
  '迎击': '目标这回合要攻击你时，额外生效。',
  '麻痹': '下一次攻击伤害减半。',
};

const atk = (G, t) => G.intends(t);
export const CARDS_SQ = {
  // —— 初始 ——
  sq_shot: { name: '勃朗宁', type: 'atk', cost: [1, 1], rar: 'basic', sch: '伏', tgt: 'one', icon: 'pistol',
    desc: u => `造成 ${V(u, 6, 9)} 伤害。`, play: (G, u, t) => G.melee(t, V(u, 6, 9)) },
  sq_look: { name: '观察', type: 'skill', cost: [1, 1], rar: 'basic', sch: '侦', icon: 'binoc',
    desc: u => `侦明 ${V(u, 3, 4)}，获得 ${V(u, 4, 6)} 格挡。`, play: (G, u) => { G.block(V(u, 4, 6)); G.scry(V(u, 3, 4)); } },
  sq_meet: { name: '迎击', type: 'atk', cost: [1, 1], rar: 'basic', sch: '伏', tgt: 'one', icon: 'pistol',
    desc: u => `造成 ${V(u, 7, 9)} 伤害；迎击：再 +${V(u, 4, 6)}。`, play: (G, u, t) => G.melee(t, V(u, 7, 9) + (atk(G, t) ? V(u, 4, 6) : 0)) },
  // —— 侦 ——
  sq_glance: { name: '一瞥', type: 'skill', cost: [0, 0], rar: 'c', sch: '侦', icon: 'binoc',
    desc: u => `侦明 ${V(u, 2, 3)}。`, play: (G, u) => G.scry(V(u, 2, 3)) },
  sq_note: { name: '记下来', type: 'skill', cost: [1, 1], rar: 'c', sch: '侦', icon: 'binoc',
    desc: u => `侦明 3，抽 ${V(u, 1, 2)}。`, play: (G, u) => { G.scry(3); G.draw(V(u, 1, 2)); } },
  sq_foot: { name: '线索：脚印', type: 'skill', cost: [1, 1], rar: 'c', sch: '侦', icon: 'binoc',
    desc: u => `获得 ${V(u, 6, 9)} 格挡。【线索】被侦明弃掉时：获得 4 格挡，抽 1。`, play: (G, u) => G.block(V(u, 6, 9)), clue: G => { G.block(4); G.draw(1); } },
  sq_butt: { name: '线索：烟头', type: 'atk', cost: [1, 1], rar: 'c', sch: '侦', tgt: 'one', icon: 'pistol',
    desc: u => `造成 ${V(u, 7, 10)} 伤害。【线索】被侦明弃掉时：对随机敌人造成 ${V(u, 7, 10)} 伤害。`, play: (G, u, t) => G.melee(t, V(u, 7, 10)),
    clue: (G, u) => { const a = G.alive(); if (a.length) G.melee(a[Math.floor(G.rng() * a.length)], V(u, 7, 10)); } },
  sq_draft: { name: '线索：电报底稿', type: 'skill', cost: [1, 1], rar: 'u', sch: '侦', icon: 'letter',
    desc: u => `情报 +${V(u, 2, 3)}。【线索】被侦明弃掉时：情报 +1，能量 +1。`, play: (G, u) => G.intel(V(u, 2, 3)), clue: G => { G.intel(1); G.energy(1); } },
  sq_ticket: { name: '线索：车票', type: 'skill', cost: [0, 0], rar: 'u', sch: '侦', icon: 'letter',
    desc: u => `抽 ${V(u, 1, 2)}。【线索】被侦明弃掉时：抽 2。`, play: (G, u) => G.draw(V(u, 1, 2)), clue: G => G.draw(2) },
  sq_tail: { name: '盯梢', type: 'power', cost: [1, 1], rar: 'u', sch: '侦', icon: 'binoc',
    desc: u => `每回合开始侦明 ${V(u, 2, 3)}。`, play: (G, u) => G.power('tail', V(u, 2, 3)) },
  sq_read: { name: '判读', type: 'power', cost: [1, 1], rar: 'u', sch: '侦', icon: 'binoc',
    desc: u => `每次侦明，获得 ${V(u, 2, 3)} 格挡。`, play: (G, u) => G.power('read', V(u, 2, 3)) },
  sq_cipher: { name: '破译', type: 'skill', cost: [1, 0], rar: 'u', sch: '侦', icon: 'letter',
    desc: () => '情报 +3。', play: G => G.intel(3) },
  sq_plan: { name: '未雨绸缪', type: 'skill', cost: [2, 1], rar: 'r', sch: '侦', icon: 'binoc',
    desc: () => '侦明 6；弃掉几张就抽几张。', play: G => { G.B.p.planDraw = 1; G.scry(6); } },
  sq_master: { name: '全盘掌握', type: 'power', cost: [3, 2], rar: 'r', sch: '侦', icon: 'letter',
    desc: () => '每回合开始情报 +1；打乱只要 2 情报。', play: G => G.power('master', 1) },
  // —— 伏 ——
  sq_hide: { name: '埋伏', type: 'skill', cost: [1, 1], rar: 'c', sch: '伏', icon: 'cover',
    desc: u => `获得 ${V(u, 7, 10)} 格挡；有敌人要攻击你时再 +4。`, play: (G, u) => G.block(V(u, 7, 10) + (G.alive().some(e => atk(G, e)) ? 4 : 0)) },
  sq_cross: { name: '交叉火力', type: 'atk', cost: [1, 1], rar: 'c', sch: '伏', icon: 'pistol',
    desc: u => `对每个要攻击你的敌人造成 ${V(u, 7, 10)} 伤害。`, play: (G, u) => G.alive().filter(e => atk(G, e)).forEach(e => G.melee(e, V(u, 7, 10))) },
  sq_snare: { name: '绊索', type: 'skill', cost: [1, 1], rar: 'c', sch: '伏', tgt: 'one', icon: 'cover',
    desc: u => `目标虚弱 2；迎击：再易伤 ${V(u, 1, 2)}。`, play: (G, u, t) => { G.weak(t, 2); if (atk(G, t)) G.vuln(t, V(u, 1, 2)); } },
  sq_lure: { name: '引蛇出洞', type: 'skill', cost: [0, 0], rar: 'c', sch: '伏', tgt: 'one', icon: 'binoc',
    desc: u => `目标易伤 ${V(u, 1, 2)}，侦明 1。`, play: (G, u, t) => { G.vuln(t, V(u, 1, 2)); G.scry(1); } },
  sq_trap: { name: '请君入瓮', type: 'atk', cost: [2, 2], rar: 'u', sch: '伏', tgt: 'one', icon: 'pistol',
    desc: u => `造成 ${V(u, 13, 17)} 伤害；迎击：翻倍。`, play: (G, u, t) => G.melee(t, V(u, 13, 17) * (atk(G, t) ? 2 : 1)) },
  sq_turn: { name: '将计就计', type: 'power', cost: [1, 1], rar: 'u', sch: '伏', icon: 'letter',
    desc: u => `每回合第一次打要攻击你的敌人，+${V(u, 5, 8)} 伤害。`, play: (G, u) => G.power('turn', V(u, 5, 8)) },
  sq_shadow: { name: '隐蔽', type: 'skill', cost: [1, 1], rar: 'u', sch: '伏', icon: 'cover',
    desc: u => `获得 ${V(u, 6, 9)} 格挡，情报 +1。`, play: (G, u) => { G.block(V(u, 6, 9)); G.intel(1); } },
  sq_spare: { name: '优待俘虏', type: 'skill', cost: [1, 1], rar: 'u', sch: '伏', tgt: 'one', ex: 1, icon: 'letter',
    desc: u => `普通敌人生命低于 ${V(u, '30%', '40%')}：放下武器离开。否则虚弱 2。消耗。`,
    play: (G, u, t) => { if (t && !t.d.elite && !t.d.boss && t.hp < t.max * V(u, .3, .4)) G.surrender(t); else G.weak(t, 2); } },
  sq_ambush: { name: '伏击圈', type: 'atk', cost: [3, 2], rar: 'r', sch: '伏', icon: 'pistol',
    desc: () => '对每个敌人造成 10 伤害；要攻击你的敌人改为 20。', play: G => G.alive().forEach(e => G.melee(e, atk(G, e) ? 20 : 10)) },
  // —— 通用 ——
  sq_ru: { name: '「（俄语）同志，这边！」', type: 'skill', cost: [1, 1], rar: 'c', sch: '通', ex: 1, icon: 'letter',
    desc: u => `她会俄语：抽 2，能量 +${V(u, 1, 2)}。消耗。`, play: (G, u) => { G.draw(2); G.energy(V(u, 1, 2)); } },
  sq_coat: { name: '换装', type: 'skill', cost: [1, 1], rar: 'c', sch: '通', icon: 'cover',
    desc: u => `获得 ${V(u, 8, 11)} 格挡。`, play: (G, u) => G.block(V(u, 8, 11)) },
};
Object.values(CARDS_SQ).forEach(d => { d.ch = 'shen'; });

function addIntel(B, n) { const p = B.p, k = Math.min(INTEL_MAX, p.intel + n); if (k > p.intel) B.K.fx('hero', `情报+${k - p.intel}`, 'st'); p.intel = k; }
const cost = B => B.p.pw.master ? 2 : DISRUPT;
/* 最危险的敌人：这回合打你最疼的；都不打就挑生命最多的 */
function threat(B) {
  const a = B.K.alive().filter(e => !e.st.dazed); if (!a.length) return null;
  return a.slice().sort((x, y) => ((B.G.intends(y) ? 1000 : 0) + y.hp) - ((B.G.intends(x) ? 1000 : 0) + x.hp))[0];
}

export const MECH_SQ = {
  seeHidden: 1,
  init(B) { const p = B.p; p.intel = 0; p.disrupted = 0; },
  turnStart(B) {
    const p = B.p; p.disrupted = 0; p.turnUsed = 0;
    if (p.pw.master) addIntel(B, 1);
  },
  afterDraw(B) { if (B.p.pw.tail) B.G.scry(B.p.pw.tail); },
  turnEnd() {},
  onScry(B, k, out = 0) {
    const p = B.p; addIntel(B, 1);
    if (p.pw.read) { p.block += p.pw.read; B.K.fx('hero', '+' + p.pw.read, 'blk'); }
    if (p.planDraw) { p.planDraw = 0; if (out) B.K.drawCards(out); }
  },
  /* 自动侦明（模拟、测试用）：弃掉带线索的、基础牌和格挡牌留一张，其余留下 */
  scryBot(B, top) { return top.filter(c => c.id === 'defend' || /^sq_(foot|butt|draft|ticket)$/.test(c.id)).map(c => c.uid); },
  G(B) {
    return {
      intel: n => addIntel(B, n),
      /* 迎击类加成：将计就计 */
      melee: (t, n) => { if (!t || t.dead) return; let x = n; if (B.p.pw.turn && !B.p.turnUsed && B.G.intends(t)) { B.p.turnUsed = 1; x += B.p.pw.turn; } B.K.hitEnemy(t, B.K.atkMod(t, x)); },
    };
  },
  actions(B) {
    const p = B.p, c = cost(B), ok = p.intel >= c && !p.disrupted && threat(B);
    return [{ id: 'disrupt', key: 'R', label: `打乱 <small>情报 ${p.intel}/${c}</small>`, dis: p.disrupted ? '这回合用过了' : p.intel < c ? '情报不够' : !threat(B) ? '没有目标' : null, hot: !!ok }];
  },
  act(B, id) {
    const p = B.p, c = cost(B), t = threat(B); if (id !== 'disrupt' || p.intel < c || p.disrupted || !t) return false;
    p.intel -= c; p.disrupted = 1; B.G.hardCC(t); return true;
  },
  info(B) {
    const p = B.p;
    return { main: `<div class="ammo intelv" data-k="情报"><span class="pips">${Array.from({ length: INTEL_MAX }, (_, i) => `<i class="${i < p.intel ? 'f' : ''}"></i>`).join('')}</span><b>情报 ${p.intel}</b></div>`,
      chips: '', powers: { tail: '盯梢', read: '判读', master: '全盘掌握', turn: '将计就计' } };
  },
  enemyChips() { return ''; },
  shotKind() { return null; },
  rules: [
    '<b>侦明</b>：看抽牌堆顶几张，挑着弃掉（不想要的牌先扔，好牌留着下回合抽）。每侦明一次，情报 +1。',
    '<b>线索</b>：牌上写【线索】的，被侦明弃掉时触发效果。',
    '<b>打乱</b>：情报攒到 3，点右边的「打乱」：最危险的普通敌人这回合什么也干不了（同一个敌人每场一次）；精英、首领改为下一次攻击减半。每回合一次。',
    '<b>看得穿</b>：便衣、伪装的「意图不明」，在她眼里照样看得见。',
    '<b>迎击</b>：牌上写「迎击」的，目标这回合要攻击你时才额外生效。',
  ],
  dbg: [['情报满', B => { B.p.intel = INTEL_MAX; }]],
};

export const TUT_SQ = [
  { id: 'scry', on: 'render', when: B => B.scryQ && B.scryQ.length, hint: '侦明：点牌把它弃掉，留下的按顺序在牌堆顶。带【线索】的弃掉会触发。' },
  { id: 'disrupt', on: 'render', when: B => B.p.intel >= DISRUPT, hint: '情报够 3 了，可以点「打乱」让最危险的敌人这回合干不了事。' },
];

export const SHEN = {
  id: 'shen', name: '沈知秋', title: '侦察员', hp: 68, blurb: '交通员出身。先看清牌、看穿敌人，再在他们动手的时候埋伏。',
  starter: ['sq_shot', 'sq_shot', 'sq_shot', 'sq_shot', 'defend', 'defend', 'defend', 'defend', 'sq_look', 'sq_meet'],
  startRelic: 'diary', mech: MECH_SQ, kw: KW_SQ, tut: TUT_SQ, lang: { ja: 1, ru: 3 },
  art: { dir: 'shen', frames: true, lihui: true, fr: { cw: 305, ch: 321, ax: 196, sw: 121, sh: 319 }, h: 240, hTouch: 226 },
};
