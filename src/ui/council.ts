import { maxInhabitantsOf, openCouncilTiers } from '../sim/council';
import { BUILDING_DEFS } from '../sim/defs/buildings';
import { TIERS } from '../sim/defs/tiers';
import { COUNCIL, COUNCIL_NOTE, COUNCIL_TIERS } from '../sim/defs/council';
import type { LogEntry } from './crisisLog';
import type { CouncilSide, CouncilTier, World } from '../sim/types';

/* DOM-freie Helfer für den Ratsbeschluss (I-112): Marke, Karten, Hinweis, Taste. Keine Spielwerte hier. */

/** Taste für das Rats-Fenster (alle Buchstaben belegt, `r` = Weg; Muster wie Umschalt + U). */
export const COUNCIL_KEY = 'Umschalt + R';

export interface CouncilCard {
  side: CouncilSide;
  name: string;
  text: string;
  /** Wirkung auf den aktuellen Bestand (I-138). */
  preview: string;
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

/**
 * Wirkung eines Beschlusses auf den heutigen Bestand (I-138): zählt alle Gebäude der Art auf allen
 * Inseln (die Sim kennt keine Baustellen; ein Gebäude in `world.buildings` steht).
 */
export function councilPreview(world: World, tier: CouncilTier, side: CouncilSide): string {
  const lever = COUNCIL[tier][side].lever;
  const all = Object.values(world.buildings);
  if (lever.kind === 'maxInhabitants') {
    const n = all.filter((b) => b.house?.tier === lever.tier).length;
    if (n === 0) return `Wirkt noch nicht: Haus (${TIERS[lever.tier].name}) fehlt`;
    const plus = n * (lever.value - maxInhabitantsOf(world, lever.tier));
    return `Betrifft jetzt: ${n} Häuser (+${plus} Plätze)`;
  }
  const name = BUILDING_DEFS[lever.defId].name;
  const n = all.filter((b) => b.defId === lever.defId).length;
  return n === 0 ? `Wirkt noch nicht: ${name} fehlt` : `Betrifft jetzt: ${n} × ${name}`;
}

/** Inhalt des Rats-Fensters: offene Stufen mit zwei Karten, gefasste Beschlüsse als Zeilen. */
export function councilCards(world: World): CouncilView {
  const sides: CouncilSide[] = ['A', 'B'];
  const open = openCouncilTiers(world).map((tier) => ({
    tier,
    cards: sides.map((side) => ({
      side,
      name: COUNCIL[tier][side].name,
      text: COUNCIL[tier][side].text,
      preview: councilPreview(world, tier, side),
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

/** Stufen, die von `'open'` auf `'A'`/`'B'` wechselten; `prev === null` (Laden) meldet nichts. */
export function councilDecided(
  prev: World['council'] | null,
  next: World['council'],
): CouncilTier[] {
  if (prev === null) return [];
  return COUNCIL_TIERS.filter((t) => prev[t] === 'open' && (next[t] === 'A' || next[t] === 'B'));
}

/** Ereignis-Log-Einträge für frisch gefasste Beschlüsse, in Stufenfolge; ohne Toast und Ziel. */
export function councilDecidedEntries(
  prev: World['council'] | null,
  next: World['council'],
  tick: number,
): LogEntry[] {
  return councilDecided(prev, next).map((t) => {
    const side = next[t] as CouncilSide;
    return { text: `Rat beschliesst: ${COUNCIL[t][side].name}`, toast: null, tick };
  });
}

/** Chronik-Zeile der Ruhe-Ansicht; `null`, solange kein Beschluss je offen war. */
export function councilChronicleLine(world: World): string | null {
  if (councilBadge(world) === null) return null;
  const open = openCouncilTiers(world).length;
  const names: string[] = [];
  for (const t of COUNCIL_TIERS) {
    const s = world.council[t];
    if (s === 'A' || s === 'B') names.push(COUNCIL[t][s].name);
  }
  if (names.length === 0)
    return open === 1 ? 'Rat: 1 Beschluss offen' : `Rat: ${open} Beschlüsse offen`;
  const base = `Rat: ${names.join(' · ')}`;
  return open > 0 ? `${base} — ${open} offen` : base;
}

/** Offen-Zustand der Rats-Karte: Umschalt+R und Marke schalten um, Esc schliesst. */
export function councilOpenNext(open: boolean, ev: 'toggle' | 'escape'): boolean {
  return ev === 'toggle' ? !open : false;
}

/** Esc zuerst an die offene Rats-Karte; `true` = verbraucht, der übrige Esc-Weg läuft nicht. */
export const councilEscapeHandled = (open: boolean): boolean => open;
