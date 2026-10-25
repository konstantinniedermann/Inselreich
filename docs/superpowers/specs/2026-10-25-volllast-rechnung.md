# Rechnung «Volllast» (I-215)

Stand 2026-10-25 · Paket `RECHNUNG-VOLLLAST` · Prozessstufe leicht · `design-economy-designer` für `lead-design` ·
Rechenweg, Formeln, Kettentabelle und Wertebereich: [Anhang 01](2026-10-25-volllast-rechnung/anhang-01-rechenweg.md).
`src/` und `tests/` unverändert. **Gerechnet, nicht gemessen:** Alle Zahlen kommen aus den Defs und aus Formeln. Es gab
keinen Wrapper- und keinen Replay-Lauf.

## 0 Kurzfassung und Empfehlung

**Urteil: Spec ja (Stufe voll, ein Häppchen), mit vier Änderungen gegenüber dem I-215-Eintrag.** Volllast ist ein
**Kredit in Ware**: Man zieht `E` Einheiten vor und verliert danach in der Ruhe `R ≈ 2 × E` (Rückzahlquote `D` 2,0–2,3,
Anhang A.2). Daraus folgt eine echte Dreifach-Wahl, die an der **Lage der Kette nach dem Stoss** hängt und nicht am
Kontostand allein:

- **Kette am Anschlag** (der Ausfall in der Ruhe muss ersetzt werden): Volllast kostet 2,1–2,5 × Zukauf. Hier ist der
  **Zukauf** richtig, oder ein weiterer Betrieb.
- **Kette mit Überschuss** (der Ausfall wäre verkauft worden): Volllast kostet 0,77–1,16 × Zukauf. Das ist die
  **Messerkante**, hier entscheiden Frist und Kasse.
- **Kette läuft über** (das Lager wäre voll gelaufen): Volllast kostet 0,08–0,33 × Zukauf. Hier ist die **Volllast**
  richtig.
- **Ruhige Stadt ohne Lücke:** **Abwarten** ist richtig. Volllast verschiebt nur Ware und kostet Unterhalt.

**Dauer-Volllast ist unter allen 34 Betrieb-Stufen-Kombinationen schlechter als Normalbetrieb:** Ausstoss 77–80 %,
Unterhalt 110–120 %. Auf gedrosselten Betrieben (Eingang fehlt) kostet sie gleich viel Ausstoss und mehr Unterhalt.
Bei vollem Ausgangslager spart sie zwar Eingangsware gegenüber dem verschwenderischen Normalbetrieb, verliert dort
aber gegen Stilllegen (I-035). Eine Entartung gibt es also nicht (§5). Diese Sicherheit hängt an zwei Bedingungen:
Aufrunden des Zyklus und Mehr-Unterhalt > 0.

**Grenze (ehrlich):** Nach Ziel 2 bindet Geld nicht mehr (I-144, Zukauf-Rechnung §2). Dort ist der Zukauf immer die
bequeme Antwort, und Volllast ist ein Nebenhebel. Ihr Wahlfenster liegt im **Früh- und Mittelspiel** sowie bei
Aufträgen mit Frist (§4). Das gilt für jede Geldmechanik und spricht nicht gegen die Spec.

| Datei / Feld (neu)                                | Ist | Soll                                                             | Spielraum   | Auswirkung                                                                   |
| ------------------------------------------------- | --- | ---------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------- |
| `src/sim/defs/buildings.ts` `OVERTIME_CYCLE_PCT`  | –   | **75** (Zyklus in %, aufgerundet)                                | 70–75       | Weberei St. 1: 50 → 38 T, +11,4 Stoff je Volllast; Rinderfarm St. 3: 8 → 6 T |
| `src/sim/defs/buildings.ts` `OVERTIME_UPKEEP_PCT` | –   | **150** (Unterhalt in %, aufgerundet)                            | 150–175     | Weberei 15 → 23 je 100 T; muss > 133 bleiben (Schranke S0)                   |
| `src/sim/defs/timing.ts` `OVERTIME_TICKS`         | –   | **1800** (3:00 bei 1×)                                           | 1500–2400   | deckt einen Fernauftrag (1700 T, `timing.ts:36`)                             |
| `src/sim/defs/timing.ts` `OVERTIME_REST_TICKS`    | –   | **1200** (2:00 bei 1×)                                           | Paar s. A.4 | `D` 2,0–2,3; Fenster 3000 T = `EDICT_LOCK` (`timing.ts:66`)                  |
| Unterhalt in der Ruhe                             | –   | **`PAUSED_UPKEEP_PCT` 50** (`buildings.ts:303`), kein neues Feld | 50          | kein Pflichtklick «in der Ruhe stilllegen» (§8.6)                            |
| Gebäudefeld `overtimeAt` (`src/sim/save.ts`)      | –   | Starttick, optional; `SAVE_VERSION` + 1 (heute 18, `save.ts:55`) | –           | fehlt = Normalbetrieb → Baseline bitgleich                                   |

