import { afterEach, describe, expect, it, vi } from 'vitest';
import { exposeDevProbe, summarize } from '../../src/ui/devProbes';

describe('summarize', () => {
  it('Median und p95', () => {
    const v = Array.from({ length: 100 }, (_, i) => i + 1);
    expect(summarize(v)).toEqual({ median: 50, p95: 95 });
  });
  it('leer und ein Wert', () => {
    expect(summarize([])).toEqual({ median: 0, p95: 0 });
    expect(summarize([7])).toEqual({ median: 7, p95: 7 });
  });
  it('ändert die Eingabe nicht', () => {
    const v = [3, 1, 2];
    summarize(v);
    expect(v).toEqual([3, 1, 2]);
  });
});

describe('M10 Dev-Sonde', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });
  it('AK-U1-11 Dev-Sonde nur unter DEV: ohne DEV nichts an window, mit DEV __inselDev', () => {
    const fakeWindow: Record<string, unknown> = {};
    vi.stubGlobal('window', fakeWindow);
    const probe = { world: () => null, tileCenter: () => ({ x: 0, y: 0 }), centerOn: () => {} };
    vi.stubEnv('DEV', false);
    exposeDevProbe(probe as never);
    expect(fakeWindow.__inselDev).toBeUndefined();
    vi.stubEnv('DEV', true);
    exposeDevProbe(probe as never);
    expect(fakeWindow.__inselDev).toBe(probe);
  });
});
