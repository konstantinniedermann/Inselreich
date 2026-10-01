import { BUILDING_DEFS } from './defs/buildings';
import { STORM_TICK_DIVISOR } from './defs/crises';
import { addStock, takeStock } from './economy';
import type { World } from './types';

/** Sturm wirkt (nach der Vorwarnung): Schritte `from … until` (Spec 6). */
const stormActive = (world: World): boolean =>
  world.crisis !== null && world.crisis.kind === 'storm' && world.tick >= world.crisis.from;

/**
 * Ein Produktionsschritt für alle Produktionsgebäude. Input wird einmal pro Zyklus
 * bei progress 0 entnommen; ist das Lager voll, geht die Einheit verloren
 * und der Zustand storageFull bleibt bis zur nächsten eingelagerten Einheit.
 */
export function tickProduction(world: World): void {
  for (const b of Object.values(world.buildings)) {
    const def = BUILDING_DEFS[b.defId];
    if (!def.produces || def.cycle === undefined) continue;
    if (b.outageUntil !== undefined) {
      b.state = 'burning'; // Ausfall hat Vorrang (Spec 10.1)
      continue;
    }
    if (!b.connected) {
      b.state = 'notConnected';
      continue;
    }
    if (def.stormAffected === true && stormActive(world) && world.tick % STORM_TICK_DIVISOR !== 0)
      continue; // halbe Leistung: bei ungeradem Tick passiert nichts, der Zustand bleibt
    if (b.progress === 0 && def.consumes && !takeStock(world, def.consumes, 1)) {
      b.state = 'waitingInput';
      continue;
    }
    b.progress += 1;
    if (b.state !== 'storageFull') b.state = 'ok';
    if (b.progress >= def.cycle) {
      const accepted = addStock(world, def.produces, 1);
      b.state = accepted === 1 ? 'ok' : 'storageFull';
      b.progress = 0;
    }
  }
}
