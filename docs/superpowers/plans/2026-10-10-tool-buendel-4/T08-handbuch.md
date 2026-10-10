# T08 · STUDIO.md: Zeilen zu `zeitreserve-push` nachführen

Strang `tool` · Worktree `.worktrees/b4` · Branch `tool/b4` · Umsetzer `studio-coach` (sonnet) · AK-TB4-16 · blocked-by T03 · R465 B2 · Grösse S (≈ 10 Tools)

**Files:**

- Modify: `docs/studio/STUDIO.md` — nur die Stellen zu `zeitreserve-push` (≈ Z. 367 und 427–430: «mit repo-weiter Sperre» entfernen; Satz ergänzen: `zeitreserve-push` liest nur die Messung `.studio/zeitreserve.json`, läuft ohne Testsperre und bewertet nur `measurementProblem`, nicht die aktuelle Last, R438 V3), Handbuch-Version auf 1.44 (Minor), Kopf-/Versionszeile nach vorhandenem Muster
- Modify: `docs/studio/CHANGELOG.md` — Eintrag 1.44 (Anlass: TOOL-BUENDEL-4 T03, R465)
- Nicht ändern: `VERFASSUNG.md`, `Makefile` (T03), Code

- [ ] **Step 1:** `grep -n "zeitreserve-push" docs/studio/STUDIO.md` — jede Fundstelle prüfen, nur die zur Sperre ändern.
- [ ] **Step 2:** Änderung und Changelog; keine neuen Regeln, nur Angleichung an den Ist-Stand nach T03.
- [ ] **Step 3:** `make docs-check` Exit 0 (`npx prettier --write` auf beide Dateien erlaubt).
- [ ] **Step 4:** `git add docs/studio/STUDIO.md docs/studio/CHANGELOG.md && git commit -m "docs: Handbuch 1.44 zeitreserve-push ohne Testsperre"`
