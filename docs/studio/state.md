# Studio-Stand

Übergabe zwischen Sessions. L0 liest diese Datei beim Session-Start und führt sie beim
Session-Ende nach (STUDIO.md, „Session-Start und -Ende"). Nur aktueller Stand, keine Historie —
Historie steht in [rulings.md](rulings.md), Git und im Dashboard-Archiv.

Stand: 2026-10-25 (Session 8361ff82, R959–R970; live REL-32 `38b9f9a0`, Save v18 live; REL-33 Kandidat `be94bffe` nicht gepusht, Pin-Fix bereit; Verfassung 1.3, Handbuch 1.75 auf main, 1.78 auf `docs/coach-r957`)

## Release-Notizen

**REL-33 „Seerecht und gleitende Schiffe“ (Kandidat, NICHT live, R954)** — Save **v19** (Migration v18→v19). Kandidat `integrate/rel-33` @ `be94bffe`; push-check Exit 1 nur am Zeit-Pin D1 (auf main ebenfalls rot) → erst ZEITPIN-D1, dann push-check neu. Quelle: `.studio/handoffs/2026-10-25-lead-production-REL-33.md`.

- **Neu:** Seerecht (Ratskarte C, Stufe 4: Beschluss verkürzt Fahrten auf See); Schiffe gleiten flüssig statt im Tick-Takt (FIX-SCHIFF-A1). Studio: Handbuch 1.77, Playtester 1.10, IDEEN-18/19, TIEFE-3/4, Retro f8716d75.
- **Bitte testen:** (1) Seerecht beschliessen, während Schiffe fahren; (2) danach speichern und laden; (3) Schiffe bei x1 und x4, bei Pause Stillstand; (4) alten v18-Spielstand laden.

**REL-32 „Ehrenbuch und Ratsvorschau“ (live, R889, Zusatz-Release auf Nutzerauftrag R887)** — kein Save-Wechsel (v18). Inhalt: REL-32a/b (I-186 Ehrenbuch, UI-HAEPPCHEN-J, Pläne/Specs Inselproben,
I-201, I-197b, TIEFE-2, TOOL-REST-3, DOKU-RUNDE, COACH-R872), HAUSHALT-03, Retro 47d29586, HOTFIX-REL32. Push `ee51d4f1..38b9f9a0`, push-check Exit 0 (Startlast 8,8, Zeit-Pins nicht belastbar), CI-Lauf
40192693804, Pages-Lauf 40193070787 (grün). Quelle: `.studio/handoffs/2026-10-25-lead-production-REL-32.md`.

- **Neu:** Ehrenbuch mit Meisterstücken, bleibt über Partien (vom Studio vorgeschlagen, I-186); Warnmeldungen bleiben 7 s sichtbar; Ratsbeschlüsse in Chronik und Log; Ratskarte zeigt die Wirkung vorab.
- **Bitte testen:** (1) Ehrenbuch öffnen, Marke erreichen, «Neue Insel»: Buch bleibt; (2) Krisenwarnung bei 4× lesbar; (3) Ratsbeschluss fassen, Chronik; (4) Wirkungsvorschau mit vorhandenem Gebäude =
  tatsächlicher Effekt (im Browser nur «Wirkt noch nicht» geprüft); (5) alten Spielstand laden.

**REL-31 „Pläne und Werkzeug“ (live, R877)** — kein Save-Wechsel (v18), kein Spieleinfluss. Inhalt: Specs Ehrenbuch, Inselproben, Stadtrecht; Plan Ehrenbuch; Recherchen TIEFE-1, WIRTSCHAFT-TIEFE;
IDEEN-16; Retro REL-30 und Umsetzung (Handbuch 1.73); TOOL-MERGE-APPEND. Push `bc9664d0..ee51d4f1`, CI-Lauf 40184385005, Pages-Lauf 40184943166 (grün). Quelle: `.studio/handoffs/2026-10-25-lead-production-REL-31.md`.

- **Bitte testen:** nichts im Spiel.

**REL-30 „Kasse, Bestand und Davor-Stand“ (live, R866)** — kein Save-Wechsel (v18). Inhalt: UI-HAEPPCHEN-H P1 (I-147), UI-HAEPPCHEN-I A/B, UI-BEIPACK-FERN, LEBEN-SEE Klang, Werkzeug
(TOOL-LOADSNAP, -DASH-REST, -MESSFENSTER, -PUSHSPERRE A/P, -VORDERGRUND, -RUECKKANAL), Doku (BEOB-18, IDEEN-15, DOKU-AUDIT-1, Specs/Pläne Seerecht, LEBEN-STRASSE, LEBEN-SEE, UI-I, UI-BEIPACK,
AUFLAGEN-KERN, I-119/I-121). Push `d2376904..bc9664d0`, CI-Lauf 39936129287, Pages-Lauf 39937129992 (grün). Quelle: `.studio/handoffs/2026-10-23-lead-production-REL-30.md`.

- **Neu:** Zweiter Autosave-Platz «Davor laden» (vom Studio vorgeschlagen, I-147); Kasse-leer-Hinweis im Geld-Chip-Tooltip; Wachstumsbremse im Einwohner-Chip-Tooltip; Bestand im
  Bau-Tooltip; Fernauftrag-Feinschliff; leiser Anlegeton bei Schiffsankunft.
- **Bitte testen:** (1) «Davor laden», dann Seite neu laden: beide Stände richtig benannt und ladbar; (2) negative Bilanz herstellen, Tooltip Geld-Chip; (3) Bestand im Bau-Tooltip mit
  stillgelegtem Gebäude und anderer Insel; (4) Einwohner-Chip Wachstumsbremse; (5) Anlege-Klang (Hörurteil; bei Störung Revert vor dem nächsten Push).
- **Hinweis:** Pin-Reserve AK-E0-15a klein (R848). Push-Sperre (`pushgate`) blockt jeden Push ohne `push-check` Exit 0 auf genau diesem Hash.

**REL-29 „Fern-Marke und Wo-war-ich“ (live, R815)** — kein Save-Wechsel (v18). Inhalt: UI-HAEPPCHEN-G (I-155, I-148), Doku-Bündel (IDEEN-14, Specs/Pläne UI-HAEPPCHEN-G und -H,
WIRTSCHAFT-BS-1), TOOL-DASH-SCHLANK (Werkzeug ohne Spieleinfluss). Push `705af797..d9580844`, CI-Lauf 39747149002, Pages-Lauf 39748155515 (grün). Quelle:
`.studio/handoffs/2026-10-22-lead-qa-gate-REL-29.md`.

- **Neu:** (1) Die Marke an der Fern-Insel zeigt «· zu spät» in Orange, wenn Ware aus der Heimat die Frist nicht mehr schafft; der Hover-Text nennt Fahrzeit und Restzeit
  (vom Studio vorgeschlagen, I-155). (2) Beim Laden öffnet sich die Karte «Wo war ich?» mit Spielzeit, laufenden Fristen nach Restzeit (Auftrag, Fernauftrag, Fernangebot,
  Stammkunde, Auflage) und der Zahl offener Probleme; Esc oder «Weiter» schliesst sie, das Spiel bleibt pausiert; bei neuem Spiel und ohne Fristen und Probleme erscheint sie
  nicht (vom Studio vorgeschlagen, I-148). (3) Schlankeres Studio-Dashboard, neue Ideen- und Design-Entwürfe.
- **Bitte testen:** (1) Fernauftrag mit kurzer Restzeit und fehlender Ware: Marke «zu spät» orange, Hover mit Fahrzeit und Rest; (2) Ware ins Fern-Lager liefern: Marke wird normal
  ohne Neuladen; (3) speichern, neu laden, «Fortsetzen»: Karte mit Fristzeilen, Esc schliesst, Pause bleibt, `P` setzt fort; (4) «Los geht's» und «Neue Insel» zeigen keine Karte,
  Laden aus dem Menü schon; (5) Stammkunde mit zu wenig Lager: Zeile «nächste Lieferung in … · Lager reicht nicht».
- **Hinweis:** Push-Check endete mit Exit 1 (`perf.test.ts` 2,54 ms gegen Pin 2,5 ms), Push nachträglich angenommen (R815); Pin auf der ZEITRESERVE-PFLEGE-Liste.

**REL-28 „Fernkarte mit Fahrzeit“ (live, R789)** — kein Save-Wechsel (v18). Inhalt: I-136, Doku R778–R789. Push `add28350..e28c80c2`, CI-Lauf 39579768546, Pages-Lauf 39580738479
(automatisch). Quelle: `.studio/handoffs/2026-10-17-lead-qa-gate-REL-28.md`.

- **Neu:** Die Fernangebot-Karte zeigt die Fahrzeit der Lieferung; die Lagerzahl der Fern-Insel wird bei Mangel dunkelrot (Zahl bleibt sichtbar, Tooltip «Fehlt n Gut») und
  aktualisiert sich ohne Neuladen bei Lieferung (vom Studio vorgeschlagen, I-136).
- **Bitte testen:** (1) Fernangebot: Fahrzeit plausibel zur Schiffsdistanz; (2) Fern-Insel mit zu wenig Lager: Zahl «x/y» dunkelrot, Tooltip «Fehlt …»; (3) Ware per Schiff
  liefern: Zahl wird normal ohne Neuladen; (4) Fernauftrag-Karte: Zahl bleibt ungefärbt (bekannt); (5) Lesbarkeit der roten Zahl auf dem Pergament.

**REL-27 „Meisterprüfung“ (live, R779)** — Save **v18** (Migration v17→v18). Inhalt: I-132, TOOL-BUENDEL-15, TOOL-BUENDEL-16, Doku R773–R777 (Rulings-Archiv, IDEEN-13).
Push `6f14a354..add28350`, CI-Lauf 39033715341, Pages-Lauf 39034234219 (automatisch). Quelle: `.studio/handoffs/2026-10-17-lead-qa-gate-REL-27.md`.

- **Neu:** Nach dem fertigen Denkmal (auch in der Gewürz-Phase) wird der Ziel-Chip zum Knopf «Meisterprüfung»: 15 Minuten ohne Zukauf an Kontoren und Denkmal durchhalten,
  Einwohner nicht unter 70 % des Starts; Abbruch jederzeit, Lohn: Chronikeintrag «Meisterprüfung: Eigenversorgung bestanden» (vom Studio vorgeschlagen, I-132). Die Inselchronik
  zeigt den Stand der Prüfung.
- **Bitte testen:** (1) Denkmal bauen, Chip «Meisterprüfung» anklicken (Hand-Zeiger, Karte öffnet, Esc schliesst); (2) «Auflage beginnen»: Kauf gesperrt, Zähler läuft bis 15:00;
  (3) absichtlich scheitern (Einwohner unter 70 %): Meldung genau einmal, neuer Versuch möglich; (4) mitten in der Auflage speichern und laden, auch über den manuellen Slot; (5) Spielstand v17 laden.

**REL-26 „Rat, Vorwarnung, Klang“ (live, R753)** — Save **v17** (Migration v16→v17). Inhalt: I-112, I-122 + I-123, I-114, I-118, I-120, UI-AUFRAEUM-4, BEOB-17, PERF-BILANZ-COV, TOOL-BUENDEL-14, TOOL-GUARD-ALLOWLIST, TOOL-ACTIONS-FREI, IDEEN-12. Push `8fe744df..6f14a354`, CI-Lauf 38914539819, Pages-Lauf 38915602338 (automatisch per `workflow_run`). Quelle: `.studio/handoffs/2026-10-16-lead-qa-release-REL-26.md`.

- **Neu:** Der Rat tagt, sobald ein Haus Stufe 2, 3 oder 4 erreicht: Marke «Rat · n» in der Kopfzeile, `Umschalt+R` öffnet ihn, je Stufe ein Beschluss für die ganze Partie (kostenlos, nicht änderbar; vom Studio vorgeschlagen, I-112). Die Stammkunden-Karte warnt 30 s vor der Abrechnung bei behebbarem Fehlbestand, mit Klang (vom Studio vorgeschlagen, I-122); die Lager-Reichweite rechnet den Stammkunden mit (I-123). Fernangebot ist jetzt eine Wahl (I-114). Aufstiegs-Funkeln (I-118) und Wohlstandsklang (I-120). Menüabstand und Aufräumarbeiten; Werkzeug-/CI-Anpassungen ohne Spieleinfluss.
- **Bitte testen:** (1) Haus auf Stufe 2 bringen: Marke «Rat · 1», `Umschalt+R`, Beschluss fassen, Marke weg und Wirkung sichtbar; (2) Stammkunde: Lager knapp halten, 30 s vor Abrechnung erscheint Warnzusatz plus Klang, Fehlbestand beheben löscht ihn; (3) Spielstand v16 laden: Rat-Beschlüsse passend zu den Häusern, speichern und neu laden; (4) Fernangebot mit Kontor auf Fern-Insel: Wahl annehmen/ablehnen; (5) Haus steigt auf: Funkeln und Klang, bei Pause kein Klang.

**REL-24 + REL-25 „Ereignis-Log, Pause, Treue“ (live, R697)** — Save **v16** (Migration v15→v16). Push `2e7a269f..8fe744df`, CI-Lauf 38887719217,
Pages-Lauf 38888562306. Inhalt: UI-HAEPPCHEN-D/E/F, I-091, BEOB-15, TOOL-METRIK-ZEITRAUM. Quelle: `.studio/handoffs/2026-10-16-lead-qa-gate-REL-24-25.md`.

- **Neu:** Das Ereignis-Log zeigt alle Ereignisse (Verfall, Vertragslieferung und -bruch); Lagerchips nennen die Reichweite («↓ 2:00»); bei Pause
  erscheinen getönter Rand und Banner; die Auftragskarte zeigt das voraussichtlich nächste Gut (vom Studio vorgeschlagen); Stammkunden-Kulanz: nach
  5 Lieferungen verzeiht ein Vertrag einen Fehlbestand einmal (vom Studio vorgeschlagen); Fern-Inseln tragen eine Marke auf der Seekarte, das
  Schiff-Panel zeigt die Routen-Bilanz, der Bilanz-Chip Einnahmen und Unterhalt.
- **Bitte testen:** (1) Pause per Knopf, `P`, Leertaste: Banner sofort? (2) Stammkunde ohne Ware nach 5 Lieferungen: Toast «diesmal ohne Strafe», Kasse
  unverändert; (3) Spielstand v15 laden: Treue 0/5; (4) Log bei 20 Einträgen aufklappen; (5) Bilanz-Chip bei Verlust rot.

**REL-23 „Fernangebot“ (live, R667)** — Save **v15** (Migration v14→v15). Inhalt: Handel 2 (R658, gemergt `6faa189e`). Push `fb1e5e46..2e7a269f`
(R667, Zeitreserve-Ausnahme), CI-Lauf 38864279487, Pages-Lauf 38864281718. Quelle: `.studio/handoffs/2026-10-14-lead-qa-HANDEL-2-gate.md`.

- **Neu:** Mit Kontor auf einer fernen Insel erscheint neben dem Auftrag ein grosses Angebot für das Lieblingsgut der Insel (Möweninsel
  Stoff, Felsbucht Rum, Weidenau Glas); Annehmen ersetzt den Auftrag, Frist 2:50 ab Auftragsbeginn, geliefert wird am Kontor der Insel
  (Liefern nennt die Insel); Verpasst kostet nur diesen Auftrag, bei Annahme entfällt der nächste Auftrag; neue Log-Einträge bei Lieferung;
  ältere Spielstände laden verlustfrei.
- **Bitte testen:** (1) Kontor auf Möweninsel, Felsbucht, Weidenau: Fernangebot mit richtigem Gut; (2) annehmen, liefern, Frist ablaufen
  lassen: Belohnung, Meldung, Log-Zähler; (3) Spielstand v14 laden, speichern und mit offenem Fernangebot neu laden; (4) nach Lieferung
  erscheint zuerst das Stammkunde-Angebot (R9), nicht «Nächster Auftrag» wie im AK-Text.

**REL-22 „Aufgeräumt und nichts verpasst“ (live, R651)** — Push `ca46eb73..fb1e5e46`, CI 38571578702, Pages 38571610399. Kein Save-Wechsel
(v14). Inhalt: UI-AUFRAEUM-3 (R636), I-100 «Neu»-Zähler (R630), TOOL-ZEITRESERVE-21 (R631), TOOL-BUENDEL-12 (R618), BEOB-14 (R621),
REL22-FIX (R644).

- **Neu:** «Ereignisse ▸ (3 neu)» zählt verpasste Meldungen, solange das Log eingeklappt ist (vom Studio vorgeschlagen, I-100); Rangliste
  Unterhalt je Insel inkl. Heimatinsel (I-089); Rechtsklick im Linienzug beendet erst den Zug, dann das Werkzeug (I-098); Kartenstapel
  oben rechts geordnet (I-099); Vorliebe-Badge neben Boom.
- **Bitte testen:** (1) Log einklappen, Brand abwarten → «(1 neu)», aufklappen → weg; (2) Rangliste mit zwei Inseln; (3) Wege ziehen,
  Rechtsklick zweimal; (4) Krisen «aus» → keine Krisenkarte; (5) Spielstand v14 lädt.

**REL-21 „Stammkunde und Inselmarkt“ (live, R625)** — Push `0d1db8f3..ca46eb73`, CI 38553292584, Pages 38553994549 grün. Save **v14**
(Migration v13→v14). Inhalt: UI-HAEPPCHEN-A, -B, I-047 Stammkunde, UI-HAEPPCHEN-C, I092 Inselmarkt-Vorliebe, HOTFIX-REL21-PREIS
(Karte nennt den Inselpreis); dazu DOC-ARCHIV, TOOL-BUENDEL-11, TOOL-HOTFIX-ZR (nur Doku/Werkzeug).

- **Neu:** Stammkunde im Auftragsplatz (Liefervertrag, Kündigen, Abspringen mit Strafe; vom Studio vorgeschlagen, I-047) mit
  Marktvergleich und Knopf «Zum Erzeuger»; jede Fremdinsel zahlt für ein Konsumgut +30 % (Möweninsel Stoff, Weidenau Glas, Felsbucht
  Rum); «Lager voll» als Problem mit Sprung; «Bilanz danach» beim Bauen; Unterhalt-Fusszeile; Linienbau mit Umschalt.
- **Bitte testen:** (1) Stammkunden-Angebot annehmen, Lieferung nach 1:30, Kündigen; (2) Glas in Weidenau verkaufen (+30 %, Marke);
  (3) Lager voll → `.` springt hin; (4) Umschalt gedrückt Wege ziehen, Esc beendet; (5) alter Spielstand (v13) lädt.

**REL-20 „Inselcharakter“ (live, R594/R595)** — Push `19683ddf..0d1db8f3`, CI 38429087293, Pages 38429091182 grün. Dazu TOOL-ZEITRESERVE-M14. Save **v13** (Migration v12→v13). Inhalt: M14-E1
(Felsbucht «Gebirge+», dritte Fremdinsel Weidenau «Fruchtbar», Trait-Anzeige), UI-AUFRAEUM-2 (Refactor ohne Spieländerung),
TOOL-CONTROLLER-HAERTUNG, TOOL-BUENDEL-9 (nur Werkzeug/Tests). Opus-Final-Reviews je Strang OK.

- **Neu:** Felsbucht ist «Gebirge+» (Steinbruch und Glashütte ×2); neue Fremdinsel «Weidenau», «Fruchtbar» (Zuckerrohr und
  Schäferei ×2); Seekarte, Tooltip, Inspektor und Bauleiste nennen die Inselstärke.
- **Bitte testen:** (1) Seekarte: drei Fremdinseln, Tooltip nennt Stärke; (2) Steinbruch auf der Felsbucht erzeugt doppelt;
  (3) Zuckerrohr auf Weidenau doppelt; (4) alter Spielstand (v12) lädt, Felsbucht/Weidenau vorhanden; (5) Denkmal-Banner
  und Pause wie bisher.

**M13 „Spätspiel mit Richtung“ (REL-M13, live, R564)** — Push `801bee89..19683ddf`, CI 38212898470, Pages 38213478460 grün. Save v12. Inhalt: M13-E2 Denkmal, I-049
Sperrbestand, I-048 Schritt A (Mechanik eingebaut, **inaktiv**: Anzeige «Kauf 100 %», kein Aufschlag), UI-TEXTE-1,
UI-NAECHSTER-SCHRITT, TOOL-Bündel 6–8, E-060 (Budget-Hook `deny`). Actions-Prognose rot: Push-Takt nach Live-Ampel (R565 P4).

- **Neu:** Denkmal als Spätspiel-Ziel; Sperrbestand je Gut (I-049); Zukauf-Anzeige «Kauf 100 %» (noch ohne Preiswirkung);
  einheitliche UI-Texte (u. a. «Nur einmal je Insel»); Hinweis zum nächsten Schritt.
- **Bitte testen:** (1) Denkmal bauen und Sieg-/Ziel-Anzeige; (2) Sperrbestand setzen, Lager-Chip; (3) Handelsfenster
  zeigt «Kauf 100 %»; (4) alter Spielstand (v11) lädt; (5) Tooltip Amtsstube: «Nur einmal je Insel».

**REL-19 „Tasten, Aufräumen, Werkzeug“ (live, R512)** — Push `801bee89` (inkl. TOOL-BUENDEL-6 T01), CI 38123931614, Pages 38124390332 grün. UI-TASTEN
(R476/R479/R496), AUFRAEUM-01 (R485/R491), TOOL-BUENDEL-5 (R478/R482/R484/R494). Kein Save-Wechsel (v11), Baseline
unverändert. Opus-Final-Reviews je Strang erfolgt.

- **Neu:** `Entf` oder `Rücktaste` reisst das Gebäude im offenen Info-Panel ab (wie «Abreissen»); `Strg`/`Cmd`+`S`
  speichert in den manuellen Platz und unterdrückt den Browser-Dialog. Beide im Menü «Tastenkürzel». (vom Studio
  vorgeschlagen, I-056/I-057)
- **Bitte testen:** (1) echtes `Cmd+S` auf macOS in Chrome und Safari; (2) `Entf` auf Kontor
  (Heimatkontor bleibt, Fern-Kontor mit Route nennt den Grund); (3) gehaltene `Entf` reisst höchstens ein Gebäude ab;
  (4) `Strg+S` bei offener Startkarte/Menü schreibt nichts.

**REL-18 „Edikte, Stilllegen, Gut-Chip“ (live, R480)** — Push `a9f5336e..bfb6af44`, CI 38063457678, Pages 38063909955. M13-E1 (R467), UI-GUT-CHIP (R470), TOOL-BUENDEL-4
(R469). Save **v11** (Migration v10→v11), Balancing-Baseline unverändert (nur `balance-upgrade.test.ts`, eine Zeile
`buyPrice`, R456). Opus-Reviews je Strang erfolgt (T15 M13-E1, T09 UI-GUT-CHIP, Final-Review TOOL-BUENDEL-4).

- **Neu M13-E1 „Edikte der Amtsstube, Betrieb stilllegen“:** Nach dem Bürger-Ziel erlässt der Spieler in der Amtsstube ein
  Edikt (Sparen, Handel, Wohlfahrt; 600 Geld, danach 5 min nicht änderbar). Jeder Betrieb lässt sich stilllegen: halber
  Unterhalt (je Betrieb auf der 100-Tick-Basis aufgerundet), keine Erzeugung, zählt nicht als Problem.
- **Neu I-043 „Gut-Chip zeigt Erzeuger und Verbraucher“:** Klick auf einen Lager-Chip springt zum ersten Erzeuger, hebt
  Erzeuger und Verbraucher hervor; `.`/`,` gehen sie durch; zweiter Klick, `Esc` oder Inselwechsel beendet den Fokus.
- **Bitte testen:** (1) Amtsstube nach dem Bürger-Ziel: Edikt Sparen erlassen, Kopfzeile Unterhalt sinkt,
  Handel ist 5 min gesperrt (Sperrzeile, Tooltip). (2) Fischerhütte stilllegen: Zustand «Stillgelegt — halber Unterhalt»,
  sie verschwindet aus der Problemliste (`.`). (3) Holz-Chip klicken, `.` mehrmals: Kamera springt zu Holzfällern und
  Verbrauchern, `Esc` beendet. (4) Alter Spielstand (v10) lädt.

**REL-17 „Probleme finden, Wege abziehen“ (live, R463)** — Push `c282def0..a9f5336e`, CI 38055866019 grün, Pages 38056273377. Bitte testen: `.`/`,` springen zu Problemen; Abriss-Zug entfernt nur Wege, Warnung bei abgetrenntem Betrieb.

**REL-16 „Ruhiges Bauschild, sauberer Neustart“ (live, R463)** — Bitte testen: Bauschild «Kein Bauland: Gebirge» /
«Platz belegt: Weg»; «Neue Insel» räumt das Inselmenü ab.

**REL-15 „Klare Abhilfe, ruhiges Schild, saubere Seekarte“ (live, R446)** — Push `9eb99e77..c282def0`, CI 38038270428
**rot** (Sekunden-Flake im Studio-Test, Fix HOTFIX-CI-01 lokal), Pages 38038481954 grün. Bitte testen: «Mangel: Kapelle
fehlt» genau einmal mit Abhilfe darunter; Hover-Schild weicht der Karte; Kontor-Marke auf der Seekarte.

**REL-14 „Klarer Inspektor, Fest je Insel“ (live, R436)** — Push `46153c6..9eb99e7`, CI 38031718801, Pages 38031921572.
Bitte testen: Chip «Ausserhalb der Versorgung» / «Im Versorgungsradius» ohne Widerspruch; Fest daheim lässt Kolonie-Häuser
unbeeinflusst.

**REL-13 „Steuer je Stufe“ (live, R425)** — Steuer in der Amtsstube je Stufe, Save v10. Push `3417346..46153c6`, CI
37984641871, Pages 37985195805. Bitte testen: Pioniere «niedrig» / Kaufleute «hoch», Kopfzeile «gemischt», alter
Spielstand (v9) lädt mit bisherigem Wert, Kaufleute-«niedrig» ausgegraut.

**REL-12 „Seekarte“ (live, R413)** — Karte der Inseln mit Silhouetten, Fahrlinien und Schiffspunkten; Klick springt zur
Insel. Push `5d14854..3417346`, CI 37949164666, Pages 37949941925.

**REL-11 „Ruhiger Rand, lesbarer Seeweg, Meeresfels“ (live, R407)** — Kamera bleibt über Land, Schiffe mit hellem Saum,
Meeresfels wie Fels, Seeplan-Neubau schneller, Kontrast in Listen. Save v9.

**REL-10 „Kiefernküste, ruhige Kamera, freie Fahrrinnen“ (live, R398)** — Strandkiefern, Kamera-Klemmung,
Fahrrinnen frei von Wracks, Felsen und Eilanden. Save v9.

**REL-09 „Sichere Seewege, klarere Küsten, ruhigere Bauleiste" (live, R374)** — Schiffe fahren um Inseln, Küsten ohne
Rautenmuster, Bauleiste als Overlay, Klick aufs Kontor zeigt Schiffe. Save v9.

**REL-08 „Tasten-Komfort, flüssigere Insel, Gebäude-Panel" (live, R339–R346)** — Leertaste = Pause, Strg/Cmd+Klick =
Pipette, `Umschalt+U` = Ausbau, neues Gebäude-Panel, schnelleres Laden (Kaltstart Seed 7 22,8 → 8,3 s), Bauen im Wald
ohne Ruckeln, Wasserfall-Gischt, Menü bei 1280×720.

**REL-07 „Lebendige Insel" (live, R327)** — Küste mit Riffen, Schaum, Wrack; Entdecken im Gebirge (Bergsee, Wasserfall,
Höhle); Tiere und Delfine; Wald-Feinschliff WALD-02.

