import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { placeBuilding } from '../../src/sim/build';
import { canPlace } from '../../src/sim/placement';
import { SAVE_VERSION, deserialize, migrateV11ToV12, serialize } from '../../src/sim/save';
import type { Monument, World } from '../../src/sim/types';
import { MONUMENT_STAGES } from '../../src/sim/defs/monument';
import { step } from '../../src/sim/tick';
import { createWorld } from '../../src/sim/world';
import { friendlyReason } from '../../src/ui/hints';
import {
  V11_WORLD_KEYS,
  foldBackToV10,
  foldBackToV11,
  foldBackToV12,
  foldBackToV9,
} from './helpers';
import { MONUMENT_AT, monumentWorld } from './monumentHelpers';

const BAD = { ok: false, reason: 'Beschädigter Spielstand' };

/** `monumentWorld` mit gesetztem `won`: `wonMerchants` ist nur mit `won` ladbar (Save v4). */
function loadableWorld(): World {
  const w = monumentWorld();
  w.won = true;
  return w;
}

/** Welt mit gebautem Denkmal (Abschnitt 1 läuft, Zustand von Hand gesetzt; R1.4 kommt in T03). */
function withMonument(edit: (m: Monument) => void = () => undefined): World {
  const w = loadableWorld();
  const r = placeBuilding(w, 'monument', MONUMENT_AT.x, MONUMENT_AT.y);
  if (!r.ok || r.id === undefined) throw new Error('Denkmal setzen');
  const m: Monument = {
    buildingId: r.id,
    stage: 1,
    running: true,
    delivered: { stone: 37, tools: 0, glass: 12, spice: 5 },
    paused: true,
    buy: { stone: false, tools: false, glass: true, spice: false },
  };
  edit(m);
  w.monument = m;
  return w;
}

function tampered(world: World, edit: (raw: Record<string, unknown>) => void): string {
  const raw = JSON.parse(serialize(world)) as Record<string, unknown>;
  edit(raw);
  return JSON.stringify(raw);
}

const mon = (r: Record<string, unknown>): Record<string, unknown> =>
  r.monument as Record<string, unknown>;

function v11Of(w: World): Record<string, unknown> {
  return foldBackToV11(JSON.parse(serialize(w)) as Record<string, unknown>);
}

