"""Ampelzeilen „Actions-Minuten“ für metrics.py --efficiency (E-046).

Liest den Monatsverbrauch über `gh api /users/<login>/settings/billing/usage`.
Fehlt `gh`, das Token oder schlägt der Aufruf fehl, steht „nicht erfasst“ – nie 0.
Minuten öffentlicher Repos sind nicht abgerechnet (R747): sie stehen nur als Info
und zählen nicht zu Konto-Minuten, Tagesrate und Prognose; scheitert die
Sichtbarkeitsabfrage, zählen sie konservativ weiter.
`run_gh` ist die einzige Stelle mit Netz und in Tests ersetzbar.
"""

from __future__ import annotations

import calendar
import json
import math
import subprocess
from datetime import datetime

import clock

NOT_RECORDED = "nicht erfasst"
# (gelb über, rot über)
ACCOUNT_LIMITS = (1000, 1600)
PROGNOSIS_LIMITS = (1600, 1900)
RATE_DAYS = 3
ACCOUNT_QUOTA = 2000
# Session-Minuten (gelb über, rot über)
SESSION_LIMITS = (10, 15)


def run_gh(args: list[str]) -> str:
    """Führt `gh <args>` aus; wirft OSError/CalledProcessError bei Fehlern."""
    result = subprocess.run(
        ["gh", *args], capture_output=True, text=True, check=True, timeout=30
    )
    return result.stdout


PUBLIC_NOTE = "öffentlich, nicht abgerechnet"


def is_public(runner=None) -> bool:
    """True, wenn das Repo öffentlich ist; bei Fehlern False (konservativ: zählen)."""
    run = runner or run_gh
    try:
        out = run(["repo", "view", "--json", "visibility", "-q", ".visibility"])
    except (OSError, subprocess.SubprocessError):
        return False
    return out.strip().upper() == "PUBLIC"


def _light(value: float, limits: tuple[int, int]) -> str:
    if value > limits[1]:
        return "ROT"
    return "GELB" if value > limits[0] else "GRÜN"


def _daily(
    items: list[dict], now: datetime, skip_repo: str | None = None
) -> dict[int, float] | None:
    """Konto-Minuten je Tag des laufenden Monats; None, wenn ein Eintrag kein `date` trägt.

    Variante „mit date“ (Echtlauf T04): die Monatsantwort trägt je Eintrag ein
    `date`; Tagesdaten kommen aus derselben Antwort, kein zusätzlicher gh-Aufruf.
    """
    days: dict[int, float] = {}
    for item in items:
        if item.get("product") != "actions" or item.get("unitType") != "Minutes":
            continue
        if skip_repo is not None and item.get("repositoryName") == skip_repo:
            continue
        try:
            day = _ts(str(item["date"]).replace("Z", "+00:00")).day
        except (KeyError, ValueError):
            return None
        days[day] = days.get(day, 0.0) + float(item.get("quantity", 0))
    return days


def forecast(spent: float, daily: dict[int, float] | None, now: datetime) -> int | None:
    """Prognose Monatsende: verbraucht + Rate × Resttage, ganze Minuten.

    Rate = Konto-Minuten der letzten bis zu 3 vollen Tage vor heute ÷ Anzahl dieser
    Tage; am 1. des Monats oder ohne Tagesdaten None (nie 0). Heute steckt
    teilweise schon in `spent` und zählt zusätzlich voll in den Resttagen
    (bewusste Doppelzählung, vorsichtige Prognose, R503 B8).
    """
    if daily is None or now.day <= 1:
        return None
    days = range(max(1, now.day - RATE_DAYS), now.day)
    rate = sum(daily.get(d, 0.0) for d in days) / len(days)
    rest = calendar.monthrange(now.year, now.month)[1] - now.day + 1
    return round(spent + rate * rest)


def _load(now: datetime, runner=None, public: bool = False):
    """(Repo, Konto, Tagesdaten oder None) im laufenden Monat; None, wenn nicht erfassbar.

    Ist das Repo öffentlich (`public`), zählt dessen Anteil nicht zum Konto.
    """
    run = runner or run_gh
    try:
        login = run(["api", "user", "--jq", ".login"]).strip()
        name = run(["repo", "view", "--json", "name", "-q", ".name"]).strip()
        if not login or not name:
            return None
        raw = run(
            [
                "api",
                (
                    f"/users/{login}/settings/billing/usage"
                    f"?year={now.year}&month={now.month}"
                ),
            ]
        )
        items = json.loads(raw)["usageItems"]
        account = repo = 0.0
        for item in items:
            if item.get("product") != "actions" or item.get("unitType") != "Minutes":
                continue
            minutes = float(item.get("quantity", 0))
            if item.get("repositoryName") == name:
                repo += minutes
                if public:
                    continue
            account += minutes
        return repo, account, _daily(items, now, name if public else None)
    except (OSError, subprocess.SubprocessError, ValueError, KeyError, TypeError):
        return None


