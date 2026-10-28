# N · Plan-Nachtrag R945: Art-Brief, Blindtest, Delta-Review, K2-Testzeit (lead-tech, 2026-10-25)

Grundlage: Gate Plan `.studio/handoffs/2026-10-25-lead-qa-gate-plan-hafen.md` (BEDENKEN, Auflagen 1–8), R943 (Art-Brief `design/hafen` @ `080557e2` abgenommen,
Entwürfe (1)/(2) «ja»), R945 (E-HF-6 «ja, nur für die hier einzeln benannten Tests», E-HF-7). Plan-Stand vorher `plan/hafen` @ `583de10d`.

## 1 Fundstellen je Auflage

- **1a** eine Profilzeichnung mit `heading`, Masse, Farben, P1–P10 → `T03-optik.md` Interfaces, Verhalten
- **1b** AK-HF-52 in Bildmass → `T03-optik.md` Step AK-HF-52; §2 unten
- **1c** liegend längsseits (R25/AK-HF-38 neu) → `T14-hafen-render.md` Verhalten «Liegend», Step AK-HF-38; §2 unten
- **1d** Päckchen-Liegeplätze, Ersatz ±0,5 entlang der Kante → `T14-hafen-render.md` Verhalten «Liegeplätze»; Index P-14
- **1e** `heading` aus der Sehne ±1 Kachel, Flacker-Test → `T14-hafen-render.md` Verhalten «Fahrend», Step «Flackern»
- **1f** `steg.ts` (O/T03, `drawSteg`) statt `dock.ts`; Lage in T14 → Index Ownership; `T03-optik.md` Dateien; `T14-hafen-render.md` Dateien (`stegEnds`)
- **1g** Galerie-Harness `tools/render-qa/schiffe.mjs`; Fade 5 Ticks → `T03-optik.md` Verhalten/Steps; `T15-auftragsschiff.md` `ORDER_SHIP_FADE_TICKS = 5`, Test Ausblenden
- **1h** neuer Wortlaut, Spec-Kopfzeile → §2 unten; `D-doku.md` D1
- **2** Blindtest AK-HF-51 je frischer `qa-playtester` → `T04-optik-check.md` B; `T16-check-l4.md` B; Index Tasks/Budget
- **3** Delta-Review frischer opus-Start (R673) → Index §Tasks (Absatz unter der Tabelle), §Budgetantrag; `T04`/`T16` Abschluss
- **4** R392/R905 wörtlich, `beforeAll`, Liste mit Messwert, E-HF-6 → Index §Prüfpflichten; §3 unten; `T05-k2.md` Testzeit, B6, Schritt 0b; `T06-k2-pins.md` Laufzeit
- **5** T01 Schritt 0 «Ausgang», Last ≤ 4 nötig → `T01-dockfor.md` Schritt 0 und Bericht; `T00-ausgang.md` Kopf; Index §Abschluss
- **6** «Last ≤ 4 nötig» in den Messzeilen → `T02` AK-HF-04 und Bericht; `T07` Mess- und Zählregel; `T09` Bericht; `T12` Bericht
- **7** T05 Messskript, Meldung vor dem Implementieren → `T05-k2.md` Schritt 0 (a)–(c), Meldeschwelle ≥ 5
- **8** E-HF-2 anwenden; Termin INSELPROBEN-Sammel-Ruling → `T06-k2-pins.md` Laufzeit; Index §Entscheidungsbedarf E-HF-3

## 2 Geltender Wortlaut nach R943 (Spec-Text ist noch alt; D1 setzt in der Spec-Kopfzeile den Verweis hierher)

- **R25 / AK-HF-38:** «Fahrend zeigt der Bug in Fahrtrichtung (Sehne über ±1 Kachel Weglänge, auf NO/NW/SO/SW quantisiert). Liegend kantenparallel zur Kontorkante
  am Anker; von zwei Möglichkeiten die näher an der Ankunftstangente; an der Ecke die Ankunftstangente; ohne vorherige Fahrt SW, wenn kantenparallel, sonst SO.»