describe('M13-E2 Save v12', () => {
  it('AK-M13E2-01 createWorld schreibt die zwei Felder am Ende, version 12', () => {
    const w = createWorld(3);
    expect(w.monument).toBeNull();
    expect(w.monumentDone).toBe(false);
    const keys = Object.keys(w);
    expect(keys.slice(keys.indexOf('monument'), keys.indexOf('monument') + 2)).toEqual([
      'monument',
      'monumentDone',
    ]);
    expect(w.version).toBe(SAVE_VERSION);
  });

  describe('AK-M13E2-22 foldBackToV11', () => {
    it('ohne Denkmal: v11-Schlüssel in Folge, version 11, Rest unverändert', () => {
      const v12 = foldBackToV12(JSON.parse(serialize(createWorld(3))) as Record<string, unknown>);
      const out = foldBackToV11(v12);
      expect(Object.keys(out)).toEqual([...V11_WORLD_KEYS]);
      const hand: Record<string, unknown> = {};
      for (const k of Object.keys(v12))
        if (k !== 'monument' && k !== 'monumentDone' && k !== 'buyPct') hand[k] = v12[k];
      hand.version = 11;
      hand.islands = (hand.islands as Record<string, unknown>[]).map((isl) => {
        const rest = { ...isl };
        delete rest.reserve;
        return rest;
      });
      expect(JSON.stringify(out)).toBe(JSON.stringify(hand));
    });
    it('Insel-Zusatz reserve und Welt-Zusatz buyPct am Ende werden entfernt', () => {
      const v12 = JSON.parse(serialize(createWorld(3))) as Record<string, unknown>;
      const plain = JSON.stringify(foldBackToV11(v12));
      const islands = v12.islands as Record<string, unknown>[];
      for (const isl of islands) isl.reserve = { wood: 0, stone: 0 };
      v12.buyPct = { wood: 100 };
      expect(JSON.stringify(foldBackToV11(v12))).toBe(plain);
    });
    it('Insel mit abweichender Schlüsselfolge behält ihre Folge', () => {
      const v12 = JSON.parse(serialize(createWorld(3))) as Record<string, unknown>;
      const isl = (v12.islands as Record<string, unknown>[])[0]!;
      const swapped = { ox: isl.ox, oy: isl.oy, anchor: isl.anchor, ...isl };
      (v12.islands as unknown[])[0] = swapped;
      const out = foldBackToV11(v12);
      expect(Object.keys((out.islands as Record<string, unknown>[])[0]!)).toEqual(
        Object.keys(swapped).filter((k) => k !== 'reserve'),
      );
    });
    it('Denkmal gesetzt, Fertig-Merker oder Denkmal-Gebäude wirft', () => {
      const msg = 'foldBackToV11: Denkmal nicht rückfaltbar';
      const w = withMonument();
      expect(() => v11Of(w)).toThrow(msg);
      const done = JSON.parse(serialize(createWorld(3))) as Record<string, unknown>;
      done.monumentDone = true;
      expect(() => foldBackToV11(done)).toThrow(msg);
      const b = JSON.parse(serialize(w)) as Record<string, unknown>;
      b.monument = null;
      expect(() => foldBackToV11(b)).toThrow(msg);
    });
    it('foldBackToV10 und foldBackToV9 nehmen v12 an', () => {
      const v12 = JSON.parse(serialize(createWorld(3))) as Record<string, unknown>;
      expect(foldBackToV10(v12).version).toBe(10);
      expect(foldBackToV9(v12).version).toBe(9);
    });
  });

  it('AK-M13E2-23 Rundlauf mit Denkmal Abschnitt 1, laufend', () => {
    const w = withMonument();
    const r = deserialize(serialize(w));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.world).toEqual(w);
  });

  describe('AK-M13E2-24 Migration', () => {
    it('v11-Stand mit wonMerchants', () => {
      const w = loadableWorld();
      const r = deserialize(JSON.stringify(v11Of(w)));
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      expect(r.world.version).toBe(SAVE_VERSION);
      expect(r.world.monument).toBeNull();
      expect(r.world.monumentDone).toBe(false);
      expect(r.world.wonMerchants).toBe(true);
    });
    it('alle Fixtures v1 bis v9', () => {
      const files = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => `save-v${n}.json`);
      files.push('see-route-start-v9.json', 'z3-scenario-v9.json');
      for (const f of files) {
        const r = deserialize(readFileSync(`tests/sim/fixtures/${f}`, 'utf8'));
        expect(r.ok, f).toBe(true);
        if (!r.ok) continue;
        expect(r.world.version, f).toBe(SAVE_VERSION);
        expect(r.world.monument, f).toBeNull();
        expect(r.world.monumentDone, f).toBe(false);
      }
    });
    it('migrateV11ToV12 lässt vorhandene Werte stehen', () => {
      const raw: Record<string, unknown> = { version: 11, monumentDone: true };
      migrateV11ToV12(raw);
      expect(raw.version).toBe(12);
      expect(raw.monument).toBeNull();
      expect(raw.monumentDone).toBe(true);
    });
    it('migrateV11ToV12 lässt ein vorhandenes monument-Objekt unverändert stehen', () => {
      const monument = {
        buildingId: 7,
        stage: 1,
        running: true,
        delivered: { stone: 3, tools: 0, glass: 1, spice: 0 },
        paused: true,
        buy: { stone: false, tools: true, glass: false, spice: false },
      };
      const raw: Record<string, unknown> = { version: 11, monument: structuredClone(monument) };
      migrateV11ToV12(raw);
      expect(raw.monument).toEqual(monument);
      expect(raw.monumentDone).toBe(false);
    });
  });

  it('AK-M13E2-17 geladener v11-Stand erlaubt den Denkmalbau', () => {
    const r = deserialize(JSON.stringify(v11Of(loadableWorld())));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(canPlace(r.world, 'monument', MONUMENT_AT.x, MONUMENT_AT.y).ok).toBe(true);
  });

  describe('AK-M13E2-25 Ladeprüfung V1 bis V9', () => {
    const cases: [string, (r: Record<string, unknown>) => void][] = [
      ['25a monumentDone String', (r) => (r.monumentDone = 'ja')],
      ['25a monumentDone fehlt (v12)', (r) => delete r.monumentDone],
      ['25b Zusatzschlüssel', (r) => (mon(r).x = 1)],
      ['25b ohne buy', (r) => delete mon(r).buy],
      [
        '25c running kein Boolean',
        (r) => {
          mon(r).running = 'ja';
          mon(r).delivered = { stone: 0, tools: 0, glass: 0, spice: 0 };
        },
      ],
      ['25c paused kein Boolean', (r) => (mon(r).paused = 1)],
      ['25d delivered negativ', (r) => ((mon(r).delivered as Record<string, number>).tools = -1)],
      [
        '25d delivered nicht ganzzahlig',
        (r) => ((mon(r).delivered as Record<string, number>).tools = 0.5),
      ],
      ['25c stage -1', (r) => (mon(r).stage = -1)],
      ['25c stage 4', (r) => (mon(r).stage = 4)],
      ['25c stage 1,5', (r) => (mon(r).stage = 1.5)],
      ['25c stage String', (r) => (mon(r).stage = '2')],
      [
        '25d Überlieferung',
        (r) => {
          mon(r).stage = 0;
          (mon(r).delivered as Record<string, number>).stone = 201;
        },
      ],
      [
        '25e ruhend mit Rest',
        (r) => {
          mon(r).running = false;
          (mon(r).delivered as Record<string, number>).glass = 3;
        },
      ],
      [
        '25f delivered mit wood',
        (r) => {
          const d = mon(r).delivered as Record<string, number>;
          delete d.spice;
          d.wood = 1;
        },
      ],
      ['25f buy.spice 1', (r) => ((mon(r).buy as Record<string, unknown>).spice = 1)],
      ['25g stage 3 laufend', (r) => (mon(r).stage = 3)],
      [
        '25g stage 3 ohne monumentDone',
        (r) => {
          mon(r).stage = 3;
          mon(r).running = false;
          mon(r).delivered = { stone: 0, tools: 0, glass: 0, spice: 0 };
        },
      ],
      ['25h wonMerchants false', (r) => (r.wonMerchants = false)],
      ['25i buildingId unbekannt', (r) => (mon(r).buildingId = 9999)],
      ['25i buildingId Kontor', (r) => (mon(r).buildingId = 1)],
      ['25i buildingId Bruch', (r) => (mon(r).buildingId = 1.5)],
      [
        '25i Denkmal auf Insel 1',
        (r) => {
          const b = (r.buildings as Record<string, Record<string, unknown>>)[
            String(mon(r).buildingId)
          ]!;
          b.island = 1;
        },
      ],
      ['25j Gebäude da, monument null', (r) => (r.monument = null)],
      [
        '25j zwei Denkmal-Gebäude',
        (r) => {
          const bs = r.buildings as Record<string, Record<string, unknown>>;
          bs['9999'] = { ...bs[String(mon(r).buildingId)]!, id: 9999 };
        },
      ],
    ];
    it.each(cases)('AK-M13E2-%s', (_n, edit) => {
      expect(deserialize(tampered(withMonument(), edit))).toEqual(BAD);
    });

    it('AK-M13E2-25k laufend, alle Reste 0: lädt ok', () => {
      const w = withMonument((m) => {
        m.delivered = { stone: 0, tools: 0, glass: 0, spice: 0 };
      });
      expect(deserialize(serialize(w)).ok).toBe(true);
    });
    it('AK-M13E2-25k geladener Stand laufend, alle Reste 0: nach einem step stage +1, running false', () => {
      const w = withMonument((m) => {
        m.delivered = { ...MONUMENT_STAGES[1]!.goods };
      });
      const r = deserialize(serialize(w));
      if (!r.ok) throw new Error('laden');
      step(r.world);
      expect(r.world.monument).toMatchObject({ stage: 2, running: false });
    });

    it('AK-M13E2-25 A6 stage 3 laufend → beschädigt ohne Wurf, fertig ruhend → ok', () => {
      const w = withMonument((m) => {
        m.stage = 3;
      });
      w.monumentDone = true;
      expect(deserialize(serialize(w))).toEqual(BAD);
      const done = withMonument((m) => {
        m.stage = 3;
        m.running = false;
        m.delivered = { stone: 0, tools: 0, glass: 0, spice: 0 };
      });
      done.monumentDone = true;
      expect(deserialize(serialize(done)).ok).toBe(true);
    });
  });

  it('AK-M13E2-26 neuere Version und abgeschnittener Text', () => {
    const w = createWorld(3);
    const newer = deserialize(JSON.stringify({ ...w, version: SAVE_VERSION + 1 }));
    expect(newer).toEqual({ ok: false, reason: 'Unbekannte Version' });
    const cut = deserialize('{"version": 12');
    expect(cut).toEqual({ ok: false, reason: 'Ungültiges Format' });
    for (const r of [newer, cut]) {
      if (r.ok) continue;
      expect(friendlyReason(w, r.reason).length).toBeGreaterThan(0);
    }
  });
});
