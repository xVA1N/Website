// Prüft das Vollbild der Skizzen im Hoch- und Querformat: Dock, Fläche mit Namen, Marschweg, Text, Zoomen mit zwei Fingern. Seite über python3 -m http.server 8765.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = [];
  for (const [w, h, name] of [[390, 844, 'hoch'], [844, 390, 'quer']]) {
    const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
    p.on('pageerror', e => errs.push(e.message));
    await p.goto('http://localhost:8765/index.html#skizze'); await p.waitForTimeout(600);
    await p.click('#sk-vollbild'); await p.waitForTimeout(300);
    await p.screenshot({ path: 'v2-' + name + '-start.png' });
    const pos = async (cx, cy) => p.evaluate(([cx, cy]) => { const s = document.getElementById('sk-blatt'), pt = s.createSVGPoint(); pt.x = 22 + cx * 10; pt.y = 148 - cy * 10; const q = pt.matrixTransform(s.getScreenCTM()); return [q.x, q.y]; }, [cx, cy]);
    const tippe = async (cx, cy) => { const [x, y] = await pos(cx, cy); await p.mouse.click(x, y); await p.waitForTimeout(40); };
    // Fläche über das Dock
    await p.click('[data-v-fach="Flächen"]'); await p.waitForTimeout(100);
    await p.screenshot({ path: 'v2-' + name + '-fach.png' });
    await p.click('[data-v-wz="nadelwald"]');
    for (const q of [[1, 6], [1, 9], [5, 10], [6, 7], [3, 5.5]]) await tippe(...q);
    await p.screenshot({ path: 'v2-' + name + '-zeichnen.png' });
    await p.click('[data-v="fertig"]'); await p.waitForTimeout(100);
    await p.fill('#sk-v-name', 'Südwald'); await p.waitForTimeout(100);
    await p.screenshot({ path: 'v2-' + name + '-auswahl.png' });
    await p.click('.sk-v-knoepfe [data-v="auswahlfertig"]');
    // Marschweg
    await p.click('[data-v-wz="marsch"]'); for (const q of [[12, 1], [9, 4], [11, 9]]) await tippe(...q); await p.click('[data-v="fertig"]'); await p.click('.sk-v-knoepfe [data-v="auswahlfertig"]');
    // Text
    await p.click('[data-v-fach="Zeichen"]'); await p.click('[data-v-wz="text"]'); await tippe(8, 11); await p.keyboard.type('Nordwald'); await p.keyboard.press('Enter');
    // Pinch: zwei Finger auseinander
    const vorher = await p.evaluate(() => skAnsicht.w);
    await p.evaluate(() => {
      const s = document.getElementById('sk-blatt'), r = s.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const ev = (t, id, x, y) => s.dispatchEvent(new PointerEvent(t, { pointerId: id, clientX: x, clientY: y, bubbles: true, pointerType: 'touch', isPrimary: id === 11 }));
      ev('pointerdown', 11, cx - 20, cy); ev('pointerdown', 12, cx + 20, cy);
      for (let i = 1; i <= 5; i++) { ev('pointermove', 11, cx - 20 - i * 16, cy); ev('pointermove', 12, cx + 20 + i * 16, cy); }
      ev('pointerup', 11, cx - 100, cy); ev('pointerup', 12, cx + 100, cy);
    });
    const nachher = await p.evaluate(() => skAnsicht.w);
    await p.screenshot({ path: 'v2-' + name + '-zoom.png' });
    const n = await p.evaluate(() => SK.liste[0].elemente.map(e => e.art + (e.name ? '=' + e.name : '') + (e.text ? '=' + e.text : '')).join(', '));
    await p.click('#sk-v-einpassen'); await p.click('#sk-v-zu');
    console.log(name, '| Breite Ausschnitt', Math.round(vorher), '→', Math.round(nachher), '|', n, '| zu:', await p.isHidden('#sk-voll'));
    await p.evaluate(() => localStorage.clear()); await p.close();
  }
  console.log('Fehler', errs); await b.close();
})();
