import json
import subprocess
import unittest
from datetime import UTC, datetime

import actions

NOW = datetime(2026, 10, 8, tzinfo=UTC)


def fake(items, login="koschi", name="anno-clone", visibility=None):
    calls = []

    def run(args):
        calls.append(args)
        if "visibility" in args:
            if visibility is None:
                raise subprocess.CalledProcessError(1, "gh")
            return visibility + "\n"
        if args[:2] == ["api", "user"]:
            return login + "\n"
        if args[0] == "repo":
            if name is None:
                raise subprocess.CalledProcessError(1, "gh")
            return name + "\n"
        return json.dumps({"usageItems": items})

    run.calls = calls
    return run


def item(qty, repo="anno-clone", product="actions", unit="Minutes", day=None):
    entry = {
        "product": product,
        "unitType": unit,
        "quantity": qty,
        "repositoryName": repo,
    }
    if day is not None:
        entry["date"] = f"2026-10-{day:02d}T06:00:00Z"
    return entry


class ActionsTest(unittest.TestCase):
    def test_sums_repo_and_account(self):
        run = fake([item(100), item(30, repo="x"), item(9, product="copilot")])
        self.assertEqual(actions.usage(NOW, run), (100.0, 130.0))
        urls = [c[1] for c in run.calls if c[0] == "api" and c[1] != "user"]
        self.assertEqual(
            urls, ["/users/koschi/settings/billing/usage?year=2026&month=10"]
        )

    def test_lights_green_yellow_red(self):
        self.assertIn(
            "- Info: Inselreich-Minuten: 150", actions.render(NOW, fake([item(150)]))
        )
        for qty in (151, 401):
            text = actions.render(NOW, fake([item(qty)]))
            self.assertIn(f"- Info: Inselreich-Minuten: {qty}", text)
            self.assertNotIn(f"Inselreich-Minuten: {qty} (", text)
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
            self.assertEqual(text.count("nicht erfasst"), 4)
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


class PublicRepoTest(unittest.TestCase):
    TEN = datetime(2026, 10, 10, 12, tzinfo=UTC)

    def test_public_repo_minutes_not_counted_to_account(self):
        items = [item(1074, day=1), item(30, repo="x", day=1)]
        text = actions.render(self.TEN, fake(items, visibility="PUBLIC"))
        self.assertIn(
            "- Info: Inselreich-Minuten: 1074 (öffentlich, nicht abgerechnet)", text
        )
        self.assertIn("GRÜN: Konto-Minuten: 30 von 2000", text)
        self.assertIn("GRÜN: Konto-Prognose Monatsende", text)

    def test_public_repo_rate_excludes_repo_days(self):
        items = [item(500, day=d) for d in (7, 8, 9)]
        text = actions.render(self.TEN, fake(items, visibility="PUBLIC"))
        self.assertIn("Konto-Prognose Monatsende: 0 von 2000", text)

    def test_private_repo_counts_as_before(self):
        text = actions.render(self.TEN, fake([item(1700, day=1)], visibility="PRIVATE"))
        self.assertIn("ROT: Konto-Minuten: 1700", text)
        self.assertNotIn("nicht abgerechnet", text)

    def test_visibility_failure_counts_conservatively(self):
        text = actions.render(self.TEN, fake([item(1700, day=1)], visibility=None))
        self.assertIn("ROT: Konto-Minuten: 1700", text)

    def test_session_minutes_only_info_when_public(self):
        runs = [{"databaseId": 1, "createdAt": "2026-10-08T11:00:00Z"}]
        jobs = [
            {"startedAt": "2026-10-08T11:00:00Z", "completedAt": "2026-10-08T11:20:00Z"}
        ]
        base = SessionMinutesTest.runner(runs, jobs)

        def run(args):
            return "PUBLIC\n" if "visibility" in args else base(args)

        since = datetime(2026, 10, 8, 10, tzinfo=UTC)
        text = actions.render(self.TEN, run, since=since)
        self.assertIn(
            "- Info: Session-Minuten: 20 (öffentlich, nicht abgerechnet)", text
        )
        self.assertNotIn("ROT: Session", text)


