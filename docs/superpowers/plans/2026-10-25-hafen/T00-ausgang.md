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

## Ausgang gemessen (T01 Schritt 0, 2026-10-26, main `07cd8183`)

83 Dateien (`.probe/files.txt`), `--maxWorkers=3`: Exit 0, 1944 Tests (1941 grün, 3 übersprungen), Wand 51 s. 1-min-Last vor dem Lauf 3,37 (kein fremder vitest), nachher 8,58 (eigener Lauf). Dateien > 5 s: renderer 13,1; massif 12,9; decorSea 6,9; decor 6,7; islands-gen 5,5; decorStamps 5,4. Tests > 500 ms (ms):

- 4600 · `decorStamps.test.ts` · R5 Solitär ≥ 2 Kacheln vom Wald und ≤ 1 je 3 × 3 (Seeds 1–50), auch na
- 4126 · `seaPlanKeepOutIndex.test.ts` · RF-P2 jede Kachel der Heimat, Seeds 1-40, alle pads: Antwort gleich de
- 3321 · `renderer.test.ts` · L4 Deko-Culling: eine Kachel hinter range gezeichnet, zwei nicht; unte
- 2282 · `massif.test.ts` · L2 C5 Alpenwiese: Blütenpunkte (FLOWER_TONES) nur auf Bewuchsflecken,
- 1923 · `decorSea.test.ts` · L5-T3 Schiffe am Anker und am nächsten Lane-Punkt jedes Elements; Bild
- 1914 · `massif.test.ts` · L2 Sockel: Rauschenergie im Schuttband bei Zoom 2 ≤ 0,5 × Fixture-Wert
- 1688 · `massif.test.ts` · A4 keine Antialias-Nähte: gerastert ist jeder Pixel deckend, dessen Ab
- 1551 · `seaKorridor.test.ts` · AK-K1b Teilhash (R557): ohne Insel C sind die Flaechen bitgleich zur B
- 1339 · `massif.test.ts` · L2 Bäume im Raster: Stamm (earthEdge) und Krone (crown/crownLight) ers
- 1098 · `massif.test.ts` · L2 Schnee im Raster: helle Pixel auf grossen Massiven, nie heller als
- 1091 · `decorSea.test.ts` · Tönung der Wasserfelder ist an der R4-Grenze 0: Seeds 1–20 kein getönt
- 951 · `groundBeach.test.ts` · D9 Kiste/Flaschenpost: 10–20 % der Seeds 1–200, nie zweimal, am Spülsa
- 938 · `groundBeach.test.ts` · D5 Dünenküste hat deutlich mehr Strandhafer als die Palmenküste (Mitte
- 876 · `islands-c.test.ts` · Spanne protokollieren (Seeds 1..300)
- 873 · `renderer.test.ts` · RF-7 nach render(): save/restore ausgeglichen, Matrix wie vor dem Aufr
- 870 · `scenario-saves.test.ts` · AK-S5-01 jedes Szenario ist ladbar und Version 2
- 675 · `massif.test.ts` · Bergsee nur in einer Mulde (Steilheit < 0,2, hn 0,4–0,7)
- 627 · `archipel.test.ts` · AK-E1-17 Seeds 1…200: Rahmen bei Zoom 0,125 passt in 1280 × 800, Übers
- 622 · `renderer.test.ts` · AK-R4-03 Herdrauch nur Morgen und Abend, nur bewohnte Häuser; Rauch-Bu
- 604 · `islands-gen.test.ts` · AK-E1-02: Lage, Lücken, Seewege und Rahmen für Seeds 1…200
- 592 · `islands-gen.test.ts` · D-139: d zählt nur die Strecke ausserhalb der Inselrechtecke
- 582 · `scenario-saves.test.ts` · AK-S5-02 AK-B2-04 schreibt je Szenario genau eine Datei, ohne Ordner n
- 571 · `balance-edicts.test.ts` · PLAN-M13-01 Determinismus: Wohlfahrt arm zweimal und mit Laden
- 542 · `islands-seeds-b.test.ts` · AK-M14E1-12: Seeds (Block ab 501)
- 537 · `balance-edicts.test.ts` · AK-M13E1-19 arm: Sparen und Handel früher, Wohlfahrt nicht früher
- 504 · `islands-seeds-b.test.ts` · AK-M14E1-12: Seeds (Block ab 801)
- 504 · `balance-crises.test.ts` · AK-BAS-02 Schwellen: Sieg ≤ 7500 und Geld > 0; normal + Feuerwache 785
- 502 · `seaRoute.test.ts` · Küstenabstand: mindestens 1,5 Kacheln zur Landmitte, ausser nahe den A
