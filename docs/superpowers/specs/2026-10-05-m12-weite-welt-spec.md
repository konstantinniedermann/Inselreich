# M12 „Weite Welt" — Design-Spec

Datum: 2026-10-05 · Paket M12-SPEC · Meilenstein M12 · Status: **Spec vollständig (E0 nach Gate Spec E0, R227;
E1–E6 Entwurf zum Gate Spec)** · Prozessstufe voll (Save v7 und v8, `balance-merchants`-Bruch nur in E3)

Grundlage: [Vorschlag M12](2026-10-05-m12-weite-welt-design.md) mit
[Anhang 01 Wirtschaft](2026-10-05-m12-weite-welt-design/anhang-01-wirtschaft.md); Ruling **R226** (Gate
Brainstorming: Ansatz C, F-01 bis F-07); [M11-Spec](2026-10-03-m11-wirtschaft-im-fluss-spec.md) (Save v6,
Fingerabdruck); [Hauptspec](2026-09-29-inselreich-design.md).

Anhänge (`2026-10-05-m12-weite-welt-spec/`):
[01](2026-10-05-m12-weite-welt-spec/anhang-01-e0-save-und-pruefung.md) E0: Save v7, Ladeprüfung, Schritt 0,
Dichte-Szene D1, Fold-back, Testwelt, Randfälle;
[02](2026-10-05-m12-weite-welt-spec/anhang-02-e1-archipel-und-render.md) E1: Inseln, Generator, Darstellung,
Render-Messprotokoll, Streichvariante;
[03](2026-10-05-m12-weite-welt-spec/anhang-03-e2-e4-regeln-und-werte.md) E2–E6: Werte je `src/sim/defs/`-Eintrag,
Save v8, Routenablauf, Panel; [04](2026-10-05-m12-weite-welt-spec/anhang-04-ak-liste.md) alle AK E1–E6.

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
- **Fixture** `tests/sim/fixtures/save-v6.json` entsteht in **Schritt 0**, dem ersten Commit der E0-Branch auf dem
  Stand `main` 17cbafb, vor jeder Änderung in `src/` (nicht direkt auf `main`; dort committet nur der Integrator).
  Rezept und vollständige Schritt-0-Liste: Anhang 01 C (Controller Seed 3, Krisen „normal", Feuerwache, Tick 3000
  mit Brand und offenem Auftrag, Sperren gesetzt). Commit und Befehl stehen im Testkommentar.

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
  Ausgang, Gut, Menge, Prämie) wird in Schritt 0 gemessen und als Liste gepinnt; nach E0 identisch.
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
- **AK-E0-02** Seed 3: Fold-back von `createWorld(3)`, `createWorld(3, { unlockAll: true })` und
  `createWorld(3, { crisisLevel })` für `'mild'` und `'normal'` ist zeichengleich mit der in Schritt 0 gepinnten
  v6-Form (Anhang 01 C).
- **AK-E0-03** `save-v6.json` lädt: `version 7`, Fold-back der geladenen Welt ist tief gleich dem rohen Fixture
  (ausser `connected`, das neu abgeleitet wird); `islands[0].stock` enthält alle 9 Güter mit den Fixture-Werten.
- **AK-E0-04** Kette: `save-v1.json` … `save-v5.json` laden nach v7; je Fixture ist der Hash über das **sortiert
  serialisierte** JSON des Fold-backs (Schlüssel rekursiv sortiert) gleich dem in Schritt 0 gepinnten Hash der v6-Welt
  (Migrationen hängen Schlüssel hinten an, der Fold-back baut die v6-Reihenfolge neu; Anhang 01 C).
