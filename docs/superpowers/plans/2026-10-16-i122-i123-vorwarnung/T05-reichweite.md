# T05 · I-123 Reichweite mit Stammkunde

`tech-ui-engineer` · Worktree `.worktrees/i122-reach` · ≈ 30 Tools · AK-R1 bis AK-R3 · blocked-by: T00 · Test zuerst (Rot-Beleg)

Dateien: `src/ui/contractDrain.ts` (neu, DOM-frei), `src/ui/hud.ts` (nur `chipView`, `reachLine`, `stockTooltip`), `tests/ui/contractDrain.test.ts` (neu). `tests/ui/hud.test.ts` und `bilanzCov.test.ts` nur lesen (müssen unverändert grün bleiben).

## Umsetzung

1. `contractDrain.ts`: `export function contractDrain(world: World, good: GoodId, island: number): number` = `c.amount * GOODS_BALANCE_TICKS / ORDER_PERIOD` bei `c !== null && c.good === good && c.island === island`, sonst `0` (`GOODS_BALANCE_TICKS` aus `./time`, `ORDER_PERIOD` aus `../sim/defs/timing`).
2. `reachLine(stock, net, drain = 0)`: Rechnung der Reichweite mit `net - drain` (`reachView(stock, net - drain, STORAGE_CAP)`); die in der Zeile genannte Rate ist die der Reichweite, also `net - drain` (sonst passt «Leer in 2:10 bei +0,3 / min» nicht); der Tooltip-Kopf (Zeile 1) bleibt die rohe Bilanz. Zusatz `(mit Stammkunde, ohne Handel und Aufträge)` nur bei `drain > 0`, sonst bitgleich `(ohne Handel und Aufträge)`.
3. `chipView`: `stockChipView(good, stock, balance[good].net - drain)` für Reichweite, **Pfeil aus roher Bilanz** (`stockChipView` bekommt zwei Werte; Signatur-Änderung klein halten, optionaler dritter Parameter `drain = 0`; Pfeilstelle per `rg -n "arrow" src/ui/hud.ts` finden). `stockTooltip`: `reachLine(stock, b.net, contractDrain(world, good, island))`.

## Tests (`contractDrain.test.ts`)

AK-R1 Vertrag 5 Rum, Heimat → `5 * 100 / 900`; andere Insel, anderes Gut, kein Vertrag → `0` · AK-R2 `reachLine(12, -1, 0.56)` enthält «Leer in», «(mit Stammkunde, ohne Handel und Aufträge)», Zeit kürzer als `reachLine(12, -1)`; `reachLine(12, -1)` bitgleich Bestand (AK-UR-05) · AK-R3 `chipView`: Bilanz +0,3, Abzug 0,56 → Reichweite «leer» (`reach`-Feld/Text), Pfeil aus roher Bilanz (`+0,3` zeigt Pfeil auf); Vertrag gekündigt → Chip wie vorher; Überschuss trotz Abzug: «Voll in …».

## Prüfschritte

`npx vitest run tests/ui/contractDrain.test.ts tests/ui/hud.test.ts tests/ui/bilanzCov.test.ts; echo EXIT=$?` · `npx tsc --noEmit; echo EXIT=$?` · `make lint; echo EXIT=$?` · `make conflicts; echo EXIT=$?`. Commit `feat: Reichweite rechnet den Stammkunden mit (I-123)`.
