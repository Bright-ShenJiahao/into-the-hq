// 《长夜将尽》内容登记处：各个内容文件在这里汇总。
// 加角色：在 content/ 下写一个角色文件，登记到 CHARS 和 CARDS。
// 加章节：在 content/ 下写一个章节文件，登记到 CHAPTERS（顺序就是第几章）。
// 加随身物品 / 背包用品：直接在 content/relics.js、content/items.js 里加。
import { V, pick } from './content/util.js';
import { HANSONG, CARDS_HS, KW_HS, BAYONET, MAG, FEEL_MAX } from './content/hansong.js';
import { CHENMO, CARDS_CM, KW_CM } from './content/chenmo.js';
import { TIAN, CARDS_TS, KW_TS } from './content/tian.js';
import { ZHAO, CARDS_ZT, KW_ZT } from './content/zhao.js';
import { SHEN, CARDS_SQ, KW_SQ } from './content/shen.js';
import { CARDS_COMMON, CARDS_COLORLESS, CARDS_CURSE, CARDS_STATUS } from './content/common.js';
import { CHAPTER1 } from './content/ch1.js';
import { CHAPTER2 } from './content/ch2.js';
import { CHAPTER3, CARDS_CH3 } from './content/ch3.js';
import { RELICS } from './content/relics.js';
import { ITEMS, ITEM_SLOTS } from './content/items.js';
export { V, pick, RELICS, ITEMS, ITEM_SLOTS, BAYONET, MAG, FEEL_MAX };
/* 随身物品、背包用品的图标：有图用图（assets/relics、assets/items），没图的新物品先用内容文件里写的表情符号 */
const ICON_READY = { relics: new Set(['strap', 'watch', 'mittens', 'ulacao', 'foodbag', 'canteen', 'belt', 'whet', 'doghat', 'scope2', 'drum', 'letter', 'herbs', 'intelmap', 'flint', 'ginseng', 'notes', 'ammobox', 'kwmap', 'apcmg', 'saber']),
  items: new Set(['grenade', 'shaodaozi', 'smoke', 'beef', 'badger', 'flaregun', 'soybeans']) };
const ICON_PATH = { items: { medkit: 'assets/icons/medkit.png' } };
for (const [dir, tab] of [['relics', RELICS], ['items', ITEMS]]) for (const [id, d] of Object.entries(tab)) {
  d.emoji = d.icon; const src = (ICON_PATH[dir] || {})[id] || (ICON_READY[dir].has(id) ? `assets/${dir}/${id}.png` : null);
  if (src) d.icon = `<img class="ico" src="${src}" alt="" draggable="false">`;
}

export const SAVE_VERSION = 2;
export const CHARS = { hansong: HANSONG, chenmo: CHENMO, tian: TIAN, zhao: ZHAO, shen: SHEN }; /* 顺序就是选人界面的顺序；现在全部一开始就解锁 */
export const CHAPTERS = [CHAPTER1, CHAPTER2, CHAPTER3]; /* 真结局做好后加在这里 */
export const CARDS = { ...CARDS_COMMON, ...CARDS_COLORLESS, ...CARDS_CURSE, ...CARDS_STATUS, ...CARDS_HS, ...CARDS_CM, ...CARDS_TS, ...CARDS_ZT, ...CARDS_SQ, ...CARDS_CH3 };
Object.entries(CARDS).forEach(([id, d]) => { d.id = id; });
/* 所有章节的敌人合在一起（按 key 查） */
export const ENEMIES = Object.assign({}, ...CHAPTERS.map(c => c.enemies));
export const FRAMES = Object.assign({}, ...CHAPTERS.map(c => c.frames || {}), ...Object.values(CHARS).filter(c => c.art.dir).map(c => ({ [c.art.dir]: c.art.fr })));
export const BLOCK_SIZE = Object.assign({}, ...CHAPTERS.map(c => c.blockSize || {}));

export const KW = {
  ...KW_HS, ...KW_CM, ...KW_TS, ...KW_ZT, ...KW_SQ,
  '装甲': '每次受到的伤害减去装甲值。穿甲类牌无视装甲。',
  '格挡': '抵挡受到的伤害，你的回合开始时清零。',
  '虚弱': '造成的攻击伤害 -25%，每回合减 1 层。',
  '易伤': '受到的攻击伤害 +50%，每回合减 1 层。',
  '消耗': '打出后本场战斗移除。',
  '能力': '打出后整场战斗持续生效。',
  '保留': '回合结束时不弃掉，留在手里。',
  '理智': '第三章代替可疑度（0—10）。走进古墓每格 -1，有的敌人和事件也会让它下降。理智低了，地图会变黑，眼前的东西也不一定可信。到 0 时，下一场战斗会多一个影子。火堆 +3。',
  '仪式': '萨满老人主持的仪式：神鼓、腰铃、神刀三张牌，每回合给你一张，按顺序打出来，就能把「它」封回去。',
};
export const TYPE = { atk: '攻击', skill: '技能', power: '能力', curse: '诅咒', status: '状态' };
export const RAR = { basic: '基础', c: '普通', u: '罕见', r: '稀有', loot: '缴获', curse: '诅咒', status: '状态' };
export const SCH = { 狙: '狙击', 冲: '冲锋枪', 手: '手枪', 刀: '留刀', 血: '放血', 怒: '怒', 守: '守', 爆: '爆破', 工: '工事', 侦: '侦察', 伏: '埋伏', 通: '通用' };
