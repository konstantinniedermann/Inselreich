# Designvorschlag: M13 „Spätspiel mit Richtung“ (I-031, I-039)

Stand: 2026-10-10 · Autor: lead-design (Werte und Bilanzen: design-economy-designer) · Paket M13-BRAINSTORM ·
Prozessstufe voll · Gate: Brainstorming (L0) · Grundlage: `docs/ideen.md` I-031, I-039 (mit I-030), R448 ·
Rechnung: [Anhang 01](2026-10-10-spaetspiel-vorschlag/anhang-01-rechnung.md) (Abschnitte A–D, alle Zahlen mit
Herleitung). Recherche: keine; die Mechaniken (wählbarer Erlass, Prestigebau in Abschnitten) sind Genre-Gemeingut,
Namen und Inhalte sind eigen (ADR-006).

## 1. Spielerzweck in einem Satz

Nach dem Bürger-Ziel gibt der Spieler seiner Insel mit einem **Edikt** in der Amtsstube eine Richtung (eins von
drei, ein Wechsel kostet und sperrt), und nach der Handelsstadt setzt er sich mit dem **Denkmal** ein selbst
gewähltes Grossprojekt, in das Geld und Überschussware fliessen und das er in drei Abschnitten wachsen sieht.

Säulen: Wirtschaft über Steuern und Handel (stärkt: Geld bekommt einen Zweck, Edikte sind eine Ausschluss-Wahl),
Produktionsketten (stärkt: Stein, Werkzeug, Glas und Gewürz werden über den Hausbedarf hinaus geplant), Insel
besiedeln (stärkt: sichtbares Wahrzeichen als Langzeitziel). Misslingt der Vorschlag, leidet die Säule
Bevölkerung: Ein Pflicht-Edikt oder ein Denkmal, das den Häusern die Ware wegzieht, machte Aufstieg und Versorgung
zur Pflichtübung. Beides schliessen Dominanz-Check (B.4) und Lieferregel (C.4) aus.

## 2. Heute und Problem

- **Geld ohne Senke.** Die Bilanz nach Zukauf liegt bei 2310 / min am Bürger-Ziel, 3180 / min bei 60 Kaufleuten
  und 5040 / min bei 80 Kaufleuten mit Gewürzroute (Anhang A.1; Referenz-Kolonie mit 4 Häusern). Netto bleiben je
  Einwohner und 10 s 7,7 / 7,1 / 10,5 Geld. Ausser Bauen gibt es keine Ausgabe; die Kasse wächst ohne Entscheid.
- **Ware ohne Ziel.** Wer über den Hausbedarf hinaus baut, kann den Überschuss nur verkaufen; die
  Verkaufssättigung (Boden 30 %) macht das ab 6 Stück / min je Gut wertlos (B.2, H1-Formel).
- **Ziel 3 endet offen.** Nach der Gewürzstadt steht «danach spielst du frei weiter»; I-030 (Wahlziele) trug
  nicht, weil Bilanz-Ziele in Minuten erreicht sind.
- **Korrekturen an den Ideen** (Anhang 0, B.2, C.3): I-031 nannte für «Sparen» ≈ 240 / min Ersparnis, tatsächlich
  sind es +84 bis +221 / min mit dem hier vorgeschlagenen Steuerabzug. I-039 nannte Gewürz und Glas die Engstelle;
  das gilt nur für die Erzeugung, am Kontor sind beide jederzeit kaufbar. Die Konkurrenz ist eine Geldfrage, und
  genau das macht das Denkmal zur Geldsenke.

## 3. Ansätze

### Ansatz A · Zwei Hebel, gestaffelt (Empfehlung)

Edikte (ab Ziel 1) und Denkmal (ab Ziel 2) sind getrennte, lose gekoppelte Systeme. Die einzige Kopplung ist
gewollt: Das Handels-Edikt senkt die Kaufpreise, also wird Geld billiger zu Denkmal-Ware.

