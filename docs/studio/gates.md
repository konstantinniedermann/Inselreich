# Gates

> Aufbau nach CCGS director-gates (MIT), siehe [herkunft.md](herkunft.md). Auf Deutsch neu
> formuliert und auf Inselreich zugeschnitten.

Ein Gate ist eine Prüfung, bevor Arbeit in die nächste Phase geht. Prüfende Leads geben ein Urteil
ab; **entscheiden tut immer L0** und hält den Entscheid als Ruling in [rulings.md](rulings.md) fest.
Die festen Regeln, die Asset- und Lizenzregeln und die nicht abschwächbare Qualitätssicherung stehen
in der [Verfassung](VERFASSUNG.md) (§3, §4, §9); kein Gate schwächt sie ab.

## Ablauf eines Gates

1. L0 startet die prüfenden Leads (parallel, Hintergrund erlaubt) mit einem Briefing nach
   [templates/briefing.md](templates/briefing.md): `Paket: <id>-gate-<name>`, Verweis auf den
   Gate-Abschnitt hier, Kontextdateien. Das Paket steht auf `review`
   (`log.py package … --status review`).
2. Jeder Lead prüft selbst (kein Arbeiter nötig) und antwortet mit Urteil und Begründung:
   - **OK** — kann weiter.
   - **BEDENKEN [Liste]** — kann weiter, wenn die Punkte behoben oder bewusst akzeptiert werden.
   - **ZURÜCK [Grund]** — Vorlage muss überarbeitet werden, bevor es weitergeht.
3. L0 entscheidet: alle OK → weiter; BEDENKEN → Punkte an den Autor oder akzeptieren (Ruling
   nennt, welche und warum); ein ZURÜCK → zurück an den Autor, ausser L0 überstimmt es mit
   ausdrücklicher Begründung im Ruling.
4. Ruling schreiben (`Ruling: Gate <name> <id> bestanden — <warum> — <Kosten bei Irrtum>`),
   Paketstatus nachführen.

