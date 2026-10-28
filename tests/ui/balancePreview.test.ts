import { describe, expect, it } from 'vitest';
import { totalUpkeep } from '../../src/sim/economy';
import { setEdict } from '../../src/sim/edicts';
import { placeBuilding } from '../../src/sim/build';
import { canPlace } from '../../src/sim/placement';
import { upgradeBuilding } from '../../src/sim/upgrade';
import { newHouseState, totalTaxes, houseCap } from '../../src/sim/population';
import { TIERS } from '../../src/sim/defs/tiers';
import { home } from '../../src/sim/world';
import { step } from '../../src/sim/tick';
import type { BuildingDefId, GoodId, World } from '../../src/sim/types';
import { balanceText } from '../../src/ui/hud';
import { balanceAfterBuild, balanceAfterUpgrade, balanceLine } from '../../src/ui/balancePreview';
import { buildingUpkeep, upkeepOf } from '../../src/sim/levels';
import { LEVELS } from '../../src/sim/defs/levels';
import { PAUSED_UPKEEP_PCT } from '../../src/sim/defs/buildings';
import { UPKEEP_INTERVAL } from '../../src/sim/economy';
import { perMinute } from '../../src/ui/time';
import { upgradeGain } from '../../src/ui/panelView';
import { meetLevel, placeTownhall, putBuilding, twoIslandWorld } from '../sim/helpers';
import { createWorld } from '../../src/sim/world';

const bal = (w: World): number => totalTaxes(w) - totalUpkeep(w);

/** Setzt `defId` per echtem `placeBuilding` auf die erste freie Kachel der Insel (Geld und Lager im Überfluss). */
function realPlace(w: World, defId: BuildingDefId, island = 0): number {
  w.money = 1_000_000;
  for (const g of Object.keys(w.islands[island]!.stock) as GoodId[])
    w.islands[island]!.stock[g] = 100;
  home(w).stock.wood = 100;
  home(w).stock.tools = 100;
  const isl = w.islands[island]!;
  for (let y = 0; y < isl.height; y++)
    for (let x = 0; x < isl.width; x++) {
      if (!canPlace(w, defId, x, y, island).ok) continue;
      const r = placeBuilding(w, defId, x, y, island);
      if (r.ok && r.id !== undefined) return r.id;
    }
  throw new Error(`kein Platz für ${defId}`);
}

/** Edikt Sparen aktiv: Amtsstube, Ziel erreicht, Sperrzeit abgelaufen. */
function saving(w: World): void {
  w.won = true;
  placeTownhall(w);
  w.tick = 1000;
  w.money = 10_000;
  expect(setEdict(w, 'saving').ok).toBe(true);
}

const DEFS: BuildingDefId[] = ['fisher', 'lumberjack', 'chapel', 'market', 'house'];