- Für: Jedes System trägt allein und ist allein lieferbar (Etappen). Die Edikte setzen genau am Übergang
  „Stunde 1“ an, das Denkmal in Stunde 2. Edikte sind eine Ausschluss-Wahl, die mit der Phase kippt (B.4); das
  Denkmal ist eine Senke mit sichtbarem Ergebnis. Keine Wertänderung an bestehenden Defs.
- Gegen: Zwei Panels, zwei Save-Erweiterungen. Edikte allein senken die Kasse nicht (600 Geld sind in Phase (c)
  7 s Einkommen); die Geldsenke liefert erst das Denkmal.

### Ansatz B · Ein System: Denkmal mit Privileg-Lohn

Jeder fertige Denkmal-Abschnitt schaltet ein dauerhaftes Privileg frei (die drei Edikt-Wirkungen), ohne Wechsel.

- Für: Eine Mechanik, ein Panel, das Denkmal hat einen mechanischen Grund.
- Gegen: Nach drei Abschnitten wirken alle drei Privilegien gleichzeitig, die Ausschluss-Wahl fällt weg und die
  Aufstiegs-Beschleuniger stapeln sich (genau die Gefahr aus R448). Mit Lohn wird das Denkmal zum Pflichtbau. Die
  Richtung kommt erst in Stunde 2, die Lücke nach Stunde 1 bleibt.

### Ansatz C · Nur Edikte, mit laufenden Kosten

Drei Edikte, aber statt 600 einmalig kostet das aktive Edikt Unterhalt im Verhältnis zur Steuer.

- Für: Kleinster Umfang (Sim plus Panel, keine Grafik), sofort nach Ziel 1 spürbar.
- Gegen: Laufende Kosten skalieren mit dem Einkommen und sind damit nie eine Senke, nur ein Abschlag; der
  Warenüberschuss bleibt ohne Ziel, nach Ziel 3 fehlt weiter ein Ziel. Löst die Kernfrage zur Hälfte.

**Empfehlung A.** Nur A beantwortet beide Hälften der Kernfrage (Richtung fürs Geld und für die Ware) und erhält die
Ausschluss-Wahl. B verliert die Wahl, C die Senke.

## 4. Regeln des empfohlenen Entwurfs

### 4.1 Edikte

E1. **Ein Edikt.** Der Weltzustand trägt `edict: EdictId | null` (Start `null`) und `edictLockedUntil: number`.
Genau ein Edikt ist aktiv oder keines. Es gilt für alle Inseln.

E2. **Freischaltung und Ort.** Edikte sind ab dem Bürger-Ziel (`world.won`) im Panel der Amtsstube wählbar. Vorher
ist der Abschnitt sichtbar, aber gesperrt («Erst nach dem Bürger-Ziel»). Die Wirkung ruht, solange die Amtsstube
nicht wirkt (nicht angebunden, brennt), wie `effectiveTaxLevel`; Edikt und Sperre bleiben stehen.

E3. **Kosten und Sperre.** Erlassen und Wechseln kosten je 600 Geld (`EDICT_COST`), nur bei Geld ≥ 600; danach ist
der Wechsel 3000 Ticks (5 min) gesperrt (`EDICT_LOCK`). Aufheben ohne neues Edikt ist ein Wechsel auf «keins»
(kostenlos, sperrt ebenfalls). Abriss der Amtsstube beendet das Edikt ohne Erstattung; die Sperre bleibt (kein
Sperr-Reset durch Abriss und Neubau).

E4. **Die drei Edikte** (Werte in `src/sim/defs/edicts.ts`, `EDICTS`):

| Edikt         | Wirkung                                                                  | Preis            | gewinnt, wenn …                                   |
| ------------- | ------------------------------------------------------------------------ | ---------------- | ------------------------------------------------- |
| **Sparen**    | Unterhalt aller Gebäude und Schiffe −20 %                                | Steuer −7 Punkte | die Kolonie steht und nichts kauft (Phase c)      |
| **Handel**    | Kaufpreise am Kontor −20 %, über die Gesamtmenge aufgerundet             | —                | Ware zugekauft wird (Gewürz in b, Denkmal-Zukauf) |
| **Wohlfahrt** | Wachstumstakt 40 statt 50 Ticks, Aufstiegs-Wartezeit 200 statt 300 Ticks | Steuer −5 Punkte | viele neue Häuser hochgezogen werden (Welle)      |

