/* MeinKamerad – Koordinaten: Umrechnung zwischen geografischen Koordinaten (WGS84), UTM und MGRS (UTMREF).
   Teil von index.html, Reihenfolge der Skripte beachten. */
'use strict';
if (!window.MK_DATEN) throw new Error('daten.js fehlt');

var WGS_A = 6378137, WGS_F = 1 / 298.257223563, UTM_K0 = 0.9996;
var WGS_E2 = WGS_F * (2 - WGS_F), WGS_EP2 = WGS_E2 / (1 - WGS_E2);
var MGRS_BAND = 'CDEFGHJKLMNPQRSTUVWX';

function utmZone(lat, lon) {
  var z = Math.floor((lon + 180) / 6) + 1;
  if (z > 60) z = 60;
  // Ausnahmen Norwegen und Spitzbergen
  if (lat >= 56 && lat < 64 && lon >= 3 && lon < 12) z = 32;
  if (lat >= 72 && lat < 84) {
    if (lon >= 0 && lon < 9) z = 31; else if (lon >= 9 && lon < 21) z = 33; else if (lon >= 21 && lon < 33) z = 35; else if (lon >= 33 && lon < 42) z = 37;
  }
  return z;
}
function meridianBogen(phi) {
  var e2 = WGS_E2, e4 = e2 * e2, e6 = e4 * e2;
  return WGS_A * ((1 - e2 / 4 - 3 * e4 / 64 - 5 * e6 / 256) * phi - (3 * e2 / 8 + 3 * e4 / 32 + 45 * e6 / 1024) * Math.sin(2 * phi) +
    (15 * e4 / 256 + 45 * e6 / 1024) * Math.sin(4 * phi) - (35 * e6 / 3072) * Math.sin(6 * phi));
}
// Breite/Länge in Grad -> { zone, nord (bool), ost, nordwert } in Metern
function nachUtm(lat, lon, zoneVorgabe) {
  var zone = zoneVorgabe || utmZone(lat, lon);
  var phi = lat * Math.PI / 180, lam = lon * Math.PI / 180, lam0 = ((zone - 1) * 6 - 180 + 3) * Math.PI / 180;
  var n = WGS_A / Math.sqrt(1 - WGS_E2 * Math.sin(phi) * Math.sin(phi)), t = Math.tan(phi) * Math.tan(phi);
  var c = WGS_EP2 * Math.cos(phi) * Math.cos(phi), a = Math.cos(phi) * (lam - lam0), m = meridianBogen(phi);
  var ost = UTM_K0 * n * (a + (1 - t + c) * a * a * a / 6 + (5 - 18 * t + t * t + 72 * c - 58 * WGS_EP2) * Math.pow(a, 5) / 120) + 500000;
  var nordwert = UTM_K0 * (m + n * Math.tan(phi) * (a * a / 2 + (5 - t + 9 * c + 4 * c * c) * Math.pow(a, 4) / 24 +
    (61 - 58 * t + t * t + 600 * c - 330 * WGS_EP2) * Math.pow(a, 6) / 720));
  if (lat < 0) nordwert += 10000000;
  return { zone: zone, nord: lat >= 0, ost: ost, nordwert: nordwert };
}
// UTM -> [Breite, Länge] in Grad
function ausUtm(zone, nord, ost, nordwert) {
  var x = ost - 500000, y = nord ? nordwert : nordwert - 10000000;
  var m = y / UTM_K0, e2 = WGS_E2;
  var mu = m / (WGS_A * (1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2 * e2 * e2 / 256));
  var e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));
  var phi1 = mu + (3 * e1 / 2 - 27 * Math.pow(e1, 3) / 32) * Math.sin(2 * mu) + (21 * e1 * e1 / 16 - 55 * Math.pow(e1, 4) / 32) * Math.sin(4 * mu) +
    (151 * Math.pow(e1, 3) / 96) * Math.sin(6 * mu) + (1097 * Math.pow(e1, 4) / 512) * Math.sin(8 * mu);
  var n1 = WGS_A / Math.sqrt(1 - e2 * Math.sin(phi1) * Math.sin(phi1)), t1 = Math.tan(phi1) * Math.tan(phi1);
  var c1 = WGS_EP2 * Math.cos(phi1) * Math.cos(phi1), r1 = WGS_A * (1 - e2) / Math.pow(1 - e2 * Math.sin(phi1) * Math.sin(phi1), 1.5);
  var d = x / (n1 * UTM_K0);
  var lat = phi1 - (n1 * Math.tan(phi1) / r1) * (d * d / 2 - (5 + 3 * t1 + 10 * c1 - 4 * c1 * c1 - 9 * WGS_EP2) * Math.pow(d, 4) / 24 +
    (61 + 90 * t1 + 298 * c1 + 45 * t1 * t1 - 252 * WGS_EP2 - 3 * c1 * c1) * Math.pow(d, 6) / 720);
  var lon = (d - (1 + 2 * t1 + c1) * Math.pow(d, 3) / 6 + (5 - 2 * c1 + 28 * t1 - 3 * c1 * c1 + 8 * WGS_EP2 + 24 * t1 * t1) * Math.pow(d, 5) / 120) / Math.cos(phi1);
  return [lat * 180 / Math.PI, ((zone - 1) * 6 - 180 + 3) + lon * 180 / Math.PI];
}
function mgrsBand(lat) { return lat >= 72 ? 'X' : MGRS_BAND.charAt(Math.floor((lat + 80) / 8)); }
// 100-km-Quadrat: Spaltenbuchstaben je nach Zonengruppe, Zeilenbuchstaben (A–V ohne I und O) mit Versatz bei geraden Zonen
var MGRS_SPALTEN = ['ABCDEFGH', 'JKLMNPQR', 'STUVWXYZ'], MGRS_ZEILEN = 'ABCDEFGHJKLMNPQRSTUV';
// Breite/Länge -> MGRS-Text, genauigkeit = Stellen je Wert (5 = 1 m, 4 = 10 m)
function nachMgrs(lat, lon, stellen) {
  if (lat < -80 || lat > 84) return '';
  stellen = stellen || 5;
  var u = nachUtm(lat, lon), satz = (u.zone - 1) % 3;
  var spalte = MGRS_SPALTEN[satz].charAt(Math.floor(u.ost / 100000) - 1);
  var zeile = MGRS_ZEILEN.charAt((Math.floor(u.nordwert / 100000) + (u.zone % 2 === 0 ? 5 : 0)) % 20);
  var teil = Math.pow(10, 5 - stellen);
  var e = String(Math.floor((u.ost % 100000) / teil)), n = String(Math.floor((u.nordwert % 100000) / teil));
  while (e.length < stellen) e = '0' + e;
  while (n.length < stellen) n = '0' + n;
  return u.zone + mgrsBand(lat) + ' ' + spalte + zeile + ' ' + e + ' ' + n;
}
// MGRS-Text -> [Breite, Länge] (Mitte des angegebenen Feldes) oder null
function ausMgrs(text) {
  var t = String(text).toUpperCase().replace(/\s+/g, '');
  var m = /^(\d{1,2})([C-HJ-NP-X])([A-HJ-NP-Z])([A-HJ-NP-V])(\d*)$/.exec(t);
  if (!m || m[5].length % 2 || m[5].length > 10) return null;
  var zone = +m[1], band = m[2];
  if (zone < 1 || zone > 60) return null;
  var satz = (zone - 1) % 3, sp = MGRS_SPALTEN[satz].indexOf(m[3]);
  var ze = MGRS_ZEILEN.indexOf(m[4]);
  if (sp < 0 || ze < 0) return null;
  var h = m[5].length / 2, faktor = Math.pow(10, 5 - h);
  var e = h ? +m[5].slice(0, h) * faktor : 0, n = h ? +m[5].slice(h) * faktor : 0;
  e += faktor / 2; n += faktor / 2;
  var ost = (sp + 1) * 100000 + e;
  var zeilenM = ((ze - (zone % 2 === 0 ? 5 : 0) + 20) % 20) * 100000 + n;
  // Nordwert um ganze 2000 km verschieben, bis er zum Breitenband passt
  var bandLat = band === 'X' ? 72 : -80 + MGRS_BAND.indexOf(band) * 8, nord = bandLat >= 0;
  var minNord = nachUtm(bandLat, (zone - 1) * 6 - 180 + 3, zone).nordwert;
  var nordwert = zeilenM;
  while (nordwert < minNord - 50000) nordwert += 2000000;
  var p = ausUtm(zone, nord, ost, nordwert);
  if (!isFinite(p[0]) || !isFinite(p[1])) return null;
  return p;
}
// Eingabe als MGRS oder als "Breite, Länge" in Dezimalgrad
function koordinateLesen(text) {
  var t = String(text).trim();
  var g = /^(-?\d{1,2}(?:[.,]\d+)?)\s*[;,\s]\s*(-?\d{1,3}(?:[.,]\d+)?)$/.exec(t.replace(/(\d),(\d)/g, '$1.$2').replace(/\s*;\s*/, ', '));
  if (g) {
    var lat = parseFloat(g[1]), lon = parseFloat(g[2]);
    if (Math.abs(lat) <= 90 && Math.abs(lon) <= 180) return [lat, lon];
  }
  return ausMgrs(t);
}
