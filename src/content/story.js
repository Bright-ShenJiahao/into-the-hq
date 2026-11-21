// 人物拼图和过场对白。人物全部虚构；日本人的台词标（日语）。
// 每人一张拼图，5 块，散在三章的事件里；拼到的块跨局保存（图鉴「人物」页里看）。
// 关系网（设计见 docs/人物拼图设计.md）：
//   老沈欠沈知秋父亲一条命（她父亲被捕后没供出给读书会递书的人——就是老沈）；
//   陈默的父亲在经济部签了「交接副本」；真结局「特别移送」名单上有沈知秋父亲的名字；
//   第二章豆腐坊的邢二嫂是田守义的闺女田秀兰；村濑带队烧过韩松家的屯子；金永哲的哥哥在日伪的朝鲜人部队里。

/* 小分队成员：角色 id → 图鉴人物 id */
export const PID = { hansong: 'hansong', chenmo: 'chenmo', tian: 'tianshouyi', zhao: 'zhaotieshan', shen: 'shenzhiqiu' };

/* 每人 5 块：第几章出现（'终' = 真结局）。只列出已经写好的块的内容，没写的显示「？？？」 */
export const FRAG_PLAN = {
  hansong: [1, 1, 2, 3, '终'], chenmo: [1, 2, 2, 3, '终'], tianshouyi: [1, 1, 2, 2, 3], zhaotieshan: [1, 2, 3, '终', '终'],
  shenzhiqiu: [1, 1, 2, 3, '终'], laoshen: [1, 2, 3, '终', '终'], jinyongzhe: [1, 2, 2, 3, '终'],
};

