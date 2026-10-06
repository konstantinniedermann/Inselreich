import { describe, expect, it } from 'vitest';
import { ISLANDS } from '../../src/sim/defs/sea';
import { seaLanes } from '../../src/sim/islands';
import { createWorld } from '../../src/sim/world';
import { formatIslandCard, islandCard } from '../../src/ui/islandCard';

describe('M12 E1 Inselkarte', () => {
  it('formatiert Name, Groesse, Merkmale, Fahrzeit', () => {
    expect(formatIslandCard(ISLANDS[0]!, 24, 24, 27)).toBe(
      'Möweninsel · 24 × 24 · Gewürz · Fahrzeit 0:27',
    );
    expect(formatIslandCard(ISLANDS[1]!, 36, 36, 38)).toBe(
      'Felsbucht · 36 × 36 · Gewürz, Gebirge · Fahrzeit 0:38',
    );
    expect(formatIslandCard(ISLANDS[0]!, 24, 24, 65)).toContain('Fahrzeit 1:05');
  });

  it('islandCard nutzt die Seeweg-Laenge der Welt', () => {
    const w = createWorld(3);
    const d = seaLanes(w.islands).find((l) => l.a === 0 && l.b === 1)!.d;
    const i1 = w.islands[1]!;
    expect(islandCard(w, 1)).toBe(formatIslandCard(ISLANDS[0]!, i1.width, i1.height, d));
  });
});
