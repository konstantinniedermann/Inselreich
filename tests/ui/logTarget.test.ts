import { describe, expect, it } from 'vitest';
import { crisisView } from '../../src/sim/queries';
import { crisisLogEntries } from '../../src/ui/crisisLog';
import { logTargetFor, resolveLogClick } from '../../src/ui/logTarget';
import { createWorld } from '../../src/sim/world';
import { step } from '../../src/sim/tick';
import { SCENARIOS } from '../sim/scenarios';

describe('logTarget (H-U2)', () => {
  it('ohne Ziel oder ohne Phase: kein Ort', () => {
    const w = createWorld(1);
    expect(logTargetFor(crisisView(w), w)).toBeUndefined();
  });

  it('Brand-Eintrag trägt Gebäude-ID und Kachel', () => {
    const w = SCENARIOS['krise-brand']!();
    let prev = crisisView(w);
    const all = [];
    for (let i = 0; i < 205; i++) {
      step(w);
      const cur = crisisView(w);
      all.push(...crisisLogEntries(prev, cur, w, w.tick));
      prev = cur;
    }
    expect(all).toHaveLength(2);
    for (const e of all) {
      const b = w.buildings[e.target!.id]!;
      expect(e.target).toEqual({ id: b.id, x: b.x, y: b.y });
    }
  });

  it('Eintrag ohne Ort (Boom) hat kein Ziel', () => {
    const w = SCENARIOS['krise-boom']!();
    let prev = crisisView(w);
    for (let i = 0; i < 205; i++) {
      step(w);
      const cur = crisisView(w);
      for (const e of crisisLogEntries(prev, cur, w, w.tick)) expect(e.target).toBeUndefined();
      prev = cur;
    }
  });

  it('Klick-Auflösung: Gebäude steht / fehlt, Kachel bleibt', () => {
    const w = SCENARIOS['krise-brand']!();
    const b = Object.values(w.buildings)[0]!;
    const t = { id: b.id, x: b.x, y: b.y };
    expect(resolveLogClick(t, w)).toEqual({ tile: { x: b.x, y: b.y }, exists: true });
    delete w.buildings[b.id];
    expect(resolveLogClick(t, w)).toEqual({ tile: { x: b.x, y: b.y }, exists: false });
  });

  it('anderes Gebäude auf der ID gilt als nicht mehr vorhanden', () => {
    const w = SCENARIOS['krise-brand']!();
    const b = Object.values(w.buildings)[0]!;
    const t = { id: b.id, x: b.x + 5, y: b.y };
    expect(resolveLogClick(t, w).exists).toBe(false);
  });
});
