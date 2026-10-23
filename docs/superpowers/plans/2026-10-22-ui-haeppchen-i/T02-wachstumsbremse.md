# T02 · P3 Grundteil Wachstumsbremse (I-170 ohne Lärm)

Umsetzer `tech-ui-engineer` · ≈ 55 Tools · AK I17 bis I22, I24 bis I26 · blocked-by: T01 (gleiche Datei `hud.ts`); Stadtplanung-Merge **nicht** nötig · Spec: Teil P3 Regeln 1 bis 4, 6 bis 9 · Strang A

## Dateien

- neu: `src/ui/growthBrake.ts`, `tests/ui/growthBrake.test.ts`, `tests/ui/growthBrake.perf.test.ts` (Messung, siehe unten)
- ändern: `src/ui/hud.ts` (Stufen-Chip-Refresh ≈ Z. 350 bis 425, `BRAKE_REFRESH_MS`, `tierTooltip` unverändert lassen), `tests/ui/hud.test.ts` (Ergänzung am Ende)
- nicht ändern: `src/sim/` (auch `houseDiagnosis` nicht), `problems.ts`, `inspect.ts`, Haus-Panel, `src/style.css`

## Verhalten

1. `growthBrakes(world, island, cov?): Record<Tier, GrowthBrake>`: ein Durchlauf über `world.buildings`, einmal `buildCoverage`; Häuser der Insel, nicht brennend; eine Ursache je Haus (`supply` → erstes Gut in `GOOD_IDS`-Reihenfolge → Dienst in Stufenreihenfolge → «ohne Mangel»). `GrowthBrake` trägt `houses`, geordnete Ursachenzähler, `free` und ein leeres Feld `noise` (Typ jetzt anlegen, T05 füllt es: dann keine Typänderung später).
2. `brakeLines(brake, parkShown): string[]`: Zeile 2 nach Spec Regel 4 (höchstens 3 Ursachen, Rest «weitere», «ohne Mangel» nur bei n > 0, Einzahl, «Alle n Häuser ohne Mangel»); Namen aus `GOODS[..].name` und `BUILDING_DEFS[SERVICE_BUILDING[..]].name`. Kein Text mit «Aufstieg» oder «bereit». Lärm-Zeile liefert `brakeLines` noch nicht.
3. `hud.ts`: Tooltip = `tierTooltip(tier)` + Zeilen mit `\n`. Neu rechnen höchstens alle `BRAKE_REFRESH_MS = 1000` (Muster `balanceDue`), nur wenn mindestens ein Stufen-Chip sichtbar (`popChipHidden`); gerechnet wird einmal für alle Stufen. `title` nur bei geändertem Text schreiben. Chip-Text und `aria-label` unverändert.

## Testfälle (rot zuerst)

I17 bis I22, I24 (serialize-gleich), I25 (gestubbte `performance.now`, Spy auf `growthBrakes`), I26 (bestehende `hud.test.ts` grün). Reihenfolgen und Texte aus Gold-Strings der Spec Regel 4. Keine `Contract`-Literale; Welten über die vorhandenen Test-Helfer bauen.

## Messung (AK-I27, Vorab-Signal)

`tests/ui/growthBrake.perf.test.ts`: Welt mit ≥ 200 Häusern (Helfer wie in `tests/sim/balance.test.ts`), Median aus 20 `growthBrakes`-Läufen per `performance.now`, Ausgabe per `console.log`, **keine** Zeit-Assertion (R270, nicht in `ZEITTESTS` aufnehmen). Liegt der Median über 4 ms: Umsetzer meldet `blocked` mit Zahl, der Plan geht an L0 zurück; nicht weiterbauen. Der Browser-Wert in T03 ist massgeblich.

## Prüfungen

`npx vitest run tests/ui/growthBrake.test.ts tests/ui/growthBrake.perf.test.ts tests/ui/hud.test.ts; echo EXIT=$?`, `npx tsc --noEmit; echo EXIT=$?`, eslint und prettier auf die Dateien. Commit `feat: Wachstumsbremse im Einwohner-Chip (I-170)`.
