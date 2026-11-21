// 通用卡牌：所有角色都能用（基础的「闪避」、急救类）。以后各角色共用的牌加在这里。
import { V } from './util.js';
export const CARDS_COMMON = {
  defend: { name: '闪避', type: 'skill', cost: [1, 1], rar: 'basic', sch: '通',
    desc: u => `获得 ${V(u, 5, 8)} 格挡。`, play: (G, u) => G.block(V(u, 5, 8)) },
  hs_medkit: { name: '急救包', type: 'skill', cost: [1, 1], rar: 'c', sch: '通', ex: 1,
    desc: u => `回复 ${V(u, 6, 9)} 生命。消耗。`, play: (G, u) => G.heal(V(u, 6, 9)) },
  /* 好几个人卡表里都有的急救、绷带：合成一张，谁都能拿 */
  firstaid: { name: '急救', type: 'skill', cost: [0, 0], rar: 'c', sch: '通', ex: 1, icon: 'medkit',
    desc: u => `回复 ${V(u, 4, 6)} 生命。消耗。`, play: (G, u) => G.heal(V(u, 4, 6)) },
  bandage: { name: '绷带', type: 'skill', cost: [1, 1], rar: 'u', sch: '通', ex: 1, icon: 'medkit',
    desc: u => `回复 ${V(u, 8, 11)} 生命。消耗。`, play: (G, u) => G.heal(V(u, 8, 11)) },
};
Object.values(CARDS_COMMON).forEach(d => { d.ch = null; });

/* 通用卡（谁都能拿）：不进战后奖励，只在商店固定那一格和事件里出 */
export const CARDS_COLORLESS = {
  cl_net: { name: '伪装网', type: 'skill', cost: [0, 0], rar: 'c', icon: 'cover',
    desc: u => `获得 ${V(u, 4, 6)} 格挡；本回合第一次挨打 -3 伤害。`, play: (G, u) => { G.block(V(u, 4, 6)); G.minus3(); } },
  cl_smoke: { name: '烟幕弹', type: 'skill', cost: [1, 1], rar: 'c', icon: 'cover',
    desc: u => `获得 ${V(u, 8, 11)} 格挡。`, play: (G, u) => G.block(V(u, 8, 11)) },
  cl_binoc: { name: '望远镜', type: 'skill', cost: [1, 1], rar: 'c', icon: 'binoc',
    desc: u => `抽 ${V(u, 2, 3)}。`, play: (G, u) => G.draw(V(u, 2, 3)) },
  cl_flour: { name: '炒面', type: 'skill', cost: [0, 0], rar: 'c', ex: 1, icon: 'medkit',
    desc: u => `炒熟的面粉，就着雪吃。回复 ${V(u, 4, 6)} 生命。消耗。`, play: (G, u) => G.heal(V(u, 4, 6)) },
  cl_water: { name: '热水', type: 'skill', cost: [0, 0], rar: 'c', icon: 'medkit',
    desc: u => `去掉自己身上的虚弱和易伤，抽 ${V(u, 1, 2)}。`, play: (G, u) => { G.clearSelf(); G.draw(V(u, 1, 2)); } },
  cl_grenade: { name: '缴获的手榴弹', type: 'atk', cost: [1, 1], rar: 'c', icon: 'grenade',
    desc: u => `对所有敌人造成 ${V(u, 7, 10)} 伤害（会出声）。`, play: (G, u) => { G.meleeAll(V(u, 7, 10)); G.noise(1); } },
  cl_shovel: { name: '工兵铲', type: 'atk', cost: [1, 1], rar: 'c', tgt: 'one', icon: 'bayonet',
    desc: u => `造成 ${V(u, 8, 11)} 伤害；对装甲 +50%。`, play: (G, u, t) => G.meleeAP(t, V(u, 8, 11), .5) },
  cl_flare: { name: '信号弹', type: 'skill', cost: [1, 1], rar: 'u', icon: 'binoc',
    desc: u => `抽 ${V(u, 1, 2)}，所有敌人虚弱 1。`, play: (G, u) => { G.draw(V(u, 1, 2)); G.alive().forEach(e => G.weak(e, 1)); } },
  cl_bangalore: { name: '爆破筒', type: 'atk', cost: [1, 1], rar: 'u', tgt: 'one', icon: 'grenade',
    desc: u => `造成 ${V(u, 12, 16)} 伤害，无视装甲（会出声）。`, play: (G, u, t) => { G.meleeAP(t, V(u, 12, 16), 0); G.noise(1); } },
  cl_surgery: { name: '急救手术', type: 'skill', cost: [2, 2], rar: 'u', ex: 1, icon: 'medkit',
    desc: u => `回复 ${V(u, 15, 20)} 生命。消耗。`, play: (G, u) => G.heal(V(u, 15, 20)) },
  cl_coat: { name: '防寒大衣', type: 'power', cost: [1, 1], rar: 'u', icon: 'cover',
    desc: u => `每回合开始获得 ${V(u, 3, 5)} 格挡。`, play: (G, u) => G.power('cblk', V(u, 3, 5)) },
  cl_egg: { name: '煮鸡蛋', type: 'skill', cost: [0, 0], rar: 'r', ex: 1, icon: 'medkit',
    desc: u => `老乡塞进你怀里的，还热着。回复 ${V(u, 5, 8)} 生命，抽 1。消耗。`, play: (G, u) => { G.heal(V(u, 5, 8)); G.draw(1); } },
  cl_clock: { name: '马蹄表', type: 'power', cost: [1, 0], rar: 'r', icon: 'letter',
    desc: () => '每回合开始多抽 1 张。', play: G => G.power('drawPlus', 1) },
  cl_veteran: { name: '老兵经验', type: 'power', cost: [3, 2], rar: 'r', icon: 'helmet',
    desc: () => '每回合开始能量 +1。', play: G => G.power('ePlus', 1) },
  cl_map: { name: '苏联地图', type: 'skill', cost: [1, 1], rar: 'r', ex: 1, icon: 'map',
    desc: u => `抽 ${V(u, 3, 4)}，能量 +1。消耗。`, play: (G, u) => { G.draw(V(u, 3, 4)); G.energy(1); } },
};
Object.values(CARDS_COLORLESS).forEach(d => { d.ch = null; d.sch = '通'; d.colorless = 1; });

