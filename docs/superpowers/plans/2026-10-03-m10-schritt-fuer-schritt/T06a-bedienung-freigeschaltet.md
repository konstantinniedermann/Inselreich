> **Task-ID:** Task 6 (Paket M10-U1) — Teil 1 von 3
> **AK-IDs:** Vitest-Teile von AK-U1-01 … -13 (Browser-Teile in QA-U1), `RF-4`
> **blocked-by:** Task 4
> **Gemeinsame Regeln:** [index.md](index.md) (Global Constraints) · Orga: [orga-06-schnittstellen.md](orga-06-schnittstellen.md) · [orga-07-datei-ownership.md](orga-07-datei-ownership.md)
> **Teile:** **T06a-bedienung-freigeschaltet.md** (diese) · [T06b-bedienung-freigeschaltet.md](T06b-bedienung-freigeschaltet.md) · [T06c-bedienung-freigeschaltet.md](T06c-bedienung-freigeschaltet.md)

## Task 6: U1 — Bedienung zeigt nur Freigeschaltetes, Meldung, Ton, „Alles frei", Kopfzeile, Dev-Sonde

**Paket** M10-U1 · **Implementierer** `tech-ui-engineer` (sonnet) · **Worktree/Branch** `.worktrees/m10-ui` ·
`feat/m10-ui` (ab Task-4-SHA) · **blocked-by** Task 4 · parallel zu Task 5 und R1 · **AK** Vitest-Teile von
AK-U1-01 … -13 (Browser-Teile in QA-U1), `RF-4`

**Files:**

- Modify: `src/ui/buildMenu.ts`, `src/ui/hud.ts`, `src/ui/hotkeys.ts`, `src/ui/menu.ts`, `src/ui/trade.ts`,
  `src/ui/order.ts`, `src/ui/app.ts`, `src/ui/goal.ts`, `src/ui/settings.ts`, `src/ui/soundEvents.ts`,
  `src/ui/inspect.ts` (nur `restView`/`rest-tax`, P4), `src/ui/messages.ts` (Knopf im Toast, P4),
  `src/ui/devProbes.ts` (P6), `src/audio/sound.ts` (+ Zuordnung `'unlock'` → `win`-Datei, kleiner Pegel nach
  `lead-art`; ohne Vorgabe unverändert)
- Test: `tests/ui/{buildMenu bzw. tooltip,hud,hotkeys,trade,order,goal,settings,soundEvents,inspect,devProbes}.test.ts`,
  `tests/audio/` (Zuordnung `'unlock'`); bewusst geändert T-7, T-11

**Interfaces:**

- Consumes: `buildingShown`, `buildLock`, `goodUnlocked`, `functionLock`, `isUnlocked` (`src/sim/unlocks.ts`),
  `townhallActive`, `effectiveTaxLevel` (`src/sim/townhall.ts`), `UNLOCKS`, `FUNCTION_LABELS` (Defs).
- Produces (Task 7 baut darauf auf): `lockedToolText(world, tool)`, `unlockNoticeText(prev, world)`,
  `frameUnlock(seen, world)`, `hotkeyList(world)`, `toolShown(world, tool)`, `buildEntries(world, cat)`,
  `visibleCategories(world)`, `tradeRows(world)`, `orderVisible(world)`, `taxButtonText(world)`,
  `showMessage(text, kind, sticky, closable, action?)`, `exposeDevProbe(…)`, `Settings.unlockMode`,
  `SoundEvent 'unlock'`.
