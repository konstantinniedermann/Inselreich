"""Studio-Aufwand: Agenten-Datensätze, Delegationen, Qualität, Vorfälle.

Rein und ohne I/O. Eingabe sind die Knoten des Modells (model.py); fehlende
Messwerte bleiben ``None`` und werden nie als 0 ausgewiesen.
Spec: docs/superpowers/specs/2026-09-30-studio-autonomie-design.md,
Abschnitt „Aggregation — effort.py“.
"""

from __future__ import annotations

import re
from datetime import datetime

import efficiency

GAP_DEFAULT = 300.0
DIRECTOR = "studio-director"
TOKEN_FIELDS = ("input", "cache_write", "cache_read", "output")
CACHE_FIELDS = ("cache_write", "cache_read")
ROUNDS_LIMIT = 3
BUDGET_FACTOR = 1.5
AMPEL_MIN_AGENTS = 10  # kleinere Sessions sind Rauschen und brechen die Kette
_CREATED = re.compile(r"^- erzeugt:\s*(\S+)", re.MULTILINE)
_AGENTS = re.compile(r"^- Sessions:\s*\d+,\s*Agenten:\s*(\d+)", re.MULTILINE)
_MEASURED = re.compile(r"^- Datenbasis: \d+ Session\(s\), (\d+) Agenten", re.MULTILINE)
_RED = re.compile(r"^- ROT: (.+?): ", re.MULTILINE)


def _lead(node: dict, nodes: dict[str, dict]) -> str:
    current: dict | None = node
    steps = 0
    while current is not None and steps < 1000:
        if current["level"] == 1:
            return current["role"]
        if current["level"] == 0:
            break
        current = nodes.get(current.get("parent") or "")
        steps += 1
    return DIRECTOR


def _subtree_tools(node: dict, nodes: dict[str, dict]) -> int:
    total, seen, todo = 0, set(), [node["key"]]
    while todo:
        key = todo.pop()
        if key in seen or key not in nodes:
            continue
        seen.add(key)
        total += nodes[key].get("tool_calls") or 0
        todo.extend(nodes[key].get("children") or [])
    return total


def _lower_bound(tokens: dict) -> bool:
    return any(
        (u.get("complete") or 0) < (u.get("messages") or 0) for u in tokens.values()
    )


def record(node: dict, nodes: dict[str, dict]) -> dict:
    """Agenten-Datensatz aus einem Modell-Knoten."""
    usage = node.get("usage") or {}
    tokens = {m: dict(u) for m, u in usage.items() if isinstance(u, dict)}
    closed = [b - a for a, b in node.get("_runs") or [] if b is not None]
    parent = nodes.get(node.get("parent") or "")
    return {
        "key": node["key"],
        "session_id": node["session_id"],
        "agent_id": node["agent_id"],
        "role": node["role"],
        "level": node["level"],
        "department": node["department"],
        "delegated_by": parent["role"] if parent else "",
        "parent": parent["key"] if parent else "",
        "lead": _lead(node, nodes),
        "package": node.get("package") or "",
        "milestone": node.get("milestone") or "",
        "model": node.get("model") or "",
        "persona_version": node.get("persona_version") or "",
        "handbook_version": node.get("handbook_version") or "",
        "started": node["started"],
        "stopped": node["stopped"],
        "status": node["status"],
        "duration_s": round(sum(closed), 3) if closed else None,
        "tool_calls": node.get("tool_calls"),
        "subtree_tool_calls": _subtree_tools(node, nodes),
        "tokens": tokens,
        "output_lower_bound": _lower_bound(tokens),
        "estimate": node.get("estimate"),
        "briefing": node.get("briefing") or "",
        "report": node.get("report") or "",
        "resumes": node.get("resumes") or 0,
        "max_gap_s": node.get("max_gap") or 0.0,
        "delegated_at": node.get("delegated_at"),
        "reported": node.get("reported"),
    }


def _sum_tokens(tokens: dict, *fields: str) -> int | None:
    if not tokens:
        return None
    return sum(u.get(f) or 0 for u in tokens.values() for f in fields)


