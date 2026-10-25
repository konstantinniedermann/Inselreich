# T12 Dominanz B4–B5

Persona `tech-sim-engineer` · Strang B · Tools ≈ 45 · AK-BS-04 (B4, B5) · blocked-by T11, T07. **Last ≤ 4 nötig.**

**Vorlauf:** `feat/i210` (mit T11) per Merge in `feat/i210-mess` (kein Rebase). Danach `npx vitest run tests/sim/petitionsDominance-b1b3.test.ts tests/sim/petitionsDominance-b6b9.test.ts; echo EXIT=$?` grün: I-201 kann Kosten und Takt verändert haben (R553). Kippt eine Lage, meldest du das, bevor du weiterarbeitest.

**Files:** Modify `tests/sim/petitionWorlds.ts` (`SCENES.bell`, `.feastDrink`). Create `tests/sim/petitionsDominance-b4b5.test.ts`. Kein `src/`-Diff.

## Interfaces

- Consumes (T06): `PETITION_SEEDS`, `duel`, `SCENES`; (T11) `bellActive`, `voucherAt`; (I-201) `holdFeast(world, id, kind)`, Lage A aus `tests/sim/feastWorlds.ts` als Vorbild (aufstiegsbereite Häuser, Muster AK-I007-02). Übernimm nur das Muster, importiere nicht aus `feastWorlds.ts`, damit die Dateien entkoppelt bleiben.

## Lagen (Anhang 01, B4, B5)

- **B4 Ja:** Kapelle, 5 Häuser im Radius aufstiegsbereit innerhalb des Fensters (wie I-201 Lage A), Rum 30, Stein 30. **Nein:** Plateau, alle Häuser im Radius Stufe 4, Rum 15, Rum-Produktion = Bedarf.
- **B5 Ja:** Kapelle in Abklingzeit, Aufstiegswelle wie B4-Ja; der Test hält nach dem Nachspiel ein Aufstiegsfest (Gutschein), im Nein-Zweig dasselbe Fest, sobald die Abklingzeit es erlaubt (sonst keins). **Nein:** Plateau wie B4-Nein, Rohr 25, Rohr-Produktion = Bedarf der Brennereien.
- **Mass:** wie T06; der Steuerzuwachs aus Aufstiegen im Fenster ist in ΔGeld enthalten (Spec AK-BS-04).

## Erwartungen

Vorbedingungen wie T06, dazu für B4-Ja: Im Ja-Lauf steigen mehr Häuser im Fenster auf als im Nein-Lauf. B5-Ja: Das Gutschein-Fest ist `ok`, Rum bleibt unverändert. Danach die Rangfolgen und der Bericht mit Werten, Abstand und Seed.

## Schritte

- [ ] **Rot per Stub (nie committen):** Die Gutschein-Wirkung schaltest du nicht über die Defs ab. Rot entsteht stattdessen über `delay` von B4 und B5 vorübergehend 9999, damit die Wirkung ausserhalb des Fensters liegt: Die Ja-Lagen verlieren (Exit ≠ 0). Werte zurück, `git diff --quiet src/; echo EXIT=$?` = 0.
- [ ] Lagen bauen; kalibriert werden nur Aufbaugrössen.
- [ ] Lauf: `make messfenster; echo EXIT=$?`, `/usr/bin/time -p npx vitest run tests/sim/petitionsDominance-b4b5.test.ts; echo EXIT=$?`, Soll < 30 s.
- [ ] Teilbeleg: `npx tsc --noEmit`, `make lint`, `make conflicts`, je `; echo EXIT=$?`.
- [ ] Commit `test: I-210 Dominanz B4 und B5`.
