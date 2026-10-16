> **Task-ID:** Task 4 (Paket M10-S2) — Teil 1 von 3
> **AK-IDs:** AK-S2-01 … -17, AK-S1-14 (c2), AK-F1-09 (b), `RF-2`, `PLAN-B9`, BG-1
> **blocked-by:** Task 2, Task 3
> **Gemeinsame Regeln:** [index.md](index.md) (Global Constraints) · Orga: [orga-06-schnittstellen.md](orga-06-schnittstellen.md) · [orga-07-datei-ownership.md](orga-07-datei-ownership.md) · [orga-11-bitgleich.md](orga-11-bitgleich.md) · [orga-12-geaenderte-tests.md](orga-12-geaenderte-tests.md)
> **Teile:** **T04a-amtsstube.md** (diese) · [T04b-amtsstube.md](T04b-amtsstube.md) · [T04c-amtsstube.md](T04c-amtsstube.md)

## Task 4: S2 — Amtsstube, wirksame Steuer, Ausgabesperre, Werkzeugmacher `noService`, Aufstiegsstopp, Taste I

**Paket** M10-S2 · **Implementierer** `tech-sim-engineer` (sonnet) · **Worktree/Branch** `.worktrees/m10-sim` ·
`feat/m10-sim` (nach dem Merge von Task 3) · **blocked-by** Task 2, Task 3 · **AK** AK-S2-01 … -17, AK-S1-14 (c2),
AK-F1-09 (b), `RF-2`, `PLAN-B9`, BG-1

**Files:**

- Create: `src/sim/townhall.ts`, `tests/sim/townhall.test.ts`, `tests/sim/imports.test.ts`
- Modify: `src/sim/types.ts`, `src/sim/defs/buildings.ts` (`townhall` am Ende, `toolmaker.requiresService`),
  `src/sim/defs/unlocks.ts` (U3 `buildings: ['townhall']`), `src/sim/tax.ts`, `src/sim/population.ts`,
  `src/sim/production.ts`, `src/sim/placement.ts` (`maxCount`), `src/sim/unlocks.ts` (`taxBlocks`),
  `tests/sim/helpers.ts` (`placeTownhall`), `tests/sim/scenarios.ts` (`galerie` + Amtsstube); Ausnahmen
  `src/render/sprites.ts` (Rückfall), `src/ui/hotkeys.ts` (Taste I), `src/ui/texts.ts` (`noService`),
  `src/ui/hints.ts` (Zeilen 11.9 für Amtsstube), `src/render/overlays.ts` (nur falls ein `switch` über
  `BuildingState` es verlangt)
- Test: `tests/sim/townhall.test.ts`, `tests/sim/imports.test.ts`, `tests/sim/save.test.ts` (AK-S1-14 c2),
  `tests/sim/forest.test.ts` (AK-F1-09 b), `tests/render/sprites.test.ts`, `tests/ui/hotkeys.test.ts`,
  `tests/ui/hints.test.ts`, `tests/ui/inspect.test.ts`; bewusst geändert T-8, T-10, T-12, dazu in
  `tests/sim/unlocks.test.ts` AK-S1-01 die Zeile U3 `buildings: []` → `['townhall']` (Spec: „in S1 leer")

**Interfaces:**

- Consumes: Tasks 1–3.
- Produces: `townhall.ts` (Blatt), `setTaxLevel`/`setGoodLock`/`setUpgradeStop` in `tax.ts`, `BuildingState`
  `'noService'`, `BuildingDef.requiresService`, `BuildingDef.maxCount`, `townhall` in `BUILDING_IDS` (letzter
  Eintrag) und in U3, `nextUnlocks(…).taxBlocks` echt, Taste I, Helfer `placeTownhall(w)` in `tests/sim/helpers.ts`.
