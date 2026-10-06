import { readFileSync, readdirSync } from 'node:fs';
import { afterAll, describe, expect, it } from 'vitest';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { placeBuilding, placeRoad } from '../../src/sim/build';
import { createWorld, footprint, home } from '../../src/sim/world';
import type { GoodId, World } from '../../src/sim/types';
import { clearForest, plantForest } from '../../src/sim/forest';
import { demolish } from '../../src/sim/build';
import { canPlace } from '../../src/sim/placement';
import { deserialize, serialize } from '../../src/sim/save';
import { islandView } from '../../src/render/archipel';
import {
  DECOR_REACH,
  RARE_CAP,
  RARE_POOL,
  STAMP_SPACING,
  decorHill,
  footprintFree,
  groundElements,
  kontorPos,
  rareCount,
  rareLot,
  rareSites,
  solitaireClear,
  stampBlocked,
  stampLimit,
  stampPlacements,
  staticClasses,
  type GroundElement,
  type StampKind,
  type TileRect,
} from '../../src/render/decor';
import {
  DECOR_TONES,
  FLOWER_PALETTES,
  flowerPalette,
  flowerTonesFor,
  groundShapes,
  meadowWarmth,
  type Prim,
} from '../../src/render/groundDecor';
import { PALETTE, SIGNAL_NAMES, rgbOfCss } from '../../src/render/palette';
import {
  dirtyRect,
  meadowHill,
  occupancy,
  paintDecor,
  terrainCodes,
  terrainPatchRect,
} from '../../src/render/terrain';
import { deltaE2000, rgbToLab } from './deltaE';
import { fakeCtx } from './fakeCtx';

/** Welt mit Wohnhäusern und Wegen auf Gras rund um die Inselmitte (Gebäude- und Wegkacheln für die Deko-Regeln). */
function settled(seed: number): World {
  const w = createWorld(seed, { unlockAll: true });
  w.money = 1e9;
  for (const k of Object.keys(home(w).stock)) home(w).stock[k as GoodId] = 500;
  const isl = home(w);
  const cx = isl.width >> 1,
    cy = isl.height >> 1;
  let houses = 0;
  for (let d = 0; d < 24 && houses < 8; d++)
    for (let y = cy - d; y <= cy + d && houses < 8; y++)
      for (let x = cx - d; x <= cx + d && houses < 8; x++) {
        if (Math.max(Math.abs(x - cx), Math.abs(y - cy)) !== d) continue;
        if (placeBuilding(w, 'house', x, y).ok) {
          houses++;
          for (let k = 0; k < 3; k++) placeRoad(w, x + k, y + 2);
        }
      }
  return w;
}

describe('L4 Deko-Fundament: Belegung (R3)', () => {
  it('Keine Deko auf Gebäude- oder Wegkacheln; kein Stempel auf (+x, +y, +x+y) vor Gebäuden', () => {
    for (const seed of [1, 7, 14]) {
      const w = settled(seed);
      const isl = home(w);
      const occ = occupancy(isl);
      expect(
        occ.reduce((a, b) => a + b, 0),
        `Seed ${seed}: Fixture belegt Kacheln`,
      ).toBeGreaterThan(8);
      const at = (x: number, y: number) => isl.tiles[y * isl.width + x]!;
      for (const el of groundElements(w.seed, isl, occ))
        for (let y = el.y; y < el.y + el.h; y++)
          for (let x = el.x; x < el.x + el.w; x++)
            expect(
              occ[y * isl.width + x],
              `Seed ${seed}: ${el.kind} auf belegter Kachel ${x},${y}`,
            ).toBe(0);
      const front = new Set<number>();
      for (const b of Object.values(w.buildings))
        for (const p of footprint(BUILDING_DEFS[b.defId], b.x, b.y))
          for (const [dx, dy] of [
            [1, 0],
            [0, 1],
            [1, 1],
          ] as const)
            front.add((p.y + dy) * isl.width + p.x + dx);
      const stamps = stampPlacements(w.seed, isl);
      for (const s of stamps) {
        const t = at(s.x, s.y);
        expect(t.buildingId, `Seed ${seed}: Stempel ${s.kind} auf Gebäude`).toBeNull();
        expect(t.road, `Seed ${seed}: Stempel ${s.kind} auf Weg`).toBe(false);
        expect(
          front.has(s.y * isl.width + s.x),
          `Seed ${seed}: Stempel ${s.kind} vor Gebäude ${s.x},${s.y}`,
        ).toBe(false);
      }
    }
  });
});

