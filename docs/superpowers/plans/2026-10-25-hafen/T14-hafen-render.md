# T14 · Hafen-Darstellung: Liegeplätze, Pose mit Richtung, Steg (S5, R23–R25)

Umsetzer `art-rendering-engineer` · ≈ 60 Tools · AK-HF-36, -37, -38, -39 · blocked-by: L3, O und FIX-SCHIFF-A1 auf main · Worktree `.worktrees/hafen-render`
(`feat/hafen-render` ab main) · Spec §3.5, Anhang 02 §E–§G, §I · Index P-11

## Dateien

- ändern: `src/render/shipLane.ts` (`shipPose`, Liegeplätze, `shipAt` auf Pose-Richtung), `src/render/renderer.ts` (Steg zeichnen, `look` an `drawShip`)
- neu: `src/render/dock.ts` (Steg-Geometrie und -Zeichner), `tests/render/dock.test.ts`
- Tests: `tests/render/shipLane.test.ts`, `tests/render/renderer.test.ts` (Aufrufliste, falls rot: Pins per Name)
- nicht ändern: `src/sim/`, `src/render/ship.ts` (Optik aus O; nur aufrufen), Auftragsschiff (T15 — dort kommt der Rang-0-Platz dazu)

## Interfaces

```ts
// src/render/shipLane.ts
export const BERTH_MIN_GAP = 0.5; // Kachel, Darstellungswert (Spec §3.9)
export interface ShipPose {
  x: number;
  y: number;
  island: number | null;
  heading: Heading;
  furled: boolean;
}
export function shipPose(world: World, ship: Ship, frac = 0): ShipPose; // A1-Signatur bleibt
/** Liegeplatz-Mittelpunkte am Anker von `island` für `n` Ränge (Rang 0 = Anker-Mitte); jeder auf einer Wasserkachel, paarweise ≥ BERTH_MIN_GAP. */
export function berths(world: World, island: number, n: number): Pt[];
/** Rang je liegendem Flottenschiff am Anker: nach id; `orderFirst` = Auftragsschiff liegt dort (dann beginnen die Flotten-Ränge bei 1). */
export function berthRank(world: World, ship: Ship, orderFirst: boolean): number;
// src/render/dock.ts
export interface DockGeom {
  from: Pt;
  to: Pt;
  piles: Pt[];
} // Kontorrand → Mitte Ankerkachel, 3 Pfähle
export function dockGeom(world: World, island: number): DockGeom | null; // null ohne Kontor (kontorId null)
export function drawDock(ctx: CanvasRenderingContext2D, cam: Camera, geom: DockGeom): void;
```

## Verhalten

- **Richtung (R25):** fahrend aus der Tangente der Fahrlinie an der Pose (Punkt bei `t` und bei `t + ε` auf `lanePoints`), in Iso-Bildkoordinaten auf eine von 4 Richtungen
  NO/NW/SO/SW abgebildet (Quadrant der projizierten Tangente, `iso.ts` `project`). Liegend mit Route und `port` in der Route: Endtangente von
  `lanePoints(anderer Hafen, port)`; sonst `DEFAULT_LOOK.heading`. `furled = ship.to === null`.
- **Liegeplätze (R24):** Kette entlang der Achse Kontormitte → Anker nach aussen, Schritt `BERTH_MIN_GAP + 0.1`, abwechselnd seitlich versetzt; Kandidaten, deren Kachel
  kein Wasser ist, überspringen; bis 5 Ränge (4 Schiffe + Auftragsschiff). Deterministisch aus der Welt.
- **Steg (R23):** Heimat und jede Insel mit `kontorId ≠ null`; vom nächsten Kontorrand (bei Diagonal-Anker von der nächsten Ecke) zur Mitte der Ankerkachel, Breite ≈ 0,3
  Kachel, Planken/Fugen/Pfähle nach Anhang 02 §I. Zeichenfolge: Steg vor den Schiffen am selben Anker (gleiche Insel, Tiefe des Ankers minus ε).
- `shipAt` nutzt `shipBox(pose.heading)` (T03).

## Steps

- [ ] **Tests rot** `tests/render/shipLane.test.ts`:
  - AK-HF-36: 4 liegende Flottenschiffe und `orderFirst = true` am selben Anker → 5 Mittelpunkte auf Wasserkacheln, paarweise ≥ 0,5; Rang 0 frei für das Auftragsschiff,
    Flotte in `id`-Folge.
  - AK-HF-37: liegend (`dwell > 0` bzw. ohne Route) am Liegeplatz mit `furled` wahr; fahrend `furled` falsch.
  - AK-HF-38: synthetische Lanes mit Tangente in jedem Iso-Quadranten → `heading` NO, NW, SO, SW; liegend die Ankunftsrichtung.
- [ ] **Test rot** `tests/render/dock.test.ts` AK-HF-39 (Fake-Kontext): Insel mit Kontor zeichnet einen Steg, Insel ohne Kontor keinen; in der Zeichenfolge des Renderers
      liegt der Steg vor dem Schiff am selben Anker.
- [ ] **Lauf rot → Umsetzen → Lauf grün** plus `tests/render/{renderer,decorSea,seaMap,seaMapDraw,shipLane}.test.ts`; Aufruflisten-Pins per Name neu, Begründung «HAFEN S5».
- [ ] Teilbeleg laut Index; Bild-Hinweis für T16 (wie Seed 1, Insel B, Kontor II abseits `kontorSite` erreicht wird).
- [ ] **Commit:** `feat: Steg, Liegeplätze und Fahrtrichtung der Schiffe (HAFEN S5, AK-HF-36..39)`.

## Bericht

Exit-Codes; Rot-Ausgabe; Pin-Liste; gewählte Kettenregel in einem Satz.
