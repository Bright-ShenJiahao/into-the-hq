// 角色模块：韩松 · 神枪手（代号「雪貂」）。角色专属的牌、资源（弹仓、枪感、标尺）、按钮和界面都在这一个文件里。
// 以后加田守义、陈默等，照这个文件的格式各写一个，在 data.js 里登记即可，战斗引擎不用改。
// 纯数据和规则，不碰页面（机器人模拟直接用）。
import { V } from './util.js';
export { V };
export const MAG = 8;      // 弹仓上限
export const BAYONET = 5;  // 空仓拼刺伤害
export const FEEL_MAX = 6; // 枪感上限
export const MARK_MAX = 5; // 标尺上限

export const KW_HS = {
  '可用弹数': '韩松随手能打的子弹，最多 8 发，所有枪械牌都从这里扣。这是游戏抽象，真实各枪的弹容见图鉴「术语」。',
  '装填': '1 费，把可用弹数补满。',
  '拼刺': '子弹打光了，枪械牌改为拼刺：只造成 5 伤害，牌上其他效果不生效。',
  '标尺': '叠在敌人身上，最多 5 层。每层让狙击牌每发 +1 伤害。',
  '枪感': '每打出一张枪械牌 +1（最多 6），回合结束 -1。每 2 点枪感，冲锋枪牌和手枪牌每发 +1 伤害。',
  '狙击牌': '标着「狙击」的枪械牌，吃标尺加成。',
  '冲锋枪牌': '标着「冲锋枪」的枪械牌，吃枪感加成。',
};