**REL-06 „Gewachsene Insel" (live, R301)** — organischerer Wald, weicher Gebirgsfuss, weiche Gebäudekanten, belebte Wiese.

**REL-05 (live, R277) — M12 Seefahrt-Bündel** — Kontor II auf Fremdinseln, Gewürz, Handelsschiffe mit Routen in 2 Klicks,
drittes Ziel «Gewürzstadt» (vom Studio vorgeschlagen, I-010), Inselwechsel `9`/`0`, Save v9.

**M12-E1 Archipel (R266/R268), REL-04 Fest in der Kapelle (R244), REL-01…REL-03 (Licht, Wiese, Dünen, Wirtschaftston)** — live.

## Fortsetzung beim nächsten Start

**Daueraufträge des Nutzers (R863: jede Nutzeranweisung gilt dauerhaft, ausser ausdrücklich nur für die laufende Session; im Zweifel dauerhaft):** **R862** freie Kapazität vorrangig für
Spieltiefe, neue Spielmodi und Erweiterungen, Web-Recherche erwünscht, **keine Playtests als Ideen-Input** (Browser-Checks zur Abnahme bleiben, R867), Schweigen des Nutzers = Zustimmung; **R445**;
**R826** (Deckel 10 bei grüner Limit-Ampel, ≤ 3 Test-Controller, ≤ 2 Browser); **R853/R856** (Arbeiter-Meldungen an den Lead; **L0 sendet jedem Lead direkt nach dem Start seine agentId**, R879);
**R868 V2** (Starts asynchron, Lead wartet ruhig). **R896** Spielregeln und Ausbau-Bedingungen fachlich erklärbar (Nachvollziehbarkeit und Logik, Gate-Kriterium); Nutzer-Playtests sind Input erster Ordnung, vor dem Pool. **R922** liegengebliebene Headless-Chrome (auch fremder Projekte) bei Störung selbst per `kill <PID>` beenden, nie das sichtbare Chrome, nie laufende eigene Browser-Läufe. **Push-Takt:** höchstens ein Push je Kalendertag (R816); voller Lauf nur `make push-check`. **R959** gelbe Ampel stoppt keine Wellen: neue Starts bis 5 h 85 %, ab 90 % Ende-Routine.