**Vier Änderungen gegenüber I-215 (`docs/ideen.md` I-215, «Mechanik»):**

1. Die Ruhe kostet den Stilllegungs-Unterhalt (50 %) und nicht 100 %.
2. Der Volllast-Zyklus wird aufgerundet (`ceil`), damit Dauer-Volllast bei jedem Zyklus sicher verliert.
3. Gespeichert wird ein Starttick statt zweier Zähler.
4. Der Knopf ist gesperrt, solange der Betrieb stillgelegt ist, brennt oder keine Strassenverbindung hat.

## 1 Ausgangslage

- **I-215** (`.worktrees/ideen-19/docs/ideen.md:430-441`): Knopf am Betrieb, Zyklus −25 % und Unterhalt +50 % für
  1800 T. Danach 1200 T Ruhe ohne Ausstoss mit laufendem Unterhalt; erst dann ist der Knopf wieder wählbar. Brandrisiko
  und Edikte bleiben unberührt.
- **Gegenspieler Zukauf (R918):** `BUY_RISE` 0 (`src/sim/defs/goods.ts:69`). Der Kauf am Kontor ist sofort und zum
  festen Listenpreis unbegrenzt möglich (`src/sim/trade.ts:106`); mit Edikt Handel kostet er 80 %
  (`src/sim/defs/edicts.ts:20`).
- **Stilllegen (I-035):** Kein Fortschritt und keine Entnahme (`src/sim/production.ts:34-37`). Unterhalt 50 %,
  aufgerundet (`src/sim/levels.ts:49-50`, `buildings.ts:303`). Schalten ist kostenlos und ohne Sperre
  (`src/sim/pause.ts:16-33`).
- **Produktion:** Der Eingang wird bei Fortschritt 0 entnommen (`production.ts:53-64`). Bei vollem Lager geht die
  Einheit verloren, der Betrieb läuft aber weiter und verbraucht Eingang (`production.ts:67-70`, `STORAGE_CAP` 100,
  `goods.ts:84`). Im Sturm wächst der Fortschritt nur bei jedem zweiten Tick (`production.ts:51`, `crises.ts:20`).
- Heute beschleunigt nichts einen einzelnen Betrieb auf Zeit. Rat und Inselvorteil wirken dauerhaft
  (`src/sim/defs/council.ts:12,24,36`, `src/sim/defs/sea.ts:82`).

## 2 Bezugsgrössen

| Phase  | Zeit (Typ K) | Kasse bindet? | typische Lücke / Frist                                                 |
| ------ | ------------ | ------------- | ---------------------------------------------------------------------- |
| Früh   | min 0–11     | ja            | Holz, Nahrung (Hungerbrücke ≤ 20)                                      |
| Mittel | min 11–19    | ja            | Bittschrift 10–12 Stoff, Auftrag Stoff 6–12 in 600 T                   |
| Spät   | ab min 19    | nein (I-144)  | Bittschrift bis 40 Stoff, Sturm, Rum-/Glasaufträge, Fernauftrag 1700 T |

