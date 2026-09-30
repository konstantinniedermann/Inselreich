"""Claude-Code-Hook: übersetzt Hook-Payloads in Studio-Events.

Wirft nie und blockiert nie; Fehler enden still mit Exit 0.
"""

from __future__ import annotations

import contextlib
import hashlib
import json
import os
import re
import shlex
import subprocess
import sys
import time
from collections.abc import Callable, Mapping
from pathlib import Path

import context
import limits
import studio_docs
import usage
from model import EventStore, pending_incidents
from paths import (
    agents_dir,
    append_event,
    archive_dir,
    docs_dir,
    events_file,
    now_iso,
    studio_home,
)

PROMPT_HEAD = 400
MESSAGE_MAX = 600
TASK_MAX = 120
LOG_MARK = "tools/studio/log.py"
AGENT_TOOLS = ("Agent", "Task")
MESSAGE_TOOL = "SendMessage"
MESSAGE_TEXT_MAX = 160
MESSAGE_TO_MAX = 120
AGENT_MESSAGE_TASK = "Meldung eines Agenten"  # gleicher Text wie in model.py
AGENT_MESSAGE_PREFIXES = ("<task-notification>", "<agent-message")
SAFE_RE = re.compile(r"[^A-Za-z0-9_-]")
START_CONTEXT = (
    "Studio-Modus: Diese Hauptsession ist der Studio-Direktor (L0) nach "
    "docs/studio/STUDIO.md. Lies docs/studio/STUDIO.md und docs/studio/state.md; "
    "Dashboard mit `make studio` starten und die URL nennen."
)


def cut(text: object, limit: int) -> str:
    if not isinstance(text, str):
        return ""
    return text if len(text) <= limit else text[:limit] + "…"


def header_text(text: str, key: str) -> str:
    """Voller Wert einer Kopfzeile wie 'Schätzung: 20 min, 30 Tools'."""
    for raw in text.splitlines():
        line = raw.strip().lstrip("-*#> ").replace("**", "").strip()
        name, sep, value = line.partition(":")
        if sep and name.strip().lower() == key.lower():
            return value.strip().strip("`").strip()
    return ""


def header_value(text: str, key: str) -> str:
    """Erstes Wort einer Kopfzeile wie 'Persona: x' oder '- **Paket:** M5-T1'."""
    words = header_text(text, key).split()
    return words[0].strip("`") if words else ""


def _number(text: str) -> int | float:
    """'0,6' → 0.6, '20' → 20 (ganze Zahlen bleiben int)."""
    value = float(text.replace(",", "."))
    return int(value) if value.is_integer() else value


def parse_estimate(value: str) -> dict | None:
    minutes = re.search(r"(\d+(?:[.,]\d+)?)\s*min", value, re.IGNORECASE)
    tools = re.search(r"(\d+)\s*(?:tools?|werkzeug)", value, re.IGNORECASE)
    if not minutes and not tools:
        return None
    return {
        "minutes": _number(minutes.group(1)) if minutes else None,
        "tools": int(tools.group(1)) if tools else None,
    }


def message_fields(tool_input: dict) -> dict:
    """Empfänger und erste Zeile einer SendMessage; ``summary`` wird nie gespeichert."""
    raw_to = tool_input.get("to")
    to = "" if raw_to is None else cut(str(raw_to), MESSAGE_TO_MAX)
    message = tool_input.get("message")
    first = message.strip().split("\n", 1)[0] if isinstance(message, str) else ""
    return {"to": to, "text": cut(" ".join(first.split()), MESSAGE_TEXT_MAX)}


def log_args(command: str) -> dict:
    try:
        words = shlex.split(command)
    except ValueError:
        return {"role": "", "package": ""}
    found = {"role": "", "package": ""}
    for index, word in enumerate(words[:-1]):
        if word in ("--role", "--package"):
            found[word[2:]] = words[index + 1]
    return found


