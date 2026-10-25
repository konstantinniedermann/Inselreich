# T01 Defs `feast.ts` und Blattmodul `feastEffect.ts`

Persona `tech-sim-engineer` · Strang A · Tools ≈ 40 · AK-FE15 (Defs-Teil), AK-FE21 (Blatt-Teil) · blocked-by T00.

**Files:** Create `src/sim/defs/feast.ts`, `src/sim/feastEffect.ts`, `tests/sim/feastKinds.test.ts`. Modify `src/sim/feast.ts`, `src/sim/defs/timing.ts` (`FEAST_RUM` entfernen, Kommentar nachziehen), `src/sim/types.ts` (`Building.feastKind`), `src/ui/feast.ts` (nur Import), `tests/sim/feast.test.ts` (nur Import `FEAST_RUM`).

**Interfaces (Produces, später genutzt):**

```ts
// src/sim/defs/feast.ts
export const FEAST_KIND_IDS = ['ascension', 'harvest', 'market'] as const;
export type FeastKind = (typeof FEAST_KIND_IDS)[number];
export interface FeastKindDef {
  name: string;
  cost: Partial<Record<GoodId, number>>; // Schlüsselreihenfolge = Prüf- und Abbuchreihenfolge, rum zuerst
  scope: 'chapel' | 'island';
  cyclePct?: number;
  sellPct?: number;
}
export const FEAST_KINDS = {
  ascension: { name: 'Aufstiegsfest', cost: { rum: 10 }, scope: 'chapel' },
  harvest: { name: 'Erntefest', cost: { rum: 10, cloth: 15 }, scope: 'island', cyclePct: 75 },
  market: { name: 'Markttag', cost: { rum: 10, glass: 5 }, scope: 'island', sellPct: 125 },
} as const satisfies Record<FeastKind, FeastKindDef>;

// src/sim/types.ts, Building (direkt unter feastAt; `import type { FeastKind } from './defs/feast'`)
/** Art des letzten Fests; nur zusammen mit `feastAt` an der Kapelle; fehlt = Aufstiegsfest (I-201). */
feastKind?: FeastKind;

// src/sim/feastEffect.ts — Imports nur ./council, ./defs/*, ./types, ./world
export type FeastState = { phase: 'ready' | 'active' | 'cooldown'; remaining: number };
export function feastState(world: World, chapel: Building): FeastState;          // aus feast.ts verschoben
export function chapelWorks(chapel: Building): boolean;                          // verschoben, jetzt exportiert
export function inChapelRadius(world: World, chapel: Building, target: Building): boolean; // Parameter house → target
export function isFeastKind(k: unknown): k is FeastKind;                         // FEAST_KIND_IDS.includes
export function feastKindOf(chapel: Building): FeastKind;                        // chapel.feastKind ?? 'ascension'
export function feastActive(world: World, house: Building): boolean;             // nur feastKindOf(c) === 'ascension'
export function harvestActive(world: World, b: Building): boolean;
export function harvestCycle(cycle: number): number; // max(1, ⌊cycle × FEAST_KINDS.harvest.cyclePct / 100⌋)
export function marketActive(world: World, island: number): boolean;
```

- `harvestActive`: eine Kapelle `c` mit `c.feastKind === 'harvest'` (zuerst prüfen, P-7), `c.island === b.island`, `c.feastAt !== undefined`, `chapelWorks(c)`, `feastState(world, c).phase === 'active'`, `inChapelRadius(world, c, b)`. `Object.values(world.buildings).some(…)` wie `feastActive`; kein Cache.
- `marketActive`: dasselbe mit `'market'` und `c.island === island`, ohne Radius.
- `feast.ts`: alte Definitionen löschen und `export { feastActive, feastKindOf, feastState, harvestActive, marketActive, type FeastState } from './feastEffect';` plus Importe von `chapelWorks`, `inChapelRadius`, `feastState` für die Sperren. `spendRum`/`rumShortage` lesen den Rum vorerst aus `FEAST_KINDS.ascension.cost.rum` (T02 ersetzt beide); Verhalten unverändert.
- `src/ui/feast.ts`: `FEAST_RUM` → `FEAST_KINDS.ascension.cost.rum` (Beschriftung bleibt «Fest feiern (10 Rum)» bis T06). `tests/sim/feast.test.ts:7`: dieselbe Umstellung (lokale `const FEAST_RUM = FEAST_KINDS.ascension.cost.rum`).