Phasen aus der Zukauf-Rechnung §2 (`design-zukauf`). Fristen: Auftrag 600 T (`src/sim/defs/timing.ts:31`), Periode
900 T (`:29`), Fernauftrag 1700 T (`:36`), Vertrags-Warnfenster 300 T (`goods.ts:83`). Erlöse: Auftrag
`floor(buy × 0,75)` je Stück (`goods.ts:73`, `orders.ts:41-43`), Vertrag `floor(buy × 0,68)` (`goods.ts:75`),
Strafe 100 % des Vertragswerts (`goods.ts:77`, `orders.ts:294-296`). 1 T = 100 ms bei 1× (`timing.ts:2`).

## 3 Mechanik als Formel (Kurzform, voll in A.1)

Volllast-Zyklus `c' = max(1, ceil(c × 75 / 100))`. Vorgezogen `E = 1800 / c' − 1800 / c`, Ausfall `R = 1200 / c`.
Mehr-Unterhalt je Fenster: `ΔU = (1800 × (u' − u) + 1200 × (uR − u)) / 100`, mit `u' = ceil(1,5 u)` und
`uR = ceil(0,5 u)`. Volllast ist billiger als Zukauf, wenn eine später entgangene Einheit weniger wert ist als
`v* = p × (1 − ΔU / (E × p)) / D`. Über alle Ketten liegt `v*/p` bei 0,32–0,46. Die Verkaufsquoten `s/p` liegen bei
0,30–0,45. Die Schwelle trifft also den Verkaufspreis.

## 4 Vergleich je Lage

Leitbeispiel Mittelspiel: **Weberei Stufe 1** (`buildings.ts:125-138`: Zyklus 50, Unterhalt 15; Stoff 30/12,
`goods.ts:33-39`). `E` = 11,4 Stoff in 1800 T, `R` = 24, `ΔU` = 60 Geld. Spätspiel: **Brennerei Stufe 3**
(`levels.ts:34`: Zyklus 20, Unterhalt 34; Rum 40/18, `goods.ts:47-53`). `E` = 30, `R` = 60, `ΔU` = 102.

| Lage                                                                    | Abwarten                                             | Zukauf                           | Volllast                                                                                  | weiterer Betrieb (Behelf)                                        | Urteil                                                         |
| ----------------------------------------------------------------------- | ---------------------------------------------------- | -------------------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------- |
| **A** Lücke 12 Stoff, Kette am Anschlag                                 | Lücke bleibt, Siedler-Steuer halbiert (`tiers.ts:7`) | 360 sofort                       | 60 + 24 × 30 = **780**, Lücke kehrt in der Ruhe doppelt zurück                            | ≈ 260 Bauverlust (`economy.ts:45`) + 90 Unterhalt, braucht Wolle | **Zukauf** oder dauerhaft bauen                                |
| **B** Lücke 12 Stoff, Kette mit Überschuss                              | füllt mit Überschussrate nach                        | 360 sofort                       | 60 + 24 × (0…12) = **60–348**                                                             | wie A                                                            | **Volllast**, ausser die Lücke drängt                          |
| **C** Auftrag 12 Stoff in 600 T (Prämie 22/Stück = 264)                 | nur, wenn Lager + Normalausstoss reicht              | −8 je Stück (30 gegen 22)        | +3,8 je Weberei in 600 T (A.3); mit Vorschau (`orders.ts:299`) früher starten             | 12 Stoff in 600 T                                                | **Volllast mit Vorlauf**, Rest zukaufen                        |
| **D** Fernauftrag 20 Stoff in 1700 T (440)                              | selten                                               | −8 je Stück                      | +10,7 je Weberei, Fenster passt (1800 ≥ 1700)                                             | möglich                                                          | **Volllast**                                                   |
| **E** Stammkunde 7 Stoff/900 T, Preis 20, Strafe 140, Warnfenster 300 T | Bruch: −140 + Vertrag weg                            | 210 (Verlust 70, Vertrag bleibt) | +1,9 im Warnfenster, zu langsam; mit Vorlauf die nächste Abrechnung in der Ruhe gefährdet | zu langsam im Fenster                                            | **Zukauf** im Fenster; Volllast nur mit Vorlauf und Überschuss |
| **F** Ruhige Stadt, keine Lücke                                         | kostenlos                                            | –                                | +60 Unterhalt, verschiebt nur                                                             | –                                                                | **Abwarten**                                                   |
| **G** Spätspiel, Rum-Stoss 30 bei 60 Bürgern (§7)                       | 30 Rum in 1000 T aus dem Überschuss                  | 1200, bindet nicht               | 102 + 30 × (0…18); 30 Rum in ≈ 640 T                                                      | –                                                                | gleichwertig; Zukauf ist bequemer                              |

