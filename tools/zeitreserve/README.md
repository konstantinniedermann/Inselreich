# zeitreserve — CI-Reserve für Tests (E-032, R270)

`make check` führt nach `make test` den Schritt `make zeitreserve` aus.

**Ablauf:** `npm test` nutzt neben dem Standard-Reporter `tools/zeitreserve/reporter.ts`; er schreibt
Laufzeit und wirksames Timeout je Test nach `.studio/zeitreserve.json`. `check.ts` wertet die Datei aus.

**Regel:** Ein Test mit lokaler Laufzeit ≥ 1000 ms braucht `Laufzeit × 4 ≤ 50 % × Timeout`
(also Timeout ≥ 8 × Laufzeit; Faktor 4 lokal → CI und Reserve nach R270). Beim Standard von 5 s ist das
nie erfüllt; solche Tests brauchen ein eigenes Timeout (`it(name, fn, 30_000)`) oder werden aufgeteilt.
Die Meldung nennt Datei, Test, Messung und ein Timeout, das die Regel erfüllt.

**Altlasten:** `baseline.json` listet Tests (`Datei :: Name`), die beim Einführen schon gegen die Regel
verstiessen (auch ab 600 ms, weil lokale Messungen um die 1-s-Schwelle streuen). Die Liste darf nur kleiner werden: Eintrag entfernen, sobald der Test ein Timeout hat oder
aufgeteilt ist. Neue Verstösse gehören nie hinein.

**Grenzen:** Gemessen wird die Laufzeit im lokalen Lauf (bei parallelem Lauf unter Last eher zu hoch, nie zu
niedrig); Tests unter 1 s bleiben unbeachtet. Der Schritt prüft nur Tests, die tatsächlich liefen.

**Doku-Format:** `make lint` (`prettier --check .`) deckt `docs/` ab, solange es nicht in `.prettierignore`
steht. Vor Doku-Commits genügt `make docs-check` (nur Prettier, schnell); beheben mit `npx prettier --write <Datei>`.
