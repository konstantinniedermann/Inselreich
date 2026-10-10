import type { Tool } from '../render/renderer';
import { BUILDING_DEFS, ROAD_COST, ROAD_COST_OBJ } from '../sim/defs/buildings';
import { GOODS, STORAGE_CAP } from '../sim/defs/goods';
import { TAX_LEVELS, TIERS, TIER_IDS, WIN_CITIZENS } from '../sim/defs/tiers';
import { taxLocked } from '../sim/tax';
import { refundCost } from '../sim/economy';
import { canClearForest, canPlantForest } from '../sim/forest';
import { CLEAR_FOREST_COST, PLANT_FOREST_COST } from '../sim/defs/forest';
import { canPlace, canPlaceRoad } from '../sim/placement';
import { effectiveRefund, houseDiagnosis } from '../sim/queries';
import { reachableRoads } from '../sim/roads';
import { paidCost } from '../sim/upgrade';
import type {
  Building,
  BuildingDefId,
  Cost,
  GoodId,
  Terrain,
  Tier,
  Tile,
  World,
} from '../sim/types';
import { HOME, home, adjacentOf, idx, isKontor, tileAt } from '../sim/world';
import { toolAfford } from './islandTools';
import { costLine } from './dom';
import { hotkeyLabel } from './hotkeys';
import { diagnosisText, refundText, stateText } from './texts';
import { formatGameTime } from './time';

export interface ReasonCtx {
  defId?: BuildingDefId;
  cost?: Cost;
  good?: GoodId;
  amount?: number;
  /** Insel, deren Bestand genannt wird (Standard Heimat). */
  island?: number;
  /** Bevölkerungsstufe, auf die sich ein Steuergrund bezieht (P-2). */
  tier?: Tier;
  /** Grundriss der Aktion (Ursprung, Breite, Höhe) auf `island`; nennt Gelände bzw. Belegung (REL-16). */
  at?: { x: number; y: number; w: number; h: number };
}

const GROUND_NAMES: Partial<Record<Terrain, string>> = { water: 'Wasser', mountain: 'Gebirge' };

/** Kacheln des Grundrisses (Zeilen aussen, Spalten innen); nur lesen. */
function footprint(world: World, c: ReasonCtx): Tile[] {
  const at = c.at;
  const isl = world.islands[c.island ?? HOME];
  if (!at || !isl) return [];
  const out: Tile[] = [];
  for (let dy = 0; dy < at.h; dy++)
    for (let dx = 0; dx < at.w; dx++) {
      const t = tileAt(isl, at.x + dx, at.y + dy);
      if (t) out.push(t);
    }
  return out;
}

function groundText(world: World, c: ReasonCtx): string | null {
  const found = new Set(footprint(world, c).map((t) => t.terrain));
  const names = (['water', 'mountain'] as const)
    .filter((t) => found.has(t))
    .map((t) => GROUND_NAMES[t]!);
  return names.length ? `Kein Bauland: ${names.join(' und ')}` : null;
}

function occupantText(world: World, c: ReasonCtx): string | null {
  const tiles = footprint(world, c);
  const b = tiles.find((t) => t.buildingId !== null);
  if (b) return `Platz belegt: ${BUILDING_DEFS[world.buildings[b.buildingId!]!.defId].name}`;
  return tiles.some((t) => t.road) ? 'Platz belegt: Weg' : null;
}

/** `show` liefert den Anzeigetext; `null` = Grund unverändert anzeigen. */
export interface ReasonRow {
  source: string;
  pattern: RegExp;
  show(m: RegExpExecArray, world: World, ctx: ReasonCtx): string | null;
}

export type Hint = { tone: 'ok' | 'bad' | 'info'; text: string };

const same = (): null => null;
const stockOf = (w: World, c: ReasonCtx): Record<GoodId, number> =>
  (w.islands[c.island ?? HOME] ?? home(w)).stock;
const COST_GOODS = ['wood', 'tools', 'stone'] as const;
const costOf = (c: ReasonCtx): Cost | null =>
  c.cost ?? (c.defId ? BUILDING_DEFS[c.defId].cost : null);

