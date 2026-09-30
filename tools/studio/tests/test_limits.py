import json
import os
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path

import limits

RESET = 1790000000


def full():
    return {
        "session_id": "t",
        "rate_limits": {
            "five_hour": {"used_percentage": 42, "resets_at": RESET},
            "seven_day": {"used_percentage": 31.5, "resets_at": RESET + 1000},
        },
        "context_window": {"used_percentage": 18},
    }


class ParseTest(unittest.TestCase):
    def test_full_payload(self):
        data = limits.parse(full(), now=1000.0)
        self.assertEqual(data["ts"], 1000.0)
        self.assertEqual(data["session_id"], "t")
        self.assertEqual(data["five_hour_pct"], 42)
        self.assertEqual(data["five_hour_resets_at"], RESET)
        self.assertEqual(data["seven_day_pct"], 31.5)
        self.assertEqual(data["seven_day_resets_at"], RESET + 1000)
        self.assertEqual(data["context_pct"], 18)

    def test_missing_rate_limits(self):
        data = limits.parse(
            {"session_id": "t", "context_window": {"used_percentage": 5}}
        )
        self.assertIsNone(data["five_hour_pct"])
        self.assertIsNone(data["seven_day_pct"])
        self.assertEqual(data["context_pct"], 5)

    def test_missing_single_window_or_field(self):
        p = {"rate_limits": {"five_hour": {"resets_at": RESET}}}
        data = limits.parse(p)
        self.assertIsNone(data["five_hour_pct"])
        self.assertEqual(data["five_hour_resets_at"], RESET)
        self.assertIsNone(data["seven_day_pct"])

    def test_garbage_values(self):
        p = {
            "session_id": 5,
            "rate_limits": {
                "five_hour": {"used_percentage": "viel", "resets_at": True},
                "seven_day": {"used_percentage": True, "resets_at": None},
            },
            "context_window": {"used_percentage": float("nan")},
        }
        data = limits.parse(p)
        for key in (
            "five_hour_pct",
            "five_hour_resets_at",
            "seven_day_pct",
            "seven_day_resets_at",
            "context_pct",
        ):
            self.assertIsNone(data[key], key)
        self.assertEqual(data["session_id"], "")

    def test_non_dict_inputs(self):
        for bad in (None, [], "x", 3, {"rate_limits": "x", "context_window": []}):
            data = limits.parse(bad)
            self.assertIsNone(data["five_hour_pct"])
            self.assertIsNone(data["context_pct"])

    def test_percent_clamped(self):
        p = {"rate_limits": {"five_hour": {"used_percentage": 140}}}
        self.assertEqual(limits.parse(p)["five_hour_pct"], 100)
        p = {"rate_limits": {"five_hour": {"used_percentage": -3}}}
        self.assertEqual(limits.parse(p)["five_hour_pct"], 0)

    def test_has_values(self):
        self.assertTrue(limits.has_values(limits.parse(full())))
        self.assertFalse(limits.has_values(limits.parse({"session_id": "t"})))


class LightTest(unittest.TestCase):
    def test_thresholds(self):
        self.assertEqual(limits.light(0), "grün")
        self.assertEqual(limits.light(59), "grün")
        self.assertEqual(limits.light(59.9), "grün")
        self.assertEqual(limits.light(60), "gelb")
        self.assertEqual(limits.light(79), "gelb")
        self.assertEqual(limits.light(80), "rot")
        self.assertEqual(limits.light(100), "rot")
        self.assertIsNone(limits.light(None))


class FileTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.path = Path(self.tmp.name) / "limits.json"

    def test_write_atomic_roundtrip_and_no_leftovers(self):
        limits.write_atomic(self.path, {"a": 1})
        limits.write_atomic(self.path, {"a": 2})
        self.assertEqual(json.loads(self.path.read_text("utf-8")), {"a": 2})
        self.assertEqual(os.listdir(self.tmp.name), ["limits.json"])

    def test_write_atomic_creates_folder(self):
        target = Path(self.tmp.name) / "sub" / "limits.json"
        limits.write_atomic(target, {"a": 1})
        self.assertTrue(target.is_file())

    def test_read_fresh_age(self):
        limits.write_atomic(self.path, limits.parse(full(), now=1000.0))
        now9 = 1000.0 + 9 * 60
        now11 = 1000.0 + 11 * 60
        self.assertEqual(limits.read_fresh(self.path, now9)["five_hour_pct"], 42)
        self.assertIsNone(limits.read_fresh(self.path, now11))
        self.assertIsNotNone(limits.read_fresh(self.path, now11, max_age=3600))

    def test_read_fresh_sanitizes_garbage_values(self):
        bad = {
            "ts": 1000.0,
            "five_hour_pct": "viel",
            "five_hour_resets_at": "bald",
            "seven_day_pct": True,
            "context_pct": 250,
            "session_id": 7,
        }
        self.path.write_text(json.dumps(bad), "utf-8")
        data = limits.read_fresh(self.path, 1001.0)
        self.assertIsNone(data["five_hour_pct"])
        self.assertIsNone(data["five_hour_resets_at"])
        self.assertIsNone(data["seven_day_pct"])
        self.assertEqual(data["context_pct"], 100)
        self.assertEqual(data["session_id"], "")
        self.assertEqual(
            limits.summary(data),
            "Limit: Kontext L0 100 %. Kontext >= 50 %: Übergabe über state.md",
        )

    def test_read_fresh_robust(self):
        self.assertIsNone(limits.read_fresh(self.path, 1.0))
        self.path.write_text("kein json", "utf-8")
        self.assertIsNone(limits.read_fresh(self.path, 1.0))
        self.path.write_text("[1]", "utf-8")
        self.assertIsNone(limits.read_fresh(self.path, 1.0))
        self.path.write_text('{"ts": "gestern"}', "utf-8")
        self.assertIsNone(limits.read_fresh(self.path, 1.0))


def hhmm(epoch):
    return datetime.fromtimestamp(epoch, tz=timezone.utc).astimezone().strftime("%H:%M")


class SummaryTest(unittest.TestCase):
    def test_full_summary(self):
        data = limits.parse(full(), now=1.0)
        text = limits.summary(data)
        self.assertEqual(
            text,
            f"Limit: 5h 42 % (Reset {hhmm(RESET)}), Woche 31 %, "
            "Kontext L0 18 % → Ampel grün. volle Parallelität",
        )

    def test_parts_omitted(self):
        data = limits.parse({"context_window": {"used_percentage": 18}})
        self.assertEqual(limits.summary(data), "Limit: Kontext L0 18 %")
        self.assertEqual(limits.summary(limits.parse({})), "")

    def test_yellow_and_red_hints(self):
        yellow = limits.parse({"rate_limits": {"five_hour": {"used_percentage": 65}}})
        self.assertIn("Ampel gelb", limits.summary(yellow))
        self.assertIn(
            "herunterfahren: weniger parallel, keine neue Welle, "
            "Angefangenes abschliessen",
            limits.summary(yellow),
        )
        red = limits.parse({"rate_limits": {"five_hour": {"used_percentage": 85}}})
        text = limits.summary(red)
        self.assertIn(
            "Session-Ende vorbereiten: abschliessen, state.md, Session beenden", text
        )
        self.assertNotIn("herunterfahren", text)
        for word in ("sonnet", "haiku"):
            self.assertNotIn(word, text.lower())

    def test_week_hint_only_above_80(self):
        def week(pct):
            return limits.parse(
                {"rate_limits": {"seven_day": {"used_percentage": pct}}}
            )

        self.assertNotIn("Wochenfenster hoch", limits.summary(week(80)))
        self.assertIn(
            "Wochenfenster hoch: Parallelität halbieren", limits.summary(week(81))
        )

    def test_context_hint_from_50(self):
        def ctx(pct):
            return limits.parse({"context_window": {"used_percentage": pct}})

        self.assertNotIn("Übergabe", limits.summary(ctx(49)))
        self.assertIn(
            "Kontext >= 50 %: Übergabe über state.md", limits.summary(ctx(50))
        )

    def test_suffix(self):
        self.assertEqual(limits.suffix(limits.parse(full())), "5h 42 %")
        self.assertEqual(limits.suffix(limits.parse({})), "")


if __name__ == "__main__":
    unittest.main()
