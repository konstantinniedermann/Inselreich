import { describe, expect, it } from 'vitest';
import { ISLANDS } from '../../src/sim/defs/sea';
import { seaLanes } from '../../src/sim/islands';
import { travelTicks } from '../../src/sim/islands';
import { createWorld } from '../../src/sim/world';
import { formatGameTime } from '../../src/ui/time';
import { formatIslandCard, islandCard, traitLine } from '../../src/ui/islandCard';
import { foundKontor2Literal } from '../sim/seaHelpers';
import { putBuilding } from '../sim/helpers';

describe('M12 E1 Inselkarte', () => {
  it('formatiert Name, Groesse, Merkmale, Fahrzeit', () => {
    expect(formatIslandCard(ISLANDS[0]!, 24, 24, 27)).toBe(
      'Möweninsel · 24 × 24 · Gewürz · Markt: Stoff +30 % · Fahrzeit 27 s',
    );
    expect(formatIslandCard(ISLANDS[1]!, 36, 36, 38)).toBe(
      'Felsbucht · 36 × 36 · Gewürz, Gebirge · Gebirge+: Steinbruch, Glashütte ×2 · Markt: Rum +30 % · Fahrzeit 38 s',
    );
    expect(formatIslandCard(ISLANDS[0]!, 24, 24, 65)).toContain('Fahrzeit 1:05');
  });

  it('BF6 ein Fahrzeit-Format wie überall (formatGameTime)', () => {
    const card = (d: number) => formatIslandCard(ISLANDS[0]!, 24, 24, d);
    expect(card(27).endsWith('Fahrzeit 27 s')).toBe(true);
    expect(card(60).endsWith('Fahrzeit 1:00')).toBe(true);
    expect(card(65).endsWith('Fahrzeit 1:05')).toBe(true);
    expect(card(0).endsWith('Fahrzeit 0 s')).toBe(true);
    for (const d of [0, 1, 27, 59, 60, 65, 200])
      expect(card(d).endsWith(`Fahrzeit ${formatGameTime(travelTicks(d))}`)).toBe(true);
  });

  it('islandCard nutzt die Seeweg-Laenge der Welt', () => {
    const w = createWorld(3);
    const d = seaLanes(w.islands).find((l) => l.a === 0 && l.b === 1)!.d;
    const i1 = w.islands[1]!;
    expect(islandCard(w, 1)).toBe(formatIslandCard(ISLANDS[0]!, i1.width, i1.height, d));
  });
});

describe('M14-E1 Inselstärken (AK-M14E1-26)', () => {
  it('Weidenau: Fruchtbar-Abschnitt, Fahrzeit aus dem Seeweg', () => {
    expect(formatIslandCard(ISLANDS[2]!, 24, 24, 27)).toBe(
      'Weidenau · 24 × 24 · Gewürz · Fruchtbar: Zuckerrohrplantage, Schäferei ×2 · Markt: Glas +30 % · Fahrzeit 27 s',
    );
    const w = createWorld(3, { unlockAll: true });
    const d = seaLanes(w.islands).find((l) => l.a === 0 && l.b === 3)!.d;
    const i3 = w.islands[3]!;
    expect(islandCard(w, 3)).toBe(formatIslandCard(ISLANDS[2]!, i3.width, i3.height, d));
    expect(islandCard(w, 3)).toMatch(
      /^Weidenau · 24 × 24 · Gewürz · Fruchtbar: Zuckerrohrplantage, Schäferei ×2 · Markt: Glas \+30 % · Fahrzeit \d+ s$/,
    );
  });
});

describe('M14-E1 traitLine (AK-M14E1-29)', () => {
  const w = createWorld(3, { unlockAll: true });
  foundKontor2Literal(w, 2);
  foundKontor2Literal(w, 3);
  const at = (island: number, defId: Parameters<typeof putBuilding>[2], slot: number) => {
    const k = w.buildings[w.islands[island]!.kontorId!]!;
    return putBuilding(w, island, defId, k.x + 4 + slot * 3, k.y);
  };
  it('nur Trait-Betriebe auf Trait-Insel bekommen die Zeile', () => {
    expect(traitLine(w, at(2, 'quarry', 0))).toBe('Inselvorteil ×2 (Gebirge+)');
    expect(traitLine(w, at(2, 'glassworks', 1))).toBe('Inselvorteil ×2 (Gebirge+)');
    expect(traitLine(w, at(3, 'sheepfarm', 0))).toBe('Inselvorteil ×2 (Fruchtbar)');
    expect(traitLine(w, at(3, 'spicefarm', 1))).toBeNull();
    expect(traitLine(w, at(0, 'quarry', 5))).toBeNull();
    expect(traitLine(w, at(2, 'lumberjack', 2))).toBeNull();
  });
});
