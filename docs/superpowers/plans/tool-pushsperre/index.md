# Plan TOOL-PUSHSPERRE (Werkzeug, Stufe leicht)

Ziel: R844 V1 (Push-Sperre), V2 (Wiederholung roter Zeit-/Timeout-Dateien selbst, Pin `perf.test.ts` entschärfen), V3 (Start-Warnung «state.md hinkt»).
Grundlage: `docs/studio/retros/2026-10-22-rel-29-prozess.md` (B1, V1–V3). Kein Sim-, Save- oder Spielwert-Bezug; Python in `tools/studio/`, ein Test in `tests/sim/`.

## Befunde beim Planen (ändern den Auftrag)

1. **`guard.py` ist verfassungsgeschützt (§1.3, `file_reason`).** Ein Umsetzer darf es nicht ändern; der Nutzer müsste «VERFASSUNG ÄNDERN» schreiben (Nutzer-Vorbehalt). Präzedenz: `waitguard.py` und `modelguard.py` sind eigene PreToolUse-Hooks «statt guard.py». Plan: neues Modul `tools/studio/pushgate.py` plus ein zusätzlicher Eintrag in `.claude/settings.json` (stärkt den Schutz, schwächt keinen Guard-Eintrag; §1.3 bleibt gewahrt). Rückfall: Eintrag aus `settings.json` löschen.
2. **V3 (Hook-Teil) existiert zu 80 %:** `tools/studio/stampcheck.py` (E-065) wird von `hook.py:start_context` beim SessionStart angehängt, Schwelle «Differenz > 5». Beim Start von R841 lag die Differenz bei 8, die Warnung hätte also feuern müssen. Lücken: (a) `_highest(rulings)` nimmt jede «R123»-Nennung im Text (auch Verweise in «Regelbezug»), nicht die letzte `## R…`-Überschrift; (b) die Meldung ist eine Randzeile am Ende des Kontexts ohne Handlungsanweisung; (c) `Stand:` nennt R-Nr. nur, wenn dort eine steht (Kopfzeile heute «R833», ok). Task T3 schärft nur diese drei Punkte, kein neues Modul.
3. **Wiederholung (V2) greift heute nur im Zeitreserve-Schritt.** `pushcheck.sequence()` bricht bei rotem `make check-push` mit Exit 1 ab, bevor `zeitreserve()` und damit `retry()` laufen; deshalb `retry_files: 0` bei R815, obwohl von Hand wiederholt wurde. Zusätzlich: `make` bricht beim ersten roten Schritt ab (`test`), die Schritte danach (`studio-test build pages-limit`) sind bei einer grünen Wiederholung noch nicht gelaufen und müssen nachgeholt werden.
4. `LOAD_WAIT = 3.0` in `pushcheck.py`, Handbuch und Auftrag sagen «Last ≤ 4». Die Wiederholung nutzt unverändert `wait_quiet()` (3.0 ist strenger, kein Eingriff); Abweichung als Beobachtung (`docs/beobachtungen.md`), nicht hier lösen.

## Datei-Ownership (drei Stränge, drei Branches, je ein Worktree)

| Strang | Branch / Worktree                                                                                    | Dateien                                                                                                                                                                                                                                             |
| ------ | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A      | `tool/pushsperre` · `.worktrees/tool-pushsperre`                                                     | neu `tools/studio/pushgate.py`, `tools/studio/tests/test_pushgate.py`; `.claude/settings.json` (nur der neue Eintrag); `tools/studio/stampcheck.py`, `tools/studio/tests/test_stampcheck.py`, `tools/studio/tests/test_hook.py` (nur Stand-Warnung) |
| P      | `tool/perf-pin` · `.worktrees/tool-perf-pin`                                                         | `tests/sim/perf.test.ts` (nur 15a und Kopfkommentar), `tests/helpers/perfBudget.ts` nur lesen; Messtabelle im Kopfkommentar                                                                                                                         |
| B      | `tool/pushcheck-retry` · `.worktrees/tool-pushcheck-retry`, **erst nach Merge von TOOL-MESSFENSTER** | `tools/studio/pushcheck.py`, `tools/studio/tests/test_pushcheck.py`                                                                                                                                                                                 |

Nicht anfassen: `tools/studio/guard.py`, `docs/studio/VERFASSUNG.md`, `docs/studio/STUDIO.md` (Handbuch-Nachzug macht `studio-coach` nach dem Merge, R429), `tools/testlock/`, `tools/render-qa/`.

## Tasks

| Task | Titel                                               | Datei                | AK  | Strang | blocked-by                | Modell |
| ---- | --------------------------------------------------- | -------------------- | --- | ------ | ------------------------- | ------ |
| T1   | `pushgate.py`: Push nach main nur nach Exit 0       | T01-pushgate.md      | V1  | A      | -                         | sonnet |
| T2   | Freigabedatei, Selbstschutz, Registrierung          | T02-freigabe.md      | V1  | A      | T1                        | sonnet |
| T3   | Stand-Warnung schärfen                              | T03-stand-warnung.md | V3  | A      | -                         | sonnet |
| T4   | Pin AK-E0-15a entschärfen (mit Messdaten)           | T04-perf-pin.md      | V2  | P      | -                         | sonnet |
| T5   | `pushcheck.py`: rote Zeitdateien selbst wiederholen | T05-retry.md         | V2  | B      | TOOL-MESSFENSTER auf main | sonnet |

