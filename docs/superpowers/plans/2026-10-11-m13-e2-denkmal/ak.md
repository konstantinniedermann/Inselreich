# M13-E2 · Zuordnung der Abnahmekriterien

Gehört zum [Index](../2026-10-11-m13-e2-denkmal.md). Jedes AK der Spec (§10, AK-M13E2-01…49) ist **genau einer** Task
zugeordnet; dort steht der Test (Datei) bzw. der Browser-Schritt. «Vorarbeit» heisst: die Task liefert den roten Test
für einen Teil, die Abnahme des AK liegt bei der genannten Task.

| AK  | Inhalt (Kurz)                                                         | Task | Testort                                                  |
| --- | --------------------------------------------------------------------- | ---- | -------------------------------------------------------- |
| 01  | `createWorld` Felder am Ende, `version 12`                            | T02  | `tests/sim/save-v12.test.ts`                             |
| 02  | Def-Test §4                                                           | T01  | `tests/sim/defs.test.ts`                                 |
| 03  | Freischaltung, `buildEntries` Heimat/Fremdinsel                       | T01  | `tests/sim/monument.test.ts`                             |
| 04  | Bauplatz, Kosten, `maxCount`, Fremdinsel, Versorgung                  | T03  | `tests/sim/monument.test.ts`                             |
| 05  | 3×3 Boden, Anbindung zwölf Randkacheln, Diagonale                     | T03  | `tests/sim/monument.test.ts`                             |
| 06  | `startMonumentStage`                                                  | T03  | `tests/sim/monument.test.ts`                             |
| 07  | Werfen nie (Matrix)                                                   | T03  | `tests/sim/monument.test.ts`                             |
| 08  | Zug aus dem Lager, Phase, Reihenfolge                                 | T05  | `tests/sim/monument.test.ts`                             |
| 09  | Reserve exakt (Anhang 01 A), `monumentLock` 0                         | T04  | `tests/sim/monument.test.ts`                             |
| 10  | Reserve hält (Anhang 08 B.1)                                          | T05  | `tests/sim/monument.test.ts`                             |
| 11  | Zukauf, Zukauf-Funktion direkt, Randfälle qa B8                       | T05  | `tests/sim/monument.test.ts`                             |
| 12  | Lauf A Vollzukauf exakt                                               | T07  | `tests/sim/balance-monument.test.ts`                     |
| 13  | Abschluss, `monumentDone`                                             | T05  | `tests/sim/monument.test.ts`                             |
| 14  | Kein Zug bei `paused`/ohne Weg/`!running`, Randfälle qa B8            | T05  | `tests/sim/monument.test.ts`                             |
| 15  | Abriss, Erstattung, Neubau                                            | T03  | `tests/sim/monument.test.ts`                             |
| 16  | Zufall und Krise, zwei Kopien                                         | T06  | `tests/sim/monument.test.ts`                             |
| 17  | v11-Stand mit `wonMerchants` lädt, Bau sofort                         | T02  | `tests/sim/save-v12.test.ts`                             |
| 18  | Lauf B Referenz                                                       | T07  | `tests/sim/balance-monument.test.ts`                     |
| 19  | Lauf C R-Ausbau (Pflicht-Rulingpunkt)                                 | T07  | `tests/sim/balance-monument.test.ts`                     |
| 20  | Reserve im Referenzstand                                              | T07  | `tests/sim/balance-monument.test.ts`                     |
| 21  | Baseline ohne Diff                                                    | T07  | Befehl, geprüft in T17                                   |
| 22  | `foldBackToV11`, Hash-Pins                                            | T02  | `tests/sim/save-v12.test.ts` (Helfertest)                |
| 23  | Rundlauf v12                                                          | T02  | `tests/sim/save-v12.test.ts`                             |
| 24  | Migration und Kette v1 … v12                                          | T02  | `tests/sim/save-v12.test.ts`                             |
| 25  | Ladeprüfung 25a–25k (25k `step`-Teil als `it.todo`, eingelöst in T05) | T02  | `tests/sim/save-v12.test.ts`                             |
| 26  | Inkompatibel: Version 13, abgeschnitten                               | T02  | `tests/sim/save-v12.test.ts`                             |
| 27  | `monumentRows`                                                        | T10  | `tests/ui/monumentView.test.ts`                          |
| 28  | `monumentStartState`                                                  | T10  | `tests/ui/monumentView.test.ts`                          |
| 29  | `monumentEtaText`                                                     | T10  | `tests/ui/monumentView.test.ts`                          |
| 30  | `monumentStallReason`                                                 | T10  | `tests/ui/monumentView.test.ts`                          |
| 31  | Ziel-Chip vier Fälle                                                  | T13  | `tests/ui/goal.test.ts`                                  |
| 32  | `monumentChronicleLine`, `monumentStageLine`                          | T10  | `tests/ui/monumentView.test.ts`                          |
| 33  | `monumentEvents`, Glocken-Ereignis                                    | T13  | `tests/ui/monumentView.test.ts`, `soundEvents.test.ts`   |
| 34  | `monumentNeedsConfirm`, C1–C7, Gründe U-7                             | T11  | `tests/ui/demolishConfirm.test.ts`, `hints.test.ts`      |
| 35  | Bauleiste: Vorschau-Zeile, Tooltip, `lockedToolText`                  | T12  | `tests/ui/buildMenu.test.ts` (neu)                       |
| 36  | Bildstufe, fünf Aufzeichnungen, Höhenmass, `drawGhost`                | T09  | `tests/render/monumentSprite.test.ts` (Vorarbeit T08)    |
| 37  | Picking                                                               | T09  | `tests/render/picking.test.ts`                           |
| 38  | Tiefensortierung                                                      | T09  | `tests/render/iso.test.ts`                               |
| 39  | Cache, Bytes, Effekt unter `CAPS`, Bitgleichheit übrige               | T09  | `tests/render/spriteCache.test.ts` u. a. (Vorarbeit T08) |
| 40  | Bauleiste vor/nach Ziel 2, Vorschau, Bau                              | T15  | Browser                                                  |
| 41  | Panel, Start, Pause                                                   | T15  | Browser                                                  |
| 42  | Zukauf, «Nicht angebunden»                                            | T15  | Browser                                                  |
| 43  | Abschnitt fertig                                                      | T16  | Browser                                                  |
| 44  | Wahlziel, Aufflammen, Glocke, nach Laden nichts                       | T16  | Browser                                                  |
| 45  | Abriss-Bestätigung (R483)                                             | T15  | Browser                                                  |
| 46  | Bild je Stufe, Tag/Nacht/Regen                                        | T15  | Browser                                                  |
| 47  | Slot `version 13`                                                     | T16  | Browser                                                  |
| 48  | 800×600 mit Panel                                                     | T15  | Browser                                                  |
| 49  | Speichern/Laden mitten im Abschnitt                                   | T06  | `tests/sim/monument.test.ts`                             |

