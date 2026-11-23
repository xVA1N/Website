# Training der Fotoerkennung

Die Fotoerkennung auf der Seite „Taktische Zeichen“ nutzt ein kleines Erkennungsnetz (`vendor/foto-netz.js`). Es wurde ausschließlich mit künstlich erzeugten Zeichen trainiert, es gibt keine echten Fotos im Training.

## Ablauf

1. **Trainingsbilder erzeugen** (`gen.js`, braucht Node und Playwright): zeichnet Zeichen mit milsymbol, verändert sie wie eine Handzeichnung auf Papier (Strichstärke, Drehung, Scherung, Verbiegen, Schatten, Unschärfe, Flecken, Rauschen) und bereitet sie mit `js/foto-kern.js` genauso auf wie die Website. Beispiel: `node gen.js . 20000 1234 ./train1` erzeugt `train1.x` (Bilder 64 × 64) und `train1.y` (Rahmen, Symbol, Größe).
2. **Trainieren** (`train.py`, braucht TensorFlow): erwartet `train1` bis `train5`, `val` und `rau` im selben Ordner, trainiert und schreibt `foto-netz.js`, das nach `vendor/` kopiert wird.
3. **Prüfen** mit unabhängigen „Fotos“ (`node fotos.js . 300`; mit Beschriftung links und rechts: `node fotos.js . 100 text`, geprüft mit `t64.js` über einen lokalen Webserver, weil die Texterkennung einen Web Worker braucht) (`fotos.js` erzeugt schräg fotografierte, mit einem Rauschfilter verbogene Zeichen auf Papier; `t61.js` lädt sie über die echte Seite hoch und vergleicht).

`klassen.json` enthält die 45 erkannten Landeinheiten (Code und deutscher Name), dazu kommt „ohne Symbol“ (000000). Neue Einträge müssen hier und in `js/12-symbole.js` (`MS_ARTEN`) stehen, danach neu erzeugen und trainieren.

## Beschriftungen

Die Bildaufbereitung trennt Text links (Bezeichnung, Feld T) und rechts (übergeordnete Einheit, Feld M) vom Zeichen. Gelesen wird mit Tesseract.js 7.0.0 (Apache-2.0) und den englischen Sprachdaten (`vendor/tesseract/`, offline, nur bei Bedarf geladen). Danach korrigiert `js/16-foto.js` typische Verwechslungen: links nach dem Muster „Kompanie./Bataillon“, rechts durch Abgleich mit einer Liste gängiger Abkürzungen (`FOTO_GATTUNG`, `FOTO_EBENE`).

## Stand

Auf 300 unabhängig erzeugten Test-Fotos: Rahmen 99,7 %, Symbol 99,7 % (unter den drei Vorschlägen 100 %), Größe 99,3 %. Beschriftungen auf 100 Test-Fotos mit verwackelter Druckschrift: links 71 %, rechts 57 % exakt richtig (die Abkürzungsliste enthält die im Test verwendeten Abkürzungen, das schönt den Wert rechts). Handschrift liest Tesseract deutlich schlechter. Echte Handzeichnungen von Menschen weichen stärker ab (andere Proportionen, Handschrift bei Buchstaben, Schraffuren), dort ist die Trefferquote voraussichtlich niedriger und nicht gemessen.
