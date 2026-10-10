# T04 · `budget_key`: Kopfzeilen-Präfix und parallele Controller

Strang `tool` · Worktree `.worktrees/b4` · Branch `tool/b4` · Umsetzer A `tech-sim-engineer` (sonnet) · AK-TB4-07, AK-TB4-08 · blocked-by T02 (Reihenfolge) · Grundlage Beobachtung «Budget-Zuordnung», R433, Retro B5 (b) · Grösse S (≈ 20 Tools)

**Files:**

- Modify: `tools/studio/model.py` — nur `_Builder.budget_key` (Z. ≈ 769–797) und ggf. eine kleine Hilfsfunktion davor
- Test: `tools/studio/tests/test_model.py` — neue Klasse `BudgetKeyHeaderTest` am Dateiende (Datei ≈ 2400 Z.: nur Kopf mit Imports/Helfern und die bestehenden Budget-Tests, Suche `grep -n "budget" tests/test_model.py`, lesen)
- Nicht ändern: `claim_budgets`, `lead_phases`, Ampel-Logik

**Befund:** `budget_key` bildet `names = {child["package"], lead_node["package"]}` und vergleicht mit `grant["phase"]` per Gleichheit. Die Kopfzeile `Paket: M13-E1 — UI-Strang, Tasks T09–T12` ergibt das Paket `M13-E1 — UI-Strang, …` → kein Treffer → Rückfall «jüngste freie Freigabe derselben Rolle». Beanspruchte Freigaben (`self.claims`) scheiden im Rückfall aus, der zweite Controller derselben Phase landet bei einer fremden Freigabe → falsches Rot «2 von 1».

**Regel (genau):** Paket-Token = alles bis zum ersten Leerzeichen, Tab, `—`, `–`, `:` oder `(` (Zeichen davor ohne Rand-Leerraum); `M13-E1-b` bleibt ein Token (Bindestrich ist kein Trenner). Treffer, wenn Token == Phase **oder** Gesamtpaket == Phase (alte Regel). Ein Namenstreffer gilt **auch dann**, wenn `self.claims` die Freigabe einem anderen Lead derselben Rolle zuschreibt (parallele Controller derselben Freigabe zählen gemeinsam, R433); die Rückfall-Regel für Starts ohne Namenstreffer bleibt unverändert.

- [ ] **Step 1: Tests zuerst (rot)** — Aufbau wie die vorhandenen Budget-Tests der Datei (Events `budget_grant`, `agent_start` o. Ä.; vorhandenen Helfer wiederverwenden, nicht neu erfinden):
  - `test_header_with_suffix_hits_phase`: Freigabe `M13-E1` (36) und jüngere Freigabe `UI-GUT-CHIP` (1); Controller mit `Paket: M13-E1 — UI-Strang, Tasks T09–T12` startet einen Arbeiter → Zählung auf `M13-E1`, `UI-GUT-CHIP` bleibt bei 0.
  - `test_header_delimiters`: `M13-E1: Text`, `M13-E1 (UI)`, `M13-E1 – Text`, `M13-E1` treffen dieselbe Phase.
  - `test_header_prefix_needs_delimiter`: Freigaben `M13-E1` und `M13-E1-b`; Kopfzeile `M13-E1-b — x` trifft `M13-E1-b`, nicht `M13-E1`.
  - `test_parallel_controllers_share_grant`: zwei Lead-Knoten derselben Rolle, beide `Paket: M13-E1 — …`, je ein Arbeiter-Start → `M13-E1` zählt 2, kein Eintrag auf einer fremden Freigabe (Ampel nicht rot).
- [ ] **Step 2:** `python3 tools/studio/testrun.py --suite studio -- python3 -m unittest tools/studio/tests/test_model.py` bzw. `make studio-test` → die vier Tests rot.
- [ ] **Step 3: Umsetzen:** Hilfsfunktion `_package_token(text: str) -> str` (reguläres `re.split(r"[\s—–:(]", text.strip(), maxsplit=1)[0]`), `names` um die Tokens beider Pakete ergänzen; Namenstreffer-Schleife läuft **vor** dem `claims`-Filter (tut sie schon) und bleibt davon unberührt — Schritt prüfen, ob `claim_budgets` selbst die Freigabe nur einem Lead zuschreibt und ob Ampel/Zähler `budget_key` je Start aufrufen (dann genügt die Änderung hier; sonst im Bericht benennen, nicht ausweiten).
- [ ] **Step 4:** `make studio-lint` und `make studio-test` Exit 0 (Testanzahl vorher/nachher im Bericht).
- [ ] **Step 5:** `git add tools/studio/model.py tools/studio/tests/test_model.py && git commit -m "fix: Budget-Zuordnung erkennt Paket-Kopfzeile mit Zusatz"`
