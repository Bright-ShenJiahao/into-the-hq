# 机器人平衡测试报告

生成时间：2026-11-21T18:20:33.929Z

三章通关率和真结局胜率以全部开局数为分母；首领胜率以实际进入该场战斗的次数为分母。生命为三章通关且最终存活局的平均值；无样本显示「—」。超时为任一战斗 60 回合未结束。程序报错局单独列出，不能视为正常死亡。

路线使用实际地图拓扑与节点权重，机器人只走可达边，优先寻找加强精英；隐藏地图时随机选路。事件简化为等概率回血 8、口粮 2、选牌或随身物品，其余奖励与游戏规则对齐。这是机器人策略下的平衡测试，不代表玩家真实胜率。

| 角色 | 局数 | 第一章 | 第二章 | 第三章 | 真结局胜率 | 真结局胜/挑战 | 通关剩余生命 | 超时局数 | 报错局数 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| hansong | 300 | 54.0% | 38.7% | 38.0% | 35.3% | 106/108 | 51.0 | 0 | 0 |
| chenmo | 300 | 70.0% | 66.0% | 60.7% | 4.0% | 12/12 | 64.2 | 15 | 0 |
| tian | 300 | 92.3% | 89.3% | 83.3% | 0.0% | 0/0 | 82.0 | 18 | 0 |
| zhao | 300 | 96.3% | 96.0% | 87.7% | 1.0% | 3/3 | 77.1 | 25 | 0 |
| shen | 300 | 80.0% | 76.3% | 66.0% | 0.0% | 0/0 | 67.9 | 37 | 0 |

## 首领胜率及各章通关生命

| 角色 | 首领 | 胜/挑战 | 胜率 |
|---|---|---:|---:|
| 韩松 (hansong) | 日军步兵 (inf)、讨伐队长 · 村濑 (captain) | 68/100 | 68.0% |
| 韩松 (hansong) | 军犬 (dog)、宪兵分队长 · 柏木 (kcap)、军犬 (dog) | 94/101 | 93.1% |
| 韩松 (hansong) | 宪兵队特高课长·桐野 (kirino) | 61/65 | 93.8% |
| 韩松 (hansong) | 便衣特务 (spy)、关东军情报部少佐·久我 (kuga) | 55/66 | 83.3% |
| 韩松 (hansong) | 随军神官·鹫尾 (priest) | 114/116 | 98.3% |
| 韩松 (hansong) | 关东军参谋·大槻中佐 (staff) | 106/108 | 98.1% |
| 陈默 (chenmo) | 日军步兵 (inf)、讨伐队长 · 村濑 (captain) | 102/119 | 85.7% |
| 陈默 (chenmo) | 军犬 (dog)、宪兵分队长 · 柏木 (kcap)、军犬 (dog) | 108/115 | 93.9% |
| 陈默 (chenmo) | 宪兵队特高课长·桐野 (kirino) | 96/98 | 98.0% |
| 陈默 (chenmo) | 便衣特务 (spy)、关东军情报部少佐·久我 (kuga) | 102/102 | 100.0% |
| 陈默 (chenmo) | 随军神官·鹫尾 (priest) | 182/197 | 92.4% |
| 陈默 (chenmo) | 关东军参谋·大槻中佐 (staff) | 12/12 | 100.0% |
| 田守义 (tian) | 日军步兵 (inf)、讨伐队长 · 村濑 (captain) | 141/145 | 97.2% |
| 田守义 (tian) | 军犬 (dog)、宪兵分队长 · 柏木 (kcap)、军犬 (dog) | 136/136 | 100.0% |
| 田守义 (tian) | 宪兵队特高课长·桐野 (kirino) | 126/126 | 100.0% |
| 田守义 (tian) | 便衣特务 (spy)、关东军情报部少佐·久我 (kuga) | 142/146 | 97.3% |
| 田守义 (tian) | 随军神官·鹫尾 (priest) | 250/268 | 93.3% |
| 田守义 (tian) | 关东军参谋·大槻中佐 (staff) | 0/0 | — |
| 赵铁山 (zhao) | 日军步兵 (inf)、讨伐队长 · 村濑 (captain) | 147/148 | 99.3% |
| 赵铁山 (zhao) | 军犬 (dog)、宪兵分队长 · 柏木 (kcap)、军犬 (dog) | 142/142 | 100.0% |
| 赵铁山 (zhao) | 宪兵队特高课长·桐野 (kirino) | 129/129 | 100.0% |
| 赵铁山 (zhao) | 便衣特务 (spy)、关东军情报部少佐·久我 (kuga) | 159/159 | 100.0% |
| 赵铁山 (zhao) | 随军神官·鹫尾 (priest) | 263/288 | 91.3% |
| 赵铁山 (zhao) | 关东军参谋·大槻中佐 (staff) | 3/3 | 100.0% |
| 沈知秋 (shen) | 日军步兵 (inf)、讨伐队长 · 村濑 (captain) | 122/126 | 96.8% |
| 沈知秋 (shen) | 军犬 (dog)、宪兵分队长 · 柏木 (kcap)、军犬 (dog) | 118/123 | 95.9% |
| 沈知秋 (shen) | 宪兵队特高课长·桐野 (kirino) | 110/111 | 99.1% |
| 沈知秋 (shen) | 便衣特务 (spy)、关东军情报部少佐·久我 (kuga) | 119/123 | 96.7% |
| 沈知秋 (shen) | 随军神官·鹫尾 (priest) | 198/229 | 86.5% |
| 沈知秋 (shen) | 关东军参谋·大槻中佐 (staff) | 0/0 | — |

