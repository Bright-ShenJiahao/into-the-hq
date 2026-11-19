// 《深入日军总部》界面和流程（最小可玩版：韩松 · 第一章 林海雪原）。规则在 engine.js，数据在 data.js。
import { CARDS, ENEMIES, ENC, EVENTS, STARTER, KW, TYPE, RAR, SCH, BAYONET, MAG, FEEL_MAX } from './data.js';
import * as E from './engine.js';

const $ = s => document.querySelector(s);
const view = $('#view'), fxl = $('#fx'), stage = $('#stage');
const TOUCH = matchMedia('(hover: none), (pointer: coarse)').matches; document.documentElement.classList.toggle('touch', TOUCH);
const DEBUG = /[?&]debug/.test(location.search) || location.hash === '#debug';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pickOne = a => a[Math.floor(Math.random() * a.length)];
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

let R = null, B = null, uidN = 1; /* R 当前一局，B 当前战斗 */

// ---------- 画面缩放：固定 720 高，宽度 1280–2000 ----------
let SW = 1280;
const saProbe = document.createElement('div'); saProbe.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)'; document.body.appendChild(saProbe);
function fit() {
  const cs = getComputedStyle(saProbe), sl = parseFloat(cs.paddingLeft) || 0, sr = parseFloat(cs.paddingRight) || 0, st = parseFloat(cs.paddingTop) || 0, sb = parseFloat(cs.paddingBottom) || 0;
  const W = innerWidth - sl - sr, H = innerHeight - st - sb; SW = Math.round(Math.max(1280, Math.min(2000, 720 * W / H))); const s = Math.min(W / SW, H / 720);
  stage.style.width = SW + 'px'; document.documentElement.style.setProperty('--sw', SW + 'px');
  stage.style.transform = `scale(${s})`; stage.style.left = sl + (W - SW * s) / 2 + 'px'; stage.style.top = st + (H - 720 * s) / 2 + 'px'; stage._s = s;
  if (B && !B.over && $('#hand')) render();
}
stage.addEventListener('scroll', () => { stage.scrollTop = 0; stage.scrollLeft = 0; });
addEventListener('resize', fit); addEventListener('orientationchange', () => setTimeout(fit, 250)); fit();

// ---------- 存档 ----------
const SAVE = 'ithq_run_v1';
const mk = (id, up = 0) => ({ id, up, uid: uidN++ });
const save = () => { try { localStorage.setItem(SAVE, JSON.stringify(R)); } catch (e) {} };
const clearSave = () => { try { localStorage.removeItem(SAVE); } catch (e) {} };
function load() {
  try { const s = JSON.parse(localStorage.getItem(SAVE)); if (!s || !Array.isArray(s.deck) || !Array.isArray(s.map)) return null;
    s.deck = s.deck.filter(c => CARDS[c.id]); if (s.pending && s.pending.list) s.pending.list = s.pending.list.filter(id => CARDS[id]);
    uidN = 1 + Math.max(0, ...s.deck.map(c => c.uid || 0)); return s; } catch (e) { return null; }
}
const ROWS = 9, COLS = 5, TEMP_MAX = 10;
function newRun() {
  uidN = 1;
  R = { hp: 72, maxHp: 72, deck: STARTER.map(id => mk(id)), temp: TEMP_MAX, food: 6, map: genMap(), pos: null, path: [], floor: 0, fights: 0, kills: 0 };
  save();
}

// ---------- 地图（沿用旧游戏的生成方式，9 层 + Boss） ----------
function genMap() {
  const g = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  const node = (r, c) => g[r][c] || (g[r][c] = { r, c, next: [], type: null, x: 150 + c * 175 + rnd(-18, 18), y: 0 });
  const crosses = (r, c, n) => g[r].some(o => o && o.c !== c && o.next.some(n2 => (o.c < c && n2 > n) || (o.c > c && n2 < n)));
  let first = -1;
  for (let p = 0; p < 5; p++) {
    let c = rnd(0, COLS - 1); if (p === 1) while (c === first) c = rnd(0, COLS - 1); if (p === 0) first = c;
    for (let r = 0; r < ROWS; r++) {
      const nd = node(r, c); if (r === ROWS - 1) break;
      const cand = [c - 1, c, c + 1].sort(() => Math.random() - .5).filter(n => n >= 0 && n < COLS && !crosses(r, c, n));
      const n = cand.length ? cand[0] : c; if (!nd.next.includes(n)) nd.next.push(n); c = n;
    }
  }
  const W = { fight: 50, event: 24, elite: 12, rest: 12 };
  for (let r = 0; r < ROWS; r++) for (const nd of g[r]) {
    if (!nd) continue; nd.y = (ROWS - 1 - r) * 100 + 250 + rnd(-10, 10);
    if (r === 0) { nd.type = 'fight'; continue; } if (r === ROWS - 1) { nd.type = 'rest'; continue; }
    const parents = g[r - 1].filter(o => o && o.next.includes(nd.c)).map(o => o.type);
    const ok = Object.entries(W).filter(([t]) => !((t === 'elite' || t === 'rest') && r < 3) && !(t === 'rest' && r === ROWS - 2) && !(['elite', 'rest'].includes(t) && parents.includes(t)));
    let tot = 0, x; ok.forEach(([, w]) => tot += w); x = Math.random() * tot;
    for (const [t, w] of ok) { x -= w; if (x <= 0) { nd.type = t; break; } }
    nd.type = nd.type || 'fight';
  }
  const all = g.flat().filter(Boolean);
  if (!all.some(n => n.type === 'elite')) { const f = all.filter(n => n.type === 'fight' && n.r >= 4 && n.r < ROWS - 1); if (f.length) pickOne(f).type = 'elite'; }
  return g;
}
const NODE = { fight: ['战', '战斗', '#8a4a32'], elite: ['精', '精英', '#7a1a1a'], event: ['?', '未知', '#3a5a7a'], rest: ['营', '密营', '#2f6a3a'] };
function available() {
  if (!R.pos) return R.map[0].filter(Boolean);
  if (R.pos.r === ROWS - 1) return ['boss'];
  const cur = R.map[R.pos.r][R.pos.c]; return cur.next.map(c => R.map[R.pos.r + 1][c]);
}

