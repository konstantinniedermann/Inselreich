import { describe, expect, it } from 'vitest';
import { PETITIONS } from '../../src/sim/defs/petitions';
import type { PetitionEvent } from '../../src/sim/petitions';
import { home } from '../../src/sim/world';
import { effectLines, effectsChip, petitionLogEntries } from '../../src/ui/petitionLog';
import { formatClock } from '../../src/ui/time';
import { twoIslandWorld, putBuilding, setHouse, village } from '../sim/helpers';

const UNTIL = 19000;

describe('AK-BS-20-Log Chronik B1', () => {
  it('drawn, thanks, ended ergeben drei Einträge', () => {
    const { w } = village(1);
    w.tick = 100;
    w.petitions.effects.push({ id: 'weavers', answer: 'yes', until: UNTIL });
    const ev: PetitionEvent[] = [
      { kind: 'drawn', id: 'weavers', drawnAt: 100, amount: 10 },
      { kind: 'thanks', id: 'weavers', drawnAt: 90 },
      { kind: 'ended', id: 'weavers', drawnAt: UNTIL },
    ];
    const out = petitionLogEntries(ev, w);
    expect(out).toHaveLength(3);
    expect(out[0]!.text).toBe('Bittschrift Weberfamilien: Bitte um 10 Stoff');
    expect(out[1]!.text).toContain('Die Weberfamilien ziehen ein und danken');
    expect(out[1]!.text).toContain(`bis ${formatClock(UNTIL)}`);
    expect(out[2]!.text).toBe('Weberfamilien: Wirkung ist abgelaufen');
    expect(out.every((e) => e.tick === 100)).toBe(true);
  });
  it('B8 ohne Kosten: Bitte um Aufnahme', () => {
    const { w } = village(1);
    const out = petitionLogEntries([{ kind: 'drawn', id: 'returnees', drawnAt: 0, amount: 0 }], w);
    expect(out[0]!.text).toContain('Bitte um Aufnahme');
  });
});

describe('AK-BS-21-Log Nein und Frist', () => {
  it('lament: ein Eintrag ohne Wirkungsteil; timeout: Keine Antwort', () => {
    const { w } = village(1);
    const lament = petitionLogEntries([{ kind: 'lament', id: 'weavers', drawnAt: 0 }], w);
    expect(lament).toHaveLength(1);
    expect(lament[0]!.text).toBe(PETITIONS.weavers.lament);
    const t = petitionLogEntries([{ kind: 'timeout', id: 'weavers', drawnAt: 0 }], w);
    expect(t[0]!.text).toBe('Keine Antwort: abgelehnt');
  });
  it('lapsed nennt das Gebäude des Ankers', () => {
    const { w } = village(1);
    const t = petitionLogEntries([{ kind: 'lapsed', id: 'bell', drawnAt: 0 }], w);
    expect(t[0]!.text).toBe(
      'Die Kapelle steht nicht mehr: Glockenweihe fällt aus, die Gabe ist verloren',
    );
  });
});

describe('B9-Ende', () => {
  it('verdorbene Ware steht im Text', () => {
    const { w } = village(1);
    const t = petitionLogEntries(
      [{ kind: 'ended', id: 'granary', drawnAt: 0, spoiled: { cloth: 12 } }],
      w,
    );
    expect(t[0]!.text).toBe('Der Speicher ist abgebaut, 12 Stoff verdorben');
  });
});

describe('Panel', () => {
  it('Haus Stufe 4 mit B1-Wirkung und 23 Bewohnern', () => {
    const { w, houses } = village(1);
    setHouse(houses[0]!, 4, 23);
    w.tick = 10;
    expect(effectLines(w, houses[0]!)).toEqual([]);
    w.petitions.effects.push({ id: 'weavers', answer: 'yes', until: UNTIL });
    const lines = effectLines(w, houses[0]!);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatch(/^23 \/ \d+ \(Weberfamilien bis /);
  });
  it('Haus auf Insel 1: keine Zeile', () => {
    const w = twoIslandWorld();
    const k = w.buildings[w.islands[1]!.kontorId!]!;
    const h = putBuilding(w, 1, 'house', k.x + 2, k.y);
    setHouse(h, 4, 23);
    w.petitions.effects.push({ id: 'weavers', answer: 'yes', until: UNTIL });
    w.petitions.effects.push({ id: 'weavers', answer: 'no', until: UNTIL });
    expect(effectLines(w, h)).toEqual([]);
  });
  it('Nein-Wirkung Stoff: Genügsam-Zeile nur bei Bedarf an Stoff', () => {
    const { w, houses } = village(2);
    setHouse(houses[0]!, 3, 10);
    w.tick = 10;
    w.petitions.effects.push({ id: 'weavers', answer: 'no', until: UNTIL });
    expect(effectLines(w, houses[0]!)).toEqual([
      `Genügsam: Stoffbedarf −10 % bis ${formatClock(UNTIL)}`,
    ]);
    expect(effectLines(w, houses[1]!)).toEqual([]);
  });
  it('Betrieb und Lager', () => {
    const { w } = village(1);
    const k = w.buildings[home(w).kontorId]!;
    const weaver = putBuilding(w, 0, 'weaver', k.x + 2, k.y + 6);
    w.tick = 10;
    w.petitions.effects.push({ id: 'woolMarket', answer: 'yes', until: UNTIL });
    w.petitions.effects.push({ id: 'granary', answer: 'yes', until: UNTIL });
    expect(effectLines(w, weaver)).toEqual([`Bittschrift: Zyklus 80 % bis ${formatClock(UNTIL)}`]);
    expect(effectLines(w, k)).toEqual([`Lager 120 (Speicher bis ${formatClock(UNTIL)})`]);
  });
});

describe('Chip', () => {
  it('zwei Wirkungen: Zahl und kürzere Restzeit; keine: null', () => {
    const { w } = village(1);
    expect(effectsChip(w)).toBeNull();
    w.tick = 0;
    w.petitions.effects.push({ id: 'weavers', answer: 'yes', until: 600 });
    w.petitions.effects.push({ id: 'tavern', answer: 'no', until: 6000 });
    const c = effectsChip(w)!;
    expect(c.label).toBe('Wirkungen 2 · noch 1:00');
    expect(c.title.split('\n')).toHaveLength(2);
  });
});
