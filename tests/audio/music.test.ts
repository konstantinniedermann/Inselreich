import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  FADE_S,
  FIRST_DELAY_MS,
  MAX_FAILS,
  PAUSE_MS,
  musicPhase,
  nextTrack,
} from '../../src/audio/music';
import type { AssetEntry } from '../../src/audio/manifest';
import { createSound, type MediaLike } from '../../src/audio/sound';

const T = [
  { id: 'MU1', phase: 'day' },
  { id: 'MU2', phase: 'day' },
  { id: 'MU3', phase: 'night' },
] as AssetEntry[];

describe('nextTrack', () => {
  it('Konstanten', () => {
    expect([FIRST_DELAY_MS, PAUSE_MS, FADE_S, MAX_FAILS]).toEqual([
      [5000, 15000],
      [30000, 90000],
      3,
      2,
    ]);
  });

  it('musicPhase: Tag und Morgen -> day, Abend und Nacht -> night', () => {
    expect(['day', 'morning', 'evening', 'night'].map((p) => musicPhase(p as 'day'))).toEqual([
      'day',
      'day',
      'night',
      'night',
    ]);
  });

  it('AK-A3-01 nur Stücke der Phase, nie eines der letzten 2 wenn möglich, Pause 30–90 s, deterministisch', () => {
    const r = nextTrack({ phase: 'day', lastIds: ['MU1'], crisis: false }, () => 0, T)!;
    expect(r.id).toBe('MU2');
    expect(r.pauseMs).toBe(30000);
    expect(
      nextTrack({ phase: 'day', lastIds: [], crisis: false }, () => 0.999999, T)!.pauseMs,
    ).toBeLessThanOrEqual(90000);
    expect(nextTrack({ phase: 'night', lastIds: ['MU3'], crisis: false }, () => 0.5, T)!.id).toBe(
      'MU3',
    );
    expect(nextTrack({ phase: 'evening', lastIds: [], crisis: false }, () => 0.5, T)!.id).toBe(
      'MU3',
    );
    // beide Tag-Stücke unter den letzten 2: Wiederholung erlaubt
    expect(
      nextTrack({ phase: 'day', lastIds: ['MU1', 'MU2'], crisis: false }, () => 0, T)!.id,
    ).toBe('MU1');
  });

  it('ohne Stücke null; Phase ohne Stücke nimmt alle', () => {
    expect(nextTrack({ phase: 'day', lastIds: [], crisis: false }, () => 0, [])).toBeNull();
    const only = [{ id: 'MU1', phase: 'day' }] as AssetEntry[];
    expect(nextTrack({ phase: 'night', lastIds: [], crisis: false }, () => 0, only)!.id).toBe(
      'MU1',
    );
  });
});

// ---- Player über createSound ----

class FakeMedia implements MediaLike {
  src = '';
  preload = 'auto';
  currentTime = 0;
  duration = NaN;
  plays = 0;
  pauses = 0;
  rejectPlay = false;
  private h: Record<string, Array<() => void>> = {};
  constructor(url: string) {
    this.src = url;
  }
  play() {
    this.plays += 1;
    return this.rejectPlay ? Promise.reject(new Error('NotAllowed')) : Promise.resolve();
  }
  pause() {
    this.pauses += 1;
  }
  addEventListener(type: string, fn: () => void) {
    (this.h[type] ??= []).push(fn);
  }
  emit(type: string) {
    (this.h[type] ?? []).forEach((f) => f());
  }
}

