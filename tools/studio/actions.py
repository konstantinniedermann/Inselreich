"""Ampelzeilen „Actions-Minuten“ für metrics.py --efficiency (E-046).

Liest den Monatsverbrauch über `gh api /users/<login>/settings/billing/usage`.
Fehlt `gh`, das Token oder schlägt der Aufruf fehl, steht „nicht erfasst“ – nie 0.
`run_gh` ist die einzige Stelle mit Netz und in Tests ersetzbar.
"""

from __future__ import annotations

import json
import subprocess
from datetime import datetime, timezone

REPO = "anno-clone"
NOT_RECORDED = "nicht erfasst"
# (gelb über, rot über)
REPO_LIMITS = (150, 400)
ACCOUNT_LIMITS = (1000, 1600)
ACCOUNT_QUOTA = 2000


def run_gh(args: list[str]) -> str:
    """Führt `gh <args>` aus; wirft OSError/CalledProcessError bei Fehlern."""
    result = subprocess.run(
        ["gh", *args], capture_output=True, text=True, check=True, timeout=30
    )
    return result.stdout


def _light(value: float, limits: tuple[int, int]) -> str:
    if value > limits[1]:
        return "ROT"
    return "GELB" if value > limits[0] else "GRÜN"


def usage(now: datetime | None = None, runner=None) -> tuple[float, float] | None:
    """(Repo-Minuten, Konto-Minuten) im laufenden Monat oder None, wenn nicht erfassbar."""
    run = runner or run_gh
    now = now or datetime.now(timezone.utc)
    try:
        login = run(["api", "user", "--jq", ".login"]).strip()
        if not login:
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
            account += minutes
            if item.get("repositoryName") == REPO:
                repo += minutes
        return repo, account
    except (OSError, subprocess.SubprocessError, ValueError, KeyError, TypeError):
        return None


def render(now: datetime | None = None, runner=None) -> str:
    data = usage(now, runner)
    head = ["## Actions-Minuten (Monat)", ""]
    if data is None:
        return "\n".join(
            [
                *head,
                f"- {NOT_RECORDED}: Inselreich-Minuten",
                f"- {NOT_RECORDED}: Konto-Minuten",
                "",
            ]
        )
    repo, account = data
    repo_rule = f"(gelb > {REPO_LIMITS[0]}, rot > {REPO_LIMITS[1]})"
    account_rule = f"(gelb > {ACCOUNT_LIMITS[0]}, rot > {ACCOUNT_LIMITS[1]})"
    repo_line = (
        f"- {_light(repo, REPO_LIMITS)}: Inselreich-Minuten: {repo:.0f} {repo_rule}"
    )
    account_line = (
        f"- {_light(account, ACCOUNT_LIMITS)}: Konto-Minuten: "
        f"{account:.0f} von {ACCOUNT_QUOTA} {account_rule}"
    )
    return "\n".join([*head, repo_line, account_line, ""])
