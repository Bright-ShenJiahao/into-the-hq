// 角色模块：赵铁山 · 爆破手（老工兵）。核心机制只有一个：炸药包（照通往顶端的延时伤害）。
// 炸药包装在敌人身上，写着伤害和引信；你的回合结束时引信 -1，到 0 就炸：打这个敌人，其他敌人吃一半；
// 对有装甲的敌人伤害翻倍、无视装甲。目标先死了，它身上的炸药包当场殉爆（只炸其他敌人那一半）。
// 爆炸很响：第二章每炸一次噪声 +3。
// 另有「工事」：不会在回合开始清零的格挡（最多 30），先扣格挡再扣工事。
// 两套打法：爆（装炸药包、加药、剪引信）/ 工（挖工事硬守，用工事打人）。
import { V } from './util.js';

export const KW_ZT = {
  '炸药包': '装在敌人身上，写着伤害和引信。你的回合结束时引信 -1，到 0 就炸：这个敌人吃全部伤害，其他敌人吃一半；对装甲敌人伤害翻倍并无视装甲。很响。',
  '引信': '炸药包还有几个回合爆炸。',
  '剪短引信': '1 费：所有炸药包引信 -1，到 0 的马上炸。',
  '工事': '不会在回合开始清零的格挡，最多 30。挨打时先扣格挡，再扣工事。',
};

