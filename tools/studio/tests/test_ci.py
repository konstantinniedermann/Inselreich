import unittest

import ci

RUNS = [
    {
        "databaseId": 1,
        "conclusion": "failure",
        "status": "completed",
        "createdAt": "2026-09-30T10:00:00Z",
        "headSha": "abc",
        "workflowName": "CI",
        "headBranch": "main",
    },
    {
        "databaseId": 2,
        "conclusion": "",
        "status": "in_progress",
        "createdAt": "2026-09-30T11:00:00Z",
        "headSha": "def",
        "workflowName": "CI",
        "headBranch": "main",
    },
]


class CiTest(unittest.TestCase):
    def test_collect_only_new_completed(self):
        events = ci.collect(lambda: RUNS, set())
        self.assertEqual(
            [(e["run_id"], e["conclusion"]) for e in events], [("1", "failure")]
        )
        self.assertEqual(events[0]["kind"], "ci")
        self.assertEqual(events[0]["source"], "ci")
        self.assertEqual(ci.collect(lambda: RUNS, {"1"}), [])

    def test_events_carry_handbook_version(self):
        events = ci.collect(lambda: RUNS, set(), "1.0")
        self.assertEqual(events[0]["handbook_version"], "1.0")

    def test_runner_failure(self):
        def boom():
            raise OSError("gh fehlt")

        self.assertEqual(ci.collect(boom, set()), [])

    def test_bad_record_is_skipped(self):
        runs = [{"status": "completed"}, "kaputt", RUNS[0]]
        events = ci.collect(lambda: runs, set())
        self.assertEqual([e["run_id"] for e in events], ["1"])

    def test_event_carries_attempt_default_one(self):
        events = ci.collect(lambda: RUNS, set())
        self.assertEqual(events[0]["attempt"], 1)
        runs = [dict(RUNS[0], attempt=3)]
        self.assertEqual(ci.collect(lambda: runs, set())[0]["attempt"], 3)

    def test_rerun_creates_new_event_second_collect_none(self):
        first = dict(RUNS[0], attempt=1)
        rerun = dict(RUNS[0], attempt=2, conclusion="success")
        seen: set[str] = set()
        events = ci.collect(lambda: [first], seen)
        self.assertEqual(len(events), 1)
        seen.add(ci.seen_key(events[0]["run_id"], events[0]["attempt"]))
        self.assertEqual(ci.collect(lambda: [first], seen), [])
        events = ci.collect(lambda: [rerun], seen)
        self.assertEqual([(e["run_id"], e["attempt"]) for e in events], [("1", 2)])

    def test_old_seen_file_with_plain_run_ids(self):
        seen = ci.normalize_seen(["1", "5:2"])
        self.assertEqual(seen, {"1:1", "5:2"})
        self.assertEqual(ci.collect(lambda: RUNS, seen), [])
        rerun = [dict(RUNS[0], attempt=2)]
        self.assertEqual(len(ci.collect(lambda: rerun, seen)), 1)


if __name__ == "__main__":
    unittest.main()
