// 第三章「地下」（1945 年 8 月 9 日—14 日，长春地下）：恐怖向。
// 资源：「理智」代替可疑度（0—10）。地图分三段，各段敌人和事件不同：
//   第 1—5 层：建国神庙背后的防空壕（真实存在过）
//   第 6—10 层：日军秘密仓库，正在烧档案（虚构）
//   第 11—15 层：被挖穿的辽金古墓（虚构）
// 写法红线：恐怖来自黑暗、声音、数不对的人数、牌和界面开始不可信；不写血腥；
//   怪物绝不来自受害者——影子、回声、守墓的东西都和古墓有关，和战争死难者无关；面具是「捡起面具戴上的东西」，不是墓主人。
// 美术还没出：人类敌人借第一章的图，墓里的东西先用暗色块。

export const SEG = r => (r < 5 ? 0 : r < 10 ? 1 : 2);
export const SEG_NAME = ['防空壕', '仓库', '古墓'];

/* 「它」这张牌的说明会越来越长：每打赢一场多一行（game.js 改 ITC.n） */
export const ITC = { n: 0 };
const IT_LINES = ['不能打出。回合结束时还在手里：理智 -1。', '它在你的牌里。', '它记得你的名字。', '它在数你们有几个人。', '数出来少一个。', '再数一遍，又多一个。', '它不着急。', '它在看。'];

/* ---------- 本章的牌：仪式牌、废牌 ---------- */
export const CARDS_CH3 = {
  rt_drum: { name: '神鼓', type: 'skill', cost: [1, 1], rar: 'c', sch: '通', ritual: 1, retain: 1, icon: 'cover',
    desc: () => '仪式第一步。获得 8 格挡。保留（回合结束不弃掉）。', play: G => { G.block(8); G.ritual(1); } },
  rt_bell: { name: '腰铃', type: 'skill', cost: [1, 1], rar: 'c', sch: '通', ritual: 1, retain: 1, icon: 'cover',
    desc: () => '仪式第二步。抽 2，获得 6 格挡。保留。', play: G => { G.draw(2); G.block(6); G.ritual(2); } },
  rt_knife: { name: '神刀', type: 'skill', cost: [1, 1], rar: 'c', sch: '通', ritual: 1, retain: 1, icon: 'dadao',
    desc: () => '仪式最后一步：把它封回去。保留。', play: G => G.ritual(3) },
  fear: { name: '恐惧', type: 'skill', cost: [0, 0], rar: 'c', sch: '通', unplay: 1, ethereal: 1, icon: 'helmet',
    desc: () => '不能打出。回合结束时消失。' },
  it_curse: { name: '它', type: 'skill', cost: [0, 0], rar: 'c', sch: '通', unplay: 1, noRemove: 1, icon: 'helmet',
    desc: () => IT_LINES.slice(0, Math.min(IT_LINES.length, 1 + ITC.n)).join('<br>'),
    inHandEnd: (G, B) => (B.R.san != null ? G.san(-1) : G.loseHp(2)) },
};
Object.values(CARDS_CH3).forEach(d => { d.ch = 'ch3'; }); /* 不进任何人的奖励池 */

/* ---------- 敌人 ----------
   新字段：ghost 墓里的东西（画面上发虚）；dodge 每回合一次、按几率「散开」躲掉一下；immune 打不动；
   招式 san 理智 -n；echo 学你上一下的伤害；allHurt 连同伙一起炸；steal 拿走你一张牌两回合；curse 往你牌堆里塞废牌；fn 自定义 */
