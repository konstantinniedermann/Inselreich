# M12 „Weite Welt" — Design-Spec

Datum: 2026-10-05 · Paket M12-SPEC-FIX · Meilenstein M12 · Status: **Nachbesserung R228, Delta-Gate lead-qa** (E0
nach R227 bestanden) · Prozessstufe voll (Save v7 bis v10, `balance-merchants`-Bruch nur in E3)

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
Save v8–v10, Routenablauf, Panel; [04](2026-10-05-m12-weite-welt-spec/anhang-04-ak-liste.md) alle AK E1–E6, Auflagen für die Pläne.

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
- **Fixtures** `save-v6.json` (Controller Seed 3, „normal", Feuerwache, Tick 3000, Brand und offener Auftrag) und
  `save-v6-locks.json` (`unlockAll`, Amtsstube, Ausgabesperre, Aufstiegsstopp, Glas; R229 P-14) entstehen in
  **Schritt 0**, dem ersten Commit der E0-Branch auf v6-Code, vor jeder Änderung in `src/` (nicht direkt auf `main`).
  Rezepte: Anhang 01 C. Commit und Befehl stehen im Testkommentar.

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
- **AK-E0-06** Ein v6-Stand nur mit Kontor lädt (Kontor `island 0`); `save-v6-locks.json` lädt, `unlocked`,
  `goodLocks`, `upgradeStops` und `islands[0].stock.glass` sind wörtlich gleich dem Fixture.
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
- **Schritt 0** = erster Commit der E0-Branch auf `main` 17cbafb, vor jeder Änderung in `src/`: Fixtures `save-v6.json`
  und `save-v6-locks.json`, v6-Formen, Hashes, Zufallsfolge (Liste Anhang 01 C).
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

**Zweck:** Zwei Fremdinseln liegen sichtbar im Meer um die Heimat; die Kamera schwenkt und zoomt über den ganzen
Archipel. Noch nichts ist dort baubar (E2). Details, Generator, Messprotokoll: Anhang 02.

**Kernregeln**

- **Inseln** (`sea.ts` `ISLANDS`): A „Möweninsel" `d` 25–30, ≤ 24 × 24, Gewürz; B „Felsbucht" 35–40, ≤ 36 × 36,
  Gewürz + Gebirge. Insel C ist gestrichen (R228 (2)). Fahrzeit `10 × d` Ticks. Heimat nie Gewürz.
- **Generator** aus eigenem Strom `ISLANDS_SALT`; Garantien (Kontor-, Plantagen-, Steinbruchplätze) geprüft, sonst
  neuer Versuch, nach 50 eine feste Ersatzform. Heimat, Auftrags- und Krisenstrom unberührt.
- **Archipel:** Versatz `ox`, `oy`, Heimat (0, 0); Rechtecke ≥ 8 Kacheln Abstand; Fahrlinie Anker → ≤ 2 Wegpunkte →
  Anker, `d` = aufgerundete Länge; Rahmen `W + H ≤ 300` (ganzer Archipel bei Zoom 0,125 auch in 1280 × 800).
- **Save v8** (= E1, R228 (3)): `Island` + `kind`, `ox`, `oy`, `anchor`; `kontorId` darf `null` sein; Migration
  v7 → v8 erzeugt A und B aus `world.seed`; Fixture `save-v7.json` als erster Commit der E1-Branch (Anhang 03 B).
- **Render:** Meer als eine Fläche in `waterDeep`, die äussersten 2 Kacheln jedes Inselcaches laufen darauf aus;
  Culling und Picking je Insel; Mindestzoom **0,125**; ab Zoom ≤ 0,25 Detailstufe ohne Figuren, Tiere, Rauch, Schaum,
  Wellen, Böden aus einer Viertel-Kopie. **Terrain-Cache:** Heimat sofort, Fremdinseln im Leerlauf nach dem Erstbild
  in Scheiben ≤ 8 ms, Notfall synchron. Speicher ≈ 44,5 MB zusätzlich als Eintrag in `limits.ts` (Faktor 2).
- **Streichvariante B:** `ARCHIPEL_VIEW 'jump'` zeichnet nur die aktive Insel; Sim, Save und UI unverändert.

**Wichtigste AK** (alle: Anhang 04): **AK-E1-02** Seeds 1 … 200 ohne Überlappung, Bänder, keine Linie durch eine
Insel. **AK-E1-07/09/10** Culling, Picking, Heimat-Zeichenaufrufe gleich `main` (`tests/render/archipel.test.ts`).
**Render-Last** (A/B `perf.mjs`, Headless, DPR 2, 1920 × 1080, je Seed 14 und 3): **AK-E1-14** Zoom 1 `--focus home`
`renderMedian` ≤ +0,2 ms; **AK-E1-15** Heimat-`buildMs` ≤ +30 %; **AK-E1-16** Zoom 0,125 nach Aufbau aller Caches
≤ 2 × Zoom 1, hart; **AK-E1-18** kein Frame > 50 ms während der Leerlauf-Rasterung; **AK-E1-11/19** Scheiben ≤ 8 ms.

**Nicht in E1:** Bauen auf Fremdinseln, Kontor II, Schiffe, Gewürz-Produktion, Seekarte (E5).

## 6. Teil E2 — Kontor II, Bauen auf Fremdinseln, Seefahrt

**Zweck:** Mit U6 gründet der Spieler auf einer Fremdinsel ein Kontor und baut dort nach heutigen Regeln. Details:
Anhang 03 C. E2, E3 und E4 kommen als **Seefahrt-Bündel** über eine Integrationsbranch mit einem Merge (Save v9).

**Kernregeln**

- **U6** erhält `kontor2`, `seafaring` (mit E3 `spicefarm`, `spice`); `unlocked`, `deriveUnlocks` unverändert.
- **`kontor2`:** Küste, Fremdinsel ohne Kontor, 800 Geld, 20 Holz, 8 Werkzeug, 10 Stein **aus dem Heimatlager**,
  Unterhalt 10, Radius 8. Vorher auf der Insel nur das Kontor baubar. Abriss gesperrt, solange eine Route es nutzt.
- **Lager je Insel** (R-E0-3); **Handel und Aufträge an jedem Kontor** aus dessen Lager; **Sättigung global**.
- **Bilanz und Lagerleiste je Insel** (aktive Insel = Bildmitte); Dämpfung nach der Bilanz der Insel des Hauses.
- **Brand** über alle Inseln: Rechtecke untereinander, dieselben zwei Ziehungen; nur Heimat brennbar → bitgleich.
- **Bedienung** ab `seafaring`: Taste `0` Heimat, `9` reihum; Knopf „Inseln" 2 Klicks je Ziel. Mouse-over einer
  Fremdinsel vor U6: „… · Seefahrt mit den Kaufleuten". Unversorgte Häuser dort: heutige Regel.

**Wichtigste AK:** **AK-E2-01** Gründen, Kosten aus der Heimat (`kontor2.test.ts` neu); **AK-E2-03** Abriss-Sperre
und Fall „Schiff lag in der Felsbucht, Abriss, laden"; **AK-E2-04** `sellPct` global; **AK-E2-07** Brandziel
bitgleich (`fire.test.ts`); **AK-E2-11** Browser, Klickzählung wie AK-E4-13; **AK-E2-12…14** Gründe.

**Nicht in E2:** Schiffe (E4), Gewürz (E3), Bevölkerungswanderung, Lagerleiste „alle".

## 7. Teil E3 — Gewürz

**Zweck:** Kaufleute brauchen ein Gut, das nur auf Fremdinseln wächst — der Grund zur Expansion. Anhang 03 A, D.

**Kernregeln**

- **„Gewürz"** (endgültig, A-08): Kauf 40, Verkauf 12, **kein Auftragsgut**, am **Ende** von `GOOD_IDS`, Start 0.
- **Gewürzplantage:** 200 Geld, 12 Holz, 3 Werkzeug; Takt 50, Unterhalt 15; Gras r2 min4 + Inselmerkmal `spice`.
- **Kaufleute:** `TIERS[4].needs.spice` 0,1, `TIERS[4].tax` 20 → 22.
- **Bewusster Bruch (R226 F-03):** Controller `feedSpice`, Neupin von `wonMerchantsTick` und `minMoneyAfterWin`,
  `winTick` 6750 bleibt; betroffene alte Pins mit Meilenstein in Anhang 03 D. Eskalation erst Steuer 24, dann Grenze
  13 000, je nur mit Ruling. `balance.test.ts` bleibt bitgleich.
- **Alte Stände mit Kaufleuten** (Spielurteil lead-design): Migration v8 → v9 legt einmalig
  `min(100, SPICE_GRACE_PER_HOUSE (10) × Häuser Stufe 4)` Gewürz ins Heimatlager; einmalige Meldung beim Laden; sonst
  heutige Regel. Weicher Übergang, Zukauf hält Kaufleute über Bürger-Niveau.

**Wichtigste AK:** **AK-E3-01** Werte; **AK-E3-02** Plantage nur mit Merkmal (`spice.test.ts` neu); **AK-E3-04**
Auftragsziehung gleich; **AK-E3-05** Neupin samt Pin-Liste; **AK-E3-07** Übergangsbestand und Meldung (`save.test.ts`).

**Nicht in E3:** zweiter Gewürz-Betrieb, Gewürz als Auftragsgut, Standortgüte (I-008).

## 8. Teil E4 — Schiffe und Routen

**Zweck:** Ein Schiff bringt Ware zwischen zwei Kontoren hin und her, ohne Zufall und ohne Warten. Anhang 03 E, F.

**Kernregeln**

- **Handelsschiff:** am Heimatkontor 1200 Geld, 25 Holz, 10 Werkzeug; Unterhalt 15; Ladung 50; **höchstens 4**.
  Ausmustern nur leer in der Heimat, ohne Erstattung.
- **Route** = zwei Kontore, je Richtung ≤ 2 Güter, Reserve 0–90 in Zehnern (Standard 10); ein Gut nur in einer
  Richtung. Liegt der Hafen nicht auf der Route, erst Anfahrt ohne Umladung.
- **Ankunft:** erst **entladen** (bis 100, Rest bleibt an Bord), dann **laden** (je Gut `⌊frei / k⌋`, Rest ans erste),
  **Abfahrt im selben Tick, nie warten**. Fahrzeit `10 × d`. Ganzzahlig, ohne `createRng`. `tickShips` nach der
  Produktion, vor Verbrauch und Steuer, in `id`-Reihenfolge.
- **Route auflösen:** Fahrt beenden, heim, entladen bis 100, Rest verfällt mit Meldung. Geld < 0: Kauf gesperrt.

**Routen-Bedienung (AK-E4-13, Browser-Check):** Start: Seed 3, „Alles frei", `kontor2` auf der Felsbucht, ein freies
Schiff im Heimathafen, Felsbucht-Gewürz 30, Panel des **Heimatkontors offen**, keine Auswahl offen. **Gezählt** wird
jeder primäre Mausklick (Drücken und Loslassen links); Bewegung, Mouse-over, Mausrad zählen nicht, keine Tastatur.
Klick 1 „Route nach Felsbucht" → Güterauswahl; Klick 2 „Gewürz" in „Holen" → Route mit Reserve 10. **Bestanden**,
wenn nach höchstens 2 Klicks und spätestens 1 s (Tempo 1) „unterwegs nach Felsbucht" mit Restzeit steht.

**Wichtigste AK** (`tests/sim/ships.test.ts` neu): **AK-E4-04** erst entladen, dann laden; **-05** halbe Ladung,
leere Abfahrt; **-06** Reserve; **-07** Validierung; **-08** Auflösen mit Rest; **-10** kein `createRng`;
**-16…19** Ausmustern, Anfahrt, Ändern unterwegs, Auflösen im Heimathafen; **-12/-15** Schiff auf der Linie, in der
Tiefensortierung, ≥ 12 CSS-px bei Zoom ≤ 0,25 (`tests/render/shipLane.test.ts` neu).

**Nicht in E4:** mehr als zwei Häfen, freie Wegpunkte, Werft, Schiffstypen, Verkauf von Ladung an Bord.

## 9. Kann-Teile E5 und E6

Streichbar in dieser Reihenfolge: E6, dann E5. AK nur bei Aufnahme in den Plan (Anhang 04).

- **E5 Seekarte und Gründungsfahrt** (UI/Render, kein Sim-Zustand): kleine Karte im Knopf „Inseln"; einmalige
  Fahrt-Darstellung nach dem Gründen.
- **E6 Händlerschiff (I-006):** Angebot ≤ 20 % unter Kaufpreis, ≤ 20 Einheiten, mit Restzeit; eigener Zufallsstrom;
  Save v10. Periode und Dauer: Vorschlag Spec (Anhang 03 G, F-P7).

### 9.1 Bitgleichheit über E1–E6

`balance.test.ts` unverändert. `OFF_REFERENCE`, `OFF_FINGERPRINT 0x701c6da5`, „normal"/„mild" 7850 und die
Zufallsfolge (AK-E0-19) bleiben in allen Teilen; erlaubt ist nur, dass `normalized()` die neuen Felder je Version
entfernt (AK-M12-B2). `balance-merchants` gleich dem jeweils gültigen Pin; nur das Seefahrt-Bündel (E3) ändert ihn.

### 9.2 Paketschnitt M12

| Teil  | Owner                  | Dateien (Schwerpunkt)                                                                                         | ab  | parallel     |
| ----- | ---------------------- | ------------------------------------------------------------------------------------------------------------- | --- | ------------ |
| E1    | lead-tech, lead-art    | `islands.ts`, `defs/sea.ts` neu; `save.ts`, `types.ts`; `render/` Kamera, Terrain, `limits.ts`; `perf.mjs`    | E0  | Sim ∥ Render |
| E2    | lead-tech              | `build.ts`, `placement.ts`, `trade.ts`, `orders.ts`, `flow.ts`, `crises.ts`, `defs/`; `ui/` Kopfzeile, Handel | E1  | E3, E4       |
| E3    | lead-tech, lead-design | `defs/goods.ts`, `tiers.ts`, `buildings.ts`, `unlocks.ts`; Controller, Balance-Tests                          | E1  | E2, E4       |
| E4    | lead-tech, lead-art    | `ships.ts` neu, `tick.ts`, `save.ts`; `ui/inspect.ts`; `render/ship.ts`                                       | E2  | E3           |
| E5/E6 | lead-art / lead-tech   | `ui/`, `render/`; `offer.ts` neu, `save.ts`                                                                   | E4  | einander     |

- E2, E3, E4 = **Seefahrt-Bündel**: drei Teilbranches auf eine Integrationsbranch, ein Merge, Save v9. Gemeinsame
  Dateien (`defs/`, `save.ts`, `types.ts`) mit eigenem Block je Paket, Abgleich per Merge (kein Rebase).
- **E0:** Jeder Teil startet nach dem E0-Merge; `perf.mjs` stellt E0 auf Insel 0 um, E1 erweitert es.
- **REL-03:** H-R12/H-R13 schreiben `render/terrain.ts`, H-U1 `roads.ts` und UI. **E1-Render startet erst nach dem
  REL-03-Merge**; A/B gegen diesen `main`.
- **Auflagen für die Pläne** (R228 (7)): Anhang 04, letzter Abschnitt.

### 9.3 Doku je Teil

README mit dem Teil, der Bedienung oder Werte ändert (E2 U6, Lager je Insel, Tasten, „Seefahrt"; E3 Handel,
Kaufleute; E4 Schiffe). `docs/arc42.md`: E1 Archipel und Render je Insel, v9 Tick-Ablauf und Persistenz. **ADR-005-
Nachtrag** „Tick-Reihenfolge mit `tickShips`" mit dem v9-Merge; ADR-013 mit E1 um die Darstellung ergänzt.

## 10. Nicht im Scope M12

Kampf, Piraten, Gegenspieler, Erkundung oder Nebel, Kartengrösse als Spieloption, grössere Heimatinsel, Fluss (G5),
Lagerhaus (I-004), Standortgüte (I-008), Erz und Minen, Routen mit mehr als zwei Häfen, freie Wegpunkte, Werft und
Schiffstypen, Bevölkerungswanderung zwischen Inseln, Inselchronik je Insel, Politik/Erlasse, Stufe 5, **dritte
Fremdinsel** (später billig hinzufügbar; nach einem Merge zu entfernen kostete Spielerfortschritt).

## 11. Offene Punkte

**Entschieden (R227, Gate Spec E0):** **F-S1** je Merge eine eigene `SAVE_VERSION`, v7 ab E0-Merge eingefroren.
**F-S2** `Building.island` Pflicht, keine Kompatibilitäts-Zugriffe. **F-S3** ADR-013 mit E0. **F-S4** AK-E0-15 ≤ 6 ms
nach Messung gepinnt, Verhältnis ≥ 5× hart.

**Entschieden (lead-design, Phase 2):** **F-P1** Namen Möweninsel, Felsbucht (ADR-006). **F-P5** Tasten `0`/`9`
(in `src/ui/` frei). **F-P6** Ausmustern nur leer in der Heimat, ohne Erstattung. **F-P8** Abriss `kontor2`
erstattet die Hälfte ins Heimatlager, das Insellager bleibt für ein neues Kontor.

**Entschieden (R228, Gate Spec E1–E6):** **F-P2** Archipel-Ansicht ≤ 2 × Heimat Zoom 1, hart, nach Aufwärmen.
**F-P3** Leerlauf-Rasterung in Scheiben ≤ 8 ms, Notfall restliche Scheiben synchron. **F-P4** Mindestzoom 0,125.
**F-P9** v8 = E1, v9 = Seefahrt-Bündel E2+E3+E4, v10 = E6. **F-07 geändert:** zwei Fremdinseln, C gestrichen.

**Offen:** **F-P7 Werte E6** (Periode 3000, Dauer 600, erster Tick 3600): design-economy-designer prüft, bevor E6
in einen Plan kommt. Wer: lead-design.

**Änderungsvermerk Delta zu 95ed26e (R228, für das Delta-Gate lead-qa):**

- (1) Ladeprüfung `port`/`kontorId null`: Anhang 03 B; AK-E2-03, AK-E1-06 (Anhang 04).
- (2) Insel C gestrichen: §5, §10, §11; Anhang 02 A, B, D (Rahmen 300, Speicher); AK-E1-01/02/05/17.
- (3) Save v8/v9/v10, Fixtures je Version: §5, §6, §9; Anhang 03 B; AK-M12-B5, AK-E3-06, AK-E4-11, AK-E6-01.
- (4) F-P2/3/4 entschieden: §5, §11; Anhang 02 D, E; AK-E1-11, -16.
- (5) Render-Auflagen lead-art: Anhang 02 D, E; AK-E1-17…22, AK-E4-15.
- (6) lead-qa A2–A8: Pin-Liste und Übergangsbestand Anhang 03 A, D (`SPICE_GRACE_PER_HOUSE`); §7; AK-M12-B3,
  AK-E2-11…14, AK-E3-05, -07, AK-E4-16…19.
- (7) Auflagen für die Pläne: Anhang 04, letzter Abschnitt; Verweis §9.2; ADR-005-Nachtrag §9.3.
- (8) R229 P-14: zweiter v6-Stand `save-v6-locks.json`; `save-v6.json` ohne Sperren und Glas: §4.3, §4.8,
  AK-E0-06; Anhang 01 C, G.
