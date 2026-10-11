import io
import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from types import MappingProxyType
from unittest import mock

import modelguard
from paths import repo_root

STUDIO = repo_root() / "docs" / "studio" / "STUDIO.md"
TABLE = modelguard.model_table(STUDIO.read_text("utf-8"))
PERSONAS = {
    "lead-qa": {"model": "sonnet"},
    "qa-code-reviewer": {"model": "sonnet"},
    "lead-design": {"model": "opus"},
    "studio-coach": {"model": "opus"},
    "tool-x": {"model": "inherit"},
}


def call(kind, prompt="", model=None):
    data = {"subagent_type": kind, "prompt": prompt}
    if model:
        data["model"] = model
    return modelguard.reason(data, PERSONAS, TABLE)


class TableTest(unittest.TestCase):
    def test_real_table_is_parsed(self):
        self.assertEqual([alias for alias, _ in TABLE], ["opus", "sonnet", "haiku"])
        opus = dict(TABLE)["opus"]
        self.assertIn("Tech-Lead beim Plan", opus)
        self.assertIn("Final-Review", opus)
        self.assertIn(
            "lead-qa-Gate-Urteile", dict(TABLE)["sonnet"]
        )  # Backticks entfernt
        haiku = dict(TABLE)["haiku"]  # Kommas in Klammern trennen nicht
        self.assertEqual(
            haiku, ["mechanische Prüfungen (Formatierung, Links, Listen abgleichen)"]
        )

    def test_missing_section_is_empty_and_allows(self):
        self.assertEqual(modelguard.model_table("# x\n| a | `opus` | b |\n"), [])
        data = {"subagent_type": "lead-qa", "model": "opus", "prompt": ""}
        self.assertIsNone(modelguard.reason(data, PERSONAS, []))


class ReasonTest(unittest.TestCase):
    def test_typed_start_over_frontmatter_is_denied(self):
        found = call("lead-qa", "Persona: lead-qa\nPaket: X", "opus")
        self.assertIn("über der Modelltabelle", found)
        self.assertIn("Modell: opus (<Einsatz>)", found)
        self.assertIn("Final-Review", found)

    def test_table_exception_in_header_allows(self):
        prompt = "Persona: lead-qa\nModell: opus (Final-Review über die Branch)"
        self.assertIsNone(call("lead-qa", prompt, "opus"))

    def test_bold_header_and_prefix_match(self):
        prompt = "- **Persona:** lead-qa\n- **Modell:** OPUS (final-review, Branch x)"
        self.assertIsNone(call("lead-qa", prompt, "opus"))

    def test_wrong_einsatz_or_alias_is_denied(self):
        self.assertIsNotNone(call("lead-qa", "Modell: opus (Gate-Urteil)", "opus"))
        self.assertIsNotNone(call("lead-qa", "Modell: sonnet (Final-Review)", "opus"))
        self.assertIsNotNone(call("lead-qa", "Modell: opus", "opus"))

    def test_use_with_parentheses_in_header(self):
        table = [
            ("opus", ["Final-Review (über die Branch)"]),
            ("sonnet", ["Standard"]),
        ]
        personas = {"lead-x": {"model": "sonnet"}}
        data = {"subagent_type": "lead-x", "model": "opus"}
        prompt = "Persona: lead-x\nModell: opus (Final-Review (über die Branch))"
        self.assertIsNone(modelguard.reason(data | {"prompt": prompt}, personas, table))
        wrong = "Persona: lead-x\nModell: opus (Spiel) (Final-Review (über die Branch))"
        self.assertIsNotNone(
            modelguard.reason(data | {"prompt": wrong}, personas, table)
        )

    def test_real_table_haiku_use_parses(self):
        uses = dict(TABLE)["haiku"]
        self.assertEqual(len(uses), 1)
        self.assertTrue(uses[0].startswith("mechanische Prüfungen ("))
        self.assertTrue(uses[0].endswith(")"))

    def test_unknown_alias_is_allowed_with_note(self):
        self.assertIsNone(call("lead-design", "", "fable"))
        data = {"subagent_type": "lead-design", "model": "fable"}
        self.assertIn(
            "nicht in der Modelltabelle", modelguard.unknown_alias(data, TABLE)
        )
        self.assertIsNone(modelguard.unknown_alias({"model": "opus"}, TABLE))

    def test_no_check_cases(self):
        self.assertIsNone(call("lead-design"))  # Frontmatter opus, kein model
        self.assertIsNone(call("lead-qa"))
        self.assertIsNone(call("studio-coach", "", "sonnet"))  # schwächer
        self.assertIsNone(call("tool-x", "", "opus"))  # inherit
        self.assertIsNone(call("Explore", "", "opus"))
        self.assertIsNone(call("fork", "Persona: lead-qa", "opus"))
        self.assertIsNone(call("general-purpose", "Suche etwas", "opus"))

    def test_general_purpose_with_persona_uses_frontmatter(self):
        self.assertIsNotNone(call("general-purpose", "Persona: lead-qa", "opus"))
        self.assertIsNone(
            call("general-purpose", "Persona: tech-save-engineer", "opus")
        )


