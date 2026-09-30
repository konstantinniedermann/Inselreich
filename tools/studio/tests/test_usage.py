import json
import tempfile
import unittest
from pathlib import Path

import usage


def msg(mid, out, stop=None, model="claude-opus-5-5", side=False, cr=100):
    return json.dumps(
        {
            "type": "assistant",
            "isSidechain": side,
            "message": {
                "id": mid,
                "model": model,
                "stop_reason": stop,
                "usage": {
                    "input_tokens": 2,
                    "cache_creation_input_tokens": 10,
                    "cache_read_input_tokens": cr,
                    "output_tokens": out,
                },
            },
        }
    )


class UsageTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.dir = Path(self.tmp.name)

    def tearDown(self):
        self.tmp.cleanup()

    def test_dedupe_and_lower_bound(self):
        path = self.dir / "t.jsonl"
        path.write_text(
            "\n".join(
                [
                    msg("m1", 8),
                    msg("m1", 328, stop="tool_use"),
                    msg("m2", 16),
                    json.dumps({"type": "user"}),
                    "kaputt",
                    msg("m3", 5, model="claude-sonnet-5-5", stop="end_turn"),
                ]
            )
            + "\n",
            "utf-8",
        )
        summary = usage.transcript_usage(path)
        opus = summary["claude-opus-5-5"]
        self.assertEqual(
            (opus["output"], opus["messages"], opus["complete"], opus["cache_read"]),
            (344, 2, 1, 200),
        )
        self.assertTrue(usage.is_lower_bound(summary))
        self.assertEqual(summary["claude-sonnet-5-5"]["output"], 5)
        self.assertEqual(usage.transcript_usage(self.dir / "fehlt.jsonl"), {})

    def test_incremental_main_only(self):
        path, cache = self.dir / "main.jsonl", self.dir / "cache.json"
        path.write_text(msg("a", 10, stop="end_turn") + "\n", "utf-8")
        first = usage.incremental_usage(path, cache)
        self.assertEqual(first["claude-opus-5-5"]["output"], 10)
        with open(path, "a", encoding="utf-8") as handle:
            handle.write(msg("b", 5, stop="end_turn") + "\n")
            handle.write(msg("c", 99, side=True) + "\n")
            handle.write(msg("d", 7)[:20])  # halbe Zeile
        second = usage.incremental_usage(path, cache)
        self.assertEqual(second["claude-opus-5-5"]["output"], 15)
        self.assertEqual(second["claude-opus-5-5"]["messages"], 2)

    def test_subagent_path_and_cost(self):
        tp = "/p/proj/abc.jsonl"
        self.assertEqual(
            usage.subagent_transcript(tp, "a1"),
            Path("/p/proj/abc/subagents/agent-a1.jsonl"),
        )
        inner = "/p/proj/abc/subagents/agent-a0.jsonl"
        self.assertEqual(
            usage.subagent_transcript(inner, "a1"),
            Path("/p/proj/abc/subagents/agent-a1.jsonl"),
        )
        path = self.dir / "s.jsonl"
        cost = {
            "type": "cost-state",
            "totalCostUSD": 1.5,
            "totalDuration": 1000,
            "modelUsage": {
                "claude-opus-5-5": {
                    "inputTokens": 1,
                    "outputTokens": 2,
                    "cacheReadInputTokens": 3,
                    "cacheCreationInputTokens": 4,
                    "costUSD": 1.5,
                }
            },
        }
        path.write_text(json.dumps(cost) + "\n", "utf-8")
        result = usage.session_cost(path)
        self.assertEqual(result["total_usd"], 1.5)
        self.assertEqual(result["models"]["claude-opus-5-5"]["cache_write"], 4)
        self.assertIsNone(usage.session_cost(self.dir / "fehlt.jsonl"))

    def test_broken_acc_in_cache_reparses_from_start(self):
        path, cache = self.dir / "main.jsonl", self.dir / "cache.json"
        path.write_text(
            msg("a", 10, stop="end_turn") + "\n" + msg("b", 5, stop="end_turn") + "\n",
            "utf-8",
        )
        expected = usage.transcript_usage(path, main_only=True)
        usage.incremental_usage(path, cache)
        data = json.loads(cache.read_text("utf-8"))
        data["acc"] = "kaputt"
        cache.write_text(json.dumps(data), "utf-8")
        self.assertEqual(usage.incremental_usage(path, cache), expected)

    def test_smaller_file_resets(self):
        path, cache = self.dir / "main.jsonl", self.dir / "cache.json"
        path.write_text(
            msg("a", 10, stop="end_turn") + "\n" + msg("b", 5, stop="end_turn") + "\n",
            "utf-8",
        )
        usage.incremental_usage(path, cache)
        path.write_text(msg("z", 3, stop="end_turn") + "\n", "utf-8")
        result = usage.incremental_usage(path, cache)
        self.assertEqual(result["claude-opus-5-5"]["output"], 3)
        self.assertEqual(result["claude-opus-5-5"]["messages"], 1)

    def test_half_line_completed_on_third_call(self):
        path, cache = self.dir / "main.jsonl", self.dir / "cache.json"
        line = msg("d", 7, stop="end_turn") + "\n"
        path.write_text(line[:20], "utf-8")
        self.assertEqual(usage.incremental_usage(path, cache), {})
        with open(path, "a", encoding="utf-8") as handle:
            handle.write(line[20:])
        result = usage.incremental_usage(path, cache)
        self.assertEqual(result["claude-opus-5-5"]["output"], 7)