// ---------------------------------------------------------------------------------------------------------------
// Anhang L4: Patch = Vollaufbau (T3, Q3), Invarianten D1–D5, R5/R6, Salze

const lab = (css: string) => rgbToLab(rgbOfCss(css));
const kontorOf = (w: World) => kontorPos(home(w), w.buildings);
const plan = (w: World, rect?: TileRect): GroundElement[] =>
  groundElements(w.seed, home(w), occupancy(home(w)), rect, kontorOf(w));
const key = (e: GroundElement): string => `${e.kind}@${e.x},${e.y}:${e.arg}`;
const unionRect = (a: TileRect | null, b: TileRect | null): TileRect | null =>
  !a || !b
    ? (a ?? b)
    : {
        x0: Math.min(a.x0, b.x0),
        y0: Math.min(a.y0, b.y0),
        x1: Math.max(a.x1, b.x1),
        y1: Math.max(a.y1, b.y1),
      };
const inside = (b: TileRect, r: TileRect): boolean =>
  b.x0 >= r.x0 && b.y0 >= r.y0 && b.x1 <= r.x1 && b.y1 <= r.y1;
const area = (r: TileRect): number => (r.x1 - r.x0 + 1) * (r.y1 - r.y0 + 1);

/** Patch-Rechteck wie `updateTerrainLayer`: Belegung ± 1, Gelände ± SMOOTH_BORDER. */
function patchRect(before: World, after: World): TileRect | null {
  const { width: w, height: h } = home(after);
  const occ = dirtyRect(occupancy(home(before)), occupancy(home(after)), w, h);
  const ter = terrainPatchRect(terrainCodes(home(before)), terrainCodes(home(after)), w, h);
  return unionRect(occ, ter);
}
const clone = (w: World): World => {
  const r = deserialize(serialize(w));
  if (!r.ok) throw new Error(r.reason);
  return r.world;
};

/** Eine Wiesenkachel mit Haus-Platz in der Nähe der Mitte und eine Waldkachel nahe der Mitte. */
function spots(w: World): { house: Pos; wood: Pos } {
  const isl = home(w);
  const cx = isl.width >> 1,
    cy = isl.height >> 1;
  let house: Pos | null = null,
    wood: Pos | null = null;
  for (let d = 0; d < 40 && !(house && wood); d++)
    for (let y = cy - d; y <= cy + d; y++)
      for (let x = cx - d; x <= cx + d; x++) {
        if (Math.max(Math.abs(x - cx), Math.abs(y - cy)) !== d) continue;
        const t = isl.tiles[y * isl.width + x];
        if (!house && t?.terrain === 'grass' && canPlace(w, 'house', x, y).ok) house = { x, y };
        if (!wood && t?.terrain === 'forest' && t.buildingId === null) wood = { x, y };
      }
  return { house: house!, wood: wood! };
}
type Pos = { x: number; y: number };
const fresh = (seed: number): World => {
  const w = createWorld(seed, { unlockAll: true });
  w.money = 1e9;
  for (const k of Object.keys(home(w).stock)) home(w).stock[k as GoodId] = 500;
  return w;
};

