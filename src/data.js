// 《深入日军总部》数据：武器、卡牌、敌人、遭遇、事件。纯数据和规则函数，不碰 DOM（以后机器人模拟直接引用）。
export const V = (u, a, b) => (u ? b : a);

// ---------- 武器 ----------
// mag 弹仓，dmg 每发伤害，burst 每「发」实际打出几颗（冲锋枪/机枪连射）
export const WEAPONS = {
  type38: { name: '三八式步枪', kind: '步枪', mag: 5, dmg: 6, burst: 1, desc: '日军制式步枪。弹仓 5，每发 6 伤害。' },
  hanyang: { name: '汉阳造', kind: '步枪', mag: 5, dmg: 5, burst: 1, desc: '老式步枪，伪满军手里常见。弹仓 5，每发 5 伤害。' },
  type97: { name: '九七式狙击步枪', kind: '步枪', mag: 5, dmg: 8, burst: 1, desc: '带瞄准镜的步枪。弹仓 5，每发 8 伤害。' },
  mauser: { name: '驳壳枪', kind: '手枪', mag: 10, dmg: 4, burst: 1, desc: '抗联常用的手枪。弹仓 10，每发 4 伤害。' },
  nambu: { name: '南部手枪', kind: '手枪', mag: 8, dmg: 4, burst: 1, desc: '日军军官的手枪。弹仓 8，每发 4 伤害。' },
  type11: { name: '歪把子机枪', kind: '机枪', mag: 30, dmg: 3, burst: 3, desc: '日军轻机枪。弹仓 30，每发连打 3 颗，每颗 3 伤害。' },
  ppsh: { name: '波波沙冲锋枪', kind: '冲锋枪', mag: 35, dmg: 3, burst: 3, desc: '苏制冲锋枪。弹仓 35，每发连打 3 颗，每颗 3 伤害。' },
};
export const BAYONET = 6; // 空仓拼刺伤害

// ---------- 关键词说明 ----------
export const KW = {
  '标尺': '叠在敌人身上，最多 5 层。每层让你的枪械伤害 +1。',
  '装甲': '每次受到的伤害减去装甲值。穿甲类牌无视装甲。',
  '拼刺': '弹仓打空时，枪械牌改为拼刺：造成 6 伤害，牌上其他效果照常。',
  '装填': '0 费，把当前武器装满。装填后本回合不能再开枪。',
  '格挡': '抵挡受到的伤害，你的回合开始时清零。',
  '虚弱': '造成的攻击伤害 -25%，每回合减 1 层。',
  '易伤': '受到的攻击伤害 +50%，每回合减 1 层。',
  '消耗': '打出后本场战斗移除。',
  '能力': '打出后整场战斗持续生效。',
  '狙击牌': '狙击流派的枪械牌（据枪、冷枪、穿甲弹等）。',
};