**Keine Option dominiert:** Zukauf gewinnt in A und E, Volllast in B, C und D, Abwarten in F. Der Behelfsbetrieb ist
3 × schneller als Volllast (12 statt 3,8 Stoff in 600 T). Er braucht aber Baugüter, Platz, eine Strasse und meist
selbst Eingangsware. **Engpass wandert:** Eine Weberei in Volllast zieht Wolle alle 38 statt alle 50 T (+32 %). Ist
die Wolle knapp, verpufft die Volllast der Weberei, und die Schäferei ist der richtige Knopf. Das ist gewollt
(I-215, Bewertung lead-design) und muss im Panel sichtbar sein (§9).

**Gleichzeitige Volllast auf allen Betrieben einer Kette** lässt die ganze Kette danach 1200 T stillstehen. Staffeln
ist eine echte Entscheidung und kein Fehler; das Panel zeigt die Ruhe-Restzeit je Betrieb.

## 5 Dominanzprüfung

| Strategie                                           | Ausstoss gegen Normal                                                                                                                       | Unterhalt gegen Normal | Ergebnis                                                                                                                                                |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dauer-Volllast, ungedrosselt                        | 0,77–0,80                                                                                                                                   | 1,10–1,20              | **schlechter**, in beiden Grössen                                                                                                                       |
| Dauer-Volllast, Eingang gedrosselt (Rate ≤ 0,8 / c) | gleich (Eingang puffert in der Ruhe ≤ 960 / c Stück; Betriebe mit Eingang haben Zyklus ≥ 20, `levels.ts:32-35`, also ≤ 48 < 100 Lagerplatz) | 1,10–1,20              | **schlechter** um den Mehr-Unterhalt; S0 (A.4) sichert `ΔU` > 0                                                                                         |
| Dauer-Volllast, Eingang zwischen 0,8 / c und 1 / c  | zwischen 0,8 und 1                                                                                                                          | 1,10–1,20              | **schlechter**                                                                                                                                          |
| Dauer-Volllast, Ausgangslager voll                  | 0 (verfällt so oder so)                                                                                                                     | 1,10–1,20              | spart gegen Normal 600 / c Eingang (Weberei: 12 Wolle ≈ 60–144 gegen 60 Unterhalt). **Stilllegen** spart allen Eingang und 50 % Unterhalt und dominiert |
| 80 % Ausstoss gewollt (Überkapazität)               | Dauer-Volllast 0,8                                                                                                                          | 1,10                   | **Stilllegen im Takt** 20 % gibt 0,8 für 0,9 Unterhalt und dominiert                                                                                    |
| «Volllast, sobald das Lager leer ist»               | –                                                                                                                                           | –                      | in enger Kette Pendeln (Ruhe erzeugt die nächste Lücke), in Überschusskette selten ausgelöst: **keine Dominanz**                                        |
| Volllast → Abriss → Neubau statt Ruhe               | –                                                                                                                                           | –                      | §8.5: kostet ≥ Behelfsbetrieb, im Takt 35 Geld je Stoff (> 30 Zukauf): **keine Dominanz**                                                               |
| Ruhe in eine Störung legen (Sturm, Brand)           | spart ≤ 150 / c (Sturm 300 T halb, `timing.ts:48`)                                                                                          | –                      | Sturm-Vorwarnung 200 T (`timing.ts:46`) ist kürzer als 1800 T Volllast: nicht planbar                                                                   |

**Struktursicherheit:** Mit `ceil` gilt `c / c'` ≤ 100 / k = 1,33. Dauer-Volllast erreicht dann höchstens
`1800 × 1,33 / 3000` = 0,8 des Normalausstosses, für jeden Zyklus. Mit `floor` hätte ein Zyklus 2 den Faktor 2, und
Dauer-Volllast wäre mit 1,2 besser als Normalbetrieb (A.4 S5). Heute ist der kleinste Zyklus 8 (Rinderfarm St. 3,
`levels.ts:27`); mit Inselvorteil 50 % und künftigen Ratsbeschlüssen kann er sinken.

