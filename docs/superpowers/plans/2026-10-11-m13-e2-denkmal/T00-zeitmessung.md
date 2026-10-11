# T00 · Zeitmessung Ausgang (erster Schritt der Umsetzung, je Strang)

Ausführender: der jeweilige **Controller** (A sim, C art, D ui), kein Arbeiter-Start · Grundlage R392 / E-052,
Handbuch 1.32 · blocked-by Gate Plan · Ablage `.studio/qa/m13-e2/zeit/`

**Zweck:** Vor Task 1 jedes Strangs die Laufzeit der bestehenden Tests messen, die die geplanten `src/`-Dateien
berühren, auf `main` (Hauptcheckout, Stand Abzweig). Bei der Abnahme (T17 bzw. T18) misst der Controller dieselben
Dateien auf `main` und auf der Branch **unmittelbar nacheinander** und vergleicht.

## Vorbedingungen

- Kein Push steht an (R464 V1) und die Testsperre ist frei (R380); sonst später wiederholen, nicht warten.
- `git -C /Users/KN/CAS/projekte/anno-clone status --short` leer, `HEAD` = Abzweig-Commit (im Ledger notieren).

## Schritte

- [ ] **Schritt 1: Sim-Strang (Controller A).** `types.ts` fehlt bewusst: es wird fast nur per `import type`
      eingebunden und zöge sonst die ganze Suite.

```bash
npx vitest related --run --reporter=json --outputFile=.studio/qa/m13-e2/zeit/main-sim.json \
  src/sim/defs/buildings.ts src/sim/placement.ts src/sim/unlocks.ts src/sim/build.ts src/sim/world.ts \
  src/sim/save.ts src/sim/trade.ts src/sim/tick.ts src/ui/buildMenu.ts; echo EXIT=$?
```

- [ ] **Schritt 2: ART-Strang (Controller C).**

```bash
npx vitest related --run --reporter=json --outputFile=.studio/qa/m13-e2/zeit/main-art.json \
  src/render/iso.ts src/render/sprites.ts src/render/spriteCache.ts src/render/renderer.ts src/render/fx.ts \
  src/render/limits.ts; echo EXIT=$?
```

- [ ] **Schritt 3: UI-Strang (Controller D).**

```bash
npx vitest related --run --reporter=json --outputFile=.studio/qa/m13-e2/zeit/main-ui.json \
  src/ui/hints.ts src/ui/inspect.ts src/ui/hotkeys.ts src/ui/input.ts src/ui/goal.ts src/ui/hud.ts \
  src/ui/soundEvents.ts src/audio/sound.ts src/audio/manifest.ts; echo EXIT=$?
```

- [ ] **Schritt 4: Auswerten.** Je Lauf Gesamtdauer und die fünf langsamsten Dateien (aus `testResults[*]`,
      `endTime − startTime`) in den Ledger. Exit ≠ 0 auf `main` ist ein Befund vor jeder Änderung: an L0 melden, nicht
      beginnen.

## Abnahme (in T17/T18)

Derselbe Befehl je Strang zuerst im Hauptcheckout (`main`), direkt danach im Worktree; Ausgabe nach
`branch-<strang>.json`. Eine bestehende Datei, die auf der Branch > 25 % und > 2 s langsamer ist, ist ein Befund im
Final-Review (Ursache nennen oder beheben). Neue Dateien (`monument.test.ts`, `balance-monument.test.ts`, …) zählen
nicht, ihre Zeit steht unter der Zeitreserve-Regel (Anhang 03 A).
