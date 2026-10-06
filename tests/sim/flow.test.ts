import { describe, expect, it } from 'vitest';
import {
  dampsOn,
  deficitGood,
  goodsBalance,
  upgradeDeficit,
  upgradeDelta,
} from '../../src/sim/flow';
import { UPGRADE_DEFICIT_WAIT_FACTOR } from '../../src/sim/defs/timing';
import { UPGRADE_WAIT, upgradeStatus } from '../../src/sim/population';
import { setTaxLevel } from '../../src/sim/tax';
import { step } from '../../src/sim/tick';
import type { Building, BuildingDefId, HouseState, Tier, World } from '../../src/sim/types';
import { placeService, placeTownhall, putBuilding, setHouse, village } from './helpers';
import { home } from '../../src/sim/world';
import { foundKontor2Literal, seaWorld } from './seaHelpers';

const hs = (tier: Tier, inhabitants: number): HouseState => ({
  tier,
  inhabitants,
  demand: {},
  satisfied: {},
  services: {},
  satisfiedSince: 0,
  supplied: true,
});
/** Angebundener Betrieb ohne Kacheln; nach allen Bauaktionen anlegen (recomputeConnectivity). */
function addRaw(w: World, defId: BuildingDefId, extra: Partial<Building> = {}): void {
  const id = w.nextBuildingId++;
  w.buildings[id] = {
    id,
    defId,
    x: 0,
    y: 0,
    connected: true,
    progress: 0,
    state: 'ok',
    island: 0,
    ...extra,
  };
}
/** n volle Pionierhäuser (4 EW), Kapelle, Fischer, Webereien; Lager voll genug; t0 = 1000 (Vielfaches von 50). */
function ready(n: number, fishers: number, weavers: number, tax?: 'low' | 'high') {
  const { w, houses } = village(n, { unlockAll: true });
  const k = w.buildings[home(w).kontorId]!;
  if (tax) {
    placeTownhall(w); // vor der Kapelle: Bauen setzt connected neu
    expect(setTaxLevel(w, tax).ok).toBe(true);
  }
  placeService(w, 'chapel', k.x + 2, k.y + 2);
  for (let i = 0; i < fishers; i++) addRaw(w, 'fisher'); // je 2,5 Nahrung / 100 Ticks
  for (let i = 0; i < weavers; i++) addRaw(w, 'weaver'); // je 2,0 Stoff (nominell, ohne Wolle)
  Object.assign(home(w).stock, { food: 100, cloth: 100, wood: 100, tools: 50 });
  w.tick = 1000;
  for (const h of houses) {
    setHouse(h, 1, 4);
    h.house!.satisfiedSince = 1000;
  }
  return { w, h: houses[0]!, houses };
}
/** Schritte bis `until`; Tick des Aufstiegs auf Stufe 2, sonst −1. */
function upTick(w: World, h: Building, until: number): number {
  while (w.tick < until) {
    step(w);
    if (h.house!.tier === 2) return w.tick;
  }
  return -1;
}

