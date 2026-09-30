import { mkdirSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BUILDING_IDS } from '../../src/sim/defs/buildings';
import { GOOD_IDS, START_STOCK } from '../../src/sim/defs/goods';
import { deliverOrder } from '../../src/sim/orders';
import { populationByTier } from '../../src/sim/population';
import { deserialize, SAVE_VERSION, serialize } from '../../src/sim/save';
import { step } from '../../src/sim/tick';
import type { Building, World } from '../../src/sim/types';
import { buildingsOfType, idx } from '../../src/sim/world';
import { SCENARIOS, writeScenarios } from './scenarios';

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

  it('AK-S5-02 schreibt je Szenario genau eine Datei, ohne Ordner nichts', () => {
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

// Echter Schreibpfad für die Browser-Checks (übersprungen ohne SCENARIO_OUT).
const out = import.meta.env.SCENARIO_OUT as string | undefined;
it.runIf(out)('schreibt die Szenario-Saves nach SCENARIO_OUT', () => {
  mkdirSync(out!, { recursive: true });
  writeScenarios(out, writeFileSync);
});
