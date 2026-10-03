import { mkdirSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BUILDING_DEFS, BUILDING_IDS } from '../../src/sim/defs/buildings';
import { GOOD_IDS, START_STOCK } from '../../src/sim/defs/goods';
import { GROWTH_INTERVAL, UPGRADE_WAIT } from '../../src/sim/defs/timing';
import { TAX_CARRY_DIVISOR } from '../../src/sim/defs/tiers';
import { totalUpkeep, UPKEEP_INTERVAL } from '../../src/sim/economy';
import { deliverOrder } from '../../src/sim/orders';
import { buildLock, canPlace } from '../../src/sim/placement';
import {
  citizens,
  merchants,
  populationByTier,
  serviceAvailable,
  taxUnits,
} from '../../src/sim/population';
import { upgradeDeficit } from '../../src/sim/flow';
import { houseDiagnosis, unprotectedFlammables } from '../../src/sim/queries';
import { upgradeStatus } from '../../src/sim/population';
import { deserialize, SAVE_VERSION, serialize } from '../../src/sim/save';
import { sellPrice } from '../../src/sim/trade';
import { step } from '../../src/sim/tick';
import type { Building, World } from '../../src/sim/types';
import { deriveUnlocks } from '../../src/sim/unlocks';
import { buildingsOfType, center, idx, inBounds, tilesInRadius } from '../../src/sim/world';
import { PROBES, SCENARIOS, tickBeforeFirst, writeProbes, writeScenarios } from './scenarios';

/** Lädt ein Szenario so, wie der Browser es lädt: über Serialisierung und `deserialize`. */
function load(name: string): World {
  const r = deserialize(serialize(SCENARIOS[name]!()));
  if (!r.ok) throw new Error(`${name}: ${r.reason}`);
  return r.world;
}

const houses = (w: World): Building[] => buildingsOfType(w, 'house');

/** Szenarien, die gewonnen haben oder im ersten Tick gewinnen (M7: ux-sieg; M8 Spec 18.1). */
const WON_AFTER_FIRST_TICK = new Set([
  'ux-sieg',
  'm8-kurz-vor-sieg',
  'm8-kurz-vor-handelsstadt',
  'm8-glashuette-wartet', // Änderung S11: won true (Freischaltung der Glashütte)
  'm8-kaufleute-ohne-glas',
  'm11-stein', // M11 B1: won true (Freischaltung U6)
]);

