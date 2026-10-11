# T03 — Save A: Ladeprüfung, Rundlauf, Fixture, Abweisen

**Persona:** `tech-sim-engineer`. Derselbe Arbeiter wie T02 wird per SendMessage fortgesetzt (kein neuer Start). Worktree `.worktrees/i048-sim`, Branch `feat/i048-sim`. Er beginnt erst nach dem T02-Review mit Urteil OK.

**Spec-Abschnitte:** §8 (Feld, Ladeprüfung, inkompatible Stände), §9.2 AK-ZK-16…18. Save v12 geteilt (R505).

**AK:** AK-ZK-16 (Rundlauf), AK-ZK-17 (Migration mit Fixture), AK-ZK-18 (Abweisen und Hinweis).

**Dateien:** `src/sim/save.ts` (Ladeprüfung), neu `tests/sim/buyPct-save.test.ts`, neu `tests/ui/buyPctReason.test.ts`, Fixtures **nur neu** unter `tests/sim/fixtures/`. `tests/sim/save*.test.ts` und die bestehenden Fixture-Dateien bleiben **unverändert** (AK-ZK-13).

## Fixture (qa B7)

- **v11-Stand:** Gibt es `tests/sim/fixtures/save-v11.json` aus M13-E2 schon (Ledger), wird er genutzt. Der Test setzt `sellPct.wood = 55` im rohen JSON vor dem Laden; das ist eine kommentierte Zeile.
- Sonst wird er **mit echtem v11-Code** erzeugt, nicht über die Rückfaltung:
  ```bash
  git worktree add <scratch>/v11 <M>^1   # M = Merge-Commit M13-E2-SIM laut Ledger, erster Elternteil = v11-Code
  ```
  Dort legt ein Wegwerf-Test im Scratchpad-Baum `createWorld(3)` an, rechnet 300 `step`, setzt `sellPct.wood = 55` und schreibt `serialize(w)` nach `tests/sim/fixtures/save-v11.json` im Branch. Danach `git worktree remove <scratch>/v11`. Der Wegwerf-Test wird nicht committet.
- Die Entstehung kommt in den Commit-Text (Commit, Seed, Ticks).

## Schritte

- [ ] **Test zuerst** `tests/sim/buyPct-save.test.ts`:
  - AK-ZK-16: Welt mit `buyPct` {tools 137, spice 160, sonst 100} → `deserialize(serialize(w))` ist ok und `toEqual` der Welt.
  - AK-ZK-17: Der v11-Stand lädt → ok, `version` = `SAVE_VERSION`, alle `buyPct` 100, `sellPct.wood` 55. Ausserdem lädt die Kette v1…v10 weiter (Schleife über die vorhandenen Fixtures; nur prüfen, dass `buyPct` überall alle 100 ist).
  - AK-ZK-18: Je ein Fall mit `buyPct.tools` 99, 161, 120.5, `'120'`, Gut fehlt (`delete raw.buyPct.glass`), `buyPct` fehlt, `buyPct` `null` → `{ ok: false, reason: 'Beschädigter Spielstand' }`, kein Wurf. Version `SAVE_VERSION + 1` → `'Unbekannte Version'`. Hilfsmuster `tampered` aus `save.test.ts` (dort lokal; hier nachbauen, nicht importieren, wenn es nicht exportiert ist).
  - **Zusätzlich (Spec §8):** Ein v12-Stand **ohne** `buyPct` (z. B. `serialize` einer Welt, dann `delete raw.buyPct`) → `'Beschädigter Spielstand'` (Spec §8: lokale v12-Stände ohne `buyPct` gelten als beschädigt).
- [ ] **Test zuerst** `tests/ui/buyPctReason.test.ts` (Teil von AK-ZK-18): `friendlyReason(w, 'Beschädigter Spielstand')` und `friendlyReason(w, 'Unbekannte Version')` aus `src/ui/hints.ts` liefern je einen nicht leeren Text.
- [ ] Lauf: `npx vitest run tests/sim/buyPct-save.test.ts tests/ui/buyPctReason.test.ts; echo EXIT=$?` → **rot** (die Ladeprüfung fehlt; 99, 161 usw. laden heute). Rote Tests ins Ledger.
- [ ] **Umsetzung** `save.ts`: `isValidBuyPct(raw)` nach dem Muster `isValidV2Fields`. `raw.buyPct` muss ein Objekt sein, und für jedes `GOOD_IDS` gilt `isInt(v) && v >= 100 && v <= BUY_CAP`; `BUY_CAP` wird aus `defs/goods` importiert. Der Aufruf steht in der v12-Prüfung von M13-E2 (`isValidV12Fields`). Der Grund bleibt der bestehende `'Beschädigter Spielstand'` (gleicher Pfad wie die übrigen Prüfungen).
- [ ] **Grün:** `npx vitest run tests/sim/buyPct-save.test.ts tests/ui/buyPctReason.test.ts tests/sim/save.test.ts tests/sim/save-v11.test.ts tests/ui/storage.test.ts tests/sim/scenario-saves.test.ts; echo EXIT=$?` → 0.
- [ ] `npx eslint src/sim tests && npx prettier --check src/sim tests; echo EXIT=$?`.
- [ ] Prüfen: `git diff --stat main -- tests/sim/save.test.ts tests/sim/save-v11.test.ts tests/sim/save-v12.test.ts` zeigt nichts. `git diff --diff-filter=MD main -- tests/sim/fixtures/` ist leer.

**Commits:** `test: I-048 Save buyPct Rundlauf, Migration, Abweisen (rot)` · `feat: Ladeprüfung buyPct (I-048 Save)` · Fixture: `test: Fixture save-v11.json aus v11-Code (I-048 AK-ZK-17)`.

**Review-Fokus:** Abweisen wirft nie und lässt das laufende Spiel unverändert (Verfassung §3). Die Grenzen kommen aus `BUY_CAP`, keine Zahl 160 im Code. Die Fixture stammt nachweislich aus v11-Code. Keine Änderung an bestehenden Fixtures oder an `save*.test.ts`.
