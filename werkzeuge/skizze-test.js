// Prüft die Skizzen: leere Ablage, neue Skizze über die Wahl der Art, Zeichnen, Blatt-Fenster (Name, Maßstab, Export), Ablage mit Vorschau, Umbenennen, Löschen, alte Skizzen ohne Art. Seite über python3 -m http.server 8765.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html#start'); await p.waitForTimeout(500);
  await p.screenshot({ path: 'r-start.png', fullPage: true });
  await p.goto('http://localhost:8765/index.html#skizze'); await p.waitForTimeout(500);
  console.log('leer-Hinweis:', await p.isVisible('#sk-leer'));
  await p.click('#sk-neu'); await p.waitForTimeout(200);
  await p.locator('#sk-arten').screenshot({ path: 'r-arten.png' });
  await p.click('[data-sk-art="gelaende"]'); await p.waitForTimeout(400);
  console.log('Editor offen:', await p.isVisible('#sk-voll'), '| Titel:', await p.textContent('#sk-v-titel'), '| Dock:', await p.$$eval('#sk-v-leiste .sk-v-wahl', x => x.map(b => b.textContent).join(', ')));
  const pos = async (cx, cy) => p.evaluate(([cx, cy]) => { const s = document.getElementById('sk-blatt'), pt = s.createSVGPoint(); pt.x = 22 + cx * 10; pt.y = 148 - cy * 10; const q = pt.matrixTransform(s.getScreenCTM()); return [q.x, q.y]; }, [cx, cy]);
  const tippe = async (cx, cy) => { const [x, y] = await pos(cx, cy); await p.mouse.click(x, y); await p.waitForTimeout(40); };
  await p.click('[data-v-fach="Flächen"]'); await p.click('[data-v-wz="laubwald"]'); for (const q of [[9, 11], [9, 8], [15, 8], [15, 11]]) await tippe(...q); await p.click('[data-v="fertig"]'); await p.fill('#sk-v-name', 'Nordwald'); await p.click('.sk-v-knoepfe [data-v="auswahlfertig"]');
  await p.click('[data-v-wz="marsch"]'); for (const q of [[2, 1], [6, 4], [10, 7]]) await tippe(...q); await p.click('[data-v="fertig"]'); await p.click('.sk-v-knoepfe [data-v="auswahlfertig"]');
  await p.click('#sk-v-blatt-auf'); await p.waitForTimeout(200);
  await p.screenshot({ path: 'r-blatt.png' });
  await p.fill('#sk-b-name', 'Weg zum Nordwald'); await p.click('input[name="sk-massstab"][value="10000"] + span'); await p.fill('#sk-unterschrift', 'Muster, HG');
  const dl = p.waitForEvent('download', { timeout: 8000 }).catch(() => null); await p.click('#sk-png'); const d = await dl; console.log('Export:', d && d.suggestedFilename());
  await p.click('#sk-v-blatt-fertig');
  console.log('Titel nach Blatt:', await p.textContent('#sk-v-titel'));
  await p.screenshot({ path: 'r-editor.png' });
  await p.click('#sk-v-zu'); await p.waitForTimeout(300);
  console.log('Liste:', await p.$$eval('.sk-eintrag-text', x => x.map(t => t.innerText.replace(/\n/g, ' / ')).join(' || ')));
  await p.locator('#sk-ablage').screenshot({ path: 'r-ablage.png' });
  await p.click('[data-sk-name]'); await p.fill('.inline-abfrage input', 'Übungsweg'); await p.keyboard.press('Enter');
  console.log('umbenannt:', await p.$$eval('.sk-eintrag-text b', x => x.map(t => t.textContent).join(', ')));
  await p.click('[data-sk-auf]'); await p.waitForTimeout(300); console.log('wieder offen, Elemente:', await p.evaluate(() => skAktiv().elemente.length)); await p.click('#sk-v-zu');
  await p.click('[data-sk-weg]'); await p.click('.inline-abfrage [data-ok]'); console.log('nach Löschen:', await p.evaluate(() => SK.liste.length), '| leer-Hinweis:', await p.isVisible('#sk-leer'));
  // alte Daten ohne Art
  await p.evaluate(() => { localStorage.setItem('meinkamerad-skizzen', JSON.stringify({ aktiv: 's1', liste: [{ id: 's1', name: 'Alte Skizze', massstab: 25000, zaehlung: 'teil', datum: '2026-11-20', elemente: [{ id: 'e1', art: 'strasse', pts: [[30, 60], [120, 100]] }] }] })); });
  await p.reload(); await p.waitForTimeout(500);
  console.log('alte Skizze:', await p.$$eval('.sk-eintrag-text', x => x.map(t => t.innerText.replace(/\n/g, ' / ')).join(' || ')));
  await p.click('[data-sk-auf]'); await p.waitForTimeout(300); console.log('Dock alte:', await p.$$eval('#sk-v-leiste .sk-v-wahl', x => x.length));
  console.log('Fehler', errs); await b.close();
})();