// ---------- 顶栏 ----------
function topBar() {
  return `<div id="top"><span class="hp">❤ ${R.hp}/${R.maxHp}</span>
   <span class="tmp ${R.temp < 3 ? 'warn' : ''}" data-tip="体温：每走一格 -1，到密营回满。低于 3 时，战斗第一回合少抽 1 张；降到 0 后每走一格再失去 2 生命。">🌡 体温 ${R.temp}/${TEMP_MAX}</span>
   <span class="food ${R.food <= 0 ? 'warn' : ''}" data-tip="口粮：每走一格 -1，打赢战斗能缴获。口粮为 0 时，每走一格失去 3 生命。">🍞 口粮 ${R.food}</span>
   <span class="fl">第 ${Math.max(1, R.floor)} 层 · 林海雪原</span>
   <i class="sp"></i><button class="tb" id="tbdeck">牌组 ${R.deck.length}</button><button class="tb" id="tbrule">规则</button><button class="tb" id="tbmenu">菜单</button></div>`;
}
function bindTop() {
  $('#tbdeck') && ($('#tbdeck').onclick = () => showPile('牌组', R.deck));
  $('#tbrule') && ($('#tbrule').onclick = rules);
  $('#tbmenu') && ($('#tbmenu').onclick = () => { const o = overlay(`<h2>菜单</h2><div class="col"><button class="btn" id="m_back">继续</button><button class="btn" id="m_title">回到标题（进度已保存）</button><button class="btn red" id="m_quit">放弃这一局</button></div>`);
    o.querySelector('#m_back').onclick = () => o.remove(); o.querySelector('#m_title').onclick = () => { o.remove(); B = null; title(); };
    o.querySelector('#m_quit').onclick = () => { o.remove(); clearSave(); B = null; R = null; title(); }; });
  view.querySelectorAll('[data-tip]').forEach(el => el.onclick = () => tipBox(el.dataset.tip));
}

// ---------- 通用 ----------
function overlay(html) { const o = document.createElement('div'); o.className = 'overlay'; o.innerHTML = html; stage.appendChild(o); return o; }
function tip(t) { $('#tip')?.remove(); const o = document.createElement('div'); o.id = 'tip'; o.textContent = t; stage.appendChild(o); setTimeout(() => o.remove(), 1400); }
function say(t, ms = 3200) { stage.querySelectorAll('.say').forEach(x => x.remove()); const b = document.createElement('div'); b.className = 'say'; b.textContent = t; stage.appendChild(b); setTimeout(() => b.remove(), ms); }
function tipBox(t) { const o = overlay(`<div class="panel small"><p>${t}</p><button class="btn">知道了</button></div>`); o.onclick = () => o.remove(); }
function banner(t) { const b = document.createElement('div'); b.id = 'banner'; b.textContent = t; stage.appendChild(b); setTimeout(() => b.remove(), 1200); }
const kwRe = new RegExp(Object.keys(KW).sort((a, b) => b.length - a.length).join('|'), 'g');
const kwify = s => s.replace(kwRe, m => `<span class="kw">${m}</span>`);
const dsc = (c, f = x => x) => CARDS[c.id].desc(c.up, f);
const kwOf = c => { const d = CARDS[c.id], s = dsc(c) + (d.sch === '狙' && d.gun ? '狙击牌' : '') + (d.sch === '冲' ? '冲锋枪牌' : '') + (d.sch === '冲' || d.sch === '手' ? '枪感' : '') + (d.ex ? '消耗' : '') + (d.type === 'power' ? '能力' : '') + (d.gun ? '拼刺' : ''); return Object.keys(KW).filter(k => s.includes(k)); };

