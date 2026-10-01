// Umgebungsschichten (Spec 7.3): reine Mix-Funktion, Schleifen-Player, Sample-Lader und Schichten-Motor.
// Kein Import aus sim/render/ui. Pegel und Zeiten sind Darstellungswerte (Konstanten), keine Spielwerte.
// Nichts hier wirft nach aussen: Fehler fallen auf den synthetischen Rückfall zurück.
import { assetUrl, HAMMER_FILE, LAYER_FILES } from './manifest';
import type { AmbienceInput, Layer } from './mix';

export const GLIDE_S = 1.5;
export const CROSSFADE_S = 1.5;
export const IDLE_STOP_S = 10;
export const AMBIENCE_MIN_INTERVAL_MS = 250;
/** Annahmeschwelle der Drossel: der 250-ms-Takt der UI schwankt, darunter wird verworfen. */
export const AMBIENCE_ACCEPT_MS = 200;

export const LAYERS: readonly Layer[] = [
  'sea',
  'wind',
  'birds',
  'gulls',
  'night',
  'town',
  'rain',
  'storm',
  'fire',
];

/** Schichtpegel relativ zum Umgebungs-Bus (Mischung der Quellen untereinander). */
const LAYER_TRIM: Readonly<Record<Layer, number>> = {
  sea: 0.3,
  wind: 0.25,
  birds: 0.5,
  gulls: 0.5,
  night: 0.35,
  town: 0.4,
  rain: 0.5,
  storm: 0.6,
  fire: 0.5,
};
/** Startpegel der Meeresschicht vor dem ersten `setAmbience` (wie M5). */
const SEA_INITIAL = 0.15;
const SEA_SWELL = 0.06;
const SEA_SWELL_HZ = 0.08;
const HAMMER_TOWN_MIN = 0.2;
const HAMMER_GAP_S: readonly [number, number] = [3, 8];
const HAMMER_GAIN = 0.6;
/** Vorlauf, in dem Zirp- und Knister-Figuren vorausgeplant werden. */
const LOOKAHEAD_S = 1; // deckt zwei 500-ms-Takte ab (Drossel plus Jitter)

const clamp01 = (v: number): number => (Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0);
const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

/** Zielpegel 0…1 je Schicht (Formeln Spec 7.3). `reduced` hat in M7 keine Wirkung. */
export function ambienceMix(input: AmbienceInput): Record<Layer, number> {
  const v = input.view;
  const water = clamp01(num(v.water));
  const green = clamp01(num(v.green));
  const forest = clamp01(num(v.forest));
  const coast = clamp01(num(v.coast));
  const inhabitants = Math.max(0, num(v.inhabitants));
  const zn = clamp01((num(v.zoom) - 0.5) / 1.5);
  const w = clamp01(num(input.weather.w));
  const kind = input.weather.kind;
  const phase = input.phase;
  const day = phase === 'day' || phase === 'morning';
  const night = phase === 'night';

  const windRain = kind === 'cloudy' || kind === 'storm' ? 0.5 * w : 0;
  const townBase = Math.min(1, inhabitants / 60) * (0.3 + 0.7 * zn);
  return {
    sea: clamp01(0.35 + 0.65 * water),
    wind: clamp01(0.15 + 0.35 * (1 - zn) + windRain),
    birds: day ? clamp01(0.6 * (green + forest)) : 0,
    gulls: day || phase === 'evening' ? clamp01(0.5 * coast) : 0,
    night: night
      ? clamp01(0.5 * (green + forest))
      : phase === 'evening'
        ? clamp01(0.25 * (green + forest))
        : 0,
    town: clamp01(night ? townBase * 0.3 : townBase),
    rain: kind === 'rain' || kind === 'storm' ? clamp01(0.7 * w) : 0,
    storm: kind === 'storm' ? clamp01(0.8 * w) : 0,
    fire: clamp01(num(input.fire)),
  };
}

export interface LoopPlayer {
  start(at: number): void;
  stop(): void;
}

/**
 * Nahtlose Schleife: zwei Quellen im Wechsel, jede mit eigenem Gain. Die nächste Quelle beginnt
 * `CROSSFADE_S` vor dem Ende der laufenden und blendet linear über. Im `onended` der alten Quelle wird die
 * übernächste geplant (ereignisgetrieben, ohne Timer).
 */
