// edictView.ts — rein, DOM-frei: Texte und Kartenzustand der Edikte (M13-E1, Spec 7.1). Alle Zahlen aus Defs und Sim-Abfragen.
import { EDICTS, EDICT_COST } from '../sim/defs/edicts';
import { GROWTH_INTERVAL } from '../sim/defs/timing';
import { activeEdict, edictReason } from '../sim/edicts';
import type { EdictId, World } from '../sim/types';
import { formatGameTime } from './time';

/** «Unterhalt −20 % · Steuer −7 Punkte» aus den Def-Werten, feste Reihenfolge. */
export function edictEffectText(id: EdictId): string {
  const d = EDICTS[id];
  const parts: string[] = [];
  if (d.upkeepPct < 100) parts.push(`Unterhalt −${100 - d.upkeepPct} %`);
  if (d.buyPct < 100) parts.push(`Kaufpreise am Kontor −${100 - d.buyPct} %`);
  if (d.growthInterval !== null)
    parts.push(
      `Wachstum alle ${formatGameTime(d.growthInterval)} statt ${formatGameTime(GROWTH_INTERVAL)}`,
    );
  if (d.upgradeWait !== null) parts.push(`Aufstieg nach ${formatGameTime(d.upgradeWait)}`);
  if (d.taxPoints > 0) parts.push(`Steuer −${d.taxPoints} Punkte`);
  return parts.join(' · ');
}

const WHEN: Record<EdictId, string> = {
  saving: 'lohnt, wenn die Kolonie steht und wenig kauft',
  trade: 'lohnt, wenn du Ware zukaufst',
  welfare: 'lohnt, wenn du viele neue Häuser hochziehst',
};

export function edictWhenText(id: EdictId): string {
  return WHEN[id];
}

export function edictLockText(w: World): string {
  const rest = w.edictLockedUntil - w.tick;
  return rest > 0 ? `wieder änderbar in ${formatGameTime(rest)}` : '';
}

export interface EdictCard {
  active: boolean;
  disabled: boolean;
  reason: string | null;
  buttonText: string;
}

/** Prüft nur (edictReason), führt nie setEdict aus. «Zu wenig Geld» sperrt die Karte nicht. */
export function edictCardState(w: World, id: EdictId): EdictCard {
  const active = w.edict === id;
  const reason = edictReason(w, active ? null : id);
  return {
    active,
    disabled: reason !== null && reason !== 'Zu wenig Geld',
    reason,
    buttonText: active ? 'Aufheben' : `Erlassen (${EDICT_COST})`,
  };
}

export function edictStatusLine(w: World): string {
  if (w.edict === null) return 'Kein Edikt';
  const name = EDICTS[w.edict].name;
  return activeEdict(w) !== null ? `Edikt: ${name}` : `Edikt ${name} ruht: Amtsstube wirkt nicht`;
}
