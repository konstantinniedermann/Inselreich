"""CI-Läufe von main als Studio-Events: python3 tools/studio/ci.py.

Ohne gh oder bei jedem Fehler: Exit 0, keine Events.
"""

from __future__ import annotations

import json
import subprocess
import sys

import studio_docs
from paths import append_event, docs_dir, now_iso, studio_home

FIELDS = "databaseId,conclusion,status,createdAt,headSha,workflowName,headBranch"


def gh_runner() -> list[dict]:
    result = subprocess.run(
        ["gh", "run", "list", "--branch", "main", "--limit", "20", "--json", FIELDS],
        capture_output=True,
        text=True,
        timeout=20,
        check=True,
    )
    return json.loads(result.stdout)


def collect(runner, seen: set[str], handbook: str = "") -> list[dict]:
    """Events für abgeschlossene, noch nicht gesehene Läufe; nie eine Ausnahme."""
    try:
        runs = runner()
        events = []
        for run in runs:
            try:
                run_id = str(run["databaseId"])
                if run.get("status") != "completed" or run_id in seen:
                    continue
                events.append(
                    {
                        "ts": now_iso(),
                        "session_id": "ci",
                        "agent_id": "",
                        "handbook_version": handbook,
                        "kind": "ci",
                        "run_id": run_id,
                        "conclusion": run.get("conclusion", ""),
                        "branch": run.get("headBranch", ""),
                        "sha": run.get("headSha", ""),
                        "workflow": run.get("workflowName", ""),
                        "created": run.get("createdAt", ""),
                        "source": "ci",
                    }
                )
            except Exception:
                continue
        return events
    except Exception:
        return []


def main() -> int:
    try:
        seen_file = studio_home() / "ci-seen.json"
        try:
            seen = set(json.loads(seen_file.read_text(encoding="utf-8")))
        except (OSError, ValueError):
            seen = set()
        handbook = studio_docs.read_version(docs_dir() / "STUDIO.md")
        events = collect(gh_runner, seen, handbook)
        for event in events:
            append_event(event)
            seen.add(event["run_id"])
        if events:
            seen_file.parent.mkdir(parents=True, exist_ok=True)
            seen_file.write_text(json.dumps(sorted(seen)), encoding="utf-8")
        print(f"studio-ci: {len(events)} neue Läufe")
    except Exception:
        pass
    return 0


if __name__ == "__main__":
    sys.exit(main())
