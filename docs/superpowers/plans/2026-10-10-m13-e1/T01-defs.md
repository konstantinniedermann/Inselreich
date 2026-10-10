# T01 · Defs und Typen der Edikte (TDD)

Strang sim · Worktree `.worktrees/m13-e1-sim` · Branch `feat/m13-e1-sim` · Umsetzer `tech-sim-engineer` (sonnet) · AK-M13E1-02 (Spec §4, §10.1) · blocked-by Gate Plan · Grösse S (≈ 12 Tools)

**Files:**

- Create: `src/sim/defs/edicts.ts`
- Modify: `src/sim/types.ts` (nur `EdictId`, `EdictDef`; **keine** Weltfelder, die kommen in T02), `src/sim/defs/timing.ts` (`EDICT_LOCK`), `src/sim/defs/buildings.ts` (`PAUSED_UPKEEP_PCT`), `tests/sim/defs.test.ts` (neuer `describe`)
- Lesen: Spec §4 (Tabellen), `src/sim/defs/tiers.ts` (`TAX_LEVELS`), `src/sim/defs/timing.ts` (`GROWTH_INTERVAL`)

## Schnittstelle

```ts
// src/sim/types.ts
export type EdictId = 'saving' | 'trade' | 'welfare';
export interface EdictDef {
  id: EdictId;
  name: string; // 'Sparen' | 'Handel' | 'Wohlfahrt'
  upkeepPct: number; // 100 = keine Wirkung
  taxPoints: number; // Prozentpunkte Abzug, 0 = keine Wirkung
  buyPct: number; // 100 = keine Wirkung
  growthInterval: number | null; // null = GROWTH_INTERVAL
  upgradeWait: number | null; // null = keine Wirkung
}

// src/sim/defs/edicts.ts
export const EDICTS: Readonly<Record<EdictId, EdictDef>>; // Werte Spec §4, Tabelle 1
export const EDICT_IDS: readonly EdictId[]; // ['saving', 'trade', 'welfare'] (Kartenfolge)
export const EDICT_COST = 600;
export const EDICT_UNLOCK = 'won' as const; // Weltflagge, gelesen als world[EDICT_UNLOCK] === true

// src/sim/defs/timing.ts
export const EDICT_LOCK = 3000; // 5 min Sperre nach Erlass, Wechsel oder Aufheben

// src/sim/defs/buildings.ts
export const PAUSED_UPKEEP_PCT = 50; // stillgelegter Betrieb (I-035, Spec §8 S4)
```

Werte (Spec §4): `saving` 80 / 7 / 100 / `null` / `null`; `trade` 100 / 0 / 80 / `null` / `null`; `welfare` 100 / 5 / 100 / 40 / 200 (Reihenfolge `upkeepPct`, `taxPoints`, `buyPct`, `growthInterval`, `upgradeWait`). Kopfkommentar in `defs/edicts.ts`: Spielwerte, Änderung nur per Ruling (Spec §12 P-5), Balancing-Test muss grün bleiben.

## Schritte

- [ ] **Schritt 1: Test zuerst (rot).** In `tests/sim/defs.test.ts` neuer Block `describe('M13-E1 Edikte (AK-M13E1-02)')`:
  1. `EDICT_COST === 600`, `EDICT_LOCK === 3000`, `EDICT_UNLOCK === 'won'`.
  2. Tabelle §4 exakt: `expect(EDICTS).toEqual({ saving: {…}, trade: {…}, welfare: {…} })` mit `id` und `name`.
  3. `EDICT_IDS` gleich `Object.keys(EDICTS)` in genau dieser Reihenfolge.
  4. Je Edikt: `upkeepPct`, `buyPct` ganzzahlig in 1 … 100; `taxPoints` ganzzahlig ≥ 0 und kleiner als der kleinste Satz aus `TAX_LEVELS` (über `pct` **und** alle `pctByTier`-Werte, heute 70); `growthInterval` `null` oder ganzzahlig mit `0 < x < GROWTH_INTERVAL`; `upgradeWait` `null` oder `≥ TAX_LEVELS.low.upgradeWait`.
  5. `PAUSED_UPKEEP_PCT` ganzzahlig in 1 … 99.

```bash
npx vitest run tests/sim/defs.test.ts; echo EXIT=$?   # rot: Modul defs/edicts fehlt
```

- [ ] **Schritt 2: Umsetzen.** Typen, Defs, zwei Konstanten. Keine Verwendung im übrigen Code (Wirkung kommt in T03–T07); kein Weltfeld, kein `SAVE_VERSION`.

```bash
npx vitest run tests/sim/defs.test.ts tests/sim/imports.test.ts; echo EXIT=$?
npx tsc --noEmit; echo EXIT=$?
make lint; echo EXIT=$?
```

- [ ] **Schritt 3: Commit.** `feat: Defs und Typen der Edikte (M13-E1 T01)`; Trailer der Session.

## Bericht

Testname je Prüfpunkt, eine Zeile Rot-Ausgabe, Exit-Codes, `git diff --stat main...HEAD`. Bestätigen: `git diff main -- 'tests/sim/balance*' tests/sim/e0Pins.ts tests/sim/e1Pins.ts` leer.
