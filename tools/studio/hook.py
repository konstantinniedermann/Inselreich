"""Claude-Code-Hook: übersetzt Hook-Payloads in Studio-Events.

Wirft nie und blockiert nie; Fehler enden still mit Exit 0.
"""

from __future__ import annotations

import contextlib
import json
import os
import re
import shlex
import subprocess
import sys
from collections.abc import Callable, Mapping
from pathlib import Path

from paths import append_event, now_iso, studio_home

PROMPT_HEAD = 400
MESSAGE_MAX = 600
TASK_MAX = 120
LOG_MARK = "tools/studio/log.py"
AGENT_TOOLS = ("Agent", "Task")
AGENT_MESSAGE_TASK = "Meldung eines Agenten"  # gleicher Text wie in model.py
AGENT_MESSAGE_PREFIXES = ("<task-notification>", "<agent-message")
START_CONTEXT = (
    "Studio-Modus: Diese Hauptsession ist der Studio-Direktor (L0) nach "
    "docs/studio/STUDIO.md. Lies docs/studio/STUDIO.md und docs/studio/state.md; "
    "Dashboard mit `make studio` starten und die URL nennen."
)


def cut(text: object, limit: int) -> str:
    if not isinstance(text, str):
        return ""
    return text if len(text) <= limit else text[:limit] + "…"


def header_value(text: str, key: str) -> str:
    """Wert einer Kopfzeile wie 'Persona: x' oder '- **Paket:** M5-T1'."""
    for raw in text.splitlines():
        line = raw.strip().lstrip("-*#> ").replace("**", "").strip()
        name, sep, value = line.partition(":")
        if sep and name.strip().lower() == key.lower():
            words = value.strip().strip("`").split()
            return words[0].strip("`") if words else ""
    return ""


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


def to_event(p: dict) -> dict | None:
    name = p.get("hook_event_name")
    event = {
        "ts": now_iso(),
        "session_id": str(p.get("session_id") or ""),
        "agent_id": str(p.get("agent_id") or "main"),
        "source": "hook",
    }
    if p.get("agent_type"):
        event["role"] = str(p["agent_type"])
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
        event.update(kind="agent_start", status="active")
    elif name == "SubagentStop":
        event.update(
            kind="agent_stop",
            status="done",
            summary=cut(p.get("last_assistant_message"), MESSAGE_MAX),
        )
    elif name == "PreToolUse" and tool in AGENT_TOOLS:
        prompt = (
            tool_input.get("prompt")
            if isinstance(tool_input.get("prompt"), str)
            else ""
        )
        event.update(
            kind="spawn",
            subagent_type=str(tool_input.get("subagent_type") or "general-purpose"),
            description=cut(tool_input.get("description"), TASK_MAX),
            prompt_head=cut(prompt, PROMPT_HEAD),
            persona=header_value(prompt, "Persona"),
            package=header_value(prompt, "Paket"),
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
    else:
        return None
    return event


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


def main() -> int:
    try:
        payload = json.loads(sys.stdin.read() or "null")
        if not isinstance(payload, dict) or not isinstance(
            payload.get("hook_event_name"), str
        ):
            return 0
        event = to_event(payload)
        if event:
            with contextlib.suppress(Exception):  # Kontext trotzdem ausgeben
                append_event(event)
        if payload["hook_event_name"] == "SessionStart":
            output = {
                "hookSpecificOutput": {
                    "hookEventName": "SessionStart",
                    "additionalContext": START_CONTEXT,
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