const priestOf = B => B.en.find(x => !x.dead && x.key === 'priest');
/* 真结局：参谋烧证据。B.evid 从 100 往下掉，打赢时剩多少，名单上就看得清多少 */
const burnEv = (B, G, n) => { B.evid = Math.max(0, (B.evid == null ? 100 : B.evid) - n); G.fx('hero', `档案烧掉了（证据还剩 ${B.evid}%）`, 'st'); };
export const ENEMIES_CH3 = {
  /* —— 真结局：不肯投降的关东军参谋（虚构）。第一阶段边打边烧证据；半血起身成「军神」，背后的刀一回合多一把，每把多打一下 —— */
  staff: { name: '关东军参谋·大槻中佐', hp: [290, 290], col: '#4a3a24', frames: 'staff', artH: 290, frames2: 'wargod', artH2: 320, boss: 1,
    moves: Object.assign({
      saber: { t: '军刀（顺手烧掉一摞档案）', i: 'atk', d: 14, fn: (e, B, G) => burnEv(B, G, 10) },
      toss: { t: '把档案扔进火里', i: 'def', blk: 12, fn: (e, B, G) => burnEv(B, G, 18) },
      order: { t: '念「玉碎」命令', i: 'debuff', weak: 2, fn: (e, B, G) => burnEv(B, G, 10) },
      rise: { t: '「军神」', i: 'buff', str: 2 },
    }, Object.fromEntries(Array.from({ length: 9 }, (_, k) => ['b' + (k + 1), { t: `背后的军刀（${k + 1} 把，打完再多一把）`, i: 'atk', d: 5, x: k + 1, fn: e => { e.blades = (e.blades || 2) + 1; } }]))),
    ai: (e, B) => e.phase === 2 ? 'b' + Math.min(9, e.blades || 2) : ['saber', 'toss', 'saber', 'order'][e.t % 4],
    onHurt: (e, G) => { if (e.phase !== 2 && e.hp <= e.max / 2) { e.phase = 2; e.block = 0; e.blades = 2; e.t = 0; e.move = 'rise'; e.anim = null;
      G.say('火光里，他慢慢站了起来。背后……插满了军刀。'); G.fx(e.id, '军神', 'st'); } } },
  /* —— 防空壕 —— */
  shrineguard: { name: '神庙卫兵', hp: [24, 28], col: '#4a4a30', frames: 'shrineguard', artH: 240, sup: 1, ammo: 2,
    moves: { shoot: { t: '射击', i: 'atk', d: 8, shot: 1 }, stab: { t: '刺刀', i: 'atk', d: 11 }, reload: { t: '装弹', i: 'reload', blk: 6 } },
    ai: e => (e.last === 'shoot' ? 'stab' : 'shoot') },
  kguard: { name: '神官的随行宪兵', hp: [64, 70], col: '#3a3a2a', frames: 'kguard', artH: 245, elite: 1, sup: 1,
    moves: { guard: { t: '护住（全体格挡 +8）', i: 'def', allBlk: 8, blk: 10 }, saber: { t: '军刀', i: 'atk', d: 15 }, shoot: { t: '手枪连射', i: 'atk', d: 6, x: 2 } },
    ai: e => ['guard', 'saber', 'shoot'][e.t % 3] },
  /* —— 仓库 —— */
  burner: { name: '烧档案的宪兵', hp: [22, 26], col: '#5a4a30', frames: 'burner', artH: 240, sup: 1,
    moves: { burn: { t: '往炉子里扔档案（烧伤混进牌堆）', i: 'def', blk: 7, curse: 'st_burn' }, shoot: { t: '射击', i: 'atk', d: 9 } },
    ai: e => (e.t % 2 ? 'shoot' : 'burn') },
  /* 加强精英里那个：3 回合内不打倒，「拟销毁目录」就烧完了（第三份证据） */
  escort3: { name: '烧目录的宪兵', hp: [20, 22], col: '#5a4a30', frames: 'escort3', noAtk: 1, artH: 240, intel: 1, fleeTx: '把最后一页扔进了炉子',
    moves: { back: { t: e => `烧目录（${3 - e.t} 回合后烧完）`, i: 'def', blk: 5 }, flee: { t: '烧完了', i: 'flee', tx: '第 3 回合把目录烧完' } },
    ai: e => (e.t >= 2 ? 'flee' : 'back') },
  sapper: { name: '爆破工兵', hp: [20, 24], col: '#5a5040', frames: 'sapper', artH: 170,
    moves: { plant: { t: '埋炸药', i: 'def', blk: 5 }, fuse: { t: '点引信（下回合爆炸）', i: 'charge', next: '爆炸', blk: 5 },
      blast: { t: '引爆（连同伙一起炸）', i: 'atk', d: 20, allHurt: 12 }, shoot: { t: '射击', i: 'atk', d: 7 } },
    ai: e => ['plant', 'fuse', 'blast'][e.t] || 'shoot' },
  /* —— 溃败中的人（还没出图，先用色块） —— */
  /* 1945 年 7 月关东军「根こそぎ动员」，把在满的日本男人拉来凑数。士气差，同伴倒下一个就投降 */
  oldsoldier: { name: '临时召集的老兵', hp: [13, 16], col: '#5e5a44', frames: 'oldsoldier', artH: 230, morale: 1, brittle: 1, fleeTx: '扔下枪，举起了手',
    moves: { shoot: { t: '射击', i: 'atk', d: 6 }, flee: { t: '投降', i: 'flee', tx: '同伴倒下一个、又没人督战时，就投降' } },
    ai: () => 'shoot' },
  officer: { name: '撤退的军官', hp: [30, 34], col: '#4a4636', frames: 'officer', artH: 235, sup: 1, fleeTx: '跳上卡车跑了',
    moves: { order: { t: '命令部下断后（全体格挡 +6）', i: 'def', allBlk: 6 }, pistol: { t: '手枪', i: 'atk', d: 8 }, flee: { t: '跑了', i: 'flee', tx: '第 4 回合跳上卡车跑掉' } },
    ai: e => (e.t >= 3 ? 'flee' : e.t % 2 ? 'pistol' : 'order'),
    onDeath: (e, B) => { if (!(B.R.flags || []).includes('reveal')) { B.R.flags = [...(B.R.flags || []), 'reveal']; B.msgs.push('他的图囊里有一张地下工事的图：往后的地图全看得见。'); } } },
  surgeon: { name: '军医', hp: [18, 22], col: '#5a5a50', frames: 'surgeon', artH: 175, sup: 1,
    moves: { treat: { t: '给伤兵包扎（同伴回 12 血，去掉虚弱和易伤）', i: 'buff', fn: (e, B, G) => { const w = B.en.filter(x => !x.dead && x !== e && !x.d.civ).sort((a, b) => (b.max - b.hp) - (a.max - a.hp))[0]; if (w) { w.hp = Math.min(w.max, w.hp + 12); delete w.st.weak; delete w.st.vuln; G.fx(w.id, '+12', 'heal'); } } },
      pistol: { t: '手枪', i: 'atk', d: 6 } },
    ai: (e, B) => (B.en.some(x => !x.dead && x !== e && x.hp < x.max) ? 'treat' : 'pistol') },
  depotchief: { name: '弹药库守备队长', hp: [70, 76], col: '#4a3a2a', frames: 'depotchief', artH: 245, elite: 1, sup: 1,
    moves: { guard: { t: '守住库门（格挡 +12）', i: 'def', blk: 12 }, saber: { t: '军刀', i: 'atk', d: 12 }, shoot: { t: '手枪连射', i: 'atk', d: 5, x: 2 },
      fuse: { t: '点燃弹药库（下回合爆炸）', i: 'charge', next: '爆炸', blk: 10 },
      blast: { t: '弹药库爆炸（他和同伙也一起炸）', i: 'atk', d: 22, allHurt: 22, fn: (e, B, G) => G.vanish(e, '和弹药库一起没了') } },
    ai: e => { if (e.last === 'fuse') return 'blast'; if (e.hp < e.max / 2 && !e.fused) { e.fused = 1; return 'fuse'; } return ['guard', 'saber', 'shoot'][e.t % 3]; } },
  /* —— 古墓（这些东西和古墓有关，和战争死难者无关） —— */
  shadow: { name: '影子', hp: [18, 22], col: '#15151c', frames: 'shadow', artH: 235, ghost: 1, dodge: .5, noBleed: 1,
    moves: { drift: { t: '……', i: 'unk', hide: 1, blk: 5 }, touch: { t: '贴过来', i: 'atk', d: 9, hide: 1 }, chill: { t: '冷', i: 'debuff', hide: 1, weak: 1, san: 1 } },
    ai: e => ['drift', 'touch', 'chill', 'touch'][e.t % 4] },
  echo: { name: '回声', hp: [24, 28], col: '#1c1a22', frames: 'echo', artH: 245, ghost: 1, noBleed: 1,
    moves: { listen: { t: '在听', i: 'def', blk: 8 }, mimic: { t: '学你（你上一下打出多少，它就打回多少）', i: 'atk', echo: 1 } },
    ai: e => (e.t % 2 ? 'mimic' : 'listen') },
  tombkeeper: { name: '守墓的东西', hp: [48, 54], col: '#24201a', frames: 'tombkeeper', artH: 230, noBleed: 1,
    moves: { stir: { t: '翻身（理智 -1）', i: 'def', blk: 14, san: 1 }, crush: { t: '压下来', i: 'atk', d: 18 } },
    ai: e => (e.t % 2 ? 'crush' : 'stir') },
  mask: { name: '戴金属面具的东西', hp: [80, 86], col: '#2a2418', frames: 'mask', artH: 265, ghost: 1, elite: 1, noBleed: 1,
    moves: { take: { t: '伸手（拿走你一张牌两回合）', i: 'debuff', steal: 1, blk: 8 }, claw: { t: '抓', i: 'atk', d: 8, x: 2 }, stare: { t: '面具在看你', i: 'debuff', san: 1, vuln: 2 } },
    ai: e => ['take', 'claw', 'stare', 'claw'][e.t % 4] },
  /* —— 首领：自称阴阳师的随军神官（虚构）。钉子用阵亡军官的军刀熔铸 —— */
  nail: { name: '镇龙钉', hp: [16, 16], col: '#3a3a40', noAtk: 1, frames: 'nail', artH: 150, noKill: 1, noBleed: 1, hurtMul: B => ((B.R.relics || []).includes('hilt') ? 2 : 1),
    moves: { hold: { t: '镇（神官格挡 +6）', i: 'def', fn: (e, B) => { const p = priestOf(B); if (p) { p.block += 6; B.G.fx(p.id, '+6', 'blk'); } } } },
    ai: () => 'hold' },
  priest: { name: '随军神官·鹫尾', hp: [210, 210], col: '#2a2a2a', frames: 'priest', artH: 285, boss: 1,
    moves: { nail: { t: '钉下镇龙钉', i: 'buff', summon: 'nail', blk: 6 }, norito: { t: '祝词（每颗钉格挡 +8）', i: 'def', fn: (e, B) => { const n = B.en.filter(x => !x.dead && x.key === 'nail').length; if (n) { e.block += 8 * n; B.G.fx(e.id, '+' + 8 * n, 'blk'); } } },
      sword: { t: '神刀', i: 'atk', d: 16 }, curse: { t: '咒', i: 'debuff', weak: 2, san: 1 } },
    ai: (e, B) => {
      const nails = B.en.filter(x => !x.dead && x.key === 'nail').length, cap = (B.R.flags || []).includes('pulled') ? 2 : 3;
      if (nails < cap && e.last !== 'nail' && e.t % 2 === 0) return 'nail';
      return nails && e.last !== 'norito' ? 'norito' : e.last === 'sword' ? 'curse' : 'sword';
    },
    /* 神官倒下：剩下的钉子化掉，地底下的「它」醒来；剩几颗钉，它就强几分。萨满老人开始仪式 */
    onDeath: (e, B, G) => {
      const nails = B.en.filter(x => !x.dead && x.key === 'nail'); nails.forEach(x => G.vanish(x, '钉子化了'));
      const it = G.spawn('it'), k = 3 * nails.length + ((B.R.flags || []).includes('pulled') ? 2 : 0); if (k) it.st.str = k;
      B.ritual = { step: 0 };
      B.msgs.push('神官倒下了。脚下的地面在往下沉。', '黑暗里有一个比黑暗更黑的东西，慢慢抬起了头。', '萨满老人在你身后敲响了神鼓：「别回头。照我说的做：鼓、铃、刀。」');
      if (nails.length) B.msgs.push(`还剩 ${nails.length} 颗钉没拔掉，它醒得更快了。`);
      if ((B.R.awe || 0) >= 3) { G.block(15); B.msgs.push('一只黄皮子从你脚边窜过去，挡在了你前面。'); }
      if ((B.R.awe || 0) <= -3) { G.spawn('shadow'); B.msgs.push('山里的东西不帮你。黑暗里多了一个影子。'); }
    } },
  it: { name: '它', hp: [999, 999], col: '#08080a', frames: 'it', artH: 150, ghost: 1, boss: 1, immune: 1, nohp: 1, noKill: 1, sealTx: '沉回了地底',
    moves: { press: { t: '压下来（理智 -1）', i: 'atk', d: 9, san: 1 }, whisper: { t: '低语（两张恐惧混进牌堆）', i: 'debuff', curse: 'fear', cn: 2, weak: 1 }, reach: { t: '伸过来', i: 'atk', d: 6, x: 2 } },
    ai: e => ['press', 'whisper', 'reach'][e.t % 3] },
};
Object.entries(ENEMIES_CH3).forEach(([k, d]) => { d.key = k; });

