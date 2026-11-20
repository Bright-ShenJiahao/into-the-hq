// 第二章「新京」（1945 年春，长春）：城市潜伏。
// 和第一章不同的地方：不用「体温」，改用「可疑度」；城里开枪会惊动巡警；地图节点叫安全屋、交通站、死信箱。
// 美术还没出：敌人先借第一章的图（pic / frames 写的是借来的那套），背景和地图也先借用，出图后只改这里的路径。
// 地点：大同大街、顺天大街、新京驿、关东军司令部都是真实地名，只当地图锚点；房间、人物全部虚构。

/* ---------- 敌人 ---------- */
// hide：意图显示「？」（便衣、伪装）；counter：架势，玩家这回合每次打到他，他就反击这么多伤害
export const ENEMIES_CH2 = {
  patrol: { name: '伪满巡警', hp: [16, 19], col: '#3a3f4a', frames: 'puppet', pic: 'puppet', artH: 235, morale: 1, ammo: 2,
    moves: { shoot: { t: '射击', i: 'atk', d: 6, shot: 1 }, baton: { t: '警棍', i: 'atk', d: 8 }, whistle: { t: '吹警笛', i: 'buff', summon: 'patrol', blk: 4 },
      reload: { t: '装弹', i: 'reload', blk: 5 }, flee: { t: '溃逃', i: 'flee', tx: '动摇到 2 层、又没人督战时，扔下警棍跑了' } },
    ai: (e, B) => {
      if (e.st.shaken >= 2 && !B.en.some(x => !x.dead && x.d.sup)) return 'flee';
      if (e.t === 0 && B.en.filter(x => !x.dead).length < 3) return 'whistle';
      return e.last === 'shoot' ? 'baton' : 'shoot';
    } },
  kempei: { name: '日本宪兵', hp: [26, 30], col: '#5a5a3a', frames: 'inf', pic: 'inf', artH: 240, sup: 1, ammo: 2,
    moves: { halt: { t: '「站住！」', i: 'debuff', weak: 2 }, shoot: { t: '射击', i: 'atk', d: 9, shot: 1 }, reload: { t: '装弹', i: 'reload', blk: 6 } },
    ai: e => e.t === 0 ? 'halt' : 'shoot' },
  spy: { name: '便衣特务', hp: [18, 22], col: '#2a2a2a', frames: 'puppet', pic: 'puppet', artH: 235,
    moves: { lurk: { t: '混在人群里', i: 'unk', hide: 1, blk: 6, str: 2 }, knife: { t: '掏枪偷袭', i: 'atk', d: 11 } },
    ai: e => e.t % 2 === 0 ? 'lurk' : 'knife' },
  /* —— 精英 —— */
  kendo: { name: '剑道军官', hp: [70, 76], col: '#4a4a2a', frames: 'sergeant', pic: 'sergeant', artH: 250, elite: 1, sup: 1,
    moves: { stance: { t: '架势（这回合挨打就反击）', i: 'def', blk: 10, counter: 7 }, cut: { t: '劈砍', i: 'atk', d: 15 }, thrust: { t: '连续突刺', i: 'atk', d: 7, x: 2 } },
    ai: e => e.t % 3 === 0 ? 'stance' : e.t % 3 === 1 ? 'cut' : 'thrust' },
  agent: { name: '关东军情报部特务', hp: [60, 66], col: '#3a2a2a', frames: 'pcap', pic: 'pcap', artH: 250, elite: 1, sup: 1, ammo: 2,
    moves: { cover: { t: '装成商人寒暄', i: 'unk', hide: 1, blk: 12 }, dossier: { t: '翻出你的档案', i: 'debuff', weak: 1, vuln: 2 },
      call: { t: '叫宪兵', i: 'buff', summon: 'kempei', blk: 6 }, shoot: { t: '勃朗宁手枪', i: 'atk', d: 7, x: 2, shot: 1 }, reload: { t: '压子弹', i: 'reload', blk: 8 } },
    ai: (e, B) => e.t === 0 ? 'cover' : e.t === 1 ? 'dossier' : (B.en.filter(x => !x.dead).length < 3 && e.last !== 'call') ? 'call' : e.last === 'shoot' ? 'cover' : 'shoot' },
  /* 加强精英战里押送「交接副本」的人：3 回合后撤走 */
  escort2: { name: '押送公文包的特务', hp: [20, 22], col: '#2a2a2a', frames: 'puppet', pic: 'puppet', artH: 235, intel: 1,
    moves: { back: { t: e => `后撤（${3 - e.t} 回合后撤走）`, i: 'def', blk: 5 }, flee: { t: '带着公文包撤走', i: 'flee', tx: '第 3 回合带着公文包钻进人群，情报就没了' } },
    ai: e => e.t >= 2 ? 'flee' : 'back' },
  /* —— 首领（每局随机一个） —— */
  kirino: { name: '宪兵队特高课长·桐野', hp: [205, 205], col: '#3a3a2a', frames: 'kcap', pic: 'kcap', artH: 280, boss: 1, sup: 1, ammo: 2,
    moves: { search: { t: '全城搜捕', i: 'buff', summon: 'kempei', blk: 10 }, interrogate: { t: '审讯口吻', i: 'debuff', weak: 2, vuln: 2 },
      pistol: { t: '南部手枪', i: 'atk', d: 7, x: 2, shot: 1 }, saber: { t: '军刀', i: 'atk', d: 18 }, curfew: { t: '宵禁令', i: 'buff', all: 2, blk: 12 },
      reload: { t: '压子弹', i: 'reload', blk: 8 } },
    ai: (e, B) => {
      if (e.hp < e.max / 2 && !e.curfew) { e.curfew = 1; return 'curfew'; }
      if (e.t === 0) return 'interrogate';
      if (B.en.filter(x => !x.dead).length < 2 && e.last !== 'search') return 'search';
      return e.last === 'pistol' ? 'saber' : 'pistol';
    } },
  kuga: { name: '关东军情报部少佐·久我', hp: [190, 190], col: '#2a2a3a', frames: 'captain_foot', pic: 'captain', artH: 250, boss: 1, sup: 1,
    moves: { mask: { t: '微笑寒暄', i: 'unk', hide: 1, blk: 15, str: 2 }, agents: { t: '暗号：动手', i: 'buff', summon: 'spy', blk: 8 },
      shot: { t: '暗处一枪', i: 'atk', d: 20 }, turn: { t: '「你的事，我都知道」', i: 'debuff', weak: 2, vuln: 2 } },
    ai: (e, B) => ['mask', B.en.filter(x => !x.dead).length < 3 ? 'agents' : 'turn', 'shot', 'turn'][e.t % 4] },
};
Object.entries(ENEMIES_CH2).forEach(([k, d]) => { d.key = k; });

