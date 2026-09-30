# Retro adhoc ci-pages — 2026-09-30

- Datum: 2026-09-30
- Art: adhoc
- Auslöser: ci:36722357966; nachgereicht von L0: inaktiv:25e8352d-e7fa-409a-b7b9-7f90fd3d92b0:a4262c63e036f5c23 (eigene Quittung RETRO-INAKTIV-LD)
- Datenbasis: `gh run list --workflow pages.yml` (alle 7 Läufe), `gh run view 36722357966 --attempt 1 --log-failed`, `.studio/events.jsonl` (Zeilen 1849–1864, 2868–2869), `ci-seen.json` unter `studio_home()`, `tools/studio/ci.py` (`collect`, Z. 29–76), `.github/workflows/pages.yml`

## Befunde

### B1 · Transienter OIDC-Timeout bei GitHub, kein struktureller Fehler

- Beobachtung: Beim Pages-Lauf für den Merge a26f38c schlug im ersten Versuch nur der Job `deploy` fehl, `build` war grün. Der Rerun (Versuch 2) war ohne Änderung grün.
- Beleg: Das Log von Versuch 1 zeigt um 13:32:47Z „Error: Error message: Failed to get ID Token.“, nach `error_count: 10` Wiederholungen (`actions/deploy-pages@v4`). `gh run list` zeigt: 36722357966 `success`, `attempt 2`. Alle 6 Pages-Läufe davor waren im ersten Versuch grün (94c60a7 bis d2b1291). Seit 94c60a7 ist `pages.yml` unverändert (`git diff d2b1291 a26f38c -- .github/` ist leer), und `id-token: write` ist gesetzt. Der CI-Lauf 36722358150 zum selben Commit war grün.
- Deutung: Das Token hat bei GitHub nicht rechtzeitig geantwortet (Zeitüberschreitung). Das ist ein Einzelfall (1 von 7 Läufen, ohne Muster). Berechtigung, Workflow und Code scheiden als Ursache aus. Deshalb schlage ich kein Experiment vor: Ein Retry im Workflow würde nur einen seltenen Plattformfehler verstecken.
- Wirkung: Pages zeigte bis zum Rerun den Stand vor a26f38c. Dazu kamen eine Ad-hoc-Retro (ein Coach-Start) und ein manueller Rerun durch L0.

### B2 · Nebenbefund: ci.py erfasst das Ergebnis eines Reruns nicht

- Beobachtung: Nach dem grünen Rerun meldete `python3 tools/studio/ci.py` „0 neue Läufe“. Im Event-Log steht für 36722357966 weiterhin nur `conclusion: failure` (Zeile 2869).
- Beleg: `ci.py` `collect` überspringt jeden Lauf mit `run_id in seen` (Z. 37). In `ci-seen.json` werden nur `run_id`s gespeichert (Z. 64–76), und `FIELDS` (Z. 15) enthält weder `attempt` noch `updatedAt`. Ein Rerun behält seine `run_id` und wird daher nie neu gelesen.
- Deutung: Das ist ein offensichtlicher Fehler und kein Grund für ein Experiment. Die Metrik „CI auf main rot“ zählt deshalb auch Läufe, die nach einem Rerun grün sind. Das verfälscht Dashboard und Metriken dauerhaft und kann bei jedem weiteren Rerun wieder passieren.

### B3 · Vorfall „lead-design ist inaktiv“: Phantomknoten, kein langes Denken

