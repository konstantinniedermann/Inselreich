import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SAVE_VERSION, deserialize, serialize } from '../../src/sim/save';
import { ok, type World } from '../../src/sim/types';
import { createWorld } from '../../src/sim/world';
import {
  AUTO2_KEY,
  AUTO_KEY,
  AUTO_LAST_KEY,
  AUTO_WRITTEN_KEY,
  SAVE_KEY,
  autosaveOnHide,
  listSavesFrom,
  loadNotice,
  loadSlot,
  newestAuto,
  otherAuto,
  saveAuto,
  saveToStorage,
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

describe('saveToStorage Fehlerweg (AK-UT-09)', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('AK-UT-09: setItem wirft -> Speichern fehlgeschlagen, kein Wurf', () => {
    vi.stubGlobal('localStorage', {
      setItem() {
        throw new Error('QuotaExceededError');
      },
    });
    expect(saveToStorage(createWorld(3))).toEqual({
      ok: false,
      reason: 'Speichern fehlgeschlagen',
    });
  });
});

/** Schreibbarer Fake-Speicher; `failKeys` lassen `setItem` für diese Schlüssel werfen. */
function mem(entries: Record<string, string> = {}, failKeys: string[] = []) {
  const data = { ...entries };
  const removed: string[] = [];
  return {
    data,
    removed,
    getItem: (k: string): string | null => data[k] ?? null,
    setItem(k: string, v: string): void {
      if (failKeys.includes(k)) throw new Error('QuotaExceededError');
      data[k] = v;
    },
    removeItem(k: string): void {
      removed.push(k);
      delete data[k];
    },
  };
}
const worldAt = (tick: number): World => {
  const w = createWorld(7);
  w.tick = tick;
  return w;
};

