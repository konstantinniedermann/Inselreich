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