1. **REL-33 pushen zuerst** (Integrator, R968): in `integrate/rel-33` @ `be94bffe` mergen: `fix/zeitpin-d1` @ `eeb98d88` (Pin 3,5 ms), `docs/coach-r886` → `docs/coach-r920` → `docs/coach-r957`, `docs/retro-48c8580f`,
   `design/tiefe-5`, `design/ideen-20`, danach main (Doku-Commits R959–R970) und `docs/retro-8361ff82` (R971); `make push-check` auf dem neuen Hash, bei Exit 0 main vorspulen und **pushen (2026-10-26, R816)**.
   Danach **REL-34**: `feat/i201` @ `569602ab` (Gate BEDENKEN R951), `design/rueckfracht` @ `86097053`, `design/volllast` @ `add15171` (Spec frei R963).
2. **Umsetzung, ≤ 3 Test-Controller, Messungen nur bei Last ≤ 4, Controller staffeln (R920 V1; Messvorrang reicht nicht per Absprache, Beobachtung 2026-10-25):**
   - **I-210** (`feat/i210` @ `af16ee3a`, Budget 27 frei): Review T03, Wand-an-Wand-Messung, dann weiter; Phase 2 nach I-201-Merge. Handoff `.studio/handoffs/2026-10-25-lead-tech-I-210.md`.
   - **AUSBAU-LOGIK** (`feat/ausbau-logik` @ `38279658`, T01/T02 abgenommen, Budget 32 frei): T03 (Umsetzer per SendMessage fortsetzbar laut Handoff), T00-Messung, T04 ff.; Fixtures v6/v7 ins Final-Review (R969).
   - **HAFEN L1** frei (R961) — erster freier Controller-Platz; Hinweise T05/T06 (Timeouts) ins Briefing.
   - **I-214** (Plan `plan/i214-gruendungsbrief` @ `a101aac3`, Budget 34) — startbereit. **GEBAEUDE-VARIANZ**, **FLAECHE**, INSELPROBEN T12–T14, ORT-A, Stadtrecht, I-197/I-197b unverändert.
