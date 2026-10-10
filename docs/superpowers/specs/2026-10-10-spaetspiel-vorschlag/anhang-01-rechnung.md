# Anhang 01 · Rechnung Spätspiel (M13: Edikte I-031, Denkmal I-039)

Rechnung zu `docs/superpowers/specs/2026-10-10-spaetspiel-vorschlag.md`. Zeiten: 100 Ticks = 10 s (`TICK_MS` 100),
1 min = 600 Ticks. Messwerte stammen aus den Referenz-Controllern (`tests/sim/controller.ts`,
`tests/sim/merchantsController.ts`, Seed 3, Krisen aus), im Scratchpad nachgestellt (Edikte als Laufzeit-Änderung von `TAX_LEVELS`, `GOODS.*.buy`, `GROWTH_INTERVAL`); `src/` und `tests/` blieben
unverändert. Quellen stehen als `Datei:Konstante`.

## 0. Kurzfazit

1. **Wohlfahrt wie angenommen (Wartezeit −25 %, Steuer −10 %) ist eine tote Option.** Die Wartezeit ist ab der Bürger-
   Stufe nicht der Engpass (Füllzeit 350 > 300), und auf Pionieren und Siedlern schlägt «niedrig» sie billiger.
   Vorschlag: Wohlfahrt wirkt auf den Wachstumstakt (50 → 40 Ticks), Wartezeit 200, Steuer −5 Punkte.
2. **Sparen mit Steuer −5 % ist zu stark** (in allen Phasen im Plus, weil Steuer ÷ Unterhalt ≈ 2,2 < 20/5). Mit
   −7 Punkten bleibt es knapp im Plus (+84 … +221 Geld/min) und wird in je einem Szenario geschlagen.
3. **Handel: H2** (Kaufpreise −20 %, aufgerundet). H1 gewinnt nur in einer Nische; H2 in drei Szenarien. Keine
   Arbitrage (Marge ≥ 1 je Stück).
4. **Dominanz-Check bestanden** (B.4): kein Pflicht-Edikt, keine tote Option (mit Wohlfahrt B). Die Minimum-Regel
   verhindert Stapeln; der Defizit-Faktor greift **nach** der Untergrenze.
5. **Denkmal:** 3 Abschnitte, 600 Stein, 240 Werkzeug, 360 Glas, 240 Gewürz, 18 000 Geld. Eigenerzeugung 33 min;
   Vollzukauf 64 200 Geld (mit H2 54 960) und ≈ 10 min.
6. **Lieferregel L2** mit bedarfsabhängiger Reserve. L1 kann Glas und Gewürz auf 0 ziehen (Ziel 3 bis +6 min).
7. **Baseline bitgleich**, solange kein Edikt gewählt und kein Denkmal gebaut wird. Der Referenz-Lauf ohne Edikt
   reproduziert Ziel 1 bei Tick 6750 und Ziel 2 bei 11 500 (Pins in `balance-merchants.test.ts`).

## A. Spätspiel-Kasse

### A.1 Betriebszahl und Ergebnis

Der Controller baut 4 Wohnhäuser (`layoutFor`). «Typische Kolonie» ist diese Kolonie; Steuer und Unterhalt wachsen mit
weiteren Häusern ungefähr linear (Bilanz je Einwohner in A.2).

- (a) 50 Bürger-Ziel, Tick 6750 (`winTick`): 4 Bürgerhäuser, 50 Einwohner. Gemessen.
- (b) 60 Kaufleute, Tick 11 500: 3 Kaufleute-Häuser und 1 Bürgerhaus, 75 Einwohner. Gemessen.
- (c) 80 Kaufleute mit Route: 4 Kaufleute-Häuser, 80 Einwohner. Gerechnet: Steuer 4 × 20 × 22 = 1760
  (`TIERS[4].maxInhabitants`, `.tax`); Unterhalt = 670 (b) + 1 Fischer 5 + 1 Glashütte 25 + 4 Plantagen 60 + `kontor2`
  10 + 2 Schiffe 30 (`SHIP.upkeep` 15; Rundreise 500–800 Ticks, Kapazität 50 gegen Bedarf 48/min) = 800.

