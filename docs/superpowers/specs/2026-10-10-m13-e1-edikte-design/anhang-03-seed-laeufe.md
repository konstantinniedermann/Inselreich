# Anhang 03 · Seed-Läufe für die Auflagen B1 und B3 (Spec M13-E1)

Gehört zu [Spec M13-E1 Edikte und Betrieb stilllegen](../2026-10-10-m13-e1-edikte-design.md), AK-M13E1-17 bis
AK-M13E1-19 und AK-M13E1-21. Neue Testdatei `tests/sim/balance-edicts.test.ts`; sie nutzt `runMerchants` aus
`tests/sim/merchantsController.ts`, ändert den Controller aber **nicht** (er wählt nie ein Edikt, Vorschlag §7).

## A. Gemeinsamer Aufbau

- Welt: `createWorld(3)` wie in `balance-merchants.test.ts` (Seed 3, gleiche Krisenstufe wie dort), `layoutFor(w)`.
- Phase 1: `runMerchants(w, layout, t, (x) => x.won)` bis zum ersten Tick mit `won` (erwartet 6750, Pin aus
  `balance-merchants.test.ts`).
- **Amtsstube in jeder Variante, auch «keins».** Der Referenz-Controller baut keine Amtsstube; ohne sie wirkt kein
  Edikt (R1.2). Am Ende von Phase 1 setzt der Test in jeder Variante dieselbe Amtsstube über `placeBuilding` auf
  einen festen, angebundenen Platz ausserhalb des Layouts [Tech: Platz einmal bestimmen und im Test als Konstante
  ablegen]. Baukosten (200 Geld, 15 Holz, 2 Werkzeug, 5 Stein) werden vorher gutgeschrieben, damit Geld und Lager
  gleich bleiben; der Unterhalt (20 je 100 Ticks) läuft in allen Varianten.
- Kopien: nach dem Setzen der Amtsstube `deserialize(serialize(w))` je Variante (gleicher Stand, gleicher RNG).
- Edikt: in den Edikt-Varianten im selben Tick `setEdict(w, id)`; 600 Geld werden vorher gutgeschrieben
  (Kosten neutralisiert, damit die Varianten nur die Wirkung vergleichen). Erwartung `ok: true`.
- Phase 2: `runMerchants` bis `wonMerchants` oder `MERCHANT_TICK_LIMIT` (12 000).
- Messgrösse: Tick von `wonMerchants` (`t.wonMerchantsTick`) bzw. `null`.

Referenz **K′** = Variante «keins mit Amtsstube». K′ kann wegen des Amtsstuben-Unterhalts später als 11 500 liegen;
alle Vergleiche gehen gegen K′, nicht gegen den Pin 11 500 (der gilt nur ohne Amtsstube, AK-M13E1-21).

Hinweis zur Herkunft: Die Messwerte des Vorschlags (Anhang 01 D.1: 11 200 / 7640 / 7700) stammen aus einer
Laufzeit-Änderung der Defs **ohne** Amtsstube. Sie sind Erwartung, nicht Pin.

**Festwerte (R455 T-B2/Q-B4c):** Vor dem Merge stehen die gemessenen Werte (K′, Sparen, Handel, Wohlfahrt je Lauf,
`fullTick[i]` und `money` der Welle) als Festwerte (`const`) in `balance-edicts.test.ts`, und der Test prüft sie mit
`toBe` **zusätzlich** zu den Grenzen unten. Verfehlt ein Wert eine Grenze relativ zu K′, ist das ein
**Pflicht-Rulingpunkt**: Der Umsetzer stoppt und meldet die Werte an `lead-design`; Grenzen und Festwerte ändert nur
ein Ruling L0, nie der Umsetzer.

**Laufzeit (R455 T-B3/Q-B2):**

- Phase 1 (bis `won`) und Phase 2 von K′ (bis `wonMerchants`, Ausgang der Welle) laufen **einmal je Datei** in
  `beforeAll`; jede Variante startet aus einer Kopie `deserialize(serialize(stand))`. Kein Test rechnet Phase 1 neu.
- Timeout je Seed-AK: AK-M13E1-17 10 000 ms, AK-M13E1-18 15 000 ms, AK-M13E1-19 15 000 ms; `beforeAll` 15 000 ms.
- Zeitreserve-Regel: lokal unter `CI=true` gemessen (`make test`, `.studio/zeitreserve.json`) braucht jeder dieser
  Tests und der `beforeAll` höchstens 50 % seines Timeouts. Liegt ein Wert darüber, wird der Lauf geteilt (eine Datei
  je Lauf) statt das Timeout zu erhöhen.

## B. Lauf «arm» (AK-M13E1-19)

Kein Zusatzgeld. Varianten K′, Sparen, Handel, Wohlfahrt.

| Variante  | Erwartung (Vorschlag D.1) | Abnahmegrenze                            |
| --------- | ------------------------- | ---------------------------------------- |
| K′        | ≈ 11 500                  | `wonMerchantsTick` ≤ 12 000              |
| Sparen    | ≈ K′ − 300                | K′ − 600 ≤ Tick ≤ K′ − 100               |
| Handel    | ≈ K′ − 300                | K′ − 600 ≤ Tick ≤ K′ − 100               |
| Wohlfahrt | > 12 000                  | `null` (nicht bis 12 000) oder Tick > K′ |

