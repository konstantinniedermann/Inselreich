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

    def test_session_packages_unites_registered(self):
        tree = [{"package": "P1", "children": []}]
        registered = {"P1": {"owner": "x", "status": "active"}, "P0": {}}
        self.assertEqual(releases.session_packages(tree, registered), ["P0", "P1"])


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


class GoalTest(unittest.TestCase):
    def test_goal_stage_accepts_only_ints_1_to_5(self):
        for value in (1, 3, 5):
            self.assertEqual(releases.goal_stage({"goalStage": value}), value)
        for value in (0, 6, 2.5, "3", True, None, -1):
            with self.subTest(value=value):
                self.assertIsNone(releases.goal_stage({"goalStage": value}))
        self.assertIsNone(releases.goal_stage({}))
        self.assertIsNone(releases.goal_stage("kein dict"))

    def test_normalize_removes_invalid_and_warns_only_when_present(self):
        data = {
            "releases": [
                {
                    "items": [
                        item("A", goalStage=3),
                        item("B", goalStage="3"),
                        item("C"),
                        "kaputt",
                    ]
                }
            ],
            "pool": [item("D", goalStage=9)],
        }
        warnings = releases.normalize_goals(data)
        items = data["releases"][0]["items"]
        self.assertEqual(items[0]["goalStage"], 3)
        self.assertNotIn("goalStage", items[1])
        self.assertNotIn("goalStage", data["pool"][0])
        self.assertEqual(
            warnings,
            [
                "B: goalStage ungültig ('3') ignoriert",
                "D: goalStage ungültig (9) ignoriert",
            ],
        )

    def test_load_returns_data_with_goal_warnings(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "releases.json"
            path.write_text(
                json.dumps(
                    {"releases": [{"items": [item("A", goalStage=0)]}], "pool": []}
                ),
                "utf-8",
            )
            data, error = releases.load(path)
            self.assertEqual(error, "")
            self.assertEqual(len(data["goal_warnings"]), 1)
            path.write_text('{"releases": []}', "utf-8")
            data, _ = releases.load(path)
            self.assertEqual(data["goal_warnings"], [])

    def test_goal_progress_counts_session_packages_only(self):
        data = {
            "releases": [
                {
                    "items": [
                        item("I-047-x", goalStage=3, stage=3),
                        item("B", goalStage=4, stage=5),
                        item("C", goalStage=4, stage=2),
                        item("D", stage=5),
                        item("E", goalStage=2, stage=1),
                    ]
                }
            ],
            "pool": [],
        }
        progress = releases.goal_progress(data, ["i-047", "B", "C", "D"])
        self.assertEqual(progress["total"], 3)
        self.assertEqual(progress["reached"], 2)
        self.assertEqual(sorted(progress["pkgs"]), ["B", "C", "I-047-x"])

    def test_goal_progress_without_data_is_zero(self):
        self.assertEqual(
            releases.goal_progress(None, ["A"]),
            {"total": 0, "reached": 0, "pkgs": []},
        )


def node(role, status, package="", children=None):
    return {
        "role": role,
        "status": status,
        "package": package,
        "children": children or [],
    }


def pkg_event(pkg, status, owner="lead-tech", session="s1", key="package_id"):
    return {
        "kind": "package",
        key: pkg,
        "status": status,
        "owner": owner,
        "session_id": session,
    }


class WorkingNowTest(unittest.TestCase):
    def test_one_entry_per_package_owner_is_topmost(self):
        tree = [
            node(
                "main",
                "idle",
                "",
                [
                    node(
                        "lead-tech",
                        "active",
                        "P1",
                        [
                            node("tech-sim-engineer", "delegated", "P1"),
                            node("tech-sim-engineer", "delegated", "P1"),
                            node("qa-code-reviewer", "idle", "P1"),
                        ],
                    ),
                    node("lead-qa", "waiting", "P2"),
                    node("lead-art", "idle", "P3"),
                    node("lead-x", "active", ""),
                ],
            )
        ]
        self.assertEqual(
            releases.working_now(tree),
            [
                {
                    "package": "P1",
                    "owner": "lead-tech",
                    "agents": [{"role": "tech-sim-engineer", "status": "delegated"}],
                    "status": "active",
                },
                {
                    "package": "P2",
                    "owner": "lead-qa",
                    "agents": [],
                    "status": "waiting",
                },
            ],
        )

    def test_empty_tree_is_empty_list(self):
        self.assertEqual(releases.working_now([]), [])
        self.assertEqual(releases.working_now(None), [])

    def test_registered_package_without_node_is_listed(self):
        tree = [node("lead-tech", "active", "P1")]
        registered = {
            "P1": {"owner": "andere", "status": "blocked"},
            "P9": {"owner": "lead-art", "status": "review"},
        }
        result = releases.working_now(tree, registered)
        self.assertEqual(
            result,
            [
                {
                    "package": "P1",
                    "owner": "lead-tech",
                    "agents": [],
                    "status": "active",
                },
                {
                    "package": "P9",
                    "owner": "lead-art",
                    "agents": [],
                    "status": "review",
                },
            ],
        )


class RegisteredPackagesTest(unittest.TestCase):
    def test_last_event_per_package_decides(self):
        events = [
            pkg_event("A", "active"),
            pkg_event("A", "done"),
            pkg_event("B", "planned"),
            pkg_event("B", "review", owner="lead-qa"),
            pkg_event("C", "blocked", key="package"),
            {"kind": "status", "session_id": "s1"},
        ]
        self.assertEqual(
            releases.registered_packages(events, "s1"),
            {
                "B": {"owner": "lead-qa", "status": "review"},
                "C": {"owner": "lead-tech", "status": "blocked"},
            },
        )

    def test_session_selection(self):
        events = [pkg_event("A", "active"), pkg_event("B", "active", session="s2")]
        self.assertEqual(list(releases.registered_packages(events, "s2")), ["B"])
        self.assertEqual(list(releases.registered_packages(events, "all")), ["A", "B"])
        self.assertEqual(releases.registered_packages(events, None), {})
