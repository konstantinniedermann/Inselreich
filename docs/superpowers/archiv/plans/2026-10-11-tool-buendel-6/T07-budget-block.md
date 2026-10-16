# T07 — E-060 Budget-Hook blockt Lead-Starts ohne Freigabe (AK-TB6-16 … AK-TB6-18, R503 B9)

**Dateien:** `tools/studio/budgetwarn.py` (`warning` Z. 47–72), `tools/studio/modelguard.py` (`_budget_warn` Z. 104–136, Aufrufe Z. 157 und 180), `tools/studio/tests/test_budgetwarn.py`, `tools/studio/tests/test_modelguard.py`, `docs/arc42.md` (Hook-Absatz ≈ Z. 596). Grundlage: R497, `docs/studio/experimente.md` E-060 (≈ Z. 580), R433 V3 (b) (Folge-Controller ohne eigene Freigabe), Handbuch 1.45 (`Paket:` = Phasen-ID), `model._grant_names`/`_package_token` (Z. 176–185).

**AK-TB6-16 (Block):** Ein Agent-Start mit Persona `lead-*` und Kopfzeile `Budget: n` (n > 0) wird mit `permissionDecision: "deny"` abgewiesen, wenn in der Session keine `budget`-Freigabe derselben Rolle existiert **oder** keine dieser Freigaben zur Kopfzeile `Paket:` passt. „Passt“ = `phase.casefold()` ∈ {Paket, `_package_token(Paket)`} (casefold), dieselbe Namensregel wie `model._grant_names`. Die Begründung nennt den fertigen Befehl `python3 tools/studio/log.py budget --lead <rolle> --grant <n> --phase <Paket-Token> …` und die vorhandenen Phasen.

**AK-TB6-17 (kein Fehlblock):** Kein Block bei „Budget: keins“/0, bei Nicht-Leads und Typen aus `SKIP_TYPES`, bei Lead mit passender Freigabe (auch zweite Controller-Instanz desselben Pakets ohne eigene Freigabe, R433 V3 b), bei fehlender `Paket:`-Zeile und vorhandener Freigabe der Rolle (heutiges Verhalten), und bei jedem eigenen Fehler (Ereignisdatei unlesbar, Ausnahme) → zulassen. Ein Modell-Guard-Deny hat Vorrang (eine Ausgabe, kein doppeltes JSON).
**AK-TB6-18 (Ereignis und Rückfall):** Jeder Block schreibt das bestehende Ereignis `kind: "budget_warn"` mit zusätzlichem Feld `blocked: true`; Warnungen im Rückfallmodus `blocked: false`. Konstante `BUDGET_MODE = "deny"` in `modelguard.py`; bei `"warn"` exakt das heutige Verhalten (Hinweis über `additionalContext`/`systemMessage`, kein Deny). Budgetansicht und `lead_stats.rows` unverändert.

## Schritte

