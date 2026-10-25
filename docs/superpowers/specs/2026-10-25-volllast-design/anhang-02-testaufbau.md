# Anhang 02 · Testaufbau und Zahlenwege Volllast

Gehört zu [Spec Volllast](../2026-10-25-volllast-design.md), Abschnitt Abnahmekriterien. Rechenweg der Werte:
Rechnung [Anhang 01](../2026-10-25-volllast-rechnung/anhang-01-rechenweg.md) (A.1 Formeln, A.2 Kettentabelle).

## A Testwelten

- Grundwelt: `createWorld(seed, { unlockAll: true, crisisLevel: 'off' })` mit zwei festen Seeds (Parametrisierung wie
  R553), Heimatinsel mit Kontor. Betriebe setzt der Test mit den bestehenden Helfern (`tests/sim/helpers.ts`:
  `prepareEast`, `forceGrass`, `forceRect`) und verbindet sie per Strasse mit dem Kontor; Vorbedingung im Test prüfen
  (`b.connected === true`, Zustand `ok` nach einem Schritt).
- **Keine Verbraucher** für das Ausstossgut (keine Häuser, kein Vertrag, kein Auftrag, kein Markt-Verkauf), damit die
  Lagerdifferenz gleich der erzeugten Menge ist. Lager des Eingangs vor dem Lauf setzen (Wolle 100 = `STORAGE_CAP`).
- Stufe 2/3: `b.level` direkt setzen (wie bestehende Ausbau-Tests) oder `upgradeBuilding` mit gefülltem Lager.
- Inselvorteil (AK-VL-03): eine Kolonie-Insel mit `mountainRich` bzw. `fertile` aus einem Seed, der sie erzeugt, oder
  die Insel-Art im Test setzen; Vorbedingung `traitOf(...) !== undefined` prüfen.
- Sturm (AK-VL-14): `crisisLevel: 'normal'`, `world.crisis` im Test auf einen wirkenden Sturm setzen (`kind: 'storm'`,
  `from ≤ tick`, `until ≥ tick + 100`), Fischer `stormAffected`. Krise wird nicht über den Zufall ausgelöst.
- Brand (AK-VL-07, -10): `outageUntil` im Test setzen und `state = 'burning'`, wie bestehende Brandtests.
- Phase direkt herstellen: `b.overtimeAt = world.tick − d` (für AK-VL-15, -16); sonst immer über `startOvertime`.

## B Zahlenwege

- **AK-VL-01:** `ceil(c × 75 / 100)`: 1 → 0,75 → 1; 2 → 1,5 → 2; 3 → 2,25 → 3; 4 → 3; 8 → 6; 20 → 15; 30 → 22,5 → 23;
  50 → 37,5 → 38. `3c ≤ 4c'` folgt aus `c' ≥ 0,75 c`.
- **AK-VL-03:** Glashütte St. 3: 20 → Inselvorteil `floor(20 × 50 / 100)` = 10 → Volllast `ceil(7,5)` = **8**. Andere
  Reihenfolge: `ceil(15)` = 15 → `floor(7,5)` = 7. Schäferei St. 1: 50 → 25 → `ceil(18,75)` = 19 (andere Reihenfolge:
  38 → 19, gleich; dieser Fall prüft nur die Wirkung). Weberei St. 3 mit Erntefest: 20 → `floor(15)` = 15 →
  `ceil(11,25)` = **12**; andere Reihenfolge 15 → `floor(11,25)` = 11.
- **AK-VL-04:** `ceil(15 × 1,5)` = `ceil(22,5)` = 23; `ceil(15 × 0,5)` = `ceil(7,5)` = 8; `ceil(17 × 1,5)` = 26;
  `ceil(8,5)` = 9. Sparen: `upkeepPct` 80 (`src/sim/defs/edicts.ts:9`) auf die Summe (`economy.ts:62-68`).
- **AK-VL-06 / -19 (Zählung):** Aktion bei Tick T (zwischen zwei Schritten). Schritt `T + j` hat `d = j`.
  Volllast `j` = 1 … 1799, Ruhe `j` = 1800 … 2999, Schritt `j` = 3000 löscht das Feld vor `advance` und läuft normal.
