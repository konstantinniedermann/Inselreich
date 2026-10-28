# T08 Messlauf stabile Stadt (AK-BS-05)

Persona `tech-sim-engineer` · Strang B · Tools ≈ 60 · AK-BS-05 · blocked-by T06. **Last ≤ 4 nötig.** Kann nach T06 parallel zu T07 laufen, wenn der Controller einen zweiten Mess-Arbeiter freigibt; sonst nach T07 im selben Arbeiter.

**Files:** Create `tests/sim/petitionsStable.test.ts`; `tests/sim/petitionWorlds.ts` nur ergänzen (neue Funktion, kein Umbau). Kein `src/`-Diff, keine Def-Änderung.

## Interfaces

- Consumes (T06): `chainsAt`, `measuredOver`, `PetitionScene`, `feed`.
- Produces: `export function stableTown(seed: number): { w: World; over: Partial<Record<GoodId, number>> }` in `petitionWorlds.ts`.

## Machbarkeit vor Zusage (Anhang 03 §1, Gate B-1)

- [ ] **Schritt 1, eigener Commit-loser Prüflauf:** `stableTown(3)` baut 6 Kaufmannshäuser (Stufe 4, cap 20) auf HOME mit allen Diensten, Lager 100 je Ware, Krisen aus, Steuer «normal». Betriebe je Kette mit **ü zwischen 5 % und 14 %**, Ausbaustufen gemischt erlaubt; Gewürz per Testzufuhr je 100 T (Anhang 03 erlaubt sie). Ins Ledger: `measuredOver` je Ware.
- [ ] **«+2 Fischer»:** `L_Na = 18 × 0,5 − ü_Na × 60` ≤ 5 je 100 T und zwei freie, angebundene Fischerplätze im Radius. Ist eines davon nicht erfüllt, meldest du das vor dem Weiterbau an den Controller: Zweig J+F entfällt, und mit ihm die Zeilen «J+F Stoff» und «ΔGeld». Das ist ein Befund für L0 (R-BS-1), keine stille Anpassung.
- [ ] Einschwingen 2000 T ohne Bitte. Vorbedingung: 120 Kaufleute, alle versorgt, jedes Lager ≥ 90.

## Zweige (aus demselben `serialize`, B1-Marke mit `amount` 24, Antwort im selben Tick)

J (Ja, schlank) · J+F (Ja, im Antworttick 2 Fischer angebunden) · N+F (Nein mit denselben 2 Fischern) · N (Nein, schlank). Jeder Zweig läuft bis Nachspiel + `duration` + 300 T; N läuft zusätzlich bis Ende `FRUGAL_TICKS` gegen eine Referenz ohne Bitte.

## Erwartungen als Formel von ü (Anhang 03 §3; Zahlen in Klammern für ü = 10 %)

Bedarf je 100 T: Stoff 24, Nahrung 60. `M_g = 18 × Rate_g`; `L_g = M_g − ü_g × Bedarf_g`; `S_g` = Bestand im Tick, in dem die Rampe (150 T) endet.

| Grösse                                              | Band im Test                                                               |
| --------------------------------------------------- | -------------------------------------------------------------------------- |
| Zusatzplätze (Σ `overcrowdCap − houseCap`)          | genau 18                                                                   |
| J: erstes unversorgtes Haus, T ab Ende der Rampe    | `[(S_Na − 6) / L_Na × 100, S_Na / L_Na × 100 + 150]` (3133–3483)           |
| J+F: Stoff am Ende der Überbelegung                 | `[S_St − L_St × 60 − 6, S_St − L_St × 60 + 3]` (22–31)                     |
| J+F: kein unversorgtes Haus im Fenster              | `true`                                                                     |
| ΔGeld(J+F − N+F) über das Fenster                   | `[21 000, 24 500]` (feste Grenzen aus Anhang 03)                           |
| N: gesparter Stoff gegen Referenz in `FRUGAL_TICKS` | `[24 × 0,1 × 18 − 6, 24 × 0,1 × 18 + 1]` mit der Ist-Rate statt 24 (37–44) |
| N: Stoffbestand am Ende minus Referenz              | `[0, 6]`                                                                   |

Fehlerrichtung und Rückfall stehen in Anhang 03 §4: Ein Wert ausserhalb des Bands ist ein Befund an den Controller, keine Kalibrierung der Erwartung. Liegt ΔGeld über dem Band, ist das ein Fehler in der Formel §3.5 (T03).

## Schritte

- [ ] Machbarkeit (oben) und Meldung, dann Test schreiben.
- [ ] **Rot:** `OVERCROWD_PCT` vorübergehend 0 → «Zusatzplätze 18» und ΔGeld fallen (Exit ≠ 0); zurück, `git diff --quiet src/; echo EXIT=$?` = 0.
- [ ] Lauf: `make messfenster; echo EXIT=$?`, `/usr/bin/time -p npx vitest run tests/sim/petitionsStable.test.ts; echo EXIT=$?`. Soll < 30 s, ein Seed (3) genügt (AK-BS-05 nennt keinen zweiten).
- [ ] Bericht: alle sieben Grössen gemessen, mit Band und ü je Ware.
- [ ] Teilbeleg: `npx tsc --noEmit`, `make lint`, `make conflicts`, je `; echo EXIT=$?`.
- [ ] Commit `test: I-210 Messlauf stabile Stadt`.
