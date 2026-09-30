# Vorlage: Briefing

Für jede Delegation (L0 → L1, L1 → L2). Die Kopfzeilen stehen ganz oben im Prompt, weil die
Telemetrie die ersten 400 Zeichen liest. Regeln: [STUDIO.md](../STUDIO.md), „Briefing-Standard".
Der Block „Feste Regeln" steht wörtlich so in [VERFASSUNG.md §3](../VERFASSUNG.md#3-feste-regeln)
und wird unverändert kopiert.

```text
Persona: <rolle>
Paket: <id>
Meilenstein: <id> (oder „ohne")
Schätzung: <n> min, <m> Tools (Schätzung für den ganzen Auftrag inkl. aller Unteraufträge)
Modell: <opus|sonnet|haiku> (nur nennen, wenn abweichend von der Persona; dann auch im Agent-Aufruf)
Budget: <n Starts / Parallelität k> (nur für Leads; Arbeiter: „keins, keine Agenten starten")
Prozessstufe: <leicht|voll>

1. Persona und Expertise: <wer du bist, welche Erfahrung zählt hier>
2. Ziel: <ein Satz> — Warum fürs Spielerlebnis: <ein Satz>
3. Kontext (nur diese Dateien lesen): <pfad>, <pfad>
4. Deliverable: <was> unter <ablageort>
5. Definition of Done: <prüfbare Punkte, z. B. Test grün, make check grün>
6. Grenzen und Datei-Ownership: darfst ändern <pfade>; nicht ändern <pfade>; Worktree <pfad>
7. Schnittstellen: <von wem kommt Input, wer nutzt das Ergebnis, Übergabe unter .studio/handoffs/…>
8. Logging-Pflicht: siehe Block „Logging"

(Block „Feste Regeln" wörtlich aus VERFASSUNG.md §3)
Feste Regeln (unverändert, gelten immer):
- Keine neuen Laufzeit-Abhängigkeiten ohne Freigabe des Nutzers — vorschlagen, begründen, warten. Assets sind keine Dependencies.
- `src/sim` DOM-frei, Zufall nur über den seeded RNG.
- Save-Format versionieren und migrieren, mit Test für alte Spielstände.
- Tests grün, Balancing-Test bleibt Regressionsschutz, bewusste Änderungen als Ruling.
- Befunde ausserhalb Scope nach `docs/beobachtungen.md`, keine Folgeissues ohne Nutzer-OK.

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
Schätzung: 25 min, 40 Tools
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
- Keine neuen Laufzeit-Abhängigkeiten ohne Freigabe des Nutzers — vorschlagen, begründen, warten. Assets sind keine Dependencies.
- `src/sim` DOM-frei, Zufall nur über den seeded RNG.
- Save-Format versionieren und migrieren, mit Test für alte Spielstände.
- Tests grün, Balancing-Test bleibt Regressionsschutz, bewusste Änderungen als Ruling.
- Befunde ausserhalb Scope nach `docs/beobachtungen.md`, keine Folgeissues ohne Nutzer-OK.

Logging (jeweils als eigener Bash-Aufruf):
- Start: python3 tools/studio/log.py status --role tech-sim-engineer --status active --task "Marktplatz-Versorgung" --package M5-02
- Fertig: python3 tools/studio/log.py status --role tech-sim-engineer --status done --summary "Versorgung im Radius, 4 Tests grün" --package M5-02

Bericht (≤ 15 Zeilen): nach docs/studio/templates/bericht.md
```

Nach der Abnahme loggt der Lead (hier `lead-tech`) das Ergebnis, z. B. nach einer Fix-Runde:
`python3 tools/studio/log.py result --role lead-tech --package M5-02 --worker tech-sim-engineer --outcome nacharbeit --review-rounds 2`.
