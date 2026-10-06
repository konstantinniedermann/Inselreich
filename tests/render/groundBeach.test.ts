import { describe, expect, it } from 'vitest';
import { createWorld, home } from '../../src/sim/world';
import type { World } from '../../src/sim/types';
import {
  coastKind,
  groundElements,
  kontorPos,
  staticClasses,
  type GroundElement,
  type GroundKind,
} from '../../src/render/decor';
import { DECOR_TONES, groundShapes } from '../../src/render/groundDecor';
import { PALETTE, SIGNAL_NAMES, rgbOfCss } from '../../src/render/palette';
import { occupancy } from '../../src/render/terrain';
import { deltaE2000, rgbToLab } from './deltaE';

const BEACH: GroundKind[] = ['beachStone', 'driftwood', 'shell', 'beachGrass', 'tidePool', 'crate'];
const lab = (c: string) => rgbToLab(rgbOfCss(c));
const els = (w: World): GroundElement[] =>
  groundElements(w.seed, home(w), occupancy(home(w)), undefined, kontorPos(home(w), w.buildings));
const beach = (w: World): GroundElement[] => els(w).filter((e) => BEACH.includes(e.kind));
const waterNear = (w: World, x: number, y: number): boolean => {
  const isl = home(w);
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx,
        ny = y + dy;
      if (
        nx >= 0 &&
        ny >= 0 &&
        nx < isl.width &&
        ny < isl.height &&
        isl.tiles[ny * isl.width + nx]!.terrain === 'water'
      )
        return true;
    }
  return false;
};
const W50 = Array.from({ length: 50 }, (_, i) => createWorld(i + 1));

