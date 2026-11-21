# 机器人强化训练报告

生成时间：2026-11-21T18:06:48.537Z

三章通关率和真结局胜率以全部开局数为分母；首领胜率以实际进入该场战斗的次数为分母。生命为三章通关且最终存活局的平均值；无样本显示「—」。超时为任一战斗 60 回合未结束。程序报错局单独列出，不能视为正常死亡。

路线使用实际地图拓扑与节点权重，机器人只走可达边，优先寻找加强精英；隐藏地图时随机选路。事件简化为等概率回血 8、口粮 2、选牌或随身物品，其余奖励与游戏规则对齐。这是机器人策略下的平衡测试，不代表玩家真实胜率。

搜索采用对称采样、前 1/4 对数加权与 sigma 每代 ×0.97。最终三种方案统一评估种子 777—1776（各 1000 局）；同分或训练退步时保留原权重。

| 角色 | 原权重评分 | 平均权重评分 | 训练最佳评分 | 最终采用 | 代数 |
|---|---:|---:|---:|---|---:|
| hansong | 0.1198 | 0.4520 | 0.4506 | 平均权重 | 394 |
| chenmo | 0.1974 | 0.5168 | 0.5168 | 平均权重 | 404 |
| tian | 0.4426 | 0.6960 | 0.6902 | 平均权重 | 240 |
| zhao | 0.2126 | 0.6976 | 0.7034 | 训练最佳 | 324 |
| shen | 0.3746 | 0.5760 | 0.5792 | 训练最佳 | 283 |

评分 =（第一章 + 第二章 + 2×第三章通关率 + 真结局胜率）÷5 − 程序报错比例。

| 角色 | 局数 | 第一章 | 第二章 | 第三章 | 真结局胜率 | 真结局胜/挑战 | 通关剩余生命 | 超时局数 | 报错局数 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| hansong | 1000 | 59.0% | 43.9% | 42.7% | 37.7% | 377/377 | 51.9 | 3 | 0 |
| chenmo | 1000 | 69.4% | 64.9% | 59.7% | 4.7% | 47/47 | 64.4 | 48 | 0 |
| tian | 1000 | 92.2% | 89.3% | 82.9% | 0.7% | 7/7 | 81.9 | 64 | 0 |
| zhao | 1000 | 94.1% | 93.5% | 81.4% | 1.3% | 13/13 | 77.2 | 121 | 0 |
| shen | 1000 | 79.9% | 75.0% | 66.9% | 0.9% | 9/9 | 67.8 | 116 | 0 |

## 首领胜率及各章通关生命

| 角色 | 首领 | 胜/挑战 | 胜率 |
|---|---|---:|---:|
| 韩松 (hansong) | 日军步兵 (inf)、讨伐队长 · 村濑 (captain) | 245/322 | 76.1% |
| 韩松 (hansong) | 军犬 (dog)、宪兵分队长 · 柏木 (kcap)、军犬 (dog) | 345/359 | 96.1% |
| 韩松 (hansong) | 宪兵队特高课长·桐野 (kirino) | 207/218 | 95.0% |
| 韩松 (hansong) | 便衣特务 (spy)、关东军情报部少佐·久我 (kuga) | 232/250 | 92.8% |
| 韩松 (hansong) | 随军神官·鹫尾 (priest) | 427/437 | 97.7% |
| 韩松 (hansong) | 关东军参谋·大槻中佐 (staff) | 377/377 | 100.0% |
| 陈默 (chenmo) | 日军步兵 (inf)、讨伐队长 · 村濑 (captain) | 312/351 | 88.9% |
| 陈默 (chenmo) | 军犬 (dog)、宪兵分队长 · 柏木 (kcap)、军犬 (dog) | 382/406 | 94.1% |
| 陈默 (chenmo) | 宪兵队特高课长·桐野 (kirino) | 308/309 | 99.7% |
| 陈默 (chenmo) | 便衣特务 (spy)、关东军情报部少佐·久我 (kuga) | 341/344 | 99.1% |
| 陈默 (chenmo) | 随军神官·鹫尾 (priest) | 597/649 | 92.0% |
| 陈默 (chenmo) | 关东军参谋·大槻中佐 (staff) | 47/47 | 100.0% |
| 田守义 (tian) | 日军步兵 (inf)、讨伐队长 · 村濑 (captain) | 440/445 | 98.9% |
| 田守义 (tian) | 军犬 (dog)、宪兵分队长 · 柏木 (kcap)、军犬 (dog) | 482/489 | 98.6% |
| 田守义 (tian) | 宪兵队特高课长·桐野 (kirino) | 460/462 | 99.6% |
| 田守义 (tian) | 便衣特务 (spy)、关东军情报部少佐·久我 (kuga) | 433/447 | 96.9% |
| 田守义 (tian) | 随军神官·鹫尾 (priest) | 829/893 | 92.8% |
| 田守义 (tian) | 关东军参谋·大槻中佐 (staff) | 7/7 | 100.0% |
| 赵铁山 (zhao) | 日军步兵 (inf)、讨伐队长 · 村濑 (captain) | 442/449 | 98.4% |
| 赵铁山 (zhao) | 军犬 (dog)、宪兵分队长 · 柏木 (kcap)、军犬 (dog) | 499/502 | 99.4% |
| 赵铁山 (zhao) | 宪兵队特高课长·桐野 (kirino) | 466/466 | 100.0% |
| 赵铁山 (zhao) | 便衣特务 (spy)、关东军情报部少佐·久我 (kuga) | 469/469 | 100.0% |
| 赵铁山 (zhao) | 随军神官·鹫尾 (priest) | 814/935 | 87.1% |
| 赵铁山 (zhao) | 关东军参谋·大槻中佐 (staff) | 13/13 | 100.0% |
| 沈知秋 (shen) | 日军步兵 (inf)、讨伐队长 · 村濑 (captain) | 379/389 | 97.4% |
| 沈知秋 (shen) | 军犬 (dog)、宪兵分队长 · 柏木 (kcap)、军犬 (dog) | 420/430 | 97.7% |
| 沈知秋 (shen) | 宪兵队特高课长·桐野 (kirino) | 352/363 | 97.0% |
| 沈知秋 (shen) | 便衣特务 (spy)、关东军情报部少佐·久我 (kuga) | 398/424 | 93.9% |
| 沈知秋 (shen) | 随军神官·鹫尾 (priest) | 669/750 | 89.2% |
| 沈知秋 (shen) | 关东军参谋·大槻中佐 (staff) | 9/9 | 100.0% |

