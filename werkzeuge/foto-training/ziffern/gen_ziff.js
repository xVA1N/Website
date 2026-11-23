// Gedruckte Ziffern und Schrägstriche als 28 × 28-Glyphen über die Aufbereitung der Website
const { chromium } = require('playwright'); const fs = require('fs');
const N = +process.argv[2], SEED = +process.argv[3], OUT = process.argv[4];
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); await p.setContent('<html><body></body></html>');
  await p.addScriptTag({ path: '../../../js/foto-kern.js' });
  const r = await p.evaluate(({ N, SEED }) => {
    let s = SEED >>> 0; const rnd = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const W = 96, c = document.createElement('canvas'); c.width = W; c.height = W; const x = c.getContext('2d', { willReadFrequently: true });
    const FONTS = ['Arial', 'Helvetica', 'DejaVu Sans', 'DejaVu Serif', 'Liberation Sans', 'Liberation Serif', 'Liberation Mono', 'DejaVu Sans Mono', 'sans-serif', 'serif', 'monospace'];
    const X = new Uint8Array(N * 784), Y = new Uint8Array(N);
    for (let i = 0; i < N; i++) {
      const kl = rnd() < 0.18 ? 10 : Math.floor(rnd() * 10);
      x.setTransform(1, 0, 0, 1, 0, 0); x.fillStyle = '#fff'; x.fillRect(0, 0, W, W);
      x.translate(W / 2 + (rnd() - 0.5) * 8, W / 2 + (rnd() - 0.5) * 8); x.rotate((rnd() - 0.5) * 0.35); x.transform(1, 0, (rnd() - 0.5) * 0.4, 1, 0, 0);
      x.fillStyle = x.strokeStyle = '#111';
      if (kl === 10) {
        const L = 34 + rnd() * 20, a = (55 + rnd() * 25) * Math.PI / 180, dx = Math.cos(a) * L / 2, dy = Math.sin(a) * L / 2;
        x.lineWidth = 2 + rnd() * 6; x.lineCap = 'round'; x.beginPath(); x.moveTo(-dx, dy); x.quadraticCurveTo((rnd() - 0.5) * 6, (rnd() - 0.5) * 6, dx, -dy); x.stroke();
      } else {
        const gw = 40 + rnd() * 24; x.font = (rnd() < 0.4 ? 'bold ' : '') + gw + 'px "' + FONTS[Math.floor(rnd() * FONTS.length)] + '"';
        x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(String(kl), 0, 0);
        if (rnd() < 0.3) { x.lineWidth = 1 + rnd() * 3; x.strokeText(String(kl), 0, 0); }
      }
      const g = fotoGrau(x, 0, 0, W, W), m = fotoTinte(g, W, W), teile = fotoTeile(m, W, W);
      if (!teile.length) { i--; continue; }
      const gl = fotoGlyphe(teile, W);
      for (let k = 0; k < 784; k++) X[i * 784 + k] = Math.round(gl[k] * 255);
      Y[i] = kl;
    }
    const b64 = (u) => { let s = ''; for (let k = 0; k < u.length; k += 32768) s += String.fromCharCode.apply(null, u.subarray(k, k + 32768)); return btoa(s); };
    return { x: b64(X), y: b64(Y) };
  }, { N, SEED });
  fs.writeFileSync(OUT + '.x', Buffer.from(r.x, 'base64')); fs.writeFileSync(OUT + '.y', Buffer.from(r.y, 'base64')); await b.close();
})();
