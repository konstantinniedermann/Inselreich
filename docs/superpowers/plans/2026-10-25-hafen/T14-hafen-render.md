# T14 · Hafen-Darstellung: Päckchen-Liegeplätze, Pose mit Richtung, Steg-Lage (S5, R23–R25, Art-Brief §6)

Umsetzer `art-rendering-engineer` · ≈ 60 Tools · AK-HF-36, -37, -38 (Wortlaut R943), -39 · blocked-by: L3, O und FIX-SCHIFF-A1 auf main · Worktree
`.worktrees/hafen-render` (`feat/hafen-render` ab main) · Spec §3.5, **Art-Brief §6 und §8** (`…-design/anhang-03-art-brief.md`, R943) · Index P-11, P-14

## Dateien

- ändern: `src/render/shipLane.ts` (`shipPose` mit `heading`/`furled`, `berths`, `berthRank`, `stegEnds`, `shipAt` auf Pose), `src/render/renderer.ts` (Steg-Aufruf
  `drawSteg`, `look` an `drawShip`)
- Tests: `tests/render/shipLane.test.ts`, `tests/render/renderer.test.ts` (Aufrufliste, falls rot: Pins per Name)
- **nicht ändern:** `src/sim/`, `src/render/ship.ts` und `src/render/steg.ts` (Eigentum O/T03; nur aufrufen), Auftragsschiff (T15 — dort kommt der Rang-0-Platz dazu).
  `src/render/dock.ts` entfällt (Nachtrag R945: Steg-Zeichner ist `steg.ts` aus O, die Lage liegt hier in `shipLane.ts`).

## Interfaces

```ts
// src/render/shipLane.ts
export const BERTH_MIN_GAP = 0.5; // Kachel, Darstellungswert (Spec §3.9): Päckchen-Schritt und Ersatz-Schritt
export const HEADING_CHORD = 1; // Kachel Weglänge je Seite für die Sehne (Brief §6)
export interface ShipPose {
  x: number;
  y: number;
  island: number | null;
  heading: Heading;
  furled: boolean;
}
export function shipPose(world: World, ship: Ship, frac = 0): ShipPose; // A1-Signatur bleibt
/** Päckchen: Rang 0 = Ankermitte, Rang k = Ankermitte + k · BERTH_MIN_GAP · n (n = Normale der Kaikante nach aussen); Ersatz siehe Verhalten. */
export function berths(world: World, island: number, n: number): Pt[];
export function berthRank(world: World, ship: Ship, orderFirst: boolean): number; // nach id; orderFirst → Flotte ab Rang 1
/** Steg-Lage: from = Punkt am Kontorrand (Kante oder Ecke), to = Mitte der Ankerkachel; null ohne Kontor. */
export function stegEnds(world: World, island: number): { from: Pt; to: Pt } | null;
/** Liegerichtung (Brief §6): kantenparallel, näher an der Ankunftstangente; Ecke → Tangente; ohne Fahrt SW, wenn kantenparallel, sonst SO. */
export function dockedHeading(world: World, island: number, arrival: Pt | null): Heading;
```

## Verhalten

- **Fahrend (Brief §6, Flackerschutz):** Sehne über ±`HEADING_CHORD` Kachel Weglänge um die Pose auf `lanePoints` (an den Enden geklemmt), dann quantisieren im
  Kachelraum: `|dx| ≥ |dy|` → `dx > 0` SO, sonst NW; sonst `dy > 0` SW, sonst NO. Zustandslos, deterministisch, kein `ε`-Tangentenpunkt. `furled = false`.
- **Liegend längsseits (R25 neu, AK-HF-38 neu, R943):** Kaikante = Seite des 2×2-Kontors, an der der Anker im 8er-Ring liegt: Anker in den Kontorspalten → Kante parallel zu x,
  kantenparallel `SO`/`NW`, Normale ±y; Anker in den Kontorzeilen → Kante parallel zu y, kantenparallel `SW`/`NO`, Normale ±x; sonst **Ecke** (beide Achsen parallel),
  Normale = Einheitsvektor Kontormitte → Ankermitte. Von den kantenparallelen Richtungen gilt die mit dem kleineren Winkel zur Ankunftstangente (Sehne über die letzte
  Kachel von `lanePoints(anderer Hafen, port)`); an der Ecke die quantisierte Ankunftstangente. Ohne vorherige Fahrt (keine Route, `port` ohne Lane): `SW`, wenn
  kantenparallel, sonst `SO`. Anker ausserhalb des 8er-Rings (Heimat-Altlage, kein Kontor): wie Ecke. `furled = true`.