function cardHTML(c, extra = '', attrs = '') {
  const d = CARDS[c.id], cost = d.cost[c.up ? 1 : 0];
  let badge = '', cls = '';
  if (B && !B.over && extra.includes('inhand')) {
    const m = E.gunMode(B, c);
    if (m === 'bayonet') { badge = `<div class="cbadge bayo">空仓 · 拼刺 ${BAYONET}</div>`; cls = ' bayo'; }
    else if (d.gun && B.p.reloaded && !B.p.depotLeft) badge = '<div class="cbadge">已装填 · 不能开枪</div>';
  }
  /* 战斗中把伤害数字换成实际值：变大绿色，变小红色 */
  const live = B && !B.over && extra.includes('inhand') && d.gun && E.gunMode(B, c) === 'shoot';
  const f = x => { if (!live) return x; const v = E.previewDmg(B, d, x); return v === x ? x : `<b class="${v > x ? 'dup' : 'ddn'}">${v}</b>`; };
  const text = dsc(c, f);
  return `<div class="card t-${d.type}${c.up ? ' up' : ''}${d.gun ? ' gun' : ''}${cls} ${extra}" data-cid="${c.id}" ${attrs}>
    <div class="cost">${cost}</div><div class="cname">${d.name}${c.up ? '+' : ''}</div>
    <div class="ctype">${d.sch !== '通' ? `<i class="sch s-${d.sch}">${SCH[d.sch]}</i> · ` : ''}${TYPE[d.type]} · ${RAR[d.rar]}</div>
    <div class="cdesc"><span>${kwify(text)}${d.ex && !text.includes('消耗') ? '<br>消耗。' : ''}</span></div>${badge}</div>`;
}
function showPile(t, cards, onPick, sub = '') {
  const o = overlay(`<h2>${t}</h2>${sub ? `<p class="sub">${sub}</p>` : ''}<div class="grid">${cards.length ? cards.map((c, i) => cardHTML(c, '', `data-k="${i}"`)).join('') : '<p class="sub">（空）</p>'}</div><button class="btn" id="ov_close">${onPick ? '取消' : '关闭'}</button>`);
  o.querySelector('#ov_close').onclick = () => o.remove();
  if (onPick) o.querySelectorAll('.grid .card').forEach(el => el.onclick = () => { o.remove(); onPick(cards[+el.dataset.k]); });
  return o;
}
function rules() {
  overlay(`<div class="panel rules"><h2>规则</h2>
  <p>· 每回合 3 能量，抽 5 张。打出卡牌要花能量。</p>
  <p>· <b>弹仓</b>：韩松只有一个弹仓（${MAG} 发），所有枪械牌都从这里扣子弹，每「射击 1 发」用掉 1 颗。</p>
  <p>· <b>装填</b>：弹仓旁边的按钮，0 费，把弹仓装满；装填后本回合不能再打枪械牌。</p>
  <p>· <b>空仓拼刺</b>：弹仓空了，枪械牌自动变成拼刺，造成 ${BAYONET} 伤害，牌上其他效果照常。</p>
  <p>· <b>三种枪</b>：狙击牌 1 发高伤、省子弹；冲锋枪牌一次打好几发、耗弹快；手枪牌是便宜的小牌。</p>
  <p>· <b>标尺</b>：叠在敌人身上，最多 5 层，每层让狙击牌每发 +1 伤害。</p>
  <p>· <b>枪感</b>：每打一张枪械牌 +1（最多 ${FEEL_MAX}），回合结束 -1；冲锋枪牌和手枪牌每发伤害 + 枪感的一半。</p>
  <p>· <b>装甲</b>：每次受到的伤害减去装甲值。穿甲弹、反器材无视装甲。</p>
  <p>· <b>体温</b>：每走一格 -1，到密营回满；低于 3 时战斗第一回合少抽 1 张；为 0 时每走一格再失去 2 生命。</p>
  <p>· <b>口粮</b>：每走一格 -1，打赢战斗能缴获；为 0 时每走一格失去 3 生命。</p>
  <p>· <b>缴获</b>：打赢后可能缴获敌人的枪，以卡牌的形式加入牌组（比如「歪把子扫射」「九七式狙击」）。</p>
  <p class="sub">电脑快捷键：数字键出牌，R 装填，E 结束回合，Esc 取消。</p>
  <button class="btn" id="ov_close">关闭</button></div>`).querySelector('#ov_close').onclick = e => e.target.closest('.overlay').remove();
}

// ---------- 标题 ----------
function title() {
  B = null; const s = load();
  view.innerHTML = `<div class="tbg"></div><div class="tlogo"><h1>深入日军总部</h1><p class="en">INTO THE HQ</p><p class="en2">最小可玩版 · 第一章 林海雪原</p></div>
   <div class="mmenu">${s ? `<button class="btn mm" id="t_cont">继续<small>第 ${Math.max(1, s.floor)} 层 · 生命 ${s.hp}/${s.maxHp}</small></button>` : ''}
   <button class="btn mm" id="t_new">新的一局<small>神枪手 · 韩松（雪貂）</small></button><button class="btn mm sm2" id="t_rule">规则</button></div>
   <p class="tnote">本作为虚构故事，人物均为虚构。美术为色块占位。</p>`;
  if (s) $('#t_cont').onclick = () => { R = s; resume(); };
  $('#t_new').onclick = () => { if (s && !confirm('开始新的一局会覆盖当前进度，确定吗？')) return; newRun(); story(INTRO, mapScreen); };
  $('#t_rule').onclick = rules;
}
const INTRO = ['1944 年冬。东北抗日联军的一支小分队，在苏联境内整训一年后，奉命潜回东北。',
  '他们的最终目标，是长春——伪满洲国所谓的「新京」，关东军司令部就在那里。',
  '第一站是长白山北麓的林海雪原。日伪讨伐队正在搜山。',
  '神枪手韩松，代号「雪貂」，走在队伍最前面。'];
function story(lines, done) {
  let i = 0; const show = () => { view.innerHTML = `<div class="tbg dark"></div><div class="storybox"><p>${lines[i]}</p><button class="btn" id="st_n">${i < lines.length - 1 ? '继续' : '出发'}</button><button class="btn ghost" id="st_s">跳过</button></div>`;
    $('#st_n').onclick = () => { i++; i < lines.length ? show() : done(); }; $('#st_s').onclick = done; };
  show();
}
function resume() {
  if (R.pending && (R.pending.t === 'fight' || R.pending.t === 'elite' || R.pending.t === 'boss')) return battle(R.pending.enc, R.pending.t);
  if (R.pending && R.pending.t === 'rest') return restScreen();
  if (R.pending && R.pending.t === 'loot') return lootScreen();
  mapScreen();
}

