import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { centerOn, visibleTileRange, type Camera, type TileRange } from '../../src/render/camera';
import type { Phase, WeatherKind } from '../../src/render/daynight';
import {
  CORMORANT_COLOR,
  CRAB_COLOR,
  EAGLE_COLOR,
  EAGLE_HEAD,
  EAGLE_HN,
  IBEX_COLOR,
  IBEX_HORN,
  IBEX_MIN_TILES,
  IBEX_SIGHT,
  IBEX_SLOPE,
  SEAL_COLOR,
  TURTLE_COLOR,
  TURTLE_TRAIL,
  drawEagle,
  drawFallSparks,
  drawIbex,
  fallSparks,
  massifHeightAt,
  sightFree,
  ANTLER_COLOR,
  DEER_BELLY,
  FOREST_BIRD_COLOR,
  HARE_TAIL,
  GROUND_GAP,
  SEAL_BELLY,
  TURTLE_RIM,
  faunaAnchors,
  foxTileFree,
  DEER_COLOR,
  FIREFLY_COLOR,
  FOX_BELLY,
  FOX_COLOR,
  FOX_TIP,
  FOX_RUN_MS,
  FAUNA_LOT_SHARE,
  HARE_BELLY,
  HARE_COLOR,
  HARE_GAP,
  drawButterflies,
  drawFireflies,
  drawForestBirds,
  drawGroundFauna,
  faunaAt,
  fallGlitter,
  faunaCatalog,
  faunaLot,
  type FaunaEnv,
  type FaunaHit,
} from '../../src/render/fauna';
import { SUB, massifData, massifFeatures, type MassifData } from '../../src/render/massif';
import { seaContext, seaPlan } from '../../src/render/decor';
import { fieldWorld } from '../../src/render/terrainField';
import { dolphinsAt } from '../../src/render/wildlife';
import { FLOWER_PALETTES, flowerPalette } from '../../src/render/groundDecor';
import { LOD_ZOOM } from '../../src/render/archipel';
import { CAPS, cap } from '../../src/render/limits';
import { PALETTE, SIGNAL_NAMES, rgbOfCss } from '../../src/render/palette';
import { render, renderStats, type RenderFx } from '../../src/render/renderer';
import { TREE_H, resetTreeCache, setCanvasFactory } from '../../src/render/trees';
import { shipTile } from '../../src/render/ship';
import { deserialize, serialize } from '../../src/sim/save';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { center, createWorld, home } from '../../src/sim/world';
import type { World } from '../../src/sim/types';
import { deltaE2000, rgbToLab } from './deltaE';
import { fakeCtx, type Ev } from './fakeCtx';

// Bodentiere im Renderer: ein Test legt über `inject` eigene Treffer in `faunaAt`, damit die Mischung nach Tiefe prüfbar ist.
const h = vi.hoisted(() => ({
  calls: [] as { kind: string; key?: number; n?: number }[],
  inject: [] as unknown[],
}));
vi.mock('../../src/render/fauna', async (orig) => {
  const m = await orig<typeof import('../../src/render/fauna')>();
  return {
    ...m,
    faunaAt: (...a: Parameters<typeof m.faunaAt>) =>
      [...m.faunaAt(...a), ...(h.inject as FaunaHit[])].sort((x, y) => x.key - y.key),
    drawFallSparks: (...a: Parameters<typeof m.drawFallSparks>) => {
      h.calls.push({ kind: 'sparks', n: a[2].length });
      return m.drawFallSparks(...a);
    },
    drawGroundFauna: (...a: Parameters<typeof m.drawGroundFauna>) => {
      h.calls.push({ kind: 'fauna', key: a[2].key });
      return m.drawGroundFauna(...a);
    },
  };
});
vi.mock('../../src/render/ship', async (orig) => {
  const m = await orig<typeof import('../../src/render/ship')>();
  return {
    ...m,
    drawShip: (...a: Parameters<typeof m.drawShip>) => {
      h.calls.push({ kind: 'ship' });
      return m.drawShip(...a);
    },
  };
});
vi.mock('../../src/render/terrain', async (orig) => {
  const m = await orig<typeof import('../../src/render/terrain')>();
  return {
    ...m,
    terrainScale: () => 1,
    updateTerrainLayer: () => ({ redrawn: false, ms: 0 }),
    halfLayer: (l: HTMLCanvasElement) => l,
    quarterLayer: (l: HTMLCanvasElement) => l,
  };
});

const FULL: TileRange = { x0: 0, y0: 0, x1: 255, y1: 255 };
const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8];
const VIEW = { w: 1280, h: 720 };
const layer = { width: 64 * 32, height: 64 * 32 } as unknown as HTMLCanvasElement;
const PHASES: Phase[] = ['morning', 'day', 'evening', 'night'];
const WEATHERS: WeatherKind[] = ['clear', 'cloudy', 'rain', 'storm'];
const CAP_OF = {
  butterfly: 'butterflies',
  hare: 'hares',
  firefly: 'fireflies',
  deer: 'deer',
  fox: 'fox',
  forestBird: 'forestBirds',
  ibex: 'ibex',
  eagle: 'eagle',
  crab: 'crabs',
  turtle: 'turtle',
  seal: 'seals',
  cormorant: 'cormorants',
} as const;
const SIGNALS = SIGNAL_NAMES.map((n) => PALETTE[n]);

beforeAll(() => {
  setCanvasFactory(() => {
    const { ctx } = fakeCtx();
    return { width: 0, height: 0, getContext: () => ctx } as unknown as HTMLCanvasElement;
  });
  resetTreeCache();
});

const worlds = new Map<number, World>();
const worldOf = (seed: number): World => {
  let w = worlds.get(seed);
  if (!w) worlds.set(seed, (w = createWorld(seed)));
  return w;
};
const idsAt = (world: World, env: FaunaEnv, step = 1300): Set<string> => {
  const ids = new Set<string>();
  for (let t = 0; t < 70000; t += step) for (const x of faunaAt(world, FULL, t, env)) ids.add(x.id);
  return ids;
};
const cheb = (ax: number, ay: number, bx: number, by: number): number =>
  Math.max(Math.abs(ax - bx), Math.abs(ay - by));
const builtTiles = (world: World): { x: number; y: number }[] => {
  const isl = home(world);
  const out: { x: number; y: number }[] = [];
  for (let y = 0; y < isl.height; y++)
    for (let x = 0; x < isl.width; x++) {
      const t = isl.tiles[y * isl.width + x]!;
      if (t.road || t.buildingId !== null) out.push({ x, y });
    }
  return out;
};

describe('Fauna T1: Obergrenzen', () => {
  it('Obergrenzen `CAPS` normal und reduziert eingehalten', () => {
    let seen = 0;
    for (const seed of SEEDS) {
      const world = worldOf(seed);
      for (const reduce of [false, true])
        for (const phase of PHASES)
          for (let t = 0; t < 60000; t += 1700) {
            const hits = faunaAt(world, FULL, t, { phase, weather: 'clear', reduce });
            for (const [id, key] of Object.entries(CAP_OF)) {
              const n = hits.filter((x) => x.id === id).length;
              seen += n;
              expect(n, `${id} seed ${seed}`).toBeLessThanOrEqual(CAPS[key][reduce ? 1 : 0]);
            }
          }
    }
    expect(seen).toBeGreaterThan(0);
  });

  it('die 13 Fauna-Schlüssel stehen in CAPS wie in der Spec (Summe 69 normal, höchstens 9 reduziert)', () => {
    const keys = [
      ['butterflies', 12, 0],
      ['hares', 4, 1],
      ['fireflies', 24, 0],
      ['deer', 2, 1],
      ['fox', 1, 0],
      ['forestBirds', 6, 2],
      ['ibex', 3, 1],
      ['eagle', 1, 1],
      ['crabs', 6, 0],
      ['turtle', 1, 0],
      ['seals', 3, 1],
      ['cormorants', 3, 1],
      ['dolphins', 3, 0],
    ] as const;
    for (const [k, n, r] of keys) expect(CAPS[k]).toEqual([n, r]);
    expect(keys.reduce((s, k) => s + k[1], 0)).toBe(69);
    expect(keys.reduce((s, k) => s + k[2], 0)).toBeLessThanOrEqual(9);
  });

  it('Kappe je Welt: die Menge hängt nicht vom Bereich ab, ein kleiner Bereich liefert eine Teilmenge', () => {
    let compared = 0;
    for (const seed of SEEDS) {
      const world = worldOf(seed);
      const env: FaunaEnv = { phase: 'day', weather: 'clear' };
      const all = faunaAt(world, FULL, 5000, env);
      const key = (x: FaunaHit) => `${x.id}@${x.x},${x.y}`;
      const full = new Set(all.map(key));
      for (const x of all) {
        const small: TileRange = { x0: x.tx - 1, y0: x.ty - 1, x1: x.tx + 1, y1: x.ty + 1 };
        const got = faunaAt(world, small, 5000, env);
        expect(got.map(key)).toContain(key(x));
        for (const g of got) expect(full.has(key(g))).toBe(true);
        compared++;
      }
    }
    expect(compared).toBeGreaterThan(0);
  });
});

