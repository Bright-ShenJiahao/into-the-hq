// 《长夜将尽》界面和流程。规则在 engine.js；内容（角色、章节、物品）在 content/，由 data.js 汇总。
import { CARDS, ENEMIES, CHARS, CHAPTERS, RELICS, ITEMS, ITEM_SLOTS, FRAMES, BLOCK_SIZE, KW, TYPE, RAR, SCH, BAYONET, SAVE_VERSION } from './data.js';
import * as E from './engine.js';
import { createAudio } from './audio.js';
import { MENTOR, TUT, HIST, TERMS, MARTYRS, PEOPLE, ARCHIVE } from './content/codex.js';
import { ITC } from './content/ch3.js';
import { PID, FRAGS, FRAG_PLAN, NPC, TALK_HS_MURASE, ADV_CH1_OPEN, ADV_CH1_END, ADV_CH2_OPEN, ADV_CH2_END } from './content/story.js';
const audio = createAudio();
let SET = { shake: 1, tut: 1 }; try { Object.assign(SET, JSON.parse(localStorage.getItem('ithq_set') || '{}')); } catch (e) {}
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
/* 卡牌说明窗口比较小：字放不下就逐步缩小字号（同旧游戏的 fitCard） */
function fitCard(c) { const box = c.querySelector('.cdesc'), sp = box && box.querySelector('span'); if (!sp) return; if (!box.clientHeight) { if ((c._fr = (c._fr || 0) + 1) < 20) requestAnimationFrame(() => fitCard(c)); return; }
  let f = 12.5; sp.style.fontSize = ''; while ((sp.offsetHeight > box.clientHeight - 2 || sp.scrollWidth > box.clientWidth) && f > 8) { f -= .5; sp.style.fontSize = f + 'px'; }
  const nm = c.querySelector('.cname'); if (nm) { let g = 16; nm.style.fontSize = ''; while (nm.scrollWidth > nm.clientWidth + 1 && g > 10) { g -= .5; nm.style.fontSize = g + 'px'; } } }
new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1) { if (n.classList.contains('card')) fitCard(n); n.querySelectorAll && n.querySelectorAll('.card').forEach(fitCard); } }).observe(document.getElementById('stage'), { childList: true, subtree: true });

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

// ---------- 存档（带版本号；老存档自动升级，不会读坏） ----------
const SAVE = 'ithq_run_v1';
const mk = (id, up = 0) => ({ id, up, uid: uidN++ });
const save = () => { try { localStorage.setItem(SAVE, JSON.stringify(R)); } catch (e) {} };
const clearSave = () => { try { localStorage.removeItem(SAVE); } catch (e) {} };
function migrate(s) {
  if ((s.v || 1) < 2) { s.char = s.char || 'hansong'; s.relics = s.relics || [CHARS.hansong.startRelic]; s.items = s.items || []; s.act = s.act || 1; s.intel = s.intel || 0; s.steps = s.steps || 0; }
  s.v = SAVE_VERSION; return s;
}
function load() {
  try { let s = JSON.parse(localStorage.getItem(SAVE)); if (!s || !Array.isArray(s.deck) || !Array.isArray(s.map)) return null;
    s = migrate(s); if (!CHARS[s.char]) return null;
    s.deck = s.deck.filter(c => CARDS[c.id]); s.relics = s.relics.filter(id => RELICS[id]); s.items = s.items.filter(id => ITEMS[id]);
    if (s.pending && s.pending.list) s.pending.list = s.pending.list.filter(id => CARDS[id]);
    uidN = 1 + Math.max(0, ...s.deck.map(c => c.uid || 0)); return s; } catch (e) { return null; }
}
const TEMP_MAX = 10;
const CH = () => CHAPTERS[Math.min(CHAPTERS.length, (R && R.act) || 1) - 1];
const CHR = () => CHARS[(R && R.char) || 'hansong'];
const ROWSOF = () => (R && R.map && R.map.length) || CH().rows; /* 老存档是 9 层，按存档里的层数来 */
const has = id => !!(R && R.relics && R.relics.includes(id));
/* 第二章起用「可疑度」代替体温：0—10。≥5 警觉（战斗多一个巡警）；满 10 暴露（下一格变成宪兵搜捕） */
const SUS = () => CH().res === 'sus';
const SUS_MAX = 10;
const addSus = n => { R.sus = Math.max(0, Math.min(SUS_MAX, (R.sus || 0) + n)); };
/* 第三章用「理智」代替：0—10 */
const SAN = () => CH().res === 'san';
const addSan = n => { R.san = Math.max(0, Math.min(10, (R.san == null ? 10 : R.san) + n)); };
const segOf = r => (CH().seg ? CH().seg(r) : 0);
const hasFlag = k => (R.flags || []).includes(k);
/* 「他们」：这一局帮过你的人和他们后来怎么样了（结算页显示） */
const they = (name, fate, final) => { R.they = R.they || {}; const o = R.they[name] || {}; if (final || !o.fate) R.they[name] = { fate: final ? `${o.fate ? o.fate + '。' : ''}${fate}` : fate, final: !!final }; };
const placeName = t => (CH().places && CH().places[t] && CH().places[t].name) || NODE[t][1];
const placeText = (t, def) => (CH().places && CH().places[t] && CH().places[t].text) || def;
const rflag = k => !!(R && R.relics && R.relics.some(id => RELICS[id] && RELICS[id][k]));
const rsum = (k, ...a) => (R && R.relics || []).reduce((s, id) => s + (RELICS[id] && typeof RELICS[id][k] === 'function' ? (RELICS[id][k](R, ...a) || 0) : 0), 0);
const COLS = 5;
function newRun(char = 'hansong') {
  uidN = 1; const C = CHARS[char];
  R = { v: SAVE_VERSION, char, act: 1, hp: C.hp, maxHp: C.hp, deck: C.starter.map(id => mk(id)), relics: [C.startRelic], items: [], intel: 0,
    temp: TEMP_MAX, food: 6, pos: null, path: [], floor: 0, steps: 0, fights: 0, kills: 0 };
  R.map = genMap(); see('r:' + C.startRelic); save();
}

// ---------- 地图（照通往顶端 / 杀戮尖塔的规则，参数在章节表里） ----------
function genMap() {
  const C = CH(), ROWS = C.rows;
  const g = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  const node = (r, c) => g[r][c] || (g[r][c] = { r, c, next: [], type: null, jx: rnd(-14, 14), jy: rnd(-8, 8) });
  const crosses = (r, c, n) => g[r].some(o => o && o.c !== c && o.next.some(n2 => (o.c < c && n2 > n) || (o.c > c && n2 < n)));
  let first = -1;
  for (let p = 0; p < 6; p++) {
    let c = rnd(0, COLS - 1); if (p === 1) while (c === first) c = rnd(0, COLS - 1); if (p === 0) first = c;
    for (let r = 0; r < ROWS; r++) {
      const nd = node(r, c); if (r === ROWS - 1) break;
      const cand = [c - 1, c, c + 1].sort(() => Math.random() - .5).filter(n => n >= 0 && n < COLS && !crosses(r, c, n));
      const n = cand.length ? cand[0] : c; if (!nd.next.includes(n)) nd.next.push(n); c = n;
    }
  }
  const W = C.nodes, FIX = C.fixed, SPECIAL = ['elite', 'rest', 'shop', 'treasure'];
  for (let r = 0; r < ROWS; r++) for (const nd of g[r]) {
    if (!nd) continue;
    if (FIX[r]) { nd.type = FIX[r]; continue; }
    const parents = g[r - 1].filter(o => o && o.next.includes(nd.c)).map(o => o.type);
    const nextFixed = FIX[r + 1];
    const ok = Object.entries(W).filter(([t]) => !((t === 'elite' || t === 'rest') && r < C.earliest) && !(t === nextFixed) && !(SPECIAL.includes(t) && parents.includes(t)));
    let tot = 0, x; ok.forEach(([, w]) => tot += w); x = Math.random() * tot;
    for (const [t, w] of ok) { x -= w; if (x <= 0) { nd.type = t; break; } }
    nd.type = nd.type || 'fight';
  }
  const all = g.flat().filter(Boolean);
  if (!all.some(n => n.type === 'elite')) { const f = all.filter(n => n.type === 'fight' && n.r >= C.earliest && !FIX[n.r]); if (f.length) pickOne(f).type = 'elite'; }
  /* 加强精英：更难，打赢得到一份情报（真结局要集齐三份，同通往顶端的钥匙） */
  const el = all.filter(n => n.type === 'elite'); if (el.length) pickOne(el).strong = 1;
  return g;
}
const NODE = { fight: ['战', '战斗', '#8a4a32'], elite: ['精', '精英', '#7a1a1a'], event: ['?', '未知', '#3a5a7a'], rest: ['营', '密营', '#2f6a3a'], shop: ['乡', '老乡', '#8a6a2a'], treasure: ['藏', '物资埋藏点', '#5a4a3a'] };
const NODE_ICONS = new Set(['fight', 'elite', 'event', 'rest', 'shop', 'treasure', 'cur', 'boss']); /* 已经出图的节点图标 */
/* 章节地图：从下（江边起点）往上（讨伐队据点）走，同杀戮尖塔；第三章反过来从上往下钻。位置全部按章节表里的比例算 */
const NODE_ART = true;
const MAPD = () => CH().map;
const nodeX = nd => { const m = MAPD(), cols = COLS; return Math.round(m.w * (m.xMin + (m.xMax - m.xMin) * nd.c / (cols - 1))) + (nd.jx || 0); };
const mapY = nd => { const m = MAPD(), n = ROWSOF(); return Math.round(m.h * (m.startY - (m.startY - m.endY) * nd.r / Math.max(1, n - 1))) + (nd.jy || 0); };
const nodeIcon = t => NODE_ART && NODE_ICONS.has(t) ? `<img src="assets/ui/node_${t}.png" alt="" draggable="false">` : `<span class="ntxt" style="background:${(NODE[t] || ['', '', '#4a1414'])[2]}">${(NODE[t] || ['首'])[0]}</span>`;
function available() {
  if (!R.pos) return R.map[0].filter(Boolean);
  if (R.pos.r === ROWSOF() - 1) return ['boss'];
  const cur = R.map[R.pos.r][R.pos.c]; return cur.next.map(c => R.map[R.pos.r + 1][c]);
}

// ---------- 顶栏：生命、体温、口粮、层数、情报、背包、随身物品 ----------
function topBar() {
  view.classList.toggle('ch3', SAN()); /* 第三章：所有画面压暗 */
  const items = Array.from({ length: ITEM_SLOTS }, (_, i) => { const id = R.items[i]; return id ? `<b class="itm" data-item="${i}" title="${esc(ITEMS[id].name)}">${ITEMS[id].icon}</b>` : '<b class="itm empty"></b>'; }).join('');
  return `<div id="top"><span class="hp">❤ ${R.hp}/${R.maxHp}</span>
   ${SUS() ? `<span class="tmp sus ${R.sus >= 5 ? 'warn' : ''}" data-tip="可疑度（0—10）：城里打仗、开枪会让它上升，安全屋清零。到 5（警觉）：战斗里多一个伪满巡警。满 10（暴露）：下一格变成宪兵搜捕。">🕵 ${R.sus || 0}/10</span>` : ''}${SAN() ? `<span class="tmp sus ${R.san <= 3 ? 'warn' : ''}" data-tip="理智（0—10）：走进古墓每格 -1，有的敌人和事件也会让它下降。到 6 以下地图开始变黑；到 3 以下，眼前的东西不一定可信；到 0，下一场战斗多一个影子。火堆 +3。">🕯 理智 ${R.san}/10</span>` : ''}<span class="tmp ${R.temp < 3 ? 'warn' : ''}" ${SUS() || SAN() ? 'hidden ' : ''}data-tip="体温：每走一格 -1，到密营回满。低于 3 时，战斗第一回合少抽 1 张（不掉血）。">🌡 ${R.temp}/${TEMP_MAX}</span>
   <span class="food ${R.food <= 0 ? 'warn' : ''}" data-tip="口粮：每走 2 格吃 1 口（${(R.steps || 0) % 2 ? '下一格要吃' : '下一格不吃'}）。打赢战斗能缴获，也能拿去跟老乡换东西。断粮时，该吃的那一格改为失去 3 生命（最少留 1 点）。">🍞 ${R.food}${(R.steps || 0) % 2 ? '<small class="nxt">-1</small>' : ''}</span>
   <span class="fl">第 ${Math.max(1, R.floor)} 层</span>
   <span class="intel" data-tip="情报：地图上带「📜」的加强精英身边有押运档案箱的敌人，3 回合内打倒它就得到情报。集齐三份情报，才能走到真结局。">📜 ${R.intel || 0}/3</span>
   <span class="items" title="背包">${items}</span>
   <span class="relics">${R.relics.map(id => `<b class="rel" data-rel="${id}" title="${esc(RELICS[id].name)}">${RELICS[id].icon}</b>`).join('')}</span>
   <i class="sp"></i><button class="tb" id="tbdeck">牌组 ${R.deck.length}</button><button class="tb" id="tbrule">规则</button><button class="tb" id="tbmenu">菜单</button></div>`;
}
function bindTop() {
  $('#tbdeck') && ($('#tbdeck').onclick = () => showPile('牌组', R.deck));
  $('#tbrule') && ($('#tbrule').onclick = rules);
  $('#tbmenu') && ($('#tbmenu').onclick = () => { const o = overlay(`<h2>菜单</h2><div class="col"><button class="btn" id="m_back">继续</button><button class="btn" id="m_snd">音效：${audio.isOn() ? '开' : '关'}（M）</button><button class="btn" id="m_shk">画面震动：${SET.shake ? '开' : '关'}</button><button class="btn" id="m_codex">图鉴</button><button class="btn" id="m_tut">教程：${SET.tut ? '开' : '关'}</button><button class="btn" id="m_tutr">教程从头再讲一遍</button><button class="btn" id="m_title">回到标题（进度已保存）</button><button class="btn red" id="m_quit">放弃这一局</button></div>`);
    o.querySelector('#m_back').onclick = () => o.remove(); o.querySelector('#m_snd').onclick = e => { e.target.textContent = `音效：${audio.toggle() ? '开' : '关'}（M）`; }; o.querySelector('#m_shk').onclick = e => { SET.shake = SET.shake ? 0 : 1; saveSet(); e.target.textContent = `画面震动：${SET.shake ? '开' : '关'}`; }; o.querySelector('#m_title').onclick = () => { o.remove(); B = null; title(); }; o.querySelector('#m_codex').onclick = () => { o.remove(); codex(); }; o.querySelector('#m_tut').onclick = e => { SET.tut = SET.tut ? 0 : 1; saveSet(); e.target.textContent = `教程：${SET.tut ? '开' : '关'}`; }; o.querySelector('#m_tutr').onclick = () => { resetTut(); o.remove(); tip('教程已重置'); };
    o.querySelector('#m_quit').onclick = () => { o.remove(); clearSave(); B = null; R = null; title(); }; });
  view.querySelectorAll('[data-tip]').forEach(el => el.onclick = () => tipBox(el.dataset.tip));
  view.querySelectorAll('#top [data-rel]').forEach(el => el.onclick = () => { const r = RELICS[el.dataset.rel]; tipBox(`<b>${r.icon} ${r.name}</b>${r.rar === 'boss' ? '（Boss）' : ''}<br>${r.desc}`); });
  view.querySelectorAll('#top [data-item]').forEach(el => el.onclick = () => itemPop(+el.dataset.item));
}
/* 背包用品：点开看说明，可以使用或丢掉 */
function itemPop(i) {
  const id = R.items[i], it = ITEMS[id]; if (!it) return;
  const inBattle = !!(B && !B.over && $('#hand')), can = inBattle ? !!it.battle && !B.busy && !B.anim : !!it.map && !B;
  const o = overlay(`<div class="panel small"><h2>${it.icon} ${it.name}</h2><p>${it.desc}</p><p class="sub">${can ? '' : inBattle ? '这件东西只能在地图上用。' : '这件东西只能在战斗中用。'}</p>
    <div class="row">${can ? '<button class="btn" id="it_use">使用</button>' : ''}<button class="btn ghost" id="it_drop">丢掉</button><button class="btn ghost" id="it_x">关闭</button></div></div>`);
  o.querySelector('#it_x').onclick = () => o.remove();
  o.querySelector('#it_drop').onclick = () => { R.items.splice(i, 1); save(); o.remove(); B && !B.over ? render() : refreshScreen(); };
  if (can) o.querySelector('#it_use').onclick = () => {
    o.remove(); R.items.splice(i, 1);
    if (inBattle) { E.useItem(B, it); audio.card(); render(); flushMsgs(); checkEnd(); }
    else { it.map(R, { heal: n => { R.hp = Math.min(R.maxHp, R.hp + n); }, food: n => { R.food += n; }, temp: n => { R.temp = Math.max(0, Math.min(TEMP_MAX, R.temp + n)); }, sus: n => addSus(n), san: n => addSan(n) }); tip('用掉了' + it.name); refreshScreen(); }
    save();
  };
}