## 6 Wertebereich und Empfehlung

Vier Schranken (A.4) müssen für alle Ketten halten:

- **S0** Mehr-Unterhalt > 0: `OT × (m − 100) > RT × (100 − r)`.
- **S1** 1,5 ≤ `D` ≤ 3.
- **S2** `ρ` ≤ 0,5.
- **S3** 0,25 ≤ `v*/p` ≤ 0,6.

Dazu kommt **S4** als Spürbarkeit: `E` ≥ 8 bei Zyklus 50.

- **Empfehlung `k` 75, `m` 150, `OT` 1800, `RT` 1200, Ruhe 50 %:** Alle Schranken halten. Werte: `D` 2,00–2,33,
  `ρ` ≤ 0,33, `v*/p` 0,32–0,46, `E` 11,4. Es sind die I-215-Werte bis auf den Ruhe-Unterhalt.
- **Spielraum:** `k` 70–75 und `m` 150–175. Bei `k` 75 / `m` 150 funktionieren die Paare (`OT`, `RT`) = (1500,
  900–1200), (1800, 1200–1500) und (2400, 1500–1800). Faustregel: `RT ≈ 2 × OT × (100 − k) / k`.
- **Nicht wählen:** `m` ≤ 133 bei Ruhe 50 % (S0 bricht, `m` 125 macht Dauer-Volllast auf gedrosselten Betrieben
  billiger als Normal). `RT` ≥ `OT` bei `k` 75 (Knopf lohnt nur noch bei vollem Lager). `RT` 600 (`D` ≈ 1,
  Dauer-Volllast fast gleichwertig). Ruhe-Unterhalt 100 % (Pflichtklick, §8.6; `ρ` bis 0,78 bei Werkzeugmacher).
- **Stellhebel nach einem Playtest:** Ist Volllast zu selten sinnvoll, `RT` senken (1200 → 900, `D` 1,5–1,75). Ist sie
  zu oft sinnvoll, `m` heben (150 → 175). `k` bleibt; es bestimmt die Spürbarkeit.

## 7 Bilanz je Einwohner (je 100 T)

Rechenweg wie `2026-09-30-balancing-design.md` und Zukauf-Rechnung §6: Steuer minus anteiliger Unterhalt der Kette.
Netto eigen: Pioniere +1,0, Siedler +3,5, Bürger +7,5, Kaufleute +12,75. Verteuert wird nur der Betrieb in Volllast.
Aufschlag je Einwohner = Bedarf × Mehrkosten je Einheit (`tiers.ts:16,25,34,43`).

| Stufe (Betrieb St. 1) | Bedarf | Kosten je Einheit normal | in Volllast (`u' × c' / 100`) | Netto in Volllast | Kosten je Einheit über das Fenster 3000 T | Netto bei Dauer-Volllast |
| --------------------- | ------ | ------------------------ | ----------------------------- | ----------------- | ----------------------------------------- | ------------------------ |
| Pioniere (Fischer)    | 0,5    | 2,0                      | 8 × 30 / 100 = 2,4            | **+0,8**          | (144 + 36) / 60 = 3,0                     | +0,5                     |
| Siedler (Weberei)     | 0,2    | 7,5                      | 23 × 38 / 100 = 8,74          | **+3,25**         | (414 + 96) / 47,4 = 10,77                 | +2,85                    |
| Bürger (Brennerei)    | 0,2    | 10,0                     | 30 × 38 / 100 = 11,4          | **+7,22**         | (540 + 120) / 47,4 = 13,93                | +6,71                    |
| Kaufleute (Glashütte) | 0,1    | 12,5                     | 38 × 38 / 100 = 14,44         | **+12,56**        | (684 + 156) / 47,4 = 17,73                | +12,23                   |

Alle Stufen bleiben auch bei Dauer-Volllast positiv, also **keine Pleite durch den Knopf**. Der Preis ist Ausstoss
(−20 %), nicht Geld.