export const CARDS_ZT = {
  // —— 初始 ——
  zt_spade: { name: '工兵锹', type: 'atk', cost: [1, 1], rar: 'basic', sch: '工', tgt: 'one', icon: 'bayonet',
    desc: u => `造成 ${V(u, 6, 9)} 伤害。`, play: (G, u, t) => G.melee(t, V(u, 6, 9)) },
  zt_pack: { name: '炸药包', type: 'skill', cost: [1, 1], rar: 'basic', sch: '爆', tgt: 'one', icon: 'grenade',
    desc: u => `给目标装炸药包：${V(u, 14, 19)} 伤害，引信 2。`, play: (G, u, t) => G.charge(t, V(u, 14, 19), 2) },
  zt_dig: { name: '挖掩体', type: 'skill', cost: [1, 1], rar: 'basic', sch: '工', icon: 'cover',
    desc: u => `工事 +${V(u, 6, 9)}。`, play: (G, u) => G.fort(V(u, 6, 9)) },
  // —— 爆 ——
  zt_short: { name: '短引信', type: 'skill', cost: [0, 0], rar: 'c', sch: '爆', tgt: 'one', icon: 'grenade',
    desc: u => `给目标装炸药包：${V(u, 6, 9)} 伤害，引信 1。`, play: (G, u, t) => G.charge(t, V(u, 6, 9), 1) },
  zt_grenade: { name: '手榴弹', type: 'atk', cost: [1, 1], rar: 'c', sch: '爆', tgt: 'one', icon: 'grenade',
    desc: u => `对目标造成 ${V(u, 7, 10)} 伤害，其他敌人 ${V(u, 3, 5)}（会出声）。`, play: (G, u, t) => { G.melee(t, V(u, 7, 10)); G.alive().forEach(e => e !== t && G.melee(e, V(u, 3, 5))); G.noise(1); } },
  zt_pull: { name: '拉火', type: 'skill', cost: [0, 0], rar: 'c', sch: '爆', icon: 'grenade',
    desc: u => `所有炸药包引信 -1（到 0 马上炸）；抽 ${V(u, 1, 2)}。`, play: (G, u) => { G.tick(); G.draw(V(u, 1, 2)); } },
  zt_extra: { name: '加装药', type: 'skill', cost: [1, 1], rar: 'c', sch: '爆', tgt: 'one', icon: 'grenade',
    desc: u => `目标身上每个炸药包伤害 +${V(u, 7, 10)}；没有就装一个 ${V(u, 7, 10)} 伤害、引信 2 的。`, play: (G, u, t) => G.boost(t, V(u, 7, 10)) },
  zt_sweep: { name: '扔过去', type: 'skill', cost: [1, 1], rar: 'c', sch: '爆', icon: 'grenade',
    desc: u => `给每个敌人装炸药包：${V(u, 5, 7)} 伤害，引信 1。`, play: (G, u) => G.alive().forEach(e => G.charge(e, V(u, 5, 7), 1)) },
  zt_bangalore: { name: '爆破筒', type: 'atk', cost: [2, 2], rar: 'u', sch: '爆', tgt: 'one', icon: 'grenade',
    desc: u => `造成 ${V(u, 13, 17)} 伤害，无视装甲（会出声）。`, play: (G, u, t) => { G.blast(t, V(u, 13, 17)); G.noise(2); } },
  zt_bundle: { name: '集束手榴弹', type: 'skill', cost: [2, 2], rar: 'u', sch: '爆', tgt: 'one', icon: 'grenade',
    desc: u => `给目标装炸药包：${V(u, 26, 34)} 伤害，引信 2。`, play: (G, u, t) => G.charge(t, V(u, 26, 34), 2) },
  zt_detonate: { name: '定向爆破', type: 'skill', cost: [1, 0], rar: 'u', sch: '爆', tgt: 'one', icon: 'grenade',
    desc: () => '立刻引爆目标身上所有炸药包。', play: (G, u, t) => G.detonate(t) },
  zt_mines: { name: '埋雷', type: 'power', cost: [1, 1], rar: 'u', sch: '爆', icon: 'grenade',
    desc: u => `每回合开始给随机敌人装炸药包：${V(u, 6, 9)} 伤害，引信 2。`, play: (G, u) => G.power('mines', V(u, 6, 9)) },
  zt_chain: { name: '殉爆', type: 'power', cost: [2, 1], rar: 'u', sch: '爆', icon: 'grenade',
    desc: () => '炸药包爆炸时，其他敌人吃全部伤害（原来是一半）。', play: G => G.power('chain', 1) },
  zt_bridge: { name: '炸桥', type: 'skill', cost: [3, 2], rar: 'r', sch: '爆', icon: 'grenade',
    desc: u => `给每个敌人装炸药包：${V(u, 16, 22)} 伤害，引信 1。`, play: (G, u) => G.alive().forEach(e => G.charge(e, V(u, 16, 22), 1)) },
  zt_tnt: { name: '黄色炸药', type: 'power', cost: [2, 2], rar: 'r', sch: '爆', icon: 'grenade',
    desc: u => `炸药包伤害 +${V(u, '50%', '75%')}。`, play: (G, u) => G.power('tnt', V(u, .5, .75)) },
  // —— 工 ——
  zt_sandbag: { name: '沙袋', type: 'skill', cost: [1, 1], rar: 'c', sch: '工', icon: 'cover',
    desc: u => `工事 +${V(u, 8, 11)}。`, play: (G, u) => G.fort(V(u, 8, 11)) },
  zt_trench: { name: '交通壕', type: 'skill', cost: [1, 1], rar: 'c', sch: '工', icon: 'cover',
    desc: u => `获得 ${V(u, 5, 7)} 格挡，工事 +${V(u, 3, 4)}，抽 1。`, play: (G, u) => { G.block(V(u, 5, 7)); G.fort(V(u, 3, 4)); G.draw(1); } },
  zt_foxhole: { name: '猫耳洞', type: 'skill', cost: [0, 0], rar: 'c', sch: '工', icon: 'cover',
    desc: u => `工事 +${V(u, 3, 4)}；工事 ≥15 时再抽 2。`, play: (G, u) => { G.fort(V(u, 3, 4)); if (G.fortN() >= 15) G.draw(2); } },
  zt_wire: { name: '铁丝网', type: 'skill', cost: [1, 1], rar: 'c', sch: '工', icon: 'cover',
    desc: u => `获得 ${V(u, 4, 6)} 格挡，反击 ${V(u, 4, 6)}。`, play: (G, u) => { G.block(V(u, 4, 6)); G.counter(V(u, 4, 6)); } },
  zt_parapet: { name: '胸墙射击', type: 'atk', cost: [1, 1], rar: 'u', sch: '工', tgt: 'one', icon: 'rifle',
    desc: u => `造成 ${V(u, 5, 7)} + 工事一半的伤害（会出声）。`, play: (G, u, t) => { G.melee(t, V(u, 5, 7) + Math.floor(G.fortN() / 2)); G.noise(1); } },
  zt_reinforce: { name: '加固', type: 'power', cost: [1, 1], rar: 'u', sch: '工', icon: 'cover',
    desc: u => `每回合开始工事 +${V(u, 3, 4)}。`, play: (G, u) => G.power('reinforce', V(u, 3, 4)) },
  zt_minefield: { name: '雷区', type: 'power', cost: [2, 2], rar: 'u', sch: '工', icon: 'grenade',
    desc: u => `敌人每打你一下，受到 ${V(u, 3, 5)} 伤害。`, play: (G, u) => G.power('mine', V(u, 3, 5)) },
  zt_bunker: { name: '地堡', type: 'skill', cost: [2, 2], rar: 'u', sch: '工', ex: 1, icon: 'cover',
    desc: u => `工事 +${V(u, 16, 22)}。消耗。`, play: (G, u) => G.fort(V(u, 16, 22)) },
  zt_collapse: { name: '塌方', type: 'atk', cost: [2, 2], rar: 'r', sch: '工', icon: 'grenade',
    desc: u => `花掉全部工事，对所有敌人造成等量伤害${V(u, '', ' +6')}。`, play: (G, u) => { const n = G.fortN(); G.fortSet(0); G.meleeAll(n + V(u, 0, 6)); } },
  zt_perm: { name: '永备工事', type: 'power', cost: [2, 1], rar: 'r', sch: '工', icon: 'cover',
    desc: () => '工事上限变成 50，每回合开始工事 +2。', play: G => { G.power('perm', 1); G.power('reinforce2', 2); } },
  // —— 通用 ——
  zt_rifle: { name: '三八大盖', type: 'atk', cost: [1, 1], rar: 'c', sch: '通', tgt: 'one', icon: 'rifle',
    desc: u => `缴获的步枪：造成 ${V(u, 9, 12)} 伤害（会出声）。`, play: (G, u, t) => { G.melee(t, V(u, 9, 12)); G.noise(1); } },
  zt_measure: { name: '步测', type: 'skill', cost: [0, 0], rar: 'c', sch: '通', ex: 1, icon: 'binoc',
    desc: u => `抽 ${V(u, 2, 3)}。消耗。`, play: (G, u) => G.draw(V(u, 2, 3)) },
  zt_steady: { name: '老兵', type: 'skill', cost: [1, 1], rar: 'u', sch: '通', icon: 'cover',
    desc: u => `获得 ${V(u, 7, 10)} 格挡；身上有炸药包的敌人每个再 +2。`, play: (G, u) => G.block(V(u, 7, 10) + 2 * G.alive().filter(e => (e.charges || []).length).length) },
};
Object.values(CARDS_ZT).forEach(d => { d.ch = 'zhao'; });