// ---------- 卡牌 ----------
// sch 流派：狙 狙击 / 冲 冲锋枪 / 手 手枪 / 通 通用。gun=枪械牌（每发扣 1 颗子弹；空仓时变拼刺）
// sh(u) 射击参数：n 发数，d 每发伤害，pm 每层标尺额外加伤，use 消耗标尺层数('all')，ap 对装甲加成（无视装甲），pierce 无视格挡，exe 斩杀线，all 每个敌人各打 n 发，rand 随机目标，mag 打光弹仓
// desc(u, f)：f(x) 把基础伤害换成当前实际伤害（战斗里显示绿色）
// extra(G,u,t,res)：射击之外的效果；res.bayonet 拼刺，res.kill 击杀主目标
export const CARDS_HS = {
  // —— 初始 ——
  note: { name: '驳壳枪', type: 'atk', cost: [1, 1], rar: 'basic', sch: '手', tgt: 'one', gun: 1,
    sh: u => ({ n: 1, d: V(u, 6, 9) }), desc: (u, f) => `射击 1 发，${f(V(u, 6, 9))} 伤害。` },

  shoot: { name: '据枪', type: 'atk', cost: [1, 1], rar: 'basic', sch: '狙', tgt: 'one', gun: 1,
    sh: u => ({ n: 1, d: V(u, 9, 12) }), desc: (u, f) => `射击 1 发，${f(V(u, 9, 12))} 伤害。` },
  barrage: { name: '扫射', type: 'atk', cost: [1, 1], rar: 'basic', sch: '冲', tgt: 'one', gun: 1,
    sh: u => ({ n: 3, d: V(u, 3, 4) }), desc: (u, f) => `射击 3 发，每发 ${f(V(u, 3, 4))} 伤害。` },
  // —— 狙击 ——
  high: { name: '冷枪', type: 'atk', cost: [0, 0], rar: 'c', sch: '狙', tgt: 'one', gun: 1,
    sh: u => ({ n: 1, d: V(u, 5, 7) }), pre: (G, u, t) => (t && !G.marks(t) ? 1 : 0),
    extra: (G, u, t, res) => { if (res.pre && t && !t.dead) G.mark(t, V(u, 2, 3)); },
    desc: (u, f) => `射击 1 发，${f(V(u, 5, 7))} 伤害；若目标没有标尺，标尺 +${V(u, 2, 3)}。` },
  crack: { name: '穿甲弹', type: 'atk', cost: [1, 1], rar: 'c', sch: '狙', tgt: 'one', gun: 1,
    sh: u => ({ n: 1, d: V(u, 8, 11), ap: .5, pierce: 1 }), desc: (u, f) => `射击 1 发，${f(V(u, 8, 11))} 伤害；无视格挡和装甲，对装甲目标 +50%。` },
  h_lockon: { name: '爆头', type: 'atk', cost: [1, 1], rar: 'u', sch: '狙', tgt: 'one', gun: 1,
    sh: u => ({ n: 1, d: V(u, 8, 11), exe: V(u, .3, .35) }), desc: (u, f) => `射击 1 发，${f(V(u, 8, 11))} 伤害；目标生命低于 ${V(u, 30, 35)}% 时翻倍。` },
  refrain: { name: '致命距离', type: 'atk', cost: [1, 1], rar: 'u', sch: '狙', tgt: 'one', gun: 1,
    sh: u => ({ n: 1, d: 6, pm: V(u, 2, 3), use: 1 }), desc: (u, f) => `射击 1 发，${f(6)} 伤害，每层标尺再 +${V(u, 2, 3)}；消耗 1 层标尺。` },
  h_ex: { name: '一枪一命', type: 'atk', cost: [2, 2], rar: 'u', sch: '狙', tgt: 'one', gun: 1,
    sh: u => ({ n: 1, d: 8, pm: V(u, 3, 4), use: 'all' }), extra: (G, u, t, res) => { if (res.kill && !res.bayonet) G.addAmmo(2); },
    desc: (u, f) => `射击 1 发，${f(8)} 伤害，每层标尺再 +${V(u, 3, 4)}；消耗全部标尺。击杀返还 2 发子弹。` },
  h_ricochet: { name: '最后一发', type: 'atk', cost: [1, 1], rar: 'r', sch: '狙', tgt: 'one', gun: 1, last: 1,
    sh: u => ({ n: 1, d: V(u, 22, 28) }), extra: (G, u, t) => { if (t && !t.dead) G.mark(t, 1); },
    desc: (u, f) => `子弹刚好剩 1 发时才能打出：射击 1 发，${f(V(u, 22, 28))} 伤害；标尺 +1。` },
  h_shells: { name: '反器材', type: 'atk', cost: [2, 2], rar: 'r', sch: '狙', tgt: 'one', gun: 1,
    sh: u => ({ n: 1, d: V(u, 14, 18), ap: 1, pierce: 1 }), desc: (u, f) => `射击 1 发，${f(V(u, 14, 18))} 伤害；无视格挡和装甲，对装甲目标翻倍。` },
  echo: { name: '测距', type: 'skill', cost: [1, 1], rar: 'c', sch: '狙', tgt: 'one',
    desc: u => `标尺 +${V(u, 2, 3)}；抽 1。`, play: (G, u, t) => { G.mark(t, V(u, 2, 3)); G.draw(1); } },
  standby: { name: '屏息', type: 'skill', cost: [1, 1], rar: 'c', sch: '狙',
    desc: u => `获得 ${V(u, 7, 10)} 格挡；本回合下一张狙击牌 +${V(u, 5, 7)} 伤害。`, play: (G, u) => { G.block(V(u, 7, 10)); G.nextSniper(V(u, 5, 7)); } },
  skip: { name: '测风', type: 'skill', cost: [0, 0], rar: 'c', sch: '狙', tgt: 'one',
    desc: u => `标尺 +${V(u, 1, 2)}；本回合下一张狙击牌 +${V(u, 3, 4)} 伤害。`, play: (G, u, t) => { G.mark(t, V(u, 1, 2)); G.nextSniper(V(u, 3, 4)); } },
  h_scope: { name: '瞄准镜', type: 'power', cost: [1, 1], rar: 'u', sch: '狙',
    desc: u => `每回合第一张狙击牌 +${V(u, 4, 6)} 伤害，并给目标标尺 +${V(u, 1, 2)}。`, play: (G, u) => G.power('scope', [V(u, 4, 6), V(u, 1, 2)]) },
  lowf: { name: '观察', type: 'skill', cost: [0, 0], rar: 'u', sch: '狙',
    desc: u => `抽 ${V(u, 1, 2)}；若有敌人标尺 ≥3，再抽 1。`, play: (G, u) => { G.draw(V(u, 1, 2)); if (G.alive().some(e => G.marks(e) >= 3)) G.draw(1); } },
  // —— 冲锋枪 ——
  burst: { name: '连发', type: 'atk', cost: [1, 1], rar: 'c', sch: '冲', tgt: 'one', gun: 1,
    sh: u => ({ n: V(u, 2, 3), d: 4 }), extra: G => G.feel(1), desc: (u, f) => `射击 ${V(u, 2, 3)} 发，每发 ${f(4)} 伤害；枪感再 +1。` },
  spread: { name: '压制', type: 'atk', cost: [1, 1], rar: 'c', sch: '冲', tgt: 'one', gun: 1,
    sh: u => ({ n: 3, d: 3 }), extra: (G, u, t) => G.weak(t, V(u, 1, 2)), desc: (u, f) => `射击 3 发，每发 ${f(3)} 伤害；给予 ${V(u, 1, 2)} 层虚弱。` },
  h_sweep: { name: '弹雨', type: 'atk', cost: [2, 2], rar: 'u', sch: '冲', gun: 1,
    sh: u => ({ n: 6, d: V(u, 3, 4), rand: 1 }), desc: (u, f) => `射击 6 发，每发 ${f(V(u, 3, 4))} 伤害，随机打敌人。` },
  h_twin2: { name: '抵近扫射', type: 'atk', cost: [2, 2], rar: 'u', sch: '冲', tgt: 'one', gun: 1,
    sh: u => ({ n: 4, d: V(u, 5, 7) }), desc: (u, f) => `射击 4 发，每发 ${f(V(u, 5, 7))} 伤害。` },
  h_medkit: { name: '火力全开', type: 'atk', cost: [2, 2], rar: 'r', sch: '冲', gun: 1,
    sh: u => ({ mag: 1, d: V(u, 3, 4), rand: 1 }), desc: (u, f) => `打光所有子弹：每发 ${f(V(u, 3, 4))} 伤害，随机打敌人。` },
  h_drone: { name: '弹链', type: 'skill', cost: [1, 1], rar: 'c', sch: '冲',
    desc: u => `抽 ${V(u, 2, 3)}；枪感 +1。`, play: (G, u) => { G.draw(V(u, 2, 3)); G.feel(1); } },
  overload: { name: '枪管发烫', type: 'skill', cost: [0, 0], rar: 'c', sch: '冲',
    desc: u => `枪感 +${V(u, 3, 4)}；失去 2 生命。`, play: (G, u) => { G.feel(V(u, 3, 4)); G.loseHp(2); } },
  rapid: { name: '枪感训练', type: 'power', cost: [1, 0], rar: 'u', sch: '冲',
    desc: () => '每打出一张冲锋枪牌，枪感额外 +1。', play: G => G.power('rapid', 1) },
  hs_quickmag: { name: '快换弹匣', type: 'power', cost: [1, 1], rar: 'u', sch: '冲',
    desc: u => `每次装填：抽 ${V(u, 2, 3)} 张，枪感 +1。`, play: (G, u) => G.power('quick', V(u, 2, 3)) },
  // —— 手枪 ——
  s_beat: { name: '快速拔枪', type: 'atk', cost: [0, 0], rar: 'c', sch: '手', tgt: 'one', gun: 1,
    sh: u => ({ n: 1, d: V(u, 4, 6) }), extra: G => G.draw(1), desc: (u, f) => `射击 1 发，${f(V(u, 4, 6))} 伤害；抽 1。` },
  // —— 通用 ——

  hs_bayonet: { name: '空仓拼刺', type: 'atk', cost: [0, 0], rar: 'c', sch: '通', tgt: 'one',
    desc: u => `造成 ${V(u, 9, 12)} 伤害；若子弹已打光，抽 1。`, play: (G, u, t) => { const e = G.ammo() === 0; G.melee(t, V(u, 9, 12)); if (e) G.draw(1); } },
  hs_spotter: { name: '观察手', type: 'skill', cost: [1, 1], rar: 'c', sch: '通', tgt: 'one',
    desc: u => `抽 ${V(u, 1, 2)}；标尺 +1；枪感 +1。`, play: (G, u, t) => { G.draw(V(u, 1, 2)); G.mark(t, 1); G.feel(1); } },
  expand: { name: '弹袋', type: 'power', cost: [1, 1], rar: 'u', sch: '通',
    desc: u => `可用弹数上限 +${V(u, 3, 5)}，并立刻多装 ${V(u, 3, 5)} 发。`, play: (G, u) => G.magUp(V(u, 3, 5)) },
  hs_depot: { name: '备用弹匣', type: 'power', cost: [2, 1], rar: 'u', sch: '通',
    desc: () => '装填不再花能量。', play: G => G.power('depot', 1) },
  // —— 手枪（扩充） ——
  hs_tap: { name: '点射', type: 'atk', cost: [1, 1], rar: 'c', sch: '手', tgt: 'one', gun: 1,
    sh: u => ({ n: 1, d: V(u, 9, 12) }), extra: G => G.feel(1), desc: (u, f) => `射击 1 发，${f(V(u, 9, 12))} 伤害；枪感 +1。` },
  hs_two: { name: '双枪', type: 'atk', cost: [1, 1], rar: 'c', sch: '手', tgt: 'one', gun: 1,
    sh: u => ({ n: 2, d: V(u, 5, 7) }), desc: (u, f) => `射击 2 发，每发 ${f(V(u, 5, 7))} 伤害。` },
  hs_gunfu: { name: '枪斗术', type: 'atk', cost: [0, 0], rar: 'c', sch: '手', tgt: 'one', gun: 1,
    sh: u => ({ n: 1, d: V(u, 4, 6) }), extra: (G, u) => G.block(V(u, 3, 5)), desc: (u, f) => `射击 1 发，${f(V(u, 4, 6))} 伤害；获得 ${V(u, 3, 5)} 格挡。` },
  hs_misfire: { name: '走火', type: 'atk', cost: [0, 0], rar: 'c', sch: '手', tgt: 'one', gun: 1,
    sh: u => ({ n: 1, d: V(u, 9, 12) }), extra: G => G.loseHp(2), desc: (u, f) => `射击 1 发，${f(V(u, 9, 12))} 伤害；失去 2 生命。` },
  hs_casing: { name: '弹壳收集', type: 'skill', cost: [0, 0], rar: 'c', sch: '手',
    desc: u => `枪感 +${V(u, 1, 2)}，抽 1。`, play: (G, u) => { G.feel(V(u, 1, 2)); G.draw(1); } },
  hs_selector: { name: '快慢机', type: 'skill', cost: [1, 0], rar: 'u', sch: '手',
    desc: () => '枪感 +3；本回合手枪牌少花 1 费。', play: G => { G.feel(3); G.B.p.selT = 1; } },
  hs_rapid2: { name: '连射', type: 'atk', cost: [1, 1], rar: 'u', sch: '手', tgt: 'one', gun: 1,
    sh: (u, B) => ({ n: Math.min(4, Math.max(1, Math.floor((B ? B.p.feel : 0) / 2))), d: V(u, 5, 7) }),
    desc: (u, f) => `枪感每 2 点射击 1 发（至少 1 发，最多 4 发），每发 ${f(V(u, 5, 7))} 伤害。` },
  hs_close: { name: '贴身射击', type: 'atk', cost: [1, 1], rar: 'u', sch: '手', tgt: 'one', gun: 1,
    sh: u => ({ n: 1, d: V(u, 10, 13) }), bonus: (G, u, t) => (G.intends(t) ? 6 : 0),
    desc: (u, f) => `射击 1 发，${f(V(u, 10, 13))} 伤害；目标这回合要打你，再 +6。` },
  hs_dual: { name: '双持', type: 'power', cost: [2, 2], rar: 'r', sch: '手',
    desc: () => '手枪牌每次多射 1 发。', play: G => G.power('dual', 1) },
  hs_burst2: { name: '枪感爆发', type: 'atk', cost: [2, 2], rar: 'r', sch: '手', tgt: 'one', gun: 1,
    sh: (u, B) => ({ n: 1, d: V(u, 3, 4) * (B ? B.p.feel : 0) }), extra: G => G.feelClear(),
    desc: u => `射击 1 发，伤害等于枪感 ×${V(u, 3, 4)}；枪感清零。` },
  // —— 冲锋枪（扩充） ——
  hs_butt: { name: '枪托', type: 'atk', cost: [0, 0], rar: 'c', sch: '冲', tgt: 'one',
    desc: u => `造成 ${V(u, 8, 11)} 伤害（不用子弹），枪感 +1。`, play: (G, u, t) => { G.melee(t, V(u, 8, 11)); G.feel(1); } },
  hs_rush: { name: '突进', type: 'skill', cost: [1, 1], rar: 'c', sch: '冲',
    desc: u => `获得 ${V(u, 10, 13)} 格挡，枪感 +2。`, play: (G, u) => { G.block(V(u, 10, 13)); G.feel(2); } },
  hs_storm: { name: '弹壳风暴', type: 'atk', cost: [1, 1], rar: 'u', sch: '冲', tgt: 'one', gun: 1,
    sh: (u, B) => ({ n: V(u, 2, 3), d: B ? B.p.feel : 0 }), desc: u => `射击 ${V(u, 2, 3)} 发，每发伤害等于枪感。` },
  hs_supp: { name: '压制射击', type: 'atk', cost: [2, 2], rar: 'u', sch: '冲', gun: 1,
    sh: u => ({ n: 2, d: V(u, 4, 5), all: 1 }), extra: G => G.alive().forEach(e => G.weak(e, 1)), desc: (u, f) => `对所有敌人各射击 2 发，每发 ${f(V(u, 4, 5))} 伤害；虚弱 1。` },
  hs_supp2: { name: '扫射压制', type: 'atk', cost: [2, 2], rar: 'r', sch: '冲', gun: 1,
    sh: u => ({ n: 3, d: V(u, 4, 5), all: 1 }), extra: G => G.alive().forEach(e => G.weak(e, 2)), desc: (u, f) => `对所有敌人各射击 3 发，每发 ${f(V(u, 4, 5))} 伤害；虚弱 2。` },
  // —— 狙击（扩充） ——
  hs_ballistic: { name: '弹道修正', type: 'skill', cost: [1, 1], rar: 'c', sch: '狙', tgt: 'one',
    desc: u => `标尺 +${V(u, 2, 3)}；本回合下一张狙击牌，每层标尺再 +1 伤害。`, play: (G, u, t) => { G.mark(t, V(u, 2, 3)); G.B.p.nextPm = (G.B.p.nextPm || 0) + 1; } },
  hs_steady: { name: '稳定射击', type: 'atk', cost: [2, 2], rar: 'u', sch: '狙', tgt: 'one', gun: 1,
    sh: u => ({ n: 1, d: V(u, 14, 18) }), extra: (G, u, t) => { if (t && !t.dead) G.mark(t, 2); }, desc: (u, f) => `射击 1 发，${f(V(u, 14, 18))} 伤害；标尺 +2。` },
  hs_wait: { name: '等待时机', type: 'atk', cost: [1, 1], rar: 'u', sch: '狙', tgt: 'one', gun: 1,
    sh: u => ({ n: 1, d: V(u, 10, 13) }), pre: G => (G.atkPlayed() ? 0 : 1), bonus: G => (G.atkPlayed() ? 0 : 8),
    extra: (G, u, t, res) => { if (res.pre && t && !t.dead) G.mark(t, 1); },
    desc: (u, f) => `射击 1 发，${f(V(u, 10, 13))} 伤害；本回合没打过别的攻击牌，再 +8、标尺 +1。` },
  hs_silent: { name: '静默射击', type: 'atk', cost: [1, 1], rar: 'u', sch: '狙', tgt: 'one', gun: 1, silent: 1,
    sh: u => ({ n: 1, d: V(u, 9, 12) }), extra: (G, u, t, res) => { if (res.kill) G.draw(1); },
    desc: (u, f) => `射击 1 发，${f(V(u, 9, 12))} 伤害，不算开枪（第二章不惊动巡警）；打倒敌人就抽 1。` },
  hs_pinpoint: { name: '定点清除', type: 'atk', cost: [3, 3], rar: 'r', sch: '狙', tgt: 'one', gun: 1,
    sh: u => ({ n: 1, d: 10, pm: V(u, 5, 6), use: 'all' }), extra: (G, u, t, res) => { if (res.kill) G.energy(1); },
    desc: (u, f) => `射击 1 发，${f(10)} 伤害，每层标尺再 +${V(u, 5, 6)}；用掉全部标尺；打倒敌人能量 +1。` },
  // —— 通用（扩充） ——
  hs_fallback: { name: '战术撤退', type: 'skill', cost: [0, 0], rar: 'c', sch: '通',
    desc: u => `获得 ${V(u, 7, 9)} 格挡；子弹打光时再抽 2。`, play: (G, u) => { G.block(V(u, 7, 9)); if (G.ammo() === 0) G.draw(2); } },
  hs_prep: { name: '火力准备', type: 'power', cost: [2, 1], rar: 'r', sch: '通',
    desc: () => '每回合第一张枪械牌 +4 伤害。', play: G => G.power('prep', 4) },
  // —— 缴获（不在奖励池，只从敌人或事件拿到） ——
  c_type97: { name: '九七式狙击', type: 'atk', cost: [1, 1], rar: 'loot', sch: '狙', tgt: 'one', gun: 1,
    sh: u => ({ n: 1, d: V(u, 12, 15) }), extra: (G, u, t) => { if (t && !t.dead) G.mark(t, 1); }, desc: (u, f) => `缴获的狙击步枪。射击 1 发，${f(V(u, 12, 15))} 伤害；标尺 +1。` },
  c_type11: { name: '歪把子扫射', type: 'atk', cost: [2, 2], rar: 'loot', sch: '冲', gun: 1,
    sh: u => ({ n: V(u, 2, 3), d: 3, all: 1 }), desc: (u, f) => `缴获的轻机枪。对所有敌人各射击 ${V(u, 2, 3)} 发，每发 ${f(3)} 伤害。` },
  c_nambu: { name: '南部手枪', type: 'atk', cost: [0, 0], rar: 'loot', sch: '手', tgt: 'one', gun: 1,
    sh: u => ({ n: 1, d: V(u, 5, 7) }), desc: (u, f) => `缴获的军官手枪。射击 1 发，${f(V(u, 5, 7))} 伤害。` },
  c_ppsh: { name: '波波沙', type: 'atk', cost: [1, 1], rar: 'loot', sch: '冲', tgt: 'one', gun: 1,
    sh: u => ({ n: 5, d: V(u, 3, 4) }), desc: (u, f) => `苏制冲锋枪。射击 5 发，每发 ${f(V(u, 3, 4))} 伤害。` },
};
Object.values(CARDS_HS).forEach(d => { d.ch = 'hansong'; });
/* 卡牌插图：同类卡共用一个图标（assets/icons/ 下的文件名） */
const ICON_HS = { note: 'pistol', s_beat: 'pistol', c_nambu: 'pistol', shoot: 'rifle', high: 'rifle', c_type97: 'rifle', crack: 'apround', h_shells: 'apround', h_lockon: 'helmet',
  refrain: 'scope', echo: 'scope', h_scope: 'scope', lowf: 'binoc', hs_spotter: 'binoc', h_ex: 'round', h_ricochet: 'round', standby: 'breath', skip: 'wind',
  barrage: 'smg', burst: 'smg', spread: 'smg', h_twin2: 'smg', c_ppsh: 'smg', h_sweep: 'casings', h_medkit: 'casings', c_type11: 'mg', h_drone: 'belt', expand: 'belt',
  overload: 'barrel', rapid: 'barrel', hs_quickmag: 'mag', hs_depot: 'mag', hs_bayonet: 'bayonet',
  hs_tap: 'pistol', hs_two: 'pistol', hs_gunfu: 'pistol', hs_misfire: 'pistol', hs_casing: 'casings', hs_selector: 'pistol', hs_rapid2: 'pistol', hs_close: 'pistol', hs_dual: 'pistol', hs_burst2: 'casings',
  hs_butt: 'bayonet', hs_rush: 'smg', hs_storm: 'casings', hs_supp: 'smg', hs_supp2: 'mg', hs_ballistic: 'scope', hs_steady: 'rifle', hs_wait: 'breath', hs_silent: 'rifle', hs_pinpoint: 'scope',
  hs_fallback: 'cover', hs_prep: 'mag' };
