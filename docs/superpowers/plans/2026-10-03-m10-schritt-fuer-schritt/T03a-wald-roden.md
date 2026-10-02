> **Task-ID:** Task 3 (Paket M10-F1) — Teil 1 von 3
> **AK-IDs:** AK-F1-01 … -08, -09 (a), -10, `RF-3`, BG-1
> **blocked-by:** Task 1 (Review OK)
> **Gemeinsame Regeln:** [index.md](index.md) (Global Constraints) · Orga: [orga-06-schnittstellen.md](orga-06-schnittstellen.md) · [orga-07-datei-ownership.md](orga-07-datei-ownership.md) · [orga-11-bitgleich.md](orga-11-bitgleich.md) · [orga-12-geaenderte-tests.md](orga-12-geaenderte-tests.md)
> **Teile:** **T03a-wald-roden.md** (diese) · [T03b-wald-roden.md](T03b-wald-roden.md) · [T03c-wald-roden.md](T03c-wald-roden.md)

## Task 3: F1 — Wald roden und aufforsten (Sim), `layoutKey` mit Geländeart

**Paket** M10-F1 · **Implementierer** `tech-sim-engineer` (sonnet) · **Worktree/Branch** `.worktrees/m10-forest` ·
`feat/m10-forest` (ab Task-1-SHA) · **blocked-by** Task 1 (Review OK) · parallel zu Task 2 · **AK** AK-F1-01 …
-08, -09 (a), -10, `RF-3`, BG-1

**Files:**

- Create: `src/sim/defs/forest.ts`, `src/sim/forest.ts`, `tests/sim/forest.test.ts`
- Modify: `src/sim/queries.ts` (nur `layoutKey` und sein Doc-Kommentar)
- Test: `tests/sim/forest.test.ts`, `tests/sim/queries.test.ts` (T-9 und neuer `it` AK-F1-08)

**Interfaces:**

- Consumes: `functionLock` (Task 1), `checkAfford`, `pay` (`economy.ts`), `inBounds`, `tileAt`, `idx` (`world.ts`).
- Produces: `CLEAR_FOREST_COST`, `PLANT_FOREST_COST`, `canClearForest`, `canPlantForest`, `clearForest`,
  `plantForest` (Signaturen unter „Gemeinsame Schnittstellen"); `layoutKey` ändert sich bei jedem Geländewechsel.
- **Hinweis Ownership:** Task 2 läuft parallel auf `feat/m10-sim` und stellt dort Tests auf `unlockAll` um; dieser Task
  baut alle Testwelten selbst mit `createWorld(3, { unlockAll: true })` und ändert keine Datei aus Task 2.
