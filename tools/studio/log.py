"""Explizite Studio-Events: python3 tools/studio/log.py <art> [optionen].

Aufrufe stehen in docs/studio/STUDIO.md (Abschnitt Logging-Pflicht).
"""

from __future__ import annotations

import argparse
import os
import re
import subprocess
import sys

import clock
import studio_docs
from paths import (
    append_event,
    archive_dir,
    docs_dir,
    events_file,
    now_iso,
    repo_root,
)

STATUSES = (
    "active",
    "delegated",
    "waiting",
    "blocked",
    "idle",
    "done",
    "failed",
    "ended",
)
PACKAGE_STATUSES = ("open", "active", "review", "blocked", "done")
OUTCOMES = ("angenommen", "nacharbeit", "verworfen")
MILESTONE_STATUSES = ("start", "done")
RETRO_KINDS = ("meilenstein", "session", "adhoc")
QUEUE_ID = re.compile(r"N-[0-9]+")  # mit fullmatch: ^N-\d+$ ohne Zeilenumbruch


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="log.py", description="Studio-Events schreiben"
    )
    sub = parser.add_subparsers(dest="kind", required=True)

    status = sub.add_parser("status", help="Statuswechsel eines Agenten")
    status.add_argument("--role", required=True)
    status.add_argument("--status", required=True, choices=STATUSES)
    status.add_argument("--task", default="")
    status.add_argument("--summary", default="")
    status.add_argument("--package", default="")
    status.add_argument("--milestone", default="")

    result = sub.add_parser("result", help="Ergebnis eines Pakets")
    result.add_argument("--role", required=True)
    result.add_argument("--package", required=True)
    result.add_argument("--outcome", required=True, choices=OUTCOMES)
    result.add_argument("--review-rounds", required=True, type=int)
    result.add_argument("--worker", default="")
    result.add_argument("--milestone", default="")

    milestone = sub.add_parser("milestone", help="Meilenstein starten oder beenden")
    milestone.add_argument("--id", required=True)
    milestone.add_argument("--status", required=True, choices=MILESTONE_STATUSES)
    milestone.add_argument("--title", default="")

    retro = sub.add_parser("retro", help="Retrospektive")
    retro.add_argument("--id", required=True)
    retro.add_argument("--kind", dest="retro_kind", required=True, choices=RETRO_KINDS)
    retro.add_argument("--triggers", default="")
    retro.add_argument("--report", default="")

    queue = sub.add_parser("queue", help="Nutzer-Warteschlange")
    queue.add_argument("--id", required=True)
    queue.add_argument("--title", default="")
    queue.add_argument("--question", default="")
    queue.add_argument("--recommendation", default="")
    queue.add_argument("--reason", default="")
    queue.add_argument("--cost", default="")
    queue.add_argument("--blocks", default="")
    queue.add_argument("--from", dest="source_role", default="")
    queue.add_argument("--answer", default=None)
    queue.add_argument("--done", default=None)

    budget = sub.add_parser("budget", help="Budgetfreigabe durch L0")
    budget.add_argument("--lead", required=True)
    budget.add_argument("--grant", required=True, type=int)
    budget.add_argument("--parallel", type=int, default=0)
    budget.add_argument("--phase", required=True)

    package = sub.add_parser("package", help="Paket auf dem Meilenstein-Board")
    package.add_argument("--id", required=True)
    package.add_argument("--title", required=True)
    package.add_argument("--owner", required=True)
    package.add_argument("--status", required=True, choices=PACKAGE_STATUSES)
    package.add_argument("--blocked-by", default="")
    package.add_argument("--milestone", default="")

    decision = sub.add_parser("decision", help="Offene oder gelöste Entscheidung")
    decision.add_argument("--id", required=True)
    decision.add_argument("--for", dest="target", choices=("l0", "user"))
    decision.add_argument("--question", default="")
    decision.add_argument("--recommendation", default="")
    decision.add_argument("--from", dest="source_role", default="")
    decision.add_argument("--resolution", default="")

    sub.add_parser("archive", help="events.jsonl archivieren (Dashboard startet leer)")
    return parser


def _split(text: str) -> list[str]:
    return [x.strip() for x in text.split(",") if x.strip()]


def run_prettier(path: str) -> None:
    """Formatiert die Warteschlange wie `make check` sie erwartet (E-047).

    Fehlt `npx` oder scheitert prettier, gibt es eine Warnung, keinen Abbruch.
    """
    try:
        subprocess.run(
            ["npx", "prettier", "--write", path],
            cwd=repo_root(),
            capture_output=True,
            check=True,
            timeout=60,
        )
    except (OSError, subprocess.SubprocessError) as exc:
        print(
            f"studio-log: Warnung: prettier nicht ausgeführt ({exc.__class__.__name__}); "
            "docs/studio/warteschlange.md vor make check mit 'npx prettier --write' formatieren",
            file=sys.stderr,
        )


