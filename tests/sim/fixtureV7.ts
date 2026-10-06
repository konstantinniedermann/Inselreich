// Rezept für save-v7.json (M12 E1 Schritt 0, Anhang 03 B): gleicher Lauf wie save-v6.json, auf v7-Code.
import type { World } from '../../src/sim/types';
import { fixtureV6Run } from './fixtureV6';

/** Stand save-v7.json: Rezept von save-v6.json (Tick 3000, Brand, Auftrag, Sperren) auf dem v7-Code. */
export function fixtureV7Run(): World {
  return fixtureV6Run().w;
}
