# M12 E1 — Abdeckung AK → Task

Einstieg [index.md](index.md). Spec Anhang 04 und Auflagen R228 (7), R230.

| AK        | Kurz                                                                  | Task (Test entsteht)                    | Testdatei / Ort                                     | Prüfart          |
| --------- | --------------------------------------------------------------------- | --------------------------------------- | --------------------------------------------------- | ---------------- |
| AK-E1-01  | 200 Seeds: A, B, Grösse, Merkmale, Garantien, Heimat nie `spice`      | T01 (Gelände), T02 (`canPlace`, Heimat) | `tests/sim/islands-gen.test.ts`                     | Vitest           |
| AK-E1-02  | Überlappung, Abstand ≥ 8, Band, Linien, Rahmen ≤ 300                  | T01                                     | `islands-gen.test.ts`                               | Vitest           |
| AK-E1-03  | Determinismus, Heimat = `generateMap`, nur Inselstrom neu             | T02                                     | `tests/sim/islands-rng.test.ts`                     | Vitest           |
| AK-E1-04  | Ersatzform nach 50 Versuchen (Testnaht)                               | T01                                     | `islands-gen.test.ts`                               | Vitest           |
| AK-E1-05  | `createWorld` v8, `save-v7.json` lädt, Round-trip                     | T00 (Fixture), T02                      | `tests/sim/save.test.ts`                            | Vitest           |
| AK-E1-06  | Ladeprüfung L01–L14, Fremdinsel mit Gebäuden lädt, `version 9`        | T02                                     | `save.test.ts`                                      | Vitest           |
| AK-E1-07  | Culling `visibleIslands`                                              | T03                                     | `tests/render/archipel.test.ts`                     | Vitest           |
| AK-E1-08  | `visibleTileRange` je Insel, Heimat gleich                            | T03                                     | `archipel.test.ts`                                  | Vitest           |
| AK-E1-09  | Picking je Insel, Meer `null`, Heimat gleich (50 Punkte)              | T03                                     | `archipel.test.ts`                                  | Vitest           |
| AK-E1-10  | Heimat-Aufrufliste gleich, unsichtbare Insel ohne Aufruf              | T05                                     | `tests/render/renderer.test.ts`                     | Vitest (fakeCtx) |
| AK-E1-11  | Cache-Plan: Erstbild nur Heimat, Scheiben ≤ 8 ms, Notfall             | T04 (Plan), T06 (Verdrahtung)           | `tests/render/cachePlan.test.ts`, `terrain.test.ts` | Vitest           |
| AK-E1-12  | Streichvariante `'jump'`, nur `src/render/`                           | T03 (Mathe), T05 (Renderer)             | `archipel.test.ts`, `renderer.test.ts`, Review      | Vitest + Review  |
| AK-E1-13  | `ZOOM_STEPS` 0,125 … 2, Mausrad, Grenze Rahmen + 8                    | T03, T06 (Mausrad)                      | `tests/render/camera.test.ts`; Browser T06          | Vitest + Browser |
| AK-E1-14  | R1 `renderMedian` B − A ≤ 0,2 ms, je Seed einzeln                     | T07                                     | `perf.mjs`, Ledger/PR                               | Messung          |
| AK-E1-15  | R2 Heimat-`buildMs` ≤ 1,3 × A                                         | T07                                     | `perf.mjs`                                          | Messung          |
| AK-E1-16  | R3 Zoom 0,125 ≤ 2 × Zoom 1 nach Aufwärmen (fest: `cachesReady` + 5 s) | T07                                     | `perf.mjs --warm`                                   | Messung (hart)   |
| AK-E1-17  | Sicht: keine Kante, alle Inseln in 1280 × 800, Mouse-over             | T06 (Karte), T07 (Check)                | `.studio/qa/M12-E1/`                                | Browser-Check    |
| AK-E1-18  | R4 kein Frame > 50 ms, Notfall-Frames getrennt                        | T06 (Sonde), T07                        | `perf.mjs --idle`                                   | Messung          |
| AK-E1-19  | R5 jede Scheibe ≤ 8 ms, Bedingungen fixiert (P-9)                     | T06 (Sonde), T07                        | `perf.mjs --idle`                                   | Messung          |
| AK-E1-20  | Meerkante: äusserste 2 Kacheln `waterDeep`, Wellen/Schaum 0           | T04                                     | `terrain.test.ts`, `water.test.ts`                  | Vitest           |
| AK-E1-21  | Speicher ≈ 44,5 MB in `limits.ts`, Faktor 2                           | T04                                     | `tests/render/limits.test.ts`                       | Vitest           |
| AK-E1-22  | Detailstufe ≤ 0,25, Viertel-Kopie; 0,5 wie heute                      | T05                                     | `renderer.test.ts`                                  | Vitest (fakeCtx) |
| AK-M12-B1 | `balance.test.ts` unverändert, grün                                   | alle (T08 Nachweis)                     | bestehend                                           | Vitest + Git     |
| AK-M12-B2 | Fingerabdruck, Pins; nur `normalized()` erweitert                     | T02, T08                                | `balance-crises.test.ts`                            | Vitest + Git     |
| AK-M12-B3 | `balance-merchants` `[6750, 11200, 320]`                              | alle (T08 Nachweis)                     | bestehend                                           | Vitest           |
| AK-M12-B4 | Krisen- und Auftragsfolge unverändert                                 | T02 (Spy), T08                          | `islands-rng.test.ts`, `balance-crises.test.ts`     | Vitest           |
| AK-M12-B5 | Kette v1 … v7 → v8, `version 9` unbekannt                             | T00 (Fixture), T02, T08                 | `save.test.ts`                                      | Vitest           |

**Auflagen → Ort im Plan:**

- R228 (7) lead-tech **B6**: `createWorld` ≤ 5 ms → T02 (`perfBudget(5)`); `Math.sqrt` → T01 (Regel + Test); kaputter
  `seed` → T02 (`migrateV7ToV8` wirft nie, Garbage-Fälle, L-Prüfung). B3/B5 betreffen E4/v9, B4 (`GOOD_IDS` idempotent)
  E3 — nicht E1.
- R228 (5) Render-Auflagen lead-art: Scheiben ≤ 8 ms → T04/T06/T07 (P-8); Messaufbau `--focus home` → T07; Meerkante
  → T04 (AK-E1-20); `limits.ts` → T04 (AK-E1-21); Detailstufe ≤ 0,25 + Viertel-Kopie → T04/T05 (AK-E1-22); R4 ≤ 50 ms →
  T07 (AK-E1-18). Schiffe in Tiefensortierung: E4.
- lead-qa Teil B (R228, R230): Fixture `save-v7.json` als erster Umsetzungs-Commit → T00; Kette und „Unbekannte Version"
  → T02; AK-E1-14 je Seed einzeln → T07; Aufwärmen AK-E1-16 → P-9, T07; Notfall-Frames AK-E1-18 → T06/T07;
  Messbedingungen AK-E1-19 → P-9, T07. Übrige Teil-B-Punkte: Seefahrt-Bündel.
- **Reihenfolge** (R228, R230): T03–T08 `blocked-by` REL-03 auf `main`; Sim T00–T02 nach E0-T03/T04.
- **Migration v7 → v8 mit Fixture und Test:** T00 (`save-v7.json`), T02 (AK-E1-05, Kette, Round-trip).
