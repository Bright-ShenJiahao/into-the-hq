# 机器人强化训练报告

生成时间：2026-11-22T12:23:09.548Z

三章通关率和真结局胜率以全部开局数为分母；首领胜率以实际进入该场战斗的次数为分母。生命为三章通关且最终存活局的平均值；无样本显示「—」。超时为任一战斗 60 回合未结束。程序报错局单独列出，不能视为正常死亡。

路线使用实际地图拓扑与节点权重，机器人只走可达边，优先寻找加强精英；隐藏地图时随机选路。事件简化为等概率回血 8、口粮 2、选牌或随身物品，其余奖励与游戏规则对齐。这是机器人策略下的平衡测试，不代表玩家真实胜率。

搜索采用对称采样、前 1/4 对数加权与 sigma 每代 ×0.97。最终三种方案统一评估种子 777—1776（各 1000 局）；同分或训练退步时保留原权重。

| 角色 | 原权重评分 | 平均权重评分 | 训练最佳评分 | 最终采用 | 代数 |
|---|---:|---:|---:|---|---:|
| hansong | 0.5032 | 0.6560 | 0.6560 | 平均权重 | 450 |
| chenmo | 0.5386 | 0.6570 | 0.6570 | 平均权重 | 263 |
| tian | 0.7206 | 0.7348 | 0.7346 | 平均权重 | 228 |
| zhao | 0.7424 | 0.7366 | 0.7528 | 训练最佳 | 302 |
| shen | 0.6118 | 0.7162 | 0.7304 | 训练最佳 | 186 |

评分 =（第一章 + 第二章 + 2×第三章通关率 + 真结局胜率）÷5 − 程序报错比例。

| 角色 | 局数 | 第一章 | 第二章 | 第三章 | 真结局胜率 | 真结局胜/挑战 | 通关剩余生命 | 超时局数 | 报错局数 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| hansong | 1000 | 72.7% | 65.7% | 65.7% | 58.2% | 582/588 | 44.7 | 0 | 0 |
| chenmo | 1000 | 78.6% | 77.3% | 77.3% | 18.0% | 180/180 | 62.8 | 0 | 0 |
| tian | 1000 | 93.2% | 91.1% | 91.1% | 0.9% | 9/9 | 82.4 | 0 | 0 |
| zhao | 1000 | 94.5% | 93.9% | 93.9% | 0.2% | 2/2 | 77.4 | 0 | 0 |
| shen | 1000 | 93.5% | 90.4% | 90.4% | 0.5% | 5/5 | 66.1 | 23 | 0 |

## 首领胜率及各章通关生命

| 角色 | 首领 | 胜/挑战 | 胜率 |
|---|---|---:|---:|
| 韩松 (hansong) | 日军步兵 (inf)、讨伐队长 · 村濑 (captain) | 326/361 | 90.3% |
| 韩松 (hansong) | 军犬 (dog)、宪兵分队长 · 柏木 (kcap)、军犬 (dog) | 401/408 | 98.3% |
| 韩松 (hansong) | 宪兵队特高课长·桐野 (kirino) | 313/316 | 99.1% |
| 韩松 (hansong) | 便衣特务 (spy)、关东军情报部少佐·久我 (kuga) | 344/362 | 95.0% |
| 韩松 (hansong) | 随军神官·鹫尾 (priest) | 657/657 | 100.0% |
| 韩松 (hansong) | 关东军参谋·大槻中佐 (staff) | 582/588 | 99.0% |
| 陈默 (chenmo) | 日军步兵 (inf)、讨伐队长 · 村濑 (captain) | 369/384 | 96.1% |
| 陈默 (chenmo) | 军犬 (dog)、宪兵分队长 · 柏木 (kcap)、军犬 (dog) | 417/428 | 97.4% |
| 陈默 (chenmo) | 宪兵队特高课长·桐野 (kirino) | 368/368 | 100.0% |
| 陈默 (chenmo) | 便衣特务 (spy)、关东军情报部少佐·久我 (kuga) | 405/407 | 99.5% |
| 陈默 (chenmo) | 随军神官·鹫尾 (priest) | 773/773 | 100.0% |
| 陈默 (chenmo) | 关东军参谋·大槻中佐 (staff) | 180/180 | 100.0% |
| 田守义 (tian) | 日军步兵 (inf)、讨伐队长 · 村濑 (captain) | 440/447 | 98.4% |
| 田守义 (tian) | 军犬 (dog)、宪兵分队长 · 柏木 (kcap)、军犬 (dog) | 492/495 | 99.4% |
| 田守义 (tian) | 宪兵队特高课长·桐野 (kirino) | 467/467 | 100.0% |
| 田守义 (tian) | 便衣特务 (spy)、关东军情报部少佐·久我 (kuga) | 444/457 | 97.2% |
| 田守义 (tian) | 随军神官·鹫尾 (priest) | 911/911 | 100.0% |
| 田守义 (tian) | 关东军参谋·大槻中佐 (staff) | 9/9 | 100.0% |
| 赵铁山 (zhao) | 日军步兵 (inf)、讨伐队长 · 村濑 (captain) | 439/452 | 97.1% |
| 赵铁山 (zhao) | 军犬 (dog)、宪兵分队长 · 柏木 (kcap)、军犬 (dog) | 506/508 | 99.6% |
| 赵铁山 (zhao) | 宪兵队特高课长·桐野 (kirino) | 475/475 | 100.0% |
| 赵铁山 (zhao) | 便衣特务 (spy)、关东军情报部少佐·久我 (kuga) | 464/464 | 100.0% |
| 赵铁山 (zhao) | 随军神官·鹫尾 (priest) | 939/939 | 100.0% |
| 赵铁山 (zhao) | 关东军参谋·大槻中佐 (staff) | 2/2 | 100.0% |
| 沈知秋 (shen) | 日军步兵 (inf)、讨伐队长 · 村濑 (captain) | 431/445 | 96.9% |
| 沈知秋 (shen) | 军犬 (dog)、宪兵分队长 · 柏木 (kcap)、军犬 (dog) | 504/510 | 98.8% |
| 沈知秋 (shen) | 宪兵队特高课长·桐野 (kirino) | 465/472 | 98.5% |
| 沈知秋 (shen) | 便衣特务 (spy)、关东军情报部少佐·久我 (kuga) | 439/457 | 96.1% |
| 沈知秋 (shen) | 随军神官·鹫尾 (priest) | 904/904 | 100.0% |
| 沈知秋 (shen) | 关东军参谋·大槻中佐 (staff) | 5/5 | 100.0% |

