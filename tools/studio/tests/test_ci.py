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


if __name__ == "__main__":
    unittest.main()
