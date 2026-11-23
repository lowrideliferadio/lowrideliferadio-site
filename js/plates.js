/* Photoreal faceplate textures (rendered offline by mockups/src/render_plates.py from each deck's real key and
   display geometry). Applied per plate after a deck mounts; the CSS-only look stays as the fallback. */
window.ETB_tex = function (stage, key) {
  stage.querySelectorAll('.plate').forEach((pl, i) => {
    const u = new URL(`assets/plates/${key}-${i}`, document.baseURI).href, img = new Image();
    img.onload = () => { pl.style.setProperty('--tex', `image-set(url("${u}@1x.webp") 1x, url("${u}@2x.webp") 2x)`); pl.classList.add('tex'); };
    img.src = `${u}@${devicePixelRatio > 1.2 ? 2 : 1}x.webp`;
  });
};