def to_event(p: dict, handbook: str = "", personas: dict | None = None) -> dict | None:
    name = p.get("hook_event_name")
    event = {
        "ts": now_iso(),
        "session_id": str(p.get("session_id") or ""),
        "agent_id": str(p.get("agent_id") or "main"),
        "source": "hook",
        "handbook_version": handbook,
    }
    if p.get("agent_type"):
        event["role"] = str(p["agent_type"])

    def persona_version(role: str) -> str:
        info = (personas or {}).get(role)
        return str(info.get("version", "")) if isinstance(info, dict) else ""

    tool = p.get("tool_name", "")
    tool_input = p.get("tool_input") if isinstance(p.get("tool_input"), dict) else {}

    if name == "SessionStart":
        event.update(
            kind="session_start", status="idle", model=str(p.get("model") or "")
        )
    elif name == "SessionEnd":
        event.update(
            kind="session_end", status="ended", summary=str(p.get("reason") or "")
        )
    elif name == "UserPromptSubmit":
        prompt = p.get("prompt") if isinstance(p.get("prompt"), str) else ""
        if prompt.strip().startswith(AGENT_MESSAGE_PREFIXES):
            task = AGENT_MESSAGE_TASK
        else:
            task = cut(prompt.strip().split("\n", 1)[0], TASK_MAX)
        event.update(kind="prompt", status="active", task=task)
    elif name == "Stop":
        event.update(
            kind="turn_end",
            status="idle",
            summary=cut(p.get("last_assistant_message"), MESSAGE_MAX),
        )
    elif name == "SubagentStart":
        event.update(
            kind="agent_start",
            status="active",
            persona_version=persona_version(event.get("role", "")),
        )
    elif name == "SubagentStop":
        event.update(
            kind="agent_stop",
            status="done",
            summary=cut(p.get("last_assistant_message"), MESSAGE_MAX),
            persona_version=persona_version(event.get("role", "")),
        )
    elif name == "PreToolUse" and tool in AGENT_TOOLS:
        prompt = (
            tool_input.get("prompt")
            if isinstance(tool_input.get("prompt"), str)
            else ""
        )
        persona = header_value(prompt, "Persona")
        event.update(
            kind="spawn",
            subagent_type=str(tool_input.get("subagent_type") or "general-purpose"),
            description=cut(tool_input.get("description"), TASK_MAX),
            prompt_head=cut(prompt, PROMPT_HEAD),
            persona=persona,
            package_id=header_value(prompt, "Paket"),
            milestone=header_value(prompt, "Meilenstein"),
            estimate=parse_estimate(header_text(prompt, "Schätzung")),
            persona_version=persona_version(persona),
            model=str(tool_input.get("model") or ""),
            tool_use_id=str(p.get("tool_use_id") or ""),
            background=bool(tool_input.get("run_in_background")),
        )
    elif (
        name == "PreToolUse"
        and tool == "Bash"
        and LOG_MARK in str(tool_input.get("command", ""))
    ):
        event.update(kind="bind", **log_args(str(tool_input["command"])))
    elif name == "PreToolUse" and tool == MESSAGE_TOOL:
        event.update(kind="message", **message_fields(tool_input))
    elif name == "PreToolUse":
        event.update(kind="heartbeat", tool=str(tool))
    elif name == "PostToolUse" and tool in AGENT_TOOLS:
        response = p.get("tool_response")
        child = response.get("agentId") if isinstance(response, dict) else None
        if not child:
            return None
        event.update(
            kind="spawned",
            child_id=str(child),
            tool_use_id=str(p.get("tool_use_id") or ""),
        )
        for key, source in (
            ("duration_ms", "totalDurationMs"),
            ("tool_count", "totalToolUseCount"),
            ("resolved_model", "resolvedModel"),
        ):
            if response.get(source) is not None:  # totalTokens bewusst ignoriert
                event[key] = response[source]
        if response.get("status") is not None:
            event["status"] = str(response["status"])
    else:
        return None
    return event


def safe_name(value: object, fallback: str = "x") -> str:
    return SAFE_RE.sub("", str(value or ""))[:60] or fallback


def archive_text(folder: str, filename: str, text: str) -> str:
    """Schreibt nach archiv/<folder>/<filename>; liefert den Pfad ab archiv/."""
    target = archive_dir() / folder / filename
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(text, encoding="utf-8")
    return f"{folder}/{filename}"


def stamp() -> str:
    return time.strftime("%Y%m%d-%H%M%S", time.gmtime())


def _spawn_extras(event: dict, payload: dict) -> None:
    tool_input = payload.get("tool_input")
    prompt = tool_input.get("prompt") if isinstance(tool_input, dict) else None
    if not isinstance(prompt, str) or not prompt:
        return
    who = safe_name(event.get("persona") or event.get("subagent_type"), "agent")
    tail = safe_name(str(event.get("tool_use_id", ""))[-8:], "0")
    event["briefing"] = archive_text("briefings", f"{stamp()}-{who}-{tail}.md", prompt)


