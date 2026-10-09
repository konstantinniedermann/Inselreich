# Changelog des Studios

Verlauf aller Versionen des Handbuchs ([STUDIO.md](STUDIO.md)) und der Personas
(`.claude/agents/*.md`). Die Verfassung ([VERFASSUNG.md](VERFASSUNG.md)) hat keinen Eintrag hier; sie
ändert nur der Nutzer.

**Format** — neueste Einträge oben, je Änderung ein Eintrag:

```markdown
## <Datum JJJJ-MM-TT> · <Gegenstand> <Version>

- Anlass: <Retro, Vorfall oder Auftrag>
- Datenbasis: <Metrik-Datei, Retro-Bericht oder Auftrag>
- Ruling: <R-Nummer(n)>
- Änderungen: <Stichworte>
```

- **Gegenstand** ist `Handbuch` oder `Persona <name>` (z. B. `Persona lead-tech`).
- **Version:** Handbuch Minor (1.0 → 1.1) je angenommenem Experiment, Major (1.x → 2.0) bei einem
  Umbau der Organisation; Persona Minor je Änderung. Die Version im Kopf von STUDIO.md bzw. im
  Frontmatter-Feld `version` der Persona stimmt immer mit dem neuesten Eintrag überein (geprüft von
  `tools/studio/tests/test_docs.py`). Persona ohne Eintrag: Version 1.0.
- Frühere Fassungen stehen in Git.

## 2026-10-09 · Handbuch 1.35

- Anlass: Release-Retro REL-12 (Plan-Nacharbeit, ungültige Messungen unter Last)
- Datenbasis: `docs/studio/retros/2026-10-09-release-rel12-prozess.md`
- Ruling: R417 (V1, V3; V2 Werkzeug-Paket)
- Änderungen: Briefing-Vorlage Punkt 5: Pflichtzeilen Plan-Format (E-010, ≤ 10 KB) und `make docs-check` vor Doku-Commit; Gate Spec: neue AK-Nummern vergibt L0; Gate Merge Release: Leistungs-AK mit deterministischem Test ohne Browser-Messung, sonst nur ohne paralleles Lastpaket

## 2026-10-09 · Handbuch 1.34

- Anlass: Session-Retro e90e097e (drei Integrator-Abbrüche an schnellen Prüfungen, dritter Fall unbelegter Rot-Phase)
- Datenbasis: `docs/studio/retros/2026-10-09-session-e90e097e-ende.md`, `docs/studio/metriken/S-2026-10-09-e90e097e.md`
- Ruling: R410 (V1, V2; V3 Platzvergabe E-049)
- Änderungen: Briefing-Vorlage Punkt 5: tsc-Zeile erweitert zu „schnelle Make-Prüfungen ohne Testlauf“ (`tsc`, `lint`, `zeittests`, `conflicts`), neue Pflichtzeile Rot-Beleg; Integrator-Vorlauf in STUDIO.md um `make zeittests` und `make conflicts` ergänzt; E-049 Ruling-Feld

## 2026-10-09 · Handbuch 1.33

- Anlass: Ad-hoc-Retro Push-Gate REL-10 (vierfacher Push-Anlauf) und Typcheck-Lücke
- Datenbasis: `docs/studio/retros/2026-10-09-adhoc-pushgate-rel10.md`
- Ruling: R395 (V1), R398 (3)
- Änderungen: Briefing-Vorlage Punkt 5 und Gate Merge: Pflichtzeilen `npx tsc --noEmit` und Vorbedingungs-Fehlerrichtung; Push-Ablauf in STUDIO.md (tsc und lint vor `make test`, Last ≤ 4 vor `make zeitreserve-push`); lernen.md-Zeile

## 2026-10-09 · Handbuch 1.32

- Anlass: Retro [session-29c3791b-ende](retros/2026-10-08-session-29c3791b-ende.md) Nachtrag Teil 2, B8, B9, B12 c (V6, E-052)
- Datenbasis: `docs/studio/metriken/S-2026-10-08-29c3791b.md`, Rulings R363, R370, R383–R386, R388; Plan `docs/superpowers/plans/2026-10-09-see-f1-korridor.md`
- Ruling: R392
- Änderungen: Briefing-Vorlage Punkt 5 um zwei Pflichtzeilen ergänzt: Pakete mit `src/`-Änderung messen vor Task 1 die berührten bestehenden Tests auf main (`vitest related`) und vergleichen bei der Abnahme main/Branch unmittelbar nacheinander; Pakete mit Plan streichen keine Prüfschritte zur Budgetersparnis, sondern melden Mehrbedarf. E-052 in `experimente.md` als Vorlagenzeile übernommen

## 2026-10-08 · Handbuch 1.31

- Anlass: Retro [session-29c3791b-ende](retros/2026-10-08-session-29c3791b-ende.md) B3, B5 (V3, V4)
- Datenbasis: `docs/studio/metriken/S-2026-10-08-29c3791b.md`, Rulings R350, R354, R358, R367, R369, R303
- Ruling: R375
- Änderungen: Briefing-Vorlage Punkt 5 um Pflichtzeilen je Paketart ergänzt (Mehrbedarf vorab melden; Werkzeug: `make studio-test` und Echtlauf gegen externe APIs; Experiment-/Handbuch-/Persona-Änderungen: `make studio-test`); `gates.md` an R303 angeglichen (kein `merge=union` für `docs/beobachtungen.md`, Konflikt löst der Eigentümer des späteren Branches per Merge); Reihenfolge der Wartenden in `experimente.md` (E-038, E-048, E-050, E-049, E-044)

## 2026-10-08 · Persona qa-playtester 1.7

- Anlass: Prozess-Retro REL-08, Vorschlag P3 (Wegwerf-Skripte im Release-Smoke)
- Datenbasis: `docs/studio/retros/2026-10-08-prozess-rel08.md`
- Ruling: R365
- Änderungen: Release-Check nutzt das feste Skript `tools/render-qa/smoke.mjs` und ergänzt nur paketspezifische Schritte

## 2026-10-08 · Handbuch 1.30

- Anlass: Prozess-Retro REL-07 (Vorschläge angenommen)
- Datenbasis: `docs/studio/retros/2026-10-08-prozess-rel07.md`
- Ruling: R330
- Änderungen: Release-Läufe mit Wanduhr-Limit und `stand.md` alle 30 min (2); Fix-Runde nach ZURÜCK in derselben Session (4); Konflikt-Probe mit `git merge-tree` vor dem Integrator-Start (5); E-039 und E-041 waren bereits im Handbuch (nur bestätigt)

## 2026-10-08 · Handbuch 1.29

- Anlass: Retro Session 191cc1e4 (Vorschläge angenommen)
- Datenbasis: `docs/studio/retros/2026-10-08-session-191cc1e4-ende.md` (B1, B2, B4)
- Ruling: R329
- Änderungen: Lastgrenze Load ≤ 4 mit `uptime` im Beleg (E-045 übernommen); Worktree-Prüfung vor jedem Paketstart (Erweiterung Ende 0a); Worktrees nach dem Release ohne `--force` aufräumen; E-043 als Paket TOOL-ZEITRESERVE-RUNNER vermerkt

## 2026-10-08 · Handbuch 1.28

- Anlass: Kurz-Retro 8ef9d27f (Umsetzung nachgeholt)
- Datenbasis: `docs/studio/retros/2026-10-08-session-8ef9d27f-ende.md` (B1, B3)
- Ruling: R315
- Änderungen: Release-Lauf um Perf-Ablage mit Vergleichsart (E-039) und `stand.md` mit Fortsetzungspunkt, Messskripte unter `tools/render-qa/` (E-041) ergänzt

## 2026-10-08 · Handbuch 1.27

- Anlass: Retro Ampel Steuerung (Vorfälle `ampel:steuerung`, `ampel:cache_write_5m`)
- Datenbasis: `docs/studio/retros/2026-10-08-ampel-steuerung.md` (B2, B3: 65 % der Lead-Neuschreibungen nach Turn-Ende; 120 alleinstehende Statusturns); V2-Prüfung `tools/studio/model.py` Zeile 627, 647, 719–730, `hook.py` Zeile 153–164
- Ruling: R319
- Änderungen: Regel „Fortsetzen statt neu starten“ für Leads ersetzt durch Ablösung per Handoff nach dem Abschlussbericht (Ausnahme Kontext < 60k oder Cache warm); Lead-Status `active`/`done` entfallen (Hook-Events); Verbesserungsschleife um Schritt 6 „Rotation“ ergänzt (Wartezeit > 2 Sessions → Bewertung der laufenden Experimente); E-042 gestartet, E-037 gestartet, E-022 und E-030 abgeschlossen (E-030 angepasst), E-029 ersetzt, E-036 abgeschlossen, E-027 verlängert