// ---------- 地图 ----------
function mapScreen() {
  B = null; delete R.pending; save();
  const av = available(), H = ROWS * 100 + 300, LC = '#4a5a6a';
  let lines = '', nodes = '';
  for (const row of R.map) for (const nd of row) if (nd) for (const c of nd.next) { const t = R.map[nd.r + 1][c]; lines += `<line x1="${nd.x}" y1="${nd.y}" x2="${t.x}" y2="${t.y}" stroke="${LC}" stroke-width="3" stroke-dasharray="4 8" stroke-linecap="round"/>`; }
  for (const nd of R.map[ROWS - 1]) if (nd) lines += `<line x1="${nd.x}" y1="${nd.y}" x2="500" y2="110" stroke="${LC}" stroke-width="3" stroke-dasharray="4 8" stroke-linecap="round"/>`;
  for (const row of R.map) for (const nd of row) if (nd) {
    const isAv = av.includes(nd), done = R.path.some(p => p.r === nd.r && p.c === nd.c), cur = R.pos && R.pos.r === nd.r && R.pos.c === nd.c, [ch, , col] = NODE[nd.type];
    nodes += `<div class="node ${isAv ? 'av' : ''} ${done ? 'done' : ''} ${cur ? 'cur' : ''}" style="left:${nd.x}px;top:${nd.y}px;background:${col}" data-r="${nd.r}" data-c="${nd.c}">${ch}</div>`;
  }
  nodes += `<div class="node boss ${av[0] === 'boss' ? 'av' : ''}" style="left:500px;top:110px">讨伐队长</div>`;
  view.innerHTML = `${topBar()}<div id="map"><div id="mapin" style="height:${H}px"><svg width="1000" height="${H}">${lines}</svg>${nodes}</div></div>
   <div id="legend">${Object.values(NODE).map(([ch, n, col]) => `<div><b style="background:${col}">${ch}</b>${n}</div>`).join('')}<div class="lg2">每走一格：体温 -1，口粮 -1</div></div>`;
  bindTop();
  const m = $('#map'), y = R.pos ? R.map[R.pos.r][R.pos.c].y : H; m.scrollTop = Math.max(0, y - 460);
  view.querySelectorAll('.node.av').forEach(el => el.onclick = () => {
    if (el.classList.contains('boss')) { if (!walk()) return; R.floor++; return enterNode('boss'); }
    const nd = R.map[+el.dataset.r][+el.dataset.c]; if (!walk()) return;
    R.pos = { r: nd.r, c: nd.c }; R.path.push(R.pos); R.floor++; enterNode(nd.type);
  });
  dbgPanel();
}
/* 走一格：消耗体温和口粮，返回 false 表示倒下了 */
function walk() {
  const msg = [];
  if (R.food > 0) R.food--; else { R.hp -= 3; msg.push('没有口粮，饿着肚子赶路：生命 -3'); }
  if (R.temp > 0) R.temp--; else { R.hp -= 2; msg.push('冻得失去知觉：生命 -2'); }
  if (msg.length) say(msg.join('；'));
  if (R.hp <= 0) { R.hp = 0; endScreen(false, '倒在了风雪里'); return false; }
  return true;
}
function enterNode(t) {
  if (t === 'boss') { R.pending = { t: 'boss', enc: ENC.boss[0] }; save(); return battle(R.pending.enc, 'boss'); }
  if (t === 'fight' || t === 'elite') {
    const enc = t === 'elite' ? pickOne(ENC.elite) : pickOne(R.fights < 2 ? ENC.easy : ENC.hard); if (t === 'fight') R.fights++;
    R.pending = { t, enc }; save(); return battle(enc, t);
  }
  if (t === 'rest') { R.pending = { t: 'rest' }; save(); return restScreen(); }
  if (t === 'event') { save(); return eventScreen(); }
}

