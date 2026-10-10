# T07 · Doku: ADR-014, Beobachtungen, Rulings

Strang `tool` · Worktree `.worktrees/b4` · Branch `tool/b4` · Umsetzer B `tech-ui-engineer` (sonnet; Doku-Task mit Eigentümer, E-010) · AK-TB4-15, schliesst AK-TB4-11/-12 · blocked-by T03, T06 · Grösse S (≈ 10 Tools)

**Files:**

- Modify: `docs/adr/ADR-014*.md` (Abschnitt «Konsequenzen», Zeilen um 54: «Im Modus `warn` hat der Guard keine Wirkung …» — den aktuellen Modus aus `tools/studio/modelguard.py` (`MODE`) lesen und den Satz an den Ist-Stand anpassen; nur diesen Satz, die Entscheidung bleibt)
- Modify: `docs/beobachtungen.md` — Abschnitte entfernen oder kürzen: «Dashboard-Server läuft dauerhaft auf 100 % CPU …» (erledigt, T01/T02), «Budget-Zuordnung: Paket-Kopfzeile …» (T04), «TOOL-BUENDEL-3 (R457): Restpunkte» → nur Punkt (5) Flake-Matching bleibt (mit Verweis «zurückgestellt, TOOL-BUENDEL-4»; (7) als «Grenze war Planfehler» geschlossen), «REL-16 (R454): render-qa-Werkzeug» (T06). REL-16/17-Abschnitte zu `src/` **unangetastet**.
- Modify: `docs/studio/rulings.md` — Rulings aus dem Ledger `.superpowers/sdd/tool-buendel-4/ledger.md` am Dateiende anhängen (Format der vorhandenen Einträge, nächste freie Nummer **am Mergetag neu bestimmen**, `grep -n "^## R" docs/studio/rulings.md | tail -3`).
- Nicht ändern: `STUDIO.md`, `arc42.md` (keine Änderung an Modulen, Tick-Ablauf oder Persistenz), `README.md`.

- [ ] **Step 1:** Vor dem Bearbeiten `git merge main` in `tool/b4` (M13-E1 hängt an denselben Dateiende-Bereichen von `beobachtungen.md`/`rulings.md`); Konflikt = beide Anhänge behalten.
- [ ] **Step 2:** Änderungen wie oben. Kein Test (Doku); `make docs-check` Exit 0 (`npx prettier --write` auf die drei Dateien erlaubt).
- [ ] **Step 3:** `git add docs/adr docs/beobachtungen.md docs/studio/rulings.md && git commit -m "docs: ADR-014 Stand, Beobachtungen und Rulings TOOL-BUENDEL-4"`
- [ ] **Step 4 (Controller, nicht Umsetzer):** Übergabe «bereit fürs Final-Review» an L0; das Final-Review (`qa-code-reviewer` auf opus) führt `make check` über die Testsperre aus und prüft: `zeitreserve: loadStart` erscheint, `make studio` zweimal hintereinander, `make studio-lint` und `make studio-test` Exit 0.
