import {
  BUS_DEFAULTS,
  DUCK,
  duckEnd,
  duckGain,
  holdEnd,
  type AmbienceInput,
  type Bus,
  type DuckSignal,
  type Layer,
  type Phase,
} from './mix';
import {
  AMBIENCE_ACCEPT_MS,
  ambienceMix,
  createAmbienceEngine,
  createSampleLoader,
  type AmbienceEngine,
  type SampleLoader,
} from './ambience';
import { BUILD_GROUPS, buildGroupName } from './buildSounds';
import {
  SHORTAGE_FIGURE_S,
  SHORTAGE_GAP_S,
  SHORTAGE_GLOBAL_S,
  SHORTAGE_PEAK,
  SHORTAGE_PER_GOOD_S,
  SHORTAGE_TONE_S,
  WORK_GLOBAL_MS,
  WORK_GROUPS,
  WORK_PER_KIND_MS,
  shortageVoice,
  workGroupName,
} from './economySounds';
import { SFX_FILES } from './manifest';
import { createMusicPlayer, type MusicPlayer } from './music';

export type { AmbienceInput, Bus, Layer, Phase } from './mix';

export type SoundEvent =
  | 'build'
  | 'demolish'
  | 'coin'
  | 'order'
  | 'orderDone'
  | 'upgrade'
  | 'error'
  | 'win'
  | 'alarm'
  | 'stormWarning'
  | 'boom'
  | 'unlock';

export interface SoundOptions {
  muted: boolean;
  master?: number;
  music?: number;
  ambience?: number;
  effects?: number;
  /** Alias für `master` (bis M7-U1 unverändert genutzt). */
  volume?: number;
}

export interface MediaLike {
  src: string;
  preload: string;
  currentTime: number;
  duration: number;
  play(): Promise<void>;
  pause(): void;
  removeAttribute?(name: string): void;
  addEventListener(type: 'ended' | 'error' | 'loadedmetadata', fn: () => void): void;
}

export interface SoundIo {
  fetchBuffer(url: string): Promise<ArrayBuffer>;
  mediaFactory(url: string): MediaLike;
  baseUrl: string;
  /** Zufall für die Musikwahl (Tests: fest). */
  rand?: () => number;
}

export interface AudioDebugState {
  unlocked: boolean;
  buses: Record<Bus, number>;
  layers: Partial<Record<Layer, number>>;
  duck: number;
  music: { state: 'idle' | 'pause' | 'playing'; id: string | null };
}

export interface Sound {
  unlock(): void;
  play(e: SoundEvent): void;
  /** Bauklang je Gebäudeart (Id-String oder 'road'); unbekannt -> Holz. */
  playBuild(kind: string): void;
  /** Mangel-Doppelton für ein Gut (Id-String); entprellt, weicht Krisen-Signalen. */
  playShortage(good: string): void;
  /** Arbeitston je Gebäudeart (Id-String); gedrosselt, duckt nichts. */
  playWork(kind: string): void;
  setMuted(b: boolean): void;
  setVolume(v: number): void;
  setBus(bus: Bus, v: number): void;
  setAmbience(input: AmbienceInput): void;
  setPhase(phase: Phase): void;
  setCrisis(b: boolean): void;
  setHidden(b: boolean): void;
  debugState(): AudioDebugState;
  dispose(): void;
}

/** Mindestabstand zwischen zwei gleichen Tönen in ms (gemessen an ctx.currentTime). */
export const THROTTLE_MS: Partial<Record<SoundEvent, number>> = {
  build: 80,
  demolish: 80,
  coin: 50,
  upgrade: 300,
  error: 150,
  alarm: 2000,
  stormWarning: 5000,
  boom: 2000,
};

/**
 * Signale senken Musik und Umgebung (Ducking); Wert = Dauer der Figur in s.
 * Die Dauern sind an die Figuren in `figures` gekoppelt (Länge bis zum letzten Ton): wer eine Figur ändert,
 * passt den Wert hier an.
 */
const FIGURE_S: Partial<Record<SoundEvent, number>> = {
  error: 0.1,
  order: 0.52,
  win: 1.14,
  alarm: 2.0,
  stormWarning: 2.0,
};

/** Pegel von `unlock` gegenüber `win` (Setzung U1, ohne Vorgabe von lead-art). */
const UNLOCK_LEVEL = 0.5;
const FX = 0.5; // Effekte liegen 6 dB unter den Signalen (Spec 7.1)
const SAMPLE_GAIN = 0.8; // Pegel der Signal-Samples (Alarm, Sturmwarnung) auf dem Effekte-Bus
const EPS = 1e-9;

