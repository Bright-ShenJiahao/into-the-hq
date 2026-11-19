// 《深入日军总部》内容登记处：各个内容文件在这里汇总。
// 加角色：在 content/ 下写一个角色文件，登记到 CHARS 和 CARDS。
// 加章节：在 content/ 下写一个章节文件，登记到 CHAPTERS（顺序就是第几章）。
// 加随身物品 / 背包用品：直接在 content/relics.js、content/items.js 里加。
import { V, pick } from './content/util.js';
import { HANSONG, CARDS_HS, KW_HS, BAYONET, MAG, FEEL_MAX } from './content/hansong.js';
import { CARDS_COMMON } from './content/common.js';
import { CHAPTER1 } from './content/ch1.js';
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
export const CHARS = { hansong: HANSONG };
export const CHAPTERS = [CHAPTER1]; /* 第二章、第三章做好后加在这里 */
export const CARDS = { ...CARDS_COMMON, ...CARDS_HS };
Object.entries(CARDS).forEach(([id, d]) => { d.id = id; });
/* 所有章节的敌人合在一起（按 key 查） */
export const ENEMIES = Object.assign({}, ...CHAPTERS.map(c => c.enemies));
export const FRAMES = Object.assign({}, ...CHAPTERS.map(c => c.frames || {}), ...Object.values(CHARS).map(c => ({ [c.art.dir]: c.art.fr })));
export const BLOCK_SIZE = Object.assign({}, ...CHAPTERS.map(c => c.blockSize || {}));

export const KW = {
  ...KW_HS,
  '装甲': '每次受到的伤害减去装甲值。穿甲类牌无视装甲。',
  '格挡': '抵挡受到的伤害，你的回合开始时清零。',
  '虚弱': '造成的攻击伤害 -25%，每回合减 1 层。',
  '易伤': '受到的攻击伤害 +50%，每回合减 1 层。',
  '消耗': '打出后本场战斗移除。',
  '能力': '打出后整场战斗持续生效。',
};
export const TYPE = { atk: '攻击', skill: '技能', power: '能力' };
export const RAR = { basic: '基础', c: '普通', u: '罕见', r: '稀有', loot: '缴获' };
export const SCH = { 狙: '狙击', 冲: '冲锋枪', 手: '手枪', 通: '通用' };
