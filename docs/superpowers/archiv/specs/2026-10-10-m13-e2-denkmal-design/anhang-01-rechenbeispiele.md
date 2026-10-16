# Anhang 01 · Rechenbeispiele und Erwartungswerte (Spec M13-E2)

Gehört zu [Spec M13-E2 Denkmal als Wahlziel](../2026-10-10-m13-e2-denkmal-design.md). Alle Zahlen aus
`src/sim/defs/monument.ts` (§4), `GOODS`, `TIERS` und `EDICTS`; ein Tick = 100 ms, 10 Ticks = 1 s.

## A. Reserve (R6, AK-M13E2-09, -10)

`U_g` = Σ `inhabitants × needs[g]` der versorgten Häuser der Heimat je 100 Ticks. Glas und Gewürz braucht nur die
Stufe 4 (`needs` 0,1 je Einwohner), also `U = 0,1 × Kaufleute` und
`reserve = max(20, ⌈800 × U / 100⌉) = max(20, ⌈0,8 × Kaufleute⌉)`.

| Kaufleute (versorgt) | `U` Glas/Gewürz | ⌈8 × U⌉ | Reserve Glas/Gewürz | Reserve Stein/Werkzeug |
| -------------------- | --------------- | ------- | ------------------- | ---------------------- |
| 0                    | 0               | 0       | 20                  | 20                     |
| 20                   | 2               | 16      | 20                  | 20                     |
| 25                   | 2,5             | 20      | 20                  | 20                     |
| 26                   | 2,6             | 21      | 21                  | 20                     |
| 40                   | 4               | 32      | 32                  | 20                     |
| 60 (Ziel 2)          | 6               | 48      | 48                  | 20                     |
| 61                   | 6,1             | 49      | 49                  | 20                     |
| 80 (Ziel 3, c)       | 8               | 64      | 64                  | 20                     |
| 81                   | 8,1             | 65      | 65                  | 20                     |

- Nicht mitgezählt: unversorgte Häuser (ausserhalb von Kontor- und Marktradius), Häuser auf Fremdinseln, Verbrauch
  von Betrieben (Glashütte: Stein, Holz; Werkzeugmacher: Holz).
- Gleitkomma: 61 × 0,1 aufsummiert ergibt 6,099999…; ⌈8 × 6,0999…⌉ = 49 ist richtig, aber 80 Einwohner in einer
  ungünstigen Summenfolge dürfen nicht 65 ergeben. Erwartung exakt wie Tabelle (R6.2).
- Bedeutung: 64 Stück decken 800 Ticks Hausbedarf in Phase c, also eine Schiffs-Rundreise (500–800 Ticks, Rechnung
  C.4).

## B. Zug aus dem Lager (R5, AK-M13E2-08)

Testwelt ohne Häuser (Reserve 20), Stein 23, übrige Güter 20, Start bei Tick 1000, `buy` aus:

| Tick | Ereignis                                  | Stein | `delivered.stone` |
| ---- | ----------------------------------------- | ----- | ----------------- |
| 1000 | `startMonumentStage` (zwischen Schritten) | 23    | 0                 |
| 1010 | Zug: 23 > 20                              | 22    | 1                 |
| 1020 | Zug: 22 > 20                              | 21    | 2                 |
| 1030 | Zug: 21 > 20                              | 20    | 3                 |
| 1040 | Zug: 20 = Reserve → nichts                | 20    | 3                 |

Mit `buy.stone` an und `money 100` ab 1040: je Zug −15 Geld, `delivered +1`; Käufe bei 1040 … 1090 (6 Stück), danach
`money 10`, bei 1100 kein Kauf (10 < 15). Mit Handel: Preis 12. Testwelt ohne Unterhalt (nur Kontor und Denkmal).

Reihenfolge (AK-M13E2-08): Lager auf Reserve, `buy` für Stein und Glas, `money 15` → der Zug kauft Stein (15), Glas
(50) nicht.

## C. Preise und Vollzukauf (R7, AK-M13E2-11, -12)

| Gut      | `GOODS.buy` | mit Handel ⌈buy × 80 / 100⌉ | Menge gesamt |
| -------- | ----------- | --------------------------- | ------------ |
| Stein    | 15          | 12                          | 600          |
| Werkzeug | 40          | 32                          | 240          |
| Glas     | 50          | 40                          | 360          |
| Gewürz   | 40          | 32                          | 240          |