describe('Szenario-Saves', () => {
  it('AK-S5-01 jedes Szenario ist ladbar und Version 2', () => {
    for (const name of Object.keys(SCENARIOS)) {
      const world = SCENARIOS[name]!();
      const r = deserialize(serialize(world));
      expect(r.ok, name).toBe(true);
      if (r.ok) {
        expect(r.world.version, name).toBe(SAVE_VERSION);
        expect(r.world, name).toEqual(world);
      }
    }
  });

  it('AK-B2-02 nach dem ersten Tick gewonnen nur ux-sieg und die M8-Siegszenarien (Sieg-Overlay verfälscht Browser-Checks)', () => {
    for (const name of Object.keys(SCENARIOS)) {
      const w = load(name);
      step(w);
      expect(w.won, name).toBe(WON_AFTER_FIRST_TICK.has(name));
    }
  });

  it('AK-S5-01 die Szenario-Namen sind genau die vereinbarten', () => {
    expect(Object.keys(SCENARIOS).sort()).toEqual(
      [
        'auftrag',
        'autosave-lauf',
        'bedarf',
        'bilanz-nahrung',
        'galerie',
        'lager-holz-99',
        'leistung-50',
        'verdeckung',
        'tag-0',
        'tag-3000',
        'ux-anbindung',
        'ux-sieg',
        'krise-brand',
        'krise-brand-geschuetzt',
        'krise-sturm',
        'sturm-aktiv',
        'sturm-klar',
        'krise-boom',
        'krise-aus',
        'feuerwache',
        'leistung-sturm',
        'm8-vor-sieg',
        'm8-kurz-vor-sieg',
        'm8-kurz-vor-handelsstadt',
        'm8-glashuette-wartet',
        'm8-kaufleute-ohne-glas',
        'm8-handel',
        'm10-start',
        'm10-pionier-fast-voll',
        'm10-siedler-fast',
        'm10-wald',
        'm10-amtsstube',
        'm10-amtsstube-aus',
        'm10-krise-bald',
        ...M11, // M11 B1
      ].sort(),
    );
  });

  it('bilanz-nahrung: 1 angebundener Fischer, 4 versorgte Pionierhäuser à 4, Nahrung 50, sonst Startlager', () => {
    const w = load('bilanz-nahrung');
    const fishers = buildingsOfType(w, 'fisher');
    expect(fishers).toHaveLength(1);
    expect(fishers[0]!.connected).toBe(true);
    expect(houses(w)).toHaveLength(4);
    for (const h of houses(w)) {
      expect(h.house!.tier).toBe(1);
      expect(h.house!.inhabitants).toBe(4);
      expect(h.house!.supplied).toBe(true);
      expect(h.house!.satisfied.food).toBe(true);
    }
    expect(w.stock.food).toBe(50);
    for (const g of GOOD_IDS) if (g !== 'food') expect(w.stock[g]).toBe(START_STOCK[g]);
    step(w);
    expect(populationByTier(w)[1]).toBe(16);
  });

  it('lager-holz-99: Holz 99, ein angebundener Marktplatz', () => {
    const w = load('lager-holz-99');
    expect(w.stock.wood).toBe(99);
    const markets = buildingsOfType(w, 'market');
    expect(markets).toHaveLength(1);
    expect(markets[0]!.connected).toBe(true);
  });

  it('bedarf: unversorgtes Haus, Siedlerhaus mit Kapelle ohne Stoff, erfülltes Pionierhaus', () => {
    const w = load('bedarf');
    expect(houses(w)).toHaveLength(3);
    const chapels = buildingsOfType(w, 'chapel');
    expect(chapels).toHaveLength(1);
    expect(chapels[0]!.connected).toBe(true);
    expect(w.stock.cloth).toBe(0);
    const check = (): void => {
      const hs = houses(w);
      const unsupplied = hs.filter((h) => !h.house!.supplied);
      expect(unsupplied).toHaveLength(1);
      const settler = hs.filter((h) => h.house!.tier === 2);
      expect(settler).toHaveLength(1);
      expect(settler[0]!.house!.supplied).toBe(true);
      expect(settler[0]!.house!.services.faith).toBe(true);
      expect(settler[0]!.house!.satisfied.cloth).toBe(false);
      const pioneer = hs.filter((h) => h.house!.tier === 1 && h.house!.supplied);
      expect(pioneer).toHaveLength(1);
      expect(pioneer[0]!.house!.satisfied.food).toBe(true);
    };
    check();
    step(w);
    check();
  });

  it('autosave-lauf: kleine Kolonie bei Tick 100', () => {
    const w = load('autosave-lauf');
    expect(w.tick).toBe(100);
    expect(houses(w).length).toBeGreaterThanOrEqual(2);
    expect(buildingsOfType(w, 'fisher').length).toBeGreaterThanOrEqual(1);
    expect(buildingsOfType(w, 'lumberjack').length).toBeGreaterThanOrEqual(1);
  });

  it('auftrag: Tick 595, keine Häuser, Holz 50, Nahrung 30, Auftrag folgt bei 600 und ist lieferbar', () => {
    const w = load('auftrag');
    expect(w.tick).toBe(595);
    expect(houses(w)).toHaveLength(0);
    expect(w.stock.wood).toBe(50);
    expect(w.stock.food).toBe(30);
    expect(w.order).toBeNull();
    for (let i = 0; i < 5; i++) step(w);
    expect(w.order).not.toBeNull();
    expect(deliverOrder(w).ok).toBe(true);
  });

  it('tag-0 und tag-3000: dieselbe Insel und Gebäude, Tick 0 bzw. genau 3000, kein Sieg', () => {
    const a = load('tag-0');
    const b = load('tag-3000');
    expect(a.tick).toBe(0);
    expect(b.tick).toBe(3000);
    expect(b.won).toBe(false);
    expect(b.tiles.map((t) => t.terrain)).toEqual(a.tiles.map((t) => t.terrain));
    const pos = (w: World): string[] =>
      Object.values(w.buildings).map((x) => `${x.defId}@${x.x},${x.y}`);
    expect(pos(b)).toEqual(pos(a));
    expect(Object.keys(b.buildings).length).toBeGreaterThanOrEqual(5);
    expect(b.money).toBeGreaterThan(0);
  });

  it('galerie: jeder Gebäudetyp, Häuser in drei Stufen, Sonderfälle, gerader Weg ab 10 Kacheln', () => {
    const w = load('galerie');
    for (const id of BUILDING_IDS) {
      expect(buildingsOfType(w, id).length, id).toBeGreaterThanOrEqual(1);
    }
    expect(new Set(houses(w).map((h) => h.house!.tier))).toEqual(new Set([1, 2, 3]));
    const lumberjacks = buildingsOfType(w, 'lumberjack');
    expect(lumberjacks.some((b) => !b.connected && b.state === 'notConnected')).toBe(true);
    for (const b of Object.values(w.buildings)) {
      if (b.defId === 'house' || b.defId === 'kontor') continue;
      if (b.defId === 'lumberjack' && !b.connected) continue;
      expect(b.connected, `${b.defId}@${b.x},${b.y}`).toBe(true);
    }
    const weavers = buildingsOfType(w, 'weaver');
    expect(weavers.some((b) => b.state === 'waitingInput')).toBe(true);
    expect(w.stock.wool).toBe(0);
    // längste zusammenhängende Wegzeile
    let best = 0;
    for (let y = 0; y < w.height; y++) {
      let run = 0;
      for (let x = 0; x < w.width; x++) {
        run = w.tiles[idx(w, x, y)]!.road ? run + 1 : 0;
        best = Math.max(best, run);
      }
    }
    expect(best).toBeGreaterThanOrEqual(10);
    const before = houses(w).map((h) => h.house!.tier);
    step(w);
    expect(houses(w).map((h) => h.house!.tier)).toEqual(before);
  });

  it('leistung-50: mindestens 50 Gebäude, davon mindestens 20 Wohnhäuser', () => {
    const w = load('leistung-50');
    expect(Object.keys(w.buildings).length).toBeGreaterThanOrEqual(51); // inkl. Kontor
    expect(houses(w).length).toBeGreaterThanOrEqual(20);
    const before = houses(w).map((h) => h.house!.tier);
    step(w);
    expect(houses(w).map((h) => h.house!.tier)).toEqual(before);
  });

  it('AK-S5-02 AK-B2-04 schreibt je Szenario genau eine Datei, ohne Ordner nichts', () => {
    const written: string[] = [];
    const fake = (path: string): void => void written.push(path);
    expect(writeScenarios(undefined, fake)).toBe(0);
    expect(written).toEqual([]);
    expect(writeScenarios('out', fake)).toBe(Object.keys(SCENARIOS).length);
    expect(written.sort()).toEqual(
      Object.keys(SCENARIOS)
        .map((n) => `out/${n}.json`)
        .sort(),
    );
  });
});

