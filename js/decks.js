/* Deck skins. Each skin: faceplate markup in a fixed design space (scaled as one unit, so nothing is ever
   stretched), the VFD canvases it owns, and a draw(st) that renders those canvases every frame. */
(function () {
  const PRESETS = [['LIVE', 'live'], ['SCHED', 'schedule'], ['REQ', 'requests'], ['RECENT', 'recent'], ['MAP', 'map'], ['SOCIAL', 'socials']];
  const btn = (act, x, y, w, h, cls, inner, label) =>
    `<button class="k ${cls}" data-act="${act}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px" aria-label="${label || act}">${inner || ''}</button>`;
  const cv = (id, x, y, w, h) => `<div class="win" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px"><canvas data-vfd="${id}" data-w="${w}" data-h="${h}"></canvas><i class="glass"></i></div>`;
  const brand = (x, y, model, cls = '') => `<div class="brand ${cls}" style="left:${x}px;top:${y}px"><img src="assets/logo-96.webp" alt="" width="34" height="34"><span><b>E.T.TATTOO</b><small>${model}</small></span></div>`;
  const ICON = {play: '<svg viewBox="0 0 24 24"><path d="M7 5l12 7-12 7z"/></svg>', pause: '<svg viewBox="0 0 24 24"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>'};
  const cyc = st => (st.title || '').toUpperCase();
  const scroll = (txt, n, t, speed = 4.2) => {   // marquee for segment displays
    if (txt.length <= n) return txt.padEnd(n, ' ');
    const s = txt + '     ', o = Math.floor(t * speed) % s.length; return (s + s).slice(o, o + n);
  };
  const hhmm = () => new Date().toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Chicago'}).replace(/\s?[AP]M/, '').padStart(5, ' ');
  const resample = (spec, n) => { const o = new Float32Array(n); for (let i = 0; i < n; i++) { const a = Math.floor(i * spec.length / n), b = Math.floor((i + 1) * spec.length / n); let m = 0; for (let k = a; k < Math.max(b, a + 1); k++) m = Math.max(m, spec[k] || 0); o[i] = m; } return o; };
  // boot: all segments lit, then a sweep reveals the display
  const bootMask = (v, st, w, h) => { if (st.boot >= 1) return; const x = v.x; x.save(); x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'destination-in'; x.fillStyle = '#fff';
    const p = Math.max(0, (st.boot - 0.35) / 0.65); x.fillRect(0, 0, st.boot < 0.35 ? w : w * p, h); x.restore(); };

  /* ---------------------------------------------------------------- 1. NIGHT RIDER — black 1-DIN, multicolour VFD */
  const nightrider = {
    id: 'nightrider', name: 'Night Rider', model: 'ET-7000', w: 1000, h: 290, cls: 'skin-night',
    html() {
      return `<div class="plate night">
        <i class="lip top"></i><i class="led red" style="left:214px;top:22px"></i>
        <div class="silk" style="left:232px;top:21px">MULTI-COLOUR VFD RECEIVER · 4×50W · ET-7000</div>
        ${brand(700, 7, 'LOWRIDE LIFE RADIO', 'sm')}
        ${btn('play', 30, 74, 150, 92, 'rubber blue big', `<span class="ico">${ICON.play}${ICON.pause}</span><em>SOURCE</em>`, 'Play / pause')}
        ${btn('disp', 120, 22, 70, 36, 'rubber green', '<em>DISP</em>', 'Display mode')}
        ${btn('mute', 30, 182, 72, 34, 'key dark', '<em>MUTE</em>', 'Mute')}
        ${btn('mode', 108, 182, 72, 34, 'key dark', '<em>MODE</em>', 'Next deck')}
        ${cv('main', 232, 46, 622, 166)}
        ${PRESETS.map((p, i) => btn('preset' + (i + 1), 236 + i * 104, 226, 96, 44, 'key fkey', `<em>F${i + 1}</em><small>${p[0]}</small>`, 'Preset ' + (i + 1) + ': ' + p[0])).join('')}
        ${btn('volup', 878, 62, 96, 74, 'rubber green tall', '<em>VOL ▲</em>', 'Volume up')}
        ${btn('voldn', 878, 146, 96, 74, 'rubber green tall', '<em>VOL ▼</em>', 'Volume down')}
        <div class="silk tiny" style="left:886px;top:236px">ET DIGITAL</div>
      </div>`;
    },
    draw(V, st) {
      const v = V.main, W = 622, H = 166, t = st.t; v.begin('#020406');
      const blue = '#2f9bff', cyan = '#53f0ff', green = (st.vfd && st.vfd.nightrider) || '#6dff8a', amber = '#ffb84a', pink = '#ff4fa0';
      // left: arc level meter (L/R) like a sweep tachometer
      v.arc(st.levelL, 92, 118, 62, 76, Math.PI * 1.02, Math.PI * 1.75, {n: 18, color: f => f > 0.82 ? pink : (f > 0.6 ? cyan : blue)});
      v.arc(st.levelR, 92, 118, 46, 58, Math.PI * 1.02, Math.PI * 1.75, {n: 16, color: f => f > 0.82 ? pink : (f > 0.6 ? cyan : blue)});
      v.label('L', 18, 112, 12, cyan); v.label('R', 34, 112, 12, cyan);
      v.label('ST', 14, 20, 14, green, 'left', st.playing ? 1 : 0.12); v.label(st.live ? 'LIVE' : 'AUTO', 42, 20, 14, st.live ? pink : amber);
      v.label('LOUD', 14, 150, 12, '#ff5a5a', 'left', st.loud ? 1 : 0.12); v.label('DEMO', 54, 150, 12, amber, 'left', st.playing ? 0.12 : 1);
      const mode = st.mode % 3;
      if (mode === 0) {           // big green 14-seg marquee
        v.seg(scroll(cyc(st), 12, t), 168, 40, 50, green, {ghost: 0.08});
      } else if (mode === 1) {    // spectrum
        const sp = resample(st.spec, 20); v.bars(sp, resample(st.peaks, 20), 170, 30, 300, 74, {segs: 12, gap: 3, color: f => f > 0.8 ? pink : (f > 0.55 ? cyan : blue)});
        v.seg(scroll(cyc(st), 5, t), 488, 40, 32, green);
      } else {                    // clock + level
        v.seg(hhmm(), 196, 34, 58, green); v.label(st.live ? 'ON AIR' : 'NOW PLAYING', 420, 64, 16, amber);
      }
      // preset boxes inside the glass (lit = current section)
      PRESETS.forEach((p, i) => { const bx = 168 + i * 72; v.box(bx, 112, 64, 22, green, i === st.section ? 1 : 0.35); v.label(`F${i + 1} ${p[0]}`, bx + 32, 123, 12, green, 'center', i === st.section ? 1 : 0.45); });
      // right: small amber volume + listener counter
      v.label('VOL', 548, 150, 11, amber, 'left', 0.9); v.seg(st.muted ? 'MU' : String(Math.round(st.vol * 40)).padStart(2, '0'), 576, 140, 18, amber, {lw: 2.2});
      v.label('LISTENERS', 168, 152, 11, cyan, 'left', 0.9); v.seg(String(st.listeners).padStart(5, ' '), 236, 140, 18, cyan, {lw: 2.2});
      v.label('LOWRIDE LIFE RADIO', 470, 18, 12, cyan, 'left', 0.85);
      bootMask(v, st, W * v.s, H * v.s); v.end(0.95);
    }
  };

  /* ---------------------------------------------------------------- 2. MULTI-CD — gunmetal 2-DIN, spectrum + dot-matrix */
  const BANDS = ['25', '40', '63', '100', '160', '250', '400', '630', '1K', '1.6K', '2.5K', '6.3K', '16K'];
  const multicd = {
    id: 'multicd', name: 'Multi-CD', model: 'ET-9000', w: 1000, h: 520, cls: 'skin-gun',
    html() {
      return `<div class="plate gun">
        <i class="lip top"></i>
        <div class="slot" style="left:150px;top:26px;width:700px"></div>
        <div class="silk" style="left:470px;top:50px">MULTI-DISC CONTROL · ET-9000</div>
        ${PRESETS.map((p, i) => btn('preset' + (i + 1), 262 + i * 100, 74, 88, 40, 'key gunkey', `<em class="num">${i + 1}</em><small>${p[0]}</small>`, 'Preset ' + (i + 1) + ': ' + p[0])).join('')}
        <div class="silk" style="left:40px;top:118px">VOLUME</div>
        <div class="pad" style="left:36px;top:140px">
          ${btn('volup', 62, 0, 76, 58, 'padk up', '<em>FRONT ▲</em>', 'Volume up')}
          ${btn('voldn', 62, 142, 76, 58, 'padk dn', '<em>REAR ▼</em>', 'Volume down')}
          ${btn('dispprev', 0, 62, 58, 76, 'padk lt', '<em>◀</em>', 'Previous display mode')}
          ${btn('disp', 142, 62, 58, 76, 'padk rt', '<em>▶</em>', 'Next display mode')}
          ${btn('mute', 64, 64, 72, 72, 'padk ctr', '<em>MUTE</em>', 'Mute')}
        </div>
        ${btn('play', 52, 372, 82, 82, 'round green', `<span class="ico">${ICON.play}${ICON.pause}</span>`, 'Play / pause')}
        <div class="silk" style="left:146px;top:404px">SOURCE / PWR</div>
        ${cv('main', 252, 128, 612, 250)}
        ${btn('mode', 888, 140, 76, 40, 'key gunkey sm', '<em>DECK</em>', 'Next deck')}
        ${btn('preset5', 888, 192, 76, 40, 'key gunkey sm', '<em>MAP</em>', 'Listener map')}
        ${btn('preset3', 888, 244, 76, 40, 'key gunkey sm', '<em>REQ</em>', 'Request a song')}
        ${btn('disp', 888, 296, 76, 40, 'key gunkey sm', '<em>DISP</em>', 'Display mode')}
        ${[['DISP', 'disp'], ['SCAN', 'preset2'], ['LIST', 'preset4'], ['A−', 'voldn'], ['A+', 'volup'], ['MUTE', 'mute']].map((b, i) =>
          btn(b[1], 262 + i * 100, 400, 88, 34, 'key gunkey soft', `<em>${b[0]}</em>`, b[0])).join('')}
        ${brand(712, 452, 'LOWRIDE LIFE RADIO')}
        <div class="silk tiny" style="left:262px;top:470px">13-BAND SPECTRUM · GRAPHIC DOT MATRIX</div>
      </div>`;
    },
    draw(V, st) {
      const v = V.main, W = 612, H = 250, t = st.t; v.begin('#03050a');
      const white = (st.vfd && st.vfd.multicd) || '#eaf6ff', blue = '#3aa0ff', ice = '#9fe6ff', amber = '#ffc35c';
      // top segment line: CH / time / text
      v.seg(st.live ? 'LV' : 'CH', 14, 14, 30, white, {lw: 2.1}); v.seg(String(st.section + 1).padStart(2, '0'), 54, 14, 30, white, {lw: 2.1});
      v.seg(hhmm(), 112, 14, 30, white, {lw: 2.1});
      v.seg(scroll(cyc(st), 14, t), 214, 14, 30, white, {lw: 2.1});
      v.box(14, 54, 584, 1, ice, 0.25, true);
      const mode = st.mode % 3;
      // 13-band white spectrum with labels
      const sp = resample(st.spec, 13), pk = resample(st.peaks, 13);
      v.bars(sp, pk, 16, 66, 330, 140, {segs: 18, gap: 6, color: () => white});
      BANDS.forEach((b, i) => v.label(b, 16 + i * ((330 - 72) / 13 + 6) + (330 - 72) / 26, 218, 10, ice, 'center', 0.85));
      v.label('Hz', 340, 218, 10, ice, 'left', 0.7);
      v.label(st.live ? 'ON AIR' : 'AUTO DJ', 16, 238, 11, amber); v.label(['SPECTRUM', 'LOGO', 'MARQUEE'][mode], 110, 238, 11, ice, 'left', 0.8);
      v.label(`VOL ${st.muted ? '--' : Math.round(st.vol * 40)}`, 230, 238, 11, ice, 'left', 0.8); v.label(`${st.listeners} LISTENING`, 330, 238, 11, amber, 'right');
      // blue dot-matrix window: logo / waterfall / marquee
      const cols = 48, rows = 26, gx = 372, gy = 66, gw = 226, gh = 160;
      v.box(gx - 6, gy - 6, gw + 12, gh + 12, blue, 0.35);
      let grid;
      if (mode === 1 && st.logoGrid) {
        grid = st.logoGrid.map((x, i) => x * (0.75 + 0.25 * Math.sin(t * 3 + (i % cols) * 0.3)));
      } else if (mode === 2) {
        const txt = (st.title || 'LOWRIDE LIFE RADIO') + '   ·   ';
        st._tw = st._tw || {}; const tw = st._tw[txt] || (st._tw[txt] = VFD.textGrid(txt, 4, rows - 6, 0).width);
        const off = Math.floor(t * 16) % Math.max(1, Math.ceil(tw));
        const g2 = VFD.textGrid(txt + txt, cols, rows - 6, off).grid; grid = new Float32Array(cols * rows);
        for (let j = 0; j < rows - 6; j++) for (let i = 0; i < cols; i++) grid[(j + 3) * cols + i] = g2[j * cols + i];
      } else {   // waterfall of the spectrum
        st.water = st.water || new Float32Array(cols * rows); const w = st.water;
        w.copyWithin(cols, 0, cols * (rows - 1)); const row = resample(st.spec, cols); for (let i = 0; i < cols; i++) { const v = (row[i] - 0.3) / 0.6; w[i] = v > 0 ? Math.min(1, 0.35 + v) : 0; }
        grid = w;
      }
      v.dots(grid, cols, rows, gx, gy, gw, gh, blue, 0.07);
      bootMask(v, st, W * v.s, H * v.s); v.end(0.9);
    }
  };

  /* ---------------------------------------------------------------- 3. STACK — silver 7-band EQ over an amber CD head unit */
  const EQF = ['63', '160', '400', '1K', '2.5K', '6.3K', '16K'];
  const EQP = {FLAT: [0, 0, 0, 0, 0, 0, 0], LOWRIDE: [6, 4, 0, -1, 1, 3, 4], 'HIP HOP': [7, 5, 1, -2, 0, 2, 3], VOCAL: [-2, -1, 2, 4, 3, 1, -1], SOUL: [3, 2, 1, 1, 2, 2, 1], LATE: [4, 2, -1, -2, -1, 1, 2]};
  const stack = {
    id: 'stack', name: 'Stack', model: 'ET-5500 / ET-707EQ', w: 1000, h: 556, cls: 'skin-silver', EQP,
    html() {
      return `<div class="plate silver eq" style="height:250px">
          <i class="lip top"></i><div class="silk dark" style="left:150px;top:10px">7-BAND GRAPHIC EQUALIZER · ET-707EQ</div>
          ${btn('mute', 28, 30, 74, 36, 'key silv', '<em>MUTE</em>', 'Mute')}
          <div class="silk dark small" style="left:30px;top:84px">EQ CURVE</div>
          ${Object.keys(EQP).map((k, i) => btn('eq:' + k, 28 + (i % 2) * 58, 104 + Math.floor(i / 2) * 30, 54, 24, 'key silv tab', `<em>${k === 'HIP HOP' ? 'HIPHOP' : k}</em>`, 'EQ ' + k)).join('')}
          ${cv('eq', 146, 30, 820, 162)}
          ${btn('disp', 400, 206, 80, 30, 'key silv', '<em>DISP</em>', 'Display mode')}
          ${btn('voldn', 490, 206, 70, 30, 'key silv', '<em>A −</em>', 'Volume down')}
          ${btn('volup', 566, 206, 70, 30, 'key silv', '<em>A +</em>', 'Volume up')}
          ${brand(770, 202, 'ET-707EQ', 'dark')}
        </div>
        <div class="plate silver cd" style="top:268px;height:288px">
          <i class="lip top"></i>
          ${btn('play', 24, 30, 86, 40, 'key silv red', `<span class="ico">${ICON.play}${ICON.pause}</span><em>PWR</em>`, 'Play / pause')}
          <i class="led red" style="left:120px;top:44px"></i>
          <div class="slot" style="left:150px;top:30px;width:700px"></div>
          ${btn('mode', 870, 26, 100, 46, 'key teal', '<em>DECK</em>', 'Next deck')}
          ${btn('volup', 24, 92, 86, 70, 'rocker up', '<em>▲</em>', 'Volume up')}
          ${btn('voldn', 24, 166, 86, 70, 'rocker dn', '<em>▼</em>', 'Volume down')}
          <div class="silk dark small" style="left:124px;top:96px">DISC TITLE MEMORY</div>
          ${PRESETS.map((p, i) => btn('preset' + (i + 1), 286 + (i % 3) * 72, 100 + Math.floor(i / 3) * 74, 64, 56, 'key dark3', `<em class="num">${i + 1}</em><small>${p[0]}</small>`, 'Preset ' + (i + 1) + ': ' + p[0])).join('')}
          ${cv('cd', 512, 96, 456, 132)}
          ${brand(780, 236, 'CD HEAD UNIT · ET-5500', 'dark')}
          ${btn('disp', 124, 120, 140, 44, 'key teal', '<em>DISP / MODE</em>', 'Display mode')}
          ${btn('preset3', 124, 176, 140, 44, 'key teal', '<em>REQUEST</em>', 'Request a song')}
        </div>`;
    },
    draw(V, st) {
      const t = st.t;
      // EQ window: preset tabs, pattern readout, 7 tall bars (cyan over yellow) = EQ gain + live band level
      const e = V.eq; e.begin('#030406');
      const cyan = '#43d8ff', yellow = '#ffe14a', red = '#ff5a5a', amber = (st.vfd && st.vfd.stack) || '#ffb347', green = '#7dff9a';
      Object.keys(EQP).forEach((k, i) => { const on = k === st.eqPreset; e.box(232 + i * 96, 10, 88, 20, on ? amber : '#ff6b9a', on ? 1 : 0.45, false); e.label(k, 276 + i * 96, 20, 12, on ? amber : '#ff8fb5', 'center', on ? 1 : 0.6); });
      e.seg('P' + String(Object.keys(EQP).indexOf(st.eqPreset) + 1).padStart(2, '0'), 12, 16, 40, yellow, {lw: 2.4, adv: 13});
      e.label('dB', 118, 22, 11, yellow, 'left', 0.8); e.label('Hz', 118, 52, 11, yellow, 'left', 0.8);
      e.label(st.live ? 'LIVE ON AIR' : 'AUTO DJ', 12, 90, 13, green); e.label('VOL', 12, 118, 12, cyan, 'left', 0.8);
      e.seg(st.muted ? '--' : String(Math.round(st.vol * 40)).padStart(2, '0'), 46, 106, 22, cyan, {lw: 2.4});
      const sp = resample(st.spec, 7), pk = resample(st.peaks, 7), g = EQP[st.eqPreset] || EQP.FLAT;
      const vals = sp.map((x, i) => Math.min(1, 0.18 + (g[i] + 8) / 26 * 0.35 + x * 0.55));
      e.bars(vals, pk.map((x, i) => Math.min(1, vals[i] + 0.06)), 232, 38, 568, 96, {segs: 14, gap: 26, color: f => f > 0.5 ? cyan : yellow});
      if (st.mode % 3 === 1) {   // animated EQ curve over the bars
        const x = e.x; x.strokeStyle = red; x.lineWidth = 2.2; x.beginPath();
        for (let i = 0; i <= 60; i++) { const f = i / 60, k = f * 6, a = Math.floor(k), b = Math.min(6, a + 1), m = k - a, gg = g[a] * (1 - m) + g[b] * m;
          const y = 86 - gg * 4 - 3 * Math.sin(t * 2 + f * 9) * (st.playing ? 1 : 0.4); i ? x.lineTo(240 + f * 552, y) : x.moveTo(240 + f * 552, y); } x.stroke();
      }
      EQF.forEach((f, i) => e.label(f, 232 + i * ((568 - 26 * 6) / 7 + 26) + (568 - 156) / 14, 146, 11, cyan, 'center', 0.85));
      bootMask(e, st, 820 * e.s, 162 * e.s); e.end(0.85);
      // CD amber VFD: indicator column, big amber segments, level strip
      const c = V.cd; c.begin('#060302');
      ['LIVE', 'AUTO', 'MUTE'].forEach((k, i) => { const on = (k === 'LIVE' && st.live) || (k === 'AUTO' && !st.live) || (k === 'MUTE' && st.muted);
        c.label('▸' + k, 10, 30 + i * 30, 15, '#ff7a3a', 'left', on ? 1 : 0.18); });
      const mode = st.mode % 3;
      if (mode === 2) c.seg(hhmm(), 112, 40, 52, amber, {lw: 2.2});
      else c.seg(scroll(cyc(st), 10, t), 100, 44, 44, amber, {lw: 2.1});
      const lv = Math.max(st.levelL, st.levelR); for (let i = 0; i < 24; i++) c.box(112 + i * 13, 14, 10, 8, amber, i / 24 < lv ? 1 : 0.1, true);
      c.label(`${st.listeners} LISTENING`, 444, 116, 12, '#ff7a3a', 'right', 0.9);
      bootMask(c, st, 456 * c.s, 132 * c.s); c.end(0.9);
    }
  };

  /* ---------------------------------------------------------------- 4. TOUCH — modern gloss-black double-DIN touchscreen */
  const I = {   // simple line icons (original drawings)
    gear: '<svg viewBox="0 0 24 24"><path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zm8.4 4.6-.1-2.2 2-1.6-2-3.4-2.4.9a8 8 0 0 0-1.9-1.1L15.6 3h-4l-.4 2.7a8 8 0 0 0-1.9 1.1l-2.4-.9-2 3.4 2 1.6-.1 2.2-1.9 1.6 2 3.4 2.4-.9c.6.5 1.2.8 1.9 1.1l.4 2.7h4l.4-2.7c.7-.3 1.3-.6 1.9-1.1l2.4.9 2-3.4z" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
    list: '<svg viewBox="0 0 24 24"><path d="M4 6h2M9 6h11M4 12h2M9 12h11M4 18h2M9 18h11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    person: '<svg viewBox="0 0 24 24"><circle cx="12" cy="6.5" r="3.5" fill="currentColor"/><path d="M5 22v-5a7 7 0 0 1 14 0v5z" fill="currentColor"/></svg>',
    disc: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="currentColor"/><circle cx="12" cy="12" r="3" fill="#0b2a6b"/></svg>',
    prev: '<svg viewBox="0 0 24 24"><path d="M6 5h2v14H6zM20 5v14L9 12z" fill="currentColor"/></svg>',
    next: '<svg viewBox="0 0 24 24"><path d="M16 5h2v14h-2zM4 5v14l11-7z" fill="currentColor"/></svg>',
    repeat: '<svg viewBox="0 0 24 24"><path d="M5 9a4 4 0 0 1 4-4h9l-2.5-2.5M19 15a4 4 0 0 1-4 4H6l2.5 2.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    shuffle: '<svg viewBox="0 0 24 24"><path d="M3 7h4l10 10h4M3 17h4l3-3M14 10l3-3h4M18 4l3 3-3 3M18 14l3 3-3 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    mic: '<svg viewBox="0 0 24 24"><rect x="9" y="2" width="6" height="12" rx="3" fill="currentColor"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4M8 22h8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    home: '<svg viewBox="0 0 24 24"><path d="M3 11 12 3l9 8v10h-6v-6H9v6H3z" fill="currentColor"/></svg>'
  };
  const capCol = (x, y, items) => items.map((b, i) => btn(b[0], x, y + b[3], 64, b[2], 'cap' + (b[4] ? ' ' + b[4] : ''), b[1], b[5] || b[0])).join('');
  const touch = {
    id: 'touch', name: 'Touch', model: 'ET-X1 TOUCH', w: 1000, h: 540, cls: 'skin-touch',
    html() {
      return `<div class="plate gloss">
        <i class="lip top"></i><div class="slot thin" style="left:150px;top:16px;width:640px"></div>
        <div class="silk tiny" style="left:830px;top:14px">ET-X1 TOUCH</div>
        ${capCol(22, 52, [['volup', '<em>+</em>', 52, 0, '', 'Volume up'], ['voldn', '<em>−</em>', 52, 62, '', 'Volume down'],
          ['mute', '<em>✕</em><small>MUTE</small>', 52, 124, '', 'Mute'], ['play', `<span class="ico">${ICON.play}${ICON.pause}</span>`, 80, 186, 'home', 'Play / pause'],
          ['disp', '<em>▭</em><small>DISP</small>', 52, 276, '', 'Display'], ['mode', `<span class="i">${I.next}</span>`, 52, 338, '', 'Next deck'], ['dispprev', `<span class="i">${I.prev}</span>`, 52, 400, '', 'Previous display']])}
        <div class="tscreen" style="left:104px;top:40px;width:850px;height:440px">
          <div class="poly"></div>
          <div class="ts-src" data-ts="src">LOWRIDE</div>
          <div class="ts-clock"><small data-ts="date">1/1</small><b data-ts="clock">12:00</b></div>
          <button class="ts-ico k" data-act="mode" style="right:22px;top:20px" aria-label="Switch deck">${I.gear}</button>
          <button class="ts-ico k ts-eq" data-act="disp" style="right:16px;top:92px" aria-label="Visualizer"><em>EQ</em></button>
          <button class="ts-ico k" data-act="preset4" style="right:22px;top:156px" aria-label="Recently played / set list">${I.list}</button>
          <div class="ts-meta"><b data-ts="title">Lowride Life Radio</b>
            <span>${I.person}<i data-ts="artist">Underground hip hop</i></span><span>${I.disc}<i data-ts="album">Live 24/7</i></span></div>
          <div class="ts-art" data-ts="art"><span>ART<br>PLACEHOLDER</span><small data-ts="lis"></small></div>
          <div class="ts-prog"><small data-ts="elapsed">00'00"</small><i><b data-ts="bar"></b></i></div>
          <div class="ts-bar">
            ${[['play', `<span class="ico">${ICON.play}${ICON.pause}</span>`, 'Play / pause'], ['dispprev', I.prev, 'Previous screen'], ['disp', I.next, 'Next screen'],
               ['reconnect', I.repeat, 'Reconnect stream'], ['preset5', I.shuffle, 'Listener map'], ['preset3', I.mic, 'Request a song']]
              .map((b, i) => `<button class="k tb${i === 5 ? ' last' : ''}" data-act="${b[0]}" aria-label="${b[2]}">${b[1]}</button>`).join('')}
          </div>
          <div class="ts-vis" data-ts="vis"><canvas data-vfd="vis" data-w="850" data-h="440"></canvas></div>
          <i class="glass big"></i>
        </div>
        ${brand(410, 494, 'LOWRIDE LIFE RADIO', 'sm')}
        <div class="silk tiny" style="left:880px;top:500px">ET DIGITAL</div>
      </div>`;
    },
    draw(V, st, root) {
      const q = k => root.querySelector(`[data-ts="${k}"]`), set = (k, v) => { const e = q(k); if (e && e.textContent !== v) e.textContent = v; };
      const n = st.np || {}; set('src', st.live ? 'LIVE' : 'LOWRIDE'); set('title', n.title || 'Lowride Life Radio'); set('artist', n.artist || 'Underground hip hop');
      set('album', st.show || 'Live 24/7'); set('clock', hhmm().trim());
      const d = new Date(); set('date', `${d.getMonth() + 1}/${d.getDate()}`); set('lis', `${st.listeners.toLocaleString('en-US')} listening`);
      const el = n.duration ? Math.min(n.duration, (n.elapsed || 0) + (Date.now() / 1000 - (st.npAt || Date.now() / 1000))) : 0;
      set('elapsed', `${String(Math.floor(el / 60)).padStart(2, '0')}'${String(Math.floor(el % 60)).padStart(2, '0')}"`);
      const bar = q('bar'); if (bar) bar.style.width = (n.duration ? Math.min(100, el / n.duration * 100) : 0).toFixed(2) + '%';
      const vis = q('vis'); const on = st.mode % 2 === 1; if (vis) vis.classList.toggle('on', on);
      if (on && V.vis) { const v = V.vis, col = (st.vfd && st.vfd.touch) || '#2f8bff'; v.begin('#020610', 0.55);
        const sp = resample(st.spec, 32); v.bars(sp, resample(st.peaks, 32), 40, 60, 770, 300, {segs: 20, gap: 6, color: f => f > 0.8 ? '#ff4fa0' : (f > 0.55 ? '#53f0ff' : col)});
        v.label('EQ · SPECTRUM', 40, 34, 18, '#cfe3ff', 'left', 0.9); v.label('TAP EQ TO CLOSE', 810, 34, 14, '#cfe3ff', 'right', 0.6);
        v.arc(st.levelL, 425, 420, 360, 380, Math.PI * 1.15, Math.PI * 1.85, {n: 40, color: f => f > 0.85 ? '#ff4fa0' : col}); v.end(0.6); }
    }
  };

  window.ETB_DECKS = [nightrider, multicd, stack, touch];
  window.ETB_PRESETS = PRESETS;
})();
