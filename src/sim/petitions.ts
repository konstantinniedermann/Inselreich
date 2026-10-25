import { serviceRadiusOf } from './council';
import { BUILDING_DEFS } from './defs/buildings';
import { GOODS } from './defs/goods';
import {
  FRUGAL_TICKS,
  PETITIONS,
  PETITION_ANSWER,
  PETITION_FIRST,
  PETITION_IDS,
  PETITION_MAX_OPEN,
  PETITION_PERIOD,
  type PetitionDef,
  type PetitionId,
  type PetitionWhen,
} from './defs/petitions';
import { TIER_IDS } from './defs/tiers';
import { petitionRng } from './petitionRng';
import {
  fail,
  ok,
  type Building,
  type BuildingDefId,
  type GoodId,
  type PetitionMark,
  type Result,
  type World,
} from './types';
import { HOME, center } from './world';

export type PetitionEventKind = 'drawn' | 'thanks' | 'lament' | 'lapsed' | 'ended' | 'timeout';

export interface PetitionEvent {
  kind: PetitionEventKind;
  id: PetitionId;
  /** Bei `ended` (Wirkung ohne Marke) der Tick, an dem die Wirkung endete. */
  drawnAt: number;
  amount?: number;
  spoiled?: Partial<Record<GoodId, number>>;
}

export const PETITION_REASONS = {
  off: 'Bittschriften aus',
  none: 'Keine offene Bitte',
  answered: 'Schon beantwortet',
  unknown: 'Unbekannte Antwort',
  anchorGone: (name: string): string => `${name} steht nicht mehr`,
  lack: (good: GoodId, have: number, need: number): string =>
    `Zu wenig ${GOODS[good].name} (${Math.floor(have)} / ${need})`,
} as const;

/** Ware und Gebäude der Gewürzsaat, aus der Bitte selbst gelesen (kein Literal im Code). */
const SPICE = { good: PETITIONS.spiceSeed.cost[0]!.good, farm: PETITIONS.spiceSeed.anchor! };

const stockOf = (world: World): Record<GoodId, number> => world.islands[HOME]!.stock;

const byId = (world: World): Building[] =>
  Object.values(world.buildings).sort((a, b) => a.id - b.id);

function housesAbove(world: World, minTier: number): Building[] {
  return byId(world).filter(
    (b) => b.island === HOME && b.house !== undefined && b.house.tier >= minTier,
  );
}

/** E: Einwohner aller Häuser ab Stufe 2 auf HOME. */
function residents(world: World): number {
  return housesAbove(world, 2).reduce((sum, b) => sum + b.house!.inhabitants, 0);
}

function inRadius(world: World, chapel: Building, house: Building): boolean {
  if (chapel.island !== house.island) return false;
  const hc = center(BUILDING_DEFS[house.defId], house.x, house.y);
  const c = center(BUILDING_DEFS[chapel.defId], chapel.x, chapel.y);
  return Math.hypot(hc.cx - c.cx, hc.cy - c.cy) <= (serviceRadiusOf(world, chapel.defId) ?? 0);
}

function chapelHasUpgradable(world: World, chapel: Building): boolean {
  const top = TIER_IDS[TIER_IDS.length - 1]!;
  return byId(world).some(
    (h) => h.house !== undefined && h.house.tier < top && inRadius(world, chapel, h),
  );
}

function buildingsOf(world: World, defId: BuildingDefId, homeOnly: boolean): Building[] {
  return byId(world).filter((b) => b.defId === defId && (!homeOnly || b.island === HOME));
}

function whenHolds(world: World, when: PetitionWhen): boolean {
  switch (when.kind) {
    case 'houseTier':
      return (
        (!when.goalOpen || !world.wonSpice) &&
        housesAbove(world, 0).some((b) => when.tiers.includes(b.house!.tier))
      );
    case 'chapelBelowMax':
      return buildingsOf(world, 'chapel', true).some((c) => chapelHasUpgradable(world, c));
    case 'chapel':
      return buildingsOf(world, 'chapel', true).length > 0;
    case 'building':
      return buildingsOf(world, when.building, true).length > 0;
    case 'goalOpen':
      return !world.wonSpice;
    case 'stockAtLeast':
      return when.goods.some((g) => stockOf(world)[g] >= when.min);
    default: // letzte Art: Gewürzlager plus Plantage (die Art heisst wie die Ware, darum ohne Literal)
      return (
        stockOf(world)[SPICE.good] >= when.min && buildingsOf(world, SPICE.farm, false).length > 0
      );
  }
}

/** Menge der ersten `div`-Kostenware beim Ziehen (0 ohne eine solche). */
function amountFor(world: World, def: PetitionDef): number {
  const c = def.cost.find((x) => 'div' in x);
  if (c === undefined || !('div' in c)) return 0;
  return Math.min(c.max, Math.max(c.min, Math.ceil(residents(world) / c.div)));
}

function costOf(def: PetitionDef, amount: number): Partial<Record<GoodId, number>> {
  const out: Partial<Record<GoodId, number>> = {};
  for (const c of def.cost) out[c.good] = 'fixed' in c ? c.fixed : amount;
  return out;
}

export function petitionCost(world: World, mark: PetitionMark): Partial<Record<GoodId, number>> {
  void world;
  return costOf(PETITIONS[mark.id], mark.amount);
}

