# T09 · Nachzug nach dem Stadtplanung-Merge: `git merge main`, Save v20 (F3)

Umsetzer `tech-sim-engineer` · ≈ 35 Tools · AK-SR-12, F3-Test, AK-SR-20 (Lauf) · blocked-by: Stadtplanung (`feat/stadtplanung`, Save v19, und `feat/stadtplanung-ui`) auf main, T08 · Worktree `.worktrees/seerecht` (`feat/seerecht`) · Spec §5 «Versionsnummer», §10, Plan P-3/P-4 · Steht Stadtplanung schon beim Start von T05 auf main, führt T05 diese Steps aus und T09 entfällt.

## Betroffene Stellen (Befund `git diff main...feat/stadtplanung` @ `fa6c1aeb`)

| Datei                                                  | Stadtplanung                                                                           | Seerecht                              | Erwartung                               |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------- |
| `src/sim/save.ts`                                      | `SAVE_VERSION = 19`, `'noSupply'` in `BUILDING_STATES`, `migrateV18ToV19`, Kettenzeile | T05 (Schiffe, `council`, Reihenfolge) | automatischer Merge; dann Version 20    |
| `src/sim/types.ts`                                     | `park`, `noiseRadius`, `parkRadius`, `roadless`, `noSupply`, `World.version: 19`       | T01 `CouncilSide`, `CouncilLever`     | automatischer Merge; dann `version: 20` |
| `src/sim/world.ts`                                     | `version: 19`                                                                          | –                                     | auf 20                                  |
| `tests/sim/council.test.ts`                            | Z. 431 (Weber-Lage)                                                                    | neue Blöcke am Ende                   | automatischer Merge                     |
| `src/ui/app.ts`                                        | 7 Hunks                                                                                | Z. ≈ 633                              | automatischer Merge                     |
| `tests/sim/merchantsController.ts`, `balance*.test.ts` | Controller-Umbau                                                                       | –                                     | Balancing neu laufen lassen             |

## Dateien

- ändern: `src/sim/save.ts` (`SAVE_VERSION = 20`, `migrateV19ToV20`, Kettenzeile nach `migrateV18ToV19`), `src/sim/types.ts` (`World.version: 20`), `src/sim/world.ts` (`version: 20`), `tests/sim/council-save.test.ts`, `docs/arc42.md` (Save-Zeile: Version 20, Kette v1…v20, `migrateV19ToV20` nur Nummer, Seerecht `'C'` nur Stufe 4)
- nur bei Bedarf: Tests, die `version` 19 als aktuelle Version pinnen (`rg -n "version.*19|SAVE_VERSION" tests` nach dem Merge; Migrationstests `migrateV18ToV19` bleiben)

## Interfaces

- Produces: `export function migrateV19ToV20(raw: Record<string, unknown>): void` (setzt nur `raw.version = 20`, wirft nie).

## Steps

- [ ] `git merge main` (kein Rebase); Konflikte nur nach Tabelle lösen, sonst `blocked` mit Datei und Hunk.
- [ ] **Tests rot** in `tests/sim/council-save.test.ts`:
  - `AK-SR-12`: ein v19-Stand ohne `'C'` (`serialize(createWorld(…))`, `version` auf 19 gesetzt) lädt; `council` und `ships` gleich; `migrateV19ToV20` auf einer Kopie ändert nur `version` (`sortedJson` ohne `version` gleich, `version` 20), wirft nie bei `{}`.
  - `F3` (Plan P-4): `const PRE_SEERECHT_VERSION = 19`; `expect(SAVE_VERSION).toBe(PRE_SEERECHT_VERSION + 1)`; Stand mit `council[4] = 'C'` hat `JSON.parse(serialize(w)).version === SAVE_VERSION`; derselbe Stand mit `version = SAVE_VERSION + 1` → `{ ok: false, reason: 'Unbekannte Version' }` (Versionsprüfung vor der Feldprüfung = Abweisungspfad eines älteren Builds). Testbeschreibung nennt «älterer Build weist Seerecht-Stand über die Version ab (F3)».
- [ ] **Lauf rot:** `npx vitest run tests/sim/council-save.test.ts; echo EXIT=$?` → ≠ 0.
- [ ] **Umsetzen** Version 20 nach Dateien.
- [ ] **Lauf grün:** `npx vitest run tests/sim/council-save.test.ts tests/sim/stadt-save.test.ts tests/sim/save.test.ts tests/sim/trial-save.test.ts tests/sim/council.test.ts tests/sim/seerecht.test.ts; echo EXIT=$?` → 0.
- [ ] **Lesestellen erneut:** `rg -n "travelTicks|laneTicks|SHIP_TICKS_PER_SEA_TILE" src tools` und `npx vitest run tests/sim/seerecht.test.ts` (Wächter fängt neue direkte Leser aus Stadtplanung); Befund im Bericht.
- [ ] **Balancing (AK-SR-20):** `npx vitest run tests/sim/balance.test.ts; echo EXIT=$?` und `tests/sim/balance-*.test.ts` → 0, ohne Diff an den Erwartungen.
- [ ] **`tsc`, eslint/prettier** → 0; danach Controller: `make check; echo EXIT=$?` bei freier Sperre.
- [ ] **Commit:** `feat: Save v20 für Seerecht nach Stadtplanung (I-153 T09)`.

## Task-Review (per `SendMessage` an den T05-Reviewer)

Version = main + 1 (nie 19); Migration setzt nur das Versionsfeld; F3-Test prüft den Abweisungspfad über die Version; keine Stadtplanung-Erwartung aufgeweicht.
