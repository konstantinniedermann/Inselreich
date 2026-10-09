# Vorlage: Briefing

Für jede Delegation (L0 → L1, L1 → L2). Die Kopfzeilen stehen ganz oben im Prompt, weil die
Telemetrie die ersten 400 Zeichen liest. Hauptgrösse der Schätzung sind die Werkzeugaufrufe; die
Kopfzeile nennt die verwendete Zeile aus `metriken/richtwerte.md` (Experiment E-001). Regeln: [STUDIO.md](../STUDIO.md), „Briefing-Standard";
dort auch die Pflichtzeilen je Auftragsart (Persona-Änderung, Messauftrag, Hotfix, CI-Prüfung, Integrator).
Der Block „Feste Regeln" steht wörtlich so in [VERFASSUNG.md §3](../VERFASSUNG.md#3-feste-regeln)
und wird unverändert kopiert.

```text
Persona: <rolle>
Paket: <id>
Meilenstein: <id> (oder „ohne")
Schätzung: <m> Tools, <n> min (Tabellenzeile: <Rolle> <Modell> <Plan-Art> × <Starts>)   (ganzer Auftrag inkl. aller Unteraufträge; Tools aus docs/studio/metriken/richtwerte.md, Minuten ≈ Tools ÷ 6, nicht Menschenzeit)
Modell: <opus|sonnet|haiku> (nur nennen, wenn abweichend von der Persona; dann auch im Agent-Aufruf)
Budget: <n Starts / Parallelität k> (nur für Leads; Arbeiter: „keins, keine Agenten starten")
Prozessstufe: <leicht|voll>

1. Persona und Expertise: <wer du bist, welche Erfahrung zählt hier>
2. Ziel: <ein Satz> — Warum fürs Spielerlebnis: <ein Satz>
3. Kontext (nur diese Dateien lesen): <pfad>, <pfad>
4. Deliverable: <was> unter <ablageort>   (Final-Review und Playtests: kein Report-Dateipfad, der Schlussbericht ist der Report)
5. Definition of Done: <prüfbare Punkte, z. B. Test grün, make check grün>
   Pflichtzeilen je Paketart (R375): jedes Paket mit Budget „Mehrbedarf vor dem Überschreiten melden (templates/budgetantrag.md), nie nachträglich“;
   Werkzeug-Paket „make studio-test grün; Echtlauf gegen jede externe API (gh, CI, Pages), Ausgabe im Bericht“;
   Änderung an Experimenten, Handbuch oder Personas „make studio-test grün (u. a. höchstens 3 Experimente laufend)“;
   Paket mit `src/`-Änderung (R392, E-052) „vor Task 1 die Zeiten der berührten bestehenden Tests auf main messen (`npx vitest related --run <geplante src-Dateien>`), Tests > 200 ms mit Zeit in den Plan; Abnahme: dieselben Dateien auf main und Branch unmittelbar nacheinander, kein bestehender Test > 500 ms oder > +50 %, Zeiten vorher/nachher im Bericht“;
   jedes Paket mit `.ts`-Änderung „schnelle Make-Prüfungen ohne Testlauf: `npx tsc --noEmit`, `make lint`, `make zeittests`, `make conflicts` Exit 0 (Vitest prüft keine Typen, R398, R410)“;
   jedes Paket mit neuen Tests „Rot-Beleg: je neuem Testfall die rote Ausgabe vor dem Fix im Task-Bericht; Commit-Reihenfolge allein genügt nicht (R395, R410)“;
   „Entfällt eine Vorbedingung, nennt die Abnahme die Fehlerrichtung und belegt, dass das abhängige Gate erfüllbar bleibt (R395)“;
   Plan-Paket „Format nach E-010: Index plus Task-Dateien ≤ 10 KB (R417)“;
   jedes Paket mit Doku-Commit „`make docs-check` Exit 0 vor dem Commit (Übergang bis TOOL-PRETTIER-HOOK, R417)“;
   jedes Paket mit Plan „Prüfschritte des Plans (z. B. Task-Reviews) nicht zur Budgetersparnis streichen — Mehrbedarf melden“
6. Grenzen und Datei-Ownership: darfst ändern <pfade>; nicht ändern <pfade>; Worktree <pfad>; Umsetzer: Doku-Dateien (D1: README, arc42, ADR, Spec-Verweise) des Plan-Tasks sind ausdrücklich erlaubt (E-017)
7. Schnittstellen: <von wem kommt Input, wer nutzt das Ergebnis, Übergabe unter .studio/handoffs/…>
8. Logging-Pflicht: siehe Block „Logging"

(Block „Feste Regeln" wörtlich aus VERFASSUNG.md §3)
Feste Regeln (unverändert, gelten immer):
- Neue Abhängigkeiten nur mit ADR und Ruling des Projektleiters, und nur wenn keine Alternative Sinn macht; den Hook `dep-guard` nie umgehen. Assets sind keine Dependencies.
- `src/sim` DOM-frei, Zufall nur über den seeded RNG.
- Save-Format versionieren; ältere Spielstände müssen nicht ladbar sein. Ein inkompatibler Spielstand wird mit Hinweis abgewiesen, nie ein Absturz; Test für das Abweisen.
- Tests grün, Balancing-Test bleibt Regressionsschutz, bewusste Änderungen als Ruling.
- Befunde ausserhalb Scope nach `docs/beobachtungen.md`, keine Folgeissues ohne Nutzer-OK.

Git: kein Rebase (auch kein `pull --rebase`), kein reset --hard, kein Force-Push; main per Merge holen (Verfassung §6.3).

Logging (jeweils als eigener Bash-Aufruf):
- Start:     python3 tools/studio/log.py status --role <rolle> --status active --task "<auftrag>" --package <id>
- Delegiert: python3 tools/studio/log.py status --role <rolle> --status delegated --package <id>   (nur Leads)
- Ergebnis:  python3 tools/studio/log.py result --role <rolle> --package <id> --worker <arbeiter> --outcome <angenommen|nacharbeit|verworfen> --review-rounds <n>   (nur Leads, einmal je abgenommenem Arbeitsergebnis)
- Wartet:    python3 tools/studio/log.py status --role <rolle> --status waiting --task "<worauf>" --package <id>
- Blockiert: python3 tools/studio/log.py status --role <rolle> --status blocked --task "<grund>" --package <id>
- Fertig:    python3 tools/studio/log.py status --role <rolle> --status done --summary "<ergebnis>" --package <id>
- Abbruch:   python3 tools/studio/log.py status --role <rolle> --status failed --summary "<grund>" --package <id>

Bericht (≤ 15 Zeilen, docs/studio/templates/bericht.md):
Ergebnis · Entscheidungsbedarf mit Empfehlung · Risiken · Befunde ausserhalb Scope · Budget verbraucht/frei · Aufwand · Status
```