// ---------- 战斗 ----------
function battle(enc, kind) {
  B = E.startBattle(R, enc, kind, E.mulberry((Math.random() * 2 ** 31) | 0)); B.sel = -1; B.busy = 0;
  render(); if (kind === 'boss') banner('讨伐队长 · 村濑'); else if (kind === 'elite') banner('精英：讨伐队军曹');
  flushMsgs();
}
function flushMsgs() { if (B && B.msgs.length) { say(B.msgs.join('\n'), 3600); B.msgs = []; } }
const ICON = { atk: '⚔', def: '🛡', buff: '⬆', debuff: '⬇', charge: '⏳', flee: '🏃', unk: '？' };
const ESIZE = { dog: [130, 80], sergeant: [120, 185], captain: [250, 170], mg: [150, 110], mortar: [110, 130] };
function enemyHTML(e) {
  const d = e.d, [w, h] = e.key === 'captain' && e.phase === 2 ? [120, 190] : (ESIZE[e.key] || [100, 160]), it = e.dead ? null : E.intentOf(B, e);
  const tg = B.sel >= 0 && B.hand[B.sel] && E.needTarget(B.hand[B.sel]) && !e.dead;
  const label = e.key === 'captain' ? (e.phase === 2 ? '村濑' : '装甲车') : d.name;
  return `<div class="unit enemy ${tg ? 'tg' : ''} ${e.dead ? 'dead' : ''}" data-eid="${e.id}">
    <div class="intent">${it ? `${ICON[it.i]} ${it.text}<small>${it.name}</small>` : ''}</div>
    <div class="sprw"><div class="spr blk ${d.boss ? 'bossb' : ''}" style="width:${w}px;height:${h}px;background:${d.col}">${label}</div><i class="shd"></i></div>
    ${barHTML(e.hp, e.max, e.block)}<div class="badges">${e.armor ? `<b class="arm" data-k="装甲">🛡 装甲 ${e.armor}</b>` : ''}${e.marks ? `<b class="mark" data-k="标尺">🎯 标尺 ${e.marks}</b>` : ''}${stsHTML(e.st)}</div>
    <div class="uname">${d.name}</div></div>`;
}
function barHTML(hp, max, blk) {
  return `<div class="bar ${blk ? 'blk' : ''}"><i style="width:${Math.max(0, hp) / max * 100}%"></i><span>${Math.max(0, hp)}/${max}${blk ? ` +${blk}` : ''}</span></div>`;
}
const STN = { weak: ['虚弱', '#c8a0ff'], vuln: ['易伤', '#ff9a6a'], str: ['力量', '#ff6a5a'] };
const stsHTML = st => Object.entries(st).filter(([k]) => STN[k]).map(([k, n]) => `<b class="st" style="color:${STN[k][1]};border-color:${STN[k][1]}" data-k="${STN[k][0]}">${STN[k][0]} ${n}</b>`).join('');
function magHTML() {
  const pips = B.cap <= 16 ? Array.from({ length: B.cap }, (_, k) => `<i class="${k < B.ammo ? 'f' : ''}"></i>`).join('') : `<em class="mbar"><u style="width:${B.ammo / B.cap * 100}%"></u></em>`;
  const full = B.ammo >= B.cap, fb = Math.floor(B.p.feel / 2);
  const lab = B.p.reloaded ? (B.p.depotLeft ? '已装填（还能打 1 张枪械牌）' : '已装填 · 本回合不能开枪') : full ? '弹仓已满' : '装填（0 费）';
  return `<div id="wpn"><div class="wrow on"><b>弹仓</b><em class="cnt ${B.ammo ? '' : 'zero'}">${B.ammo}/${B.cap}</em><span class="pips">${pips}</span></div>
   <div class="feel" data-k="枪感"><b>枪感 ${B.p.feel}</b><span class="fpips">${Array.from({ length: FEEL_MAX }, (_, k) => `<i class="${k < B.p.feel ? 'f' : ''}"></i>`).join('')}</span><small>${fb ? `冲锋枪/手枪每发 +${fb}` : '每 2 点 +1 伤害'}</small></div>
   <button class="btn reload ${!full && !B.p.reloaded ? 'hot' : ''}" id="reload" ${full || B.p.reloaded || B.busy ? 'disabled' : ''}>${lab}</button></div>`;
}
function render() {
  if (!B) return;
  const n = B.hand.length, HZ = TOUCH ? 1.25 : 1, cw = 150, Wd = SW / HZ - (TOUCH ? 330 : 300), gap = Math.min(cw + 8, (Wd - cw) / Math.max(1, n - 1));
  const x0 = (SW / HZ - (gap * (n - 1) + cw)) / 2 - (TOUCH ? 0 : 0);
  const hand = B.hand.map((c, i) => {
    const mid = (n - 1) / 2, sel = B.sel === i, rot = sel ? 0 : (i - mid) * 3, dy = sel ? (TOUCH ? -60 : -70) : Math.abs(i - mid) ** 2 * 2.2;
    const off = E.cantPlay(B, c);
    return cardHTML(c, `inhand ${sel ? 'sel' : ''} ${off ? 'off' : ''}`, `data-i="${i}" style="left:${x0 + i * gap}px;transform:translateY(${dy}px) rotate(${rot}deg)${sel ? ' scale(' + (TOUCH ? 1.35 : 1.3) + ')' : ''};z-index:${sel ? 90 : i + 1}"`);
  }).join('');
  const inc = E.incoming(B), selC = B.sel >= 0 ? B.hand[B.sel] : null;
  view.innerHTML = `<div class="bg"></div>${topBar()}
   <div id="hero" class="unit" data-eid="hero"><div class="intent"></div><div class="sprw"><div class="spr blk" style="width:110px;height:170px;background:#56603a">韩松</div><i class="shd"></i></div>
    ${barHTML(R.hp, R.maxHp, B.p.block)}<div class="badges">${stsHTML(B.p.st)}${Object.keys(B.p.pw).map(k => `<b class="pw">${({ scope: '瞄准镜', depot: '备用弹匣', rapid: '枪感训练', quick: '快换弹匣' })[k]}</b>`).join('')}</div>
    ${inc ? `<div class="inc ${inc > B.p.block ? 'low' : 'ok'}">将受到 ${Math.max(0, inc - B.p.block)} 伤害</div>` : ''}</div>
   <div id="enemies">${B.en.filter(e => !(e.dead && Date.now() - e.deadAt > 1200)).map(enemyHTML).join('')}</div>
   ${magHTML()}
   <div id="energy" class="${B.p.energy ? '' : 'empty'}">${B.p.energy}/${E.ENERGY}</div>
   <button class="btn" id="endturn" ${B.busy ? 'disabled' : ''}>${B.busy ? '敌人回合' : '结束回合'}</button>
   <div class="pile" id="drawp">抽牌堆<b>${B.draw.length}</b></div><div class="pile" id="discp">弃牌堆<b>${B.disc.length}</b></div><div class="pile" id="exhp">消耗<b>${B.exh.length}</b></div>
   <div id="hand">${hand}</div>
   ${selC ? `<div id="kwbox" style="${kwPos(x0 + B.sel * gap, HZ)}">${kwOf(selC).map(k => `<p><b>${k}</b>${KW[k]}</p>`).join('')}<p class="hint">${E.cantPlay(B, selC) ? '⚠ ' + E.cantPlay(B, selC) : E.needTarget(selC) && E.alive(B).length > 1 ? '点一个敌人打出' : TOUCH ? '再点一次打出' : '再点一次或按空格打出'}</p></div>` : ''}`;
  bindTop();
  $('#endturn').onclick = endTurn;
  $('#reload').onclick = doReload;
  $('#drawp').onclick = () => showPile('抽牌堆（顺序已打乱）', [...B.draw].sort((a, b) => a.id < b.id ? -1 : 1));
  $('#discp').onclick = () => showPile('弃牌堆', B.disc);
  $('#exhp').onclick = () => showPile('消耗', B.exh);
  view.querySelectorAll('#hand .card').forEach(el => el.onclick = ev => { ev.stopPropagation(); clickCard(+el.dataset.i); });
  view.querySelectorAll('.enemy').forEach(el => el.onclick = ev => { ev.stopPropagation(); clickEnemy(el.dataset.eid); });
  view.querySelectorAll('.badges b[data-k], #wpn [data-k]').forEach(el => el.onclick = ev => { ev.stopPropagation(); const k = el.dataset.k; tipBox(`<b>${k}</b>：${KW[k] || ({ 力量: '每次攻击伤害增加等同层数。' })[k] || ''}`); });
  view.querySelector('.bg').onclick = () => { if (B.sel >= 0) { B.sel = -1; render(); } };
  flushFx(); dbgPanel();
}
/* 关键词说明框贴在选中的牌旁边（右边放不下就放左边） */
function kwPos(x, hz) { const sc = TOUCH ? 1.35 : 1.3, half = 75 * sc * hz, cx = (x + 75) * hz, bw = 300 * (TOUCH ? 1.3 : 1);
  return cx + half + 12 + bw < SW - 10 ? `left:${cx + half + 12}px` : `left:${Math.max(10, cx - half - 12 - bw)}px`; }
