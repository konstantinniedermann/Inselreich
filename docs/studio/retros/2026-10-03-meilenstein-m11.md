# Retro meilenstein M11 — 2026-10-03

- Datum: 2026-10-03
- Art: meilenstein
- Auslöser: M11 „Wirtschaft im Fluss" (Merge aa5b3b9, R200)
- Datenbasis: `docs/studio/metriken/M11.md`, `python3 tools/studio/metrics.py --efficiency`, `docs/studio/rulings.md` (R191–R200), `docs/beobachtungen.md`, `docs/studio/experimente.md`

Deutung steht jeweils getrennt unter „Deutung". Der Umfang ist ein Start ohne Befragung (Kosten); die Rulings tragen die Leads-Sicht.

## Befunde

### B1 · Ablauffehler von L0 im Hauptcheckout (Muster, 2 Fälle)

- Beobachtung: R193: Push trotz rotem prettier-Check, weil die Befehle mit `;` verkettet waren (Fix 7d588a2). R196/R198: L0-Commit f8f234e schloss den vorbereiteten Integrator-Merge ab, Titel falsch („Ruling R196"); Regel „kein eigener Commit im Hauptcheckout, solange ein Integrator dort arbeitet" erst danach (R198).
- Beleg: `docs/studio/rulings.md` R193, R196, R198.
- Wirkung: ein Fix-Commit, ein falsch betitelter Merge-Commit; kein Datenverlust.
- Deutung: Beide Fehler sind Reihenfolge-Fehler beim Zusammenführen (Prüfung nicht blockierend, geteilter Checkout). Zwei Fälle in einer Session sind ein Muster, die Regel aus R198 deckt nur den zweiten Fall.

### B2 · Branch- und Worktree-Hygiene der Arbeiter (Einzelfälle, ein Muster „Abschluss ohne Gegenprobe")

- Beobachtung: Integrator löschte den lokalen Branch mit `branch -d` (Umfeld R192); lead-art committete auf lokalem main ohne Push (35f023c, ein Beobachtungs-Commit); der Hook blockt `git worktree remove --force` gegen den Teardown-Auftrag; Playtester teilen ein Scratchpad.
- Beleg: Auftrag L0 (Session-Belege); `git show -s 35f023c`; R192 (Teardown, Playtester-Port).
- Wirkung: kein Verlust (Merge-Stände lagen auf Remote bzw. in Rulings), aber Nachräumen durch L0.
- Deutung: Jeder Fall einzeln harmlos; gemeinsam fehlt eine Abschlusszeile „Branch gepusht / Worktree entfernt". Vier verschiedene Ursachen: noch kein Befund für eine einzelne Massnahme.

### B3 · Plan-Instanz über dem Deckel, Spec knapp darunter

- Beobachtung: Plan-Instanz lief für die Fix-Runde auf 225k Kontext (Deckel E-010: 200k, R192). Spec M11: 39 985 Byte (39,0 KB, Schwelle 40 KB). Task-Dateien über 10 KB: T10 (10 556 B), R2 (10 336 B), T11b (10 284 B).
- Beleg: R192; `ls -l docs/superpowers/specs/2026-10-03-m11-wirtschaft-im-fluss-spec.md` und `.../plans/2026-10-03-m11-wirtschaft-im-fluss/`.
- Wirkung: Grösste gelesene Datei 46,1 KB (gelb), Cache-Write 5 min rot.
- Deutung: Die Schwelle wird eingehalten, aber knapp; wer die Spec auf Grenze schreibt, lässt der Fix-Runde keinen Platz. Der Deckel gilt für Starts, nicht für Fix-Runden: Fix-Runde = neue Instanz wäre die Lücke.

### B4 · Merge-Konflikte in `docs/beobachtungen.md` (Muster, 3 Fälle)

- Beobachtung: Konflikte bei H-R7, C7 und R2. Die Datei ist ein reines Anhänge-Journal, alle Zweige schreiben dorthin.
- Beleg: Auftrag L0; `docs/beobachtungen.md` (Einträge M11-R1/M11-R2/M11-D1 aus drei Zweigen).
- Wirkung: manuelle Auflösung je Konflikt in Integrator- bzw. Controller-Instanzen (Kosten nicht einzeln gemessen).
- Deutung: Ein Anhänge-Journal ist der klassische Fall für `merge=union`; Risiko: doppelte oder vermischte Zeilen bei mehrzeiligen Einträgen. Daher Experiment mit Stichprobe (E-022).

### B5 · Budget-Alarme nach Werkzeug-Fix weiter falsch, Timer-Aufwachen

- Beobachtung: lead-production 4/1 und lead-tech 6/2 melden Alarm trotz Fix (R198 erklärte M10-S1C 4/3 und lead-art-Parallelität zu echten Überschreitungen). lead-qa-Instanz wachte wiederholt per Timer auf, L0 stoppte sie.
- Beleg: `docs/studio/rulings.md` R198; Auftrag L0.
- Wirkung: Fehlalarme verwässern das Budget-Signal; Timer-Aufwachen kosten 5-min-Cache-Neuschreibungen.
- Deutung: Ursache der Fehlalarme unbelegt. Lernen-Zeile „Ursache gegen echte Events belegen, bevor ein Fix gebaut wird" gilt: kein Fix-Vorschlag ohne Event-Analyse.

### B6 · Flakiger Test, zweimal rot, nicht reproduziert

- Beobachtung: je einmal rot beim Merge feat/m11-ui und bei B1; in 17 Läufen nicht reproduziert, Testname unbekannt. Kandidat: Zeitstempeltest in `tools/studio/tests` (Sekundenwechsel).
- Beleg: `docs/beobachtungen.md` (Eintrag 2026-10-03 „studio-test einmal flaky", Nachtrag M11-D1).
- Deutung: Einzelfall bis zum Namen; kein Experiment. Beim nächsten Rot Testname sichern.

### B7 · Qualität der Umsetzung

- Beobachtung: 16 Ergebnisse, Erstabnahme 100 %, Review-Runden im Mittel 1,00, Nacharbeit 0; Ist 288 min gegen 464 min geschätzt (-37,8 %), 1434 gegen 2685 Werkzeugaufrufe.
- Beleg: `docs/studio/metriken/M11.md`, Abschnitte Qualität und Aufwand.
- Deutung: Die Qualitätszahlen zählen Abnahmen; mehrere Pakete gingen über BEDENKEN → Fix → Nachprüfung (R191, R195, R197, R198, R200). „Review-Runden 1,00" bildet das nicht ab. Die Schätzung liegt deutlich über Ist: Schätzung wird nicht zur Steuerung genutzt, nur ungenau (Hinweis, kein Befund).

## Effizienz-Ampel

Quelle: `docs/studio/metriken/M11.md` (Meilenstein M11). Die Ampel ohne Argument (ganze Historie) ist deutlich schlechter (Lead-Kontext Max 670k) und hier nicht massgeblich (lernen.md).

| Kennzahl                      | Wert    | Ampel | Befund / Ursache                                         |
| ----------------------------- | ------- | ----- | -------------------------------------------------------- |
| Steuerungsanteil (L0 + Leads) | 29,8 %  | grün  | – (M10: 62,2 %)                                          |
| Umsetzeranteil                | 20,7 %  | grün  | – (M10: 12,5 %)                                          |
| Cache-Write 5 min             | 26,5 %  | rot   | B3, B5; kein neues Experiment, siehe unten               |
| Lead-Kontext Median           | 61k     | grün  | – (M10: 76k)                                             |
| L0-Kontext Max                | 296k    | gelb  | B1 (L0 arbeitet im Hauptcheckout); Übergabe-Regel greift |
| opus-Anteil                   | 48,3 %  | grün  | – (M10: 73,2 %)                                          |
| general-purpose auf opus      | 3       | gelb  | 3 Persona-Starts ohne Persona-Typ; Ursache nicht geprüft |
| Grösste gelesene Datei        | 46,1 KB | gelb  | B3 (Spec auf Grenze, Anhänge)                            |

Rot (Cache-Write 5 min): Kein neuer Vorschlag. Beobachtung: Steuerung und Umsetzer sind grün, der Anteil sank gegenüber M10 (25,8 %) kaum. Deutung: Der Rest stammt aus Design/Spec/Plan (30,8 % Kostenanteil) und Timer-Aufwachen (B5); beide Hebel sind in E-010 (Spec-Grösse, Übergabe-Deckel) enthalten, ein getrennter Vorschlag wäre nicht getrennt messbar (Prüffrage 4). Gelb „general-purpose auf opus 3": Ursache nicht untersucht; Folge-Prüfung in der nächsten Session-Retro (`metrics.py` listet die Instanzen).

## Befragung der Leads

- Keine Befragung (Kurz-Auftrag, Kosten). Quellen: Rulings R191–R200 und Metrik-Datei; die Prozess-Retro (Aussensicht) läuft getrennt (studio-process-coach).

## Vorschläge

Alle Plätze (E-010, E-015, E-017) sind belegt; der Vorschlag steht als `vorgeschlagen` in `docs/studio/experimente.md` und startet erst nach Ruling und freiem Platz.

- E-022 · Beobachtungen ohne Merge-Konflikt (union), gegen B4

Kein Vorschlag zu B1 (Regel R198 steht; Wirkung erst in der nächsten Session messbar), B2 (vier verschiedene Ursachen), B5 (Ursache unbelegt), B6 (Einzelfall).

## Bewertung laufender Experimente

- E-010 (Zwischenstand, Ende M11 = Bewertungspunkt): Steuerungsanteil 29,8 % (Schwelle ≤ 40 %, erfüllt), Lead-Kontext Median 61k (≤ 80k, erfüllt), Cache-Write 5 min 26,5 % (≤ 15 %, verfehlt), grösste Datei 46,1 KB (≤ 40 KB, verfehlt), L0-Kontext Max 296k (≤ 250k, verfehlt). Zusatz: Spec 39,0 KB erfüllt, 3 Task-Dateien über 10 KB (verfehlt), Plan-Instanz 225k über dem 200k-Deckel (R192). Gegenprobe: keine Rückfrage wegen fehlendem Planteil in den Rulings gefunden (T04b-Wortlaut alt, R194, kein Planteil fehlt); Abbruch nicht ausgelöst. Einordnung: Steuerung und Umsetzer deutlich besser als M10, Cache-Write nicht. Empfehlung: `behalten` für die Steuerungsteile, Cache-Write und Dateigrössen als offene Rest-Messgrössen; Entscheidung L0 per Ruling. Einschränkung: eine Messung (M11), Ursache der Besserung (E-010 oder kleinerer Meilenstein) nicht trennbar. Lernen: Messung M12 mit gleicher Fassung als Gegenprobe.
- E-015 (Zwischenstand 4 von 8 Paketen mit Gate Merge): R191, R195, R198, R200 ohne fehlenden Rot-Beleg oder fehlende Nachprüfung (Ausgang 2 von 4); R191, R195, R198, R200 nennen die Nachprüfung derselben Instanz. Schwelle 0 bisher erfüllt. R191 und R195 vermerken „E-015 erfüllt". Gegenprobe Berichte ≤ 15 Zeilen nicht geprüft (kein Zahlenbeleg). → weiter beobachten.
- E-017 (Zwischenstand M11): Final-Review meldete Doku-Nachträge (orga-12, abdeckung.md, README Stein-Aufpreis), eingeordnet niedrig (R199 Punkt 3), behoben durch C7 in 39984a4. Schwelle „0 Final-Reviews mit fehlender Doku": verfehlt (1 niedriger Befund). Lead-Commit statt Umsetzer: C7 ist eine Controller-Instanz unter lead-tech, ob der Umsetzer-Task D1 die Nachbesserung schrieb, ist aus den Rulings nicht ablesbar (Commit-Autor identisch). Gegenprobe Ownership-Überschneidung: R193 nennt Doku-Kollision R1/D1 („regelt der Integrator-Merge"); 1 Hinweis, kein Konflikt belegt. Einordnung: Verbesserung gegenüber M10 (1 von 1 → 1 niedriger von 1), Schwelle formal verfehlt. → angepasst oder weiter beobachten; Empfehlung `weiter beobachten` bis M12, weil eine Messung; Schwelle auf „keine mittleren oder höheren Doku-Befunde" nachschärfen nur per Ruling.

## Änderungen an lernen.md

Nur Vorschläge, keine Änderung (Auftrag):

- neu (Vorschlag): Prüfungen vor dem Push als eigener Befehl mit `&&`, nie mit `;` verketten (R193).
- neu (Vorschlag): Ein „Ausnahme angenommen"-Ruling nennt die Schranke, von der es abweicht, damit sie nicht als allgemeingültig weiterwandert (R199: +10 % galt nur H-R7).
- gestrichen: keine (lernen.md hat 31 Inhaltszeilen, 40 sind die Grenze).
