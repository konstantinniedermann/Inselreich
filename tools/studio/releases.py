"""Daten der Dashboard-Karte «Versionen und Releases» (docs/studio/releases.json).

Liest die Datei, leitet den kritischen Pfad ab und ermittelt den Live-Stand
(git, CI). Jede Funktion fängt Fehler ab: die Karte darf den Server nie kippen.
"""

from __future__ import annotations

import json
import subprocess
from pathlib import Path

RELEASES_FILE = "releases.json"
GIT_TIMEOUT = 5


def base(target: str) -> str:
    """«HANDEL-2:merge» -> «HANDEL-2»."""
    return target.split(":", 1)[0]


def all_items(data: dict) -> list[dict]:
    items = [i for r in data.get("releases", []) for i in r.get("items", [])]
    return items + list(data.get("pool", []))


def find_item(items: list[dict], target: str) -> dict | None:
    """Knoten-ID -> Paket: erst exakt, dann ohne Zusatz nach dem Doppelpunkt."""
    for key in (target, base(target)):
        for item in items:
            if item.get("pkg") == key:
                return item
    return None


def chain(data: dict) -> list[dict]:
    """Kritischer Pfad: längste Kette harter ``waitsFor`` als Schrittliste.

    Schritt: ``{"label", "ref", "hard"}``; ``ref`` ist die Paket-ID zum
    Hervorheben. Weiche Kopplungen hängen als Schritte mit ``hard: False`` an.
    """
    items = all_items(data)
    hard: dict[str, list[dict]] = {}
    for item in items:
        wait = item.get("waitsFor")
        if isinstance(wait, dict) and wait.get("hard") and wait.get("target"):
            owner = find_item(items, wait["target"])
            key = owner["pkg"] if owner else base(wait["target"])
            hard.setdefault(key, []).append(item)

    def longest(owner: str, seen: frozenset) -> list[dict]:
        best: list[dict] = []
        for dep in hard.get(owner, []):
            if dep["pkg"] in seen:
                continue
            wait = dep["waitsFor"]
            tail = [
                {
                    "label": wait.get("label", wait["target"]),
                    "ref": owner,
                    "hard": True,
                },
                {
                    "label": dep.get("chainLabel") or dep.get("name", dep["pkg"]),
                    "ref": dep["pkg"],
                    "hard": True,
                },
            ] + longest(dep["pkg"], seen | {dep["pkg"]})
            if len(tail) > len(best):
                best = tail
        return best

    roots = [
        owner
        for owner in hard
        if not (
            (it := find_item(items, owner))
            and isinstance(it.get("waitsFor"), dict)
            and it["waitsFor"].get("hard")
        )
    ]
    path: list[dict] = []
    for root in roots:
        candidate = longest(root, frozenset({root}))
        if len(candidate) > len(path):
            path = candidate
    soft = [
        {"label": i["waitsFor"].get("label", ""), "ref": i["pkg"], "hard": False}
        for i in items
        if isinstance(i.get("waitsFor"), dict) and not i["waitsFor"].get("hard")
    ]
    return path + soft


def load(path: Path) -> tuple[dict | None, str]:
    """(Daten, Fehlerhinweis); fehlt die Datei oder ist sie kaputt: (None, Hinweis)."""
    try:
        data = json.loads(Path(path).read_text(encoding="utf-8"))
    except FileNotFoundError:
        return None, f"{RELEASES_FILE} fehlt"
    except (OSError, ValueError) as error:
        return None, f"{RELEASES_FILE} nicht lesbar: {error}"
    if not isinstance(data, dict) or not isinstance(data.get("releases"), list):
        return None, f"{RELEASES_FILE}: Feld «releases» (Liste) fehlt"
    try:
        data["chain"] = chain(data)
    except Exception as error:  # noqa: BLE001 — kaputte Struktur kippt die Karte nicht
        return None, f"{RELEASES_FILE}: Struktur ungültig ({type(error).__name__})"
    return data, ""


def session_packages(tree: list[dict]) -> list[str]:
    """Paket-IDs aller Knoten der gewählten Session (für das S-Kennzeichen)."""
    found: set[str] = set()
    stack = list(tree or [])
    while stack:
        node = stack.pop()
        if node.get("package"):
            found.add(str(node["package"]))
        stack.extend(node.get("children") or [])
    return sorted(found)


def _git(root: Path, *args: str) -> str | None:
    try:
        out = subprocess.run(
            ["git", *args],
            cwd=root,
            capture_output=True,
            text=True,
            timeout=GIT_TIMEOUT,
            check=True,
        )
    except (OSError, subprocess.SubprocessError):
        return None
    return out.stdout.strip() or None


def ci_status(events: list[dict]) -> dict:
    """Jüngster CI- und Pages-Lauf auf main aus den ci-Events."""
    latest: dict[str, dict] = {}
    for event in events:
        if event.get("kind") != "ci" or event.get("branch") != "main":
            continue
        name = str(event.get("workflow") or "").lower()
        if name not in ("ci", "pages"):
            continue
        known = latest.get(name)
        if known is None or str(event.get("created", "")) >= str(
            known.get("created", "")
        ):
            latest[name] = event
    return {
        name: {"conclusion": e.get("conclusion", ""), "sha": str(e.get("sha", ""))[:8]}
        for name, e in latest.items()
    }


def live_state(root: Path, events: list[dict]) -> dict:
    origin = _git(root, "rev-parse", "origin/main")
    local = _git(root, "rev-parse", "main")
    ahead = _git(root, "rev-list", "--count", "origin/main..main")
    return {
        "origin": origin[:8] if origin else None,
        "local": local[:8] if local else None,
        "ahead": int(ahead) if ahead and ahead.isdigit() else None,
        **ci_status(events),
    }
