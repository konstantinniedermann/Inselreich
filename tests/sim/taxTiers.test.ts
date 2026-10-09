import { describe, expect, it } from 'vitest';
import { demolish, placeBuilding } from '../../src/sim/build';
import { houseCap, taxUnits, tickTaxes, upgradeStatus } from '../../src/sim/population';
import { serialize } from '../../src/sim/save';
import { TIER_IDS, TIERS } from '../../src/sim/defs/tiers';
import { TAX_SWITCH_LOCK } from '../../src/sim/defs/timing';
import {
  canRiseTier,
  noRiseReason,
  setTaxLevel,
  setTierTaxLevel,
  taxChangeSet,
  taxTarget,
} from '../../src/sim/tax';
import { step } from '../../src/sim/tick';
import { effectiveTaxLevel, taxPct } from '../../src/sim/townhall';
import { nextUnlocks, triggerTaxBlocked } from '../../src/sim/unlocks';
import { createWorld, home } from '../../src/sim/world';
import type { Building, GoodId, TaxLevel, Tier, World } from '../../src/sim/types';
import { forceGrass, placeService, placeTownhall } from './helpers';

type Levels = Record<Tier, TaxLevel>;
const lv = (a: TaxLevel, b: TaxLevel, c: TaxLevel, d: TaxLevel): Levels => ({
  1: a,
  2: b,
  3: c,
  4: d,
});
const NO_DEFICIT = { food: 99, cloth: 99, rum: 99, glass: 99, wood: 99, tools: 99, stone: 99 };

let nextTestId = 9000;

/** Legt ein Wohnhaus direkt an (ohne Kacheln); `met` bestimmt, ob alle Bedürfnisse erfüllt sind. */
function addHouse(world: World, tier: Tier, inhabitants: number, met: boolean): Building {
  const def = TIERS[tier];
  const satisfied: Partial<Record<GoodId, boolean>> = {};
  for (const g of Object.keys(def.needs) as GoodId[]) satisfied[g] = met;
  const services: Record<string, boolean> = {};
  for (const s of def.services) services[s] = met;
  const id = nextTestId++;
  const b = {
    id,
    defId: 'house',
    x: 0,
    y: 0,
    connected: true,
    progress: 0,
    state: 'ok',
    island: 0,
    house: {
      tier,
      inhabitants,
      demand: {},
      satisfied,
      services,
      satisfiedSince: 0,
      supplied: met,
    },
  } as Building;
  world.buildings[id] = b;
  return b;
}

/** Welt mit aktiver Amtsstube, ohne Häuser. */
function hallWorld(): World {
  const w = createWorld(3, { unlockAll: true });
  placeTownhall(w);
  return w;
}

const hallOf = (w: World): Building =>
  Object.values(w.buildings).find((b) => b.defId === 'townhall')!;

/** Versorgte Seed-3-Welt mit vier Häusern, Amtsstube und Diensten; Tick 449, Lager je Gut 500. */
function town4(): { w: World; houses: Building[] } {
  const w = createWorld(3, { unlockAll: true });
  const k = w.buildings[home(w).kontorId]!;
  const houses: Building[] = [];
  for (let i = 0; i < 4; i++) {
    forceGrass(w, k.x + 2, k.y + i);
    const r = placeBuilding(w, 'house', k.x + 2, k.y + i);
    if (!r.ok || r.id === undefined) throw new Error('house not placed');
    houses.push(w.buildings[r.id]!);
  }
  const services = [
    placeService(w, 'chapel', k.x + 4, k.y),
    placeService(w, 'school', k.x + 6, k.y),
    placeService(w, 'bathhouse', k.x + 8, k.y),
  ];
  w.tick = 449;
  w.money = 1000;
  for (const g of Object.keys(home(w).stock) as GoodId[]) home(w).stock[g] = 500;
  placeTownhall(w);
  for (const s of services) s.connected = true;
  return { w, houses };
}

const run = (w: World, n: number): void => {
  for (let i = 0; i < n; i++) step(w);
};

