# Plan SEE-F1-KORRIDOR (REL-10, Stufe leicht, Fehlerbehebung)

Quelle: R369, `docs/beobachtungen.md` (SEE-F1-KORRIDOR), R367. Branch `fix/see-f1-korridor`, Worktree `.worktrees/see-f1-korridor`. Noch nicht umgesetzt.

## Ziel

Wrack, Felsnadel und Felseiland meiden die Schiffsroute (`seaRoute`), nicht nur die gerade Lane. Korridor-Zahl (Element <= 2 Kacheln von einer Route) <= 5 % über Seeds 1-40 (heute 39 von 265 = 15 %).

## Befund und Entwurf

- `seaPlan` (`src/render/decor.ts` ~1077) und `ranked` rufen `seaKeepOut(ctx, ...)`; `seaKeepOut` = `seaClearance(ctx, ...) < 0` nutzt nur `ctx.lanes` (Geraden aus `seaLanes`).
- `seaClearance` ist zugleich Grundlage der Tönung (`src/render/seaFields.ts`, `water.ts`; Pixel laufen bei 0 aus, `terrainSea.test.ts`). Die Tönung muss auf `lanes` bleiben (R367).
- **Getrennte Freihaltung ist möglich.** `SeaContext` bekommt ein zweites Feld `routes: Pos[][]` (Routen von der Heimat, Heimatkacheln, aus `seaRoute(world.islands, hi, b)`, als Kopie, weil `seaRoute` geteilte Arrays liefert). Neue Funktion `seaPlanKeepOut(ctx, x, y, pad)` = `seaKeepOut` **oder** Abstand zu einer Route < `SEA_LANE_GAP + pad`. Nur `seaPlan` (`ok`, `ranked`) ruft sie. `seaKeepOut`/`seaClearance`/`seaKontorBlocked` bleiben unverändert.
- `ctxKey` (decor.ts ~1038) nimmt `routes` auf (Plan-Cache).
- **Welcher Pin ändert sich:** Platzierung hängt nun von den Fremdinseln ab; die Meer-Elemente der Heimat in einer Welt mit und ohne Fremdinseln sind nicht mehr gleich. Betroffen: AK-E1-10 Gleichheits-Pins in `tests/render/renderer.test.ts` (Zeilen ~1236, ~1250, Heimat-Pin Hash 802371235) und, falls Meer-Elemente im Bild sind, AK-E1-12 (~1374). Begründung: Die Invariante gilt für die **Tönung** (Wasserfelder, Schaum, Licht), nicht für die Wahl der Standorte. Neu: (a) die Gleichheits-Pins vergleichen die Heimat-Aufrufliste ohne die Meer-Elemente-Aufrufe (Wrack, Fels, Eiland, deren Schatten/Schaum), plus ein neuer, eigener Pin „Meer-Elemente der Heimat = Platzierung aus `seaPlan` mit `routes`“; (b) die Tönungs-Pins (`terrainSea.test.ts`, Wasserfeld-Aufrufe in AK-E1-10) bleiben unangetastet und gleich. Der Heimat-Hash wird nur dann neu gesetzt, wenn (a) allein nicht reicht; das Ruling dazu trägt der Lead nach.
- Kosten/Risiko: `seaRoute` je Welt einmal (WeakMap-Sig wie `seaContext`), Zahl der Routen = Zahl der Nachbarinseln (Heimat, höchstens 4-6); `distToSeg` je Route-Segment nur im Planungsweg (Kacheln im Tiefenband, einmal je Insel gecacht). Keine Sim-/Save-Änderung, keine neue `SAVE_VERSION`. Alternative (verworfen): Routen in `seaClearance` einbauen = Heimat-Tönung hängt von Fremdinseln ab, verletzt R367.

## Tasks

