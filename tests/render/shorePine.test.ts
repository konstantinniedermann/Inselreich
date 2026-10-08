import { beforeAll, describe, expect, it } from 'vitest';
import { createWorld, home } from '../../src/sim/world';
import type { World } from '../../src/sim/types';
import {
  coastKind,
  kontorPos,
  seaContext,
  stampPlacements,
  staticClasses,
  type StampPlacement,
} from '../../src/render/decor';
import {
  DECOR_MIN_ZOOM,
  VARIANT_COUNT,
  paintDecorStamp,
  stampHeight,
} from '../../src/render/decorStamps';
import { PALETTE, SIGNAL_NAMES } from '../../src/render/palette';
import { fakeCtx } from './fakeCtx';

// ART-L8-SELTEN T3: Strandkiefern der Kiefernküste (Stempel 'shorePine', Salz 598). Aufbau einmal in beforeAll.

const SEEDS = Array.from({ length: 40 }, (_, i) => i + 1);
const pines = (l: readonly StampPlacement[]): StampPlacement[] =>
  l.filter((s) => s.kind === ('shorePine' as StampPlacement['kind']));

let worlds: World[] = [];
let lists: StampPlacement[][] = [];
const listOf = (w: World): StampPlacement[] =>
  stampPlacements(w.seed, home(w), kontorPos(home(w), w.buildings), seaContext(w));

beforeAll(() => {
  worlds = SEEDS.map((s) => createWorld(s));
  lists = worlds.map(listOf);
});

describe('ART-L8-SELTEN T3 Kiefernküste', () => {
  it('AK8 Kiefernküsten: 2–5 shorePine auf Sand, Küstenabstand >= 2, >= 3 Kacheln Abstand; Palmen-/Dünenküste keine', () => {
    let pineIslands = 0;
    worlds.forEach((w, i) => {
      const isl = home(w);
      const sp = pines(lists[i]!);
      if (coastKind(w.seed) !== 'pine') {
        expect(sp.length, `Seed ${w.seed} ${coastKind(w.seed)}`).toBe(0);
        return;
      }
      pineIslands++;
      expect(sp.length, `Seed ${w.seed}`).toBeGreaterThanOrEqual(2);
      expect(sp.length, `Seed ${w.seed}`).toBeLessThanOrEqual(5);
      const cls = staticClasses(isl);
      for (const s of sp) {
        expect(cls[s.y * isl.width + s.x], `Sand ${w.seed}`).toBe(1);
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++)
            expect(cls[(s.y + dy) * isl.width + s.x + dx], `Küstenabstand ${w.seed}`).not.toBe(0);
      }
      for (const a of sp)
        for (const b of sp)
          if (a !== b)
            expect(Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y))).toBeGreaterThanOrEqual(3);
    });
    expect(pineIslands).toBeGreaterThanOrEqual(3);
  });

  it('AK8b Ortsliste bleibt bei Bau und Roden: ein belegter Platz entfällt, es rückt nichts nach', () => {
    const idx = worlds.findIndex((w) => coastKind(w.seed) === 'pine');
    const w = createWorld(SEEDS[idx]!);
    const before = pines(listOf(w));
    expect(before.length).toBeGreaterThan(0);
    const isl = home(w);
    isl.tiles[before[0]!.y * isl.width + before[0]!.x]!.road = true;
    for (const t of isl.tiles) if (t.terrain === 'forest') t.terrain = 'grass';
    const after = pines(listOf(w));
    const key = (s: StampPlacement): string => `${s.x},${s.y},${s.variant}`;
    expect(after.map(key)).toEqual(before.slice(1).map(key));
  });

  it('AK8c Zeichner: Zoomschwelle 0,5, 8 Varianten, Höhe, save/restore ausgeglichen, keine Signalfarben', () => {
    const kind = 'shorePine' as StampPlacement['kind'];
    expect(DECOR_MIN_ZOOM[kind]).toBe(0.5);
    expect(VARIANT_COUNT[kind]).toBe(8);
    const signal = new Set(SIGNAL_NAMES.map((n) => PALETTE[n]));
    for (let v = 0; v < 8; v++) {
      expect(stampHeight(kind, v)).toBeGreaterThan(14);
      const { ctx, log } = fakeCtx();
      paintDecorStamp(ctx, kind, v, 1, 0, 0);
      expect(log.saves).toBe(log.restores);
      expect(log.events.length).toBeGreaterThan(5);
      for (const e of log.events) expect(signal.has(e.style), e.style).toBe(false);
    }
  });
});
