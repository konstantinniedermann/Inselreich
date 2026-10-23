# Anhang 01 · Rechnung Auflagen-Kern: I-163 «Ausfuhrmeister» gegen I-161 «Eigenwuchs»

Stand 2026-10-22 · Paket `AUFLAGEN-KERN` · Wirtschaftsdesign für lead-design.
Abnahme lead-design: G3 + G4 (§5.1) sind in der Spec durch G3' ersetzt (eine Summe `c0`, keine Abriss-Sperre; Spec §4.4).
Kennzeichen: **[M]** Messwert aus I-132-Anhang (`2026-10-16-i132-meisterpruefung/anhang-01-rechnung.md`, Stand K'-arm,
Seed 3), **[G]** aus den Defs gerechnet, **[S]** geschätzt. Keine Testläufe. Einheit «je 100 Ticks» (10 s bei 1×);
9000 Ticks = 90 Blöcke = 15 min.

## 0 Kurzurteil

| Kriterium R805 (4) + R827         | I-163 Ausfuhrmeister (mit Gegenmitteln §5)                                       | I-161 Eigenwuchs                                               |
| --------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| (a) Bedarf weit über Lagergrenze  | **nicht über die Zielhöhe**, erfüllt nur mit Anrechnung des Startbestands (§2.3) | **nicht erfüllt**: Zuwachs-Bedarf 0,2–0,6 × Reichslager (§3.3) |
| (b) Geld kein Ausweg              | erfüllt (Sperre Zielgut + Vorprodukte; Erlös ≈ Unterhalt)                        | erfüllt (volle Sperre wie heute)                               |
| (c) Sperre der Zielgüter          | Zielgut + `consumes` des Erzeugers (§2.2)                                        | alle Bedarfsgüter + Vorprodukte + Baustoffe = volle Sperre     |
| (d) Lohn ehrenhalber              | erfüllt                                                                          | erfüllt                                                        |
| Neuer Zustand für die Gegenmittel | 3 Felder in `trial` (`good`, `sold`, `s0`), 2 Prüfungen                          | `c0`, Rekordwert je Tick (ausserhalb der Auflage), Haltezähler |
| Neu gegenüber «Eigenversorgung»   | ganz neu (Export, eigene Sperre); Überlappung nur Steinanteil                    | ≈ 13 % (Zuwachs), 87 % der Flüsse prüft A1 schon               |

**Empfehlung I-163**, nur mit vier Gegenmitteln (Startbestand anrechnen, Sperre je Zielgut, Verkauf zählt nur bei voller
Stadt, Abriss von Wohnhäusern gesperrt) und den Zielmengen **Rum 450 · Stoff 450 · Glas 320 · Stein 750** (Scout: Glas 360,
Stein 300). Ohne Gegenmittel ist I-163 kaputt: Ein Vorrat in 4 Kontoren und 4 Schiffen (bis ≈ 1000 Stück-Äquivalent) oder
die Steuer «hoch» (spart 75–155 % des Rum-Ziels) besteht die Auflage ohne einen neuen Betrieb (§5). I-161 nicht bauen.

## 1 Referenz-Spätstand

| Stand                   | Bürger | Kaufleute | Einw. | Steuer/100 | Unterhalt/100 | Netto/100 | Quelle                                 |
| ----------------------- | -----: | --------: | ----: | ---------: | ------------: | --------: | -------------------------------------- |
| K'-arm (52 Gebäude)     |     15 |        60 |    75 |       1530 |           690 |      +510 | [M] I-132-Anhang §1, §1.2 (Zukauf 330) |
| K'-arm mit A1-Plan      |     15 |        60 |    75 |       1530 |           810 |      +720 | [M]/[S] I-132-Anhang §2.4              |
| R100 (1 B-, 5 K-Häuser) |     15 |       100 |   115 |       2410 |             – |         – | [G] `15×14 + 100×22`                   |
| R140 (1 B-, 7 K-Häuser) |     15 |       140 |   155 |       3290 |             – |         – | [G]                                    |