describe('AK-T04 taxPct je Stufe', () => {
  it('hoch: Kaufleute 115, Stufen 1-3 130; niedrig 70, normal 100 für alle', () => {
    expect(taxPct('high', 4)).toBe(115);
    for (const t of [1, 2, 3] as Tier[]) expect(taxPct('high', t)).toBe(130);
    for (const t of TIER_IDS) {
      expect(taxPct('low', t)).toBe(70);
      expect(taxPct('normal', t)).toBe(100);
    }
  });
});

describe('AK-T02 Steuer je Stufe (Anhang 01 A)', () => {
  it('gemischte Stufen: 133 860 Einheiten, nach 100 Ticks 669 Geld und Übertrag 6000', () => {
    const w = hallWorld();
    w.taxLevels = lv('low', 'normal', 'high', 'high');
    addHouse(w, 1, 4, true);
    addHouse(w, 2, 8, true);
    addHouse(w, 2, 8, false);
    addHouse(w, 3, 11, true);
    addHouse(w, 4, 15, true);
    w.taxCarry = 0;
    w.money = 0;
    expect(taxUnits(w)).toBe(133_860);
    for (let i = 0; i < 100; i++) tickTaxes(w);
    expect(w.money).toBe(669);
    expect(w.taxCarry).toBe(6000);
    expect(w.stats.taxes).toBe(669);
  });
});

describe('AK-T05 Kaufleute hoch', () => {
  it('20 Einwohner schrumpfen in 250 Ticks auf 15 und bleiben; Steuer 75 900 statt 88 000', () => {
    const { w, houses } = town4();
    for (const h of houses.slice(1)) demolish(w, h.id);
    for (const b of Object.values(w.buildings)) if (b.defId !== 'house') b.connected = true; // Abriss berechnet die Anbindung neu
    const h = houses[0]!;
    const hs = h.house!;
    const goods = Object.keys(TIERS[4].needs) as GoodId[];
    Object.assign(hs, {
      tier: 4,
      inhabitants: 20,
      demand: Object.fromEntries(goods.map((g) => [g, 0])),
      satisfied: Object.fromEntries(goods.map((g) => [g, true])),
      satisfiedSince: w.tick,
      supplied: true,
    });
    step(w);
    expect(w.tick).toBe(450);
    expect(hs.inhabitants).toBe(20);
    expect(taxUnits(w)).toBe(88_000);
    expect(setTierTaxLevel(w, 4, 'high')).toEqual({ ok: true });
    expect(houseCap(w, hs)).toBe(15);
    run(w, 250);
    expect(hs.inhabitants).toBe(15);
    run(w, 500);
    expect(hs.inhabitants).toBe(15);
    expect(taxUnits(w)).toBe(75_900);
  });
});

describe('AK-T06 houseCap je Stufe', () => {
  it('hoch 3 / 6 / 11 / 15, normal 4 / 8 / 15 / 20', () => {
    const w = hallWorld();
    const caps = (): number[] => TIER_IDS.map((t) => houseCap(w, addHouse(w, t, 1, true).house!));
    w.taxLevels = lv('high', 'high', 'high', 'high');
    expect(caps()).toEqual([3, 6, 11, 15]);
    w.taxLevels = lv('normal', 'normal', 'normal', 'normal');
    expect(caps()).toEqual([4, 8, 15, 20]);
  });
});

describe('AK-T07 Wartezeit je Haus', () => {
  it('Pioniere niedrig 150, Siedler normal 300, Bürger hoch Steuer zu hoch', () => {
    const w = hallWorld();
    w.tick = 1000;
    w.taxLevels = lv('low', 'normal', 'high', 'normal');
    const reasons = (tier: Tier): string[] => {
      const b = addHouse(w, tier, TIERS[tier].maxInhabitants, true);
      b.house!.satisfiedSince = w.tick - 100;
      return upgradeStatus(w, b, NO_DEFICIT).reasons;
    };
    expect(reasons(1)).toContain('Bedürfnisse noch nicht 150 Ticks erfüllt');
    expect(reasons(2)).toContain('Bedürfnisse noch nicht 300 Ticks erfüllt');
    expect(reasons(3)).toContain('Steuer zu hoch');
  });
});

