/* Lowride Life Radio — car-deck player, deck switcher, now playing, sections. No framework. */
(function () {
  const C = window.ETB_SITE, DECKS = window.ETB_DECKS, $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const Q = new URLSearchParams(location.search), DEMO = Q.has('demo');
  // PRE-LAUNCH: the site can go live before the stream server exists (config.js prelaunch:true or no api).
  // No fake numbers: the player says the stream is launching soon and nothing tries to connect.
  const PRE = !DEMO && (!!window.ETB_SITE.prelaunch || !window.ETB_SITE.api);
  if (PRE) document.documentElement.classList.add('prelaunch');
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  const st = {np: {}, npAt: 0, show: '', vfd: null, t: 0, spec: new Float32Array(64), peaks: new Float32Array(64), levelL: 0, levelR: 0, playing: false, live: false, loud: false,
    title: 'LOWRIDE LIFE RADIO · LIVE 24/7', listeners: 0, mode: 0, vol: 0.8, muted: false, section: 0, boot: 1, eqPreset: localStorage.getItem('etb.eq') || 'FLAT'};
  if (DEMO) document.documentElement.classList.add('demo');

  /* ---------------- audio: <audio> → 7-band EQ → gain → analyser ---------------- */
  const au = new Audio(); au.crossOrigin = 'anonymous'; au.preload = 'none'; window.ETB_AUDIO = au;   // the one persistent element (exposed for tests / debugging)
  let ac = null, an = null, gain = null, eq = [], freq = null, wave = null;
  function graph() {
    if (ac) return; ac = new (window.AudioContext || window.webkitAudioContext)();
    const src = ac.createMediaElementSource(au);
    eq = [63, 160, 400, 1000, 2500, 6300, 16000].map(f => { const b = ac.createBiquadFilter(); b.type = 'peaking'; b.frequency.value = f; b.Q.value = 1.1; return b; });
    gain = ac.createGain(); an = ac.createAnalyser(); an.fftSize = 2048; an.smoothingTimeConstant = 0.72;
    src.connect(eq[0]); for (let i = 0; i < 6; i++) eq[i].connect(eq[i + 1]); eq[6].connect(gain); gain.connect(an); an.connect(ac.destination);
    freq = new Uint8Array(an.frequencyBinCount); wave = new Uint8Array(an.fftSize); applyEQ(); applyVol();
  }
  function applyEQ() { const g = DECKS[2].EQP[st.eqPreset] || DECKS[2].EQP.FLAT; eq.forEach((b, i) => b.gain.value = g[i]); }
  function applyVol() { if (gain) gain.gain.value = st.muted ? 0 : st.vol * st.vol; else au.volume = st.muted ? 0 : st.vol; }
  /* Robust live player: ONE persistent <audio> element (deck skins are visual only), auto-reconnect with backoff,
     stall watchdog (no progress for 3 s → reconnect), MP3 primary → AAC → HLS (where native) fallback. */
  const SOURCES = [(C.streams || {}).mp3, (C.streams || {}).aac].concat(au.canPlayType('application/vnd.apple.mpegurl') && C.streams && C.streams.hls ? [C.streams.hls] : []);
  const P = {want: false, src: 0, tries: 0, lastT: 0, lastProg: 0, timer: 0, reconnects: 0};
  au.preload = 'none';
  function startSrc() { au.src = SOURCES[P.src] + (SOURCES[P.src].includes('?') ? '&' : '?') + 't=' + Date.now(); P.lastProg = performance.now(); return au.play(); }
  async function play() {
    if (PRE) { toast('The 24/7 stream launches soon — check back!'); setStatus('Stream launching soon'); return; }
    P.want = true; graph(); if (ac.state === 'suspended') await ac.resume().catch(() => {});
    try { await startSrc(); } catch (e) { scheduleReconnect('start failed'); }
    sync();
  }
  function stop() { P.want = false; clearTimeout(P.timer); au.pause(); au.removeAttribute('src'); au.load(); st.playing = false; setStatus(''); sync(); }
  function scheduleReconnect(why) {
    if (!P.want) return; clearTimeout(P.timer); P.tries++; P.reconnects++;
    if (P.tries % 3 === 0) P.src = (P.src + 1) % SOURCES.length;          // after 3 failures try the next format
    const wait = Math.min(4000, 500 * Math.pow(2, Math.min(3, P.tries - 1))) * (0.8 + Math.random() * 0.4);   // 0.5 → 1 → 2 → 4 s cap (+/-20% jitter): back within ~4 s of the network returning
    setStatus(`Reconnecting… (${why})`); P.timer = setTimeout(() => { if (P.want) startSrc().catch(() => scheduleReconnect('retry failed')); }, wait);
  }
  function reconnectNow() { P.tries = 0; P.src = 0; P.want = true; clearTimeout(P.timer); graph(); setStatus('Reconnecting…'); startSrc().catch(() => scheduleReconnect('retry failed')); sync(); }
  au.addEventListener('playing', () => { st.playing = true; P.tries = 0; setStatus(''); sync(); });
  au.addEventListener('timeupdate', () => { if (au.currentTime !== P.lastT) { P.lastT = au.currentTime; P.lastProg = performance.now(); } });
  ['error', 'ended', 'stalled'].forEach(ev => au.addEventListener(ev, () => { if (P.want && (ev !== 'stalled' || au.paused || au.readyState < 3)) scheduleReconnect(ev); }));
  au.addEventListener('pause', () => { if (P.want && !au.ended && document.visibilityState === 'visible' && navigator.mediaSession && au.error) scheduleReconnect('paused'); });
  setInterval(() => {   // stall watchdog
    if (P.want && st.playing && !au.paused && performance.now() - P.lastProg > 3000) { st.playing = false; scheduleReconnect('stalled'); }
  }, 1000);
  addEventListener('online', () => { if (P.want && (!st.playing || performance.now() - P.lastProg > 1500)) reconnectNow(); });   // only if audio actually stopped
  function setStatus(t) { const e = $('#npStatus'); if (e) { e.textContent = t; e.hidden = !t; } }
  if ('mediaSession' in navigator) {   // lock screen / car head unit / headset buttons
    navigator.mediaSession.setActionHandler('play', () => play());
    navigator.mediaSession.setActionHandler('pause', () => stop());
    navigator.mediaSession.setActionHandler('stop', () => stop());
  }
  function sync() { document.documentElement.classList.toggle('playing', st.playing); $$('[data-act=play]').forEach(b => b.setAttribute('aria-pressed', st.playing)); }

  // log-spaced 64-band spectrum from the analyser (or the deck's own DEMO pattern when idle, like a real head unit)
  const bins = Array.from({length: 65}, (_, i) => Math.round(2 * Math.pow(900 / 2, i / 64)));
  function analyse(dt) {
    const s = st.spec;
    if (st.playing && an) {
      an.getByteFrequencyData(freq); an.getByteTimeDomainData(wave);
      for (let i = 0; i < 64; i++) { let m = 0; for (let k = bins[i]; k <= Math.max(bins[i], bins[i + 1] - 1); k++) m = Math.max(m, freq[k]); s[i] = Math.pow(m / 255, 1.35); }
      let l = 0; for (let i = 0; i < wave.length; i++) { const v = (wave[i] - 128) / 128; l += v * v; } l = Math.sqrt(l / wave.length) * 3.2;
      st.levelL += (Math.min(1, l) - st.levelL) * 0.35; st.levelR += (Math.min(1, l * (0.92 + 0.08 * Math.sin(st.t * 5))) - st.levelR) * 0.35;
    } else {
      const t = st.t; for (let i = 0; i < 64; i++) { const f = i / 64;
        s[i] = Math.max(0, 0.55 * Math.exp(-f * 1.6) * (0.6 + 0.4 * Math.sin(t * 7.1 + i * 0.5)) + 0.22 * Math.abs(Math.sin(t * 3.3 + f * 11)) * (1 - f * 0.6) - 0.05); }
      const b = 0.45 + 0.35 * Math.abs(Math.sin(t * 2.2)); st.levelL += (b - st.levelL) * 0.2; st.levelR += (b * 0.9 - st.levelR) * 0.2;
    }
    for (let i = 0; i < 64; i++) st.peaks[i] = Math.max(s[i], st.peaks[i] - dt * 0.55);   // peak hold + fall
    st.loud = st.eqPreset !== 'FLAT';
  }

  /* ---------------- decks: mount, switch (arrows, dots, swipe, keyboard), remember ---------------- */
  let cur = Math.max(0, DECKS.findIndex(d => d.id === (Q.get('deck') || localStorage.getItem('etb.deck'))));
  const stage = $('#deck'), V = {};
  function mount(i, animate = true) {
    cur = (i + DECKS.length) % DECKS.length; const d = DECKS[cur]; localStorage.setItem('etb.deck', d.id);
    stage.className = 'deck ' + d.cls; stage.style.setProperty('--dw', d.w); stage.style.setProperty('--dh', d.h);
    stage.innerHTML = `<div class="face" style="width:${d.w}px;height:${d.h}px">${d.html()}</div>`;
    stage.querySelectorAll('.plate').forEach(pl => { const h = pl.offsetHeight || d.h;   // seams + corner screws on every faceplate
      pl.insertAdjacentHTML('afterbegin', '<i class="seam"></i>'); [[14, 14], [974, 14], [14, h - 26], [974, h - 26]].forEach(([x, y]) => pl.insertAdjacentHTML('beforeend', `<i class="screw" style="left:${x}px;top:${y}px"></i>`)); });
    if (window.ETB_tex) ETB_tex(stage, d.id);
    for (const k in V) delete V[k];
    const layer = document.createElement('div'); layer.className = 'vfd-layer'; stage.querySelector('.face').after(layer);
    stage.querySelectorAll('.win').forEach(win => {   // design rect = win position + its plate offset
      const pl = win.closest('.plate'), r = {x: win.offsetLeft + pl.offsetLeft, y: win.offsetTop + pl.offsetTop, w: win.offsetWidth, h: win.offsetHeight};
      const hold = document.createElement('div'); hold.className = 'vwin'; hold._r = r; const c = win.querySelector('canvas');
      hold.append(c, win.querySelector('.glass')); layer.appendChild(hold); V[c.dataset.vfd] = new VFD(c, +c.dataset.w, +c.dataset.h); });
    stage.querySelectorAll('canvas[data-vfd]').forEach(c => { if (!V[c.dataset.vfd]) V[c.dataset.vfd] = new VFD(c, +c.dataset.w, +c.dataset.h); });
    if (window.ETB_VIDEO) ETB_VIDEO.mount($('#vdeck'), d.id);
    fit(); sync();
    $('#deckName').textContent = `${d.name} · ${d.model}`;
    $$('.dots button').forEach((b, k) => b.setAttribute('aria-current', k === cur));
    st.boot = animate && !RM ? 0 : 1; st.mode = 0;
    document.documentElement.style.setProperty('--deck-ar', d.w / d.h);
  }
  function fit() {
    const d = DECKS[cur], w = Math.floor(stage.clientWidth), k = w / d.w; if (window.ETB_VIDEO) ETB_VIDEO.fit(); stage.style.height = (d.h * k) + 'px';
    stage.querySelector('.face').style.transform = `scale(${k})`;
    stage.querySelectorAll('.vwin').forEach(h => { const r = h._r, x = Math.round(r.x * k), y = Math.round(r.y * k);
      Object.assign(h.style, {left: x + 'px', top: y + 'px', width: Math.round((r.x + r.w) * k) - x + 'px', height: Math.round((r.y + r.h) * k) - y + 'px', borderRadius: Math.max(3, 8 * k) + 'px'}); });
    Object.values(V).forEach(v => v.resize());
  }
  addEventListener('resize', fit);
  $('.dots').innerHTML = DECKS.map((d, i) => `<button aria-label="${d.name} deck"></button>`).join('');
  $$('.dots button').forEach((b, i) => b.onclick = () => mount(i));
  let ENABLED = DECKS.map(d => d.id);
  function nextEnabled(dir) { for (let k = 1; k <= DECKS.length; k++) { const j = (cur + dir * k + DECKS.length * 4) % DECKS.length; if (ENABLED.includes(DECKS[j].id)) return j; } return cur; }
  $('#prevDeck').onclick = () => mount(nextEnabled(-1)); $('#nextDeck').onclick = () => mount(nextEnabled(1));
  let sx = null, sy = null;   // swipe to switch decks (mobile)
  stage.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, {passive: true});
  stage.addEventListener('touchend', e => { if (sx == null) return; const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) mount(nextEnabled(dx < 0 ? 1 : -1)); sx = null; }, {passive: true});

  /* ---------------- buttons ---------------- */
  const SECTIONS = { get length() { return 6; } };
  function act(a) {
    if (a === 'play') return st.playing ? stop() : play();
    if (a === 'volup' || a === 'voldn') { st.vol = Math.max(0, Math.min(1, st.vol + (a === 'volup' ? 0.05 : -0.05))); st.muted = false; applyVol(); return; }
    if (a === 'mute') { st.muted = !st.muted; applyVol(); return; }
    if (a === 'disp') { st.mode++; return; } if (a === 'dispprev') { st.mode += 2; return; }
    if (a === 'mode') return mount(nextEnabled(1));
    if (a === 'reconnect') return reconnectNow();
    if (a.startsWith('eq:')) { st.eqPreset = a.slice(3); localStorage.setItem('etb.eq', st.eqPreset); applyEQ(); return; }
    if (a.startsWith('preset')) { const i = +a.slice(6) - 1; st.section = i;
      if (window.ETB_PRESETS[i][1] === 'live') { if (!st.playing) play(); scrollTo({top: 0, behavior: RM ? 'auto' : 'smooth'}); }
      else document.getElementById(window.ETB_PRESETS[i][1])?.scrollIntoView({behavior: RM ? 'auto' : 'smooth'}); }
  }
  document.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (!b) return; b.classList.remove('hit'); void b.offsetWidth; b.classList.add('hit'); act(b.dataset.act); });
  addEventListener('keydown', e => { if (e.target.matches('input,textarea,select')) return;
    const m = {' ': 'play', ArrowUp: 'volup', ArrowDown: 'voldn', m: 'mute', d: 'disp', ArrowRight: 'mode'}[e.key];
    if (m) { e.preventDefault(); act(m); } else if (/^[1-6]$/.test(e.key)) act('preset' + e.key); });

  /* ---------------- render loop (30 fps; pauses when the tab is hidden) ---------------- */
  let last = performance.now();
  function loop(now) {
    requestAnimationFrame(loop); const dt = (now - last) / 1000; if (dt < 1 / 31) return; last = now; st.t += Math.min(dt, 0.1);
    if (st.boot < 1) st.boot = Math.min(1, st.boot + dt / 1.6);
    analyse(Math.min(dt, 0.1)); const d = DECKS[cur]; try { d.draw(V, st, stage); } catch (e) { console.error(e); }
  }
  requestAnimationFrame(loop);

  /* ---------------- data: now playing, listeners, schedule, history, map ---------------- */
  const PRE_DATA = p => p.startsWith('/api/nowplaying') ? {on_air: false, live: false, listeners: 0, show: '', now: {title: 'Stream launching soon', artist: C.station}}
    : p.startsWith('/api/schedule') ? {shows: [], current: null} : p.startsWith('/api/history') ? [] : p.startsWith('/api/public/map') ? {points: [], listeners: 0, countries: 0, regions: []}
    : p.startsWith('/api/public/videos') ? [] : null;
  const get = p => PRE ? (PRE_DATA(p) ? Promise.resolve(PRE_DATA(p)) : Promise.reject('prelaunch')) : DEMO ? Promise.resolve(window.ETB_DEMO(p)) : fetch(C.api + p).then(r => r.ok ? r.json() : Promise.reject(r.status));
  function setNP(d) {
    st.live = !!d.live; st.listeners = d.listeners || 0;
    const n = d.now || {}; st.title = [n.artist, n.title].filter(Boolean).join(' - ') || C.station; st.np = n; st.npAt = Date.now() / 1000; st.show = d.show || '';
    if ('mediaSession' in navigator && window.MediaMetadata) navigator.mediaSession.metadata = new MediaMetadata({title: n.title || C.station, artist: n.artist || C.tagline, album: C.station,
      artwork: [{src: 'assets/icon-512.png', sizes: '512x512', type: 'image/png'}, {src: 'assets/icon-192.png', sizes: '192x192', type: 'image/png'}]});
    $('#npTitle').textContent = n.title || C.station; $('#npArtist').textContent = n.artist || C.tagline;
    $('#miniTitle').textContent = n.title || C.station; $('#miniArtist').textContent = n.artist || C.tagline;
    $('#npShow').textContent = d.live ? 'LIVE ON AIR' : (d.show ? 'NOW · ' + d.show : 'AUTO DJ'); $('#npLis').textContent = (d.listeners || 0).toLocaleString('en-US');
    document.documentElement.classList.toggle('onair', d.on_air !== false);
    if (PRE) { $('#npShow').textContent = 'COMING SOON'; $('#npLis').textContent = '—'; const pl = $('.onair-pill>span'); if (pl) pl.textContent = 'SOON'; }
  }
  const refreshNP = () => get('/api/nowplaying').then(setNP).catch(() => {});
  refreshNP(); setInterval(refreshNP, 15000);
  if (!DEMO && !PRE && 'WebSocket' in window) { try { const ws = new WebSocket(C.api.replace(/^http/, 'ws') + '/ws');
    ws.onmessage = e => { const m = JSON.parse(e.data); if (m.type === 'nowplaying') refreshNP(); if (m.type === 'site') applySite(m.data); if (m.type === 'videos') loadVideos(); if (m.type === 'listeners') { st.listeners = m.data.current; $('#npLis').textContent = m.data.current.toLocaleString('en-US'); } }; } catch (_) {} }

  const io = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; io.unobserve(e.target); ({schedule: loadSchedule, recent: loadRecent, map: loadMap, requests: initRequests}[e.target.id] || (() => {}))(); }), {rootMargin: '300px'});
  $$('main section[id]').forEach(s => io.observe(s));
  const hhmm = m => { const h = Math.floor(m / 60) % 24, mm = m % 60; return `${(h % 12) || 12}:${String(mm).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`; };
  function loadSchedule() { get('/api/schedule').then(d => { const days = {mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun'};
    $('#shows').innerHTML = d.shows.map(s => `<li class="show${d.current && d.current.id === s.id ? ' now' : ''}" style="--c:${esc(s.color || '#2F6BFF')}"><b>${esc(s.name)}</b><span>${s.days.split(',').length === 7 ? 'Daily' : s.days.split(',').map(x => days[x] || x).join(' · ')} · ${hhmm(s.start_min)}–${hhmm(s.end_min)}</span><small>${esc(s.host || 'Auto DJ')}</small></li>`).join(''); }).catch(() => $('#shows').innerHTML = '<li>Schedule coming soon.</li>'); }
  function loadRecent() { get('/api/history?limit=10').then(h => { $('#recentList').innerHTML = h.map(r => `<li><time>${new Date(r.ts * 1000).toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit', timeZone: 'America/Chicago'})}</time><b>${esc(r.title)}</b><span>${esc(r.artist || '')}</span></li>`).join(''); }).catch(() => {}); }
  function loadMap() { get('/api/public/map').then(m => { const box = $('#mapDots');
    box.innerHTML = m.points.map(p => `<i style="left:${(p.lon + 180) / 360 * 100}%;top:${(84 - p.lat) / 142 * 100}%;--s:${Math.round(6 + Math.sqrt(p.listeners) * 3)}px" title="${p.label ? esc(p.label) + ' · ' : ''}${p.listeners} listening"></i>`).join('');
    $('#mapInfo').textContent = `${(m.listeners || 0).toLocaleString('en-US')} listening in ${m.countries} countries`; }).catch(() => {}); }
  function initRequests() { const q = $('#reqQ'), list = $('#reqList'); let tm = 0, sel = null;
    q.oninput = () => { clearTimeout(tm); tm = setTimeout(() => get('/api/requestable?q=' + encodeURIComponent(q.value)).then(r => { list.innerHTML = r.map(t => `<li><button type="button" data-id="${t.id}">${esc(t.artist)} – ${esc(t.title)}</button></li>`).join(''); }), 250); };
    list.onclick = e => { const b = e.target.closest('button'); if (!b) return; sel = +b.dataset.id; q.value = b.textContent; list.innerHTML = ''; };
    $('#reqForm').onsubmit = async e => { e.preventDefault(); if (!sel) return toast('Pick a song from the list first');
      if (DEMO) return toast('Demo mode — request not sent');
      if (PRE) return toast('Song requests open when the stream launches');
      const r = await fetch(C.api + '/api/requests', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({track_id: sel, name: $('#reqName').value, message: $('#reqMsg').value})});
      const j = await r.json().catch(() => ({})); toast(r.ok ? (j.status === 'queued' ? 'Requested! It’s in the queue.' : 'Played recently — try another one.') : (j.detail || 'Request failed')); }; }
  function renderSocials(list) { $('#socialLinks').innerHTML = list.map(s => s.url ? `<a href="${esc(s.url)}" rel="noopener">${esc(s.label)}</a>` : `<span class="soon">${esc(s.label)}</span>`).join(''); }
  renderSocials(C.socials);

  /* ---------------- owner settings (colours, text, decks, presets …) applied live ---------------- */
  let SITE = null, VCFG = {loop: true, shuffle: false, enabled: true};
  function applySite(c) {
    if (!c) return; SITE = c; const r = document.documentElement.style, t = c.theme || {};
    if (t.accent) { r.setProperty('--blue', t.accent); r.setProperty('--accent', t.accent); }
    if (t.accent2) r.setProperty('--pink', t.accent2); if (t.bg) r.setProperty('--bg', t.bg);
    st.vfd = t.vfd || null;
    if (c.seo) { document.title = c.seo.title; document.querySelector('meta[name=description]')?.setAttribute('content', c.seo.description); }
    $$('.llr-word, .llr-hero img').forEach(i => i.alt = c.station || C.station); C.station = c.station || C.station; C.tagline = c.tagline || C.tagline;
    if (c.logo) $$('.logo img, .foot img').forEach(i => i.src = c.logo);
    const ban = $('#banner'); ban.hidden = !(c.banner && c.banner.enabled && c.banner.text);
    if (!ban.hidden) ban.innerHTML = c.banner.link ? `<a href="${esc(c.banner.link)}">${esc(c.banner.text)}</a>` : esc(c.banner.text);
    const ht = $('#heroText'); ht.textContent = c.hero_text || ''; ht.hidden = !c.hero_text;
    LASTBG = c.background; ETB_BG.apply($('#bgl'), c.background, PV_DEVICE);
    if (c.presets) c.presets.forEach((p, i) => { window.ETB_PRESETS[i][0] = p.label; window.ETB_PRESETS[i][1] = p.target === 'live' ? 'live' : p.target; });
    if (c.socials) renderSocials(c.socials); renderPgrid();
    ENABLED = (c.decks && c.decks.enabled) || ENABLED;
    $$('.dots button').forEach((b, k) => b.hidden = !ENABLED.includes(DECKS[k].id));
    VCFG = c.video || VCFG; $('.vdin').hidden = VCFG.enabled === false;
    const want = Q.get('deck') || localStorage.getItem('etb.deck'); const def = DECKS.findIndex(d => d.id === (c.decks && c.decks.default));
    if (!ENABLED.includes(DECKS[cur].id) || (!want && def >= 0)) mount(def >= 0 ? def : nextEnabled(1), false); else mount(cur, false);
    loadVideos();
  }
  function loadVideos() {
    if (!window.ETB_VIDEO) return;
    get('/api/public/videos').then(l => ETB_VIDEO.setList(l.map(v => ({...v, src: v.src, poster: v.poster})), VCFG)).catch(() => ETB_VIDEO.setList([], VCFG));
  }
  var LASTBG = null, PV_DEVICE = null; ETB_BG.apply($('#bgl'), null);   // background: re-pick when the page crosses the phone/desktop breakpoint
  addEventListener('resize', () => { clearTimeout(window._bgT); window._bgT = setTimeout(() => ETB_BG.apply($('#bgl'), LASTBG, PV_DEVICE), 200); });
  if (Q.has('preview')) {   // owner studio live preview (draft settings via postMessage from the studio origin only)
    const ok = [C.studioOrigin].concat(/^(127\.0\.0\.1|localhost)$/.test(location.hostname) ? ['http://127.0.0.1:8080', 'http://localhost:8080'] : []);
    addEventListener('message', e => { if (ok.includes(e.origin) && e.data && e.data.type === 'etb-preview') { PV_DEVICE = e.data.device || null; applySite(e.data.site); } });
  }
  get('/api/public/site').then(applySite).catch(() => loadVideos());
  function toast(t) { const el = $('#toast'); el.textContent = t; el.classList.add('on'); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('on'), 3200); }

  function renderPgrid() { $('.pgrid').innerHTML = window.ETB_PRESETS.map((p, i) => `<button data-act="preset${i + 1}"><b>${i + 1}</b>${esc(p[0])}</button>`).join(''); }
  renderPgrid();
  // sticky mini-player once the deck scrolls away (phones)
  if (matchMedia('(pointer:coarse)').matches) $('#mini').hidden = false;   // phones: one compact sticky mini-player, always there
  else new IntersectionObserver(([e]) => { $('#mini').hidden = e.isIntersecting; }, {threshold: 0}).observe($('.np'));
  mount(cur, true);
  // pre-render the logo into a dot grid for the dot-matrix window
  const li = new Image(); li.src = 'assets/logo-96.webp'; li.onload = () => { st.logoGrid = VFD.imageGrid(li, 48, 26); };
  if (document.fonts) document.fonts.ready.then(fit);
})();
