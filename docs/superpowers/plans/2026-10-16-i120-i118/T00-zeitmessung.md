# T00 Zeitmessung Bestandstests (R392)

Strang A und R, jeweils im eigenen Worktree vor Task 1. Keine Quelländerung.

1. `/usr/bin/time -p npx vitest run tests/audio tests/render/fx.test.ts tests/render/viewStats.test.ts tests/render/limits.test.ts; echo EXIT=$?` (Plan-Messung: 9 Dateien, 146 Tests, 2,0 s Vitest, 2,7 s Wand).
2. Volle Suite einmal: `/usr/bin/time -p make test; echo EXIT=$?` (läuft > 4 min nicht erwartet; sonst im Hintergrund).
3. Beide Zahlen als Zeile in den Bericht an den Controller (nicht in eine Datei). Vergleichswert für den Abschluss: Suite nach der Änderung höchstens 1 s länger.
