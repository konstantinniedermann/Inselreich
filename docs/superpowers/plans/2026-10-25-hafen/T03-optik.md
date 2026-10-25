# T03 · Schiffsoptik, Trefferform, Steg-Zeichner, Galerie (Optik-Strang, R32, Art-Brief R943)

Umsetzer `art-rendering-engineer` · ≈ 70 Tools · AK-HF-52 (Wortlaut R943), AK-HF-51 Vorstufe (Galerie) · blocked-by: L1 auf main · Worktree `.worktrees/hafen-optik`
(`feat/hafen-optik` ab main nach L1) · **Vorgabe: Anhang 03 Art-Brief** (`…-design/anhang-03-art-brief.md`, `design/hafen` @ `080557e2`, ganz lesen, 17 KB; geht Anhang 02
vor, wo beide abweichen) · Pflicht P1–P10, Kür K1–K5 nur im Tool-Budget und nicht abnahmerelevant

## Dateien (Brief §10)

- ändern: `src/render/ship.ts` (`drawShip` mit `look`, Konstanten §4, Farbsätze §5, Trefferform P10; `shipTile` **nicht** anfassen, Eigentum L1/L4),
  `src/render/shipLane.ts` (**nur** `shipAt`: Trefferform statt Rechteck, Richtung fest `SW`, gesetzt; `MIN_SHIP_CSS_PX` bleibt 16)
- neu: `src/render/steg.ts` (`drawSteg`, P9, §8), `tools/render-qa/schiffe.mjs` (Galerie-Harness §11.2, nie im Build; Muster `blindprobe.mjs`/`sitzung.mjs`)
- Tests: `tests/render/ship.test.ts`, `tests/render/steg.test.ts` (neu), `tests/render/shipLane.test.ts` (AK-HF-52), Fake-Kontext `tests/render/fakeCtx.ts`
- **nicht ändern:** `src/render/renderer.ts` (Brief §10: Aufrufer bleiben gültig, `look` und Steg-Lage verdrahtet L4/T14, Auftragsschiff-Farbsatz T15), `src/sim/`,
  `shipPose`, Liegeplätze. Bis L4 zeigen alle Schiffe im Spiel `SW` mit gesetztem Segel (vollständiges, mergebares Zwischenbild).

## Interfaces (P-11, Nachtrag R945)

```ts
// src/render/ship.ts
export type Heading = 'NO' | 'NW' | 'SO' | 'SW';
export type Livery = 'eigen' | 'auftrag';
export interface ShipLook {
  heading: Heading;
  furled: boolean;
  livery: Livery;
}
export const DEFAULT_LOOK: ShipLook; // { heading: 'SW', furled: false, livery: 'eigen' } (P5)
export const MAST_TO_RIDGE = 1.2; // Mastspitze / Kontorfirst, Toleranz im Bild 1,1 … 1,3 (§4)
export function drawShip(
  ctx,
  cam,
  tile: Pos,
  timeMs: number,
  scale = 1,
  look: ShipLook = DEFAULT_LOOK,
): void;
/** P10: zwei Polygone in Bildpixeln (Zoom 1, scale 1) relativ zur Wasserlinie der Schiffsmitte:
 *  [0] Rumpfumriss inkl. Bugspriet, um 0,05 Kachel erweitert; [1] Segelrechteck (gesetzt) bzw. Mastsäule s ±0,06 plus Wulst (gerefft). */
export function shipHitShape(heading: Heading, furled: boolean): [Pt[], Pt[]];
// src/render/steg.ts
/** P9: Planken roofWood, Fugen wallTimber alle 0,10 Kachel erst ab Zoom ≥ 1, Breite 0,30, Deck z 4 px, 3 Pfähle roofTimber, Kontur toInk(roofWood).
 *  from = Punkt am Kontorrand, to = Mitte der Ankerkachel (Kachelraum). Lage und Aufruf: T14. */
export function drawSteg(ctx, cam, from: Pt, to: Pt): void;
```

## Verhalten

- **Eine Profilzeichnung mit `heading`, keine Spiegelung, kein zweiter Formensatz (§2, R943).** Bildpunkt `P(s, q, z) = Mitte + s · H + q · Q − (0, z · ISO_H)` mit `H`/`Q`
  aus der Tabelle §1 (SO +x, SW +y, NO −y, NW −x). Rumpf als Seitenprofil in der Kiellinien-Ebene (Scherung entlang `H`), Rahsegel quer dazu (Scherung entlang `Q`).
  Zeichenfolge: Bug zum Betrachter (SO, SW) Rumpf → Mast → Rahsegel → Fock; Bug vom Betrachter weg (NO, NW) Fock → Rumpf → Mast → Rahsegel.
- **Masse §4 als benannte Konstanten** in `ship.ts` (Rumpf `s` ±0,50, Kiel `z` −0,08, Deck 0,30/Bug 0,45, Kastell −0,50…−0,25 mit Oberkante 0,62 und Stufe 0,42,
  Vorsteven, Bordstreifen, Bugspriet, Mast `s` +0,05 `z` 0,30…1,78, Rah, Fock, Wimpel, Wulst). Rumpf **ein** geschlossener Pfad (P1). Masthöhe aus `bodyHeight(kontor)`
  und `BODY_INSET` hergeleitet (`MAST_TO_RIDGE`), nicht als Pixelzahl.
- **Fernsicht:** gezeichnete Breite inkl. Bugspriet 1,3 Kachel; `SHIP_W_PX`/`SHIP_DRAWN_FRAC` so, dass `shipScale` damit rechnet (Zoom 0,5 ≥ 16 CSS-px, ≈ 20,8).
  Linien Mast/Rah/Bugspriet `max(1, 1,5 · zoom · scale)` px.
