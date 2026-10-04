"""Effizienz-Messung aus Claude-Code-Transkripten (JSONL): wo gehen Tokens hin?

Nur Standardbibliothek. Kostengewicht ist eine Schätzung, keine Abrechnung:
Input 1, Cache-Write 5 min 1,25, Cache-Write 1 h 2, Cache-Read 0,1, Output 5;
Modellfaktor opus/fable 1, sonnet 0,6, haiku 0,2. Fehlende oder kaputte Dateien
führen nie zum Absturz, sondern zu «nicht gemessen».
"""

from __future__ import annotations

import json
import re
import statistics
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path

NOT_MEASURED = "nicht gemessen"
KB = 1024

KIND_WEIGHT = {
    "input": 1.0,
    "cache_write_5m": 1.25,
    "cache_write_1h": 2.0,
    "cache_read": 0.1,
    "output": 5.0,
}
KIND_LABEL = {
    "cache_read": "Cache-Read",
    "cache_write_5m": "Cache-Write 5 min",
    "cache_write_1h": "Cache-Write 1 h",
    "output": "Output",
    "input": "Input",
}
MODEL_FACTOR = (("opus", 1.0), ("fable", 1.0), ("sonnet", 0.6), ("haiku", 0.2))

# gelb/rot je Kennzahl; op ">" (zu viel), "<" (zu wenig), ">=" (Zähler)
THRESHOLDS = {
    "steuerung": {"gelb": 0.40, "rot": 0.50, "op": ">"},
    "umsetzer": {"gelb": 0.15, "rot": 0.08, "op": "<"},
    "cache_write_5m": {"gelb": 0.15, "rot": 0.25, "op": ">"},
    "lead_ctx": {"gelb": 80_000, "rot": 150_000, "op": ">"},
    "l0_ctx_max": {"gelb": 250_000, "rot": 500_000, "op": ">"},
    "opus": {"gelb": 0.60, "rot": 0.80, "op": ">"},
    "persona_opus": {"gelb": 1, "rot": 5, "op": ">="},
    "largest_read": {"gelb": 40, "rot": 100, "op": ">"},  # KB (1 KB = 1024 Zeichen)
}