3. **Testfrei:** **Gate Plan I-215** (`plan/i215-volllast` @ `ce3f742d`, fertig, Vorprüfliste 1–5 erfüllt; P-1–P-9 entscheiden, E-VL-1 ja R969; Umsetzung beantragt 16 Starts).
   **«Neue Ufer» NU-1** (`design/neue-ufer`, R966/R970): lead-design sichtet Anhang 01 E-01–E-14, dann Spec-Nachtrag sonnet (Zahlen einsetzen, ≤ 40 KB, Anhang 02), Selbstabnahme, Gate Spec (ADR-010-Nachtrag). IDEEN-20-Folgen: Pitch I-222, Rechnungen I-221/I-223 (R967). E-080/E-081 (R971) nach REL-33-Merge in experimente.md eintragen (studio-coach); E-080: vor jedem Messpaket `make messfenster-sperre`.
4. **Save-Kette:** Nummern nur per Merge-Reihenfolge (R909): SEERECHT 19 (REL-33), danach je main + 1 (I-210 T16, I-214, GV, HAFEN S3/S4, FLAECHE FL-3, AL Etappe 2, Volllast).
5. **Erweiterung 2 «Neue Ufer»** (I-194): Designvorschlag frei (R966), Etappen NU-1…NU-4; NU-2 erst nach HAFEN/FLAECHE-Merge.
6. Messfristen R750/R755 2026-10-30, M1 2026-11-02, E-072/E-073 2026-11-19.