/* 帧图尺寸（切图脚本算出来的：画布宽高、脚底锚点、站立姿势宽高） */
export const FRAMES_CH3 = { staff: { cw: 298, ch: 259, ax: 132, sw: 82, sh: 249 }, wargod: { cw: 312, ch: 320, ax: 127, sw: 187, sh: 317 }, /* 真结局的参谋和「军神」，真结局写代码时接上 */ escort3: { cw: 415, ch: 280, ax: 169, sw: 253, sh: 277 }, sapper: { cw: 432, ch: 187, ax: 248, sw: 267, sh: 158 }, kguard: { cw: 404, ch: 293, ax: 156, sw: 140, sh: 274 },
  shrineguard: { cw: 468, ch: 190, ax: 220, sw: 301, sh: 187 }, burner: { cw: 453, ch: 199, ax: 232, sw: 117, sh: 197 },
  shadow: { cw: 371, ch: 207, ax: 238, sw: 198, sh: 203 }, echo: { cw: 392, ch: 208, ax: 261, sw: 112, sh: 206 },
  mask: { cw: 475, ch: 207, ax: 299, sw: 228, sh: 205 }, it: { cw: 560, ch: 183, ax: 328, sw: 450, sh: 170 },
  tombkeeper: { cw: 469, ch: 207, ax: 232, sw: 315, sh: 203 }, nail: { cw: 307, ch: 214, ax: 149, sw: 166, sh: 204 },
  priest: { cw: 458, ch: 419, ax: 215, sw: 210, sh: 415 },
  oldsoldier: { cw: 288, ch: 245, ax: 153, sw: 209, sh: 243 }, officer: { cw: 348, ch: 236, ax: 171, sw: 225, sh: 226 }, surgeon: { cw: 385, ch: 238, ax: 138, sw: 187, sh: 205 }, depotchief: { cw: 496, ch: 251, ax: 233, sw: 192, sh: 237 } };

