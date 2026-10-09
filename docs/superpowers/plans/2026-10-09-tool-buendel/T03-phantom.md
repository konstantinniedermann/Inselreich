# T03 · Phantom-Vorfall „Agent unbekannt ist inaktiv“ ausblenden (TOOL-STUDIO-HYGIENE, Teil 1)

Strang `py` · Worktree `.worktrees/buendel-py` · Branch `tool/buendel-py` · Umsetzer `tech-sim-engineer` (sonnet), **gebündelt mit T05** (ein Start, zwei Commits) · AK-TB14 · Grundlage Retro REL-12 B2 (`docs/studio/retros/2026-10-09-release-rel12-prozess.md`), R417

**Files:**

- Modify: `tools/studio/model.py` (Konstante, `hidden`, `view`)
- Test: `tools/studio/tests/test_model.py` (neue Klasse `PhantomSpawnerTest`)
- Nicht ändern: `tools/studio/effort.py` (bekommt die bereinigten `inactive_keys` unverändert über `model.py`)

**Befund (Planprobe lead-tech, heutiger Stand):** Ein `spawn`-Event mit `agent_id` eines Agenten, der nie ein `agent_start` hatte (Harness-Nebenagent, Prompt „no-op“), legt über `Builder.agent()` einen Knoten mit Rolle `unbekannt` an; `signal()` macht ihn sichtbar, nach 300 s gilt er als inaktiv → Vorfall `inaktiv:s1:P9` bei `now` = 400 s und 1000 s, `counts.inactive` = 1.

**Regel:** Ein Knoten ist **unbestätigt**, wenn `agent_id != "main"`, nie `agent_start` (`_started` falsch) und nie `spawned` (`_confirmed` falsch). Unbestätigte Knoten sind nie `inactive`; nach `PHANTOM_AFTER = 600.0` s seit `started` sind sie ausgeblendet (`hidden`). Fehlerrichtung: Ein echter Agent, dessen `SubagentStart`-Hook verloren ging, meldet bis zu seinem `spawned` keinen Inaktiv-Vorfall (selten, Hook-Timeout 5 s) — bewusst in Kauf genommen.

**Interfaces:**

- Produces: `model.PHANTOM_AFTER: float = 600.0`; `Builder.unconfirmed(node) -> bool` (staticmethod).
- Consumes: bestehende Felder `_started`, `_confirmed`, `started`, `self.now`.

## Schritt 1 · Tests zuerst (rot)

In `tools/studio/tests/test_model.py` nach `PhantomBindTest` (Helfer `ev`, `spawn`, `start`, `build`, `flat` existieren dort):

```python
class PhantomSpawnerTest(unittest.TestCase):
    """Spawn eines Agenten ohne agent_start (Harness-Nebenagent, Retro REL-12 B2)."""

    def events(self):
        return [
            ev("turn_end", 0, status="idle"),
            spawn(1, "P9", "general-purpose", description="Updating handoff", prompt_head="no-op"),
        ]

    def test_spawner_without_start_never_inactive(self):
        state = build(self.events(), now=400)
        self.assertNotIn("inaktiv:s1:P9", [i["id"] for i in state["incidents"]])
        self.assertEqual(state["counts"]["inactive"], 0)

    def test_spawner_visible_within_grace(self):
        self.assertIn("s1:P9", flat(build(self.events(), now=300)))

    def test_spawner_hidden_after_grace(self):
        state = build(self.events(), now=1 + model.PHANTOM_AFTER + 1)
        self.assertNotIn("s1:P9", flat(state))
        self.assertNotIn("inaktiv:s1:P9", [i["id"] for i in state["incidents"]])

    def test_confirmed_child_without_start_stays_visible(self):
        events = [
            ev("turn_end", 0, status="idle"),
            spawn(1, "main", "lead-qa", tool_use_id="t1"),
            ev("spawned", 50, child_id="C1", tool_use_id="t1", status="completed"),
        ]
        self.assertIn("s1:C1", flat(build(events, now=2000)))

    def test_started_agent_is_not_unconfirmed(self):
        events = [
            ev("turn_end", 0, status="idle"),
            spawn(1, "main", "lead-design"),
            start(2, "L1", "lead-design"),
        ]
        state = build(events, now=2000)
        self.assertIn("s1:L1", flat(state))
        self.assertIn("inaktiv:s1:L1", [i["id"] for i in state["incidents"]])
```

