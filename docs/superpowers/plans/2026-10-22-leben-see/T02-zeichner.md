# T02 · Kielwasser: `drawWake` (Zeichner, Zoom, Palette, Kontrast)

Umsetzer `art-rendering-engineer` (gleiche Instanz wie T01, `SendMessage`) · ≈ 35 Tools · AK W8, W10, W11 · blocked-by: T01

## Dateien

- ändern: `src/render/wake.ts`, `tests/render/wake.test.ts`
- nicht ändern: wie T01

## Verhalten

1. `drawWake(ctx, cam, world, ship, opts)`: projiziert die Seitenpunkte (Iso-Projektion wie `ship.ts`, `cam`-Zoom), zeichnet je Seite 4 Striche in `PALETTE.foam` (Farbe mit `globalAlpha`/`rgba` aus `wakeAlpha`), Linienbreite `max(1, 1,5·zoom)`, `ctx.save/restore`, **kein `fill`**.
2. Zoomstufen: ≥ 0,5 V mit 8 Strichen (≤ 10 Zeichenaufrufe je Spur); 0,25 und 0,375 ein Mittelstrich (2 px, Deckkraft 0,35, 3 Kacheln); ≤ 0,125 kein Aufruf.
3. `wakeStyle(weather, reduce)` liefert `storm`/`reduce` aus dem Wetterzustand des Renderers (Quelle per `rg "storm" src/render/weather.ts` bestimmen; T03 reicht sie durch).

## Testfälle (Fake-Kontext `tests/render/fakeCtx.ts`)

- **W8** Zoom 1: genau 2 × 4 Striche, Farbe = `rgbaOfCss(PALETTE.foam)`, ≤ 10 Zeichenaufrufe, kein `fill`; Zoom 0,25 ein Strich; Zoom 0,125 kein Aufruf; Linienbreite ≥ 1 bei jedem Zoom.
- **W10** Spurfarbe ausschliesslich `PALETTE.foam`; Kontrast `foam` gegen Tiefwasser, beide durch `gradeAt(nacht, storm)` getönt: Messwert in den Test schreiben, Schwelle `min(Messwert, 2,2)` (P-6 des Index); Messwert < 2,2 → im Bericht nennen.
- **W11** Lauf: `git diff main -- src/sim src/render/shipLane.ts src/render/ship.ts` leer (Export ergänzen erlaubt).

## Prüfschritte / Task-Review (sonnet, `qa-code-reviewer`)

Gezielter Test (Exit 0), `tsc`, eslint/prettier. Reviewer: kein Schwarz/Weiss (S1), keine Füllung, Werte nur aus Konstanten.
