// 随身物品（相当于通往顶端的秘宝）。每个物品挂在固定的「触发点」上，加新物品只要在这里加一条。
// 战斗中的触发点（引擎调用）：
//   battleStart(G)  turnStart(G, B)  battleEnd(G, win)
//   energy(B, first) / draw(B, first)  → 返回额外能量 / 抽牌数
//   shotBonus(B, d) 枪械每发加伤；smgExtra(B) 每回合第一张冲锋枪牌多几发；bayonet(B) 拼刺加伤
//   magBonus(B) 弹仓上限；reloadCost(B) 装填费用增减；costMod(B, d, c) 卡牌费用增减
//   lethal(G, B) 受到致命伤时调用，返回 true 表示救回来了
// 地图上的触发点（界面调用，R 是这一局）：walkTemp(R) 每走一格体温掉多少（默认 1）；fightWon(R)；restHeal(R) 密营多回多少；
//   noColdDraw 体温低不少抽牌；hideMap 地图节点全显示成「？」
// su：苏联物品（日伪军身上缴获不到，只在埋藏点、老乡那里出）
// ch：角色专属（不写就是所有角色都能拿到）。rar：start 起始 / c 普通 / u 罕见 / r 稀有 / boss
// 史实：都是当时东北山林、抗联和日伪军真实会有的东西
export const RELICS = {
  strap: { name: '雪貂的枪背带', rar: 'start', ch: 'hansong', icon: '🎗', desc: '每场战斗第一次装填不花能量。',
    battleStart: G => { G.B.freeReload = 1; } },
  legknife: { name: '绑腿里的刀', rar: 'start', ch: 'chenmo', icon: '🔪', desc: '每场战斗开始得到 2 把飞刀。', battleStart: G => { if (G.addKnife) G.addKnife(2); } },
  charm: { name: '五大仙护身符', rar: 'start', ch: 'tian', icon: '🧧', desc: '每场战斗生命第一次低于一半时，获得 12 格挡（敬畏 ≥3 时 24）。他信这个。' },
  manual: { name: '工兵手册', rar: 'start', ch: 'zhao', icon: '📘', desc: '每场战斗开始工事 +6。', battleStart: G => G.fort(6) },
  diary: { name: '桦皮日记', rar: 'start', ch: 'shen', icon: '📔', desc: '每场战斗第一回合：情报 +2，侦明 3。', turnStart: (G, B) => { if (B.turn === 1 && G.intel) { G.intel(2); G.scry(3); } } },
  watch: { name: '怀表', rar: 'c', icon: '⌚', desc: '每场战斗第一回合 +1 能量。', energy: (B, first) => first ? 1 : 0 },
  mittens: { name: '狍皮手闷子', rar: 'c', icon: '🧤', desc: '每场战斗开始获得 6 格挡。', battleStart: G => G.block(6) },
  ulacao: { name: '乌拉草', rar: 'c', icon: '🌾', desc: '絮在鞋里防冻（关东三宝之一）。每走 2 格才掉 1 点体温。', walkTemp: R => (R.steps % 2 ? 0 : 1) },
  foodbag: { name: '干粮袋', rar: 'c', icon: '🎒', desc: '打赢战斗，口粮多 +1。', fightWon: R => { R.food++; } },
  canteen: { name: '缴获的日军水壶', rar: 'c', icon: '🫗', desc: '每场战斗结束回复 4 生命。', battleEnd: (G, win) => { if (win) G.heal(4); } },
  belt: { name: '子弹带', rar: 'c', ch: 'hansong', icon: '🪖', desc: '可用弹数上限 +1。', magBonus: () => 1 },
  whet: { name: '磨刀石', rar: 'c', ch: 'hansong', icon: '🪨', desc: '拼刺伤害 +3。', bayonet: () => 3 },
  doghat: { name: '狗皮帽', rar: 'c', icon: '🧢', desc: '体温低于 3 时，战斗第一回合不再少抽牌。', noColdDraw: true },
  scope2: { name: '缴获的瞄准镜', rar: 'u', ch: 'hansong', icon: '🔭', desc: '狙击牌每发 +2 伤害。', shotBonus: (B, d) => d.sch === '狙' ? 2 : 0 },
  drum: { name: '苏制弹鼓', rar: 'u', ch: 'hansong', su: 1, icon: '🥁', desc: '每回合第一张冲锋枪牌多射 1 发。', smgExtra: () => 1 },
  letter: { name: '家书', rar: 'u', icon: '✉', desc: '生命低于一半时，每回合开始获得 4 格挡。', turnStart: (G, B) => { if (B.R.hp < B.R.maxHp / 2) G.block(4); } },
  herbs: { name: '山野草药', rar: 'u', icon: '🌿', desc: '每次进密营休息，额外回复 8 生命。', restHeal: () => 8 },
  intelmap: { name: '手绘敌情图', rar: 'u', icon: '🗺', desc: '每场战斗第一回合多抽 1 张牌。', draw: (B, first) => first ? 1 : 0 },
  flint: { name: '火镰', rar: 'u', icon: '🔥', desc: '每打赢一场战斗，生火取暖：体温 +2。', fightWon: R => { R.temp = Math.min(10, R.temp + 2); } },
  ginseng: { name: '野山参', rar: 'r', icon: '🌱', desc: '生命第一次降到 0 时，回复 30% 生命。每局一次。',
    lethal: (G, B) => { if (B.R.ginsengUsed) return false; B.R.ginsengUsed = 1; B.R.hp = Math.floor(B.R.maxHp * .3); G.fx('hero', '野山参吊住了一口气', 'heal'); return true; } },
  notes: { name: '苏联教官的笔记', rar: 'r', ch: 'hansong', icon: '📓', desc: '每回合第一张枪械牌费用 -1。', costMod: (B, d) => d.gun && !B.p.firstGunPlayed ? -1 : 0 },
  ammobox: { name: '弹药箱', rar: 'r', ch: 'hansong', icon: '📦', desc: '回合开始时子弹若已打光，自动装满。', turnStart: (G, B) => { if (B.ammo === 0) { B.ammo = B.cap; G.fx('hero', '弹药箱：装满', 'st'); } } },
  kwmap: { name: '关东军作战地图', rar: 'boss', icon: '🗾', desc: '每回合 +1 能量。地图上的节点全部显示成「？」。', energy: () => 1, hideMap: true },
  apcmg: { name: '装甲车机枪', rar: 'boss', ch: 'hansong', icon: '⚙', desc: '每回合 +1 能量。装填多花 1 点能量。', energy: () => 1, reloadCost: () => 1 },
  saber: { name: '讨伐队长的军刀', rar: 'boss', icon: '🗡', desc: '每回合 +1 能量。每场战斗开始获得 2 层虚弱。', energy: () => 1, battleStart: G => G.selfWeak(2) },
};
Object.entries(RELICS).forEach(([k, d]) => { d.id = k; });
