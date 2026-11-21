// 背包用品（相当于通往顶端的药水）：一次性，格子有限。
// battle(G)：战斗中使用的效果；map(R, M)：地图上使用的效果（M 提供 heal、food、temp）。只写了哪个就只能在哪用。
// 史实：都是当时东北山林里真实会有的东西
export const ITEM_SLOTS = 3;
export const ITEMS = {
  grenade: { name: '手榴弹', icon: '💣', desc: '对所有敌人造成 10 伤害。', battle: G => G.alive().forEach(e => G.melee(e, 10)) },
  shaodaozi: { name: '烧刀子', icon: '🍶', desc: '东北的高粱烧酒。回复 8 生命，体温 +2。', battle: G => { G.heal(8); G.temp(2); }, map: (R, M) => { M.heal(8); M.temp(2); } },
  medkit: { name: '急救包', icon: '🩹', desc: '回复 15 生命。', battle: G => G.heal(15), map: (R, M) => M.heal(15) },
  smoke: { name: '烟幕弹', icon: '💨', desc: '获得 12 格挡。', battle: G => G.block(12) },
  beef: { name: '缴获的牛肉罐头', icon: '🥫', desc: '战斗中：回复 5 生命。地图上：口粮 +3。', battle: G => G.heal(5), map: (R, M) => M.food(3) },
  badger: { name: '獾子油', icon: '🫙', desc: '东北民间治冻伤的土方。体温回满。', map: (R, M) => M.temp(99) },
  flaregun: { name: '缴获的信号枪', icon: '🎆', desc: '给所有敌人 2 层虚弱。', battle: G => G.alive().forEach(e => G.weak(e, 2)) },
  fakeid: { name: '假身份证明', icon: '📕', act: 2, desc: '交通站做的假证件。检问所里能用掉它蒙混过关；在地图上用：可疑度 -3。', map: (R, M) => M.sus(-3) },
  lantern: { name: '马灯', icon: '🏮', act: 3, desc: '地下用。地图上用：理智 +2；战斗中用：驱散黑暗，看清所有敌人。', map: (R, M) => M.san(2), battle: G => { G.B.lit = 1; G.say('马灯亮了。'); } },
  soybeans: { name: '炒黄豆', icon: '🫘', desc: '获得 2 点能量。', battle: G => G.energy(2) },
  styptic: { name: '止血粉', icon: '🩸', desc: '回复 10 生命。', battle: G => G.heal(10), map: (R, M) => M.heal(10) },
  pear: { name: '冻梨', icon: '🍐', desc: '冻得梆硬的秋梨，啃一口人就醒了。抽 3 张牌。', battle: G => G.draw(3) },
  molotov: { name: '燃烧瓶', icon: '🍾', desc: '对所有敌人造成 5 伤害，易伤 2。', battle: G => G.alive().forEach(e => { G.melee(e, 5); G.vuln(e, 2); }) },
  tea: { name: '浓茶', icon: '🍵', desc: '能量 +1，抽 2 张牌。', battle: G => { G.energy(1); G.draw(2); } },
  whistle2: { name: '缴获的警笛', icon: '📢', desc: '吹一声，所有敌人格挡清零，虚弱 1。', battle: G => G.alive().forEach(e => { e.block = 0; G.weak(e, 1); }) },
  icepick: { name: '冰镩', icon: '⛏', desc: '凿冰窟窿的铁家伙。对生命最多的敌人造成 20 伤害。', battle: G => { const a = G.alive(); if (a.length) G.melee(a.reduce((x, y) => (y.hp > x.hp ? y : x)), 20); } },
  jerky: { name: '狍子肉干', icon: '🥩', desc: '战斗中：回复 8 生命。地图上：口粮 +2。', battle: G => G.heal(8), map: (R, M) => M.food(2) },
  bandroll: { name: '绷带卷', icon: '🧻', desc: '获得 10 格挡，回复 5 生命。', battle: G => { G.block(10); G.heal(5); } },
  newspaper: { name: '旧报纸', icon: '📰', act: 2, desc: '城里用。地图上：可疑度 -2；战斗中：抽 2 张牌。', map: (R, M) => M.sus(-2), battle: G => G.draw(2) },
  matchbox: { name: '铜手炉', icon: '🔥', desc: '揣在怀里的小铜炉。地图上：体温 +3；战斗中：获得 6 格挡。', map: (R, M) => M.temp(3), battle: G => G.block(6) },
};
Object.entries(ITEMS).forEach(([k, d]) => { d.id = k; });
