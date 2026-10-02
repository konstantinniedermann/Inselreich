# Retro meilenstein M7 „Stimmung" inkl. Isometrie — 2026-10-01

- Datum: 2026-10-01
- Art: meilenstein
- Auslöser: `meilenstein:M7` (M7 live, R124); `failed:5e248230-9f9f-4bab-b006-b9ad62b6f480:a7b31489602e7f6b0` (production-integrator M7-MERGE, Abbruch nach Rebase)
- Datenbasis: `docs/studio/metriken/M7.md`, `docs/studio/metriken/S-2026-10-01-5e248230.md`, `docs/studio/metriken/S-2026-10-01-ddd9a9ac.md`, `docs/studio/rulings.md` (R82–R124), `docs/studio/retros/2026-10-01-session-5e248230.md`, `docs/studio/retros/2026-10-01-session-ddd9a9ac.md`, `.studio/events.jsonl` (`result`-Events, Records Meilenstein M7), `.studio/archiv/briefings/` (60 Briefings mit `Meilenstein: M7`), `.studio/archiv/berichte/20261001-140856-lead-production-aa83a5ac8752c500a.md`, `.studio/archiv/berichte/20261001-140624-production-integrator-a7b31489602e7f6b0.md`
- Umfang: ein Start, rund 30 Werkzeugaufrufe. Begründung: Meilenstein mit zwei Sessions, einer Cloud-Session ohne lokale Rohdaten und Nacheichung der Richtwerte (E-001). Keine Lead-Befragung: L0 hat keine Agent-IDs genannt, die Archiv-Berichte beantworten die Fragen.
- Grenze der Messung: `metriken/M7.md` enthält nur die lokalen Sessions 664ac8d3 und 5e248230. Die Cloud-Session ddd9a9ac (96 Agenten, 323,8 min, 1650 Werkzeugaufrufe, `metriken/S-2026-10-01-ddd9a9ac.md`) fehlt, weil ihre Rohdaten im Cloud-Container lagen. Welle 2 (R2, R3, R4, M6-U1–U3, D1) ist daher nur über Rulings belegt.

## Befunde

### B1 · Zwei L0-Sessions parallel ohne Abstimmung — Muster