describe('AK-T08 bis AK-T10 und Anhang 01 E: Sperren', () => {
  it('AK-T08 Sperre je Regler', () => {
    const w = hallWorld();
    w.tick = 1000;
    expect(setTierTaxLevel(w, 2, 'low')).toEqual({ ok: true });
    expect(w.taxLockedUntil[2]).toBe(1000 + TAX_SWITCH_LOCK);
    expect(setTierTaxLevel(w, 3, 'high')).toEqual({ ok: true });
    w.tick = 1299;
    expect(setTierTaxLevel(w, 2, 'normal')).toEqual({ ok: false, reason: 'Sperrzeit' });
    w.tick = 1300;
    expect(setTierTaxLevel(w, 2, 'normal')).toEqual({ ok: true });
    expect(w.taxLockedUntil[1]).toBe(0);
    expect(w.taxLockedUntil[4]).toBe(0);
  });

  it('AK-T09 alle Stufen atomar, nur die abweichenden Regler', () => {
    const w = hallWorld();
    w.tick = 1000;
    setTierTaxLevel(w, 1, 'low');
    w.tick = 1100;
    const before = JSON.stringify([w.taxLevels, w.taxLockedUntil]);
    expect(setTaxLevel(w, 'high')).toEqual({ ok: false, reason: 'Sperrzeit' });
    expect(JSON.stringify([w.taxLevels, w.taxLockedUntil])).toBe(before);
    expect(setTaxLevel(w, 'low')).toEqual({ ok: true });
    expect(w.taxLevels).toEqual(lv('low', 'low', 'low', 'normal'));
    expect(w.taxLockedUntil).toEqual({ 1: 1300, 2: 1400, 3: 1400, 4: 0 });
  });

  it('AK-T10 alle niedrig lässt Kaufleute normal; zweiter Aufruf und normal-auf-normal sind bereits aktiv', () => {
    const w = hallWorld();
    w.tick = 500;
    expect(setTaxLevel(w, 'normal')).toEqual({ ok: false, reason: 'Stufe bereits aktiv' });
    expect(setTaxLevel(w, 'low')).toEqual({ ok: true });
    expect(w.taxLevels).toEqual(lv('low', 'low', 'low', 'normal'));
    expect(w.taxLockedUntil).toEqual({ 1: 800, 2: 800, 3: 800, 4: 0 });
    expect(setTaxLevel(w, 'low')).toEqual({ ok: false, reason: 'Stufe bereits aktiv' });
  });

  it('Anhang 01 E Zeile für Zeile', () => {
    const w = hallWorld();
    w.tick = 1000;
    expect(setTierTaxLevel(w, 1, 'low').ok).toBe(true);
    expect(w.taxLevels).toEqual(lv('low', 'normal', 'normal', 'normal'));
    expect(w.taxLockedUntil).toEqual({ 1: 1300, 2: 0, 3: 0, 4: 0 });
    w.tick = 1100;
    expect(setTaxLevel(w, 'high')).toEqual({ ok: false, reason: 'Sperrzeit' });
    expect(w.taxLevels).toEqual(lv('low', 'normal', 'normal', 'normal'));
    expect(w.taxLockedUntil).toEqual({ 1: 1300, 2: 0, 3: 0, 4: 0 });
    expect(setTaxLevel(w, 'low').ok).toBe(true);
    expect(w.taxLevels).toEqual(lv('low', 'low', 'low', 'normal'));
    expect(w.taxLockedUntil).toEqual({ 1: 1300, 2: 1400, 3: 1400, 4: 0 });
    expect(setTaxLevel(w, 'low')).toEqual({ ok: false, reason: 'Stufe bereits aktiv' });
    expect(w.taxLockedUntil).toEqual({ 1: 1300, 2: 1400, 3: 1400, 4: 0 });
    expect(setTierTaxLevel(w, 4, 'high').ok).toBe(true);
    expect(w.taxLevels).toEqual(lv('low', 'low', 'low', 'high'));
    expect(w.taxLockedUntil).toEqual({ 1: 1300, 2: 1400, 3: 1400, 4: 1400 });
    w.tick = 1300;
    expect(setTierTaxLevel(w, 1, 'normal').ok).toBe(true);
    expect(w.taxLevels).toEqual(lv('normal', 'low', 'low', 'high'));
    expect(w.taxLockedUntil).toEqual({ 1: 1600, 2: 1400, 3: 1400, 4: 1400 });
  });
});

