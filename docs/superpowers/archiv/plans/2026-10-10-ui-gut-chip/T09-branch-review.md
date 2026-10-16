# T09 · Branch-Review (opus, Final-Review)

Strang – · `qa-code-reviewer` mit `model: opus` · alle AK, AK-GC-16 · blocked-by T08 **und alle Fixes aus T08** (R462 B1) · 1 Review (≈ 25 Tools)

**Auftrag:** `git diff main...HEAD` im Worktree `.worktrees/ui-gut-chip` gegen `index.md` (Review Focus 1–8) und `ak.md`. Urteil OK/BEDENKEN/ZURÜCK. Letzter Schritt vor dem Merge-Gate; nach ihm entsteht kein Code ohne Delta-Review.

## Prüfpunkte

- Review Focus 1–8 im Index, insbesondere: genau ein Umlauf (`stepList`), `problems.ts` ohne Import aus `hover.ts`, `HOUSE_TITLES` in `texts.ts`.
- **Sim unberührt (R462 B6):** `git diff --stat main...HEAD -- src/sim tests/sim src/ui/storage.ts` ist leer; kein Save-Feld; Controller meldet `make check` (mit `tests/sim/balance.test.ts`) grün.
- Fokus-Logik als reine Funktionen (`stepKeyTarget`, `shouldClearFocus`, `focusReduce`) in `goodFocus.ts` getestet; `app.ts` ohne eigene Entscheidungslogik dazu.
- Palette: `signalFocus` in `SIGNAL_NAMES` oder ΔE-Test vorhanden; CSS-Wert = Palette-Wert getestet.
- Alle T08-Fix-Commits enthalten (`git log --oneline main..HEAD`), Browser-Bericht `.studio/qa/ui-gut-chip/report.md` ohne offene Befunde.
- Doku (README, arc42) konsistent mit dem Code, keine Secrets, Commit-Konvention.
