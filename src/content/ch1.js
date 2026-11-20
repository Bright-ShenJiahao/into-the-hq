// 第一章 · 林海雪原（1944 年冬）：地图、敌人、遭遇、事件都在这个文件里。
// 以后第二章、第三章照这个格式各写一个文件，在 data.js 的 CHAPTERS 里登记。
// 史实原则：武器、部队、地名、风物按真实历史；人名全部虚构；不写暴行和血腥。
import { pick } from './util.js';

export const ENEMIES_CH1 = {
  // sup：督战（日军和伪满警察队长在场时，伪满军不溃逃）；morale：会动摇溃逃；showAmmo：脚下显示弹数（普通敌人不显示，只有机枪组、精英、首领显示）
  inf: { name: '日军步兵', hp: [22, 26], col: '#6d6a3c', frames: 'inf', artH: 240, sup: 1,
    ammo: 2, moves: { shoot: { t: '射击', i: 'atk', d: 8, shot: 1 }, stab: { t: '刺杀', i: 'atk', d: 6, blk: 5 }, reload: { t: '装弹', i: 'reload', blk: 4 } },
    ai: (e, B, r) => e.last === 'stab' ? 'shoot' : r() < .7 ? 'shoot' : 'stab' },
  puppet: { name: '伪满军', hp: [14, 18], col: '#7a5a3a', frames: 'puppet', artH: 235, morale: 1,
    ammo: 2, moves: { shoot: { t: '射击', i: 'atk', d: 6, shot: 1 }, reload: { t: '装弹', i: 'reload', blk: 6 }, flee: { t: '溃逃', i: 'flee', tx: '动摇到 2 层、又没人督战时，扔下枪跑了' } },
    ai: (e, B) => (e.st.shaken >= 2 && !B.en.some(x => !x.dead && x.d.sup)) ? 'flee' : 'shoot' },
  dog: { name: '军犬', hp: [12, 15], col: '#5a4a3a', frames: 'dog', artH: 90,
    moves: { bite: { t: '撕咬', i: 'atk', d: 4, x: 2 }, pounce: { t: '扑倒', i: 'atk', d: 6, weak: 1 } },
    ai: (e, B, r) => e.last === 'pounce' ? 'bite' : r() < .6 ? 'bite' : 'pounce' },
  mortar: { name: '掷弹筒兵', hp: [20, 22], col: '#6a6050', frames: 'mortar', artH: 188, sup: 1,
    moves: { load: { t: '装弹', i: 'charge', next: 14 }, fire: { t: '炮击', i: 'atk', d: 14 }, dig: { t: '挖掩体', i: 'def', blk: 8 } },
    ai: e => ['load', 'fire', 'dig'][e.t % 3] },
  mg: { name: '机枪组', hp: [30, 34], col: '#4a5040', armor: 2, frames: 'mg', artH: 123, loot: 'c_type11', lootP: .5, sup: 1, showAmmo: 1,
    ammo: 2, moves: { spray: { t: '扫射', i: 'atk', d: 3, x: 3, shot: 1 }, reload: { t: '换弹斗', i: 'reload', blk: 10 } },
    ai: () => 'spray' },
  sniper: { name: '日军狙击手', hp: [18, 20], col: '#4e5a3a', frames: 'sniper', artH: 179, loot: 'c_type97', lootP: .5, sup: 1,
    ammo: 1, moves: { aim: { t: '瞄准', i: 'charge', next: 18 }, snipe: { t: '狙击', i: 'atk', d: 18, shot: 1 }, reload: { t: '拉栓装弹', i: 'reload', blk: 8 } },
    ai: e => e.last === 'aim' ? 'snipe' : 'aim' },
  sergeant: { name: '讨伐队军曹', hp: [50, 54], col: '#7a3a2a', elite: 1, frames: 'sergeant', artH: 250, loot: 'c_nambu', lootP: 1, sup: 1,
    moves: { rally: { t: '冲锋号令', i: 'buff', all: 2 }, saber: { t: '军刀劈砍', i: 'atk', d: 13 }, pistol: { t: '手枪射击', i: 'atk', d: 7, weak: 1 } },
    ai: e => e.t === 0 ? 'rally' : e.t % 2 ? 'saber' : 'pistol' },
  captain: { name: '讨伐队长 · 村濑', hp: [150, 150], col: '#5a2a2a', boss: 1, sup: 1, armor: 2, frames: 'captain_car', artH: 280, frames2: 'captain_foot', artH2: 265,
    moves: {
      mgun: { t: '车载机枪', i: 'atk', d: 4, x: 4, shot: 1 }, ram: { t: '冲撞', i: 'atk', d: 16 }, reload: { t: '关上舱盖换弹', i: 'reload', blk: 15 },
      saber: { t: '军刀', i: 'atk', d: 14 }, pistol: { t: '手枪连射', i: 'atk', d: 6, x: 2 }, roar: { t: '怒吼', i: 'buff', str: 3 },
    },
    ammo: 2, ai: (e, B, r) => e.phase === 2 ? (e.last === 'roar' ? 'saber' : e.t % 3 === 0 ? 'roar' : pick(r, ['saber', 'pistol'])) : e.last === 'mgun' ? 'ram' : 'mgun',
    onHurt: (e, G) => { if (e.phase !== 2 && e.hp <= e.max / 2) { e.phase = 2; e.armor = 0; e.block = 0; e.t = 0; e.move = 'roar'; e.anim = null; e.ammo = null; /* 下车后只用军刀和手枪，不再显示弹仓 */ G.say('装甲车被打瘫了！村濑跳下车，拔出军刀。'); G.fx(e.id, '装甲车瘫痪', 'st'); } } },
  // —— 新精英 / 新 Boss（美术还没画，先用色块） ——
  hmg: { name: '九二式重机枪阵地', hp: [58, 62], col: '#3e4636', frames: 'hmg', artH: 150, elite: 1, sup: 1, armor: 4, ammo: 1,
    moves: { fire: { t: '连射', i: 'atk', d: 5, x: 4, shot: 1 }, reload: { t: '压弹板', i: 'reload', blk: 12 } },
    ai: () => 'fire' },
  pcap: { name: '伪满警察讨伐队长', hp: [46, 50], col: '#5a4a2a', frames: 'pcap', artH: 250, elite: 1, sup: 1, ammo: 2,
    moves: { bounty: { t: '贴悬赏告示', i: 'debuff', vuln: 2 }, shoot: { t: '驳壳枪连射', i: 'atk', d: 6, x: 2, shot: 1 }, call: { t: '吹哨叫人', i: 'buff', summon: 'puppet', blk: 8 }, reload: { t: '压子弹', i: 'reload', blk: 6 } },
    ai: (e, B) => e.t === 0 ? 'bounty' : (B.en.filter(x => !x.dead && x !== e).length < 2 && e.last !== 'call') ? 'call' : 'shoot' },
  kcap: { name: '宪兵分队长 · 柏木', hp: [140, 140], col: '#3a2a2a', frames: 'kcap', artH: 280, boss: 1, sup: 1, ammo: 2,
    moves: { flare: { t: '打信号弹', i: 'debuff', weak: 2, allBlk: 6 }, dogs: { t: '放狗', i: 'buff', summon: 'dog', blk: 10 }, pistol: { t: '南部手枪', i: 'atk', d: 6, x: 2, shot: 1 }, saber: { t: '军刀劈砍', i: 'atk', d: 16 }, reload: { t: '压子弹', i: 'reload', blk: 8 } },
    ai: (e, B) => e.t === 0 ? 'flare' : (B.en.filter(x => !x.dead && x.key === 'dog').length < 2 && e.last !== 'dogs') ? 'dogs' : e.last === 'pistol' ? 'saber' : 'pistol' },
  /* 加强精英战里多出来的押运兵：背着档案箱（情报），3 回合后撤走。暂时借用日军步兵的图 */
  escort: { name: '押运档案箱的日军', hp: [20, 22], col: '#6d6a3c', frames: 'inf', artH: 240, intel: 1, sup: 1,
    moves: { back: { t: e => `后撤（${3 - e.t} 回合后撤走）`, i: 'def', blk: 5 }, flee: { t: '带着档案箱撤走', i: 'flee', tx: '第 3 回合带着档案箱撤走，情报就没了' } },
    ai: e => e.t >= 2 ? 'flee' : 'back' },
  /* —— 讨伐队的各兵种（还没出图，先用色块） —— */
  cav: { name: '伪满骑兵', hp: [24, 28], col: '#6a4a2a', frames: 'cav', artH: 270, morale: 1,
    moves: { charge: { t: '骑兵冲锋', i: 'atk', d: 15 }, saber: { t: '马刀', i: 'atk', d: 7 }, flee: { t: '溃逃', i: 'flee', tx: '动摇到 2 层、又没人督战时，打马跑了' } },
    ai: e => (e.t % 3 === 0 ? 'charge' : 'saber') },
  radio: { name: '通信兵', hp: [16, 20], col: '#4e5a3a', frames: 'radio', artH: 225, sup: 1,
    moves: { call: { t: '发报呼叫增援（下回合到）', i: 'buff', blk: 4 }, arrive: { t: '增援赶到', i: 'buff', summon: 'inf' }, shoot: { t: '射击', i: 'atk', d: 6 } },
    ai: e => (e.t === 0 ? 'call' : e.t === 1 ? 'arrive' : 'shoot') },
  supply: { name: '辎重兵', hp: [20, 24], col: '#5c5236', frames: 'supply', artH: 240, sup: 1,
    moves: { resupply: { t: '分发弹药（同伴子弹装满，格挡 +5）', i: 'def', allBlk: 5, fn: (e, B) => B.en.forEach(x => { if (!x.dead && x.d.ammo) x.ammo = x.d.ammo; }) }, shoot: { t: '射击', i: 'atk', d: 6 } },
    ai: e => (e.t % 2 === 0 ? 'resupply' : 'shoot'),
    onDeath: (e, B) => { B.R.food = (B.R.food || 0) + 2; B.msgs.push('辎重兵的背囊里还有干粮：口粮 +2'); } },
  medic: { name: '卫生兵', hp: [16, 18], col: '#5a5a48', frames: 'medic', artH: 170, sup: 1,
    moves: { bandage: { t: '包扎（伤最重的同伴回 10 血）', i: 'buff', fn: (e, B, G) => { const w = B.en.filter(x => !x.dead && x !== e && x.hp < x.max).sort((a, b) => (b.max - b.hp) - (a.max - a.hp))[0]; if (w) { w.hp = Math.min(w.max, w.hp + 10); G.fx(w.id, '+10', 'heal'); } } },
      cover: { t: '找掩护', i: 'def', blk: 8 } },
    ai: (e, B) => (B.en.some(x => !x.dead && x !== e && x.hp < x.max) ? 'bandage' : 'cover') },
  ski: { name: '滑雪兵', hp: [20, 23], col: '#c8ccd0', frames: 'ski', artH: 240, sup: 1,
    moves: { strike: { t: '滑过来射击（打完就滑开：你下一下打不中）', i: 'atk', d: 9, evade: 1 }, glide: { t: '绕到侧面', i: 'def', blk: 6 } },
    ai: e => (e.t % 2 ? 'glide' : 'strike') },
  gun: { name: '步兵炮小队', hp: [62, 68], col: '#4a4a36', frames: 'gun', artH: 160, elite: 1, sup: 1, interrupt: { at: 15, moves: ['aim1', 'aim2'], to: 'stagger' },
    moves: { aim1: { t: '架炮瞄准（这回合挨够 15 伤害就被打断）', i: 'charge', next: '开炮', blk: 8 }, aim2: { t: '装填炮弹（挨够 15 伤害就被打断）', i: 'charge', next: '开炮', blk: 8 },
      fire: { t: '九二式步兵炮开炮', i: 'atk', d: 26 }, stagger: { t: '手忙脚乱', i: 'def', blk: 4 }, shoot: { t: '步枪射击', i: 'atk', d: 7 } },
    ai: e => { if (e.last === 'stagger') e.cyc = 3; e.cyc = ((e.cyc == null ? -1 : e.cyc) + 1) % 4; return ['aim1', 'aim2', 'fire', 'shoot'][e.cyc]; } },
};

