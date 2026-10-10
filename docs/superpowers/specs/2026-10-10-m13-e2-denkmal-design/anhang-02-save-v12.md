# Anhang 02 · Save v12: Migration, Ladeprüfung, Rückfaltung (Spec M13-E2)

Gehört zu [Spec M13-E2 Denkmal als Wahlziel](../2026-10-10-m13-e2-denkmal-design.md), §9. Muster:
[Anhang 02 der Spec M13-E1](../2026-10-10-m13-e1-edikte-design/anhang-02-save-v11.md).

## A. Format

- `SAVE_VERSION = 12` (`src/sim/save.ts`), `World.version: 12` (`src/sim/types.ts`), `createWorld` schreibt 12.
- Neue Weltschlüssel, in `createWorld` **am Ende** nach `edictLockedUntil`: `monument: null` (`Monument | null`) und
  `monumentDone: false`.
- `Monument` = `{ buildingId, stage, running, delivered, paused, buy }` (Spec R3); `delivered` und `buy` tragen genau
  die Schlüssel `stone`, `tools`, `glass`, `spice`.
- Neuer Gebäude-Typ `defId: 'monument'` (3×3); sonst keine neuen Gebäudeschlüssel.

## B. Migration `migrateV11ToV12(raw)`

Läuft in `deserialize` nach `migrateV10ToV11` (Kette v1 → … → v11 → v12), wirft nie:

1. Fehlt `monument`, wird `raw.monument = null` gesetzt; fehlt `monumentDone`, wird `raw.monumentDone = false`
   gesetzt (vorhandene Werte bleiben und gehen in die Prüfung).
2. `raw.version = 12`.

Folge: Ein v11-Stand mit `wonMerchants = true` erlaubt nach dem Laden sofort den Bau (Spec R2.3). Kein Hinweis beim
Laden.

## C. Ladeprüfung `isValidV12Fields(raw)` (in `isWellFormed`, nach `isValidV11Fields`)

Gültig nur, wenn alles zutrifft; sonst `{ ok: false, reason: 'Beschädigter Spielstand' }`:

| Nr. | Bedingung                                                                                                                                          |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| V1  | `monumentDone` ist ein Boolean                                                                                                                     |
| V2  | `monument === null` oder ein Objekt mit genau den Schlüsseln `buildingId`, `stage`, `running`, `delivered`, `paused`, `buy`                        |
| V3  | `stage` ganze Zahl 0 … 3; `running` und `paused` Boolean                                                                                           |
| V4  | `delivered` hat genau die vier Gut-Schlüssel, je ganze Zahl ≥ 0; `running` ⇒ `delivered[g] ≤ MONUMENT_STAGES[stage].goods[g]`; `!running` ⇒ alle 0 |
| V5  | `buy` hat genau die vier Gut-Schlüssel, je Boolean                                                                                                 |
| V6  | `stage === 3` ⇒ `running === false` und `monumentDone === true`                                                                                    |
| V7  | `monument !== null` ⇒ `wonMerchants === true`                                                                                                      |
| V8  | `buildingId` ist eine ganze Zahl, `buildings[buildingId]` existiert, `defId === 'monument'`, `island === 0`                                        |
| V9  | Zahl der Gebäude mit `defId === 'monument'` = 0 bei `monument === null`, sonst 1                                                                   |

Bewusst **nicht** geprüft: ein laufender Abschnitt mit allen Resten 0 (der nächste Tick schliesst ihn ab, R8.1);
`monumentDone === true` mit `stage < 3` (Neubau nach Abriss, R9.2).

`version` > 12 (z. B. 13) → `'Unbekannte Version'`; kein JSON → `'Ungültiges Format'`. Die UI zeigt den Grund über
`friendlyReason` (Muster in `src/ui/hints.ts`), das laufende Spiel bleibt unverändert, kein Absturz (Verfassung §3).

## D. Rückfaltung `foldBackToV11(v12)` (neu in `tests/sim/helpers.ts`, Name [Tech])

Zweck: Hash-Pins und feste JSON-Formen bleiben bitgleich (Muster `foldBackToV10`, I-028). Regeln:

1. Erlaubte Schlüssel = `V11_WORLD_KEYS` (die heutigen v11-Schlüssel in `createWorld`-Reihenfolge) plus `monument`,
   `monumentDone`; jeder andere Schlüssel → Fehler `foldBackToV11: unbekannter Schlüssel <k>`.
2. `monument !== null` oder `monumentDone !== false` → Fehler `foldBackToV11: Denkmal nicht rückfaltbar`.
3. Ein Gebäude mit `defId === 'monument'` → derselbe Fehler.
4. Inseln: **Positivliste** `V11_ISLAND_KEYS` (die heutigen Schlüssel von `Island` in Erzeugungsreihenfolge). Jede
   Insel wird auf diese Schlüssel in dieser Reihenfolge reduziert; Schlüssel, die es in v11 nicht gab, werden
   verworfen (Beispiel `reserve` aus I-049, das auf v12 mitfährt, R477). Damit bleiben die Hash-Pins unverändert,
   auch nachdem I-049 gemergt ist.
