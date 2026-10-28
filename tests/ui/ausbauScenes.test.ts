import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { demolish } from '../../src/sim/build';
import { distance } from '../../src/sim/coverage';
import { levelChecks } from '../../src/sim/levelChecks';
import { runningLevel, siteAt, workforceAt } from '../../src/sim/levelRules';
import { deserialize, serialize } from '../../src/sim/save';
import { upgradeBuilding } from '../../src/sim/upgrade';
import type { Building, World } from '../../src/sim/types';
import { putBuilding } from '../sim/helpers';
import { scene, type SceneId } from './ausbauScenes';

const outDir = (): string | undefined =>
  (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }).process?.env
    ?.AUSBAU_SCENES_OUT;

const IDS: SceneId[] = ['S1', 'S2', 'S3', 'S4'];

const building = (w: World, id: number | undefined): Building => {
  const b = id === undefined ? undefined : w.buildings[id];
  if (b === undefined) throw new Error(`Gebäude ${id} fehlt`);
  return b;
};

describe('Ausbau-Szenen für die Browser-Checks (N7)', () => {
  it('S1: Fischgrund ✗, Fachkräfte ✓, Bürgerhaus im Abstand 6', () => {
    const { world, ids } = scene('S1');
    const fisher = building(world, ids.fisher);
    expect(world.crisisLevel).toBe('off');
    expect(fisher.level).toBe(2);
    expect(fisher.connected).toBe(true);
    const rows = levelChecks(world, fisher, 3);
    expect(rows.find((c) => c.id === 'site')?.ok).toBe(false);
    expect(rows.find((c) => c.id === 'site')?.text).toContain('Fischgrund');
    expect(rows.find((c) => c.id === 'workforce')?.ok).toBe(true);
    expect(Math.ceil(distance(fisher, building(world, ids.citizen)))).toBe(6);
    expect(distance(fisher, building(world, ids.n2))).toBe(2);
    expect(distance(fisher, building(world, ids.n3))).toBe(3);
    expect(runningLevel(world, fisher)).toBe(2);
  });

  it('S2: Brennerei läuft mit Wache auf 3, ohne Wache auf 2', () => {
    const { world, ids } = scene('S2');
    const still = building(world, ids.distillery);
    expect(world.crisisLevel).toBe('normal');
    expect(still.level).toBe(3);
    expect(still.connected).toBe(true);
    expect(runningLevel(world, still)).toBe(3);
    expect(demolish(world, ids.fire!).ok).toBe(true);
    expect(runningLevel(world, still)).toBe(2);
  });

  it('S3: Steinbruch auf der Kolonie ohne Siedlerhaus', () => {
    const { world, ids, focus } = scene('S3');
    expect(focus.island).toBe(1);
    expect(building(world, ids.quarry).island).toBe(1);
    expect(building(world, ids.quarry).connected).toBe(true);
    const r = upgradeBuilding(world, ids.quarry!);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toContain('(kein Siedlerhaus auf dieser Insel)');
  });

  it('S4: Quelle Stufe 3, Zielküste A ohne ✗, Zielküste B mit Fischgrund-✗', () => {
    const { world, ids } = scene('S4');
    expect(building(world, ids.source).level).toBe(3);
    const probeAt = (x: number): Building => {
      const p = putBuilding(world, 0, 'fisher', x, ids.targetY!);
      p.level = 3;
      return p;
    };
    const a = probeAt(ids.targetAx!);
    expect(workforceAt(world, a, 3).ok).toBe(true);
    expect(siteAt(world, a, 3)?.ok).toBe(true);
    const b = probeAt(ids.targetBx!);
    expect(workforceAt(world, b, 3).ok).toBe(true);
    expect(siteAt(world, b, 3)?.ok).toBe(false);
    expect(world.buildings[ids.f1!]).toBeDefined();
    expect(world.buildings[ids.f2!]).toBeDefined();
  });

  it.each(IDS)('%s: Rundlauf serialize/deserialize ist ok', (id) => {
    const r = deserialize(serialize(scene(id).world));
    expect(r.ok).toBe(true);
  });

  it.each(IDS)('%s: gleiche Szene, gleicher Zustand', (id) => {
    expect(serialize(scene(id).world)).toBe(serialize(scene(id).world));
  });

  it('schreibt auf Wunsch JSON je Szene (AUSBAU_SCENES_OUT)', () => {
    const dir = outDir();
    if (dir === undefined || dir === '') return;
    mkdirSync(dir, { recursive: true });
    for (const id of IDS) {
      const s = scene(id);
      writeFileSync(join(dir, `${id}.json`), serialize(s.world));
      writeFileSync(join(dir, `${id}.focus.json`), JSON.stringify({ ...s.focus, ids: s.ids }));
    }
  });
});