Object.entries(ENEMIES_CH1).forEach(([k, d]) => { d.key = k; });
/* 逐帧动画的画布信息（切图脚本算出来的）：cw/ch 画布宽高，ax 脚底锚点 x，sw/sh 站立时人物宽高 */
export const FRAMES_CH1 = { inf: { cw: 462, ch: 404, ax: 195, sw: 359, sh: 402 },
  puppet: { cw: 555, ch: 396, ax: 278, sw: 274, sh: 394 }, dog: { cw: 635, ch: 211, ax: 360, sw: 384, sh: 153 }, mortar: { cw: 498, ch: 317, ax: 215, sw: 309, sh: 315 },
  mg: { cw: 521, ch: 216, ax: 271, sw: 393, sh: 206 }, sniper: { cw: 504, ch: 341, ax: 232, sw: 368, sh: 299 }, sergeant: { cw: 440, ch: 382, ax: 154, sw: 240, sh: 380 },
  captain_car: { cw: 312, ch: 222, ax: 149, sw: 281, sh: 208 }, captain_foot: { cw: 426, ch: 264, ax: 147, sw: 185, sh: 249 },
  hmg: { cw: 433, ch: 230, ax: 179, sw: 424, sh: 228 }, pcap: { cw: 580, ch: 387, ax: 172, sw: 178, sh: 385 }, kcap: { cw: 450, ch: 376, ax: 246, sw: 118, sh: 374 },
  cav: { cw: 407, ch: 276, ax: 212, sw: 248, sh: 235 }, radio: { cw: 374, ch: 264, ax: 162, sw: 152, sh: 256 }, supply: { cw: 548, ch: 228, ax: 285, sw: 157, sh: 226 }, medic: { cw: 388, ch: 231, ax: 152, sw: 179, sh: 164 }, ski: { cw: 387, ch: 212, ax: 180, sw: 182, sh: 210 }, gun: { cw: 441, ch: 164, ax: 202, sw: 267, sh: 162 } };
