> Teil des Plans M10, Einstieg und Task-Tabelle: [index.md](index.md). **Gemeinsame Regeln:** index.md (Global Constraints).

### Bewusst geänderte Tests

Spec 20 nennt die Dateien; die Zeilen ermittelt jeder Implementierer **per Lauf** (`npx vitest run` nach der
Umsetzung, rote **bestehende** Tests). Erlaubt sind nur diese Änderungsarten; jede andere Stelle ist ein Befund an
den Controller, keine eigenmächtige Anpassung:

| Art  | Erlaubte Änderung                                                                                                                                                                                                                     | Task  |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| T-1  | `version` 4 → 5 in Erwartungen; „Unbekannte Version" mit `version 5` → `version 6` (`save.test.ts`)                                                                                                                                   | 1     |
| T-2  | Erwartungen, die `createWorld(…)` oder `serialize` vollständig vergleichen, um `unlocked: ['U0'], goodLocks: [], upgradeStops: []` ergänzen; Ketten-Erwartungen v1/v2/v3 → v5-Felder aus `deriveUnlocks`                              | 1     |
| T-3  | `normalized()` in `balance-crises.test.ts` entfernt zusätzlich `unlocked`, `goodLocks`, `upgradeStops` (Spec 9.2), sonst Zeichen für Zeichen gleich                                                                                   | 1     |
| T-4  | In Tests mit gesperrten Bauten: `createWorld(s)` → `createWorld(s, { unlockAll: true })` bzw. `{ crisisLevel, unlockAll: true }`. **Nicht** in `balance.test.ts`, `balance-crises.test.ts`, `controller.ts`, `merchantsController.ts` | 2     |
| T-5  | M8-Tests, die `won = true` von Hand setzen und danach `buildLock`/`canPlace` für Badehaus/Glashütte prüfen: zusätzlich `w.unlocked = deriveUnlocks(w)` (W3) bzw. `finishUnlocks(w)`                                                   | 2     |
| T-6  | `tests/sim/helpers.ts` `placeService` und `tests/sim/scenarios.ts`: der M8-`won`-Trick bzw. `withUnlock` entfällt; Welten mit `unlockAll`, am Ende `finishUnlocks` (Spec 10)                                                          | 2     |
| T-7  | `tests/ui/goal.test.ts`: Tests von `unlockNotice`/`initialUnlockShown` werden zu Tests von `unlockNoticeText` mit gleichem Zweck (Zahl der `it` gleich oder höher)                                                                    | 6     |
| T-8  | `defs.test.ts` `BUILDING_IDS` `toHaveLength(16)` → `17`; `fire.test.ts` brennbare Ids + `'townhall'`; `hotkeys.test.ts` `TOOL_HOTKEYS` `toHaveLength(17)` → `18` (T4) → `20` (T7)                                                     | 4, 7  |
| T-9  | `queries.test.ts` (M6:AK-S3-07): Name „… Bau, Abriss, Weg und Anbindung" → „… und Geländewechsel", Erwartungen gleich                                                                                                                 | 3     |
| T-10 | `taxes.test.ts`, `population.test.ts`: Steuerfälle mit `'high'`/`'low'` bekommen eine aktive Amtsstube (Helfer `placeTownhall` in `tests/sim/helpers.ts`, Task 4), Sollwerte gleich                                                   | 4     |
| T-11 | `hotkeys.test.ts` (M7:AK-UX-06) `hotkeyList()` → `hotkeyList(createWorld(3, { unlockAll: true }))`; `tooltip.test.ts`/`buildMenu`-Zählung (M7:AK-UX-16, M8:AK-U2-06/-10) auf `unlockAll` bzw. `finishUnlocks`, Sollzahlen gleich      | 2, 6  |
| T-12 | `sprites.test.ts` Fensteranker: Erwartungseintrag `roofOnly.townhall` für den Rückfall, falls verlangt (AK-S2-15), in R1 auf die eigene Silhouette                                                                                    | 4, R1 |
| T-13 | `scenario-saves.test.ts` „AK-S5-01 die Szenario-Namen sind genau die vereinbarten": Liste + sieben `m10-*`; `galerie`-Test (Gebäudezahl) + Amtsstube                                                                                  | 4, 5  |

Jeder Implementierer listet im Bericht jede geänderte bestehende Testzeile mit Art (T-n); der Reviewer gleicht ab.
**Fremde Dateien (R164 B3):** Trifft der Lauf eine Testdatei, die nicht in der Ownership-Zeile des eigenen Tasks
steht (z. B. `tests/sim/queries.test.ts` aus Task 3 oder `tests/render/*`, wo parallel H-R3/H-R4 arbeiten), ändert
der Implementierer sie **nicht**, sondern meldet Datei, Test und Grund dem Controller; der Controller entscheidet
(Änderung im Task mit Vermerk im Ledger oder Verschiebung zum Owner).
