# Anhang 01 — Bilanzen M11 (design-economy-designer, M11-D-W1)

Werte = Vorschläge für `src/sim/defs/`. Raten je 100 Ticks (T); 1 min = 600 T bei 1×; Ausstoss = 100 / `cycle`. Bilanz
je EW = Steuer − Kettenunterhalt ÷ versorgte EW (ohne Dienste, wie S12 §2). Nahrung 0,5 je EW.

## (a) S2 Variante A — drei Nahrungsquellen

**Befund (Tech):** Die Regel `radius` zählt Terrain auch unter Gebäuden (Bau auf Wald erlaubt). Ein 2×2-Hof auf Gras
erfüllt „min 4" mit dem Grundriss, ein Holzfäller auf Wald „min 1" mit seiner Kachel: Flächenkonkurrenz gibt es heute
nur über den Grundriss. **(A)** Neues Regelfeld `free: true` (nur unbebaute Kacheln ohne Weg zählen), nur an den neuen
Gebäuden; Baseline bitgleich. Zonen dürfen überlappen; exklusive Zonen = Backlog.

Varianten: A1 Gleichpreis (alle 2,0 Geld je Nahrung) verworfen, die billige Jagdhütte dominiert im Wald. A3
Rinderfarm mit Input verworfen: zweite Kette, doppelter Unterhalt, stets vom Fischer dominiert. **Input: nein**, ihr
Preis ist die Weide, die Schäferei und Zuckerrohr brauchen (S12 §2: Fläche ist der Engpass). **Empfohlen A2
„Dreieck"** (`buildings.ts`, neu `hunter`, `cattlefarm`):

| Feld               | Fischer (Ist)  | Jagdhütte                 | Rinderfarm               |
| ------------------ | -------------- | ------------------------- | ------------------------ |
| Grösse, `cost`     | 1×1, 100/5/2/0 | 1×1, 50/2/1/0             | 2×2, 250/15/3/0          |
| `upkeep`, `cycle`  | 5, 40 → 2,5    | 5, 50 → 2,0               | 10, 20 → 5,0             |
| `site`             | coast          | r 3, forest, min 10, free | r 3, grass, min 16, free |
| `stormAffected`    | ja             | **nein**                  | ja                       |
| EW je Gebäude      | 5              | 4                         | 10                       |
| Unterhalt / Nahr.  | 2,0            | 2,5                       | 2,0                      |
| Geld/EW über 6000T | 20 + 60 = 80   | 12,5 + 75 = 87,5          | 25 + 60 = 85             |
| Konkurrenz         | Küste          | Holzfäller, Roden         | Schäferei, Rohr, Häuser  |

Radius 3 = 29 Kacheln (1×1) bzw. 32 (2×2). Geld liegt innerhalb ±10 %; der Standort entscheidet. Fischer: billigster
Lauf, aber Küste und Sturm. Jagdhütte: billig, sturmfest, viele Gebäude. Rinderfarm: wenige Gebäude, frisst Weide.

**Bilanz je EW (Steuer normal)**, übrige Ketten wie S12 §2 (Stoff 2,5, Rum 3,0, Glas 2,0 je EW):

| Stufe (Steuer) | Fischer, Rinderfarm | Jagdhütte        |
| -------------- | ------------------- | ---------------- |
| Pioniere (2)   | 2 − 1 = +1,0        | 2 − 1,25 = +0,75 |
| Siedler (7)    | +3,5                | +3,25            |
| Bürger (14)    | +7,5                | +7,25            |
| Kaufleute (20) | +11,5               | +11,25           |

Überall positiv. Überschuss endet bei Lager 100; Verkauf zu 3 deckt 2,0 bis 2,5 Unterhalt je Nahrung kaum, kein
Endlos-Gewinn.

| Referenzlauf (Nahrung 25 / 30) | 50 Bürger (Tick 6050) | 60 Kaufleute | Unterhalt |
| ------------------------------ | --------------------- | ------------ | --------- |
| Küste                          | 10 Fischer            | 12           | 50 / 60   |
| Wald                           | 13 Jagdhütten         | 15           | 65 / 75   |
| Weide                          | 5 Rinderfarmen        | 6 (96 Gras)  | 50 / 60   |
| Mix                            | 6 Fischer + 2 Rinder  | 6 + 3        | 50 / 60   |

Endzustand 50 Bürger, Küste: 700 Steuer − 50 − 125 (Stoff) − 150 (Rum) = +375 = +7,5 je EW; Wald: 700 − 65 − 275 =
+360 = +7,2. Wildbestand: Backlog.

## (b) S12-Fit — Ausbaustufen (Regel Variante C)