- **AK-VL-19 (Menge):** Normal: Einheiten bei `j` = 50, 100, …, 3000 → 60. Volllast: Einheiten bei `j` = 38, 76, …,
  1786 (= 47 × 38) → 47; `progress` nach `j` = 1799: 13; Ruhe friert ein; `j` = 3000: `progress` 14 → keine weitere
  Einheit. Summe **47** (78 % von 60; Rechnung A.1 `a` = 0,79).
- **AK-VL-19 (Unterhalt):** Normal 3000 × 15 / 100 = 450. Volllast (1799 × 23 + 1200 × 8 + 1 × 15) / 100 = 509,92.
  Wegen des ganzzahligen Übertrags (`tickEconomy`) ist die Differenz der Kassen 59 oder 60 (Rechnung A.2 `ΔU` 60).
- **AK-VL-08:** Folgt aus derselben Zählung: `progress` 13 bei Ruhebeginn, 14 nach dem ersten normalen Schritt.
- **AK-VL-09:** `progress` 40 mit `c` 50 (normal, ohne Einheit). Start der Volllast, nächster Schritt: `progress` 41
  ≥ 38 → Einheit, `progress` 0. Entnahme nur bei `progress` 0 zu Schrittbeginn, also keine.
- **AK-VL-12:** Weberei St. 2: `c` 30 → `ceil(22,5)` = 23; `u` 20 → `ceil(30)` = 30; Ruhe `ceil(10)` = 10
  (`src/sim/defs/levels.ts:32`).
- **AK-VL-14:** Fischer St. 1 `c` 40 → `c'` 30. Im Sturm wächst `progress` nur bei geradem Tick
  (`STORM_TICK_DIVISOR` 2): 30 Fortschritt in 60 Schritten, normal 40 in 80. Je nach Parität des Starts ± 1 Schritt;
  der Test startet bei geradem Tick und prüft exakt 60 bzw. 80.
- **Upkeep in der Anzeige:** `perMinute(u, 100)` = `u × 6`: 15 → 90, 23 → 138, 8 → 48; Zusatz +48 bzw. −42.

## C Browser-Check (AK-VL-22, -23)

1. `npm run dev`, Fenster 1280 × 800, neues Spiel mit Testkarte; Weberei bauen, mit Kontor verbinden, Wolle ≥ 20 im
   Lager (Kontor-Kauf). Screenshot Panel mit Knopf «Volllast» neben «Stilllegen».
2. Maus über den Knopf: Tooltip wie Anhang 01 B (Screenshot), Zahlen gegen Panelzeilen «Stoff · alle …» und
   «Unterhalt … / min» vergleichen.
3. Klick: Zustandszeile «Volllast 3:00», Unterhaltszeile «138 / min (+48 / min durch Volllast)», Knopf gesperrt mit
   «Volllast läuft noch 3:00» (Screenshot). 10 s warten: Restzeit sinkt um 10 s (bei 1×).
4. Zeitraffer 4× bis zur Ruhe: «Ruht 2:00», Unterhalt «48 / min (−42 / min in der Ruhe)», Auslastung sinkt, Knopf
   «Ruht noch …» (Screenshot). Bis zum Ende laufen lassen: Zustand normal, Knopf frei.
5. Sperrgründe: Weberei stilllegen (Knopf «Stillgelegt: erst anfahren»), Strasse abreissen («Keine Strassenverbindung»),
   Brand per Testkarte oder abwarten (falls im Lauf nicht auslösbar: Vitest AK-VL-10 genügt, im Bericht vermerken).
6. Wolle auf 0: Tooltip mit «Eingang fehlt: Volllast verpufft».
7. AK-VL-23: Volllast starten, speichern, Seite neu laden, laden → Restzeit ± 1 s gleich, Uhr läuft. Danach einen
   Spielstand der Vorgängerversion laden (aus dem Speicher eines main-Builds vor dem Merge): Hinweis erscheint, kein
   Absturz, Konsole ohne Fehler.
