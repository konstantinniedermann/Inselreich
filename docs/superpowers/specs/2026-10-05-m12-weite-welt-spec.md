# M12 „Weite Welt" — Design-Spec

Datum: 2026-10-05 · Paket M12-SPEC · Meilenstein M12 · Status: **Spec, Phase 1 (Teil E0) zur Abnahme durch
lead-design**; E1–E6 folgen in Phase 2 · Prozessstufe voll (Save v7, Baseline in E0 bitgleich)

Grundlage: [Vorschlag M12](2026-10-05-m12-weite-welt-design.md) mit
[Anhang 01 Wirtschaft](2026-10-05-m12-weite-welt-design/anhang-01-wirtschaft.md); Ruling **R226** (Gate
Brainstorming: Ansatz C, F-01 bis F-07); [M11-Spec](2026-10-03-m11-wirtschaft-im-fluss-spec.md) (Save v6,
Fingerabdruck); [Hauptspec](2026-09-29-inselreich-design.md).

Anhänge (`2026-10-05-m12-weite-welt-spec/`):
[01](2026-10-05-m12-weite-welt-spec/anhang-01-e0-save-und-pruefung.md) Save v7 Feld für Feld, Ladeprüfung,
Fixture-Rezept, Dichte-Szene D1 mit Messung Ist, Fold-back, Testwelt mit zwei Inseln, Randfälle.

Kennzeichnung: **Setzung Spec** (in der Spec neu gesetzt, nicht im Vorschlag), **[Tech]** (Umsetzungsdetail; lead-tech
entscheidet im Plan, die Spec legt nur das prüfbare Verhalten fest), **Phase 2** (Regel wird in E1–E4 erweitert).

Code-Stand der Prüfung: `main` 17cbafb (Save v6, `SAVE_VERSION = 6`, `OFF_FINGERPRINT 0x701c6da5`).

## 1. Ziel

**Spielerzweck (M12):** „Ich sehe ferne Inseln, gründe auf einer davon ein zweites Kontor, baue dort an, was nur dort
wächst, und schicke ein Schiff, das die Ware zu meiner Stadt bringt."

**Zweck von E0:** Der Weltzustand lernt „Insel". Lager, Kacheln und Kontor gehören einer Insel, jedes Gebäude weiss,
auf welcher Insel es steht. Es gibt in E0 genau eine Insel (die Heimat); der Spieler merkt nichts. E0 wird als
**Werkzeug-Merge vorab** (R226 F-06) auf `main` gebracht: Die grösste Umstellung von M12 läuft allein, bitgleich
und mit altem Spielstand geprüft, bevor Fremdinseln, Schiffe und Gewürz dazukommen.

## 2. Begriffe

- **Insel:** eigenes Kachelraster mit eigenem Lager und genau einem Kontor; Eintrag in `World.islands`.
  **Inselindex:** Position in `islands`; **Heimat** = Insel 0 (heutiger Generator, 64 × 64), immer.
  **Fremdinsel:** Insel ≥ 1, ab E1; in E0 nur in Tests, nie im Spiel oder Save.
- **Inselbezug:** Jeder Lagerzugriff und jede Kachelabfrage nennt ihre Insel. **Global:** gilt für die ganze Welt.
- **Dienst-Abdeckung:** „hat dieses Haus Dienst X im Radius" (`serviceAvailable`, auch `requiresService`).
  **Naive Referenz:** heutige Implementierung (alle Gebäude je Haus), in E0 nur noch Testvergleich.
- **Fingerabdruck:** `fnv1a32(normalized(serialize(w)))` am Ende des `off`-Referenzlaufs (`balance-crises`).
  **Bitgleich:** Referenzläufe, Pins und Fingerabdruck vor und nach dem Teil identisch, kein Pin nachgestellt.
- **Fold-back:** Testhelfer, formt eine v7-Welt in die v6-Form zurück (Anhang 01 E).

## 3. Scope M12 und Zuschnitt

