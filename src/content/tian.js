// 角色模块：田守义 · 大刀（42 岁，早年绺子的「炮头」）。核心机制只有一个：血气 → 突击（照通往顶端希尔薇的变身）。
// 血气 0—8：每次失去生命 +1（每回合最多 3 次），有的牌也加。攒满 8 点可以点「突击」：本回合和接下来 2 个回合，
// 攻击牌 +4 伤害、每回合 +1 能量，但受到的伤害 +50%；牌上写着【怒】的效果改用怒的那一套。突击结束血气清零。
// 两套打法：怒（卖血攒血气，突击爆发）/ 守（格挡、反击，靠「挨打」攒血气）。
import { V } from './util.js';

export const QI_MAX = 8, RAGE_TURNS = 3;
export const KW_TS = {
  '血气': '田守义每次失去生命 +1（每回合最多 3 次），攒满 8 点可以「突击」。',
  '突击': '本回合和接下来 2 个回合：攻击牌 +4 伤害，每回合 +1 能量，受到的伤害 +50%；牌上【怒】的效果生效。结束后血气清零。',
  '怒': '突击期间，牌上写着【怒】的效果改用这一套。',
  '反击': '这回合敌人每打你一下，你就还它这么多伤害（到你下回合开始清零）。',
};

const R_ = G => G.rage();
export const CARDS_TS = {
  // —— 初始 ——
  ts_chop: { name: '劈砍', type: 'atk', cost: [1, 1], rar: 'basic', sch: '怒', tgt: 'one', icon: 'dadao',
    desc: u => `造成 ${V(u, 7, 10)} 伤害。【怒】打 2 次。`, play: (G, u, t) => G.hit(t, V(u, 7, 10), R_(G) ? 2 : 1) },
  ts_guard: { name: '横刀', type: 'skill', cost: [1, 1], rar: 'basic', sch: '守', icon: 'cover',
    desc: u => `获得 ${V(u, 6, 8)} 格挡，反击 ${V(u, 3, 4)}。`, play: (G, u) => { G.block(V(u, 6, 8)); G.counter(V(u, 3, 4)); } },
  ts_risk: { name: '拼命', type: 'skill', cost: [0, 0], rar: 'basic', sch: '怒', icon: 'medkit',
    desc: u => `失去 3 生命，血气 +${V(u, 2, 3)}，抽 1。`, play: (G, u) => { G.loseHp(3); G.qi(V(u, 2, 3) - 1); G.draw(1); } },
  // —— 怒 ——
  ts_flick: { name: '撩', type: 'atk', cost: [1, 1], rar: 'c', sch: '怒', tgt: 'one', icon: 'dadao',
    desc: u => `造成 ${V(u, 4, 5)} 伤害 2 次；本回合失去过生命则每次 +2。【怒】打 3 次。`, play: (G, u, t) => G.hit(t, V(u, 4, 5) + (G.hurtThisTurn() ? 2 : 0), R_(G) ? 3 : 2) },
  ts_valor: { name: '血勇', type: 'skill', cost: [1, 1], rar: 'c', sch: '怒', icon: 'medkit',
    desc: u => `血气 +${V(u, 2, 3)}；生命低于一半时再 +2。`, play: (G, u) => G.qi(V(u, 2, 3) + (G.lowHp() ? 2 : 0)) },
  ts_taunt: { name: '挑衅', type: 'skill', cost: [1, 1], rar: 'c', sch: '怒', tgt: 'one', icon: 'helmet',
    desc: u => `目标易伤 ${V(u, 2, 3)}，血气 +1。【怒】再虚弱 2。`, play: (G, u, t) => { G.vuln(t, V(u, 2, 3)); G.qi(1); if (R_(G)) G.weak(t, 2); } },
  ts_back: { name: '刀背', type: 'atk', cost: [1, 1], rar: 'c', sch: '怒', tgt: 'one', icon: 'dadao',
    desc: u => `造成 ${V(u, 6, 8)} 伤害，虚弱 ${V(u, 1, 2)}（用刀背敲，留活口）。`, play: (G, u, t) => { G.hit(t, V(u, 6, 8)); G.weak(t, V(u, 1, 2)); } },
  ts_blood: { name: '血性', type: 'power', cost: [1, 1], rar: 'u', sch: '怒', icon: 'medkit',
    desc: u => `每次失去生命，血气额外 +1${V(u, '', '，并获得 2 格挡')}。`, play: (G, u) => G.power('bloodqi', V(u, 1, 2)) },
  ts_trade: { name: '以伤换伤', type: 'skill', cost: [1, 1], rar: 'u', sch: '怒', icon: 'dadao',
    desc: u => `失去 4 生命，对所有敌人造成 ${V(u, 5, 7)} 伤害，血气 +2。【怒】伤害翻倍。`, play: (G, u) => { G.loseHp(4); G.hitAll(V(u, 5, 7) * (R_(G) ? 2 : 1)); G.qi(2); } },
  ts_cleave: { name: '力劈', type: 'atk', cost: [2, 2], rar: 'u', sch: '怒', tgt: 'one', icon: 'dadao',
    desc: u => `造成 ${V(u, 18, 24)} 伤害。【怒】无视格挡。`, play: (G, u, t) => G.hit(t, V(u, 18, 24), 1, R_(G)) },
  ts_boss: { name: '大当家', type: 'power', cost: [2, 1], rar: 'u', sch: '怒', icon: 'helmet',
    desc: () => '本场每击杀一个敌人，攻击牌 +2 伤害。（死在他面前的大当家）', play: G => G.power('boss', 1) },
  ts_allin: { name: '拼到底', type: 'atk', cost: [2, 2], rar: 'r', sch: '怒', tgt: 'one', icon: 'dadao',
    desc: u => `造成 ${V(u, 4, 5)}×血气 伤害（至少 ${V(u, 8, 10)}）；清空血气。`, play: (G, u, t) => { G.hit(t, Math.max(V(u, 8, 10), V(u, 4, 5) * G.qiN())); G.qiClear(); } },
  ts_mountain: { name: '刀山', type: 'atk', cost: [3, 3], rar: 'r', sch: '怒', icon: 'dadao',
    desc: u => `对所有敌人造成 ${V(u, 6, 8)} 伤害 3 次。`, play: (G, u) => { for (let i = 0; i < 3; i++) G.hitAll(V(u, 6, 8)); } },
  // —— 守 ——
  ts_body: { name: '护身刀', type: 'skill', cost: [1, 1], rar: 'c', sch: '守', icon: 'dadao',
    desc: u => `获得 ${V(u, 8, 11)} 格挡，反击 ${V(u, 3, 5)}。`, play: (G, u) => { G.block(V(u, 8, 11)); G.counter(V(u, 3, 5)); } },
  ts_parry: { name: '架刀', type: 'skill', cost: [1, 1], rar: 'c', sch: '守', icon: 'dadao',
    desc: u => `获得 ${V(u, 5, 7)} 格挡，抽 1。`, play: (G, u) => { G.block(V(u, 5, 7)); G.draw(1); } },
  ts_drag: { name: '拖刀', type: 'atk', cost: [1, 1], rar: 'c', sch: '守', tgt: 'one', icon: 'dadao',
    desc: u => `造成 ${V(u, 6, 8)} 伤害，获得等量格挡。`, play: (G, u, t) => { G.hit(t, V(u, 6, 8)); G.block(V(u, 6, 8)); } },
  ts_take: { name: '硬挨', type: 'skill', cost: [1, 1], rar: 'c', sch: '守', icon: 'cover',
    desc: u => `获得 ${V(u, 9, 12)} 格挡。`, play: (G, u) => G.block(V(u, 9, 12)) },
  ts_wall: { name: '铁壁', type: 'skill', cost: [2, 2], rar: 'u', sch: '守', icon: 'cover',
    desc: u => `获得 ${V(u, 14, 18)} 格挡；下回合能量 +1。`, play: (G, u) => { G.block(V(u, 14, 18)); G.nextEnergy(1); } },
  ts_riposte: { name: '反手', type: 'power', cost: [1, 1], rar: 'u', sch: '守', icon: 'dadao',
    desc: u => `每回合开始反击 ${V(u, 3, 4)}。`, play: (G, u) => G.power('ctr', V(u, 3, 4)) },
  ts_coat: { name: '厚棉袄', type: 'power', cost: [1, 1], rar: 'u', sch: '守', icon: 'cover',
    desc: u => `每回合开始获得 ${V(u, 3, 5)} 格挡。`, play: (G, u) => G.power('coat', V(u, 3, 5)) },
  ts_bash: { name: '以守为攻', type: 'atk', cost: [1, 1], rar: 'u', sch: '守', tgt: 'one', icon: 'cover',
    desc: u => `造成等于当前格挡 ${V(u, '一半', '3/4')}的伤害。`, play: (G, u, t) => G.hit(t, Math.floor(G.blockN() * V(u, .5, .75))) },
  ts_redirect: { name: '借力打力', type: 'skill', cost: [2, 2], rar: 'r', sch: '守', icon: 'cover',
    desc: u => `获得 ${V(u, 14, 18)} 格挡，反击 8。`, play: (G, u) => { G.block(V(u, 14, 18)); G.counter(8); } },
  ts_still: { name: '不动如山', type: 'power', cost: [3, 2], rar: 'r', sch: '守', icon: 'cover',
    desc: () => '每回合开始获得 6 格挡，反击 2。', play: G => { G.power('coat2', 6); G.power('ctr2', 2); } },
  // —— 通用 ——
  ts_rifle: { name: '老套筒', type: 'atk', cost: [1, 1], rar: 'c', sch: '通', tgt: 'one', icon: 'rifle',
    desc: u => `绺子时候的旧步枪：造成 ${V(u, 9, 12)} 伤害（会出声）。`, play: (G, u, t) => { G.hit(t, V(u, 9, 12)); G.noise(1); } },
  ts_roar: { name: '大喝', type: 'skill', cost: [0, 0], rar: 'c', sch: '通', ex: 1, icon: 'helmet',
    desc: u => `所有敌人虚弱 ${V(u, 1, 2)}。消耗。`, play: (G, u) => G.alive().forEach(e => G.weak(e, V(u, 1, 2))) },
  ts_xian: { name: '请仙', type: 'skill', cost: [1, 1], rar: 'u', sch: '通', ex: 1, icon: 'binoc',
    desc: u => `敬畏 ≥2：获得 2 能量、抽 ${V(u, 2, 3)}；敬畏 <0：失去 4 生命。消耗。（他信这个，心里有底）`, play: (G, u) => { const a = G.awe(); if (a >= 2) { G.energy(2); G.draw(V(u, 2, 3)); } else if (a < 0) G.loseHp(4); } },
  // —— 怒（扩充） ——
  ts_flower: { name: '刀花', type: 'atk', cost: [1, 1], rar: 'c', sch: '怒', tgt: 'one', icon: 'dadao',
    desc: u => `造成 ${V(u, 6, 8)} 伤害；本回合失去过生命就再打 1 次。【怒】打 3 次。`, play: (G, u, t) => G.hit(t, V(u, 6, 8), R_(G) ? 3 : G.hurtThisTurn() ? 2 : 1) },
  ts_back2: { name: '逆手刀', type: 'atk', cost: [1, 1], rar: 'c', sch: '怒', tgt: 'one', icon: 'dadao',
    desc: u => `造成 ${V(u, 8, 10)} 伤害，血气 +1。【怒】+6 伤害。`, play: (G, u, t) => { G.hit(t, V(u, 8, 10) + (R_(G) ? 6 : 0)); G.qi(1); } },
  ts_lift: { name: '挑刀', type: 'atk', cost: [1, 1], rar: 'c', sch: '怒', tgt: 'one', icon: 'dadao',
    desc: u => `造成 ${V(u, 9, 12)} 伤害，目标虚弱 ${V(u, 1, 2)}。`, play: (G, u, t) => { G.hit(t, V(u, 9, 12)); G.weak(t, V(u, 1, 2)); } },
  ts_mad: { name: '狂刀', type: 'atk', cost: [2, 2], rar: 'u', sch: '怒', tgt: 'one', icon: 'dadao',
    desc: u => `造成 ${V(u, 5, 6)} 伤害 3 次；每 2 点血气，每下 +1 伤害。`, play: (G, u, t) => G.hit(t, V(u, 5, 6) + Math.floor(G.qiN() / 2), 3) },
  ts_debt: { name: '旧账', type: 'atk', cost: [1, 1], rar: 'u', sch: '怒', tgt: 'one', icon: 'bayonet',
    desc: u => `造成等于你这场已经失去生命一半的伤害（至少 ${V(u, 6, 10)}）。`, play: (G, u, t) => G.hit(t, Math.max(V(u, 6, 10), Math.floor(G.lostN() / 2))) },
  ts_death: { name: '死斗', type: 'power', cost: [1, 0], rar: 'u', sch: '怒', icon: 'dadao',
    desc: () => '生命低于一半时，攻击牌 +3 伤害。', play: G => G.power('death', 3) },
  ts_noret: { name: '不归', type: 'skill', cost: [2, 1], rar: 'r', sch: '怒', ex: 1, icon: 'dadao',
    desc: () => '血气直接加满，抽 2。消耗。', play: G => { G.qi(8); G.draw(2); } },
  ts_onecut: { name: '一刀断', type: 'atk', cost: [3, 3], rar: 'r', sch: '怒', tgt: 'one', icon: 'dadao',
    desc: u => `造成 ${V(u, 20, 26)} 伤害；目标生命低于 30% 时翻倍。`, play: (G, u, t) => G.hit(t, V(u, 20, 26) * (t && t.hp < t.max * .3 ? 2 : 1)) },
  ts_war: { name: '血战', type: 'power', cost: [2, 1], rar: 'r', sch: '怒', icon: 'medkit',
    desc: () => '突击期间，每次攻击回复 2 生命。', play: G => G.power('war', 2) },
  // —— 守（扩充） ——
  ts_step: { name: '踏步', type: 'skill', cost: [0, 0], rar: 'c', sch: '守', icon: 'cover',
    desc: u => `获得 ${V(u, 4, 6)} 格挡，抽 1。`, play: (G, u) => { G.block(V(u, 4, 6)); G.draw(1); } },
  ts_rack: { name: '刀架', type: 'skill', cost: [1, 1], rar: 'c', sch: '守', icon: 'dadao',
    desc: u => `获得 ${V(u, 9, 12)} 格挡；身上有反击时再 +4。`, play: (G, u) => G.block(V(u, 9, 12) + (G.B.p.counter > 0 ? 4 : 0)) },
  ts_return: { name: '回刀', type: 'skill', cost: [1, 1], rar: 'c', sch: '守', icon: 'dadao',
    desc: u => `获得 ${V(u, 6, 8)} 格挡，反击 ${V(u, 6, 8)}。`, play: (G, u) => { G.block(V(u, 6, 8)); G.counter(V(u, 6, 8)); } },
  ts_wrap: { name: '缠布', type: 'skill', cost: [1, 1], rar: 'c', sch: '守', icon: 'cover',
    desc: u => `获得 ${V(u, 6, 9)} 格挡，血气 +1。`, play: (G, u) => { G.block(V(u, 6, 9)); G.qi(1); } },
  ts_unload: { name: '卸力', type: 'skill', cost: [1, 1], rar: 'u', sch: '守', icon: 'cover',
    desc: u => `获得 ${V(u, 8, 11)} 格挡，去掉自己身上的虚弱和易伤。`, play: (G, u) => { G.block(V(u, 8, 11)); G.clearSelf(); } },
  ts_clumsy: { name: '守拙', type: 'power', cost: [1, 0], rar: 'u', sch: '守', icon: 'cover',
    desc: () => '每获得 8 点格挡，血气 +1。', play: G => G.power('clumsy', 1) },
  ts_stance: { name: '扎马步', type: 'power', cost: [1, 0], rar: 'u', sch: '守', icon: 'cover',
    desc: () => '回合开始时，上回合剩下的格挡留一半。', play: G => G.power('stance', 1) },
  ts_hold: { name: '死守', type: 'skill', cost: [3, 2], rar: 'r', sch: '守', icon: 'cover',
    desc: () => '获得 30 格挡。', play: G => G.block(30) },
  ts_split: { name: '一刀两断', type: 'atk', cost: [2, 2], rar: 'r', sch: '守', tgt: 'one', icon: 'dadao',
    desc: u => `花掉全部格挡，造成等于格挡${V(u, ' 1.5 倍', ' 2 倍')}的伤害。`, play: (G, u, t) => { const b = G.blockN(); G.B.p.block = 0; G.hit(t, Math.floor(b * V(u, 1.5, 2))); } },
  // —— 通用（扩充） ——
  ts_ration: { name: '干粮', type: 'skill', cost: [0, 0], rar: 'c', sch: '通', ex: 1, icon: 'medkit',
    desc: u => `回复 ${V(u, 4, 6)} 生命。消耗。`, play: (G, u) => G.heal(V(u, 4, 6)) },
  ts_fake: { name: '佯攻', type: 'atk', cost: [0, 0], rar: 'c', sch: '通', tgt: 'one', icon: 'bayonet',
    desc: u => `造成 ${V(u, 5, 7)} 伤害，抽 1。`, play: (G, u, t) => { G.hit(t, V(u, 5, 7)); G.draw(1); } },
  ts_feud: { name: '家仇', type: 'power', cost: [0, 0], rar: 'u', sch: '通', icon: 'bayonet',
    desc: u => `每打倒一个敌人，血气 +${V(u, 2, 3)}。`, play: (G, u) => G.power('feud', V(u, 2, 3)) },
  ts_hot: { name: '血性方刚', type: 'power', cost: [1, 0], rar: 'u', sch: '通', icon: 'bayonet',
    desc: () => '每回合开始血气 +1。', play: G => G.power('hot', 1) },
  ts_society: { name: '大刀会', type: 'power', cost: [2, 1], rar: 'r', sch: '通', icon: 'dadao',
    desc: () => '攻击每下 +2 伤害，格挡牌 +2 格挡。', play: G => { G.str(2); G.dex(2); G.power('society', 1); } },
  ts_allout: { name: '豁出去', type: 'atk', cost: [3, 2], rar: 'r', sch: '通', tgt: 'one', icon: 'dadao',
    desc: () => '造成等于这场已经失去生命的伤害（最多 40）；失去 5 生命。', play: (G, u, t) => { G.hit(t, Math.min(40, G.lostN())); G.loseHp(5); } },
};
Object.values(CARDS_TS).forEach(d => { d.ch = 'tian'; });

