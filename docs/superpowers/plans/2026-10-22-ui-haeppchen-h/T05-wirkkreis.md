# T05 · P2 Wirkkreis bei Auswahl (I-146)

Umsetzer `tech-ui-engineer` · ≈ 45 Tools · AK H14 bis H21 · blocked-by: ORT-A gemergt (`git merge main` vor Start, Auswahl-Block in `renderer.ts` neu lesen) · Spec: Teil P2 (Regeln 1 bis 7)

## Dateien

- ändern: `src/render/overlays.ts`, `src/render/renderer.ts` (ein Aufruf im Auswahl-Block), `tests/render/overlays.test.ts`, `tests/render/renderer*.test.ts` (vorhandene Datei mit Auswahl-Tests per `rg "selectedId" tests/render` finden)
- nicht ändern: `src/sim/`, `src/ui/`, `src/render/` sonst; Ring- und Platzieren-Logik von Stadtplanung nicht umbauen

## Verhalten

1. **`selectionPlan(world, building): OverlayPlan | null`** neben `overlayPlan`: `null`, wenn `building.island !== HOME` oder das Gebäude weder `service.serviceRadius` noch `fireProtection.serviceRadius` hat (Marktplatz hat nur `supplyRadius` → `null`, F5). Sonst `{ circle: { cx, cy, radius }, coverage: null, highlight: [] }` mit Mitte `center(def, b.x, b.y)`, Radius `serviceRadiusOf(world, defId)`. **Form von `circle` aus `overlayPlan` übernehmen**; `rings: []` ergänzen, wenn `OverlayPlan.rings` in main steht (`rg "rings" src/render/overlays.ts`). Kein Aufruf von `placementZone`, `tilesInRadius`, `overlayCache`.
2. **`drawOverlayCircle(ctx, cam, circle)`** aus dem Kreis-Teil von `drawPlacementOverlay` ausgelöst (`CIRCLE_COLOR`, 1,5 px, Strich 6/4, `radiusEllipse`, Zoom); `drawPlacementOverlay` ruft ihn, Aufrufabfolge am Fake-Kontext bitgleich (H21).
3. **`drawSelectionCircle(ctx, cam, world, building)`** (in `overlays.ts`): `selectionPlan` → bei Treffer `drawOverlayCircle`, mit `save`/`restore`.
4. **`renderer.ts`:** im Auswahl-Block vor der gelben Umrandung genau ein Aufruf, nur wenn `hover.tool.kind !== 'build'` (Vorrang, H20); Reihenfolge: nach den Signalen, vor der Umrandung. Ausgewähltes Gebäude abgerissen/Auswahl leer → kein Aufruf.

## Testfälle (rot zuerst; Fake-Kontext `tests/render/fakeCtx.ts`)

- **H14** Kapelle, Schule, Feuerwache: Kreis, Mitte = `center(...)`, Radius = `serviceRadiusOf`, `coverage` `null`, `highlight` leer. **H15** Wohnhaus, Kontor, Holzfäller `null`; Marktplatz `null`; Bad Kreis (F5). **H16** Glockenrecht: Radius vor/nach dem Beschluss gleich `serviceRadiusOf` (Ratsbeschluss über die vorhandene Sim-Funktion, kein Literal-State). **H17** `island !== HOME` → `null`, kein Wurf. **H18** `serialize` vor/nach gleich; Spy/Zähler: `placementZone`, `tilesInRadius` ungerufen, `overlayCache`-Einträge gleich. **H19** `render` mit Auswahl Kapelle: genau ein `ellipse`-Aufruf in `CIRCLE_COLOR` mit Strich `[6, 4]` zusätzlich zur Umrandung; ohne Auswahl und bei Wohnhaus keiner. **H20** Auswahl plus Bau-Werkzeug: eine Ellipse (Werkzeug). **H21** `drawPlacementOverlay`-Aufrufabfolge unverändert (Bestandstests bleiben grün, nicht aufweichen).
- **H22** nur Lauf.

## Prüfschritte / Task-Review (opus, gilt als Final-Review des Strangs)

Gezielte Tests (Exit 0), `tsc`, eslint/prettier. Reviewer: `renderer.ts`-Diff höchstens ein Aufruf plus Import; `render` schreibt nie in die Welt; keine Ringlogik beschädigt; `git diff main -- src/sim` leer.
