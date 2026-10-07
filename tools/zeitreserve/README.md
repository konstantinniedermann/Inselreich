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

**Altlasten:** `baseline.json` listet Tests (`Datei :: Name`), die beim Einführen schon gegen die Regel
verstiessen (auch ab 600 ms, weil lokale Messungen um die 1-s-Schwelle streuen). Die Liste darf nur kleiner werden: Eintrag entfernen, sobald der Test ein Timeout hat oder
aufgeteilt ist. Neue Verstösse gehören nie hinein.

**Grenzen:** Gemessen wird die Laufzeit im lokalen Lauf (bei parallelem Lauf unter Last eher zu hoch, nie zu
niedrig); Tests unter 1 s bleiben unbeachtet. Der Schritt prüft nur Tests, die tatsächlich liefen, und liest den Bericht des letzten `npm test`-Laufs (immer erst `make test`, nicht einen alten Bericht auswerten). Einträge der Baseline ohne passenden Test meldet er als Warnung. Warnungen (1–2 s) sind Hinweise: im Zweifel gleich ein Timeout setzen.

**Doku-Format:** `make lint` (`prettier --check .`) deckt `docs/` ab, solange es nicht in `.prettierignore`
steht. Vor Doku-Commits genügt `make docs-check` (nur Prettier, schnell); beheben mit `npx prettier --write <Datei>`.
