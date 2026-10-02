> **Task-ID:** Task 7 (Paket M10-U2) — Teil 1 von 3
> **AK-IDs:** Vitest-Teile AK-U2-01, -02, -07, -10, -11, -12 (Browser-Teile in QA-U2), `RF-5`
> **blocked-by:** QA-U1 (OK), R1 (Review OK, gemergt), **M9 H-R3 und H-R4 auf `main`** (R159)
> **Gemeinsame Regeln:** [index.md](index.md) (Global Constraints) · Orga: [orga-06-schnittstellen.md](orga-06-schnittstellen.md) · [orga-07-datei-ownership.md](orga-07-datei-ownership.md) · [orga-08-abhaengigkeiten-extern.md](orga-08-abhaengigkeiten-extern.md)
> **Teile:** **T07a-hilfe-forst-amtsstube.md** (diese) · [T07b-hilfe-forst-amtsstube.md](T07b-hilfe-forst-amtsstube.md) · [T07c-hilfe-forst-amtsstube.md](T07c-hilfe-forst-amtsstube.md)

## Task 7: U2 — Hilfe-Karte, `nextStep`, Forst-Bedienung, Amtsstuben-Panel, Tooltips, Gründe, K4, K5

**Paket** M10-U2 · **Implementierer** `tech-ui-engineer` (sonnet) · **Worktree/Branch** `.worktrees/m10-ui` ·
`feat/m10-ui` · **blocked-by** QA-U1 (OK), R1 (Review OK, gemergt), **M9 H-R3 und H-R4 auf `main`** (R159) ·
**Vorher (Controller):** `git -C .worktrees/m10-ui merge --no-edit main` (enthält H-R3/H-R4) und
`git -C .worktrees/m10-ui merge --no-edit <R1-SHA>`, je `make check`, push. **Konflikte in diesem W5-Merge löst
Controller 2** (R164 B3) im eigenen Baum per Merge-Commit (nie Rebase), danach `make check`; meldet `tsc` nach dem
Merge von H-R3 einen unvollständigen `switch` über `BuildingState` in `src/render/statusMarks.ts`, ergänzt Controller 2
dort den Fall `noService` (Kartenzeichen wie `waitingInput`) als Ausnahme wie Task 4 bei `overlays.ts` (R164 B4) ·
**AK** Vitest-Teile AK-U2-01, -02, -07, -10, -11, -12 (Browser-Teile in QA-U2), `RF-5`

**Files:**

- Modify: `src/ui/startCard.ts`, `src/ui/guide.ts`, `src/ui/inspect.ts`, `src/ui/hints.ts`, `src/ui/texts.ts`,
  `src/ui/input.ts`, `src/ui/hotkeys.ts`, `src/ui/buildMenu.ts`, `src/ui/menu.ts`, `src/ui/app.ts`,
  `src/ui/crisisLog.ts`, `src/ui/eventLogView.ts`, `src/ui/goal.ts` (nur `lockedToolText` für Forst-Werkzeuge),
  `src/render/renderer.ts` (nur `Tool` und Forst-Vorschau)
- Test: `tests/ui/{startCard,guide,inspect,hints,hotkeys,tooltip,goal,crisisLog}.test.ts`; bewusst geändert T-8
  (`TOOL_HOTKEYS` 20), M7:AK-UX-08/-10 (Kassen-Satz mit Amtsstube, Testwelten mit `placeTownhall`)

**Interfaces:**

- Consumes: Task 6 (alle Produces), `canClearForest`/`canPlantForest`/`clearForest`/`plantForest`, `nextUnlocks`,
  `effectiveTaxLevel`, `townhallActive`, `setTaxLevel`/`setGoodLock`/`setUpgradeStop`, `CRISIS_FIRST_TICK`.
- Produces: `Tool` + `{ kind: 'clearForest' } | { kind: 'plantForest' }`, `toolName` „Roden"/„Aufforsten",
  `HotkeyAction` + `{ kind: 'help' }`, `helpSections(world)`, `mapSigns(world)`, `crisisLogVisible(world)`,
  `lockMatrix(world)`, Hilfe-Karte (`openStartCard(…, { mode: 'help' })` umgebaut).
