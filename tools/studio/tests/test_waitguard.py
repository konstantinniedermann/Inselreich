import io
import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import waitguard

HEAD = "Persona: tech-tools\nPaket: X\nBudget: keins\n"
LONG = HEAD + "Setze T02 um und schreibe die Tests dazu. " * 8 + "Warte nicht ab."


def agent(prompt, kind="general-purpose"):
    return waitguard.agent_reason({"subagent_type": kind, "prompt": prompt})


def bash(command, background=True):
    return waitguard.bash_reason({"command": command, "run_in_background": background})


class AgentDeniedTest(unittest.TestCase):
    def test_bare_wait_texts_are_denied(self):
        for text in (
            "warte",
            "ok",
            "Warte auf den Abschluss von tool-dash-versionen und melde dich dann.",
            "Prüfe ob die Tests fertig sind.",
            "sleep 240",
        ):
            with self.subTest(text=text):
                self.assertIsNotNone(agent(text))

    def test_headers_with_empty_rest_are_denied(self):
        self.assertIsNotNone(agent(HEAD))
        self.assertIsNotNone(agent(""))
        self.assertIsNotNone(waitguard.agent_reason({"subagent_type": "x"}))

    def test_task_with_header_and_wait_text_is_denied(self):
        self.assertIsNotNone(agent(HEAD + "Warte auf den Abschluss."))


class AgentAllowedTest(unittest.TestCase):
    def test_long_briefing_is_allowed(self):
        self.assertGreater(len(LONG), 200)
        self.assertIsNone(agent(LONG))

    def test_short_real_orders_are_allowed(self):
        self.assertIsNone(agent("Implementiere T02 in tools/studio/x.py, AK-3"))
        self.assertIsNone(agent("Prüfe den Diff von tool/x gegen Plan"))
        self.assertIsNone(agent("Review T02"))

    def test_fork_is_allowed(self):
        self.assertIsNone(agent("warte", "fork"))


class BashTest(unittest.TestCase):
    def test_background_sleep_is_denied(self):
        self.assertIsNotNone(bash("sleep 30"))
        self.assertIsNotNone(bash("make check; sleep 60"))
        self.assertIsNotNone(bash("make check && sleep 5.5"))
        self.assertIsNotNone(bash("timeout 10 sleep 3"))
        self.assertIsNotNone(bash("echo a\nsleep 9"))

    def test_loops_and_other_commands_are_allowed(self):
        self.assertIsNone(bash("until [ -f x ]; do sleep 2; done"))
        self.assertIsNone(bash("while ! test -f x; do sleep 2; done"))
        self.assertIsNone(bash("make check"))
        self.assertIsNone(bash("echo sleep 3"))

    def test_foreground_sleep_is_not_subject(self):
        self.assertIsNone(bash("sleep 1", background=False))
        self.assertIsNone(waitguard.bash_reason({"command": "sleep 1"}))


class HookTest(unittest.TestCase):
    def run_hook(self, payload, mode="deny"):
        with tempfile.TemporaryDirectory() as home:
            out = io.StringIO()
            with (
                mock.patch.dict(os.environ, {"STUDIO_HOME": home}),
                mock.patch.object(waitguard, "MODE", mode),
                mock.patch.object(sys, "stdin", io.StringIO(json.dumps(payload))),
                mock.patch.object(sys, "stdout", out),
            ):
                code = waitguard.main()
            path = Path(home) / "events.jsonl"
            lines = path.read_text("utf-8").splitlines() if path.exists() else []
            return code, out.getvalue(), [json.loads(x) for x in lines]

    def payload(self, tool="Agent", who="lead-tech", **tool_input):
        data = {
            "hook_event_name": "PreToolUse",
            "tool_name": tool,
            "session_id": "s1",
            "agent_id": "a1",
            "tool_input": tool_input,
        }
        if who:
            data["agent_type"] = who
        return data

    def test_default_mode_is_deny(self):
        self.assertEqual(waitguard.MODE, "deny")

    def test_lead_wait_agent_is_denied_and_logged(self):
        code, out, events = self.run_hook(self.payload(prompt="warte"))
        self.assertEqual(code, 0)
        hook = json.loads(out)["hookSpecificOutput"]
        self.assertEqual(hook["permissionDecision"], "deny")
        self.assertEqual(
            (events[0]["kind"], events[0]["mode"], events[0]["blocked"]),
            ("wait_guard", "deny", True),
        )
        self.assertEqual(events[0]["rule"], "A")

    def test_lead_background_sleep_is_denied_with_rule_b(self):
        payload = self.payload("Bash", command="sleep 30", run_in_background=True)
        _, out, events = self.run_hook(payload)
        self.assertIn("deny", out)
        self.assertEqual(events[0]["rule"], "B")

    def test_task_tool_name_is_checked(self):
        _, out, _ = self.run_hook(self.payload("Task", prompt="ok"))
        self.assertIn("deny", out)

    def test_warn_mode_gives_hint_without_deny(self):
        _, out, events = self.run_hook(self.payload(prompt="warte"), "warn")
        data = json.loads(out)
        self.assertNotIn("permissionDecision", data["hookSpecificOutput"])
        self.assertTrue(data["hookSpecificOutput"]["additionalContext"])
        self.assertEqual(
            data["hookSpecificOutput"]["additionalContext"], data["systemMessage"]
        )
        self.assertEqual((events[0]["mode"], events[0]["blocked"]), ("warn", False))

    def test_non_leads_are_never_blocked(self):
        for who in (None, "", "main", "tech-sim-engineer"):
            with self.subTest(who=who):
                result = self.run_hook(self.payload(who=who, prompt="warte"))
                self.assertEqual(result[1:], ("", []))
        bash_payload = self.payload(
            "Bash", who="tech-tools", command="sleep 9", run_in_background=True
        )
        self.assertEqual(self.run_hook(bash_payload)[1:], ("", []))

    def test_lead_allowed_calls_are_silent(self):
        ok = self.payload(prompt=LONG)
        self.assertEqual(self.run_hook(ok)[1:], ("", []))
        loop = self.payload(
            "Bash", command="until [ -f x ]; do sleep 2; done", run_in_background=True
        )
        self.assertEqual(self.run_hook(loop)[1:], ("", []))
        send = self.payload("SendMessage", prompt="warte")
        self.assertEqual(self.run_hook(send)[1:], ("", []))
        fork = self.payload(prompt="warte", subagent_type="fork")
        self.assertEqual(self.run_hook(fork)[1:], ("", []))

    def test_other_events_and_bad_shapes_are_silent(self):
        self.assertEqual(self.run_hook([1, 2])[1:], ("", []))
        bad = self.payload(prompt="warte") | {"tool_input": "kein dict"}
        self.assertEqual(self.run_hook(bad)[1:], ("", []))
        other = self.payload(prompt="warte") | {"hook_event_name": "PostToolUse"}
        self.assertEqual(self.run_hook(other)[1:], ("", []))

    def test_exception_allows(self):
        with mock.patch.object(waitguard, "agent_reason", side_effect=RuntimeError):
            result = self.run_hook(self.payload(prompt="warte"))
        self.assertEqual(result[:2], (0, ""))

    def test_broken_input_never_fails(self):
        done = subprocess.run(
            [sys.executable, str(Path(waitguard.__file__))],
            check=False,
            input="kaputt",
            capture_output=True,
            text=True,
        )
        self.assertEqual((done.returncode, done.stdout), (0, ""))
