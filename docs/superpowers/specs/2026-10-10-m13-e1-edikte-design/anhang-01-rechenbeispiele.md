# Anhang 01 · Rechenbeispiele und Erwartungswerte (Spec M13-E1)

Gehört zu [Spec M13-E1 Edikte und Betrieb stilllegen](../2026-10-10-m13-e1-edikte-design.md). Alle Werte folgen aus
den Defs auf `main` 08079e66 (`TIERS`, `TAX_LEVELS`, `GOODS`, `BUILDING_DEFS`, `LEVELS`, `timing.ts`) und den neuen
Werten aus Spec §4. Zeit: 100 Ticks = 10 s, 600 Ticks = 1 min. `TAX_UNIT` 2, `TAX_CARRY_DIVISOR` 20 000,
`UPKEEP_INTERVAL` 100.

## A. Steuer mit Edikt (AK-M13E1-06, AK-M13E1-07)

Regel: `effectiveTaxPct(w, t) = taxPct(effectiveTaxLevel(w, t), t) − edictTaxPoints(w)`; Sparen 7, Wohlfahrt 5,
Handel und «keins» 0 Punkte. Basis je Haus = Einwohner × `TIERS[t].tax` × (erfüllt ? 2 : 1).

### A.1 Welt «gemischt» (gleiche Häuser wie I-028:AK-T02)

| Haus                           | Basis | Satz keins | Satz Sparen | Satz Wohlfahrt |
| ------------------------------ | ----- | ---------- | ----------- | -------------- |
| Pioniere 4, erfüllt, «niedrig» | 16    | 70         | 63          | 65             |
| Siedler 8, erfüllt, «normal»   | 112   | 100        | 93          | 95             |
| Siedler 8, unerfüllt, «normal» | 56    | 100        | 93          | 95             |
| Bürger 11, erfüllt, «hoch»     | 308   | 130        | 123         | 125            |
| Kaufleute 15, erfüllt, «hoch»  | 660   | 115        | 108         | 110            |

| Grösse                                     | keins   | Sparen  | Wohlfahrt | Handel  |
| ------------------------------------------ | ------- | ------- | --------- | ------- |
| `taxUnits` je Tick                         | 133 860 | 125 796 | 128 100   | 133 860 |
| Geld nach 100 Ticks ab `taxCarry = 0`      | 669     | 628     | 640       | 669     |
| `taxCarry` nach 100 Ticks                  | 6000    | 19 600  | 10 000    | 6000    |
| `stats.taxes` (⌊units / 200⌋, je 100 Tick) | 669     | 628     | 640       | 669     |

Probe: Summe der Basen 1152; 133 860 − 7 × 1152 = 125 796; 133 860 − 5 × 1152 = 128 100.

### A.2 Welt «Endzustand» (4 Kaufleute-Häuser à 20, erfüllt, «normal»)

Basis 4 × 20 × 22 × 2 = 3520. `taxUnits`: keins 352 000, Sparen 327 360, Wohlfahrt 334 400. Geld nach 100 Ticks:
1760 / 1636 (Übertrag 16 000) / 1672 (Übertrag 0).

## B. Unterhalt mit Edikt und Stilllegung (AK-M13E1-08, AK-M13STL-04)

Regel: je Gebäude `buildingUpkeep(b)` = `upkeepOf(b)`, stillgelegt `⌈upkeepOf(b) × 50 / 100⌉`; Summe S über alle
Gebäude plus `ships.length × SHIP.upkeep`; mit wirkendem Edikt `upkeepPct < 100`: `⌊S × upkeepPct / 100⌋`.

| Welt                                                        | nominal S | keins | Sparen (80 %) |
| ----------------------------------------------------------- | --------- | ----- | ------------- |
| Kontor 0, Amtsstube 20, 2 Fischer à 5, Glashütte 25         | 55        | 55    | 44            |
| dieselbe, Glashütte stillgelegt (25 → 13)                   | 43        | 43    | 34            |
| dieselbe wie Zeile 1 plus 1 Schiff (15)                     | 70        | 70    | 56            |
| Endzustand (F): Kontor, Amtsstube 20, 32 Schulen à 25 (roh) | 820       | 820   | 656           |

Geld nach 100 Ticks ab `upkeepCarry = 0` = −(Zeilenwert), `stats.upkeep` = Zeilenwert (wirksam, nicht nominal).

Halber Unterhalt je Betrieb (aufgerundet, Ersparnis nie mehr als die Hälfte):