def _stop_extras(event: dict, payload: dict) -> None:
    agent = safe_name(payload.get("agent_id"), "agent")
    role = safe_name(event.get("role"), "agent")
    message = payload.get("last_assistant_message")
    if isinstance(message, str) and message:
        with contextlib.suppress(Exception):
            event["report"] = archive_text(
                "berichte", f"{stamp()}-{role}-{agent}.md", message
            )
    try:
        explicit = payload.get("agent_transcript_path")
        if isinstance(explicit, str) and explicit:
            path = Path(explicit)
        else:
            path = usage.subagent_transcript(payload["transcript_path"], agent)
        event["usage"] = usage.transcript_usage(path) or None
    except Exception:  # noqa: BLE001 — Messung darf den Hook nie kippen
        event["usage"] = None


def _usage_event(event: dict, payload: dict) -> dict | None:
    sid = str(payload.get("session_id") or "")
    transcript = payload.get("transcript_path")
    if SAFE_RE.sub("", sid) != sid or not sid or not isinstance(transcript, str):
        return None
    cache = studio_home() / "usage" / f"{sid}.json"
    cache.parent.mkdir(parents=True, exist_ok=True)
    extra: dict = {
        "ts": now_iso(),
        "session_id": sid,
        "agent_id": "main",
        "source": "hook",
        "handbook_version": event.get("handbook_version", ""),
        "kind": "usage",
        "usage": usage.incremental_usage(transcript, cache),
    }
    if payload.get("hook_event_name") == "SessionEnd":
        extra["session_cost"] = usage.session_cost(transcript)
    return extra


def enrich(event: dict, payload: dict) -> list[dict]:
    """Ergänzt Archiv-Verweise und Messwerte; jede Teiloperation einzeln abgesichert."""
    events = [event]
    kind = event.get("kind")
    if kind == "spawn":
        with contextlib.suppress(Exception):
            _spawn_extras(event, payload)
    elif kind == "agent_stop" and payload.get("agent_id"):
        with contextlib.suppress(Exception):
            _stop_extras(event, payload)
    elif kind in ("turn_end", "session_end") and not payload.get("agent_id"):
        with contextlib.suppress(Exception):
            extra = _usage_event(event, payload)
            if extra:
                events.append(extra)
    return events


def open_incidents() -> list[dict]:
    return pending_incidents(EventStore(events_file()).events(), time.time())


def mark_incidents(sid: str, incidents: list[dict]) -> list[dict]:
    """Legt Marken an; liefert die Vorfälle, die in dieser Session neu sind."""
    marks = studio_home() / "notified" / sid
    fresh = []
    for incident in incidents:
        mark = hashlib.sha1(str(incident.get("id")).encode("utf-8")).hexdigest()[:12]
        try:
            marks.mkdir(parents=True, exist_ok=True)
            os.close(os.open(marks / mark, os.O_CREAT | os.O_EXCL | os.O_WRONLY))
        except FileExistsError:
            continue
        fresh.append(incident)
    return fresh


def valid_session(payload: dict) -> str:
    sid = str(payload.get("session_id") or "")
    return sid if sid and SAFE_RE.sub("", sid) == sid else ""


def incident_notice(payload: dict, incidents: list[dict] | None = None) -> str:
    """Hinweis auf offene Vorfälle, je Session und Vorfall einmal."""
    sid = valid_session(payload)
    if payload.get("agent_id") or not sid:
        return ""
    if incidents is None:
        incidents = open_incidents()
    fresh = mark_incidents(sid, incidents)
    if not fresh:
        return ""
    texts = "; ".join(str(i.get("text", "")) for i in fresh)
    return "Ad-hoc-Retro fällig (Handbuch, Verbesserungsschleife): " + texts


def limits_notice(payload: dict, now: float | None = None) -> str:
    """Limit-Zeile für L0 (Hauptsession); ohne frische Werte „nicht gemessen“."""
    if payload.get("agent_id"):
        return ""
    now = time.time() if now is None else now
    data = limits.read_fresh(studio_home() / "limits.json", now, limits.HOOK_MAX_AGE)
    return (limits.summary(data) if data else "") or limits.NOT_MEASURED_LINE


def prompt_context(payload: dict) -> str:
    """Zusatzkontext bei UserPromptSubmit: Vorfall-Hinweis und Limit-Zeile."""
    lines = []
    for notice in (incident_notice, limits_notice):
        with contextlib.suppress(Exception):
            text = notice(payload)
            if text:
                lines.append(text)
    return "\n".join(lines)


