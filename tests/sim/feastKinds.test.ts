import { beforeEach, describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { FEAST_KINDS, FEAST_KIND_IDS } from '../../src/sim/defs/feast';
import { feastActive, feastKindOf, harvestCycle, isFeastKind } from '../../src/sim/feastEffect';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { cycleOf, effectiveCycle, traitOf } from '../../src/sim/levels';
import { sell, sellPrice } from '../../src/sim/trade';
import { step } from '../../src/sim/tick';
import { GOODS, SELL_DROP, SELL_FLOOR } from '../../src/sim/defs/goods';
import { FEAST_COOLDOWN, FEAST_DURATION } from '../../src/sim/defs/timing';
import type { GoodId } from '../../src/sim/types';
import { feastBlockReason, holdFeast } from '../../src/sim/feast';
import { noKontorTrade } from '../../src/sim/islands';
import { demolish } from '../../src/sim/build';
import { serialize } from '../../src/sim/save';
import { HOME, createWorld, home, islandOf } from '../../src/sim/world';
import type { Building, World } from '../../src/sim/types';
import {
  houseNearKontor,
  placeService,
  placeTownhall,
  putBuilding,
  setAllTax,
  twoIslandWorld,
} from './helpers';

const SIM = 'src/sim';

function importsOf(path: string): string[] {
  const src = readFileSync(path, 'utf8');
  return [...src.matchAll(/from\s+'([^']+)'/g)].map((m) => m[1]!);
}

/** Löst ein relatives Importziel gegen die Datei auf (ohne node:path, nur Segmente). */
function resolveTarget(from: string, target: string): string {
  const parts = from.split('/').slice(0, -1);
  for (const seg of target.split('/')) {
    if (seg === '..') parts.pop();
    else if (seg !== '.') parts.push(seg);
  }
  const base = parts.join('/');
  return existsSync(`${base}.ts`) ? `${base}.ts` : `${base}/index.ts`;
}

function importClosure(path: string): Set<string> {
  const seen = new Set<string>();
  const visit = (file: string): void => {
    for (const t of importsOf(file)) {
      if (!t.startsWith('.')) continue;
      const next = resolveTarget(file, t);
      if (!next.startsWith(`${SIM}/`) || seen.has(next)) continue;
      seen.add(next);
      visit(next);
    }
  };
  visit(path);
  return seen;
}

describe('AK-FE15 Werte nur aus Defs', () => {
  it('kennt genau die drei Festarten', () => {
    expect(FEAST_KIND_IDS).toEqual(['ascension', 'harvest', 'market']);
  });

  it('Tabelle der Festarten', () => {
    expect(FEAST_KINDS.ascension.name).toBe('Aufstiegsfest');
    expect(FEAST_KINDS.harvest.name).toBe('Erntefest');
    expect(FEAST_KINDS.market.name).toBe('Markttag');
    expect(FEAST_KINDS.ascension.cost).toEqual({ rum: 10 });
    expect(FEAST_KINDS.harvest.cost).toEqual({ rum: 10, cloth: 15 });
    expect(FEAST_KINDS.market.cost).toEqual({ rum: 10, glass: 5 });
    expect(FEAST_KINDS.ascension.scope).toBe('chapel');
    expect(FEAST_KINDS.harvest.scope).toBe('island');
    expect(FEAST_KINDS.market.scope).toBe('island');
    expect(FEAST_KINDS.harvest.cyclePct).toBe(75);
    expect(FEAST_KINDS.market.sellPct).toBe(125);
  });

  it('Rum steht in jeder Art zuerst', () => {
    for (const id of FEAST_KIND_IDS) expect(Object.keys(FEAST_KINDS[id].cost)[0]).toBe('rum');
  });

  it('timing.ts exportiert kein FEAST_RUM mehr', () => {
    const src = readFileSync(`${SIM}/defs/timing.ts`, 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '');
    expect(src).not.toContain('FEAST_RUM');
  });
});

describe('AK-FE21 Importstruktur (Blatt)', () => {
  const file = `${SIM}/feastEffect.ts`;

  it('feastEffect importiert nur council, types, world und defs', () => {
    const targets = importsOf(file);
    for (const bad of ['./economy', './levels', './trade', './feast', './townhall'])
      expect(targets).not.toContain(bad);
    for (const t of targets)
      expect(
        t === './council' || t === './types' || t === './world' || t.startsWith('./defs/'),
      ).toBe(true);
  });

  it('transitive Hülle enthält keine Wirtschaftsmodule', () => {
    const closure = [...importClosure(file)].map((p) => p.slice(SIM.length + 1));
    for (const bad of [
      'feast.ts',
      'economy.ts',
      'levels.ts',
      'trade.ts',
      'townhall.ts',
      'population.ts',
    ])
      expect(closure).not.toContain(bad);
  });
});

describe('feastEffect Abfragen', () => {
  it('isFeastKind', () => {
    expect(isFeastKind('harvest')).toBe(true);
    expect(isFeastKind('harbor')).toBe(false);
    expect(isFeastKind(5)).toBe(false);
    expect(isFeastKind(undefined)).toBe(false);
  });

  it('feastKindOf ohne Feld ist Aufstiegsfest', () => {
    expect(feastKindOf({} as Building)).toBe('ascension');
    expect(feastKindOf({ feastKind: 'market' } as Building)).toBe('market');
  });

  it('harvestCycle verkürzt auf 75 % und nie unter 1', () => {
    expect(harvestCycle(20)).toBe(15);
    expect(harvestCycle(1)).toBe(1);
    expect(harvestCycle(50)).toBe(37);
    expect(harvestCycle(32)).toBe(24);
  });
});

type Kind = 'ascension' | 'harvest' | 'market';
const reasonOf = (r: ReturnType<typeof holdFeast>): string => (r.ok ? '' : r.reason);
const stockOf = (w: World, c: Building) => islandOf(w, c).stock;

let w: World;
let chapel: Building;
let shop: Building;

function fill(world: World, c: Building): void {
  Object.assign(stockOf(world, c), { rum: 30, cloth: 30, glass: 30 });
}

beforeEach(() => {
  w = createWorld(3, { unlockAll: true });
  const house = houseNearKontor(w);
  chapel = placeService(w, 'chapel', house.x + 5, house.y);
  shop = putBuilding(w, 0, 'weaver', chapel.x + 3, chapel.y);
  w.tick = 1000;
  fill(w, chapel);
});

describe('AK-FE2 Aufstiegsfest unverändert', () => {
  it('ohne Art, mit Art und von Hand gleicher Zustand, kein feastKind', () => {
    const w2 = createWorld(3, { unlockAll: true });
    const h2 = houseNearKontor(w2);
    const c2 = placeService(w2, 'chapel', h2.x + 5, h2.y);
    putBuilding(w2, 0, 'weaver', c2.x + 3, c2.y);
    w2.tick = 1000;
    fill(w2, c2);
    const w3 = createWorld(3, { unlockAll: true });
    const h3 = houseNearKontor(w3);
    const c3 = placeService(w3, 'chapel', h3.x + 5, h3.y);
    putBuilding(w3, 0, 'weaver', c3.x + 3, c3.y);
    w3.tick = 1000;
    fill(w3, c3);
    expect(holdFeast(w, chapel.id)).toEqual({ ok: true });
    expect(holdFeast(w2, c2.id, 'ascension')).toEqual({ ok: true });
    c3.feastAt = 1000;
    stockOf(w3, c3).rum -= 10;
    expect(serialize(w)).toBe(serialize(w2));
    expect(serialize(w)).toBe(serialize(w3));
    expect('feastKind' in chapel).toBe(false);
  });
});

describe('AK-FE3 unbekannte Festart', () => {
  it('lehnt ab und ändert nichts', () => {
    const before = JSON.stringify(w);
    expect(holdFeast(w, chapel.id, 'harbor')).toEqual({ ok: false, reason: 'Unbekannte Festart' });
    expect(JSON.stringify(w)).toBe(before);
  });
  it('auch während ein Fest läuft', () => {
    expect(holdFeast(w, chapel.id).ok).toBe(true);
    expect(reasonOf(holdFeast(w, chapel.id, 'harbor'))).toBe('Unbekannte Festart');
  });
});

describe('AK-FE4 Waren', () => {
  it('Stoff fehlt', () => {
    stockOf(w, chapel).cloth = 7;
    expect(reasonOf(holdFeast(w, chapel.id, 'harvest'))).toBe('Zu wenig Stoff (7 / 15)');
    expect(stockOf(w, chapel).rum).toBe(30);
  });
  it('Rum fehlt zuerst', () => {
    Object.assign(stockOf(w, chapel), { rum: 3, cloth: 0 });
    expect(reasonOf(holdFeast(w, chapel.id, 'harvest'))).toBe('Zu wenig Rum (3 / 10)');
  });
  it('Glas fehlt', () => {
    stockOf(w, chapel).glass = 2;
    expect(reasonOf(holdFeast(w, chapel.id, 'market'))).toBe('Zu wenig Glas (2 / 5)');
  });
  it('Erfolg bucht genau die Kosten ab', () => {
    expect(holdFeast(w, chapel.id, 'harvest').ok).toBe(true);
    expect(stockOf(w, chapel).rum).toBe(20);
    expect(stockOf(w, chapel).cloth).toBe(15);
    expect(stockOf(w, chapel).glass).toBe(30);
    expect(chapel.feastKind).toBe('harvest');
  });
  it('Markttag bucht Rum und Glas', () => {
    expect(holdFeast(w, chapel.id, 'market').ok).toBe(true);
    expect(stockOf(w, chapel).rum).toBe(20);
    expect(stockOf(w, chapel).glass).toBe(25);
    expect(stockOf(w, chapel).cloth).toBe(30);
    expect(chapel.feastKind).toBe('market');
  });
  it('Bruchteil Rum zählt abgerundet', () => {
    stockOf(w, chapel).rum = 9.5;
    expect(reasonOf(holdFeast(w, chapel.id, 'harvest'))).toBe('Zu wenig Rum (9 / 10)');
  });
});

describe('AK-FE5 Sperren je Art', () => {
  const kinds: Kind[] = ['ascension', 'harvest', 'market'];
  const consistent = (c: Building, kind: Kind, reason: string | null): void => {
    const before = JSON.stringify(w);
    expect(feastBlockReason(w, c, kind)).toBe(reason);
    expect(JSON.stringify(w)).toBe(before);
    if (reason !== null) expect(reasonOf(holdFeast(w, c.id, kind))).toBe(reason);
  };
  it('Steuer hoch sperrt nur das Aufstiegsfest', () => {
    placeTownhall(w);
    chapel.connected = true;
    setAllTax(w, 'high');
    consistent(chapel, 'ascension', 'Steuer «hoch»: kein Aufstieg');
    consistent(chapel, 'harvest', null);
    consistent(chapel, 'market', null);
    expect(holdFeast(w, chapel.id, 'harvest').ok).toBe(true);
  });
  it('Erntefest ohne Betrieb im Radius', () => {
    expect(demolish(w, shop.id).ok).toBe(true);
    chapel.connected = true;
    consistent(chapel, 'harvest', 'Kein Betrieb im Umkreis');
    consistent(chapel, 'market', null);
  });
  it('stillgelegter Betrieb zählt', () => {
    shop.paused = true;
    consistent(chapel, 'harvest', null);
  });
  it('Betrieb auf anderer Insel zählt nicht', () => {
    const t = twoIslandWorld();
    const c = putBuilding(t, 1, 'chapel', 5, 5);
    putBuilding(t, 0, 'weaver', 8, 5);
    fill(t, c);
    expect(reasonOf(holdFeast(t, c.id, 'harvest'))).toBe('Kein Betrieb im Umkreis');
    putBuilding(t, 1, 'weaver', 8, 5);
    expect(holdFeast(t, c.id, 'harvest').ok).toBe(true);
  });
  it('Markttag ohne Kontor der Insel', () => {
    const t = twoIslandWorld();
    const c = putBuilding(t, 1, 'chapel', 5, 5);
    fill(t, c);
    t.islands[1]!.kontorId = null;
    const why = noKontorTrade(t, 1)!;
    expect(why).not.toBeNull();
    expect(feastBlockReason(t, c, 'market')).toBe(why);
    expect(reasonOf(holdFeast(t, c.id, 'market'))).toBe(why);
  });
  it('freie Kapelle liefert null, Gründe stimmen mit holdFeast überein', () => {
    for (const k of kinds) consistent(chapel, k, null);
    stockOf(w, chapel).rum = 3;
    for (const k of kinds) consistent(chapel, k, 'Zu wenig Rum (3 / 10)');
  });
});

describe('AK-FE6 Inselsperre', () => {
  let k2: Building;
  beforeEach(() => {
    k2 = placeService(w, 'chapel', chapel.x, chapel.y + 3);
    putBuilding(w, 0, 'weaver', k2.x + 3, k2.y);
    chapel.connected = true; // placeBuilding berechnet die Anbindung neu
    fill(w, chapel);
  });
  const later = (dt: number): void => {
    w.tick += dt;
    fill(w, k2);
  };
  it('Erntefest: Sperre bis Ablauf der Abklingzeit, andere Arten frei', () => {
    expect(holdFeast(w, chapel.id, 'harvest').ok).toBe(true);
    later(1799);
    expect(reasonOf(holdFeast(w, k2.id, 'harvest'))).toBe('Erntefest auf der Insel: Abklingzeit');
    expect(feastBlockReason(w, k2, 'market')).toBeNull();
    expect(feastBlockReason(w, k2, 'ascension')).toBeNull();
    later(1);
    expect(holdFeast(w, k2.id, 'harvest').ok).toBe(true);
  });
  it('Markttag: Sperre auf der Insel', () => {
    expect(holdFeast(w, chapel.id, 'market').ok).toBe(true);
    later(10);
    expect(reasonOf(holdFeast(w, k2.id, 'market'))).toBe('Markttag auf der Insel: Abklingzeit');
  });
  it('andere Insel unberührt', () => {
    const t = twoIslandWorld();
    const a = putBuilding(t, 0, 'chapel', 5, 5);
    putBuilding(t, 0, 'weaver', 8, 5);
    const b = putBuilding(t, 1, 'chapel', 5, 5);
    putBuilding(t, 1, 'weaver', 8, 5);
    t.tick = 1000;
    fill(t, a);
    fill(t, b);
    expect(holdFeast(t, a.id, 'harvest').ok).toBe(true);
    expect(holdFeast(t, b.id, 'harvest').ok).toBe(true);
  });
  it('Abriss der ersten Kapelle hebt die Sperre auf', () => {
    expect(holdFeast(w, chapel.id, 'harvest').ok).toBe(true);
    later(10);
    expect(demolish(w, chapel.id).ok).toBe(true);
    for (const b of Object.values(w.buildings)) b.connected = true;
    expect(holdFeast(w, k2.id, 'harvest').ok).toBe(true);
  });
  it('Brand an der ersten Kapelle hebt die Sperre nicht auf', () => {
    expect(holdFeast(w, chapel.id, 'harvest').ok).toBe(true);
    later(10);
    chapel.outageUntil = w.tick + 100;
    expect(reasonOf(holdFeast(w, k2.id, 'harvest'))).toBe('Erntefest auf der Insel: Abklingzeit');
  });
});

describe('Review Focus 5 Waren der Kapellen-Insel', () => {
  it('bucht auf Insel 1 und nicht im Heimatlager', () => {
    const t = twoIslandWorld();
    const c = putBuilding(t, 1, 'chapel', 5, 5);
    putBuilding(t, 1, 'weaver', 8, 5);
    Object.assign(t.islands[1]!.stock, { rum: 30, cloth: 30 });
    Object.assign(home(t).stock, { rum: 7, cloth: 7 });
    expect(holdFeast(t, c.id, 'harvest').ok).toBe(true);
    expect(t.islands[1]!.stock.rum).toBe(20);
    expect(t.islands[1]!.stock.cloth).toBe(15);
    expect(home(t).stock.rum).toBe(7);
    expect(home(t).stock.cloth).toBe(7);
  });
  it('Ware nur im Heimatlager reicht nicht', () => {
    const t = twoIslandWorld();
    const c = putBuilding(t, 1, 'chapel', 5, 5);
    putBuilding(t, 1, 'weaver', 8, 5);
    Object.assign(t.islands[1]!.stock, { rum: 30, cloth: 0 });
    Object.assign(home(t).stock, { rum: 30, cloth: 99 });
    expect(reasonOf(holdFeast(t, c.id, 'harvest'))).toBe('Zu wenig Stoff (0 / 15)');
  });
});

describe('AK-FE15 feast.ts ohne Spielwerte', () => {
  const code = readFileSync(`${SIM}/feast.ts`, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
  it('keine Zahlen oder Waren-Literale der Festarten', () => {
    expect(code).not.toMatch(/\b(75|125|15)\b/);
    for (const g of ["'cloth'", "'glass'", "'rum'"]) expect(code).not.toContain(g);
  });
});

describe('AK-FE21 Importstruktur (P-11)', () => {
  it('feast.ts importiert nicht trade', () => {
    expect(importsOf(`${SIM}/feast.ts`)).not.toContain('./trade');
  });
  it('islands.ts importiert nur mapgen, rng, types und defs', () => {
    for (const t of importsOf(`${SIM}/islands.ts`))
      expect(['./mapgen', './rng', './types'].includes(t) || t.startsWith('./defs/')).toBe(true);
  });
  it('Hülle von islands.ts enthält weder feast noch population', () => {
    const closure = [...importClosure(`${SIM}/islands.ts`)].map((p) => p.slice(SIM.length + 1));
    expect(closure).not.toContain('feast.ts');
    expect(closure).not.toContain('population.ts');
  });
});

describe('Reviewer T02: Kapelle brennt und nicht angebunden, je Art', () => {
  for (const kind of ['ascension', 'harvest', 'market'] as const) {
    it(`${kind}: brennt`, () => {
      chapel.outageUntil = w.tick + 100;
      expect(reasonOf(holdFeast(w, chapel.id, kind))).toBe('Kapelle brennt');
      expect(feastBlockReason(w, chapel, kind)).toBe('Kapelle brennt');
    });
    it(`${kind}: nicht angebunden`, () => {
      chapel.connected = false;
      expect(reasonOf(holdFeast(w, chapel.id, kind))).toBe('Kapelle nicht angebunden');
      expect(feastBlockReason(w, chapel, kind)).toBe('Kapelle nicht angebunden');
    });
  }
});

/** Direkt gesetztes Fest (ohne Lager und Sperren). */
function startFeast(c: Building, kind: Kind): void {
  c.feastAt = w.tick;
  if (kind === 'ascension') delete c.feastKind;
  else c.feastKind = kind;
}

describe('AK-FE7 Erntefest verkürzt cycleOf', () => {
  beforeEach(() => {
    shop.level = 3;
  });
  it('15 während active, 20 danach, 20 ausserhalb des Radius', () => {
    expect(cycleOf(w, shop)).toBe(20);
    const far = putBuilding(w, 0, 'weaver', chapel.x, chapel.y + 14);
    far.level = 3;
    expect(holdFeast(w, chapel.id, 'harvest').ok).toBe(true);
    expect(cycleOf(w, shop)).toBe(15);
    expect(cycleOf(w, far)).toBe(20);
    w.tick = chapel.feastAt! + FEAST_DURATION;
    expect(cycleOf(w, shop)).toBe(20);
  });
  it('Inselvorteil und Ratsbeschluss bleiben, dann Erntefest', () => {
    w.council[2] = 'A';
    const c = cycleOf(w, shop)!;
    expect(c).toBeLessThan(20);
    expect(holdFeast(w, chapel.id, 'harvest').ok).toBe(true);
    expect(cycleOf(w, shop)).toBe(harvestCycle(c));
  });
  it('Inselvorteil einer Fremdinsel', () => {
    const t = twoIslandWorld();
    t.islands[1]!.kind = 'B';
    const c = putBuilding(t, 1, 'chapel', 5, 5);
    const q = putBuilding(t, 1, 'quarry', 8, 5);
    t.tick = 1000;
    fill(t, c);
    const base = cycleOf(t, q)!;
    expect(traitOf(t, 1, 'quarry')).toBeDefined();
    expect(base).toBe(effectiveCycle(t, 1, 'quarry', BUILDING_DEFS.quarry.cycle!));
    expect(holdFeast(t, c.id, 'harvest').ok).toBe(true);
    expect(cycleOf(t, q)).toBe(harvestCycle(base));
  });
  it('Brand der Kapelle hebt die Wirkung auf, Brandende stellt sie wieder her', () => {
    expect(holdFeast(w, chapel.id, 'harvest').ok).toBe(true);
    chapel.outageUntil = w.tick + 100;
    expect(cycleOf(w, shop)).toBe(20);
    delete chapel.outageUntil;
    expect(cycleOf(w, shop)).toBe(15);
  });
  it('Abriss der Kapelle beendet die Wirkung im selben Tick, progress bleibt', () => {
    expect(holdFeast(w, chapel.id, 'harvest').ok).toBe(true);
    shop.progress = 7;
    expect(demolish(w, chapel.id).ok).toBe(true);
    shop.connected = true;
    expect(cycleOf(w, shop)).toBe(20);
    expect(shop.progress).toBe(7);
  });
});

describe('AK-FE8 überlappende Erntefeste', () => {
  it('wirken nicht doppelt', () => {
    shop.level = 3;
    const k2 = placeService(w, 'chapel', chapel.x, chapel.y + 3);
    chapel.connected = true;
    startFeast(chapel, 'harvest');
    startFeast(k2, 'harvest');
    expect(cycleOf(w, shop)).toBe(15);
  });
});

describe('AK-FE9 Produktion im Erntefest', () => {
  it('fertigt nach dem verkürzten Zyklus', () => {
    w.crisisLevel = 'off';
    shop.level = 3;
    shop.progress = 17;
    Object.assign(stockOf(w, chapel), { wool: 90, cloth: 0 });
    startFeast(chapel, 'harvest');
    step(w);
    expect(stockOf(w, chapel).cloth).toBe(1);
    expect(shop.progress).toBe(0);
  });
  it('Ausstoss über 600 Ticks etwa 40 (gezählt an den Zyklusenden, Verbrauch der Häuser egal)', () => {
    w.crisisLevel = 'off';
    shop.level = 3;
    startFeast(chapel, 'harvest');
    let made = 0;
    for (let i = 0; i < FEAST_DURATION; i++) {
      stockOf(w, chapel).wool = 90;
      const before = shop.progress;
      step(w);
      if (shop.progress < before) made += 1;
    }
    expect(made).toBeGreaterThanOrEqual(39);
    expect(made).toBeLessThanOrEqual(41);
  });
});

/** Referenz der Spec: Erlös mit Prozentfaktor `m`. */
function ref(world: World, good: GoodId, n: number, m: number): number {
  let acc = 0;
  let pct = world.sellPct[good];
  for (let i = 0; i < n; i++) {
    acc += GOODS[good].sell * pct * m;
    pct = Math.max(SELL_FLOOR, pct - SELL_DROP);
  }
  return Math.floor(acc / 10000);
}

describe('AK-FE10 Markttag in sellPrice', () => {
  it('ohne Markttag Faktor 100, mit Markttag 125', () => {
    expect(sellPrice(w, 'rum', 10, HOME)).toBe(ref(w, 'rum', 10, 100));
    expect(sellPrice(w, 'rum', 10, HOME)).toBe(171);
    startFeast(chapel, 'market');
    expect(sellPrice(w, 'rum', 10, HOME)).toBe(ref(w, 'rum', 10, 125));
  });
  it('Boom (150) gewinnt gegen den Markttag', () => {
    w.crisis = { period: 0, kind: 'boom', from: w.tick, until: w.tick + 100, good: 'rum' };
    const boomOnly = sellPrice(w, 'rum', 10, HOME);
    expect(boomOnly).toBe(ref(w, 'rum', 10, 150));
    startFeast(chapel, 'market');
    expect(sellPrice(w, 'rum', 10, HOME)).toBe(boomOnly);
  });
  it('Vorliebe (130) gewinnt gegen den Markttag', () => {
    const t = twoIslandWorld();
    const c = putBuilding(t, 1, 'chapel', 5, 5);
    const without = sellPrice(t, 'cloth', 10, 1);
    expect(without).toBe(ref(t, 'cloth', 10, 130));
    c.feastAt = t.tick;
    c.feastKind = 'market';
    expect(sellPrice(t, 'cloth', 10, 1)).toBe(without);
  });
  it('zwei Markttage zählen einmal', () => {
    const k2 = placeService(w, 'chapel', chapel.x, chapel.y + 3);
    chapel.connected = true;
    startFeast(chapel, 'market');
    startFeast(k2, 'market');
    expect(sellPrice(w, 'rum', 10, HOME)).toBe(ref(w, 'rum', 10, 125));
  });
  it('Sättigung sellPct nach sell unabhängig vom Markttag', () => {
    const w2 = createWorld(3, { unlockAll: true });
    const h2 = houseNearKontor(w2);
    const c2 = placeService(w2, 'chapel', h2.x + 5, h2.y);
    w2.tick = 1000;
    stockOf(w, chapel).rum = 10;
    stockOf(w2, c2).rum = 10;
    startFeast(c2, 'market');
    expect(sell(w, 'rum', 10).ok).toBe(true);
    expect(sell(w2, 'rum', 10).ok).toBe(true);
    expect(w2.sellPct).toEqual(w.sellPct);
  });
});

describe('AK-FE11 Aufstiegs- und Erntefest nebeneinander', () => {
  it('Haus im Radius von K1 und Betrieb im Radius von K2', () => {
    shop.level = 3;
    const house =
      w.buildings[
        Object.keys(w.buildings)
          .map(Number)
          .find((i) => w.buildings[i]!.house !== undefined)!
      ]!;
    const k2 = putBuilding(w, 0, 'chapel', chapel.x, chapel.y + 8);
    startFeast(chapel, 'ascension');
    startFeast(k2, 'harvest');
    expect(feastActive(w, house)).toBe(true);
    expect(cycleOf(w, shop)).toBe(15);
    const near2 = putBuilding(w, 0, 'house', chapel.x, chapel.y + 16);
    expect(feastActive(w, near2)).toBe(false);
  });
});

describe('AK-FE12 Aufstiegsfest nach Erntefest', () => {
  it('löscht feastKind, Betrieb wieder 20', () => {
    shop.level = 3;
    startFeast(chapel, 'harvest');
    w.tick = chapel.feastAt! + FEAST_COOLDOWN;
    expect(holdFeast(w, chapel.id, 'ascension').ok).toBe(true);
    expect('feastKind' in chapel).toBe(false);
    expect(cycleOf(w, shop)).toBe(20);
  });
});

describe('Review Focus 2 bis 4 Inselgrenzen und Kapellenzustand', () => {
  it('Heimat-Erntefest wirkt nicht auf Insel 1 an gleichen Koordinaten', () => {
    const t = twoIslandWorld();
    const c = putBuilding(t, 0, 'chapel', 5, 5);
    const a = putBuilding(t, 0, 'weaver', 8, 5);
    const b = putBuilding(t, 1, 'weaver', 8, 5);
    a.level = 3;
    b.level = 3;
    c.feastAt = t.tick;
    c.feastKind = 'harvest';
    expect(cycleOf(t, a)).toBe(15);
    expect(cycleOf(t, b)).toBe(20);
  });
  it('Markttag-Kapelle: Brand 100, Brandende 125, Abriss 100', () => {
    startFeast(chapel, 'market');
    const plain = ref(w, 'rum', 10, 100);
    chapel.outageUntil = w.tick + 100;
    expect(sellPrice(w, 'rum', 10, HOME)).toBe(plain);
    delete chapel.outageUntil;
    expect(sellPrice(w, 'rum', 10, HOME)).toBe(ref(w, 'rum', 10, 125));
    expect(demolish(w, chapel.id).ok).toBe(true);
    expect(sellPrice(w, 'rum', 10, HOME)).toBe(plain);
  });
  it('Markttag auf Insel 1 lässt den Heimatpreis unverändert', () => {
    const t = twoIslandWorld();
    const c = putBuilding(t, 1, 'chapel', 5, 5);
    const before = sellPrice(t, 'rum', 10, HOME);
    c.feastAt = t.tick;
    c.feastKind = 'market';
    expect(sellPrice(t, 'rum', 10, HOME)).toBe(before);
    expect(sellPrice(t, 'rum', 10, 1)).toBe(ref(t, 'rum', 10, 125));
  });
});

describe('AK-FE15 und AK-FE21 Rest', () => {
  const strip = (f: string): string =>
    readFileSync(`${SIM}/${f}`, 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '');
  it('keine 75 oder 125 in feastEffect, levels, trade', () => {
    for (const f of ['feastEffect.ts', 'levels.ts', 'trade.ts'])
      expect(strip(f), f).not.toMatch(/\b(75|125)\b/);
  });
  it('levels und trade importieren feastEffect, nicht feast', () => {
    for (const f of ['levels.ts', 'trade.ts']) {
      expect(importsOf(`${SIM}/${f}`)).toContain('./feastEffect');
      expect(importsOf(`${SIM}/${f}`)).not.toContain('./feast');
    }
  });
});
