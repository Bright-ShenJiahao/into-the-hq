// 角色模块：陈默 · 飞刀（26 岁）。核心机制只有一个：飞刀（照通往顶端顾清寒的飞剑）。
// 飞刀带在身上最多 6 把：留在身上时，每把让攻击牌的第一下 +1 伤害，回合结束每 2 把给 1 点格挡；
// 扔出去时，每把单独造成伤害、给目标 1 层流血，扔出去就不在身上了。
// 两套打法：留刀（刀留在身上吃加成）/ 放血（刀扔出去，叠流血）。飞刀没有声音，第二章不加可疑度；只有手枪牌会出声。
import { V } from './util.js';

export const KNIFE_MAX = 6, KNIFE_DMG = 4;
export const KW_CM = {
  '飞刀': '陈默身上带的刀，最多 6 把。留在身上：每把让攻击牌第一下 +1 伤害，回合结束每 2 把给 1 点格挡。扔出去：每把单独造成伤害并给 1 层流血。飞刀没有声音。',
  '流血': '敌人行动前失去等于层数的生命（不吃格挡），然后层数 -2。最多 12 层。对有装甲的敌人无效。',
  '留刀': '陈默的一套打法：刀留在身上，攻击和格挡越来越强。',
  '放血': '陈默的一套打法：把刀扔出去，给敌人叠流血。',
};

