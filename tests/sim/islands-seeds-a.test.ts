// M14-E1 Seed-Läufe a (Seeds 1…500): A/B bitgleich zur Referenz vor M14-E1 (AK-M14E1-12).
// Referenz schreiben (nur auf der Basis): M14E1_WRITE_AB=1 npx vitest run --no-file-parallelism tests/sim/islands-seeds-*.test.ts
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { afterAll, describe, expect, it } from 'vitest';
import { createWorld } from '../../src/sim/world';

const FIXTURE = new URL('./fixtures/m14e1-ab-hashes.json', import.meta.url);
const WRITE = process.env.M14E1_WRITE_AB === '1';
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
}

const range = (from: number, to: number): number[] =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i);
const BLOCKS = Array.from({ length: 5 }, (_, k) => range(1 + k * 100, 1 + k * 100 + 99));

describe('M14-E1 A/B bitgleich, Seeds 1…500', () => {
  it.each(BLOCKS)('AK-M14E1-12: Seeds (Block ab %i)', (...seeds) => {
    for (const seed of seeds) checkSeed(seed);
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
