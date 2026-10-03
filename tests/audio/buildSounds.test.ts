import { describe, expect, it } from 'vitest';
import {
  BUILD_FALLBACK,
  BUILD_GROUPS,
  BUILD_PEAK_MAX,
  BUILD_SOUND_OF,
  buildGroupName,
} from '../../src/audio/buildSounds';
import { createSound } from '../../src/audio/sound';
import { BUILDING_IDS } from '../../src/sim/defs/buildings';

function fakeCtx() {
  const log = { nodes: 0, peaks: [] as number[] };
  const param = () => ({
    value: 1,
    cancelScheduledValues() {},
    setValueAtTime() {},
    linearRampToValueAtTime(v: number) {
      log.peaks.push(v);
    },
    exponentialRampToValueAtTime() {},
  });
  const node = () => {
    log.nodes += 1;
    const n: Record<string, unknown> = {
      connect: (t: unknown) => t,
      disconnect() {},
      start() {},
      stop() {},
      gain: param(),
      frequency: param(),
      Q: param(),
    };
    return n;
  };
  const ctx = {
    currentTime: 0,
    destination: {},
    sampleRate: 44100,
    createGain: node,
    createOscillator: node,
    createBufferSource: node,
    createBiquadFilter: node,
    createBuffer: (_c: number, len: number) => ({ getChannelData: () => new Float32Array(len) }),
    resume: () => Promise.resolve(),
    suspend: () => Promise.resolve(),
    close: () => Promise.resolve(),
  };
  return { ctx: ctx as unknown as AudioContext, raw: ctx, log };
}

const io = {
  baseUrl: '/',
  fetchBuffer: () => Promise.reject(new Error('404')),
  mediaFactory: (): never => {
    throw new Error('kein Media-Element im Test');
  },
};

function setup(muted = false) {
  const f = fakeCtx();
  const s = createSound({ muted }, () => f.ctx, io);
  return { ...f, s };
}

describe('Bau-Klanggruppen: Zuordnung', () => {
  it('deckt alle Gebäude-Ids und den Weg ab (M11 S2)', () => {
    // Jagdhütte und Rinderfarm haben bis zur Audio-Runde keine eigene Gruppe: Rückfall (Spec 3.1)
    const fallback = ['hunter', 'cattlefarm'];
    for (const id of BUILDING_IDS.filter((b) => !fallback.includes(b)))
      expect(BUILD_SOUND_OF[id], id).toBeDefined();
    expect(BUILD_SOUND_OF.road).toBeDefined();
    for (const id of fallback) expect(buildGroupName(id), id).toBe(BUILD_FALLBACK);
  });
  it('verweist nur auf vorhandene Gruppen', () => {
    for (const g of Object.values(BUILD_SOUND_OF)) expect(BUILD_GROUPS[g]).toBeDefined();
  });
  it('unbekannte Id und Prototyp-Namen fallen auf den Rückfall', () => {
    expect(buildGroupName('xyz')).toBe(BUILD_FALLBACK);
    expect(buildGroupName('constructor')).toBe(BUILD_FALLBACK);
    expect(buildGroupName('')).toBe(BUILD_FALLBACK);
  });
  it('Pegel liegen höchstens auf dem bisherigen build-Pegel', () => {
    for (const g of Object.values(BUILD_GROUPS)) {
      for (const st of g.steps) expect(st.peak).toBeLessThanOrEqual(BUILD_PEAK_MAX);
    }
  });
});

describe('playBuild', () => {
  it('jede Gruppe erzeugt Knoten', () => {
    for (const kind of ['lumberjack', 'quarry', 'fisher', 'chapel', 'road']) {
      const { s, log } = setup();
      s.unlock();
      const before = log.nodes;
      s.playBuild(kind);
      expect(log.nodes, kind).toBeGreaterThan(before);
    }
  });
  it('Pegel auf dem Bus bleiben unter dem bisherigen build', () => {
    const { s, log } = setup();
    s.unlock();
    for (const g of Object.keys(BUILD_SOUND_OF)) {
      s.playBuild(g);
    }
    expect(Math.max(0, ...log.peaks.filter((p) => p < 1))).toBeLessThanOrEqual(
      BUILD_PEAK_MAX * 0.5 + 1e-12,
    );
  });
  it('unbekannte Id spielt den Rückfall', () => {
    const { s, log } = setup();
    s.unlock();
    const a = log.nodes;
    s.playBuild('gibt-es-nicht');
    const used = log.nodes - a;
    const b = setup();
    b.s.unlock();
    const c = b.log.nodes;
    b.s.playBuild('lumberjack');
    expect(used).toBe(b.log.nodes - c);
  });
  it('Drosselung je Gruppe, danach wieder hörbar', () => {
    const { s, log, raw } = setup();
    s.unlock();
    s.playBuild('road');
    const n = log.nodes;
    s.playBuild('road');
    expect(log.nodes).toBe(n);
    s.playBuild('chapel'); // andere Gruppe: nicht gedrosselt
    expect(log.nodes).toBeGreaterThan(n);
    raw.currentTime = BUILD_GROUPS.gravel.throttleMs / 1000 + 0.01;
    const m = log.nodes;
    s.playBuild('road');
    expect(log.nodes).toBeGreaterThan(m);
  });
  it('vor unlock, stumm und nach dispose: kein Knoten, kein Wurf', () => {
    const a = setup();
    expect(() => a.s.playBuild('road')).not.toThrow();
    expect(a.log.nodes).toBe(0);
    const b = setup(true);
    b.s.unlock();
    const n = b.log.nodes;
    b.s.playBuild('road');
    expect(b.log.nodes).toBe(n);
    const c = setup();
    c.s.unlock();
    c.s.dispose();
    const m = c.log.nodes;
    expect(() => c.s.playBuild('road')).not.toThrow();
    expect(c.log.nodes).toBe(m);
  });
  it('ungültige Art wirft nicht', () => {
    const { s } = setup();
    s.unlock();
    expect(() => s.playBuild(undefined as unknown as string)).not.toThrow();
  });
});
