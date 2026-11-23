const { chromium } = require('playwright'); const fs = require('fs'); const K = process.argv[2], N = +(process.argv[3] || 100);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 420, height: 1100 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('http://localhost:8765/index.html#symbole'); await p.waitForTimeout(1200);
  await p.click('#foto-panel > summary');
  const meta = JSON.parse(fs.readFileSync(K + '/tfotos.json', 'utf8')).slice(0, N);
  const norm = s => String(s).toLowerCase().replace(/\s+/g, '');
  let sym = 0, t = 0, m = 0, beide = 0, zeit = 0, erst = 0; const bsp = [];
  for (const [i, x] of meta.entries()) {
    await p.setInputFiles('#foto-datei', K + '/' + x.datei);
    await p.waitForFunction(() => !document.getElementById('foto-bereich').hidden && window.fotoBild, null, { timeout: 15000 });
    await p.evaluate((a) => { const f = fotoBild.width / 640; fotoAuswahl = { x0: a[0] * f, y0: a[1] * f, x1: a[2] * f, y1: a[3] * f }; fotoZeichnen(); }, x.aus);
    const t0 = Date.now(); await p.click('#foto-erkennen');
    try { await p.waitForFunction(() => { const a = document.getElementById('foto-t'), b = document.getElementById('foto-m'); const fertig = e => !e || e.value || /nicht|keine/.test(e.placeholder); return fertig(a) && fertig(b); }, null, { timeout: 60000 }); } catch (e) { bsp.push(x.datei + ' Zeitüberschreitung'); }
    const dt = Date.now() - t0; if (i === 0) erst = dt; else zeit += dt;
    const r = await p.evaluate(() => ({ t: (document.getElementById('foto-t') || {}).value || '', m: (document.getElementById('foto-m') || {}).value || '', s: (document.querySelector('#foto-ergebnis button[data-foto-sidc]') || { getAttribute: () => '' }).getAttribute('data-foto-sidc') }));
    const okS = r.s.substr(10, 6) === x.symbol, okT = norm(r.t) === norm(x.t), okM = norm(r.m) === norm(x.mm);
    sym += okS; t += okT; m += okM; beide += okT && okM;
    if ((!okT || !okM) && bsp.length < 15) bsp.push(`${x.datei}: „${x.t}“→„${r.t}“ · „${x.mm}“→„${r.m}“`);
  }
  const n = meta.length, pz = v => (100 * v / n).toFixed(0) + ' %';
  console.log(`Fotos ${n} | Symbol ${pz(sym)} | links (T) ${pz(t)} | rechts (M) ${pz(m)} | beide Texte ${pz(beide)} | erste Erkennung ${erst} ms, danach je ${Math.round(zeit / Math.max(1, n - 1))} ms`);
  console.log(bsp.join('\n')); console.log('Fehler', errs.slice(0, 5)); await b.close();
})();
