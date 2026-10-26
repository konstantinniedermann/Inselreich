import { BUILDING_DEFS } from './defs/buildings';
import { GOODS } from './defs/goods';
import { TAX_LEVELS } from './defs/tiers';
import { FEAST_KINDS, type FeastKind } from './defs/feast';
import { FEAST_COOLDOWN } from './defs/timing';
import { takeStock } from './economy';
import {
  chapelWorks,
  feastKindOf,
  feastState,
  inChapelRadius,
  invalidateFeastIndex,
  isFeastKind,
} from './feastEffect';
import { noKontorTrade } from './islands';
import { cycleOf } from './levels';
import { effectiveTaxLevel } from './townhall';
import { fail, ok, type Building, type GoodId, type Result, type World } from './types';
import { islandOf } from './world';

/** Warenprüfung ohne Abbuchung in Schlüsselreihenfolge von `cost`: Grund bei der ersten fehlenden Ware, sonst null. */
function goodsShortage(world: World, chapel: Building, kind: FeastKind): string | null {
  const stock = islandOf(world, chapel).stock;
  for (const [good, need] of Object.entries(FEAST_KINDS[kind].cost) as [GoodId, number][]) {
    if (stock[good] < need)
      return `Zu wenig ${GOODS[good].name} (${Math.floor(stock[good])} / ${need})`;
  }
  return null;
}

/** Zieht die Kosten der Art vom Lager der Kapellen-Insel ab; einzige Abbuchung des Fests. */
function payGoods(world: World, chapel: Building, kind: FeastKind): void {
  for (const [good, need] of Object.entries(FEAST_KINDS[kind].cost) as [GoodId, number][])
    takeStock(islandOf(world, chapel), good, need);
}

/** Spec R7.3: Ein Fest wirkt auf Häuser mit Steuerstufe «normal»; ohne ein solches Haus der Kapellen-Insel im Radius lehnt die Steuer ab. */
function taxBlock(world: World, chapel: Building): string | null {
  const levels = Object.values(world.buildings)
    .filter((b) => b.house !== undefined && inChapelRadius(world, chapel, b))
    .map((b) => effectiveTaxLevel(world, b.house!.tier));
  if (levels.length === 0 || levels.includes('normal')) return null;
  if (levels.every((l) => l === 'high')) return `Steuer «${TAX_LEVELS.high.name}»: kein Aufstieg`;
  if (levels.every((l) => l === 'low')) return `Steuer «${TAX_LEVELS.low.name}»: Fest ohne Wirkung`;
  return 'Steuer: Fest wirkt auf kein Haus';
}

/** Allgemeine Sperren aller Festarten (Phase, Brand, Anbindung), sonst null. */
function commonBlock(world: World, chapel: Building): string | null {
  const { phase } = feastState(world, chapel);
  if (phase === 'active') return 'Fest läuft';
  if (phase === 'cooldown') return 'Abklingzeit';
  if (chapel.outageUntil !== undefined) return 'Kapelle brennt';
  if (!chapelWorks(chapel)) return 'Kapelle nicht angebunden';
  return null;
}

/** Eine andere Kapelle der Insel hat dieselbe Art noch in der Abklingzeit (Brand egal). */
function islandCooldown(world: World, chapel: Building, kind: FeastKind): boolean {
  return Object.values(world.buildings).some(
    (o) =>
      o.id !== chapel.id &&
      o.island === chapel.island &&
      o.feastAt !== undefined &&
      feastKindOf(o) === kind &&
      world.tick - o.feastAt < FEAST_COOLDOWN,
  );
}

/** Ein Betrieb mit Produktionszyklus im Radius der Kapelle (stillgelegte zählen). */
function hasWorkshopNearby(world: World, chapel: Building): boolean {
  return Object.values(world.buildings).some(
    (b) => cycleOf(world, b) !== undefined && inChapelRadius(world, chapel, b),
  );
}

/** Sperre, die nur für die Festart gilt, sonst null. */
function kindBlock(world: World, chapel: Building, kind: FeastKind): string | null {
  if (FEAST_KINDS[kind].scope !== 'island') return taxBlock(world, chapel);
  if (islandCooldown(world, chapel, kind))
    return `${FEAST_KINDS[kind].name} auf der Insel: Abklingzeit`;
  if (kind === 'harvest')
    return hasWorkshopNearby(world, chapel) ? null : 'Kein Betrieb im Umkreis';
  return noKontorTrade(world, chapel.island);
}

/** Sperrgrund für ein Fest an dieser Kapelle (inkl. Waren, ohne Abbuchung), sonst null. Rein lesend. */
export function feastBlockReason(
  world: World,
  chapel: Building,
  kind: string = 'ascension',
): string | null {
  if (!isFeastKind(kind)) return 'Unbekannte Festart';
  return (
    commonBlock(world, chapel) ??
    kindBlock(world, chapel, kind) ??
    goodsShortage(world, chapel, kind)
  );
}

/** Fest der Art `kind` an der Kapelle `id`: bucht die Kosten und setzt `feastAt`. Wirft nie; bei fail bleibt die Welt unverändert. */
export function holdFeast(world: World, id: number, kind: string = 'ascension'): Result {
  const chapel = world.buildings[id];
  if (chapel === undefined || BUILDING_DEFS[chapel.defId].service !== 'faith')
    return fail('Keine Kapelle');
  const block = feastBlockReason(world, chapel, kind);
  if (block !== null) return fail(block);
  const done = kind as FeastKind;
  payGoods(world, chapel, done);
  chapel.feastAt = world.tick;
  invalidateFeastIndex(world);
  if (done === 'ascension') delete chapel.feastKind;
  else chapel.feastKind = done;
  return ok;
}

export {
  feastActive,
  feastKindOf,
  feastState,
  harvestActive,
  marketActive,
  type FeastState,
} from './feastEffect';
