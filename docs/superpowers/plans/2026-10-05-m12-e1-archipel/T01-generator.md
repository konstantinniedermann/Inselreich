> **Task-ID:** T01 · **AK-IDs:** AK-E1-01 (Geländeteil), AK-E1-02, AK-E1-04; Auflage B6 (`Math.sqrt`)
> **blocked-by:** T00, **D-139** (Definition `d`) · **Strang:** sim, `.worktrees/m12-e1` · `tech-sim-engineer` (sonnet)
> **Regeln:** [index.md](index.md) Global Constraints, P-1 … P-5 · Spec Anhang 02 A, B

## T01: Fremdinsel-Generator, Lage im Meer, Fahrlinien (rein, ohne Weltzustand)

**Ziel:** Reine Funktionen erzeugen aus einem Seed die Inseln A und B samt Lage, Anker und Fahrlinien. Noch keine
Änderung an `World`, `createWorld` oder Save (T02).

**Code-Fakten:** `mapgen.ts` `generateTerrain`, `findKontorSite`, `seaMask`, `isLand` (bleibt **unverändert**);
`createRng`; Salze: Auftrag `0x9e3779b1` (`orders.ts`), `CRISIS_SALT 0x85ebca6b`; `checkGround`: alle Kacheln `isLand`.

**Dateien:** neu `src/sim/defs/sea.ts`, `src/sim/islands.ts`, `tests/sim/islands-gen.test.ts`.

## Werte `src/sim/defs/sea.ts` (verbindlich)

```ts
export type IslandKind = 'A' | 'B';
export type IslandTrait = 'spice' | 'mountain';
export interface IslandDef {
  kind: IslandKind;
  name: string;
  dMin: number;
  dMax: number;
  size: number;
  traits: readonly IslandTrait[];
  plantations: number;
  quarries: number;
}
export const HOME_NAME = 'Heimat';
export const ISLANDS: readonly IslandDef[] = [
  {
    kind: 'A',
    name: 'Möweninsel',
    dMin: 25,
    dMax: 30,
    size: 24,
    traits: ['spice'],
    plantations: 2,
    quarries: 0,
  },
  {
    kind: 'B',
    name: 'Felsbucht',
    dMin: 35,
    dMax: 40,
    size: 36,
    traits: ['spice', 'mountain'],
    plantations: 3,
    quarries: 1,
  },
];
export const TRAIT_LABELS: Record<IslandTrait, string> = { spice: 'Gewürz', mountain: 'Gebirge' };
export const ISLANDS_SALT = 0x27d4eb2f; // eigener Strom, ≠ Auftrag 0x9e3779b1, ≠ CRISIS_SALT
export const ISLAND_TRIES = 50;
export const ISLAND_GAP_MIN = 8;
export const ARCHIPEL_SPAN_MAX = 300;
export const ISLAND_RIM = 4; // Land nur in [RIM, size − RIM − 1] (P-2)
export const SHIP_TICKS_PER_SEA_TILE = 10;
/** Geländeteil der Gewürzplantage (E3 `spicefarm.site` muss diese Regel enthalten). */
export const PLANTATION_SITE = {
  w: 2,
  h: 2,
  site: [{ kind: 'radius', terrain: 'grass', radius: 2, min: 4, free: true }],
} as const;
```

## Schnittstellen `src/sim/islands.ts`

- **Produces:** `type Pt = { x: number; y: number }`;
  `interface IslandShape { kind; width; height; terrain: Terrain[]; kontorSite: Pt; plantationSites: Pt[]; quarrySites: Pt[]; anchor: Pt }`;
  `interface PlacedIsland extends IslandShape { ox: number; oy: number }`;
  `generateForeignIslands(seed: number, home: LaneIsland, opts?: { failShapes?: boolean }): PlacedIsland[]` (A, B);
  `homeAnchor(terrain: Terrain[], w: number, h: number, kontor: Pt): Pt`;
  `interface LaneIsland { ox; oy; width; height; anchor: Pt }`; `interface Lane { a: number; b: number; points: Pt[]; d: number }`;
  `seaLanes(islands: readonly LaneIsland[]): Lane[]` (alle Paare `a < b`, `points` = Anker → Anker in Archipel-
  Kachelmitte `ox + ax + 0.5`); `travelTicks(d) = SHIP_TICKS_PER_SEA_TILE * d`.
- **Consumes:** `generateTerrain`, `findKontorSite`, `seaMask`, `isLand` aus `mapgen.ts`; `createRng`.

## Regeln (verbindlich)

- **Strom (P-4):** `const rng = createRng((seed ^ ISLANDS_SALT) >>> 0)`, einmal; je Insel A, dann B: Form-Versuche
  `noiseSeed = Math.floor(rng() * 2 ** 31)` → `generateTerrain(noiseSeed, size, size)`, Rand `< ISLAND_RIM` → Wasser,
  bei A Gebirge → `grass`. Gültig, wenn Kontorplatz (`findKontorSite`), `plantations` Plantagen- und `quarries`
  Steinbruchplätze (Fussabdruck 2 × 2 bzw. `BUILDING_DEFS.quarry`, alle `isLand`, nicht überlappend, Regeln
  `PLANTATION_SITE` bzw. `quarry.site`, gierig zeilenweise) und ein Anker existieren. Nach `ISLAND_TRIES` → **Ersatzform**:
  Land-Rechteck `[RIM, size − RIM)` Wiese, bei B ein 4 × 4-Gebirgsblock in der Land-Ecke oben links; Plätze gleich gesucht.