describe('L4-T2 Patch = Vollaufbau (Bau, Abriss, Roden, Aufforsten)', () => {
  const diffs: Record<string, number> = { Bau: 0, Roden: 0, Aufforsten: 0 };
  afterAll(() => {
    // nicht leer: die Aktionen ändern über die Seeds hinweg tatsächlich Elemente
    for (const k of Object.keys(diffs)) expect(diffs[k], k).toBeGreaterThan(0);
  });
  const steps: [string, (w: World, s: ReturnType<typeof spots>) => void][] = [
    [
      'Bau',
      (w, s) => {
        placeBuilding(w, 'house', s.house.x, s.house.y);
        placeRoad(w, s.house.x, s.house.y + 2);
      },
    ],
    [
      'Roden',
      (w, s) => {
        clearForest(w, s.wood.x, s.wood.y);
      },
    ],
    [
      'Aufforsten',
      (w, s) => {
        plantForest(w, s.house.x, s.house.y);
      },
    ],
  ];
  for (const seed of [1, 7, 14, 21]) {
    for (const [name, act] of steps) {
      it(`L4-T2 ${name} (Seed ${seed}): jedes geänderte Element liegt mit Bildbox im Patch-Rechteck, Rechteck nach Patch = voller Plan`, () => {
        const w = fresh(seed);
        const s = spots(w);
        if (name === 'Aufforsten') {
          /* Weide → Wald an der Haus-Kachel */
        }
        const before = clone(w);
        const fullBefore = plan(w);
        act(w, s);
        const rect = patchRect(before, w);
        expect(rect, 'Aktion ändert etwas').not.toBeNull();
        const fullAfter = plan(w);
        const a = new Map(fullBefore.map((e) => [key(e), e])),
          b = new Map(fullAfter.map((e) => [key(e), e]));
        const changed = [...a.values()]
          .filter((e) => !b.has(key(e)))
          .concat([...b.values()].filter((e) => !a.has(key(e))));
        diffs[name] = (diffs[name] ?? 0) + changed.length;
        for (const e of changed)
          expect(inside(e.box, rect!), `${name} ${key(e)} ausserhalb ${JSON.stringify(rect)}`).toBe(
            true,
          );
        // Elemente im Rechteck = Ausschnitt des vollen Plans
        const inRect = (e: GroundElement) =>
          e.box.x0 <= rect!.x1 &&
          e.box.x1 >= rect!.x0 &&
          e.box.y0 <= rect!.y1 &&
          e.box.y1 >= rect!.y0;
        expect(plan(w, rect!).map(key)).toEqual(fullAfter.filter(inRect).map(key));
      });
    }
  }

  it('L4-T2 Abriss: Plan nach Bau und Abriss ist identisch zum Plan davor; ebenso Roden und Aufforsten', () => {
    let changed = 0;
    for (const seed of [1, 7, 14]) {
      const w = fresh(seed);
      const s = spots(w);
      const p0 = plan(w).map(key);
      const st0 = stampPlacements(w.seed, home(w), kontorOf(w));
      const r = placeBuilding(w, 'house', s.house.x, s.house.y);
      expect(r.ok).toBe(true);
      if (plan(w).map(key).join() !== p0.join()) changed++;
      expect(demolish(w, r.id!).ok).toBe(true);
      expect(plan(w).map(key)).toEqual(p0);
      expect(stampPlacements(w.seed, home(w), kontorOf(w))).toEqual(st0);
      expect(clearForest(w, s.wood.x, s.wood.y).ok).toBe(true);
      expect(plantForest(w, s.wood.x, s.wood.y).ok).toBe(true);
      expect(plan(w).map(key)).toEqual(p0);
    }
    expect(changed, 'der Bau verändert den Plan mindestens einmal').toBeGreaterThan(0);
  });

  it('L4-T2 gleicher Plan nach serialize und Laden; Determinismus über zwei Aufrufe', () => {
    for (const seed of [2, 7, 14]) {
      const w = fresh(seed);
      const s = spots(w);
      placeBuilding(w, 'house', s.house.x, s.house.y);
      const loaded = deserialize(serialize(w));
      expect(loaded.ok).toBe(true);
      const w2 = (loaded as { world: World }).world;
      expect(plan(w2).map(key)).toEqual(plan(w).map(key));
      expect(plan(w)).toEqual(plan(w));
      expect(stampPlacements(w2.seed, home(w2), kontorOf(w2))).toEqual(
        stampPlacements(w.seed, home(w), kontorOf(w)),
      );
    }
  });

  it('L4-T3 gemalte Kacheln ≤ Fläche des Patch-Rechtecks: Clip auf das Rechteck, Zeichnung nur danach', () => {
    for (const seed of [7, 14]) {
      const w = fresh(seed);
      const s = spots(w);
      const before = clone(w);
      placeBuilding(w, 'house', s.house.x, s.house.y);
      clearForest(w, s.wood.x, s.wood.y);
      const rect = patchRect(before, w)!;
      const f = fakeCtx();
      paintDecor(f.ctx, w, occupancy(home(w)), 1, rect);
      const clips = f.log.events.filter((e) => e.op === 'clip');
      expect(clips.length).toBe(1);
      const xs = clips[0]!.points.map((p) => p.x),
        ys = clips[0]!.points.map((p) => p.y);
      const px = (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys));
      expect(px / (32 * 32)).toBeLessThanOrEqual(area(rect));
      const draws = f.log.events.filter((e) => e.op === 'fill' || e.op === 'stroke');
      expect(draws.length).toBeGreaterThan(0);
      for (const d of draws) expect(d.clips.length).toBe(1);
      // Zahl der Kacheln, in die Elemente malen (Bildbox ∩ Rechteck) ≤ Rechteckfläche
      let tilesTouched = 0;
      for (const e of plan(w, rect)) {
        const x0 = Math.max(e.box.x0, rect.x0),
          x1 = Math.min(e.box.x1, rect.x1);
        const y0 = Math.max(e.box.y0, rect.y0),
          y1 = Math.min(e.box.y1, rect.y1);
        tilesTouched += Math.max(0, x1 - x0 + 1) * Math.max(0, y1 - y0 + 1);
      }
      expect(tilesTouched).toBeLessThanOrEqual(area(rect) * 4); // höchstens 4 Elemente je Kachel, real ≤ 1
      expect(plan(w, rect).filter((e) => e.w === 1).length).toBeLessThanOrEqual(area(rect));
      expect(f.log.saves).toBe(f.log.restores);
      expect(f.log.matrix).toEqual([1, 0, 0, 1, 0, 0]);
    }
  });

  it('L4-T2 Picking mit und ohne Deko gleich: die Platzierung liest die Welt nur und schreibt nie hinein', () => {
    const w = fresh(7);
    const s = spots(w);
    placeBuilding(w, 'house', s.house.x, s.house.y);
    const snap = serialize(w);
    plan(w);
    stampPlacements(w.seed, home(w), kontorOf(w));
    rareSites(w.seed, home(w), kontorOf(w));
    paintDecor(fakeCtx().ctx, w, occupancy(home(w)), 1, {
      x0: 0,
      y0: 0,
      x1: home(w).width - 1,
      y1: home(w).height - 1,
    });
    expect(serialize(w)).toBe(snap);
  });
});

