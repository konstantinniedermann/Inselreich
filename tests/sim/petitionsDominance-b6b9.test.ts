/**
 * I-210 AK-BS-04 für B6 bis B9: kein «Ja» einer Bitte dominiert unter allen Lagen.
 * Je Bitte zwei Lagen (Anhang 01): in der Ja-Lage gewinnt «Ja», in der Nein-Lage «Nein».
 * Mass, Fenster und Seeds wie in petitionsDominance-b1b3.test.ts (R553, Seeds [3, 7]); geprüft wird nur die Rangfolge.
 *
 * Gewählte Wege (Ersatzmass Anhang 02, B-5):
 * - B6 Testzufuhr statt echter Route: Das Fremdkontor fehlt in den Lagen (createWorld liefert Fremdinseln ohne
 *   Kontor), eine Route brauchte Kontor, Schiff, Umlauf und Ladelogik. Gewürz kommt alle L Ticks in die Heimat
 *   (L = Ladung / Bedarf). Ja: Fremdlager 20, Ladung 15, der Zusatz der Saat (100/pct - 1) kommt an. Nein: Fremdlager 100,
 *   Ladung = Schiffsraum, der Zusatz bleibt im Fremdlager. Vorbedingung Ja: mindestens eine zusätzliche Ladung kam an.
 * - B9 offen (Entscheid L0), hier noch NICHT geprüft (Lage und Sturm-Mechanik stehen in petitionWorlds.ts, `SCENES.granary`):
 *   Die Ja-Lage ist mit den Zahlen aus Anhang 01 nicht baubar (Befund im Bericht an lead-tech), Entscheid steht aus.
 * - B9 Sturm direkt: Der Lauf setzt `world.crisis` auf einen Sturm ab answerAt + Verzug + 300 mit STORM_DURATION,
 *   in beiden Zweigen gleich, kein Eingriff in `crises.ts`. `incident` meint Krisen ausser diesem Sturm.
 *
 * B7: Die Vorbedingung «Nein-Lage mit Engpass im Ja-Lauf» entfällt, sie steht nicht in Anhang 01 für B7 (nur B1, B2, B3, B8);
 *   der Mangel der Nein-Lage zeigt sich dort im Wert (Webereien warten auf Wolle), nicht als leeres Lager.
 *
 * Abweichungen vom Anhang 01:
 * - B9 Ja: `crisisLevel` bleibt 'off' (wie alle Lagen). Mit 'normal' zöge der Krisenstrom alle 600 Ticks eine eigene
 *   Krise, einen «nächsten Termin hinter dem Fenster» gibt es nicht. Der gesetzte Sturm ist die einzige Krise.
 * - B9 Nein: Lager Stoff, Rum und Nahrung je 90 (die Bitte verlangt alle drei >= 90).
 * - B7: Wolle-Erzeugung der Ja-Lage 4 Schafweiden gegen Bedarf 3 (ü 33 % statt 30 %, ganze Betriebe).
 */
import { beforeAll, describe, expect, it } from 'vitest';
import type { PetitionId } from '../../src/sim/defs/petitions';
import { duel, PETITION_SEEDS, SCENES, type DuelRun } from './petitionWorlds';

const BITTEN: readonly PetitionId[] = ['spiceSeed', 'woolMarket', 'returnees'];
type Result = Record<'yes' | 'no', { yes: DuelRun; no: DuelRun }>;

describe.each(PETITION_SEEDS)('AK-BS-04 B6-B9, Seed %i', (seed) => {
  describe.each(BITTEN)('%s', (id) => {
    const res: Partial<Result> = {};
    beforeAll(() => {
      for (const lage of ['yes', 'no'] as const) {
        res[lage] = duel(SCENES[id]![lage]!(seed));
      }
    });
    it('Vorbedingungen: beide Antworten gehen, kein Zwischenfall', () => {
      for (const lage of ['yes', 'no'] as const)
        for (const a of ['yes', 'no'] as const) {
          expect(res[lage]![a].ok, `${lage}/${a} ok`).toBe(true);
          expect(res[lage]![a].incident, `${lage}/${a} incident`).toBe(false);
        }
    });
    it('Vorbedingung: Häuser der Ja-Lage beim Nachspiel versorgt', () => {
      expect(res.yes!.yes.shortage).toEqual([]);
    });
    if (id === 'spiceSeed')
      it('Vorbedingung B6: im Fenster kommt eine zusätzliche Ladung in der Heimat an', () => {
        expect(res.yes!.yes.probe).toBeGreaterThan(0);
        expect(res.yes!.no.probe ?? 0).toBe(0); // ohne Saat kein Zusatz
      });
    if (id === 'spiceSeed')
      it('Vorbedingung B6: Nein-Lage mit Engpass im Ja-Lauf', () => {
        expect(res.no!.yes.shortage).toContain('spice');
      });
    if (id === 'returnees')
      it('Vorbedingung B8: die Heimkehrer ziehen ein (mehr Bewohner im Ja-Lauf der Ja-Lage)', () => {
        expect(res.yes!.yes.probe).toBeGreaterThan(res.yes!.no.probe!);
      });
    if (id === 'returnees')
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
