# T05 · zeitreserve `--push` nur nach `loadStart`; Testlücke `ps`-Fehler der Testsperre

Strang `ts` · Worktree `.worktrees/b2-ts` · Branch `tool/b2-ts` · Umsetzer `tech-ui-engineer` (sonnet) · AK-TB2-11, 12 · Grundlage R438 V3, Retro `docs/studio/retros/2026-10-10-release-rel14-prozess.md` B4/V3, R394, R353; `docs/beobachtungen.md` („Testlücke bei `ps`-Fehler in der Testsperre“, „R429-Risiko: `zeitreserve-push` verwirft die Messung bei Last > 4“) · Grösse S (≈ 20 Tools)

**Files:**

- Modify: `tools/zeitreserve/check.ts` (Kopfkommentar Z. 2–3, `VERDICT`, `main` Z. 52–57, Lastzeile)
- Test: `tests/tools/zeitreserve.test.ts` (Blöcke „zeitreserve CLI bei Last (Push-Gate, R338)“ Z. 153–183 und „CLI --push mit Metadaten“ Z. 226–278), `tests/tools/testlock.test.ts` (Block „verwaiste Vitest-Prozesse“, Z. 164 ff.)
- Nicht ändern: `tools/zeitreserve/rule.ts` (`measurementProblem` bewertet schon nur `loadStart`, R394), `tools/zeitreserve/reporter.ts`, `tools/testlock/*.ts`, `Makefile` (Hilfetext ändert T06), `docs/studio/STUDIO.md` (Push-Ablauf ändert der studio-coach, Index E6)

## Teil A · `--push` bewertet nur die Messung (AK-TB2-11)

**Ursache (Retro B4):** `check.ts --push` prüft zwei Lasten: die Last der Messung (`measurementProblem`, `loadStart` ≤ 4) **und** die aktuelle 1-min-Last beim Aufruf (Z. 52–57, Exit 2). Direkt nach `make check` liegt die aktuelle Last regelmässig über 4, weil `make check` sie selbst erzeugt; die reine Dateiauswertung hängt davon nicht ab. Der Kopfkommentar Z. 2–3 („Last > 4 während des Laufs“) widerspricht `rule.ts` Z. 141.

**Regel:**

- Mit `--push`: **kein** Abbruch wegen der aktuellen Last; die Prüfung ist streng (`VERDICT = 'strict'`), Exit 2 nur über `measurementProblem` (Commit ≠ HEAD, `loadStart` > 4, fehlende Metadaten/altes Format). Die Lastzeile nennt `Last vor dem Lauf (Messung): <loadStart>` statt der aktuellen Last.
- Ohne `--push` unverändert: aktuelle Last > 4 → Verstösse nur als Warnung, Exit 0.
- Umsetzung ≈ 10 Zeilen: `const VERDICT = PUSH ? 'strict' : loadVerdict(LOAD, ON_CI);` und den Block `if (PUSH && VERDICT === 'unreliable') { … return 2; }` streichen; `ZEITRESERVE_FAKE_LOAD` bleibt (Kommentar „nur für Tests“ steht).
- Kopfkommentar Z. 2–3 neu, sinngemäss: „Mit `--push` (make zeitreserve-push, Pflicht vor dem Push, R338): kein Ergebnis (Exit 2), wenn die Messung einen anderen Commit als HEAD hat, die Last vor dem Lauf (`loadStart`) > 4 war oder das alte Format hat (R353, R394); die aktuelle Last zählt nicht (R438 V3).“

**Tests zuerst (rot)** — im Block „CLI bei Last (Push-Gate, R338)“:

- Den Test `--push bei Last > 4: kein Ergebnis, Exit 2 mit Meldung` **ersetzen** durch `--push bei aktueller Last 9: harte Prüfung, Verstoss gibt Exit 1` (`run('9', '--push').status === 1`, stderr ohne „warten“). Rot vorher: 2. Vorher prüfen, dass `tests/tools/zeitreserve-fixture.json` das neue Format mit `commit: 'abc'` und `loadStart` ≤ 4 hat (der bestehende Test „--push bei Last <= 4 … Exit 1“ setzt das voraus); sonst im Test eine eigene Datei wie im zweiten Block schreiben.
- Im Block „CLI --push mit Metadaten“ neue Fälle mit `ZEITRESERVE_FAKE_LOAD: '9'` (Hilfsfunktion `run` um einen Lastparameter erweitern, Standard `'1'`): `passende Messung bei aktueller Last 9: Exit 0` (rot vorher: 2); `hohe Last vor dem Lauf bleibt Exit 2 auch bei aktueller Last 1` (bestehender Fall, nur bestätigen).
- `lokal bei Last > 4 ohne --push: Verstoss nur Warnung, Exit 0` bleibt unverändert grün.
- `test` Kopfkommentar: `expect(readFileSync(check,'utf8')).not.toContain('während des Laufs')` — klein, pinnt die Korrektur.

## Teil B · `ps`-Fehler ändert nichts (AK-TB2-12)

Die Testsperre liest `ps` (im Test `TESTLOCK_PS_FIXTURE`) in `reportOrphans` im `try`. Kein Test belegt die Fehlerrichtung.

**Test (Testlücke, Verhalten existiert):** im Block „verwaiste Vitest-Prozesse“ `ps-Fehler (Fixture fehlt): Befehl läuft, Exit unverändert, kein Hinweis` — `run({ TESTLOCK_PS_FIXTURE: join(tmp, 'fehlt.txt') }, 'node', '-e', 'process.exit(4)')` → `status === 4`, `stderr` enthält nicht „verwaist“ und keinen Stacktrace (`not.toContain('Error')`). Weil das Verhalten schon stimmt, ist der Test nicht rot: **Mutationsprobe** statt Rot-Beleg — `try`/`catch` in `reportOrphans` lokal kurz entfernen, Test muss rot werden, Änderung verwerfen (`git checkout -- tools/testlock/testlock.ts`), im Bericht beide Ausgaben zitieren.

## Prüfbefehle

```bash
npx vitest run tests/tools/zeitreserve.test.ts tests/tools/testlock.test.ts; echo EXIT=$?   # erst rot (Teil A), dann grün
make lint; echo EXIT=$?
```

Echtlauf `--push` (nach `make test` im Worktree liegt `.studio/zeitreserve.json` vor; sonst überspringen und im Bericht vermerken):

```bash
ZEITRESERVE_FAKE_LOAD=9 node tools/zeitreserve/check.ts --push; echo EXIT=$?   # 0 oder 1, nie 2 wegen Last
```

Danach einmal `make check` über die Testsperre (Exit 3 = später erneut, `waiting` an den Controller).

## Commits

`fix: zeitreserve-push bewertet nur die Last vor dem Lauf (R438 V3)` (check.ts + zeitreserve-Tests), `test: Testsperre bei ps-Fehler`; Trailer der Session.

## Bericht

Je AK: Testnamen, rot-vorher-Ausgabe bzw. Mutationsprobe, Echtlauf, Exit-Codes, `git diff --stat main...HEAD`.
