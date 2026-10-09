import { BUILDING_DEFS } from './defs/buildings';
import { GOODS } from './defs/goods';
import { TAX_LEVELS } from './defs/tiers';
import { FEAST_COOLDOWN, FEAST_DURATION, FEAST_RUM } from './defs/timing';
import { takeStock } from './economy';
import { effectiveTaxLevel } from './townhall';
import { fail, ok, type Building, type Result, type World } from './types';
import { center, islandOf } from './world';

/** Stand des Fests einer Kapelle: bereit, läuft oder Abklingzeit; `remaining` in Ticks bis zum Phasenende. */
export type FeastState = { phase: 'ready' | 'active' | 'cooldown'; remaining: number };

/** Phase und Restzeit; `feastAt` fehlt = bereit. Die Uhr läuft auch bei Brand weiter. */
export function feastState(world: World, chapel: Building): FeastState {
  if (chapel.feastAt === undefined) return { phase: 'ready', remaining: 0 };
  const elapsed = world.tick - chapel.feastAt;
  if (elapsed < FEAST_DURATION) return { phase: 'active', remaining: FEAST_DURATION - elapsed };
  if (elapsed < FEAST_COOLDOWN) return { phase: 'cooldown', remaining: FEAST_COOLDOWN - elapsed };
  return { phase: 'ready', remaining: 0 };
}

/** Eine Kapelle wirkt nur, wenn sie angebunden ist und nicht brennt (wie `serviceAvailable`). */
function chapelWorks(chapel: Building): boolean {
  return chapel.connected && chapel.outageUntil === undefined;
}

/** Rum-Prüfung ohne Abbuchung: Grund bei zu geringem Bestand, sonst null. */
function rumShortage(world: World, chapel: Building): string | null {
  const rum = islandOf(world, chapel).stock[GOODS.rum.id];
  if (rum >= FEAST_RUM) return null;
  return `Zu wenig Rum (${Math.floor(rum)} / ${FEAST_RUM})`;
}

/** Einziger Rum-Zugriff des Fests: prüft das Lager der Kapellen-Insel und entnimmt `FEAST_RUM`. */
function spendRum(world: World, chapel: Building): Result {
  const short = rumShortage(world, chapel);
  if (short !== null) return fail(short);
  takeStock(islandOf(world, chapel), 'rum', FEAST_RUM);
  return ok;
}

/** Spec R7.3: Ein Fest wirkt auf Häuser mit Steuerstufe «normal»; ohne ein solches Haus der Kapellen-Insel im Radius lehnt die Steuer ab. */
function taxBlock(world: World, chapel: Building): string | null {
  const levels = Object.values(world.buildings)
    .filter((b) => b.house !== undefined && inChapelRadius(chapel, b))
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

/** Fest an der Kapelle `id`: verbraucht `FEAST_RUM` Rum und setzt `feastAt`. Wirft nie; bei fail bleibt die Welt unverändert. */
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

/** Haus auf der Insel der Kapelle (Koordinaten sind inselbezogen) mit Mittelpunktabstand im Dienstradius. */
function inChapelRadius(chapel: Building, house: Building): boolean {
  if (chapel.island !== house.island) return false;
  const hc = center(BUILDING_DEFS[house.defId], house.x, house.y);
  const def = BUILDING_DEFS[chapel.defId];
  const c = center(def, chapel.x, chapel.y);
  return Math.hypot(hc.cx - c.cx, hc.cy - c.cy) <= (def.serviceRadius ?? 0);
}

/** Wirkt ein Fest auf das Haus: eine laufende, arbeitende Kapelle mit dem Haus im Dienstradius (Id-Reihenfolge, einmal). */
export function feastActive(world: World, house: Building): boolean {
  return Object.values(world.buildings).some((b) => {
    if (b.feastAt === undefined || !chapelWorks(b)) return false;
    if (feastState(world, b).phase !== 'active') return false;
    return inChapelRadius(b, house);
  });
}
