// 人物拼图和过场对白。人物全部虚构；日本人的台词标（日语）。
// 每人一张拼图，5 块，散在三章的事件里；拼到的块跨局保存（图鉴「人物」页里看）。
// 关系网（设计见 docs/人物拼图设计.md）：
//   老沈欠沈知秋父亲一条命（她父亲被捕后没供出给读书会递书的人——就是老沈）；
//   陈默的父亲在经济部签了「交接副本」；真结局「特别移送」名单上有沈知秋父亲的名字；
//   第二章豆腐坊的邢二嫂是田守义的闺女田秀兰；村濑带队烧过韩松家的屯子；金永哲的哥哥在日伪的朝鲜人部队里。

/* 小分队成员：角色 id → 图鉴人物 id */
export const PID = { hansong: 'hansong', chenmo: 'chenmo', tian: 'tianshouyi', zhao: 'zhaotieshan', shen: 'shenzhiqiu' };

/* 每人 5 块：第几章出现（'终' = 真结局）。只列出已经写好的块的内容，没写的显示「？？？」 */
// 第二章：陈默的父亲就是经手人之二；邢二嫂 = 田秀兰；九一八那夜冲出去的「沈营副」= 老沈
export const FRAG_PLAN = {
  hansong: [1, 1, 2, 3, '终'], chenmo: [1, 2, 2, 3, '终'], tianshouyi: [1, 1, 2, 2, 3], zhaotieshan: [1, 2, 3, '终', '终'],
  shenzhiqiu: [1, 1, 2, 3, '终'], laoshen: [1, 2, 3, '终', '终'], jinyongzhe: [1, 2, 2, 3, '终'],
};