| Abschnitt                | Geld Start | Waren ohne Edikt                   | Summe      | Waren mit Handel                   | Summe      |
| ------------------------ | ---------- | ---------------------------------- | ---------- | ---------------------------------- | ---------- |
| 1 Sockel                 | 4000       | 3000 + 3200 + 3000 + 1600 = 10 800 | 14 800     | 2400 + 2560 + 2400 + 1280 = 8640   | 12 640     |
| 2 Terrassen              | 6000       | 3000 + 3200 + 7000 + 4000 = 17 200 | 23 200     | 2400 + 2560 + 5600 + 3200 = 13 760 | 19 760     |
| 3 Schaft und Feuerschale | 8000       | 3000 + 3200 + 8000 + 4000 = 18 200 | 26 200     | 2400 + 2560 + 6400 + 3200 = 14 560 | 22 560     |
| **Summe**                | 18 000     | 46 200                             | **64 200** | 36 960                             | **54 960** |

Dauer: Stein (200 je Abschnitt) bindet, 200 Züge × 10 Ticks = 2000 Ticks je Abschnitt; Start bei 1000 → fertig 3000,
5000, 7000; zusammen 6000 Ticks = 10 min (Rechnung C.2: «≈ 10 min»). Die übrigen Güter sind früher voll (Werkzeug
800, Glas 600 / 1400 / 1600, Gewürz 400 / 1000 / 1000 Ticks).

## D. Lauf C, R-Welt (Erwartung zu AK-M13E2-19)

R-Ausbau: 3 Steinbrüche (Zyklus 60 → zusammen 0,05 Stein je Tick), 1 Werkzeugmacher (80 → 0,0125 je Tick), 1
Glashütte (50 → 0,02 Glas je Tick, verbraucht 0,02 Stein und 0,02 Holz je Tick), Plantagen-Ersatz +1 Gewürz je 50
Ticks (0,02 je Tick). Keine Häuser, Reserve 20, Startbestand der vier Güter 20, Holz alle 10 Ticks auf 100.

| Gut      | Soll 1 | Netto ins Denkmal je Tick                        | Ticks bis Soll | min  |
| -------- | ------ | ------------------------------------------------ | -------------- | ---- |
| Stein    | 200    | 0,05 − 0,02 = 0,03 (solange die Glashütte läuft) | ≈ 6670         | 11,1 |
| Werkzeug | 80     | 0,0125                                           | ≈ 6400–6480    | 10,7 |
| Glas     | 60     | 0,02                                             | ≈ 3000         | 5,0  |
| Gewürz   | 40     | 0,02                                             | ≈ 2000         | 3,3  |

Nach 3000 Ticks ist Glas voll; der Glasbestand steigt dann von 20 auf 100 (≈ 4000 Ticks), erst danach stoppt die
Glashütte (`storageFull`) und frisst keinen Stein mehr. Erwartung t₁ − t_s ≈ 6670 Ticks (11,1 min; Rechnung C.1: 11,2),
Abnahmespanne 6720 ± 30 % = 4704 … 8736 Ticks.

## E. UI-Texte (AK-M13E2-27 bis -31)

| Lage                                                    | Erwartung                                                                     |
| ------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Abschnitt 1 frisch gestartet, Rest Stein 200            | «frühestens fertig in 3:20» (2000 Ticks)                                      |
| Abschnitt 2: Stein 200, Werkzeug 80, Glas 84, Gewürz 50 | Rest max 56 → «frühestens fertig in 56 s»                                     |
| dieselbe Lage                                           | Σ 414 / 520 → Chip «Denkmal 2/3 · 79 %»; Glas-Zeile «Glas 84 / 140», `pct` 60 |
| `stage 1`, nicht laufend                                | Chip «Denkmal 1/3», Balken 33; Zeile «1 / 3 fertig · nächster: Terrassen»     |
| `stage 0`, nicht laufend                                | «Bauplatz · nächster: Sockel»; Knopf «Abschnitt 1 beginnen (4000)»            |
| Σ Soll je Abschnitt                                     | 380 · 520 · 540                                                               |

## F. Geometrie 3×3 (AK-M13E2-05)

- Mittelpunkt `(x + 1,5, y + 1,5)`; Kontor (2×2) bei `(kx, ky)` hat den Mittelpunkt `(kx + 1, ky + 1)`, Radius 8,
  Abstand euklidisch (`inSupplyRange`). Denkmal bei `y = ky`: `x = kx + 7` → Abstand √(7,5² + 0,5²) ≈ 7,52, versorgt;
  `x = kx + 8` → ≈ 8,51, `'Ausserhalb der Versorgung'`.
- Randkacheln für die Anbindung: je 3 oben, unten, links, rechts = 12 (`adjacentOf`); Eckdiagonalen zählen nicht.
- Bauplatz-Erstattung (R9.1): `refundCost(cost(500, 10, 0, 10))` = 250 Geld, 5 Holz, 0 Werkzeug, 5 Stein.