| Grösse                        | (a)      | (b)      | (c)      |
| ----------------------------- | -------- | -------- | -------- |
| Steuer T je 100 Ticks         | 700      | 1530     | 1760     |
| Unterhalt U je 100 Ticks      | 315      | 670      | 800      |
| T − U je 100 Ticks            | 385      | 860      | 960      |
| Steuer je min                 | 4200     | 9180     | 10 560   |
| Unterhalt je min              | 1890     | 4020     | 4800     |
| Zukauf Stein je min           | 0        | 540      | 720      |
| Zukauf Gewürz je min          | 0        | 1440     | 0        |
| **Bilanz je min nach Zukauf** | **2310** | **3180** | **5040** |
| T ÷ U                         | 2,22     | 2,28     | 2,20     |

Zukauf: Stein für Glashütten (`feedGlassworks`, 2 je Hütte und 100 Ticks, 15 Geld) und Gewürz (`feedSpice`, 0,1 je
Kaufmann und 100 Ticks, 40 Geld). (b): 36 × 15 = 540 und 36 × 40 = 1440 je min. (c): 48 × 15 = 720. Die Route ersetzt
den Gewürzkauf (1440/min) durch 600/min Unterhalt: netto +840/min.

### A.2 Bilanz je Einwohner (je 100 Ticks)

Netto = Steuer − Unterhalt ÷ Einwohner − Zukauf ÷ Einwohner.

| Phase | Einw. | Steuer/Einw. | Unterhalt/Einw. | Zukauf/Einw. | Netto/Einw. |
| ----- | ----- | ------------ | --------------- | ------------ | ----------- |
| (a)   | 50    | 14,00        | 6,30            | 0            | **7,70**    |
| (b)   | 75    | 20,40        | 8,93            | 4,40         | **7,07**    |
| (c)   | 80    | 22,00        | 10,00           | 1,50         | **10,50**   |

Endzustand (c): 80 × 10,5 = 840 je 100 Ticks = 5040/min und keine Geldsenke ausser Bauen. 600 Geld sind 7 s Einkommen:
das ist der Anlass der Idee.

### A.3 Warenüberschuss je Minute

Ausstoss = 600 ÷ Zyklus (`BUILDING_DEFS[..].cycle`, Stufen `LEVELS`). Der Controller baut weder Steinbruch noch
Werkzeugmacher und deckt Glas und Gewürz genau: **Überschuss der Controller-Kolonie = 0** (Stein, Gewürz in (b)
negativ). Überschuss entsteht nur durch zusätzliche Betriebe. Referenz-Ausbau R (Annahme, Stufe 1):

| Ware     | Betrieb (Zyklus)    | Ausstoss/min | Stufe 2 / 3 | Verbrauch (c)      | R: Betriebe                | Netto R |
| -------- | ------------------- | ------------ | ----------- | ------------------ | -------------------------- | ------- |
| Stein    | Steinbruch (60)     | 10           | 16,7 / 25   | 12 je Glashütte    | 3 Steinbrüche, 1 Glashütte | **18**  |
| Werkzeug | Werkzeugmacher (80) | 7,5          | 12,5 / 18,8 | nur Bau, Aufstiege | 1 Werkzeugmacher           | **7,5** |
| Glas     | Glashütte (50)      | 12           | 20 / 30     | 48                 | 1 Zusatz-Glashütte         | **12**  |
| Gewürz   | Plantage (50)       | 12           | kein Ausbau | 48                 | 1 Zusatz-Plantage          | **12**  |

R braucht 1 Holzfäller (Holz: 7,5 + 12 = 19,5/min gegen 20). Unterhalt R = 3 × 10 + 25 + 25 + 15 + 5 = 100 je 100 Ticks
= **600/min**. Baukosten von R gehen nicht in die Rechnung.

## B. Edikte

### B.1 Wirkungsformeln

