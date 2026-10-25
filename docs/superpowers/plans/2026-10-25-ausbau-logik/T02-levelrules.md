# T02 AL-2a Blattmodule und `runningLevel` (reine Abfrage, ohne Wirkung)

Persona `tech-sim-engineer` · Strang A · Tools ≈ 70 · AK-AL-03, 06, 07, 08, 09 (je ohne Teil 4), 46 (Radius-Teil und Strukturtest), 47, Review Focus 2 und 3 · blocked-by T01. **Wald/Gras-Teil** von AK-08 mit den Spec-Werten umsetzen (E-P1 durch R935 entschieden; FL-2 ersetzt die Stufenbedingung der fünf Flächentypen später per Ruling).

Spec: Begriffe, R3, R4, R5 (erste vier Punkte), Anhang 02 N2/N5, AK-AL-03/06–09/46/47.

**Files:** Create `src/sim/terrainCount.ts`, `src/sim/fireCover.ts`, `src/sim/levelRules.ts`, `tests/sim/levelDefsMock.test.ts`. Modify `src/sim/placement.ts` (importiert die Zählfunktionen), `src/sim/crises.ts` (re-exportiert `isProtected`, Aufrufer unverändert), `src/sim/defs/levels.ts` (`WORKFORCE_RADIUS = 8`, `LEVEL_RECHECK_TICKS = 10` mit Doku-Kommentar «vertragliche Obergrenze, Umsetzung liest bei jedem Zugriff (Plan P-4)»), `tests/sim/levelRules.test.ts`, `tests/sim/imports.test.ts`.

**Interfaces (Produces):**

```ts
// terrainCount.ts (Blatt: ./world, ./types) — Code unverändert aus placement.ts verschoben
export const countTerrain: (isl: Island, tiles: Pos[], terrain: Terrain) => number;
export function countFreeTerrain(isl: Island, tiles: Pos[], terrain: Terrain, own: Pos[]): number;
// fireCover.ts (Blatt: ./council, ./defs/buildings, ./world, ./types) — Code unverändert aus crises.ts
export function isProtected(world: World, b: Building): boolean;
// levelRules.ts (Blatt; erlaubte Importe: ./defs/*, ./types, ./world, ./coverage, ./council, ./terrainCount, ./fireCover)
export interface WorkforceInfo {
  ok: boolean;
  tier: Tier;
  nearest: number | null;
  otherIsland: boolean;
} // nearest = ceil(distance) des nächsten passenden Hauses derselben Insel
export function workforceAt(world: World, b: Building, level: number): WorkforceInfo;
export interface SiteInfo {
  ok: boolean;
  kind: LevelSite['kind'];
  have: number;
  need: number;
} // fireStation: have 0/1, need 1; Krisen aus: ok true, need 0
export function siteAt(world: World, b: Building, level: number): SiteInfo | null; // null = Stufe ohne site
export function runningLevel(world: World, b: Building): number; // g = b.level ?? 1; g = 1 → 1 ohne Suche
```

Regeln: Haus = Gebäude mit `house` (Bevölkerungsstufe `b.house.tier`), **jeder** Zustand zählt, auch brennend (R3); Kontor, Markt und Dienste zählen nie. Abstand `distance()` aus `coverage.ts`, Vergleich `≤ WORKFORCE_RADIUS` ohne eigene Toleranz (AK-47). Fischer: andere `fisher` derselben Insel, jede Stufe, auch stillgelegt/brennend, `distance ≤ radius`, Zahl `≤ maxOthers`. Wald/Gras: `countFreeTerrain(isl, tilesInRadius(isl, cx, cy, r), terrain, footprint)` (wie `siteRuleOk`). Gebirge: `countTerrain` (nicht frei). Feuerwache: `world.crisisLevel === 'off'` → ok; sonst `isProtected(world, b)` (eine Funktion mit dem Brandschutz, R4). `runningLevel` = grösstes j ≤ g, für das Fachkräfte(j) und Standort(j) halten (Monotonie, R4).

## Schritte

