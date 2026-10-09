# Retro session e90e097e — 2026-10-09

- Datum: 2026-10-09
- Art: session
- Auslöser: Session-Ende e90e097e (REL-10 live, REL-11 komplett, UI-SEEKARTE in main); Vorfall-IDs nicht ermittelbar (5 offene Vorfälle laut Metrik-Datei, im Event-Log keine Vorfall-Zeilen gefunden), Quittierung ohne `--triggers`
- Datenbasis: `docs/studio/metriken/S-2026-10-09-e90e097e.md`, `python3 tools/studio/metrics.py --efficiency`, `docs/studio/rulings.md` (R393–R409), `docs/studio/retros/2026-10-09-adhoc-pushgate-rel10.md`, `git log --oneline 283b8ce..HEAD` (76 Commits). Leads nicht befragt (Kurz-Retro, kein Agentenstart erlaubt); Quelle sind die Ruling-Texte.

## Befunde

### B1 · Push REL-10 brauchte vier Anläufe

- Beobachtung: (1) `zeitreserve-push` brach mit „nicht belastbar“ ab, weil `loadMax ≤ 4` bei vollem Vitest-Lauf nicht erreichbar ist (R394, revidiert R393). (2) Zwei Zeitüberschreitungen ohne Reserve in `decorSea` und `decorStamps` (R396, Timeouts 40 s/60 s). (3) `make check` rot im Typcheck TS2353 in `tests/tools/conflicts.test.ts`, eingeführt mit TOOL-GATES-2 (R397). Push dann `7812eb0..5d14854`, CI und Pages grün (R398).
- Beleg: `docs/studio/rulings.md` R394, R396, R397, R398; Ad-hoc-Retro `retros/2026-10-09-adhoc-pushgate-rel10.md`.
- Wirkung: drei Integrator-Starts und mehrere Volllauf-`make test` (je rund 8 min) ohne Push; drei kleine Pakete (TOOL-GATES-2b, FIX-TIMEOUT-REL10, FIX-CONFLICTS-TSC).
- Deutung (getrennt): Das Gate hat gewirkt (R396), aber der Typfehler zeigt eine Abnahmelücke: Vitest transpiliert ohne Typprüfung, die Abnahme R393 lief ohne `tsc`. R398 hat die Pflichtzeile `tsc --noEmit` angenommen und mit Handbuch 1.33 umgesetzt (`docs/studio/templates/briefing.md` Zeile 28, `docs/studio/STUDIO.md` Zeile 342: Integrator-Vorlauf `tsc` und `lint`). Lücke bleibt: `make zeittests` und `make conflicts` stehen weder in der Task-DoD noch im Vorlauf (B2, V1).

### B2 · Zwei weitere Integrator-Abbrüche bei UI-SEEKARTE

- Beobachtung: Merge UI-SEEKARTE brach in `make zeittests` ab: `tests/render/seaMap.test.ts` fehlte in `ZEITTESTS` (R409). Zweiter Abbruch laut L0: `--ff-only` scheiterte an einem parallelen Doku-Commit auf main (kein Ruling-Text dazu, L0-Fund; Beleg indirekt über `c07923f` „main in feat/ui-seekarte gemerged“).
- Beleg: R409; `git log` (`1a38555`, `c07923f`).
- Wirkung: zwei Integrator-Starts (je ≈ 14–27k Kontext, Metrik-Datei: `production-integrator` 8 Instanzen). Der Trivial-Fix `1a38555` ist ein Eintrag.
- Deutung: Lead-Pakete prüfen gezielt, nicht mit den schnellen Make-Schritten. Mit B1 (tsc) sind es drei Abbrüche der gleichen Klasse in einer Session: Prüfungen, die Sekunden kosten, liefen erst im Integrator. Muster über drei Pakete (TOOL-GATES-2, FIX-CONFLICTS-TSC, UI-SEEKARTE).

### B3 · Rot vor Grün zum dritten Mal nicht sauber belegt

- Beobachtung: TOOL-GATES-2 (4 von 5 Fällen ohne Rot-Phase, R393), Render-Strang (Schiff, Fels-M2, Keepout-Zähler nicht belegt, R402), UI-SEEKARTE T1/T2 (Code vor Test geschrieben und „für den roten Lauf entfernt“, R408).
- Beleg: R393, R402, R408. Die Commit-Reihenfolge in der Historie stimmt (R408), sie belegt aber keinen echten Rot-Lauf.
- Deutung: Muster über drei Pakete in einem Tag. R395 hatte V2 bis zum zweiten Fall zurückgestellt; der zweite (R402) und dritte Fall (R408) sind eingetreten. Entscheidung fällig.