- Sparen: `V = 6 · (u/100 · U − t/100 · T)` je min; positiv genau dann, wenn `T/U < u/t`.
- Steuer-Abzug in **Prozentpunkten** vom Satz (`taxPct(level, tier) − t`): `taxUnits` bleibt ganzzahlig,
  `TAX_CARRY_DIVISOR` unverändert. Ohne Edikt t = 0.
- Unterhalt-Abzug: Summe der `upkeepOf` einmal mit `(100 − u)/100` rechnen und abrunden, nur wenn u > 0.
- Wartezeit (`src/sim/population.ts` Z. 130–137): `waitBase = festive ? min(base, low.upgradeWait) : base`, dann
  `wait = waitBase × (damped ? UPGRADE_DEFICIT_WAIT_FACTOR : 1)`. Der Faktor greift also **nach** dem Minimum.
  Neu: `waitBase = min(base, festive ? 150, Wohlfahrt ? W)`. Ergebnis normal 300/600, niedrig und Fest 150/300,
  Wohlfahrt (W = 200) 200/400. Bei «hoch» (`base === null`) bleibt `null`: Wohlfahrt schaltet «hoch» nicht frei.
- Aufstiege werden nur an Wachstumstakten geprüft (`tick % 50`). Wartezeit 225 wirkt wie **250** (−17 %, nicht −25 %);
  darum W = 200.

### B.2 Wert je Edikt (Geld/min gegen «kein Edikt», ohne die einmaligen 600)

Z-Burst: Denkmal-Zukauf mit 5000 Geld/min Einkauf. Welle: vier neue Häuser (Pionier → Kaufmann) in 5 min.

| Edikt                                   | (a)   | (b)      | (c)      | Z-Burst   | Welle normal | Welle «niedrig» P+S |
| --------------------------------------- | ----- | -------- | -------- | --------- | ------------ | ------------------- |
| Sparen (Unterhalt −20 %, Steuer −7)     | +84   | +161     | **+221** | +221      | +221         | **+221**            |
| Wohlfahrt B (Takt 40, W 200, Steuer −5) | −210  | −459     | −528     | −528      | **+598**     | +35                 |
| Handel H2 (Kaufpreise −20 %)            | ≈ +84 | **+396** | +144     | **+1000** | +144         | +144                |
| Handel H1, 4 Waren zu 9/min             | 0     | 0        | +324     | 0         | 0            | 0                   |

Herleitung:

- Sparen: (a) `6 · (0,20 · 315 − 0,07 · 700) = 84`; (b) `6 · (134 − 107,1) = 161`; (c) `6 · (160 − 123,2) = 221`. Mit
  −5 Punkten wären es +168 / +345 / +432 und damit überall Standard.
- Wohlfahrt, Kosten `6 · 0,05 · T` = 210 / 459 / 528. Nutzen je neues Haus aus B.3: normal 320 Ticks × 4,4 Geld/Tick
  (Kaufleute-Haus 440 je 100 Ticks) = **1408**; mit «niedrig» auf P+S 160 Ticks = **704**. Welle (c):
  `4 · 1408 / 5 − 528 = +598`; `4 · 704 / 5 − 528 = +35`. Gleichstand mit Sparen bei ≈ 3,1 Häusern je 5 min.
- H2: 20 % des Einkaufs. (b) `0,2 · (540 + 1440) = 396`; (c) `0,2 · 720 = 144`; Z-Burst `0,2 · 5000 = 1000`. (a) ist
  nicht stationär; im Lauf (D.1) verkürzt H2 Ziel 2 wie Sparen um 300 Ticks.
- H1: Erholung 1 Punkt je 10 Ticks = 6/min (`SELL_RECOVERY_INTERVAL`), Abschlag 1 je Stück (`SELL_DROP`), Boden 30
  (`SELL_FLOOR`). Bei r Stück/min und Erholung q: Erlös `s · r` für r ≤ q, sonst `s/100 · (30 · r + q²/2)`. H1-Gewinn
  für 6 < r ≤ 12: `s · (0,7 · r − 0,18)`; für r > 12 nur `0,54 · s`. Vier Waren zu 9/min: Glas 122 + Werkzeug 92 +
  Gewürz 73 + Stein 37 = 324, aber 36 Stück/min Überschuss (≈ 4 Zusatzbetriebe). Unter 6/min ist der Wert 0.

