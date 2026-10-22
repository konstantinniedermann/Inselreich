// I-112 T02: Rat-Defs und Weltfeld (AK-1 Weltteil, AK-10).
import { describe, expect, it } from 'vitest';
import {
  COUNCIL,
  COUNCIL_NOTE,
  COUNCIL_OPEN_MESSAGE,
  COUNCIL_TIERS,
} from '../../src/sim/defs/council';
import { createWorld, home } from '../../src/sim/world';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { demolish } from '../../src/sim/build';
import {
  councilCycle,
  councilSides,
  decree,
  laneTicksOf,
  seaTileTicks,
  travelTicksOf,
  maxInhabitantsOf,
  openCouncilTiers,
  serviceRadiusOf,
} from '../../src/sim/council';
import { GOOD_IDS } from '../../src/sim/defs/goods';
import { LEVELS } from '../../src/sim/defs/levels';
import { TRAIT_CYCLE_PCT } from '../../src/sim/defs/sea';
import { cycleOf } from '../../src/sim/levels';
import { feastActive, holdFeast } from '../../src/sim/feast';
import { serviceAvailable, tickPopulation, tierCap, upgradeStatus } from '../../src/sim/population';
import { coverageMask, placementZone } from '../../src/sim/queries';
import { serialize } from '../../src/sim/save';
import { step } from '../../src/sim/tick';
import { laneTicks } from '../../src/sim/islands';
import { SHIP_TICKS_PER_SEA_TILE } from '../../src/sim/defs/sea';
import { laneWorld, shipLiteral } from './seaHelpers';
import type { BuildingDefId, CouncilTier, World } from '../../src/sim/types';
import {
  houseNearKontor,
  placeService,
  putBuilding,
  setHouse,
  twoIslandWorld,
  village,
} from './helpers';

describe('AK-1 neue Welt (Weltteil)', () => {
  it('council: alle drei Stufen null, feste Schlüsselreihenfolge', () => {
    const w = createWorld(3);
    expect(w.council).toEqual({ 2: null, 3: null, 4: null });
    expect(Object.keys(w.council)).toEqual(['2', '3', '4']);
  });
});

describe('AK-10 Tabelle', () => {
  it('sechs Einträge, je Stufe A und B mit name, text und Zahl', () => {
    expect(COUNCIL_TIERS).toEqual([2, 3, 4]);
    let n = 0;
    for (const t of COUNCIL_TIERS)
      for (const s of ['A', 'B'] as const) {
        const d = COUNCIL[t][s];
        expect(d.name.length).toBeGreaterThan(0);
        expect(d.text).toMatch(/\d/);
        expect(d.lever.value).toBeGreaterThan(0);
        n++;
      }
    expect(n).toBe(6);
  });

  it('Hebel zeigen auf Weberei, Kapelle, Brennerei, Stufe 3, Glashütte, Stufe 4 mit den Spec-Werten', () => {
    expect(COUNCIL[2].A.lever).toEqual({ kind: 'cycle', defId: 'weaver', value: 40 });
    expect(COUNCIL[2].B.lever).toEqual({ kind: 'serviceRadius', defId: 'chapel', value: 13 });
    expect(COUNCIL[3].A.lever).toEqual({ kind: 'cycle', defId: 'distillery', value: 40 });
    expect(COUNCIL[3].B.lever).toEqual({ kind: 'maxInhabitants', tier: 3, value: 16 });
    expect(COUNCIL[4].A.lever).toEqual({ kind: 'cycle', defId: 'glassworks', value: 30 });
    expect(COUNCIL[4].B.lever).toEqual({ kind: 'maxInhabitants', tier: 4, value: 22 });
  });

  it('Namen und Texte wörtlich aus Spec 3.1', () => {
    expect(COUNCIL[2].A.name).toBe('Webordnung');
    expect(COUNCIL[2].B.text).toBe(
      'Kapellen reichen 3 Felder weiter. Spart Kapellen in weiten Städten.',
    );
    expect(COUNCIL[4].B.text).toBe('Kaufmannshäuser fassen 22 statt 20 Kaufleute.');
    expect(COUNCIL_NOTE).toBe(
      'Gilt für die ganze Partie, die übrigen Beschlüsse der Stufe verfallen.',
    );
    expect(COUNCIL_OPEN_MESSAGE).toBe('Der Rat tagt: ein Beschluss steht an');
  });
});

const TIERS_ALL: CouncilTier[] = [2, 3, 4];

