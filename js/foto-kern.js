/* MeinKamerad – Fotoerkennung, Kern: Bildaufbereitung und Erkennungsnetz. Läuft vollständig im Browser, das Foto verlässt das Gerät nicht.
   Wird nur auf der Seite Taktische Zeichen geladen. Dieselbe Aufbereitung wird beim Erzeugen der Trainingsbilder verwendet. */
'use strict';

var FOTO_N = 64;

// Graustufen eines Ausschnitts (x, y, b, h) eines Canvas
function fotoGrau(ctx, x, y, b, h) {
  var d = ctx.getImageData(x, y, b, h).data, g = new Float32Array(b * h);
  for (var i = 0, j = 0; i < g.length; i++, j += 4) g[i] = 0.299 * d[j] + 0.587 * d[j + 1] + 0.114 * d[j + 2];
  return g;
}
// Tinte erkennen: Pixel deutlich dunkler als ihre Umgebung (gleicht Schatten und ungleichmäßiges Licht aus)
function fotoTinte(g, b, h) {
  var r = Math.max(6, Math.round(Math.min(b, h) / 14)), sum = new Float64Array((b + 1) * (h + 1)), m = new Uint8Array(b * h);
  for (var y = 0; y < h; y++) {
    var zeile = 0;
    for (var x = 0; x < b; x++) { zeile += g[y * b + x]; sum[(y + 1) * (b + 1) + x + 1] = sum[y * (b + 1) + x + 1] + zeile; }
  }
  for (y = 0; y < h; y++) {
    var y0 = Math.max(0, y - r), y1 = Math.min(h, y + r + 1);
    for (x = 0; x < b; x++) {
      var x0 = Math.max(0, x - r), x1 = Math.min(b, x + r + 1), n = (y1 - y0) * (x1 - x0);
      var mittel = (sum[y1 * (b + 1) + x1] - sum[y0 * (b + 1) + x1] - sum[y1 * (b + 1) + x0] + sum[y0 * (b + 1) + x0]) / n;
      m[y * b + x] = g[y * b + x] < mittel - 12 && g[y * b + x] < 210 ? 1 : 0;
    }
  }
  return m;
}
// Rahmen um die Zeichnung: Zeilen und Spalten mit nennenswert Tinte, kleine Flecken am Rand zählen nicht
function fotoBox(m, b, h) {
  var zs = new Uint32Array(h), ss = new Uint32Array(b), ges = 0;
  for (var y = 0; y < h; y++) for (var x = 0; x < b; x++) if (m[y * b + x]) { zs[y]++; ss[x]++; ges++; }
  if (ges < 20) return null;
  var grenze = function (arr) {
    var summe = 0, lo = 0, hi = arr.length - 1, rand = ges * 0.004;
    for (lo = 0; lo < arr.length; lo++) { summe += arr[lo]; if (summe > rand) break; }
    summe = 0;
    for (hi = arr.length - 1; hi >= 0; hi--) { summe += arr[hi]; if (summe > rand) break; }
    return [lo, hi];
  };
  var gy = grenze(zs), gx = grenze(ss);
  return { x0: gx[0], x1: gx[1], y0: gy[0], y1: gy[1] };
}
// Ausschnitt quadratisch mit Rand auf FOTO_N × FOTO_N verkleinern (Tintenanteil je Zelle, 0 bis 1)
function fotoRaster(m, b, h, box) {
  var w = box.x1 - box.x0 + 1, hh = box.y1 - box.y0 + 1, s = Math.max(w, hh) * 1.12;
  var cx = (box.x0 + box.x1) / 2, cy = (box.y0 + box.y1) / 2, ox = cx - s / 2, oy = cy - s / 2;
  var out = new Float32Array(FOTO_N * FOTO_N), z = s / FOTO_N;
  for (var j = 0; j < FOTO_N; j++) {
    for (var i = 0; i < FOTO_N; i++) {
      var xa = ox + i * z, ya = oy + j * z, xs = Math.max(0, Math.floor(xa)), xe = Math.min(b, Math.ceil(xa + z)), ys = Math.max(0, Math.floor(ya)), ye = Math.min(h, Math.ceil(ya + z));
      var t = 0, n = 0;
      for (var y = ys; y < ye; y++) for (var x = xs; x < xe; x++) { t += m[y * b + x]; n++; }
      out[j * FOTO_N + i] = n ? Math.min(1, t / n * 1.6) : 0;
    }
  }
  return out;
}
// Zusammenhängende Tintenflächen finden. Flächen, die den Rand des Ausschnitts berühren (Papierkanten, Tischrand, Schatten),
// und winzige Flecken werden entfernt. Ein sauber eingerahmtes Zeichen berührt den Rand nicht.
function fotoTeile(m, b, h) {
  var lab = new Int32Array(b * h), stapel = new Int32Array(b * h), teile = [], minFlaeche = Math.max(4, b * h * 0.00008);
  for (var start = 0; start < b * h; start++) {
    if (!m[start] || lab[start]) continue;
    var oben = 0, rand = false, pixel = [], x0 = b, y0 = h, x1 = 0, y1 = 0;
    stapel[oben++] = start; lab[start] = 1;
    while (oben) {
      var q = stapel[--oben], qx = q % b, qy = (q - qx) / b;
      pixel.push(q);
      if (qx < x0) x0 = qx; if (qx > x1) x1 = qx; if (qy < y0) y0 = qy; if (qy > y1) y1 = qy;
      if (qx === 0 || qy === 0 || qx === b - 1 || qy === h - 1) rand = true;
      for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
        var nx = qx + dx, ny = qy + dy;
        if (nx < 0 || ny < 0 || nx >= b || ny >= h) continue;
        var z = ny * b + nx;
        if (m[z] && !lab[z]) { lab[z] = 1; stapel[oben++] = z; }
      }
    }
    if (rand || pixel.length < minFlaeche) { for (var k = 0; k < pixel.length; k++) m[pixel[k]] = 0; continue; }
    teile.push({ x0: x0, y0: y0, x1: x1, y1: y1, pixel: pixel });
  }
  return teile;
}
// Zeichen und Beschriftung trennen: die großen Linien bilden das Zeichen. Seine linke und rechte Kante wird über die Strichdichte
// bestimmt, damit überstehende Einzelstriche nicht mitzählen. Kleinere Teile mit der Mitte links oder rechts davon (auf Höhe des Rahmens)
// sind Text links (Bezeichnung, Feld T) und rechts (übergeordnete Einheit, Feld M). Ein kleines Teil oben rechts ist die Stärke (F, + oder −).
function fotoTexteTrennen(teile, b) {
  var leer = { zeichen: null, links: [], rechts: [], staerke: null };
  if (!teile.length) return leer;
  var gross = 0;
  teile.forEach(function (t) { gross = Math.max(gross, t.x1 - t.x0, t.y1 - t.y0); });
  var grosse = teile.filter(function (t) { return Math.max(t.x1 - t.x0, t.y1 - t.y0) >= gross * 0.45; });
  var z = fotoUmriss(grosse);
  // Spaltendichte der großen Teile, Ränder mit weniger als der Hälfte der typischen Dichte abschneiden
  var sp = new Uint32Array(z.x1 - z.x0 + 1);
  grosse.forEach(function (t) { t.pixel.forEach(function (q) { sp[(q % b) - z.x0]++; }); });
  var werte = Array.prototype.slice.call(sp).filter(function (v) { return v > 0; }).sort(function (a, c) { return a - c; });
  var median = werte[Math.floor(werte.length / 2)] || 0, lo = 0, hi = sp.length - 1;
  while (lo < hi && sp[lo] < median * 0.5) lo++;
  while (hi > lo && sp[hi] < median * 0.5) hi--;
  var k = { x0: z.x0 + lo, x1: z.x0 + hi, y0: z.y0, y1: z.y1 };
  var zb = k.x1 - k.x0, zh = k.y1 - k.y0, links = [], rechts = [], staerke = null;
  teile.forEach(function (t) {
    if (grosse.indexOf(t) >= 0) return;
    var cx = (t.x0 + t.x1) / 2, cy = (t.y0 + t.y1) / 2;
    if (cy < k.y0 + zh * 0.15 && cx > k.x1 - zb * 0.05 && cy > k.y0 - zh * 0.8) {
      // Nicht Teil einer Reihe von Größenzeichen (X, I, Punkte) auf gleicher Höhe
      var th = t.y1 - t.y0 + 1, reihe = teile.some(function (u) {
        var uh = u.y1 - u.y0 + 1;
        return u !== t && grosse.indexOf(u) < 0 && u.x1 < t.x0 && t.x0 - u.x1 < th * 0.9 && uh > th * 0.6 && uh < th * 1.6 && Math.abs((u.y0 + u.y1) / 2 - cy) < th * 0.4;
      });
      if (!reihe && !staerke) { staerke = t; return; }
    }
    if (cy < k.y0 + zh * 0.1 || cy > k.y1 + zh * 0.4) return;
    if (cx < k.x0) links.push(t);
    else if (cx > k.x1) rechts.push(t);
  });
  return { zeichen: k, links: fotoTextKette(links, k, -1), rechts: fotoTextKette(rechts, k, 1), staerke: staerke };
}
// Text als Kette vom Rahmen nach außen: Schriftzeichen (mindestens halb so hoch wie das höchste Teil auf dieser Seite) gehören dazu, wenn sie dicht
// am Rahmen oder am vorigen Zeichen stehen. Kleine Teile (Punkte, Striche) nur innerhalb dieser Zeile. Alles andere sind Flecken,
// Maserung oder Schmutz und wird verworfen.
function fotoTextKette(teile, k, seite) {
  var zh = k.y1 - k.y0, grenze = seite < 0 ? k.x0 : k.x1, abstand = function (t) { return seite < 0 ? grenze - t.x1 : t.x0 - grenze; };
  var hmax = 0;
  teile.forEach(function (t) { hmax = Math.max(hmax, t.y1 - t.y0 + 1); });
  var gross = teile.filter(function (t) { var th = t.y1 - t.y0 + 1; return th >= zh * 0.1 && th >= hmax * 0.5; }).sort(function (a, c) { return seite < 0 ? c.x1 - a.x1 : a.x0 - c.x0; });
  var kette = [], y0 = Infinity, y1 = -Infinity;
  for (var i = 0; i < gross.length; i++) {
    var t = gross[i];
    if (abstand(t) > zh * (kette.length ? 0.6 : 0.8)) break;
    kette.push(t); grenze = seite < 0 ? Math.min(grenze, t.x0) : Math.max(grenze, t.x1);
    y0 = Math.min(y0, t.y0); y1 = Math.max(y1, t.y1);
  }
  if (!kette.length) return [];
  var aussen = grenze, innen = seite < 0 ? k.x0 : k.x1;
  teile.forEach(function (t) {
    if (kette.indexOf(t) >= 0) return;
    var cx = (t.x0 + t.x1) / 2, cy = (t.y0 + t.y1) / 2;
    var drin = seite < 0 ? cx > aussen - zh * 0.3 && cx < innen : cx < aussen + zh * 0.3 && cx > innen;
    if (drin && cy >= y0 && cy <= y1) kette.push(t);
  });
  return kette;
}
// Form der Stärke-Angabe: waagerechter Strich (−) oder Kreuz (+)
function fotoStaerke(t, b) {
  var w = t.x1 - t.x0 + 1, h = t.y1 - t.y0 + 1;
  if (w > h * 2.2) return '(-)';
  var cx = (t.x0 + t.x1) / 2, cy = (t.y0 + t.y1) / 2, xs = [], ys = [];
  t.pixel.forEach(function (q) { var x = q % b, y = (q - x) / b; if (Math.abs(y - cy) < h * 0.18) xs.push(x); if (Math.abs(x - cx) < w * 0.18) ys.push(y); });
  var spanne = function (a) { return a.length ? Math.max.apply(null, a) - Math.min.apply(null, a) + 1 : 0; };
  // Plus: Ecken leer (ein X hätte dort Tinte)
  var ecken = 0;
  t.pixel.forEach(function (q) { var x = q % b, y = (q - x) / b; if (Math.abs(x - cx) > w * 0.3 && Math.abs(y - cy) > h * 0.3) ecken++; });
  return spanne(xs) > w * 0.6 && spanne(ys) > h * 0.6 && ecken < t.pixel.length * 0.2 ? '(+)' : '';
}
function fotoUmriss(teile) {
  if (!teile.length) return null;
  var r = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
  teile.forEach(function (t) { r.x0 = Math.min(r.x0, t.x0); r.y0 = Math.min(r.y0, t.y0); r.x1 = Math.max(r.x1, t.x1); r.y1 = Math.max(r.y1, t.y1); });
  return r;
}
// Textblock für die Texterkennung: Originalausschnitt aus dem Foto, glatt vergrößert auf etwa 56 Pixel Schrifthöhe,
// in Graustufen mit gestrecktem Kontrast und weißem Rand. Tinte außerhalb des Textblocks wird ausgeblendet.
function fotoTextBild(teile, ctx, ox, oy) {
  var r = fotoUmriss(teile), pad = 3, x0 = r.x0 - pad, y0 = r.y0 - pad, w0 = r.x1 - r.x0 + 1 + 2 * pad, h0 = r.y1 - r.y0 + 1 + 2 * pad;
  var f = Math.max(1, Math.min(6, 56 / h0)), rand = 16, w = Math.round(w0 * f), h = Math.round(h0 * f);
  var c = document.createElement('canvas'); c.width = w + 2 * rand; c.height = h + 2 * rand;
  var k = c.getContext('2d', { willReadFrequently: true });
  k.fillStyle = '#fff'; k.fillRect(0, 0, c.width, c.height);
  k.imageSmoothingEnabled = true; k.imageSmoothingQuality = 'high';
  k.drawImage(ctx.canvas, ox + x0, oy + y0, w0, h0, rand, rand, w, h);
  var id = k.getImageData(rand, rand, w, h), d = id.data, lo = 255, hi = 0;
  for (var i = 0; i < d.length; i += 4) { var g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]; d[i] = g; if (g < lo) lo = g; if (g > hi) hi = g; }
  var spanne = Math.max(30, hi - lo);
  for (i = 0; i < d.length; i += 4) { var v = Math.max(0, Math.min(255, (d[i] - lo) / spanne * 255)); v = v > 200 ? 255 : v; d[i] = d[i + 1] = d[i + 2] = v; }
  k.putImageData(id, rand, rand);
  return c;
}
// Einzelnes Schriftzeichen (eine oder mehrere zusammengehörige Teile) wie im MNIST-Datensatz aufbereiten:
// längste Seite auf 20 Pixel, im 28 × 28-Feld nach dem Schwerpunkt mittig. Werte 0 bis 1 (Tintenanteil).
function fotoGlyphe(teile, b) {
  var r = fotoUmriss(teile), w = r.x1 - r.x0 + 1, h = r.y1 - r.y0 + 1, s = 20 / Math.max(w, h);
  var tw = Math.max(1, Math.round(w * s)), th = Math.max(1, Math.round(h * s)), klein = new Float32Array(tw * th);
  var maske = new Uint8Array(w * h);
  teile.forEach(function (t) { t.pixel.forEach(function (q) { var x = q % b, y = (q - x) / b; maske[(y - r.y0) * w + (x - r.x0)] = 1; }); });
  for (var j = 0; j < th; j++) for (var i = 0; i < tw; i++) {
    var xa = i / s, ya = j / s, xe = Math.min(w, (i + 1) / s), ye = Math.min(h, (j + 1) / s), t = 0, n = 0;
    for (var y = Math.floor(ya); y < Math.ceil(ye); y++) for (var x = Math.floor(xa); x < Math.ceil(xe); x++) { t += maske[y * w + x]; n++; }
    klein[j * tw + i] = n ? t / n : 0;
  }
  var mx = 0, my = 0, ms = 0;
  for (j = 0; j < th; j++) for (i = 0; i < tw; i++) { var v = klein[j * tw + i]; mx += v * i; my += v * j; ms += v; }
  var ox = Math.round(14 - (ms ? mx / ms : tw / 2)), oy = Math.round(14 - (ms ? my / ms : th / 2));
  ox = Math.max(0, Math.min(28 - tw, ox)); oy = Math.max(0, Math.min(28 - th, oy));
  var out = new Float32Array(28 * 28);
  for (j = 0; j < th; j++) for (i = 0; i < tw; i++) out[(j + oy) * 28 + i + ox] = klein[j * tw + i];
  return out;
}
// Ganze Aufbereitung: Canvas-Ausschnitt -> { daten (FOTO_N²), box, links, rechts } oder null, wenn keine Zeichnung gefunden wurde.
// links und rechts sind Textblöcke neben dem Zeichen (Teile mit Pixeln), sie zählen nicht zum Zeichen.
function fotoAufbereiten(ctx, x, y, b, h) {
  var g = fotoGrau(ctx, x, y, b, h), m = fotoTinte(g, b, h), teile = fotoTeile(m, b, h), tr = fotoTexteTrennen(teile, b);
  var staerke = tr.staerke ? fotoStaerke(tr.staerke, b) : '';
  tr.links.concat(tr.rechts, staerke ? [tr.staerke] : []).forEach(function (t) { t.pixel.forEach(function (q) { m[q] = 0; }); });
  // Flecken abseits des Zeichens (Maserung, Schmutz, nicht gelesener Text) zählen nicht zum Zeichen
  var k = tr.zeichen;
  if (k) {
    var zb = k.x1 - k.x0, zh = k.y1 - k.y0;
    teile.forEach(function (t) {
      if (t.x1 < k.x0 - zb * 0.15 || t.x0 > k.x1 + zb * 0.15 || t.y1 < k.y0 - zh * 0.9 || t.y0 > k.y1 + zh * 0.3) t.pixel.forEach(function (q) { m[q] = 0; });
    });
  }
  var box = fotoBox(m, b, h);
  if (!box || box.x1 - box.x0 < 8 || box.y1 - box.y0 < 8) return null;
  return { daten: fotoRaster(m, b, h, box), box: box, links: tr.links, rechts: tr.rechts, staerke: staerke, breite: b, ctx: ctx, ox: x, oy: y };
}
// Farbe des Zeichens (für die Zugehörigkeit): Anteil kräftig gefärbter Pixel in Blau, Rot, Grün, Gelb
function fotoFarbe(ctx, x, y, b, h) {
  var d = ctx.getImageData(x, y, b, h).data, z = { blau: 0, rot: 0, gruen: 0, gelb: 0 }, n = 0;
  for (var j = 0; j < d.length; j += 16) {
    var r = d[j] / 255, g = d[j + 1] / 255, bl = d[j + 2] / 255, max = Math.max(r, g, bl), min = Math.min(r, g, bl), c = max - min;
    if (max < 0.25 || c < 0.22) continue;
    var hue = max === r ? ((g - bl) / c + 6) % 6 : (max === g ? (bl - r) / c + 2 : (r - g) / c + 4);
    hue *= 60; n++;
    if (hue < 25 || hue >= 330) z.rot++; else if (hue < 70) z.gelb++; else if (hue < 165) z.gruen++; else if (hue < 260) z.blau++;
  }
  var ges = b * h / 4;
  Object.keys(z).forEach(function (k) { z[k] = z[k] / ges; });
  return z;
}