Lesart: Sparen und Handel verkürzen Ziel 2 spürbar, aber nicht stark (≤ 600 Ticks = 12,6 % der 4750 Ticks nach
Ziel 1); Wohlfahrt kostet bei knappem Geld (Preisseite, B.4 Szenario a).

## C. Lauf «reich» (AK-M13E1-17, Auflage B1 Seed-Lauf 1)

Wie B, aber am Ende von Phase 1 erhält jede Variante +20 000 Geld (vor Amtsstube und Edikt). Varianten K′ und
Wohlfahrt.

| Variante  | Erwartung (D.1) | Abnahmegrenze           |
| --------- | --------------- | ----------------------- |
| K′        | ≈ 7700          | Tick ≤ 8000             |
| Wohlfahrt | ≈ 7640          | Tick < K′ (echt früher) |

Lesart: Ist Geld nicht knapp, beschleunigt der Takt 40 den Weg zu 60 Kaufleuten; die Wartezeit allein könnte das
nicht (Vorschlag B.3, Wohlfahrt A bleibt bei 7700).

## D. Lauf «Welle» (AK-M13E1-18, Auflage B1 Seed-Lauf 2, Kern)

Der Controller baut keine neuen Häuser; die Welle setzt der Test selbst.

1. Phase 1 und 2 wie B mit Variante K′ bis `wonMerchants` (erwartet K′ ≈ 11 500). Danach **ohne Controller**
   weiter: je Schritt `step(w)`, alle 10 Ticks `topUp(w)` (Testhelfer: Heimatlager Nahrung, Stoff, Rum, Glas,
   Gewürz, Holz, Werkzeug, Stein je auf 100 setzen, ohne Geld). Bis zum nächsten Tick T0, der Vielfaches von 200
   ist.
2. Bei T0 drei Kopien: **K** (keins), **S** (Sparen), **W** (Wohlfahrt); S und W bekommen 600 Geld gutgeschrieben
   und erlassen ihr Edikt.
3. Im selben Tick setzt der Test in jeder Kopie dieselben 4 Wohnhäuser über `placeBuilding` auf feste freie Plätze
   im Versorgungsradius des Kontors und im Dienstradius von Kapelle, Schule und Badehaus [Tech: Plätze einmal
   bestimmen, als Konstante ablegen; Baukosten gutschreiben]. Die Häuser starten mit 1 Pionier.
4. Lauf bis T0 + 3000 (5 min), weiter `topUp` alle 10 Ticks, kein Controller.

Messgrössen je Kopie: Tick, an dem das jeweilige neue Haus Stufe 4 mit 20 Einwohnern erreicht (`fullTick[i]`), und
Geld bei T0 + 3000 (`money`).

| Prüfung                                              | Abnahme                         | Erwartung (gerechnet)       |
| ---------------------------------------------------- | ------------------------------- | --------------------------- |
| alle 4 Häuser voll in K und in W                     | `fullTick[i] ≤ T0 + 3000`       | K ≤ T0+2050, W ≤ T0+1400    |
| W schneller als K, je Haus                           | `fullK[i] − fullW[i] ≥ 250`     | 320 (ohne Dämpfung) bis 650 |
| Geldvorteil der Wohlfahrt in der Welle               | `money(W) − money(K) > 0`       | ≈ +3000 bis +8000           |
| Wohlfahrt schlägt Sparen in der Welle                | `money(W) > money(S)`           | S − K ≈ +500 bis +900       |
| kein neues Haus schrumpft (Versorgung durch `topUp`) | Einwohner nie kleiner als zuvor | –                           |

Herleitung der Erwartung: Pfad ohne Dämpfung 1200 gegen 880 Ticks (Anhang 01 E); dämpft das Kaufleute- oder
Bürger-Gut der Kolonie (Glas-Bilanz der Referenz-Kolonie ist negativ), gelten Wartezeiten 600 gegen 400 und der Pfad
2050 gegen 1400. Nutzen je Haus ≥ 320 Ticks × 4,4 Geld = 1408 plus Vorsprung auf den Zwischenstufen; Kosten der
Wohlfahrt 5 Punkte auf die ganze Steuer (Phase b ≈ 1530 bis ≈ 3290 je 100 Ticks am Fensterende) ≈ 2300 bis 4900
über 3000 Ticks.

**Rückfall (O3):** Ist eine der vier Abnahmen in D nicht erfüllt, gilt B1 als nicht bestanden. Der Umsetzer stoppt,
meldet die Messwerte an `lead-design`; L0 entscheidet per Ruling über den Rückfall «zwei Edikte» (Sparen, Handel),
ohne Wohlfahrt (Spec §12, P-1).

## E. Baseline (AK-M13E1-21, Auflage B3)

Ohne jede Änderung am Test: `balance.test.ts` (Sieg 6750, Grenze 7500) und `balance-merchants.test.ts` (6750 /
11 500) laufen grün. `git diff main -- 'tests/sim/balance*.test.ts' tests/sim/e0Pins.ts tests/sim/e1Pins.ts` ist
**leer** (R455 Q-B4b); die neue Datei `balance-edicts.test.ts` ist kein Diff an bestehenden Dateien. Einzige
Ausnahme ist die mechanische Anpassung des `buyPrice`-Aufrufs in `balance-upgrade.test.ts` an die neue Signatur
(R455 T-B1), ohne geänderten Erwartungswert. Die Rückfaltung bleibt durch `foldBackToV9` gekapselt (Anhang 02 D).
