> **Task-ID:** T06 · **AK-IDs:** AK-E1-11 (Verdrahtung), AK-E1-13 (Mausrad), AK-E1-17 (Mouse-over, Teil); Dev-Sonde
> für AK-E1-18/-19 · **blocked-by:** T05 · **Strang:** render, `.worktrees/m12-e1` · `tech-ui-engineer` (sonnet),
> danach `qa-playtester` (Browser-Check)
> **Regeln:** [index.md](index.md) Global Constraints, P-8, P-9 · Spec Anhang 02 D (Terrain-Cache, Picking,
> Mouse-over, Zoom)

## T06: Bedienung — Leerlauf-Rasterung, Zoom bis 0,125, Kamera über den Archipel, Inselkarte

**Ziel:** Das Spiel zeigt beim Start sofort die Heimat; A und B werden danach im Leerlauf gerastert; die Kamera zoomt
bis 0,125 und bleibt im Archipel-Rahmen + 8; über Land einer Fremdinsel zeigt der Mauszeiger die Inselkarte.

**Code-Fakten:** `src/ui/app.ts` baut `terrainLayer: buildTerrainLayer(world)` beim Start/Laden und ruft `render(…)`
im rAF; `src/ui/input.ts` `zoomAt`, `clampToMap(state.cam, map, …)`; `src/ui/hover.ts` `hoverInfo`; `src/ui/devProbes.ts`
`exposeDevProbe`, `createPerfProbe` (`__inselPerf`: Median/p95). Seit T03–T05: `cameraBounds`, `clampToRect`,
`pickArchipel`, `IslandLayers`, `createCachePlan`, `terrainJob`, `islandView`; Sim: `ISLANDS`, `TRAIT_LABELS`, `seaLanes`,
`travelTicks`, `TICK_MS`.

**Dateien:** `src/ui/app.ts`, `input.ts`, `hover.ts`, `devProbes.ts`, neu `src/ui/islandCard.ts`;
`tests/ui/islandCard.test.ts` (neu), `tests/ui/*` falls Signaturen brechen.

## Regeln (verbindlich)

- **Ebenen:** Heimat wie heute sofort (`buildTerrainLayer`). Nach dem **ersten** gezeichneten Frame:
  `createCachePlan(jobs, () => performance.now())` mit `terrainJob(islandView(world, i), scale)` für `i = 1, 2`; ein
  Slot je `requestIdleCallback` (sonst `setTimeout(0)`), neu planen, bis alle fertig. `IslandLayers.get(i)`: Heimat →
  Heimatebene; fertig → Ebene; sonst `plan.finish(i)` (Notfall, synchron) und Frame als Notfall-Frame markieren.
  Neues Spiel / Laden verwirft Plan und Ebenen.
- **Kamera:** überall, wo heute `clampToMap(…, map, …)` steht, `clampToRect(…, cameraBounds(world.islands), …)`;
  `zoomAt` mit denselben Grenzen. Start und „Kontor zentrieren" unverändert (Heimat, Zoom 1).
- **Inselkarte** (`islandCard.ts`, rein): `islandCard(world: World, i: number): string` →
  `"Möweninsel · 24 × 24 · Gewürz · Fahrzeit 0:27"`; Fahrzeit = `travelTicks(d(0, i)) · TICK_MS / 1000` Sekunden als
  `m:ss`; Merkmale über `TRAIT_LABELS`, mit `", "` verbunden. `hover.ts`: Auswahl-Werkzeug, Mauszeiger ausserhalb
  der Heimat → `pickArchipel`; Landkachel einer Fremdinsel → Karte mit diesem Text; Meer → nichts. Bauwerkzeuge
  ausserhalb der Heimat: kein Vorschau-Rahmen (Bauen erst E2).
- **Dev-Sonde** (nur `import.meta.env.DEV`): `DevProbe` + `setZoom(z)`, `focus(kind: 'home' | 'archipel')` (Heimatkontor
  bzw. Rahmenmitte in die Bildmitte), `cachesReady(): boolean`, `slices(): number[]` (`plan.sliceMs`),
  `emergency(): number[]`; `__inselPerf` + `frameMax` (grösster Frame-Abstand im Fenster) und `emergencyFrames`.

## Schritte

- [ ] **1 Tests zuerst** `tests/ui/islandCard.test.ts`, `describe('M12 E1 Inselkarte')`. `islandCard` setzt sich aus
      `formatIslandCard(def: IslandDef, width: number, height: number, d: number): string` zusammen (rein, ohne Welt):
      `formatIslandCard(ISLANDS[0], 24, 24, 27)` → `"Möweninsel · 24 × 24 · Gewürz · Fahrzeit 0:27"`;
      `formatIslandCard(ISLANDS[1], 36, 36, 38)` → `"Felsbucht · 36 × 36 · Gewürz, Gebirge · Fahrzeit 0:38"`; `d = 65` →
      `Fahrzeit 1:05`. Dazu `islandCard(createWorld(3), 1)` = `formatIslandCard(ISLANDS[0], …, seaLanes(…)[0→1].d)`.
      Rot-Beleg → Commit `test: M12 E1 Inselkarte (rot)`.
- [ ] **2 Umsetzung** nach „Regeln". `npx tsc --noEmit`, `make check` grün.
- [ ] **3 Selbstprobe im Browser** (`make dev`, Seed 3, 1280 × 800): Mausrad bis 0,125, beide Inseln sichtbar,
      Karte über A, Konsole ohne Fehler; `__inselDev.slices()` nach 10 s gefüllt. Commit
      `feat: M12 E1 Archipel bedienen: Leerlauf-Rasterung, Zoom, Inselkarte`.
- [ ] **4 Browser-Check** durch `qa-playtester` (Controller startet): 1280 × 800 und 1920 × 1080, Seed 3 „Alles frei",
      Tempo 1: Erstbild zeigt Heimat wie vorher; Zoom 0,125 → alle Inseln im Bild; Rand-Klemmung (Schwenk an den Rand);
      Mouse-over A und B; Laden eines v7-Autosaves (von `main`, gleiche Origin) → Inseln da; Screenshots
      `.studio/qa/M12-E1/T06/`.

**Review-Fokus:** Erstbild unverändert (nur Heimat sofort); kein Rastern im rAF ausser Notfall; Dev-Sonde nur DEV;
`islandCard` rein; keine Spielwerte in `src/ui/`.
