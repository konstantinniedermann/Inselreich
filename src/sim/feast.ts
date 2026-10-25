import { BUILDING_DEFS } from './defs/buildings';
import { GOODS } from './defs/goods';
import { TAX_LEVELS } from './defs/tiers';
import { FEAST_KINDS } from './defs/feast';
import { takeStock } from './economy';
import { chapelWorks, feastState, inChapelRadius } from './feastEffect';
import { effectiveTaxLevel } from './townhall';
import { fail, ok, type Building, type Result, type World } from './types';
import { islandOf } from './world';

/** Rum-Prüfung ohne Abbuchung: Grund bei zu geringem Bestand, sonst null. */
function rumShortage(world: World, chapel: Building): string | null {
  const need = FEAST_KINDS.ascension.cost.rum;
  const rum = islandOf(world, chapel).stock[GOODS.rum.id];
  if (rum >= need) return null;
  return `Zu wenig Rum (${Math.floor(rum)} / ${need})`;
}

/** Einziger Rum-Zugriff des Fests: prüft das Lager der Kapellen-Insel und entnimmt `FEAST_KINDS.ascension.cost.rum`. */
function spendRum(world: World, chapel: Building): Result {
  const short = rumShortage(world, chapel);
  if (short !== null) return fail(short);
  takeStock(islandOf(world, chapel), 'rum', FEAST_KINDS.ascension.cost.rum);
  return ok;
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

/** Sperrgrund für ein Fest ohne Rumprüfung, sonst null. */
function feastBlock(world: World, chapel: Building): string | null {
  const { phase } = feastState(world, chapel);
  if (phase === 'active') return 'Fest läuft';
  if (phase === 'cooldown') return 'Abklingzeit';
  if (chapel.outageUntil !== undefined) return 'Kapelle brennt';
  if (!chapelWorks(chapel)) return 'Kapelle nicht angebunden';
  return taxBlock(world, chapel);
}

/** Sperrgrund für ein Fest an dieser Kapelle (inkl. Rum-Bestand, ohne Abbuchung), sonst null. Rein lesend. */
export function feastBlockReason(world: World, chapel: Building): string | null {
  return feastBlock(world, chapel) ?? rumShortage(world, chapel);
}

/** Fest an der Kapelle `id`: verbraucht `FEAST_KINDS.ascension.cost.rum` Rum und setzt `feastAt`. Wirft nie; bei fail bleibt die Welt unverändert. */
export function holdFeast(world: World, id: number): Result {
  const chapel = world.buildings[id];
  if (chapel === undefined || BUILDING_DEFS[chapel.defId].service !== 'faith')
    return fail('Keine Kapelle');
  const block = feastBlock(world, chapel);
  if (block !== null) return fail(block);
  const paid = spendRum(world, chapel);
  if (!paid.ok) return paid;
  chapel.feastAt = world.tick;
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
