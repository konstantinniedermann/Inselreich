# Plan SEE-F1-KORRIDOR (REL-10, Stufe leicht, Fehlerbehebung)

Quelle: R369, `docs/beobachtungen.md` (SEE-F1-KORRIDOR), R367. Branch `fix/see-f1-korridor`, Worktree `.worktrees/see-f1-korridor`. Noch nicht umgesetzt.

## Ziel

Wrack, Felsnadel und Felseiland meiden die Schiffsroute (`seaRoute`), nicht nur die gerade Lane. Korridor-Zahl (Element <= 2 Kacheln von einer Route) <= 5 % über Seeds 1-40 (heute 39 von 265 = 15 %).

## Befund und Entwurf

- `seaPlan` (`src/render/decor.ts` ~1077) und `ranked` rufen `seaKeepOut(ctx, ...)`; `seaKeepOut` = `seaClearance(ctx, ...) < 0` nutzt nur `ctx.lanes` (Geraden aus `seaLanes`).
- `seaClearance` ist zugleich Grundlage der Tönung (`src/render/seaFields.ts`, `water.ts`; Pixel laufen bei 0 aus, `terrainSea.test.ts`). Die Tönung muss auf `lanes` bleiben (R367).
- **Getrennte Freihaltung ist möglich, aber nur für Wrack, Eiland und Felsen (B1).** `seaTintFor` (`src/render/seaFields.ts:138`) baut die Tönung aus den Flächen von `seaPlan` (Sandbank, Riff, Tang). Diese wachsen über `ok()` (`decor.ts:1093`) und die Sperrzonen von Wrack/Fels. Würde die Route dort wirken, änderte sich die Heimat-Tönung. Darum: `SeaContext` bekommt `routes: Pos[][]` (Kopien aus `seaRoute`, Heimatkacheln) und `seaPlanKeepOut(ctx, x, y, pad)` = `seaKeepOut` oder Routenabstand < `SEA_LANE_GAP + pad`. Nur die Platzierung von Wrack, Eiland und Felsnadel/Felsen ruft sie; `ok()` und `ranked` behalten für alle Flächen und für die Sperrzonen-Berechnung das alte `seaKeepOut`. Die Flächen (Sandbank, Riff, Tang) und `seaTintFor` sind **bitgleich zu main**. `seaKeepOut`/`seaClearance`/`seaKontorBlocked` bleiben unverändert.
- `ctxKey` (decor.ts ~1038) nimmt `routes` auf (Plan-Cache).
- **Pins (B1, B2):** Neuer Pin in K1, **auf main aufgenommen**: Hash von `seaTintFor` über Seeds 1-40 (Welt mit Fremdinseln); er bleibt nach der Umsetzung unverändert und beweist die Flächen-Gleichheit. Tönungs-Pins (`terrainSea.test.ts`) bleiben. `HOME_CALLS` (802371235, Hash über eine Welt aus `save-v7.json`) darf laut R377 **begründet neu gesetzt** werden (Wrack/Fels/Eiland der Heimat hängen jetzt an den Routen); `HOME_ORDER` (3471626267) bleibt. Die Begründung steht im Test-Kommentar und als Ruling-Vorschlag. Die Variante „Gleichheits-Pins ohne Meer-Elemente vergleichen“ entfällt. AK-E1-10/-12 werden geprüft und nur geändert, wenn sie rot werden, je mit Begründung.
- Determinismus (B4): Plan hängt nur von Seed, Gelände, `lanes`, `routes`; Speichern → Laden gibt denselben Plan (Test: Welt laden, Plan vergleichen); Ergebnis gleich bei kaltem und vollem `shared`-Cache; `seaRoute(a<b)` wird für die Heimat in Richtung Heimat → Ziel umgekehrt, die Reihenfolge der Punkte darf das Ergebnis nicht ändern (Abstand zur Polylinie ist richtungsfrei; Test mit a<b und umgekehrt).
- Kosten/Risiko: `seaRoute` je Welt einmal (WeakMap-Sig wie `seaContext`), Zahl der Routen = Zahl der Nachbarinseln (Heimat, höchstens 4-6); `distToSeg` je Route-Segment nur im Planungsweg (Kacheln im Tiefenband, einmal je Insel gecacht). Keine Sim-/Save-Änderung, keine neue `SAVE_VERSION`. Alternative (verworfen): Routen in `seaClearance` einbauen = Heimat-Tönung hängt von Fremdinseln ab, verletzt R367.

## Tasks