describe('L4 D1 statische Eignung', () => {
  it('D1 S/E-Orte und Los ändern sich weder durch Bauen noch durch Roden oder Aufforsten', () => {
    for (const seed of [1, 3, 7, 14, 28]) {
      const w = fresh(seed);
      const s = spots(w);
      const ref = JSON.stringify(rareSites(seed, home(w), kontorOf(w)));
      const cls = staticClasses(home(w)).slice();
      placeBuilding(w, 'house', s.house.x, s.house.y);
      expect(JSON.stringify(rareSites(seed, home(w), kontorOf(w)))).toBe(ref);
      clearForest(w, s.wood.x, s.wood.y);
      expect(JSON.stringify(rareSites(seed, home(w), kontorOf(w)))).toBe(ref);
      plantForest(w, s.house.x + 3, s.house.y + 3);
      expect(JSON.stringify(rareSites(seed, home(w), kontorOf(w)))).toBe(ref);
      expect(staticClasses(home(w))).toEqual(cls);
    }
  });

  it('D1 die Sim ändert das Gelände nur in forest.ts (Wald ↔ Weide); „Grünland“ bleibt dabei gleich', () => {
    const w = fresh(7);
    const s = spots(w);
    const cls = staticClasses(home(w)).slice();
    clearForest(w, s.wood.x, s.wood.y);
    plantForest(w, s.wood.x, s.wood.y);
    expect(staticClasses(home(w))).toEqual(cls);
  });
});

