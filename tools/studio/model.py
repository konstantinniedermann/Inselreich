"""Studio-Telemetrie: Events → Zustand fürs Dashboard.

Regeln: docs/superpowers/specs/2026-09-30-studio-design.md, Abschnitt
„Zuordnungsregeln". Bis auf EventStore und read_agent_models reine Funktionen.
"""

from __future__ import annotations

import json
import threading
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

INACTIVE_DEFAULT = 300.0
BIND_WINDOW = 30.0
FEED_SIZE = 80
PULSE_MINUTES = 60
CHRONICLE_SIZE = 200
TEXT_MAX = 160
LIVE = frozenset({"active", "delegated", "waiting", "blocked"})
FINAL = frozenset({"done", "failed", "ended"})
DEPARTMENTS = ("production", "design", "tech", "art", "qa")
DIRECTOR = "studio-director"
PUBLIC = (
    "key",
    "session_id",
    "agent_id",
    "role",
    "persona",
    "level",
    "department",
    "model",
    "task",
    "summary",
    "package",
    "started",
    "stopped",
    "last_seen",
)


def parse_ts(value: object) -> float:
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00")).timestamp()
    except ValueError:
        return 0.0


def classify(role: str) -> tuple[int, str]:
    """Ebene und Bereich aus dem Rollennamen (Namensschema, Spec R11)."""
    if role in ("main", DIRECTOR):
        return 0, "studio"
    if role.startswith("lead-"):
        department = role[len("lead-") :]
        return 1, department if department in DEPARTMENTS else "extern"
    prefix = role.split("-", 1)[0]
    return 2, prefix if prefix in DEPARTMENTS else "extern"


def read_agent_models(agents_dir: Path) -> dict[str, str]:
    """name → model aus der Frontmatter von .claude/agents/*.md."""
    models: dict[str, str] = {}
    if not agents_dir.is_dir():
        return models
    for path in sorted(agents_dir.glob("*.md")):
        lines = path.read_text(encoding="utf-8").splitlines()
        if not lines or lines[0].strip() != "---":
            continue
        meta: dict[str, str] = {}
        for line in lines[1:]:
            if line.strip() == "---":
                break
            key, sep, value = line.partition(":")
            if sep:
                meta[key.strip()] = value.strip()
        if meta.get("name"):
            models[meta["name"]] = meta.get("model") or "inherit"
    return models


class EventStore:
    """Liest events.jsonl inkrementell; kaputte und halbe Zeilen werden übersprungen."""

    def __init__(self, path: Path) -> None:
        self.path = path
        self._offset = 0
        self._inode = None
        self._events: list[dict] = []
        self._lock = threading.Lock()

    def events(self) -> list[dict]:
        with self._lock:
            try:
                info = self.path.stat()
            except OSError:
                self._offset, self._inode, self._events = 0, None, []
                return []
            if info.st_ino != self._inode or info.st_size < self._offset:
                self._offset, self._inode, self._events = 0, info.st_ino, []
            with open(self.path, "rb") as handle:
                handle.seek(self._offset)
                chunk = handle.read()
            end = chunk.rfind(b"\n") + 1
            for raw in chunk[:end].splitlines():
                try:
                    event = json.loads(raw)
                except ValueError:
                    continue
                if isinstance(event, dict):
                    self._events.append(event)
            self._offset += end
            return list(self._events)


def _short(text: object, limit: int = TEXT_MAX) -> str:
    text = " ".join(str(text or "").split())
    return text if len(text) <= limit else text[:limit] + "…"


