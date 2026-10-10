# Anhang 03 · Seed-Läufe für die Auflage B3 (Spec M13-E2)

Gehört zu [Spec M13-E2 Denkmal als Wahlziel](../2026-10-10-m13-e2-denkmal-design.md), §6, AK-M13E2-12 und -18 bis
-20. Neue Testdatei `tests/sim/balance-monument.test.ts`. Sie nutzt `runMerchants` und `newMerchantTrajectory` aus
`tests/sim/merchantsController.ts` und `placeTownhall` aus `tests/sim/helpers.ts`, ändert sie aber **nicht** (kein
Controller baut ein Denkmal). Muster: [Anhang 03 der Spec M13-E1](../2026-10-10-m13-e1-edikte-design/anhang-03-seed-laeufe.md).

## A. Gemeinsame Regeln

- **K′-arm-Stand (Läufe B, AK-M13E2-20):** genau wie in `balance-edicts.test.ts`: `createWorld(3)`, `startColony`,
  Phase 1 bis `won` (Tick 6750), Amtsstube über `placeTownhall`, Phase 2 ohne Edikt bis `wonMerchants`, dann ohne
  Controller bis zum nächsten Vielfachen von 200. Erwartet: `wonMerchantsTick` = `K_ARM` = 11 800 und **T0 = 11 800**
  (Festwerte aus `balance-edicts.test.ts`). Weicht einer ab, stoppt der Umsetzer: Die E1-Festwerte gehen vor, ein
  Abweichen ist ein Baseline-Bruch (AK-M13E2-21). Begründung, warum nur dieser Stand: Spec §6.1 (b), R466 (2).
- **Synthetische Welten (Läufe A, C):** `createWorld(3, { unlockAll: true, crisisLevel: 'off' })`,
  `wonMerchants = true`, keine Häuser (Reserve 20), **Krisen aus** (**Setzung R489**, tech A4: Ausfälle an Steinbrüchen
  oder Glashütte würden t₁ und die Summen beliebig verschieben, die Pins würden spröde); Plätze als Konstanten im Test [Tech: einmal bestimmen].
- **Denkmal roh einsetzen:** `placeBuilding(w, 'monument', …)` auf einem festen, über einen Weg angebundenen Platz
  [Tech: Konstante `MONUMENT_AT`, Weg mit `placeRoad`]; Bauplatz- und Wegkosten werden vorher gutgeschrieben; 4000
  Geld werden vor `startMonumentStage` gutgeschrieben (Kosten neutralisiert). Erwartung je `ok: true`.
- **Festwerte (R455 T-B2):** Vor dem Merge stehen die Messwerte als `const` im Test und werden mit `toBe` geprüft,
  zusätzlich zu den Grenzen. Verfehlt ein Wert eine Grenze, ist das ein **Pflicht-Rulingpunkt**: Umsetzer stoppt,
  meldet an `lead-design`; Grenzen und Festwerte ändert nur ein Ruling L0. Reihenfolge im Plan (qa B3): erst messen, dann
  als `const` pinnen; liegt ein Messwert ausserhalb einer Grenze, wird nicht gepinnt, sondern gestoppt.
- **Laufzeit (R455 T-B3):** Phase 1 und 2 laufen **einmal je Datei** in `beforeAll` (Timeout 15 000 ms); jeder Lauf
  startet aus einer Kopie `deserialize(serialize(stand))`. Timeouts: Lauf A 10 000 ms, Lauf B 10 000 ms, Lauf C
  10 000 ms. Zeitreserve-Regel: lokal unter `CI=true` (`make test`, `.studio/zeitreserve.json`) braucht jeder Test und
  der `beforeAll` höchstens 50 % seines Timeouts; sonst wird die Datei geteilt, nie das Timeout erhöht.
- **Versorgung ohne Controller:** `feed(w)` alle 10 Ticks setzt Nahrung, Stoff, Rum und Holz im Heimatlager auf 100
  (wie `topUp` der E1-Welle, aber **ohne** die vier Denkmal-Güter), ohne Geld.

## B. Lauf A · Vollzukauf exakt (AK-M13E2-12)

Synthetische Welt, Denkmal, Lager der vier Güter 20 (= Reserve), `money = 100 000`, alle vier `buy` an, Tick 1000.
Zwilling: dieselbe Welt ohne `startMonumentStage` und ohne `buy` (gleicher Unterhalt).

1. Bei Tick 1000 `startMonumentStage` (4000 nicht gutschreiben; sie gehören zur Summe).
2. Schritte; sobald `stage` steigt, im selben Tick `startMonumentStage` für den nächsten Abschnitt.
3. Bis `monumentDone`.

| Prüfung                                    | Erwartung (Anhang 01 C) |
| ------------------------------------------ | ----------------------- |
| Ticks der Abschlüsse                       | 3000, 5000, 7000        |
| `money(Zwilling) − money(Lauf)` ohne Edikt | 64 200                  |
| dasselbe mit wirkendem Handel              | 54 960                  |
| Lager der vier Güter am Ende               | 20 (nie angetastet)     |

Variante Handel: `won = true`, Amtsstube angebunden, `setEdict(w, 'trade')` vor Tick 1000 in Lauf und Zwilling. Die
Festwerte gelten bei Kaufanteil 100 (R489, Spec R7.1); I-048 pinnt seine Fassung in seinem Plan nach.

## C. Lauf B · Referenz ohne Zusatzausbau (AK-M13E2-18, -20)

