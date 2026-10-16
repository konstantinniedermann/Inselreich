"""Altlasten aus `.studio/` entfernen (R682): Bilder erledigter Pakete, Reste archivierter Worktrees.

Standard ist der Trockenlauf (Liste plus Summe in MB); ``--apply`` löscht wirklich.
Gelöscht werden nur Bilddateien (png, jpg, jpeg, webp, gif). ``*.md``, ``*.json``, ``*.txt``
und alles andere bleibt immer. Es wird nie ausserhalb von ``<Repo>/.studio`` gelöscht (Verfassung §6.4).
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
import time
from collections.abc import Callable
from dataclasses import dataclass, field
from pathlib import Path

IMAGE_SUFFIXES = {".png", ".jpg", ".jpeg", ".webp", ".gif"}
MIN_AGE_DAYS = 14
MB = 1024 * 1024


@dataclass
class Rules:
    """Aus releases.json abgeleitet: was gilt als erledigt (live), was ist noch offen."""

    live_pkgs: set[str] = field(default_factory=set)
    open_pkgs: set[str] = field(default_factory=set)
    live_rel: set[int] = field(default_factory=set)
    open_rel: set[int] = field(default_factory=set)
    live_ms: set[int] = field(default_factory=set)


@dataclass
class Plan:
    delete: list[Path] = field(default_factory=list)  # Einzeldateien
    delete_dirs: list[Path] = field(default_factory=list)  # ganze Ordner (Worktrees)
    keep: list[tuple[str, str]] = field(default_factory=list)  # (Name, Grund)
    size: int = 0


def _norm(text: str) -> str:
    return re.sub(r"[^a-z0-9]", "", text.lower())


def load_rules(releases_json: Path) -> Rules:
    data = json.loads(releases_json.read_text(encoding="utf-8"))
    rules = Rules()
    for rel in data.get("releases", []):
        live = rel.get("status") == "live"
        match = re.fullmatch(r"REL-0*(\d+)", str(rel.get("id", "")), re.IGNORECASE)
        if match:
            (rules.live_rel if live else rules.open_rel).add(int(match.group(1)))
        for item in rel.get("items", []):
            pkg = _norm(str(item.get("pkg", "")))
            if pkg:
                (rules.live_pkgs if live else rules.open_pkgs).add(pkg)
    past = str(data.get("pastSummary", ""))
    for lo, hi in re.findall(r"REL-0*(\d+)\s*(?:…|\.\.\.|[–-])\s*REL-0*(\d+)", past):
        rules.live_rel.update(range(int(lo), int(hi) + 1))
    for lo, hi in re.findall(r"\bM0*(\d+)\s*(?:…|\.\.\.|[–-])\s*M0*(\d+)", past):
        rules.live_ms.update(range(int(lo), int(hi) + 1))
    rules.live_pkgs -= rules.open_pkgs  # ein Paket in beiden: offen gewinnt
    return rules


def _has_prefix(flat: str, pkg: str) -> bool:
    """Paket-ID am Anfang; endet sie auf eine Ziffer, darf keine weitere Ziffer folgen (I-10 nicht I-100)."""
    if not flat.startswith(pkg):
        return False
    rest = flat[len(pkg) :]
    return not rest or not (pkg[-1].isdigit() and rest[0].isdigit())


def classify(name: str, rules: Rules) -> str:
    """'live' (Bilder weg), 'open' (bleibt) oder 'unknown' (Alter entscheidet)."""
    flat = _norm(name)
    for pkg in rules.open_pkgs:
        if _has_prefix(flat, pkg):
            return "open"
    rel = re.match(r"rel-?0*(\d+)(?!\d)", name, re.IGNORECASE)
    if rel and int(rel.group(1)) in rules.open_rel:
        return "open"
    for pkg in rules.live_pkgs:
        if _has_prefix(flat, pkg):
            return "live"
    if rel and int(rel.group(1)) in rules.live_rel:
        return "live"
    ms = re.match(r"m0*(\d+)(?!\d)", name, re.IGNORECASE)
    if ms and int(ms.group(1)) in rules.live_ms:
        return "live"
    return "unknown"


def _images(folder: Path) -> list[Path]:
    return sorted(
        p
        for p in folder.rglob("*")
        if p.is_file() and p.suffix.lower() in IMAGE_SUFFIXES
    )


def _newest(folder: Path) -> float:
    times = [p.stat().st_mtime for p in folder.rglob("*") if p.is_file()]
    return max(times, default=0.0)


def git_reachable(worktree: Path, repo: Path) -> bool:
    """Wahr, wenn HEAD des Worktrees in einem lokalen Branch liegt und nichts Ungesichertes offen ist."""

    def run(*args: str, cwd: Path) -> str | None:
        try:
            done = subprocess.run(
                ["git", *args],
                cwd=cwd,
                capture_output=True,
                text=True,
                timeout=60,
                check=False,
            )
        except (OSError, subprocess.SubprocessError):
            return None
        return done.stdout if done.returncode == 0 else None

    head = run("rev-parse", "HEAD", cwd=worktree)
    if not head or run("status", "--porcelain", cwd=worktree):
        return False
    return bool((run("branch", "--contains", head.strip(), cwd=repo) or "").strip())


def plan_cleanup(
    studio: Path,
    rules: Rules,
    now: float | None = None,
    reachable: Callable[[Path], bool] | None = None,
) -> Plan:
    """Trockenlauf-Plan für ``<studio>/qa`` und ``<studio>/archiv/worktrees``."""
    now = time.time() if now is None else now
    limit = now - MIN_AGE_DAYS * 86400
    plan = Plan()

    def take(images: list[Path]) -> None:
        plan.delete.extend(images)
        plan.size += sum(p.stat().st_size for p in images)

    qa = studio / "qa"
    for folder in sorted(p for p in qa.iterdir() if p.is_dir()) if qa.is_dir() else []:
        images = _images(folder)
        if not images:
            continue
        kind = classify(folder.name, rules)
        if kind == "open":
            plan.keep.append((f"qa/{folder.name}", "Paket noch nicht live"))
        elif kind == "live" or _newest(folder) < limit:
            take(images)
        else:
            plan.keep.append(
                (
                    f"qa/{folder.name}",
                    f"nicht zuordenbar, jünger als {MIN_AGE_DAYS} Tage",
                )
            )

    wts = studio / "archiv" / "worktrees"
    for folder in (
        sorted(p for p in wts.iterdir() if p.is_dir()) if wts.is_dir() else []
    ):
        if (folder / ".git").exists():
            if reachable is not None and reachable(folder):
                plan.delete_dirs.append(folder)
                plan.size += sum(
                    p.stat().st_size for p in folder.rglob("*") if p.is_file()
                )
            else:
                plan.keep.append(
                    (f"archiv/worktrees/{folder.name}", "Stand nicht in git erreichbar")
                )
        else:
            # Nur ignorierte Reste ohne eigenen Git-Stand: Bilder nach Altersregel, Text bleibt.
            if _newest(folder) < limit:
                take(_images(folder))
            else:
                plan.keep.append(
                    (
                        f"archiv/worktrees/{folder.name}",
                        f"jünger als {MIN_AGE_DAYS} Tage",
                    )
                )
    return plan


def apply_plan(plan: Plan, studio: Path) -> int:
    """Löscht den Plan; verweigert jeden Pfad ausserhalb von ``studio``. Gibt die Zahl gelöschter Dateien zurück."""
    root = studio.resolve()
    count = 0
    for path in [*plan.delete, *plan.delete_dirs]:
        resolved = path.resolve()
        if root not in resolved.parents:
            raise ValueError(f"Pfad ausserhalb von {root}: {resolved}")
        if path.is_dir():
            count += sum(1 for p in path.rglob("*") if p.is_file())
            shutil.rmtree(path)
        elif path.exists():
            path.unlink()
            count += 1
    for folder in sorted(root.glob("**/*"), key=lambda p: len(p.parts), reverse=True):
        if folder.is_dir() and not any(folder.iterdir()) and folder.parent != root:
            if folder.parent.name in {"qa", "worktrees"}:
                continue  # Paketordner selbst bleiben; nur leere Unterordner räumen
            folder.rmdir()
    return count


def report(plan: Plan, studio: Path, applied: bool) -> str:
    by_folder: dict[str, list[int]] = {}
    for path in plan.delete:
        key = "/".join(path.relative_to(studio).parts[:2])
        by_folder.setdefault(key, []).append(
            path.stat().st_size if path.exists() else 0
        )
    lines = [("Gelöscht:" if applied else "Trockenlauf, würde löschen:")]
    for key, sizes in sorted(by_folder.items()):
        lines.append(f"  {key}: {len(sizes)} Bilder, {sum(sizes) / MB:.1f} MB")
    for folder in plan.delete_dirs:
        lines.append(f"  {folder.relative_to(studio)}: ganzer Worktree")
    for name, why in plan.keep:
        lines.append(f"  bleibt: {name} ({why})")
    lines.append(
        f"Summe: {plan.size / MB:.1f} MB"
        + ("" if applied else " (mit --apply löschen)")
    )
    return "\n".join(lines)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--apply", action="store_true", help="wirklich löschen (Standard: Trockenlauf)"
    )
    parser.add_argument(
        "--root", type=Path, default=None, help="Repo-Wurzel (Standard: Hauptrepo)"
    )
    args = parser.parse_args(argv)
    if args.root is None:
        import paths

        args.root = paths.repo_root()
    root: Path = args.root
    studio = root / ".studio"
    rules = load_rules(root / "docs" / "studio" / "releases.json")
    plan = plan_cleanup(studio, rules, reachable=lambda wt: git_reachable(wt, root))
    # Der Bericht liest Dateigrössen, daher vor dem Löschen erzeugen.
    text = report(plan, studio, args.apply)
    if args.apply:
        apply_plan(plan, studio)
    print(text)
    return 0


if __name__ == "__main__":
    sys.exit(main())
