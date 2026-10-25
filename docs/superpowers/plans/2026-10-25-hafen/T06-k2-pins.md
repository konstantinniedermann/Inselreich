# T06 · K2-Neupins: Seeds, Hashes, Fixtures, Seed-Suche (S2, E4, Auflagen 6 und 7)

Umsetzer `tech-sim-engineer` · ≈ 60 Tools · AK-HF-13, AK-HF-22 (Welt-Teil) · blocked-by: T05 · Worktree `.worktrees/hafen-route` · Index P-13, E-HF-2, E-HF-5 ·
**Laufzeitmessung nur bei Last ≤ 4**

## Regel je Pin

Jeder Neu-Pin: Testname im Commit-Text, alter → neuer Wert, Ursache («K2 R7/R8, Ruling E4 R913»), Kommentar im Test mit Verweis auf R913. Ein Test, der eine
**Eigenschaft** prüft (Lücke, Spanne, Wasser, Rahmen), wird nie gelockert; nur Goldwerte, Hashes, Fixtures und Beispiel-Seeds werden neu gesetzt. `tests/sim/balance.test.ts` ohne
Diff. Fixtures werden über ihr **eigenes** Rezept im Test neu erzeugt (kein Handbau), Ladbarkeit bleibt Pflicht.

## Liste (Probe «Welt», T00: 50 Tests in 15 Dateien; Namen gekürzt)

| Datei                               | Test(s)                                                                                                                   | Art                   |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| `tests/sim/seaGolden.test.ts`       | SEE-F1 T0 Goldwerte Seeweg, Seed 7 / 13 / 42 (Lanes, Ticks, Welt-Hash) — **AK-HF-13**                                     | Golden, Kommentar E4  |
| `tests/sim/islands-seeds-a.test.ts` | AK-M14E1-12 A/B bitgleich, 10 Blöcke Seeds 1…500                                                                          | Referenztabelle neu   |
| `tests/sim/islands-seeds-b.test.ts` | AK-M14E1-12 Blöcke 501…1000; «Seed 963 und Pins 1, 3, 7, 13, 42»; AK-M14E1-14 «Stufe-3-Seeds exakt [963]»                 | Tabelle, Seed-Liste   |
| `tests/sim/islands-c.test.ts`       | AK-M14E1-15 «Seed 963 meldet für C Stufe 3»; «erzwungene letzte Stufe C … A und B gleich T01»; «Seed 963: A und B gleich» | Seed-Suche, Referenz  |
| `tests/sim/farOrder-defs.test.ts`   | «Seed 3 Seewege (AK-H2-27 Pin) dMin ≤ d ≤ dMax je Fremdinsel und laneTicks gepinnt»                                       | auf L-Band umstellen  |
| `tests/sim/farOrder-sea.test.ts`    | AK-H2-27 Fristbeleg Seed 3 Fall A/B × A, B, C (6); AK-H2-31 (a) «Seed 963, Stufe 3: C weiter als dMax»                    | Pin, Seed-Suche       |
| `tests/sim/ships.test.ts`           | AK-E4-03 «Ankunft nach 370, Rundreise 740»; AK-E4-05 (2 Fälle); AK-E4-08; AK-E4-17                                        | Ticks aus `laneTicks` |
| `tests/sim/save.test.ts`            | «T00 Rezept = Fixture v8»; «T00 Pins»; «v9 V05 left > Lane»; «Fixture see-route-start-v9 (AK-E4-13)»                      | Fixture, relativ      |
| `tests/sim/goal3.test.ts`           | AK-Z3-02 «Fixture z3-scenario-v9 ist ladbar und gleicht dem Browser-Rezept»                                               | Fixture               |
| `tests/sim/scenario-saves.test.ts`  | «Fixture save-v12-felsbucht.json (QA-B11) gleich der Rückfaltung des Rezepts»                                             | Fixture               |
| `tests/sim/helpers.test.ts`         | foldBackToV12 AK-M14E1-24a «createWorld(3) → v12-Form, Pin»                                                               | Hash                  |
| `tests/render/renderer.test.ts`     | AK-E1-10 Heimat-Aufrufliste (2 Fälle); AK-E4-15 (b) «Schiff auf See nach Insel 1 gezeichnet»                              | Hash; Lage neu wählen |
| `tests/render/seaKorridor.test.ts`  | AK-K1b Pin und Teilhash; AK-K2 `seaKeepOut`/`seaClearance` und Teilhash                                                   | Hash                  |

Dazu alles, was nach T05 zusätzlich rot ist (Generator-Anker R8, Korrektur): melden und nach derselben Regel behandeln. «v9 V05 left > Lane» relativ fassen
(`laneTicks + 1`), damit T07 ihn nicht erneut bricht. Fahrzeit-Pins in `ships`/`farOrder-*` hier als **Ausdruck** `laneTicks(...)` statt Zahl, wo der Test die Zahl
nur durchreicht (dann ändert T07 sie nicht noch einmal); echte Goldwerte (AK-E4-03 370/740) erst in T07 neu setzen.

## Seed-Suche (Auflage 7)

- **Stufe-3-Beispiel:** Ersatz für Seed 963 (Insel C in Stufe 3) per Suche über Seeds 1…1000 mit `onStage`; kleinster Seed mit C in Stufe 3 und A, B in Stufe 1/2. Neue
  Liste «Stufe-3-Seeds exakt» für 501…1000 als Pin (Messwert).
- **Seed 3** bleibt Beispiel für AK-H2-27, falls alle drei Inseln Stufe 1/2 haben; sonst kleinster Seed mit dieser Eigenschaft (im Test begründen).
- Weitere `createWorld(<Seed>)`-Tests mit Koordinaten auf Fremdinseln (Suche `rg "islands\[[123]\]|island: [123]\b" tests`) laufen in der Kandidatenliste; was dort grün
  bleibt, bleibt unverändert.

## Steps

- [ ] Kandidatenliste laufen, Ist-Liste der Rotstellen mit der Tabelle abgleichen (Abweichungen melden).
- [ ] Je Datei: Pin neu bzw. Seed-Suche; eigener Commit je Datei `test: <Datei> neu gepinnt nach K2 (HAFEN S2, E4 R913)` mit Namen und alt → neu im Text.
- [ ] **Referenztabellen** (AK-M14E1-12) mit dem vorhandenen Erzeugungsweg im Test neu schreiben; Spanne unverändert lassen.
- [ ] **Laufzeit (Last ≤ 4):** `islands-seeds-a/-b`, `islands-gen`, `islands-c`, `archipel` je dreimal, Median gegen T00. Über 2 × Ausgang → Bericht mit Werten,
      Controller holt **E-HF-2** ein (Spannen kürzen nur per Ruling).
- [ ] Teilbeleg laut Index und volle Kandidatenliste grün; `git diff main -- tests/sim/balance.test.ts` leer.

## Bericht

Exit-Codes; Pin-Liste (Datei, Test, alt → neu); neue Beispiel-Seeds mit Begründung; Laufzeiten A/B; offene Rotstellen (soll 0).