### B4 · Testzeiten nach R392 bei Load > 4

- Beobachtung: R401 (UI-Strang) maß bei Load 5,8–6,6, A/B direkt nacheinander, ≤ +3,4 %; in R402 war die Zeitprüfung „bei Load ≤ 4“ verlangt. R408 maß bei Load 1,78.
- Deutung: Mit bis zu drei Arbeitern und einem Integrator auf 10 Kernen liegt die Last oft über 4. Zwei Fälle sind noch kein Befund über die Regel; der relative A/B-Vergleich blieb im Ergebnis unauffällig. Messauftrag statt Vorschlag (siehe Ampel-Zeile Messmethodik unten).

### B5 · Positiv

- REL-10 live (R398), REL-11 komplett mit Release-Check OK (R407), UI-SEEKARTE (REL-12) in main (R408/R409), Lead-Browser-Check 0,3–0,4 ms gegen Ziel ≤ 5 ms.
- Parallelität: Render-Strang mit 3 und UI-Strang mit 2 Arbeitern gleichzeitig (R399/R400), Konflikt-Probe vor jedem Merge, Leads per SendMessage fortgesetzt statt neu gestartet.
- Schätzung gegen Ist: Zeit −54,5 % (geschätzt 230 min, Ist 104,6 min bei 21 verglichenen Agenten), Werkzeugaufrufe geschätzt 438, Ist 643 (+47 %). Dauer wird überschätzt, Aufrufe unterschätzt: nur die Aufrufe sind für die Budgetfreigabe relevant. Erstabnahme-Quote 71 %, Review-Runden im Mittel 1,29 (Maximum 2).

### B6 · Kosmetik: Merge-Commit `7b80fc4`

- Beobachtung: Standardnachricht „Merge branch 'main' into HEAD“ ohne Trailer (`git show -s 7b80fc4`). Der Merge lief im losgelösten Integrations-Worktree, dort heisst der Zweig „HEAD“.
- Wirkung: nur Lesbarkeit der Historie, kein Prozessschaden. Kein Vorschlag; Hinweis fürs Integrator-Briefing (Nachricht mit Paket-ID setzen) im Zuge von V1.

## Effizienz-Ampel

Quelle: Abschnitt „Effizienz“ der Session-Datei (Session) und `metrics.py --efficiency` (Historie, 36 Sessions). Dritte Retro in Folge rot: Steuerungsanteil (R316: Hebel-Vorschlag Pflicht, V3), Cache-Write (Session gelb nach rot in 29c3791b, Historie rot).

