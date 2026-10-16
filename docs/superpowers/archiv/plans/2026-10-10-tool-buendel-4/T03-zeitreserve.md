# T03 · `zeitreserve-push` ohne Testsperre, `make check` gibt `loadStart` aus

Strang `tool` · Worktree `.worktrees/b4` · Branch `tool/b4` · Umsetzer B `tech-ui-engineer` (sonnet) · AK-TB4-05, AK-TB4-06 · Retro V2, R438 V3 · Grösse S (≈ 15 Tools)

**Files:**

- Modify: `Makefile` (Ziel `zeitreserve-push`, Z. ≈ 32–34, nur Hilfetext und Rezeptzeile), `tools/zeitreserve/check.ts` (Z. 62–78)
- Test: `tests/tools/zeitreserve.test.ts` (Fixture `zeitreserve-fixture.json`, nur Kopf und die `--push`-Fälle lesen)
- Nicht ändern: `docs/studio/STUDIO.md` (T08, `studio-coach`), `tools/testlock/`

**Befund:** `zeitreserve-push` liest nur `.studio/zeitreserve.json`, die aktuelle Last zählt seit R438 V3 nicht. Die Testsperre (`node $(TESTLOCK) …`) bricht aber bei Last > 8 ab (Exit 2/3) — Widerspruch. `check.ts` druckt `loadStart` nur mit `--push`.

- [ ] **Step 1: Test zuerst (rot)** in `tests/tools/zeitreserve.test.ts`:
  - `ohne --push: gibt loadStart aus`: Lauf mit Fixture (`loadStart: 2.1`) → stdout enthält `zeitreserve: loadStart 2.1`, Exit-Code wie bisher.
  - `loadStart > 4: Zusatz`: Fixture mit `loadStart: 7.4` → Zeile enthält `für Push nicht belastbar, make check ruhig wiederholen`; Exit-Code unverändert (kein neuer Abbruch).
  - `--push` mit fehlender, leerer oder halb geschriebener (abgeschnittenes JSON) `zeitreserve.json`: Exit ≠ 0 (2), nie 0 (Rennen mit laufendem `make check`, jetzt ohne Sperre; R465 B2).
  - `--push mit loadStart 7.4`: weiterhin Exit 2 (bestehender Test bleibt grün).
  - Test für das Makefile: Datei lesen, die Zeile des Ziels `zeitreserve-push:` suchen und `TESTLOCK` darf in seinem Rezept **nicht** vorkommen (einfacher String-Test; Makefile über `fs.readFileSync`).
- [ ] **Step 2:** `npx vitest run tests/tools/zeitreserve.test.ts` (gezielter Einzeldatei-Lauf, R465 B1; nur wenn kein Push ansteht, R464 V1; sonst Schritt später) → Rot erwartet.
- [ ] **Step 3: Umsetzen:** In `check.ts` die Zeile Z. 77–78 (`if (PUSH) console.log(… Last vor dem Lauf …)`) ersetzen durch eine für alle Aufrufe gedruckte Zeile `zeitreserve: loadStart <x.x>` plus bei `> 4` den Zusatz ` — für Push nicht belastbar, make check ruhig wiederholen`; Die Zeile für den Nicht-Push-Zweig «Last (1 min)» bleibt unverändert; vorhandene Tests mit «Last vor dem Lauf (Messung)» mitprüfen und bei Bedarf anpassen. Fehlt `loadStart` (altes Format): `zeitreserve: loadStart unbekannt`. In `Makefile`: Rezept `@node tools/zeitreserve/check.ts --push`, Hilfetext: «… ohne Testsperre (liest nur die Messung)».
- [ ] **Step 4:** `make lint` Exit 0; Vitest-Datei grün. Kein vollständiges `make check` im Task (macht das Final-Review).
- [ ] **Step 5:** `git add Makefile tools/zeitreserve/check.ts tests/tools/zeitreserve.test.ts && git commit -m "fix: zeitreserve-push ohne Testsperre, make check zeigt loadStart"`