### B.3 Pfadzeiten (Pionier → volles Kaufmannshaus)

Füllzeiten bei `GROWTH_INTERVAL` 50 (ein Einwohner je Takt): Pioniere 1 → 4 = 150, Siedler 4 → 8 = 200, Bürger 8 → 15
= 350, Kaufleute 15 → 20 = 250 Ticks. Je Stufe gilt `max(Füllzeit, Wartezeit)`.

| Einstellung                  | Pion. | Siedl. | Bürger | Kaufl. | Summe | gegen normal      |
| ---------------------------- | ----- | ------ | ------ | ------ | ----- | ----------------- |
| alle normal (300)            | 300   | 300    | 350    | 250    | 1200  | –                 |
| P+S «niedrig» (150)          | 150   | 200    | 350    | 250    | 950   | −21 %             |
| Wohlfahrt A (Wartezeit 200)  | 200   | 200    | 350    | 250    | 1000  | −17 %             |
| Wohlfahrt A + «niedrig»      | 150   | 200    | 350    | 250    | 950   | 0 gegen «niedrig» |
| Wohlfahrt B (Takt 40, W 200) | 200   | 200    | 280    | 200    | 880   | −27 %             |
| Wohlfahrt B + «niedrig»      | 150   | 160    | 280    | 200    | 790   | −34 %             |

Wohlfahrt A bringt nie mehr als «niedrig» (kostet dort nur 30 % einer kleinen Steuer: 2,4 bzw. 16,8 je Haus und
10 s) und auf Bürgern und Kaufleuten nichts. Das bestätigt der Lauf: Wohlfahrt A lässt Ziel 2 im reichen Zustand bei
7700 und verzögert es im armen über 12 000.

### B.4 Dominanz-Check

| Szenario                           | Sieger             | Zweiter       | Abstand                 |
| ---------------------------------- | ------------------ | ------------- | ----------------------- |
| (a) knappes Geld                   | Sparen ≈ H2        | Wohlfahrt     | Ziel 2 beide −300 Ticks |
| (b) Gewürz gekauft                 | **H2** +396        | Sparen +161   | 235                     |
| (c) Route steht                    | **Sparen** +221    | H2 +144       | 77                      |
| Z-Burst (Denkmal-Zukauf)           | **H2** +1000       | Sparen +221   | 779                     |
| Welle (≥ 3,1 Häuser/5 min), normal | **Wohlfahrt** +598 | Sparen +221   | 377                     |
| Welle mit P+S «niedrig»            | Sparen +221        | Wohlfahrt +35 | 186                     |

- **Pflicht-Edikt?** Nein. Jedes Edikt gewinnt mindestens ein Szenario. **Tote Option?** Nein (mit Wohlfahrt B). H1
  gewinnt nur die Nische (4 Waren im Band 6–12/min) und entfällt zugunsten H2.
- **Sparen als stiller Standard:** bleibt in (a)–(c) im Plus, weil `T/U ≈ 2,2 < u/t = 2,86`. Schlanke Kolonien
  (T/U > 2,86) kippen ins Minus; gewollt.
- **Stapel «niedrig» + Fest + Wohlfahrt:** Alle Wartezeiten sind ein Minimum über Werte ≥ 150; unter 150 geht nichts.
  Die schnellste Kombination (Pfad 790 statt 1200) kostet «niedrig» 30 % der P/S-Steuer, Wohlfahrt 5 Punkte auf alle
  Stufen (−459/min in (b)) und 10 Rum je Fest. Sie lohnt nur in der Welle und verliert im stationären Zustand 459/min.
  Keine dominante Kombination.
- **Defizit** ×2 greift nach dem Minimum: Fest/«niedrig» 300, Wohlfahrt 400, normal 600. Nichts fällt unter 300.

### B.5 H1 gegen H2 und Arbitrage