describe('Autosave-Plätze (I-147, AK-H1 bis H3, H5, H6, H8, H10)', () => {
  afterEach(() => vi.unstubAllGlobals());
  const use = (m: ReturnType<typeof mem>): void => void vi.stubGlobal('localStorage', m);

  it('H1: saveAuto wechselt die Plätze und setzt den Zeiger', () => {
    const m = mem({ [AUTO_KEY]: saveAtTick(10), [AUTO_LAST_KEY]: 'auto' });
    use(m);
    const seen: (string | undefined)[] = [];
    for (let i = 1; i <= 3; i++) {
      expect(saveAuto(worldAt(100 + i))).toEqual(ok);
      seen.push(m.data[AUTO_LAST_KEY]);
    }
    expect(seen).toEqual(['auto2', 'auto', 'auto2']);
  });

  it('H2: otherAuto ohne Zeiger wählt fehlenden, beschädigten, sonst älteren Platz', () => {
    expect(otherAuto(fake({ [AUTO_KEY]: saveAtTick(5) }))).toBe('auto2');
    expect(otherAuto(fake({ [AUTO2_KEY]: saveAtTick(5) }))).toBe('auto');
    expect(otherAuto(fake({ [AUTO_KEY]: saveAtTick(500), [AUTO2_KEY]: saveAtTick(300) }))).toBe(
      'auto2',
    );
    expect(otherAuto(fake({ [AUTO_KEY]: saveAtTick(300), [AUTO2_KEY]: saveAtTick(500) }))).toBe(
      'auto',
    );
    expect(otherAuto(fake({ [AUTO_KEY]: saveAtTick(300), [AUTO2_KEY]: saveAtTick(300) }))).toBe(
      'auto2',
    );
    expect(otherAuto(fake({ [AUTO_KEY]: 'kaputt', [AUTO2_KEY]: saveAtTick(300) }))).toBe('auto');
  });

  it('H3: newestAuto folgt dem Zeiger, sonst der grösseren Spielzeit', () => {
    const both = { [AUTO_KEY]: saveAtTick(900), [AUTO2_KEY]: saveAtTick(100) };
    expect(newestAuto(fake({ ...both, [AUTO_LAST_KEY]: 'auto2' }))).toBe('auto2');
    expect(newestAuto(fake(both))).toBe('auto');
    expect(newestAuto(fake({ [AUTO_KEY]: saveAtTick(1), [AUTO2_KEY]: saveAtTick(1) }))).toBe(
      'auto',
    );
    expect(newestAuto(fake({ [AUTO2_KEY]: saveAtTick(1) }))).toBe('auto2');
    expect(newestAuto(fake({}))).toBeNull();
    // ein Platz: der andere ist der leere, kein «Davor»
    expect(otherAuto(fake({ [AUTO_KEY]: saveAtTick(1), [AUTO_LAST_KEY]: 'auto' }))).toBe('auto2');
  });

  it('H3: listSavesFrom führt den neuesten Autosave vor dem «Davor»', () => {
    const s = fake({
      [AUTO_KEY]: saveAtTick(100),
      [AUTO2_KEY]: saveAtTick(200),
      [AUTO_LAST_KEY]: 'auto2',
    });
    expect(listSavesFrom(s).map((i) => i.slot)).toEqual(['auto2', 'auto']);
  });

  it('H5: autosaveOnHide schreibt den neuesten Platz, Zeiger und anderer Platz bleiben', () => {
    const older = saveAtTick(50);
    const m = mem({ [AUTO_KEY]: older, [AUTO2_KEY]: saveAtTick(80), [AUTO_LAST_KEY]: 'auto2' });
    use(m);
    autosaveOnHide(worldAt(200));
    expect(m.data[AUTO_LAST_KEY]).toBe('auto2');
    expect(m.data[AUTO_KEY]).toBe(older);
    expect(m.data[AUTO2_KEY]).toBe(serialize(worldAt(200)));
  });

  it('H5: Tick 0 schreibt nichts, ohne Autosave landet der Stand in auto', () => {
    const m = mem();
    use(m);
    autosaveOnHide(worldAt(0));
    expect(m.data).toEqual({});
    autosaveOnHide(worldAt(9));
    expect(m.data[AUTO_KEY]).toBe(serialize(worldAt(9)));
    expect(m.data[AUTO_LAST_KEY]).toBeUndefined();
  });

  it('H6: scheitert das Ziel, bleiben anderer Platz und Zeiger bitgleich', () => {
    const start = { [AUTO_KEY]: saveAtTick(10), [AUTO_LAST_KEY]: 'auto' };
    const m = mem(start, [AUTO2_KEY]);
    use(m);
    expect(saveAuto(worldAt(99))).toEqual({ ok: false, reason: 'Autosave fehlgeschlagen' });
    expect(m.data).toEqual(start);
    expect(m.removed).toEqual([]);
  });

  it('H6: scheitert nur der Zeiger, gilt der Stand als gespeichert', () => {
    const m = mem({ [AUTO_KEY]: saveAtTick(10), [AUTO_LAST_KEY]: 'auto' }, [AUTO_LAST_KEY]);
    use(m);
    expect(saveAuto(worldAt(99))).toEqual(ok);
    expect(deserialize(m.data[AUTO2_KEY]!).ok).toBe(true);
  });

  it('H8: auto2 wird von storageProblem und listSavesFrom mitgeprüft', () => {
    expect(storageProblem(fake({ [AUTO2_KEY]: 'kaputt' }))).toBe('damaged');
    const newer = JSON.stringify({ version: SAVE_VERSION + 1 });
    expect(storageProblem(fake({ [AUTO2_KEY]: newer }))).toBe('newer');
    const throwing: StorageLike = {
      getItem() {
        throw new Error('gesperrt');
      },
    };
    expect(storageProblem(throwing)).toBe('unavailable');
    expect(listSavesFrom(throwing)).toEqual([]);
  });

  it('H10: beide Plätze tragen dasselbe Format wie serialize', () => {
    const m = mem();
    use(m);
    const w = worldAt(42);
    saveAuto(w);
    saveAuto(w);
    expect(m.data[AUTO_KEY]).toBe(serialize(w));
    expect(m.data[AUTO2_KEY]).toBe(serialize(w));
  });
});

