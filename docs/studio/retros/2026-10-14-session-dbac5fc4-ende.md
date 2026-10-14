# Retro session dbac5fc4-ende — 2026-10-14

- Datum: 2026-10-14
- Art: session
- Auslöser: Session-Ende dbac5fc4 (R648–R658); zugleich die in R646 (5) für den Wiederholungsfall vorgesehene Ad-hoc-Prüfung (Cache-Write und Flake wieder rot)
- Datenbasis: `docs/studio/metriken/S-2026-10-14-dbac5fc4.md`, `python3 tools/studio/metrics.py --efficiency` (Historie, 56 Sessions) und `--since 2026-10-14T13:00:00`, `docs/studio/rulings.md` R646–R658, `docs/studio/experimente.md`, `.studio/archiv/briefings/` (Integrator-Briefings 2026-10-14), `docs/beobachtungen.md` (Eintrag 2026-10-14 Flake-Zeile)

## Befunde

### B1 · Cache-Write: das Wachstum dominiert, nicht die Pause (Messauftrag R646 V3 eingelöst)

- Beobachtung: Session 31,7 % (rot), davon Neuschreibung nach Pause 3,9 Punkte (12,2 % der Menge), übriges Wachstum 27,8 Punkte. Rollen im Wachstum: `qa-code-reviewer` 6,4, `lead-tech` 5,7, `tech-sim-engineer` 3,9, `lead-production` 2,7, `tech-ui-engineer` 2,1 (zusammen 20,8 von 27,8). Historie: Pause 13,1 + Wachstum 15,1 Punkte, Pausenanteil 46,4 %. Mit `--since 13:00`: Pause 6,3 / Wachstum 21,3.
- Beleg: `docs/studio/metriken/S-2026-10-14-dbac5fc4.md` (Abschnitt Effizienz, Aufteilung), `metrics.py --efficiency`. Start-Kontexte der Tabelle mal Instanzen: 9 × 31k + 13 × 13k + 8 × 14k + 5 × 14k + 8 × 28k + 3 × 13k + 3 × 29k + 2 × 30k + 39k + 2 × 13k + 62k ≈ 1,17 M, die Session-Cache-Write-Summe ist 2,80 M (Metrik-Datei, Aufwand).
- Deutung (nicht belegt): Die Kategorie «übriges Wachstum» enthält vermutlich die Erstladung jeder neuen Instanz (≈ 40 % der Schreibmenge, falls kein Präfix geteilt wird). Dann sind Zahl und Start-Kontext der Instanzen der Hebel, nicht die Pausen. Die Aufteilung unterscheidet Erstladung und Wachstum nicht; deshalb ist der Hebel (V1) nur über die Instanzzahl messbar, die Trennung selbst über V2.
- Wirkung: E-066 (Pausen-Neuschreibung `lead-tech`) adressiert in dieser Session nur 1,4 Punkte (`lead-tech` nach Pause), nicht mehr als die 2,6 Punkte der Vorsession.

### B2 · Flake rot und Steuerung rot sind in der Session-Datei Messartefakte

- Beobachtung: Die Session-Datei zeigt Flake-Verdacht 8 (rot); `--since 2026-10-14T13:00:00` zeigt 0 (grün). Ebenso Steuerungsanteil: Session-Datei 51,8 % bereinigt (rot, «0 Lead-Instanzen herausgerechnet»), `--since` 46,4 % (gelb, 8 Lead-Instanzen herausgerechnet: Plan 7,5, Design 7,2, Gate 1,8 Punkte).
- Beleg: Metrik-Datei dbac5fc4 (Ampel), Lauf `--since`; `docs/beobachtungen.md` 2026-10-14 «Session-Metrikdatei: Flake-Zeile ignoriert den Session-Zeitraum» (bereits eingetragen, hier um die zweite Zeile erweitert zu lesen).
- Deutung: Dieselbe Ursache (der Session-Zeitraum erreicht die Zeilen nicht) erzeugt zwei Fehlalarme; die dritte Session in Folge mit roter Flake-Zeile ist damit kein Testproblem. Offen ist, ob der Fehler auch den Steuerungsanteil verfälscht (Vermutung, ein Lauf, zu prüfen im Werkzeug-Paket V2).

