// problems.ts — rein: Problem-Liste, Umlauf und Sprungablauf für die Tasten Q/E (I-042, REL-17); nicht im Spielstand.
import { BUILDING_DEFS } from '../sim/defs/buildings';
import { GOODS } from '../sim/defs/goods';
import { islandName } from '../sim/islands';
import { SERVICE_BUILDING } from '../sim/population';
import { houseDiagnosis, missingInputs } from '../sim/queries';
import { needsConnection } from '../sim/roads';
import type { Building, GoodId, World } from '../sim/types';
import { center, HOME } from '../sim/world';
import { HOUSE_TITLES } from './hover';
import { jumpTarget } from './islandJump';
import { diagnosisText, goodList } from './texts';

export type ProblemClass = 1 | 2 | 3 | 4;
/** Sortierschlüssel: [Klasse, Inselrang (Anker = -1, sonst Index), Abstand, Gebäude-ID]. */
export type ProblemSort = readonly [number, number, number, number];
export interface Problem {
  key: string; // `b:<id>` bzw. `g:<insel>:<gut>`
  cls: ProblemClass;
  island: number;
  id: number; // Gebäude, dessen Panel öffnet (Klasse 4: erstes Haus)
  at: { x: number; y: number }; // Archipel-Kacheln, Footprint-Mitte
  text: string; // Eintragstext ohne „Problem n von m: “
  sort: ProblemSort;
}
export interface ProblemCursor {
  key: string;
  sort: ProblemSort;
  anchor: number;
  landed: number;
}
export const NO_PROBLEM_TEXT = 'Alles versorgt, kein Problem offen';

const isBurning = (b: Building): boolean => b.outageUntil !== undefined || b.state === 'burning';
/** Ein Prädikat für Klasse 1 und `cutOffIds`. */
const isCutOff = (b: Building): boolean => needsConnection(b.defId) && !b.connected;

function compareSort(a: ProblemSort, b: ProblemSort): number {
  for (let i = 0; i < 4; i++) {
    const d = a[i]! - b[i]!;
    if (d !== 0) return d;
  }
  return 0;
}