/* 拼图块。who：属于谁；ch：章；only：只有用这个角色打才会出现；at：在哪儿出现（event = 事件格，intel = 第一次截下档案箱后，boss = 首领战前）；bg：过场背景 */
export const FRAGS = {
  hs_stove: { who: 'hansong', i: 0, ch: 1, at: 'event', t: '灶台', bg: 'assets/story/adv_stove.jpg', sum: '路过一片烧掉的屯子，韩松摸了摸灶台：他家的灶，也是这么砌的。',
    lines: [['narr', '林子边上有一片烧过的地基，雪盖了一半。只有灶台还立着。'], ['narr', '韩松在灶台前蹲下，伸手摸了摸灶沿。'],
      ['shenzhiqiu', '你认得这儿？'], ['hansong', '……不认得。'], ['hansong', '我家的灶，也是这么砌的。'],
      ['laoshen', '走吧。天黑前要过沟。'], ['narr', '韩松站起来，往冷了多年的灶膛里塞了一把雪。没人问他为什么。']] },
  hs_murase: { who: 'hansong', i: 1, ch: 1, at: 'boss', boss: 'captain', only: 'hansong', t: '三道沟', sum: '讨伐队长村濑记得那个屯子。韩松的枪口抬起来，被老沈按了下去。' },
  ts_road: { who: 'tianshouyi', i: 0, ch: 1, at: 'event', t: '屯子口', bg: 'assets/story/adv_gate.jpg', sum: '路过一个集团部落，田守义停下来看那条往山外去的车道：「通我家。十二年没走过了。」',
    lines: [['narr', '前面是个「集团部落」：土墙、炮楼，大门口站着两个伪自卫团。小分队绕着林子边走。'], ['narr', '田守义在林边停下了。'],
      ['zhaotieshan', '老田，走了。'], ['tianshouyi', '等会儿。……这屯子，我有个熟人。'], ['chenmo', '熟人？你进得去吗。'], ['tianshouyi', '不进。我看看路。'],
      ['narr', '他看的不是大门，是屯子西边那条往山外去的车道。'], ['shenzhiqiu', '那条路通哪儿？'], ['tianshouyi', '……通我家。'], ['tianshouyi', '十二年没走过了。']] },
  ts_name: { who: 'tianshouyi', i: 1, ch: 1, at: 'event', t: '雪地上的字', bg: 'assets/story/adv_marks.jpg', sum: '田守义不识字，却会用刀尖在雪地上划两个字：「秀」「兰」。是当年请先生起的名字。',
    lines: [['narr', '夜里轮到田守义守岗。沈知秋来换他的时候，看见他蹲在雪地上，用刀尖划着什么。'], ['tianshouyi', '丫头，你识字。这个念啥？'],
      ['shenzhiqiu', '……「秀」。秀气的秀。'], ['tianshouyi', '嗯。那这个呢。'], ['shenzhiqiu', '「兰」。'], ['narr', '他把两个字看了很久，用脚抹平了。'],
      ['tianshouyi', '当年请先生起的。我自己不认得。'], ['shenzhiqiu', '谁的名字？'], ['tianshouyi', '去睡吧。换岗了。']] },
  cm_paper: { who: 'chenmo', i: 0, ch: 1, at: 'event', t: '报纸', bg: 'assets/story/adv_paper.jpg', sum: '伪满报纸上有一则经济部的人事任命。陈默把它扔进了火里：「管物资调运。跟我没关系。」',
    lines: [['narr', '截下的讨伐队辎重里有一沓伪满的报纸，拿来引火正好。'], ['narr', '陈默翻了一页，停住了。'], ['tianshouyi', '咋了少爷，报上有你家？'],
      ['narr', '陈默把那一页揉成一团，扔进火里。'], ['tianshouyi', '你爹吧？又升官了？'], ['chenmo', '经济部。管物资调运。'], ['chenmo', '他升没升官，跟我没关系。'],
      ['shenzhiqiu', '陈默——'], ['chenmo', '柴不够了。我去捡。']] },
  sq_line: { who: 'shenzhiqiu', i: 0, ch: 1, at: 'event', t: '空着的一行', bg: 'assets/story/adv_diary.jpg', sum: '沈知秋的日记每一页最后都空着一行，留给她爹：等找着他了，让他自己写一句。',
    lines: [['narr', '沈知秋每天睡前都要写几行日记，写完把本子揣进怀里。'], ['hansong', '你每页最后都空一行。'], ['shenzhiqiu', '你看我本子了？'],
      ['hansong', '递给你的时候看见的。空着干嘛？'], ['shenzhiqiu', '留给我爹。'], ['shenzhiqiu', '等找着他了，让他自己写一句。写什么都行。'], ['hansong', '……'], ['hansong', '那你多留几行。']] },
  sq_why: { who: 'shenzhiqiu', i: 1, ch: 1, at: 'event', t: '为什么是我', bg: 'assets/story/adv_rock.jpg', sum: '她问老沈，三八年为什么偏偏带上一个女学生。老沈往火里添了块柴，没回答。',
    lines: [['shenzhiqiu', '老沈，问你个事。'], ['laoshen', '嗯。'], ['shenzhiqiu', '三八年那会儿，山上缺枪缺粮，不缺人，更不要女学生。你为什么带上我？'],
      ['laoshen', '……你识字。'], ['shenzhiqiu', '识字的多了。'], ['laoshen', '你会俄语。'], ['shenzhiqiu', '那时候我还不会。'],
      ['narr', '老沈往火里添了块柴，没再说话。'], ['laoshen', '睡吧。明天走四十里。']] },
  zt_shells: { who: 'zhaotieshan', i: 0, ch: 1, at: 'event', t: '码到房梁', bg: 'assets/story/adv_fuse.jpg', sum: '九一八那夜，库里的炮弹码到房梁，一发没打出去。「这回的，一根都不能白埋。」',
    lines: [['narr', '赵铁山跪在雪里埋炸药，手冻得发紫，一根引信接了三遍。'], ['chenmo', '赵大哥，歇会儿吧。'],
      ['zhaotieshan', '歇不得。……你知道九一八那晚，我们库里码着多少炮弹？'], ['chenmo', '多少？'], ['zhaotieshan', '码到房梁。一发没打出去。'],
      ['zhaotieshan', '上头的命令：不许还手。我在炮位上坐了一宿，天亮就跟着往后撤。'], ['zhaotieshan', '这回的，一根都不能白埋。']] },
  ls_list: { who: 'laoshen', i: 0, ch: 1, at: 'intel', t: '运输清单', bg: 'assets/story/adv_box.jpg', sum: '档案箱里的运输清单：「特殊物资」四十件，去处被涂掉了，编号不像货号。老沈只说：「留着。」',
    lines: [['narr', '档案箱里是一沓油印的单据，最上面一张盖着关东军的章。'], ['shenzhiqiu', '运输清单……「特殊物资」，四十件。从牡丹江送往——这儿被涂掉了。'],
      ['chenmo', '编号挺怪。不像货号。'], ['narr', '老沈接过去看了很久。久到田守义都开始跺脚。'], ['laoshen', '留着。'], ['zhaotieshan', '这玩意儿有啥用？'], ['laoshen', '现在没用。'],
      ['narr', '他把清单折了两折，揣进贴身的衣服里。']] },
  jy_brother: { who: 'jinyongzhe', i: 0, ch: 1, at: 'event', t: '俘虏念的名字', bg: 'assets/story/adv_rope.jpg', sum: '一个朝鲜族的伪军俘虏一直念着弟弟的名字：「永哲」。他说弟弟在「咱们这边」。',
    lines: [['narr', '打散的伪军里抓了个俘虏，是朝鲜族人，冻得说不出整话，嘴里一直念叨着一个名字。'], ['shenzhiqiu', '他念的什么？'],
      ['laoshen', '（朝鲜语）……他说的是「永哲」。是个人名。'], ['laoshen', '他说他弟弟叫永哲，在那边。'], ['hansong', '哪边？'], ['laoshen', '咱们这边。'],
      ['narr', '俘虏后来趁夜跑了。沈知秋在日记里把这个名字记了下来。']] },
};

