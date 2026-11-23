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
// Ganze Aufbereitung: Canvas-Ausschnitt -> { daten (FOTO_N²), box } oder null, wenn keine Zeichnung gefunden wurde
function fotoAufbereiten(ctx, x, y, b, h) {
  var g = fotoGrau(ctx, x, y, b, h), m = fotoTinte(g, b, h), box = fotoBox(m, b, h);
  if (!box || box.x1 - box.x0 < 8 || box.y1 - box.y0 < 8) return null;
  return { daten: fotoRaster(m, b, h, box), box: box };
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