Zyklus ×0,6 / ×0,4, Unterhalt ×1,3 / ×1,7 aufgerundet, Geld 50 / 75 %, Güter aufgerundet, Gebühr 1×1: 2, 2×2: 3.
R = (Geld + Gebühr × Verkaufspreis) ÷ (Mehrleistung × Neubaugeld); Stoff 12, Rum 18.

| Gebäude (Basis)    | Stufe 2                       | Stufe 3                     | R (2 / 3)   |
| ------------------ | ----------------------------- | --------------------------- | ----------- |
| Fischer (Ist)      | 24, 7, {50,3,1,0} + 2 Stoff   | 16, 9, {75,4,2,0} + 2 Rum   | 1,11 / 1,33 |
| Jagdhütte (50/5)   | 30, 7, {25,1,1,0} + 2 Stoff   | 20, 9, {38,2,1,0} + 2 Rum   | 1,47 / 1,78 |
| Rinderfarm (20/10) | 12, 13, {125,8,2,0} + 3 Stoff | 8, 17, {188,12,3,0} + 3 Rum | 0,97 / 1,16 |

Unterhalt je Nahrung Stufe 3: Rinderfarm 1,36, Fischer 1,44, Jagdhütte 1,80. **Gebühr passt** für die Rinderfarm
(R ≈ 1). Jagdhütte R > 1,4 wie Holzfäller: gewollt, Neubau bleibt der Weg; Alternative Gebühr 1 / 1 → R 1,11 / 1,34,
nur falls freier Wald knapp wird. Rinderfarm Stufe 3 trägt 25 EW (Klumpenrisiko Brand wie S12).

## (c) S10 (b) — Buchung je Tick mit Übertrag

- Steuer: `taxCarry += Σ(EW × tax × (erfüllt ? 2 : 1)) × pct`, gebucht `floor(taxCarry / TAX_CARRY_DIVISOR)`.
  `TAX_CARRY_DIVISOR = UPKEEP_INTERVAL × 100 × 2 = 20000` (`defs/timing.ts`, abgeleitet; Halbe = Faktor 0,5).
- Unterhalt: `upkeepCarry += Σ upkeep`, gebucht `floor(upkeepCarry / UPKEEP_INTERVAL)`.

| 20 Siedlerhäuser à 8 EW, normal | heute je 100 T | je Tick                          |
| ------------------------------- | -------------- | -------------------------------- |
| Steuer, alle erfüllt            | +1120          | 224000 → 11, +1 alle 5 T = 1120  |
| Unterhalt Ketten                | −600           | −6                               |
| Bilanz / min                    | +3120          | +3120                            |
| niedrig (70) / 10 unerfüllt     | 784 / 840      | 156800 / 168000 je T → 784 / 840 |

Rundung: heute bis 5 Münzen je min Verlust (sechs Abrundungen), neu < 1 insgesamt. **Aufstiegszeitpunkte
(qualitativ):** Geld kommt im Mittel 50 T früher (→ früher), aber der Schnappschuss bei Tick % 100 zählt heute den
gerade gewachsenen Stand; je Tick zählt der Mittelwert (wachsendes Haus ≈ 1,5 EW weniger). Netto: leicht später in
Wachstumsphasen, leicht früher im Endzustand, meist ohne Wirkung (Geld bindet selten). **Anzeige:** Kontostand jeden
Frame aus der Welt lesen (ändert sich je Tick, 10 Hz bei 1×, keine Interpolation); „/ min" höchstens 2× je Sekunde
neu rechnen, damit Erfüllungs-Flackern nicht zittert.

## (d) Gedämpfter Aufstieg bei Defizit

**Bilanz:** `goodsBalance().net` je Bedarfsgut der Zielstufe, **prospektiv** `net − Δ`, Δ = maxEW(Ziel) × Rate −
EW × Rate(jetzt). Δ 2→3: Nahrung 3,5, Stoff 1,4, Rum 3,0; 3→4: Nahrung 2,5, Stoff 1,0, Rum 1,0, Glas 2,0. Ohne Δ
sieht der erste Bürger ohne Brennerei „Rum 0, kein Defizit". Aufstiege im selben Takt: Budget einmal rechnen, jeder
zieht sein Δ ab (Gebäudereihenfolge, deterministisch). **Einmalkosten** (Aufstieg, 1 Einheit je neuem Gut,
Ausbau-Gebühr S12) sind Bestand, nicht Fluss: nicht in der Bilanz.

| Variante                              | Wartezeit (300)       | Tempo     | Hungerrisiko | Erklärbar |
| ------------------------------------- | --------------------- | --------- | ------------ | --------- |
| **A** `UPGRADE_DEFICIT_WAIT_FACTOR` 2 | 600                   | −300 T    | gesenkt      | hoch      |
| B harter Stopp                        | ∞ bis Bilanz ≥ 0      | blockiert | ≈ 0          | mittel    |
| C 300 × (1 + min(D/Bedarf, 1))        | 330 bei 10 %, max 600 | kaum      | mittel       | niedrig   |

