import { beforeEach, describe, expect, it } from 'vitest';
import { createWorld, home } from '../../src/sim/world';
import { demolish, placeBuilding, placeRoad, removeRoad } from '../../src/sim/build';
import { buildCoverage } from '../../src/sim/coverage';
import { beginCrisis, tickCrises } from '../../src/sim/crises';
import { tickProduction } from '../../src/sim/production';
import { houseDiagnosis } from '../../src/sim/queries';
import { serialize } from '../../src/sim/save';
import { SERVICE_IDS } from '../../src/sim/population';
import {
  allNeedsMet,
  GROWTH_INTERVAL,
  isSupplied,
  serviceAvailable,
  tickPopulation,
  totalTaxes,
  tryUpgrade,
  UPGRADE_WAIT,
  upgradeStatus,
} from '../../src/sim/population';
import { GOOD_IDS } from '../../src/sim/defs/goods';
import { buy } from '../../src/sim/trade';
import { step } from '../../src/sim/tick';
import { TIERS } from '../../src/sim/defs/tiers';
import { UPGRADE_DEFICIT_WAIT_FACTOR } from '../../src/sim/defs/timing';
import type { Building, World } from '../../src/sim/types';
import {
  denseScene,
  forceGrass,
  forceRect,
  houseFar,
  houseNearKontor,
  isSuppliedNaive,
  placeService,
  putBuilding,
  serviceAvailableNaive,
  village,
} from './helpers';
import { runColony, startColony } from './controller';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';

let w: World;

beforeEach(() => {
  w = createWorld(3, { unlockAll: true });
});

function run(world: World, n: number): void {
  for (let i = 0; i < n; i++) {
    world.tick += 1;
    tickPopulation(world);
  }
}

describe('tickPopulation', () => {
  it('new house pulls food immediately and is satisfied', () => {
    const h = houseNearKontor(w);
    run(w, 1);
    expect(home(w).stock.food).toBe(19);
    expect(h.house!.satisfied.food).toBe(true);
    expect(h.house!.supplied).toBe(true);
  });

  it('consumes inhabitants*rate/100 per tick', () => {
    const h = houseNearKontor(w);
    h.house!.inhabitants = 4;
    run(w, 1);
    expect(home(w).stock.food).toBe(19);
    run(w, 48);
    expect(home(w).stock.food).toBe(19);
    run(w, 2);
    expect(home(w).stock.food).toBe(18);
  });

  it('unsatisfied when stock empty, demand capped at 1', () => {
    const h = houseNearKontor(w);
    home(w).stock.food = 0;
    run(w, 30);
    expect(h.house!.satisfied.food).toBe(false);
    expect(h.house!.demand.food).toBeLessThanOrEqual(1);
  });

  it('grows every 50 ticks when satisfied, shrinks otherwise, min 1 max 4', () => {
    const h = houseNearKontor(w);
    expect(GROWTH_INTERVAL).toBe(50);
    w.tick = 49;
    run(w, 1);
    expect(h.house!.inhabitants).toBe(2);
    run(w, 49);
    expect(h.house!.inhabitants).toBe(2);
    run(w, 1);
    expect(h.house!.inhabitants).toBe(3);
    run(w, 100);
    expect(h.house!.inhabitants).toBe(4);
    run(w, 50);
    expect(h.house!.inhabitants).toBe(4);
    home(w).stock.food = 0;
    run(w, 400);
    expect(h.house!.inhabitants).toBe(1);
  });

  it('house outside supply radius never consumes and never grows', () => {
    const h = houseFar(w);
    const food = home(w).stock.food;
    run(w, 200);
    expect(h.house!.supplied).toBe(false);
    expect(home(w).stock.food).toBe(food);
    expect(h.house!.inhabitants).toBe(1);
    expect(h.house!.satisfied.food).toBe(false);
  });

  it('market supplies only when connected', () => {
    const far = houseFar(w);
    forceRect(w, far.x + 1, far.y, 2, 2, 'grass');
    const m = placeBuilding(w, 'market', far.x + 1, far.y);
    expect(m.ok).toBe(true);
    const market: Building = w.buildings[m.id!]!;
    expect(market.connected).toBe(false);
    expect(isSupplied(w, far)).toBe(false);
    run(w, 1);
    expect(far.house!.supplied).toBe(false);
    market.connected = true;
    expect(isSupplied(w, far)).toBe(true);
    run(w, 1);
    expect(far.house!.supplied).toBe(true);
  });

  it('satisfiedSince resets on any unmet need', () => {
    const h = houseNearKontor(w);
    run(w, 10);
    expect(h.house!.satisfiedSince).toBe(0);
    home(w).stock.food = 0;
    h.house!.demand.food = 1;
    run(w, 1);
    expect(h.house!.satisfiedSince).toBe(w.tick);
    home(w).stock.food = 5;
    run(w, 1);
    expect(h.house!.satisfiedSince).toBe(w.tick - 1);
    expect(allNeedsMet(h.house!, TIERS[1])).toBe(true);
    expect(allNeedsMet({ ...h.house!, supplied: false }, TIERS[1])).toBe(false);
    expect(allNeedsMet(h.house!, TIERS[2])).toBe(false);
  });

  it('is called from step', () => {
    houseNearKontor(w);
    step(w);
    expect(home(w).stock.food).toBe(19);
  });
});