- **AK-HF-52:** «`shipAt` trifft an Rumpfmitte und Mastspitze in allen 4 Richtungen; kein Treffer 0,2 · `ISO_W` Bildabstand (Zoom 1) ausserhalb des Umrisses, vor dem
  Bugspriet, hinter dem Heck und unter dem Kiel; das Auftragsschiff nie.»
- **R24 (Wahl Tech/Art, Brief §6):** Päckchen — Rang k um k · 0,5 Kachel entlang der Normalen der Kaikante; Ersatz entlang der Kante ±0,5.

## 3 K2-Zeitliste (R392 V6, R905; E-HF-6 gilt nur für diese Zeilen)

**R392/R905 wörtlich:** Vor Task 1 werden die Zeiten der berührten bestehenden Tests auf main gemessen; die Abnahme vergleicht dieselben Dateien main/Branch direkt
nacheinander. Tests, die schon auf main > 500 ms laufen, dürfen höchstens +50 % zulegen; kein Test läuft **neu** über 500 ms.
**Modell der Prognose:** K2 kostet je ungecachtem Generatoraufruf ≈ +71 ms (T00: Median 1,6 → 73 ms); `createWorld` ohne `opts` ist je Datei-Prozess memoisiert
(P-4, `GEN_MEMO_MAX = 256`), Aufrufe mit `opts` (`onStage`, `forceLastStage`, `failShapes`) nie. Den ersten Durchlauf je Seed zahlt der Test, der die Seeds zuerst
berührt. Quelle der Liste: statische Suche nach Schleifen ≥ 20 Seeds mit `createWorld`/`generateForeignIslands` plus T00; vollständig erst mit dem T06-Lauf.
«Ausgang T00» stammt aus einem Lauf bei Last 7,3 → 4,3 (nicht belastbar); **Ausgang gemessen** füllt T01 Schritt 0 (Last ≤ 4), **nach K2** füllt T06 (Last ≤ 4).