describe('AK-T11 Kaufleute niedrig', () => {
  it('abgelehnt, Welt unverändert, auch ohne Amtsstube derselbe Grund', () => {
    const w = hallWorld();
    const before = serialize(w);
    const reason = 'Kaufleute steigen nicht auf';
    expect(setTierTaxLevel(w, 4, 'low')).toEqual({ ok: false, reason });
    expect(noRiseReason(4)).toBe(reason);
    expect(serialize(w)).toBe(before);
    demolish(w, hallOf(w).id);
    const noHall = serialize(w);
    expect(setTierTaxLevel(w, 4, 'low')).toEqual({ ok: false, reason });
    expect(serialize(w)).toBe(noHall);
  });
});

describe('AK-T12 Gründe von setTierTaxLevel', () => {
  it('ungültige Stufe oder Stufenname', () => {
    const w = hallWorld();
    for (const t of [0, 5, 2.5])
      expect(setTierTaxLevel(w, t, 'high')).toEqual({ ok: false, reason: 'Ungültige Stufe' });
    expect(setTierTaxLevel(w, 2, 'x')).toEqual({ ok: false, reason: 'Ungültige Stufe' });
    expect(setTaxLevel(w, 'x')).toEqual({ ok: false, reason: 'Ungültige Stufe' });
  });
  it('Amtsstube fehlt oder brennt, gleicher Wert', () => {
    const w = hallWorld();
    expect(setTierTaxLevel(w, 2, 'normal')).toEqual({ ok: false, reason: 'Stufe bereits aktiv' });
    hallOf(w).outageUntil = w.tick + 100;
    expect(setTierTaxLevel(w, 2, 'high')).toEqual({ ok: false, reason: 'Amtsstube wirkt nicht' });
    demolish(w, hallOf(w).id);
    expect(setTierTaxLevel(w, 2, 'high')).toEqual({ ok: false, reason: 'Braucht eine Amtsstube' });
  });
});