**Endzustand-Beispiel 60 Bürger, drei Brennereien Stufe 3** (Bedarf 12 Rum je 100 T, Ausstoss 15 je 100 T):

- Normal: 60 × 7,5 = **+450 je 100 T**. Über 3000 T entstehen 90 Rum Überschuss.
- Eine Brennerei in Volllast (1800 T): Unterhalt 34 → 51, also **+433**. Ausstoss 16,67 je 100 T, +30 Rum über das
  Fenster.
- Danach Ruhe (1200 T): Unterhalt 34 → 17, also **+467**. Ausstoss 10 gegen Bedarf 12; das Lager trägt 24 Rum aus der
  Volllast.
- Fenstermittel: 450 − 102 / 30 = **+446,6** (−0,06 je Einwohner). Der Überschuss sinkt von 90 auf 60 Rum.
- Ein Rum-Stoss von 30 kostet damit 102 Geld plus 30 nicht verkaufte Rum (0–540). Zukauf kostet 1200 (Lage G).

## 8 Randfälle

1. **Ruhe während laufender Frist:** Es gibt keine Sonderregel; die Ruhe ist nicht abbrechbar (I-215). Der Tooltip
   des Knopfs warnt, wenn das Ruhe-Ende nach der nächsten Vertragsabrechnung oder der Auftragsfrist liegt (§9). Das
   ist eine Warnung, keine Sperre: Wer bewusst vorzieht, darf das.
2. **Volllast bei leerem Eingangslager: Die Uhr läuft trotzdem ab (Empfehlung).** Gründe:
   - Einfach erklärbar («Volllast dauert 3:00»).
   - Gespeichert wird nur ein Starttick.
   - Eine Uhr, die nur bei Fortschritt zählt, liesse Volllast auf einem gedrosselten Betrieb «parken». Dann
     bräuchte es einen Zähler je Betrieb und eine Regel für den Sturm.
   - Der Knopf bleibt wählbar, zeigt aber «Eingang fehlt: Volllast verpufft».
3. **Pause und Zeitraffer:** Alle Fristen laufen in Ticks. Spielpause hält die Uhr an, Zeitraffer beschleunigt sie.
   Die Anzeige rechnet in Spielzeit bei 1× (`TICK_MS` 100, `timing.ts:2`): 1800 T = 3:00, 1200 T = 2:00.
4. **Speichern:** Optionales Gebäudefeld `overtimeAt` (Starttick, ganzzahlig, nur an Betrieben mit `produces`).
   - Phase abgeleitet: Volllast bei `tick − at < OT`, Ruhe bei `< OT + RT`, danach wird das Feld im Tick gelöscht.
     Ein Feld statt der zwei Zähler aus dem Briefing: Es gibt dann keine Invariante zwischen zwei Werten und kein
     widersprüchliches Paar.
   - Prüfung nachsichtig, nur `0 ≤ at ≤ tick`. Abgelaufene Felder gelten als Normalbetrieb. So bricht eine spätere
     Änderung von `OT`/`RT` keinen Spielstand (wie `feastAt`, `timing.ts:55-58`).
   - `SAVE_VERSION` + 1 (heute 18, `save.ts:55`; beim Merge main + 1). Ein alter Stand wird mit Hinweis abgewiesen,
     nicht migriert; dafür gibt es einen Test.
5. **Abriss während Volllast oder Ruhe:** Das Feld geht mit dem Gebäude, die Erstattung bleibt 50 %
   (`economy.ts:45`). Prüfung «Abriss + Neubau statt Ruhe»:
   - Weberei St. 1 verliert 100 Geld + 8 Holz + 2 Werkzeug ≈ 260 (Listenpreis). In enger Kette ist das billiger als
     die Ruhe (24 Stoff = 720), es ist aber genau der vorhandene Zug «Behelfsbetrieb bauen».
   - Im Dauertakt kostet es (260 + 144 Volllast-Unterhalt) / 11,4 ≈ 35 je Stoff, also mehr als Zukauf (30).
   - Holzfäller ≈ 6,5 je Holz, aber ein zweiter Holzfäller (50 Geld, 1 Werkzeug) dominiert.
   - Die Ausbaustufe geht beim Neubau verloren.
   - Ergebnis: **keine Sonderregel.**