// ---------- 教程：老沈的对话框（每条只出现一次，可在菜单里关掉或重置） ----------
let TUTDONE = {}; try { TUTDONE = JSON.parse(localStorage.getItem('ithq_tut') || '{}'); } catch (e) {}
const saveTut = () => { try { localStorage.setItem('ithq_tut', JSON.stringify(TUTDONE)); } catch (e) {} };
const TUTQ = []; let tutOpen = false;
/* 通用教程用 id；角色专属的用「角色:id」 */
function teach(id, lines) {
  lines = lines || TUT[id]; if (!lines || !SET.tut || TUTDONE[id]) return;
  TUTDONE[id] = 1; saveTut();
  if (typeof lines === 'string') return hint(lines); /* 一句话的：顶上一行小字，不打断 */
  TUTQ.push(lines); if (!tutOpen) tutNext();
}
/* 一行小字提示（老沈头像 + 一句话），几秒后自己消失，点一下也能关 */
function hint(t) {
  stage.querySelectorAll('.lhint').forEach(x => x.remove());
  const h = document.createElement('div'); h.className = 'lhint';
  h.innerHTML = `<img src="${MENTOR.face}" alt=""><span><b>${MENTOR.name}</b>${esc(t)}</span>`;
  h.onclick = () => h.remove(); stage.appendChild(h); setTimeout(() => h.remove(), 6500);
}
/* 角色专属教程：on = 'play' / 'render' */
function teachChar(on, ...a) {
  if (!SET.tut || !R) return; const L = CHR().tut || [];
  for (const t of L) if (t.on === on && !TUTDONE[R.char + ':' + t.id] && t.when(B, ...a)) teach(R.char + ':' + t.id, t.lines || t.hint);
}
function tutNext() {
  const lines = TUTQ.shift(); if (!lines) { tutOpen = false; return; }
  tutOpen = true; let k = 0;
  const o = document.createElement('div'); o.className = 'overlay tutov';
  o.innerHTML = `<div class="tutl"><img src="${MENTOR.lihui}" alt="" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'tutph',textContent:'${MENTOR.name}'}))"></div>
    <div class="tutbox"><b class="tutn">${MENTOR.name}<small>${MENTOR.title}</small></b><p class="tutt"></p><span class="tutc"></span>
    <button class="tutskip">关闭全部教程</button></div>`;
  const show = () => { o.querySelector('.tutt').textContent = lines[k]; o.querySelector('.tutc').textContent = k < lines.length - 1 ? `▼ 点击继续（${k + 1}/${lines.length}）` : '▼ 点击关闭'; };
  o.onclick = ev => { if (ev.target.closest('.tutskip')) return; k++; if (k >= lines.length) { o.remove(); tutNext(); } else show(); };
  o.querySelector('.tutskip').onclick = () => { SET.tut = 0; saveSet(); TUTQ.length = 0; o.remove(); tutOpen = false; tip('教程已关闭，可在菜单里重新打开'); };
  show(); stage.appendChild(o);
}
function resetTut() { TUTDONE = {}; saveTut(); SET.tut = 1; saveSet(); }

// ---------- 图鉴（参考三国终章：页签 + 左格子 + 右详情；没遇到过的显示黑影和「？？？」） ----------
let SEEN = {}; try { SEEN = JSON.parse(localStorage.getItem('ithq_codex') || '{}'); } catch (e) {}
const saveSeen = () => { try { localStorage.setItem('ithq_codex', JSON.stringify(SEEN)); } catch (e) {} };
function see(...keys) { let ch = 0; for (const k of keys) if (k && !SEEN[k]) { SEEN[k] = 1; ch = 1; } if (ch) saveSeen(); }
const MOVE_TX = m => m.i === 'atk' ? `${m.d}${m.x ? '×' + m.x : ''} 伤害${m.weak ? `，虚弱 ${m.weak}` : ''}${m.blk ? `，格挡 ${m.blk}` : ''}`
  : m.i === 'reload' ? `装弹，这回合不攻击${m.blk ? `（格挡 ${m.blk}）` : ''}` : m.i === 'charge' ? `蓄力，下回合 ${m.next} 伤害` : m.i === 'flee' ? (m.tx || '离开战场')
  : m.i === 'def' ? `格挡 ${m.blk}` : [m.all ? `全体力量 +${m.all}` : '', m.str ? `力量 +${m.str}` : '', m.summon ? `叫来${ENEMIES[m.summon].name}` : '', m.weak ? `给你虚弱 ${m.weak}` : '', m.vuln ? `给你易伤 ${m.vuln}` : '', m.allBlk ? `全体格挡 ${m.allBlk}` : '', m.blk ? `格挡 ${m.blk}` : ''].filter(Boolean).join('，');
const enemyImg = d => d.frames ? `assets/enemies/${d.frames}/idle0.png` : '';
const portraitOf = d => `assets/portraits/${d.pic || d.key}.png`; /* pic：还没出图的敌人借用别人的头像 */
function codex(tab = 'people') {
  let sel = null; const o = document.createElement('div'); o.className = 'overlay codex'; stage.appendChild(o);
  const TABS = [['people', '人物'], ['enemy', '敌人'], ['boss', '首领'], ['card', '卡牌'], ['relic', '随身物品'], ['item', '背包'], ['term', '术语'], ['hero', '英烈录'], ['arch', '史实档案']];
  const lists = {
    enemy: () => Object.values(ENEMIES).filter(d => !d.boss).sort((a, b) => (a.elite || 0) - (b.elite || 0) || a.hp[0] - b.hp[0]).map(d => ({ k: 'e:' + d.key, d })),
    boss: () => Object.values(ENEMIES).filter(d => d.boss).map(d => ({ k: 'e:' + d.key, d })),
    card: () => Object.values(CARDS).sort((a, b) => ['basic', 'c', 'u', 'r', 'loot'].indexOf(a.rar) - ['basic', 'c', 'u', 'r', 'loot'].indexOf(b.rar)).map(d => ({ k: 'c:' + d.id, d })),
    relic: () => Object.values(RELICS).sort((a, b) => ['start', 'c', 'u', 'r', 'boss'].indexOf(a.rar) - ['start', 'c', 'u', 'r', 'boss'].indexOf(b.rar)).map(d => ({ k: 'r:' + d.id, d })),
    item: () => Object.values(ITEMS).map(d => ({ k: 'i:' + d.id, d })),
    term: () => [...Object.entries(KW).map(([n, t]) => ({ k: 't:' + n, g: '卡牌', n, t })), ...TERMS.map(([g, n, t]) => ({ k: 't:' + n, g, n, t }))],
    hero: () => MARTYRS.map(m => ({ k: 'h:' + m.n, m })),
    people: () => PEOPLE.map(p => ({ k: 'p:' + p.id, p })),
    arch: () => ARCHIVE.map(m => ({ k: 'a:' + m.n, m })),
  };
  const open = e => tab === 'term' || tab === 'hero' || tab === 'people' || tab === 'arch' || SEEN[e.k] || DEBUG && SEEN.__all;
  const RARN = { start: '初始', c: '普通', u: '罕见', r: '稀有', boss: 'Boss' };
  const cell = e => {
    const ok = open(e);
    if (tab === 'enemy' || tab === 'boss') { const d = e.d, h = Math.round(Math.min(110, d.artH * .42)); return `<div class="cd ${ok ? '' : 'lk'}" data-k="${e.k}"><img src="${enemyImg(d)}" style="height:${h}px" alt=""><span>${ok ? d.name : '？？？'}</span>${d.elite ? '<i class="tg">精英</i>' : ''}</div>`; }
    if (tab === 'card') return `<div class="cd cc ${ok ? '' : 'lk'}" data-k="${e.k}">${ok ? cardHTML({ id: e.d.id, up: 0 }) : '<div class="cback">？</div>'}</div>`;
    if (tab === 'relic' || tab === 'item') return `<div class="cd ic ${ok ? '' : 'lk'}" data-k="${e.k}"><b class="big">${e.d.icon}</b><span>${ok ? e.d.name : '？？？'}</span></div>`;
    if (tab === 'term') return `<div class="cd tm" data-k="${e.k}"><i>${e.g}</i><b>${e.n}</b></div>`;
    if (tab === 'people') return `<div class="cd pp" data-k="${e.k}">${e.p.img ? `<img src="${e.p.img}" alt="">` : '<div class="pph">立绘<br>制作中</div>'}<span>${e.p.n}</span><i class="tg ${e.p.play === '可玩' ? 'ok' : ''}">${e.p.play}</i></div>`;
    return `<div class="cd tm hero ${tab}" data-k="${e.k}"><i>${e.m.y}</i><b>${e.m.n}</b></div>`;
  };
  const detail = e => {
    if (!e && tab === 'arch') return '<p class="no">这一页记的是真实发生过的事。游戏里的人物是虚构的，但这些不是。<br><br>点左边的条目查看。每条都写明了资料来源。</p>';
    if (!e) return `<p class="no">${tab === 'hero' ? '东北抗日联军在白山黑水间坚持了十四年。这一页记的是真实的英烈；游戏里的其他人物都是虚构的。<br><br>点左边的名字看生平。' : '点左边的条目看详情。'}</p>`;
    if (!open(e)) return `<div class="pic lk">${tab === 'card' ? '<div class="cback">？</div>' : tab === 'relic' || tab === 'item' ? `<b class="big">${e.d.icon}</b>` : `<img src="${enemyImg(e.d)}" alt="">`}</div><h3>？？？</h3><p class="no">${tab === 'enemy' || tab === 'boss' ? '在战斗中第一次遇到后解锁。' : tab === 'card' ? '在战利品、老乡那里见过或拿到后解锁。' : '第一次拿到后解锁。'}</p>`;
    if (tab === 'enemy' || tab === 'boss') { const d = e.d;
      return `<div class="pic"><img src="${portraitOf(d)}" alt="" onerror="this.src='${enemyImg(d)}'"></div><h3>${d.name}</h3><span class="tg2">${d.boss ? '首领' : d.elite ? '精英' : '敌人'} · 生命 ${d.hp[0] === d.hp[1] ? d.hp[0] : d.hp.join('–')}${d.armor ? ` · 装甲 ${d.armor}` : ''}${d.ammo && (d.elite || d.boss || d.showAmmo) ? ` · 弹数 ${d.ammo}` : ''}</span>
        <h4>行 动</h4><ul>${Object.values(d.moves).map(m => `<li><b>${typeof m.t === 'function' ? m.t({ t: 0 }) : m.t}</b>：${MOVE_TX(m)}</li>`).join('')}</ul>${HIST[d.key] ? `<h4>史 实</h4><p class="hist">${HIST[d.key]}</p>` : ''}`; }
    if (tab === 'card') { const d = e.d; return `<div class="pic cards">${cardHTML({ id: d.id, up: 0 })}${cardHTML({ id: d.id, up: 1 })}</div><p class="no">左：原版　右：升级后</p><span class="tg2">${RAR[d.rar] || ''} · ${TYPE[d.type] || ''}${d.sch ? ' · ' + (SCH[d.sch] || '') : ''}</span>${HIST[d.id] ? `<h4>史 实</h4><p class="hist">${HIST[d.id]}</p>` : ''}`; }
    if (tab === 'relic' || tab === 'item') { const d = e.d, id = d.id; return `<div class="pic"><b class="big huge">${d.icon}</b></div><h3>${d.name}</h3><span class="tg2">${tab === 'relic' ? `随身物品 · ${RARN[d.rar] || ''}${d.ch ? ' · 韩松专用' : ''}` : '背包用品'}</span><h4>效 果</h4><p>${d.desc}</p>${HIST[id] ? `<h4>史 实</h4><p class="hist">${HIST[id]}</p>` : ''}`; }
    if (tab === 'people') { const p = e.p; return `<div class="pic">${p.img ? `<img src="${p.big || p.img}" alt="">` : '<div class="pph big">立绘制作中</div>'}</div><h3>${p.n}</h3><span class="tg2">${p.sub} · ${p.play}</span><h4>出 身</h4><p>${p.from}</p><h4>伤 疤</h4><p>${p.wound}</p><h4>性 子</h4><p>${p.heart}</p>${FRAG_PLAN[p.id] ? `<h4>拼 图 · ${FRAG_PLAN[p.id].filter((_, i) => { const fid = Object.keys(FRAGS).find(k => FRAGS[k].who === p.id && FRAGS[k].i === i); return fid && fragGot(fid); }).length}/5</h4><div class="pz">${FRAG_PLAN[p.id].map((ch, i) => { const fid = Object.keys(FRAGS).find(k => FRAGS[k].who === p.id && FRAGS[k].i === i), f = fid && FRAGS[fid];
      return f && fragGot(fid) ? `<div class="pc on"><b>${f.t}</b><span>${f.sum}</span></div>` : `<div class="pc"><b>？？？</b><span>${ch === '终' ? '真结局' : `第${'一二三'[ch - 1]}章`}${f && f.only ? ` · 只有用${p.n}时才会碰到` : ''}</span></div>`; }).join('')}</div>` : ''}<h4>语 言</h4><p class="hist">${p.lang}</p><p class="no">人物为虚构。</p>`; }
    if (tab === 'term') return `<h3>${e.n}</h3><span class="tg2">术语 · ${e.g}</span><p>${e.t}</p>`;
    if (tab === 'arch') return `<h3>${e.m.n}</h3><span class="tg2">${e.m.y}</span><p>${e.m.d}</p><p class="no">资料来源：${e.m.src}</p>`;
    return `<h3>${e.m.n}</h3><span class="tg2">${e.m.y}</span><p class="sub2">${e.m.t}</p><p>${e.m.d}</p><p class="no">资料来源：新华网、共产党员网、人民网等公开报道。</p>`;
  };
  const draw = () => {
    const L = lists[tab](), cur = L.find(e => e.k === sel), n = L.filter(open).length;
    o.innerHTML = `<div class="cx"><div class="hd"><h2>图鉴</h2>${TABS.map(([k, t]) => `<button class="tb2 ${k === tab ? 'on' : ''}" data-t="${k}">${t}</button>`).join('')}
      <span class="ct">${tab === 'term' || tab === 'hero' || tab === 'people' || tab === 'arch' ? `共 ${L.length} 条` : `已发现 ${n} / ${L.length}`}</span>${DEBUG ? '<button class="tb2" id="cx_all">解锁全部</button>' : ''}<button class="x" id="cx_x">✕</button></div>
      <div class="bd"><div class="gr g-${tab}">${L.map(cell).join('')}</div><div class="dt">${detail(cur)}</div></div></div>`;
    o.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { tab = b.dataset.t; sel = null; draw(); });
    o.querySelectorAll('.gr [data-k]').forEach(c => c.onclick = () => { sel = c.dataset.k; draw(); });
    o.querySelector('#cx_x').onclick = () => o.remove();
    const all = o.querySelector('#cx_all'); if (all) all.onclick = () => { SEEN.__all = 1; draw(); };
  };
  draw();
}

