// Prüft die Art der Größenangabe an der Form (Punkte, Striche, Kreuze) auf den 300 Test-Fotos aus fotos.js. Seite über python3 -m http.server 8765, Test-Fotos unter ./ki erreichbar.
const { chromium } = require('playwright'); const fs = require('fs'); const K = process.argv[2];
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('http://localhost:8765/index.html#symbole'); await p.waitForTimeout(1500); await p.evaluate(() => fotoLaden());
  const meta = JSON.parse(fs.readFileSync(K + '/fotos.json', 'utf8')).slice(0, 300);
  const st = {};
  for (const m of meta) {
    const r = await p.evaluate(async ([src, A]) => {
      const img = new Image(); img.src = src; await img.decode();
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0);
      const f = img.width / 640, X = Math.round(A[0]*f), Y = Math.round(A[1]*f), bb = Math.round((A[2]-A[0])*f), h = Math.round((A[3]-A[1])*f);
      const auf = fotoAufbereiten(ctx, X, Y, bb, h); return auf ? auf.groesse : 'null';
    }, ['http://localhost:8765/ki/' + m.datei, m.aus]);
    const ok = !r || r === 'null' || r.includes(m.groesse); st[ok] = (st[ok] || 0) + 1;
    if (!ok) console.log('falsch', m.datei, m.groesse, r);
  }
  console.log(JSON.stringify(st)); await b.close();
})();
