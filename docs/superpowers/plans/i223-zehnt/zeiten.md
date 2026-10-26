# Zeit-Tests I-223 (R392/R905), Messung vorher

Zurück zum [Index](index.md).

Messung 2026-10-26 08:13:26–08:16:37 UTC im Plan-Worktree (main `07cd8183`), Testsperre gesetzt (E-080, owner l0),
**Last 3,57 beim Start, 3,51 am Ende** (1-min-Load; ≤ 4 während des Laufs). Befehl:
`npx vitest related --run --maxWorkers=2 --reporter=json` über `src/sim/{defs/tiers,defs/timing,types,world,tax,population,tick,save}.ts`,
`src/ui/{balancePreview,inspect,app}.ts`, `tests/sim/helpers.ts`. Wegen `types.ts` praktisch die ganze Suite:
**4404 Tests, Exit 0, keiner rot** (auch `perf.test.ts` AK-E0-15a grün bei dieser Last).

- `tests/sim/` und `tests/ui/`: **70 Tests > 200 ms**, davon **15 > 500 ms** (Tabelle). Tests unter `tests/render/` sind
  nicht aufgeführt; I-223 ändert dort keinen Code.
- Regel R905: kein Test neu > 500 ms; Tests der Tabelle höchstens + 50 %. T06 misst nachher nur gezielt (Tabelle «Gezielte Läufe» plus neue Tests, Last ≤ 4), T08 trägt die Spalte «Branch» nach (nur für gemessene Dateien). Neue Tests: AK-ZE-07 (3000 Schritte), AK-ZE-01/25
  (600 `tickTaxes`), AK-ZE-11 (600 Schritte), AK-ZE-22 (100 Schritte); Ziel je Test < 500 ms.
- Zeit-Tests mit Messwert, die I-223 berührt (Faltkette, Save): `scenario-saves.test.ts` AK-S5-01 (siehe Tabelle) und
  alle Verbraucher der Faltkette unter 500 ms bis auf die Tabellenzeilen.
- Rohdaten (nicht versioniert): Scratchpad der Plan-Session, `times.json`.

| ms (main) | Datei                           | Test                                                    | ms (Branch, T06) |
| --------- | ------------------------------- | ------------------------------------------------------- | ---------------- |
| 6027      | `sim/perf.test.ts`              | AK-E0-15a D1: Mittel je Schritt (best-of-3) innerhalb d |                  |
| 5522      | `sim/perf.test.ts`              | AK-E0-15b D1: Abdeckung per buildCoverage mindestens 5  |                  |
| 2895      | `sim/population.test.ts`        | AK-E0-12a D1: Abdeckung gleich Referenz über 1000 Schri |                  |
| 875       | `sim/scenario-saves.test.ts`    | AK-S5-01 jedes Szenario ist ladbar und Version 2        |                  |
| 850       | `sim/islands-c.test.ts`         | Spanne protokollieren (Seeds 1..300)                    |                  |
| 687       | `sim/connect.test.ts`           | matches a reference search on many seeded layouts of ro |                  |
| 580       | `sim/scenario-saves.test.ts`    | AK-S5-02 AK-B2-04 schreibt je Szenario genau eine Datei |                  |
| 568       | `sim/islands-gen.test.ts`       | AK-E1-02: Lage, Lücken, Seewege und Rahmen für Seeds 1… |                  |
| 561       | `sim/islands-gen.test.ts`       | D-139: d zählt nur die Strecke ausserhalb der Inselrech |                  |
| 547       | `sim/balance-edicts.test.ts`    | PLAN-M13-01 Determinismus: Wohlfahrt arm zweimal und mi |                  |
| 527       | `sim/buyPct.test.ts`            | Zusatz: Verkauf und Kauf erholen sich je nach eigenem I |                  |
| 525       | `sim/balance-merchants.test.ts` | AK-B1-04 Laden beim ersten Kaufmann: gleicher Endzustan |                  |
| 515       | `sim/unlock-timeline.test.ts`   | AK-BAS-03 off 150/350/550/4150/6750; normal …/5150/7850 |                  |
| 509       | `sim/islands-seeds-b.test.ts`   | AK-M14E1-12: Seeds (Block ab 501)                       |                  |
| 504       | `sim/balance-edicts.test.ts`    | AK-M13E1-19 arm: Sparen und Handel früher, Wohlfahrt ni |                  |

## Gezielte Läufe der Tasks (Summe und längster Test je Datei, main)

| Datei                           | Tests | Summe ms | max ms | ms max (Branch, T06) |
| ------------------------------- | ----- | -------- | ------ | -------------------- |
| `sim/seaGolden.test.ts`         | 3     | 90       | 41     |                      |
| `sim/balance-crises.test.ts`    | 12    | 2559     | 483    |                      |
| `sim/save.test.ts`              | 233   | 4110     | 338    |                      |
| `sim/save-contract.test.ts`     | 17    | 276      | 97     |                      |
| `sim/save-v11.test.ts`          | 21    | 206      | 30     |                      |
| `sim/scenario-saves.test.ts`    | 50    | 2108     | 875    |                      |
| `sim/reserve-bitgleich.test.ts` | 6     | 23       | 12     |                      |
| `sim/buyPct.test.ts`            | 20    | 1280     | 527    |                      |
| `sim/save-v12.test.ts`          | 41    | 332      | 37     |                      |
| `sim/save-v13.test.ts`          | 39    | 291      | 24     |                      |
| `sim/save-loyalty.test.ts`      | 12    | 112      | 28     |                      |
| `sim/farOrder-save.test.ts`     | 10    | 233      | 102    |                      |
| `sim/reserve-save.test.ts`      | 7     | 89       | 38     |                      |
| `sim/goal3.test.ts`             | 13    | 446      | 135    |                      |
| `sim/edicts.test.ts`            | 34    | 632      | 260    |                      |
| `sim/helpers.test.ts`           | 12    | 151      | 61     |                      |
| `sim/m5-session.test.ts`        | 2     | 118      | 63     |                      |
| `sim/trial-save.test.ts`        | 26    | 213      | 19     |                      |
| `sim/council-save.test.ts`      | 21    | 298      | 63     |                      |
| `sim/tick.test.ts`              | 9     | 88       | 28     |                      |
| `sim/taxes.test.ts`             | 23    | 140      | 22     |                      |
| `sim/taxTiers.test.ts`          | 36    | 520      | 289    |                      |
| `sim/townhall.test.ts`          | 16    | 105      | 13     |                      |
| `sim/population.test.ts`        | 30    | 3219     | 2895   |                      |
| `sim/trade.test.ts`             | 31    | 185      | 32     |                      |
