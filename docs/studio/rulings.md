# Rulings

Dauerhafter Ledger aller Studio-Entscheide (R3). Der superpowers-Ledger unter `.superpowers/sdd/`
ist gitignored und wird nach jedem Plan gelöscht; was dort entschieden wurde, überträgt der
Tech-Lead beim Abschluss hierher.

**Format** (Vorlage [templates/ruling.md](templates/ruling.md)):

```text
Ruling: <was> — <warum> — <Kosten bei Irrtum>
```

Darunter Datum, Entscheider, Anlass und ggf. ADR-Link. Neueste Einträge **unten**. Einträge werden
nicht gelöscht; ein überholter Entscheid bekommt ein neues Ruling, das ihn ablöst („löst R… ab").

---

## R1 · 2026-09-30 · Setup-Session

Ruling: Alle 5 Leads, aber nur 8 Arbeiter-Personas jetzt; die übrigen als „auf Abruf" im Roster —
CCGS-Kritik: viel Organisation, wenig Spiel. Personas entstehen, wenn ein Paket sie braucht. — Ein
Lead legt eine Persona nach Vorlage an (ein Commit).

Entscheider: L0 (Nutzer hat freie Hand gegeben) · Anlass: Studio-Setup · siehe [roster.md](roster.md)

## R2 · 2026-09-30 · Setup-Session

Ruling: Prozessstufen **leicht** (Standard) und **voll** — CCGS-Rigor-Messung: schwerer Prozess
brachte kein besseres Spiel. — Zu leichte Stufe → Review findet mehr; L0 stuft hoch.

Entscheider: L0 · Anlass: Studio-Setup · siehe STUDIO.md „Prozessstufen"

## R3 · 2026-09-30 · Setup-Session

Ruling: Dauerhafter Ruling-Ledger `docs/studio/rulings.md` — Der superpowers-Ledger
(`.superpowers/sdd/…/progress.md`) ist gitignored und wird nach jedem Plan gelöscht. — Doppelte
Einträge; harmlos.

Entscheider: L0 · Anlass: Studio-Setup

## R4 · 2026-09-30 · Setup-Session

Ruling: L0 nicht über `"agent"`-Setting erzwingen — Ersetzt den Systemprompt von Claude Code;
Risiko für Werkzeugnutzung. — Rolle kann „verrutschen"; SessionStart-Hook erinnert daran.

Entscheider: L0 · Anlass: Studio-Setup · ADR: [ADR-007](../adr/ADR-007-studio-hierarchie.md)

## R5 · 2026-09-30 · Setup-Session

Ruling: Telemetrie: Hooks schreiben append-only JSONL; Server liest; kein HTTP-POST aus Hooks —
Robust ohne laufenden Server; nur Standardbibliothek; keine Datenbank. — Grosse Datei →
Archivieren (`make studio-archive`).

Entscheider: L0 · Anlass: Studio-Setup · ADR: [ADR-008](../adr/ADR-008-studio-telemetrie.md)

## R6 · 2026-09-30 · Setup-Session

Ruling: Dashboard pollt alle 2 s statt WebSocket — Standardbibliothek, einfach, genügt für
Menschen-Tempo. — 2 s Verzögerung.

Entscheider: L0 · Anlass: Studio-Setup · ADR: [ADR-008](../adr/ADR-008-studio-telemetrie.md)

## R7 · 2026-09-30 · Setup-Session

Ruling: Worktrees unter `.worktrees/<name>` (gitignored), ein Worktree je paralleler
Arbeitsstrang, nicht je Agent — superpowers-SDD: nie parallele Implementierer im selben Baum;
Fix-Runden brauchen denselben Baum. — Seltene Merge-Konflikte zwischen Strängen → Integrator löst.

Entscheider: L0 · Anlass: Studio-Setup · siehe STUDIO.md „Umsetzungszyklus"

## R8 · 2026-09-30 · Setup-Session

Ruling: Python-Tests des Studios laufen in `make check` (und damit in CI) — „Tests grün" soll auch
für die Studio-Werkzeuge gelten. — CI braucht `python3` (auf ubuntu-latest vorhanden).

Entscheider: L0 · Anlass: Studio-Setup

## R9 · 2026-09-30 · Setup-Session

Ruling: Heartbeat-Ausnahme: Status `idle` wird nie als inaktiv markiert; ein Knoten mit aktiven
Kindern auch nicht (das Kind wird markiert) — L0 wartet oft auf den Nutzer; ein Lead wartet
blockierend auf Arbeiter. — Ein wirklich hängender Lead ohne Kinder fällt trotzdem auf.

Entscheider: L0 · Anlass: Studio-Setup · ADR: [ADR-008](../adr/ADR-008-studio-telemetrie.md)

## R10 · 2026-09-30 · Setup-Session

Ruling: Modellstufen: stark = `opus`, mittel = `sonnet`, klein = `haiku`, zentral in STUDIO.md —
Prompt verlangt Stufen; Aliase statt fester IDs überleben Modellwechsel. — Stärkeres Modell
verfügbar → Tabelle und Frontmatter nachführen.

Entscheider: L0 · Anlass: Studio-Setup · siehe STUDIO.md „Modellwahl"

## R11 · 2026-09-30 · Setup-Session

Ruling: Namensschema `lead-<bereich>` (L1) und `<bereich>-<rolle>` (L2); Bereiche `production`,
`design`, `tech`, `art`, `qa` — Dashboard leitet Ebene und Bereich aus dem Namen ab, ohne eigene
Metadaten. — Umbenennen einer Persona = Datei + Roster.

Entscheider: L0 · Anlass: Studio-Setup · siehe [roster.md](roster.md)

## R12 · 2026-09-30 · Setup-Session

Ruling: Ein Merge-Gate je Meilenstein; Final-Review über alle Stränge gegen main, danach serielle
Merges — Budgetformel kennt genau ein Final-Review. — Zusätzliches Gate je Strang später.

Entscheider: L0 · Anlass: Studio-Setup

## R13 · 2026-09-30 · Setup-Session

Ruling: Final-Review-Budget an lead-qa, Rest an lead-tech (Stufe voll) — QA verantwortet das
Final-Review. — Umformulierung in STUDIO.md.

Entscheider: L0 · Anlass: Studio-Setup

## R14 · 2026-09-30 · Setup-Session

Ruling: Leads erhalten SendMessage; Fortsetzen eines Agenten zählt nicht als neuer Start —
verifiziert: Fortsetzen behält den Kontext und feuert SubagentStart mit derselben agent_id. —
Leads briefen Arbeiter neu.

Entscheider: L0 · Anlass: Studio-Setup

## R15 · 2026-09-30 · Setup-Session

Ruling: CCGS-MIT-Lizenztext in `docs/studio/CCGS-LICENSE.txt` — Persona-Texte sind aus CCGS
adaptiert; MIT verlangt den Hinweis. — Eine zusätzliche Datei.

Entscheider: L0 · Anlass: Studio-Setup

## R16 · 2026-09-30 · Setup-Session

Ruling: Dashboard-Rendering in der Umsetzung als Prosa spezifiziert, per Screenshot statt
Unit-Tests geprüft — UI wird visuell abgenommen. — Eine zusätzliche Fix-Runde.

Entscheider: L0 · Anlass: Studio-Setup

## R17 · 2026-09-30 · Setup-Session

Ruling: Verdrängter, per FIFO falsch zugeordneter Knoten behält alte Attribute, falls sein eigenes
spawned-Event fehlt (geparkt) — jeder Agent-Aufruf liefert PostToolUse mit tool_use_id, die
Zustände konvergieren. — Ein Arbeiter zeigt im Dashboard kurz die Aufgabe eines anderen.

Entscheider: L0 · Anlass: Studio-Setup

## R18 · 2026-09-30 · Setup-Session

Ruling: CLAUDE.md behält die Start-/Ende-Routine (Nutzerauftrag) mit Verweis auf STUDIO.md. —
Zwei Stellen pflegen.

Entscheider: L0 · Anlass: Studio-Setup

## R19 · 2026-09-30 · Setup-Session

Ruling: `log.py budget` verlangt `--phase` — verhindert, dass Freigaben ohne Phase über Sessions
hinweg addieren. — Ein Argument mehr.

Entscheider: L0 · Anlass: Studio-Setup

## R20 · 2026-09-30 · Setup-Session

Ruling: Heartbeats im Feed serverseitig zusammengefasst, Schalter zum Ausblenden — ohne das
verdrängen Heartbeats die aussagekräftigen Zeilen. — Weniger Detail im Feed.

Entscheider: L0 · Anlass: Studio-Setup

## R21 · 2026-09-30 · Setup-Session

Ruling: Dashboard öffnet sich automatisch beim ersten Subagenten-Start von L0 — Nutzerwunsch;
Auslöser Spawn statt SessionStart, damit reine Wartungssessions kein Browserfenster öffnen. —
Kosten: ein Browser-Tab je Session.

Entscheider: L0 · Anlass: Nutzerwunsch

## R22 · 2026-09-30 · Session 1.5

Ruling: Umsetzungsweg dieser Meta-Session: L0 als SDD-Controller, Implementierer als Persona
`production-studio-ops` (`general-purpose`), Reviews als `qa-code-reviewer` — die
Projekt-Personas waren in dieser Session nicht geladen (die Session entstand vor `.claude/agents/`,
`/clear` lädt nicht nach). — L0-Kontext wird grösser.

Entscheider: L0 · Anlass: Session 1.5 · Spec:
[Studio 1.5](../superpowers/specs/2026-09-30-studio-autonomie-design.md)

## R23 · 2026-09-30 · Session 1.5

Ruling: Projektleiter als Standard jeder Session über den Output-Style „Projektleiter"
(`keep-coding-instructions: true`), den SessionStart-Hook ohne Matcher (`startup`, `resume`,
`clear`, `compact`) und CLAUDE.md; das `"agent"`-Setting bleibt ungenutzt — es ersetzt laut Doku
den Systemprompt (R4 bestätigt). — Der Nutzer kann den Style per `/output-style` lokal
überschreiben.

Entscheider: L0 · Anlass: Session 1.5; löst R18 ab (CLAUDE.md verweist nur noch auf STUDIO.md) ·
ADR: [ADR-009](../adr/ADR-009-studio-autonomie-und-lernen.md)

## R24 · 2026-09-30 · Session 1.5

Ruling: Verfassungs-Schutz per `tools/studio/guard.py`; Freigabe nur mit der Nutzer-Phrase
`VERFASSUNG ÄNDERN` und nur für die Hauptsession — Schutz gegen Versehen, nicht gegen Absicht. —
Eine absichtliche Umgehung bleibt möglich.

Entscheider: L0 · Anlass: Session 1.5 · ADR:
[ADR-009](../adr/ADR-009-studio-autonomie-und-lernen.md)

## R25 · 2026-09-30 · Session 1.5

Ruling: Der Guard verbietet irreversible Aktionen statt nachzufragen (Force-Push, Löschen
entfernter Branches, `branch -D`, Rebase, `reset --hard`, Filter-Werkzeuge, `clean -f`,
`worktree remove --force`, Löschen ausserhalb des Repos); Verwerfen im Arbeitsbaum bleibt bewusst
erlaubt — Nutzerauftrag „verboten statt nachgefragt"; Aufräumarbeiten brauchen das Verwerfen. —
Fehlalarme kosten einen Umweg.

Entscheider: L0 · Anlass: Session 1.5 · ADR:
[ADR-009](../adr/ADR-009-studio-autonomie-und-lernen.md)

## R26 · 2026-09-30 · Session 1.5

Ruling: Nutzerentscheid-Warteschlange als committete Datei `docs/studio/warteschlange.md`,
geschrieben über `log.py queue`; `log.py decision --for user` bricht ab — eine Quelle, die jede
Session und der Nutzer lesen. — Die Datei kann von Hand kaputt editiert werden (Parser tolerant).

Entscheider: L0 · Anlass: Session 1.5 · ADR:
[ADR-009](../adr/ADR-009-studio-autonomie-und-lernen.md)

## R27 · 2026-09-30 · Session 1.5

Ruling: Messmethode: Tokens aus den Transkripten, je Message-ID dedupliziert (Output ggf.
Untergrenze); Dauer und Tool-Aufrufe aus Hooks und Agent-Ergebnis; Kosten nur als Sitzungssumme
„berechnet" (`cost-state`); nichts wird geschätzt — Nutzerauftrag „nicht Messbares nie schätzen".
— Das Transkriptformat kann sich mit Claude-Code-Updates ändern.

Entscheider: L0 · Anlass: Session 1.5 · ADR:
[ADR-009](../adr/ADR-009-studio-autonomie-und-lernen.md)

## R28 · 2026-09-30 · Session 1.5

Ruling: Studio-Coach als Stabsstelle `studio-coach` (L1, Bereich `studio`, `opus`, ohne
Arbeiter); das Namensschema kennt dafür `studio-<rolle>` — unabhängig von Production, damit niemand
die eigene Arbeitsweise benotet. — Eine Rolle mehr im Budget.

Entscheider: L0 · Anlass: Session 1.5; ergänzt R11 · siehe [roster.md](roster.md)

## R29 · 2026-09-30 · Session 1.5

Ruling: Experimente stehen in `docs/studio/experimente.md`; die Leitplanken (≤ 3 laufend,
Versionen = CHANGELOG, `lernen.md` ≤ 40 Zeilen, Feste-Regeln-Block = Verfassung §3) prüft ein
Konsistenztest in `make check` — Leitplanken ohne Test verwässern. — Der Test kann legitime
Sonderfälle blockieren.

Entscheider: L0 · Anlass: Session 1.5 · ADR:
[ADR-009](../adr/ADR-009-studio-autonomie-und-lernen.md)

## R30 · 2026-09-30 · Session 1.5

Ruling: Metriken als Markdown mit JSON-Rohwerten, eine Datei je Kennung (Session
`S-<datum>-<sid8>`, Meilenstein-ID) unter `docs/studio/metriken/` — lesbar für Menschen und
maschinell für Dashboard und Coach; überdauert das lokale Archiv. — Merge-Konflikte bei
parallelen Sessions sind selten.

Entscheider: L0 · Anlass: Session 1.5

## R31 · 2026-09-30 · Session 1.5

Ruling: Archiv unter `.studio/archiv/` (`briefings/`, `berichte/`, `events/`); das Event-Archiv
zieht von `.studio/archive/` um, der alte Ordner wird weiter gelesen — ein Ort für alles, was
Delegationen nachvollziehbar macht. — Briefings und Berichte liegen lokal im Klartext (Datenschutz,
ADR-008).

Entscheider: L0 · Anlass: Session 1.5 · ADR: [ADR-008](../adr/ADR-008-studio-telemetrie.md)

## R32 · 2026-09-30 · Session 1.5

Ruling: Dashboard mit fünf Reitern (Live, Delegation, Aufwand, Qualität, Studio) — eine Ansicht
je Frage des Nutzers statt einer überladenen Seite. — Mehr Code im Dashboard.

Entscheider: L0 · Anlass: Session 1.5

## R33 · 2026-09-30 · Session 1.5

Ruling: Push-Regel als Verfassung §7 (Push auf `main` nach grünem `make check`, danach CI prüfen),
vorläufig bis zur Bestätigung von N-001 — sonst stockt jede autonome Session beim Merge. — Der
Nutzer könnte eine strengere Regel wollen.

Entscheider: L0 · Anlass: Session 1.5 · siehe [warteschlange.md](warteschlange.md)

## R34 · 2026-09-30 · Session 1.5

Ruling: Gate Spec bestanden, mit eingearbeiteten Bedenken von `lead-qa` (Guard-Formen, Freigabe
nur für die Hauptsession, Messbegriffe, Probelauf isoliert). — Restlücken des Guards bleiben.

Entscheider: L0 · Anlass: Session 1.5, Gate Spec · Spec:
[Studio 1.5](../superpowers/specs/2026-09-30-studio-autonomie-design.md)

## R35 · 2026-09-30 · Session 1.5

Ruling: Gate Plan durch L0 ohne Lead-Urteil — der Plan setzt die geprüfte Spec direkt um;
Task-Reviews fangen Planfehler. — Eine Fix-Runde mehr.

Entscheider: L0 · Anlass: Session 1.5, Gate Plan

## R36 · 2026-09-30 · Session 1.5

Ruling: `log.py result` einmal je (Paket, Arbeiter) mit Endurteil: `angenommen` beim ersten
Review, `nacharbeit` nach Fix-Runden, `verworfen`; `review_rounds 0` = ungeprüft; das neueste
Ergebnis gilt — sonst zählt die Qualitätsquote Zwischenstände doppelt. — Die Semantik muss gelebt
werden.

Entscheider: L0 · Anlass: Session 1.5 · siehe STUDIO.md „Messung und Aufwand"

## R37 · 2026-09-30 · Session 1.5

Ruling: Meilenstein-Zuordnung in dieser Reihenfolge: Kopfzeile → Paket → delegierender Vorfahre →
laufender Meilenstein → „ohne" — jeder Aufwand landet ohne Zusatzarbeit in einem Meilenstein. —
Querschnittsaufträge landen evtl. im falschen Meilenstein.

Entscheider: L0 · Anlass: Session 1.5 · siehe STUDIO.md „Messung und Aufwand"

## R38 · 2026-09-30 · Session 1.5

Ruling: Gate Merge Studio 1.5 bestanden — Final-Review (opus) mit Fix-Welle und Re-Review „bereit
zum Merge", `make check` und `make studio-lint` grün, Probelauf in isolierten Klonen erfüllt alle
fünf Prüfpunkte (Start-Bericht nach Fix in Lauf 3), `src/`/`tests/`/`public/` unverändert. Keine
Kurz-Retro für diese Meta-Session, damit das Studio sauber mit Handbuch 1.0 startet. — Kosten bei
Irrtum: Korrektur-Commits auf main; Rulings der parallelen Prozess-Graph-Session beginnen bei R39.

Entscheider: L0 · Anlass: Session 1.5, Gate Merge

## R39 · 2026-09-30 · Dashboard-Prozessgraph

Ruling: Gate Brainstorming „Prozess-Graph und vereinfachte Organigramm-Kacheln“ bestanden,
Prozessstufe voll — Nutzer hat alle drei Designabschnitte bestätigt; voll, weil das
Telemetrie-Format (ADR-008) um das Event `message` wächst. — Kosten bei Irrtum: eine Spec-Runde
zu viel für eine reine Dashboard-Änderung.

Entscheider: L0 · Anlass: Nutzerauftrag

## R40 · 2026-09-30 · Dashboard-Prozessgraph

Ruling: Nutzer erteilt Zustimmung zu Spec, Plan und Umsetzung im Voraus sowie Commit und Push am
Ende; L0 entscheidet die Gates Spec, Plan und Merge stellvertretend und hält jedes als Ruling fest
— Nutzer will nicht je Gate gefragt werden, die Phasen laufen trotzdem vollständig. — Kosten bei
Irrtum: Nacharbeit nach dem Push, falls ein Gate-Entscheid nicht in seinem Sinn war.

Entscheider: Nutzer · Anlass: Freigabe im Chat

## R41 · 2026-09-30 · Dashboard-Prozessgraph

Ruling: Gate Spec BEDENKEN (lead-tech, lead-qa) → Spec wird ohne Designänderung ergänzt; zusätzlich
filtert P31 stop-only-Knoten auch im Organigramm; Namen stehen in der Persona-Frontmatter
(Headless-Probe: Zusatzfelder werden toleriert) — in echten Sessions sind zwei Drittel der
Agenten-Stopps Fortschritts-Helfer ohne Rolle, die Graph und Organigramm fluten würden. — Kosten
bei Irrtum: ein echter Agent ohne Start-Event verschwindet aus der Übersicht.

Entscheider: L0 · Anlass: Gate Spec

## R42 · 2026-09-30 · Dashboard-Prozessgraph

Ruling: Gate Spec OK nach Einarbeitung aller BEDENKEN (Spec-Commit „docs: Spec Prozess-Graph nach
Gate-Spec-Bedenken"); die zwei Randbefunde des Spec-Autors (Session bleibt nach Neustart
„beendet", stop-only-Knoten in der Chronik) werden als Trivial-Fixes im selben Plan erledigt —
gleiche Datei, gleicher Filter, kein eigener Testaufwand. — Kosten bei Irrtum: Plan wird eine
Aufgabe grösser.

Entscheider: L0 · Anlass: Gate Spec

## R43 · 2026-09-30 · Dashboard-Prozessgraph

Ruling: Gate Plan OK unter Auflage — lead-qa OK, lead-production BEDENKEN (Basis-Drift). Auflage:
lead-tech führt den Plan nach dem Merge von feat/studio-autonomie gegen den dann gültigen main-Stand
nach (inkl. make studio-lint in der DoD je Task), erst dann Budgetfreigabe. Budget 32 Starts an
lead-tech (Parallelität 2) und 1 an lead-qa für das Final-Review, wie im Handbuch für Stufe voll.
Übertragungen: Ü3/Ü4 (dom.js, focus.js, graph.js, graph.py) bestätigt; Ü5 studio-coach heisst
„Coach-Carla / Studio-Coach / 🧭“; Ü6 neue Frontmatter-Felder mit Minor-Versionserhöhung je Persona und CHANGELOG-Eintrag (Handbuch 1.0, Versionierung);
Ü8 Direktor-Titel „Projektleiter“ passend zum neuen Handbuch; Ü11 stop-only-Knoten in den Reitern
Aufwand/Qualität als Beobachtung, nicht in diesem Plan. Paket G hängt am Merge-Paket AUT-merge. —
Nachführen gegen einen noch beweglichen Branch wäre doppelte Arbeit; das Final-Review bleibt vom
Controller unabhängig. — Kosten bei Irrtum: ein zusätzlicher Nachführ-Durchgang des Plans.

Entscheider: L0 · Anlass: Gate Plan

## R44 · 2026-09-30 · Dashboard-Prozessgraph

Ruling: Ad-hoc-Vorfall „inaktiv: web-fetch" wird nicht sofort mit einem Coach-Start behandelt,
sondern in der Session-Retro am Ende dieser Session quittiert — der Agent stammt nicht aus dem
laufenden Auftrag, und ein eigener Coach-Start mitten in der Umsetzung kostet mehr, als er nützt.
— Kosten bei Irrtum: ein hängender Agent bleibt bis Session-Ende sichtbar.

Entscheider: L0 · Anlass: Hook-Hinweis „Ad-hoc-Retro fällig"

## R45 · 2026-09-30 · S16 Wartung

Ruling: Gate Merge S16 bestanden (Messfehler „Vordergrund-Agent ohne Stop-Signal bleibt aktiv"
behoben, Beobachtungen ausgewertet) — Task-Review und Final-Review (opus) OK, `make check` und
`make studio-lint` grün; Merge `--no-ff` statt des vom Lead vorgeschlagenen Rebase (Verfassung §6.3).
— Kosten bei Irrtum: ein Korrektur-Commit.

Entscheider: L0 · Anlass: Ad-hoc-Retro RETRO-S16

## R46 · 2026-09-30 · M5

Ruling: Nächster Meilenstein M5 „Spielerlebnis: Tiefe, Dynamik, Ambiente, Bedienkomfort",
Prozessstufe voll, Start mit Design-Brainstorming (lead-design, L0 als Gesprächspartner) — folgt
direkt aus dem Playtest des Nutzers (docs/beobachtungen.md), daher kein Richtungswechsel und kein
Nutzer-Vorbehalt. — Kosten bei Irrtum: Brainstorming-Aufwand; der Nutzer kann die Richtung
jederzeit per Anweisung ändern.

Entscheider: L0 · Anlass: Plan aus state.md

## R47 · 2026-09-30 · M5

Ruling: Aufstiegsfehler als M5-01 vorgezogen, Prozessstufe leicht, parallel zum Brainstorming —
echter Spiellogik-Fehler (Ware nicht entnommen, halbe Steuer am Buchungstick), unabhängig vom
Design. — Kosten bei Irrtum: keine, der Fix ist in jedem Design nötig.

Entscheider: L0 · Anlass: Auswertung S16-02

## R48 · 2026-09-30 · M5

Ruling: Gate Merge M5-01 bestanden — 5 Regressionstests (vor dem Fix rot), Final-Review opus ohne
Code-Einwände, Doku nachgeführt, Sieg-Tick unverändert 5950, keine Werte in `defs/` geändert,
Save-Format unverändert. — Kosten bei Irrtum: Balancing-Abweichung, fällt im Balancing-Test auf.

Entscheider: L0 · Anlass: Bericht lead-tech M5-01

## R49 · 2026-09-30 · M5

Ruling: Gate Brainstorming M5 bestanden, Ansatz B „je Säule ein starker Hebel" (Tiefe:
Steuerregler; Dynamik: Handelsaufträge und Verkaufssättigung; Ambiente: prozedurale Grafik,
Animation, synthetischer Ton; Bedienkomfort: belegte UI-Befunde und Anzeigen) — einziger Ansatz,
der alle vier Playtest-Punkte trifft. Bedenken zum Umfang akzeptiert mit Auflagen: Spec legt
Datei-Ownership je Strang fest, nennt Kann-Posten mit Streichreihenfolge, Baseline-Neumessung erst
nach M5-01. — Kosten bei Irrtum: M5 dauert länger; Kann-Posten werden gestrichen.

Entscheider: L0 · Anlass: Designvorschlag lead-design (M5-02)

## R50 · 2026-09-30 · M5

Ruling: Rückfragen des Design-Leads wie empfohlen entschieden — ein M5 (keine Aufteilung);
Steuerregler mit 3 Stufen und harter Strafe für „hoch"; nur Verkaufssättigung, Kaufpreise fest;
keine Ereignisse oder Katastrophen in M5; Werkzeugmacher als Kann-Posten, keine Erzkette;
synthetischer Ton standardmässig an mit persistiertem Stumm-Schalter (nur Web Audio, keine
Assets); neue Balancing-Baseline mit Szenario-Tests je Mechanik, Grenze 7500 Ticks bleibt, Marge
unter ~500 Ticks → Kurz-Spec; Dauergewinn aus Verkauf (Holz) als Problem in die Spec. — Kosten bei
Irrtum: einzelne Werte über eine Kurz-Spec nachjustieren.

Entscheider: L0 · Anlass: Rückfragen-Runde Brainstorming M5

## R51 · 2026-09-30 · Studio

Ruling: Werkzeug-Pakete S17-01 (ci.py erfasst Reruns), S17-02 (Phantom-Knoten aus bind) und S17-03
(Budgets je Lead und Phase, Sessions getrennt) werden erst nach dem Merge der Prozess-Graph-Arbeit
umgesetzt — beide Stränge ändern tools/studio/model.py; so gibt es nur einen Merge statt doppelter
Konflikte. — Kosten bei Irrtum: Dashboard zeigt bis dahin Anzeige-Artefakte (in Retros quittiert).

Entscheider: L0 · Anlass: Ad-hoc-Retros CI-Pages, Inaktiv, Budget

## R52 · 2026-09-30 · Dashboard-Prozessgraph

Ruling: Eigenentscheide des Tech-Leads in der Umsetzung bestätigt — neuer Task G-6c (per
`spawned` abgeschlossene Vordergrund-Agenten erzeugen eine Bericht-Zeile, ihre Spur endet dort),
14 CHANGELOG-Einträge statt einem (einer je Persona, wie Dateiformat und `test_docs` verlangen),
Playtests aus einer temporären Worktree-Kopie, weil der Server die Persona-Namen aus dem Hauptrepo
liest (als Beobachtung eingetragen). — Folgen der zwischenzeitlich gemergten Wartung S16 und des
Handbuchs 1.0, nicht des Designs. — Kosten bei Irrtum: ein Doku-Nachtrag im CHANGELOG.

Entscheider: L0 · Anlass: Bericht lead-tech, Paket G

## R53 · 2026-09-30 · Dashboard-Prozessgraph

Ruling: Gate Merge Studio-Graph bestanden — Final-Review (lead-qa, qa-code-reviewer auf opus) OK
ohne hohe Befunde, Nachtrag der niedrigen Punkte 1–3 vor dem Merge erledigt (Fix mit Test,
Spec nachgezogen, Befunde in `docs/beobachtungen.md`), `make check` und `make studio-lint` grün,
`src/`/`tests/` unberührt. Merge durch production-integrator, Push laut Nutzerfreigabe (R40) und
Verfassung §7.2. — Kosten bei Irrtum: Korrektur-Commit auf main.

Entscheider: L0 · Anlass: Gate Merge

## R54 · 2026-09-30 · Retro Studio-Graph

Ruling: Experiment E-001 „Schätzung aus Richtwerten statt Menschenzeit“ angenommen — Muster über
zwei Meilensteine (−93 % bzw. −69 % Abweichung), Änderung ist ein Satz im Handbuch plus
Richtwert-Tabelle, Messung über die vorhandene Metrik. — Kosten bei Irrtum: Rückfall auf den
Stand 723aaee, eine Minor-Version.

Entscheider: L0 · Anlass: Retro Studio-Graph

## R55 · 2026-09-30 · Retro Studio-Graph

Ruling: Experiment E-002 „Datei-Eigentum bei parallelen L0-Sessions“ angenommen, Befund B3
(Meilenstein-Metrik unterscheidet keine Sessions) als Werkzeugfehler an das Paket S17-03 der
Parallel-Session übergeben — R43 hat sich bewährt und wird Regel; B3 liegt in derselben Funktion
wie der Budget-Fix. — Kosten bei Irrtum: ein zusätzlicher Pflichtschritt beim Session-Start.

Entscheider: L0 · Anlass: Retro Studio-Graph

## R56 · 2026-09-30 · M5

Ruling: Gate Spec M5 — lead-tech und lead-qa BEDENKEN (9 + 7 Punkte), kein ZURÜCK; alle Vorschläge
werden in die Spec übernommen (u. a. ganzzahlige Steuerformel, `roadPath` als Sim-Teilpaket S3b,
ADR-010 als Pflicht, reproduzierbare Szenario-Saves für Browser-Checks, Ton per Fake-AudioContext
in Vitest, „hörbar" und Firefox im Nutzer-Playtest); Test-Strategie und Context-Scopes in
CLAUDE.md werden um `src/audio/` ergänzt. Gate gilt als bestanden, sobald beide Prüfer ihre Punkte
in der nachgeführten Spec als erledigt bestätigen. Baseline-Vorlage Sieg-Tick 6050 (gültig nach
Messung in B1), Aufstiegswartezeit „niedrig" 150 Ticks. — Kosten bei Irrtum: eine weitere
Spec-Runde.

Entscheider: L0 · Anlass: Gate Spec M5

## R57 · 2026-09-30 · M5

Ruling: Gate Spec M5 bestanden — Nachprüfung lead-tech OK (9/9 Punkte), lead-qa BEDENKEN niedrig
(7/7 Punkte; zwei Abhängigkeiten zu S5/U1a und ein Hotkey im Szenario-Ablauf werden vor dem Plan in
der Spec nachgetragen). Neue Setzungen übernommen: Münz-Tondrossel 50 ms, `layoutKey` für die
Versorgungsmaske, Paket S5 für Szenario-Saves. Nächster Schritt: Plan durch lead-tech. — Kosten bei
Irrtum: Abhängigkeitsfehler fallen spätestens im Gate Plan auf.

Entscheider: L0 · Anlass: Nachprüfung Gate Spec M5

## R58 · 2026-09-30 · Studio

Ruling: Gate Merge S17 bestanden (CI-Reruns je Versuch, keine Phantom-Knoten aus `bind`, Budgets
und laufender Meilenstein je Session) — opus-Final-Review OK, `make check`/`make studio-lint` grün.
Budget-Vorfall bleibt bei „verbraucht > 1,5 × Freigabe" (Verfassung §10.2: über 50 %), die
abweichende Gegenprobe der Retro war falsch gerechnet. Die veralteten Stellen in STUDIO.md (Budget,
`ci:`-Regel) und lernen.md korrigiert der studio-coach als offensichtlichen Fehler (Handbuch 1.3,
CHANGELOG), ohne Experiment. Parallel-Überschreitung von lead-production (2 statt 1) wird in der
Session-Retro betrachtet. — Kosten bei Irrtum: Budget-Vorfälle kommen später als erwartet.

Entscheider: L0 · Anlass: Bericht lead-production S17

## R59 · 2026-09-30 · M5

Ruling: Gate Plan M5 bestanden unter Auflagen — lead-qa (4) und lead-production (8) BEDENKEN, kein
ZURÜCK; alle Punkte werden vor Umsetzungsbeginn in den Plan eingearbeitet (Render→UI-Abhängigkeit,
`m5-int` gehört lead-tech mit sequenziellen Checks, Final-Review an feste SHAs gebunden, lange
Checks im CDP-Skript, Determinismus mit Spieleraktionen, Merge-Reihenfolge mit Vorprüfung, Wellen
mit frischem lead-tech je Welle). `SELL_FLOOR` bereits in S1 (Abweichung von der Spec) bestätigt.
Budget gestaffelt: Muss-Pakete 45 Starts (lead-tech 33 parallel 3, lead-art 11 parallel 2, lead-qa
1), Kann-Posten +13 erst nach L0-Beschluss. Für M5 gehen Befunde von Arbeitern nur in die
Lead-Berichte; Paket D1 überträgt sie gesammelt nach `docs/beobachtungen.md` (vermeidet Konflikte
über fünf Worktrees; die Pflicht aus Verfassung §3 bleibt inhaltlich erfüllt). — Kosten bei Irrtum:
Befunde erscheinen verzögert im Posteingang.

Entscheider: L0 · Anlass: Gate Plan M5

## R60 · 2026-09-30 · M5

Ruling: Welle 1 abgenommen (S1, S3, U1a, A1 ohne Schiff, A2 — alle Task-Review OK; Sieg-Tick
unverändert 5950). Übernommen aus lead-tech: Auf Touch setzt das Weg-Werkzeug die erste Kachel erst
beim Ziehen bzw. Loslassen (sonst baut der erste Finger einer Zwei-Finger-Geste, AK-U1a-03);
Zeitkappe beim Tastatur-Pan bleibt 1000 ms (engere Kappe bricht AK-U1a-02). Welle 2 startet mit
frischem lead-tech; lead-art wird fortgesetzt (kleiner Kontext). — Kosten bei Irrtum: Touch-Bauen
fühlt sich träger an; Browser-Check in Welle 3 zeigt es.

Entscheider: L0 · Anlass: Berichte Welle 1

## R61 · 2026-09-30 · M5

Ruling: Welle 2 abgenommen (S2, U2, A1-Schiff, A3 — Task-Review OK; Sieg-Tick nach
Verkaufssättigung 6050, wie von der Spec erwartet). Übernommen: S1 früh in `feat/m5-ui` gemergt
(Kompilierbarkeit von Spec 9.4); U2 nutzt den Render-Stand mit Schiff und Overlays;
`isValidOrder` prüft Menge und Prämie nur strukturell, damit alte Spielstände mit laufendem Auftrag
auch nach B1-Wertänderungen laden (Kosten: manipulierte Prämien laden, kein Absturz); A3-Cache-
Schlüssel = Welt-Identität + `layoutKey` + Art (KISS). Auflage für B1: Ändert es die Auftragstakte
(`ORDER_FIRST_TICK`/`PERIOD`/`DURATION`), braucht es eine Save-Migration. — Kosten bei Irrtum:
Nacharbeit in B1.

Entscheider: L0 · Anlass: Berichte Welle 2

## R62 · 2026-09-30 · M5

Ruling: Welle 3 abgenommen (S5, U1b, U2-Fix Review-OK; Browser-Checks U1a, U2, A1, A3 OK).
Übernommen: S5 um die Szenarien `galerie` und `leistung-50` erweitert; U1a-Check parallel zu
S5/U1b; Ton wird bei `pointerup` freigeschaltet (Touch-Kompatibilität, AK-U2-06). Auflage: Arbeiter
laden keine Werkzeuge per `npx`, die nicht in `package.json` stehen (ein Reviewer holte `vite-node`
in den npm-Cache; kein Repo-Schaden) — gehört in jedes Briefing und als Befund in D1. Frame-Zeit
und 390-px-Ansicht zusätzlich im Nutzer-Playtest auf echtem Gerät. — Kosten bei Irrtum: Maus-Ton
startet erst beim Loslassen.

Entscheider: L0 · Anlass: Bericht Welle 3

## R63 · 2026-09-30 · M5

Ruling: Welle 4 abgenommen — alle Muss-Pakete von M5 fertig (U3, B1 Review-OK; Browser-Checks U1b,
U3, B1 OK; AK-A1-04 vollständig). Balancing-Baseline Sieg-Tick 6050 nach Verkaufssättigung
(firstSettler 350, firstCitizen 3850, minMoney 57, Endgeld 212; dreimal gemessen), Grenze 7500
bleibt. Übernommen: U3/B1 parallel mit strikt sequenziellen Checks; B1-Determinismus-Test prüft
Aktionsergebnisse; Verkaufsbutton „−10 · G 38" mit vollem Text im Tooltip; „Liefern" nur bei
aktivem Auftrag; Ton-Hooks direkt nach der Sim-Aktion. Lehre für Playtester-Briefings: jedes
geöffnete Panel auf Lesbarkeit und Überlauf prüfen (erster U3-Check übersah ein gestauchtes Panel).
— Kosten bei Irrtum: Neumessung der Baseline.

Entscheider: L0 · Anlass: Bericht Welle 4

## R64 · 2026-09-30 · M5

Ruling: Kann-Posten — Tag-Nacht-Tönung (A4) und Werkzeugmacher (S4) werden umgesetzt, Träger (A5)
samt Wegsuche (S3b) gestrichen — A4 stärkt Ambiente, S4 Tiefe (beides Playtest-Punkte); A5/S3b ist
der teuerste Posten (7 Starts) und steht zuerst in der Streichreihenfolge. Kein Zusatzbudget: die
freien Muss-Starts (lead-tech 9, lead-art 7) decken A4, S4, die zugehörigen UI-Teile (Tag-Nacht-
Schalter, Hotkey T), deren Checks und D1. — Kosten bei Irrtum: Träger kommen in einen späteren
Meilenstein.

Entscheider: L0 · Anlass: Welle 4 abgeschlossen, Plan „Streichreihenfolge"

## R65 · 2026-09-30 · Studio

Ruling: Tempo-Vorgaben auf Anweisung des Nutzers („dauert zu lange"), gültig ab sofort, bis der
studio-coach sie ins Handbuch überträgt: (1) Echtzeit-Proben höchstens 1 Minute plus ein Lauf bei
4× Tempo (statt 15 Minuten; gilt für AK-B1-03 und künftige Specs); (2) Minor- und Low-Befunde lösen
keine Fix-Runde aus, sie gehen gesammelt ins Final-Review; kleine Fixes (≤ ~20 Zeilen) prüft der
Lead selbst am Diff statt einer vollen Re-Review-Runde; (3) Browser-Checks dürfen parallel laufen
(eigener Port je Check), und jeder Check prüft jedes geöffnete Panel sofort auf Lesbarkeit und
Überlauf; (4) keine neuen Leads je Welle, solange der Kontext reicht — Fortsetzen statt Neustart.
Verfassung §9 bleibt unberührt (unabhängiges Review je Task, Tests, QA-Check je UI-Task,
Final-Review je Meilenstein). — Kosten bei Irrtum: kleine Fehler fallen erst im Final-Review auf.

Entscheider: L0 · Anlass: Anweisung des Nutzers

## R66 · 2026-09-30 · M5

Ruling: Welle 5 abgenommen (S4, U-KANN Review-OK in einer Runde; Browser-Check AK-A4-01 OK,
L(3000)/L(0) = 0.826; Sieg-Tick unverändert 6050). Übernommen: die vier Controller-Rulings aus
`.studio/handoffs/m5-welle-5.md` (S5-Szenarien direkt nach S4; Merge render f81e0c0 vor S4; UI-Kann
in zwei Commits mit einem Implementierer und einem Reviewer per Fortsetzung; Check A4 durch lead-tech).
Die neun Minor-/Niedrig-Befunde gehen nach R65 ohne Fix-Runde in D1 und das Final-Review. Welle 6
(D1 → Final-Review → Gate Merge → Meilenstein-Retro) startet in dieser Session; die Budgets werden
hier neu geloggt (lead-tech Rest 5, lead-qa 2 fürs Final-Review samt einer Nachprüfung,
lead-production 1 für den Integrator). Die vorige Session pausierte wegen Nutzungslimit; ihre
Übergabe stand nur im Chat — L0 führt `state.md` künftig vor jeder Pause nach. — Kosten bei Irrtum:
ein Befund aus Welle 5 fällt erst im Final-Review auf.

Entscheider: L0 · Anlass: Übergabe Welle 5 und Session-Wechsel

## R67 · 2026-09-30 · Studio

Ruling: Antwort des Nutzers auf N-001 umgesetzt — Verfassung 1.0 bestätigt mit zwei Änderungen,
die ab sofort gelten, bis der Verfassungstext (1.1) nach Freigabe `VERFASSUNG ÄNDERN` nachgeführt
ist: (1) **Abhängigkeiten:** Neue Abhängigkeiten (auch Laufzeit) entscheidet L0 selbst per Ruling
und ADR, wenn er die Entscheidung tragen kann und keine Alternative (eigene Umsetzung, vorhandene
Mittel) Sinn macht; sie sind kein Nutzer-Vorbehalt mehr. ADR-001 bleibt der Normalfall
(„keine, ausser begründet"). Der user-scope Hook `dep-guard` wird nicht umgangen: blockt er, meldet
L0 den Paketnamen dem Nutzer zur technischen Freigabe. (2) **Parallelisierung:** Möglichst hoch
parallelisieren und delegieren ist oberstes Arbeitsprinzip von L0 — unabhängige Pakete, Prüfungen
und Vorbereitungen laufen gleichzeitig in mehreren Leads; serielles Arbeiten braucht einen Grund
(Datei-Eigentum, echte Abhängigkeit). Die Parallelitätsgrenzen je Budget sind Richtwerte, keine
Deckel. Verfassung §9 bleibt unberührt. Nachführung: Handbuch und Personas durch den studio-coach,
CLAUDE.md und ADR-001-Nachtrag im Doku-Pass D1. — Kosten bei Irrtum: mehr gleichzeitige Merges,
mehr Koordinationsaufwand.

Entscheider: L0 · Anlass: Antwort des Nutzers auf N-001

## R68 · 2026-09-30 · Studio

Ruling: Nutzungslimit schonen ohne 5-h-Sperre (Anweisung des Nutzers), gültig ab sofort, bis der
studio-coach es ins Handbuch überträgt. (1) **Sensor:** Die Statuszeile von Claude Code erhält
`rate_limits.five_hour.used_percentage`, `seven_day.used_percentage` und
`context_window.used_percentage`; ein Projekt-Statuszeilen-Wrapper ruft das Nutzer-Skript
unverändert auf und schreibt die Werte nach `.studio/limits.json`; der Prompt-Hook gibt sie L0 mit,
das Dashboard zeigt sie (Paket STUDIO-LIMIT). (2) **Ampel 5-h-Fenster:** unter 60 % volle
Parallelität; 60–80 % keine neuen Wellen, nur Laufendes abschliessen, Arbeiter auf sonnet/haiku;
ab 80 % Session-Ende-Routine (state.md zuerst), keine neuen Starts. Wochenfenster über 80 %:
Parallelität halbieren. (3) **Sessiongrösse:** eine Session ≈ ein Meilenstein-Abschnitt (Welle bzw.
Phase); spätestens bei 50 % Kontext von L0 Übergabe über state.md und neue Session. (4)
**Modelle:** opus nur für L0, Final-Review und Gate-kritische Designarbeit; Leads und Arbeiter
standardmässig sonnet, mechanische Arbeiter haiku. — Kosten bei Irrtum: Session endet früher als
nötig.

Entscheider: L0 · Anlass: Anweisung des Nutzers

## R69 · 2026-09-30 · Studio

Ruling: Korrektur von R68 auf Anweisung des Nutzers. (1) **Modelle:** Standard ist opus für alle
Rollen (L0, Leads, Stabsstellen, Arbeiter); keine Einschränkung und kein Downgrade — auch nicht bei
vollem 5-h-Fenster. Die Modellstufen-Tabelle im Handbuch (sonnet/haiku nach Aufgabengrösse) und die
sonnet-Personas werden auf opus umgestellt. R68 (4) entfällt. (2) **Ampel:** Bei steigendem 5-h-
Fenster fährt L0 in eigener Verantwortung langsam herunter — weniger parallel, weniger Starts,
Angefangenes zu Ende bringen, dokumentieren (state.md zuerst), Session beenden. Die Schwellen aus
R68 (60 / 80 %) bleiben Richtwerte, keine starren Grenzen; Sensor (R68 1) und Sessiongrösse (R68 3)
bleiben. — Kosten bei Irrtum: höherer Verbrauch je Session, dafür frühere Session-Enden.

Entscheider: L0 · Anlass: Anweisung des Nutzers

## R70 · 2026-09-30 · M5

Ruling: **Gate Merge M5 bestanden** (Final-Review lead-qa auf opus: OK, kein Muss-Fix; make check grün,
Sieg-Tick 6050, Determinismus 17/17; Report `.studio/qa/M5-FR/report.md`). Merge aller sechs
Stränge nach main über `lead-production`/`production-integrator` laut Plan (Merge-Prüfungen), dann
Push nach §7. Die Kann-Befunde (A-1…A-5, B-F2…B-F9, D-1…D-5) werden nicht vor dem Merge behoben,
sondern direkt danach in einem Sammel-Commit auf main (Labels, Namen, Doku; ohne Verhaltensänderung,
Lead prüft am Diff nach R65) zusammen mit dem Übertrag nach `docs/beobachtungen.md` — ein Durchgang
statt zwei, und kein Konflikt mit feat/m5-sim. B-F1 (Autosave nach Reload) wird Beobachtung und
Eingabe für die M6-Auswahl. — Kosten bei Irrtum: ein Label-Fehler steht kurz auf main.

Entscheider: L0 · Anlass: Bericht Final-Review M5

## R71 · 2026-09-30 · Studio

Ruling: Korrektur von R69 (1) auf Klarstellung des Nutzers — R69 hatte „Standard opus" zu weit
ausgelegt. **Modellwahl nach Aufgabe:** Jede Rolle bekommt das Modell, das zu ihrer Aufgabe passt
(wieder die Stufen von Handbuch 1.4: opus für Architektur, Design, Gates, Final-Review und L0;
sonnet für spezifizierte Umsetzung, Task-Reviews, Playtests, Integration; haiku für mechanische
Prüfungen). **Kein Limit-Downgrade:** Ein näher rückendes Nutzungslimit ist nie ein Grund, ein
weniger fähiges Modell zu wählen; stattdessen fährt L0 herunter (R69 (2) bleibt). Die Umstellung
der Personas auf opus (83d3f77) wird zurückgenommen. — Kosten bei Irrtum: keine über 1.4 hinaus.

Entscheider: L0 · Anlass: Klarstellung des Nutzers

## R72 · 2026-09-30 · M6

Ruling: **M6 = K-B „Krisen und Stadtdienste"** (Brand/Feuerwache, Sturm mit Vorwarnung, Marktboom;
seed-deterministisch je Periode), K-C „Vierte Stufe und Veredelung" als Kandidat für M7, K-A
„Zweite Insel" ins Backlog (erst gekoppelt an K-C sinnvoll). Krisen im neuen Spiel standardmässig
„normal", der Balancing-Test läuft mit „aus" bitgleich (6050) plus eigener Krisen-Lauf. Die Spec
startet sofort parallel zum M5-Abschluss (berührt nur `docs/superpowers/specs/`). Auflage aus der
Selbstprüfung (BEDENKEN): Die Spec muss zeigen, dass jede Krise eine echte Abwägung erzeugt —
der Sturm nicht nur „Lagerpuffer immer lohnend", sondern im Zusammenspiel mit Aufträgen und Boom;
Krisenhäufigkeit als Einstellung und Playtest-Frage. Tausch K-B/K-C, falls der Nutzer-Playtest
nach M5 vor allem „nach dem Sieg passiert nichts" meldet. Kandidaten:
`.studio/handoffs/m6-kandidaten.md`. — Kosten bei Irrtum: Spec-Arbeit für einen später
getauschten Meilenstein.

Entscheider: L0 · Anlass: Bericht lead-design M6-PREP (D-M6-01)

## R73 · 2026-09-30 · Programm

Ruling: Auslegung des Nutzer-Playtests „spielt sich gut, viel Luft nach oben — mehr Tiefe, bessere
Grafik, Ambiente, Musik, die Stimmung muss rüberkommen": Das ist kein Richtungswechsel (Genre,
Titel und Kernsäulen bleiben), sondern ein Programm in **zwei parallelen Strängen**.
(1) **Stimmung** wird neuer Meilenstein **M7 „Stimmung"** (Grafik, Licht und Wetter, Umgebungsklang,
Musik, UI-Anmutung), Prozessstufe voll. Designvorschlag und Art Direction führt `lead-art`, das
Gate Brainstorming prüft `lead-design` (Spielgefühl), danach Spec. Erstmals sind offen
lizenzierte Fremd-Assets ausdrücklich im Scope (ADR-006, Verfassung §4, Veto
`art-license-checker`); prozedural bleibt der Rückfall. (2) **Tiefe** läuft über M6 „Krisen und
Stadtdienste" (R72) weiter; K-C „Vierte Stufe und Veredelung" rückt auf M8. Umsetzungsreihenfolge
entscheidet das Gate Plan nach Datei-Ownership: Sim-Anteile von M6 dürfen parallel zu M7 laufen,
Render- und Audio-Anteile von M6 (Brand, Sturm) bauen auf der M7-Art-Direction auf. Weil der
Nutzer die Stimmung betont, hat M7 bei Konflikten in `src/render/` und `src/audio/` Vorrang.
Der Spielstand des Nutzers wird, sobald er vorliegt, als Playtest-Datenbasis an beide Leads
gegeben. — Warum: Der Auftrag nennt beide Achsen gleichwertig; getrennte Meilensteine halten
Specs prüfbar und erlauben Parallelarbeit. — Kosten bei Irrtum: Spec-Arbeit an zwei Strängen
statt einem; Umordnung beim Gate Plan möglich.

Entscheider: L0 · Anlass: Nutzer-Playtest nach M5

## R74 · 2026-09-30 · M6

Ruling: Die sechs offenen Designentscheide aus `.studio/handoffs/m6-spec.md` werden nach
Empfehlung des Design-Leads entschieden: (1) Controller nach `tests/sim/controller.ts`, Nachweis
Baseline 6050; (2) Krisen-Lauf mit eigener Grenze 9000 und `money > 0`, Istwerte werden gemessen;
(3) `FIRE_OUTAGE` 200 für alle Gebäude, Playtest-Frage; (4) Sturm trifft alle Rohstoffbetriebe,
Playtest-Frage; (5) migrierte v2-Spielstände mit Krisen `off`; (6) Ereignis-Log nur in der UI.
Zusätzlich zu R72: Die Spec benennt, welche Krisen-Darstellung (Feuer, Rauch, Sturm, Regen,
Warnung) sie von M7 bezieht, statt eigene Grafik festzuschreiben. — Warum: Empfehlungen sind
durch `m6-werte.md` gedeckt, KISS. — Kosten bei Irrtum: Wert-Anpassung nach Playtest.

Entscheider: L0 · Anlass: Übergabe M6-SPEC

## R75 · 2026-09-30 · Studio

Ruling: Vorschläge der Retro M5 (`retros/2026-09-30-meilenstein-m5.md`): (1) **E-001 angepasst**,
Hauptgrösse Werkzeugaufrufe, Minuten abgeleitet, Kopfzeile nennt die Tabellenzeile, Schwelle ±50 %
über ≥ 10 Agenten in M6/M7; (2) **E-003 angenommen** (Zweck-Gegenprobe bei Auslegungen), damit drei
laufende Experimente; (3) ohne Experiment: kein Report-Dateipfad für Final-Review und Playtests;
Edit/Write-Regel gilt für Code und Code-nahe Mehrzeiler, reine Textgenerierung in Doku per Skript
ist ausgenommen; `log.py result --package` als Pflicht **nach** dem Merge von STUDIO-LIMIT
(gleiche Pfade `tools/studio/`), dann als eigenes Paket. (4) Aufräumen der gemergten
M5-Worktrees und lokalen Branches (`feat/m5-audio`, `-render`, `-sim`, `-sim-queries`, `-ui`);
`test/m5-int` ist nicht gemergt und bleibt (§6). Umsetzung Handbuch durch `studio-coach`,
Aufräumen durch `lead-production`. — Warum: Datenbasis der Retro, offensichtliche Fehler. —
Kosten bei Irrtum: eine Handbuch-Version zurücknehmen.

Entscheider: L0 · Anlass: Retro M5

## R76 · 2026-09-30 · Studio

Ruling: Gate Merge STUDIO-LIMIT **zurückgestellt** (lead-qa BEDENKEN): Fix-Runde durch lead-tech
für Befund 1 (fehlende/kaputte/veraltete Messung zeigt „Limit: nicht gemessen" in Dashboard und
Hook-Zeile, mit Test) und Befund 2 (Zeitstempel > now + 60 s verwerfen, mit Test); danach
Nachprüfung nur dieser Stellen durch lead-qa. Befund 3 (niedrig) und der Nachtrag STUDIO.md
„in Arbeit" gehen nach dem Merge von M5-NACHLESE bzw. STUDIO-LIMIT nach `docs/beobachtungen.md`
bzw. ins Handbuch. — Warum: Verfassung §8.3 verlangt „nicht gemessen"; ein stummer Sensor ist
schlimmer als keiner. — Kosten bei Irrtum: eine kurze Fix-Runde.

Entscheider: L0 · Anlass: Bericht lead-qa STUDIO-LIMIT

## R77 · 2026-09-30 · M7

Ruling: **Gate Brainstorming M7 „Stimmung" bestanden mit Auflagen** (lead-design BEDENKEN, kein
ZURÜCK). Entscheide von lead-art angenommen: lebendiges Top-down (ADR-003 bleibt), Grafik
prozedural, fremde Assets für Musik, Umgebungsklang und OFL-Schrift, kompaktes mobiles HUD in M7
(M6-Kann „mobil" gestrichen), Musik standardmässig an (0.5 × Master). Auflagen für die Spec:
(1) **Vertical Slice zuerst** — erstes Render-Paket: Terrain, Wasser mit Küste, 3 Gebäudetypen,
Schatten, Abendlicht; Vorher/Nachher auf denselben Ausschnitten wie die Ist-Screenshots; L0,
lead-art und lead-design urteilen, der Nutzer bekommt die Bilder im Bericht (nicht blockierend).
Überzeugt der Slice nicht, öffnet ein Ruling fremde CC0-Terrain-/Gebäudegrafik gezielt für die
schwachen Posten; die Spec nennt diese Tür. (2) Frame-Budget ≥ 30 fps bei 390 px, ganze Insel,
Zoom 0.5, Sturm aktiv; statische Terrain-Ebene gecacht; Tönung höchstens einmal je Frame;
Obergrenzen für Figuren und Partikel, „Bewegung reduzieren" senkt sie. (3) Lesbarkeit: 13 Typen
bei Zoom 1, Kategorien bei Zoom 0.5; Farbabstandscheck Dach/Signalrot und Abendlicht/Warnorange;
Signale ungetönt nach dem Licht. (4) Musik erst nach erster Interaktion; Stumm und Regler über die
Einstellungs-Migration erhalten. — Warum: Zweck-Gegenprobe (E-003): Der Nutzerzweck „Stimmung
muss rüberkommen" hängt an der Ausführung, der Slice macht das früh prüfbar. — Kosten bei Irrtum:
ein Slice-Paket, das bei Misserfolg in fremde Grafik umgelenkt wird.

Entscheider: L0 · Anlass: Gate-Bericht lead-design

## R78 · 2026-09-30 · Programm

Ruling: Nutzeranweisung „generell desktop first. auf dem handy ist es momentan unspielbar" gilt
als Dauerregel für Inselreich und ersetzt hier „Mobile-first" aus `../CLAUDE.md`: **Zielplattform
ist Desktop** (Maus, Tastatur, Fensterbreite ab 1280 px). Folgen: (1) M7 streicht das kompakte
mobile HUD (R77) und misst das Frame-Budget auf Desktop (Referenz 1920×1080, ganze Insel, Sturm
aktiv, ≥ 60 fps angestrebt, ≥ 30 fps Untergrenze); UI-Anmutung wird für Desktop entworfen.
(2) M6 enthält keine Mobil-Posten. (3) Browser-Checks prüfen Desktop-Breiten (1280 und 1920);
schmale Fenster nur noch als „stürzt nicht ab, nichts Wesentliches unerreichbar", keine
Mobil-Optimierung. (4) Mobile Spielbarkeit ist kein Ziel; der Befund „unspielbar auf dem Handy"
kommt nach `docs/beobachtungen.md`, kein Folgeissue. Personas `tech-ui-engineer` und
`qa-playtester` sowie Projekt-CLAUDE.md werden angepasst. — Warum: ausdrückliche Anweisung des
Nutzers; Mobil-Aufwand fliesst in Stimmung und Tiefe. — Kosten bei Irrtum: späteres
Mobil-Paket, falls der Nutzer das Handy doch will.

Entscheider: L0 · Anlass: Nutzeranweisung

## R79 · 2026-09-30 · M5

Ruling: **Gate Merge M5-NACHLESE bestanden** (Stufe leicht): `fix/m5-nachlese` @ fa58ada, Review
(opus) nach Nachprüfung OK, make check grün, nur Texte, Kommentare und Testnamen. Die
Grenzüberschreitung in `CLAUDE.md` (eine Zeile „Test-Strategie", vom Auftrag D-5 verlangt) wird
nachträglich genehmigt. Merge seriell durch `production-integrator`, danach Push. — Warum:
Befunde gesichert, keine Verhaltensänderung. — Kosten bei Irrtum: ein Text-Commit.

Entscheider: L0 · Anlass: Bericht lead-tech M5-NACHLESE

## R80 · 2026-09-30 · Studio

Ruling: **Gate Merge STUDIO-LIMIT bestanden** (lead-qa OK nach Fix-Runde R76, make check grün,
Browser-Check 1280×800). Merge seriell nach M5-NACHLESE durch `production-integrator`. Danach:
Handbuch „Limits und Sessiongrösse" von „in Arbeit" auf „in Betrieb" (Coach), Paket
`log.py result --package` (R75) wird frei, Restbefunde (Gelb-Text, veraltete Werte nicht
abgeschwächt, leere Statuszeile ohne `$CLAUDE_PROJECT_DIR`, Frische 600 s vs. 1 h, kein JS-Test für
`renderLimits`) nach `docs/beobachtungen.md`. Der Sensor wirkt erst in der Session nach dem Merge.
— Warum: Befunde behoben und nachgeprüft. — Kosten bei Irrtum: gering, nur `tools/studio/`.

Entscheider: L0 · Anlass: Nachprüfung lead-qa STUDIO-LIMIT

## R81 · 2026-09-30 · M6/M8

Ruling: (1) M6-Spec (`docs/m6-spec` @ 87d58e2, 75 Abnahmekriterien) geht ins **Gate Spec**,
Prüfer lead-tech und lead-qa parallel. (2) Tiefe-Empfehlung von lead-design angenommen: nichts aus
K-C in M6 holen, dafür **M8 „Vierte Stufe und Veredelung" zeitlich vorziehen** — die M8-Spec
beginnt nach dem Gate Spec von M6, der M8-Sim-Strang folgt direkt auf den M6-Sim-Strang, parallel
zu den Render-Paketen von M7. Zeigt der Spielstand des Nutzers Tick > 8000 oder „nach dem Sieg ist
nichts los", bekommt M8 Vorrang vor M6. (3) Integrationszweig `test/m6-int` und U1 vor M7 in
`settings.ts`/`hud.ts`/`style.css` (Spec §20, Punkte 5 und 7) entscheidet das Gate Plan. —
Warum: M6 bringt Entscheidungsdichte, Fortschrittstiefe fehlt; der Nutzer verlangte beides. —
Kosten bei Irrtum: Spec-Arbeit M8 früher als nötig.

Entscheider: L0 · Anlass: Bericht lead-design M6-SPEC

## R82 · 2026-09-30 · M6/M7

Ruling: **Gate Spec M6 bestanden mit Auflagen** (lead-tech BEDENKEN, lead-qa BEDENKEN, kein
ZURÜCK). Auflagen an lead-design (Spec-Nachtrag vor dem Plan): (1) Schnittstelle an M7 §6.5/§11.3
angleichen — M7 zeichnet Feuer, Warnring, Boom und Wetter über `RenderFx` und liefert die Töne
`alarm`/`stormWarning`/`boom`; M6-R1 schrumpft auf die Abbildung `crisisFx(view)` plus
Verdrahtung im UI-Strang; AU1, AU0, R0 entfallen; Rauch-Nachlauf (D2) und „Gelöscht" (D3) mit
lead-art klären; Umgebungsklang-Eingang `fire` (0…1) in U3. (2) QA-Befunde 1–6 einarbeiten:
Determinismus über Speichern/Laden im Controller-Lauf `normal` mitten in Brand und Sturm; feste
Sollfolge für Seed 3 (`s f s b f f f s b s f b`); Negativfall je Ladeprüfung; messbare Kriterien
statt „sichtbar/unterscheidbar" oder lead-art als Urteiler; Vitest „Krisen nach dem Sieg".
Vorentscheide fürs Gate Plan (beide Specs): (a) **Sim-Strang M6 (S1–S4, B1, B2) geht nach eigenem
Gate Merge direkt auf main** (verhaltensneutral, Krisen standardmässig `off` in `createWorld`
bis zur Verdrahtung), damit M8 darauf aufbaut; `test/m6-int` nur für UI und Verdrahtung.
(b) **Ein gemeinsamer, serieller UI-Strang** für M6 und M7: M7-U2 → M6-U1/M7-U1 nach Freiwerden →
M6-U2 → M6-U3. (c) **Frame-Messung** für M6 und M7: sichtbares Chrome, Frames über 10 s per CDP
zählen, Median von 3 Läufen, Desktop 1920×1080. — Warum: vermeidet Doppelarbeit und
Datei-Konflikte zwischen M6 und M7; macht Abnahme messbar. — Kosten bei Irrtum: Umordnung im Plan.

Entscheider: L0 · Anlass: Gate-Berichte lead-tech und lead-qa M6-SPEC

## R83 · 2026-09-30 · M7

Ruling: **Gate Spec M7 bestanden unter Auflage mit Nachprüfung** (lead-tech BEDENKEN B1–B5,
lead-qa BEDENKEN 1–8, kein ZURÜCK). Spec-Nachtrag durch lead-art vor dem Gate Plan, danach prüft
lead-qa nur die geänderten Stellen (Muster R76). Muss: QA 1 (AK-R3-01 mit Spec-Werten
unerfüllbar — Luma-Regel oder Wetterfaktoren anpassen), QA 2 (Kontrast Tinte auf Signalrot
≥ 4,5 : 1), QA 3 / Tech B4 (**gemeinsames Einstellungsformat** `inselreich.settings` für M6 und
M7: jede `parseSettings`-Fassung erhält fremde Felder; gemeinsamer Round-trip-Test mit
`crisisLevel` und Bussen, egal wer zuerst liefert), QA 4 (Vitest SHA-256 für jede Datei unter
`public/`), Tech B1 (Aufwand der Spaziergänger unabhängig von `timeMs`, mit Test), Tech B3
(Slice R1 ohne `app.ts`: `scale` optional mit DPR, Teil-Neuzeichnung über `layoutKey`-Cache),
Tech B5 (R82 einarbeiten: AU1/R0 weg, Frame-Messung nach R82(c), Rauch-Nachlauf in M6-UI, R2
`blocked-by` M6-S2). Kann als Plan-Auflage: Tech B2 (Terrain gröberes Raster + Interpolation,
vorskalierte Kopie bei Zoom ≤ 0,5), R1 in R1a/R1b teilen, QA 5–8. ADR-011 (Asset-Laden,
formatneutral) schreibt lead-tech als Plan-Deliverable vor A2. — Warum: ein unerfüllbares
Kriterium und eine Datenkollision mit M6 dürfen nicht in den Plan. — Kosten bei Irrtum: eine
kurze Nachtragsrunde.

Entscheider: L0 · Anlass: Gate-Berichte lead-tech und lead-qa M7-SPEC

## R84 · 2026-09-30 · M7

Ruling: **Gate Spec M7 bestanden** (Nachprüfung lead-qa OK, `docs/m7-spec` @ 2c11a9f). Rest-Auflage
fürs Gate Plan: Der M6-Plan verweist bei den Einstellungen auf M7 AK-U1-01b (Durchreichen fremder
Felder). Plan M7 startet jetzt parallel zum Plan M6-Sim; er umfasst die M7-Pakete und den
gemeinsamen seriellen UI-Strang nach R82(b) inklusive der M6-UI-Pakete und der
Krisen-Verdrahtung, sobald die M6-Spec nachgezogen ist. ADR-011 (Asset-Laden) als Deliverable
vor A2. — Warum: Spec prüfbar, Konflikte mit M6 aufgelöst. — Kosten bei Irrtum: keine besonderen.

Entscheider: L0 · Anlass: Nachprüfung lead-qa M7-SPEC

## R85 · 2026-09-30 · M6/M7

Ruling: M6-Spec-Nachtrag (`docs/m6-spec` @ ab536d1, 77 AK) angenommen; die drei Widersprüche zu
M7 (M6-Spec §20, Punkte 10–12) nach Empfehlung von lead-design entschieden: (10) M7 §9.4 „nur
neues Format schreiben" gilt nur für die eigenen M7-Felder; fremde Felder werden durchgereicht;
M7-U1 übernimmt den gemeinsamen Round-trip-Test (M6 AK-U1-10 = M7 AK-U1-01b). (11) M6-R2
(`overlays.ts`) läuft nach M7-R1. (12) M7 exportiert `EXTINGUISHED_TICKS`, M6 importiert es.
Die Specs werden nicht mehr geändert; beide Pläne übernehmen diese Punkte. — Warum: vermeidet
eine weitere Spec-Runde, Punkte sind klein und eindeutig. — Kosten bei Irrtum: Umordnung im Plan.

Entscheider: L0 · Anlass: Bericht lead-design M6-SPEC-Nachtrag

## R86 · 2026-09-30 · M8

Ruling: **Gate Brainstorming M8 „Vierte Stufe und Veredelung" bestanden mit Auflage**
(Selbstprüfung lead-design BEDENKEN). Entscheide 1–5 nach Empfehlung: (1) Stufe 4 (Kaufleute)
erst nach dem Sieg, `citizens()` zählt Bürger und höher; (2) zweites Ziel „Handelsstadt" bei 60
Kaufleuten, Rückfallwert 40; (3) Glashütte mit zwei Inputs (Stein, Holz), Streichvariante ein
Input; (4) Lauf bis zum zweiten Ziel mit Grenze 12 000 Ticks, `balance.test.ts` bitgleich 6050;
(5) nach dem zweiten Ziel Sandbox ohne Geldsenke. (6) „Steuer hoch dominiert im Endzustand" nach
`docs/beobachtungen.md`, Kandidat für eine Kurz-Spec nach M8. Auflage (Zweck-Gegenprobe E-003,
Nutzerzweck „mehr Tiefe"): Die Belohnung darf nicht erst jenseits einer typischen Sitzung kommen —
die Spec zeigt das neue Ziel schon vor dem Sieg sichtbar an (Vorschau der Stufe 4) und nennt einen
messbaren Hebel samt Playtest-Frage, falls der erste Kaufmann im Szenario später als Minute 16
kommt (z. B. Freischaltung an eine Bürgerzahl statt an den Sieg). Die M8-Sim-Pakete sind
blocked-by M6-S4/M6-B1. — Warum: Fortschrittstiefe nach dem Sieg war die festgestellte Lücke. —
Kosten bei Irrtum: Wert-Anpassung nach Playtest.

Entscheider: L0 · Anlass: Designvorschlag lead-design M8

## R87 · 2026-09-30 · M6/M7/M8

Ruling: **Gate Plan M6-Sim bestanden mit Auflagen** (lead-qa OK mit Hinweisen, lead-production
BEDENKEN). Plan-Nachtrag durch lead-tech vor Umsetzungsstart: (1) Baseline-Schritt Task 2: weicht
die Messung von 0xbfeac8c6 bzw. den Referenzwerten ab → Stopp und Bericht, nie übernehmen;
(2) Reviews benennen Tests, die schon vor der Umsetzung grün sein dürfen; (3) SHA-Erlaubnis für
M7 streichen — M7-R2-FW, M6-R2 und M6-U1 sind **blocked-by M6-Sim-Merge auf main** (kein
ungeprüfter Sim-Code über M7, R82a); (4) Parallelität zählt alle L2-Starts inkl. Reviewer;
(5) Task 8 trägt Befunde nicht im Branch in `docs/beobachtungen.md` ein, sondern meldet sie, L0
trägt sie nach dem Merge auf main ein; Worktree-Aufräumen per Ruling durch lead-production;
(6) Satz „jeder spätere Branch enthält die früheren" korrigieren. Nachtrag zu R86: **M8-Sim ist
blocked-by M6-Sim-Merge auf main** (statt M6-S4/B1). Ausnahmen des Plans (Zeile in
`scenarios.ts` durch S2, eigene `describe('M6 …')`-Blöcke) genehmigt. Budget der Umsetzung
(17 Starts, Parallelität 2: 16 lead-tech, 1 lead-qa) wird zu Beginn der Umsetzungs-Session
freigegeben. — Warum: kritischer Pfad sauber, keine Datei-Kollision mit M8. — Kosten bei Irrtum:
M7-R2-FW und der UI-Strang warten länger auf M6.

Entscheider: L0 · Anlass: Gate-Plan-Berichte lead-qa und lead-production

## R88 · 2026-09-30 · M7

Ruling: Plan M7 (`docs/m7-spec` @ 7c504e9, 18 Tasks, ADR-011) angenommen zur Vorlage im Gate Plan
(nächste Session, Prüfer lead-qa und lead-production). Entscheide: (1) **lead-art steuert Render,
Audio und Assets** (Handbuch Umsetzungszyklus, Spec §13) und legt dafür die Personas
`art-rendering-engineer` und `art-audio-engineer` an (Onboarding über lead-production); lead-tech
steuert UI-Strang und Integration. (2) M6-R2 (`overlays.ts`) wird im M7-Render-Strang geplant und
budgetiert, der M6-Sim-Plan führt es nicht. Setzungen des Plans (Kachelgrenzen-Band 0,25,
Warnring-Haltephase 0,5 s, Sand als `coast`, `.badge--boom` aus M7-U2) angenommen; das
Slice-Urteil klärt die Spannung I1 gegen ¼-Kachel-Regel. Budgetantrag 64 Starts (lead-art 41/4,
lead-tech 23/1, lead-qa 1/1) wird im Gate Plan geprüft und je Session-Welle freigegeben. —
Warum: Fachnähe der Steuerung, Datei-Ownership eindeutig. — Kosten bei Irrtum: Umhängen von
Paketen zwischen Leads.

Entscheider: L0 · Anlass: Bericht lead-tech M7-PLAN

## R89 · 2026-09-30 · Studio

Ruling: Vorschlag der Kurz-Retro 664ac8d3 angenommen (kein neues Experiment, Messregel zu E-001):
Folgeaufträge per `SendMessage` mit neuem Paket nennen in der ersten Zeile Paket und Schätzung;
die Auswertung zählt sie dazu. Das Addieren in `metrics.py` wird ein eigenes Paket für
lead-production (zusammen mit `log.py result --package`, R75). — Warum: 9 von 10 Agenten wurden
fortgesetzt; ohne die Regel misst E-001 nicht die Schätzgüte. — Kosten bei Irrtum: eine Zeile
mehr je Folgeauftrag.

Entscheider: L0 · Anlass: Kurz-Retro Session 664ac8d3

## R90 · 2026-09-30 · M9

(Ursprünglich als R82 in der parallelen Session 01HkLmgZ geschrieben; wegen Nummernkollision beim
Zusammenführen umnummeriert.)

Ruling: Nutzeranweisung „nächster Meilenstein: die Welt wird grösser und schöner, Fokus auf
grafische Elemente und Stimmung; festhalten für später, wenn keine andere Session läuft" wird als
**M9 „Weite Welt"** vorgemerkt (M8 ist durch R81 belegt). Inhalt (Richtung, keine Spec): grössere
Karte und mehr Inseln, reichere Grafik (Gebäude, Terrain, Wasser, Vegetation, Figuren) und
Stimmung auf dem Niveau-Ziel Anno 1602; baut auf dem M7-Vertical-Slice auf. Pflichtfragen fürs
Brainstorming: Zeichentechnik (Canvas 2D reicht? sonst WebGL als eigener Render-Strang mit ADR),
Frame-Budget bei grosser Karte (Chunk-Caching, Culling), Asset-Grösse im Repo (ggf. Git LFS),
Hosting bleibt GitHub Pages bis Verkauf, Online-Funktionen oder Desktop-App. **Start erst, wenn
keine andere L0-Session läuft** (Tabelle „Parallele Sessions" in state.md leer bzw. nur
„übergeben") und M7 abgeschlossen ist; bis dahin kein Paket, kein Budget. Lead: lead-art, Prüfer
lead-design und lead-tech. — Warum: ausdrückliche Anweisung des Nutzers; Parallelbetrieb mit M6–M8
würde render/ doppelt belegen. — Kosten bei Irrtum: keine, nur Vormerkung.

Entscheider: L0 · Anlass: Nutzeranweisung

## R91 · 2026-10-01 · M7-ISO

Ruling: Auslegung „ich möchte isometrische Grafiken" als **Wechsel der Darstellung auf Isometrie**
(2:1-Rautenkacheln, feste Blickrichtung ohne Drehen, Gebäude mit Höhe und Tiefensortierung — wie
Anno 1602), umgesetzt **im Render-Strang von M7** als Spec-Nachtrag „M7-ISO", nicht als eigener
Meilenstein. ADR-003 wird durch ein neues ADR abgelöst (Status „ersetzt"). Ablauf: Brainstorming
lead-art mit lead-tech (Projektion, Trefferprüfung Maus→Kachel, Zeichenreihenfolge, Footprints,
Kamera-Grenzen, Bauvorschau) → Spec-Nachtrag im Branch `docs/m7-spec` → Gate Spec (lead-tech,
lead-qa) → Render-Tasks im M7-Plan überarbeiten → Gate Plan. Audio-, UI- und Asset-Stränge von M7
bleiben unverändert; der Slice-Stopp mit Vorher/Nachher-Bildern an den Nutzer bleibt und zeigt das
erste isometrische Bild. `src/sim/` bleibt unberührt (ADR-002); M6-Sim und M8 sind nicht betroffen;
M9 baut auf dem isometrischen Slice auf. — Warum: Der M7-Render-Plan (R1a Terrain, R1b/R2 Sprites)
setzt auf Draufsicht; ihn so zu bauen und danach umzubauen wäre doppelte Arbeit. ADR-003 hat
Isometrie ausdrücklich als späteres Upgrade mit isoliertem Renderer vorgesehen. — Kosten bei
Irrtum: Meinte der Nutzer nur schräg gezeichnete Sprites auf dem Quadratgitter, kostet der
Nachtrag rund eine Session und verzögert M7 entsprechend.

Zweck der Anweisung: Spiel soll nach Anno 1602 aussehen (Stimmung, R73/R90); Auslegung widerspricht
ihm nicht, weil die Rautenprojektion der Kern dieses Looks ist.

Entscheider: L0 · Anlass: Nutzeranweisung

## R92 · 2026-10-01 · M7-ISO

Ruling: (1) Task R0-ISO darf ausnahmsweise die Kamera-Aufrufe in `src/ui/input.ts` und
`src/ui/app.ts` ändern (Wegfall `clampCamera`/`TILE`, `zoomAt` in Kacheln); die Plan-Überarbeitung
regelt die Datei-Ownership gegenüber dem UI-Strang (R0-ISO vor M7-U2/U0-ISO). (2) Die M5-Tests
`ship.test.ts` (Schiffsplatz) und `camera.test.ts` (Kamera-Schritt) werden bewusst geändert; der
Review prüft, dass nur diese Erwartungen und nur aus Projektionsgründen wechseln. — Warum: Ohne (1)
bleibt `make check` nach R0-ISO rot und das Spiel zwischen den Paketen unspielbar; (2) folgt
zwingend aus ADR-012 (vorderes Wasserfeld, Kamera in Kacheln). — Kosten bei Irrtum: ein
Ownership-Konflikt mit dem UI-Strang, behebbar durch Reihenfolge im Plan.

Entscheider: L0 · Anlass: Bericht lead-art M7-ISO

## R93 · 2026-10-01 · M7-ISO

Ruling: Zu Gate Spec M7-ISO (Urteil lead-qa BEDENKEN): (1) R92 Punkt 2 wird erweitert — alle vier
Tests in `tests/render/camera.test.ts` dürfen geändert werden, sofern die Spec eine Zuordnung
alt → neu führt (Clamp und Zoom/NaN → AK-ISO-04, Rundreise → AK-ISO-01, Schritt → AK-ISO-03) und die
alte Abdeckung (Zoomstufen 0,5/0,75/1,1/1,33/1,7/2, gebrochener Versatz, n 0–63, beide Achsen)
erhalten bleibt. (2) Slice-Stopp: Das Slice-Urteil fällt L0 nach QA; die Vorher/Nachher-Bilder
gehen dem Nutzer direkt zu. R2–R4 starten erst nach dem L0-Urteil. Eine Reaktion des Nutzers hat
Vorrang und kann R2–R4 stoppen; ein Warten auf sie gibt es nicht (Verfassung §5). (3) Das
Firefox-Risiko (Spec 15.2) wird hingenommen: Grenzwert nur in Chrome, eine Firefox-Messung zur
Orientierung ohne Grenzwert. — Warum: (1) Projektion ändert jede Kamera-Erwartung, Abdeckung muss
bleiben; (2) Autonomie-Regel, der Nutzer sieht das Ergebnis trotzdem vor dem Grossteil der Arbeit;
(3) Zielplattform Desktop-Chrome/Edge reicht für den Slice. — Kosten bei Irrtum: (2) bei Ablehnung
durch den Nutzer bis zu einem bereits gestarteten Render-Task verworfen.

Entscheider: L0 · Anlass: Gate Spec M7-ISO, lead-qa

## R94 · 2026-10-01 · M7-ISO

Ruling: R92 Punkt 1 wird erweitert — R0-ISO darf in `src/ui/app.ts` zusätzlich eine Zeile im
Dev-Zweig ergänzen, die `?raster=1` als `RenderFx.raster` setzt. — Warum: Raster wird für
AK-ISO-13/-20, AK-R1-09 und I1 schon im Slice gebraucht, die Dev-Parameter kommen sonst erst mit
M7-U1; eine Zeile ist die kleinste Lösung. — Kosten bei Irrtum: ein Merge-Konflikt von einer Zeile
mit M7-U1.

Entscheider: L0 · Anlass: Nacharbeit lead-art Gate Spec M7-ISO

## R95 · 2026-10-01 · M7-ISO

Ruling: **Gate Spec M7-ISO bestanden** (`docs/m7-spec` @ 65f4813; lead-tech BEDENKEN → erledigt,
lead-qa Zweitprüfung OK; 21 AK-ISO). Im Gate Plan gilt als gesetzt: M7-U2 läuft parallel zu R0-ISO,
der UI-Strang macht `git merge main` nach dem R0-ISO-Merge und vor U0-ISO (Tech B8; ersetzt die
Reihenfolge „R0-ISO vor M7-U2" aus R92). Nächster Schritt: lead-tech überarbeitet die Render-Tasks im
M7-Plan (neu R0-ISO als 2 Tasks, U0-ISO; R1a–R5, M6-R2 nach Spec §13), nimmt die Plan-Themen aus
Spec §16 und die Hinweise 1–4 der QA-Zweitprüfung auf; danach Gate Plan für den ganzen M7-Plan
(lead-qa, lead-production). — Warum: alle Auflagen beider Prüfer nachweislich erledigt; M7-U2
berührt `input.ts`/`app.ts` nicht. — Kosten bei Irrtum: Nacharbeit im Plan, keine im Code.

Entscheider: L0 · Anlass: Gate Spec M7-ISO

## R96 · 2026-10-01 · M7 Gate Plan

Ruling: **Gate Plan M7: Nacharbeit** (lead-qa BEDENKEN 5 Punkte, lead-production BEDENKEN 11 Punkte,
kein ZURÜCK). Gesetzt: (1) **Budget 78** = lead-art 49/4, lead-tech 27/**2**, lead-qa **2**/1;
Rundungsregel: Summe der Anteile = Formelsumme, Rest an den grössten Anteil, kein Anteil unter
aufgerundetem Eigenwert; M7-U2 Teil B und R1c zählen als eigene Pakete. Freigabe je Session-Welle;
Merge-Starts lead-production (Docs-, Zwischen-, Schluss-Merge) je 1, ausserhalb der Formel.
(2) **Zwischen-Merge R0-ISO** mit eigenem Gate Merge (Prüffragen wie Meilenstein-Gate, Basis:
opus-Review über die ganze R0-ISO-Strecke + QA-R0 + `make check`), Merge des abgenommenen SHA mit
`--no-ff`, **mit Push**: Pages zeigt bis zum Meilensteinende das isometrische Spiel mit
Platzhaltern (bis U0-ISO alter Bau-Anker); README/arc42 beschreiben bis D1 die Draufsicht — beides
hingenommen. (3) Das **Final-Review des Meilensteins** diffed ab dem Stand vor R0-ISO (Hash aus
QA-VORHER), R0-ISO wird voll mitgeprüft (Verfassung §9.5). (4) Alle Merges zwischen Strängen und
nach main nur auf abgenommene SHAs (`git merge --no-ff <sha>`), Vorprüfung mit `git merge-tree`.
(5) **Welle 0** vor Welle 1: Commit 42f11a1 im Branch `docs/m7-spec` zurücknehmen, Eintrag auf main
übertragen, dann Docs-Merge `docs/m6-spec` und `docs/m7-spec` nach main (lead-production).
(6) QA-SLICE wiederholt die Vorher-Messung direkt vor der Nachher-Messung unter gleicher Last.
(7) Offene Plan-Punkte 1–6 angenommen mit den Auflagen der Prüfer (QA 2–5: Vitest Baumstempel in
R1a, Nachmessung nach R1c, Helfer-Kopien in `scenarios-iso.ts`, QA-VORHER-Zentrierung; Prod 4,
7, 8, 10). (8) Personas `art-rendering-engineer` und `art-audio-engineer` werden in dieser Session
auf main angelegt (lead-production). (9) Slice-Stopp: L0 prüft beim nächsten Session-Start eine
Reaktion des Nutzers auf die Bilder, bevor R2–R4 weiterlaufen (ergänzt R93). — Warum: alle
Auflagen sind Plantext, keine Spec-Änderung; Push des Zwischenstands hält main und Pages gleich und
das Spiel ist nach AK-ISO-20 spielbar. — Kosten bei Irrtum: (2) einige Tage öffentlicher
Platzhalter-Look; (1) 2 Starts zu viel freigegeben.

Entscheider: L0 · Anlass: Gate Plan M7 (lead-qa, lead-production)

## R97 · 2026-10-01 · M7 Budget

Ruling: R96 Punkt 1 wird korrigiert: **Budget M7 = 80** (lead-art 49/4, lead-tech **29**/2,
lead-qa 2/1). Mit M7-U2 Teil B als eigenem Paket ergibt der lead-tech-Anteil 22 × 1,3 = 28,6 → 29;
die Regel aus R96 („kein Anteil unter aufgerundetem Eigenwert") geht vor der genannten Summe. Der
Plan führt 80 statt 78. — Warum: Regel und Zahl müssen übereinstimmen, sonst wiederholt sich der
Rundungsfehler aus R88. — Kosten bei Irrtum: 2 Starts zu viel freigegeben, nur bei Bedarf genutzt.

Entscheider: L0 · Anlass: Nacharbeit Gate Plan M7, lead-tech

## R98 · 2026-10-01 · M7 Gate Plan

Ruling: **Gate Plan M7 bestanden** (`docs/m7-spec` @ 66bce31, `docs/m6-spec` @ 38cc084; lead-qa
Zweitprüfung OK, Auflagen lead-production erledigt). Angenommen wird die Präzisierung von R96
Punkt 3 durch lead-qa: Final-Review je Strang `git diff $(git merge-base main <sha>) <sha>`, die
R0-ISO-Strecke getrennt `git diff <Hash QA-VORHER> <SHA R0-ISO>`, beide mit `-- src/sim` leer.
Nächster Schritt: Welle 0 (lead-production), danach Welle 1 mit Freigabe je Welle. — Warum: alle
Auflagen nachweislich erledigt; die Präzisierung erfüllt die Absicht von R96 (R0-ISO voll geprüft)
ohne fremde Änderungen aus main mitzuzählen. — Kosten bei Irrtum: keine im Code.

Entscheider: L0 · Anlass: Gate Plan M7

## R99 · 2026-10-01 · M6-Sim D-M6-02

Ruling: Stopp B2 (Krisenlauf `normal` Seed 3 Sieg 8250 > 8000; Ursache: Feuerwache des
Test-Controllers deckt die Produktion nicht, alle 4 Brände ausserhalb Radius 8). Entscheid:
(1) Der Test-Controller setzt die Feuerwache an eine plausible Spielerposition — Mitte der
Produktion, sodass die Produktionsgebäude im Radius liegen; **kein Spielwert ändert sich**, nur
Testcode. Die Platzierung wird im Test begründet kommentiert; lead-design bestätigt in einem
Kurz-Urteil (kein Spec), dass sie Spielerverhalten abbildet und nicht nur den Test bestehen
lässt. (2) Neu messen. Sieg ≤ 8000 → B2 weiter ins Review. Sieg weiter > 8000 → Stopp bleibt,
dann Kurz-Spec durch lead-design (Spec 15). (3) B2-Schritte 6–10 (Szenarien) dürfen parallel
fertiggestellt werden. (4) Plan-Rulings lead-tech übernommen (vorab grüne Schutz-Tests AK-S1-09
`off`, AK-S1-10-Invariante, AK-S2-05; Merges `--no-ff` auf geprüfte SHAs). — Warum: Die Ursache
ist die Bot-Strategie, nicht das Balancing; eine Kurz-Spec vorab kostet eine Runde ohne
Erkenntnisgewinn. — Kosten bei Irrtum: Testspiel wird geschönt und verdeckt eine zu harte
Krise; abgefangen durch das lead-design-Urteil und die Grenze 9000.

Entscheider: L0 · Anlass: Zwischenbericht lead-tech M6-SIM

## R100 · 2026-10-01 · M7 Gate Merge R0-ISO

Ruling: **Gate Merge Zwischen-Merge R0-ISO bestanden** für `feat/m7-render` @ `7039ddd`
(opus-Review über `aa1d058..7039ddd` OK ohne blockende/hohe Befunde; QA-R0 OK, AK-ISO-20 6/6,
Konsole fehlerfrei; `make check` am SHA grün, 298 Tests; `git merge-tree` konfliktfrei; Diff
`src/sim` leer; L0 hat die QA-Bilder gesichtet). production-integrator mergt `--no-ff 7039ddd`
nach main und pusht (R96). Danach setzt lead-production ADR-012 auf „akzeptiert" und ergänzt dort
die Konsequenz „alle vier Kamera-Tests und `ship.test.ts` geändert" (Befund lead-art). Hingenommen:
In Task 1 und A1 fehlte der Schritt „Tests zuerst rot"; die Reviewer haben die Tests per
eingebautem Fehler geprüft — Hinweis an studio-coach für die Session-Retro. arc42/CLAUDE.md
(Draufsicht) folgen mit D1 (R96). — Warum: alle Bedingungen aus R96 Punkt 2 erfüllt. — Kosten bei
Irrtum: Pages zeigt bis R2 Platzhalter-Blöcke statt der bisherigen Sprites; Revert des
Merge-Commits jederzeit möglich.

Entscheider: L0 · Anlass: Bericht lead-art Welle 1

## R101 · 2026-10-01 · M6-Sim Baseline Krisenlauf

Ruling: lead-design-Urteil **PLAUSIBEL** zur Feuerwache des Test-Controllers (`[kx+10, ky-8]`,
Regel „max. Produktionsabdeckung Radius 8", Messung Seed 3: off 6050, normal 7050, mild 6250).
Baseline angenommen. Auflagen für B2 vor dem Review: (E1) Kommentar in `tests/sim/controller.ts`
begründet den Gleichstand mit der Bau-Reihenfolge (Norden zuerst) statt „kleinstes y" und nennt die
Abhängigkeit: mit dem Spiegelplatz `[kx+10, ky+8]` läge der Sieg vermutlich > 8000 — kein
Probelauf verlangt; (E2) Spec M6 §15 nachführen (Wachenposition, Abdeckung „Kapelle, Produktion
Nord; Schule und Holzfäller ungedeckt") als `docs:`-Commit im Branch `feat/m6-balance`; (E3)
Beobachtung „Krisenlauf `mild` knapp (minMoney 13, Endgeld 40)" trägt L0 auf main ein. — Warum:
Bot-Verhalten ist spielerplausibel und eher benachteiligt; die Spiegelplatz-Abhängigkeit ist
dokumentiert statt versteckt. — Kosten bei Irrtum: Balancing-Grenze wird bei der nächsten
Werteänderung früher sichtbar (gewollt).

Entscheider: L0 · Anlass: Kurz-Urteil lead-design M6-B2

## R102 · 2026-10-01 · M6-Sim Gate Merge

Ruling: Final-Review M6-Sim BEDENKEN (kein Blocker). **Gate Merge bestanden unter Auflage**: vor
dem Merge ein Fix-Durchgang lead-tech auf `feat/m6-balance` mit (1) `docs/arc42.md` §5/§6/§8 um
Krisen (`crises.ts`, `defs/crises.ts`, Krisenschritt im Tick, Zustand `burning`) nachführen, (2)
README: Feuerwache in Bauleiste und Anleitung, mit Satz „wirkt nur bei eingeschalteten Krisen",
(3) `balance-crises.test.ts`: Grenze Sieg ≤ 8000 für normal und mild festnageln, (4) Kommentar
`controller.ts:44-55` nach R101 E1 korrigieren. Kurze Nachprüfung durch lead-qa (Fortsetzung),
dann Merge seriell `feat/m6-sim` → `feat/m6-sim-queries` → `feat/m6-balance` durch
production-integrator mit Push. Befunde 5, 6 und die zwei ausserhalb des Scopes trägt L0 als
Beobachtung ein; Tooltip-Zeile „ohne Wirkung, solange Krisen aus sind" geht als Hinweis an den
UI-Strang (M6-U1). Die Feuerwache wird nicht ausgeblendet (Spec 1, R82a). — Warum: Doku auf main
muss den Tick-Ablauf richtig beschreiben, bevor M8 darauf aufbaut; (3)/(4) sind Minuten-Fixes im
selben Themenbereich. — Kosten bei Irrtum: ein Fix-Durchgang mehr.

Entscheider: L0 · Anlass: Final-Review lead-qa M6-Sim

## R103 · 2026-10-01 · M6-Sim Gate Merge

Ruling: **Gate Merge M6-Sim vollzogen** (Auflage R102 erfüllt, Nachprüfung lead-qa OK): seriell
`--no-ff` `feat/m6-sim` @ a324c7b → b0d53b4, `feat/m6-sim-queries` @ a7e9e18 → b86e668,
`feat/m6-balance` @ bb5e4a7 → 5e0135f; Übergabe `.studio/handoffs/m6-sim-gate-merge.md`.
**Plan-Rulings des Strangs übernommen:** (1) Ausnahme B: genau eine Zeile
`put(w, 'firestation', kx + 13, ky + 1)` in `tests/sim/scenarios.ts` (S2). (2) M6-Tests in eigenen
`describe('M6 …')`-Blöcken, Testname beginnt mit AK-/RF-Nummer (42 AK-Nummern abgedeckt). (3)
v2-Fixture `tests/sim/fixtures/save-v2.json` auf main 3fcb678 über einen temporären, wieder
gelöschten Test erzeugt (Task 1a). (4) Befunde ausserhalb Scope gesammelt im Bericht statt im
Branch (R87 5). (5) Vor der Umsetzung grün erlaubt zusätzlich AK-S1-09 Fall `off`, AK-S1-10
Invariante, AK-S2-05 (R99 4). (6) Merges zwischen Strängen `--no-ff` auf geprüfte SHAs (R96 4).
(7) B2-Abweichungen (Review OK): AK-B2-04 prüft Geld als `money + stats.upkeep`; `runColony` setzt
die Gebäudezählung vor dem Zählen zurück. **Balancing (AK-B2-03, Spec 15):** Krisen-Lauf-Baseline
Seed 3: **normal 7050** (minMoney 56, Endgeld 211; Brände 4, davon gelöscht 3, leer 0; Stürme 3;
Booms 1; Trefferquote h 1,0; Feuerwache des Test-Controllers auf `[kx + 10, ky − 8]` nach
R99/R101), **mild 6250** (minMoney 13, Endgeld 40; Brände 1, gelöscht 0, leer 0; Stürme 2; Booms
1; h 1,0; keine Wache). Die `off`-Baseline 6050 (Fingerabdruck 0xbfeac8c6) und die Grenzen 9000
(Test) bzw. 8000 (Stopp-Schwelle, seit R102 im Test festgenagelt) bleiben. Mit dem Spiegelplatz
`[kx + 10, ky + 8]` läge normal vermutlich über 8000 (nicht gemessen). Messweg:
`VITE_BALANCE_LOG=1 npx vitest run tests/sim/balance-crises.test.ts --silent=false --reporter=verbose`.
Frei werden damit (R87 3): M7-R2-FW, M6-R2, M6-U1, M8-Sim. — Warum: geprüfter Stand, Auflagen
erfüllt; die Baseline macht Krisen-Balancing zum Regressionsschutz. — Kosten bei Irrtum:
seed-abhängige Krisen treffen die Kippkante `minMoney` 57 (mild knapp, R101 E3); bei Irrtum
Neumessung.

Entscheider: L0 · Anlass: Gate Merge M6-Sim

## R104 · 2026-10-01 · M7 Slice-Urteil

Ruling: **Slice-Urteil M7: OK** (QA-SLICE `test/m7-slice` @ 179dd65 = main + R1b `f77b83c` + U0-ISO
`83f8333`; AK-ISO-17 OK, R1c nicht nötig). Messauslegungen angenommen: D-M7-I1 nach Ersatzmass
(Konflikt mit ¼-Regel AK-R1-02); D-M7-FOAM Schaumkern 0,85–1 / 0,07 Kachel; I5-Ecke ohne
Kronenpixel. Bilder an den Nutzer gesendet; nach R93/R96 prüft die nächste Session zuerst eine
Nutzerreaktion, dann R2 ∥ R3, M7-U2 Teil B, M6-R2, M6-U1. — Warum: alle Muss-AK bestanden,
Abweichungen sind Wortlaut-Konflikte der Spec. — Kosten bei Irrtum: Nacharbeit in R2.

Entscheider: L0 · Anlass: Bericht lead-art Welle 1b/1c