const joinNames = (names: readonly string[]): string =>
  names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} und ${names.at(-1)}`;

function spot(world: World, b: Building): { x: number; y: number } {
  const isl = world.islands[b.island]!;
  const c = center(BUILDING_DEFS[b.defId], b.x, b.y);
  return { x: isl.ox + c.cx, y: isl.oy + c.cy };
}

/** Alle offenen Probleme, sortiert; `anchor` = Insel, deren Einträge zuerst kommen. */
export function problemList(world: World, anchor: number): Problem[] {
  const out: Problem[] = [];
  const targets = new Map<number, { x: number; y: number }>();
  const target = (island: number): { x: number; y: number } => {
    let t = targets.get(island);
    if (!t) {
      t = jumpTarget(world, island);
      targets.set(island, t);
    }
    return t;
  };
  const make = (
    key: string,
    cls: ProblemClass,
    b: Building,
    text: string,
    dist?: { x: number; y: number },
  ): Problem => {
    const at = dist ?? spot(world, b);
    const j = target(b.island);
    const rank = b.island === anchor ? -1 : b.island;
    const suffix = b.island === HOME ? '' : ` (${islandName(world, b.island)})`;
    return {
      key,
      cls,
      island: b.island,
      id: b.id,
      at,
      text: text + suffix,
      sort: [cls, rank, Math.hypot(at.x - j.x, at.y - j.y), b.id],
    };
  };

  const goodGroups = new Map<string, { good: GoodId; island: number; houses: Building[] }>();
  for (const b of Object.values(world.buildings)) {
    if (isBurning(b)) continue;
    const def = BUILDING_DEFS[b.defId];
    if (b.house) {
      const title = HOUSE_TITLES[b.house.tier];
      const diag = houseDiagnosis(world, b);
      if (diag.some((d) => d.kind === 'supply')) {
        out.push(make(`b:${b.id}`, 1, b, `${title} ${diagnosisText({ kind: 'supply' })}`));
        continue;
      }
      const services: string[] = [];
      for (const d of diag) {
        if (d.kind === 'service') services.push(BUILDING_DEFS[SERVICE_BUILDING[d.service]].name);
        else if (d.kind === 'good') {
          const gk = `${b.island}:${d.good}`;
          const g = goodGroups.get(gk) ?? { good: d.good, island: b.island, houses: [] };
          g.houses.push(b);
          goodGroups.set(gk, g);
        }
      }
      if (services.length > 0) {
        const verb = services.length > 1 ? 'fehlen' : 'fehlt';
        out.push(make(`b:${b.id}`, 3, b, `${joinNames(services)} ${verb} am ${title}`));
      }
      continue;
    }
    if (isCutOff(b)) {
      out.push(make(`b:${b.id}`, 1, b, `${def.name} nicht angebunden`));
      continue;
    }
    if (!b.connected || def.produces === undefined) continue;
    if (b.state === 'waitingInput') {
      const miss = missingInputs(world, b);
      const goods = miss.length > 0 ? miss : (def.consumes ?? []);
      const what = goods.length > 0 ? goodList(goods) : 'Rohstoff';
      out.push(make(`b:${b.id}`, 2, b, `${def.name} wartet auf ${what}`));
    } else if (b.state === 'noService') {
      const service = BUILDING_DEFS[SERVICE_BUILDING[def.requiresService!]].name;
      out.push(make(`b:${b.id}`, 2, b, `${def.name} braucht eine ${service} in Reichweite`));
    } else if (b.state === 'noForest') {
      out.push(make(`b:${b.id}`, 2, b, `${def.name}: kein freier Wald in der Nähe`));
    }
  }

  for (const g of goodGroups.values()) {
    const j = target(g.island);
    let rep = g.houses[0]!;
    let best = Infinity;
    for (const h of g.houses) {
      const p = spot(world, h);
      const d = Math.hypot(p.x - j.x, p.y - j.y);
      if (d < best || (d === best && h.id < rep.id)) {
        best = d;
        rep = h;
      }
    }
    const n = g.houses.length;
    out.push(
      make(
        `g:${g.island}:${g.good}`,
        4,
        rep,
        `${GOODS[g.good].name} fehlt in ${n} ${n === 1 ? 'Haus' : 'Häusern'}`,
      ),
    );
  }

  return out.sort((a, b) => compareSort(a.sort, b.sort));
}

/** Nächster bzw. vorheriger Eintrag; `index` ist 1-basiert. `null` = keine Probleme. */
export function problemStep(
  world: World,
  cursor: ProblemCursor | null,
  activeIsland: number,
  dir: 1 | -1,
): {
  problem: Problem;
  index: number;
  count: number;
  cursor: Omit<ProblemCursor, 'landed'>;
} | null {
  const cur = cursor !== null && cursor.landed !== activeIsland ? null : cursor;
  const anchor = cur?.anchor ?? activeIsland;
  const list = problemList(world, anchor);
  const m = list.length;
  if (m === 0) return null;
  let i: number;
  if (cur === null) {
    i = dir === 1 ? 0 : m - 1;
  } else {
    const found = list.findIndex((p) => p.key === cur.key);
    if (found >= 0) i = (found + dir + m) % m;
    else if (dir === 1) {
      const next = list.findIndex((p) => compareSort(p.sort, cur.sort) > 0);
      i = next >= 0 ? next : 0;
    } else {
      i = m - 1;
      for (let k = m - 1; k >= 0; k--) {
        if (compareSort(list[k]!.sort, cur.sort) < 0) {
          i = k;
          break;
        }
      }
    }
  }
  const problem = list[i]!;
  return {
    problem,
    index: i + 1,
    count: m,
    cursor: { key: problem.key, sort: problem.sort, anchor },
  };
}

export const problemMessage = (index: number, count: number, p: Problem): string =>
  `Problem ${index} von ${count}: ${p.text}`;

/** Gebäude, die einen Weg zum Kontor brauchen und keinen haben (ohne Brand). */
export function cutOffIds(world: World): Set<number> {
  const out = new Set<number>();
  for (const b of Object.values(world.buildings)) if (!isBurning(b) && isCutOff(b)) out.add(b.id);
  return out;
}

/** Anzahl der Gebäude, die seit `before` neu getrennt sind. */
export function newlyCut(before: Set<number>, world: World): number {
  let n = 0;
  for (const id of cutOffIds(world)) if (!before.has(id)) n++;
  return n;
}

/** Abhängigkeiten des Sprungs (B1, R453): `app.ts` verdrahtet sie, Tests übergeben protokollierende Fakes. */
export interface ProblemJumpDeps {
  world: World;
  activeIsland(): number; // liest den Stand zum Zeitpunkt des Aufrufs (nach refresh = gefolgte Kamera)
  getCursor(): ProblemCursor | null;
  setCursor(c: ProblemCursor | null): void;
  cancelPointerAction(): void;
  centerOn(x: number, y: number): void; // Archipel-Kacheln, Zoom bleibt
  openPanel(id: number): void; // setPanel inspect, KEIN Werkzeugwechsel
  refresh(): void;
  message(text: string): void; // app.ts: replaceMessage('problem', text)
}

/** Reiner Ablauf des Problem-Sprungs (AK-R17-10, E1, E3, E6). */
export function runProblemJump(deps: ProblemJumpDeps, dir: 1 | -1): void {
  deps.cancelPointerAction();
  const step = problemStep(deps.world, deps.getCursor(), deps.activeIsland(), dir);
  if (step === null) {
    deps.setCursor(null);
    deps.message(NO_PROBLEM_TEXT);
    return;
  }
  const { problem } = step;
  deps.centerOn(problem.at.x, problem.at.y);
  deps.openPanel(problem.id);
  deps.refresh();
  deps.setCursor({ ...step.cursor, landed: deps.activeIsland() });
  deps.message(problemMessage(step.index, step.count, problem));
}
