# M14-E1 · Rahmenregeln für alle Tasks

Gehört zum [Index](../2026-10-11-m14-e1-inselcharakter.md); jedes Briefing verweist auf diese Datei. Arbeiter und
Reviewer lesen nur diese Datei, ihre Task-Datei und die dort genannten AK und Anhang-Abschnitte der
[Spec](../../specs/2026-10-10-m14-e1-inselcharakter-design.md).

## Global Constraints

- `src/sim/` DOM-frei und deterministisch; Zufall nur über `src/sim/rng.ts`. Die neue Stufe 3 der Inselplatzierung
  zieht **keinen** Zufall (ADR-010, Nachtrag M14-E1). Sim-Aktionen werfen nie, sie liefern `{ ok, reason }`.
- Werte nur in `src/sim/defs/sea.ts` (Spec §4). Keine Änderung an `GOODS`, `LEVELS`, `BUILDING_DEFS`, `SHIP_MAX`,
  `SHIP`, `ISLANDS[0]`, `ISLANDS_SALT`, `ISLAND_TRIES`, `ISLAND_GAP_MIN`, `ISLAND_RIM`, `FALLBACK_*` (Bestand).
  Keine Laufzeit-Abhängigkeit, kein neues ADR (ADR-010 hat den Nachtrag).
- **Baseline (AK-M14E1-18):** `tests/sim/balance*.test.ts`, `e0Pins.ts`, `e1Pins.ts`, `seePins.ts`, `CHAIN_HASHES`,
  `V6_FORMS` bleiben **ohne Diff** grün. Vergleichsbasis ist `main` @ `9113e574` (R554, QA-B3), nicht die bewegliche
  `main`-Spitze. Ein roter Pin ausserhalb der Liste in [entscheidungen.md](entscheidungen.md) E5 heisst Stopp und
  Meldung an den Controller, nie nachpinnen. Controller-Dateien (`tests/sim/controller.ts`, `merchantsController.ts`)
  bleiben unverändert.
- **Nachpinnen nur nach Liste:** Die Pins in [entscheidungen.md](entscheidungen.md) E5 Gruppe D ändern ihren Wert
  bewusst; nur mit dem Ruling aus dem Gate Plan (Entwurf R-c2) und einem Kommentar `M14-E1: bewusst neu gepinnt
(R<nnn>)` an der Stelle. Gruppe B und C ändern keinen Wert.
- **Save:** «Vorversion» = v12, «neu» = v13 (`main` @ `9113e574` hat `SAVE_VERSION` 12). Zeigt T00 eine andere
  Version, ersetzt der Controller die Zahlen in allen Task-Dateien vor dem ersten Start (eine Zeile im Ledger).
- **Lastregel und Testsperre:** Steht ein Push an (R464 V1), startet kein Testlauf. TOOL-TESTLOCK (R380): Umsetzer
  fahren nur gezielte Läufe `npx vitest run <Dateien>`, je Code-Task `npx tsc --noEmit` und `make lint` Exit 0;
  `make test` und `make check` fährt nur der Controller. Exit-Codes `; echo EXIT=$?`, nie in eine Pipe.
  Zeitmessungen nur bei 1-min-Load ≤ 4 (R329).
- **Testzeit (R392, E-052):** Jeder neue Test unter 200 ms, ausser er steht mit Budget in der Task-Datei. Seed-Läufe
  über 1000 Seeds laufen in Blöcken (`it.each` je 100 Seeds, Muster `islands-gen.test.ts` «Block ab …»), damit Vitest
  sie verteilt. Die Zeiten der berührten Bestandstests stehen in [testzeiten.md](testzeiten.md).
- **Git:** Kein Rebase (auch kein `pull --rebase`), kein `reset --hard`, kein Force-Push. `main` und Fremd-Branches
  nur per Merge, und zwar nur den vom Reviewer abgenommenen Commit-Hash (Ledger). Commit-Präfixe `feat:`, `fix:`,
  `test:`, `refactor:`, `docs:`; vor Doku-Commits `make docs-check` Exit 0.
- **Desktop-first:** alle Texte bei 1280×720 ohne waagrechtes Scrollen; 800×600 nur «stürzt nicht ab». Zahlen und
  Namen im UI nur aus Defs und Sim-Abfragen (`TRAIT_LABELS`, `BUILDING_DEFS`, `GOODS`, `TRAIT_CYCLE_PCT`,
  `islandCycle`); Texte wörtlich nach Spec Anhang 03.
- **Zeilenangaben driften:** jede Task beginnt mit Schritt 0 (`grep -n` der genannten Symbole).
- **Rulings (R471):** Kein Task ändert `docs/studio/rulings.md`. Braucht ein Task eine Entscheidung, meldet er sie
  als «Entwurf an L0» im Bericht. Befunde ausserhalb des Scopes nach `docs/beobachtungen.md`.

## Begriffe

- **Trait-Betrieb:** Betrieb mit `defId` in `TRAIT_BUILDINGS[t]` auf einer Insel, deren Def den Trait `t` trägt.
- **Stufe 1/2/3** der Lage einer Fremdinsel: 1 Zufallslage (`ISLAND_TRIES`), 2 `FALLBACK_DIRECTIONS` Richtungen im
  Band, 3 neue Ersatzregel ohne Zufall (Suche ausserhalb des Bands, zuletzt konstruktiv). Spec R3.4 Punkt 5.
- **Unberührte Insel C:** Spec Anhang 02 D Regel 3.

## Review je Task

`qa-code-reviewer` (sonnet) prüft gegen Task-Datei und genannte AK: Test vorher rot, Spec-Konformität, Determinismus,
kein Wert ausserhalb `defs/`, Doku-Konsistenz, Commit-Konvention, Testzeit. Urteil OK / BEDENKEN / ZURÜCK. Fix-Runde
per SendMessage an denselben Umsetzer, Delta-Review per SendMessage an denselben Reviewer.
