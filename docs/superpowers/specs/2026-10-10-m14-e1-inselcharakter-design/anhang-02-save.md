# Anhang 02 · Save: Migration, Ladeprüfung, Rückfaltung (Spec M14-E1)

Gehört zu [Spec M14-E1 Inselcharakter](../2026-10-10-m14-e1-inselcharakter-design.md), §9. Muster:
[Anhang 02 der Spec M13-E2](../../archiv/specs/2026-10-10-m13-e2-denkmal-design/anhang-02-save-v12.md).

Begriffe: «**neu**» = `SAVE_VERSION + 1` relativ zu `main` beim Planstart (erwartet 13); «**Vorversion**» = neu − 1
(erwartet 12, geteilt von M13-E2, I-048 und I-049 nach R477, R487 P-4). Namen mit `<Vorversion>` setzt `lead-tech`
im Plan ein [Tech].

## A. Format

- `SAVE_VERSION` = neu (`src/sim/save.ts`), `World.version` = neu (`src/sim/types.ts`), `createWorld` schreibt neu.
- **Kein** neuer Weltschlüssel, **kein** neuer Inselschlüssel, kein neuer Gebäudeschlüssel.
- `islands` hat genau `1 + ISLANDS.length` = 4 Einträge: Heimat, Möweninsel (`'A'`), Felsbucht (`'B'`), Weidenau
  (`'C'`). Insel 3 hat dieselbe Schlüsselfolge wie die übrigen von `createWorld` erzeugten Fremdinseln (heute `kind`,
  `width`, `height`, `tiles`, `kontorId`, `stock`, `ox`, `oy`, `anchor`, plus die Inselschlüssel der Vorversion, z. B.
  `reserve` aus I-049, mit Neutralwert).
- Traits sind kein Save-Feld; sie folgen aus `kind` über `ISLANDS`.

## B. Migration `migrateV<Vorversion>ToV<neu>(raw)`

Läuft in `deserialize` als letzte Stufe der Kette, wirft nie (Fehler werden gefangen; die Ladeprüfung meldet einen
unbrauchbaren Stand):

1. Ist `raw.islands` ein Array mit **genau 3** Einträgen und hat `islands[0]` die Felder `ox`, `oy`, `width`,
   `height`, `anchor` in gültiger Form, wird Insel C erzeugt: dieselbe Funktion wie in `createWorld`
   (`generateForeignIslands(raw.seed, home)`, Element mit `kind 'C'`; R3.5 der Spec), Gelände als Kacheln ohne Gebäude
   und Weg, `kontorId null`, Lager mit allen Gütern 0, Inselschlüssel der Vorversion mit Neutralwert. Das Ergebnis wird
   **ans Ende** angehängt.
2. Hat `raw.islands` schon 4 Einträge (Stand kam über `migrateV7ToV8`, das heute alle `ISLANDS` erzeugt), bleibt
   `islands` unverändert. Jede andere Länge bleibt ebenfalls unverändert und fällt in der Ladeprüfung durch.
3. `raw.version` = neu.

Folge: Inseln 0–2, Gebäude, Schiffe, Routen, Geld und Ticks bleiben unberührt; die Erzeugung nutzt nur den Strom
`ISLANDS_SALT`, keine Krisen- oder Auftragsströme. Betriebe auf der Felsbucht laufen ab dem ersten Tick mit
Trait-Zyklus (Spec §5). Kein Hinweis beim Laden.

**Kette:** v1 → … → v7 → v8 (`migrateV7ToV8` erzeugt A, B und C) → … → Vorversion → neu. Folgemigrationen, die über
alle Inseln laufen (`addSpiceToIslands` in v8 → v9, I-049 `reserve`), decken C mit ab [Tech: prüfen und testen,
AK-M14E1-22].

## C. Ladeprüfung (in `isWellFormed`, nach der Prüfung der Vorversion)

Gültig nur, wenn alles zutrifft; sonst `{ ok: false, reason: 'Beschädigter Spielstand' }`. Alle vier Bedingungen
bestehen heute schon und lesen `ISLANDS`; mit dem dritten Eintrag gelten sie für vier Inseln ohne neuen Prüfcode
[Tech: bestätigen]. Neu ist nur die Testabdeckung (AK-M14E1-23):

