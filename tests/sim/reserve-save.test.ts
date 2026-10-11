import { describe, expect, it } from 'vitest';
import { deserialize, serialize } from '../../src/sim/save';
import type { World } from '../../src/sim/types';
import { createWorld } from '../../src/sim/world';
import { foldBackToV11 } from './helpers';

const jsonOf = (w: World): Record<string, unknown> =>
  JSON.parse(serialize(w)) as Record<string, unknown>;
const islandsOf = (raw: Record<string, unknown>): Record<string, unknown>[] =>
  raw.islands as Record<string, unknown>[];

describe('AK-SB-11 Save: Sperrbestand', () => {
  it('Rundlauf erhält reserve inklusive Wert 40', () => {
    const w = createWorld(3);
    w.islands[0]!.reserve = { wood: 40, stone: 20 };
    w.islands[1]!.reserve = { wood: 60, stone: 0 };
    const r = deserialize(serialize(w));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.world.islands.map((i) => i.reserve)).toEqual(w.islands.map((i) => i.reserve));
  });

  it('v11-Stand ohne reserve lädt mit reserve 0 auf jeder Insel', () => {
    const v11 = foldBackToV11(jsonOf(createWorld(3)));
    for (const isl of islandsOf(v11)) expect(isl).not.toHaveProperty('reserve');
    const r = deserialize(JSON.stringify(v11));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.world.islands.length).toBeGreaterThan(1);
    for (const isl of r.world.islands) expect(isl.reserve).toEqual({ wood: 0, stone: 0 });
  });

  it('Wert 30, unbekanntes Gut und fehlendes Feld werden abgewiesen', () => {
    const edits: Array<(isl: Record<string, unknown>) => void> = [
      (isl) => (isl.reserve = { wood: 30, stone: 0 }),
      (isl) => (isl.reserve = { wood: 0, stone: 0, coal: 0 }),
      (isl) => (isl.reserve = { wood: 0 }),
      (isl) => (isl.reserve = null),
      (isl) => delete isl.reserve,
    ];
    for (const edit of edits) {
      const raw = jsonOf(createWorld(3));
      edit(islandsOf(raw)[1]!);
      expect(deserialize(JSON.stringify(raw))).toEqual({
        ok: false,
        reason: 'Beschädigter Spielstand',
      });
    }
  });

  it('Gebäude mit waitingReserve lädt', () => {
    const w = createWorld(3);
    const b = Object.values(w.buildings)[0]!;
    b.state = 'waitingReserve';
    const r = deserialize(serialize(w));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.world.buildings[b.id]!.state).toBe('waitingReserve');
  });

  describe('Rückfaltung foldBackToV11', () => {
    it('Insel mit reserve.stone 20 → foldBackToV11 wirft', () => {
      const raw = jsonOf(createWorld(3));
      islandsOf(raw)[1]!.reserve = { wood: 0, stone: 20 };
      expect(() => foldBackToV11(raw)).toThrow('Sperrbestand nicht rückfaltbar');
    });
    it('Insel mit reserve.wood 40 → foldBackToV11 wirft', () => {
      const raw = jsonOf(createWorld(3));
      islandsOf(raw)[0]!.reserve = { wood: 40, stone: 0 };
      expect(() => foldBackToV11(raw)).toThrow('Sperrbestand nicht rückfaltbar');
    });
    it('alle Werte 0: reserve entfällt, Schlüsselfolge der Insel bleibt', () => {
      const out = foldBackToV11(jsonOf(createWorld(3)));
      for (const isl of islandsOf(out)) expect(isl).not.toHaveProperty('reserve');
    });
  });
});