/* 色块占位时的大小（还没出图的敌人） */
export const BLOCK_SIZE_CH1 = {};

/* 遭遇池：前 3 场普通战斗用 easy，之后用 hard（同通往顶端） */
export const ENC_CH1 = {
  easy: [['inf'], ['puppet', 'puppet'], ['dog', 'dog'], ['puppet', 'dog'], ['cav'], ['ski', 'puppet']],
  hard: [['inf', 'puppet', 'puppet'], ['mg', 'puppet'], ['mortar', 'inf'], ['sniper', 'inf'], ['dog', 'inf', 'dog'], ['mg', 'dog'],
    ['sniper', 'puppet', 'puppet'], ['inf', 'inf'], ['mortar', 'dog', 'dog'], ['sniper', 'mg'], ['puppet', 'puppet', 'puppet'], ['inf', 'mortar', 'puppet'],
    ['cav', 'puppet', 'puppet'], ['radio', 'inf'], ['supply', 'inf', 'puppet'], ['medic', 'inf', 'inf'], ['ski', 'ski'], ['cav', 'dog'], ['radio', 'mortar']],
  elite: [['inf', 'sergeant', 'inf'], ['inf', 'hmg'], ['puppet', 'pcap', 'puppet'], ['gun', 'inf'], ['gun', 'medic']],
  boss: [['inf', 'captain'], ['dog', 'kcap', 'dog']],
};