// ---------- 卡牌 ----------
// gun: 枪械牌（消耗子弹；空仓时变拼刺）。sh: 射击参数 { n 发数, base 固定伤害(替代武器伤害), bonus 加伤, pm 每层标尺额外加伤, use 消耗标尺层数('all'), ap 穿甲(对装甲目标加成比例), exe 斩杀线 }
// extra(G,u,t,res): 射击之外的效果，res.bayonet 表示这次是拼刺，res.kill 表示击杀
export const CARDS = {
  shoot: { name: '据枪', type: 'atk', cost: [1, 1], rar: 'basic', sch: '狙', tgt: 'one', gun: 1,
    sh: u => ({ n: 1, bonus: V(u, 0, 3) }), desc: u => u ? '射击 1 发，+3 伤害。' : '射击 1 发。' },
  defend: { name: '闪避', type: 'skill', cost: [1, 1], rar: 'basic', sch: '通',
    desc: u => `获得 ${V(u, 5, 8)} 格挡。`, play: (G, u) => G.block(V(u, 5, 8)) },
  hs_switch: { name: '换枪', type: 'skill', cost: [0, 0], rar: 'basic', sch: '通',
    desc: u => `切换主/副武器；抽 ${V(u, 1, 2)}。`, play: (G, u) => { G.switchW(); G.draw(V(u, 1, 2)); } },
  echo: { name: '测距', type: 'skill', cost: [1, 1], rar: 'c', sch: '狙', tgt: 'one',
    desc: u => `标尺 +${V(u, 2, 3)}；抽 1。`, play: (G, u, t) => { G.mark(t, V(u, 2, 3)); G.draw(1); } },
  standby: { name: '屏息', type: 'skill', cost: [1, 1], rar: 'c', sch: '狙',
    desc: u => `获得 ${V(u, 7, 10)} 格挡；本回合下一张枪械牌 +${V(u, 4, 6)} 伤害。`, play: (G, u) => { G.block(V(u, 7, 10)); G.nextGun(V(u, 4, 6)); } },
  high: { name: '冷枪', type: 'atk', cost: [0, 0], rar: 'c', sch: '狙', tgt: 'one', gun: 1,
    sh: u => ({ n: 1, bonus: V(u, -2, -1) }), pre: (G, u, t) => (t && !G.marks(t) ? 1 : 0),
    extra: (G, u, t, res) => { if (res.pre && t && !t.dead) G.mark(t, V(u, 2, 3)); },
    desc: u => `射击 1 发（伤害 ${V(u, -2, -1)}）；若目标没有标尺，标尺 +${V(u, 2, 3)}。` },
  h_scope: { name: '瞄准镜', type: 'power', cost: [1, 1], rar: 'c', sch: '狙',
    desc: u => `每回合第一张狙击牌 +${V(u, 3, 5)} 伤害，并给目标标尺 +${V(u, 1, 2)}。`, play: (G, u) => G.power('scope', [V(u, 3, 5), V(u, 1, 2)]) },
  crack: { name: '穿甲弹', type: 'atk', cost: [1, 1], rar: 'c', sch: '狙', tgt: 'one', gun: 1,
    sh: u => ({ n: 1, bonus: V(u, 0, 3), ap: V(u, .5, .75), pierce: 1 }),
    desc: u => `射击 1 发${u ? '，+3 伤害' : ''}；无视格挡和装甲；对装甲目标 +${V(u, 50, 75)}%。` },
  distort: { name: '弹道修正', type: 'skill', cost: [1, 1], rar: 'u', sch: '狙', tgt: 'one',
    desc: u => `标尺 +${V(u, 2, 3)}；本回合下一张狙击牌，每层标尺再 +${V(u, 1, 2)} 伤害。`, play: (G, u, t) => { G.mark(t, V(u, 2, 3)); G.nextSniper(0, V(u, 1, 2)); } },
  cannon: { name: '稳定射击', type: 'atk', cost: [2, 2], rar: 'u', sch: '狙', tgt: 'one', gun: 1,
    sh: u => ({ n: 1, pm: V(u, 3, 4) }), desc: u => `射击 1 发，每层标尺额外 +${V(u, 3, 4)} 伤害（不消耗标尺）。` },
  lowf: { name: '观察', type: 'skill', cost: [0, 0], rar: 'u', sch: '狙',
    desc: u => `抽 ${V(u, 1, 2)}；若有敌人标尺 ≥${V(u, 3, 2)}，再抽 1。`, play: (G, u) => { G.draw(V(u, 1, 2)); if (G.alive().some(e => G.marks(e) >= V(u, 3, 2))) G.draw(1); } },
  h_ex: { name: '一枪一命', type: 'atk', cost: [2, 2], rar: 'u', sch: '狙', tgt: 'one', gun: 1,
    sh: u => ({ n: 1, base: 6, pm: V(u, 2, 3), use: 'all' }),
    extra: (G, u, t, res) => { if (res.kill && !res.bayonet) G.addAmmo(2); },
    desc: u => `消耗全部标尺：造成 6 + ${V(u, 3, 4)}×层数 伤害；击杀返还 2 发子弹。` },
  h_lockon: { name: '爆头', type: 'atk', cost: [1, 1], rar: 'u', sch: '狙', tgt: 'one', gun: 1,
    sh: u => ({ n: 1, bonus: V(u, 0, 4), exe: V(u, .3, .35) }), desc: u => `射击 1 发${u ? '，+4 伤害' : ''}；目标生命低于 ${V(u, 30, 35)}% 时伤害翻倍。` },
  skip: { name: '测风', type: 'skill', cost: [0, 0], rar: 'u', sch: '狙', tgt: 'one',
    desc: u => `标尺 +${V(u, 1, 2)}；本回合下一张狙击牌 +${V(u, 2, 3)} 伤害。`, play: (G, u, t) => { G.mark(t, V(u, 1, 2)); G.nextSniper(V(u, 2, 3), 0); } },
  refrain: { name: '致命距离', type: 'atk', cost: [1, 1], rar: 'u', sch: '狙', tgt: 'one', gun: 1,
    sh: u => ({ n: 1, pm: V(u, 2, 3), use: 1 }), desc: u => `射击 1 发，每层标尺额外 +${V(u, 2, 3)} 伤害；消耗 1 层标尺。` },
  h_shells: { name: '反器材', type: 'atk', cost: [2, 2], rar: 'r', sch: '狙', tgt: 'one', gun: 1,
    sh: u => ({ n: 1, bonus: V(u, 0, 4), ap: V(u, 1, 1.5), pierce: 1 }), extra: (G, u, t) => { if (t && !t.dead) G.mark(t, 2); },
    desc: u => `射击 1 发${u ? '，+4 伤害' : ''}；无视装甲，对装甲目标 +${V(u, 100, 150)}%；标尺 +2。` },
  h_ricochet: { name: '最后一发', type: 'atk', cost: [1, 1], rar: 'r', sch: '狙', tgt: 'one', gun: 1, last: 1,
    sh: u => ({ n: 1, base: V(u, 20, 26) }), extra: (G, u, t) => { if (t && !t.dead) G.mark(t, V(u, 1, 2)); },
    desc: u => `只有弹仓刚好剩 1 发时能打出：射击造成 ${V(u, 20, 26)} 伤害；标尺 +${V(u, 1, 2)}。` },
  s_lullaby: { name: '静默射击', type: 'atk', cost: [1, 1], rar: 'r', sch: '狙', tgt: 'one', gun: 1,
    sh: u => ({ n: 1, bonus: V(u, 0, 3) }), extra: (G, u, t, res) => { if (res.kill) { const a = G.alive(); if (a.length) G.mark(a[0], 2); G.draw(V(u, 1, 2)); } },
    desc: u => `射击 1 发${u ? '，+3 伤害' : ''}；击杀时给下一个敌人标尺 +2，抽 ${V(u, 1, 2)}。` },
  hs_medkit: { name: '急救包', type: 'skill', cost: [1, 1], rar: 'c', sch: '通', ex: 1,
    desc: u => `回复 ${V(u, 6, 9)} 生命。消耗。`, play: (G, u) => G.heal(V(u, 6, 9)) },
  hs_fallback: { name: '战术撤退', type: 'skill', cost: [0, 0], rar: 'c', sch: '通',
    desc: u => `获得 ${V(u, 4, 7)} 格挡；切换武器。`, play: (G, u) => { G.block(V(u, 4, 7)); G.switchW(); } },
  hs_spotter: { name: '观察手', type: 'skill', cost: [1, 1], rar: 'c', sch: '通', tgt: 'one',
    desc: u => `抽 ${V(u, 1, 2)}；标尺 +${V(u, 1, 2)}。`, play: (G, u, t) => { G.draw(V(u, 1, 2)); G.mark(t, V(u, 1, 2)); } },
  hs_depot: { name: '弹药库', type: 'power', cost: [1, 0], rar: 'u', sch: '通',
    desc: () => '每回合装填后，本回合仍可再打 1 张枪械牌。', play: G => G.power('depot', 1) },
  hs_bayonet: { name: '空仓拼刺', type: 'atk', cost: [0, 0], rar: 'u', sch: '通', tgt: 'one',
    desc: u => `造成 ${V(u, 7, 10)} 伤害；若当前弹仓为空，抽 1。`, play: (G, u, t) => { const e = G.ammo() === 0; G.melee(t, V(u, 7, 10)); if (e) G.draw(1); } },
  expand: { name: '弹袋', type: 'power', cost: [1, 1], rar: 'c', sch: '通',
    desc: u => `本场两把武器弹仓上限 +${V(u, 2, 4)}，并立刻多装 ${V(u, 2, 4)} 发。`, play: (G, u) => G.magUp(V(u, 2, 4)) },
  hs_prep: { name: '火力准备', type: 'power', cost: [2, 2], rar: 'r', sch: '通',
    desc: u => `每回合第一张枪械牌 +${V(u, 2, 3)} 伤害。`, play: (G, u) => G.power('prep', V(u, 2, 3)) },
};
Object.entries(CARDS).forEach(([id, d]) => { d.id = id; });
export const STARTER = ['shoot', 'shoot', 'shoot', 'shoot', 'defend', 'defend', 'defend', 'defend', 'hs_switch', 'echo'];
export const TYPE = { atk: '攻击', skill: '技能', power: '能力' };
export const RAR = { basic: '基础', c: '普通', u: '罕见', r: '稀有' };