- **AK-E0-05** Weiterlauf: Das Fixture-Rezept läuft als Testhelfer im E0-Code nach und liefert den Lauf ohne Speichern
  und Laden. Geladen werden `save-v6.json` (Tick 3000, Brand und Auftrag) und Fold-back-v6-Stände desselben Laufs bei
  Tick 1000 (Auftrag offen), 2650 (Sturm aktiv) und 4300 (Boom); der Test prüft zuerst, dass der Zustand beim
  Speichern vorliegt. Nach 300 Schritten ist `serialize` gleich dem Lauf ohne Speichern und Laden (Anhang 01 C).
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

- **AK-E0-10** Testwelt, je Zeile von R-E0-3 ein Fall (Liste Anhang 01 F): Produktion, Eingangsware, Hausbedarf,
  Hausaufstieg, Bau, Ausbau, Abriss-Erstattung, Kauf und Verkauf auf bzw. an Insel 1 buchen nur in
  `islands[1].stock` (Geld global), `islands[0].stock` bleibt gleich; Bau auf Insel 1 an einer Koordinate, die auf
  Insel 0 belegt ist, gelingt. Heimat-Zeilen: Auftrag liefert aus Insel 0, `goodsBalance`/`flow` und
  `flammableRect` sehen nur Insel 0.
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
- **AK-E0-21** Zählungen (R-E0-4): Testwelt mit Häusern auf beiden Inseln — Einwohner, Bürger, Kaufleute, Ziel 1 und
  2, Freischalt-Auslöser (`houses`, `tierWish`, `tierReached`, `tierOpen`) und höchste Hausstufe zählen beide Inseln;
  Beispiel: 30 Bürger auf Insel 0 und 20 auf Insel 1 → `won` nach dem nächsten `step`.

**Last** (`tests/sim/perf.test.ts` neu)

- **AK-E0-15** D1, 1000 Schritte: Mittel ≤ `perfBudget(6)` ms je Schritt (Ist ≈ 19 ms). Zusätzlich im selben Lauf:
  Abdeckung aller Häuser × 3 Dienste über 100 Schritte mindestens **5 ×** schneller als die naive Referenz (Verhältnis
  maschinenunabhängig, hart). Die 6 ms sind Obergrenze; lead-tech misst nach Umsetzung und pinnt mit Beleg (F-S4).

**Baseline** (`balance-crises.test.ts`, `balance-merchants.test.ts`, `balance.test.ts`)

- **AK-E0-16** `balance.test.ts` unverändert (Git-Diff leer) und grün; `balance-flow`, `balance-upgrade` grün ohne
  Pin-Änderung.
- **AK-E0-17** `OFF_REFERENCE` und `OFF_FINGERPRINT 0x701c6da5` unverändert; „normal" + Feuerwache 7850, „mild" 7850;
  M6:AK-B2-05/06 (Laden im Brand, im Sturm) grün; `normalized()` beginnt mit dem Fold-back (neuer Test: Fold-back einer
  `createWorld(3)` v7 ist tief gleich der gepinnten v6-Form, Schlüsselreihenfolge eingeschlossen).
- **AK-E0-18** `balance-merchants`: `[winTick, wonMerchantsTick, minMoneyAfterWin]` = `[6750, 11200, 320]`.
- **AK-E0-19** Zufallsströme: Krisen- und Auftragsfolge des Laufs „normal" + Feuerwache gleich der vor E0 gepinnten
  Liste (4.5; Schritt 0).

**Sichtbar nichts** (Browser-Check, 1280 × 800)

- **AK-E0-20** Neues Spiel Seed 3 auf `main` vor E0 und nach E0: Startbild Zoom 1, Lagerleiste, Kontor-Panel gleich
  (Sichtvergleich `tools/render-qa/sichtvergleich.mjs`); bauen, speichern, laden, Autosave laden — ohne Meldung,
  Lager gleich. Ein v6-Autosave aus dem Browser lädt nach dem Update. Alle `tests/render/` und `tests/ui/` grün.

### 4.8 Paket, Ownership, Reihenfolge

