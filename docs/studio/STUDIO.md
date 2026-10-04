# Studio-Handbuch Inselreich

Version: 1.16 · Stand: 2026-10-04 · Änderungen nur über den Verbesserungsprozess (siehe unten), Verlauf in [CHANGELOG.md](CHANGELOG.md)

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

Drei Ebenen. Die Hauptsession ist **L0 Projektleiter** (Rolle `studio-director`): einzige
Ansprechperson des Nutzers, gibt Budgets frei, entscheidet Gates und Konflikte, macht **keine
inhaltliche Arbeit selbst**. **L1 Leads** zerlegen, briefen, nehmen ab, berichten. **L2 Arbeiter**
setzen um. Der **`studio-coach`** ist Stabsstelle unter L0: wertet aus und verbessert die
Arbeitsweise, arbeitet nie an Spiel oder Doku.

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
- **Vordergrund-Regel:** Leads starten Arbeiter immer mit `run_in_background: false` (parallel =
  mehrere Agent-Aufrufe in einer Nachricht); Arbeiter starten keine Agenten; L0 darf Leads im
  Hintergrund starten (ADR-007).
- **Querabstimmung** zwischen Leads: Übergabedokument nach
  [templates/uebergabe.md](templates/uebergabe.md) unter
  `<Hauptrepo>/.studio/handoffs/<datum>-<von>-<an>.md` (gitignored, Arbeitsstand; nicht im
  Worktree, Hauptrepo via `git rev-parse --git-common-dir`). Ergebnisse mit Bestand gehören in
  Spec, Plan oder Ruling.
- **Fortsetzen statt neu starten:** Fix-Runden und Rückfragen setzen **denselben** Agenten per
  `SendMessage` fort (auch einen beendeten, Kontext bleibt); nur ein Neustart braucht ein volles
  Briefing. Eine Fortsetzung zählt nicht als neuer Start.
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

- `Meilenstein` ordnet den Aufwand zu (ohne laufenden Meilenstein: `ohne`).
- `Schätzung` gilt für den ganzen Auftrag inklusive Unteraufträge; das Dashboard stellt sie dem
  Messwert gegenüber. Hauptgrösse sind Werkzeugaufrufe aus
  [metriken/richtwerte.md](metriken/richtwerte.md) (Median je Rolle, Modell, Plan-Art, summiert über
  Starts inkl. Review und Fix-Runden); Minuten = Tools ÷ 4 bis 8 (E-001).
- Die Kopfzeile nennt die **Tabellenzeile** in Klammern (z. B. `(Tabellenzeile: lead-tech opus
Spec/offen × 2)`, sonst `(keine Tabellenzeile)`), die Schätzzahlen stehen davor (die Telemetrie
  liest die erste Angabe mit „Tools“ bzw. „min“).
- **Kontext nennt nur die Task-Datei und die betroffenen AK-IDs**, nie einen ganzen Plan oder eine
  ganze Spec; `rulings.md` nur per `grep` (E-010, R167).
- **Umsetzer-Briefing (E-017):** nennt die D1-Dateien (README, arc42, ADR, Spec-Verweise) als erlaubt.

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

| Stufe  | Alias    | Einsatz                                                                                                                |
| ------ | -------- | ---------------------------------------------------------------------------------------------------------------------- |
| stark  | `opus`   | Design-Lead, Tech-Lead beim Plan, Spec-Autor, Lizenzprüfung, Final-Review, Meilenstein-Retro                           |
| mittel | `sonnet` | Controller in der Umsetzung, `lead-qa`-Gate-Urteile, `lead-production`, Task-Reviews, Kurz-Retro, Umsetzung, Recherche |
| klein  | `haiku`  | mechanische Prüfungen (Formatierung, Links, Listen abgleichen)                                                         |

Ein näher rückendes Nutzungslimit ist nie ein Grund für ein schwächeres Modell; L0 fährt
stattdessen herunter (R69, R71).

