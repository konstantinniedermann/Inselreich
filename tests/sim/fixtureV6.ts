// Rezepte für die v6-Fixtures save-v6.json und save-v6-locks.json (M12 E0 Schritt 0, Anhang 01 C/E).
// Beide Stände entstehen ausschliesslich über Sim-Aktionen auf dem unveränderten v6-Code.
// Abweichung von Anhang 01 C (P-14, angenommen R229): keine Ausgabesperre, Glas 0, `upkeepCarry` 0.
import { placeBuilding, placeRoad } from '../../src/sim/build';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { GOOD_IDS } from '../../src/sim/defs/goods';
import { canPlace } from '../../src/sim/placement';
import { reachableRoads } from '../../src/sim/roads';
import { setGoodLock, setUpgradeStop } from '../../src/sim/tax';
import { buy } from '../../src/sim/trade';
import { upgradeBuilding } from '../../src/sim/upgrade';
import type { Layout, Trajectory } from './controller';
import { runColony, startColony, type ColonyOptions } from './controller';
import type { Result, World } from '../../src/sim/types';
import { adjacentOf, buildingsOfType, createWorld, idx } from '../../src/sim/world';

export const NORMAL: ColonyOptions = { fireStation: true };

function must(r: Result, what: string): void {
  if (!r.ok) throw new Error(`T00: ${what} fehlgeschlagen: ${r.reason}`);
}

/** Lauf „normal" (Seed 3) bis zum ersten Schritt mit `tick >= tick`. */
export function normalRunTo(
  tick: number,
  opts: ColonyOptions = NORMAL,
): { w: World; layout: Layout; t: Trajectory } {
  const w = createWorld(3, { crisisLevel: 'normal' });
  const { layout, t } = startColony(w);
  runColony(w, layout, t, opts, (x) => x.tick >= tick);
  if (w.tick !== tick) throw new Error(`T00: Tick ${tick} verfehlt (${w.tick})`);
  return { w, layout, t };
}

/** Stellen in Zeilenfolge (y, dann x). */
function rowOrder(w: World): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  for (let y = 0; y < w.height; y++) for (let x = 0; x < w.width; x++) out.push({ x, y });
  return out;
}

function topUpBuildCost(w: World): void {
  const cost = BUILDING_DEFS.townhall.cost;
  for (const g of ['wood', 'tools', 'stone'] as const) {
    const missing = cost[g] - w.stock[g];
    if (missing > 0) must(buy(w, g, missing), `buy ${g} ${missing}`);
  }
}

function placeConnectedTownhall(w: World): void {
  const def = BUILDING_DEFS.townhall;
  const roads = reachableRoads(w);
  for (const { x, y } of rowOrder(w)) {
    if (!canPlace(w, 'townhall', x, y).ok) continue;
    if (!adjacentOf(w, x, y, def.w, def.h).some((p) => roads.has(idx(w, p.x, p.y)))) continue;
    must(placeBuilding(w, 'townhall', x, y), 'Amtsstube bauen');
    return;
  }
  throw new Error('T00: keine angebundene Stelle für die Amtsstube');
}

/** Stand save-v6.json: Lauf „normal" bei Tick 3000 (Brand und Auftrag aktiv), dann Aktionen ohne `step`. */
export function fixtureV6Run(): { w: World; layout: Layout; t: Trajectory } {
  const run = normalRunTo(3000);
  const { w } = run;
  if (w.crisis?.outcome !== 'burning' || w.order === null)
    throw new Error('T00: Lauf ohne Brand/Auftrag');
  must(buy(w, 'stone', 10), 'buy stone');
  must(buy(w, 'tools', 5), 'buy tools');
  placeConnectedTownhall(w);
  must(setUpgradeStop(w, 1, true), 'setUpgradeStop');
  const lumber = buildingsOfType(w, 'lumberjack')[0];
  if (!lumber) throw new Error('T00: kein Holzfäller');
  must(upgradeBuilding(w, lumber.id), 'upgradeBuilding');
  for (const g of GOOD_IDS) if (g !== 'glass' && w.stock[g] === 0) must(buy(w, g, 3), `buy ${g}`);
  return run;
}

/** Stand save-v6-locks.json (R229): unlockAll, Weg + Amtsstube, Güter-Sperre, Aufstiegsstopp, Glas; ohne `step`. */
export function locksV6Run(): World {
  const w = createWorld(3, { unlockAll: true });
  topUpBuildCost(w);
  const kontor = w.buildings[w.kontorId]!;
  const kd = BUILDING_DEFS[kontor.defId];
  const roadSpot = adjacentOf(w, kontor.x, kontor.y, kd.w, kd.h).sort(
    (a, b) => a.y - b.y || a.x - b.x,
  );
  let road: { x: number; y: number } | null = null;
  for (const p of roadSpot)
    if (placeRoad(w, p.x, p.y).ok) {
      road = p;
      break;
    }
  if (!road) throw new Error('T00: kein Weg neben dem Kontor');
  const td = BUILDING_DEFS.townhall;
  let built = false;
  for (const { x, y } of rowOrder(w)) {
    if (!adjacentOf(w, x, y, td.w, td.h).some((p) => p.x === road!.x && p.y === road!.y)) continue;
    if (!canPlace(w, 'townhall', x, y).ok) continue;
    if (placeBuilding(w, 'townhall', x, y).ok) {
      built = true;
      break;
    }
  }
  if (!built) throw new Error('T00: keine Stelle für die Amtsstube');
  must(setGoodLock(w, 1, 'food', true), 'setGoodLock');
  must(setUpgradeStop(w, 1, true), 'setUpgradeStop');
  must(buy(w, 'glass', 3), 'buy glass');
  return w;
}

/** Zufallsfolge je neuer Periode: Krise `C<k>:<kind>:<target>:<outcome>:<good>@<tick>`, Auftrag `O<k>:<good>:<amount>:<reward>@<tick>`. */
export function randomSequence(): string[] {
  const w = createWorld(3, { crisisLevel: 'normal' });
  const { layout, t } = startColony(w);
  const out: string[] = [];
  let lastC = -1;
  let lastO = -1;
  const see = (x: World): boolean => {
    const c = x.crisis;
    if (c !== null && c.period !== lastC) {
      lastC = c.period;
      out.push(
        `C${c.period}:${c.kind}:${c.target ?? '-'}:${c.outcome ?? '-'}:${c.good ?? '-'}@${x.tick}`,
      );
    }
    const o = x.order;
    if (o !== null && o.period !== lastO) {
      lastO = o.period;
      out.push(`O${o.period}:${o.good}:${o.amount}:${o.reward}@${x.tick}`);
    }
    return false;
  };
  runColony(w, layout, t, NORMAL, see);
  return out;
}
