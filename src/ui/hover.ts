import { homeBuildings } from '../render/homeBuildings';
import { islandView, pickArchipel } from '../render/archipel';
import { pickTarget } from './islandTools';
import type { Camera } from '../render/camera';
import type { Tool } from '../render/renderer';
import { BUILDING_DEFS, BUILDING_IDS } from '../sim/defs/buildings';
import { CLEAR_FOREST_COST, PLANT_FOREST_COST } from '../sim/defs/forest';
import { GOODS } from '../sim/defs/goods';
import { TAX_LEVELS, TIERS } from '../sim/defs/tiers';
import { SERVICE_BUILDING, upgradeStatus } from '../sim/population';
import { houseDiagnosis, missingInputs, type Diagnosis } from '../sim/queries';
import { cycleOf } from '../sim/levels';
import { inSupplyRange } from '../sim/supply';
import { effectiveTaxLevel } from '../sim/townhall';
import { buildingShown, functionLock } from '../sim/unlocks';
import { HOME, home, adjacentOf, center, inBounds, isKontor } from '../sim/world';
import type { Building, BuildingDefId, Terrain, Tier, World } from '../sim/types';
import { costLine } from './dom';
import { friendlyReason } from './hints';
import { islandCard } from './islandCard';
import { levelText, protectedCount, utilizationText } from './inspect';
import { goodList, stateInfo } from './texts';
import { formatGameTime, perMinute } from './time';

/** Inhalt der Mouse-over-Karte (Spec M10 13): Titel und höchstens drei Zeilen. */
export interface HoverInfo {
  title: string;
  lines: string[];
}

export interface HoverState {
  restMs: number;
  sameTile: boolean;
  dragging: boolean;
  modalOpen: boolean;
  tool: Tool;
}

/** Ruhezeit des Zeigers über derselben Kachel, bis die Karte erscheint. */
export const HOVER_DELAY_MS = 400;

/** Karte sichtbar? Nur mit Auswahl-Werkzeug, nach Ruhe, ohne Ziehen und ohne offene Karte (Spec 13.1). */
export function hoverVisible(s: HoverState): boolean {
  return (
    s.restMs >= HOVER_DELAY_MS &&
    s.sameTile &&
    !s.dragging &&
    !s.modalOpen &&
    s.tool.kind === 'select'
  );
}

const OFFSET = 16;

/** Position der Karte am Zeiger; klappt an den Fensterrändern um, bleibt im Fenster. */
export function hoverPosition(
  pointer: { x: number; y: number },
  card: { w: number; h: number },
  view: { w: number; h: number },
): { x: number; y: number } {
  let x = pointer.x + OFFSET;
  let y = pointer.y + OFFSET;
  if (x + card.w > view.w) x = pointer.x - OFFSET - card.w;
  if (y + card.h > view.h) y = pointer.y - OFFSET - card.h;
  return {
    x: Math.max(0, Math.min(x, view.w - card.w)),
    y: Math.max(0, Math.min(y, view.h - card.h)),
  };
}

const HOUSE_TITLES: Record<Tier, string> = {
  1: 'Pionierhaus',
  2: 'Siedlerhaus',
  3: 'Bürgerhaus',
  4: 'Kaufmannshaus',
};
const TERRAIN_TITLES: Record<Terrain, string> = {
  forest: 'Wald',
  grass: 'Weide',
  sand: 'Sand',
  mountain: 'Gebirge',
  water: 'Wasser',
};

function diagnosisLine(d: Diagnosis): string {
  switch (d.kind) {
    case 'supply':
      return 'Ausserhalb der Versorgung';
    case 'good':
      return `${GOODS[d.good].name} fehlt`;
    case 'service':
      return `${BUILDING_DEFS[SERVICE_BUILDING[d.service]].name} fehlt in Reichweite`;
  }
}

function houseInfo(world: World, b: Building): HoverInfo {
  const house = b.house!;
  const tier = TIERS[house.tier];
  const lines = [`Einwohner ${house.inhabitants} / ${tier.maxInhabitants}`];
  const diag = houseDiagnosis(world, b)[0];
  lines.push(diag ? diagnosisLine(diag) : 'zufrieden');
  if (tier.upgradeCost !== null) {
    const st = upgradeStatus(world, b);
    lines.push(
      st.ok
        ? 'Aufstieg bereit'
        : `Aufstieg: ${friendlyReason(world, st.reasons[0] ?? '', { island: b.island })}`,
    );
  }
  return { title: HOUSE_TITLES[house.tier], lines };
}

