# Anhang 02 — Messprobe S10 (design-balancing-analyst, M11-D-W2)

Messung in einer Kopie von `main` (1c7d587) im Scratchpad, Seed 3, Controller aus `tests/sim/`; das Repo blieb
unverändert. Der Basislauf der Kopie ist bitgleich zum Repo (Sieg 6050, minMoney 57, Endgeld 212). Messcode:
`messprobe/tests/sim/messprobe.test.ts`, Modi `MODE_S10=base|B|C|BC|T|U|P|BP|G|GH|H`. Alle Werte sind **[Mess]**;
der Messcode wird beim Plan neu geschrieben (die Messprobe-Testdatei aus dem Programm gab es noch nicht).

## 1. Baseline: Aufstiege bei negativer Warenbilanz (nominell, `goodsBalance`, Zielstufe)

| Lauf                         | Sieg                   | minMoney | Aufstiege | davon net < 0 beim Aufstieg                     | net < 0 nur in den 300 Ticks davor |
| ---------------------------- | ---------------------- | -------- | --------- | ----------------------------------------------- | ---------------------------------- |
| Referenz, Krisen aus         | 6050                   | 57       | 8         | 1 (Tick 6050, Rum −2,40)                        | 4                                  |
| Krisen „normal" + Feuerwache | 7050                   | 56       | 8         | 2 (Tick 650, Stoff −0,40; Tick 7050, Rum −2,40) | 3                                  |
| Kaufleute (zweites Ziel)     | 6050, Ziel 2 bei 10100 | 57       | 11        | 1 (derselbe Aufstieg 6050)                      | 4                                  |

Befund: Die **nominelle** Dämpfung (Wartezeit × 2 bei net < 0) greift im Referenzlauf **nie** als einziger Grund und
verschiebt keinen Tick (Modus C: 6050 / 7050 / 6050, Ziel 2 bei 10100; Modus B+C bitgleich zu B). Sie wäre
wirkungslos. Der Aufstieg bei negativer Bilanz kommt nur vor, wenn die Wartezeit längst über 600 Ticks liegt.

## 2. Buchung je Tick (b)

Formulierung der Messung: `taxCarry += round(Σ(EW × Steuer × Erfüllungsfaktor) × pct × 2)`, gebucht
`floor(taxCarry / 20000)`; `upkeepCarry += Σ Unterhalt`, gebucht `floor(upkeepCarry / 100)`; Überträge in der Kopie
ausserhalb des Saves.

| Variante                     | Referenz | Normal + FW | Kaufleute Ziel 1 / Ziel 2 | minMoney (Referenz) |
| ---------------------------- | -------- | ----------- | ------------------------- | ------------------- |
| Basis (alles alle 100 Ticks) | 6050     | 7050        | 6050 / 10100              | 57                  |
| nur Steuer je Tick (T)       | 7250     | 7850        | 7250 / 11300              | 94                  |
| nur Unterhalt je Tick (U)    | 8150     | 7750        | 8150 / 11500              | −88                 |
| beides (B)                   | 7250     | 7850        | 7250 / 11300              | 61                  |

- Die **+1200** kommen allein von der Steuer je Tick (T = B). Vermutung (nicht gemessen): Der alte Takt bucht die
  Steuer aus dem Stand am Buchungstick; bei wachsender Belegung liegt er über dem Durchschnitt der 100 Ticks.
- U allein ist ein Artefakt (Geld wird negativ, weil der Unterhalt früh fällt und die Steuer erst am 100er-Takt).
- Schwellen: `balance.test` (Sieg ≤ 7500, Geld > 0), Krisen normal (≤ 8000, knapp), Ziel 2 (≤ 12000) **halten** in B.
  Rot werden 14 von 304 Tests: 4 exakte Pins der Balance-Dateien (Sieg = 6050 zweimal, Fingerabdruck, Wiederladen im
  Sturm; Letzteres nur wegen des nicht gespeicherten Übertrags) und 10 Unit-Tests auf den 100-Tick-Takt (`economy`,
  `taxes`, `merchants`, `fire`, `population`).

## 3. Prospektive Dämpfung (Modus P), Wartezeit × 2

Bilanz prospektiv: `net − (maxEW(Ziel) − EW(jetzt)) × Rate(Ziel)` je Bedarfsgut der Zielstufe; Mehrfachaufstiege im
selben Tick ohne Budget.

| Lauf        | ohne (b): Sieg / Ziel 2 | mit (b): Sieg / Ziel 2              | Häuser mit Auslösung / davon Aufstieg tatsächlich verzögert |
| ----------- | ----------------------- | ----------------------------------- | ----------------------------------------------------------- |
| Referenz    | 6050 (±0), minMoney 20  | 6750 (−500 gegen B), minMoney 117   | 13 / 3                                                      |
| Normal + FW | 7150 (+100)             | 7850 (±0 gegen B)                   | 12–13 / 3                                                   |
| Kaufleute   | 6050 / 10100 (±0)       | 6750 / 11200 (Ziel 2: −100 gegen B) | 17 / 3                                                      |

Der bessere Wert mit (b) ist ein Controller-Effekt (Reihenfolge der Aufstiege), kein Regelversprechen. minMoney 20
ohne (b) ist nahe an 0: Die Spec muss das Szenario einzeln prüfen.

## 4. Glashütten-Reserve (Zyklusstart nur bei Stein ≥ 11), ohne (b)

| Lauf                                     | Referenz / Normal | erster Kaufmann | Ziel 2                             |
| ---------------------------------------- | ----------------- | --------------- | ---------------------------------- |
| Basis                                    | 6050 / 7050       | 8550            | 10100                              |
| Reserve mit Testhelfer-Stein (R161)      | 6050 / 7050       | 8550            | **nicht erreicht bis Limit 12000** |
| Reserve ohne Testhelfer-Stein            | 6050 / 7050       | 8550            | **nicht erreicht bis Limit 12000** |
| nur ohne Testhelfer-Stein (ohne Reserve) | 6050 / 7050       | **nie**         | nicht erreicht                     |

Folge: Die Reserve 10 ist mit dem Kaufleute-Controller unverträglich (Stufe-4-Aufstiege bis 10450/10550 statt
9850); der Testhelfer-Stein aus R161 bleibt nötig. Die Stein-Konkurrenz ist im Controller eine echte Falle.
