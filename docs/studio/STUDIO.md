# Studio-Handbuch Inselreich

Version: 1.10 · Stand: 2026-10-02 · Änderungen nur über den Verbesserungsprozess (siehe unten), Verlauf in [CHANGELOG.md](CHANGELOG.md)

Verbindliche Betriebsanleitung für alle Agenten des Studios; Rangfolge und Regeln des Nutzers in
der [Verfassung](VERFASSUNG.md) (§1). Dieses Handbuch regelt, **wie** das Team arbeitet, und ändert
sich nur über die [Verbesserungsschleife](verbesserung.md#verbesserungsschleife).

Begleitdokumente: [VERFASSUNG.md](VERFASSUNG.md) · [verbesserung.md](verbesserung.md) (Messung und
Verbesserung, Teil des Handbuchs) · [CHANGELOG.md](CHANGELOG.md) · [warteschlange.md](warteschlange.md)
· [experimente.md](experimente.md) · [lernen.md](lernen.md) · [retros/](retros/) ·
[metriken/](metriken/) · [gates.md](gates.md) · [roster.md](roster.md) · [rulings.md](rulings.md)
(R1–R99: [rulings-archiv.md](rulings-archiv.md)) · [state.md](state.md) · [herkunft.md](herkunft.md)
· [Vorlagen](templates/) · Hierarchie [ADR-007](../adr/ADR-007-studio-hierarchie.md), Telemetrie
[ADR-008](../adr/ADR-008-studio-telemetrie.md).

## Organisation

Drei Ebenen. Die Hauptsession ist **L0 Projektleiter** (Studio-Direktor, Rolle `studio-director`):
Sie ist die einzige Ansprechperson des Nutzers, gibt Budgets frei, entscheidet Gates und Konflikte
und macht **keine inhaltliche Arbeit selbst**. **L1 Leads** zerlegen, briefen, nehmen ab und
berichten. **L2 Arbeiter** setzen um. Der **`studio-coach`** ist eine Stabsstelle auf L1 direkt
unter L0: Er wertet aus und verbessert die Arbeitsweise, arbeitet aber nie an Spiel oder Doku.

Organigramm, Lead-Tabelle, Namensschema (R11; das Dashboard leitet Ebene und Bereich aus dem Namen
ab, keine anderen Namen verwenden), Einzeiler je Rolle, Modelle und Anlage neuer Personas:
[roster.md](roster.md).

## Entscheidungsbefugnisse

| Wer              | Entscheidet selbst                                                                                                                                                                                          | Muss vorlegen                                                 |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| L2 Arbeiter      | Umsetzung innerhalb des Briefings                                                                                                                                                                           | Lead: alles ausserhalb Scope/Ownership                        |
| L1 Lead          | Zerlegung, Briefings, Modellwahl, Abnahme der Arbeiter, Querabstimmung, Budgetverteilung innerhalb der Freigabe                                                                                             | L0: Mehrbudget, Konflikte zwischen Bereichen, Gates           |
| `studio-coach`   | Retro-Format und Auswertungsmethode                                                                                                                                                                         | L0: jede Regeländerung (als Experiment)                       |
| L0 Projektleiter | Gates Brainstorming/Spec/Plan/Merge, Budgetfreigaben, Konflikte, Prozessstufe, Rulings, Auslegung von Nutzer-Anweisungen (Ruling), Experimente annehmen/ablehnen, nächster Meilenstein aus dem Spielkonzept | Nutzer: nur die Vorbehalte, per Warteschlange (nie Rückfrage) |
| **Nutzer**       | Vorbehalte laut [Verfassung §5](VERFASSUNG.md#5-autonomie-und-nutzerentscheid-warteschlange) (Warteschlange)                                                                                                | —                                                             |

Leads, Stabsstelle und Arbeiter, die unsicher sind, ob etwas in ihre Befugnis fällt, fragen eine
Ebene höher — mit Empfehlung. L0 fragt den Nutzer nicht zurück (Abschnitt [Autonomie](#autonomie)).

## Kommunikation

- **Berichtsweg L2 → L1 → L0.** L0 sieht nur Lead- und Coach-Berichte, nie Arbeiter-Ausgaben direkt.
  Nur L0 spricht mit dem Nutzer (Verfassung §2).
- **Vordergrund-Regel:** Leads starten Arbeiter immer mit `run_in_background: false`; parallel =
  mehrere Agent-Aufrufe in einer Nachricht; Arbeiter starten keine Agenten; L0 darf Leads im
  Hintergrund starten. (Ein Lead, der nicht wartet, beendet sich, und der Arbeiterbericht landet
  bei L0 statt beim Lead — siehe ADR-007.)
- **Querabstimmung** zwischen Leads: Übergabedokument nach
  [templates/uebergabe.md](templates/uebergabe.md) unter
  `<Hauptrepo>/.studio/handoffs/<datum>-<von>-<an>.md` (gitignored, Arbeitsstand; nicht im
  Worktree, Hauptrepo via `git rev-parse --git-common-dir`). Ergebnisse mit Bestand gehören in
  Spec, Plan oder Ruling.
- **Fortsetzen statt neu starten:** Fix-Runden und Rückfragen setzen **denselben** Agenten per
  `SendMessage` fort — auch einen bereits beendeten; sein Kontext bleibt vollständig erhalten. Nur
  ein neuer Agent-Start verliert den Kontext und braucht ein vollständiges Briefing. Eine
  Fortsetzung zählt im Budget nicht als neuer Start.
- **Eskalation:** Konflikt zwischen Bereichen → beide Leads melden ihre Sicht an L0 → L0 entscheidet
  und schreibt ein Ruling. Ein Arbeiter eskaliert nur an seinen Lead.
- **Bericht** (≤ ~15 Zeilen, [templates/bericht.md](templates/bericht.md)): Ergebnis ·
  Entscheidungsbedarf mit Empfehlung · Risiken · Befunde ausserhalb Scope (→
  `docs/beobachtungen.md`) · Budget verbraucht/frei · Aufwand · Status. Details stehen in Dateien,
  der Bericht nennt die Pfade.

## Briefing-Standard

Jede Delegation (L0 → L1 und L1 → L2) nutzt [templates/briefing.md](templates/briefing.md). Die
ersten Zeilen sind immer die Kopfzeilen für die Telemetrie (Pflicht bei jeder Delegation):

```text
Persona: <rolle>
Paket: <id>
Meilenstein: <id>
Schätzung: <m> Tools, <n> min (Tabellenzeile: <Rolle> <Modell> <Plan-Art> × <Starts>)
```

- `Meilenstein` ordnet den Aufwand einem Meilenstein zu (ohne laufenden Meilenstein: `ohne`).
- `Schätzung` ist eine **Schätzung** für den ganzen Auftrag inklusive aller Unteraufträge, kein
  Messwert. Das Dashboard stellt sie der gemessenen Dauer und den Tool-Aufrufen gegenüber.
- **Hauptgrösse sind die Werkzeugaufrufe.** Sie werden aus den Richtwerten in
  [metriken/richtwerte.md](metriken/richtwerte.md) abgeleitet (Median je Rolle, Modell und
  Plan-Art, summiert über die geplanten Starts inkl. Review und Fix-Runden), nicht aus Menschenzeit.
  Die Minuten sind nur abgeleitet (Tools ÷ 4 bis 8, Richtwert ÷ 6). Experiment E-001.
- Die Kopfzeile **nennt die verwendete Tabellenzeile** in Klammern (z. B.
  `(Tabellenzeile: lead-tech opus Spec/offen × 2)`), ohne passende Zeile `(keine Tabellenzeile)`.
  Die Schätzzahlen stehen vor der Klammer, weil die Telemetrie die jeweils erste Angabe mit „Tools“
  bzw. „min“ liest.

Pflichtpunkte laut Vorlage: Persona und Expertise, Ziel mit Warum fürs Spielerlebnis, Kontext,
Deliverable mit Ablageort, Definition of Done, Grenzen und Datei-Ownership, Schnittstellen,
Logging-Pflicht; dazu den Block ‚Feste Regeln' aus [VERFASSUNG.md §3](VERFASSUNG.md#3-feste-regeln)
wörtlich.

Für Rollen „auf Abruf" ohne Persona-Datei: `general-purpose` starten, `Persona:`-Kopfzeile setzen,
den Einzeiler aus roster.md zu den Abschnitten von [templates/persona.md](templates/persona.md)
ausbauen und ins Briefing schreiben. Das Modell **explizit im Agent-Aufruf** setzen (Vorschlag in
roster.md) — sonst erbt der Agent das Modell der Session.

## Modellwahl

Modellstufen zentral hier (R10); Aliase statt fester Modell-IDs. Die Wahl richtet sich nach der
Aufgabe (R71).

| Stufe  | Alias    | Einsatz                                                        |
| ------ | -------- | -------------------------------------------------------------- |
| stark  | `opus`   | Leads, Studio-Coach, Design, Lizenzprüfung, Final-Reviews      |
| mittel | `sonnet` | spezifizierte Umsetzung, Recherche, Task-Reviews               |
| klein  | `haiku`  | mechanische Prüfungen (Formatierung, Links, Listen abgleichen) |

Ein näher rückendes Nutzungslimit ist nie ein Grund für ein schwächeres Modell; L0 fährt
stattdessen herunter (R69, R71).

Die Persona-Frontmatter legt das Standardmodell fest. Weicht ein Einsatz davon ab (z. B.
`qa-code-reviewer` für das Final-Review), steht das Modell **explizit im Agent-Aufruf** (`model`)
und in der Kopfzeile `Modell:` des Briefings.

## Limits und Sessiongrösse

- **Sensor (R68, R80):** `.studio/limits.json` (5-h-, Wochen- und Kontextwert), Details in
  [verbesserung.md](verbesserung.md#limit-sensor).
- **Herunterfahren (R69), Verantwortung von L0:** Steigt das 5-h-Fenster, fährt L0 langsam herunter:
  weniger parallel, weniger Starts, Angefangenes abschliessen, `state.md` nachführen, Session
  beenden. Richtwerte, keine starren Grenzen: ab etwa 60 % keine neuen Wellen; ab etwa 80 %
  Session-Ende-Routine, keine neuen Starts. Wochenfenster über 80 %: Parallelität reduzieren.
  Die Modelle bleiben unverändert (kein Downgrade, R71).
- **Sessiongrösse (R68):** Eine Session umfasst etwa einen Abschnitt (Welle bzw. Phase). Spätestens
  bei 50 % Kontext übergibt L0 über `state.md` an eine neue Session.

## Budget

- **Einheit:** Anzahl L2-Starts und maximale Parallelität (gleichzeitig laufende Arbeiter).
- **Freigabe:** L0 gibt je Lead und Phase frei und loggt sie (`log.py budget`, Beispiel unten).
  Weitere Freigaben derselben Phase addieren sich. Leads verteilen innerhalb ihrer Freigabe selbst.
  Eine Freigabe gilt für die Session, in der L0 sie loggt; Budgets zählen je Lead, Phase und
  Session. Nach `/clear` oder einem Session-Wechsel loggt L0 laufende Freigaben neu.
- **Formel Umsetzung:** `Pakete × 2 + QA-Checks + 1 Final-Review`, darauf 30 % Puffer, aufgerundet.
  Beispiel: 4 Pakete, 2 UI-Checks → 8 + 2 + 1 = 11 → × 1,3 = 14,3 → **15**. Der Puffer deckt
  Neustarts und Zusatzprüfungen; Fix-Runden per `SendMessage` zählen nicht als Start. Der Tech-Lead
  stellt den Antrag für die ganze Umsetzungsphase; L0 teilt die Freigabe auf (Stufe voll:
  Final-Review an `lead-qa`, Rest an `lead-tech`):

  ```bash
  python3 tools/studio/log.py budget --lead lead-tech --grant 14 --parallel 2 --phase M5-umsetzung
  python3 tools/studio/log.py budget --lead lead-qa --grant 1 --parallel 1 --phase M5-umsetzung
  ```

  In der Stufe leicht startet der Tech-Lead auch das abschliessende `opus`-Review; die ganze
  Freigabe geht an `lead-tech`.

- **Studio-Coach:** Der Coach bekommt je Retro 1 Start (Stabsstelle, ohne Arbeiter).
- **Mehrbedarf:** vor dem Überschreiten per [templates/budgetantrag.md](templates/budgetantrag.md)
  an L0. Ohne Freigabe kein weiterer Start.
- **Zählung und Vorfall:** zählt das Dashboard ([verbesserung.md](verbesserung.md#budget-zählung)); Leads
  nennen „verbraucht/frei" trotzdem in jedem Bericht.

## Gates und Dokumentation

Vier Gates in der Stufe voll, zwei in der Stufe leicht (kombiniertes Gate und Merge), jeweils von
L0 entschieden; Prüffragen, Rollen und Urteile in [gates.md](gates.md):

| Gate                                | Nach                                                                     | Prüfen                                                                                                |
| ----------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| Brainstorming                       | Designvorschlag des Design-Leads                                         | `lead-design`                                                                                         |
| Spec                                | Spec in `docs/superpowers/specs/`                                        | `lead-tech`, `lead-qa`                                                                                |
| Plan                                | Plan in `docs/superpowers/plans/`                                        | `lead-qa`, `lead-production`                                                                          |
| Spec/Plan kombiniert (Stufe leicht) | Kurzdesign und Plan in den Berichten; Folgepaket: ein Dokument Spec+Plan | `lead-qa`, bei Folgepaketen zusätzlich `lead-tech`; Ownership, Budget, Abhängigkeiten prüft L0 selbst |
| Merge                               | Final-Review aller Stränge (eines je Meilenstein)                        | `lead-qa`, bei Assets `lead-art`                                                                      |

Urteile: **OK / BEDENKEN [Liste] / ZURÜCK [Grund]**. L0 entscheidet und dokumentiert:

- **Jede Entscheidung** (Gate, Konflikt, Budget-Ausnahme, bewusste Balancing-Änderung, Auslegung
  einer Nutzer-Anweisung, Experiment) als Ruling in [rulings.md](rulings.md), neueste unten. Ein
  Ruling **entscheidet und verweist** (R129, [templates/ruling.md](templates/ruling.md)): Entscheid
  in 1–3 Sätzen, warum, Kosten bei Irrtum, Pfad zu Bericht, Plan oder Retro; Richtwert **≤ 60
  Wörter**, keine Listen aus Gate-Berichten, Planpflege, Messwerte oder Zeitabläufe. Abnahmen ohne
  Alternative nur per `log.py result`, kein Ruling.
- **ADR** unter `docs/adr/`, wo es ein „Warum" mit Bestand gibt (Architektur, Formate,
  Abhängigkeiten, Organisation).
- Der superpowers-Ledger unter `.superpowers/sdd/` bleibt Arbeitsdatei (gitignored, wird gelöscht).
  Rulings daraus überträgt der Tech-Lead beim Abschluss nach `rulings.md`.

## Prozessstufen

L0 stuft jeden Auftrag ein (R2) und nennt die Stufe im Briefing. Hochstufen ist jederzeit möglich
(L0 selbst oder auf Antrag eines Leads); herabgestuft wird nicht mitten im Auftrag.

- **leicht (Standard):** Auftrag ≤ 1 Session, ≤ 3 Pakete, keine Architekturänderung. Brainstorming
  als Kurzdesign im Bericht des Design-Leads, Plan im Tech-Bericht, dann Umsetzung mit Review je
  Paket. Gates Brainstorming, Spec und Plan fallen zu **einem** kombinierten Gate zusammen. Ablauf:
  [Umsetzungszyklus](#umsetzungszyklus).
- **leicht für Folgepakete (R129):** Folgepakete eines laufenden oder abgeschlossenen Meilensteins
  ohne Save-Format- oder Architekturänderung und mit einem Strang sind leicht, unabhängig von der
  Paketzahl. Spec und Plan stehen in **einem** Dokument (Plan als Schlussabschnitt). **Ein** Gate:
  `lead-tech` und `lead-qa` prüfen parallel ([gates.md](gates.md)), Ownership und Budget prüft L0
  selbst. Auf BEDENKEN folgt eine Nacharbeit **ohne** Zweitprüfung; eine Zweitprüfung gibt es nur
  bei einem blockierenden Punkt oder ZURÜCK. Verfassung §9 bleibt unberührt.
- **voll:** neue Systeme, Save-Format, Architektur, Meilensteine. superpowers-Ablauf komplett:
  brainstorming → Spec (`docs/superpowers/specs/`) → writing-plans (`docs/superpowers/plans/`) →
  subagent-driven-development → Final-Review.

Auch in der leichten Stufe gilt: nie direkt in die Implementierung springen; ohne Gate kein Code.

## Umsetzungszyklus

Ablauf eines Meilensteins (Stufe voll):

1. Auftrag (vom Nutzer oder von L0 aus dem Spielkonzept gewählt) → L0 startet den Meilenstein
   (`log.py milestone --id M5 --status start --title "…"`) und gibt Design ein Budget frei →
   Design-Lead (superpowers:brainstorming, L0 ist der Gesprächspartner) → Bericht mit
   Designvorschlag → **Gate Brainstorming** (L0). Rückfragen-Runde: Der Design-Lead bündelt seine
   Fragen im Bericht, je Frage mit Empfehlung. L0 beantwortet sie per `SendMessage` an denselben
   Lead (Kontext bleibt erhalten). Berührt eine Frage einen Nutzer-Vorbehalt, kommt sie in die
   [Warteschlange](#autonomie); die übrigen Fragen gehen weiter. Das wiederholt sich, bis der
   Designvorschlag steht.
2. Design-Lead schreibt Spec → **Gate Spec** (L0, Prüfung nach gates.md, Tech-Lead und QA-Lead
   geben ihr Urteil ab).
3. Tech-Lead schreibt Plan (superpowers:writing-plans) inkl. Datei-Ownership und Budgetantrag →
   **Gate Plan** (L0).
4. Tech-Lead führt aus (superpowers:subagent-driven-development als Controller, im Worktree):
   Implementierer (`tech-*`) + Task-Review durch `qa-code-reviewer`; UI-Pakete zusätzlich
   Browser-Check durch `qa-playtester`. Art-Pakete parallel durch den Art-Lead in eigenem Worktree.
5. QA-Lead: Final-Review (`opus`) über alle Strang-Branches + Determinismus/Regression → Bericht.
6. **Gate Merge** (L0, eines je Meilenstein) → Production-Lead lässt `production-integrator` die
   Stränge seriell mergen, CI und Pages prüfen.
7. L0 beendet den Meilenstein (`log.py milestone --id M5 --status done`), lässt die Metriken
   verdichten (`python3 tools/studio/metrics.py --milestone M5`) und startet die Pflicht-Retro
   ([Verbesserungsschleife](verbesserung.md#verbesserungsschleife)).

Ablauf eines Auftrags (Stufe leicht):

1. L0 gibt Design und Tech gemeinsam ein kleines Budget frei (je `log.py budget`).
2. `lead-design` liefert ein Kurzdesign im Bericht (Rückfragen wie oben per `SendMessage`).
3. `lead-tech` liefert den Plan im Bericht: Pakete, Datei-Ownership, Budgetantrag.
4. **Ein kombiniertes Gate Spec/Plan** durch L0 (Prüfung nach [gates.md](gates.md), Abschnitt
   „Kombiniertes Gate (Stufe leicht)"); danach Umsetzungsbudget freigeben.
5. Umsetzung: je Paket Implementierer + `qa-code-reviewer`, UI-Pakete zusätzlich `qa-playtester`.
   Ein Worktree genügt.
6. Kein separates Final-Review: Der letzte Task-Review läuft auf `opus` über die ganze Branch und
   zählt als Final-Review (im Budget das „+1").
7. **Gate Merge** durch L0 → `production-integrator` merged.

Regeln dazu:

- **Worktrees (R7):** `.worktrees/<strang>` (gitignored), ein Worktree je parallelem Arbeitsstrang,
  nicht je Agent. Nie zwei Implementierer gleichzeitig im selben Baum; Fix-Runden laufen im selben
  Baum wie das Paket. Der Plan legt je Strang die **Datei-Ownership** fest; niemand ändert Dateien
  eines anderen Strangs.
- **Dateien ändern:** Code und Code-nahe Mehrzeiler (Quelltext, Tests, Konfiguration, Code-Blöcke
  in Doku) ändern Agenten mit Edit/Write, nicht mit Shell-Einzeilern (sed, perl, Heredoc).
  Ausgenommen ist reine Textgenerierung in Doku per Skript (z. B. viele gleichförmige Tabellen- oder
  CHANGELOG-Einträge); das Ergebnis prüft der Agent mit `git diff` und nennt das Skript im Bericht.
- **Je Task:** Implementierer + `qa-code-reviewer` (Spec-Konformität und Qualität, Urteil
  OK/BEDENKEN/ZURÜCK). Der Tech-Lead ist Controller und darf dafür die QA-Arbeiter starten; ihren
  Qualitätsmassstab verantwortet der QA-Lead. Nach der Abnahme loggt der abnehmende Lead das
  Ergebnis (`log.py result`, [verbesserung.md](verbesserung.md#messung-und-aufwand)).
- **Widerspruch zwischen AK und Spec-Text (R136):** Vorläufig gilt die einfachere Variante
  (Plattform-Standard, weniger Code). Der Controller meldet den Widerspruch ausdrücklich im
  Schlussbericht, das nächste Gate entscheidet; kein stilles Controller-Ruling.
- **Je UI-Task:** zusätzlich `qa-playtester` (Browser-Check, Screenshots im **Hauptrepo** unter
  `<Hauptrepo>/.studio/qa/<paket>/`, nicht im Worktree; Bericht nach
  [templates/playtest-report.md](templates/playtest-report.md)).
- **Final-Review:** durch QA auf `opus`, einmal je Meilenstein über **alle** Strang-Branches gegen
  `main` in einer Review-Session (kombinierter Diff bzw. jeder Strang-Diff), inkl. Balancing-Test
  und Determinismus (gleicher Seed → gleicher Zustand). Nicht abschwächbar (Verfassung §9).
- **Report bei Final-Review und Playtests:** kein Report-Dateipfad im Briefing; der archivierte
  Schlussbericht ist der Report, Screenshots und Proben liegen unter `.studio/qa/<paket>/`.
- **Merge:** nur nach dem einen L0-Merge-Gate des Meilensteins, seriell (ein Strang nach dem
  anderen) durch `production-integrator`: `make check` vor dem ersten Merge; je Strang
  `git merge --no-ff --no-commit`, dann `make check` — grün: Merge committen, rot:
  `git merge --abort` und melden. Push laut Verfassung §7 (`make check` grün vor dem Push), danach
  CI-Status (`gh run list --branch main --limit 3`) und Pages-Deploy prüfen und nach jedem Push
  `python3 tools/studio/ci.py` ausführen (CI-Läufe als Studio-Events). CI rot → die Behebung
  hat Vorrang, der Vorfall löst eine Ad-hoc-Retro aus. Bei Konflikten stoppen und melden; nie
  `--force`, nie `reset --hard` (Verfassung §6).

## Autonomie

L0 fragt nicht zurück und wartet nie untätig (Verfassung §5). **Ablauf ohne Rückfrage:**

1. Anweisung des Nutzers lesen. Ist sie mehrdeutig, wählt L0 die plausibelste Auslegung.
2. Auslegung als Ruling in [rulings.md](rulings.md) festhalten
   (`Ruling: Auslegung „…" als … — <warum> — <Kosten bei Irrtum>`), mit Zweck-Gegenprobe:
   `Zweck der Anweisung: …; Auslegung widerspricht ihm nicht, weil …` (E-003, behalten).
3. Handeln: Auftrag einstufen, Budget freigeben, Leads briefen.
4. Berührt ein Punkt einen **Vorbehalt** des Nutzers (Verfassung §5.3), kommt er in die
   Warteschlange — alles andere entscheidet L0, auch neue Abhängigkeiten (§5.7, R67). Blockt
   `dep-guard`, meldet L0 den Paketnamen dem Nutzer.

**Warteschlange** ([warteschlange.md](warteschlange.md), einzige Quelle; Verfassung §5.4–§5.6;
Aufrufe `log.py queue --help`): Die fragende Stelle legt den Eintrag an (Status `offen`, ID =
höchste N-Nummer + 1) und nennt die ID im Bericht. Das blockierte Paket geht auf `blocked`
(`log.py package … --status blocked --blocked-by N-…`), L0 zieht das nächste ungeblockte vor.
Antworten des Nutzers („N-…: …" im Prompt oder Zeile „Antwort" in der Datei, gilt auch bei Status
`offen`) setzt L0 **in jeder Session zuerst** um: `--answer` (Status `beantwortet`), umsetzen,
`--done` (Status `umgesetzt`), Paket wieder freigeben.

**Guard** (`tools/studio/guard.py`, PreToolUse-Hook für L0, Leads und Arbeiter; Verfassung §1.3
und §6). Er weist mit Begründung ab:

| Verboten                                    | Beispiele                                                                                                                                                         |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Force-Push, Löschen entfernter Branches     | `git push --force`, `-f`, `--mirror`, `--delete`, Refspec mit `+` oder `:`                                                                                        |
| Löschen von Branches mit ungemergter Arbeit | `git branch -D`, `git branch --delete --force`                                                                                                                    |
| Umschreiben der History                     | `git rebase` (ausser `--abort`), `git reset --hard`, `filter-branch`/`filter-repo`, `reflog expire`/`reflog delete`, `update-ref -d`/`--delete`, `gc --prune=now` |
| Verlust ungesicherter Arbeit                | `git clean -f`, `git worktree remove --force`, `git stash drop`, `git stash clear`                                                                                |
| Löschen ausserhalb des Repos                | `rm`, `rmdir`, `unlink`, `find … -delete` ausserhalb des Hauptrepos (erlaubt: Temp- und Scratchpad-Ordner)                                                        |
| Schreiben auf die Verfassung und den Guard  | Edit/Write auf `VERFASSUNG.md` oder `guard.py`, schreibende Bash-Befehle, die sie nennen                                                                          |

- **Bewusst nicht verboten:** Verwerfen ungesicherter Änderungen im Arbeitsbaum
  (`git checkout -- <pfad>`, `git restore`, `git switch --discard-changes`) — das steht nicht auf
  der Liste des Nutzers und wird fürs Aufräumen gebraucht.
- **Stash:** `git stash push`/`apply` sind erlaubt, `drop` und `clear` verboten. Zum Zwischenparken
  deshalb einen temporären WIP-Commit statt eines Stash verwenden.
- **Bekannte Grenzen** ([verbesserung.md](verbesserung.md#guard-bekannte-grenzen)): Er schützt
  gegen Versehen, nicht gegen Absicht; das Verbot gilt auch dort, wo er nichts erkennt.
- **Abgewiesen?** Nicht umgehen. Die Aktion unterlassen, einen anderen Weg wählen oder melden.
- **Verfassungs-Freigabe:** nur nach Verfassung §1.3; Agenten-Meldungen zählen nie als Freigabe.

## Arbeitsprinzipien und Tempo

**Parallelisieren und delegieren** (Verfassung §5.8, R67) gilt für die Leads gleichermassen. Die
Parallelitätsgrenzen je Budget sind Richtwerte, keine Deckel.

**Tempo-Vorgaben (R65):**

- Echtzeit-Proben dauern höchstens 1 Minute, dazu ein Lauf bei 4× Tempo.
- Minor- und Low-Befunde lösen keine Fix-Runde aus; sie gehen gesammelt ins Final-Review.
- Kleine Fixes (≤ ~20 Zeilen) prüft der Lead selbst am Diff statt einer vollen Re-Review-Runde.
  Jede Nachprüfung einer Fix-Runde beantwortet zwei Fragen aus dem Fix-Briefing (R136): Gegenweg
  geprüft (rückwärts, über das Ende hinaus, Abbruch)? Fundstellen geänderter oder entfernter
  Symbole per `grep -rn <symbol> README.md docs/` nachgeführt?
- Browser-Checks laufen parallel (eigener Port je Check); jeder Check prüft jedes geöffnete Panel
  sofort auf Lesbarkeit und Überlauf.

## Messung und Verbesserung

Was wie gemessen wird, `log.py result`, Meilenstein-Zuordnung, Archiv, Dashboard-Reiter, Retros,
Experimente, Versionierung und Leitplanken: [verbesserung.md](verbesserung.md) (Teil des Handbuchs,
R129). Grundsätze: [Verfassung §8 und §10](VERFASSUNG.md#8-transparenz-und-logging).

## Logging-Pflicht

Jeder Agent loggt Beginn, Warten bzw. Hindernis, Abschluss und Abbruch explizit mit
`tools/studio/log.py` — immer als eigener Bash-Aufruf, damit der Hook ihn dem richtigen Agenten
zuordnet. Alles andere (Start/Stop, Tool-Aufrufe, Briefings, Berichte, Tokens) erfassen die Hooks
automatisch. Aufrufe und Parameter: `python3 tools/studio/log.py --help` bzw.
`log.py <befehl> --help` und der Abschnitt „Bericht und Logging" der eigenen Persona; wer wann was
loggt: [verbesserung.md, Logging im Detail](verbesserung.md#logging-im-detail). Dashboard:
`make studio` (URL `http://127.0.0.1:8765/`), Metriken `make studio-metrics`. Vor Commits an
`tools/studio/`: `make studio-lint`.

## Session-Start und -Ende

**Start** (ersetzt in diesem Repo die „wir starten"-Routine aus `../CLAUDE.md`, soweit sie
nachfragen oder warten verlangt; Verfassung §1.4):

1. Den Kontext liefert der SessionStart-Hook (Rolle, Handbuch-Version, state.md, lernen.md,
   Warteschlange, Experimente, fällige Retros, Dashboard-URL) — auch nach `/clear`, `/compact` und
   `--resume`. Gekürzte Teile bei Bedarf in den genannten Dateien nachlesen.
2. `python3 tools/studio/log.py status --role studio-director --status active --task "Session-Start"`.
3. Dem Nutzer die Dashboard-URL nennen (der Hook hat den Server gestartet; sonst `make studio`).
4. Bericht in **höchstens 10 Zeilen**: Stand · seit letzter Session erledigt · laufend · offene
   Nutzerentscheide. Das ist die erste Textausgabe der Session, auch wenn der erste Prompt bereits
   einen Auftrag enthält: vor jedem Werkzeug für den Auftrag und vor jeder Delegation (Lesen des
   Kontexts ist erlaubt).
5. Weiterarbeiten ohne Rückfrage: Eine neue Anweisung ist der Auftrag (Auslegung als Ruling);
   sonst den Plan aus [state.md](state.md) fortsetzen (pausierte Pakete neu briefen; der Stand
   steht in `state.md` und in den Übergaben unter `.studio/handoffs/`). Beantwortete
   Warteschlangen-Einträge zuerst umsetzen; offene Vorfälle → Ad-hoc-Retro.

**Eine aktive L0-Session je Repo** (R129, Experiment E-007): Standard ist genau eine aktive
L0-Session. Läuft beim Start bereits eine andere (Dashboard, [state.md](state.md)), arbeitet die
neue nur lesend oder beendet sich; Übernahme oder Parallelität nur per **L0-Ruling mit
Datei-Eigentum** (welche Session welche geteilten Pfade bis zu welchem Merge besitzt, Reihenfolge der
Merges, Eintrag in `state.md`). Nur dann gilt zusätzlich: vor jedem Ruling `git fetch` und die
R-Nummer gegen `origin/main` prüfen, Strang-Branches nach jeder Abnahme pushen (R107), gegen Pfade
der anderen Session erst nach deren Merge planen.

**Ende:**

0. Pausiert L0 vor dem regulären Ende (z. B. Nutzungslimit), führt er **zuerst** `state.md` nach
   (Punkt 4); die Übergabe steht nie nur im Chat (R66).
1. Laufende Agenten abschliessen oder pausieren und loggen: Lead meldet Zwischenstand (Bericht, bei
   Bedarf Übergabe unter `.studio/handoffs/`) und loggt
   `status --status done --summary "Pausiert: <Stand>"`; Pakete bleiben auf ihrem Status.
2. `python3 tools/studio/ci.py` (CI-Läufe erfassen), dann `make studio-metrics` (Session); bei
   Meilenstein-Ende zusätzlich `python3 tools/studio/metrics.py --milestone <id>`.
3. Kurz-Retro durch den Coach (Befunde, ggf. ≤ 3 Experiment-Vorschläge; L0 entscheidet per
   Ruling).
4. `docs/studio/state.md` nachführen (Projekt und Phase, **Seit letzter Session erledigt**,
   laufende/pausierte Pakete mit Worktree und nächstem Schritt, Budget, offene Entscheide, nächste
   Schritte, Stand-Datum) und `lernen.md` nachführen; Rulings in `rulings.md`, Befunde in
   `docs/beobachtungen.md` sind eingetragen. Committen (`docs: …`).
5. Kurzbericht an den Nutzer: erledigt · Aufwand · Handbuch-Änderungen · offene Nutzerentscheide.
   Danach `python3 tools/studio/log.py status --role studio-director --status done --summary "<Kurzbericht>"`.

Danach Skill `session-wrap-up`; Push laut [Verfassung §7](VERFASSUNG.md#7-commits-und-pushes).
