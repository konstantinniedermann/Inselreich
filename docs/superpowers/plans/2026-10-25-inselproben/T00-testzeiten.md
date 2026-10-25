# T00 · Testzeit-Ausgang (E-052, gemessen beim Plan)

Controller · ≈ 3 Tools · kein Agent-Start · gemessen 2026-10-25 11:11 auf `plan/inselproben` (= main `ec144e82` + Spec-Merge, kein `src/`-Diff), 1-min-Load 3,5

## Zweck

Zeiten der bestehenden Tests, die der Plan berührt, vor Task 1 festhalten, damit der Abschluss A/B vergleichen kann. Die Dateiliste ist zugleich die A/B-Liste.

## Lauf

`npx vitest run` über 24 Dateien: `tests/sim/{save,trial-save,helpers,farOrder-save,save-loyalty,scenario-saves,balance,balance-merchants,balance-crises,balance-monument,goal3,monument,economy,roads,queries,unlocks}.test.ts`,
`tests/ui/{time,menu,startCard,hints,texts,inspect,balanceFlow,hud}.test.ts` → **Exit 0**, 759 bestanden, 3 übersprungen, Dauer 9,08 s (real 9,58 s).

Hinweis: `npx vitest related --run src/sim/tick.ts` erfasst praktisch die ganze Suite (`tick.ts` ist überall importiert); deshalb die gezielte Liste.

## Ausgang (Tests > 200 ms)

| Datei                         | Test (gekürzt)                      | ms        |
| ----------------------------- | ----------------------------------- | --------- |
| `tests/sim/scenario-saves`    | AK-S5-01 jedes Szenario ladbar      | 1015      |
| `tests/sim/balance-merchants` | AK-B1-04 Laden beim ersten Kaufmann | 892       |
| `tests/sim/balance-crises`    | AK-B2-05 Laden mitten im Brand      | 742       |
| `tests/sim/scenario-saves`    | AK-S5-02 je Szenario eine Datei     | 585       |
| `tests/sim/balance-crises`    | AK-B2-06 Laden mitten im Sturm      | 580       |
| `tests/sim/balance-crises`    | AK-BAS-02 Schwellen                 | 492       |
| `tests/sim/balance-merchants` | AK-BAS-02 Kaufleute 6750/11 500     | 485       |
| `tests/sim/balance-merchants` | AK-B1-01 Sieg 6750, zweites Ziel    | 451       |
| `tests/sim/unlocks`           | AK-S1-17 «Alles frei» bitgleich     | 360       |
| `tests/sim/monument`          | AK-M13E2-07 Aktionen werfen nie     | 338       |
| `tests/sim/save` (Zeittest)   | T00 Rezept = Fixture v8             | 322       |
| `tests/sim/balance-monument`  | AK-M13E2-18 Lauf B                  | 312       |
| `tests/sim/balance-crises`    | AK-BAS-01 Referenz off              | 299       |
| `tests/sim/balance-merchants` | AK-B1-02 Messwerte vollständig      | 298       |
| `tests/sim/balance-crises`    | AK-B1-02 Stufe off Fingerabdruck    | 255       |
| `tests/sim/save` (Zeittest)   | AK-S1-15 Negativfälle               | 259       |
| `tests/sim/balance-crises`    | AK-B2-01 normal / mild              | 261 / 230 |
| `tests/ui/time`               | AK-UX-13 kein Text enthält «Tick»   | 222       |
| `tests/sim/goal3`             | AK-Z3-04 Schleife                   | 214       |
| `tests/sim/balance`           | 50 Bürger in 9000 Ticks             | 207       |

## Folgerung für die Mess-Tasks

Ein Controller-Lauf bis Tick 6750 kostet ≈ 0,25 s, bis 11 500 ≈ 0,45 s. T05 (7 Läufe ≤ 18 000 Ticks) ≈ 4–6 s, T06 ≈ 1–2 s; T07 (bis ≈ 35 000 Ticks) ≈ 2–4 s je
Lauf. Zeitlimit je `it` 30 s genügt mit Reserve; Messung der neuen Dateien im Messfenster (Index).
