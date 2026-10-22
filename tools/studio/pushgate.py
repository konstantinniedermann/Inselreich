"""PreToolUse-Hook: Push nach main nur nach `push_check` mit Exit 0 für genau diesen Hash (R844 V1).

Ein Bash-Segment `git [Optionen] push …` mit Ziel `main` wird abgewiesen, wenn das letzte
Ereignis `push_check` für den aufgelösten Commit-Hash nicht `exit == 0` hat (D1 schreibt Exit 0).
Force- und Löschformen bleiben Sache von guard.py (verfassungsgeschützt, §1.3), daher eigenes Modul
wie waitguard/modelguard. Fehler lassen zu (Hooks werfen nie).
Plan: docs/superpowers/plans/tool-pushsperre/T01-pushgate.md
"""

from __future__ import annotations

import contextlib
import json
import subprocess
import sys
from collections.abc import Mapping
from pathlib import Path

MODE = "deny"  # Rückfall "warn": Hinweis statt Block (Entscheid per Ruling von L0)
SUFFIX = " (pushgate, R844 V1)"
TAIL_BYTES = 4 * 1024 * 1024
GIT_TIMEOUT = 3
APPROVAL_FILE = "push-freigabe"
MIN_PREFIX = 7
MAIN_REFS = {"main", "refs/heads/main"}
GLOBAL_VALUE_OPTIONS = {"-C", "-c", "--git-dir", "--work-tree", "--namespace"}
PUSH_VALUE_OPTIONS = {"--repo", "-o", "--push-option", "--receive-pack", "--exec"}


def _git(cwd: str, *args: str) -> str | None:
    """Ausgabe eines git-Aufrufs oder None bei Fehler/Timeout."""
    try:
        done = subprocess.run(
            ["git", "-C", cwd, *args],
            capture_output=True,
            text=True,
            timeout=GIT_TIMEOUT,
            check=False,
        )
    except (OSError, subprocess.SubprocessError):
        return None
    return done.stdout.strip() if done.returncode == 0 else None


def _resolve(cwd: str, ref: str) -> str | None:
    out = _git(cwd, "rev-parse", "--verify", "--quiet", f"{ref}^{{commit}}")
    return out if out and len(out) == 40 else None


def split_git_push(words: list[str]) -> tuple[str | None, list[str]] | None:
    """(-C-Verzeichnis, Push-Argumente) für `git … push …`, sonst None."""
    if not words or words[0] != "git":
        return None
    index, directory = 1, None
    while index < len(words) and words[index].startswith("-"):
        if words[index] == "-C" and index + 1 < len(words):
            directory = words[index + 1]
        index += 2 if words[index] in GLOBAL_VALUE_OPTIONS else 1
    if index < len(words) and words[index] == "push":
        return directory, words[index + 1 :]
    return None


def positionals(args: list[str]) -> list[str]:
    """Remote und Refspecs ohne Optionen."""
    found, skip = [], False
    for arg in args:
        if skip:
            skip = False
        elif arg in PUSH_VALUE_OPTIONS:
            skip = True
        elif not arg.startswith("-"):
            found.append(arg)
    return found


def main_sources(args: list[str], cwd: str) -> list[str]:
    """Quellen (Refs/Hashes) aller Refspecs, die nach main zeigen."""
    specs = positionals(args)[1:]
    if not specs:
        branch = _git(cwd, "rev-parse", "--abbrev-ref", "HEAD")
        return ["HEAD"] if branch == "main" else []
    sources = []
    for spec in specs:
        source, colon, target = spec.lstrip("+").partition(":")
        if not colon:
            target = source
        if target in MAIN_REFS and source:
            sources.append(source)
    return sources


def last_check_exit(head: str, events: Path) -> int | None:
    """Exit des letzten `push_check` für den vollen Hash; None = kein Ereignis."""
    try:
        with open(events, "rb") as handle:
            handle.seek(0, 2)
            size = handle.tell()
            handle.seek(max(0, size - TAIL_BYTES))
            data = handle.read()
    except OSError:
        return None
    for raw in reversed(data.decode("utf-8", "replace").splitlines()):
        try:
            event = json.loads(raw)
        except ValueError:
            continue
        if (
            isinstance(event, dict)
            and event.get("kind") == "push_check"
            and event.get("head") == head
        ):
            code = event.get("exit")
            return code if isinstance(code, int) else None
    return None


def deny_text(head: str, code: int | None) -> str:
    shown = "fehlt" if code is None else str(code)
    return (
        f"Push nach main abgewiesen: letzter push_check für {head[:7]} ist Exit {shown} "
        "(R844, Verfassung §7.2). Zuerst «make push-check; echo EXIT=$?» für genau diesen "
        "Hash; bei Exit ≠ 0 an L0 melden, nicht pushen." + SUFFIX
    )


