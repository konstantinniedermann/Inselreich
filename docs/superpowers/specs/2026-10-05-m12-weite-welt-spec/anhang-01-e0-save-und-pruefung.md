# Anhang 01 — E0: Save v7, Ladeprüfung, Fixture, Dichte-Szene, Fold-back

Zur [Spec M12](../2026-10-05-m12-weite-welt-spec.md), Teil E0 (Abschnitt 4). Code-Stand der Prüfung: `main`
17cbafb. **[Tech]** markiert Vorschläge, die lead-tech im Plan ändern darf, solange das prüfbare Verhalten gleich
bleibt.

## A. Save v7 Feld für Feld

| v6 (oberste Ebene)                                                                                                                                                                                                       | v7                                          | Migration `migrateV6ToV7` |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------- | ------------------------- |
| `version: 6`                                                                                                                                                                                                             | `version: 7`                                | setzen                    |
| `width`, `height`                                                                                                                                                                                                        | `islands[0].width`, `islands[0].height`     | verschieben, oben löschen |
| `tiles`                                                                                                                                                                                                                  | `islands[0].tiles` (Kachelform unverändert) | verschieben, oben löschen |
| `kontorId`                                                                                                                                                                                                               | `islands[0].kontorId`                       | verschieben, oben löschen |
| `stock`                                                                                                                                                                                                                  | `islands[0].stock`                          | verschieben, oben löschen |
| `buildings[id]` (alle Felder)                                                                                                                                                                                            | dazu `island: 0`                            | je Gebäude setzen         |
| `seed`, `tick`, `nextBuildingId`, `money`, `stats`, `won`, `wonMerchants`, `taxLevel`, `taxLockedUntil`, `sellPct`, `order`, `crisisLevel`, `crisis`, `unlocked`, `goodLocks`, `upgradeStops`, `taxCarry`, `upkeepCarry` | unverändert, global                         | nicht anfassen            |

- `Island = { width: number; height: number; tiles: Tile[]; kontorId: number; stock: Record<GoodId, number> }`.
- `crisis.tile` (Brand) bezieht sich in v7 auf Insel 0; die Prüfung `isValidTile` bleibt gegen `MAP_W`/`MAP_H`.
- **[Tech]** Schlüsselreihenfolge in `createWorld`: `version`, `seed`, `tick`, `islands`, `buildings`, … (frei); die
  Rückfaltung in E stellt die v6-Reihenfolge selbst her. Position von `island` im Gebäude frei.
- Grösse: v7 wächst je Gebäude um `"island":0,` (11 Zeichen); bei 600 Gebäuden ≈ 6,6 KB, unkritisch.

Kette in `deserialize`: v1 → v2 → v3 → v4 (`fromV4` merken) → v5 → v6 → **v7** → Versionsprüfung → Ladeprüfung →
`recomputeConnectivity` → bei `fromV4` `deriveUnlocks`. Ältere Migrationen schreiben weiter auf die oberste Ebene
(`raw.stock.glass` in v3 → v4); erst v6 → v7 verschiebt.

## B. Ladeprüfung v7 (vollständige Negativliste)

Jeder Fall einzeln aus einem gültigen v7-Stand (bzw. v6 für 1–2) erzeugt, Ergebnis „Beschädigter Spielstand", keine
Ausnahme (Muster `tampered` in `save.test.ts`):

| Nr.     | Ausgangsstand | Änderung                                                                   |
| ------- | ------------- | -------------------------------------------------------------------------- |
| N01–N02 | v6            | `stock` ohne `glass`; `buildings: {}`                                      |
| N03–N06 | v7            | `islands` fehlt; kein Array; `[]`; zwei Inseln (zweite = Kopie der ersten) |
| N07–N10 | v7            | Insel 0 `width 63`; `height 65`; 4095 Kacheln; eine Kachel `null`          |
| N11–N13 | v7            | `kontorId` ohne Gebäude; auf eine Kapelle; Kontor mit `island 1`           |
| N14–N15 | v7            | `stock` ohne ein Gut; `stock.wood` als Text                                |
| N16–N20 | v7            | ein Gebäude ohne `island`; `island` 1; −1; 0,5; `"0"`                      |

