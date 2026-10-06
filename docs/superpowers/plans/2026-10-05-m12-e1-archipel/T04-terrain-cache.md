> **Task-ID:** T04 · **AK-IDs:** AK-E1-11, AK-E1-20, AK-E1-21
> **blocked-by:** T02, **REL-03 über `feat/m12-e0`** (R231 prod-B2) · **Strang:** terrain, Branch `feat/m12-e1-terrain`, Worktree
> `.worktrees/m12-e1-terrain` (von `feat/m12-e1` nach T02 + E0-Merge mit REL-03) · `tech-ui-engineer` (sonnet) · **parallel zu T03**
> **Regeln:** [index.md](index.md) Global Constraints, P-8 · Spec Anhang 02 D (Meerkante, Terrain-Cache, Speicher,
> Detailstufe/Viertel-Kopie)

## T04: Terrain je Insel — Meerkante, Cache-Plan in Scheiben, Viertel-Kopie, Speicher

**Ziel:** Jeder Inselcache läuft am Rand auf `waterDeep` aus; Fremdinsel-Caches lassen sich in Schritten ≤ 8 ms
aufbauen (Uhr injiziert, testbar); eine Viertel-Kopie steht für Zoom ≤ 0,25 bereit; der Speicher steht ehrlich in
`limits.ts`.

**Code-Fakten (nach REL-03):** `terrain.ts` `buildTerrainLayer(world, scale)` (Felder → `buildGrid` → `paintRegion` in
`CHUNK`-Bändern à 512 Zeilen → `paintDecor` → `meta`), `halfLayer(layer)` (gecachte halbe Kopie), `paintPixels`
(exportiert), `waterColor(d)` mit statischem Schaum `FOAM_STATIC`; `terrainField.ts` `depthAt`, `terrainFields`;
`water.ts` `drawWaves(ctx, world, range, timeMs, weather, reduce)`; `limits.ts` Obergrenzen; `defaultTerrainScale`
= 2 bei DPR ≥ 1,5. REL-03 hat `terrain.ts` geändert: Zeilennummern selbst nachschlagen.

**Dateien:** `src/render/terrainField.ts`, `terrain.ts`, `water.ts`, `limits.ts`, neu `src/render/cachePlan.ts`;
`tests/render/terrain.test.ts`, `water.test.ts`, neu `tests/render/cachePlan.test.ts`, `tests/render/limits.test.ts`.

## Regeln und Schnittstellen (Produces)

- **Meerkante** (`terrainField.ts`): `rimWeight(fx, fy, w, h) = clamp01((Math.min(fx, fy, w − fx, h − fy) − 2) / 2)`
  (Kacheln). `paintPixels`: Wasserfarbe nach allen Zusätzen `mix3(C.deep, col, rim, col)` → in den äussersten 2 Kacheln
  exakt `PALETTE.waterDeep`, statischer Schaum dort 0. `drawWaves`: Kachel mit `rimWeight(x + 0.5, y + 0.5, w, h) === 0`
  erzeugt keinen Strich, sonst Deckkraft × Gewicht. Gilt für jede Insel, auch die Heimat (Risiko R-4).
- **Viertel-Kopie:** `quarterLayer(layer)` analog `halfLayer`, aus der halben Kopie verkleinert, in `meta` gecacht.
- **Cache-Plan** (`cachePlan.ts`, rein, ohne DOM):

```ts
export const SLICE_MS = 8; // Darstellungswert (Spec M12 R228 (4) F-P3)
export interface CacheJob {
  island: number;
  steps: (() => void)[];
}
export interface CachePlan {
  idle(): number; // ein Leerlauf-Slot; liefert die Dauer der Scheibe
  finish(island: number): number; // Notfall: restliche Schritte sofort
  done(island: number): boolean;
  readonly sliceMs: number[]; // Dauer je Scheibe (Dev-Sonde R5)
  readonly emergencyMs: number[];
}
export function createCachePlan(jobs: readonly CacheJob[], now: () => number): CachePlan;
```

`idle()` arbeitet die Jobs in Reihenfolge ab (A, dann B); erster Schritt läuft immer, weitere nur, solange
`(now() − t0) + teuersterBisherigerSchritt ≤ SLICE_MS`. Bei der Erzeugung läuft nichts.

