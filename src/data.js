// 《深入日军总部》数据：武器、卡牌、敌人、遭遇、事件。纯数据和规则函数，不碰 DOM（以后机器人模拟直接引用）。
export const V = (u, a, b) => (u ? b : a);

// ---------- 弹仓 ----------
export const MAG = 8;      // 弹仓上限
export const BAYONET = 5;  // 空仓拼刺伤害
export const FEEL_MAX = 6; // 枪感上限

// ---------- 关键词说明 ----------
export const KW = {
  '弹仓': '韩松只有一个弹仓（8 发），所有枪械牌都从这里扣子弹。',
  '装填': '0 费，把弹仓装满。装填后本回合不能再打枪械牌。',
  '拼刺': '弹仓空了，枪械牌改为拼刺：造成 5 伤害，牌上其他效果照常。',
  '标尺': '叠在敌人身上，最多 5 层。每层让狙击牌每发 +1 伤害。',
  '枪感': '每打出一张枪械牌 +1（最多 6），回合结束 -1。冲锋枪牌和手枪牌每发伤害 + 枪感的一半。',
  '装甲': '每次受到的伤害减去装甲值。穿甲类牌无视装甲。',
  '格挡': '抵挡受到的伤害，你的回合开始时清零。',
  '虚弱': '造成的攻击伤害 -25%，每回合减 1 层。',
  '易伤': '受到的攻击伤害 +50%，每回合减 1 层。',
  '消耗': '打出后本场战斗移除。',
  '能力': '打出后整场战斗持续生效。',
  '狙击牌': '标着「狙击」的枪械牌，吃标尺加成。',
  '冲锋枪牌': '标着「冲锋枪」的枪械牌，吃枪感加成。',
};

// ---------- 卡牌 ----------
// sch 流派：狙 狙击 / 冲 冲锋枪 / 手 手枪 / 通 通用。gun=枪械牌（每发扣 1 颗子弹；空仓时变拼刺）
// sh(u) 射击参数：n 发数，d 每发伤害，pm 每层标尺额外加伤，use 消耗标尺层数('all')，ap 对装甲加成（无视装甲），pierce 无视格挡，exe 斩杀线，all 每个敌人各打 n 发，rand 随机目标，mag 打光弹仓
// desc(u, f)：f(x) 把基础伤害换成当前实际伤害（战斗里显示绿色）
// extra(G,u,t,res)：射击之外的效果；res.bayonet 拼刺，res.kill 击杀主目标
export const CARDS = {
  // —— 初始 ——
  note: { name: '驳壳枪', type: 'atk', cost: [1, 1], rar: 'basic', sch: '手', tgt: 'one', gun: 1,
    sh: u => ({ n: 1, d: V(u, 6, 9) }), desc: (u, f) => `射击 1 发，${f(V(u, 6, 9))} 伤害。` },
  defend: { name: '闪避', type: 'skill', cost: [1, 1], rar: 'basic', sch: '通',
    desc: u => `获得 ${V(u, 5, 8)} 格挡。`, play: (G, u) => G.block(V(u, 5, 8)) },
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
    desc: (u, f) => `弹仓刚好剩 1 发时才能打出：射击 1 发，${f(V(u, 22, 28))} 伤害；标尺 +1。` },
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
    sh: u => ({ mag: 1, d: V(u, 3, 4), rand: 1 }), desc: (u, f) => `打光弹仓：每发 ${f(V(u, 3, 4))} 伤害，随机打敌人。` },
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
  hs_medkit: { name: '急救包', type: 'skill', cost: [1, 1], rar: 'c', sch: '通', ex: 1,
    desc: u => `回复 ${V(u, 6, 9)} 生命。消耗。`, play: (G, u) => G.heal(V(u, 6, 9)) },
  hs_bayonet: { name: '空仓拼刺', type: 'atk', cost: [0, 0], rar: 'c', sch: '通', tgt: 'one',
    desc: u => `造成 ${V(u, 7, 10)} 伤害；若弹仓为空，抽 1。`, play: (G, u, t) => { const e = G.ammo() === 0; G.melee(t, V(u, 7, 10)); if (e) G.draw(1); } },
  hs_spotter: { name: '观察手', type: 'skill', cost: [1, 1], rar: 'c', sch: '通', tgt: 'one',
    desc: u => `抽 ${V(u, 1, 2)}；标尺 +1；枪感 +1。`, play: (G, u, t) => { G.draw(V(u, 1, 2)); G.mark(t, 1); G.feel(1); } },
  expand: { name: '弹袋', type: 'power', cost: [1, 1], rar: 'u', sch: '通',
    desc: u => `弹仓上限 +${V(u, 3, 5)}，并立刻多装 ${V(u, 3, 5)} 发。`, play: (G, u) => G.magUp(V(u, 3, 5)) },
  hs_depot: { name: '备用弹匣', type: 'power', cost: [1, 0], rar: 'u', sch: '通',
    desc: () => '每回合装填后，本回合仍可再打 1 张枪械牌。', play: G => G.power('depot', 1) },
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
Object.entries(CARDS).forEach(([id, d]) => { d.id = id; });
export const STARTER = ['note', 'note', 'note', 'note', 'defend', 'defend', 'defend', 'defend', 'shoot', 'barrage'];
export const TYPE = { atk: '攻击', skill: '技能', power: '能力' };
export const RAR = { basic: '基础', c: '普通', u: '罕见', r: '稀有', loot: '缴获' };
export const SCH = { 狙: '狙击', 冲: '冲锋枪', 手: '手枪', 通: '通用' };

