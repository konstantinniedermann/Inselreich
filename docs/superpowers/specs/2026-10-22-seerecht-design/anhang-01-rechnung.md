# I-153 Seerecht · Anhang 01: Rechnung

Zur Spec [2026-10-22-seerecht-design.md](../2026-10-22-seerecht-design.md). Quelle der Tabellen a und b: Vorschlag
WIRTSCHAFT-BS-1 §2.2 (`lead-design`, nachgerechnet von `design-economy-designer`). Zahlen aus `src/sim/defs/` (main,
Save v18); gerechnet, nicht gemessen.

## 1 Grundlagen

| Grösse                            | Wert                             | Ort                                                              |
| --------------------------------- | -------------------------------- | ---------------------------------------------------------------- |
| Ticks je Seekachel                | 10 (Seerecht 8)                  | `defs/sea.ts` `SHIP_TICKS_PER_SEA_TILE`; Hebel `defs/council.ts` |
| Einzelfahrt                       | 10 × d (8 × d)                   | `islands.ts` `travelTicks`, `laneTicks`                          |
| Umlauf (Ablegen im Ankunfts-Tick) | 20 × d (16 × d)                  | `ships.ts` `tickShips`                                           |
| Kapazität je Richtung             | 50                               | `defs/sea.ts` `SHIP.capacity`                                    |
| Schiffe je Reich                  | 4                                | `defs/sea.ts` `SHIP_MAX`                                         |
| Bedarf Gewürz, Glas               | je 0,1 je Kaufmann und 100 Ticks | `defs/tiers.ts` `TIERS[4].needs`                                 |
| Glashütte Takt                    | 50 (Glasrecht 30)                | `defs/buildings.ts` `glassworks.cycle`                           |
| Tick                              | 100 ms                           | `defs/timing.ts` `TICK_MS`                                       |

Gewürz je Schiff und 100 Ticks (fährt Gewürz allein in seiner Richtung): `50 × 100 / Umlauf` = `5000 / (20 d)` bzw.
`5000 / (16 d)`.

## 2 Tabelle a: Durchsatz je Schiff und Schiffe für eine Gewürzroute

Schiffe = `ceil(N × 0,1 ÷ Durchsatz je Schiff)`; Zellen «ohne/mit Seerecht».

| d   | Umlauf ohne/mit | je Schiff ohne/mit | N 60 | N 80 | N 100 | N 120 | N 150 |
| --- | --------------- | ------------------ | ---- | ---- | ----- | ----- | ----- |
| 25  | 500/400         | 10,0/12,5          | 1/1  | 1/1  | 1/1   | 2/1   | 2/2   |
| 30  | 600/480         | 8,33/10,42         | 1/1  | 1/1  | 2/1   | 2/2   | 2/2   |
| 35  | 700/560         | 7,14/8,93          | 1/1  | 2/1  | 2/2   | 2/2   | 3/2   |
| 40  | 800/640         | 6,25/7,81          | 1/1  | 2/2  | 2/2   | 2/2   | 3/2   |

Gesicherte Plantagenplätze Möweninsel/Felsbucht/Weidenau 2/3/6, bei Takt 50 also 4/6/12 Gewürz je 100 Ticks. Ab 80
Kaufleuten trägt sicher nur Weidenau (d 30 bis 35) allein.

## 3 Tabelle b: die drei Karten nebeneinander (eine Gewürzinsel, Glas in der Heimat)

Glashütten Heimat: Takt 50 → 2 Glas je 100 Ticks, Glasrecht Takt 30 → 3,33. Hütten = `ceil(N × 0,1 ÷ Glas je Hütte)`.

| N   | Glas-Bedarf | Hütten ohne/mit Glasrecht | Glasrecht spart | Hofrecht: Häuser gespart / Einwohner mehr | Seerecht: Schiffe gespart d 25/30/35/40 |
| --- | ----------- | ------------------------- | --------------- | ----------------------------------------- | --------------------------------------- |
| 60  | 6           | 3/2                       | 1               | 0 / +6                                    | 0/0/0/0                                 |
| 80  | 8           | 4/3                       | 1               | 0 / +8                                    | 0/0/1/0                                 |
| 100 | 10          | 5/3                       | 2               | 0 / +10                                   | 0/1/0/0                                 |
| 120 | 12          | 6/4                       | 2               | 0 / +12                                   | 1/0/0/0                                 |
| 150 | 15          | 8/5                       | 3               | 1 / +14                                   | 0/0/1/1                                 |

Befund B1: In Gebäuden gezählt ist Glasrecht in jeder Zeile mindestens gleich gut. Bewusst angenommen (Spec §6.1).

## 4 Felsbucht-Prüfung (Glashütte auf Gebirge+)

Inselvorteil halbiert den Takt; Reihenfolge Beschluss vor Vorteil (R711 R-3), je mit `floor`:

- ohne Glasrecht: `floor(50 × 50 / 100)` = 25 → 4 Glas je 100 Ticks;
- mit Glasrecht: `floor(floor(50 × 30 / 50) × 50 / 100)` = `floor(30 × 0,5)` = 15 → 6,67 Glas je 100 Ticks.

| N   | Glas-Bedarf | Felsbucht ohne/mit | Glasrecht spart | Heimat ohne/mit (Kontrolle Tabelle b) |
| --- | ----------- | ------------------ | --------------- | ------------------------------------- |
| 60  | 6           | 2/1                | 1               | 3/2                                   |
| 80  | 8           | 2/2                | **0**           | 4/3                                   |
| 100 | 10          | 3/2                | 1               | 5/3                                   |
| 120 | 12          | 3/2                | 1               | 6/4                                   |