- **E0** · Strang Sim (lead-tech) · Baseline bitgleich · Werkzeug-Merge vorab, kein Release · Dateien: `types.ts`,
  `save.ts`, `world.ts`, `population.ts`, `supply.ts`, `economy.ts`, `trade.ts`, `orders.ts`, `production.ts`,
  `upgrade.ts`, `build.ts`, `roads.ts`, `queries.ts`, `crises.ts`; Zugriffe in `src/ui/`, `src/render/`
  (mechanisch); `tools/render-qa/perf.mjs` (liest heute `w.tiles`, `w.width`; mechanisch auf Insel 0, sonst bricht
  die Render-Messung mit dem E0-Merge, lead-design); `tests/`. `types.ts` und `save.ts` gehören in M12 bis zum
  E0-Merge nur E0.
- **Schritt 0** = erster Commit der E0-Branch auf `main` 17cbafb, vor jeder Änderung in `src/`: Fixture, v6-Formen,
  Hashes, Zufallsfolge (Liste Anhang 01 C).
- **Umfang** (Gate Spec E0, R227 B1): ≈ 146 direkte Zugriffe in `src/` (render ≈ 60 und 6 Destrukturierungen, ui
  ≈ 40, sim ≈ 36) und ≈ 990 Treffer in `tests/` auf `stock`, `tiles`, `kontorId`, `width`/`height`; der mechanische
  Task ist damit gut doppelt so gross wie zuerst geschätzt. **[Tech]** Zugriffshelfer und eine mechanische Umstellung als eigener
  Task vor der Logik empfohlen; kein Test wird gelöscht, keine AK-Nummer geändert.
- E0 berührt `src/ui/` und `src/render/` nur mechanisch; parallele UI-Pakete (REL-03, R225) holen `main` per Merge.

### 4.9 Doku

`docs/arc42.md`: Persistenz (Save v7, Kette bis v7), Bausteinsicht Weltzustand (Insel, globale Felder),
Laufzeitsicht (Dienst-Abdeckung). README unverändert (keine Spieländerung). **ADR-013 „Inselmodell im
Weltzustand"** (getrennte Raster je Insel, globale Gebäudeliste, Pflichtfeld `island`) entsteht mit E0.

### 4.10 Nicht in E0

Fremdinseln im Spiel oder im Save, Inselname, Merkmale, Platz im Meer (Versatz), Render mehrerer Raster, Kamera- und
Picking-Änderungen, Kontor II, Handel an mehreren Kontoren, Schiffe, Routen, Gewürz, neue Freischaltfunktion, Bilanz
je Insel, Brand über mehrere Inseln, jede neue Zahl in `src/sim/defs/`.

## 5. Teil E1 — Fremdinseln und Archipel

**Zweck:** Drei Fremdinseln liegen sichtbar im Meer um die Heimat; die Kamera schwenkt und zoomt über den ganzen
Archipel. Noch nichts ist dort baubar (E2). Details, Generator und Messprotokoll: Anhang 02.

**Kernregeln**

- **Inseln** (`sea.ts` `ISLANDS`): A „Möweninsel" `d` 25–30, ≤ 24 × 24, Gewürz; B „Felsbucht" 35–40, ≤ 36 × 36,
  Gewürz + Gebirge; C „Grünland" 55–65, ≤ 48 × 48, Gras/Wald/Gebirge, kein Gewürz — **C ist die erste Streichung**.
  Fahrzeit `10 × d` Ticks (`SHIP_TICKS_PER_SEA_TILE`). Heimat nie Gewürz. Erz und Minen gestrichen.
- **Generator** aus eigenem Strom `ISLANDS_SALT`; Garantien (Kontorplatz, Plantagen- und Steinbruchplätze) geprüft,
  sonst neuer Versuch, nach 50 eine feste Ersatzform. Heimat, Auftrags- und Krisenstrom unberührt.