const mul = B => 1 + (B.p.pw.tnt || 0);
function place(B, e, dmg, fuse) {
  if (!e || e.dead) return; (e.charges = e.charges || []).push({ dmg, fuse }); B.K.fx(e.id, `炸药包 ${dmg}`, 'st');
}
/* 一个炸药包炸：splashOnly = 目标已经死了（殉爆，只炸其他敌人） */
function boom(B, e, c, splashOnly) {
  const d = Math.floor(c.dmg * mul(B)), K = B.K;
  B.G.noise(3); K.fx(e.id, '轰！', 'boom');
  const hit = (x, n) => { if (x.dead) return; let v = n; if (x.st.vuln) v *= 1.5; if (x.armor) v *= 2; K.hitEnemy(x, Math.floor(v)); };
  if (!splashOnly) hit(e, d);
  const sp = B.p.pw.chain ? d : Math.floor(d / 2);
  for (const x of K.alive()) if (x !== e) hit(x, sp);
}
function tick(B) {
  for (const e of B.en) {
    if (e.dead || !e.charges) continue;
    for (const c of e.charges) c.fuse--;
    const go = e.charges.filter(c => c.fuse <= 0); e.charges = e.charges.filter(c => c.fuse > 0);
    for (const c of go) boom(B, e, c, e.dead);
  }
}
const fortMax = B => B.p.pw.perm ? 50 : 30;

