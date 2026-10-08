import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SAVE_VERSION, deserialize, serialize } from '../../src/sim/save';
import { ok, type World } from '../../src/sim/types';
import { createWorld } from '../../src/sim/world';
import {
  AUTO_KEY,
  SAVE_KEY,
  autosaveOnHide,
  listSavesFrom,
  loadNotice,
  storageProblem,
  type StorageLike,
} from '../../src/ui/storage';
import { STORAGE_NOTES, startChoices } from '../../src/ui/startCard';
import { formatClock } from '../../src/ui/time';

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

it('AK-UX-01 storageProblem: werfend → unavailable, kaputt → damaged, leer → none', () => {
  expect(
    storageProblem({
      getItem: () => {
        throw new Error('gesperrt');
      },
    }),
  ).toBe('unavailable');
  const broken = { getItem: (k: string) => (k === SAVE_KEY ? '{kaputt' : null) };
  expect(storageProblem(broken)).toBe('damaged');
  expect(listSavesFrom(broken)).toEqual([]);
  expect(storageProblem({ getItem: () => null })).toBe('none');
});

describe('storageProblem: neuere Version', () => {
  const only = (json: string) => ({ getItem: (k: string) => (k === SAVE_KEY ? json : null) });
  const withVersion = (version: number): string => {
    const raw = JSON.parse(serialize(createWorld(1))) as Record<string, unknown>;
    raw.version = version;
    return JSON.stringify(raw);
  };
  it('SAVE_VERSION + 1 → newer (nicht damaged), Text nennt neuere Version', () => {
    expect(storageProblem(only(withVersion(SAVE_VERSION + 1)))).toBe('newer');
    expect(STORAGE_NOTES.newer).toBe(
      'Ein Spielstand stammt aus einer neueren Version des Spiels und kann nicht geladen werden.',
    );
    expect(startChoices([], 'newer').note).toBe(STORAGE_NOTES.newer);
  });
  it('SAVE_VERSION lädt → none', () => {
    expect(storageProblem(only(withVersion(SAVE_VERSION)))).toBe('none');
  });
  it('migrierbarer alter Stand (v2-Fixture) → none', () => {
    const json = readFileSync('tests/sim/fixtures/save-v2.json', 'utf8');
    expect(storageProblem(only(json))).toBe('none');
  });
  it('defektes JSON bleibt damaged; unbekannte alte Version bleibt damaged', () => {
    expect(storageProblem(only('{kaputt'))).toBe('damaged');
    expect(storageProblem(only('null'))).toBe('damaged');
    expect(storageProblem(only(withVersion(0)))).toBe('damaged');
  });
  it('Vorrang: newer vor damaged, in beiden Slot-Reihenfolgen', () => {
    const newer = withVersion(SAVE_VERSION + 1);
    const a = { getItem: (k: string) => (k === SAVE_KEY ? newer : k === AUTO_KEY ? '{x' : null) };
    const b = { getItem: (k: string) => (k === SAVE_KEY ? '{x' : k === AUTO_KEY ? newer : null) };
    expect(storageProblem(a)).toBe('newer');
    expect(storageProblem(b)).toBe('newer');
  });
  it('neuerer Stand wird nicht geladen (Abweisen statt Absturz)', () => {
    const s = only(withVersion(SAVE_VERSION + 1));
    expect(listSavesFrom(s)).toEqual([]);
  });
});

it('AK-UX-01 v2-Fixture im manuellen Slot ist ladbar (Migration)', () => {
  const json = readFileSync('tests/sim/fixtures/save-v2.json', 'utf8');
  const s = { getItem: (k: string) => (k === SAVE_KEY ? json : null) };
  const tick = (JSON.parse(json) as { tick: number }).tick;
  expect(listSavesFrom(s)).toEqual([{ slot: 'manual', tick }]);
  expect(storageProblem(s)).toBe('none');
  expect(startChoices(listSavesFrom(s), 'none').choices[0]!.label).toBe(
    `Gespeichertes Spiel laden (Spielzeit ${formatClock(tick)})`,
  );
});

it('RF-3 autosaveOnHide: Tick 0 schreibt nicht, werfendes Schreiben bleibt still', () => {
  const calls: number[] = [];
  autosaveOnHide({ tick: 0 } as World, () => {
    calls.push(0);
    return ok;
  });
  expect(calls).toEqual([]);
  autosaveOnHide({ tick: 5 } as World, () => {
    calls.push(5);
    return ok;
  });
  expect(calls).toEqual([5]);
  expect(() =>
    autosaveOnHide({ tick: 5 } as World, () => {
      throw new Error('voll');
    }),
  ).not.toThrow();
});

describe('M12 E2 UI Lade-Meldung', () => {
  it('loadNotice gibt den Hinweis des Ladeergebnisses zurück, sonst null', () => {
    const w = createWorld(3);
    expect(loadNotice({ ok: true, world: w, notice: 'Hinweis' })).toBe('Hinweis');
    expect(loadNotice({ ok: true, world: w })).toBeNull();
    expect(loadNotice({ ok: false, reason: 'Ungültiges Format' })).toBeNull();
  });
  it('alter Stand v8 mit Kaufleuten: Meldung beim Laden, nach dem Speichern keine mehr', () => {
    const json = readFileSync('tests/sim/fixtures/save-v8.json', 'utf8');
    const first = deserialize(json);
    expect(loadNotice(first)).not.toBeNull();
    const again = deserialize(serialize((first as { world: World }).world));
    expect(loadNotice(again)).toBeNull();
  });
});
