import os
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import efficiency
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

    def test_measured_agents_beat_aufwand_events(self):
        text = (
            "- erzeugt: 2026-10-08T09:02:04+02:00\n"
            "- Sessions: 1, Agenten: 50, Delegationen: 1\n"
            "- Datenbasis: 1 Session(s), 3 Agenten, 153 Aufrufe.\n"
            "- ROT: Umsetzeranteil: 0.0 % (x)\n"
        )
        parsed = effort.parse_ampel_session("S-a", text)
        self.assertEqual(parsed["agents"], 3)
        found = effort.ampel_incidents(
            [parsed, {**parsed, "id": "S-b", "t": parsed["t"] + 1}], set()
        )
        self.assertEqual(found, [])

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


METRIKEN = Path(__file__).resolve().parents[3] / "docs" / "studio" / "metriken"
RAW_RED = "- ROT: Steuerungsanteil (L0 + Leads): 66.2 % (gelb > 40 %, rot > 50 %)\n"


def steuerung_text(adjusted=None, extra=""):
    head = (
        "- erzeugt: 2026-10-11T09:00:00+02:00\n"
        "- Datenbasis: 1 Session(s), 20 Agenten, 100 Aufrufe.\n"
    )
    line = ""
    if adjusted is not None:
        line = (
            "- Steuerungsanteil bereinigt (E-049, ohne 2 Lead-Instanzen): "
            f"30.1 %, Bewertung {adjusted} (Schwellen wie die Rohzeile)\n"
        )
    return head + RAW_RED + extra + line


def parse_red(text):
    return effort.parse_ampel_session("S-a", text)["red"]


class AmpelAdjustedSteuerungTest(unittest.TestCase):
    def test_adjusted_green_clears_steuerung(self):
        self.assertNotIn("steuerung", parse_red(steuerung_text("grün")))

    def test_adjusted_yellow_clears_steuerung(self):
        self.assertNotIn("steuerung", parse_red(steuerung_text("gelb")))

    def test_adjusted_red_keeps_steuerung(self):
        self.assertIn("steuerung", parse_red(steuerung_text("rot")))

    def test_without_adjusted_line_raw_counts(self):
        self.assertIn("steuerung", parse_red(steuerung_text(None)))

    def test_not_measured_adjusted_falls_back_to_raw(self):
        text = steuerung_text(None) + (
            "- Steuerungsanteil bereinigt (E-049, ohne 0 Lead-Instanzen): "
            f"{efficiency.NOT_MEASURED}\n"
        )
        self.assertIn("steuerung", parse_red(text))

    def test_other_red_lights_stay(self):
        other = "- ROT: Cache-Write 5 min: 90 % (x)\n"
        for rating in ("grün", "gelb"):
            red = parse_red(steuerung_text(rating, extra=other))
            self.assertEqual(red, {"cache_write_5m"})

    def test_incidents_ignore_cleared_pair_but_fire_on_red_pair(self):
        def pair(rating):
            a = effort.parse_ampel_session("S-1", steuerung_text(rating))
            b = effort.parse_ampel_session("S-2", steuerung_text(rating))
            return [a, {**b, "t": a["t"] + 1}]

        cleared = effort.ampel_incidents(pair("grün"), set())
        self.assertNotIn("ampel:steuerung:S-2", ids(cleared))
        fired = effort.ampel_incidents(pair("rot"), set())
        self.assertIn("ampel:steuerung:S-2", ids(fired))

    def test_real_files(self):
        def real(name):
            text = (METRIKEN / f"{name}.md").read_text("utf-8")
            return effort.parse_ampel_session(name, text)["red"]

        self.assertNotIn("steuerung", real("S-2026-10-11-dc50be15"))
        self.assertNotIn("steuerung", real("S-2026-10-10-f52039fc"))
        self.assertIn("steuerung", real("S-2026-10-09-c64c0775"))


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
