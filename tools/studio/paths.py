"""Pfade des Studios: Hauptrepo-Wurzel (auch aus Worktrees) und .studio-Dateien."""

from __future__ import annotations

import json
import os
from datetime import UTC, datetime
from pathlib import Path


def repo_root(start: Path | None = None) -> Path:
    """Wurzel des Hauptrepos; aus einem Worktree über .git-Datei und commondir."""
    here = (start or Path(__file__)).resolve()
    for folder in [here, *here.parents]:
        git = folder / ".git"
        if git.is_dir():
            return folder
        if git.is_file():
            text = git.read_text(encoding="utf-8").strip()
            if not text.startswith("gitdir:"):
                return folder
            gitdir = Path(text.split(":", 1)[1].strip())
            if not gitdir.is_absolute():
                gitdir = (folder / gitdir).resolve()
            common = gitdir / "commondir"
            if common.is_file():
                target = Path(common.read_text(encoding="utf-8").strip())
                if not target.is_absolute():
                    target = (gitdir / target).resolve()
                return target.parent
            return folder
    return here.parent


def studio_home() -> Path:
    override = os.environ.get("STUDIO_HOME")
    return Path(override) if override else repo_root() / ".studio"


def events_file() -> Path:
    return studio_home() / "events.jsonl"


def docs_dir() -> Path:
    override = os.environ.get("STUDIO_DOCS")
    return Path(override) if override else repo_root() / "docs" / "studio"


def archive_dir() -> Path:
    return studio_home() / "archiv"


def agents_dir() -> Path:
    return repo_root() / ".claude" / "agents"


def now_iso() -> str:
    stamp = datetime.now(UTC).isoformat(timespec="milliseconds")
    return stamp.replace("+00:00", "Z")


def append_event(event: dict) -> None:
    """Hängt ein Event als eine JSON-Zeile an (ein write-Aufruf, append-only)."""
    path = events_file()
    path.parent.mkdir(parents=True, exist_ok=True)
    line = json.dumps(event, ensure_ascii=False, separators=(",", ":")) + "\n"
    with open(path, "a", encoding="utf-8") as handle:
        handle.write(line)


if __name__ == "__main__":
    print(studio_home())
