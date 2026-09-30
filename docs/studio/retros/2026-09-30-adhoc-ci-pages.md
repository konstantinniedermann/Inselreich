# Retro adhoc ci-pages — 2026-09-30

- Datum: 2026-09-30
- Art: adhoc
- Auslöser: ci:36722357966
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

## Befragung der Leads

- keine; der Vorfall betrifft die Plattform, Belege aus GitHub und dem Event-Log genügen.

## Vorschläge

Keine Experimente. Paket-Kandidat für L0 (Empfehlung: annehmen, klein, Scope Studio/`tools/studio/`):

- **ci-seen nach (run_id, attempt) entprellen, das neueste Ergebnis gilt.** `FIELDS` um `attempt` erweitern. In `ci-seen.json` den Schlüssel `run_id:attempt` speichern (oder je `run_id` den zuletzt gesehenen `attempt` und die `conclusion`). Ein neuer Versuch erzeugt ein neues `ci`-Event mit `attempt`. Das Modell wertet je `run_id` nur das Event mit dem höchsten `attempt` (bzw. das jüngste) aus. Ein Vorfall `ci:<run_id>` gilt als erledigt, sobald dieses neueste Ergebnis `success` ist.
- Abnahme: Ein Test mit der Folge `failure` (attempt 1) → `success` (attempt 2) für dieselbe `run_id` ergibt keinen offenen Vorfall, und der Lauf zählt nicht als rot. Gegenprobe: Ein zweiter `collect`-Aufruf ohne neuen Versuch erzeugt kein weiteres Event. Bestehende `ci-seen.json` mit reinen `run_id`s werden weiter gelesen (als attempt 1).

## Bewertung laufender Experimente

- nicht Gegenstand dieser Ad-hoc-Retro.

## Änderungen an lernen.md

- neu: Ein roter Pages-Lauf mit „Failed to get ID Token“ ist ein Plattform-Timeout: einmal neu starten, erst bei Wiederholung untersuchen. Bis zum Fix gilt der Vorfall nach einem grünen Rerun als erledigt. Die Datei hat jetzt 7 Zeilen.