K′-arm-Stand bei T0, Denkmal roh eingesetzt, Abschnitt 1 gestartet, **kein** Zukauf. **Ab T0 kein Controller**
(**Setzung Nachtrag**, qa B3): `runMerchants` wird nach T0 nicht mehr aufgerufen, je Tick nur `feed` (alle 10 Ticks)
und `step`; Krisenstufe unverändert aus dem K′-Stand; Laufzeit 6000 Ticks (10 min).

Messgrössen (Festwerte): `delivered[g]` je Gut bei T0 + 6000, Endbestand der vier Güter, Kaufleute bei T0 und am Ende.

Hochrechnung (im Test berechnet und geloggt, nicht gepinnt): Rate `r_g = delivered[g] / 6000` je Tick; Dauer
Abschnitt 1 ≈ `max_g (Soll_g / r_g)`; ist ein `r_g = 0` bei offenem Soll, gilt «ohne zusätzliche Betriebe nicht fertig».

Erwartung (gerechnet, kein Pin): Der Stand bei T0 ist das Werk des Referenz-Controllers **bis** T0: Er hat weder
Steinbruch noch Werkzeugmacher noch Plantage gebaut und Stein für drei Glashütten sowie Gewürz für die Häuser
gekauft. Ab T0 kauft niemand mehr; also liefert das Lager Stein und Werkzeug nur, soweit
der Bestand bei T0 über 20 liegt, Gewürz nur über 48; die Glashütten stehen nach dem Stein im Lager still. Also wird
Abschnitt 1 voraussichtlich **nicht** fertig. README-Satz (Anhang 05) nach dem Messwert, Vorlage: «Ohne zusätzliche
Betriebe (Steinbruch, Werkzeugmacher, Glashütte, Plantage) wird schon der erste Abschnitt nicht fertig; plane Ausbau
oder Zukauf ein.» Liefert die Messung für alle Güter > 0, nennt der Satz die hochgerechnete Dauer in Minuten.

**Reserve-Prüfung (AK-M13E2-20), eigene Kopie des K′-Stands:** wie Lauf B, aber bei T0 Glas und Gewürz im
Heimatlager auf `monumentReserve(w, g) + 10` gesetzt (damit der Zug sicher aus dem Lager liefert), Laufzeit 1000
Ticks. Vor jedem Schritt `before = delivered`; stieg nach dem Schritt `delivered[g]` für Glas oder Gewürz (alle `buy`
aus, also aus dem Lager), gilt `stock[g] ≥ monumentReserve(w, g)`. Die Zahl der geprüften Fälle ist > 0 je Gut und steht nach der Messung
als Festwert im Test; keine feste Untergrenze vorab, weil die Häuser Glas und Gewürz verbrauchen und `feed` sie nicht
nachfüllt (qa B9c).

## D. Lauf C · R-Ausbau (AK-M13E2-19)

**Setzung Spec (P-3):** synthetische «R-Welt» statt K′-Stand. Grund: Im K′-Stand speist der Controller drei
Glashütten mit gekauftem Stein und die Häuser mit gekauftem Gewürz; ohne Controller fressen die Glashütten den Stein
der R-Steinbrüche, mit Controller bleibt der Steinbestand unter der Reserve. Die Rechnung C.1 rechnet R als
**zusätzliche** Erzeugung über einer versorgten Kolonie; das bildet die R-Welt ab, die Haus-Seite belegt AK-M13E2-20.

Aufbau (Plätze als Konstanten, angebunden, Kosten gutgeschrieben):

- 3 Steinbrüche (am Gebirge), 1 Werkzeugmacher im Radius einer Schule (Schule mitsetzen), 1 Glashütte;
- Plantagen-Ersatz: +1 Gewürz ins Heimatlager je 50 Ticks (Rate einer Plantage, 12 / min; eine echte Plantage braucht
  eine Fremdinsel mit Kontor und Route);
- Holz alle 10 Ticks auf 100; Lager Stein, Werkzeug, Glas, Gewürz bei t_s auf 20;
- Denkmal, Abschnitt 1 gestartet bei t_s (Vielfaches von 10), kein Zukauf.

Lauf bis Abschnitt 1 fertig oder bis t_s + 8736 (dann `null` = verfehlt).

| Grösse        | Erwartung (Anhang 01 D) | Abnahme                      |
| ------------- | ----------------------- | ---------------------------- |
| t₁ − t_s      | ≈ 6670 (11,1 min)       | 4704 ≤ t₁ − t_s ≤ 8736 (O11) |
| bindendes Gut | Stein, dann Werkzeug    | geloggt, kein Pin            |

Verfehlen der Spanne ist ein Pflicht-Rulingpunkt (Spec §6). Nur Abschnitt 1 wird simuliert (Laufzeit); Abschnitte 2
und 3 sind über die gleichen Stein- und Werkzeugmengen gleich lang (Rechnung C.1: 11,1 min).

## E. Baseline (AK-M13E2-21)

Ohne Änderung am Test: `balance.test.ts` (6750, Grenze 7500), `balance-merchants.test.ts` (6750 / 11 500),
`balance-edicts.test.ts` (alle Festwerte) grün. `git diff main -- 'tests/sim/balance*.test.ts' tests/sim/e0Pins.ts
tests/sim/e1Pins.ts tests/sim/seePins.ts` ist leer bis auf die neue Datei `balance-monument.test.ts`.