function addQi(B, n) { const p = B.p; if (p.rage || n <= 0) return; const k = Math.min(QI_MAX, p.qi + n); if (k > p.qi) B.K.fx('hero', `血气+${k - p.qi}`, 'st'); p.qi = k; }
/* 血战：突击期间每次攻击回复 2 生命 */
const war = B => { if (B.p.rage && B.p.pw.war) B.G.heal(B.p.pw.war); };
const atkBonus = B => (B.p.rage ? 4 : 0) + (B.p.killBonus || 0) + (B.p.pw.death && B.R.hp < B.R.maxHp / 2 ? B.p.pw.death : 0);

export const MECH_TS = {
  init(B) { const p = B.p; p.qi = 0; p.rage = 0; p.killBonus = 0; p.charmUsed = 0; },
  turnStart(B) {
    const p = B.p; p.hurtN = 0; p.hurtT = 0;
    if (p.rage) { p.energy += 1; B.K.fx('hero', '突击：能量+1', 'st'); }
    if (p.nextE) { p.energy += p.nextE; p.nextE = 0; }
    if (p.pw.hot) addQi(B, p.pw.hot);
    const ctr = (p.pw.ctr || 0) + (p.pw.ctr2 || 0); if (ctr) p.counter += ctr;
    const coat = (p.pw.coat || 0) + (p.pw.coat2 || 0); if (coat) { p.block += coat; B.K.fx('hero', '+' + coat, 'blk'); }
  },
  turnEnd(B) { const p = B.p; if (p.rage) { p.rage--; if (!p.rage) { p.qi = 0; B.K.fx('hero', '突击结束', 'st'); } } },
  takenMul(B) { return B.p.rage ? 1.5 : 1; },
  onHurt(B, n) {
    const p = B.p; p.hurtT = 1; p.lost = (p.lost || 0) + n;
    if ((p.hurtN || 0) < 3) { p.hurtN = (p.hurtN || 0) + 1; addQi(B, 1 + (p.pw.bloodqi ? 1 : 0)); }
    if (p.pw.bloodqi > 1) { p.block += 2; }
    /* 五大仙护身符：生命第一次低于一半时获得 12 格挡（敬畏 ≥3 翻倍） */
    if (!p.charmUsed && (B.R.relics || []).includes('charm') && B.R.hp < B.R.maxHp / 2) { p.charmUsed = 1; const g = (B.R.awe || 0) >= 3 ? 24 : 12; p.block += g; B.K.fx('hero', `护身符 +${g}`, 'blk'); }
  },
  onKill(B) { if (B.p.pw.boss) B.p.killBonus = (B.p.killBonus || 0) + 2; if (B.p.pw.feud) addQi(B, B.p.pw.feud); },
  /* 守拙：每攒够 8 点格挡，血气 +1 */
  onBlock(B, n) { const p = B.p; if (!p.pw.clumsy) return; p.blkAcc = (p.blkAcc || 0) + n; while (p.blkAcc >= 8) { p.blkAcc -= 8; addQi(B, 1); } },
  G(B) {
    const K = B.K;
    return {
      rage: () => B.p.rage > 0, qi: n => addQi(B, n), qiN: () => B.p.qi, qiClear: () => { B.p.qi = 0; },
      hurtThisTurn: () => !!B.p.hurtT, lowHp: () => B.R.hp < B.R.maxHp / 2, blockN: () => B.p.block,
      nextEnergy: n => { B.p.nextE = (B.p.nextE || 0) + n; }, awe: () => B.R.awe || 0, lostN: () => B.p.lost || 0,
      hit: (t, d, hits = 1, pierce) => { for (let i = 0; i < hits; i++) { const a = K.alive(); if (!a.length) break; const tg = t && !t.dead ? t : a[0]; K.hitEnemy(tg, K.atkMod(tg, d + atkBonus(B)), pierce); war(B); } },
      hitAll: d => { for (const e of K.alive()) K.hitEnemy(e, K.atkMod(e, d + atkBonus(B))); war(B); },
    };
  },
  actions(B) {
    const p = B.p, ok = p.qi >= QI_MAX && !p.rage;
    return [{ id: 'rage', key: 'R', label: p.rage ? `突击中 <small>还剩 ${p.rage} 回合</small>` : `突击 <small>血气 ${p.qi}/${QI_MAX}</small>`, dis: ok ? null : '血气不够', hot: ok, urgent: ok }];
  },
  act(B, id) { const p = B.p; if (id !== 'rage' || p.qi < QI_MAX || p.rage) return false; p.rage = RAGE_TURNS + B.K.sum('rageTurns'); p.energy += 1; B.K.fx('hero', '突击！', 'st'); return true; },
  info(B) {
    const p = B.p;
    return { main: `<div class="ammo qi ${p.rage ? 'rage' : ''}" data-k="血气"><span class="pips">${Array.from({ length: QI_MAX }, (_, i) => `<i class="${i < p.qi || p.rage ? 'f' : ''}"></i>`).join('')}</span><b>${p.rage ? `突击 ${p.rage}` : `血气 ${p.qi}`}</b></div>`,
      chips: `${p.counter ? `<b class="feelc" data-k="反击">反击 ${p.counter}</b>` : ''}`, powers: { bloodqi: '血性', boss: '大当家', ctr: '反手', coat: '厚棉袄', coat2: '不动如山', death: '死斗', war: '血战', clumsy: '守拙', stance: '扎马步', feud: '家仇', hot: '血性方刚', society: '大刀会' } };
  },
  enemyChips() { return ''; },
  shotKind() { return null; },
  rules: [
    '<b>血气</b>：田守义每次失去生命 +1（每回合最多 3 次），有的牌也加，最多 8。',
    '<b>突击</b>：血气攒满 8 点，点右边的「突击」：本回合和接下来 2 个回合，攻击牌 +4 伤害、每回合 +1 能量，但受到的伤害 +50%；牌上【怒】的效果生效。结束后血气清零。',
    '<b>反击</b>：这回合敌人每打你一下，你就还它反击值的伤害。',
    '<b>两套打法</b>：怒——卖血攒血气，突击爆发；守——格挡和反击，硬扛着打。',
  ],
  dbg: [['血气满', B => { B.p.qi = QI_MAX; }]],
  scryBot() { return []; },
};

export const TUT_TS = [
  { id: 'qi', on: 'render', when: B => B.p.qi >= QI_MAX && !B.p.rage, hint: '血气满了！点右边的「突击」：三个回合里刀更狠、能量更多，可挨打也更疼。' },
];

export const TIAN = {
  id: 'tian', name: '田守义', title: '大刀', hp: 85, blurb: '站最前面硬碰硬。挨打攒血气，攒满了就突击。',
  starter: ['ts_chop', 'ts_chop', 'ts_chop', 'ts_chop', 'defend', 'defend', 'defend', 'defend', 'ts_guard', 'ts_risk'],
  startRelic: 'charm', mech: MECH_TS, kw: KW_TS, tut: TUT_TS, lang: { ja: 0, ru: 0, slang: 1 },
  art: { dir: 'tian', frames: true, lihui: true, fr: { cw: 347, ch: 325, ax: 227, sw: 190, sh: 306 }, h: 258, hTouch: 243 },
};