function gainItem(id) { if (R.items.length >= ITEM_SLOTS) { tip('背包满了'); return false; } R.items.push(id); see('i:' + id); save(); teach('item'); return true; }
function gainRelic(id, quiet) { if (!id || has(id)) return; R.relics.push(id); see('r:' + id); save(); if (!quiet) tip('得到随身物品：' + RELICS[id].name); teach('relic'); }
/* 当前画面刷新（地图上用完背包用品后） */
let refreshScreen = () => {};

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

/* 卡牌插图：每张牌的 icon 写在内容文件里；同类卡共用一个图标（同旧游戏） */
const ICON_NAME = { pistol: '手枪', rifle: '步枪', apround: '穿甲弹', helmet: '钢盔', scope: '准星', binoc: '望远镜', round: '子弹', breath: '屏息', wind: '风向', smg: '冲锋枪', casings: '弹壳', mg: '机枪', belt: '弹带', barrel: '枪管', mag: '弹匣', medkit: '急救包', bayonet: '刺刀', cover: '掩体', grenade: '炸药', letter: '情报' , knife: '飞刀', dadao: '大刀', satchel: '炸药包', mine: '地雷', fuse: '导火索', map: '地图', codebook: '密码本', radio: '电台', lime: '石灰', torch: '火把'};
const ICONS_READY = new Set(Object.keys(ICON_NAME));
function cardHTML(c, extra = '', attrs = '') {
  see('c:' + c.id); /* 见过的牌在图鉴里解锁 */
  if (extra.includes('inhand') && B && SAN() && R.san <= 3 && hsh(c.uid, B.turn) % 7 === 0) return cardHTML0(c, extra, attrs).replace(/(<div class="cname[^>]*>)[^<]*/, `$1${GLITCH[hsh(c.uid) % GLITCH.length]}`);
  return cardHTML0(c, extra, attrs);
}
function cardHTML0(c, extra = '', attrs = '') {
  const live0 = B && !B.over && extra.includes('inhand'), d = CARDS[c.id], cost = live0 ? E.cardCost(B, c) : d.cost[c.up ? 1 : 0], ic = d.icon || 'round';
  let badge = '', cls = '';
  if (B && !B.over && extra.includes('inhand')) {
    const m = E.cardMode(B, c);
    if (m === 'bayonet') { badge = `<div class="cbadge bayo">空仓 · 拼刺 ${BAYONET}</div>`; cls = ' bayo'; }
  }
  /* 战斗中把伤害数字换成实际值：变大绿色，变小红色 */
  const live = live0 && d.gun && E.cardMode(B, c) === 'shoot';
  const f = x => { if (!live) return x; const v = E.previewDmg(B, d, x); return v === x ? x : `<b class="${v > x ? 'dup' : 'ddn'}">${v}</b>`; };
  const text = dsc(c, f);
  const rr = ({ basic: 'c', c: 'c', u: 'u', r: 'r', loot: 'u' })[d.rar] || 'c';
  return `<div class="card t-${d.type} s-${d.sch}${c.up ? ' up' : ''}${d.gun ? ' gun' : ''}${cls} ${extra}" data-cid="${c.id}" ${attrs}>
    <div class="art">${ICONS_READY.has(ic) ? `<img src="assets/icons/${ic}.png" alt="" draggable="false">` : `<span class="ph">${ICON_NAME[ic] || ''}</span>`}</div>
    <div class="cdesc"><span>${kwify(text)}${d.ex && !text.includes('消耗') ? '<br>消耗。' : ''}</span></div>
    <img class="frame" src="assets/ui/frame_${d.type === 'curse' || d.type === 'status' ? 'skill' : d.type}_${rr}.png" alt="" draggable="false">
    <div class="cost">${cost}</div><div class="cname">${d.name}${c.up ? '+' : ''}</div>
    <div class="ctype">${d.sch !== '通' ? `<i class="sch s-${d.sch}">${SCH[d.sch]}</i>` : ''}${TYPE[d.type]}${d.rar === 'loot' ? '·缴获' : ''}</div>${badge}</div>`;
}
function showPile(t, cards, onPick, sub = '') {
  const o = overlay(`<h2>${t}</h2>${sub ? `<p class="sub">${sub}</p>` : ''}<div class="grid">${cards.length ? cards.map((c, i) => cardHTML(c, '', `data-k="${i}"`)).join('') : '<p class="sub">（空）</p>'}</div><button class="btn" id="ov_close">${onPick ? '取消' : '关闭'}</button>`);
  o.querySelector('#ov_close').onclick = () => o.remove();
  if (onPick) o.querySelectorAll('.grid .card').forEach(el => el.onclick = () => { o.remove(); onPick(cards[+el.dataset.k]); });
  return o;
}
function rules() {
  const L = ['每回合 3 能量，抽 5 张。打出卡牌要花能量。', ...CHR().mech.rules,
    '<b>敌人换弹</b>：敌人头上写着「装弹」时，那回合不攻击。机枪组、精英和首领脚下显示剩余弹数。',
    '<b>伪满军士气</b>：同伴倒下，伪满军会「动摇」；动摇 2 层就溃逃。有日军或伪满警察队长督战时不逃。',
    '<b>装甲</b>：每次受到的伤害减去装甲值。穿甲弹、反器材无视装甲。',
    '<b>体温</b>：每走一格 -1，到密营回满；低于 3 时战斗第一回合少抽 1 张（不掉血）。',
    '<b>可疑度</b>（第二章起代替体温）：打赢一场 +1（精英 +2），每开 6 枪再 +1；到 5 战斗多一个巡警，满 10 宪兵直接找上门；安全屋清零。',
    '<b>口粮</b>：每走 2 格吃 1 口，打赢战斗能缴获，也能跟老乡换东西；断粮时该吃的那一格失去 3 生命（饿不死，最少留 1 点）。',
    '<b>随身物品</b>：一直生效的被动效果。精英、物资埋藏点、老乡那里能拿到。',
    `<b>背包</b>：一次性用品，最多 ${ITEM_SLOTS} 件，点顶栏的格子使用。`,
    '<b>情报</b>：带「📜」的加强精英身边有一个押运档案箱的敌人，3 回合内把它打倒才能拿到情报；集齐三份，才能走到真结局。',
    '<b>缴获</b>：打赢后可能缴获敌人的枪，以卡牌的形式加入牌组。'];
  overlay(`<div class="panel rules"><h2>规则</h2>${L.map(x => `<p>· ${x}</p>`).join('')}
  <p class="sub">电脑快捷键：数字键出牌，${CHR().mech.actions ? 'R 装填，' : ''}E 结束回合，Esc 取消，M 静音。</p>
  <button class="btn" id="ov_close">关闭</button></div>`).querySelector('#ov_close').onclick = e => e.target.closest('.overlay').remove();
}

// ---------- 标题 ----------
function title() {
  B = null; const s = load(); $('#dbg')?.remove();
  /* 主界面（照三国终章：留白，只有书法标题 + 一排按钮；图鉴、规则、设置收到右上角） */
  view.innerHTML = `<div class="tbg key"></div><div class="tshade"></div>
   <div class="tcorner"><button id="t_codex">图鉴</button><button id="t_rule">规则</button><button id="t_set">设置</button></div>
   <div class="tright"><img class="tcal" src="assets/ui/title_cal.png" alt="長夜將盡"><div class="tsub"><i></i><img src="assets/ui/title_sub.png" alt="深入關東軍司令部"><i></i></div>
   <p class="ten">BEFORE THE DAWN · INTO THE KWANTUNG HQ</p>
   <div class="trow"><button class="tbtn" id="t_new">新的一局</button>${s ? '<button class="tbtn" id="t_cont">继 续</button>' : ''}</div></div>
   <p class="tnote">最小可玩版 · 本作为虚构故事，除「英烈录」所记真实英烈外，人物均为虚构。</p>`;
  if (s) $('#t_cont').onclick = () => { R = s; resume(); };
  $('#t_new').onclick = () => { if (s && !confirm('开始新的一局会覆盖当前进度，确定吗？')) return; pickChar(c => { newRun(c); story(intro(), () => adv(ADV_CH1_OPEN, () => campaign(0, mapScreen))); }); };
  $('#t_rule').onclick = rules; $('#t_codex').onclick = () => codex(); $('#t_set').onclick = settings;
}
/* 设置：音效、画面震动、教程 */
function settings() {
  const o = overlay(`<div class="panel small"><h2>设置</h2><div class="col"><button class="btn" id="s_snd">音效：${audio.isOn() ? '开' : '关'}</button><button class="btn" id="s_shk">画面震动：${SET.shake ? '开' : '关'}</button>
    <button class="btn" id="s_tut">教程：${SET.tut ? '开' : '关'}</button><button class="btn" id="s_tutr">教程从头再讲一遍</button><button class="btn ghost" id="s_x">关闭</button></div></div>`);
  o.querySelector('#s_snd').onclick = e => { e.target.textContent = `音效：${audio.toggle() ? '开' : '关'}`; };
  o.querySelector('#s_shk').onclick = e => { SET.shake = SET.shake ? 0 : 1; saveSet(); e.target.textContent = `画面震动：${SET.shake ? '开' : '关'}`; };
  o.querySelector('#s_tut').onclick = e => { SET.tut = SET.tut ? 0 : 1; saveSet(); e.target.textContent = `教程：${SET.tut ? '开' : '关'}`; };
  o.querySelector('#s_tutr').onclick = () => { resetTut(); tip('教程已重置，老沈会从头讲起'); };
  o.querySelector('#s_x').onclick = () => o.remove();
}
/* 选人：现在全部一开始就解锁 */
function pickChar(done) {
  const o = overlay(`<div class="panel charsel"><h2>选择出发的人</h2><div class="chars">${Object.values(CHARS).map(c => `<button class="charc" data-c="${c.id}">
    <div class="cface">${c.art.dir ? `<img src="assets/portraits/${c.art.dir}.png" alt="">` : `<div class="faceph" style="background:${c.art.ph}">${c.name}</div>`}</div>
    <b>${c.name}</b><small>${c.title || ''}</small><p>${c.blurb || ''}</p></button>`).join('')}</div><button class="btn ghost" id="cs_x">取消</button></div>`);
  o.querySelectorAll('.charc').forEach(b => b.onclick = () => { o.remove(); done(b.dataset.c); });
  o.querySelector('#cs_x').onclick = () => o.remove();
}
const INTRO_LEAD = { hansong: '神枪手韩松，代号「雪貂」', chenmo: '飞刀手陈默', tian: '使大刀的田守义', zhao: '老工兵赵铁山', shen: '侦察员沈知秋' };
const intro = () => INTRO.map((x, i) => i === 2 ? { ...x, t: `下一程，向长白山北麓的林海雪原转进。日伪讨伐队正在搜山。${INTRO_LEAD[R.char] || CHR().name}，走在队伍最前面。` } : x);
const INTRO = [
  { img: 'assets/story/s1_river.jpg', t: '1940 年冬，东北抗联余部分批越境入苏整训；1942 年编为教导旅。1944 年冬，一支六人小分队趁着夜色越过冰封的江面，潜回东北。' },
  { img: 'assets/story/s2_camp.jpg', t: '辗转月余，到了吉东山地，接上了密营。灶火边，老沈摊开手绘的地图：最终目标是长春——伪满洲国所谓的「新京」，关东军司令部就在那里。' },
  { img: 'assets/story/s3_depart.jpg', t: '下一程，向长白山北麓的林海雪原转进。日伪讨伐队正在搜山。神枪手韩松，代号「雪貂」，走在队伍最前面。' }];
/* 各章结尾的插画（第一章：沿着铁路向新京去） */
const OUTRO = { 1: 'assets/story/s4_south.jpg', 2: 'assets/story/s5_drain.jpg', 3: 'assets/story/s6_up.jpg' }; /* 真结局用 s7_dawn.jpg（真结局还没写） */
/* 战役总图：开局和每章结束时显示。地名用代码叠在图上（不让 AI 画字） */
const CAMP = [{ n: '第一章 · 林海雪原', t: '1944 年冬', x: 69.4, y: 39.1 }, { n: '第二章 · 新京', t: '1945 年春', x: 39.7, y: 70.7 }, { n: '第三章 · 地下', t: '1945 年 8 月', x: 32.7, y: 71 }];
function campaign(ch, done, note) {
  $('#dbg')?.remove();
  const lab = (t, x, y, cls = '') => `<b class="clab ${cls}" style="left:${x}%;top:${y}%">${t}</b>`;
  view.innerHTML = `<div class="tbg dark"></div><div class="campw"><div class="campmap"><img src="assets/bg/campaign.jpg" alt="">
    ${lab('苏联远东', 47, 5, 'dim')}${lab('黑龙江', 30, 11, 'river')}${lab('松花江', 46, 33, 'river')}${lab('长白山', 76, 74, 'dim')}${lab('渤海', 24, 91, 'river')}${lab('出发', 72.5, 6.5, 'red')}
    ${CAMP.map((c, i) => `<i class="cring ${i === ch ? 'now' : i < ch ? 'done' : 'todo'}" style="left:${c.x}%;top:${c.y}%"></i>`).join('')}
    ${lab(CAMP[0].n, 80, 39, ch === 0 ? 'now' : 'red')}${lab(ch >= 1 ? CAMP[1].n : '第二章 · ？？？', 41, 79.5, ch === 1 ? 'now' : 'red')}${lab(ch >= 2 ? CAMP[2].n : '第三章 · ？？？', 18, 64, ch === 2 ? 'now' : 'red')}
    </div><div class="camptxt"><p>${note || `${CAMP[Math.min(ch, 2)].t}，${CAMP[Math.min(ch, 2)].n.split('·')[1].trim()}。目标：长春，关东军司令部。`}</p><button class="btn big" id="cp_go">${ch >= 1 ? '继续' : '出发'}</button></div></div>`;
  $('#cp_go').onclick = done;
}
/* 剧情：整幅插画 + 底部字幕条。lines 里每项是字符串或 {img, t} */
function story(lines, done) {
  $('#dbg')?.remove(); let i = 0; const show = () => { const L = typeof lines[i] === 'string' ? { t: lines[i] } : lines[i];
    view.innerHTML = `${L.img ? `<div class="stimg" style="background-image:url(${L.img})"></div>` : '<div class="tbg dark"></div>'}<div class="stbar"><p>${L.t}</p><div class="row"><button class="btn" id="st_n">${i < lines.length - 1 ? '继续' : '出发'}</button><button class="btn ghost" id="st_s">跳过</button></div></div>`;
    $('#st_n').onclick = () => { i++; i < lines.length ? show() : done(); }; $('#st_s').onclick = done; };
  show();
}
function resume() {
  ITC.n = R.itN || 0;
  if (R.pending && (R.pending.t === 'fight' || R.pending.t === 'elite' || R.pending.t === 'boss')) return battle(R.pending.enc, R.pending.t, R.pending.strong);
  if (R.pending && R.pending.t === 'shop') return shopScreen();
  if (R.pending && R.pending.t === 'treasure') return treasureScreen();
  if (R.pending && R.pending.t === 'bossrelic') return bossRelicScreen();
  if (R.pending && R.pending.t === 'actend') return actEnd();
  if (R.pending && R.pending.t === 'rest') return restScreen();
  if (R.pending && R.pending.t === 'loot') return lootScreen();
  mapScreen();
}

// ---------- 地图 ----------
function mapScreen() {
  if (R && R.advQ) { const id = R.advQ; R.advQ = null; save(); return adv(FRAGS[id], () => { giveFrag(id); mapScreen(); }); }
  B = null; delete R.pending; save(); refreshScreen = mapScreen;
  /* 第三章：理智 6 以下，只看得见往前两层（读了值班日志、跟了黄皮子就全看得见） */
  const dark = SAN() && MAPD().dark && R.san <= 6 && !hasFlag('reveal');
  const av = available(), M = MAPD(), H = M.h, LC = '#6a4a2a', BOSS_X = Math.round(M.w * M.bossX), BOSS_Y = Math.round(M.h * M.bossY), ROWS = ROWSOF();
  let lines = '', nodes = '';
  /* 走过的路画成红色实线（抗联路线），没走的是灰色虚线 */
  const walked = (a, b) => R.path.some((p, i) => p.r === a.r && p.c === a.c && R.path[i + 1] && R.path[i + 1].r === b.r && R.path[i + 1].c === b.c);
  const ln = (x1, y1, x2, y2, red) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${red ? '#b8241a' : LC}" stroke-width="${red ? 6 : 3}" ${red ? '' : 'stroke-dasharray="4 8" opacity=".75"'} stroke-linecap="round"/>`;
  for (const row of R.map) for (const nd of row) if (nd) for (const c of nd.next) { const t = R.map[nd.r + 1][c]; lines += ln(nodeX(nd), mapY(nd), nodeX(t), mapY(t), walked(nd, t)); }
  for (const nd of R.map[ROWS - 1]) if (nd) lines += ln(nodeX(nd), mapY(nd), BOSS_X, BOSS_Y, false);
  for (const row of R.map) for (const nd of row) if (nd) {
    const isAv = av.includes(nd), done = R.path.some(p => p.r === nd.r && p.c === nd.c), cur = R.pos && R.pos.r === nd.r && R.pos.c === nd.c, hide = rflag('hideMap') && !done;
    if (dark && nd.r > (R.pos ? R.pos.r : -1) + 2) { nodes += `<div class="node dk" style="left:${nodeX(nd)}px;top:${mapY(nd)}px"></div>`; continue; }
    nodes += `<div class="node pic ${isAv ? 'av' : ''} ${done ? 'done' : ''} ${cur ? 'cur' : ''}" style="left:${nodeX(nd)}px;top:${mapY(nd)}px" data-r="${nd.r}" data-c="${nd.c}">${nodeIcon(hide ? 'event' : nd.type)}${nd.strong && !hide && !done ? '<i class="nintel" title="加强精英：有人押运档案箱，3 回合内打倒他才能拿到情报">📜</i>' : ''}${cur ? '<img class="curflag" src="assets/ui/node_cur.png" alt="">' : ''}</div>`;
  }
  nodes += `<div class="node boss ${NODE_ART ? 'pic' : ''} ${av[0] === 'boss' ? 'av' : ''}" style="left:${BOSS_X}px;top:${BOSS_Y}px">${NODE_ART ? nodeIcon('boss') : '讨伐队<br>据点'}</div><div class="maplab" style="left:${BOSS_X}px;top:${BOSS_Y - 82}px">${ENEMIES[bossKey()].name}</div>
   <div class="maplab start" style="left:${M.w / 2}px;top:${Math.round(M.h * (M.startLabelY || .93))}px">${M.startLabel}</div>`;
  view.innerHTML = `${topBar()}<div id="map" class="${SAN() ? 'under' : ''} ${dark ? 'dark' : ''}"><div id="mapin" style="width:${M.w}px;height:${H}px;background-image:url(${M.img})"><svg width="${M.w}" height="${H}">${lines}</svg>${nodes}</div></div>
   <div id="legend"><div class="lgt">图例</div>${Object.keys(NODE).map(k => `<div><b class="pic">${nodeIcon(k)}</b>${placeName(k)}</div>`).join('')}<div><b class="pic">${nodeIcon('boss')}</b>${CH().bossLabel || '讨伐队据点'}</div><div><b class="pic nint">📜</b>加强精英（情报）</div><div class="lg2"><i class="redl"></i>走过的路线<br>${SAN() ? `每两格口粮 -1；进了古墓每格理智 -1<br>现在：${CH().segName[segOf(R.pos ? R.pos.r : 0)]}` : SUS() ? '每两格口粮 -1；城里打仗会抬高可疑度' : '每走一格体温 -1，每两格口粮 -1'}</div></div>`;
  bindTop();
  const m = $('#map'), down = M.startY < M.endY, y = R.pos ? mapY(R.map[R.pos.r][R.pos.c]) : down ? 0 : H; m.scrollTop = Math.max(0, down ? y - 200 : y - m.clientHeight + 200); /* 第三章从上往下走 */
  teach('map'); if (MAPD().startY < MAPD().endY) teach('mapdown'); if (SAN() && dark) teach('dark'); if (!rflag('hideMap') && R.map.flat().some(n => n && n.strong)) teach('intel'); if (R.temp < 3) teach('cold'); if (R.food <= 0) teach('hunger');
  view.querySelectorAll('.node.av').forEach(el => el.onclick = () => {
    if (el.classList.contains('boss')) { if (!walk()) return; R.floor++; return enterNode('boss'); }
    const nd = R.map[+el.dataset.r][+el.dataset.c]; if (!walk()) return;
    R.pos = { r: nd.r, c: nd.c }; R.path.push(R.pos); R.floor++; enterNode(nd.type, nd);
  });
  dbgPanel();
}
/* 走一格：消耗体温和口粮，返回 false 表示倒下了 */
function walk() {
  const msg = []; R.steps = (R.steps || 0) + 1;
  /* 口粮每 2 格吃 1 口；断粮时那一格掉 3 血，但饿不死（最少留 1） */
  if (R.steps % 2 === 0) { if (R.food > 0) R.food--; else { R.hp = Math.max(1, R.hp - 3); msg.push('没有口粮，饿着肚子赶路：生命 -3'); } }
  /* 体温每格 -1，只影响「冷开局」（战斗第一回合少抽 1 张），不掉血 */
  const loss = R.relics.some(id => RELICS[id].walkTemp) ? Math.min(...R.relics.filter(id => RELICS[id].walkTemp).map(id => RELICS[id].walkTemp(R))) : 1;
  if (SUS() || SAN()) R.temp = TEMP_MAX; else R.temp = Math.max(0, R.temp - loss);
  /* 古墓里每走一格，理智 -1 */
  if (SAN()) { const r = R.pos ? R.pos.r + 1 : 0; if (segOf(r) >= 2) { addSan(-1); msg.push('墓道里又冷又黑：理智 -1'); } }
  if (msg.length) say(msg.join('；'));
  if (R.hp > 0) teach('walk');
  if (R.hp <= 0) { R.hp = 0; endScreen(false, SAN() ? '倒在了地底下' : SUS() ? '倒在了新京的街头' : '倒在了风雪里'); return false; }
  return true;
}
/* 这一章的 Boss（开局随机定好，地图上能看到是谁） */
function bossKey() { const C = CH(); if (!R.boss || !C.enc.boss.some(b => b.includes(R.boss))) { const enc = pickOne(C.enc.boss); R.boss = enc.find(k => ENEMIES[k].boss); R.bossEnc = enc; } return R.boss; }
function enterNode(t, nd) {
  const C = CH();
  if (t === 'boss') { bossKey(); R.pending = { t: 'boss', enc: R.bossEnc }; save(); return battle(R.pending.enc, 'boss'); }
  /* 暴露：不管这一格是什么，宪兵搜捕队先找上门；打完可疑度降到 5 */
  if (SUS() && (R.sus || 0) >= SUS_MAX && C.enc.hunt) { R.sus = 5; const enc = pickOne(C.enc.hunt); R.pending = { t: 'fight', enc, hunt: 1 }; save(); tip('暴露了！宪兵搜捕队找上门来'); return battle(enc, 'fight'); }
  if (t === 'fight' || t === 'elite') {
    const P = C.segEnc && nd ? C.segEnc[segOf(nd.r)] : C.enc; /* 第三章：按地图分段换敌人 */
    let enc = t === 'elite' ? pickOne(P.elite) : pickOne(R.fights < C.easyFights ? P.easy : P.hard); if (t === 'fight') R.fights++;
    if (SAN()) { enc = [...enc];
      if (R.lure > 0 && enc.length < 4) { R.lure--; enc.push(segOf(nd ? nd.r : 0) >= 2 ? 'shadow' : 'inf'); } /* 点了灯，引来了东西 */
      if (R.san <= 0 && enc.length < 4) { enc.push('shadow'); tip('理智到底了：黑暗里多了一个影子'); } }
    if (SUS() && (R.sus || 0) >= 5 && enc.length < (nd && nd.strong ? 3 : 4)) enc = [...enc, 'patrol']; /* 警觉：多一个巡警 */
    R.pending = { t, enc, strong: !!(nd && nd.strong) }; save(); return battle(enc, t, R.pending.strong);
  }
  if (t === 'rest') { R.pending = { t: 'rest' }; save(); return restScreen(); }
  if (t === 'event' && !(C.fixedEv && nd && C.fixedEv[nd.r])) { const fid = pickFrag('event'); if (fid) { save(); return fragScene(fid, mapScreen); } }
  if (t === 'event') { save(); return eventScreen(C.fixedEv && nd && C.fixedEv[nd.r] && !(R.seenEv || []).includes(C.fixedEv[nd.r]) ? C.fixedEv[nd.r] : undefined); }
  if (t === 'shop') { R.pending = { t: 'shop' }; save(); return shopScreen(); }
  if (t === 'treasure') { R.pending = { t: 'treasure' }; save(); return treasureScreen(); }
}

// ---------- 战斗 ----------
/* 逐帧动画（同旧游戏）：[帧数, 每帧毫秒, 模式] 模式 1=循环 0=播完回待机 2=停在最后一帧
   韩松：assets/hansong/idle0-3、shoot0-3、hurt0-1、down0-2、stab0-1（共 15 帧）
   敌人：assets/enemies/<名字>/idle0-1、atk0-1、hurt0、down0-1（共 7 帧）
   帧图还没画好时，用 assets/units/ 下的单张图 + 代码呼吸动作顶替 */
/* 待机放慢（呼吸的节奏），4 帧的来回播（0-1-2-3-2-1），不从最后一帧跳回第一帧；模式 3 = 来回播 */
const HA = { idle: [4, 460, 3], shoot: [4, 95, 0], hurt: [2, 160, 0], down: [3, 240, 2], stab: [2, 170, 0] };
const EA = { idle: [2, 760, 1], atk: [2, 240, 0], hurt: [1, 340, 0], down: [2, 280, 2] };
const HERO_ART = () => CHR().art;
/* 当前用哪套帧（村濑下车后换第二套） */
const efr = e => (e.phase === 2 && e.d.frames2) ? [e.d.frames2, e.d.artH2] : [e.d.frames, e.d.artH];
/* 帧图放进固定大小的框：框按站立姿势定大小，脚底锚点对准框的中线；倒地、前冲等超出部分露在框外 */
function frameBox(key, dispH, src, cls, alt) {
  const m = FRAMES[key], k = dispH / m.sh;
  return `<div class="sprw" style="width:${Math.round(m.sw * k)}px;height:${dispH}px"><img class="spr art ${cls}" src="${src}" alt="${alt}" draggable="false" style="position:absolute;left:${Math.round((m.sw / 2 - m.ax) * k)}px;bottom:0;height:${Math.round(m.ch * k)}px;max-width:none"><i class="shd"></i></div>`;
}
let hst = { n: 'idle', t: 0 };
/* 各人出牌时摆哪套动作。陈默：shoot＝甩飞刀，stab＝拔短刀划；田守义：shoot＝举刀劈，stab＝横刀冲上去扫；
   赵铁山：shoot＝扔炸药包，stab＝挖雪垒掩体；沈知秋：shoot＝开枪，stab＝举望远镜、看纸条 */
const POSE = {
  chenmo: d => /飞|甩|袖|回旋|回手|手枪/.test(d.name) ? 'shoot' : d.type === 'atk' ? 'stab' : null,
  tian: d => d.type === 'atk' ? (d.tgt === 'all' || /拖刀|刀山|拼到底/.test(d.name) ? 'stab' : 'shoot') : null,
  zhao: d => /锹/.test(d.name) ? 'stab' : d.type === 'atk' ? 'shoot' : d.type === 'skill' ? 'stab' : null, /* 工兵锹：用挖雪那套动作，再往前冲一下＝抡锹砸过去 */
  shen: d => d.type === 'atk' ? 'shoot' : d.type === 'skill' ? 'stab' : null };
const DASH = { chenmo: 1, tian: 1 }; /* 近身砍的人出攻击牌时往前冲一下 */
function heroAct(n) { if (hst.n === 'down') return; hst = { n, t: performance.now() }; }
function frameOf(tab, st, reset) { const [c, ms, mode] = tab[st.n] || tab.idle; let k = Math.floor((performance.now() - st.t) / ms); if (mode === 3) { const L = c * 2 - 2; k %= L; if (k >= c) k = L - k; } else if (k >= c) { if (mode === 1) k %= c; else if (mode === 2) k = c - 1; else { reset(); return [ 'idle', 0 ]; } } return [st.n in tab ? st.n : 'idle', k]; }
/* 还没出图的角色：用一块带名字的色块顶着 */
function heroBox() {
  const A = HERO_ART(), h = Math.round((TOUCH ? A.hTouch : A.h) * SZ());
  if (A.frames) return frameBox(A.dir, h, heroSrc(), '', CHR().name);
  if (!A.still) return `<div class="sprw"><div class="spr blk heroph" style="width:${Math.round(h * .42)}px;height:${h}px;background:${A.ph || '#444'}"><b>${CHR().name}</b><small>${CHR().title || ''}</small></div><i class="shd"></i></div>`;
  return `<div class="sprw"><img class="spr art still" src="${heroSrc()}" style="height:${h}px" alt="${CHR().name}" draggable="false"><i class="shd"></i></div>`;
}
const heroFace = () => CHR().art.dir ? `<img src="assets/portraits/${CHR().art.dir}.png" alt="">` : `<div class="faceph" style="background:${CHR().art.ph || '#444'}">${CHR().name}</div>`;
/* 陈默、田守义、赵铁山、沈知秋的 4 张待机图是四个不同的姿势（甩刀、扛刀、拿炸药包……），轮着放会像在抽动。
   改成：平时站着用第 1 张，每隔 6 秒左右换一个小动作停 1.3 秒，再回来。韩松的 4 张是呼吸，照常来回播 */
const FIDGET = new Set(['chenmo', 'tian', 'zhao', 'shen']);
const fidgetK = () => { const P = 6200, t = performance.now(), slot = Math.floor(t / P); return t % P > P - 1300 ? 1 + ((slot * 7 + 3) % 3) : 0; };
function heroSrc() { const A = HERO_ART(); if (!A.frames) return `assets/units/${A.still}.png`; let [n, k] = frameOf(HA, hst, () => { hst = { n: 'idle', t: performance.now() }; }); if (n === 'idle' && FIDGET.has(A.dir)) k = fidgetK(); return `assets/${A.dir}/${n}${k}.png`; }
function enemySrc(e) { if (!e.d.frames) return `assets/units/${e.d.art}.png`; const fk = efr(e)[0]; const st = e.anim || { n: e.dead ? 'down' : 'idle', t: 0 }; if (e.dead && st.n !== 'down') { e.anim = { n: 'down', t: performance.now() }; } const [n, k] = frameOf(EA, e.anim || st, () => { e.anim = null; }); return `assets/enemies/${fk}/${n}${k}.png`; }
function epose(e, n) { e.anim = { n, t: performance.now() }; }
const pose = (n) => heroAct(n);
/* 预加载所有帧，第一次播放时不闪 */
const PRE = [], PREDONE = new Set();
function preload(dir, tab) { if (PREDONE.has(dir)) return; PREDONE.add(dir); Object.entries(tab).forEach(([n, [c]]) => { for (let k = 0; k < c; k++) { const im = new Image(); im.src = `assets/${dir}/${n}${k}.png`; PRE.push(im); } }); }
/* 主角和敌人的帧都在进战斗时才加载，手机上不用一开始就下载全部 */
/* 和旧游戏一样，每 80 毫秒刷新一次帧 */
let lastT = 0;
(function loop(t) { requestAnimationFrame(loop); if (!B || t - lastT < 80) return; lastT = t;
  const h = view.querySelector('#hero .spr.art'); if (h && HERO_ART().frames) { const f = heroSrc(); if (!h.src.endsWith(f)) h.src = f; }
  view.querySelectorAll('.enemy .spr.art').forEach(im => { const e = B.en.find(x => x.id === im.closest('.enemy').dataset.eid); if (e) { const f = enemySrc(e); if (!im.src.endsWith(f)) im.src = f; } });
})(0);
function motion(who, cls) { const el = view.querySelector(`[data-eid="${who}"] .sprw`); if (el) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); } }