## 2026-10-08 · Persona lead-tech 1.10

- Anlass: Retro Ampel Steuerung (Vorfälle `ampel:steuerung`, `ampel:cache_write_5m`)
- Datenbasis: `docs/studio/retros/2026-10-08-ampel-steuerung.md` (B2, B3: 65 % der Lead-Neuschreibungen nach Turn-Ende; 120 alleinstehende Statusturns); V2-Prüfung `tools/studio/model.py` Zeile 627, 647, 719–730, `hook.py` Zeile 153–164
- Ruling: R319
- Änderungen: Abschnitt „Abschluss und Ablösung“ (Handoff, E-042); Statuszeilen `active`/`done` gestrichen, `delegated` mit `--task`

## 2026-10-08 · Persona lead-art 1.6

- Anlass: Retro Ampel Steuerung (Vorfälle `ampel:steuerung`, `ampel:cache_write_5m`)
- Datenbasis: `docs/studio/retros/2026-10-08-ampel-steuerung.md` (B2, B3: 65 % der Lead-Neuschreibungen nach Turn-Ende; 120 alleinstehende Statusturns); V2-Prüfung `tools/studio/model.py` Zeile 627, 647, 719–730, `hook.py` Zeile 153–164
- Ruling: R319
- Änderungen: Abschnitt „Abschluss und Ablösung“ (Handoff, E-042); Statuszeilen `active`/`done` gestrichen, `delegated` mit `--task`

## 2026-10-08 · Persona lead-design 1.8

- Anlass: Retro Ampel Steuerung (Vorfälle `ampel:steuerung`, `ampel:cache_write_5m`)
- Datenbasis: `docs/studio/retros/2026-10-08-ampel-steuerung.md` (B2, B3: 65 % der Lead-Neuschreibungen nach Turn-Ende; 120 alleinstehende Statusturns); V2-Prüfung `tools/studio/model.py` Zeile 627, 647, 719–730, `hook.py` Zeile 153–164
- Ruling: R319
- Änderungen: Abschnitt „Abschluss und Ablösung“ (Handoff, E-042); Statuszeilen `active`/`done` gestrichen, `delegated` mit `--task`

## 2026-10-08 · Persona lead-production 1.8

- Anlass: Retro Ampel Steuerung (Vorfälle `ampel:steuerung`, `ampel:cache_write_5m`)
- Datenbasis: `docs/studio/retros/2026-10-08-ampel-steuerung.md` (B2, B3: 65 % der Lead-Neuschreibungen nach Turn-Ende; 120 alleinstehende Statusturns); V2-Prüfung `tools/studio/model.py` Zeile 627, 647, 719–730, `hook.py` Zeile 153–164
- Ruling: R319
- Änderungen: Abschnitt „Abschluss und Ablösung“ (Handoff, E-042); Statuszeilen `active`/`done` gestrichen, `delegated` mit `--task`

## 2026-10-08 · Persona lead-qa 1.8

- Anlass: Retro Ampel Steuerung (Vorfälle `ampel:steuerung`, `ampel:cache_write_5m`)
- Datenbasis: `docs/studio/retros/2026-10-08-ampel-steuerung.md` (B2, B3: 65 % der Lead-Neuschreibungen nach Turn-Ende; 120 alleinstehende Statusturns); V2-Prüfung `tools/studio/model.py` Zeile 627, 647, 719–730, `hook.py` Zeile 153–164
- Ruling: R319
- Änderungen: Abschnitt „Abschluss und Ablösung“ (Handoff, E-042); Statuszeilen `active`/`done` gestrichen, `delegated` mit `--task`

## 2026-10-08 · Handbuch 1.26

- Anlass: Vorfall-Retro „Effizienz-Muster blieb unentdeckt“ (R315), Paket TOOL-RETRO-V2
- Datenbasis: `docs/studio/retros/2026-10-08-vorfall-effizienz-unentdeckt.md` (B1: Cache-Write in 11 Retros rot ohne Hebel; B3: Prozess-Retro nach REL-06 fehlte)
- Ruling: R316
- Änderungen: Retro-Vorlage um Pflichtspalte „Hebel oder Messauftrag mit Frist“ je gelber oder roter Ampelzeile ergänzt (dritte Retro in Folge: Hebel-Vorschlag Pflicht); Release-Checkliste: nach Merge auf main startet L0 den `studio-process-coach`; Satz in `lernen.md` gekürzt

## 2026-10-08 · Handbuch 1.25

- Anlass: Nutzerfrage Aufwandsverteilung (PROC-AUFWAND), Paket TOOL-E-AUFWAND
- Datenbasis: `docs/studio/retros/2026-10-08-proc-aufwandsverteilung.md` (B4: Cache-Write 5 min 33,7 %)
- Ruling: R314
- Änderungen: Abschnitt Kommunikation um zwei Regeln ergänzt (lange Bash-Läufe im Hintergrund, nur Bash, Agent-Starts bleiben Vordergrund; Ein-Umsetzer-Pakete: Lead auf sonnet oder direkt durch L0); E-037 angenommen, wartet auf freien Platz

## 2026-10-08 · Persona lead-art 1.5

- Anlass: Nutzerfrage Aufwandsverteilung (PROC-AUFWAND), Paket TOOL-E-AUFWAND
- Datenbasis: `docs/studio/retros/2026-10-08-proc-aufwandsverteilung.md` (B4: Cache-Write 5 min 33,7 %)
- Ruling: R314
- Änderungen: Regel „Lange Bash-Läufe“ (E-037) und „Ein Umsetzer“ ergänzt

## 2026-10-08 · Persona lead-design 1.7

- Anlass: Nutzerfrage Aufwandsverteilung (PROC-AUFWAND), Paket TOOL-E-AUFWAND
- Datenbasis: `docs/studio/retros/2026-10-08-proc-aufwandsverteilung.md` (B4: Cache-Write 5 min 33,7 %)
- Ruling: R314
- Änderungen: Regel „Lange Bash-Läufe“ (E-037) und „Ein Umsetzer“ ergänzt

## 2026-10-08 · Persona lead-production 1.7

- Anlass: Nutzerfrage Aufwandsverteilung (PROC-AUFWAND), Paket TOOL-E-AUFWAND
- Datenbasis: `docs/studio/retros/2026-10-08-proc-aufwandsverteilung.md` (B4: Cache-Write 5 min 33,7 %)
- Ruling: R314
- Änderungen: Regel „Lange Bash-Läufe“ (E-037) ergänzt

## 2026-10-08 · Persona lead-qa 1.7

- Anlass: Nutzerfrage Aufwandsverteilung (PROC-AUFWAND), Paket TOOL-E-AUFWAND
- Datenbasis: `docs/studio/retros/2026-10-08-proc-aufwandsverteilung.md` (B4: Cache-Write 5 min 33,7 %)
- Ruling: R314
- Änderungen: Regel „Lange Bash-Läufe“ (E-037) ergänzt

## 2026-10-08 · Persona lead-tech 1.9

- Anlass: Nutzerfrage Aufwandsverteilung (PROC-AUFWAND), Paket TOOL-E-AUFWAND
- Datenbasis: `docs/studio/retros/2026-10-08-proc-aufwandsverteilung.md` (B4: Cache-Write 5 min 33,7 %)
- Ruling: R314
- Änderungen: Regel „Lange Bash-Läufe“ (E-037) und „Ein Umsetzer“ ergänzt

## 2026-10-08 · Persona art-rendering-engineer 1.1

- Anlass: Nutzerfrage Aufwandsverteilung (PROC-AUFWAND), Paket TOOL-E-AUFWAND
- Datenbasis: `docs/studio/retros/2026-10-08-proc-aufwandsverteilung.md` (B4: Cache-Write 5 min 33,7 %)
- Ruling: R314
- Änderungen: Regel „Lange Bash-Läufe“ (E-037) ergänzt

## 2026-10-08 · Persona tech-sim-engineer 1.4

