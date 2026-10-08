# Retro session 56d273bd-ende — 2026-10-08

- Datum: 2026-10-08
- Art: session (mit Ad-hoc-Anteil Actions-Minuten und Integrator-Fehlschlag)
- Auslöser: Session-Ende 56d273bd; Vorfälle `failed:56d273bd-08d9-436e-8502-1f7e9b50da45:aee33aea6399b4df9` (production-integrator, BEOB-AUSW-02), `inaktiv:56d273bd-08d9-436e-8502-1f7e9b50da45:a19bf3150d230ccc9` (production-integrator); Anlass R333–R335
- Datenbasis: `docs/studio/metriken/S-2026-10-08-56d273bd.md`, `docs/studio/rulings.md` (R333–R343), `docs/studio/warteschlange.md` (N-98), `.studio/events.jsonl` (Budget- und Paket-Ereignisse der Session), `python3 tools/studio/metrics.py --efficiency` (Historie), GitHub-Billing-API (siehe B1); Kurz-Retro, ein Start, rund 20 Tool-Aufrufe

## Befunde

### B1 · Actions-Verbrauch blieb ohne Messzeile unentdeckt

- Beobachtung: Der Nutzer stoppte Actions bei 1172 von 2000 min im Oktober, 910 min davon Inselreich (R333). Das Studio hat den Verbrauch nicht selbst bemerkt. Die Qualitätszeile „CI-Läufe“ der Session-Datei lautet „nicht erfasst“ (`docs/studio/metriken/S-2026-10-08-56d273bd.md`, Abschnitt Qualität); die Effizienz-Ampel misst nur Token-Kostengewicht, keine Grösse ausserhalb der Sessions.
- Beleg: R333 (240 Pushes, 324 von 433 Commits reine `docs:`, Spitze rund 60 Pushes pro Tag); Messprobe in dieser Retro: `gh api "/users/konstantinniedermann/settings/billing/usage?year=2026&month=10"` liefert Oktober „Actions Linux“: Inselreich 910, munica 233, olivalle-webshop 27, badibeach-abo 3, Summe 1173 min. Das passt zu den 1172 des Nutzers. Der alte Endpunkt `/settings/billing/actions` antwortet mit 410 „moved“, der neue läuft mit dem vorhandenen Token (Scope `user`).
- Wirkung: Releases standen still, bis N-98 beantwortet war (R333, R334); Sparregeln und ein Push pro Session kosten Aufwand (TOOL-ACTIONS-SPAR, R335).
- Deutung (getrennt von der Beobachtung): Dasselbe Muster wie im Vorfall-Retro [effizienz-unentdeckt](2026-10-08-vorfall-effizienz-unentdeckt.md) B1: Eine Kennzahl, die nicht in der Ampel steht, wird nicht gesehen. Die Ursache der Minuten (Push-Takt, Job-Aufrundung) war aus den Events ableitbar (Push-Zahl), nur nicht mit einer Schwelle versehen. Nach R334 erwartet das Studio 50–150 min/Monat für Inselreich (N-98 Empfehlung); das ist die Vergleichsgrösse.

### B2 · `log.py queue` schreibt nicht Prettier-fest

- Beobachtung: Der Integrator scheiterte bei BEOB-AUSW-02 mit „make check rot (prettier docs/studio/warteschlange.md)“; der Merge wurde abgebrochen (R333, `failed:…:aee33aea6399b4df9`). Commit `7e61986` korrigierte eine Zeile nach.
- Beleg: Probe im Scratchpad: der Text `docs/**, **/*.md, .studio/**` wird von `npx prettier --write` zu `**/\*.md` geändert (Diff 1 Zeile); der N-98-Eintrag enthält genau diese Globs. `studio_docs.queue_add` erzeugt die Leerzeile nach der Überschrift schon prettier-konform (Kommentar in `tools/studio/studio_docs.py`), nicht aber das Escapen von `*` und `_`.
- Wirkung: Ein roter `make check` auf main, ein abgebrochener Merge, eine Korrektur. Einzelfall im Anlass, aber jeder Eintrag mit Glob oder Unterstrich löst es aus.
- Deutung: Ursache ist die Annahme, Freitext sei Markdown-neutral; eine Prüfung des Formats nach dem Schreiben fehlt. Lernen.md hatte die Lücke für `state.md` und `beobachtungen.md` schon (zwei Zeilen), für die Warteschlange nicht.

### B3 · Budgetüberzüge bei UI-Paketen, widersprüchliche Selbstangabe

