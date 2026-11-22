# 机器人平衡测试报告

生成时间：2026-11-22T12:37:21.150Z

三章通关率和真结局胜率以全部开局数为分母；首领胜率以实际进入该场战斗的次数为分母。生命为三章通关且最终存活局的平均值；无样本显示「—」。超时为任一战斗 60 回合未结束。程序报错局单独列出，不能视为正常死亡。

路线使用实际地图拓扑与节点权重，机器人只走可达边，优先寻找加强精英；隐藏地图时随机选路。事件简化为等概率回血 8、口粮 2、选牌或随身物品，其余奖励与游戏规则对齐。这是机器人策略下的平衡测试，不代表玩家真实胜率。

| 角色 | 局数 | 第一章 | 第二章 | 第三章 | 真结局胜率 | 真结局胜/挑战 | 通关剩余生命 | 超时局数 | 报错局数 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| hansong | 300 | 75.3% | 68.3% | 68.3% | 61.0% | 183/184 | 44.8 | 0 | 0 |
| chenmo | 300 | 82.7% | 81.3% | 81.3% | 15.0% | 45/45 | 64.1 | 0 | 0 |
| tian | 300 | 94.7% | 92.3% | 92.3% | 0.7% | 2/2 | 82.5 | 0 | 0 |
| zhao | 300 | 95.3% | 94.7% | 94.7% | 0.0% | 0/0 | 77.4 | 0 | 0 |
| shen | 300 | 93.0% | 90.7% | 90.7% | 0.0% | 0/0 | 65.8 | 6 | 0 |

## 首领胜率及各章通关生命

| 角色 | 首领 | 胜/挑战 | 胜率 |
|---|---|---:|---:|
| 韩松 (hansong) | 日军步兵 (inf)、讨伐队长 · 村濑 (captain) | 109/119 | 91.6% |
| 韩松 (hansong) | 军犬 (dog)、宪兵分队长 · 柏木 (kcap)、军犬 (dog) | 117/118 | 99.2% |
| 韩松 (hansong) | 宪兵队特高课长·桐野 (kirino) | 103/105 | 98.1% |
| 韩松 (hansong) | 便衣特务 (spy)、关东军情报部少佐·久我 (kuga) | 102/105 | 97.1% |
| 韩松 (hansong) | 随军神官·鹫尾 (priest) | 205/205 | 100.0% |
| 韩松 (hansong) | 关东军参谋·大槻中佐 (staff) | 183/184 | 99.5% |
| 陈默 (chenmo) | 日军步兵 (inf)、讨伐队长 · 村濑 (captain) | 123/124 | 99.2% |
| 陈默 (chenmo) | 军犬 (dog)、宪兵分队长 · 柏木 (kcap)、军犬 (dog) | 125/127 | 98.4% |
| 陈默 (chenmo) | 宪兵队特高课长·桐野 (kirino) | 116/116 | 100.0% |
| 陈默 (chenmo) | 便衣特务 (spy)、关东军情报部少佐·久我 (kuga) | 128/130 | 98.5% |
| 陈默 (chenmo) | 随军神官·鹫尾 (priest) | 244/244 | 100.0% |
| 陈默 (chenmo) | 关东军参谋·大槻中佐 (staff) | 45/45 | 100.0% |
| 田守义 (tian) | 日军步兵 (inf)、讨伐队长 · 村濑 (captain) | 143/144 | 99.3% |
| 田守义 (tian) | 军犬 (dog)、宪兵分队长 · 柏木 (kcap)、军犬 (dog) | 141/143 | 98.6% |
| 田守义 (tian) | 宪兵队特高课长·桐野 (kirino) | 131/132 | 99.2% |
| 田守义 (tian) | 便衣特务 (spy)、关东军情报部少佐·久我 (kuga) | 146/149 | 98.0% |
| 田守义 (tian) | 随军神官·鹫尾 (priest) | 277/277 | 100.0% |
| 田守义 (tian) | 关东军参谋·大槻中佐 (staff) | 2/2 | 100.0% |
| 赵铁山 (zhao) | 日军步兵 (inf)、讨伐队长 · 村濑 (captain) | 145/148 | 98.0% |
| 赵铁山 (zhao) | 军犬 (dog)、宪兵分队长 · 柏木 (kcap)、军犬 (dog) | 141/141 | 100.0% |
| 赵铁山 (zhao) | 宪兵队特高课长·桐野 (kirino) | 134/134 | 100.0% |
| 赵铁山 (zhao) | 便衣特务 (spy)、关东军情报部少佐·久我 (kuga) | 150/150 | 100.0% |
| 赵铁山 (zhao) | 随军神官·鹫尾 (priest) | 284/284 | 100.0% |
| 赵铁山 (zhao) | 关东军参谋·大槻中佐 (staff) | 0/0 | — |
| 沈知秋 (shen) | 日军步兵 (inf)、讨伐队长 · 村濑 (captain) | 142/145 | 97.9% |
| 沈知秋 (shen) | 军犬 (dog)、宪兵分队长 · 柏木 (kcap)、军犬 (dog) | 137/137 | 100.0% |
| 沈知秋 (shen) | 宪兵队特高课长·桐野 (kirino) | 121/126 | 96.0% |
| 沈知秋 (shen) | 便衣特务 (spy)、关东军情报部少佐·久我 (kuga) | 151/153 | 98.7% |
| 沈知秋 (shen) | 随军神官·鹫尾 (priest) | 272/272 | 100.0% |
| 沈知秋 (shen) | 关东军参谋·大槻中佐 (staff) | 0/0 | — |

