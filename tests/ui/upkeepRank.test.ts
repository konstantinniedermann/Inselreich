import { describe, expect, it } from 'vitest';
import { EDICTS } from '../../src/sim/defs/edicts';
import { EFF_WINDOW } from '../../src/sim/defs/timing';
import { SHIP } from '../../src/sim/defs/sea';
import { buildingUpkeep } from '../../src/sim/levels';
import { tickEconomy, totalUpkeep } from '../../src/sim/economy';
import { createWorld } from '../../src/sim/world';
import type { BuildingDefId, World } from '../../src/sim/types';
import { placeTownhall, putBuilding, twoIslandWorld } from '../sim/helpers';
import { UPKEEP_LIST_MAX, upkeepRanking, upkeepSummary } from '../../src/ui/upkeepRank';

let slot = 0;
/** Setzt einen Betrieb auf eine freie Kachel (Reihen mit Abstand); `util` in Promille. */
function put(w: World, island: number, defId: BuildingDefId, util?: number) {
  const n = slot++;
  const b = putBuilding(w, island, defId, 2 + (n % 8) * 3, 2 + Math.floor(n / 8) * 3);
  if (util !== undefined) b.eff = util * EFF_WINDOW;
  return b;
}
const ship = (w: World): void => {
  w.ships.push({
    id: w.nextShipId++,
    port: 0,
    to: null,
    left: 0,
    cargo: {},
    route: null,
    homing: false,
  });
};

describe('Betriebsrangliste (I-062, AK-5 bis AK-7)', () => {
  it('AK-5 sortiert nach Unterhalt absteigend', () => {
    const w = twoIslandWorld();
    const a = put(w, 0, 'fisher'); // 5
    const b = put(w, 0, 'toolmaker'); // 25
    const c = put(w, 0, 'weaver'); // 15
    expect(upkeepRanking(w).map((r) => r.id)).toEqual([b.id, c.id, a.id]);
  });

  it('AK-5 Gleichstand: Auslastung aufsteigend, dann ID', () => {
    const w = twoIslandWorld();
    const full = put(w, 0, 'fisher', 1000);
    const low = put(w, 1, 'fisher', 200);
    const lowSecond = put(w, 0, 'fisher', 200);
    expect(upkeepRanking(w).map((r) => r.id)).toEqual([low.id, lowSecond.id, full.id]);
  });

  it('AK-6 Stillgelegte mit tatsächlichem Wert und Marke, Platz nach diesem Wert', () => {
    const w = twoIslandWorld();
    const paused = put(w, 0, 'toolmaker'); // 25 → 13
    paused.paused = true;
    const other = put(w, 0, 'weaver'); // 15
    const rows = upkeepRanking(w);
    expect(rows.map((r) => r.id)).toEqual([other.id, paused.id]);
    expect(rows[1]).toMatchObject({ upkeep: buildingUpkeep(paused), paused: true });
    expect(rows[1]!.upkeep).toBeGreaterThan(0);
    expect(rows[0]!.paused).toBe(false);
  });

  it('AK-6 Häuser fehlen, Eintrag trägt Insel und Typ', () => {
    const w = twoIslandWorld();
    put(w, 0, 'house');
    const f = put(w, 1, 'fisher');
    expect(upkeepRanking(w)).toEqual([
      { id: f.id, island: 1, defId: 'fisher', upkeep: 5, util: 1000, paused: false },
    ]);
  });

  it('AK-9 ohne Betriebe: leere Liste, keine Schiffe, kein Edikt', () => {
    const w = createWorld(3);
    expect(upkeepRanking(w)).toEqual([]);
    const s = upkeepSummary(w);
    expect(s).toMatchObject({ shown: [], more: 0, ships: null, edict: 0, total: 0 });
  });

  it('AK-9 mehr als 20 Betriebe: 20 sichtbar, Rest gezählt mit Summe', () => {
    const w = twoIslandWorld();
    for (let i = 0; i < 25; i++) put(w, i % 2, 'fisher');
    tickEconomy(w);
    const s = upkeepSummary(w);
    expect(UPKEEP_LIST_MAX).toBe(20);
    expect(s.shown).toHaveLength(20);
    expect(s.more).toBe(5);
    expect(s.moreUpkeep).toBe(25);
  });

  const sumOf = (s: ReturnType<typeof upkeepSummary>): number =>
    s.shown.reduce((n, r) => n + r.upkeep, 0) + s.moreUpkeep + (s.ships?.upkeep ?? 0) + s.edict;

  it('AK-7 Summenabgleich ohne Edikt: Zeilen + Schiffe == totalUpkeep == stats.upkeep', () => {
    const w = twoIslandWorld();
    put(w, 0, 'house');
    put(w, 0, 'toolmaker').paused = true;
    put(w, 0, 'weaver');
    put(w, 1, 'fisher');
    ship(w);
    ship(w);
    tickEconomy(w);
    const s = upkeepSummary(w);
    expect(s.ships).toEqual({ count: 2, upkeep: 2 * SHIP.upkeep });
    expect(s.edict).toBe(0);
    expect(sumOf(s)).toBe(totalUpkeep(w));
    expect(sumOf(s)).toBe(w.stats.upkeep);
    expect(s.total).toBe(w.stats.upkeep);
  });

  it('AK-7 Summenabgleich mit Edikt Sparen: Zeilen + Edikt == stats.upkeep', () => {
    const w = createWorld(3, { unlockAll: true });
    placeTownhall(w);
    w.edict = 'saving';
    put(w, 0, 'toolmaker');
    put(w, 0, 'weaver').paused = true;
    put(w, 0, 'fisher');
    ship(w);
    tickEconomy(w);
    expect(EDICTS.saving.upkeepPct).toBeLessThan(100);
    const s = upkeepSummary(w);
    expect(s.edict).toBeLessThan(0);
    expect(sumOf(s)).toBe(w.stats.upkeep);
    expect(s.total).toBe(totalUpkeep(w));
  });
});