- Beobachtung: TASTEN-KOMFORT rund 147 von 120 (R339: „rund 27 Tools, ≈ 22 %“ über), PANEL-UEBERSICHT rund 136 von 120 (R343), PERF-L57 im Rahmen (150 + 40 Nachrunde, R341/R342). Bei PANEL-UEBERSICHT lautete die Selbstangabe „ca. 100“, die Zählung 121 + 15 (R343).
- Beleg: `.studio/events.jsonl` Budget-Ereignisse (lead-tech 120 je Paket, 11:23 und 13:59); R339, R343. Schätzung gegen Ist der ganzen Session: −81,3 % bei 11 Agenten (`docs/studio/metriken/S-2026-10-08-56d273bd.md`), im Mittel also deutlich unter Schätzung; die Überzüge sind nicht Teil eines allgemeinen Trends, sondern auf die zwei UI-Pakete beschränkt.
- Wirkung: Zwei Retro-Pflichten (R339, R343); die falsche Selbstangabe hätte ohne die Zählung des Gates unbemerkt gepasst.
- Deutung: Beide UI-Pakete enthielten Plan, Umsetzung, Final-Review, Fix-Runde und Browser-Abnahme unter 120. Lernen.md hat für Optik-Häppchen schon Faktor ≥ 2 (R213); für UI-Pakete mit Browser-Abnahme gibt es keinen Richtwert. Zwei Fälle, kein gesichertes Muster; deshalb ein Messauftrag statt Handbuch-Umbau (siehe Vorschlag 3).

### B4 · Zeitreserve und Perf-Grenzen unter Last

- Beobachtung: Falsch-rote Zeitreserve- und Perf-Ergebnisse bei Load 7–19; Antwort war `make zeitreserve-push` (Load > 4 → „nicht belastbar“, Exit 2, Pflicht vor dem Session-End-Push; R338) und die Lastgrenze der Messungen (E-045, R329).
- Beleg: R338 (b), R341 (PANEL-UEBERSICHT wartet auf Abschluss der PERF-L57-Läufe wegen Last), lernen.md Zeilen zu R326/R327.
- Wirkung: PANEL-UEBERSICHT startete rund 1 h 40 min später (Status `blocked` 12:16 bis 13:59, `.studio/events.jsonl`), die Wartezeit ist die Kostenseite der Lastgrenze.
- Deutung: Das Push-Gate beseitigt falsch-rote Fehlalarme, beseitigt aber nicht die Lücke in der Gegenrichtung (lokal grün, Runner rot; Faktor 3–4, E-043). Ob es reicht, ist noch nicht messbar: dieser Session-End-Push hat noch nicht stattgefunden; Messauftrag in Vorschlag 3.

### B5 · Gut gelaufen

- Die Konflikt-Probe (Handbuch 1.30) fing laut L0-Auftrag den Konflikt in `docs/beobachtungen.md` vor dem Integrator ab (R342 nennt sie „konfliktfrei“ für `perf/l57`). Die Nachrunde PERF-L57 nach dem Review ZURÜCK prüfte die Invalidierung des Bodencache vollständig (R341/R342). Beides bleibt unverändert.

### B6 · Fällige Meldungen

- `failed:56d273bd-…:aee33aea6399b4df9`: durch B2 erklärt (Merge abgebrochen, Korrektur `7e61986`, R333). Quittiert.
- `inaktiv:56d273bd-…:a19bf3150d230ccc9`: Integrator mit langem Bash-Lauf (`make check`), Messartefakt gemäss lernen.md „Anzeige inaktiv“. Quittiert.

## Effizienz-Ampel

Quelle: `python3 tools/studio/metrics.py --efficiency` (Historie) und Abschnitt „Effizienz“ der Session-Datei (1 Session, 43 Agenten, 1041 Aufrufe). Historie und Session getrennt gelesen (lernen.md).

