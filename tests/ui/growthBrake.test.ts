import { describe, expect, it } from 'vitest';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { GOODS } from '../../src/sim/defs/goods';
import { buildCoverage } from '../../src/sim/coverage';
import { houseDiagnosis } from '../../src/sim/queries';
import { serialize } from '../../src/sim/save';
import { TIERS } from '../../src/sim/defs/tiers';
import type { Building, GoodId, Tier, World } from '../../src/sim/types';
import { createWorld, home } from '../../src/sim/world';
import {
  brakeLines,
  growthBrakes,
  type BrakeCause,
  type GrowthBrake,
} from '../../src/ui/growthBrake';
import { houseFar, putBuilding } from '../sim/helpers';

const NOISE = { houses: 0, loss: 0 };

/** Haus der Stufe `tier` an (x, y); alle Güter der Stufe befriedigt, ausser den in `lacking` genannten. */
function house(
  w: World,
  x: number,
  y: number,
  tier: Tier,
  lacking: GoodId[] = [],
  island = 0,
): Building {
  const b = putBuilding(w, island, 'house', x, y);
  b.house!.tier = tier;
  for (const g of Object.keys(TIERS[tier].needs) as GoodId[]) b.house!.satisfied[g] = true;
  for (const g of lacking) b.house!.satisfied[g] = false;
  return b;
}

/** Pioniere/Siedler-Szene: Kontor-nah versorgt, Kapelle weit genug weg für ein Haus ohne Glaubensdienst. */
function scene() {
  const w = createWorld(3, { unlockAll: true });
  const k = w.buildings[home(w).kontorId]!;
  return { w, k };
}

describe('growthBrakes', () => {
  it('I17: eine Ursache je Haus, Summe gleich Häuserzahl, Versorgung vor Ware', () => {
    const { w, k } = scene();
    const x = k.x + 2;
    // zwei ausserhalb der Versorgung, eines davon mit fehlendem Gut
    const far1 = houseFar(w);
    far1.house!.tier = 2;
    const far2 = houseFar(w);
    far2.house!.tier = 2;
    far2.house!.satisfied.food = false;
    house(w, x, k.y - 2, 2, ['cloth']);
    house(w, x + 1, k.y - 2, 2, ['cloth']);
    house(w, x + 2, k.y - 2, 2); // ohne Kapelle in Reichweite
    for (const b of [far1, far2])
      for (const g of ['food', 'cloth'] as const) b.house!.satisfied[g] ??= true;
    const brake = growthBrakes(w, 0)[2];
    const homes = Object.values(w.buildings).filter((b) => b.house?.tier === 2);
    expect(brake.houses).toBe(homes.length);
    const sum = brake.causes.reduce((s, c) => s + c.n, 0) + brake.free;
    expect(sum).toBe(brake.houses);
    expect(brake.causes[0]!.cause).toEqual({ kind: 'supply' });
    expect(brake.causes[0]!.n).toBe(2);
    expect(brake.causes.map((c) => c.cause.kind)).toEqual(['supply', 'good', 'service']);
    expect(brake.causes.map((c) => c.n)).toEqual([2, 2, 1]);
    expect(brake.free).toBe(0);
  });
  it('I17/I18: stimmt je Haus mit houseDiagnosis überein; bei mehreren Waren zählt die erste', () => {
    const { w, k } = scene();
    house(w, k.x + 2, k.y - 2, 3, ['cloth', 'rum']);
    house(w, k.x + 3, k.y - 2, 3, ['rum']);
    house(w, k.x + 4, k.y - 2, 3);
    const brake = growthBrakes(w, 0)[3];
    const expected = new Map<string, number>();
    for (const b of Object.values(w.buildings)) {
      if (b.house?.tier !== 3) continue;
      const d = houseDiagnosis(w, b)[0];
      const key = d ? JSON.stringify(d) : 'free';
      expected.set(key, (expected.get(key) ?? 0) + 1);
    }
    for (const c of brake.causes) expect(expected.get(JSON.stringify(c.cause))).toBe(c.n);
    expect(brake.free).toBe(expected.get('free') ?? 0);
    const n = (g: GoodId) =>
      brake.causes.find((c) => c.cause.kind === 'good' && c.cause.good === g)?.n;
    expect(n('cloth')).toBe(1);
    expect(n('rum')).toBe(1);
  });
  it('I21: andere Inseln, andere Stufen und brennende Häuser zählen nicht', () => {
    const { w, k } = scene();
    house(w, k.x + 2, k.y - 2, 1);
    house(w, k.x + 3, k.y - 2, 2);
    const burning = house(w, k.x + 4, k.y - 2, 1);
    burning.state = 'burning';
    const out = growthBrakes(w, 0);
    expect(out[1].houses).toBe(1);
    expect(out[2].houses).toBe(1);
    expect(out[3].houses).toBe(0);
    expect(brakeLines(out[3], false)).toEqual([]);
    expect(growthBrakes(w, 1)[1].houses).toBe(0);
  });
  it('I24: Welt unverändert; Coverage darf mitgegeben werden', () => {
    const { w, k } = scene();
    house(w, k.x + 2, k.y - 2, 2, ['cloth']);
    const before = JSON.stringify(serialize(w));
    const a = growthBrakes(w, 0);
    const b = growthBrakes(w, 0, buildCoverage(w));
    expect(JSON.stringify(serialize(w))).toBe(before);
    expect(b).toEqual(a);
  });
});