Strang A: T1, T3, T2 (T3 ist unabhängig; T2 baut auf T1). Strang P und A laufen parallel (getrennte Dateien, getrennte Worktrees); T4 misst Last und verträgt keinen Testlauf eines Dritten im selben Zeitfenster (Testsperre `node tools/testlock/testlock.ts …`).

## Konfliktstellen mit TOOL-MESSFENSTER (Stand `feat/tool-messfenster`, `git diff main...feat/tool-messfenster -- tools/studio/pushcheck.py`, +37/-3)

Dort ändern: `MESSFENSTER_*`-Konstanten, `Gate.__init__` (+`self.messfenster`), `_load_protocol(current, reason)`, neue Methode `messfenster_blocked()`, `Gate.gate()` und `Gate.sequence()` (je Anfang: `if self.messfenster_blocked(): return 3`), `main_gate()` (Meldung Exit 3), dazu `tests/test_pushcheck.py` (+79) und `tools/testlock/testlock.ts`.
Meine Änderungen in derselben Datei (nur Strang B / T5):

1. `Gate.__init__`: ein Feld `self.retry_source` (Zeile neben `self.messfenster`): triviale Textkollision.
2. `Gate.sequence()`: Verzweigung hinter `self.step("check-push", …)` (Z. ~240); ihr Hunk sitzt am Funktionsanfang, mein Hunk 10 Zeilen darunter: im Normalfall auto-mergebar, sonst von Hand.
3. `main()`: Event-Wörterbuch (+`retry_source`); sie fassen `main()` nicht an.
4. `tests/test_pushcheck.py`: beide hängen Fälle an `Harness` an; **der Fake-Runner muss `node tools/messfenster/lock.ts status` beantworten** (Exit 0), sonst schlagen meine neuen Tests nach dem Merge mit «Messfenster-Prüfung fehlgeschlagen» (stderr, gilt als frei, also nur Lärm) oder Aufrufzählungen fehl.
5. `retry()` und `wait_quiet()` bleiben unverändert (beide nutzen sie nur lesend).

**Merge-Reihenfolge:** (1) TOOL-MESSFENSTER nach main. (2) Strang A und P dürfen davor oder danach, sie berühren `pushcheck.py` nicht. (3) Strang B erst nach (1): Branch `tool/pushcheck-retry` entsteht aus dem dann aktuellen main. Ist TOOL-MESSFENSTER bis zum Push am 2026-10-23 nicht auf main, gehen A und P allein in REL-30; T5 folgt danach (V1 greift unabhängig davon).

## Budget (Vorschlag für die Umsetzung; der Plan-Start ist separat)

Umsetzer 3 (A, P, B) + Review 3 (je Branch, der Review von A läuft auf `opus` und gilt als Final-Review, P und B `sonnet`) + 1 Reserve = 7. Formelwert nach Vorlage: `3 × 2 + 0 QA + 1 Final = 7` → × 1,3 = 9,1 → 10. Empfehlung: 7 Starts, Parallelität 2 (A ∥ P; B danach). Kein UI, kein Playtester.
Prüfung je Strang: A und B `make studio-test`, `make studio-lint`; P gezielter Lauf `node tools/testlock/testlock.ts npx vitest run tests/sim/perf.test.ts`, `npx tsc --noEmit`, `make lint`; jeder Task mit einem Test, der vorher rot war (Beleg im Commit).
Nach dem Merge läuft der volle Lauf einmal als `make push-check` im Release (R810).

## Ruling-Entwürfe (für L0)

**Entwurf 1: Plan abgenommen.** «TOOL-PUSHSPERRE Plan angenommen: drei Stränge A (`pushgate.py` als eigener PreToolUse-Hook statt Änderung an `guard.py`, weil dieses verfassungsgeschützt ist; Stand-Warnung schärfen), P (Pin AK-E0-15a mit Messdaten), B (Wiederholung in `pushcheck.py`, erst nach TOOL-MESSFENSTER). Budget 7 Starts, Parallelität 2. Merge-Reihenfolge: TOOL-MESSFENSTER → B; A und P unabhängig.» Regelbezug: Verfassung §1.3, R844, R810 V2, R815 · Kosten bei Irrtum: ein Hook-Eintrag in `settings.json` und ein Modul zurück.

**Entwurf 2: Hook statt Guard-Änderung.** «`pushgate.py` ist ein eigener PreToolUse-Hook (Präzedenz `waitguard`, `modelguard`); `guard.py` bleibt unberührt. Der Eintrag in `.claude/settings.json` stärkt den Schutz und fällt damit nicht unter das Schwächungsverbot von §1.3. Freigabe `.studio/push-freigabe` darf nur L0 anlegen; Agenten-Aufrufe (`agent_id` gesetzt), die den Dateinamen nennen, weist der Hook ab (best effort).» Regelbezug: Verfassung §1.3, §7.2, R844 V1 · Kosten bei Irrtum: ein Hotfix-Push braucht eine Freigabezeile.

**Entwurf 3: Pin-Entscheid nach Messung.** «Pin AK-E0-15a: Regel und Zahl entscheidet der Messbericht in T04 (Best-of-3 gegen Median, Pin bleibt 2,5 ms, falls die Daten es tragen); kein Hochsetzen ohne Tabelle im Kopfkommentar von `perf.test.ts`. Naiv-Code (18,6 ms) bleibt rot.» Regelbezug: R815, R844 V2 · Kosten bei Irrtum: ein Zeit-Pin zurück.

**Entwurf 4 (Beobachtung):** `LOAD_WAIT = 3.0` im Code gegen «Last ≤ 4» im Handbuch (STUDIO.md, Push-Ablauf) angleichen; Entscheid L0, kein Teil dieses Pakets.
