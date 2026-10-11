import json
import unittest
from pathlib import Path

import budgetwarn
import model


def grant(role="lead-tech", phase="P1", sid="s1", kind="budget"):
    return json.dumps(
        {
            "kind": kind,
            "session_id": sid,
            "role": role,
            "budget": {"granted": 5, "parallel": 0, "phase": phase},
        }
    )


def start(prompt, kind="lead-tech"):
    return {"subagent_type": kind, "prompt": prompt}


PROMPT = "Persona: lead-tech\nPaket: P1\nBudget: 4 Starts"


class BudgetCountTest(unittest.TestCase):
    def test_budget_count(self):
        count = budgetwarn.budget_count
        self.assertEqual(count("Budget: 12 Starts, Parallelität 2"), 12)
        self.assertIsNone(count("Budget: keins"))
        self.assertIsNone(count("Budget: keins, keine Agenten starten"))
        self.assertIsNone(count("Budget: 0"))
        self.assertIsNone(count("Persona: x"))
        self.assertIsNone(count("\n" * 15 + "Budget: 3"))
        self.assertEqual(count("**Budget:** 5"), 5)


class GrantsTest(unittest.TestCase):
    def test_grants_filter_session_and_kind(self):
        text = "\n".join(
            [
                grant(),
                grant(sid="other"),
                json.dumps({"kind": "status", "summary": "budget besprochen"}),
                '{"kind": "budget", kaputt',
                grant(role="lead-qa"),
                grant(phase="P2"),
            ]
        )
        found = budgetwarn.grants(text, "s1")
        self.assertEqual(
            [(g["role"], g["budget"]["phase"]) for g in found],
            [("lead-tech", "P1"), ("lead-qa", "P1"), ("lead-tech", "P2")],
        )


class WarningTest(unittest.TestCase):
    def warn(self, prompt=PROMPT, grants=(), kind="lead-tech"):
        return budgetwarn.warning(start(prompt, kind), [json.loads(g) for g in grants])

    def test_warns_without_grant(self):
        text = self.warn(grants=[grant(role="lead-qa")])
        self.assertIn("Budget-Warnung (E-055)", text)
        self.assertIn("lead-tech", text)
        self.assertIn("keine Freigabe", text)
        self.assertIn("--grant 4", text)

    def test_warns_on_phase_mismatch(self):
        text = self.warn(grants=[grant(phase="P0"), grant(phase="P9")])
        self.assertIn("Freigabe für Phase P1 fehlt", text)
        self.assertIn("P0", text)
        self.assertIn("P9", text)

    def test_no_warning_with_matching_grant(self):
        self.assertIsNone(self.warn(grants=[grant(phase="P0"), grant()]))

    def test_phase_case_insensitive(self):
        self.assertIsNone(self.warn(grants=[grant(phase="  p1 ")]))

    def test_no_phase_header_only_rule_a(self):
        prompt = "Persona: lead-tech\nBudget: 4"
        self.assertIsNone(self.warn(prompt, [grant(phase="P0")]))
        self.assertIn("keine Freigabe", self.warn(prompt))

    def test_no_warning_cases(self):
        self.assertIsNone(self.warn("Persona: lead-tech\nBudget: keins"))
        self.assertIsNone(
            self.warn("Persona: tech-ui-engineer\nBudget: 3", kind="tech-ui-engineer")
        )
        self.assertIsNone(self.warn(PROMPT, kind="fork"))
        gp = "Persona: lead-tech\nPaket: P1\nBudget: 4"
        self.assertIsNone(self.warn(gp, [grant()], kind="general-purpose"))
        self.assertIn("keine Freigabe", self.warn(gp, kind="general-purpose"))


