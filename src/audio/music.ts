// Musik (Spec 7.4): Auswahlregel als reine Funktion, Streaming-Player über ein Media-Element.
// Ein Stück wird nie ganz dekodiert. Kein Aufruf wirft; Fehler führen zu „keine Musik".
// Zeiten sind Darstellungswerte (Konstanten), keine Spielwerte.
import { assetUrl, MANIFEST, type AssetEntry } from './manifest';
import type { MediaLike, SoundIo } from './sound';
import type { Phase } from './mix';

export const FIRST_DELAY_MS = [5000, 15000] as const;
export const PAUSE_MS = [30000, 90000] as const;
export const FADE_S = 3;
export const MAX_FAILS = 2;

export interface MusicState {
  phase: Phase;
  lastIds: string[];
  crisis: boolean;
}

/** Tag und Morgen -> `day`, Abend und Nacht -> `night`. */
export function musicPhase(phase: Phase): 'day' | 'night' {
  return phase === 'day' || phase === 'morning' ? 'day' : 'night';
}

const MUSIC_TRACKS = (): readonly AssetEntry[] => MANIFEST.filter((e) => e.kind === 'music');

/**
 * Wählt das nächste Stück: Pool = Stücke der Phase (leer -> alle), frisch = Pool ohne die letzten 2.
 * `crisis` ist für den Krisenwechsel (Kann) vorgesehen und ändert die Wahl derzeit nicht.
 */
export function nextTrack(
  state: MusicState,
  rand: () => number,
  tracks: readonly AssetEntry[] = MUSIC_TRACKS(),
): { id: string; pauseMs: number } | null {
  if (tracks.length === 0) return null;
  const want = musicPhase(state.phase);
  const inPhase = tracks.filter((t) => t.phase === want);
  const pool = inPhase.length ? inPhase : tracks;
  const recent = state.lastIds.slice(-2);
  const fresh = pool.filter((t) => !recent.includes(t.id));
  const from = fresh.length ? fresh : pool;
  const pick = from[Math.min(from.length - 1, Math.floor(rand() * from.length))]!;
  const pauseMs = PAUSE_MS[0] + Math.floor(rand() * (PAUSE_MS[1] - PAUSE_MS[0] + 1));
  return { id: pick.id, pauseMs };
}

export interface MusicDeps {
  ctx: AudioContext;
  /** Musik-Bus (vor dem Ducking). */
  dest: AudioNode;
  io: SoundIo;
  rand: () => number;
  getPhase: () => Phase;
  getCrisis: () => boolean;
  /** Anfangszustand: stumm oder verborgen. */
  paused: boolean;
}

export interface MusicPlayer {
  start(): void;
  setPaused(b: boolean): void;
  state(): { state: 'idle' | 'pause' | 'playing'; id: string | null };
  dispose(): void;
}

interface Current {
  id: string;
  el: MediaLike;
  gain: GainNode;
  src: MediaElementAudioSourceNode;
  failed: boolean;
}

