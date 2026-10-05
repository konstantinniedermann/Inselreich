import { beforeEach, describe, expect, it } from 'vitest';
import {
  createCoverageCache,
  GOOD_COLORS,
  drawNeedSymbols,
  outlineSegments,
  overlayPlan,
  symbolFor,
  SYMBOL_MIN_ZOOM,
} from '../../src/render/overlays';
import { fakeCtx } from './fakeCtx';
import { placeRoad } from '../../src/sim/build';
import { coverageMask, layoutKey } from '../../src/sim/queries';
import { home, createWorld } from '../../src/sim/world';
import { deltaE2000, hexToLab } from './deltaE';
import type { Building, World } from '../../src/sim/types';

let w: World;
let k: Building;

beforeEach(() => {
  w = createWorld(3);
  k = w.buildings[home(w).kontorId]!;
});

describe('overlays', () => {
  it('AK-A3-05 Cache rechnet nur bei geänderter Anordnung oder Art neu', () => {
    let calls = 0;
    const cache = createCoverageCache((world, kind) => {
      calls += 1;
      return coverageMask(world, kind);
    });
    for (let i = 0; i < 100; i++) cache.get(w, 'supply');
    expect(calls).toBe(1);
    expect(placeRoad(w, k.x + 2, k.y).ok).toBe(true);
    cache.get(w, 'supply');
    expect(calls).toBe(2);
    cache.get(w, 'faith');
    expect(calls).toBe(3);
    cache.get(w, 'supply'); // Art getrennt gehalten: kein Neuberechnen
    expect(calls).toBe(3);
  });

  it('AK-A3-05 Cache rechnet für eine andere Welt mit gleichem layoutKey neu', () => {
    let calls = 0;
    const cache = createCoverageCache((world, kind) => {
      calls += 1;
      return coverageMask(world, kind);
    });
    const a = createWorld(3);
    const b = createWorld(3);
    expect(layoutKey(a)).toBe(layoutKey(b));
    cache.get(a, 'supply');
    const mb = cache.get(b, 'supply');
    expect(calls).toBe(2);
    expect(mb).toEqual(coverageMask(b, 'supply'));
  });

  it('AK-A3-05 Umriss-Segmente werden mit der Maske gecacht', () => {
    const cache = createCoverageCache();
    expect(cache.outline(w, 'supply')).toBe(cache.outline(w, 'supply'));
  });

  it('outlineSegments (Basis für AK-A3-01/02): eine Kachel hat 4 Kanten, zwei Nachbarn 6', () => {
    const m = new Array<boolean>(9).fill(false);
    m[4] = true;
    expect(outlineSegments(m, 3)).toHaveLength(4);
    m[5] = true;
    expect(outlineSegments(m, 3)).toHaveLength(6);
  });

  it('outlineSegments (Basis für AK-A3-01/02): Kartenrand zählt als Aussenkante', () => {
    expect(outlineSegments([true], 1)).toHaveLength(4);
  });

  it('AK-A3-02 overlayPlan je Werkzeug nach Spec 10.2', () => {
    expect(overlayPlan(w, 'house', 5, 5)).toMatchObject({ circle: null, coverage: 'supply' });
    expect(overlayPlan(w, 'market', 5, 5)).toMatchObject({ coverage: 'supply' });
    expect(overlayPlan(w, 'market', 5, 5)?.circle?.radius).toBe(8);
    expect(overlayPlan(w, 'chapel', 5, 5)).toMatchObject({ coverage: 'faith' });
    expect(overlayPlan(w, 'school', 5, 5)).toMatchObject({ coverage: 'school' });
    expect(overlayPlan(w, 'lumberjack', 5, 5)?.circle?.radius).toBe(2);
    expect(overlayPlan(w, 'lumberjack', 5, 5)?.coverage).toBeNull();
    expect(overlayPlan(w, 'fisher', 5, 5)).toBeNull();
  });

  it('AK-A3-04 symbolFor wählt Zeichen je Diagnose', () => {
    expect(symbolFor({ kind: 'supply' }).shape).toBe('sign');
    expect(symbolFor({ kind: 'good', good: 'food' }).shape).toBe('good');
    expect(symbolFor({ kind: 'service', service: 'faith' }).shape).toBe('bell');
    expect(symbolFor({ kind: 'service', service: 'school' }).shape).toBe('book');
    expect(SYMBOL_MIN_ZOOM).toBe(0.75);
  });
});

