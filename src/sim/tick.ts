import type { World } from './types';

/** Ein Simulationsschritt. In M1 nur der Zähler; Systeme folgen in M2/M3. */
export function step(world: World): void {
  world.tick += 1;
}