/* 遭遇池。第一章的敌人（dog、mg）也能直接用 */
export const ENC_CH2 = {
  easy: [['patrol', 'patrol'], ['spy'], ['kempei'], ['patrol', 'dog']],
  hard: [['kempei', 'patrol', 'patrol'], ['spy', 'spy'], ['kempei', 'dog', 'dog'], ['kempei', 'kempei'], ['mg', 'patrol'], ['spy', 'patrol', 'patrol'],
    ['kempei', 'spy'], ['patrol', 'patrol', 'patrol'], ['mg', 'kempei']],
  elite: [['kendo'], ['agent', 'spy'], ['patrol', 'kendo', 'patrol']],
  boss: [['kirino'], ['spy', 'kuga']],
  hunt: [['kempei', 'kempei', 'dog']], /* 可疑度满 10：宪兵搜捕队 */
};

/* ---------- 事件 ----------
   G 比第一章多：sus(n) 改可疑度、flag(k)/hasFlag(k) 记剧情标记。when(R) 决定这个事件能不能出现 */
export const EVENTS_CH2 = [
  { id: 'checkpoint', title: '检问所', text: '大同大街的路口拉了铁丝网，伪满巡警挨个查「国民手帐」。前面一个拉洋车的翻遍了口袋也找不着，被拖到一边去了。',
    opts: [
      { t: '【日语】用日语打招呼，说是给日本商社送货的（可疑度 -2）', need: G => G.lang('ja'), f: G => { G.sus(-2); return '巡警一听日语，腰先弯了半截，挥手放行。'; } },
      { t: '低着头，递上交通站给的假手帐（可疑度 +1）', f: G => { G.sus(1); return '巡警翻了两页，盯着你看了好一会儿，才把手帐扔回来。'; } },
      { t: '绕道钻胡同（口粮 -1）', f: G => { G.food(-1); return '多走了大半个时辰，在城根底下啃了一口干粮。'; } },
    ] },
  { id: 'ration', title: '配给所门口', text: '城里粮食按「配给」，配给所门口的队排出去半条街。一个老太太排到跟前，粮没了。她回头看见你，把怀里小半袋高粱米往你手里塞：「孩子，看你瘦的。」',
    opts: [
      { t: '收下（口粮 +2）', f: G => { G.food(2); return '高粱米还带着她身上的热乎气。'; } },
      { t: '不收，帮她把空口袋扛回家（生命 +6，可疑度 -1）', f: G => { G.heal(6); G.sus(-1); return '她家在城南一个大杂院里。你一路低着头，跟别的扛口袋的人没两样。'; } },
    ] },
  { id: 'blackmarket', title: '黑市', text: '日本人开的洋行后门，夜里有人卖东西：罐头、西药、香烟。卖货的日本商人一边点钱，一边拿眼角打量你的手——那是握枪的手。',
    opts: [
      { t: '用口粮换一包西药（口粮 -2，得到急救包，可疑度 +2）', need: G => G.foodN() >= 2, f: G => { G.food(-2); G.item('medkit'); G.sus(2); return '药是真的。可你走出两条街，听见身后有人吹了声口哨。'; } },
      { t: '【日语】跟他套近乎，打听宪兵的巡逻路线（可疑度 -2）', need: G => G.lang('ja'), f: G => { G.sus(-2); return '他以为你是新来的满铁职员，抱怨宪兵查得太严，顺嘴把哪条街几点有人都说了。'; } },
      { t: '转身走', f: () => '这种人，见了钱什么都卖——也包括你。' },
    ] },
  { id: 'xingersao', title: '豆腐坊的邢二嫂', text: '豆腐坊的邢二嫂是交通线上的人。她把一块热豆腐包进油纸，压低声音：「你们要的那份东西，经手的人我打听着了。」',
    opts: [
      { t: '吃口热乎的，歇一歇（生命 +10，口粮 +1）', f: G => { G.heal(10); G.food(1); return '豆腐里拌了辣椒油。你好久没吃过热乎饭了。'; } },
      { t: '请她帮忙把风声压下去（可疑度 -3）', f: G => { G.sus(-3); return '第二天，巡警在城南抓了个「形迹可疑」的醉汉，案子就这么结了。'; } },
    ] },
  { id: 'clinic', title: '朝鲜族大夫', text: '胡同深处有间小诊所，大夫叫金永哲，延边人，懂西医。他看了一眼你袖子上的血，什么也没问，把门插上了。',
    opts: [
      { t: '让他治伤（生命 +15，可疑度 +1：有人看见你进去）', f: G => { G.heal(15); G.sus(1); return '他手很稳。缝完最后一针，他说：「我哥哥在那边的部队里。我在这边。」'; } },
      { t: '问他为什么帮你（得到山野草药）', f: G => { G.relic('herbs'); return '「有人问我，你们朝鲜人到底帮谁。」他把一包草药塞给你，「我帮受伤的人。」'; } },
    ] },
  { id: 'labor', title: '抓劳工', text: '街口停了两辆卡车，伪满巡警拿着名单挨家挨户抓人去「出劳工」。一个半大孩子被拽着胳膊往车上拖，他娘跪在地上。',
    opts: [
      { t: '趁乱把孩子拽进胡同（触发战斗）', f: G => { G.fight(['patrol', 'patrol']); return '你一把把孩子拽了过来。巡警的警笛响了。'; } },
      { t: '忍住，低头走过去（可疑度 -1）', f: G => { G.sus(-1); return '你没回头。老沈说过：在城里，忍不住的人活不过三天。'; } },
    ] },
  /* —— 「一份单据、三个经手人」：按顺序出现，拿全三处签章就是第二份证据「交接副本」（真结局用） —— */
  { id: 'hand1', title: '经手人之一：新京驿货运科', text: '新京驿的货运科，夜班的日本职员在登记一批「特殊物资」的发运。他签完字，把单据的副本压在了抽屉最底下。',
    opts: [
      { t: '等他去打水，抄下单据（可疑度 +1）', f: G => { G.flag('hand1'); G.sus(1); return '编号、车次、去向：齐齐哈尔。你一个字一个字抄在烟盒纸背面。'; } },
      { t: '不冒这个险', f: () => '你记下了货运科的位置。' },
    ] },
  { id: 'hand2', title: '经手人之二：顺天大街', when: R => (R.flags || []).includes('hand1'), text: '顺天大街上的伪满经济部（第十厅舍）。单据上的第二个签章，是一个科里的中层官员盖的——他为了一家老小留在这里，每天按时上下班。',
    opts: [
      { t: '在他回家的路上拦住他（可疑度 +2）', f: G => { G.flag('hand2'); G.sus(2); return '他认出了你们是什么人，手在发抖。可他还是把盖过章的那一页拿了出来：「我只管盖章，我不知道运的是什么。」'; } },
      { t: '放过他', f: () => '他在路灯底下站了很久，才走进家门。' },
    ] },
  { id: 'hand3', title: '经手人之三：大同大街', when: R => (R.flags || []).includes('hand2'), text: '最后一个签章在大同大街的关东军司令部里。那份副本会在明天上午，由一个特务装进公文包送进去。',
    opts: [
      { t: '记下他走的路线（地图上的「📜」加强精英就是他）', f: G => { G.flag('hand3'); return '三个经手人，三个签章。只差最后这一页。'; } },
    ] },
];

