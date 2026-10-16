// M14-E1 Seed-Läufe a (Seeds 1…500): A/B bitgleich zur Referenz vor M14-E1 (AK-M14E1-12).
// Referenz schreiben (nur auf der Basis): M14E1_WRITE_AB=1 npx vitest run --no-file-parallelism tests/sim/islands-seeds-*.test.ts
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import {
  generateForeignIslands,
  seaLanes,
  type IslandStage,
  type PlacedIsland,
} from '../../src/sim/islands';
import { canPlace } from '../../src/sim/placement';
import type { IslandKind } from '../../src/sim/defs/sea';
import { createWorld, home } from '../../src/sim/world';
import { foundKontor2Literal } from './seaHelpers';

const FIXTURE = join(process.cwd(), 'tests', 'sim', 'fixtures', 'm14e1-ab-hashes.json');
const nodeEnv = (globalThis as unknown as { process: { env: Record<string, string | undefined> } })
  .process.env;
const WRITE = nodeEnv.M14E1_WRITE_AB === '1';
type Hashes = Record<string, [string, string]>;

/** FNV-1a (32 Bit) als Hex. */
function fnv1a(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193) >>> 0;
  return h.toString(16).padStart(8, '0');
}

const reference: Hashes =
  !WRITE && existsSync(FIXTURE) ? JSON.parse(readFileSync(FIXTURE, 'utf8')) : {};
const QUARRY_SEEDS = 300;
const MIN_QUARRY_SITES = 3;
const written: Hashes = {};

const BAND_MIN = 30;
const BAND_MAX = 35;
const C_INDEX = 3;
const C_SIZE = 24;
const stage3Seeds = new Set<number>();

/** AK-M14E1-13/-14: C vorhanden und 24 × 24; Seeweg 0–3 im Band, ausser bei Stufe 3 (zählt, E7). */
function checkIslandC(w: ReturnType<typeof createWorld>, seed: number): PlacedIsland[] {
  expect(w.islands.length, `Seed ${seed} Inseln`).toBe(4);
  const c = w.islands[C_INDEX]!;
  expect([c.kind, c.width, c.height], `Seed ${seed} C`).toEqual(['C', C_SIZE, C_SIZE]);
  const stages: Partial<Record<IslandKind, IslandStage>> = {};
  const gen = generateForeignIslands(seed, home(w), {
    onStage: (kind, stage) => void (stages[kind] = stage),
  });
  if (stages.C === 3) stage3Seeds.add(seed);
  else {
    const lane = seaLanes(w.islands).find((l) => l.a === 0 && l.b === C_INDEX)!;
    expect(lane.d, `Seed ${seed} Seeweg 0-3`).toBeGreaterThanOrEqual(BAND_MIN);
    expect(lane.d, `Seed ${seed} Seeweg 0-3`).toBeLessThanOrEqual(BAND_MAX);
  }
  return gen;
}
const TERRAIN_SEEDS = 300;
const MIN_PLANTATION_SITES = 6;

/** AK-M14E1-16: kein Gebirge auf C, mindestens 6 Plantagenplätze, auch mit Ersatzform (`failShapes`). */
function checkTerrainC(w: ReturnType<typeof createWorld>, gen: PlacedIsland[], seed: number): void {
  expect(
    w.islands[C_INDEX]!.tiles.some((t) => t.terrain === 'mountain'),
    `Seed ${seed} Gebirge auf C`,
  ).toBe(false);
  const fallback = generateForeignIslands(seed, home(w), { failShapes: true })[C_INDEX - 1]!;
  for (const c of [gen[C_INDEX - 1]!, fallback]) {
    expect(c.terrain.includes('mountain'), `Seed ${seed} Gebirge (Form)`).toBe(false);
    expect(c.plantationSites.length, `Seed ${seed} Plantagenplätze`).toBeGreaterThanOrEqual(
      MIN_PLANTATION_SITES,
    );
  }
}

/** Hash von Insel 1 (A) und 2 (B) der frisch erzeugten Welt. */
function abHashes(w: ReturnType<typeof createWorld>): [string, string] {
  return [fnv1a(JSON.stringify(w.islands[1])), fnv1a(JSON.stringify(w.islands[2]))];
}

/** Ein createWorld je Seed; hier hängen weitere Seed-Prüfungen (T05) im selben Durchlauf. */
function checkSeed(seed: number): void {
  const w = createWorld(seed, { unlockAll: true });
  const hashes = abHashes(w);
  if (WRITE) written[String(seed)] = hashes;
  else expect(hashes, `Seed ${seed} A/B`).toEqual(reference[String(seed)]);
  if (WRITE) return;
  const gen = checkIslandC(w, seed);
  if (seed <= TERRAIN_SEEDS) checkTerrainC(w, gen, seed);
  if (seed <= QUARRY_SEEDS) checkQuarrySites(w, seed);
}

/** AK-M14E1-17: nach dem Kontor II hat die Felsbucht mindestens 3 Steinbruch-Plätze. */
function checkQuarrySites(w: ReturnType<typeof createWorld>, seed: number): void {
  foundKontor2Literal(w, 2); // nach dem Hash: verändert die Insel
  const isl = w.islands[2]!;
  let sites = 0;
  for (let y = 0; y < isl.height; y++)
    for (let x = 0; x < isl.width; x++) if (canPlace(w, 'quarry', x, y, 2).ok) sites++;
  expect(sites, `Seed ${seed} Steinbruch-Plätze Felsbucht`).toBeGreaterThanOrEqual(
    MIN_QUARRY_SITES,
  );
}

const range = (from: number, to: number): number[] =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i);
// Zeitreserve (R593): Blöcke à 50 statt 100 Seeds, gleiche Stichprobe 1…500, halbe Laufzeit je Test.
const BLOCK_SIZE = 50;
const BLOCKS = Array.from({ length: 10 }, (_, k) =>
  range(1 + k * BLOCK_SIZE, (k + 1) * BLOCK_SIZE),
);

describe('M14-E1 A/B bitgleich, Seeds 1…500', () => {
  it.each(BLOCKS)(
    'AK-M14E1-12: Seeds (Block ab %i)',
    (...seeds) => {
      for (const seed of seeds) checkSeed(seed);
    },
    10_000,
  );

  // AK-M14E1-14 verlangt höchstens 3 Stufe-3-Seeds über alle Seeds; gepinnt ist die gemessene Liste (strenger).
  it('AK-M14E1-14: Stufe-3-Seeds exakt [] (Seeds 1…500)', () => {
    expect([...stage3Seeds].sort((x, y) => x - y)).toEqual([]);
  });

  afterAll(() => {
    if (!WRITE) return;
    const old: Hashes = existsSync(FIXTURE) ? JSON.parse(readFileSync(FIXTURE, 'utf8')) : {};
    const merged = { ...old, ...written };
    const sorted = Object.fromEntries(
      Object.entries(merged).sort(([a], [b]) => Number(a) - Number(b)),
    );
    writeFileSync(FIXTURE, JSON.stringify(sorted, null, 1) + '\n');
  });
});
