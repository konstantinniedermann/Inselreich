// M14-E1 Seed-Läufe b (Seeds 501…1000): A/B bitgleich zur Referenz vor M14-E1 (AK-M14E1-12).
// Referenz schreiben (nur auf der Basis): M14E1_WRITE_AB=1 npx vitest run --no-file-parallelism tests/sim/islands-seeds-*.test.ts
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { generateForeignIslands, seaLanes, type IslandStage } from '../../src/sim/islands';
import type { IslandKind } from '../../src/sim/defs/sea';
import { createWorld, home } from '../../src/sim/world';

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
const written: Hashes = {};

const BAND_MIN = 30;
const BAND_MAX = 35;
const C_INDEX = 3;
const C_SIZE = 24;
const stage3Seeds = new Set<number>();

/** AK-M14E1-13/-14: C vorhanden und 24 × 24; Seeweg 0–3 im Band, ausser bei Stufe 3 (zählt, E7). */
function checkIslandC(w: ReturnType<typeof createWorld>, seed: number): void {
  expect(w.islands.length, `Seed ${seed} Inseln`).toBe(4);
  const c = w.islands[C_INDEX]!;
  expect([c.kind, c.width, c.height], `Seed ${seed} C`).toEqual(['C', C_SIZE, C_SIZE]);
  const stages: Partial<Record<IslandKind, IslandStage>> = {};
  generateForeignIslands(seed, home(w), {
    onStage: (kind, stage) => void (stages[kind] = stage),
  });
  if (stages.C === 3) stage3Seeds.add(seed);
  else {
    const lane = seaLanes(w.islands).find((l) => l.a === 0 && l.b === C_INDEX)!;
    expect(lane.d, `Seed ${seed} Seeweg 0-3`).toBeGreaterThanOrEqual(BAND_MIN);
    expect(lane.d, `Seed ${seed} Seeweg 0-3`).toBeLessThanOrEqual(BAND_MAX);
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
  if (!WRITE) checkIslandC(w, seed);
}

const range = (from: number, to: number): number[] =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i);
const BLOCKS = Array.from({ length: 5 }, (_, k) => range(501 + k * 100, 501 + k * 100 + 99));

describe('M14-E1 A/B bitgleich, Seeds 501…1000', () => {
  it.each(BLOCKS)(
    'AK-M14E1-12: Seeds (Block ab %i)',
    (...seeds) => {
      for (const seed of seeds) checkSeed(seed);
    },
    10_000,
  );

  it('AK-M14E1-12: Seed 963 und Pins 1, 3, 7, 13, 42', () => {
    for (const seed of [963, 1, 3, 7, 13, 42]) checkSeed(seed);
  });

  // AK-M14E1-14 verlangt höchstens 3 Stufe-3-Seeds über alle Seeds; gepinnt ist die gemessene Liste (strenger).
  it('AK-M14E1-14: Stufe-3-Seeds exakt [963] (Seeds 501…1000 und 963)', () => {
    expect([...stage3Seeds].sort((x, y) => x - y)).toEqual([963]);
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