## Aktuelles Projekt und Phase

- Projekt: **Inselreich**. **M13 abgeschlossen** (live, R564). Live: REL-01…REL-29. **M14 „Archipel mit Wert“**: E1 Inselcharakter live (REL-20), ORT-A und Stadtplanung in Arbeit.
  Verfassung **1.3**, Handbuch **1.67**.
- Dauerregeln: Desktop-first (R78); kein Rebase; eine aktive L0-Session je Repo (R129, R324); studioweit **≤ 10 Agenten,
  davon ≤ 3 Test-Controller und ≤ 2 Browser-Läufe** (R826, ersetzt R698/R424); vor Paketstart `git worktree list`, `git status`, fremde Heartbeats
  prüfen (R329); Messungen nur bei 1-min-Load ≤ 4 (R329).
- **TOOL-TESTLOCK aktiv (R380):** `make check`, `make test`, `zeitreserve-push` brechen bei belegter Sperre oder
  1-min-Load > 8 ab (nicht warten); im Task nur gezielte Läufe; Messläufe haben Vorrang. Fake-Schalter nur in Tests (R378).
- **GitHub Actions mit Sparregeln (R334):** `CI` ignoriert Doku-Pushes, `Pages` nur per `gh workflow run Pages --ref
main` beim Release, `CI` mit `cancel-in-progress`.
- **Push-Takt (R816, Verfassung 1.3, Handbuch 1.67):** höchstens **ein Push je Kalendertag**, gebündelt, immer per geprüftem Hash; Live-Ampel-Regel (R565 P4) bleibt. Pakete werden nach dem
  **Teilbeleg** (gezielte Tests, `tsc`, `lint`, bei Werkzeug `studio-test`) je Strang abgenommen; der **volle Lauf** (`make push-check`, `VITEST_MAX_WORKERS=5`) läuft einmal je Release auf dem
  gebündelten Stand, grün vor Merge nach main und Push (R810, R816). Release-Auslöser lösen nur das lokale Bündeln aus (R817). Bei Exit ≠ 0 nie pushen (Integrator 1.17).
