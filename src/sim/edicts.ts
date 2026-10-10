// Edikte der Amtsstube (M13-E1, Spec §3). Kein Zufall, wirft nie.
// Importiert nur './townhall', './types', './defs/*' (townhall.ts bleibt Blatt).
import { EDICTS, EDICT_COST, EDICT_UNLOCK } from './defs/edicts';
import { EDICT_LOCK } from './defs/timing';
import { townhallActive, townhallReason } from './townhall';
import { fail, ok } from './types';
import type { EdictDef, EdictId, Result, World } from './types';

/** R1.2: das Edikt wirkt nur mit aktiver Amtsstube; sonst ruht es (Zustand bleibt). */
export function activeEdict(w: World): EdictId | null {
  return townhallActive(w) ? w.edict : null;
}

export function activeEdictDef(w: World): EdictDef | null {
  const id = activeEdict(w);
  return id === null ? null : EDICTS[id];
}

const isEdictId = (id: unknown): id is EdictId =>
  typeof id === 'string' && Object.hasOwn(EDICTS, id);

/** Grund, den setEdict liefern würde (Spec R2, Schritte 1–6), oder null; ändert nichts. */
export function edictReason(w: World, id: unknown): string | null {
  if (id !== null && !isEdictId(id)) return 'Ungültiges Edikt';
  if (w[EDICT_UNLOCK] !== true) return 'Erst nach dem Bürger-Ziel';
  if (!townhallActive(w)) return townhallReason(w);
  if (id === w.edict) return id === null ? 'Kein Edikt aktiv' : 'Edikt bereits aktiv';
  if (w.tick < w.edictLockedUntil) return 'Edikt-Sperrzeit';
  if (id !== null && w.money < EDICT_COST) return 'Zu wenig Geld';
  return null;
}

/** Erlässt, wechselt oder hebt ein Edikt auf (id null). Aufheben kostet nichts, sperrt aber ebenfalls. */
export function setEdict(w: World, id: unknown): Result {
  const reason = edictReason(w, id);
  if (reason !== null) return fail(reason);
  if (id !== null) w.money -= EDICT_COST;
  w.edict = id as EdictId | null;
  w.edictLockedUntil = w.tick + EDICT_LOCK;
  return ok;
}
