import { describe, expect, it } from 'vitest';
import {
  DEFAULT_NEW_GAME_PETITIONS_ON,
  PETITIONS,
  PETITION_ANSWER,
  PETITION_IDS,
  type PetitionId,
} from '../../src/sim/defs/petitions';
import { TAX_LEVELS } from '../../src/sim/defs/tiers';
import { GOODS } from '../../src/sim/defs/goods';
import { home } from '../../src/sim/world';
import type { World } from '../../src/sim/types';
import { petitionCardModel, petitionChip } from '../../src/ui/petition';
import { DEFAULT_SETTINGS, parseSettings } from '../../src/ui/settings';
import { putBuilding, setHouse, village } from '../sim/helpers';

function previewWorld(): World {
  const { w, houses } = village(4);
  [13, 13, 12, 12].forEach((n, i) => setHouse(houses[i]!, 3, n));
  const k = w.buildings[home(w).kontorId]!;
  for (let i = 0; i < 5; i++) putBuilding(w, 0, 'weaver', k.x + 2 + 2 * i, k.y + 4);
  home(w).stock.cloth = 31;
  w.tick = 100;
  w.petitions.on = true;
  w.petitions.open.push({ id: 'weavers', drawnAt: 50, amount: 10 });
  return w;
}

/** Welt mit Marke `id` bei drawnAt 50; Anker (Kapelle, Plantage, Weberei) soweit nötig. */
function worldFor(id: PetitionId): World {
  const w = previewWorld();
  const k = w.buildings[home(w).kontorId]!;
  const def = PETITIONS[id];
  let anchor: number | undefined;
  if (def.anchor === 'spicefarm') anchor = putBuilding(w, 0, 'spicefarm', k.x + 2, k.y + 10).id;
  if (def.anchor === 'chapel') anchor = putBuilding(w, 0, 'chapel', k.x + 2, k.y + 13).id;
  w.petitions.open = [{ id, drawnAt: 50, amount: 10, ...(anchor === undefined ? {} : { anchor }) }];
  return w;
}

describe('AK-BS-24 Warum-Zeile', () => {
  for (const id of PETITION_IDS) {
    it(`${id}: Ware des Neins steht in der Begründung`, () => {
      const m = petitionCardModel(worldFor(id), 50)!;
      const g = GOODS[PETITIONS[id].no].name;
      expect(m.no.why).toContain(g);
      expect(m.no.why.length).toBeGreaterThan(`Warum ${g}: `.length);
      expect(m.no.tail).toBe('Keine weitere Folge');
    });
  }
  it('Warum-Zeile wiederholt nicht «Genügsam», Satz beginnt gross', () => {
    for (const id of PETITION_IDS) {
      const why = petitionCardModel(worldFor(id), 50)!.no.why;
      expect(why).not.toContain('Genügsam');
      expect(why).toMatch(/^Warum [^:]+: [A-ZÄÖÜ]/);
    }
  });
  it('B5, B7, B8, B9 nennen die Bezugsware', () => {
    expect(petitionCardModel(worldFor('feastDrink'), 50)!.no.why).toMatch(/Zuckerrohr|Rum/);
    expect(petitionCardModel(worldFor('woolMarket'), 50)!.no.why).toContain('Wolle');
    expect(petitionCardModel(worldFor('returnees'), 50)!.no.why).toContain('Nahrung');
    const b9 = petitionCardModel(worldFor('granary'), 50)!.no.why;
    expect(b9).toContain('Nahrung');
    expect(b9).toContain('Speicher');
  });
});

describe('AK-BS-25 Schiffsraum-Hinweis nur bei B6', () => {
  it('B6 nennt Fremdlager und Schiffe', () => {
    const m = petitionCardModel(worldFor('spiceSeed'), 50)!;
    const line = m.yes.lines.find((l) => l.includes('Wirkung hängt am Schiffsraum'))!;
    expect(line).toContain('Gewürz im Fremdlager 0');
    expect(line).toContain('0 Schiffe mit Gewürzroute');
  });
  it('die anderen 8 Ids haben die Zeile nicht', () => {
    for (const id of PETITION_IDS.filter((x) => x !== 'spiceSeed'))
      expect(
        petitionCardModel(worldFor(id), 50)!.yes.lines.some((l) => l.includes('Schiffsraum')),
        id,
      ).toBe(false);
  });
});

