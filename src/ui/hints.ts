import type { Tool } from '../render/renderer';
import { BUILDING_DEFS, ROAD_COST, ROAD_COST_OBJ } from '../sim/defs/buildings';
import { GOODS, STORAGE_CAP } from '../sim/defs/goods';
import { TAX_LEVELS, TIERS } from '../sim/defs/tiers';
import { checkAfford, refundCost } from '../sim/economy';
import { canPlace, canPlaceRoad } from '../sim/placement';
import { effectiveRefund, houseDiagnosis } from '../sim/queries';
import { reachableRoads } from '../sim/roads';
import type { Building, BuildingDefId, Cost, GoodId, World } from '../sim/types';
import { adjacentOf, idx, tileAt } from '../sim/world';
import { costLine } from './dom';
import { hotkeyLabel } from './hotkeys';
import { diagnosisText, refundText, stateText } from './texts';
import { formatGameTime } from './time';

export interface ReasonCtx {
  defId?: BuildingDefId;
  cost?: Cost;
  good?: GoodId;
  amount?: number;
}

/** `show` liefert den Anzeigetext; `null` = Grund unverändert anzeigen. */
export interface ReasonRow {
  source: string;
  pattern: RegExp;
  show(m: RegExpExecArray, world: World, ctx: ReasonCtx): string | null;
}

export type Hint = { tone: 'ok' | 'bad' | 'info'; text: string };

const same = (): null => null;
const COST_GOODS = ['wood', 'tools', 'stone'] as const;
const costOf = (c: ReasonCtx): Cost | null =>
  c.cost ?? (c.defId ? BUILDING_DEFS[c.defId].cost : null);

export const REASON_TABLE: readonly ReasonRow[] = [
  {
    source: 'placement',
    pattern: /^Ausserhalb der Karte$/,
    show: () => 'Reicht über den Kartenrand hinaus',
  },
  {
    source: 'placement',
    pattern: /^Kein Bauland$/,
    show: () => 'Kein Bauland — nur auf Land bauen',
  },
  {
    source: 'placement',
    pattern: /^Bereits bebaut$/,
    show: () => 'Hier steht schon ein Gebäude oder Weg',
  },
  {
    source: 'placement',
    pattern: /^Braucht (Wasser|Gebirge) angrenzend$/,
    show: (m, _w, c) =>
      c.defId ? `${BUILDING_DEFS[c.defId].name} muss direkt am ${m[1]} stehen` : null,
  },
  {
    source: 'placement',
    pattern: /^Zu wenig (Wald|Weide) in der Nähe$/,
    show: (m, _w, c) => {
      if (!c.defId) return null;
      const terrain = m[1] === 'Wald' ? 'forest' : 'grass';
      const rule = BUILDING_DEFS[c.defId].site.find(
        (r) => r.kind === 'radius' && r.terrain === terrain,
      );
      return rule?.kind === 'radius'
        ? `Zu wenig ${m[1]} in der Nähe: mindestens ${rule.min} Felder im Umkreis ${rule.radius}`
        : null;
    },
  },
  {
    source: 'placement',
    pattern: /^Ausserhalb der Versorgung$/,
    show: () => 'Zu weit vom Kontor oder Marktplatz — Wohnhäuser brauchen Versorgung im Umkreis',
  },
  { source: 'build', pattern: /^Kein Weg$/, show: () => 'Hier liegt kein Weg' },
  { source: 'build', pattern: /^Gebäude nicht gefunden$/, show: same },
  { source: 'build', pattern: /^Kontor kann nicht abgerissen werden$/, show: same },
  {
    source: 'economy',
    pattern: /^Kein Geld$/,
    show: () => 'Kein Geld — die Kasse ist im Minus; verkaufe Waren am Kontor',
  },
  {
    source: 'economy',
    pattern: /^Zu wenig Geld$/,
    show: (_m, w, c) => {
      const cost = costOf(c);
      return cost ? `Zu wenig Geld: ${cost.money} nötig, ${w.money} vorhanden` : null;
    },
  },
  {
    source: 'economy',
    pattern: /^Zu wenig (\S+)$/,
    show: (m, w, c) => {
      const cost = costOf(c);
      const g = COST_GOODS.find((x) => GOODS[x].name === m[1]);
      return cost && g
        ? `Zu wenig ${m[1]}: ${cost[g]} nötig, ${w.stock[g]} vorhanden · kaufbar am Kontor`
        : null;
    },
  },
  { source: 'tax', pattern: /^Ungültige Stufe$/, show: same },
  { source: 'tax', pattern: /^Stufe bereits aktiv$/, show: () => 'Diese Steuerstufe gilt bereits' },
  {
    source: 'tax',
    pattern: /^Sperrzeit$/,
    show: (_m, w) => `Steuer erst in ${formatGameTime(w.taxLockedUntil - w.tick)} wieder änderbar`,
  },
  { source: 'orders', pattern: /^Kein Auftrag$/, show: () => 'Gerade gibt es keinen Auftrag' },
  {
    source: 'orders',
    pattern: /^Nicht genug Ware$/,
    show: (_m, w, c) =>
      c.good && c.amount !== undefined
        ? `Nicht genug ${GOODS[c.good].name}: ${c.amount} nötig, ${w.stock[c.good]} vorhanden`
        : null,
  },
  { source: 'trade', pattern: /^Ungültige Menge$/, show: same },
  {
    source: 'trade',
    pattern: /^Lager voll$/,
    show: (_m, _w, c) =>
      c.good ? `Lager voll: höchstens ${STORAGE_CAP} ${GOODS[c.good].name}` : null,
  },
  { source: 'upgradeStatus', pattern: /^Kein Wohnhaus$/, show: same },
  { source: 'upgradeStatus', pattern: /^Höchste Stufe erreicht$/, show: same },
  { source: 'upgradeStatus', pattern: /^Haus nicht voll belegt$/, show: same },
  {
    source: 'upgradeStatus',
    pattern: /^Steuer zu hoch$/,
    show: () => `Steuer ‚${TAX_LEVELS.high.name}' verhindert den Aufstieg`,
  },
  {
    source: 'upgradeStatus',
    pattern: /^Bedürfnisse noch nicht (\d+) Ticks erfüllt$/,
    show: (m) => `Bedürfnisse noch nicht ${formatGameTime(Number(m[1]))} erfüllt`,
  },
  { source: 'upgradeStatus', pattern: /^.+ fehlt in Reichweite$/, show: same },
  { source: 'upgradeStatus', pattern: /^Kein .+ im Lager$/, show: same },
  {
    source: 'save',
    pattern: /^(Ungültiges Format|Unbekannte Version|Beschädigter Spielstand)$/,
    show: same,
  },
];