/* 韩松 × 村濑：只有用韩松打、首领是村濑时，开战对白换成这一段 */
export const TALK_HS_MURASE = [['boss', '（日语）……长白山北麓，三道沟。我记得那个屯子。'], ['boss', '（日语）最后一家不肯搬的。烧起来的时候，那家的男人还拿着猎枪。'],
  ['hero', '……'], ['hero', '是你。'], ['narr', '韩松的枪口抬了起来，又被一只手按了下去。老沈不知什么时候站到了他身边。'],
  ['laoshen', '别在这儿把命交出去。先把他的人打散。'], ['hero', '……好。']];

/* 第一章的开场和结尾过场 */
export const ADV_CH1_OPEN = { bg: 'assets/bg/campaign.jpg', sharp: 1, /* 老沈摊开的地图 */ lines: [['laoshen', '都到齐了。'], ['laoshen', '上头的任务：去新京。路我来带。'],
  ['zhaotieshan', '新京……那可是关东军的老窝。'], ['laoshen', '所以人要少，脚要快。'], ['laoshen', '还有一件事。讨伐队往回送的档案箱，路上碰见了，能截就截。'],
  ['chenmo', '档案？要那玩意儿干嘛。'], ['laoshen', '他们怕丢什么，我们就拿什么。'], ['hero', '什么时候动身？'], ['laoshen', '天亮前。']] };
export const ADV_CH1_END = { bg: 'assets/story/adv_rail.jpg', lines: [['shenzhiqiu', '老沈，那份清单，你一路都贴身揣着。'], ['laoshen', '嗯。'],
  ['shenzhiqiu', '到了新京，就知道它是什么了吧？'], ['laoshen', '……也许吧。'], ['narr', '林子尽头就是铁路。顺着它往南，很远的地方，新京的灯一片一片亮着。']] };