6. **Stilllegen:**
   - Während der Volllast erlaubt: Die Uhr läuft weiter, der Stilllegungs-Unterhalt (50 %) hat Vorrang.
   - Während der Ruhe ändert Stilllegen nichts, weil die Ruhe schon 50 % kostet; die Uhr läuft.
   - Der Volllast-Knopf ist gesperrt, solange der Betrieb stillgelegt ist («Erst anfahren»).
   - **Darum Ruhe = 50 %:** Bei 100 % und «Stilllegen zählt als Ruhe» (I-215 Randfälle) spart jedes Stilllegen in der
     Ruhe 0,5 u × 12 (Weberei 90 Geld). Das wäre ein Pflichtklick für Optimierer und widerspräche dem Ziel «kein
     Pflicht-Klick». Lässt man stattdessen die Ruhe-Uhr beim Stilllegen anhalten, braucht es einen zweiten Zähler.
7. **Ausbau während Volllast oder Ruhe:** Erlaubt, das Feld bleibt. `c'` und `u'` folgen der neuen Stufe, der
   Fortschritt bleibt (`upgrade.ts:27`). Es gibt keinen Vorteil, weil der Ausbau dauerhaft bezahlt ist.
8. **Brand, Strasse, Sturm:**
   - Während eines Brands und ohne Strassenverbindung ist der Knopf gesperrt (Ursache als Grund).
   - Bricht während der Volllast ein Feuer aus, läuft die Uhr weiter; das Brandrisiko bleibt unberührt (I-215).
   - Im Sturm gilt die Halbierung weiter (`production.ts:51`), und Volllast wirkt relativ gleich (+32 %).
9. **Reihenfolge der Faktoren:** In `cycleOf` als letzter Faktor nach Stufe, Rat und Inselvorteil
   (`levels.ts:40-44`). Das Edikt Sparen wirkt auf die Summe inklusive Volllast-Unterhalt (`economy.ts:62-68`). Das
   Edikt Handel senkt den Zukauf auf 80 % und schiebt die Schwelle `v*` zugunsten des Zukaufs; Lage A bleibt gleich,
   B wird knapper.
10. **Fortschritt beim Phasenwechsel:** Ist der Fortschritt zu Beginn der Volllast ≥ `c'`, entsteht die Einheit im
    nächsten Schritt (`production.ts:67`). In der Ruhe friert der Fortschritt ein wie beim Stilllegen; die schon
    entnommene Eingangsware bleibt im Betrieb.
11. **Auslastung:** Die Ruhe zählt 0 wie Stilllegen. Die Auslastungsanzeige sinkt also in der Ruhe; das ist richtig
    und erklärbar über den Zustand «Ruht».

## 9 Erklärbarkeit (R896 (0)): Panel und Tooltip

- **Knopf «Volllast»** am Betriebs-Panel. Der Tooltip zeigt Ursache und Wirkung mit den echten Zahlen des Betriebs:
  - Zyklus «50 → 38 Ticks (+32 % Ausstoss)»;
  - Unterhalt «15 → 23 je 100 Ticks»;
  - Eingang «Wolle: 1 je 38 statt 50 Ticks»;
  - Ruhe «danach 2:00 Ruhe ohne Ausstoss, Unterhalt 8».
- **Gesperrter Knopf** nennt den Grund: «Ruht noch 1:05», «Volllast läuft noch 2:13», «Stillgelegt: erst anfahren»,
  «Brennt», «Keine Strassenverbindung».
- **Zustand** des Betriebs: «Volllast 2:13» oder «Ruht 1:05» (neuer Zustand, unterscheidbar von «stillgelegt»).
  Auf der Karte ein Symbol am Gebäude (Render-Strang).
- **Warnungen** im Tooltip, ohne Sperre: «Eingang fehlt: Volllast verpufft», «Lager Stoff voll: Volllast verpufft»
  und «Ruhe überdeckt die Vertragsabrechnung in 1:20».
