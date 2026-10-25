# T07 Dominanz B6–B9 mit Ersatzmass

Persona `tech-sim-engineer` · Strang B · Tools ≈ 70 · AK-BS-04 (B6, B7, B8, B9) · blocked-by T06. **Last ≤ 4 nötig** (Dateidauer).

**Files:** Modify `tests/sim/petitionWorlds.ts` (`SCENES` ergänzen). Create `tests/sim/petitionsDominance-b6b9.test.ts`. Kein `src/`-Diff, keine Def-Änderung (wie T06).

## Interfaces

- Consumes (T06): `PETITION_SEEDS`, `PetitionScene` (inkl. `feed`, `answerAt`), `duel`, `chainsAt`, `measuredOver`, `SCENES`.
- Consumes (Sim): `twoIslandWorld` bzw. Fremdinseln aus `createWorld` (`world.islands`), Schiffe und Routen über die bestehenden Aktionen (`rg -n "export function" src/sim/ships.ts`), Krisenzustand `world.crisis` (Form in `src/sim/types.ts` `Crisis`, Sturm in `src/sim/crises.ts` `case 'storm'`, Dauer aus `src/sim/defs/timing.ts`).
- Produces: `SCENES.spiceSeed`, `.woolMarket`, `.returnees`, `.granary`.

## Lagen (Anhang 01, Zeilen B6–B9) und Ersatzmass (Anhang 02, B-5)

- **B7 Ja:** 3 Webereien auf HOME, Wolle 80 und Wolle ü = 30 %, Stoff 40, Stoff ü = 0. **Nein:** 3 Webereien warten auf Wolle (Wolle 20, Wolle-Produktion = Webereibedarf), Stoff 30.
- **B8 Ja:** 4 Bürgerhäuser, ü = 15 % bei Nahrung, Stoff und Rum. **Nein:** P1 mit ü = 0, Nahrung 38.
- **B6 Ja:** Plantage auf einer Fremdinsel, Route mit freiem Schiffsraum, Fremdlager Gewürz 20, Heimat Gewürz 40. **Nein:** Fremdlager Gewürz 100 (voll), Schiff voll ausgelastet; Heimat Gewürz 12, Zufuhr = Bedarf.
  - **Versuch echte Route** mit höchstens 20 Tools Aufwand. Vorbedingung Ja: Im Fenster kommt mindestens eine zusätzliche Ladung in der Heimat an (Zähler im Lauf).
  - **Sonst Testzufuhr** (`feed`): Gewürz kommt alle `L` Ticks mit fester Menge in die Heimat (L = Umlauf der Route, Menge = Ladung). In der Ja-Lage ist die Ladung kleiner als der Fremdbestand, der Zusatz kommt an. In der Nein-Lage ist die Ladung gleich dem vollen Schiffsraum, der Zusatz bleibt im Fremdlager (Lager 100, verfällt). Mass bleibt der Nettowert in der Heimat. Welcher Weg gewählt wurde, steht im Bericht und im Dateikopf.
- **B9 Ja:** Krisen «normal», Sturm beginnt im Fenster, Lager Stoff, Rum und Nahrung je 100, ü = 10 %. **Nein:** Krisen aus, Nahrung 90, ü = 0.
  - **Sturm setzen:** Der Test setzt `world.crisis` direkt auf einen Sturm mit festem Start `answerAt + delay + 300` und der Dauer aus `timing.ts`, in beiden Zweigen gleich. Damit der Krisenstrom nichts Zweites zieht, steht `crisisLevel` auf `'normal'`, der nächste Krisentermin liegt hinter dem Fenster (Feld laut `types.ts`).
  - **Sonst fester Ausfall** gleicher Grösse: halber Takt der `stormAffected`-Betriebe über 300 T, per `outageUntil` bzw. dem Ausfallfeld aus `types.ts` (Rechnung §1), ohne Eingriff in `crises.ts`. Die Wahl steht im Bericht.
- **Vorbedingung B9 Nein:** Lager ≥ 90 (sonst wäre B9 nicht ziehbar); bei ü = 0 bleibt der Zusatzraum leer.

## Erwartungen

Wie T06 (Vorbedingungen zuerst, dann nur Rangfolgen). B6 Ja: Zusatzladung angekommen. B9: `incident` meint hier «Krise ausser dem gesetzten Sturm». Dazu der Bericht mit Werten, Abstand und `measuredOver` je Bitte, Lage und Seed.

## Schritte

- [ ] **Rot per Stub (nie committen):** `reward.pct` von B6/B7 vorübergehend 100 und `reward.plus` von B9 0 → die Ja-Lagen B6, B7, B9 verlieren (Exit ≠ 0). B8: `reward.pct` 0 → die Ja-Lage verliert. Werte zurück, `git diff --quiet src/; echo EXIT=$?` = 0.
- [ ] Lagen bauen; kalibriert werden nur Aufbaugrössen.
- [ ] Lauf: `make messfenster; echo EXIT=$?`, `/usr/bin/time -p npx vitest run tests/sim/petitionsDominance-b6b9.test.ts; echo EXIT=$?`. **Soll < 30 s**, sonst Messregel (T06).
- [ ] Teilbeleg: `npx vitest run tests/sim/petitionsDominance-b1b3.test.ts; echo EXIT=$?` (Helfer unverändert wirksam), `npx tsc --noEmit`, `make lint`, `make conflicts`, je `; echo EXIT=$?`.
- [ ] Commit `test: I-210 Dominanz B6 bis B9`.