- **Archipel:** Versatz `ox`, `oy` je Insel, Heimat (0, 0); Rechtecke mit ≥ 8 Kacheln Abstand; Fahrlinie Anker →
  ≤ 2 Wegpunkte → Anker, `d` = aufgerundete Länge; Rahmen `W + H ≤ 440`.
- **Save v8 (oder je Merge eine Version, F-S1):** `Island` + `kind`, `ox`, `oy`, `anchor`, `kontorId` darf `null`
  sein; Migration v7 → v8 erzeugt die Fremdinseln aus `world.seed`; Fixture `save-v7.json` als erster Commit der
  E1-Branch (Anhang 03 B).
- **Render:** offenes Meer als eine Fläche; Inseln mit Versatz projiziert; Culling und Picking je Insel; neue
  Zoomstufen 0,25 und 0,125. **Terrain-Cache je Insel:** Heimat sofort zum Erstbild, Fremdinseln **im Leerlauf nach
  dem Erstbild** (A, B, C), Notfall-Rasterung, falls eine Insel vorher ins Bild kommt. Begründung: Das Erstbild
  bleibt beim heutigen Aufwand, der Schwenk ruckelt nicht; Speicher +≈ 17 MB bei Faktor 1 (Anhang 02 D).
- **Streichvariante B:** Schalter `ARCHIPEL_VIEW 'jump'` zeichnet nur die aktive Insel ohne Meer dazwischen,
  Inselwechsel per Kamerasprung; Sim, Save und UI bleiben unverändert.

**Wichtigste AK** (vollständig Anhang 04): **AK-E1-02** Seeds 1 … 200 ohne Überlappung, Bänder eingehalten, keine
Linie durch ein Inselrechteck (`islands-gen.test.ts`). **AK-E1-07/09** Culling und Picking je Insel als reine
Mathematik (`tests/render/archipel.test.ts`). **AK-E1-10** nur Heimat im Bild → Zeichenaufrufe der Heimat gleich
`main` (`fakeCtx`). **Render-Last** (A/B mit `tools/render-qa/perf.mjs`, DPR 2, 1920 × 1080, Seeds 14 und 3):
**AK-E1-14** Heimatansicht Zoom 1, nur Heimat im Bild: `renderMedian` höchstens +0,2 ms gegen `main` (Stilrahmen §5);
**AK-E1-15** Heimat-`buildMs` höchstens +30 %; **AK-E1-16** Zoom 0,125 mit allen Inseln: `renderMedian` höchstens
2 × Heimatansicht Zoom 1 derselben Maschine — **Vorschlag, lead-art bestätigt im Gate Spec**. **AK-E1-12**
Streichvariante ändert nur `src/render/`.

**Nicht in E1:** Bauen auf Fremdinseln, Kontor II, Schiffe, Gewürz-Produktion, Seekarte (E5).

## 6. Teil E2 — Kontor II, Bauen auf Fremdinseln, Seefahrt

**Zweck:** Mit U6 gründet der Spieler auf einer Fremdinsel ein Kontor und baut dort nach den heutigen Regeln. Details:
Anhang 03 C.

**Kernregeln**

- **U6** (`unlocks.ts`) erhält `kontor2` und die Funktion `seafaring` (mit E3 auch `spicefarm`, `spice`);
  `unlocked` und `deriveUnlocks` bleiben unverändert.
