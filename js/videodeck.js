/* Video deck: a separate in-dash video unit under the radio deck. Same finish as the selected radio skin.
   Plays the owner's clip playlist muted (never fights the radio stream); one persistent <video> element. */
(function () {
  const SKIN = {nightrider: ['night', 'key dark vk-night', 'NIGHT RIDER VIDEO · ET-7000V'], multicd: ['gun', 'gunkey', 'MULTI-CD VIDEO · ET-9000V'],
    stack: ['silver', 'silv', 'IN-DASH MONITOR · ET-5500V'], touch: ['gloss', 'cap', 'ET-X1 VIDEO']};
  const ic = {
    play: '<svg viewBox="0 0 24 24"><path d="M7 5l12 7-12 7z"/></svg>', pause: '<svg viewBox="0 0 24 24"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>',
    prev: '<svg viewBox="0 0 24 24"><path d="M6 5h2v14H6zM20 5v14L9 12z"/></svg>', next: '<svg viewBox="0 0 24 24"><path d="M16 5h2v14h-2zM4 5v14l11-7z"/></svg>',
    repeat: '<svg viewBox="0 0 24 24"><path d="M5 9a4 4 0 0 1 4-4h9l-2.5-2.5M19 15a4 4 0 0 1-4 4H6l2.5 2.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    shuffle: '<svg viewBox="0 0 24 24"><path d="M3 7h4l10 10h4M3 17h4l3-3M14 10l3-3h4M18 4l3 3-3 3M18 14l3 3-3 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    mic: '<svg viewBox="0 0 24 24"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4M8 22h8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    spk: '<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 8a5 5 0 0 1 0 8M18.5 5.5a8.5 8.5 0 0 1 0 13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    muted: '<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'
  };
  const W = 1000, H = 560;
  const V = document.createElement('video'); V.muted = true; V.defaultMuted = true; V.playsInline = true; V.setAttribute('playsinline', ''); V.setAttribute('muted', '');
  V.preload = 'metadata'; V.disablePictureInPicture = true; V.setAttribute('aria-label', 'Station video');
  const S = {list: [], i: 0, loop: true, shuffle: false, overlay: true, wanted: true, enabled: true};
  let stage = null, root = null;

  function key(act, x, y, w, h, cls, inner, label) {
    return `<button class="k ${cls}" data-vact="${act}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px" aria-label="${label}">${inner}</button>`;
  }
  function html(id) {
    const [plate, kc, model] = SKIN[id] || SKIN.nightrider;
    const col = [['vol+', '<em>+</em>', 'Video volume up'], ['vol-', '<em>−</em>', 'Video volume down'], ['mute', `<span class="i snd">${ic.muted}${ic.spk}</span>`, 'Unmute / mute video'],
      ['play', `<span class="i pp">${ic.play}${ic.pause}</span>`, 'Play / pause video', 'home'], ['disp', '<em>▭</em><small>DISP</small>', 'Show / hide info'], ['next', `<span class="i">${ic.next}</span>`, 'Next clip'], ['prev', `<span class="i">${ic.prev}</span>`, 'Previous clip']];
    let y = 44; const keys = col.map(c => { const h = c[3] ? 76 : 50, k = key(c[0], 22, y, 64, h, kc + (c[3] ? ' ' + c[3] : ''), c[1], c[2]); y += h + 10; return k; }).join('');
    const bar = [['play', `<span class="i pp">${ic.play}${ic.pause}</span>`, 'Play / pause'], ['prev', ic.prev, 'Previous clip'], ['next', ic.next, 'Next clip'],
      ['loop', ic.repeat, 'Loop playlist'], ['shuffle', ic.shuffle, 'Shuffle'], ['req', ic.mic, 'Request a song']]
      .map((b, i) => `<button class="k vb${i === 5 ? ' last' : ''}" data-vact="${b[0]}" aria-label="${b[2]}">${b[1]}</button>`).join('');
    return `<div class="face" style="width:${W}px;height:${H}px"><div class="plate ${plate}" style="height:${H}px">
      <i class="lip top"></i><div class="slot thin" style="left:150px;top:16px;width:600px"></div><div class="silk tiny" style="left:790px;top:14px">${model}</div>
      ${keys}
      <div class="vscreen" style="left:104px;top:36px;width:840px;height:416px"><div class="vhold"></div>
        <div class="vover"><small>E.T.TATTOO VIDEO</small><b data-v="title">—</b><span data-v="sub"></span></div>
        <div class="vclock" data-v="time">00:00 / 00:00</div><div class="vbadge" data-v="badge">${matchMedia('(pointer:coarse)').matches ? 'MUTED · TAP 🔈 KEY (LEFT)' : 'MUTED · TAP SPEAKER KEY FOR SOUND'}</div>
        <i class="glass big"></i></div>
      <div class="vbar" style="left:104px;top:462px;width:840px;height:58px">${bar}</div>
      <div class="vbrand"><img src="assets/logo-96.webp" alt="" width="22" height="22"><b>E.T.TATTOO</b></div>
    </div></div>`;
  }
  function fit() {
    if (!stage) return; const k = Math.floor(stage.clientWidth) / W; stage.style.height = (H * k) + 'px';
    const f = stage.querySelector('.face'); if (f) f.style.transform = `scale(${k})`;
  }
  function q(k) { return root && root.querySelector(`[data-v="${k}"]`); }
  function sync() {
    if (!root) return; const c = S.list[S.i] || {};
    const t = q('title'); if (t) t.textContent = c.title || 'No clips yet';
    const s = q('sub'); if (s) s.textContent = `Clip ${S.list.length ? S.i + 1 : 0} of ${S.list.length}${S.shuffle ? ' · SHUFFLE' : ''}${S.loop ? ' · LOOP' : ''}`;
    root.classList.toggle('vplaying', !V.paused); root.classList.toggle('vmuted', V.muted); root.classList.toggle('vover-off', !S.overlay);
    root.querySelectorAll('[data-vact=loop]').forEach(b => b.classList.toggle('lit', S.loop));
    root.querySelectorAll('[data-vact=shuffle]').forEach(b => b.classList.toggle('lit', S.shuffle));
  }
  const fmt = x => isFinite(x) ? `${String(Math.floor(x / 60)).padStart(2, '0')}:${String(Math.floor(x % 60)).padStart(2, '0')}` : '00:00';
  V.addEventListener('timeupdate', () => { const e = q('time'); if (e) e.textContent = `${fmt(V.currentTime)} / ${fmt(V.duration)}`; });
  V.addEventListener('ended', () => next(1, true));
  V.addEventListener('play', sync); V.addEventListener('pause', sync); V.addEventListener('volumechange', sync);
  V.addEventListener('error', () => setTimeout(() => next(1, true), 1500));   // broken clip: move on, never stall the unit
  function load(i, autoplay) {
    if (!S.list.length) { V.removeAttribute('src'); V.poster = ''; sync(); return; }
    S.i = (i + S.list.length) % S.list.length; const c = S.list[S.i]; V.poster = c.poster || ''; V.src = c.src;
    if (autoplay && S.wanted && !document.hidden) V.play().catch(() => {}); sync();
  }
  function next(d, auto) {
    if (!S.list.length) return;
    if (S.shuffle && S.list.length > 1) { let j; do { j = Math.floor(Math.random() * S.list.length); } while (j === S.i); return load(j, true); }
    if (auto && !S.loop && S.i === S.list.length - 1 && d > 0) { S.wanted = false; sync(); return; }
    load(S.i + d, true);
  }
  function act(a) {
    if (a === 'play') { S.wanted = V.paused; V.paused ? V.play().catch(() => {}) : V.pause(); }
    else if (a === 'mute') { V.muted = !V.muted; if (!V.muted && V.volume < 0.2) V.volume = 0.6; }
    else if (a === 'vol+') { V.muted = false; V.volume = Math.min(1, V.volume + 0.1); }
    else if (a === 'vol-') { V.volume = Math.max(0, V.volume - 0.1); }
    else if (a === 'next') next(1); else if (a === 'prev') next(-1);
    else if (a === 'loop') S.loop = !S.loop; else if (a === 'shuffle') S.shuffle = !S.shuffle;
    else if (a === 'disp') S.overlay = !S.overlay;
    else if (a === 'req') document.getElementById('requests')?.scrollIntoView({behavior: 'smooth'});
    sync();
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) V.pause(); else if (S.wanted && S.list.length) V.play().catch(() => {}); });
  window.ETB_VIDEO = {
    el: V,
    mount(el, deckId) {          // called on every deck switch: restyle, keep the same <video> playing
      stage = el; stage.innerHTML = html(deckId); root = stage; stage.querySelector('.vhold').appendChild(V); if (window.ETB_tex) ETB_tex(stage, 'v' + (SKIN[deckId] ? deckId : 'nightrider'));
      stage.onclick = e => { const b = e.target.closest('[data-vact]'); if (b) { b.classList.remove('hit'); void b.offsetWidth; b.classList.add('hit'); act(b.dataset.vact); } };
      fit(); sync();
    },
    fit,
    setList(list, cfg) {
      const cur = S.list[S.i] && S.list[S.i].src; S.list = list || []; Object.assign(S, {loop: cfg.loop !== false, shuffle: !!cfg.shuffle});
      const keep = S.list.findIndex(c => c.src === cur);
      if (keep >= 0) { S.i = keep; sync(); } else load(0, !(navigator.connection && navigator.connection.saveData));
    },
    hide(h) { if (stage) stage.closest('.vdin').hidden = h; if (h) V.pause(); }
  };
  addEventListener('resize', fit);
  document.addEventListener('click', e => { const b = e.target.closest('.vdeck-bar [data-vact]'); if (b) act(b.dataset.vact); });
})();