- Beobachtung: Der gemeldete Knoten a4262c63e036f5c23 ist nicht der laufende `lead-design`. Der Lead für M5-02 ist a1b08ef5d0db0fd8d: Spawn 13:28:45, Arbeiter gestartet 13:30:44 und 13:31:02, `result` geloggt 13:35:54/55.
- Beleg: `.studio/events.jsonl` enthält für a4262c63e036f5c23 genau ein Event, `bind` (role lead-design, M5-02) um 13:30:21, zwei Sekunden nach `status delegated` des echten Leads. Für diesen Knoten gibt es weder `spawn` noch `agent_start`, `agent_stop` oder Heartbeats. Die grösste Lücke des echten Leads beträgt 292 s (13:31:02 → 13:35:54) und liegt damit unter `INACTIVE_DEFAULT = 300` (`tools/studio/model.py` Z. 18). Er selbst wäre also nicht gemeldet worden.
- Muster geprüft: Alle Lücken ≥ 120 s je Agent über das ganze Event-Log (37 Stück). Bei aktiven Leads liegt keine Lücke ≥ 300 s. Die Spitzen sind lead-tech mit 263 s und 234 s (Bash) sowie lead-design mit 250 s. Alle grösseren Werte liegen zwischen `agent_stop` und einem erneuten `agent_start`, also bei fortgesetzten Agenten, und zählen nicht als aktiv.
- Deutung: Die Vermutung „lange Denkphase nach Arbeiter-Ende“ trägt die Daten nicht. Auslöser ist ein `bind` unter einer fremden `agent_id`, der einen Knoten ohne Lebenszyklus anlegt. Dieser bleibt LIVE und gilt nach 300 s als inaktiv. Woher die `agent_id` stammt, ist offen; die Daten zeigen es nicht. Ein Muster bei Leads nach Arbeiter-Ende ist nicht belegt (n = 1, und auch dieser Fall liegt unter der Schwelle).
- Wirkung: ein Fehlalarm und eine Rückfrage von L0. Laufzeit und Parallelität von lead-design sind für diesen Phantomknoten überschätzt (siehe Retro inaktiv-web-fetch, B2).

- keine; der Vorfall betrifft die Plattform, Belege aus GitHub und dem Event-Log genügen.

## Vorschläge

Keine Experimente. Eine höhere Inaktiv-Schwelle für L1 oder ein `status waiting --task "Bericht schreiben"` vor dem Bericht empfehle ich nicht (Ablehnung): Keine Lead-Lücke hat 300 s erreicht. Beides würde nur Fehlalarme überdecken, die von Phantomknoten stammen, und die Messbarkeit echter Hänger verschlechtern.

Hinweis: Beide Paket-Kandidaten betreffen `tools/studio/`. Dort arbeitet parallel die Prozess-Graph-Session; L0 muss die Kandidaten mit ihr abstimmen oder danach einplanen.

Paket-Kandidat 1 für L0 (Empfehlung: annehmen, klein):

- **ci-seen nach (run_id, attempt) entprellen, das neueste Ergebnis gilt.** `FIELDS` um `attempt` erweitern. In `ci-seen.json` den Schlüssel `run_id:attempt` speichern (oder je `run_id` den zuletzt gesehenen `attempt` und die `conclusion`). Ein neuer Versuch erzeugt ein neues `ci`-Event mit `attempt`. Das Modell wertet je `run_id` nur das Event mit dem höchsten `attempt` (bzw. das jüngste) aus. Ein Vorfall `ci:<run_id>` gilt als erledigt, sobald dieses neueste Ergebnis `success` ist.
- Abnahme: Ein Test mit der Folge `failure` (attempt 1) → `success` (attempt 2) für dieselbe `run_id` ergibt keinen offenen Vorfall, und der Lauf zählt nicht als rot. Gegenprobe: Ein zweiter `collect`-Aufruf ohne neuen Versuch erzeugt kein weiteres Event. Bestehende `ci-seen.json` mit reinen `run_id`s werden weiter gelesen (als attempt 1).

Paket-Kandidat 2 für L0 (Empfehlung: annehmen, zuerst Ursache klären):

- **`bind` legt keinen Lebend-Knoten an.** Ein `bind` für eine `agent_id` ohne `spawn`/`agent_start` erzeugt keinen LIVE-Knoten bzw. keinen `inaktiv`-Vorfall. Vorher klären, welcher Prozess a4262c63e036f5c23 war (Hook-Payload). Abnahme: Die Event-Folge aus B3 ergibt keinen `inaktiv`-Vorfall. Gegenprobe: Ein echter Lead mit `agent_start` und 300 s Stille wird weiterhin gemeldet.

## Bewertung laufender Experimente

- nicht Gegenstand dieser Ad-hoc-Retro.

## Änderungen an lernen.md

- neu: Ein roter Pages-Lauf mit „Failed to get ID Token“ ist ein Plattform-Timeout: einmal neu starten, erst bei Wiederholung untersuchen. Bis zum Fix gilt der Vorfall nach einem grünen Rerun als erledigt. Die Datei hat jetzt 7 Zeilen.
- geändert: Die Zeile zu „inaktiv“ nennt jetzt den Phantomknoten (nur `bind`, ohne Start/Stopp) als Messartefakt; die Zeilenzahl bleibt 7.
