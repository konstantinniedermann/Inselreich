import { readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { drawStatusMarks } from '../../src/render/statusMarks';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import type { Building, BuildingDefId, BuildingState } from '../../src/sim/types';
import { createWorld } from '../../src/sim/world';
import { fakeCtx } from './fakeCtx';

// L3-T1 Signale (Q5): Die Statusmarken (Farben, Lage) bleiben von den Gebäudekanten unberührt. Die Fixture
// entstand auf dem Basisstand vor L3 (b7b3108). Neu erzeugen nur nach bewusster Änderung von `statusMarks.ts`:
// `it.skip` unten auf `it` stellen, einmal laufen lassen, wieder auf `it.skip` setzen.

const FIXTURE = 'tests/render/fixtures/status-marks.json';
const STATES: BuildingState[] = [
  'waitingInput',
  'storageFull',
  'noService',
  'noForest',
  'burning',
  'ok',
];
const RANGE = { x0: 0, y0: 0, x1: 63, y1: 63 };

const fnv = (s: string): number => {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193) >>> 0;
  return h;
};

function compute(): Record<string, { hash: number; length: number; marks: number }> {
  const out: Record<string, { hash: number; length: number; marks: number }> = {};
  for (const zoom of [1, 2])
    for (const defId of Object.keys(BUILDING_DEFS) as BuildingDefId[])
      for (const state of STATES) {
        const world = createWorld(3);
        const b: Building = {
          id: 1001,
          defId,
          x: 10,
          y: 10,
          connected: true,
          progress: 0,
          state,
          island: 0,
        };
        world.buildings[b.id] = b;
        const { ctx, log } = fakeCtx();
        const marks = drawStatusMarks(ctx, world, { x: 0, y: 0, zoom }, RANGE, 0, true);
        const json = JSON.stringify(log.events);
        out[`${defId}|${state}|z${zoom}`] = { hash: fnv(json), length: json.length, marks };
      }
  return out;
}

describe('L3-T1 Signale unverändert zur Basis', () => {
  it.skip('Generator: schreibt die Fixture (nur bewusst ausführen)', () => {
    writeFileSync(FIXTURE, JSON.stringify(compute(), null, 1));
  });
  // Timeout: lokal ≤ 0,8 s (seriell, Last eher höher), CI bis ~4×, R270/R318
  it('RF-L3-2 Aufrufe von drawStatusMarks (Farben, Lage) sind für alle Typen, Zustände und Zoom 1 und 2 gleich zur Basis', () => {
    const ref = JSON.parse(readFileSync(FIXTURE, 'utf8')) as ReturnType<typeof compute>;
    const now = compute();
    expect(Object.keys(now).sort()).toEqual(Object.keys(ref).sort());
    expect(Object.values(ref).some((e) => e.marks > 0)).toBe(true);
    expect(
      Object.keys(ref).filter((k) => JSON.stringify(now[k]) !== JSON.stringify(ref[k])),
    ).toEqual([]);
  }, 15_000);
});
