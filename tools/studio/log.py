"""Explizite Studio-Events: python3 tools/studio/log.py <art> [optionen].

Aufrufe stehen in docs/studio/STUDIO.md (Abschnitt Logging-Pflicht).
"""

from __future__ import annotations

import argparse
import os
import sys
from datetime import datetime, timezone

from paths import append_event, events_file, now_iso, studio_home

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

    budget = sub.add_parser("budget", help="Budgetfreigabe durch L0")
    budget.add_argument("--lead", required=True)
    budget.add_argument("--grant", required=True, type=int)
    budget.add_argument("--parallel", type=int, default=0)
    budget.add_argument("--phase", default="Standard")

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


def make_event(args: argparse.Namespace) -> dict:
    event = {
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
            package=args.package,
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
        blocked = [x.strip() for x in args.blocked_by.split(",") if x.strip()]
        event.update(
            package=args.id,
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
    target_dir = studio_home() / "archive"
    target_dir.mkdir(parents=True, exist_ok=True)
    target = target_dir / f"events-{datetime.now(timezone.utc):%Y%m%d-%H%M%S}.jsonl"
    source.rename(target)
    print(f"studio-log: archiviert nach {target}")
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    if args.kind == "archive":
        return archive()
    if args.kind == "decision" and not (
        args.resolution or (args.target and args.question)
    ):
        parser.error("decision braucht --for und --question oder --resolution")
    append_event(make_event(args))
    print(f"studio-log: {args.kind} geschrieben")
    return 0


if __name__ == "__main__":
    sys.exit(main())