/* Boss 开战前的对白（立绘在右，韩松在左）；每局每个 Boss 只演一次 */
const BOSS_TALK = {
  captain: [['boss', '（日语）雪地上的脚印骗不了人。你们这些「匪贼」，今天一个也走不掉。'], ['hero', '我们不是匪。'], ['hero', '这片林子，是我们的。']],
  kcap: [['boss', '（日语）你们走过的每个屯子，我都去过了。总有人会开口。'], ['boss', '——把狗放出去。'], ['hero', '那你也该听说了：我们从来不跑。']],
};
const LIHUI = { captain: 'assets/portraits/captain_lihui.png', priest: 'assets/portraits/priest_lihui.png', kirino: 'assets/portraits/kirino_lihui.png', kuga: 'assets/portraits/kuga_lihui.png', staff: 'assets/portraits/staff_lihui.png' };
/* 第二章首领的开战对白 */
Object.assign(BOSS_TALK, {
  kirino: [['boss', '（日语）新京有四十万人。每一个人，我都可以叫来问话。'], ['boss', '——你们，也不例外。'], ['hero', '那你问吧。'], ['hero', '我只会说一句：这是中国的地方。']],
  priest: [['boss', '（日语）你们也听见了吧？地底下的声音。'], ['boss', '（日语）这片土地的龙脉，由我来钉死。帝国撤走了，钉子会留下来。'], ['hero', '你们撤的时候，连自己的伤兵都不要了。'], ['boss', '（日语）……所以他们的刀，才配做成钉子。'], ['hero', '……疯子。']],
  kuga: [['boss', '（日语）请坐。别紧张，我只是个做买卖的。'], ['boss', '（日语）……你们要的那份副本，我也想要。不如我们谈谈价钱？'], ['hero', '我们不谈价钱。'], ['hero', '我们是来拿回去的。']],
});
/* —— 过场（日式文字冒险版面）：全屏场景 + 左右两个立绘 + 名字牌 + 对白框 —— */
const PERSON = id => PEOPLE.find(p => p.id === id) || {};
const spk = w => w === 'hero' ? { n: CHR().name, img: PERSON(PID[R.char]).big || PERSON(PID[R.char]).img } : w === 'narr' ? null : NPC[w] ? { n: NPC[w].n, img: NPC[w].img } : { n: PERSON(w).n || w, img: PERSON(w).big || PERSON(w).img };
function adv(sc, done) {
  $('#dbg')?.remove(); let k = 0; const slot = [null, null]; let lastSide = 1;
  const o = document.createElement('div'); o.className = 'adv' + (sc.sharp ? ' sharp' : '');
  o.innerHTML = `<div class="advbg" style="background-image:url(${sc.bg})"></div><div class="advp l"></div><div class="advp r"></div>
    <div class="advbox"><b class="advn"></b><p class="advt"></p><span class="tutc"></span><button class="tutskip">跳过</button></div>`;
  const show = () => { const [w, t] = sc.lines[k], who = w === 'hero' ? PID[R.char] : w, sp = spk(w);
    if (sp) { let side = slot.indexOf(who); if (side < 0) { side = slot[0] == null ? 0 : slot[1] == null ? 1 : 1 - lastSide; slot[side] = who; const el = o.querySelector(side ? '.advp.r' : '.advp.l'); el.innerHTML = sp.img ? `<img src="${sp.img}" alt="">` : ''; el.classList.toggle('bust', !/_lihui/.test(sp.img || '')); } lastSide = side;
      o.querySelector('.advp.l').classList.toggle('on', side === 0); o.querySelector('.advp.r').classList.toggle('on', side === 1); }
    else { o.querySelectorAll('.advp').forEach(e => e.classList.remove('on')); }
    const n = o.querySelector('.advn'); n.textContent = sp ? sp.n : ''; n.style.visibility = sp ? '' : 'hidden';
    o.querySelector('.advt').textContent = t; o.classList.toggle('narr', !sp);
    o.querySelector('.tutc').textContent = k < sc.lines.length - 1 ? '▼ 点击继续' : '▼ 结束'; };
  o.onclick = ev => { if (ev.target.closest('.tutskip')) { o.remove(); return done(); } k++; if (k >= sc.lines.length) { o.remove(); done(); } else show(); };
  show(); stage.appendChild(o);
}
/* 人物拼图：拿到的块跨局保存在图鉴里（SEEN['f:id']），这一局拿过的不再出 */
const fragGot = id => !!SEEN['f:' + id];
function giveFrag(id) { const f = FRAGS[id]; R.fragRun = [...new Set([...(R.fragRun || []), id])]; const nw = !fragGot(id); see('f:' + id); save();
  if (nw) tip(`人物拼图：${PERSON(f.who).n} · ${f.t}（${FRAG_PLAN[f.who].filter((_, i) => Object.values(FRAGS).some(x => x.who === f.who && x.i === i && fragGot(Object.keys(FRAGS).find(kk => FRAGS[kk] === x)))).length}/5）`); }