export const MECH_ZT = {
  init(B) { B.p.trimUsed = 0; },
  turnStart(B) {
    const p = B.p; p.trimUsed = 0;
    const r = (p.pw.reinforce || 0) + (p.pw.reinforce2 || 0); if (r) { p.fort = Math.min(fortMax(B), p.fort + r); B.K.fx('hero', `工事+${r}`, 'blk'); }
    if (p.pw.mines) { const a = B.K.alive(); if (a.length) place(B, a[Math.floor(B.rng() * a.length)], p.pw.mines, 2); }
  },
  turnEnd(B) { tick(B); },
  /* 目标死了：身上的炸药包殉爆 */
  onKill(B, e) { const cs = e.charges || []; e.charges = []; for (const c of cs) boom(B, e, c, true); },
  G(B) {
    return {
      charge: (t, d, f) => place(B, t || B.K.alive()[0], d, f),
      boost: (t, n) => { t = t || B.K.alive()[0]; if (!t) return; if (t.charges && t.charges.length) { t.charges.forEach(c => { c.dmg += n; }); B.K.fx(t.id, `加药+${n}`, 'st'); } else place(B, t, n, 2); },
      detonate: t => { if (!t || t.dead || !t.charges) return; const cs = t.charges; t.charges = []; for (const c of cs) boom(B, t, c, t.dead); },
      tick: () => tick(B),
      blast: (t, d) => { if (t && !t.dead) B.K.hitEnemy(t, Math.floor(d * (t.st.vuln ? 1.5 : 1))); },
      fortN: () => B.p.fort, fortSet: n => { B.p.fort = n; },
      fort: n => { B.p.fort = Math.min(fortMax(B), B.p.fort + n); B.K.fx('hero', `工事+${n}`, 'blk'); },
    };
  },
  actions(B) {
    const any = B.en.some(e => !e.dead && (e.charges || []).length), ok = any && B.p.energy >= 1;
    return [{ id: 'trim', key: 'R', label: `剪短引信 <small>1 费</small>`, dis: !any ? '没有装好的炸药包' : B.p.energy < 1 ? '能量不够' : null, hot: ok }];
  },
  act(B, id) { if (id !== 'trim' || B.p.energy < 1 || !B.en.some(e => !e.dead && (e.charges || []).length)) return false; B.p.energy--; tick(B); return true; },
  info(B) {
    const f = B.p.fort;
    return { main: `<div class="ammo fortv" data-k="工事"><b>🧱 工事 ${f}</b></div>`, chips: '',
      powers: { mines: '埋雷', chain: '殉爆', tnt: '黄色炸药', reinforce: '加固', mine: '雷区', perm: '永备工事' } };
  },
  enemyChips(e) { return (e.charges || []).map(c => `<b class="mark chargec" data-k="炸药包">💣 ${c.dmg}·${c.fuse}</b>`).join(''); },
  shotKind() { return null; },
  rules: [
    '<b>炸药包</b>：装在敌人身上（💣 伤害·引信）。你的回合结束时引信 -1，到 0 就炸：这个敌人吃全部，其他敌人吃一半；对装甲敌人伤害翻倍、无视装甲。目标先死了，炸药包当场殉爆。',
    '<b>剪短引信</b>：右边的按钮，1 费，所有炸药包引信 -1，到 0 的马上炸。',
    '<b>工事</b>：不会在回合开始清零的格挡（最多 30）。挨打时先扣格挡再扣工事。',
    '<b>很响</b>：第二章里每炸一次噪声 +3，可疑度涨得快。',
  ],
  dbg: [['全体装药 30', B => B.K.alive().forEach(e => place(B, e, 30, 1))], ['工事 30', B => { B.p.fort = 30; }]],
  scryBot() { return []; },
};

export const TUT_ZT = [
  { id: 'charge', on: 'render', when: B => B.en.some(e => !e.dead && (e.charges || []).length), hint: '💣 后面两个数是伤害和引信。你的回合结束时引信 -1，到 0 就炸。急的话点「剪短引信」。' },
  { id: 'fort', on: 'render', when: B => B.p.fort > 0, hint: '工事不会在回合开始清零，挨打时先扣格挡再扣工事。' },
];

export const ZHAO = {
  id: 'zhao', name: '赵铁山', title: '爆破手', hp: 78, blurb: '老工兵。给敌人装上炸药包等它炸，或者挖好工事硬扛。',
  starter: ['zt_spade', 'zt_spade', 'zt_spade', 'zt_spade', 'defend', 'defend', 'defend', 'defend', 'zt_pack', 'zt_dig'],
  startRelic: 'manual', mech: MECH_ZT, kw: KW_ZT, tut: TUT_ZT, lang: { ja: 1, ru: 1 },
  art: { ph: '#3b4a33', h: 255, hTouch: 240 },
};