- Beobachtung: Die lokale Session 5e248230 und die Cloud-Session ddd9a9ac arbeiteten gleichzeitig an M7. Die Cloud-Session startete in einem frischen Container, in dem `origin` nur `main` kannte. Die lokalen Branches waren nie gepusht. A1, A2, R5 und X1a wurden deshalb neu umgesetzt, die M8-Spec ging verloren. Beide Sessions vergaben R107 und R118, was zu Umnummerierungen und einem Revert führte (R118 → umnummeriert, Cloud-R118 → R120). Die lokale Welle 2 (R118) plante auf einem veralteten Stand und wurde durch R119 überholt. Gelöst wurde das durch `git fetch`, eine Nachricht und eine Übergabe (R119, R120).
- Beleg: `rulings.md` R107 (1), R118 (Vorbemerkung), R119, R120 (Vorbemerkung, Punkt 4); `state.md` „Parallele Sessions" (Cloud-Session nur als „idle, übergeben" eingetragen). Lokaler Aufwand der vier doppelt umgesetzten Pakete laut Records: 7 Agenten, 70,3 min, 157 Werkzeugaufrufe (Untergrenze). Bei X1a wurde umgekehrt die lokale Fassung genommen (R119 a), denn die Cloud-Fassung war durch die Netzwerk-Policy blockiert (R109). Nummernkollisionen gab es auch schon früher: R90 („ursprünglich als R82 in der parallelen Session 01HkLmgZ").
- Wirkung: rund 4 Pakete Doppelarbeit, 3 Rulings Abstimmungsaufwand (R118-Umnummerierung, R119, R120), 1 Revert. Die Doku-Auflage im Final-Review (R123: „Fremde Assets sind derzeit nicht eingebunden") folgt aus derselben Spaltung: D1 entstand in der Cloud ohne Assets, die Assets kamen aus der lokalen Session.
- Deutung: Das ist ein Muster. Es gab 3 Nummernkollisionen in 2 Episoden. Verlorene Arbeit, veralteter Stand und falsche Doku haben dieselbe Ursache: Die zwei Sessions teilten keinen Zustand, weil vor dem ersten Ruling weder `git fetch` noch Push lief. E-002 regelt Datei-Eigentum in `state.md`. Das wirkt aber nur, wenn beide Sessions denselben, gepushten `state.md` sehen.

### B2 · Rebase-Vorfall R124: geteilter Arbeitsbaum — Muster

- Beobachtung: Der Integrator mergte `--no-ff ce5b13a` als a3c08dc. 30 Sekunden vorher hatte ein Lead im Hauptcheckout direkt committet und gepusht (d21868b, M7-UX-Spec). 8 Sekunden nach dem Merge lief im Hauptcheckout `git pull -q --rebase`. Laut R124 kam es vom Kleinkorrektur-Commit von lead-qa. Der Pull linearisierte den ungepushten Merge zu 39 kopierten Commits (183ae81), die dann gepusht wurden. Der Integrator erkannte den fremden HEAD beim Nachher-Check und brach ohne Push ab. Der Dateistand ist identisch, die Merge-Klammer fehlt.
- Beleg: R124 (1)–(2); `.studio/archiv/berichte/20261001-140856-lead-production-aa83a5ac8752c500a.md` (Zeitablauf aus dem Reflog, „Integrator … hat HEAD vor dem Merge nicht erneut geprüft"); Events `a7b31489602e7f6b0` (agent_start 14:04:42 UTC, agent_stop 14:06:24 UTC, „abgebrochen, nicht gepusht").
- Wirkung: Die History auf `origin/main` ist dauerhaft linear (kein Force-Push, §6). Dazu kamen ein blockierter Merge-Start und ein Entscheid D-M7-MERGE-01. Der Inhalt ist nicht beschädigt.
- Deutung: Für sich ist das ein Einzelfall, aber er gehört zur Klasse „fremder Schreibzugriff auf einen geteilten Arbeitsbaum". In M7 gab es davon 6 Fälle in 2 Sessions: einen Probe-Revert auf main (Retro session-5e248230 B6), den umgestellten QA-Baum `ui-qa` (R116), die Kollision von `lib.mjs` im Scratchpad (R111), ein bares `git stash` bei fünf Worktrees (Retro ddd9a9ac B5), den Commit eines Leads im Hauptcheckout während des Merge-Fensters und das `pull --rebase` (R124). Damit ist es ein Muster. R124 (2) regelt den Hauptcheckout, die anderen Fälle stehen bisher nur in `lernen.md`.

### B3 · Prüfauftrag Integrator R106 (2): Zwischenstand Start 1 von 3

- Beobachtung: lead-production startete den Integrator mit `run_in_background: false`. Das Werkzeug meldete trotzdem „Async agent launched". Der Bericht kam bei lead-production an, nicht bei L0. Anders als in den Sessions 664ac8d3 und 5e248230 sind SubagentStart und Stop erfasst (Dauer 2,2 min, 10 Werkzeugaufrufe; Records M7). Es gibt keinen Vorfall „Agent unbekannt inaktiv". Der offene Vorfall `failed:…a7b31489602e7f6b0` ist der begründete Abbruch aus B2 und kein Harness-Fehler.
- Beleg: R124 (3); Bericht lead-production (Abschnitt „Prüfauftrag"); `.studio/events.jsonl` (spawned `status: async_launched`, agent_start, agent_stop).
- Wirkung: Alle drei Prüfkriterien aus der Retro session-5e248230 (P2) sind erfüllt: Der Bericht kam beim Lead an, Start und Stop sind erfasst, es gibt keinen Inaktiv-Vorfall. Die Meldung „async" widerspricht dem Schalter, schadet aber nicht.
- Deutung: Ein Start ist kein Muster. Vorläufig gilt: Der Harness führt Starts aus einem Lead immer asynchron aus, liefert den Bericht aber an den Aufrufer, wenn `false` gesetzt ist. Bleibt das bei Start 2 und 3 so, ist der Prüfauftrag ohne Eintrag in `beobachtungen.md` erledigt (R106 (2) verlangt den Eintrag nur, wenn der Bericht bei L0 landet).

### B4 · E-001: Schätzung trifft bei den Werkzeugaufrufen

- Beobachtung: Über 43 verglichene Agenten wurden 1813 Werkzeugaufrufe geschätzt, 1807 waren es tatsächlich (−0,3 %). Bei den Minuten waren es 347 geschätzt und 461,6 tatsächlich (+33,0 %). Eine Tabellenzeile nennen 42 von 60 M7-Briefings (70 %). Die Session-Metrik 5e248230 zeigt dasselbe Bild über 55 Agenten: Werkzeugaufrufe −16,3 %, Minuten +14,6 %.
- Beleg: `metriken/M7.md` „Schätzung gegen Ist"; `metriken/S-2026-10-01-5e248230.md`; Zählung `grep "^Schätzung:.*Tabellenzeile"` in `.studio/archiv/briefings/`.
- Wirkung: Die Abweichung lag in Studio-Graph bei −93 % und in M5 bei +60,5 % (Werkzeugaufrufe). Jetzt liegt sie zum ersten Mal über einen ganzen Meilenstein innerhalb von ±50 %.
- Deutung: Die Schwelle ist erreicht, und die Stufe wurde angewendet (70 % ≥ 50 %). Die Minuten werden nur berichtet. Ihr Vorzeichen hat gewechselt (M5 −77,9 %, M7 +33 %), weil die Umrechnung „Tools ÷ 6" zu schnell ist. In M7 lag die Rate bei 3,9 Tools/min. Die Richtwerte sind deshalb nachgeeicht (`metriken/richtwerte.md`, Abschnitt „Nacheichung M7").

### B5 · Gates: jede Spec- und Plan-Prüfung brauchte genau eine Nacharbeit — Muster, das trägt

- Beobachtung: In M7 lief jede Gate-Prüfung gleich ab: Gate Spec M7 (R83 → R84), Gate Spec M7-ISO (R93 → R95), Gate Plan M7 (R96 → R98) und Gate Spec M7-UX (R122 → R124 (4)). Jedes Mal folgte auf BEDENKEN eine gebündelte Nacharbeit und danach eine Zweitprüfung nur der geänderten Stellen. Ein ZURÜCK und eine zweite Runde gab es nie. In M6 war es ebenso (R82, R87).
- Beleg: die genannten Rulings; `result`-Events M7-ISO und M7-PLAN-ISO mit je 2 Runden.
- Wirkung: Die Gates kosteten je einen Prüfdurchgang mehr. Gefangen wurden dafür ein unerfüllbares AK (R83, QA 1), eine Datenkollision mit M6 (R83, QA 3/Tech B4) und ein Rechenfehler im Budget (R97).
- Deutung: Das Muster ist gewollt und billig. Der Ablauf „BEDENKEN → eine Runde → Zweitprüfung" trägt. Handlungsbedarf gibt es keinen.

### B6 · Umsetzung: Zwischen-Merges und Slice-Stopp haben getragen

- Beobachtung: Vom ersten M7-Start (2026-09-30, 20:56) bis M7 live (2026-10-01, rund 16:06) vergingen rund 19 Stunden. Der Isometrie-Nachtrag lief vom Nutzerwunsch (R91) bis live an einem Tag. Zwei Zwischen-Merges (R100, R105) hielten main und Pages spielbar. Der Slice-Stopp (R104) brachte die Nutzerreaktion „Gefällt mir" (R118), bevor der Grossteil der Arbeit begann. Zur Qualität: Erstabnahme 50 %, Nacharbeit 6 von 38 (16 %), Review-Runden im Mittel 1,5, verworfen 0. Das Maximum von 4 Runden blieb bei M7-R1a ein Einzelfall. In den lokalen `result`-Events hat sonst kein Paket mehr als 2 Runden, Welle 2 (Cloud) hatte laut R111 und R114 je eine Fix-Runde. Das Final-Review endete mit BEDENKEN ohne Code-Blocker und mit einer Doku-Auflage (R123).
- Beleg: Records M7 (Spanne), `metriken/M7.md` „Qualität", `result`-Events, R100, R104, R105, R111, R114, R118, R123.
- Wirkung: Der Nutzer konnte den Stand zweimal vor dem Meilensteinende spielen, ein Umbau nach dem Slice war nicht nötig.
- Deutung: Getragen haben vier Dinge: (1) Isometrie als Nachtrag im laufenden Render-Strang statt als eigener Meilenstein (R91), (2) die Zwischen-Merges mit eigenem Gate, (3) der Slice-Stopp ohne Warten (R93), (4) Review und QA, die echte Fehler fanden (R113 Picking, R114 Laternen, R112 Fokus). Gebremst haben: B1 (Doppelarbeit, Abstimmung), Wortlaut-Konflikte der Spec, die erst während der Umsetzung ausgelegt wurden (R104 drei Messauslegungen, R113, R114 (2), dann R117 (1) mit Korrektur von R114 (2)), sowie die Last auf lead-art (390,9 von 698,7 min = 56 %, 1447 von 2882 Werkzeugaufrufen = 50 %). Die Spec-Auslegungen sind noch kein eigenes Muster: R106 (3) hat die R104-Auslegungen in den Spec-Text übernommen, danach brauchte kein Paket mehr als 2 Runden.

### B7 · Messlücke: Meilenstein-Metrik ohne Cloud-Session

- Beobachtung: `metrics.py --milestone M7` zählt 2 Sessions (664ac8d3, 5e248230). Die Cloud-Session ddd9a9ac hat eigene Metriken (`metriken/S-2026-10-01-ddd9a9ac.md`), aber ihre Records fehlen lokal. Ausserdem führt die Zeile `studio-director` 812 Agenten, von denen 1 gemessen ist.
- Beleg: `metriken/M7.md` (Sessions 2, Zeile studio-director), `metriken/S-2026-10-01-ddd9a9ac.md`.
- Wirkung: Aufwand und Qualität von Welle 2 fehlen in der Meilenstein-Metrik. Der M7-Aufwand ist um mindestens 323,8 min und 1650 Werkzeugaufrufe unterschätzt.
- Deutung: Das ist ein Werkzeug-Befund ausserhalb des Coach-Scopes und steht als Eintrag in `docs/beobachtungen.md`. E-001 ist davon nicht betroffen: Die Cloud-Session hatte 0 verglichene Agenten.

## Befragung der Leads

- keine: Für die Befragung fehlten die Agent-IDs. Den Bericht von lead-production zu M7-MERGE (Rebase-Zeitablauf, Prüfauftrag) und den Integrator-Bericht habe ich im Archiv gelesen. Die Fragen zu B1 beantworten die Rulings R107–R120 und die Cloud-Retro.

## Vorschläge

Höchstens 3. Hier sind es 2, beide als Experiment in `experimente.md` (Status `vorgeschlagen`). Sie ersetzen die offenen Handbuch-Vorschläge 1–3 aus der Retro ddd9a9ac.

- **P1 · E-005 · Abstimmung paralleler L0-Sessions über origin (Stufe 2 von E-002).** Vor dem ersten Ruling führt die Session `git fetch` aus und pusht ihren Eintrag in „Parallele Sessions". Vor jedem Ruling prüft sie die nächste freie Nummer gegen `origin/main`. Die Push-Pflicht für Strang-Branches (R107) kommt ins Handbuch. Messgrösse: In der nächsten Episode gibt es 0 Ereignisse aus diesen Klassen: Nummernkollision, Neuumsetzung wegen ungepushtem Branch, Welle auf veraltetem Stand, Basis-Drift-Ruling. Ausgangswert M7: 2 / 4 / 1 / 0. Das Experiment übernimmt den Platz von E-002.
- **P2 · E-006 · Exklusive Arbeitsbäume.** Der Hauptcheckout gehört L0 und im Merge-Fenster nur dem Integrator. Leads und Arbeiter committen nur in eigenen Worktrees. QA-Bäume und Scratchpad-Unterordner sind exklusiv. Erlaubt ist nur `pull --ff-only`, kein bares `git stash`. Der Integrator prüft HEAD direkt vor dem Merge und vor dem Push (Persona). Messgrösse: Bis Ende M8 gibt es 0 fremde Schreibzugriffe auf geteilte Arbeitsbäume. Ausgangswert M7: 6. Start, sobald ein Platz frei wird. Bis dahin gilt R124 (2) als Ruling und steht in `lernen.md`.

## Bewertung laufender Experimente

- E-001: Werkzeugaufrufe −0,3 % über 43 Agenten (Schwelle ±50 %, mindestens 10 Agenten), Anwendung 42 von 60 Briefings (70 %) → **behalten** (Bestätigung per Ruling). Richtwerte sind nachgeeicht.
- E-002: Der Zeitraum ist erreicht (2. Episode). Basis-Drift-Rulings: 0 in beiden Episoden. Die Schwelle ist damit formal erfüllt, aber der eigentliche Schaden der 2. Episode lag ausserhalb der Messregel (B1), und der Eintrag in `state.md` kam zu spät → **angepasst** über E-005 (Bestätigung per Ruling). Ist E-002 bewertbar? Ja: 2 Episoden liegen vor. Die Bewertung lautet aber nicht `behalten`, weil die Regel die zweite Episode nicht abgedeckt hat.
- E-003: Sessions mit Auslegung: 5e248230 (R91, R105, R118, alle mit „Zweck der Anweisung") und ddd9a9ac (R107 (3) ohne). Das sind 2 von 3 Sessions. Korrekturen wegen Fehlauslegung: 0. R119 überholt R118 wegen neuer Lage, R115 korrigiert ein L0-Briefing, R117 eine Spec-Auslegung und keine Nutzeranweisung → weiter beobachten (eine Session fehlt).
- E-004: R106 (1) hat das Experiment angenommen, es wartete auf einen Platz. Mit „E-001 behalten" wird einer frei → **Start jetzt möglich**. Die Umsetzung (ein Satz im Budget-Abschnitt, Handbuch Minor) macht der Coach nach dem Ruling. Erster Prüffall ist das Budget-Ruling des Gate Plan M7-UX (R122 (4)).

## Änderungen an lernen.md

- neu: Dauerregel R124 (2) zum Hauptcheckout, zusammengeführt mit der Zeile „Schreibende Git-Proben"
- angepasst: Vordergrund-Regel (R124 (3): der Bericht kommt trotz „async" beim Lead an); Push-Pflicht (gilt auch lokal, R119 (e))
- gestrichen: keine (21 Inhaltszeilen)
