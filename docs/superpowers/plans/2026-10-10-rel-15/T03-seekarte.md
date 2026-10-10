# T03 · Seekarte: Kontor-Marke, dpr, Listener, Zähler

Strang See · Worktree `.worktrees/rel-15-see` · Branch `fix/rel-15-see` · Umsetzer `tech-ui-engineer` (sonnet) · AK-Entwürfe C1–C4 (`ak-entwuerfe.md`) · blocked-by –

**Ziel:** Die Kontor-Marke liegt nicht mehr unter dem Hafen-Schiffspunkt, Marke, Punkt und Striche skalieren mit `devicePixelRatio`, das Inselmenü hält nach einem Neustart keine alte Welt mehr fest, der Zeittest zählt statt zu messen.

**Files (nur diese):**

- Modify: `src/render/seaMap.ts` (`MapUi` Z. 24–26; neue Konstanten nach `COLORS` Z. ~52; `drawSeaMap` Z. 179–257)
- Modify: `src/ui/hud.ts` (`bindIslandMenu` Z. 340–431)
- Test: `tests/render/seaMapDraw.test.ts` (Helfer `draw` Z. 17–23, Aufruf Z. 47, neuer Block am Dateiende)
- Test: `tests/render/seaMap.test.ts` (Test Z. 221–227 ersetzen)

**Interfaces:** Produces `export interface MapUi { hover: number | null; dpr: number }`, `export const DOT_R = 3`, `export const MARK = 4` (CSS-Pixel) in `src/render/seaMap.ts`. `drawSeaMap(ctx, world, l, cache, ui: MapUi)` behält die Signatur; einziger Produktiv-Aufrufer ist `hud.ts`.

**Befund zum Weltwechsel (Gate-Entscheid E2):** Laden und „Neue Insel“ laufen über `restart` (`app.ts` Z. 202–205); `dispose` leert `#hud`, `updateHud` bindet das Inselmenü mit dem neuen `state` neu. Layout und Cache einer alten Welt können also nicht in einem offenen Popover stehen. Echt ist: `bindIslandMenu` hängt zwei Listener an `document` (Z. 425–430) und meldet sie nie ab; jeder hält über `state` die alte Welt fest.

## Schritte

- [ ] **Schritt 1: Tests zuerst (rot)**

`tests/render/seaMapDraw.test.ts`: Import um `COLORS`, `DOT_R`, `MARK` aus `../../src/render/seaMap` ergänzen; im Helfer `draw` (Z. 21) und Z. 47 `{ hover }` bzw. `{ hover: null }` um `dpr: 1` ergänzen. Block am Dateiende:

```ts
describe('drawSeaMap Kontor-Marke und dpr (REL-15, UI-SEEKARTE-NACHZUG)', () => {
  type Box = { x0: number; y0: number; x1: number; y1: number };
  const box = (pts: readonly { x: number; y: number }[]): Box => ({
    x0: Math.min(...pts.map((p) => p.x)),
    y0: Math.min(...pts.map((p) => p.y)),
    x1: Math.max(...pts.map((p) => p.x)),
    y1: Math.max(...pts.map((p) => p.y)),
  });
  const disjoint = (a: Box, b: Box): boolean =>
    a.x1 <= b.x0 || b.x1 <= a.x0 || a.y1 <= b.y0 || b.y1 <= a.y0;
  for (const dpr of [1, 2])
    it(`dpr ${dpr}: Marke über dem Hafenpunkt, Grössen und Striche × dpr`, () => {
      const w = seaWorld();
      shipLiteral(w, { route, port: 0, to: null }); // Hafenschiff am Anker der Heimat
      const l = mapLayout(w, 360 * dpr, 240 * dpr, 12 * dpr);
      const { ctx, log } = fakeCtx();
      drawSeaMap(ctx, w, l, createSilhouetteCache(factory), { hover: 1, dpr });
      const h = w.islands[0]!;
      const a = tileToMap(l, h.ox + h.anchor.x + 0.5, h.oy + h.anchor.y + 0.5);
      const ev = (op: string, style: string) =>
        log.events.filter((e) => e.op === op && e.style === style);
      const dist = (b: Box) => Math.hypot((b.x0 + b.x1) / 2 - a.x, (b.y0 + b.y1) / 2 - a.y);
      const mark = ev('fillRect', COLORS.kontor)
        .map((e) => box(e.points))
        .sort((p, q) => dist(p) - dist(q))[0]!;
      const dots = ev('fill', COLORS.dot);
      expect(dots).toHaveLength(1);
      const dot = box(dots[0]!.points);
      expect(mark.x1 - mark.x0).toBeCloseTo(MARK * dpr, 6);
      expect(mark.y1 - mark.y0).toBeCloseTo(MARK * dpr, 6);
      expect(dot.x1 - dot.x0).toBeCloseTo(2 * DOT_R * dpr, 6);
      expect(disjoint(mark, dot), 'Marke vom Hafenpunkt verdeckt').toBe(true);
      expect(mark.y1, 'Marke über dem Anker').toBeLessThan(a.y);
      expect(ev('stroke', COLORS.dotEdge)[0]!.lineWidth).toBe(dpr);
      expect(ev('stroke', COLORS.hover)[0]!.lineWidth).toBe(2 * dpr);
      const lanes = ev('stroke', COLORS.lane);
      expect(lanes.length).toBeGreaterThan(0);
      for (const e of lanes) expect(e.lineWidth).toBe(dpr);
    });
});
```

`tests/render/seaMap.test.ts` Z. 221–227 ersetzen (Zähler statt Uhr; `FakeCtx` ist schon importiert):

```ts
it('Erstes Rastern: ein Lauf je Insel, ein fillRect je Landstreifen (Zähler statt Uhr)', () => {
  const w = createWorld(7);
  const logs: FakeCtx[] = [];
  const cache = createSilhouetteCache(fakeFactory(logs));
  w.islands.forEach((s) => cache.get(s, 0.1));
  expect(cache.rasterCount).toBe(w.islands.length);
  let runs = 0,
    land = 0;
  for (const s of w.islands)
    for (let y = 0; y < s.height; y++) {
      const isLand = (x: number) => s.tiles[y * s.width + x]!.terrain !== 'water';
      for (let x = 0; x < s.width; x++)
        if (isLand(x)) {
          land++;
          if (x === 0 || !isLand(x - 1)) runs++;
        }
    }
  const fills = logs.reduce((n, l) => n + l.events.filter((e) => e.op === 'fillRect').length, 0);
  expect(fills).toBe(runs);
  expect(fills).toBeLessThan(land);
});
```

Run: `npx vitest run tests/render/seaMapDraw.test.ts tests/render/seaMap.test.ts; echo EXIT=$?`
Expected: FAIL im neuen Block (Import `DOT_R`/`MARK` fehlt; Marke 4 × 4 auf dem Anker, Striche 1), der Zählertest grün (er ersetzt nur die Uhr), `EXIT=1`.

- [ ] **Schritt 2: `src/render/seaMap.ts`**

`MapUi` (Z. 24–26):

```ts
/** Darstellungszustand der Karte (nur UI); `dpr` = Gerätepixel je CSS-Pixel der Leinwand beim Öffnen. */
export interface MapUi {
  hover: number | null;
  dpr: number;
}
```

Nach `COLORS`:

```ts
/** Grössen in CSS-Pixeln, gezeichnet × dpr: Radius Schiffspunkt, Kantenlänge Kontor-Marke. */
export const DOT_R = 3;
export const MARK = 4;
/** Luft zwischen Marke und Hafenpunkt (CSS-Pixel). */
const MARK_GAP = 1;
```

In `drawSeaMap` am Anfang `const px = ui.dpr;`, dann:

- Fahrlinien: `ctx.lineWidth = px;`
- Kontor-Marke (Z. 221–227), Kommentar „über dem Anker, damit der Hafenpunkt sie nicht verdeckt“:

```ts
const s = MARK * px;
const lift = (DOT_R + MARK_GAP) * px + s / 2; // Mitte der Marke über dem Anker
for (const isl of world.islands) {
  if (isl.kontorId === null) continue;
  const m = tileToMap(l, isl.ox + isl.anchor.x + 0.5, isl.oy + isl.anchor.y + 0.5);
  ctx.fillRect(m.x - s / 2, m.y - lift - s / 2, s, s);
}
```

- Hover-Rahmen: `ctx.lineWidth = 2 * px;`
- Schiffspunkte: `ctx.lineWidth = px;` und `ctx.arc(m.x, m.y, DOT_R * px, 0, Math.PI * 2);`

Kopfkommentar von `drawSeaMap` um „Grössen × `ui.dpr`“ ergänzen.

- [ ] **Schritt 3: `src/ui/hud.ts` `bindIslandMenu`**

a) Modulweit neben `seaMapRedraw` (Z. 333):

```ts
/** Abmeldung der Dokument-Listener des Inselmenüs je Kopfzeile: ein Neustart bindet neu, der alte Satz fällt weg. */
const islandMenuAbort = new WeakMap<HTMLElement, AbortController>();
```

b) In `bindIslandMenu` nach der Guard-Zeile (Z. 346):

```ts
islandMenuAbort.get(header)?.abort();
const menuAbort = new AbortController();
islandMenuAbort.set(header, menuAbort);
```

und beide `document.addEventListener(...)` (Z. 425–430) bekommen als drittes Argument `{ signal: menuAbort.signal }`.

c) dpr der Leinwand merken und weitergeben: `let mapDpr = 1;` neben `let layout`; beim Öffnen (Z. 418–422) nach `const d = dpr();` `mapDpr = d;`; in `redraw` `drawSeaMap(ctx, state.world, layout, cache, { hover, dpr: mapDpr });`. Nicht `dpr()` live übergeben (Leinwand und Marke müssen dieselbe dpr nutzen; Entscheid E6).

- [ ] **Schritt 4: Grün bestätigen**

Run: `npx vitest run tests/render/seaMapDraw.test.ts tests/render/seaMap.test.ts tests/ui/seaMapView.test.ts tests/ui/hud.test.ts; echo EXIT=$?` → PASS, `EXIT=0`
Run: `grep -n "performance.now" tests/render/seaMap.test.ts; echo EXIT=$?` → keine Treffer, `EXIT=1`
Run: `grep -n "signal: menuAbort.signal" src/ui/hud.ts; echo EXIT=$?` → genau 2 Treffer, `EXIT=0`
Run: `npx tsc --noEmit; echo EXIT=$?` → `EXIT=0`
Run: `make lint; echo EXIT=$?` → `EXIT=0`

- [ ] **Schritt 5: Commits (zwei)**

```bash
git add src/render/seaMap.ts src/ui/hud.ts tests/render/seaMapDraw.test.ts
git commit -m "fix: Seekarte Kontor-Marke über dem Hafenpunkt, Grössen x dpr, Listener abmelden (UI-SEEKARTE-NACHZUG)"
git add tests/render/seaMap.test.ts
git commit -m "test: Silhouetten-Rastern per Zähler statt Uhr (UI-SEEKARTE-NACHZUG)"
```

## Abnahme für den Review

- `seaMap.ts` bleibt rein (nur `domRaster` mit DOM); keine Farbänderung; Reihenfolge der Ebenen unverändert (AK-S7-Test grün).
- `hud.ts`: der Listener-Satz eines alten Bindens wird beim neuen Binden abgebrochen; `mapDpr` statt Live-dpr.
- Der Beleg „kein Leck“ im Browser kommt in T07 (C7) über den Helfer aus T04.
