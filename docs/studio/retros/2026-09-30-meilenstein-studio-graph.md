# Retro meilenstein studio-graph — 2026-09-30

- Datum: 2026-09-30
- Art: meilenstein (zählt zugleich als Session-Retro der Session baff17bb)
- Auslöser: meilenstein:Studio-Graph
- Datenbasis: `docs/studio/metriken/Studio-Graph.md` (erzeugt 16:03:50); `.studio/events.jsonl` (Events `result`, `budget`, `milestone`, `spawn` mit `estimate`), nachgezählt mit `model.build_state` und `metrics._milestone_state`; `tools/studio/model.py` (`finalize`, `running_milestone`, Z. 1031–1056); `docs/studio/rulings.md` R39–R44, R51–R53; Retros `2026-09-30-adhoc-budget-lead-tech.md`, `-adhoc-inaktiv-web-fetch.md`, `-adhoc-ci-pages.md`; Rückfrage an lead-tech (a7d28d82884a57eca); Beobachtungen von L0 im Briefing G-retro

Umfang: ein Start, rund 25 Werkzeugaufrufe. Eine Rückfrage statt zwei, weil Event-Log und Rulings die übrigen Punkte belegen.

## Befunde

### B1 · Schätzungen in Minuten liegen systematisch 5- bis 20-fach zu hoch

- Beobachtung: Die Leads schätzen in Menschenzeit. Die Arbeiter brauchen ein Zwanzigstel bis ein Fünftel davon. Die Werkzeugaufrufe sind besser geschätzt, aber auch zu hoch, wenn der Plan fertigen Code enthält.
- Beleg (gemessen):

  | Session / Meilenstein                                | verglichene Agenten | Minuten geschätzt / Ist | Tools geschätzt / Ist | Median Ist/Schätzung (Minuten) |
  | ---------------------------------------------------- | ------------------- | ----------------------- | --------------------- | ------------------------------ |
  | baff17bb / Studio-Graph (`metriken/Studio-Graph.md`) | 28                  | 655 / 44,2 (−93,3 %)    | 847 / 375 (−56 %)     | 0,05 (nachgezählt)             |
  | 25e8352d / M5 (nachgezählt, keine Metrik-Datei)      | 13                  | 271 / 84,7 (−69 %)      | 374 / 347 (−7 %)      | 0,18                           |

  Beispiele Studio-Graph: G-1 Ops 20 min geschätzt, 1,1 min Ist; G-9 UI 60 min / 1,6 min; G-final Review (opus) 45 min / 6,9 min.
  Ist je Rolle, Studio-Graph (Median über Arbeiter-Starts): production-studio-ops 1,1 min / 10 Tools (n = 10), qa-code-reviewer 0,7 min / 6 Tools (n = 11), tech-ui-engineer 1,5 min / 15 Tools (n = 2), qa-playtester 2,4–6,2 min / 19–35 Tools (n = 2).

- Befragung lead-tech (Selbstangabe): Minuten „nach Menschenzeit“ geschätzt; der Plan enthielt fertigen Code, den Arbeitern blieb Übernehmen und Testen. Er wünscht einen Richtwert je Rolle und Plan-Art, aus `metriken/` nachgeeicht.
- Deutung: Das ist ein Muster, kein Einzelfall. Es tritt in zwei Sessions, zwei Meilensteinen und bei 41 Agenten auf. Die Schätzung taugt heute weder für die Budget-Planung noch als Frühwarnung: Eine Abweichung von −93 % meldet nichts. Die Plan-Art (Code im Plan oder nur Spec) erklärt einen Teil des Unterschieds zwischen den beiden Meilensteinen. Das habe ich nicht getrennt gemessen.
- Wirkung: Die Kennzahl „Schätzung gegen Ist“ im Reiter Aufwand ist derzeit ohne Aussage.

### B2 · Parallele L0-Sessions ohne Datei-Eigentum kosten Nacharbeit an geteilten Studio-Dateien

- Beobachtung: Die M5-/S16-Session hat während des Meilensteins Handbuch/Verfassung, `model.py` und `hook.py` zweimal auf main geändert (L0, Beobachtung a). Gate Plan kam deshalb nur unter Auflage durch (R43: lead-production BEDENKEN „Basis-Drift“, Budget erst nach dem Merge von feat/studio-autonomie). Der Plan wurde zweimal nachgeführt. S16 erzwang den Zusatz-Task G-6c (R52). Rulings wurden neu nummeriert (`.studio/handoffs/2026-09-30-l0-rulings-prozessgraph.md`). R51 musste die Pakete S17-01…03 zurückstellen, weil beide Stränge `model.py` ändern.
- Beleg: Zwischen Gate Plan (Spawn lead-production 11:06) und Budgetfreigabe (12:56:49) liegen 1 h 50 min Wartezeit (`events.jsonl`). Kosten laut lead-tech (Selbstangabe, nicht gemessen): 1. Nachführung 60–80 Tool-Aufrufe, 2. Nachführung ~25, G-6c 2 Starts und ~16 Tools (G-6c gemessen: 0,8 min, 8 Tools). Die Koordination lief über 2 `message`-Events (Cross-Session).
- Deutung: Belegt ist eine Parallel-Episode mit vier betroffenen Paketen (G-Plan, G-6c, S17, Budget M5-01). Für ein Muster über Episoden fehlt noch die zweite Episode. Die Ursache ist aber dieselbe wie in der Budget-Retro B2: Das Studio nimmt eine Session an, sowohl bei Dateien als auch bei Kennzahlen. R43 („erst nach dem Merge planen“) war die richtige Ad-hoc-Antwort, steht aber nur als Einzel-Ruling da.
- Wirkung: rund 100 Tool-Aufrufe Nacharbeit (Schätzung lead-tech), 1 h 50 min Liegezeit, 3 zurückgestellte Werkzeug-Pakete.

