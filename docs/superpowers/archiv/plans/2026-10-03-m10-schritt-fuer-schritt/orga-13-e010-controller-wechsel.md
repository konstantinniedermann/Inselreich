> Teil des Plans M10, Einstieg und Task-Tabelle: [index.md](index.md). **Gemeinsame Regeln:** index.md (Global Constraints).

### E-010: Controller-Wechsel nach dem mittleren QA-Block

Der Plan hat 9 Implementierer-Tasks (> 6). **Übergabepunkt:** nach QA-U1 OK (Tasks 1–6 abgenommen, W4b). Das fällt
mit der Wartezeit auf M9 H-R3/H-R4 vor Task 7 zusammen. Controller 1 übergibt allein per Ledger
`.superpowers/sdd/m10/ledger.md` und einem Satz Status an eine frische `lead-tech`-Instanz (Start durch L0).
Controller 2 übernimmt Tasks 7–9, QA-U2 … QA-U4, D1, Final-Review-Fixes und den Abschluss.

**Pflichtinhalt des Ledgers bei der Übergabe:** `<BASIS>`, Branches, Worktrees, geprüfte SHAs je Task, Push-Stand;
Agent-IDs der Implementierer und Reviewer **mit Session-ID**; alle Controller-Entscheide und gemeldeten Widersprüche
mit Spec-Stelle; BG-Werte je Task; Liste „Bewusst geänderte Tests" je Task; Zwischenregeln: (1) Kopfzeilen-Steuer seit
Task 6 nur noch Knopf `[data-field=tax]`, (2) `guide.ts` liest bis Task 7 noch `world.taxLevel` (B11), (3) Freischalt-
Meldung öffnet bis Task 7 die Karte im Modus `help` ohne Umbau; offene Minor/Low-Befunde (R65); Messwerte E-010;
Budgetstand.

**Messpunkte (Schwelle ≤ 3,5 Mio. Cache-Read je abgeschlossenem Task und Controller):**

| Messpunkt | Wann                        | Was                                         | Wie                                                                                                                   |
| --------- | --------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| M-1       | Übergabe (nach QA-U1)       | Cache-Read Controller 1 ÷ 6 Tasks           | `python3 tools/studio/metrics.py --session <Session-ID>` je Session des Messfensters, Zeile der Controller-`agent_id` |
| M-2       | vor dem Final-Review        | Cache-Read Controller 2 ÷ 3 Tasks (7, 8, 9) | wie M-1                                                                                                               |
| M-3       | nach den Final-Review-Fixes | Zuwachs Controller 2 durch Fixes            | wie M-1                                                                                                               |

Ledger-Zeile je Messpunkt: `M-<n> · Session-ID(s) · agent_id · Cache-Read · Tasks · Störgrösse ja/nein`. Ein
Session-Wechsel im Messfenster ist Störgrösse (Teilwerte einzeln eintragen). Abbruchkriterium: ein Ruling der zweiten
Hälfte widerspricht der ersten, oder Controller 2 fragt mehr als einmal bei Controller 1 nach (Zählung im Ledger).