/* 本章特有的节点（名字和说明）；没写的用第一章的 */
export const PLACES_CH2 = {
  rest: { name: '安全屋', text: '临街杂货铺的后屋，掌柜是自己人。门帘一放，外头的事就隔开了。可疑度清零。' },
  shop: { name: '地下交通站', text: '粮店后门，掌柜是地下交通线上的人。他不收伪满国币，只认粮食——城里实行配给，一斗高粱米比钱硬。' },
  treasure: { name: '死信箱', text: '电线杆底下松动的那块砖。交通员把东西塞在里头。' },
};

export const CHAPTER2 = {
  id: 2, name: '新京', season: '1945 年春', rows: 15, cols: 5,
  res: 'sus', /* 用可疑度代替体温 */
  nodes: { fight: 42, event: 26, elite: 16, rest: 11, shop: 5 }, fixed: { 0: 'fight', 4: 'shop', 8: 'treasure', 14: 'rest' }, earliest: 5, easyFights: 3,
  /* 地图底图还没画：先借第一章的 */
  map: { img: 'assets/bg/map_ch1.jpg', w: 1000, h: 1779, startY: .865, endY: .175, bossX: .5, bossY: .092, xMin: .27, xMax: .73, startLabel: '▲ 混进新京' },
  battleBg: 'assets/bg/battle_snow.jpg', enemies: ENEMIES_CH2, frames: {}, blockSize: {}, enc: ENC_CH2, events: EVENTS_CH2, places: PLACES_CH2,
  escort: 'escort2', bossLabel: '追捕者',
  intro: [
    '1945 年春。德国投降的消息传到东北的时候，新京的大街上还挂着「日满一德一心」的标语。',
    '小分队扮成进城的苦力和小贩，分几拨混进了新京。城里不比山里：这里没有林子可钻，每个路口都有眼睛。',
    '老沈要的东西，是一份「交接副本」。一批「特殊物资」从新京驿运走时，有三个人在单据上签过字。',
  ],
  winText: '新京的宪兵还在一条街一条街地搜。老沈带着大家从城北的排水渠钻了出去——往下，再往下。',
};
