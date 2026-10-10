# T02 · E-049 nach Freigabephase (TOOL-E049-PHASE)

Strang `py` · Worktree `.worktrees/b2-py` · Branch `tool/b2-py` · Umsetzer `tech-sim-engineer` (sonnet), **gebündelt mit T03** (gleiche Instanz, T02 zuerst, eigener Commit) · AK-TB2-02, 03, 04 · Grundlage R433 V2, Retro `docs/studio/retros/2026-10-09-session-c64c0775-ende.md` V2, Index-Entscheide E1, E2 · Grösse M (≈ 30 Tools)

**Files:**

- Modify: `tools/studio/model.py` (Ausgabe von `build_state`: neuer Schlüssel `lead_phases`; Zuordnung `claim_budgets` um Z. 798–812 **nur lesen, nicht ändern**), `tools/studio/efficiency.py` (`compute`, `_compute`, `_instance`, `_summary`, `_lead_stats`, `_adjusted_line`, Lead-Tabelle in `_lead_lines`), `tools/studio/metrics.py` (`build`, `main` Zweig `--efficiency`)
- Test: `tools/studio/tests/test_efficiency.py` (neue Klasse `PhaseAdjustTest`; vorhandene Helfer `write`, `agent`, `prompt`, `assistant`), `tools/studio/tests/test_model.py` (neue Klasse am Dateiende), `tools/studio/tests/test_metrics.py`
- Nicht ändern: `THRESHOLDS`, `LIGHT_LABELS`, `_lights`, `CLASSES`, `role_class` (Rohzeile und Klassen bleiben, E1), `effort.py`, `docs/studio/`

Lesen nur abschnittsweise: `efficiency.py` Z. 85–100 (`BUDGET_*`), 346–520 (`_instance` … `_summary`), 580–605 (`_lead_stats`), 745–760 (`_adjusted_line`), 819–845 (`_lead_lines`); `model.py` Z. 740–812 und die Stelle, an der `build_state` sein Ergebnis-Dict baut (`grep -n '"budgets": self.budget_view()' tools/studio/model.py`).

## Regel

1. **Zuordnung (E2):** `model.build_state(...)` liefert zusätzlich `lead_phases: dict[str, str]` = für jede Freigabe in `self.claims` den Eintrag `{lead_node_key: phase}` (Knotenschlüssel ist `"<session_id>:<agent_id>"`). Keine neue Zuordnungslogik — nur die Umkehrung der vorhandenen `claims` nach `claim_budgets()`.
2. **Instanz-Schlüssel:** In `efficiency._compute` hat jede Subagenten-Instanz den Schlüssel `f"{main.stem}:{path.stem.removeprefix('agent-')}"` (Transkript `<sid>.jsonl`, Subagent `<sid>/subagents/agent-<agent_id>.jsonl`). `phase = phases.get(key)`; L0 hat keine Phase.
3. **Herausgerechnet** wird eine Instanz der Klasse `Leads`, wenn ihre Phase mit `plan-`, `design-` oder `gate-` beginnt (Gross/klein egal; Konstante `EXEMPT_PHASES = ("plan-", "design-", "gate-")`) **oder** sie `budget_none` hat (bestehende Regel). Grund je Instanz genau einer, in dieser Reihenfolge: `plan`, `design`, `gate`, sonst `budget_keins`.
4. **Ergebnis-Schlüssel** in `compute`: bestehend `steuerung_bereinigt`, `steuerung_heraus`, `steuerung_heraus_n` (jetzt über beide Kriterien) plus neu `steuerung_heraus_grund: {"plan": float, "design": float, "gate": float, "budget_keins": float}` (Kostenanteile, Summe = `steuerung_heraus`). Je Instanz Feld `phase: str | None`; `lead_stats.rows[*]["phase"]`.
5. **Signatur:** `compute(mains, persona_models=None, phases=None)`; ohne `phases` verhält sich alles wie heute (nur `Budget: keins`). `compute` wirft weiter nie.
6. **metrics.py:** `build` reicht `state["lead_phases"]` an beide `efficiency.compute`-Aufrufe (Session und Meilenstein). Der Zweig `--efficiency` baut dafür `model.build_state(events, now, models, "all")` (Events werden dort ohnehin geladen; vor den Aufruf von `compute` ziehen).

## Ausgabe

`_adjusted_line` bleibt eine Zeile **ohne Ampel-Präfix** direkt nach den Ampelzeilen, neuer Wortlaut:

```text
- Steuerungsanteil bereinigt (E-049, ohne 5 Lead-Instanzen mit Freigabephase plan-/design-/gate- oder „Budget: keins“): 30.1 %, Bewertung gelb (Schwellen wie die Rohzeile; herausgerechnet 41.6 %: Plan 35.4 %, Design 3.9 %, Gate 2.0 %, nur Budget keins 0.3 %; roh = bereinigt + herausgerechnet)
```

Lead-Tabelle (`_lead_lines`): eine Spalte `Phase` nach `Paket` (leer, wenn `None`). Prettier-Sauberkeit der Metrikdatei bleibt (bestehender Test `test_render_is_prettier_clean`).

## Schritt 1 · Tests zuerst (rot)

`test_efficiency.py`, Klasse `PhaseAdjustTest` — Aufbau wie `AdjustedControlTest` (L0 + Lead-Subagenten mit `agentType: lead-tech`, ein Umsetzer); `phases` als Dict mit Schlüsseln `"s1:l0"` usw. (Agent-Name im Helfer `agent` = Datei `agent-<name>.jsonl`, Namen entsprechend wählen):

- `test_plan_phase_lead_is_removed`: Lead mit Phase `plan-REL-15`, ohne `Budget: keins` → `steuerung_heraus_n == 1`, `steuerung_heraus_grund["plan"] > 0`, Gegenprobe `assertAlmostEqual(steuerung, bereinigt + heraus, places=9)`.
- `test_impl_phase_and_no_phase_count_as_control`: Phasen `impl-REL-15` und keine → nichts herausgerechnet.
- `test_phase_prefix_case_insensitive`: `Gate-plan-TOOL` → Grund `gate`.
- `test_phase_and_budget_none_counted_once`: Phase `plan-X` **und** `Budget: keins` → `n == 1`, Grund `plan`, `budget_keins == 0`.
- `test_without_phases_unchanged`: `compute(..., phases=None)` liefert dieselben Werte wie vorher (bestehende `AdjustedControlTest` bleibt grün).
- `test_raw_and_classes_unchanged`: `class_share` und `steuerung` identisch mit/ohne `phases`.
- `test_render_adjusted_line_reasons`: `render_section` enthält „Plan “ mit Prozentwert, beginnt nicht mit `- ROT:`/`- GELB:`/`- GRÜN:`.
- `test_lead_rows_have_phase`: `lead_stats["rows"]` trägt `phase`.

`test_model.py`, neue Klasse `LeadPhasesTest`:

- `test_lead_phases_from_claims`: Events `budget` (lead-tech, `plan-P`, ts 1) → `agent_start` lead-tech `a1` (ts 2) → `lead_phases == {"s1:a1": "plan-P"}`.
- `test_parallel_leads_get_own_phase`: zwei Freigaben (`plan-P` ts 1, `impl-Q` ts 3), zwei Lead-Starts (ts 2, ts 4) → je ihre Phase.
- `test_lead_without_grant_has_no_phase`: Start ohne Freigabe → Schlüssel fehlt.

`test_metrics.py`: `test_session_file_uses_lead_phases` — Fixture mit `budget`-Event `plan-…` und passendem Lead-Transkript; die geschriebene Datei enthält „Plan “ in der bereinigten Zeile.

```bash
python3 -m unittest discover -s tools/studio/tests -t tools/studio -k PhaseAdjust -k LeadPhases -k lead_phases; echo EXIT=$?   # rot
```

## Schritt 2 · Umsetzen

Reihenfolge: `model.build_state` → `efficiency` (Konstante, `_compute`-Schlüssel, `_instance(..., phase=None)`, `_summary`, `_lead_stats`, Ausgabe) → `metrics.build`/`main`. `efficiency` importiert `model` **nicht** (bleibt rein); die Phasen kommen als Dict herein.

## Schritt 3 · Grün und Echtlauf

```bash
make studio-test >/dev/null 2>&1; echo EXIT=$?
make studio-lint; echo EXIT=$?
python3 tools/studio/metrics.py --efficiency --sessions 1 > /tmp/eff.txt; echo EXIT=$?
grep -n "bereinigt" /tmp/eff.txt
```

Der Echtlauf läuft gegen die laufende Session (Hauptrepo-Transkripte, nur lesen) und schreibt keine Datei. Im Bericht die Zeile zitieren und von Hand gegenrechnen: roh − herausgerechnet = bereinigt (auf 0,1 Punkte). Erwartung für eine Session mit Plan-Instanzen: Grund `plan` > 0.

## Commit

`feat: E-049 rechnet Lead-Instanzen nach Freigabephase plan-/design-/gate- heraus`, Trailer der Session. Danach T03 im selben Baum.
