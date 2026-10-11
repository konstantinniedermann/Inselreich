# Gate-Ensemble (TOOL-GATE-ENSEMBLE) Implementation Plan — Index

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Gate-Grenzen des Balancing-Controllers nicht mehr an einem Einzellauf festmachen, sondern an 5 unabhängigen, deterministischen Läufen (Median plus Min/Max je Grenze). Fürs Spielerlebnis: Balancing-Entscheide (Zukauf, M14-Werte) hängen nicht an einem zufällig passenden Lauf. **Das Ensemble belegt Robustheit gegen Entscheidungszeitpunkte, nicht gegen Layout oder Seed (R556 d).**

**Quelle:** Beobachtung „Balancing-Controller: Seed wirkt nicht auf die Heimkolonie“ (2026-10-11), R549 (3), R551, R553 V1, R554 · Werkzeug-Paket, Prozessstufe leicht (E-010: Index plus je Task eine Datei ≤ 10 KB in [`2026-10-11-tool-gate-ensemble/`](2026-10-11-tool-gate-ensemble/)) · Plan: `lead-tech`, sonnet (E-054).

## Entscheide dieses Plans

1. **Robustheitsachse = Controller-Phase.** Der Controller entscheidet heute bei `tick % 100 === 0`. Neu: `ColonyOptions.phase` (ganzzahlig 0..99, Standard 0), Entscheidung bei `tick % CONTROL_INTERVAL === phase`. Ensemble = Phasen {0, 20, 40, 60, 80}. Das verschiebt Bau- und Kaufzeitpunkte (Preisstand, Reserve, Aufstiegsmoment) um bis zu 80 Ticks, bleibt reine Funktion von (Seed, Phase), braucht keinen RNG und ändert `src/` nicht. Phase 0 ist bitgleich zum heutigen Lauf (alle bestehenden Tests unverändert).
2. **Warum nicht Startvarianten der Heimkolonie:** Layout-Verschiebung/Spiegelung berührt `forceTerrain` und die festen Bauplätze (`layoutFor`), also das ganze Gelände-Gerüst aller Klasse-N-Tests; Kosten hoch, Aussage („anderer Startplatz“) für Spielwerte unerheblich. Der Seed scheidet aus (Läufe für Seeds 3/5/7/11 bitgleich, nur Fremdinseln ändern sich). **Rückfall (R556 c)**: Zeigt die Sieg-Tick-Spannweite der Phasen weniger als 1 % von `MAX_TICKS`, Stopp (`blocked`), Eintrag in `docs/beobachtungen.md`, dann in fester Reihenfolge zuerst Kontrollintervalle {90, 100, 110}, danach Startverzögerung der ersten Entscheidung; erst wenn beide scheitern, Bericht an L0.
3. **Ort = Test-Helfer** `tests/sim/ensemble.ts` (Statistik, Tabelle) plus gesteuerter Messlauf `tests/sim/ensemble.test.ts`; kein `tools/`-Python (der Controller ist TypeScript, Wiederverwendung statt Zweitimplementierung). `tools/studio/` bleibt unberührt, also kein `make studio-test`-Eingriff (trotzdem im Abschluss grün zu bestätigen, falls die Umsetzung doch dort landet).
4. **Laufzeit-Budget: Ensemble nur im Gate-Messlauf.** Der Messlauf ist ein `describe.runIf(import.meta.env.VITE_ENSEMBLE)`; `make check` führt ihn nicht aus (übersprungen, 0 ms). Zu `make check` kommen nur Millisekunden-Tests (Statistik mit Fake-Werten, Phase-Default bis Tick 1500). Aufruf: neues Make-Ziel `gate-ensemble` (`VITE_ENSEMBLE=1 npx vitest run tests/sim/ensemble.test.ts --silent=false`). **Ziel** ≤ 5 × Dauer eines vollen Controller-Laufs je Messgrösse; die Einzellaufzeit misst T01 (Messung statt Schätzung), Obergrenze 90 s Gesamt bei Load ≤ 4, sonst Bericht an L0.
5. **Ausgabeformat:** je Grenze eine Zeile: `Grenze | Median | Min | Max | Spannweite | gehalten k/5`. Grenzen: Sieg-Tick, erster Siedler, erster Bürger, minimales Geld, End-Geld, Zukauf-Mehrkosten in % (nur mit Messweg `trackedBuy`). Urteilsvorschlag (L0 entscheidet): Verdikt je Grenze (R556 a): **OK** (Median und Min/Max innerhalb) · **AUSREISSER** (nur der Median innerhalb) · **GERISSEN** (Median ausserhalb). Ein Gate gilt nur bei OK als bestanden; AUSREISSER und GERISSEN gehen als Bedenken an L0, nie stillschweigend als OK. Die Ausgabe trägt im Kopf den Hinweis „Robustheit gegen Entscheidungszeitpunkte (Controller-Phase), nicht gegen Layout oder Seed“.

## Global Constraints

