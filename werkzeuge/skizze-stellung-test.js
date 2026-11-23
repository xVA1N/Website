// Prüft die Stellungsskizze im Querformat: Gelände, NATO-Zeichen (auch Feind), Feuerbereich, Hauptschussrichtung, Zielpunkte, Sperren, Export. Seite über python3 -m http.server 8765.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2 }); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('http://localhost:8765/index.html#skizze'); await p.waitForTimeout(500);
  await p.click('#sk-neu'); await p.locator('#sk-arten').screenshot({ path: 's-arten.png' });
  await p.click('[data-sk-art="stellung"]'); await p.waitForFunction(() => window.ms); await p.waitForTimeout(300);
  console.log('Titel:', await p.textContent('#sk-v-titel'), '| Dock:', await p.$$eval('#sk-v-leiste .sk-v-wahl', x => x.map(b => b.textContent).join(', ')));
  const pos = async (cx, cy) => p.evaluate(([cx, cy]) => { const s = document.getElementById('sk-blatt'), pt = s.createSVGPoint(); pt.x = 22 + cx * 10; pt.y = 148 - cy * 10; const q = pt.matrixTransform(s.getScreenCTM()); return [q.x, q.y]; }, [cx, cy]);
  const tippe = async (cx, cy) => { const [x, y] = await pos(cx, cy); await p.mouse.click(x, y); await p.waitForTimeout(40); };
  const wz = async (fach, w) => { if (fach) await p.click(`[data-v-fach="${fach}"]`); await p.click(`[data-v-wz="${w}"]`); };
  const fertig = async () => { if (await p.$('.sk-v-knoepfe [data-v="fertig"]')) await p.click('.sk-v-knoepfe [data-v="fertig"]'); };
  const zu = async () => { if (await p.$('.sk-v-knoepfe [data-v="auswahlfertig"]')) await p.click('.sk-v-knoepfe [data-v="auswahlfertig"]'); };
  // Gelände
  await wz('Gelände', 'nadelwald'); for (const q of [[0.3, 0.3], [0.3, 3.5], [5, 4], [7, 2], [6.5, 0.3]]) await tippe(...q); await fertig(); await p.fill('#sk-v-name', 'Südwald'); await zu();
  await wz('Gelände', 'strasse'); for (const q of [[0, 5.5], [8, 6], [16, 5]]) await tippe(...q); await fertig(); await zu();
  await p.screenshot({ path: 's-fach.png' });
  await wz('Stellung', 'gruppe'); await tippe(8, 3.5); await p.click('[data-v="abbrechen"]');
  await wz('Stellung', 'schuetze'); for (const q of [[5, 4.5], [6.5, 4.7], [9.5, 4.7], [11, 4.5]]) await tippe(...q); await p.click('[data-v="abbrechen"]');
  await wz('Stellung', 'mg'); await tippe(8, 5); await p.click('[data-v="abbrechen"]');
  await wz('Stellung', 'pzf'); await tippe(12.5, 4.2); await p.click('[data-v="abbrechen"]');
  await wz('Stellung', 'beob'); await tippe(13.5, 8.5); await p.click('[data-v="abbrechen"]');
  await wz('Stellung', 'gruppe'); await tippe(8, 10.8); await p.click('[data-v="abbrechen"]');
  // Feind setzen
  await tippe(8, 10.8); await p.click('[data-v="feind"]'); await zu();
  // Feuer
  await wz('Feuer', 'feuer'); for (const q of [[8, 5], [3, 11], [13, 11]]) await tippe(...q); await zu();
  await wz('Feuer', 'hsr'); for (const q of [[8, 5.6], [8, 9.5]]) await tippe(...q); await zu();
  await wz('Feuer', 'ziel'); for (const q of [[8, 5], [4, 9]]) await tippe(...q); await p.fill('#sk-v-name', 'Spitzbaum'); await zu();
  await wz('Feuer', 'ziel'); for (const q of [[8, 5], [12.5, 9.8]]) await tippe(...q); await p.fill('#sk-v-name', 'Hecke'); await zu();
  // Sperren
  await wz('Sperren', 'draht'); for (const q of [[3, 7], [8, 7.6], [13, 7]]) await tippe(...q); await fertig(); await zu();
  await wz('Sperren', 'minen'); for (const q of [[9, 8.2], [11, 8.2], [11, 9], [9, 9]]) await tippe(...q); await fertig(); await zu();
  await wz('Sperren', 'graben'); for (const q of [[5, 4], [8, 4.2], [11, 4]]) await tippe(...q); await fertig(); await zu();
  await p.click('#sk-v-einpassen'); await p.waitForTimeout(200);
  await p.screenshot({ path: 's-editor.png' });
  console.log('Elemente:', await p.evaluate(() => skAktiv().elemente.map(e => e.art + (e.feind ? '(Feind)' : '') + (e.name ? '=' + e.name : '')).join(', ')));
  await p.click('#sk-v-blatt-auf'); await p.click('input[name="sk-massstab"][value="10000"] + span');
  const dl = p.waitForEvent('download', { timeout: 8000 }).catch(() => null); await p.click('#sk-png'); const d = await dl; if (d) await d.saveAs('s-export.png'); console.log('Export:', d && d.suggestedFilename());
  await p.click('#sk-v-blatt-fertig'); await p.click('#sk-v-zu'); await p.waitForTimeout(300);
  await p.locator('#sk-ablage').screenshot({ path: 's-ablage.png' });
  console.log('Fehler', errs); await b.close();
})();