def _outcome(rec: dict, results: list[dict]) -> str | None:
    if not rec["package"]:
        return None
    hits = [
        r
        for r in results
        if r.get("package") == rec["package"]
        and (r.get("worker") or r.get("role")) == rec["role"]
    ]
    return hits[-1].get("outcome") if hits else None


def delegations(records: list[dict], results: list[dict] | None = None) -> list[dict]:
    """Delegationen (nur Datensätze mit Spawn), neueste zuerst."""
    rows = []
    for rec in records:
        if rec["delegated_at"] is None:
            continue
        rows.append(
            {
                "t": rec["delegated_at"],
                "from": rec["delegated_by"],
                "to": rec["role"],
                "package": rec["package"],
                "milestone": rec["milestone"],
                "model": rec["model"],
                "briefing": rec["briefing"],
                "report": rec["report"],
                "estimate": rec["estimate"],
                "duration_s": rec["duration_s"],
                "tool_calls": rec["tool_calls"],
                # wie im Reiter Aufwand: Input + Cache-Schreiben + Cache-Lesen
                "tokens_in": _sum_tokens(rec["tokens"], "input", *CACHE_FIELDS),
                "input": _sum_tokens(rec["tokens"], "input"),
                "cache_write": _sum_tokens(rec["tokens"], "cache_write"),
                "cache_read": _sum_tokens(rec["tokens"], "cache_read"),
                "tokens_out": _sum_tokens(rec["tokens"], "output"),
                "output_lower_bound": rec["output_lower_bound"],
                "outcome": _outcome(rec, results or []),
                "status": rec["status"],
            }
        )
    return sorted(rows, key=lambda r: r["t"], reverse=True)


def _row(key: str, recs: list[dict]) -> dict:
    durations = [r["duration_s"] for r in recs if r["duration_s"] is not None]
    measured = [r for r in recs if r["tokens"]]
    counts = [r["tool_calls"] for r in recs if r["tool_calls"] is not None]
    row = {
        "key": key,
        "agents": len(recs),
        "agents_measured": len(measured),
        "duration_s": round(sum(durations), 3) if durations else None,
        "tool_calls": sum(counts) if counts else None,
    }
    for field in TOKEN_FIELDS:
        row[field] = (
            sum(_sum_tokens(r["tokens"], field) or 0 for r in measured)
            if measured
            else None
        )
    row["output_lower_bound"] = any(r["output_lower_bound"] for r in recs)
    return row


def _group(records: list[dict], field: str) -> list[dict]:
    groups: dict[str, list[dict]] = {}
    for rec in records:
        groups.setdefault(rec[field] or "ohne", []).append(rec)
    return [_row(key, groups[key]) for key in sorted(groups)]


def _by_model(records: list[dict]) -> list[dict]:
    groups: dict[str, list[dict]] = {}
    for rec in records:
        for model, usage in rec["tokens"].items():
            groups.setdefault(model, []).append(usage)
    rows = []
    for model in sorted(groups):
        usages = groups[model]
        row = {
            "key": model,
            "agents": len(usages),
            "agents_measured": len(usages),
            "duration_s": None,
            "tool_calls": None,
        }
        for field in TOKEN_FIELDS:
            row[field] = sum(u.get(field) or 0 for u in usages)
        row["output_lower_bound"] = _lower_bound(dict(enumerate(usages)))
        rows.append(row)
    return rows


def _under_estimate(rec: dict, by_key: dict[str, dict]) -> bool:
    """Hat ein Vorfahr eine Schätzung? Sie umfasst dann diesen Teilbaum."""
    seen: set[str] = set()
    parent = by_key.get(rec.get("parent") or "")
    while parent is not None and parent["key"] not in seen:
        if parent["estimate"]:
            return True
        seen.add(parent["key"])
        parent = by_key.get(parent.get("parent") or "")
    return False


