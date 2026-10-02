import { describe, expect, it } from 'vitest';
import {
  FIRE_SMOKE_TAIL,
  crisisFx,
  frameInputs,
  nextFireMemo,
  type FireMemo,
} from '../../src/ui/crisisFx';
import type { CrisisView } from '../../src/sim/queries';

const NONE: CrisisView = { phase: 'none', next: 500 };
const fire = (over: Partial<Extract<CrisisView, { kind: unknown }>> = {}): CrisisView => ({
  phase: 'active',
  kind: 'fire',
  period: 1,
  from: 100,
  until: 300,
  remaining: 200,
  target: 7,
  targetExists: true,
  outcome: 'burning',
  ...over,
});
const storm = (phase: 'warning' | 'active', remaining: number): CrisisView => ({
  phase,
  kind: 'storm',
  period: 1,
  from: 201,
  until: 500,
  remaining,
  targetExists: false,
});
const boom: CrisisView = {
  phase: 'active',
  kind: 'boom',
  period: 1,
  from: 0,
  until: 300,
  remaining: 300,
  good: 'wood',
  targetExists: false,
};

describe('crisisFx Feuer und Nachlauf (M6-AK-U3-02)', () => {
  it('Brand burning: Flammen, Rauch, Umgebung 1', () => {
    const fx = crisisFx(fire(), 100, null);
    expect(fx.fire).toEqual([{ id: 7, flames: 1, smoke: 1 }]);
    expect(fx.ambienceFire).toBe(1);
  });
  it('Ziel abgerissen: kein Feuer', () => {
    expect(crisisFx(fire({ targetExists: false }), 100, null).fire).toBeUndefined();
  });
  it('gelöscht und leer: kein Feuer', () => {
    expect(crisisFx(fire({ outcome: 'extinguished' }), 100, null).fire).toBeUndefined();
    expect(crisisFx(fire({ outcome: 'miss', target: undefined }), 100, null).fire).toBeUndefined();
  });
  it('Nachlauf exakt', () => {
    const memo = { id: 7, end: 300 };
    for (const [d, smoke] of [
      [0, 1],
      [20, 0.75],
      [40, 0.5],
      [79, 0.0125],
    ] as const) {
      const fx = crisisFx(NONE, 300 + d, memo);
      expect(fx.fire).toHaveLength(1);
      expect(fx.fire![0]).toMatchObject({ id: 7, flames: 0 });
      expect(fx.fire![0]!.smoke).toBeCloseTo(smoke, 12);
      expect(fx.ambienceFire).toBe(0);
    }
    expect(crisisFx(NONE, 300 + FIRE_SMOKE_TAIL, memo).fire).toBeUndefined();
    expect(crisisFx(NONE, 299, memo).fire).toBeUndefined();
  });
});

describe('crisisFx Wetter und Boom (M6-AK-U3-03)', () => {
  it('Vorwarnung steigt von 0 bis 200/201, aktiv storm 1', () => {
    expect(crisisFx(storm('warning', 201), 0, null).weather).toEqual({ kind: 'cloudy', w: 0 });
    expect(crisisFx(storm('warning', 101), 100, null).weather!.w).toBeCloseTo(100 / 201, 12);
    expect(crisisFx(storm('warning', 1), 200, null).weather!.w).toBeCloseTo(200 / 201, 12);
    expect(crisisFx(storm('active', 299), 201, null).weather).toEqual({ kind: 'storm', w: 1 });
    expect(crisisFx(storm('active', 1), 499, null).weather).toEqual({ kind: 'storm', w: 1 });
  });
  it('Boom', () => {
    expect(crisisFx(boom, 0, null).boom).toBe(true);
    expect(crisisFx(boom, 299, null).boom).toBe(true);
  });
  it('keine Krise: leer', () => {
    expect(crisisFx(NONE, 10, null)).toEqual({ ambienceFire: 0 });
  });
});

describe('nextFireMemo (M6-AK-U3-04)', () => {
  const exists = () => true;
  it('Brand endet: Merkstruktur mit prev.until, auch bei mehreren Schritten', () => {
    expect(nextFireMemo(null, fire({ until: 300 }), NONE, 303, exists)).toEqual({
      id: 7,
      end: 300,
    });
  });
  it('Ziel abgerissen: null', () => {
    expect(nextFireMemo(null, fire(), NONE, 301, () => false)).toBeNull();
  });
  it('ab 80 Ticks: null; davor bleibt sie', () => {
    const memo: FireMemo = { id: 7, end: 300 };
    expect(nextFireMemo(memo, NONE, NONE, 379, exists)).toBe(memo);
    expect(nextFireMemo(memo, NONE, NONE, 380, exists)).toBeNull();
    expect(nextFireMemo(memo, NONE, NONE, 350, () => false)).toBeNull();
  });
  it('Brand läuft weiter: Merkstruktur unverändert', () => {
    expect(nextFireMemo(null, fire(), fire(), 150, exists)).toBeNull();
  });
});

describe('frameInputs (M6-AK-U3-05)', () => {
  it('Krise vor Stimmung, dasselbe Wetter an Render und Umgebung', () => {
    const fx = crisisFx(storm('active', 100), 400, null);
    const r = frameInputs(fx, { kind: 'cloudy', w: 0.3 });
    expect(r.render.weather).toEqual({ kind: 'storm', w: 1 });
    expect(r.ambience.weather).toBe(r.render.weather);
  });
  it('Stimmung ohne Krise durchgereicht; Feuer an die Umgebung', () => {
    const r = frameInputs(crisisFx(NONE, 0, null), { kind: 'cloudy', w: 0.3 });
    expect(r.render.weather).toEqual({ kind: 'cloudy', w: 0.3 });
    const f = frameInputs(crisisFx(fire(), 100, null), null);
    expect(f.ambience.fire).toBe(1);
    expect(f.render.fire).toEqual([{ id: 7, flames: 1, smoke: 1 }]);
    expect(f.render.weather).toEqual({ kind: 'clear', w: 0 });
  });
});