Object.entries(ICON_HS).forEach(([k, v]) => { CARDS_HS[k].icon = v; });

// ---------- 角色机制（战斗引擎在固定时机调用这些函数） ----------
// K 是引擎提供的工具：hitEnemy、atkMod、fx、alive、drawCards、sum(事件名…)（把所有随身物品的加成加起来）
function addFeel(B, n) { const k = Math.max(0, Math.min(FEEL_MAX, B.p.feel + n)); if (k > B.p.feel) B.K.fx('hero', `枪感+${k - B.p.feel}`, 'st'); B.p.feel = k; }
function mark(B, e, n) { if (!e || e.dead) return; const k = Math.min(MARK_MAX, e.marks + n); if (k !== e.marks) B.K.fx(e.id, `标尺+${k - e.marks}`, 'st'); e.marks = k; }
function bonusOf(B, d) {
  const p = B.p; let flat = 0;
  if (d.sch === '狙') { flat += p.nextSn; if (p.pw.scope && !p.firstSniper) flat += p.pw.scope[0]; }
  if (d.sch === '冲' || d.sch === '手') flat += Math.floor(p.feel / 2);
  if (p.pw.prep && !p.prepUsed) flat += p.pw.prep; /* 火力准备：每回合第一张枪械牌 */
  return flat + B.K.sum('shotBonus', d);
}
/* 枪械牌射击：每发扣 1 颗子弹，打空就停 */
function fire(B, d, u, t) {
  const K = B.K, p = B.p, sh = d.sh(u, B), sniper = d.sch === '狙';
  const flat = bonusOf(B, d) + (d.bonus ? d.bonus(B.G, u, t) : 0), pm = (sh.pm || 0) + (sniper ? p.nextPm || 0 : 0);
  p.prepUsed = 1; if (sniper) p.nextPm = 0;
  let scopeMark = 0;
  if (sniper) { if (p.pw.scope && !p.firstSniper) scopeMark = p.pw.scope[1]; p.firstSniper = 1; p.nextSn = 0; }
  let n = (sh.n || 0) + (d.sch === '手' && p.pw.dual ? 1 : 0); /* 双持 */
  if (d.sch === '冲' && !p.firstSmg) { p.firstSmg = 1; n += K.sum('smgExtra'); }
  const marks0 = t ? t.marks : 0, plan = [];
  if (sh.mag) for (let k = 0; k < B.ammo; k++) plan.push('rand');
  else if (sh.all) for (const e of K.alive()) for (let k = 0; k < n; k++) plan.push(e);
  else for (let k = 0; k < n; k++) plan.push(sh.rand ? 'rand' : t);
  let kill = 0, shots = 0;
  for (const x of plan) {
    if (B.ammo <= 0) break;
    const a = K.alive(); if (!a.length) break;
    let tg = x === 'rand' ? a[Math.floor(B.rng() * a.length)] : x;
    if (!tg || tg.dead) { if (sh.all) continue; tg = a[0]; } /* 目标死了，剩下的子弹打下一个 */
    B.ammo--; shots++; if (!d.silent) B.noise = (B.noise || 0) + 1; /* 第二章：枪声会抬高可疑度（静默射击不算） */
    const mk = tg === t ? marks0 : tg.marks;
    let dmg = sh.d + flat + (sniper ? mk * (1 + pm) : 0);
    if (sh.exe && tg.hp < tg.max * sh.exe) dmg *= 2;
    const was = tg.dead; K.fx(tg.id, '', 'bul'); K.hitEnemy(tg, K.atkMod(tg, dmg, sh), sh.pierce);
    if (!was && tg.dead && tg === t) kill = 1;
  }
  if (sh.use && t && !t.dead) t.marks = sh.use === 'all' ? 0 : Math.max(0, t.marks - sh.use);
  if (scopeMark && t && !t.dead) mark(B, t, scopeMark);
  addFeel(B, 1 + (d.sch === '冲' && p.pw.rapid ? 1 : 0));
  if (!B.ammo) K.fx('hero', '空仓', 'st');
  return { kill, shots };
}
const reloadCost = B => Math.max(0, (B.p.pw.depot || B.freeReload ? 0 : 1) + B.K.sum('reloadCost'));
const cantReload = B => B.ammo >= B.cap ? '子弹已满' : B.p.energy < reloadCost(B) ? '能量不够' : null;

