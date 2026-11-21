// 进化策略：对称扰动、前四分之一对数加权、逐代收缩探索幅度。
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { W, ROOT, CHARACTERS, loadWeights, fitness } from './sim.mjs';
import { mulberry } from '../../src/engine.js';

const [char, minutesArg = '55', batchArg = '80'] = process.argv.slice(2);
const minutes = Number(minutesArg), batch = Number(batchArg);
if (!CHARACTERS.includes(char) || !Number.isFinite(minutes) || minutes <= 0 || minutes > 180 || !Number.isInteger(batch) || batch < 1) throw new Error('用法：node tools/bot/train.mjs <角色> <分钟(0,180]> [每组局数]');
const started = Date.now(), deadline = started + minutes * 60_000;
// 预留最后同种子的三组各 1000 局；单次子进程到时可终止，不会挂死整个训练。
const searchEnd = deadline - Math.min(6 * 60_000, minutes * 60_000 * .25);
const parallel = Math.max(1, Math.min(4, os.availableParallelism?.() || os.cpus().length));
const rng = mulberry(12345 + CHARACTERS.indexOf(char)), keys = Object.keys(W);
const gaussian = () => Math.sqrt(-2 * Math.log(Math.max(Number.EPSILON, rng()))) * Math.cos(2 * Math.PI * rng());
const bounds = { ritual: [30, 200], rest: [.2, .95], itemHp: [.2, .95], bloodSafe: [.2, .95], blockShare: [.1, .7], attackShare: [.1, .8], earlyTurns: [1, 8], deckMax: [12, 40], powerLimit: [1, 8], lowAmmo: [0, 5], knifeLow: [0, 5], knifeFull: [1, 6], foodReserve: [0, 8], routeIntel: [0, 30], cost: [0, 5], deckPenalty: [0, 5], damage: [0, 3] };
const clamp = (k, v) => { const [lo, hi] = bounds[k] || [-20, 30]; return +Math.max(lo, Math.min(hi, v)).toFixed(4); };
const baseline = loadWeights(char), sigma = Object.fromEntries(keys.map(k => [k, Math.max(.2, Math.abs(baseline[k]) * .2)]));
let mean = { ...baseline }, best = { ...baseline }, bestScore = -Infinity, generation = 0;
const log = [];
const searchErrors = [];

function evaluate(weights, n, seed, timeoutMs) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['tools/bot/sim.mjs', String(n), char], { cwd: ROOT, env: { ...process.env, WEIGHTS: JSON.stringify(weights), NOWRITE: '1', SEED: String(seed) }, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '', stderr = '', expired = false;
    const timer = setTimeout(() => { expired = true; child.kill(); }, Math.max(1, timeoutMs));
    child.stdout.on('data', d => stdout += d); child.stderr.on('data', d => stderr += d);
    child.on('error', e => { clearTimeout(timer); reject(e); });
    child.on('close', code => {
      clearTimeout(timer);
      if (expired) return reject(new Error('评估达到时间预算'));
      try {
        const r = JSON.parse(stdout)[0];
        if (r.char !== char || r.n !== n || !Array.isArray(r.errors)) throw new Error('评估输出不完整');
        if (code && !r.errors.length) throw new Error(`评估进程退出码 ${code}`);
        resolve({ ...r, score: fitness(r) });
      } catch (e) { reject(new Error(`评估失败：${e.message}\n${stderr.slice(-3000)}\n${stdout.slice(-1000)}`)); }
    });
  });
}

async function pool(tasks) {
  const out = new Array(tasks.length); let index = 0;
  // 等待所有已启动进程退出，再向上抛错，避免遗留评估进程。
  const settled = await Promise.allSettled(Array.from({ length: Math.min(parallel, tasks.length) }, async () => { while (index < tasks.length) { const i = index++; out[i] = await tasks[i](); } }));
  const failed = settled.find(r => r.status === 'rejected'); if (failed) throw failed.reason;
  return out;
}

while (Date.now() < searchEnd) {
  const candidates = [];
  for (let pair = 0; pair < parallel; pair++) {
    const z = Object.fromEntries(keys.map(k => [k, gaussian()]));
    for (const sign of [1, -1]) candidates.push(Object.fromEntries(keys.map(k => [k, clamp(k, mean[k] + sign * sigma[k] * z[k])])));
  }
  candidates.push({ ...mean });
  let results;
  try { results = await pool(candidates.map(weights => () => evaluate(weights, batch, 10_000 + generation * batch, searchEnd - Date.now()))); }
  catch (e) { if (Date.now() >= searchEnd) { log.push({ generation, interrupted: e.message }); break; } throw e; }
  for (const r of results) searchErrors.push(...r.errors);
  const order = results.map((r, i) => ({ i, score: r.errors.length ? -Infinity : r.score })).sort((a, b) => b.score - a.score).filter(x => Number.isFinite(x.score));
  const mu = Math.max(1, Math.floor(candidates.length / 4)), elite = order.slice(0, mu);
  if (!elite.length) throw new Error('本代所有候选均出现程序报错；停止训练，避免用错误局数学习');
  const importance = elite.map((_, i) => Math.log(elite.length + .5) - Math.log(i + 1)), total = importance.reduce((a, b) => a + b, 0);
  mean = Object.fromEntries(keys.map(k => [k, clamp(k, elite.reduce((v, x, i) => v + candidates[x.i][k] * importance[i] / total, 0))]));
  for (const k of keys) sigma[k] *= .97;
  if (order[0].score > bestScore) { bestScore = order[0].score; best = { ...candidates[order[0].i] }; }
  log.push({ generation, seed: 10_000 + generation * batch, meanScore: results.at(-1).score, bestScore: order[0].score, errorEpisodes: results.reduce((s, r) => s + r.errors.length, 0) });
  console.log(`第 ${generation} 代：均值 ${results.at(-1).score.toFixed(4)}，最高 ${order[0].score.toFixed(4)}`);
  generation++;
}

// 留出种子 777—1776 从不用于搜索，三种方案严格使用同一批 1000 局。
const variants = [baseline, mean, best], validation = await pool(variants.map(weights => () => evaluate(weights, 1000, 777, 20 * 60_000)));
let selected = 0;
for (let i = 1; i < variants.length; i++) if (!validation[i].errors.length && (validation[selected].errors.length || validation[i].score > validation[selected].score)) selected = i;
const report = { char, source: process.env.BOT_SOURCE_SHA || process.env.GITHUB_SHA || null, minutes, generations: generation, elapsedSeconds: (Date.now() - started) / 1000, validationSeeds: { start: 777, count: 1000 }, selected: ['original', 'mean', 'best'][selected], before: validation[0], mean: validation[1], best: validation[2], after: validation[selected], weights: variants[selected], searchErrors, log };
fs.mkdirSync(path.join(ROOT, 'data'), { recursive: true });
fs.writeFileSync(path.join(ROOT, `data/bot_train_${char}.json`), JSON.stringify(report, null, 2) + '\n');
console.log(`${char}：选择 ${report.selected}，训练前 ${report.before.score.toFixed(4)}，采用后 ${report.after.score.toFixed(4)}`);
if (report.after.errors.length) process.exitCode = 1;
