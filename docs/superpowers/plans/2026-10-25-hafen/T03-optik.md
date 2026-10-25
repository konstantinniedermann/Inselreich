# T03 · Schiffsoptik und Trefferbox (Optik-Strang, R32, Anhang 02 B–H)

Umsetzer `art-rendering-engineer` · ≈ 60 Tools · AK-HF-52 (AK-HF-51 Vorstufe) · blocked-by: L1 auf main · Worktree `.worktrees/hafen-optik` (`feat/hafen-optik` ab main
nach L1) · Spec §3.8, Anhang 02 (ganz lesen, 6 KB)

## Dateien

- ändern: `src/render/ship.ts` (`drawShip`, Konstanten; `shipTile` **nicht** anfassen, Eigentum L1/L4), `src/render/shipLane.ts` (**nur** `shipAt`, `MIN_SHIP_CSS_PX`
  bleibt 16), `src/render/renderer.ts` (**nur** die zwei `drawShip`-Aufrufe: Auftragsschiff `look.foreign = true`)
- Tests: `tests/render/ship.test.ts` (Fake-Kontext `tests/render/fakeCtx.ts`), `tests/render/shipLane.test.ts` (AK-HF-52)
- nicht ändern: `src/sim/`, Pose-Logik (`shipPose`), Liegeplätze und Steg (L4)

## Interfaces (P-11)

```ts
export type Heading = 'NO' | 'NW' | 'SO' | 'SW';
export interface ShipLook {
  heading: Heading;
  furled: boolean;
  foreign: boolean;
}
export const DEFAULT_LOOK: ShipLook; // { heading: 'SW', furled: false, foreign: false } (Anhang 02 §E, Wahl lead-art)
export function drawShip(
  ctx,
  cam,
  tile: Pos,
  timeMs: number,
  scale = 1,
  look: ShipLook = DEFAULT_LOOK,
): void;
/** Bildrechteck der Silhouette relativ zur Rautenmitte in Einheiten von w bzw. h, je Richtung (für shipAt und Tests). */
export function shipBox(heading: Heading): { x0: number; x1: number; y0: number; y1: number };
```

Alle Masse als benannte Konstanten in `ship.ts` (Anhang 02: Länge ≈ 1 Kachel, Mast ≈ 1,2 × Kontorfirst aus `iso.ts` `kontor`-Höhe, Bordstreifen, Bugspriet, Wimpel).
Farben nur aus `PALETTE` (Anhang 02 §D, §H), Kontur über `toInk`, nie Schwarz, keine `signal*`-Töne.

## Verhalten

- Silhouette, Takelage, Zweiton-Rumpf, gesetzt/gerefft, fremde Segel- und Wimpelfarbe nach Anhang 02 §B–§D, §F, §H. Rumpf und Segel je **ein geschlossener Pfad**, damit
  der Saum (`SAUM`, Zoom ≤ 0,5) die ganze Form umläuft.
- 4 Richtungen: zwei Grundformen (Bug links/rechts) plus Spiegelung erlaubt (§E), Heck- und Bugspriet-Lage je Richtung eindeutig; kein Weichdrehen.
- `SHIP_DRAWN_FRAC`, `SHIP_ASPECT_H` an die neue Silhouette anpassen (`shipScale` hält ≥ 16 CSS-px).
- `shipAt` nutzt `shipBox(DEFAULT_LOOK.heading)` (die Pose kennt die Richtung erst ab L4; L4/T14 stellt auf die Pose-Richtung um).
- Bis L4 rufen alle Stellen `drawShip` ohne `look` bzw. Auftragsschiff mit `{ ...DEFAULT_LOOK, foreign: true }` auf.

## Steps

- [ ] **Tests rot** `tests/render/ship.test.ts`, `describe('HAFEN Optik')` (Fake-Kontext): je Richtung liegt der Bugspriet-Endpunkt auf der Bugseite (Vorzeichen x je
      NO/NW/SO/SW, Iso-Konvention aus `iso.ts`); `furled` zeichnet weniger Segelfläche (Pfad-Bounding-Box der Segel < 0,4 × gesetzt); `foreign` nutzt andere Segelfarbe als die
      Flotte; keine `fillStyle`/`strokeStyle` gleich `#000`/`black`; bei Zoom 0,5 wird der Saum vor dem Rumpf gezeichnet.
- [ ] **Test rot** `tests/render/shipLane.test.ts`, AK-HF-52: `shipAt` trifft an Rumpfmitte und Mastspitze für alle 4 Richtungen (über `shipBox`), nicht 0,2 Kachel neben
      dem Rumpf; Auftragsschiff nie (`shipAt` iteriert nur `world.ships`, Wächtertest).
- [ ] **Lauf rot:** `npx vitest run tests/render/ship.test.ts tests/render/shipLane.test.ts; echo EXIT=$?` → ≠ 0.
- [ ] **Umsetzen.**
- [ ] **Lauf grün** plus `tests/render/{renderer,decorSea,seaMap,seaMapDraw}.test.ts` (Aufrufliste und Treffer; Hash-Pins der Aufrufliste ändern sich durch die neue
      Silhouette: je Test Name, alt → neu, Begründung «HAFEN Optik R32» im Commit).
- [ ] Teilbeleg laut Index; Bilder für T04 vorbereiten: kurzer Abschnitt im Bericht, wie die Szene (Seed 1, Route Heimat ↔ B, Zoom 0,5/1/2) erreicht wird.
- [ ] **Commit:** `feat: neue Schiffsoptik mit Fahrtrichtung, Reff und Fremdfarbe (HAFEN Optik, AK-HF-52)`.

## Bericht

Exit-Codes; Rot-Ausgabe; Liste der neu gepinnten Hashes; gewählte Werte (Standard-Richtung, Wimpel-/Fremdfarben, Ein-/Ausblenddauer O-5 als Konstante für L4).