function pickFrag(at) { const ok = Object.keys(FRAGS).filter(id => { const f = FRAGS[id]; return f.ch === CH().id && f.at === at && (!f.only || f.only === R.char) && (!f.when || f.when(R)) && !(R.fragRun || []).includes(id); });
  if (!ok.length) return null; const must = ok.find(id => FRAGS[id].force); if (must) return must; /* 主线要过的拼图（陈默的「路灯底下」）一定出 */ const fresh = ok.filter(id => !fragGot(id)); if (Math.random() > (fresh.length ? .5 : .2)) return null; return pickOne(fresh.length ? fresh : ok); }
/* 事件格里的拼图：放完过场，说会儿话身上暖了些（体温 +2，生命 +5） */
function fragScene(id, done) { const f = FRAGS[id]; adv(f, () => { giveFrag(id); if (f.fx) f.fx({ flag: k => { R.flags = [...new Set([...(R.flags || []), k])]; }, sus: n => addSus(n) }); R.temp = Math.min(TEMP_MAX, R.temp + 2); R.hp = Math.min(R.maxHp, R.hp + 5); save(); done(); }); }
function bossTalk(key, done) {
  const hs = key === 'captain' && R.char === 'hansong', L = hs ? TALK_HS_MURASE : BOSS_TALK[key]; if (!L || (R.talked || []).includes(key)) return done();
  if (hs) { const d0 = done; done = () => { giveFrag('hs_murase'); d0(); }; }
  R.talked = [...(R.talked || []), key]; save(); let k = 0; const d = ENEMIES[key]; $('#dbg')?.remove();
  view.innerHTML = `<div class="bg battle" style="background-image:${CH().bossBg && CH().bossBg[key] ? `url(${CH().bossBg[key]}), ` : ''}url(${CH().battleBg})"></div>`;
  const o = document.createElement('div'); o.className = 'overlay tutov btalk';
  const A = CHR().art, hl = A.lihui ? `<div class="tutl hero full"><img src="assets/portraits/${A.dir}_lihui.png" alt=""></div>` : `<div class="tutl hero">${heroFace()}</div>`; /* 有立绘的主角用全身立绘，没有的（韩松）用头像 */
  o.innerHTML = `${hl}<div class="tutr"><img src="${LIHUI[key] || portraitOf(d)}" alt=""></div>
    <div class="tutbox"><b class="tutn"></b><p class="tutt"></p><span class="tutc"></span><button class="tutskip">跳过</button></div>`;
  const show = () => { const [w, t] = L[k]; o.classList.toggle('spk-hero', w !== 'boss'); const n = o.querySelector('.tutn'); n.textContent = w === 'hero' ? CHR().name : w === 'boss' ? d.name : w === 'narr' ? '' : PERSON(w).n; n.style.visibility = w === 'narr' ? 'hidden' : ''; o.querySelector('.tutt').textContent = t;
    o.querySelector('.tutc').textContent = k < L.length - 1 ? '▼ 点击继续' : '▼ 开战'; };
  o.onclick = ev => { if (ev.target.closest('.tutskip')) { o.remove(); return done(); } k++; if (k >= L.length) { o.remove(); done(); } else show(); };
  show(); stage.appendChild(o);
}
/* 普通战斗的背景：每场开局从这一章（第三章按段）的几张里随机挑一张 */
const pickBg = () => { const C = CH(), v = C.segBg ? C.segBg[segOf(R.pos ? R.pos.r : 0)] : (C.battleBgs || C.battleBg); return Array.isArray(v) ? pickOne(v) : v; };
const baseBg = () => (B && B.bg) || pickBg();
const battleBgCss = () => { const k = B && B.kind === 'boss' && B.en.find(e => e.d.boss), b = k && CH().bossBg && CH().bossBg[k.key];
  const base = baseBg();
  return b ? `url(${b}), url(${base})` : `url(${base})`; };
function battle(enc, kind, strong) {
  const bk = kind === 'boss' && enc.find(k => ENEMIES[k].boss);
  if (bk && BOSS_TALK[bk] && !(R.talked || []).includes(bk) && !battle.talking) { battle.talking = 1; return bossTalk(bk, () => { battle.talking = 0; battle(enc, kind, strong); }); }
  if (HERO_ART().frames) preload(HERO_ART().dir, HA);
  enc.forEach(k => { const d = ENEMIES[k]; if (d.frames) preload('enemies/' + d.frames, d.civ ? { idle: EA.idle, down: EA.down } : d.noAtk ? { idle: EA.idle, hurt: EA.hurt, down: EA.down } : EA); /* 平民只有待机和投降两套帧 */ if (d.frames2) preload('enemies/' + d.frames2, EA); });
  B = E.startBattle(R, enc, kind, E.mulberry((Math.random() * 2 ** 31) | 0), { strong, escort: CH().escort }); B.sel = -1; B.busy = 0; B.bg = pickBg();
  const lead = enc.map(k => ENEMIES[k]).find(d => d.boss || d.elite);
  see(...enc.map(k => 'e:' + k)); render(); teach('battle'); if (darkNow()) teach('ghostdark'); if (lead) banner((kind === 'boss' ? '' : strong ? '加强精英：' : '精英：') + lead.name);
  flushMsgs();
}
/* 战斗背景里哪些是 2.5D 的（斜上方往下看、地面铺满画面）：用这种背景时敌人分前后两排站 */
const BG25 = new Set(['snow', 'road', 'river', 'lumber', 'city', 'platform', 'yard', 'shelter', 'culvert', 'warehouse', 'tomb'].map(k => `assets/bg/battle_${k}25.jpg`));
function curBg() { const k = B && B.kind === 'boss' && B.en.find(e => e.d.boss), b = k && CH().bossBg && CH().bossBg[k.key];
  return b || baseBg(); }
const deepMode = () => BG25.has(curBg());
/* 前后两排的站位：[横向位置（0—1，从主角右边到右侧按钮之间）, 0 前排 / 1 后排] */
/* 2.5D 背景上人物整体缩小一点，场地显得大 */
const SZ = () => (B && deepMode() ? (TOUCH ? .84 : .76) : 1);
/* 站阵型：前排（离你近、站得低）是冲在前面的——狗、骑兵、近身的；中排是端枪的兵；
   后排（远、站得高、小一点、暗一点）是机枪、炮、狙击、通信卫生这些，还有军官、首领、押档案的、平民 */
const ROW_FRONT = new Set(['dog', 'cav', 'kendo', 'kensei', 'ronin', 'spy', 'shadow', 'echo', 'tombkeeper', 'mask', 'armorcar', 'ski']);
const ROW_BACK = new Set(['mg', 'hmg', 'mortar', 'sniper', 'gun', 'radio', 'medic', 'supply', 'surgeon', 'officer', 'informer', 'sapper', 'pcap', 'sergeant', 'agent', 'depotchief', 'jpcop', 'overseer']);
const rowOf = e => (e.d.boss && e.key !== 'it') || e.d.civ || e.d.intel || ROW_BACK.has(e.key) ? 2 : ROW_FRONT.has(e.key) ? 0 : 1;
const DEPTH = { up: [0, 85, 165], upT: [0, 54, 104], sc: [1, .88, .78] };

/* 敌人的位置：夹在主角和右侧按钮之间。2.5D 背景上按前中后三排站成一团；放不下就整体等比缩小 */
function fitEnemies() {
  const box = view.querySelector('#enemies'), hero = view.querySelector('#hero'), btn = view.querySelector('#endturn'); if (!box || !hero) return;
  const W = stage.offsetWidth || 1280, L = hero.offsetLeft + hero.offsetWidth + (TOUCH ? 10 : 30), R = btn ? W - btn.offsetLeft + (TOUCH ? 6 : 16) : 240;
  box.style.left = L + 'px'; box.style.right = R + 'px'; box.style.transform = ''; box.style.scale = '';
  const deep = deepMode(); box.classList.toggle('deep', deep); hero.classList.toggle('deep', deep);
  if (!deep) { hero.style.translate = ''; const need = box.scrollWidth, have = box.clientWidth; if (need > have + 2) box.style.transform = `scale(${Math.max(.6, have / need).toFixed(3)})`; return; }
  /* 每个敌人第一次出场时定下排和排里的次序，之后不挪（倒下的留空位，增援的排到所在那排的末尾） */
  for (const e of B.en) if (e.row == null) { e.row = rowOf(e); e.ri = B.en.filter(x => x !== e && x.row === e.row).length; }
  const us = [...box.children], w = box.clientWidth, up = TOUCH ? DEPTH.upT : DEPTH.up;
  /* 摆放原则：
     1. 远近按兵种：前排近身的，中排端枪的，后排远程、指挥、首领、平民；越远站得越高、越小、越暗。
     2. 前排离主角近（偏左），后排偏右，看起来是站在前排身后。
     3. 不遮挡：从左到右排开，相邻两人身子最多叠一小条（同一排 6%，前后排 16%），血条和意图永远看得全。
     4. 交错：同一排的人一高一低错开一点，不站成一条直线。
     5. 整团居中，放不下就整体等比缩小，不挤到主角和按钮。
     6. 位置一旦定下就不变，有人倒下留空位。 */
  us.forEach(u => { const e = B.en.find(x => x.id === u.dataset.eid); if (e && e.row != null) u.dataset.depth = e.row; });
  const vs = (box.getBoundingClientRect().width / (box.offsetWidth || 1)) || 1; /* 画面整体缩放（手机） */
  const items = B.en.filter(e => e.row != null).map(e => { const u = us.find(x => x.dataset.eid === e.id); return u && { e, u, r: e.row, wd: (u.querySelector('.sprw') || u).getBoundingClientRect().width / vs }; }).filter(Boolean);
  const cnt = [0, 1, 2].map(r => items.filter(t => t.r === r).length);
  /* 先按「排」定一个大概位置：前排在左，后排在右，同一排按次序 */
  items.forEach(t => { t.key = t.r * 10 + t.e.ri - (cnt[t.r] > 1 ? 0 : 0); });
  items.sort((a, b) => (a.r - b.r) || (a.e.ri - b.e.ri));
  /* 再从左到右依次排开，保证相邻的人只叠一小条 */
  let x = 0; const xs = [];
  items.forEach((t, k) => { if (k) { const p = items[k - 1], ov = p.r === t.r ? .94 : .84; x += (p.wd + t.wd) / 2 * ov; } xs.push(x); });
  const L0 = xs[0] - items[0].wd / 2, R0 = xs[xs.length - 1] + items[items.length - 1].wd / 2, span = R0 - L0;
  /* 整团偏右放（离主角远一点，中间留出交火的空地），但不超出右边界 */
  const off = Math.max((w - span) / 2, Math.min(w - span, (w - span) * .8)) - L0;
  /* 有几排就占几层：最前面那排总是踩在最低那条线上（只有中排时不会悬在半空） */
  const used = [...new Set(items.map(t => t.r))].sort(), lv = r => up[used.indexOf(r)];
  items.forEach((t, k) => { const u = t.u, cx = xs[k] + off;
    u.dataset.depth = t.r; u.style.left = (cx - u.offsetWidth / 2) + 'px'; u.style.bottom = (lv(t.r) + (t.e.ri % 2) * (TOUCH ? 8 : 16)) + 'px'; });
  const k = span > w ? Math.max(.6, w / span) : 1; if (k < 1) box.style.scale = k.toFixed(3);
  /* 主角的脚站在敌人最前排和最后排的中线上（图上就是左右对着中间） */
  /* 主角的脚：敌人只有一排时和那排（不算错开的高低）的人平齐；有前后排时站在最前排和最后排的中线上。
     按画面上量出来的脚的位置对齐（主角和敌人身下的信息条高度不一样，不能只算数） */
  hero.style.translate = '';
  const foot = u => (u.querySelector('.sprw') || u).getBoundingClientRect().bottom, sc = hero.getBoundingClientRect().height / (hero.offsetHeight || 1) || 1;
  const fy = r => { const f = items.filter(t => t.r === r && t.e.ri % 2 === 0); return f.length ? Math.max(...f.map(t => foot(t.u))) : null; };
  const yF = fy(used[0]), yB = fy(used[used.length - 1]);
  if (yF != null) { const target = yB != null ? (yF + yB) / 2 : yF; hero.style.translate = `0 ${((target - foot(hero)) / sc).toFixed(1)}px`; }
}
addEventListener('resize', () => { if (B && !B.over) fitEnemies(); });
/* 侦明（沈知秋）：弹出牌堆顶几张，点选要弃掉的，确定 */
function scryUI() {
  const k = B.scryQ[0], top = B.draw.slice(-k).reverse(), pick = new Set();
  const o = document.createElement('div'); o.className = 'overlay scryov';
  const draw = () => { o.innerHTML = `<div class="panel scryp"><h2>侦明 ${k}</h2><p class="hint">点牌把它弃掉（再点一下取消）。留下的按顺序放回牌堆顶，左边的先抽到。带【线索】的弃掉会触发。</p>
    <div class="scryrow">${top.map(c => cardHTML(c, `${pick.has(c.uid) ? 'scryout' : ''}`, `data-u="${c.uid}"`)).join('')}</div>
    <div class="row"><button class="btn" id="sc_all">全部弃掉</button><button class="btn big" id="sc_ok">确定${pick.size ? `（弃 ${pick.size} 张）` : '（全部留下）'}</button></div></div>`;
    o.querySelectorAll('[data-u]').forEach(el => el.onclick = () => { const u = +el.dataset.u; pick.has(u) ? pick.delete(u) : pick.add(u); draw(); });
    o.querySelector('#sc_all').onclick = () => { top.forEach(c => pick.add(c.uid)); draw(); };
    o.querySelector('#sc_ok').onclick = () => { o.remove(); E.resolveScry(B, [...pick]); render(); flushMsgs(); checkEnd(); }; };
  draw(); stage.appendChild(o);
}
function flushMsgs() { if (B && B.msgs.length) { say(B.msgs.join('\n'), 3600); B.msgs = []; } }
const ICON = { atk: '⚔', def: '🛡', buff: '⬆', debuff: '⬇', charge: '⏳', flee: '🏃', reload: '🔄', unk: '？', dazed: '💫' };

