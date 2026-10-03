import { BUILDING_DEFS } from './defs/buildings';
import { STORM_TICK_DIVISOR } from './defs/crises';
import { EFF_MAX, EFF_WINDOW } from './defs/timing';
import { addStock, takeStock } from './economy';
import { cycleOf } from './levels';
import { siteRuleOk } from './placement';
import { serviceAvailable } from './population';
import type { Building, World } from './types';

/** Sturm wirkt (nach der Vorwarnung): Schritte `from … until` (Spec 6). */
const stormActive = (world: World): boolean =>
  world.crisis !== null && world.crisis.kind === 'storm' && world.tick >= world.crisis.from;

/** Spec 3.4: jede radius-Regel mit Wald muss live erfüllt sein (Holzfäller, Jagdhütte; nur freie Kacheln). */
const forestOk = (world: World, b: Building): boolean =>
  BUILDING_DEFS[b.defId].site.every(
    (r) =>
      r.kind !== 'radius' || r.terrain !== 'forest' || siteRuleOk(world, b.defId, b.x, b.y, r).ok,
  );

/** Ein Schritt eines Betriebs (Prüfreihenfolge Anhang 01 D); true, wenn progress in diesem Schritt gestiegen ist. */
function advance(world: World, b: Building): boolean {
  const def = BUILDING_DEFS[b.defId];
  const cycle = cycleOf(b);
  if (!def.produces || cycle === undefined) return false;
  if (b.outageUntil !== undefined) {
    b.state = 'burning'; // Ausfall hat Vorrang (Spec 10.1)
    return false;
  }
  if (!b.connected) {
    b.state = 'notConnected';
    return false;
  }
  const svc = def.requiresService;
  if (svc !== undefined && !serviceAvailable(world, b, svc)) {
    b.state = 'noService'; // kein Fortschritt, keine Entnahme; Unterhalt läuft weiter (Spec 5.5)
    return false;
  }
  if (!forestOk(world, b)) {
    b.state = 'noForest'; // kein Fortschritt, keine Entnahme, progress bleibt; Unterhalt läuft
    return false;
  }
  if (def.stormAffected === true && stormActive(world) && world.tick % STORM_TICK_DIVISOR !== 0)
    return false; // halbe Leistung: bei ungeradem Tick passiert nichts, der Zustand bleibt
  if (b.progress === 0 && def.consumes) {
    if (def.consumes.some((g) => world.stock[g] < 1)) {
      b.state = 'waitingInput';
      return false;
    }
    for (const g of def.consumes) takeStock(world, g, 1);
  }
  b.progress += 1;
  if (b.state !== 'storageFull') b.state = 'ok';
  if (b.progress >= cycle) {
    const accepted = addStock(world, def.produces, 1);
    b.state = accepted === 1 ? 'ok' : 'storageFull';
    b.progress = 0;
  }
  return true;
}

/**
 * Ein Produktionsschritt für alle Produktionsgebäude. Die Inputs werden einmal pro Zyklus bei progress 0
 * entnommen, atomar: nur wenn jedes Gut aus `consumes` mit Bestand ≥ 1 im Lager liegt, je 1 Einheit aller
 * Inputs; sonst nichts und `waitingInput` (M8 5.3). Ist das Lager voll, geht die Einheit verloren und der
 * Zustand storageFull bleibt bis zur nächsten eingelagerten Einheit. M11: jeder Betrieb führt die
 * Auslastung `eff` (gleitender Mittelwert über EFF_WINDOW Schritte, Spec 3.5).
 */
export function tickProduction(world: World): void {
  for (const b of Object.values(world.buildings)) {
    if (!BUILDING_DEFS[b.defId].produces) continue; // Häuser, Dienste, Markt: nie eff
    const advanced = advance(world, b);
    const target = advanced && b.state === 'ok' ? EFF_MAX : 0; // storageFull zählt 0
    const eff = b.eff ?? EFF_WINDOW * EFF_MAX;
    b.eff = eff - Math.floor(eff / EFF_WINDOW) + target;
  }
}