### B3 · Die Meilenstein-Metrik mischt Agenten der parallelen Session ein

- Beobachtung: `metriken/Studio-Graph.md` meldet 2 Sessions und 96 Agenten. Nachgezählt stammen 26 der 96 Records aus der Session 25e8352d (M5/S16). Darunter ist das Ergebnis `S16-RETRO`, das in der Qualität als 14. Ergebnis mitzählt. Die Graph-Session hat nur 13 eigene Ergebnisse (G-1…G-10 inkl. 6a/6b/6c, G-final). 62 Records sind Helfer ohne Rolle unter `studio-director`, 25 davon aus der fremden Session.
- Beleg: `model.py` `finalize` fällt ohne Kopfzeile, Paket oder Vorfahr auf `running_milestone(started)` zurück. Diese Funktion liest eine globale Zeitachse der `milestone`-Events ohne Session (Z. 1050–1056). Der Studio-Graph-Start um 12:56:54 gilt so auch für Agenten der M5-Session, bis dort um 13:28:08 M5 startet.
- Deutung: Das ist ein Werkzeugfehler, kein Experiment. Er hat dieselbe Wurzel wie S17-03 (Budget je Session, R51). Die Helfer ohne Rolle sind als Beobachtung bekannt (`docs/beobachtungen.md`, „stop-only-Knoten in Aufwand und Qualität“). Die Kennzahlen dieses Meilensteins mit Stufe „gemessen“ (Schätzung gegen Ist, Erstabnahme) beruhen auf Records mit Kopfzeile. Sie sind deshalb kaum verfälscht (der S16-RETRO-Eintrag ist angenommen und verschiebt die Erstabnahme von 69 % auf 71 %). Die Zahlen „Agenten“ und „Sessions“ sind es.
- Wirkung: Die Kopfzahlen der Meilenstein-Metrik sind bei parallelen Sessions nicht belastbar.

### B4 · Was gut lief

- Gate Spec: lead-tech und lead-qa meldeten BEDENKEN, alles liess sich textlich lösen, ohne Designänderung (R41, R42).
- Umsetzung: 12 Umsetzungs-Ergebnisse, davon 8 im ersten Wurf angenommen. Nacharbeit gab es bei G-6a, G-7, G-9 und G-10, jeweils mit höchstens 2 Runden. Fix-Runden liefen per SendMessage. lead-tech verbrauchte 25 von 32 Starts (Budget-Retro B1), gescheiterte Agenten: 0 (`metriken/Studio-Graph.md`).
- Final-Review OK ohne hohe Befunde, 7 niedrige Punkte; die Punkte 1–3 wurden vor dem Merge erledigt (R53).
- Schritt 0 (Frontmatter-Probe): L0 klärte die Frage in einem Headless-Lauf in rund 1 min statt in einer eigenen Nutzersession (R41, Beobachtung d von L0). Das lässt sich übertragen, siehe lernen.md.

## Befragung der Leads

- lead-tech (a7d28d82884a57eca): Er schätzt Minuten in Menschenzeit und wünscht Richtwerte je Rolle und Plan-Art. Die Nachführungen kosteten ~60–80 + ~25 Tools, dazu G-6c. Verhindert hätte das eine verbindliche Ansage in `state.md`, welche Session welche Dateien besitzt, samt Merge-Reihenfolge je geteilter Datei; R43 solle Regel werden.
- lead-design, lead-qa, lead-production: nicht befragt (Rückfragen-Budget); ihre Urteile stehen in R41–R43 und R53.

## Vorschläge

- **E-001 · Schätzung aus Richtwerten statt Menschenzeit** (B1), siehe `docs/studio/experimente.md`.
- **E-002 · Datei-Eigentum bei parallelen L0-Sessions** (B2), siehe `docs/studio/experimente.md`.
- Kein Experiment zu B3: Das ist ein Werkzeugfehler. Paket-Kandidat für L0 (Empfehlung: mit S17-03 bündeln, gleiche Wurzel, gleiche Datei): `running_milestone` je Session auswerten, d. h. ein `milestone`-Start gilt nur für Knoten derselben `session_id`. Abnahme: Die Event-Folge von heute ergibt für Studio-Graph 1 Session, kein `S16-RETRO`, und die 25 Helfer aus 25e8352d fallen heraus.

## Bewertung laufender Experimente

- keine laufenden Experimente.

## Änderungen an lernen.md

- neu: Harness-Fragen per Headless-Lauf prüfen statt in einer Nutzersession (B4).
- neu: Meilenstein-Metrik bei parallelen Sessions je Session nachzählen, bis der Fix da ist (B3). Die Datei hat jetzt 10 Zeilen.
