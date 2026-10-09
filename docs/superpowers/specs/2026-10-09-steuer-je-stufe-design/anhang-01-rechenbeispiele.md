# Anhang 01 · Rechenbeispiele und Erwartungswerte (Steuer je Stufe, I-028)

Zur [Spec](../2026-10-09-steuer-je-stufe-design.md). Bilanz, Dominanz und Umschalt-Ausbeute stehen im
[Designvorschlag](../2026-10-09-steuer-je-stufe-vorschlag.md) §4, §5 und Anhang A und werden hier nicht wiederholt.

Konstanten aus den Defs: `TAX_UNIT = 2`, `UPKEEP_INTERVAL = 100`, `TAX_CARRY_DIVISOR = 100 × 100 × 2 = 20 000`,
Steuersatz je Einwohner `TIERS[t].tax` = 2 / 7 / 14 / 22, `GROWTH_INTERVAL = 50`, `TAX_SWITCH_LOCK = 300`.
10 Ticks = 1 s; 100 Ticks = 10 s; 600 Ticks = 1 min.

## A. Steuer je Stufe (AK-T02, AK-T30)

Welt mit aktiver Amtsstube, Regler `{1: 'low', 2: 'normal', 3: 'high', 4: 'high'}`.

| Haus      | Einw. | erfüllt | Einw. × tax × Faktor | Sₜ  | Satz  | Sₜ × Satz   | je 100 Ticks | je Minute (⌊⌋) |
| --------- | ----- | ------- | -------------------- | --- | ----- | ----------- | ------------ | -------------- |
| Pioniere  | 4     | ja      | 4 × 2 × 2 = 16       | 16  | 70 %  | 1 120       | 5,6          | 33             |
| Siedler A | 8     | ja      | 8 × 7 × 2 = 112      |     |       |             |              |                |
| Siedler B | 8     | nein    | 8 × 7 × 1 = 56       | 168 | 100 % | 16 800      | 84,0         | 504            |
| Bürger    | 11    | ja      | 11 × 14 × 2 = 308    | 308 | 130 % | 40 040      | 200,2        | 1 201          |
| Kaufleute | 15    | ja      | 15 × 22 × 2 = 660    | 660 | 115 % | 75 900      | 379,5        | 2 277          |
| **Summe** |       |         |                      |     |       | **133 860** | **669,3**    |                |

- `taxUnits = 133 860` je Tick; `stats.taxes = ⌊133 860 / 200⌋ = 669`.
- 100 × `tickTaxes` ab `taxCarry = 0`, `money = 0`: `taxCarry` wächst um 13 386 000; ganze Geldstücke
  `⌊13 386 000 / 20 000⌋ = 669`, Rest `13 386 000 − 669 × 20 000 = 6000`. Erwartet: `money === 669`,
  `taxCarry === 6000`. [Tech: Wird je Tick gebucht, ist das Ergebnis nach 100 Ticks dasselbe, weil der Übertrag
  ganzzahlig mitläuft.]
- Je Minute: `⌊Sₜ × Satz × 3 / 100⌋` (= `Sₜ × Satz × 600 / 20 000`): 33,6 → 33; 504; 1201,2 → 1201; 2277.
  Summe 4015 gegen `6 × 669,3 = 4015,8`: Abweichung durch Rundung je Zeile (Spec 7.1).
- Häuser roh einsetzen; während des Tests keine `tickPopulation`, damit Einwohner und «erfüllt» fest bleiben.

## B. Kaufleute «hoch» (AK-T05, AK-T06)

| Grösse                            | «normal»                   | «hoch» (neu)               |
| --------------------------------- | -------------------------- | -------------------------- |
| Zielbelegung `houseCap`           | max(1, ⌊20 × 1⌋) = 20      | max(1, ⌊20 × 0,75⌋) = 15   |
| `taxUnits` des vollen Hauses/Tick | 20 × 22 × 2 × 100 = 88 000 | 15 × 22 × 2 × 115 = 75 900 |
| Steuer je 100 Ticks (10 s)        | 440                        | 379,5                      |
| Steuer je Minute                  | 2 640                      | 2 277                      |

Ablauf nach dem Umschalten bei vollem Haus (20): je Wachstumstakt −1 (`inhabitants > cap`), also 19, 18, 17, 16, 15. In jedem Fenster von 250 aufeinanderfolgenden Ticks liegen genau 5 Vielfache von 50 → spätestens nach 250
Ticks 15 Einwohner; danach bleibt das Haus bei 15 (versorgt: `min(cap, inhabitants + 1) = 15`).