Die Schätzung des Vorschlags («Glasrecht spart auf der Felsbucht bei N 80 keine Hütte») ist damit gerechnet bestätigt.
In derselben Lage spart Seerecht bei Gewürz aus Weidenau mit d 35 ein Schiff (Tabelle a: 2/1).

## 5 Flottendeckel und Urteil

- Vier Schiffe bei d 30: 4 × 8,33 = 33,3 Einheiten je 100 Ticks, mit Seerecht 4 × 10,42 = 41,7 = 5,0
  Schiff-Äquivalente.
- N 150, d 35: ohne Seerecht 3 Gewürzschiffe + 1 Fernauftrag = Deckel voll; mit Seerecht 2 + 1, ein Schiff frei. Zwei
  Gewürzinseln (d 35 und 40) bei N 150: ohne 4 Schiffe (kein Fernauftrag mehr), mit 2.
- Fernauftrag (Frist 1700): Hinfahrt 250 bis 400 Ticks, mit Seerecht 200 bis 320; mit Rückruf von einer Route etwa 1200
  gegen 960 Ticks (Schätzung), beides unter der Frist.

| Karte     | gewinnt in der Lage                                                        | bringt 0 in der Lage                                    |
| --------- | -------------------------------------------------------------------------- | ------------------------------------------------------- |
| Glasrecht | 60 bis 120 Kaufleute mit Glashütte in der Heimat (1 bis 2 Hütten)          | Glas zugekauft, N ≤ 40, Felsbucht bei N 80              |
| Hofrecht  | Bauplatz knapp und Kettenware zugekauft                                    | an den Zielen 60 und 80 (gleiche Hauszahl)              |
| Seerecht  | Deckel (N ≥ 150 oder drei Routen), Gewürzstadt 80 bei d 35, Felsbucht-Glas | N ≤ 60, d 30 bei N 80, zwei nahe Gewürzinseln bis N 120 |

## 6 Pose-Sprung beim Beschluss

Vorher `t₀ = 1 − L / (10 d)`, nachher `t₁ = 1 − ⌈0,8 L⌉ / (8 d)`. Mit `0,8 L / (8 d) = L / (10 d)` gilt
`t₀ − t₁ = (⌈0,8 L⌉ − 0,8 L) / (8 d)` ∈ [0, 1/(8 d)). Das Schiff rückt höchstens um weniger als eine Tick-Strecke
zurück, nie nach vorne. Beispiel d 30: L 150 → 120, t 0,5 → 0,5; L 7 → 6, t 0,97667 → 0,975 (Abstand 0,00167 ≤ 0,00417).
Mit veraltetem Cache (Fahrzeit 300 statt 240) läge ein frisch abgelegtes Schiff (L 240) bei t 0,2 statt 0.

## 7 Wertprüfung 9 / 8 / 6

| Ticks je Seekachel | je Schiff d 25/30/35/40    | N 80 bei d 35 | Deckel bei d 30 (4 Schiffe) | Urteil                                          |
| ------------------ | -------------------------- | ------------- | --------------------------- | ----------------------------------------------- |
| 10 (ohne)          | 10,0 / 8,33 / 7,14 / 6,25  | 2 Schiffe     | 33,3 (4,0 Äq.)              | Basis                                           |
| 9                  | 11,1 / 9,26 / 7,94 / 6,94  | 2 Schiffe     | 37,0 (4,4 Äq.)              | wirkungslos: 7,94 < 8; spart nur bei N 150/d 35 |
| **8**              | 12,5 / 10,42 / 8,93 / 7,81 | **1 Schiff**  | 41,7 (5,0 Äq.)              | **gewählt**: Gewinn- und Nulllage               |
| 6                  | 16,7 / 13,9 / 11,9 / 10,4  | 1 Schiff      | 55,6 (6,7 Äq.)              | dominant: spart in fast jeder Zelle ein Schiff  |

## 8 Szenario und Wächter (Zahlen zu AK-SR-7 und AK-SR-8)

**Szenario AK-SR-7:** d 35, Ablegen in der Heimat bei Tick 0, Heimkehr alle 700 (ohne) bzw. 560 (mit) Ticks. Über 5650
Ticks: `floor(5650 / 700)` = 8 Lieferungen = 400 Gewürz (7,08 je 100 Ticks), `floor(5650 / 560)` = 10 Lieferungen = 500
(8,85 je 100 Ticks). Schwelle 8 je 100 Ticks (N 80). 5650 statt 5600 gibt einen Puffer von 50 Ticks für die
Reihenfolge im Tick.

**Wächter AK-SR-8** (rein über Defs; `cap` = 50, `need` = 0,1, `N` = 80):

| Prüfung                  | Formel                      | Wert     | Erwartung |
| ------------------------ | --------------------------- | -------- | --------- |
| Gewinnlage mit Seerecht  | `cap × 100 / (2 × 8 × 35)`  | 8,93 ≥ 8 | wahr      |
| Gewinnlage ohne Seerecht | `cap × 100 / (2 × 10 × 35)` | 7,14 < 8 | wahr      |
| Nulllage ohne Seerecht   | `cap × 100 / (2 × 10 × 30)` | 8,33 ≥ 8 | wahr      |

Fällt eine Zeile nach einer Werteänderung (Kapazität, Bedarf, Seerecht-Wert, Seewege durch Erweiterung 1), ist der
Seerecht-Wert neu zu prüfen und per Werte-Ruling festzuhalten (R805 (3)).
