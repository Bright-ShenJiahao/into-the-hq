// 通用卡牌：所有角色都能用（基础的「闪避」、急救类）。以后各角色共用的牌加在这里。
import { V } from './util.js';
export const CARDS_COMMON = {
  defend: { name: '闪避', type: 'skill', cost: [1, 1], rar: 'basic', sch: '通',
    desc: u => `获得 ${V(u, 5, 8)} 格挡。`, play: (G, u) => G.block(V(u, 5, 8)) },
  hs_medkit: { name: '急救包', type: 'skill', cost: [1, 1], rar: 'c', sch: '通', ex: 1,
    desc: u => `回复 ${V(u, 6, 9)} 生命。消耗。`, play: (G, u) => G.heal(V(u, 6, 9)) },
};
Object.values(CARDS_COMMON).forEach(d => { d.ch = null; });
CARDS_COMMON.defend.icon = 'cover'; CARDS_COMMON.hs_medkit.icon = 'medkit';