**Entscheid H2:** drei gewonnene Szenarien gegen eine Nische, Synergie mit dem Denkmal (+1000/min im Z-Burst), H1
wirkt bei Ausbaustufen (25–30 Stück/min) nur noch mit 0,54 · s.

Regel: `buyPrice = ceil(n · buy · 80 / 100)` über die Gesamtmenge. Marge Kauf − Auftragsprämie
(`floor(buy · ORDER_PREMIUM)`, `orders.ts`) und Kauf − höchster Verkauf (Boom `BOOM_PCT` 150, Anteil 100):

| Ware       | buy | H2 (n = 1) | Prämie | Kauf − Prämie | Verkauf max. | Kauf − Verkauf |
| ---------- | --- | ---------- | ------ | ------------- | ------------ | -------------- |
| Holz       | 10  | 8          | 7      | 1             | 6            | 2              |
| Stein      | 15  | 12         | 11     | 1             | 9            | 3              |
| Nahrung    | 8   | 7          | 6      | 1             | 4,5          | 2,5            |
| Wolle      | 12  | 10         | 9      | 1             | 7,5          | 2,5            |
| Stoff      | 30  | 24         | 22     | 2             | 18           | 6              |
| Zuckerrohr | 12  | 10         | 9      | 1             | 7,5          | 2,5            |
| Rum        | 40  | 32         | 30     | 2             | 27           | 5              |
| Glas       | 50  | 40         | 37     | 3             | 30           | 10             |
| Werkzeug   | 40  | 32         | –      | –             | 22,5         | 9,5            |
| Gewürz     | 40  | 32         | –      | –             | 18           | 14             |

Mit `floor` wären Nahrung (6,4 → 6), Wolle und Zuckerrohr (9,6 → 9) bei Marge 0: **aufrunden**. Kleinste Marge 1 Geld
je Stück: weder Kauf-und-Liefern noch Kauf-und-Verkaufen gewinnt. Stein, Werkzeug, Glas, Gewürz sparen exakt 20 %.

### B.6 Zyklisches Umschalten

Ein Wechsel kostet 600 und sperrt 3000 Ticks. Zyklus: 10 min Sparen, 5 min H2 für einen Zukauf-Block von 25 000, zurück:
Gewinn gegen «dauernd Sparen» = `0,2 · 25 000 − 5 · 221 − 2 · 600 = +2695` je Zyklus (≈ 180/min, 3,6 % des
Einkommens). Er ist an das **Einkaufsvolumen** gebunden (Denkmal-Zukauf 46 200 → höchstens 9240 Ersparnis,
einmalig); Wellen an die Hauszahl. Kein Dauer-Exploit. Wechselgebühr 1500 senkte den Zyklus auf +895.

## C. Denkmal

### C.1 Abschnitte

Waren aus dem Lager der Heimatinsel (`STORAGE_CAP` 100 je Gut). Geld wird beim **Start** eines Abschnitts abgebucht
(nur bei Geld ≥ Betrag, nie ins Minus); Waren folgen in Teilen.

| Abschnitt   | Geld   | Stein | Werkzeug | Glas | Gewürz | Dauer R (min) |
| ----------- | ------ | ----- | -------- | ---- | ------ | ------------- |
| 1 Fundament | 4000   | 200   | 80       | 60   | 40     | 11,2          |
| 2 Mauern    | 6000   | 200   | 80       | 140  | 100    | 11,1          |
| 3 Krone     | 8000   | 200   | 80       | 160  | 100    | 11,1          |
| **Summe**   | 18 000 | 600   | 240      | 360  | 240    | **33,4**      |

Ausstoss R: Stein 33,3 min (600 ÷ 18), Werkzeug 32,0 (240 ÷ 7,5), Glas 30,0 (360 ÷ 12), Gewürz 20,0 (240 ÷ 12). Die
Abschnitte binden die Erzeugung gleichmässig: Ablaufrechnung in Minutenschritten mit Lagerdeckel 100. Eine ungleiche
Verteilung (300 Stein im ersten, 0 im dritten Abschnitt) ergab wegen des Deckels 50 statt 33 min.

### C.2 Dauer und Kosten je Beschaffung