- Anlass: Nutzerfrage Aufwandsverteilung (PROC-AUFWAND), Paket TOOL-E-AUFWAND
- Datenbasis: `docs/studio/retros/2026-10-08-proc-aufwandsverteilung.md` (B4: Cache-Write 5 min 33,7 %)
- Ruling: R314
- Änderungen: Regel „Lange Bash-Läufe“ (E-037) ergänzt

## 2026-10-08 · Persona tech-ui-engineer 1.6

- Anlass: Nutzerfrage Aufwandsverteilung (PROC-AUFWAND), Paket TOOL-E-AUFWAND
- Datenbasis: `docs/studio/retros/2026-10-08-proc-aufwandsverteilung.md` (B4: Cache-Write 5 min 33,7 %)
- Ruling: R314
- Änderungen: Regel „Lange Bash-Läufe“ (E-037) ergänzt

## 2026-10-07 · Handbuch 1.24

- Anlass: Kurz-Retro Session 7db07561 B1 (Agenten liefen nach dem Abbruch weiter)
- Datenbasis: `docs/studio/retros/2026-10-07-session-7db07561-ende.md`; `.studio/events.jsonl`
- Ruling: R308
- Änderungen: Session-Ende um Punkt 0a ergänzt (Agenten mit frischem Heartbeat in `state.md`; vor Paket-Neustart Worktree-HEAD und Dashboard prüfen); E-034 angenommen, wartet auf freien Platz

## 2026-10-07 · Handbuch 1.23

- Anlass: Ad-hoc-Retro Session 7db07561 B3 (hängende Messung im Ruhezustand, `pkill -f`)
- Datenbasis: `docs/studio/retros/2026-10-07-adhoc-session-7db07561.md`; R299
- Ruling: R303
- Änderungen: Lastregel um „Messläufe mit Wanduhr-Limit je Lauf und `caffeinate`“ ergänzt; `.gitattributes` ohne `merge=union` (E-022 angepasst)

## 2026-10-06 · Handbuch 1.22

- Anlass: Nutzerfrage zu ungesichteten Beobachtungen (rund 175 Einträge seit 2026-09-30)
- Datenbasis: Auftrag R288-UMSETZUNG; `docs/beobachtungen.md` (95 Einträge unter der Marke vom 2026-09-30)
- Ruling: R287 (b), (c); R288
- Änderungen: Session-Start Punkt 6: Hook zählt Einträge unter „Letzte Auswertung“, bei > 30 Pflichthinweis und Auswertung als erstes Paket; Zähler in `tools/studio/context.py` mit Tests

## 2026-10-06 · Persona production-integrator 1.8

- Anlass: Ad-hoc-Retro CI H-T4, B1/B2/B4
- Datenbasis: [Retro adhoc-ci-ht4](retros/2026-10-06-adhoc-ci-ht4.md)
- Ruling: R270 (V1–V3)
- Änderungen: vor jedem Push `make check` und `CI=true make check` mit Exit-Code; Pages-`deploy` > 10 min `queued` melden, nicht abbrechen; `failed` nur bei gescheitertem Merge, sonst `done` mit Vermerk

## 2026-10-06 · Persona lead-tech 1.8

- Anlass: Ad-hoc-Retro CI H-T4, B3/B4
- Datenbasis: [Retro adhoc-ci-ht4](retros/2026-10-06-adhoc-ci-ht4.md)
- Ruling: R270 (V3)
- Änderungen: Exit-Codes im Bericht; eingesparte Arbeiter-Starts begründen; Status-Semantik `failed`/`done`

## 2026-10-06 · Handbuch 1.21

- Anlass: Ad-hoc-Retro CI H-T4, B1 (Zeittest nach Final-Review rot)
- Datenbasis: [Retro adhoc-ci-ht4](retros/2026-10-06-adhoc-ci-ht4.md)
- Ruling: R270 (V1)
- Änderungen: `gates.md` Gate Merge (Prüffrage 5) und Gate Merge Release (Prüfliste): CI-Reserve aller Zeittests im Diff, auch Fix-Runden nach dem Final-Review

## 2026-10-06 · Persona production-integrator 1.7

- Anlass: Ad-hoc-Retro E1 C3, B5: Merge TOOL-E030 im Hauptcheckout statt `.worktrees/integrate`
- Datenbasis: [Retro adhoc-e1-c3](retros/2026-10-06-adhoc-e1-c3.md) B5, Retro 9b13950a B4
- Ruling: R264 (V3, E-026 ohne Experiment übernommen)
- Änderungen: Merge immer in `.worktrees/integrate` (detached auf origin/main, `git worktree add --detach`
  falls fehlend), Pflichtprüfung `git rev-parse --show-toplevel`, Push `git push origin HEAD:main`

## 2026-10-06 · Persona lead-tech 1.7

- Anlass: Ad-hoc-Retro E1 C3, B4: fünf Controller-Starts auf opus statt sonnet
- Datenbasis: [Retro adhoc-e1-c3](retros/2026-10-06-adhoc-e1-c3.md) B4, Handbuch Modellwahl
- Ruling: R264 (V2)
- Änderungen: Frontmatter `model: sonnet`; Satz: Plan, Plan-Überarbeitung und Meilenstein-Retro startet L0
  ausdrücklich mit `opus`. Roster-Zeilen lead-tech und production-integrator nachgezogen

## 2026-10-05 · Handbuch 1.20

- Anlass: Abnahme Handbuch 1.19, Zeitraum E-028 erreicht
- Datenbasis: E-028-Datenpunkte REL-01…REL-04 ([experimente.md](experimente.md)), Rulings R232, R244
- Ruling: R251
- Änderungen: E-028 „Release-Bündel“ abgeschlossen (`behalten`, Arbeitsweise bleibt Regel);
  E-030 „Zeittests lokal seriell“ auf `laufend` (Paket TOOL-E030); `gates.md` „Gate Plan“: Satz
  zum Folgeplan-Gate (R233 V2)

## 2026-10-05 · Handbuch 1.19

- Anlass: Kurz-Retro session-ad51d3c5 mit Ad-hoc-Retro CI rot, Prozess-Retro REL-03, Kurz-Retro
  session-6a98e530, Prozess-Retro REL-04/E0
- Datenbasis: [session-ad51d3c5](retros/2026-10-05-session-ad51d3c5.md) (B1, B3, B4, B6, a–c),
  [prozess-retro-rel-03](retros/2026-10-05-prozess-retro-rel-03.md) (V1–V3),
  [session-6a98e530](retros/2026-10-05-session-6a98e530.md) (B1, B4),
  [prozess-rel04-e0](retros/2026-10-05-prozess-rel04-e0.md) (V1–V3)
- Ruling: R233, R236, R249, R250
- Änderungen: Briefing-Standard um Pflichtzeilen je Auftragsart (Persona-Änderung, Messauftrag,
  Hotfix, CI-Prüfung, Integrator-Trailer); Budget: Phasenlabels je Session eindeutig; Gate Plan:
  Folgeplan mit einem Prüfer; Gate Spec: Selbstcheck in drei Zeilen; Schlanke Steuerung: Tasks
  bündeln, Warten als `waiting` loggen; Release mit einem Häppchen nur auf das Delta; Häppchen auf
  Etappen-Dateien mit Merge-Prognose; Tempo: Lastregel für Zeittests und Messungen, höchstens 2
  Bildrunden; Vorlage Bericht „Einschätzung“ statt „Ruling“, Vorlage Briefing verweist auf die
  Pflichtzeilen; E-030 angenommen, wartet auf Platz; `lernen.md` um 2 nun im Handbuch geregelte
  Zeilen gekürzt

## 2026-10-05 · Persona production-integrator 1.6

- Anlass: Retro-Nachtrag session-e13c3631, Vorschlag (2); Eintrag vom studio-coach nachgetragen,
  weil Commit 15a99d8 die Version ohne Eintrag hob
- Datenbasis: [Retro session-e13c3631](retros/2026-10-04-session-e13c3631.md) (Nachtrag)
- Ruling: R224
- Änderungen: Korrekturen nach dem Merge-Commit oder auf dem Kandidaten als eigener Fix-Commit,
  nie `git commit --amend`

## 2026-10-05 · Handbuch 1.18

