# HAFEN · Anhang 01: Rechnung Fahrzeit aus der Fahrlinie

Zur Spec [2026-10-25-hafen-design.md](../2026-10-25-hafen-design.md) (A2 aus Handoff BUG-SCHIFF). Stand `70a32032`
(main, Save v18), Seerecht aus `feat/seerecht`. Gemessen per Probe (`probe/a.test.ts`, `probe/e.test.ts`, untracked,
Node, Apple M1 Pro); Schätzungen sind markiert.

**Stichprobe:** `createWorld(seed, { unlockAll: true })`, Seeds 1–40. 15/16, 30/31, 36/37 ergeben dieselbe Welt
(Ersatzseed `seedUsed`, `world.ts:106`): **37 Welten**, je 3 Heimat- und 3 Fremd-Lanes (Heimat 64×64, A, B, C).

## Grundlagen

| Grösse       | heute / neu                                                                | Ort                                 |
| ------------ | -------------------------------------------------------------------------- | ----------------------------------- |
| Fahrt heute  | `10 × d`, d = `ceil(seaLength(Gerade))`, nur ausserhalb der Inselrechtecke | `islands.ts:73-81, 327-351`         |
| Umlauf heute | `2 T`, Umschlag und Abfahrt im Ankunftstick                                | `ships.ts:199-229`                  |
| L            | ganze Länge der `seaRoute`-Polylinie Anker → Anker                         | `seaRoute.ts:338-365`               |
| Fahrt neu    | `ceil(L · k)`                                                              | Vorschlag `defs/sea.ts`             |
| Umlauf neu   | `2 · ceil(L · k) + 2 · D`, D = `SHIP_DOCK_TICKS`                           | `ships.ts`, `routeBalance.ts:59-60` |
| Durchsatz    | `50 × 100 / Umlauf` je 100 Ticks; Bedarf N 80 = 8 Gewürz                   | `SHIP.capacity`, `defs/tiers.ts`    |

## A Messreihe (37 Welten)

Median / Min / Max; `ticks` = `laneTicks` heute; `T/L` = heutige Ticks je Kachel Fahrlinie.

| Lane     | ticks heute      | L (Kacheln)          | L / d              | T / L              |
| -------- | ---------------- | -------------------- | ------------------ | ------------------ |
| Heimat–A | 280 / 250 / 300  | 99,4 / 60,0 / 169,6  | 3,53 / 2,22 / 5,65 | 2,83 / 1,77 / 4,50 |
| Heimat–B | 370 / 350 / 400  | 108,7 / 63,9 / 171,6 | 2,86 / 1,77 / 4,51 | 3,49 / 2,22 / 5,63 |
| Heimat–C | 330 / 310 / 350  | 99,9 / 64,1 / 150,8  | 3,03 / 2,07 / 4,73 | 3,30 / 2,11 / 4,83 |
| A–B      | 640 / 100 / 1210 | 110,8 / 35,2 / 168,1 | 1,66 / 1,15 / 3,52 | 6,02 / 2,84 / 8,68 |
| A–C      | 520 / 120 / 1100 | 82,1 / 34,0 / 154,4  | 1,63 / 1,11 / 5,61 | 6,15 / 1,78 / 8,97 |
| B–C      | 520 / 90 / 1270  | 96,2 / 37,6 / 176,1  | 1,85 / 1,18 / 8,53 | 5,40 / 1,17 / 8,48 |

Heute 1,2 bis 9,0 Ticks je Kachel (Faktor 3,2 über Heimat-Lanes, 7,7 über alle).

Zerlegung von L, Heimat-Lanes, Median (40 Seeds, `e.test.ts`): im Heimat-Rechteck A 46,8 / B 31,6 / C 43,5 Kacheln
(Spanne 13,5–98,2), im Ziel-Rechteck 10,0 / 15,7 / 13,5, ausserhalb 36,4 / 45,5 / 40,9 (d 28 / 37 / 33). Den
grössten, streuenden Teil macht die **Umrundung der Heimatinsel** aus; `d` sieht ihn nicht, darum hängt L kaum an der
Inselart.

## B Kalibrierung k

Bedingung: Mittel über 111 Heimat-Lanes von `2 · ceil(L · k) + 2 · D` = heute `2 T` = **656,6 Ticks**.

| D      | k exakt | k       | Mittel neu | Abweichung  |
| ------ | ------- | ------- | ---------- | ----------- |
| 0      | 3,190   | –       | –          | –           |
| 20     | 2,995   | 3,0     | 657,6      | +0,15 %     |
| **30** | 2,898   | **2,9** | **657,0**  | **+0,07 %** |
| 40     | 2,801   | 2,8     | 656,5      | −0,01 %     |

