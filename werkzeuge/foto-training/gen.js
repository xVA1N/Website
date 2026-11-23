const { chromium } = require('playwright');
const fs = require('fs');
const K = process.argv[2], N = +process.argv[3], SEED = +process.argv[4], OUT = process.argv[5], STIL = process.argv[6] || 'normal';
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.setContent('<html><body></body></html>');
  await p.addScriptTag({ path: '../../vendor/milsymbol.js' });
  await p.addScriptTag({ path: '../../js/foto-kern.js' });
  const klassen = JSON.parse(fs.readFileSync(K + '/klassen.json', 'utf8')).map(k => k[0]);
  const RAHMEN = ['3', '6', '4', '1'], GROESSE = ['00', '11', '12', '13', '14', '15', '16', '17', '18', '21', '22', '23'];
  const res = await p.evaluate(async ({ N, SEED, klassen, RAHMEN, GROESSE, STIL }) => {
    let s = SEED >>> 0; const rnd = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const W = 160, cv = document.createElement('canvas'); cv.width = W; cv.height = W; const ctx = cv.getContext('2d', { willReadFrequently: true });
    const tmp = document.createElement('canvas'); tmp.width = W; tmp.height = W; const tctx = tmp.getContext('2d', { willReadFrequently: true });
    const X = new Uint8Array(N * FOTO_N * FOTO_N), Y = new Uint8Array(N * 3);
    const laden = (svg) => new Promise(r => { const im = new Image(); im.onload = () => r(im); im.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg))); });
    for (let i = 0; i < N; i++) {
      const ri = Math.floor(rnd() * 4), si = Math.floor(rnd() * (klassen.length + 1)), gi = rnd() < 0.15 ? 0 : Math.floor(rnd() * GROESSE.length);
      const ent = si === klassen.length ? '000000' : klassen[si];
      const sidc = '100' + RAHMEN[ri] + '10' + (rnd() < 0.15 ? '1' : '0') + (rnd() < 0.08 ? '2' : '0') + GROESSE[gi] + ent + '0000';
      const farbig = STIL === 'normal' && rnd() < 0.35;
      const o = { size: 40 + rnd() * 35, strokeWidth: 1.3 + rnd() * 5.2, outlineWidth: 0, standard: 'APP6' };
      if (farbig) { o.fill = true; o.colorMode = ['Light', 'Medium', 'Dark'][Math.floor(rnd() * 3)]; } else { o.fill = false; o.monoColor = '#000000'; }
      if (rnd() < 0.12) o.uniqueDesignation = String(Math.floor(rnd() * 9) + 1) + './' + Math.floor(rnd() * 900 + 100);
      if (rnd() < 0.06) o.higherFormation = 'BRIG ' + Math.floor(rnd() * 40);
      const sym = new ms.Symbol(sidc, o);
      const im = await laden(sym.asSVG());
      // Papier: helle Fläche mit Verlauf
      const hell = 200 + rnd() * 55;
      const gr = ctx.createLinearGradient(0, 0, W * rnd(), W);
      gr.addColorStop(0, 'rgb(' + hell + ',' + hell + ',' + (hell - rnd() * 15) + ')'); const d2 = hell - 20 - rnd() * 60;
      gr.addColorStop(1, 'rgb(' + d2 + ',' + d2 + ',' + d2 + ')');
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.filter = 'none'; ctx.fillStyle = gr; ctx.fillRect(0, 0, W, W);
      // Zeichen leicht gedreht, gestaucht, geschert
      const sc = (W * (0.55 + rnd() * 0.3)) / Math.max(im.width, im.height);
      const rot = (rnd() - 0.5) * 0.4, sx = 1 + (rnd() - 0.5) * 0.2, sh = (rnd() - 0.5) * 0.25;
      tctx.setTransform(1, 0, 0, 1, 0, 0); tctx.clearRect(0, 0, W, W);
      tctx.translate(W / 2 + (rnd() - 0.5) * 16, W / 2 + (rnd() - 0.5) * 16); tctx.rotate(rot); tctx.transform(sx, 0, sh, 1, 0, 0); tctx.scale(sc, sc);
      tctx.drawImage(im, -im.width / 2, -im.height / 2);
      // Handzeichnung: glatte zufällige Verschiebung der Pixel
      const amp = STIL === 'rau' ? 4 + rnd() * 3 : (rnd() < 0.5 ? rnd() * 2.5 : 1.5 + rnd() * 5), gn = 4 + Math.floor(rnd() * 4), gxs = [], gys = [];
      for (let k = 0; k < gn * gn; k++) { gxs.push((rnd() - 0.5) * 2 * amp); gys.push((rnd() - 0.5) * 2 * amp); }
      const src = tctx.getImageData(0, 0, W, W), dst = tctx.createImageData(W, W);
      for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
        const fx = x / W * (gn - 1), fy = y / W * (gn - 1), ix = Math.min(gn - 2, Math.floor(fx)), iy = Math.min(gn - 2, Math.floor(fy)), ax = fx - ix, ay = fy - iy;
        const bil = (a) => (a[iy * gn + ix] * (1 - ax) + a[iy * gn + ix + 1] * ax) * (1 - ay) + (a[(iy + 1) * gn + ix] * (1 - ax) + a[(iy + 1) * gn + ix + 1] * ax) * ay;
        const qx = Math.round(x + bil(gxs)), qy = Math.round(y + bil(gys));
        if (qx < 0 || qy < 0 || qx >= W || qy >= W) continue;
        const a = (qy * W + qx) * 4, z = (y * W + x) * 4;
        dst.data[z] = src.data[a]; dst.data[z + 1] = src.data[a + 1]; dst.data[z + 2] = src.data[a + 2]; dst.data[z + 3] = src.data[a + 3];
      }
      tctx.putImageData(dst, 0, 0);
      // Tinte: dunkel und etwas blass, leicht unscharf
      ctx.globalAlpha = 0.65 + rnd() * 0.35; ctx.filter = 'blur(' + (rnd() * 1.2).toFixed(2) + 'px)';
      ctx.drawImage(tmp, 0, 0); ctx.globalAlpha = 1; ctx.filter = 'none';
      // Flecken und Krümel
      const flecken = Math.floor(rnd() * rnd() * 8);
      for (let k = 0; k < flecken; k++) { ctx.fillStyle = 'rgba(30,30,30,' + (0.4 + rnd() * 0.6) + ')'; ctx.beginPath(); ctx.arc(rnd() * W, rnd() * W, 0.5 + rnd() * 1.8, 0, 7); ctx.fill(); }
      // Rauschen
      const id = ctx.getImageData(0, 0, W, W), nstark = rnd() * 25;
      for (let k = 0; k < id.data.length; k += 4) { const n = (rnd() - 0.5) * nstark; id.data[k] += n; id.data[k + 1] += n; id.data[k + 2] += n; }
      ctx.putImageData(id, 0, 0);
      const a = fotoAufbereiten(ctx, 0, 0, W, W);
      if (!a) { i--; continue; }
      for (let k = 0; k < FOTO_N * FOTO_N; k++) X[i * FOTO_N * FOTO_N + k] = Math.round(a.daten[k] * 255);
      Y[i * 3] = ri; Y[i * 3 + 1] = si; Y[i * 3 + 2] = gi;
    }
    const b64 = (u) => { let s = ''; for (let k = 0; k < u.length; k += 32768) s += String.fromCharCode.apply(null, u.subarray(k, k + 32768)); return btoa(s); };
    return { x: b64(X), y: b64(Y) };
  }, { N, SEED, klassen, RAHMEN, GROESSE, STIL });
  fs.writeFileSync(OUT + '.x', Buffer.from(res.x, 'base64')); fs.writeFileSync(OUT + '.y', Buffer.from(res.y, 'base64'));
  await b.close();
})();
