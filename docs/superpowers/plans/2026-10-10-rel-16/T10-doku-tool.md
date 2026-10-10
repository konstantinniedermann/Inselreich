# T10 · Doku TOOL, Zusammenführung, voller `make check`

Strang `py` · Worktree `.worktrees/b3-py` · Branch `tool/b3-py` · Umsetzer `tech-sim-engineer` B (sonnet, per SendMessage nach T09 fortgesetzt; D1-Dateien ausdrücklich erlaubt, E-017) · AK-TB3-16 · Grösse S (≈ 15 Tools) · blocked-by T09 und T11 (je Review OK) · kein eigenes Task-Review: das Final-Review T12 deckt T10 ausdrücklich ab (Präzedenz R441 B3)

**Files:**

- Modify: `docs/arc42.md` — **nur** Abschnitt Verteilungssicht, Liste „Entwicklung“, Punkt **Studio-Werkzeuge** (Z. ~582–596; Ownership `py`, Index E4). Abschnitte zu `src/ui` (Bausteine, Cursor-Hinweis, `dispose`) gehören Strang `ui`.
- Modify: `docs/adr/ADR-014-studio-riegel.md` (Abschnitt „Konsequenzen“ oder neuer Abschnitt „Nachtrag 2026-10-10 (TOOL-BUENDEL-3)“)
- Modify: `docs/studio/experimente.md` — **nur** Eintrag E-055 (Z. ~518–528)
- Modify: `Makefile` — nur Hilfetexte, falls T07–T09 sie nicht schon gesetzt haben
- Merge: `tool/b3-qa` → `tool/b3-py`

## Schritte

- [ ] **Schritt 1: Zusammenführen.** `git merge --no-ff tool/b3-qa -m "refactor: tool/b3-qa in tool/b3-py zusammengeführt (TOOL-BUENDEL-3)"` plus Session-Trailer (nur die Präfixe der Konvention; vorher `git log --oneline -3` von beiden Branches). Keine Konflikte erwartet (disjunkte Dateien); bei Konflikt anhalten und an den Controller melden.

- [ ] **Schritt 2: arc42 „Studio-Werkzeuge“.** Korrigieren und ergänzen (Texte knapp, Stil des Absatzes):
  - **Korrektur:** „Der Modell-Guard … meldet Starts über der Modelltabelle als Ereignis `model_guard` (Startzustand nur Warnung)“ ist veraltet — er lehnt sie ab (`MODE = "deny"`, TOOL-AKTIVIERUNG, R428).
  - **Budget-Warnung (E-055):** Im selben Hook-Prozess warnt `budgetwarn.py` bei einem Lead-Start mit „Budget: n“ ohne passende Freigabe der Session (Rolle und Phase = `Paket:`); Ausgabe als Kontext und Systemmeldung, Ereignis `budget_warn`, nie Ablehnung.
  - **`test_failed` (R450 V1):** `make test` und `make studio-test` laufen über `tools/studio/testrun.py`; rote Läufe schreiben `test_failed` mit Testnamen, grüne `test_passed` (Commit und Diff-Prüfsumme), nicht in CI; `make studio-metrics`/`metrics.py --efficiency` zeigen die Ampelzeile „Flake-Verdacht“.
  - **Uhr (R450 V2):** `tools/studio/clock.py` ist die gemeinsame Uhr (`frozen()` nur für Tests); `make studio-lint` warnt bei direktem `datetime.now(`/`time.time(`.
  - **`make zeittests`** prüft beide Richtungen (Wandzeit-Test fehlt in `ZEITTESTS`, Eintrag ohne Wandzeit-Aufruf).

- [ ] **Schritt 3: ADR-014 Nachtrag** (≤ 12 Zeilen): Entscheidung „Budget-Warnung im Modell-Guard-Prozess statt in `hook.py`“ mit Grund (läuft nur bei `Agent|Task`, keine neue Hook-Zeile, `hook.py` läuft bei jedem Werkzeugaufruf), Modus Warnung statt Ablehnung (E-055: Fehlwarnungen messen, bevor ein Riegel daraus wird), Rückfall `git revert`. Verweise R443, Plan `docs/superpowers/plans/2026-10-10-rel-16/index.md` E3.

- [ ] **Schritt 4: E-055** in `experimente.md`: Überschrift „übernommen als Werkzeug (R443, TOOL-BUENDEL-3)“, Felder `Ruling:` R443 und Gate-Ruling (L0 nennt es im Merge-Gate; bis dahin „Gate Merge TOOL-BUENDEL-3“), `Start:` Datum des Merges offen lassen („mit Merge“), `Dateien:` auf `tools/studio/budgetwarn.py`, `tools/studio/modelguard.py`, `tools/studio/tests/` korrigieren. Messgrösse und Gegenprobe unverändert.

- [ ] **Schritt 5: Prüfen und Commit**

```bash
make docs-check; echo EXIT=$?
make studio-lint; echo EXIT=$?
```

Commit `docs: TOOL-BUENDEL-3 arc42, ADR-014, E-055` mit Session-Trailer.

- [ ] **Schritt 6 (Controller 2): Strang-Ende, einziger voller Lauf (V3).** `uptime` (bei 1-min-Load > 4 warten, R394/R450 V4), dann `make check; echo EXIT=$?` über die Testsperre (Exit 3 → `waiting` loggen, später erneut). Ergebnis und `uptime` danach im Ledger; erst dann T12 starten.

## Abnahme (durch T12)

- Doku stimmt mit dem Code aus T05–T09 und T11 überein; arc42 nur im eigenen Abschnitt geändert (`git diff main -- docs/arc42.md` zeigt nur Z. ~582–600).