describe('serviceAvailable', () => {
  it('faith needs a connected chapel within radius 10', () => {
    const h = houseNearKontor(w);
    // Hausmitte x+0.5; Kapellenmitte x+1: Abstand ~9.51 bei +9, ~10.51 bei +10
    const chapel = placeService(w, 'chapel', h.x + 9, h.y);
    expect(serviceAvailable(w, h, 'faith')).toBe(true);
    expect(serviceAvailable(w, h, 'school')).toBe(false);
    chapel.connected = false;
    expect(serviceAvailable(w, h, 'faith')).toBe(false);
  });

  it('is false for a chapel just beyond radius 10', () => {
    const h = houseNearKontor(w);
    placeService(w, 'chapel', h.x + 10, h.y);
    expect(serviceAvailable(w, h, 'faith')).toBe(false);
  });
});

/** Defizitwelt (M11 S10): Testwelten ohne Erzeuger haben für jedes Zielgut ein Defizit, die Wartezeit verdoppelt sich. */
const WAIT = UPGRADE_WAIT * UPGRADE_DEFICIT_WAIT_FACTOR;

/** Haus bereit für den Aufstieg von Stufe 1: max. Einwohner, Wartezeit erfüllt, Kapelle, 1 Stoff. */
function readyPioneer(): { house: Building; chapel: Building } {
  const house = houseNearKontor(w);
  const chapel = placeService(w, 'chapel', house.x + 9, house.y);
  w.tick = 400;
  house.house!.inhabitants = TIERS[1].maxInhabitants;
  run(w, 1);
  home(w).stock.cloth = 1;
  house.house!.satisfiedSince = w.tick - WAIT;
  return { house, chapel };
}