function setup(opts: { reject?: boolean } = {}) {
  const els: FakeMedia[] = [];
  const sources: unknown[] = [];
  const ramps: Array<{ to: number; at: number }> = [];
  const param = () => ({
    value: 1,
    cancelScheduledValues() {},
    setValueAtTime() {},
    linearRampToValueAtTime(to: number, at: number) {
      ramps.push({ to, at });
    },
    exponentialRampToValueAtTime() {},
    setTargetAtTime() {},
  });
  const node = () => ({
    connect: (t: unknown) => t,
    disconnect() {},
    start() {},
    stop() {},
    gain: param(),
    frequency: param(),
    Q: param(),
    type: 'sine',
    buffer: null,
    loop: false,
  });
  const ctx = {
    currentTime: 0,
    sampleRate: 44100,
    destination: {},
    createGain: node,
    createOscillator: node,
    createBiquadFilter: node,
    createBufferSource: node,
    createBuffer: (_c: number, len: number) => ({ getChannelData: () => new Float32Array(len) }),
    createMediaElementSource: (el: unknown) => {
      sources.push(el);
      return node();
    },
    decodeAudioData: () => Promise.reject(new Error('x')),
    resume: () => Promise.resolve(),
    suspend: () => Promise.resolve(),
    close: () => Promise.resolve(),
  };
  const fetched: string[] = [];
  const state = { reject: !!opts.reject };
  const sound = createSound({ muted: false, volume: 0.4 }, () => ctx as unknown as AudioContext, {
    baseUrl: '/base/',
    rand: () => 0,
    fetchBuffer: (u: string) => {
      fetched.push(u);
      return Promise.reject(new Error('404'));
    },
    mediaFactory: (u: string) => {
      const m = new FakeMedia(u);
      m.rejectPlay = state.reject;
      els.push(m);
      return m;
    },
  });
  return { sound, els, sources, ramps, ctx, fetched, state };
}

const flush = async () => {
  for (let i = 0; i < 5; i++) await Promise.resolve();
};