5. Ausgabe: alle v11-Schlüssel in v11-Reihenfolge, `version: 11`.

Merge-Reihenfolge (R477, Lead-Nachtrag): M13-E2-SIM vor I-049-Sim. I-049 setzt auf v12 auf, erweitert nur
`migrateV11ToV12` und die Ladeprüfung um `Island.reserve` und braucht dank Regel 4 keine eigene Rückfaltung.

Einbindung: `foldBackToV10(x)` ruft bei `x.version === 12` zuerst `foldBackToV11(x)` auf; `foldBackToV9` ruft wie
heute `foldBackToV10` bei Version ≥ 11 [Tech: Bedingung von `=== 11` auf `>= 11` erweitern]. Die Aufrufer
`foldBackToV8(foldBackToV9(x))` in `balance-crises.test.ts`, `save.test.ts`, `goal3.test.ts`, `seaGolden.test.ts`
bleiben unverändert; `CHAIN_HASHES` und `V6_FORMS` bleiben wertgleich. Der Helfer-Test (AK-M13E2-22) ruft
`foldBackToV11` auch direkt.

## E. Fixtures und Szenario-Stände

- v11-Stand mit `wonMerchants = true` für AK-M13E2-17 und -24: Erzeugung im Test über `foldBackToV11(serialize(w))`
  aus einer Welt mit `wonMerchants = true` ohne Denkmal [Tech: oder Datei `tests/sim/fixtures/save-v11.json`].
- `scenario-saves.test.ts` vergleicht mit `SAVE_VERSION`: läuft ohne Änderung auf 12.
- Code-erzeugte Szenario-Stände bekommen die zwei Felder über `createWorld`; fest abgelegte Fixtures laufen über die
  Kette.

## F. Erwartungswerte für die Save-AK

| AK           | Eingabe                                                                                                                                           | Ergebnis                                                |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| AK-M13E2-23  | v12 mit Denkmal `stage 1`, `running`, `delivered { stone 37, tools 0, glass 12, spice 5 }`, `paused true`, `buy.glass true`, `monumentDone false` | Rundlauf ok, tief gleich                                |
| AK-M13E2-24  | v11-Stand (`wonMerchants true`), v1 … v10-Fixtures                                                                                                | ok, `version 12`, `monument null`, `monumentDone false` |
| AK-M13E2-25a | `monumentDone: 'ja'` bzw. fehlt in v12                                                                                                            | `'Beschädigter Spielstand'`                             |
| AK-M13E2-25b | `monument` mit Zusatzschlüssel `x` bzw. ohne `buy`                                                                                                | `'Beschädigter Spielstand'`                             |
| AK-M13E2-25c | `stage` −1 / 4 / 1,5 / `'2'`                                                                                                                      | `'Beschädigter Spielstand'`                             |
| AK-M13E2-25d | `running`, `stage 0`, `delivered.stone 201` (Soll 200)                                                                                            | `'Beschädigter Spielstand'`                             |
| AK-M13E2-25e | `running false`, `delivered.glass 3`                                                                                                              | `'Beschädigter Spielstand'`                             |
| AK-M13E2-25f | `delivered` mit Schlüssel `wood`; `buy.spice: 1`                                                                                                  | `'Beschädigter Spielstand'`                             |
| AK-M13E2-25g | `stage 3` mit `running true`; `stage 3` mit `monumentDone false`                                                                                  | `'Beschädigter Spielstand'`                             |
| AK-M13E2-25h | `monument` gesetzt, `wonMerchants false`                                                                                                          | `'Beschädigter Spielstand'`                             |
| AK-M13E2-25i | `buildingId` zeigt auf einen Fischer bzw. auf keine Id bzw. auf ein Denkmal mit `island 1`                                                        | `'Beschädigter Spielstand'`                             |
| AK-M13E2-25j | Gebäude `monument` vorhanden, `monument: null`; zwei Gebäude `monument`                                                                           | `'Beschädigter Spielstand'`                             |
| AK-M13E2-25k | `running`, alle Reste 0 (Soll geliefert)                                                                                                          | ok; nach einem `step` `stage +1`, `running false`       |
| AK-M13E2-26  | `version: 13`; Text `{"version": 12` (abgeschnitten)                                                                                              | `'Unbekannte Version'`; `'Ungültiges Format'`           |

Jeder Fall: `deserialize` wirft nicht; «fehlt in v12» meint einen Stand mit `version: 12`, dem der Schlüssel fehlt (die
Migration läuft nur für v11).
