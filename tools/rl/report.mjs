// 把五个角色的结果汇总成一份中文报告
import { readdirSync, readFileSync } from 'fs';
const dir = process.argv[2] || 'rl-out', pct = x => (x * 100).toFixed(0) + '%';
const R = readdirSync(dir).filter(f => f.endsWith('.json')).map(f => JSON.parse(readFileSync(`${dir}/${f}`, 'utf8')));
const out = ['# 强化学习测试报告', '', '| 角色 | 训练局数 | 打过第一章 | 第二章 | 第三章 | 真结局 |', '|---|---|---|---|---|---|'];
for (const r of R) out.push(`| ${r.char} | ${r.trainEpisodes} | ${pct(r.clear.ch1)} | ${pct(r.clear.ch2)} | ${pct(r.clear.ch3)} | ${pct(r.clear.trueEnd)} |`);
out.push('', '## 死得最多的战斗');
for (const r of R) out.push(`- **${r.char}**：${r.deaths.slice(0, 6).map(([k, n]) => `${k}（${n}）`).join('；')}`);
const F = {}; for (const r of R) for (const [k, s] of Object.entries(r.fights)) { const f = (F[k] = F[k] || { n: 0, w: 0, l: 0 }); f.n += s.n; f.w += s.win * s.n; f.l += s.lost * s.n; }
out.push('', '## 各场战斗（全角色合计，按胜率从低到高）', '| 战斗 | 场数 | 胜率 | 平均掉血 |', '|---|---|---|---|');
Object.entries(F).filter(([, f]) => f.n >= 5).sort((a, b) => a[1].w / a[1].n - b[1].w / b[1].n).forEach(([k, f]) => out.push(`| ${k} | ${f.n} | ${pct(f.w / f.n)} | ${(f.l / f.n).toFixed(1)} |`));
out.push('', '## 漏洞');
const B = {}; for (const r of R) for (const [k, v] of Object.entries(r.bugs)) { (B[k] = B[k] || { n: 0, ex: [] }).n += v.n; B[k].ex.push(...v.ex.slice(0, 2)); }
if (!Object.keys(B).length) out.push('没有发现。');
for (const [k, v] of Object.entries(B)) { out.push(`### ${k}（${v.n} 次）`); v.ex.slice(0, 4).forEach(e => out.push('- `' + JSON.stringify(e).slice(0, 400) + '`')); }
out.push('', '## AI 眼里最好 / 最差的牌');
for (const r of R) out.push(`- **${r.char}** 好：${r.bestCards.map(c => c[0]).join('、')}；差：${r.worstCards.map(c => c[0]).join('、')}`);
console.log(out.join('\n'));
