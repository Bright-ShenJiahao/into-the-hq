// 音效：全部用 WebAudio 现场合成（不需要音频文件），做法和《通往顶端》一样。
// 浏览器规定首次点击后才能出声。M 键静音。
export function createAudio() {
  let ac = null, out, on = true;
  try { on = localStorage.getItem('ithq_mute') !== '1'; } catch (e) {}
  function init() {
    if (ac) return; ac = new (window.AudioContext || window.webkitAudioContext)();
    out = ac.createGain(); out.gain.value = on ? .55 : 0; out.connect(ac.destination);
  }
  const unlock = () => { init(); if (ac.state === 'suspended') ac.resume(); };
  addEventListener('pointerdown', unlock);
  addEventListener('keydown', e => { unlock(); if (e.key === 'm' || e.key === 'M') toggle(); });
  function toggle() { on = !on; try { localStorage.setItem('ithq_mute', on ? '0' : '1'); } catch (_) {} if (out) out.gain.setTargetAtTime(on ? .55 : 0, ac.currentTime, .05); return on; }
  const ok = () => ac && on && ac.state === 'running';
  /* 白噪声：枪声、爆裂、刺刀风声都靠它 */
  function noise(t, d, { vol = .3, hp = 0, lp = 0, bp = 0, q = 1 } = {}) {
    const len = Math.ceil(ac.sampleRate * d), b = ac.createBuffer(1, len, ac.sampleRate), x = b.getChannelData(0);
    for (let i = 0; i < len; i++) x[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
    const s = ac.createBufferSource(); s.buffer = b; let n = s;
    for (const [type, f] of [['highpass', hp], ['lowpass', lp], ['bandpass', bp]]) if (f) { const fl = ac.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q; n.connect(fl); n = fl; }
    const g = ac.createGain(); g.gain.value = vol; n.connect(g); g.connect(out); s.start(t);
  }
  function tone(t, f0, f1, d, { type = 'sine', vol = .25 } = {}) {
    const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + d);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + d); o.connect(g); g.connect(out); o.start(t); o.stop(t + d + .02);
  }
  const A = {
    toggle, isOn: () => on,
    /* 枪声：kind = rifle 步枪（重）/ smg 冲锋枪（短促）/ pistol 手枪（脆） */
    shot(kind = 'rifle', delay = 0) {
      if (!ok()) return; const t = ac.currentTime + delay;
      if (kind === 'rifle') { noise(t, .35, { vol: .9, lp: 2600 }); tone(t, 140, 40, .25, { vol: .5 }); noise(t + .02, .5, { vol: .12, lp: 600 }); }
      else if (kind === 'smg') { noise(t, .09, { vol: .55, lp: 3200, hp: 200 }); tone(t, 180, 60, .07, { vol: .25 }); }
      else { noise(t, .16, { vol: .6, hp: 400, lp: 4500 }); tone(t, 260, 90, .1, { vol: .25 }); }
    },
    /* 拉枪栓：两下金属咔嗒 */
    reload() { if (!ok()) return; const t = ac.currentTime; noise(t, .05, { vol: .4, bp: 2400, q: 6 }); noise(t + .16, .06, { vol: .45, bp: 1800, q: 6 }); noise(t + .34, .05, { vol: .5, bp: 3000, q: 8 }); },
    empty() { if (!ok()) return; noise(ac.currentTime, .04, { vol: .35, bp: 3500, q: 10 }); },
    stab() { if (!ok()) return; const t = ac.currentTime; noise(t, .18, { vol: .35, bp: 1500, q: 1.5 }); tone(t + .12, 300, 120, .12, { type: 'triangle', vol: .3 }); },
    hit(big) { if (!ok()) return; const t = ac.currentTime; tone(t, big ? 120 : 180, 50, big ? .22 : .12, { vol: big ? .55 : .35 }); noise(t, .08, { vol: .25, lp: 1400 }); },
    hurt() { if (!ok()) return; const t = ac.currentTime; tone(t, 160, 70, .2, { type: 'square', vol: .12 }); noise(t, .15, { vol: .3, lp: 900 }); },
    block() { if (!ok()) return; const t = ac.currentTime; noise(t, .1, { vol: .25, bp: 900, q: 3 }); tone(t, 520, 380, .1, { type: 'triangle', vol: .12 }); },
    kill() { if (!ok()) return; const t = ac.currentTime; tone(t, 90, 35, .4, { vol: .5 }); noise(t, .3, { vol: .25, lp: 700 }); },
    card() { if (!ok()) return; noise(ac.currentTime, .07, { vol: .12, hp: 2500 }); },
    enemyShot() { A.shot('rifle'); },
    win() { if (!ok()) return; const t = ac.currentTime; [0, 4, 7, 12].forEach((m, i) => tone(t + i * .12, 330 * Math.pow(2, m / 12), 330 * Math.pow(2, m / 12), .35, { type: 'triangle', vol: .18 })); },
    lose() { if (!ok()) return; const t = ac.currentTime; [0, -3, -7].forEach((m, i) => tone(t + i * .25, 220 * Math.pow(2, m / 12), 200 * Math.pow(2, m / 12), .5, { type: 'triangle', vol: .18 })); },
  };
  return A;
}
