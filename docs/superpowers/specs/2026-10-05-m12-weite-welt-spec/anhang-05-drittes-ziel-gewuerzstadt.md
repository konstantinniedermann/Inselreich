# Anhang 05 — Drittes Ziel «Gewürzstadt» (Nachtrag I-010, R238)

Zur [Spec M12](../2026-10-05-m12-weite-welt-spec.md), §7 und §8; Teil des **Seefahrt-Bündels E2+E3+E4** (ein
Merge, Save v9, keine eigene Version). Quelle: Idee I-010 in `docs/ideen.md`, Ruling R238. Rechnung n:
`design-economy-designer` (Abschnitt D). **Setzung Nachtrag** = hier neu gesetzt; **[Tech]** = lead-tech entscheidet
im Plan. Einheiten: Ticks (`TICK_MS` 100, 10 Ticks = 1 s Spielzeit bei 1×); Mengen je 100 Ticks.

## A. Spielerzweck

„Nach der Handelsstadt habe ich ein neues Ziel: 80 Kaufleute, die Gewürz von meiner eigenen Plantage bekommen, per
Schiff heimgeholt." Das Ziel führt durch die ganze M12-Schleife (Fremdinsel → Kontor II → Gewürzplantage → Route)
und gibt dem Archipel einen Spannungsbogen. Säule: Wirtschaft, Steuern und Handel; Bevölkerung (Kaufleute halten).

## B. Regel (Setzung Nachtrag)

Das dritte Ziel ist eine Flagge `world.wonSpice` (boolean). Sie wird nur gesetzt, nie zurückgesetzt, und nur, wenn
`wonMerchants` schon gilt. Prüfung in `checkWin` (je Tick, nach `wonMerchants`, im selben Tick möglich):

1. **Kaufleute-Bedingung:** Summe der Einwohner aller Häuser mit `house.tier === 4`, für die
   `allNeedsMet(house, TIERS[4])` gilt (Versorgung, alle Bedarfsgüter **einschliesslich Gewürz**, alle Dienste) **und**
   `world.tick − house.satisfiedSince ≥ WIN_SPICE_HOLD`, ist ≥ `WIN_SPICE_MERCHANTS`. Stand beim Prüfen, kein
   Spitzenwert. `satisfiedSince` wie heute (Rücksetzen bei unerfüllten Bedürfnissen und beim Aufstieg); das Ziel
   schreibt es nie.
2. **Schleifen-Bedingung** (`spiceLoop`): Es gibt ein Schiff mit `route ≠ null`, dessen Route die Heimat (Insel 0)
   und eine Fremdinsel `i ≥ 1` verbindet und Gewürz **in Richtung i → 0** holt (`spice` in `ab` bei `a = i, b = 0`
   oder in `ba` bei `a = 0, b = i`), **und** auf Insel `i` steht mindestens eine `spicefarm`. Eine Route zwischen
   zwei Fremdinseln zählt nicht. Geprüft wird der Zustand, nicht eine bereits gelieferte Menge.

