# T02b · Modell-Guard: Hook-Einstieg, Event, Eintrag in settings.json (TOOL-MODELL-GUARD)

Strang `guard` · Worktree `.worktrees/buendel-guard` · Branch `tool/buendel-guard` · Umsetzer `tech-sim-engineer` (sonnet), **im selben Start nach [T02a](T02a-modellregel.md)** · AK-TB08, TB12, TB13 · Grundlage E-038, R420 V1

**Files:**

- Modify: `tools/studio/modelguard.py` (`main()`), `tools/studio/tests/test_modelguard.py` (Klasse `HookTest`)
- Modify: `.claude/settings.json` (nur **neuer** PreToolUse-Eintrag; bestehende Einträge byte-gleich)
- Nie ändern: `tools/studio/guard.py` (Verfassung §1.3)

**Interfaces:** Consumes `model_table`, `reason`, `_persona`, `MODE`, `AGENT_TOOLS` aus T02a. Produces Event `{"kind": "model_guard", "source": "hook", "mode", "persona", "model", "summary"}` und die `deny`-Ausgabe für PreToolUse.

## Schritt 1 · Tests zuerst (rot)

In `tools/studio/tests/test_modelguard.py` ergänzen und oben die Importe `json`, `os`, `shutil`, `subprocess`, `sys`, `tempfile`, `from pathlib import Path` ergänzen:

```python
class HookTest(unittest.TestCase):
    def run_hook(self, payload, mode=None):
        with tempfile.TemporaryDirectory() as home, tempfile.TemporaryDirectory() as docs:
            shutil.copy(STUDIO, Path(docs) / "STUDIO.md")
            env = {**os.environ, "STUDIO_HOME": home, "STUDIO_DOCS": docs}
            script = Path(modelguard.__file__)
            done = subprocess.run(
                [sys.executable, str(script)], input=json.dumps(payload),
                env=env, capture_output=True, text=True,
            )
            events_path = Path(home) / "events.jsonl"
            lines = events_path.read_text("utf-8").splitlines() if events_path.exists() else []
            return done, [json.loads(line) for line in lines]

    def payload(self, **tool_input):
        return {"hook_event_name": "PreToolUse", "tool_name": "Agent",
                "session_id": "s1", "tool_input": tool_input}

    def test_deny_output_and_event(self):
        done, events = self.run_hook(self.payload(subagent_type="lead-qa", model="opus", prompt="Persona: lead-qa"))
        self.assertEqual(done.returncode, 0)
        out = json.loads(done.stdout)["hookSpecificOutput"]
        self.assertEqual(out["permissionDecision"], "deny")
        self.assertEqual(events[0]["kind"], "model_guard")
        self.assertEqual(events[0]["persona"], "lead-qa")

    def test_allowed_and_other_tools_are_silent(self):
        done, events = self.run_hook(self.payload(subagent_type="lead-qa", prompt="Persona: lead-qa"))
        self.assertEqual((done.stdout, events), ("", []))
        bash = {"hook_event_name": "PreToolUse", "tool_name": "Bash", "tool_input": {"command": "ls"}}
        self.assertEqual(self.run_hook(bash)[0].stdout, "")

    def test_broken_input_never_fails(self):
        done = subprocess.run([sys.executable, str(Path(modelguard.__file__))], input="kaputt", capture_output=True, text=True)
        self.assertEqual((done.returncode, done.stdout), (0, ""))
```

Ergänze einen Test für `MODE = "warn"` (per `unittest.mock.patch.object(modelguard, "MODE", "warn")` und direktem Aufruf von `modelguard.main()` mit gepatchtem `sys.stdin`/`sys.stdout`): Event geschrieben, keine Ausgabe. Lauf: `python3 -m unittest discover -s tools/studio/tests -t tools/studio -p 'test_modelguard.py' -k Hook; echo EXIT=$?` → rot. Rote Ausgabe in den Bericht.

## Schritt 2 · `main()` in `tools/studio/modelguard.py`

Importe oben ergänzen: `import contextlib`, `import json`, `import sys`.

```python
def main() -> int:
    try:
        from paths import agents_dir, append_event, docs_dir, now_iso
        from studio_docs import persona_meta, read_text

        payload = json.loads(sys.stdin.read() or "null")
        if not isinstance(payload, dict) or payload.get("hook_event_name") != "PreToolUse":
            return 0
        data = payload.get("tool_input")
        if payload.get("tool_name") not in AGENT_TOOLS or not isinstance(data, dict):
            return 0
        table = model_table(read_text(docs_dir() / "STUDIO.md"))
        found = reason(data, persona_meta(agents_dir()), table)
        if not found:
            return 0
        with contextlib.suppress(Exception):
            append_event({
                "ts": now_iso(), "session_id": str(payload.get("session_id") or ""),
                "agent_id": str(payload.get("agent_id") or "main"), "source": "hook",
                "kind": "model_guard", "mode": MODE,
                "persona": _persona(data),
                "model": str(data.get("model") or ""), "summary": found[:160],
            })
        if MODE == "deny":
            out = {"hookEventName": "PreToolUse", "permissionDecision": "deny",
                   "permissionDecisionReason": found}
            print(json.dumps({"hookSpecificOutput": out}, ensure_ascii=False))
    except Exception:  # noqa: BLE001 - Hooks werfen nie
        return 0
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

## Schritt 3 · Hook registrieren

In `.claude/settings.json`, Array `hooks.PreToolUse`, **nach** dem bestehenden Guard-Eintrag einen neuen Eintrag anfügen (bestehende Einträge nicht anfassen):

```json
{
  "matcher": "Agent|Task",
  "hooks": [
    {
      "type": "command",
      "command": "python3 \"$CLAUDE_PROJECT_DIR/tools/studio/modelguard.py\" 2>/dev/null || true",
      "timeout": 5
    }
  ]
}
```

Fragt die Umgebung beim Schreiben von `.claude/settings.json` nach einer Freigabe oder blockt sie, **nicht umgehen**: Diff im Bericht melden, der Controller lässt den Eintrag durch L0 setzen. Danach `git diff main -- tools/studio/guard.py` leer und `git diff main -- .claude/settings.json` zeigt nur Zusätze.

## Schritt 4 · Grün, Echtlauf, Prüfungen, Commit

- `python3 -m unittest discover -s tools/studio/tests -t tools/studio -p 'test_modelguard.py'; echo EXIT=$?` → 0.
- **Echtlauf** (R375): `printf '%s' '{"hook_event_name":"PreToolUse","tool_name":"Agent","session_id":"probe","tool_input":{"subagent_type":"lead-qa","model":"opus","prompt":"Persona: lead-qa"}}' | STUDIO_HOME="$SCRATCH/studio" python3 tools/studio/modelguard.py; echo EXIT=$?` → deny-JSON, Exit 0; dasselbe mit `"prompt":"Persona: lead-qa\nModell: opus (Final-Review)"` → keine Ausgabe. Beide Ausgaben in den Bericht (`$SCRATCH` = eigenes Scratchpad).
- `make studio-test; echo EXIT=$?`, `make studio-lint; echo EXIT=$?`, `make lint; echo EXIT=$?`, `make check; echo EXIT=$?` → 0 (Testsperre: Exit 3 = später erneut).

```bash
git add tools/studio/modelguard.py tools/studio/tests/test_modelguard.py .claude/settings.json
git commit -m "feat: Modell-Guard als PreToolUse-Hook registriert (E-038)"
```

DoD (T02a + T02b): AK-TB08–TB13 belegt; Rot-Beleg; Echtlauf im Bericht; `guard.py` unverändert.
