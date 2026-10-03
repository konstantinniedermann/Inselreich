import { describe, expect, it } from 'vitest';
import { createSound, THROTTLE_MS, type SoundEvent } from '../../src/audio/sound';

// Der Fake bildet nur die Knoten-API nach, die sound.ts nutzt.
interface FakeNode {
  gain: { value: number };
  target?: unknown;
  [k: string]: unknown;
}

function fakeCtx() {
  const log = {
    nodes: 0,
    resume: 0,
    suspend: 0,
    close: 0,
    bufferStarts: 0,
    gains: [] as FakeNode[],
    sets: [] as Array<{ gain: unknown; kind: string; v: number; t: number }>,
  };
  const param = () => {
    const p = {
      value: 1,
      cancelScheduledValues() {
        log.sets.push({ gain: p, kind: 'cancel', v: 0, t: 0 });
      },
      setValueAtTime(v: number, t: number) {
        log.sets.push({ gain: p, kind: 'set', v, t });
      },
      linearRampToValueAtTime(v: number, t: number) {
        log.sets.push({ gain: p, kind: 'ramp', v, t });
      },
      exponentialRampToValueAtTime() {},
    };
    return p;
  };
  const node = () => {
    log.nodes += 1;
    const n: FakeNode = {
      connect(target: unknown) {
        n.target = target;
        return target;
      },
      disconnect() {},
      start() {},
      stop() {},
      gain: param(),
      frequency: param(),
      Q: param(),
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
    createGain: () => {
      const g = node();
      log.gains.push(g);
      return g;
    },
    createOscillator: node,
    createBufferSource: () => {
      const n = node();
      n.start = () => {
        log.bufferStarts += 1;
      };
      return n;
    },
    createBiquadFilter: node,
    createBuffer: (_c: number, len: number) => ({ getChannelData: () => new Float32Array(len) }),
    resume() {
      log.resume += 1;
      ctx.state = 'running';
      return Promise.resolve();
    },
    suspend() {
      log.suspend += 1;
      ctx.state = 'suspended';
      return Promise.resolve();
    },
    close() {
      log.close += 1;
      return Promise.resolve();
    },
  };
  return { ctx: ctx as unknown as AudioContext, log };
}

// Kein Netz, kein Media-Element: Rückfälle statt echter fetch-Aufrufe.
const fakeIo = () => ({
  baseUrl: '/',
  fetchBuffer: () => Promise.reject(new Error('404')),
  mediaFactory: (): never => {
    throw new Error('kein Media-Element im Test');
  },
});

const setTime = (ctx: AudioContext, t: number) => {
  (ctx as { currentTime: number }).currentTime = t;
};

const ALL: SoundEvent[] = [
  'build',
  'demolish',
  'coin',
  'order',
  'orderDone',
  'upgrade',
  'error',
  'win',
  'alarm',
  'stormWarning',
  'boom',
];

describe('sound', () => {
  it('AK-A2-01 Fabrik liefert null: alles fehlerfrei, keine Knoten', () => {
    const s = createSound({ muted: false, volume: 0.4 }, () => null);
    expect(() => {
      s.unlock();
      ALL.forEach((e) => s.play(e));
      s.setMuted(true);
      s.setVolume(0.2);
      s.setHidden(true);
      s.setHidden(false);
      s.dispose();
    }).not.toThrow();
  });

  it('AK-A2-01 Fabrik wirft: alles fehlerfrei', () => {
    const s = createSound({ muted: false, volume: 0.4 }, () => {
      throw new Error('kein Web Audio');
    });
    expect(() => {
      s.unlock();
      ALL.forEach((e) => s.play(e));
      s.setMuted(false);
      s.setVolume(0.2);
      s.setHidden(true);
      s.setHidden(false);
      s.dispose();
    }).not.toThrow();
  });

  it('AK-A2-01 Standardfabrik (node ohne AudioContext) fällt still zurück', () => {
    const s = createSound({ muted: false, volume: 0.4 });
    expect(() => {
      s.unlock();
      s.play('error');
      s.setHidden(true);
      s.dispose();
    }).not.toThrow();
  });

  it('AK-A2-01 Fabrik wird erst bei unlock() aufgerufen', () => {
    let calls = 0;
    const { ctx } = fakeCtx();
    const s = createSound({ muted: false, volume: 0.4 }, () => {
      calls += 1;
      return ctx;
    });
    expect(calls).toBe(0);
    s.unlock();
    s.unlock();
    expect(calls).toBe(1);
  });

  it('AK-A2-02 Master 0.4, setVolume, Stumm und Meeresrauschen 15 % relativ', () => {
    const { ctx, log } = fakeCtx();
    const s = createSound({ muted: false, volume: 0.4 }, () => ctx, fakeIo());
    s.unlock();
    const master = log.gains[0]!; // erster Gain: Master
    const sea = log.gains[6]!; // Meeresrauschen, hängt am Umgebungs-Bus (nach Master, Effekte, Musik, Duck, Umgebung, Duck)
    expect(master.gain.value).toBe(0.4);
    expect(sea.gain.value).toBe(0.15);
    s.setVolume(0.1);
    expect(master.gain.value).toBe(0.1);
    s.setMuted(true);
    expect(master.gain.value).toBe(0); // Meeresrauschen hängt am Master, damit auch stumm
    s.setMuted(false);
    expect(master.gain.value).toBe(0.1);
    s.setMuted(true);
    s.setVolume(0.7); // Lautstärke im Stummzustand wird gemerkt, bleibt aber stumm
    expect(master.gain.value).toBe(0);
    s.setMuted(false);
    expect(master.gain.value).toBe(0.7);
  });

  it('AK-A2-02 Stumm vor unlock() gilt nach unlock()', () => {
    const { ctx, log } = fakeCtx();
    const s = createSound({ muted: true, volume: 0.4 }, () => ctx, fakeIo());
    s.setVolume(0.3);
    s.unlock();
    expect(log.gains[0]!.gain.value).toBe(0);
    s.setMuted(false);
    expect(log.gains[0]!.gain.value).toBe(0.3);
  });

  it('AK-A2-02 stumm erzeugt play() keine Stimmen', () => {
    const { ctx, log } = fakeCtx();
    const s = createSound({ muted: true, volume: 0.4 }, () => ctx, fakeIo());
    s.unlock();
    const base = log.nodes;
    s.play('win');
    expect(log.nodes).toBe(base);
    s.setMuted(false);
    s.play('win');
    expect(log.nodes).toBeGreaterThan(base);
  });

  it('AK-A2-03 Drossel je Ereignis misst an currentTime', () => {
    const { ctx, log } = fakeCtx();
    const s = createSound({ muted: false, volume: 0.4 }, () => ctx, fakeIo());
    s.unlock();
    const base = log.nodes;
    const voices = () => log.nodes - base;
    s.play('build');
    const one = voices();
    setTime(ctx, 0.05);
    s.play('build');
    expect(voices()).toBe(one); // gedrosselt (< 80 ms)
    setTime(ctx, 0.09);
    s.play('build');
    expect(voices()).toBe(2 * one); // zweite Stimme
  });

  it('AK-A2-03 coin bei 0 / 0.04 / 0.06', () => {
    const { ctx, log } = fakeCtx();
    const s = createSound({ muted: false, volume: 0.4 }, () => ctx, fakeIo());
    s.unlock();
    const base = log.nodes;
    s.play('coin');
    const one = log.nodes - base;
    setTime(ctx, 0.04);
    s.play('coin');
    expect(log.nodes - base).toBe(one);
    setTime(ctx, 0.06);
    s.play('coin');
    expect(log.nodes - base).toBe(2 * one);
  });

  it('AK-A2-03 THROTTLE_MS enthält die Spec-Werte', () => {
    expect(THROTTLE_MS).toEqual({
      build: 80,
      demolish: 80,
      coin: 50,
      upgrade: 300,
      error: 150,
      alarm: 2000,
      stormWarning: 5000,
      boom: 2000,
    });
  });

  it.each(Object.entries(THROTTLE_MS) as Array<[SoundEvent, number]>)(
    'AK-A2-03 %s: gedrosselt knapp vor %i ms, erlaubt danach',
    (e, ms) => {
      const { ctx, log } = fakeCtx();
      const s = createSound({ muted: false, volume: 0.4 }, () => ctx, fakeIo());
      s.unlock();
      setTime(ctx, 10);
      const base = log.nodes;
      s.play(e);
      const one = log.nodes - base;
      expect(one).toBeGreaterThan(0);
      setTime(ctx, 10 + (ms - 1) / 1000);
      s.play(e);
      expect(log.nodes - base).toBe(one);
      setTime(ctx, 10 + (ms + 1) / 1000);
      s.play(e);
      expect(log.nodes - base).toBe(2 * one);
    },
  );

  it('AK-A2-03 ungedrosselte Ereignisse (order, orderDone, win) spielen jedes Mal', () => {
    for (const e of ['order', 'orderDone', 'win'] as const) {
      const { ctx, log } = fakeCtx();
      const s = createSound({ muted: false, volume: 0.4 }, () => ctx, fakeIo());
      s.unlock();
      const base = log.nodes;
      s.play(e);
      const one = log.nodes - base;
      s.play(e);
      expect(log.nodes - base).toBe(2 * one);
    }
  });

  it('AK-A2-03 Drossel gilt je Ereignis, nicht übergreifend', () => {
    const { ctx, log } = fakeCtx();
    const s = createSound({ muted: false, volume: 0.4 }, () => ctx, fakeIo());
    s.unlock();
    const base = log.nodes;
    s.play('build');
    const one = log.nodes - base;
    s.play('error');
    expect(log.nodes - base).toBeGreaterThan(one);
  });

  it('AK-A2-04 vor unlock() erzeugt play() keine Knoten', () => {
    const { ctx, log } = fakeCtx();
    const s = createSound({ muted: false, volume: 0.4 }, () => ctx, fakeIo());
    ALL.forEach((e) => s.play(e));
    expect(log.nodes).toBe(0);
  });

  it('AK-A2-04 unlock() ruft resume() und startet das Rauschen genau einmal', () => {
    const { ctx, log } = fakeCtx();
    const s = createSound({ muted: false, volume: 0.4 }, () => ctx, fakeIo());
    s.unlock();
    expect(log.resume).toBe(1);
    expect(log.bufferStarts).toBe(1);
    const nodes = log.nodes;
    s.unlock();
    expect(log.resume).toBe(1);
    expect(log.bufferStarts).toBe(1);
    expect(log.nodes).toBe(nodes);
  });

  it('AK-A2-05 setHidden(true) ruft suspend(), setHidden(false) resume()', () => {
    const { ctx, log } = fakeCtx();
    const s = createSound({ muted: false, volume: 0.4 }, () => ctx, fakeIo());
    s.unlock();
    const r = log.resume;
    s.setHidden(true);
    expect(log.suspend).toBe(1);
    s.setHidden(false);
    expect(log.resume).toBe(r + 1);
  });

  it('AK-A2-05 setHidden(false) ohne unlock() ruft kein resume()', () => {
    const { ctx, log } = fakeCtx();
    const s = createSound({ muted: false, volume: 0.4 }, () => ctx, fakeIo());
    s.setHidden(true);
    s.setHidden(false);
    expect(log.resume).toBe(0);
    expect(log.suspend).toBe(0);
  });

  it('AK-A2-05 setHidden(false) bei stumm ruft kein resume()', () => {
    const { ctx, log } = fakeCtx();
    const s = createSound({ muted: false, volume: 0.4 }, () => ctx, fakeIo());
    s.unlock();
    s.setHidden(true);
    s.setMuted(true);
    const r = log.resume;
    s.setHidden(false);
    expect(log.resume).toBe(r);
  });

  it('RF-4a setVolume klemmt ungültige Werte', () => {
    const { ctx, log } = fakeCtx();
    const s = createSound({ muted: false, volume: 0.4 }, () => ctx, fakeIo());
    s.unlock();
    const master = log.gains[0]!;
    s.setVolume(Number.NaN);
    expect(master.gain.value).toBe(0.4); // ungültig → Wert bleibt
    s.setVolume('0.4' as unknown as number);
    expect(master.gain.value).toBe(0.4);
    s.setVolume(-1);
    expect(master.gain.value).toBe(0);
    s.setVolume(2);
    expect(master.gain.value).toBe(1);
  });

  it.each([
    [Number.NaN, 0.4],
    [-1, 0],
    [2, 1],
    ['0.4' as unknown as number, 0.4],
  ])('RF-4a Startwert %s ergibt Master %s', (v, expected) => {
    const { ctx, log } = fakeCtx();
    const s = createSound({ muted: false, volume: v }, () => ctx, fakeIo());
    s.unlock();
    expect(log.gains[0]!.gain.value).toBe(expected);
  });

  it('dispose() stoppt, schliesst den Kontext; danach wirkungslos', () => {
    const { ctx, log } = fakeCtx();
    const s = createSound({ muted: false, volume: 0.4 }, () => ctx, fakeIo());
    s.unlock();
    s.dispose();
    expect(log.close).toBe(1);
    const nodes = log.nodes;
    expect(() => {
      s.play('win');
      s.unlock();
      s.setVolume(0.2);
      s.setMuted(true);
      s.setHidden(true);
      s.dispose();
    }).not.toThrow();
    expect(log.nodes).toBe(nodes);
    expect(log.close).toBe(1);
  });

  describe('M7-A1', () => {
    const view = { water: 0, green: 0, forest: 0, rock: 0, coast: 0, inhabitants: 0, zoom: 1 };
    const input = { view, phase: 'day', weather: { kind: 'clear', w: 0 } } as const;
    const mk = (o: Partial<Parameters<typeof createSound>[0]> = {}) => {
      const { ctx, log } = fakeCtx();
      const s = createSound({ muted: false, ...o }, () => ctx, fakeIo());
      s.unlock();
      return { s, ctx, log };
    };

    it('AK-A1-01 Graph: Master am Ziel, Busse am Master (Musik/Umgebung über Duck)', () => {
      const { log, ctx } = mk();
      const [master, effects, music, dMusic, amb, dAmb] = log.gains;
      expect(master!.target).toBe((ctx as unknown as { destination: unknown }).destination);
      expect(effects!.target).toBe(master);
      expect(music!.target).toBe(dMusic);
      expect(dMusic!.target).toBe(master);
      expect(amb!.target).toBe(dAmb);
      expect(dAmb!.target).toBe(master);
      expect(log.gains[6]!.target).toBe(amb); // Meer an genau einem Bus
    });

    it('setBus ignoriert Namen ausserhalb der Busse (toString, __proto__)', () => {
      const { s } = mk();
      const before = s.debugState().buses;
      expect(() => {
        s.setBus('toString' as never, 0.9);
        s.setBus('__proto__' as never, 0.9);
        s.setBus('constructor' as never, 0.9);
      }).not.toThrow();
      expect(s.debugState().buses).toEqual(before);
    });

    it('AK-A1-01 Standardpegel und Klemmen; setVolume = setBus(master); Stumm setzt Master 0', () => {
      const { s, log } = mk();
      expect(s.debugState().buses).toEqual({ master: 0.4, music: 0.5, ambience: 0.7, effects: 1 });
      s.setBus('music', 2);
      expect(s.debugState().buses.music).toBe(1);
      expect(log.gains[2]!.gain.value).toBe(1);
      s.setVolume(0.3);
      expect(s.debugState().buses.master).toBe(0.3);
      s.setMuted(true);
      expect(log.gains[0]!.gain.value).toBe(0);
      expect(s.debugState().buses.master).toBe(0.3);
    });

    it('AK-A1-01 volume ist Alias für master, master hat Vorrang', () => {
      expect(mk({ volume: 0.2 }).s.debugState().buses.master).toBe(0.2);
      expect(mk({ volume: 0.2, master: 0.6 }).s.debugState().buses.master).toBe(0.6);
    });

    it('AK-A1-01 Pegel vor unlock() gelten nach unlock()', () => {
      const { ctx, log } = fakeCtx();
      const s = createSound({ muted: false }, () => ctx, fakeIo());
      s.setBus('ambience', 0.2);
      s.unlock();
      expect(log.gains[4]!.gain.value).toBe(0.2);
    });

    it('AK-A1-02 Signal plant Ducking auf beiden Duck-Gains, Effekt nicht', () => {
      const { s, ctx, log } = mk();
      setTime(ctx, 5);
      s.play('build');
      expect(log.sets.some((x) => x.kind === 'ramp' && x.v === 0.5)).toBe(false);
      s.play('order');
      for (const idx of [3, 5]) {
        const mine = log.sets.filter((x) => x.gain === log.gains[idx]!.gain);
        expect(mine.map((x) => [x.kind, x.v, x.t])).toEqual([
          ['cancel', 0, 0],
          ['set', 1, 5],
          ['ramp', 0.5, 5.05],
          ['set', 0.5, 5 + 0.52 + 0.3],
          ['ramp', 1, 5 + 0.52 + 0.3 + 0.6],
        ]);
      }
      setTime(ctx, 5.2);
      expect(s.debugState().duck).toBe(0.5);
      setTime(ctx, 9);
      expect(s.debugState().duck).toBe(1);
    });

    it('AK-A1-02 zwei überlappende Signale: Ducking hält bis zum späteren Ende, vertieft nicht', () => {
      const { s, ctx, log } = mk();
      setTime(ctx, 5);
      s.play('order'); // Halten bis 5 + 0,52 + 0,3 = 5,82
      setTime(ctx, 5.4);
      s.play('win'); // Halten bis 5,4 + 1,14 + 0,3 = 6,84
      const mine = log.sets.filter((x) => x.gain === log.gains[3]!.gain).slice(-5);
      expect(mine.map((x) => [x.kind, x.v])).toEqual([
        ['cancel', 0],
        ['set', 0.5],
        ['ramp', 0.5],
        ['set', 0.5],
        ['ramp', 1],
      ]);
      expect(mine[3]!.t).toBeCloseTo(6.84, 9);
      expect(mine[4]!.t).toBeCloseTo(7.44, 9);
      setTime(ctx, 6.5); // erstes Signal längst frei, zweites hält
      expect(s.debugState().duck).toBe(0.5);
      setTime(ctx, 7.14); // Mitte der Freigabe
      expect(s.debugState().duck).toBeCloseTo(0.75, 9);
      setTime(ctx, 8);
      expect(s.debugState().duck).toBe(1);
    });

    it('AK-A1-03 alarm, stormWarning, boom spielen ohne Wurf und erzeugen Knoten', () => {
      for (const e of ['alarm', 'stormWarning', 'boom'] as const) {
        const { s, log } = mk();
        const base = log.nodes;
        expect(() => s.play(e)).not.toThrow();
        expect(log.nodes).toBeGreaterThan(base);
      }
    });

    it('RF-5a Aufrufe vor unlock und nach dispose werfen nicht und erzeugen keine Knoten', () => {
      const { ctx, log } = fakeCtx();
      const s = createSound({ muted: false }, () => ctx, fakeIo());
      expect(() => {
        s.setBus('music', 0.2);
        s.setAmbience(input);
        s.setPhase('night');
        s.setCrisis(true);
        s.play('alarm');
        s.debugState();
      }).not.toThrow();
      expect(log.nodes).toBe(0);
      s.unlock();
      s.dispose();
      const n = log.nodes;
      expect(() => {
        s.play('alarm');
        s.setAmbience(input);
        s.setBus('master', 0.1);
        s.debugState();
      }).not.toThrow();
      expect(log.nodes).toBe(n);
    });

    it('debugState vor unlock', () => {
      const s = createSound({ muted: false }, () => null);
      expect(s.debugState()).toMatchObject({
        unlocked: false,
        duck: 1,
        layers: {},
        music: { state: 'idle', id: null },
      });
    });
  });
});

describe('M10 Ton unlock', () => {
  it("AK-U1-12 'unlock' ist zugeordnet und spielt die Figur von win (Rückfall ohne Datei)", () => {
    const count = (e: SoundEvent): number => {
      const { ctx, log } = fakeCtx();
      const s = createSound({ muted: false, volume: 0.4 }, () => ctx, fakeIo());
      s.unlock();
      const base = log.nodes;
      s.play(e);
      return log.nodes - base;
    };
    expect(count('win')).toBeGreaterThan(0);
    expect(count('unlock')).toBe(count('win'));
  });
});
