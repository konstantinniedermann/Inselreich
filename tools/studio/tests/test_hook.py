import json
import os
import subprocess
import sys
import tempfile
import time
import unittest
from pathlib import Path
from unittest import mock

import hook
import limits

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
        self.assertEqual(ev["package_id"], "M5-R1")
        self.assertNotIn("package", ev)
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


class MessageEventTest(unittest.TestCase):
    def send(self, tool_input, **kw):
        return hook.to_event(
            payload("PreToolUse", tool_name="SendMessage", tool_input=tool_input, **kw)
        )

    def test_send_message_creates_message_event(self):
        event = self.send(
            {"to": "g-ts1", "message": "Bitte Befunde beheben", "summary": "Fix"},
            agent_id="g-lt",
            agent_type="lead-tech",
        )
        self.assertEqual(
            (
                event["kind"],
                event["agent_id"],
                event["role"],
                event["to"],
                event["text"],
            ),
            ("message", "g-lt", "lead-tech", "g-ts1", "Bitte Befunde beheben"),
        )
        self.assertNotIn("tool", event)

    def test_main_is_sender_without_agent_id(self):
        self.assertEqual(self.send({"to": "a1", "message": "x"})["agent_id"], "main")

    def test_message_text_collapsed_and_cut_at_160(self):
        spaced = self.send({"to": "a", "message": "a  b\t c"})["text"]
        self.assertEqual(spaced, "a b c")
        long = self.send({"to": "a", "message": "x" * 161})["text"]
        self.assertEqual(long, "x" * 160 + "…")
        exact = self.send({"to": "a", "message": "y" * 160})["text"]
        self.assertEqual(exact, "y" * 160)

    def test_to_cut_at_120_and_stringified(self):
        self.assertEqual(
            self.send({"to": "z" * 130, "message": "x"})["to"], "z" * 120 + "…"
        )
        self.assertEqual(self.send({"to": 42, "message": "x"})["to"], "42")

    def test_first_line_only_and_summary_not_stored(self):
        event = self.send({"to": "a", "summary": "Kurzfassung"})
        self.assertEqual(event["text"], "")
        self.assertNotIn("summary", event)
        self.assertNotIn("Kurzfassung", json.dumps(event, ensure_ascii=False))
        multi = self.send({"to": "a", "message": "\n\n  Erste Zeile\nZweite Zeile"})
        self.assertEqual(multi["text"], "Erste Zeile")

    def test_malformed_send_message_does_not_raise(self):
        for tool_input in ({"to": "a", "message": {"typ": "x"}}, None, "text", [1]):
            with self.subTest(tool_input=tool_input):
                event = self.send(tool_input)
                self.assertEqual(event["kind"], "message")
                if not isinstance(tool_input, dict):
                    self.assertEqual((event["to"], event["text"]), ("", ""))
        event = hook.to_event(payload("PreToolUse", tool_name="SendMessage"))
        self.assertEqual((event["to"], event["text"]), ("", ""))

    def test_other_tools_stay_heartbeat(self):
        for tool in ("Read", "Grep", "WebFetch", "ListAgents"):
            event = hook.to_event(payload("PreToolUse", tool_name=tool, tool_input={}))
            self.assertEqual((event["kind"], event["tool"]), ("heartbeat", tool))


class HeaderTest(unittest.TestCase):
    def test_header_text_full_value(self):
        text = "Persona: x\n- **Schätzung:** 20 min, 30 Tools\n"
        self.assertEqual(hook.header_text(text, "Schätzung"), "20 min, 30 Tools")
        self.assertEqual(hook.header_text(text, "Fehlt"), "")

    def test_parse_estimate(self):
        self.assertEqual(
            hook.parse_estimate("20 min, 30 Tools"), {"minutes": 20, "tools": 30}
        )
        self.assertEqual(hook.parse_estimate("15 min"), {"minutes": 15, "tools": None})
        self.assertIsNone(hook.parse_estimate("unklar"))
        self.assertIsNone(hook.parse_estimate(""))

    def test_parse_estimate_decimals(self):
        cases = {
            "0.6 min": 0.6,
            "0,6 min": 0.6,
            "1.5 min, 4 Tools": 1.5,
            "2 min": 2,
        }
        for text, minutes in cases.items():
            with self.subTest(text=text):
                self.assertEqual(hook.parse_estimate(text)["minutes"], minutes)
        self.assertIsInstance(hook.parse_estimate("2 min")["minutes"], int)
        self.assertEqual(hook.parse_estimate("1.5 min, 4 Tools")["tools"], 4)


