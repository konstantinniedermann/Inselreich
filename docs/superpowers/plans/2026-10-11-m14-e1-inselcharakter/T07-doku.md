# T07 · Doku: README, arc42, Hauptspec-Verweis (E-017)

Strang SIM · Worktree `.worktrees/m14-e1` (nach Merge von `feat/m14-e1-ui` per Merge-Commit) · Umsetzer
`tech-sim-engineer` (sonnet) · Spec §11 · blocked-by T05, T06 · ≈ 20 Tools

**Erlaubte Dateien (D1, ausdrücklich):** `README.md`, `docs/arc42.md`,
`docs/superpowers/specs/2026-09-29-inselreich-design.md` (nur ein Verweis im Abschnitt Fremdinseln). Sonst nichts.

## Schritte

- [ ] 0. Controller merged den abgenommenen T06-Hash in `feat/m14-e1` (Merge, kein Rebase); `make check; echo
EXIT=$?` grün (Controller).
- [ ] 1. `grep -n "Ferne Inseln\|Seefahrt und Gewürz\|Felsbucht\|Möweninsel" README.md`; `grep -n "generateForeignIslands\|ISLANDS_SALT\|SAVE_VERSION\|cycleOf\|Persistenz" docs/arc42.md`.
- [ ] 2. README «Ferne Inseln» und «Seefahrt und Gewürz»: drei Fremdinseln mit Grösse und Stärken (Möweninsel nah,
      Felsbucht Gebirge+ = Steinbruch und Glashütte ×2, Weidenau Fruchtbar = Zuckerrohrplantage und Schäferei ×2),
      Zusatzzeilen in Inselkarte, Seekarte, Gebäude-Info und Bauleiste; Taste `9` über vier Inseln. Werte nur wie in den
      Defs (Grössen 24/36/24, Faktor 2).
- [ ] 3. arc42: Weltgenerierung (dritte Fremdinsel im Strom `ISLANDS_SALT`, Stufen 1–3 der Lage, Stufe 3 ohne Zufall,
      Verweis ADR-010 Nachtrag M14-E1), Persistenz (v13, `migrateV12ToV13` mit eingefrorenem Literal und Lagevergleich,
      Ladeprüfung 4 Inseln, `foldBackToV12` im Testteil), Bausteinsicht `levels.ts` (`cycleOf(world, b)`,
      `islandCycle`, `traitOf`, Faktor an genau einer Stelle). Mermaid ohne `\n` in Labels.
- [ ] 4. Hauptspec: ein Satz mit Verweis auf die Spec M14-E1 im Abschnitt Fremdinseln.
- [ ] 5. `make docs-check; echo EXIT=$?` → 0. Commit `docs: README, arc42 und Hauptspec für M14-E1 (T07)`.