Positiv: v7 mit zusätzlichen v6-Feldern auf oberster Ebene (`tiles` doppelt) ist **kein** Prüfgegenstand von E0;
**[Tech]** lead-tech entscheidet, ob solche Reste abgewiesen werden (Empfehlung: abweisen, weil `serialize` sie sonst
mitschleppt).

## C. Fixture `save-v6.json` (Schritt 0, vor jeder Code-Änderung)

Erzeugt auf `main` ohne E0 mit einem Einmal-Skript im Test-Stil (Befehl und Commit im Kopfkommentar von
`save.test.ts`, wie M11 Anhang 02 E):

1. `createWorld(3, { crisisLevel: 'normal' })`, Controller `buildColony` wie in `balance-crises` (mit Feuerwache).
2. Anhalten am ersten Tick, an dem ein Gebäude `burning` ist und ein Auftrag offen ist. Gibt es diesen Tick bis
   zum Sieg nicht, am ersten Tick mit `burning`; der offene Auftrag wird dann nur über AK-E0-05 geprüft.
3. Vor dem Speichern über Sim-Aktionen (nicht von Hand im JSON): Amtsstube bauen, falls nötig; eine Ausgabesperre
   und einen Aufstiegsstopp setzen; einen Betrieb auf `level 2` ausbauen.
4. Jedes der 9 Güter im Lager ≠ 0 (sonst über Kauf am Kontor herstellen); `taxCarry` und `upkeepCarry` ≠ 0.
5. `serialize` → `tests/sim/fixtures/save-v6.json`. Im Test steht ein Rohtest wie M11 T00: `version 6`, Brand aktiv,
   Lagerwerte, Sperren vorhanden.

Ebenfalls in Schritt 0 gepinnt: je Fixture `save-v1` … `save-v5` der Hash `fnv1a32(serialize(geladene v6-Welt))`
(AK-E0-04) und die Krisen-/Auftragsfolge des Laufs „normal" + Feuerwache (AK-E0-19).

## D. Dichte-Szene D1 (AK-E0-12, AK-E0-15)

- `createWorld(3, { unlockAll: true })`; Gebäude **direkt** in `buildings` geschrieben (ohne Platzierungsregeln,
  ohne Kachelbelegung), alle `connected: true`, `state 'ok'`, `island 0`.
- 484 Wohnhäuser auf `(3i, 3j)`, `i, j = 0 … 21`, Stufe 4, 20 Einwohner, `supplied: true`.
- 64 Dienstgebäude auf `(1 + 8i, 1 + 8j)`, `i, j = 0 … 7`, reihum Kapelle, Schule, Badehaus.
- Szene als Helfer `denseScene()` in `tests/sim/helpers.ts`.

**Messung Ist** (design-spec-author, 2026-10-05, `main` 17cbafb, Entwicklerrechner, lokal, Vitest):

| Messung                                                      | Ergebnis                    |
| ------------------------------------------------------------ | --------------------------- |
| D1: 1000 × `step`                                            | 19 023 ms (≈ 19 ms/Schritt) |
| D1: 100 × (484 Häuser × 3 Dienste) `serviceAvailable`        | 1 708 ms (≈ 17 ms/Schritt)  |
| Referenzlauf Controller Seed 3, `off`, bis Sieg (6750 Ticks) | 147 ms                      |

Folgerung: Die Dienst-Abdeckung ist ≈ 90 % der Schrittzeit in D1. Erwartet nach Index: Dienste < 1 ms; Rest
(`isSupplied` O(Häuser × Gebäude), Verbrauch) ≈ 2–4 ms → Schwelle 6 ms je Schritt mit Reserve.

## E. Fold-back (Testhelfer `foldBackToV6`)