/* ---------- Erkennungsnetz (Gewichte aus vendor/foto-netz.js) ---------- */
function fotoConv(ein, h, w, c, k) {
  // k: { w: Float32Array [3][3][c][o], b: Float32Array[o], o }
  var o = k.o, aus = new Float32Array(h * w * o), kw = k.w, kb = k.b;
  for (var y = 0; y < h; y++) {
    for (var x = 0; x < w; x++) {
      var basis = (y * w + x) * o;
      for (var q = 0; q < o; q++) aus[basis + q] = kb[q];
      for (var dy = -1; dy <= 1; dy++) {
        var yy = y + dy;
        if (yy < 0 || yy >= h) continue;
        for (var dx = -1; dx <= 1; dx++) {
          var xx = x + dx;
          if (xx < 0 || xx >= w) continue;
          var ep = (yy * w + xx) * c, kp = ((dy + 1) * 3 + (dx + 1)) * c * o;
          for (var p = 0; p < c; p++) {
            var v = ein[ep + p];
            if (!v) continue;
            var kpp = kp + p * o;
            for (q = 0; q < o; q++) aus[basis + q] += v * kw[kpp + q];
          }
        }
      }
      for (q = 0; q < o; q++) if (aus[basis + q] < 0) aus[basis + q] = 0;
    }
  }
  return aus;
}
function fotoPool(ein, h, w, c) {
  var h2 = h >> 1, w2 = w >> 1, aus = new Float32Array(h2 * w2 * c);
  for (var y = 0; y < h2; y++) for (var x = 0; x < w2; x++) for (var p = 0; p < c; p++) {
    var a = ein[((2 * y) * w + 2 * x) * c + p], b = ein[((2 * y) * w + 2 * x + 1) * c + p], d = ein[((2 * y + 1) * w + 2 * x) * c + p], e = ein[((2 * y + 1) * w + 2 * x + 1) * c + p];
    aus[(y * w2 + x) * c + p] = Math.max(a, b, d, e);
  }
  return aus;
}
function fotoDense(ein, k, relu) {
  var aus = new Float32Array(k.o);
  for (var q = 0; q < k.o; q++) aus[q] = k.b[q];
  for (var i = 0; i < ein.length; i++) {
    var v = ein[i];
    if (!v) continue;
    var off = i * k.o;
    for (q = 0; q < k.o; q++) aus[q] += v * k.w[off + q];
  }
  if (relu) for (q = 0; q < k.o; q++) if (aus[q] < 0) aus[q] = 0;
  return aus;
}
function fotoSoftmax(v) {
  var m = Math.max.apply(null, v), s = 0, r = new Float32Array(v.length);
  for (var i = 0; i < v.length; i++) { r[i] = Math.exp(v[i] - m); s += r[i]; }
  for (i = 0; i < v.length; i++) r[i] /= s;
  return r;
}
// Gewichte entpacken: Base64-Text mit Int8-Werten und je Schicht einem Skalierungsfaktor
function fotoNetzLaden(roh) {
  var bin = atob(roh.daten), bytes = new Int8Array(bin.length);
  for (var i = 0; i < bin.length; i++) bytes[i] = (bin.charCodeAt(i) << 24) >> 24;
  var pos = 0, netz = { klassen: roh.klassen, schichten: {} };
  roh.schichten.forEach(function (s) {
    var n = s.form.reduce(function (a, b) { return a * b; }, 1), w = new Float32Array(n);
    for (var j = 0; j < n; j++) w[j] = bytes[pos + j] * s.skala;
    pos += n;
    netz.schichten[s.name] = { w: w, b: new Float32Array(s.bias), o: s.form[s.form.length - 1] };
  });
  return netz;
}
// Vorwärtsrechnung: 4 Faltungsblöcke, eine gemeinsame Schicht, drei Köpfe (Rahmen, Symbol, Größe)
function fotoErkennen(netz, daten) {
  var S = netz.schichten, x = daten, h = FOTO_N, w = FOTO_N, c = 1;
  ['c1', 'c2', 'c3', 'c4'].forEach(function (n) { x = fotoConv(x, h, w, c, S[n]); c = S[n].o; x = fotoPool(x, h, w, c); h >>= 1; w >>= 1; });
  var f = fotoDense(x, S.d1, true);
  return { rahmen: fotoSoftmax(fotoDense(f, S.rahmen)), symbol: fotoSoftmax(fotoDense(f, S.symbol)), groesse: fotoSoftmax(fotoDense(f, S.groesse)) };
}