±2-%-Band bei D 30: k 2,84 (−1,8 %) bis 2,96 (+1,9 %). **Vorschlag `SHIP_TICKS_PER_ROUTE_TILE = 2.9`** (neu,
`defs/sea.ts`, ersetzt `SHIP_TICKS_PER_SEA_TILE` 10 für die Fahrzeit).

Umlauf D 30, k 2,9, Median [Min..Max]:

| Lane     | heute            | neu             | Median  | je Lane         |
| -------- | ---------------- | --------------- | ------- | --------------- |
| Heimat–A | 560 [500..600]   | 638 [408..1044] | +13,9 % | −24 % bis +74 % |
| Heimat–B | 740 [700..800]   | 692 [432..1056] | −6,5 %  | −40 % bis +39 % |
| Heimat–C | 660 [620..700]   | 640 [434..936]  | −3,0 %  | −30 % bis +47 % |
| A–B      | 1280 [200..2420] | 704 [264..1036] | −45,0 % | –               |
| A–C      | 1040 [240..2200] | 538 [258..956]  | −48,3 % | –               |
| B–C      | 1040 [180..2540] | 620 [280..1082] | −40,4 % | –               |

**Reihenfolge:** Mediane formal A 638 < C 640 < B 692, aber A und C 2 Ticks auseinander; je Welt gilt A < C < B nur in
**8 von 37** (heute 37/37, Zufall ≈ 6/37). Spanne je Art von ±10 % auf −36 %/+64 %. B gegen A (Median) von +32 % auf
+8 %. Fremd-Lanes werden um 40–48 % schneller (heute zählt `seaLength` Strecke in Rechtecken nicht).

**Befund:** Mittel neutral, Verteilung nicht. `dMin`/`dMax` (`defs/sea.ts` `ISLANDS`) steuern die Fahrzeit nicht mehr;
die Felsbucht (3 Steinbrüche, Gebirge+, 3 Plantagen) verliert ihren Weg-Nachteil. Das gefährdet «mindestens zwei
lohnende Ausbaupfade».

**Andere Kalibrierbasis K2 (empfohlen):** Der Generator prüft L statt d (`layoutValid`, `islands.ts:388-394`), Bänder
`L = (10 · d − D) / k`, damit die heutigen Umläufe bleiben:

| Art | d heute | L-Band (`dMin`/`dMax` neu) | Umlauf  | heute im Band |
| --- | ------- | -------------------------- | ------- | ------------- |
| A   | 25–30   | 76–93                      | 500–600 | 7 / 37        |
| C   | 30–35   | 97–110                     | 620–700 | 9 / 37        |
| B   | 35–40   | 110–128                    | 700–800 | 12 / 37       |

Kosten K2 (Schätzung): ≈ 5 ms `seaRoute` je Kandidat (gemessen 4,8 ms inkl. Raster, Teil E), bei `ISLAND_TRIES` 50 und
drei Arten höchstens ≈ 0,75 s Weltaufbau; alle Seed-Welten ändern sich (Pins, Goldwerte, Teil H). K1 (nur k) hält das
Mittel, nicht die Inselrollen.

## C Liegezeit `SHIP_DOCK_TICKS`

Ankunft entlädt sofort; nach D Ticks beladen und ablegen. Tick 100 ms (`defs/timing.ts:2`), Tempo 1/2/4
(`ui/app.ts:229`).

| D      | x1    | x4     | Anteil Umlauf | Seerecht Durchsatz | k   |
| ------ | ----- | ------ | ------------- | ------------------ | --- |
| 20     | 2,0 s | 0,50 s | 6,1 %         | +23,1 %            | 3,0 |
| **30** | 3,0 s | 0,75 s | 9,1 %         | +22,2 %            | 2,9 |
| 40     | 4,0 s | 1,0 s  | 12,2 %        | +21,3 %            | 2,8 |

**Vorschlag D = 30** (`defs/sea.ts`, neu): bei x4 mit Reserve über 0,5 s, bei x1 kein Stau-Eindruck. Durchsatz durch die
Kalibrierung neutral; grösseres D schwächt Seerecht (nur die Fahrt wird schneller).

## D Seerecht im neuen Massstab