| Kennzahl                 | Session (Historie)                    | Ampel             | Befund / Ursache                                                                                                                                                                                                                                            | Hebel oder Messauftrag mit Frist                                                                                                                                  |
| ------------------------ | ------------------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Steuerungsanteil         | 67,7 % (50,5 %)                       | rot (rot)         | Beobachtung: L0 34,0 %, Leads 33,8 %, Umsetzer 15,6 %. Session enthielt Planungs-, Gate-, Ideen- und Release-Check-Pakete ohne Umsetzer-Anteil (R398–R407). Deutung: ein Teil ist strukturell; wie gross, ist ohne Bereinigung nicht lesbar                 | V3: E-049 (Steuerung bereinigt um Plan- und Messpakete) starten, sobald Platz frei; E-038 ab 2026-10-22 (R314) bleibt der Hebel                                   |
| Umsetzeranteil           | 15,6 % (23,9 %)                       | grün              | –                                                                                                                                                                                                                                                           | –                                                                                                                                                                 |
| Cache-Write 5 min        | 24,1 % (29,1 %)                       | gelb (rot)        | Beobachtung: Session knapp unter der roten Schwelle 25 %. Neuschreibungen der Leads zu 70–90 % nach Turn-Ende, L0 100 % (`metrics.py --efficiency`, Abschnitt „Neuschreibungen“, Historie). Deutung: Warten auf Gates und Pausen, nicht Bash-Läufe          | Hebel E-037 (Datenpunkt 2 von 3: 24,1 % gegen ≤ 20 %), E-042 V1, E-050 (vorgeschlagen). Bewertung E-037 nach dem dritten Datenpunkt, spätestens 2026-11-05        |
| Lead-Kontext Median      | 65k (70k)                             | grün              | –                                                                                                                                                                                                                                                           | –                                                                                                                                                                 |
| L0-Kontext Max           | 263k (774k)                           | gelb (rot)        | Beobachtung: eine L0-Instanz, Mittel 172k, Spitze 263k knapp über der gelben Schwelle 250k; der Historienwert 774k stammt aus 29c3791b (424 min ohne Übergabe, Retro dort B-Befund). Deutung: Session ohne Übergabe, aber kurz (196 min), kein Dauerproblem | Messauftrag Coach, nächste Session-Retro: L0-Max gegen die Übergabeschwelle nennen (offen aus 29c3791b); dann V5 aus 29c3791b entscheiden                         |
| opus-Anteil              | 42,1 % (71,6 %)                       | grün (gelb)       | Session grün (Sonnet-Arbeiter: 36 von 40 Modell-Agenten); Historie gelb wegen älterer Sessions                                                                                                                                                              | E-038 (Historie)                                                                                                                                                  |
| general-purpose auf opus | 0 (0)                                 | grün              | –                                                                                                                                                                                                                                                           | –                                                                                                                                                                 |
| Grösste gelesene Datei   | 47,0 KB (59,0 KB)                     | gelb (gelb)       | `docs/beobachtungen.md` (47,0 KB), gelesen von Leads für Eintragen und Prüfen; BEOB-AUSW (R398) hat erledigte Einträge nicht gekürzt                                                                                                                        | Messauftrag lead-production: bei der nächsten BEOB-AUSW erledigte Einträge archivieren, Ziel ≤ 40 KB, Frist nächste Session; sonst Begründung im Bericht          |
| Actions-Minuten (Monat)  | Inselreich 934, Konto 1201, Session 8 | rot / gelb / grün | Beobachtung: Monat +8 min seit dem Stand 926 am 2026-10-08, genau der REL-10-Push. Deutung: Der hohe Monatswert stammt aus den ersten Tagen vor den Sparregeln (R333–R335); ein Push je Session kostet ≈ 8 min                                              | Kein neuer Hebel: Konto-Rest 799 min entsprechen ≈ 100 Pushes; E-046 Datenpunkt 2 von 3, Bewertung nach dem dritten, spätestens 2026-11-12                        |
| Messmethodik Testzeiten  | –                                     | Messauftrag       | B4: zwei Merge-Gates bei Load > 4                                                                                                                                                                                                                           | Messauftrag Coach, Frist 3 Merge-Gates: je Gate Load und Zuwachs im Gate-Ruling nennen; ausgewertet in der nächsten Session-Retro (kein Vorschlag, da zwei Fälle) |

## Befragung der Leads

- Nicht befragt: Kurz-Retro ohne Agentenstart; Belege sind die Rulings R393–R409 und die Ad-hoc-Retro vom selben Tag.

## Vorschläge

Höchstens 3. Sie stehen hier, nicht in `experimente.md`: Der Auftrag erlaubt dort nur Bewertungen; Eintrag dort nach Ruling.

### V1 · Pflichtzeile „schnelle Make-Prüfungen“ in jeder Task-DoD und im Integrator-Vorlauf

- Hypothese: Wenn jede Task-DoD und der Integrator-Vorlauf vor `make test` die Prüfungen ohne Testlauf enthalten (`npx tsc --noEmit`, `make lint`, `make zeittests`, `make conflicts`), werden Abbrüche dieser Klasse im Lead-Paket statt im Integrator gefunden (Stand 1.33: nur `tsc` in der Task-DoD, `tsc` und `lint` im Integrator-Vorlauf; neu: `make lint`, `make zeittests`, `make conflicts` in die DoD, `make zeittests` und `make conflicts` in den Vorlauf) (B1, B2; R397, R398, R409).
- Messgrösse: Integrator-Abbrüche, deren Ursache in `tsc`, `lint`, `zeittests` oder `conflicts` lag: Ausgang 3 in dieser Session (TSC, ZEITTESTS, plus der Typfehler im Push-Gate), Schwelle 0 in den nächsten 5 Merge-Gates oder Push-Gates (Zählung über Ruling-Texte, Anlass „Integrator gescheitert“).
- Messbarkeit: Die Zeile ändert keine Metrik; Abbrüche bleiben in den Rulings zählbar.
- Zeitraum: 5 Gates, höchstens bis 2026-11-05.
- Rückfall: Zeile aus Briefing-Vorlage und Integrator-Briefing streichen (Handbuch auf die Vorversion).
- Dateien: `docs/studio/templates/briefing.md`, `.claude/agents/production-integrator.md`, `docs/studio/STUDIO.md`, `docs/studio/CHANGELOG.md` (nur nach Ruling; Umsetzung zusammen mit R395 V1/R398 in einem Handbuch-Minor). Ergänzend: Merge-Commit-Nachricht mit Paket-ID (B6); `--ff-only` nicht im Hauptcheckout verwenden, wenn parallel Doku-Commits entstehen, sondern HEAD-Prüfung und Merge (lernen.md, Zeile zu Git im Hauptcheckout).

