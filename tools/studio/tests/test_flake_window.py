import tempfile
import unittest
from datetime import UTC, datetime
from pathlib import Path

import metrics

import tests.test_efficiency as eff


def entry(ts):
    return {"type": "user", "timestamp": ts, "message": {"content": "x"}}


class FlakeWindowStartTest(unittest.TestCase):
    """R565 V3: --sessions N begrenzt den Flake-Zeitraum auf die gewählten Sessions."""

    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.root = Path(tmp.name)

    def transcript(self, name, *stamps):
        path = self.root / name
        eff.write(path, [{"type": "summary"}, *[entry(s) for s in stamps]])
        return path

    def test_starts_at_oldest_selected_transcript(self):
        old = self.transcript("a.jsonl", "2026-10-10T08:00:00Z", "2026-10-10T09:00:00Z")
        new = self.transcript("b.jsonl", "2026-10-11T08:00:00Z")
        since = metrics.flake_since([new, old], sessions=2, since=None)
        self.assertEqual(since, datetime(2026, 10, 10, 8, 0, tzinfo=UTC))

    def test_without_sessions_nothing_is_cut(self):
        old = self.transcript("a.jsonl", "2026-10-10T08:00:00Z")
        self.assertIsNone(metrics.flake_since([old], sessions=None, since=None))

    def test_explicit_since_stays_without_sessions(self):
        given = datetime(2026, 10, 9, tzinfo=UTC)
        self.assertEqual(metrics.flake_since([], sessions=None, since=given), given)

    def test_later_of_since_and_start_wins(self):
        old = self.transcript("a.jsonl", "2026-10-10T08:00:00Z")
        given = datetime(2026, 10, 12, tzinfo=UTC)
        self.assertEqual(metrics.flake_since([old], sessions=1, since=given), given)

    def test_transcript_without_timestamps_gives_since(self):
        bare = self.transcript("a.jsonl")
        self.assertIsNone(metrics.flake_since([bare], sessions=1, since=None))
        self.assertIsNone(metrics.flake_since([self.root / "fehlt"], 1, None))