class ForecastTest(unittest.TestCase):
    TEN = datetime(2026, 10, 10, 12, tzinfo=UTC)

    def items(self, **extra):
        base = [item(1101, day=1)] + [item(50, day=d) for d in (7, 8, 9)]
        return base + extra.get("more", [])

    def test_red_forecast_with_push_rule(self):
        text = actions.render(self.TEN, fake(self.items()))
        self.assertIn(
            "- ROT: Konto-Prognose Monatsende: 2351 von 2000 "
            "(verbraucht 1251 + 50/Tag × 22 Resttage;",
            text,
        )
        self.assertIn("höchstens ein Push je Tag", text)
        self.assertIn("gelb > 1600, rot > 1900", text)

    def test_forecast_boundaries(self):
        for spent, light in (
            (1600, "GRÜN"),
            (1601, "GELB"),
            (1900, "GELB"),
            (1901, "ROT"),
        ):
            line = actions.render(self.TEN, fake([item(spent, day=1)]))
            self.assertIn(f"- {light}: Konto-Prognose Monatsende: {spent} ", line)

    def test_first_of_month_is_not_recorded(self):
        first = datetime(2026, 10, 1, 12, tzinfo=UTC)
        text = actions.render(first, fake([item(40, day=1)]))
        self.assertIn("- nicht erfasst: Konto-Prognose Monatsende", text)
        self.assertIsNone(actions.forecast(40, {1: 40.0}, first))

    def test_second_of_month_uses_exactly_one_day(self):
        second = datetime(2026, 10, 2, 12, tzinfo=UTC)
        self.assertEqual(
            actions.forecast(100, {1: 60.0, 2: 99.0}, second), 100 + 60 * 30
        )

    def test_third_day_uses_two_days(self):
        third = datetime(2026, 10, 3, 12, tzinfo=UTC)
        self.assertEqual(actions.forecast(0, {1: 20.0, 2: 40.0}, third), 30 * 29)

    def test_foreign_products_and_units_ignored(self):
        more = [
            item(500, product="copilot", day=8),
            item(500, unit="GigabyteHours", day=9),
        ]
        text = actions.render(self.TEN, fake(self.items(more=more)))
        self.assertIn("50/Tag × 22", text)

    def test_missing_dates_only_forecast_not_recorded(self):
        text = actions.render(self.TEN, fake([item(100)]))
        self.assertIn("- nicht erfasst: Konto-Prognose Monatsende", text)
        self.assertIn("Konto-Minuten: 100 von 2000", text)

    def test_forecast_is_pure_and_rounded(self):
        days = {7: 10.0, 8: 10.0, 9: 11.0}
        self.assertEqual(actions.forecast(0, days, self.TEN), round(31 / 3 * 22))
        self.assertIsNone(actions.forecast(5, None, self.TEN))


class SessionMinutesTest(unittest.TestCase):
    SINCE = datetime(2026, 10, 8, 10, tzinfo=UTC)

    @staticmethod
    def runner(runs, jobs):
        def run(args):
            if args[:2] == ["run", "list"]:
                return json.dumps(runs)
            return json.dumps({"jobs": jobs})

        return run

    def test_rounds_each_job_up_and_skips_old_runs(self):
        runs = [
            {"databaseId": 1, "createdAt": "2026-10-08T11:00:00Z"},
            {"databaseId": 2, "createdAt": "2026-10-08T09:00:00Z"},
        ]
        jobs = [
            {"startedAt": "2026-10-08T11:00:00Z", "completedAt": "2026-10-08T11:04:01Z"}
        ]
        self.assertEqual(
            actions.session_minutes(self.SINCE, self.runner(runs, jobs)), 5
        )

    def test_skipped_jobs_not_counted(self):
        runs = [{"databaseId": 1, "createdAt": "2026-10-08T11:00:00Z"}]
        jobs = [
            {
                "conclusion": "skipped",
                "startedAt": "2026-10-08T11:00:00Z",
                "completedAt": "2026-10-08T11:05:00Z",
            }
        ]
        self.assertEqual(
            actions.session_minutes(self.SINCE, self.runner(runs, jobs)), 0
        )

    def test_limits_exactly_ten_fifteen_and_red(self):
        runs = [{"databaseId": 1, "createdAt": "2026-10-08T11:00:00Z"}]

        def line(minutes):
            jobs = [
                {
                    "startedAt": "2026-10-08T11:00:00Z",
                    "completedAt": f"2026-10-08T11:{minutes:02d}:00Z",
                }
            ]
            return actions.render_session(self.SINCE, self.runner(runs, jobs))

        self.assertTrue(line(10).startswith("- GRÜN"))
        self.assertTrue(line(11).startswith("- GELB"))
        self.assertTrue(line(15).startswith("- GELB"))
        self.assertTrue(line(16).startswith("- ROT"))
        self.assertIn("(gelb > 10, rot > 15)", line(10))

    def test_light_and_missing(self):
        def broken(args):
            raise OSError("kein gh")

        self.assertIn("nicht erfasst", actions.render_session(self.SINCE, broken))
        self.assertIn("nicht erfasst", actions.render_session(None, broken))
        runs = [{"databaseId": 1, "createdAt": "2026-10-08T11:00:00Z"}]
        jobs = [
            {"startedAt": "2026-10-08T11:00:00Z", "completedAt": "2026-10-08T11:11:00Z"}
        ]
        line = actions.render_session(self.SINCE, self.runner(runs, jobs))
        self.assertTrue(line.startswith("- GELB"), line)


if __name__ == "__main__":
    unittest.main()
