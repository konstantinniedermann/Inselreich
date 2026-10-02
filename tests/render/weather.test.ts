import { describe, expect, it } from 'vitest';
import { CLEAR, MOOD_MAX_W, gradeAt, pickWeather, weatherMul } from '../../src/render/weather';
import { lightAt, lumaOf, type WeatherKind } from '../../src/render/daynight';
import { CAPS, cap, fireTongues, rainStreaks } from '../../src/render/limits';

const KINDS: WeatherKind[] = ['clear', 'cloudy', 'rain', 'storm'];

describe('Wetter (Spec 6.4)', () => {
  it('AK-R3-01 Luma von gradeAt ≥ 0,60 für jede Art, w in 0,1-Schritten, jeden Tick', () => {
    for (const kind of KINDS)
      for (let k = 0; k <= 10; k++)
        for (let t = 0; t < 6000; t++)
          expect(lumaOf(gradeAt(t, { kind, w: k / 10 }))).toBeGreaterThanOrEqual(0.6);
  });

  it('AK-R3-01 clear gleicht lightAt; w = 0 gleicht clear für jede Art', () => {
    for (let t = 0; t < 6000; t += 7) {
      expect(gradeAt(t, CLEAR)).toEqual(lightAt(t).mul);
      for (const kind of KINDS) expect(gradeAt(t, { kind, w: 0 })).toEqual(lightAt(t).mul);
    }
  });

  it('AK-R3-01 dayNight false liefert nur die Wettertönung', () => {
    const w = { kind: 'storm' as const, w: 0.5 };
    expect(gradeAt(3000, w, false)).toEqual(weatherMul(w));
    expect(gradeAt(3000, CLEAR, false)).toEqual([1, 1, 1]);
  });

  it('RF-3c weatherMul klemmt w (NaN, −1, 2) und kennt nur bekannte Arten', () => {
    expect(weatherMul({ kind: 'storm', w: NaN })).toEqual([1, 1, 1]);
    expect(weatherMul({ kind: 'storm', w: -1 })).toEqual([1, 1, 1]);
    expect(weatherMul({ kind: 'storm', w: 2 })).toEqual(weatherMul({ kind: 'storm', w: 1 }));
    expect(weatherMul({ kind: 'hagel' as WeatherKind, w: 1 })).toEqual([1, 1, 1]);
  });

  it('AK-R3-04 Krisenwetter geht immer vor; ohne Krise und ohne Stimmung clear', () => {
    expect(pickWeather({ kind: 'storm', w: 1 }, { kind: 'cloudy', w: 0.3 })).toEqual({
      kind: 'storm',
      w: 1,
    });
    expect(pickWeather(null, null)).toEqual(CLEAR);
    expect(pickWeather(undefined, undefined)).toEqual(CLEAR);
    expect(pickWeather({ kind: 'rain', w: 7 }, null)).toEqual({ kind: 'rain', w: 1 });
  });

  it('RF-4 Stimmung höchstens cloudy mit w ≤ 0,4, nie rain/storm', () => {
    expect(pickWeather(null, { kind: 'storm', w: 1 })).toEqual(CLEAR);
    expect(pickWeather(null, { kind: 'rain', w: 0.2 })).toEqual(CLEAR);
    expect(pickWeather(null, { kind: 'cloudy', w: 0.9 })).toEqual({ kind: 'cloudy', w: 0.4 });
    expect(pickWeather(null, { kind: 'cloudy', w: NaN })).toEqual({ kind: 'cloudy', w: 0 });
    expect(MOOD_MAX_W).toBe(0.4);
  });
});

describe('Obergrenzen (Spec 12.2)', () => {
  it('Setzungen normal/reduziert', () => {
    expect(CAPS).toEqual({
      walkers: [40, 12],
      gulls: [8, 3],
      smoke: [150, 50],
      rain: [350, 100],
      fire: [24, 8],
      clouds: [6, 0],
      glitter: [30, 0],
      fish: [12, 4],
      whales: [1, 1],
      flocks: [3, 1],
    });
    expect(cap('walkers')).toBe(40);
    expect(cap('walkers', true)).toBe(12);
  });
  it('AK-R3-02 rainStreaks klemmt w und hält die Obergrenze', () => {
    for (const w of [NaN, -3, 0, 0.3, 1, 5]) {
      expect(rainStreaks(w)).toBeLessThanOrEqual(350);
      expect(rainStreaks(w, true)).toBeLessThanOrEqual(100);
      expect(Number.isInteger(rainStreaks(w))).toBe(true);
    }
    expect(rainStreaks(NaN)).toBe(0);
  });
  it('AK-R3-02 fireTongues: 0 bei flames = 0, sonst ≥ 1 und ≤ Obergrenze', () => {
    expect(fireTongues(0)).toBe(0);
    expect(fireTongues(0.01)).toBe(1);
    expect(fireTongues(9)).toBe(24);
    expect(fireTongues(NaN)).toBe(0);
  });
});