describe('L5-T5 Strand-Boden (D2–D6, D9)', () => {
  it('Eignung: nur freier Sand; Treibholz und Muscheln nur am nassen Saum (Wasser in der 8er-Nachbarschaft); Tümpel am nassen Saum nahe Gebirge', () => {
    const seen = new Set<string>();
    for (const w of W50) {
      const isl = home(w);
      for (const e of beach(w)) {
        seen.add(e.kind);
        expect(isl.tiles[e.y * isl.width + e.x]!.terrain, `${e.kind}`).toBe('sand');
        expect(e.w * e.h).toBe(1);
        if (
          e.kind === 'driftwood' ||
          e.kind === 'shell' ||
          e.kind === 'tidePool' ||
          e.kind === 'crate'
        )
          expect(waterNear(w, e.x, e.y), `Seed ${w.seed} ${e.kind} am Saum`).toBe(true);
        if (e.kind === 'beachGrass')
          expect(waterNear(w, e.x, e.y), 'Strandhafer nie am Saum').toBe(false);
      }
    }
    for (const k of ['beachStone', 'driftwood', 'shell', 'beachGrass'])
      expect(seen.has(k), k).toBe(true);
  });

  it('R3: nie auf belegten Kacheln (Gebäude, Weg); belegte Kachel entfernt nur ihr Element, Rechteck = Ausschnitt des vollen Plans', () => {
    const w = createWorld(7);
    const isl = home(w);
    const full = beach(w);
    expect(full.length).toBeGreaterThan(5);
    const t = full[0]!;
    const w2 = createWorld(7);
    home(w2).tiles[t.y * isl.width + t.x]!.buildingId = 9999;
    const after = beach(w2);
    const key = (e: GroundElement): string => `${e.kind}@${e.x},${e.y}`;
    expect(after.map(key)).not.toContain(key(t));
    expect(after.map(key)).toEqual(full.filter((e) => !(e.x === t.x && e.y === t.y)).map(key));
    const rect = { x0: t.x - 6, y0: t.y - 6, x1: t.x + 6, y1: t.y + 6 };
    const part = groundElements(7, isl, occupancy(isl), rect, kontorPos(isl, w.buildings)).filter(
      (e) => BEACH.includes(e.kind),
    );
    const inRect = full.filter(
      (e) =>
        e.box.x1 >= rect.x0 && e.box.x0 <= rect.x1 && e.box.y1 >= rect.y0 && e.box.y0 <= rect.y1,
    );
    expect(part.map(key).sort()).toEqual(inRect.map(key).sort());
  });

  it('D9 Kiste/Flaschenpost: 10–20 % der Seeds 1–200, nie zweimal, am Spülsaum', () => {
    let n = 0;
    for (let seed = 1; seed <= 200; seed++) {
      const w = createWorld(seed);
      const c = els(w).filter((e) => e.kind === 'crate');
      expect(c.length, `Seed ${seed}`).toBeLessThanOrEqual(1);
      n += c.length;
    }
    expect(n / 200, `D9 ${n}/200`).toBeGreaterThanOrEqual(0.1);
    expect(n / 200).toBeLessThanOrEqual(0.2);
  });

  it('D6 Tümpel: nur wo Felsküste das zulässt, höchstens 6 je Insel, ≥ 4 Kacheln auseinander', () => {
    let pools = 0;
    for (let seed = 1; seed <= 100; seed++) {
      const w = createWorld(seed);
      const p = els(w).filter((e) => e.kind === 'tidePool');
      expect(p.length).toBeLessThanOrEqual(6);
      pools += p.length;
      for (let i = 0; i < p.length; i++)
        for (let j = i + 1; j < p.length; j++)
          expect(
            Math.max(Math.abs(p[i]!.x - p[j]!.x), Math.abs(p[i]!.y - p[j]!.y)),
          ).toBeGreaterThanOrEqual(4);
    }
    expect(pools).toBeGreaterThan(0);
  });

  it('D5 Dünenküste hat deutlich mehr Strandhafer als die Palmenküste (Mittel über Seeds 1–200)', () => {
    const sum: Record<string, [number, number]> = { palm: [0, 0], pine: [0, 0], dune: [0, 0] };
    for (let seed = 1; seed <= 200; seed++) {
      const w = createWorld(seed);
      const s = sum[coastKind(seed)]!;
      s[0] += els(w).filter((e) => e.kind === 'beachGrass').length;
      s[1]++;
    }
    const mean = (k: string): number => sum[k]![0] / sum[k]![1];
    expect(mean('dune')).toBeGreaterThan(1.5 * mean('palm'));
    expect(mean('palm')).toBeGreaterThan(0);
  });

  it('Dichte: höchstens 30 % der Sandkacheln tragen ein Strandelement (R6: ein Haus steht nie „in“ der Deko)', () => {
    for (const w of W50.slice(0, 20)) {
      const isl = home(w);
      const sand = staticClasses(isl).reduce((n, c) => n + (c === 1 ? 1 : 0), 0);
      expect(beach(w).length / sand, `Seed ${w.seed}`).toBeLessThanOrEqual(0.3);
    }
  });

  it('Formen: klein (Steine ≤ 0,3 Kachel), liegen in der Kachel; Töne ΔE2000 ≥ 20 zu Signalfarben, Tümpel ≥ 10 zu den Wassertönen', () => {
    for (const k of BEACH) {
      let any = false;
      for (const w of W50) {
        const e = beach(w).find((x) => x.kind === k);
        if (!e) continue;
        any = true;
        const prims = groundShapes(e, w.seed);
        expect(prims.length, k).toBeGreaterThan(0);
        for (const p of prims) {
          for (const n of SIGNAL_NAMES)
            expect(
              deltaE2000(lab(p.c), lab(PALETTE[n])),
              `${k} ${p.c} ~ ${n}`,
            ).toBeGreaterThanOrEqual(20);
          for (const n of ['waterDeep', 'waterMid', 'waterShallow'] as const)
            expect(
              deltaE2000(lab(p.c), lab(PALETTE[n])),
              `${k} ${p.c} ~ ${n}`,
            ).toBeGreaterThanOrEqual(10);
          const xs =
            p.k === 'poly'
              ? p.pts.filter((_, i) => i % 2 === 0)
              : p.k === 'rect'
                ? [p.x, p.x + p.w]
                : [p.x - p.rx, p.x + p.rx];
          const ys =
            p.k === 'poly'
              ? p.pts.filter((_, i) => i % 2 === 1)
              : p.k === 'rect'
                ? [p.y, p.y + p.h]
                : [p.y - p.ry, p.y + p.ry];
          expect(Math.min(...xs), k).toBeGreaterThanOrEqual(e.box.x0 - 1e-9);
          expect(Math.max(...xs), k).toBeLessThanOrEqual(e.box.x1 + 1 + 1e-9);
          expect(Math.min(...ys), k).toBeGreaterThanOrEqual(e.box.y0 - 1e-9);
          expect(Math.max(...ys), k).toBeLessThanOrEqual(e.box.y1 + 1 + 1e-9);
          if (k === 'beachStone')
            expect(Math.max(...xs) - Math.min(...xs)).toBeLessThanOrEqual(0.3);
        }
      }
      expect(any, `${k} kommt in Seeds 1–50 vor`).toBe(true);
    }
    for (const t of Object.entries(DECOR_TONES))
      for (const n of SIGNAL_NAMES)
        expect(deltaE2000(lab(t[1]), lab(PALETTE[n])), `${t[0]} ~ ${n}`).toBeGreaterThanOrEqual(20);
  });
});