- Anlass: Retro-Nachtrag session-e13c3631, Vorschläge (1), (3), (4), (5)
- Datenbasis: [Retro session-e13c3631](retros/2026-10-04-session-e13c3631.md) (Nachtrag N4, N5)
- Ruling: R224
- Änderungen: Budget „Zwischenstand bei halbem Deckel“ (Log als `status waiting`, Retro zählt);
  Rulings „Kandidaten desselben Fehlermechanismus“ in einem Ruling; E-028 Messgrösse 1 bei 2
  Häppchen ≤ 0,5, Leerlauf nach Ursache getrennt; E-027 Zählregel „eingeplant“; `lernen.md` um 7
  im Handbuch abgedeckte oder doppelte Einträge gekürzt (37 → 30 Inhaltszeilen)

## 2026-10-04 · Handbuch 1.17

- Anlass: Nutzerfreigabe „VERFASSUNG ÄNDERN" für N-92 und N-93
- Datenbasis: Warteschlange N-92 (zwei Rebase-Vorfälle), N-93 (41 ungewollte opus-Starts, Effizienz-Ampel rot)
- Ruling: R212
- Änderungen: Abschnitt Autonomie/Guard nennt die neuen Sperren `git pull --rebase`/`-r`, Rebase-Konfiguration
  (`pull.rebase`, `branch.*.rebase`, auch per `git -c`) und Persona-Start als `general-purpose` ohne `model`;
  Handbuch und lernen.md behaupteten die Modell-Sperre schon vorher, jetzt stimmt es

## 2026-10-04 · Handbuch 1.16

- Anlass: Prozess-Retro Kreativität und Tempo (R207)
- Datenbasis: `docs/studio/retros/2026-10-04-prozess-kreativitaet-tempo.md` (B1, B2, V1–V4)
- Ruling: R208
- Änderungen: E-028 „Release-Bündel“ gestartet (Umsetzungszyklus Stufe leicht Schritt 6/7 und Absatz „Merge“ ersetzt: release-reif, Auslöser, Grösse, Hotfix, Pipelining, Konfliktregeln, Paket-ID `REL-nn`, Release-Notiz); E-027 „Discovery-Strang“ gestartet (Absatz, Ideen-Runden `IDEEN-nn`); `gates.md`: Gate Merge Release, Gate Ideen-Runde, Plan-/Spec-Format dorthin ausgelagert (STUDIO.md 401 → 400 Zeilen); E-015 und E-017 behalten (abgeschlossen); `lernen.md` Bildziel-Zeile; lead-design 1.6 (Discovery-Strang, Ideen-Runden) und design-idea-scout 1.0 (neu, ersetzt Abruf-Rolle design-genre-researcher); Verfassung §9 unverändert

## 2026-10-04 · Persona production-integrator 1.5

- Anlass: E-028 (R208)
- Datenbasis: `docs/studio/retros/2026-10-04-prozess-kreativitaet-tempo.md` V1
- Ruling: R208
- Änderungen: Release-Lauf (Kandidat aus 2–4 Branches, Paket `REL-nn`, Push erst nach Gate Merge Release, frischer Aufbau statt Reset)

## 2026-10-04 · Persona qa-playtester 1.6

- Anlass: E-028 (R208)
- Datenbasis: `docs/studio/retros/2026-10-04-prozess-kreativitaet-tempo.md` V1
- Ruling: R208
- Änderungen: Release-Lauf (ein Lauf am Kandidaten, je UI-Task eigener Abschnitt mit Screenshots; Vorlage `playtest-report.md` ergänzt)

## 2026-10-04 · Persona lead-design 1.6

- Anlass: E-027 (R208)
- Datenbasis: `docs/studio/retros/2026-10-04-prozess-kreativitaet-tempo.md` V2
- Ruling: R208
- Änderungen: Discovery-Strang, Ideen-Runden `IDEEN-nn` (angelegt von lead-production)

## 2026-10-04 · Persona design-idea-scout 1.0

- Anlass: E-027 (R208)
- Datenbasis: `docs/studio/retros/2026-10-04-prozess-kreativitaet-tempo.md` V2
- Ruling: R208
- Änderungen: neu, ersetzt die Abruf-Rolle `design-genre-researcher` (angelegt von lead-production)

## 2026-10-03 · Handbuch 1.15

- Anlass: Meilenstein-Retro M11 und Prozess-Retro M11
- Datenbasis: `docs/studio/retros/2026-10-03-meilenstein-m11.md`, `docs/studio/retros/2026-10-03-prozess-retro-m11.md`, `docs/studio/metriken/M11.md`
- Ruling: R201
- Änderungen: E-010 behalten (abgeschlossen); E-022 „Merge-Hygiene" gestartet (`.gitattributes` `merge=union` für `docs/beobachtungen.md`, Integrator-Merge im eigenen Worktree, Abschnitt Merge); E-019 erweitert vorgeschlagen; E-023 und E-024 vorgeschlagen; `lernen.md` zwei Zeilen

## 2026-10-03 · Persona production-integrator 1.4

- Anlass: E-022 (Retro M11 B1)
- Datenbasis: `docs/studio/retros/2026-10-03-meilenstein-m11.md`
- Ruling: R201
- Änderungen: Merge im eigenen Worktree `.worktrees/integrate`, Push von dort, Hauptcheckout danach `git pull --ff-only`; Branches nie mit `-d`/`-D` löschen (gilt ab einem späteren Zug)

## 2026-10-03 · Persona lead-production 1.6

- Anlass: E-022 (Retro M11 B1)
- Datenbasis: `docs/studio/retros/2026-10-03-meilenstein-m11.md`
- Ruling: R201
- Änderungen: Briefing des Integrators verlangt den Merge im eigenen Worktree (gilt ab einem späteren Zug)

## 2026-10-03 · Handbuch 1.14

- Anlass: Meilenstein-Retro M10 und Prozess-Retro M10
- Datenbasis: `docs/studio/retros/2026-10-03-meilenstein-m10.md`, `docs/studio/retros/2026-10-03-prozess-retro-m10.md`, `docs/studio/metriken/M10.md`
- Ruling: R190
- Änderungen: E-010 angepasst (Lead-Übergabe bei 200k Kontext oder 6 Arbeiter-Starts, Gate-Kriterium Spec ≤ 40 KB, Zeitraum M11); E-015 gestartet (Nachweiszeilen in `templates/bericht.md`); E-017 gestartet (Doku als eigener Plan-Task, D1-Dateien im Umsetzer-Briefing erlaubt, `templates/briefing.md`); E-011 und E-013 behalten; STUDIO.md auf 400 Zeilen gekürzt (Guard-Tabelle, Plan-Format, Budget-Beispiel, Session-Abschnitte verdichtet, Inhalt unverändert)

## 2026-10-03 · Persona lead-tech 1.6

- Anlass: Meilenstein-Retro M10 (E-010, E-017)
- Datenbasis: `docs/studio/retros/2026-10-03-meilenstein-m10.md`
- Ruling: R190
- Änderungen: Übergabe bei 200k Kontext oder 6 Arbeiter-Starts; Doku als eigener Plan-Task

## 2026-10-03 · Persona lead-qa 1.6

- Anlass: Meilenstein-Retro M10 (E-010)
- Datenbasis: `docs/studio/retros/2026-10-03-meilenstein-m10.md`
- Ruling: R190
- Änderungen: Gate Spec prüft Dateigrössen (Spec ≤ 40 KB, Task-Dateien ≤ 10 KB)

## 2026-10-02 · Handbuch 1.13

- Anlass: Token-Effizienz-Analyse (Nutzerauftrag), Ad-hoc-Retro
- Datenbasis: `.studio/handoffs/EFF-analyse.md`, `docs/studio/retros/2026-10-02-adhoc-token-effizienz.md`
- Ruling: R167
- Änderungen: STUDIO.md Modellwahl: `opus` für Design-Lead, Tech-Lead beim Plan, Spec-Autor,
  Lizenzprüfung, Final-Review, Meilenstein-Retro; `sonnet` für Controller, `lead-qa`-Gate-Urteile,
  `lead-production`, Task-Reviews, Kurz-Retro, Umsetzung; Persona-Start als `general-purpose` immer
  mit `model` (Guard). Umsetzungszyklus Schritt 4: „Schlanke Steuerung“ (E-010 angepasst, Messung
  M10). Limits: L0-Übergabe nach jedem Gate-Block, spätestens bei 25 % Kontext, keine Bilder. Gates
  und Dokumentation: Plan = Index plus Task-Datei je Task (≤ 10 KB), Spec ≤ 40 KB mit Anhängen.
  Briefing-Standard: Kontext nur Task-Datei und AK-IDs, `rulings.md` nur per grep (E-010). `verbesserung.md`: Abschnitt „Effizienz“ der Metriken,
  Ampel-Schwellen, Pflichtpunkt Effizienz-Ampel in jeder Retro; `templates/retro.md`: Abschnitt
  „Effizienz-Ampel“. `experimente.md`: E-010 „Schlanke Steuerung“ (umfasst Task-Dateien und L0-Sessiongrösse, R168). `lernen.md`: Effizienz-Ampel,
  Persona-Starts mit `model`.