/* 没有图鉴条目的说话人（名字牌用；立绘以后补） */
export const NPC = { chenfu: { n: '陈默的父亲', img: 'assets/portraits/chenfu_lihui.png' }, xing: { n: '邢二嫂', img: 'assets/portraits/xing_lihui.png' }, oldzhou: { n: '老周（东北军旧部）' }, uncle: { n: '三道沟的孙大叔' }, kimpat: { n: '受伤的伪军' } };

/* —— 第二章「新京」的拼图 —— */
const B2 = { alley: 'assets/bg/ev_ch2.jpg', room: 'assets/bg/rest_ch2.jpg', shop: 'assets/bg/shop_ch2.jpg', drop: 'assets/bg/treasure_ch2.jpg' };
const hasF = k => R => (R.flags || []).includes(k);
Object.assign(FRAGS, {
  hs_uncle: { who: 'hansong', i: 2, ch: 2, at: 'event', t: '你娘还活着', bg: 'assets/story/adv2_truck.jpg', sum: '抓劳工的卡车上，有三道沟的孙大叔。他隔着车板喊：「你娘还活着！在部落里！」',
    lines: [['narr', '街口停着抓劳工的卡车，车斗里挤满了人。韩松本来已经走过去了，又停了下来。'], ['uncle', '……松子？是松子吧！'], ['hansong', '孙大叔？'],
      ['uncle', '别过来！听着——你娘还活着！那年没烧着她，她被赶进部落了，还在！'], ['narr', '巡警的警棍敲在车板上。卡车发动了。'], ['hansong', '……'],
      ['shenzhiqiu', '韩松——'], ['hansong', '我听见了。'], ['narr', '他攥着枪带的手，很久都没松开。']] },
  cm_father: { who: 'chenmo', i: 1, ch: 2, at: 'event', only: 'chenmo', force: 1, when: R => hasF('hand1')(R) && !hasF('hand2')(R), t: '路灯底下', bg: 'assets/story/adv2_lamp.jpg',
    sum: '经手人之二，是他父亲。「我只管盖章。」「你从来都只管盖章。」', fx: H => { H.flag('hand2'); H.flag('clerk'); H.sus(2); },
    lines: [['narr', '顺天大街，经济部的人下班了。单据上第二个签章的主人，一个穿灰呢大衣的中年人，在路灯底下停住了脚。'], ['chenfu', '……默儿？'],
      ['chenmo', '「特殊物资」，四十件，从牡丹江运到齐齐哈尔。章是你盖的。'], ['chenfu', '我只管盖章。运的是什么，不归我们科管。'], ['chenmo', '你问过吗？'],
      ['chenfu', '……'], ['chenmo', '你从来都只管盖章。'], ['narr', '父亲从公文包里抽出一页纸，手在抖，递过来。'], ['chenfu', '拿去。……你娘身子不好，她总念叨你。'],
      ['chenmo', '替我跟她说，我吃得饱。'], ['narr', '他转身走了，没有回头。身后的路灯底下，那个人站了很久。']] },
  cm_desk: { who: 'chenmo', i: 2, ch: 2, at: 'event', when: hasF('clerk'), t: '空桌子', bg: 'assets/story/adv2_desk.jpg', sum: '第二天，那个盖章的人没有去上班。只剩一张空桌子，茶杯还是满的。',
    lines: [['narr', '沈知秋去经济部门口转了一圈，回来的时候脸色不好。'], ['shenzhiqiu', '他今天没去上班。'], ['shenzhiqiu', '传达室的人说，昨天夜里宪兵来过。他桌上的茶还是满的。'],
      ['chenmo', '……'], ['tianshouyi', '少爷，你——'], ['chenmo', '别说了。'], ['narr', '陈默把飞刀一把一把擦干净，擦了一夜。']] },
  ts_xiulan: { who: 'tianshouyi', i: 2, ch: 2, at: 'event', when: hasF('xing'), t: '左手腕上的疤', bg: 'assets/story/adv2_window.jpg', sum: '邢二嫂左手腕上有块疤，是她三岁那年他烧的炕烫的。他认出来了，没敢认。',
    lines: [['narr', '夜里，田守义一个人又绕回了豆腐坊。窗户纸透着灯，邢二嫂在推磨。'], ['shenzhiqiu', '老田？你怎么在这儿。'], ['tianshouyi', '……丫头，你看她左手腕。'],
      ['shenzhiqiu', '有块疤。'], ['tianshouyi', '她三岁那年，我烧的炕，烫的。'], ['shenzhiqiu', '她是……'], ['tianshouyi', '秀兰。'],
      ['shenzhiqiu', '你不进去认她？'], ['tianshouyi', '认了，她就多一样叫人抓的把柄。'], ['narr', '磨盘转了一圈又一圈。他在窗外站到灯灭。']] },
  ts_seal: { who: 'tianshouyi', i: 3, ch: 2, at: 'event', when: hasF('sealed'), t: '啥也没说', bg: 'assets/story/adv2_seal.jpg', sum: '封条贴上的第二天，他在对面台阶上坐了一下午，只说了两个字：「随我。」',
    lines: [['narr', '豆腐坊的封条还在。田守义在街对面的台阶上坐了一下午，谁叫都不走。'], ['chenmo', '老田，该走了。'], ['tianshouyi', '纸条上写的啥？'],
      ['shenzhiqiu', '……「啥也没说」。'], ['tianshouyi', '随我。'], ['narr', '他站起来，把大刀往肩上一扛，头也不回地走了。他到最后也没叫出那一声闺女。']] },
  zt_oldzhou: { who: 'zhaotieshan', i: 1, ch: 2, at: 'event', t: '沈营副', bg: 'assets/story/adv2_booth.jpg', sum: '东北军的老战友说：九一八那晚，也有人没听命令——沈营副带着十几个人冲了出去。',
    lines: [['narr', '巡警的岗亭里，一个上了年纪的伪满警察盯着赵铁山看了半天。'], ['oldzhou', '……赵铁山？炮兵营的赵铁山？'], ['zhaotieshan', '老周。你穿上这身皮了。'],
      ['oldzhou', '你骂吧。……我跟你说件事。九一八那晚，不是所有人都听了不抵抗的命令。'], ['oldzhou', '沈营副带着十几个人冲出去了。后来都说他死在城外了。'],
      ['zhaotieshan', '……沈营副。'], ['oldzhou', '你们走吧。今天我没看见人。'], ['narr', '回去的路上，赵铁山一直走在老沈后面，盯着他的背影。']] },
  sq_gate: { who: 'shenzhiqiu', i: 2, ch: 2, at: 'event', t: '查无此人', bg: 'assets/story/adv2_kempei.jpg', sum: '她在宪兵司令部门口排了一上午队，递上去的纸条上写的不是「沈」。窗口里只回了四个字：查无此人。',
    lines: [['narr', '宪兵司令部门口排着打听人的家属。沈知秋把围巾往上拉了拉，也站了进去。'], ['laoshen', '太险了。'], ['shenzhiqiu', '就一回。'],
      ['narr', '轮到她的时候，她把一张折好的纸条从窗口递进去。纸条上写的名字，姓林。'], ['narr', '窗口里的人看都没看，把纸条推了回来。'], ['shenzhiqiu', '……查无此人。'],
      ['laoshen', '走吧。'], ['shenzhiqiu', '老沈，你听见那个姓了。'], ['laoshen', '……听见了。'], ['narr', '他走在她前面，没有回头。']] },
  ls_xing: { who: 'laoshen', i: 1, ch: 2, at: 'event', when: hasF('xing'), t: '别告诉他', bg: 'assets/story/adv2_tofu.jpg', sum: '把秀兰安排进交通线的人，是老沈。她知道她爹就在这支小分队里，她不让说。',
    lines: [['narr', '老沈一个人去豆腐坊取消息。邢二嫂把门插上了。'], ['xing', '他还好吗？'], ['laoshen', '好。能吃能走。'], ['xing', '……还使那把大刀？'], ['laoshen', '使。'],
      ['xing', '别告诉他我在这儿。'], ['laoshen', '他早晚会认出来。'], ['xing', '认出来，也别让他进来。进来了，就是两个人。'], ['narr', '老沈把那块热豆腐揣进怀里，很久没说话。']] },
  jy_name: { who: 'jinyongzhe', i: 1, ch: 2, at: 'event', when: hasF('kim'), t: '永植', bg: 'assets/story/adv2_clinic.jpg', sum: '沈知秋日记里记的那个名字，他认得：被俘的伪军念着的「永哲」，就是他。哥哥叫金永植。',
    lines: [['narr', '诊所关了门以后，金永哲给大家换药。沈知秋翻开日记，指着一行字给他看。'], ['shenzhiqiu', '去年冬天，我们抓过一个朝鲜族的伪军，嘴里一直念着这个名字。'],
      ['jinyongzhe', '……「永哲」。'], ['jinyongzhe', '他长什么样？左边眉毛上有没有一道疤？'], ['shenzhiqiu', '有。'], ['jinyongzhe', '是我哥哥。金永植。'],
      ['jinyongzhe', '他还活着。他还……念着我。'], ['narr', '他低下头接着缠绷带，缠得比哪一次都慢。']] },
  jy_letter: { who: 'jinyongzhe', i: 2, ch: 2, at: 'event', when: hasF('kim'), t: '别回家', bg: 'assets/story/adv2_backdoor.jpg', sum: '一个受伤的朝鲜族伪军逃兵带来哥哥的口信：「弟弟，别回家。家里没人了。」',
    lines: [['narr', '夜里有人敲诊所的后门。是个受了伤的朝鲜族伪军，从队伍里跑出来的。'], ['kimpat', '（朝鲜语）你是金永哲？你哥哥让我带句话。'], ['jinyongzhe', '……你说。'],
      ['kimpat', '「弟弟，别回家。家里没人了。」'], ['jinyongzhe', '……'], ['kimpat', '他还说，他打仗的时候，枪口都往天上抬。'], ['narr', '金永哲给他包好伤，塞给他一包药，送他出了后门。然后一个人在黑地里站了很久。']] },
});

