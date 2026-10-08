import json
import subprocess
import unittest
from datetime import datetime, timezone

import actions

NOW = datetime(2026, 10, 8, tzinfo=timezone.utc)


def fake(items, login="koschi", name="anno-clone"):
    calls = []

    def run(args):
        calls.append(args)
        if args[:2] == ["api", "user"]:
            return login + "\n"
        if args[0] == "repo":
            if name is None:
                raise subprocess.CalledProcessError(1, "gh")
            return name + "\n"
        return json.dumps({"usageItems": items})

    run.calls = calls
    return run


def item(qty, repo="anno-clone", product="actions", unit="Minutes"):
    return {
        "product": product,
        "unitType": unit,
        "quantity": qty,
        "repositoryName": repo,
    }


class ActionsTest(unittest.TestCase):
    def test_sums_repo_and_account(self):
        run = fake([item(100), item(30, repo="x"), item(9, product="copilot")])
        self.assertEqual(actions.usage(NOW, run), (100.0, 130.0))
        self.assertIn(
            "/users/koschi/settings/billing/usage?year=2026&month=10", run.calls[2][1]
        )

    def test_lights_green_yellow_red(self):
        self.assertIn("GRÜN: Inselreich", actions.render(NOW, fake([item(150)])))
        self.assertIn("GELB: Inselreich", actions.render(NOW, fake([item(151)])))
        self.assertIn("ROT: Inselreich", actions.render(NOW, fake([item(401)])))
        text = actions.render(NOW, fake([item(1001, repo="x")]))
        self.assertIn("GELB: Konto-Minuten: 1001", text)
        self.assertIn(
            "ROT: Konto-Minuten: 1601",
            actions.render(NOW, fake([item(1601, repo="x")])),
        )

    def test_failure_is_not_recorded_never_zero(self):
        def broken(args):
            raise FileNotFoundError("gh")

        def failing(args):
            raise subprocess.CalledProcessError(1, "gh")

        for runner in (broken, failing, lambda a: "kein json"):
            text = actions.render(NOW, runner)
            self.assertEqual(text.count("nicht erfasst"), 2)
            self.assertNotIn("GRÜN", text)

    def test_empty_usage_is_zero_not_missing(self):
        self.assertEqual(actions.usage(NOW, fake([])), (0.0, 0.0))

    def test_repo_name_is_detected_not_hardcoded(self):
        run = fake([item(918, repo="Inselreich"), item(5, repo="x")], name="Inselreich")
        self.assertEqual(actions.usage(NOW, run), (918.0, 923.0))
        self.assertIn(["repo", "view", "--json", "name", "-q", ".name"], run.calls)

    def test_repo_name_failure_is_not_recorded(self):
        self.assertIsNone(actions.usage(NOW, fake([item(1)], name=None)))

    def test_empty_login_is_not_recorded(self):
        self.assertIsNone(actions.usage(NOW, fake([], login="")))


if __name__ == "__main__":
    unittest.main()
