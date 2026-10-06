> **Task-ID:** T01 · **AK-IDs:** AK-E1-01 (Geländeteil), AK-E1-02, AK-E1-04; Auflage B6 (`Math.sqrt`)
> **blocked-by:** T00 (D-139 entschieden, R231) · **Strang:** sim, `.worktrees/m12-e1` · `tech-sim-engineer` (sonnet)
> **Regeln:** [index.md](index.md) Global Constraints, P-1 … P-5 · Spec Anhang 02 A, B

## T01: Fremdinsel-Generator, Lage, Fahrlinien

**Ziel:** Reine Funktionen erzeugen aus einem Seed A und B mit Lage, Anker, Fahrlinien; `World`/Save erst T02.

**Code-Fakten:** `mapgen.ts` (`generateTerrain`, `findKontorSite`, `seaMask`, `isLand`) bleibt unverändert.

**Dateien:** neu `src/sim/defs/sea.ts`, `src/sim/islands.ts`, `tests/sim/islands-gen.test.ts`.

## Werte `src/sim/defs/sea.ts` (verbindlich)

```ts
export type IslandKind = 'A' | 'B';
export type IslandTrait = 'spice' | 'mountain';
// IslandDef { kind, name, dMin, dMax, size, traits: readonly IslandTrait[], plantations, quarries } — Spalten unten
export const HOME_NAME = 'Heimat';
export const ISLANDS: readonly IslandDef[] = [/* A, B nach Tabelle unten */];
export const TRAIT_LABELS: Record<IslandTrait, string> = { spice: 'Gewürz', mountain: 'Gebirge' };
export const ISLANDS_SALT = 0x27d4eb2f; // eigener Strom, ≠ Auftrag 0x9e3779b1, ≠ CRISIS_SALT
export const ISLAND_TRIES = 50;
export const ISLAND_GAP_MIN = 8;
export const ARCHIPEL_SPAN_MAX = 300;
export const ISLAND_RIM = 4; // Land nur in [RIM, size − RIM − 1] (P-2)
export const SHIP_TICKS_PER_SEA_TILE = 10;
// Geländeteil der Gewürzplantage (E3 `spicefarm.site` enthält ihn)
export const PLANTATION_SITE = {
  w: 2,
  h: 2,
  site: [{ kind: 'radius', terrain: 'grass', radius: 2, min: 4, free: true }],
} as const;
```

| `kind` | `name`     | `dMin`–`dMax` | `size` | `traits`                | `plantations` | `quarries` |
| ------ | ---------- | ------------- | ------ | ----------------------- | ------------- | ---------- |
| `'A'`  | Möweninsel | 25–30         | 24     | `['spice']`             | 2             | 0          |
| `'B'`  | Felsbucht  | 35–40         | 36     | `['spice', 'mountain']` | 3             | 1          |

## Schnittstellen `src/sim/islands.ts`

- **Produces:** `type Pt = { x: number; y: number }`;
  `interface IslandShape { kind; width; height; terrain: Terrain[]; kontorSite: Pt; plantationSites: Pt[]; quarrySites: Pt[]; anchor: Pt }`;
  `interface PlacedIsland extends IslandShape { ox: number; oy: number }`;
  `generateForeignIslands(seed: number, home: LaneIsland, opts?: { failShapes?: boolean }): PlacedIsland[]` (A, B);
  `homeAnchor(terrain: Terrain[], w: number, h: number, kontor: Pt): Pt`;
  `interface LaneIsland { ox; oy; width; height; anchor: Pt }`; `interface Lane { a: number; b: number; points: Pt[]; d: number }`;
  `seaLanes(islands: readonly LaneIsland[]): Lane[]` (alle Paare `a < b`, `points` = Anker → Anker in Archipel-
  Kachelmitte `ox + ax + 0.5`); `travelTicks(d) = SHIP_TICKS_PER_SEA_TILE * d`.

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
- **`d` (P-1, D-139):** `Math.ceil(seaLength(points, rects))` = Länge der Polylinie **ausserhalb aller Inselrechtecke**
  (je Segment Länge minus die mit `clipInside` geschnittenen Teilstücke; Rechtecke disjunkt). Längen mit `Math.sqrt`,
  nie `Math.hypot` (B6). Bei gültiger Lage gilt `seaLength = L − exitA − exitB` (Test vergleicht beide).
- **Testnaht:** `opts.failShapes` lässt jeden Formversuch scheitern (AK-E1-04); sonst kein Einfluss.

`exitDist(p, u, rect)`: kleinster Strahlparameter `t ≥ 0` von `p` in Richtung `u` bis zu einer Rechteckkante.
`clipInside(a, b, rect)`: Anteil `t ∈ [0, 1]` des Segments im Rechteck (Liang-Barsky).

## Schritte

- [ ] **1 Tests zuerst** `tests/sim/islands-gen.test.ts`, `describe('M12 E1 Generator')`; Heimat je Seed aus
      `generateMap(seed)` (`seedUsed`) + `homeAnchor`:
  - **AK-E1-01 (Gelände)** Seeds 1…200: zwei Inseln `kind` A, B; `width = height = size`; Land nur innerhalb Rand;
    A ohne `mountain`; Plätze vorhanden, je Fussabdruck Land, paarweise überlappungsfrei, Regeln erfüllt (Prüfung im
    Test selbst nachgerechnet); Anker = Wasser, 4er an Land, `seaMask` true.
  - **AK-E1-02** Seeds 1…200: Rechtecke disjunkt, Lücke ≥ 8; `seaLanes` → `d(0, i)` in `[dMin, dMax]`; je Linie kein
    Schnitt mit einem Rechteck ausser ihren beiden; Rahmen `W + H ≤ 300`.
  - **AK-E1-04** `failShapes: true` (Seeds 1…20): Ersatzform, alle Garantien erfüllt, Ergebnis zweimal gleich.
  - **Determinismus:** zweimal `generateForeignIslands(7, …)` tief gleich. **`d` (D-139):** je Seed `seaLength` =
    `L − exitA − exitB` (± 1e-9); `clipInside` für Segment ganz innen 1, ganz aussen 0, halb 0,5.
  - **B6:** `readFileSync('src/sim/islands.ts')` enthält kein `Math.hypot`.
- [ ] **2 Rot-Beleg** `npx vitest run tests/sim/islands-gen.test.ts` → Commit `test: M12 E1 Inselgenerator (rot)`.
- [ ] **3 Umsetzung** `sea.ts`, `islands.ts` nach „Regeln". Laufzeit melden: Mittel `generateForeignIslands` über Seeds
      1…50 (Commit-Text).
- [ ] **4 Prüfen:** `make check`, `CI=true make check` grün; `git diff -- src/sim/mapgen.ts src/sim/rng.ts` leer.
      Commit `feat: M12 E1 Fremdinsel-Generator und Fahrlinien`.

**Halt-Regel:** AK-E1-02 scheitert für einen Seed auch mit Ersatzlage → anhalten, Meldung an den Controller (Spielwert, L0).

**Review-Fokus:** nur Inselstrom; `Math.sqrt`; Werte nur `sea.ts`; Ersatzform mit Garantien; `d` nach D-139.