## 2026-10-02 · Persona studio-coach 1.2

- Anlass: Token-Effizienz-Analyse (Nutzerauftrag), Ad-hoc-Retro
- Datenbasis: `.studio/handoffs/EFF-analyse.md`, `docs/studio/retros/2026-10-02-adhoc-token-effizienz.md`
- Ruling: R167
- Änderungen: Prüffrage 6 und Verdichten: Effizienz-Ampel lesen (Pflichtpunkt jeder Retro)

## 2026-10-02 · Persona studio-process-coach 1.1

- Anlass: Token-Effizienz-Analyse (Nutzerauftrag), Ad-hoc-Retro
- Datenbasis: `.studio/handoffs/EFF-analyse.md`, `docs/studio/retros/2026-10-02-adhoc-token-effizienz.md`
- Ruling: R167
- Änderungen: Prüffrage 6: Effizienz-Ampel lesen (Pflichtpunkt jeder Retro)

## 2026-10-02 · Persona lead-production 1.5

- Anlass: Token-Effizienz-Analyse (Nutzerauftrag), Ad-hoc-Retro
- Datenbasis: `.studio/handoffs/EFF-analyse.md`, `docs/studio/retros/2026-10-02-adhoc-token-effizienz.md`
- Ruling: R167
- Änderungen: Frontmatter `model: sonnet` (Modellwahl 1.13)

## 2026-10-02 · Persona lead-qa 1.5

- Anlass: Token-Effizienz-Analyse (Nutzerauftrag), Ad-hoc-Retro
- Datenbasis: `.studio/handoffs/EFF-analyse.md`, `docs/studio/retros/2026-10-02-adhoc-token-effizienz.md`
- Ruling: R167
- Änderungen: Frontmatter `model: sonnet`; Final-Review bleibt `qa-code-reviewer` auf `opus`

## 2026-10-02 · Persona lead-tech 1.5

- Anlass: Token-Effizienz-Analyse (Nutzerauftrag), Ad-hoc-Retro
- Datenbasis: `.studio/handoffs/EFF-analyse.md`, `docs/studio/retros/2026-10-02-adhoc-token-effizienz.md`
- Ruling: R167
- Änderungen: Plan im Task-Datei-Format; Controller-Regel E-010 „Schlanke Steuerung“ (sonnet, höchstens 4 Tasks je Instanz)

## 2026-10-02 · Persona lead-design 1.5

- Anlass: Token-Effizienz-Analyse (Nutzerauftrag), Ad-hoc-Retro
- Datenbasis: `.studio/handoffs/EFF-analyse.md`, `docs/studio/retros/2026-10-02-adhoc-token-effizienz.md`
- Ruling: R167
- Änderungen: Spec ≤ 40 KB, Details in Anhängen (E-010)

## 2026-10-02 · Persona design-spec-author 1.3

- Anlass: Token-Effizienz-Analyse (Nutzerauftrag), Ad-hoc-Retro
- Datenbasis: `.studio/handoffs/EFF-analyse.md`, `docs/studio/retros/2026-10-02-adhoc-token-effizienz.md`
- Ruling: R167
- Änderungen: Spec ≤ 40 KB, Details in Anhängen (E-010)

## 2026-10-02 · Handbuch 1.12

- Anlass: Meilenstein-Retro M8, Session-Retro 58d6bc4a, Prozess-Retro M8 (V1, V3, V4)
- Datenbasis: `docs/studio/retros/2026-10-02-meilenstein-m8.md`,
  `docs/studio/retros/2026-10-02-session-58d6bc4a.md`, `docs/studio/retros/2026-10-02-prozess-retro-m8.md`, `docs/studio/metriken/M8.md`,
  `docs/studio/metriken/S-2026-10-02-58d6bc4a.md`
- Ruling: R166
- Änderungen: STUDIO.md Budget: Phase = Paket-ID des Leads, je Integrator-Start eigene Freigabe,
  Beispiel `M5-UMSETZUNG` (E-013 `laufend`). Umsetzungszyklus Schritt 4: Controller-Wechsel auch
  vor einer Wartezeit über einen 5-h-Reset, Doku-Pakete delegieren (E-010 angepasst, Messung M10).
  Nutzernachtrag zu laufendem Meilenstein = ein Delta-Paket (Spec und Plan) mit einem Ruling (V4).
  Limits: im knappen 5-h-Fenster erst Angefangenes abschliessen, dann Neues (V3). Tempo: Hänger-Alarm
  nach 12 min ohne Tool-Ereignis, Anstoss per `SendMessage` und Log (V1). `templates/briefing.md`:
  Git-Zeile nach den festen Regeln (E-011 `laufend`, Guard-Teil Warteschlange N-92).
  `experimente.md`: E-007 und E-008 `behalten` (abgeschlossen), E-012 angenommen, wartet auf Platz.

## 2026-10-02 · Handbuch 1.11

- Anlass: Meilenstein-Retro M7-UX (Bewertung E-009, freier Platz)
- Datenbasis: `docs/studio/retros/2026-10-02-meilenstein-m7ux.md`
- Ruling: R137
- Änderungen: Umsetzungszyklus Schritt 4: Controller-Wechsel nach dem mittleren QA-Block bei mehr
  als 6 Tasks (E-010 `laufend`, Messung im Plan M8). `experimente.md`: E-009 `behalten`
  (abgeschlossen), E-006 bleibt `vorgeschlagen`.

## 2026-10-02 · Handbuch 1.10

- Anlass: Prozess-Retro M7-UX (Aussensicht), Vorschläge V1–V5
- Datenbasis: `docs/studio/retros/2026-10-02-prozess-retro-m7ux.md`, `docs/studio/metriken/M7-UX.md`
- Ruling: R136
- Änderungen: (1) `gates.md`, Gate Spec, `lead-qa` Frage 4: Einzeiler listet AK-Kennungen, die
  auch in anderen Specs vorkommen; Verweise auf alte AK tragen den Meilenstein (`M7:AK-U2-02`);
  Prüffrage AK-Wortlaut gegen Prosa (V1). (2) Umsetzungszyklus: Bei Widerspruch zwischen AK und
  Spec-Text gilt vorläufig die einfachere Variante, der Controller meldet ihn im Schlussbericht, das
  Gate entscheidet (V2, geändert per R136). (3) Tempo-Vorgaben: jede Nachprüfung einer Fix-Runde
  beantwortet „Gegenweg geprüft?“ und „Fundstellen per `grep -rn` nachgeführt?“ (V3). (4) Hook
  archiviert `agent_stop` ohne Rolle nicht mehr, Event mit `internal: true` (`tools/studio/hook.py`
  mit Test, `verbesserung.md` Archiv); `lernen.md` Zeile „inaktiv“ korrigiert (V5). (5) Straffung:
  Absatz Dashboard-Öffnen (steht in ADR-008 und README), Doppel „Fortsetzen statt neue Leads“ und
  „Report bei Final-Review“ gekürzt; `STUDIO.md` 398 Zeilen. (6) `experimente.md`: E-010
  (Controller-Wechsel, V4) `vorgeschlagen`, Start bei freiem Platz; Statustabelle als Satz.
- Messung (Retro M8, Rückfall: Handbuch 1.9, `git show 6e05101:docs/studio/<datei>`): V1
  Widersprüche AK/Spec nach dem Spec-Gate ≤ 1 je Meilenstein über 2 Meilensteine (M7-UX: 2); V2
  zurückgenommene Controller-Rulings 0 (M7-UX: 1); V3 Final-Review-Befunde „hoch“ aus Fix-Runden 0
  und ≤ 2 Merge-Gate-Runden (M7-UX: 1 und 3); V5 Anteil `*-agent-<id>.md` im Archiv je Session < 5 %
  (2026-10-02: 68 %), Agentenzahl der Metrik unverändert.

