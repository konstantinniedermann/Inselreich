// Synthetischer Ton über Web Audio (ADR-001: Browser-API, keine Abhängigkeit, keine Assets).
// Kein Import aus sim/ui, kein DOM-Zugriff; der AudioContext kommt aus einer austauschbaren Fabrik.

export type SoundEvent =
  'build' | 'demolish' | 'coin' | 'order' | 'orderDone' | 'upgrade' | 'error' | 'win';

export interface Sound {
  unlock(): void;
  play(e: SoundEvent): void;
  setMuted(b: boolean): void;
  setVolume(v: number): void;
  setHidden(b: boolean): void;
  dispose(): void;
}

/** Mindestabstand zwischen zwei gleichen Tönen in ms (gemessen an ctx.currentTime). */
export const THROTTLE_MS: Partial<Record<SoundEvent, number>> = {
  build: 80,
  demolish: 80,
  coin: 50,
  upgrade: 300,
  error: 150,
};

const DEFAULT_VOLUME = 0.4;
const SEA_LEVEL = 0.15; // relativ zum Master
const SEA_SWELL = 0.06; // Tiefe der langsamen Schwellung (absolut, relativ zum Master)
const SEA_SWELL_HZ = 0.08;
const EPS = 1e-9;

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
  opts: { muted: boolean; volume: number },
  ctxFactory: () => AudioContext | null = () => new AudioContext(),
): Sound {
  let muted = !!opts.muted;
  let volume = sanitizeVolume(opts.volume, DEFAULT_VOLUME);
  let hidden = false;
  let unlocked = false;
  let disposed = false;
  let failed = false;
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let noise: AudioBuffer | null = null;
  let seaSource: AudioBufferSourceNode | null = null;
  let seaLfo: OscillatorNode | null = null;
  const lastPlayed = new Map<SoundEvent, number>();

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
  const applyMaster = () => {
    if (master) master.gain.value = muted ? 0 : volume;
  };

  // Stimmen: Oszillator + Hüllkurve; nach dem Ende getrennt (keine Knoten-Leaks).
  const tone = (
    freq: number,
    at: number,
    dur: number,
    peak: number,
    type: OscillatorType = 'sine',
    freqEnd?: number,
  ) => {
    if (!ctx || !master) return;
    const t = ctx.currentTime + at;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(master);
    osc.onended = () => {
      osc.disconnect();
      g.disconnect();
    };
    osc.start(t);
    osc.stop(t + dur + 0.02);
  };

  const burst = (at: number, dur: number, peak: number, fromHz: number, toHz: number) => {
    if (!ctx || !master || !noise) return;
    const t = ctx.currentTime + at;
    const src = ctx.createBufferSource();
    const f = ctx.createBiquadFilter();
    const g = ctx.createGain();
    src.buffer = noise;
    f.type = 'lowpass';
    f.frequency.setValueAtTime(fromHz, t);
    f.frequency.exponentialRampToValueAtTime(toHz, t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(master);
    src.onended = () => {
      src.disconnect();
      f.disconnect();
      g.disconnect();
    };
    src.start(t);
    src.stop(t + dur + 0.02);
  };

  // Lautstärke-Hierarchie: Signale (error, order, orderDone, win) laut, build/coin leise, Meer darunter.
  const figures: Record<SoundEvent, () => void> = {
    build: () => tone(700, 0, 0.03, 0.12, 'square', 300),
    demolish: () => burst(0, 0.12, 0.2, 2400, 300),
    coin: () => {
      tone(1320, 0, 0.09, 0.1);
      tone(1760, 0.06, 0.12, 0.1);
    },
    order: () => {
      tone(523, 0, 0.16, 0.35, 'triangle');
      tone(659, 0.12, 0.16, 0.35, 'triangle');
      tone(784, 0.24, 0.28, 0.35, 'triangle');
    },
    orderDone: () => {
      tone(1320, 0, 0.1, 0.3);
      tone(1760, 0.07, 0.14, 0.3);
      tone(523, 0.16, 0.4, 0.25, 'triangle');
      tone(659, 0.16, 0.4, 0.25, 'triangle');
      tone(784, 0.16, 0.4, 0.25, 'triangle');
    },
    upgrade: () => {
      tone(440, 0, 0.14, 0.3, 'triangle');
      tone(660, 0.12, 0.24, 0.3, 'triangle');
    },
    error: () => tone(130, 0, 0.1, 0.5, 'sawtooth', 100),
    win: () => {
      [523, 659, 784, 1047].forEach((f, i) =>
        tone(f, i * 0.18, i === 3 ? 0.6 : 0.2, 0.4, 'triangle'),
      );
    },
  };

  const start = () => {
    ctx = ctxFactory();
    if (!ctx) {
      failed = true;
      return;
    }
    master = ctx.createGain(); // erster Gain-Knoten: Master
    master.connect(ctx.destination);
    applyMaster();
    noise = makeNoise(ctx, 2);
    // Meeresrauschen: gefiltertes Rauschen, per langsamem LFO auf dem Gain schwellend (ohne Uhr).
    const sea = ctx.createGain(); // zweiter Gain-Knoten: Meeresrauschen
    sea.gain.value = SEA_LEVEL;
    sea.connect(master);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 500;
    seaSource = ctx.createBufferSource();
    seaSource.buffer = noise;
    seaSource.loop = true;
    seaSource.connect(lp).connect(sea);
    seaLfo = ctx.createOscillator();
    seaLfo.frequency.value = SEA_SWELL_HZ;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = SEA_SWELL;
    seaLfo.connect(lfoGain).connect(sea.gain);
    seaSource.start();
    seaLfo.start();
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
    },
    setMuted(b) {
      muted = !!b;
      applyMaster();
      if (!muted && unlocked && !hidden && !disposed && ctx) safe(() => swallow(ctx!.resume()));
    },
    setVolume(v) {
      volume = sanitizeVolume(v, volume);
      applyMaster();
    },
    setHidden(b) {
      hidden = !!b;
      if (!unlocked || disposed || !ctx) return;
      const c = ctx;
      if (hidden) safe(() => swallow(c.suspend()));
      else if (!muted) safe(() => swallow(c.resume()));
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      const c = ctx;
      safe(() => seaSource?.stop());
      safe(() => seaLfo?.stop());
      if (c) safe(() => swallow(c.close()));
      ctx = null;
      master = null;
    },
  };
}