describe('M11 Gedämpfter Aufstieg (Spec 3.2)', () => {
  it('AK-P1-08 deficitGood 1→2: Budget = Δ → null; Nahrung 1,999 → food; Stoff 1,599 → cloth', () => {
    const h = hs(1, 4);
    expect(deficitGood({ food: 2.0, cloth: 1.6 }, h)).toBeNull();
    expect(deficitGood({ food: 1.999, cloth: 1.6 }, h)).toBe('food');
    expect(deficitGood({ food: 2.0, cloth: 1.599 }, h)).toBe('cloth');
  });
  it('AK-P1-09 volles Pionierhaus: 2 Fischer t0+300; 1 Fischer erst t0+600; niedrig 150/300; hoch nie', () => {
    const a = ready(1, 2, 1); // Nahrung 5,0 − 2,0 = 3,0 ≥ Δ 2,0; Stoff 2,0 ≥ 1,6
    expect(upTick(a.w, a.h, 2000)).toBe(1300);
    const b = ready(1, 1, 1); // 2,5 − 2,0 = 0,5 < 2,0
    expect(upTick(b.w, b.h, 1300)).toBe(-1);
    expect(upgradeStatus(b.w, b.h).reasons).toContain('Bedürfnisse noch nicht 600 Ticks erfüllt');
    expect(upTick(b.w, b.h, 2000)).toBe(1600);
    const lo = ready(1, 2, 1, 'low');
    expect(upTick(lo.w, lo.h, 2000)).toBe(1150);
    const lo1 = ready(1, 1, 1, 'low');
    expect(upTick(lo1.w, lo1.h, 2000)).toBe(1300);
    const hi = ready(1, 2, 1, 'high');
    expect(upTick(hi.w, hi.h, 2000)).toBe(-1);
  });
  it('AK-P1-10 zwei volle Pionierhäuser, 3 Fischer, 2 Webereien: kleinere Id t0+300, die andere t0+350 (Rest 3,5 − 2,0 ≥ 0 im nächsten Takt)', () => {
    const { w, houses } = ready(2, 3, 2); // Nahrung 7,5 − 4,0 = 3,5
    const [a, b] = [...houses].sort((x, y) => x.id - y.id);
    while (w.tick < 1300) step(w);
    expect([a!.house!.tier, b!.house!.tier]).toEqual([2, 1]);
    while (w.tick < 1350) step(w);
    expect(b!.house!.tier).toBe(2); // neues Budget im nächsten Takt (Spec 3.2): 3,5 − 2,0 ≥ 0; siehe Risiken T02b
  });
  it('AK-P1-11 upgradeDelta bei vollem Haus (± 1e-9); Stufe 4 ohne Ziel leer', () => {
    const near = (d: Partial<Record<string, number>>, exp: Record<string, number>): void => {
      expect(Object.keys(d).sort()).toEqual(Object.keys(exp).sort());
      for (const g of Object.keys(exp)) expect(Math.abs(d[g]! - exp[g]!)).toBeLessThan(1e-9);
    };
    near(upgradeDelta(hs(1, 4)), { food: 2.0, cloth: 1.6 });
    near(upgradeDelta(hs(2, 8)), { food: 3.5, cloth: 1.4, rum: 3.0 });
    // R226 F-03: Kaufleute brauchen Gewürz, Δ 20 × 0,1 = 2,0
    near(upgradeDelta(hs(3, 15)), { food: 2.5, cloth: 1.0, rum: 1.0, glass: 2.0, spice: 2.0 });
    expect(upgradeDelta(hs(4, 20))).toEqual({});
  });
  it('AK-P1-12 Rum 100 im Lager bei Rum-Defizit → 600; brennende Brennerei zählt nominell', () => {
    const { w, houses } = village(1, { unlockAll: true });
    const h = houses[0]!;
    setHouse(h, 2, 8);
    for (let i = 0; i < 4; i++) addRaw(w, 'fisher'); // Nahrung 10,0 − 4,0 = 6,0 ≥ 3,5
    for (let i = 0; i < 2; i++) addRaw(w, 'weaver'); // Stoff 4,0 − 1,6 = 2,4 ≥ 1,4
    const burning = { state: 'burning', outageUntil: 1_000_000 } as const;
    addRaw(w, 'distillery', burning); // Rum 2,0 nominell < Δ 3,0
    home(w).stock.rum = 100;
    w.tick = 1300;
    h.house!.satisfiedSince = 1000;
    expect(upgradeStatus(w, h).reasons).toContain('Bedürfnisse noch nicht 600 Ticks erfüllt');
    expect(upgradeDeficit(w, h)?.good).toBe('rum');
    expect(Math.abs(upgradeDeficit(w, h)!.net + 1)).toBeLessThan(1e-9); // 2,0 − 3,0
    addRaw(w, 'distillery', burning); // 4,0 − 3,0 ≥ 0
    expect(upgradeStatus(w, h).reasons.some((r) => r.startsWith('Bedürfnisse noch nicht'))).toBe(
      false,
    );
    expect(upgradeDeficit(w, h)).toBeNull();
  });
});