def _estimate_vs_actual(records: list[dict]) -> dict:
    by_key = {r["key"]: r for r in records}
    used = [
        r
        for r in records
        if r["estimate"]
        and r["duration_s"] is not None
        and r["estimate"].get("minutes") is not None
        and not _under_estimate(r, by_key)
    ]
    if not used:
        return {
            "count": 0,
            "estimated_min": None,
            "actual_min": None,
            "deviation_pct": None,
            "estimated_tools": None,
            "actual_tools": None,
        }
    estimated = sum(r["estimate"]["minutes"] for r in used)
    actual = sum(r["duration_s"] for r in used) / 60
    with_tools = [r for r in used if r["estimate"].get("tools") is not None]
    return {
        "count": len(used),
        "estimated_min": round(estimated, 1),
        "actual_min": round(actual, 1),
        "deviation_pct": (
            round((actual - estimated) / estimated * 100, 1) if estimated else None
        ),
        "estimated_tools": (
            sum(r["estimate"]["tools"] for r in with_tools) if with_tools else None
        ),
        "actual_tools": (
            sum(r["subtree_tool_calls"] for r in with_tools) if with_tools else None
        ),
    }


def aggregate(records: list[dict]) -> dict:
    """Aufwand je Rolle, Paket, Lead (Teilbaum), Meilenstein, Modell."""
    return {
        "by_role": _group(records, "role"),
        "by_package": _group(records, "package"),
        "by_lead": _group(records, "lead"),
        "by_milestone": _group(records, "milestone"),
        "by_model": _by_model(records),
        "estimate_vs_actual": _estimate_vs_actual(records),
    }


def quality(
    records: list[dict],
    results: list[dict],
    ci_runs: list[dict],
    escalations: list | int,
    gap_after: float = GAP_DEFAULT,
) -> dict:
    """Qualitätskennzahlen; ``None``, wo nichts erfasst ist."""
    checked = [r for r in results if (r.get("review_rounds") or 0) >= 1]
    hits = [
        r
        for r in checked
        if r.get("outcome") == "angenommen" and r["review_rounds"] == 1
    ]
    rework = sum(1 for r in results if r.get("outcome") == "nacharbeit")
    rounds = [r["review_rounds"] for r in checked]
    main_failures = [
        c
        for c in ci_runs
        if c.get("conclusion") == "failure" and c.get("branch") == "main"
    ]
    return {
        "results": len(results),
        "unchecked": sum(1 for r in results if not r.get("review_rounds")),
        "first_pass_rate": len(hits) / len(checked) if checked else None,
        "review_rounds_mean": sum(rounds) / len(rounds) if rounds else None,
        "review_rounds_max": max(rounds) if rounds else None,
        "rework": rework if results else None,
        "rework_share": rework / len(results) if results else None,
        "rejected": (
            sum(1 for r in results if r.get("outcome") == "verworfen")
            if results
            else None
        ),
        "ci_runs": len(ci_runs) if ci_runs else None,
        "ci_failures": len(main_failures) if ci_runs else None,
        "escalations": (
            escalations if isinstance(escalations, int) else len(escalations)
        ),
        "failed_agents": sum(1 for r in records if r["status"] == "failed"),
        "gap_agents": sum(1 for r in records if r["max_gap_s"] > gap_after),
    }


