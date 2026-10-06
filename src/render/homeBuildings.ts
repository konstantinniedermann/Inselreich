import type { Building, World } from '../sim/types';
import { HOME } from '../sim/world';

/**
 * Gebäude der Heimatinsel. `world.buildings` enthält auch Fremdinsel-Gebäude (lokale Inselkoordinaten, `island`
 * ≠ HOME); auf der Heimat gezeichnet, gepickt oder gezählt würden sie als Geisterbauten erscheinen.
 * Fremdinsel-Ansichten (`islandView`) tragen ihre Kopien mit `island` HOME und bleiben davon unberührt.
 */
export const homeBuildings = (world: World): Building[] =>
  Object.values(world.buildings).filter((b) => b.island === HOME);
