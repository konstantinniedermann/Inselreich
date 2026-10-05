import { describe, expect, it, vi } from 'vitest';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { UPKEEP_INTERVAL } from '../../src/sim/economy';
import { cycleOf } from '../../src/sim/levels';
import { home, createWorld, idx } from '../../src/sim/world';
import type { Building } from '../../src/sim/types';
import { producesText } from '../../src/ui/texts';
import { upkeepText, progressPct } from '../../src/ui/inspect';
import { tooltipLines } from '../../src/ui/buildMenu';
import { hoverInfo } from '../../src/ui/hover';
import { perMinute } from '../../src/ui/time';
import { forceGrass } from '../sim/helpers';

vi.mock('../../src/sim/defs/levels', async (orig) => {
  const real = await orig<typeof import('../../src/sim/defs/levels')>();
  const c = (money: number, wood: number, tools: number) => ({ money, wood, tools, stone: 0 });
  return {
    ...real,
    LEVELS: {
      ...real.LEVELS,
      fisher: [
        { cycle: 24, upkeep: 7, cost: c(50, 3, 1), fee: { good: 'cloth', amount: 2 } },
        { cycle: 16, upkeep: 9, cost: c(75, 4, 2), fee: { good: 'rum', amount: 2 } },
      ],
    },
  };
});

const mk = (defId: Building['defId'], extra: Partial<Building> = {}): Building => ({
  id: 1,
  defId,
  x: 0,
  y: 0,
  connected: true,
  progress: 0,
  state: 'ok',
  ...extra,
});

describe('M11 Zugriffsersatz cycleOf/upkeepOf (Spec 7)', () => {
  it('AK-UI-10 Vorlauf: ohne level bitgleich zu den Defs (jedes Gebäude)', () => {
    for (const def of Object.values(BUILDING_DEFS)) {
      const b = mk(def.id);
      expect(upkeepText(b), def.id).toBe(
        `Unterhalt ${perMinute(def.upkeep, UPKEEP_INTERVAL)} / min`,
      );
      if (!def.produces || def.cycle === undefined) continue;
      expect(producesText(def, false, cycleOf(b)!)).toBe(producesText(def, false));
      b.progress = Math.floor(def.cycle / 2);
      expect(progressPct(b)).toBe(Math.min(100, Math.round((b.progress / def.cycle) * 100)));
    }
  });
  it('AK-UI-10 Vorlauf: Fischer Stufe 2 und 3 (alle 3 s / 2 s, 42 / 54 je min, Balken 50 %)', () => {
    const f2 = mk('fisher', { level: 2, progress: 12 });
    expect(producesText(BUILDING_DEFS.fisher, false, cycleOf(f2)!)).toBe(
      'Erzeugt Nahrung alle 3 s',
    );
    expect(upkeepText(f2)).toBe('Unterhalt 42 / min');
    expect(progressPct(f2)).toBe(50);
    const f3 = mk('fisher', { level: 3 });
    expect(producesText(BUILDING_DEFS.fisher, false, cycleOf(f3)!)).toBe(
      'Erzeugt Nahrung alle 2 s',
    );
    expect(upkeepText(f3)).toBe('Unterhalt 54 / min');
    expect(tooltipLines({ kind: 'build', defId: 'fisher' })).toContain('Erzeugt: Nahrung 15 / min');
  });
  it('AK-UI-10 Vorlauf: Mouse-over Fischer Stufe 2 „arbeitet — 25 Nahrung / min"', () => {
    const w = createWorld(3, { crisisLevel: 'off', unlockAll: true });
    const k = w.buildings[home(w).kontorId]!;
    const b = mk('fisher', { id: w.nextBuildingId++, x: k.x + 4, y: k.y - 6, level: 2 });
    w.buildings[b.id] = b;
    forceGrass(w, b.x, b.y);
    home(w).tiles[idx(home(w), b.x, b.y)]!.buildingId = b.id;
    const none = { ship: false, animal: null };
    expect(hoverInfo(w, b, 0, none)!.lines[0]).toBe('arbeitet — 25 Nahrung / min');
  });
});