In der Prozessstufe **leicht** fallen Gate Brainstorming, Spec und Plan zu einem Gate zusammen
(Abschnitt [Kombiniertes Gate (Stufe leicht)](#kombiniertes-gate-stufe-leicht)). Gate Merge gibt es
in beiden Stufen genau einmal je Meilenstein bzw. Auftrag.

## Gate Brainstorming

Prüft: `lead-design` (`opus`) · Domäne: Spielerlebnis, Scope

**Auslöser:** Der Design-Lead hat mit superpowers:brainstorming einen Designvorschlag erarbeitet
(L0 war Gesprächspartner) und legt ihn im Bericht vor; das Urteil gibt er als Selbstprüfung mit
ab. L0 prüft dieselben Fragen selbst.

**Kontext:** Designvorschlag (Bericht), `docs/superpowers/specs/2026-09-29-inselreich-design.md`
(Abschnitt „Ziel": Säulen und Erfolgskriterium), `README.md` (Spielanleitung), `docs/beobachtungen.md` (bekannte Befunde),
Nutzer-Auftrag.

**Prüffragen:**

1. Stärkt der Vorschlag die Säulen des Spielerlebnisses (Insel besiedeln, Produktionsketten
   aufbauen, Bevölkerung versorgen und aufsteigen lassen, Wirtschaft über Steuern und Handel) oder
   schwächt er eine davon? Welche Säule leidet, wenn er misslingt?
2. Ist der Spielerzweck in einem Satz sagbar, und merkt der Spieler den Unterschied im ersten
   Spiel von 15 Minuten?
3. Ist der Scope klar begrenzt (was ausdrücklich nicht)? Passt er in einen Meilenstein bzw. in die
   gewählte Prozessstufe?
4. Übernimmt der Vorschlag nur Mechaniken, keine fremden Inhalte, Namen oder Marken (ADR-006,
   [Verfassung §4](VERFASSUNG.md#4-asset--und-lizenzregeln))?
5. Gibt es eine einfachere Variante mit demselben Spielerlebnis (KISS, YAGNI)?

**Urteile:** OK / BEDENKEN [Liste] / ZURÜCK [Grund] → Entscheidung L0 + Ruling.

## Gate Spec

Prüfen: `lead-tech` (`opus`, Machbarkeit, Save-Format) · `lead-qa` (`opus`, Testbarkeit)

**Auslöser:** Design-Lead hat die Spec unter `docs/superpowers/specs/` fertig und meldet sie.

**Kontext:** die Spec, `docs/arc42.md`, betroffene ADRs (`docs/adr/`), `src/sim/types.ts`,
`src/sim/save.ts`, `src/sim/defs/`, `tests/sim/balance.test.ts`.

**Prüffragen `lead-tech`:**

1. Ist die Spec mit der bestehenden Architektur umsetzbar (`src/sim` DOM-frei und deterministisch,
   Aktionen liefern `{ ok, reason }`, Spielwerte nur in `src/sim/defs/`)? Braucht es ein ADR?
2. Ändert sich der Welt-Zustand? Wenn ja: Ist eine neue Save-Version mit Migration und Test für
   alte Spielstände vorgesehen?
3. Bleibt die Simulation deterministisch (Zufall nur über den seeded RNG, keine Uhrzeit, keine
   Reihenfolge aus Objekt-Iteration über unsortierte Quellen)?
4. Braucht die Spec eine neue Laufzeit-Abhängigkeit? (Dann Nutzer-Vorbehalt: Eintrag in die
   [Warteschlange](warteschlange.md) laut Verfassung §5, nicht Gate.)

**Prüffragen `lead-qa`:**

1. Ist jedes Abnahmekriterium prüfbar — als Vitest-Test oder als beschriebener Browser-Check?
2. Welche Kriterien berühren den Balancing-Test? Sind bewusste Wertänderungen als Ruling vorgesehen?
3. Sind Randfälle genannt (leeres Lager, Abriss während Produktion, Laden alter Spielstände)?
4. Sind die AK eindeutig (R136)? Kennungen, die auch in anderen Specs vorkommen, listet
   `s=<spec>; for k in $(grep -o 'AK-[A-Z0-9]*-[0-9]*' "$s" | sort -u); do n=$(grep -lw -- "$k" docs/superpowers/specs/*.md | wc -l); [ "$n" -gt 1 ] && echo "$k $n"; done`.
   Jeder Verweis auf ein altes AK trägt den Meilenstein (`M7:AK-U2-02`); alte Specs werden nicht
   umnummeriert. Widerspricht ein AK-Wortlaut der Prosa derselben Spec?

**Urteile:** OK / BEDENKEN [Liste] / ZURÜCK [Grund] → Entscheidung L0 + Ruling.

## Gate Plan

Prüfen: `lead-qa` (`opus`, Review- und Testabdeckung) · `lead-production` (`opus`, Budget,
Ownership, Parallelität)

**Auslöser:** Tech-Lead hat den Plan unter `docs/superpowers/plans/` samt Budgetantrag
([templates/budgetantrag.md](templates/budgetantrag.md)) fertig.

**Kontext:** Plan, freigegebene Spec, Budgetantrag, [state.md](state.md) (laufende Stränge).

**Prüffragen `lead-qa`:**

1. Hat jeder Task einen Test-first-Schritt oder einen benannten Browser-Check?
2. Ist je Task ein Review durch `qa-code-reviewer` und je UI-Task ein Check durch `qa-playtester`
   eingeplant? Ist das Final-Review auf `opus` vorgesehen?
3. Deckt der Plan Determinismus (gleicher Seed → gleicher Zustand) und Save-Kompatibilität ab,
   wo die Spec sie berührt?

**Prüffragen `lead-production`:**

1. Hat jede Datei genau einen Owner-Strang? Gibt es Überschneidungen zwischen parallelen Worktrees?
2. Stimmt der Budgetantrag mit der Formel (`Pakete × 2 + QA-Checks + 1 Final-Review`, + 30 %) und
   passt die Parallelität zu den Strängen?
3. Sind Abhängigkeiten zwischen Paketen (`blocked-by`) vollständig und in einer machbaren
   Reihenfolge?

**Urteile:** OK / BEDENKEN [Liste] / ZURÜCK [Grund] → Entscheidung L0 + Ruling, danach
Budgetfreigabe (`log.py budget`) und Pakete anlegen (`log.py package`).

## Kombiniertes Gate (Stufe leicht)

Prüfen: `lead-qa` (`opus`, Testbarkeit, Review- und Testabdeckung) · **L0 selbst** (Ownership,
Budget, Abhängigkeiten) · bei **Folgepaketen** (Handbuch, Prozessstufen; R129) zusätzlich und
parallel `lead-tech` mit den Prüffragen des Gates Spec gegen den Spec-Teil des einen Dokuments
Spec+Plan. Auf BEDENKEN folgt eine Nacharbeit ohne Zweitprüfung; eine Zweitprüfung nur bei einem
blockierenden Punkt oder ZURÜCK. Der Tech-Lead prüft seinen eigenen Plan nicht; der Design-Lead liefert zum
Kurzdesign seine Selbstprüfung nach den Fragen des Gates Brainstorming mit.

**Auslöser:** Kurzdesign (Bericht `lead-design`) und Plan (Bericht `lead-tech`: Pakete,
Datei-Ownership, Budgetantrag) liegen vor; bei Folgepaketen das eine Dokument Spec+Plan.

**Kontext:** beide Berichte, betroffene Dateien laut Plan, `tests/sim/balance.test.ts`,
[state.md](state.md).

**Prüffragen `lead-qa`:**

1. Ist jedes Abnahmekriterium des Kurzdesigns prüfbar (Vitest-Test oder beschriebener
   Browser-Check), und hat jedes Paket einen Test-first-Schritt oder Browser-Check?
2. Ist je Paket ein Review durch `qa-code-reviewer`, je UI-Paket ein `qa-playtester`-Check und am
   Schluss ein Review auf `opus` über die ganze Branch eingeplant?
3. Berührt der Auftrag den Balancing-Test, Determinismus oder das Save-Format? Wenn ja: Ist das
   abgedeckt — oder gehört der Auftrag in die Stufe voll?

**Prüffragen L0 (aus dem Plan):**

1. Hat jede Datei genau einen Owner, und genügt ein Worktree?
2. Stimmt der Budgetantrag mit der Formel, und sind die Abhängigkeiten zwischen Paketen vollständig?
3. Bleibt der Auftrag leicht (≤ 1 Session, ≤ 3 Pakete, keine Architekturänderung; Folgepaket: ein
   Strang, kein Save-Format, keine Architekturänderung)? Sonst hochstufen.

**Urteile:** OK / BEDENKEN [Liste] / ZURÜCK [Grund] → Entscheidung L0 + Ruling, danach
Budgetfreigabe und Pakete anlegen.

## Gate Merge

Prüfen: `lead-qa` (`opus`, Final-Review, CI) · `lead-art` (`opus`, nur wenn Assets betroffen:
Lizenzen, CREDITS)

**Auslöser:** Alle Pakete **aller** Stränge des Meilensteins sind abgenommen; der QA-Lead hat das
Final-Review in einer Session über alle Strang-Branches gegen `main` gemacht (kombinierter Diff bzw.
jeder Strang-Diff). Es gibt **ein** Merge-Gate je Meilenstein, nicht eines je Strang. In der Stufe
leicht ersetzt das abschliessende `opus`-Review des Tech-Zyklus das Final-Review (dieses Review
gilt als Final-Review im Sinn von Verfassung §9.5); L0 prüft dann die
Fragen von `lead-qa` selbst anhand dieses Reviews und des Tech-Berichts. Ohne Final-Review auf dem
stärksten Modell über alle Stränge gibt es kein Merge-Gate; diese Pflicht ist nicht abschwächbar
([Verfassung §9](VERFASSUNG.md#9-nicht-abschwächbare-qualitätssicherung)).

**Kontext:** Diffs aller Strang-Branches gegen `main`, Final-Review-Bericht, Ausgabe von `make check`,
`docs/CREDITS.md`, `docs/licenses/`, Doku-Änderungen (README, `docs/arc42.md`, ADRs).

**Prüffragen `lead-qa`:**

1. Ist `make check` grün (lint, Tests inkl. Balancing-Test, studio-test, build)?
2. Hat das Final-Review keine offenen ZURÜCK-Punkte? Sind BEDENKEN behoben oder als Ruling bzw. in
   `docs/beobachtungen.md` festgehalten?
3. Sind README (Bedienung, Spielwerte) und arc42 (Module, Tick-Ablauf, Persistenz) nachgeführt?
4. Keine Secrets, OWASP-konform, Commit-Konvention eingehalten?

**Prüffragen `lead-art` (nur bei Assets; Grundlage [Verfassung §4](VERFASSUNG.md#4-asset--und-lizenzregeln)):**

1. Hat jedes neue Asset unter `public/` eine Zeile in `docs/CREDITS.md` mit Quelle, Autor, Lizenz,
   Link und Prüfvermerk von `art-license-checker`?
2. Liegt der Lizenztext in `docs/licenses/`? Ist keine Lizenz aus der Negativliste dabei?
3. Ist die Gesamtgrösse der Assets vertretbar?

**Urteile:** OK / BEDENKEN [Liste] / ZURÜCK [Grund] → Entscheidung L0 + Ruling, danach Auftrag an
`lead-production`: `production-integrator` merged die Stränge seriell, mit `make check` nach jedem
Merge.