function houseWorld(tier: 1 | 2 | 3 | 4): { w: World; id: number } {
  const { w, houses } = village(1);
  setHouse(houses[0]!, tier, 1);
  return { w, id: houses[0]!.id };
}

describe('AK-1 decree auf neue Welt', () => {
  it('jede Stufe: Beschluss nicht offen, Welt unverändert', () => {
    const w = createWorld(3);
    const before = JSON.stringify(w);
    for (const t of TIERS_ALL)
      expect(decree(w, t, 'A')).toEqual({ ok: false, reason: 'Beschluss nicht offen' });
    expect(JSON.stringify(w)).toBe(before);
  });
});

describe('AK-2 Öffnen', () => {
  it('Hausstufe 2 öffnet nur Stufe 2', () => {
    const { w } = houseWorld(2);
    step(w);
    expect(w.council).toEqual({ 2: 'open', 3: null, 4: null });
  });

  it('Hausstufe 3 öffnet 2 und 3', () => {
    const { w } = houseWorld(3);
    step(w);
    expect(w.council).toEqual({ 2: 'open', 3: 'open', 4: null });
  });

  it('Hausstufe 4 öffnet alle', () => {
    const { w } = houseWorld(4);
    step(w);
    expect(w.council).toEqual({ 2: 'open', 3: 'open', 4: 'open' });
  });

  it('Haus auf zweiter Insel zählt', () => {
    const w = twoIslandWorld();
    const h = putBuilding(w, 1, 'house', 2, 2);
    setHouse(h, 2, 1);
    step(w);
    expect(w.council[2]).toBe('open');
  });

  it('openCouncilTiers: aufsteigend nach Stufe', () => {
    const { w } = houseWorld(3);
    step(w);
    expect(openCouncilTiers(w)).toEqual([2, 3]);
    decree(w, 2, 'A');
    expect(openCouncilTiers(w)).toEqual([3]);
  });
});

describe('AK-3 nie zurück auf null', () => {
  it('Abriss schliesst nicht, Abstieg ändert Beschluss nicht', () => {
    const { w, id } = houseWorld(2);
    step(w);
    expect(demolish(w, id).ok).toBe(true);
    step(w);
    expect(w.council[2]).toBe('open');
    expect(decree(w, 2, 'A').ok).toBe(true);
    const { w: w2, id: id2 } = houseWorld(2);
    step(w2);
    decree(w2, 2, 'A');
    setHouse(w2.buildings[id2]!, 1, 1);
    step(w2);
    expect(w2.council[2]).toBe('A');
  });
});

describe('AK-4 decree', () => {
  it('beschliesst einmal, zweiter Versuch scheitert', () => {
    const { w } = houseWorld(2);
    step(w);
    expect(decree(w, 2, 'A')).toEqual({ ok: true });
    expect(w.council[2]).toBe('A');
    expect(decree(w, 2, 'B')).toEqual({ ok: false, reason: 'Schon beschlossen' });
    expect(w.council[2]).toBe('A');
  });

  it('ungültige Eingaben: ok false, wirft nie', () => {
    const { w } = houseWorld(2);
    step(w);
    for (const t of [1, 5, '2', NaN]) expect(() => decree(w, t, 'A')).not.toThrow();
    for (const t of [1, 5, '2', NaN])
      expect(decree(w, t, 'A')).toEqual({ ok: false, reason: 'Ungültige Stufe' });
    for (const s of ['C', undefined, null]) {
      expect(() => decree(w, 2, s)).not.toThrow();
      expect(decree(w, 2, s)).toEqual({ ok: false, reason: 'Ungültige Seite' });
    }
    expect(w.council[2]).toBe('open');
  });
});

const decreed = (w: World, tier: CouncilTier, side: 'A' | 'B' | null): World => {
  w.council[tier] = side ?? 'open';
  return w;
};
const weaverAt = (w: World, island = 0, level?: 2 | 3): ReturnType<typeof putBuilding> => {
  const b = putBuilding(w, island, 'weaver', 4, 4);
  if (level !== undefined) b.level = level;
  return b;
};
const baseCycle = (id: 'weaver' | 'distillery' | 'glassworks'): number => BUILDING_DEFS[id].cycle!;