/* 第二章开场（进城）和结尾（排水渠） */
export const ADV_CH2_OPEN = { bg: 'assets/story/adv2_gate.jpg', lines: [['narr', '1945 年春。德国投降的消息，是从苏联电台里听来的。新京的大街上，「日满一德一心」的标语还挂着。'],
  ['laoshen', '分开进城。扮苦力的走北门，扮小贩的走南门，晚上在粮店后门碰头。'], ['laoshen', '这回要找的是一份「交接副本」。一批「特殊物资」从新京驿发出去，单子上有三个经手人签过章。'],
  ['chenmo', '经手人在哪儿？'], ['laoshen', '一个在新京驿货运科，一个在顺天大街的经济部，一个在大同大街。'], ['chenmo', '……经济部。'],
  ['tianshouyi', '少爷，你家老爷子不就在——'], ['chenmo', '我知道。'], ['hero', '那就一个一个摸过去。']] };
export const ADV_CH2_END = { bg: 'assets/story/adv2_drain.jpg', lines: [['narr', '宪兵还在一条街一条街地搜。城北的排水渠口，结着一层薄冰。'],
  ['zhaotieshan', '老沈，下头通哪儿？'], ['laoshen', '通到底下去。'], ['laoshen', '底下有一样东西，他们走之前一定要烧掉。'], ['shenzhiqiu', '什么东西？'],
  ['laoshen', '一份目录。……把三份凑齐，就知道那四十件「特殊物资」是什么了。'], ['narr', '他第一个钻进了黑暗里。']] };