export function createMusicPlayer(deps: MusicDeps): MusicPlayer {
  const { ctx, dest, io, rand } = deps;
  let paused = deps.paused;
  let disposed = false;
  let started = false;
  let off = false; // Musik für die Sitzung aus
  let fails = 0;
  let status: 'idle' | 'pause' | 'playing' = 'idle';
  let cur: Current | null = null;
  let lastIds: string[] = [];
  let pendingPauseMs = 0;

  // Warte-Timer, der beim Pausieren ruht und mit der Restzeit fortsetzt.
  let timer: ReturnType<typeof setTimeout> | null = null;
  let timerFn: (() => void) | null = null;
  let remaining = 0;
  let armedAt = 0;

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

  const arm = () => {
    if (!timerFn || paused || disposed) return;
    if (timer !== null) clearTimeout(timer);
    armedAt = Date.now();
    timer = setTimeout(() => {
      const fn = timerFn;
      timer = null;
      timerFn = null;
      if (fn) safe(fn);
    }, remaining);
  };
  const wait = (ms: number, fn: () => void) => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
    timerFn = fn;
    remaining = ms;
    arm();
  };
  const freezeTimer = () => {
    if (timer === null) return;
    clearTimeout(timer);
    timer = null;
    remaining = Math.max(0, remaining - (Date.now() - armedAt));
  };

  const release = (c: Current) => {
    safe(() => c.el.pause());
    safe(() => c.src.disconnect());
    safe(() => c.gain.disconnect());
  };

  /** Plant Ein- und Ausblenden anhand der Abspielposition (auch nach Fortsetzen). */
  const planFades = (c: Current) => {
    const now = ctx.currentTime;
    const pos = Number.isFinite(c.el.currentTime) ? c.el.currentTime : 0;
    const p = c.gain.gain;
    p.cancelScheduledValues(now);
    if (pos < FADE_S) {
      p.setValueAtTime(pos / FADE_S, now);
      p.linearRampToValueAtTime(1, now + (FADE_S - pos));
    } else p.setValueAtTime(1, now);
    const d = c.el.duration;
    if (Number.isFinite(d) && d > 0) {
      const left = Math.max(0, d - pos);
      const fadeAt = now + Math.max(0, left - FADE_S);
      p.setValueAtTime(1, fadeAt);
      p.linearRampToValueAtTime(0, now + left);
    }
  };

  const fail = (c: Current) => {
    if (c.failed) return;
    c.failed = true;
    fails += 1;
    if (cur === c) cur = null;
    release(c);
    if (disposed) return;
    if (fails >= MAX_FAILS) {
      off = true;
      status = 'idle';
      return;
    }
    status = 'pause';
    wait(0, begin);
  };

  const begin = () => {
    if (disposed || off) return;
    const pick = nextTrack({ phase: deps.getPhase(), lastIds, crisis: deps.getCrisis() }, rand);
    const entry = pick && MUSIC_TRACKS().find((e) => e.id === pick.id);
    if (!pick || !entry) {
      off = true;
      status = 'idle';
      return;
    }
    pendingPauseMs = pick.pauseMs;
    lastIds = [...lastIds, pick.id].slice(-2);
    let c: Current | null = null;
    try {
      const el = io.mediaFactory(assetUrl(io.baseUrl, entry.file));
      el.preload = 'none';
      const gain = ctx.createGain();
      gain.gain.value = 0;
      const src = ctx.createMediaElementSource(el as unknown as HTMLMediaElement);
      src.connect(gain);
      gain.connect(dest);
      c = { id: pick.id, el, gain, src, failed: false };
      const t = c;
      cur = t;
      status = 'playing';
      el.addEventListener('error', () => cur === t && fail(t));
      el.addEventListener('loadedmetadata', () => {
        if (cur !== t) return;
        fails = 0; // Datei ist lesbar: Erfolg
        safe(() => planFades(t));
      });
      el.addEventListener('ended', () => {
        if (cur !== t) return;
        cur = null;
        fails = 0;
        release(t);
        status = 'pause';
        wait(pendingPauseMs, begin);
      });
      planFades(t);
      if (!paused) swallow(el.play().catch(() => cur === t && fail(t)));
    } catch {
      if (c) fail(c);
      else {
        // Erzeugen scheiterte: zählt wie ein Fehler
        fails += 1;
        if (fails >= MAX_FAILS) {
          off = true;
          status = 'idle';
        } else {
          status = 'pause';
          wait(0, begin);
        }
      }
    }
  };

  return {
    start() {
      if (started || disposed) return;
      started = true;
      status = 'pause';
      wait(FIRST_DELAY_MS[0] + rand() * (FIRST_DELAY_MS[1] - FIRST_DELAY_MS[0]), begin);
    },
    setPaused(b) {
      if (disposed || b === paused) return;
      paused = b;
      safe(() => {
        if (paused) {
          freezeTimer();
          if (cur) cur.el.pause();
        } else {
          const c = cur;
          if (c) {
            planFades(c);
            swallow(c.el.play().catch(() => cur === c && fail(c)));
          }
          arm();
        }
      });
    },
    state: () => ({ state: status, id: status === 'playing' && cur ? cur.id : null }),
    dispose() {
      if (disposed) return;
      disposed = true;
      if (timer !== null) clearTimeout(timer);
      timer = null;
      timerFn = null;
      if (cur) release(cur);
      cur = null;
      status = 'idle';
    },
  };
}
