"""PreToolUse-Guard: verbietet irreversible Aktionen und schützt die Verfassung.

Regeln: docs/studio/VERFASSUNG.md §6 und §1. Best effort; Fehler lassen zu.
"""

from __future__ import annotations

import json
import os
import re
import shlex
import sys
from collections.abc import Mapping
from pathlib import Path

CONSTITUTION = "docs/studio/VERFASSUNG.md"
GUARD_FILE = "tools/studio/guard.py"
APPROVAL_PHRASE = "VERFASSUNG ÄNDERN"
AGENT_MESSAGE_PREFIXES = ("<task-notification>", "<agent-message")
FILE_TOOLS = ("Edit", "Write", "MultiEdit", "NotebookEdit")
SEPARATORS = {";", "&&", "||", "|", "&", ";;"}
PREFIXES = {"sudo", "env", "command", "nohup", "time", "timeout", "exec"}
KEYWORDS = {"then", "do", "else", "elif", "if", "while", "until", "{", "!"}
VALUE_OPTIONS = {
    "sudo": {"-u", "-g", "-h", "-p", "-C", "-U", "-D", "-R", "-T"}
    | {"--user", "--group", "--host", "--prompt"},
    "timeout": {"-s", "-k"},
    "env": {"-u", "-C"},
    "exec": {"-a"},
}
MARKER_PART = "/.studio/verfassung-ok/"
READ_GIT = {"log", "show", "diff", "status"}
DECLARERS = {"export", "declare", "local", "readonly", "typeset"}
TEMP_ROOTS = ("/tmp", "/private/tmp", "/var/folders", "/private/var/folders")
MAX_DEPTH = 3
HEREDOC = re.compile(r"(?<!<)<<-?\s*['\"]?(\w+)['\"]?")
ASSIGNMENT = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*=")
VARIABLE = re.compile(r"\$(?:\{(\w+)\}|(\w+))")
UNRESOLVED_HEAD = re.compile(r"^\$(\{\w+\}|\w+)/")
SESSION_ID = re.compile(r"^[A-Za-z0-9_-]+$")
FORBIDDEN = "Irreversible Aktion ist verboten"
PROTECTED = "Verfassung und Guard ändert nur der Nutzer (Vorschlag einreihen)"
SUFFIX = " (Verfassung §6)"
PROTECTED_SUFFIX = " (Verfassung §1.3)"
READ_ONLY = {"ls", "cat", "test", "[", "grep", "rg", "head", "tail", "wc"}


def strip_heredocs(command: str) -> str:
    out, lines, index = [], command.split("\n"), 0
    while index < len(lines):
        line = lines[index]
        out.append(line)
        match = HEREDOC.search(line)
        index += 1
        if match:
            end = match.group(1)
            while index < len(lines) and lines[index].strip() != end:
                index += 1
            index += 1
    return "\n".join(out)


def _is_punctuation(token: str) -> bool:
    return bool(token) and all(char in "();<>|&" for char in token)


Segment = tuple[list[str], list[str], list[str], list[str]]


def segments(command: str) -> list[Segment]:
    """Segmente: (Wörter, alle Tokens, Schreibziele, führende Zuweisungen)."""
    lexer = shlex.shlex(
        strip_heredocs(command.replace("\\\n", " ")).replace("\n", " ; "),
        posix=True,
        punctuation_chars=True,
    )
    lexer.whitespace_split = True
    tokens = list(lexer)
    result: list[Segment] = []
    words: list[str] = []
    raw: list[str] = []
    writes: list[str] = []

    def flush() -> None:
        nonlocal words, raw, writes
        clean = list(words)
        assigns: list[str] = []
        while clean:
            word = clean[0]
            if word == "function":
                clean = clean[2:]
            elif ASSIGNMENT.match(word) or word in KEYWORDS:
                if ASSIGNMENT.match(word):
                    assigns.append(word)
                clean = clean[1:]
            elif word in PREFIXES:
                clean = clean[1:]
                while clean and clean[0].startswith("-"):
                    option = clean[0]
                    clean = clean[1:]
                    if option in VALUE_OPTIONS.get(word, ()) and clean:
                        clean = clean[1:]
                if word == "timeout" and clean:
                    clean = clean[1:]
            else:
                break
        if raw:
            result.append((clean, raw, writes, assigns))
        words, raw, writes = [], [], []

    index = 0
    while index < len(tokens):
        token = tokens[index]
        index += 1
        if token in SEPARATORS or (
            _is_punctuation(token) and "<" not in token and ">" not in token
        ):
            flush()
            continue
        raw.append(token)
        if _is_punctuation(token):
            if index < len(tokens):
                target = tokens[index]
                index += 1
                raw.append(target)
                if ">" in token:
                    writes.append(target)
            continue
        words.append(token)
    flush()
    return result