const defaultIo = (): SoundIo => ({
  fetchBuffer: (u) =>
    fetch(u).then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status))))),
  mediaFactory: (u) => {
    const a = new Audio();
    a.preload = 'none'; // vor der Quelle: nichts laden, bis das Stück dran ist
    a.src = u;
    return a as unknown as MediaLike;
  },
  baseUrl: import.meta.env.BASE_URL,
});

/** Gültige Zahl -> auf 0..1 geklemmt; sonst der Rückfallwert. */
function sanitizeVolume(v: unknown, fallback: number): number {
  if (typeof v !== 'number' || !Number.isFinite(v)) return fallback;
  return Math.min(1, Math.max(0, v));
}

/** Kleiner LCG: deterministisches Rauschen, damit Tests stabil bleiben. */
function makeNoise(ctx: AudioContext, seconds: number): AudioBuffer {
  const len = Math.max(1, Math.floor(ctx.sampleRate * seconds));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  let s = 12345;
  for (let i = 0; i < len; i++) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    data[i] = (s / 0xffffffff) * 2 - 1;
  }
  return buf;
}

export function createSound(
  opts: SoundOptions,
  ctxFactory: () => AudioContext | null = () => new AudioContext(),
  ioIn: Partial<SoundIo> = {},
): Sound {
  const io: SoundIo = { ...defaultIo(), ...ioIn };
  let muted = !!opts.muted;
  const levels: Record<Bus, number> = {
    master: sanitizeVolume(opts.master ?? opts.volume, BUS_DEFAULTS.master),
    music: sanitizeVolume(opts.music, BUS_DEFAULTS.music),
    ambience: sanitizeVolume(opts.ambience, BUS_DEFAULTS.ambience),
    effects: sanitizeVolume(opts.effects, BUS_DEFAULTS.effects),
  };
  let hidden = false;
  let unlocked = false;
  let disposed = false;
  let failed = false;
  let ctx: AudioContext | null = null;
  const bus: Partial<Record<Bus, GainNode>> = {};
  let duckMusic: GainNode | null = null;
  let duckAmb: GainNode | null = null;
  let noise: AudioBuffer | null = null;
  let engine: AmbienceEngine | null = null;
  let loader: SampleLoader | null = null;
  let lastAmbienceMs: number | null = null;
  let signals: DuckSignal[] = [];
  let phase: Phase = 'day';
  let crisis = false;
  let music: MusicPlayer | null = null;
  const lastPlayed = new Map<SoundEvent, number>();
  const lastBuild = new Map<string, number>();
  const lastShortage = new Map<string, number>();
  let lastShortageAny: number | null = null;
  // Ende der Figur des letzten Krisen-Signals (alarm, stormWarning); `boom` zählt bewusst nicht:
  // positives Ereignis, kein Krisen-Signal, der Mangelton darf neben ihm erklingen.
  let crisisUntil = -Infinity;
  const lastWork = new Map<string, number>();
  let lastWorkAny: number | null = null;

  const safe = (fn: () => void) => {
    try {
      fn();
    } catch {
      /* Ton darf das Spiel nie stören */
    }
  };
  const swallow = (p: unknown) => {
    (p as Promise<void> | undefined)?.catch?.(() => {});
  };
  const applyBus = (b: Bus) => {
    const g = bus[b];
    if (!g) return;
    g.gain.value = b === 'master' && muted ? 0 : levels[b];
  };

  // Stimmen laufen alle über den Effekte-Bus; nach dem Ende getrennt (keine Knoten-Leaks).
  const tone = (
    freq: number,
    at: number,
    dur: number,
    peak: number,
    type: OscillatorType = 'sine',
    freqEnd?: number,
  ) => {
    const dest = bus.effects;
    if (!ctx || !dest) return;
    const t = ctx.currentTime + at;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(dest);
    osc.onended = () => {
      osc.disconnect();
      g.disconnect();
    };
    osc.start(t);
    osc.stop(t + dur + 0.02);
  };

  const burst = (
    at: number,
    dur: number,
    peak: number,
    fromHz: number,
    toHz: number,
    filter: BiquadFilterType = 'lowpass',
  ) => {
    const dest = bus.effects;
    if (!ctx || !dest || !noise) return;
    const t = ctx.currentTime + at;
    const src = ctx.createBufferSource();
    const f = ctx.createBiquadFilter();
    const g = ctx.createGain();
    src.buffer = noise;
    f.type = filter;
    f.frequency.setValueAtTime(fromHz, t);
    f.frequency.exponentialRampToValueAtTime(toHz, t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(dest);
    src.onended = () => {
      src.disconnect();
      f.disconnect();
      g.disconnect();
    };
    src.start(t);
    src.stop(t + dur + 0.02);
  };

  /** Kurzer Holz-Anschlag: 10 ms Rausch-Impuls, hochpassgefiltert. */
  const knock = (at: number, peak: number) => burst(at, 0.01, peak, 1800, 1800, 'highpass');

  // Pegel: Signale (error, alarm, stormWarning, order, win) laut, Effekte um FX (-6 dB) darunter.
  // Figuren in D-Dur: D4 293,66 / F#4 369,99 / A4 440 / D5 587,33 / F#5 739,99 / A5 880 / D6 1174,66 Hz.
  const D5 = 587.33;
  const FS5 = 739.99;
  const A5 = 880;
  const D6 = 1174.66;
  const coinFigure = (at: number, peak: number) => {
    tone(A5, at, 0.09, peak);
    tone(D6, at + 0.06, 0.12, peak);
  };
  /** Geladenes Signal-Sample oder null (dann Rückfall); stößt das Laden beim ersten Abspielen an. */
  const sample = (e: SoundEvent): AudioBuffer | null => {
    const file = SFX_FILES[e];
    if (!file || !loader) return null;
    const b = loader.get(file);
    if (!b) loader.request(file);
    return b;
  };
  const playSample = (b: AudioBuffer, peak: number) => {
    const dest = bus.effects;
    if (!ctx || !dest) return;
    const src = ctx.createBufferSource();
    const g = ctx.createGain();
    src.buffer = b;
    g.gain.value = peak;
    src.connect(g);
    g.connect(dest);
    src.onended = () => {
      src.disconnect();
      g.disconnect();
    };
    src.start();
  };
  const winFigure = (level: number) => {
    knock(0, 0.3 * level);
    [D5, FS5, A5, D6].forEach((f, i) =>
      tone(f, i * 0.18, i === 3 ? 0.6 : 0.2, 0.4 * level, 'triangle'),
    );
  };
  const figures: Record<SoundEvent, () => void> = {
    build: () => {
      knock(0, 0.12 * FX);
      tone(700, 0, 0.03, 0.12 * FX, 'square', 300);
    },
    demolish: () => burst(0, 0.12, 0.2 * FX, 2400, 300),
    coin: () => coinFigure(0, 0.1 * FX),
    order: () => {
      knock(0, 0.3);
      tone(D5, 0, 0.16, 0.35, 'triangle');
      tone(FS5, 0.12, 0.16, 0.35, 'triangle');
      tone(A5, 0.24, 0.28, 0.35, 'triangle');
    },
    orderDone: () => {
      coinFigure(0, 0.3 * FX);
      [D5, FS5, A5].forEach((f) => tone(f, 0.16, 0.4, 0.25 * FX, 'triangle'));
    },
    upgrade: () => {
      knock(0, 0.2 * FX);
      tone(440, 0, 0.14, 0.3 * FX, 'triangle');
      tone(D5, 0.12, 0.24, 0.3 * FX, 'triangle');
    },
    error: () => tone(130, 0, 0.1, 0.5, 'sawtooth', 100),
    win: () => winFigure(1),
    // Freischaltung (M10): dieselbe Figur wie `win`, kleinerer Pegel (Wahl und Pegel bei lead-art offen)
    unlock: () => winFigure(UNLOCK_LEVEL),
    // Rückfall Alarm: Glocke aus Sinus-Partialtönen 1 : 2,76 : 5,4 auf D5, drei Schläge.
    alarm: () => {
      const b = sample('alarm');
      if (b) return playSample(b, SAMPLE_GAIN);
      for (let k = 0; k < 3; k++) {
        [1, 2.76, 5.4].forEach((m, j) => tone(D5 * m, k * 0.45, 0.8, 0.4 / (j + 1)));
      }
    },
    // Rückfall Sturmwarnung: tiefer Sägezahn-Akkord (D2, A2) durch Tiefpass 400 Hz, 2 s.
    stormWarning: () => {
      const b = sample('stormWarning');
      if (b) return playSample(b, SAMPLE_GAIN);
      const dest = bus.effects;
      if (!ctx || !dest) return;
      const t = ctx.currentTime;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 400;
      lp.connect(dest);
      const oscs = [73.42, 110].map((f) => {
        const o = ctx!.createOscillator();
        const g = ctx!.createGain();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(f, t);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.25, t + 0.2);
        g.gain.linearRampToValueAtTime(0.0001, t + 2);
        o.connect(g).connect(lp);
        o.start(t);
        o.stop(t + 2.02);
        return { o, g };
      });
      oscs[0]!.o.onended = () => {
        oscs.forEach(({ o, g }) => {
          o.disconnect();
          g.disconnect();
        });
        lp.disconnect();
      };
    },
    // Rückfall Boom: Münzfigur zweimal versetzt plus Fanfare D5-F#5-A5.
    boom: () => {
      const b = sample('boom');
      if (b) playSample(b, 0.4 * FX);
      else {
        coinFigure(0, 0.15 * FX);
        coinFigure(0.18, 0.15 * FX);
      }
      [D5, FS5, A5].forEach((f, i) =>
        tone(f, 0.4 + i * 0.14, i === 2 ? 0.5 : 0.18, 0.3 * FX, 'triangle'),
      );
    },
  };

  /** Plant den Duck-Verlauf beider Gains ab `now` (Spec 7.1). */
  const scheduleDuck = (now: number) => {
    signals = signals.filter((s) => duckEnd(s) > now);
    const hEnd = signals.reduce((m, s) => Math.max(m, holdEnd(s)), now);
    const start = duckGain(now, signals);
    for (const g of [duckMusic, duckAmb]) {
      if (!g) continue;
      const p = g.gain;
      p.cancelScheduledValues(now);
      p.setValueAtTime(start, now);
      p.linearRampToValueAtTime(DUCK.factor, now + DUCK.attackS);
      p.setValueAtTime(DUCK.factor, hEnd);
      p.linearRampToValueAtTime(1, hEnd + DUCK.releaseS);
    }
  };

  const setBus = (b: Bus, v: number) => {
    if (!Object.hasOwn(levels, b)) return;
    levels[b] = sanitizeVolume(v, levels[b]);
    if (!disposed) safe(() => applyBus(b));
  };

  const start = () => {
    ctx = ctxFactory();
    if (!ctx) {
      failed = true;
      return;
    }
    // Graph: master -> destination; effects -> master; music -> duckMusic -> master;
    // ambience -> duckAmb -> master. Erster Gain-Knoten: Master.
    const master = ctx.createGain();
    master.connect(ctx.destination);
    const effects = ctx.createGain();
    effects.connect(master);
    const musicBus = ctx.createGain();
    duckMusic = ctx.createGain();
    musicBus.connect(duckMusic);
    duckMusic.connect(master);
    const ambience = ctx.createGain();
    duckAmb = ctx.createGain();
    ambience.connect(duckAmb);
    duckAmb.connect(master);
    bus.master = master;
    bus.effects = effects;
    bus.music = musicBus;
    bus.ambience = ambience;
    (Object.keys(levels) as Bus[]).forEach(applyBus);
    noise = makeNoise(ctx, 2);
    loader = createSampleLoader(ctx, io);
    engine = createAmbienceEngine({ ctx, dest: ambience, noise, loader });
    music = createMusicPlayer({
      ctx,
      dest: musicBus,
      io,
      rand: io.rand ?? Math.random,
      getPhase: () => phase,
      getCrisis: () => crisis,
      paused: muted || hidden,
    });
    music.start();
    swallow(ctx.resume());
  };

  return {
    unlock() {
      if (disposed || failed || unlocked) return;
      try {
        start();
        unlocked = ctx !== null;
      } catch {
        failed = true;
        unlocked = false;
        ctx = null;
      }
    },
    play(e) {
      if (!unlocked || disposed || muted || !ctx) return;
      const now = ctx.currentTime;
      const gap = THROTTLE_MS[e];
      const last = lastPlayed.get(e);
      if (gap !== undefined && last !== undefined && now - last + EPS < gap / 1000) return;
      lastPlayed.set(e, now);
      safe(figures[e]);
      const figS = FIGURE_S[e];
      if ((e === 'alarm' || e === 'stormWarning') && figS !== undefined)
        crisisUntil = Math.max(crisisUntil, now + figS);
      if (figS !== undefined) {
        signals.push({ t0: now, durS: figS });
        safe(() => scheduleDuck(now));
      }
    },
    playBuild(kind) {
      if (!unlocked || disposed || muted || !ctx) return;
      const name = buildGroupName(typeof kind === 'string' ? kind : '');
      const group = BUILD_GROUPS[name];
      const now = ctx.currentTime;
      const last = lastBuild.get(name);
      if (last !== undefined && now - last + EPS < group.throttleMs / 1000) return;
      lastBuild.set(name, now);
      for (const st of group.steps) {
        if (st.k === 'tone') {
          safe(() => tone(st.freq, st.at, st.dur, st.peak * FX, st.type ?? 'sine', st.freqEnd));
        } else {
          safe(() => burst(st.at, st.dur, st.peak * FX, st.from, st.to, st.filter));
        }
      }
    },
    playShortage(good) {
      if (!unlocked || disposed || muted || !ctx) return;
      const key = typeof good === 'string' ? good : '';
      const now = ctx.currentTime;
      if (now < crisisUntil) return; // Krise hat Vorrang; verbraucht die Entprellung nicht
      const last = lastShortage.get(key);
      if (last !== undefined && now - last + EPS < SHORTAGE_PER_GOOD_S) return;
      if (lastShortageAny !== null && now - lastShortageAny + EPS < SHORTAGE_GLOBAL_S) return;
      lastShortage.set(key, now);
      lastShortageAny = now;
      const v = shortageVoice(key);
      safe(() => tone(v.f1, 0, SHORTAGE_TONE_S, SHORTAGE_PEAK, v.type));
      safe(() => tone(v.f2, SHORTAGE_GAP_S, SHORTAGE_TONE_S, SHORTAGE_PEAK, v.type));
      signals.push({ t0: now, durS: SHORTAGE_FIGURE_S });
      safe(() => scheduleDuck(now));
    },
    playWork(kind) {
      if (!unlocked || disposed || muted || !ctx) return;
      const key = typeof kind === 'string' ? kind : '';
      const now = ctx.currentTime;
      if (lastWorkAny !== null && now - lastWorkAny + EPS < WORK_GLOBAL_MS / 1000) return;
      const last = lastWork.get(key);
      if (last !== undefined && now - last + EPS < WORK_PER_KIND_MS / 1000) return;
      lastWorkAny = now;
      lastWork.set(key, now);
      for (const st of WORK_GROUPS[workGroupName(key)].steps) {
        if (st.k === 'tone') {
          safe(() => tone(st.freq, st.at, st.dur, st.peak * FX, st.type ?? 'sine', st.freqEnd));
        } else {
          safe(() => burst(st.at, st.dur, st.peak * FX, st.from, st.to, st.filter));
        }
      }
    },
    setMuted(b) {
      muted = !!b;
      applyBus('master');
      safe(() => music?.setPaused(muted || hidden));
      if (!muted && unlocked && !hidden && !disposed && ctx) safe(() => swallow(ctx!.resume()));
    },
    setVolume: (v) => setBus('master', v),
    setBus,
    setAmbience(input) {
      if (disposed || !unlocked || !ctx || !engine) return;
      const t = Date.now();
      if (lastAmbienceMs !== null && t - lastAmbienceMs < AMBIENCE_ACCEPT_MS) return;
      lastAmbienceMs = t;
      const e = engine;
      const now = ctx.currentTime;
      safe(() => e.update(ambienceMix(input), now));
    },
    setPhase(p) {
      if (disposed) return;
      phase = p;
    },
    setCrisis(b) {
      if (disposed) return;
      crisis = !!b;
    },
    setHidden(b) {
      hidden = !!b;
      safe(() => music?.setPaused(muted || hidden));
      if (!unlocked || disposed || !ctx) return;
      const c = ctx;
      if (hidden) safe(() => swallow(c.suspend()));
      else if (!muted) safe(() => swallow(c.resume()));
    },
    debugState() {
      let duck = 1;
      if (ctx && !disposed) {
        const c = ctx;
        safe(() => {
          duck = duckGain(c.currentTime, signals);
        });
      }
      const m = music && !disposed ? music.state() : { state: 'idle' as const, id: null };
      return {
        unlocked,
        buses: { ...levels },
        layers: engine && !disposed ? engine.levels() : {},
        duck,
        music: m,
      };
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      const c = ctx;
      safe(() => engine?.dispose());
      safe(() => loader?.dispose());
      safe(() => music?.dispose());
      music = null;
      engine = null;
      loader = null;
      if (c) safe(() => swallow(c.close()));
      ctx = null;
      bus.master = bus.effects = bus.music = bus.ambience = undefined;
      duckMusic = duckAmb = null;
    },
  };
}