/* 第三章：黑暗（第一回合只看得见轮廓，点了灯或用马灯就看清）；理智 3 以下，有的意图是假的、有的牌名不对。不告诉你哪条是假的 */
const darkNow = () => SAN() && CH().under && B && B.turn === 1 && !B.lit && !hasFlag('lamp');
const hsh = (...a) => { let h = 7; for (const x of String(a.join('|'))) h = (h * 31 + x.charCodeAt(0)) >>> 0; return h; };
function lieIntent(e, it) {
  if (!it || !SAN() || R.san > 3) return it; const k = hsh(e.id, B.turn, R.floor) % 6;
  if (k === 0) return { i: 'unk', text: '', name: '……' };
  if (k === 1 && it.i === 'atk') { const n = parseInt(it.text) || 0; return { ...it, text: String(Math.max(1, Math.round(n * (hsh(e.id, B.turn) % 2 ? 1.6 : .4)))) }; }
  return it;
}
const GLITCH = ['它在看', '□□□', '别回头', '少一个', '你是谁'];
function enemyHTML(e) {
  const d = e.d, [w, h] = BLOCK_SIZE[e.key] || [100, 160], dk = darkNow() && !e.dead;
  const it = e.dead ? null : dk ? { i: 'unk', text: '', name: '黑暗里有东西' } : lieIntent(e, E.intentOf(B, e));
  const tg = B.sel >= 0 && B.hand[B.sel] && E.needTarget(B.hand[B.sel]) && !e.dead;
  const label = e.key === 'captain' ? (e.phase === 2 ? '村濑' : '装甲车') : d.name;
  return `<div class="unit enemy ${tg ? 'tg' : ''} ${e.dead ? 'dead' : ''} ${d.frames ? '' : 'noanim'} ${d.ghost ? 'ghost' : ''} ${dk ? 'dk' : ''}" data-eid="${e.id}">
    <div class="intent" ${it && it.name.includes('（') ? `title="${it.name}"` : ''}>${it ? `<i class="ii ii-${it.i}">${ICON[it.i]}</i>${it.text}<small>${it.name.split('（')[0]}</small>` : ''}</div>
    ${d.frames ? frameBox(efr(e)[0], Math.round(efr(e)[1] * SZ()), enemySrc(e), '', d.name) : `<div class="sprw">${d.art ? `<img class="spr art still" src="${enemySrc(e)}" style="height:${d.artH}px" alt="${d.name}" draggable="false">` : `<div class="spr blk ${d.boss ? 'bossb' : ''}" style="width:${w}px;height:${h}px;background:${d.col}">${dk ? '' : label}</div>`}<i class="shd"></i></div>`}
    <div class="uinfo">${dk ? `<div class="dkname">？？？</div>` : d.civ ? `<div class="nohp civ">平民 · 不能攻击<br>打倒护着他的人，他就投降</div>` : d.nohp ? `<div class="nohp">${e.block ? `<b class="blkv">${e.block}</b>` : ''}打不动 · 只能用仪式封回去</div>` : barHTML(e.hp, e.max, e.block)}${e.ammo != null && !e.dead && (d.elite || d.boss || d.showAmmo) ? `<div class="eammo ${e.ammo ? '' : 'zero'}" data-k="敌人弹仓">${Array.from({ length: e.d.ammo }, (_, k) => `<i class="${k < e.ammo ? 'f' : ''}"></i>`).join('')}${e.ammo ? '' : '<b>空</b>'}</div>` : ''}<div class="badges">${e.armor ? `<b class="arm" data-k="装甲">🛡 装甲 ${e.armor}</b>` : ''}${d.intel && !e.dead ? '<b class="arm intelc" data-k="档案箱">📜 档案箱</b>' : ''}${B.mech.enemyChips ? B.mech.enemyChips(e) : ''}${stsHTML(e.st)}</div></div></div>`;
}
/* 血条：格挡是左边的蓝色圆圈（同旧游戏） */
function barHTML(hp, max, blk) {
  return `<div class="hpw">${blk ? `<b class="blkv">${blk}</b>` : ''}<div class="bar ${blk ? 'blk' : ''}"><i style="width:${Math.max(0, hp) / max * 100}%"></i><span>${Math.max(0, hp)}/${max}</span></div></div>`;
}
const STN = { weak: ['虚弱', '#c8a0ff'], vuln: ['易伤', '#ff9a6a'], str: ['力量', '#ff6a5a'], shaken: ['动摇', '#e8c86a'], counter: ['架势', '#ff5a5a'], bleed: ['流血', '#ff4040'], para: ['麻痹', '#9ad0ff'], dazed: ['被打乱', '#aaa'] };
const stsHTML = st => Object.entries(st).filter(([k]) => STN[k]).map(([k, n]) => `<b class="st" style="color:${STN[k][1]};border-color:${STN[k][1]}" data-k="${STN[k][0]}">${STN[k][0]} ${n}</b>`).join('');
/* 主角脚下的资源（角色模块提供：韩松是弹仓和枪感），右侧按钮（韩松是装填） */
function heroInfoHTML() {
  const I = B.mech.info ? B.mech.info(B) : { main: '', chips: '', powers: {} };
  return `${I.main}<div class="badges">${I.chips || ''}${stsHTML(B.p.st)}${Object.keys(B.p.pw).map(k => `<b class="pw">${(I.powers || {})[k] || GPW[k] || k}</b>`).join('')}</div>`;
}
function actionBtns() {
  return E.actions(B).map((a, i) => `<button class="btn reload ${a.hot ? 'hot' : ''} ${a.urgent ? 'urgent' : ''}" style="bottom:${222 + i * 56}px" data-act="${a.id}" ${a.dis || B.busy ? 'disabled' : ''}>${a.label}${!TOUCH && a.key ? ` <small>${a.key}</small>` : ''}</button>`).join('');
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
  view.innerHTML = `<div class="bg battle ${SAN() && CH().under ? 'under' : ''}" style="background-image:${battleBgCss()}"></div>${topBar()}
   <div id="hero" class="unit" data-eid="hero"><div class="intent"></div>${heroBox()}
    <div class="uinfo">${barHTML(R.hp, R.maxHp, B.p.block)}${heroInfoHTML()}${inc ? `<div class="inc ${inc > B.p.block ? 'low' : 'ok'}">受到 ${Math.max(0, inc - B.p.block)}</div>` : ''}</div></div>
   <div id="enemies">${B.en.filter(e => !(e.dead && Date.now() - e.deadAt > 1400)).map(enemyHTML).join('')}</div>
   <div id="energy" class="${B.p.energy ? '' : 'empty'}">${B.p.energy}/${E.ENERGY}</div>
   ${actionBtns()}<button class="btn" id="endturn" ${B.busy ? 'disabled' : ''}>${B.busy ? '敌人回合' : `结束回合${TOUCH ? '' : ' <small>E</small>'}`}</button>
   <div class="pile" id="drawp">抽牌<b>${B.draw.length}</b></div><div class="pile" id="discp">弃牌<b>${B.disc.length}</b></div><div class="pile" id="exhp">消耗<b>${B.exh.length}</b></div>
   <div id="hand">${hand}</div>${B.sel >= 0 ? `<div id="tip" class="stay">点一个敌人打出（${TOUCH ? '点空白处取消' : 'Esc 取消'}）</div>` : ''}`;
  bindTop();
  $('#endturn').onclick = endTurn; view.querySelectorAll('[data-act]').forEach(el => el.onclick = () => doAct(el.dataset.act));
  refreshScreen = render;
  if (B.scryQ && B.scryQ.length && !view.querySelector('.scryov')) scryUI();
  if (B.ritual && !B.over) teach('ritual');
  $('#drawp').onclick = () => showPile('抽牌堆（顺序已打乱）', [...B.draw].sort((a, b) => a.id < b.id ? -1 : 1));
  $('#discp').onclick = () => showPile('弃牌堆', B.disc);
  $('#exhp').onclick = () => showPile('消耗', B.exh);
  view.querySelectorAll('#hand .card').forEach(el => {
    el.onclick = ev => { ev.stopPropagation(); if (DRAGGED) return; clickCard(+el.dataset.i); };
    if (!TOUCH) { el.onmouseenter = () => kwShow(el); el.onmouseleave = kwHide; }
  });
  view.querySelectorAll('.enemy').forEach(el => el.onclick = ev => { ev.stopPropagation(); clickEnemy(el.dataset.eid); });
  view.querySelectorAll('.badges b[data-k], .ammo[data-k], .eammo[data-k]').forEach(el => el.onclick = ev => { ev.stopPropagation(); const k = el.dataset.k; tipBox(`<b>${k}</b>：${KW[k] || ({ 力量: '每次攻击伤害增加等同层数。', 敌人弹仓: '机枪组、精英和首领脚下显示剩余弹数，每开一轮枪少一格；打空了下回合要「装弹」，那回合不会攻击。', 架势: '剑道军官摆开架势：这回合你每次打到他，他都会反击（数字是反击伤害）。少用多发的牌。', 意图不明: '便衣、伪装的敌人看不出要干什么：可能是攻击，也可能是在藏东西。', 动摇: '伪满军军心不稳：同伴倒下一个就 +1，到 2 层就溃逃。有日军或伪满警察队长督战时不逃。', 档案箱: '他背着装情报的档案箱，3 回合后就撤走。撤走之前打倒他，才能拿到这份情报。' })[k] || ''}`); });
  view.querySelector('.bg').onclick = () => { kwHide(); if (B.sel >= 0) { B.sel = -1; render(); } };
  fitEnemies(); flushFx(); dbgPanel();
  see(...B.en.map(e => 'e:' + e.key)); if (!B.busy && !B.over) { teachChar('render'); if (B.en.some(e => !e.dead && e.d.moves[e.move] && e.d.moves[e.move].i === 'reload')) teach('ereload'); if (B.en.some(e => !e.dead && e.st.shaken)) teach('shaken'); if (B.en.some(e => !e.dead && e.d.intel)) teach('escort'); if (B.en.some(e => !e.dead && e.d.moves.stance)) teach('counter'); if (B.en.some(e => !e.dead && e.d.moves[e.move] && e.d.moves[e.move].hide)) teach('hidden'); if (B.en.some(e => !e.dead && e.d.civ)) teach('civ'); if (B.en.some(e => !e.dead && e.d.interrupt)) teach('interrupt'); }
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
/* 离开战斗画面（胜利奖励、地图……）时，手牌的说明框跟着收掉，免得盖住后面的按钮 */
new MutationObserver(() => { if (!view.querySelector('#hand') || view.querySelector('.panel.loot')) kwHide(); }).observe(view, { childList: true });
/* 敌人一排太宽、会挤到韩松身上时，整排按比例缩小 */
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
  const mode = E.cardMode(B, c), el = view.querySelector(`#hand .card[data-i="${i}"]`);
  B.anim = 1; B.sel = -1; kwHide(); audio.card();
  if (el) { flyCard(el, d.type); el.style.visibility = 'hidden'; }
  await sleep(170);
  if (!B || !B.hand.includes(c)) { if (B) B.anim = 0; return; }
  E.playCard(B, B.hand.indexOf(c), tid); teachChar('play', d, mode);
  B.shotKind = mode === 'shoot' && B.mech.shotKind ? B.mech.shotKind(d) : null;
  if (mode === 'shoot') heroAct('shoot');
  else if (!mode && POSE[CHR().id]) { const ps = POSE[CHR().id](d); if (ps) { heroAct(ps); if (d.type === 'atk' && (DASH[CHR().id] && !(ps === 'shoot' && CHR().id === 'chenmo') || CHR().id === 'zhao' && ps === 'stab')) setTimeout(() => motion('hero', 'dash'), 0); } }
  else if (mode === 'bayonet') { heroAct('stab'); setTimeout(() => motion('hero', 'dash'), 0); audio.stab(); }
  B.anim = 0; render(); flushMsgs();
  if (mode === 'bayonet') say('子弹打光了，端起刺刀！', 1500);
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
/* 角色按钮（韩松：装填） */
function doAct(id) {
  if (!B || B.busy || B.over || B.anim) return;
  const a = E.actions(B).find(x => x.id === id); if (!a) return; if (a.dis) { tip(a.dis); return; }
  if (E.act(B, id)) { B.sel = -1; if (a.sfx && audio[a.sfx]) audio[a.sfx](); render(); motion('hero', 'recoil'); flushMsgs(); }
}
async function endTurn() {
  if (!B || B.busy || B.over || B.anim) return;
  B.busy = 1; B.sel = -1; kwHide(); E.endPlayerTurn(B); render();
  await sleep(350);
  for (const e of B.en.filter(x => !x.dead)) {
    if (B.over) break;
    const m = e.d.moves[e.move];
    if (m && m.d) { epose(e, 'atk'); motion(e.id, 'lunge'); const melee = /刺|刀|咬|扑|撞/.test(m.t); setTimeout(() => melee ? audio.stab() : audio.shot(/机枪|扫射|连射/.test(m.t) ? 'smg' : /手枪|驳壳/.test(m.t) ? 'pistol' : 'rifle'), 120); await sleep(180); }
    if (m && m.i === 'reload') audio.reload();
    E.enemyAct(B, e); render(); flushMsgs(); await sleep(m && m.d ? 560 : 380);
  }
  if (await checkEnd()) return;
  E.startTurn(B); B.busy = 0; render(); flushMsgs();
}
async function checkEnd() {
  const r = E.result(B); if (!r) return false;
  B.busy = 1; await sleep(800);
  if (r === 'lose') { heroAct('down'); audio.lose(); await sleep(900); const k = B.en.find(e => !e.dead && (e.d.boss || e.d.elite)) || B.en.find(e => !e.dead) || B.en[0]; R.killer = k ? k.d.name : ''; endScreen(false, `倒在了${CH().name}第 ${Math.max(1, R.floor)} 层`); return true; }
  const kind = B.kind, en = B.en, strong = B.strong, gotIntel = !!(B.strong && B.intelGot); B.over = 'win'; audio.win(); E.endBattle(B, true);
  /* 击杀数在引擎 kill() 里已经计过，这里不再重复加 */ if (kind === 'elite') R.elites = (R.elites || 0) + 1; if (kind === 'boss') R.bosses = (R.bosses || 0) + 1;
  R.relics.forEach(id => { const r = RELICS[id]; if (r.fightWon) r.fightWon(R); });
  if (R.deck.some(c => c.id === 'it_curse')) { R.itN = (R.itN || 0) + 1; ITC.n = R.itN; } /* 「它」那张牌的说明又长了一行 */
  if (gotIntel) { R.intel = (R.intel || 0) + 1; if (CH().id === 1 && !(R.fragRun || []).includes('ls_list')) R.advQ = 'ls_list'; } /* 第一次截下档案箱：回到地图时放「运输清单」 */
  /* 城里打仗：打赢 +1（精英 +2），另外每开 6 枪再 +1 */
  const shots = B.noise || 0, susUp = SUS() && kind !== 'boss' ? (kind === 'elite' ? 2 : 1) + Math.floor(shots / 6) : 0; if (susUp) addSus(susUp); winRewards.sus = susUp ? [susUp, shots] : null;
  if (kind === 'boss') { R.hp = Math.max(1, R.hp); B = null; R.food += 3; R.pending = { t: 'loot', kind: 'boss', food: 3, list: [], cards: rollCards(3, 'boss'), then: { t: 'bossrelic', opts: rollBossRelics() } }; save(); return lootScreen(), true; }
  winRewards(kind, en, strong, gotIntel); return true;
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
      const A = HERO_ART(), k = A.frames ? hp.h / FRAMES[A.dir].sh : 1, mx = A.frames ? hp.cx + A.muzzle[0] * k : hp.right - 8, my = hp.top + (A.frames ? A.muzzle[1] * k : hp.h * .27), ty = p.top + p.h * .4;
      later(at, () => {
        audio.shot(kind || 'rifle');
        if (!(A.frames && kind === 'rifle')) add('muzzle', mx, my, 120); motion('hero', 'recoil'); /* 步枪的火光帧图里已经画了 */
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
/* 通用卡给的能力在状态栏上的名字 */
const GPW = { whet: '油石', cblk: '防寒大衣', ePlus: '老兵经验', drawPlus: '马蹄表', stance: '扎马步', listen: '侦听', quickH: '快手' };
/* 奖励池：只出当前角色的牌和通用牌 */
const poolCards = () => Object.values(CARDS).filter(d => d.rar !== 'basic' && d.rar !== 'loot' && !d.colorless && (!d.ch || d.ch === R.char));
/* 通用卡（谁都能拿）：只在商店固定那一格和事件里出 */
const rollColorless = () => { const x = Math.random(), rar = x < .15 ? 'r' : x < .5 ? 'u' : 'c'; return pickOne(Object.values(CARDS).filter(d => d.colorless && d.rar === rar)).id; };
function rollCards(n, elite) {
  const pool = poolCards(), out = [];
  for (let k = 0; out.length < n && k < 200; k++) {
    const x = Math.random(), rar = elite === 'boss' ? 'r' : x < (elite ? .2 : .08) ? 'r' : x < (elite ? .6 : .42) ? 'u' : 'c'; /* Boss 奖励全是稀有牌（同杀戮尖塔） */
    const cand = pool.filter(d => d.rar === rar && !out.includes(d.id)); if (!cand.length) continue; out.push(pickOne(cand).id);
  }
  return out.map(id => mk(id));
}
/* 随身物品：按稀有度抽，只出当前角色能用的、还没有的 */
let POOL_SU = 1; /* 0 = 从日伪军身上缴获，不出苏联物品 */
const relicPool = rar => Object.values(RELICS).filter(r => r.rar === rar && (!r.ch || r.ch === R.char) && !has(r.id) && (POOL_SU || !r.su));
function rollRelic(w = { c: 50, u: 33, r: 17 }) {
  for (let k = 0; k < 20; k++) { let x = Math.random() * 100, rar = 'c'; for (const [r, p] of Object.entries(w)) { x -= p; if (x <= 0) { rar = r; break; } }
    const p = relicPool(rar); if (p.length) return pickOne(p).id; }
  const any = ['c', 'u', 'r'].flatMap(relicPool); return any.length ? pickOne(any).id : null;
}
const rollBossRelics = () => { const p = relicPool('boss'); const out = []; while (out.length < 3 && p.length) out.push(p.splice(Math.floor(Math.random() * p.length), 1)[0].id); return out; };
const rollItem = () => pickOne(Object.keys(ITEMS).filter(id => !ITEMS[id].act || ITEMS[id].act === R.act)); /* 本章专用的（假国民手帐、马灯）只在那一章出 */
function winRewards(kind, en, strong, gotIntel) {
  const food = kind === 'elite' ? 2 : 1; R.food += food;
  const list = [];
  for (const e of en) if (!e.fled && e.d.loot && Math.random() < e.d.lootP && !list.includes(e.d.loot)) list.push(e.d.loot);
  POOL_SU = 0; const relic = kind === 'elite' ? rollRelic() : null; POOL_SU = 1; const item = Math.random() < (kind === 'elite' ? .5 : .4) ? rollItem() : null;
  B = null; R.pending = { t: 'loot', list, kind, food, strong, intel: gotIntel, sus: winRewards.sus, relic, item, cards: rollCards(3, kind === 'elite') }; save();
  lootScreen();
}
/* 战利品：先选牌，再逐个处理缴获的武器。进度存在 R.pending 里，刷新页面不会丢也不会重抽 */
function lootScreen() {
  const P = R.pending;
  if (!P || P.t !== 'loot') return mapScreen();
  if (P.relic) { gainRelic(P.relic, 1); P.relicShown = P.relic; delete P.relic; } if (P.item) { if (R.items.length < ITEM_SLOTS) { R.items.push(P.item); see('i:' + P.item); teach('item'); } P.itemShown = P.item; delete P.item; } save();
  view.innerHTML = `<div class="bg ${P.kind === 'boss' ? 'ev ch' + CH().id : 'battle dim'}"></div>${topBar()}`; bindTop();
  if (P.cards) {
    view.insertAdjacentHTML('beforeend', `<div class="panel loot"><h2>${P.kind === 'boss' ? (SUS() ? '打垮了追捕！' : '击溃了讨伐队！') : P.kind === 'elite' ? '打退了精英！' : '战斗胜利'}</h2>
     <p>缴获口粮 +${P.food || 1}${P.strong ? (P.intel ? (SUS() ? '　📜 抢下了公文包，得到一份情报' : '　📜 抢下了档案箱，得到一份情报') : (SUS() ? '　公文包被带走了，这份情报没拿到' : '　档案箱被带走了，这份情报没拿到')) : ''}${P.sus ? `　🕵 枪声惊动了巡警：可疑度 +${P.sus[0]}${P.sus[1] ? `（开了 ${P.sus[1]} 枪）` : ''}` : ''}</p>${P.relicShown ? `<p class="gain">得到随身物品：${RELICS[P.relicShown].icon} <b>${RELICS[P.relicShown].name}</b>　<small>${RELICS[P.relicShown].desc}</small></p>` : ''}${P.itemShown ? `<p class="gain">缴获背包用品：${ITEMS[P.itemShown].icon} <b>${ITEMS[P.itemShown].name}</b>${R.items.includes(P.itemShown) ? '' : '（背包满了，没拿）'}</p>` : ''}<p class="sub">${P.kind === 'boss' ? '选一张稀有牌加入牌组：' : '选一张牌加入牌组：'}</p><div class="row">${P.cards.map((c, i) => cardHTML(c, '', `data-k="${i}"`)).join('')}</div>
     <button class="btn ghost" id="l_skip">不要牌</button></div>`); bindTop();
    const next = () => { delete P.cards; save(); lootScreen(); };
    view.querySelectorAll('.loot .card').forEach(el => el.onclick = () => { const c = P.cards[+el.dataset.k]; R.deck.push(c); tip('加入牌组：' + CARDS[c.id].name); next(); });
    $('#l_skip').onclick = next; return;
  }
  if (P.list && P.list.length) return offerLoot(P.list[0], () => { P.list.shift(); save(); lootScreen(); });
  if (P.then) { R.pending = P.then; save(); return resume(); }
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
  teach('rest');
  R.temp = TEMP_MAX; if (SUS()) R.sus = 0; if (SAN() && !R.pending.sanDone) { addSan(3); R.pending.sanDone = 1; } save(); const heal = Math.floor(R.maxHp * .3) + rsum('restHeal'); refreshScreen = restScreen;
  view.innerHTML = `<div class="bg rest ch${CH().id}"></div>${topBar()}<div class="panel"><h2>${placeName('rest')}</h2><p>${placeText('rest', '林子深处的地窨子，灶里的火压得很低。体温回满了。')}</p>
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

// ---------- 事件（章节文件里的事件池；一局里不重复） ----------
/* 敬畏：看得见的事件标记，只影响以后的事件分支，不改战斗数值。选完当场老沈说一句 */
const AWE_UP = ['山里的规矩，守着不吃亏。', '老辈人信这个。咱不全信，可也得敬着。'];
const AWE_DN = ['冲撞了。往后走道儿，留点神。', '咱不信这个，可山里人信。往后碰上他们，话得想好了说。'];
function eventScreen(force) {
  teach('event');
  const pool = CH().events.filter(e => !(R.seenEv || []).includes(e.id) && (!e.when || e.when(R)));
  let ev = (force && CH().events.find(e => e.id === force)) || pickOne(pool.length ? pool : CH().events);
  /* 回声：理智 3 以下，有时候碰上的是以前经历过的事，换了个样子又来一遍 */
  const old = CHAPTERS.slice(0, 2).flatMap(c => c.events).filter(e => (R.seenEv || []).includes(e.id) && !e.when);
  if (!force && SAN() && R.san <= 3 && old.length && Math.random() < .4) { const o = pickOne(old); ev = { ...o, id: 'echo_' + o.id, title: o.title + '？', text: `${o.text}<br><i class="echo">……这件事，好像已经发生过一次了。那时候，旁边的人是这几个吗？</i>` }; teach('echo'); }
  R.seenEv = [...(R.seenEv || []), ev.id]; save(); refreshScreen = () => {};
  let fightEnc = null, aweN = 0, aweLine = '', susN = 0, sanN = 0; const waits = [];
  const G = { rng: Math.random, foodN: () => R.food, food: n => { R.food = Math.max(0, R.food + n); }, temp: n => { R.temp = Math.max(0, Math.min(TEMP_MAX, R.temp + n)); },
    hp: n => { R.hp = Math.min(R.maxHp, R.hp + n); }, heal: n => { R.hp = Math.min(R.maxHp, R.hp + n); }, maxHp: n => { R.maxHp += n; R.hp += n; },
    upgrade: () => waits.push('up'), removeCard: () => waits.push('rm'), addCard: id => R.deck.push(mk(id)), fight: enc => { fightEnc = enc; },
    relic: id => gainRelic(id || rollRelic()), item: id => gainItem(id || rollItem()), hasRelic: id => has(id), awe: (n, line) => { R.awe = (R.awe || 0) + n; aweN += n; if (line) aweLine = line; }, lang: k => (CHR().lang || {})[k] || 0, char: R.char, sus: n => { addSus(n); susN += n; },
    flag: k => { R.flags = [...new Set([...(R.flags || []), k])]; }, hasFlag: k => (R.flags || []).includes(k), hasItem: () => R.items.length > 0, loseItem: () => R.items.splice(Math.floor(Math.random() * R.items.length), 1),
    hasItemId: id => R.items.includes(id), useItemId: id => { const i = R.items.indexOf(id); if (i >= 0) R.items.splice(i, 1); },
    san: n => { addSan(n); sanN += n; }, curse: () => { R.deck.push(mk('it_curse')); see('c:it_curse'); }, lure: n => { R.lure = (R.lure || 0) + n; },
    they: (n, f, fin) => they(n, f, fin), aweN: () => R.awe || 0, say: () => {} };
  const draw = () => {
    view.innerHTML = `<div class="bg ev ch${CH().id}"></div>${ev.pic ? `<img class="evpic" src="${ev.pic}" alt="">` : ''}${topBar()}<div class="panel evp"><h2>${ev.title}</h2><p>${ev.text}</p><div class="col">${ev.opts.map((o, i) => { const ok = !o.need || o.need(G); return `<button class="btn opt" data-o="${i}" ${ok ? '' : 'disabled'}>${o.t}${String(o.f).includes('awe(') ? '<small class="awetag">敬畏</small>' : ''}${ok ? '' : '（条件不够）'}</button>`; }).join('')}</div></div>`;
    bindTop();
    view.querySelectorAll('[data-o]').forEach(b => b.onclick = () => {
      const msg = ev.opts[+b.dataset.o].f(G); save();
      const after = () => { if (R.hp <= 0) { R.hp = 0; return endScreen(false, `倒在了${CH().name}里`); } if (fightEnc) { R.pending = { t: 'fight', enc: fightEnc }; save(); return battle(fightEnc, 'fight'); } mapScreen(); };
      const cont = () => { const w = waits.shift(); if (w === 'up') return upgradePick(() => cont()); if (w === 'rm') return removePick(() => cont()); after(); };
      const aweP = aweN ? `<p class="awe">敬畏 ${aweN > 0 ? '+' : ''}${aweN}（现在 ${R.awe}）<br><b>${MENTOR.name}</b>：「${aweLine || (aweN > 0 ? AWE_UP : AWE_DN)[Math.floor(Math.random() * 2)]}」</p>` : '';
      const susP = (susN ? `<p class="awe">🕵 可疑度 ${susN > 0 ? '+' : ''}${susN}（现在 ${R.sus}/10）</p>` : '') + (sanN ? `<p class="awe">🕯 理智 ${sanN > 0 ? '+' : ''}${sanN}（现在 ${R.san}/10）</p>` : '');
      if (msg) { view.querySelector('.evp').innerHTML = `<h2>${ev.title}</h2><p>${msg}</p>${aweP}${susP}<button class="btn" id="ev_ok">继续</button>`; bindTop(); $('#ev_ok').onclick = cont; } else cont();
    });
  };
  refreshScreen = draw; draw();
}
function removePick(done) {
  if (R.deck.length <= 5) { tip('牌组太少了'); return done(false); }
  showPile('选一张牌去掉', R.deck.filter(c => !CARDS[c.id].noRemove), c => { R.deck.splice(R.deck.indexOf(c), 1); tip('去掉了 ' + CARDS[c.id].name); save(); done(true); });
}

// ---------- 老乡（代替商店）：用口粮换东西 ----------
function shopScreen() {
  teach('shop');
  const P = R.pending;
  if (!P.stock) { P.stock = { cards: [...rollCards(3).map(c => ({ c, price: 2 })), { c: mk(rollColorless()), price: 3 }], item: { id: rollItem(), price: 2 }, relic: { id: rollRelic({ c: 40, u: 40, r: 20 }), price: 5 }, remove: 3 }; save(); }
  const S = P.stock; refreshScreen = shopScreen;
  const pr = (n, sold) => sold ? '<span class="price no">已换</span>' : `<span class="price ${R.food < n ? 'no' : ''}">🍞 ${n}</span>`;
  view.innerHTML = `<div class="bg shop ch${CH().id}"></div>${topBar()}<div class="panel shop wide"><h2>${placeName('shop')}</h2><p>${placeText('shop', '一个赶爬犁的老乡在林边歇脚。他不要钱，只想换点吃的。')}</p>
    <div class="row">${S.cards.map((x, i) => `<div class="shopitem ${x.sold ? 'sold' : ''}" data-buy="c${i}">${cardHTML(x.c)}${pr(x.price, x.sold)}</div>`).join('')}
      ${S.item.id ? `<div class="shopitem rel ${S.item.sold ? 'sold' : ''}" data-buy="item"><b class="big">${ITEMS[S.item.id].icon}</b><b>${ITEMS[S.item.id].name}</b><small>${ITEMS[S.item.id].desc}</small>${pr(S.item.price, S.item.sold)}</div>` : ''}
      ${S.relic.id ? `<div class="shopitem rel ${S.relic.sold ? 'sold' : ''}" data-buy="relic"><b class="big">${RELICS[S.relic.id].icon}</b><b>${RELICS[S.relic.id].name}</b><small>${RELICS[S.relic.id].desc}</small>${pr(S.relic.price, S.relic.sold)}</div>` : ''}
      <div class="shopitem rel ${S.removed ? 'sold' : ''}" data-buy="rm"><b class="big">✂</b><b>去掉一张牌</b><small>让牌组更精简</small>${pr(S.remove, S.removed)}</div></div>
    <button class="btn" id="s_leave">道个谢，继续赶路</button></div>`;
  bindTop();
  const pay = n => { if (R.food < n) { tip('口粮不够'); return false; } R.food -= n; return true; };
  view.querySelectorAll('[data-buy]').forEach(el => el.onclick = () => {
    const k = el.dataset.buy;
    if (k[0] === 'c') { const x = S.cards[+k.slice(1)]; if (x.sold || !pay(x.price)) return; x.sold = 1; R.deck.push(x.c); tip('加入牌组：' + CARDS[x.c.id].name); }
    else if (k === 'item') { if (S.item.sold || R.items.length >= ITEM_SLOTS && (tip('背包满了'), 1) || !pay(S.item.price)) return; S.item.sold = 1; R.items.push(S.item.id); see('i:' + S.item.id); teach('item'); }
    else if (k === 'relic') { if (S.relic.sold || !pay(S.relic.price)) return; S.relic.sold = 1; gainRelic(S.relic.id); }
    else if (k === 'rm') { if (S.removed || R.food < S.remove) { if (!S.removed) tip('口粮不够'); return; } return removePick(ok => { if (ok) { R.food -= S.remove; S.removed = 1; } save(); shopScreen(); }); }
    save(); shopScreen();
  });
  $('#s_leave').onclick = mapScreen;
}

// ---------- 物资埋藏点（代替宝箱） ----------
function treasureScreen() {
  teach('treasure');
  const P = R.pending; if (!P.relic && !P.taken) { P.relic = rollRelic(); save(); } refreshScreen = treasureScreen;
  const r = RELICS[P.relic];
  view.innerHTML = `<div class="bg treasure ch${CH().id}"></div>${topBar()}<div class="panel wide"><h2>${placeName('treasure')}</h2><p>${placeText('treasure', '树上刻着约好的记号。扒开积雪，底下埋着一个油布包。')}</p>
    ${r ? `<div class="relicbig"><b class="big">${r.icon}</b><b>${r.name}</b><p>${r.desc}</p></div><br><button class="btn" id="tr_take">收下</button>` : '<p class="sub">里面是空的。</p><button class="btn" id="tr_take">继续</button>'}</div>`;
  bindTop();
  $('#tr_take').onclick = () => { if (r) gainRelic(P.relic); P.taken = 1; mapScreen(); };
}

// ---------- Boss 物品三选一（第二章开始才派得上用场） ----------
function bossRelicScreen() {
  const P = R.pending, opts = (P.opts || []).filter(id => RELICS[id]);
  const finish = () => { R.pending = { t: 'actend' }; save(); actEnd(); };
  if (!opts.length) return finish();
  view.innerHTML = `<div class="bg ev ch${CH().id}"></div>${topBar()}<div class="panel wide"><h2>${SUS() ? "缴获追捕者的东西" : "缴获讨伐队的东西"}</h2><p class="sub">选一件带走（Boss 物品，下一章开始生效）</p>
    <div class="row">${opts.map(id => `<div class="relicbig pick" data-r="${id}"><b class="big">${RELICS[id].icon}</b><b>${RELICS[id].name}</b><p>${RELICS[id].desc}</p></div>`).join('')}</div><button class="btn ghost" id="br_skip">都不要</button></div>`;
  bindTop();
  view.querySelectorAll('[data-r]').forEach(el => el.onclick = () => { gainRelic(el.dataset.r); finish(); });
  $('#br_skip').onclick = finish;
}

// ---------- 章节结尾和过渡 ----------
/* 结尾插画 → 战役地图 → 有下一章就进下一章（回血、体温回满、补口粮），没有就结算 */
function actEnd() {
  const C = CH(), next = CHAPTERS[C.id];
  const endAdv = C.id === 1 ? ((R.intel || 0) >= 1 ? ADV_CH1_END : null) : C.id === 2 ? ADV_CH2_END : null;
  story([{ img: OUTRO[C.id], t: C.winText }], () => (endAdv ? f => adv(endAdv, f) : f => f())(() => campaign(C.id, () => next ? startAct(C.id + 1) : endScreen(true), next ? `第${'一二三'[C.id - 1]}章完。下一站：${next.name}。` : `第${'一二三'[C.id - 1]}章完。${C.id < 3 ? `第${'一二三'[C.id]}章正在制作中，敬请期待。` : ''}`)));
}
function startAct(n) {
  const heal = Math.floor(R.maxHp * .5);
  R.act = n; R.hp = Math.min(R.maxHp, R.hp + heal); R.temp = TEMP_MAX; R.food += 3; R.sus = 0; R.san = 10; R.lure = 0;
  R.floor0 = (R.floor0 || 0) + R.floor; R.floor = 0; R.fights = 0; R.pos = null; R.path = []; R.boss = null; delete R.pending;
  R.map = genMap(); save();
  const go = () => { tip(`进入${CH().name}：生命回复 ${heal}，口粮 +3${SAN() ? '。地底下，注意「理智」' : SUS() ? '。城里不比山里：注意「可疑度」' : '，体温回满'}`); mapScreen(); if (SUS()) teach('sus'); if (SAN()) teach('san'); };
  const op = n === 2 ? ADV_CH2_OPEN : null, go2 = op ? () => adv(op, go) : go;
  CH().intro ? story(CH().intro, go2) : go2();
}

// ---------- 结束 ----------
function endScreen(win, how = '') {
  $('#dbg')?.remove(); B = null; clearSave(); const C = CH(), floor = (R.floor0 || 0) + Math.max(1, R.floor);
  const rare = R.deck.filter(c => CARDS[c.id] && (CARDS[c.id].rar === 'r' || CARDS[c.id].rar === 'loot'));
  view.innerHTML = `<div class="tbg ${win ? 'endwin' : 'endlose'}"></div><div class="endw2">
   <div class="ribbon ${win ? 'win' : ''}">${win ? `第${'一二三'[C.id - 1] || C.id}章 完` : '阵 亡'}</div>
   <p class="endsub">${win ? (C.id >= 3 ? `天亮了。你们带着 ${R.intel || 0} 份证据爬出了地底。<br><b>真结局「长夜将尽」正在制作中${(R.intel || 0) >= 3 ? '：三份证据都在你手里。' : '：集齐三份证据才能看到。'}</b>` : `第${'一二三'[C.id - 1]}章完。`) : `${CHR().name}${how}${R.killer ? `，被<b>${R.killer}</b>击倒` : ''}。`}</p>
   <div class="endgrid">
    <table class="score"><tr><td>走过的层数</td><td>${floor}</td></tr><tr><td>击倒敌人</td><td>${R.kills || 0}</td></tr><tr><td>打退精英</td><td>${R.elites || 0}</td></tr><tr><td>击溃首领</td><td>${R.bosses || 0}</td></tr><tr><td>情报</td><td>${R.intel || 0} / 3</td></tr><tr><td>剩余生命</td><td>${Math.max(0, R.hp)} / ${R.maxHp}</td></tr></table>
    <div class="endbag"><h4>随身物品 ${R.relics.length}</h4><div class="erel">${R.relics.map(id => `<b title="${esc(RELICS[id].name)}">${RELICS[id].icon}</b>`).join('')}</div>
     <h4>牌组 ${R.deck.length} 张</h4><p class="edeck">${rare.length ? '稀有：' + rare.map(c => CARDS[c.id].name + (c.up ? '+' : '')).join('、') : '没有稀有牌'}</p></div>
   </div>
   ${R.they && Object.keys(R.they).length ? `<div class="theyw"><h4>他们</h4>${Object.entries(R.they).map(([n, o]) => `<p><b>${n}</b>　${o.fate}</p>`).join('')}</div>` : ''}
   ${win ? '<p class="endsub small">谢谢试玩！</p>' : ''}<button class="btn big" id="e_t">回到标题</button></div>`;
  $('#e_t').onclick = () => { R = null; title(); };
}

// ---------- 键盘 ----------
addEventListener('keydown', e => {
  if (!B || B.over || document.querySelector('.overlay') || !$('#hand')) return;
  if (e.key === 'e' || e.key === 'E') endTurn();
  else { const a = E.actions(B).find(x => x.key && x.key.toLowerCase() === e.key.toLowerCase()); if (a) doAct(a.id); }
  if (e.key === 'r' || e.key === 'R') return;
  else if (e.key === 'Escape') { B.sel = -1; render(); }
  else if (/^[1-9]$/.test(e.key)) { const i = +e.key - 1; if (i < B.hand.length) clickCard(i); }
  else if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && B.sel >= 0) { const a = E.alive(B); B.aimI = ((B.aimI || 0) + (e.key === 'ArrowRight' ? 1 : -1) + a.length) % a.length; aimMark(a[B.aimI].id); e.preventDefault(); }
  else if ((e.key === 'Enter' || e.key === ' ') && B.sel >= 0) { e.preventDefault(); const a = E.alive(B); play(B.sel, a[(B.aimI || 0) % a.length].id); }
});

// ---------- 调试面板（?debug） ----------
function dbgPanel() {
  if (!DEBUG) return; $('#dbg')?.remove(); const d = document.createElement('div'); d.id = 'dbg';
  const btns = B && !B.over ? [['胜利', () => { E.alive(B).forEach(e => { e.hp = 0; e.dead = 1; e.deadAt = Date.now(); }); render(); checkEnd(); }], ...(B.mech.dbg || []).map(([t, f]) => [t, () => { f(B); render(); }]),
    ['+能量', () => { B.p.energy += 3; render(); }], ['抽牌', () => { E.drawCards(B, 3); render(); }], ['给牌', () => showPile('给一张牌（加入手牌）', Object.keys(CARDS).map(id => ({ id, up: 0, uid: uidN++ })), c => { B.hand.push(c); render(); })], ['满血', () => { R.hp = R.maxHp; render(); }], ...(SAN() ? [['神官1血', () => { const p = B.en.find(e => e.key === 'priest' && !e.dead); if (p) { p.hp = 1; p.block = 0; } render(); }], ['理智0', () => { R.san = 0; render(); }], ['点灯', () => { B.lit = 1; render(); }]] : [])]
    : R ? [['拼图过场', () => { const all = Object.keys(FRAGS).filter(k => FRAGS[k].lines), cur = all.filter(k => FRAGS[k].ch === CH().id); fragScene(pickOne(cur.length ? cur : all), mapScreen); }], ['开场过场', () => adv(CH().id === 2 ? ADV_CH2_OPEN : ADV_CH1_OPEN, mapScreen)], ['去Boss', () => { R.pos = { r: ROWSOF() - 1, c: R.map[ROWSOF() - 1].findIndex(Boolean) }; mapScreen(); }], ['满血', () => { R.hp = R.maxHp; mapScreen(); }], ['口粮+5', () => { R.food += 5; mapScreen(); }], ['体温0', () => { R.temp = 0; mapScreen(); }], ['精英战', () => { const enc = pickOne(CH().enc.elite); R.pending = { t: 'elite', enc }; battle(enc, 'elite'); }], ['加强精英', () => { const enc = pickOne(CH().enc.elite); R.pending = { t: 'elite', enc, strong: true }; battle(enc, 'elite', true); }], ['犬机狙', () => battle(['dog', 'mg', 'sniper'], 'fight')], ['两个步兵', () => battle(['inf', 'inf'], 'fight')], ['重机枪', () => battle(['inf', 'hmg'], 'elite')], ['警察队长', () => battle(['puppet', 'pcap', 'puppet'], 'elite')], ['柏木', () => battle(['dog', 'kcap', 'dog'], 'boss')], ['Boss战', () => { bossKey(); R.pending = { t: 'boss', enc: R.bossEnc }; battle(R.bossEnc, 'boss'); }], ['换Boss', () => { R.boss = null; bossKey(); mapScreen(); }], ['第二章', () => { if (R.act < 2) startAct(2); }], ['第三章', () => { if (R.act < 3) startAct(3); }], ['平民战', () => battle(['ronin', 'jpcop', 'bureaucrat', 'merchant'], 'fight')], ['新兵种', () => battle(['cav', 'radio', 'ski'], 'fight')], ['步兵炮', () => battle(['supply', 'gun', 'medic'], 'elite')], ['装甲车', () => battle(['armorcar', 'kensei', 'informer'], 'elite')], ['溃兵', () => battle(['officer', 'oldsoldier', 'surgeon', 'depotchief'], 'elite')], ['城里四人', () => battle(['kempei', 'patrol', 'spy', 'escort2'], 'elite')], ['押运剑道', () => battle(['escort', 'kendo', 'agent', 'escort3'], 'elite')], ['桐野', () => battle(['kempei', 'kirino'], 'boss')], ['久我', () => battle(['spy', 'kuga'], 'boss')], ['禁卫监工', () => battle(['guard', 'reservist', 'overseer'], 'fight')], ['理智-3', () => { addSan(-3); mapScreen(); }], ['萨满', () => eventScreen('shaman')], ['神官', () => battle(['priest'], 'boss')], ['墓里', () => battle(['shadow', 'echo', 'tombkeeper'], 'fight')], ['可疑度+3', () => { addSus(3); mapScreen(); }], ['章节结尾', () => { R.pending = { t: 'actend' }; actEnd(); }], ['阵亡', () => { R.killer = '讨伐队长 · 村濑'; endScreen(false, `倒在了${CH().name}第 ${Math.max(1, R.floor)} 层`); }], ['老乡', () => enterNode('shop')], ['埋藏点', () => enterNode('treasure')], ['事件', () => enterNode('event')], ['逃兵', () => eventScreen('deserter')], ['黄皮子', () => eventScreen('weasel')], ['保家仙', () => eventScreen('baojiaxian')], ['给物品', () => { R.relics.push(...Object.keys(RELICS).filter(id => !has(id) && RELICS[id].rar !== 'boss' && (!RELICS[id].ch || RELICS[id].ch === R.char)).slice(0, 4)); mapScreen(); }], ['给背包', () => { R.items = Object.keys(ITEMS).slice(0, ITEM_SLOTS); mapScreen(); }]] : [];
  btns.forEach(([t, f]) => { const b = document.createElement('button'); b.textContent = t; b.onclick = ev => { ev.stopPropagation(); f(); }; d.appendChild(b); });
  if (btns.length) stage.appendChild(d);
}
setInterval(() => { if (B && !B.busy && !B.over && E.result(B)) checkEnd(); }, 600);

title();