/* 诅咒：事件里的坏选项给的，进牌组，不能打出。商店可以去掉 */
const CU = { type: 'curse', cost: [0, 0], rar: 'curse', sch: '通', unplay: 1, icon: 'helmet', ch: 'curse' };
export const CARDS_CURSE = {
  cu_doubt: { ...CU, name: '疑心', desc: () => '不能打出。回合结束还在手里：虚弱 1。', inHandEnd: G => G.selfWeak(1) },
  cu_regret: { ...CU, name: '悔意', desc: () => '不能打出。回合结束还在手里：失去 1 生命。', inHandEnd: G => G.loseHp(1) },
  cu_frost: { ...CU, name: '冻伤', desc: () => '不能打出。占一格手牌。' },
  cu_shake: { ...CU, name: '手抖', shake: 1, desc: () => '不能打出。在手里时，你的攻击每下 -2 伤害。' },
  cu_home: { ...CU, name: '思乡', desc: () => '不能打出。抽到它时，下回合少抽 1 张。', onDraw: (G, B) => { B.p.drawLess = (B.p.drawLess || 0) + 1; } },
  cu_tinnitus: { ...CU, name: '耳鸣', desc: () => '不能打出。抽到它时，理智 -1。', onDraw: G => G.san(-1) },
};
/* 状态牌：敌人塞进你这场的牌堆，打完这场就没了 */
const STT = { type: 'status', cost: [0, 0], rar: 'status', sch: '通', unplay: 1, icon: 'medkit', ch: 'status' };
export const CARDS_STATUS = {
  st_wound: { ...STT, name: '伤口', desc: () => '不能打出。占一格手牌。' },
  st_burn: { ...STT, name: '烧伤', icon: 'torch', desc: () => '不能打出。回合结束还在手里：失去 2 生命。', inHandEnd: G => G.loseHp(2) },
  st_daze: { ...STT, name: '眩晕', ethereal: 1, desc: () => '不能打出。回合结束自己消失。' },
};
CARDS_COMMON.defend.icon = 'cover'; CARDS_COMMON.hs_medkit.icon = 'medkit';
