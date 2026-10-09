import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { hash2 } from '../../src/sim/noise';
import { createWorld, home } from '../../src/sim/world';
import type { World } from '../../src/sim/types';
import {
  CRATE_P,
  ISLET_P,
  NEEDLE_P,
  RARE_CAP,
  RARE_POOL,
  WRECK_P,
  kontorPos,
  rareBudget,
  rareSites,
  type RareSite,
} from '../../src/render/decor';

// ART-L8-SELTEN T0b/T1: Seltenheitsbudget. Aufbau einmal in beforeAll (Seeds 1–40); die Meer-Lose werden hier
// unabhängig von `rareBudget` aus den Salzen 565–568 gezählt (Wrack 566, Felsnadel 567, Eiland 568, Kiste 565).

const SEEDS = Array.from({ length: 40 }, (_, i) => i + 1);
type Lots = { wreck: boolean; needle: boolean; islet: boolean; crate: boolean };
const lotsOf = (s: number): Lots => ({
  wreck: hash2(s + 566, 0, 0) < WRECK_P,
  needle: hash2(s + 567, -1, -1) < NEEDLE_P,
  islet: hash2(s + 568, 0, 0) < ISLET_P,
  crate: hash2(s + 565, 0, 0) < CRATE_P,
});
const mOf = (l: Lots): number =>
  Number(l.wreck) + Number(l.needle) + Number(l.islet) + Number(l.crate);
const CATALOG = [...RARE_POOL.map((d) => d.id as string), 'wreck', 'needle', 'islet', 'crate'];

interface Fixture {
  [seed: string]: { id: string; x: number; y: number; n: number }[];
}

let worlds: World[] = [];
let sites: (readonly RareSite[])[] = [];
let lots: Lots[] = [];
let artsOf: Set<string>[] = [];
let fixture: Fixture;

beforeAll(() => {
  worlds = SEEDS.map((s) => createWorld(s));
  sites = worlds.map((w) => rareSites(w.seed, home(w), kontorPos(home(w), w.buildings)));
  lots = worlds.map((w) => lotsOf(w.seed));
  artsOf = SEEDS.map((_, i) => {
    const a = new Set<string>(sites[i]!.map((t) => t.id));
    for (const k of ['wreck', 'needle', 'islet', 'crate'] as const) if (lots[i]![k]) a.add(k);
    return a;
  });
  fixture = JSON.parse(
    readFileSync(new URL('./fixtures/rareSites.json', import.meta.url).pathname, 'utf8'),
  ) as Fixture;
});

describe('ART-L8-SELTEN T1 Seltenheitsbudget', () => {
  it('AK1 Seeds 1–40: jede Insel hat 3–6 S/E-Elemente (Land-Orte + bestandene Meer-Lose)', () => {
    SEEDS.forEach((s, i) => {
      const sum = sites[i]!.length + mOf(lots[i]!);
      expect(sum, `Seed ${s}`).toBeGreaterThanOrEqual(3);
      expect(sum, `Seed ${s}`).toBeLessThanOrEqual(RARE_CAP);
    });
  });

  it('AK2 keine Insel hat alle 10 Arten; Summe nie über RARE_CAP', () => {
    SEEDS.forEach((s, i) => {
      expect(artsOf[i]!.size, `Seed ${s}`).toBeLessThan(CATALOG.length);
      expect(artsOf[i]!.size, `Seed ${s}`).toBeLessThanOrEqual(RARE_CAP);
    });
  });

  it('AK3 Seeds 1–40 Grobband: jedes Element liegt in seiner Quote ±25 pp', () => {
    const soll: Record<string, number> = {
      wreck: WRECK_P,
      needle: NEEDLE_P,
      islet: ISLET_P,
      crate: CRATE_P,
    };
    for (const d of RARE_POOL) soll[d.id] = d.p;
    for (const [id, p] of Object.entries(soll)) {
      const q = artsOf.filter((a) => a.has(id)).length / SEEDS.length;
      expect(Math.abs(q - p), `${id} Quote ${q.toFixed(2)} Soll ${p}`).toBeLessThanOrEqual(0.25);
    }
  });

  it('AK4 5 zufällige Seeds zeigen im Mittel >= 70 % des Katalogs (fester Seed-Strom)', () => {
    let total = 0;
    const runs = 200;
    for (let r = 0; r < runs; r++) {
      const seen = new Set<string>();
      for (let k = 0; k < 5; k++) {
        const i = Math.floor(hash2(9000 + r, k, 17) * SEEDS.length);
        for (const a of artsOf[i]!) seen.add(a);
      }
      total += seen.size / CATALOG.length;
    }
    expect(total / runs).toBeGreaterThanOrEqual(0.7);
  });

  it('AK5 rareBudget(seed) zählt die Meer-Lose und braucht keinen SeaContext', () => {
    expect(rareBudget.length).toBe(1);
    SEEDS.forEach((s, i) => {
      const before = rareBudget(worlds[i]!.seed);
      expect(before, `Seed ${s}`).toBe(mOf(lots[i]!));
    });
  });

  it('AK5b Arten ohne Kappenwirkung bleiben: erste min(n, 6 - m) Einträge der alten Liste unverändert', () => {
    SEEDS.forEach((s, i) => {
      const old = fixture[String(s)]!;
      const keep = Math.min(old.length, RARE_CAP - mOf(lots[i]!));
      const now = sites[i]!.slice(0, keep).map((t) => ({ id: t.id, x: t.x, y: t.y, n: t.n }));
      expect(now, `Seed ${s}`).toEqual(old.slice(0, keep));
    });
  });
});

describe('ART-L8-SELTEN T1 Salze', () => {
  it('D5 der Bereich 595–597 steht im Kopf von decor.ts und im Code', () => {
    const src = readFileSync(
      new URL('../../src/render/decor.ts', import.meta.url).pathname,
      'utf8',
    );
    const head = src.slice(0, src.indexOf('export const DECOR_REACH'));
    expect(head).toContain('Salze 595–597');
    expect(src).toContain('[595, 596, 597]');
  });
});