describe('tryUpgrade', () => {
  it('upgrades pioneer house to settler when all conditions hold (M11 S10)', () => {
    const { house } = readyPioneer();
    expect(house.house!.satisfied.food).toBe(true);
    const { money, stock } = { money: w.money, stock: { ...home(w).stock } };
    expect(upgradeStatus(w, house)).toEqual({ ok: true, reasons: [] });
    expect(tryUpgrade(w, house)).toBe(true);
    expect(house.house!.tier).toBe(2);
    expect(w.money).toBe(money - 100);
    expect(home(w).stock.wood).toBe(stock.wood - 5);
    expect(home(w).stock.tools).toBe(stock.tools - 2);
    expect(home(w).stock.stone).toBe(stock.stone);
    expect(house.house!.demand.cloth).toBe(0);
    expect(house.house!.satisfied.cloth).toBe(true);
    expect(home(w).stock.cloth).toBe(0);
    expect(house.house!.satisfiedSince).toBe(w.tick);
  });

  function expectBlocked(house: Building, reason: string): void {
    const money = w.money;
    expect(upgradeStatus(w, house).ok).toBe(false);
    expect(upgradeStatus(w, house).reasons).toContain(reason);
    expect(tryUpgrade(w, house)).toBe(false);
    expect(house.house!.tier).toBe(1);
    expect(w.money).toBe(money);
  }

  it('does not upgrade without cloth in stock', () => {
    const { house } = readyPioneer();
    home(w).stock.cloth = 0;
    expectBlocked(house, 'Kein Stoff im Lager');
  });

  it('does not upgrade without a chapel in reach', () => {
    const { house, chapel } = readyPioneer();
    chapel.connected = false;
    expectBlocked(house, 'Kapelle fehlt in Reichweite');
  });

  it('does not upgrade before 600 ticks of satisfaction (M11 S10)', () => {
    const { house } = readyPioneer();
    house.house!.satisfiedSince = w.tick - (WAIT - 1);
    expectBlocked(house, `Bedürfnisse noch nicht ${WAIT} Ticks erfüllt`);
  });

  it('does not upgrade below max inhabitants', () => {
    const { house } = readyPioneer();
    house.house!.inhabitants = 3;
    expectBlocked(house, 'Haus nicht voll belegt');
  });

  it('does not upgrade when unaffordable', () => {
    const { house } = readyPioneer();
    w.money = 50;
    expectBlocked(house, 'Zu wenig Geld');
  });

  it('lists all unmet reasons, not just the first (M11 S10)', () => {
    const { house, chapel } = readyPioneer();
    home(w).stock.cloth = 0;
    chapel.connected = false;
    house.house!.inhabitants = 3;
    expect(upgradeStatus(w, house).reasons).toEqual([
      'Haus nicht voll belegt',
      'Kapelle fehlt in Reichweite',
      'Kein Stoff im Lager',
    ]);
  });

  it('settler to citizen needs faith, school and rum (M11 S10)', () => {
    const { house, chapel } = readyPioneer();
    const hs = house.house!;
    hs.tier = 2;
    hs.inhabitants = TIERS[2].maxInhabitants;
    home(w).stock.rum = 1;
    expectSettlerBlocked(house);
    const school = placeService(w, 'school', house.x + 9, house.y + 2);
    chapel.connected = true; // Platzieren berechnet die Anbindung neu und setzt sie zurück
    const money = w.money;
    const stone = home(w).stock.stone;
    expect(school.connected).toBe(true);
    expect(upgradeStatus(w, house)).toEqual({ ok: true, reasons: [] });
    expect(tryUpgrade(w, house)).toBe(true);
    expect(hs.tier).toBe(3);
    expect(w.money).toBe(money - 300);
    expect(home(w).stock.stone).toBe(stone - 5);
    expect(hs.demand.rum).toBe(0);
    expect(hs.satisfied.rum).toBe(true);
    expect(home(w).stock.rum).toBe(0);
    expect(hs.satisfiedSince).toBe(w.tick);
  });

  function expectSettlerBlocked(house: Building): void {
    const money = w.money;
    expect(upgradeStatus(w, house).reasons).toEqual(['Schule fehlt in Reichweite']);
    expect(tryUpgrade(w, house)).toBe(false);
    expect(house.house!.tier).toBe(2);
    expect(w.money).toBe(money);
  }

  it('citizen house has no further upgrade', () => {
    const { house } = readyPioneer();
    house.house!.tier = 3;
    house.house!.inhabitants = 15;
    expect(tryUpgrade(w, house)).toBe(false);
    expect(upgradeStatus(w, house).reasons[0]).toBe('Erst nach dem Ziel');
    expect(house.house!.tier).toBe(3);
    house.house!.tier = 4;
    house.house!.inhabitants = 20;
    expect(tryUpgrade(w, house)).toBe(false);
    expect(upgradeStatus(w, house)).toEqual({ ok: false, reasons: ['Höchste Stufe erreicht'] });
    expect(house.house!.tier).toBe(4);
  });

  it('consumes the checked good: two ready houses, one cloth, only one upgrades (M11 S10)', () => {
    const { house, chapel } = readyPioneer();
    forceGrass(w, house.x, house.y + 1);
    const r = placeBuilding(w, 'house', house.x, house.y + 1);
    if (!r.ok || r.id === undefined) throw new Error('second house not placed');
    chapel.connected = true; // Platzieren berechnet die Anbindung neu und setzt sie zurück
    const second = w.buildings[r.id]!;
    second.house = {
      ...house.house!,
      demand: { ...house.house!.demand },
      satisfied: { ...house.house!.satisfied },
      services: { ...house.house!.services },
    };
    home(w).stock.cloth = 1;
    const results = [tryUpgrade(w, house), tryUpgrade(w, second)];
    expect(results.filter(Boolean)).toHaveLength(1);
    expect([house.house!.tier, second.house!.tier].sort()).toEqual([1, 2]);
    expect(home(w).stock.cloth).toBe(0);
  });

  it('does not draw a second unit of the new good on the next tick (M11 S10)', () => {
    const { house } = readyPioneer();
    home(w).stock.cloth = 2;
    expect(tryUpgrade(w, house)).toBe(true);
    expect(home(w).stock.cloth).toBe(1);
    run(w, 1);
    expect(home(w).stock.cloth).toBe(1);
    expect(house.house!.satisfied.cloth).toBe(true);
  });

  it('taxes a house at the full rate when it upgrades on a booking tick (M11 S10)', () => {
    const { house } = readyPioneer();
    w.tick = 499;
    house.house!.satisfiedSince = w.tick - WAIT;
    step(w);
    expect(w.tick % 100).toBe(0);
    expect(house.house!.tier).toBe(2);
    const full = Math.floor(house.house!.inhabitants * TIERS[2].tax);
    expect(totalTaxes(w)).toBe(full);
    expect(w.stats.taxes).toBe(full);
  });

  it('is attempted in the growth tick only (M11 S10)', () => {
    const { house } = readyPioneer();
    w.tick = 347;
    house.house!.satisfiedSince = 47 - (WAIT - UPGRADE_WAIT);
    run(w, 2);
    expect(house.house!.tier).toBe(1);
    run(w, 1);
    expect(w.tick % GROWTH_INTERVAL).toBe(0);
    expect(house.house!.tier).toBe(2);
  });
});