| 角色 | 第一章首领后生命 | 第二章首领后生命 | 第三章首领后生命 |
|---|---:|---:|---:|
| hansong | 32.5 | 33.7 | 65.0 |
| chenmo | 31.0 | 45.3 | 64.5 |
| tian | 47.2 | 56.7 | 82.0 |
| zhao | 55.0 | 70.5 | 77.2 |
| shen | 48.5 | 60.0 | 67.9 |

## 每个角色最常失败的八场（含超时）

| 角色 | 场次 | 局数 |
|---|---|---:|
| hansong | 1:boss:inf+captain | 32 |
| hansong | 1:elite加强:inf+hmg | 31 |
| hansong | 1:elite加强:inf+sergeant+inf | 29 |
| hansong | 2:boss:spy+kuga | 11 |
| hansong | 1:elite:inf+hmg | 9 |
| hansong | 1:elite:inf+sergeant+inf | 8 |
| hansong | 2:elite加强:kensei+merchant+patrol | 8 |
| hansong | 1:boss:dog+kcap+dog | 7 |
| chenmo | 1:elite加强:inf+sergeant+inf | 32 |
| chenmo | 1:boss:inf+captain | 17 |
| chenmo | 3:boss:priest | 15 |
| chenmo | 1:elite加强:inf+hmg | 11 |
| chenmo | 1:boss:dog+kcap+dog | 7 |
| chenmo | 1:elite:inf+sergeant+inf | 6 |
| chenmo | 1:elite:inf+hmg | 5 |
| chenmo | 1:elite加强:puppet+pcap+puppet | 4 |
| tian | 3:boss:priest | 18 |
| tian | 1:elite加强:inf+sergeant+inf | 5 |
| tian | 1:boss:inf+captain | 4 |
| tian | 2:boss:spy+kuga | 4 |
| tian | 1:elite:inf+sergeant+inf | 4 |
| tian | 2:fight:kempei+jpcop+bureaucrat+patrol | 2 |
| tian | 1:elite:inf+hmg | 2 |
| tian | 1:fight:sniper+puppet+puppet | 2 |
| zhao | 3:boss:priest | 25 |
| zhao | 1:elite加强:inf+sergeant+inf | 7 |
| zhao | 1:elite:inf+sergeant+inf | 3 |
| zhao | 1:boss:inf+captain | 1 |
| zhao | 2:elite加强:kensei+merchant+patrol | 1 |
| shen | 3:boss:priest | 31 |
| shen | 1:elite加强:inf+sergeant+inf | 27 |
| shen | 1:elite加强:inf+hmg | 6 |
| shen | 1:elite:inf+sergeant+inf | 5 |
| shen | 1:boss:dog+kcap+dog | 5 |
| shen | 2:boss:spy+kuga | 4 |
| shen | 1:boss:inf+captain | 4 |
| shen | 1:elite加强:puppet+pcap+puppet | 4 |

## 程序报错清单

完整堆栈、敌人、手牌、牌组和走过的路线保存在对应 JSON 中。重放：`SEED=种子 node tools/bot/sim.mjs 1 角色`（训练候选需同时设置其 WEIGHTS）。

| 角色 | 方案 | 种子 | 阶段 | 卡牌/按钮/用品 | 敌人 | 牌组 | 错误 |
|---|---|---:|---|---|---|---|---|
| — | — | — | 无程序报错 | — | — | — | — |

## 复现信息

| 角色 | 源提交 | 起始种子 | 局数 |
|---|---|---:|---:|
| hansong | cb6d49420c86f18e53da77d03fe05833968d7df7 | 2000001 | 300 |
| chenmo | cb6d49420c86f18e53da77d03fe05833968d7df7 | 2000001 | 300 |
| tian | cb6d49420c86f18e53da77d03fe05833968d7df7 | 2000001 | 300 |
| zhao | cb6d49420c86f18e53da77d03fe05833968d7df7 | 2000001 | 300 |
| shen | cb6d49420c86f18e53da77d03fe05833968d7df7 | 2000001 | 300 |