def incidents(
    records: list[dict],
    results: list[dict],
    ci_runs: list[dict],
    budgets: list[dict],
    milestones: list[dict],
    acknowledged: set[str] | frozenset[str],
    inactive_keys: list[str] | set[str],
) -> list[dict]:
    """Offene Vorfälle mit stabiler ID (Auslöser einer Ad-hoc-Retro)."""
    found: list[dict] = []
    for rec in records:
        if rec["status"] == "failed":
            found.append(
                {
                    "id": f"failed:{rec['key']}",
                    "kind": "failed",
                    "text": f"Agent {rec['role']} ist gescheitert",
                    "t": rec["stopped"] or rec["started"],
                }
            )
    by_key = {r["key"]: r for r in records}
    for key in sorted(inactive_keys):
        rec = by_key.get(key)
        found.append(
            {
                "id": f"inaktiv:{key}",
                "kind": "inaktiv",
                "text": f"Agent {rec['role'] if rec else key} ist inaktiv",
                "t": rec["started"] if rec else 0.0,
            }
        )
    for run in ci_runs:
        if run.get("conclusion") == "failure" and run.get("branch") == "main":
            found.append(
                {
                    "id": f"ci:{run.get('run_id')}",
                    "kind": "ci",
                    "text": f"CI auf main fehlgeschlagen ({run.get('workflow') or ''})",
                    "t": run.get("t") or 0.0,
                }
            )
    reported: set[str] = set()
    for row in budgets:
        granted = row.get("granted") or 0
        budget_id = f"budget:{row['lead']}:{row['phase']}"
        if (
            granted > 0
            and row.get("used", 0) > BUDGET_FACTOR * granted
            and budget_id not in reported
        ):
            reported.add(budget_id)
            found.append(
                {
                    "id": f"budget:{row['lead']}:{row['phase']}",
                    "kind": "budget",
                    "text": (
                        f"Budget von {row['lead']} überschritten: "
                        f"{row['used']} von {granted}"
                    ),
                    "t": row.get("since") or 0.0,
                }
            )
    rounds: dict[str, dict] = {}
    for res in results:
        if (res.get("review_rounds") or 0) > ROUNDS_LIMIT and res.get("package"):
            rounds[res["package"]] = res
    for package, res in rounds.items():
        found.append(
            {
                "id": f"runden:{package}",
                "kind": "runden",
                "text": f"Paket {package}: {res['review_rounds']} Review-Runden",
                "t": res.get("t") or 0.0,
            }
        )
    for item in milestones:
        if item.get("status") == "done":
            found.append(
                {
                    "id": f"meilenstein:{item['id']}",
                    "kind": "meilenstein",
                    "text": f"Meilenstein {item['id']} abgeschlossen: Retro fällig",
                    "t": item.get("done") or 0.0,
                }
            )
    return [i for i in found if i["id"] not in acknowledged]


def parse_ampel_session(ident: str, text: str) -> dict | None:
    """Eine Session-Metrikdatei: Kennung, Zeit, Agentenzahl, rote Kennzahlen."""
    # „Datenbasis … Agenten" ist die Zählbasis für AMPEL_MIN_AGENTS: „Agenten:" im
    # Abschnitt Aufwand zählt Hook-Ereignisse (z. B. 50 statt 3 gemessen), die
    # Grenze würde sonst nie greifen.
    created = _CREATED.search(text)
    agents = _MEASURED.search(text) or _AGENTS.search(text)
    if not created or not agents:
        return None
    try:
        when = datetime.fromisoformat(created.group(1))
        stamp = when.timestamp()
    except ValueError:
        return None
    red = {
        efficiency.LABEL_KEYS[name]
        for name in _RED.findall(text)
        if name in efficiency.LABEL_KEYS
    }
    return {"id": ident, "t": stamp, "agents": int(agents.group(1)), "red": red}


def _counts(session: dict) -> bool:
    return session["agents"] >= AMPEL_MIN_AGENTS


def _ampel_floor(ordered: list[dict], key: str, acknowledged) -> int:
    floor = -1
    for index, session in enumerate(ordered):
        if f"ampel:{key}:{session['id']}" in acknowledged:
            floor = index
    return floor


def _latest_pair(ordered: list[dict], key: str, floor: int) -> int | None:
    """Index i des jüngsten Paars (i-1, i), beide gross und rot für key, i-1 > floor."""
    for i in range(len(ordered) - 1, max(floor + 1, 0), -1):
        pair = (ordered[i - 1], ordered[i])
        if all(_counts(s) and key in s["red"] for s in pair):
            return i
    return None


def ampel_incidents(
    sessions: list[dict], acknowledged: set[str] | frozenset[str]
) -> list[dict]:
    """Rote Ampelzeile in zwei benachbarten grossen Sessions: ein Vorfall je Kennzahl."""
    ordered = sorted(sessions, key=lambda s: (s["t"], s["id"]))
    found: list[dict] = []
    for key, label in efficiency.LIGHT_LABELS.items():
        floor = _ampel_floor(ordered, key, acknowledged)
        i = _latest_pair(ordered, key, floor)
        if i is None:
            continue
        before, last = ordered[i - 1], ordered[i]
        found.append(
            {
                "id": f"ampel:{key}:{last['id']}",
                "kind": "ampel",
                "text": (
                    f"Ampel {label} in zwei Sessions in Folge rot "
                    f"({before['id']}, {last['id']})"
                ),
                "t": last["t"],
            }
        )
    return found