describe('satisfiedSince at build time', () => {
  it('a house built late must wait the full UPGRADE_WAIT before upgrading (M11 S10)', () => {
    const first = houseNearKontor(w);
    const chapel = placeService(w, 'chapel', first.x + 5, first.y);
    home(w).stock.cloth = 5;
    home(w).stock.food = 100;
    for (let i = 0; i < 400; i++) step(w);
    expect(w.tick).toBe(400);

    // Zweites Haus, gleiche Kontor-Nähe, andere Kachel; Ressourcen für den Aufstieg bereitstellen
    forceGrass(w, first.x, first.y + 1);
    w.money = 1_000_000;
    for (const good of Object.keys(home(w).stock) as (keyof ReturnType<typeof home>['stock'])[])
      home(w).stock[good] = 100;
    const r = placeBuilding(w, 'house', first.x, first.y + 1);
    expect(r.ok).toBe(true);
    // Bauen berechnet die Anbindung neu; die Kapelle hat in diesem Test keinen Weg
    chapel.connected = true;
    const second = w.buildings[r.id!]!;
    expect(second.house!.satisfiedSince).toBe(400);

    for (let i = 0; i < 400; i++) step(w);
    expect(second.house!.tier).toBe(1);
    expect(second.house!.inhabitants).toBe(4);
    expect(upgradeStatus(w, second).reasons).toContain(
      `Bedürfnisse noch nicht ${WAIT} Ticks erfüllt`,
    );

    for (let i = 0; i < 200; i++) step(w);
    expect(w.tick).toBe(1000); // 400 + WAIT
    expect(second.house!.tier).toBe(2);
  });
});