/* —— 第三章「地下」的拼图（1945 年 8 月；背景先借第三章场景图，以后按内容单独出） —— */
const B3 = { fire: 'assets/bg/rest_ch3.jpg', tunnel: 'assets/bg/ev_ch3.jpg', depot: 'assets/bg/treasure_ch3.jpg', cave: 'assets/bg/shop_ch3.jpg' };
Object.assign(NPC, { jpkid: { n: '被丢下的日本兵' }, krsol: { n: '朝鲜人部队的逃兵' } });
Object.assign(FRAGS, {
  hs_kid: { who: 'hansong', i: 3, ch: 3, at: 'event', t: '留着这条命', bg: B3.tunnel, sum: '被丢下的日本伤兵才十八九岁。韩松的枪口放下了：「我娘还活着。我得留着这条命去见她。」',
    lines: [['narr', '防空壕的岔道里，一个日本兵靠墙坐着，腿上的绷带已经发黑。他的部队撤走的时候，没带上他。'], ['jpkid', '（日语）……杀了我吧。反正也没人回来接了。'],
      ['narr', '韩松的枪口对着他，很久没有动。'], ['chenmo', '他说，杀了他吧，反正也没人回来接他。'], ['hansong', '……他多大？'], ['chenmo', '看着不到二十。'],
      ['narr', '韩松把枪放了下来，从干粮袋里掏出半块饼子，扔在他腿边。'], ['hansong', '我娘还活着。'], ['hansong', '我得留着这条命，去见她。']] },
  cm_seal: { who: 'chenmo', i: 3, ch: 3, at: 'event', t: '同一枚章', bg: B3.depot, sum: '要烧掉的档案里，有一张盖着他父亲私章的单据。编号，和交接副本对得上。',
    lines: [['narr', '仓库里堆着等着进炉子的档案，一捆一捆码到房顶。陈默一张一张往下翻。'], ['zhaotieshan', '找啥呢？'], ['chenmo', '……找到了。'],
      ['narr', '他抽出一张发黄的单据。角上那枚私章，他从小在父亲书桌上看到大。'], ['chenmo', '编号和交接副本对得上。四十件，从牡丹江运出去。'], ['chenmo', '他盖了不止一回。'],
      ['narr', '他把单据折好，塞进贴身的口袋，和那一页副本放在一起。']] },
  ts_voice: { who: 'tianshouyi', i: 4, ch: 3, at: 'event', only: 'tian', t: '那一声', bg: B3.tunnel, sum: '黑暗里有人喊「爹」。是假的，他知道。他还是答应了一声——这辈子头一回。',
    lines: [['narr', '火把快灭了。墓道深处，有人在喊。'], ['narr', '「爹——」'], ['zhaotieshan', '老田，别听。底下的东西会学人说话。'], ['tianshouyi', '我知道。'],
      ['narr', '「爹，你在哪儿——」'], ['tianshouyi', '……哎。'], ['tianshouyi', '爹在这儿。'], ['narr', '喊声停了。田守义握着大刀，在黑暗里站了很久。他这辈子，头一回答应了那一声。']] },
  zt_night: { who: 'zhaotieshan', i: 2, ch: 3, at: 'event', only: 'zhao', t: '十二个人', bg: B3.fire, sum: '赵铁山终于问出口了。老沈说：「十二个人冲出去，回来我一个。」',
    lines: [['narr', '别人都睡了。赵铁山往火堆里添了根木头，坐到老沈对面。'], ['zhaotieshan', '九一八那晚，冲出北大营的沈营副，是你吧。'], ['laoshen', '……是我。'],
      ['zhaotieshan', '你为啥从来不说？我骂了自己十四年。'], ['laoshen', '十二个人冲出去，回来我一个。我有啥好说的。'], ['laoshen', '你骂着自己，才能活到今天。我也一样。'],
      ['zhaotieshan', '……'], ['zhaotieshan', '这回我不退。'], ['laoshen', '我知道。']] },
  sq_log: { who: 'shenzhiqiu', i: 3, ch: 3, at: 'event', only: 'shen', t: '移送', bg: B3.depot, sum: '值班日志里，一行一行写着「移送」和编号。她读得懂每一个字，却不懂它们连在一起是什么意思。',
    lines: [['narr', '值班室的桌上摊着一本日志。沈知秋拿起来，一页一页往下读。'], ['shenzhiqiu', '「某月某日，自牡丹江分队接收，移送。」后面是编号。'], ['shenzhiqiu', '下一行也是。再下一行也是。'],
      ['hansong', '移送到哪儿？'], ['shenzhiqiu', '没写。只写「移送」。'], ['narr', '她翻到最后一页。日期停在八月九日。'], ['shenzhiqiu', '这些编号……老沈清单上的，也是这个样子。']] },
  ls_one: { who: 'laoshen', i: 2, ch: 3, at: 'event', t: '有一个', bg: B3.fire, sum: '「清单上的人，你认识？」老沈说：「有一个。」他没说是谁。',
    lines: [['narr', '老沈把那份运输清单摊在火边，一行一行看，看了很久。'], ['shenzhiqiu', '老沈，清单上的人……你认识？'], ['laoshen', '……'], ['laoshen', '有一个。'],
      ['shenzhiqiu', '是谁？'], ['laoshen', '等出去了，我告诉你。'], ['narr', '他把清单折回去，揣进怀里。那一夜，他一直没睡。']] },
  jy_north: { who: 'jinyongzhe', i: 3, ch: 3, at: 'event', t: '往北去了', bg: B3.cave, sum: '朝鲜人部队散了。一个逃兵说，金永植往北去了：「他说要去找弟弟。」',
    lines: [['narr', '岔洞里躲着几个穿伪军军服的人，枪都扔了。是朝鲜人部队的，队伍已经散了。'], ['jinyongzhe', '（朝鲜语）你们认识金永植吗？'], ['krsol', '（朝鲜语）……认识。前天夜里，他一个人往北去了。'],
      ['krsol', '（朝鲜语）他说，要去找他弟弟。'], ['jinyongzhe', '……'], ['narr', '金永哲把身上剩的药全给了他们。转过身的时候，他在笑，眼泪却止不住。']] },
});

/* 第三章开场（八月九日，钻进防空壕）和结尾（八月十五日，爬出地面） */
export const ADV_CH3_OPEN = { bg: B3.tunnel, lines: [['narr', '1945 年 8 月 9 日，苏联出兵。新京乱了：关东军在撤，侨民在逃，宪兵在烧东西。'],
  ['laoshen', '建国神庙后头有条防空壕，一直通到地底下。他们的仓库，就在下面。'], ['zhaotieshan', '烧东西的仓库？'], ['laoshen', '对。拟销毁目录在那儿。他们走之前，一定要把它烧掉。'],
  ['shenzhiqiu', '底下……听说不干净。'], ['laoshen', '底下有啥，都比上头的人干净。'], ['hero', '走吧。']] };
export const ADV_CH3_END = { bg: B3.fire, lines: [['narr', '1945 年 8 月 15 日正午。地面上，收音机里传出一个尖细的声音，断断续续。'],
  ['shenzhiqiu', '（她听了一会儿）……他们投降了。'], ['tianshouyi', '投降了？'], ['hansong', '……'], ['chenmo', '那些没烧完的档案呢？'],
  ['laoshen', '在司令部。他们还在烧。'], ['laoshen', '把清单、副本、目录凑齐的人——跟我走。']] };