describe('balancePreview (I-078, AK-10, AK-14)', () => {
  it('AK-10 Unterhalt-«danach» = Bilanz nach echtem placeBuilding, mit/ohne Edikt Sparen, mit Schiffen', () => {
    for (const edict of [false, true]) {
      for (const ships of [0, 2]) {
        for (const defId of DEFS) {
          const w = createWorld(3, { unlockAll: true });
          for (let i = 0; i < ships; i++)
            w.ships.push({
              id: w.nextShipId++,
              port: 0,
              to: null,
              left: 0,
              cargo: {},
              route: null,
              homing: false,
            });
          if (edict) saving(w);
          const w2 = structuredClone(w);
          const p = balanceAfterBuild(w, defId);
          realPlace(w2, defId);
          const upkeepPreview = totalUpkeep(w2);
          // Steuer des neuen Hauses (1 Einwohner, unversorgt) fliesst in `after` ein: Vergleich über Unterhalt + Steuer
          expect(p.after, `${defId} edict=${edict} ships=${ships}`).toBe(
            totalTaxes(w2) - upkeepPreview,
          );
          expect(p.before).toBe(bal(w));
        }
      }
    }
  });

  it('AK-14 die Probe verändert die Welt nicht (auch beim Wohnhaus und beim Ausbau)', () => {
    const w = twoIslandWorld();
    const f = putBuilding(w, 0, 'lumberjack', 3, 3);
    const before = structuredClone(w);
    balanceAfterBuild(w, 'house', 1);
    balanceAfterBuild(w, 'fisher', 1);
    balanceAfterUpgrade(w, f);
    expect(w).toEqual(before);
  });

  it('AK-14 Probe-Gebäude hat gültige Insel und Position (unbekannte Insel fällt auf die Heimat)', () => {
    const w = createWorld(3, { unlockAll: true });
    expect(() => balanceAfterBuild(w, 'fisher', 7)).not.toThrow();
    expect(balanceAfterBuild(w, 'fisher', 7)).toEqual(balanceAfterBuild(w, 'fisher', 0));
  });

  it('AK-11 «heute» = Zahl des Bilanz-Chips nach einem Tick', () => {
    const w = createWorld(3, { unlockAll: true });
    realPlace(w, 'fisher');
    step(w);
    const line = balanceLine(balanceAfterBuild(w, 'chapel'));
    const chip = balanceText(w.stats)
      .text.replace(/^Bilanz /, '')
      .replace(/ \/ min$/, '');
    expect(line.startsWith(`Bilanz danach: ${chip} → `)).toBe(true);
  });

  it('AK-13 Randfälle: leere Welt, negative Bilanz, Unterhalt 0', () => {
    const w = createWorld(3, { unlockAll: true });
    for (const id of Object.keys(w.buildings)) delete w.buildings[Number(id)];
    expect(balanceAfterBuild(w, 'fisher').before).toBe(0);
    expect(balanceLine(balanceAfterBuild(w, 'fisher'))).toMatch(
      /^Bilanz danach: ±0 → −[\d.,]+ \/ min$/,
    );
    const w2 = createWorld(3, { unlockAll: true });
    const road = balanceAfterBuild(w2, 'house');
    expect(balanceLine({ before: 0, after: 0 })).toBe('Bilanz danach: gleich (±0 / min)');
    expect(road.afterMax).toBeDefined();
  });

  it('AK-12 Wohnhaus: Obergrenze ≥ tatsächliche Steueränderung, bei leerer Welt gleich; Steuerstufe und Edikt', () => {
    for (const level of ['low', 'normal', 'high'] as const) {
      for (const edict of [false, true]) {
        const w = createWorld(3, { unlockAll: true });
        if (!edict) placeTownhall(w);
        const tier = newHouseState(w).tier;
        w.taxLevels = { ...w.taxLevels, [tier]: level };
        if (edict) saving(w);
        const p = balanceAfterBuild(w, 'house');
        const id = realPlace(w, 'house');
        const h = w.buildings[id]!.house!;
        const t = TIERS[h.tier];
        h.inhabitants = houseCap(w, h);
        h.supplied = true;
        h.satisfied = Object.fromEntries((Object.keys(t.needs) as GoodId[]).map((g) => [g, true]));
        h.services = Object.fromEntries(t.services.map((s) => [s, true]));
        expect(bal(w), `${level} ${edict}`).toBeLessThanOrEqual(p.afterMax!);
        expect(bal(w)).toBe(p.afterMax);
      }
    }
  });

  it('AK-14 Rot-Test Obergrenze auf Mehrinsel-Welt: Probe auf Insel 1 gleich der echten Zahl', () => {
    const w = twoIslandWorld();
    const p = balanceAfterBuild(w, 'house', 1);
    const id = realPlace(w, 'house', 1);
    const h = w.buildings[id]!.house!;
    const t = TIERS[h.tier];
    h.inhabitants = houseCap(w, h);
    h.supplied = true;
    h.satisfied = Object.fromEntries((Object.keys(t.needs) as GoodId[]).map((g) => [g, true]));
    h.services = Object.fromEntries(t.services.map((s) => [s, true]));
    expect(bal(w)).toBe(p.afterMax);
    expect(p.afterMax!).toBeGreaterThan(p.before);
  });

  it('Ausbau: Vorschau = Bilanz nach echtem upgradeBuilding (Stufe 1→2, 2→3, mit Edikt Sparen)', () => {
    for (const edict of [false, true]) {
      const w = twoIslandWorld();
      w.won = true;
      const b = putBuilding(w, 0, 'lumberjack', 3, 3);
      if (edict) saving(w);
      for (const step of [1, 2]) {
        w.money = 1_000_000;
        for (const g of Object.keys(home(w).stock) as GoodId[]) home(w).stock[g] = 100;
        const bb = w.buildings[b.id]!;
        bb.level = (step + 1) as 2 | 3;
        meetLevel(w, bb); // Fachkräfte und Standort der Zielstufe
        if (step === 1) delete bb.level;
        else bb.level = 2;
        const p = balanceAfterUpgrade(w, w.buildings[b.id]!);
        expect(p.before).toBe(bal(w));
        const r = upgradeBuilding(w, b.id);
        expect(r.ok, `Schritt ${step} ${JSON.stringify(r)}`).toBe(true);
        expect(p.after, `edikt=${edict} Schritt ${step}`).toBe(bal(w));
      }
    }
  });

  it('gesperrter Ausbau (Laufstufe < gebaute Stufe): Bilanz-Delta = Unterhaltszeile (nominal, vom Ist)', () => {
    for (const edict of [false, true]) {
      const w = twoIslandWorld();
      w.won = true;
      const b = putBuilding(w, 0, 'lumberjack', 3, 3);
      if (edict) saving(w);
      const bb = w.buildings[b.id]!;
      bb.level = 2; // ohne meetLevel: Fachkräfte/Standort fehlen, Stufe 3 wäre gedrosselt
      const nominal = LEVELS.lumberjack![1]!.upkeep;
      const actual = buildingUpkeep(w, bb);
      expect(actual, 'Ausgangslage gedrosselt').toBeLessThan(LEVELS.lumberjack![0]!.upkeep);
      const p = balanceAfterUpgrade(w, bb);
      const row = upgradeGain(w, bb, 3).find((r) => r.key === 'upkeep')!;
      // Karte zeigt Ist -> nominal; die Bilanz verschiebt sich um genau diese Differenz
      expect(row.before).toBe(perMinute(actual, UPKEEP_INTERVAL));
      expect(row.after).toBe(perMinute(nominal, UPKEEP_INTERVAL));
      if (!edict) expect(p.before - p.after).toBe(nominal - actual);
      else expect(p.before - p.after).toBeGreaterThan(0);
      expect(row.after).toBeGreaterThan(row.before);
    }
  });

  it('stillgelegter Betrieb: Bilanz danach setzt den halben Unterhalt der Zielstufe an (Pause bleibt, nur Drosselung ist nominal)', () => {
    const w = twoIslandWorld();
    w.won = true;
    const b = putBuilding(w, 0, 'fisher', 3, 3);
    b.paused = true;
    const half = (u: number): number => Math.ceil((u * PAUSED_UPKEEP_PCT) / 100);
    const p = balanceAfterUpgrade(w, b);
    const [u1, u2] = [upkeepOf(b), LEVELS.fisher![0]!.upkeep]; // Stufe 1 -> 2
    expect(p.before - p.after).toBe(half(u2) - half(u1));
  });

  it('stillgelegter Betrieb: Unterhaltszeile der Karte zeigt half(u1) -> half(u2), passend zur Bilanz', () => {
    const w = twoIslandWorld();
    w.won = true;
    const b = putBuilding(w, 0, 'fisher', 3, 3);
    b.paused = true;
    const half = (u: number): number => Math.ceil((u * PAUSED_UPKEEP_PCT) / 100);
    const [u1, u2] = [upkeepOf(b), LEVELS.fisher![0]!.upkeep];
    const row = upgradeGain(w, b, 2).find((r) => r.key === 'upkeep')!;
    expect(row.before).toBe(perMinute(half(u1), UPKEEP_INTERVAL));
    expect(row.after).toBe(perMinute(half(u2), UPKEEP_INTERVAL));
  });

  it('kein Neurechnen je Frame: balanceAfterBuild rechnet nur auf Aufruf (reine Funktion, gleiche Zahl)', () => {
    const w = createWorld(3, { unlockAll: true });
    expect(balanceAfterBuild(w, 'fisher')).toEqual(balanceAfterBuild(w, 'fisher'));
  });
});
