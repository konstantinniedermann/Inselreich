# T09 · Nachzug vor dem Merge-Gate: `git merge main`, Save-Nummer prüfen

Umsetzer `tech-sim-engineer` (Fortsetzung der T02-Instanz per `SendMessage`, sonst Neustart) · ≈ 25 Tools · AK-ST-11 (Lauf), AK-ST-12 (Lauf) · blocked-by: T08, Final-Review OK · Worktree `.worktrees/stadtrecht` · Plan P-3 · Review per `SendMessage` an den T02-Reviewer

## Zweck

Zwischen T02 und dem Merge-Gate kann ein weiterer Save-Sprung auf main landen (R874 4: Stadtrecht zuletzt). T09 holt main herein und stellt sicher, dass Stadtrecht **main + 1** trägt.

## Steps

- [ ] `git merge main` (kein Rebase, kein Force). Konflikte nur in den Dateien aus der Ownership-Tabelle lösen; andere Konflikte → `blocked` an den Controller.
- [ ] `git show main:src/sim/save.ts | rg -n "SAVE_VERSION ="` → `m`. Ist `SAVE_VERSION` im Branch = `m + 1`: weiter mit dem Teilbeleg. Sonst:
  - `SAVE_VERSION = m + 1`, `createWorld` `version: m + 1`, Migration umbenennen auf `migrateV<m>ToV<m+1>` (Aufruf in `deserialize`, Import in `tests/sim/charter-save.test.ts`), Kette: die Migration des neuen Vorgängers läuft vor der Stadtrecht-Migration.
  - Faltketten wie T02 Step 0: neuer Vorgänger-Schritt innen, `foldBackCharter` bleibt aussen; neue exakte Versions-Pins des Vorgängers → `≥` (P-4).
  - `docs/arc42.md` Save-Zeile auf die neue Nummer.
- [ ] **Teilbeleg:** `npx vitest run $(rg -l "deserialize\(" tests/sim) tests/sim/charter.test.ts tests/sim/charter-levers.test.ts tests/ui/council.test.ts tests/ui/councilCard.test.ts; echo EXIT=$?`, `npx tsc --noEmit; echo EXIT=$?`, `make lint; echo EXIT=$?`, `make zeittests; echo EXIT=$?`, `make conflicts; echo EXIT=$?`, `make docs-check; echo EXIT=$?` → je 0.
- [ ] **Abschluss (Controller, einmal, bei freier Testsperre):** `make check; echo EXIT=$?` (Hintergrund-Bash, Abfrage ≤ 4 min, E-037); Balancing-Diff leer (Index, Prüfpflichten). Die `balance*`-Läufe für AK-ST-12 sind Teil von `make check` hier und des Release-`make push-check` (R810).
- [ ] **Commit** (nur bei Änderung): `fix: Stadtrecht-Save auf main + 1 nachgezogen`.

## Review

Delta-Review per `SendMessage` an den T02-Reviewer: Nummer = main + 1, Kette vollständig, keine Nummer in Tests. Ändert sich nichts ausser dem Merge, genügt der Teilbeleg im Ledger (Begründung im Bericht, R270).