/* 遭遇池：按地图分段 */
export const SEG_ENC = [
  { easy: [['shrineguard'], ['inf', 'dog'], ['shrineguard', 'dog']],
    hard: [['shrineguard', 'shrineguard'], ['inf', 'mg'], ['shrineguard', 'inf', 'dog'], ['sniper', 'shrineguard'], ['oldsoldier', 'oldsoldier', 'shrineguard'], ['officer', 'oldsoldier', 'oldsoldier']],
    elite: [['kguard'], ['kguard', 'dog']] },
  { easy: [['burner'], ['sapper', 'inf']],
    hard: [['burner', 'sapper'], ['inf', 'inf', 'sapper'], ['mg', 'burner'], ['burner', 'burner', 'dog'], ['sapper', 'sapper'], ['surgeon', 'burner', 'inf'], ['officer', 'sapper'], ['oldsoldier', 'oldsoldier', 'surgeon']],
    elite: [['kguard', 'sapper'], ['hmg', 'burner'], ['depotchief'], ['depotchief', 'oldsoldier']] },
  { easy: [['shadow'], ['echo']],
    hard: [['shadow', 'shadow'], ['echo', 'shadow'], ['tombkeeper'], ['tombkeeper', 'shadow'], ['echo', 'echo']],
    elite: [['mask'], ['mask', 'shadow']] },
];
export const ENC_CH3 = {
  easy: SEG_ENC[0].easy, hard: SEG_ENC.flatMap(s => s.hard), elite: SEG_ENC.flatMap(s => s.elite),
  boss: [['priest']],
};