/* 拼图块。who：属于谁；ch：章；only：只有用这个角色打才会出现；at：在哪儿出现（event = 事件格，intel = 第一次截下档案箱后，boss = 首领战前）；bg：过场背景 */
export const FRAGS = {
  hs_stove: { who: 'hansong', i: 0, ch: 1, at: 'event', t: '灶台', bg: 'assets/bg/ev_forest.jpg', sum: '路过一片烧掉的屯子，韩松摸了摸灶台：他家的灶，也是这么砌的。',
    lines: [['narr', '林子边上有一片烧过的地基，雪盖了一半。只有灶台还立着。'], ['narr', '韩松在灶台前蹲下，伸手摸了摸灶沿。'],
      ['shenzhiqiu', '你认得这儿？'], ['hansong', '……不认得。'], ['hansong', '我家的灶，也是这么砌的。'],
      ['laoshen', '走吧。天黑前要过沟。'], ['narr', '韩松站起来，往冷了多年的灶膛里塞了一把雪。没人问他为什么。']] },
  hs_murase: { who: 'hansong', i: 1, ch: 1, at: 'boss', boss: 'captain', only: 'hansong', t: '三道沟', sum: '讨伐队长村濑记得那个屯子。韩松的枪口抬起来，被老沈按了下去。' },
  ts_road: { who: 'tianshouyi', i: 0, ch: 1, at: 'event', t: '屯子口', bg: 'assets/bg/ev_forest.jpg', sum: '路过一个集团部落，田守义停下来看那条往山外去的车道：「通我家。十二年没走过了。」',
    lines: [['narr', '前面是个「集团部落」：土墙、炮楼，大门口站着两个伪自卫团。小分队绕着林子边走。'], ['narr', '田守义在林边停下了。'],
      ['zhaotieshan', '老田，走了。'], ['tianshouyi', '等会儿。……这屯子，我有个熟人。'], ['chenmo', '熟人？你进得去吗。'], ['tianshouyi', '不进。我看看路。'],
      ['narr', '他看的不是大门，是屯子西边那条往山外去的车道。'], ['shenzhiqiu', '那条路通哪儿？'], ['tianshouyi', '……通我家。'], ['tianshouyi', '十二年没走过了。']] },
  ts_name: { who: 'tianshouyi', i: 1, ch: 1, at: 'event', t: '雪地上的字', bg: 'assets/bg/rest_dugout.jpg', sum: '田守义不识字，却会用刀尖在雪地上划两个字：「秀」「兰」。是当年请先生起的名字。',
    lines: [['narr', '夜里轮到田守义守岗。沈知秋来换他的时候，看见他蹲在雪地上，用刀尖划着什么。'], ['tianshouyi', '丫头，你识字。这个念啥？'],
      ['shenzhiqiu', '……「秀」。秀气的秀。'], ['tianshouyi', '嗯。那这个呢。'], ['shenzhiqiu', '「兰」。'], ['narr', '他把两个字看了很久，用脚抹平了。'],
      ['tianshouyi', '当年请先生起的。我自己不认得。'], ['shenzhiqiu', '谁的名字？'], ['tianshouyi', '去睡吧。换岗了。']] },
  cm_paper: { who: 'chenmo', i: 0, ch: 1, at: 'event', t: '报纸', bg: 'assets/bg/rest_dugout.jpg', sum: '伪满报纸上有一则经济部的人事任命。陈默把它扔进了火里：「管物资调运。跟我没关系。」',
    lines: [['narr', '截下的讨伐队辎重里有一沓伪满的报纸，拿来引火正好。'], ['narr', '陈默翻了一页，停住了。'], ['tianshouyi', '咋了少爷，报上有你家？'],
      ['narr', '陈默把那一页揉成一团，扔进火里。'], ['tianshouyi', '你爹吧？又升官了？'], ['chenmo', '经济部。管物资调运。'], ['chenmo', '他升没升官，跟我没关系。'],
      ['shenzhiqiu', '陈默——'], ['chenmo', '柴不够了。我去捡。']] },
  sq_line: { who: 'shenzhiqiu', i: 0, ch: 1, at: 'event', t: '空着的一行', bg: 'assets/bg/rest_dugout.jpg', sum: '沈知秋的日记每一页最后都空着一行，留给她爹：等找着他了，让他自己写一句。',
    lines: [['narr', '沈知秋每天睡前都要写几行日记，写完把本子揣进怀里。'], ['hansong', '你每页最后都空一行。'], ['shenzhiqiu', '你看我本子了？'],
      ['hansong', '递给你的时候看见的。空着干嘛？'], ['shenzhiqiu', '留给我爹。'], ['shenzhiqiu', '等找着他了，让他自己写一句。写什么都行。'], ['hansong', '……'], ['hansong', '那你多留几行。']] },
  sq_why: { who: 'shenzhiqiu', i: 1, ch: 1, at: 'event', t: '为什么是我', bg: 'assets/bg/rest_dugout.jpg', sum: '她问老沈，三八年为什么偏偏带上一个女学生。老沈往火里添了块柴，没回答。',
    lines: [['shenzhiqiu', '老沈，问你个事。'], ['laoshen', '嗯。'], ['shenzhiqiu', '三八年那会儿，山上缺枪缺粮，不缺人，更不要女学生。你为什么带上我？'],
      ['laoshen', '……你识字。'], ['shenzhiqiu', '识字的多了。'], ['laoshen', '你会俄语。'], ['shenzhiqiu', '那时候我还不会。'],
      ['narr', '老沈往火里添了块柴，没再说话。'], ['laoshen', '睡吧。明天走四十里。']] },
  zt_shells: { who: 'zhaotieshan', i: 0, ch: 1, at: 'event', t: '码到房梁', bg: 'assets/bg/ev_forest.jpg', sum: '九一八那夜，库里的炮弹码到房梁，一发没打出去。「这回的，一根都不能白埋。」',
    lines: [['narr', '赵铁山跪在雪里埋炸药，手冻得发紫，一根引信接了三遍。'], ['chenmo', '赵大哥，歇会儿吧。'],
      ['zhaotieshan', '歇不得。……你知道九一八那晚，我们库里码着多少炮弹？'], ['chenmo', '多少？'], ['zhaotieshan', '码到房梁。一发没打出去。'],
      ['zhaotieshan', '上头的命令：不许还手。我在炮位上坐了一宿，天亮就跟着往后撤。'], ['zhaotieshan', '这回的，一根都不能白埋。']] },
  ls_list: { who: 'laoshen', i: 0, ch: 1, at: 'intel', t: '运输清单', bg: 'assets/bg/ev_forest.jpg', sum: '档案箱里的运输清单：「特殊物资」四十件，去处被涂掉了，编号不像货号。老沈只说：「留着。」',
    lines: [['narr', '档案箱里是一沓油印的单据，最上面一张盖着关东军的章。'], ['shenzhiqiu', '运输清单……「特殊物资」，四十件。从牡丹江送往——这儿被涂掉了。'],
      ['chenmo', '编号挺怪。不像货号。'], ['narr', '老沈接过去看了很久。久到田守义都开始跺脚。'], ['laoshen', '留着。'], ['zhaotieshan', '这玩意儿有啥用？'], ['laoshen', '现在没用。'],
      ['narr', '他把清单折了两折，揣进贴身的衣服里。']] },
  jy_brother: { who: 'jinyongzhe', i: 0, ch: 1, at: 'event', t: '俘虏念的名字', bg: 'assets/bg/ev_forest.jpg', sum: '一个朝鲜族的伪军俘虏一直念着弟弟的名字：「永哲」。他说弟弟在「咱们这边」。',
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
export const ADV_CH1_END = { bg: 'assets/bg/ev_forest.jpg', lines: [['shenzhiqiu', '老沈，那份清单，你一路都贴身揣着。'], ['laoshen', '嗯。'],
  ['shenzhiqiu', '到了新京，就知道它是什么了吧？'], ['laoshen', '……也许吧。'], ['narr', '林子尽头就是铁路。顺着它往南，就是新京。']] };
