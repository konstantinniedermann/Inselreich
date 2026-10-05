import { describe, expect, it } from 'vitest';
import { createIslandLayers } from '../../src/ui/islandLayers';

function setup(doneAfter: Record<number, number> = { 1: 1, 2: 1 }) {
  const calls: string[] = [];
  const left: Record<number, number> = { ...doneAfter };
  const queue: (() => void)[] = [];
  const plan = {
    idle: () => {
      calls.push('idle');
      for (const k of [1, 2]) if (left[k]! > 0) return (left[k]!--, 1);
      return 0;
    },
    finish: (i: number) => {
      calls.push(`finish${i}`);
      left[i] = 0;
      return 1;
    },
    done: (i: number) => (left[i] ?? 0) <= 0,
  };
  const layers = createIslandLayers<string>({
    home: 'H',
    plan,
    layerOf: (i) => `L${i}`,
    islands: 3,
    schedule: (cb) => queue.push(cb),
  });
  return { calls, queue, layers };
}

describe('M12 E1 Inselebenen', () => {
  it('vor frameDone() kein schedule und kein idle; get(0) ohne Plan-Zugriff', () => {
    const { calls, queue, layers } = setup();
    expect(layers.get(0)).toBe('H');
    expect(queue.length).toBe(0);
    expect(calls).toEqual([]);
  });

  it('nach frameDone() je Slot ein idle(), Neuplanung bis alle fertig', () => {
    const { calls, queue, layers } = setup();
    layers.frameDone();
    expect(queue.length).toBe(1);
    queue.shift()!();
    expect(calls).toEqual(['idle']);
    expect(queue.length).toBe(1);
    queue.shift()!();
    expect(calls).toEqual(['idle', 'idle']);
    expect(layers.get(1)).toBe('L1');
    expect(layers.get(2)).toBe('L2');
    expect(queue.length).toBe(1);
    queue.shift()!(); // alle fertig: kein weiterer Slot
    expect(queue.length).toBe(0);
    layers.frameDone();
    expect(queue.length).toBe(0);
  });

  it('get(2) vor done(2) ruft finish(2) im selben Aufruf, zaehlt Notfall-Frame einmal je Frame', () => {
    const { calls, layers } = setup();
    expect(layers.get(2)).toBe('L2');
    expect(calls).toEqual(['finish2']);
    expect(layers.emergencyFrames).toBe(1);
    layers.get(2); // fertig: kein zweiter Notfall
    expect(layers.emergencyFrames).toBe(1);
  });

  it('nach dispose() fuehrt ein ausstehender Slot nichts aus', () => {
    const { calls, queue, layers } = setup();
    layers.frameDone();
    layers.dispose();
    queue.shift()!();
    expect(calls).toEqual([]);
    expect(queue.length).toBe(0);
  });
});