def _short_flags(args: list[str]) -> set[str]:
    flags: set[str] = set()
    for arg in args:
        if arg.startswith("-") and not arg.startswith("--"):
            flags.update(arg[1:])
    return flags


def _has_force(args: list[str]) -> bool:
    return "--force" in args or "f" in _short_flags(args)


def _is_constitution(arg: str, cwd: Path) -> bool:
    text = arg.replace("\\", "/")
    resolved = os.path.normpath(os.path.join(str(cwd), text)).lower()
    return resolved.endswith("/" + CONSTITUTION.lower())


def _is_protected(arg: str, cwd: Path) -> bool:
    text = arg.replace("\\", "/")
    if text.startswith("of="):
        text = text[3:]
    if _is_constitution(text, cwd):
        return True
    resolved = os.path.normpath(os.path.join(str(cwd), text)).lower()
    return resolved.endswith("/" + GUARD_FILE) or MARKER_PART in resolved + "/"


def _expand(arg: str, env: Mapping[str, str]) -> str:
    if arg == "~" or arg.startswith("~/"):
        arg = env.get("HOME", "~") + arg[1:]
    return VARIABLE.sub(lambda m: env.get(m.group(1) or m.group(2), m.group(0)), arg)


def _outside(
    arg: str, root: Path, cwd: Path, env: Mapping[str, str], guard_root: bool = True
) -> bool:
    # Unaufgelöstes `$VAR` bleibt wörtlich und zählt als relativer Pfad in cwd.
    expanded = _expand(arg, env)
    if UNRESOLVED_HEAD.match(expanded):
        return True  # `$VAR/…` am Anfang: Ziel unbekannt
    if expanded.startswith("~") or "${" in expanded:
        return True  # nicht auflösbar (~user, ${…}) → wie ausserhalb behandeln
    path = os.path.normpath(os.path.join(str(cwd), expanded))
    base = os.path.normpath(str(root))
    if guard_root and (path == base or path == base + "/.git"):
        return True  # Repo-Wurzel und History nie löschen
    if path.startswith(base + "/") or (path == base and not guard_root):
        return False
    temps = list(TEMP_ROOTS)
    if env.get("TMPDIR"):
        temps.append(os.path.normpath(env["TMPDIR"]))
    return not any(path == t or path.startswith(t + "/") for t in temps)


def _delete_reason(
    paths: list[str],
    root: Path,
    cwd: Path,
    env: Mapping[str, str],
    allow: bool,
    guard_root: bool = True,
) -> str | None:
    for arg in paths:
        if _outside(arg, root, cwd, env, guard_root):
            return f"{FORBIDDEN}: Löschen ausserhalb des Repos ({arg})"
        if not allow and _is_protected(arg, cwd):
            return PROTECTED
    return None


def _apply_assigns(assigns: list[str], env: dict[str, str]) -> None:
    for assign in assigns:
        key, _, value = assign.partition("=")
        value = _expand(value, env)
        if "$" in value:
            env.pop(key, None)
        else:
            env[key] = value


def _outputs(args: list[str]) -> list[str]:
    found = []
    for index, arg in enumerate(args):
        if arg.startswith("--output="):
            found.append(arg.split("=", 1)[1])
        elif arg == "--output" and index + 1 < len(args):
            found.append(args[index + 1])
    return found


def _git_sub(args: list[str]) -> tuple[str | None, list[str]]:
    index = 0
    while index < len(args) and args[index].startswith("-"):
        with_value = ("-C", "-c", "--git-dir", "--work-tree", "--namespace")
        index += 2 if args[index] in with_value else 1
    if index >= len(args):
        return None, []
    return args[index], args[index + 1 :]


