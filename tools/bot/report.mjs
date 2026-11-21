// 汇总并行产物；报告表中的胜率分母在文首明确说明。
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, CHARACTERS, W } from './sim.mjs';
import { CHARS, CHAPTERS, ENEMIES } from '../../src/data.js';
const [mode, directory = 'parts'] = process.argv.slice(2);
if (!['train', 'balance'].includes(mode)) throw new Error('用法：node tools/bot/report.mjs train|balance [产物目录]');
const pct = n => `${(n * 100).toFixed(1)}%`;
const num = n => n == null ? '—' : n.toFixed(1);
const esc = x => String(x ?? '—').replaceAll('|', '\\|').replaceAll('\n', '<br>');
const charName = id => `${CHARS[id].name} (${id})`;
const encounterName = id => id.split('+').map(k => `${ENEMIES[k]?.name || k} (${k})`).join('、');
let md = `# ${mode === 'train' ? '机器人强化训练报告' : '机器人平衡测试报告'}\n\n生成时间：${new Date().toISOString()}\n\n`;
md += '三章通关率和真结局胜率以全部开局数为分母；首领胜率以实际进入该场战斗的次数为分母。生命为三章通关且最终存活局的平均值；无样本显示「—」。超时为任一战斗 60 回合未结束。程序报错局单独列出，不能视为正常死亡。\n\n';
md += '路线使用实际地图拓扑与节点权重，机器人只走可达边，优先寻找加强精英；隐藏地图时随机选路。事件简化为等概率回血 8、口粮 2、选牌或随身物品，其余奖励与游戏规则对齐。这是机器人策略下的平衡测试，不代表玩家真实胜率。\n\n';
const reports = CHARACTERS.map(char => {
  const filename = `bot_${mode}_${char}.json`, r = JSON.parse(fs.readFileSync(path.join(directory, filename), 'utf8'));
  if ((r.char !== char) || (mode === 'balance' ? r.n !== 300 : !r.weights || r.after.n !== 1000)) throw new Error(`产物不完整：${filename}`);
  fs.mkdirSync(path.join(ROOT, 'data'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'data', filename), JSON.stringify(r, null, 2) + '\n');
  return r;
});
if (new Set(reports.map(r => r.source)).size !== 1) throw new Error('五个角色并非来自同一份源提交，不能合并');
if (mode === 'train') {
  const filename = path.join(ROOT, 'tools/bot/weights.json');
  const weights = JSON.parse(fs.readFileSync(filename, 'utf8'));
  md += '搜索采用对称采样、前 1/4 对数加权与 sigma 每代 ×0.97。最终三种方案统一评估种子 777—1776（各 1000 局）；同分或训练退步时保留原权重。\n\n';
  md += '| 角色 | 原权重评分 | 平均权重评分 | 训练最佳评分 | 最终采用 | 代数 |\n|---|---:|---:|---:|---|---:|\n';
  for (const r of reports) {
    if (r.after.errors.length || r.after.score < r.before.score) throw new Error(`${r.char} 的训练结果未通过保留原权重门禁`);
    for (const k of Object.keys(W)) if (!Number.isFinite(r.weights[k])) throw new Error(`权重无效：${r.char}.${k}`);
    weights[r.char] = r.weights;
    md += `| ${r.char} | ${r.before.score.toFixed(4)} | ${r.mean.score.toFixed(4)} | ${r.best.score.toFixed(4)} | ${{ original: '原权重', mean: '平均权重', best: '训练最佳' }[r.selected]} | ${r.generations} |\n`;
  }
  fs.writeFileSync(filename, JSON.stringify(weights, null, 2) + '\n');
  md += '\n评分 =（第一章 + 第二章 + 2×第三章通关率 + 真结局胜率）÷5 − 程序报错比例。\n\n';
}
const stats = reports.map(r => mode === 'train' ? r.after : r);
md += '| 角色 | 局数 | 第一章 | 第二章 | 第三章 | 真结局胜率 | 真结局胜/挑战 | 通关剩余生命 | 超时局数 | 报错局数 |\n|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|\n';
for (const r of stats) md += `| ${r.char} | ${r.n} | ${r.chapters.map(pct).join(' | ')} | ${pct(r.trueEnd)} | ${r.trueWins}/${r.trueAttempts} | ${num(r.clearHp)} | ${r.timeouts} | ${r.errors.length} |\n`;
md += '\n## 首领胜率及各章通关生命\n\n| 角色 | 首领 | 胜/挑战 | 胜率 |\n|---|---|---:|---:|\n';
const bossKeys = [...new Set([...CHAPTERS.flatMap(c => c.enc.boss.map(keys => keys.join('+'))), 'staff'])];
for (const r of stats) for (const boss of bossKeys) {
  const s = r.bosses[boss] || { wins: 0, attempts: 0 };
  md += `| ${charName(r.char)} | ${esc(encounterName(boss))} | ${s.wins}/${s.attempts} | ${s.attempts ? pct(s.wins / s.attempts) : '—'} |\n`;
}
md += '\n| 角色 | 第一章首领后生命 | 第二章首领后生命 | 第三章首领后生命 |\n|---|---:|---:|---:|\n';
for (const r of stats) md += `| ${r.char} | ${r.chapterHp.map(num).join(' | ')} |\n`;
md += '\n## 每个角色最常失败的八场（含超时）\n\n| 角色 | 场次 | 局数 |\n|---|---|---:|\n';
for (const r of stats) { if (!r.deaths.length) md += `| ${r.char} | 无 | 0 |\n`; for (const [where, n] of r.deaths) md += `| ${r.char} | ${esc(where)} | ${n} |\n`; }
md += '\n## 程序报错清单\n\n完整堆栈、敌人、手牌、牌组和走过的路线保存在对应 JSON 中。重放：`SEED=种子 node tools/bot/sim.mjs 1 角色`（训练候选需同时设置其 WEIGHTS）。\n\n| 角色 | 方案 | 种子 | 阶段 | 卡牌/按钮/用品 | 敌人 | 牌组 | 错误 |\n|---|---|---:|---|---|---|---|---|\n';
let errors = 0;
for (const r of reports) for (const [variant, s] of mode === 'train' ? [['搜索候选', { errors: r.searchErrors || [] }], ['原权重', r.before], ['平均权重', r.mean], ['训练最佳', r.best]] : [['平衡测试', r]]) {
  for (const e of s.errors) { errors++; md += `| ${r.char} | ${variant} | ${e.seed} | ${esc(e.stage)} | ${esc(e.card || e.action || e.item)} | ${esc(JSON.stringify(e.enemies))} | ${esc(e.deck.join(' '))} | ${esc(e.message)} |\n`; }
}
if (!errors) md += '| — | — | — | 无程序报错 | — | — | — | — |\n';
md += '\n## 复现信息\n\n| 角色 | 源提交 | 起始种子 | 局数 |\n|---|---|---:|---:|\n';
for (const r of reports) { const s = mode === 'train' ? r.after : r; md += `| ${r.char} | ${esc(r.source || process.env.GITHUB_SHA || '本地')} | ${s.seeds[0]} | ${s.n} |\n`; }
fs.writeFileSync(path.join(ROOT, `data/bot_${mode}.md`), md);
console.log(md);
