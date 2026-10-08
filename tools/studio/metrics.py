"""Verdichtet Studio-Events je Session und je Meilenstein zu Markdown-Dateien."""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

import actions
import efficiency
import effort
import model
import paths
import studio_docs
import usage

NOT_MEASURED = "nicht gemessen"
NOT_RECORDED = "nicht erfasst"
TOKEN_KEYS = ("input", "cache_write", "cache_read", "output")


def _read_jsonl(path: Path) -> list[dict]:
    events: list[dict] = []
    try:
        text = path.read_text(encoding="utf-8")
    except OSError:
        return events
    for line in text.splitlines():
        try:
            item = json.loads(line)
        except ValueError:
            continue
        if isinstance(item, dict):
            events.append(item)
    return events


def load_events(home: Path) -> list[dict]:
    """events.jsonl plus archivierte Events (archiv/events/, alt archive/)."""
    files = [home / "events.jsonl"]
    files += sorted((home / "archiv" / "events").glob("*.jsonl"))
    files += sorted((home / "archive").glob("*.jsonl"))
    events: list[dict] = []
    for path in files:
        events += _read_jsonl(path)
    return events


def transcript_dir(root: Path) -> Path:
    override = os.environ.get("STUDIO_TRANSCRIPTS")
    if override:
        return Path(override)
    slug = re.sub(r"[^A-Za-z0-9]", "-", str(root))
    return Path.home() / ".claude" / "projects" / slug


def _sum(values: list) -> int | float | None:
    present = [v for v in values if v is not None]
    return sum(present) if present else None


def _totals(rows: list[dict]) -> dict:
    totals = {
        "duration_s": _sum([r["duration_s"] for r in rows]),
        "tool_calls": _sum([r["tool_calls"] for r in rows]),
    }
    for key in TOKEN_KEYS:
        totals[key] = _sum([r[key] for r in rows])
    totals["output_lower_bound"] = any(r["output_lower_bound"] for r in rows)
    return totals


def summarize(
    state: dict,
    kind: str,
    kennung: str,
    handbook: str,
    cost: dict | None,
    created: str,
    efficiency_data: dict | None = None,
) -> dict:
    """Rohwerte einer Verdichtung; fehlende Messungen bleiben ``None``."""
    aggregate = state["effort"]
    return {
        "kennung": kennung,
        "kind": kind,
        "created": created,
        "handbook_version": handbook or None,
        "sessions": len({r["session_id"] for r in state["records"]}),
        "agents": len(state["records"]),
        "delegations": len(state["delegations"]),
        "totals": _totals(aggregate["by_lead"]),
        "by_lead": aggregate["by_lead"],
        "by_model": aggregate["by_model"],
        "estimate_vs_actual": aggregate["estimate_vs_actual"],
        "quality": state["quality"],
        "incidents_open": len(state["incidents"]),
        "session_cost": cost,
        "efficiency": efficiency_data,
    }


def _text(value: object) -> str:
    return NOT_MEASURED if value is None else str(value)


def _tokens(value: int | None, lower_bound: bool = False) -> str:
    if value is None:
        return NOT_MEASURED
    return f"≥ {value}" if lower_bound else str(value)


def _minutes(seconds: float | None) -> str:
    return NOT_MEASURED if seconds is None else f"{seconds / 60:.1f} min"


def _cells(row: dict) -> list[str]:
    return [
        row["key"],
        str(row["agents"]),
        _minutes(row["duration_s"]),
        _text(row["tool_calls"]),
        _tokens(row["input"]),
        _tokens(row["cache_write"]),
        _tokens(row["cache_read"]),
        _tokens(row["output"], row["output_lower_bound"]),
    ]


def _table(title: str, rows: list[dict]) -> list[str]:
    """Markdown-Tabelle in Prettier-Form: Spalten aufgefüllt, Trenner so breit."""
    head = [
        title,
        "Agenten",
        "Dauer",
        "Tool-Aufrufe",
        "Input",
        "Cache-Write",
        "Cache-Read",
        "Output",
    ]
    body = [_cells(r) for r in rows] or [["–"] + [""] * (len(head) - 1)]
    widths = [max(3, *(len(line[i]) for line in [head, *body])) for i in range(8)]

    def line(cells: list[str]) -> str:
        return "| " + " | ".join(c.ljust(w) for c, w in zip(cells, widths)) + " |"

    return [line(head), line(["-" * w for w in widths]), *(line(c) for c in body)]


def _unit(value: object, unit: str) -> str:
    return NOT_MEASURED if value is None else f"{value} {unit}"


def _tenth(value: float | None, unit: str) -> str:
    return NOT_MEASURED if value is None else f"{round(value, 1)} {unit}"


def _share(value: float | None) -> str:
    return NOT_RECORDED if value is None else f"{value * 100:.0f} %"


def _plain(value: object) -> str:
    return NOT_RECORDED if value is None else str(value)


def _mean(value: float | None) -> str:
    return NOT_RECORDED if value is None else f"{value:.2f}"