Kaufpreise `GOODS[..].buy`: Stein 15, Werkzeug 40, Glas 50, Gewürz 40. Zugrate 1 Stück/s und Gut = 60/min, also
Untergrenze ≈ 10 min (600 Stein ÷ 60).

| Beschaffung                     | Dauer (min) | Waren  | Geld total | mit H2 total |
| ------------------------------- | ----------- | ------ | ---------- | ------------ |
| alles aus R                     | 33,4        | 0      | 18 000     | 18 000       |
| nur Gewürz gekauft              | 33,4        | 9600   | 27 600     | 25 680       |
| Glas + Gewürz gekauft           | 33,4        | 27 600 | 45 600     | 40 080       |
| Stein + Werkzeug gekauft        | 30,0        | 18 600 | 36 600     | 32 880       |
| Stein + Werkzeug + Glas gekauft | 20,0        | 36 600 | 54 600     | 47 280       |
| **alles gekauft**               | **10,1**    | 46 200 | **64 200** | **54 960**   |

- Teilkäufe bringen kaum Zeit, weil vier Engpässe gleichauf liegen (30–33 min): man wählt die Linie, stopft keine
  Einzellöcher.
- Vollzukauf = 12,7 min Einkommen in (c); mit H2 10,9 min. «Spürbar», aber erreichbar; die 18 000 Geld sind die
  eigentliche Geldsenke.
- Eigenerzeugung kostet über den Unterhalt von R (33,4 × 600 = 20 040) rund 38 000, weniger als der Vollzukauf bei
  dreifacher Dauer: ein Zukauf kauft Zeit zu ≈ 1100 Geld je gewonnene Minute.
- Das Denkmal selbst hat Unterhalt 0 (kein Pflichtkosten-Sog).

### C.3 Gewürz-Konkurrenz mit der Gewürzstadt

Bedarf (c) 48/min; vier Plantagen (12/min) decken ihn **ohne Überschuss** (`WIN_SPICE_MERCHANTS` 80,
`WIN_SPICE_HOLD` 600, `spiceLoop`).

- Denkmal-Gewürz (240) aus der Erzeugung vor Ziel 3, Regel L1: bis 240 ÷ 48 = 5,0 min plus 1,0 min neue Haltezeit =
  **6 min** Verschiebung.
- Aus der Erzeugung mit L2 und Reserve: **0 min**; das Denkmal wartet auf die 5. Plantage (12/min, 20 min).
- Zugekauft: **0 min**; 240 × 40 = 9600 (H2 7680) = 1,9 min Einkommen.

Gewürz ist am Heimat-Kontor jederzeit **kaufbar** (40 Geld): Die Konkurrenz ist eine Geldfrage, keine Engstelle; die
Aussage «Gewürz und Glas sind die Engstelle» (I-039) gilt nur für die Erzeugung. Empfehlung: so lassen.

### C.4 Lieferregel

Verbrauch der Häuser (c): Glas 8 und Gewürz 8 je 100 Ticks. Eine Schiffsladung (50) deckt 625 Ticks, die Rundreise
dauert 500–800: Der Gewürzbestand muss zwischen zwei Ankünften ≈ 50–64 tragen.

- **L1** (Knopf, nimmt alles bis zur Restmenge): ein Klick kann Glas/Gewürz auf 0 ziehen; Häuser unerfüllt, halbe
  Steuer, `satisfiedSince` neu, Ziel 3 bis +1 min. Unsicher.
- **L2 mit fester Reserve 20:** reicht für Stein und Werkzeug, für Gewürz/Glas nicht (250 Ticks Bedarf < Rundreise).
- **L2 mit bedarfsabhängiger Reserve** `max(20, ceil(8 · Hausverbrauch je 100 Ticks))`: Glas/Gewürz 64 in (c), 48 in
  (b); Stein/Werkzeug 20. **Sicher.** Bei Lagergrenze 100 sind höchstens 36 Stück auf einmal entnehmbar; bei 60/min
  Zugrate unkritisch.