Verbrauch je 100 Ticks [G] (`population.ts:100`: Bedarf wächst je Tick um `Einwohner × Rate ÷ 100`; Raten `tiers.ts:34,43`):

| Gut              | Formel                         | K'-arm | R100 | R140 |
| ---------------- | ------------------------------ | -----: | ---: | ---: |
| Rum, Stoff       | `0,2 × (B + K)`                |     15 |   23 |   31 |
| Glas, Gewürz     | `0,1 × K`                      |      6 |   10 |   14 |
| Stein (für Glas) | 1 je Glas (`buildings.ts:243`) |      6 |   10 |   14 |
| Nahrung          | `0,5 × (B + K)`                |   37,5 | 57,5 | 77,5 |

Raten der Betriebe Stufe 1 [G]: `100 ÷ cycle` (`buildings.ts`): Brennerei, Zuckerrohr, Weberei, Schäferei, Glashütte je 2,0
(Zeilen 164, 150, 136, 122, 244); Steinbruch 1,67 (108); Holzfäller 3,33 (95); Fischer 2,5 (54). Inselvorteil ×2
(`sea.ts:82–87`): Felsbucht Steinbruch und Glashütte, Weidenau Zuckerrohr und Schäferei. Ausbau Stufe 2/3 Zyklus ≈ ×0,6/×0,4
[S] (`docs/spielwerte.md:140`, `LEVELS` nicht gelesen).

Lagergrenzen [G]: `STORAGE_CAP` 100 je Insel und Gut (`goods.ts:84`, `trade.ts:127`); höchstens 4 Inseln mit Kontor
(Heimat + 3 Fremdinseln, `sea.ts:39–73`, ein Kontor je Fremdinsel); 4 Schiffe zu 50 (`sea.ts:4,8`). **Reichsvorrat eines
Guts: 4 × 100 + 4 × 50 = 600.** Mit Vorprodukten (Glas aus Stein + Holz, Rum aus Zuckerrohr, Stoff aus Wolle, je 1 : 1)
kommen weitere 4 × 100 hinzu, die Schiffsladung teilt sich: **≈ 1000 Stück-Äquivalent** je Exportgut, Stein 600.

## 2 I-163 «Ausfuhrmeister»

### 2.1 Zusatzbedarf je Zielgut (Rate `r = T ÷ 90` je 100 Ticks, Kette vor dem Start gebaut)

Betriebe je Einheit `r` [G]: Rum `½ + ½ = 1,0`; Stoff 1,0; Glas `½ + 1/1,67 + 1/3,33 = 1,4`; Stein `0,6`.

| Ziel              | r/100 | Betriebe E (ganzz.) | Geld | Holz |  Wz | Stein | Unterhalt/100 | Fläche Kacheln | E bester Insel | Erlös (≤ 10/100 voller Preis) |
| ----------------- | ----: | ------------------: | ---: | ---: | --: | ----: | ------------: | -------------: | -------------: | ----------------------------: |
| Rum 450           |  5,00 |         5,0 (3 + 3) | 1000 |   62 |  15 |    12 |            75 |             20 |  3,75 Weidenau |                          8100 |
| Stoff 450         |  5,00 |         5,0 (3 + 3) |  875 |   62 |  12 |     0 |          62,5 |             20 |  3,75 Weidenau |                          5400 |
| Glas 320          |  3,56 |     5,0 (2 + 3 + 2) |  907 |   57 |  18 |    18 |            71 |             10 |  3,0 Felsbucht |                          6400 |
| Stein 750         |  8,33 |             5,0 (5) |  750 |   50 |  15 |     0 |            50 |              5 |  2,5 Felsbucht |                          4500 |
| _Scout Glas 360_  |  4,00 |           _5,6 (7)_ | 1020 |   64 |  20 |    20 |            80 |             12 |            3,4 |                          7200 |
| _Scout Stein 300_ |  3,33 |       _**2,0 (2)**_ |  300 |   20 |   6 |     0 |            20 |              2 |            1,0 |                          1800 |