describe('smoke: scripted colony', () => {
  it('reaches settlers within 3000 steps', () => {
    const k = w.buildings[home(w).kontorId]!;
    const { x: kx, y: ky } = k;
    forceRect(w, kx + 2, ky - 3, 12, 8, 'grass');
    forceRect(w, kx + 3, ky - 4, 4, 1, 'water');
    expect(buy(w, 'wood', 40).ok).toBe(true);

    const roads: [number, number][] = [];
    for (let dx = 2; dx <= 9; dx++) roads.push([kx + dx, ky]);
    for (let dy = 1; dy <= 3; dy++) roads.push([kx + 4, ky - dy]);
    for (const [x, y] of roads) expect(placeRoad(w, x, y).ok).toBe(true);

    const plan = [
      ['fisher', kx + 3, ky - 3],
      ['fisher', kx + 5, ky - 3],
      ['sheepfarm', kx + 6, ky + 1],
      ['weaver', kx + 8, ky + 1],
      ['chapel', kx + 6, ky - 2],
      ['house', kx + 2, ky + 1],
      ['house', kx + 2, ky + 2],
    ] as const;
    for (const [defId, x, y] of plan) {
      const r = placeBuilding(w, defId, x, y);
      expect(r.ok, `${defId} at ${x},${y}`).toBe(true);
    }

    for (let i = 0; i < 3000; i++) step(w);

    const tiers = Object.values(w.buildings).flatMap((b) => (b.house ? [b.house.tier] : []));
    expect(Math.max(...tiers)).toBeGreaterThanOrEqual(2);
    expect(w.tick).toBe(3000);
    expect(w.money).toBeGreaterThan(-5000);
  });
});

/** Prüft für jedes Haus: Abdeckung mit und ohne `buildCoverage`, Versorgung und Diagnose gleich der Referenz. */
function expectCoverageMatchesNaive(world: World): void {
  const cov = buildCoverage(world);
  for (const b of Object.values(world.buildings)) {
    if (!b.house) continue;
    const missing: string[] = [];
    for (const s of SERVICE_IDS) {
      const ref = serviceAvailableNaive(world, b, s);
      expect(serviceAvailable(world, b, s), `Haus ${b.id} ${s}`).toBe(ref);
      expect(serviceAvailable(world, b, s, cov), `Haus ${b.id} ${s} cov`).toBe(ref);
      if (TIERS[b.house.tier].services.includes(s) && !ref) missing.push(s);
    }
    const supplied = isSuppliedNaive(world, b);
    expect(isSupplied(world, b)).toBe(supplied);
    expect(isSupplied(world, b, cov)).toBe(supplied);
    const services = houseDiagnosis(world, b).flatMap((d) =>
      d.kind === 'service' ? [d.service] : [],
    );
    expect(services).toEqual(supplied ? missing : []);
  }
}