function affordable(world: World, def: PetitionDef, amount: number): boolean {
  return Object.entries(costOf(def, amount)).every(([g, n]) => stockOf(world)[g as GoodId] >= n);
}

/** Kandidaten in Tabellenreihenfolge; liest nur. */
export function petitionCandidates(world: World): PetitionId[] {
  return PETITION_IDS.filter((id) => {
    const def = PETITIONS[id];
    return (
      whenHolds(world, def.when) &&
      !world.petitions.open.some((m) => m.id === id) &&
      affordable(world, def, amountFor(world, def))
    );
  });
}

function anchorsOf(world: World, def: PetitionDef): Building[] {
  if (def.anchor === null) return [];
  const all = buildingsOf(world, def.anchor, def.anchor !== 'spicefarm');
  return def.when.kind === 'chapelBelowMax'
    ? all.filter((c) => chapelHasUpgradable(world, c))
    : all;
}

function frugal(world: World, id: PetitionId): void {
  world.petitions.effects.push({ id, answer: 'no', until: world.tick + FRUGAL_TICKS });
}

function declineNow(world: World, m: PetitionMark): void {
  m.answer = 'no';
  m.dueTick = world.tick + PETITIONS[m.id].delay;
  frugal(world, m.id);
}

export function answerPetition(world: World, drawnAt: number, answer: string): Result {
  const p = world.petitions;
  if (!p.on) return fail(PETITION_REASONS.off);
  const m = p.open.find((x) => x.drawnAt === drawnAt);
  if (m === undefined) return fail(PETITION_REASONS.none);
  if (m.answer !== undefined) return fail(PETITION_REASONS.answered);
  if (answer !== 'yes' && answer !== 'no') return fail(PETITION_REASONS.unknown);
  const def = PETITIONS[m.id];
  if (answer === 'no') {
    declineNow(world, m);
    return ok;
  }
  if (m.anchor !== undefined && world.buildings[m.anchor] === undefined)
    return fail(PETITION_REASONS.anchorGone(BUILDING_DEFS[def.anchor!].name));
  const cost = petitionCost(world, m);
  for (const [g, n] of Object.entries(cost) as [GoodId, number][])
    if (stockOf(world)[g] < n) return fail(PETITION_REASONS.lack(g, stockOf(world)[g], n));
  for (const [g, n] of Object.entries(cost) as [GoodId, number][]) stockOf(world)[g] -= n;
  m.answer = 'yes';
  m.dueTick = world.tick + def.delay;
  return ok;
}

function expireEffects(world: World, events: PetitionEvent[]): void {
  const p = world.petitions;
  for (const e of p.effects)
    if (e.until <= world.tick && e.answer === 'yes')
      events.push({ kind: 'ended', id: e.id, drawnAt: e.until });
  p.effects = p.effects.filter((e) => e.until > world.tick);
}

function applyDeadlines(world: World, events: PetitionEvent[]): void {
  for (const m of world.petitions.open) {
    if (m.answer !== undefined || world.tick !== m.drawnAt + PETITION_ANSWER) continue;
    declineNow(world, m);
    events.push({ kind: 'timeout', id: m.id, drawnAt: m.drawnAt });
  }
}

function closeDue(world: World, events: PetitionEvent[]): void {
  const p = world.petitions;
  const due = p.open.filter((m) => m.dueTick === world.tick);
  p.open = p.open.filter((m) => m.dueTick !== world.tick);
  for (const m of due) {
    const base = { id: m.id, drawnAt: m.drawnAt };
    if (m.answer === 'no') {
      events.push({ kind: 'lament', ...base });
    } else if (m.anchor !== undefined && world.buildings[m.anchor] === undefined) {
      events.push({ kind: 'lapsed', ...base });
    } else {
      const until = world.tick + PETITIONS[m.id].duration;
      p.effects.push({
        id: m.id,
        answer: 'yes',
        until,
        ...(m.anchor === undefined ? {} : { anchor: m.anchor }),
      });
      events.push({ kind: 'thanks', ...base });
    }
  }
}

function draw(world: World, events: PetitionEvent[]): void {
  const p = world.petitions;
  p.next = world.tick + PETITION_PERIOD;
  if (p.open.length >= PETITION_MAX_OPEN) return;
  const candidates = petitionCandidates(world);
  if (candidates.length === 0) return;
  const rng = petitionRng(world.seed, world.tick);
  const id = candidates[Math.floor(rng() * candidates.length)]!;
  const def = PETITIONS[id];
  const anchors = anchorsOf(world, def);
  const mark: PetitionMark = { id, drawnAt: world.tick, amount: amountFor(world, def) };
  if (def.anchor !== null) mark.anchor = anchors[Math.floor(rng() * anchors.length)]!.id;
  p.open.push(mark);
  events.push({ kind: 'drawn', id, drawnAt: mark.drawnAt, amount: mark.amount });
}

/** Ein Tick der Bittschriften: (a) Ablauf, (b) Frist, (c) Nachspiel, (d) Ziehen. Bei `on === false` sofort leer. */
export function tickPetitions(world: World): PetitionEvent[] {
  const p = world.petitions;
  if (!p.on) return [];
  if (p.next === null && world.won) p.next = world.tick + PETITION_FIRST;
  const events: PetitionEvent[] = [];
  expireEffects(world, events);
  applyDeadlines(world, events);
  closeDue(world, events);
  if (world.tick === p.next) draw(world, events);
  return events;
}