Eingabe: v7-JSON als Objekt mit genau einer Insel. Ausgabe: v6-Objekt, **in v6-Schlüsselreihenfolge** neu aufgebaut:
`version` (6), `seed`, `width`, `height`, `tick`, `tiles`, `buildings`, `nextBuildingId`, `kontorId`, `stock`,
`money`, `stats`, `won`, `wonMerchants`, `taxLevel`, `taxLockedUntil`, `sellPct`, `order`, `crisisLevel`, `crisis`,
`unlocked`, `goodLocks`, `upgradeStops`, `taxCarry`, `upkeepCarry`; je Gebäude `island` gelöscht, übrige Reihenfolge
unverändert. Unbekannte Felder → Testfehler (damit ein vergessenes neues Feld auffällt).

Verwendung: (1) erster Schritt von `normalized()` in `balance-crises` (danach setzt `normalized` wie heute
`version 2`); (2) Vergleich AK-E0-02/03/04; (3) Erzeugen von v6-Ständen aus einem laufenden v7-Spiel für AK-E0-05.
Eigentest: Fold-back von `createWorld(3)` ist zeichengleich mit der in Schritt 0 gepinnten v6-Serialisierung.

## F. Testwelt mit zwei Inseln (`twoIslandWorld()`)

Nur für Tests, nie gespeichert (die Ladeprüfung von E0 würde sie abweisen): `createWorld(3, { unlockAll: true })`,
dazu `islands[1]` = Kopie der Heimat-Kacheln (gleiche Grösse), eigenes Kontor auf derselben Kachelposition wie das
Heimatkontor mit neuer Id und `island 1`, `stock` alle Güter 0 ausser Holz/Werkzeug je 50. Gleiche Koordinaten auf
beiden Inseln sind gewollt: Sie zeigen, dass Radius-, Wege- und Lagerabfragen die Insel prüfen und nicht nur `x, y`.

## G. Randfälle E0 (Tabelle zu Spec 4.6)

| Fall                                                              | Erwartung                                                        | AK       |
| ----------------------------------------------------------------- | ---------------------------------------------------------------- | -------- |
| v6 mit laufendem Brand (`burning`, `outageUntil`, Krise)          | lädt; Weiterlauf wie ohne Speichern/Laden                        | AK-E0-05 |
| v6 mit aktivem Sturm, mit Boom, mit offenem Auftrag               | lädt; Weiterlauf identisch; Auftrag weiter lieferbar             | AK-E0-05 |
| v6-`stock` mit allen 9 Gütern ≠ 0                                 | Werte landen unverändert in `islands[0].stock`                   | AK-E0-03 |
| v6-`stock` ohne ein Gut                                           | „Beschädigter Spielstand"                                        | AK-E0-07 |
| v6 nur mit Kontor (sonst keine Gebäude)                           | lädt; `islands[0].kontorId` = Kontor, Kontor `island 0`          | AK-E0-06 |
| v6 mit `buildings: {}` (kein Kontor)                              | „Beschädigter Spielstand", keine Ausnahme (wie heute)            | AK-E0-07 |
| v6 mit `unlocked`, `goodLocks`, `upgradeStops`                    | unverändert übernommen, keine Neuableitung (nur ab v4 wie heute) | AK-E0-06 |
| v4 und älter                                                      | Kette bis v7; `deriveUnlocks` wie heute                          | AK-E0-04 |
| v7 speichern, laden, speichern                                    | Text identisch                                                   | AK-E0-08 |
| v7 mit 0 oder 2 Inseln, falscher Inselgrösse                      | „Beschädigter Spielstand" (E0 kennt genau eine Insel)            | AK-E0-07 |
| Gebäude ohne `island`, mit `island` 1 oder `-1`                   | „Beschädigter Spielstand"                                        | AK-E0-07 |
| v7-Stand in einem Build vor E0                                    | „Unbekannte Version"                                             | AK-E0-09 |
| v8-Stand in einem E0-Build                                        | „Unbekannte Version"                                             | AK-E0-09 |
| Dienstgebäude genau auf Radiusgrenze                              | gleiches Ergebnis wie naive Referenz (`≤`)                       | AK-E0-12 |
| Dienstgebäude gebaut, abgerissen, Brand, Weg weg — ohne Tick      | Abdeckung sofort aktuell                                         | AK-E0-13 |
| Kapelle auf Insel 1 im Radius eines Hauses auf Insel 0 (Testwelt) | keine Abdeckung (fremde Insel)                                   | AK-E0-11 |