| ID  | Titel                                      | AK (testbar)                                                                                                                                                                                   | blocked-by |
| --- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| K1  | Messwerkzeug + roter Test                  | AK-K1: Test zählt Meer-Elemente <= 2 Kacheln an `seaRoute` über Seeds 1-40, erwartet <= 5 %; vor Umsetzung rot (39/265)                                                                        | L8 gemergt |
| K2  | `SeaContext.routes` + `seaPlanKeepOut`     | AK-K2: `seaPlanKeepOut` sperrt Kacheln <= `SEA_LANE_GAP + pad` an Route; `seaKeepOut`/`seaClearance` bitgleich zu main; `routes` sind Kopien (Mutation wirkt nicht auf `seaRoute`)             | K1         |
| K3  | `seaPlan` nutzt `seaPlanKeepOut`, `ctxKey` | AK-K3: K1 grün (<= 5 %); `decorSea.test.ts` und `terrainSea.test.ts` grün ohne Pin-Änderung; Plan deterministisch (gleiche Eingabe = gleicher Plan)                                            | K2         |
| K4  | Pin-Anpassung mit Begründung               | AK-K4: Heimat-Gleichheits-Pins vergleichen ohne Meer-Elemente; neuer Pin für die Platzierung mit Kommentar-Begründung (R367/R369); Tönungs-Pins, AK-E1-12 unverändert oder je Pin begründet    | K3         |
| K5  | Perf + Doku                                | AK-K5: Tests <= 500 ms je Test, `zeitreserve` 0 ohne Reserve, Kaltstart Seed 7 <= +3 % gegen main; arc42 (Meer-Platzierung vs. Tönung) und Kommentar in `decor.ts` Kopf (Zeile 35) nachgeführt | K4         |

K1+K2 im selben Lauf (ein Umsetzer `art-rendering-engineer`, sonst `tech-ui-engineer`); alle Tasks seriell, ein Umsetzer, ein Baum.

## Datei-Ownership

- `src/render/decor.ts` (Hunks: `SeaContext` ~866-888, `seaContext` ~897-928, neue Funktion nach `seaKeepOut` ~945, `ctxKey` ~1038, `seaPlan` `ok`/`ranked` ~1090-1112, Kopfkommentar ~35)
- `tests/render/decorSea.test.ts` (Z. ~377 Kommentar R367), neue `tests/render/seaKorridor.test.ts`, `tests/render/renderer.test.ts` (Pins ~1236-1374)
- `docs/arc42.md`, `docs/studio/rulings.md` (Ruling zum Pin, Lead), `docs/beobachtungen.md` (Eintrag schliessen)
- Nicht anfassen: `seaFields.ts`, `water.ts`, `terrainSea.test.ts`, `src/sim/`.

## Überschneidung mit ART-L8-SELTEN (`feat/l8-selten`)

L8 ändert in `decor.ts` die Hunks Z. 33-45, 122-137, 235-247, 348-416 (`rareEligible`, `planRare`), 663, 712-755 (`planPalms`), 1420-1436 (`tileKind`) und `tests/render/renderer.test.ts` (13 Zeilen). KORRIDOR liegt in Z. 860-1115: **textlich disjunkt**, aber `decor.ts` und `renderer.test.ts` sind beide Dateien; und L8 verschiebt Zeilennummern (+~80). Daher **seriell nach L8**: Start von K1 erst nach Merge von L8 auf main; Branch dann von neuem main. Pin-Konflikt in `renderer.test.ts`: K4 prüft L8-Pin-Stand.

## Budgetantrag (nach Formel)

4 Pakete-Einheiten (K1+K2, K3, K4, K5 = 4) x 2 = 8 Starts (Umsetzer + Review) + 0 Playtests (kein UI-Paket; Browser-Sichtprobe optional im Release-Check) + 1 Final-Review `opus` = 9, + 30 % = 12 Starts. Parallelität 1. Tools Richtwert ca. 100.

## Review

Je Task `qa-code-reviewer` (sonnet); Final-Review `opus` über die Branch (Pins, Determinismus, Perf-Zahlen mit Exit-Codes).