| Teil   | Inhalt (Kurz)                                                                       | Status in dieser Spec |
| ------ | ----------------------------------------------------------------------------------- | --------------------- |
| **E0** | Inseln im Weltzustand, Save v7, Dienst-Abdeckung als Index; bitgleich               | **vollständig (4)**   |
| E1     | Fremdinsel-Generator, Archipel-Plätze, Render mehrerer Raster, offenes Meer         | folgt in Phase 2      |
| E2     | Kontor II gründen, Bauen auf Fremdinseln, Handel an jedem Kontor, U6 „Seefahrt"     | folgt in Phase 2      |
| E3     | Gewürz, Plantage, Bedarf Kaufleute, Steuer 22 (bewusster Bruch `balance-merchants`) | folgt in Phase 2      |
| E4     | Schiffe und Routen                                                                  | folgt in Phase 2      |
| E5, E6 | Kann: Seekarten-Übersicht, Gründungsfahrt; Händlerschiff-Angebot (I-006)            | folgt in Phase 2      |

## 4. Teil E0 — Inseln im Weltzustand

### 4.1 Grenze von E0

E0 ändert **nur die Form** des Weltzustands und die Laufzeit der Dienst-Abdeckung. Kein neues Gebäude, kein neues
Gut, kein neuer Spielwert in `src/sim/defs/`, keine neue Freischaltung, kein neuer Text, keine sichtbare Änderung in
Render oder UI. Die Liste `islands` hat im Spiel und in jedem gültigen Save **genau einen** Eintrag.

### 4.2 Regeln

**R-E0-1 Global oder je Insel** (A-06 des Vorschlags):

- **je Insel:** `width`, `height`, `tiles`, `kontorId`, `stock`.
- **je Gebäude:** `island` (Inselindex, Pflichtfeld); `x`, `y` sind Kachelkoordinaten der eigenen Insel.
- **global (alles Übrige):** `seed`, `tick`, `buildings`, `nextBuildingId`, `money`, `stats`, Ziele, Steuer,
  `sellPct` (Sättigung), `order`, Krisen, `unlocked`, `goodLocks`, `upgradeStops`, Überträge.

**R-E0-2 Gebäude bleiben eine globale Liste.** `buildings` bleibt ein Objekt über alle Inseln mit globalen Ids aus
einem Zähler `nextBuildingId`. Jeder Tick-Schritt, der heute Gebäude in Id-Reihenfolge durchläuft, tut das weiter über
alle Inseln in Id-Reihenfolge (nicht Insel für Insel). Grund: Reihenfolge und damit Bitgleichheit bleiben ohne
Sonderfall erhalten. `tiles[i].buildingId` verweist auf die globale Id; das Gebäude trägt dieselbe Insel wie die
Kachel.

**R-E0-3 Inselbezug je Zugriff** (jede Stelle, die heute `world.stock`, `world.tiles`, `world.kontorId`,
`world.width`/`height` liest oder schreibt):

| Zugriff                                                           | Insel                                   |
| ----------------------------------------------------------------- | --------------------------------------- |
| Produktion liefert, Betrieb entnimmt Eingangsware                 | Insel des Betriebs                      |
| Haus entnimmt Bedarf, Hausaufstieg bezahlt Waren                  | Insel des Hauses                        |
| Bauen, Ausbau, Abriss-Erstattung                                  | Insel des Bauplatzes bzw. Gebäudes      |
| Platzierung, Standortregeln, Wege, Anbindung, Versorgung, Dienste | nur Kacheln und Gebäude derselben Insel |
| Kauf und Verkauf am Kontor                                        | Insel des Kontors                       |
| Auftrag liefern                                                   | Heimat (**Phase 2**: an jedem Kontor)   |
| Bilanz und Dämpfung (`goodsBalance`, `flow.ts`)                   | Heimat (**Phase 2**: je Insel, E2)      |
| Brandziel (`flammableRect`), `crisis.tile`                        | Heimat (**Phase 2**: alle Inseln, E2)   |