- **Job je Insel** (`terrain.ts`): `terrainJob(world: World, scale): { layer: HTMLCanvasElement; steps: (() => void)[] }`
  mit Schritten: Felder; Gitter (in Knoten-Zeilenbändern über `computeWindow`, falls das Gitter sich so zusammensetzen
  lässt, sonst ein Schritt); Malbänder zu `SLICE_ROWS = 32` Pixelzeilen über `paintPixels`; `paintDecor`; `meta` setzen;
  `halfLayer`; `quarterLayer`. Ergebnis pixelgleich zu `buildTerrainLayer` (Test). `buildTerrainLayer` für die Heimat
  bleibt unverändert (R2).
- **Speicher** (`limits.ts`):

```ts
/** Ebenen-Faktor bei DPR 2 (`defaultTerrainScale`); nicht senken (lead-art B4). */
export const ARCHIPEL_LAYER_SCALE = 2;
const layerBytes = (tiles: number): number => (tiles * TEX * ARCHIPEL_LAYER_SCALE) ** 2 * 4;
/** Zusatz durch den Archipel: Fremdinsel-Ebenen + halbe + Viertel-Kopien, Viertel-Kopie der Heimat (≈ 44,5 MB). */
export const ARCHIPEL_EXTRA_BYTES =
  ISLANDS.reduce((s, d) => s + layerBytes(d.size) * (1 + 1 / 4 + 1 / 16), 0) +
  layerBytes(MAP_W) / 16;
```

## Schritte

- [ ] **0 Basis:** `git worktree add -b feat/m12-e1-terrain .worktrees/m12-e1-terrain feat/m12-e1` (nach T02 und
      dem Merge `feat/m12-e0` → `feat/m12-e1` mit REL-03, T03 Schritt 0), `make check` grün.
- [ ] **1 Tests zuerst**, `describe('M12 E1 Terrain')`:
  - **AK-E1-20** (`terrain.test.ts`): Inselansicht 24 × 24 (Literal-Welt mit Land in `[4, 19]`), `paintPixels` über die
    ganze Ebene: jedes Pixel mit `fx < 2 ∨ fy < 2 ∨ fx ≥ 22 ∨ fy ≥ 22` = RGB von `PALETTE.waterDeep`; `rimWeight` an
    Kachel 0, 1,9 → 0, an 4 → 1. `water.test.ts`: `drawWaves` gegen `fakeCtx` auf dieser Welt → kein Strich mit
    Kachel im Rand.
  - **AK-E1-11** (`cachePlan.test.ts`, Fake-Uhr, Schritt kostet je 3 ms, A 6 Schritte, B 9): nach `create` 0 Schritte;
    `idle()` → je Scheibe ≤ 8 ms, A vollständig vor dem ersten B-Schritt; `finish(2)` mitten in B → `done(2)`, Dauer
    in `emergencyMs`; Schritt mit 11 ms → Scheibe genau dieser eine Schritt (Fortschritt garantiert).
    `terrain.test.ts`: alle `terrainJob`-Schritte nacheinander → Pixel gleich `buildTerrainLayer` (gleiche Welt, Faktor 1).
  - **AK-E1-21** (`limits.test.ts`): `ARCHIPEL_EXTRA_BYTES / 1e6` ≈ 44,5 (`toBeCloseTo(44.5, 0)`);
    `ARCHIPEL_LAYER_SCALE === 2`; `terrainLayerSize` von A bei Faktor 2 = 1536 Pixel Kante.
  - `quarterLayer`: Kante = `ceil(halfLayer / 2)`, zweiter Aufruf liefert dasselbe Objekt.
- [ ] **2 Rot-Beleg** `npx vitest run tests/render/terrain.test.ts tests/render/water.test.ts tests/render/cachePlan.test.ts
tests/render/limits.test.ts -t "M12 E1"` → Commit `test: M12 E1 Terrain je Insel (rot)`.
- [ ] **3 Umsetzung** nach „Regeln". Bestehende Terrain-Tests: ändert die Meerkante einen gepinnten Heimat-Wert,
      **nicht nachstellen** — Meldung an den Controller (R-4), der lead-tech fragt.
- [ ] **4 Prüfen:** `make check`, `CI=true make check` grün; Commit `feat: M12 E1 Meerkante, Cache-Plan, Viertel-Kopie,
Speicher`. Der Controller merged `feat/m12-e1-terrain` → `feat/m12-e1` (Merge-Commit) nach OK.

**Review-Fokus:** Rand exakt `waterDeep`; Cache-Plan ohne DOM, Uhr injiziert; Heimat-`buildTerrainLayer` unverändert;
Speicherfaktor 2 nicht gesenkt.
