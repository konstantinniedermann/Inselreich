import { describe, expect, it } from 'vitest';
import { createSound, THROTTLE_MS } from '../../src/audio/sound';

// Knapper Fake: zählt nur Oszillatoren, bildet die übrige Knoten-API nach.
function fakeCtx() {
  const log = { osc: 0, nodes: 0 };
  const param = () => ({
    value: 1,
    cancelScheduledValues() {},
    setValueAtTime() {},
    linearRampToValueAtTime() {},
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
      playbackRate: param(),
      type: 'sine',
      buffer: null,
      loop: false,
    };
    return n;
  };
  const ctx = {
    currentTime: 0,
    state: 'suspended',
    destination: {},
    sampleRate: 44100,
    createGain: node,
    createOscillator: () => {
      log.osc += 1;
      return node();
    },
    createBufferSource: node,
    createBiquadFilter: node,
    createBuffer: (_c: number, len: number) => ({ getChannelData: () => new Float32Array(len) }),
    decodeAudioData: () => Promise.resolve({ duration: 1 }),
    resume() {
      ctx.state = 'running';
      return Promise.resolve();
    },
    suspend: () => Promise.resolve(),
    close: () => Promise.resolve(),
  };
  return { ctx: ctx as unknown as AudioContext, log };
}

const io = () => ({
  baseUrl: '/',
  fetchBuffer: () => Promise.reject(new Error('404')),
  mediaFactory: (): never => {
    throw new Error('kein Media-Element im Test');
  },
});

describe('contractWarn (AK-W10)', () => {
  it('Drosselung ist 2000 ms', () => {
    expect(THROTTLE_MS.contractWarn).toBe(2000);
  });

  it('löst genau zwei Töne aus, zweiter Aufruf innerhalb 2000 ms wird gedrosselt', () => {
    const { ctx, log } = fakeCtx();
    const s = createSound({ muted: false, volume: 0.4 }, () => ctx, io());
    s.unlock();
    const base = log.osc;
    s.play('contractWarn');
    expect(log.osc - base).toBe(2);
    (ctx as { currentTime: number }).currentTime = 1.0;
    s.play('contractWarn');
    expect(log.osc - base).toBe(2);
    (ctx as { currentTime: number }).currentTime = 2.5;
    s.play('contractWarn');
    expect(log.osc - base).toBe(4);
  });

  it('stumm: wirft nicht und erzeugt nichts', () => {
    const { ctx, log } = fakeCtx();
    const s = createSound({ muted: true, volume: 0.4 }, () => ctx, io());
    s.unlock();
    const base = log.osc;
    expect(() => s.play('contractWarn')).not.toThrow();
    expect(log.osc).toBe(base);
  });

  it('vor unlock(): wirft nicht', () => {
    const s = createSound({ muted: false, volume: 0.4 }, () => null, io());
    expect(() => s.play('contractWarn')).not.toThrow();
  });
});
