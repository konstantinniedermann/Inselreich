import tempfile
import unittest
from datetime import UTC, datetime, timedelta
from pathlib import Path

import efficiency

from tests.test_efficiency import agent, assistant, prompt, write

BEFORE = datetime(2026, 10, 3, 12, 0, tzinfo=UTC)
AFTER = datetime(2026, 10, 5, 12, 0, tzinfo=UTC)
OPUS, SONNET = "claude-opus-4", "claude-sonnet-5"
FRONTMATTER = {"tech-sim-engineer": "sonnet", "studio-coach": "opus", "x": "inherit"}


def at(when, entry):
    return {**entry, "timestamp": when.isoformat().replace("+00:00", "Z")}


def start(root, name, persona, model, when):
    agent(
        root,
        "s1",
        name,
        {"agentType": "general-purpose"},
        [
            at(when, prompt(f"Persona: {persona}\nPaket: P")),
            at(when + timedelta(seconds=1), assistant(name, model, out=10)),
        ],
    )


class PersonaSplitTest(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.root = Path(tmp.name)
        write(self.root / "s1.jsonl", [assistant("m1", OPUS, out=1)])
        start(self.root, "a1", "tech-sim-engineer", OPUS, AFTER)  # abweichend, ab Guard
        start(self.root, "a2", "tech-sim-engineer", OPUS, BEFORE)  # abweichend, vor
        start(self.root, "a3", "studio-coach", OPUS, AFTER)  # zulässig
        start(self.root, "a4", "tech-sim-engineer", SONNET, BEFORE)  # zulässig
        start(self.root, "a5", "x", OPUS, AFTER)  # inherit: nicht abweichend
        start(self.root, "a6", "unbekannt", OPUS, AFTER)  # ohne Frontmatter
        self.data = efficiency.compute([self.root / "s1.jsonl"], FRONTMATTER)

    def test_split_four_numbers(self):
        self.assertEqual(
            self.data["persona_split"],
            {
                "vor_guard": {"abweichend": 1, "zulaessig": 1},
                "ab_guard": {"abweichend": 1, "zulaessig": 3},
            },
        )

    def test_light_counts_only_deviations_since_guard(self):
        self.assertEqual(self.data["persona_opus"], 1)

    def test_without_frontmatter_nothing_deviates(self):
        data = efficiency.compute([self.root / "s1.jsonl"])
        self.assertEqual(data["persona_opus"], 0)

    def test_render_shows_split(self):
        text = efficiency.render_section(self.data)
        self.assertIn("vor Guard", text)
        self.assertIn("ab Guard", text)