Nebenwirkung: L2 zieht jeden Überschuss über der Reserve ins Denkmal und verhindert Verkaufen. Empfehlung: **L2,
bedarfsabhängige Reserve, Schalter «Bau pausieren»**.

## D. Ziele und Baseline

### D.1 Wirkung auf die Ziele (Referenz-Lauf)

Edikt wird bei Ziel 1 gekauft, sobald 600 Geld da sind (Tick 6750 bis 6851); «reich» = +20 000 Geld bei Ziel 1.
Ziel 1 bleibt bei **6750** (Edikte erst danach).

| Edikt                            | Ziel 2 arm | Δ gegen 11 500 | Ziel 2 reich | Δ gegen 7700 |
| -------------------------------- | ---------- | -------------- | ------------ | ------------ |
| keins                            | 11 500     | –              | 7700         | –            |
| Sparen (−20 %, −7 Punkte)        | 11 200     | **−300**       | 7700         | 0            |
| Wohlfahrt A (W 200, −10 Punkte)  | > 12 000   | > +500         | 7700         | 0            |
| Wohlfahrt B (Takt 40, W 200, −5) | > 12 000   | > +500         | 7640         | −60          |
| H1                               | 11 600     | +100           | 7700         | 0            |
| H2                               | 11 200     | **−300**       | 7700         | 0            |

**Kein Edikt verkürzt ein Ziel stark** (grösster Gewinn 300 Ticks = 6,3 % der 4750 Ticks nach Ziel 1). Wohlfahrt
verzögert Ziel 2 bei knappem Geld, weil der Steuerabzug den Wachstumsgewinn schlägt; das ist die Preisseite der Option.
Der Controller baut keine neuen Häuser, der Welleneffekt (B.3) ist deshalb analytisch, nicht simuliert. Ziel 3: mit
diesem Controller nicht lauffähig (endet bei 60 Kaufleuten); gerechnet: Sparen und H2 neutral bis günstig, Wohlfahrt
verlängert bei knappem Geld, Denkmal-Gewürz nach C.3.

### D.2 Baseline und Balancing-Test

- Ohne Edikt: `t = 0`, `u = 0` (Unterhalt nur bei u > 0 gerechnet), Takt 50, Wartezeit unverändert, Kaufpreis
  `n · buy`. Ohne Denkmal läuft kein Zug (L2 nur bei «Bau läuft»). `balance.test.ts` (Sieg 6750, Grenze 7500),
  `balance-merchants.test.ts` (6750 / 11 500) und alle Pins bleiben bitgleich; die Probe ohne Edikt hat 6750/11 500
  reproduziert.
- Berührung nur über das **Save-Format**: neue Weltfelder (`edict`, `edictLockedUntil`, `monument`) heben die
  Save-Version; Fixtures (`fixtureV*.ts`, `scenario-saves`) ziehen nach. Ruling-Vorschlag: «Save-Version anheben, ältere
  Stände mit Hinweis abweisen — Edikt-/Denkmal-Felder sind nicht optional — Kosten bei Irrtum: ein alter Stand lädt
  nicht, Hinweis und Abweis-Test decken es ab».
- Werte in `src/sim/defs/` ändern sich nicht (nur neue Konstanten): kein Ruling für Balancing-Zahlen nötig.

### D.3 Randfälle

- **Amtsstube abgerissen:** Edikt endet ohne Erstattung; `edictLockedUntil` bleibt in der Welt (kein Sperr-Reset durch
  Abriss und Neubau).
- **Amtsstube brennt oder nicht angebunden:** Wirkung ruht wie `effectiveTaxLevel`; Edikt und Sperre bleiben.
- **Geld negativ:** Kauf und Wechsel abgelehnt («Zu wenig Geld»); ein laufendes Edikt wirkt weiter (Sparen hilft); keine
  laufenden Kosten, also keine Pleite-Spirale.
- **Spielstand mit Ziel 2 schon erreicht:** Edikte frei (`world.won`), Denkmal sofort baubar (`world.wonMerchants`).
- **Abschnitt ohne Geld:** startet nicht; Abriss ohne Erstattung. Zweites Denkmal und andere Insel: abgelehnt.
- **Edikt vor Ziel 1:** gesperrt («Erst nach dem Bürger-Ziel»).