Zukauf (40 je Gewürz) bleibt der Notweg zur **Versorgung**: Er hält Kaufleute über Bürger-Niveau (kein zwingender
Bankrott), gewinnt das Ziel aber nicht allein (Bedingung 2). Die Prüfung ist rein lesend: kein `createRng`, keine
Schreibzugriffe ausser der Flagge, keine Abhängigkeit von der Iterationsreihenfolge (Summe und „es gibt").

## C. Werte je Eintrag in `src/sim/defs/`

| Datei      | Eintrag               | Wert | Begründung                                                             |
| ---------- | --------------------- | ---- | ---------------------------------------------------------------------- |
| `tiers.ts` | `WIN_SPICE_MERCHANTS` | 80   | Abschnitt D; 4 Häuser zu 20 EW, 4 Plantagen, 1 Schiff                  |
| `tiers.ts` | `WIN_SPICE_HOLD`      | 600  | 60 s stabil; liegt unter dem Lagerpuffer (1250) und deckt einen Umlauf |

Der Zielname „Gewürzstadt" ist UI-Text wie `SECOND_GOAL_NAME` (`src/ui/goal.ts`, `THIRD_GOAL_NAME`), kein Spielwert.
Keine weiteren Werte; Gewürz, Plantage, Schiff und Route unverändert aus Anhang 03 A.

## D. Herleitung n (design-economy-designer)

Ein Haus der Stufe 4 fasst 20 EW, n wirkt also in Schritten von 20: Häuser `H = ⌈n / 20⌉` (Steuer „hoch", Belegung
15: `⌈n / 15⌉`).

- **Bedarf und Plantagen:** Bedarf `S = 0,1 · n`; eine Plantage liefert `100 / 50 = 2`; Plantagen `P = ⌈n / 20⌉`.
  n 60: S 6, P 3 · **n 80: S 8, P 4** · n 100: S 10, P 5 · n 120: S 12, P 6.
- **Platz:** Radius 8 um das Kontor II ≈ 200 Kacheln, an der Küste ≈ 100 Land; je Plantage 2 × 2 plus Weg ≈ 6.
  Rechnerisch 4–6 Plantagen, auf B (36 × 36) mehr als auf A (24 × 24). **Garantiert** (Anhang 02 A) sind A 2, B 3.
  Volle Eigenversorgung für n 80 ist also garantiert nur mit beiden Inseln (2 + 3 = 5 ≥ 4) oder mit freiem Platz über
  der Garantie; sonst deckt Zukauf den Rest (B mit 3 Plantagen: 2 Gewürz zu 40 = 80 Geld je 100 Ticks).
- **Durchsatz einer Route:** `q = 50 · 100 / (2 · 10 · d) = 250 / d`, ein Schiff versorgt `2500 / d` Kaufleute.
  A (d 25–30): q 10,0–8,3, 100–83 Kaufleute → n 80 mit 1 Schiff. B (d 35–40): q 7,1–6,25, 71–62 Kaufleute, deckt die
  3 garantierten Plantagen (6). Zweites Schiff erst ab n > 83 (A, d 30) bzw. n > 62 (B, d 40). Heimatlager 100 Gewürz
  deckt bei n 80 1250 Ticks, mehr als ein Umlauf (500–800).
- **Bilanz je Kaufmann bei n 80** (Netto = Steuer 22 − Ketten 8,5 − Gewürzkosten je EW; Endzustand mit −70 Dienste):

  | Pfad                                  | Gewürz je EW                | Netto | Endzustand 80 EW |
  | ------------------------------------- | --------------------------- | ----- | ---------------- |
  | Nur Zukauf (Ziel **nicht** erfüllt)   | 0,1 · 40 = 4,00             | +9,5  | +690             |
  | A: 4 Plantagen, 1 Schiff              | (60 + 15 + 10) / 80 = 1,06  | +12,4 | +925             |
  | B: 3 Plantagen, 1 Schiff, Zukauf 2    | (45 + 25 + 80) / 80 = 1,88  | +11,6 | +860             |
  | B: 4 Plantagen, 2 Schiffe             | (60 + 30 + 10) / 80 = 1,25  | +12,3 | +880             |
  | Minimalschleife: 1 Plantage, Zukauf 6 | (15 + 25 + 240) / 80 = 3,50 | +10,0 | +730             |

- **Amortisation** gegen reinen Zukauf (320 je 100 Ticks), Investition Geld plus Material zum Kaufpreis (Kontor II
  800 + 670, Schiff 1200 + 650, Plantage 200 + 240, Wege ≈ 50): A 4 Plantagen ≈ 2200 Ticks (3,6 min); B 3 Plantagen
  plus Zukauf ≈ 2800 (4,6 min); B 4 Plantagen, 2 Schiffe ≈ 3200 (5,3 min); Minimalschleife ≈ 9500 (16 min). Alle
  Pfade positiv, keiner dominiert: „nah und eng" (A) gegen „fern und weit" (B).
- **Zeit:** frühestens ≈ 12 600–13 000 Ticks (≈ 1500–2000 nach Handelsstadt, Pin ≈ 11 200, höchstens 12 000);
  Aufstieg 3 → 4 (600 Geld, Glashütte 300), Füllen 15 → 20 in 250 Ticks, Halten 600 ab Aufstieg; Gründung, Plantagen
  und Route parallel. Wer erst nach Handelsstadt mit Seefahrt beginnt: ≈ 13 500–15 000.
- **Warum 80:** spürbar über 60 (ein Haus, eine Plantage mehr), mit 1 Fremdinsel und 1 Schiff erreichbar. 100 braucht
  auf B ein zweites Schiff und mehr Plätze als garantiert, 120 dazu ein zweites Badehaus: mehr vom Gleichen.
- **Warum Halten 600:** Der Aufstieg setzt `satisfiedSince` zurück; für das vierte Haus ist das Halten der Engpass,
  60 s sichtbar stabil. Leeres Lager bei einer Entnahme, Brandausfall eines Dienstes, Sturm an der Plantage setzen
  zurück: Das Ziel prüft echte Stabilität.

## E. Save v9 (Ergänzung zu Anhang 03 B)

- **Neues Feld:** `World.wonSpice: boolean`. Gehört zur v9-Zeile in Anhang 03 B (keine eigene Version).
- **Migration v8 → v9:** `wonSpice = false`, auch für Stände mit `wonMerchants` (kein Rückwirkend-Setzen beim Laden).
- **Ladeprüfung v9:** `wonSpice` ist boolean; `wonSpice ⇒ wonMerchants` (sonst „Beschädigter Spielstand"), analog
  `wonMerchants ⇒ won` (Save v4).
- **Fold-back:** `normalized()` (`balance-crises`) entfernt zusätzlich `wonSpice` (Erweiterung der Feldliste
  AK-M12-B2).

## F. Bedienung und Texte (Setzung Nachtrag; Namen und Zahlen aus `defs`)

`goalView` erhält die Phase `'spice'` zwischen `'merchants'` und `'done'`:
`{ phase: 'spice'; current; target: WIN_SPICE_MERCHANTS; loop: boolean }`, `current` = Summe aus B.1, `loop` = B.2.
`'done'` gilt erst mit `wonSpice` (`current` = `merchants(world)`, `target` = `WIN_SPICE_MERCHANTS`).

| Stelle                 | Text                                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------------------ |
| `merchants`, `next`    | „Danach: Gewürzstadt — 80 Kaufleute mit Gewürz von einer fernen Insel"                           |
| `spice`, `chip`        | „Ziel n / 80 Kaufleute mit Gewürz"                                                               |
| `spice`, `title`       | „Drittes Ziel: 80 Kaufleute, 60 s voll versorgt — Gewürz per Schiff von deiner eigenen Plantage" |
| `spice`, `rest`        | „n / 80 Kaufleute mit Gewürz"                                                                    |
| `spice`, `next`        | `loop` false: „Fehlt: Schiffsroute, die Gewürz von deiner Plantage heimholt"; `loop` true: null  |
| `done`, `chip`         | „Gewürzstadt · m Kaufleute"                                                                      |
| `done`, `title`        | „Alle drei Ziele erreicht — freies Spiel"                                                        |
| `done`, `rest`         | „Gewürzstadt erreicht · m Kaufleute"                                                             |
| Banner (`THIRD_GOAL…`) | „Drittes Ziel erreicht: Gewürzstadt mit 80 Kaufleuten! Das Spiel läuft weiter."                  |

`fillPct` wie bisher `min(100, current / target · 100)`, in `done` 100. `GoalShown` + `wonSpiceShown`;
`initialGoalShown` setzt es aus `world.wonSpice` (ein geladener Stand zeigt kein Banner erneut); `goalBanners` zeigt
in der Reihenfolge erstes, zweites, drittes Ziel; Ton `win` je Frame höchstens einmal (wie RF-4). „60 s" ist
Spielzeit bei 1×; kein Text enthält „Tick". README Abschnitt „Ziel": drittes Ziel statt „danach spielst du frei
weiter", mit dem v9-Merge (Spec §9.3).

## G. Randfälle

- **Einmal erreicht, bleibt erreicht:** Abriss von Plantage, Kontor II oder Schiff, Route auflösen, Kaufleute
  schrumpfen → `wonSpice` bleibt true, `'done'` bleibt.
- **Vor dem Erreichen:** Route aufgelöst oder umgestellt (Gewürz nicht mehr i → 0) → Bedingung 2 falsch, Chip zeigt
  „Fehlt: …"; die Haltezeiten der Häuser laufen weiter (Bedingung 1 hängt nicht an der Route).
- **Schiff unterwegs, `homing` oder Anfahrt:** zählt, solange `route` gesetzt ist; `homing` hat `route null` → zählt
  nicht.
- **Nur Zukauf:** Kaufleute versorgt, Bedingung 1 kann gelten, Bedingung 2 nie → kein Ziel, kein Bankrott.
- **Steuer „hoch":** Belegung 15 → 6 Häuser für 80; erlaubt, bewusst schwerer. Aufstiegsstopp ändert nichts.
- **Alter Stand mit vielen Kaufleuten** (v8 → v9): `wonSpice` false; Ziel erst nach Seefahrt-Schleife und 600 Ticks
  Halten; Banner einmal im Spiel, nie beim Laden eines Standes mit `wonSpice` true.
- **Erstes, zweites und drittes Ziel im selben Tick** (Szenario): Flaggen in dieser Reihenfolge, Banner in dieser
  Reihenfolge, ein Ton.
- **Geldschwemme:** Nach dem dritten Ziel ≈ +925 je 100 Ticks ohne Senke; Beobachtung in `docs/beobachtungen.md`,
  nicht Teil dieses Nachtrags.

## H. Abnahmekriterien

Vitest in CI (`make test`). „Szenario" = Testwelt v9 mit Fremdinsel B, `kontor2`, ≥ 1 `spicefarm` auf B, einem
Schiff mit Route 0 ↔ B (Gewürz B → 0) und 4 Kaufmannshäusern zu 20 EW mit allen Diensten und Gütern im Lager (Helfer **[Tech]**,
Auflage J.5).

| AK       | Prüfung                                                                                                                                                                               | Datei                                                 |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| AK-Z3-01 | Werte: `WIN_SPICE_MERCHANTS` 80, `WIN_SPICE_HOLD` 600 in `defs/tiers.ts`; kein Zahlenwert 80 oder 600 für das Ziel ausserhalb `defs/`                                                 | `tests/sim/defs.test.ts`                              |
| AK-Z3-02 | Szenario: `wonSpice` false nach 599 Ticks Halten, true nach 600 (gemessen ab dem letzten `satisfiedSince`)                                                                            | `tests/sim/goal3.test.ts` neu                         |
| AK-Z3-03 | Szenario mit 3 Häusern (60 EW) oder einem Haus ohne Gewürz im Lager: nach 1000 Ticks `wonSpice` false; mit 4 Häusern true                                                             | `goal3.test.ts`                                       |
| AK-Z3-04 | Schleife: ohne Schiff, mit Route ohne Gewürz, mit Gewürz in Richtung 0 → B, mit Route A ↔ B, mit `homing`, ohne `spicefarm` auf der Fremdinsel → je `wonSpice` false; Szenario → true | `goal3.test.ts`                                       |
| AK-Z3-05 | Nur Zukauf: wie Szenario, aber ohne Schiff und ohne Plantage, Heimat-Gewürz je 100 Ticks nachgefüllt (Kauf am Kontor) → 4 Häuser bleiben versorgt, nach 2000 Ticks `wonSpice` false   | `goal3.test.ts`                                       |
| AK-Z3-06 | Ohne `wonMerchants` (Flagge false, sonst Szenario) → `wonSpice` false; nach Setzen von `wonMerchants` im selben Tick möglich                                                          | `goal3.test.ts`                                       |
| AK-Z3-07 | Nie zurück: nach `wonSpice` Abriss aller Plantagen, Route auflösen, Häuser abreissen, 1000 Ticks → true; `goalView` bleibt `'done'`                                                   | `goal3.test.ts`                                       |
| AK-Z3-08 | Determinismus: Szenario zweimal mit gleichem Seed → gleicher Tick des Setzens und gleiche serialisierte Welt; `createRng` in der Zielprüfung nicht aufgerufen (Spion)                 | `goal3.test.ts`                                       |
| AK-Z3-09 | Save: v8 → v9 setzt `wonSpice` false (auch mit `wonMerchants`); Round-trip v9 erhält true; `wonSpice` true bei `wonMerchants` false oder Nicht-boolean → „Beschädigter Spielstand"    | `tests/sim/save.test.ts`                              |
| AK-Z3-10 | `goalView`: `'merchants'` vor dem dritten Ziel nur bis `wonMerchants`; danach `'spice'` mit `current` nach B.1 und `loop` nach B.2; `'done'` erst mit `wonSpice`                      | `tests/sim/queries.test.ts`                           |
| AK-Z3-11 | Texte wörtlich wie F (mit Werten aus `defs`); `next` je `loop`; kein Text enthält „Tick"                                                                                              | `tests/ui/goal.test.ts`                               |
| AK-Z3-12 | Banner: drittes Ziel einmal, Reihenfolge bei mehreren Zielen im selben Frame, ein Ton `win`; nach Laden eines Standes mit `wonSpice` true kein Banner                                 | `tests/ui/goal.test.ts`                               |
| AK-Z3-13 | Bitgleichheit: `balance-merchants` Ende mit `wonSpice` false; `balance-crises` Fingerabdruck mit erweitertem `normalized()` unverändert `0x701c6da5`; `balance.test.ts` Diff leer     | `balance-merchants.test.ts`, `balance-crises.test.ts` |
| AK-Z3-14 | Browser-Check (1280 × 800, Szenario-Stand geladen): Chip zeigt „Ziel n / 80 Kaufleute mit Gewürz"; Route auflösen → „Fehlt: …" im Tooltip/Chronik; nach Erreichen Banner einmal       | Browser, `.studio/qa/`                                |

## I. Abgenommene Pins und AK, die der Nachtrag ändert

| Pin / AK         | Datei                               | Änderung                                                                                   |
| ---------------- | ----------------------------------- | ------------------------------------------------------------------------------------------ |
| M8 AK-S3-03      | `tests/sim/queries.test.ts`         | Nach `wonMerchants` Phase `'spice'` statt `'done'`; `'done'` erst mit `wonSpice`           |
| M8/M11 AK-U1-01  | `tests/ui/goal.test.ts`             | Phase `merchants`: `next` statt null der Text aus F; Phase `done`: Gewürzstadt-Texte aus F |
| RF-4 (Banner)    | `tests/ui/goal.test.ts`             | `GoalShown` + `wonSpiceShown`; bestehende Fälle grün, dritter Fall dazu                    |
| AK-M12-B2        | Anhang 04, `balance-crises.test.ts` | Feldliste des Fold-back + `wonSpice`                                                       |
| Anhang 03 B (v9) | Spec                                | v9-Felder + `wonSpice`; Ladeprüfung v9 + `wonSpice ⇒ wonMerchants`                         |

Neupin mit Befehl und Commit wie Anhang 03 D; kein Test gelöscht.

## J. Auflagen an den Bündel-Plan E2+E3+E4 (Determinismus; lead-tech, lead-qa im Gate Plan)

1. **Controller nach dem zweiten Ziel:** `runMerchants` bricht bei `wonMerchants` ab
   (`tests/sim/merchantsController.ts`, Schleife bis `wonMerchants` oder `MERCHANT_TICK_LIMIT`) und baut weder Insel
   noch Schiff. Das bleibt so; der Plan erweitert den Controller **nicht** um das dritte Ziel. AK-Z3-13 prüft
   `wonSpice` false am Ende.
2. **Neupin `feedSpice` / `wonMerchantsTick`:** Die Neumessung (AK-E3-05) erfolgt auf der Integrationsbranch **nach**
   dem Einbau der erweiterten `checkWin` (alle drei Teile plus Nachtrag), nicht auf der E3-Teilbranch allein. Die
   Prüfung wirkt erst nach `wonMerchants` und schreibt nur `wonSpice`; `[winTick, wonMerchantsTick,
minMoneyAfterWin]` darf sich durch den Nachtrag nicht ändern. Der Plan nennt diese Begründung, lead-qa prüft sie
   im Gate Plan.
3. **Rein lesend:** Die Zielprüfung liest nur Häuser (`allNeedsMet`, `satisfiedSince`), Gebäude und Schiffe;
   kein `createRng`, kein Schreiben ausser `wonSpice`; Auswertung nur, wenn `wonMerchants && !wonSpice` (Aufwand).
4. **Tick-Reihenfolge:** `checkWin` bleibt an seiner Stelle (nach `tickCrises`, vor `tickUnlocks`); `tickShips`
   läuft vorher (Anhang 03 E). Eintrag im ADR-005-Nachtrag (Auflage B5) mitführen.
5. **Szenario-Helfer** für AK-Z3-02 … -08 und Fixture-Stand für AK-Z3-14 im Plan (lead-qa Teil B); kein
   Balancing-Pin für das dritte Ziel (der Controller erreicht es nicht), Absicherung über die Szenario-Tests.

## K. Nicht in diesem Nachtrag

Vierte und weitere Ziele, Belohnung beim Erreichen (Geld, Freischaltung), Archipel-Ziel mit mehreren Kontoren,
Gewürz-Mengenzähler „heimgebracht", Controller für die Seefahrt, Änderung der Plantagenplatz-Garantie (Anhang 02 A),
Geld-Senken im späten Spiel.