## 2026-10-01 · Handbuch 1.9

- Anlass: Prozess-Retro 1 (Effizienz), Vorschläge V1–V5
- Datenbasis: `docs/studio/retros/2026-10-01-prozess-retro-1.md`, `docs/studio/metriken/M7.md`
- Ruling: R129
- Änderungen: (1) Session-Start: eine aktive L0-Session je Repo, Parallelität nur per Ruling mit
  Datei-Eigentum; `git fetch`/R-Nummer/Push-Pflicht nur dann (E-007, ersetzt E-005; Start-Hook-Warnung
  folgt als Werkzeug-Paket). (2) Prozessstufen, Gate-Tabelle, `gates.md`: Folgepakete leicht, Spec
  und Plan in einem Dokument, ein Gate `lead-tech` + `lead-qa`, Zweitprüfung nur bei Blocker
  (E-008). (3) Rulings entscheiden und verweisen (≤ 60 Wörter), Abnahmen nur per `log.py result`;
  `templates/ruling.md`, Formatkopf `rulings.md`; R1–R99 wörtlich nach `rulings-archiv.md` (E-009).
  (4) `STUDIO.md` 689 → 399 Zeilen: „Messung und Aufwand“, „Verbesserungsschleife“, Logging-Tabelle,
  Limit-Sensor, Budget-Zählung und Guard-Grenzen wörtlich nach `verbesserung.md` (Teil des
  Handbuchs); Organigramm und Lead-Tabelle wörtlich nach `roster.md`; Befehlsreferenz gestrichen
  (Verweis auf `log.py --help` und Personas); Pflichtpunkte Briefing auf Vorlage verwiesen;
  Wiederholungen der Verfassung (§1, §1.3, §5, §5.8) gekürzt. Verweise in Vorlagen und
  `metriken/README.md` nachgezogen. `experimente.md` gestrafft: E-001, E-003 `behalten`, E-004
  `abgelehnt`, E-005 `angepasst` (ersetzt), neu E-007–E-009 `laufend`. (5) `lernen.md`, `roster.md`:
  neue Persona erst ab einem späteren Zug verfügbar, im selben Zug `general-purpose` mit
  Persona-Datei als Vorgabe (Fehlerkorrektur).

## 2026-09-30 · Handbuch 1.8

- Anlass: Merge STUDIO-LIMIT (Gate R80, Merge 57d1022)
- Datenbasis: `docs/studio/rulings.md` R80, `docs/beobachtungen.md` (Restbefunde Limit-Sensor)
- Ruling: R80
- Änderungen: „Limits und Sessiongrösse“: Sensor von „in Arbeit“ auf „in Betrieb“, Felder `ts` und `session_id` genannt, Hinweis auf noch nicht markierte veraltete Werte; `lernen.md`: einzelnen Sprung im Kontextwert vor einer Übergabe gegenprüfen

## 2026-09-30 · Persona qa-playtester 1.5

- Anlass: Angleichung an Handbuch 1.7 (Folgeposten STUDIO-DESKTOP)
- Datenbasis: `docs/studio/STUDIO.md` Umsetzungszyklus „Report bei Final-Review und Playtests“, Retro M5 B5
- Ruling: R75
- Änderungen: kein verpflichtender Report-Dateipfad mehr; der Schlussbericht ist der Report (Gliederung nach `templates/playtest-report.md`); Screenshots weiter unter `.studio/qa/<paket>/`; Beschreibung, Schritt 4, Qualitätsmassstab und Bericht angepasst; `roster.md` Version

## 2026-09-30 · Persona tech-ui-engineer 1.5

- Anlass: Ruling R78 (Desktop-first, Nutzeranweisung)
- Datenbasis: `docs/studio/rulings.md` R78
- Ruling: R78
- Änderungen: mobile-first → desktop-first ab 1280 px (Beschreibung, Persona, Regeln); Qualitätsmassstab: bedienbar bei 1280 und 1920 px, schmale Fenster nur „stürzt nicht ab, nichts Wesentliches unerreichbar“; `roster.md` Zweck und Version

## 2026-09-30 · Persona qa-playtester 1.4

- Anlass: Ruling R78 (Desktop-first, Nutzeranweisung)
- Datenbasis: `docs/studio/rulings.md` R78
- Ruling: R78
- Änderungen: Standard-Fenstergrössen 1280×800 und 1920×1080, schmales Fenster nur als Absturzprobe; `templates/playtest-report.md` Beispiel auf 1280×800; `roster.md` Version

## 2026-09-30 · Handbuch 1.7

- Anlass: Retro Meilenstein M5 (Vorschläge 1 bis 3)
- Datenbasis: `docs/studio/retros/2026-09-30-meilenstein-m5.md` (B2, B4, B5, B6), `docs/studio/metriken/M5.md`
- Ruling: R75
- Änderungen: Briefing-Standard — Schätzung mit Werkzeugaufrufen als Hauptgrösse, Minuten abgeleitet, Kopfzeile nennt die Tabellenzeile aus `metriken/richtwerte.md` (E-001 angepasst); Autonomie Schritt 2 — Zweck-Gegenprobe im Auslegungs-Ruling (E-003 laufend); Umsetzungszyklus — kein Report-Dateipfad für Final-Review und Playtests, Edit/Write-Regel für Code und Code-nahe Mehrzeiler mit Ausnahme reiner Textgenerierung in Doku per Skript; `templates/briefing.md` (Kopfzeile, Deliverable-Hinweis, Beispiel); `lernen.md` Edit/Write-Zeile ergänzt

## 2026-09-30 · Handbuch 1.6

- Anlass: Ruling R71 (Korrektur von R69): Modellwahl nach Aufgabe, kein Limit-Downgrade
- Datenbasis: `docs/studio/rulings.md` R71
- Ruling: R71
- Änderungen: Modellstufen-Tabelle (opus/sonnet/haiku nach Aufgabe) wiederhergestellt, Satz zum Nutzungslimit ergänzt; Abschnitt „Limits und Sessiongrösse“ bleibt; `roster.md`: Modelle zurück, Versionsspalte auf aktuelle Persona-Versionen

## 2026-09-30 · Persona lead-art 1.4

- Anlass: Ruling R71
- Datenbasis: `docs/studio/rulings.md` R71
- Ruling: R71
- Änderungen: Arbeiter-Tabelle auf den Stand vor 83d3f77 (Modell nach Aufgabe)

## 2026-09-30 · Persona lead-design 1.4

- Anlass: Ruling R71
- Datenbasis: `docs/studio/rulings.md` R71
- Ruling: R71
- Änderungen: Arbeiter-Tabelle auf den Stand vor 83d3f77 (Modell nach Aufgabe)

## 2026-09-30 · Persona lead-production 1.4

- Anlass: Ruling R71
- Datenbasis: `docs/studio/rulings.md` R71
- Ruling: R71
- Änderungen: Arbeiter-Tabelle auf den Stand vor 83d3f77 (Modell nach Aufgabe)

## 2026-09-30 · Persona lead-qa 1.4

- Anlass: Ruling R71
- Datenbasis: `docs/studio/rulings.md` R71
- Ruling: R71
- Änderungen: Arbeiter-Tabelle auf den Stand vor 83d3f77 (Modell nach Aufgabe)

## 2026-09-30 · Persona lead-tech 1.4

- Anlass: Ruling R71
- Datenbasis: `docs/studio/rulings.md` R71
- Ruling: R71
- Änderungen: Arbeiter-Tabelle auf den Stand vor 83d3f77 (Modell nach Aufgabe)

## 2026-09-30 · Persona qa-code-reviewer 1.4

- Anlass: Ruling R71
- Datenbasis: `docs/studio/rulings.md` R71
- Ruling: R71
- Änderungen: `model: opus` → `model: sonnet` (Stand vor 83d3f77)

## 2026-09-30 · Persona tech-ui-engineer 1.4

- Anlass: Ruling R71
- Datenbasis: `docs/studio/rulings.md` R71
- Ruling: R71
- Änderungen: `model: opus` → `model: sonnet` (Stand vor 83d3f77)

## 2026-09-30 · Persona qa-playtester 1.3

- Anlass: Ruling R71
- Datenbasis: `docs/studio/rulings.md` R71
- Ruling: R71
- Änderungen: `model: opus` → `model: sonnet` (Stand vor 83d3f77)