**Randfälle:** Bilanz 0 nach Δ dämpft nicht. Lager voll bei Defizit dämpft trotzdem; Panel zeigt „Vorrat reicht noch
X min". Brand, Sturm: nominell (`goodsBalance` ignoriert Ausfall, R115). Verarbeiter ohne Input zählt nominell
(Mangel zeigt sich am Rohgut). Steuer niedrig: 150 → 300. **Empfehlung A prospektiv:** ein Satz im Panel, Vorrat
nutzbar; B blockiert jede ausgeglichene Kette, C dämpft kleine Defizite kaum. Messprobe vorher (Programm 3.1).

## (e) R161 — Stein: Glashütte gegen Aufstieg 3→4

60 Kaufleute: Glas 6 → 3 Glashütten → Stein 6 (+ Holz 6) je 100 T; Steinbruch 1,67.

| Phase Kaufleute ≈ 1550 T (R161: 8550 → 10100) | Stein     |
| --------------------------------------------- | --------- |
| Fluss Glashütten 6 × 15,5                     | 93        |
| Bau 3 Glashütten + Badehaus                   | 50        |
| Aufstiege 3→4, 3 bis 4 Häuser × 10            | 30 bis 40 |
| Summe / Ausstoss 4 Steinbrüche                | 178 / 103 |

Ohne Vorrat ≈ 7 Steinbrüche (4 Fluss, 3 Einmalposten). Glashütten laufen ohne Glasbedarf bis Lager 100 weiter und
nehmen dem Aufstieg den Stein.

| Variante                         | Wirkung                             | Kosten           |
| -------------------------------- | ----------------------------------- | ---------------- |
| 1 nichts, Panel-Hinweis          | +3 Steinbrüche (+30 Unterhalt)      | Falle bleibt     |
| **2** `GLASS_STONE_RESERVE` = 10 | Hütte startet erst ab Stein ≥ 11    | Baseline, Ruling |
| 3 Eingangssperre Amtsstube (S5)  | Spieler sperrt Stein für Produktion | UI, Save-Feld    |

**Empfehlung 2**, Wert = `TIERS[3].upgradeCost.stone`; Zustand „hält Stein zurück". Kein Verklemmen: Hütte hält bei
10, Steinbruch füllt nach, Glas entsteht, Aufstieg (10 Stein + 1 Glas) geht. Bauen darf die Reserve nutzen.
Variante 3 später für alle Eingänge.

## (f) S3 — Holzfäller ohne Wald

Live je Tick mit derselben Regel wie beim Bau; Zustand „kein Wald" wie `waitingInput`, Unterhalt läuft weiter. Gilt
auch für die Jagdhütte (`free`).

| Fall                    | Befund                                                                 |
| ----------------------- | ---------------------------------------------------------------------- |
| Holzfäller auf Wald     | eigene Kachel zählt, bebaut nicht rodbar → nie „kein Wald" (harmlos)   |
| Eigene Zone roden       | Selbstschaden; Abriss erstattet 50 % wie immer, keine Extra-Erstattung |
| Roden liefert kein Holz | bleibt (Programm 3.7)                                                  |
| Aufforsten für Standort | Holzfäller 1 Kachel, harmlos; Jagdhütte 10 Kacheln                     |

Kosten (`defs/`): Roden 10, Aufforsten 25 Geld je Kachel. Holzfäller: 3,33 Holz (Kaufwert 33) gegen Unterhalt 5.
Jagdhütte per Aufforsten: 10 × 25 + 50 = 300 gegen Fischer 100, nicht dominant. Weide für Rinderfarm roden: 160.
**Erschöpfung und Nachwachsen des Walds bleiben Backlog** (Save-Feld je Kachel, Baseline), mit dem Wildbestand.

## Balancing-Test und Ruling-Vorschläge

(a), (b), (f) bitgleich, solange der Test weder neue Gebäude baut noch rodet (Annahme, Test nicht gelesen).

- S10 (b) Buchung je Tick, Teiler 20000 — Werte je Minute gleich, Lücke „vor der Buchung abreissen" zu — Neumessung
  `off`/`normal`/`mild` und Fingerabdruck; bei Irrtum zwei Übertragsfelder zurückbauen.
- Gedämpfter Aufstieg A prospektiv — kein Aufstieg in die Hungerkrise — bei Irrtum Faktor 1.
- Glashütte Reserve 10 Stein — löst R161 ohne Testhelfer — bei Irrtum Wert 0 (= heute), Testhelfer zurück.