/* ---------- Ziffernnetz für Beschriftungen (vendor/foto-ziffern.js) ---------- */
// 28 × 28 -> Faltung 16 -> Pool -> Faltung 32 -> Pool -> 64 -> 11 Klassen (0–9 und /)
function fotoZifferErkennen(netz, glyphe) {
  var S = netz.schichten, x = fotoConv(glyphe, 28, 28, 1, S.c1);
  x = fotoPool(x, 28, 28, S.c1.o); x = fotoConv(x, 14, 14, S.c1.o, S.c2); x = fotoPool(x, 14, 14, S.c2.o);
  return fotoSoftmax(fotoDense(fotoDense(x, S.d1, true), S.aus));
}
// Textblock in Schriftzeichen zerlegen und lesen. Teile, die sich waagerecht überlappen, gehören zu einem Zeichen.
// Kleine runde Teile sind Punkte. Ergebnis: { text, sicher } mit der geringsten Sicherheit aller Zeichen.
function fotoZiffernLesen(teile, b, netz) {
  var sortiert = teile.slice().sort(function (p, q) { return p.x0 - q.x0; }), gruppen = [];
  sortiert.forEach(function (t) {
    var g = gruppen[gruppen.length - 1];
    if (g) {
      var r = fotoUmriss(g), ueber = Math.min(r.x1, t.x1) - Math.max(r.x0, t.x0), klein = Math.min(r.x1 - r.x0, t.x1 - t.x0) + 1;
      if (ueber > klein * 0.5) { g.push(t); return; }
    }
    gruppen.push([t]);
  });
  var hoehen = gruppen.map(function (g) { var r = fotoUmriss(g); return r.y1 - r.y0 + 1; }).sort(function (p, q) { return p - q; });
  var hoch = hoehen[hoehen.length - 1], text = '', sicher = 1;
  gruppen.forEach(function (g) {
    var r = fotoUmriss(g), gh = r.y1 - r.y0 + 1, gw = r.x1 - r.x0 + 1;
    if (Math.max(gh, gw) < hoch * 0.35) { text += '.'; return; }
    var p = fotoZifferErkennen(netz, fotoGlyphe(g, b)), best = 0;
    for (var i = 1; i < p.length; i++) if (p[i] > p[best]) best = i;
    text += netz.klassen[best]; sicher = Math.min(sicher, p[best]);
  });
  return { text: text, sicher: sicher };
}