### V2 · Rot-Beleg im Abnahmebericht (R395 V2 jetzt annehmen)

- Hypothese: Wenn jeder Task-Bericht je neuem Testfall den Commit des roten Laufs oder die rote Ausgabe nennt, sinkt der Anteil nicht belegter Rot-Phasen (B3: drei Fälle in drei Paketen).
- Messgrösse: Anteil Testfälle ohne belegten Rot-Lauf ≤ 20 % in den nächsten 3 Paketen mit neuen Tests (Ausgang: Werkzeug-Paket 4 von 5; Render-Strang und UI-SEEKARTE T1/T2 nicht belegt). Beleg ist die rote Ausgabe im Task-Bericht oder ein Commit mit Test ohne Implementierung.
- Messbarkeit: Der Beleg wird im Bericht ausgewiesen; die Quote wird aus Berichten gezählt, die Zeile verschlechtert nichts.
- Zeitraum: 3 Pakete mit neuen Tests, höchstens bis 2026-11-05.
- Rückfall: Zeile streichen.
- Dateien: `docs/studio/templates/briefing.md` (Abnahme-Checkliste), `docs/studio/STUDIO.md`, `docs/studio/CHANGELOG.md` (nur nach Ruling, im selben Minor wie V1).
- Gegenargument: Die Praxis „Test zuerst, Code für den roten Lauf entfernt“ (R408) liefert formal den Beleg; die Zeile sichert nur, dass der rote Lauf stattfand. Das ist der Zweck.

### V3 · E-049 starten (Hebel-Pflicht Steuerungsanteil, R316)

- Hypothese: Die Steuerungsanteile von 67,7 % (Session) und 50,5 % (Historie) enthalten strukturelle Planungs- und Messpakete; eine bereinigte Zeile macht die Wirkung von E-038 und E-042 lesbar (E-049, vorgeschlagen).
- Messgrösse: wie E-049 definiert; zusätzlich Startbedingung: Platz frei, sobald E-046 mit dem dritten Datenpunkt bewertet ist (spätestens 2026-11-12) oder E-042 früher abgeschlossen wird. Das Maximum von 3 laufenden Experimenten bleibt gewahrt (aktuell E-037, E-042, E-046).
- Rückfall: E-049 zurücknehmen (reine Messzeile, keine Regeländerung).
- Entscheidung: nur Platzvergabe per Ruling, kein neuer Experimenttext nötig.

Empfehlung: V1 annehmen, V2 annehmen (dritter Fall), V3 annehmen mit Platzvergabe nach E-046.

## Bewertung laufender Experimente

- E-037 (Cache-Write ≤ 20 %): Session 24,1 %, Datenpunkt 2 von 3 (Vorgänger 24,3 %), Schwelle nicht erreicht → weiter beobachten.
- E-042 (Lead-Handoff): V1 in der Session-Datei: 5 Neuschreibungen > 20k bei 11 Lead-Instanzen = 0,45 (obere Schranke, nicht auf Turn-Ende eingeschränkt), Schwelle ≤ 0,6 erreicht; V2 (Status-Turns) für diese Session nicht erhoben: die Session-Datei weist die Spalte nicht aus, Messauftrag Coach nächste Session mit Skript wie in 29c3791b. Review-Runden 1,29 (≤ 2). Zählung: zweite von drei Sessions (Starts ≥ 10 erfüllt) → weiter beobachten.
- E-046 (Actions-Minuten): Zeile ist in `--efficiency` vorhanden und wird hier mit Wert genannt (Monat 934, Konto 1201, Session 8); Datenpunkt 2 von 3, kein Verbrauch erst vom Nutzer entdeckt → weiter beobachten.
- E-038 (wartet, Start ab 2026-10-22) und E-048 (wartet auf Platz): keine Bewertung.

## Änderungen an lernen.md

- neu: Schnelle Prüfungen ohne Testlauf vor dem Integrator (B1, B2); Commit-Reihenfolge belegt keinen Rot-Lauf (B3) · gestrichen: Zeile „Fragen zum Verhalten des Harness per Headless-Lauf“ und Zeile „Subagenten legen Dateien, die wie Berichte heissen, oft nicht ab“ (beide Altbefunde ohne Wirkung auf aktuelle Arbeit).
