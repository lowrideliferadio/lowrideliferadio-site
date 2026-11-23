/* Homepage background: built-in original presets, colour, gradient, own image or video, with dim / blur / tint,
   separate desktop and phone picks. Config lives in site settings (background.*) and is applied live. */
window.ETB_BG = (function () {
  const A = new URL('assets/bg/', document.baseURI).href, AS = new URL('assets/', document.baseURI).href;
  const flake = (c0, c1, c2, op) => ({base: `radial-gradient(130% 95% at 50% 22%, ${c0}, ${c1} 48%, ${c2} 88%)`, fx: {img: `url(${A}flake-tile.webp)`, size: '300px', op}});
  const P = {
    'black-flake': {label: 'Black candy flake', ...flake('#1b0e28', '#07030b', '#010002', .32)},
    'black': {label: 'Pure black', base: '#000'},
    'flake-purple': {label: 'Candy purple flake', ...flake('#9a2bd8', '#2c0748', '#0a0212', .55)},
    'flake-blue': {label: 'Candy blue flake', ...flake('#2a5fe0', '#091a48', '#020612', .55)},
    'flake-red': {label: 'Candy red flake', ...flake('#cc1630', '#42040b', '#0e0103', .55)},
    'steel': {label: 'Brushed steel', base: `linear-gradient(100deg, transparent 25%, #ffffff1f 42%, transparent 58%), radial-gradient(120% 90% at 50% 30%, transparent 40%, #000a), url(${A}steel-tile.webp) 0 0/1024px 256px repeat, #3a3c40`},
    'tuck-roll': {label: 'Tuck & roll leather', base: `radial-gradient(120% 90% at 50% 30%, transparent 35%, #000c), url(${A}tuck-tile.webp) 0 0/105px 315px repeat, #2a0306`},
    'sunset': {label: 'Sunset boulevard', base: {d: `url(${A}sunset-d.webp) 50% 70%/cover no-repeat, #12061a`, m: `url(${A}sunset-m.webp) 50% 60%/cover no-repeat, #12061a`}},
    'showfloor': {label: 'Show floor', base: {d: `url(${A}showfloor-d.webp) 50% 60%/cover no-repeat, #030205`, m: `url(${A}showfloor-m.webp) 50% 55%/cover no-repeat, #030205`}},
    'neon': {label: 'Neon glow (animated)', base: '#050208', cls: 'neon'},
    'night-city': {label: 'Night city (old)', base: {d: `url(${AS}dash-1600.webp) 50% 50%/cover no-repeat, #07050b`, m: `url(${AS}dash-mobile.webp) 50% 50%/cover no-repeat, #07050b`}},
  };
  const DEF = {type: 'preset', preset: 'black-flake', color: '#000000', color2: '#2a0845', angle: 160, url: '', dim: 0, blur: 0, overlay: '#000000', overlay_op: 0};
  const isMobile = () => matchMedia('(max-width: 760px)').matches || (matchMedia('(pointer: coarse)').matches && matchMedia('(max-width: 1024px)').matches);
  function normalize(b) {
    if (!b) return {same: true, desktop: {...DEF}, mobile: {...DEF}};
    if (!b.desktop) {   // old format {type, url}
      const d = b.url ? {...DEF, type: b.type === 'video' ? 'video' : 'image', url: b.url} : {...DEF}; return {same: true, desktop: d, mobile: {...d}};
    }
    return {same: b.same !== false, desktop: {...DEF, ...b.desktop}, mobile: {...DEF, ...(b.mobile || b.desktop)}};
  }
  const hexA = (h, a) => h + Math.round(Math.max(0, Math.min(1, a)) * 255).toString(16).padStart(2, '0');
  let lastVideo = '';
  function apply(root, cfg, device) {
    const b = normalize(cfg), dev = device || (isMobile() ? 'mobile' : 'desktop'), s = dev === 'mobile' && !b.same ? b.mobile : b.desktop;
    const media = root.querySelector('.bgl-media'), fx = root.querySelector('.bgl-fx'), dim = root.querySelector('.bgl-dim');
    root.className = 'bgl'; fx.style.cssText = ''; media.style.cssText = '';
    if (s.type !== 'video') { const v = media.querySelector('video'); if (v) v.remove(); lastVideo = ''; }
    if (s.type === 'preset') { const p = P[s.preset] || P['black-flake']; const base = typeof p.base === 'object' ? p.base[dev === 'mobile' ? 'm' : 'd'] : p.base;
      media.style.background = base; if (p.fx) fx.style.cssText = `background:${p.fx.img} 0 0/${p.fx.size} repeat;opacity:${p.fx.op}`; if (p.cls) root.classList.add(p.cls); }
    else if (s.type === 'color') media.style.background = s.color;
    else if (s.type === 'gradient') media.style.background = `linear-gradient(${+s.angle || 0}deg, ${s.color}, ${s.color2})`;
    else if (s.type === 'image' && s.url) media.style.background = `url("${encodeURI(s.url)}") 50% 50%/cover no-repeat, #000`;
    else if (s.type === 'video' && s.url) { media.style.background = '#000';
      if (lastVideo !== s.url) { let v = media.querySelector('video'); if (!v) { v = document.createElement('video'); media.appendChild(v); }
        Object.assign(v, {muted: true, loop: true, autoplay: true, playsInline: true, src: s.url}); v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
        if (matchMedia('(prefers-reduced-motion: reduce)').matches) v.autoplay = false; else v.play().catch(() => {}); lastVideo = s.url; } }
    else media.style.background = '#000';
    const blur = Math.max(0, Math.min(24, +s.blur || 0));
    media.style.filter = blur ? `blur(${blur}px)` : ''; media.style.transform = blur ? `scale(${1 + blur / 120})` : '';
    dim.style.background = `linear-gradient(${hexA('#000000', (+s.dim || 0) / 100)}, ${hexA('#000000', (+s.dim || 0) / 100)}), ${hexA(s.overlay || '#000000', (+s.overlay_op || 0) / 100)}`;
    root.dataset.bg = s.type === 'preset' ? s.preset : s.type;
  }
  return {P, DEF, normalize, apply, isMobile};
})();
