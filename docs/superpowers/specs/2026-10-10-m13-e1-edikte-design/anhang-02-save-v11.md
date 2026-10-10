# Anhang 02 · Save v11: Migration, Ladeprüfung, Rückfaltung (Spec M13-E1)

Gehört zu [Spec M13-E1 Edikte und Betrieb stilllegen](../2026-10-10-m13-e1-edikte-design.md), Regel R9 und S7. Ein
gemeinsamer Versionssprung trägt beide Teile (O10): Edikt-Felder in der Welt, Stilllegung je Gebäude.

## A. Format

- `SAVE_VERSION = 11` (`src/sim/save.ts`), `World.version: 11` (`src/sim/types.ts`), `createWorld` schreibt 11.
- Neue Weltschlüssel, in `createWorld` **am Ende** nach `wonSpice` (Schlüsselfolge für die Rückfaltung):
  `edict: null` (`EdictId | null`) und `edictLockedUntil: 0` (ganze Zahl ≥ 0).
- Neuer optionaler Gebäudeschlüssel `paused?: true`. Fehlt er, läuft der Betrieb. `paused: false` wird nie
  geschrieben (Aufheben löscht den Schlüssel).
- Neuer Gebäudezustand `'paused'` in `BuildingState` und in der Liste `BUILDING_STATES` der Prüfung.

## B. Migration `migrateV10ToV11(raw)`

Läuft in `deserialize` nach `migrateV9ToV10` (Kette v1 → … → v10 → v11), wirft nie:

1. Fehlt `edict`, wird `raw.edict = null` gesetzt; fehlt `edictLockedUntil`, wird `raw.edictLockedUntil = 0` gesetzt
   (vorhandene Werte bleiben und gehen in die Prüfung, damit ein manipulierter v10-Stand nicht still repariert wird).
2. Gebäude bleiben unverändert (kein `paused` = läuft, Migration «an», I-035).
3. `raw.version = 11`.

Folge: Ein v10-Stand mit `won = true` erlaubt nach dem Laden sofort ein Edikt (Vorschlag §6, «Spielstand mit Ziel 2
erreicht»). Kein Hinweis beim Laden (kein Übergangsbestand wie v8 → v9).

## C. Ladeprüfung `isValidV11Fields(raw)` (in `isWellFormed`, nach `isValidV9Fields`)

Gültig nur, wenn alles zutrifft; sonst `{ ok: false, reason: 'Beschädigter Spielstand' }`:

| Nr. | Bedingung                                                                                    |
| --- | -------------------------------------------------------------------------------------------- |
| C1  | `edict === null` oder ein Schlüssel von `EDICTS` (`'saving'`, `'trade'`, `'welfare'`)        |
| C2  | `edictLockedUntil` ist eine ganze Zahl ≥ 0                                                   |
| C3  | `edict !== null` ⇒ `won === true` (Edikte erst nach dem Bürger-Ziel)                         |
| C4  | `edict !== null` ⇒ es gibt ein Gebäude `defId === 'townhall'` (Abriss beendet das Edikt, R6) |
| C5  | je Gebäude: `paused` fehlt oder ist genau `true`                                             |
| C6  | `paused === true` ⇒ `BUILDING_DEFS[defId].produces !== undefined` (nur Betriebe, S1)         |
| C7  | `state === 'paused'` ⇒ `paused === true`                                                     |

Bewusst **nicht** geprüft: eine Obergrenze für `edictLockedUntil` (wie `taxLockedUntil`, Spec Steuer je Stufe R8.3);
`paused === true` mit `state` ≠ `'paused'` (z. B. `'burning'` während eines Brands oder ein Zustand aus dem Tick
vor dem Stilllegen) ist gültig, der nächste Schritt setzt den Zustand.

`version` > 11 (z. B. 12) → `{ ok: false, reason: 'Unbekannte Version' }`; kein JSON → `'Ungültiges Format'`. Die UI
zeigt den Grund wie heute über `friendlyReason` (Muster `^(Ungültiges Format|Unbekannte Version|Beschädigter
Spielstand)$` in `src/ui/hints.ts`), das laufende Spiel bleibt unverändert, kein Absturz (Verfassung §3).

## D. Rückfaltung `foldBackToV10(v11)` (neu in `tests/sim/helpers.ts`)