- **Unterhaltsanzeige** (`stats.upkeep`) enthält den Mehr-Unterhalt. Fährt man über den Betrieb, steht «+8 durch
  Volllast» bzw. «−7 in der Ruhe».

## 10 Balancing-Test und Abnahmekriterien (Kandidaten)

Ohne gesetztes Feld laufen `cycleOf` und `buildingUpkeep` wie heute. Die Baseline ist bitgleich, der Controller
drückt den Knopf nicht, und `tests/sim/balance.test.ts` bleibt unverändert grün. **Kein Ruling zum Balancing-Test
nötig.** Vitest-Kandidaten:

- Zyklus 50 → 38 und 8 → 6 (`ceil`);
- Unterhalt 15 → 23 bzw. 8 in Volllast bzw. Ruhe;
- Uhr läuft bei `waitingInput`;
- Knopf gesperrt mit Grund (Ruhe, stillgelegt, brennend, nicht verbunden);
- Ruhe ohne Fortschritt;
- Feld nach `OT + RT` gelöscht;
- alter Save abgewiesen mit Hinweis;
- Dauer-Volllast über 3000 T liefert ≤ 80 % (Weberei 47 statt 60 Stoff).

## 11 Restrisiken

- Nicht gemessen: Ob Spieler die Lagen B, C und D erkennen, zeigt erst ein Playtest; die Stellhebel stehen in §6.
- Spätspiel: Der Zukauf bleibt bequem, weil Geld nicht bindet (I-144). Volllast ist dort Nebenhebel.
- Zyklen unter 4 durch künftige Rats- oder Inselfaktoren: `ceil` hält die Sicherheit, die Volllast wird dort aber
  wirkungslos (Zyklus 3 → 3).

## 12 Nicht im Scope

Volllast für Häuser, Dienste, Markt oder Kontor; Controller- oder KI-Nutzung; Brandrisiko; Edikt- oder
Ratsänderungen; Messung per Wrapper/Replay; Render-Symbol und Klang (eigene Stränge).

## 13 Entscheidungsbedarf (Entwürfe für L0, R471)

1. «I-215 Volllast: Spec Stufe voll, ein Häppchen, Werte `OVERTIME_CYCLE_PCT` 75, `OVERTIME_UPKEEP_PCT` 150,
   `OVERTIME_TICKS` 1800, `OVERTIME_REST_TICKS` 1200 — Rechnung zeigt Wahl Zukauf/Volllast/Abwarten je Lage, Dauer-
   Volllast schlechter in allen 34 Kombinationen — Kosten bei Irrtum: Werte in den Defs nachschärfen, Stellhebel §6.»
2. «Ruhe nach Volllast kostet den Stilllegungs-Unterhalt (`PAUSED_UPKEEP_PCT`), nicht 100 % — sonst Pflichtklick
   ‹in der Ruhe stilllegen› — Kosten bei Irrtum: Volllast etwas billiger (Weberei 60 statt 144 je Fenster).»
3. «Volllast-Zyklus `max(1, ceil(c × pct / 100))` als letzter Faktor in `cycleOf` — sichert Dauer-Volllast ≤ 80 % für
   jeden Zyklus — Kosten bei Irrtum: bei kleinen Zyklen weniger Wirkung.»
4. «Volllast-Uhr läuft in Ticks unabhängig vom Zustand; Knopf gesperrt bei stillgelegt, brennend, ohne Strasse —
   einfach erklärbar, ein Save-Feld — Kosten bei Irrtum: verpuffte Volllast bei leerem Eingang, im Tooltip
   angekündigt.»
5. «Save: ein Gebäudefeld `overtimeAt` (Starttick), nachsichtig geprüft, `SAVE_VERSION` + 1, alter Stand mit Hinweis
   abgewiesen — Kosten bei Irrtum: ein weiterer Save-Sprung.»
6. «Abriss während Volllast/Ruhe ohne Sonderregel (Erstattung 50 %) — Abriss + Neubau ist nicht billiger als der
   vorhandene Behelfsbetrieb — Kosten bei Irrtum: Sonderregel ‹keine Erstattung in Volllast/Ruhe› nachziehen.»
