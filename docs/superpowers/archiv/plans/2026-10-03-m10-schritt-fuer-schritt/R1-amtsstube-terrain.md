> **Task-ID:** Paket R1 (lead-art)
> **AK-IDs:** AK-R1-01 … -05 (siehe abdeckung.md)
> **blocked-by:** Task 4 (Amtsstube); Task 7 wartet auf R1
> **Gemeinsame Regeln:** [index.md](index.md) (Global Constraints) · Orga: [orga-06-schnittstellen.md](orga-06-schnittstellen.md) · [orga-07-datei-ownership.md](orga-07-datei-ownership.md)

## Paket R1 (lead-art): Amtsstube-Silhouette, Terrain-Teil-Neuzeichnung, Cache-Kommentare

**Controller** `lead-art` · **Arbeiter** `art-rendering-engineer` · **Worktree/Branch** `.worktrees/m10-render` ·
`feat/m10-render` (ab Task-4-SHA) · **blocked-by** Task 4 · **AK** AK-R1-01, -02, -04 (Vitest-Teil), -05; AK-R1-03
in QA-U2; AK-R1-04 Blindtest in QA-ART

**Interfaces (Produces):**

```ts
// src/render/terrain.ts
export function terrainCodes(world: Pick<World, 'width' | 'height' | 'tiles'>): Uint8Array; // Geländeart je Kachel
export function terrainPatchRect(
  prev: Uint8Array,
  next: Uint8Array,
  w: number,
  h: number,
): TileRect | null; // geänderte Kacheln + Glättungsrand, geklemmt
export const terrainStats: { lastPatchMs: number; patches: number[] }; // letzte 20 Werte von updateTerrainLayer().ms > 0
// updateTerrainLayer: Rechteck = Vereinigung aus dirtyRect(occupancy) und terrainPatchRect; bei Geländewechsel wird
// das Raster (buildGrid) nur in diesem Rechteck neu berechnet; kein Vollaufbau.
```

- [ ] **Schritt 1: Failing tests.**

```ts
// tests/render/terrain.test.ts
describe('M10 Terrain nach Geländewechsel (Spec 7)', () => {
  it('AK-R1-01 Gelände-Abbild unterscheidet sich genau in (x, y); Rechteck mit Glättungsrand, geklemmt; step allein patcht nicht', () => {
    const w = createWorld(3, { unlockAll: true });
    const k = w.buildings[w.kontorId]!;
    const x = k.x + 6,
      y = k.y + 2;
    forceRect(w, x, y, 1, 1, 'forest');
    const a = terrainCodes(w);
    const key = layoutKey(w);
    step(w);
    expect(shouldPatch({ world: w, key }, w, layoutKey(w))).toBe(false);
    expect(clearForest(w, x, y).ok).toBe(true);
    const b = terrainCodes(w);
    expect([...a.keys()].filter((i) => a[i] !== b[i])).toEqual([y * w.width + x]);
    const r = terrainPatchRect(a, b, w.width, w.height)!;
    expect(r.x0).toBeLessThanOrEqual(x - SMOOTH_BORDER);
    expect(r.x1).toBeGreaterThanOrEqual(x + SMOOTH_BORDER);
    expect(terrainPatchRect(b, b, w.width, w.height)).toBeNull();
    const edge = terrainPatchRect(
      new Uint8Array(w.width * w.height),
      (() => {
        const c = new Uint8Array(w.width * w.height);
        c[0] = 1;
        return c;
      })(),
      w.width,
      w.height,
    )!;
    expect([edge.x0, edge.y0]).toEqual([0, 0]);
  });
  it('AK-R1-05 Tier-Anker (Fische, Vögel) und Küstenfeld (water.ts und life.ts nutzen coastField) bleiben gleich', () => {
    const w = createWorld(3, { unlockAll: true });
    const k = w.buildings[w.kontorId]!;
    forceRect(w, k.x + 6, k.y + 2, 1, 1, 'forest');
    forceRect(w, k.x + 7, k.y + 2, 1, 1, 'grass');
    w.money = 1000;
    const snap = () => ({
      fish: fishAnchors(w),
      flock: flockAnchors(w, phaseAt(w.tick)),
      coast: coastField(w),
    });
    const before = snap();
    expect(clearForest(w, k.x + 6, k.y + 2).ok).toBe(true);
    expect(plantForest(w, k.x + 7, k.y + 2).ok).toBe(true);
    expect(snap()).toEqual(before);
  });
});
// tests/render/iso.test.ts
it('AK-R1-02 sortedObjects: nach clearForest kein Baum an (x, y); nach plantForest genau einer mit treeVariant', () => {
  const w = createWorld(3, { unlockAll: true });
  const k = w.buildings[w.kontorId]!;
  const x = k.x + 6;
  const y = k.y + 2;
  forceRect(w, x, y, 1, 1, 'forest');
  w.money = 1000;
  const trees = () => sortedObjects(w).filter((o) => o.kind === 'tree' && o.id === y * w.width + x);
  expect(trees()).toHaveLength(1);
  expect(clearForest(w, x, y).ok).toBe(true);
  expect(trees()).toHaveLength(0);
  expect(plantForest(w, x, y).ok).toBe(true);
  expect(trees()).toEqual([expect.objectContaining({ variant: treeVariant(w.seed, x, y) })]);
});
// tests/render/sprites.test.ts, im describe('R2: Silhouetten-Tabelle, …') (nutzt dessen Helfer mk, unknown, fallbackDefs)
it('AK-R1-04 Amtsstube zeichnet eine eigene Form, nicht den public-Rückfall', () => {
  const pub = fallbackDefs.find((d) => d.category === 'public')!;
  expect(drawLog(mk('townhall'))).not.toEqual(drawLog(unknown(pub)));
});
```

