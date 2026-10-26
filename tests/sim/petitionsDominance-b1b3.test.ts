/**
 * I-210 AK-BS-04 für B1 bis B3: kein «Ja» einer Bitte dominiert unter allen Lagen.
 * Je Bitte zwei Lagen (Anhang 01): in der Ja-Lage gewinnt «Ja», in der Nein-Lage «Nein».
 * Gemessen wird das Mass wie in I-201 (ΔGeld + Σ ΔLager × Verkaufspreis) im Fenster
 * [Antwort, Antwort + Verzug + Dauer + 300]; geprüft wird nur die Rangfolge, keine Beträge.
 * R553: Seeds [3, 7] sind feste Konstanten (PETITION_SEEDS). Die Gebäude stehen relativ zum Kontor
 * und im Fabrikfeld darunter, der Seed bestimmt nur Gelände und Kontorlage; darum zeigt jeder Seed
 * dieselbe Lage, und die Wirkungen hängen nicht vom Gelände ab. Die Wandzeit steht im Teilbeleg.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import type { PetitionId } from '../../src/sim/defs/petitions';
import { duel, PETITION_SEEDS, SCENES, type DuelRun } from './petitionWorlds';

const BITTEN: readonly PetitionId[] = ['weavers', 'tavern', 'glaziers'];
type Result = Record<'yes' | 'no', { yes: DuelRun; no: DuelRun }>;

describe.each(PETITION_SEEDS)('Seed %i', (seed) => {
  describe.each(BITTEN)('%s', (id) => {
    const res: Partial<Result> = {};
    beforeAll(() => {
      for (const lage of ['yes', 'no'] as const) res[lage] = duel(SCENES[id]![lage]!(seed));
    });
    it('Vorbedingungen: beide Antworten gehen, kein Zwischenfall', () => {
      for (const lage of ['yes', 'no'] as const)
        for (const a of ['yes', 'no'] as const) {
          expect(res[lage]![a].ok, `${lage}/${a} ok`).toBe(true);
          expect(res[lage]![a].incident, `${lage}/${a} incident`).toBe(false);
        }
    });
    it('Vorbedingungen: Ja-Lage ohne Engpass, Nein-Lage mit Engpass im Ja-Lauf', () => {
      expect(res.yes!.yes.shortage).toEqual([]);
      expect(res.no!.yes.shortage.length).toBeGreaterThan(0);
    });
    it('Ja-Lage: Ja gewinnt', () => {
      expect(res.yes!.yes.value).toBeGreaterThan(res.yes!.no.value);
    });
    it('Nein-Lage: Nein gewinnt', () => {
      expect(res.no!.no.value).toBeGreaterThan(res.no!.yes.value);
    });
  });
});
