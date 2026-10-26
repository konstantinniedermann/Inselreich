# T00 · Testzeit-Ausgang und Proben (R392, beim Plan gemessen)

Controller · kein Agent-Start · gemessen 2026-10-25 21:15–21:22 auf `plan/hafen` (= main `8fb2a1e0` + Spec-Merge, kein `src/`-Diff) · **1-min-Last 7,3 → 4,3:
Zeiten nicht belastbar für A/B (R803).** **T01 Schritt 0** (Nachtrag R945) wiederholt den Lauf «Ausgang» vor dem ersten Code-Schritt, **Last ≤ 4 nötig**, sonst
`waiting`, und trägt die Werte hier nach. K2-Testzeit (R392/R905, E-HF-6): Liste der betroffenen Tests mit Messwert in `N-nachtrag-r945.md` §3.

## Kandidatenliste (81 Dateien)

Alle `*.test.ts` mit `createWorld`/Szenario **und** einem Bezug auf Fremdinseln, Anker, Lanes, Fahrzeiten oder Schiffe, dazu `seaGolden`, `routeBalance`, `farOrder-sea`,
`shipLane`. Neu erzeugen mit:

```bash
for f in $(rg -l "createWorld\(|newWorld|seedWorld|scenario" tests); do n=$(grep -cE "islands\[[123]\]|islands\.slice\(1|island: [123]\b|'kontor2'|seaRoute|lanePoints|laneTicks|seaLanes|homeTravel|islandCard|\.ox\b|\.oy\b|anchor|kontorSite|shipPose|tickShips|setRoute|FAR|farOrder|worldHash|hashWorld|fingerprint" $f); [ "$n" -gt 0 ] && echo "$f"; done | grep "\.test\.ts$"; ls tests/sim/{seaGolden,routeBalance,farOrder-sea}.test.ts tests/render/shipLane.test.ts
```

## Lauf «Ausgang»

`npx vitest run <81 Dateien> --maxWorkers=3` → **Exit 0**, 1850 Tests, 1847 bestanden, 3 übersprungen, Wand 52 s.

| Datei (Dateizeit > 2 s)             | s    | langsamster Test (ms)                |
| ----------------------------------- | ---- | ------------------------------------ |
| `tests/render/renderer.test.ts`     | 16,0 | L4 Deko-Culling 3955                 |
| `tests/render/decor.test.ts`        | 8,1  | –                                    |
| `tests/render/decorSea.test.ts`     | 7,7  | L5-T3 `shipAt` trifft nie Wrack 2132 |
| `tests/sim/islands-gen.test.ts`     | 6,7  | AK-E1-02 Seeds 1…200 730             |
| `tests/render/seaPlanKeepOutIndex`  | 5,6  | RF-P2 Seeds 1–40 5125                |
| `tests/sim/save.test.ts`            | 5,3  | –                                    |
| `tests/sim/islands-seeds-a.test.ts` | 4,0  | AK-M14E1-12 Block ab 1: 517          |
| `tests/sim/balance-crises.test.ts`  | 3,6  | AK-BAS-02 677                        |
| `tests/render/seaKorridor.test.ts`  | 3,2  | AK-K1b Teilhash 1914                 |
| `tests/sim/islands-seeds-b.test.ts` | 3,1  | AK-M14E1-12 Block ab 501: 654        |
| `tests/sim/scenario-saves.test.ts`  | 2,6  | AK-S5-01 1084                        |
| `tests/sim/seaRoute.test.ts`        | 2,6  | Küstenabstand 628                    |
| `tests/sim/islands-c.test.ts`       | 2,1  | Stufe 3 Spanne Seeds 1..300 1082     |
| `tests/sim/balance-edicts.test.ts`  | 2,1  | PLAN-M13-01 671                      |

## Probe «Welt» (Stellvertreter für S2) und «Ticks» (Stellvertreter für S3)

Ohne `src/`-Änderung per `vi.mock` in einer Setup-Datei (Konfiguration unter `.probe/`, nicht committet): `ISLANDS_SALT` ersetzt (alle Fremdinseln anders) bzw.
`SHIP_TICKS_PER_SEA_TILE` 10 → 11 (alle Fahrzeiten anders). **Welt: 50 Tests rot in 15 Dateien; Ticks: 19 Tests rot in 6 Dateien.** Die Namenslisten stehen in T06
(Welt) und T07 (Ticks); Ausgang war grün. Die Liegezeit (S4) hat keinen Stellvertreter: T10 läuft die Kandidatenliste.

## Probe «Ersatzlagen» und K2-Prototyp (AK-HF-11/-12, Plan-Auflage 3)

`generateForeignIslands(world.seed, home, { onStage })` über Seeds 1–40 (120 Fremdinseln), Last 4,3–5,6:

| Lauf                                                      | Stufe 1 | Stufe 2 | **Stufe 3**   | Generator ms Median / Max | Routen je Welt Median / Max |
| --------------------------------------------------------- | ------- | ------- | ------------- | ------------------------- | --------------------------- |
| **main heute** (d-Bänder)                                 | 119     | 1       | **0 (0 %)**   | 1,6 / 5,5                 | 0                           |
| K2 naiv (nur L-Prüfung, Kandidaten wie heute)             | 79      | 3       | 38            | 233 / 815                 | 34 / 107                    |
| K2, Kandidaten-Spanne `dMin − 10`                         | 82      | 3       | 35            | 224 / 1005                | 31 / 103                    |
| K2 + 1 Korrekturschritt (Stufe 1 und 2)                   | 108     | 3       | 9             | 76 / 276                  | 11 / 41                     |
| **K2 + 3 Korrekturschritte, Nachprüfung früherer Inseln** | 113     | 1       | **6 (5,0 %)** | **73 / 270**              | 11 / 41                     |

Heute in den L-Bändern (fertige Welt): A 7/40, B 12/40, C 9/40 (deckt Anhang 01 B). Ausfälle im besten Lauf: Seeds 18, 28, 30, 31, 32, 38, **alle Insel C**.
`createWorld` heute: Median 3,8 ms, Max 20 ms. Folgerung: P-3 bis P-6 im Index.

Prototyp (Kopie von `islands.ts` mit Bandprüfung über `seaRoute`, Korrektur `t ← t + (Bandmitte − L)`): nicht im Repo; das Verfahren steht vollständig in T05.