Prüfe vor dem Lauf, wie `ev()` Zusatzfelder übernimmt (`**kw`) und ob das `spawned`-Event `child_id` und `tool_use_id` so erwartet (`Builder.on_spawned`). Der Bestandstest `PhantomBindTest.test_real_lead_silent_is_still_inactive` muss grün bleiben.

Lauf: `python3 -m unittest discover -s tools/studio/tests -t tools/studio -p 'test_model.py' -k Phantom; echo EXIT=$?` → rot (`AttributeError: PHANTOM_AFTER`, danach Vorfall vorhanden). Rote Ausgabe in den Bericht.

## Schritt 2 · Umsetzung in `tools/studio/model.py`

Konstante bei `INACTIVE_DEFAULT`:

```python
INACTIVE_DEFAULT = 300.0
PHANTOM_AFTER = 600.0  # Knoten ohne agent_start und ohne spawned: danach ausgeblendet (REL-12 B2)
```

In der Klasse `_Builder` (neben `hidden`; Planprobe per Monkeypatch: Phantom bei 300/400 s sichtbar ohne Vorfall, ab 1000 s ausgeblendet; bestätigter und gestarteter Agent unverändert):

```python
    @staticmethod
    def unconfirmed(node: dict) -> bool:
        """Nie gestartet und nie bestätigt: z. B. Spawn eines Harness-Nebenagenten."""
        return (
            node["agent_id"] != "main"
            and not node["_started"]
            and not node["_confirmed"]
        )

    def hidden(self, key: str) -> bool:
        """stop-only-Knoten (P31) und unbestätigte Knoten nach PHANTOM_AFTER."""
        node = self.nodes[key]
        if node["agent_id"] != "main" and not node["_signal"]:
            return True
        return self.unconfirmed(node) and self.now - node["started"] > PHANTOM_AFTER
```

In `view()`:

```python
        inactive = (
            status in LIVE
            and not live_children
            and quiet > inactive_after
            and not self.unconfirmed(node)
        )
```

Prüfe, dass `self.now` gesetzt ist, bevor `hidden()` zum ersten Mal läuft (Konstruktor, Zeile mit `self.now = now`); sonst `hidden()` nur in `result()` mit `now` aufrufen. `inactive_keys` in `result()` filtert ausgeblendete Knoten mit: `[k for k, v in views.items() if v["inactive"] and not self.hidden(k)]`.

## Schritt 3 · Grün und Prüfungen

```bash
python3 -m unittest discover -s tools/studio/tests -t tools/studio -p 'test_model.py'; echo EXIT=$?
make studio-test; echo EXIT=$?
make studio-lint; echo EXIT=$?
```

**Echtlauf** (R375): `python3 tools/studio/metrics.py --session latest` darf nicht abstürzen (Exit 0) — kein Commit der erzeugten Datei, Ausgabepfad im Bericht nennen und die Datei mit `git restore`/`rm` verwerfen, falls sie im Worktree entsteht.

```bash
git add tools/studio/model.py tools/studio/tests/test_model.py
git commit -m "fix: Phantom-Knoten ohne agent_start melden keinen Inaktiv-Vorfall (TOOL-STUDIO-HYGIENE)"
```

`make check` einmal am Ende des Bündels T03 + T05 (siehe T05).

DoD: AK-TB14 belegt; Rot-Beleg je neuem Testfall; Bestandstests grün.
