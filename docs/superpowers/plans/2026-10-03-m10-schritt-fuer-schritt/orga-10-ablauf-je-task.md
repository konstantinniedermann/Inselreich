> Teil des Plans M10, Einstieg und Task-Tabelle: [index.md](index.md). **Gemeinsame Regeln:** index.md (Global Constraints).

### Ablauf je Task (Controller `lead-tech`)

1. `python3 tools/studio/log.py package --id M10-<Paket> --title "<Titel>" --owner lead-tech --status active --milestone M10 [--blocked-by …]`
2. Implementierer im Vordergrund starten (parallele Tasks einer Welle in **einer** Nachricht), Briefing nach
   `docs/studio/templates/briefing.md`: Kopfzeilen, feste Regeln wörtlich, Logging-Block, Worktree-Pfad, Task-Text
   aus diesem Plan wörtlich, Abschnitte „Global Constraints", „Gemeinsame Schnittstellen" und „Bewusst geänderte
   Tests", Spec-Pfad, „Budget: keins, keine Agenten starten".
3. Implementierer: Test schreiben → **rot** (exakter Befehl, erwartete Meldung; Rot-Log mit den Zeilen
   `FAIL`/`AssertionError`/`is not a function` im Bericht) → minimal umsetzen → grün → Wellen-Prüfung → Commit.
4. `qa-code-reviewer` gegen Task-Text, Spec-Abschnitt, Schnittstellen und Global Constraints. Er prüft im Rot-Log,
   dass jeder neue Test vor der Umsetzung rot war (ausgenommen nur die Liste „Vor der Umsetzung grün erlaubt" im
   Task), führt den Abdeckungs-Grep aus und den Testzählbefehl. **Widerspruch AK ↔ Spec (R136/R137):** vorläufig die
   einfachere Variante, im Bericht melden; Controller trägt ihn ins Ledger und in den Schlussbericht.
5. **Fix-Nachprüfung (R136):** kleine Fixes (≤ ~20 Zeilen) prüft der Controller am Diff, sonst derselbe Reviewer per
   `SendMessage`. Jede Nachprüfung beantwortet: Gegenweg geprüft? Fundstellen geänderter oder entfernter Symbole per
   `grep -rn <symbol> src tests README.md docs/` nachgeführt?
6. `log.py result … --outcome <angenommen|nacharbeit|verworfen> --review-rounds <n>`; Paket `done`; SHA, Rot-Log-Befund,
   Bitgleich-Werte und Befunde ausserhalb Scope ins Ledger; push.
7. **UI-Task:** zusätzlich QA-U<n> (Abschnitt „QA-Checks") am geprüften SHA in `.worktrees/m10-qa`. Blockende
   Befunde gehen per `SendMessage` an den Implementierer des Tasks, sobald im Baum kein anderer Implementierer arbeitet
   (nie zwei Implementierer gleichzeitig im selben Baum); der nächste UI-Task nach dem übernächsten startet erst, wenn
   die Befunde behoben sind (QA-U1 vor Task 8, QA-U2 vor Task 9, QA-U3 vor D1).
