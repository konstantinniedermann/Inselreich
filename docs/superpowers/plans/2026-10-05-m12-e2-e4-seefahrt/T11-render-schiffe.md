> **Task-ID:** T11 · **AK-IDs:** AK-E4-12, AK-E4-15
> **blocked-by:** T10 · **Strang:** render, `.worktrees/m12-see-render` · `tech-ui-engineer` (sonnet)
> **Regeln:** Spec §8 (Schiff auf der Linie, Tiefensortierung, ≥ 12 CSS-px bei Zoom ≤ 0,25), Anhang 02 (Detailstufe
> ≤ 0,25 ohne Figuren — Schiffe bleiben sichtbar); Index P-4

## T11: Render — Handelsschiffe auf der Fahrlinie

**Ziel:** Jedes Schiff ist im Bild: liegend am Anker seines Hafens, unterwegs auf der Fahrlinie, richtig verdeckt und
auch im Archipel-Überblick gross genug zum Anklicken.

**Code-Fakten:** `World.ships` (T01); `islands.ts` `seaLanes(islands) → Lane { a, b, points, d }` (Archipel-Kachel-
koordinaten, Ankermitte `ox + ax + 0.5`), `laneTicks`; `render/ship.ts` `drawShip(ctx, cam, tile, timeMs)`,
`shipShadow`, `SHIP_H`; `renderer.ts` bewegte Objekte je Insel (`moving.push({ kind: 'ship', … })`, Tiefe `cx + cy`),
Inselfolge nach `ox + oy` (E1); `archipel.ts` `islandCam`; `ISO_W`.

**Dateien:** neu `src/render/shipLane.ts`; `src/render/renderer.ts`, `ship.ts` (nur Skalierung); neu
`tests/render/shipLane.test.ts`; `renderer.test.ts`.

## Schnittstellen (Produces, rein)

```ts
// src/render/shipLane.ts — importiert nur ../sim/types, ../sim/islands
export interface ShipPose {
  x: number;
  y: number;
  island: number | null;
} // Archipel-Kachel; island = Rechteck oder null (See)
export function lanePoints(world: World, from: number, to: number): Pt[]; // Lane-Punkte, für from > to umgedreht
export function pointAt(points: readonly Pt[], t: number): Pt; // t ∈ [0, 1] nach Polylinienlänge (Math.sqrt)
export function shipPose(world: World, ship: Ship): ShipPose; // to null → Anker von port; sonst t = 1 − left / laneTicks
export function seaShipAfter(pose: ShipPose, isl: Island): boolean; // Tiefe: nach Insel zeichnen?
export function shipScale(zoom: number): number; // max(1, MIN_SHIP_CSS_PX / (SHIP_W_PX × zoom))
export const MIN_SHIP_CSS_PX = 12;
export function shipAt(world: World, cam: Camera, sx: number, sy: number): number | null; // Schiffs-id unter dem Zeiger (T15)
```

## Regeln (verbindlich)

- **Position:** `t = 1 − left / laneTicks(islands, port, to)`; `pointAt` verteilt `t` über die **ganze**
  Polylinienlänge (nicht `d`), Wegpunkte bei ihrem Längenanteil exakt. Liegt das Schiff (`to null`): Anker von `port`
  (Archipel `ox + anchor.x + 0.5`). Mehrere liegende Schiffe teilen den Anker (keine Versatzregel, YAGNI).
- **Tiefe (AK-E4-15):** Liegt die Pose im Rechteck einer Insel, ist das Schiff ein bewegtes Objekt dieser Insel in
  Inselkoordinaten (`x − ox`, `y − oy`), Tiefe wie heute `cx + cy` — vor Gebäuden mit kleinerer, hinter Gebäuden mit
  grösserer Tiefe. Auf offener See: nach Insel `i` zeichnen, wenn `x + y ≥ ox_i + oy_i + (w_i + h_i) / 2`, sonst davor
  (`seaShipAfter`); See-Schiffe untereinander nach `x + y`, dann `id`.
- **Grösse:** `drawShip` bekommt einen Skalierungsfaktor `shipScale(zoom)`; bei Zoom ≤ 0,25 Breite ≥ 12 CSS-px. Die
  Detailstufe ≤ 0,25 lässt Schiffe gezeichnet (nur Schaum/Kielwasser darf entfallen).
- `shipAt`: Treffer im Bildrechteck des skalierten Schiffs, oberstes (grösste Tiefe) gewinnt; nur lesend.
- `src/render/` schreibt nie in `world.ships`.

## Schritte

- [ ] **1 Tests zuerst** `tests/render/shipLane.test.ts`, `describe('M12 E4 Schiffsposition')`; Welt aus
      `tests/sim/seaHelpers.ts` (`seaWorld()`, `foundKontor2Literal`, `shipLiteral`):
  - **AK-E4-12** `pointAt(points, 0)` = erster Anker, `1` = letzter; `0.5` = Punkt bei halber Polylinienlänge
    (Testlinie mit Wegpunkt, Länge von Hand gerechnet); Wegpunkt bei seinem Längenanteil exakt getroffen;
    `shipPose`: `left = laneTicks` → Start-Anker, `left = 0` (vor Ankunft nicht erreichbar, direkt gesetzt) → Ziel;
    Richtung 2 → 0 nutzt die umgedrehte Lane.
  - **AK-E4-15** (a) Schiff im Rechteck der Heimat zwischen zwei Gebäuden: Zeichenfolge im Fake-Kontext Gebäude
    kleiner Tiefe → Schiff → Gebäude grösserer Tiefe; (b) Schiff auf See südöstlich von Insel 1 → nach Insel 1
    gezeichnet, nordwestlich → davor; (c) `shipScale(0.25) × SHIP_W_PX × 0.25 ≥ 12`, ebenso bei 0,125; bei Zoom 1
    Faktor 1 (Heimatbild unverändert).
  - `shipAt` trifft die Schiffsmitte, verfehlt 1 Kachel daneben.
- [ ] **2 Rot-Beleg** → Commit `test: M12 E4 Schiffe auf der Fahrlinie (rot)`.
- [ ] **3 Umsetzung**; Renderer sammelt Schiffe je Insel bzw. See nach den Regeln.
- [ ] **4 Prüfen:** `HOME_CALLS` grün (ohne Schiffe unverändert); `make check`, `CI=true make check` → Commit
      `feat: M12 E4 Handelsschiffe zeichnen`.

**Review-Fokus:** reine Mathematik getestet; Längenanteil statt Segmentanteil; Tiefenregel; Mindestgrösse; Schiffe
in der Detailstufe sichtbar; nur lesend.