describe('AK-5 Taktbeschlüsse (Grundstufe)', () => {
  it('Webordnung: Weberei 40; Gegenseite und unentschieden = Def-Takt', () => {
    const w = createWorld(3);
    const b = weaverAt(w);
    expect(cycleOf(w, b)).toBe(baseCycle('weaver'));
    decreed(w, 2, 'A');
    expect(cycleOf(w, b)).toBe(40);
    decreed(w, 2, 'B');
    expect(cycleOf(w, b)).toBe(baseCycle('weaver'));
    decreed(w, 2, null);
    expect(cycleOf(w, b)).toBe(baseCycle('weaver'));
  });

  it('Brennrecht: Brennerei 40; Gegenseite und unentschieden = Def-Takt', () => {
    const w = createWorld(3);
    const b = putBuilding(w, 0, 'distillery', 4, 4);
    decreed(w, 3, 'A');
    expect(cycleOf(w, b)).toBe(40);
    decreed(w, 3, 'B');
    expect(cycleOf(w, b)).toBe(baseCycle('distillery'));
    decreed(w, 3, null);
    expect(cycleOf(w, b)).toBe(baseCycle('distillery'));
  });

  it('Glasrecht: Glashütte 30; Gegenseite und unentschieden = Def-Takt', () => {
    const w = createWorld(3);
    const b = putBuilding(w, 0, 'glassworks', 4, 4);
    decreed(w, 4, 'A');
    expect(cycleOf(w, b)).toBe(30);
    decreed(w, 4, 'B');
    expect(cycleOf(w, b)).toBe(baseCycle('glassworks'));
    decreed(w, 4, null);
    expect(cycleOf(w, b)).toBe(baseCycle('glassworks'));
  });

  it('Beschluss wirkt nur auf seinen Betrieb', () => {
    const w = decreed(createWorld(3), 2, 'A');
    expect(cycleOf(w, putBuilding(w, 0, 'distillery', 4, 4))).toBe(baseCycle('distillery'));
  });
});

describe('AK-5 Stufentakt', () => {
  const rows: [BuildingDefId, CouncilTier, number, number][] = [
    ['weaver', 2, 24, 16],
    ['distillery', 3, 24, 16],
    ['glassworks', 4, 18, 12],
  ];
  it.each(rows)('%s: Ausbaustufen 2 und 3 proportional (R-3)', (defId, tier, lvl2, lvl3) => {
    const w = createWorld(3);
    const b = putBuilding(w, 0, defId, 4, 4);
    expect(LEVELS[defId]![0]!.cycle).toBe(30);
    expect(LEVELS[defId]![1]!.cycle).toBe(20);
    for (const [level, expected] of [
      [2, lvl2],
      [3, lvl3],
    ] as const) {
      b.level = level;
      decreed(w, tier, 'A');
      expect(cycleOf(w, b)).toBe(expected);
      decreed(w, tier, 'B');
      expect(cycleOf(w, b)).toBe(LEVELS[defId]![level - 2]!.cycle);
      decreed(w, tier, null);
      expect(cycleOf(w, b)).toBe(LEVELS[defId]![level - 2]!.cycle);
    }
  });

  it('Untergrenze 1', () => {
    const w = decreed(createWorld(3), 2, 'A');
    expect(councilCycle(w, 'weaver', 1)).toBe(1);
  });

  it('Reihenfolge: erst Beschluss, dann Inselvorteil (Glashütte Stufe 2 auf Insel B)', () => {
    const w = twoIslandWorld();
    w.islands[1]!.kind = 'B';
    const b = putBuilding(w, 1, 'glassworks', 4, 4);
    b.level = 2;
    decreed(w, 4, 'A');
    expect(cycleOf(w, b)).toBe(Math.floor((18 * TRAIT_CYCLE_PCT) / 100));
    expect(cycleOf(w, b)).toBe(9);
  });
});

describe('AK-6 Beschluss gilt für bestehende und neue Betriebe, alle Inseln', () => {
  it('Weberei auf zweiter Insel und nach dem Beschluss gebaute: 40', () => {
    const w = twoIslandWorld();
    const early = weaverAt(w, 1);
    decreed(w, 2, 'A');
    const late = putBuilding(w, 0, 'weaver', 10, 10);
    expect(cycleOf(w, early)).toBe(40);
    expect(cycleOf(w, late)).toBe(40);
  });

  it('mit Inselvorteil: floor(30 × TRAIT_CYCLE_PCT / 100) (Glashütte auf Insel B, Glasrecht 30)', () => {
    const w = twoIslandWorld();
    w.islands[1]!.kind = 'B';
    decreed(w, 4, 'A');
    const b = putBuilding(w, 1, 'glassworks', 4, 4);
    expect(cycleOf(w, b)).toBe(Math.floor((30 * TRAIT_CYCLE_PCT) / 100));
  });
});

