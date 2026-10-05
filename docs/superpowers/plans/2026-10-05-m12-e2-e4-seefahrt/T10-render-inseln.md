> **Task-ID:** T10 · **AK-IDs:** Vorbedingung AK-E2-11, AK-E4-13 (Gebäude auf Fremdinseln sichtbar); E1-Übergabe R-6
> **blocked-by:** T02, Merge-Punkt **M1** (E1 Final-Review OK) · **Strang:** render, `feat/m12-see-render`, Worktree
> `.worktrees/m12-see-render` · `tech-ui-engineer` (sonnet)
> **Regeln:** Index P-7; E1-Plan T05 (`islandView`, `islandCam`), Spec Anhang 02 (Render je Insel)

## T10: Render — Gebäude, Wege und Bau-Vorschau auf Fremdinseln

**Ziel:** Gebäude und Wege auf A und B erscheinen wie in der Heimat; die Bau-Vorschau, Zonen und Abdeckung zeichnen
auf der Insel unter dem Mauszeiger. Die Heimat bleibt Aufruf für Aufruf gleich.

**Code-Fakten (nach M1):** `render/archipel.ts` `islandView(world, i)` (für `i ≥ 1`: `Object.create(world)` mit
`islands: [isl]`, `buildings: {}`), `islandCam(cam, isl)`, `visibleIslands`, `pickArchipel → { island, x, y } | null`;
`renderer.ts` `render(ctx, world, cam, layers, hover, selectedId, view, fx)` zeichnet je sichtbarer Insel mit
`islandView`/`islandCam`; `hover` heute Heimat-Kachel; `overlays.ts` Zonen/Abdeckung (`placementZone`, `coverageMask`
mit `island`-Parameter aus E0); `tests/render/renderer.test.ts` `HOME_CALLS` (E1, Heimat-Aufrufliste);
`tests/render/fakeCtx.ts`.

**Dateien:** `src/render/archipel.ts`, `renderer.ts`, `overlays.ts` (nur Inselbezug), `sprites.ts`/`palette.ts` (nur
Palettenton `spicefarm`, D-144); `tests/render/archipel.test.ts`,
`renderer.test.ts`. Keine Datei in `src/sim/`, `src/ui/`.

## Regeln (verbindlich)

- **`islandView(world, i)` (P-7):** `i === 0` → `world` (Identität, unverändert). `i ≥ 1` → wie E1, aber `buildings`
  = Objekt der Gebäude mit `b.island === i` als flache Kopien `{ ...b, island: 0 }` (Ids gleich, Reihenfolge nach Id).
  Damit lesen alle Zeichner (`home(view)`, `islandOf(view, b)`) die richtige Insel. Nur lesend; die Welt wird nie
  verändert (`grep -n "world\.\(islands\|buildings\)\s*=" src/render` leer).
- **Hover mit Insel:** `hover` wird `{ island: number; x: number; y: number; … } | null` (bisherige Felder bleiben,
  `island` dazu). Vorschau-Rahmen, Wegvorschau, Zonen und Abdeckung zeichnen nur für `hover.island`, mit
  `islandCam` dieser Insel und `placementZone`/`coverageMask(…, hover.island)`. `island` fehlt → `0` (Heimat-Aufrufe
  gleich).
- **Auswahl:** `selectedId` eines Gebäudes auf `i ≥ 1` hebt es in der Ansicht von `i` hervor (Id in der Kopie gleich).
- **D-144 Regel (1) (R241):** `spicefarm` nutzt die Zuckerrohr-Form mit einem **eigenen Palettenton** (neuer
  `PALETTE`-Eintrag nach Stilrahmen §2); Test im Fake-Kontext: Füllfarben von `spicefarm` ≠ `sugarfarm`.
- Kontor-Zierschiff (`shipTile`) erscheint am `kontor2` wie am Heimatkontor (folgt aus `islandView`); keine weitere
  Änderung (Handelsschiffe: T11).
- Caches: Terrain-Cache je Insel bleibt unverändert (Wege liegen in `tiles`, Gebäude werden je Frame gezeichnet). Wenn
  ein Cache Gebäude- oder Wegestände der Heimat über `layoutKey` invalidiert, gilt das je Insel (`layoutKey` läuft seit
  E0 über alle Inseln).

## Schritte

- [ ] **1 Tests zuerst** (`describe('M12 E2 Render Fremdinseln')`):
  - `archipel.test.ts`: `islandView(w, 0) === w`; Welt mit `kontor2` und Holzfäller auf 2 (Literale wie
    `tests/sim/seaHelpers.ts`, dort importieren): `Object.keys(islandView(w, 2).buildings)` = Ids der Gebäude auf 2,
    jedes mit `island 0`, sonst feldgleich; `islandView(w, 1).buildings` leer; `w` danach `serialize`-gleich.
  - `renderer.test.ts`: (a) **Heimat gleich:** `HOME_CALLS` unverändert grün (Kamera ohne Fremdinseln im Bild, und
    mit Gebäuden auf 2 ausserhalb des Bildes); (b) Kamera auf 2 → im Fake-Kontext Aufrufe des Holzfäller-Sprites an
    der Bildposition `worldToScreen(islandCam(cam, isl2), x, y)`; (c) `hover { island: 2, x, y }` mit Bauwerkzeug →
    Vorschau-Rahmen an dieser Position, kein Rahmen in der Heimat; `hover` ohne `island` → wie vorher.
- [ ] **2 Rot-Beleg** → Commit `test: M12 E2 Render Gebäude auf Fremdinseln (rot)`.
- [ ] **3 Umsetzung** nach „Regeln"; UI-Aufrufer übergeben `island` erst in T13 (bis dahin Standard 0).
- [ ] **4 Prüfen:** `make check`, `CI=true make check`; `npm run` Messung nicht nötig (keine neue Zeichenlast in der
      Heimat). Commit `feat: M12 E2 Render Gebäude und Vorschau auf Fremdinseln`.

**Review-Fokus:** `islandView` nur lesend, Kopien ohne Mutation; Heimat-Aufrufliste gleich; Vorschau nur auf
`hover.island`; keine Logik aus `src/sim` dupliziert.