- Steuerabzug in **Prozentpunkten** vom Satz der Steuerstufe (normal 100 → 93 bzw. 95; Kaufleute «hoch» 115 →
  108 bzw. 110); `taxUnits` bleibt ganzzahlig, `TAX_CARRY_DIVISOR` unverändert (B.1).
- Unterhalt: Summe einmal mit `(100 − 20) / 100` gerechnet und abgerundet, nur wenn ein Abzug wirkt.
- Handel: `buyPrice = ceil(n · buy · 80 / 100)`. Aufrunden ist Pflicht: Mit Abrunden läge die Marge gegen die
  Auftragsprämie bei Nahrung, Wolle und Zuckerrohr bei 0. Aufgerundet bleibt je Stück mindestens 1 Geld Abstand zu
  Prämie und Boom-Verkauf, kein Kauf-und-Liefern-Gewinn (B.5).
- Wohlfahrt wirkt auf den Takt, weil die Wartezeit allein eine tote Option ist: Ab der Bürger-Stufe bremst die
  Füllzeit (350 Ticks) und nicht die Wartezeit, und auf Pionieren und Siedlern ist «niedrig» billiger (B.3). Der Takt
  wirkt in beide Richtungen: Bei Mangel schrumpfen Häuser ebenfalls schneller. Das ist der zweite Preis.

E5. **Stapelregel der Aufstiegs-Beschleuniger.** Die Wartezeit eines Hauses ist das Minimum der einzelnen Wirkungen
(Steuerstufe, Fest, Wohlfahrt) und nie kleiner als `TAX_LEVELS.low.upgradeWait` (150 Ticks); nichts multipliziert
sich. Der Defizit-Faktor ×2 greift **nach** dem Minimum (wie heute in `population.ts`). «hoch» bleibt ohne
Aufstieg; Wohlfahrt schaltet ihn nicht frei. Fest wirkt weiter nur auf Häuser mit «normal».

### 4.2 Denkmal

D1. **Bau.** Neues Gebäude Denkmal (3×3, Kategorie «Öffentlich», `BUILDING_DEFS.monument`), höchstens eines, nur
auf der Heimatinsel, im Versorgungsradius, angebunden. Baukosten beim Setzen klein (Bauplatz; Wert in der Spec).
Unterhalt 0. Frei ab Ziel 2 (`world.wonMerchants`), vorher fehlt es in der Bauleiste und die Taste nennt den
Grund.

D2. **Drei Abschnitte** (`MONUMENT_STAGES` in `src/sim/defs/monument.ts`):

| Abschnitt   | Geld beim Start | Stein | Werkzeug | Glas | Gewürz |
| ----------- | --------------- | ----- | -------- | ---- | ------ |
| 1 Fundament | 4000            | 200   | 80       | 60   | 40     |
| 2 Mauern    | 6000            | 200   | 80       | 140  | 100    |
| 3 Krone     | 8000            | 200   | 80       | 160  | 100    |
| **Summe**   | **18 000**      | 600   | 240      | 360  | 240    |

Das Geld wird beim **Start** eines Abschnitts abgebucht (nur bei Geld ≥ Betrag, nie ins Minus). Ein Abschnitt
gilt als fertig, wenn alle Waren geliefert sind; der nächste startet erst auf Knopfdruck. Die gleichmässige
Verteilung ist Absicht: Mit 300 Stein im ersten Abschnitt dauerte der Bau wegen der Lagergrenze 50 statt 33 min.

D3. **Lieferregel L2.** Solange «Bau läuft» (Schalter, Standard an), zieht das Denkmal je Gut 1 Stück je 10 Ticks
aus dem Heimatlager, aber nur über der **Reserve** `max(20, ceil(8 · Hausverbrauch des Guts je 100 Ticks))`
(Glas und Gewürz in Phase c: 64; Stein und Werkzeug: 20). Die bedarfsabhängige Reserve überbrückt eine
Schiffs-Rundreise (500–800 Ticks); eine feste Reserve 20 trüge das nicht, ein Knopf «alles liefern» (L1) könnte
Glas und Gewürz auf 0 ziehen und Ziel 3 um bis zu 6 min verschieben (C.4). «Bau pausieren» stoppt den Zug, etwa
um Überschuss zu verkaufen.