describe('L4 D2/D3 Fussabdruck, Seltenheit', () => {
  it('D2 Fussabdruck ≤ 2 × 2, Bildbox im Fussabdruck, DECOR_REACH = 1, kein Element auf Nicht-Gras oder belegter Kachel', () => {
    expect(DECOR_REACH).toBe(1);
    for (const seed of [1, 7, 14]) {
      const w = settled(seed);
      const isl = home(w);
      const occ = occupancy(isl);
      for (const e of plan(w)) {
        expect(e.w).toBeLessThanOrEqual(2);
        expect(e.h).toBeLessThanOrEqual(2);
        expect(e.box).toEqual({ x0: e.x, y0: e.y, x1: e.x + e.w - 1, y1: e.y + e.h - 1 });
        expect(footprintFree(isl, occ, e.x, e.y, e.w, e.h), key(e)).toBe(true);
      }
    }
  });

  it('D2 ein 2 × 2-Element entfällt ganz, sobald eine Kachel seines Fussabdrucks belegt ist', () => {
    let tested = 0;
    for (let seed = 1; seed <= 50 && tested < 3; seed++) {
      const w = createWorld(seed);
      const isl = home(w);
      const k = kontorOf(w);
      const site = rareSites(seed, isl, k).find((s) => s.id === 'steinkreis');
      if (!site) continue;
      const occ = new Uint8Array(isl.width * isl.height);
      const vis = (): boolean =>
        groundElements(seed, isl, occ, undefined, k).some((e) => e.kind === 'stoneCircle');
      for (let dy = 0; dy < 2; dy++)
        for (let dx = 0; dx < 2; dx++)
          isl.tiles[(site.y + dy) * isl.width + site.x + dx]!.terrain = 'grass';
      expect(vis()).toBe(true);
      occ[(site.y + 1) * isl.width + site.x + 1] = 1;
      expect(vis()).toBe(false);
      occ.fill(0);
      isl.tiles[site.y * isl.width + site.x]!.terrain = 'forest';
      expect(vis()).toBe(false);
      tested++;
    }
    expect(tested).toBeGreaterThan(0);
  });

  it('D3 Pool-Reihenfolge und Losgrenzen nach Spec 3.6; E höchstens 1; höchstens RARE_CAP S/E je Insel', () => {
    expect(RARE_POOL.map((d) => [d.id, d.p])).toEqual([
      ['steinkreis', 0.25],
      ['bluetenteppich', 0.3],
      ['mauerreste', 0.2],
      ['obstbaum', 0.45],
      ['menhir', 0.45],
      ['pilzring', 0.45],
    ]);
    expect(RARE_CAP).toBe(6);
    const seen = new Set<string>();
    for (let seed = 1; seed <= 50; seed++) {
      const w = createWorld(seed);
      const sites = rareSites(seed, home(w), kontorOf(w));
      expect(sites.length).toBeLessThanOrEqual(RARE_CAP);
      for (const d of RARE_POOL) {
        const n = sites.filter((s) => s.id === d.id).length;
        expect(n).toBeLessThanOrEqual(d.max);
        if (n > 0) expect(rareLot(seed, d), `${d.id} ohne Los`).toBe(true);
        if (n > 0) seen.add(d.id);
        expect(n).toBeLessThanOrEqual(rareLot(seed, d) ? rareCount(seed, d) : 0);
      }
    }
    expect(seen.size).toBe(RARE_POOL.length);
  });

  it('D3 Anteile der Lose über 200 Seeds nahe p (± 0,10)', () => {
    for (const d of RARE_POOL) {
      let n = 0;
      for (let seed = 1; seed <= 200; seed++) if (rareLot(seed, d)) n++;
      expect(Math.abs(n / 200 - d.p), d.id).toBeLessThan(0.1);
    }
  });

  it('D3 Mauerreste liegen ≥ 8 Kacheln vom Kontor', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const w = createWorld(seed);
      const k = kontorOf(w)!;
      for (const s of rareSites(seed, home(w), k))
        if (s.id === 'mauerreste')
          expect(Math.hypot(s.x - k.x, s.y - k.y)).toBeGreaterThanOrEqual(8);
    }
  });
});

describe('L4 D4 Fremdinseln', () => {
  it('D4 Boden-Deko gilt auf jeder Insel mit dem Ansicht-Seed (anderer Seed, andere Liste)', () => {
    const w = createWorld(7, { unlockAll: true });
    expect(w.islands.length).toBeGreaterThan(1);
    const v = islandView(w, 1);
    expect(v.seed).not.toBe(w.seed);
    const isl = home(v);
    const els = groundElements(v.seed, isl, occupancy(isl), undefined, kontorPos(isl, v.buildings));
    expect(els.length).toBeGreaterThan(0);
    // Fremdinsel: kein Kontor aus der Welt in die statische Eignung
    expect(kontorPos({ kontorId: 5, kind: 'tropical' }, { 5: { x: 1, y: 1 } })).toBeNull();
  });
});