- **Farben §5** nur aus `PALETTE`: Rumpf `roofTimber`, Bordstreifen `roofWood`; Segel/Fock/Wulst `wallLime` (eigen) bzw. `roofTerracotta` (auftrag); Wimpel
  `roofCopper` bzw. `roofSlate`; Kontur `toInk` des Flächentons, nie Schwarz, keine `signal*`. Saum `SAUM` bei Zoom ≤ 0,5 um Rumpf, Rahsegel bzw. Wulst, Fock **und Mast** (P7).
- `furled` (P6): Segel als Wulst an der Rah, Fock eingeholt. Wimpel weht aus `timeMs` wie die Kontorflagge (P3). Schaukeln/Neigung bleiben, Drehpunkt Wasserlinie Mitte.
- **`shipAt`:** Punkt-in-Polygon gegen `shipHitShape('SW', false)`, skaliert mit `shipScale · zoom`; T14 stellt auf `pose.heading`/`pose.furled` um.
- **Galerie-Harness §11.2** `tools/render-qa/schiffe.mjs`: zeichnet `drawShip` auf Wasserkacheln im Raster 4 Richtungen × gesetzt/gerefft × Zoom 0,5/1/2 plus Auftragsschiff,
  Tag und Nacht über die Grading-Funktion aus `daynight.ts` mit fester Tageszeit (kein Hook in `galerie.mjs`); Bilder `.studio/qa/hafen-optik/galerie/`. Modus `--blind`:
  16 anonyme Ausschnitte (4 Richtungen × gesetzt/gerefft × Zoom 1 und 0,5) + 4 eigen/fremd bei Zoom 0,5, gemischt, Dateinamen `probe-nn.png`, Zuordnung getrennt in
  `ZUORDNUNG-NICHT-OEFFNEN.json` (wie `blindprobe.mjs`, keine Art im Bild, Namen oder PNG-Daten). Lastregel des Musters (Abbruch bei 1-min-Last > 4).

## Steps

- [ ] **Tests rot** `tests/render/ship.test.ts`, `describe('HAFEN Optik (Art-Brief §11.1)')`, Fake-Kontext:
  - je `heading`: Bugspriet-Spitze im Bild auf der Seite von `H` (Vorzeichen x **und** y), Kastell-Oberkante höher als Bug-Deck, Wimpel-Spitze auf der Gegenseite von `H`;
  - `furled`: Segelpfad ≤ 0,15 · `ISO_H` · `zoom` hoch, kein Fock-Pfad;
  - keine Füll-/Strichfarbe Schwarz (`#000`, `black`), keine `signal*`-Töne;
  - Zoom 0,5: Saum-Strich vor Rumpf, Segel, Fock und Mast; Zoom 1: keiner;
  - `livery: 'auftrag'`: Segel `roofTerracotta`, Wimpel `roofSlate`;
  - Wächter: Aufruf ohne `look` zeichnet wie `DEFAULT_LOOK`; Mastspitze / Kontorfirst = `MAST_TO_RIDGE` (Rechnung aus den Konstanten, ±0,01).
- [ ] **Tests rot** `tests/render/steg.test.ts`: Fugen erst ab Zoom ≥ 1 (Zoom 0,5: keine Fugen-Striche); genau 3 Pfähle; keine Schwarz-/`signal*`-Farbe.
- [ ] **Test rot** `tests/render/shipLane.test.ts`, **AK-HF-52 (Wortlaut R943):** über `shipHitShape` für alle 4 `heading` × gesetzt/gerefft: Treffer an Rumpfmitte und
      Mastspitze; **kein Treffer** an Punkten 0,2 · `ISO_W` Bildabstand (Zoom 1) ausserhalb des Umrisses vor dem Bugspriet, hinter dem Heck und unter dem Kiel; über
      `shipAt` (Richtung `SW`) dieselben drei Punkte ohne Treffer, Rumpfmitte mit Treffer. Wächter: Auftragsschiff nie (`shipAt` iteriert nur `world.ships`).
- [ ] **Lauf rot:** `npx vitest run tests/render/ship.test.ts tests/render/steg.test.ts tests/render/shipLane.test.ts; echo EXIT=$?` → ≠ 0.
- [ ] **Umsetzen** (P1–P10; Kür nur, wenn ≤ 70 Tools reichen, im Bericht benennen).
- [ ] **Lauf grün** plus `tests/render/{renderer,decorSea,seaMap,seaMapDraw}.test.ts` (Aufrufliste und Treffer; Hash-Pins der Aufrufliste ändern sich durch die neue
      Silhouette: je Test Name, alt → neu, Begründung «HAFEN Optik R32/R943» im Commit).
- [ ] **Galerie und Blindsatz erzeugen (Last ≤ 4 nötig, sonst `waiting`):** `node tools/render-qa/schiffe.mjs --root <worktree>; echo EXIT=$?` und
      `node tools/render-qa/schiffe.mjs --blind …; echo EXIT=$?`; Ordner im Bericht. Die Zuordnungsdatei liest nur der Controller.
- [ ] Teilbeleg laut Index (`make lint` schliesst `tools/render-qa/` ein).
- [ ] **Commit:** `feat: Schiffsoptik mit Fahrtrichtung, Reff und Farbsatz, Steg-Zeichner, Schiffsgalerie (HAFEN Optik, AK-HF-52)`.

## Bericht

Exit-Codes; Rot-Ausgabe; neu gepinnte Hashes; Kür umgesetzt ja/nein je K1–K5; Galerie- und Blindsatz-Pfade; Breite bei Zoom 0,5 in CSS-px.
