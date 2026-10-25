import { beforeEach, describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { FEAST_KINDS, FEAST_KIND_IDS } from '../../src/sim/defs/feast';
import { feastKindOf, harvestCycle, isFeastKind } from '../../src/sim/feastEffect';
import { feastBlockReason, holdFeast } from '../../src/sim/feast';
import { noKontorTrade } from '../../src/sim/islands';
import { demolish } from '../../src/sim/build';
import { serialize } from '../../src/sim/save';
import { createWorld, home, islandOf } from '../../src/sim/world';
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