Zweck: Hash-Pins und feste JSON-Formen, die heute über `foldBackToV8(foldBackToV9(x))` gebildet werden, bleiben
bitgleich (I-028-Muster). Regeln:

1. Erlaubte Schlüssel = `V10_WORLD_KEYS` (neu: die heutigen v10-Schlüssel in `createWorld`-Reihenfolge) plus
   `edict`, `edictLockedUntil`; jeder andere
   Schlüssel → Fehler `foldBackToV10: unbekannter Schlüssel <k>`.
2. `edict !== null` oder `edictLockedUntil !== 0` → Fehler `foldBackToV10: Edikt nicht rückfaltbar`.
3. Ein Gebäude mit Schlüssel `paused` oder `state === 'paused'` → Fehler `foldBackToV10: Stilllegung nicht
rückfaltbar`.
4. Ausgabe: alle v10-Schlüssel in v10-Reihenfolge, ohne `edict` und `edictLockedUntil`, `version: 10`.

Umstellung: jede Stelle `foldBackToV8(foldBackToV9(x))` wird `foldBackToV8(foldBackToV9(foldBackToV10(x)))`
(heute in `tests/sim/save.test.ts`, `balance-crises.test.ts`, `goal3.test.ts`, `seaGolden.test.ts`, `helpers.ts`);
`CHAIN_HASHES` und `V6_FORMS` bleiben wertgleich. Kein Pin-Wert ändert sich.

## E. Fixtures und Szenario-Stände

- Neues Fixture `tests/sim/fixtures/save-v10.json` (aus einem heutigen v10-Stand mit `won = true`, ohne Edikt-Felder)
  oder Erzeugung über `foldBackToV10(serialize(w))` im Test [Tech].
- `scenario-saves.test.ts` vergleicht `r.world.version` mit `SAVE_VERSION`: läuft ohne Änderung auf 11.
- Szenario-Stände, die Code erzeugt (`tests/sim/scenarios*.ts`), bekommen die zwei Felder über `createWorld`; fest
  abgelegte v9-Fixtures (`see-route-start-v9.json`, `z3-scenario-v9.json`) laufen über die Kette.

## F. Erwartungswerte für die Save-AK

| AK        | Eingabe                                                                   | Ergebnis                                         |
| --------- | ------------------------------------------------------------------------- | ------------------------------------------------ |
| AK-E1-23  | v11 mit `edict 'trade'`, `edictLockedUntil 4000`, Fischer `paused: true`  | Rundlauf ok, tief gleich, Fischer `state` gleich |
| AK-E1-24  | v10-Stand (`won true`), v1 … v9-Fixtures                                  | ok, `version 11`, `edict null`, Sperre 0         |
| AK-E1-25a | `edict: 'tax'`                                                            | `'Beschädigter Spielstand'`                      |
| AK-E1-25b | `edictLockedUntil` −1 / 1,5 / `'300'` / fehlt in v11                      | `'Beschädigter Spielstand'`                      |
| AK-E1-25c | `edict: 'saving'` mit `won: false`                                        | `'Beschädigter Spielstand'`                      |
| AK-E1-25d | `edict: 'saving'` ohne Amtsstube                                          | `'Beschädigter Spielstand'`                      |
| AK-E1-25e | `paused: false`; `paused: 1`; `paused: true` an Wohnhaus, Kapelle, Kontor | `'Beschädigter Spielstand'`                      |
| AK-E1-25f | Fischer `state: 'paused'` ohne `paused`                                   | `'Beschädigter Spielstand'`                      |
| AK-E1-25g | Fischer `paused: true`, `state: 'burning'` mit gültigem `outageUntil`     | ok                                               |
| AK-E1-25h | v10-Stand mit `edict: 'x'` (Migration lässt ihn stehen)                   | `'Beschädigter Spielstand'`                      |
| AK-E1-26  | `version: 12`; Text `{"version": 11` (abgeschnitten)                      | `'Unbekannte Version'`; `'Ungültiges Format'`    |

Jeder Fall: `deserialize` wirft nicht; ein Fall «fehlt in v11» meint einen Stand mit `version: 11`, dem der Schlüssel
fehlt (die Migration läuft nur für v10).