export function friendlyReason(world: World, reason: string, ctx: ReasonCtx = {}): string {
  for (const row of REASON_TABLE) {
    const m = row.pattern.exec(reason);
    if (m) return row.show(m, world, ctx) ?? reason;
  }
  return reason;
}

function touchesReachable(
  world: World,
  x: number,
  y: number,
  w: number,
  h: number,
  roads: Set<number>,
): boolean {
  return adjacentOf(world, x, y, w, h).some((p) => roads.has(idx(world, p.x, p.y)));
}

export function placementHint(world: World, tool: Tool, x: number, y: number): Hint | null {
  const road = hotkeyLabel({ kind: 'road' });
  if (tool.kind === 'build') {
    const def = BUILDING_DEFS[tool.defId];
    const r = canPlace(world, tool.defId, x, y);
    const a = r.ok ? checkAfford(world, def.cost) : r;
    if (!a.ok) return { tone: 'bad', text: friendlyReason(world, a.reason, { defId: tool.defId }) };
    if (tool.defId === 'house') return { tone: 'ok', text: 'Baubar · im Versorgungsgebiet' };
    return touchesReachable(world, x, y, def.w, def.h, reachableRoads(world))
      ? { tone: 'ok', text: 'Baubar · wird an den Kontor angebunden' }
      : { tone: 'ok', text: `Baubar · danach mit Weg (${road}) zum Kontor verbinden` };
  }
  if (tool.kind === 'road') {
    const r = canPlaceRoad(world, x, y);
    const a = r.ok ? checkAfford(world, ROAD_COST_OBJ) : r;
    if (!a.ok)
      return { tone: 'bad', text: friendlyReason(world, a.reason, { cost: ROAD_COST_OBJ }) };
    const roads = reachableRoads(world);
    const linked = adjacentOf(world, x, y, 1, 1).some(
      (p) =>
        roads.has(idx(world, p.x, p.y)) || tileAt(world, p.x, p.y)?.buildingId === world.kontorId,
    );
    return {
      tone: 'ok',
      text: `Weg · ${ROAD_COST} Geld · ${linked ? 'verbunden mit dem Kontor' : 'noch nicht mit dem Kontor verbunden'}`,
    };
  }
  const tile = tileAt(world, x, y);
  const b = tile?.buildingId != null ? world.buildings[tile.buildingId] : undefined;
  if (tool.kind === 'demolish') {
    if (b?.id === world.kontorId)
      return { tone: 'info', text: 'Kontor kann nicht abgerissen werden' };
    if (b) {
      const cost = BUILDING_DEFS[b.defId].cost;
      return {
        tone: 'bad',
        text: `Abreissen: ${BUILDING_DEFS[b.defId].name} · zurück ${refundText(refundCost(cost), effectiveRefund(world, cost))}`,
      };
    }
    if (tile?.road)
      return { tone: 'bad', text: `Weg abreissen · zurück ${costLine(refundCost(ROAD_COST_OBJ))}` };
    return null;
  }
  if (!b) return null;
  if (b.id === world.kontorId) return { tone: 'info', text: 'Kontor · klicken zum Handeln' };
  const name = BUILDING_DEFS[b.defId].name;
  if (b.house) {
    const d = houseDiagnosis(world, b)[0];
    return {
      tone: 'info',
      text: `${name} — ${TIERS[b.house.tier].name} · ${d ? diagnosisText(d) : 'versorgt'}`,
    };
  }
  return { tone: 'info', text: `${name} · ${stateText(b, world.tick)}` };
}

export function hintPosition(
  px: number,
  py: number,
  w: number,
  h: number,
  vw: number,
  vh: number,
): { left: number; top: number } {
  const OFFSET = 16;
  const MARGIN = 4;
  return {
    left: Math.max(MARGIN, Math.min(px + OFFSET, vw - w - MARGIN)),
    top: Math.max(MARGIN, Math.min(py + OFFSET, vh - h - MARGIN)),
  };
}

export function unconnectedIds(world: World): Set<number> {
  const out = new Set<number>();
  for (const b of Object.values(world.buildings)) {
    if (!b.connected && b.defId !== 'house' && b.id !== world.kontorId) out.add(b.id);
  }
  return out;
}

export function newlyConnected(before: Set<number>, world: World): string[] {
  return [...before]
    .sort((a, b) => a - b)
    .map((id) => world.buildings[id])
    .filter((b): b is Building => b !== undefined && b.connected)
    .map((b) => BUILDING_DEFS[b.defId].name);
}
