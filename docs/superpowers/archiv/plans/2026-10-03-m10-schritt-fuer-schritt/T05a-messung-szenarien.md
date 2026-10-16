> **Task-ID:** Task 5 (Paket M10-B1) — Teil 1 von 3
> **AK-IDs:** AK-B1-01, -02 (BG-2), -03, -04 (Messwerte im Bericht)
> **blocked-by:** Task 4
> **Gemeinsame Regeln:** [index.md](index.md) (Global Constraints) · Orga: [orga-06-schnittstellen.md](orga-06-schnittstellen.md) · [orga-07-datei-ownership.md](orga-07-datei-ownership.md) · [orga-11-bitgleich.md](orga-11-bitgleich.md)
> **Teile:** **T05a-messung-szenarien.md** (diese) · [T05b-messung-szenarien.md](T05b-messung-szenarien.md) · [T05c-messung-szenarien.md](T05c-messung-szenarien.md)

## Task 5: B1 — Freischalt-Messung, M8-B1-Messung, Szenarien `m10-*` mit Prüfpunkten

**Paket** M10-B1 · **Implementierer** `tech-sim-engineer` (sonnet) · **Worktree/Branch** `.worktrees/m10-scen` ·
`feat/m10-scen` (ab Task-4-SHA) · **blocked-by** Task 4 · parallel zu Task 6 und R1 · **AK** AK-B1-01, -02 (BG-2),
-03, -04 (Messwerte im Bericht)

**Files:**

- Create: `tests/sim/unlock-timeline.test.ts`
- Modify: `tests/sim/scenarios.ts` (Szenarien `m10-*`, Prüfpunkte, `<name>.probes.json`), `tests/sim/scenario-saves.test.ts`
- Unverändert: `tests/sim/balance-merchants.test.ts`, `tests/sim/merchantsController.ts`, `tests/sim/controller.ts`
- Bewusst geändert: `scenario-saves.test.ts` Namensliste (M5:AK-S5-01) + sieben `m10-*`-Namen

**Interfaces:**

- Consumes: `prepareLayout`, `startColony`, `runColony` (`controller.ts`, nur lesen), `finishUnlocks` (Task 2),
  `placeTownhall`-Muster (Task 4), Helfer in `scenarios.ts` (`put`, `settledHouse`, `writeScenarios`).
- Produces: Szenarien und Prüfpunkte aus Spec 18.1 (Tabelle unten), Datei `<name>.probes.json` je Szenario aus 18.1
  (`Record<string, { x: number; y: number }>`, absolute Kacheln), Messwerte für die Ruling-Vorlage.

**Feste Prüfpunkte (Seed 3, `prepareLayout`: Kontor `(kx, ky)` = (32, 31); vorab geprüft: alle Plätze baubar, die
angebundenen grenzen an einen Layout-Weg):**

| Szenario                | Prüfpunkt       | relativ   | absolut  | Inhalt                                            |
| ----------------------- | --------------- | --------- | -------- | ------------------------------------------------- |
| alle `m10-*`            | `kontor`        | (0, 0)    | (32, 31) | Kontor                                            |
| `m10-pionier-fast-voll` | `haus3`         | (+3, −2)  | (35, 29) | Pionierhaus 3 EW (= `layout.houses[0]`)           |
| `m10-siedler-fast`      | `haus-voll`     | (+3, −2)  | (35, 29) | volles Pionierhaus                                |
| `m10-siedler-fast`      | `kapelle`       | (+6, −2)  | (38, 29) | Kapelle angebunden (= `layout.chapel`)            |
| `m10-wald`              | `wald`          | (+20, −7) | (52, 24) | unbebauter Wald                                   |
| `m10-wald`              | `weide`         | (+12, −3) | (44, 28) | unbebaute Weide, kein Weg                         |
| `m10-wald`              | `holzfaeller`   | (+19, −5) | (51, 26) | Holzfäller angebunden, Wald im Radius 2           |
| `m10-amtsstube`         | `amtsstube`     | (+11, −7) | (43, 24) | Amtsstube angebunden                              |
| `m10-amtsstube`         | `schule`        | (+6, +1)  | (38, 32) | Schule (= `layout.school`)                        |
| `m10-amtsstube`         | `werkzeug-mit`  | (+11, +1) | (43, 32) | Werkzeugmacher, Mittenabstand zur Schule 5        |
| `m10-amtsstube`         | `werkzeug-ohne` | (+17, +6) | (49, 37) | Werkzeugmacher, Mittenabstand 12,08 (> 10)        |
| `m10-amtsstube-aus`     | `amtsstube`     | (+3, −6)  | (35, 25) | Amtsstube **ohne** Weg; sonst wie `m10-amtsstube` |
| `galerie`               | `<defId>`       | —         | aus Bau  | je Gebäudetyp die Ursprungskachel                 |