D4. **Zukauf je Gut.** Im Denkmal-Panel trägt jedes Gut des laufenden Abschnitts einen Schalter «zukaufen»: Fehlt
das Gut über der Reserve, kauft der Zug das Stück zum Kontor-Kaufpreis (mit Handels-Edikt −20 %) direkt ins
Denkmal, nur bei Geld ≥ Preis. Die Zugrate bleibt 1 Stück je 10 Ticks, also dauert auch der Vollzukauf ≥ 10 min.
Begründung: Ohne Schalter hiesse Zukauf rund 100 Klicks am Kontor («10 kaufen», Lagergrenze 100); mit Schalter
ist die Frage «Geld oder Zeit» je Gut eine Entscheidung statt einer Klickarbeit. Die Wirtschaft ist dieselbe wie
beim Kauf am Kontor (C.2). Offen als O7.

D5. **Wahlziel.** Ist Abschnitt 3 fertig, erscheint einmal «Wahlziel erreicht: Das Denkmal steht!»; die
Inselchronik führt es. Es gibt **keinen** mechanischen Lohn (kein Pflichtbau); `won`, `wonMerchants` und
`wonSpice` bleiben unberührt. Das Bild zeigt Bauplatz, Abschnitt 1, 2 und 3 als eigene Stufen (prozedural,
`src/render/sprites.ts`).

D6. **Abriss** ohne Erstattung von Geld und Ware (kein Geldtrick über Abschnitts-Geld); das Denkmal kann danach
neu begonnen werden. Brand: Das Denkmal ist nicht brennbar (sonst entstünde eine Feuerwachen-Pflicht).

## 5. Kernzahlen der Rechnung

| Frage                               | Ergebnis (Anhang)                                                                                            |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Kasse je min nach Zukauf            | 2310 (Ziel 1) · 3180 (60 Kaufleute) · 5040 (80 Kaufleute mit Route) (A.1)                                    |
| Wert Sparen (−20 % / −7)            | +84 · +161 · **+221** / min; mit −5 Punkten +168 bis +432 und damit überall Standard (B.2)                   |
| Wert Handel H2                      | ≈ +84 · **+396** · +144 / min, im Denkmal-Zukauf **+1000** / min (B.2)                                       |
| Wert Wohlfahrt B                    | −210 · −459 · −528 / min stationär; Welle von 4 neuen Häusern in 5 min **+598** / min (B.2, B.3)             |
| Dominanz                            | jedes Edikt gewinnt ein Szenario, keines alle; H1 nur in einer Nische, entfällt (B.4)                        |
| Stapel «niedrig» + Fest + Wohlfahrt | Pfad Pionier → Kaufmann 790 statt 1200 Ticks, kostet stationär 459 / min; lohnt nur in der Welle             |
| Zyklisches Umschalten               | ≈ +2700 je Zyklus (≈ 180 / min, 3,6 % des Einkommens), an Einkaufsvolumen gebunden, kein Dauer-Exploit (B.6) |
| Denkmal aus eigener Erzeugung       | 33 min mit Referenz-Ausbau (3 Steinbrüche, 1 Werkzeugmacher, je 1 Zusatz-Glashütte und -Plantage)            |
| Denkmal voll zugekauft              | ≈ 10 min, 64 200 Geld (mit Handel 54 960) = 12,7 min Einkommen in Phase c (C.2)                              |
| Gewürz-Konkurrenz zu Ziel 3         | L2 oder Zukauf: 0 min; L1: bis +6 min (C.3)                                                                  |

