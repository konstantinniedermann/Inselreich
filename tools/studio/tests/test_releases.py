import json
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import releases


def item(pkg, wait=None, **extra):
    data = {"pkg": pkg, "name": pkg, "stage": 3, "state": "waiting"}
    if wait:
        data["waitsFor"] = wait
    data.update(extra)
    return data


def hard(target, label="warten"):
    return {"target": target, "label": label, "hard": True}


class ChainTest(unittest.TestCase):
    def data(self):
        return {
            "releases": [
                {
                    "id": "R1",
                    "items": [item("REL:push"), item("A", hard("REL:push", "Push"))],
                },
                {
                    "items": [
                        item("B", hard("A:merge", "Merge A"), chainLabel="B: Umsetzung")
                    ]
                },
            ],
            "pool": [item("S", {"target": "A:merge", "label": "weich", "hard": False})],
        }

    def test_chain_follows_hard_waits_and_appends_soft(self):
        steps = releases.chain(self.data())
        self.assertEqual(
            [s["label"] for s in steps],
            ["Push", "A", "Merge A", "B: Umsetzung", "weich"],
        )
        self.assertEqual([s["hard"] for s in steps], [True] * 4 + [False])
        self.assertEqual(steps[0]["ref"], "REL:push")

    def test_chain_empty_without_waits(self):
        self.assertEqual(releases.chain({"releases": [{"items": [item("X")]}]}), [])

    def test_chain_survives_cycles(self):
        data = {"releases": [{"items": [item("A", hard("B")), item("B", hard("A"))]}]}
        self.assertEqual(releases.chain(data), [])

    def test_session_packages_collects_tree(self):
        tree = [{"package": "P1", "children": [{"package": "P2", "children": []}, {}]}]
        self.assertEqual(releases.session_packages(tree), ["P1", "P2"])


class LoadTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.path = Path(self.tmp.name) / "releases.json"

    def tearDown(self):
        self.tmp.cleanup()

    def test_missing_file_gives_hint(self):
        data, error = releases.load(self.path)
        self.assertIsNone(data)
        self.assertIn("fehlt", error)

    def test_broken_json_gives_hint(self):
        self.path.write_text("{kaputt", "utf-8")
        data, error = releases.load(self.path)
        self.assertIsNone(data)
        self.assertIn("nicht lesbar", error)

    def test_wrong_shape_gives_hint(self):
        self.path.write_text('{"releases": 5}', "utf-8")
        self.assertIsNone(releases.load(self.path)[0])

    def test_malformed_items_do_not_raise(self):
        self.path.write_text(json.dumps({"releases": [{"items": ["x"]}]}), "utf-8")
        data, error = releases.load(self.path)
        self.assertIsNone(data)
        self.assertTrue(error)

    def test_valid_file_carries_chain(self):
        self.path.write_text(json.dumps({"releases": []}), "utf-8")
        data, error = releases.load(self.path)
        self.assertEqual(error, "")
        self.assertEqual(data["chain"], [])

    def test_shipped_file_is_valid(self):
        shipped = (
            Path(__file__).resolve().parents[3] / "docs" / "studio" / "releases.json"
        )
        data, error = releases.load(shipped)
        self.assertEqual(error, "")
        self.assertTrue(data["chain"])


class LiveTest(unittest.TestCase):
    def test_ci_status_takes_latest_main_run_per_workflow(self):
        events = [
            {
                "kind": "ci",
                "branch": "main",
                "workflow": "CI",
                "conclusion": "failure",
                "sha": "a" * 40,
                "created": "2026-10-13T10:00:00Z",
            },
            {
                "kind": "ci",
                "branch": "main",
                "workflow": "CI",
                "conclusion": "success",
                "sha": "b" * 40,
                "created": "2026-10-14T10:00:00Z",
            },
            {
                "kind": "ci",
                "branch": "feat",
                "workflow": "Pages",
                "conclusion": "success",
                "sha": "c" * 40,
                "created": "2026-10-14T11:00:00Z",
            },
        ]
        status = releases.ci_status(events)
        self.assertEqual(status["ci"], {"conclusion": "success", "sha": "b" * 8})
        self.assertNotIn("pages", status)

    def test_live_state_without_git_is_none_not_error(self):
        with mock.patch("releases.subprocess.run", side_effect=OSError):
            live = releases.live_state(Path("."), [])
        self.assertEqual(
            (live["origin"], live["local"], live["ahead"]), (None, None, None)
        )

    def test_live_state_reads_hashes_and_ahead(self):
        outputs = {"origin/main": "1" * 40, "main": "2" * 40}

        def fake(cmd, **kwargs):
            if cmd[1] == "rev-list":
                text = "3\n"
            else:
                text = outputs[cmd[-1]] + "\n"
            return mock.Mock(stdout=text)

        with mock.patch("releases.subprocess.run", side_effect=fake):
            live = releases.live_state(Path("."), [])
        self.assertEqual(
            (live["origin"], live["local"], live["ahead"]), ("1" * 8, "2" * 8, 3)
        )