function clickCard(i) {
  if (!B || B.busy || B.over) return;
  const c = B.hand[i]; if (!c) return;
  /* 电脑：不用选目标（或只剩一个敌人）的牌点一下就打出；手机：第一下放大看牌，第二下打出 */
  if (B.sel !== i) {
    if (!TOUCH && !E.cantPlay(B, c) && (!E.needTarget(c) || E.alive(B).length === 1)) return play(i, E.needTarget(c) ? E.alive(B)[0].id : undefined);
    B.sel = i; render(); return;
  }
  const why = E.cantPlay(B, c); if (why) { tip(why); return; }
  if (E.needTarget(c)) { const a = E.alive(B); if (a.length === 1) return play(i, a[0].id); tip('点一个敌人打出'); return; }
  play(i);
}
function clickEnemy(id) {
  if (!B || B.busy || B.over || B.sel < 0) return; const c = B.hand[B.sel]; if (!c) return;
  const why = E.cantPlay(B, c); if (why) { tip(why); return; }
  play(B.sel, E.needTarget(c) ? id : undefined);
}
async function play(i, tid) {
  const c = B.hand[i], wasEmpty = B.ammo === 0 && CARDS[c.id].gun;
  if (!E.playCard(B, i, tid)) return;
  B.sel = -1; render(); flushMsgs();
  if (wasEmpty) say('弹仓空了，端起刺刀！', 1600);
  await checkEnd();
}
function doReload() { if (!B || B.busy || B.over) return; if (E.reload(B)) { B.sel = -1; render(); } }
async function endTurn() {
  if (!B || B.busy || B.over) return;
  B.busy = 1; B.sel = -1; E.endPlayerTurn(B); render();
  await sleep(350);
  for (const e of B.en.filter(x => !x.dead)) {
    if (B.over) break; E.enemyAct(B, e); lunge(e.id); render(); flushMsgs(); await sleep(520);
  }
  if (await checkEnd()) return;
  E.startTurn(B); B.busy = 0; render(); flushMsgs();
}
function lunge(id) { const el = view.querySelector(`.enemy[data-eid="${id}"] .sprw`); if (el) { el.classList.remove('lunge'); void el.offsetWidth; el.classList.add('lunge'); } }
async function checkEnd() {
  const r = E.result(B); if (!r) return false;
  B.busy = 1; await sleep(700);
  if (r === 'lose') { endScreen(false, '倒在了林海雪原里'); return true; }
  const kind = B.kind, en = B.en; B.over = 'win';
  if (kind === 'boss') { R.hp = Math.max(1, R.hp); clearSave(); endScreen(true); return true; }
  winRewards(kind, en); return true;
}