def queue_event(args: argparse.Namespace) -> dict | None:
    """Schreibt den Warteschlangen-Eintrag; None bei unbekannter ID."""
    docs = docs_dir()
    event = {"queue_id": args.id, "role": args.source_role}
    if args.answer is not None:
        if not studio_docs.queue_update(docs, args.id, answer=args.answer):
            return None
        event.update(action="answer")
    elif args.done is not None:
        if not studio_docs.queue_update(docs, args.id, status="umgesetzt"):
            return None
        event.update(action="done", summary=args.done)
    else:
        studio_docs.queue_add(
            docs,
            args.id,
            args.title,
            args.question,
            args.recommendation,
            args.reason,
            args.cost,
            args.blocks,
            args.source_role,
            clock.now().astimezone().date().isoformat(),
        )
        event.update(action="add", question=args.question, blocks=args.blocks)
    return event


def make_event(args: argparse.Namespace) -> dict:
    event = {
        "handbook_version": studio_docs.read_version(docs_dir() / "STUDIO.md"),
        "ts": now_iso(),
        "session_id": os.environ.get("CLAUDE_CODE_SESSION_ID", "manual"),
        "agent_id": "",
        "source": "log",
        "kind": args.kind,
    }
    if args.kind == "status":
        event.update(
            role=args.role,
            status=args.status,
            task=args.task,
            summary=args.summary,
            package_id=args.package,
            milestone=args.milestone,
        )
    elif args.kind == "result":
        event.update(
            role=args.role,
            package_id=args.package,
            outcome=args.outcome,
            review_rounds=args.review_rounds,
            worker=args.worker,
            milestone=args.milestone,
        )
    elif args.kind == "milestone":
        event.update(milestone=args.id, status=args.status, title=args.title)
    elif args.kind == "retro":
        event.update(
            retro_id=args.id,
            retro_kind=args.retro_kind,
            triggers=_split(args.triggers),
            report=args.report,
        )
    elif args.kind == "budget":
        event.update(
            role=args.lead,
            budget={
                "granted": args.grant,
                "parallel": args.parallel,
                "phase": args.phase,
            },
        )
    elif args.kind == "package":
        blocked = _split(args.blocked_by)
        event.update(
            package_id=args.id,
            title=args.title,
            owner=args.owner,
            status=args.status,
            blocked_by=blocked,
            milestone=args.milestone,
        )
    elif args.kind == "decision":
        event.update(decision_id=args.id, role=args.source_role)
        if args.resolution:
            event["resolution"] = args.resolution
        else:
            event.update(
                {
                    "for": args.target,
                    "question": args.question,
                    "recommendation": args.recommendation,
                }
            )
    return event


def archive() -> int:
    source = events_file()
    if not source.exists():
        print("studio-log: keine Events zum Archivieren")
        return 0
    target_dir = archive_dir() / "events"
    target_dir.mkdir(parents=True, exist_ok=True)
    stamp = f"{clock.now():%Y%m%d-%H%M%S}"
    target = target_dir / f"events-{stamp}.jsonl"
    counter = 0
    while target.exists():
        counter += 1
        target = target_dir / f"events-{stamp}-{counter}.jsonl"
    source.rename(target)
    print(f"studio-log: archiviert nach {target}")
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    if args.kind == "archive":
        return archive()
    if args.kind == "decision" and args.target == "user":
        parser.exit(
            2,
            "studio-log: Nutzerentscheide gehen in die Warteschlange: "
            "log.py queue ...\n",
        )
    if args.kind == "decision" and not (
        args.resolution or (args.target and args.question)
    ):
        parser.error("decision braucht --for und --question oder --resolution")
    if args.kind == "queue" and not QUEUE_ID.fullmatch(args.id):
        parser.exit(2, f"studio-log: --id {args.id!r} ist keine N-<Nummer>\n")
    if (
        args.kind == "retro"
        and args.retro_kind == "meilenstein"
        and not any(t.startswith("meilenstein:") for t in _split(args.triggers))
    ):
        print(
            "studio-log: Warnung: Meilenstein-Retro ohne Trigger "
            "'meilenstein:<ID>' – der Retro-Alarm bleibt offen",
            file=sys.stderr,
        )
    event = make_event(args)
    if args.kind == "queue":
        try:
            extra = queue_event(args)
        except ValueError as exc:
            parser.exit(2, f"studio-log: {exc}\n")
        if extra is None:
            parser.exit(2, f"studio-log: {args.id} nicht in der Warteschlange\n")
        event.update(extra)
        run_prettier(str(docs_dir() / "warteschlange.md"))
    append_event(event)
    print(f"studio-log: {args.kind} geschrieben")
    return 0


if __name__ == "__main__":
    sys.exit(main())
