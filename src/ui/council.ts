import { openCouncilTiers } from '../sim/council';
import { COUNCIL, COUNCIL_NOTE, COUNCIL_TIERS } from '../sim/defs/council';
import type { CouncilSide, CouncilTier, World } from '../sim/types';

/* DOM-freie Helfer für den Ratsbeschluss (I-112): Marke, Karten, Hinweis, Taste. Keine Spielwerte hier. */

/** Taste für das Rats-Fenster (alle Buchstaben belegt, `r` = Weg; Muster wie Umschalt + U). */
export const COUNCIL_KEY = 'Umschalt + R';

export interface CouncilCard {
  side: CouncilSide;
  name: string;
  text: string;
}

export interface CouncilView {
  open: { tier: CouncilTier; cards: CouncilCard[] }[];
  decided: string[];
  note: string;
}

/** Text der Kopfzeilen-Marke; `null`, solange kein Beschluss je offen war. */
export function councilBadge(world: World): string | null {
  const open = openCouncilTiers(world).length;
  if (open > 0) return `Rat · ${open}`;
  return COUNCIL_TIERS.some((t) => world.council[t] !== null) ? 'Rat' : null;
}

/** Umschalt+R wirkt nur mit Marke: ohne je offenen Beschluss bliebe die Rats-Karte leer. */
export const councilToggleAllowed = (world: World): boolean => councilBadge(world) !== null;

/** Marke hervorheben, solange ein Beschluss ansteht. */
export const councilBadgeActive = (world: World): boolean => openCouncilTiers(world).length > 0;

/** Inhalt des Rats-Fensters: offene Stufen mit zwei Karten, gefasste Beschlüsse als Zeilen. */
export function councilCards(world: World): CouncilView {
  const sides: CouncilSide[] = ['A', 'B'];
  const open = openCouncilTiers(world).map((tier) => ({
    tier,
    cards: sides.map((side) => ({
      side,
      name: COUNCIL[tier][side].name,
      text: COUNCIL[tier][side].text,
    })),
  }));
  const decided: string[] = [];
  for (const t of COUNCIL_TIERS) {
    const s = world.council[t];
    if (s === 'A' || s === 'B') decided.push(`Stufe ${t}: ${COUNCIL[t][s].name}`);
  }
  return { open, decided, note: COUNCIL_NOTE };
}

/** Stufen, die von `null` auf `'open'` wechselten; `prev === null` (Laden) meldet nichts. */
export function councilOpened(
  prev: World['council'] | null,
  next: World['council'],
): CouncilTier[] {
  if (prev === null) return [];
  return COUNCIL_TIERS.filter((t) => prev[t] === null && next[t] === 'open');
}

/** Offen-Zustand der Rats-Karte: Umschalt+R und Marke schalten um, Esc schliesst. */
export function councilOpenNext(open: boolean, ev: 'toggle' | 'escape'): boolean {
  return ev === 'toggle' ? !open : false;
}

/** Esc zuerst an die offene Rats-Karte; `true` = verbraucht, der übrige Esc-Weg läuft nicht. */
export const councilEscapeHandled = (open: boolean): boolean => open;