describe('M12 E2 Bilanz je Insel (AK-E2-06)', () => {
  const twoIslands = (): World => {
    const s = seaWorld();
    const k2 = foundKontor2Literal(s, 2);
    putBuilding(s, 2, 'fisher', k2.x + 4, k2.y);
    putBuilding(s, 2, 'house', k2.x + 4, k2.y + 3);
    return s;
  };
  it('goodsBalance zählt nur Gebäude der gefragten Insel', () => {
    const s = twoIslands();
    expect(goodsBalance(s, 2).food.produced).toBeGreaterThan(0);
    expect(goodsBalance(s, 2).food.consumed).toBeGreaterThan(0);
    expect(goodsBalance(s, 0).food.produced).toBe(0);
    expect(goodsBalance(s, 0).food.consumed).toBe(0);
  });
  it('Nahrungsdefizit auf Insel 2 dämpft das Heimat-Haus nicht, und umgekehrt', () => {
    const s = twoIslands();
    const homeHouse = putBuilding(s, 0, 'house', 0, 0);
    setHouse(homeHouse, 1, 4);
    s.tick = 1000;
    homeHouse.house!.satisfiedSince = 1000 - 300;
    const far = Object.values(s.buildings).find((b) => b.island === 2 && b.house)!;
    setHouse(far, 1, 4);
    far.house!.satisfiedSince = 1000 - 300;
    // Heimat: nichts erzeugt -> Defizit; Insel 2: Fischer reicht nicht ganz -> auch Defizit; Dämpfung je Insel.
    expect(upgradeStatus(s, homeHouse).reasons.join()).toContain('noch nicht 600');
    putBuilding(s, 0, 'fisher', 5, 5);
    putBuilding(s, 0, 'fisher', 8, 5);
    putBuilding(s, 0, 'weaver', 11, 5);
    expect(upgradeStatus(s, homeHouse).reasons.join()).not.toContain('noch nicht');
    expect(upgradeStatus(s, far).reasons.join()).toContain('noch nicht 600');
  });
  /** Erzeuger für alle Zielgüter ausser Gewürz auf `island`: Bilanz reicht für ein volles Bürgerhaus (Δ 3 → 4). */
  const supplyAllButSpice = (s: World, island: number): void => {
    for (const defId of ['fisher', 'fisher', 'fisher', 'fisher', 'weaver', 'weaver'] as const)
      addRaw(s, defId, { island });
    for (const defId of ['distillery', 'distillery', 'glassworks', 'glassworks'] as const)
      addRaw(s, defId, { island });
  };
  /** Volles Bürgerhaus auf `island`, seit genau der einfachen Wartezeit zufrieden (D-142-Prüfung der Wartezeit). */
  const fullCitizenHouse = (s: World, island: number): Building => {
    const b =
      island === 0
        ? putBuilding(s, 0, 'house', 0, 0)
        : Object.values(s.buildings).find((x) => x.island === island && x.house)!;
    setHouse(b, 3, 15);
    s.tick = 1000;
    b.house!.satisfiedSince = s.tick - UPGRADE_WAIT;
    return b;
  };
  const waitReason = (s: World, b: Building): string | undefined =>
    upgradeStatus(s, b).reasons.find((r) => r.startsWith('Bedürfnisse noch nicht'));
  it('D-142 (a) Gewürz-Defizit der Heimat dämpft das Heimat-Haus nicht: einfache Wartezeit', () => {
    const s = twoIslands();
    const h = fullCitizenHouse(s, 0);
    supplyAllButSpice(s, 0);
    expect(goodsBalance(s, 0).spice.net).toBeLessThan(upgradeDelta(h.house!).spice ?? 0); // Defizit
    expect(waitReason(s, h)).toBeUndefined(); // einfache Wartezeit abgelaufen, kein × Faktor
    h.house!.satisfiedSince += 1;
    expect(waitReason(s, h)).toBe(`Bedürfnisse noch nicht ${UPGRADE_WAIT} Ticks erfüllt`);
  });
  it('D-142 (b) gleiche Lage auf einer Gewürzinsel: Wartezeit × Faktor', () => {
    const s = twoIslands();
    const h = fullCitizenHouse(s, 2);
    supplyAllButSpice(s, 2);
    expect(waitReason(s, h)).toBe(
      `Bedürfnisse noch nicht ${UPGRADE_WAIT * UPGRADE_DEFICIT_WAIT_FACTOR} Ticks erfüllt`,
    );
  });
  it('D-142 (c) Fremdinsel versorgt, Heimat im Defizit: Haus auf der Fremdinsel nicht gedämpft', () => {
    const s = twoIslands();
    const h = fullCitizenHouse(s, 2);
    supplyAllButSpice(s, 2);
    addRaw(s, 'spicefarm', { island: 2 });
    addRaw(s, 'spicefarm', { island: 2 });
    const homeHouse = fullCitizenHouse(s, 0); // Heimat: nichts erzeugt, also Defizit
    expect(upgradeDeficit(s, homeHouse)).not.toBeNull();
    expect(waitReason(s, h)).toBeUndefined();
  });
  it('D1 dampsOn: Gewürz dämpft nur auf Inseln mit dem Merkmal', () => {
    const s = twoIslands();
    expect(dampsOn(s, 0, 'spice')).toBe(false);
    expect(dampsOn(s, 2, 'spice')).toBe(true);
    expect(dampsOn(s, 0, 'food')).toBe(true);
  });
  it('deficitGood überspringt Güter per skip', () => {
    const h = hs(1, 4);
    expect(deficitGood({ food: 0, cloth: 0 }, h)).toBe('food');
    expect(deficitGood({ food: 0, cloth: 0 }, h, (g) => g === 'food')).toBe('cloth');
  });
});