/** Zustandszeile eines Betriebs oder Dienstes, der nicht arbeitet; `null`, wenn alles läuft. */
function troubleLine(b: Building): string | null {
  if (b.outageUntil !== undefined || b.state === 'burning') return 'brennt';
  if (!b.connected) return 'nicht angebunden';
  return null;
}

function workshopInfo(world: World, b: Building): HoverInfo {
  const def = BUILDING_DEFS[b.defId];
  const lines: string[] = [];
  const trouble = troubleLine(b);
  if (trouble) lines.push(trouble);
  else if (b.state === 'waitingInput') {
    const missing = missingInputs(world, b);
    lines.push(`wartet auf ${goodList(missing.length > 0 ? missing : (def.consumes ?? []))}`);
  } else if (b.state === 'storageFull') lines.push('Lager voll');
  else if (b.state === 'noService')
    lines.push(
      `braucht eine ${BUILDING_DEFS[SERVICE_BUILDING[def.requiresService!]].name} in Reichweite`,
    );
  else if (b.state === 'notConnected') lines.push('nicht angebunden');
  else if (b.state === 'noForest') lines.push(stateInfo(b, world.tick).text);
  else lines.push(`arbeitet — ${perMinute(1, cycleOf(b) ?? 1)} ${GOODS[def.produces!].name} / min`);
  const level = levelText(b);
  const title = level === null ? def.name : `${def.name}, ${level} · ${utilizationText(b)}`;
  return { title, lines };
}

function serviceInfo(world: World, b: Building): HoverInfo {
  const def = BUILDING_DEFS[b.defId];
  const trouble = troubleLine(b);
  if (def.fireProtection === true) {
    const n = protectedCount(world, b);
    return { title: def.name, lines: [`schützt ${n} Gebäude`] };
  }
  const c = center(def, b.x, b.y);
  const n = trouble
    ? 0
    : homeBuildings(world).filter((h) => {
        if (!h.house) return false;
        const hc = center(BUILDING_DEFS[h.defId], h.x, h.y);
        return Math.hypot(hc.cx - c.cx, hc.cy - c.cy) <= (def.serviceRadius ?? 0);
      }).length;
  const lines = [n === 1 ? 'versorgt 1 Haus' : `versorgt ${n} Häuser`];
  if (trouble) lines.push(trouble);
  return { title: def.name, lines };
}

function townhallInfo(world: World, b: Building): HoverInfo {
  const trouble = troubleLine(b);
  return {
    title: BUILDING_DEFS[b.defId].name,
    lines: [
      `Steuer: ${TAX_LEVELS[effectiveTaxLevel(world)].name}`,
      `Sperren: ${world.goodLocks.length}`,
      trouble ? `Wirkt nicht: ${trouble}` : 'Klicken zum Einstellen',
    ],
  };
}

function buildingInfo(world: World, b: Building): HoverInfo {
  const def = BUILDING_DEFS[b.defId];
  if (b.house) return houseInfo(world, b);
  if (b.defId === 'townhall') return townhallInfo(world, b);
  if (def.supplyRadius !== undefined) {
    const lines = [`Versorgung im Radius ${def.supplyRadius}`];
    if (isKontor(b.defId)) lines.push('Handel: klicken');
    return { title: def.name, lines };
  }
  if (def.service !== undefined || def.fireProtection === true) return serviceInfo(world, b);
  if (def.produces !== undefined) return workshopInfo(world, b);
  return { title: def.name, lines: [] };
}

/** Gebäude, für die ein Geländetyp taugt (nur angezeigte, Spec 13.2), in Bauleisten-Reihenfolge. */
function goodFor(world: World, x: number, y: number, terrain: Terrain): string {
  const shown = (id: BuildingDefId): boolean => buildingShown(world, id);
  const supplied = inSupplyRange(world, HOME, x + 0.5, y + 0.5);
  const ids = new Set<BuildingDefId>();
  if (terrain === 'forest') ids.add('lumberjack');
  if (terrain === 'grass')
    for (const id of ['house', 'sheepfarm', 'canefarm'] as const) ids.add(id);
  if (terrain === 'sand') ids.add('house');
  if (terrain === 'grass' || terrain === 'sand') {
    if (
      adjacentOf(home(world), x, y, 1, 1).some(
        (p) => home(world).tiles[p.y * home(world).width + p.x]!.terrain === 'water',
      )
    )
      ids.add('fisher');
  }
  if (!supplied) ids.delete('house');
  const names = BUILDING_IDS.filter((id) => ids.has(id) && shown(id)).map(
    (id) => BUILDING_DEFS[id].name,
  );
  if (terrain === 'mountain' && shown('quarry')) return 'Gut für Steinbruch daneben';
  if (terrain === 'water' && shown('fisher')) return 'Gut für Fischerhütte an der Küste';
  return names.length > 0 ? `Gut für ${names.join(', ')}` : '';
}

