# T00 · Testzeit-Ausgang auf main (E-052, Pflicht vor Task 1)

Controller (`lead-tech` sonnet, Instanz 1) · ≈ 5 Tools · kein Agent-Start · blocked-by: Testsperre frei (R380)

## Zweck

Zeiten der bestehenden Tests, die der Plan berührt, **vor** Task 1 auf main festhalten (R392, E-052), damit die Abnahme A/B vergleichen kann.

## Schritte

1. Im Hauptrepo auf `main` (sauber, Sperre frei, `uptime` 1-min-Load ≤ 4):
   - `npx vitest related --run src/ui/app.ts src/ui/menu.ts src/ui/startCard.ts --reporter=verbose; echo EXIT=$?`
   - `npx vitest run tests/sim/balance-merchants.test.ts tests/ui/menu.test.ts tests/ui/startCard.test.ts --reporter=verbose; echo EXIT=$?`
2. Jeden Test > 200 ms mit Datei, Name und Zeit unten unter «Ausgang» eintragen (Commit `docs: I-186 Testzeit-Ausgang (E-052)` auf `feat/i186-ehrenbuch`).
3. Die Dateiliste ist zugleich die A/B-Liste für den Abschluss (Index, «Abschluss»).

## Ausgang

(füllt der Controller; leer lassen, falls kein Test > 200 ms, mit Vermerk «keiner > 200 ms»)
