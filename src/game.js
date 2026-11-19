// 《深入日军总部》界面和流程（最小可玩版：韩松 · 第一章 林海雪原）。规则在 engine.js，数据在 data.js。
import { CARDS, ENEMIES, ENC, EVENTS, STARTER, KW, TYPE, RAR, SCH, BAYONET, MAG, FEEL_MAX } from './data.js';
import * as E from './engine.js';
import { createAudio } from './audio.js';
const audio = createAudio();
let SET = { shake: 1 }; try { Object.assign(SET, JSON.parse(localStorage.getItem('ithq_set') || '{}')); } catch (e) {}
const saveSet = () => { try { localStorage.setItem('ithq_set', JSON.stringify(SET)); } catch (e) {} };

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
  $('#tbmenu') && ($('#tbmenu').onclick = () => { const o = overlay(`<h2>菜单</h2><div class="col"><button class="btn" id="m_back">继续</button><button class="btn" id="m_snd">音效：${audio.isOn() ? '开' : '关'}（M）</button><button class="btn" id="m_shk">画面震动：${SET.shake ? '开' : '关'}</button><button class="btn" id="m_title">回到标题（进度已保存）</button><button class="btn red" id="m_quit">放弃这一局</button></div>`);
    o.querySelector('#m_back').onclick = () => o.remove(); o.querySelector('#m_snd').onclick = e => { e.target.textContent = `音效：${audio.toggle() ? '开' : '关'}（M）`; }; o.querySelector('#m_shk').onclick = e => { SET.shake = SET.shake ? 0 : 1; saveSet(); e.target.textContent = `画面震动：${SET.shake ? '开' : '关'}`; }; o.querySelector('#m_title').onclick = () => { o.remove(); B = null; title(); };
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

/* 卡牌插图：同类卡共用一个图标（同旧游戏）。出图后把有图的名字加进 ICONS_READY */
const CARD_ICON = { note: 'pistol', s_beat: 'pistol', c_nambu: 'pistol', shoot: 'rifle', high: 'rifle', c_type97: 'rifle', crack: 'apround', h_shells: 'apround', h_lockon: 'helmet',
  refrain: 'scope', echo: 'scope', h_scope: 'scope', lowf: 'binoc', hs_spotter: 'binoc', h_ex: 'round', h_ricochet: 'round', standby: 'breath', skip: 'wind',
  barrage: 'smg', burst: 'smg', spread: 'smg', h_twin2: 'smg', c_ppsh: 'smg', h_sweep: 'casings', h_medkit: 'casings', c_type11: 'mg', h_drone: 'belt', expand: 'belt',
  overload: 'barrel', rapid: 'barrel', hs_quickmag: 'mag', hs_depot: 'mag', hs_medkit: 'medkit', hs_bayonet: 'bayonet', defend: 'cover' };
const ICON_NAME = { pistol: '手枪', rifle: '步枪', apround: '穿甲弹', helmet: '钢盔', scope: '准星', binoc: '望远镜', round: '子弹', breath: '屏息', wind: '风向', smg: '冲锋枪', casings: '弹壳', mg: '机枪', belt: '弹带', barrel: '枪管', mag: '弹匣', medkit: '急救包', bayonet: '刺刀', cover: '掩体' };
const ICONS_READY = new Set();
function cardHTML(c, extra = '', attrs = '') {
  const d = CARDS[c.id], cost = d.cost[c.up ? 1 : 0], ic = CARD_ICON[c.id] || 'round';
  let badge = '', cls = '';
  if (B && !B.over && extra.includes('inhand')) {
    const m = E.gunMode(B, c);
    if (m === 'bayonet') { badge = `<div class="cbadge bayo">空仓 · 拼刺 ${BAYONET}</div>`; cls = ' bayo'; }
  }
  /* 战斗中把伤害数字换成实际值：变大绿色，变小红色 */
  const live = B && !B.over && extra.includes('inhand') && d.gun && E.gunMode(B, c) === 'shoot';
  const f = x => { if (!live) return x; const v = E.previewDmg(B, d, x); return v === x ? x : `<b class="${v > x ? 'dup' : 'ddn'}">${v}</b>`; };
  const text = dsc(c, f);
  return `<div class="card t-${d.type} s-${d.sch}${c.up ? ' up' : ''}${d.gun ? ' gun' : ''}${cls} ${extra}" data-cid="${c.id}" ${attrs}>
    <div class="art">${ICONS_READY.has(ic) ? `<img src="assets/icons/${ic}.png" alt="" draggable="false">` : `<span class="ph">${ICON_NAME[ic]}</span>`}</div>
    <div class="cost">${cost}</div><div class="cname">${d.name}${c.up ? '+' : ''}</div>
    <div class="ctype">${d.sch !== '通' ? `<i class="sch s-${d.sch}">${SCH[d.sch]}</i> · ` : ''}${TYPE[d.type]}${d.rar === 'loot' ? ' · 缴获' : ''}</div>
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
  <p>· <b>装填</b>：「结束回合」上方的按钮，1 费，把弹仓装满。</p>
  <p>· <b>空仓拼刺</b>：弹仓空了，枪械牌自动变成拼刺，造成 ${BAYONET} 伤害，牌上其他效果照常。</p>
  <p>· <b>三种枪</b>：狙击牌 1 发高伤、省子弹；冲锋枪牌一次打好几发、耗弹快；手枪牌是便宜的小牌。</p>
  <p>· <b>标尺</b>：叠在敌人身上，最多 5 层，每层让狙击牌每发 +1 伤害。</p>
  <p>· <b>枪感</b>：每打一张枪械牌 +1（最多 ${FEEL_MAX}），回合结束 -1；冲锋枪牌和手枪牌每发伤害 + 枪感的一半。</p>
  <p>· <b>敌人装弹</b>：会开枪的敌人脚下也有弹仓，打空了下回合要装弹，那回合不攻击。</p>
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
  view.innerHTML = `<div class="tbg pic"></div><div class="tlogo"><h1>深入日军总部</h1><p class="en">INTO THE HQ</p><p class="en2">最小可玩版 · 第一章 林海雪原</p></div>
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
/* 逐帧动画（同旧游戏）：[帧数, 每帧毫秒, 模式] 模式 1=循环 0=播完回待机 2=停在最后一帧
   韩松：assets/hansong/idle0-3、shoot0-3、hurt0-1、down0-2、stab0-1（共 15 帧）
   敌人：assets/enemies/<名字>/idle0-1、atk0-1、hurt0、down0-1（共 7 帧）
   帧图还没画好时，用 assets/units/ 下的单张图 + 代码呼吸动作顶替 */
const HA = { idle: [4, 200, 1], shoot: [4, 75, 0], hurt: [2, 130, 0], down: [3, 220, 2], stab: [2, 140, 0] };
const EA = { idle: [2, 480, 1], atk: [2, 210, 0], hurt: [1, 320, 0], down: [2, 260, 2] };
const HERO = { dir: 'hansong', frames: true, still: 'hansong' }; /* 帧图到位后把 frames 改成 true */
/* 每套帧图切好后的画布信息：cw/ch 画布宽高，ax 脚底锚点 x，sw/sh 站立时人物宽高（切图脚本自动算出） */
const FR = { hansong: { cw: 389, ch: 291, ax: 205, sw: 182, sh: 287 }, inf: { cw: 462, ch: 404, ax: 195, sw: 359, sh: 402 },
  puppet: { cw: 555, ch: 396, ax: 278, sw: 274, sh: 394 }, dog: { cw: 635, ch: 211, ax: 360, sw: 384, sh: 153 }, mortar: { cw: 498, ch: 317, ax: 215, sw: 309, sh: 315 },
  mg: { cw: 521, ch: 216, ax: 271, sw: 393, sh: 206 }, sniper: { cw: 504, ch: 341, ax: 232, sw: 368, sh: 299 }, sergeant: { cw: 440, ch: 382, ax: 154, sw: 240, sh: 380 },
  captain_car: { cw: 312, ch: 222, ax: 149, sw: 281, sh: 208 }, captain_foot: { cw: 426, ch: 264, ax: 147, sw: 185, sh: 249 } };
/* 当前用哪套帧（村濑下车后换第二套） */
const efr = e => (e.phase === 2 && e.d.frames2) ? [e.d.frames2, e.d.artH2] : [e.d.frames, e.d.artH];
/* 帧图放进固定大小的框：框按站立姿势定大小，脚底锚点对准框的中线；倒地、前冲等超出部分露在框外 */
function frameBox(key, dispH, src, cls, alt) {
  const m = FR[key], k = dispH / m.sh;
  return `<div class="sprw" style="width:${Math.round(m.sw * k)}px;height:${dispH}px"><img class="spr art ${cls}" src="${src}" alt="${alt}" draggable="false" style="position:absolute;left:${Math.round((m.sw / 2 - m.ax) * k)}px;bottom:0;height:${Math.round(m.ch * k)}px;max-width:none"><i class="shd"></i></div>`;
}
const SHOTKIND = { 狙: 'rifle', 冲: 'smg', 手: 'pistol' };
const MUZZLE = [128, 62]; /* 韩松枪口相对脚底锚点的位置（原图像素） */
let hst = { n: 'idle', t: 0 };
function heroAct(n) { if (hst.n === 'down') return; hst = { n, t: performance.now() }; }
function frameOf(tab, st, reset) { const [c, ms, mode] = tab[st.n] || tab.idle; let k = Math.floor((performance.now() - st.t) / ms); if (k >= c) { if (mode === 1) k %= c; else if (mode === 2) k = c - 1; else { reset(); return [ 'idle', Math.floor(performance.now() / tab.idle[1]) % tab.idle[0] ]; } } return [st.n in tab ? st.n : 'idle', k]; }
function heroSrc() { if (!HERO.frames) return `assets/units/${HERO.still}.png`; const [n, k] = frameOf(HA, hst, () => { hst = { n: 'idle', t: performance.now() }; }); return `assets/${HERO.dir}/${n}${k}.png`; }
function enemySrc(e) { if (!e.d.frames) return `assets/units/${e.d.art}.png`; const fk = efr(e)[0]; const st = e.anim || { n: e.dead ? 'down' : 'idle', t: 0 }; if (e.dead && st.n !== 'down') { e.anim = { n: 'down', t: performance.now() }; } const [n, k] = frameOf(EA, e.anim || st, () => { e.anim = null; }); return `assets/enemies/${fk}/${n}${k}.png`; }
function epose(e, n) { e.anim = { n, t: performance.now() }; }
const pose = (n) => heroAct(n);
/* 预加载所有帧，第一次播放时不闪 */
const PRE = [], PREDONE = new Set();
function preload(dir, tab) { if (PREDONE.has(dir)) return; PREDONE.add(dir); Object.entries(tab).forEach(([n, [c]]) => { for (let k = 0; k < c; k++) { const im = new Image(); im.src = `assets/${dir}/${n}${k}.png`; PRE.push(im); } }); }
preload('hansong', HA); /* 敌人的帧在进战斗时才加载，手机上不用一开始就下载全部 */
/* 和旧游戏一样，每 80 毫秒刷新一次帧 */
let lastT = 0;
(function loop(t) { requestAnimationFrame(loop); if (!B || t - lastT < 80) return; lastT = t;
  const h = view.querySelector('#hero .spr.art'); if (h) { const f = heroSrc(); if (!h.src.endsWith(f)) h.src = f; }
  view.querySelectorAll('.enemy .spr.art').forEach(im => { const e = B.en.find(x => x.id === im.closest('.enemy').dataset.eid); if (e) { const f = enemySrc(e); if (!im.src.endsWith(f)) im.src = f; } });
})(0);
function motion(who, cls) { const el = view.querySelector(`[data-eid="${who}"] .sprw`); if (el) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); } }

function battle(enc, kind) {
  enc.forEach(k => { const d = ENEMIES[k]; if (d.frames) preload('enemies/' + d.frames, EA); if (d.frames2) preload('enemies/' + d.frames2, EA); });
  B = E.startBattle(R, enc, kind, E.mulberry((Math.random() * 2 ** 31) | 0)); B.sel = -1; B.busy = 0;
  render(); if (kind === 'boss') banner('讨伐队长 · 村濑'); else if (kind === 'elite') banner('精英：讨伐队军曹');
  flushMsgs();
}
function flushMsgs() { if (B && B.msgs.length) { say(B.msgs.join('\n'), 3600); B.msgs = []; } }
const ICON = { atk: '⚔', def: '🛡', buff: '⬆', debuff: '⬇', charge: '⏳', flee: '🏃', reload: '🔄', unk: '？' };
const ESIZE = { dog: [130, 80], sergeant: [120, 185], captain: [250, 170], mg: [150, 110], mortar: [110, 130] };
function enemyHTML(e) {
  const d = e.d, [w, h] = e.key === 'captain' && e.phase === 2 ? [120, 190] : (ESIZE[e.key] || [100, 160]), it = e.dead ? null : E.intentOf(B, e);
  const tg = B.sel >= 0 && B.hand[B.sel] && E.needTarget(B.hand[B.sel]) && !e.dead;
  const label = e.key === 'captain' ? (e.phase === 2 ? '村濑' : '装甲车') : d.name;
  return `<div class="unit enemy ${tg ? 'tg' : ''} ${e.dead ? 'dead' : ''} ${d.frames ? '' : 'noanim'}" data-eid="${e.id}">
    <div class="intent">${it ? `<i class="ii ii-${it.i}">${ICON[it.i]}</i>${it.text}<small>${it.name}</small>` : ''}</div>
    ${d.frames ? frameBox(efr(e)[0], efr(e)[1], enemySrc(e), '', d.name) : `<div class="sprw">${d.art ? `<img class="spr art still" src="${enemySrc(e)}" style="height:${d.artH}px" alt="${d.name}" draggable="false">` : `<div class="spr blk ${d.boss ? 'bossb' : ''}" style="width:${w}px;height:${h}px;background:${d.col}">${label}</div>`}<i class="shd"></i></div>`}
    <div class="uinfo">${barHTML(e.hp, e.max, e.block)}${e.ammo != null && !e.dead ? `<div class="eammo ${e.ammo ? '' : 'zero'}" data-k="敌人弹仓">${Array.from({ length: e.d.ammo }, (_, k) => `<i class="${k < e.ammo ? 'f' : ''}"></i>`).join('')}${e.ammo ? '' : '<b>空</b>'}</div>` : ''}<div class="badges">${e.armor ? `<b class="arm" data-k="装甲">🛡 装甲 ${e.armor}</b>` : ''}${e.marks ? `<b class="mark" data-k="标尺">🎯 标尺 ${e.marks}</b>` : ''}${stsHTML(e.st)}</div></div></div>`;
}
/* 血条：格挡是左边的蓝色圆圈（同旧游戏） */
function barHTML(hp, max, blk) {
  return `<div class="hpw">${blk ? `<b class="blkv">${blk}</b>` : ''}<div class="bar ${blk ? 'blk' : ''}"><i style="width:${Math.max(0, hp) / max * 100}%"></i><span>${Math.max(0, hp)}/${max}</span></div></div>`;
}
const STN = { weak: ['虚弱', '#c8a0ff'], vuln: ['易伤', '#ff9a6a'], str: ['力量', '#ff6a5a'] };
const stsHTML = st => Object.entries(st).filter(([k]) => STN[k]).map(([k, n]) => `<b class="st" style="color:${STN[k][1]};border-color:${STN[k][1]}" data-k="${STN[k][0]}">${STN[k][0]} ${n}</b>`).join('');
/* 弹仓挂在韩松脚下（旧游戏的光弹也是这样显示的） */
function ammoHTML() {
  const pips = B.cap <= 16 ? Array.from({ length: B.cap }, (_, k) => `<i class="${k < B.ammo ? 'f' : ''}"></i>`).join('') : `<em class="mbar"><u style="width:${B.ammo / B.cap * 100}%"></u></em>`;
  return `<div class="ammo ${B.ammo ? '' : 'zero'}" data-k="弹仓"><span class="pips">${pips}</span><b>${B.ammo}/${B.cap}</b></div>
   <div class="badges"><b class="feelc" data-k="枪感">枪感 ${B.p.feel}${B.p.feel >= 2 ? `（+${Math.floor(B.p.feel / 2)}）` : ''}</b>${stsHTML(B.p.st)}${Object.keys(B.p.pw).map(k => `<b class="pw">${({ scope: '瞄准镜', depot: '备用弹匣', rapid: '枪感训练', quick: '快换弹匣' })[k]}</b>`).join('')}</div>`;
}
function reloadBtn() {
  const why = E.cantReload(B), c = E.reloadCost(B);
  const lab = why === '弹仓已满' ? '弹仓已满' : `装填 <small>${c} 费${TOUCH ? '' : ' · R'}</small>`;
  return `<button class="btn reload ${!why ? 'hot' : ''} ${!B.ammo && !why ? 'urgent' : ''}" id="reload" ${why || B.busy ? 'disabled' : ''}>${lab}</button>`;
}
/* 手牌：扇形排开，只露上半截（费用、插图、卡名），鼠标移上去 / 手机按住才看说明（同旧游戏） */
function handLayout() {
  const n = B.hand.length, HZ = TOUCH ? 1.45 : 1, cw = 150, W = TOUCH ? (SW - 560) / HZ : SW - 300, gap = Math.min(cw + 6, (W - cw) / Math.max(1, n - 1));
  const x0 = TOUCH ? (SW / HZ - (gap * (n - 1) + cw)) / 2 : (W - (gap * (n - 1) + cw)) / 2;
  return { n, HZ, gap, x0 };
}
function render() {
  if (!B) return;
  const { n, gap, x0 } = handLayout();
  const hand = B.hand.map((c, i) => {
    const mid = (n - 1) / 2, sel = B.sel === i, rot = (i - mid) * 3, dy = Math.abs(i - mid) ** 2 * 2.2, off = E.cantPlay(B, c);
    return cardHTML(c, `inhand ${sel ? 'sel' : ''} ${off ? 'off' : ''}`, `data-i="${i}" style="left:${x0 + i * gap}px;transform:translateY(${sel ? -100 : dy}px) rotate(${sel ? 0 : rot}deg);z-index:${sel ? 60 : i + 1}"`);
  }).join('');
  const inc = E.incoming(B);
  view.innerHTML = `<div class="bg battle"></div>${topBar()}
   <div id="hero" class="unit" data-eid="hero"><div class="intent"></div>${HERO.frames ? frameBox('hansong', TOUCH ? 235 : 250, heroSrc(), '', '韩松') : `<div class="sprw"><img class="spr art still" src="${heroSrc()}" style="height:${TOUCH ? 235 : 250}px" alt="韩松" draggable="false"><i class="shd"></i></div>`}
    <div class="uinfo">${barHTML(R.hp, R.maxHp, B.p.block)}${ammoHTML()}${inc ? `<div class="inc ${inc > B.p.block ? 'low' : 'ok'}">受到 ${Math.max(0, inc - B.p.block)}</div>` : ''}</div></div>
   <div id="enemies">${B.en.filter(e => !(e.dead && Date.now() - e.deadAt > 1400)).map(enemyHTML).join('')}</div>
   <div id="energy" class="${B.p.energy ? '' : 'empty'}">${B.p.energy}/${E.ENERGY}</div>
   ${reloadBtn()}<button class="btn" id="endturn" ${B.busy ? 'disabled' : ''}>${B.busy ? '敌人回合' : `结束回合${TOUCH ? '' : ' <small>E</small>'}`}</button>
   <div class="pile" id="drawp">抽牌<b>${B.draw.length}</b></div><div class="pile" id="discp">弃牌<b>${B.disc.length}</b></div><div class="pile" id="exhp">消耗<b>${B.exh.length}</b></div>
   <div id="hand">${hand}</div>${B.sel >= 0 ? `<div id="tip" class="stay">点一个敌人打出（${TOUCH ? '点空白处取消' : 'Esc 取消'}）</div>` : ''}`;
  bindTop();
  $('#endturn').onclick = endTurn; $('#reload').onclick = doReload;
  $('#drawp').onclick = () => showPile('抽牌堆（顺序已打乱）', [...B.draw].sort((a, b) => a.id < b.id ? -1 : 1));
  $('#discp').onclick = () => showPile('弃牌堆', B.disc);
  $('#exhp').onclick = () => showPile('消耗', B.exh);
  view.querySelectorAll('#hand .card').forEach(el => {
    el.onclick = ev => { ev.stopPropagation(); if (DRAGGED) return; clickCard(+el.dataset.i); };
    if (!TOUCH) { el.onmouseenter = () => kwShow(el); el.onmouseleave = kwHide; }
  });
  view.querySelectorAll('.enemy').forEach(el => el.onclick = ev => { ev.stopPropagation(); clickEnemy(el.dataset.eid); });
  view.querySelectorAll('.badges b[data-k], .ammo[data-k], .eammo[data-k]').forEach(el => el.onclick = ev => { ev.stopPropagation(); const k = el.dataset.k; tipBox(`<b>${k}</b>：${KW[k] || ({ 力量: '每次攻击伤害增加等同层数。', 敌人弹仓: '会开枪的敌人也有弹仓，每开一轮枪少一格；打空了下回合要「装弹」，那回合不会攻击。' })[k] || ''}`); });
  view.querySelector('.bg').onclick = () => { kwHide(); if (B.sel >= 0) { B.sel = -1; render(); } };
  fitEnemies(); flushFx(); dbgPanel();
}
/* 关键词说明框：贴在牌的旁边 */
function kwShow(el) {
  kwHide(); const c = B && B.hand[+el.dataset.i]; if (!c) return; const L = kwOf(c), why = E.cantPlay(B, c);
  const s = stage._s || 1, sr = stage.getBoundingClientRect(), r = el.getBoundingClientRect(), bw = TOUCH ? 380 : 270;
  const box = document.createElement('div'); box.id = 'kwbox';
  box.innerHTML = `${L.map(k => `<p><b>${k}</b>${KW[k]}</p>`).join('')}${why ? `<p class="hint bad">⚠ ${why}</p>` : `<p class="hint">${TOUCH ? '往上拖动打出' : E.needTarget(c) && E.alive(B).length > 1 ? '点牌后再点敌人，或直接拖到敌人身上' : '点击打出，或往上拖'}</p>`}`;
  const right = (r.right - sr.left) / s + 14, left = (r.left - sr.left) / s - 14 - bw;
  box.style.left = (right + bw < SW - 10 ? right : Math.max(10, left)) + 'px'; box.style.bottom = (TOUCH ? 250 : 200) + 'px'; box.style.width = bw + 'px';
  stage.appendChild(box);
}
function kwHide() { $('#kwbox')?.remove(); }
/* 敌人一排太宽、会挤到韩松身上时，整排按比例缩小 */
function fitEnemies() { const row = $('#enemies'), hero = $('#hero .sprw'); if (!row || !hero) return; row.style.transform = '';
  const s = stage._s || 1, rr = row.getBoundingClientRect(), hr = hero.getBoundingClientRect(), room = (rr.right - hr.right) / s - 40, w = rr.width / s;
  if (w > room && room > 80) { row.style.transformOrigin = 'right bottom'; row.style.transform = `scale(${Math.max(.6, room / w)})`; } }
/* 电脑：点一下打出（要选目标的牌先点牌再点敌人）。手机：点一下放大看牌，拖上去才打出（防误触） */
function clickCard(i) {
  if (!B || B.busy || B.over || B.anim) return; const c = B.hand[i]; if (!c) return;
  if (TOUCH) return;
  const why = E.cantPlay(B, c); if (why) { tip(why); return; }
  if (E.needTarget(c)) { const a = E.alive(B); if (a.length === 1) return play(i, a[0].id); B.sel = B.sel === i ? -1 : i; kwHide(); render(); return; }
  play(i);
}
function clickEnemy(id) {
  if (!B || B.busy || B.over || B.anim || B.sel < 0) return; const c = B.hand[B.sel]; if (!c) return;
  const why = E.cantPlay(B, c); if (why) { tip(why); return; }
  play(B.sel, id);
}
/* 出牌：牌先飞到中间，效果在飞的途中结算（同旧游戏） */
async function play(i, tid) {
  const c = B.hand[i]; if (!c || B.anim) return; const d = CARDS[c.id], why = E.cantPlay(B, c); if (why) { tip(why); return; }
  const mode = E.gunMode(B, c), el = view.querySelector(`#hand .card[data-i="${i}"]`);
  B.anim = 1; B.sel = -1; kwHide(); audio.card();
  if (el) { flyCard(el, d.type); el.style.visibility = 'hidden'; }
  await sleep(170);
  if (!B || !B.hand.includes(c)) { if (B) B.anim = 0; return; }
  E.playCard(B, B.hand.indexOf(c), tid);
  B.shotKind = mode === 'shoot' ? SHOTKIND[d.sch] : null;
  if (mode === 'shoot') heroAct('shoot');
  else if (mode === 'bayonet') { heroAct('stab'); setTimeout(() => motion('hero', 'dash'), 0); audio.stab(); }
  B.anim = 0; render(); flushMsgs();
  if (mode === 'bayonet') say('弹仓空了，端起刺刀！', 1500);
  await checkEnd();
}
function flyCard(el, type) {
  const sc = stage._s || 1, sr = stage.getBoundingClientRect(), r = el.getBoundingClientRect();
  const cl = el.cloneNode(true); cl.removeAttribute('data-i'); cl.classList.remove('sel', 'off', 'peek', 'dragging');
  cl.style.cssText = `position:absolute;left:${(r.left - sr.left) / sc}px;top:${(r.top - sr.top) / sc}px;z-index:80;transform:none;margin:0;pointer-events:none`;
  fxl.appendChild(cl); cl.getBoundingClientRect();
  cl.style.transition = 'left .18s ease-out,top .18s ease-out,transform .18s ease-out';
  cl.style.left = (SW / 2 - 75) + 'px'; cl.style.top = '170px'; cl.style.transform = 'scale(1.25)';
  setTimeout(() => { cl.style.transition = 'all .28s ease-in'; cl.style.opacity = '0'; cl.style.transform = type === 'power' ? 'scale(1.8)' : `translate(${SW / 2 - 150}px,330px) scale(.3) rotate(25deg)`; }, 300);
  setTimeout(() => cl.remove(), 650);
}
function doReload() {
  if (!B || B.busy || B.over || B.anim) return;
  const why = E.cantReload(B); if (why) { tip(why); return; }
  if (E.reload(B)) { B.sel = -1; audio.reload(); render(); motion('hero', 'recoil'); flushMsgs(); }
}
async function endTurn() {
  if (!B || B.busy || B.over || B.anim) return;
  B.busy = 1; B.sel = -1; kwHide(); E.endPlayerTurn(B); render();
  await sleep(350);
  for (const e of B.en.filter(x => !x.dead)) {
    if (B.over) break;
    const m = e.d.moves[e.move];
    if (m && m.d) { epose(e, 'atk'); motion(e.id, 'lunge'); const melee = /刺|刀|咬|扑|撞/.test(m.t); setTimeout(() => melee ? audio.stab() : audio.shot(e.key === 'mg' || (e.key === 'captain' && e.move === 'mgun') ? 'smg' : e.key === 'sergeant' || e.move === 'pistol' ? 'pistol' : 'rifle'), 120); await sleep(180); }
    if (m && m.i === 'reload') audio.reload();
    E.enemyAct(B, e); render(); flushMsgs(); await sleep(m && m.d ? 560 : 380);
  }
  if (await checkEnd()) return;
  E.startTurn(B); B.busy = 0; render(); flushMsgs();
}
async function checkEnd() {
  const r = E.result(B); if (!r) return false;
  B.busy = 1; await sleep(800);
  if (r === 'lose') { heroAct('down'); audio.lose(); await sleep(900); endScreen(false, '倒在了林海雪原里'); return true; }
  const kind = B.kind, en = B.en; B.over = 'win'; audio.win();
  if (kind === 'boss') { R.hp = Math.max(1, R.hp); clearSave(); endScreen(true); return true; }
  winRewards(kind, en); return true;
}

// ---------- 拖动出牌（移植自旧游戏）：手机只拖动，电脑点击和拖动都可以 ----------
let DR = null, DRAGGED = false;
const stXY = ev => { const s = stage._s || 1, r = stage.getBoundingClientRect(); return [(ev.clientX - r.left) / s, (ev.clientY - r.top) / s]; };
const enemyAt = ev => { const el = document.elementFromPoint(ev.clientX, ev.clientY); const en = el && el.closest && el.closest('.enemy'); const e = en && B && B.en.find(x => x.id === en.dataset.eid); return e && !e.dead ? e : null; };
const aimMark = id => { view.querySelectorAll('.enemy.aim').forEach(x => x.classList.remove('aim')); if (id) view.querySelector(`.enemy[data-eid="${id}"]`)?.classList.add('aim'); };
view.addEventListener('pointerdown', ev => {
  const el = ev.target.closest && ev.target.closest('#hand .card'); if (!el || !B || B.busy || B.over || B.anim || ev.button > 0) return;
  const i = +el.dataset.i, c = B.hand[i]; if (!c) return; const [x, y] = stXY(ev), r = el.getBoundingClientRect(), s = stage._s || 1, sr = stage.getBoundingClientRect();
  DR = { i, el, x0: x, y0: y, moved: false, tgt: E.needTarget(c), cx: (r.left + r.width / 2 - sr.left) / s, cy: (r.top - sr.top) / s + 20 };
  ev.preventDefault(); DRAGGED = false;
  if (TOUCH) { view.querySelectorAll('#hand .card.peek').forEach(x => x.classList.remove('peek')); el.classList.add('peek'); kwShow(el); }
});
addEventListener('pointermove', ev => {
  if (!DR || !B) return; const [x, y] = stXY(ev); if (!DR.moved && Math.hypot(x - DR.x0, y - DR.y0) < 14) return;
  if (!DR.moved) { DR.moved = true; DRAGGED = true; kwHide(); DR.el.classList.remove('peek'); DR.el.classList.add('dragging'); }
  if (DR.tgt) {
    DR.el.style.setProperty('--dt', 'translateY(-40px) scale(1.05) rotate(0deg)'); let ln = $('#aimline');
    if (!ln) { ln = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); ln.id = 'aimline'; ln.setAttribute('style', `position:absolute;left:0;top:0;width:${SW}px;height:720px;z-index:85;pointer-events:none;overflow:visible`); stage.appendChild(ln); }
    /* 杀戮尖塔式箭头：沿曲线排一串由小变大的箭头块，指到敌人时变红 */
    const e = enemyAt(ev), col = e ? '#ff5a4a' : '#ffd35a', x0 = DR.cx, y0 = DR.cy - 40, cx = (x0 + x) / 2, cy = Math.min(y0, y) - 160, N = 11;
    const P = t => [(1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x, (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y];
    let h = '';
    for (let k = 1; k < N; k++) { const t = k / N, [px, py] = P(t), [qx, qy] = P(t + .01), a = Math.atan2(qy - py, qx - px) * 180 / Math.PI, sz = 9 + 15 * t;
      h += `<path d="M${-sz},${-sz} L${sz * .6},0 L${-sz},${sz} L${-sz * .4},0 Z" fill="${col}" stroke="#2a1a08" stroke-width="3" transform="translate(${px},${py}) rotate(${a})"/>`; }
    const [ex, ey] = P(.97), ang = Math.atan2(y - ey, x - ex) * 180 / Math.PI;
    h += `<path d="M-38,-38 L30,0 L-38,38 L-18,0 Z" fill="${col}" stroke="#2a1a08" stroke-width="3" transform="translate(${x},${y}) rotate(${ang})"/>`;
    ln.innerHTML = h; aimMark(e ? e.id : null);
  } else { DR.el.style.setProperty('--dt', `translate(${x - DR.x0}px,${y - DR.y0}px) scale(1.08)`); DR.el.classList.toggle('ready', y < 470); }
});
addEventListener('pointerup', ev => {
  if (!DR || !B) { DR = null; return; } const d = DR, [, y] = stXY(ev);
  if (!d.moved) { DR = null; return; }
  const e = d.tgt ? enemyAt(ev) : null; DR = null; $('#aimline')?.remove(); aimMark(null); setTimeout(() => { DRAGGED = false; }, 50);
  const c = B.hand[d.i], why = c && E.cantPlay(B, c);
  if (why && (e || y < 470)) { tip(why); render(); return; }
  if (d.tgt) { const a = E.alive(B); if (e) return play(d.i, e.id); if (a.length === 1 && y < 470) return play(d.i, a[0].id); }
  else if (y < 470) return play(d.i);
  render();
});
addEventListener('pointercancel', () => { if (DR) { DR = null; $('#aimline')?.remove(); aimMark(null); render(); } });

// ---------- 打击感：子弹、枪口火光、弹壳、伤害数字、重击停顿、震屏 ----------
function flushFx() {
  const s = stage._s || 1, sr = stage.getBoundingClientRect(), count = {};
  const pos = who => { const el = view.querySelector(`[data-eid="${who}"] .sprw`); if (!el) return null; const r = el.getBoundingClientRect(); return { cx: (r.left + r.width / 2 - sr.left) / s, top: (r.top - sr.top) / s, h: r.height / s, right: (r.right - sr.left) / s }; };
  const later = (ms, f) => ms > 0 ? setTimeout(f, ms) : f();
  const add = (cls, x, y, ms, css = '') => { const d = document.createElement('div'); d.className = cls; d.style.cssText = `left:${x}px;top:${y}px;${css}`; fxl.appendChild(d); setTimeout(() => d.remove(), ms); return d; };
  const kind = B.shotKind, gap = kind === 'smg' ? 85 : kind === 'pistol' ? 110 : 0;
  let t = 0, shotN = 0, bigShake = false;
  const hp = pos('hero');
  for (const f of B.fx) {
    const p = pos(f.who); if (!p) continue;
    if (f.cls === 'bul') {
      if (!hp) continue; const at = t; t += gap || 40; shotN++;
      const k = hp.h / FR.hansong.sh, mx = HERO.frames ? hp.cx + MUZZLE[0] * k : hp.right - 8, my = hp.top + (HERO.frames ? MUZZLE[1] * k : hp.h * .27), ty = p.top + p.h * .4;
      later(at, () => {
        audio.shot(kind || 'rifle');
        if (!(HERO.frames && kind === 'rifle')) add('muzzle', mx, my, 120); motion('hero', 'recoil'); /* 步枪的火光帧图里已经画了 */
        const b = add('bullet', mx, my, 400); b.style.setProperty('--dx', (p.cx - mx) + 'px'); b.style.setProperty('--dy', (ty - my) + 'px');
        if (kind !== 'rifle') { const c = add('casing', mx - 40, my + 10, 650); c.style.setProperty('--dx', (-30 - Math.random() * 40) + 'px'); c.style.setProperty('--r', (200 + Math.random() * 400) + 'deg'); }
      });
      f.at = at + 110; continue;
    }
    const at = f.who !== 'hero' && f.cls === 'dmg' && shotN ? Math.max(0, t - (gap || 40)) + 110 : f.who === 'hero' ? 0 : t;
    count[f.who] = (count[f.who] || 0) + 1; const k = count[f.who];
    const n = parseInt(String(f.text).replace('-', '')) || 0, big = f.cls === 'dmg' && n >= 12;
    if (big && f.who !== 'hero') bigShake = true;
    later(at, () => {
      const d = add('fxn ' + f.cls + (big ? ' crit' : ''), p.cx + (k - 1) * 14, p.top + 10 + (f.cls === 'st' ? (k - 1) * 24 : 0), 1300);
      d.textContent = f.text;
      if (f.cls === 'dmg') {
        motion(f.who, big ? 'hitbig' : 'hitf'); add('impact' + (big ? ' big' : ''), p.cx, p.top + p.h * .42, 260);
        for (let q = 0; q < (TOUCH ? 4 : 7) + (big ? 5 : 0); q++) { const an = Math.random() * 6.28, dist = 40 + Math.random() * (big ? 120 : 70);
          const sp = add('spark', p.cx, p.top + p.h * .45, 600, f.who === 'hero' ? 'background:#ff5a4a' : ''); sp.style.setProperty('--dx', Math.cos(an) * dist + 'px'); sp.style.setProperty('--dy', Math.sin(an) * dist + 'px'); }
        if (f.who === 'hero') { audio.hurt(); heroAct('hurt'); shake(); }
        else { audio.hit(big); const e = B && B.en.find(x => x.id === f.who); if (e) { if (e.dead && !e.sfxDead) { e.sfxDead = 1; epose(e, 'down'); setTimeout(() => audio.kill(), 120); } else if (!e.dead) epose(e, 'hurt'); } }
        if (big) shake(true);
      } else if (f.cls === 'blk' && f.text === '格挡') audio.block();
    });
  }
  B.fx = []; B.shotKind = null;
}
function shake(hard) { if (!SET.shake) return; view.classList.remove('shake', 'shake2'); void view.offsetWidth; view.classList.add(hard ? 'shake2' : 'shake'); }

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
  else if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && B.sel >= 0) { const a = E.alive(B); B.aimI = ((B.aimI || 0) + (e.key === 'ArrowRight' ? 1 : -1) + a.length) % a.length; aimMark(a[B.aimI].id); e.preventDefault(); }
  else if ((e.key === 'Enter' || e.key === ' ') && B.sel >= 0) { e.preventDefault(); const a = E.alive(B); play(B.sel, a[(B.aimI || 0) % a.length].id); }
});