| ID  | Titel                                       | AK (testbar)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | blocked-by |
| --- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| K1  | Messtest + Tönungs-Pin auf main             | AK-K1: Messgrösse: Meer-Elemente (Wrack, Eiland, Felsnadeln/Felsen; Zahl **inkl.** Felsnadel, zusätzlich exkl. ausgewiesen), Abstand Kachelmitte (x+0,5, y+0,5) zur Polylinie, **alle Routenpaare** der Heimat wie `routeFar` (`fauna.ts:483`), Schwelle <= 2 Kacheln, Seeds 1-40. Ausgangswert auf main als Zahl im Test festgehalten (lead-qa: 29/275 = 10,5 %; der Messtest bestätigt oder korrigiert die Zahl, 39/265 aus R369 gilt nur als Obergrenze); Ziel <= 5 %, vor Umsetzung rot. AK-K1b: Pin Hash `seaTintFor` Seeds 1-40, grün auf main | L8 gemergt |
| K2  | `SeaContext.routes` + `seaPlanKeepOut`      | AK-K2: `seaPlanKeepOut` sperrt Kacheln <= `SEA_LANE_GAP + pad` an einer Route; `seaKeepOut`/`seaClearance` bitgleich zu main; `routes` sind Kopien (Mutation wirkt nicht auf `seaRoute`); `seaRoute(a<b)` und umgekehrt liefern gleichen Plan                                                                                                                                                                                                                                                                                                        | K1         |
| K3  | Wrack/Eiland/Felsen nutzen `seaPlanKeepOut` | AK-K3: K1 grün (<= 5 %); Flächen (Sandbank, Riff, Tang) und Sperrzonen bitgleich zu main (AK-K1b-Pin unverändert); `decorSea`/`terrainSea` grün ohne Pin-Änderung; Speichern → Laden und kalter/voller `shared`-Cache = gleicher Plan                                                                                                                                                                                                                                                                                                                | K2         |
| K4  | `HOME_CALLS` begründet neu setzen           | AK-K4: `HOME_CALLS` neu mit Kommentar (R367/R369/R377), `HOME_ORDER` unverändert; Tönungs-Pins unverändert; AK-E1-10/-12 grün oder je Pin begründet                                                                                                                                                                                                                                                                                                                                                                                                  | K3         |
| K5  | Perf + Doku                                 | AK-K5: je Test <= 500 ms, `zeitreserve` 0 ohne Reserve, Kaltstart Seed 7 <= +3 % gegen main; arc42 (Platzierung vs. Tönung) und Kopfkommentar `decor.ts` (Z. 35) nachgeführt                                                                                                                                                                                                                                                                                                                                                                         | K4         |

K1+K2 im selben Lauf (ein Umsetzer `art-rendering-engineer`, sonst `tech-ui-engineer`); alle Tasks seriell, ein Umsetzer, ein Baum.

## Datei-Ownership

- `src/render/decor.ts` (Hunks: `SeaContext` ~866-888, `seaContext` ~897-928, neue Funktion nach `seaKeepOut` ~945, `ctxKey` ~1038, `seaPlan` `ok`/`ranked` ~1090-1112, Kopfkommentar ~35)
- `tests/render/decorSea.test.ts` (Z. ~377 Kommentar R367), neue `tests/render/seaKorridor.test.ts`, `tests/render/renderer.test.ts` (Pins ~1236-1374)
- `docs/arc42.md`, `docs/studio/rulings.md` (Ruling zum Pin, Lead), `docs/beobachtungen.md` (Eintrag schliessen)
- Nicht anfassen: `seaFields.ts`, `water.ts`, `terrainSea.test.ts`, `src/sim/`.

## Überschneidung mit ART-L8-SELTEN (`feat/l8-selten`)

L8 ändert in `decor.ts` die Hunks Z. 33-45, 122-137, 235-247, 348-416 (`rareEligible`, `planRare`), 663, 712-755 (`planPalms`), 1420-1436 (`tileKind`) und `tests/render/renderer.test.ts` (13 Zeilen). KORRIDOR liegt in Z. 860-1115: **textlich disjunkt**, aber `decor.ts` und `renderer.test.ts` sind beide Dateien; und L8 verschiebt Zeilennummern (+~80). Daher **seriell nach L8**: Start von K1 erst nach Merge von L8 auf main; Branch dann von neuem main. Pin-Konflikt in `renderer.test.ts`: K4 prüft L8-Pin-Stand.

## Budgetantrag (nach Formel)

4 Pakete-Einheiten (K1+K2, K3, K4, K5 = 4) x 2 = 8 Starts (Umsetzer + Review) + 0 Playtests (kein UI-Paket; Browser-Sichtprobe optional im Release-Check) + 1 Final-Review `opus` = 9, + 30 % = 12 Starts. Parallelität 1. Tools Richtwert ca. 120 (+20 nach Gate R377).

## Review

Je Task `qa-code-reviewer` (sonnet); Final-Review `opus` über die Branch (Pins, Determinismus, Perf-Zahlen mit Exit-Codes).
