import { describe, expect, it } from 'vitest';
import {
  SHORTAGE_FIGURE_S,
  SHORTAGE_GLOBAL_S,
  SHORTAGE_PEAK,
  SHORTAGE_PER_GOOD_S,
  SHORTAGE_VOICES,
  WORK_FALLBACK,
  WORK_GLOBAL_MS,
  WORK_GROUPS,
  WORK_PEAK_MAX,
  WORK_PER_KIND_MS,
  WORK_SOUND_OF,
  shortageVoice,
  workGroupName,
} from '../../src/audio/economySounds';
import { createSound } from '../../src/audio/sound';
import { BUILDING_DEFS, BUILDING_IDS } from '../../src/sim/defs/buildings';

interface FakeNode {
  gain: { value: number };
  target?: unknown;
  [k: string]: unknown;
}

function fakeCtx() {
  const log = {
    nodes: 0,
    gains: [] as FakeNode[],
    oscs: [] as FakeNode[],
    freqs: [] as number[],
    types: [] as string[],
    peaks: [] as number[],
  };
  const param = (isFreq = false) => ({
    value: 1,
    cancelScheduledValues() {},
    setValueAtTime(v: number) {
      if (isFreq) log.freqs.push(v);
    },
    linearRampToValueAtTime(v: number) {
      log.peaks.push(v);
    },
    exponentialRampToValueAtTime() {},
  });
  const node = () => {
    log.nodes += 1;
    const n: FakeNode = {
      connect(t: unknown) {
        n.target = t;
        return t;
      },
      disconnect() {},
      start() {},
      stop() {},
      gain: param(),
      frequency: param(true),
      Q: param(),
      type: 'sine',
    };
    return n;
  };
  const ctx = {
    currentTime: 0,
    destination: {},
    sampleRate: 44100,
    createGain: () => {
      const g = node();
      log.gains.push(g);
      return g;
    },
    createOscillator: () => {
      const o = node();
      log.oscs.push(o);
      return o;
    },
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

describe('Mangelton: Daten', () => {
  it('unbekanntes Gut und Prototyp-Namen fallen auf die Grundstimme', () => {
    expect(shortageVoice('xyz')).toBe(shortageVoice('constructor'));
    expect(shortageVoice('food').f1).toBeGreaterThan(shortageVoice('xyz').f1);
  });
  it('tiefer Doppelton, kein Sägezahn', () => {
    for (const v of [...Object.values(SHORTAGE_VOICES), shortageVoice('?')]) {
      expect(v.f1).toBeGreaterThanOrEqual(150);
      expect(v.f1).toBeLessThanOrEqual(300);
      expect(v.f2).toBeLessThan(v.f1);
      expect(v.type).not.toBe('sawtooth');
      expect(v.type).not.toBe('square');
    }
  });
});

describe('playShortage', () => {
  it('zwei Töne über den Effekte-Bus, Pegel SHORTAGE_PEAK', () => {
    const { s, log } = setup();
    s.unlock();
    const effects = log.gains[1]!;
    const o0 = log.oscs.length;
    const g0 = log.gains.length;
    const p0 = log.peaks.length;
    s.playShortage('food');
    expect(log.oscs.length - o0).toBe(2);
    const voiceGains = log.gains.slice(g0);
    expect(voiceGains.length).toBe(2);
    for (const g of voiceGains) expect(g.target).toBe(effects);
    expect(log.freqs.slice(-2)).toEqual([shortageVoice('food').f1, shortageVoice('food').f2]);
    expect(Math.max(...log.peaks.slice(p0, p0 + 2))).toBeCloseTo(SHORTAGE_PEAK, 9);
    expect(SHORTAGE_PEAK).toBeLessThan(0.35);
  });
  it('duckt Musik und Umgebung', () => {
    const { s, raw } = setup();
    s.unlock();
    s.playShortage('food');
    raw.currentTime = 0.2;
    expect(s.debugState().duck).toBe(0.5);
    raw.currentTime = SHORTAGE_FIGURE_S + 5;
    expect(s.debugState().duck).toBe(1);
  });
  it('je Gut höchstens einmal je SHORTAGE_PER_GOOD_S', () => {
    const { s, log, raw } = setup();
    s.unlock();
    s.playShortage('food');
    let n = log.nodes;
    raw.currentTime = SHORTAGE_PER_GOOD_S - 1;
    s.playShortage('food');
    expect(log.nodes).toBe(n);
    raw.currentTime = SHORTAGE_PER_GOOD_S + 0.5;
    s.playShortage('food');
    expect(log.nodes).toBeGreaterThan(n);
    n = log.nodes;
    raw.currentTime += 1; // gleiches Gut kurz danach: wieder gesperrt
    s.playShortage('food');
    expect(log.nodes).toBe(n);
  });
  it('global mindestens SHORTAGE_GLOBAL_S Abstand, auch für andere Güter', () => {
    const { s, log, raw } = setup();
    s.unlock();
    s.playShortage('food');
    const n = log.nodes;
    raw.currentTime = SHORTAGE_GLOBAL_S - 1;
    s.playShortage('cloth');
    expect(log.nodes).toBe(n);
    raw.currentTime = SHORTAGE_GLOBAL_S + 0.5;
    s.playShortage('cloth');
    expect(log.nodes).toBeGreaterThan(n);
  });
  it('Krisen-Signal hat Vorrang: verworfen, verbraucht die Entprellung nicht', () => {
    for (const ev of ['alarm', 'stormWarning'] as const) {
      const { s, log, raw } = setup();
      s.unlock();
      s.play(ev);
      raw.currentTime = 1;
      const n = log.nodes;
      s.playShortage('food');
      expect(log.nodes, ev).toBe(n);
      raw.currentTime = 2.1; // Figur (2,0 s) vorbei
      s.playShortage('food');
      expect(log.nodes, ev).toBeGreaterThan(n);
    }
  });
  it('Effekte-Regler 0: Bus-Gain 0; stumm, vor unlock, nach dispose: keine Stimme, kein Wurf', () => {
    const a = setup();
    a.s.unlock();
    a.s.setBus('effects', 0);
    a.s.playShortage('food');
    expect(a.log.gains[1]!.gain.value).toBe(0);
    const b = setup(true);
    b.s.unlock();
    const n = b.log.nodes;
    b.s.playShortage('food');
    expect(b.log.nodes).toBe(n);
    const c = setup();
    expect(() => c.s.playShortage('food')).not.toThrow();
    expect(c.log.nodes).toBe(0);
    const d = setup();
    d.s.unlock();
    d.s.dispose();
    const m = d.log.nodes;
    expect(() => d.s.playShortage('food')).not.toThrow();
    expect(d.log.nodes).toBe(m);
    expect(() => a.s.playShortage(undefined as unknown as string)).not.toThrow();
  });
});

describe('Arbeitston: Daten', () => {
  it('jede produzierende Art hat eine Gruppe; Rückfall für Unbekanntes', () => {
    for (const id of BUILDING_IDS.filter((b) => BUILDING_DEFS[b].produces))
      expect(WORK_SOUND_OF[id], id).toBeDefined();
    for (const g of Object.values(WORK_SOUND_OF)) expect(WORK_GROUPS[g]).toBeDefined();
    expect(workGroupName('xyz')).toBe(WORK_FALLBACK);
    expect(workGroupName('constructor')).toBe(WORK_FALLBACK);
  });
  it('sehr kurz und leise', () => {
    for (const g of Object.values(WORK_GROUPS)) {
      for (const st of g.steps) {
        expect(st.at + st.dur).toBeLessThanOrEqual(0.12 + 1e-9);
        expect(st.peak).toBeLessThanOrEqual(WORK_PEAK_MAX);
      }
    }
    expect(WORK_PEAK_MAX).toBeLessThanOrEqual(0.025);
  });
});

describe('playWork', () => {
  it('Stimmen laufen über den Effekte-Bus, Pegel unter WORK_PEAK_MAX * 0,5, duckt nicht', () => {
    const { s, log, raw } = setup();
    s.unlock();
    const effects = log.gains[1]!;
    const g0 = log.gains.length;
    const p0 = log.peaks.length;
    s.playWork('lumberjack');
    expect(log.gains.length).toBeGreaterThan(g0);
    for (const g of log.gains.slice(g0)) expect(g.target).toBe(effects);
    expect(Math.max(...log.peaks.slice(p0))).toBeLessThanOrEqual(WORK_PEAK_MAX * 0.5 + 1e-12);
    raw.currentTime = 0.01;
    expect(s.debugState().duck).toBe(1);
  });
  it('jede Art erzeugt Knoten', () => {
    for (const k of [
      'lumberjack',
      'quarry',
      'fisher',
      'weaver',
      'toolmaker',
      'glassworks',
      'distillery',
      'zzz',
    ]) {
      const { s, log } = setup();
      s.unlock();
      const n = log.nodes;
      s.playWork(k);
      expect(log.nodes, k).toBeGreaterThan(n);
    }
  });
  it('global mindestens WORK_GLOBAL_MS Abstand; Überzählige werden verworfen, nicht aufgeschoben', () => {
    const { s, log, raw } = setup();
    s.unlock();
    s.playWork('lumberjack');
    const n = log.nodes;
    raw.currentTime = (WORK_GLOBAL_MS - 50) / 1000;
    s.playWork('quarry');
    expect(log.nodes).toBe(n);
    raw.currentTime = (WORK_GLOBAL_MS - 50) / 1000 + 0.04; // noch immer vom Start aus gemessen < 700
    s.playWork('quarry');
    expect(log.nodes).toBe(n);
    raw.currentTime = WORK_GLOBAL_MS / 1000 + 0.01;
    s.playWork('quarry');
    expect(log.nodes).toBeGreaterThan(n);
  });
  it('je Art mindestens WORK_PER_KIND_MS', () => {
    const { s, log, raw } = setup();
    s.unlock();
    s.playWork('lumberjack');
    raw.currentTime = 1; // global frei, Art gesperrt
    const n = log.nodes;
    s.playWork('lumberjack');
    expect(log.nodes).toBe(n);
    raw.currentTime = WORK_PER_KIND_MS / 1000 + 0.01;
    s.playWork('lumberjack');
    expect(log.nodes).toBeGreaterThan(n);
  });
  it('Dauerlast: 20 Betriebe, Aufruf alle 50 ms über 10 s ergibt höchstens 1,43 Töne/s', () => {
    const { s, log, raw } = setup();
    s.unlock();
    const kinds = Array.from({ length: 20 }, (_, i) => `k${i}`);
    let played = 0;
    for (let t = 0; t < 10; t += 0.05) {
      raw.currentTime = t;
      const o = log.oscs.length + log.nodes;
      s.playWork(kinds[Math.floor(t * 20) % 20]!);
      if (log.oscs.length + log.nodes > o) played += 1;
    }
    expect(played).toBeLessThanOrEqual(Math.ceil(10 / (WORK_GLOBAL_MS / 1000)));
  });
  it('Effekte-Regler 0: Bus-Gain 0; stumm, vor unlock, nach dispose: kein Knoten, kein Wurf', () => {
    const a = setup();
    a.s.unlock();
    a.s.setBus('effects', 0);
    a.s.playWork('lumberjack');
    expect(a.log.gains[1]!.gain.value).toBe(0);
    const b = setup(true);
    b.s.unlock();
    const n = b.log.nodes;
    b.s.playWork('lumberjack');
    expect(b.log.nodes).toBe(n);
    const c = setup();
    expect(() => c.s.playWork('lumberjack')).not.toThrow();
    expect(c.log.nodes).toBe(0);
    const d = setup();
    d.s.unlock();
    d.s.dispose();
    const m = d.log.nodes;
    expect(() => d.s.playWork('lumberjack')).not.toThrow();
    expect(d.log.nodes).toBe(m);
    expect(() => a.s.playWork(undefined as unknown as string)).not.toThrow();
  });
});
