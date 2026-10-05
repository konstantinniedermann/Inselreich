> **Task-ID:** T05 · **AK-IDs:** AK-E1-10, AK-E1-12 (Renderer-Teil), AK-E1-22
> **blocked-by:** T03, T04 (beide in `feat/m12-e1` gemerged) · **Strang:** render, `.worktrees/m12-e1` ·
> `tech-ui-engineer` (sonnet)
> **Regeln:** [index.md](index.md) Global Constraints, P-7 · Spec Anhang 02 D (Reihenfolge, Detailstufe, Culling)

## T05: Renderer zeichnet den Archipel — Inselkamera, Inselansicht, Detailstufe

**Ziel:** `render()` zeichnet Meer → Inseln nach Tiefe → je Insel wie heute → bildweite Durchgänge einmal. Ist nur die
Heimat im Bild, ist die Aufrufliste gleich heute. Ab Zoom ≤ 0,25 gilt die Detailstufe.

**Code-Fakten:** `renderer.ts` `render(ctx, world, cam, terrainLayer, hover, selectedId, view, fx)`: 1 Hintergrund
`fillRect` in `PALETTE.waterDeep` (= das Meer, eine Füllung je Frame); 2–7 je Welt: `updateTerrainLayer`, Boden
(`halfLayer` bei Zoom ≤ 0,5), `drawWaves`, `drawRoads`, `wildlifeAt`/`drawWaterLife`, Laufwege, Spaziergänger, Möwen,
`sortedObjects` (Gebäude, Bäume, Massiv), Rauch, Feuer; 8–12 bildweit (Sturm-Rand, Tönung, Licht, Regen, Signale).
Seit T03: `archipel.ts` (`visibleIslands`, `islandCam`, `ARCHIPEL_VIEW`); seit T04: `quarterLayer`, Meerkante.

**Dateien:** `src/render/renderer.ts`, `src/render/archipel.ts` (Inselansicht ergänzen), `src/ui/app.ts` (nur
Aufruf-Signatur, Heimatebene durchreichen); `tests/render/archipel.test.ts`, `renderer.test.ts`.

## Schnittstellen (Produces)

```ts
// archipel.ts — Inselansicht: Insel i als Welt mit einer Insel (nur lesend; Gebäude ab E2).
const views = new WeakMap<World, Map<number, World>>();
export function islandView(world: World, i: number): World {
  if (i === HOME) return world;
  let m = views.get(world);
  if (!m) views.set(world, (m = new Map()));
  let v = m.get(i);
  if (!v || v.islands[0] !== world.islands[i]) {
    v = Object.create(world, {
      islands: { value: [world.islands[i]!] },
      buildings: { value: {} },
      seed: { value: (world.seed ^ Math.imul(i, 0x9e3779b1)) >>> 0 }, // Bildvariante, kein Sim-Zug
    }) as World;
    m.set(i, v);
  }
  return v;
}
export const LOD_ZOOM = 0.25; // Detailstufe ab Zoom ≤ 0,25 (lead-art B5)
```

- `render(ctx, world, cam, layers: IslandLayers, hover, selectedId, view, fx)` mit
  `interface IslandLayers { get(i: number): HTMLCanvasElement | null }` — `get` darf im Notfall synchron rastern (T06);
  liefert er `null`, wird die Insel in diesem Frame ausgelassen. `fx.archipelView?: ArchipelView` (Standard
  `ARCHIPEL_VIEW`), `fx.activeIsland?: number` (Standard 0).
- Schritte 2–7 wandern unverändert in `drawIsland(ctx, v: World, ci: Camera, layer, view, fx, lod, acc)`; `acc`
  sammelt, was 8–12 brauchen (Feuer, Fensterlicht). `render` ruft `drawIsland` je `visibleIslands(…)` in Tiefenfolge
  mit `islandView(world, i)` und `islandCam(cam, world.islands[i])`. Heimat: `v === world`, `ci` zahlengleich `cam`.
- **Detailstufe** (`lod = cam.zoom ≤ LOD_ZOOM`): keine Laufwege, Spaziergänger, Möwen, Wasser-/Luftleben, Rauch,
  keine `drawWaves`; Boden aus `quarterLayer(layer)`. Bei 0,5 wie heute (`halfLayer`).
- `renderStats` erhält Zähler `islandsDrawn`, `wavesDrawn`, `walkersDrawn`, `wildDrawn`, `smokeDrawn` (je Frame genullt).

## Schritte

- [ ] **0 Pin vor dem Umbau:** in `renderer.test.ts` Helfer `callList(world, cam)` (fakeCtx, View 1920 × 1080,
      `fx.timeMs 5000`), Welt `deserialize(save-v7.json)` → v8; drei Kameras über der Heimatmitte (Zoom 0,5 / 1 / 2, Rand
      nicht im Bild). `fnv1a32(JSON.stringify(calls))` und Länge als `HOME_CALLS` pinnen (Werte aus dem Lauf, auf dem
      T05-Basisstand vor jeder Änderung an `renderer.ts`). Commit `test: M12 E1 Heimat-Aufrufliste gepinnt`.
- [ ] **1 Tests zuerst**, `describe('M12 E1 Renderer')`:
  - **AK-E1-10** `HOME_CALLS` nach dem Umbau gleich; Welt `w` mit A, B gegen `wHome` (gleiche Welt, `islands` nur
    Heimat): Kamera über der Heimat → Aufruflisten gleich (unsichtbare Insel erzeugt keinen Aufruf); Kamera über A →
    `renderStats.islandsDrawn === 1`, erster `drawImage` hat die Ebene von A als Quelle.
  - **AK-E1-12** `fx.archipelView 'jump'`, `activeIsland 0`, Zoom 0,125 Rahmenmitte → Aufrufliste gleich `wHome`.
  - **AK-E1-22** Welt mit Häusern (Fixture), Zoom 0,25 und 0,125: `walkersDrawn`, `wildDrawn`, `smokeDrawn`,
    `wavesDrawn` = 0, Boden-`drawImage` Quelle = `quarterLayer(layer)`; Zoom 0,5: Zähler > 0 wo heute > 0, Quelle
    `halfLayer`.
  - `islandView`: `islandView(w, 0) === w`; `islandView(w, 1).tick` folgt `w.tick`; zweimal gleich (Identität).
- [ ] **2 Rot-Beleg** `npx vitest run tests/render/renderer.test.ts tests/render/archipel.test.ts -t "M12 E1"` →
      Commit `test: M12 E1 Archipel zeichnen (rot)`.
- [ ] **3 Umsetzung:** zuerst reine Verschiebung 2–7 in `drawIsland` (Commit `refactor:`, `HOME_CALLS` grün), dann
      Inselschleife, Detailstufe, `IslandLayers`; `app.ts` übergibt vorerst `{ get: (i) => (i === 0 ? heimat : null) }`.
- [ ] **4 Prüfen:** `make check`, `CI=true make check` grün; `grep -n "world\.\(islands\|buildings\)\s*=" src/render`
      leer (nie schreiben). Commit `feat: M12 E1 Archipel im Renderer, Detailstufe`.

**Review-Fokus:** Verschiebung ohne Logikänderung (Diff des `refactor:`-Commits); `HOME_CALLS` unverändert; Inselansicht
nur lesend; Detailstufe vollständig; `'jump'` nur `src/render/`.