def render(raw: dict) -> str:
    totals, est, qual = raw["totals"], raw["estimate_vs_actual"], raw["quality"]
    art = "Meilenstein" if raw["kind"] == "milestone" else "Session"
    out = [
        f"# Metriken {raw['kennung']}",
        "",
        f"- erzeugt: {raw['created']}",
        f"- Art: {art}",
        f"- Handbuch: {_text(raw['handbook_version'])}",
        "",
        "## Aufwand",
        "",
        (
            f"- Sessions: {raw['sessions']}, Agenten: {raw['agents']}, "
            f"Delegationen: {raw['delegations']}"
        ),
        f"- Dauer: {_minutes(totals['duration_s'])}",
        f"- Tool-Aufrufe: {_text(totals['tool_calls'])}",
        f"- Input-Tokens: {_tokens(totals['input'])}",
        f"- Cache-Write-Tokens: {_tokens(totals['cache_write'])}",
        f"- Cache-Read-Tokens: {_tokens(totals['cache_read'])}",
        f"- Output-Tokens: {_tokens(totals['output'], totals['output_lower_bound'])}",
        "",
        *_table("Lead", raw["by_lead"]),
        "",
        *_table("Modell", raw["by_model"]),
        "",
        "Schätzung gegen Ist:",
        "",
        f"- Verglichene Agenten: {est.get('count', 0)}",
        (
            f"- Geschätzt: {_tenth(est.get('estimated_min'), 'min')}, "
            f"Ist: {_tenth(est.get('actual_min'), 'min')}, "
            f"Abweichung: {_unit(est.get('deviation_pct'), '%')}"
        ),
        (
            f"- Werkzeugaufrufe geschätzt: {_text(est.get('estimated_tools'))}, "
            f"Ist: {_text(est.get('actual_tools'))}"
        ),
        "",
        "## Qualität",
        "",
        (
            f"- Ergebnisse: {_plain(qual.get('results'))} "
            f"(ungeprüft: {_plain(qual.get('unchecked'))})"
        ),
        f"- Erstabnahme-Quote: {_share(qual.get('first_pass_rate'))}",
        (
            f"- Review-Runden im Mittel: {_mean(qual.get('review_rounds_mean'))}, "
            f"Maximum: {_plain(qual.get('review_rounds_max'))}"
        ),
        (
            f"- Nacharbeit: {_plain(qual.get('rework'))} "
            f"({_share(qual.get('rework_share'))})"
        ),
        f"- Verworfen: {_plain(qual.get('rejected'))}",
        (
            f"- CI-Läufe: {_plain(qual.get('ci_runs'))}, "
            f"Fehlschläge auf main: {_plain(qual.get('ci_failures'))}"
        ),
        f"- Eskalationen: {_plain(qual.get('escalations'))}",
        (
            f"- Gescheiterte Agenten: {_plain(qual.get('failed_agents'))}, "
            f"Agenten mit Lücke: {_plain(qual.get('gap_agents'))}"
        ),
        "",
        "## Vorfälle",
        "",
        f"- Offene Vorfälle: {raw['incidents_open']}",
        "",
        efficiency.render_section(raw.get("efficiency")).rstrip("\n"),
        "",
        "## Grenzen der Messung",
        "",
        (
            "- Output-Tokens mit «≥» sind eine Untergrenze: Nachrichten ohne "
            "abgeschlossene Zählung fehlen in der Summe."
        ),
    ]
    cost = raw["session_cost"]
    if cost is None:
        out.append(f"- Sitzungskosten: {NOT_MEASURED} (kein Transkript-Stand).")
    else:
        out.append(
            f"- Sitzungskosten: {_text(cost.get('total_usd'))} USD "
            "(Angabe der Sitzung, nicht geschätzt)."
        )
    out += [
        "",
        "## Rohwerte",
        "",
        "```json",
        json.dumps(raw, indent=2, ensure_ascii=False, sort_keys=True),
        "```",
        "",
    ]
    return "\n".join(out)


def _milestone_results(events: list[dict], ident: str, packages: set[str]) -> list:
    """Ergebnisse (letztes je Paket und Worker) dieses Meilensteins."""
    found: dict[tuple, dict] = {}
    for event in sorted(events, key=lambda e: model.parse_ts(e.get("ts"))):
        if event.get("kind") != "result":
            continue
        package = str(event.get("package_id") or event.get("package") or "")
        if str(event.get("milestone") or "") != ident and package not in packages:
            continue
        try:
            rounds = int(event.get("review_rounds") or 0)
        except (TypeError, ValueError):
            rounds = 0
        worker = str(event.get("worker") or event.get("role") or "")
        found[(package, worker)] = {
            "package": package,
            "outcome": str(event.get("outcome") or ""),
            "review_rounds": rounds,
        }
    return list(found.values())