Teilkäufe sparen kaum Zeit, weil Stein, Werkzeug, Glas und Gewürz in der Erzeugung gleichauf liegen (30–33 min):
Der Spieler wählt eine Linie (produzieren, zukaufen oder gemischt mit Ausbau der Betriebe), statt Einzellöcher zu
stopfen. Ein Zukauf kauft Zeit zu rund 1100 Geld je gewonnene Minute.

## 6. Wirkung auf Ziele und Siegbedingungen

- **Ziel 1 (50 Bürger):** unberührt, Edikte sind erst danach frei (Referenz 6750 Ticks, D.1).
- **Ziel 2 (60 Kaufleute):** Sparen und Handel verkürzen um 300 Ticks (6 % der Strecke nach Ziel 1), Wohlfahrt
  verzögert bei knappem Geld um mehr als 500 Ticks. Kein Edikt verkürzt ein Ziel stark.
- **Ziel 3 (Gewürzstadt):** Das Denkmal-Gewürz konkurriert nur, wenn der Spieler es aus der Erzeugung nimmt; mit
  L2-Reserve verschiebt sich Ziel 3 nicht. Das Denkmal steht ab Ziel 2 bewusst vor Ziel 3: Der Spieler entscheidet,
  ob er erst die Gewürzstadt hält oder erst baut. Gewürzstadt-Bedingung (Route aus eigener Plantage) unverändert.
- **Wahlziel Denkmal:** zählt nicht als Sieg; der Ziel-Chip zeigt nach Ziel 3 den Denkmal-Fortschritt, sobald ein
  Abschnitt läuft (Spec).
- **Spielstand mit Ziel 2 erreicht:** Edikte und Denkmal sofort verfügbar.

## 7. Save, Baseline, Tests

- **Save.** E1 bringt `edict` und `edictLockedUntil` (Save v11), E2 bringt `monument` (Abschnitt, gelieferte
  Mengen, Schalter «Bau läuft», Zukauf je Gut; Save v12, oder v11, wenn beide Etappen zusammen kommen). Ältere
  Stände werden mit Hinweis abgewiesen, Test für das Abweisen (Verfassung §3); Fixtures (`fixtureV*.ts`,
  `scenario-saves`) ziehen nach. Hash-Pins halten über eine Rückfaltung `foldBackToV10` (Muster `foldBackToV9`, I-028).
- **Baseline bitgleich.** Der Controller wählt kein Edikt und baut kein Denkmal: Steuerabzug 0, Unterhalt ohne
  Abzug gerechnet, Takt 50, Wartezeit unverändert, Kaufpreis `n · buy`, kein Zug. Der Referenz-Lauf ohne Edikt
  reproduziert 6750 / 11 500 Ticks (`balance.test.ts`, `balance-merchants.test.ts`). Kein RNG-Zugriff.
- **Keine Wertänderung** an bestehenden Defs; nur neue Konstanten (`edicts.ts`, `monument.ts`, `EDICT_LOCK` in
  `timing.ts`). Kein Balancing-Ruling nötig.
- **Neue Prüfungen (für die Spec):** Def-Test Wohlfahrt-Wartezeit ≥ `TAX_LEVELS.low.upgradeWait`; Arbitrage-Test je
  Gut (aufgerundeter Handelspreis > Auftragsprämie und > Boom-Verkauf); Stapel-Test (niedrig + Fest + Wohlfahrt =
  150, Defizit 300); Reserve-Test (L2 zieht nie unter die Reserve); Abschnitt startet nicht ohne Geld; Welle mit
  Wohlfahrt simuliert (der Referenz-Controller baut keine neuen Häuser, B.3 ist nur gerechnet).

## 8. UI-Skizze

- **Amtsstube-Panel, Abschnitt «Edikt»:** drei Karten nebeneinander (Card-UI) mit Wirkung, Preis in Klartext
  («Steuer −7 Punkte») und Knopf «Erlassen (600)»; die aktive Karte hervorgehoben, Knopf «Aufheben». Bei Sperre
  «wieder änderbar in m:ss». Vor Ziel 1 blass mit Grund. Kopfzeile: Tooltip des Steuerknopfs nennt das Edikt.