describe('AK-T13 + QA-i ohne aktive Amtsstube', () => {
  it('Ausfall: wirksam normal, gespeichert hoch, danach wieder hoch', () => {
    const w = hallWorld();
    addHouse(w, 1, 3, true);
    addHouse(w, 2, 6, true);
    addHouse(w, 3, 11, true);
    addHouse(w, 4, 15, true);
    w.taxLevels = lv('high', 'high', 'high', 'high');
    hallOf(w).outageUntil = w.tick + 100;
    for (const t of TIER_IDS) expect(effectiveTaxLevel(w, t)).toBe('normal');
    const sum = TIER_IDS.reduce(
      (a, t) =>
        a +
        Object.values(w.buildings)
          .filter((b) => b.house?.tier === t)
          .reduce((s, b) => s + b.house!.inhabitants * TIERS[t].tax * 2, 0),
      0,
    );
    expect(taxUnits(w)).toBe(100 * sum);
    for (const b of Object.values(w.buildings))
      if (b.house) expect(houseCap(w, b.house)).toBe(TIERS[b.house.tier].maxInhabitants);
    expect(w.taxLevels).toEqual(lv('high', 'high', 'high', 'high'));
    delete hallOf(w).outageUntil;
    for (const t of TIER_IDS) expect(effectiveTaxLevel(w, t)).toBe('high');
  });

  it('QA-i: Sperre läuft ohne Amtsstube ab, neue Amtsstube übernimmt die Regler', () => {
    const w = hallWorld();
    const k = w.buildings[home(w).kontorId]!;
    w.tick = 1000;
    expect(setTierTaxLevel(w, 2, 'high')).toEqual({ ok: true });
    expect(w.taxLockedUntil[2]).toBe(1300);
    expect(demolish(w, hallOf(w).id).ok).toBe(true);
    w.tick = 1100;
    expect(setTierTaxLevel(w, 2, 'normal')).toEqual({
      ok: false,
      reason: 'Braucht eine Amtsstube',
    });
    expect(effectiveTaxLevel(w, 2)).toBe('normal');
    expect(w.taxLevels[2]).toBe('high');
    while (w.tick < 1350) step(w);
    w.money = 100_000;
    for (const g of Object.keys(home(w).stock) as GoodId[]) home(w).stock[g] = 100;
    const r = placeBuilding(w, 'townhall', k.x, k.y + 3);
    expect(r.ok).toBe(true);
    expect(w.buildings[r.id!]!.connected).toBe(true);
    expect(w.taxLockedUntil[2]).toBe(1300);
    expect(effectiveTaxLevel(w, 2)).toBe('high');
    expect(setTierTaxLevel(w, 2, 'normal')).toEqual({ ok: true });
  });
});

describe('AK-T15 + TECH-H-R7.4 taxBlocks', () => {
  const unlockWorld = (unlocked: string[]): World => {
    const w = createWorld(3, { crisisLevel: 'normal' });
    w.unlocked = ['U0', 'U2', 'U3', 'U4'] as World['unlocked'];
    placeTownhall(w);
    w.unlocked = unlocked as World['unlocked'];
    return w;
  };
  const blocks = (w: World, id: string): boolean =>
    nextUnlocks(w).find((e) => e.id === id)!.taxBlocks;

  it('tierWish 2 genau bei Pioniere hoch', () => {
    const w = unlockWorld(['U0']);
    w.taxLevels = lv('normal', 'high', 'normal', 'normal');
    expect(blocks(w, 'U2')).toBe(false);
    w.taxLevels = lv('high', 'normal', 'normal', 'normal');
    expect(blocks(w, 'U2')).toBe(true);
  });
  it('tierWish 3 und tierReached 3 bei Siedler hoch', () => {
    const w = unlockWorld(['U0', 'U2', 'U3']);
    w.taxLevels = lv('high', 'normal', 'normal', 'normal');
    expect(blocks(w, 'U4')).toBe(false);
    w.taxLevels = lv('normal', 'high', 'normal', 'normal');
    expect(blocks(w, 'U4')).toBe(true);
    w.unlocked = ['U0', 'U2', 'U3', 'U4'];
    expect(blocks(w, 'U5')).toBe(true);
  });
  it('ohne Amtsstube immer false, Auslöser houses false', () => {
    const w = unlockWorld(['U0']);
    w.taxLevels = lv('high', 'high', 'high', 'high');
    expect(blocks(w, 'U1')).toBe(false);
    demolish(w, hallOf(w).id);
    expect(nextUnlocks(w).every((e) => !e.taxBlocks)).toBe(true);
  });
  it('triggerTaxBlocked direkt: Stufe 1 false ohne Wurf, Stufe 2 true', () => {
    const w = hallWorld();
    w.taxLevels = lv('high', 'high', 'high', 'high');
    expect(triggerTaxBlocked(w, { kind: 'tierWish', tier: 1 })).toBe(false);
    expect(triggerTaxBlocked(w, { kind: 'tierReached', tier: 1 })).toBe(false);
    expect(triggerTaxBlocked(w, { kind: 'tierWish', tier: 2 })).toBe(true);
  });
});

