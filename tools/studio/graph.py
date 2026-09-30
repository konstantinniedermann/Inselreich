"""Prozess-Graph einer Session: Zeilen, Läufe, Spalten und Spuren.

Regeln: docs/superpowers/specs/2026-09-30-studio-prozessgraph-design.md (P3–P7,
P21–P25, P31–P38). Reine Funktionen ohne Zugriff auf Dateien oder Uhrzeit.
"""

from __future__ import annotations

from datetime import datetime, timezone

GRAPH_ROWS = 300
PAUSE_GAP = 300.0
MESSAGE_TEXT_MAX = 160
FOLD_WINDOW = 30.0  # gleich wie model.BIND_WINDOW
ROW_STATUSES = frozenset({"done", "blocked", "waiting", "failed"})


def short(text: object, limit: int = MESSAGE_TEXT_MAX) -> str:
    text = " ".join(str(text or "").split())
    return text if len(text) <= limit else text[:limit] + "…"


def clock(t: float) -> str:
    return datetime.fromtimestamp(t, timezone.utc).astimezone().strftime("%H:%M")


class Layout:
    """Zeilen und Läufe einer Session (Durchlauf 1, ohne Namen und Spalten).

    ``records``: Ereignisliste des Modells in Event-Reihenfolge, je Eintrag
    ``{"i", "kind", "t", "ts", "key", …}``. ``info``: sichtbare Knoten der Session
    (ohne stop-only-Knoten) mit ``agent_id``, ``role``, ``department``, ``parent``,
    ``base_name``, ``task``, ``first`` = (t, ts, i).
    """

    def __init__(self, sid: str, records: list[dict], info: dict[str, dict]) -> None:
        self.sid = sid
        self.info = info
        self.main = f"{sid}:main"
        self.rows: list[dict] = []
        self.runs: dict[str, list[list]] = {key: [] for key in info}
        self._last_message: dict[str, int] = {}
        self._used_for_resume: set[int] = set()
        self._build(records)

    # --- Empfänger (P2, P38) --------------------------------------------------

    def resolve(self, to: str) -> str | None:
        target = str(to or "").strip()
        if not target:
            return None
        if target == "main":
            return self.main
        head = target.split(" [", 1)[0].strip()
        if f"{self.sid}:{head}" in self.info:
            return f"{self.sid}:{head}"
        hits = [
            key
            for key, node in self.info.items()
            if head in (node["role"], node["base_name"])
        ]
        return hits[0] if len(hits) == 1 else None

    # --- Durchlauf 1: Zeilen und Läufe (P3, P22, P32, P37) -------------------

    def _build(self, records: list[dict]) -> None:
        records = [r for r in records if r["key"] in self.info]
        folded_status, stop_text = self._done_folds(records)
        ordered = self._children_with_order(records)
        first_start = {}
        for rec in records:
            if rec["kind"] == "agent_start" and not rec.get("resume"):
                first_start.setdefault(rec["key"], rec["i"])
        for rec in self._with_first_events(records, ordered, first_start):
            kind, key = rec["kind"], rec["key"]
            if kind == "session_start":
                self._session_start(rec)
            elif kind == "session_end":
                self._session_end(rec)
            elif kind == "spawn":
                self._spawn(rec)
            elif kind == "agent_start":
                self._agent_start(rec, key in ordered)
            elif kind == "first":
                self._first_row(rec)
            elif kind == "agent_stop":
                self._agent_stop(rec, stop_text.get(rec["i"]))
            elif kind == "message":
                self._message(rec)
            elif kind == "status" and rec["i"] not in folded_status:
                self._status(rec)
        for key, node in self.info.items():
            if node["log_only"]:
                self._close_log_only(key)

    def _children_with_order(self, records: list[dict]) -> set[str]:
        return {
            r["child"]
            for r in records
            if r["kind"] == "spawn" and r.get("child") in self.info
        }

    def _with_first_events(
        self, records: list[dict], ordered: set[str], first_start: dict[str, int]
    ) -> list[dict]:
        """Knoten ohne agent_start und ohne Auftrag bekommen eine start-Zeile (P22)."""
        extra = []
        for key, node in self.info.items():
            if key == self.main or node["log_only"]:
                continue
            if key in ordered or key in first_start:
                continue
            t, ts, i = node["first"]
            extra.append({"i": i, "kind": "first", "t": t, "ts": ts, "key": key})
        return sorted(records + extra, key=lambda r: (r["i"], r["kind"] != "first"))

    def _done_folds(self, records: list[dict]) -> tuple[set[int], dict[int, str]]:
        """status done ≤ 30 s vor dem agent_stop desselben Knotens faltet (P3)."""
        folded: set[int] = set()
        texts: dict[int, str] = {}
        for stop in records:
            if stop["kind"] != "agent_stop":
                continue
            candidates = [
                r
                for r in records
                if r["kind"] == "status"
                and r["key"] == stop["key"]
                and r.get("status") == "done"
                and r["i"] < stop["i"]
                and 0 <= stop["t"] - r["t"] <= FOLD_WINDOW
                and r["i"] not in folded
            ]
            if candidates:
                done = candidates[-1]
                folded.add(done["i"])
                texts[stop["i"]] = done.get("summary") or done.get("task") or ""
        return folded, texts

    def _add(self, rec: dict, kind: str, key: str, **fields) -> int:
        row = {
            "kind": kind,
            "t": rec["t"],
            "ts": rec["ts"],
            "aid": rec.get("aid") or self.info[key]["agent_id"],
            "from": key,
            "to": None,
            "text": "",
            "status": "",
            **fields,
        }
        self.rows.append(row)
        index = len(self.rows) - 1
        if not self.runs[self.main]:
            self.runs[self.main].append([index, None])  # P22: Spalte 0 ab erster Zeile
        return index

    def _open_run(self, key: str, index: int) -> None:
        runs = self.runs[key]
        if not runs or runs[-1][1] is not None:
            runs.append([index, None])

    def _is_open(self, key: str) -> bool:
        runs = self.runs[key]
        return bool(runs) and runs[-1][1] is None

    def _close(self, key: str, index: int) -> None:
        if self._is_open(key):
            self.runs[key][-1][1] = index

    def _start_text(self, key: str) -> str:
        return self.info[key]["task"] or "Start"

    def _first_row(self, rec: dict) -> None:
        key = rec["key"]
        self._open_run(key, self._add(rec, "start", key, text=self._start_text(key)))

    def _session_start(self, rec: dict) -> None:
        if not self.runs[self.main]:
            index = self._add(rec, "start", self.main, text="Session beginnt")
            self._open_run(self.main, index)
        elif not self._is_open(self.main):
            index = self._add(rec, "resume", self.main, text="Fortsetzung")
            self._open_run(self.main, index)

    def _session_end(self, rec: dict) -> None:
        index = self._add(rec, "end", self.main, text="Session beendet")
        for key in self.runs:
            if not self.info[key]["log_only"]:
                self._close(key, index)

    def _spawn(self, rec: dict) -> None:
        child = rec.get("child")
        if child not in self.info or self._is_open(child):
            return
        parent = self.info[child]["parent"] or self.main
        index = self._add(
            rec,
            "order",
            parent if parent in self.info else self.main,
            to=child,
            text=rec.get("description") or "",
            aid=self.info[rec["key"]]["agent_id"],
        )
        self._open_run(child, index)

    def _agent_start(self, rec: dict, has_order: bool) -> None:
        key = rec["key"]
        if not rec.get("resume"):
            if not has_order and not self._is_open(key):
                index = self._add(rec, "start", key, text=self._start_text(key))
                self._open_run(key, index)
            return
        if self._is_open(key):
            return
        message = self._last_message.get(key)
        if (
            message is not None
            and message not in self._used_for_resume
            and 0 <= rec["t"] - self.rows[message]["t"] <= FOLD_WINDOW
        ):
            self._used_for_resume.add(message)
            self._open_run(key, message)
            return
        self._open_run(key, self._add(rec, "resume", key, text="Fortsetzung"))

    def _agent_stop(self, rec: dict, folded_text: str | None) -> None:
        key = rec["key"]
        if not self._is_open(key):
            return
        parent = self.info[key]["parent"] or self.main
        index = self._add(
            rec,
            "report",
            key,
            to=parent if parent in self.info else self.main,
            text=folded_text or rec.get("summary") or "fertig",
        )
        self._close(key, index)

    def _message(self, rec: dict) -> None:
        target = self.resolve(rec.get("to", ""))
        index = self._add(
            rec,
            "message",
            rec["key"],
            to=target or "?",
            text=rec.get("text") or "",
            raw_to=str(rec.get("to") or "").strip(),
        )
        if target is not None:
            self._last_message[target] = index

    def _status(self, rec: dict) -> None:
        key, status = rec["key"], rec.get("status") or ""
        text = rec.get("task") or rec.get("summary") or ""
        if self.info[key]["log_only"] and not self.runs[key]:
            if status in ROW_STATUSES:
                index = self._add(rec, "status", key, text=text, status=status)
            else:
                index = self._add(rec, "start", key, text=text or "Start")
            self._open_run(key, index)
            return
        if status in ROW_STATUSES:
            index = self._add(rec, "status", key, text=text, status=status)
            if self.info[key]["log_only"]:
                self._open_run(key, index)

    def _close_log_only(self, key: str) -> None:
        own = [i for i, row in enumerate(self.rows) if row["from"] == key]
        if own:
            self.runs[key] = [[own[0], own[-1]]]

    # --- Zeiten für die Instanznummern (P21) ---------------------------------

    def run_times(self) -> dict[str, list[tuple[float, float | None]]]:
        return {
            key: [
                (self.rows[a]["t"], None if b is None else self.rows[b]["t"])
                for a, b in runs
            ]
            for key, runs in self.runs.items()
        }


def instances(info: dict[str, dict], run_times: dict[str, list]) -> dict[str, int]:
    """Feste Instanznummer je Knoten (P9, P21), Läufe nach P37."""

    def first(key: str) -> float:
        runs = run_times.get(key) or []
        return runs[0][0] if runs else info[key]["first"][0]

    def holds(key: str, t: float) -> bool:
        return any(a <= t and (b is None or t < b) for a, b in run_times.get(key) or [])

    numbers: dict[str, int] = {}
    for key in sorted(info, key=lambda k: (first(k), k)):
        if info[key]["agent_id"] == "main":
            numbers[key] = 1
            continue
        t, role = first(key), info[key]["role"]
        held = {
            numbers[other]
            for other in numbers
            if info[other]["role"] == role
            and info[other]["agent_id"] != "main"
            and holds(other, t)
        }
        number = 1
        if held:
            number = 2
            while number in held:
                number += 1
        numbers[key] = number
    return numbers