**Hebel 8 → 2,32 Ticks je Kachel Fahrlinie** (= 2,9 × 0,8; `defs/council.ts` `COUNCIL[4].C.lever`). Fahrt +25 %; Umlauf
im Mittel 657 → 538 (−18,1 %), Durchsatz +22,2 %, weil D fest bleibt. Ein Schiff deckt N 80, wenn Umlauf ≤ 625:

| L   | Umlauf ohne / mit | je Schiff ohne / mit | N 80 Schiffe     |
| --- | ----------------- | -------------------- | ---------------- |
| 90  | 582 / 478         | 8,59 / 10,46         | 1 / 1 (Nulllage) |
| 97  | 624 / 512         | 8,01 / 9,77          | 1 / 1            |
| 98  | 630 / 516         | 7,94 / 9,69          | 2 / 1            |
| 110 | 698 / 572         | 7,16 / 8,74          | 2 / 1 (Gewinn)   |
| 121 | 762 / 622         | 6,56 / 8,04          | 2 / 1            |
| 122 | 768 / 628         | 6,51 / 7,96          | 2 / 2            |

Seerecht spart bei N 80 auf **L 98–121** ein Schiff: 32/111 Heimat-Lanes (heute 63/111), verteilt A 12, B 10, C 10
(heute 0/33/30). N 100/120/150: 35/33/34 Lanes (heute 42/8/53).

**Kartentext** bleibt: «ab etwa 80 Kaufleuten … auf langen Gewürzrouten» stimmt; «lang» heisst sichtbar lang. Ohne K2
nicht mehr an Weidenau/Felsbucht gebunden. **AK-SR-8 neu:** Gewinnlage L 110 (8,74 ≥ 8 mit, 7,16 < 8 ohne), Nulllage
L 90 (8,59 ≥ 8 ohne), Formel `cap × 100 / (2 · ceil(k · L) + 2 · D)`; AK-SR-7 auf L 110 (Umlauf 698 / 572).

## E Kontor-II-Platzwahl

Alle 2×2-Plätze nach `placement.ts` (Land, frei, `coast`); Anlegestelle = `homeAnchor(Fussabdruck)`; Fahrzeit
`ceil(2,9 · L)` Heimat → Insel; relativ zum vorgesehenen `kontorSite`.

| Seed | Insel | Plätze | vorgesehen | Min / Median / Max | relativ           | > +40 % |
| ---- | ----- | ------ | ---------- | ------------------ | ----------------- | ------- |
| 1    | A     | 56     | 209        | 146 / 180 / 227    | −30 / −14 / +9 %  | 0       |
| 1    | B     | 67     | 233        | 192 / 242 / 326    | −18 / +4 / +40 %  | 0       |
| 1    | C     | 44     | 273        | 266 / 295 / 359    | −3 / +8 / +32 %   | 0       |
| 2    | A     | 48     | 339        | 284 / 316 / 380    | −16 / −7 / +12 %  | 0       |
| 2    | B     | 72     | 222        | 201 / 254 / 332    | −9 / +15 / +50 %  | 9       |
| 2    | C     | 42     | 300        | 281 / 306 / 369    | −6 / +2 / +23 %   | 0       |
| 3    | A     | 43     | 408        | 364 / 396 / 449    | −11 / −3 / +10 %  | 0       |
| 3    | B     | 78     | 335        | 323 / 372 / 477    | −4 / +11 / +42 %  | 1       |
| 3    | C     | 44     | 426        | 364 / 394 / 445    | −15 / −7 / +4 %   | 0       |
| 37   | A     | 48     | 225        | 163 / 198 / 265    | −28 / −12 / +18 % | 0       |
| 37   | B     | 70     | 256        | 252 / 288 / 372    | −2 / +12 / +45 %  | 4       |
| 37   | C     | 42     | 254        | 182 / 212 / 261    | −28 / −17 / +3 %  | 0       |

654 Plätze: −30 % / 0 % / +50 %; 46 % schneller als vorgesehen, 14 (2 %, alle B 36×36) über +40 %. Anlegestelle zur
Kontormitte Median 1,4, sonst ≤ 2,2 Kacheln. **Nur Binnenwasser:** 12 Plätze (alle Seed 1 A), Anlegestelle bis 5,8
Kacheln vom Kontor.

Urteil: spürbare Entscheidung (bester gegen schlechtesten Platz je Insel 21–50 %), keine Falle, wenn die Bauvorschau die
Fahrzeit zeigt (Vorschlag UI). Vorschlag Regel: Kontor II braucht **Meerwasser** angrenzend (`seaMask`), sonst liegt das
Schiff bis 6 Kacheln vom Kontor (Designentscheid `lead-design`).

