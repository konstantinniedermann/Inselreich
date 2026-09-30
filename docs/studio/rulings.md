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