## Schritte

- [ ] **Test zuerst** in `tests/sim/feastKinds.test.ts`, `describe('AK-FE15 Werte nur aus Defs')`:
  - `FEAST_KIND_IDS` gleich `['ascension', 'harvest', 'market']`.
  - `FEAST_KINDS` gleich der Tabelle: Namen «Aufstiegsfest», «Erntefest», «Markttag»; `cost` `{ rum: 10 }`, `{ rum: 10, cloth: 15 }`, `{ rum: 10, glass: 5 }` und `Object.keys(cost)[0] === 'rum'` je Art; `scope` `chapel`/`island`/`island`; `harvest.cyclePct` 75; `market.sellPct` 125.
  - `rg`-Ersatz im Test: `src/sim/defs/timing.ts` exportiert kein `FEAST_RUM` (Quelltext ohne Kommentare enthält `FEAST_RUM` nicht).
- [ ] **Test zuerst**, `describe('AK-FE21 Importstruktur (Blatt)')`: Hilfsfunktion `importsOf(path): string[]` (alle `from '…'`-Ziele der Datei). `src/sim/feastEffect.ts` importiert keines von `./economy`, `./levels`, `./trade`, `./feast`, `./townhall`, und nur Ziele aus `./council`, `./types`, `./world`, `./defs/…`. **Transitiv (Gate Plan P11-b):** Helfer `importClosure(path): Set<string>` (rekursiv über `from './…'`/`'../…'`-Ziele unter `src/sim/`, Endung `.ts` ergänzen, besuchte Dateien merken; `import type` zählt mit) — die Hülle von `src/sim/feastEffect.ts` enthält keine der Dateien `feast.ts`, `economy.ts`, `levels.ts`, `trade.ts`, `townhall.ts`, `population.ts`. (Der Teil `levels`/`trade` folgt in T03; T02 nutzt den Helfer für `islands.ts`.)
- [ ] **Test zuerst**, `describe('feastEffect Abfragen')`: `isFeastKind('harvest')` wahr, `isFeastKind('harbor')`, `isFeastKind(5)`, `isFeastKind(undefined)` falsch; `feastKindOf` ohne Feld → `'ascension'`; `harvestCycle(20) === 15`, `harvestCycle(1) === 1`, `harvestCycle(50) === 37`, `harvestCycle(32) === 24`.
- [ ] **Rot-Lauf:** `npx vitest run tests/sim/feastKinds.test.ts; echo EXIT=$?` → Exit ≠ 0 (Module fehlen).
- [ ] **Umsetzen** wie oben.
- [ ] **Grün:** `npx vitest run tests/sim/feastKinds.test.ts tests/sim/feast.test.ts tests/sim/council.test.ts tests/sim/edicts.test.ts tests/ui/feast.test.ts; echo EXIT=$?` → 0. Die bestehenden AK-I007-xx sind die Charakterisierung des Umbaus (grün vorher und nachher).
- [ ] **Teilbeleg:** `npx tsc --noEmit`, `make lint`, `make zeittests`, `make conflicts`, je `; echo EXIT=$?`.
- [ ] **Commit:** `git add src/sim/defs/feast.ts src/sim/feastEffect.ts src/sim/feast.ts src/sim/defs/timing.ts src/sim/types.ts src/ui/feast.ts tests/sim/feastKinds.test.ts tests/sim/feast.test.ts` · `feat: Festarten-Defs und Blattmodul feastEffect (I-201 T01)`.