CLASSES = (
    "L0",
    "Leads",
    "Umsetzer",
    "Review/QA/Merge",
    "Design/Spec/Plan",
    "Studio-Betrieb",
    "Sonstiges",
)
BUILDERS = {"art-rendering-engineer", "art-audio-engineer"}
REVIEW = {"production-integrator"}
STUDIO_OPS = {"studio-coach", "studio-process-coach", "production-studio-ops"}
PERSONA = re.compile(r"^\s*Persona:\s*([\w-]+)", re.MULTILINE)
PERSONA_LINES = 5
REWRITE_MIN = 20_000
IMAGE_SUFFIXES = (".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".svg", ".ico")
TOP_READS = 5


def role_class(role: str) -> str:
    if role == "L0":
        return "L0"
    if role.startswith("lead-"):
        return "Leads"
    if role.startswith(("tech-plan", "design-")):
        return "Design/Spec/Plan"
    if role.startswith("tech-") or role in BUILDERS:
        return "Umsetzer"
    if role.startswith("qa-") or role in REVIEW:
        return "Review/QA/Merge"
    if role in STUDIO_OPS:
        return "Studio-Betrieb"
    return "Sonstiges"


def model_factor(model: str | None) -> float:
    for key, factor in MODEL_FACTOR:
        if key in (model or ""):
            return factor
    return 1.0


def _int(value: object) -> int:
    return value if isinstance(value, int) and not isinstance(value, bool) else 0


def _text_chars(content: object) -> int:
    """Zeichen der Textteile eines Tool-Ergebnisses; Bilder zählen nicht."""
    if isinstance(content, str):
        return len(content)
    if isinstance(content, list):
        return sum(
            len(str(b.get("text", "")))
            for b in content
            if isinstance(b, dict) and b.get("type") == "text"
        )
    return 0


def _read_target(name: object, data: object) -> str | None:
    """Pfad einer Textdatei, die Read oder `cat` liest; sonst None."""
    if not isinstance(data, dict):
        return None
    path = None
    if name == "Read":
        path = data.get("file_path")
    elif name == "Bash":
        match = re.match(r"\s*cat\s+(?:--\s+)?([^\s|;&<>]+)", str(data.get("command")))
        path = match.group(1) if match else None
    if not isinstance(path, str) or path.lower().endswith(IMAGE_SUFFIXES):
        return None
    return path


def _first_prompt(entry: dict) -> str | None:
    message = entry.get("message")
    content = message.get("content") if isinstance(message, dict) else None
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = [b.get("text", "") for b in content if isinstance(b, dict)]
        return "\n".join(p for p in parts if isinstance(p, str))
    return None


def scan(path: Path) -> dict | None:
    """Ein Transkript: Aufrufe (je Message-ID einmal), erster Prompt, Lese-Ergebnisse."""
    calls: dict[str, dict] = {}
    pending: dict[str, str] = {}
    reads: list[dict] = []
    prompt: str | None = None
    try:
        text = path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return None
    for line in text.splitlines():
        try:
            entry = json.loads(line)
        except ValueError:
            continue
        message = entry.get("message") if isinstance(entry, dict) else None
        if not isinstance(message, dict):
            continue
        content = message.get("content")
        fresh = not (isinstance(content, list) and _only_results(content))
        if entry.get("type") == "user" and prompt is None and fresh:
            prompt = _first_prompt(entry)
        if isinstance(content, list):
            _collect_tools(content, pending, reads)
        usage = message.get("usage")
        if isinstance(usage, dict):
            _add_call(calls, message, entry, usage)
    return {"calls": list(calls.values()), "prompt": prompt, "reads": reads}


def _only_results(content: list) -> bool:
    return all(isinstance(b, dict) and b.get("type") == "tool_result" for b in content)


def _collect_tools(content: list, pending: dict, reads: list) -> None:
    for block in content:
        if not isinstance(block, dict):
            continue
        if block.get("type") == "tool_use":
            target = _read_target(block.get("name"), block.get("input"))
            if target and isinstance(block.get("id"), str):
                pending[block["id"]] = target
        elif block.get("type") == "tool_result":
            ident = block.get("tool_use_id")
            target = pending.get(ident) if isinstance(ident, str) else None
            if target:
                chars = _text_chars(block.get("content"))
                reads.append({"path": target, "chars": chars})


def _add_call(calls: dict, message: dict, entry: dict, usage: dict) -> None:
    mid = message.get("id") or entry.get("uuid")
    if not mid:
        return
    cache = usage.get("cache_creation")
    cache = cache if isinstance(cache, dict) else {}
    one_hour = _int(cache.get("ephemeral_1h_input_tokens"))
    total = _int(usage.get("cache_creation_input_tokens"))
    five = _int(cache.get("ephemeral_5m_input_tokens")) if cache else total - one_hour
    values = {
        "input": _int(usage.get("input_tokens")),
        "cache_write_5m": max(five, 0),
        "cache_write_1h": one_hour,
        "cache_read": _int(usage.get("cache_read_input_tokens")),
        "output": _int(usage.get("output_tokens")),
    }
    record = calls.setdefault(
        mid, {"model": message.get("model"), **dict.fromkeys(values, 0)}
    )
    for key, value in values.items():
        record[key] = max(record[key], value)
    record["model"] = record["model"] or message.get("model")


def _persona(prompt: str | None) -> str | None:
    head = "\n".join((prompt or "").splitlines()[:PERSONA_LINES])
    match = PERSONA.search(head)
    return match.group(1) if match else None


def _instance(role: str, raw: dict, general_persona: bool) -> dict | None:
    calls = raw["calls"]
    if not calls:
        return None
    contexts = [
        c["input"] + c["cache_read"] + c["cache_write_5m"] + c["cache_write_1h"]
        for c in calls
    ]
    models = Counter(c["model"] for c in calls)
    model = models.most_common(1)[0][0]
    kinds = Counter()
    for call in calls:
        for key, weight in KIND_WEIGHT.items():
            kinds[key] += call[key] * weight * model_factor(model)
    return {
        "role": role,
        "model": model,
        "contexts": contexts,
        "rewrites": sum(1 for c in calls[1:] if c["cache_write_5m"] > REWRITE_MIN),
        "kinds": kinds,
        "cost": sum(kinds.values()),
        "persona_start": general_persona,
    }


def _files(main: Path) -> list[tuple[Path, dict | None]]:
    found: list[tuple[Path, dict | None]] = [(main, None)]
    folder = main.with_suffix("") / "subagents"
    try:
        agents = sorted(folder.glob("agent-*.jsonl"))
    except OSError:
        agents = []
    for path in agents:
        try:
            meta = json.loads(path.with_suffix(".meta.json").read_text("utf-8"))
        except (OSError, ValueError):
            meta = {}
        found.append((path, meta if isinstance(meta, dict) else {}))
    return found


def _med(values: list[float]) -> int:
    return int(statistics.median(values)) if values else 0


def _ratio(part: float, total: float) -> float:
    return part / total if total else 0.0


def compute(mains: list[Path]) -> dict | None:
    """Kennzahlen über Haupttranskripte samt Subagenten; None = nicht gemessen."""
    try:
        return _compute(mains)
    except Exception:  # noqa: BLE001 - Messung darf nie abstürzen
        return None


def _compute(mains: list[Path]) -> dict | None:
    instances: list[dict] = []
    reads: list[dict] = []
    sessions = 0
    for main in mains:
        scanned = scan(main)
        if scanned is None:
            continue
        sessions += 1
        reads += scanned["reads"]
        first = _instance("L0", scanned, False)
        if first:
            instances.append(first)
        for path, meta in _files(main)[1:]:
            raw = scan(path)
            if raw is None:
                continue
            kind = (meta or {}).get("agentType") or "general-purpose"
            persona = _persona(raw["prompt"]) if kind == "general-purpose" else None
            built = _instance(persona or kind, raw, persona is not None)
            reads += raw["reads"]
            if built:
                instances.append(built)
    if not instances:
        return None
    return _summary(instances, reads, sessions)


def _summary(instances: list[dict], reads: list[dict], sessions: int) -> dict:
    total = sum(i["cost"] for i in instances)
    by_class: dict[str, float] = dict.fromkeys(CLASSES, 0.0)
    kinds: Counter = Counter()
    opus = 0.0
    for item in instances:
        by_class[role_class(item["role"])] += item["cost"]
        kinds.update(item["kinds"])
        if "opus" in (item["model"] or ""):
            opus += item["cost"]
    share = {k: _ratio(v, total) for k, v in by_class.items()}
    leads = [
        _mean(i["contexts"]) for i in instances if role_class(i["role"]) == "Leads"
    ]
    l0_max = max(
        (max(i["contexts"]) for i in instances if i["role"] == "L0"), default=None
    )
    biggest: dict[str, int] = {}
    for item in reads:
        biggest[item["path"]] = max(biggest.get(item["path"], 0), item["chars"])
    ranked = [
        {"path": path, "chars": chars}
        for path, chars in sorted(biggest.items(), key=lambda x: -x[1])[:TOP_READS]
    ]
    return {
        "sessions": sessions,
        "agents": len(instances) - sum(1 for i in instances if i["role"] == "L0"),
        "calls": sum(len(i["contexts"]) for i in instances),
        "class_share": share,
        "kind_share": {k: _ratio(kinds[k], total) for k in KIND_LABEL},
        "opus_share": _ratio(opus, total),
        "steuerung": share["L0"] + share["Leads"],
        "umsetzer": share["Umsetzer"],
        "lead_ctx_median": _med(leads) if leads else None,
        "l0_ctx_max": l0_max,
        "persona_opus": sum(
            1 for i in instances if i["persona_start"] and "opus" in (i["model"] or "")
        ),
        "roles": _roles(instances),
        "top_reads": ranked,
    }


def _mean(values: list[int]) -> float:
    return sum(values) / len(values)


def _roles(instances: list[dict]) -> list[dict]:
    groups: dict[str, list[dict]] = defaultdict(list)
    for item in instances:
        groups[item["role"]].append(item)
    rows = []
    for role, items in groups.items():
        rows.append(
            {
                "role": role,
                "class": role_class(role),
                "instances": len(items),
                "start_ctx": _med([i["contexts"][0] for i in items]),
                "ctx_mean": _med([_mean(i["contexts"]) for i in items]),
                "ctx_max": max(max(i["contexts"]) for i in items),
                "rewrites": sum(i["rewrites"] for i in items),
                "cost": sum(i["cost"] for i in items),
            }
        )
    return sorted(rows, key=lambda r: -r["cost"])


def ampel(key: str, value: float | None) -> str:
    if value is None:
        return NOT_MEASURED
    rule = THRESHOLDS[key]
    for color, name in (("rot", "rot"), ("gelb", "gelb")):
        limit = rule[color]
        if rule["op"] == ">" and value > limit:
            return name
        if rule["op"] == "<" and value < limit:
            return name
        if rule["op"] == ">=" and value >= limit:
            return name
    return "grün"


def _pct(value: float | None) -> str:
    return NOT_MEASURED if value is None else f"{value * 100:.1f} %"


def _k(value: float | None) -> str:
    return NOT_MEASURED if value is None else f"{value / 1000:.0f}k"


def _table(head: list[str], rows: list[list[str]]) -> list[str]:
    widths = [max(3, *(len(r[i]) for r in [head, *rows])) for i in range(len(head))]

    def line(cells: list[str]) -> str:
        return "| " + " | ".join(c.ljust(w) for c, w in zip(cells, widths)) + " |"

    return [line(head), line(["-" * w for w in widths]), *(line(r) for r in rows)]


def _lights(data: dict) -> list[str]:
    top = data["top_reads"][0]["chars"] / KB if data["top_reads"] else None
    t = THRESHOLDS
    entries = [
        (
            "Steuerungsanteil (L0 + Leads)",
            "steuerung",
            _pct(data["steuerung"]),
            f"gelb > {t['steuerung']['gelb'] * 100:.0f} %, rot > {t['steuerung']['rot'] * 100:.0f} %",
        ),
        (
            "Umsetzeranteil",
            "umsetzer",
            _pct(data["umsetzer"]),
            f"gelb < {t['umsetzer']['gelb'] * 100:.0f} %, rot < {t['umsetzer']['rot'] * 100:.0f} %",
        ),
        (
            "Cache-Write 5 min",
            "cache_write_5m",
            _pct(data["kind_share"]["cache_write_5m"]),
            f"gelb > {t['cache_write_5m']['gelb'] * 100:.0f} %, rot > {t['cache_write_5m']['rot'] * 100:.0f} %",
        ),
        (
            "Lead-Kontext Median (Median der Instanz-Mittelwerte)",
            "lead_ctx",
            _k(data["lead_ctx_median"]),
            f"gelb > {_k(t['lead_ctx']['gelb'])}, rot > {_k(t['lead_ctx']['rot'])}",
        ),
        (
            "L0-Kontext Max",
            "l0_ctx_max",
            _k(data["l0_ctx_max"]),
            f"gelb > {_k(t['l0_ctx_max']['gelb'])}, rot > {_k(t['l0_ctx_max']['rot'])}",
        ),
        (
            "opus-Anteil",
            "opus",
            _pct(data["opus_share"]),
            f"gelb > {t['opus']['gelb'] * 100:.0f} %, rot > {t['opus']['rot'] * 100:.0f} %",
        ),
        (
            "Persona-Starts als general-purpose auf opus (Instanzen)",
            "persona_opus",
            str(data["persona_opus"]),
            f"gelb ≥ {t['persona_opus']['gelb']}, rot ≥ {t['persona_opus']['rot']}",
        ),
        (
            "Grösste gelesene Datei",
            "largest_read",
            NOT_MEASURED if top is None else f"{top:.1f} KB",
            f"gelb > {t['largest_read']['gelb']} KB, rot > {t['largest_read']['rot']} KB",
        ),
    ]
    values = {"largest_read": top}
    out = []
    for label, key, shown, rule in entries:
        value = values[key] if key in values else _raw_value(data, key)
        out.append(f"- {ampel(key, value).upper()}: {label}: {shown} ({rule})")
    return out


def _raw_value(data: dict, key: str) -> float | None:
    if key == "cache_write_5m":
        return data["kind_share"]["cache_write_5m"]
    if key == "lead_ctx":
        return data["lead_ctx_median"]
    if key == "opus":
        return data["opus_share"]
    return data[key]


def render_section(data: dict | None) -> str:
    out = ["## Effizienz", ""]
    if data is None:
        out += [f"- Transkripte: {NOT_MEASURED}.", ""]
        return "\n".join(out)
    out += [
        (
            f"- Datenbasis: {data['sessions']} Session(s), {data['agents']} Agenten, "
            f"{data['calls']} Aufrufe. Kostengewicht ist eine Schätzung, keine Abrechnung."
        ),
        "",
        "Ampel:",
        "",
        *_lights(data),
        "",
        *_table(
            ["Rollenklasse", "Kostenanteil"],
            [[c, _pct(data["class_share"][c])] for c in CLASSES],
        ),
        "",
        *_table(
            ["Kostenart", "Anteil"],
            [[KIND_LABEL[k], _pct(data["kind_share"][k])] for k in KIND_LABEL],
        ),
        "",
        f"- opus-Anteil: {_pct(data['opus_share'])}",
        f"- Persona-Starts als general-purpose auf opus (Instanzen): {data['persona_opus']}",
        "",
        *_table(
            [
                "Rolle",
                "Instanzen",
                "Start-Kontext",
                "Kontext Mittel (Median der Instanzen)",
                "Kontext Max",
                "5-min-Neuschreibungen > 20k",
            ],
            [
                [
                    r["role"],
                    str(r["instances"]),
                    _k(r["start_ctx"]),
                    _k(r["ctx_mean"]),
                    _k(r["ctx_max"]),
                    str(r["rewrites"]),
                ]
                for r in data["roles"]
            ],
        ),
        "",
        "Grösste Lese-Ergebnisse (Textdateien, KB):",
        "",
    ]
    out += [
        f"- {r['chars'] / KB:.1f} KB: `{r['path']}`" for r in data["top_reads"]
    ] or ["- –"]
    out.append("")
    return "\n".join(out)


SESSION_BREAK_MIN = 240  # längere Pausen gelten als Sitzungspause, nicht als Leerlauf


def _parse_ts(text: object) -> datetime | None:
    try:
        return datetime.fromisoformat(str(text).replace("Z", "+00:00"))
    except ValueError:
        return None


def idle_gaps(events: list[dict], prefix: str = "") -> list[dict]:
    """Leerlauf je Strang (= Owner): Paket-Status review des Vorgängers bis zum
    ersten active eines später startenden Nachfolgers. Parallel gestartete Pakete
    und Pausen über SESSION_BREAK_MIN zählen nicht (E-028, Messgrösse 2).
    prefix beschränkt beide Seiten auf Paket-IDs mit diesem Anfang (z. B. "H-")."""
    first_active: dict[str, tuple[datetime, str]] = {}
    first_review: dict[str, datetime] = {}
    for event in events:
        if event.get("kind") != "package":
            continue
        when, pid = _parse_ts(event.get("ts")), event.get("package_id")
        if when is None or not pid or not str(pid).startswith(prefix):
            continue
        status = event.get("status")
        if status == "active" and (
            pid not in first_active or when < first_active[pid][0]
        ):
            first_active[pid] = (when, event.get("owner") or "")
        elif status == "review" and (
            pid not in first_review or when < first_review[pid]
        ):
            first_review[pid] = when
    gaps: list[dict] = []
    for pid, reviewed in first_review.items():
        if pid not in first_active:
            continue
        owner = first_active[pid][1]
        later = [
            (start, other)
            for other, (start, o) in first_active.items()
            if o == owner and other != pid and start > reviewed
        ]
        if not later:
            continue
        start, other = min(later)
        minutes = (start - reviewed).total_seconds() / 60
        if minutes <= SESSION_BREAK_MIN:
            gaps.append({"owner": owner, "from": pid, "to": other, "minutes": minutes})
    return sorted(gaps, key=lambda g: (g["owner"], g["from"]))


def render_idle(gaps: list[dict]) -> str:
    head = "Leerlauf der Umsetzungskette (E-028, Messgrösse 2)"
    if not gaps:
        return f"- {head}: {NOT_MEASURED} (keine Folgepakete eines Strangs)."
    median = statistics.median(g["minutes"] for g in gaps)
    pairs = ", ".join(f"{g['from']} → {g['to']} {g['minutes']:.1f} min" for g in gaps)
    return f"- {head}: Median {median:.1f} min bei {len(gaps)} Übergängen ({pairs})."


def json_safe(data: dict | None) -> dict | None:
    return json.loads(json.dumps(data)) if data is not None else None