- **Anker:** Wasserkachel mit `seaMask`, 4er-angrenzend an Land, kleinster Abstand Mitte zu Mitte zum Kontorplatz
  (2 × 2, Mitte `x + 1, y + 1`), Gleichstand kleinstes `y`, dann `x`. `homeAnchor` gleich mit dem Heimatkontor.
- **Lage:** je Versuch `θ = rng() · 2π`, `t = dMin + rng() · (dMax − dMin + 1)`; Richtung `u`; `s0 = exitDist`
  (Heimatanker in `u` aus dem Heimatrechteck), `e = exitDist` (Inselanker in `−u` aus dem Inselrechteck);
  Zielanker `Q = H + u · (s0 + t + e)`; `ox = Math.round(Q.x − ax − 0.5)`, `oy` analog. Gültig, wenn `d(0, i)` im Band,
  Abstand der Rechtecke zu allen gelegten ≥ `ISLAND_GAP_MIN` (Chebyshev-Lücke), keine Linie schneidet ein fremdes
  Rechteck, Rahmen `W + H ≤ ARCHIPEL_SPAN_MAX`. Nach `ISLAND_TRIES` → **Ersatzlage**: erste gültige aus 16 Richtungen
  `k · π/8` × `t = dMin … dMax`.
- **`d` (P-1):** `Math.ceil(L − exitA − exitB)`, `L = Math.sqrt(dx * dx + dy * dy)` (nie `Math.hypot`, B6).
- **Testnaht:** `opts.failShapes` lässt jeden Formversuch scheitern (AK-E1-04); sonst kein Einfluss.

```ts
/** Strecke von p (im Rechteck [x0,x1]×[y0,y1]) in Richtung u bis zum Rand. */
export function exitDist(p: Pt, u: Pt, x0: number, y0: number, x1: number, y1: number): number {
  const tx = u.x > 0 ? (x1 - p.x) / u.x : u.x < 0 ? (x0 - p.x) / u.x : Infinity;
  const ty = u.y > 0 ? (y1 - p.y) / u.y : u.y < 0 ? (y0 - p.y) / u.y : Infinity;
  return Math.min(tx, ty);
}
```

## Schritte

- [ ] **1 Tests zuerst** `tests/sim/islands-gen.test.ts`, `describe('M12 E1 Generator')`; Heimat je Seed aus
      `generateMap(seed)` (`seedUsed`) + `homeAnchor`:
  - **AK-E1-01 (Gelände)** Seeds 1…200: zwei Inseln `kind` A, B; `width = height = size`; Land nur innerhalb Rand;
    A ohne `mountain`; Plätze vorhanden, je Fussabdruck Land, paarweise überlappungsfrei, Regeln erfüllt (Prüfung im
    Test selbst nachgerechnet); Anker = Wasser, 4er an Land, `seaMask` true.
  - **AK-E1-02** Seeds 1…200: Rechtecke disjunkt, Lücke ≥ 8; `seaLanes` → `d(0, i)` in `[dMin, dMax]`; je Linie kein
    Schnitt mit einem Rechteck ausser ihren beiden; Rahmen `W + H ≤ 300`.
  - **AK-E1-04** `failShapes: true` (Seeds 1…20): Ersatzform, alle Garantien erfüllt, Ergebnis zweimal gleich.
  - **Determinismus:** zweimal `generateForeignIslands(7, …)` tief gleich.
  - **B6:** `readFileSync('src/sim/islands.ts')` enthält kein `Math.hypot`.
- [ ] **2 Rot-Beleg** `npx vitest run tests/sim/islands-gen.test.ts` → Commit `test: M12 E1 Inselgenerator (rot)`.
- [ ] **3 Umsetzung** `sea.ts`, `islands.ts` nach „Regeln". Laufzeit melden: Mittel `generateForeignIslands` über Seeds
      1…50 (Commit-Text).
- [ ] **4 Prüfen:** `make check`, `CI=true make check` grün; `git diff -- src/sim/mapgen.ts src/sim/rng.ts` leer.
      Commit `feat: M12 E1 Fremdinsel-Generator und Fahrlinien`.

**Halt-Regel:** Scheitert AK-E1-02 für einen Seed auch mit Ersatzlage → anhalten, Seed und Werte an den Controller
(Band oder Abstand ist Spielwert, lead-design via L0).

**Review-Fokus:** nur der Inselstrom zieht; `Math.sqrt`; keine Spielwerte ausserhalb `sea.ts`; Ersatzform erfüllt
Garantien; `d` nach P-1.