/** Geld, das ein Schritt bucht (M11 S10, Anhang 02 D): Überträge `c0`, `u0` vor dem Schritt, Raten nach dem Schritt. */
function booked(w: World, c0: number, u0: number): number {
  return (
    Math.floor((c0 + taxUnits(w)) / TAX_CARRY_DIVISOR) -
    Math.floor((u0 + totalUpkeep(w)) / UPKEEP_INTERVAL)
  );
}

describe('M6 Szenarien', () => {
  it('AK-B2-04 krise-brand: Stufe normal, Tick 2999, eine Brennerei, Zuckerrohr 20, Geld 1000; Brand trifft sie (M11 S10)', () => {
    const w = load('krise-brand');
    expect(w.crisisLevel).toBe('normal');
    expect(w.tick).toBe(tickBeforeFirst(w, 'fire'));
    expect(w.tick).toBe(2999);
    const flammable = Object.values(w.buildings).filter((b) =>
      ['distillery', 'fisher', 'lumberjack', 'sheepfarm', 'weaver', 'canefarm'].includes(b.defId),
    );
    expect(flammable.map((b) => b.defId)).toEqual(['distillery']);
    expect(flammable[0]!.connected).toBe(true);
    expect(w.stock.cane).toBe(20);
    expect(w.money).toBe(1000);
    const [c0, u0] = [w.taxCarry, w.upkeepCarry];
    step(w);
    expect(w.crisis?.kind).toBe('fire');
    expect(w.crisis?.outcome).toBe('burning');
    expect(w.crisis?.target).toBe(flammable[0]!.id);
    // Der Schritt bucht Steuer und Unterhalt mit Übertrag (M11); der Brand selbst kostet 250.
    expect(w.money).toBe(750 + booked(w, c0, u0));
  });

  it('AK-B2-04 krise-brand-geschuetzt: Brand wird gelöscht, Geld bleibt 1000 (M11 S10)', () => {
    const w = load('krise-brand-geschuetzt');
    const [c0, u0] = [w.taxCarry, w.upkeepCarry];
    step(w);
    expect(w.crisis?.kind).toBe('fire');
    expect(w.crisis?.outcome).toBe('extinguished');
    expect(w.money).toBe(1000 + booked(w, c0, u0)); // nur die Buchung des Schritts, keine Brandkosten
  });

  it('AK-B2-04 krise-sturm: Tick 2399, Fischer und Holzfäller angebunden, danach Sturm in Warnung', () => {
    const w = load('krise-sturm');
    expect(w.tick).toBe(2399);
    expect(buildingsOfType(w, 'fisher')[0]!.connected).toBe(true);
    expect(buildingsOfType(w, 'lumberjack')[0]!.connected).toBe(true);
    step(w);
    expect(w.crisis?.kind).toBe('storm');
    expect(w.tick).toBeLessThan(w.crisis!.from);
  });

  it('AK-B2-04 sturm-aktiv und sturm-klar: gleiche Gebäude und Tick 2700; aktiv mit Sturm, klar ohne Krise', () => {
    const a = load('sturm-aktiv');
    const k = load('sturm-klar');
    expect(a.tick).toBe(2700);
    expect(k.tick).toBe(2700);
    expect(a.crisis?.kind).toBe('storm');
    expect(a.tick).toBeGreaterThanOrEqual(a.crisis!.from);
    expect(k.crisisLevel).toBe('off');
    expect(k.crisis).toBeNull();
    const pos = (w: World): string[] =>
      Object.values(w.buildings).map((x) => `${x.defId}@${x.x},${x.y}`);
    expect(pos(k)).toEqual(pos(a));
  });

  it('AK-B2-04 krise-boom: Tick 4199, keine Häuser, Holz 50, Nahrung 50; danach Boom auf Holz oder Nahrung', () => {
    const w = load('krise-boom');
    expect(w.tick).toBe(4199);
    expect(houses(w)).toHaveLength(0);
    expect(w.stock.wood).toBe(50);
    expect(w.stock.food).toBe(50);
    step(w);
    expect(w.crisis?.kind).toBe('boom');
    expect(['wood', 'food']).toContain(w.crisis?.good);
  });

  it('AK-B2-04 krise-aus: Stufe off, Tick 2390, 600 Schritte ohne Krise', () => {
    const w = load('krise-aus');
    expect(w.crisisLevel).toBe('off');
    expect(w.tick).toBe(2390);
    for (let i = 0; i < 600; i++) {
      step(w);
      expect(w.crisis).toBeNull();
    }
  });

  it('AK-B2-04 feuerwache: Stufe normal, Tick 1000, nur die Schäferei ungeschützt, Wache angebunden', () => {
    const w = load('feuerwache');
    expect(w.crisisLevel).toBe('normal');
    expect(w.tick).toBe(1000);
    expect(unprotectedFlammables(w).map((b) => b.defId)).toEqual(['sheepfarm']);
    expect(buildingsOfType(w, 'firestation')[0]!.connected).toBe(true);
  });

  it('AK-B2-04 leistung-sturm: mindestens 51 Gebäude, Tick 2601, Sturm aktiv', () => {
    const w = load('leistung-sturm');
    expect(Object.keys(w.buildings).length).toBeGreaterThanOrEqual(51);
    expect(w.tick).toBe(2601);
    expect(w.crisis?.kind).toBe('storm');
    expect(w.tick).toBeGreaterThanOrEqual(w.crisis!.from);
  });
});