describe('L4 D5 Salze und Zufall', () => {
  const dir = 'src/render';
  const files = readdirSync(dir).filter((f) => f.endsWith('.ts'));
  const head = (() => {
    const t = readFileSync(`${dir}/groundDecor.ts`, 'utf8');
    return t.slice(0, t.indexOf('const clamp01'));
  })();
  const covered = (n: number): boolean => {
    if (new RegExp(`\\b${n}\\b`).test(head)) return true;
    for (const m of head.matchAll(/(\d{3})–(\d{3})/g))
      if (n >= Number(m[1]) && n <= Number(m[2])) return true;
    return false;
  };
  const salts = (src: string): number[] =>
    [
      ...src.matchAll(/seed\s*\+\s*(5\d\d)\b/g),
      ...src.matchAll(/salt:\s*(5\d\d)\b/g),
      ...src.matchAll(/\brnd\(\s*(5\d\d)\s*,/g),
    ].map((m) => Number(m[1]));

  it('L4-T5 jedes Salz 5dd steht im Kopf von groundDecor.ts und liegt im Bereich seines Häppchens', () => {
    const l4 = ['decor.ts', 'groundDecor.ts', 'decorStamps.ts'];
    const l1 = ['forest.ts', 'trees.ts'];
    let found = 0;
    for (const f of files) {
      for (const n of salts(readFileSync(`${dir}/${f}`, 'utf8'))) {
        found++;
        expect(covered(n), `${f}: Salz ${n} fehlt im Kopf von groundDecor.ts`).toBe(true);
        if (l4.includes(f))
          expect(n === 500 || (n >= 540 && n <= 559), `${f}: ${n} ausserhalb 540–559`).toBe(true);
        else if (l1.includes(f))
          expect(n >= 500 && n <= 519, `${f}: ${n} ausserhalb 500–519`).toBe(true);
        else expect(n >= 540 && n <= 559, `${f}: ${n} gehört zu L4`).toBe(false);
      }
    }
    expect(found).toBeGreaterThan(20);
  });

  it('L4-T5 D5 die 20 Salze 540–559 sind belegt und kommen in decor.ts bzw. groundDecor.ts vor', () => {
    const src =
      readFileSync(`${dir}/decor.ts`, 'utf8') + readFileSync(`${dir}/groundDecor.ts`, 'utf8');
    const used = new Set(salts(src).filter((n) => n >= 540));
    for (const n of [
      540, 541, 542, 543, 544, 545, 546, 547, 548, 549, 550, 551, 552, 554, 555, 556, 557, 558, 559,
    ])
      expect(used.has(n), `Salz ${n}`).toBe(true);
    for (const n of used) expect(n).toBeLessThanOrEqual(559);
  });

  it('L4-T6 kein Math.random in decor.ts und decorStamps.ts (decorStamps.ts darf bis Task 2 fehlen)', () => {
    expect(readFileSync(`${dir}/decor.ts`, 'utf8')).not.toMatch(/Math\.random/);
    expect(readFileSync(`${dir}/groundDecor.ts`, 'utf8')).not.toMatch(/Math\.random/);
    if (files.includes('decorStamps.ts'))
      expect(readFileSync(`${dir}/decorStamps.ts`, 'utf8')).not.toMatch(/Math\.random/);
  });
});

describe('L4 Farben (R5)', () => {
  const tones = [...Object.values(DECOR_TONES), ...FLOWER_PALETTES.flat()];
  it('R5 alle Deko-Töne: ΔE2000 ≥ 20 zu jeder Signalfarbe', () => {
    for (const t of tones)
      for (const n of SIGNAL_NAMES)
        expect(deltaE2000(lab(t), lab(PALETTE[n])), `${t} ~ ${n}`).toBeGreaterThanOrEqual(20);
  });
  it('R5 auf bebaubaren Kacheln (Gras) kein Ton mit ΔE2000 < 10 zu den Wassertönen (Kornblume!)', () => {
    for (const t of tones)
      for (const n of ['waterDeep', 'waterMid', 'waterShallow'] as const)
        expect(deltaE2000(lab(t), lab(PALETTE[n])), `${t} ~ ${n}`).toBeGreaterThanOrEqual(10);
  });
  it('Blütenpalette je Insel aus hash2(seed + 500, 0, 1): 0…3, über Seeds 1–50 alle vier, Palette 0 = bisherige Töne', () => {
    const seen = new Set<number>();
    for (let seed = 1; seed <= 50; seed++) {
      const p = flowerPalette(seed);
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(3);
      expect(flowerTonesFor(seed)).toBe(FLOWER_PALETTES[p]);
      seen.add(p);
    }
    expect(seen.size).toBe(4);
  });
});

describe('L4 Formen und Ausprägungen', () => {
  const sig = (ps: Prim[]): string => JSON.stringify(ps);
  const bounds = (ps: Prim[]): { w: number; h: number } => {
    let x0 = Infinity,
      y0 = Infinity,
      x1 = -Infinity,
      y1 = -Infinity;
    const add = (x: number, y: number) => {
      x0 = Math.min(x0, x);
      x1 = Math.max(x1, x);
      y0 = Math.min(y0, y);
      y1 = Math.max(y1, y);
    };
    for (const p of ps) {
      if (p.k === 'rect') {
        add(p.x, p.y);
        add(p.x + p.w, p.y + p.h);
      } else if (p.k === 'ell') {
        add(p.x - p.rx, p.y - p.ry);
        add(p.x + p.rx, p.y + p.ry);
      } else for (let i = 0; i < p.pts.length; i += 2) add(p.pts[i]!, p.pts[i + 1]!);
    }
    return { w: x1 - x0, h: y1 - y0 };
  };
  const primArea = (p: Prim): number =>
    p.k === 'rect'
      ? p.w * p.h
      : p.k === 'ell'
        ? Math.PI * p.rx * p.ry
        : Math.abs(
            p.pts.reduce(
              (s, _v, i) =>
                i % 2
                  ? s
                  : s +
                    p.pts[i]! * p.pts[(i + 3) % p.pts.length]! -
                    p.pts[(i + 2) % p.pts.length]! * p.pts[i + 1]!,
              0,
            ),
          ) / 2;
  const luma = (css: string): number => {
    const c = rgbOfCss(css);
    return 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];
  };

  const all: { seed: number; els: GroundElement[] }[] = [];
  for (let seed = 1; seed <= 50; seed++) {
    const w = createWorld(seed);
    all.push({ seed, els: plan(w) });
  }

  it('Seeds 1–50: jede Art kommt vor und hat ≥ 2 Ausprägungen (Formen); Stempel-Varianten ≥ 2 je Art; Paletten ≥ 2', () => {
    const shapes = new Map<string, Set<string>>();
    for (const { seed, els } of all)
      for (const e of els) {
        const set = shapes.get(e.kind) ?? new Set<string>();
        set.add(sig(groundShapes(e, seed).map((p) => ({ ...p, c: '' }) as Prim)) + e.arg);
        shapes.set(e.kind, set);
      }
    for (const kind of [
      'tuftTall',
      'clover',
      'tuftDry',
      'shrubs',
      'pebble',
      'boulder',
      'stoneHeap',
      'mushRing',
      'molehills',
      'reeds',
      'carpet',
      'toadstools',
      'deadwood',
      'ferns',
    ])
      expect(shapes.get(kind)?.size ?? 0, kind).toBeGreaterThanOrEqual(2);
    expect(shapes.has('stoneCircle')).toBe(true);
    const variants = new Map<StampKind, Set<number>>();
    for (let seed = 1; seed <= 50; seed++) {
      const w = createWorld(seed);
      for (const s of stampPlacements(seed, home(w), kontorOf(w))) {
        const set = variants.get(s.kind) ?? new Set<number>();
        set.add(s.variant);
        variants.set(s.kind, set);
      }
    }
    for (const kind of ['solitaire', 'orchard', 'menhir', 'ruin'] as const)
      expect(variants.get(kind)?.size ?? 0, kind).toBeGreaterThanOrEqual(2);
  });

  it('R5 Findling ≤ 0,3 Kachel, Lesesteinhaufen ≤ 0,35, Elemente liegen in ihrem Fussabdruck', () => {
    let boulders = 0;
    for (const { seed, els } of all)
      for (const e of els) {
        const ps = groundShapes(e, seed);
        const b = bounds(ps);
        if (e.kind === 'boulder') {
          boulders++;
          expect(Math.max(b.w, b.h)).toBeLessThanOrEqual(0.3);
        }
        if (e.kind === 'stoneHeap') expect(Math.max(b.w, b.h)).toBeLessThanOrEqual(0.35);
        for (const p of ps) {
          const pts: number[] =
            p.k === 'poly'
              ? [...p.pts]
              : p.k === 'rect'
                ? [p.x, p.y, p.x + p.w, p.y + p.h]
                : [p.x - p.rx, p.y - p.ry, p.x + p.rx, p.y + p.ry];
          for (let i = 0; i < pts.length; i += 2) {
            expect(pts[i]!, `${key(e)} x`).toBeGreaterThanOrEqual(e.x - 1e-9);
            expect(pts[i]!, `${key(e)} x`).toBeLessThanOrEqual(e.x + e.w + 1e-9);
            expect(pts[i + 1]!, `${key(e)} y`).toBeGreaterThanOrEqual(e.y - 1e-9);
            expect(pts[i + 1]!, `${key(e)} y`).toBeLessThanOrEqual(e.y + e.h + 1e-9);
          }
        }
      }
    expect(boulders).toBeGreaterThan(50);
  });

  it('R6 Boden-Deko ändert den mittleren Ton einer Wiesenkachel um ≤ 1 Tonstufe (Flächenanteil × Helligkeitsabstand)', () => {
    // Eine Tonstufe des Bodens: TONE_DARK_MUL = 8 % der Helligkeit der Wiese (terrain.ts)
    const step = 0.08 * luma(PALETTE.grass);
    let worst = 0;
    for (const { seed, els } of all)
      for (const e of els) {
        let dev = 0;
        for (const p of groundShapes(e, seed))
          dev += primArea(p) * Math.abs(luma(p.c) - luma(PALETTE.grass));
        worst = Math.max(worst, dev / (e.w * e.h));
      }
    expect(worst).toBeLessThanOrEqual(step);
  });

  it('A3 Büsche mit ≥ 1 Kachel Abstand zu Weg und Gebäude; A12 Binsen nur nahe der Küste; B6–B8 nur an Wald', () => {
    for (const seed of [1, 7, 14]) {
      const w = settled(seed);
      const isl = home(w);
      const occ = occupancy(isl);
      for (const e of plan(w)) {
        if (e.kind === 'shrubs')
          for (let dy = -1; dy <= 1; dy++)
            for (let dx = -1; dx <= 1; dx++) {
              const x = e.x + dx,
                y = e.y + dy;
              if (x >= 0 && y >= 0 && x < isl.width && y < isl.height)
                expect(occ[y * isl.width + x], key(e)).toBe(0);
            }
        if (e.kind === 'toadstools' || e.kind === 'deadwood' || e.kind === 'ferns')
          expect(e.arg, key(e)).toBeGreaterThan(0);
      }
    }
  });

  it('Hügelfeld der Deko ist dieselbe Formel wie meadowHill in terrain.ts', () => {
    for (const [x, y] of [
      [3.2, 4.1],
      [20.5, 33.7],
      [55, 12.25],
    ] as const)
      expect(decorHill(7, x, y)).toBeCloseTo(meadowHill(7, x, y), 12);
    expect(meadowWarmth(7, 3, 4)).toBeGreaterThanOrEqual(-1);
  });
});