- **Liegeplätze Päckchen (R24, Brief §6, P-14):** Rang 0 an der Ankermitte, Rang k um k · 0,5 entlang der Normalen nach aussen (fünf Schiffe reichen 2 Kacheln hinaus).
  Liegt ein Mittelpunkt nicht auf Wasser: Ersatz entlang der Kaikante abwechselnd +0,5, −0,5, +1,0, −1,0 … um den Päckchenpunkt, erster Kandidat auf Wasser mit Abstand
  ≥ `BERTH_MIN_GAP` zu allen früheren Rängen. Bis 5 Ränge (4 Schiffe + Auftragsschiff). Überlappen der Rümpfe ist dort erlaubt (02 §G); die Tiefensortierung deckt.
- **Steg (R23, Brief §8):** Heimat und jede Insel mit `kontorId ≠ null`; `from` = Mittelpunkt der Kaikante (Ecke: Kontorecke), `to` = Ankermitte; Renderer ruft
  `drawSteg(ctx, cam, from, to)` vor den Schiffen am selben Anker (Tiefe des Ankers minus ε).
- `shipAt` nutzt `shipHitShape(pose.heading, pose.furled)` (T03). Renderer gibt `look = { heading, furled, livery: 'eigen' }` an `drawShip`.

## Steps

- [ ] **Tests rot** `tests/render/shipLane.test.ts`:
  - AK-HF-36: 4 liegende Flottenschiffe und `orderFirst = true` am selben Anker (Anker in Zeile `kontor.y − 1`) → 5 Mittelpunkte auf Wasser, Rang k = Anker + k · 0,5 · Normale, paarweise
    ≥ 0,5; Rang 0 frei für das Auftragsschiff, Flotte in `id`-Folge. Variante mit Land auf Rang 2 → Ersatz +0,5 entlang der Kante, Abstände ≥ 0,5.
  - AK-HF-37: liegend (`dwell > 0` bzw. ohne Route) am Liegeplatz mit `furled` wahr; fahrend `furled` falsch.
  - **AK-HF-38 (Wortlaut R943):** synthetische Lanes je Kachelachse → fahrend `heading` SO, SW, NO, NW; liegend, Anker in Zeile `kontor.y − 1` (Kante parallel zu x):
    Ankunftstangente (+0,9; +0,4) → `SO`, (−0,9; +0,4) → `NW`; Anker in Spalte `kontor.x − 1` (Kante parallel zu y): (+0,4; +0,9) → `SW`, (+0,4; −0,9) → `NO`;
    Ecke → quantisierte Ankunftstangente; ohne Fahrt an der y-parallelen Kante `SW`, an der x-parallelen `SO`.
  - **Flackern (Brief §6):** Lane mit Bézier-Ecken unter 44° bzw. 46° zur x-Achse: über alle Ticks einer Fahrt höchstens ein Richtungswechsel je Ecke der Polylinie
    (Zählung, kein Zeitmass); gleicher `tick`/`frac` → gleiche Pose.
- [ ] **Test rot** `tests/render/shipLane.test.ts` AK-HF-39 (`stegEnds`) und `tests/render/renderer.test.ts` (Fake-Kontext): Insel mit Kontor zeichnet einen Steg
      (`stegEnds` ≠ null, `to` = Ankermitte), Insel ohne Kontor keinen; in der Zeichenfolge liegt der Steg vor dem Schiff am selben Anker.
- [ ] **Lauf rot → Umsetzen → Lauf grün** plus `tests/render/{renderer,decorSea,seaMap,seaMapDraw,shipLane,ship,steg}.test.ts`; Aufruflisten-Pins per Name neu, Begründung
      «HAFEN S5».
- [ ] Teilbeleg laut Index; Bild-Hinweis für T16 (Seed 1, Insel B, Kontor II abseits `kontorSite`; Kamera auf ein Schiff zentrieren für die Blind-Ausschnitte).
- [ ] **Commit:** `feat: Steg, Päckchen-Liegeplätze und Fahrtrichtung der Schiffe (HAFEN S5, AK-HF-36..39)`.

## Bericht

Exit-Codes; Rot-Ausgabe; Pin-Liste; Zahl der Richtungswechsel im Flacker-Test; Bild-Hinweis für T16.