describe('M8 Szenarien', () => {
  /** Jedes Haus seit mindestens UPGRADE_WAIT (300) Ticks zufrieden. */
  const satisfiedLongEnough = (w: World): void => {
    for (const h of houses(w))
      expect(w.tick - h.house!.satisfiedSince, `Haus ${h.id}`).toBeGreaterThanOrEqual(UPGRADE_WAIT);
  };
  const shape = (w: World): number[][] =>
    houses(w).map((h) => [h.house!.tier, h.house!.inhabitants]);

  it('AK-B2-01 m8-vor-sieg: 3 volle Bürgerhäuser (45), seit 300 Ticks zufrieden, Steuer normal, kein Bad', () => {
    const w = load('m8-vor-sieg');
    expect(w.version).toBe(SAVE_VERSION);
    expect(w.won).toBe(false);
    expect(w.wonMerchants).toBe(false);
    expect(shape(w)).toEqual([
      [3, 15],
      [3, 15],
      [3, 15],
    ]);
    expect(citizens(w)).toBe(45);
    expect(w.taxLevel).toBe('normal');
    for (const id of ['chapel', 'school'] as const)
      expect(buildingsOfType(w, id)[0]!.connected, id).toBe(true);
    expect(buildingsOfType(w, 'bathhouse')).toHaveLength(0);
    expect(w.money).toBe(3000);
    expect([w.stock.glass, w.stock.wood, w.stock.tools, w.stock.stone]).toEqual([0, 60, 20, 30]);
    satisfiedLongEnough(w);
    step(w);
    satisfiedLongEnough(w);
    expect(w.won).toBe(false);
  });

  it('AK-B2-01 m8-kurz-vor-sieg: 49 Bürger, kein Badehaus, Tick 50·n − 1; Sieg bei W, dann Bad und Hütte frei', () => {
    const w = load('m8-kurz-vor-sieg');
    expect(w.won).toBe(false);
    expect(w.tick % GROWTH_INTERVAL).toBe(GROWTH_INTERVAL - 1);
    expect(citizens(w)).toBe(49);
    expect(
      houses(w)
        .map((h) => h.house!.inhabitants)
        .sort((a, b) => a - b),
    ).toEqual([4, 15, 15, 15]);
    expect(buildingsOfType(w, 'bathhouse')).toHaveLength(0); // Änderung S11
    expect(buildLock(w, 'bathhouse')).toBe('Erst nach dem Ziel');
    expect(w.money).toBe(3000);
    expect([w.stock.glass, w.stock.wood, w.stock.tools, w.stock.stone]).toEqual([5, 30, 20, 20]);
    satisfiedLongEnough(w);
    step(w);
    expect(w.won).toBe(true);
    expect(merchants(w)).toBe(0);
    expect(buildLock(w, 'bathhouse')).toBeNull();
    expect(buildLock(w, 'glassworks')).toBeNull();
  });

  it('AK-B2-01 m8-kurz-vor-handelsstadt: won, 3 Kaufmannshäuser 20/20/19, Tick 50·n − 1; zweites Ziel im nächsten Takt', () => {
    const w = load('m8-kurz-vor-handelsstadt');
    expect(w.won).toBe(true);
    expect(w.wonMerchants).toBe(false);
    expect(w.tick % GROWTH_INTERVAL).toBe(GROWTH_INTERVAL - 1);
    expect(shape(w)).toEqual([
      [4, 20],
      [4, 20],
      [4, 19],
    ]);
    for (const h of houses(w))
      for (const s of ['faith', 'school', 'bath'] as const)
        expect(serviceAvailable(w, h, s), `${h.id} ${s}`).toBe(true);
    step(w);
    expect(merchants(w)).toBe(60);
    expect(w.wonMerchants).toBe(true);
  });

  it('AK-B2-01 m8-glashuette-wartet: angebundene Glashütte, Stein 5, Holz 0, waitingInput; nichts entnommen', () => {
    const w = load('m8-glashuette-wartet');
    expect(w.won).toBe(true); // Änderung S11
    const works = buildingsOfType(w, 'glassworks');
    expect(works).toHaveLength(1);
    expect(works[0]!.connected).toBe(true);
    expect(works[0]!.state).toBe('waitingInput');
    expect([w.stock.stone, w.stock.wood]).toEqual([5, 0]);
    step(w);
    expect(buildingsOfType(w, 'glassworks')[0]!.state).toBe('waitingInput');
    expect([w.stock.stone, w.stock.wood, w.stock.glass]).toEqual([5, 0, 0]);
  });

  it('AK-B2-01 m8-kaufleute-ohne-glas: won, 1 Kaufmannshaus 20 EW, alle Dienste, Glas 0, satisfied.glass false', () => {
    const w = load('m8-kaufleute-ohne-glas');
    expect(w.won).toBe(true);
    expect(shape(w)).toEqual([[4, 20]]);
    const h = houses(w)[0]!;
    expect(w.stock.glass).toBe(0);
    expect(h.house!.satisfied.glass).toBe(false);
    expect(h.house!.services).toEqual({ faith: true, school: true, bath: true });
    expect(houseDiagnosis(w, h)).toEqual([{ kind: 'good', good: 'glass' }]);
    // Änderung S11: Mittel für AK-U2-06 (Badehaus mit J bauen) und AK-U2-10
    expect(w.money).toBe(3000);
    expect([w.stock.wood, w.stock.tools, w.stock.stone]).toEqual([60, 20, 30]);
    // R152 (Gate-Risiko): fester freier, angebundener 2×2-Platz für AK-U1-07/AK-U2-06 (QA nennt ihn: kx+9, ky+1)
    const k = w.buildings[w.kontorId]!;
    expect([k.x + 9, k.y + 1]).toEqual([41, 32]); // Seed 3, Kontor (32, 31)
    expect(canPlace(w, 'bathhouse', k.x + 9, k.y + 1).ok).toBe(true);
    expect(w.tiles[idx(w, k.x + 9, k.y)]!.road).toBe(true); // Weg nördlich → angebunden
    step(w);
    expect(houses(w)[0]!.house!.satisfied.glass).toBe(false);
  });

  it('AK-B2-01 m8-handel: Glas 10, Verkaufsanteil 100, 10 Glas bringen 191', () => {
    const w = load('m8-handel');
    expect(w.stock.glass).toBe(10);
    expect(w.sellPct.glass).toBe(100);
    expect(sellPrice(w, 'glass', 10)).toBe(191);
  });
});

