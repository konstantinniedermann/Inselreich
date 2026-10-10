import json
import unittest

import budgetwarn


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


if __name__ == "__main__":
    unittest.main()
