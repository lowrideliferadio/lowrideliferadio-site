/* VFD rendering engine: 14-segment text, dot-matrix, spectrum bars with peak hold, arc meters,
   phosphor persistence (ghosting) and bloom. All drawing is in "design pixels" (deck coordinates). */
(function () {
  const S = {A:[[1,0],[9,0]],B:[[10,1],[10,9]],C:[[10,11],[10,19]],D:[[1,20],[9,20]],E:[[0,11],[0,19]],F:[[0,1],[0,9]],
    G:[[1,10],[4.6,10]],H:[[5.4,10],[9,10]],I:[[1.5,1.5],[4.3,8.6]],J:[[5,1],[5,9]],K:[[8.5,1.5],[5.7,8.6]],
    L:[[4.3,11.4],[1.5,18.5]],M:[[5,11],[5,19]],N:[[5.7,11.4],[8.5,18.5]]};
  const F = {'0':'ABCDEFKL','1':'BCK','2':'ABGHED','3':'ABCDH','4':'FGHBC','5':'AFGHCD','6':'AFGHECD','7':'ABC','8':'ABCDEFGH','9':'ABCDFGH',
    A:'ABCEFGH',B:'ABCDJMH',C:'ADEF',D:'ABCDJM',E:'ADEFG',F:'AEFG',G:'ACDEFH',H:'BCEFGH',I:'ADJM',J:'BCDE',K:'EFGKN',L:'DEF',
    M:'BCEFIK',N:'BCEFIN',O:'ABCDEF',P:'ABEFGH',Q:'ABCDEFN',R:'ABEFGHN',S:'AFGHCD',T:'AJM',U:'BCDEF',V:'EFLK',W:'BCEFLN',
    X:'IKLN',Y:'IKM',Z:'ADKL','-':'GH','+':'GHJM','/':'KL','\\':'IN','*':'GHIJKLMN','&':'ADEGIN',"'":'J','"':'FJ','_':'D',
    '=':'DGH','<':'KN','>':'IL','(':'KN',')':'IL','?':'ABHM','!':'BC','%':'FKLC','#':'GHJMBC','@':'ABCDEGJ','$':'AFGHCDJM',':':'','.':''};
  const ALL = 'ABCDEFGHIJKLMN';

  class VFD {
    // Crisp pipeline: everything is drawn sharp into an offscreen layer at device-pixel resolution, then composited as
    // background -> faint phosphor trail (previous frame) -> tight low-opacity glow BEHIND -> sharp layer on top.
    constructor(canvas, w, h) {
      this.c = canvas; this.w = w; this.h = h; this.mx = canvas.getContext('2d');
      this.L = document.createElement('canvas'); this.x = this.L.getContext('2d');
      this.P = document.createElement('canvas'); this.px = this.P.getContext('2d');
      this.glow = document.createElement('canvas'); this.gx = this.glow.getContext('2d');
      this.resize();
    }
    resize() {
      const r = this.c.getBoundingClientRect(), dpr = Math.min(3, devicePixelRatio || 1);
      const cw = Math.max(2, Math.round(r.width * dpr)), ch = Math.max(2, Math.round(r.height * dpr));
      for (const c of [this.c, this.L, this.P]) { c.width = cw; c.height = ch; }
      this.s = cw / this.w;
      this.glow.width = Math.max(2, cw >> 1); this.glow.height = Math.max(2, ch >> 1);
    }
    begin(bg, persist = 0.62) {
      this.bg = bg; this.persist = persist; const x = this.x;
      x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; x.clearRect(0, 0, this.L.width, this.L.height);
      x.setTransform(this.s, 0, 0, this.s, 0, 0);
    }
    end(amount = 0.9) {
      const m = this.mx, W = this.c.width, H = this.c.height, g = this.gx;
      m.setTransform(1, 0, 0, 1, 0, 0); m.globalCompositeOperation = 'source-over'; m.globalAlpha = 1; m.fillStyle = this.bg; m.fillRect(0, 0, W, H);
      // phosphor ghost: faint copy of the previous frame (decays, never smears the current glyphs)
      m.globalCompositeOperation = 'lighter'; m.globalAlpha = 0.16 * (1 - this.persist) / 0.38; m.drawImage(this.P, 0, 0);
      // tight glow halo behind the segments
      g.clearRect(0, 0, this.glow.width, this.glow.height);
      if ('filter' in g) g.filter = `blur(${Math.max(1, this.s * 0.9).toFixed(1)}px)`;
      g.drawImage(this.L, 0, 0, this.glow.width, this.glow.height); if ('filter' in g) g.filter = 'none';
      m.globalAlpha = Math.min(0.5, amount * 0.42); m.imageSmoothingEnabled = true; m.drawImage(this.glow, 0, 0, W, H);
      // sharp segments on top
      m.globalCompositeOperation = 'source-over'; m.globalAlpha = 1; m.drawImage(this.L, 0, 0);
      this.px.clearRect(0, 0, W, H); this.px.drawImage(this.L, 0, 0);
      this.x.setTransform(this.s, 0, 0, this.s, 0, 0);
    }
    // 14-segment string. h = char height; ghost = brightness of unlit segments
    seg(text, x0, y0, h, col, opt = {}) {
      const x = this.x, sc = h / 20, adv = (opt.adv || 14.6) * sc, n = opt.n || text.length, ghost = opt.ghost ?? 0.08, skew = opt.skew ?? 0.12;
      x.lineCap = 'round'; x.lineJoin = 'round'; x.lineWidth = (opt.lw || 1.7) * sc;
      for (let i = 0; i < n; i++) {
        const ch = (text[i] || ' ').toUpperCase(), on = F[ch] ?? (ch === ' ' ? '' : 'GH'), ox = x0 + i * adv;
        for (const k of ALL) {
          const lit = on.includes(k); if (!lit && !ghost) continue;
          let [[a, b], [c, d]] = S[k]; const L = Math.hypot(c - a, d - b), g = Math.min(0.55, L * 0.2), ux = (c - a) / L * g, uy = (d - b) / L * g;
          a += ux; b += uy; c -= ux; d -= uy;
          x.strokeStyle = col; x.globalAlpha = lit ? 1 : ghost;
          x.beginPath(); x.moveTo(ox + (a - b * skew + 2) * sc, y0 + b * sc); x.lineTo(ox + (c - d * skew + 2) * sc, y0 + d * sc); x.stroke();
        }
        if (ch === '.' || ch === ':') { x.globalAlpha = 1; x.fillStyle = col; x.beginPath(); x.arc(ox + 5 * sc, y0 + 19 * sc, 1.2 * sc, 0, 7); x.fill();
          if (ch === ':') { x.beginPath(); x.arc(ox + 6.2 * sc, y0 + 7 * sc, 1.2 * sc, 0, 7); x.fill(); } }
      }
      x.globalAlpha = 1;
    }
    // vertical bars made of segments, with peak hold caps
    bars(vals, peaks, x0, y0, w, h, opt = {}) {
      const x = this.x, n = vals.length, gap = opt.gap ?? 4, bw = (w - gap * (n - 1)) / n, segs = opt.segs || 16, sh = h / segs;
      for (let i = 0; i < n; i++) {
        const bx = x0 + i * (bw + gap), lit = Math.round(vals[i] * segs), pk = Math.round((peaks ? peaks[i] : 0) * segs);
        for (let s = 0; s < segs; s++) {
          const by = y0 + h - (s + 1) * sh, on = s < lit;
          x.fillStyle = opt.color ? opt.color(s / segs, i / n) : '#e8f4ff';
          x.globalAlpha = on ? 1 : (s === pk - 1 && pk > 0 ? 1 : (opt.ghost ?? 0.06));
          x.fillRect(bx, by + 1, bw, sh - (opt.segGap ?? 1.6));
        }
      }
      x.globalAlpha = 1;
    }
    // quarter-ish arc level meter made of segments
    arc(level, cx, cy, r0, r1, a0, a1, opt = {}) {
      const x = this.x, n = opt.n || 22, da = (a1 - a0) / n;
      for (let i = 0; i < n; i++) {
        const a = a0 + i * da, on = i / n < level;
        x.fillStyle = opt.color ? opt.color(i / n) : '#39a7ff'; x.globalAlpha = on ? 1 : (opt.ghost ?? 0.07);
        x.beginPath(); x.arc(cx, cy, r1, a + da * 0.12, a + da * 0.88); x.arc(cx, cy, r0, a + da * 0.88, a + da * 0.12, true); x.closePath(); x.fill();
      }
      x.globalAlpha = 1;
    }
    // dot matrix from a 0..1 grid
    dots(grid, cols, rows, x0, y0, w, h, col, ghost = 0.08) {
      const x = this.x, dw = w / cols, dh = h / rows, r = Math.min(dw, dh) * 0.36; x.fillStyle = col;
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        const v = grid[j * cols + i]; x.globalAlpha = v > 0.05 ? Math.min(1, v) : ghost;
        x.beginPath(); x.arc(x0 + (i + 0.5) * dw, y0 + (j + 0.5) * dh, r, 0, 7); x.fill();
      }
      x.globalAlpha = 1;
    }
    label(t, x0, y0, size, col, align = 'left', alpha = 1) {
      const x = this.x; x.globalAlpha = alpha; x.fillStyle = col; x.font = `700 ${size}px Rajdhani, sans-serif`; x.textAlign = align; x.textBaseline = 'middle';
      x.fillText(t, x0, y0); x.globalAlpha = 1; x.textAlign = 'left';
    }
    box(x0, y0, w, h, col, alpha = 1, fill = false) {
      const x = this.x; x.globalAlpha = alpha; if (fill) { x.fillStyle = col; x.fillRect(x0, y0, w, h); } else { x.strokeStyle = col; x.lineWidth = 1.2; x.strokeRect(x0, y0, w, h); } x.globalAlpha = 1;
    }
  }
  // rasterise text or an image into a dot grid (for dot-matrix windows)
  VFD.textGrid = (txt, cols, rows, off = 0) => {
    const c = VFD._tc || (VFD._tc = document.createElement('canvas')); c.width = cols; c.height = rows;
    const x = c.getContext('2d'); x.clearRect(0, 0, cols, rows); x.fillStyle = '#fff'; x.font = `700 ${rows}px Rajdhani, sans-serif`; x.textBaseline = 'top';
    x.fillText(txt, -off, -1); const d = x.getImageData(0, 0, cols, rows).data, g = new Float32Array(cols * rows);
    for (let i = 0; i < g.length; i++) g[i] = d[i * 4 + 3] > 110 ? 1 : 0; return {grid: g, width: x.measureText(txt).width};
  };
  VFD.imageGrid = (img, cols, rows) => {
    const c = document.createElement('canvas'); c.width = cols; c.height = rows; const x = c.getContext('2d');
    const s = Math.min(cols / img.width, rows / img.height); x.drawImage(img, (cols - img.width * s) / 2, (rows - img.height * s) / 2, img.width * s, img.height * s);
    const d = x.getImageData(0, 0, cols, rows).data, g = new Float32Array(cols * rows);
    for (let i = 0; i < g.length; i++) { const a = d[i * 4 + 3] / 255, l = (d[i * 4] + d[i * 4 + 1] + d[i * 4 + 2]) / 765; g[i] = a > 0.4 ? 0.25 + 0.75 * l : 0; }
    return g;
  };
  window.VFD = VFD;
})();