| 角色 | 第一章首领后生命 | 第二章首领后生命 | 第三章首领后生命 |
|---|---:|---:|---:|
| hansong | 35.5 | 39.0 | 68.7 |
| chenmo | 34.8 | 45.5 | 65.6 |
| tian | 49.1 | 55.6 | 82.6 |
| zhao | 55.1 | 71.9 | 77.4 |
| shen | 43.0 | 52.7 | 65.8 |

## 每个角色最常失败的八场（含超时）

| 角色 | 场次 | 局数 |
|---|---|---:|
| hansong | 1:elite加强:inf+sergeant+inf | 25 |
| hansong | 1:boss:inf+captain | 10 |
| hansong | 1:elite加强:inf+hmg | 10 |
| hansong | 1:elite:inf+hmg | 7 |
| hansong | 1:elite加强:puppet+pcap+puppet | 6 |
| hansong | 2:fight:kempei+kempei+dog | 3 |
| hansong | 1:elite:inf+sergeant+inf | 3 |
| hansong | 2:boss:spy+kuga | 3 |
| chenmo | 1:elite加强:inf+sergeant+inf | 26 |
| chenmo | 1:elite加强:inf+hmg | 7 |
| chenmo | 1:elite:inf+sergeant+inf | 6 |
| chenmo | 1:elite:inf+hmg | 4 |
| chenmo | 1:boss:dog+kcap+dog | 2 |
| chenmo | 2:boss:spy+kuga | 2 |
| chenmo | 1:elite加强:puppet+pcap+puppet | 2 |
| chenmo | 1:elite:puppet+pcap+puppet | 1 |
| tian | 1:elite:inf+sergeant+inf | 4 |
| tian | 2:boss:spy+kuga | 3 |
| tian | 1:boss:dog+kcap+dog | 2 |
| tian | 1:elite:gun+inf | 2 |
| tian | 1:elite加强:inf+sergeant+inf | 2 |
| tian | 2:elite:kendo+patrol | 1 |
| tian | 1:elite:inf+hmg | 1 |
| tian | 2:fight:spy+spy+patrol | 1 |
| zhao | 1:elite加强:inf+sergeant+inf | 6 |
| zhao | 1:elite:inf+sergeant+inf | 4 |
| zhao | 1:boss:inf+captain | 3 |
| zhao | 2:elite:kensei+merchant+patrol | 1 |
| zhao | 1:elite:gun+medic | 1 |
| zhao | 2:elite加强:kensei+merchant+patrol | 1 |
| shen | 2:boss:kirino | 5 |
| shen | 1:elite加强:inf+sergeant+inf | 5 |
| shen | 1:elite:inf+hmg | 3 |
| shen | 1:boss:inf+captain | 3 |
| shen | 1:elite加强:inf+hmg | 2 |
| shen | 1:fight:cav+puppet+puppet | 2 |
| shen | 1:elite:inf+sergeant+inf | 2 |
| shen | 2:boss:spy+kuga | 2 |

## 程序报错清单

完整堆栈、敌人、手牌、牌组和走过的路线保存在对应 JSON 中。重放：`SEED=种子 node tools/bot/sim.mjs 1 角色`（训练候选需同时设置其 WEIGHTS）。

| 角色 | 方案 | 种子 | 阶段 | 卡牌/按钮/用品 | 敌人 | 牌组 | 错误 |
|---|---|---:|---|---|---|---|---|
| — | — | — | 无程序报错 | — | — | — | — |

## 复现信息

| 角色 | 源提交 | 起始种子 | 局数 |
|---|---|---:|---:|
| hansong | 84310945980a080d1b214692418d09ab13c093df | 2000001 | 300 |
| chenmo | 84310945980a080d1b214692418d09ab13c093df | 2000001 | 300 |
| tian | 84310945980a080d1b214692418d09ab13c093df | 2000001 | 300 |
| zhao | 84310945980a080d1b214692418d09ab13c093df | 2000001 | 300 |
| shen | 84310945980a080d1b214692418d09ab13c093df | 2000001 | 300 |