describe('Fauna T1: Posen und Orte', () => {
  it('Posen deterministisch aus timeMs und Seed (zwei Aufrufe gleich), kein Math.random, Welt unverändert, anderer Seed anderes Bild', () => {
    const world = worldOf(3);
    const before = JSON.stringify(world);
    const rnd = vi.spyOn(Math, 'random');
    for (const phase of PHASES) {
      const a = faunaAt(world, FULL, 12345, { phase });
      const b = faunaAt(world, FULL, 12345, { phase });
      expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    }
    expect(rnd).not.toHaveBeenCalled();
    rnd.mockRestore();
    expect(JSON.stringify(world)).toBe(before);
    const day = (w: World) => JSON.stringify(faunaAt(w, FULL, 12345, { phase: 'day' }));
    expect(day(worldOf(4))).not.toBe(day(world));
    expect(JSON.stringify(faunaAt(world, FULL, 12345, { phase: 'day' }))).not.toBe(
      JSON.stringify(faunaAt(world, FULL, 12345 + 777, { phase: 'day' })),
    );
  });

  it('Tageszeit: Rehe nur morgens und abends, Glühwürmchen nur nachts, Schmetterlinge weder nachts noch abends', () => {
    const by = new Map<Phase, Set<string>>();
    for (const phase of PHASES) {
      const s = new Set<string>();
      for (const seed of SEEDS) for (const id of idsAt(worldOf(seed), { phase }, 2100)) s.add(id);
      by.set(phase, s);
    }
    for (const phase of PHASES) {
      const s = by.get(phase)!;
      expect(s.has('deer'), `Reh ${phase}`).toBe(phase === 'morning' || phase === 'evening');
      expect(s.has('firefly'), `Glühwürmchen ${phase}`).toBe(phase === 'night');
      expect(s.has('butterfly'), `Schmetterling ${phase}`).toBe(
        phase === 'morning' || phase === 'day',
      );
      if (phase === 'night')
        for (const id of ['hare', 'fox', 'forestBird'])
          expect(s.has(id), `${id} nachts`).toBe(false);
    }
    // jede Art kommt in ihrer Zeit auch vor
    expect(by.get('morning')!.has('deer') || by.get('evening')!.has('deer')).toBe(true);
    expect(by.get('day')!.has('hare')).toBe(true);
    expect(by.get('day')!.has('fox')).toBe(true);
    expect(by.get('day')!.has('forestBird')).toBe(true);
  });

  it('Wetter: Schmetterlinge nur clear/cloudy, Glühwürmchen nicht bei rain/storm, Waldvögel nicht bei rain/storm', () => {
    for (const weather of WEATHERS) {
      const fair = weather === 'clear' || weather === 'cloudy';
      const day = new Set<string>();
      const night = new Set<string>();
      for (const seed of SEEDS) {
        for (const id of idsAt(worldOf(seed), { phase: 'day', weather }, 2100)) day.add(id);
        for (const id of idsAt(worldOf(seed), { phase: 'night', weather }, 2100)) night.add(id);
      }
      expect(day.has('butterfly'), `Schmetterling ${weather}`).toBe(fair);
      expect(day.has('forestBird'), `Waldvogel ${weather}`).toBe(fair);
      expect(night.has('firefly'), `Glühwürmchen ${weather}`).toBe(fair);
      expect(day.has('hare'), `Hase ${weather}`).toBe(true);
    }
  });

  it('Zoom: unter dem Mindestzoom der Art keine Tiere (Adler ab 0,5; Reh, Vögel, Glühwürmchen, Robben ab 0,75; Falter, Hase, Fuchs, Steinbock, Schildkröte, Kormoran ab 1; Krabbe ab 1,5)', () => {
    for (const seed of SEEDS) {
      const world = worldOf(seed);
      for (const phase of PHASES) {
        const at = (zoom: number) => idsAt(world, { phase, zoom }, 3100);
        for (const id of at(0.5)) expect(['eagle'], `${id} bei Zoom 0,5`).toContain(id);
        for (const id of at(0.75))
          expect(['eagle', 'deer', 'forestBird', 'firefly', 'seal']).toContain(id);
        for (const id of at(1)) expect(id).not.toBe('crab'); // Krabben erst ab 1,5
      }
    }
  });

  it('Hasen nie näher als 3 Kacheln (Chebyshev) an Weg oder Gebäude, Ruheplatz und Hoppelweg eingeschlossen', () => {
    let hares = 0;
    for (const seed of SEEDS) {
      const world = worldOf(seed);
      const built = builtTiles(world);
      for (let t = 0; t < 90000; t += 650)
        for (const x of faunaAt(world, FULL, t, { phase: 'day' }))
          if (x.id === 'hare') {
            hares++;
            for (const b of built)
              expect(cheb(x.tx, x.ty, b.x, b.y), `seed ${seed} t ${t}`).toBeGreaterThanOrEqual(
                HARE_GAP,
              );
          }
    }
    expect(hares).toBeGreaterThan(0);
  });

  it('Hasen weichen einem neuen Weg neben dem Anker; nach dem Abriss kommen sie zurück', () => {
    let tested = 0;
    for (const seed of [1, 2, 3, 5, 7, 9, 11]) {
      const world = createWorld(seed);
      const env: FaunaEnv = { phase: 'day' };
      const t0 = 4000;
      const hares = faunaAt(world, FULL, t0, env).filter((x) => x.id === 'hare');
      if (hares.length === 0) continue;
      const target = hares[0]!;
      const isl = home(world);
      const tile = isl.tiles[target.ty * isl.width + target.tx + 1]!;
      expect(tile.road).toBe(false);
      tile.road = true; // Weg neben dem Hasen (Test legt ihn direkt an)
      const after = faunaAt(world, FULL, t0, env).filter((x) => x.id === 'hare');
      expect(after.length).toBeLessThan(hares.length); // der Hase am Weg und alle, die dadurch näher als 3 Kacheln stehen
      expect(after.find((x) => x.x === target.x && x.y === target.y)).toBeUndefined();
      for (const x of after) {
        expect(cheb(x.tx, x.ty, target.tx + 1, target.ty)).toBeGreaterThanOrEqual(HARE_GAP);
        for (const b of builtTiles(world))
          expect(cheb(x.tx, x.ty, b.x, b.y)).toBeGreaterThanOrEqual(HARE_GAP);
      }
      tile.road = false;
      expect(faunaAt(world, FULL, t0, env).filter((x) => x.id === 'hare').length).toBe(
        hares.length,
      );
      tested++;
    }
    expect(tested).toBeGreaterThan(0);
  });

  it('Orte: Falter über Gras, Hasen und Rehe auf Gras, Waldvögel über Wald, Fuchs im Wald; Glühwürmchen driften nie weit', () => {
    const terr = (world: World, x: number, y: number) =>
      home(world).tiles[y * home(world).width + x]?.terrain;
    const seen = new Set<string>();
    for (const seed of SEEDS) {
      const world = worldOf(seed);
      for (const phase of PHASES)
        for (let t = 0; t < 40000; t += 900)
          for (const x of faunaAt(world, FULL, t, { phase })) {
            seen.add(x.id);
            if (x.id === 'firefly' || x.id === 'butterfly') {
              // schweben höchstens 0,7 Kacheln neben ihrer Graskachel
              let grass = false;
              for (let dy = -1; dy <= 1; dy++)
                for (let dx = -1; dx <= 1; dx++)
                  grass ||= terr(world, x.tx + dx, x.ty + dy) === 'grass';
              expect(grass).toBe(true);
            }
            if (x.id === 'hare') expect(['grass', 'forest']).toContain(terr(world, x.tx, x.ty));
            if (x.id === 'forestBird') expect(x.z).toBeGreaterThan(0);
            expect(x.key).toBe(2 * x.tx + 2 * x.ty + 2);
            expect(x.alpha).toBeGreaterThan(0);
            expect(x.alpha).toBeLessThanOrEqual(1);
          }
    }
    for (const id of ['butterfly', 'hare', 'firefly', 'fox', 'forestBird'])
      expect(seen.has(id)).toBe(true);
  });

  it('Fuchs und Waldvögel sind Episoden: meist unsichtbar, sichtbar höchstens FOX_RUN_MS je Zyklus', () => {
    let visible = 0,
      total = 0;
    for (const seed of SEEDS)
      for (let t = 0; t < 120000; t += 100) {
        total++;
        if (faunaAt(worldOf(seed), FULL, t, { phase: 'day' }).some((x) => x.id === 'fox'))
          visible++;
      }
    expect(visible).toBeGreaterThan(0);
    expect(visible / total).toBeLessThan((FOX_RUN_MS / 24000) * 1.2);
  });

  it('Glühwürmchen pulsieren weich: Deckkraft nie unter 0,3 (nie hartes Aus), nie über 1, und sie ändert sich im Lauf der Zeit', () => {
    let min = 1,
      max = 0;
    for (const seed of SEEDS)
      for (let t = 0; t < 12000; t += 50)
        for (const x of faunaAt(worldOf(seed), FULL, t, { phase: 'night' }))
          if (x.id === 'firefly') {
            min = Math.min(min, x.alpha);
            max = Math.max(max, x.alpha);
          }
    expect(min).toBeGreaterThanOrEqual(0.3 - 1e-9);
    expect(max).toBeLessThanOrEqual(1);
    expect(max - min).toBeGreaterThan(0.5);
  });
});