const M10 = [
  'm10-start',
  'm10-pionier-fast-voll',
  'm10-siedler-fast',
  'm10-wald',
  'm10-amtsstube',
  'm10-amtsstube-aus',
  'm10-krise-bald',
] as const;
const PROBE_SPEC: Record<string, Record<string, [number, number]>> = {
  'm10-start': { kontor: [0, 0] },
  'm10-pionier-fast-voll': { kontor: [0, 0], haus3: [3, -2] },
  'm10-siedler-fast': { kontor: [0, 0], 'haus-voll': [3, -2], kapelle: [6, -2] },
  'm10-wald': { kontor: [0, 0], wald: [20, -7], weide: [12, -3], holzfaeller: [19, -5] },
  'm10-amtsstube': {
    kontor: [0, 0],
    amtsstube: [11, -7],
    schule: [6, 1],
    'werkzeug-mit': [11, 1],
    'werkzeug-ohne': [17, 6],
  },
  'm10-amtsstube-aus': {
    kontor: [0, 0],
    amtsstube: [3, -6],
    schule: [6, 1],
    'werkzeug-mit': [11, 1],
    'werkzeug-ohne': [17, 6],
  },
  'm10-krise-bald': { kontor: [0, 0] },
};

describe('M10 Szenarien (Spec 18.1)', () => {
  it('AK-B1-03 alle Szenarien laden als v5, unlocked = deriveUnlocks (ausser m10-start), galerie mit townhall, kein „Tick"', () => {
    for (const name of [...M10, 'galerie']) {
      const w = SCENARIOS[name]!();
      const r = deserialize(serialize(w));
      expect(r.ok, name).toBe(true);
      if (!r.ok) continue;
      expect(r.world.version).toBe(6);
      expect(r.world.unlocked, name).toEqual(
        name === 'm10-start' ? ['U0'] : deriveUnlocks(r.world),
      );
      expect(JSON.stringify(PROBES[name]!(r.world))).not.toMatch(/Tick/);
    }
    const g = SCENARIOS.galerie!();
    for (const id of BUILDING_IDS)
      expect(
        Object.values(g.buildings).some((b) => b.defId === id),
        id,
      ).toBe(true);
  });
  it('AK-B1-03 Prüfpunkte: vorhanden, auf der Karte, tragen Gebäude bzw. Gelände; Abstände; amtsstube-aus nicht angebunden', () => {
    for (const name of M10) {
      const w = SCENARIOS[name]!();
      const k = w.buildings[w.kontorId]!;
      const probes = PROBES[name]!(w);
      for (const [p, [dx, dy]] of Object.entries(PROBE_SPEC[name]!)) {
        expect(probes[p], `${name}/${p}`).toEqual({ x: k.x + dx, y: k.y + dy });
        expect(inBounds(w, k.x + dx, k.y + dy)).toBe(true);
      }
    }
    const at = (w: World, p: { x: number; y: number }) => w.tiles[idx(w, p.x, p.y)]!;
    const wald = SCENARIOS['m10-wald']!();
    const pw = PROBES['m10-wald']!(wald);
    expect([
      at(wald, pw.wald!).terrain,
      at(wald, pw.wald!).buildingId,
      at(wald, pw.wald!).road,
    ]).toEqual(['forest', null, false]);
    expect([
      at(wald, pw.weide!).terrain,
      at(wald, pw.weide!).buildingId,
      at(wald, pw.weide!).road,
    ]).toEqual(['grass', null, false]);
    const hf = wald.buildings[at(wald, pw.holzfaeller!).buildingId!]!;
    expect([hf.defId, hf.connected]).toEqual(['lumberjack', true]);
    for (const name of ['m10-amtsstube', 'm10-amtsstube-aus'] as const) {
      const w = SCENARIOS[name]!();
      const p = PROBES[name]!(w);
      const b = (n: string) => w.buildings[at(w, p[n]!).buildingId!]!;
      const mid = (x: Building) => center(BUILDING_DEFS[x.defId], x.x, x.y);
      const dist = (a: Building, c: Building) =>
        Math.hypot(mid(a).cx - mid(c).cx, mid(a).cy - mid(c).cy);
      expect([b('amtsstube').defId, b('amtsstube').connected]).toEqual([
        'townhall',
        name === 'm10-amtsstube',
      ]);
      expect(dist(b('werkzeug-mit'), b('schule'))).toBeLessThanOrEqual(10);
      expect(dist(b('werkzeug-ohne'), b('schule'))).toBeGreaterThan(10);
    }
  });
  it('AK-B1-03 writeProbes schreibt (M11 B1) je Szenario aus 18.1 genau <name>.probes.json mit den Prüfpunkten', () => {
    const written: [string, string][] = [];
    const fake = (path: string, text: string): void => void written.push([path, text]);
    expect(writeProbes(undefined, fake)).toBe(0);
    expect(writeProbes('out', fake)).toBe(13);
    expect(written.map(([p]) => p).sort()).toEqual(
      [...M10, ...M11, 'galerie'].map((n) => `out/${n}.probes.json`).sort(),
    );
    for (const [p, text] of written) {
      const name = p.slice('out/'.length, -'.probes.json'.length);
      expect(JSON.parse(text)).toEqual(PROBES[name]!(SCENARIOS[name]!()));
    }
  });
});