export function createLoopPlayer(
  ctx: AudioContext,
  buffer: AudioBuffer,
  dest: AudioNode,
): LoopPlayer {
  const dur = buffer.duration;
  const fade = Math.max(0.001, Math.min(CROSSFADE_S, dur / 2));
  const step = dur - fade;
  const gains = [ctx.createGain(), ctx.createGain()];
  for (const g of gains) g.connect(dest);
  const startsAt = [0, 0];
  const sources: Array<AudioBufferSourceNode | null> = [null, null];
  let started = false;
  let stopped = false;

  const schedule = (slot: 0 | 1, at: number, first: boolean) => {
    if (stopped) return;
    try {
      const other = (1 - slot) as 0 | 1;
      const g = gains[slot]!.gain;
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.connect(gains[slot]!);
      if (first) {
        g.setValueAtTime(1, at);
      } else {
        g.setValueAtTime(0, at);
        g.linearRampToValueAtTime(1, at + fade);
        const og = gains[other]!.gain;
        og.setValueAtTime(1, at);
        og.linearRampToValueAtTime(0, at + fade);
      }
      startsAt[slot] = at;
      sources[slot] = src;
      src.onended = () => {
        try {
          src.disconnect();
        } catch {
          /* ignorieren */
        }
        if (stopped || sources[slot] !== src) return;
        schedule(slot, startsAt[other]! + step, false);
      };
      src.start(at);
    } catch {
      /* Ton darf nie werfen */
    }
  };

  return {
    start(at) {
      if (started || stopped) return;
      started = true;
      schedule(0, at, true);
      schedule(1, at + step, false);
    },
    stop() {
      if (stopped) return;
      stopped = true;
      for (const s of sources) {
        try {
          s?.stop();
          s?.disconnect();
        } catch {
          /* ignorieren */
        }
      }
      for (const g of gains) {
        try {
          g.disconnect();
        } catch {
          /* ignorieren */
        }
      }
    },
  };
}

export interface SampleIo {
  fetchBuffer(url: string): Promise<ArrayBuffer>;
  baseUrl: string;
}

export interface SampleLoader {
  /** Lädt eine Datei einmal; `then` läuft bei Erfolg (nie bei Fehler). Wirft nie. */
  request(file: string, then?: (b: AudioBuffer) => void): void;
  get(file: string): AudioBuffer | null;
  dispose(): void;
}

export function createSampleLoader(ctx: AudioContext, io: SampleIo): SampleLoader {
  const buffers = new Map<string, AudioBuffer>();
  const state = new Map<string, 'loading' | 'failed'>();
  const waiters = new Map<string, Array<(b: AudioBuffer) => void>>();
  let disposed = false;
  return {
    request(file, then) {
      if (disposed) return;
      const have = buffers.get(file);
      if (have) {
        then?.(have);
        return;
      }
      if (state.get(file) === 'failed') return;
      if (then) waiters.set(file, [...(waiters.get(file) ?? []), then]);
      if (state.has(file)) return;
      state.set(file, 'loading');
      const fail = () => {
        state.set(file, 'failed');
        waiters.delete(file);
      };
      try {
        Promise.resolve(io.fetchBuffer(assetUrl(io.baseUrl, file)))
          .then((ab) => ctx.decodeAudioData(ab))
          .then((buf) => {
            if (disposed) return;
            buffers.set(file, buf);
            state.delete(file);
            const list = waiters.get(file) ?? [];
            waiters.delete(file);
            for (const fn of list) {
              try {
                fn(buf);
              } catch {
                /* ignorieren */
              }
            }
          })
          .catch(fail);
      } catch {
        fail();
      }
    },
    get: (file) => buffers.get(file) ?? null,
    dispose() {
      disposed = true;
      buffers.clear();
      waiters.clear();
    },
  };
}

interface Voice {
  stop(): void;
  tick?(now: number): void;
}

export interface AmbienceEngine {
  /** Neue Zielpegel; plant Gleiten, Starten, Laden und Stoppen. Wirft nie. */
  update(levels: Record<Layer, number>, now: number): void;
  /** Aktuelle Zielpegel (nur Schichten, die schon einmal gesetzt wurden). */
  levels(): Partial<Record<Layer, number>>;
  dispose(): void;
}

interface LayerState {
  gain: GainNode | null;
  target: number;
  running: boolean;
  zeroSince: number | null;
  voice: Voice | null;
  player: LoopPlayer | null;
}

interface NoiseSpec {
  filters: Array<[BiquadFilterType, number, number?]>;
  out?: number;
  lfo?: { hz: number; depth: number; to: 'gain' | 'freq' | 'dest' };
}

