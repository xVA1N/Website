const { chromium } = require('playwright'); const fs = require('fs'); const K = process.argv[2];
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('file:///home/user/Website/index.html'); await p.addScriptTag({ path: '/home/user/Website/js/foto-kern.js' });
  const b64 = fs.readFileSync(K + '/echt1.png').toString('base64');
  const r = await p.evaluate(async (b64) => {
    const im = new Image(); await new Promise(r => { im.onload = r; im.src = 'data:image/png;base64,' + b64; });
    const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(im, 0, 0);
    const a = [162, 262, 748, 545];
    const g = fotoGrau(x, a[0], a[1], a[2], a[3]), m = fotoTinte(g, a[2], a[3]), teile = fotoTeile(m, a[2], a[3]), tr = fotoTexteTrennen(teile, a[2]);
    const auf = fotoAufbereiten(x, a[0], a[1], a[2], a[3]);
    const t = tr.staerke; let info = null;
    if (t) { const b = a[2], w = t.x1 - t.x0 + 1, h = t.y1 - t.y0 + 1, cx = (t.x0 + t.x1) / 2, cy = (t.y0 + t.y1) / 2; let xs = [], ys = [], ecken = 0;
      t.pixel.forEach(q => { const X = q % b, Y = (q - X) / b; if (Math.abs(Y - cy) < h * 0.18) xs.push(X); if (Math.abs(X - cx) < w * 0.18) ys.push(Y); if (Math.abs(X - cx) > w * 0.3 && Math.abs(Y - cy) > h * 0.3) ecken++; });
      info = { w, h, xs: xs.length ? Math.max(...xs) - Math.min(...xs) + 1 : 0, ys: ys.length ? Math.max(...ys) - Math.min(...ys) + 1 : 0, ecken, n: t.pixel.length }; }
    return { info, st: auf.staerke, teile: teile.map(t => [t.x0, t.y0, t.x1, t.y1, t.pixel.length]), zeichen: tr.zeichen, links: tr.links.length, rechts: tr.rechts.length, d: Array.from(auf.daten).map(v => Math.round(v * 255)) };
  }, b64);
  console.log(JSON.stringify({ info: r.info, staerke: r.st, teile: r.teile, zeichen: r.zeichen, links: r.links, rechts: r.rechts }));
  fs.writeFileSync(K + '/sicht.json', JSON.stringify([r.d])); await b.close();
})();
