// Zieltexte und Banner (Spec M8 14.1): rein, ohne DOM. Zahlen und Namen aus `goalView` und `defs`.
import type { Tool } from '../render/renderer';
import { BUILDING_DEFS, BUILDING_IDS } from '../sim/defs/buildings';
import { FUNCTION_LABELS, UNLOCKS } from '../sim/defs/unlocks';
import { GOODS } from '../sim/defs/goods';
import { TICK_MS } from '../sim/defs/timing';
import {
  TIERS,
  WIN_CITIZENS,
  WIN_MERCHANTS,
  WIN_SPICE_HOLD,
  WIN_SPICE_MERCHANTS,
} from '../sim/defs/tiers';
import { buildLock, buildingShown, functionLock } from '../sim/unlocks';
import type { GoalView } from '../sim/queries';
import type { BuildingDefId, UnlockDef, UnlockId, World } from '../sim/types';
import { friendlyReason } from './hints';
import { ISLAND_CYCLE_KEY, hotkeyLabel, toolName } from './hotkeys';

/** Name des zweiten Ziels (Setzung Spec M8 7). */
export const SECOND_GOAL_NAME = 'Handelsstadt';
/** Name des dritten Ziels (UI-Text, Anhang 05 F). */
export const THIRD_GOAL_NAME = 'Gewürzstadt';

/** Haltedauer des dritten Ziels in Spielsekunden bei 1× (Ticks · Tick-Länge). */
const SPICE_HOLD_SECONDS = (WIN_SPICE_HOLD * TICK_MS) / 1000;

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
        next: `Danach: ${THIRD_GOAL_NAME} — ${WIN_SPICE_MERCHANTS} ${merchant.name} mit ${GOODS.spice.name} von einer fernen Insel`,
        fillPct: pct(view.current, view.target),
      };
    case 'spice':
      return {
        chip: `Ziel ${view.current} / ${view.target} ${merchant.name} mit ${GOODS.spice.name}`,
        title: `Drittes Ziel: ${view.target} ${merchant.name}, ${SPICE_HOLD_SECONDS} s voll versorgt — ${GOODS.spice.name} per Schiff von deiner eigenen Plantage`,
        rest: `${view.current} / ${view.target} ${merchant.name} mit ${GOODS.spice.name}`,
        next: view.loop
          ? null
          : `Fehlt: Schiffsroute, die ${GOODS.spice.name} von deiner Plantage heimholt`,
        fillPct: pct(view.current, view.target),
      };
    case 'done':
      return {
        chip: `${THIRD_GOAL_NAME} · ${view.current} ${merchant.name}`,
        title: 'Alle drei Ziele erreicht — freies Spiel',
        rest: `${THIRD_GOAL_NAME} erreicht · ${view.current} ${merchant.name}`,
        next: null,
        fillPct: 100,
      };
  }
}

/** Merkfelder: welche Zielbanner dieses Spiel schon gezeigt hat. */
export interface GoalShown {
  wonShown: boolean;
  wonMerchantsShown: boolean;
  /** Optional, weil `app.ts` das Feld erst mit T15 kopiert; `undefined` gilt als „nicht gezeigt". */
  wonSpiceShown?: boolean;
}

export const FIRST_GOAL_BANNER = `Ziel erreicht: ${WIN_CITIZENS} ${TIERS[3].name}! Das Spiel läuft weiter.`;
export const SECOND_GOAL_BANNER = `Zweites Ziel erreicht: ${WIN_MERCHANTS} ${TIERS[4].name}! Das Spiel läuft weiter.`;
/** Flexion Dativ Plural wie bei „Bürgern“: Stufenname + „n“ (Kaufleute → Kaufleuten). */
export const THIRD_GOAL_BANNER = `Drittes Ziel erreicht: ${THIRD_GOAL_NAME} mit ${WIN_SPICE_MERCHANTS} ${TIERS[4].name}n! Das Spiel läuft weiter.`;

/** Start und Laden: Erreichtes gilt als gezeigt (ein geladener Stand zeigt kein Banner erneut). */
export function initialGoalShown(
  world: Pick<World, 'won' | 'wonMerchants' | 'wonSpice'>,
): GoalShown {
  return {
    wonShown: world.won,
    wonMerchantsShown: world.wonMerchants,
    wonSpiceShown: world.wonSpice,
  };
}

/** Übernimmt die neuen Merkfelder in den Spielzustand (alle drei Banner; sonst erscheint ein Banner je Frame neu). */
export function applyGoalShown(target: GoalShown, shown: GoalShown): void {
  target.wonShown = shown.wonShown;
  target.wonMerchantsShown = shown.wonMerchantsShown;
  target.wonSpiceShown = shown.wonSpiceShown ?? false;
}