// d.blade：攻击牌，第一下吃身上飞刀的加成
export const CARDS_CM = {
  // —— 初始 ——
  cm_cut: { name: '短刀', type: 'atk', cost: [1, 1], rar: 'basic', sch: '刀', tgt: 'one', blade: 1, icon: 'knife',
    desc: u => `造成 ${V(u, 6, 9)} 伤害（吃飞刀加成）。`, play: (G, u, t) => G.cut(t, V(u, 6, 9)) },
  cm_draw: { name: '抽刀', type: 'skill', cost: [1, 1], rar: 'basic', sch: '刀', icon: 'knife',
    desc: u => `得到 ${V(u, 2, 3)} 把飞刀，获得 3 格挡。`, play: (G, u) => { G.addKnife(V(u, 2, 3)); G.block(3); } },
  cm_flick: { name: '甩手刀', type: 'skill', cost: [0, 0], rar: 'basic', sch: '血', tgt: 'one', icon: 'knife',
    desc: u => `扔出 1 把飞刀（${V(u, 4, 6)} 伤害，流血 +1）；抽 1。`, play: (G, u, t) => { G.throwK(t, 1, V(u, 4, 6)); G.draw(1); } },
  // —— 留刀 ——
  cm_pouch: { name: '刀囊', type: 'skill', cost: [1, 1], rar: 'c', sch: '刀', icon: 'belt',
    desc: u => `得到 ${V(u, 3, 4)} 把飞刀。`, play: (G, u) => G.addKnife(V(u, 3, 4)) },
  cm_return: { name: '回手刀', type: 'atk', cost: [0, 0], rar: 'c', sch: '刀', tgt: 'one', blade: 1, icon: 'knife',
    desc: u => `造成 ${V(u, 4, 6)} 伤害（吃飞刀加成）；得到 1 把飞刀。`, play: (G, u, t) => { G.cut(t, V(u, 4, 6)); G.addKnife(1); } },
  cm_quick: { name: '快刀', type: 'atk', cost: [1, 1], rar: 'c', sch: '刀', tgt: 'one', blade: 1, icon: 'knife',
    desc: u => `造成 ${V(u, 4, 5)} 伤害 2 次（第一下吃飞刀加成）。`, play: (G, u, t) => G.cut(t, V(u, 4, 5), 2) },
  cm_glint: { name: '刀光', type: 'skill', cost: [1, 1], rar: 'c', sch: '刀', icon: 'cover',
    desc: u => `获得 ${V(u, 6, 8)} 格挡，每把飞刀再 +1。`, play: (G, u) => G.block(V(u, 6, 8) + G.knives()) },
  cm_flow: { name: '连环刀', type: 'atk', cost: [1, 1], rar: 'u', sch: '刀', tgt: 'one', icon: 'knife',
    desc: u => `造成 ${V(u, 2, 3)} 伤害，次数等于飞刀数（至少 1 次，不用掉飞刀）。`, play: (G, u, t) => G.cut(t, V(u, 2, 3), Math.max(1, G.knives()), 1) },
  cm_intent: { name: '刀意', type: 'power', cost: [1, 1], rar: 'u', sch: '刀', icon: 'belt',
    desc: u => `每回合开始得到 ${V(u, 1, 2)} 把飞刀。`, play: (G, u) => G.power('gen', V(u, 1, 2)) },
  cm_puttee: { name: '绑腿', type: 'power', cost: [1, 0], rar: 'u', sch: '刀', icon: 'cover',
    desc: () => '回合结束时每把飞刀给 1 点格挡（原来是每 2 把 1 点）。', play: G => G.power('ward', 1) },
  cm_sleeves: { name: '满袖飞刀', type: 'atk', cost: [2, 2], rar: 'r', sch: '刀', tgt: 'one', icon: 'knife',
    desc: u => `扔出全部飞刀，每把 ${V(u, 7, 9)} 伤害、流血 +1。`, play: (G, u, t) => G.throwK(t, 99, V(u, 7, 9)) },
  cm_boomer: { name: '回旋刀', type: 'skill', cost: [1, 1], rar: 'r', sch: '刀', tgt: 'one', icon: 'knife',
    desc: u => `扔出 2 把飞刀（每把 ${V(u, 5, 7)} 伤害），回合结束时这 2 把飞回身上。`, play: (G, u, t) => { const k = G.throwK(t, 2, V(u, 5, 7)); G.boomer(k); } },
  // —— 放血 ——
  cm_slash: { name: '划开', type: 'atk', cost: [1, 1], rar: 'c', sch: '血', tgt: 'one', blade: 1, icon: 'knife',
    desc: u => `造成 ${V(u, 6, 8)} 伤害，流血 +${V(u, 3, 4)}。`, play: (G, u, t) => { G.cut(t, V(u, 6, 8)); G.bleed(t, V(u, 3, 4)); } },
  cm_sleeve: { name: '袖箭', type: 'atk', cost: [0, 0], rar: 'c', sch: '血', tgt: 'one', icon: 'round',
    desc: u => `造成 ${V(u, 3, 5)} 伤害，流血 +1。`, play: (G, u, t) => { G.melee(t, V(u, 3, 5)); G.bleed(t, 1); } },
  cm_finish: { name: '补刀', type: 'atk', cost: [1, 1], rar: 'c', sch: '血', tgt: 'one', icon: 'knife',
    desc: u => `造成 ${V(u, 7, 10)} 伤害；目标流血 ≥5 时翻倍。`, play: (G, u, t) => G.melee(t, V(u, 7, 10) * ((t && (t.st.bleed || 0) >= 5) ? 2 : 1)) },
  cm_pair: { name: '飞刀', type: 'skill', cost: [1, 1], rar: 'c', sch: '血', tgt: 'one', icon: 'knife',
    desc: u => `扔出 ${V(u, 2, 3)} 把飞刀（每把 4 伤害，流血 +1）。`, play: (G, u, t) => G.throwK(t, V(u, 2, 3), KNIFE_DMG) },
  cm_tear: { name: '撕开伤口', type: 'atk', cost: [1, 1], rar: 'u', sch: '血', tgt: 'one', icon: 'bayonet',
    desc: u => `造成等于目标流血层数${V(u, '', ' +4')}的伤害（不清除流血）。`, play: (G, u, t) => G.melee(t, (t ? t.st.bleed || 0 : 0) + V(u, 0, 4)) },
  cm_letblood: { name: '放血', type: 'skill', cost: [1, 1], rar: 'u', sch: '血', tgt: 'one', icon: 'medkit',
    desc: u => `目标流血翻倍${V(u, '，再 +2', '，再 +4')}（最多 12 层）。`, play: (G, u, t) => { if (t) G.bleed(t, (t.st.bleed || 0) + V(u, 2, 4)); } },
  cm_rain: { name: '刀雨', type: 'skill', cost: [2, 2], rar: 'u', sch: '血', icon: 'knife',
    desc: u => `对所有敌人造成 ${V(u, 4, 6)} 伤害，流血 +2。`, play: (G, u) => { G.meleeAll(V(u, 4, 6)); G.alive().forEach(e => G.bleed(e, 2)); } },
  cm_debt: { name: '血债', type: 'power', cost: [2, 1], rar: 'u', sch: '血', icon: 'medkit',
    desc: () => '流血每回合只减 1。', play: G => G.power('bleedSlow', 1) },
  cm_flood: { name: '血流不止', type: 'atk', cost: [2, 2], rar: 'r', sch: '血', icon: 'bayonet',
    desc: u => `对每个敌人造成等于它流血层数 ×${V(u, 2, 3)} 的伤害。`, play: (G, u) => G.alive().forEach(e => G.melee(e, (e.st.bleed || 0) * V(u, 2, 3))) },
  cm_tokyo: { name: '乘隙追击', type: 'power', cost: [1, 1], rar: 'r', sch: '血', icon: 'cover',
    desc: u => `敌人受到流血伤害时，抽 1 张牌。每回合最多触发 ${V(u, 1, 2)} 次。`, play: (G, u) => G.power('tokyo', V(u, 1, 2)) },
  // —— 通用 ——
  cm_halt: { name: '「（日语）站住！」', type: 'skill', cost: [1, 1], rar: 'c', sch: '通', tgt: 'one', icon: 'helmet',
    desc: u => `冒充宪兵喝住对方：目标虚弱 2，获得 ${V(u, 5, 8)} 格挡。`, play: (G, u, t) => { G.weak(t, 2); G.block(V(u, 5, 8)); } },
  cm_nambu: { name: '南部手枪', type: 'atk', cost: [1, 1], rar: 'c', sch: '通', tgt: 'one', icon: 'pistol',
    desc: u => `造成 ${V(u, 9, 12)} 伤害（会出声）。`, play: (G, u, t) => { G.melee(t, V(u, 9, 12)); G.noise(1); } },
  cm_dodge: { name: '闪身', type: 'skill', cost: [1, 1], rar: 'c', sch: '通', icon: 'cover',
    desc: u => `获得 ${V(u, 6, 9)} 格挡，抽 1。`, play: (G, u) => { G.block(V(u, 6, 9)); G.draw(1); } },
  cm_sever: { name: '断绝', type: 'skill', cost: [1, 1], rar: 'u', sch: '通', ex: 1, icon: 'binoc',
    desc: u => `抽 ${V(u, 3, 4)}。消耗。（他和父亲断绝关系的那一天）`, play: (G, u) => G.draw(V(u, 3, 4)) },
  // —— 留刀（扩充） ——
  cm_hide: { name: '藏刀', type: 'skill', cost: [1, 1], rar: 'c', sch: '刀', icon: 'belt',
    desc: u => `得到 ${V(u, 2, 3)} 把飞刀，获得 ${V(u, 6, 8)} 格挡。`, play: (G, u) => { G.addKnife(V(u, 2, 3)); G.block(V(u, 6, 8)); } },
  cm_sheath: { name: '刀鞘', type: 'skill', cost: [0, 0], rar: 'c', sch: '刀', icon: 'belt',
    desc: u => `得到 ${V(u, 1, 2)} 把飞刀，抽 1。`, play: (G, u) => { G.addKnife(V(u, 1, 2)); G.draw(1); } },
  cm_feint: { name: '佯退', type: 'skill', cost: [0, 0], rar: 'c', sch: '刀', icon: 'cover',
    desc: u => `获得 ${V(u, 4, 6)} 格挡，得到 1 把飞刀。`, play: (G, u) => { G.block(V(u, 4, 6)); G.addKnife(1); } },
  cm_hone: { name: '磨刀', type: 'skill', cost: [1, 1], rar: 'c', sch: '刀', ex: 1, icon: 'knife',
    desc: u => `这场战斗你的攻击每下 +${V(u, 2, 3)} 伤害。消耗。`, play: (G, u) => G.str(V(u, 2, 3)) },
  cm_array: { name: '刀阵', type: 'atk', cost: [2, 2], rar: 'u', sch: '刀', tgt: 'one', blade: 1, icon: 'knife',
    desc: u => `造成 ${V(u, 4, 5)} 伤害 3 次；身上每有 2 把飞刀，多打 1 次（第一下吃飞刀加成）。`, play: (G, u, t) => G.cut(t, V(u, 4, 5), 3 + Math.floor(G.knives() / 2)) },
  cm_shadow: { name: '无影', type: 'atk', cost: [1, 1], rar: 'u', sch: '刀', tgt: 'one', blade: 1, icon: 'knife',
    desc: u => `造成 ${V(u, 8, 11)} 伤害（吃飞刀加成）；身上飞刀满 6 把时翻倍。`, play: (G, u, t) => G.cut(t, V(u, 8, 11) * (G.knives() >= KNIFE_MAX ? 2 : 1)) },
  cm_quickhand: { name: '快手', type: 'power', cost: [1, 0], rar: 'u', sch: '刀', icon: 'belt',
    desc: () => '每回合第一张攻击牌，身上每把飞刀再 +1 伤害。', play: G => G.power('quickH', 1) },
  cm_wind: { name: '出手如风', type: 'power', cost: [2, 1], rar: 'r', sch: '刀', icon: 'belt',
    desc: () => '飞刀给攻击牌的加成翻倍（每把 +2）。', play: G => G.power('wind', 1) },
  cm_chain: { name: '连环飞刀', type: 'atk', cost: [3, 3], rar: 'r', sch: '刀', tgt: 'one', blade: 1, icon: 'knife',
    desc: u => `造成 ${V(u, 3, 4)} 伤害 6 次（第一下吃飞刀加成）。`, play: (G, u, t) => G.cut(t, V(u, 3, 4), 6) },
  // —— 放血（扩充） ——
  cm_dagger: { name: '匕首', type: 'atk', cost: [0, 0], rar: 'c', sch: '血', tgt: 'one', icon: 'knife',
    desc: u => `造成 4 伤害，流血 +${V(u, 2, 3)}。`, play: (G, u, t) => { G.melee(t, 4); G.bleed(t, V(u, 2, 3)); } },
  cm_wound: { name: '暗伤', type: 'skill', cost: [1, 1], rar: 'c', sch: '血', tgt: 'one', icon: 'medkit',
    desc: u => `流血 +${V(u, 5, 7)}。`, play: (G, u, t) => G.bleed(t, V(u, 5, 7)) },
  cm_lime: { name: '撒石灰', type: 'skill', cost: [1, 0], rar: 'c', sch: '血', icon: 'lime',
    desc: () => '所有敌人虚弱 1，流血 +1。', play: G => G.alive().forEach(e => { G.weak(e, 1); G.bleed(e, 1); }) },
  cm_dark: { name: '暗处', type: 'skill', cost: [1, 1], rar: 'c', sch: '血', icon: 'cover',
    desc: u => `获得 ${V(u, 5, 8)} 格挡；每有一个流血的敌人，再 +3。`, play: (G, u) => G.block(V(u, 5, 8) + 3 * G.alive().filter(e => e.st.bleed).length) },
  cm_down: { name: '放倒', type: 'atk', cost: [1, 1], rar: 'u', sch: '血', tgt: 'one', icon: 'knife',
    desc: u => `造成 ${V(u, 6, 8)} 伤害；目标每有 3 层流血，多打 1 次。`, play: (G, u, t) => { const n = 1 + Math.floor((t ? t.st.bleed || 0 : 0) / 3); for (let i = 0; i < n && t && !t.dead; i++) G.melee(t, V(u, 6, 8)); } },
  cm_spread: { name: '余血', type: 'power', cost: [1, 0], rar: 'u', sch: '血', icon: 'medkit',
    desc: () => '敌人倒下时，它身上的流血转给另一个随机敌人。', play: G => G.power('spread', 1) },
  cm_seeblood: { name: '见血', type: 'power', cost: [1, 1], rar: 'u', sch: '血', icon: 'medkit',
    desc: u => `每回合第一次给敌人加流血时，多加 ${V(u, 2, 3)} 层。`, play: (G, u) => G.power('seeb', V(u, 2, 3)) },
  cm_rend: { name: '割裂', type: 'atk', cost: [2, 2], rar: 'r', sch: '血', tgt: 'one', icon: 'bayonet',
    desc: u => `造成 ${V(u, 8, 11)} 伤害，流血 +${V(u, 6, 8)}。`, play: (G, u, t) => { G.melee(t, V(u, 8, 11)); G.bleed(t, V(u, 6, 8)); } },
  cm_silent: { name: '无声戏', type: 'atk', cost: [3, 3], rar: 'r', sch: '血', tgt: 'one', icon: 'bayonet',
    desc: u => `造成 ${V(u, 5, 6)} 伤害 4 次，每下流血 +1。`, play: (G, u, t) => { for (let i = 0; i < 4; i++) { const a = G.alive(); if (!a.length) break; const tg = t && !t.dead ? t : a[0]; G.melee(tg, V(u, 5, 6)); if (!tg.dead) G.bleed(tg, 1); } } },
  // —— 通用（扩充） ——
  cm_signal: { name: '暗号', type: 'skill', cost: [0, 0], rar: 'c', sch: '通', icon: 'letter',
    desc: u => `抽 1；下回合多抽 ${V(u, 1, 2)}。`, play: (G, u) => { G.draw(1); G.nextDraw(V(u, 1, 2)); } },
  cm_disguise: { name: '伪装', type: 'skill', cost: [1, 1], rar: 'u', sch: '通', icon: 'helmet',
    desc: u => `获得 ${V(u, 6, 9)} 格挡；本回合敌人第一次打你，伤害减半。`, play: (G, u) => { G.block(V(u, 6, 9)); G.halfHit(); } },
  cm_oilstone: { name: '油石', type: 'power', cost: [1, 1], rar: 'u', sch: '通', icon: 'knife',
    desc: u => `每回合第一下攻击 +${V(u, 3, 5)} 伤害。`, play: (G, u) => G.power('whet', V(u, 3, 5)) },
  cm_letter: { name: '家书', type: 'skill', cost: [0, 0], rar: 'r', sch: '通', ex: 1, icon: 'letter',
    desc: u => `回复 ${V(u, 3, 5)} 生命，得到 2 把飞刀。消耗。（母亲托人捎来的信）`, play: (G, u) => { G.heal(V(u, 3, 5)); G.addKnife(2); } },
};
Object.values(CARDS_CM).forEach(d => { d.ch = 'chenmo'; });