| Unterhalt Stufe 1 | stillgelegt | Beispiele (Stufe 1)              | Stufe 2 / 3 → stillgelegt  |
| ----------------- | ----------- | -------------------------------- | -------------------------- |
| 5                 | 3           | Fischer, Jagdhütte, Holzfäller   | Fischer 7 → 4, 9 → 5       |
| 10                | 5           | Steinbruch, Schäferei, Rinderhof | Steinbruch 13 → 7, 17 → 9  |
| 15                | 8           | Weberei, Gewürzplantage          | Weberei 20 → 10, 26 → 13   |
| 20                | 10          | Brennerei                        | Brennerei 26 → 13, 34 → 17 |
| 25                | 13          | Werkzeugmacher, Glashütte        | Glashütte 33 → 17, 43 → 22 |

## C. Kaufpreise mit «Handel» und Arbitrage (AK-M13E1-09, AK-M13E1-10)

Regel: `buyPrice(w, g, n) = ⌈n × GOODS[g].buy × buyPct / 100⌉` mit wirkendem Handel (`buyPct` 80), sonst
`n × GOODS[g].buy` (bitgleich). Prämie `⌊buy × ORDER_PREMIUM⌋` (0,75); höchster Verkauf je Stück
`⌊sell × BOOM_PCT / 100⌋` bei `sellPct` 100 (Boom auf dieses Gut).

| Ware       | buy | n = 1 | n = 10 | n = 100 | Prämie | Kauf − Prämie (n = 1) | Verkauf max. | Kauf − Verkauf |
| ---------- | --- | ----- | ------ | ------- | ------ | --------------------- | ------------ | -------------- |
| Holz       | 10  | 8     | 80     | 800     | 7      | 1                     | 6            | 2              |
| Werkzeug   | 40  | 32    | 320    | 3200    | –      | –                     | 22           | 10             |
| Stein      | 15  | 12    | 120    | 1200    | 11     | 1                     | 9            | 3              |
| Nahrung    | 8   | 7     | 64     | 640     | 6      | 1                     | 4            | 3              |
| Wolle      | 12  | 10    | 96     | 960     | 9      | 1                     | 7            | 3              |
| Stoff      | 30  | 24    | 240    | 2400    | 22     | 2                     | 18           | 6              |
| Zuckerrohr | 12  | 10    | 96     | 960     | 9      | 1                     | 7            | 3              |
| Rum        | 40  | 32    | 320    | 3200    | 30     | 2                     | 27           | 5              |
| Glas       | 50  | 40    | 400    | 4000    | 37     | 3                     | 30           | 10             |
| Gewürz     | 40  | 32    | 320    | 3200    | –      | –                     | 18           | 14             |

Bei n Stück gilt `buyPrice > n × Prämie` und `buyPrice > sellPrice(Boom, n)`, weil `0,8 × buy > ⌊0,75 × buy⌋` und
`0,8 × buy > 1,5 × sell` für jede Ware (kleinster Abstand Nahrung n = 10: 64 gegen 60). Mit Abrunden statt Aufrunden
läge Nahrung, Wolle und Zuckerrohr bei n = 1 auf Marge 0 (6, 9, 9).

## D. Aufstiegs-Wartezeit, Stapelregel (AK-M13E1-12)

`waitBase = max(TAX_LEVELS.low.upgradeWait, min(base, Fest ? 150, Wohlfahrt ? 200))` für `base ≠ null`; danach
`× UPGRADE_DEFICIT_WAIT_FACTOR` (2), wenn das Haus dämpft. `base = null` («hoch») bleibt `null`.

| Steuerstufe | Fest | Wohlfahrt | Wartezeit     | mit Defizit |
| ----------- | ---- | --------- | ------------- | ----------- |
| normal      | –    | –         | 300           | 600         |
| normal      | –    | ja        | 200           | 400         |
| normal      | ja   | –         | 150           | 300         |
| normal      | ja   | ja        | 150           | 300         |
| niedrig     | –    | –         | 150           | 300         |
| niedrig     | –    | ja        | 150           | 300         |
| niedrig     | ja   | ja        | 150           | 300         |
| hoch        | ja   | ja        | kein Aufstieg | –           |

Grundtext im Status: `Bedürfnisse noch nicht {wait} Ticks erfüllt` bzw. `Steuer zu hoch`. Aufstiege werden nur an
Wachstumstakten geprüft: Mit Takt 40 wirkt Wartezeit 200 genau (5 Takte), Wartezeit 150 wie 160 (4 Takte).

## E. Pfadzeiten Pionier → volles Kaufmannshaus (AK-M13E1-16, Auflage B1 analytisch)