def usage(now: datetime | None = None, runner=None) -> tuple[float, float] | None:
    """(Repo-Minuten, Konto-Minuten) im laufenden Monat oder None, wenn nicht erfassbar."""
    data = _load(now or clock.now(), runner, is_public(runner))
    return None if data is None else data[:2]


def _ts(value: str) -> datetime:
    return datetime.fromisoformat(value)


def session_minutes(since: datetime, runner=None) -> int | None:
    """Actions-Minuten der Workflow-Läufe seit `since`; je Job auf volle Minuten aufgerundet.

    Grenzen: nur die letzten 100 Läufe (`--limit 100`); Jobs ohne `completedAt`
    (laufend) und übersprungene Jobs zählen nicht. None, wenn `gh` fehlt oder
    ein Aufruf scheitert.
    """
    run = runner or run_gh
    try:
        raw = run(["run", "list", "--limit", "100", "--json", "databaseId,createdAt"])
        total = 0
        for item in json.loads(raw):
            if _ts(item["createdAt"]) < since:
                continue
            jobs = json.loads(
                run(["run", "view", str(item["databaseId"]), "--json", "jobs"])
            )["jobs"]
            for job in jobs:
                if job.get("conclusion") == "skipped":
                    continue
                if not job.get("completedAt") or not job.get("startedAt"):
                    continue
                seconds = (
                    _ts(job["completedAt"]) - _ts(job["startedAt"])
                ).total_seconds()
                total += max(1, math.ceil(seconds / 60))
        return total
    except (OSError, subprocess.SubprocessError, ValueError, KeyError, TypeError):
        return None


def render_session(since: datetime | None, runner=None, public: bool = False) -> str:
    rule = f"(gelb > {SESSION_LIMITS[0]}, rot > {SESSION_LIMITS[1]})"
    minutes = session_minutes(since, runner) if since else None
    if minutes is None:
        return f"- {NOT_RECORDED}: Session-Minuten"
    if public:
        return f"- Info: Session-Minuten: {minutes} ({PUBLIC_NOTE})"
    return f"- {_light(minutes, SESSION_LIMITS)}: Session-Minuten: {minutes} {rule}"


def render(
    now: datetime | None = None, runner=None, since: datetime | None = None
) -> str:
    now = now or clock.now()
    public = is_public(runner)
    session = render_session(since, runner, public)
    data = _load(now, runner, public)
    head = ["## Actions-Minuten (Monat)", ""]
    if data is None:
        return "\n".join(
            [
                *head,
                f"- {NOT_RECORDED}: Inselreich-Minuten",
                f"- {NOT_RECORDED}: Konto-Minuten",
                f"- {NOT_RECORDED}: Konto-Prognose Monatsende",
                session,
                "",
            ]
        )
    repo, account, daily = data
    account_rule = f"(gelb > {ACCOUNT_LIMITS[0]}, rot > {ACCOUNT_LIMITS[1]})"
    repo_line = f"- Info: Inselreich-Minuten: {repo:.0f}"
    if public:
        repo_line += f" ({PUBLIC_NOTE})"
    account_line = (
        f"- {_light(account, ACCOUNT_LIMITS)}: Konto-Minuten: "
        f"{account:.0f} von {ACCOUNT_QUOTA} {account_rule}"
    )
    predicted = forecast(account, daily, now)
    if predicted is None:
        forecast_line = f"- {NOT_RECORDED}: Konto-Prognose Monatsende"
    else:
        rest = calendar.monthrange(now.year, now.month)[1] - now.day + 1
        rate = (predicted - account) / rest
        forecast_line = (
            f"- {_light(predicted, PROGNOSIS_LIMITS)}: Konto-Prognose Monatsende: "
            f"{predicted} von {ACCOUNT_QUOTA} (verbraucht {account:.0f} + "
            f"{rate:.0f}/Tag × {rest} Resttage; gelb > {PROGNOSIS_LIMITS[0]}, "
            f"rot > {PROGNOSIS_LIMITS[1]}; bei Rot höchstens ein Push je Tag, R488 V2)"
        )
    return "\n".join([*head, repo_line, account_line, forecast_line, session, ""])