| Kennzahl                     | Historie | Session | Ampel (Hist./Sess.) | Befund / Ursache                                                                                                                                                                                                                        | Hebel oder Messauftrag mit Frist                                                                                                                           |
| ---------------------------- | -------- | ------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Steuerungsanteil             | 50,1 %   | 53,4 %  | rot / rot           | Session: lead-art PERF-L57 allein 3,98 M von rund 5,55 M Lead-Gewicht (72 %, `metrics`-Tabelle Lead-Instanzen); Messpaket mit 122 Turns, 1 Status-Turn. Deutung: Lead führt Messläufe selbst, keine Steuerung im engeren Sinn           | E-038 (Start frühestens 2026-10-22, R314); Datenpunkt für E-038: Messpakete getrennt ausweisen (Messauftrag lead-qa/Coach, bis Retro der nächsten Session) |
| Umsetzeranteil               | 24,4 %   | 19,2 %  | grün / grün         | –                                                                                                                                                                                                                                       | –                                                                                                                                                          |
| Cache-Write 5 min            | 29,4 %   | 38,2 %  | rot / rot           | Session: 28 Neuschreibungen > 20k, davon lead-art 14 mit `bash_share` 1,0 und Median-Pause 8,5 min (2,44 M von 3,55 M, `rewrite_stats`); Beobachtung: Pausen nach einem Bash-Aufruf über 5 min. Deutung: lange Messläufe im Vordergrund | E-037 läuft (Handbuch 1.27, Ausgang 29,2 %/21,7 %); Datenpunkt 38,2 % > Schwelle 20 %; Messauftrag: E-037-Bewertung nach 3 Sessions, lead-art-Läufe zählen |
| Lead-Kontext Median          | 73k      | 58k     | grün / grün         | –                                                                                                                                                                                                                                       | –                                                                                                                                                          |
| L0-Kontext Max               | 774k     | 218k    | rot / grün          | Historischer Höchstwert aus früheren Sessions, Session grün (Retro 8ef9d27f-ende)                                                                                                                                                       | kein neuer Vorschlag; Session unauffällig                                                                                                                  |
| opus-Anteil                  | 73,0 %   | 34,9 %  | gelb / grün         | Session deutlich besser (Sonnet-Umsetzer, Integrator)                                                                                                                                                                                   | E-038 (Hebel 5) für die Historie                                                                                                                           |
| Persona-Starts general-purp. | 0        | 0       | grün / grün         | –                                                                                                                                                                                                                                       | –                                                                                                                                                          |
| Grösste gelesene Datei       | 59,0 KB  | 37,8 KB | gelb / grün         | Historie: Tool-Ergebnis möglich                                                                                                                                                                                                         | nicht weiter verfolgt (Session grün)                                                                                                                       |

Cache-Write steht in der Historie seit vielen Retros rot (lernen.md, R316) und in dieser Session rot; Steuerungsanteil ist erstmals in der Session rot. Hebel liegt vor (E-037, E-038). Neu: **keine Ampelzeile für Actions-Minuten** (Vorschlag 1).

## Befragung der Leads

- Keine Befragung; Archiv-Berichte und Rulings reichten (Kurz-Retro, ≤ 15 Tool-Aufrufe für den Kern).

## Vorschläge

Höchstens 5; drei davon sind Experimente in `docs/studio/experimente.md` (E-046, E-047, E-048), zwei sind Messaufträge ohne Handbuchänderung.

1. **E-046 · Ampelzeile „Actions-Minuten“** (B1). Kosten: ein Werkzeug-Paket, rund 40 Tools (lead-tech): `efficiency.py`/`metrics.py` fragen den Monatsverbrauch per `gh api` ab, `verbesserung.md` nennt die Schwellen. Läuft nur nach L0-Ruling.
2. **E-047 · `log.py queue` formatiert selbst** (B2). Kosten: rund 10 Tools: nach dem Schreiben `npx prettier --write docs/studio/warteschlange.md`, bei fehlendem `npx` Warnung statt stiller Abweichung; Test in `tools/studio/tests/`.
3. **E-048 · Gate liest das Ist aus der Zählung, UI-Pakete mit Browser-Abnahme budgetieren mit 150** (B3, B4). Kosten: 2 Sätze im Handbuch (Budget-Zählung, Gate), rund 5 Tools; Messauftrag dazu: erster Session-End-Push mit `zeitreserve-push` und dem Ergebnis des CI-Laufs im Bericht der nächsten Retro (B4).
4. **Messauftrag Messpakete in der Steuerungsanteil-Zeile** (Ampel): lead-art-Messpakete getrennt von Lead-Steuerung ausweisen. Kosten: 1 Tool-Aufruf im Coach-Lauf der nächsten Retro, kein Eingriff.
5. **Messauftrag E-037 an lead-art**: bei jedem Messlauf des nächsten Perf-Pakets die Zahl der Hintergrund-Läufe nennen (Bericht-Zeile). Kosten: 1 Satz im Briefing von L0.

## Bewertung laufender Experimente

- E-037: Datenpunkt 38,2 % Cache-Write 5 min (Session), Ausgang 29,2 %/21,7 %; Schwelle ≤ 20 % im Mittel über 3 Sessions → weiter beobachten, 14 Neuschreibungen von lead-art nach Bash-Pausen sprechen gegen eine Wirkung im Lead-Pfad (ein Datenpunkt, noch kein Befund).
- E-043: nicht gestartet; B4 stützt die Hochrechnung, entscheidet nicht → vorgeschlagen.
- E-045: R341 verschiebt PANEL-UEBERSICHT wegen der Lastgrenze (R329); ein Messbericht mit Load-Angabe ist hier nicht geprüft → weiter beobachten.
- E-022, E-027, E-034, E-041: keine neuen Daten.

## Änderungen an lernen.md

- neu: Actions-Minuten sind eine Ampel-Grösse (B1) · neu: Warteschlangen-Texte mit `*`/`_` brauchen Prettier nach dem Schreiben (B2) · gestrichen: Zeile zum Union-Merge von `docs/beobachtungen.md` (überholt, `merge=union` entfällt seit R303)
