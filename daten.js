/*
 * MeinKamerad – zentrale Daten
 * ============================
 * Alle Beträge und Stand-Angaben stehen nur hier. Die Seite (index.html) übernimmt sie
 * automatisch an jeder Stelle, an der sie vorkommen. Bei einer Besoldungsanpassung
 * reicht es, die Zahlen in dieser Datei zu ändern.
 *
 * Regeln zum Bearbeiten:
 *  - Beträge in Euro mit Punkt als Dezimalzeichen: 2706.99 (nicht 2.706,99).
 *  - Texte stehen in Anführungszeichen "…".
 *  - Nach jedem Eintrag ein Komma, außer nach dem letzten in einer Liste oder Klammer.
 *  - Besoldungsgruppen schreibt man wie im Gesetz, Bereiche mit Bindestrich und mehrere
 *    mit Komma, zum Beispiel "A3-A5" oder "A14, A15, B1" oder "A16, B2-B4".
 */
window.MK_DATEN = {

  /* ---------- Stand und Quelle: erscheinen auf der ganzen Seite ---------- */
  stand: {
    gueltigAb: "1. März 2024",
    fundstelle: "BGBl. 2023 I Nr. 414",
    gesetz: "Gesetz zur Anpassung der Bundesbesoldung und -versorgung für die Jahre 2023 und 2024",
    hinweis: "Die Anpassung 2025/2026 war laut Recherche im November 2026 noch nicht verkündet. Bis dahin zahlt der Bund vorläufige Abschläge unter Vorbehalt, die im Rechner nicht enthalten sind."
  },

  /* ---------- Anlage IV: Grundgehalt ---------- */
  // Besoldungsordnung A: Monatsbetrag je Erfahrungsstufe, beginnend mit stufeVon
  stufeVon: 1,
  grundgehaltA: {
    A3:  [2706.99, 2763.31, 2819.66, 2865.01, 2910.36, 2955.72, 3001.08, 3046.42],
    A4:  [2759.23, 2826.55, 2893.88, 2947.47, 3001.08, 3054.68, 3108.26, 3157.76],
    A5:  [2778.44, 2862.26, 2929.59, 2995.58, 3061.57, 3128.91, 3194.84, 3259.46],
    A6:  [2833.40, 2931.00, 3029.92, 3105.51, 3183.86, 3259.46, 3343.26, 3416.11],
    A7:  [2963.97, 3050.57, 3164.65, 3281.42, 3395.49, 3510.94, 3597.53, 3684.10],
    A8:  [3123.39, 3227.85, 3374.87, 3523.33, 3671.73, 3774.80, 3879.24, 3982.32],
    A9:  [3354.26, 3457.34, 3619.52, 3784.42, 3946.56, 4056.80, 4171.47, 4283.30],
    A10: [3575.51, 3717.07, 3921.86, 4127.55, 4337.08, 4482.89, 4628.67, 4774.53],
    A11: [4056.80, 4273.37, 4488.54, 4705.13, 4853.76, 5002.40, 5151.04, 5299.72],
    A12: [4334.26, 4590.49, 4848.12, 5104.32, 5282.70, 5458.23, 5635.18, 5814.97],
    A13: [5046.30, 5286.94, 5526.17, 5766.83, 5932.45, 6099.51, 6265.11, 6427.89],
    A14: [5183.60, 5493.61, 5805.05, 6115.06, 6328.80, 6544.01, 6757.73, 6972.92],
    A15: [6289.17, 6569.48, 6783.22, 6997.00, 7210.74, 7423.08, 7635.43, 7846.32],
    A16: [6916.29, 7241.90, 7488.19, 7734.52, 7979.41, 8227.16, 8473.46, 8716.97]
  },
  // Besoldungsordnung B: fester Monatsbetrag
  grundgehaltB: {
    B1: 7846.32, B2: 9080.76, B3: 9603.10, B4: 10149.51, B5: 10776.64, B6: 11372.63,
    B7: 11947.35, B8: 12548.95, B9: 13294.99, B10: 15612.33, B11: 16084.36
  },
  // Erhöhungsbeträge zum Grundgehalt. laufbahn: "Mannschaften", "Unteroffiziere" oder "Offiziere"
  // (Fahnenjunker und Seekadetten zählen hier zu den Unteroffizieren)
  erhoehungsbetraege: [
    { gruppen: "A5-A6", laufbahn: "Unteroffiziere", betrag: 25.15 },
    { gruppen: "A9-A10", laufbahn: "Offiziere", betrag: 10.97 }
  ],

  /* ---------- Anlage V: Familienzuschlag ---------- */
  familienzuschlag: {
    verheiratet: 171.28,      // Stufe 1
    erstesKind: 146.38,       // Stufe 2 minus Stufe 1
    zweitesKind: 146.38,
    jedesWeitereKind: 456.06,
    // Zusätzliche Beträge in den unteren Besoldungsgruppen
    plusErstesKind: { "A3-A5": 5.37 },
    plusWeiteresKind: { "A3": 26.84, "A4": 21.47, "A5": 16.10 },
    // Partner/in ebenfalls im öffentlichen Dienst (§ 40 Abs. 4 und 5 BBesG):
    // Stufe 1 gibt es dann nur anteilig, die Kinderbeträge bekommt, wer das Kindergeld erhält.
    anteilStufe1BeiPartnerImOeD: 0.5
  },

  /* ---------- Kindergeld (Familienkasse, nicht Teil der Besoldung) ---------- */
  kindergeld: {
    jeKind: 259,
    gueltigAb: "1. Januar 2026",
    fundstelle: "§ 6 BKGG, BGBl. 2024 I Nr. 449"
  },

  /* ---------- Urlaubsplaner ---------- */
  urlaub: {
    // Vorschlag für den Jahresanspruch in Arbeitstagen (5-Tage-Woche). Jeder Nutzer kann ihn im
    // Planer anpassen. Maßgeblich ist der eigene Urlaubsbescheid.
    standardAnspruch: 30,
    hinweis: "Grundlage ist die Soldatinnen- und Soldatenurlaubsverordnung. Anspruch, Resturlaub und Fristen bitte mit dem eigenen Urlaubsbescheid abgleichen.",
    bundeslaender: {
      BW: "Baden-Württemberg", BY: "Bayern", BE: "Berlin", BB: "Brandenburg", HB: "Bremen", HH: "Hamburg",
      HE: "Hessen", MV: "Mecklenburg-Vorpommern", NI: "Niedersachsen", NW: "Nordrhein-Westfalen",
      RP: "Rheinland-Pfalz", SL: "Saarland", SN: "Sachsen", ST: "Sachsen-Anhalt", SH: "Schleswig-Holstein", TH: "Thüringen"
    },
    // Gesetzliche Feiertage. regel: "fest" (datum MM-TT), "ostern" (tage nach Ostersonntag, negativ = davor),
    // "bussbettag" (Mittwoch vor dem 23. November). laender: "alle" oder Kürzel mit Komma.
    // Nur landesweite Feiertage; örtliche (z. B. Mariä Himmelfahrt in Teilen Bayerns) fehlen.
    feiertage: [
      { name: "Neujahr", regel: "fest", datum: "01-01", laender: "alle" },
      { name: "Heilige Drei Könige", regel: "fest", datum: "01-06", laender: "BW,BY,ST" },
      { name: "Internationaler Frauentag", regel: "fest", datum: "03-08", laender: "BE,MV" },
      { name: "Karfreitag", regel: "ostern", tage: -2, laender: "alle" },
      { name: "Ostersonntag", regel: "ostern", tage: 0, laender: "BB" },
      { name: "Ostermontag", regel: "ostern", tage: 1, laender: "alle" },
      { name: "Tag der Arbeit", regel: "fest", datum: "05-01", laender: "alle" },
      { name: "Christi Himmelfahrt", regel: "ostern", tage: 39, laender: "alle" },
      { name: "Pfingstsonntag", regel: "ostern", tage: 49, laender: "BB" },
      { name: "Pfingstmontag", regel: "ostern", tage: 50, laender: "alle" },
      { name: "Fronleichnam", regel: "ostern", tage: 60, laender: "BW,BY,HE,NW,RP,SL" },
      { name: "Mariä Himmelfahrt", regel: "fest", datum: "08-15", laender: "SL" },
      { name: "Weltkindertag", regel: "fest", datum: "09-20", laender: "TH" },
      { name: "Tag der Deutschen Einheit", regel: "fest", datum: "10-03", laender: "alle" },
      { name: "Reformationstag", regel: "fest", datum: "10-31", laender: "BB,HB,HH,MV,NI,SN,ST,SH,TH" },
      { name: "Allerheiligen", regel: "fest", datum: "11-01", laender: "BW,BY,NW,RP,SL" },
      { name: "Buß- und Bettag", regel: "bussbettag", laender: "SN" },
      { name: "1. Weihnachtstag", regel: "fest", datum: "12-25", laender: "alle" },
      { name: "2. Weihnachtstag", regel: "fest", datum: "12-26", laender: "alle" }
    ]
  },

  /* ---------- Eigene Texte zu einzelnen Dienstgraden ---------- */
  // Erscheinen auf der Seite Dienstgrade unter „Weitere Infos“. Schlüssel ist der Dienstgrad:
  // soldat, gefr, ogefr, hgefr, stgefr, ostgefr, korp, stkorp, uffz, stuffz, fw, ofw, hfw, stfw, ostfw,
  // schuetze_ua, gefr_ua, ogefr_ua, hgefr_ua, gefr_fa, uffz_fa, fj, faehnrich, ofaehnrich, lt, olt,
  // hptm, sthptm, maj, oberstlt, oberst, bgen, gmaj, glt, gen,
  // Sanitätsoffiziere: sa13, sa14, sa15, sa16, sb6, sb7, sb9.
  // Beispiel: hfw: "Häufig als Kompaniefeldwebel (Spieß) eingesetzt.",
  dienstgradInfos: {
  },

  /* ---------- Amtszulagen (Anlage I mit Fußnoten, Beträge aus Anlage IX) ---------- */
  // Schlüssel ist der Dienstgrad. art: "immer" = wird immer gezahlt,
  // "moeglich" = nur bei Funktionen, die sich abheben (im Rechner per Häkchen).
  amtszulagen: {
    gefr:       { betrag: 46.31,  art: "immer",    fussnote: "A 3 Fußnote 3" },
    gefr_ua:    { betrag: 46.31,  art: "immer",    fussnote: "A 3 Fußnote 3" },
    gefr_fa:    { betrag: 46.31,  art: "immer",    fussnote: "A 3 Fußnote 3" },
    hgefr:      { betrag: 9.99,   art: "immer",    fussnote: "A 4 Fußnote 4" },
    hgefr_ua:   { betrag: 9.99,   art: "immer",    fussnote: "A 4 Fußnote 4" },
    ostgefr:    { betrag: 49.73,  art: "immer",    fussnote: "A 5 Fußnote 1" },
    stkorp:     { betrag: 49.73,  art: "immer",    fussnote: "A 6 Fußnote 5" },
    ofw:        { betrag: 61.76,  art: "immer",    fussnote: "A 7 Fußnote 5" },
    hfw:        { betrag: 79.56,  art: "immer",    fussnote: "A 8 Fußnote 1" },
    ofaehnrich: { betrag: 79.56,  art: "immer",    fussnote: "A 8 Fußnote 1" },
    ostfw:      { betrag: 370.22, art: "moeglich", fussnote: "A 9 Fußnote 1" },
    sthptm:     { betrag: 376.24, art: "moeglich", fussnote: "A 13 Fußnote 1" }
  },

  /* ---------- Anlage IX: Zulagen für Führungsfunktionen ---------- */
  // Eigene Liste, im Rechner und im Reiter „Zulagen“ getrennt von den übrigen Stellenzulagen.
  // "gruppen": nur für diese Besoldungsgruppen.
  // "nebenAnderen": "differenz" = neben einer anderen Stellenzulage nur, soweit sie diese übersteigt.
  // "nichtNebenAmtszulageIn": wird neben einer Amtszulage in dieser Besoldungsgruppe nicht gezahlt.
  fuehrungszulagen: [
    { id: "chef", name: "Kompaniechef oder vergleichbare Führungs- oder Ausbildungsfunktion", nr: "4 Abs. 1 Nr. 1",
      betrag: 150, gruppen: "A3-A14", nebenAnderen: "differenz", nichtNebenAmtszulageIn: "A13" },
    { id: "zugfuehrer", name: "Zugführer oder vergleichbare Führungs- oder Ausbildungsfunktion", nr: "4 Abs. 1 Nr. 2",
      betrag: 130, gruppen: "A3-A14", nebenAnderen: "differenz", nichtNebenAmtszulageIn: "A13" },
    { id: "gruppenfuehrer", name: "Gruppenführer oder vergleichbare Führungs- oder Ausbildungsfunktion", nr: "4 Abs. 1 Nr. 3",
      betrag: 100, gruppen: "A3-A14", nebenAnderen: "differenz", nichtNebenAmtszulageIn: "A13" },
    { id: "truppfuehrer", name: "Truppführer oder vergleichbare Führungs- oder Ausbildungsfunktion", nr: "4 Abs. 1 Nr. 4",
      betrag: 100, gruppen: "A3-A14", nebenAnderen: "differenz", nichtNebenAmtszulageIn: "A13" },
    { id: "weisung", name: "Weisungsrecht gegenüber Zivilpersonen als Vertreter des Bundes als Arbeitgeber", nr: "4 Abs. 1 Nr. 5",
      betrag: 100, gruppen: "A3-A14", nebenAnderen: "differenz", nichtNebenAmtszulageIn: "A13" },
    { id: "kpfw", name: "Kompaniefeldwebel", nr: "4a", betrag: 135, gruppen: "A7-A9" }
  ],

  /* ---------- Anlage IX: Stellenzulagen für besondere Verwendungen ---------- */
  // Jede Zulage hat entweder "staffel" (Betrag je Besoldungsgruppe, optional je Laufbahn)
  // oder "dauer" (Auswahlliste, z. B. nach Dauer in der Verwendung; die Überschrift der
  // Auswahl steht in "auswahlLabel"). "quelle" ist optional, sonst gilt Anlage IX mit Stand oben.
  // Regeln aus Anlage I: "nurGruppen" (nur diese Besoldungsgruppen), "nebenAnderen": "differenz"
  // (neben anderen Stellenzulagen nur, soweit sie diese übersteigt), "differenzNeben": ["4"]
  // (nur neben diesen Nummern), "nichtNebenAVZ": true (nicht neben Auslandsverwendungszuschlag).
  stellenzulagen: [
    { id: "polizei", name: "Vollzugspolizeiliche Aufgaben (z. B. Feldjäger)", nr: "9", nurGruppen: "A3-A16",
      dauer: [ { label: "nach 1 Jahr", betrag: 95 }, { label: "nach 2 Jahren", betrag: 228 } ] },
    { id: "cyber", name: "Cyberverteidigung", nr: "16", nurGruppen: "A3-A16", nebenAnderen: "differenz",
      staffel: [ { gruppen: "A3-A5", betrag: 150 }, { gruppen: "A6-A9", betrag: 200 },
                 { gruppen: "A10-A13", betrag: 250 }, { gruppen: "A14-A16", betrag: 300 } ] },
    { id: "aufklaerung", name: "Fernmelde- und elektronische Aufklärung", nr: "8a",
      staffel: [ { gruppen: "A3-A5", betrag: 103 }, { gruppen: "A6-A9", betrag: 141 },
                 { gruppen: "A10-A13", betrag: 174 }, { gruppen: "A14-A16, B1-B11", betrag: 206 } ] },
    { id: "itbetrieb", name: "IT-Betrieb der Bundeswehr", nr: "18",
      staffel: [ { gruppen: "A3-A5", betrag: 96 }, { gruppen: "A6-A9", betrag: 128 },
                 { gruppen: "A10-A13", betrag: 160 }, { gruppen: "A14-A16, B1-B11", betrag: 192 } ] },
    { id: "nachrichten", name: "Nachrichtendienste (z. B. MAD)", nr: "8",
      staffel: [ { gruppen: "A3-A5", betrag: 150 }, { gruppen: "A6-A9", betrag: 200 },
                 { gruppen: "A10-A13", betrag: 250 }, { gruppen: "A14-A16, B1-B11", betrag: 300 } ] },
    { id: "oberste", name: "Oberste Bundesbehörde (z. B. BMVg)", nr: "7", nichtNebenAVZ: true,
      staffel: [ { gruppen: "A3-A5", betrag: 165 }, { gruppen: "A6-A9", betrag: 220 },
                 { gruppen: "A10-A13", betrag: 275 }, { gruppen: "A14, A15, B1", betrag: 330 },
                 { gruppen: "A16, B2-B4", betrag: 400 }, { gruppen: "B5-B7", betrag: 470 },
                 { gruppen: "B8-B10", betrag: 540 }, { gruppen: "B11", betrag: 610 } ] },
    { id: "combatcontroller", name: "Combat Controller (Luftlande- und Fernspähkräfte)", nr: "5b",
      quelle: "Anlage IX, eingefügt durch BGBl. 2025 I Nr. 72",
      auswahlLabel: "Qualifikation",
      dauer: [ { label: "bis zur Basisqualifikation Stufe B", betrag: 150 },
               { label: "nach Basisqualifikation Stufe B", betrag: 300 },
               { label: "nach Basisqualifikation Stufe C", betrag: 350 } ] },
    { id: "flugtechnik", name: "Flugzeugtechnisches Personal", nr: "5", differenzNeben: ["4"],
      staffel: [ { laufbahn: "Mannschaften", betrag: 53 },
                 { laufbahn: "Unteroffiziere", gruppen: "A3-A6", betrag: 53 },
                 { laufbahn: "Unteroffiziere", gruppen: "A7-A9", betrag: 75 },
                 { laufbahn: "Offiziere", betrag: 113 } ] }
  ],

  /* ---------- Auslandsverwendungszuschlag ---------- */
  auslandsverwendung: {
    // Tagessätze nach § 3 Abs. 1 AuslVZV, Höchstsatz nach § 56 Abs. 3 BBesG
    gueltigAb: "6. März 2025",
    fundstelle: "§ 3 AuslVZV, BGBl. 2025 I Nr. 78",
    hoechstsatz: 153,
    tagessatzJeStufe: { 1: 54, 2: 77, 3: 93, 4: 111, 5: 131, 6: 153 },
    // Welche Stufe für einen Einsatz gilt, legt das Verteidigungsministerium fest und ist nicht
    // amtlich veröffentlicht. true, solange die Zuordnung unten nur ein Beispiel ist. Auf false
    // setzen, sobald sie geprüft ist: Dann verschwinden die Beispiel-Hinweise auf der ganzen Seite.
    gebieteBeispiel: true,
    gebiete: [
      { id: "kfor", name: "Kosovo (KFOR)", stufe: 3 },
      { id: "irak", name: "Irak", stufe: 5 },
      { id: "mittelmeer", name: "Mittelmeer (Marine)", stufe: 2 },
      { id: "sonst", name: "Anderes Einsatzgebiet", stufe: 1 }
    ]
  }
};