const kn = B => B.p.knife || 0;
function addKnife(B, n) { const a = kn(B), b = Math.min(KNIFE_MAX, a + n); if (b > a) B.K.fx('hero', `飞刀+${b - a}`, 'st'); B.p.knife = b; }

export const MECH_CM = {
  init(B) { B.p.knife = 0; B.p.boomer = 0; },
  turnStart(B) { B.p.tokyoN = 0; B.p.seebUsed = 0; if (B.p.pw.gen) addKnife(B, B.p.pw.gen); },
  /* 见血：每回合第一次加流血多加几层 */
  bleedMod(B, e, n) { const p = B.p; if (p.pw.seeb && !p.seebUsed) { p.seebUsed = 1; return n + p.pw.seeb; } return n; },
  /* 余血：敌人倒下，流血转给另一个随机敌人 */
  onKill(B, e) { const n = e.st.bleed || 0; if (!B.p.pw.spread || !n) return; const a = B.K.alive(); if (a.length) B.G.bleed(a[Math.floor(B.rng() * a.length)], n); },
  turnEnd(B) {
    const p = B.p, g = p.pw.ward ? kn(B) : Math.floor(kn(B) / 2);
    if (g) { p.block += g; B.K.fx('hero', '+' + g, 'blk'); }
    if (p.boomer) { addKnife(B, p.boomer); p.boomer = 0; }
  },
  onBleed(B) { const p = B.p; if (p.pw.tokyo && (p.tokyoN || 0) < p.pw.tokyo) { p.tokyoN = (p.tokyoN || 0) + 1; B.K.drawCards(1); } },
  G(B) {
    const K = B.K;
    return {
      knives: () => kn(B), addKnife: n => addKnife(B, n), boomer: n => { B.p.boomer += n; },
      /* 近身攻击：第一下吃身上飞刀的加成 */
      cut: (t, d, hits = 1) => {
        const p = B.p, first = kn(B) * (p.pw.wind ? 2 : 1) + (p.pw.quickH && !p.atkT ? kn(B) : 0); /* 出手如风：加成翻倍；快手：这回合第一张攻击牌再加一份 */
        for (let i = 0; i < hits; i++) { const a = K.alive(); if (!a.length) break; const tg = t && !t.dead ? t : a[0]; K.hitEnemy(tg, K.atkMod(tg, d + (i === 0 ? first : 0))); } },
      /* 扔出 k 把：每把单独打、流血 +1；返回实际扔出几把 */
      throwK: (t, k, d) => {
        k = Math.min(k, kn(B)); if (!k) { K.fx('hero', '没刀了', 'st'); return 0; }
        B.p.knife -= k;
        d += K.sum('knifeBonus'); /* 开过刃的飞刀 */
        for (let i = 0; i < k; i++) { const a = K.alive(); if (!a.length) break; const tg = t && !t.dead ? t : a[0]; K.hitEnemy(tg, K.atkMod(tg, d)); if (!tg.dead) B.G.bleed(tg, 1); }
        return k;
      },
    };
  },
  preview(B, d, x) { return x; },
  info(B) {
    const k = kn(B);
    return { main: `<div class="ammo knives" data-k="飞刀"><span class="pips">${Array.from({ length: KNIFE_MAX }, (_, i) => `<i class="${i < k ? 'f' : ''}"></i>`).join('')}</span><b>飞刀 ${k}</b></div>`,
      chips: '', powers: { gen: '刀意', ward: '绑腿', bleedSlow: '血债', tokyo: '乘隙追击', quickH: '快手', wind: '出手如风', spread: '余血', seeb: '见血' } };
  },
  enemyChips() { return ''; },
  shotKind() { return null; },
  rules: [
    '<b>飞刀</b>：陈默身上最多带 6 把。留在身上，每把让攻击牌第一下 +1 伤害，回合结束每 2 把给 1 点格挡；扔出去，每把单独造成伤害、流血 +1。',
    '<b>流血</b>：敌人行动前失去等于层数的生命（不吃格挡），然后层数 -2；最多 12 层；对有装甲的敌人无效。',
    '<b>两套打法</b>：留刀——刀留在身上越打越硬；放血——把刀扔出去给敌人叠流血。',
    '<b>无声</b>：飞刀和刀没有枪声，第二章不加可疑度；只有手枪牌会出声。',
  ],
  dbg: [['飞刀满', B => { B.p.knife = KNIFE_MAX; }], ['全体流血 8', B => B.K.alive().forEach(e => B.G.bleed(e, 8))]],
  scryBot() { return []; },
};

export const TUT_CM = [
  { id: 'knife', on: 'render', when: B => B.p.knife > 0, hint: '身上的飞刀：留着，攻击第一下每把 +1；扔出去，每把打一下、给 1 层流血。' },
  { id: 'bleed', on: 'render', when: B => B.en.some(e => !e.dead && e.st.bleed), hint: '流血的敌人行动前先掉血，然后层数 -2。有装甲的不流血。' },
];

export const CHENMO = {
  id: 'chenmo', name: '陈默', title: '飞刀手', hp: 66, blurb: '飞刀无声。刀留在身上越打越硬，扔出去让敌人流血。',
  starter: ['cm_cut', 'cm_cut', 'cm_cut', 'cm_cut', 'defend', 'defend', 'defend', 'defend', 'cm_draw', 'cm_flick'],
  startRelic: 'legknife', mech: MECH_CM, kw: KW_CM, tut: TUT_CM, lang: { ja: 3, ru: 2 },
  art: { dir: 'chenmo', frames: true, lihui: true, fr: { cw: 339, ch: 334, ax: 179, sw: 121, sh: 332 }, h: 252, hTouch: 237 },
};

