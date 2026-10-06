> **Task-ID:** T03 · **AK-IDs:** AK-E1-07, -08, -09, -12 (Mathe), -13 (Stufen, Grenze), -17 (Vitest), -10 (Pin)
> **blocked-by:** T02, **REL-03 auf `main`, geholt über `feat/m12-e0`** (R231 prod-B2) · **Strang:** render, `.worktrees/m12-e1` · `tech-ui-engineer` (sonnet)
> · läuft **parallel zu T04** (anderer Worktree, andere Dateien)
> **Regeln:** [index.md](index.md) Global Constraints, P-7 · Spec Anhang 02 D (Weltkoordinaten, Culling, Picking,
> Zoom), F (Streichvariante)

## T03: Kamera, Culling, Picking und Zoom für den Archipel (reine Mathematik)

**Ziel:** Reine Funktionen beantworten: welche Inseln sind im Bild, welche Kachel liegt unter dem Mauszeiger, wie weit
darf die Kamera. Noch kein Zeichnen (T05) und keine Bedienung (T06).

**Code-Fakten:** `src/render/iso.ts` `project`/`unproject` (linear), `H_TOWER`, `ZOOM_STEPS = [0.5 … 2]`, `zoomStep`;
`src/render/camera.ts` `clampToMap(c, map, w, h)`, `zoomAt` klemmt hart auf `[0.5, 2]`, `visibleTileRange(c, view,
map)`, `screenToTileF`. Seit T02: `Island` mit `ox`, `oy`, `width`, `height`, `anchor`.

**Dateien:** neu `src/render/archipel.ts`, `tests/render/archipel.test.ts`; `src/render/camera.ts`, `iso.ts`;
`tests/render/camera.test.ts`, `iso.test.ts`, `renderer.test.ts` (nur `HOME_CALLS`, Schritt 5). **Nicht:** `renderer.ts`,
`src/ui/`, `terrain.ts` (T04).

## Schnittstellen (Produces)

```ts
// src/render/archipel.ts — Archipel-Mathematik (Spec M12 Anhang 02 D/F). Darstellungswerte, keine Spielwerte.
export type ArchipelView = 'sea' | 'jump';
export const ARCHIPEL_VIEW: ArchipelView = 'sea'; // Streichvariante B: 'jump'
export const CAMERA_MARGIN = 8; // Kacheln um den Archipel-Rahmen
export type Placed = Pick<Island, 'ox' | 'oy' | 'width' | 'height'>;
export interface TileRect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
} // Archipel-Kacheln, x1/y1 exklusiv
/** Kamera, mit der Insel `isl` in Inselkoordinaten gezeichnet wird (project ist linear). */
export function islandCam(c: Camera, isl: Placed): Camera {
  const p = project(isl.ox, isl.oy);
  return { x: c.x - p.x, y: c.y - p.y, zoom: c.zoom };
}
export function visibleIslands(
  c: Camera,
  view: View,
  islands: readonly Placed[],
  active = 0,
  mode = ARCHIPEL_VIEW,
): number[];
export function pickArchipel(
  c: Camera,
  sx: number,
  sy: number,
  islands: readonly Placed[],
  active = 0,
  mode = ARCHIPEL_VIEW,
): { island: number; x: number; y: number } | null;
export function archipelRect(islands: readonly Placed[]): TileRect;
export function cameraBounds(
  islands: readonly Placed[],
  active = 0,
  mode = ARCHIPEL_VIEW,
): TileRect;
```

- `visibleIslands`: projiziertes Rechteck der vier Ecken `(ox, oy)`, `(ox + w, oy)`, `(ox, oy + h)`, `(ox + w, oy + h)`,
  oben um `H_TOWER` erweitert, gegen `[c.x, c.x + view.w / c.zoom] × [c.y, c.y + view.h / c.zoom]`; Ergebnis nach
  `ox + oy` aufsteigend, dann Index. `mode 'jump'` → nur `[active]`, wenn sichtbar, sonst `[]`.
- `pickArchipel`: `f = screenToTileF(c, sx, sy)`; die Insel, deren Rechteck `f` enthält → `{ island, x: floor(f.x − ox),
y: floor(f.y − oy) }`; sonst `null`. `'jump'` prüft nur `active`.
- `cameraBounds`: `'sea'` → `archipelRect` ± `CAMERA_MARGIN`; `'jump'` → Rechteck der aktiven Insel.
- `camera.ts`: `clampToRect(c, r: TileRect, viewW, viewH)` (Rechnung von `clampToMap` mit `x0/x1` statt `0/map.w`,
  Ersatzwert Rechteckmitte); `clampToMap` ruft `clampToRect(c, { x0: 0, y0: 0, x1: map.w, y1: map.h }, …)` —
  **zahlengleich** zu heute. `zoomAt(c, f, sx, sy, view, bounds: MapSize | TileRect)` klemmt auf
  `[ZOOM_STEPS[0], ZOOM_STEPS.at(-1)]`. `iso.ts`: `ZOOM_STEPS = [0.125, 0.25, 0.5, 0.75, 1, 1.5, 2]`.