## 2026-09-30 · Persona production-integrator 1.3

- Anlass: Ruling R71
- Datenbasis: `docs/studio/rulings.md` R71
- Ruling: R71
- Änderungen: `model: opus` → `model: sonnet` (Stand vor 83d3f77)

## 2026-09-30 · Persona tech-sim-engineer 1.3

- Anlass: Ruling R71
- Datenbasis: `docs/studio/rulings.md` R71
- Ruling: R71
- Änderungen: `model: opus` → `model: sonnet` (Stand vor 83d3f77)

## 2026-09-30 · Handbuch 1.5

- Anlass: Übertragung der Rulings R68 und R69; lernen.md geprüft, kein Widerspruch
- Datenbasis: `docs/studio/rulings.md` R68–R69
- Ruling: R68, R69
- Änderungen: „Modellwahl“: Standard opus für alle Rollen, kein Downgrade; neuer Abschnitt „Limits und Sessiongrösse“ (Limit-Sensor beschrieben, Paket STUDIO-LIMIT in Arbeit; Herunterfahren in L0-Verantwortung, Richtwerte 60/80 %; Wochenfenster > 80 %: Parallelität reduzieren; Sessiongrösse ≈ ein Abschnitt, Übergabe spätestens bei 50 % Kontext); `roster.md` auf opus

## 2026-09-30 · Persona lead-tech 1.3

- Anlass: Ruling R69 (opus für alle Rollen)
- Datenbasis: `docs/studio/rulings.md` R69
- Ruling: R69
- Änderungen: Arbeiter-Tabelle: Modell opus

## 2026-09-30 · Persona lead-art 1.3

- Anlass: Ruling R69 (opus für alle Rollen)
- Datenbasis: `docs/studio/rulings.md` R69
- Ruling: R69
- Änderungen: Arbeiter-Tabelle: Modell opus

## 2026-09-30 · Persona lead-design 1.3

- Anlass: Ruling R69 (opus für alle Rollen)
- Datenbasis: `docs/studio/rulings.md` R69
- Ruling: R69
- Änderungen: Arbeiter-Tabelle: Modell opus

## 2026-09-30 · Persona lead-production 1.3

- Anlass: Ruling R69 (opus für alle Rollen)
- Datenbasis: `docs/studio/rulings.md` R69
- Ruling: R69
- Änderungen: Arbeiter-Tabelle: Modell opus

## 2026-09-30 · Persona lead-qa 1.3

- Anlass: Ruling R69 (opus für alle Rollen)
- Datenbasis: `docs/studio/rulings.md` R69
- Ruling: R69
- Änderungen: Arbeiter-Tabelle: Modell opus

## 2026-09-30 · Persona qa-code-reviewer 1.3

- Anlass: Ruling R69 (opus für alle Rollen)
- Datenbasis: `docs/studio/rulings.md` R69
- Ruling: R69
- Änderungen: `model: sonnet` → `model: opus`

## 2026-09-30 · Persona tech-ui-engineer 1.3

- Anlass: Ruling R69 (opus für alle Rollen)
- Datenbasis: `docs/studio/rulings.md` R69
- Ruling: R69
- Änderungen: `model: sonnet` → `model: opus`

## 2026-09-30 · Persona qa-playtester 1.2

- Anlass: Ruling R69 (opus für alle Rollen)
- Datenbasis: `docs/studio/rulings.md` R69
- Ruling: R69
- Änderungen: `model: sonnet` → `model: opus`

## 2026-09-30 · Persona production-integrator 1.2

- Anlass: Ruling R69 (opus für alle Rollen)
- Datenbasis: `docs/studio/rulings.md` R69
- Ruling: R69
- Änderungen: `model: sonnet` → `model: opus`

## 2026-09-30 · Persona tech-sim-engineer 1.2

- Anlass: Ruling R69 (opus für alle Rollen)
- Datenbasis: `docs/studio/rulings.md` R69
- Ruling: R69
- Änderungen: `model: sonnet` → `model: opus`

## 2026-09-30 · Persona lead-tech 1.2

- Anlass: Ruling R67 (Abhängigkeiten per L0-Ruling und ADR, Parallelisierung als oberstes Prinzip)
- Datenbasis: Auftrag STUDIO-R67, `docs/studio/rulings.md`
- Ruling: R67
- Änderungen: Laufzeit-Abhängigkeit nur mit ADR und L0-Ruling (Antrag an L0 statt Nutzer-Entscheid); Parallelisierungsprinzip

## 2026-09-30 · Persona lead-art 1.2

- Anlass: Ruling R67
- Datenbasis: Auftrag STUDIO-R67, `docs/studio/rulings.md`
- Ruling: R67
- Änderungen: Parallelisierungsprinzip als oberstes Arbeitsprinzip

## 2026-09-30 · Persona lead-design 1.2

- Anlass: Ruling R67
- Datenbasis: Auftrag STUDIO-R67, `docs/studio/rulings.md`
- Ruling: R67
- Änderungen: Parallelisierungsprinzip als oberstes Arbeitsprinzip

## 2026-09-30 · Persona lead-production 1.2

- Anlass: Ruling R67
- Datenbasis: Auftrag STUDIO-R67, `docs/studio/rulings.md`
- Ruling: R67
- Änderungen: Parallelisierungsprinzip als oberstes Arbeitsprinzip

## 2026-09-30 · Persona lead-qa 1.2

- Anlass: Ruling R67
- Datenbasis: Auftrag STUDIO-R67, `docs/studio/rulings.md`
- Ruling: R67
- Änderungen: Parallelisierungsprinzip als oberstes Arbeitsprinzip

## 2026-09-30 · Persona qa-code-reviewer 1.2

- Anlass: Ruling R67
- Datenbasis: Auftrag STUDIO-R67, `docs/studio/rulings.md`
- Ruling: R67
- Änderungen: Laufzeit-Abhängigkeiten nur mit ADR und L0-Ruling

## 2026-09-30 · Persona tech-ui-engineer 1.2

- Anlass: Ruling R67
- Datenbasis: Auftrag STUDIO-R67, `docs/studio/rulings.md`
- Ruling: R67
- Änderungen: Laufzeit-Abhängigkeiten nur mit ADR und L0-Ruling

## 2026-09-30 · Persona design-spec-author 1.2

- Anlass: Ruling R67
- Datenbasis: Auftrag STUDIO-R67, `docs/studio/rulings.md`
- Ruling: R67
- Änderungen: Laufzeit-Abhängigkeiten nur mit ADR und L0-Ruling

## 2026-09-30 · Handbuch 1.4

- Anlass: Übertragung der Rulings R65 (Tempo), R66 (Übergabe vor Pause) und R67 (Antwort auf N-001); Retro session-25e8352d
- Datenbasis: `docs/studio/rulings.md` R65–R67, `docs/studio/retros/2026-09-30-session-25e8352d.md`
- Ruling: R65, R66, R67
- Änderungen: neuer Abschnitt „Arbeitsprinzipien und Tempo“ (Parallelisieren als oberstes Prinzip, Tempo-Vorgaben); „Autonomie“: Vorbehaltsliste ohne Abhängigkeiten, L0-Ruling plus ADR, `dep-guard` nie umgehen, Beispiele ohne Pfadsuch-Bibliothek, Verweise auf Verfassung 1.1 §5.7/§5.8; Briefing-Vorlage mit neuem §3-Block (Verfassung 1.1); „Session-Start und -Ende“: Schritt 0, `state.md` vor jeder Pause nachführen

## 2026-09-30 · Handbuch 1.3

- Anlass: Merge S17 (Telemetrie je Session, CI-Reruns, keine Phantom-Knoten); Handbuch beschrieb die alte Zählung (offensichtlicher Fehler, kein Experiment)
- Datenbasis: `docs/studio/retros/2026-09-30-adhoc-budget-lead-tech.md`, `docs/studio/retros/2026-09-30-adhoc-ci-pages.md`, `docs/studio/retros/2026-09-30-adhoc-inaktiv-web-fetch.md`, `docs/beobachtungen.md` (Nachträge Final-Review S17), `tools/studio/model.py`
- Ruling: R58
- Änderungen: „Budget“: Freigabe gilt je Session (nach `/clear` neu loggen), Zählung je Lead, Phase und Session, Start vor der ersten Freigabe zählt nicht, „ohne Freigabe“; Vorfall erst bei > 1,5 × Freigabe, Parallel-Überschreitung nur rot; „Messung“: laufender Meilenstein je Session; „Verbesserungsschleife“: grüner Rerun schliesst `ci:<run>`; „Logging-Pflicht“: `bind` ohne bekannten Agenten erzeugt keinen Knoten, Budgetfreigabe je Session; `lernen.md` bereinigt

