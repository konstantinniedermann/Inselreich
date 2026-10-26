import { BUILDING_DEFS } from './defs/buildings';
import { LEVELS } from './defs/levels';
import { levelChecks } from './levelChecks';
import { pay, takeStock } from './economy';
import { fail, ok, type Building, type Cost, type Result, type World } from './types';
import { islandOf } from './world';

/** Ausbau eines Betriebs um eine Stufe (Spec 3.6). Wirft nie; bei fail bleibt die Welt unverändert. */
export function upgradeBuilding(world: World, id: number): Result {
  const b = world.buildings[id];
  if (b === undefined) return fail('Gebäude nicht gefunden');
  const levels = LEVELS[b.defId];
  if (levels === undefined) return fail('Kann nicht ausgebaut werden');
  const level = b.level ?? 1;
  if (level >= 1 + levels.length) return fail('Höchste Stufe erreicht');
  // Ab Schritt 4 eine Prüfreihenfolge: die erste ✗-Zeile der Checkliste ist der Grund (Spec R7, N3).
  const first = levelChecks(world, b, level + 1).find((c) => !c.ok);
  if (first !== undefined) return fail(first.text);
  const next = levels[level - 1]!; // Stufe 1 → Index 0 (Stufe 2)
  const isl = islandOf(world, b);
  pay(world, isl, next.cost);
  if (next.extra !== undefined) takeStock(isl, next.extra.good, next.extra.amount);
  b.level = level === 1 ? 2 : 3; // progress, eff, state bleiben (Spec 3.6)
  return ok;
}

/** Bisher bezahlte Kosten: Neubau plus Stufenkosten bis zur aktuellen Stufe (ohne fachliche Ware). */
export function paidCost(b: Building): Cost {
  const total: Cost = { ...BUILDING_DEFS[b.defId].cost };
  const levels = LEVELS[b.defId] ?? [];
  for (let i = 0; i < (b.level ?? 1) - 1; i++) {
    const c = levels[i]!.cost;
    total.money += c.money;
    total.wood += c.wood;
    total.tools += c.tools;
    total.stone += c.stone;
  }
  return total;
}
