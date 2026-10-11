# M14-E1 · Testzeiten der berührten Tests auf der Basis (R392, E-052)

Gehört zum [Index](../2026-10-11-m14-e1-inselcharakter.md). Gemessen am 2026-10-11 auf `main` (Stand `src/` und
`tests/` = `9113e574`) mit `npx vitest related --run <Dateien> --reporter=json`, Start je Lauf bei 1-min-Load ≤ 4
(R329). **Vorbehalt:** Während der Läufe stieg die Last durch parallele Sessions zeitweise über 4 (bis 29); die Werte
sind obere Schranken. T00 misst bei neuer Basis neu.

## Mengen je Task

| Task | `related`-Dateien (src)                  | Testdateien                    | Tests                | Summe Dateizeit           |
| ---- | ---------------------------------------- | ------------------------------ | -------------------- | ------------------------- |
| T01  | Liste in der Task-Datei, Abschnitt Files | 188 (Obermenge T02 + 1)        | 3178 (> 200 ms: 300) | 393,0 s                   |
| T02  | `islands.ts`                             | 187                            | 3177                 | 462,6 s                   |
| T03  | Liste in der Task-Datei, Abschnitt Files | ≈ 188 (wie T01, Obermenge T02) | wie T01              | nicht gemessen (Last > 4) |
| T04  | `save.ts`                                | 67                             | 1733                 | 103,7 s                   |
| T06  | Liste in der Task-Datei, Abschnitt Files | 30                             | 658                  | 7,8 s                     |

T05 und T07 ändern kein `src/` (keine Messpflicht). Die gezielten Läufe der Umsetzer (Task-Dateien, Schritt
«Grün») bleiben klein; den vollen Lauf fährt nur der Controller.

## Direkt betroffene Dateien (Pins, Seed-Läufe)

`islands-gen.test.ts` 22 Tests, 10,4 s (AK-E1-01 ≈ 640 ms je Block à 25 Seeds → ≈ 26 ms je Seed), `save.test.ts`
233 Tests, 4,6 s, `scenario-saves.test.ts` 5,3 s, `balance-merchants.test.ts` 2,6 s (Controller-Lauf ≈ 1 s),
`seaGolden.test.ts` 0,2 s, `islands.test.ts` 0,3 s, `save-v12.test.ts` 0,5 s, `reserve-bitgleich.test.ts` 0,1 s,
`ui/islandCard.test.ts` und `ui/islandJump.test.ts` je < 0,1 s, `render/limits.test.ts` < 0,1 s,
`render/seaKorridor.test.ts` 0,7 s, `render/renderer.test.ts` 15,3 s.

**Budget neuer Tests:** Seed-Dateien je Block (100 Seeds) ≤ 3 s, je Datei ≤ 16 s (T01, T05); Spannen-Lauf T02 ≤ 1,5 s;
Controller-Test T05 ≤ 2,5 s; alle übrigen neuen Tests < 200 ms.

## Tests > 200 ms je Datei (Vereinigung T02, T04, T06)

Spalten: Anzahl Tests > 200 ms · längster Test (ms) · Summe dieser Tests (s) · Dateizeit (s) · in Menge T02/T04/T06.