// ---------- 动画 ----------
function flushFx() {
  const s = stage._s || 1, sr = stage.getBoundingClientRect(), count = {}; let shake = false, bn = 0;
  const pos = who => { const el = view.querySelector(`[data-eid="${who}"] .spr`); if (!el) return null; const r = el.getBoundingClientRect(); return [(r.left + r.width / 2 - sr.left) / s, (r.top - sr.top) / s, r.height / s]; };
  for (const f of B.fx) {
    const p = pos(f.who); if (!p) continue; const [cx, top, h] = p;
    if (f.cls === 'bul') { const hp = pos('hero'); if (!hp) continue; const hx = hp[0] + 50, hy = hp[1] + 50, ty = top + h * .4;
      const b = document.createElement('div'); b.className = 'bullet'; b.style.left = hx + 'px'; b.style.top = hy + 'px'; b.style.setProperty('--dx', (cx - hx) + 'px'); b.style.setProperty('--dy', (ty - hy) + 'px'); b.style.animationDelay = bn * 70 + 'ms'; bn++; fxl.appendChild(b); setTimeout(() => b.remove(), 600 + bn * 70); continue; }
    count[f.who] = (count[f.who] || 0) + 1; const k = count[f.who];
    const d = document.createElement('div'); d.className = 'fxn ' + f.cls; d.textContent = f.text;
    d.style.left = cx + (k - 1) * 16 + 'px'; d.style.top = top + 10 + (k - 1) * 26 + 'px'; d.style.animationDelay = Math.min(6, k - 1) * 60 + 'ms';
    fxl.appendChild(d); setTimeout(() => d.remove(), 1300);
    if (f.cls === 'dmg') { if (f.who === 'hero') shake = true;
      for (let q = 0; q < (TOUCH ? 4 : 7); q++) { const sp = document.createElement('div'); sp.className = 'spark'; const an = Math.random() * 6.28, dist = 40 + Math.random() * 70;
        sp.style.left = cx + 'px'; sp.style.top = top + h * .45 + 'px'; sp.style.setProperty('--dx', Math.cos(an) * dist + 'px'); sp.style.setProperty('--dy', Math.sin(an) * dist + 'px'); if (f.who === 'hero') sp.style.background = '#ff5a4a';
        fxl.appendChild(sp); setTimeout(() => sp.remove(), 600); } }
  }
  if (shake) { view.classList.remove('shake'); void view.offsetWidth; view.classList.add('shake'); }
  B.fx = [];
}

// ---------- 战后 ----------
function rollCards(n, elite) {
  const pool = Object.values(CARDS).filter(d => d.rar !== 'basic' && d.rar !== 'loot'), out = [];
  while (out.length < n) {
    const x = Math.random(), rar = x < (elite ? .2 : .08) ? 'r' : x < (elite ? .6 : .42) ? 'u' : 'c';
    const cand = pool.filter(d => d.rar === rar && !out.includes(d.id)); if (!cand.length) continue; out.push(pickOne(cand).id);
  }
  return out.map(id => mk(id));
}
function winRewards(kind, en) {
  const food = kind === 'elite' ? 2 : 1; R.food += food;
  const list = [];
  for (const e of en) if (!e.fled && e.d.loot && Math.random() < e.d.lootP && !list.includes(e.d.loot)) list.push(e.d.loot);
  B = null; R.pending = { t: 'loot', list, kind, food, cards: rollCards(3, kind === 'elite') }; save();
  lootScreen();
}
/* 战利品：先选牌，再逐个处理缴获的武器。进度存在 R.pending 里，刷新页面不会丢也不会重抽 */
function lootScreen() {
  const P = R.pending;
  if (!P || P.t !== 'loot') return mapScreen();
  view.innerHTML = `<div class="bg"></div>${topBar()}`; bindTop();
  if (P.cards) {
    view.insertAdjacentHTML('beforeend', `<div class="panel loot"><h2>${P.kind === 'elite' ? '打退了讨伐队！' : '战斗胜利'}</h2>
     <p>缴获口粮 +${P.food || 1}</p><p class="sub">选一张牌加入牌组：</p><div class="row">${P.cards.map((c, i) => cardHTML(c, '', `data-k="${i}"`)).join('')}</div>
     <button class="btn ghost" id="l_skip">不要牌</button></div>`); bindTop();
    const next = () => { delete P.cards; save(); lootScreen(); };
    view.querySelectorAll('.loot .card').forEach(el => el.onclick = () => { const c = P.cards[+el.dataset.k]; R.deck.push(c); tip('加入牌组：' + CARDS[c.id].name); next(); });
    $('#l_skip').onclick = next; return;
  }
  if (P.list && P.list.length) return offerLoot(P.list[0], () => { P.list.shift(); save(); lootScreen(); });
  mapScreen();
}
/* 缴获：敌人的枪以卡牌形式加入牌组 */
function offerLoot(id, done) {
  const c = mk(id);
  const o = overlay(`<div class="panel"><h2>缴获</h2><p class="sub">从敌人身上缴获了一支枪：</p><div class="row">${cardHTML(c)}</div>
    <div class="row"><button class="btn" id="w_yes">加入牌组</button><button class="btn ghost" id="w_no">不要</button></div></div>`);
  o.querySelector('#w_yes').onclick = () => { R.deck.push(c); o.remove(); tip('加入牌组：' + CARDS[id].name); save(); done(); };
  o.querySelector('#w_no').onclick = () => { o.remove(); done(); };
}

// ---------- 密营 ----------
function restScreen() {
  R.temp = TEMP_MAX; save(); const heal = Math.floor(R.maxHp * .3);
  view.innerHTML = `<div class="bg rest"></div>${topBar()}<div class="panel"><h2>密营</h2><p>林子深处的地窨子，灶里的火压得很低。体温回满了。</p>
    <div class="col"><button class="btn" id="r_heal">休息：回复 ${heal} 生命</button><button class="btn" id="r_up">擦枪：升级 1 张牌</button></div></div>`;
  bindTop();
  $('#r_heal').onclick = () => { R.hp = Math.min(R.maxHp, R.hp + heal); mapScreen(); };
  $('#r_up').onclick = () => upgradePick(ok => ok ? mapScreen() : null);
}
function upgradePick(done) {
  const cands = R.deck.filter(c => !c.up);
  if (!cands.length) { tip('没有能升级的牌'); return done(false); }
  showPile('选一张牌升级', cands, c => { c.up = 1; tip('升级了 ' + CARDS[c.id].name); save(); done(true); }, '升级后的效果可以在牌组里看到');
}