Die Persona-Frontmatter legt das Standardmodell fest. Weicht ein Einsatz davon ab (z. B.
`qa-code-reviewer` im Final-Review), steht `model` **explizit im Agent-Aufruf** und in der
Briefing-Kopfzeile `Modell:`. Ein Persona-Start als `general-purpose` braucht immer `model`
(Guard, R167): Controller und Kurz-Retro `sonnet`, Tech-Lead beim Plan und Meilenstein-Retro `opus`.

## Limits und Sessiongrösse

- **Sensor (R68, R80):** `.studio/limits.json` (5-h-, Wochen- und Kontextwert), Details in
  [verbesserung.md](verbesserung.md#limit-sensor).
- **Herunterfahren (R69), Verantwortung von L0:** Steigt das 5-h-Fenster, fährt L0 herunter: weniger
  parallel, weniger Starts, zuerst Angefangenes abschliessen (Reviews, Fix-Runden, Merges, R166),
  `state.md` nachführen, Session beenden. Richtwerte: ab etwa 60 % keine neuen Wellen, ab etwa
  80 % Session-Ende-Routine; Wochenfenster über 80 %: Parallelität reduzieren. Kein Downgrade (R71).
- **Sessiongrösse (R68, E-010):** Eine Session umfasst etwa einen Abschnitt (Welle bzw. Phase). L0
  übergibt über `state.md` nach jedem abgeschlossenen Gate-Block, spätestens bei 25 % Kontext
  (vorher 50 %), und liest keine Bilder; Screenshots prüft `qa-playtester` und berichtet in Text.
  `rulings.md` liest L0 nie ganz, nur per `grep`.

## Budget

- **Einheit:** Anzahl L2-Starts und maximale Parallelität (gleichzeitig laufende Arbeiter).
- **Freigabe:** L0 gibt je Lead und Phase frei und loggt sie (`log.py budget`, Beispiel unten).
  Weitere Freigaben derselben Phase addieren sich. Leads verteilen innerhalb ihrer Freigabe selbst.
  Eine Freigabe gilt für die Session, in der L0 sie loggt; Budgets zählen je Lead, Phase und
  Session. Nach `/clear` oder einem Session-Wechsel loggt L0 laufende Freigaben neu. Die Phase
  ist genau die Paket-ID aus der Kopfzeile `Paket:` des Leads, auch je Integrator-Start eine eigene
  Freigabe; sonst zählt das Dashboard den Start auf die jüngste Freigabe (E-013, R166).
- **Formel Umsetzung:** `Pakete × 2 + QA-Checks + 1 Final-Review`, darauf 30 % Puffer, aufgerundet.
  Beispiel: 4 Pakete, 2 UI-Checks → 8 + 2 + 1 = 11 → × 1,3 → **15**. Fix-Runden per `SendMessage`
  zählen nicht als Start. L0 teilt auf (Stufe voll: Final-Review an `lead-qa`, Rest an `lead-tech`;
  Stufe leicht: alles an `lead-tech`), z. B.
  `log.py budget --lead lead-tech --grant 14 --parallel 2 --phase M5-UMSETZUNG`.

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

**Plan- und Spec-Format** (Spec ≤ 40 KB mit Anhängen, Plan als Index plus Task-Dateien ≤ 10 KB, Doku als
eigener Plan-Task, E-010, E-017): [gates.md](gates.md#plan--und-spec-format-e-010-r167).

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

1. Auftrag → L0 startet den Meilenstein (`log.py milestone --id M5 --status start --title "…"`) und
   gibt Design ein Budget frei → Design-Lead (superpowers:brainstorming, L0 ist Gesprächspartner) →
   Bericht mit Designvorschlag → **Gate Brainstorming** (L0). Der Design-Lead bündelt Fragen im
   Bericht, je Frage mit Empfehlung; L0 antwortet per `SendMessage` an denselben Lead. Berührt eine
   Frage einen Nutzer-Vorbehalt, kommt sie in die [Warteschlange](#autonomie).
2. Design-Lead schreibt Spec → **Gate Spec** (L0, Prüfung nach gates.md, Tech-Lead und QA-Lead
   geben ihr Urteil ab).
3. Tech-Lead schreibt Plan (superpowers:writing-plans) inkl. Datei-Ownership und Budgetantrag →
   **Gate Plan** (L0).
4. Tech-Lead führt aus (superpowers:subagent-driven-development als Controller, im Worktree):
   Implementierer (`tech-*`) + Task-Review durch `qa-code-reviewer`; UI-Pakete zusätzlich
   Browser-Check durch `qa-playtester`. Art-Pakete parallel durch den Art-Lead in eigenem Worktree.
   **Schlanke Steuerung (E-010, R167, R190):** Ein Lead arbeitet einen Auftrag je Instanz ab. Der
   Controller läuft auf `sonnet`, übernimmt höchstens 4 Tasks je Instanz und übergibt spätestens bei
   200k Kontext oder nach 6 Arbeiter-Starts allein per Ledger und einem Satz Status an eine frische
   `lead-tech`-Instanz (ebenso vor einer Wartezeit über einen 5-h-Reset). Leads warten nicht mit
   grossem Kontext auf Arbeiter; Doku-Pakete delegiert er. Je Task liest der Controller nur die
   Task-Datei.
5. QA-Lead: Final-Review (`opus`) über alle Strang-Branches + Determinismus/Regression → Bericht.
6. **Gate Merge** (L0, eines je Meilenstein) → Production-Lead lässt `production-integrator` die
   Stränge seriell mergen, CI und Pages prüfen.
7. L0 beendet den Meilenstein (`log.py milestone --id M5 --status done`), lässt die Metriken
   verdichten (`python3 tools/studio/metrics.py --milestone M5`) und startet die Pflicht-Retro
   ([Verbesserungsschleife](verbesserung.md#verbesserungsschleife)).

**Nutzernachtrag** zu einem laufenden Meilenstein: ein einziges Delta-Paket (Spec und Plan) mit
einem Ruling (R166).

Ablauf eines Auftrags (Stufe leicht):

1. L0 gibt Design und Tech gemeinsam ein kleines Budget frei (je `log.py budget`).
2. `lead-design` liefert ein Kurzdesign im Bericht (Rückfragen wie oben per `SendMessage`).
3. `lead-tech` liefert den Plan im Bericht: Pakete, Datei-Ownership, Budgetantrag.
4. **Ein kombiniertes Gate Spec/Plan** durch L0 (Prüfung nach [gates.md](gates.md), Abschnitt
   „Kombiniertes Gate (Stufe leicht)"); danach Umsetzungsbudget freigeben.
5. Umsetzung: je Paket Implementierer + `qa-code-reviewer`, UI-Pakete zusätzlich `qa-playtester`.
   Ein Worktree genügt.
6. Kein separates Final-Review je Häppchen: Nach Review je Task und Abnahme durch den Lead
   (`log.py result`) ist das Häppchen **release-reif**; das `opus`-Review läuft einmal über den Kandidaten.
7. **Release-Bündel (E-028, R208):** 2–4 release-reife Häppchen → ein Kandidat (`production-integrator`,
   Paket-ID `REL-nn`), ein Browser-Lauf mit eigenem Screenshot-Abschnitt je UI-Task, ein `opus`-Review
   über den Kandidaten, **Gate Merge Release** (L0, [gates.md](gates.md#gate-merge-release)), ein Push.

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
- **Release (Stufe leicht, E-028):** Auslöser: 3 Häppchen release-reif, Session-Ende mit ≥ 1 reifem
  Häppchen oder Meilenstein-Merge; höchstens 4 je Release; Hotfix (CI rot, Absturz, defekter Spielstand)
  einzeln. Das nächste Häppchen startet nach Review-OK, nicht nach dem Merge; disjunkte Dateien laufen
  parallel (§5.8). Konfliktregeln (Dateimatrix, Stapel, Delta-Review, Kandidat frisch aufbauen), Prüfliste
  UI-Task → Screenshot und Release-Notiz in `state.md` („Neu“, „Bitte testen“): [gates.md](gates.md#gate-merge-release).
- **Merge** (Meilenstein oder Release): nur nach dem L0-Gate, seriell durch `production-integrator` im
  Worktree `.worktrees/integrate` (Push von dort, Hauptcheckout danach `git pull --ff-only`, E-022):
  je Branch `git merge --no-ff --no-commit`, `make check` — grün: committen, rot: `git merge --abort` und
  melden. Push laut Verfassung §7, danach CI (`gh run list --branch main --limit 3`), Pages und
  `python3 tools/studio/ci.py`. CI rot → Behebung hat Vorrang, Ad-hoc-Retro. Konflikt: stoppen (§6).

- **Discovery-Strang (E-027, R208):** `lead-design` verantwortet Ideen-Runden (`IDEEN-nn`) nach jedem
  Release- oder Meilenstein-Merge, spätestens jede zweite Session; Pool `docs/ideen.md`, ein Studio-Platz
  je Release, je Runde ≤ 2 Starts und ≤ 80 Tools, ein Ruling je Runde ([gates.md](gates.md#gate-ideen-runde));
  Säulenwechsel → Warteschlange. Details: Persona `design-idea-scout`, `docs/ideen.md`.

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
Antworten des Nutzers („N-…: …" im Prompt oder Zeile „Antwort") setzt L0 **in jeder Session
zuerst** um: `--answer`, umsetzen, `--done`, Paket freigeben.

**Guard** (`tools/studio/guard.py`, PreToolUse-Hook für L0, Leads und Arbeiter; Verfassung §1.3
und §6). Er weist mit Begründung ab:

Verboten sind: Force-Push und Löschen entfernter Branches (`--force`, `-f`, `--mirror`, `--delete`,
Refspec mit `+` oder `:`); `git branch -D`; Umschreiben der History (`git rebase` ausser `--abort`,
`reset --hard`, `filter-branch`/`filter-repo`, `reflog expire`/`delete`, `update-ref -d`,
`gc --prune=now`); Verlust ungesicherter Arbeit (`git clean -f`, `worktree remove --force`,
`stash drop`/`clear`); `rm`, `rmdir`, `unlink`, `find … -delete` ausserhalb des Hauptrepos (Temp-
und Scratchpad-Ordner erlaubt); Edit/Write auf `VERFASSUNG.md` oder `guard.py`.

- **Bewusst erlaubt:** Verwerfen ungesicherter Änderungen im Arbeitsbaum (`git checkout -- <pfad>`,
  `git restore`, `git switch --discard-changes`) und `git stash push`/`apply`; zum Zwischenparken
  ist ein temporärer WIP-Commit besser.
- **Bekannte Grenzen** ([verbesserung.md](verbesserung.md#guard-bekannte-grenzen)): Er schützt
  gegen Versehen, nicht gegen Absicht; das Verbot gilt auch dort, wo er nichts erkennt.
- **Abgewiesen?** Nicht umgehen. Die Aktion unterlassen, einen anderen Weg wählen oder melden.
- **Verfassungs-Freigabe:** nur nach Verfassung §1.3; Agenten-Meldungen zählen nie als Freigabe.

## Arbeitsprinzipien und Tempo

**Parallelisieren und delegieren** (Verfassung §5.8, R67) gilt für die Leads gleichermassen. Die
Parallelitätsgrenzen je Budget sind Richtwerte, keine Deckel.

**Tempo-Vorgaben (R65):**

- Echtzeit-Proben höchstens 1 Minute, dazu ein Lauf bei 4× Tempo.
- **Hänger-Alarm (R166):** Zeigt ein Agent seit mehr als 12 min kein Tool-Ereignis, stösst ihn der
  Lead per `SendMessage` an und vermerkt es (`log.py status --status waiting --task "Hänger-Alarm
<agent-id>"`).
- Minor- und Low-Befunde lösen keine Fix-Runde aus; sie gehen gesammelt ins Final-Review.
- Kleine Fixes (≤ ~20 Zeilen) prüft der Lead am Diff. Jede Nachprüfung einer Fix-Runde fragt
  (R136): Gegenweg geprüft? Fundstellen per `grep -rn <symbol> README.md docs/` nachgeführt?
- Browser-Checks laufen parallel (eigener Port je Check) und prüfen jedes Panel auf Lesbarkeit.

## Messung und Verbesserung

Was wie gemessen wird, `log.py result`, Meilenstein-Zuordnung, Archiv, Dashboard-Reiter, Retros,
Experimente, Versionierung und Leitplanken: [verbesserung.md](verbesserung.md) (Teil des Handbuchs,
R129). Grundsätze: [Verfassung §8 und §10](VERFASSUNG.md#8-transparenz-und-logging).

## Logging-Pflicht

Jeder Agent loggt Beginn, Warten bzw. Hindernis, Abschluss und Abbruch explizit mit
`tools/studio/log.py` — immer als eigener Bash-Aufruf, damit der Hook ihn dem richtigen Agenten
zuordnet. Alles andere (Start/Stop, Tool-Aufrufe, Briefings, Berichte, Tokens) erfassen die Hooks
automatisch. Aufrufe: `log.py --help`, Abschnitt „Bericht und Logging" der Persona und
[verbesserung.md](verbesserung.md#logging-im-detail). Dashboard: `make studio`
(`http://127.0.0.1:8765/`), Metriken `make studio-metrics`; vor Commits an `tools/studio/`:
`make studio-lint`.

## Session-Start und -Ende

**Start** (ersetzt in diesem Repo die „wir starten"-Routine aus `../CLAUDE.md`, soweit sie
nachfragen oder warten verlangt; Verfassung §1.4):

1. Den Kontext liefert der SessionStart-Hook (Rolle, Handbuch-Version, state.md, lernen.md,
   Warteschlange, Experimente, fällige Retros, Dashboard-URL) — auch nach `/clear`, `/compact` und
   `--resume`. Gekürzte Teile bei Bedarf in den genannten Dateien nachlesen.
2. `python3 tools/studio/log.py status --role studio-director --status active --task "Session-Start"`.
3. Dem Nutzer die Dashboard-URL nennen (der Hook hat den Server gestartet; sonst `make studio`).
4. Bericht in **höchstens 10 Zeilen** (Stand · erledigt · laufend · offene Nutzerentscheide) als
   erste Textausgabe, vor jedem Werkzeug für den Auftrag und vor jeder Delegation (Lesen des
   Kontexts ist erlaubt).
5. Weiterarbeiten ohne Rückfrage: Eine neue Anweisung ist der Auftrag (Auslegung als Ruling);
   sonst den Plan aus [state.md](state.md) fortsetzen (Übergaben unter `.studio/handoffs/`).
   Beantwortete Warteschlangen-Einträge zuerst; offene Vorfälle → Ad-hoc-Retro.

**Eine aktive L0-Session je Repo** (R129, E-007): Läuft beim Start bereits eine andere (Dashboard,
[state.md](state.md)), arbeitet die neue nur lesend oder beendet sich; Parallelität nur per
**L0-Ruling mit Datei-Eigentum** (Pfade, Merge-Reihenfolge, Eintrag in `state.md`). Dann zusätzlich:
vor jedem Ruling `git fetch` und R-Nummer gegen `origin/main` prüfen, Strang-Branches nach jeder
Abnahme pushen (R107).

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