const M11 = ['m11-fluss', 'm11-wald', 'm11-ausbau', 'm11-defizit', 'm11-stein'] as const;

describe('M11 Szenarien (Anhang 02 F)', () => {
  const at = (w: World, name: string, probe: string): Building => {
    const p = PROBES[name]!(w)[probe]!;
    return w.buildings[w.tiles[idx(w, p.x, p.y)]!.buildingId!]!;
  };
  const freeForest = (w: World, b: Building, r: number): number => {
    const c = center(BUILDING_DEFS[b.defId], b.x, b.y);
    return tilesInRadius(w, c.cx, c.cy, r).filter((p) => {
      const t = w.tiles[idx(w, p.x, p.y)]!;
      return t.terrain === 'forest' && t.buildingId === null && !t.road;
    }).length;
  };

  it('AK-M11B-02 die fünf Szenen sind wohlgeformt und überstehen deserialize(serialize(w)) gleich', () => {
    for (const name of M11) {
      const w = SCENARIOS[name]!();
      const r = deserialize(serialize(w));
      expect(r.ok, name).toBe(true);
      if (!r.ok) continue;
      expect(serialize(r.world), name).toBe(serialize(w));
      expect(r.world.crisisLevel, name).toBe('off');
      expect(JSON.stringify(PROBES[name]!(r.world))).not.toMatch(/Tick/);
    }
  });

  it('AK-M11B-02 Prüfpunkte liegen relativ zum Kontor wie in der Tabelle und tragen Gebäude', () => {
    const expected: Record<string, Record<string, string>> = {
      'm11-fluss': { kontor: 'kontor', haus: 'house' },
      'm11-wald': { kontor: 'kontor', jagdhuette: 'hunter', holzfaeller: 'lumberjack' },
      'm11-ausbau': {
        kontor: 'kontor',
        fischer1: 'fisher',
        fischer2: 'fisher',
        fischer3: 'fisher',
        weberei: 'weaver',
        schaeferei: 'sheepfarm',
      },
      'm11-defizit': { kontor: 'kontor', haus: 'house', kapelle: 'chapel', schule: 'school' },
      'm11-stein': { kontor: 'kontor', haus: 'house', glashuette: 'glassworks' },
    };
    for (const name of M11) {
      const w = SCENARIOS[name]!();
      for (const [probe, defId] of Object.entries(expected[name]!))
        expect(at(w, name, probe).defId, `${name}/${probe}`).toBe(defId);
    }
  });

  it('AK-M11B-02 Inhalte: Zustände, Stufen, freie Kacheln, Defizit-Gut, Freischaltung', () => {
    const fluss = SCENARIOS['m11-fluss']!();
    expect(fluss.tick).toBe(3000);
    expect(fluss.unlocked).toContain('U4');
    expect(fluss.won).toBe(false);
    if (import.meta.env.VITE_BALANCE_LOG)
      console.log('m11-fluss', fluss.stats, fluss.stats.taxes - fluss.stats.upkeep);
    expect(fluss.stats.taxes - fluss.stats.upkeep).toBeGreaterThan(0); // Bilanz positiv (Spec-Lücke +500, s. beobachtungen)

    const wald = SCENARIOS['m11-wald']!();
    const pw = PROBES['m11-wald']!(wald);
    const hunter = at(wald, 'm11-wald', 'jagdhuette');
    const lumber = at(wald, 'm11-wald', 'holzfaeller');
    expect([freeForest(wald, hunter, 3), freeForest(wald, lumber, 2)]).toEqual([10, 1]);
    expect([hunter.connected, lumber.connected]).toEqual([true, true]);
    for (const p of ['wald-holzfaeller', 'wald-jagd'])
      expect(wald.tiles[idx(wald, pw[p]!.x, pw[p]!.y)]!.terrain, p).toBe('forest');
    expect(wald.unlocked).toEqual(['U0', 'U2', 'U3']);

    const ausbau = SCENARIOS['m11-ausbau']!();
    expect(
      ['fischer1', 'fischer2', 'fischer3'].map((p) => at(ausbau, 'm11-ausbau', p).level),
    ).toEqual([undefined, 2, 3]);
    const weberei = at(ausbau, 'm11-ausbau', 'weberei');
    expect([weberei.level, weberei.state]).toEqual([2, 'waitingInput']);
    expect(at(ausbau, 'm11-ausbau', 'schaeferei').level).toBeUndefined();
    expect([ausbau.stock.wool, ausbau.stock.cloth, ausbau.stock.rum, ausbau.money]).toEqual([
      0, 10, 10, 2000,
    ]);
    expect(ausbau.unlocked).toEqual(['U0', 'U1', 'U2', 'U3', 'U4', 'U5']);

    const defizit = SCENARIOS['m11-defizit']!();
    const dh = at(defizit, 'm11-defizit', 'haus');
    expect([dh.house!.tier, dh.house!.inhabitants]).toEqual([2, 8]);
    expect(upgradeDeficit(defizit, dh)?.good).toBe('rum');
    expect(defizit.stock.rum).toBe(40);
    expect(defizit.unlocked).toContain('U4');
    expect(buildingsOfType(defizit, 'distillery')).toHaveLength(0);

    const stein = SCENARIOS['m11-stein']!();
    expect(stein.won).toBe(true);
    expect(stein.unlocked).toContain('U6');
    expect(stein.stock.stone).toBe(4);
    expect(buildingsOfType(stein, 'glassworks')).toHaveLength(1);
    expect(upgradeStatus(stein, at(stein, 'm11-stein', 'haus')).reasons).toContain(
      'Zu wenig Stein',
    );
  });
});

// Echter Schreibpfad für die Browser-Checks (übersprungen ohne SCENARIO_OUT).
const out = import.meta.env.SCENARIO_OUT as string | undefined;
it.runIf(out)('schreibt die Szenario-Saves nach SCENARIO_OUT', () => {
  mkdirSync(out!, { recursive: true });
  writeScenarios(out, writeFileSync);
  writeProbes(out, writeFileSync);
});