// ---------- 敌人 ----------
// 招式：i 意图类型 atk/def/buff/debuff/charge/flee；d 伤害，x 次数，blk 格挡，str 力量（给自己），all 力量给全体友军，weak/vuln 给你
const pick = (r, a) => a[Math.floor(r() * a.length)];
export const ENEMIES = {
  inf: { name: '日军步兵', hp: [22, 26], col: '#6d6a3c', art: 'inf', frames: 'inf', artH: 240, 
    moves: { shoot: { t: '射击', i: 'atk', d: 8 }, stab: { t: '刺杀', i: 'atk', d: 6, blk: 5 } },
    ai: (e, B, r) => e.last === 'stab' ? 'shoot' : r() < .55 ? 'shoot' : 'stab' },
  puppet: { name: '伪满军', hp: [14, 18], col: '#7a5a3a', frames: 'puppet', artH: 235, 
    moves: { shoot: { t: '射击', i: 'atk', d: 6 }, hide: { t: '缩在掩体后', i: 'def', blk: 6 }, flee: { t: '逃跑', i: 'flee' } },
    ai: (e, B, r) => (e.t >= 2 && e.hp < e.max / 2) ? 'flee' : e.last === 'hide' ? 'shoot' : r() < .7 ? 'shoot' : 'hide' },
  dog: { name: '军犬', hp: [12, 15], col: '#5a4a3a', frames: 'dog', artH: 90,
    moves: { bite: { t: '撕咬', i: 'atk', d: 4, x: 2 }, pounce: { t: '扑倒', i: 'atk', d: 6, weak: 1 } },
    ai: (e, B, r) => e.last === 'pounce' ? 'bite' : r() < .6 ? 'bite' : 'pounce' },
  mortar: { name: '掷弹筒兵', hp: [20, 22], col: '#6a6050', frames: 'mortar', artH: 188,
    moves: { load: { t: '装弹', i: 'charge', next: 14 }, fire: { t: '炮击', i: 'atk', d: 14 }, dig: { t: '挖掩体', i: 'def', blk: 8 } },
    ai: e => ['load', 'fire', 'dig'][e.t % 3] },
  mg: { name: '机枪组', hp: [30, 34], col: '#4a5040', armor: 2, frames: 'mg', artH: 123, loot: 'c_type11', lootP: .5,
    moves: { spray: { t: '扫射', i: 'atk', d: 3, x: 4 }, set: { t: '架枪', i: 'def', blk: 10 } },
    ai: e => e.t % 2 === 0 ? 'spray' : 'set' },
  sniper: { name: '日军狙击手', hp: [18, 20], col: '#4e5a3a', frames: 'sniper', artH: 179, loot: 'c_type97', lootP: .5,
    moves: { aim: { t: '瞄准', i: 'charge', next: 18 }, snipe: { t: '狙击', i: 'atk', d: 18 }, move: { t: '转移阵地', i: 'def', blk: 8 } },
    ai: e => ['aim', 'snipe', 'move'][e.t % 3] },
  sergeant: { name: '讨伐队军曹', hp: [50, 54], col: '#7a3a2a', elite: 1, frames: 'sergeant', artH: 250, loot: 'c_nambu', lootP: 1,
    moves: { rally: { t: '冲锋号令', i: 'buff', all: 2 }, saber: { t: '军刀劈砍', i: 'atk', d: 13 }, pistol: { t: '手枪射击', i: 'atk', d: 7, weak: 1 } },
    ai: e => e.t === 0 ? 'rally' : e.t % 2 ? 'saber' : 'pistol' },
  captain: { name: '讨伐队长 · 村濑', hp: [150, 150], col: '#5a2a2a', boss: 1, armor: 2, frames: 'captain_car', artH: 280, frames2: 'captain_foot', artH2: 265,
    moves: {
      mgun: { t: '车载机枪', i: 'atk', d: 4, x: 4 }, ram: { t: '冲撞', i: 'atk', d: 16 }, hull: { t: '关上舱盖', i: 'def', blk: 15 },
      saber: { t: '军刀', i: 'atk', d: 14 }, pistol: { t: '手枪连射', i: 'atk', d: 6, x: 2 }, roar: { t: '怒吼', i: 'buff', str: 3 },
    },
    ai: (e, B, r) => e.phase === 2 ? (e.last === 'roar' ? 'saber' : e.t % 3 === 0 ? 'roar' : pick(r, ['saber', 'pistol'])) : ['mgun', 'ram', 'hull'][e.t % 3],
    onHurt: (e, G) => { if (e.phase !== 2 && e.hp <= e.max / 2) { e.phase = 2; e.armor = 0; e.block = 0; e.t = 0; e.move = 'roar'; e.anim = null; G.say('装甲车被打瘫了！村濑跳下车，拔出军刀。'); G.fx(e.id, '装甲车瘫痪', 'st'); } } },
};
Object.entries(ENEMIES).forEach(([k, d]) => { d.key = k; });