def _git_reason(args: list[str], cwd: Path, allow: bool) -> str | None:
    sub, rest = _git_sub(args)
    if sub is None:
        return None
    shorts = _short_flags(rest)
    if sub == "push":
        for arg in rest:
            if arg.startswith("--force") or arg in ("--mirror", "--delete"):
                return f"{FORBIDDEN}: git push {arg}"
            if arg.startswith("-") and not arg.startswith("--"):
                if set(arg[1:]) & {"f", "d"}:
                    return f"{FORBIDDEN}: git push {arg}"
            elif len(arg) > 1 and arg[0] in "+:":
                return f"{FORBIDDEN}: git push mit Refspec {arg}"
    elif sub == "branch":
        deleting = "d" in shorts or "--delete" in rest
        if "D" in shorts or (deleting and _has_force(rest)):
            return f"{FORBIDDEN}: git branch erzwingendes Löschen"
    elif sub == "rebase":
        if not set(rest) & {"--abort", "--quit", "--continue", "--skip"}:
            return f"{FORBIDDEN}: git rebase"
    elif sub == "reset" and "--hard" in rest:
        return f"{FORBIDDEN}: git reset --hard"
    elif sub in ("filter-branch", "filter-repo"):
        return f"{FORBIDDEN}: git {sub}"
    elif sub == "update-ref" and ("-d" in rest or "--delete" in rest):
        return f"{FORBIDDEN}: git update-ref -d"
    elif sub == "reflog" and rest[:1] and rest[0] in ("expire", "delete"):
        return f"{FORBIDDEN}: git reflog {rest[0]}"
    elif sub == "stash" and rest[:1] and rest[0] in ("clear", "drop"):
        return f"{FORBIDDEN}: git stash {rest[0]}"
    elif sub == "clean" and _has_force(rest):
        return f"{FORBIDDEN}: git clean -f"
    elif sub == "worktree" and rest[:1] == ["remove"] and _has_force(rest):
        return f"{FORBIDDEN}: git worktree remove --force"
    elif sub == "gc" and "--prune=now" in rest:
        return f"{FORBIDDEN}: git gc --prune=now"
    staged_only = (
        sub == "restore"
        and ("--staged" in rest or "S" in shorts)
        and "--worktree" not in rest
        and "W" not in shorts
    )
    if not allow and not staged_only and sub in ("checkout", "restore", "rm", "mv"):
        if any(_is_protected(arg, cwd) for arg in rest):
            return PROTECTED
    return None


def _write_reason(name: str, args: list[str], cwd: Path) -> str | None:
    """Verfassung/Guard schreibend (nur relevant ohne Freigabe)."""
    if not args:
        return None
    hit = [arg for arg in args if _is_protected(arg, cwd)]
    if not hit:
        return None
    if name in ("tee", "truncate", "dd", "mv"):
        return PROTECTED
    if name in ("sed", "perl"):
        in_place = "--in-place" in args or any(
            arg.startswith("-") and not arg.startswith("--") and "i" in arg
            for arg in args
        )
        return PROTECTED if in_place else None
    if name == "cp" and _is_protected(args[-1], cwd):
        return PROTECTED
    return None


def _shell_text(name: str, args: list[str]) -> str | None:
    if name in ("bash", "sh", "zsh"):
        for index, arg in enumerate(args):
            if arg.startswith("-") and not arg.startswith("--") and "c" in arg:
                return args[index + 1] if index + 1 < len(args) else None
        return None
    if name == "eval":
        return " ".join(args)
    return None


def _check(
    command: str,
    root: Path,
    cwd: Path,
    env: Mapping[str, str],
    allow: bool,
    depth: int,
) -> str | None:
    env = dict(env)
    parsed = segments(command)
    has_phrase = any(APPROVAL_PHRASE in t for _, raw, _, _ in parsed for t in raw)
    if has_phrase and any(
        words and os.path.basename(words[0]) == "claude" for words, _, _, _ in parsed
    ):
        return f"{FORBIDDEN}: Freigabe-Formel darf nicht selbst gesendet werden"
    for words, raw, writes, assigns in parsed:
        if not words:
            if not allow and any(_is_protected(t, cwd) for t in writes):
                return PROTECTED
            _apply_assigns(assigns, env)
            continue
        name = os.path.basename(words[0])
        args = words[1:]
        if name == "claude" and any(APPROVAL_PHRASE in arg for arg in args):
            return f"{FORBIDDEN}: Freigabe-Formel darf nicht selbst gesendet werden"
        if not allow:
            if any(_is_protected(t, cwd) for t in writes + _outputs(args)):
                return PROTECTED
            in_marker = MARKER_PART in os.path.normpath(str(cwd)).lower() + "/"
            reading = name in READ_ONLY or (
                name == "git" and _git_sub(args)[0] in READ_GIT
            )
            touched = in_marker or any("verfassung-ok" in t.lower() for t in raw)
            if touched and not reading:
                return PROTECTED
            found = _write_reason(name, args, cwd)
            if found:
                return found
        if name == "cd":
            if args:
                target = os.path.join(str(cwd), _expand(args[0], env))
                cwd = Path(os.path.normpath(target))
            continue
        if name in DECLARERS:
            _apply_assigns([a for a in args if ASSIGNMENT.match(a)], env)
            continue
        found = None
        if name == "git":
            found = _git_reason(args, cwd, allow)
        elif name in ("rm", "rmdir", "unlink", "shred"):
            after_dashes = args[args.index("--") + 1 :] if "--" in args else []
            before = args[: args.index("--")] if "--" in args else args
            paths = [a for a in before if not a.startswith("-")] + after_dashes
            found = _delete_reason(paths, root, cwd, env, allow)
        elif name == "find" and (
            "-delete" in args
            or ("rm" in args and ("-exec" in args or "-execdir" in args))
        ):
            paths = []
            for arg in args:
                if arg.startswith(("-", "(", "!")):
                    break
                paths.append(arg)
            base = os.path.normpath(str(root))
            for arg in paths:
                resolved = os.path.normpath(os.path.join(str(cwd), _expand(arg, env)))
                if resolved == base + "/.git":
                    return f"{FORBIDDEN}: Löschen von .git"
            found = _delete_reason(paths, root, cwd, env, allow, False)
        else:
            text = _shell_text(name, args)
            if text is not None and depth < MAX_DEPTH:
                found = _check(text, root, cwd, env, allow, depth + 1)
        if found:
            return found
    return None