## Beispiel

```text
Persona: tech-sim-engineer
Paket: M5-02
Meilenstein: M5
Schätzung: 13 Tools, 2 min (Tabellenzeile: tech-sim-engineer sonnet Spec/offen × 1)
Budget: keins, keine Agenten starten
Prozessstufe: voll

1. Persona und Expertise: Simulations-Entwickler mit Erfahrung in deterministischen Wirtschaftssimulationen in TypeScript.
2. Ziel: Marktplatz verteilt Waren an Häuser im Radius. — Warum fürs Spielerlebnis: Versorgung wird sichtbar räumlich.
3. Kontext: docs/superpowers/plans/<plan>.md (Task 2), src/sim/supply.ts, src/sim/defs/buildings.ts, tests/sim/supply.test.ts
4. Deliverable: Code in src/sim/supply.ts, Tests in tests/sim/supply.test.ts, Commit im Worktree
5. Definition of Done: neuer Test zuerst rot, dann grün; make check grün; Commit „feat: …"
6. Grenzen: nur src/sim/supply.ts und tests/sim/supply.test.ts; Worktree .worktrees/m5-sim
7. Schnittstellen: tech-ui-engineer liest das neue Feld `supplied` (Paket M5-03)
8. Logging: siehe unten

Feste Regeln (unverändert, gelten immer):
- Neue Abhängigkeiten nur mit ADR und Ruling des Projektleiters, und nur wenn keine Alternative Sinn macht; den Hook `dep-guard` nie umgehen. Assets sind keine Dependencies.
- `src/sim` DOM-frei, Zufall nur über den seeded RNG.
- Save-Format versionieren; ältere Spielstände müssen nicht ladbar sein. Ein inkompatibler Spielstand wird mit Hinweis abgewiesen, nie ein Absturz; Test für das Abweisen.
- Tests grün, Balancing-Test bleibt Regressionsschutz, bewusste Änderungen als Ruling.
- Befunde ausserhalb Scope nach `docs/beobachtungen.md`, keine Folgeissues ohne Nutzer-OK.

Git: kein Rebase (auch kein `pull --rebase`), kein reset --hard, kein Force-Push; main per Merge holen (Verfassung §6.3).

Logging (jeweils als eigener Bash-Aufruf):
- Start: python3 tools/studio/log.py status --role tech-sim-engineer --status active --task "Marktplatz-Versorgung" --package M5-02
- Fertig: python3 tools/studio/log.py status --role tech-sim-engineer --status done --summary "Versorgung im Radius, 4 Tests grün" --package M5-02

Bericht (≤ 15 Zeilen): nach docs/studio/templates/bericht.md
```

Nach der Abnahme loggt der Lead (hier `lead-tech`) das Ergebnis mit `log.py result`; Werte und
Beispiel: [verbesserung.md](../verbesserung.md#messung-und-aufwand) und `log.py result --help`.