class NewFieldsTest(unittest.TestCase):
    def test_spawn_fields(self):
        prompt = "Persona: lead-qa\nPaket: P1\nMeilenstein: M9\nSchätzung: 15 min\nx"
        ev = hook.to_event(
            payload(
                "PreToolUse",
                tool_name="Agent",
                tool_use_id="t1",
                tool_input={"prompt": prompt},
            ),
            handbook="1.2",
            personas={"lead-qa": {"version": "2.0"}},
        )
        self.assertEqual(ev["package_id"], "P1")
        self.assertEqual(ev["milestone"], "M9")
        self.assertEqual(ev["estimate"], {"minutes": 15, "tools": None})
        self.assertEqual(ev["persona_version"], "2.0")
        self.assertEqual(ev["handbook_version"], "1.2")

    def test_agent_events_persona_version(self):
        personas = {"lead-qa": {"version": "2.0"}}
        for name, kind in (
            ("SubagentStart", "agent_start"),
            ("SubagentStop", "agent_stop"),
        ):
            ev = hook.to_event(
                payload(name, agent_id="a1", agent_type="lead-qa"),
                handbook="1.2",
                personas=personas,
            )
            self.assertEqual(ev["kind"], kind)
            self.assertEqual(ev["persona_version"], "2.0")

    def test_spawned_measurements(self):
        ev = hook.to_event(
            payload(
                "PostToolUse",
                tool_name="Agent",
                tool_response={
                    "agentId": "a1",
                    "totalDurationMs": 5000,
                    "totalToolUseCount": 7,
                    "resolvedModel": "claude-opus-5-5",
                    "totalTokens": 99,
                },
            )
        )
        self.assertEqual(
            (ev["duration_ms"], ev["tool_count"], ev["resolved_model"]),
            (5000, 7, "claude-opus-5-5"),
        )
        self.assertNotIn("totalTokens", ev)
        self.assertNotIn("tokens", ev)

    def test_spawned_from_fixture(self):
        path = Path(__file__).parent / "fixtures" / "agent_tool_response.json"
        response = json.loads(path.read_text("utf-8"))
        ev = hook.to_event(
            payload("PostToolUse", tool_name="Agent", tool_response=response)
        )
        self.assertEqual(ev["child_id"], "a58c1ea80f25eef92")
        self.assertEqual(ev["tool_count"], 11)

    def test_spawned_without_measurements(self):
        ev = hook.to_event(
            payload("PostToolUse", tool_name="Agent", tool_response={"agentId": "c"})
        )
        for key in ("duration_ms", "tool_count", "resolved_model"):
            self.assertNotIn(key, ev)

    def test_spawned_takes_status_as_str(self):
        ev = hook.to_event(
            payload(
                "PostToolUse",
                tool_name="Agent",
                tool_response={"agentId": "c", "status": "completed"},
            )
        )
        self.assertEqual(ev["status"], "completed")

    def test_spawned_without_status_has_no_field(self):
        ev = hook.to_event(
            payload("PostToolUse", tool_name="Agent", tool_response={"agentId": "c"})
        )
        self.assertNotIn("status", ev)


