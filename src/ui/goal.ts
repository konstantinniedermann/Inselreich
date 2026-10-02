// Zieltexte und Banner (Spec M8 14.1): rein, ohne DOM. Zahlen und Namen aus `goalView` und `defs`.
import { BUILDING_DEFS } from '../sim/defs/buildings';
import { TIERS, WIN_CITIZENS, WIN_MERCHANTS } from '../sim/defs/tiers';
import { buildLock } from '../sim/placement';
import type { GoalView } from '../sim/queries';
import type { BuildingDefId, World } from '../sim/types';
import { friendlyReason } from './hints';
import { hotkeyLabel } from './hotkeys';

/** Name des zweiten Ziels (Setzung Spec M8 7). */
export const SECOND_GOAL_NAME = 'Handelsstadt';

export interface GoalTexts {
  /** HUD-Chip `goal`. */
  chip: string;
  /** `title` des HUD-Chips `goal` (mit Ausblick vor dem Sieg). */
  title: string;
  /** Ruhe-Ansicht `goal-text`. */
  rest: string;
  /** Ruhe-Ansicht `goal-next`; null = Zeile verborgen. */
  next: string | null;
  /** Breite des Zielbalkens in Prozent. */
  fillPct: number;
}

const pct = (current: number, target: number): number => Math.min(100, (current / target) * 100);

/** Texte der Zielanzeige je Phase (Tabelle Spec M8 14.1). */
export function goalTexts(view: GoalView): GoalTexts {
  const citizen = TIERS[3];
  const merchant = TIERS[4];
  switch (view.phase) {
    case 'citizens': {
      const lever =
        view.next.unlockCitizens === null ? '' : ` ab ${view.next.unlockCitizens} ${citizen.name}n`;
      const next = `Danach: ${view.next.tierName}${lever} — ${SECOND_GOAL_NAME} ${view.next.target}`;
      return {
        chip: `Ziel ${view.current} / ${view.target} ${citizen.name}`,
        title: `Ziel: ${view.target} ${citizen.name} — Einwohner der Stufe ${citizen.tier} und höher · ${next}`,
        rest: `${view.current} / ${view.target} ${citizen.name}`,
        next,
        fillPct: pct(view.current, view.target),
      };
    }
    case 'merchants':
      return {
        chip: `Ziel ${view.current} / ${view.target} ${merchant.name}`,
        title: `Zweites Ziel: ${view.target} ${merchant.name} — Einwohner der Stufe ${merchant.tier}`,
        rest: `${view.current} / ${view.target} ${merchant.name}`,
        next: null,
        fillPct: pct(view.current, view.target),
      };
    case 'done':
      return {
        chip: `${SECOND_GOAL_NAME} · ${view.current} ${merchant.name}`,
        title: 'Beide Ziele erreicht — freies Spiel',
        rest: `${SECOND_GOAL_NAME} erreicht · ${view.current} ${merchant.name}`,
        next: null,
        fillPct: 100,
      };
  }
}

/** Merkfelder: welche Zielbanner dieses Spiel schon gezeigt hat. */
export interface GoalShown {
  wonShown: boolean;
  wonMerchantsShown: boolean;
}

export const FIRST_GOAL_BANNER = `Ziel erreicht: ${WIN_CITIZENS} ${TIERS[3].name}! Das Spiel läuft weiter.`;
export const SECOND_GOAL_BANNER = `Zweites Ziel erreicht: ${WIN_MERCHANTS} ${TIERS[4].name}! Das Spiel läuft weiter.`;

/** Start und Laden: Erreichtes gilt als gezeigt (ein geladener Stand zeigt kein Banner erneut). */
export function initialGoalShown(world: Pick<World, 'won' | 'wonMerchants'>): GoalShown {
  return { wonShown: world.won, wonMerchantsShown: world.wonMerchants };
}

/** Banner, die jetzt erscheinen (erst erstes, dann zweites Ziel), und die neuen Merkfelder. Rein. */
export function goalBanners(
  shown: GoalShown,
  world: Pick<World, 'won' | 'wonMerchants'>,
): { texts: string[]; shown: GoalShown } {
  const texts: string[] = [];
  if (world.won && !shown.wonShown) texts.push(FIRST_GOAL_BANNER);
  if (world.wonMerchants && !shown.wonMerchantsShown) texts.push(SECOND_GOAL_BANNER);
  return {
    texts,
    shown: {
      wonShown: shown.wonShown || world.won,
      wonMerchantsShown: shown.wonMerchantsShown || world.wonMerchants,
    },
  };
}

const withKey = (id: BuildingDefId): string =>
  `${BUILDING_DEFS[id].name} (${hotkeyLabel({ kind: 'build', defId: id })})`;

/** Freischalt-Meldung (Spec M8 4.3 Punkt 5, Änderung S11); Namen, Tasten und Stufen aus den Defs. */
export const UNLOCK_NOTICE = `Neu freigeschaltet: ${withKey('bathhouse')} und ${withKey('glassworks')} — deine ${TIERS[3].name} wollen ${TIERS[4].name} werden`;

/** Merkfeld beim Start und nach dem Laden: true, wenn die Stufe schon frei ist (dann keine Meldung, Spec 4.3 Punkt 5). */
export function initialUnlockShown(world: World): boolean {
  return buildLock(world, 'bathhouse') === null;
}

/** Text genau beim Wechsel gesperrt → frei; `wasLocked` ist das Merkfeld aus `app.ts` (wie `wonShown`). */
export function unlockNotice(wasLocked: boolean, world: World): string | null {
  return wasLocked && buildLock(world, 'bathhouse') === null ? UNLOCK_NOTICE : null;
}

/** Gesperrte Taste oder gesperrter Eintrag (Spec M8 14.1, Offener Punkt 15 neu): „{Name}: {Grund}" oder null. */
export function lockedToolText(world: World, defId: BuildingDefId): string | null {
  const lock = buildLock(world, defId);
  return lock === null ? null : `${BUILDING_DEFS[defId].name}: ${friendlyReason(world, lock)}`;
}