- **`kontor2`:** Küste, nur Fremdinsel ohne Kontor, Kosten 800 Geld, 20 Holz, 8 Werkzeug, 10 Stein **aus dem
  Heimatlager**, Unterhalt 10 (60/min), Versorgungsradius 8. Vorher auf der Insel nur das Kontor baubar. Abriss
  gesperrt, solange eine Route es nutzt („Erst Route auflösen").
- **Lager je Insel:** Bauen, Betriebe, Häuser, Aufstieg nur aus dem eigenen Lager (R-E0-3). **Handel an jedem
  Kontor**, Kaufpreise fest, **Sättigung global** je Gut. **Aufträge an jedem Kontor**, aus dessen Lager.
- **Bilanz und Lagerleiste je Insel:** `goodsBalance(world, insel)`; die Lagerleiste zeigt die aktive Insel (Bildmitte)
  mit Namen. Dämpfung beim Aufstieg nach der Bilanz der Insel des Hauses.
- **Brand** wählt über alle Inseln: Rechtecke je Insel untereinander, dieselben zwei Ziehungen wie heute; nur Heimat
  brennbar → bitgleich. Sturm überall, Boom global.
- **Bedienung:** ab `seafaring` Taste `0` (Heimat), `9` (nächste Insel reihum), Knopf „Inseln" (1 Klick je Ziel).
  Mouse-over einer Fremdinsel vor U6: „… · Seefahrt mit den Kaufleuten".
- Unversorgte Häuser auf Fremdinseln: heutige Regel, keine Änderung (Beobachtung eingetragen, Vorschlag §7).

**Wichtigste AK:** **AK-E2-01** Gründen vor/nach `seafaring`, Kosten aus dem Heimatlager (`kontor2.test.ts` neu).
**AK-E2-04** Verkauf an zwei Kontoren senkt denselben `sellPct` (`trade.test.ts`). **AK-E2-05** Auftrag aus dem
Fremdlager (`orders.test.ts`). **AK-E2-07** Brandziel: nur Heimat brennbar → Ziel gleich heute für 30 Perioden;
mit Insel → Ziel auf der Insel möglich, je Periode genau zwei Ziehungen nach der Art (`fire.test.ts`). **AK-E2-11**
Browser: Lagerleiste je Insel, Tasten, Knopf, Mouse-over vor U6.

**Nicht in E2:** Schiffe (E4), Gewürz (E3), Bevölkerungswanderung, Lagerleiste „alle" (Kann, nicht geplant).

## 7. Teil E3 — Gewürz

**Zweck:** Kaufleute brauchen ein Gut, das nur auf Fremdinseln wächst — der Grund für die Expansion. Details und
Werte: Anhang 03 A und D.

**Kernregeln**

- Gut **„Gewürz"** (endgültiger Name, A-08): `GOODS.spice` Kauf 40, Verkauf 12, **kein Auftragsgut**, `spice` **am
  Ende** von `GOOD_IDS`, `START_STOCK.spice` 0.
- **Gewürzplantage** `spicefarm`: 200 Geld, 12 Holz, 3 Werkzeug; Takt 50, Unterhalt 15 (90/min); Gras r2 min4 wie
  Zuckerrohr + Inselmerkmal `spice` (neue Regel `islandTrait`). Keine Verarbeitung.
- **Kaufleute:** `TIERS[4].needs.spice` 0,1, `TIERS[4].tax` 20 → 22.
- **Bewusster Bruch `balance-merchants` (R226 F-03):** Controller `feedSpice` kauft Gewürz am Heimatkontor zu, nutzt
  keine Insel; `wonMerchantsTick` und `minMoneyAfterWin` werden neu gemessen und gepinnt, `winTick` 6750 bleibt.
  Eskalation: erst Steuer 24, dann `MERCHANT_TICK_LIMIT` 13 000 — **jede Stufe nur mit Ruling**.
- **`balance.test.ts` bleibt bitgleich:** Gewürz wirkt erst nach dem Sieg; Auftrags- und Boom-Pool ohne Gewürz.

**Wichtigste AK:** **AK-E3-01** Werte (`defs.test.ts`). **AK-E3-02** Plantage nur mit Merkmal (`spice.test.ts` neu).
**AK-E3-04** Auftragsziehung für Seeds 1, 3, 42 × 20 Perioden gleich (`orders.test.ts`). **AK-E3-05** Neupin
`balance-merchants` mit Befehl und Commit, Ziel 2 ≤ 12 000, `minMoneyAfterWin` > 0.

**Nicht in E3:** zweiter Gewürz-Betrieb, Gewürz als Auftragsgut, Standortgüte (I-008).

## 8. Teil E4 — Schiffe und Routen

**Zweck:** Ein Schiff bringt Ware zwischen zwei Kontoren hin und her, ohne Zufall und ohne Warten. Ablauf, Panel und
Gründe: Anhang 03 E und F.

**Kernregeln**

- **Handelsschiff** (`sea.ts` `SHIP`): am Heimatkontor 1200 Geld, 25 Holz, 10 Werkzeug; Unterhalt 15 (90/min);
  Ladung 50; **höchstens 4** (`SHIP_MAX`). Ausmustern nur leer in der Heimat, ohne Erstattung (Setzung Spec).
- **Route** = zwei Kontore, je Richtung bis zu 2 Güter (`ROUTE_GOODS_PER_DIRECTION`), Reserve je Gut 0–90 in Zehnern,
  Standard 10. Ein Gut nur in einer Richtung.
- **Ankunft:** **erst entladen** (bis Ziellager 100, Rest bleibt an Bord und geht bei der nächsten Ankunft zuerst),
  **dann laden** (je Gut zuerst `⌊frei / k⌋`, Rest an das erste Gut; Reserve bleibt im Quelllager), **Abfahrt im
  selben Tick, nie warten**, auch leer. Fahrzeit `10 × d`. Alles ganzzahlig, ohne `createRng`.
- `tickShips` nach der Produktion, vor Verbrauch und Steuer; Schiffe in `id`-Reihenfolge.
- **Route auflösen:** Schiff beendet die Fahrt, fährt heim, entlädt bis 100, Rest verfällt mit Meldung.
- Geld negativ: Kauf gesperrt, Routen und Unterhalt laufen.

**Routen-Bedienung (AK-E4-13, Browser-Check, lead-tech prüft):** Startzustand: Seed 3, „Alles frei", `kontor2` auf
der Felsbucht, genau ein Handelsschiff liegt frei im Heimathafen, Lager der Felsbucht Gewürz 30, Panel des
**Heimatkontors offen**, keine Auswahl offen. **Gezählt** wird jeder primäre Mausklick (Drücken und Loslassen der
linken Taste) ab diesem Zustand; Mausbewegung, Mouse-over und Mausrad zählen nicht, Tastatur wird nicht benutzt.
**Erwartet:** Klick 1 „Route nach Felsbucht" → Güterauswahl im Panel; Klick 2 „Gewürz" in der Gruppe „Holen" → Route
Felsbucht → Heimat, Gewürz, Reserve 10. **Bestanden**, wenn nach höchstens 2 Klicks und spätestens 1 s Tempo 1 die
Schiffszeile „unterwegs nach Felsbucht" mit Restzeit zeigt und das Schiff im Bild ablegt.

**Wichtigste AK:** **AK-E4-04** erst entladen, dann laden; **AK-E4-05** halbe Ladung je Gut, leere Abfahrt;
**AK-E4-06** Reserve; **AK-E4-07** Validierung (Gut in beiden Richtungen, 3 Güter, Ziel ohne Kontor); **AK-E4-01**
fünftes Schiff abgewiesen; **AK-E4-08** Auflösen mit Rest; **AK-E2-03** Abriss `kontor2` gesperrt; **AK-E4-10**
zwei Läufe gleich, kein `createRng` (alle `tests/sim/ships.test.ts` neu); **AK-E4-12** Schiffsposition auf der Linie
(`tests/render/shipLane.test.ts` neu).

**Nicht in E4:** Routen mit mehr als zwei Häfen, freie Wegpunkte, Werft, Schiffstypen, Verkauf von Ladung an Bord.

## 9. Kann-Teile E5 und E6

Streichbar in dieser Reihenfolge: E6, dann E5. AK nur bei Aufnahme in den Plan (Anhang 04).

- **E5 Seekarte und Gründungsfahrt** (UI/Render, kein Sim-Zustand): kleine Karte im Knopf „Inseln" mit Silhouetten,
  Linien, Schiffspunkten; einmalige Fahrt-Darstellung nach dem Gründen.
- **E6 Händlerschiff (I-006):** Angebot ≤ 20 % unter Kaufpreis, höchstens 20 Einheiten, mit Restzeit, an einem Kontor;
  eigener Zufallsstrom. Periode und Dauer sind Vorschlag Spec (Anhang 03 G, F-P7).

### 9.1 Bitgleichheit über E1–E6

`balance.test.ts` unverändert in jedem Teil. `OFF_REFERENCE`, `OFF_FINGERPRINT 0x701c6da5`, „normal"/„mild" 7850
und die Zufallsfolge aus AK-E0-19 bleiben in **allen** Teilen; erlaubt ist nur, dass `normalized()` die neuen
v8-Felder entfernt (Liste AK-M12-B2). `balance-merchants` `[6750, 11200, 320]` bleibt in E1, E2, E4–E6 und bricht
nur in E3 bewusst.

### 9.2 Paketschnitt M12

| Teil | Owner                              | Dateien (Schwerpunkt)                                                                                                                                                            | hängt ab | parallel zu                                     |
| ---- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----------------------------------------------- |
| E1   | lead-tech (Sim), lead-art (Render) | `islands.ts` neu, `defs/sea.ts` neu, `save.ts`, `types.ts`; `render/camera.ts`, `iso.ts`, `terrain.ts`, `renderer.ts`, `limits.ts`; `tools/render-qa/perf.mjs`                   | E0       | E1-Sim ∥ E1-Render nach Schnittstelle `islands` |
| E2   | lead-tech                          | `build.ts`, `placement.ts`, `trade.ts`, `orders.ts`, `flow.ts`, `crises.ts`, `defs/unlocks.ts`, `defs/buildings.ts`; `ui/hud.ts`, `trade.ts`, `order.ts`, `input.ts`, `guide.ts` | E1       | E3                                              |
| E3   | lead-tech, Werte lead-design       | `defs/goods.ts`, `tiers.ts`, `buildings.ts`, `unlocks.ts`; `tests/sim/merchantsController.ts`, `balance-merchants.test.ts`                                                       | E1       | E2, E4                                          |
| E4   | lead-tech, Render lead-art         | `ships.ts` neu, `tick.ts`, `defs/sea.ts`, `save.ts`; `ui/inspect.ts` (Panel); `render/ship.ts`                                                                                   | E2       | E3                                              |
| E5   | lead-art, UI lead-tech             | `ui/` (Inselliste), `render/`                                                                                                                                                    | E4       | E6                                              |
| E6   | lead-tech                          | `offer.ts` neu, `defs/sea.ts`, `ui/`, `render/ship.ts`                                                                                                                           | E4       | E5                                              |

- **Gemeinsame Dateien:** `defs/buildings.ts` und `defs/unlocks.ts` (E2 ∥ E3), `defs/sea.ts` (E1 → E4 → E6),
  `save.ts`/`types.ts` (E1, E3, E4): je Paket eigener Block, das zweite holt `main` per Merge (kein Rebase).
  E2 und E4 werden nur zusammen released.
- **Konflikte mit E0:** E0 stellt alle Zugriffe auf `islands` um; jeder Teil startet erst nach dem E0-Merge.
  `tools/render-qa/perf.mjs` stellt E0 mechanisch auf Insel 0 um (§4.8); E1 erweitert die Sonde um die
  Archipel-Ansicht (AK-E1-14 bis -16).
- **Konflikte mit REL-03:** H-R12/H-R13 schreiben `render/terrain.ts` (E1), H-U1 „Anbinden auf Knopfdruck" schreibt
  `roads.ts` und UI (E0, E2). E1-Render startet nach dem REL-03-Merge oder holt ihn per Merge; die
  Render-A/B-Messung läuft gegen den `main` nach REL-03.

### 9.3 Doku je Teil

README mit dem Teil, der die Bedienung oder Werte ändert: E2 Freischalttabelle U6, „Lager je Insel", Tasten `0`/`9`,
neuer Abschnitt „Seefahrt"; E3 Handelstabelle und Bedarf Kaufleute; E4 Schiffe und Routen. `docs/arc42.md`: E1
Bausteine Archipel und Render je Insel, E4 Tick-Ablauf mit `tickShips`, Persistenz v8. ADR-013 erhält mit E1 den
Nachtrag Darstellung (Ansatz C, Streichvariante B).

## 10. Nicht im Scope M12

Kampf, Piraten, Gegenspieler, Erkundung oder Nebel, Kartengrösse als Spieloption, grössere Heimatinsel, Fluss (G5),
Lagerhaus (I-004), Standortgüte (I-008), Erz und Minen, Routen mit mehr als zwei Häfen, freie Wegpunkte, Werft und
Schiffstypen, Bevölkerungswanderung zwischen Inseln, Inselchronik je Insel, Politik/Erlasse, Stufe 5.

## 11. Offene Punkte

**Entschieden (R227, Gate Spec E0):**

- **F-S1** Jede Änderung der Zustandsform bekommt je Merge eine eigene `SAVE_VERSION`; v7 ist ab dem E0-Merge
  eingefroren. Gebündelt (v8) wird nur, wenn E1–E4 gemeinsam gemergt werden; das entscheidet der E1-Plan.
- **F-S2** `Building.island` ist Pflichtfeld; keine Kompatibilitäts-Zugriffe auf `World`.
- **F-S3** Eigenes ADR-013 „Inselmodell im Weltzustand" mit E0.
- **F-S4** Last-Schwelle AK-E0-15: Obergrenze ≤ 6 ms, nach Messung gepinnt; Verhältnis ≥ 5× ist hart.

**Entschieden durch lead-design (Abnahme Phase 2):**

- **F-P1** Inselnamen Möweninsel, Felsbucht, Grünland (allgemeine Wörter, ADR-006) und Garantien für C wie Anhang 02.
- **F-P5** Tasten `0` (Heimat) und `9` (nächste Insel); geprüft: in `src/ui/` nicht belegt.
- **F-P6** Ausmustern eines Schiffs nur leer in der Heimat, ohne Erstattung (Unterhalt kann enden, kein Geldkreislauf).
- **F-P8** Abriss `kontor2` erstattet die Hälfte ins Heimatlager (dort wurde bezahlt), das Insellager bleibt für ein
  neues Kontor erhalten.

**Offen für das Gate Spec M12 (Phase 2):**

- **F-P2 Budget Archipel-Ansicht** (AK-E1-16, 2 × Heimat Zoom 1). Empfehlung: übernehmen, nach erster Messung in E1
  bestätigen. Wer: lead-art.
- **F-P3 Cache-Zeitpunkt** (Leerlauf nach dem Erstbild statt erster Sichtkontakt). Empfehlung: Leerlauf, weil kein
  Ruckler beim Schwenken und Erstbild unverändert. Wer: lead-art.
- **F-P4 Mindestzoom 0,125** mit neuen Stufen 0,25 und 0,125, Detailstufe darunter. Empfehlung: ja, sonst ist der
  Archipel nie ganz im Bild (Designseite: ja, lead-design). Wer: lead-art.
- **F-P7 Werte E6** (Periode 3000, Dauer 600, erster Tick 3600). Empfehlung: von design-economy-designer prüfen
  lassen, bevor E6 in einen Plan kommt. Wer: lead-design.
- **F-P9 Save-Bündelung** E1–E4 in v8 oder je Merge eine Version (F-S1). Empfehlung: entscheidet der E1-Plan;
  Anhang 03 B ist als v8 geschrieben und gilt sinngemäss je Teil. Wer: lead-tech.