Alle [G]. Schiffe: **0**, wenn Kette und Verkauf auf derselben Insel liegen (jedes Kontor zählt). Kette auf Fremdinsel mit
Vorteil: + Kontor II (800 Geld, 20/8/10, `buildings.ts:252`), falls noch keins steht. Sturm (`stormAffected` bei Zuckerrohr,
Schäferei, Holzfäller) kostet im Mittel `10,6 % × ½ ≈ 5 %` Rohstoff [M] Sturmzeit I-132-Anhang §4 → Rum/Stoff +0,13 Farm.

**Eigenlücke (zustandsabhängig):** Die Sperre trifft auch den Eigenbedarf am Zielgut. Wer Stein bisher zukauft (K'-arm:
Stein-Zufuhr 0 [M]), muss bei Ziel Glas oder Stein zusätzlich `0,1 × K` Stein selbst machen: K'-arm 6/100 = 3,6 Steinbrüche
Heimat (1,8 Felsbucht), R140 14/100 = 8,4 (4,2) [G]. Rum und Stoff sind im Spätspiel schon eigen (K'-arm +1/100 [M]).

### 2.2 Welche Güter gesperrt werden müssen (c)

Regel: **Zielgut plus `consumes` seines Erzeugers** (eine Ebene, alle Vorprodukte sind Rohstoffe):
Glas → Glas, Stein, Holz · Rum → Rum, Zuckerrohr · Stoff → Stoff, Wolle · Stein → Stein. Aus `BUILDING_DEFS` ableitbar,
keine neue Tabelle. Andere Güter (Gewürz, Nahrung, Werkzeug) bleiben kaufbar: Kein Kauf eines anderen Guts ersetzt einen
Betrieb der Zielkette, also hält (b). Holz bei Glas spart höchstens Holzfäller (50 Geld), gesperrt der Einheitlichkeit halber. Folge im Code [S]: `trialBuyBlock(world, good)` statt `trialBuyBlock(world)` (`trial.ts:44`, `trade.ts:109`).

### 2.3 Lager und Kriterium (a)

| Ziel      | T ÷ 100 (je Insel) | T ÷ 600 (Reich, ein Gut) | T ÷ 1000 (Reich mit Vorprodukten) |
| --------- | -----------------: | -----------------------: | --------------------------------: |
| Rum 450   |                4,5 |                     0,75 |                              0,45 |
| Stoff 450 |                4,5 |                     0,75 |                              0,45 |
| Glas 320  |                3,2 |                     0,53 |                              0,32 |
| Stein 750 |                7,5 |                     1,25 |                        1,25 (600) |

[G]. Je Insel liegt der Bedarf über der Grenze, **reichsweit nicht**: Vor dem Start kaufen (Sperre gilt erst ab Start),
4 Kontore und 4 Schiffe füllen, Start, sofort verkaufen. Das besteht jedes Scout-Ziel ohne Betrieb. Damit der Vorrat unter
25 % des Ziels bliebe, müsste T ≥ 4000 sein (E ≈ 44 Betriebe) [G]: unspielbar. Der Scout-Satz «höchstens 100 Stück» rechnet
nur das Heimatlager; die Sättigung deckelt keine Menge, nur den Preis (`trade.ts:93,163`, Boden 30 %).
**Gegenmittel G1 (§5):** `s0` = Bestand des Zielguts + `min` der Vorprodukte, Summe über alle Inseln und Schiffsladungen,
beim Start festgehalten; bestanden bei `sold ≥ T + s0`. Damit zählt nur, was in der Auflage erzeugt wird; (a) gilt in der
Form «Lager trägt 0 %». **Urteil (a): nur mit G1 erfüllt** (Ruling-Entwurf R-1).

### 2.4 Bilanz je Einwohner (K'-arm, Ziel Rum, Zukauf Gewürz/Stein weiter erlaubt) [G]

```
Steuer 1530 − Unterhalt (690 + 75) − Zukauf 330 + Erlös 8100 ÷ 90 = +90   = +525  (Referenz +510)
```

| Stufe     | Einw. | Steuer | Unterhalt je Einw. (765 ÷ 75) | Zukauf je Einw. | Erlös je Einw. (90 ÷ 75) | Netto |
| --------- | ----: | -----: | ----------------------------: | --------------: | -----------------------: | ----: |
| Bürger    |    15 |   14,0 |                          10,2 |               0 |                      1,2 |  +5,0 |
| Kaufleute |    60 |   22,0 |                          10,2 |             5,5 |                      1,2 |  +7,5 |
| gesamt    |    75 |   20,4 |                          10,2 |             4,4 |                      1,2 |  +7,0 |

Ziel Glas: Steinzukauf entfällt (−90), dafür 4 Steinbrüche (+40) und Exportkette (+71), Erlös +71 → +560, je Einw. 7,5.
**Keine Senke, keine Quelle von Gewicht**: Bau ≤ 1000 Geld = 2 Blöcke Netto; Erlös und Unterhalt heben sich ±1400 über die
Laufzeit auf, ≤ 3 % des Laufzeit-Nettos 45 900 [M]. (b) erfüllt.

### 2.5 Dominanz innerhalb

- Gleicher Zusatz ohne Inselvorteil: E = 5,0 je Ziel (Tabelle 2.1). Scout-Stein 300 wäre mit **2 Steinbrüchen** (300 Geld)
  klar dominant, Scout-Glas 360 um 12 % schwerer als Rum. Daher Glas 320 und Stein 750.
- Kein Gut ist immer das leichteste [G]: Weidenau macht Rum und Stoff billig (3,75), Felsbucht Glas (3,0) und Stein (2,5).
  Stein 750 auf der Felsbucht passt aber nicht in deren 3 Plätze Stufe 1 (3 × 3,33 = 10/100, minus Eigenbedarf 6 bei
  K'-arm = 4/100 = 360) und braucht Stufe 2 an allen drei (3 × 5,56 − 6 = 10,7 ≥ 8,33) [S] oder Gebirge in der Heimat.
  Wer Stein zukauft, zahlt bei Glas/Stein die Eigenlücke (+1,8 bis +8,4 Betriebe): Für ihn sind Rum/Stoff leichter. Wer A1
  bestanden hat (eigener Stein), findet Glas/Stein leichter. Die Wahl spiegelt die eigene Wirtschaft (Wiederspielwert).
- Ratsbeschluss: Glasrecht senkt Glas-E um 14 % (1,4 → 1,2), Brennrecht/Webordnung Rum/Stoff um 10 % (1,0 → 0,9) [G];
  unumkehrbar und mit Verzicht auf Seite B bezahlt, kein Eingriff nötig.
- Grosse Stadt: Ziel absolut, E ≈ 5; bei R140 (≈ 100 Gebäude [S]) relativ leichter, hinnehmbar.

## 3 I-161 «Eigenwuchs»

### 3.1 Zusatzbedarf (+15 % der Einwohner Stufe ≥ 3, `Δ = ⌈0,15 × P3⌉`) [G]

Betriebe je zusätzlichem Einwohner: Bürger `0,5/2,5 + 2 × 0,1 + 2 × 0,1 = 0,6`; Kaufmann `0,6 + 0,05 + 0,06 + 0,03 + 0,05
(Plantage) = 0,79` plus Gewürz-Schiffsanteil.

| Stand  |  P3 |   Δ |                           Bürger-Pfad Betriebe | Kaufleute-Pfad Betriebe |       Häuser | Zeit Haus 1 → 3 |
| ------ | --: | --: | ---------------------------------------------: | ----------------------: | -----------: | --------------- |
| K'-arm |  75 |  12 | 7,2 (ganzz. 7 mit Überschuss +1 Rum/Stoff [M]) |            9,5 + Schiff | 1 Bürgerhaus | ≈ 950 Ticks     |
| R100   | 115 |  18 |                                           10,8 |                    14,2 |            2 | ≈ 950 Ticks     |
| R140   | 155 |  24 |                                           14,4 |                    19,0 |            2 | ≈ 950 Ticks     |

Zeit [G]: Stufe 1 voll nach 3 × 50, Wartezeit 300 (`timing.ts:10`) → 300; Stufe 2 voll nach 4 × 50 < 300 → 300; Stufe 3
voll 7 × 50 = 350; ohne Mangel ≈ 950 Ticks, mit Mangel doppelte Wartezeit (`timing.ts:12`). Geld K'-arm ≈ 1500 Bau +
Aufstieg (100 + 300, `tiers.ts:19,28`) [G]; Mehrsteuer +210/100 übersteigt den Mehrunterhalt 70/100.

Bilanz je Einwohner (K'-arm mit A1-Plan + 1 Bürgerhaus voll, 30 Bürger + 60 Kaufleute) [G]: Steuer 1740, Unterhalt
810 + 70 = 880, Netto +860; je Einw. 9,78 Unterhalt; Bürger +4,2, Kaufleute +12,2, gesamt **+9,6** (A1 allein 9,6 [M/S]).

### 3.2 Dominanz innerhalb

**Bürger-Pfad dominiert**: 24 % weniger Betriebe je Einwohner, kein Gewürz, kein Glas, keine Schiffe. Mit «Aufstieg anhalten»
(`population.ts:140`) bleiben neue Häuser Bürger. Noch billiger: vorhandene Siedlerhäuser aufsteigen lassen (+15 Bürger+ je Haus, 8 → 15, nur mit
Rum und Schule) und offene Ratsbeschlüsse Hofrecht/Wohnordnung erst nach dem Start wählen (+10 % bzw. +6,7 % Plätze ohne Haus,
`docs/spielwerte.md:412–413`). Eine Zielgrösse «nur Kaufleute» erzwänge Gewürz und Glas, prüft dann aber noch mehr A1.

### 3.3 Lager und Kriterium (a)

Was I-161 über A1 hinaus prüft, ist nur der Zuwachs. Dessen Mehrverbrauch [G]:

| Stand  | Rum, gewachsen ab Tick 1000 (80 Bl.) | Nahrung dto. | Rum nur letzte 1000 Ticks | Gewürz Scout-Pfad 80 K (90 Bl.) |
| ------ | -----------------------------------: | -----------: | ------------------------: | ------------------------------: |
| K'-arm |      192 (1,9 × Insel, 0,32 × Reich) |          480 |         24 (0,24 × Insel) | 108 (1,1 × Insel, 0,18 × Reich) |
| R100   |                 288 (2,9 × / 0,48 ×) |          720 |                        36 |                               – |
| R140   |                 384 (3,8 × / 0,64 ×) |          960 |                        48 |                               – |

Der Scout-Wert «825 = 8,3 × STORAGE_CAP» ist der **ganze** Glasverbrauch der Stadt; den prüft A1 schon. Prüft I-161 am Ende,
wächst der Spieler in den letzten ≈ 1000 Ticks aus dem Vorrat (24–48 Rum ≪ 100). Auch eine Halteregel über 6000 Ticks
(Muster `WIN_SPICE_HOLD`, `tiers.ts:58`) braucht nur 144–288 Rum, also ≤ 0,5 × Reichsvorrat. **Urteil (a): nicht erfüllt.**
(b) erfüllt (volle Sperre, wie `trial.ts:44`). (c) Zielgüter = Nahrung, Stoff, Rum, Glas, Gewürz, Wolle, Zuckerrohr, Stein,
Holz und Werkzeug (Bau, Aufstieg) → volle Sperre, keine Codeänderung. (d) erfüllt.

## 4 Vergleich und Empfehlung

| Merkmal                          | I-163 (mit G1–G4)                                                       | I-161                                           |
| -------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------- |
| Zusatz-Betriebe K'-arm           | 5 (+ Eigenlücke Stein bei Glas/Stein)                                   | 7 (Bürger-Pfad)                                 |
| Zusatz-Schiffe                   | 0 (Verkauf am Erzeugerkontor)                                           | 0 (Bürger-Pfad), 1 (Kaufleute-Pfad)             |
| Zusatz-Geld                      | 750–1000 Bau, Erlös ≈ Unterhalt                                         | ≈ 1500, Mehrsteuer > Mehrunterhalt              |
| Bedarf ÷ Reichsvorrat            | 0,53–1,25 ohne G1; mit G1 Lager wirkungslos                             | 0,04–0,64 je nach Prüfzeitpunkt                 |
| Trimm-/Vorab-Tricks schliessbar? | ja, zustandsarm (§5)                                                    | Vorab-Abriss nur mit Rekordwert je Tick (§5)    |
| Neu gegen «Eigenversorgung»      | Export und Kettenbau über Eigenbedarf; A1 prüft nur Gewürz/Stein-Zufuhr | +15 %; 87 % der Flüsse (`1 ÷ 1,15`) prüft A1    |
| Wiederspielwert                  | 4 Ziele, Inselwahl                                                      | einer                                           |
| Neuer Zustand                    | `good`, `sold`, `s0` in `trial`                                         | `c0` + `peak3` (Welt, jeder Tick) + Haltezähler |

**Empfehlung: I-163.** Es erfüllt (b)–(d) direkt und (a) mit G1 vollständig; seine Lücken lassen sich mit drei Feldern und
zwei Prüfungen schliessen. I-161 scheitert an (a) im Kern (der Zuwachs ist lagerfüllbar), seine schärfste Lücke (Vorab-Abriss)
braucht neuen Weltzustand ausserhalb der Auflage (Baseline-Risiko), und es prüft fast nur, was A1 prüft.

## 5 Entartete Strategien mit Gegenmittel

### 5.1 I-163

| #   | Strategie                                                                                                      | Wirkung [G]                                                                                                                         | Gegenmittel (Zustand)                                          |
| --- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| 1   | Vor dem Start Zielgut kaufen, 4 Kontore + 4 Schiffe füllen                                                     | bis 600 Stück, ≥ jedes Scout-Ziel ausser Stein 750                                                                                  | **G1** `s0` anrechnen (1 Zahl)                                 |
| 2   | Vorprodukte vorfüllen (Stein, Zuckerrohr, Wolle)                                                               | +400 Stück-Äquivalent, nur Verarbeiter nötig                                                                                        | G1: `s0` enthält `min` der Vorprodukte                         |
| 3   | Zukauf während der Auflage, Kauf-dann-Verkauf                                                                  | Geld ersetzt Kette                                                                                                                  | **G2** Sperre Zielgut + Vorprodukte (§2.2)                     |
| 4   | Steuer «hoch» (Belegung 0,75, `tiers.ts:63`)                                                                   | Rum 337 / 517 / 697 frei (K'/R100/R140) = 75–155 % des Ziels                                                                        | **G3** Verkauf zählt nur bei voller Stadt (s. u., zustandslos) |
| 5   | Aushungern (Gut knapp halten, auch Gewürz), Gütersperre der Amtsstube (`population.ts:94`)                     | bis Schwelle 70 %: Rum 405 / 621 / 837 = 90–186 %                                                                                   | G3                                                             |
| 6   | Wohnhaus während der Auflage abreissen (1 Kaufmannshaus = 360 Rum, 180 Glas) bzw. gegen Pionierhäuser tauschen | bis 27 % Einw. bei K'-arm                                                                                                           | **G4** Abriss von Wohnhäusern während «export» gesperrt        |
| 7   | Dienstgebäude/Markt abreissen → Häuser schrumpfen                                                              | wie 5                                                                                                                               | G3 (Häuser nicht mehr voll)                                    |
| 8   | Vor dem Start Kaufmannshäuser abreissen (kleinere Stadt, Ketten werden Überschuss)                             | 1,25 Häuser decken Rum 450; Kosten: Wiederaufbau ≈ 1300 Ticks, Aufstieg 1000 Geld + Material je Haus, Steuerausfall 440/100 je Haus | **keins** (Rest): teurer als 5 Betriebe; Playtest-Trigger §7   |
| 9   | Stammkunde/Aufträge/Fernangebot auf das Zielgut                                                                | ziehen Ware ab (`orders.ts:143,238`), zählen nicht                                                                                  | keins nötig (nur `sell` zählt)                                 |
| 10  | Sättigung `SELL_DROP`, Boom, Vorliebe +30 %                                                                    | nur Preis; Menge unbegrenzt                                                                                                         | keins nötig (Geld irrelevant)                                  |
| 11  | Mehrere Inseln/Fremdkontore                                                                                    | Inselvorteil senkt E um 25–50 %                                                                                                     | gewollt (Wahl), Zielmengen §2.5                                |
| 12  | Gutwechsel nach Start, Abbruch und Neustart                                                                    | –                                                                                                                                   | Gut fest ab Start; Abbruch setzt `sold` 0, `s0` neu            |
| 13  | Krisen: Sturm (Rum/Stoff −5 %), Brand auf Dienstgebäude                                                        | Brand: Häuser schrumpfen → G3 pausiert die Zählung ≈ 800 Ticks [M]                                                                  | gewollt; Lager 100 puffert die Pause, Feuerwachen-Hinweis      |

**G3 im Wortlaut:** `sell` zählt nur, wenn jedes Haus, dessen Stufe das Zielgut braucht (bei Stein: Glas), mit
`inhabitants ≥ maxInhabitantsOf(world, tier)` voll ist. Liest nur vorhandene Werte (`council.ts`-Helfer, Hofrecht inklusive),
Steuer «hoch» macht Häuser nicht voll (`population.ts:207`). Zustandslos. Variante G3' statt G3 + G4: `c0` = Plätze der
Bedarfsträger beim Start, Zählung nur bei Bedarfsträger-Einwohnern ≥ `c0` (eine Zahl mehr, dafür keine Abriss-Sperre).

### 5.2 I-161

| #   | Strategie                                                       | Wirkung [G]                                                            | Gegenmittel (Zustand)                                                            |
| --- | --------------------------------------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| 1   | Vor dem Start Steuer «hoch», nach dem Start «normal»            | +34 % (K'-arm 56 → 75) ohne Betrieb                                    | Basis = Plätze statt Einwohner (`c0`, 1 Zahl)                                    |
| 2   | Vor dem Start Bürger-/Kaufmannshaus abreissen, danach neu bauen | +15 in ≈ 950 Ticks mit vorhandenen Ketten, ≈ 450 Geld statt 7 Betriebe | nur **Rekordwert** Bürger+ je Tick (`peak3`, Welt, Save, ausserhalb der Auflage) |
| 3   | Lager füllen, spät wachsen                                      | Zuwachs 24–48 Rum ≪ 100                                                | Halteregel (Zähler) hilft nicht genug (§3.3)                                     |
| 4   | Ratsbeschluss Seite B nach dem Start                            | +6,7 bis +10 % Plätze ohne Haus                                        | Basis mit Seite-B-Plätzen oder Ratssperre in der Auflage                         |
| 5   | Bürger-Pfad, Aufstieg anhalten                                  | dominanter Weg (§3.2)                                                  | Zielgrösse nur Kaufleute (dann mehr A1-Prüfung)                                  |

## 6 Wertetabelle `src/sim/defs/trials.ts` (Vorschlag für I-163, nichts geändert)

| Konstante / Feld          | Ist              | Soll                                                                                | Auswirkung                                                      |
| ------------------------- | ---------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `TRIAL_IDS`               | `['selfSupply']` | `['selfSupply', 'export']`                                                          | zweite Auflage                                                  |
| `TRIALS.export`           | –                | `name 'Ausfuhrmeister'`, `short 'Zielgut verkaufen, ohne Zukauf'`, `rule` mit G1–G4 | Karte, Chronik                                                  |
| `TrialDef.buyBlock` (neu) | implizit alle    | `'all'` (selfSupply) · `'goal'` (export)                                            | G2; selfSupply bitgleich                                        |
| `TRIAL_EXPORT_GOALS`      | –                | `{ rum: 450, cloth: 450, glass: 320, stone: 750 }`                                  | E ≈ 5 Betriebe je Gut ohne Inselvorteil                         |
| `TRIAL_DURATION_TICKS`    | 9000             | 9000 (gemeinsam)                                                                    | –                                                               |
| `TRIAL_FAIL_POP_PCT`      | 70               | 70 (gemeinsam)                                                                      | G3 ersetzt eine schärfere Schwelle; Brand reisst 70 % nicht [M] |
| `TRIAL_MIN/MAX_MERCHANTS` | 60 / 150         | unverändert                                                                         | ohne Vollsperre ist 150 nicht nötig, schadet aber nicht         |

Weltfeld `trial` zusätzlich `good: GoodId | null`, `sold`, `s0` (Save-Version + 1, Migration wie R745). Balancing-Test: keine
Änderung an bestehenden Werten; der Controller startet keine Auflage → bitgleich [S].

## 7 Messgrenzen und Ruling-Entwürfe

Nur geschätzt oder ungemessen:

- Alle Zahlen zu R100/R140 sind skaliert, nicht gemessen; Gebäudezahl R140 ≈ 100 ist geschätzt.
- Ausbau-Zyklen ×0,6/×0,4 aus `docs/spielwerte.md:140`, `LEVELS` nicht gelesen; Felsbucht-Stein Stufe 2 daraus.
- Bauplätze: Gebirge in der Heimat ist kartenabhängig; Grasplätze für 3 zusätzliche Farmen in der Heimat sind angenommen.
- Ob Betriebe bei vollem Lager eine fertige Einheit halten (≤ 1 je Betrieb, für `s0` vernachlässigt), nicht geprüft.
- Pausendauer von G3 nach Dienstbrand (≈ 800 Ticks) aus I-132 §5.2 übertragen; wie oft Spieler daran scheitern, offen.
- Rest-Lücke 5.1 Nr. 8 (Vorab-Abriss bei I-163): Kostenvergleich ist Rechnung; Playtest-Trigger: Spieler besteht ein Ziel
  ohne neuen Betrieb → Startbedingung an Rekordwert koppeln (dann wie I-161 Nr. 2).
- I-161 ungemessen (Wachstumszeit ohne Mangel, keine Bauplatzprüfung).

Ruling-Entwürfe für L0 (`<was> — <warum> — <Kosten bei Irrtum>`):

1. R-1 «Ausfuhrmeister rechnet den Startbestand an: bestanden bei `sold ≥ Zielmenge + s0`, `s0` = Zielgut + `min` der
   Vorprodukte über alle Inseln und Schiffe» — R805 (4)(a) ist für Exportziele über die Zielhöhe nicht erreichbar (Reichsvorrat
   bis ≈ 1000, nötig T ≥ 4000) — Irrtum kostet ein Feld und eine Kartenzeile.
2. R-2 «Zukaufsperre je Auflage; `export` sperrt nur Zielgut und `consumes` seines Erzeugers» — klare Abgrenzung zu
   «Eigenversorgung», (b) hält — Irrtum: Signatur `trialBuyBlock`, umkehrbar auf Vollsperre.
3. R-3 «Ausfuhr zählt nur bei vollen Bedarfsträger-Häusern; Abriss von Wohnhäusern während `export` gesperrt» — sonst tragen
   Steuer «hoch» oder Aushungern 75–186 % der Rum-Zielmenge — Irrtum: Spieler wartet nach Brand mit dem Verkauf, ein Reason-Text.
4. R-4 «Zielmengen Rum 450, Stoff 450, Glas 320, Stein 750» — gleicher Zusatz ≈ 5 Betriebe; Scout-Stein 300 wäre mit
   2 Steinbrüchen dominant — Irrtum: Werte in den Defs, nach Playtest anpassbar.
5. R-5 «I-161 nicht bauen» — Zuwachs lagerfüllbar, Vorab-Abriss nur mit Rekordwert schliessbar, 87 % Überlappung mit A1 —
   Irrtum: Wachstumsprüfung fehlt; später als eigene Idee möglich.