- Keine neue Abhängigkeit (ADR-001). `src/` unverändert, kein Save, kein Spielwert, `defs/` unberührt. Zufall nur im seeded RNG (hier gar keiner).
- **Zeitmessung vor T01** (Controller, auf `main`, Load ≤ 4, R329; TOOL-TESTLOCK beachten): `npx vitest related --run tests/sim/controller.ts tests/sim/merchantsController.ts; echo EXIT=$?`, Zeiten je Datei ablegen (Richtwert 2026-10-11: 31 Dateien, 729 Tests, 9,8 s bei Load 4,1). **Abnahme** am Ende gleicher Lauf auf dem Branch: kein bestehender Test > 500 ms und keiner > +50 % gegen die Basis (R392, E-052); der neue `ensemble.test.ts` zählt im Standardlauf als übersprungen.
- **Test zuerst, Rot-Beleg (R395, R410):** je neuem Testfall roter Lauf (`EXIT=1`, Fehlermeldung nennt den Grund, nicht „Import fehlt“) im Task-Bericht, dann grün. Umsetzer fahren nur gezielte Dateien (`npx vitest run tests/sim/<x>.test.ts; echo EXIT=$?`); `make check`, `make lint`, `make zeittests`, `make conflicts`, `make docs-check` nur der Controller (Testsperre R380). Exit-Codes nie in eine Pipe.
- Schnelle Prüfungen je Task (Controller): `npx tsc --noEmit`, `make lint`. Am Schluss `make check`, `make docs-check`.
- Balancing-Test bleibt Regressionsschutz: Phase 0 bitgleich, `tests/sim/balance*.test.ts` unverändert grün. Neue Messwege dürfen den Lauf nicht verändern (nur lesen).
- Commit-Präfixe `feat:`, `test:`, `docs:`; kein Rebase, kein Force-Push, main per Merge. `docs/studio/rulings.md` nicht ändern (R471).

## Architektur (≤ 15 Zeilen)

- `tests/sim/controller.ts`: `ColonyOptions.phase`; `runColony` ruft `control` bei `w.tick % CONTROL_INTERVAL === phase`; `trackedBuy` ersetzt `buy` in `buyMissing` (Mehrkosten gegen Listenpreis, Edikt eingerechnet), exportiert `buySurcharge`/`buyVolume` (Vorlage: `feat/i048-b` @ `bc57f8ba`, nur kopieren, Branch bleibt geparkt, R549 (4)).
- `tests/sim/ensemble.ts` (neu): `PHASES = [0,20,40,60,80]`, `runEnsemble(measure, phases)`, `summarize(values)` → Median/Min/Max, `formatTable(rows)`; rein, ohne `expect`.
- `tests/sim/ensemble.test.ts` (neu): Unit-Tests der Reinfunktionen (immer) plus gesteuerter Messlauf (nur `VITE_ENSEMBLE`).
- `Makefile`: Ziel `gate-ensemble`; `docs/arc42.md` Testkapitel eine Zeile; `README` unberührt (keine Spielerbedienung).
- Nutzer: plan-M14-E1 (QA-B2-Messung) und I-048 Schritt B rufen `make gate-ensemble` statt eines Einzellaufs.

## Worktree und Datei-Ownership (Parallelität 1, ein Umsetzer seriell)

Worktree `.worktrees/tool-gate-ensemble`, Branch `tool/gate-ensemble` von `main` @ ade26b56. Vor Start `make conflicts`; `controller.ts` wird von sieben Testdateien importiert, daher nur additive Optionen.

| Task | Titel                         | Dateien (Eigentum)                                               | AK-ID  | blocked-by | Modell |
| ---- | ----------------------------- | ---------------------------------------------------------------- | ------ | ---------- | ------ |
| T01  | Phase-Option, Streuungsprobe  | `tests/sim/controller.ts`, `tests/sim/ensemble.test.ts` (Anfang) | GE-1,2 | —          | sonnet |
| T02  | Messweg `trackedBuy` portiert | `tests/sim/controller.ts`, `tests/sim/ensemble.test.ts`          | GE-3   | T01        | sonnet |
| T03  | Statistik und Tabelle         | `tests/sim/ensemble.ts`, `tests/sim/ensemble.test.ts`            | GE-4,5 | T02        | sonnet |
| T04  | Messlauf und Make-Ziel        | `tests/sim/ensemble.test.ts`, `Makefile`                         | GE-6,7 | T03        | sonnet |
| T05  | Doku (D1)                     | `docs/arc42.md` (Testkapitel), `docs/studio/` nicht              | GE-8   | T04        | sonnet |

Abnahme-Kriterien (Plan-intern, Werkzeug ohne Spec): **GE-1** Phase 0 bitgleich zum Standardlauf. **GE-2** Phase 20 weicht bis Tick 1500 messbar ab (Streuungsbeleg; sonst Rückfall Entscheid 2). **GE-3** Messweg ändert den Lauf nicht; Mehrkosten bei `BUY_RISE` 0 sind 0. **GE-4** Median/Min/Max korrekt (gerade und ungerade Anzahl). **GE-5** Tabelle nennt `AUSREISSER`. **GE-6** Messlauf nur mit `VITE_ENSEMBLE`, sonst übersprungen. **GE-7** `make gate-ensemble` läuft ≤ 90 s. **GE-8** Doku genannt.

## Budgetantrag (Stufe leicht)

1 Umsetzer `tech-sim-engineer` sonnet (alle Tasks, Fix-Runden per SendMessage) + 1 Final-Review `qa-code-reviewer` opus über die Branch = 2 Starts; +30 % Puffer aufgerundet = **3 Starts**, Parallelität 1. Task-Reviews entfallen zugunsten des Final-Reviews (Stufe leicht). Kein Playtester (keine UI). Geschätzt 60–90 Tool-Aufrufe.

## Entscheidungsbedarf an L0

- Entschieden durch R556: 5 Phasen; Verdikte OK/AUSREISSER/GERISSEN; Streuungsschwelle 1 % `MAX_TICKS`. Budget nach R556: 4 Starts.