// ---------- 敌人 ----------
// 招式：i 意图类型 atk/def/buff/debuff/charge/flee；d 伤害，x 次数，blk 格挡，str 力量（给自己），all 力量给全体友军，weak/vuln 给你
const pick = (r, a) => a[Math.floor(r() * a.length)];
export const ENEMIES = {
  inf: { name: '日军步兵', hp: [22, 26], col: '#6d6a3c', loot: 'type38', lootP: .2,
    moves: { shoot: { t: '射击', i: 'atk', d: 8 }, stab: { t: '刺杀', i: 'atk', d: 6, blk: 5 } },
    ai: (e, B, r) => e.last === 'stab' ? 'shoot' : r() < .55 ? 'shoot' : 'stab' },
  puppet: { name: '伪满军', hp: [14, 18], col: '#7a5a3a', loot: 'hanyang', lootP: .25,
    moves: { shoot: { t: '射击', i: 'atk', d: 6 }, hide: { t: '缩在掩体后', i: 'def', blk: 6 }, flee: { t: '逃跑', i: 'flee' } },
    ai: (e, B, r) => (e.t >= 2 && e.hp < e.max / 2) ? 'flee' : e.last === 'hide' ? 'shoot' : r() < .7 ? 'shoot' : 'hide' },
  dog: { name: '军犬', hp: [12, 15], col: '#5a4a3a',
    moves: { bite: { t: '撕咬', i: 'atk', d: 4, x: 2 }, pounce: { t: '扑倒', i: 'atk', d: 6, weak: 1 } },
    ai: (e, B, r) => e.last === 'pounce' ? 'bite' : r() < .6 ? 'bite' : 'pounce' },
  mortar: { name: '掷弹筒兵', hp: [20, 22], col: '#6a6050',
    moves: { load: { t: '装弹', i: 'charge', next: 14 }, fire: { t: '炮击', i: 'atk', d: 14 }, dig: { t: '挖掩体', i: 'def', blk: 8 } },
    ai: e => ['load', 'fire', 'dig'][e.t % 3] },
  mg: { name: '机枪组', hp: [30, 34], col: '#4a5040', armor: 2, loot: 'type11', lootP: .3,
    moves: { spray: { t: '扫射', i: 'atk', d: 3, x: 4 }, set: { t: '架枪', i: 'def', blk: 10 } },
    ai: e => e.t % 2 === 0 ? 'spray' : 'set' },
  sniper: { name: '日军狙击手', hp: [18, 20], col: '#4e5a3a', loot: 'type97', lootP: .35,
    moves: { aim: { t: '瞄准', i: 'charge', next: 18 }, snipe: { t: '狙击', i: 'atk', d: 18 }, move: { t: '转移阵地', i: 'def', blk: 8 } },
    ai: e => ['aim', 'snipe', 'move'][e.t % 3] },
  sergeant: { name: '讨伐队军曹', hp: [50, 54], col: '#7a3a2a', elite: 1, loot: 'nambu', lootP: 1,
    moves: { rally: { t: '冲锋号令', i: 'buff', all: 2 }, saber: { t: '军刀劈砍', i: 'atk', d: 13 }, pistol: { t: '手枪射击', i: 'atk', d: 7, weak: 1 } },
    ai: e => e.t === 0 ? 'rally' : e.t % 2 ? 'saber' : 'pistol' },
  captain: { name: '讨伐队长 · 村濑', hp: [150, 150], col: '#5a2a2a', boss: 1, armor: 3, loot: 'type11', lootP: 1,
    moves: {
      mgun: { t: '车载机枪', i: 'atk', d: 4, x: 4 }, ram: { t: '冲撞', i: 'atk', d: 16 }, hull: { t: '关上舱盖', i: 'def', blk: 15 },
      saber: { t: '军刀', i: 'atk', d: 14 }, pistol: { t: '手枪连射', i: 'atk', d: 6, x: 2 }, roar: { t: '怒吼', i: 'buff', str: 3 },
    },
    ai: (e, B, r) => e.phase === 2 ? (e.last === 'roar' ? 'saber' : e.t % 3 === 0 ? 'roar' : pick(r, ['saber', 'pistol'])) : ['mgun', 'ram', 'hull'][e.t % 3],
    onHurt: (e, G) => { if (e.phase !== 2 && e.hp <= e.max / 2) { e.phase = 2; e.armor = 0; e.block = 0; e.t = 0; e.move = 'roar'; G.say('装甲车被打瘫了！村濑跳下车，拔出军刀。'); G.fx(e.id, '装甲车瘫痪', 'st'); } } },
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
      { t: '取出那支冲锋枪（缴获：波波沙）', f: G => { G.weapon('ppsh'); return ''; } },
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
