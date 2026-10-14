"""Daten der Dashboard-Karte «Versionen und Releases» (docs/studio/releases.json).

Liest die Datei, leitet den kritischen Pfad ab und ermittelt den Live-Stand
(git, CI). Jede Funktion fängt Fehler ab: die Karte darf den Server nie kippen.
"""

from __future__ import annotations

import json
import subprocess
from pathlib import Path

from model import LIVE

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
        data["goal_warnings"] = normalize_goals(data)
        data["chain"] = chain(data)
    except Exception as error:  # noqa: BLE001 — kaputte Struktur kippt die Karte nicht
        return None, f"{RELEASES_FILE}: Struktur ungültig ({type(error).__name__})"
    return data, ""


def _dict_items(data: dict) -> list[dict]:
    """Wie ``all_items``, aber überspringt Einträge, die kein dict sind."""
    try:
        return [i for i in all_items(data) if isinstance(i, dict)]
    except (AttributeError, TypeError):
        return []


def goal_stage(item: dict) -> int | None:
    """Tagesziel-Stufe 1..5 als ganze Zahl; alles andere (auch bool) ist ungültig."""
    value = item.get("goalStage") if isinstance(item, dict) else None
    if isinstance(value, int) and not isinstance(value, bool) and 1 <= value <= 5:
        return value
    return None


def normalize_goals(data: dict) -> list[str]:
    """Entfernt ungültige ``goalStage``; Warntexte nur bei vorhandenem, falschem Wert."""
    warnings: list[str] = []
    for entry in _dict_items(data):
        if "goalStage" not in entry or goal_stage(entry) is not None:
            continue
        warnings.append(
            f"{entry.get('pkg', '?')}: goalStage ungültig ({entry['goalStage']!r}) ignoriert"
        )
        del entry["goalStage"]
    return warnings


def in_session(pkg: str, session_pkgs: list[str]) -> bool:
    """Wie ``inSession`` in releases.js: Session-Paket gleich ``<item>`` oder ``<item>-…``."""
    item = base(pkg).lower()
    return any(
        s.lower() == item or s.lower().startswith(item + "-")
        for s in map(str, session_pkgs)
    )


def clamp_stage(value: object) -> int:
    """Wie ``clampStage`` in releases.js: runden, 1..5, sonst 1."""
    try:
        number = float(value)  # type: ignore[arg-type]
        return min(5, max(1, int(number + 0.5)))
    except (TypeError, ValueError, OverflowError):
        return 1


def goal_reached(entry: dict, goal: int) -> bool:
    """Wie ``goalDone`` in releases.js: Zielstufe abgeschlossen (R656).

    Erreicht, wenn ``stage > goal`` oder ``stage == goal`` mit ``state == 'done'``;
    ``stage`` ist ``max(startStage, stage)``.
    """
    stage = max(clamp_stage(entry.get("startStage")), clamp_stage(entry.get("stage")))
    return stage > goal or (stage == goal and entry.get("state") == "done")


def goal_progress(data: dict | None, session_pkgs: list[str]) -> dict:
    """Tagesziel: Pakete der Session mit gültigem ``goalStage``; erreicht laut ``goal_reached``."""
    pkgs: list[str] = []
    reached = 0
    for entry in _dict_items(data) if data else []:
        goal = goal_stage(entry)
        pkg = str(entry.get("pkg", ""))
        if goal is None or not in_session(pkg, session_pkgs):
            continue
        pkgs.append(pkg)
        if goal_reached(entry, goal):
            reached += 1
    return {"total": len(pkgs), "reached": reached, "pkgs": pkgs}


PACKAGE_LIVE = frozenset({"active", "review", "blocked"})


def registered_packages(events: list[dict], session: str | None) -> dict[str, dict]:
    """Per ``log.py package`` angemeldete Pakete der Session mit Live-Status.

    Das letzte Paket-Ereignis je Paket entscheidet; ``session`` ist die Session-ID,
    ``"all"`` nimmt alle, ``None`` keine.
    """
    last: dict[str, dict] = {}
    for event in events or []:
        if event.get("kind") != "package":
            continue
        if session != "all" and event.get("session_id") != session:
            continue
        pkg = str(event.get("package_id") or event.get("package") or "")
        if pkg and session:
            last[pkg] = event
    return {
        pkg: {"owner": str(e.get("owner") or ""), "status": e.get("status")}
        for pkg, e in last.items()
        if e.get("status") in PACKAGE_LIVE
    }


def session_packages(tree: list[dict], registered: dict | None = None) -> list[str]:
    """Paket-IDs der gewählten Session: Baum-Knoten plus angemeldete Pakete (S-Kennzeichen)."""
    found: set[str] = set(registered or {})
    stack = list(tree or [])
    while stack:
        node = stack.pop()
        if node.get("package"):
            found.add(str(node["package"]))
        stack.extend(node.get("children") or [])
    return sorted(found)


def _nodes_by_package(tree: list[dict]) -> dict[str, list[dict]]:
    """Knoten je Paket, oberster zuerst (Tiefe, dann Baumreihenfolge)."""
    groups: dict[str, list[dict]] = {}
    level = [n for n in tree or [] if isinstance(n, dict)]
    while level:
        for node in level:
            if node.get("package"):
                groups.setdefault(str(node["package"]), []).append(node)
        level = [c for n in level for c in n.get("children") or []]
    return groups


def working_now(tree: list[dict], registered: dict | None = None) -> list[dict]:
    """«Jetzt in Arbeit»: Pakete mit lebendem Knoten oder aktiver Anmeldung."""
    result: dict[str, dict] = {}
    for pkg, nodes in _nodes_by_package(tree).items():
        live = [n for n in nodes if n.get("status") in LIVE]
        if not live:
            continue
        owner = nodes[0]
        agents: list[dict] = []
        for n in live:
            if n is owner:
                continue
            entry = {"role": n.get("role", ""), "status": n["status"]}
            if entry not in agents:
                agents.append(entry)
        result[pkg] = {
            "package": pkg,
            "owner": owner.get("role", ""),
            "agents": agents,
            "status": live[0]["status"],
        }
    for pkg, info in (registered or {}).items():
        result.setdefault(
            pkg,
            {
                "package": pkg,
                "owner": info.get("owner", ""),
                "agents": [],
                "status": info.get("status", ""),
            },
        )
    return [result[pkg] for pkg in sorted(result)]


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