## Plan-Punkte aus Anhang 08 E und dem Gate-Handoff lead-tech

| Punkt                                                    | Erledigt in                                    |
| -------------------------------------------------------- | ---------------------------------------------- |
| qa B5 Szenario-Stände `m13e2-*`                          | T06                                            |
| qa B8 Randfälle in AK-11/-14                             | T05                                            |
| qa B9a AK-21 wörtlich; Ledger mechanische Anpassungen    | T17 Punkt 2; T02 Schritt 5                     |
| tech B2 Def-Kern zuerst, Platzhalter                     | T01                                            |
| tech B5 Nachtrag Plan I-049 (Fall K1, `dropZeroReserve`) | [nachtrag-i049.md](nachtrag-i049.md), Index E8 |
| A1 Strang-Schnitt                                        | Index, Stränge und Merge-Reihenfolge           |
| A2 Bildstufe in die Render-Geometrie, Bildrand-Test      | T09                                            |
| A3 Reserve ganzzahlig                                    | T04                                            |
| A4 Läufe A und C Krisen aus                              | T07                                            |
| A5 Vergleich statt Spy                                   | T05                                            |
| A6 V4 nur bei `stage < 3`                                | T02                                            |
| E1-Berichtigungen (Spec §11, Anhang 08 F)                | T02 (mechanisch), T14 (Verweise), Index E6     |
| R392/E-052 Zeitmessung Ausgang                           | T00                                            |