class CheckTest(unittest.TestCase):
    """Blockmodus (E-060): Freigabe derselben Rolle, Phase passt zu `Paket:` oder Token."""

    def check(self, prompt, grants=(), kind="lead-tech"):
        return budgetwarn.check(start(prompt, kind), [json.loads(g) for g in grants])

    def test_blocks_without_grant_with_ready_command(self):
        text = self.check("Persona: lead-tech\nPaket: TB-6-umsetzung\nBudget: 7")
        self.assertIn("Budget-Block (E-060)", text)
        self.assertIn(
            "python3 tools/studio/log.py budget --lead lead-tech --grant 7 "
            "--phase TB-6-umsetzung",
            text,
        )

    def test_matching_phase_and_token_allowed(self):
        grants = [grant(phase="TOOL-BUENDEL-6-umsetzung")]
        for package in (
            "TOOL-BUENDEL-6-umsetzung",
            "tool-buendel-6-umsetzung (Instanz 2)",
            "TOOL-BUENDEL-6-umsetzung — Controller",
        ):
            prompt = f"Persona: lead-tech\nPaket: {package}\nBudget: 7"
            self.assertIsNone(self.check(prompt, grants), package)

    def test_other_package_blocks_with_phase_list(self):
        prompt = "Persona: lead-tech\nPaket: TOOL-BUENDEL-7\nBudget: 7"
        text = self.check(prompt, [grant(phase="TOOL-BUENDEL-6-umsetzung")])
        self.assertIn("TOOL-BUENDEL-6-umsetzung", text)
        self.assertIn("--phase TOOL-BUENDEL-7", text)

    def test_grant_of_other_role_blocks(self):
        prompt = "Persona: lead-tech\nPaket: P1\nBudget: 7"
        self.assertIsNotNone(self.check(prompt, [grant(role="lead-qa")]))

    def test_no_block_cases(self):
        self.assertIsNone(self.check("Persona: lead-tech\nBudget: keins"))
        self.assertIsNone(self.check("Persona: lead-tech\nBudget: 0"))
        tech = "Persona: tech-sim-engineer\nBudget: 3"
        self.assertIsNone(self.check(tech, kind="tech-sim-engineer"))
        self.assertIsNone(self.check(PROMPT, kind="fork"))

    def test_no_paket_header_with_role_grant_allowed(self):
        prompt = "Persona: lead-tech\nBudget: 4"
        self.assertIsNone(self.check(prompt, [grant(phase="P0")]))
        self.assertIsNotNone(self.check(prompt))


class NameRuleTest(unittest.TestCase):
    def test_same_names_as_model_grant_names(self):
        for package in (
            "TOOL-BUENDEL-6-umsetzung",
            "P1 (Instanz 2)",
            "REL-19 \u2014 Release",
            "plan-x: Entwurf",
        ):
            ours = {n.casefold() for n in budgetwarn.package_names(package)}
            theirs = {n.casefold() for n in model._grant_names({"package": package})}
            self.assertEqual(ours, theirs, package)


class PrefixRuleTest(unittest.TestCase):
    def check(self, package, phase):
        prompt = f"Persona: lead-tech\nBudget: 4\nPaket: {package}"
        return budgetwarn.check(start(prompt), [json.loads(grant(phase=phase))])

    def test_grant_x_binds_x_suffix_but_not_xy(self):
        self.assertIsNone(self.check("X-T01", "X"))
        self.assertIsNotNone(self.check("XY-T01", "X"))

    def test_warning_follows_prefix_rule(self):
        def warn(package):
            prompt = f"Persona: lead-tech\nBudget: 4\nPaket: {package}"
            return budgetwarn.warning(start(prompt), [json.loads(grant(phase="X"))])

        self.assertIsNone(warn("X-T01"))
        self.assertIsNotNone(warn("XY-T01"))

    def test_exact_grant_is_named_before_prefix(self):
        names = budgetwarn.package_names("X-T01")
        self.assertLess(names.index("X-T01"), names.index("X"))

    def test_uses_the_same_function_as_model(self):
        self.assertIs(budgetwarn.package_names, model.package_names)


FIXTURE = Path(__file__).parent / "fixtures" / "budget_pairs.json"
RULE_FROM = "2026-10-10T15:16:00Z"  # Handbuch 1.45 (Commit e5563696, 17:16 MESZ): `Paket:` gleich Phase


class RealPairsTest(unittest.TestCase):
    def test_pairs_from_handbook_1_45_are_allowed(self):
        pairs = json.loads(FIXTURE.read_text("utf-8"))
        recent = [p for p in pairs if p["ts"] >= RULE_FROM]
        self.assertTrue(recent)
        for pair in recent:
            prompt = f"Persona: {pair['role']}\nPaket: {pair['package']}\nBudget: 1"
            given = [
                {"role": pair["role"], "budget": {"phase": phase}}
                for phase in pair["phases"]
            ]
            result = budgetwarn.check(start(prompt, pair["role"]), given)
            self.assertIsNone(result, pair)


if __name__ == "__main__":
    unittest.main()