describe('Zeiger beim Laden eines Autosave-Platzes (R850)', () => {
  afterEach(() => vi.unstubAllGlobals());
  const use = (m: ReturnType<typeof mem>): void => void vi.stubGlobal('localStorage', m);

  it('Davor laden, dann pagehide: der neuere Stand bleibt ladbar', () => {
    const newer = saveAtTick(900);
    const m = mem({
      [AUTO_KEY]: saveAtTick(300),
      [AUTO2_KEY]: newer,
      [AUTO_LAST_KEY]: 'auto2',
    });
    use(m);
    const r = loadSlot('auto');
    expect(r.ok).toBe(true);
    expect(m.data[AUTO_LAST_KEY]).toBe('auto');
    autosaveOnHide((r as { world: World }).world);
    expect(m.data[AUTO2_KEY]).toBe(newer);
    expect(m.data[AUTO_KEY]).toBe(serialize((r as { world: World }).world));
    expect(listSavesFrom(m).map((i) => i.slot)).toEqual(['auto', 'auto2']);
    // der nächste periodische Autosave wechselt in den anderen Platz
    saveAuto(worldAt(950));
    expect(m.data[AUTO_LAST_KEY]).toBe('auto2');
  });

  it('Laden des neuesten Platzes lässt den Zeiger stehen, manuell ändert ihn nie', () => {
    const m = mem({
      [SAVE_KEY]: saveAtTick(5),
      [AUTO_KEY]: saveAtTick(300),
      [AUTO_LAST_KEY]: 'auto',
    });
    use(m);
    loadSlot('auto');
    expect(m.data[AUTO_LAST_KEY]).toBe('auto');
    loadSlot('auto2'); // fehlt: kein Erfolg, Zeiger unberührt
    expect(m.data[AUTO_LAST_KEY]).toBe('auto');
    m.data[AUTO_LAST_KEY] = 'auto2';
    loadSlot('manual');
    expect(m.data[AUTO_LAST_KEY]).toBe('auto2');
  });

  it('Zeiger-Schreibfehler beim Laden bleibt stumm', () => {
    const m = mem({ [AUTO_KEY]: saveAtTick(300) }, [AUTO_LAST_KEY]);
    use(m);
    expect(loadSlot('auto').ok).toBe(true);
  });

  it('Zeiger auf beschädigten oder fehlenden Platz wird ignoriert', () => {
    const ok1 = { [AUTO_KEY]: saveAtTick(100), [AUTO_LAST_KEY]: 'auto2' };
    expect(newestAuto(fake(ok1))).toBe('auto');
    expect(newestAuto(fake({ ...ok1, [AUTO2_KEY]: 'kaputt' }))).toBe('auto');
    expect(otherAuto(fake(ok1))).toBe('auto2');
    expect(otherAuto(fake({ ...ok1, [AUTO2_KEY]: 'kaputt' }))).toBe('auto2');
    const ok2 = { [AUTO2_KEY]: saveAtTick(100), [AUTO_LAST_KEY]: 'auto' };
    expect(newestAuto(fake(ok2))).toBe('auto2');
    expect(otherAuto(fake(ok2))).toBe('auto');
  });
});

describe('Etikett folgt dem Schreibzeitpunkt (R851)', () => {
  afterEach(() => vi.unstubAllGlobals());
  const use = (m: ReturnType<typeof mem>): void => void vi.stubGlobal('localStorage', m);

  it('Davor laden und weiterspielen: der zuletzt geschriebene Platz ist vorn, auch bei kleinerer Spielzeit', () => {
    const m = mem({
      [AUTO_KEY]: saveAtTick(300),
      [AUTO2_KEY]: saveAtTick(900),
      [AUTO_LAST_KEY]: 'auto2',
      [AUTO_WRITTEN_KEY]: 'auto2',
    });
    use(m);
    const r = loadSlot('auto');
    // Laden verschiebt nur den Schreibzeiger, nicht die Etiketten
    expect(listSavesFrom(m).map((i) => i.slot)).toEqual(['auto2', 'auto']);
    autosaveOnHide(worldAt(310)); // schreibt in den Zeiger-Platz «auto»
    expect(r.ok).toBe(true);
    const list = listSavesFrom(m);
    expect(list.map((i) => i.slot)).toEqual(['auto', 'auto2']);
    expect(list[0]!.tick).toBeLessThan(list[1]!.tick);
    // periodisch: wechselt den Platz, der neue Stand heisst vorn
    saveAuto(worldAt(320));
    expect(listSavesFrom(m).map((i) => i.slot)).toEqual(['auto2', 'auto']);
  });

  it('ohne oder mit ungültigem Schreibzeiger gilt die bisherige Regel', () => {
    const both = {
      [AUTO_KEY]: saveAtTick(100),
      [AUTO2_KEY]: saveAtTick(200),
      [AUTO_LAST_KEY]: 'auto',
    };
    expect(listSavesFrom(fake(both)).map((i) => i.slot)).toEqual(['auto', 'auto2']);
    expect(
      listSavesFrom(fake({ ...both, [AUTO_WRITTEN_KEY]: 'quatsch' })).map((i) => i.slot),
    ).toEqual(['auto', 'auto2']);
  });

  it('scheitert das Schreiben, bleibt der Schreibzeiger unberührt', () => {
    const start = {
      [AUTO_KEY]: saveAtTick(10),
      [AUTO_WRITTEN_KEY]: 'auto',
      [AUTO_LAST_KEY]: 'auto',
    };
    const m = mem(start, [AUTO2_KEY]);
    use(m);
    saveAuto(worldAt(99));
    expect(m.data).toEqual(start);
  });
});