describe('Musik-Player', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('AK-A3-02 vor unlock kein Media-Element; erstes Stück zwischen 5 und 15 s; Phase erst beim nächsten Stück', async () => {
    const s = setup();
    s.sound.setPhase('day');
    vi.advanceTimersByTime(60000);
    expect(s.els.length).toBe(0);
    s.sound.unlock();
    vi.advanceTimersByTime(4999);
    expect(s.els.length).toBe(0);
    vi.advanceTimersByTime(10001);
    await flush();
    expect(s.els.length).toBe(1);
    expect(s.els[0]!.src).toBe('/base/audio/music/bards-tale.mp3');
    expect(s.els[0]!.preload).toBe('none');
    expect(s.sources).toEqual([s.els[0]]);
    expect(s.fetched).toEqual([]); // nie dekodiert
    s.sound.setPhase('night');
    expect(s.els.length).toBe(1);
    expect(s.sound.debugState().music).toEqual({ state: 'playing', id: 'MU1' });
    // Stückende, Pause, danach Nachtstück
    s.els[0]!.emit('ended');
    expect(s.sound.debugState().music.state).toBe('pause');
    vi.advanceTimersByTime(29999);
    expect(s.els.length).toBe(1);
    vi.advanceTimersByTime(1);
    await flush();
    expect(s.els.length).toBe(2);
    expect(s.els[1]!.src).toContain('dowland-complaints');
  });

  it('Einblenden 3 s, Ausblenden 3 s vor Ende (loadedmetadata)', async () => {
    const s = setup();
    s.sound.unlock();
    vi.advanceTimersByTime(15000);
    await flush();
    expect(s.ramps).toContainEqual({ to: 1, at: FADE_S });
    s.els[0]!.duration = 100;
    s.els[0]!.emit('loadedmetadata');
    expect(s.ramps).toContainEqual({ to: 0, at: 100 });
  });

  it('AK-A3-03 error-Ereignis überspringt; nach 2 Fehlern in Folge kein weiteres Element', async () => {
    const s = setup();
    s.sound.unlock();
    vi.advanceTimersByTime(15000);
    await flush();
    expect(s.els.length).toBe(1);
    expect(() => s.els[0]!.emit('error')).not.toThrow();
    vi.advanceTimersByTime(1);
    await flush();
    expect(s.els.length).toBe(2); // übersprungen -> nächstes
    s.els[1]!.emit('error');
    s.els[1]!.emit('error'); // doppeltes Ereignis zählt einmal
    vi.advanceTimersByTime(10 * 60 * 1000);
    await flush();
    expect(s.els.length).toBe(2);
    expect(s.sound.debugState().music.state).toBe('idle');
  });

  it('AK-A3-03 abgewiesenes play() zählt als Fehler; Erfolg setzt Zähler zurück', async () => {
    const s = setup({ reject: true });
    s.sound.unlock();
    vi.advanceTimersByTime(15000);
    await flush();
    vi.advanceTimersByTime(1);
    await flush();
    vi.advanceTimersByTime(10 * 60 * 1000);
    await flush();
    expect(s.els.length).toBe(2);

    const t = setup();
    t.sound.unlock();
    vi.advanceTimersByTime(15000);
    await flush();
    t.els[0]!.emit('error');
    vi.advanceTimersByTime(1);
    await flush();
    t.els[1]!.emit('loadedmetadata'); // Stück 2 läuft (Erfolg) -> Zähler 0
    t.els[1]!.emit('ended');
    vi.advanceTimersByTime(90000);
    await flush();
    t.els[2]!.emit('error');
    vi.advanceTimersByTime(1);
    await flush();
    expect(t.els.length).toBe(4);
  });

  it('AK-A3-04 Stumm oder verborgen pausiert, Aufheben setzt fort', async () => {
    const s = setup();
    s.sound.unlock();
    vi.advanceTimersByTime(15000);
    await flush();
    const el = s.els[0]!;
    expect(el.plays).toBe(1);
    s.sound.setMuted(true);
    expect(el.pauses).toBe(1);
    s.sound.setMuted(false);
    expect(el.plays).toBe(2);
    s.sound.setHidden(true);
    expect(el.pauses).toBe(2);
    s.sound.setHidden(false);
    expect(el.plays).toBe(3);
    // stumm und verborgen: erst wenn beides aufgehoben, geht es weiter
    s.sound.setMuted(true);
    s.sound.setHidden(true);
    s.sound.setMuted(false);
    expect(el.plays).toBe(3);
    s.sound.setHidden(false);
    expect(el.plays).toBe(4);
    expect(s.els.length).toBe(1);
  });

  it('Pause ruht, solange stumm: Timer läuft nicht ab', async () => {
    const s = setup();
    s.sound.unlock();
    s.sound.setMuted(true);
    vi.advanceTimersByTime(60000);
    await flush();
    expect(s.els.length).toBe(0);
    s.sound.setMuted(false);
    vi.advanceTimersByTime(15000);
    await flush();
    expect(s.els.length).toBe(1);
  });

  it('RF-5b setHidden(true) während des Einblendens und zurück: fortgesetzt, nicht neu erzeugt', async () => {
    const s = setup();
    s.sound.unlock();
    vi.advanceTimersByTime(15000);
    await flush();
    s.sound.setHidden(true);
    s.sound.setHidden(false);
    await flush();
    expect(s.els.length).toBe(1);
    expect(s.els[0]!.plays).toBe(2);
  });

  it('dispose: keine weiteren Elemente, nichts wirft', async () => {
    const s = setup();
    s.sound.unlock();
    s.sound.dispose();
    vi.advanceTimersByTime(60000);
    await flush();
    expect(s.els.length).toBe(0);
    expect(() => {
      s.sound.setMuted(true);
      s.sound.setHidden(true);
      s.sound.setPhase('night');
      s.sound.dispose();
    }).not.toThrow();
  });

  it('mediaFactory wirft: stille Musik, kein Wurf, kein Retry-Sturm', async () => {
    const ctx = setup().ctx;
    const sound = createSound({ muted: false }, () => ctx as unknown as AudioContext, {
      rand: () => 0,
      mediaFactory: () => {
        throw new Error('kein Audio');
      },
    });
    sound.unlock();
    expect(() => vi.advanceTimersByTime(10 * 60 * 1000)).not.toThrow();
    await flush();
    expect(sound.debugState().music.state).toBe('idle');
  });
});