class _Builder:
    def __init__(self, agent_models: dict[str, str], now: float) -> None:
        self.models = agent_models
        self.now = now
        self.nodes: dict[str, dict] = {}
        self.sessions: dict[str, dict] = {}
        self.pending: dict[str, list[dict]] = {}
        self.binds: dict[str, list[tuple[float, str, str]]] = {}
        self.budgets: dict[str, dict] = {}
        self.board: dict[str, dict] = {}
        self.decisions: dict[str, dict] = {}
        self.chronicle: list[dict] = []
        self.feed: list[dict] = []

    # --- Knoten -------------------------------------------------------------

    def node(self, sid: str, agent_id: str, ts: float, role: str = "") -> dict:
        key = f"{sid}:{agent_id}"
        node = self.nodes.get(key)
        if node is None:
            is_main = agent_id == "main"
            node = {
                "key": key,
                "session_id": sid,
                "agent_id": agent_id,
                "parent": None,
                "children": [],
                "role": "",
                "persona": "",
                "level": 0,
                "department": "studio",
                "model": "",
                "status": "idle" if is_main else "active",
                "task": "",
                "summary": "",
                "package": "",
                "started": ts,
                "stopped": None,
                "last_seen": ts,
                "_confirmed": False,
                "_chron": False,
            }
            self.nodes[key] = node
            self.set_role(node, DIRECTOR if is_main else (role or "unbekannt"))
            if not is_main:
                self.reparent(node, self.node(sid, "main", ts)["key"])
        node["last_seen"] = max(node["last_seen"], ts)
        return node

    def set_role(self, node: dict, role: str) -> None:
        node["role"] = role
        node["level"], node["department"] = classify(role)
        if node["agent_id"] != "main":
            node["model"] = self.models.get(role, node["model"] or "inherit")

    def reparent(self, node: dict, parent_key: str) -> None:
        if node["parent"] == parent_key:
            return
        if node["parent"] in self.nodes:
            siblings = self.nodes[node["parent"]]["children"]
            if node["key"] in siblings:
                siblings.remove(node["key"])
        node["parent"] = parent_key
        self.nodes[parent_key]["children"].append(node["key"])

    def add_chronicle(self, node: dict, ts: float, text: str) -> None:
        if not text:
            return
        node["_chron"] = True
        self.chronicle.append(
            {
                "ts": datetime.fromtimestamp(ts, timezone.utc)
                .astimezone()
                .isoformat(timespec="seconds"),
                "t": ts,
                "session_id": node["session_id"],
                "department": node["department"],
                "role": node["role"],
                "text": _short(text, 400),
            }
        )

    # --- Events -------------------------------------------------------------

    def apply(self, event: dict) -> None:
        ts = parse_ts(event.get("ts"))
        sid = str(event.get("session_id") or "unbekannt")
        session = self.sessions.setdefault(
            sid, {"id": sid, "started": ts, "last": ts, "ended": None}
        )
        session["last"] = max(session["last"], ts)
        handler = getattr(self, "on_" + str(event.get("kind", "")), None)
        if handler is not None:
            handler(event, ts, sid)
        self.add_feed(event, ts, sid)

    def agent(self, event: dict, ts: float, sid: str) -> dict:
        return self.node(
            sid, str(event.get("agent_id") or "main"), ts, event.get("role", "")
        )

    def on_session_start(self, event, ts, sid):
        main = self.node(sid, "main", ts)
        main["status"] = "idle"
        main["model"] = event.get("model") or main["model"]

    def on_prompt(self, event, ts, sid):
        main = self.node(sid, "main", ts)
        main["status"] = "active"
        main["task"] = event.get("task") or main["task"]

    def on_turn_end(self, event, ts, sid):
        main = self.node(sid, "main", ts)
        main["status"] = "idle"
        main["summary"] = event.get("summary") or main["summary"]

    def on_session_end(self, event, ts, sid):
        self.sessions[sid]["ended"] = ts
        self.node(sid, "main", ts)
        for node in self.nodes.values():
            if node["session_id"] == sid and node["status"] not in FINAL:
                node["status"], node["stopped"] = "ended", ts

    def on_spawn(self, event, ts, sid):
        parent = self.agent(event, ts, sid)
        self.pending.setdefault(sid, []).append(
            {
                "parent": parent["key"],
                "type": event.get("subagent_type") or "general-purpose",
                "persona": event.get("persona") or "",
                "package": event.get("package") or "",
                "model": event.get("model") or "",
                "task": event.get("description") or "",
                "matched": False,
            }
        )

    def on_spawned(self, event, ts, sid):
        parent = self.agent(event, ts, sid)
        child = self.node(sid, str(event.get("child_id")), ts)
        self.reparent(child, parent["key"])
        child["_confirmed"] = True

    def on_agent_start(self, event, ts, sid):
        typ = event.get("role") or "general-purpose"
        node = self.node(sid, str(event.get("agent_id")), ts, typ)
        node["status"], node["started"] = "active", ts
        candidates = [
            p
            for p in self.pending.get(sid, [])
            if not p["matched"] and p["type"] == typ
        ]
        if node["_confirmed"]:
            own = [p for p in candidates if p["parent"] == node["parent"]]
            candidates = own or candidates
        spawn = candidates[0] if candidates else None
        self.set_role(node, typ)
        if spawn is None:
            return
        spawn["matched"] = True
        if not node["_confirmed"]:
            self.reparent(node, spawn["parent"])
        if spawn["persona"]:
            node["persona"] = spawn["persona"]
            self.set_role(node, spawn["persona"])
        node["package"] = spawn["package"] or node["package"]
        node["task"] = spawn["task"] or node["task"]
        node["model"] = spawn["model"] or node["model"]

    def on_agent_stop(self, event, ts, sid):
        node = self.agent(event, ts, sid)
        node["status"] = "failed" if node["status"] == "failed" else "done"
        node["stopped"] = ts
        if not node["summary"]:
            node["summary"] = event.get("summary") or ""
        if not node["_chron"]:
            self.add_chronicle(node, ts, node["summary"] or node["task"])

    def on_heartbeat(self, event, ts, sid):
        self.agent(event, ts, sid)

    def on_bind(self, event, ts, sid):
        node = self.agent(event, ts, sid)
        role = event.get("role") or ""
        if role:
            self.binds.setdefault(sid, []).append((ts, role, node["key"]))
        node["package"] = node["package"] or event.get("package") or ""

    def resolve(self, sid: str, role: str, package: str, ts: float) -> dict:
        if role in (DIRECTOR, "main"):
            return self.node(sid, "main", ts)
        for bind_ts, bind_role, key in reversed(self.binds.get(sid, [])):
            if bind_role == role and 0 <= ts - bind_ts <= BIND_WINDOW:
                return self.nodes[key]
        candidates = [
            n
            for n in self.nodes.values()
            if n["session_id"] == sid
            and n["agent_id"] != "main"
            and n["role"] == role
            and n["status"] not in FINAL
        ]
        if package:
            candidates = [
                n for n in candidates if n["package"] == package
            ] or candidates
        if candidates:
            return max(candidates, key=lambda n: n["started"])
        return self.node(sid, f"log:{role}", ts, role)

    def on_status(self, event, ts, sid):
        node = self.resolve(
            sid, event.get("role") or "", event.get("package") or "", ts
        )
        node["last_seen"] = max(node["last_seen"], ts)
        status = event.get("status") or ""
        if status:
            node["status"] = status
            if status in FINAL:
                node["stopped"] = ts
        for field in ("task", "summary", "package"):
            if event.get(field):
                node[field] = event[field]
        if status == "done" and event.get("summary"):
            self.add_chronicle(node, ts, event["summary"])

    def on_budget(self, event, ts, sid):
        lead = event.get("role") or ""
        grant = event.get("budget") or {}
        phase = grant.get("phase") or "Standard"
        current = self.budgets.get(lead)
        if current is None or current["phase"] != phase:
            current = {
                "lead": lead,
                "phase": phase,
                "granted": 0,
                "parallel": 0,
                "since": ts,
            }
            self.budgets[lead] = current
        current["granted"] += int(grant.get("granted") or 0)
        if grant.get("parallel"):
            current["parallel"] = int(grant["parallel"])

    def on_package(self, event, ts, sid):
        key = str(event.get("package") or "")
        item = self.board.setdefault(key, {"id": key})
        for field in ("title", "owner", "status", "milestone"):
            if event.get(field):
                item[field] = event[field]
        item["blocked_by"] = list(event.get("blocked_by") or [])
        item["ts"] = event.get("ts", "")

    def on_decision(self, event, ts, sid):
        key = str(event.get("decision_id") or "")
        item = self.decisions.setdefault(key, {"id": key, "resolved": None})
        if event.get("resolution"):
            item["resolved"] = event["resolution"]
            return
        item.update(
            {
                "for": event.get("for") or "l0",
                "question": event.get("question") or "",
                "recommendation": event.get("recommendation") or "",
                "from": event.get("role") or "",
                "ts": event.get("ts", ""),
                "resolved": None,
            }
        )

    def add_feed(self, event: dict, ts: float, sid: str) -> None:
        if event.get("source") == "log" and event.get("role"):
            role = event["role"]
            department = classify(role)[1]
        else:
            node = self.nodes.get(f"{sid}:{event.get('agent_id') or 'main'}")
            role = node["role"] if node else (event.get("role") or DIRECTOR)
            department = node["department"] if node else classify(role)[1]
        text = next(
            (
                event[f]
                for f in (
                    "tool",
                    "task",
                    "summary",
                    "description",
                    "question",
                    "resolution",
                    "title",
                )
                if event.get(f)
            ),
            "",
        )
        if event.get("kind") == "spawn":
            target = event.get("persona") or event.get("subagent_type") or ""
            text = f"→ {target}: {event.get('description') or ''}"
        self.feed.append(
            {
                "ts": event.get("ts", ""),
                "t": ts,
                "session_id": sid,
                "role": role,
                "department": department,
                "kind": event.get("kind", ""),
                "status": event.get("status", ""),
                "text": _short(text, 140),
            }
        )

    # --- Ergebnis -----------------------------------------------------------

    def result(self, session: str | None, inactive_after: float) -> dict:
        ordered = sorted(self.sessions.values(), key=lambda s: s["last"], reverse=True)
        if session in (None, "", "latest"):
            chosen = ordered[0]["id"] if ordered else None
            scope = {chosen} if chosen else set()
        elif session == "all":
            chosen, scope = "all", {s["id"] for s in ordered}
        else:
            chosen, scope = session, {session}

        views = {
            key: self.view(node, inactive_after) for key, node in self.nodes.items()
        }

        def tree(key: str) -> dict:
            node = dict(views[key])
            children = sorted(
                self.nodes[key]["children"], key=lambda k: self.nodes[k]["started"]
            )
            node["children"] = [tree(k) for k in children]
            return node

        roots = [
            tree(f"{s['id']}:main")
            for s in ordered
            if s["id"] in scope and f"{s['id']}:main" in self.nodes
        ]
        in_scope = [v for v in views.values() if v["session_id"] in scope]
        counts = Counter(v["status"] for v in in_scope)
        counts["inactive"] = sum(1 for v in in_scope if v["inactive"])
        feed = [f for f in self.feed if f["session_id"] in scope]
        chronicle = [c for c in self.chronicle if c["session_id"] in scope]
        return {
            "now": self.now,
            "session": chosen,
            "sessions": ordered,
            "tree": roots,
            "counts": dict(counts),
            "chronicle": sorted(chronicle, key=lambda c: c["t"], reverse=True)[
                :CHRONICLE_SIZE
            ],
            "budgets": self.budget_view(),
            "board": self.board_view(),
            "decisions": sorted(
                (
                    {
                        k: d.get(k, "")
                        for k in (
                            "id",
                            "for",
                            "question",
                            "recommendation",
                            "from",
                            "ts",
                        )
                    }
                    for d in self.decisions.values()
                    if not d.get("resolved")
                ),
                key=lambda d: d["ts"],
            ),
            "feed": sorted(feed, key=lambda f: f["t"], reverse=True)[:FEED_SIZE],
            "pulse": self.pulse(feed),
            "departments": ["studio", *DEPARTMENTS, "extern"],
        }

    def view(self, node: dict, inactive_after: float) -> dict:
        live_children = [c for c in node["children"] if self.nodes[c]["status"] in LIVE]
        status = node["status"]
        if status == "active" and live_children:
            status = "delegated"
        quiet = self.now - node["last_seen"]
        inactive = status in LIVE and not live_children and quiet > inactive_after
        view = {field: node[field] for field in PUBLIC}
        view.update(status=status, inactive=inactive, idle_seconds=round(max(quiet, 0)))
        return view

    def budget_view(self) -> list[dict]:
        leads = set(self.budgets)
        leads |= {
            n["role"] for n in self.nodes.values() if n["level"] == 1 and n["children"]
        }
        rows = []
        for lead in sorted(leads):
            plan = self.budgets.get(
                lead,
                {"phase": "ohne Freigabe", "granted": 0, "parallel": 0, "since": 0.0},
            )
            children = [
                self.nodes[c]
                for n in self.nodes.values()
                if n["role"] == lead
                for c in n["children"]
                if self.nodes[c]["started"] >= plan["since"]
            ]
            spans = sorted(
                (c["started"], c["stopped"] if c["stopped"] is not None else self.now)
                for c in children
            )
            peak = 0
            for start, _ in spans:
                peak = max(peak, sum(1 for s, e in spans if s <= start < e))
            used = len(children)
            rows.append(
                {
                    "lead": lead,
                    "phase": plan["phase"],
                    "granted": plan["granted"],
                    "parallel": plan["parallel"],
                    "used": used,
                    "parallel_used": peak,
                    "overrun": used > plan["granted"] or peak > plan["parallel"],
                    "model_mix": dict(
                        Counter(c["model"] or "inherit" for c in children)
                    ),
                }
            )
        return rows

    def board_view(self) -> list[dict]:
        items = []
        for item in self.board.values():
            row = {
                "id": item["id"],
                "title": item.get("title", ""),
                "owner": item.get("owner", ""),
                "status": item.get("status", "open"),
                "blocked_by": item.get("blocked_by", []),
                "milestone": item.get("milestone", ""),
                "ts": item.get("ts", ""),
            }
            row["blocks"] = sorted(
                other["id"]
                for other in self.board.values()
                if item["id"] in other.get("blocked_by", [])
            )
            items.append(row)
        return sorted(items, key=lambda r: (r["milestone"], r["id"]))

    def pulse(self, feed: list[dict]) -> list[dict]:
        last = int(self.now // 60)
        buckets = {m: Counter() for m in range(last - PULSE_MINUTES + 1, last + 1)}
        for entry in feed:
            minute = int(entry["t"] // 60)
            if minute in buckets:
                buckets[minute][entry["department"]] += 1
        return [
            {
                "minute": datetime.fromtimestamp(m * 60, timezone.utc)
                .astimezone()
                .strftime("%H:%M"),
                "total": sum(c.values()),
                "by": dict(c),
            }
            for m, c in buckets.items()
        ]


def build_state(
    events: list[dict],
    now: float,
    agent_models: dict[str, str],
    session: str | None = None,
    inactive_after: float = INACTIVE_DEFAULT,
) -> dict:
    builder = _Builder(agent_models, now)
    ordered = sorted(
        (e for e in events if isinstance(e, dict)), key=lambda e: parse_ts(e.get("ts"))
    )
    for event in ordered:
        builder.apply(event)
    return builder.result(session, inactive_after)
