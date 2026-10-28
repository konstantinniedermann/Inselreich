/**
 * I-210 AK-BS-04 für B4 (Glockenweihe) und B5 (Festtrunk): kein «Ja» dominiert unter allen Lagen.
 * Mass, Fenster und Seeds wie in petitionsDominance-b1b3.test.ts (R553, Seeds [3, 7]); geprüft wird nur die Rangfolge.
 * Der Steuerzuwachs aus Aufstiegen im Fenster steckt im Geld (Mass ΔGeld + Σ ΔLager × Verkaufspreis).
 * Aufstiegswelle nach dem Muster von I-201 Lage A (Häuser voll belegt, versorgt, Dienste; nichts aus feastWorlds.ts).
 *
 * Abweichungen vom Anhang 01 (Lagen so gebaut, dass die Rangfolge messbar ist; Defs unverändert):
 * - B4 Ja: Stein 80 statt 30 (fünf Aufstiege kosten je 10 Stein, die Glocke 10). Holz 100, Werkzeug 50, Nahrung und Stoff
 *   100, Glas und Gewürz je 500 (über STORAGE_CAP 100, direkt gesetzt: die Lage hat dafür keinen Zulauf).
 * - B5 Ja: Ketten ü 0,60 statt 0,20, Rohr 40 (Kosten 20), Stein 80, Glas und Gewürz je 2000 (über STORAGE_CAP). Das Fenster
 *   ist 6900 Ticks lang, die Häuser wachsen auf Stufe 4 auf 20 Bewohner; bei ü 0,20 und Glas 500 fehlt es in beiden Läufen
 *   (Ja verlor mit -1841). Mit ü 0,60 läuft Rum ans Lagerlimit und die Ersparnis des Nein verfällt teilweise; das kippt die
 *   Richtung zum Ja, ist aber artefaktfrei, weil addStock nur den Zufluss kappt (der Lagerstand wird nie hochgesetzt).
 * - Aufstiegswelle: Die Wartezeit der Häuser beginnt erst nach der Antwort (satisfiedSince in der Zukunft), sonst stiegen
 *   sie vor dem Wirkungsbeginn auf. Am Ende des Fensters sind in beiden Läufen alle Häuser oben; «mehr Häuser im
 *   Fenster» ist darum als «mehr Haus-Ticks auf Stufe 4» geprüft. Gemessen steigt jedes der 5 Häuser im Ja-Lauf 300 Ticks
 *   früher auf (riserTicks +1500, B4: Aufstieg bei Tick 800 gegen 1100). Ursache: Glas und Gewürz der Stufe 4 haben in der
 *   Lage keine Erzeugung, das Budget der Zielstufe liegt im Defizit, und `UPGRADE_DEFICIT_WAIT_FACTOR` (2) verdoppelt beide
 *   Wartezeiten: Glocke 2 x 150 gegen normal 2 x 300, der Vorsprung ist 300 statt 150.
 * - B5: Das Aufstiegsfest hält der Lauf, sobald die Wirkung läuft (Verzug + 100 Ticks): im Ja-Lauf mit Gutschein in der
 *   Abklingzeit, im Nein-Lauf, sobald die Abklingzeit endet (1800 Ticks nach dem Start-Fest).
 */
import { beforeAll, describe, expect, it } from 'vitest';
import type { PetitionId } from '../../src/sim/defs/petitions';
import { duel, PETITION_SEEDS, SCENES, type DuelRun } from './petitionWorlds';

const BITTEN: readonly PetitionId[] = ['bell', 'feastDrink'];
type Result = Record<'yes' | 'no', { yes: DuelRun; no: DuelRun }>;

describe.each(PETITION_SEEDS)('AK-BS-04 B4-B5, Seed %i', (seed) => {
  describe.each(BITTEN)('%s', (id) => {
    const res: Partial<Result> = {};
    beforeAll(() => {
      for (const lage of ['yes', 'no'] as const) res[lage] = duel(SCENES[id]![lage]!(seed));
    }, 60_000);
    it('Vorbedingungen: beide Antworten gehen, kein Zwischenfall', () => {
      for (const lage of ['yes', 'no'] as const)
        for (const a of ['yes', 'no'] as const) {
          expect(res[lage]![a].ok, `${lage}/${a} ok`).toBe(true);
          expect(res[lage]![a].incident, `${lage}/${a} incident`).toBe(false);
        }
    });
    it('Vorbedingung: im Ja-Lauf der Ja-Lage steigen die Häuser früher auf', () => {
      expect(res.yes!.yes.extras!.riserTicks).toBeGreaterThan(res.yes!.no.extras!.riserTicks!);
    });
    it('Vorbedingung: Häuser der Ja-Lage beim Nachspiel versorgt', () => {
      expect(res.yes!.yes.shortage).toEqual([]);
    });
    if (id === 'feastDrink')
      it('Vorbedingung B5: das Gutschein-Fest gelingt, Rum bleibt unverändert', () => {
        expect(res.yes!.yes.extras!.feastHeld).toBe(1);
        expect(res.yes!.yes.extras!.feastRum).toBe(0);
        expect(res.yes!.no.extras!.feastHeld, 'Nein-Zweig hält das Fest nach der Abklingzeit').toBe(
          1,
        );
        expect(res.yes!.no.extras!.feastRum).toBeGreaterThan(0);
      });
    it('Ja-Lage: Ja gewinnt', () => {
      expect(res.yes!.yes.value).toBeGreaterThan(res.yes!.no.value);
    });
    it('Nein-Lage: Nein gewinnt', () => {
      expect(res.no!.no.value).toBeGreaterThan(res.no!.yes.value);
    });
  });
});
