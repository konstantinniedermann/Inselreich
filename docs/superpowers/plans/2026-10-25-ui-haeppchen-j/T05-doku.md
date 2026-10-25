# T05 · Doku

Umsetzer `tech-ui-engineer` (per `SendMessage`, E-017) · ≈ 8 Tools · blocked-by: T04

- `README.md`: Meldungen (Warnungen bleiben 7 s), Chronik-Zeile «Rat» in der Ruhe-Ansicht und Log-Eintrag «Rat beschliesst», Vorschauzeile in der Rats-Karte (Abschnitt «Rat»). Tabellenzeilen nur unten anfügen; bei Konflikt alle Zeilen behalten.
- `docs/arc42.md`: nur wenn Moduldoku zu `messages.ts`/`council.ts` betroffen ist (sonst nichts).
- `make docs-check; echo EXIT=$?` vor dem Commit. Commit `docs: UI-HAEPPCHEN-J README`.
- Danach Abschluss durch den Controller: `git diff main -- src/sim` leer, `SAVE_VERSION` unberührt, `tests/sim/balance.test.ts` grün.