## 2026-09-30 · Handbuch 1.2

- Anlass: Retro Meilenstein Studio-Graph, Befund B2 (Basis-Drift durch parallele L0-Sessions)
- Datenbasis: `docs/studio/retros/2026-09-30-meilenstein-studio-graph.md`, `docs/studio/rulings.md` R43, R52
- Ruling: R55
- Änderungen: Abschnitt „Session-Start und -Ende“ um „Parallele L0-Sessions“ ergänzt (Datei-Eigentum und Merge-Reihenfolge in `state.md`, Planung gegen fremde Pfade erst nach deren Merge); `state.md` mit Abschnitt „Parallele Sessions“; Experiment E-002

## 2026-09-30 · Handbuch 1.1

- Anlass: Retro Meilenstein Studio-Graph, Befund B1 (Schätzungen 5- bis 20-fach zu hoch)
- Datenbasis: `docs/studio/metriken/Studio-Graph.md`, `docs/studio/retros/2026-09-30-meilenstein-studio-graph.md`
- Ruling: R54
- Änderungen: Briefing-Standard: Schätzung aus Richtwerten statt Menschenzeit; neu `docs/studio/metriken/richtwerte.md`; Hinweis in `templates/briefing.md`; Experiment E-001

## 2026-09-30 · Persona art-license-checker 1.1

- Anlass: Paket G (Prozess-Graph), Anzeige-Namen im Dashboard
- Datenbasis: Auftrag (Spec 2026-09-30-studio-prozessgraph-design.md, Namensliste T3)
- Ruling: R43
- Änderungen: Frontmatter-Felder `studio-name`, `studio-title`, `studio-emoji`; kein Verhalten geändert

## 2026-09-30 · Persona design-economy-designer 1.1

- Anlass: Paket G (Prozess-Graph), Anzeige-Namen im Dashboard
- Datenbasis: Auftrag (Spec 2026-09-30-studio-prozessgraph-design.md, Namensliste T3)
- Ruling: R43
- Änderungen: Frontmatter-Felder `studio-name`, `studio-title`, `studio-emoji`; kein Verhalten geändert

## 2026-09-30 · Persona design-spec-author 1.1

- Anlass: Paket G (Prozess-Graph), Anzeige-Namen im Dashboard
- Datenbasis: Auftrag (Spec 2026-09-30-studio-prozessgraph-design.md, Namensliste T3)
- Ruling: R43
- Änderungen: Frontmatter-Felder `studio-name`, `studio-title`, `studio-emoji`; kein Verhalten geändert

## 2026-09-30 · Persona lead-art 1.1

- Anlass: Paket G (Prozess-Graph), Anzeige-Namen im Dashboard
- Datenbasis: Auftrag (Spec 2026-09-30-studio-prozessgraph-design.md, Namensliste T3)
- Ruling: R43
- Änderungen: Frontmatter-Felder `studio-name`, `studio-title`, `studio-emoji`; kein Verhalten geändert

## 2026-09-30 · Persona lead-design 1.1

- Anlass: Paket G (Prozess-Graph), Anzeige-Namen im Dashboard
- Datenbasis: Auftrag (Spec 2026-09-30-studio-prozessgraph-design.md, Namensliste T3)
- Ruling: R43
- Änderungen: Frontmatter-Felder `studio-name`, `studio-title`, `studio-emoji`; kein Verhalten geändert

## 2026-09-30 · Persona lead-production 1.1

- Anlass: Paket G (Prozess-Graph), Anzeige-Namen im Dashboard
- Datenbasis: Auftrag (Spec 2026-09-30-studio-prozessgraph-design.md, Namensliste T3)
- Ruling: R43
- Änderungen: Frontmatter-Felder `studio-name`, `studio-title`, `studio-emoji`; kein Verhalten geändert

## 2026-09-30 · Persona lead-qa 1.1

- Anlass: Paket G (Prozess-Graph), Anzeige-Namen im Dashboard
- Datenbasis: Auftrag (Spec 2026-09-30-studio-prozessgraph-design.md, Namensliste T3)
- Ruling: R43
- Änderungen: Frontmatter-Felder `studio-name`, `studio-title`, `studio-emoji`; kein Verhalten geändert

## 2026-09-30 · Persona lead-tech 1.1

- Anlass: Paket G (Prozess-Graph), Anzeige-Namen im Dashboard
- Datenbasis: Auftrag (Spec 2026-09-30-studio-prozessgraph-design.md, Namensliste T3)
- Ruling: R43
- Änderungen: Frontmatter-Felder `studio-name`, `studio-title`, `studio-emoji`; kein Verhalten geändert

## 2026-09-30 · Persona production-integrator 1.1

- Anlass: Paket G (Prozess-Graph), Anzeige-Namen im Dashboard
- Datenbasis: Auftrag (Spec 2026-09-30-studio-prozessgraph-design.md, Namensliste T3)
- Ruling: R43
- Änderungen: Frontmatter-Felder `studio-name`, `studio-title`, `studio-emoji`; kein Verhalten geändert

## 2026-09-30 · Persona qa-code-reviewer 1.1

- Anlass: Paket G (Prozess-Graph), Anzeige-Namen im Dashboard
- Datenbasis: Auftrag (Spec 2026-09-30-studio-prozessgraph-design.md, Namensliste T3)
- Ruling: R43
- Änderungen: Frontmatter-Felder `studio-name`, `studio-title`, `studio-emoji`; kein Verhalten geändert

## 2026-09-30 · Persona qa-playtester 1.1

- Anlass: Paket G (Prozess-Graph), Anzeige-Namen im Dashboard
- Datenbasis: Auftrag (Spec 2026-09-30-studio-prozessgraph-design.md, Namensliste T3)
- Ruling: R43
- Änderungen: Frontmatter-Felder `studio-name`, `studio-title`, `studio-emoji`; kein Verhalten geändert

## 2026-09-30 · Persona studio-coach 1.1

- Anlass: Paket G (Prozess-Graph), Anzeige-Namen im Dashboard
- Datenbasis: Auftrag (Spec 2026-09-30-studio-prozessgraph-design.md, Namensliste T3)
- Ruling: R43
- Änderungen: Frontmatter-Felder `studio-name`, `studio-title`, `studio-emoji`; kein Verhalten geändert

## 2026-09-30 · Persona tech-sim-engineer 1.1

- Anlass: Paket G (Prozess-Graph), Anzeige-Namen im Dashboard
- Datenbasis: Auftrag (Spec 2026-09-30-studio-prozessgraph-design.md, Namensliste T3)
- Ruling: R43
- Änderungen: Frontmatter-Felder `studio-name`, `studio-title`, `studio-emoji`; kein Verhalten geändert

## 2026-09-30 · Persona tech-ui-engineer 1.1

- Anlass: Paket G (Prozess-Graph), Anzeige-Namen im Dashboard
- Datenbasis: Auftrag (Spec 2026-09-30-studio-prozessgraph-design.md, Namensliste T3)
- Ruling: R43
- Änderungen: Frontmatter-Felder `studio-name`, `studio-title`, `studio-emoji`; kein Verhalten geändert

## 2026-09-30 · Handbuch 1.0

- Anlass: Session 1.5 — Trennung Verfassung/Handbuch, Autonomie, Messung, Verbesserungsschleife
- Datenbasis: Auftrag des Nutzers
- Ruling: R22–R37
- Änderungen: Nutzerregeln (Feste Regeln, Asset-Regeln, Nutzer-Vorbehalte) in die Verfassung
  verschoben; Abschnitte Autonomie (Auslegung als Ruling, Warteschlange, Guard), Messung und
  Aufwand, Verbesserungsschleife mit Studio-Coach; Briefing-Kopfzeilen `Meilenstein` und
  `Schätzung`; neue Log-Befehle `result`, `milestone`, `retro`, `queue`, `decision` nur noch an
  L0; erweiterte Session-Start- und Session-Ende-Routine; alle Personas auf Version 1.0.