| 角色 | 第一章首领后生命 | 第二章首领后生命 | 第三章首领后生命 |
|---|---:|---:|---:|
| hansong | 37.0 | 40.5 | 68.6 |
| chenmo | 35.2 | 43.9 | 65.6 |
| tian | 49.2 | 56.1 | 82.5 |
| zhao | 55.3 | 71.3 | 77.4 |
| shen | 41.1 | 52.1 | 66.1 |

## 每个角色最常失败的八场（含超时）

| 角色 | 场次 | 局数 |
|---|---|---:|
| hansong | 1:elite加强:inf+sergeant+inf | 82 |
| hansong | 1:elite加强:inf+hmg | 66 |
| hansong | 1:boss:inf+captain | 35 |
| hansong | 1:elite:inf+hmg | 20 |
| hansong | 2:boss:spy+kuga | 18 |
| hansong | 2:elite加强:patrol+kendo+patrol | 18 |
| hansong | 1:elite加强:puppet+pcap+puppet | 13 |
| hansong | 1:boss:dog+kcap+dog | 7 |
| chenmo | 1:elite加强:inf+sergeant+inf | 105 |
| chenmo | 1:elite加强:inf+hmg | 22 |
| chenmo | 1:elite:inf+sergeant+inf | 15 |
| chenmo | 1:boss:inf+captain | 15 |
| chenmo | 1:boss:dog+kcap+dog | 11 |
| chenmo | 1:elite:inf+hmg | 10 |
| chenmo | 1:elite加强:puppet+pcap+puppet | 7 |
| chenmo | 1:fight:inf+mortar+puppet | 5 |
| tian | 1:elite加强:inf+sergeant+inf | 22 |
| tian | 2:boss:spy+kuga | 13 |
| tian | 1:elite:inf+sergeant+inf | 13 |
| tian | 1:boss:inf+captain | 7 |
| tian | 1:elite加强:puppet+pcap+puppet | 4 |
| tian | 1:elite:puppet+pcap+puppet | 3 |
| tian | 1:boss:dog+kcap+dog | 3 |
| tian | 1:elite加强:inf+hmg | 2 |
| zhao | 1:elite加强:inf+sergeant+inf | 21 |
| zhao | 1:boss:inf+captain | 13 |
| zhao | 1:elite:inf+sergeant+inf | 13 |
| zhao | 2:fight:kempei+kempei+dog | 3 |
| zhao | 1:boss:dog+kcap+dog | 2 |
| zhao | 1:fight:mortar+dog+dog | 1 |
| zhao | 1:elite加强:gun+inf | 1 |
| zhao | 1:elite:inf+hmg | 1 |
| shen | 2:boss:spy+kuga | 18 |
| shen | 1:boss:inf+captain | 14 |
| shen | 1:elite:inf+sergeant+inf | 12 |
| shen | 1:elite加强:inf+sergeant+inf | 11 |
| shen | 1:elite:inf+hmg | 7 |
| shen | 1:elite加强:inf+hmg | 7 |
| shen | 2:boss:kirino | 7 |
| shen | 1:boss:dog+kcap+dog | 6 |

## 程序报错清单

完整堆栈、敌人、手牌、牌组和走过的路线保存在对应 JSON 中。重放：`SEED=种子 node tools/bot/sim.mjs 1 角色`（训练候选需同时设置其 WEIGHTS）。

| 角色 | 方案 | 种子 | 阶段 | 卡牌/按钮/用品 | 敌人 | 牌组 | 错误 |
|---|---|---:|---|---|---|---|---|
| — | — | — | 无程序报错 | — | — | — | — |

## 复现信息

| 角色 | 源提交 | 起始种子 | 局数 |
|---|---|---:|---:|
| hansong | 1ecc928e012fa9caf972c83e6938c353f304ef41 | 777 | 1000 |
| chenmo | 1ecc928e012fa9caf972c83e6938c353f304ef41 | 777 | 1000 |
| tian | 1ecc928e012fa9caf972c83e6938c353f304ef41 | 777 | 1000 |
| zhao | 1ecc928e012fa9caf972c83e6938c353f304ef41 | 777 | 1000 |
| shen | 1ecc928e012fa9caf972c83e6938c353f304ef41 | 777 | 1000 |