describe('Fauna T1: Katalog und Los', () => {
  it('faunaCatalog: eine Zeile je Art (14), Glitzern als Zeile mit rarity E und eligible false, present nur bei eligible', () => {
    for (const seed of SEEDS) {
      const rows = faunaCatalog(worldOf(seed));
      expect(rows).toHaveLength(14);
      expect(new Set(rows.map((r) => r.id)).size).toBe(14);
      for (const r of rows) {
        expect(['G', 'S', 'E']).toContain(r.rarity);
        if (r.present) expect(r.eligible).toBe(true);
      }
      // C7 Glitzern: Zeile ohne Treffer in `faunaAt` (L6 liefert den Wasserfall noch nicht in diese Branch), Seltenheit E
      const fall = rows.find((x) => x.id === 'fall')!;
      expect(fall.rarity).toBe('E');
      expect(fall.eligible).toBe(false);
      expect(fall.present).toBe(false);
      const s = rows.filter((r) => r.rarity === 'S').map((r) => r.id);
      expect(s.sort()).toEqual(['cormorant', 'deer', 'dolphin', 'fox', 'seal', 'turtle']);
    }
    expect(faunaCatalog(worldOf(1)).filter((r) => r.present).length).toBeGreaterThan(2);
  });

  it('faunaLot: G-Arten immer, S-Arten deterministisch mit Anteil ≈ FAUNA_LOT_SHARE', () => {
    for (const seed of SEEDS) {
      expect(faunaLot(seed, 'hare')).toBe(true);
      expect(faunaLot(seed, 'butterfly')).toBe(true);
      expect(faunaLot(seed, 'deer')).toBe(faunaLot(seed, 'deer'));
    }
    let n = 0;
    for (let seed = 1; seed <= 400; seed++) if (faunaLot(seed, 'fox')) n++;
    expect(n / 400).toBeGreaterThan(FAUNA_LOT_SHARE - 0.1);
    expect(n / 400).toBeLessThan(FAUNA_LOT_SHARE + 0.1);
    // present folgt dem Los
    for (const seed of SEEDS) {
      const fox = faunaCatalog(worldOf(seed)).find((r) => r.id === 'fox')!;
      if (!faunaLot(seed, 'fox')) expect(fox.present).toBe(false);
    }
  });
});

