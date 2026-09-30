"""Token-Messung je Modell aus Claude-Code-Transkripten (JSONL).

Nur Standardbibliothek. Fehler werfen nie nach aussen: fehlende oder kaputte
Dateien liefern leere Ergebnisse.
"""

import json
import os
from pathlib import Path

FIELDS = (
    ("input", "input_tokens"),
    ("cache_write", "cache_creation_input_tokens"),
    ("cache_read", "cache_read_input_tokens"),
    ("output", "output_tokens"),
)


class Accumulator:
    """Sammelt je Message-ID die Maxima der Token-Felder."""

    def __init__(self):
        # id -> {"model", "complete", "input", "cache_write", ...}
        self.messages = {}

    def feed_line(self, raw, main_only=False):
        try:
            if isinstance(raw, bytes):
                raw = raw.decode("utf-8", errors="replace")
            entry = json.loads(raw)
            if not isinstance(entry, dict) or entry.get("type") != "assistant":
                return
            if main_only and entry.get("isSidechain") is True:
                return
            message = entry.get("message")
            if not isinstance(message, dict):
                return
            mid, model = message.get("id"), message.get("model")
            used = message.get("usage")
            if not mid or not model or not isinstance(used, dict):
                return
            record = self.messages.setdefault(
                mid,
                {"model": model, "complete": False, **{k: 0 for k, _ in FIELDS}},
            )
            for key, source in FIELDS:
                value = used.get(source)
                if isinstance(value, int) and value > record[key]:
                    record[key] = value
            if message.get("stop_reason"):
                record["complete"] = True
        except (ValueError, TypeError, AttributeError):
            return

    def summary(self):
        result = {}
        for record in self.messages.values():
            entry = result.setdefault(
                record["model"],
                {**{k: 0 for k, _ in FIELDS}, "messages": 0, "complete": 0},
            )
            for key, _ in FIELDS:
                entry[key] += record[key]
            entry["messages"] += 1
            entry["complete"] += 1 if record["complete"] else 0
        return result

    def to_json(self):
        return {"messages": self.messages}

    @classmethod
    def from_json(cls, data):
        acc = cls()
        try:
            for mid, record in data["messages"].items():
                acc.messages[mid] = {
                    "model": str(record["model"]),
                    "complete": bool(record["complete"]),
                    **{k: int(record[k]) for k, _ in FIELDS},
                }
        except (KeyError, TypeError, ValueError, AttributeError):
            return cls()
        return acc


def transcript_usage(path, main_only=False):
    try:
        acc = Accumulator()
        with open(path, "rb") as handle:
            for line in handle:
                acc.feed_line(line, main_only)
        return acc.summary()
    except OSError:
        return {}


def _load_cache(cache):
    try:
        data = json.loads(Path(cache).read_text("utf-8"))
        return int(data["offset"]), data["inode"], Accumulator.from_json(data["acc"])
    except (OSError, ValueError, KeyError, TypeError):
        return 0, None, Accumulator()


def incremental_usage(path, cache):
    try:
        stat = os.stat(path)
    except OSError:
        return {}
    offset, inode, acc = _load_cache(cache)
    if inode != stat.st_ino or stat.st_size < offset:
        offset, acc = 0, Accumulator()
    try:
        with open(path, "rb") as handle:
            handle.seek(offset)
            data = handle.read()
    except OSError:
        return acc.summary()
    end = data.rfind(b"\n") + 1  # nur vollständige Zeilen
    for line in data[:end].splitlines():
        acc.feed_line(line, main_only=True)
    try:
        tmp = Path(str(cache) + ".tmp")
        tmp.write_text(
            json.dumps(
                {"offset": offset + end, "inode": stat.st_ino, "acc": acc.to_json()}
            ),
            "utf-8",
        )
        os.replace(tmp, cache)
    except OSError:
        pass
    return acc.summary()


def subagent_transcript(transcript_path, agent_id):
    path = Path(transcript_path)
    name = f"agent-{agent_id}.jsonl"
    if path.parent.name == "subagents":
        return path.parent / name
    return path.with_suffix("") / "subagents" / name


def session_cost(path):
    last = None
    try:
        with open(path, "rb") as handle:
            for line in handle:
                if b"cost-state" not in line:
                    continue
                try:
                    entry = json.loads(line)
                except ValueError:
                    continue
                if isinstance(entry, dict) and entry.get("type") == "cost-state":
                    last = entry
    except OSError:
        return None
    if last is None:
        return None
    models = {}
    for name, item in (last.get("modelUsage") or {}).items():
        if not isinstance(item, dict):
            continue
        models[name] = {
            "input": item.get("inputTokens"),
            "output": item.get("outputTokens"),
            "cache_read": item.get("cacheReadInputTokens"),
            "cache_write": item.get("cacheCreationInputTokens"),
            "usd": item.get("costUSD"),
        }
    return {
        "total_usd": last.get("totalCostUSD"),
        "duration_ms": last.get("totalDuration"),
        "models": models,
    }


def is_lower_bound(summary):
    return any(item["complete"] < item["messages"] for item in summary.values())