- **Denkmal-Panel:** Abschnitt n / 3 mit Fortschrittsbalken je Gut («Glas 84 / 140»), Reserve je Gut, Schalter
  «Bau läuft» / «Bau pausieren», Schalter «zukaufen» je Gut mit Preis je Stück, Knopf «Abschnitt n beginnen
  (Geld)». Eine Zeile nennt die Restdauer bei heutiger Zugrate.
- **README:** neue Abschnitte «Edikte» (unter Amtsstube) und «Denkmal» (unter Ziel); Spielanleitung mitführen.

## 9. Etappen und erstes spielbares Release

| Etappe         | Pakete                                                                                                                                                       | Inhalt                                          | Grösse         |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------- | -------------- |
| **E1 Edikte**  | M13-E1-SIM (Edikte, Stapelregel, Takt aus dem Weltzustand, Save v11) · M13-E1-UI (Panel, README)                                                             | erstes spielbares Release: Richtung ab Stunde 1 | M, ≈ 150 Tools |
| **E2 Denkmal** | M13-E2-SIM (Gebäude, Abschnitte, Zug, Reserve, Zukauf, Wahlziel, Save) · M13-E2-ART (Sprite in 4 Bildstufen) · M13-E2-UI (Panel, Chronik, Ziel-Chip, README) | zweites Release: Senke und Ziel ab Stunde 2     | M, ≈ 200 Tools |
| E3 Feinschliff | Playtest, Mengen ±30 % per Def-Wert                                                                                                                          | nach Playtest, nur Werte                        | S              |

- **Erstes spielbares Release = E1.** Begründung: setzt am frühesten in der Partie an (Ziel 1), braucht keine
  Grafik, ist allein spielbar (Handel lohnt schon mit gekauftem Gewürz, Phase b) und bereitet die Denkmal-Kopplung
  vor. Das Denkmal löst die Geldsenke, kommt aber erst ab Ziel 2 ins Spiel.
- **Parallelität (R67):** M13-E2-ART (prozedurales Sprite, `src/render/`) hängt nur an der Spec und kann neben
  E1 laufen; M13-E1-SIM und M13-E1-UI laufen nacheinander (UI liest die Sim-Aktion).
- **Mitnahme I-035** („Betrieb stilllegen“, geparkt bis zur nächsten Save-Änderung, R448): passt technisch in
  Save v11 von E1, ist aber ein eigenes S-Thema. Offen als O10.

## 10. Nicht im Umfang

Weitere Wahlziele (I-030 bleibt in I-039 aufgegangen), mehrere Denkmäler oder Denkmäler auf Fremdinseln,
mechanischer Lohn des Denkmals, Edikte je Insel, mehr als ein aktives Edikt, frei einstellbare Edikt-Werte,
Wartung oder Verfall des Denkmals, Controller-Strategie mit Edikt oder Denkmal, Änderungen an Zielen 1–3, an
`TAX_LEVELS`, am Fest oder an bestehenden Preisen, Handel H1 (Sättigungs-Erholung), Story-Rahmen (I-018).
**Kein Säulen-, Genre- oder Titelwechsel:** Der Vorschlag ergänzt die Säulen Wirtschaft und Besiedeln innerhalb des
Genres; keine Warteschlange nach Verfassung §5.3.

## 11. Offene Entscheide mit Empfehlung