- **Rulings** mit Pflichtfeldern „Regelbezug“ und „Kosten bei Irrtum“; Abweichung vom Handbuch → Handbuch-Minor im selben
  Zug (R429). Ein-Paket-Release: Gate Merge und Release-Check in einem `lead-qa`-Start.
- **Modell-Guard** (`modelguard.py`, Modus `deny`) prüft Agent-Starts gegen die Modelltabelle in STUDIO.md; Modell nur
  nach dieser Tabelle (R420). Kopfzeile `Modell: <alias> (<Einsatz>)` bei stärkerem Modell als die Persona. Prettier-Pre-Commit-Hook aktiv (`make hooks`).
- **Arbeiter** nur per Benachrichtigung abwarten, kein Polling; `run_in_background: false` als Boolean; Controller mit Blocker
  `waiting` und Fortsetzung per `SendMessage` (Handbuch 1.39).

## Laufend

- Nichts aktiv. Session 8361ff82 bei 5 h ≈ 88 % beendet (R959); alle Leads haben gesichert. Session 48c8580f bei gelber Ampel (5 h ≈ 65 %) beendet; alle Leads haben übergeben (Handoffs `.studio/handoffs/2026-10-25-*`).

## Parallele Sessions

- Nutzer-Session `c6709a04` (seit 2026-10-11 ≈ 08:30Z): Konzept „Erweiterung“ (`lead-design`), Worktree
  `.worktrees/erweiterung-1`, Branch `design/erweiterung-1` — geduldet, Deckel geteilt (R519). Nicht anfassen.
