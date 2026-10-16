# T02a · Modell-Guard: Regel und Tabellen-Parser (TOOL-MODELL-GUARD)

Strang `guard` · Worktree `.worktrees/buendel-guard` · Branch `tool/buendel-guard` · Umsetzer `tech-sim-engineer` (sonnet) · AK-TB08–TB11 · Grundlage E-038, R420 V1

**Files:**

- Create: `tools/studio/modelguard.py`, `tools/studio/tests/test_modelguard.py`
- Danach: [T02b](T02b-hook-eintrag.md) im selben Start (`main()`, Hook-Eintrag, Echtlauf)
- Nie ändern: `tools/studio/guard.py` (Verfassung §1.3), `docs/studio/STUDIO.md`

**Regel:** Basis = `model` im Persona-Frontmatter. Will der Aufruf ein stärkeres Modell (Rang = Zeilenreihenfolge der Tabelle `## Modellwahl` in `STUDIO.md`, oben = stark), braucht der Prompt die Kopfzeile `Modell: <alias> (<Einsatz>)`, deren Klammertext mit einem Einsatz aus der Tabellenzeile dieses Alias beginnt (ohne Backticks, Gross-/Kleinschreibung egal). Modell ausserhalb der Tabelle (unbekannter Alias) → **zulassen**, aber `unknown_alias` liefert einen Hinweis fürs Event (T02b). Keine Prüfung: Typ ohne Persona-Datei, `fork`, Frontmatter `inherit`, gleiches oder schwächeres Modell, leere Tabelle.

**Interfaces:**

- Produces: `modelguard.model_table(text: str) -> list[tuple[str, list[str]]]`, `modelguard.reason(tool_input: Mapping, personas: Mapping[str, Mapping], table) -> str | None`, `modelguard.MODE` (Start `"warn"`, R428; `"deny"` später), `modelguard.unknown_alias(tool_input, table) -> str | None`, Event `{"kind": "model_guard", "source": "hook", "mode", "persona", "model", "summary"}`.
- Consumes: `studio_docs.persona_meta`, `studio_docs.read_text`, `paths.agents_dir`, `paths.docs_dir` (`STUDIO_DOCS`), `paths.append_event` (`STUDIO_HOME`).

## Schritt 1 · Tests zuerst (rot)

`tools/studio/tests/test_modelguard.py`:

```python
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
        self.assertIn("lead-qa-Gate-Urteile", dict(TABLE)["sonnet"])  # Backticks entfernt
        haiku = dict(TABLE)["haiku"]  # Kommas in Klammern trennen nicht
        self.assertEqual(haiku, ["mechanische Prüfungen (Formatierung, Links, Listen abgleichen)"])

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
        self.assertIn("nicht in der Modelltabelle", modelguard.unknown_alias(data, TABLE))
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
        self.assertIsNone(call("general-purpose", "Persona: tech-save-engineer", "opus"))


```

Lauf: `python3 -m unittest discover -s tools/studio/tests -t tools/studio -p 'test_modelguard.py'; echo EXIT=$?` → rot (`ModuleNotFoundError`). Rote Ausgabe in den Bericht.

## Schritt 2 · `tools/studio/modelguard.py`

```python
"""PreToolUse-Hook: Persona-Starts gegen die Modelltabelle (E-038, R420 V1).

Basis ist das Persona-Frontmatter; Ausnahmen stehen nur in der Tabelle «Modellwahl» in
docs/studio/STUDIO.md. Ein stärkeres Modell braucht die Kopfzeile `Modell: <alias> (<Einsatz>)`.
Eigenes Modul statt guard.py: guard.py ist verfassungsgeschützt (§1.3), diese Regel ist Handbuch.
Fehler lassen zu.
"""

from __future__ import annotations

import re
from collections.abc import Mapping  # T02b ergänzt contextlib, json, sys

MODE = "warn"  # Startzustand (R428 E2): nur Event; "deny" setzt TOOL-AKTIVIERUNG
AGENT_TOOLS = ("Agent", "Task")
SKIP_TYPES = {"fork"}
SECTION = "## Modellwahl"
ROW = re.compile(r"^\|[^|]+\|\s*`?([a-z]+)`?\s*\|(.+)\|\s*$")
PAREN = re.compile(r"\(([^)]*)\)")
COMMA = re.compile(r",\s*(?![^()]*\))")  # Komma ausserhalb von Klammern
HEADER_LINES = 15
SUFFIX = " (E-038, R420; STUDIO.md Modellwahl)"


def _norm(text: str) -> str:
    return " ".join(text.replace("`", "").split()).casefold()


