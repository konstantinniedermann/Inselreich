# T05 · Budget-Warnung beim Lead-Start (TOOL-BUDGET-WARN, E-055)

Strang `py` · Worktree `.worktrees/b3-py` · Branch `tool/b3-py` · Umsetzer `tech-sim-engineer` A (sonnet) · AK-TB3-01…04 · Grundlage R443 V1, `docs/studio/experimente.md` E-055 (Z. ~518–528), Handbuch „Freigabe“ (Phase = Paket-ID der Kopfzeile, E-013, R433) · Grösse S (≈ 30 Tools) · Prüfregel V3 (Index)

**Files:**

- Create: `tools/studio/budgetwarn.py` (rein, ohne Seiteneffekte ausser Lesen der Event-Datei)
- Modify: `tools/studio/modelguard.py` (`main`, Z. ~107–146; Docstring Z. 1–7 um einen Satz ergänzen)
- Create: `tools/studio/tests/test_budgetwarn.py`; Modify: `tools/studio/tests/test_modelguard.py` (Klasse `HookTest`, nur neue Fälle)
- **Nicht ändern:** `.claude/settings.json` (der Hook `modelguard.py` läuft schon bei `PreToolUse` `Agent|Task`), `hook.py`, `guard.py`, `MODE`, `model_table`, `reason`, `unknown_alias` (AK-TB3-04)

## Regel (Index E3)

1. **Lead?** Rolle = `modelguard._persona(tool_input)` (Typ oder `Persona:`-Kopfzeile bei `general-purpose`); nur Rollen mit Präfix `lead-`; `subagent_type` `fork` nie.
2. **Budget?** Kopfzeile `Budget:` in den ersten 15 Zeilen (gleiche Lesart wie `modelguard._header`). Erste ganze Zahl im Wert = n; keine Zahl („keins“, „keins, keine Agenten starten“) oder n = 0 → keine Prüfung.
3. **Freigaben:** `paths.events_file()` als Text lesen; nur Zeilen, die `"budget"` enthalten, mit `json.loads` parsen (Datei ≈ 18 MB, 64 000 Zeilen, ≈ 300 Budget-Zeilen; ohne Vorfilter zu langsam für den 5-s-Hook). Gültig: `kind == "budget"`, `session_id` = `payload["session_id"]`, `role` = Rolle des Starts. Lesefehler oder fehlende Datei → **keine** Warnung (Fehler lassen zu).
4. **Warnung A (AK-TB3-01)** keine gültige Freigabe der Rolle: `Budget-Warnung (E-055): <rolle> startet mit „Budget: <n>“, in dieser Session gibt es keine Freigabe. Vor dem Start: python3 tools/studio/log.py budget --lead <rolle> --grant <n> --phase <Paket> …`
5. **Warnung B (AK-TB3-02)** Freigaben der Rolle vorhanden, keine mit `budget.phase` = Kopfzeile `Paket:` (Vergleich ohne Gross/klein, getrimmt): `Budget-Warnung (E-055): Freigabe für Phase <Paket> fehlt (vorhanden: <phasen>); das Dashboard zählt den Start sonst auf die jüngste Freigabe (E-013).` Ohne `Paket:`-Kopfzeile nur Regel A.
6. **Ausgabe:** Event `{"kind": "budget_warn", "source": "hook", "persona": <rolle>, "package": <Paket>, "summary": <Text[:160]>, …}` wie `model_guard`; dann JSON `{"hookSpecificOutput": {"hookEventName": "PreToolUse", "additionalContext": <Text>}, "systemMessage": <Text>}`. **Nie** `permissionDecision`.
7. **Vorrang (AK-TB3-04):** Ist der Modell-Guard im Modus `deny` und lehnt ab, gibt `main` nur dessen Ausgabe aus (der Start findet nicht statt). Genau **ein** JSON-Objekt auf stdout.

Folge-Controller (R433): Ihre Kopfzeile trägt dasselbe `Paket:`, die Freigabe derselben Session existiert → keine Warnung. Nach einem Session-Wechsel muss L0 laut Handbuch neu freigeben; dann ist Warnung A richtig.

## Schritte

- [ ] **Schritt 1: Tests zuerst (rot)** `tools/studio/tests/test_budgetwarn.py` (unittest, Muster `test_modelguard.py`), Funktionen z. B. `budget_count(prompt)`, `grants(text, sid)`, `warning(tool_input, grants)`; Namen frei, aber rein:
  - `test_budget_count`: „Budget: 12 Starts, Parallelität 2“ → 12; „Budget: keins“ → None; „Budget: 0“ → None; ohne Zeile → None; Zeile 16 zählt nicht; fett `**Budget:** 5` → 5.
  - `test_grants_filter_session_and_kind`: Textzeilen gemischt (andere Session, `kind: status` mit Wort „budget“ im Text, kaputte JSON-Zeile) → nur die passenden.
  - `test_warns_without_grant` (A), `test_warns_on_phase_mismatch` (B, nennt vorhandene Phasen), `test_no_warning_with_matching_grant`, `test_phase_case_insensitive`.
  - `test_no_warning_cases`: `Budget: keins`, Nicht-Lead (`tech-ui-engineer` mit Budget: 3), `fork`, `general-purpose` mit `Persona: lead-tech` und passender Freigabe; `general-purpose` mit `Persona: lead-tech` ohne Freigabe → warnt.
  - In `test_modelguard.py` `HookTest` (Subprozess wie die bestehenden Fälle, `STUDIO_HOME` mit eigener `events.jsonl`): `test_budget_warning_output_and_event` (ein JSON, `additionalContext` und `systemMessage` gleich, kein `permissionDecision`, Event `budget_warn`), `test_deny_wins_over_budget_warning`, `test_missing_events_file_is_silent`.
  - Lauf: `make studio-test; echo EXIT=$?` → rot (Modul fehlt), Ausgabe zitieren.

- [ ] **Schritt 2: Umsetzung** `budgetwarn.py` (≤ 80 Zeilen, Docstring mit E-055/R443, Kommentar zum Vorfilter) und `modelguard.main`: den frühen Rücksprung `if not found and not note: return 0` so umbauen, dass die Budget-Prüfung danach läuft; Modell-Guard-Zweig unverändert.

- [ ] **Schritt 3: Prüfen (V3)**

```bash
make studio-test; echo EXIT=$?
make studio-lint; echo EXIT=$?
echo '{"hook_event_name":"PreToolUse","tool_name":"Agent","session_id":"x","tool_input":{"subagent_type":"lead-tech","prompt":"Persona: lead-tech\nPaket: P\nBudget: 3"}}' | STUDIO_HOME=$(mktemp -d) python3 tools/studio/modelguard.py; echo EXIT=$?   # Exit 0, keine Ausgabe (keine Event-Datei)
```

Laufzeitprobe gegen die echte Event-Datei (nur lesen): `time (echo '<obige Zeile mit session_id der laufenden Session>' | python3 tools/studio/modelguard.py)`; Wert im Bericht, Soll < 1 s.

- [ ] **Schritt 4: Commit** `feat: Budget-Warnung beim Lead-Start (E-055, R443)` mit Session-Trailer.

## Abnahme (Reviewer)

- AK-TB3-01…04 je mit Testnamen; Rot-Beleg; Gegenprobe E-055 (keine Warnung bei „Budget: keins“ und Folge-Controllern) ausdrücklich belegt.
- Hook wirft nie (kaputte Eingabe → Exit 0, keine Ausgabe); stdout höchstens ein JSON-Objekt.