| Nr. | Bedingung                                                                                                   |
| --- | ----------------------------------------------------------------------------------------------------------- |
| L1  | `islands.length === 1 + ISLANDS.length` (= 4; bestehende Prüfung in `isValidIslands`)                       |
| L2  | Für `i` = 1 … 3: `islands[i].kind === ISLANDS[i − 1].kind`, also Insel 3 `'C'` (bestehend, `isValidIsland`) |
| L3  | Für `i` = 1 … 3: Raster `ISLANDS[i − 1].size` im Quadrat (bestehend, `isValidForeign`)                      |
| L4  | Jedes Gebäude hat `island` 0 … 3 (bestehend, `hasValidIslandIndex`)                                         |

`version` > neu → `'Unbekannte Version'`; kein JSON → `'Ungültiges Format'`. Die UI zeigt den Grund über
`friendlyReason`, das laufende Spiel bleibt unverändert, kein Absturz (Verfassung §3).

## D. Rückfaltung `foldBackTo<Vorversion>(x)` (neu in `tests/sim/helpers.ts`, Name [Tech])

Zweck: Hash-Pins und feste JSON-Formen bleiben wertgleich (Spec §6.2, Entscheid E-4). Regeln:

1. **Weltschlüssel, Positivliste:** erlaubt sind genau die Weltschlüssel der Vorversion (`V<Vorversion>_WORLD_KEYS`
   in `createWorld`-Reihenfolge). E1 führt keinen neuen ein; jeder andere Schlüssel → Fehler
   `foldBackTo<Vorversion>: unbekannter Schlüssel <k>` (Gate-Befund B9).
2. `islands.length !== 4` oder `islands[3].kind !== 'C'` → Fehler `foldBackTo<Vorversion>: 4 Inseln erwartet`.
3. **Insel C unberührt**, sonst Fehler `foldBackTo<Vorversion>: Insel C nicht rückfaltbar`. Unberührt heisst alles:
   - `kontorId === null`;
   - alle Werte in `stock` = 0 (und Neutralwert aller weiteren Inselschlüssel der Vorversion, z. B. `reserve`);
   - keine Kachel mit `buildingId !== null` oder `road === true`;
   - kein Gebäude mit `island === 3`;
   - kein Schiff, keine Route, keine Krise (`crisis.tile.island`), kein Auftrag mit Bezug auf Insel 3 [Tech:
     Feldnamen];
   - Inselschlüssel nur aus der Positivliste der Vorversion.
4. **Inseln 0–2:** Inselschlüssel ausserhalb der Positivliste der Vorversion werden entfernt, **ohne Umordnen** der
   übrigen (wie M13-E2 Anhang 02 D Regel 4). E1 führt keinen Inselschlüssel ein; die Regel hält die Faltung robust.
5. **Ausgabe:** die Eingabe ohne `islands[3]`, mit `version` = Vorversion; sonst unverändert, auch in der Reihenfolge
   der Welt- und Inselschlüssel.
6. **Einbindung:** Die Rückfaltung der Vorversion ruft bei `x.version === neu` zuerst `foldBackTo<Vorversion>(x)` auf
   (Muster `foldBackToV9` → `foldBackToV10`). Die Aufrufer `foldBackToV8(foldBackToV9(x))` in `save.test.ts`,
   `balance-crises.test.ts`, `goal3.test.ts`, `seaGolden.test.ts` bleiben unverändert; `CHAIN_HASHES` und `V6_FORMS`
   bleiben wertgleich, weil Kettenstände C unberührt mitführen.

Wichtig für `seaGolden`: Der Welt-Hash wird über die gefaltete Form gebildet und bleibt; die Lane- und Tick-Tabellen
werden an der **ungefalteten** Welt gemessen und bekommen die Einträge `0-3`, `1-3`, `2-3` (und `3-0`, `3-1`, `3-2`,
falls die Tabelle beide Richtungen führt) zusätzlich [Tech: Prüfauftrag Spec §6.2].

## E. Fixtures und Szenario-Stände