describe('AK-5 Glockenrecht und Reichweite', () => {
  const setup = (side: 'A' | 'B' | null): { w: World; near: number; far: number } => {
    const w = decreed(createWorld(3, { unlockAll: true }), 2, side);
    const chapel = placeService(w, 'chapel', 2, 2);
    const near = putBuilding(w, 0, 'house', chapel.x + 13, chapel.y); // Mittenabstand 12,5
    const far = putBuilding(w, 0, 'house', chapel.x + 14, chapel.y); // 13,5
    return { w, near: near.id, far: far.id };
  };

  it('Glockenrecht: Haus bei 12,5 hat faith, bei 13,5 nicht', () => {
    const { w, near, far } = setup('B');
    expect(serviceRadiusOf(w, 'chapel')).toBe(13);
    expect(serviceAvailable(w, w.buildings[near]!, 'faith')).toBe(true);
    expect(serviceAvailable(w, w.buildings[far]!, 'faith')).toBe(false);
  });

  it('Gegenseite und unentschieden: Def-Reichweite 10', () => {
    for (const side of ['A', null] as const) {
      const { w, near } = setup(side);
      expect(serviceRadiusOf(w, 'chapel')).toBe(BUILDING_DEFS.chapel.serviceRadius);
      expect(serviceAvailable(w, w.buildings[near]!, 'faith')).toBe(false);
    }
  });

  it('Fest: wirkt bei 12,5 mit Glockenrecht, bei 13,5 nie, ohne Beschluss nicht bei 12,5', () => {
    const { w, near, far } = setup('B');
    w.tick = 1000;
    home(w).stock.rum = 30;
    const chapel = Object.values(w.buildings).find((b) => b.defId === 'chapel')!;
    expect(holdFeast(w, chapel.id)).toEqual({ ok: true });
    expect(feastActive(w, w.buildings[near]!)).toBe(true);
    expect(feastActive(w, w.buildings[far]!)).toBe(false);
    const o = setup(null);
    o.w.tick = 1000;
    home(o.w).stock.rum = 30;
    const c2 = Object.values(o.w.buildings).find((b) => b.defId === 'chapel')!;
    holdFeast(o.w, c2.id);
    expect(feastActive(o.w, o.w.buildings[o.near]!)).toBe(false);
  });
});

describe('AK-17 Sim: Zone und Abdeckung', () => {
  it('placementZone: Radius 13 nach Glockenrecht, 10 ohne; coverageMask folgt', () => {
    const w = createWorld(3, { unlockAll: true });
    expect(placementZone(w, 'chapel', 4, 4)!.radius).toBe(10);
    const before = coverageMask(w, 'faith');
    decreed(w, 2, 'B');
    const z = placementZone(w, 'chapel', 4, 4)!;
    expect(z.radius).toBe(13);
    expect(z.tiles.length).toBeGreaterThan(placementZoneCountWithout());
    const chapel = placeService(w, 'chapel', 2, 2);
    expect(chapel.defId).toBe('chapel');
    const wide = coverageMask(w, 'faith');
    const narrowWorld = createWorld(3, { unlockAll: true });
    placeService(narrowWorld, 'chapel', 2, 2);
    const narrow = coverageMask(narrowWorld, 'faith');
    expect(wide.filter(Boolean).length).toBeGreaterThan(narrow.filter(Boolean).length);
    expect(before.some(Boolean)).toBe(false);
  });
});
function placementZoneCountWithout(): number {
  return placementZone(createWorld(3), 'chapel', 4, 4)!.tiles.length;
}

describe('AK-5 Wohnordnung und Hofrecht: Hausgrösse', () => {
  it('maxInhabitantsOf: 16 bzw. 22 mit Beschluss, sonst Def; Gegenseite = Def', () => {
    const w = createWorld(3);
    expect([maxInhabitantsOf(w, 3), maxInhabitantsOf(w, 4)]).toEqual([15, 20]);
    decreed(w, 3, 'B');
    decreed(w, 4, 'B');
    expect([maxInhabitantsOf(w, 3), maxInhabitantsOf(w, 4)]).toEqual([16, 22]);
    decreed(w, 3, 'A');
    decreed(w, 4, 'A');
    expect([maxInhabitantsOf(w, 3), maxInhabitantsOf(w, 4)]).toEqual([15, 20]);
    decreed(w, 3, null);
    decreed(w, 4, null);
    expect([maxInhabitantsOf(w, 3), maxInhabitantsOf(w, 4)]).toEqual([15, 20]);
  });
});