def model_table(text: str) -> list[tuple[str, list[str]]]:
    """[(Alias, [Einsatz, …])] von stark nach klein; leer ohne Abschnitt."""
    rows: list[tuple[str, list[str]]] = []
    inside = False
    for line in text.splitlines():
        if line.startswith("## "):
            inside = line.strip() == SECTION
            continue
        match = ROW.match(line.strip()) if inside else None
        if match:
            parts = COMMA.split(match.group(2))
            uses = [" ".join(p.replace("`", "").split()) for p in parts]
            rows.append((match.group(1), [u for u in uses if u]))
    return rows


def _header(prompt: str, key: str) -> str:
    """Wert der Kopfzeile `key` in den ersten Zeilen (wie hook.header_text, ohne Import)."""
    for raw in prompt.splitlines()[:HEADER_LINES]:
        line = raw.strip().lstrip("-*#> ").replace("**", "").strip()
        name, sep, value = line.partition(":")
        if sep and name.strip().casefold() == key.casefold():
            return value.strip().strip("`").strip()
    return ""


def reason(tool_input: Mapping, personas: Mapping[str, Mapping], table) -> str | None:
    kind = str(tool_input.get("subagent_type") or "general-purpose")
    prompt = str(tool_input.get("prompt") or "")
    if kind in SKIP_TYPES or not table:
        return None
    persona = kind
    if kind == "general-purpose":
        persona = (_header(prompt, "Persona").split() or [""])[0]
    if persona not in personas:
        return None
    ranks = {alias: index for index, (alias, _) in enumerate(table)}
    base = str(personas[persona].get("model") or "inherit")
    wanted = str(tool_input.get("model") or base)
    if base not in ranks:
        return None
    if wanted not in ranks:
        return None  # unbekannter Alias: zulassen, Hinweis über unknown_alias()
    if ranks[wanted] >= ranks[base]:
        return None
    uses = dict(table)[wanted]
    line = _header(prompt, "Modell")
    paren = PAREN.search(line)
    if _norm(line).split()[:1] == [wanted] and paren:
        given = _norm(paren.group(1))
        if any(given.startswith(_norm(use)) for use in uses):
            return None
    return (
        f"Start über der Modelltabelle: {persona} hat `{base}`, der Aufruf will `{wanted}`. "
        f"Nur mit Kopfzeile `Modell: {wanted} (<Einsatz>)`, Einsatz aus: {', '.join(uses)}; "
        "sonst `model` weglassen" + SUFFIX
    )


def unknown_alias(tool_input: Mapping, table) -> str | None:
    alias = str(tool_input.get("model") or "")
    if alias and table and alias not in {a for a, _ in table}:
        return f"Modell `{alias}` nicht in der Modelltabelle" + SUFFIX
    return None


# main() und der Einstiegspunkt folgen in T02b.
```

Löse die Persona-Erkennung als `_persona(tool_input) -> str` aus `reason` heraus (T02b nutzt sie fürs Event). `make studio-lint` formatiert die Literale.

## Schritt 3 · Grün und Commit

```bash
python3 -m unittest discover -s tools/studio/tests -t tools/studio -p 'test_modelguard.py'; echo EXIT=$?
make studio-lint; echo EXIT=$?
git add tools/studio/modelguard.py tools/studio/tests/test_modelguard.py
git commit -m "feat: Modellregel und Tabellen-Parser für Persona-Starts (E-038)"
```

Weiter mit T02b.
