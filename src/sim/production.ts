import { BUILDING_DEFS } from './defs/buildings';
import { STORM_TICK_DIVISOR } from './defs/crises';
import { addStock, takeStock } from './economy';
import { cycleOf } from './levels';
import { serviceAvailable } from './population';
import type { World } from './types';

/** Sturm wirkt (nach der Vorwarnung): Schritte `from … until` (Spec 6). */
const stormActive = (world: World): boolean =>
  world.crisis !== null && world.crisis.kind === 'storm' && world.tick >= world.crisis.from;

/**
 * Ein Produktionsschritt für alle Produktionsgebäude. Die Inputs werden einmal pro Zyklus bei progress 0
 * entnommen, atomar: nur wenn jedes Gut aus `consumes` mit Bestand ≥ 1 im Lager liegt, je 1 Einheit aller
 * Inputs; sonst nichts und `waitingInput` (M8 5.3). Ist das Lager voll, geht die Einheit verloren und der
 * Zustand storageFull bleibt bis zur nächsten eingelagerten Einheit.
 */
export function tickProduction(world: World): void {
  for (const b of Object.values(world.buildings)) {
    const def = BUILDING_DEFS[b.defId];
    const cycle = cycleOf(b);
    if (!def.produces || cycle === undefined) continue;
    if (b.outageUntil !== undefined) {
      b.state = 'burning'; // Ausfall hat Vorrang (Spec 10.1)
      continue;
    }
    if (!b.connected) {
      b.state = 'notConnected';
      continue;
    }
    const svc = def.requiresService;
    if (svc !== undefined && !serviceAvailable(world, b, svc)) {
      b.state = 'noService'; // kein Fortschritt, keine Entnahme; Unterhalt läuft weiter (Spec 5.5)
      continue;
    }
    if (def.stormAffected === true && stormActive(world) && world.tick % STORM_TICK_DIVISOR !== 0)
      continue; // halbe Leistung: bei ungeradem Tick passiert nichts, der Zustand bleibt
    if (b.progress === 0 && def.consumes) {
      if (def.consumes.some((g) => world.stock[g] < 1)) {
        b.state = 'waitingInput';
        continue;
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
  }
}
