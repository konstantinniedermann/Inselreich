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
  fringeEnds,
  G_KINDS,
  G_MAX,
  gCount,
  groundEligible,
  groundElements,
  kontorPos,
  shrubDensity,
  wildForest,
  rareCount,
  rareLot,
  rareSites,
  coastKind,
  seaContext,
  seaElementTiles,
  seaKeepOut,
  seaPlan,
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
  extraFlowersFor,
  fringeClusters,
  flowersFor,
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
  const diffs: Record<string, number> = { Bau: 0, Abriss: 0, Roden: 0, Aufforsten: 0 };
  afterAll(() => {
    // nicht leer: die Aktionen ändern über die Seeds hinweg tatsächlich Elemente
    for (const k of Object.keys(diffs)) expect(diffs[k], k).toBeGreaterThan(0);
  });
  type Ctx = ReturnType<typeof spots> & { id?: number };
  const steps: [string, (w: World, s: Ctx) => void, (w: World, s: Ctx) => void][] = [
    [
      'Bau',
      () => {},
      (w, s) => {
        placeBuilding(w, 'house', s.house.x, s.house.y);
        placeRoad(w, s.house.x, s.house.y + 2);
      },
    ],
    [
      'Abriss',
      (w, s) => {
        s.id = placeBuilding(w, 'house', s.house.x, s.house.y).id;
        placeRoad(w, s.house.x, s.house.y + 2);
      },
      (w, s) => {
        demolish(w, s.id!);
      },
    ],
    [
      'Roden',
      () => {},
      (w, s) => {
        clearForest(w, s.wood.x, s.wood.y);
      },
    ],
    [
      'Aufforsten',
      () => {},
      (w, s) => {
        plantForest(w, s.house.x, s.house.y);
      },
    ],
  ];
  for (const seed of [1, 7, 14, 21]) {
    for (const [name, setup, act] of steps) {
      it(`L4-T2 ${name} (Seed ${seed}): jedes geänderte Element liegt mit Bildbox im Patch-Rechteck, Rechteck nach Patch = voller Plan`, () => {
        const w = fresh(seed);
        const s: Ctx = spots(w);
        setup(w, s);
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

  it('L4-T2 Malebene: paintDecor über das Patch-Rechteck malt dieselben Punkte im Rechteck wie das Vollmalen des neuen Stands (Bau, Abriss, Roden, Aufforsten)', () => {
    /** Pfadpunkte (Texturpixel, Faktor 1) je Zeichenaufruf und Farbe von `paintDecor` über `paint`, die in `r` liegen. */
    const pointsIn = (w: World, paint: TileRect, r: TileRect): string[] => {
      const f = fakeCtx();
      paintDecor(f.ctx, w, occupancy(home(w)), 1, paint);
      const out: string[] = [];
      for (const e of f.log.events)
        if (e.op === 'fill' || e.op === 'stroke')
          for (const p of e.points)
            if (
              p.x >= r.x0 * 32 &&
              p.x < (r.x1 + 1) * 32 &&
              p.y >= r.y0 * 32 &&
              p.y < (r.y1 + 1) * 32
            )
              out.push(`${e.op}|${e.style}|${p.x.toFixed(3)}|${p.y.toFixed(3)}`);
      return out.sort();
    };
    let checked = 0;
    for (const seed of [1, 7, 14, 21]) {
      for (const [name, setup, act] of steps) {
        const w = fresh(seed);
        const s: Ctx = spots(w);
        const full = { x0: 0, y0: 0, x1: home(w).width - 1, y1: home(w).height - 1 };
        setup(w, s);
        const before = clone(w);
        act(w, s);
        const rect = patchRect(before, w);
        if (!rect) continue;
        const patch = pointsIn(w, rect, rect);
        const all = pointsIn(w, full, rect); // Vollmalen des neuen Stands, im selben Rechteck ausgewertet
        expect(patch, `Seed ${seed} ${name}`).toEqual(all);
        expect(patch.length, `Seed ${seed} ${name}: nicht leer`).toBeGreaterThan(0);
        checked++;
      }
    }
    expect(checked).toBeGreaterThanOrEqual(12);
  });

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
        if (
          ['beachStone', 'driftwood', 'shell', 'beachGrass', 'tidePool', 'crate'].includes(e.kind)
        ) {
          // L5: Strand-Elemente stehen auf freiem Sand (kein Gebäude, kein Weg)
          expect(isl.tiles[e.y * isl.width + e.x]!.terrain, key(e)).toBe('sand');
          expect(occ[e.y * isl.width + e.x], key(e)).not.toBe(1);
        } else expect(footprintFree(isl, occ, e.x, e.y, e.w, e.h), key(e)).toBe(true);
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
  // Erkannte Muster (Quelltext von src/render/*.ts): `seed + 5dd` (Salz am Seed), `salt: 5dd` (Pool-Tabelle in decor.ts) und
  // `rnd(5dd, …)` (Formen-Helfer in groundDecor.ts), `gCount(seed, 5dd, …)` (Kandidatenzahl) und die Literale in
  // `G_SALTS = [5dd, …]`. Salze, die nur über eine andere Variable laufen, erkennt der Test nicht.
  const salts = (src: string): number[] =>
    [
      ...src.matchAll(/seed\s*\+\s*(5\d\d)\b/g),
      ...src.matchAll(/salt:\s*(5\d\d)\b/g),
      ...src.matchAll(/\brnd\(\s*(5\d\d)\s*,/g),
      ...src.matchAll(/\bgCount\(\s*seed\s*,\s*(5\d\d)\b/g),
      ...(/G_SALTS\s*=\s*\[([^\]]*)\]/.exec(src)?.[1]?.match(/5\d\d/g) ?? []).map(
        (n) => [n, n] as RegExpMatchArray,
      ),
    ].map((m) => Number(m[1]));

  it('L4-T5 jedes Salz 5dd steht im Kopf von groundDecor.ts und liegt im Bereich seines Häppchens', () => {
    const l4 = ['decor.ts', 'groundDecor.ts', 'decorStamps.ts'];
    const l5 = ['terrain.ts', 'water.ts', 'seaFields.ts'];
    // L1 Wald; WALD-02 belegt zusätzlich 518–529 (Briefing: 518, 519 und 520–529 frei laut Kopf von groundDecor.ts)
    const l1 = ['forest.ts', 'trees.ts', 'woodField.ts', 'crown.ts'];
    let found = 0;
    for (const f of files) {
      for (const n of salts(readFileSync(`${dir}/${f}`, 'utf8'))) {
        found++;
        expect(covered(n), `${f}: Salz ${n} fehlt im Kopf von groundDecor.ts`).toBe(true);
        if (l4.includes(f))
          expect(n === 500 || (n >= 540 && n <= 569), `${f}: ${n} ausserhalb 540–569`).toBe(true);
        else if (l5.includes(f))
          // terrain.ts trägt zusätzlich 539 aus L2 (Findlinge im Boden, Task B; Kopf von groundDecor.ts), sichtbar seit
          // dem Merge von main (REL-06) in den L5-Stapel
          expect(
            (f === 'terrain.ts' && n === 539) || (n >= 560 && n <= 569),
            `${f}: ${n} ausserhalb 560–569 (L5)`,
          ).toBe(true);
        else if (l1.includes(f))
          expect(n >= 500 && n <= 529, `${f}: ${n} ausserhalb 500–529`).toBe(true);
        else expect(n >= 540 && n <= 569, `${f}: ${n} gehört zu L4/L5`).toBe(false);
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
    for (const n of [560, 566, 567, 568, 569]) expect(used.has(n), `Salz ${n} (L5)`).toBe(true);
    for (const n of used) expect(n).toBeLessThanOrEqual(569);
  });

  it('L5-Review: Salze nur aus dem Block ihres Häppchens, keine Summen wie `seed + a + b` und keine Versätze ausserhalb 560–569 in seaFields.ts/water.ts', () => {
    for (const f of ['decor.ts', 'decorStamps.ts', 'water.ts', 'seaFields.ts']) {
      const src = readFileSync(`${dir}/${f}`, 'utf8').replace(/\/\/.*$/gm, '');
      const sums = [
        ...src.matchAll(/\b(?:seed|t\.seed|world\.seed)\s*\+\s*\d+\s*\+\s*[\w.]+/g),
      ].map((m) => m[0]);
      // erlaubt sind nur `seed + 5dd + …` ohne weitere Summanden vor dem Komma bzw. der Klammer
      expect(sums, `${f}: Summe aus Seed und zwei Versätzen`).toEqual([]);
    }
    for (const f of ['seaFields.ts', 'water.ts']) {
      const src = readFileSync(`${dir}/${f}`, 'utf8').replace(/\/\/.*$/gm, '');
      for (const m of src.matchAll(/\b(?:seed|t\.seed|world\.seed)\s*\+\s*(\d+)\b/g)) {
        const n = Number(m[1]);
        expect(n === 101 || n === 202 || (n >= 560 && n <= 569), `${f}: Seed-Versatz ${n}`).toBe(
          true,
        );
      }
    }
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

  it(
    'R5 Findling ≤ 0,3 Kachel, Lesesteinhaufen ≤ 0,35, Elemente liegen in ihrem Fussabdruck',
    { timeout: 30000 },
    () => {
      let boulders = 0;
      const outside: string[] = [];
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
            for (let i = 0; i < pts.length; i += 2)
              if (
                pts[i]! < e.x - 1e-9 ||
                pts[i]! > e.x + e.w + 1e-9 ||
                pts[i + 1]! < e.y - 1e-9 ||
                pts[i + 1]! > e.y + e.h + 1e-9
              )
                outside.push(key(e));
          }
        }
      expect(outside, 'Formen ausserhalb ihres Fussabdrucks').toEqual([]);
      expect(boulders).toBeGreaterThan(50);
    },
  );

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

describe('L4 Bild-Fix 1', () => {
  it('D1 Urwald-Schätzer: ≥ 80 % der gelosten S/E-Elemente sind auf der frisch erzeugten Heimat sichtbar (Seeds 1–50)', () => {
    let sites = 0,
      visible = 0;
    for (let seed = 1; seed <= 50; seed++) {
      const w = createWorld(seed);
      const isl = home(w);
      const k = kontorOf(w);
      const occ = occupancy(isl);
      expect(
        wildForest(seed, isl, staticClasses(isl)),
        `Seed ${seed}: Schätzer passt`,
      ).not.toBeNull();
      const els = groundElements(seed, isl, occ, undefined, k);
      const stamps = stampPlacements(seed, isl, k);
      for (const s of rareSites(seed, isl, k)) {
        sites++;
        const ok =
          s.id === 'steinkreis'
            ? els.some((e) => e.kind === 'stoneCircle' && e.x === s.x && e.y === s.y)
            : s.id === 'pilzring'
              ? els.some((e) => e.kind === 'mushRing' && e.x === s.x && e.y === s.y)
              : s.id === 'bluetenteppich'
                ? els.some((e) => e.kind === 'carpet')
                : stamps.some((t) => t.x === s.x && t.y === s.y);
        if (ok) visible++;
      }
    }
    expect(sites).toBeGreaterThan(80);
    expect(visible / sites).toBeGreaterThanOrEqual(0.8);
  });

  it('Der Schätzer ändert sich nicht durch Roden: Orte bleiben gleich', () => {
    const w = fresh(7);
    const isl = home(w);
    const ref = JSON.stringify(rareSites(7, isl, kontorOf(w)));
    const s = spots(w);
    clearForest(w, s.wood.x, s.wood.y);
    expect(JSON.stringify(rareSites(7, isl, kontorOf(w)))).toBe(ref);
  });

  it('A3 Buschgruppen: etwa 1 je 5–8 freie Wiesenkacheln, gehäuft (Dichte schwankt), runde Körper mit Lichtkante', () => {
    const dens: number[] = [];
    let grass = 0,
      shrubs = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const w = createWorld(seed);
      const isl = home(w);
      for (const t of isl.tiles) if (t.terrain === 'grass') grass++;
      for (const e of groundElements(seed, isl, occupancy(isl), undefined, kontorOf(w)))
        if (e.kind === 'shrubs') {
          shrubs++;
          const ps = groundShapes(e, seed);
          expect(ps.filter((p) => p.k === 'ell').length).toBeGreaterThanOrEqual(4); // Körper, Lappen, Schatten, Licht
        }
      for (let y = 0; y < isl.height; y += 4) dens.push(shrubDensity(seed, 20, y));
    }
    expect(grass / shrubs).toBeGreaterThanOrEqual(5);
    expect(grass / shrubs).toBeLessThanOrEqual(11);
    expect(Math.max(...dens) - Math.min(...dens)).toBeGreaterThan(0.2);
  });

  it('A1 Zusatzblüten: Kern bis 8 Blüten je Kachel, Grösse 1,5–2 px, Palette je Insel; bestehendes flowersFor unverändert', () => {
    let max = 0;
    for (let seed = 1; seed <= 10; seed++)
      for (let y = 0; y < 60; y++)
        for (let x = 0; x < 60; x++) {
          const base = flowersFor(seed, x, y);
          const extra = extraFlowersFor(seed, x, y);
          max = Math.max(max, base.length + extra.length);
          for (const f of extra) {
            expect(f.size).toBeGreaterThanOrEqual(1.5);
            expect(f.size).toBeLessThanOrEqual(2);
          }
          expect(base.length + extra.length).toBeLessThanOrEqual(8);
        }
    expect(max).toBeGreaterThanOrEqual(7);
  });

  it('Kein Element besteht aus Strichen: alle Formen sind Füllungen (rect, ell, poly)', () => {
    const w = createWorld(7);
    const isl = home(w);
    for (const e of groundElements(7, isl, occupancy(isl), undefined, kontorOf(w)))
      for (const p of groundShapes(e, 7)) expect(['rect', 'ell', 'poly']).toContain(p.k);
  });
});

describe('L4 Bild-Fix 2: Farnsaum folgt nicht der Kachelkante', () => {
  /** Gerader Waldrand: Wald links von Spalte 5, Gras ab Spalte 5, 10 Kacheln hoch; Karte 12 × 12. */
  const edge = (): {
    isl: {
      width: number;
      height: number;
      tiles: { terrain: string; buildingId: null; road: boolean }[];
    };
  } => {
    const n = 12;
    const tiles = Array.from({ length: n * n }, (_v, i) => ({
      terrain: i % n < 5 ? 'forest' : 'grass',
      buildingId: null,
      road: false,
    }));
    return { isl: { width: n, height: n, tiles } };
  };

  it('Entlang eines geraden Waldrands von 10 Kacheln: SD des Abstands der Büschel zur Kante ≥ 0,08, Saum ≤ 70 % der Kantenlänge', () => {
    const { isl } = edge();
    // Gemessen über Seeds 1–200: SD-Minimum 0,0896 (Median 0,106), Saumanteil ≤ 0,44. Schwelle = Bildziel 0,08.
    for (let seed = 1; seed <= 200; seed++) {
      const ds: number[] = [];
      let covered = 0;
      for (let y = 1; y <= 10; y++) {
        const sides = 1; // Wald links
        const arg = sides | fringeEnds(isl as never, 5, y, sides);
        for (const c of fringeClusters(seed, 5, y, arg)) {
          ds.push(c.d);
          covered += c.w + 0.04; // Breite des Büschels plus Neigung der Wedel
          expect(c.d).toBeGreaterThanOrEqual(0.05);
          expect(c.d).toBeLessThanOrEqual(0.35);
          expect(c.n).toBeGreaterThanOrEqual(2);
          expect(c.n).toBeLessThanOrEqual(5);
        }
      }
      const mean = ds.reduce((a, b) => a + b, 0) / ds.length;
      const sd = Math.sqrt(ds.reduce((a, b) => a + (b - mean) ** 2, 0) / ds.length);
      expect(ds.length, `Seed ${seed}`).toBeGreaterThan(5);
      expect(sd, `Seed ${seed}: SD`).toBeGreaterThanOrEqual(0.08);
      expect(covered / 10, `Seed ${seed}: Anteil mit Saum`).toBeLessThanOrEqual(0.7);
    }
  });

  it('An Ecken der Treppe ist der Saum ausgespart: kein Büschel nahe dem Ende einer endenden Kante', () => {
    const { isl } = edge();
    // oberstes Kantenstück (y = 0): die Kante setzt sich nach oben nicht fort (Kartenrand), nach unten schon
    const arg = 1 | fringeEnds(isl as never, 5, 0, 1);
    expect(arg & (1 << 4)).toBe(0); // Ende 0 (oben) setzt sich nicht fort
    expect(arg & (1 << 5)).not.toBe(0);
    for (let seed = 1; seed <= 60; seed++)
      for (const c of fringeClusters(seed, 5, 0, arg)) expect(c.u).toBeGreaterThanOrEqual(0.3);
  });
});

describe('L4 Stempelliste rückt nicht nach (D1)', () => {
  const ids = (l: { id: number; kind: string }[]): string[] => l.map((s) => `${s.kind}@${s.id}`);

  it('Eine belegte Kachel unter einem Stempel entfernt nur Stempel an Ort und Stelle, alle anderen bleiben identisch (30 Seeds)', () => {
    let tested = 0;
    for (let seed = 1; seed <= 30; seed++) {
      const w = createWorld(seed);
      const isl = home(w);
      const k = kontorOf(w);
      const before = stampPlacements(seed, isl, k);
      const target = before.find((s) => s.kind === 'solitaire') ?? before[0];
      if (!target) continue;
      tested++;
      const t = isl.tiles[target.id]!;
      t.buildingId = 9999;
      const after = stampPlacements(seed, isl, k);
      t.buildingId = null;
      const gone = new Set([
        target.id,
        target.id + 1,
        target.id + isl.width,
        target.id + isl.width + 1,
      ]);
      expect(ids(after), `Seed ${seed}`).toEqual(ids(before.filter((s) => !gone.has(s.id))));
    }
    expect(tested).toBeGreaterThanOrEqual(25);
  });

  it('Roden entfernt keinen Stempel und fügt keinen an anderer Stelle statt eines ausgeblendeten ein (Rodung nur zusätzlich)', () => {
    for (const seed of [1, 7, 14, 21, 28]) {
      const w = fresh(seed);
      const s = spots(w);
      const before = stampPlacements(seed, home(w), kontorOf(w));
      clearForest(w, s.wood.x, s.wood.y);
      const after = stampPlacements(seed, home(w), kontorOf(w));
      for (const b of ids(before)) expect(ids(after), `Seed ${seed}`).toContain(b);
    }
  });
});

describe('L4 G-Anzahl: 2–12 je Insel (Katalog), statische Kandidatenliste', () => {
  it('Kandidatenzahlen zweier Arten sind über die Seeds 1–200 unkorreliert (|r| < 0,3), A5 in 3–8, Boden-Arten in 3–12', () => {
    const salts = [540, 545, 546, 547, 549];
    const xs = salts.map((salt, k) =>
      Array.from({ length: 200 }, (_v, i) => gCount(i + 1, salt, k, k === 0 ? 8 : 12)),
    );
    xs.forEach((a, k) => {
      expect(Math.min(...a)).toBeGreaterThanOrEqual(3);
      expect(Math.max(...a)).toBeLessThanOrEqual(k === 0 ? 8 : 12);
    });
    const corr = (a: number[], b: number[]): number => {
      const ma = a.reduce((x, y) => x + y, 0) / a.length,
        mb = b.reduce((x, y) => x + y, 0) / b.length;
      let sab = 0,
        saa = 0,
        sbb = 0;
      for (let i = 0; i < a.length; i++) {
        sab += (a[i]! - ma) * (b[i]! - mb);
        saa += (a[i]! - ma) ** 2;
        sbb += (b[i]! - mb) ** 2;
      }
      return sab / Math.sqrt(saa * sbb);
    };
    for (let i = 0; i < xs.length; i++)
      for (let j = i + 1; j < xs.length; j++)
        expect(Math.abs(corr(xs[i]!, xs[j]!)), `Arten ${i}/${j}`).toBeLessThan(0.3);
  });

  it('Seeds 1–50, frisch erzeugte Heimat: sichtbare Solitärbäume (A5) in [2, 8] für ≥ 90 % der Seeds, nie mehr als 8', () => {
    let inBand = 0;
    for (let seed = 1; seed <= 50; seed++) {
      const w = createWorld(seed);
      const n = stampPlacements(seed, home(w), kontorOf(w)).filter(
        (s) => s.kind === 'solitaire',
      ).length;
      expect(n, `Seed ${seed}`).toBeLessThanOrEqual(8); // Katalog 2–12, Deckel 8 = Entscheid lead-art (Perf-Reserve Release A), innerhalb Katalog-Band 2–12
      if (n >= 2) inBand++;
    }
    expect(inBand / 50).toBeGreaterThanOrEqual(0.9);
  });

  it('Seeds 1–50: sichtbare A7, A11, A12, B7 in [2, 12] für ≥ 80 % der Seeds, in denen das Gelände sie zulässt (≥ 12 zulässige Kacheln)', () => {
    expect(G_MAX).toBe(12);
    const kinds = G_KINDS;
    const inBand: number[] = kinds.map(() => 0),
      counted: number[] = kinds.map(() => 0);
    for (let seed = 1; seed <= 50; seed++) {
      const w = createWorld(seed);
      const isl = home(w);
      const els = plan(w);
      const el = groundEligible(seed, isl, kontorOf(w));
      kinds.forEach((kd, i) => {
        const n = els.filter((e) => e.kind === kd).length;
        expect(n, `Seed ${seed} ${kd}`).toBeLessThanOrEqual(12);
        if (el[i]! >= 12) {
          counted[i]!++;
          if (n >= 2) inBand[i]!++;
        }
      });
    }
    kinds.forEach((kd, i) => {
      expect(counted[i], `${kd}: Seeds mit zulässigem Gelände`).toBeGreaterThanOrEqual(25);
      expect(inBand[i]! / counted[i]!, kd).toBeGreaterThanOrEqual(0.8);
    });
  });

  it('Nicht nachrücken: ein belegter Kandidat entfernt nur sich selbst, kein anderer Kandidat erscheint', () => {
    for (const seed of [1, 7, 14]) {
      const w = createWorld(seed);
      const isl = home(w);
      const before = plan(w).filter((e) => (G_KINDS as readonly string[]).includes(e.kind));
      const t = before[0]!;
      isl.tiles[t.y * isl.width + t.x]!.buildingId = 9999;
      const after = plan(w).filter((e) => (G_KINDS as readonly string[]).includes(e.kind));
      isl.tiles[t.y * isl.width + t.x]!.buildingId = null;
      expect(after.map(key)).toEqual(before.filter((e) => e !== t).map(key));
    }
  });
});

// ---------- L5 Meer-Plan und Schifffahrtsregel R4 ----------

/** Abstand eines Punktes zu einer Strecke (unabhängig von decor.ts neu geschrieben). */
function segDist(p: Pos, a: Pos, b: Pos): number {
  const dx = b.x - a.x,
    dy = b.y - a.y;
  const l2 = dx * dx + dy * dy;
  const t = l2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}
const polyDist = (p: Pos, pts: readonly Pos[]): number =>
  Math.min(...pts.slice(1).map((b, i) => segDist(p, pts[i]!, b)));

describe('L5 Meer-Plan und R4', () => {
  it('Seeds 1–200: kein Meer-Element < 3 Kacheln von einer Lane', () => {
    let elements = 0;
    for (let seed = 1; seed <= 200; seed++) {
      const w = createWorld(seed);
      const isl = home(w);
      const ctx = seaContext(w);
      expect(ctx.lanes.length, `Seed ${seed}`).toBeGreaterThan(0);
      for (const e of seaElementTiles(seaPlan(seed, isl, ctx))) {
        elements++;
        const c = { x: e.x + 0.5, y: e.y + 0.5 };
        for (const l of ctx.lanes)
          expect(polyDist(c, l), `Seed ${seed} ${e.kind}@${e.x},${e.y}`).toBeGreaterThanOrEqual(3);
      }
    }
    expect(elements).toBeGreaterThan(200);
  }, 20_000);

  const worlds = (n: number): { seed: number; w: World }[] =>
    Array.from({ length: n }, (_, i) => ({ seed: i + 1, w: createWorld(i + 1) }));
  const W200 = worlds(200);

  it('R4 Anker und Kontor: Mitte ≥ 4 Kacheln (Kontor: Abstand zum Rechteck), nie im Anfahrtskegel ±30°; Seeds 1–200', () => {
    let checked = 0;
    for (const { seed, w } of W200) {
      const ctx = seaContext(w);
      expect(ctx.kontors.length, `Seed ${seed}`).toBeGreaterThan(0);
      for (const e of seaElementTiles(seaPlan(seed, home(w), ctx))) {
        checked++;
        const c = { x: e.x + 0.5, y: e.y + 0.5 };
        expect(
          Math.hypot(c.x - ctx.anchor.x, c.y - ctx.anchor.y),
          `Seed ${seed} Anker`,
        ).toBeGreaterThanOrEqual(4);
        for (const k of ctx.kontors)
          expect(
            Math.hypot(
              Math.max(k.x - c.x, 0, c.x - (k.x + k.w)),
              Math.max(k.y - c.y, 0, c.y - (k.y + k.h)),
            ),
            `Seed ${seed} Kontor`,
          ).toBeGreaterThanOrEqual(4);
        for (const l of ctx.lanes) {
          const d = { x: l[1]!.x - l[0]!.x, y: l[1]!.y - l[0]!.y };
          const v = { x: c.x - ctx.anchor.x, y: c.y - ctx.anchor.y };
          const ang = Math.acos(
            Math.max(
              -1,
              Math.min(1, (d.x * v.x + d.y * v.y) / (Math.hypot(d.x, d.y) * Math.hypot(v.x, v.y))),
            ),
          );
          expect(ang, `Seed ${seed} Kegel ${e.kind}@${e.x},${e.y}`).toBeGreaterThanOrEqual(
            Math.PI / 6,
          );
        }
      }
    }
    expect(checked).toBeGreaterThan(1000);
  }, 20_000);

  it('seaKeepOut: Lane < 3, Anker/Kontor < 4 und der Kegel sperren; frei dahinter (kleiner Kontext)', () => {
    const ctx = {
      lanes: [
        [
          { x: 10.5, y: 10.5 },
          { x: 10.5, y: 60.5 },
        ],
      ],
      anchor: { x: 10.5, y: 10.5 },
      kontors: [{ x: 40, y: 40, w: 2, h: 2 }],
      live: [{ x: 40, y: 40, w: 2, h: 2 }],
    };
    expect(seaKeepOut(ctx, 12, 30)).toBe(true); // 2 Kacheln neben der Lane
    expect(seaKeepOut(ctx, 8, 30)).toBe(true); // 2 Kacheln links
    expect(seaKeepOut(ctx, 16, 30)).toBe(true); // Kegel: 5,5/20 → 15° zur Lane
    expect(seaKeepOut(ctx, 40, 30)).toBe(false); // weit seitlich, > 30°
    expect(seaKeepOut(ctx, 13, 11)).toBe(true); // Lane 3,0, aber nur 3,2 vom Anker
    expect(seaKeepOut(ctx, 38, 43)).toBe(true); // < 4 vom Kontor (Abstand 2,1)
    expect(seaKeepOut(ctx, 46, 30)).toBe(false);
    expect(seaKeepOut(ctx, 10, 30, 0)).toBe(true);
    expect(seaKeepOut(ctx, 40, 55, 0)).toBe(false);
    expect(seaKeepOut(ctx, 40, 55, 40)).toBe(true); // pad vergrössert die Abstände
  });

  it('Wrack in 25–55 % der Seeds 1–200 und nie zweimal; Eiland nie zweimal; Felsnadel höchstens eine', () => {
    let wreck = 0,
      islet = 0,
      needle = 0;
    for (const { seed, w } of W200) {
      const ctx = seaContext(w);
      const plan = seaPlan(seed, home(w), ctx);
      const st = stampPlacements(seed, home(w), kontorOf(w), ctx);
      const n = (k: StampKind): number => st.filter((s) => s.kind === k).length;
      expect(n('wreck'), `Seed ${seed}`).toBe(plan.wreck ? 1 : 0);
      expect(n('islet'), `Seed ${seed}`).toBe(plan.islet ? 1 : 0);
      expect(plan.rocks.filter((r) => r.needle).length).toBeLessThanOrEqual(1);
      wreck += n('wreck');
      islet += n('islet');
      needle += st.filter((s) => s.kind === 'seaRock' && s.variant >= 6).length;
    }
    expect(wreck / 200, `Wrack ${wreck}`).toBeGreaterThanOrEqual(0.25);
    expect(wreck / 200).toBeLessThanOrEqual(0.55);
    expect(islet, 'Eiland kommt vor').toBeGreaterThan(0);
    expect(islet / 200).toBeLessThanOrEqual(0.3);
    expect(needle, 'Felsnadel kommt vor, ist selten').toBeGreaterThan(0);
    expect(needle / 200).toBeLessThanOrEqual(0.5);
  });

  it('Eignung: Tiefe (Abstand zum Land), nur offenes Meer, Felsen 3–12, Eiland ≥ 4 Kacheln zur Küste, keine Überlappung', () => {
    for (const { seed, w } of W200) {
      const isl = home(w);
      const cls = staticClasses(isl);
      const plan = seaPlan(seed, isl, seaContext(w));
      const depth = (x: number, y: number): number => {
        let best = 99;
        for (let yy = 0; yy < isl.height; yy++)
          for (let xx = 0; xx < isl.width; xx++)
            if (cls[yy * isl.width + xx] !== 0)
              best = Math.min(best, Math.max(Math.abs(xx - x), Math.abs(yy - y)));
        return best;
      };
      expect(plan.rocks.length, `Seed ${seed}`).toBeLessThanOrEqual(12);
      for (const e of seaElementTiles(plan)) {
        expect(cls[e.y * isl.width + e.x], `Seed ${seed} ${e.kind} liegt im Wasser`).toBe(0);
        if (e.kind === 'wreck' || e.kind === 'rock') {
          expect(depth(e.x, e.y)).toBeGreaterThanOrEqual(1);
          expect(depth(e.x, e.y)).toBeLessThanOrEqual(5);
        }
        if (e.kind === 'islet')
          expect(depth(e.x, e.y), `Seed ${seed} Eiland`).toBeGreaterThanOrEqual(4);
        if (e.kind === 'sandbank' || e.kind === 'kelp')
          expect(depth(e.x, e.y)).toBeLessThanOrEqual(2);
        if (e.kind === 'reef') {
          expect(depth(e.x, e.y)).toBeGreaterThanOrEqual(3);
          expect(depth(e.x, e.y)).toBeLessThanOrEqual(4);
        }
      }
      const tiles = seaElementTiles(plan).map((e) => `${e.x},${e.y}`);
      expect(new Set(tiles).size, `Seed ${seed}: keine Kachel doppelt`).toBe(tiles.length);
      const pts = [
        ...(plan.wreck ? [plan.wreck] : []),
        ...(plan.islet ? [plan.islet] : []),
        ...plan.rocks,
      ];
      for (let i = 0; i < pts.length; i++)
        for (let j = i + 1; j < pts.length; j++)
          expect(
            Math.max(Math.abs(pts[i]!.x - pts[j]!.x), Math.abs(pts[i]!.y - pts[j]!.y)),
            `Seed ${seed}`,
          ).toBeGreaterThanOrEqual(3);
    }
  });

  it('die Flächen D11/E2/E6 sind im Plan: Sandbänke, Riffe (Streifen, 4–9 Kacheln), Tang nur nahe Gebirge', () => {
    let sb = 0,
      rf = 0,
      kl = 0;
    for (const { seed, w } of W200.slice(0, 60)) {
      const isl = home(w);
      const plan = seaPlan(seed, isl, seaContext(w));
      sb += plan.sandbanks.length;
      rf += plan.reefs.length;
      kl += plan.kelp.length;
      for (const r of plan.reefs) {
        expect(r.tiles.length).toBeGreaterThanOrEqual(3);
        expect(r.tiles.length).toBeLessThanOrEqual(9);
      }
    }
    expect(sb).toBeGreaterThan(60);
    expect(rf).toBeGreaterThan(60);
    expect(kl).toBeGreaterThan(0);
  });

  it('gleiche Seeds → gleicher Plan, auch mit frischer Welt und ohne Cache; seaPlan liest nur (Welt unverändert)', () => {
    for (const seed of [1, 7, 14, 99]) {
      const a = createWorld(seed),
        b = createWorld(seed);
      const before = JSON.stringify(a);
      const pa = JSON.stringify(seaPlan(seed, home(a), seaContext(a)));
      expect(JSON.stringify(a)).toBe(before);
      expect(JSON.stringify(seaPlan(seed, home(b), seaContext(b)))).toBe(pa);
      expect(seaContext(a)).toBe(seaContext(a)); // je Welt gehalten
    }
  });

  it('Palmen (D1): nur trockener Sand mit Wasserabstand ≥ 2, 1–3 je Gruppe, nur mit sea, keine bei Dünenküste', () => {
    let palms = 0;
    const kinds = new Set<string>();
    for (const { seed, w } of W200.slice(0, 80)) {
      const isl = home(w);
      const cls = staticClasses(isl);
      const plain = stampPlacements(seed, isl, kontorOf(w));
      expect(
        plain.some((s) => s.kind === 'palm'),
        'ohne sea keine Palmen',
      ).toBe(false);
      const st = stampPlacements(seed, isl, kontorOf(w), seaContext(w)).filter(
        (s) => s.kind === 'palm',
      );
      kinds.add(coastKind(seed));
      if (coastKind(seed) === 'dune') expect(st).toHaveLength(0);
      for (const s of st) {
        palms++;
        expect(isl.tiles[s.y * isl.width + s.x]!.terrain).toBe('sand');
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++)
            expect(cls[(s.y + dy) * isl.width + s.x + dx], `Seed ${seed} Saum`).not.toBe(0);
        expect(s.variant).toBeGreaterThanOrEqual(0);
        expect(s.variant).toBeLessThan(12);
      }
    }
    expect(kinds.size).toBe(3);
    expect(palms).toBeGreaterThan(50);
  });

  it('R6 mit Meer und Palmen: ≤ 1 je 6 Landkacheln und ≤ 300; Stempel-Ids eindeutig', () => {
    for (const { seed, w } of W200.slice(0, 50)) {
      const isl = home(w);
      const land = staticClasses(isl).reduce((n, c) => n + (c !== 0 ? 1 : 0), 0);
      const st = stampPlacements(seed, isl, kontorOf(w), seaContext(w));
      expect(st.length).toBeLessThanOrEqual(stampLimit(land));
      expect(st.length).toBeLessThanOrEqual(300);
      expect(new Set(st.map((s) => s.id)).size).toBe(st.length);
    }
  });

  it('T6 Palmenküste wirkt locker bewaldet: ≥ 1 Palme je ~4 geeignete Strandkacheln (Mittel ≥ 0,2), Dünen- und Kiefernküste bleiben dünner', () => {
    const acc: Record<string, { palms: number; suit: number; n: number }> = {
      palm: { palms: 0, suit: 0, n: 0 },
      pine: { palms: 0, suit: 0, n: 0 },
      dune: { palms: 0, suit: 0, n: 0 },
    };
    for (const { seed, w } of W200) {
      const isl = home(w);
      const cls = staticClasses(isl);
      let suit = 0;
      for (let y = 0; y < isl.height; y++)
        for (let x = 0; x < isl.width; x++) {
          if (cls[y * isl.width + x] !== 1) continue;
          let near = false;
          for (let dy = -1; dy <= 1 && !near; dy++)
            for (let dx = -1; dx <= 1; dx++)
              if (cls[(y + dy) * isl.width + x + dx] === 0) near = true;
          if (!near) suit++;
        }
      const palms = stampPlacements(seed, isl, kontorOf(w), seaContext(w)).filter(
        (s) => s.kind === 'palm',
      ).length;
      const a = acc[coastKind(seed)]!;
      a.palms += palms;
      a.suit += suit;
      a.n++;
    }
    const rate = (k: string): number => acc[k]!.palms / Math.max(1, acc[k]!.suit);
    expect(rate('palm'), 'Palmen je geeignete Kachel').toBeGreaterThanOrEqual(0.2);
    expect(rate('pine')).toBeLessThan(0.05);
    expect(acc.dune!.palms).toBe(0);
  });
});