describe('M6-R2 Feuerwache im Overlay', () => {
  it('M6-AK-R2-01 overlayPlan für die Feuerwache: Kreis Radius 8, Abdeckung fire', () => {
    const plan = overlayPlan(w, 'firestation', k.x + 6, k.y - 4);
    expect(plan?.coverage).toBe('fire');
    expect(plan?.circle?.radius).toBe(8);
    expect(overlayPlan(w, 'chapel', k.x + 6, k.y - 4)?.coverage).toBe('faith');
    expect(overlayPlan(w, 'house', k.x + 6, k.y - 4)?.coverage).toBe('supply');
  });

  it('M6-AK-R2-01 Cache rechnet fire nur bei geändertem layoutKey neu', () => {
    let calls = 0;
    const cache = createCoverageCache((world, kind) => {
      calls++;
      return coverageMask(world, kind);
    });
    cache.get(w, 'fire');
    cache.get(w, 'fire');
    cache.outline(w, 'fire');
    expect(calls).toBe(1);
  });
});

describe('M8 R1 Symbole und Farben', () => {
  it('AK-R1-03 Bad-Symbol eigen, Glasfarbe eigen', () => {
    expect(symbolFor({ kind: 'service', service: 'bath' }).shape).toBe('bath');
    expect(symbolFor({ kind: 'service', service: 'school' }).shape).toBe('book');
    expect(symbolFor({ kind: 'service', service: 'faith' }).shape).toBe('bell');
    const others = Object.entries(GOOD_COLORS)
      .filter(([g]) => g !== 'glass')
      .map(([, c]) => c);
    expect(GOOD_COLORS.glass).toBeDefined();
    expect(others).not.toContain(GOOD_COLORS.glass);
  });

  it('AK-R1-03 Bad-Farbe hebt sich von der Buchfarbe ab (ΔE2000 ≥ 15), Glas von jeder Warenfarbe (≥ 10)', () => {
    const sym = symbolFor({ kind: 'service', service: 'bath' });
    const book = symbolFor({ kind: 'service', service: 'school' });
    expect(deltaE2000(hexToLab(sym.color), hexToLab(book.color))).toBeGreaterThanOrEqual(15);
    for (const [g, c] of Object.entries(GOOD_COLORS))
      if (g !== 'glass')
        expect(deltaE2000(hexToLab(GOOD_COLORS.glass!), hexToLab(c)), g).toBeGreaterThanOrEqual(10);
  });

  it('AK-R1-03 drawNeedSymbols zeichnet bei Bad-Mangel mit der Bad-Farbe, nicht mit der Buchfarbe', () => {
    const world = createWorld(3);
    const kk = world.buildings[home(world).kontorId]!;
    const mkB = (
      id: number,
      defId: Building['defId'],
      dx: number,
      extra: Partial<Building>,
    ): void => {
      world.buildings[id] = {
        id,
        defId,
        x: kk.x + dx,
        y: kk.y,
        connected: true,
        progress: 0,
        state: 'ok',
        ...extra,
      };
    };
    mkB(900, 'house', 2, {
      house: {
        tier: 4,
        inhabitants: 5,
        demand: {},
        satisfied: { food: true, cloth: true, rum: true, glass: true },
        services: {},
        satisfiedSince: 0,
        supplied: true,
      },
    });
    mkB(901, 'chapel', 4, {});
    mkB(902, 'school', 6, {});
    const sym = symbolFor({ kind: 'service', service: 'bath' });
    const { ctx, log } = fakeCtx();
    drawNeedSymbols(ctx, world, { x: 0, y: 0, zoom: 1 }, { x0: 0, y0: 0, x1: 200, y1: 200 });
    expect(log.fillSet).toContain(sym.color);
    expect(log.fillSet).not.toContain('#3a6ab8');
  });

  it('AK-R1-04 overlayPlan Badehaus: Kreis Radius 10, Abdeckung bath', () => {
    const plan = overlayPlan(w, 'bathhouse', k.x + 6, k.y - 4);
    expect(plan?.coverage).toBe('bath');
    expect(plan?.circle?.radius).toBe(10);
  });
});