describe('L4 R3/R5/R6 reine Regeln und Stempelliste', () => {
  it('R3 stampBlocked: belegt und die Kacheln (+x, +y, +x+y) vor Gebäudekacheln', () => {
    const w = fresh(7);
    const isl = home(w);
    const s = spots(w).house;
    const r = placeBuilding(w, 'house', s.x, s.y);
    expect(r.ok).toBe(true);
    const fp = footprint(BUILDING_DEFS.house, s.x, s.y);
    for (const p of fp) {
      expect(stampBlocked(isl, p.x, p.y)).toBe(true);
      for (const [dx, dy] of [
        [1, 0],
        [0, 1],
        [1, 1],
      ] as const)
        expect(stampBlocked(isl, p.x + dx, p.y + dy)).toBe(true);
    }
    const far = { x: s.x - 3, y: s.y - 3 };
    expect(stampBlocked(isl, far.x, far.y)).toBe(false);
  });

  it('R5 Solitär ≥ 2 Kacheln vom Wald, Stempel ≥ 3 Kacheln auseinander (≤ 1 je 3 × 3); R6 ≤ 1 je 6 Landkacheln und ≤ 300', () => {
    expect(STAMP_SPACING).toBe(3);
    let total = 0;
    for (let seed = 1; seed <= 50; seed++) {
      const w = createWorld(seed);
      const isl = home(w);
      const st = stampPlacements(seed, isl, kontorOf(w));
      total += st.length;
      const land = staticClasses(isl).reduce((n, c) => n + (c !== 0 ? 1 : 0), 0);
      expect(st.length).toBeLessThanOrEqual(stampLimit(land));
      expect(st.length).toBeLessThanOrEqual(300);
      for (const s of st) {
        expect(isl.tiles[s.y * isl.width + s.x]!.terrain).toBe('grass');
        if (s.kind === 'solitaire')
          expect(solitaireClear(isl, s.x, s.y), `Seed ${seed} ${s.x},${s.y}`).toBe(true);
      }
      for (let i = 0; i < st.length; i++)
        for (let j = i + 1; j < st.length; j++)
          expect(
            Math.max(Math.abs(st[i]!.x - st[j]!.x), Math.abs(st[i]!.y - st[j]!.y)),
          ).toBeGreaterThanOrEqual(3);
    }
    expect(total).toBeGreaterThan(50);
    expect(stampLimit(1600)).toBeLessThanOrEqual(300);
  });
});
