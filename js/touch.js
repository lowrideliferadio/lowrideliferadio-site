/* Phones: the deck IS the remote. The faceplates are scaled as one picture, so a real key can be ~16 px tall
   on a 360 px screen. On touch screens every tap on a deck is routed to the NEAREST key (within REACH px of
   its edge), which gives each key the whole surrounding area as its hit-zone instead of its drawn outline. */
(function () {
  if (!matchMedia('(pointer:coarse)').matches) return;
  const REACH = 26;
  document.documentElement.classList.add('touch-keys');
  const dist = (r, x, y) => Math.hypot(Math.max(r.left - x, 0, x - r.right), Math.max(r.top - y, 0, y - r.bottom));
  window.ETB_nearestKey = (deck, x, y) => {
    let best = null, bd = REACH;
    deck.querySelectorAll('.k').forEach(k => { const r = k.getBoundingClientRect(); if (!r.width) return; const d = dist(r, x, y); if (d <= bd) { bd = d; best = k; } });
    return best;
  };
  document.addEventListener('click', e => {
    if (e.target.closest('.k') || !e.isTrusted) return;
    const deck = e.target.closest('#deck, #vdeck'); if (!deck) return;
    const k = window.ETB_nearestKey(deck, e.clientX, e.clientY);
    if (k) { e.stopPropagation(); k.click(); }
  }, true);
})();