describe('AK-7 Wohnordnung im Wachstum', () => {
  const grownHouse = (satisfied: boolean): { w: World; h: ReturnType<typeof houseNearKontor> } => {
    const w = createWorld(3, { unlockAll: true });
    const h = houseNearKontor(w);
    setHouse(h, 3, 15);
    const services = [
      placeService(w, 'chapel', h.x + 3, h.y),
      placeService(w, 'school', h.x + 3, h.y + 3),
    ];
    for (const sv of services) sv.connected = true; // placeBuilding des zweiten Dienstes setzt es zurück
    for (const g of GOOD_IDS) home(w).stock[g] = satisfied ? 100 : 0;
    if (satisfied) h.house!.satisfied = { food: true, cloth: true, rum: true };
    decreed(w, 3, 'B');
    w.tick = 50;
    return { w, h };
  };

  it('erfüllt: 15 wächst auf 16 und bleibt dann', () => {
    const { w, h } = grownHouse(true);
    tickPopulation(w);
    expect(h.house!.inhabitants).toBe(16);
    w.tick = 100;
    tickPopulation(w);
    expect(h.house!.inhabitants).toBe(16);
  });

  it('unerfüllt: wächst nicht, verliert 1', () => {
    const { w, h } = grownHouse(false);
    tickPopulation(w);
    expect(h.house!.inhabitants).toBe(14);
  });

  it('upgradeStatus: bei 15 «nicht voll belegt», bei 16 nicht', () => {
    const { w, h } = grownHouse(true);
    const full = 'Haus nicht voll belegt';
    expect(upgradeStatus(w, h).reasons).toContain(full);
    h.house!.inhabitants = 16;
    expect(upgradeStatus(w, h).reasons).not.toContain(full);
  });

  it('tierCap(3, high) = 12 mit Wohnordnung', () => {
    const { w } = grownHouse(true);
    expect(tierCap(w, 3, 'high')).toBe(12);
    expect(tierCap(createWorld(3), 3, 'high')).toBe(11);
  });
});

describe('Bitgleich ohne Beschluss', () => {
  it('200 step: council open gleich null', () => {
    const run = (state: 'open' | null): string => {
      const w = createWorld(3);
      w.council = { 2: state, 3: state, 4: state };
      for (let i = 0; i < 200; i++) step(w);
      return JSON.stringify({ ...w, council: null });
    };
    expect(run('open')).toBe(run(null));
  });
});

describe('AK-8 Determinismus', () => {
  const run = (side: 'A' | 'B'): World => {
    const { w, houses } = village(3);
    setHouse(houses[0]!, 2, 1);
    putBuilding(w, 0, 'weaver', 4, 4);
    home(w).stock.wool = 100;
    for (let i = 0; i < 50 && w.council[2] !== 'open'; i++) step(w);
    expect(decree(w, 2, side)).toEqual({ ok: true });
    for (let i = 0; i < 300; i++) step(w);
    return w;
  };
  const withoutCouncil = (w: World): string =>
    serialize({ ...w, council: { 2: null, 3: null, 4: null } });

  it('gleicher Seed, gleiche Aktionen: serialize gleich', () => {
    expect(serialize(run('B'))).toBe(serialize(run('B')));
    expect(serialize(run('A'))).toBe(serialize(run('A')));
  });

  it('A und B unterscheiden sich in der Welt ausserhalb des Ratsfeldes (Wirkung belegt)', () => {
    expect(withoutCouncil(run('A'))).not.toBe(withoutCouncil(run('B')));
  });
});

describe('Konsistenz Rat-Tabelle', () => {
  it('jeder cycle-Hebel aus COUNCIL zeigt auf ein Gebäude in BUILDING_DEFS mit Takt', () => {
    let n = 0;
    for (const t of COUNCIL_TIERS)
      for (const s of ['A', 'B'] as const) {
        const lever = COUNCIL[t][s].lever;
        if (lever.kind !== 'cycle') continue;
        n++;
        const def = BUILDING_DEFS[lever.defId];
        expect(def, `${t}${s}: ${lever.defId}`).toBeDefined();
        expect(def.cycle, `${t}${s}: ${lever.defId} ohne cycle`).toBeDefined();
      }
    expect(n).toBeGreaterThan(0);
  });
});