/* 地图事件。每个选项：t 文字；need(G) 能不能选；f(G) 结果，返回结果说明。
   G 提供：food、temp、hp、heal、maxHp、upgrade、removeCard、addCard、relic、item、hasItem、loseItem、fight、nextFight、rng */
export const EVENTS_CH1 = [
  { id: 'hunter', title: '林中的老猎户', text: '雪地里遇见一位背着火枪的老猎户。他打量了一下你们背的枪，压低声音说：「山那边有讨伐队，别走大路。」',
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
  { id: 'courier', title: '苏联方面的补给', text: '约定的那棵老红松底下，雪是新翻过的。这是上一支回国的小分队从苏联那边带过来、埋在这儿备用的东西，用油布包得严严实实。',
    opts: [
      { t: '取出那支冲锋枪（获得「波波沙」）', f: G => { G.addCard('c_ppsh'); return '一支苏制波波沙冲锋枪，枪油还没干。'; } },
      { t: '取出药品（获得背包用品「急救包」，回复 10 生命）', f: G => { G.item('medkit'); G.heal(10); return '油布里有绷带、磺胺粉，还有一小瓶酒精。'; } },
    ] },
  { id: 'shrine', title: '山神爷', text: '山路拐弯处有一座半人高的小庙，用几块石板搭成，供着「山神爷老把头」。放山的、打猎的进山前都要在这儿拜一拜。风停了，四下静得出奇。',
    opts: [
      { t: '留下一块干粮（口粮 -1，最大生命 +4）', need: G => G.foodN() >= 1, f: G => { G.food(-1); G.maxHp(4); G.awe(1, '放山的、打猎的都拜它。咱借道走，也该打声招呼。'); return '你放下干粮，鞠了一躬。起身时，好像听见庙后面有什么东西轻轻走开了。'; } },
      { t: '不停留', f: () => '你们没有停下。走出很远，回头还能看见小庙前那截没烧完的香。' },
    ] },
  { id: 'river', title: '封冻的河', text: '一条河挡在前面。冰面看着结实，但河心颜色发暗。绕到上游的桥要多走半天。',
    opts: [
      { t: '踩冰过河（一半可能落水：生命 -8，体温 -4）', f: G => { if (G.rng() < .5) { G.hp(-8); G.temp(-4); return '冰面「咔」地裂开，你半个身子掉进冰水里。'; } return '冰面吱吱作响，但你们平安过去了。'; } },
      { t: '绕路（体温 -2，口粮 -1）', f: G => { G.temp(-2); G.food(-1); return '你们在风雪里多走了半天。'; } },
    ] },
  { id: 'tribe', title: '集团部落', text: '山脚下是一座「集团部落」：日伪把山里的散户强迫并进来，四周围着土墙和炮楼，为的是断掉老百姓给抗联送粮。墙根底下，有人朝你们这边轻轻咳了一声。',
    opts: [
      { t: '夜里摸到墙根接头（口粮 +3；可能被伪满警察发现）', f: G => { G.food(3); if (G.rng() < .4) { G.fight(['puppet', 'puppet']); return '老乡递出一口袋苞米，可炮楼上的探照灯扫了过来！'; } return '一只粗糙的手从墙缝里递出一口袋苞米，什么话也没说。'; } },
      { t: '不连累老乡，绕开（体温 -1）', f: G => { G.temp(-1); return '你们在林子里多绕了一段路。'; } },
    ] },
  { id: 'fishing', title: '冰窟窿', text: '一条小河冻得结结实实。用刺刀凿个冰窟窿，兴许能捞上几条鱼，就是得在冰上待好一阵。',
    opts: [
      { t: '凿冰捕鱼（口粮 +2，体温 -2）', f: G => { G.food(2); G.temp(-2); return '捞上来几条冻得发硬的细鳞鱼。'; } },
      { t: '不耽误工夫', f: () => '你们没有停下。' },
    ] },
  { id: 'wagon', title: '翻倒的马车', text: '雪沟里翻着一辆日军的运输马车，车辕断了，马不知去向。车上的木箱散了一地。',
    opts: [
      { t: '搜车（获得 1 件背包用品；押车的军犬可能还在附近）', f: G => { G.item(); if (G.rng() < .3) { G.fight(['dog', 'dog']); return '你刚把箱子撬开，林子里就传来了狗叫！'; } return '箱子里有些军用物资，还没冻坏。'; } },
      { t: '劈了车板生火（体温 +3）', f: G => { G.temp(3); return '干透的车板烧得很旺。'; } },
    ] },
  { id: 'blizzard', title: '白毛风', text: '山里刮起了「白毛风」，雪粒子横着飞，几步外就看不见人。',
    opts: [
      { t: '挖个雪洞避风（口粮 -1，回复 12 生命）', need: G => G.foodN() >= 1, f: G => { G.food(-1); G.heal(12); return '雪洞里比外面暖和得多，你们挤在一起熬过了一夜。'; } },
      { t: '顶风赶路（体温 -3）', f: G => { G.temp(-3); return '风停的时候，眉毛和帽檐上都结满了霜。'; } },
    ] },
  { id: 'oldcamp', title: '旧密营遗址', text: '1940 年前后，山里很多密营被日伪讨伐队烧毁了。这里只剩半截地窨子，木头墙上刻着几行字，是先走的战友留下的。',
    opts: [
      { t: '翻找一下（获得 1 件随身物品）', f: G => { G.relic(); return '炕洞里藏着一个小布包，是当年留下的东西。'; } },
      { t: '在墙上也刻下小分队的名字（升级 1 张牌）', f: G => { G.upgrade(); return '你用刺刀一笔一画刻下了名字，和前面那几行字挨在一起。'; } },
    ] },
  { id: 'manchu', title: '满族老猎人', text: '一个满族老猎人拖着爬犁从林子里出来，爬犁上捆着一只狍子。他在这片山里打了一辈子猎，看了看你们，问要不要换东西。',
    opts: [
      { t: '用一件背包用品换狍子肉（口粮 +4）', need: G => G.hasItem(), f: G => { G.loseItem(); G.food(4); return '他掂了掂你给的东西，割下半扇狍子肉递过来。'; } },
      { t: '请他指一条近路（体温 +3）', f: G => { G.temp(3); return '他带着你们穿过一片背风的山坳，少走了半天的冤枉路。'; } },
    ] },
  { id: 'digger', title: '放山人', text: '林子里遇见一个放山的老人，正守着一棵刚发现的山参，说要等到天亮才能动手挖。',
    opts: [
      { t: '帮他守一夜（体温 -2；获得背包用品「獾子油」）', f: G => { G.temp(-2); G.item('badger'); return '天亮时，老人从怀里掏出一个小罐子：「獾子油，冻伤了就抹上。」'; } },
      { t: '用 2 口粮换一截参须（回复 15 生命）', need: G => G.foodN() >= 2, f: G => { G.food(-2); G.heal(15); return '参须熬的汤又苦又暖，喝下去浑身都有了力气。'; } },
    ] },
  /* —— 以下三个：日本逃兵（语言选项）、黄皮子讨封、保家仙牌位（「敬畏」：看得见的事件标记，选完老沈说一句；只影响以后的事件分支，第三章兑现） —— */
  { id: 'deserter', title: '冻僵的日本兵', text: '雪窝子里蜷着一个日本兵，枪不见了，脸冻得发紫。看见你们，他哆哆嗦嗦地举起两只手，嘴里反反复复念叨着同一句日语。',
    opts: [
      { t: '【听得懂几句日语】仔细听他在说什么', need: G => G.lang('ja') >= 1, f: G => { G.relic(G.hasRelic('intelmap') ? null : 'intelmap'); return '你只听懂了几个词：「讨伐队」「北沟」「明天」。他是从讨伐队里逃出来的，路线全在他嘴里。你们照着他比划的方向，画下了一张敌情图。'; } },
      { t: '给他一口吃的，指条下山的路（口粮 -1）', need: G => G.foodN() >= 1, f: G => { G.food(-1); if (G.rng() < .3) { G.fight(['inf', 'inf']); return '他千恩万谢地走了。半个时辰后，林子里响起了枪声——他还是把讨伐队带了回来。'; } G.maxHp(3); return '他千恩万谢，朝山下踉踉跄跄地走了。有人一直盯着他的背影，直到看不见。（最大生命 +3）'; } },
      { t: '搜走他身上的东西，各走各的路', f: G => { G.item('beef'); return '你们从他的背囊里翻出一个罐头。走出很远，没人回头。'; } },
    ] },
  { id: 'weasel', title: '黄皮子讨封', text: '雪地上，一只黄皮子（黄鼠狼）像人一样直直地站了起来，两只前爪拱在胸前，一动不动地盯着你。屯子里的老辈人说过：黄皮子修行到了时候，会拦住过路人「讨封」，问一句——「你看我，像人，还是像神？」',
    opts: [
      { t: '「像神。」', f: G => { G.awe(2, '讨封的事，屯子里的老人都这么应。它往后不找你麻烦。'); G.heal(10); return '它冲你拜了三拜，一扭身钻进林子，雪上没留下脚印。那天夜里，你们睡得格外踏实。（生命 +10）'; } },
      { t: '「像个黄皮子。」', f: G => { G.awe(-2, '这话太冲了。老辈人说，讨封被驳了的，记仇。'); G.temp(-2); return '它盯了你一会儿，慢慢趴下，走了。当晚林子里刮起一阵怪风，怎么也生不着火。（体温 -2）'; } },
      { t: '举枪', f: G => { G.awe(-3, '……往后别这么干。子弹是留给鬼子的。'); G.temp(-1); return '枪响了，什么也没打中。雪地上干干净净，连个脚印都没有。田守义的脸色很难看。（体温 -1）'; } },
      { t: '不搭腔，绕开走', f: () => '你们绕了个大圈子。回头再看，它还站在原地，望着你们。' },
    ] },
  { id: 'baojiaxian', title: '保家仙的牌位', text: '被烧掉的屯子里，一间塌了半边的土坯房，墙角还供着一块红纸写的仙家牌位，香炉里落满了雪。这一家人去了哪儿，没人知道。',
    opts: [
      { t: '摆上一点干粮当供品，点一炷香（口粮 -1，生命 +6）', need: G => G.foodN() >= 1, f: G => { G.food(-1); G.awe(2, '这一家人不知道还在不在。替他们供上，也算个念想。'); G.heal(6); return (G.char === 'hansong' ? '韩松在门口站了很久，一句话也没说。' : '') + '香火在冷风里晃了晃，没灭。'; } },
      { t: '拿走供桌上剩下的炒黄豆', f: G => { G.awe(-2, '人都不在了……算了，饿着肚子也是真的。'); G.item('soybeans'); return '你把供桌上那一小袋炒黄豆揣进了怀里。出门时，背后好像有什么东西「咔哒」响了一声。'; } },
      { t: '什么也不碰，默默离开', f: () => '你们轻轻带上了半扇破门。' },
    ] },
];

export const CHAPTER1 = {
  id: 1, name: '林海雪原', season: '1944 年冬', rows: 15, cols: 5,
  /* 地图规则（照通往顶端 / 杀戮尖塔）：节点权重；第几层固定什么；精英和密营最早第几层 */
  nodes: { fight: 45, event: 22, elite: 16, rest: 12, shop: 5 }, fixed: { 0: 'fight', 4: 'shop', 8: 'treasure', 14: 'rest' }, /* 第 5 层固定老乡 */ earliest: 5, easyFights: 3,
  /* 底图上各区域的位置（按比例，换图不用改代码） */
  map: { img: 'assets/bg/map_ch1.jpg', w: 1000, h: 1779, startY: .865, endY: .175, bossX: .5, bossY: .092, xMin: .27, xMax: .73, startLabel: '▲ 向长白山北麓转进' },
  battleBg: 'assets/bg/battle_snow25.jpg', enemies: ENEMIES_CH1, frames: FRAMES_CH1, blockSize: BLOCK_SIZE_CH1, enc: ENC_CH1, events: EVENTS_CH1,
  winText: '这一带的封锁暂时松动。老沈收起路线图，小队连夜离开密营，转赴新京。',
  /* Boss 战单独的背景（图还没出时自动用 battleBg）：村濑的装甲车只能开在林区公路上 */
  bossBg: { captain: 'assets/bg/battle_road25.jpg' },
};