| 角色 | 第一章首领后生命 | 第二章首领后生命 | 第三章首领后生命 |
|---|---:|---:|---:|
| hansong | 29.8 | 33.6 | 65.7 |
| chenmo | 30.9 | 45.7 | 64.7 |
| tian | 47.0 | 56.7 | 81.9 |
| zhao | 54.8 | 69.9 | 77.3 |
| shen | 48.0 | 60.1 | 67.8 |

## 每个角色最常失败的八场（含超时）

| 角色 | 场次 | 局数 |
|---|---|---:|
| hansong | 1:elite加强:inf+hmg | 100 |
| hansong | 1:elite加强:inf+sergeant+inf | 98 |
| hansong | 1:boss:inf+captain | 77 |
| hansong | 1:elite:inf+hmg | 24 |
| hansong | 1:elite加强:puppet+pcap+puppet | 23 |
| hansong | 2:elite加强:patrol+kendo+patrol | 19 |
| hansong | 1:elite:inf+sergeant+inf | 18 |
| hansong | 2:boss:spy+kuga | 18 |
| chenmo | 1:elite加强:inf+sergeant+inf | 125 |
| chenmo | 1:elite加强:inf+hmg | 52 |
| chenmo | 3:boss:priest | 52 |
| chenmo | 1:boss:inf+captain | 39 |
| chenmo | 1:boss:dog+kcap+dog | 24 |
| chenmo | 1:elite:inf+hmg | 13 |
| chenmo | 1:elite加强:puppet+pcap+puppet | 12 |
| chenmo | 1:elite:inf+sergeant+inf | 9 |
| tian | 3:boss:priest | 64 |
| tian | 1:elite加强:inf+sergeant+inf | 26 |
| tian | 2:boss:spy+kuga | 14 |
| tian | 1:elite:inf+sergeant+inf | 12 |
| tian | 1:boss:dog+kcap+dog | 7 |
| tian | 1:boss:inf+captain | 5 |
| tian | 1:elite加强:inf+hmg | 4 |
| tian | 1:fight:cav+puppet+puppet | 4 |
| zhao | 3:boss:priest | 121 |
| zhao | 1:elite加强:inf+sergeant+inf | 31 |
| zhao | 1:elite:inf+sergeant+inf | 11 |
| zhao | 1:boss:inf+captain | 7 |
| zhao | 1:boss:dog+kcap+dog | 3 |
| zhao | 2:elite:patrol+kendo+patrol+patrol | 3 |
| zhao | 1:elite:inf+hmg | 2 |
| zhao | 1:elite:puppet+pcap+puppet | 1 |
| shen | 1:elite加强:inf+sergeant+inf | 86 |
| shen | 3:boss:priest | 81 |
| shen | 1:elite加强:inf+hmg | 33 |
| shen | 2:boss:spy+kuga | 26 |
| shen | 1:elite加强:puppet+pcap+puppet | 17 |
| shen | 1:elite:inf+sergeant+inf | 15 |
| shen | 2:boss:kirino | 11 |
| shen | 1:boss:inf+captain | 10 |

## 程序报错清单

完整堆栈、敌人、手牌、牌组和走过的路线保存在对应 JSON 中。重放：`SEED=种子 node tools/bot/sim.mjs 1 角色`（训练候选需同时设置其 WEIGHTS）。

| 角色 | 方案 | 种子 | 阶段 | 卡牌/按钮/用品 | 敌人 | 牌组 | 错误 |
|---|---|---:|---|---|---|---|---|
| — | — | — | 无程序报错 | — | — | — | — |

## 复现信息

| 角色 | 源提交 | 起始种子 | 局数 |
|---|---|---:|---:|
| hansong | fc55a7410586f49991b1e6c844cecbbffc845fa7 | 777 | 1000 |
| chenmo | fc55a7410586f49991b1e6c844cecbbffc845fa7 | 777 | 1000 |
| tian | fc55a7410586f49991b1e6c844cecbbffc845fa7 | 777 | 1000 |
| zhao | fc55a7410586f49991b1e6c844cecbbffc845fa7 | 777 | 1000 |
| shen | fc55a7410586f49991b1e6c844cecbbffc845fa7 | 777 | 1000 |