function terrainInfo(world: World, x: number, y: number): HoverInfo {
  const tile = home(world).tiles[y * home(world).width + x]!;
  const lines: string[] = [];
  const good = goodFor(world, x, y, tile.terrain);
  if (good) lines.push(good);
  if (functionLock(world, 'forest') === null) {
    if (tile.terrain === 'forest') lines.push(`Roden: ${costLine(CLEAR_FOREST_COST)}`);
    else if (tile.terrain === 'grass') lines.push(`Aufforsten: ${costLine(PLANT_FOREST_COST)}`);
  }
  if (tile.terrain !== 'water' && !inSupplyRange(world, HOME, x + 0.5, y + 0.5))
    lines.push('Ausserhalb der Versorgung');
  return { title: TERRAIN_TITLES[tile.terrain], lines };
}

/**
 * Inhalt der Karte für die Kachel unter dem Zeiger. Priorität Tier > Schiff > Gebäude > Gelände (Spec 13.1);
 * `null` ausserhalb der Karte. Rein, wirft nicht, schreibt nie in die Welt.
 */
export function hoverInfo(
  world: World,
  tile: { x: number; y: number },
  _timeMs: number,
  extra: { ship: boolean; animal: string | null },
): HoverInfo | null {
  if (extra.animal !== null) return { title: extra.animal, lines: [] };
  if (extra.ship) {
    const lines = ['Kauft und verkauft am Kontor'];
    const o = world.order;
    if (o !== null && functionLock(world, 'orders') === null)
      lines.push(
        `Auftrag: ${o.amount} ${GOODS[o.good].name}, noch ${formatGameTime(o.due - world.tick)}`,
      );
    return { title: 'Händlerschiff', lines };
  }
  if (!inBounds(home(world), tile.x, tile.y)) return null;
  const t = home(world).tiles[tile.y * home(world).width + tile.x]!;
  const b = t.buildingId === null ? undefined : world.buildings[t.buildingId];
  if (b) return buildingInfo(world, b);
  if (t.road) return { title: 'Weg', lines: ['Verbindet Betriebe mit dem Kontor'] };
  return terrainInfo(world, tile.x, tile.y);
}

/** Fremdinsel unter dem Zeiger: Landkachel einer Insel ausserhalb der Heimat zeigt die Inselkarte, Meer nichts. */
export function foreignHover(
  world: World,
  cam: Camera,
  sx: number,
  sy: number,
): { island: number; x: number; y: number; info: HoverInfo } | null {
  const hit = pickArchipel(cam, sx, sy, world.islands);
  if (!hit || hit.island === HOME) return null;
  const isl = world.islands[hit.island]!;
  if (isl.tiles[hit.y * isl.width + hit.x]?.terrain === 'water') return null;
  const text = islandCard(world, hit.island);
  return text === null
    ? null
    : { ...hit, info: { title: foreignHoverTitle(world, text), lines: [] } };
}

/**
 * Gebäude einer Fremdinsel unter dem Zeiger (Auswahl): zeigt dessen Karte statt der Inselkarte; sonst `null`.
 * Gelesen wird die Inselansicht (`islandView`), nie die Welt selbst.
 */
export function foreignBuildingHover(
  world: World,
  cam: Camera,
  sx: number,
  sy: number,
): { island: number; x: number; y: number; info: HoverInfo } | null {
  const t = pickTarget(world, cam, { kind: 'select' }, sx, sy);
  if (!t || t.island === HOME) return null;
  const view = islandView(world, t.island);
  const tile = view.islands[0]!.tiles[t.y * view.islands[0]!.width + t.x];
  const b = tile?.buildingId == null ? undefined : view.buildings[tile.buildingId];
  return b ? { ...t, info: buildingInfo(view, b) } : null;
}

/** Vor `seafaring` hängt die Inselkarte den Hinweis auf die Seefahrt an (Spec M12 C.10). */
export function foreignHoverTitle(world: World, card: string): string {
  return functionLock(world, 'seafaring') === null ? card : `${card} · Seefahrt mit den Kaufleuten`;
}
