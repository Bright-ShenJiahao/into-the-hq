// 交互回归：透明画布选错目标、缩放坐标、预览污染战斗、人物片段过密。
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as E from '../src/engine.js';
import { CHARS } from '../src/data.js';

const snapshot = B => JSON.stringify(B, (k, v) => ['K', 'G', 'rng'].includes(k) ? undefined : v);
let checked = 0;
function battle(char, id, setup = () => {}) {
  let draws = 0; const rng0 = E.mulberry(7), rng = () => { draws++; return rng0(); };
  const R = { char, hp: CHARS[char].hp, maxHp: CHARS[char].hp, temp: 10, deck: [], items: [], relics: [], flags: [] };
  const B = E.startBattle(R, ['inf', 'inf'], 'fight', rng);
  B.hand = [{ id, up: 0, uid: 1 }]; B.p.energy = 10; setup(B);
  const before = snapshot(B), n = draws, random = Math.random;
  const preview = E.previewCard(B, 0, B.en[0].id);
  assert.equal(snapshot(B), before, `${id} 预览修改了真实战斗`);
  assert.equal(draws, n, `${id} 预览推进了真实随机数`);
  assert.equal(Math.random, random, `${id} 预览未恢复全局随机数`);
  E.playCard(B, 0, B.en[0].id);
  if (!preview.random) for (const p of preview.enemies) {
    const after = B.en.find(e => e.id === p.id);
    assert.equal(p.hp, Math.max(0, after.hp), `${id} 扣血预览与实际不符`);
    assert.equal(p.block, Math.max(0, after.block), `${id} 破盾预览与实际不符`);
  }
  checked++; return preview;
}
assert.equal(battle('hansong', 'shoot', B => { B.en[0].block = 4; }).enemies[0].blocked, 4);
assert.equal(battle('hansong', 'shoot', B => { B.ammo = 0; }).enemies[0].damage, 5);
battle('hansong', 'shoot', B => { B.en[0].armor = 6; B.en[0].marks = 2; B.p.st.weak = 1; });
battle('hansong', 'barrage');
assert.equal(battle('hansong', 'shoot', B => { B.en[0].hp = 1; }).enemies[0].killed, true);
battle('chenmo', 'cm_flick', B => { B.p.knife = 3; });
assert.ok(battle('zhao', 'zt_pack').enemies[0].charges.length);
battle('shen', 'sq_meet');
assert.equal(battle('hansong', 'h_sweep').random, true);

const source = fs.readFileSync(new URL('../src/game.js', import.meta.url), 'utf8');
const targeting = source.slice(source.indexOf('const enemyAt ='), source.indexOf('const aimMark ='));
const rect = (left, top, width, height) => ({ left, top, width, height, right: left + width, bottom: top + height });
for (const scale of [1, .5]) {
  const a = { id: 'e1' }, b = { id: 'e2' }, civ = { id: 'civ', d: { civ: true } };
  const box = r => ({ getBoundingClientRect: () => r });
  const make = (x, id) => ({ querySelector: () => box(rect(x * scale, 100 * scale, 80 * scale, 180 * scale)), querySelectorAll: () => [box(rect(x * scale, 290 * scale, 80 * scale, 20 * scale))], id });
  const units = { e1: make(100, 'e1'), e2: make(200, 'e2'), civ: make(300, 'civ') };
  const context = { B: { en: [a, b, civ] }, E: { alive: B => B.en.filter(e => !e.d?.civ) }, view: { querySelector: selector => { const id = selector.match(/data-eid="([^"]+)"/)[1]; return selector.includes('.sprw') ? units[id].querySelector() : units[id]; } }, stXY: ev => [ev.clientX / scale, ev.clientY / scale] };
  vm.runInNewContext(targeting + '\nglobalThis.hit = enemyAt; globalThis.point = aimPoint;', context);
  assert.equal(context.hit({ clientX: 140 * scale, clientY: 180 * scale }).id, 'e1');
  assert.equal(context.hit({ clientX: 240 * scale, clientY: 180 * scale }).id, 'e2');
  assert.equal(context.hit({ clientX: 140 * scale, clientY: 300 * scale }).id, 'e1');
  assert.equal(context.hit({ clientX: 340 * scale, clientY: 180 * scale }), null);
  assert.equal(context.hit({ clientX: 195 * scale, clientY: 180 * scale }), null);
  assert.deepEqual(Array.from(context.point(a, {})), [140, 190]);
}

const fragments = source.slice(source.indexOf('function pickFrag(at)'), source.indexOf('function fragScene('));
const context = { R: { char: 'hansong', eventNodes: 3, lastFragEvent: 1 }, CH: () => ({ id: 1 }), FRAGS: { fresh: { ch: 1, at: 'event' }, old: { ch: 1, at: 'event' } }, fragGot: id => id === 'old', pickOne: a => a[0], Math: { random: () => 0 } };
vm.runInNewContext(fragments + '\nglobalThis.pick = pickFrag;', context);
assert.equal(context.pick('event'), null, '两个片段之间应至少隔两个事件节点');
context.R.eventNodes = 4; assert.equal(context.pick('event'), 'fresh');
context.fragGot = () => true; assert.equal(context.pick('event'), null, '不重复播放已收集普通片段');
context.FRAGS.main = { ch: 1, at: 'event', force: 1 }; assert.equal(context.pick('event'), 'main', '必要主线保留');
console.log(`通过：${checked} 个战斗预览场景、电脑/手机缩放命中与箭头坐标、剧情片段间隔和主线保留。`);