Zielbelegung «hoch» je Stufe: Pioniere ⌊4 × 0,75⌋ = 3, Siedler ⌊8 × 0,75⌋ = 6, Bürger ⌊15 × 0,75⌋ = 11, Kaufleute 15.

## C. Tooltips je Knopf (AK-T28, AK-T35)

`tierTaxTooltip(tier, level)`; Zeit über `formatGameTime` (150 Ticks = «15 s», 300 Ticks = «30 s»).

| Stufe     | niedrig                                   | normal                                    | hoch                                 |
| --------- | ----------------------------------------- | ----------------------------------------- | ------------------------------------ |
| Pioniere  | 70 % · Aufstieg nach 15 s · 4 Einwohner   | 100 % · Aufstieg nach 30 s · 4 Einwohner  | 130 % · kein Aufstieg · 3 Einwohner  |
| Siedler   | 70 % · Aufstieg nach 15 s · 8 Einwohner   | 100 % · Aufstieg nach 30 s · 8 Einwohner  | 130 % · kein Aufstieg · 6 Einwohner  |
| Bürger    | 70 % · Aufstieg nach 15 s · 15 Einwohner  | 100 % · Aufstieg nach 30 s · 15 Einwohner | 130 % · kein Aufstieg · 11 Einwohner |
| Kaufleute | Kaufleute steigen nicht auf (deaktiviert) | 100 % · 20 Einwohner                      | 115 % · 15 Einwohner                 |

Zeile «alle Stufen» (`taxEffect(level)`):

- niedrig: «niedrig: 70 % Steuer (Kaufleute normal) · Aufstieg nach 15 s Zufriedenheit · Häuser voll belegt»
- normal: «normal: 100 % Steuer · Aufstieg nach 30 s Zufriedenheit · Häuser voll belegt» (unverändert)
- hoch: «hoch: 130 % Steuer (Kaufleute 115 %) · kein Aufstieg · Häuser nur zu 75 % belegt»

## D. Migration v9 → v10 (AK-T18, AK-T21)

| v9 `taxLevel` | v9 `taxLockedUntil` | v10 `taxLevels`                                 | v10 `taxLockedUntil`        |
| ------------- | ------------------- | ----------------------------------------------- | --------------------------- |
| `normal`      | 0                   | `{1:'normal',2:'normal',3:'normal',4:'normal'}` | `{1:0,2:0,3:0,4:0}`         |
| `high`        | 450                 | `{1:'high',2:'high',3:'high',4:'high'}`         | `{1:450,2:450,3:450,4:450}` |
| `low`         | 450                 | `{1:'low',2:'low',3:'low',4:'normal'}`          | `{1:450,2:450,3:450,4:450}` |
| `extreme`     | 0                   | übernommen, Prüfung weist ab                    | —                           |

Fixtures: `save-v2.json` (`low`, 1300) → Zeile `low` mit 1300; `save-v4.json` (`high`, 5100) → Zeile `high` mit 5100.
Rückfaltung `foldBackToV9` jeder Zeile ergibt wieder die v9-Werte (Sperre = Maximum = alter Wert).

## E. Sperren (AK-T08 bis AK-T10)

| Tick | Aktion                         | Ergebnis                | `taxLevels` danach             | `taxLockedUntil` danach   |
| ---- | ------------------------------ | ----------------------- | ------------------------------ | ------------------------- |
| 1000 | `setTierTaxLevel(1, 'low')`    | ok                      | low · normal · normal · normal | 1300 · 0 · 0 · 0          |
| 1100 | `setTaxLevel('high')`          | `'Sperrzeit'`           | unverändert                    | unverändert               |
| 1100 | `setTaxLevel('low')`           | ok (C = {2, 3})         | low · low · low · normal       | 1300 · 1400 · 1400 · 0    |
| 1100 | `setTaxLevel('low')`           | `'Stufe bereits aktiv'` | unverändert                    | unverändert               |
| 1100 | `setTierTaxLevel(4, 'high')`   | ok (Kaufleute frei)     | low · low · low · high         | 1300 · 1400 · 1400 · 1400 |
| 1300 | `setTierTaxLevel(1, 'normal')` | ok                      | normal · low · low · high      | 1600 · 1400 · 1400 · 1400 |