export const ENC = {
  easy: [['inf'], ['puppet', 'puppet'], ['dog', 'dog'], ['puppet', 'dog']],
  hard: [['inf', 'puppet', 'puppet'], ['mg', 'puppet'], ['mortar', 'inf'], ['sniper', 'inf'], ['dog', 'inf', 'dog'], ['mg', 'dog'], ['sniper', 'puppet', 'puppet']],
  elite: [['inf', 'sergeant', 'inf']],
  boss: [['inf', 'captain']],
};

// ---------- 地图事件 ----------
// 每个选项：t 文字，f(G) 结果，返回结果说明；G 提供 food/temp/hp/maxHp/upgrade/addCard/weapon/fight
export const EVENTS = [
  { id: 'hunter', title: '林中的老猎户', text: '雪地里遇见一位背着火枪的老猎户。他认出你们袖子上的标记，压低声音说：「山那边有讨伐队，别走大路。」',
    opts: [
      { t: '收下他的干粮（口粮 +3）', f: G => { G.food(3); return '老人把一包冻硬的苞米面饼子塞给你，转身消失在林子里。'; } },
      { t: '请他教你看风（升级 1 张牌）', f: G => { G.upgrade(); return '老人捻起一撮雪撒向空中：「风往哪边走，子弹就往哪边偏。」'; } },
    ] },
  { id: 'hut', title: '废弃的窝棚', text: '一间伐木工留下的窝棚，屋顶塌了一半，灶坑里还有些干柴。',
    opts: [
      { t: '生火取暖（体温回满；可能引来巡逻队）', f: G => { G.temp(99); if (G.rng() < .35) { G.fight(['inf', 'puppet']); return '火光引来了巡逻队！'; } return '你们围着火坐了一会儿，手脚终于有了知觉。'; } },
      { t: '翻找一下（口粮 +2）', f: G => { G.food(2); return '墙角埋着半袋土豆，冻得像石头，煮一煮还能吃。'; } },
      { t: '不停留，继续赶路', f: () => '你们没有停下。' },
    ] },
  { id: 'drop', title: '雪地里的空投箱', text: '一只挂着破降落伞的木箱卡在树杈上，箱子上印着俄文。整训时的苏联教官说过，会想办法给你们送补给。',
    opts: [
      { t: '取出那支冲锋枪（获得「波波沙」）', f: G => { G.addCard('c_ppsh'); return '一支波波沙冲锋枪，枪油还没干。'; } },
      { t: '取出医药箱（获得「急救包」，回复 10 生命）', f: G => { G.addCard('hs_medkit'); G.heal(10); return '箱子里有绷带、磺胺粉，还有一小瓶酒精。'; } },
    ] },
  { id: 'altar', title: '石堆', text: '林子深处有一座半人高的石堆，上面系着褪色的布条。向导说这是山里人敬「仙家」的地方，路过的人都会留点东西。风停了，四下静得出奇。',
    opts: [
      { t: '留下一块干粮（口粮 -1，最大生命 +4）', f: G => { G.food(-1); G.maxHp(4); return '你放下干粮，鞠了一躬。起身时，好像听见石堆后面有什么东西轻轻走开了。'; } },
      { t: '绕开它', f: () => '你们绕了过去。走出很远，回头还能看见那些布条在没有风的林子里飘动。' },
    ] },
  { id: 'river', title: '封冻的河', text: '一条河挡在前面。冰面看着结实，但河心颜色发暗。绕到上游的桥要多走半天。',
    opts: [
      { t: '踩冰过河（一半可能落水：生命 -8，体温 -4）', f: G => { if (G.rng() < .5) { G.hp(-8); G.temp(-4); return '冰面「咔」地裂开，你半个身子掉进冰水里。'; } return '冰面吱吱作响，但你们平安过去了。'; } },
      { t: '绕路（体温 -2，口粮 -1）', f: G => { G.temp(-2); G.food(-1); return '你们在风雪里多走了半天。'; } },
    ] },
];
