import { describe, expect, it } from 'vitest';
import { serialize } from '../../src/sim/save';
import { createWorld } from '../../src/sim/world';
import { AUTO_KEY, SAVE_KEY, listSavesFrom, type StorageLike } from '../../src/ui/storage';

function fake(entries: Record<string, string>): StorageLike {
  return { getItem: (k) => entries[k] ?? null };
}

function saveAtTick(tick: number): string {
  const w = createWorld(7);
  w.tick = tick;
  return serialize(w);
}

describe('listSavesFrom (RF-1, AK-U2-04, AK-U2-10)', () => {
  it('AK-U2-04: beide Slots vorhanden -> beide mit Tick, manuell zuerst', () => {
    const s = fake({ [SAVE_KEY]: saveAtTick(120), [AUTO_KEY]: saveAtTick(340) });
    expect(listSavesFrom(s)).toEqual([
      { slot: 'manual', tick: 120 },
      { slot: 'auto', tick: 340 },
    ]);
  });

  it('AK-U2-10: nur Autosave oder nur manuell vorhanden -> genau ein Eintrag', () => {
    expect(listSavesFrom(fake({ [AUTO_KEY]: saveAtTick(5) }))).toEqual([{ slot: 'auto', tick: 5 }]);
    expect(listSavesFrom(fake({ [SAVE_KEY]: saveAtTick(6) }))).toEqual([
      { slot: 'manual', tick: 6 },
    ]);
  });

  it('AK-U2-10: nichts vorhanden -> leere Liste', () => {
    expect(listSavesFrom(fake({}))).toEqual([]);
  });

  it('RF-1: kaputter Autosave (Müll) wird nicht angeboten, manueller bleibt', () => {
    const s = fake({ [SAVE_KEY]: saveAtTick(50), [AUTO_KEY]: 'kein json {{' });
    expect(listSavesFrom(s)).toEqual([{ slot: 'manual', tick: 50 }]);
  });

  it('RF-1: fremder Stand (falsche Version / Struktur) im Autosave wird nicht angeboten', () => {
    const s1 = fake({ [AUTO_KEY]: JSON.stringify({ version: 99 }) });
    const s2 = fake({ [AUTO_KEY]: JSON.stringify({ version: 2, seed: 1 }) });
    expect(listSavesFrom(s1)).toEqual([]);
    expect(listSavesFrom(s2)).toEqual([]);
  });

  it('RF-1: ein Speicher, der beim Lesen wirft, ergibt keine Ausnahme', () => {
    const s: StorageLike = {
      getItem: () => {
        throw new Error('gesperrt');
      },
    };
    expect(listSavesFrom(s)).toEqual([]);
  });
});
