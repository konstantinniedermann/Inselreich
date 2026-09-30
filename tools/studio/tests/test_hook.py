import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

import hook

HOOK = Path(__file__).resolve().parents[1] / "hook.py"


def payload(name, **kw):
    return {"hook_event_name": name, "session_id": "s-1", **kw}


class ToEventTest(unittest.TestCase):
    def test_session_events(self):
        start = hook.to_event(payload("SessionStart", source="startup", model="opus"))
        self.assertEqual(start["kind"], "session_start")
        self.assertEqual(start["agent_id"], "main")
        self.assertEqual(start["model"], "opus")
        end = hook.to_event(payload("SessionEnd", reason="other"))
        self.assertEqual((end["kind"], end["status"]), ("session_end", "ended"))

    def test_prompt_and_turn_end(self):
        ev = hook.to_event(payload("UserPromptSubmit", prompt="Baue M5\nmehr Text"))
        self.assertEqual(
            (ev["kind"], ev["status"], ev["task"]), ("prompt", "active", "Baue M5")
        )
        note = hook.to_event(payload("UserPromptSubmit", prompt="<task-notification>x"))
        self.assertEqual(note["task"], "Meldung eines Agenten")
        msg = hook.to_event(
            payload("UserPromptSubmit", prompt='<agent-message from="ab68">x')
        )
        self.assertEqual(msg["task"], "Meldung eines Agenten")
        stop = hook.to_event(payload("Stop", last_assistant_message="fertig"))
        self.assertEqual(
            (stop["kind"], stop["status"], stop["summary"]),
            ("turn_end", "idle", "fertig"),
        )

    def test_subagent_start_stop(self):
        start = hook.to_event(
            payload("SubagentStart", agent_id="a1", agent_type="lead-qa")
        )
        self.assertEqual(
            (start["kind"], start["agent_id"], start["role"]),
            ("agent_start", "a1", "lead-qa"),
        )
        stop = hook.to_event(
            payload(
                "SubagentStop",
                agent_id="a1",
                agent_type="lead-qa",
                last_assistant_message="x" * 900,
            )
        )
        self.assertEqual(stop["kind"], "agent_stop")
        self.assertLessEqual(len(stop["summary"]), 601)

    def test_spawn_parses_persona_and_package(self):
        prompt = "Persona: `design-genre-researcher`\nPaket: M5-R1\n" + "y" * 1000
        ev = hook.to_event(
            payload(
                "PreToolUse",
                agent_id="a1",
                agent_type="lead-design",
                tool_name="Agent",
                tool_use_id="t1",
                tool_input={
                    "description": "Recherche",
                    "prompt": prompt,
                    "model": "sonnet",
                },
            )
        )
        self.assertEqual(ev["kind"], "spawn")
        self.assertEqual(ev["subagent_type"], "general-purpose")
        self.assertEqual(ev["persona"], "design-genre-researcher")
        self.assertEqual(ev["package"], "M5-R1")
        self.assertEqual(ev["model"], "sonnet")
        self.assertLessEqual(len(ev["prompt_head"]), 401)

    def test_bind_from_log_call(self):
        cmd = 'python3 tools/studio/log.py status --role qa-playtester --status active --package "P 1"'
        ev = hook.to_event(
            payload(
                "PreToolUse",
                agent_id="a2",
                agent_type="qa-playtester",
                tool_name="Bash",
                tool_input={"command": cmd},
            )
        )
        self.assertEqual(
            (ev["kind"], ev["role"], ev["package"]), ("bind", "qa-playtester", "P 1")
        )

    def test_heartbeat(self):
        ev = hook.to_event(
            payload("PreToolUse", agent_id="a2", tool_name="Read", tool_input={})
        )
        self.assertEqual((ev["kind"], ev["tool"]), ("heartbeat", "Read"))

    def test_spawned_needs_dict_response(self):
        ok = hook.to_event(
            payload(
                "PostToolUse",
                agent_id="a1",
                tool_name="Agent",
                tool_input={},
                tool_response={"agentId": "c9", "status": "completed"},
            )
        )
        self.assertEqual((ok["kind"], ok["child_id"]), ("spawned", "c9"))
        self.assertIsNone(
            hook.to_event(
                payload("PostToolUse", tool_name="Agent", tool_response="text")
            )
        )

    def test_unknown_event_ignored(self):
        self.assertIsNone(hook.to_event(payload("Notification", message="x")))