def _approval_reason(head: str, path: Path) -> str | None:
    """Grund der Freigabezeile, wenn ihr Hash-Präfix zu `head` passt; sonst None."""
    try:
        parts = path.read_text(encoding="utf-8").strip().split(None, 1)
    except OSError:
        return None
    if not parts or len(parts[0]) < MIN_PREFIX or not head.startswith(parts[0].lower()):
        return None
    return parts[1] if len(parts) > 1 else ""


def consume_approval(head: str, payload: Mapping) -> bool:
    """Einmal gültige Freigabe prüfen und verbrauchen (Datei löschen, Ereignis)."""
    from paths import append_event, now_iso, studio_home

    path = studio_home() / APPROVAL_FILE
    reason = _approval_reason(head, path)
    if reason is None:
        return False
    used = True
    try:
        path.unlink()
    except OSError:
        used = False
    with contextlib.suppress(Exception):
        append_event(
            {
                "ts": now_iso(),
                "session_id": str(payload.get("session_id") or ""),
                "agent_id": str(payload.get("agent_id") or "main"),
                "source": "hook",
                "kind": "push_freigabe",
                "head": head,
                "reason": reason,
                "used": used,
            }
        )
    return True


def check_source(source: str, cwd: str, payload: Mapping) -> str | None:
    from paths import events_file

    head = _resolve(cwd, source)
    if head is None:
        return f"Push nach main abgewiesen: Hash nicht auflösbar ({source})" + SUFFIX
    code = last_check_exit(head, events_file())
    if code == 0 or consume_approval(head, payload):
        return None
    return deny_text(head, code)


def protect_reason(payload: Mapping) -> str | None:
    """Selbstschutz: Agenten (mit agent_id) legen die Freigabedatei nicht an. Best effort."""
    if not payload.get("agent_id"):
        return None
    data = payload.get("tool_input")
    if not isinstance(data, dict):
        return None
    text = f"{data.get('command') or ''} {data.get('file_path') or ''}"
    if APPROVAL_FILE not in text:
        return None
    return (
        "Freigabe legt nur L0 an: Agenten schreiben `push-freigabe` nicht. Das ist Schutz "
        "gegen Versehen, kein Schutz gegen Absicht (Verfassung §1.3)" + SUFFIX
    )


def bash_reason(payload: Mapping, cwd: str) -> str | None:
    """Grund für die Abweisung oder None."""
    import guard

    data = payload.get("tool_input")
    command = str((data or {}).get("command") or "") if isinstance(data, dict) else ""
    if "push" not in command:
        return None
    for words, _raw, _writes, _assigns in guard.segments(command):
        found = split_git_push(words)
        if found is None:
            continue
        directory, args = found
        where = str(Path(cwd, directory)) if directory else cwd
        for source in main_sources(args, where):
            reason = check_source(source, where, payload)
            if reason:
                return reason
    return None


def _log_block(payload: Mapping, found: str) -> None:
    with contextlib.suppress(Exception):
        from paths import append_event, now_iso

        append_event(
            {
                "ts": now_iso(),
                "session_id": str(payload.get("session_id") or ""),
                "agent_id": str(payload.get("agent_id") or "main"),
                "source": "hook",
                "kind": "guard_block",
                "rule": "push-gate",
                "tool": str(payload.get("tool_name") or ""),
                "persona": str(payload.get("agent_type") or ""),
                "summary": found[:160],
                "blocked": MODE == "deny",
            }
        )


def main() -> int:
    try:
        payload = json.loads(sys.stdin.read() or "null")
        if (
            not isinstance(payload, dict)
            or payload.get("hook_event_name") != "PreToolUse"
        ):
            return 0
        found = protect_reason(payload)
        if not found and payload.get("tool_name") == "Bash":
            found = bash_reason(payload, str(payload.get("cwd") or "."))
        if not found:
            return 0
        _log_block(payload, found)
        if MODE == "deny":
            out = {
                "hookEventName": "PreToolUse",
                "permissionDecision": "deny",
                "permissionDecisionReason": found,
            }
            print(json.dumps({"hookSpecificOutput": out}, ensure_ascii=False))
        else:
            out = {"hookEventName": "PreToolUse", "additionalContext": found}
            print(
                json.dumps(
                    {"hookSpecificOutput": out, "systemMessage": found},
                    ensure_ascii=False,
                )
            )
    except Exception:  # noqa: BLE001 - Hooks werfen nie
        return 0
    return 0


if __name__ == "__main__":
    sys.exit(main())
