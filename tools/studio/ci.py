"""CI-Läufe von main als Studio-Events: python3 tools/studio/ci.py.

Ohne gh oder bei jedem Fehler: Exit 0, keine Events.
"""

from __future__ import annotations

import json
import subprocess
import sys

import studio_docs
from paths import append_event, docs_dir, now_iso, studio_home

FIELDS = (
    "databaseId,conclusion,status,createdAt,headSha,workflowName,headBranch,attempt"
)


def gh_runner() -> list[dict]:
    result = subprocess.run(
        ["gh", "run", "list", "--branch", "main", "--limit", "20", "--json", FIELDS],
        capture_output=True,
        text=True,
        timeout=20,
        check=True,
    )
    return json.loads(result.stdout)


def seen_key(run_id: str, attempt: int) -> str:
    return f"{run_id}:{attempt}"


def normalize_seen(raw) -> set[str]:
    """Alte Einträge (reine run_id) gelten als Versuch 1 gesehen."""
    return {str(k) if ":" in str(k) else seen_key(str(k), 1) for k in raw}


def _attempt(run: dict) -> int:
    try:
        return max(1, int(run.get("attempt") or 1))
    except (TypeError, ValueError):
        return 1


def collect(runner, seen: set[str], handbook: str = "") -> list[dict]:
    """Events für abgeschlossene, noch nicht gesehene Läufe; nie eine Ausnahme."""
    try:
        runs = runner()
        events = []
        for run in runs:
            try:
                run_id = str(run["databaseId"])
                attempt = _attempt(run)
                if run.get("status") != "completed" or (
                    seen_key(run_id, attempt) in seen
                    or (attempt == 1 and run_id in seen)
                ):
                    continue
                events.append(
                    {
                        "ts": now_iso(),
                        "session_id": "ci",
                        "agent_id": "",
                        "handbook_version": handbook,
                        "kind": "ci",
                        "run_id": run_id,
                        "attempt": attempt,
                        "conclusion": run.get("conclusion", ""),
                        "branch": run.get("headBranch", ""),
                        "sha": run.get("headSha", ""),
                        "workflow": run.get("workflowName", ""),
                        "created": run.get("createdAt", ""),
                        "source": "ci",
                    }
                )
            except Exception:  # noqa: BLE001, S112 — ein kaputter Lauf kippt nicht alle
                continue
        return events
    except Exception:  # noqa: BLE001 — ohne gh oder bei jedem Fehler: keine Events
        return []


def main() -> int:
    try:
        seen_file = studio_home() / "ci-seen.json"
        try:
            seen = normalize_seen(json.loads(seen_file.read_text(encoding="utf-8")))
        except (OSError, ValueError):
            seen = set()
        handbook = studio_docs.read_version(docs_dir() / "STUDIO.md")
        events = collect(gh_runner, seen, handbook)
        for event in events:
            append_event(event)
            seen.add(seen_key(event["run_id"], event["attempt"]))
        if events:
            seen_file.parent.mkdir(parents=True, exist_ok=True)
            seen_file.write_text(json.dumps(sorted(seen)), encoding="utf-8")
        print(f"studio-ci: {len(events)} neue Läufe")
    except Exception:  # noqa: BLE001, S110 — Messung darf nie stören, Exit 0
        pass
    return 0


if __name__ == "__main__":
    sys.exit(main())