- Vorversion-Stand für AK-M14E1-21 und Browser-AK-39: im Test über `foldBackTo<Vorversion>(serialize(w))` aus einer
  Welt ohne Bezug auf C; mit Betrieben auf der Felsbucht für den Altstand-Fall [Tech: oder Datei
  `tests/sim/fixtures/save-v<Vorversion>-felsbucht.json`].
- `scenario-saves.test.ts` vergleicht mit `SAVE_VERSION`: läuft ohne Änderung auf neu.
- Code-erzeugte Szenario-Stände bekommen C über `createWorld`; fest abgelegte Fixtures laufen über die Kette.
- Neue Browser-Stände (Spec §10.4): `m14e1-start`, `m14e1-felsbucht`, `m14e1-weidenau`, `m14e1-altstand` [Tech:
  Namen].

## F. Erwartungswerte für die Save-AK

| AK           | Eingabe                                                                                             | Ergebnis                                                                                  |
| ------------ | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| AK-M14E1-20  | Version neu, Kontor II, 1 Zuckerrohrplantage, 1 Schäferei auf Weidenau, Lager Weidenau Zuckerrohr 7 | Rundlauf ok, tief gleich                                                                  |
| AK-M14E1-21  | Vorversion, 3 Inseln, Seed 3, Kontor II und Steinbruch auf der Felsbucht                            | ok, `version` neu, 4 Inseln, `islands[3]` = `createWorld(3).islands[3]`, Rest unverändert |
| AK-M14E1-22  | Fixtures v1 … Vorversion; v7-Fixture                                                                | ok, `version` neu, genau 4 Inseln, Insel 3 `'C'`                                          |
| AK-M14E1-23a | Version neu mit 3 Inseln                                                                            | `'Beschädigter Spielstand'`                                                               |
| AK-M14E1-23b | Version neu mit 5 Inseln (Insel 3 doppelt)                                                          | `'Beschädigter Spielstand'`                                                               |
| AK-M14E1-23c | Insel 3 mit `kind 'B'`; Insel 2 und 3 vertauscht                                                    | `'Beschädigter Spielstand'`                                                               |
| AK-M14E1-23d | Insel 3 mit `width 36`                                                                              | `'Beschädigter Spielstand'`                                                               |
| AK-M14E1-23e | Gebäude mit `island 4`                                                                              | `'Beschädigter Spielstand'`                                                               |
| AK-M14E1-23f | Vorversion mit `islands` kein Array bzw. Heimat ohne `anchor`                                       | kein Wurf, `'Beschädigter Spielstand'`                                                    |
| AK-M14E1-24a | `serialize(createWorld(3))`                                                                         | Vorversion-Form, `JSON.stringify` gleich der Form vor E1 (Pin-Wert)                       |
| AK-M14E1-24b | Weltschlüssel `foo: 1` am Ende                                                                      | Fehler «unbekannter Schlüssel foo»                                                        |
| AK-M14E1-24c | Insel 3 mit `kontorId` gesetzt                                                                      | Fehler «Insel C nicht rückfaltbar»                                                        |
| AK-M14E1-24d | Insel 3 mit `stock.cane 1`                                                                          | Fehler «Insel C nicht rückfaltbar»                                                        |
| AK-M14E1-24e | Kachel auf Insel 3 mit `road true`; Gebäude mit `island 3`                                          | Fehler «Insel C nicht rückfaltbar»                                                        |
| AK-M14E1-24f | Schiff mit Route 1–3                                                                                | Fehler «Insel C nicht rückfaltbar»                                                        |
| AK-M14E1-24g | Insel 1 mit Zusatzschlüssel `x: 0` am Ende; Insel 2 mit abweichender Schlüsselfolge                 | `x` entfernt; Folge von Insel 2 bleibt                                                    |
| AK-M14E1-24h | nur 3 Inseln bei Version neu                                                                        | Fehler «4 Inseln erwartet»                                                                |
| AK-M14E1-25  | `version` neu + 1; Text `{"version": ` (abgeschnitten)                                              | `'Unbekannte Version'`; `'Ungültiges Format'`                                             |

Jeder Ladefall: `deserialize` wirft nicht. «Version neu mit 3 Inseln» meint einen Stand mit `version` = neu, für den
die Migration nicht läuft.