describe('I-153 Seerecht', () => {
  it('AK-SR-1 Tabelle: Stufe 4 hat C, Stufen 2 und 3 nur A und B', () => {
    expect(Object.keys(COUNCIL[4])).toEqual(['A', 'B', 'C']);
    expect(Object.keys(COUNCIL[2])).toEqual(['A', 'B']);
    expect(Object.keys(COUNCIL[3])).toEqual(['A', 'B']);
    expect(COUNCIL[4].C).toEqual({
      name: 'Seerecht',
      text: 'Schiffe fahren 25 % schneller. Spart ab etwa 80 Kaufleuten ein Schiff auf langen Gewürzrouten.',
      lever: { kind: 'seaTileTicks', value: 8 },
    });
    expect(SHIP_TICKS_PER_SEA_TILE).toBe(10);
    expect(councilSides(4)).toEqual(['A', 'B', 'C']);
    expect(councilSides(2)).toEqual(['A', 'B']);
  });

  it('AK-SR-2 decree(4, C) gelingt einmalig', () => {
    const w = createWorld(3);
    w.council[4] = 'open';
    expect(decree(w, 4, 'C')).toEqual({ ok: true });
    expect(w.council[4]).toBe('C');
    expect(decree(w, 4, 'A')).toEqual({ ok: false, reason: 'Schon beschlossen' });
    expect(w.council[4]).toBe('C');
    w.council[4] = null;
    expect(decree(w, 4, 'C')).toEqual({ ok: false, reason: 'Beschluss nicht offen' });
  });

  it('AK-SR-3 ungültige Seiten werden abgewiesen, ohne Änderung und ohne Wurf', () => {
    const w = createWorld(3);
    w.council[2] = 'open';
    w.council[3] = 'open';
    w.council[4] = 'open';
    const before = JSON.stringify(w);
    const bad: [unknown, unknown][] = [
      [2, 'C'],
      [3, 'C'],
      [4, 'D'],
      [4, null],
    ];
    for (const [t, s] of bad) {
      expect(() => decree(w, t, s)).not.toThrow();
      expect(decree(w, t, s)).toEqual({ ok: false, reason: 'Ungültige Seite' });
    }
    expect(JSON.stringify(w)).toBe(before);
  });

  it('AK-SR-4 Fahrzeit-Helfer: 10 je Feld ohne Seerecht, 8 mit Seerecht', () => {
    const { w, island } = laneWorld(30);
    const plain = [{}, { 4: 'A' }, { 4: 'B' }, { 2: 'A', 3: 'B' }] as const;
    for (const c of plain) {
      Object.assign(w.council, c);
      expect(seaTileTicks(w)).toBe(10);
      expect(travelTicksOf(w, 30)).toBe(300);
      for (let i = 0; i < w.islands.length; i++)
        expect(laneTicksOf(w, 0, i)).toBe(laneTicks(w.islands, 0, i));
    }
    w.council[4] = 'C';
    expect(seaTileTicks(w)).toBe(8);
    expect(travelTicksOf(w, 30)).toBe(240);
    expect(laneTicksOf(w, 0, island)).toBe(8 * 30);
    expect(laneTicksOf(w, 2, 2)).toBe(0);
  });

  it('AK-SR-5 decree rechnet Restfahrzeit um, sonst nichts', () => {
    const w = createWorld(3);
    w.council[4] = 'open';
    const lefts = [350, 7, 2, 1];
    const ships = lefts.map((left) =>
      shipLiteral(w, { to: 1, left, cargo: { wood: 3 }, route: null }),
    );
    const homing = shipLiteral(w, { to: 0, left: 100, homing: true });
    const idle = shipLiteral(w, { port: 1, to: null, left: 0 });
    const meta = (s: typeof idle) => ({ port: s.port, to: s.to, cargo: s.cargo, route: s.route });
    const before = [...ships, homing, idle].map(meta);
    expect(decree(w, 4, 'C').ok).toBe(true);
    expect(ships.map((s) => s.left)).toEqual([280, 6, 2, 1]);
    expect(homing.left).toBe(80);
    expect(idle.to).toBeNull();
    expect(idle.left).toBe(0);
    expect([...ships, homing, idle].map(meta)).toEqual(before);
    expect(decree(w, 4, 'A').ok).toBe(false);
    expect(ships.map((s) => s.left)).toEqual([280, 6, 2, 1]);
  });

  it('Schiff mit left 1 liegt nach decree und einem step im Zielhafen', () => {
    const w = createWorld(3);
    w.council[4] = 'open';
    const ship = shipLiteral(w, { port: 0, to: 0, left: 1 });
    decree(w, 4, 'C');
    step(w);
    expect(ship.to).toBeNull();
    expect(ship.port).toBe(0);
  });
});