class HookTest(unittest.TestCase):
    def run_hook(self, payload, mode="warn"):
        with (
            tempfile.TemporaryDirectory() as home,
            tempfile.TemporaryDirectory() as docs,
        ):
            shutil.copy(STUDIO, Path(docs) / "STUDIO.md")
            env = {"STUDIO_HOME": home, "STUDIO_DOCS": docs}
            out = io.StringIO()
            with (
                mock.patch.dict(os.environ, env),
                mock.patch.object(modelguard, "MODE", mode),
                mock.patch.object(sys, "stdin", io.StringIO(json.dumps(payload))),
                mock.patch.object(sys, "stdout", out),
            ):
                code = modelguard.main()
            path = Path(home) / "events.jsonl"
            lines = path.read_text("utf-8").splitlines() if path.exists() else []
            return code, out.getvalue(), [json.loads(line) for line in lines]

    def payload(self, tool="Agent", **tool_input):
        return {
            "hook_event_name": "PreToolUse",
            "tool_name": tool,
            "session_id": "s1",
            "tool_input": tool_input,
        }

    OVER = MappingProxyType(
        {"subagent_type": "lead-qa", "model": "opus", "prompt": "Persona: lead-qa"}
    )

    def test_deny_mode_output_and_event(self):
        code, out, events = self.run_hook(self.payload(**self.OVER), "deny")
        self.assertEqual(code, 0)
        decision = json.loads(out)["hookSpecificOutput"]["permissionDecision"]
        self.assertEqual(decision, "deny")
        self.assertEqual(
            (events[0]["kind"], events[0]["persona"]), ("model_guard", "lead-qa")
        )

    def test_deny_mode_is_default(self):
        self.assertEqual(modelguard.MODE, "deny")

    def test_warn_mode_event_only(self):
        code, out, events = self.run_hook(self.payload(**self.OVER), "warn")
        self.assertEqual((code, out, events[0]["mode"]), (0, "", "warn"))

    def test_task_tool_name_is_checked(self):
        _, out, events = self.run_hook(self.payload("Task", **self.OVER), "deny")
        self.assertIn("deny", out)
        self.assertEqual(len(events), 1)

    def test_unknown_alias_allows_with_event(self):
        data = {"subagent_type": "lead-design", "model": "fable", "prompt": ""}
        _, out, events = self.run_hook(self.payload(**data), "deny")
        self.assertEqual(out, "")
        self.assertIn("nicht in der Modelltabelle", events[0]["summary"])

    def test_allowed_and_other_tools_are_silent(self):
        ok = self.payload(subagent_type="lead-qa", prompt="Persona: lead-qa")
        self.assertEqual(self.run_hook(ok, "deny")[1:], ("", []))
        bash = {
            "hook_event_name": "PreToolUse",
            "tool_name": "Bash",
            "tool_input": {"command": "ls"},
        }
        self.assertEqual(self.run_hook(bash, "deny")[1:], ("", []))

    def run_budget_hook(self, mode, events_lines, budget_mode="deny", **tool_input):
        with (
            tempfile.TemporaryDirectory() as home,
            tempfile.TemporaryDirectory() as docs,
        ):
            shutil.copy(STUDIO, Path(docs) / "STUDIO.md")
            path = Path(home) / "events.jsonl"
            if events_lines is not None:
                path.write_text("".join(x + "\n" for x in events_lines), "utf-8")
            env = {"STUDIO_HOME": home, "STUDIO_DOCS": docs}
            out = io.StringIO()
            with (
                mock.patch.dict(os.environ, env),
                mock.patch.object(modelguard, "MODE", mode),
                mock.patch.object(modelguard, "BUDGET_MODE", budget_mode),
                mock.patch.object(
                    sys, "stdin", io.StringIO(json.dumps(self.payload(**tool_input)))
                ),
                mock.patch.object(sys, "stdout", out),
            ):
                code = modelguard.main()
            lines = path.read_text("utf-8").splitlines() if path.exists() else []
            return code, out.getvalue(), [json.loads(x) for x in lines]

    LEAD = MappingProxyType(
        {"subagent_type": "lead-qa", "prompt": "Persona: lead-qa\nPaket: P\nBudget: 3"}
    )

    def test_budget_warning_output_and_event(self):
        code, out, events = self.run_budget_hook("deny", [], "warn", **self.LEAD)
        self.assertEqual(code, 0)
        data = json.loads(out)
        self.assertNotIn("permissionDecision", data["hookSpecificOutput"])
        self.assertIs(events[-1]["blocked"], False)
        text = data["hookSpecificOutput"]["additionalContext"]
        self.assertEqual(text, data["systemMessage"])
        self.assertIn("Budget-Warnung (E-055)", text)
        self.assertEqual(events[-1]["kind"], "budget_warn")
        self.assertEqual(events[-1]["persona"], "lead-qa")
        self.assertEqual(events[-1]["package"], "P")

    def test_deny_wins_over_budget_warning(self):
        data = {"subagent_type": "lead-qa", "model": "opus"}
        data["prompt"] = "Persona: lead-qa\nPaket: P\nBudget: 3"
        _, out, events = self.run_budget_hook("deny", [], **data)
        self.assertEqual(out.count("\n"), 1)
        self.assertIn("deny", out)
        self.assertNotIn("systemMessage", out)
        self.assertEqual([e["kind"] for e in events], ["model_guard"])

    def test_missing_events_file_is_silent(self):
        code, out, events = self.run_budget_hook("deny", None, **self.LEAD)
        self.assertEqual((code, out), (0, ""))
        self.assertEqual(events, [])

    def test_matching_grant_is_silent(self):
        grant = json.dumps(
            {
                "kind": "budget",
                "session_id": "s1",
                "role": "lead-qa",
                "budget": {"granted": 3, "phase": "P"},
            }
        )
        _, out, _ = self.run_budget_hook("deny", [grant], **self.LEAD)
        self.assertEqual(out, "")

    def test_budget_warning_also_with_alias_note_or_warn_mode(self):
        alias = {"subagent_type": "lead-qa", "model": "fable"}
        alias["prompt"] = self.LEAD["prompt"]
        _, out, events = self.run_budget_hook("deny", [], "warn", **alias)
        self.assertIn("Budget-Warnung", json.loads(out)["systemMessage"])
        self.assertEqual(out.count("\n"), 1)
        self.assertEqual([e["kind"] for e in events], ["model_guard", "budget_warn"])
        over = {"subagent_type": "lead-qa", "model": "opus"}
        over["prompt"] = self.LEAD["prompt"]
        _, out, _ = self.run_budget_hook("warn", [], "warn", **over)
        self.assertIn("Budget-Warnung", json.loads(out)["systemMessage"])

    def test_budget_mode_default_is_deny(self):
        self.assertEqual(modelguard.BUDGET_MODE, "deny")

    def test_lead_without_grant_is_denied_and_logged(self):
        data = {
            "subagent_type": "lead-tech",
            "prompt": "Persona: lead-tech\nPaket: P\nBudget: 7",
        }
        _, out, events = self.run_budget_hook("deny", [], **data)
        hook = json.loads(out)["hookSpecificOutput"]
        self.assertEqual(hook["permissionDecision"], "deny")
        self.assertIn(
            "log.py budget --lead lead-tech --grant 7", hook["permissionDecisionReason"]
        )
        self.assertEqual(out.count("\n"), 1)
        self.assertEqual(
            (events[-1]["kind"], events[-1]["blocked"]), ("budget_warn", True)
        )

    def test_token_and_second_instance_allowed(self):
        grant = json.dumps(
            {
                "kind": "budget",
                "session_id": "s1",
                "role": "lead-tech",
                "budget": {"granted": 3, "phase": "TB-6-umsetzung"},
            }
        )
        prompt = "Persona: lead-tech\nPaket: TB-6-umsetzung (Instanz 2)\nBudget: 3"
        data = {"subagent_type": "lead-tech", "prompt": prompt}
        _, out, _ = self.run_budget_hook("deny", [grant], **data)
        self.assertEqual(out, "")

    def test_grant_in_other_session_denies(self):
        grant = json.dumps(
            {
                "kind": "budget",
                "session_id": "andere",
                "role": "lead-qa",
                "budget": {"granted": 3, "phase": "P"},
            }
        )
        _, out, _ = self.run_budget_hook("deny", [grant], **self.LEAD)
        self.assertIn("deny", out)

    def test_skip_types_and_workers_silent(self):
        worker = {
            "subagent_type": "qa-code-reviewer",
            "prompt": "Persona: qa-code-reviewer\nBudget: keins",
        }
        self.assertEqual(self.run_budget_hook("deny", [], **worker)[1], "")
        fork = {"subagent_type": "fork", "prompt": self.LEAD["prompt"]}
        self.assertEqual(self.run_budget_hook("deny", [], **fork)[1], "")

    def test_model_deny_and_missing_grant_gives_one_deny(self):
        data = {
            "subagent_type": "lead-qa",
            "model": "opus",
            "prompt": self.LEAD["prompt"],
        }
        _, out, events = self.run_budget_hook("deny", [], **data)
        self.assertEqual(out.count("\n"), 1)
        self.assertIn(
            "Modell", json.loads(out)["hookSpecificOutput"]["permissionDecisionReason"]
        )
        self.assertEqual([e["kind"] for e in events], ["model_guard"])

    def test_unreadable_events_file_allows(self):
        _, out, _ = self.run_budget_hook("deny", None, **self.LEAD)
        self.assertEqual(out, "")

    def test_broken_input_never_fails(self):
        done = subprocess.run(
            [sys.executable, str(Path(modelguard.__file__))],
            check=False,
            input="kaputt",
            capture_output=True,
            text=True,
        )
        self.assertEqual((done.returncode, done.stdout), (0, ""))
