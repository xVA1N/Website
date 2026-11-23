// Zeichnet eine Beispielskizze und prüft Namen (auch Verschieben mit Strich), Verschieben, Löschen, Rückgängig, Export und Speicher. Seite über python3 -m http.server 8765 starten, dann: node werkzeuge/skizze-test.js
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: false });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('http://localhost:8765/index.html#skizze'); await p.waitForTimeout(800);
  // Raster-Koordinaten (cm ab links unten) in Bildschirmpunkte
  const pos = async (cx, cy) => p.evaluate(([cx, cy]) => { const s = document.getElementById('sk-blatt'), pt = s.createSVGPoint(); pt.x = 22 + cx * 10; pt.y = 28 + 120 - cy * 10; const q = pt.matrixTransform(s.getScreenCTM()); return [q.x, q.y]; }, [cx, cy]);
  const tippe = async (cx, cy) => { await p.evaluate(() => { const r = document.getElementById('sk-blatt').getBoundingClientRect(); if (r.top < 0 || r.bottom > innerHeight) document.getElementById('sk-blatt').scrollIntoView({ block: 'center' }); }); const [x, y] = await pos(cx, cy); await p.mouse.click(x, y); await p.waitForTimeout(40); };
  const wz = async (a) => { await p.click(`button[data-sk-wz="${a}"]`); };
  const zeichne = async (a, pts) => { await wz(a); await p.evaluate(() => document.getElementById('sk-blatt').scrollIntoView({ block: 'center' })); for (const q of pts) await tippe(q[0], q[1]); await p.click('#sk-leiste-fertig'); };
  await p.click('input[name="sk-massstab"][value="10000"] + span');
  await zeichne('nadelwald', [[0.2, 0.2], [0.2, 4.5], [4, 5.5], [9, 4.8], [10.5, 3], [11.8, 0.2]]);
  await zeichne('laubwald', [[9.3, 11.8], [9.3, 10], [12, 9.6], [15.8, 10.3], [15.8, 11.8]]);
  await zeichne('mischwald', [[6.5, 11.8], [6.5, 9.4], [8.6, 9.2], [8.8, 11.8]]);
  await zeichne('ort', [[1.2, 8.8], [1.3, 7.4], [3.5, 6.8], [4.2, 8.2], [3.2, 9.2]]);
  await zeichne('strasse', [[0, 5], [5.5, 2], [11.5, 0]]);
  await zeichne('strasse', [[5.5, 2], [6, 5.8], [8, 7], [10.2, 11.8]]);
  await zeichne('strasse', [[0, 6], [5, 6], [8, 7], [16, 7.5]]);
  await zeichne('bahn', [[0, 8.4], [8, 7.9], [16, 7.6]]);
  await zeichne('fluss', [[14.5, 0], [14, 3], [15, 6], [14.3, 9]]);
  await zeichne('weg', [[1.6, 12], [1.6, 9.2]]);
  await zeichne('marsch', [[11.8, 0.9], [5.5, 2], [6, 5.8], [9.6, 10.2]]);
  await wz('kirche'); await tippe(2.4, 8); await wz('kirche');
  await wz('bruecke'); await tippe(14.2, 7.5); await wz('bruecke');
  await wz('baum'); await tippe(12.5, 5); await tippe(13, 4.4); await wz('baum');
  await wz('kuppe'); await tippe(12, 3.4); await wz('kuppe');
  await wz('text'); await p.fill('#sk-text', 'Südwald'); await tippe(6.5, 2.8); await p.fill('#sk-text', 'Schlierhof'); await tippe(3.5, 9.8); await p.fill('#sk-text', 'Nordwald'); await tippe(12.5, 9); await wz('text');
  await p.fill('#sk-unterschrift', 'Muster, HG'); await p.fill('#sk-erlaeuterung', 'Marschweg vom Südwald zum Nordwald, Übung.');
  // Ziehen: Nordpfeil verschieben
  await p.evaluate(() => document.getElementById('sk-blatt').scrollIntoView({ block: 'center' }));
  const n = await p.evaluate(() => SK.liste[0].elemente.find(e => e.art === 'nord').pts[0].slice());
  const [nx, ny] = await pos((n[0] - 22) / 10, (148 - n[1]) / 10); const [zx, zy] = await pos(15, 3);
  await p.mouse.move(nx, ny); await p.mouse.down(); await p.mouse.move(nx + 5, ny + 5, { steps: 3 }); await p.mouse.move(zx, zy, { steps: 8 }); await p.mouse.up(); await p.waitForTimeout(200);
  console.log('Nordpfeil vorher/nachher:', n, await p.evaluate(() => SK.liste[0].elemente.find(e => e.art === 'nord').pts[0]));
  console.log('Auswahl:', await p.textContent('#sk-auswahl-text'));
  // Marschweg auswählen (Klick auf Linie) und Info lesen
  const anz = await p.evaluate(() => SK.liste[0].elemente.length);
  if (await p.isVisible('#sk-auswahl-fertig')) await p.click('#sk-auswahl-fertig');
  await p.evaluate(() => document.getElementById('sk-blatt').scrollIntoView({ block: 'center' }));
  await p.screenshot({ path: 'sk-seite.png', fullPage: false });
  const blatt = await p.$('.sk-buehne'); await blatt.screenshot({ path: 'sk-blatt.png' });
  // Namen vergeben: Nadelwald, Ortschaft, Kuppe, Fluss
  for (const [cx, cy, name] of [[2, 3.6, 'Südwald'], [2.6, 7.6, 'Schlierhof'], [12, 3.4, 'Kahler Berg'], [11.3, 11.3, 'Nordwald']]) {
    await tippe(cx, cy); await p.fill('#sk-auswahl-eingabe', name); await p.click('#sk-auswahl-fertig');
  }
  // Namen der Ortschaft herausziehen (nach oben rechts), Strich prüfen
  { const box = await p.$eval('rect.sk-name[data-sk-name]', () => 0).catch(() => 0);
    const id = await p.evaluate(() => SK.liste[0].elemente.find(e => e.name === 'Schlierhof').id);
    const r = await p.$eval(`rect.sk-name[data-sk-name="${id}"]`, el => { const b = el.getBoundingClientRect(); return [b.x + b.width / 2, b.y + b.height / 2]; });
    const [zx, zy] = await pos(4.6, 10.3);
    await p.mouse.move(r[0], r[1]); await p.mouse.down(); await p.mouse.move(r[0] + 6, r[1] - 6, { steps: 3 }); await p.mouse.move(zx, zy, { steps: 8 }); await p.mouse.up(); await p.waitForTimeout(200);
    console.log('Versatz Schlierhof:', await p.evaluate(() => SK.liste[0].elemente.find(e => e.name === 'Schlierhof').nameVersatz)); }
  console.log('Namen:', await p.evaluate(() => SK.liste[0].elemente.filter(e => e.name).map(e => e.art + '=' + e.name).join(', ')));
  await p.evaluate(() => { SK.liste[0].elemente = SK.liste[0].elemente.filter(e => !(e.art === 'text' && /Südwald|Schlierhof|Nordwald/.test(e.text))); skSpeichern(); skRendern(); });
  // Löschen + Rückgängig
  await tippe(12.5, 5); console.log('gewählt:', await p.textContent('#sk-auswahl-text'));
  await p.click('#sk-auswahl-weg'); const nachWeg = await p.evaluate(() => SK.liste[0].elemente.length);
  await p.click('#sk-zurueck'); console.log('Elemente', anz, '→ gelöscht', nachWeg, '→ rückgängig', await p.evaluate(() => SK.liste[0].elemente.length));
  const dl = p.waitForEvent('download', { timeout: 10000 }); await p.click('#sk-png'); const d = await dl; await d.saveAs('sk-export.png'); console.log('Export:', d.suggestedFilename());
  await p.reload(); await p.waitForTimeout(600); console.log('nach Neuladen:', await p.evaluate(() => SK.liste[0].elemente.length));
  console.log('Fehler', errs); await b.close();
})();
