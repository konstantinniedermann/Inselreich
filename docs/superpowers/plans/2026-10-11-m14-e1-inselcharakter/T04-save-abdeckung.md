# T04 · Save v13: Kette, Ladeprüfung, Rückfaltung, Inkompatibel, Schiff unterwegs (TDD)

Strang SIM · Worktree `.worktrees/m14-e1` · Umsetzer `tech-sim-engineer` (sonnet) · AK-M14E1-22, -23 (a–f), -24
(b–g), -25, -42 · Auflagen Tech-B3 (Test), Tech-B8 · blocked-by T03 · parallel zu T06 (getrennte Dateien) ·
≈ 35 Tools · Anhang 02 C, D, F · Entscheidungen E3, E4

**Zweck:** Die Randfälle des Versionssprungs abdecken. Die Prüfungen L1–L4 bestehen schon (`isValidIslands`,
`isValidForeign`, `hasValidIslandIndex` lesen `ISLANDS`); neu ist die Testabdeckung. Codeänderung nur, wenn ein Test
einen echten Fehler zeigt (dann Meldung im Bericht).

## Files

- Modify: `tests/sim/save-v13.test.ts`, `tests/sim/helpers.test.ts`.
- Modify nur bei rotem Test mit Befund: `src/sim/save.ts`, `tests/sim/helpers.ts`.

## Schritte

- [ ] 0. `grep -n "function isValidIslands\|function isValidForeign\|hasValidIslandIndex\|friendlyReason" src -r`;
      Fixtures: `ls tests/sim/fixtures/save-v*.json`.
- [ ] 1. Tests (vor der Umsetzung laufen lassen; was schon grün ist, ist Abdeckung, was rot ist, Befund):
  - **AK-22:** jede Fixture v1 … v12 → `version` 13, genau 4 Inseln, Insel 3 `'C'`; die v7-Fixture bekommt C in
    `migrateV7ToV8` (Test: `migrateV7ToV8` allein auf der v7-Fixture → `islands.length === 4`) und kein fünftes
    Element nach der ganzen Kette. **Tech-B8:** v8-Fixture nach `migrateV8ToV9` → `islands[3].stock.spice === 0`;
    nach `migrateV11ToV12` → `islands[3].reserve` `{ wood 0, stone 0 }`.
  - **AK-23a–f** (Anhang 02 F): Version 13 mit 3 Inseln; 5 Inseln (Insel 3 doppelt); Insel 3 `kind 'B'` sowie Insel 2
    und 3 vertauscht; Insel 3 `width 36`; Gebäude `island 4`; Vorversion mit `islands` kein Array bzw. Heimat ohne
    `anchor` → je `{ ok: false, reason: 'Beschädigter Spielstand' }`, kein Wurf.
  - **AK-24b–g** (Anhang 02 F): unbekannter Weltschlüssel `foo`; Insel 3 mit `kontorId`; `stock.cane 1`; Kachel
    `road true` und Gebäude `island 3`; Schiff mit Route 1–3; Insel 1 mit Zusatzschlüssel `x: 0` (entfernt) und
    Insel 2 mit abweichender Folge (bleibt). Fehlertexte wörtlich `foldBackToV12: …` (Anhang 02 D).
  - **AK-25:** `version` 14 → `'Unbekannte Version'`; `{"version": ` → `'Ungültiges Format'`; Migration mit kaputter
    Heimat → kein Wurf, `'Beschädigter Spielstand'`; `friendlyReason` je nicht leer.
  - **AK-42** (`tests/sim/save.test.ts` ist Hot Spot → hier in `save-v13.test.ts`): Welt Seed 3, Kontor II auf
    Möweninsel, Schiff mit Route 0–1 unterwegs (`to !== null`, `left > 0`) → `foldBackToV12` → `deserialize`:
    `port`, `to`, `left`, `cargo`, `route`, `homing` tief gleich; nach `left` Schritten Ankunft im selben Tick wie im
    ungemigrierten Vergleich (`step` auf der Originalwelt), gleiche Fracht gelöscht (Lager der Zielinsel gleich).
  - **Tech-B3 (Test der Abweichung):** gespeicherte B verschoben, sodass die neu berechnete C′ B überlappen würde →
    `fitIsland` greift, Ergebnis ohne Überlappung, Lücke ≥ `ISLAND_GAP_MIN`.
- [ ] 2. `npx vitest run tests/sim/save-v13.test.ts tests/sim/helpers.test.ts; echo EXIT=$?`.
- [ ] 3. Rote Fälle beheben (kleinste Änderung) oder als Befund melden, wenn die Spec sie anders will.
- [ ] 4. Grün plus `tests/sim/save*.test.ts`. `npx tsc --noEmit; echo EXIT=$?`, `make lint; echo EXIT=$?`.
      Commit `test: Save v13 Ladeprüfung, Rückfaltung, Kette (M14-E1 T04)`.

## Hinweise

- Testzeit: je Test < 200 ms; die Fixture-Kette (AK-22) als `it.each` je Fixture.
- Schiff unterwegs: Helfer `shipLiteral` aus `tests/sim/seaHelpers.ts`; keine neuen Helfer in `helpers.ts`.