// ---------- 事件 ----------
function eventScreen() {
  const ev = pickOne(EVENTS);
  view.innerHTML = `<div class="bg ev"></div>${topBar()}<div class="panel evp"><h2>${ev.title}</h2><p>${ev.text}</p><div class="col">${ev.opts.map((o, i) => `<button class="btn opt" data-o="${i}">${o.t}</button>`).join('')}</div></div>`;
  bindTop();
  view.querySelectorAll('[data-o]').forEach(b => b.onclick = () => {
    let fightEnc = null, wait = null;
    const G = { rng: Math.random, food: n => { R.food = Math.max(0, R.food + n); }, temp: n => { R.temp = Math.max(0, Math.min(TEMP_MAX, R.temp + n)); },
      hp: n => { R.hp = Math.min(R.maxHp, R.hp + n); }, heal: n => { R.hp = Math.min(R.maxHp, R.hp + n); }, maxHp: n => { R.maxHp += n; R.hp += n; },
      upgrade: () => { wait = 'up'; }, addCard: id => R.deck.push(mk(id)), fight: enc => { fightEnc = enc; } };
    const msg = ev.opts[+b.dataset.o].f(G); save();
    const after = () => { if (R.hp <= 0) { R.hp = 0; return endScreen(false, '倒在了林海雪原里'); } if (fightEnc) { R.pending = { t: 'fight', enc: fightEnc }; save(); return battle(fightEnc, 'fight'); } mapScreen(); };
    const cont = () => { if (wait === 'up') return upgradePick(() => after()); after(); };
    if (msg) { view.querySelector('.evp').innerHTML = `<h2>${ev.title}</h2><p>${msg}</p><button class="btn" id="ev_ok">继续</button>`; bindTop(); $('#ev_ok').onclick = cont; } else cont();
  });
}

// ---------- 结束 ----------
function endScreen(win, how = '') {
  B = null; if (!win) clearSave(); else clearSave();
  view.innerHTML = `<div class="tbg dark"></div><div class="endw"><div class="ribbon ${win ? 'win' : ''}">${win ? '第一章 完' : '阵亡'}</div>
   <p class="endsub">${win ? '村濑的装甲车歪在雪沟里冒着黑烟。小分队没有停留，连夜向南——前面是新京城。' : `韩松${how}。`}</p>
   <table class="score"><tr><td>到达层数</td><td>${Math.max(1, R.floor)}</td></tr><tr><td>击倒敌人</td><td>${R.kills || 0}</td></tr><tr><td>牌组</td><td>${R.deck.length} 张</td></tr></table>
   ${win ? '<p class="endsub small">最小可玩版到此结束。谢谢试玩！</p>' : ''}<button class="btn big" id="e_t">回到标题</button></div>`;
  $('#e_t').onclick = () => { R = null; title(); };
}

// ---------- 键盘 ----------
addEventListener('keydown', e => {
  if (!B || B.over || document.querySelector('.overlay') || !$('#hand')) return;
  if (e.key === 'e' || e.key === 'E') endTurn();
  else if (e.key === 'r' || e.key === 'R') doReload();
  else if (e.key === 'Escape') { B.sel = -1; render(); }
  else if (/^[1-9]$/.test(e.key)) { const i = +e.key - 1; if (i < B.hand.length) clickCard(i); }
  else if ((e.key === ' ' || e.key === 'Enter') && B.sel >= 0) { e.preventDefault(); clickCard(B.sel); }
});

// ---------- 调试面板（?debug） ----------
function dbgPanel() {
  if (!DEBUG) return; $('#dbg')?.remove(); const d = document.createElement('div'); d.id = 'dbg';
  const btns = B && !B.over ? [['胜利', () => { E.alive(B).forEach(e => { e.hp = 0; e.dead = 1; e.deadAt = Date.now(); }); render(); checkEnd(); }], ['满弹', () => { B.ammo = B.cap; render(); }], ['清空弹仓', () => { B.ammo = 0; render(); }], ['枪感满', () => { B.p.feel = FEEL_MAX; render(); }],
    ['+能量', () => { B.p.energy += 3; render(); }], ['抽牌', () => { E.drawCards(B, 3); render(); }], ['给牌', () => showPile('给一张牌（加入手牌）', Object.keys(CARDS).map(id => ({ id, up: 0, uid: uidN++ })), c => { B.hand.push(c); render(); })], ['满血', () => { R.hp = R.maxHp; render(); }]]
    : R ? [['去Boss', () => { R.pos = { r: ROWS - 1, c: R.map[ROWS - 1].findIndex(Boolean) }; mapScreen(); }], ['满血', () => { R.hp = R.maxHp; mapScreen(); }], ['口粮+5', () => { R.food += 5; mapScreen(); }], ['体温0', () => { R.temp = 0; mapScreen(); }], ['精英战', () => { R.pending = { t: 'elite', enc: ENC.elite[0] }; battle(ENC.elite[0], 'elite'); }], ['缴获波波沙', () => offerLoot('c_ppsh', mapScreen)]] : [];
  btns.forEach(([t, f]) => { const b = document.createElement('button'); b.textContent = t; b.onclick = ev => { ev.stopPropagation(); f(); }; d.appendChild(b); });
  if (btns.length) stage.appendChild(d);
}
setInterval(() => { if (B && !B.busy && !B.over && E.result(B)) checkEnd(); }, 600);

title();