| Datei                                 | > 200 ms | max ms | Summe s | Datei s | Menge |
| ------------------------------------- | -------- | ------ | ------- | ------- | ----- |
| `render/archipel.test.ts`             | 1        | 1330   | 1.3     | 1.5     | 24-   |
| `render/bauRuckeln.test.ts`           | 4        | 821    | 2.5     | 2.9     | 2--   |
| `render/camera.test.ts`               | 3        | 386    | 1.0     | 1.6     | 2--   |
| `render/decor.test.ts`                | 13       | 1270   | 7.6     | 11.0    | 24-   |
| `render/decorSea.test.ts`             | 3        | 6869   | 10.9    | 11.6    | 2--   |
| `render/decorStamps.test.ts`          | 4        | 11931  | 13.3    | 13.6    | 2--   |
| `render/dunes.test.ts`                | 5        | 6611   | 24.7    | 25.0    | 2--   |
| `render/errands.test.ts`              | 2        | 389    | 0.6     | 1.0     | 2--   |
| `render/fauna.test.ts`                | 16       | 2290   | 13.9    | 15.0    | 24-   |
| `render/forest.test.ts`               | 8        | 3088   | 12.3    | 14.3    | 2--   |
| `render/forestClearance.test.ts`      | 1        | 834    | 0.8     | 0.8     | 2--   |
| `render/forestFloorCover.test.ts`     | 2        | 2309   | 3.0     | 3.0     | 2--   |
| `render/geisterbauten.test.ts`        | 2        | 343    | 0.7     | 1.4     | 246   |
| `render/groundBeach.test.ts`          | 6        | 1687   | 5.2     | 5.2     | 2--   |
| `render/groundSwap.test.ts`           | 2        | 650    | 1.1     | 1.3     | 2--   |
| `render/iso-wood-reuse.test.ts`       | 1        | 3825   | 3.8     | 3.8     | 2--   |
| `render/iso.test.ts`                  | 5        | 520    | 1.7     | 2.1     | 24-   |
| `render/lichtVerdeckung.test.ts`      | 4        | 594    | 1.3     | 1.8     | 2--   |
| `render/massif-l6.test.ts`            | 7        | 18242  | 53.0    | 53.1    | 2--   |
| `render/massif.test.ts`               | 20       | 5853   | 26.9    | 30.0    | 2--   |
| `render/picking.test.ts`              | 1        | 470    | 0.5     | 0.8     | 24-   |
| `render/rauten.test.ts`               | 1        | 864    | 0.9     | 0.9     | 2--   |
| `render/renderer.test.ts`             | 17       | 4030   | 10.4    | 15.3    | 24-   |
| `render/seaKorridor.test.ts`          | 1        | 204    | 0.2     | 0.7     | 24-   |
| `render/seaPlanKeepOutIndex.test.ts`  | 2        | 7697   | 8.2     | 8.3     | 2--   |
| `render/sprites-kanten.test.ts`       | 1        | 3014   | 3.0     | 3.9     | 2--   |
| `render/sprites-signale.test.ts`      | 1        | 1386   | 1.4     | 1.4     | 2--   |
| `render/statusMarks.test.ts`          | 1        | 664    | 0.7     | 0.8     | 2--   |
| `render/terrain.test.ts`              | 35       | 4653   | 47.0    | 48.0    | 2--   |
| `render/terrainField.test.ts`         | 2        | 737    | 1.4     | 1.6     | 2--   |
| `render/terrainFoothillCache.test.ts` | 2        | 1728   | 2.6     | 2.7     | 2--   |
| `render/terrainFoothills.test.ts`     | 4        | 11378  | 19.1    | 19.7    | 2--   |
| `render/terrainReadback.test.ts`      | 1        | 605    | 0.6     | 0.6     | 2--   |
| `render/terrainRelief.test.ts`        | 7        | 2586   | 5.2     | 5.8     | 2--   |
| `render/terrainSea.test.ts`           | 2        | 3955   | 4.9     | 5.0     | 2--   |
| `render/trees-farn.test.ts`           | 3        | 3875   | 5.9     | 6.1     | 2--   |
| `render/trees-licht.test.ts`          | 1        | 1074   | 1.1     | 1.1     | 2--   |
| `render/trees-wald.test.ts`           | 10       | 3450   | 14.8    | 15.0    | 2--   |
| `render/trees.test.ts`                | 7        | 7490   | 13.4    | 13.5    | 2--   |
| `render/variants.test.ts`             | 2        | 4230   | 5.7     | 6.6     | 2--   |
| `render/verdeckung.test.ts`           | 3        | 285    | 0.7     | 0.8     | 24-   |
| `render/water.test.ts`                | 1        | 233    | 0.2     | 0.7     | 2--   |
| `render/weather.test.ts`              | 1        | 1323   | 1.3     | 1.4     | 2--   |
| `render/wildlife.test.ts`             | 14       | 1669   | 11.5    | 13.5    | 2--   |
| `sim/balance-crises.test.ts`          | 10       | 788    | 4.7     | 4.9     | 24-   |
| `sim/balance-edicts.test.ts`          | 4        | 1049   | 3.0     | 3.1     | 24-   |
| `sim/balance-flow.test.ts`            | 1        | 478    | 0.5     | 0.5     | 2--   |
| `sim/balance-merchants.test.ts`       | 4        | 988    | 2.6     | 2.6     | 24-   |
| `sim/balance-monument.test.ts`        | 2        | 595    | 0.9     | 1.2     | 24-   |
| `sim/balance-upgrade.test.ts`         | 2        | 435    | 0.7     | 0.7     | 2--   |
| `sim/balance.test.ts`                 | 1        | 423    | 0.4     | 0.4     | 2--   |
| `sim/buyPct.test.ts`                  | 3        | 1009   | 2.0     | 2.5     | 24-   |
| `sim/connect.test.ts`                 | 1        | 1400   | 1.4     | 1.5     | 2--   |
| `sim/edicts.test.ts`                  | 1        | 437    | 0.4     | 1.3     | 24-   |
| `sim/flow.test.ts`                    | 1        | 206    | 0.2     | 0.4     | 2--   |
| `sim/forest.test.ts`                  | 2        | 346    | 0.7     | 1.0     | 24-   |
| `sim/goal3.test.ts`                   | 1        | 263    | 0.3     | 1.1     | 24-   |
| `sim/islands-gen.test.ts`             | 19       | 1926   | 10.4    | 10.4    | 2--   |
| `sim/mapgen.test.ts`                  | 2        | 553    | 1.0     | 1.1     | 2--   |
| `sim/monument.test.ts`                | 1        | 367    | 0.4     | 1.3     | 246   |
| `sim/pause.test.ts`                   | 1        | 499    | 0.5     | 0.6     | 24-   |
| `sim/perf.test.ts`                    | 2        | 7053   | 9.3     | 9.3     | 2--   |
| `sim/placement.test.ts`               | 1        | 339    | 0.3     | 0.6     | 2--   |
| `sim/population.test.ts`              | 2        | 4840   | 5.1     | 5.8     | 24-   |
| `sim/save.test.ts`                    | 3        | 365    | 0.9     | 4.6     | 24-   |
| `sim/scenario-saves.test.ts`          | 4        | 1724   | 4.1     | 5.3     | 24-   |
| `sim/seaRoute.test.ts`                | 4        | 450    | 1.5     | 1.7     | 24-   |
| `sim/ships.test.ts`                   | 1        | 225    | 0.2     | 0.8     | 24-   |
| `sim/taxTiers.test.ts`                | 1        | 631    | 0.6     | 1.1     | 24-   |
| `sim/unlock-timeline.test.ts`         | 3        | 1074   | 1.8     | 1.8     | 2--   |
| `sim/unlocks.test.ts`                 | 1        | 601    | 0.6     | 0.8     | 24-   |
| `tools/renderqa.test.ts`              | 1        | 254    | 0.3     | 0.7     | 24-   |
| `ui/input.test.ts`                    | 1        | 239    | 0.2     | 0.4     | 24-   |
| `ui/islandTools.test.ts`              | 1        | 249    | 0.2     | 0.3     | 2-6   |
| `ui/time.test.ts`                     | 2        | 323    | 0.6     | 1.6     | 246   |
