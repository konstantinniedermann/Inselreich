# M13-E2 · Rahmenregeln für alle Tasks

Gehört zum [Index](../2026-10-11-m13-e2-denkmal.md); jedes Briefing verweist auf diese Datei.

## Global Constraints

- `src/sim/` DOM-frei, deterministisch, **kein RNG-Zugriff** in neuen Pfaden; Aktionen werfen nie, liefern `{ ok, reason }`, ändern bei `ok: false` nichts; Werte nur in `src/sim/defs/monument.ts` und `BUILDING_DEFS.monument`. Keine Wertänderung an bestehenden Defs, keine Laufzeit-Abhängigkeit, kein ADR (Spec §12).
- **Baseline (AK-M13E2-21):** `balance.test.ts`, `balance-merchants.test.ts`, `balance-edicts.test.ts`, alle Hash-Pins, `CHAIN_HASHES`, `V6_FORMS`, `e0Pins.ts`, `e1Pins.ts`, `seePins.ts` bleiben **ohne Diff** grün. Ein roter Pin heisst Stopp und Meldung an den Controller, nie nachpinnen. Kein Controller baut ein Denkmal (`tests/sim/controller.ts`, `merchantsController.ts` unverändert).
- **Pflicht-Stopp T07:** Verfehlt Lauf C die Spanne oder weicht `K_ARM`/T0 ab, stoppt der Umsetzer, meldet an `lead-design`; Grenzen und Festwerte ändert nur ein Ruling L0 (Anhang 03 A).
- **Lastregel:** Steht ein Push an (R464 V1), startet kein Testlauf. TOOL-TESTLOCK (R380): Umsetzer fahren nur gezielte Läufe `npx vitest run <Dateien>`, je Code-Task `npx tsc --noEmit` und `make lint` Exit 0; `make test`/`make check` nur der Controller. Exit-Codes `; echo EXIT=$?`, nie in eine Pipe. Code mit Edit/Write. Commit-Präfixe `feat:`/`test:`/`refactor:`/`docs:`; vor Doku-Commits `make docs-check`. Kein Rebase, kein `reset --hard`; `main` und Fremd-Branches nur per Merge, und zwar **nur den vom Reviewer abgenommenen Commit-Hash** (Ledger), nie die bewegliche Spitze.
- Desktop-first: Panel-Spalte 280 px ab 1280 px; schmaler nur «stürzt nicht ab». Zahlen und Namen im UI nur aus Defs und Sim-Abfragen. Texte wörtlich nach Spec §7 und Anhang 07.
- Zeilenangaben driften: jede Task beginnt mit Schritt 0 (`grep -n` der Symbole). Neue Testhelfer für das Denkmal in **`tests/sim/monumentHelpers.ts`** (nicht in `helpers.ts`, Hot Spot mit I-049).