- L0-Session anno-clone #2: seit 2026-10-16 ohne Heartbeat (R754); Ruling-Nummern trotzdem vor jedem Ruling gegen `origin/main` prüfen.

## Seit letzter Session erledigt

- **Session 8361ff82 (R959–R970, 2026-10-25):** R959 Dauerauftrag Wellen bei gelb (bis 85 %, Ende ab 90 %); ZEITPIN-D1 Pin 3,5 ms (R968); Gate Spec I-215 + Nachtrag + Kurzprüfung, Spec frei (R960/R963), Plan I-215 fertig (`ce3f742d`); Gegenlesen HAFEN OK (R961); COACH-R957 Handbuch 1.78 (R964); TIEFE-5 Rivalen (R965); IDEEN-20 (R967); «Neue Ufer» Brainstorming, Designvorschlag frei, NU-1 Werte und Spec als Zwischenstand (R962/R966/R970); I-210 T02/T03, AUSBAU-LOGIK T01/T02 (R969).
- **Session 48c8580f (R922–R956, 2026-10-25):** R922 Dauerauftrag Headless-Chrome; Gates Spec HAFEN/FLAECHE/I-214 + Nachträge + Gegenlesen; Gegenlesen GV/AL; **sechs Pläne** (I-210, AUSBAU-LOGIK, HAFEN, GV, FLAECHE,
  I-214) mit Gate Plan und Nachträgen, alle startbereit (HAFEN nach Gegenlesen); A1-Browser-Beleg + Konfliktmerge; REL-33 gebündelt (Push offen); I-201 abgenommen (R950) + Gate Merge; I-210 T00/T01, AUSBAU T01;
  Art-Brief HAFEN; TIEFE-4, IDEEN-19, Rechnungen Rückfracht und Volllast, Spec Volllast; Handbuch 1.77 (COACH-R920); Kurz-Retro.