- [ ] **Test zuerst** (`test_budgetwarn.py`, `test_modelguard.py`, Muster der bestehenden Tests mit Fake-Ereignisdatei über `STUDIO_HOME`/Temp-Pfad):
  1. Lead `lead-tech`, `Budget: 7`, keine Freigabe → stdout-JSON mit `permissionDecision: "deny"`, Ereignis `blocked: true`.
  2. Freigabe `--phase TOOL-BUENDEL-6-umsetzung`, Kopfzeile `Paket: TOOL-BUENDEL-6-umsetzung` → zugelassen; `Paket: TOOL-BUENDEL-6-umsetzung (Instanz 2)` → zugelassen (Token); `Paket: TOOL-BUENDEL-7` → Block mit Phasenliste.
  3. Freigabe in **anderer** Session → Block.
  4. `Budget: keins`, Persona `tech-sim-engineer`, `subagent_type` aus `SKIP_TYPES` → kein Ausgabe-JSON.
  5. Ereignisdatei fehlt/unlesbar → zulassen, Exit 0, kein JSON.
  6. Modell-Guard-Deny und fehlende Freigabe zugleich → genau ein Deny (Modell-Grund).
  7. `BUDGET_MODE = "warn"` (per `mock.patch`) → heutiges Warn-JSON, Ereignis `blocked: false`.
  8. Gleichheit der Namensregel: `budgetwarn` und `model._grant_names` liefern für dieselben Kopfzeilen dieselben Namen (Tabelle mit 4 Beispielen).
  9. **(B9) Reale Paare:** Fixture `tools/studio/tests/fixtures/budget_pairs.json` aus `.studio/events.jsonl` einmalig erzeugen (Skript im Bericht, nicht eingecheckt): je Session die `budget`-Ereignisse (`role`, `budget.phase`) und die `spawn`-Ereignisse mit `persona` `lead-*`, `package` und `Budget: n > 0` in `prompt_head`; gespeichert nur `role`, `package`, `phases`, `ts` (keine Session-IDs, keine Prompt-Texte). Test: Jedes Paar ab Handbuch 1.45 (Datum der `Paket:`-Regel, im Bericht belegt) wird zugelassen — `Paket:` = Freigabe-Phase oder deren Token. Ältere Paare, die blocken würden, zählt der Bericht (Anzahl und Beispiele); sie sind kein Testfehler.
- [ ] **Rot-Beleg (R395):** `python3 -m unittest tools.studio.tests.test_budgetwarn tools.studio.tests.test_modelguard; echo EXIT=$?` → `EXIT=1`, im Bericht.
- [ ] **Umsetzung:** `budgetwarn.warning` gibt zusätzlich zurück, ob blockiert werden soll (z. B. `(text, block: bool) | None`; Name `warning` beibehalten oder `check` mit Alias — bestehende Aufrufer anpassen). Paket-Abgleich über `_package_token`: aus `model` importieren, wenn der Import den Hook um ≤ 50 ms verlängert (`python3 -X importtime -c "import model"` im Bericht); sonst die Einzeiler-Funktion in `budgetwarn.py` kopieren (kein Verschieben in fremde Dateien), Test 8 sichert die Gleichheit. `modelguard._budget_warn` gibt bei Block das Deny-JSON aus (gleiche Form wie der Modell-Guard Z. 172–179).
- [ ] **Doku:** `docs/arc42.md` Absatz ≈ Z. 596: „blockt“ statt „warnt“, Rückfallschalter `BUDGET_MODE`, E-060.
- [ ] **Echtlauf (Bericht):** Hook direkt mit einer Beispiel-Eingabe aufrufen, ohne Agent-Start: `STUDIO_HOME=<scratchpad> python3 tools/studio/modelguard.py < <scratchpad>/probe.json; echo EXIT=$?` (PreToolUse-JSON mit `tool_name` Agent, Persona `lead-tech`, `Budget: 3`, `Paket: probe-x`) → Deny-JSON; mit Freigabe-Ereignis in der Scratchpad-Ereignisdatei → keine Ausgabe. Nie gegen die echte Ereignisdatei schreiben (`STUDIO_HOME`, `paths.py` Z. 47).
- [ ] **Prüfen:** beide Tests, `test_hook`, `test_model` (nur die Budget-Klassen per `-k`), Ruff wie in T03.

**Commit:** `feat: Budget-Hook blockt Lead-Starts ohne passende Freigabe (E-060)`

## Hinweise

- **Merge-Voraussetzung (R503, Prod-B4):** T07 wird erst gemergt, wenn alle laufenden Stränge Freigaben im Phasenformat haben (`Paket:` = Phase); der Controller prüft das vor dem Merge-Antrag mit dem Skript aus Test 9 über die laufende Session.
- Ab dem Merge muss L0 vor jedem Lead-Start mit `Budget: n` die Freigabe loggen; das steht im Handbuch erst nach dem studio-coach-Minor. Der Controller nennt das im Bericht als Merge-Voraussetzung (Index, Handbuch-Folgen).
- Hooks werfen nie (`except Exception` in `main` bleibt).