/** Banner, die jetzt erscheinen (erstes, zweites, drittes Ziel), und die neuen Merkfelder. Rein. */
export function goalBanners(
  shown: GoalShown,
  world: Pick<World, 'won' | 'wonMerchants' | 'wonSpice'>,
): { texts: string[]; shown: GoalShown } {
  const texts: string[] = [];
  if (world.won && !shown.wonShown) texts.push(FIRST_GOAL_BANNER);
  if (world.wonMerchants && !shown.wonMerchantsShown) texts.push(SECOND_GOAL_BANNER);
  if (world.wonSpice && !(shown.wonSpiceShown ?? false)) texts.push(THIRD_GOAL_BANNER);
  return {
    texts,
    shown: {
      wonShown: shown.wonShown || world.won,
      wonMerchantsShown: shown.wonMerchantsShown || world.wonMerchants,
      wonSpiceShown: (shown.wonSpiceShown ?? false) || world.wonSpice,
    },
  };
}

const withKey = (id: BuildingDefId): string => {
  const k = hotkeyLabel({ kind: 'build', defId: id });
  return k === null ? BUILDING_DEFS[id].name : `${BUILDING_DEFS[id].name} (${k})`;
};

/** Freischalt-Meldung (Spec M8 4.3 Punkt 5, Änderung S11); Namen, Tasten und Stufen aus den Defs. */
export const UNLOCK_NOTICE = `Neu freigeschaltet: ${withKey('bathhouse')}, ${withKey('glassworks')} und ${FUNCTION_LABELS.seafaring[0]} (Inseln: ${ISLAND_CYCLE_KEY}) — deine ${TIERS[3].name} wollen ${TIERS[4].name} werden; ${TIERS[4].name} brauchen ${GOODS.spice.name} von fernen Inseln`;

/** Forst-Werkzeuge in `FUNCTION_LABELS.forest`-Reihenfolge (Roden, Aufforsten); Tasten aus `hotkeyLabel`. */
const FOREST_TOOLS: readonly Tool[] = [{ kind: 'clearForest' }, { kind: 'plantForest' }];

/** Namen mit Taste, die ein Freischalt-Eintrag neu in die Bedienung bringt (Gebäude, dann Funktionen). */
function entryNames(world: World, def: UnlockDef): string[] {
  const buildings = BUILDING_IDS.filter(
    (id) => def.buildings.includes(id) && buildingShown(world, id),
  ).map(withKey);
  const functions = def.functions.flatMap((f) =>
    f === 'forest'
      ? FUNCTION_LABELS.forest.map(
          (label, i) => `${label} (${hotkeyLabel(FOREST_TOOLS[i]!) ?? '?'})`,
        )
      : [...FUNCTION_LABELS[f]],
  );
  return [...buildings, ...functions];
}

/**
 * Freischalt-Meldung (Spec 11.6): neue Einträge = `world.unlocked` ohne `prev`; keine → `null`;
 * nur U6 → die M8-Meldung; sonst „Neu: {Namen} — {Satz des letzten Eintrags}. Mehr unter Hilfe (?)".
 */
export function unlockNoticeText(prev: readonly UnlockId[], world: World): string | null {
  const fresh = UNLOCKS.filter((u) => world.unlocked.includes(u.id) && !prev.includes(u.id));
  if (fresh.length === 0) return null;
  if (fresh.length === 1 && fresh[0]!.id === 'U6') return UNLOCK_NOTICE;
  const names = fresh.flatMap((u) => entryNames(world, u));
  return `Neu: ${names.join(', ')} — ${fresh[fresh.length - 1]!.notice}. Mehr unter Hilfe (?)`;
}

/** Je Frame: Meldung gegen den Stand am Frame-Anfang (`seen`) und das neue Merkfeld. Rein. */
export function frameUnlock(
  seen: readonly UnlockId[],
  world: World,
): { text: string | null; seen: UnlockId[] } {
  return { text: unlockNoticeText(seen, world), seen: [...world.unlocked] };
}

/** Gesperrte Taste oder gesperrter Eintrag (Spec 11.2): „{Name}: {Grund}" oder null; Bau- und Forst-Werkzeuge. */
export function lockedToolText(world: World, tool: Tool): string | null {
  if (tool.kind === 'clearForest' || tool.kind === 'plantForest') {
    const lock = functionLock(world, 'forest');
    return lock === null ? null : `${toolName(tool)}: ${friendlyReason(world, lock)}`;
  }
  if (tool.kind !== 'build') return null;
  const name = BUILDING_DEFS[tool.defId].name;
  const lock = buildLock(world, tool.defId);
  if (lock !== null) return `${name}: ${friendlyReason(world, lock)}`;
  return buildingShown(world, tool.defId) ? null : `${name}: ohne Krisen nicht nötig`;
}
