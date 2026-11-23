// Legt eine Musterskizze mit allen zusätzlichen Gelände-Zeichen, Linien und Flächen an und speichert sie als Bild. Seite über python3 -m http.server 8765.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html#skizze'); await p.waitForTimeout(500);
  await p.evaluate(() => {
    const X = (cx) => 22 + cx * 10, Y = (cy) => 148 - cy * 10, el = [];
    const pz = ['gehoeft', 'friedhof', 'wegkreuz', 'turm', 'sendemast', 'windrad', 'hochsitz', 'strommast', 'fabrik', 'gebuesch', 'bruecke', 'bruecke_ansicht', 'kirche', 'gebaeude', 'kuppe', 'tp'];
    pz.forEach((a, i) => el.push({ id: 'p' + i, art: a, pts: [[X(1.5 + (i % 8) * 1.9), Y(i < 8 ? 10.5 : 8)]], winkel: 0, name: SK_ART[a].name }));
    el.push({ id: 'l1', art: 'boeschung', pts: [[X(0.5), Y(5.5)], [X(5), Y(6)], [X(9), Y(5.3)]], name: 'Böschung' });
    el.push({ id: 'l2', art: 'strom', pts: [[X(0.5), Y(4)], [X(15.5), Y(4.5)]], name: '' });
    el.push({ id: 'l3', art: 'zaun', pts: [[X(10), Y(6)], [X(15.5), Y(6)]], name: 'Zaun' });
    el.push({ id: 'f1', art: 'see', pts: [[X(1), Y(2.8)], [X(4), Y(3.3)], [X(5.5), Y(1.8)], [X(3.5), Y(0.5)], [X(1.2), Y(1)]], name: 'Teich' });
    el.push({ id: 'f2', art: 'sumpf', pts: [[X(7), Y(3)], [X(11), Y(3.2)], [X(11.5), Y(0.6)], [X(7.2), Y(0.6)]], name: 'Sumpf' });
    const s = skNeu('Zeichen-Katalog', 'gelaende'); s.elemente = el; SK.liste.unshift(s); skSpeichern(); skOeffnen(s.id);
  });
  await p.waitForTimeout(300);
  await p.click('#sk-v-blatt-auf');
  const dl = p.waitForEvent('download', { timeout: 8000 }).catch(() => null); await p.click('#sk-png'); const d = await dl; if (d) await d.saveAs('katalog.png');
  await p.click('#sk-v-blatt-fertig'); await p.click('[data-v-fach="Zeichen"]'); await p.waitForTimeout(150); await p.screenshot({ path: 'katalog-fach.png' });
  console.log('Fehler', errs); await b.close();
})();