## Empfohlene Werte

| Vorschlag                                | Wert                                                          | Def-Ort                                                     | Idee      |
| ---------------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------- | --------- |
| Edikt-Kauf und -Wechsel                  | 600 Geld                                                      | `defs/edicts.ts`, `EDICT_COST`                              | gleich    |
| Sperre nach Wechsel                      | 3000 Ticks                                                    | `defs/timing.ts`, `EDICT_LOCK`                              | gleich    |
| Freischaltung Edikte                     | `world.won`                                                   | `defs/edicts.ts`, `EDICT_UNLOCK`                            | gleich    |
| Sparen                                   | Unterhalt −20 %, Steuer −7 Punkte                             | `defs/edicts.ts`, `EDICTS.saving`                           | −5 %      |
| Wohlfahrt                                | Takt 40, Wartezeit 200, Steuer −5 Punkte                      | `defs/edicts.ts`, `EDICTS.welfare`                          | Wartezeit |
| Handel                                   | Kaufpreise −20 %, aufgerundet (H2)                            | `defs/edicts.ts`, `EDICTS.trade.buyPct` 80                  | H1        |
| Untergrenze Wartezeit                    | `welfare.upgradeWait >= TAX_LEVELS.low.upgradeWait`           | Test in `tests/sim/defs.test.ts`                            | gleich    |
| Denkmal Gebäude                          | 3×3, höchstens 1, Heimatinsel, Unterhalt 0                    | `defs/buildings.ts`, `BUILDING_DEFS.monument`               | gleich    |
| Denkmal Freischaltung                    | `world.wonMerchants` (Ziel 2)                                 | `defs/monument.ts`, `MONUMENT_UNLOCK`                       | gleich    |
| Abschnitte Geld/Stein/Werkz./Glas/Gewürz | 4000/200/80/60/40 · 6000/200/80/140/100 · 8000/200/80/160/100 | `defs/monument.ts`, `MONUMENT_STAGES`                       | 300/80/40 |
| Zugrate                                  | 1 Stück je Gut und 10 Ticks                                   | `defs/monument.ts`, `MONUMENT_PULL_TICKS`                   | gleich    |
| Reserve                                  | `max(20, ceil(8 · Hausverbrauch je 100 Ticks))`               | `defs/monument.ts`, `MONUMENT_RESERVE_MIN` 20, `_TICKS` 800 | 20        |

Pfade `defs/…` = `src/sim/defs/…`. Preisrundung H2 sitzt in `src/sim/trade.ts` (`buyPrice`).

## Offene Punkte (mit Empfehlung)

1. **Wohlfahrt-Hebel Takt 40.** Wartezeit allein ist tot (B.3). Empfehlung: Takt-Hebel; er verlangt, dass
   `GROWTH_INTERVAL` aus dem Weltzustand gelesen wird (`tickPopulation`). Risiko: Häuser schrumpfen bei Mangel 20 %
   schneller; Welle nur analytisch gerechnet, im Umsetzungspaket simulieren. Alternative: zwei Edikte (Sparen, Handel).
2. **Sparen −7 statt −5 Punkte.** Mit −5 ist Sparen überall Standard. Empfehlung: −7.
3. **Edikt-Preis.** 600 sind in (c) 7 s Einkommen, im Lauf aber 100 Ticks Verzögerung bei Ziel 1. Empfehlung: 600
   lassen, die Sperre 3000 bremst; Wechselgebühr optional 1500.
4. **Geldanteil des Denkmals** skaliert nicht mit der Kolonie (18 000 = 3,6 min in (c)). Empfehlung: lassen, über
   Warenmengen (Zeit) steuern.
5. **R ist eine Annahme.** Ausbaustufen (Stein Stufe 3 = 2,5-facher Ausstoss) verkürzen die Dauer. Empfehlung: Mengen
   nach dem ersten Spieltest um ±30 % anpassen; Werte stehen in `monument.ts`.
