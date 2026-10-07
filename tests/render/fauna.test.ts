import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { centerOn, visibleTileRange, type Camera, type TileRange } from '../../src/render/camera';
import type { Phase, WeatherKind } from '../../src/render/daynight';
import {
  ANTLER_COLOR,
  DEER_BELLY,
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
  faunaCatalog,
  faunaLot,
  type FaunaEnv,
  type FaunaHit,
} from '../../src/render/fauna';
import { FLOWER_PALETTES, flowerPalette } from '../../src/render/groundDecor';
import { LOD_ZOOM } from '../../src/render/archipel';
import { CAPS } from '../../src/render/limits';
import { PALETTE, SIGNAL_NAMES, rgbOfCss } from '../../src/render/palette';
import { render, renderStats, type RenderFx } from '../../src/render/renderer';
import { resetTreeCache, setCanvasFactory } from '../../src/render/trees';
import { shipTile } from '../../src/render/ship';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { center, createWorld, home } from '../../src/sim/world';
import type { World } from '../../src/sim/types';
import { deltaE2000, rgbToLab } from './deltaE';
import { fakeCtx, type Ev } from './fakeCtx';

// Bodentiere im Renderer: ein Test legt über `inject` eigene Treffer in `faunaAt`, damit die Mischung nach Tiefe prüfbar ist.
const h = vi.hoisted(() => ({
  calls: [] as { kind: string; key?: number }[],
  inject: [] as unknown[],
}));
vi.mock('../../src/render/fauna', async (orig) => {
  const m = await orig<typeof import('../../src/render/fauna')>();
  return {
    ...m,
    faunaAt: (...a: Parameters<typeof m.faunaAt>) =>
      [...m.faunaAt(...a), ...(h.inject as FaunaHit[])].sort((x, y) => x.key - y.key),
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

  it('Zoom: unter dem Mindestzoom der Art keine Tiere (Schmetterling, Hase, Fuchs ab 1; Reh, Vögel, Glühwürmchen ab 0,75)', () => {
    for (const seed of SEEDS) {
      const world = worldOf(seed);
      for (const phase of PHASES) {
        const at = (zoom: number) => idsAt(world, { phase, zoom }, 3100);
        expect(at(0.5).size).toBe(0);
        for (const id of at(0.75)) expect(['deer', 'forestBird', 'firefly']).toContain(id);
        for (const id of at(1)) expect(id).toBeTruthy();
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
  it('faunaCatalog: eine Zeile je Art (14), T2-Arten als Platzhalter, present nur bei eligible', () => {
    for (const seed of SEEDS) {
      const rows = faunaCatalog(worldOf(seed));
      expect(rows).toHaveLength(14);
      expect(new Set(rows.map((r) => r.id)).size).toBe(14);
      for (const r of rows) {
        expect(['G', 'S', 'E']).toContain(r.rarity);
        if (r.present) expect(r.eligible).toBe(true);
      }
      for (const id of [
        'ibex',
        'fall',
        'eagle',
        'crab',
        'turtle',
        'seal',
        'cormorant',
        'dolphin',
      ]) {
        const r = rows.find((x) => x.id === id)!;
        expect(r.eligible).toBe(false);
        expect(r.present).toBe(false);
      }
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
    ])
      for (const sig of SIGNALS)
        expect(
          deltaE2000(rgbToLab(rgb(col)), rgbToLab(rgb(sig))),
          `${col} zu ${sig}`,
        ).toBeGreaterThanOrEqual(20);
    // Körper in zwei Tönen: Unterseite dunkler als der Körper
    expect(luma(rgb(HARE_BELLY))).toBeLessThan(luma(rgb(HARE_COLOR)));
    expect(luma(rgb(DEER_BELLY))).toBeLessThan(luma(rgb(DEER_COLOR)));
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
  });

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
  });

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
