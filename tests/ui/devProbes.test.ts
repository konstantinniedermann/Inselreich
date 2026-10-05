import { afterEach, describe, expect, it, vi } from 'vitest';
import { createPerfProbe, exposeDevProbe, summarize } from '../../src/ui/devProbes';

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

describe('M12 E1 Leistungssonde', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });
  it('frameMax lässt Notfall-Frames aus, emergencyFrames zählt sie', () => {
    const fakeWindow: Record<string, unknown> = {};
    vi.stubGlobal('window', fakeWindow);
    vi.spyOn(console, 'info').mockImplementation(() => {});
    const p = createPerfProbe();
    p.frame(0);
    p.frame(16);
    p.frame(32, false, 0);
    p.frame(132, false, 1); // Abstand 100 ms: Frame davor war kein Notfall
    p.frame(232, true, 1); // Abstand 100 ms, aber Notfall-Frame davor: nicht in frameMax
    p.frame(250, false, 1);
    p.renderDone(1);
    const perf = fakeWindow.__inselPerf as { frameMax: number; emergencyFrames: number };
    expect(perf.frameMax).toBe(100);
    expect(perf.emergencyFrames).toBe(1);
    p.frame(260, false, 2);
    p.frame(460, true, 2); // 200 ms wegen Notfall: ausgelassen
    p.renderDone(1);
    const after = fakeWindow.__inselPerf as { frameMax: number; emergencyFrames: number };
    expect(after.frameMax).toBe(100);
    expect(after.emergencyFrames).toBe(2);
  });
});
