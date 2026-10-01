import { BUILDING_DEFS } from './defs/buildings';
import { addStock, takeStock } from './economy';
import type { World } from './types';

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