### B3 · Gate prüfte das falsche Lint (zweiter Fall dieser Klasse)

- Beobachtung: Das Gate Merge TOOL-DASH-VERSIONEN (R647) prüfte `studio-lint`, nicht `make lint`; der Delta-Check REL-22 fand ESLint `no-undef` im Dashboard-JS (R650, REL22 ZURÜCK, Paket TOOL-LINT-DASH). Die Regel steht in `lernen.md` («Prüfungen, die Sekunden kosten … laufen im Lead-Paket vor ‹bereit›») und deckt den Integrator, nicht das Gate.
- Beleg: `docs/studio/rulings.md` R647, R650; Delta-Check kostete einen Lauf (≈ 10 min, Ruling R650 «Kosten bei Irrtum»).
- Deutung: Zweiter Fall nach TOOL-GATES-2 (R397, R409); Muster «Gate prüft einen Teilbefehl statt des Pushbefehls» bei Werkzeug-Paketen, die Dateitypen berühren (Dashboard-JS), die `make lint` einschliesst und der Teilbefehl nicht.

### B4 · Semantik eines neuen Statusbegriffs erst in der L0-Sichtprüfung geprüft

- Beobachtung: TOOL-DASH-SESSIONZIEL zeigte «✓ Ziel erreicht» bei stage 4 = goalStage 4 und `state active`. Die Review-Runde fand es nicht, die L0-Sichtprüfung nach R655 schon; Fix TOOL-DASH-ZIEL-FIX (R656/R657).
- Beleg: `docs/studio/rulings.md` R655, R656, R657.
- Deutung: Ein Fall. Die Auslegung «erreicht heisst abgeschlossen» stand weder im Kurzdesign noch im Plan. Kein Vorschlag; wiederholt es sich bei einem zweiten neuen Statusbegriff, folgt eine Vorlagenzeile «Randfall-Tabelle» im Kurzdesign.

### B5 · Briefing-Verbote (R646 (6)): Schwelle «dreifach in einer Session» nicht erreicht

- Beobachtung: (a) Warte-Agenten/`sleep`: der Guard TOOL-GUARD-WARTEAGENT ist seit R652 im Modus `deny`; in dieser Session ist kein Block im Bericht eines Gates genannt (Ereignisse nicht ausgewertet, `guard_block` mit Warte-Muster nicht gezählt). (b) Hintergrund-Arbeiter: ein Arbeiter-Bericht (Review Zielmarke-Fix, Nachtrag `make check`) ging direkt an L0 statt an den Lead: 1 Fall. (c) Lastgrenze: kein neuer Fall in den Rulings R648–R658.
- Beleg: `docs/studio/rulings.md` R646 (6), R652; Auftrag L0 zu dieser Retro.
- Deutung: Je Klasse ≤ 1 Fall, Guard-Schwelle nicht erreicht. Der Fall (b) ist die erste Wiederholung seit R635 und liegt auf einer anderen Rolle (Review-Arbeiter, nicht `lead-design`); die Ursache (Start im Hintergrund durch den Lead oder Folgebericht nach Fortsetzung) ist ohne Archiv-Bericht nicht entscheidbar. Messauftrag unten.

### B6 · Browser-Cache verbarg die neue Dashboard-Karte

- Beobachtung: Der Nutzer sah die Karte nicht; der Server lieferte kein `Cache-Control`; behoben im Server (Ruling-Text der Session).
- Beleg: Auftrag L0; Fix im Dashboard-Server (`tools/studio/`). Kein Ruling-Beleg gelesen.
- Deutung: Einzelfall, behoben, keine Wirkung auf Prozess; hier nur festgehalten.