export const MECH_HS = {
  init(B) { B.cap = MAG + B.K.sum('magBonus'); B.ammo = B.cap; B.p.feel = 0; },
  turnStart(B) { const p = B.p; p.firstSniper = 0; p.nextSn = 0; p.firstSmg = 0; p.prepUsed = 0; p.selT = 0; p.nextPm = 0; },
  costMod(B, d) { return B.p.selT && d.sch === '手' && d.gun ? -1 : 0; }, /* 快慢机 */
  turnEnd(B) { B.p.feel = Math.max(0, B.p.feel - 1); },
  /* 卡牌现在打出去是什么样：'shoot' 射击 / 'bayonet' 拼刺 / null 不是枪械牌 */
  mode(B, d) { return !d.gun ? null : B.ammo > 0 ? 'shoot' : 'bayonet'; },
  cantPlay(B, d) { return d.last && B.ammo !== 1 ? '子弹要刚好剩 1 发' : null; },
  /* 打出枪械牌 */
  playGun(B, d, u, t) {
    const K = B.K, res = { pre: d.pre ? d.pre(B.G, u, t) : 0 };
    if (B.ammo > 0) Object.assign(res, fire(B, d, u, t));
    else { res.bayonet = 1; K.fx('hero', '拼刺！', 'st'); if (!t || t.dead) t = K.alive()[0]; if (!t) return res; const before = t.dead; K.hitEnemy(t, K.atkMod(t, BAYONET + K.sum('bayonet'))); res.kill = !before && t.dead; }
    return res;
  },
  preview(B, d, x) { let v = x + bonusOf(B, d); if (B.p.st.weak) v = Math.floor(v * .75); return Math.max(0, v); },
  /* 卡牌效果能用到的韩松专属接口（加进 G） */
  G(B) {
    return {
      marks: e => (e ? e.marks : 0), ammo: () => B.ammo, mark: (e, n) => mark(B, e, n),
      addAmmo: n => { B.ammo = Math.min(B.cap, B.ammo + n); B.K.fx('hero', `子弹+${n}`, 'st'); },
      nextSniper: n => { B.p.nextSn += n; }, feel: n => addFeel(B, n), feelClear: () => { B.p.feel = 0; },
      magUp: n => { B.cap += n; B.ammo = Math.min(B.cap, B.ammo + n); B.K.fx('hero', `弹数上限+${n}`, 'st'); },
    };
  },
  /* 战斗界面右侧的按钮（以后别的角色可以放自己的按钮，比如田守义切换势） */
  actions(B) { const why = cantReload(B); return [{ id: 'reload', key: 'R', label: why === '子弹已满' ? '子弹已满' : `装填 <small>${reloadCost(B)} 费</small>`, dis: why, hot: !why, urgent: !B.ammo && !why, sfx: 'reload' }]; },
  act(B, id) {
    if (id !== 'reload' || cantReload(B)) return false;
    B.p.energy -= reloadCost(B); B.freeReload = 0; B.ammo = B.cap; B.K.fx('hero', '装填', 'st');
    if (B.p.pw.quick) { B.K.drawCards(B.p.pw.quick); addFeel(B, 1); }
    return true;
  },
  /* 韩松脚下的资源显示（纯 HTML 字符串） */
  info(B) {
    const pips = B.cap <= 16 ? Array.from({ length: B.cap }, (_, k) => `<i class="${k < B.ammo ? 'f' : ''}"></i>`).join('') : `<em class="mbar"><u style="width:${B.ammo / B.cap * 100}%"></u></em>`;
    return { main: `<div class="ammo ${B.ammo ? '' : 'zero'}" data-k="可用弹数"><span class="pips">${pips}</span><b>${B.ammo}/${B.cap}</b></div>`,
      chips: `<b class="feelc" data-k="枪感">枪感 ${B.p.feel}${B.p.feel >= 2 ? `（+${Math.floor(B.p.feel / 2)}）` : ''}</b>`,
      powers: { scope: '瞄准镜', depot: '备用弹匣', rapid: '枪感训练', quick: '快换弹匣', dual: '双持', prep: '火力准备' } };
  },
  /* 敌人头上的标尺 */
  enemyChips(e) { return e.marks ? `<b class="mark" data-k="标尺">🎯 标尺 ${e.marks}</b>` : ''; },
  /* 开枪动画用哪种枪声 */
  shotKind(d) { return ({ 狙: 'rifle', 冲: 'smg', 手: 'pistol' })[d.sch] || null; },
  rules: [
    '<b>可用弹数</b>：韩松随手能打的子弹，最多 8 发，所有枪械牌都从这里扣，每「射击 1 发」用掉 1 颗（游戏抽象，真实弹容见图鉴）。',
    '<b>装填</b>：「结束回合」上方的按钮，1 费，把子弹补满。',
    '<b>空仓拼刺</b>：子弹打光了，枪械牌自动变成拼刺，只造成 5 伤害，牌上其他效果不生效。',
    '<b>三种枪</b>：狙击牌 1 发高伤、省子弹；冲锋枪牌一次打好几发、耗弹快；手枪牌是便宜的小牌。',
    '<b>标尺</b>：叠在敌人身上，最多 5 层，每层让狙击牌每发 +1 伤害。',
    '<b>枪感</b>：每打一张枪械牌 +1（最多 6），回合结束 -1；每 2 点枪感，冲锋枪牌和手枪牌每发 +1 伤害。',
  ],
  dbg: [['满弹', B => { B.ammo = B.cap; }], ['清空弹仓', B => { B.ammo = 0; }], ['枪感满', B => { B.p.feel = FEEL_MAX; }]],
};