- [ ] **Charakterisierung zuerst:** `npx vitest related --run src/sim/placement.ts src/sim/crises.ts; echo EXIT=$?` → 0 (vor dem Verschieben).
- [ ] **Verschieben** (`refactor:`-Commit, eigener Commit vor den neuen Tests): `countTerrain`/`countFreeTerrain` → `terrainCount.ts`, `isProtected` → `fireCover.ts`; `crises.ts` `export { isProtected } from './fireCover'`. Gleicher Lauf → 0. Commit `refactor: Zählfunktionen und Brandschutz als Blattmodule (AUSBAU-LOGIK T02)`.
- [ ] **Tests zuerst** in `levelRules.test.ts` (Welt nach Spec «Abnahmekriterien», Häuser per `putBuilding` aus `tests/sim/helpers.ts` mit gesetztem `house.tier`; Helfer für diese Welten in der Testdatei selbst, `helpers.ts` nicht vergrössern):
  - **AK-AL-03 Monotonie** über alle `LEVELS`-Einträge (läuft in T11 mit Stufe 4 erneut): gleiche `site.kind` wie Vorstufe oder Vorstufe ohne `site`; `min` ≥, `maxOthers` ≤, `radius` ≥; `workforceTier === Stufe`.
  - **AK-AL-06** (alle Fälle der Spec) und **AK-AL-47** (vier Versätze, angezeigte Zahl = `nearest`).
  - **AK-AL-07**, **AK-AL-08**, **AK-AL-09** ohne Teil 4 (Fälle mit g = 4 stehen in T11): Fischer g 2/g 3, Holzfäller g 3, Steinbruch gerade Kante g 3, Schäferei g 2, zwei Holzfäller teilen Wald; Brennerei g 3 `'normal'` ohne/mit/abgerissene Wache, `'off'`.
  - **Review Focus 2:** Wache nicht angebunden (`connected` false) → Brennerei g 3 k 2. **Review Focus 3:** Hütte auf Insel 1 mit gleichen Koordinaten zählt nicht; stillgelegte und brennende Nachbarhütte zählen.
  - **Determinismus der Abfrage:** `runningLevel` zweimal hintereinander gleich; `JSON.stringify(world)` vor und nach Aufruf gleich (reine Abfrage).
  - **AK-AL-46 (Radius)** in `levelDefsMock.test.ts`: `vi.mock('../../src/sim/defs/levels', async (orig) => ({ ...(await orig()), WORKFORCE_RADIUS: 7 }))`; Siedlerhaus im Abstand 8 → Fischer g 2 hat k 1 (mit echtem Wert k 2 in `levelRules.test.ts`).
  - **AK-AL-46 (Struktur)** in `levelRules.test.ts`: Quelltext von `src/sim/levelRules.ts` ohne Kommentare; jedes Zahlenliteral ∈ {0, 1, 2, 100}.
  - **Importe** in `tests/sim/imports.test.ts`: `levelRules.ts`, `terrainCount.ts`, `fireCover.ts` importieren nur die oben erlaubten Module (Muster der vorhandenen Tests).
- [ ] **Rot-Lauf:** `npx vitest run tests/sim/levelRules.test.ts tests/sim/levelDefsMock.test.ts tests/sim/imports.test.ts; echo EXIT=$?` → Exit ≠ 0.
- [ ] **Umsetzen** `levelRules.ts` (kein Cache, kein Feld an `world` oder `Building`).
- [ ] **Grün:** gleicher Lauf → 0; `npx vitest related --run src/sim/placement.ts src/sim/crises.ts src/sim/levelRules.ts; echo EXIT=$?` → 0.
- [ ] **Keine Wirkung:** `npx vitest run tests/sim/balance.test.ts tests/sim/balance-upgrade.test.ts; echo EXIT=$?` → 0 (k wird noch nirgends gelesen).
- [ ] **Teilbeleg:** `npx tsc --noEmit`, `make lint`, `make zeittests`, `make conflicts`, je `; echo EXIT=$?`.
- [ ] **Commit:** `feat: laufende Stufe als reine Abfrage (AUSBAU-LOGIK T02)`.