## Effizienz-Ampel

Quelle: `docs/studio/metriken/S-2026-10-14-dbac5fc4.md` (Session) und `metrics.py --efficiency` (Historie).

| Kennzahl                     | Wert                                              | Ampel             | Befund / Ursache                                                                      | Hebel oder Messauftrag mit Frist                                                                                                                                        |
| ---------------------------- | ------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cache-Write 5 min            | 31,7 % (Historie 28,2 %)                          | rot               | B1: Wachstum 27,8 Punkte, Pause 3,9; vermutlich Erstladung vieler kurzer Instanzen    | **V1** (E-068), **V2** (Aufteilung Erstladung/Wachstum); E-066 läuft (deckt höchstens 1,4 Punkte)                                                                       |
| Flake-Verdacht               | 8 (Datei) / 0 (`--since`); Historie 8             | rot (Artefakt)    | B2: Zählartefakt, dritte Session in Folge in der Datei rot                            | **V2** (Werkzeug-Fix, Pflicht-Hebel); Messauftrag erfüllt, 0 echte Fälle seit 2026-10-14                                                                                |
| Steuerungsanteil (bereinigt) | 51,8 % Datei / 46,4 % `--since` / Historie 44,1 % | rot / gelb / gelb | B2: Datei ohne Bereinigung; L0 21,4 %, Leads 30,5 % (Datei)                           | E-066 läuft; **V2** prüft die Bereinigung; vierte Retro in Folge gelb: kein neuer Hebel über V1 hinaus, Begründung: V1 senkt Instanzzahl, damit Lead- und Review-Anteil |
| L0-Kontext Max (Historie)    | 774k (Datei: 185k)                                | rot (Historie)    | Historienwert aus früheren Sessions; Session grün                                     | Messauftrag aus b54ed3bd (Kontext-Max je 100 Delegationen): Session 185k bei 57 Delegationen; bis nächste Session-Retro                                                 |
| opus-Anteil                  | 69,0 % Historie / 34,0 % Session                  | gelb / grün       | Historie; Session grün                                                                | –                                                                                                                                                                       |
| Produktivanteil (Session)    | 23,4 %                                            | gelb              | Session mit Werkzeug-Paketen und Handel-2-Controllern; Historie 31,9 % grün (R488 V4) | kein Befund: Historie grün                                                                                                                                              |
| Grösste Datei                | 66,7 KB Historie / 50,4 KB Session                | gelb              | Session: `docs/beobachtungen.md` (294 Zeilen) im Worktree `ideen-10` gelesen          | E-057 (abgeschlossen): gezielt lesen; kein neuer Hebel, ein Fall                                                                                                        |
| Konto-Minuten                | 1399 von 2000, Prognose 1645                      | gelb              | Ein Push je Session (REL-22), Session-Minuten 12 (gelb)                               | E-046 (behalten): Push REL-23 erst in der Folgesession, wie in R658; bei > 1600 höchstens ein Push je Tag                                                               |
| Lead-Kontext Median          | 65k (Session 42k)                                 | grün              | –                                                                                     | –                                                                                                                                                                       |

## Befragung der Leads

Keine Befragung: Kurz-Retro ohne Agentenstart; Grundlage Metriken, Rulings, Briefing-Archiv.

## Vorschläge

Beide Entwürfe stehen in `docs/studio/experimente.md`; die Rulings schreibt L0. Die Plätze (E-063, E-064, E-066) sind belegt, E-068 wartet auf Platz; V2 ist ein Werkzeug-Paket ohne Experiment-Platz (wie E-043).

### V1 · E-068 Ein Reviewer je Paket in Stufe leicht (Kosten: ≈ 0,3 M Briefing-Anpassung, kein Werkzeug)