def start_context(port: str, sid: str = "") -> str:
    try:
        incidents = open_incidents()
        text = context.build_context(docs_dir(), incidents, port)
    except Exception:  # noqa: BLE001
        return START_CONTEXT
    if sid:
        with contextlib.suppress(Exception):  # im Kontext gelistete Vorfälle
            mark_incidents(sid, incidents[: context.LIST_MAX])
    return text


def start_background(env: Mapping[str, str]) -> None:
    if env.get("STUDIO_NO_SERVER") in ("1", "true", "yes"):
        return
    here = Path(__file__).resolve().parent
    launch_detached(["bash", str(here / "start.sh")])
    launch_detached([sys.executable, str(here / "ci.py")])


def launch_detached(args: list[str]) -> None:
    subprocess.Popen(
        args,
        stdin=subprocess.DEVNULL,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        start_new_session=True,
    )


def maybe_open_dashboard(
    payload: dict,
    env: Mapping[str, str],
    platform: str,
    launch: Callable[[list[str]], None],
) -> bool:
    """Öffnet das Dashboard beim ersten Subagenten-Start der Hauptsession (einmal je Session)."""
    if (
        payload.get("hook_event_name") != "PreToolUse"
        or payload.get("tool_name") not in AGENT_TOOLS
        or payload.get("agent_id")
    ):
        return False
    if env.get("STUDIO_NO_BROWSER") or env.get("CLAUDE_CODE_ENTRYPOINT", "").startswith(
        "sdk"
    ):
        return False
    opener = {"darwin": "open", "linux": "xdg-open"}.get(platform)
    session_id = payload.get("session_id")
    if not opener or not isinstance(session_id, str):
        return False
    if not re.fullmatch(r"[A-Za-z0-9_-]+", session_id):
        return False
    marker_dir = studio_home() / "opened"
    marker_dir.mkdir(parents=True, exist_ok=True)
    try:
        os.close(os.open(marker_dir / session_id, os.O_CREAT | os.O_EXCL | os.O_WRONLY))
    except FileExistsError:
        return False
    port = env.get("STUDIO_PORT", "")
    port = port if port.isascii() and port.isdigit() else "8765"
    url = f"http://127.0.0.1:{port}/?session={session_id}"
    start_sh = str(Path(__file__).resolve().parent / "start.sh")
    launch(
        ["bash", "-c", 'bash "$1" && "$2" "$3"', "studio-open", start_sh, opener, url]
    )
    return True


def load_versions(payload: dict) -> tuple[str, dict | None]:
    """Handbuch-Version immer, Persona-Metadaten nur wo gebraucht."""
    handbook, personas = "", None
    with contextlib.suppress(Exception):
        handbook = studio_docs.read_version(docs_dir() / "STUDIO.md")
        name = payload.get("hook_event_name")
        if name in ("SubagentStart", "SubagentStop") or (
            name == "PreToolUse" and payload.get("tool_name") in AGENT_TOOLS
        ):
            personas = studio_docs.persona_meta(agents_dir())
    return handbook, personas


def main() -> int:
    try:
        payload = json.loads(sys.stdin.read() or "null")
        if not isinstance(payload, dict) or not isinstance(
            payload.get("hook_event_name"), str
        ):
            return 0
        name = payload["hook_event_name"]
        handbook, personas = load_versions(payload)
        event = to_event(payload, handbook, personas)
        if event:
            events = [event]
            with contextlib.suppress(Exception):
                events = enrich(event, payload)
            for item in events:
                with contextlib.suppress(Exception):  # Kontext trotzdem ausgeben
                    append_event(item)
        port = os.environ.get("STUDIO_PORT", "")
        port = port if port.isascii() and port.isdigit() else "8765"
        text = ""
        if name == "SessionStart":
            text = start_context(port, valid_session(payload))
            with contextlib.suppress(Exception):
                start_background(os.environ)
        elif name == "UserPromptSubmit":
            text = prompt_context(payload)
        if text:
            output = {
                "hookSpecificOutput": {
                    "hookEventName": name,
                    "additionalContext": text,
                }
            }
            print(json.dumps(output, ensure_ascii=False))
        with contextlib.suppress(Exception):
            maybe_open_dashboard(payload, os.environ, sys.platform, launch_detached)
    except Exception:  # noqa: BLE001 — ein Hook darf die Session nie stören
        return 0
    return 0


if __name__ == "__main__":
    sys.exit(main())