const goodCause = (good: GoodId, n: number): BrakeCause => ({ cause: { kind: 'good', good }, n });
const brakeOf = (houses: number, causes: BrakeCause[], free: number): GrowthBrake => ({
  houses,
  causes,
  free,
  noise: NOISE,
});

describe('brakeLines', () => {
  const chapel = BUILDING_DEFS.chapel.name;
  it('I20: Gold-Text mit Versorgung, Ware, Dienst und ohne Mangel', () => {
    const b = brakeOf(
      14,
      [
        { cause: { kind: 'supply' }, n: 5 },
        goodCause('wood', 4),
        { cause: { kind: 'service', service: 'faith' }, n: 3 },
      ],
      2,
    );
    expect(brakeLines(b, false)).toEqual([
      `14 Häuser: 5 ausserhalb der Versorgung · 4 ohne ${GOODS.wood.name} · 3 ohne ${chapel} · 2 ohne Mangel`,
    ]);
  });
  it('I20: Einzahl und alle ohne Mangel', () => {
    expect(brakeLines(brakeOf(1, [goodCause('wood', 1)], 0), false)).toEqual([
      `1 Haus: 1 ohne ${GOODS.wood.name}`,
    ]);
    expect(brakeLines(brakeOf(14, [], 14), false)).toEqual(['Alle 14 Häuser ohne Mangel']);
    expect(brakeLines(brakeOf(1, [], 1), false)).toEqual(['Das Haus ohne Mangel']);
  });
  it('I19: höchstens drei Ursachen nach Anzahl, Gleichstand nach Rangfolge, Rest als weitere', () => {
    const b = brakeOf(
      20,
      [
        { cause: { kind: 'supply' }, n: 2 },
        goodCause('food', 5),
        goodCause('cloth', 5),
        goodCause('rum', 3),
        { cause: { kind: 'service', service: 'school' }, n: 1 },
      ],
      4,
    );
    expect(brakeLines(b, false)).toEqual([
      `20 Häuser: 5 ohne ${GOODS.food.name} · 5 ohne ${GOODS.cloth.name} · 3 ohne ${GOODS.rum.name} · 3 weitere · 4 ohne Mangel`,
    ]);
    expect(brakeLines(brakeOf(3, [goodCause('food', 3)], 0), false)[0]).not.toContain(
      'ohne Mangel',
    );
  });
  it('I22: kein Text mit Aufstieg oder bereit', () => {
    const texts = [
      brakeOf(14, [goodCause('wood', 4)], 10),
      brakeOf(4, [], 4),
      brakeOf(1, [], 1),
    ].flatMap((b) => brakeLines(b, true));
    for (const t of texts) expect(t).not.toMatch(/Aufstieg|bereit/);
  });
});
