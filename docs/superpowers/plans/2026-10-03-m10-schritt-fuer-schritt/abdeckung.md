> Teil des Plans M10, Einstieg und Task-Tabelle: [index.md](index.md). **Gemeinsame Regeln:** index.md (Global Constraints).

## Abdeckung AK → Task

Vitest-Tests heissen wie die AK-Nummer und stehen in `describe('M10 …')`; Browser-AK prüft der genannte QA-Schritt.
Gegenprobe: Abschnitt „Grep-Gegenprobe" unter der Tabelle.

| AK       | Task / Check                                       | Nachweis                                                                              |
| -------- | -------------------------------------------------- | ------------------------------------------------------------------------------------- |
| AK-S1-01 | Task 1 (U3-Zeile Task 4)                           | `tests/sim/unlocks.test.ts` „AK-S1-01 UNLOCKS …"                                      |
| AK-S1-02 | Task 1                                             | `tests/sim/unlocks.test.ts` „AK-S1-02 createWorld …"                                  |
| AK-S1-03 | Task 1                                             | `tests/sim/unlocks.test.ts` vier Tests „AK-S1-03 …"                                   |
| AK-S1-04 | Task 1                                             | `tests/sim/unlocks.test.ts` „AK-S1-04 monoton …"                                      |
| AK-S1-05 | Task 1; lead-tech nach Task 2                      | `tests/sim/unlocks.test.ts` „AK-S1-05 (a)/(b)/(c)"; Review ADR-005-Nachtrag, arc42 §6 |
| AK-S1-06 | Task 2                                             | `tests/sim/unlocks.test.ts` „AK-S1-06 Bausperre …"                                    |
| AK-S1-07 | Task 2                                             | `tests/sim/unlocks.test.ts` „AK-S1-07 …"                                              |
| AK-S1-08 | Task 2                                             | `tests/sim/unlocks.test.ts` „AK-S1-08 Kauf …"                                         |
| AK-S1-09 | Task 2                                             | `tests/sim/unlocks.test.ts` „AK-S1-09 Auftrag …"                                      |
| AK-S1-10 | Task 1 (`taxBlocks` Task 4)                        | `tests/sim/unlocks.test.ts` „AK-S1-10 …"                                              |
| AK-S1-11 | Task 1                                             | `tests/sim/save.test.ts` „AK-S1-11 Round-trip v5 …"                                   |
| AK-S1-12 | Task 1                                             | `tests/sim/save.test.ts` „AK-S1-12 save-v4.json …" (+ AK-S2-04 Fixture-Teil, Task 4)  |
| AK-S1-13 | Task 1                                             | `tests/sim/save.test.ts` „AK-S1-13 Kette …"                                           |
| AK-S1-14 | Task 1 (a, b, c1, d–g); Task 4 (c2)                | `tests/sim/save.test.ts` „AK-S1-14 …", „AK-S1-14 (c2) …" (W2)                         |
| AK-S1-15 | Task 1                                             | `tests/sim/save.test.ts` „AK-S1-15 Negativfälle …"                                    |
| AK-S1-16 | Tasks 1–4 (BG-1), Final-Review (BG-3)              | `balance.test.ts` ohne Diff, `balance-crises.test.ts`; Werte im Ledger                |
| AK-S1-17 | Task 2 (BG-1 ab Task 2)                            | `tests/sim/unlocks.test.ts` „AK-S1-17 …"                                              |
| AK-S1-18 | Task 2                                             | `tests/sim/unlocks.test.ts` „AK-S1-18 Feuerwache …"                                   |
| AK-S1-19 | Task 2                                             | `tests/ui/guide.test.ts` „AK-S1-19 …"                                                 |
| AK-S1-20 | Task 1 (Fixture); lead-tech nach Task 2 (arc42 §8) | erster Commit `feat/m10-sim` (W1); Review arc42 §8 Persistenz                         |
| AK-F1-01 | Task 3                                             | `tests/sim/forest.test.ts` „AK-F1-01 …"                                               |
| AK-F1-02 | Task 3                                             | `tests/sim/forest.test.ts` „AK-F1-02 …"                                               |
| AK-F1-03 | Task 3                                             | `tests/sim/forest.test.ts` „AK-F1-03 …"                                               |
| AK-F1-04 | Task 3                                             | `tests/sim/forest.test.ts` „AK-F1-04 …" (Fallliste `CASES`)                           |
| AK-F1-05 | Task 3                                             | `tests/sim/forest.test.ts` „AK-F1-05 …"                                               |
| AK-F1-06 | Task 3                                             | `tests/sim/forest.test.ts` „AK-F1-06 …"                                               |
| AK-F1-07 | Task 3                                             | `tests/sim/forest.test.ts` „AK-F1-07 …"                                               |
| AK-F1-08 | Task 3                                             | `tests/sim/forest.test.ts` „AK-F1-08 …"; `queries.test.ts` (T-9)                      |
| AK-F1-09 | Task 3 (a); Task 4 (b)                             | `forest.test.ts` „AK-F1-09 (a) …"; `townhall.test.ts` „AK-F1-09 (b) …" (W4)           |
| AK-F1-10 | Task 3                                             | `tests/sim/forest.test.ts` „AK-F1-10 …"                                               |
| AK-S2-01 | Task 4                                             | `tests/sim/townhall.test.ts` „AK-S2-01 …"; `fire.test.ts` (T-8)                       |
| AK-S2-02 | Task 4                                             | `tests/sim/townhall.test.ts` „AK-S2-02 …"                                             |
| AK-S2-03 | Task 4                                             | `tests/sim/townhall.test.ts` „AK-S2-03 …"                                             |
| AK-S2-04 | Task 4                                             | `tests/sim/townhall.test.ts` „AK-S2-04 …"                                             |
| AK-S2-05 | Task 4                                             | `tests/sim/townhall.test.ts` „AK-S2-05 …"; `taxes.test.ts` (T-10)                     |
| AK-S2-06 | Task 4                                             | `tests/sim/townhall.test.ts` „AK-S2-06 …"                                             |
| AK-S2-07 | Task 4                                             | `tests/sim/townhall.test.ts` „AK-S2-07 …"                                             |
| AK-S2-08 | Task 4                                             | `tests/sim/townhall.test.ts` „AK-S2-08 …"                                             |
| AK-S2-09 | Task 4                                             | `tests/sim/townhall.test.ts` „AK-S2-09 …"                                             |
| AK-S2-10 | Task 4                                             | `tests/sim/townhall.test.ts` „AK-S2-10 …"                                             |
| AK-S2-11 | Task 4                                             | `tests/sim/townhall.test.ts` zwei Tests „AK-S2-11 …"                                  |
| AK-S2-12 | Task 4                                             | `tests/sim/townhall.test.ts` „AK-S2-12 …"                                             |
| AK-S2-13 | Task 4 (Kann K1)                                   | `tests/sim/townhall.test.ts` „AK-S2-13 …"                                             |
| AK-S2-14 | Task 4 (BG-1)                                      | AK-S1-16 und AK-S1-17 grün nach Task 4; Werte im Ledger                               |
| AK-S2-15 | Task 4                                             | `tests/render/sprites.test.ts` „AK-S2-15 …"                                           |
| AK-S2-16 | Task 4; QA-U1 Schritt 12                           | `tests/ui/hotkeys.test.ts` „AK-S2-16 …"; Browser (R164 QA 3)                          |
| AK-S2-17 | Task 4                                             | `tests/ui/inspect.test.ts` bzw. `tooltip.test.ts` und `hints.test.ts` „AK-S2-17 …"    |
| AK-B1-01 | Task 5                                             | `tests/sim/unlock-timeline.test.ts` „AK-B1-01 …" (off, normal)                        |
| AK-B1-02 | Task 5 (BG-2)                                      | `balance-merchants.test.ts` unverändert grün, Werte gegen R162 im Bericht             |
| AK-B1-03 | Task 5                                             | `tests/sim/scenario-saves.test.ts` drei Tests „AK-B1-03 …"                            |
| AK-B1-04 | Task 5, Abschluss                                  | Bericht Task 5, Ruling-Vorlage B1 (Review)                                            |
| AK-R1-01 | R1                                                 | `tests/render/terrain.test.ts` „AK-R1-01 …"                                           |
| AK-R1-02 | R1                                                 | `tests/render/iso.test.ts` „AK-R1-02 …"                                               |
| AK-R1-03 | QA-U2 Schritt 5                                    | Pixelvergleich und `terrainStats.patches` (≤ 100 ms) bei DPR 2                        |
| AK-R1-04 | R1; QA-ART Schritt 2                               | `tests/render/sprites.test.ts` „AK-R1-04 …" + Fensteranker; Blindtest                 |
| AK-R1-05 | R1; Task 8 (Kommentar `life.ts`)                   | `tests/render/terrain.test.ts` „AK-R1-05 …"; Review Kommentare (R164 B5)              |
| AK-A1-01 | A1                                                 | `tests/ui/icons.test.ts` „AK-A1-01 …"                                                 |
| AK-A1-02 | A1                                                 | `tests/ui/icons.test.ts` „AK-A1-02 …"                                                 |
| AK-A1-03 | QA-ART Schritt 1                                   | Blindtest ≥ 20/24; Anmutung lead-art                                                  |
| AK-U1-01 | Task 6; QA-U1 Schritt 1                            | `tests/ui/tooltip.test.ts` „AK-U1-01 …"; Browser                                      |
| AK-U1-02 | Task 6; QA-U1 Schritt 2                            | `tests/ui/goal.test.ts` „AK-U1-02 …"; Browser                                         |
| AK-U1-03 | Task 6; QA-U1 Schritt 3                            | `tests/ui/hotkeys.test.ts` „AK-U1-03 …"; Browser                                      |
| AK-U1-04 | Task 6; QA-U1 Schritt 4                            | `tests/ui/hud.test.ts` „AK-U1-04 …"; Browser                                          |
| AK-U1-05 | Task 6; QA-U1 Schritt 5                            | `tests/ui/hud.test.ts` „AK-U1-05 …"; Browser                                          |
| AK-U1-06 | Task 6; QA-U1 Schritt 6                            | `tests/ui/trade.test.ts` „AK-U1-06 …"; Browser                                        |
| AK-U1-07 | Task 6; QA-U1 Schritt 7                            | `tests/ui/order.test.ts` „AK-U1-07 …"; Browser                                        |
| AK-U1-08 | Task 6                                             | `tests/ui/goal.test.ts` „AK-U1-08 …"                                                  |
| AK-U1-09 | QA-U1 Schritt 8; Task 6 (`RF-4`)                   | Browser; `frameUnlock` in `goal.test.ts`                                              |
| AK-U1-10 | Task 6; QA-U1 Schritt 9                            | `tests/ui/settings.test.ts` „AK-U1-10 …"; Browser                                     |
| AK-U1-11 | Task 6; QA-U1 Schritt 10                           | `tests/ui/hud.test.ts` „AK-U1-11 …", `devProbes.test.ts`; Browser                     |
| AK-U1-12 | Task 6                                             | `tests/ui/soundEvents.test.ts` „AK-U1-12 …"                                           |
| AK-U1-13 | Task 6; QA-U1 Schritt 11                           | `tests/ui/hud.test.ts` „AK-U1-13 …"; Browser                                          |
| AK-U2-01 | Task 7                                             | `tests/ui/startCard.test.ts` „AK-U2-01 …"                                             |
| AK-U2-02 | Task 7                                             | `tests/ui/guide.test.ts` „AK-U2-02 …"                                                 |
| AK-U2-03 | QA-U2 Schritt 1                                    | Browser                                                                               |
| AK-U2-04 | QA-U2 Schritt 2                                    | Browser                                                                               |
| AK-U2-05 | QA-U2 Schritt 3                                    | Browser                                                                               |
| AK-U2-06 | QA-U2 Schritt 4                                    | Browser                                                                               |
| AK-U2-07 | Task 7                                             | `tests/ui/tooltip.test.ts` bzw. `hints.test.ts` „AK-U2-07 …"                          |
| AK-U2-08 | QA-U2 Schritt 7                                    | Browser (K1-Teil nur ohne Streichung)                                                 |
| AK-U2-09 | QA-U2 Schritt 8                                    | Browser                                                                               |
| AK-U2-10 | Task 7                                             | `tests/ui/hints.test.ts` „AK-U2-10 …"                                                 |
| AK-U2-11 | Task 7; QA-U2 Schritt 9                            | `tests/ui/crisisLog.test.ts` „AK-U2-11 …" (Kann K4); Browser                          |
| AK-U2-12 | Task 7; QA-U2 Schritt 10                           | `tests/ui/hotkeys.test.ts` „AK-U2-12 …"; Browser                                      |
| AK-U3-01 | Task 8                                             | `tests/ui/hover.test.ts` „AK-U3-01 …"                                                 |
| AK-U3-02 | Task 8                                             | `tests/ui/hover.test.ts` „AK-U3-02 …"                                                 |
| AK-U3-03 | Task 8                                             | `tests/ui/hover.test.ts` „AK-U3-03 …"                                                 |
| AK-U3-04 | Task 8; QA-U3 Schritt 1                            | `tests/ui/hover.test.ts` „AK-U3-04 (Vitest-Teil) …"; Browser                          |
| AK-U3-05 | QA-U3 Schritt 2                                    | Browser                                                                               |
| AK-U3-06 | Task 8                                             | `tests/ui/hover.test.ts` „AK-U3-06 …"                                                 |
| AK-U4-01 | Task 9; QA-U4 Schritt 1                            | `tests/ui/hud.test.ts` „AK-U4-01 …"; Browser                                          |
| AK-U4-02 | QA-U4 Schritt 2                                    | Browser                                                                               |
| AK-U4-03 | QA-U4 Schritt 3                                    | Browser                                                                               |
| AK-U4-04 | Task 9; QA-U4 Schritt 4                            | `tests/ui/tooltip.test.ts` „AK-U4-04 …" (Kann K2); Browser                            |
| AK-U4-05 | QA-U4 Schritt 5                                    | Browser, Blindtest (Kann K3)                                                          |
| AK-D1-01 | D1                                                 | Review README                                                                         |
| AK-D1-02 | D1                                                 | Review arc42                                                                          |
| AK-D1-03 | D1                                                 | Review Hauptspec                                                                      |

**Review Focus und Planentscheid:** `RF-1` Task 1 (`save.test.ts`), `RF-2` Task 4 (`townhall.test.ts`), `RF-3` Task 3
(`forest.test.ts`), `RF-4` Task 6 (`goal.test.ts`), `RF-5` Task 7 (`inspect.test.ts`), `PLAN-B9` Task 4
(`imports.test.ts`).

**Grep-Gegenprobe** (vom Controller vor dem Gate Plan ausgeführt; Ergebnis im Bericht):

```bash
SPEC=docs/superpowers/specs/2026-10-03-m10-schritt-fuer-schritt-spec.md
PLAN=docs/superpowers/plans/2026-10-03-m10-schritt-fuer-schritt.md
diff <(grep -oE '^- \*\*AK-[A-Z0-9]+-[0-9]+' $SPEC | sed 's/- \*\*//' | sort -u) \
     <(awk '/^## Abdeckung AK → Task/,/^\*\*Review Focus/' $PLAN | grep -oE '^\| AK-[A-Z0-9]+-[0-9]+' | sed 's/| //' | sort -u) \
  && echo "keine Lücke"
```