export function createAmbienceEngine(deps: {
  ctx: AudioContext;
  dest: AudioNode;
  noise: AudioBuffer;
  loader: SampleLoader;
  rand?: () => number;
}): AmbienceEngine {
  const { ctx, dest, noise, loader } = deps;
  const rand = deps.rand ?? Math.random;
  let disposed = false;
  const st = {} as Record<Layer, LayerState>;
  for (const l of LAYERS)
    st[l] = { gain: null, target: 0, running: false, zeroSince: null, voice: null, player: null };
  const seen = new Set<Layer>();
  let nextHammer: number | null = null;

  const layerGain = (l: Layer): GainNode => {
    const s = st[l];
    if (!s.gain) {
      const g = ctx.createGain();
      g.gain.value = l === 'sea' ? SEA_INITIAL : 0;
      g.connect(dest);
      s.gain = g;
    }
    return s.gain;
  };

  const noiseVoice = (g: GainNode, spec: NoiseSpec): Voice => {
    const src = ctx.createBufferSource();
    src.buffer = noise;
    src.loop = true;
    const out = ctx.createGain();
    out.gain.value = spec.out ?? 1;
    let prev: AudioNode = src;
    const filters: BiquadFilterNode[] = [];
    for (const [type, hz, q] of spec.filters) {
      const f = ctx.createBiquadFilter();
      f.type = type;
      f.frequency.value = hz;
      if (q !== undefined) f.Q.value = q;
      prev.connect(f);
      prev = f;
      filters.push(f);
    }
    prev.connect(out);
    out.connect(g);
    let lfo: OscillatorNode | null = null;
    let lfoGain: GainNode | null = null;
    if (spec.lfo) {
      lfo = ctx.createOscillator();
      lfo.frequency.value = spec.lfo.hz;
      lfoGain = ctx.createGain();
      lfoGain.gain.value = spec.lfo.depth;
      const target =
        spec.lfo.to === 'dest' ? g.gain : spec.lfo.to === 'gain' ? out.gain : filters[0]!.frequency;
      lfo.connect(lfoGain);
      lfoGain.connect(target);
      lfo.start();
    }
    src.start();
    return {
      stop() {
        for (const fn of [
          () => src.stop(),
          () => lfo?.stop(),
          () => src.disconnect(),
          () => out.disconnect(),
          () => lfoGain?.disconnect(),
          ...filters.map((f) => () => f.disconnect()),
        ]) {
          try {
            fn();
          } catch {
            /* ignorieren */
          }
        }
      },
    };
  };

  const tone = (
    g: GainNode,
    freq: number,
    at: number,
    d: number,
    peak: number,
    freqEnd?: number,
  ) => {
    const osc = ctx.createOscillator();
    const e = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, at);
    if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, at + d);
    e.gain.setValueAtTime(0, at);
    e.gain.linearRampToValueAtTime(peak, at + d * 0.2);
    e.gain.exponentialRampToValueAtTime(0.0001, at + d);
    osc.connect(e);
    e.connect(g);
    osc.onended = () => {
      osc.disconnect();
      e.disconnect();
    };
    osc.start(at);
    osc.stop(at + d + 0.02);
  };

  const crackle = (g: GainNode, at: number, d: number, peak: number) => {
    const src = ctx.createBufferSource();
    const f = ctx.createBiquadFilter();
    const e = ctx.createGain();
    src.buffer = noise;
    f.type = 'highpass';
    f.frequency.value = 2500;
    e.gain.setValueAtTime(0, at);
    e.gain.linearRampToValueAtTime(peak, at + 0.003);
    e.gain.exponentialRampToValueAtTime(0.0001, at + d);
    src.connect(f);
    f.connect(e);
    e.connect(g);
    src.onended = () => {
      src.disconnect();
      f.disconnect();
      e.disconnect();
    };
    src.start(at);
    src.stop(at + d + 0.02);
  };

  /** Figuren in zufälligen Abständen, ohne Timer von `tick` vorausgeplant. */
  const pulseVoice = (gap: readonly [number, number], emit: (at: number) => void): Voice => {
    let next = -1;
    return {
      stop() {},
      tick(now) {
        if (next < now) next = now + rand() * gap[0];
        while (next < now + LOOKAHEAD_S) {
          emit(next);
          next += gap[0] + rand() * (gap[1] - gap[0]);
        }
      },
    };
  };

  const fallback = (l: Layer, g: GainNode): Voice | null => {
    switch (l) {
      case 'sea':
        return noiseVoice(g, {
          filters: [['lowpass', 500]],
          lfo: { hz: SEA_SWELL_HZ, depth: SEA_SWELL, to: 'dest' },
        });
      case 'wind':
        return noiseVoice(g, {
          filters: [['bandpass', 400, 0.8]],
          lfo: { hz: 0.1, depth: 150, to: 'freq' },
        });
      case 'storm':
        return noiseVoice(g, {
          filters: [['bandpass', 350, 0.8]],
          out: 2,
          lfo: { hz: 0.15, depth: 120, to: 'freq' },
        });
      case 'rain':
        return noiseVoice(g, {
          filters: [
            ['highpass', 800],
            ['lowpass', 7000],
          ],
        });
      case 'town':
        return noiseVoice(g, {
          filters: [['bandpass', 500, 0.7]],
          out: 0.6,
          lfo: { hz: 0.25, depth: 0.4, to: 'gain' },
        });
      case 'birds':
        return pulseVoice([0.4, 2.5], (at) => {
          const f = 2600 + rand() * 1200;
          tone(g, f, at, 0.07, 0.25, f + 800);
          tone(g, f + 200, at + 0.1, 0.06, 0.2, f + 900);
        });
      case 'night':
        return pulseVoice([0.6, 1.5], (at) => {
          for (let i = 0; i < 3; i++) tone(g, 4400, at + i * 0.04, 0.025, 0.12);
        });
      case 'fire':
        return pulseVoice([0.03, 0.25], (at) => crackle(g, at, 0.015, 0.1 + rand() * 0.3));
      default:
        return null; // Möwen: kein Rückfall
    }
  };

  const startPlayer = (l: Layer, buf: AudioBuffer) => {
    const s = st[l];
    s.voice?.stop();
    s.voice = null;
    s.player = createLoopPlayer(ctx, buf, layerGain(l));
    s.player.start(ctx.currentTime);
  };

  const startLayer = (l: Layer) => {
    const s = st[l];
    s.running = true;
    const g = layerGain(l);
    const file = LAYER_FILES[l];
    const buf = file ? loader.get(file) : null;
    if (buf) startPlayer(l, buf);
    else s.voice = fallback(l, g);
  };

  const stopLayer = (l: Layer) => {
    const s = st[l];
    s.running = false;
    s.voice?.stop();
    s.voice = null;
    s.player?.stop();
    s.player = null;
  };

  const waiting = new Set<Layer>();
  const requestFile = (l: Layer) => {
    const file = LAYER_FILES[l];
    if (!file) return;
    if (waiting.has(l)) return; // Warte-Callback hängt schon; Liste wächst nicht mit jedem Takt
    waiting.add(l);
    loader.request(file, (buf) => {
      waiting.delete(l);
      if (disposed || !st[l].running || st[l].player) return;
      startPlayer(l, buf);
    });
  };

  const hammer = (now: number) => {
    const buf = loader.get(HAMMER_FILE);
    if (!buf) return;
    if (nextHammer === null)
      nextHammer = now + HAMMER_GAP_S[0] + rand() * (HAMMER_GAP_S[1] - HAMMER_GAP_S[0]);
    if (now < nextHammer) return;
    nextHammer = now + HAMMER_GAP_S[0] + rand() * (HAMMER_GAP_S[1] - HAMMER_GAP_S[0]);
    const src = ctx.createBufferSource();
    const e = ctx.createGain();
    src.buffer = buf;
    e.gain.value = HAMMER_GAIN;
    src.connect(e);
    e.connect(layerGain('town'));
    src.onended = () => {
      src.disconnect();
      e.disconnect();
    };
    src.start();
  };

  const updateLayer = (l: Layer, z: number, now: number) => {
    const s = st[l];
    s.target = z;
    seen.add(l);
    if (z > 0) {
      s.zeroSince = null;
      const g = layerGain(l);
      if (!s.running) startLayer(l);
      requestFile(l);
      g.gain.setTargetAtTime(z * LAYER_TRIM[l], now, GLIDE_S / 3);
      if (!s.player) s.voice?.tick?.(now);
      if (l === 'town' && z > HAMMER_TOWN_MIN) {
        loader.request(HAMMER_FILE);
        hammer(now);
      }
    } else {
      s.gain?.gain.setTargetAtTime(0, now, GLIDE_S / 3);
      if (s.zeroSince === null) s.zeroSince = now;
      else if (s.running && now - s.zeroSince > IDLE_STOP_S) stopLayer(l);
    }
  };

  // Meer läuft von Anfang an mit dem M5-Rauschen, bis die Datei geladen ist.
  startLayer('sea');

  return {
    update(levels, now) {
      if (disposed) return;
      for (const l of LAYERS) {
        try {
          updateLayer(l, clamp01(levels[l]), now);
        } catch {
          /* eine Schicht darf die anderen nicht stören */
        }
      }
    },
    levels() {
      const out: Partial<Record<Layer, number>> = {};
      for (const l of seen) out[l] = st[l].target;
      return out;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const l of LAYERS) stopLayer(l);
    },
  };
}