def bash_reason(
    command: str,
    root: Path,
    cwd: Path,
    env: Mapping[str, str],
    allow_constitution: bool,
) -> str | None:
    try:
        return _check(command, root, cwd, env, allow_constitution, 0)
    except ValueError:
        return None


def file_reason(path: str, allow_constitution: bool) -> str | None:
    if allow_constitution:
        return None
    text = os.path.normpath(path.replace("\\", "/")).lower()
    if MARKER_PART in text + "/" or (text + "/").startswith(MARKER_PART[1:]):
        return PROTECTED
    if text.endswith(CONSTITUTION.lower()) or text.endswith(GUARD_FILE):
        return PROTECTED
    return None


def _approved(payload: dict, marker_dir: Path) -> bool:
    if payload.get("agent_id"):
        return False
    session = str(payload.get("session_id", ""))
    return bool(SESSION_ID.match(session)) and (marker_dir / session).exists()


def decide(
    payload: dict, root: Path, marker_dir: Path, env: Mapping[str, str]
) -> str | None:
    allow = _approved(payload, marker_dir)
    tool = payload.get("tool_name")
    data = payload.get("tool_input") or {}
    if tool == "Bash":
        cwd = Path(payload.get("cwd") or root)
        return bash_reason(str(data.get("command", "")), root, cwd, env, allow)
    if tool in FILE_TOOLS:
        path = data.get("file_path") or data.get("notebook_path") or ""
        return file_reason(str(path), allow)
    return None


def deny_text(found: str) -> str:
    """Begründung mit Fundstelle: Schutz der Verfassung §1.3, sonst §6."""
    return found + (PROTECTED_SUFFIX if found == PROTECTED else SUFFIX)


def _record_approval(payload: dict, marker_dir: Path) -> None:
    prompt = str(payload.get("prompt", ""))
    session = str(payload.get("session_id", ""))
    if payload.get("agent_id") or prompt.startswith(AGENT_MESSAGE_PREFIXES):
        return
    if APPROVAL_PHRASE in prompt and SESSION_ID.match(session):
        marker_dir.mkdir(parents=True, exist_ok=True)
        (marker_dir / session).touch()


def main() -> int:
    try:
        from paths import repo_root, studio_home

        payload = json.loads(sys.stdin.read())
        marker_dir = studio_home() / "verfassung-ok"
        event = payload.get("hook_event_name")
        if event == "UserPromptSubmit":
            _record_approval(payload, marker_dir)
        elif event == "PreToolUse":
            found = decide(payload, repo_root(), marker_dir, os.environ)
            if found:
                print(
                    json.dumps(
                        {
                            "hookSpecificOutput": {
                                "hookEventName": "PreToolUse",
                                "permissionDecision": "deny",
                                "permissionDecisionReason": deny_text(found),
                            }
                        },
                        ensure_ascii=False,
                    )
                )
    except Exception:  # noqa: BLE001 - Hooks werfen nie
        return 0
    return 0


if __name__ == "__main__":
    sys.exit(main())
