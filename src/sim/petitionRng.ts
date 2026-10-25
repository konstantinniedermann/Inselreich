import { PETITION_SALT } from './defs/petitions';
import { createRng } from './rng';

/** Eigener Strom der Bittschriften je (Seed, Tick); berührt nie den Stand anderer Ströme (Spec §3.2.4). */
export function petitionRng(seed: number, tick: number): () => number {
  return createRng((seed ^ Math.imul(tick + 1, PETITION_SALT)) >>> 0);
}