describe('Fauna T1: Zeichner (Fake-Kontext)', () => {
  const cam: Camera = { x: 0, y: 0, zoom: 1 };
  const mk = (
    id: FaunaHit['id'],
    layer: FaunaHit['layer'],
    extra: Partial<FaunaHit> = {},
  ): FaunaHit => ({
    id,
    layer,
    x: 10.5,
    y: 10.5,
    z: 0,
    tx: 10,
    ty: 10,
    key: 22,
    alpha: 1,
    flip: 1,
    state: 0,
    phase: 0.5,
    variant: 0,
    ...extra,
  });
  /** Alle Farben der Füll- und Strichereignisse. */
  const colorsOf = (events: Ev[], op: 'fill' | 'stroke'): string[] => [
    ...new Set(events.filter((e) => e.op === op).map((e) => e.style)),
  ];
  const rgb = (css: string): [number, number, number] => rgbOfCss(css);
  const luma = (c: [number, number, number]): number =>
    (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255;
  const draws: [string, (ctx: CanvasRenderingContext2D, c: Camera, seed: number) => void][] = [
    ['Hase sitzt', (ctx, c) => drawGroundFauna(ctx, c, mk('hare', 'ground', { state: 0 }))],
    [
      'Hase knabbert',
      (ctx, c) => drawGroundFauna(ctx, c, mk('hare', 'ground', { state: 1, phase: 0.3 })),
    ],
    [
      'Hase hoppelt',
      (ctx, c) => drawGroundFauna(ctx, c, mk('hare', 'ground', { state: 2, z: 5, flip: -1 })),
    ],
    ['Reh', (ctx, c) => drawGroundFauna(ctx, c, mk('deer', 'ground', { phase: 1 }))],
    [
      'Hirsch',
      (ctx, c) => drawGroundFauna(ctx, c, mk('deer', 'ground', { variant: 1, state: 1, phase: 0 })),
    ],
    ['Fuchs', (ctx, c) => drawGroundFauna(ctx, c, mk('fox', 'ground', { flip: -1, alpha: 0.5 }))],
    [
      'Schmetterlinge',
      (ctx, c, seed) =>
        drawButterflies(
          ctx,
          c,
          [0, 1, 2].map((s) => mk('butterfly', 'air', { state: s, z: 12, x: 10 + s })),
          seed,
        ),
    ],
    [
      'Waldvögel',
      (ctx, c) =>
        drawForestBirds(ctx, c, [
          mk('forestBird', 'air', { z: 40, alpha: 0.5, phase: 0.4 }),
          mk('forestBird', 'air', { z: 44, alpha: 1, phase: -0.4 }),
        ]),
    ],
    [
      'Glühwürmchen',
      (ctx, c) =>
        drawFireflies(ctx, c, [
          mk('firefly', 'glow', { z: 10, alpha: 0.3 }),
          mk('firefly', 'glow', { z: 12, alpha: 1 }),
        ]),
    ],
  ];

  it('jede Farbe ΔE2000 ≥ 20 zu allen signal*-Farben; keine Linie in Schwarz oder reinem Weiss', () => {
    // alle vier Blütenpaletten abdecken (Falterfarben kommen aus `flowerTonesFor`)
    const pal = new Map<number, number>();
    for (let s = 1; pal.size < 4 && s < 400; s++)
      if (!pal.has(flowerPalette(s))) pal.set(flowerPalette(s), s);
    expect(pal.size).toBe(4);
    const seedOf = [...pal.values()];
    expect(FLOWER_PALETTES).toHaveLength(4);
    for (const seed of seedOf)
      for (const [name, run] of draws) {
        const { ctx, log } = fakeCtx();
        run(ctx, cam, seed);
        expect(log.events.length, name).toBeGreaterThan(0);
        for (const op of ['fill', 'stroke'] as const)
          for (const style of colorsOf(log.events, op)) {
            const c = rgb(style);
            for (const sig of SIGNALS)
              expect(
                deltaE2000(rgbToLab(c), rgbToLab(rgb(sig))),
                `${name} ${op} ${style} zu ${sig}`,
              ).toBeGreaterThanOrEqual(20);
            if (op === 'stroke') {
              expect(luma(c), `${name} Linie ${style} nahe Schwarz`).toBeGreaterThanOrEqual(0.08);
              expect(
                c.every((v) => v >= 250),
                `${name} Linie ${style} reines Weiss`,
              ).toBe(false);
            }
          }
      }
  });

  it('die Tierfarben der Module bleiben unter den Grenzen (Konstanten)', () => {
    for (const col of [
      HARE_COLOR,
      HARE_BELLY,
      DEER_COLOR,
      DEER_BELLY,
      ANTLER_COLOR,
      FOX_COLOR,
      FOX_BELLY,
      FOX_TIP,
      FIREFLY_COLOR,
      HARE_TAIL,
      FOREST_BIRD_COLOR,
    ])
      for (const sig of SIGNALS)
        expect(
          deltaE2000(rgbToLab(rgb(col)), rgbToLab(rgb(sig))),
          `${col} zu ${sig}`,
        ).toBeGreaterThanOrEqual(20);
    // Körper in zwei Tönen: Unterseite dunkler als der Körper
    expect(luma(rgb(HARE_BELLY))).toBeLessThan(luma(rgb(HARE_COLOR)));
    expect(luma(rgb(DEER_BELLY))).toBeGreaterThan(luma(rgb(DEER_COLOR))); // Reh: Bauch heller (Bild-Fix R1)
    expect(luma(rgb(FOX_BELLY))).toBeLessThan(luma(rgb(FOX_COLOR)));
  });

  it('save und restore ausgeglichen, Matrix danach wie vorher, kein Zeichner schreibt unter einer Bodenmatrix (keine transform-Ereignisse)', () => {
    for (const [name, run] of draws) {
      const { ctx, log } = fakeCtx();
      run(ctx, cam, 1);
      expect(log.saves, name).toBe(log.restores);
      expect(log.underflow, name).toBe(0);
      expect(log.matrix, name).toEqual([1, 0, 0, 1, 0, 0]);
      expect(
        log.events.filter((e) => e.op === 'transform'),
        name,
      ).toHaveLength(0);
    }
  });

  it('Glühwürmchen und Schmetterlinge sind gebündelt: wenige Füllungen unabhängig von der Anzahl', () => {
    const { ctx, log } = fakeCtx();
    drawFireflies(
      ctx,
      cam,
      Array.from({ length: 24 }, (_, i) =>
        mk('firefly', 'glow', { x: 8 + i * 0.3, alpha: 0.3 + (i % 8) * 0.1 }),
      ),
    );
    expect(log.events.filter((e) => e.op === 'fill').length).toBeLessThanOrEqual(8);
    const b = fakeCtx();
    drawButterflies(
      b.ctx,
      cam,
      Array.from({ length: 12 }, (_, i) => mk('butterfly', 'air', { state: i % 3, x: 8 + i })),
      1,
    );
    expect(b.log.events.filter((e) => e.op === 'fill').length).toBeLessThanOrEqual(3);
    expect(b.log.events.filter((e) => e.op === 'stroke').length).toBe(1);
  });
});

describe('Fauna T1: Renderer', () => {
  const kontorCam = (world: World, zoom: number): Camera => {
    const k = world.buildings[home(world).kontorId]!;
    const c = center(BUILDING_DEFS.kontor, k.x, k.y);
    const cam = { x: 0, y: 0, zoom };
    centerOn(cam, c.cx, c.cy, VIEW, { w: home(world).width, h: home(world).height });
    return cam;
  };
  function frame(world: World, zoom: number, fx: Partial<RenderFx> = {}) {
    const { ctx, log } = fakeCtx();
    h.calls.length = 0;
    render(ctx, world, kontorCam(world, zoom), layer, null, null, VIEW, { timeMs: 1000, ...fx });
    return log;
  }

  it('bei Zoom ≤ LOD_ZOOM keine Fauna, bei Zoom 1 am Tag Tiere im Bild', () => {
    let drawn = 0;
    for (const seed of SEEDS) {
      const world = createWorld(seed);
      world.tick = 0;
      for (const zoom of [LOD_ZOOM, 0.2, 0.125]) {
        frame(world, zoom, { dayNight: true });
        expect(renderStats.faunaDrawn, `seed ${seed} zoom ${zoom}`).toBe(0);
        expect(h.calls.filter((c) => c.kind === 'fauna')).toHaveLength(0);
      }
      frame(world, 1, { dayNight: true });
      drawn += renderStats.faunaDrawn;
      expect(renderStats.faunaDrawn).toBe(
        faunaAt(world, visibleRange(world, 1, 3), 1000, { phase: 'day', zoom: 1 }).length,
      );
    }
    expect(drawn).toBeGreaterThan(0);
  }, 20_000); // einzeln 1,2 s, im Gesamtlauf bis 2,1 s (REL-07: Renderer mit WALD-02-Kronen), Timeout >= 8 x (R270)

  const visibleRange = (world: World, zoom: number, pad: number): TileRange => {
    const r = visibleTileRange(kontorCam(world, zoom), VIEW, {
      w: home(world).width,
      h: home(world).height,
    });
    return {
      x0: Math.max(0, r.x0 - pad),
      y0: Math.max(0, r.y0 - pad),
      x1: Math.min(home(world).width - 1, r.x1 + pad),
      y1: Math.min(home(world).height - 1, r.y1 + pad),
    };
  };

  it('Glühwürmchen: nachts im einen additiven Durchgang (genau ein lighter), ohne dayNight und am Tag nicht', () => {
    let seenNight = 0;
    for (const seed of SEEDS) {
      const world = createWorld(seed);
      world.tick = 3000;
      const log = frame(world, 1, { dayNight: true });
      if (renderStats.faunaDrawn > 0) {
        seenNight++;
        expect(log.compositeSet.filter((c) => c === 'lighter')).toHaveLength(1);
        const mul = log.events.findIndex((e) => e.composite === 'multiply');
        const light = log.events.findIndex((e) => e.composite === 'lighter');
        expect(light).toBeGreaterThan(mul);
        expect(log.saves).toBe(log.restores);
      }
      const off = frame(world, 1, { dayNight: false });
      expect(off.compositeSet).not.toContain('lighter');
      world.tick = 0;
      const day = frame(world, 1, { dayNight: true });
      expect(day.compositeSet.filter((c) => c === 'lighter').length).toBeLessThanOrEqual(0);
    }
    expect(seenNight).toBeGreaterThan(0);
  }, 15_000);

  it('Bodentiere mischen sich nach Tiefe ein: vor dem Schiff bei kleinerem Schlüssel, nach ihm bei gleichem und grösserem', () => {
    const world = createWorld(3);
    world.tick = 0;
    world.order = { period: 1, good: 'wood', amount: 5, reward: 100, due: 999 };
    const ship = shipTile(world)!;
    const K = 2 * ship.x + 2 * ship.y + 2;
    const base: FaunaHit = {
      id: 'hare',
      layer: 'ground',
      x: 0,
      y: 0,
      z: 0,
      tx: 0,
      ty: 0,
      key: 0,
      alpha: 1,
      flip: 1,
      state: 0,
      phase: 0,
      variant: 0,
    };
    const at = (tx: number, ty: number): FaunaHit => ({
      ...base,
      x: tx + 0.5,
      y: ty + 0.5,
      tx,
      ty,
      key: 2 * tx + 2 * ty + 2,
    });
    h.inject = [at(ship.x - 1, ship.y), at(ship.x, ship.y), at(ship.x + 1, ship.y)];
    try {
      frame(world, 1, { dayNight: false });
      const seq = h.calls.filter(
        (c) => c.kind === 'ship' || (c.kind === 'fauna' && [K - 2, K, K + 2].includes(c.key!)),
      );
      const order = seq.map((c) => (c.kind === 'ship' ? 'ship' : String(c.key! - K)));
      expect(order).toEqual(['-2', 'ship', '0', '2']);
    } finally {
      h.inject = [];
    }
  });
});

describe('Fauna T1: Quelltext', () => {
  it('kein Math.random in src/render/fauna.ts (nur hash2 und Zeit)', () => {
    const src = readFileSync('src/render/fauna.ts', 'utf8');
    expect(/Math\.random/.test(src)).toBe(false);
  });
  it('Fauna-Salze 585–594 stehen im Kopf von groundDecor.ts', () => {
    const src = readFileSync('src/render/groundDecor.ts', 'utf8');
    expect(src).toMatch(/585–594/);
    expect(src).toMatch(/L7 im Einzelnen/);
  });
});

// ---------------------------------------------------------------------------------------------------------
// T2: Gebirge, Küste, Meer (C1, C7, C10, D7, D8, D10, E4); Delfine (E5) stehen in wildlife.test.ts
// ---------------------------------------------------------------------------------------------------------
const SEEDS20 = Array.from({ length: 20 }, (_, i) => i + 1);
const T2_IDS = ['ibex', 'eagle', 'crab', 'turtle', 'seal', 'cormorant'] as const;
const hitsOf = (world: World, id: string, env: FaunaEnv, step = 900, span = 70000): FaunaHit[] => {
  const out: FaunaHit[] = [];
  for (let t = 0; t < span; t += step)
    for (const x of faunaAt(world, FULL, t, env)) if (x.id === id) out.push(x);
  return out;
};

describe('Fauna T2: Orte und Haltung', () => {
  it('Eignung über die Seeds 1–20 (Katalog): jede Art kommt auf mehreren Inseln vor', () => {
    const el: Record<string, number> = {},
      pr: Record<string, number> = {};
    for (const seed of SEEDS20)
      for (const r of faunaCatalog(worldOf(seed))) {
        if (r.eligible) el[r.id] = (el[r.id] ?? 0) + 1;
        if (r.present) pr[r.id] = (pr[r.id] ?? 0) + 1;
      }
    for (const id of ['ibex', 'eagle', 'crab', 'turtle', 'seal', 'cormorant', 'dolphin']) {
      expect(el[id] ?? 0, `${id} eligible`).toBeGreaterThanOrEqual(5);
      expect(pr[id] ?? 0, `${id} present`).toBeGreaterThanOrEqual(2);
    }
    expect(el.fall ?? 0).toBe(0);
  });

  it('Tageszeit und Wetter: keine der T2-Arten nachts, Adler nicht bei rain/storm', () => {
    for (const seed of SEEDS20) {
      const world = worldOf(seed);
      const night = idsAt(world, { phase: 'night' }, 4100);
      for (const id of T2_IDS) expect(night.has(id), `${id} nachts`).toBe(false);
      for (const weather of ['rain', 'storm'] as const)
        expect(idsAt(world, { phase: 'day', weather }, 4100).has('eagle'), weather).toBe(false);
    }
    const some = new Set<string>();
    for (const seed of SEEDS20)
      for (const id of idsAt(worldOf(seed), { phase: 'day' }, 4100)) some.add(id);
    for (const id of T2_IDS) expect(some.has(id), `${id} am Tag`).toBe(true);
  });

  it('Zoom: Krabben erst ab 1,5, Steinbock, Schildkröte und Kormoran ab 1, Robben ab 0,75, Adler ab 0,5', () => {
    const minZoom: Record<string, number> = {
      crab: 1.5,
      ibex: 1,
      turtle: 1,
      cormorant: 1,
      seal: 0.75,
      eagle: 0.5,
    };
    for (const seed of SEEDS20) {
      const world = worldOf(seed);
      for (const [id, z] of Object.entries(minZoom)) {
        const below = [0.3, z * 0.9].filter((v) => v < z);
        for (const zoom of below)
          expect(idsAt(world, { phase: 'day', zoom }, 5300).has(id), `${id} bei ${zoom}`).toBe(
            false,
          );
      }
    }
    let crabs = 0;
    for (const seed of SEEDS20)
      crabs += hitsOf(worldOf(seed), 'crab', { phase: 'day', zoom: 1.5 }, 2500, 20000).length;
    expect(crabs).toBeGreaterThan(0);
  });

  it('Kappen aller 13 Arten zusammen: Figuren im Bild höchstens 69 normal bzw. 9 reduziert (Delfine eingerechnet)', () => {
    let peak = 0;
    for (const seed of SEEDS20) {
      const world = worldOf(seed);
      for (const reduce of [false, true])
        for (const phase of PHASES)
          for (let t = 0; t < 70000; t += 2300) {
            const fauna = faunaAt(world, FULL, t, { phase, reduce }).length;
            const d = dolphinsAt(world, t, reduce)?.dolphins.length ?? 0;
            expect(fauna + d, `seed ${seed} reduce ${reduce}`).toBeLessThanOrEqual(reduce ? 9 : 69);
            for (const [id, key] of Object.entries(CAP_OF))
              expect(
                faunaAt(world, FULL, t, { phase, reduce }).filter((x) => x.id === id).length,
              ).toBeLessThanOrEqual(CAPS[key][reduce ? 1 : 0]);
            if (!reduce) peak = Math.max(peak, fauna + d);
          }
    }
    expect(peak).toBeGreaterThan(3);
  });

  it('Steinbock: Komponente ≥ 24 Kacheln, hn 0,3–0,7, flaches Band, Höhe aus dem Netz', () => {
    let seen = 0;
    for (const seed of SEEDS20) {
      const world = worldOf(seed);
      const data = massifData(fieldWorld(world));
      for (const x of hitsOf(world, 'ibex', { phase: 'day' }, 3100)) {
        seen++;
        const comp = data.comps[data.compOf[x.ty * data.width + x.tx]!]!;
        expect(comp, `Massiv unter dem Steinbock (seed ${seed})`).toBeTruthy();
        expect(comp.n).toBeGreaterThanOrEqual(IBEX_MIN_TILES);
        expect(x.layer).toBe('air');
        expect(x.z).toBeCloseTo(massifHeightAt(data, x.x, x.y), 6);
        const hn = x.z / comp.amp;
        expect(hn).toBeGreaterThan(0.3 - 0.08);
        expect(hn).toBeLessThan(0.7 + 0.08);
        // flach: die Höhe ändert sich einen Knotenschritt (0,25 Kacheln) weit um höchstens 3 · IBEX_SLOPE (Platz 0,14 Kacheln neben dem Anker)
        for (const [dx, dy] of [
          [0.25, 0],
          [-0.25, 0],
          [0, 0.25],
          [0, -0.25],
        ] as const)
          expect(Math.abs(massifHeightAt(data, x.x + dx, x.y + dy) - x.z)).toBeLessThanOrEqual(
            3 * IBEX_SLOPE,
          );
      }
    }
    expect(seen).toBeGreaterThan(0);
  });

  it('Steinbock sichtbar: kein Gelände davor in Kamerarichtung verdeckt den Standpunkt; die Prüfung greift (Gegenprobe)', () => {
    let checked = 0,
      rejected = 0;
    for (const seed of SEEDS20) {
      const world = worldOf(seed);
      const data = massifData(fieldWorld(world));
      for (const x of hitsOf(world, 'ibex', { phase: 'day' }, 3100)) {
        checked++;
        expect(sightFree(data, x.x, x.y, x.z, 0), `seed ${seed} @${x.x},${x.y}`).toBe(true);
      }
      // Gegenprobe: flache, mittelhohe Knoten, die verdeckt wären, gibt es (die Auswahl lässt sie weg)
      for (const c of data.comps) {
        if (c.n < IBEX_MIN_TILES) continue;
        for (let j = 0; j < c.ny; j += 3)
          for (let i = 0; i < c.nx; i += 3) {
            const h = c.height[j * c.nx + i]!;
            if (h / c.amp < 0.3 || h / c.amp > 0.7 || c.dist[j * c.nx + i]! < 0.7) continue;
            if (!sightFree(data, (c.x0 * SUB + i) / SUB, (c.y0 * SUB + j) / SUB, h, IBEX_SIGHT))
              rejected++;
          }
      }
    }
    expect(checked).toBeGreaterThan(0);
    expect(rejected).toBeGreaterThan(0);
  });

  it('sightFree gegen ein synthetisches Netz: eine Wand davor verdeckt, ein freies Feld nicht', () => {
    const nx = 40,
      ny = 40;
    const height = new Float32Array(nx * ny);
    const mk = (): MassifData =>
      ({
        comps: [{ x0: 0, y0: 0, x1: 9, y1: 9, nx, ny, height }],
        width: 10,
        height: 10,
        compOf: new Int32Array(100),
        sig: '',
        seed: 0,
      }) as unknown as MassifData;
    const flat = mk();
    expect(sightFree(flat, 2, 2, 20, 0)).toBe(true);
    // Wand 1,5 Kacheln vor dem Punkt, 80 px hoch (mehr als 32 · 1,5 = 48 px über dem Punkt)
    for (let j = 0; j < ny; j++)
      for (let i = 0; i < nx; i++) {
        const fx = i / SUB,
          fy = j / SUB;
        if (fx + fy >= 2 + 2 + 1.4 && fx + fy <= 2 + 2 + 1.7) height[j * nx + i] = 120;
      }
    expect(sightFree(mk(), 2, 2, 20, 0)).toBe(false);
  });

  it('Adler: kreist über hn ≥ 0,6, über dem Gelände, selten ein Flügelschlag', () => {
    let seen = 0,
      flaps = 0;
    for (const seed of SEEDS20) {
      const world = worldOf(seed);
      const data = massifData(fieldWorld(world));
      for (const x of hitsOf(world, 'eagle', { phase: 'day' }, 700, 50000)) {
        seen++;
        if (x.phase !== 0) flaps++;
        expect(x.z).toBeGreaterThan(massifHeightAt(data, x.x, x.y));
        // in 3 Kacheln Umkreis liegt ein Knoten mit hn ≥ 0,6
        let ok = false;
        for (const c of data.comps)
          for (let j = 0; j < c.ny && !ok; j++)
            for (let i = 0; i < c.nx && !ok; i++)
              ok =
                c.height[j * c.nx + i]! / c.amp >= EAGLE_HN &&
                Math.hypot((c.x0 * SUB + i) / SUB - x.x, (c.y0 * SUB + j) / SUB - x.y) <= 3;
        expect(ok, `seed ${seed}`).toBe(true);
      }
    }
    expect(seen).toBeGreaterThan(0);
    expect(flaps / seen).toBeLessThan(0.2);
  });

  it('Krabben auf nassem Sand (Sand mit Wasser nebenan), huschen in Stössen', () => {
    let seen = 0,
      moved = 0;
    const terr = (w: World, x: number, y: number) => home(w).tiles[y * home(w).width + x]?.terrain;
    for (const seed of SEEDS20) {
      const world = worldOf(seed);
      const first = new Map<string, number>();
      for (const x of hitsOf(world, 'crab', { phase: 'day', zoom: 1.5 }, 400, 20000)) {
        seen++;
        if (x.state === 1) moved++;
        let wet = false;
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) wet ||= terr(world, x.tx + dx, x.ty + dy) === 'water';
        expect(wet).toBe(true);
        first.set(`${x.tx}`, 1);
      }
    }
    expect(seen).toBeGreaterThan(0);
    expect(moved).toBeGreaterThan(0);
    expect(moved / seen).toBeLessThan(0.5);
  });

  it('Schildkröte: ruhiger Strand ≥ 8 Kacheln vom Kontor, kriecht Wasser ↔ Strand, Spur auf Sand verblasst', () => {
    let seen = 0,
      trails = 0;
    const xs = new Set<number>();
    for (const seed of SEEDS20) {
      const world = worldOf(seed);
      const k = world.buildings[home(world).kontorId]!;
      const kc = center(BUILDING_DEFS.kontor, k.x, k.y);
      const isl = home(world);
      for (const x of hitsOf(world, 'turtle', { phase: 'day' }, 1500, 120000)) {
        seen++;
        expect(Math.hypot(x.x - kc.cx, x.y - kc.cy)).toBeGreaterThanOrEqual(8 - 1.2);
        xs.add(Math.round(x.x * 10));
        expect(x.layer).toBe('ground');
        const tr = x.trail ?? [];
        for (let i = 0; i < tr.length; i++) {
          trails++;
          expect(isl.tiles[Math.floor(tr[i]!.y) * isl.width + Math.floor(tr[i]!.x)]!.terrain).toBe(
            'sand',
          );
          expect(tr[i]!.a).toBeGreaterThan(0);
          expect(tr[i]!.a).toBeLessThanOrEqual(0.55);
          if (i > 0) expect(tr[i]!.a).toBeLessThan(tr[i - 1]!.a);
        }
      }
    }
    expect(seen).toBeGreaterThan(0);
    expect(trails).toBeGreaterThan(0);
    expect(xs.size).toBeGreaterThan(3);
  });

  it('Robben auf Sandbank oder Fels, Kormorane auf Meeresfels (nie Felsnadel), Schlüssel der Kachel; weichen einem Kontor in < 4 Kacheln', () => {
    let seals = 0,
      corm = 0,
      onRock = 0,
      onBank = 0;
    for (const seed of SEEDS20) {
      const world = createWorld(seed);
      const plan = seaPlan(world.seed, home(world), seaContext(world));
      const rocks = new Set(plan.rocks.filter((r) => !r.needle).map((r) => `${r.x},${r.y}`));
      const banks = new Set(plan.sandbanks.flatMap((a) => a.tiles.map((t) => `${t.x},${t.y}`)));
      for (const x of hitsOf(world, 'cormorant', { phase: 'day' }, 5000)) {
        corm++;
        expect(rocks.has(`${x.tx},${x.ty}`), 'Kormoran auf Fels').toBe(true);
        expect(x.key).toBe(2 * x.tx + 2 * x.ty + 2);
      }
      for (const x of hitsOf(world, 'seal', { phase: 'day' }, 5000)) {
        seals++;
        const k = `${x.tx},${x.ty}`;
        expect(rocks.has(k) || banks.has(k), 'Robbe auf Fels oder Bank').toBe(true);
        if (rocks.has(k)) onRock++;
        else onBank++;
      }
      // Kontor in der Nähe blendet die Meer-Tiere aus; Abriss bringt sie zurück
      const all = [
        ...hitsOf(world, 'cormorant', { phase: 'day' }, 9000, 9001),
        ...hitsOf(world, 'seal', { phase: 'day' }, 9000, 9001),
      ];
      const victim = all[0];
      if (victim) {
        const id = 99999;
        world.buildings[id] = {
          id,
          defId: 'kontor',
          x: victim.tx - 2,
          y: victim.ty,
          island: 0,
        } as unknown as World['buildings'][number];
        const gone = [
          ...hitsOf(world, 'cormorant', { phase: 'day' }, 9000, 9001),
          ...hitsOf(world, 'seal', { phase: 'day' }, 9000, 9001),
        ];
        expect(gone.some((g) => g.tx === victim.tx && g.ty === victim.ty)).toBe(false);
        delete world.buildings[id];
        const back = [
          ...hitsOf(world, 'cormorant', { phase: 'day' }, 9000, 9001),
          ...hitsOf(world, 'seal', { phase: 'day' }, 9000, 9001),
        ];
        expect(back.some((g) => g.tx === victim.tx && g.ty === victim.ty)).toBe(true);
      }
    }
    expect(corm).toBeGreaterThan(0);
    expect(seals).toBeGreaterThan(0);
    expect(onRock + onBank).toBe(seals);
  });

  it('Glitzern: Funken liegen auf dem Pfad, wandern abwärts, höchstens Budget, reduziert keine, deterministisch', () => {
    const path = Array.from({ length: 12 }, (_, i) => ({
      I: 20 + i * 1.5,
      J: 8 + i * 2,
      h: 90 - i * 7,
      w: 2,
      steep: 0.6,
    }));
    const onPath = (x: number, y: number, z: number): boolean => {
      for (let i = 0; i + 1 < path.length; i++) {
        const a = path[i]!,
          b = path[i + 1]!;
        const ax = a.I / SUB,
          ay = a.J / SUB,
          bx = b.I / SUB,
          by = b.J / SUB;
        const l2 = (bx - ax) ** 2 + (by - ay) ** 2;
        const u = ((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / l2;
        if (u < -1e-9 || u > 1 + 1e-9) continue;
        if (
          Math.hypot(ax + (bx - ax) * u - x, ay + (by - ay) * u - y) < 1e-6 &&
          Math.abs(a.h + (b.h - a.h) * u - z) < 1e-6
        )
          return true;
      }
      return false;
    };
    const budget = cap('glitter');
    expect(budget).toBe(30);
    expect(fallSparks(path, 5, 1234, cap('glitter', true))).toEqual([]);
    const a = fallSparks(path, 5, 1234, budget);
    expect(JSON.stringify(a)).toBe(JSON.stringify(fallSparks(path, 5, 1234, budget)));
    expect(a.length).toBeGreaterThan(0);
    expect(a.length).toBeLessThanOrEqual(budget);
    expect(fallSparks(path, 5, 1234, 4).length).toBeLessThanOrEqual(4);
    expect(fallSparks(path.slice(0, 1), 5, 1234, budget)).toEqual([]);
    let down = 0,
      total = 0;
    for (let t = 0; t < 6000; t += 100) {
      const s0 = fallSparks(path, 5, t, budget),
        s1 = fallSparks(path, 5, t + 50, budget);
      s0.forEach((q, k) => {
        expect(onPath(q.x, q.y, q.z), `Funke ${k} bei ${t}`).toBe(true);
        expect(q.alpha).toBeGreaterThanOrEqual(0);
        expect(q.alpha).toBeLessThanOrEqual(1);
        total++;
        if (s1[k]!.z < q.z) down++;
      });
    }
    expect(down / total).toBeGreaterThan(0.95);
  });

  it('Pose deterministisch (zwei Aufrufe gleich), Welt unverändert, kein Math.random auch für die T2-Arten', () => {
    const rnd = vi.spyOn(Math, 'random');
    for (const seed of [1, 2, 3, 5]) {
      const world = createWorld(seed);
      const before = JSON.stringify(world);
      for (const phase of PHASES)
        for (const t of [0, 4321, 99999]) {
          const x = JSON.stringify(faunaAt(world, FULL, t, { phase, zoom: 2 }));
          expect(JSON.stringify(faunaAt(world, FULL, t, { phase, zoom: 2 }))).toBe(x);
        }
      expect(JSON.stringify(world)).toBe(before);
    }
    expect(rnd).not.toHaveBeenCalled();
    rnd.mockRestore();
  });
});

describe('Fauna T2: Zeichner (Fake-Kontext)', () => {
  const cam: Camera = { x: 0, y: 0, zoom: 1.5 };
  const mk = (
    id: FaunaHit['id'],
    layer: FaunaHit['layer'],
    extra: Partial<FaunaHit> = {},
  ): FaunaHit => ({
    id,
    layer,
    x: 10.5,
    y: 10.5,
    z: 20,
    tx: 10,
    ty: 10,
    key: 22,
    alpha: 1,
    flip: 1,
    state: 0,
    phase: 0.5,
    variant: 0,
    ...extra,
  });
  const luma = (c: [number, number, number]): number =>
    (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255;
  const draws: [string, (ctx: CanvasRenderingContext2D) => void][] = [
    ['Krabbe ruht', (ctx) => drawGroundFauna(ctx, cam, mk('crab', 'ground', { z: 0 }))],
    [
      'Krabbe huscht',
      (ctx) => drawGroundFauna(ctx, cam, mk('crab', 'ground', { z: 0, state: 1, phase: 0.4 })),
    ],
    [
      'Schildkröte mit Spur',
      (ctx) =>
        drawGroundFauna(
          ctx,
          cam,
          mk('turtle', 'ground', {
            z: 0,
            state: 1,
            flip: -1,
            trail: [
              { x: 10.3, y: 10.3, a: 0.45 },
              { x: 10.1, y: 10.1, a: 0.3 },
            ],
          }),
        ),
    ],
    ['Robbe liegt', (ctx) => drawGroundFauna(ctx, cam, mk('seal', 'ground', { z: 0 }))],
    [
      'Robbe Kopf',
      (ctx) => drawGroundFauna(ctx, cam, mk('seal', 'ground', { z: 0, state: 1, phase: 1 })),
    ],
    [
      'Robbe Schwanz',
      (ctx) =>
        drawGroundFauna(ctx, cam, mk('seal', 'ground', { z: 0, state: 2, phase: 1, flip: -1 })),
    ],
    ['Kormoran', (ctx) => drawGroundFauna(ctx, cam, mk('cormorant', 'ground', { z: 10 }))],
    [
      'Kormoran trocknet',
      (ctx) => drawGroundFauna(ctx, cam, mk('cormorant', 'ground', { z: 10, phase: 1 })),
    ],
    [
      'Steinbock',
      (ctx) =>
        drawIbex(ctx, cam, [
          mk('ibex', 'air', { variant: 1 }),
          mk('ibex', 'air', { state: 1, x: 12 }),
        ]),
    ],
    [
      'Adler',
      (ctx) =>
        drawEagle(ctx, cam, [
          mk('eagle', 'air', { z: 120, phase: 0.8 }),
          mk('eagle', 'air', { phase: 0, flip: -1 }),
        ]),
    ],
    [
      'Funken',
      (ctx) =>
        drawFallSparks(ctx, cam, [
          { x: 10, y: 10, z: 50, alpha: 1 },
          { x: 10.2, y: 10.2, z: 30, alpha: 0.4 },
        ]),
    ],
  ];

  it('jede Farbe ΔE2000 ≥ 20 zu allen signal*-Farben; keine Linie in Schwarz oder reinem Weiss', () => {
    for (const [name, run] of draws) {
      const { ctx, log } = fakeCtx();
      run(ctx);
      expect(log.events.length, name).toBeGreaterThan(0);
      for (const op of ['fill', 'stroke'] as const)
        for (const style of new Set(log.events.filter((e) => e.op === op).map((e) => e.style))) {
          const c = rgbOfCss(style);
          for (const sig of SIGNALS)
            expect(
              deltaE2000(rgbToLab(c), rgbToLab(rgbOfCss(sig))),
              `${name} ${op} ${style} zu ${sig}`,
            ).toBeGreaterThanOrEqual(20);
          if (op === 'stroke') {
            expect(luma(c), `${name} Linie ${style} nahe Schwarz`).toBeGreaterThanOrEqual(0.08);
            expect(
              c.every((v) => v >= 250),
              `${name} Linie ${style} reines Weiss`,
            ).toBe(false);
          }
        }
    }
  });

  it('die Tierfarben der T2-Arten (Konstanten): ΔE ≥ 20 zu den Signalfarben, Eigenton dunkler', () => {
    for (const col of [
      CRAB_COLOR,
      TURTLE_COLOR,
      TURTLE_TRAIL,
      SEAL_COLOR,
      CORMORANT_COLOR,
      IBEX_COLOR,
      IBEX_HORN,
      EAGLE_COLOR,
      EAGLE_HEAD,
    ])
      for (const sig of SIGNALS)
        expect(
          deltaE2000(rgbToLab(rgbOfCss(col)), rgbToLab(rgbOfCss(sig))),
          `${col} zu ${sig}`,
        ).toBeGreaterThanOrEqual(20);
    // Korallenrot der Krabbe liegt weit genug von signalRed und signalWarn
    for (const sig of [PALETTE.signalRed, PALETTE.signalWarn])
      expect(
        deltaE2000(rgbToLab(rgbOfCss(CRAB_COLOR)), rgbToLab(rgbOfCss(sig))),
      ).toBeGreaterThanOrEqual(20);
    // Kopf des Adlers heller als der Körper, nicht weiss
    expect(luma(rgbOfCss(EAGLE_HEAD))).toBeGreaterThan(luma(rgbOfCss(EAGLE_COLOR)));
    expect(rgbOfCss(EAGLE_HEAD).every((v) => v >= 250)).toBe(false);
  });

  it('save und restore ausgeglichen, Matrix danach wie vorher, keine Bodenmatrix', () => {
    for (const [name, run] of draws) {
      const { ctx, log } = fakeCtx();
      run(ctx);
      expect(log.saves, name).toBe(log.restores);
      expect(log.underflow, name).toBe(0);
      expect(log.matrix, name).toEqual([1, 0, 0, 1, 0, 0]);
      expect(
        log.events.filter((e) => e.op === 'transform'),
        name,
      ).toHaveLength(0);
    }
  });

  it('Funken gebündelt: wenige Füllungen unabhängig von der Anzahl', () => {
    const { ctx, log } = fakeCtx();
    drawFallSparks(
      ctx,
      cam,
      Array.from({ length: 30 }, (_, i) => ({
        x: 10,
        y: 10 + i * 0.1,
        z: 40,
        alpha: (i % 10) / 10,
      })),
    );
    expect(log.events.filter((e) => e.op === 'fill').length).toBeLessThanOrEqual(4);
  });

  it('Quelltext: groundDecor-Kopf nennt die T2-Salze', () => {
    const gd = readFileSync('src/render/groundDecor.ts', 'utf8');
    expect(gd).toMatch(/591–593 Delfine/);
    expect(gd).toMatch(/594 Glitzern/);
  });
});

// ---------------------------------------------------------------------------------------------------------
// Bild-Fix-Runde 1 (lead-art): Fuchs auf freien Kacheln, Abstand der Bodentiere, Hase, Waldvögel, Schildkrötenspur
// ---------------------------------------------------------------------------------------------------------
describe('Fauna Bild-Fix R1', () => {
  it('Fuchs: jeder Pfadpunkt liegt auf einer Graskachel ohne Wald in den Kacheln davor (kein Wald, keine Krone davor)', () => {
    let seen = 0;
    for (const seed of SEEDS20) {
      const world = worldOf(seed);
      const isl = home(world);
      const t = (x: number, y: number) => isl.tiles[y * isl.width + x]?.terrain;
      for (const x of hitsOf(world, 'fox', { phase: 'day' }, 100, 160000)) {
        seen++;
        expect(t(x.tx, x.ty), `seed ${seed} @${x.x},${x.y}`).toBe('grass');
        expect(foxTileFree(isl, x.tx, x.ty)).toBe(true);
        for (let dy = 0; dy <= 2; dy++)
          for (let dx = 0; dx <= 2; dx++) expect(t(x.tx + dx, x.ty + dy)).not.toBe('forest');
      }
    }
    expect(seen).toBeGreaterThan(20);
  });

  it('Verschiedene Bodentiere halten ≥ 1,5 Kacheln Abstand zwischen ihren Ankern', () => {
    let pairs = 0;
    for (const seed of SEEDS20) {
      const a = faunaAnchors(worldOf(seed));
      const ground = ['hare', 'deer', 'fox', 'crab', 'turtle', 'seal', 'cormorant'] as const;
      for (let i = 0; i < ground.length; i++)
        for (let j = i + 1; j < ground.length; j++)
          for (const p of a[ground[i]!] ?? [])
            for (const q of a[ground[j]!] ?? []) {
              pairs++;
              expect(
                Math.hypot(p.tx - q.tx, p.ty - q.ty),
                `${ground[i]} / ${ground[j]} seed ${seed}`,
              ).toBeGreaterThanOrEqual(GROUND_GAP);
            }
    }
    expect(pairs).toBeGreaterThan(50);
    expect(GROUND_GAP).toBe(1.5);
  });

  it('Krabbe und Schildkröte stehen nie auf derselben Stelle (Posen über die Zeit ≥ 0,5 Kacheln auseinander)', () => {
    let both = 0;
    for (const seed of SEEDS20) {
      const world = worldOf(seed);
      for (let t = 0; t < 120000; t += 1500) {
        const hits = faunaAt(world, FULL, t, { phase: 'day', zoom: 2 });
        for (const c of hits.filter((x) => x.id === 'crab'))
          for (const u of hits.filter((x) => x.id === 'turtle')) {
            both++;
            expect(Math.hypot(c.x - u.x, c.y - u.y)).toBeGreaterThan(0.5);
          }
      }
    }
    expect(both).toBeGreaterThanOrEqual(0);
  });

  it('Hase: sitzt etwa die Hälfte der Zeit (≈ 55 %), hoppelt in jedem Zyklus (≥ 15 % der Zeit), knabbert dazwischen', () => {
    const n = [0, 0, 0];
    for (const seed of SEEDS)
      for (let t = 0; t < 120000; t += 100)
        for (const x of faunaAt(worldOf(seed), FULL, t, { phase: 'day' }))
          if (x.id === 'hare') n[x.state]!++;
    const tot = n[0]! + n[1]! + n[2]!;
    expect(n[0]! / tot).toBeGreaterThan(0.45);
    expect(n[0]! / tot).toBeLessThan(0.65);
    expect(n[2]! / tot).toBeGreaterThan(0.15);
    expect(n[1]! / tot).toBeGreaterThan(0.1);
  });

  it('Waldvögel steigen bis ≈ 2,5 · TREE_H, schlagen deutlich mit den Flügeln und sind hell (heller als das Kronendach)', () => {
    let zmax = 0,
      flaps = 0,
      n = 0;
    for (const seed of SEEDS20)
      for (const x of hitsOf(worldOf(seed), 'forestBird', { phase: 'day' }, 100, 120000)) {
        n++;
        zmax = Math.max(zmax, x.z);
        flaps = Math.max(flaps, Math.abs(x.phase));
      }
    expect(n).toBeGreaterThan(0);
    expect(zmax).toBeGreaterThan(2.1 * TREE_H);
    expect(zmax).toBeLessThan(2.8 * TREE_H);
    expect(flaps).toBeGreaterThan(0.9);
    const l = (c: string): number => {
      const [r, g, b] = rgbOfCss(c);
      return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    };
    expect(l(FOREST_BIRD_COLOR)).toBeGreaterThan(l(PALETTE.crown) + 0.3);
  });

  it('Schildkröte gezeichnet: Spur aus zwei Punktreihen je Spurpunkt in dunklerem Sand, hellerer Panzerrand; Robbe: Bauch heller als Rücken', () => {
    const cam: Camera = { x: 0, y: 0, zoom: 2 };
    const turtle: FaunaHit = {
      id: 'turtle',
      layer: 'ground',
      x: 10.5,
      y: 10.5,
      z: 0,
      tx: 10,
      ty: 10,
      key: 22,
      alpha: 1,
      flip: 1,
      state: 1,
      phase: 0.2,
      variant: 0,
      trail: [
        { x: 10.3, y: 10.3, a: 0.4 },
        { x: 10.1, y: 10.1, a: 0.3 },
        { x: 9.9, y: 9.9, a: 0.2 },
      ],
    };
    const { ctx, log } = fakeCtx();
    drawGroundFauna(ctx, cam, turtle);
    const dots = log.events.filter((e) => e.op === 'fill' && e.style.startsWith('rgba('));
    // je Spurpunkt ein Füllpfad mit zwei Ellipsen (je moveTo plus 4 Punkte im Fake)
    const trailFills = dots.filter(
      (e) => e.points.length === 10 && !e.style.startsWith('rgba(20,'),
    );
    expect(trailFills.length).toBe(3);
    expect(log.events.some((e) => e.op === 'fill' && e.style === TURTLE_RIM)).toBe(true);
    const lum = (c: string): number => {
      const [r, g, b] = rgbOfCss(c);
      return 0.299 * r + 0.587 * g + 0.114 * b;
    };
    expect(lum(SEAL_BELLY)).toBeGreaterThan(lum(SEAL_COLOR));
    expect(lum(TURTLE_RIM)).toBeGreaterThan(lum(TURTLE_COLOR));
  });
});

// ---------------------------------------------------------------------------------------------------------
// PERF-L57 W2: Gischt am Wasserfall angeschlossen, statische Anker
// ---------------------------------------------------------------------------------------------------------
const massifFeaturesOf = (world: World) => massifFeatures(massifData(fieldWorld(world))).fall;
const kontorCamOf = (world: World): Camera => {
  const k = world.buildings[home(world).kontorId]!;
  const c = center(BUILDING_DEFS.kontor, k.x, k.y);
  const cam = { x: 0, y: 0, zoom: 1 };
  centerOn(cam, c.cx, c.cy, VIEW, { w: home(world).width, h: home(world).height });
  return cam;
};
describe('PERF-L57 Wasserfall-Gischt im Renderer', () => {
  const FALL_SEED = 3; // L6-Wasserfall steht (Suche per Schleife über Seeds 1–39: 3, 12, 13, 15, 16, 26, 29)
  const NO_FALL_SEED = 1;
  const ghostCam = (world: World, zoom: number): Camera => {
    const f = massifFeaturesOf(world)!;
    const p = f.path[Math.floor(f.path.length / 2)]!;
    const cam = { x: 0, y: 0, zoom };
    centerOn(cam, p.I / SUB, p.J / SUB, VIEW, { w: home(world).width, h: home(world).height });
    return cam;
  };
  const sparksIn = (world: World, zoom: number, fx: Partial<RenderFx> = {}): number[] => {
    const { ctx } = fakeCtx();
    h.calls.length = 0;
    render(ctx, world, ghostCam(world, zoom), layer, null, null, VIEW, { timeMs: 1000, ...fx });
    return h.calls.filter((c) => c.kind === 'sparks').map((c) => c.n!);
  };
  const full = (world: World): TileRange => ({
    x0: 0,
    y0: 0,
    x1: home(world).width - 1,
    y1: home(world).height - 1,
  });

  it('fallGlitter: Funken mit Fall, höchstens cap("glitter"), reduziert und unter Mindestzoom keine, ohne Fall nichts', () => {
    const w = createWorld(FALL_SEED);
    const a = fallGlitter(w, full(w), 1000, { zoom: 1 });
    expect(a.length).toBeGreaterThan(0);
    expect(a.length).toBeLessThanOrEqual(cap('glitter', false));
    expect(JSON.stringify(a)).toBe(JSON.stringify(fallGlitter(w, full(w), 1000, { zoom: 1 })));
    expect(fallGlitter(w, full(w), 1000, { zoom: 0.5 })).toEqual([]);
    expect(fallGlitter(w, full(w), 1000, { zoom: 1, reduce: true })).toEqual([]);
    expect(fallGlitter(w, { x0: 0, y0: 0, x1: -1, y1: -1 }, 1000, { zoom: 1 })).toEqual([]);
    const none = createWorld(NO_FALL_SEED);
    expect(fallGlitter(none, full(none), 1000, { zoom: 1 })).toEqual([]);
  });

  it('fallGlitter: Fall ausserhalb des Bereichs gibt nichts', () => {
    const w = createWorld(FALL_SEED);
    const f = massifFeaturesOf(w)!;
    const xs = f.path.map((p) => p.I / SUB);
    const far = { x0: Math.ceil(Math.max(...xs)) + 3, y0: 0, x1: 255, y1: 255 };
    expect(fallGlitter(w, far, 1000, { zoom: 1 })).toEqual([]);
  });

  it('Renderer: Funken über dem Fall (Zoom 1), nachts auch; nicht bei Zoom ≤ LOD_ZOOM, reduziert, ohne Fall', () => {
    const w = createWorld(FALL_SEED);
    for (const tick of [0, 3000]) {
      w.tick = tick;
      const n = sparksIn(w, 1);
      expect(n.length, `tick ${tick}`).toBe(1);
      expect(n[0]).toBeGreaterThan(0);
    }
    expect(sparksIn(w, LOD_ZOOM)).toEqual([]);
    expect(sparksIn(w, 1, { reduceMotion: true })).toEqual([]);
    const none = createWorld(NO_FALL_SEED);
    h.calls.length = 0;
    const { ctx } = fakeCtx();
    render(ctx, none, kontorCamOf(none), layer, null, null, VIEW, { timeMs: 1000 });
    expect(h.calls.filter((c) => c.kind === 'sparks')).toHaveLength(0);
  }, 20_000);

  it('Renderer: Fall ausserhalb des Bildes zeichnet keine Funken', () => {
    const w = createWorld(FALL_SEED);
    const cam = ghostCam(w, 1);
    cam.x += 100000;
    const { ctx } = fakeCtx();
    h.calls.length = 0;
    render(ctx, w, cam, layer, null, null, VIEW, { timeMs: 1000 });
    expect(h.calls.filter((c) => c.kind === 'sparks')).toHaveLength(0);
  });

  it('Quelltext: der Kopf von fauna.ts nennt keinen offenen Anschluss mehr', () => {
    expect(readFileSync('src/render/fauna.ts', 'utf8')).not.toMatch(/Anschluss folgt/);
  });
});

describe('PERF-L57 B1 Fauna-Anker aus statischem Gelände', () => {
  const sig = (w: World): string => JSON.stringify(faunaAnchors(w));
  it('Anker gleich vor und nach Weg und Haus (Bebauung filtert nur über alive)', () => {
    for (const seed of [3, 7]) {
      const a = createWorld(seed);
      const b = createWorld(seed);
      const before = sig(a);
      // Wege und ein Haus auf viele Kacheln der Heimat setzen (Zustand wie nach Bauen), bevor b zum ersten Mal Anker bildet
      const isl = home(b);
      for (let i = 0; i < isl.tiles.length; i += 3) {
        const t = isl.tiles[i]!;
        if (t.terrain === 'grass' || t.terrain === 'sand') t.road = true;
      }
      expect(sig(b)).toBe(before);
    }
  });
  it('Anker gleich nach serialize/deserialize (neue Welt-Instanz)', () => {
    const a = createWorld(7);
    const before = sig(a);
    const isl = home(a);
    for (let i = 0; i < isl.tiles.length; i += 5)
      if (isl.tiles[i]!.terrain === 'grass') isl.tiles[i]!.road = true;
    const loaded = deserialize(serialize(a));
    if (!loaded.ok) throw new Error(loaded.reason);
    expect(sig(loaded.world)).toBe(before);
  });
  it('gebaute Kachel blendet das Tier nur aus (alive), der Anker bleibt', () => {
    const w = createWorld(7);
    const before = sig(w);
    const hare = faunaAnchors(w).hare?.[0];
    if (!hare) return;
    home(w).tiles[hare.ty * home(w).width + hare.tx]!.road = true;
    expect(sig(w)).toBe(before);
    const hits = faunaAt(w, FULL, 1000, { phase: 'day', zoom: 1 });
    expect(hits.some((x) => x.id === 'hare' && x.tx === hare.tx && x.ty === hare.ty)).toBe(false);
  });
});
