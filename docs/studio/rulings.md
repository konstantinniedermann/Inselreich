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