class EnrichTest(unittest.TestCase):
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
        self.home = Path(self.tmp.name)

    def test_spawn_archives_briefing(self):
        p = payload(
            "PreToolUse",
            tool_name="Agent",
            tool_use_id="toolu_abcdefgh12345678",
            tool_input={"prompt": "Persona: lead-qa\nPaket: P1\nVolltext"},
        )
        events = hook.enrich(hook.to_event(p), p)
        self.assertEqual(len(events), 1)
        rel = events[0]["briefing"]
        self.assertTrue(rel.startswith("briefings/"))
        self.assertTrue(rel.endswith("-lead-qa-12345678.md"))
        self.assertIn("Volltext", (self.home / "archiv" / rel).read_text("utf-8"))

    def test_agent_stop_archives_report_and_usage(self):
        session = self.home / "abc.jsonl"
        sub = self.home / "abc" / "subagents"
        sub.mkdir(parents=True)
        line = {
            "type": "assistant",
            "message": {
                "id": "m1",
                "model": "claude-opus-5-5",
                "stop_reason": "end_turn",
                "usage": {"input_tokens": 3, "output_tokens": 4},
            },
        }
        (sub / "agent-a1.jsonl").write_text(json.dumps(line) + "\n", "utf-8")
        p = payload(
            "SubagentStop",
            agent_id="a1",
            agent_type="lead/qa",
            last_assistant_message="Bericht " + "z" * 900,
            transcript_path=str(session),
        )
        events = hook.enrich(hook.to_event(p), p)
        ev = events[0]
        self.assertTrue(ev["report"].startswith("berichte/"))
        self.assertRegex(ev["report"], r"^berichte/[\w-]+-leadqa-a1\.md$")
        text = (self.home / "archiv" / ev["report"]).read_text("utf-8")
        self.assertIn("z" * 900, text)
        self.assertEqual(ev["usage"]["claude-opus-5-5"]["output"], 4)

    def test_agent_stop_explicit_transcript_path(self):
        other = self.home / "x.jsonl"
        line = {
            "type": "assistant",
            "message": {
                "id": "m1",
                "model": "m",
                "stop_reason": "end_turn",
                "usage": {"output_tokens": 9},
            },
        }
        other.write_text(json.dumps(line) + "\n", "utf-8")
        p = payload("SubagentStop", agent_id="a2", agent_transcript_path=str(other))
        ev = hook.enrich(hook.to_event(p), p)[0]
        self.assertEqual(ev["usage"]["m"]["output"], 9)

    def test_agent_stop_without_transcript_has_no_usage_value(self):
        p = payload("SubagentStop", agent_id="a3", last_assistant_message="x")
        ev = hook.enrich(hook.to_event(p), p)[0]
        self.assertIsNone(ev["usage"])

    def test_turn_end_adds_usage_event(self):
        transcript = self.home / "s.jsonl"
        line = {
            "type": "assistant",
            "message": {
                "id": "m1",
                "model": "m",
                "stop_reason": "end_turn",
                "usage": {"output_tokens": 5},
            },
        }
        cost = {"type": "cost-state", "totalCostUSD": 1.5, "modelUsage": {}}
        transcript.write_text(
            json.dumps(line) + "\n" + json.dumps(cost) + "\n", "utf-8"
        )
        p = payload("Stop", transcript_path=str(transcript))
        events = hook.enrich(hook.to_event(p, "1.3"), p)
        self.assertEqual([e["kind"] for e in events], ["turn_end", "usage"])
        self.assertEqual(events[1]["handbook_version"], "1.3")
        self.assertEqual(events[1]["agent_id"], "main")
        self.assertEqual(events[1]["usage"]["m"]["output"], 5)
        self.assertNotIn("session_cost", events[1])
        end = payload("SessionEnd", transcript_path=str(transcript))
        events = hook.enrich(hook.to_event(end), end)
        self.assertEqual(events[1]["session_cost"]["total_usd"], 1.5)

    def test_enrich_never_raises(self):
        p = payload("Stop", transcript_path=5)
        self.assertEqual(len(hook.enrich(hook.to_event(p), p)), 1)


class SessionStartTest(unittest.TestCase):
    def test_context_via_subprocess(self):
        with tempfile.TemporaryDirectory() as tmp:
            env = {**os.environ, "STUDIO_HOME": tmp, "STUDIO_NO_SERVER": "1"}
            proc = subprocess.run(
                [sys.executable, str(HOOK)],
                input=json.dumps(payload("SessionStart", source="startup")),
                env=env,
                capture_output=True,
                text=True,
                timeout=10,
                check=False,
            )
        out = json.loads(proc.stdout)
        self.assertIn("Projektleiter", out["hookSpecificOutput"]["additionalContext"])

    def test_incident_notice_once(self):
        with tempfile.TemporaryDirectory() as tmp:
            incidents = [{"id": "ci:1", "kind": "ci", "text": "CI rot", "t": 1.0}]
            old = os.environ.get("STUDIO_HOME")
            os.environ["STUDIO_HOME"] = tmp
            try:
                p = payload("UserPromptSubmit", prompt="hallo")
                first = hook.incident_notice(p, incidents)
                second = hook.incident_notice(p, incidents)
                sub = hook.incident_notice({**p, "agent_id": "a1"}, incidents)
            finally:
                if old is None:
                    os.environ.pop("STUDIO_HOME")
                else:
                    os.environ["STUDIO_HOME"] = old
        self.assertIn("Ad-hoc-Retro fällig", first)
        self.assertIn("CI rot", first)
        self.assertEqual(second, "")
        self.assertEqual(sub, "")


class LimitsNoticeTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.env = mock.patch.dict(os.environ, {"STUDIO_HOME": self.tmp.name})
        self.env.start()
        self.addCleanup(self.env.stop)

    def write(self, ts):
        data = {"ts": ts, "five_hour_pct": 42, "context_pct": 18}
        (Path(self.tmp.name) / "limits.json").write_text(json.dumps(data), "utf-8")

    def test_fresh_file_gives_summary(self):
        self.write(1000.0)
        out = hook.limits_notice(payload("UserPromptSubmit"), now=1000.0 + 9 * 60)
        self.assertIn("Limit: 5h 42 %", out)
        self.assertIn("Ampel grün", out)

    def test_stale_or_missing_file_says_not_measured(self):
        main = payload("UserPromptSubmit")
        self.assertEqual(hook.limits_notice(main, now=5.0), limits.NOT_MEASURED_LINE)
        self.write(1000.0)
        late = 1000.0 + 11 * 60
        self.assertEqual(hook.limits_notice(main, now=late), limits.NOT_MEASURED_LINE)

    def test_future_timestamp_says_not_measured(self):
        self.write(1000.0 + 99999)
        out = hook.limits_notice(payload("UserPromptSubmit"), now=1000.0)
        self.assertEqual(out, limits.NOT_MEASURED_LINE)

    def test_garbage_values_say_not_measured(self):
        data = {"ts": 1000.0, "five_hour_pct": "viel", "context_pct": [1]}
        (Path(self.tmp.name) / "limits.json").write_text(json.dumps(data), "utf-8")
        out = hook.limits_notice(payload("UserPromptSubmit"), now=1001.0)
        self.assertEqual(out, limits.NOT_MEASURED_LINE)

    def test_subagent_gets_nothing_even_when_not_measured(self):
        p = payload("UserPromptSubmit", agent_id="a1")
        self.assertEqual(hook.limits_notice(p, now=5.0), "")

    def test_subagent_gets_nothing(self):
        self.write(1000.0)
        p = payload("UserPromptSubmit", agent_id="a1")
        self.assertEqual(hook.limits_notice(p, now=1001.0), "")

    def test_main_joins_with_incident_notice(self):
        self.write(time.time())
        incidents = [{"id": "ci:1", "kind": "ci", "text": "CI rot", "t": 1.0}]
        with mock.patch.object(hook, "open_incidents", return_value=incidents):
            text = hook.prompt_context(payload("UserPromptSubmit", prompt="x"))
        first, second = text.split("\n")
        self.assertIn("Ad-hoc-Retro fällig", first)
        self.assertIn("Limit: 5h 42 %", second)

    def test_main_output_carries_limits_line(self):
        self.write(time.time())
        env = {**os.environ, "STUDIO_NO_SERVER": "1"}
        proc = subprocess.run(
            [sys.executable, str(HOOK)],
            input=json.dumps(payload("UserPromptSubmit", prompt="x")),
            env=env,
            capture_output=True,
            text=True,
            timeout=10,
            check=False,
        )
        out = json.loads(proc.stdout)["hookSpecificOutput"]
        self.assertEqual(out["hookEventName"], "UserPromptSubmit")
        self.assertIn("Limit: 5h 42 %", out["additionalContext"])


class FixRoundTest(unittest.TestCase):
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

    def test_session_start_marks_listed_incidents(self):
        incidents = [{"id": "ci:1", "kind": "ci", "text": "CI rot", "t": 1.0}]
        with mock.patch.object(hook, "open_incidents", return_value=incidents):
            text = hook.start_context("8765", "s-1")
            self.assertIn("CI rot", text)
            self.assertEqual(hook.incident_notice(payload("UserPromptSubmit")), "")

    def test_subagent_notice_does_not_read_events(self):
        with mock.patch.object(hook, "open_incidents") as opened:
            out = hook.incident_notice(payload("UserPromptSubmit", agent_id="a1"))
        self.assertEqual(out, "")
        opened.assert_not_called()

    def test_no_server_flag_values(self):
        for value, expected in (
            ("1", 0),
            ("true", 0),
            ("yes", 0),
            ("0", 2),
            ("", 2),
            ("TRUE", 2),
        ):
            with mock.patch.object(hook, "launch_detached") as launch:
                hook.start_background({"STUDIO_NO_SERVER": value})
            self.assertEqual(launch.call_count, expected, value)

    def test_personas_loaded_only_when_needed(self):
        calls = []
        real = hook.studio_docs.persona_meta
        hook.studio_docs.persona_meta = lambda a: calls.append(a) or {}
        self.addCleanup(setattr, hook.studio_docs, "persona_meta", real)
        for p in (
            payload("PreToolUse", tool_name="Read", tool_input={}),
            payload("UserPromptSubmit", prompt="x"),
        ):
            hook.load_versions(p)
        self.assertEqual(calls, [])
        hook.load_versions(payload("PreToolUse", tool_name="Agent", tool_input={}))
        hook.load_versions(payload("SubagentStart", agent_id="a"))
        self.assertEqual(len(calls), 2)