describe('AK-T16 werfen nie', () => {
  const tiers = [-1, 0, 1, 4, 5, 1.5, NaN];
  const levels = ['low', 'normal', 'high', '', 'x'];
  const strip = (w: World): string => {
    const o = JSON.parse(serialize(w));
    delete o.taxLevels;
    delete o.taxLockedUntil;
    return JSON.stringify(o);
  };
  it('setTierTaxLevel: Result, bei Fehler Welt gleich, bei ok nur Regler und Sperre geändert', () => {
    for (const t of tiers)
      for (const l of levels) {
        const w = hallWorld();
        const full = serialize(w);
        const rest = strip(w);
        let r: { ok: boolean } | undefined;
        expect(() => (r = setTierTaxLevel(w, t, l)), `${t} ${l}`).not.toThrow();
        if (r!.ok) expect(strip(w), `${t} ${l}`).toBe(rest);
        else expect(serialize(w), `${t} ${l}`).toBe(full);
      }
  });
  it('setTaxLevel: Result, bei Fehler Welt gleich', () => {
    for (const l of levels) {
      const w = hallWorld();
      const full = serialize(w);
      const rest = strip(w);
      let r: { ok: boolean } | undefined;
      expect(() => (r = setTaxLevel(w, l))).not.toThrow();
      if (r!.ok) expect(strip(w)).toBe(rest);
      else expect(serialize(w)).toBe(full);
    }
  });
});

describe('AK-T42 taxTarget und taxChangeSet', () => {
  it('taxTarget', () => {
    expect(taxTarget('low', 1)).toBe('low');
    expect(taxTarget('low', 4)).toBe('normal');
    expect(taxTarget('high', 4)).toBe('high');
    expect(taxTarget('normal', 3)).toBe('normal');
    expect(canRiseTier(3)).toBe(true);
    expect(canRiseTier(4)).toBe(false);
  });

  const N: Levels = lv('normal', 'normal', 'normal', 'normal');
  const LN: Levels = lv('low', 'low', 'low', 'normal');
  const MIX: Levels = lv('low', 'normal', 'normal', 'high');
  const table: [string, Levels, TaxLevel, Tier[]][] = [
    ['alle normal', N, 'normal', []],
    ['alle normal', N, 'low', [1, 2, 3]],
    ['alle normal', N, 'high', [1, 2, 3, 4]],
    ['low-low-low-normal', LN, 'low', []],
    ['low-low-low-normal', LN, 'normal', [1, 2, 3]],
    ['gemischt', MIX, 'normal', [1, 4]],
    ['gemischt', MIX, 'high', [1, 2, 3]],
  ];
  for (const outage of [false, true])
    it.each(table)(`taxChangeSet %s -> %s (Ausfall: ${outage})`, (_n, levels, level, expected) => {
      const w = hallWorld();
      w.taxLevels = { ...levels };
      if (outage) hallOf(w).outageUntil = w.tick + 100;
      const before = serialize(w);
      const a = taxChangeSet(w, level);
      const b = taxChangeSet(w, level);
      expect(a).toEqual(expected);
      expect(a).not.toBe(b);
      expect(serialize(w)).toBe(before);
    });

  it('Gleichlauf mit setTaxLevel', () => {
    for (const levels of [N, LN, MIX])
      for (const level of ['low', 'normal', 'high'] as const) {
        const w = hallWorld();
        w.tick = 1000;
        w.taxLevels = { ...levels };
        const c = taxChangeSet(w, level);
        const before = { ...w.taxLevels };
        const r = setTaxLevel(w, level);
        expect(r.ok).toBe(c.length > 0);
        for (const t of TIER_IDS) {
          if (c.includes(t)) {
            expect(w.taxLevels[t]).toBe(taxTarget(level, t));
            expect(w.taxLockedUntil[t]).toBe(1000 + TAX_SWITCH_LOCK);
          } else {
            expect(w.taxLevels[t]).toBe(before[t]);
            expect(w.taxLockedUntil[t]).toBe(0);
          }
        }
      }
  });
});