describe('M12 E0 Abdeckung', () => {
  it('AK-E0-12a D1: Abdeckung gleich Referenz über 1000 Schritte', () => {
    const world = denseScene();
    for (let t = 1; t <= 1000; t++) {
      step(world);
      if (t % 100 === 0) expectCoverageMatchesNaive(world);
    }
  }, 120_000);

  it('AK-E0-12b Referenzlauf off: Abdeckung gleich Referenz alle 100 Ticks', () => {
    const world = createWorld(3, { crisisLevel: 'off', unlockAll: true });
    const { layout, t } = startColony(world);
    let checks = 0;
    runColony(world, layout, t, {}, (cw) => {
      if (cw.tick % 100 === 0) {
        expectCoverageMatchesNaive(cw);
        checks++;
      }
      return false;
    });
    expect(checks).toBeGreaterThan(10);
  }, 120_000);

  it('AK-E0-12c Werkzeugmacher: noService genau dort, wo keine Schule in Reichweite ist', () => {
    const world = denseScene({ toolmakers: true });
    const tm = Object.values(world.buildings).filter((b) => b.defId === 'toolmaker');
    expect(tm).toHaveLength(4);
    // In D1 steht jeder Werkzeugmacher in Schulreichweite; Schulen um Nr. 1 und 3 entfernen, damit beides vorkommt.
    for (const b of Object.values(world.buildings))
      if (b.defId === 'school' && [1, 3].some((i) => Math.abs(b.x - tm[i]!.x) <= 10))
        delete world.buildings[b.id];
    const refs = tm.map((b) => serviceAvailableNaive(world, b, 'school'));
    expect(refs).toContain(true);
    expect(refs).toContain(false);
    tm.forEach((b, i) => expect(serviceAvailable(world, b, 'school')).toBe(refs[i]));
    home(world).stock.wood = 100;
    tickProduction(world);
    tm.forEach((b, i) => expect(b.state === 'noService', `Werkzeugmacher ${i}`).toBe(!refs[i]));
  });

  it('AK-E0-12d Grenzfall: Mittenabstand genau serviceRadius zählt, ein Viertel weiter nicht', () => {
    const radius = BUILDING_DEFS.chapel.serviceRadius!;
    const world = createWorld(3, { unlockAll: true });
    const chapel = putBuilding(world, 0, 'chapel', 20, 20);
    // Direkt geschrieben mit gebrochener Koordinate: Hausmitte (x + 0.5) liegt exakt radius rechts von der Kapellenmitte.
    const house = putBuilding(world, 0, 'house', 20 + 1 + radius, 20);
    house.x = 20 + 1 + radius - 0.5;
    house.y = 20.5;
    expect(serviceAvailable(world, house, 'faith')).toBe(true);
    expect(serviceAvailable(world, house, 'faith', buildCoverage(world))).toBe(true);
    expect(serviceAvailableNaive(world, house, 'faith')).toBe(true);
    house.x += 0.25;
    expect(serviceAvailable(world, house, 'faith')).toBe(false);
    expect(serviceAvailable(world, house, 'faith', buildCoverage(world))).toBe(false);
    expect(serviceAvailableNaive(world, house, 'faith')).toBe(false);
    expect(chapel.connected).toBe(true);
  });

  it('AK-E0-13 Abdeckung folgt Bau, Abriss, Wegabbruch und Brand ohne Schritt; nichts im Save', () => {
    const { w: world, houses } = village(5, { unlockAll: true });
    const k = world.buildings[home(world).kontorId]!;
    const check = (expected: boolean): void => {
      expectCoverageMatchesNaive(world);
      expect(serviceAvailable(world, houses[0]!, 'faith')).toBe(expected);
      const before = serialize(world);
      serviceAvailable(world, houses[0]!, 'faith');
      buildCoverage(world);
      expect(serialize(world)).toBe(before);
    };
    const buildChapel = (): Building => {
      forceRect(world, k.x, k.y + 2, 2, 3, 'grass');
      world.money = 1_000_000;
      for (const g of GOOD_IDS) home(world).stock[g] = 100;
      expect(placeRoad(world, k.x, k.y + 2).ok).toBe(true);
      const r = placeBuilding(world, 'chapel', k.x, k.y + 3);
      expect(r.ok ? 'ok' : r.reason).toBe('ok');
      return world.buildings[r.id!]!;
    };
    check(false);
    let chapel = buildChapel();
    expect(chapel.connected).toBe(true);
    check(true);
    expect(demolish(world, chapel.id).ok).toBe(true);
    check(false);
    chapel = buildChapel();
    expect(removeRoad(world, k.x, k.y + 2).ok).toBe(true);
    expect(chapel.connected).toBe(false);
    check(false);
    expect(placeRoad(world, k.x, k.y + 2).ok).toBe(true);
    check(true);
    beginCrisis(world, 0, { kind: 'fire', tile: { x: chapel.x, y: chapel.y } });
    expect(chapel.outageUntil).toBeDefined();
    check(false);
    world.tick = chapel.outageUntil!;
    tickCrises(world);
    check(true);
  });
});