// ---------- 调试面板（?debug） ----------
function dbgPanel() {
  if (!DEBUG) return; $('#dbg')?.remove(); const d = document.createElement('div'); d.id = 'dbg';
  const btns = B && !B.over ? [['胜利', () => { E.alive(B).forEach(e => { e.hp = 0; e.dead = 1; e.deadAt = Date.now(); }); render(); checkEnd(); }], ['满弹', () => { B.ammo = B.cap; render(); }], ['清空弹仓', () => { B.ammo = 0; render(); }], ['枪感满', () => { B.p.feel = FEEL_MAX; render(); }],
    ['+能量', () => { B.p.energy += 3; render(); }], ['抽牌', () => { E.drawCards(B, 3); render(); }], ['给牌', () => showPile('给一张牌（加入手牌）', Object.keys(CARDS).map(id => ({ id, up: 0, uid: uidN++ })), c => { B.hand.push(c); render(); })], ['满血', () => { R.hp = R.maxHp; render(); }]]
    : R ? [['去Boss', () => { R.pos = { r: ROWS - 1, c: R.map[ROWS - 1].findIndex(Boolean) }; mapScreen(); }], ['满血', () => { R.hp = R.maxHp; mapScreen(); }], ['口粮+5', () => { R.food += 5; mapScreen(); }], ['体温0', () => { R.temp = 0; mapScreen(); }], ['精英战', () => { R.pending = { t: 'elite', enc: ENC.elite[0] }; battle(ENC.elite[0], 'elite'); }], ['犬机狙', () => battle(['dog', 'mg', 'sniper'], 'fight')], ['伪掷步', () => battle(['puppet', 'mortar', 'puppet'], 'fight')], ['Boss战', () => { R.pending = { t: 'boss', enc: ENC.boss[0] }; battle(ENC.boss[0], 'boss'); }], ['缴获波波沙', () => offerLoot('c_ppsh', mapScreen)]] : [];
  btns.forEach(([t, f]) => { const b = document.createElement('button'); b.textContent = t; b.onclick = ev => { ev.stopPropagation(); f(); }; d.appendChild(b); });
  if (btns.length) stage.appendChild(d);
}
setInterval(() => { if (B && !B.busy && !B.over && E.result(B)) checkEnd(); }, 600);

title();
