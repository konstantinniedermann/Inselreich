import { mkdirSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BUILDING_IDS } from '../../src/sim/defs/buildings';
import { GOOD_IDS, START_STOCK } from '../../src/sim/defs/goods';
import { deliverOrder } from '../../src/sim/orders';
import { populationByTier } from '../../src/sim/population';
import { unprotectedFlammables } from '../../src/sim/queries';
import { deserialize, SAVE_VERSION, serialize } from '../../src/sim/save';
import { step } from '../../src/sim/tick';
import type { Building, World } from '../../src/sim/types';
import { buildingsOfType, idx } from '../../src/sim/world';
import { SCENARIOS, tickBeforeFirst, writeScenarios } from './scenarios';

/** Lädt ein Szenario so, wie der Browser es lädt: über Serialisierung und `deserialize`. */
function load(name: string): World {
  const r = deserialize(serialize(SCENARIOS[name]!()));
  if (!r.ok) throw new Error(`${name}: ${r.reason}`);
  return r.world;
}

const houses = (w: World): Building[] => buildingsOfType(w, 'house');

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

  it('kein Szenario ist nach dem ersten Tick gewonnen (Sieg-Overlay verfälscht Browser-Checks)', () => {
    for (const name of Object.keys(SCENARIOS)) {
      const w = load(name);
      step(w);
      expect(w.won, name).toBe(false);
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
        'krise-brand',
        'krise-brand-geschuetzt',
        'krise-sturm',
        'sturm-aktiv',
        'sturm-klar',
        'krise-boom',
        'krise-aus',
        'feuerwache',
        'leistung-sturm',
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

describe('M6 Szenarien', () => {
  it('AK-B2-04 krise-brand: Stufe normal, Tick 2999, eine Brennerei, Zuckerrohr 20, Geld 1000; Brand trifft sie', () => {
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
    step(w);
    expect(w.crisis?.kind).toBe('fire');
    expect(w.crisis?.outcome).toBe('burning');
    expect(w.crisis?.target).toBe(flammable[0]!.id);
    // Tick 3000 bucht auch den Unterhalt (UPKEEP_INTERVAL); der Brand selbst kostet 250.
    expect(w.money + w.stats.upkeep).toBe(750);
  });

  it('AK-B2-04 krise-brand-geschuetzt: Brand wird gelöscht, Geld bleibt 1000', () => {
    const w = load('krise-brand-geschuetzt');
    step(w);
    expect(w.crisis?.kind).toBe('fire');
    expect(w.crisis?.outcome).toBe('extinguished');
    expect(w.money + w.stats.upkeep).toBe(1000); // nur der Unterhalt von Tick 3000, keine Brandkosten
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

// Echter Schreibpfad für die Browser-Checks (übersprungen ohne SCENARIO_OUT).
const out = import.meta.env.SCENARIO_OUT as string | undefined;
it.runIf(out)('schreibt die Szenario-Saves nach SCENARIO_OUT', () => {
  mkdirSync(out!, { recursive: true });
  writeScenarios(out, writeFileSync);
});