/* ---------- 事件 ----------
   G 比第二章多：san(n) 改理智、curse() 往牌组里加一张「它」、they(名字, 结局)。
   seg：只在这一段出现；when(R)：额外条件。恐怖靠的是安静、不对劲和没有标准答案的选择 */
const inSeg = (n, w) => R => SEG((R.pos && R.pos.r) || 0) === n && (!w || w(R));
const has = (R, k) => (R.flags || []).includes(k);
export const EVENTS_CH3 = [
  { id: 'jpnames', when: inSeg(1), title: '点名', text: '仓库深处有人在喊口令。走近了才看见，是个穿日军军装的老兵，一个人站得笔直，对着一排空了的铁架子点名。喊一个名字，停一下，自己替那人答一声「到」。',
    opts: [
      { t: '听他点完（理智 -1）', f: G => { G.san(-1); G.they('点名的老兵', '在空仓库里，一遍一遍点他那个中队早就不在了的人的名字'); return '他点了四十多个名字，每一个都替人答了「到」。点完了，他立正，敬礼，说：「（日语）全员到齐。」<br>然后他坐在地上，哭得像个孩子。'; } },
      { t: '从他身后悄悄过去', f: () => '他没有回头。口令声在你们身后响了很久。' },
    ] },
  /* —— 防空壕 —— */
  { id: 'shrine', when: inSeg(0), title: '空神龛', text: '建国神庙背后的防空壕又深又直，水泥墙上每隔十步挂一盏灯，灯都灭了。<br>尽头是一座神龛，帘子拉开着，里面是空的——「神体」早就被搬走了。供桌上摆着一排没点的蜡烛。',
    opts: [
      { t: '拿走蜡烛（理智 +1）', f: G => { G.san(1); return '有光，人心里就有底。'; } },
      { t: '把帘子拉上', f: G => { G.awe(1, '不管供的是谁，空着的龛别看太久。'); return '帘子落下的时候，你觉得里面有什么东西松了一口气。'; } },
    ] },
  { id: 'knock', when: inSeg(0), title: '敲墙声', text: '半夜，墙那边传来敲击声。<br>咚。咚咚。咚。<br>你们几个对视了一眼——这是小分队约好的暗号。可你们六个人，都在这儿。',
    opts: [
      { t: '敲回去', f: G => { G.flag('knock'); return '你用枪托敲了两下。<br>那边停了很久，然后敲回了同一个暗号，一下不差。'; } },
      { t: '不出声（理智 -1）', f: G => { G.san(-1); return '敲声一直响到天亮。没有人睡着。'; } },
    ] },
  { id: 'luggage', when: inSeg(0), title: '侨民的行李', text: '通道里扔满了箱子和包袱。是从日本人住的那几条街逃下来的侨民留下的——关东军的卡车先拉走了军人和家属，剩下的人只好往地下躲，又不知往哪儿去了。<br>一只小孩的木屐，夹在两个箱子中间。',
    opts: [
      { t: '翻翻箱子（口粮 +2）', f: G => { G.food(2); return '饭团已经硬了，用油纸包得整整齐齐。包它的人，大概以为过几天就能回家。'; } },
      { t: '把木屐摆正，走开', f: () => '你不知道它的主人现在在哪儿。你希望他在一辆往南开的车上。' },
    ] },
  { id: 'lamp', when: inSeg(0), title: '一盏灯', text: '你们找到一盏还能用的马灯，油是满的。<br>可灯一点，整条通道都会知道你们在哪儿。',
    opts: [
      { t: '点上（本章战斗不再摸黑，但接下来两场会多引来一个东西）', f: G => { G.flag('lamp'); G.lure(2); return '火苗跳起来的一瞬间，你听见通道深处有什么东西停住了脚步。'; } },
      { t: '摸黑走（理智 -1，把灯收进背包）', f: G => { G.san(-1); G.item('lantern'); return '你们拉着前一个人的衣角往前走。走着走着，你觉得衣角那头的人，手太凉了。'; } },
    ] },
  { id: 'wounded', when: inSeg(0), title: '被丢下的伤兵', text: '一个日本兵靠着墙坐着，腿上缠着发黑的绷带。他看见你们，没有去摸枪。<br>「（日语）……部队已经撤了。说是去通化。没有车给伤兵。」',
    opts: [
      { t: '给他口水喝（口粮 -1）', f: G => { G.food(-1); G.flag('wounded'); return '他喝完，用日语说了声谢谢，又说：「（日语）仓库那边……别去。他们在烧东西。还有那个神官……他不是人。」'; } },
      { t: '【日语】问他神官的事', need: G => G.lang('ja'), f: G => { G.flag('wounded'); G.san(-1); return '「（日语）他说自己是阴阳师。他让我们把阵亡军官的刀都交上去……说要熔了做钉子。」<br>伤兵笑了一下，比哭还难看：「（日语）自己人的刀。」'; } },
      { t: '走开', f: () => '他没有叫住你们。' },
    ] },
  /* —— 仓库 —— */
  { id: 'furnace', when: inSeg(1), title: '炉子', text: '仓库深处，几座炉子日夜在烧。地上堆着成捆的档案，封皮上盖着「极秘」的章。炉膛里有半页纸还没烧透，正一点点卷起来。',
    opts: [
      { t: '伸手抢出来（生命 -5，理智 -1，得到诅咒「手抖」）', f: G => { G.hp(-5); G.san(-1); G.flag('scrap'); G.addCard('cu_shake'); return '纸边烫得你直甩手。上面只剩几个字：「……移送……名……」后面烧没了。你的手抖了好几天。（牌组里多了一张「手抖」）'; } },
      { t: '赶紧走', f: () => '火光把你们的影子投在墙上，很长，很长。' },
    ] },
  { id: 'logbook', when: inSeg(1), title: '值班日志', text: '值班室的桌上摊着一本值班日志。字一开始很工整。',
    opts: [
      { t: '读完它（理智 -2，往后的地图全看得见）', f: G => { G.san(-2); G.flag('reveal'); return '「八月九日。晴。苏军越境。命令：烧。」<br>「八月十日。炉子不够，加了两座。」<br>「八月十一日。地下有声音。神官说是龙脉在动，说他会钉住它。」<br>「八月十二日。点名少了一个。」<br>「八月十二日。点名又多了一个。」<br>「八月十三日。我们不点名了。」<br>后面几页，是同一个名字，写了很多遍。'; } },
      { t: '只看前两页', f: () => '「八月九日。晴。苏军越境。命令：烧。」你合上了日志。' },
    ] },
  { id: 'door', when: inSeg(1), title: '门后', text: '一扇铁门后面有人在喊你的名字。<br>是老沈的声音。「快，这边！」<br>可老沈就站在你身后。',
    opts: [
      { t: '开门（触发战斗）', f: G => { G.fight(['shadow', 'shadow']); return '门后面什么人也没有。只有黑。黑在动。'; } },
      { t: '回头问身后的人：「你是谁？」（理智 -2）', f: G => { G.san(-2); return '身后的老沈愣了一下：「我是老沈啊，你吓糊涂了？」<br>门那边的声音，也同时说了一遍。一字不差。'; } },
      { t: '拉着大家走开（理智 -1）', f: G => { G.san(-1); return '那个声音跟着你们走了很远，一直在喊。后来不喊了。后来你们发现，队伍里谁也没回过头。'; } },
    ] },
  { id: 'knock2', when: R => SEG((R.pos && R.pos.r) || 0) >= 1 && has(R, 'knock'), title: '又是敲墙声', text: '咚。咚咚。咚。<br>是那个暗号。你没有回应。<br>那边停了一会儿，又敲了起来。这一回很慢，一下，一下，像是一个字一个字地拼。<br>拼出来的，是你的名字。',
    opts: [
      { t: '敲回去', f: G => { G.curse(); return '你不知道自己为什么要这么做。手好像不是自己的。<br>敲声停了。有什么东西，跟上来了。（牌组里多了一张「它」）'; } },
      { t: '捂住耳朵往前走（理智 -2，得到诅咒「耳鸣」）', f: G => { G.san(-2); G.addCard('cu_tinnitus'); return '敲声在你身后跟了一路，每一下都离得更近一点。后来敲声停了，耳朵里还在响。（牌组里多了一张「耳鸣」）'; } },
    ] },
  { id: 'hilt', when: inSeg(1), title: '熔剩的军刀', text: '角落里扔着一堆碎铁，是军刀熔剩的。没熔化的刀柄上缠着丝绳，刻着名字：「陆军中尉 ……」「陆军大尉 ……」<br>一共十几把。都是阵亡军官的。',
    opts: [
      { t: '带走一截刀柄（得到「断刀柄」：打镇龙钉伤害翻倍）', f: G => { G.relic('hilt'); return '他们拿自己人的刀做钉子。这截刀柄，钉子认得。'; } },
      { t: '不碰', f: () => '你想起那个伤兵的话：自己人的刀。' },
    ] },
  /* —— 古墓（这里的东西和古墓有关，和战争死难者无关） —— */
  { id: 'shaman', when: inSeg(2), title: '萨满老人', pic: 'assets/portraits/shaman_lihui.png', text: '黑暗里有鼓声。一个老人盘腿坐在墓道口，面前的神鼓蒙着兽皮，腰上挂着一圈铜铃。他是附近屯子的满族萨满。<br>「你们来晚了。」他说，「它已经醒了一半。」',
    opts: [
      { t: '听他说完（理智 +3）', f: G => { G.san(3); G.flag('shaman'); return '「这墓比咱们都老。底下睡着的东西，没有名字，也不用有名字。那个日本神官往它身上钉钉子，以为能钉住，钉住了好使唤。」<br>「钉子钉不住它，只会把它扎醒。」<br>「到时候我敲鼓。你们照我说的做：鼓、铃、刀，一样一样来。别回头。」'; } },
      { t: '分他一口吃的（口粮 -2，理智 +3，敬畏 +1）', need: G => G.foodN() >= 2, f: G => { G.food(-2); G.san(3); G.flag('shaman'); G.awe(1, '萨满这个词，本来的意思就是「知道」。听老人家的。'); return '老人接过去，先掰了一小块放在鼓边上，才吃剩下的。<br>「到时候我敲鼓。鼓、铃、刀，一样一样来。别回头。」'; } },
    ] },
  { id: 'script', when: inSeg(2), title: '墙上的字', text: '墓道的墙上刻满了字，像汉字，又不是汉字——是契丹字，今天能读懂的人也不多。<br>你盯着看，越看越觉得那些笔画在动。',
    opts: [
      { t: '一直看下去（理智 -2，升级 1 张牌）', f: G => { G.san(-2); G.upgrade(); return '你读懂了一个字。你不知道你是怎么读懂的。'; } },
      { t: '移开眼睛', f: () => '你移开眼睛的时候，余光里的笔画停住了。' },
    ] },
  { id: 'maskev', when: inSeg(2), title: '金属面具', text: '石床上空空的，什么都没有，只有一张金属面具。契丹贵族下葬时，会在脸上覆一张金属面具。<br>面具朝上，眼睛那里是两道细缝。',
    opts: [
      { t: '拿走（得到「金属面具」：每回合 +1 能量；每场战斗开始理智 -1）', f: G => { G.relic('mask'); G.awe(-1, '墓里的东西，别往身上带。'); return '面具比看上去轻。你把它包进布里的时候，觉得它往你这边转了一下。'; } },
      { t: '放回去，扣过来', f: G => { G.awe(1); return '你把它扣在石床上。屋里好像暖了一点。'; } },
    ] },
  { id: 'mirror', when: inSeg(2), title: '镜子', text: '墓道转角立着一面镜子，是日本人搬下来的神社的镜子，镜框上缠着褪色的纸垂。<br>你们六个人站在镜子前。镜子里，只有五个。',
    opts: [
      { t: '数一数（理智 -2）', f: G => { G.san(-2); return '你回头数，一个不少。<br>你再看镜子，还是少一个。<br>你数了第三遍，才发现镜子里少的那个人，是你。'; } },
      { t: '用布盖上', f: G => { G.san(-1); return '盖上之前，你看见镜子里的五个人，一齐回过头看了你一眼。'; } },
      { t: '砸了它', f: G => { G.curse(); return '镜子碎了一地。每一片里，都少一个人。（牌组里多了一张「它」）'; } },
    ] },
  { id: 'weasel3', when: inSeg(2), title: '黄皮子', text: '墓道里蹲着一只黄鼠狼，后腿站着，像人一样看着你们。然后它转身往岔路里跑了几步，又回头看。',
    opts: [
      { t: '跟它走', f: G => { if (G.aweN() >= 2) { G.flag('reveal'); G.san(2); return '它领着你们绕开了一段塌了的墓道，在一个干燥的角落停下，就不见了。（理智 +2，往后的地图全看得见）'; } G.san(-2); G.fight(['shadow', 'shadow']); return '它领着你们越走越深，然后不见了。你们回头，来的路也不见了。'; } },
      { t: '不跟（敬畏 +1）', f: G => { G.awe(1, '不跟就不跟，客客气气的，它也不怪。'); return '你们冲它点了点头，走了自己的路。' } },
    ] },
  { id: 'pullnail', when: inSeg(2), title: '一颗钉子', text: '墓室正中的地上钉着一颗铁钉，有手腕粗，钉帽上刻着你看不懂的符。周围的土是黑的。<br>钉子在微微发烫。',
    opts: [
      { t: '拔出来（神官最多只能钉 2 颗钉；但它醒来时更强）', f: G => { G.flag('pulled'); G.hp(-6); return '你们三个人一起才把它拔出来，手掌磨破了。拔出来的那一刻，地底下有什么东西翻了个身。'; } },
      { t: '不碰', f: () => '你们从钉子旁边绕过去。走出很远了，还觉得背上热。' },
    ] },
];