Testwelt: ein Haus, eingesetzt bei Tick t0 (Vielfaches von 200, also von 40 und 50), Stufe 1, 1 Einwohner,
`satisfiedSince = t0`; ab Tick t0 + 1 alle Bedürfnisse, Dienste und Aufstiegskosten dauernd vorhanden, kein Defizit
(`upgradeDeficit(w, b) === null` vor jedem Aufstieg), `won = true`. Je Stufe: Aufstieg am ersten Wachstumstakt mit
«voll» **und** `tick − satisfiedSince ≥ wait`; nach dem Aufstieg `satisfiedSince = Aufstiegstick`.

| Einstellung              | Takt | P → S  | S → B  | B → K  | K voll (20) | gegen Vorschlag B.3     |
| ------------------------ | ---- | ------ | ------ | ------ | ----------- | ----------------------- |
| keins, alle «normal»     | 50   | t0+300 | t0+600 | t0+950 | **t0+1200** | gleich                  |
| keins, P+S «niedrig»     | 50   | t0+150 | t0+350 | t0+700 | **t0+950**  | gleich                  |
| Wohlfahrt, alle «normal» | 40   | t0+200 | t0+400 | t0+680 | **t0+880**  | gleich                  |
| Wohlfahrt, P+S «niedrig» | 40   | t0+160 | t0+320 | t0+600 | **t0+800**  | 790 → 800 (Takt-Raster) |

Herleitung Zeile 4: P füllt 1 → 4 bis t0+120, Wartezeit 150 erfüllt ab t0+150, nächster Takt t0+160; S füllt 4 → 8
in 160 Ticks (bis t0+320), Wartezeit 150 ab t0+310 → t0+320; B füllt 8 → 15 in 280 Ticks, Wartezeit 200 → t0+600;
K füllt 15 → 20 in 200 Ticks → t0+800. Der Vorschlag rechnete 150 + 160 + 280 + 200 = 790 ohne Takt-Raster.

## F. Endzustand, Auflage B2 (AK-M13E1-20)

Welt A.2 (Steuer 1760 je 100 Ticks) plus Kontor, Amtsstube und 32 Schulen (nominaler Unterhalt 820, Zeile 4 in B),
aktive Amtsstube, 600 Ticks ab beiden Überträgen 0:

| Edikt     | Steuer | Unterhalt | Bilanz (ohne Zukauf) | Δ gegen keins | Anteil an 5640 |
| --------- | ------ | --------- | -------------------- | ------------- | -------------- |
| keins     | 10 560 | 4920      | 5640                 | –             | –              |
| Sparen    | 9820   | 3936      | 5884                 | **+244**      | 4,3 %          |
| Wohlfahrt | 10 032 | 4920      | 5112                 | **−528**      | −9,4 %         |
| Handel    | 10 560 | 4920      | 5640                 | 0             | 0              |

Handel mit 48 Stein Zukauf je 600 Ticks (Glashütten-Bedarf Phase c, ein Kauf zu 48): 720 → 576, **+144**. Ohne
Amtsstube (Unterhalt 800, Vorschlag Phase c) ergibt Sparen +220 (= Vorschlag B.2: +221 je min), das sind 4,4 % der
Bilanz nach Zukauf (5040, Vorschlag A.1). Kein Edikt bringt im Endzustand mehr als 5 % der Bilanz: **bewusst
klein** (Auflage B2). Im Endzustand ist das Edikt eine Feinsteuerung; die spürbare Wahl liegt im Zukauf (Handel,
später Denkmal E2) und in Ausbauwellen (Wohlfahrt, Abschnitt E).

## G. Takt und Schrumpfen (AK-M13E1-11)

- Wachsen: Pionierhaus 1 Einwohner, erfüllt, ab t0 = 2000: Takt 50 → 2 / 3 / 4 Einwohner bei 2050 / 2100 / 2150;
  Takt 40 → bei 2040 / 2080 / 2120. Zwischen den Takten keine Änderung.
- Schrumpfen: Kaufleute-Haus 20 Einwohner, Nahrung im Lager 0 (unerfüllt) ab t0 = 2000: nach 400 Ticks (Tick 2400)
  keins 12 Einwohner (8 Takte), Wohlfahrt 10 (10 Takte). Das ist der zweite Preis der Wohlfahrt.
- Edikt-Wechsel mitten im Takt: Takt ist die Phase `tick % growthInterval(w) === 0`, nicht ab Erlass gezählt;
  Erlass Wohlfahrt bei Tick 2010 → nächster Wachstumstakt 2040.