class MainTest(unittest.TestCase):
    def run_hook(self, stdin):
        with tempfile.TemporaryDirectory() as tmp:
            env = {**os.environ, "STUDIO_HOME": tmp}
            proc = subprocess.run(
                [sys.executable, str(HOOK)],
                input=stdin,
                env=env,
                capture_output=True,
                text=True,
                timeout=10,
                check=False,
            )
            path = Path(tmp) / "events.jsonl"
            lines = path.read_text("utf-8").splitlines() if path.exists() else []
        return proc, lines

    def test_main_survives_garbage(self):
        for stdin in ["", "nicht json", "[1,2]", '{"hook_event_name": 5}']:
            proc, lines = self.run_hook(stdin)
            self.assertEqual(proc.returncode, 0, stdin)
            self.assertEqual(proc.stdout, "", stdin)
            self.assertEqual(lines, [], stdin)

    def test_session_start_context_survives_unwritable_home(self):
        with tempfile.NamedTemporaryFile() as blocker:
            env = {**os.environ, "STUDIO_HOME": str(Path(blocker.name) / "sub")}
            proc = subprocess.run(
                [sys.executable, str(HOOK)],
                input=json.dumps(payload("SessionStart", source="startup")),
                env=env,
                capture_output=True,
                text=True,
                timeout=10,
                check=False,
            )
        self.assertEqual(proc.returncode, 0)
        self.assertEqual(proc.stderr, "")
        out = json.loads(proc.stdout)
        self.assertIn("STUDIO.md", out["hookSpecificOutput"]["additionalContext"])

    def test_session_start_emits_context(self):
        proc, lines = self.run_hook(
            json.dumps(payload("SessionStart", source="startup"))
        )
        self.assertEqual(proc.returncode, 0)
        out = json.loads(proc.stdout)
        self.assertEqual(out["hookSpecificOutput"]["hookEventName"], "SessionStart")
        self.assertIn("STUDIO.md", out["hookSpecificOutput"]["additionalContext"])
        self.assertEqual(len(lines), 1)


class OpenDashboardTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        old = os.environ.get("STUDIO_HOME")
        os.environ["STUDIO_HOME"] = self.tmp.name
        self.addCleanup(
            lambda: (
                os.environ.pop("STUDIO_HOME")
                if old is None
                else os.environ.__setitem__("STUDIO_HOME", old)
            )
        )
        self.calls = []

    def run_hook(self, p, env=None, platform="darwin"):
        return hook.maybe_open_dashboard(p, env or {}, platform, self.calls.append)

    def spawn(self, **kw):
        return payload("PreToolUse", tool_name="Agent", **kw)

    def test_first_main_spawn_launches_once(self):
        self.assertTrue(self.run_hook(self.spawn()))
        self.assertEqual(len(self.calls), 1)
        args = self.calls[0]
        self.assertEqual(args[0], "bash")
        self.assertTrue(args[4].endswith("start.sh"))
        self.assertEqual(args[5], "open")
        self.assertEqual(args[6], "http://127.0.0.1:8765/?session=s-1")
        self.assertFalse(self.run_hook(self.spawn()))
        self.assertEqual(len(self.calls), 1)

    def test_linux_opener_and_port(self):
        self.run_hook(self.spawn(), {"STUDIO_PORT": "9000"}, "linux")
        self.assertEqual(self.calls[0][5], "xdg-open")
        self.assertIn(":9000/", self.calls[0][6])

    def test_bad_port_falls_back(self):
        self.run_hook(self.spawn(), {"STUDIO_PORT": "9;x"})
        self.assertIn(":8765/", self.calls[0][6])

    def test_non_triggers(self):
        self.assertFalse(self.run_hook(self.spawn(agent_id="a1")))
        self.assertFalse(self.run_hook(payload("PreToolUse", tool_name="Bash")))
        self.assertFalse(self.run_hook(payload("PostToolUse", tool_name="Agent")))
        self.assertEqual(self.calls, [])

    def test_skips(self):
        self.assertFalse(self.run_hook(self.spawn(), {"STUDIO_NO_BROWSER": "1"}))
        env = {"CLAUDE_CODE_ENTRYPOINT": "sdk-cli"}
        self.assertFalse(self.run_hook(self.spawn(), env))
        self.assertFalse(self.run_hook(self.spawn(), platform="win32"))
        self.assertEqual(self.calls, [])

    def test_malicious_session_id_skips(self):
        bad = {**self.spawn(), "session_id": "../x"}
        self.assertFalse(self.run_hook(bad))
        self.assertEqual(self.calls, [])
        self.assertFalse((Path(self.tmp.name).parent / "x").exists())


class SettingsTest(unittest.TestCase):
    EVENTS = (
        "SessionStart",
        "SessionEnd",
        "UserPromptSubmit",
        "Stop",
        "SubagentStart",
        "SubagentStop",
        "PreToolUse",
        "PostToolUse",
    )

    def test_hooks_are_failsafe_and_complete(self):
        path = Path(__file__).resolve().parents[3] / ".claude" / "settings.json"
        hooks = json.loads(path.read_text())["hooks"]
        self.assertEqual(set(hooks), set(self.EVENTS))
        for groups in hooks.values():
            for group in groups:
                for h in group["hooks"]:
                    self.assertIn("tools/studio/hook.py", h["command"])
                    self.assertTrue(h["command"].endswith("|| true"))


if __name__ == "__main__":
    unittest.main()