def _milestone_state(state: dict, events: list[dict], ident: str) -> dict:
    records = [r for r in state["records"] if r["milestone"] == ident]
    packages = {r["package"] for r in records if r["package"]}
    keys = {r["key"] for r in records}
    results = _milestone_results(events, ident, packages)
    quality = effort.quality(records, results, [], 0)
    # CI-Läufe und Eskalationen lassen sich keinem Meilenstein zuordnen
    quality.update(ci_runs=None, ci_failures=None, escalations=None)
    incidents = [
        i
        for i in state["incidents"]
        if any(i["id"].endswith(f":{k}") for k in keys)
        or i["id"] == f"meilenstein:{ident}"
        or i["id"].removeprefix("runden:") in packages
    ]
    return {
        **state,
        "records": records,
        "delegations": [d for d in state["delegations"] if d["milestone"] == ident],
        "effort": effort.aggregate(records),
        "quality": quality,
        "incidents": incidents,
    }


def _session_cost(state: dict, sid: str, root: Path) -> dict | None:
    cost = usage.session_cost(transcript_dir(root) / f"{sid}.jsonl")
    if cost is not None:
        return cost
    for item in state["session_costs"]:
        if item["session_id"] == sid:
            return item["cost"]
    return None


def _persona_models() -> dict[str, str]:
    try:
        return model.read_agent_models(paths.agents_dir())
    except OSError:
        return {}


def _session_files(root: Path, sids: list[str]) -> list[Path]:
    folder = transcript_dir(root)
    return [folder / f"{sid}.jsonl" for sid in sids]


def latest_transcripts(root: Path, count: int | None) -> list[Path]:
    """Haupttranskripte, die letzten ``count`` nach Änderungszeit (None: alle)."""
    try:
        found = sorted(
            transcript_dir(root).glob("*.jsonl"), key=lambda p: p.stat().st_mtime
        )
    except OSError:
        return []
    return found if count is None else found[-count:] if count > 0 else []


def build(args: argparse.Namespace) -> tuple[str, dict] | None:
    events = load_events(paths.studio_home())
    models = model.read_agent_models(paths.agents_dir())
    handbook = studio_docs.read_version(paths.docs_dir() / "STUDIO.md")
    created = datetime.now().astimezone().isoformat(timespec="seconds")
    now = datetime.now(timezone.utc).timestamp()
    if args.milestone:
        state = model.build_state(events, now, models, "all")
        state = _milestone_state(state, events, args.milestone)
        sids = sorted({r["session_id"] for r in state["records"]})
        data = efficiency.compute(
            _session_files(paths.repo_root(), sids), _persona_models()
        )
        raw = summarize(
            state, "milestone", args.milestone, handbook, None, created, data
        )
        return args.milestone, raw
    state = model.build_state(events, now, models, args.session)
    sid = state["session"]
    found = next((s for s in state["sessions"] if s["id"] == sid), None)
    if not sid or sid == "all" or found is None:
        return None
    day = datetime.fromtimestamp(found["started"]).astimezone().strftime("%Y-%m-%d")
    kennung = f"S-{day}-{sid[:8]}"
    cost = _session_cost(state, sid, paths.repo_root())
    data = efficiency.compute(
        _session_files(paths.repo_root(), [sid]), _persona_models()
    )
    return kennung, summarize(state, "session", kennung, handbook, cost, created, data)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="metrics.py", description=__doc__)
    target = parser.add_mutually_exclusive_group(required=True)
    target.add_argument("--session", help="Session-ID oder latest")
    target.add_argument("--milestone", help="Meilenstein-ID")
    target.add_argument(
        "--efficiency",
        action="store_true",
        help="nur den Abschnitt Effizienz ausgeben (Retro-Werkzeug)",
    )
    parser.add_argument("--out", type=Path, default=None)
    parser.add_argument(
        "--sessions", type=int, default=None, help="mit --efficiency: letzte N Sessions"
    )
    parser.add_argument(
        "--idle-prefix",
        default="",
        help="mit --efficiency: Leerlauf nur für Pakete mit dieser ID-Vorsilbe (z. B. H-)",
    )
    args = parser.parse_args(argv)
    if args.efficiency:
        files = latest_transcripts(paths.repo_root(), args.sessions)
        data = efficiency.compute(files, _persona_models())
        print(efficiency.render_section(data))
        print(efficiency.render_rewrites(data))
        gaps = efficiency.idle_gaps(load_events(paths.studio_home()), args.idle_prefix)
        print(efficiency.render_idle(gaps))
        print(actions.render())
        return 0
    result = build(args)
    if result is None:
        print("studio-metrics: keine passende Session gefunden", file=sys.stderr)
        return 1
    kennung, raw = result
    if args.milestone and raw["agents"] == 0:
        print(f"studio-metrics: keine Datensätze für {kennung}", file=sys.stderr)
    folder = args.out or paths.docs_dir() / "metriken"
    folder.mkdir(parents=True, exist_ok=True)
    path = folder / f"{kennung}.md"
    path.write_text(render(raw), encoding="utf-8")
    format_markdown(path)
    print(path)
    return 0


def format_markdown(path: Path) -> None:
    """Prettier über die Datei (make check prüft sie); ohne npx bleibt sie, wie sie ist."""
    try:
        subprocess.run(
            ["npx", "--no-install", "prettier", "--write", str(path)],
            cwd=path.parent,
            capture_output=True,
            timeout=30,
            check=False,
        )
    except (OSError, subprocess.SubprocessError):
        pass


if __name__ == "__main__":
    sys.exit(main())
