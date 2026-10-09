import unittest

import modelguard
from paths import repo_root

STUDIO = repo_root() / "docs" / "studio" / "STUDIO.md"
TABLE = modelguard.model_table(STUDIO.read_text("utf-8"))
PERSONAS = {
    "lead-qa": {"model": "sonnet"},
    "qa-code-reviewer": {"model": "sonnet"},
    "lead-design": {"model": "opus"},
    "studio-coach": {"model": "opus"},
    "tool-x": {"model": "inherit"},
}


def call(kind, prompt="", model=None):
    data = {"subagent_type": kind, "prompt": prompt}
    if model:
        data["model"] = model
    return modelguard.reason(data, PERSONAS, TABLE)


class TableTest(unittest.TestCase):
    def test_real_table_is_parsed(self):
        self.assertEqual([alias for alias, _ in TABLE], ["opus", "sonnet", "haiku"])
        opus = dict(TABLE)["opus"]
        self.assertIn("Tech-Lead beim Plan", opus)
        self.assertIn("Final-Review", opus)
        self.assertIn(
            "lead-qa-Gate-Urteile", dict(TABLE)["sonnet"]
        )  # Backticks entfernt
        haiku = dict(TABLE)["haiku"]  # Kommas in Klammern trennen nicht
        self.assertEqual(
            haiku, ["mechanische Prüfungen (Formatierung, Links, Listen abgleichen)"]
        )

    def test_missing_section_is_empty_and_allows(self):
        self.assertEqual(modelguard.model_table("# x\n| a | `opus` | b |\n"), [])
        data = {"subagent_type": "lead-qa", "model": "opus", "prompt": ""}
        self.assertIsNone(modelguard.reason(data, PERSONAS, []))


class ReasonTest(unittest.TestCase):
    def test_typed_start_over_frontmatter_is_denied(self):
        found = call("lead-qa", "Persona: lead-qa\nPaket: X", "opus")
        self.assertIn("über der Modelltabelle", found)
        self.assertIn("Modell: opus (<Einsatz>)", found)
        self.assertIn("Final-Review", found)

    def test_table_exception_in_header_allows(self):
        prompt = "Persona: lead-qa\nModell: opus (Final-Review über die Branch)"
        self.assertIsNone(call("lead-qa", prompt, "opus"))

    def test_bold_header_and_prefix_match(self):
        prompt = "- **Persona:** lead-qa\n- **Modell:** OPUS (final-review, Branch x)"
        self.assertIsNone(call("lead-qa", prompt, "opus"))

    def test_wrong_einsatz_or_alias_is_denied(self):
        self.assertIsNotNone(call("lead-qa", "Modell: opus (Gate-Urteil)", "opus"))
        self.assertIsNotNone(call("lead-qa", "Modell: sonnet (Final-Review)", "opus"))
        self.assertIsNotNone(call("lead-qa", "Modell: opus", "opus"))

    def test_unknown_alias_is_allowed_with_note(self):
        self.assertIsNone(call("lead-design", "", "fable"))
        data = {"subagent_type": "lead-design", "model": "fable"}
        self.assertIn(
            "nicht in der Modelltabelle", modelguard.unknown_alias(data, TABLE)
        )
        self.assertIsNone(modelguard.unknown_alias({"model": "opus"}, TABLE))

    def test_no_check_cases(self):
        self.assertIsNone(call("lead-design"))  # Frontmatter opus, kein model
        self.assertIsNone(call("lead-qa"))
        self.assertIsNone(call("studio-coach", "", "sonnet"))  # schwächer
        self.assertIsNone(call("tool-x", "", "opus"))  # inherit
        self.assertIsNone(call("Explore", "", "opus"))
        self.assertIsNone(call("fork", "Persona: lead-qa", "opus"))
        self.assertIsNone(call("general-purpose", "Suche etwas", "opus"))

    def test_general_purpose_with_persona_uses_frontmatter(self):
        self.assertIsNotNone(call("general-purpose", "Persona: lead-qa", "opus"))
        self.assertIsNone(
            call("general-purpose", "Persona: tech-save-engineer", "opus")
        )