/* 韩松专属教程（老沈说）：on 是触发时机——play 打出牌时、render 战斗画面刷新时；when 返回 true 才触发，每条只出现一次 */
export const TUT_HS = [
  /* lines（数组）= 老沈对话框；hint（一句话）= 顶上一行小字。战斗里只有「装填」用对话框 */
  { id: 'shot', on: 'play', when: (B, d, mode) => mode === 'shoot',
    hint: '脚底下那排小格是剩下的子弹，最多 8 发。狙击省子弹，冲锋枪费子弹。' },
  { id: 'empty', on: 'render', when: B => B.ammo === 0,
    lines: ['子弹打光了！点右边的「装填」把子弹补满，平常要 1 点能量；你那条枪背带，每场头一回装填不要能量。',
      '来不及装也行：子弹打光时打枪牌，就是端起刺刀拼，只有 5 点伤害，牌上别的效果都没了。能装就先装。'] },
  { id: 'feel', on: 'render', when: B => B.p.feel >= 2,
    hint: '枪感上来了：每 2 点枪感，冲锋枪和手枪每发多打 1 点。回合结束掉 1 点，手别停。' },
  { id: 'mark', on: 'render', when: B => B.en.some(e => !e.dead && e.marks > 0),
    hint: '挂上「标尺」了：每层让狙击牌每发多打 1 点，最多 5 层。' },
];

export const HANSONG = {
  id: 'hansong', name: '韩松', title: '神枪手', code: '雪貂', hp: 72, blurb: '弹匣五发，打空了就换弹或者上刺刀。狙击枪一枪打得狠，冲锋枪打得快。',
  starter: ['note', 'note', 'note', 'note', 'defend', 'defend', 'defend', 'defend', 'shoot', 'barrage'],
  startRelic: 'strap', mech: MECH_HS, kw: KW_HS, tut: TUT_HS, lang: { ja: 1, ru: 0 }, /* 语言：0 不会，1 听得懂几句，2 能说，3 精通 */
  /* 美术：逐帧动画目录、画布信息（切图脚本算出）、枪口位置 */
  art: { dir: 'hansong', frames: true, lihui: true, still: 'hansong', fr: { cw: 389, ch: 291, ax: 205, sw: 182, sh: 287 }, muzzle: [128, 62], h: 250, hTouch: 235 },
};