| #   | Datei · Test                                                                    | Seeds     | Ausgang T00 ms | Prognose K2        | Massnahme                            | Ausgang gem. | nach K2 |
| --- | ------------------------------------------------------------------------------- | --------- | -------------- | ------------------ | ------------------------------------ | ------------ | ------- |
| 1   | `islands-gen` · AK-E1-02 Seeds 1…200 (und erster Block AK-E1-01, D-139)         | 200       | 730            | bis ≈ 15 000       | E-HF-6; Timeout 15 s prüfen; E-HF-8  | offen        | offen   |
| 2   | `islands-gen` · AK-E1-04 Ersatzform (`failShapes`, 2 × je Seed)                 | 20        | —              | ≈ 2 900            | E-HF-6                               | offen        | offen   |
| 3   | `islands-seeds-a` · AK-M14E1-12 Blöcke à 50                                     | 500 → 200 | 517            | ≈ 3 600 je Block   | E-HF-2 (R943) + E-HF-6               | offen        | offen   |
| 4   | `islands-seeds-b` · AK-M14E1-12 Blöcke ab 501; AK-M14E1-14 Stufe-3-Seeds        | 500       | 654            | ≈ 3 600 je Block   | E-HF-2; AK-M14E1-14 → E-HF-8         | offen        | offen   |
| 5   | `islands-c` · «Spanne protokollieren» (`forceLastStage`)                        | 300 → 100 | 1 082          | ≈ 7 100            | E-HF-2 + E-HF-6                      | offen        | offen   |
| 6   | `seaPlanKeepOutIndex` · RF-P2 jede Kachel, Seeds 1–40                           | 40        | 5 125          | ≈ 7 950 (+55 %)    | E-HF-6                               | offen        | offen   |
| 7   | `renderer` · L4 Deko-Culling (Seeds 3, 7)                                       | 2         | 3 955          | ≈ 4 100 (+4 %)     | innerhalb R905, beobachten           | offen        | offen   |
| 8   | `groundBeach` · D9 Kiste 1–200 (D5, D6 danach aus dem Memo)                     | 200       | —              | ≈ 14 000           | E-HF-6; E-HF-8                       | offen        | offen   |
| 9   | `archipel` · AK-E1-17 Seeds 1…200                                               | 200       | —              | ≈ 14 000           | E-HF-6; E-HF-8                       | offen        | offen   |
| 10  | `waterSea` · `isletWorld` (bis zum ersten Eiland-Seed)                          | ≤ 200     | —              | k · 71             | E-HF-6, k im T06-Bericht             | offen        | offen   |
| 11  | `save` · **B6 createWorld Mittel 1…50 (Zeitbudget, wird rot)**                  | 50        | —              | ≈ 3 800, Mittel 75 | T05 B6-Schritt (Budget neu) + E-HF-6 | offen        | offen   |
| 12  | `placement` · E1-Übergabe kontor2 am kontorSite, Seeds 1…50                     | 50        | —              | ≈ 3 600            | E-HF-6                               | offen        | offen   |
| 13  | `decor` · erster 50-Seed-Test (D3 Pool-Reihenfolge; Folgetests aus dem Memo)    | 50        | —              | ≈ 3 600            | E-HF-6                               | offen        | offen   |
| 14  | `decorSea` · Zoomschwellen Seeds 1–50                                           | 50        | 2 132 (L5-T3)  | ≈ 3 600            | E-HF-6                               | offen        | offen   |
| 15  | `decorStamps` · R5 Solitär Seeds 1–50                                           | 50        | —              | ≈ 3 600            | E-HF-6                               | offen        | offen   |
| 16  | `massif` · Bergsee Seeds 1–60                                                   | 60        | —              | ≈ 4 300            | E-HF-6                               | offen        | offen   |
| 17  | `seaKorridor` · AK-K1b/AK-K2 Seeds 1–40                                         | 40        | 1 914          | ≈ 4 800 (+150 %)   | E-HF-6                               | offen        | offen   |
| 18  | sieben Dateien, je erster 40-Seed-Test (Liste unter der Tabelle)                | 40        | —              | je ≈ 2 800         | E-HF-6                               | offen        | offen   |
| 19  | `seaRoute` · Küstenabstand Seeds 1–20                                           | 20        | 628            | ≈ 2 000            | E-HF-6                               | offen        | offen   |
| 20  | neu `islandGen` (T05) · `beforeAll` 40 × (`createWorld` + Generator mit `opts`) | 40        | —              | Aufbau ≈ 5 800     | E-HF-6 (Aufbau); Tests je ≤ 500 ms   | —            | offen   |
| 21  | neu `dock` (T02) · AK-HF-04 alle Plätze, ab L2 mit K2                           | 4         | —              | + ≈ 300            | E-HF-6, falls > 500 ms               | —            | offen   |

Zeile 18: `wildlife` (RF-10/RF-11), `groundSwap` (AK10b), `forest`, `trees-wald`, `shorePine`, `rareBudget`, `townhall`.

**Summe (Prognose):** ≈ 2 000 Generatorläufe × 71 ms ≈ 140 s CPU, ≈ +50 s Wand bei 3 Workern auf der vollen Suite. Unbenannte Überschreitung bleibt Befund.

## 4 Budget

QA-Checks 5 → 7 (zwei feste Blindtest-Starts); `13 × 2 + 7 + 5 + 8 = 46 → × 1,3 →` **60** (bisher 58). Puffer 14: ≤ 5 frische Delta-Reviews (R673), ≤ 2
Wiederholungs-Blindtests, Fix-Runden. Je Lieferung: L1 6, O 8, L2 16, L3 13, L4 13, Rest 4 zentral (Index §Budgetantrag).
