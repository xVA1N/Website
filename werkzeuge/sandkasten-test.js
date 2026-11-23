// Prüft den Geländesandkasten: anlegen, formen, Wald, Straße, Zeichen, Pfeil, Beobachter, Rückgängig, Speichern. Seite über python3 -m http.server 8765.
const { chromium } = require('playwright');
const aus = process.argv[2] || '.';
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 }); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('http://localhost:8765/#sandkasten'); await p.waitForTimeout(400);
  await p.evaluate(() => localStorage.removeItem('meinkamerad-sandkasten')); await p.reload(); await p.waitForTimeout(400);
  await p.click('#sbx-neu'); await p.click('[data-sbx-art="frei"]');
  await p.waitForSelector('#sbx-voll:not([hidden])'); await p.waitForTimeout(800);
  const wz = async (fach, w) => { if (!(await p.isVisible(`[data-sbx-wz="${w}"]`))) await p.click(`[data-sbx-fach="${fach}"]`); await p.click(`[data-sbx-wz="${w}"]`); };
  const fertig = async () => p.click('[data-sbx-fertig]');
  const wisch = async (pts, halten = 0) => { await p.mouse.move(pts[0][0], pts[0][1]); await p.mouse.down(); for (const q of pts.slice(1)) { await p.mouse.move(q[0], q[1], { steps: 6 }); await p.waitForTimeout(40); } if (halten) await p.waitForTimeout(halten); await p.mouse.up(); await p.waitForTimeout(150); };
  // Hügel
  await wz(0, 'huegel'); await p.check('input[name="sbx-pinsel"][value="gross"]', { force: true });
  await wisch([[200, 330], [210, 340], [190, 335]], 1500);
  await wisch([[120, 420], [130, 425]], 900);
  await fertig();
  // Wald, Wasser, Ort
  await wz(1, 'wald'); await wisch([[240, 440], [300, 470], [320, 430], [260, 410]]); await fertig();
  await wz(1, 'wasser'); await p.check('input[name="sbx-pinsel"][value="mittel"]', { force: true }); await wisch([[110, 520], [140, 530]]); await fertig();
  await wz(1, 'ort'); await wisch([[160, 470], [190, 480], [175, 500]]); await fertig();
  await wz(1, 'strasse'); await wisch([[60, 480], [150, 440], [250, 380], [340, 330]]); await fertig();
  // Zeichen und Pfeile
  await wz(2, 'zeichen'); await p.waitForTimeout(300); await p.click('[data-sbx-z="1"]'); await p.mouse.click(150, 430); await p.waitForTimeout(200); console.log('nach erstem Zeichen:', await p.evaluate(() => sbxAkt.zeichen.length));
  await p.click('input[name="sbx-feind"][value="1"]', { force: true }); await p.click('[data-sbx-z="0"]'); await p.mouse.click(280, 360); await p.waitForTimeout(200); console.log('nach zweitem Zeichen:', await p.evaluate(() => sbxAkt.zeichen.length)); await fertig();
  await wz(2, 'pfeil_eigen'); await wisch([[150, 520], [200, 460], [250, 400]]); console.log('nach Pfeil:', await p.evaluate(() => sbxAkt.zeichen.length)); await fertig();
  await p.screenshot({ path: aus + '/sbx-lage.png' });
  // Beobachter
  await wz(3, "beob"); await p.mouse.click(150, 300); await p.waitForTimeout(400);
  const meldung = await p.textContent('#sbx-meldung');
  await p.screenshot({ path: aus + '/sbx-sicht.png' });
  await fertig();
  const st = await p.evaluate(() => ({ z: sbxAkt.zeichen.length, l: sbxAkt.linien.map(l => l.art), beob: !!sbxAkt.beob, hmax: Math.max(...sbxH), wald: sbxF.filter(x => x === 1).length, ort: sbxF.filter(x => x === 3).length, baeume: sbxT.baeume.count, haeuser: sbxT.haeuser.count }));
  console.log('Stand:', JSON.stringify(st), '|', meldung);
  // Rückgängig nimmt den Beobachter zurück
  await p.click('#sbx-zurueck'); await p.waitForTimeout(200);
  console.log('nach Rückgängig Beobachter:', await p.evaluate(() => !!sbxAkt.beob));
  // Von oben
  await p.click('#sbx-ansicht'); await p.waitForTimeout(300); await p.screenshot({ path: aus + '/sbx-oben.png' });
  // Schließen, Ablage, wieder öffnen
  await p.click('#sbx-zu'); await p.waitForTimeout(300);
  console.log('Ablage:', await p.textContent('#sbx-liste .sk-eintrag-text'));
  await p.screenshot({ path: aus + '/sbx-ablage.png' });
  await p.reload(); await p.waitForTimeout(400); await p.click('[data-sbx-auf]'); await p.waitForSelector('#sbx-voll:not([hidden])'); await p.waitForTimeout(600);
  console.log('nach Neuladen:', JSON.stringify(await p.evaluate(() => ({ z: sbxAkt.zeichen.length, l: sbxAkt.linien.length, hmax: Math.round(Math.max(...sbxH)) }))));
  console.log('Fehler', errs);
  await b.close();
})();