/* 本章的节点 */
export const PLACES_CH3 = {
  rest: { name: '火堆', text: '在背风的角落生一小堆火。火光照得到的地方，就是安全的。理智 +3。' },
  shop: { name: '避难的人', text: '一家老百姓躲在防空壕的岔洞里，不敢出去。他们缺吃的，愿意拿身上的东西换口粮。' },
  treasure: { name: '遗弃的物资', text: '撤走的日军扔下的木箱，封条撕了一半。' },
};

export const CHAPTER3 = {
  id: 3, name: '地下', season: '1945 年 8 月', rows: 15, cols: 5,
  res: 'san', /* 用理智代替可疑度 */
  nodes: { fight: 40, event: 32, elite: 14, rest: 10, shop: 4 }, fixed: { 0: 'fight', 4: 'shop', 8: 'treasure', 10: 'event', 14: 'rest' }, fixedEv: { 10: 'shaman' }, earliest: 5, easyFights: 2,
  map: { img: 'assets/bg/map_ch3.jpg', w: 1000, h: 1779, startY: .1, endY: .82, bossX: .5, bossY: .905, xMin: .25, xMax: .75, startLabel: '▼ 钻进排水渠', startLabelY: .045, dark: 1 }, /* 从上往下走：防空壕 → 仓库 → 古墓 */
  battleBg: 'assets/bg/battle_shelter25.jpg', segBg: [['assets/bg/battle_shelter25.jpg', 'assets/bg/battle_culvert25.jpg'], 'assets/bg/battle_warehouse25.jpg', 'assets/bg/battle_tomb25.jpg'], bossBg: { priest: 'assets/bg/battle_tomb25.jpg', staff: 'assets/story/te_archive.jpg' },
  under: 1, enemies: ENEMIES_CH3, frames: FRAMES_CH3, blockSize: {}, enc: ENC_CH3, segEnc: SEG_ENC, seg: SEG, segName: SEG_NAME,
  events: EVENTS_CH3, places: PLACES_CH3, escort: 'escort3', bossLabel: '最深处',
  intro: [
    '1945 年 8 月 9 日，苏联对日宣战，苏军从三个方向越过边境。',
    '新京乱了。关东军当天通知伪满政府撤往通化，军人和家属挤上南下的火车；日本开拓团的侨民，被丢在了原地。',
    '老沈带大家从排水渠钻进地下。第三样东西——一份「拟销毁目录」——在一个正在被烧掉的地方。',
    '可是越往下走，越觉得这地底下，还有别的东西醒着。',
  ],
  winText: '鼓声停了。地面不再往下沉。萨满老人把神刀包回布里，只说了一句：「它睡了。没走。」<br>你们顺着来时的路往上爬。头顶上，是 1945 年 8 月 15 日的新京。',
};