describe('AK-BS-18 Texte (P1)', () => {
  it('Lohn B4 nennt die Zahl der Aufstiegsuhr, B5 Frist und Abklingzeit', () => {
    const b4 = petitionCardModel(worldFor('bell'), 50)!.yes.reward;
    expect(b4).toBe(
      `in 1 min für 3 min: Aufstiegsuhr ${TAX_LEVELS.low.upgradeWait} T im Kapellenkreis (wie Aufstiegsfest)`,
    );
    const b5 = petitionCardModel(worldFor('feastDrink'), 50)!.yes.reward;
    expect(b5).toBe(
      'in 1 min, höchstens 10 min: nächstes Fest an der Kapelle ohne Rum und ohne Abklingzeit',
    );
  });
  it('Kosten, Lohn, Stoffzeile, Spareffekt', () => {
    const m = petitionCardModel(previewWorld(), 50)!;
    expect(m.yes.cost).toBe('jetzt −10 Stoff');
    expect(m.yes.reward).toContain('bis +8 Einwohner (Häuser ab Stufe 2)');
    const line = m.yes.lines.find((l) => l.startsWith('Stoff'))!;
    expect(line).toContain('Mehrbedarf 1,6');
    expect(line).toContain('Lücke 1,6');
    expect(m.no.effect).toContain('spart ≈ 18 Stoff');
    expect(m.deadline).toBe('Antwort bis 1:55');
  });
  it('Lohntexte der übrigen Arten', () => {
    expect(petitionCardModel(worldFor('tavern'), 50)!.yes.reward).toContain('(nur Stufe 3)');
    expect(petitionCardModel(worldFor('returnees'), 50)!.yes.cost).toBe('jetzt nichts');
    expect(petitionCardModel(worldFor('returnees'), 50)!.yes.reward).toContain('alle Häuser');
    expect(petitionCardModel(worldFor('spiceSeed'), 50)!.yes.reward).toContain(
      'Zyklus 80 % für alle Gewürzplantagen',
    );
    expect(petitionCardModel(worldFor('granary'), 50)!.yes.reward).toContain(
      'Lager 120 für Stoff, Rum, Nahrung',
    );
  });
});

describe('AK-BS-22 Sperrgrund', () => {
  it('Stoff 5: Ja gesperrt, Nein unverändert', () => {
    const w = previewWorld();
    const before = petitionCardModel(w, 50)!.no;
    home(w).stock.cloth = 5;
    const m = petitionCardModel(w, 50)!;
    expect(m.yes.blocked).toBe('Zu wenig Stoff (5 / 10)');
    expect(m.no.effect).toBe(before.effect);
    expect(m.no.why).toBe(before.why);
  });
});

describe('AK-BS-19 Vorbelegung', () => {
  it('Standard folgt der Sim-Vorgabe', () => {
    expect(DEFAULT_SETTINGS.petitionsOn).toBe(DEFAULT_NEW_GAME_PETITIONS_ON);
    expect(DEFAULT_SETTINGS.petitionsOn).toBe(true);
  });
  it('parseSettings: Müll -> Standard, false bleibt false', () => {
    expect(parseSettings(JSON.stringify({ petitionsOn: 'x' })).petitionsOn).toBe(true);
    expect(parseSettings(JSON.stringify({ petitionsOn: false })).petitionsOn).toBe(false);
    expect(parseSettings(null).petitionsOn).toBe(true);
  });
});

describe('Chip', () => {
  it('offene Marke zeigt die Restzeit', () => {
    const w = previewWorld();
    w.tick = 50 + PETITION_ANSWER - 1030;
    expect(petitionChip(w)).toEqual({ label: 'Bittschrift 1:43', drawnAt: 50 });
  });
  it('zwei offene Marken: früheste Frist, Zähler (+1)', () => {
    const w = previewWorld();
    w.petitions.open.unshift({ id: 'returnees', drawnAt: 80, amount: 0 });
    w.tick = 50 + PETITION_ANSWER - 1030;
    expect(petitionChip(w)).toEqual({ label: 'Bittschrift 1:43 (+1)', drawnAt: 50 });
    w.petitions.open.find((m) => m.drawnAt === 50)!.answer = 'yes';
    expect(petitionChip(w)).toEqual({ label: 'Bittschrift 1:46', drawnAt: 80 });
  });
  it('beantwortete oder fehlende Marke ergibt null', () => {
    const w = previewWorld();
    w.petitions.open[0]!.answer = 'no';
    expect(petitionChip(w)).toBeNull();
    expect(petitionCardModel(w, 50)).toBeNull();
    w.petitions.open = [];
    expect(petitionChip(w)).toBeNull();
  });
});