- Hypothese: Bei Paketen der Stufe leicht mit mindestens zwei Tasks und einem Diff ≤ 300 Zeilen reviewt ein einziger `qa-code-reviewer` den Paket-Diff statt eines je Task. Das spart Erstladung (13k Start-Kontext) und Wachstum je gesparter Instanz.
- Messgrösse: `qa-code-reviewer`-Instanzen je Paket ≤ 1,3 (Ausgang 13 Instanzen in dieser Session; Pakete mit Review ≈ 7, Deutung) und Anteil Cache-Write 5 min der Rolle ≤ 4 Punkte (Ausgang 6,4 Wachstum + 1,1 Pause); Gegenprobe: Review-Befunde erst im Gate Merge ≤ 1 je Paket und Erstabnahme-Quote ≥ 80 %.
- Rückfall: Briefing-Zeile streichen, Review je Task wie bisher.

### V2 · TOOL-METRIK-SESSION: Session-Zeitraum in der Session-Datei durchreichen, Erstladung ausweisen (Werkzeug, ≈ 8 Tools)

- Inhalt: (a) `flake_suspects` und die Bereinigung des Steuerungsanteils in der Session-Datei erhalten `since` (Beobachtung 2026-10-14); (b) Aufteilung Cache-Write 5 min zusätzlich in «Erstladung» (erster Schreibvorgang je Instanz) und «Wachstum danach».
- Messgrösse: Session-Datei und `--since`-Lauf stimmen bei Flake und Steuerungsanteil überein (Test mit fester Fixture); Erstladung + Wachstum + Pause = Cache-Write 5 min.
- Messbarkeit: verbessert sie (trennt B1); die bisherigen Zeilen bleiben, die Historienzeile bleibt unverändert.
- Rückfall: Revert des Werkzeug-Commits; die Zeilen kehren zum Stand dbac5fc4 zurück.

### Messauftrag (kein Experiment)

- studio-coach, nächste Session-Retro: Briefing-Verbote (b) an den Archiv-Berichten prüfen (Warum ging der Review-Bericht an L0?) und `guard_block` mit Warte-Muster seit R652 zählen; Guard für (b) erst bei dreifacher Verletzung einer Klasse in einer Session (R646 (6)).

## Bewertung laufender Experimente

- E-066 (Datenpunkt 1 von 3): `lead-tech` mit 3 Neuschreibungen ≥ 20k (Soll ≤ 5; Ausgang 8) in dieser Session; Kostengewicht je Neuschreibung nicht einzeln ausgelesen, der Pausenanteil `lead-tech` ist 1,4 Punkte (Ausgang 2,6). Rückfragen wegen fehlender Übergabe: keine in R648–R658 genannt. Erste Hälfte der Schwelle erfüllt, Wirkung nicht von kleinerer Session trennbar → weiter beobachten.
- E-063 (Datenpunkt): die Integrator-Briefings nach 12:00 (`-121936`, `-131528`, `-131903`) nennen `.worktrees/integrate`; die zwei Briefings nach 12:00 mit Hauptcheckout-Bezug (`-121737` R631/R630, `-124750` R644) tragen eine Ruling-Nummer; `-141016` arbeitet im Worktree `handel-2` (Paket-Worktree, nicht Hauptcheckout). Briefings ohne Ruling-Nummer: 0 → weiter beobachten (Zähler laut R646: dieser Datenpunkt ≈ 5 von 10 Läufen).
- E-064: kein `git stash` ausser einem Treffer in einer Zusammenfassung (Ereignis 2026-10-13); keine Rückmeldung «Stash nötig, Guard im Weg» in R648–R658 → weiter beobachten.

## Änderungen an lernen.md

- neu (Ergänzung zu bestehenden Zeilen, 40 Zeilen bleiben): Ampel-Zeile um «Session-Datei zeigt Flake und bereinigten Steuerungsanteil ohne Zeitraum, vor dem Urteil `--since` gegenlesen (B2)» ergänzt; Zeile «Prüfungen, die Sekunden kosten» um den Gate-Fall `studio-lint` statt `make lint` (R647, R650, B3) ergänzt · gestrichen: keine.
