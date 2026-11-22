# MeinKamerad

Besoldungsrechner für Soldaten: vom Dienstgrad zum Bruttobetrag, mit Familienzuschlag, Stellenzulagen und Auslandsverwendungszuschlag. Nicht amtlich, ohne Gewähr.

## Dateien

| Datei | Inhalt |
| --- | --- |
| `index.html` | Die Seite: Aufbau, Gestaltung, Rechenlogik. Muss bei einer Besoldungsanpassung **nicht** geändert werden. |
| `daten.js` | **Alle Beträge und Stand-Angaben.** Die Seite übernimmt sie automatisch an jeder Stelle. |

## Werte ändern (zum Beispiel bei einer Besoldungsanpassung)

Nur `daten.js` bearbeiten, direkt auf GitHub im Browser:

1. Im Repository auf **`daten.js`** klicken.
2. Oben rechts auf das **Stift-Symbol** („Edit this file“) klicken.
3. Werte ändern, etwa `gueltigAb`, die Grundgehalt-Tabellen oder den Familienzuschlag.
4. **„Commit changes…“** klicken und bestätigen.

Fertig. Alle Stellen der Seite, an denen der Wert vorkommt, zeigen danach den neuen Wert.

Regeln:

- Beträge mit Punkt als Dezimalzeichen: `2706.99`, nicht `2.706,99`.
- Texte stehen in Anführungszeichen.
- Nach jedem Eintrag ein Komma, außer nach dem letzten in einer Liste.
- Besoldungsgruppen wie im Gesetz, Bereiche mit Bindestrich: `"A3-A5"`, `"A14, A15, B1"`.

Wenn danach in der Seite der Hinweis „Die Datei daten.js fehlt oder enthält einen Fehler“ erscheint, fehlt meist ein Komma oder ein Anführungszeichen.

Wenn die Zuordnung der Einsatzgebiete zu Stufen geprüft ist, `gebieteBeispiel: false` setzen. Dann verschwinden alle Beispiel-Hinweise auf der Seite.

## Quellen

- Grundgehalt (Anlage IV), Familienzuschlag (Anlage V) und Stellenzulagen (Anlage IX) des Bundesbesoldungsgesetzes, gültig ab 1. März 2024, BGBl. 2023 I Nr. 414.
- Stellenzulage Combat Controller (Nr. 5b): BGBl. 2025 I Nr. 72.
- Auslandsverwendungszuschlag: Tagessätze nach § 3 AuslVZV, gültig ab 6. März 2025, BGBl. 2025 I Nr. 78. Die Zuordnung der Einsatzgebiete zu Stufen ist ein Beispiel.
- Kindergeld: § 6 BKGG, gültig ab 1. Januar 2026, BGBl. 2024 I Nr. 449.