## F Auftragsschiff (k 2,9, `ceil(n · k)`)

| Anfahrt    | Ticks | x1    | Seerecht 2,32 |
| ---------- | ----- | ----- | ------------- |
| 10 Kacheln | 29    | 2,9 s | 24            |
| 12 Kacheln | 35    | 3,5 s | 28            |
| 15 Kacheln | 44    | 4,4 s | 35            |

## G Save-Umrechnung `left`

Vorschlag `left_neu = clamp(round(left_alt · T_neu / T_alt), 1, T_neu)` geprüft:

| Fall                        | Ergebnis / Vorschlag                                                              |
| --------------------------- | --------------------------------------------------------------------------------- |
| `T_alt`                     | aus altem Stand: `travelTicks(d, seaTileTicks(council))` (Seerecht 8)             |
| `T_neu`                     | `ceil(L · k_eff)`, `seaRoute` beim Laden (Teil I)                                 |
| `left = T_alt`              | → `T_neu` ✓                                                                       |
| `left = 1`                  | `round` kann 0 liefern → Klemme 1 ✓                                               |
| `round` / `ceil`            | **`ceil`** wie `rescaleVoyages` (`feat/seerecht`): rückt nie vor, Fehler < 1 Tick |
| `to = null`                 | `left` 0 bleibt; Liegezeit-Uhr = 0 (alte Stände liegen nie mit Route)             |
| Reihenfolge                 | `isValidShip` (`save.ts:713-715`) gegen `T_alt` prüfen, dann umrechnen            |
| Notanker Gerade (`compute`) | L = Gerade, `T_neu` ≥ 1 ✓                                                         |
| Version                     | `SAVE_VERSION` +1 (main 18, Seerecht 19); Migration statt Abweisen empfohlen      |

## H Tests und Balancing-Test

`tests/sim/balance.test.ts` liest keine Lanes, Schiffe oder Fahrzeiten (`rg` ohne Treffer) → **Balancing-Test bewusst
ändern: nein.** Voraussichtlich brechen:

| Datei (tests/…)          | Test / Stelle                                                |
| ------------------------ | ------------------------------------------------------------ |
| `sim/ships.test.ts:327`  | AK-E4-03 «Ankunft nach 370, Rundreise 740»                   |
| `sim/farOrder-defs:47`   | «dMin ≤ d ≤ dMax … laneTicks gepinnt» (`SEED3_LANES`)        |
| `sim/farOrder-defs:33`   | «Frist-Invariante» `600 + 2 · 10 · dMax ≤ 1700`              |
| `sim/seaGolden:285`      | SEE-F1 T0 Goldwerte (Ticks; mit K2 auch Lanes, Welt-Hash)    |
| `sim/routeBalance:34,47` | `cycleTicks` = 2 laneTicks (neu + 2 D)                       |
| `ui/homeTravel:17`       | «Lane mit d = 25 ergibt 250 Ticks»                           |
| `ui/islandCard:29`       | Fahrzeit `travelTicks(d)`                                    |
| `sim/farOrder-sea:22,81` | `laneTicks / SHIP_TICKS_PER_SEA_TILE > dMax`                 |
| `feat/seerecht`          | AK-SR-7, AK-SR-8 (Teil D), `ships-rng` (zählt `laneTicksOf`) |

Frist neu: `600 + 2 · (ceil(k · L_max) + D)` = 600 + 2 · (498 + 30) = **1656 ≤ 1700** (heute 1400); hält bis L ≤ 179
(gemessen max 171,6). Mit K2 (B ≤ 128): 1404. Die Prüfung braucht eine L-Grenze statt `dMax`.

## I Laufzeit `seaRoute` (37 Welten, kalt)

| Messung                            | Median  | Min     | Max                    |
| ---------------------------------- | ------- | ------- | ---------------------- |
| erste Lane je Welt (inkl. Raster)  | 7,1 ms  | 4,1 ms  | 21,8 ms (1. Welt, JIT) |
| weitere Lane                       | 5,5 ms  | 1,6 ms  | 16,2 ms                |
| alle 6 Lanes einer Welt            | 34,0 ms | 25,3 ms | 73,4 ms                |
| Kontor-II-Variante (Raster + Lane) | 4,8 ms  | –       | –                      |

Ladeprüfung: einmalig ≤ ≈ 75 ms je Stand; der Fingerabdruck-Cache (`seaRoute.ts:390-406`) teilt die Routen danach mit
dem Spiel. Kontor-II-Bau: drei Lanes ≈ 15–20 ms einmalig.