## Pausierte Pakete

- `.worktrees/i048-b` (`feat/i048-b` @ `bc57f8ba`): verworfen, nicht mergen (R571); Aufräumen nur per Worktree-Ruling.
- Gemergte, aufräumbare Worktrees (nur per Ruling, `git worktree remove` ohne `--force`): `i048-sim`, `i048-ui`, `i049-sim`,
  `i049-ui`, `tool-b7`, `tool-b8`, `tool-e060`, `ui-texte-1`, `tool-gate-ensemble`,
  `tool-controller-haertung`, `m14-e1`, `m14-e1-ui`, `tool-b9`, `ui-aufraeum-2`, dazu aus b54ed3bd: `hotfix-rel21`, `tool-zr-hotfix`,
  `tool-b12`, `beob-14`, `tool-zr21`, `ui-aufraeum-3`, `i100`, `rel22-fix`, `plan-ui-aufraeum-3`, `design-i100`.
  Dazu gemergt bzw. erledigt: `tool-dash-sessionziel`, `tool-guard-warteagent`, `tool-dash-ziel-fix`, `ideen-10`, `handel-2`, `plan-handel-2`, `design-handel-2`.
  Aktiv behalten: `design-ui-d` (UI-HAEPPCHEN-D), `design-i109`. `.worktrees/integrate` bleibt.
  `.worktrees/erweiterung-1` gehört der Nutzer-Session (R519) — nicht anfassen.
- Branch `int/rel-07`, Alt-Branches, Remote `wip/r118a-render-aufraeumen`, `stash@{0}` (950f61d5) und `stash@{1}` (e20340a9) bleiben bis Ruling.

## Budget

Alle Freigaben dieser Session verfallen mit Session-Ende; Reste neu erteilen: I-210 27, AUSBAU-LOGIK 32, I-214 34, GV 58, FLAECHE 56, HAFEN 60, INSELPROBEN 31 von 43, ORT-A laut Handoff, Stadtrecht 25, I-197 4, I-215 Umsetzung beantragt 16 (Parallelität 2), design-NEUE-UFER 1 von 4.

## Offene Entscheide

- Nutzer: keine offen. N-104 beantwortet: Erweiterung 2 = «Neue Ufer» (R958); N-102 beantwortet (R922).
- L0: keine.
