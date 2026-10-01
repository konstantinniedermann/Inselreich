import { describe, expect, it } from 'vitest';
import { parseDevParams, parseIdList } from '../../src/ui/devParams';

describe('parseDevParams', () => {
  it('AK-U1-07 Vorschau-Parser', () => {
    expect(parseDevParams('?wetter=sturm&w=1&feuer=12&boom=1&signal=alarm', true)).toEqual({
      weather: { kind: 'storm', w: 1 },
      fireIds: [12],
      boom: true,
      signal: 'alarm',
    });
    expect(parseDevParams('?wetter=sturm&feuer=12', false)).toEqual({});
    expect(parseDevParams('?perf=1', true)).toEqual({ perf: true });
  });

  it('M7-ISO raster=1 nur im Dev-Build', () => {
    expect(parseDevParams('?raster=1', true)).toEqual({ raster: true });
    expect(parseDevParams('?raster=1', false)).toEqual({});
  });

  it('RF-3b unsinnige Vorschau-Werte', () => {
    expect(parseDevParams('?wetter=regen&w=2', true).weather).toEqual({ kind: 'rain', w: 1 });
    expect(parseDevParams('?wetter=regen&w=-1', true).weather).toEqual({ kind: 'rain', w: 0 });
    expect(parseDevParams('?wetter=hagel&feuer=abc&signal=x', true)).toEqual({});
    expect(parseDevParams('?wetter=klar&w=abc', true).weather).toEqual({ kind: 'clear', w: 1 });
    expect(parseDevParams('?feuer=-3&geloescht=1.5', true)).toEqual({});
  });

  it('w fehlt gibt 1; geloescht und Wetterarten', () => {
    expect(parseDevParams('?wetter=wolkig&geloescht=4', true)).toEqual({
      weather: { kind: 'cloudy', w: 1 },
      extinguishedId: 4,
    });
  });

  it('R111 feuer als Liste: mehrere Ids, ungültige und doppelte entfallen', () => {
    expect(parseDevParams('?feuer=3,7,12', true)).toEqual({ fireIds: [3, 7, 12] });
    expect(parseDevParams('?feuer=3,x,3, 8 ,-1,', true)).toEqual({ fireIds: [3, 8] });
    expect(parseDevParams('?feuer=,', true)).toEqual({});
    expect(parseIdList(null)).toEqual([]);
  });
});
