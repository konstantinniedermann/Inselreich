# zeitreserve — CI-Reserve für Tests (E-032, R270)

`make check` führt nach `make test` den Schritt `make zeitreserve` aus.

**Ablauf:** `npm test` nutzt neben dem Standard-Reporter `tools/zeitreserve/reporter.ts`; er schreibt
Laufzeit und wirksames Timeout je Test nach `.studio/zeitreserve.json`. `check.ts` wertet die Datei aus.

**Regel:** `Laufzeit × Faktor ≤ 50 % × Timeout`. Lokal ist der Faktor 4 (Timeout ≥ 8 × Laufzeit, R270);
auf GitHub Actions (`GITHUB_ACTIONS=true`) ist die gemessene Zeit schon CI-Zeit, dort gilt Faktor 1
(Timeout ≥ 2 × Laufzeit). **Fehler** erst ab 2000 ms Laufzeit; zwischen 1000 und 2000 ms nur eine **Warnung**
(Lastrauschen lokal), darunter nichts. Beim Standard von 5 s braucht also jeder Test ab 2 s ein eigenes
Timeout (`it(name, fn, 30_000)`) oder wird aufgeteilt. Die Meldung nennt Datei, Test, Messung und ein
passendes Timeout.

**Geschätzte Runner-Zeit (E-043):** `check.ts` prüft zusätzlich `lokale Laufzeit × RUNNER_FACTOR (3)` mit der
Runner-Regel (Faktor 1, Fehler ab 2000 ms, Warnung ab 1000 ms, Reserve ≤ 50 % Timeout). Beim Standard-Timeout
5 s fällt so ein Test ab etwa 834 ms lokal auf. Meldungen nennen „geschätzte Runner-Zeit“. Auf GitHub Actions
entfällt die Hochrechnung (Faktor 1, gleiche Prüfung wie oben). Die Baseline gilt für beide Modi;
`.studio/zeitreserve.json` bleibt unverändert.

**Last:** `check.ts` nennt in der Kopfzeile `Last (1 min)`. Lokal bei Load > 4 (`LOAD_MAX`, wie `lastgate.mjs`)
sind Messungen nicht belastbar: Verstösse erscheinen nur als Warnung, der Exit-Code bleibt 0; Lauf bei ruhiger
Last wiederholen. Auf GitHub Actions gilt immer hart (`loadVerdict`).

**Altlasten:** `baseline.json` listet Tests (`Datei :: Name`), die beim Einführen schon gegen die Regel
verstiessen (auch ab 600 ms, weil lokale Messungen um die 1-s-Schwelle streuen). Die Liste darf nur kleiner werden: Eintrag entfernen, sobald der Test ein Timeout hat oder
aufgeteilt ist. Neue Verstösse gehören nie hinein.

**Push-Gate (R338):** `make zeitreserve` bleibt bei Load > 4 (1 min) eine Warnung (Exit 0), weil die Last durch parallele Agenten meist darüber liegt. `make zeitreserve-push` (nach `make test`) ist vor dem Session-End-Push Pflicht: bei Load > 4 Exit 2 "nicht belastbar" ohne Ergebnis (warten), sonst harte Prüfung (Exit 1 bei Verstoss). Die Schwelle `LOAD_MAX` steht nur in `rule.ts`. Tests simulieren Last mit `ZEITRESERVE_FAKE_LOAD`.

**Messdatei (R353):** `.studio/zeitreserve.json` ist ein Objekt `{ commit, loadStart, loadEnd, loadMax, timings }` (Commit = `git rev-parse HEAD`, Last = 1-min-Load beim Start und am Ende des Laufs). `make zeitreserve-push` nimmt nur eine Messung mit Commit = aktueller HEAD und `loadStart` ≤ 4 an (R394: Last vor dem Lauf; `loadEnd`/`loadMax` enthalten die Eigenlast von Vitest, bleiben in Datei und Meldung zum Nachrechnen); sonst Exit 2 „nicht belastbar“ mit Grund (alter Commit, zu hohe Last vor dem Lauf, altes Array-Format oder fehlendes `loadStart`), dann `make test` neu laufen lassen. `make zeitreserve` bleibt locker und zeigt nur einen Hinweis. Tests simulieren den HEAD mit `ZEITRESERVE_FAKE_HEAD`.

**CI-Faktor der Perf-Budgets (R353):** `CI=true` wirkt nur in `tests/helpers/perfBudget.ts`. `make check-ci-perf` führt deshalb nur die Testdateien aus, die `perfBudget` nutzen, mit `CI=true` aus (statt eines zweiten vollen `CI=true make check`); es schreibt kein `zeitreserve.json`.

**Grenzen:** Gemessen wird die Laufzeit im lokalen Lauf (bei parallelem Lauf unter Last eher zu hoch, nie zu
niedrig); Tests unter 1 s bleiben unbeachtet. Der Schritt prüft nur Tests, die tatsächlich liefen, und liest den Bericht des letzten `npm test`-Laufs (immer erst `make test`, nicht einen alten Bericht auswerten). Einträge der Baseline ohne passenden Test meldet er als Warnung. Warnungen (1–2 s) sind Hinweise: im Zweifel gleich ein Timeout setzen.

**Doku-Format:** `make lint` (`prettier --check .`) deckt `docs/` ab, solange es nicht in `.prettierignore`
steht. Vor Doku-Commits genügt `make docs-check` (nur Prettier, schnell); beheben mit `npx prettier --write <Datei>`.

**Testsperre (R375):** `make test`, `make check` und `make zeitreserve-push` laufen unter `tools/testlock/testlock.ts` (eine Sperre je Repo über alle Worktrees, Abbruch mit Exit 3 bei belegter Sperre oder 1-min-Load > 8, nicht auf CI). `TESTLOCK_FAKE_LOAD` und `TESTLOCK_PATH` gibt es nur für Tests, nie zum Umgehen echter Prüfungen (R378).