export const REASON_TABLE: readonly ReasonRow[] = [
  { source: 'upgrade', pattern: /^Kann nicht ausgebaut werden$/, show: same },
  { source: 'upgrade', pattern: /^Gebäude brennt$/, show: same },
  {
    source: 'placement',
    pattern: /^Ausserhalb der Karte$/,
    show: () => 'Reicht über den Kartenrand hinaus',
  },
  {
    source: 'placement',
    pattern: /^Kein Bauland$/,
    show: (_m, w, c) => groundText(w, c) ?? 'Kein Bauland — nur auf Land bauen',
  },
  {
    source: 'placement',
    pattern: /^Bereits bebaut$/,
    show: (_m, w, c) => occupantText(w, c) ?? 'Hier steht schon ein Gebäude oder Weg',
  },
  {
    source: 'placement',
    pattern: /^Braucht (Wasser|Gebirge) angrenzend$/,
    show: (m, _w, c) =>
      c.defId ? `${BUILDING_DEFS[c.defId].name} muss direkt am ${m[1]} stehen` : null,
  },
  {
    source: 'placement',
    pattern: /^Zu wenig (freier |freie )?(Wald|Weide) in der Nähe$/,
    show: (m, _w, c) => {
      if (!c.defId) return null;
      const terrain = m[2] === 'Wald' ? 'forest' : 'grass';
      const rule = BUILDING_DEFS[c.defId].site.find(
        (r) => r.kind === 'radius' && r.terrain === terrain,
      );
      return rule?.kind === 'radius'
        ? `Zu wenig ${m[1] ?? ''}${m[2]} in der Nähe: mindestens ${rule.min} ${rule.min === 1 ? 'Feld' : 'Felder'} im Umkreis ${rule.radius}`
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
        ? `Zu wenig ${m[1]}: ${cost[g]} nötig, ${stockOf(w, c)[g]} vorhanden · kaufbar am Kontor`
        : null;
    },
  },
  { source: 'tax', pattern: /^Ungültige Stufe$/, show: same },
  { source: 'tax', pattern: /^Stufe bereits aktiv$/, show: () => 'Diese Steuerstufe gilt bereits' },
  {
    source: 'placement',
    pattern: /^Es gibt schon eine Amtsstube$/,
    show: () => 'Es gibt schon eine Amtsstube — höchstens eine wirkt',
  },
  {
    source: 'tax',
    pattern: /^Braucht eine Amtsstube$/,
    show: () => 'Baue zuerst eine Amtsstube (I)',
  },
  {
    source: 'tax',
    pattern: /^Amtsstube wirkt nicht$/,
    show: () => 'Die Amtsstube wirkt erst mit Weg und ohne Brand',
  },
  { source: 'tax', pattern: /^Ungültige Sperre$/, show: same },
  { source: 'forest', pattern: /^Kein Wald$/, show: () => 'Hier ist kein Wald' },
  { source: 'forest', pattern: /^Keine Weide$/, show: () => 'Aufforsten geht nur auf Weide' },
  // Sperrtexte der Freischaltung (`lockText`, Spec 4.5) und Folgen der Amtsstube: wörtlich
  { source: 'unlocks', pattern: /^Erst ab \d+ Wohnhäusern$/, show: same },
  { source: 'unlocks', pattern: /^Erst wenn ein Wohnhaus \d+ (Pioniere|Siedler) hat$/, show: same },
  { source: 'unlocks', pattern: /^Erst mit den ersten (Siedlern|Bürgern)$/, show: same },
  { source: 'upgradeStatus', pattern: /^Aufstieg in der Amtsstube angehalten$/, show: same },
  { source: 'upgradeStatus', pattern: /^.+ für .+ gesperrt$/, show: same },
  {
    source: 'tax',
    pattern: /^Sperrzeit$/,
    show: (_m, w, c) => {
      const t = c.tier ?? TIER_IDS.find((x) => taxLocked(w, x));
      return t === undefined
        ? null
        : `Steuer für ${TIERS[t].name} erst in ${formatGameTime(w.taxLockedUntil[t] - w.tick)} wieder änderbar`;
    },
  },
  { source: 'orders', pattern: /^Kein Auftrag$/, show: () => 'Gerade gibt es keinen Auftrag' },
  {
    source: 'orders',
    pattern: /^Nicht genug Ware$/,
    show: (_m, w, c) =>
      c.good && c.amount !== undefined
        ? `Nicht genug ${GOODS[c.good].name}: ${c.amount} nötig, ${stockOf(w, c)[c.good]} vorhanden`
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
  {
    source: 'upgradeStatus',
    pattern: /^Erst nach dem Ziel$/,
    show: () => `Erst nach dem Ziel (${WIN_CITIZENS} ${TIERS[3].name})`,
  },
  { source: 'upgradeStatus', pattern: /^Erst ab \d+ Bürgern \(jetzt \d+\)$/, show: same },
  { source: 'upgradeStatus', pattern: /^Haus nicht voll belegt$/, show: same },
  {
    source: 'upgradeStatus',
    pattern: /^Steuer zu hoch$/,
    show: (_m, _w, c) =>
      c.tier === undefined
        ? `Steuer ‚${TAX_LEVELS.high.name}' verhindert den Aufstieg`
        : `Steuer ‚${TAX_LEVELS.high.name}' für ${TIERS[c.tier].name} verhindert den Aufstieg`,
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
  island: number = HOME,
): boolean {
  const isl = world.islands[island]!;
  return adjacentOf(isl, x, y, w, h).some((p) => roads.has(idx(isl, p.x, p.y)));
}

/** Satzteil „danach mit Weg (Taste) …"; ohne Taste entfällt die Klammer. */
export function connectAdvice(label: string | null): string {
  return `danach mit Weg${label ? ` (${label})` : ''} zum Kontor verbinden`;
}

export function placementHint(
  world: World,
  tool: Tool,
  x: number,
  y: number,
  island: number = HOME,
): Hint | null {
  const isl = world.islands[island]!;
  const road = hotkeyLabel({ kind: 'road' });
  if (tool.kind === 'build') {
    const def = BUILDING_DEFS[tool.defId];
    const r = canPlace(world, tool.defId, x, y, island);
    const a = r.ok ? toolAfford(world, tool, island) : r;
    if (!a.ok) {
      const at = { x, y, w: def.w, h: def.h };
      return {
        tone: 'bad',
        text: friendlyReason(world, a.reason, { defId: tool.defId, island, at }),
      };
    }
    if (tool.defId === 'house') return { tone: 'ok', text: 'Baubar · im Versorgungsgebiet' };
    if (tool.defId === 'kontor2') return { tone: 'ok', text: 'Baubar · Kosten aus der Heimat' };
    return touchesReachable(world, x, y, def.w, def.h, reachableRoads(world, island), island)
      ? { tone: 'ok', text: 'Baubar · wird an den Kontor angebunden' }
      : { tone: 'ok', text: `Baubar · ${connectAdvice(road)}` };
  }
  if (tool.kind === 'road') {
    const r = canPlaceRoad(world, x, y, island);
    const a = r.ok ? toolAfford(world, tool, island) : r;
    if (!a.ok) {
      const at = { x, y, w: 1, h: 1 };
      return {
        tone: 'bad',
        text: friendlyReason(world, a.reason, { cost: ROAD_COST_OBJ, island, at }),
      };
    }
    const roads = reachableRoads(world, island);
    const linked = adjacentOf(isl, x, y, 1, 1).some(
      (p) => roads.has(idx(isl, p.x, p.y)) || tileAt(isl, p.x, p.y)?.buildingId === isl.kontorId,
    );
    return {
      tone: 'ok',
      text: `Weg · ${ROAD_COST} Geld · ${linked ? 'verbunden mit dem Kontor' : 'noch nicht mit dem Kontor verbunden'}`,
    };
  }
  if (tool.kind === 'clearForest' || tool.kind === 'plantForest') {
    const clear = tool.kind === 'clearForest';
    const r = clear ? canClearForest(world, x, y, island) : canPlantForest(world, x, y, island);
    if (!r.ok) {
      const cost = clear ? CLEAR_FOREST_COST : PLANT_FOREST_COST;
      return { tone: 'bad', text: friendlyReason(world, r.reason, { cost }) };
    }
    return clear
      ? { tone: 'ok', text: `Roden: ${CLEAR_FOREST_COST.money} Geld` }
      : { tone: 'ok', text: `Aufforsten: ${PLANT_FOREST_COST.money} Geld` };
  }
  const tile = tileAt(isl, x, y);
  const b = tile?.buildingId != null ? world.buildings[tile.buildingId] : undefined;
  if (tool.kind === 'demolish') {
    if (b?.defId === 'kontor') return { tone: 'info', text: 'Kontor kann nicht abgerissen werden' };
    if (b) {
      const cost = paidCost(b);
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
  if (isKontor(b.defId)) return { tone: 'info', text: 'Kontor · klicken zum Handeln' };
  const name = BUILDING_DEFS[b.defId].name;
  if (b.house) {
    const d = houseDiagnosis(world, b)[0];
    return {
      tone: 'info',
      text: `${name} — ${TIERS[b.house.tier].name} · ${d ? diagnosisText(d) : 'zufrieden'}`,
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
    if (!b.connected && b.defId !== 'house' && b.id !== home(world).kontorId) out.add(b.id);
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

/** R161-Hinweis (Spec 3.7): fehlt Stein beim Aufstieg und steht eine Glashütte, nennt er den zweiten Steinverbraucher. */
export function glassStoneHint(world: World, reasons: readonly string[]): string | null {
  if (!reasons.includes('Zu wenig Stein')) return null;
  const hasGlass = Object.values(world.buildings).some((b) => b.defId === 'glassworks');
  return hasGlass ? 'Die Glashütte verbraucht ebenfalls Stein — baue weitere Steinbrüche.' : null;
}