Mit genau einer Insel ergibt jede Zeile dasselbe wie heute. **[Tech]** Zugriffshelfer (etwa „Insel eines Gebäudes",
„Heimat") und ein Insel-Parameter mit Standard 0 an Bau- und Abfrage-Funktionen sind erlaubt; Form und Namen
entscheidet lead-tech.

**R-E0-4 Zählungen bleiben global** (Setzung Spec): Einwohner, Bürger, Kaufleute, Ziel 1 und 2, Freischalt-Auslöser
(`houses`, `tierWish`, `tierReached`, `tierOpen`), höchste Hausstufe für Aufträge und Krisen zählen über alle Inseln.

**R-E0-5 Ein Kontor je Insel.** `islands[i].kontorId` verweist auf ein Gebäude mit `defId 'kontor'` und
`island = i`. Das Heimatkontor ist wie heute nicht abreissbar.

**R-E0-6 Zufall unverändert.** E0 ruft `createRng` an keiner neuen Stelle auf und ändert keine Eingabe der
bestehenden Ziehungen (`orderForPeriod`, `rollCrisis`, `generateMap`).

### 4.3 Save v7

Feld für Feld, Ladeprüfung im Detail und Fixture-Rezept: Anhang 01 A–C.

- `SAVE_VERSION = 7`, `World.version: 7`. Neu `islands: Island[]`; ein `Island` trägt `width`, `height`, `tiles`,
  `kontorId`, `stock`. Diese fünf Felder entfallen auf oberster Ebene. Neu `Building.island: number` (Pflicht).
- `createWorld(seed)`: `islands` = ein Eintrag mit dem heutigen Generator (64 × 64, Kontor-Id 1, `START_STOCK`),
  Kontor mit `island 0`; alle globalen Felder wie heute.
- **`migrateV6ToV7`** (nach `migrateV5ToV6`, vor der Ladeprüfung): die fünf v6-Felder werden zu `islands[0]` und
  oben gelöscht, jedes Gebäude erhält `island 0`, `version 7`. Kein Wert wird umgerechnet. Die Kette v1 → … → v7
  läuft für jeden alten Stand.
- **Ladeprüfung v7** (sonst „Beschädigter Spielstand", nie eine Ausnahme): `islands` ist ein Array mit **genau
  einem** Eintrag (Phase 2 lockert das); Insel 0 hat `width 64`, `height 64` (`MAP_W`/`MAP_H`), `tiles` mit 4096
  Objekten, `stock` mit allen 9 Gütern als Zahl, `kontorId` auf ein Kontor mit `island 0`; jedes Gebäude hat
  `island` als Ganzzahl in `[0, islands.length)`. Alle v2–v6-Prüfungen gelten weiter auf denselben Feldern (Lager
  jetzt `islands[0].stock`).
- `version` ≠ 7 nach der Kette → „Unbekannte Version" (wie heute). Ein Build vor E0 lehnt einen v7-Stand mit
  „Unbekannte Version" ab (heutige Zeile `raw.version !== SAVE_VERSION`); er lädt ihn nie still mit fehlenden Daten.
- Abgeleitete Daten (Index aus 4.4, Anbindung) sind **nicht** Teil des Saves; `connected` wird wie heute nach dem
  Laden neu abgeleitet.
- **Fixture** `tests/sim/fixtures/save-v6.json` wird **vor** der ersten Code-Änderung auf `main` (17cbafb oder
  Nachfolger ohne E0) erzeugt; Rezept Anhang 01 C (Controller Seed 3, Krisen „normal", Feuerwache, laufender Brand,
  offener Auftrag, Sperren gesetzt). Commit und Befehl stehen im Testkommentar.

### 4.4 Dienst-Abdeckung als Index

- **Messung Ist** (`main` 17cbafb, Dichte-Szene D1 nach Anhang 01 D: 484 Häuser, 64 Dienstgebäude): 1000 Schritte
  ≈ 19,0 s, davon `serviceAvailable` ≈ 17 ms je Schritt (≈ 90 %). Ursache: je Haus und Dienst werden alle Gebäude
  durchsucht (O(Häuser × Gebäude)); mit mehreren Inseln wächst das weiter.
- **Regel:** Die Dienst-Abdeckung liefert für jedes Haus, jeden Dienst und jeden Zeitpunkt **dasselbe Ergebnis** wie
  die naive Referenz: gleicher Abstand (Mitte zu Mitte, `Math.hypot`, `≤ serviceRadius`), gleiche Bedingungen
  (Dienst passt, `connected`, kein `outageUntil`), nur Gebäude **derselben Insel**. Das gilt auch zwischen zwei Ticks
  direkt nach Bau, Abriss, Wegänderung, Brandbeginn und Brandende, und für `requiresService` in `production.ts` und
  die Gründe in `queries.ts`.
- **[Tech]** Form frei: z. B. Dienstgebäude je Insel und Dienst vorgefiltert (je Tick oder bei Änderung neu), oder
  Abdeckungsraster je Insel. Der Index liegt ausserhalb des Saves und ändert `serialize` nie. Dieselbe Technik darf
  `isSupplied`/`inSupplyRange` (Versorgung, heute ebenfalls O(Häuser × Gebäude)) beschleunigen; dann gilt die
  Ergebnisgleichheit (AK-E0-12) auch dafür.
- Die naive Referenz wandert als Testhelfer nach `tests/sim/helpers.ts` (nicht mehr im Spielcode aufgerufen).

### 4.5 Bitgleichheit und Baseline

- **Bleibt unverändert und grün:** `tests/sim/balance.test.ts` (Datei unverändert), `balance-crises` (Referenz `off`:
  Sieg 6750, `minMoney` 117, `endMoney` 339, Siedler/Bürger 350/4150, Gebäudezahlen; „normal" + Feuerwache 7850;
  „mild" 7850; Wiederladen im Brand und im Sturm), `balance-merchants` (`[6750, 11200, 320]`), `balance-flow`,
  `balance-upgrade`.
- **Messpunkt Fingerabdruck:** am Ende des `off`-Laufs `fnv1a32(normalized(serialize(w))) === 0x701c6da5`
  (`OFF_FINGERPRINT`, Wert unverändert). `normalized()` erhält dafür als **ersten** Schritt den Fold-back (Anhang
  01 E); alle übrigen Schritte bleiben.
- **Zufallsströme:** Folge der Krisen und Aufträge im Referenzlauf „normal" + Feuerwache (je Periode: Art, Ziel-Id,
  Ausgang, Gut, Menge, Prämie) wird **vor** E0 auf `main` gemessen und als Liste gepinnt; nach E0 identisch.
- Weicht ein Pin ab → nicht nachstellen, Meldung an lead-tech und L0 (R74). E0 hat **keinen** Neupin.

### 4.6 Randfälle

Vollständige Tabelle mit Erwartung je Fall: Anhang 01 G.

- **Alter Stand (v6):** laufender Brand, aktiver Sturm, Boom, offener Auftrag → lädt, Weiterlauf identisch
  (AK-E0-05); `stock` mit allen 9 Gütern → Werte unverändert in Insel 0 (AK-E0-03); nur das Kontor → lädt
  (AK-E0-06); `buildings: {}` oder Gut fehlt → „Beschädigter Spielstand" (AK-E0-07); `unlocked`, `goodLocks`,
  `upgradeStops` → wörtlich übernommen (AK-E0-06); v4 und älter → Kette mit `deriveUnlocks` (AK-E0-04).
- **v7:** speichern, laden, speichern → Text gleich (AK-E0-08); 0 oder 2 Inseln, falsche Grösse, `island` fehlt oder
  ausserhalb → „Beschädigter Spielstand" (AK-E0-07); v7 im Build vor E0, v8 im E0-Build → „Unbekannte Version"
  (AK-E0-09).
- **Abdeckung:** Abstand genau Radius (AK-E0-12); Bau, Abriss, Brand, Weg weg ohne Tick (AK-E0-13); Kapelle auf
  fremder Insel in Koordinatenreichweite (AK-E0-11).

### 4.7 Abnahmekriterien E0

Vitest in CI (`make test`); „neu" = neue Datei. Testwelt mit zwei Inseln: Helfer `twoIslandWorld()` in
`tests/sim/helpers.ts` (Anhang 01 F), nur im Speicher, nie gespeichert.

**Save** (`tests/sim/save.test.ts`)

- **AK-E0-01** `SAVE_VERSION` 7; `createWorld(3)`: `version 7`, `islands.length` 1, Insel 0 64 × 64,
  4096 Kacheln, `kontorId 1`, `stock` = `START_STOCK`; oben keine Felder `width`, `height`, `tiles`,
  `kontorId`, `stock`; jedes Gebäude `island 0`. Terrain von `islands[0].tiles` gleich `generateMap(3).terrain`.
- **AK-E0-02** `createWorld(s, { unlockAll: true })` und `{ crisisLevel }` setzen dieselben globalen Felder wie vor E0
  (Vergleich über Fold-back mit der gepinnten v6-Form).
- **AK-E0-03** `save-v6.json` lädt: `version 7`, Fold-back der geladenen Welt ist tief gleich dem rohen Fixture
  (ausser `connected`, das neu abgeleitet wird); `islands[0].stock` enthält alle 9 Güter mit den Fixture-Werten.
- **AK-E0-04** Kette: `save-v1.json` … `save-v5.json` laden nach v7; je Fixture ist der Fold-back tief gleich dem
  Ergebnis vor E0 (v6-Welt, auf `main` vor E0 gemessen und als Hash je Fixture gepinnt).
- **AK-E0-05** Weiterlauf: Aus `save-v6.json` und aus v6-Ständen, die der Fold-back aus dem laufenden v7-Referenzlauf
  erzeugt (aktiver Sturm, Boom, offener Auftrag; Anhang 01 E), laufen nach dem Laden 300 Schritte; `serialize` ist
  gleich dem Lauf ohne Speichern und Laden.
- **AK-E0-06** Ein v6-Stand nur mit Kontor lädt (Kontor `island 0`); `unlocked`, `goodLocks`, `upgradeStops` eines
  v6-Stands sind nach dem Laden wörtlich gleich.
- **AK-E0-07** Negativfälle einzeln → „Beschädigter Spielstand", ohne Ausnahme (Liste Anhang 01 B, mindestens: v6
  ohne Gut, v6 `buildings {}`, v7 ohne `islands`, `islands` leer, zwei Inseln, Insel 63 × 64, 4095 Kacheln, Kachel
  `null`, `kontorId` ohne Gebäude, `kontorId` auf Nicht-Kontor, Gebäude ohne `island`, `island` 1, `island` −1,
  `island` 0,5). Der bestehende Test „never throws on garbage input" läuft auch über v7-Stände.
- **AK-E0-08** Round-trip v7: `serialize(deserialize(serialize(w)).world) === serialize(w)` für die neue Welt, die
  Endwelt des `off`-Laufs und eine Welt im Brand; ein geladener v6-Stand ergibt beim zweiten Round-trip denselben
  Text.
- **AK-E0-09** `version 8` → „Unbekannte Version". Beleg einmalig im Review: ein von E0 erzeugter v7-Stand ergibt im
  Build vor E0 „Unbekannte Version" (Probe auf `main` vor dem Merge, Ergebnis im PR-Text).

**Inselbezug** (`tests/sim/islands.test.ts` neu)

- **AK-E0-10** Testwelt mit zwei Inseln: Fischer auf Insel 1 liefert nur in `islands[1].stock`; Haus auf Insel 1
  entnimmt nur aus `islands[1].stock`; Bau auf Insel 1 zahlt Waren aus Insel 1 und Geld global; Kauf am Kontor von
  Insel 1 bucht in Insel 1; `islands[0].stock` bleibt in allen Fällen unverändert.
- **AK-E0-11** Testwelt: Haus auf Insel 0 ist nicht versorgt und hat keinen Dienst durch Kontor, Markt oder Kapelle
  auf Insel 1, auch wenn deren Koordinaten im Radius lägen; Wege verbinden nie über Inseln.
- **AK-E0-12** (auch `population.test.ts`) Ergebnisgleichheit: In D1 und im `off`-Referenzlauf alle 100 Schritte ist
  für jedes Haus und jeden Dienst die Abdeckung gleich der naiven Referenz; ebenso `requiresService` (Werkzeugmacher)
  und — falls indexiert — `isSupplied`. Grenzfall Abstand genau Radius eingeschlossen.
- **AK-E0-13** Aktualität ohne Tick: Kapelle bauen, abreissen, Weg zur Kapelle entfernen, Brand der Kapelle beginnen
  und enden lassen — nach jeder Aktion ohne `step` gleich der naiven Referenz; `serialize` vor und nach einer Abfrage
  gleich.
- **AK-E0-14** Reihenfolge: Testwelt, Geld reicht für genau einen Hausaufstieg, beide Häuser erfüllt und mit Ware auf
  ihrer Insel; Haus mit kleinerer Id auf Insel 1, grössere Id auf Insel 0 → nur das Haus auf Insel 1 steigt auf
  (Verarbeitung in globaler Id-Reihenfolge, R-E0-2).

**Last** (`tests/sim/perf.test.ts` neu)

- **AK-E0-15** D1, 1000 Schritte: Mittel ≤ `perfBudget(6)` ms je Schritt (Ist ≈ 19 ms). Zusätzlich im selben Lauf:
  Abdeckung aller Häuser × 3 Dienste über 100 Schritte mindestens **5 ×** schneller als die naive Referenz (Verhältnis
  maschinenunabhängig). Schwelle 6 ms ist Vorschlag; lead-tech misst nach Umsetzung und pinnt mit Beleg, höchstens 6.

**Baseline** (`balance-crises.test.ts`, `balance-merchants.test.ts`, `balance.test.ts`)

- **AK-E0-16** `balance.test.ts` unverändert (Git-Diff leer) und grün; `balance-flow`, `balance-upgrade` grün ohne
  Pin-Änderung.
- **AK-E0-17** `OFF_REFERENCE` und `OFF_FINGERPRINT 0x701c6da5` unverändert; „normal" + Feuerwache 7850, „mild" 7850;
  AK-B2-05/06 (Laden im Brand, im Sturm) grün; `normalized()` beginnt mit dem Fold-back (neuer Test: Fold-back einer
  `createWorld(3)` v7 ist tief gleich der gepinnten v6-Form, Schlüsselreihenfolge eingeschlossen).
- **AK-E0-18** `balance-merchants`: `[winTick, wonMerchantsTick, minMoneyAfterWin]` = `[6750, 11200, 320]`.
- **AK-E0-19** Zufallsströme: Krisen- und Auftragsfolge des Laufs „normal" + Feuerwache gleich der vor E0 gepinnten
  Liste (4.5).

**Sichtbar nichts** (Browser-Check, 1280 × 800)

- **AK-E0-20** Neues Spiel Seed 3 auf `main` vor E0 und nach E0: Startbild Zoom 1, Lagerleiste, Kontor-Panel gleich
  (Sichtvergleich `tools/render-qa/sichtvergleich.mjs`); bauen, speichern, laden, Autosave laden — ohne Meldung,
  Lager gleich. Ein v6-Autosave aus dem Browser lädt nach dem Update. Alle `tests/render/` und `tests/ui/` grün.

### 4.8 Paket, Ownership, Reihenfolge

- **E0** · Strang Sim (lead-tech) · Baseline bitgleich · Werkzeug-Merge vorab, kein Release · Dateien: `types.ts`,
  `save.ts`, `world.ts`, `population.ts`, `supply.ts`, `economy.ts`, `trade.ts`, `orders.ts`, `production.ts`,
  `upgrade.ts`, `build.ts`, `roads.ts`, `queries.ts`, `crises.ts`; Zugriffe in `src/ui/`, `src/render/`
  (mechanisch); `tests/`. `types.ts` und `save.ts` gehören in M12 bis zum E0-Merge nur E0.
- **Schritt 0:** Fixture `save-v6.json`, Hashes der Fold-back-Ziele (AK-E0-04) und Liste der Zufallsfolge (AK-E0-19)
  auf `main` **vor** jeder Code-Änderung erzeugen und committen.
- **Umfang:** heute ≈ 70 Zugriffe in `src/` und ≈ 870 in `tests/` auf `stock`, `tiles`, `kontorId`, `width`/`height`
  (grobe Zählung, enthält auch Canvas-Grössen). **[Tech]** Zugriffshelfer und eine mechanische Umstellung als eigener
  Task vor der Logik empfohlen; kein Test wird gelöscht, keine AK-Nummer geändert.
- E0 berührt `src/ui/` und `src/render/` nur mechanisch; parallele UI-Pakete (REL-03, R225) holen `main` per Merge.

### 4.9 Doku

`docs/arc42.md`: Persistenz (Save v7, Kette bis v7), Bausteinsicht Weltzustand (Insel, globale Felder),
Laufzeitsicht (Dienst-Abdeckung). README unverändert (keine Spieländerung). ADR: siehe F-S3.

### 4.10 Nicht in E0

Fremdinseln im Spiel oder im Save, Inselname, Merkmale, Platz im Meer (Versatz), Render mehrerer Raster, Kamera- und
Picking-Änderungen, Kontor II, Handel an mehreren Kontoren, Schiffe, Routen, Gewürz, neue Freischaltfunktion, Bilanz
je Insel, Brand über mehrere Inseln, jede neue Zahl in `src/sim/defs/`.

## 5. Teil E1 — Fremdinseln und Archipel

folgt in Phase 2

## 6. Teil E2 — Kontor II, Bauen auf Fremdinseln, Seefahrt

folgt in Phase 2

## 7. Teil E3 — Gewürz

folgt in Phase 2

## 8. Teil E4 — Schiffe und Routen

folgt in Phase 2

## 9. Kann-Teile E5 und E6

folgt in Phase 2

## 10. Nicht im Scope M12

Kampf, Piraten, Gegenspieler, Erkundung oder Nebel, Kartengrösse als Spieloption, grössere Heimatinsel, Fluss (G5),
Lagerhaus (I-004), Standortgüte (I-008), Erz und Minen, Routen mit mehr als zwei Häfen, freie Wegpunkte, Werft und
Schiffstypen, Bevölkerungswanderung zwischen Inseln, Inselchronik je Insel, Politik/Erlasse, Stufe 5.

## 11. Offene Punkte (Phase 1)

- **F-S1 Save-Version für E1–E4** (Inselkopf, Schiffe, Routen ändern den Weltzustand erneut). Empfehlung: v7 ist
  mit dem E0-Merge eingefroren; E1–E4 bündeln ihre Felder in **v8** (`migrateV7ToV8`, Fixture `save-v7.json`),
  sofern sie nur gemeinsam auf `main` kommen, sonst je Merge eine Version. Wer: lead-tech, Gate Spec.
- **F-S2 `Building.island` Pflicht oder „fehlt = 0"** wie `eff`/`level`? Empfehlung: Pflicht — der Typprüfer findet
  jede Stelle ohne Inselbezug; „fehlt = 0" machte vergessene Bezüge still zur Heimat. Wer: lead-tech.
- **F-S3 ADR zum Inselmodell** (getrennte Raster, globale Gebäudeliste)? Empfehlung: ja, mit E0 als Nachtrag zu
  ADR-002, weil E0 die Datenform festlegt; E1 ergänzt die Darstellung. Wer: lead-tech.
- **F-S4 Last-Schwelle AK-E0-15.** Empfehlung: 6 ms je Schritt als Obergrenze, Pin nach Messung; das 5×-Verhältnis
  ist die harte Bedingung. Wer: lead-tech, lead-qa.