class MainTest(unittest.TestCase):
    def run_hook(self, stdin):
        with tempfile.TemporaryDirectory() as tmp:
            env = {**os.environ, "STUDIO_HOME": tmp, "STUDIO_NO_SERVER": "1"}
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

    def test_main_writes_message_event(self):
        stdin = json.dumps(
            payload(
                "PreToolUse",
                agent_id="g-lt",
                tool_name="SendMessage",
                tool_input={"to": "main", "message": "Fertig"},
            )
        )
        proc, lines = self.run_hook(stdin)
        self.assertEqual(proc.returncode, 0)
        self.assertEqual(len(lines), 1)
        event = json.loads(lines[0])
        self.assertEqual(
            (event["kind"], event["to"], event["text"]), ("message", "main", "Fertig")
        )

    def test_main_survives_garbage(self):
        for stdin in ["", "nicht json", "[1,2]", '{"hook_event_name": 5}']:
            proc, lines = self.run_hook(stdin)
            self.assertEqual(proc.returncode, 0, stdin)
            self.assertEqual(proc.stdout, "", stdin)
            self.assertEqual(lines, [], stdin)

    def test_session_start_context_survives_unwritable_home(self):
        with tempfile.NamedTemporaryFile() as blocker:
            env = {
                **os.environ,
                "STUDIO_HOME": str(Path(blocker.name) / "sub"),
                "STUDIO_NO_SERVER": "1",
            }
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
        self.assertIn("Projektleiter", out["hookSpecificOutput"]["additionalContext"])

    def test_session_start_emits_context(self):
        proc, lines = self.run_hook(
            json.dumps(payload("SessionStart", source="startup"))
        )
        self.assertEqual(proc.returncode, 0)
        out = json.loads(proc.stdout)
        self.assertEqual(out["hookSpecificOutput"]["hookEventName"], "SessionStart")
        self.assertIn("Projektleiter", out["hookSpecificOutput"]["additionalContext"])
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
        scripts = ("tools/studio/hook.py", "tools/studio/guard.py")
        for event, groups in hooks.items():
            commands = [h["command"] for group in groups for h in group["hooks"]]
            with self.subTest(event=event):
                self.assertTrue(any(scripts[0] in c for c in commands))
                for command in commands:
                    self.assertTrue(any(s in command for s in scripts))
                    self.assertTrue(command.endswith("2>/dev/null || true"))

    def test_pretooluse_matcher_covers_send_message(self):
        path = Path(__file__).resolve().parents[3] / ".claude" / "settings.json"
        groups = json.loads(path.read_text())["hooks"]["PreToolUse"]
        covering = [
            g
            for g in groups
            if g.get("matcher") == "*"
            and any("tools/studio/hook.py" in h["command"] for h in g["hooks"])
        ]
        self.assertEqual(len(covering), 1)

    def test_guard_registered(self):
        path = Path(__file__).resolve().parents[3] / ".claude" / "settings.json"
        hooks = json.loads(path.read_text())["hooks"]
        first = hooks["PreToolUse"][0]
        self.assertEqual(
            set(first["matcher"].split("|")),
            {"Bash", "Edit", "Write", "MultiEdit", "NotebookEdit"},
        )
        self.assertIn("tools/studio/guard.py", first["hooks"][0]["command"])
        prompt = [h["command"] for g in hooks["UserPromptSubmit"] for h in g["hooks"]]
        self.assertTrue(any("tools/studio/guard.py" in c for c in prompt))


if __name__ == "__main__":
    unittest.main()