| Nr. | Frage                                                        | Empfehlung                                                                                       | Entscheider |
| --- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ | ----------- |
| O1  | Ansatz A, B oder C?                                          | **A** (beide Hälften der Kernfrage, Wahl bleibt erhalten)                                        | L0          |
| O2  | Reihenfolge der Etappen                                      | E1 Edikte zuerst, E2-ART parallel, E2 danach                                                     | L0          |
| O3  | Wohlfahrt auf den Takt (40 / 200 / −5) oder nur zwei Edikte? | Takt-Hebel; Rückfall zwei Edikte (Sparen, Handel), falls die Welle in der Simulation nicht trägt | L0          |
| O4  | Sparen −7 statt −5 Steuerpunkte                              | −7 (mit −5 überall Standard)                                                                     | L0          |
| O5  | Handel H2 (Kaufpreise −20 %, aufgerundet) statt H1           | H2                                                                                               | L0          |
| O6  | Freischaltung Edikte Ziel 1, Denkmal Ziel 2 (Idee: Ziel 3)   | Ziel 1 / Ziel 2: trifft Stunde 1 und 2, Denkmal und Gewürzstadt werden eine Reihenfolge-Wahl     | L0          |
| O7  | Zukauf-Schalter je Gut im Denkmal-Panel                      | ja (gleiche Wirtschaft wie am Kontor, ohne 100 Klicks)                                           | L0          |
| O8  | Lieferregel                                                  | L2 mit bedarfsabhängiger Reserve und «Bau pausieren»                                             | L0          |
| O9  | Edikt-Preis 600, Sperre 5 min, keine Wechselgebühr           | so lassen; Wechselgebühr 1500 nur, falls der Playtest Umschalt-Takt zeigt                        | L0          |
| O10 | I-035 in Save v11 mitnehmen?                                 | ja als eigenes S-Kurzdesign neben E1, nicht in dieselbe Spec                                     | L0          |
| O11 | Denkmal-Mengen                                               | Tabelle D2, nach dem ersten Playtest ±30 % per Def-Wert                                          | L0          |

Kein Entscheid gehört dem Nutzer (§5.3 nicht berührt).

## 12. Selbstprüfung Gate Brainstorming

Urteil: **OK mit Bedenken** (B1–B3).

1. **Säulen:** stärkt Wirtschaft, Produktionsketten und Besiedeln; die gefährdete Säule Bevölkerung ist durch
   Stapelregel (Minimum, Untergrenze 150), Dominanz-Check und Reserve geschützt.
2. **Spielerzweck in einem Satz:** ja (Abschnitt 1). Im ersten Spiel von 15 Minuten ist er **nicht** spürbar, weil
   beide Hebel erst nach Ziel 1 bzw. 2 frei werden; das ist Absicht (Spätspiel). Sichtbar ist früh nur der
   gesperrte Edikt-Abschnitt in der Amtsstube als Ausblick. Playtest mit Spielstand ab Ziel 1.
3. **Scope:** begrenzt (Abschnitt 10), zwei Etappen in einem Meilenstein, jede allein lieferbar.
4. **ADR-006:** nur Mechaniken; «Edikt», «Denkmal», «Sparen», «Handel», «Wohlfahrt» sind Gattungswörter.
5. **Einfachere Variante:** zwei Edikte statt drei (Rückfall O3); Denkmal ohne Zukauf-Schalter (dann Klickarbeit).
   Beide verlieren Spielerlebnis, der Entwurf bleibt bei drei und mit Schalter.

Bedenken:

- **B1 Wohlfahrt-Welle nur gerechnet.** Der Takt-Hebel ist die einzige Regel, die eine bestehende Konstante zur
  Weltgrösse macht (`GROWTH_INTERVAL` je Edikt) und auch das Schrumpfen beschleunigt. Auflage für die Spec: Welle
  simulieren; trägt sie nicht, Rückfall zwei Edikte.
- **B2 Kleine Edikt-Werte im Endzustand.** Sparen +221 / min sind 4 % des Einkommens in Phase c; spürbar wird die
  Wahl vor allem über Handel im Zukauf und Wohlfahrt im Ausbau. Playtest-Frage: Wechselt der Spieler das Edikt,
  wenn er das Denkmal beginnt?
- **B3 Referenz-Ausbau als Annahme.** Die Denkmal-Dauer (33 min) hängt am angenommenen Zusatzausbau; Ausbaustufen
  der Betriebe verkürzen sie. Mengen stehen in einer Def-Datei und sind nach dem Playtest nachstellbar.

**Playtest-Frage (ab Spielstand Ziel 1):** Erlässt der Spieler ohne Erklärung ein Edikt und kann er sagen, warum
dieses? Beginnt er das Denkmal nach Ziel 2 vor oder nach der Gewürzstadt, und nutzt er «zukaufen»?