- `visibleTileRange` bleibt unverändert; je Insel: `visibleTileRange(islandCam(c, isl), view, { w, h })`.

## Schritte

- [ ] **0 Basis:** `git merge feat/m12-e0` (E0 hat `main` mit REL-03 gemerged: `git log feat/m12-e0 --oneline | grep -i "h-r13"`
      trifft); `main` direkt nur per L0-Ruling. `make check` grün.
- [ ] **1 Tests zuerst** `tests/render/archipel.test.ts`, `describe('M12 E1 Archipel')`, Testinseln als Literale
      (Heimat `{ox:0,oy:0,width:64,height:64}`, A `{ox:90,oy:10,width:24,height:24}`, B `{ox:20,oy:100,width:36,height:36}`),
      View 1920 × 1080:
  - **AK-E1-07** Kamera direkt gesetzt (`p = project(fx, fy)`, `c.x = p.x − view.w / 2 / zoom`, ohne Klemmung) auf Heimatmitte, Zoom 1 → `[0]`; Kamera auf Meerpunkt zwischen den Inseln
    (Zoom 1, `(80, 80)`) → `[]`; Zoom 0,125 auf Rahmenmitte → `[0, 1, 2]` in Tiefenfolge; Kamera so, dass A halb im
    Bild → enthält `1`.
  - **AK-E1-08** 20 Kamerastellungen (Gitter über Heimat, Zoom 0,5/1/2): `visibleTileRange(islandCam(c, heimat), …)`
    tief gleich `visibleTileRange(c, …)`; für A: Bereich in Inselkoordinaten, geklemmt auf `[0, 23]`.
  - **AK-E1-09** je Insel Mitte einer Kachel `(3, 4)` → Bildpunkt per `worldToScreen(c, project(ox+3.5, oy+4.5))` →
    `pickArchipel` = `{ island, x: 3, y: 4 }`; Meerpunkt → `null`; 50 Gitterpunkte über der Heimat: Ergebnis gleich
    `screenToTile` (innerhalb `[0, 64)`).
  - **AK-E1-12 (Mathe)** `mode 'jump'`, `active 1`: `visibleIslands` ⊆ `[1]`, `cameraBounds` = Rechteck von A,
    `pickArchipel` auf Heimat → `null`.
  - **AK-E1-13** (`camera.test.ts`): `ZOOM_STEPS[0] === 0.125`; zehnmal `zoomAt(c, 0.5, …)` → `zoom === 0.125`;
    `clampToMap` gleich `clampToRect` mit `{0,0,w,h}` für 20 Stellungen; `cameraBounds('sea')` = Rahmen ± 8.
  - **AK-E1-17 (Vitest, qa-B3)** Seeds 1…200, `createWorld(s).islands`: Bildbox des `archipelRect` bei Zoom 0,125
    (vier Ecken projiziert, oben `H_TOWER`) ≤ 1280 × 800 CSS-px; Kamera `centerOn` Rahmenmitte → `visibleIslands` = alle.
- [ ] **2 Rot-Beleg** `npx vitest run tests/render/archipel.test.ts tests/render/camera.test.ts` → Commit
      `test: M12 E1 Archipel-Kamera (rot)`.
- [ ] **3 Umsetzung** nach „Schnittstellen". `grep -rn "ZOOM_STEPS\|0\.5" src/ui src/render | grep -i zoom` —
      Stellen, die `ZOOM_STEPS[0]` als 0,5 annehmen, melden (nicht ändern; T06).
- [ ] **4 Prüfen:** `make check`, `CI=true make check` grün; bestehende `camera`/`iso`/`picking`-Tests unverändert grün.
      Commit `feat: M12 E1 Archipel-Kamera, Culling, Picking, Zoom 0,125`.
- [ ] **5 `HOME_CALLS` (AK-E1-10, qa-B1)** — vor dem Terrain-Merge, `renderer.ts` unverändert: in `renderer.test.ts`
      Helfer `callList(world, cam, view)` (fakeCtx, `fx.timeMs 5000`); Welt `deserialize(save-v7.json)`; View 1280 × 800,
      Heimatmitte, Zoom 1 und 2. Der Test prüft zuerst, dass `visibleTileRange` je Kamera in `[4, 59]` liegt (4-Kachel-Rand
      nicht im Bild), dann `fnv1a32(JSON.stringify(calls))` + Länge = `HOME_CALLS` (Werte aus dem Lauf). Commit
      `test: M12 E1 Heimat-Aufrufliste gepinnt`. Der Controller merged `feat/m12-e1-terrain` erst danach.

**Review-Fokus:** `clampToMap` zahlengleich; reine Funktionen ohne Weltzugriff; Tiefenfolge; `'jump'` vollständig in
`src/render/`.