`SMOOTH_BORDER` ist die in `terrain.ts` exportierte Randbreite der Feld-Glättung (aus `terrainField.ts`
abgeleitet, nicht geraten). `drawLog(b)` ist der Zeichenaufruf des bestehenden Tests „AK-R2-03 unbekannte Id
zeichnet den Kategorie-Fallback" als lokaler Helfer (liefert `log` aus `fakeCtx`). **Vor der Umsetzung grün
erlaubt:** AK-R1-02 und AK-R1-05 (sie sichern ab, was F1 über `layoutKey` schon leistet bzw. was die Forst-Aktionen
nie berühren; Spec 7 Punkt 2 und 4). Der Fensteranker-Test (M7:AK-R2-03) prüft den Footprint der neuen Silhouette
ohne Lockerung (T-12).

- [ ] **Schritt 2:** rot. **Schritt 3:** Umsetzung (`terrain.ts` Gelände-Abbild im `meta`, Teil-Raster,
      `terrainStats`; `sprites.ts` Silhouette Amtsstube; Kommentare in `wildlife.ts` und `water.ts`: „gültig, solange
      Geländewechsel nur Wald ↔ Weide betreffen (Spec M10 7); andere Geländeänderungen müssen diesen Cache neu
      bewerten" — **nicht** in `life.ts` (R164 B5: H-R4 arbeitet parallel; den Kommentar in `life.ts` setzt Task 8);
      `iso.ts` nur falls AK-R1-02 nicht schon über `layoutKey` grün ist). **Schritt 4:** arc42 §10 eine Zeile
      „Teil-Neuzeichnung nach Forst-Aktion: `updateTerrainLayer().ms`, Grenze 100 ms, erwartet ≤ 15 ms"; `make check`;
      Commit `feat: M10-R1 Amtsstube-Silhouette, Terrain-Teil-Neuzeichnung nach Geländewechsel (Spec 7)`; push.
      **`docs/beobachtungen.md` ändert R1 nicht** (R164 B3, häufige Konfliktstelle): Die Erledigung der Beobachtung
      „Terrain-Cache hängt an `layoutKey`" steht im R1-Bericht; L0 trägt sie nach dem Gate Merge ein.
- Review: `qa-code-reviewer` (lead-art-Budget). SHA an den Controller (Merge vor Task 7). Vor dem Final-Review merged
  `lead-art` den aktuellen `main` in `feat/m10-render`, `make check`, push, neuer SHA an den Controller, der ihn in
  `feat/m10-ui` merged.

---
