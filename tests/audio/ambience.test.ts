import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AMBIENCE_MIN_INTERVAL_MS,
  createAmbienceEngine,
  CROSSFADE_S,
  GLIDE_S,
  IDLE_STOP_S,
  ambienceMix,
  createLoopPlayer,
} from '../../src/audio/ambience';
import { assetUrl, LAYER_FILES, MANIFEST, SFX_FILES } from '../../src/audio/manifest';
import type { AmbienceInput, Layer, ViewStats } from '../../src/audio/mix';
import { createSound } from '../../src/audio/sound';

const view = (o: Partial<ViewStats>): ViewStats => ({
  water: 0,
  green: 0,
  forest: 0,
  rock: 0,
  coast: 0,
  inhabitants: 0,
  zoom: 1,
  ...o,
});
const CLEAR = { kind: 'clear', w: 0 } as const;

describe('ambienceMix', () => {
  it.each([
    [
      'Küste nah',
      { view: view({ water: 0.6, coast: 0.3, green: 0.1, zoom: 2 }), phase: 'day', weather: CLEAR },
      {
        sea: 0.74,
        wind: 0.15,
        birds: 0.06,
        gulls: 0.15,
        night: 0,
        town: 0,
        rain: 0,
        storm: 0,
        fire: 0,
      },
    ],
    [
      'Stadt nah',
      {
        view: view({ green: 0.8, water: 0.2, inhabitants: 60, zoom: 2 }),
        phase: 'day',
        weather: CLEAR,
      },
      {
        sea: 0.48,
        wind: 0.15,
        birds: 0.48,
        gulls: 0,
        night: 0,
        town: 1,
        rain: 0,
        storm: 0,
        fire: 0,
      },
    ],
    [
      'weit',
      {
        view: view({ water: 0.7, green: 0.3, inhabitants: 30, zoom: 0.5 }),
        phase: 'day',
        weather: CLEAR,
      },
      {
        sea: 0.805,
        wind: 0.5,
        birds: 0.18,
        gulls: 0,
        night: 0,
        town: 0.15,
        rain: 0,
        storm: 0,
        fire: 0,
      },
    ],
    [
      'Nacht',
      {
        view: view({ green: 0.5, forest: 0.5, inhabitants: 60, zoom: 2 }),
        phase: 'night',
        weather: CLEAR,
      },
      {
        sea: 0.35,
        wind: 0.15,
        birds: 0,
        gulls: 0,
        night: 0.5,
        town: 0.3,
        rain: 0,
        storm: 0,
        fire: 0,
      },
    ],
    [
      'Morgen',
      { view: view({ green: 1, coast: 0, zoom: 1.25 }), phase: 'morning', weather: CLEAR },
      {
        sea: 0.35,
        wind: 0.325,
        birds: 0.6,
        gulls: 0,
        night: 0,
        town: 0,
        rain: 0,
        storm: 0,
        fire: 0,
      },
    ],
    [
      'Regen',
      { view: view({ water: 1, zoom: 2 }), phase: 'day', weather: { kind: 'rain', w: 1 } },
      { sea: 1, wind: 0.15, birds: 0, gulls: 0, night: 0, town: 0, rain: 0.7, storm: 0, fire: 0 },
    ],
    [
      'Sturm',
      { view: view({ water: 1, zoom: 2 }), phase: 'day', weather: { kind: 'storm', w: 1 } },
      { sea: 1, wind: 0.65, birds: 0, gulls: 0, night: 0, town: 0, rain: 0.7, storm: 0.8, fire: 0 },
    ],
    [
      'Feuer',
      { view: view({ green: 1, zoom: 2 }), phase: 'evening', weather: CLEAR, fire: 1 },
      {
        sea: 0.35,
        wind: 0.15,
        birds: 0,
        gulls: 0,
        night: 0.25,
        town: 0,
        rain: 0,
        storm: 0,
        fire: 1,
      },
    ],
  ])('AK-A2-01 %s', (_n, input, want) => {
    const got = ambienceMix(input as AmbienceInput);
    for (const k of Object.keys(want) as Layer[]) expect(got[k], k).toBeCloseTo(want[k], 9);
  });

  it('AK-A2-01 Bewölkung hebt den Wind, Klar und Regen nicht', () => {
    const base = { view: view({ zoom: 2 }), phase: 'day' } as const;
    const cloudy = ambienceMix({ ...base, weather: { kind: 'cloudy', w: 1 } });
    expect(cloudy.wind).toBeCloseTo(0.65, 9);
    expect(cloudy.rain).toBe(0);
  });

  it('AK-A2-01 alle Werte in 0…1 bei extremen Eingaben', () => {
    for (const phase of ['day', 'evening', 'night', 'morning'] as const) {
      for (const kind of ['clear', 'cloudy', 'rain', 'storm'] as const) {
        const got = ambienceMix({
          view: view({
            water: 5,
            green: 5,
            forest: 5,
            coast: 5,
            inhabitants: 1e6,
            zoom: 10,
          }),
          phase,
          weather: { kind, w: 5 },
          fire: 9,
        });
        for (const v of Object.values(got)) {
          expect(v).toBeGreaterThanOrEqual(0);
          expect(v).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  it('AK-A2-01 NaN und negative Eingaben ergeben gültige Pegel', () => {
    const got = ambienceMix({
      view: view({ water: Number.NaN, green: -3, inhabitants: Number.NaN, zoom: Number.NaN }),
      phase: 'day',
      weather: { kind: 'storm', w: Number.NaN },
    });
    for (const v of Object.values(got)) expect(Number.isFinite(v) && v >= 0 && v <= 1).toBe(true);
  });
});

// Fake-AudioContext mit Protokoll von Quellen, Gains und Rampen.
interface FakeSource {
  buffer: { duration: number; tag: number } | null;
  startedAt: number | null;
  stopped: boolean;
  onended: (() => void) | null;
  [k: string]: unknown;
}

function fake() {
  const sources: FakeSource[] = [];
  const ramps: Array<{ node: string; to: number; at: number; kind: string }> = [];
  const targets: Array<{ node: string; v: number; tc: number }> = [];
  let nodes = 0;
  let gainCount = 0;
  const param = (name: string) => ({
    value: 1,
    cancelScheduledValues() {},
    setValueAtTime() {},
    linearRampToValueAtTime(to: number, at: number) {
      ramps.push({ node: name, to, at, kind: 'linear' });
    },
    exponentialRampToValueAtTime() {},
    setTargetAtTime(v: number, _t: number, tc: number) {
      targets.push({ node: name, v, tc });
    },
  });
  const node = (name = 'n') => {
    nodes += 1;
    const n: Record<string, unknown> = {
      connect: (t: unknown) => t,
      disconnect() {},
      start() {},
      stop() {},
      gain: param(name),
      frequency: param(name),
      Q: param(name),
      type: 'sine',
      buffer: null,
      loop: false,
    };
    return n;
  };
  const ctx = {
    currentTime: 0,
    sampleRate: 44100,
    destination: {},
    createGain: () => node(`g${gainCount++}`),
    createOscillator: () => node(),
    createBiquadFilter: () => node(),
    createBufferSource: () => {
      const s = node() as unknown as FakeSource;
      s.startedAt = null;
      s.stopped = false;
      s.onended = null;
      s.start = ((at?: number) => {
        s.startedAt = at ?? ctx.currentTime;
      }) as unknown as FakeSource['start'];
      s.stop = (() => {
        s.stopped = true;
      }) as unknown as FakeSource['stop'];
      sources.push(s);
      return s;
    },
    createBuffer: (_c: number, len: number) => ({ getChannelData: () => new Float32Array(len) }),
    decodeAudioData: (ab: ArrayBuffer) => Promise.resolve({ duration: 20, tag: ab.byteLength }),
    resume: () => Promise.resolve(),
    suspend: () => Promise.resolve(),
    close: () => Promise.resolve(),
  };
  return {
    ctx: ctx as unknown as AudioContext,
    raw: ctx,
    sources,
    ramps,
    targets,
    nodes: () => nodes,
  };
}

function fakeIo(mode: 'ok' | 'reject' = 'ok') {
  const fetched: string[] = [];
  return {
    fetched,
    mode,
    baseUrl: '/',
    fetchBuffer(url: string) {
      fetched.push(url);
      return this.mode === 'ok'
        ? Promise.resolve(new ArrayBuffer(fetched.length))
        : Promise.reject(new Error('404'));
    },
    mediaFactory(): never {
      throw new Error('kein Media-Element in A2');
    },
  };
}

const buffer = (duration: number) => ({ duration }) as unknown as AudioBuffer;

describe('Schleifen-Player', () => {
  it('AK-A2-02 Konstanten', () => {
    expect([GLIDE_S, CROSSFADE_S, IDLE_STOP_S, AMBIENCE_MIN_INTERVAL_MS]).toEqual([
      1.5, 1.5, 10, 250,
    ]);
  });

  it('AK-A2-02 zweite Quelle startet 1,5 s vor Ende der ersten, lineare Überblendung', () => {
    const f = fake();
    const p = createLoopPlayer(f.ctx, buffer(20), {} as AudioNode);
    p.start(0);
    expect(f.sources.map((s) => s.startedAt)).toEqual([0, 18.5]);
    expect(f.ramps).toContainEqual({ node: 'g0', to: 0, at: 20, kind: 'linear' });
    expect(f.ramps).toContainEqual({ node: 'g1', to: 1, at: 20, kind: 'linear' });
  });

  it('AK-A2-02 onended der alten Quelle plant die übernächste, stop() beendet alles', () => {
    const f = fake();
    const p = createLoopPlayer(f.ctx, buffer(20), {} as AudioNode);
    p.start(0);
    f.sources[0]!.onended!();
    expect(f.sources.map((s) => s.startedAt)).toEqual([0, 18.5, 37]);
    p.stop();
    expect(f.sources.slice(1).every((s) => s.stopped)).toBe(true); // [0] ist schon beendet
    f.sources[1]!.onended!();
    expect(f.sources).toHaveLength(3);
    expect(() => p.start(5)).not.toThrow();
    expect(f.sources).toHaveLength(3);
  });

  it('AK-A2-02 doppeltes start() plant nichts doppelt', () => {
    const f = fake();
    const p = createLoopPlayer(f.ctx, buffer(20), {} as AudioNode);
    p.start(0);
    p.start(3);
    expect(f.sources).toHaveLength(2);
  });
});

describe('Umgebung im Ton', () => {
  const coast: AmbienceInput = {
    view: view({ water: 0.6, coast: 0.3, green: 0.1, zoom: 2 }),
    phase: 'day',
    weather: CLEAR,
  };
  const flush = async () => {
    for (let i = 0; i < 8; i++) await Promise.resolve();
  };
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const mk = (mode: 'ok' | 'reject' = 'ok') => {
    const f = fake();
    const io = fakeIo(mode);
    const s = createSound({ muted: false }, () => f.ctx, io);
    return { f, io, s };
  };
  const step = (f: ReturnType<typeof fake>, to: number) => {
    f.raw.currentTime = to;
    vi.advanceTimersByTime(300);
  };

  it('AK-A2-03 vor unlock kein fetchBuffer; danach nur für Schichten mit Pegel > 0', () => {
    const { f, io, s } = mk();
    s.setAmbience(coast);
    expect(io.fetched).toEqual([]);
    expect(f.nodes()).toBe(0);
    s.unlock();
    vi.advanceTimersByTime(300);
    s.setAmbience(coast);
    expect([...io.fetched].sort()).toEqual([
      '/audio/amb/birds.mp3',
      '/audio/amb/gulls.mp3',
      '/audio/amb/sea.mp3',
    ]);
    s.setAmbience(coast);
    vi.advanceTimersByTime(300);
    s.setAmbience(coast);
    expect(io.fetched).toHaveLength(3); // einmal je Schicht
  });

  it('AK-A2-03 Aufrufe innerhalb von 250 ms werden verworfen (Spec 11.2)', () => {
    const { f, io, s } = mk();
    s.unlock();
    vi.advanceTimersByTime(300);
    s.setAmbience(coast);
    vi.advanceTimersByTime(100);
    s.setAmbience({ ...coast, view: view({ green: 1, zoom: 2 }), phase: 'night' });
    expect(io.fetched).not.toContain('/audio/amb/crickets.mp3');
    expect(s.debugState().layers.night).toBe(0);
    step(f, 1);
    s.setAmbience({ ...coast, view: view({ green: 1, zoom: 2 }), phase: 'night' });
    expect(io.fetched).toContain('/audio/amb/crickets.mp3');
  });

  it('AK-A2-03 Zielpegel gleiten mit Zeitkonstante GLIDE_S / 3; debugState().layers = Ziele', () => {
    const { f, s } = mk();
    s.unlock();
    vi.advanceTimersByTime(300);
    s.setAmbience(coast);
    expect(f.targets.length).toBeGreaterThan(0);
    for (const t of f.targets) expect(t.tc).toBeCloseTo(GLIDE_S / 3, 9);
    const want = ambienceMix(coast);
    const got = s.debugState().layers;
    for (const k of Object.keys(want) as Layer[]) expect(got[k]).toBeCloseTo(want[k], 9);
  });

  it('AK-A2-03 fetchBuffer lehnt ab: Rückfall der Schicht, nichts wirft, kein zweiter Versuch', async () => {
    const { f, io, s } = mk('reject');
    s.unlock();
    vi.advanceTimersByTime(300);
    expect(() => s.setAmbience(coast)).not.toThrow();
    await flush();
    const n = f.nodes();
    step(f, 1);
    expect(() => s.setAmbience(coast)).not.toThrow();
    await flush();
    expect(io.fetched).toHaveLength(3);
    expect(f.sources.every((x) => x.buffer === null || x.buffer.tag === undefined)).toBe(true);
    expect(f.nodes()).toBeGreaterThanOrEqual(n); // Rückfall läuft weiter
  });

  it('AK-A2-03 decodeAudioData wirft: still Rückfall', async () => {
    const { f, s } = mk();
    (f.raw as { decodeAudioData: unknown }).decodeAudioData = () => {
      throw new Error('kaputt');
    };
    s.unlock();
    vi.advanceTimersByTime(300);
    expect(() => s.setAmbience(coast)).not.toThrow();
    await flush();
    expect(() => s.debugState()).not.toThrow();
  });

  it('AK-A2-03 fetchBuffer wirft synchron: nichts wirft', () => {
    const f = fake();
    const s = createSound({ muted: false }, () => f.ctx, {
      fetchBuffer: () => {
        throw new Error('sync');
      },
    });
    s.unlock();
    vi.advanceTimersByTime(300);
    expect(() => s.setAmbience(coast)).not.toThrow();
  });

  it('AK-A2-02 geladene Datei ersetzt den Rückfall durch den Schleifen-Player', async () => {
    const { f, io, s } = mk();
    s.unlock();
    vi.advanceTimersByTime(300);
    s.setAmbience(coast);
    await flush();
    const tag = io.fetched.indexOf('/audio/amb/birds.mp3') + 1;
    const birds = f.sources.filter((x) => x.buffer?.tag === tag);
    expect(birds.map((x) => x.startedAt)).toEqual([0, 18.5]);
  });

  it('AK-A2-02 Schicht mit Zielpegel 0 über mehr als 10 s ist gestoppt, Neustart bei Bedarf', async () => {
    const { f, io, s } = mk();
    s.unlock();
    vi.advanceTimersByTime(300);
    s.setAmbience(coast);
    await flush();
    const tag = io.fetched.indexOf('/audio/amb/birds.mp3') + 1;
    const birds = () => f.sources.filter((x) => x.buffer?.tag === tag);
    const noBirds = { ...coast, view: view({ water: 0.6, coast: 0.3, zoom: 2 }) };
    step(f, 1);
    s.setAmbience(noBirds); // Ziel 0 seit t = 1
    step(f, 10);
    s.setAmbience(noBirds); // 9 s: noch aktiv
    expect(birds().some((x) => x.stopped)).toBe(false);
    step(f, 11.5);
    s.setAmbience(noBirds); // 10,5 s: gestoppt
    expect(birds().length).toBeGreaterThan(0);
    expect(birds().every((x) => x.stopped)).toBe(true);
    const before = birds().length;
    step(f, 20);
    s.setAmbience(coast); // wieder gefragt: Neustart mit geladenem Puffer
    expect(birds().length).toBe(before + 2);
    expect(io.fetched.filter((u) => u.endsWith('birds.mp3'))).toHaveLength(1);
  });

  it('AK-A2-03 Stadt mit Hammer: FX2 wird erst bei town > 0,2 geladen und klingt in Abständen', async () => {
    const { f, io, s } = mk();
    s.unlock();
    vi.advanceTimersByTime(300);
    s.setAmbience(coast);
    expect(io.fetched).not.toContain('/audio/sfx/hammer.mp3');
    const town: AmbienceInput = {
      view: view({ green: 0.8, inhabitants: 60, zoom: 2 }),
      phase: 'day',
      weather: CLEAR,
    };
    step(f, 1);
    s.setAmbience(town);
    expect(io.fetched).toContain('/audio/sfx/hammer.mp3');
    await flush();
    const tag = io.fetched.indexOf('/audio/sfx/hammer.mp3') + 1;
    const hammers = () => f.sources.filter((x) => x.buffer?.tag === tag).length;
    step(f, 2);
    s.setAmbience(town);
    expect(hammers()).toBe(0); // Abstand 3–8 s noch nicht erreicht
    step(f, 20);
    s.setAmbience(town);
    expect(hammers()).toBe(1);
  });

  it('AK-A2-04 Signal-Sample lädt beim ersten Abspielen; bis dahin Rückfall, danach das Sample', async () => {
    const { f, io, s } = mk();
    s.unlock();
    expect(io.fetched).toEqual([]);
    const n0 = f.nodes();
    s.play('alarm');
    expect(f.nodes()).toBeGreaterThan(n0); // Rückfall sofort
    expect(io.fetched).toEqual(['/audio/sfx/bell.mp3']);
    await flush();
    f.raw.currentTime = 10;
    s.play('alarm');
    const tag = io.fetched.indexOf('/audio/sfx/bell.mp3') + 1;
    expect(f.sources.filter((x) => x.buffer?.tag === tag)).toHaveLength(1);
  });

  it.each(['alarm', 'stormWarning', 'boom'] as const)(
    'AK-A2-04 %s: Ablehnung fällt auf den Rückfall zurück, nichts wirft',
    async (e) => {
      const { f, io, s } = mk('reject');
      s.unlock();
      expect(() => s.play(e)).not.toThrow();
      await flush();
      f.raw.currentTime = 10;
      const n = f.nodes();
      expect(() => s.play(e)).not.toThrow();
      expect(f.nodes()).toBeGreaterThan(n);
      expect(io.fetched).toHaveLength(1);
    },
  );

  it('RF-5a nach dispose keine neuen Knoten, kein Fetch, kein Wurf', async () => {
    const { f, io, s } = mk();
    s.unlock();
    s.dispose();
    const n = f.nodes();
    vi.advanceTimersByTime(300);
    expect(() => {
      s.setAmbience(coast);
      s.play('alarm');
    }).not.toThrow();
    await flush();
    expect(f.nodes()).toBe(n);
    expect(io.fetched).toEqual([]);
    expect(s.debugState().layers).toEqual({});
  });

  it('RF-5a Laden endet nach dispose: kein Start mehr', async () => {
    const { f, s } = mk();
    s.unlock();
    vi.advanceTimersByTime(300);
    s.setAmbience(coast);
    s.dispose();
    const n = f.nodes();
    await flush();
    expect(f.nodes()).toBe(n);
  });
});

describe('Manifest', () => {
  it('assetUrl setzt Basis und Datei zusammen', () => {
    expect(assetUrl('/', 'audio/amb/sea.mp3')).toBe('/audio/amb/sea.mp3');
    expect(assetUrl('/inselreich/', 'audio/amb/sea.mp3')).toBe('/inselreich/audio/amb/sea.mp3');
    expect(assetUrl('/inselreich', '/audio/amb/sea.mp3')).toBe('/inselreich/audio/amb/sea.mp3');
  });

  it('jede Schicht- und Signaldatei hat einen Eintrag mit Nachweisfeldern; IDs und Dateien eindeutig', () => {
    const files = new Set(MANIFEST.map((e) => e.file));
    for (const f of [...Object.values(LAYER_FILES), ...Object.values(SFX_FILES)]) {
      expect(files.has(f!), f).toBe(true);
    }
    expect(new Set(MANIFEST.map((e) => e.id)).size).toBe(MANIFEST.length);
    expect(files.size).toBe(MANIFEST.length);
    expect(MANIFEST.map((e) => e.id)).toEqual(
      expect.arrayContaining([
        'AM1',
        'AM2',
        'AM3',
        'AM4',
        'AM5',
        'AM6',
        'AM7',
        'SG1',
        'SG2',
        'FX1',
        'FX2',
      ]),
    );
    for (const e of MANIFEST) {
      expect(e.title && e.author && e.license && e.link.startsWith('https://')).toBeTruthy();
      expect(e.file.startsWith('/')).toBe(false);
    }
  });
});

describe('Fix-Runde A2 (Drossel, Vorlauf, Warteliste)', () => {
  const flush = async () => {
    for (let i = 0; i < 8; i++) await Promise.resolve();
  };
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());
  const calm: AmbienceInput = { view: view({ water: 0.6, zoom: 2 }), phase: 'day', weather: CLEAR };
  const stormy: AmbienceInput = { ...calm, weather: { kind: 'storm', w: 1 } };

  it('250-ms-Takt mit ±20 ms Jitter: alle Aufrufe werden angenommen, unter 200 ms verworfen', () => {
    const f = fake();
    const s = createSound({ muted: false }, () => f.ctx, fakeIo('reject'));
    s.unlock();
    s.setAmbience(calm);
    expect(s.debugState().layers.storm ?? 0).toBe(0);
    const gaps = [230, 270, 235, 265, 250, 228, 272];
    gaps.forEach((g, i) => {
      vi.advanceTimersByTime(g);
      s.setAmbience(i % 2 === 0 ? stormy : calm);
      const storm = s.debugState().layers.storm ?? 0;
      if (i % 2 === 0) expect(storm, `Aufruf ${i}`).toBeGreaterThan(0);
      else expect(storm, `Aufruf ${i}`).toBe(0);
    });
    vi.advanceTimersByTime(190); // zu früh: verworfen
    s.setAmbience(calm);
    expect(s.debugState().layers.storm ?? 0).toBeGreaterThan(0);
  });

  it('Rückfall-Planung ist bei 500-ms-Kadenz lückenlos (Funken knistern bis zum nächsten Takt)', () => {
    const f = fake();
    const s = createSound({ muted: false }, () => f.ctx, fakeIo('reject'));
    s.unlock();
    const burning: AmbienceInput = { ...calm, fire: 1 };
    for (let k = 0; k < 20; k++) {
      f.raw.currentTime = k * 0.5;
      vi.advanceTimersByTime(500);
      s.setAmbience(burning);
      const latest = Math.max(...f.sources.map((x) => x.startedAt ?? -1));
      expect(latest, `Takt ${k}`).toBeGreaterThanOrEqual(k * 0.5 + 0.5);
    }
  });

  it('Warte-Callback je Schicht nur einmal angehängt', async () => {
    const f = fake();
    const requests: string[] = [];
    const loader = {
      get: () => null,
      request: (file: string, then?: unknown) => {
        if (then) requests.push(file);
      },
      dispose() {},
    };
    const eng = createAmbienceEngine({
      ctx: f.ctx,
      dest: {} as AudioNode,
      noise: {} as AudioBuffer,
      loader,
    });
    for (let k = 0; k < 30; k++) eng.update(ambienceMix(calm), k * 0.25);
    await flush();
    expect(requests.filter((r) => r.endsWith('sea.mp3'))).toHaveLength(1);
  });
});
