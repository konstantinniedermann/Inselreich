import os
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import effort
import hook
import model

FIXTURES = Path(__file__).parent / "fixtures"
T0 = 1_790_000_000.0


def sess(n, agents=20, red=("cache_write_5m",)):
    return {"id": f"S-{n:02d}", "t": T0 + n * 3600, "agents": agents, "red": set(red)}


def ids(found):
    return [i["id"] for i in found]


class AmpelIncidentsTest(unittest.TestCase):
    def test_fires_on_two_big_red_in_a_row(self):
        found = effort.ampel_incidents([sess(1), sess(2)], set())
        self.assertEqual(ids(found), ["ampel:cache_write_5m:S-02"])
        self.assertEqual(found[0]["kind"], "ampel")
        self.assertEqual(found[0]["t"], T0 + 2 * 3600)
        self.assertIn("Cache-Write 5 min", found[0]["text"])
        self.assertIn("S-01", found[0]["text"])

    def test_small_session_in_pair_does_not_count(self):
        sessions = [sess(1), sess(2, agents=9)]
        self.assertEqual(effort.ampel_incidents(sessions, set()), [])

    def test_small_session_between_breaks_chain(self):
        sessions = [sess(1), sess(2, agents=3, red=()), sess(3)]
        self.assertEqual(effort.ampel_incidents(sessions, set()), [])

    def test_single_red_does_not_fire(self):
        sessions = [sess(1), sess(2, red=())]
        self.assertEqual(effort.ampel_incidents(sessions, set()), [])

    def test_different_lights_do_not_pair(self):
        sessions = [sess(1, red=("opus",)), sess(2, red=("cache_write_5m",))]
        self.assertEqual(effort.ampel_incidents(sessions, set()), [])

    def test_acknowledged_disappears(self):
        found = effort.ampel_incidents(
            [sess(1), sess(2)], {"ampel:cache_write_5m:S-02"}
        )
        self.assertEqual(found, [])

    def test_fires_again_only_after_two_more_reds(self):
        ack = {"ampel:cache_write_5m:S-02"}
        self.assertEqual(effort.ampel_incidents([sess(1), sess(2), sess(3)], ack), [])
        found = effort.ampel_incidents([sess(1), sess(2), sess(3), sess(4)], ack)
        self.assertEqual(ids(found), ["ampel:cache_write_5m:S-04"])

    def test_backlog_gives_one_incident_for_latest_pair(self):
        sessions = [sess(n) for n in range(1, 7)]
        found = effort.ampel_incidents(sessions, set())
        self.assertEqual(ids(found), ["ampel:cache_write_5m:S-06"])

    def test_order_is_chronological_not_by_input(self):
        found = effort.ampel_incidents([sess(2), sess(1)], set())
        self.assertEqual(ids(found), ["ampel:cache_write_5m:S-02"])

    def test_one_incident_per_light_in_label_order(self):
        both = ("umsetzer", "cache_write_5m")
        found = effort.ampel_incidents([sess(1, red=both), sess(2, red=both)], set())
        self.assertEqual(
            ids(found), ["ampel:umsetzer:S-02", "ampel:cache_write_5m:S-02"]
        )


class AmpelParserTest(unittest.TestCase):
    def test_real_file(self):
        text = (FIXTURES / "S-2026-10-07-b2a8949d.md").read_text("utf-8")
        parsed = effort.parse_ampel_session("S-2026-10-07-b2a8949d", text)
        self.assertEqual(parsed["id"], "S-2026-10-07-b2a8949d")
        self.assertEqual(
            parsed["agents"], 4
        )  # gemessen, nicht die 24 Aufwand-Ereignisse
        self.assertEqual(parsed["red"], {"umsetzer", "cache_write_5m", "opus"})
        self.assertGreater(parsed["t"], 1_700_000_000)

    def test_falls_back_to_aufwand_agents(self):
        text = "- erzeugt: 2026-10-01T10:00:00+02:00\n- Sessions: 1, Agenten: 30, X\n"
        parsed = effort.parse_ampel_session("S-a", text)
        self.assertEqual(parsed["agents"], 30)

    def test_broken_file_is_none(self):
        self.assertIsNone(effort.parse_ampel_session("S-x", "# nichts"))

    def test_load_missing_folder_and_broken_files(self):
        self.assertEqual(model.load_ampel_sessions(Path("/nicht/da")), [])
        with tempfile.TemporaryDirectory() as tmp:
            (Path(tmp) / "S-kaputt.md").write_text("Müll", "utf-8")
            (Path(tmp) / "README.md").write_text("x", "utf-8")
            good = (FIXTURES / "S-2026-10-07-b2a8949d.md").read_text("utf-8")
            (Path(tmp) / "S-2026-10-07-b2a8949d.md").write_text(good, "utf-8")
            found = model.load_ampel_sessions(Path(tmp))
        self.assertEqual([s["id"] for s in found], ["S-2026-10-07-b2a8949d"])

    def test_labels_come_from_one_list(self):
        import efficiency

        for key in efficiency.THRESHOLDS:
            self.assertIn(key, efficiency.LIGHT_LABELS)
        self.assertEqual(
            len(set(efficiency.LIGHT_LABELS.values())), len(efficiency.LIGHT_LABELS)
        )


class AmpelWiringTest(unittest.TestCase):
    def test_pending_incidents_includes_ampel(self):
        found = model.pending_incidents([], T0, ampel_sessions=[sess(1), sess(2)])
        self.assertEqual(ids(found), ["ampel:cache_write_5m:S-02"])

    def test_retro_trigger_acknowledges(self):
        retro = {
            "ts": "2026-10-08T10:00:00Z",
            "kind": "retro",
            "retro_id": "R-1",
            "retro_kind": "adhoc",
            "triggers": ["ampel:cache_write_5m:S-02"],
            "report": "retros/x.md",
            "session_id": "s1",
        }
        found = model.pending_incidents([retro], T0, ampel_sessions=[sess(1), sess(2)])
        self.assertEqual(found, [])

    def test_hook_notice_contains_ampel(self):
        incidents = effort.ampel_incidents([sess(1), sess(2)], set())
        with (
            tempfile.TemporaryDirectory() as tmp,
            mock.patch.dict(os.environ, {"STUDIO_HOME": tmp}),
        ):
            text = hook.incident_notice(
                {"hook_event_name": "UserPromptSubmit", "session_id": "s-1"},
                incidents,
            )
        self.assertIn("Ad-hoc-Retro fällig", text)
        self.assertIn("Cache-Write 5 min", text)
