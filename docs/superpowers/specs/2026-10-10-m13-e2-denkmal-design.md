# M13 Etappe E2 «Denkmal als Wahlziel» (I-039) — Design-Spec

Datum: 2026-10-10 · Paket design-m13-e2 · Meilenstein M13 «Spätspiel mit Richtung» · Status: **Gate Spec BEDENKEN (R489), Nachtrag
eingearbeitet (Anhang 08); das Gate Plan prüft den Nachtrag mit** · Prozessstufe voll

Grundlage: [Designvorschlag](2026-10-10-spaetspiel-vorschlag.md) §4.2 (D1–D6), §5–§10 (verbindlich für Regeln und
Zahlen), [Rechnung](2026-10-10-spaetspiel-vorschlag/anhang-01-rechnung.md) C, D.2, D.3, «Empfohlene Werte»; Rulings
**R452** (O1–O11, B1–B3), **R466** (1), (2), **R476** (Tasten), **R477** (Save-Reihenfolge);
[Art-Vorschlag Denkmal](2026-10-10-denkmal-art-vorschlag.md) §4, §5; `docs/beobachtungen.md` (M13-E1, Punkte 3, 9);
[Hauptspec](2026-09-29-inselreich-design.md). Muster: [Spec M13-E1](2026-10-10-m13-e1-edikte-design.md). Code-Stand:
`main` 46be7401.

Anhänge: [01 Rechenbeispiele](2026-10-10-m13-e2-denkmal-design/anhang-01-rechenbeispiele.md) ·
[02 Save v12](2026-10-10-m13-e2-denkmal-design/anhang-02-save-v12.md) ·
[03 Seed-Läufe B3](2026-10-10-m13-e2-denkmal-design/anhang-03-seed-laeufe.md) ·
[04 Zuordnung R452/R466](2026-10-10-m13-e2-denkmal-design/anhang-04-zuordnung-r452-r466.md) ·
[05 Doku-Folgen](2026-10-10-m13-e2-denkmal-design/anhang-05-doku-folgen.md) ·
[06 Asset-Anforderung](2026-10-10-m13-e2-denkmal-design/anhang-06-asset-anforderung.md) ·
[07 UI-Helfer und Texte](2026-10-10-m13-e2-denkmal-design/anhang-07-ui-texte.md) ·
[08 Nachtrag Gate Spec](2026-10-10-m13-e2-denkmal-design/anhang-08-nachtrag-gate.md).

Kennzeichnung: **Setzung Spec** (hier ergänzt oder vom Lead gesetzt), **[Tech]** (Umsetzungsdetail; lead-tech
entscheidet im Plan, die Spec legt nur das prüfbare Verhalten fest).

## 1. Ziel

**Spielerzweck E2:** «Nach dem Kaufleute-Ziel setzt der Spieler auf der Heimatinsel ein Denkmal und baut es in drei
Abschnitten aus Geld, Stein, Werkzeug, Glas und Gewürz hoch; je Gut wählt er Erzeugung oder Zukauf und sieht das
Bauwerk mit jedem Abschnitt wachsen.»

Heute haben Geld und Überschussware nach Ziel 2 keine Richtung (Vorschlag §2). Das Denkmal ist eine **Senke mit
Wahl**: 18 000 Geld fix, 1440 Waren aus Erzeugung oder Zukauf; ein Zukauf kauft Zeit zu rund 1100 Geld je Minute
(Rechnung C.2). Es ist ein **Wahlziel**: kein Sieg, kein Lohn, aber sichtbar auf der Karte und im Ziel-Chip. Die
Reserve schützt die Versorgung der Häuser, Ziel 3 verschiebt sich nicht (C.3).

## 2. Umfang und ausdrücklich nicht

**Im Umfang:** Sim (Gebäude `monument` 3×3, Standortregel `home`, Freischaltung `wonMerchants`, Zustand
`world.monument`/`monumentDone`, drei Aktionen, Zug mit Reserve und Zukauf, Abschluss, Abriss); Save v12; UI
(Bauleiste, Panel, Ziel-Chip, Inselchronik, Meldungen, Log, Abschluss-Moment mit Effekt und Glocke); Grafik in fünf
Bildstufen (M13-E2-ART); Seed-Läufe B3; Berichtigungen der E1-Spec (§11); README, arc42.

**Ausdrücklich nicht** (Vorschlag §10, R452): mehrere Denkmäler, Fremdinseln, weitere Wahlziele; mechanischer Lohn;
Wartung, Verfall, Unterhalt; Controller-Strategie (kein Controller baut ein Denkmal; `tests/sim/controller.ts`,
`merchantsController.ts` unverändert); Änderungen an Zielen 1–3, bestehenden Defs, `GOODS`-Preisen, Edikt-Werten,
`TAX_LEVELS`, Fest; Zukauf über Sättigung oder Lagergrenze des Kontors, Verkauf aus dem Denkmal; neue Tasten (R476:
`Entf`/`Backspace` und `Strg`/`Cmd`+`S` sind belegt; das Denkmal hat keine Bau-Taste, wie die Rinderfarm); neues
Audio-Asset; Mouse-over-Zeile; Gerüst-Animation; Mobil-Optimierung; Felder von I-048 und I-049 (R477, §9).

## 3. Regeln

Begriffe: **Denkmal-Gut** = `MonumentGood` (`'stone'`, `'tools'`, `'glass'`, `'spice'`), Reihenfolge
`MONUMENT_GOODS`. **Soll** = `MONUMENT_STAGES[stage].goods[g]`. **Rest** = Soll − `delivered[g]`. **Heimatlager** =
`home(w).stock`. **Angebunden** = `w.buildings[monument.buildingId].connected`.

### R1 Gebäude und Bauplatz (D1, S1)

- **R1.1** `BUILDING_DEFS.monument`: Name «Denkmal», `w 3`, `h 3`, `cost(500, 10, 0, 10)` (Geld, Holz, Werkzeug,
  Stein), `upkeep 0`, `category 'public'`, **kein** `flammable`, `maxCount { n: 1, reason: 'Es gibt schon ein
Denkmal' }`, `site [{ kind: 'home' }, { kind: 'supply' }]`; Schlüssel **am Ende** von `BUILDING_DEFS`.
- **R1.2** Neue Standortregel `{ kind: 'home' }` [Tech: Name]: `siteRuleOk` ok nur für `island === HOME`, sonst
  `'Nur auf der Heimatinsel'`.
- **R1.3** `canPlace` prüft wie heute: Kontor der Fremdinsel → Freischaltung (R2) → `maxCount` → Boden über 3×3 →
  `home` → `supply` (Mittelpunkt `x + 1,5`, `y + 1,5`, euklidisch).
- **R1.4** `placeBuilding` belegt neun Kacheln und setzt im selben Aufruf `world.monument = { buildingId, stage: 0,
running: false, delivered: {alle 0}, paused: false, buy: {alle false} }`; `monumentDone` bleibt.
- **R1.5** Anbindung wie die Amtsstube (**Setzung Spec**): `needsConnection('monument') === false` (kein Zustand
  `'notConnected'`, kein Problemlisten-Eintrag); `connected` aus einem Weg an einer der zwölf Randkacheln. Der Zug
  liest `connected`.
- **R1.6** Nicht brennbar (nie Brandziel), Sturm ohne Wirkung, kein RNG-Zugriff. Bauklang Gruppe `stone` [Tech].

### R2 Freischaltung (D1, S2)

- **R2.1** `MONUMENT_UNLOCK = 'wonMerchants'`. `buildLock(w, 'monument')` = `'Erst nach dem Kaufleute-Ziel'`, solange
  `w[MONUMENT_UNLOCK] !== true`, sonst `null`. Kein `UNLOCKS`-Eintrag; `world.unlocked`, `UNLOCK_IDS` unverändert
  [Tech: Sonderfall in `buildLock` oder Tabelle «Freischaltung über Weltflagge»].
- **R2.2** Bestehendes Muster: vorher nicht in der Bauleiste (`buildingShown` false), `canPlace` nennt den Grund.
  Danach in «Öffentlich», **nur auf der Heimatinsel** (`buildEntries` blendet es auf Fremdinseln aus wie `kontor2` in
  der Heimat; **Setzung Spec**). Kein «neu»-Marker (`newBuildEntries` liest nur `UNLOCKS`).
- **R2.3** Ein geladener Stand mit `wonMerchants === true` erlaubt den Bau sofort.

### R3 Zustand (S3)

`world.monument: Monument | null` und `world.monumentDone: boolean`, am Ende nach `edictLockedUntil`. `Monument`:
`buildingId` (Id des Gebäudes); `stage` 0 … 3 (Zahl der **fertigen** Abschnitte); `running` (Abschnitt `stage + 1`
gestartet, Geld bezahlt); `delivered: Record<MonumentGood, number>` (laufender Abschnitt, ohne `running` alle 0);
`paused` («Bau pausieren», Standard `false`); `buy: Record<MonumentGood, boolean>` (Schalter «zukaufen», Standard
`false`, gilt über Abschnitte). `monumentDone` wird nach Abschnitt 3 einmalig `true` und nie zurückgesetzt, auch nicht
durch Abriss.

### R4 Aktionen (S3)

Neues Modul `src/sim/monument.ts`. Alle Aktionen werfen nie, ziehen keinen Zufall, ändern bei `ok: false` nichts.

- **R4.1 `startMonumentStage(w)`:** (1) `monument === null` → `'Kein Denkmal'`; (2) `stage >= 3` → `'Denkmal fertig'`;
  (3) `running` → `'Abschnitt läuft'`; (4) `money < MONUMENT_STAGES[stage].money` (auch negativ) → `'Zu wenig Geld'`;
  (5) `money −= Betrag`, `running = true`, `delivered` alle 0, `ok`. Anbindung und Pause sind keine Bedingung.
- **R4.2 `setMonumentPaused(w, paused: unknown)`:** (1) `'Kein Denkmal'`; (2) kein Boolean → `'Ungültiger Wert'`;
  (3) setzen, `ok`, auch bei gleichem Wert (**Setzung Spec**: Schalter-Semantik).
- **R4.3 `setMonumentBuy(w, good: unknown, on: unknown)`:** (1) `'Kein Denkmal'`; (2) kein `MonumentGood` →
  `'Ungültiges Gut'`; (3) `on` kein Boolean → `'Ungültiger Wert'`; (4) setzen, `ok`.

### R5 Zug (D3, S4)

- **R5.1** `tickMonument(w)` läuft in `step` direkt nach `tickEconomy` (damit nach `tickPopulation`) und vor `checkWin`
  (**Setzung Nachtrag**, R489, tech B3); die letzten zwei Aufrufe bleiben `checkWin`, `tickUnlocks` (AK-S1-05 (c)).
  Gezogen wird bei `w.tick % MONUMENT_PULL_TICKS === 0` (Phase des Ticks, Muster `growthInterval`).
- **R5.2** Je Gut in `MONUMENT_GOODS`-Reihenfolge mit Rest > 0, höchstens ein Stück je Gut und Zug: (1) `stock[g] >
reserve(w, g)` → `stock[g] −= 1`, `delivered[g] += 1`; (2) sonst bei `buy[g]` ein Zukauf über die Funktion aus R7.3;
  liefert sie 1 Stück, `delivered[g] += 1`; (3) sonst nichts.
- **R5.3** Kein Zug bei `monument === null`, `!running`, `paused` oder nicht angebunden.
- **R5.4** Reserve einmal je Zug vor dem ersten Gut; Ergebnis nur aus dem Weltzustand, kein RNG.

### R6 Reserve (D3, S5)

- **R6.1** `reserve(w, g) = max(MONUMENT_RESERVE_MIN, ⌈MONUMENT_RESERVE_TICKS × U_g / 100⌉, lock_g)`. `U_g` =
  Hausverbrauch der Heimat je 100 Ticks = Σ `inhabitants × TIERS[tier].needs[g]` über versorgte Häuser (Häuser-Teil von
  `goodsBalance(w, HOME)`, Betriebe zählen nicht) [Tech: Abfrage]. `lock_g` liefert eine eigene Funktion in `monument.ts` [Tech: Name,
  z. B. `monumentLock(w, g)`], in E2 immer 0, weil `Island.reserve` (I-049) erst nach E2 gemergt wird (R477, R489).
  I-049 ersetzt nur deren Rumpf durch den Sperrbestand `home(w).reserve[g]` (nur Stein) und bringt den Kopplungsfall
  K1 als eigenes AK mit (Anhang 08 A).
- **R6.2** Exakt ohne Gleitkomma-Fehler: 80 Kaufleute → 64, 60 → 48, 61 → 49 **Setzung Nachtrag** (tech A3): ganzzahlig, Σ `inhabitants × round(needs × 1000)`, dann
  Aufrundungs-Division; kein Gleitkomma, kein `DEFICIT_EPSILON`.. Stein, Werkzeug ohne I-049 immer 20. Tabelle: Anhang 01 A.
- **R6.3** Der Zug senkt den Bestand nie unter die Reserve; Häuser und Betriebe verbrauchen weiter darunter.

### R7 Zukauf (D4, S4)

- **R7.1 Zukauf möglich** = `noKontorTrade(w, HOME) === null` und `goodLock(w, g) === null`. Preis je Stück **immer**
  `buyPrice(w, g, 1)`: ohne Edikt `GOODS[g].buy` (15, 40, 50, 40), mit wirkendem Handel aufgerundet 80 % (12, 32, 40,
  32). **Setzung R489:** Der Zukauf **zahlt** den jeweils gültigen Kaufaufschlag aus I-048 (Kaufanteil `buyPct[g]`),
  **hebt ihn aber nicht**: kein Anstieg, keine Rückkopplung auf normale Käufe; Denkmal-Ware ist nicht verkäuflich, also
  kein Ausnutzen. Die Festwerte 64 200 / 54 960 gelten bei Kaufanteil 100; I-048 übernimmt die Setzung in Z3 und pinnt
  in seinem Plan nach.
- **R7.2** Das Stück geht direkt ins Denkmal: kein Lager, keine Lagergrenze, `sellPct` unverändert. Vollzukauf dauert
  2000 Ticks je Abschnitt (Anhang 01 C). Liegt Ware über der Reserve, wird nie gekauft.
- **R7.3 Eine Zukauf-Funktion** (**Setzung R489**, tech B1 (a)): Der Denkmal-Zukauf läuft nur über eine Funktion in
  `src/sim/trade.ts` [Tech: Name, z. B. `buyMonumentUnit(w, g)`]. Sie prüft «Zukauf möglich» (R7.1), rechnet
  `buyPrice(w, g, 1)`, liefert bei `money < Preis` 0 und ändert nichts, sonst `money −= Preis` und liefert 1. Lager,
  `sellPct` und Kaufanteil bleiben unverändert; `buy()` bleibt, wie es ist. I-048 hängt seine Preisregel nur dort ein,
  ohne `monument.ts` zu berühren.

### R8 Abschnitt fertig und Wahlziel (D5, S6)

- **R8.1** In jedem Tick mit `running` prüft `tickMonument` nach dem möglichen Zug: Rest aller Güter 0 → `running =
false`, `stage += 1`, `delivered` alle 0; auch bei `paused` und ohne Anbindung.
- **R8.2** `stage` wird 3 und `monumentDone === false` → `monumentDone = true`. `won`, `wonMerchants`, `wonSpice`
  unberührt; kein Lohn. Der nächste Abschnitt startet nur über R4.1.

### R9 Abriss (D6, S7)

- **R9.1** `demolish` setzt `world.monument = null`; `monumentDone` bleibt. Erstattet wird nur der Bauplatz wie bei
  jedem Gebäude (`refundCost(paidCost(b))` = 250 Geld, 5 Holz, 5 Stein); Abschnitts-Geld und Waren **nicht**.
  **Setzung Spec:** «keine Erstattung» (D6) meint Abschnitts-Geld und Waren; 250 < 500 ist kein Geldtrick.
- **R9.2** Ein Neubau beginnt bei `stage 0`; ein Abriss nach `monumentDone` lässt das Wahlziel erreicht.
- **R9.3** Bestätigung ab begonnenem Abschnitt 1 (P-1, entschieden R483): §7.5.

## 4. Datenmodell und Def-Einträge

`src/sim/defs/monument.ts` (neu). Abschnitts-Namen nach den Bildstufen (**Setzung Spec**, Art-Vorschlag §4):

| Eintrag                  | Wert                                                                                                        |
| ------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `MONUMENT_GOODS`         | `['stone', 'tools', 'glass', 'spice']`                                                                      |
| `MONUMENT_STAGES[0]`     | `{ name: 'Sockel', money: 4000, goods: { stone: 200, tools: 80, glass: 60, spice: 40 } }`                   |
| `MONUMENT_STAGES[1]`     | `{ name: 'Terrassen', money: 6000, goods: { stone: 200, tools: 80, glass: 140, spice: 100 } }`              |
| `MONUMENT_STAGES[2]`     | `{ name: 'Schaft und Feuerschale', money: 8000, goods: { stone: 200, tools: 80, glass: 160, spice: 100 } }` |
| `MONUMENT_PULL_TICKS`    | 10                                                                                                          |
| `MONUMENT_RESERVE_MIN`   | 20                                                                                                          |
| `MONUMENT_RESERVE_TICKS` | 800                                                                                                         |
| `MONUMENT_UNLOCK`        | `'wonMerchants'`                                                                                            |

Weitere Orte: `src/sim/defs/buildings.ts` `BUILDING_DEFS.monument` (R1.1); `src/sim/types.ts` `BuildingDefId` +
`'monument'`, `SiteRule` + `{ kind: 'home' }`, `MonumentGood`, `MonumentStageDef`, `Monument`, `World.monument`,
`World.monumentDone`, `World.version: 12`; `src/sim/save.ts` `SAVE_VERSION 12`, `migrateV11ToV12`, Prüfung V1–V9.

Sim-Funktionen: `startMonumentStage`, `setMonumentPaused`, `setMonumentBuy`, `tickMonument`, `monumentReserve`,
`monumentProgress` (Σ geliefert / Σ Soll) in `monument.ts`; geändert `siteRuleOk`, `buildLock`, `placeBuilding`,
`demolish`, `step`, `createWorld` [Tech: Module ohne Importkreise]. Keine Laufzeit-Abhängigkeit, `src/sim/` DOM-frei.

**Def-Test** (`tests/sim/defs.test.ts`): Werte exakt; Summen 18 000 / 600 / 240 / 360 / 240; `MONUMENT_GOODS` =
Schlüssel jedes `goods`; Mengen ganzzahlig > 0; Konstanten ganzzahlig > 0; `BUILDING_DEFS.monument` nach R1.1, letzter
Schlüssel.

## 5. Randfälle

- **Vor Ziel 2** nicht in der Bauleiste, `canPlace` nennt den Grund vor Boden und Kosten. **Ziel 2 im Stand:** sofort.
- **Fremdinsel:** mit Kontor `'Nur auf der Heimatinsel'`, ohne Kontor `'Erst ein Kontor auf dieser Insel'`.
- **Zweites Denkmal**, auch nach Fertigstellung: `'Es gibt schon ein Denkmal'`.
- **Geld knapp oder negativ:** Start abgelehnt; der Zukauf geht nie ins Minus, ruht bei `money < Preis`; Unterhalt
  anderer Gebäude wirkt wie heute.
- **Leeres Lager / auf Reserve** ohne Zukauf: der Abschnitt steht, Grund-Zeile im Panel.
- **Pausiert, Weg entfernt:** kein Zug ab dem nächsten Zug-Tick, Fortschritt bleibt; Abschluss-Prüfung läuft.
- **Abriss während eines Abschnitts:** Fortschritt und Abschnitts-Geld verloren (R9).
- **Häuser schrumpfen/wachsen, Handel erlassen, Amtsstube fällt aus:** Reserve und Preis folgen ab dem nächsten Zug.
- **Keine Häuser:** Reserve 20. **Alter Spielstand v1 … v11:** lädt, `monument null`, `monumentDone false`.

## 6. Baseline, Balancing und Auflage B3

**Bitgleich ohne Denkmal** (Vorschlag §7, D.2, S11): (a) kein Controller und kein Balancing-Test ruft eine
Denkmal-Aktion → `monument` bleibt `null`, `tickMonument` tut nichts; (b) neue Weltschlüssel am Ende, Rückfaltung
`foldBackToV11` für Hash-Pins (Anhang 02 D); (c) `monument` am Ende von `BUILDING_DEFS`, keine Iteration ändert
Ergebnis; kein RNG in neuen Pfaden, `fireTarget` liest nur `flammable`; (d) keine Wertänderung an bestehenden Defs,
kein Balancing-Ruling.

**Balancing-Test:** `balance.test.ts` (6750, Grenze 7500), `balance-merchants.test.ts` (6750 / 11 500),
`balance-edicts.test.ts` mit `K_ARM 11 800`, `SAVING_ARM 11 200`, `TRADE_ARM 11 200`, `T0 11 800` bleiben ohne Diff
grün; keine Pin-Änderung in `e0Pins.ts`, `e1Pins.ts`, `seePins.ts`.

**Mechanische Testanpassungen** (kein Erwartungswert ändert sich): Versionszeilen 11 → 12 in `tests/sim/save.test.ts`
und `save-v11.test.ts`; dort Schlüsselfolge (AK-M13E1-01: `slice(-4, -2)`) und «unbekannte Version»
`SAVE_VERSION + 1` statt 12 (AK-M13E1-26). Jede weitere Anpassung braucht einen Grund im Ledger.

**Auflage B3** (Anhang 03, neue Datei `tests/sim/balance-monument.test.ts`): Lauf A Vollzukauf exakt (AK-M13E2-12),
Lauf B Referenz ohne Zusatzausbau (AK-M13E2-18), Lauf C R-Ausbau (AK-M13E2-19), Reserve im Referenzstand
(AK-M13E2-20). Verfehlt Lauf C die Spanne: **Pflicht-Rulingpunkt** (Umsetzer stoppt, meldet an `lead-design`).

### 6.1 Randlage Sparen/Handel «arm» (R466 (2))

Sparen und Handel «arm» = 11 200 = K′ − 600 (K′ = 11 800) liegt auf der inklusiven Untergrenze von AK-M13E1-19;
gerechnet war K′ − 300 (Rechnung D.1), die Reserve bis zur Grenze ist 0. Folgen:

- (a) Keine E2-Regel wirkt vor `wonMerchants`, die Randlage bleibt unberührt (AK-M13E2-21: Diff leer).
- (b) Alle E2-Läufe im echten Spielstand starten aus **demselben** K′-arm-Stand bei **T0 = 11 800** (Variante «keins
  mit Amtsstube» aus `balance-edicts.test.ts`), nicht aus den früheren Ziel-2-Ticks der Edikt-Varianten; Läufe A und C
  sind synthetisch. Die Randlage pflanzt sich nicht in Denkmal-Messwerte fort.
- (c) Jede Wertänderung an `src/sim/defs/edicts.ts` im Feinschliff E3 lässt AK-M13E1-19 neu laufen und braucht ein
  Ruling.
- (d) Lesart: Sparen und Handel verkürzen Ziel 2 «arm» um ≈ 12 % der Strecke nach Ziel 1, doppelt so viel wie
  gerechnet; Playtest-Frage in E3, keine Änderung in E2.

## 7. UI

Desktop-first, Panel-Spalte 280 px ab 1280 px (1280×720, 1920×1080); schmaler nur «stürzt nicht ab». Zahlen und Namen
aus `MONUMENT_STAGES`, `MONUMENT_GOODS`, `GOODS`, `buyPrice`, `monumentReserve`; keine kopierte Zahl. Card-UI, CSS
Grid. Reine Helfer DOM-frei in `src/ui/monumentView.ts` [Tech], Vitest `tests/ui/monumentView.test.ts`; Signaturen,
Texte und Vorrang: Anhang 07.

### 7.1 Denkmal-Panel (S9)

- **U-1** Auswahl öffnet das Panel «Denkmal», Abschnitt «Bau»: Abschnittszeile (`monumentStageLine`), Grund-Zeile bei
  Stillstand (`monumentStallReason`: «Bau pausiert», «Nicht angebunden», «Kein Kontor», «Zu wenig Geld für den
  Zukauf», «Lager auf Reserve»; **Setzung Spec** Wortlaut), Zeile «frühestens fertig in m:ss» (= grösster Rest ×
  `MONUMENT_PULL_TICKS`, `formatGameTime`).
- **U-2** Je Gut eine Zeile (Grid, eine Spalte): «Glas 84 / 140», Balken, «Reserve 64» (klein), Schalter «zukaufen
  (50 / Stück)» mit `buyPrice(w, g, 1)`; Klick ruft `setMonumentBuy`.
- **U-3** Knopf «Bau pausieren» / «Bau fortsetzen» ruft `setMonumentPaused`; sichtbar bei `stage < 3`.
- **U-4** Knopf «Abschnitt n beginnen (Geld)», z. B. «Abschnitt 1 beginnen (4000)»; gesperrt mit Grund, bei `'Zu
wenig Geld'` klickbar mit Klasse `unaffordable` (Muster Edikt-Karte). Erfolg → Meldung «Abschnitt 1 begonnen:
  Sockel»; Fehler über `friendlyReason` («Zu wenig Geld: 4000 nötig, {money} vorhanden»).
- **U-5** Knoten einmal je Auswahl bauen, Nachführung setzt nur Text, Klassen, `hidden`, `disabled`, `checked`,
  `title` (Fokus bleibt).
- **U-6** Bauleiste: Tooltip-Zeile «Wahlziel in drei Abschnitten: Stein, Werkzeug, Glas, Gewürz»; Bauvorschau zeigt
  die 3×3-Raute und das Bild der Stufe 4 (`drawGhost`, Art-Vorschlag §4).
- **U-7** Gründe in `src/ui/hints.ts`: `'Erst nach dem Kaufleute-Ziel'`, `'Nur auf der Heimatinsel'`, `'Es gibt schon
ein Denkmal'`, `'Kein Denkmal'`, `'Abschnitt läuft'`, `'Denkmal fertig'`, `'Ungültiges Gut'`, `'Ungültiger Wert'`
  wörtlich.

### 7.2 Ziel-Chip und Inselchronik (S8, D5)

- **U-8 Ziel-Chip** (Phase `'done'`, vor Ziel 3 unverändert): `monumentDone` → «Wahlziel erreicht» (Balken 100);
  ohne Denkmal → «Wahlziel: Denkmal bauen» (0); `running` → «Denkmal {stage + 1}/3 · {x} %», x = ⌊100 × Σ geliefert /
  Σ Soll⌋; zwischen Abschnitten → «Denkmal {stage}/3» (⌊100 × stage / 3⌋). [Tech: `GoalView` erweitern.]
- **U-9 Inselchronik** (Ruhe-Ansicht `renderRest`, unter «Ziel»): Zeile `rest-monument`, verborgen vor
  `wonMerchants`; Texte Anhang 07. **Setzung Spec:** Die «Inselchronik» des Vorschlags (D5) ist diese Ruhe-Ansicht;
  sie führt das Wahlziel dauerhaft (`monumentDone` liegt im Stand).

### 7.3 Meldungen, Log, Abschluss-Moment (S6, Art-Vorschlag §4)

- **U-10** `monumentEvents(prev, cur, tick)` vergleicht `{ stage, monumentDone }` (Muster `crisisLogEntries`,
  `goalBanners`): `stage` steigt → Eintrag «Denkmal: Abschnitt {n} fertig», Meldung `info`; `monumentDone` false →
  true → Eintrag und Banner «Wahlziel erreicht: Das Denkmal steht!». Geladener Stand als Basis und Abriss ergeben nichts.
- **U-11** Einträge über `pushLog` ins Ereignis-Log; dessen Sichtbarkeit bleibt (`crisisLogVisible`, **Setzung
  Spec**): ohne Krisen sieht der Spieler Meldung, Banner und Chronik.
- **U-12 Abschluss-Moment** (**Setzung Spec**, Lead-Nachtrag): beim Übergang `monumentDone` false → true einmal ein
  Aufflammen der Feuerschale über `src/render/fx.ts` (≤ 3 s, nur bei sichtbarem Denkmal, unter `CAPS`, aus bei
  reduzierter Bewegung) und die bestehende Glocke `public/audio/sfx/bell.mp3` als Klangereignis
  (`diffSoundEvents`, neues Ereignis [Tech: Name]). Auslöser ist die UI; `src/audio/` importiert nichts aus `src/sim/`.
  Nach dem Laden kein erneuter Effekt.

### 7.4 Bildstufe (Render, Art-Vorschlag §5)

- **U-13** `monumentImageStage(m)` (rein, `src/render/`, Vitest): `stage 0` und nicht `running` → 0 (Bauplatz);
  `stage 0` und `running` → 1; `stage 1` → 2; `stage 2` → 3; `stage 3` → 4. Keine Anteils-Schwellen; jeder Abschluss
  ändert das Bild. Die Bildstufe steht in `spriteKey` (fehlt = 0); der Schlüsselaudit in `spriteCache.ts` wird
  nachgeführt. Details: Anhang 06.

### 7.5 Abriss-Bestätigung (S7, R476, P-1 nach R483)

R476 (3) sagt «keine Bestätigung beim Abriss per Taste». **R483 (P-1):** Ausnahme nur für das Denkmal ab begonnenem
Abschnitt 1, für Knopf **und** Taste gleich; für alle übrigen Gebäude bleibt der Abriss per Taste ohne Bestätigung.

- **U-14** `monumentNeedsConfirm(w, id)` = Denkmal und (`running` oder `stage ≥ 1`). Erster Klick auf «Abreissen» oder
  erster Druck auf `Entf`/`Backspace` setzt den Knopftext «Wirklich abreissen? Fortschritt geht verloren»; erst der
  zweite reisst ab. Auswahlwechsel, `Esc`, Panel-Schliessen setzen zurück (Muster «Wirklich laden?», `src/ui/dom.ts`).
  Der Zwei-Klick-Zustand ist ein reiner, DOM-freier Helfer in `src/ui/` [Tech: Name, Ort]; Fälle Anhang 08 C.
- **U-15** Abriss-Werkzeug und Abriss-Zug auf der Karte überspringen ein solches Denkmal mit Meldung «Denkmal nur im
  Panel abreissen». Ohne Fortschritt gilt der normale Abriss.

## 8. Grafik (Paket M13-E2-ART)

Prozedural in `src/render/sprites.ts` (ADR-006, ADR-012, ART-STIL-01), Motiv und Bauphasen nach
[Art-Vorschlag](2026-10-10-denkmal-art-vorschlag.md) §2, §4: fünf Bildstufen 0 Baugrund, 1 Sockel, 2 Terrassen, 3
Schaft, 4 Fertig; Höhe Stufe 4 ≈ 2,9 · `ISO_H` (≤ `H_TOWER`), höher als die Amtsstube (2,0; AK-M13E2-36). Render liest nur die
Bildstufe (U-13) und das Gebäude, schreibt nie in die Welt. Anforderung: Anhang 06.

## 9. Save v12

- **R9.1** `SAVE_VERSION = 12`; Weltschlüssel `monument`, `monumentDone` am Ende nach `edictLockedUntil`; Gebäude-Typ
  `monument` bekannt. Diese Spec legt **nur ihre eigenen** Schlüssel fest (R477). Merge-Reihenfolge (R489): AUFRAEUM-01 →
  M13-E2-SIM → I-049-Sim / I-048-SIM. I-049 (`Island.reserve`, Plan `docs/superpowers/plans/2026-10-10-i049-sperrbestand.md`)
  und I-048 (`World.buyPct`) setzen auf v12 auf, erweitern Migration und Ladeprüfung und verschärfen die Rückfaltung
  für ihren Schlüssel (R9.5).
- **R9.2** `migrateV11ToV12`: fehlt `monument` → `null`, fehlt `monumentDone` → `false`, `version 12`; Kette v1 …
  v12 ladbar.
- **R9.3** Ladeprüfung V1–V9 (Anhang 02 C): u. a. Mengen 0 … Soll, `stage` 0 … 3, `buildingId` ist `monument` auf der
  Heimat; Verstoss → `'Beschädigter Spielstand'`.
- **R9.4** Inkompatible Stände **mit Hinweis abweisen, nie ein Absturz**: `version` > 12 → `'Unbekannte Version'`, kein
  JSON → `'Ungültiges Format'`; Spiel bleibt unverändert, UI zeigt den Grund (Verfassung §3; AK-M13E2-26, -47).
- **R9.5** Hash-Pins über `foldBackToV11` [Tech: Name] vor `foldBackToV10` (Anhang 02 D): entfernt `monument`,
  `monumentDone` und alle Welt- und Inselschlüssel ausserhalb der v11-Positivlisten, **ohne die Reihenfolge der übrigen
  zu ändern** (**Setzung Nachtrag**, tech B4). Wer einen Schlüssel einführt (I-049 `reserve`, I-048 `buyPct`, qa B9b),
  verschärft für ihn auf «nur Neutralwert, sonst Fehler» (Muster I-049 `dropZeroReserve`). Fixtures Anhang 02 E.

## 10. Abnahmekriterien

Datei `tests/sim/monument.test.ts`, sofern nicht anders genannt. Testwelt `createWorld(3, { unlockAll: true })`,
`wonMerchants = true`, keine Häuser, Denkmal über `placeBuilding` auf festem, angebundenem Platz im Kontorradius
[Tech: Konstante], Lager der vier Güter 20, `money = 100 000`, Tick 1000. Erwartungswerte: Anhang 01.

### 10.1 Vitest Sim

- **AK-M13E2-01** `createWorld`: `monument null`, `monumentDone false`; `Object.keys(w).slice(-2)` = `['monument',
'monumentDone']`; `version 12`.
- **AK-M13E2-02** Def-Test nach §4 (`tests/sim/defs.test.ts`), inklusive Abschnitts-Namen.
- **AK-M13E2-03** Freischaltung: `wonMerchants false` → `canPlace` `'Erst nach dem Kaufleute-Ziel'` (auch auf Wasser,
  belegtem Boden); `buildEntries(w, 'public', HOME)` ohne `monument`. Danach ok und mit `monument`;
  `buildEntries(w, 'public', 1)` ohne; `world.unlocked` unverändert.
- **AK-M13E2-04** Bauplatz: ok; Geld −500, Holz −10, Stein −10; neun Kacheln mit der Id; `monument` nach R1.4. Zweites
  → `'Es gibt schon ein Denkmal'`; Fremdinsel mit Kontor → `'Nur auf der Heimatinsel'`; Anhang 01 F `x = kx + 8` →
  `'Ausserhalb der Versorgung'`, `kx + 7` ok.
- **AK-M13E2-05** 3×3: belegte Kachel in Zeile oder Spalte 3 → Bodengrund; Weg an jeder der zwölf Randkacheln →
  `connected true`; nur diagonal an einer Ecke → `false`.
- **AK-M13E2-06** Start: Stufe 0, `money 4000` → ok, `money 0`, `running`; erneut → `'Abschnitt läuft'`; `money
3999` / `−50` → `'Zu wenig Geld'`, Welt unverändert; ohne Denkmal `'Kein Denkmal'`; `stage 3` `'Denkmal fertig'`;
  ohne Anbindung und bei `paused` ok.
- **AK-M13E2-07** Werfen nie: drei Aktionen mit `good` ∈ {`'stone'`, `'wood'`, `''`, 0, `null`, `undefined`, `{}`} ×
  Wert ∈ {`true`, `false`, `'ja'`, 1, `undefined`}, mit und ohne Denkmal → immer `Result`, Gründe nach R4; bei `ok:
false` `serialize(w)` und RNG-Zustand unverändert.
- **AK-M13E2-08** Zug aus dem Lager (Anhang 01 B): Stein 23, Start 1000 → Züge 1010/1020/1030, Stein 20, geliefert
  3; 1040 nichts; dazwischen keine Änderung; Start 1005 → erster Zug 1010; Reihenfolge Stein vor Glas bei Geld für ein
  Stück.
- **AK-M13E2-09** Reserve: jede Zeile Anhang 01 A exakt; unversorgte Häuser und Fremdinsel-Häuser zählen nicht; eine
  Glashütte ändert die Stein-Reserve nicht; die Sperrbestand-Funktion (R6.1) liefert für alle vier Güter 0. Die
  Kopplung «Sperrbestand 40 → Reserve 40» ist kein E2-AK, sondern Fall K1 mit Eigentümer I-049 (Anhang 08 A).
- **AK-M13E2-10** Reserve hält (Aufbau Anhang 08 B.1: 80 versorgte Kaufleute, vor jedem Schritt gehalten; Glas 80,
  Gewürz 64): vor dem ersten Schritt Reserve Glas = Gewürz = 64; 200 Schritte; in jedem Schritt, in dem `delivered[g]`
  gestiegen ist, gilt danach `stock[g] ≥ monumentReserve(w, g)` (Muster AK-20; Hausverbrauch darf den Bestand zwischen
  den Zügen darunter senken, R6.3); Glas geliefert 1 … 16, Gewürz geliefert 0.
- **AK-M13E2-11** Zukauf: Lager auf Reserve, `buy.stone` → je Zug Geld −15, geliefert +1; mit Handel −12; `money 14`
  → kein Kauf; `buy` aus → nichts; Lager 25 → erst fünf Stück aus dem Lager ohne Geld; `kontorId = null`
  (synthetisch) → kein Kauf. Der gezahlte Betrag je Stück ist `buyPrice(w, g, 1)` vor dem Zug (Vergleich, kein Spy, tech A5).
  Zukauf-Funktion R7.3 direkt: `money` = Preis → liefert 1, Geld 0; `money` = Preis − 1 → liefert 0, `serialize`
  unverändert; Lager und `sellPct` je unverändert.
- **AK-M13E2-12** Vollzukauf exakt (Lauf A, `balance-monument.test.ts`, Anhang 03 B): fertig bei 3000, 5000, 7000;
  Geld gegenüber Zwilling −64 200, mit Handel −54 960 (Kaufanteil 100, R489; Krisen aus).
- **AK-M13E2-13** Abschluss: letzter Rest → im selben Tick `running false`, `stage +1`, `delivered` 0; nach Abschnitt 3
  `monumentDone true`, `won`/`wonMerchants`/`wonSpice` unverändert; alle Reste 0 und `paused` → Abschluss im nächsten
  Tick.
- **AK-M13E2-14** Kein Zug bei `paused`, ohne Weg, `!running`: 100 Schritte ohne Änderung an Lager, Geld (ausser
  Unterhalt), `delivered`; Fortsetzen bzw. Weg → Zug ab dem nächsten Zug-Tick.
- **AK-M13E2-15** Abriss im laufenden Abschnitt 2 → `monument null`, Geld +250, Holz +5, Stein +5, sonst nichts;
  `monumentDone` bleibt (`true` und `false`); Neubau `stage 0`.
- **AK-M13E2-16** Zufall und Krise: `fireTarget` wählt nie das Denkmal; zwei Kopien mit laufendem Abschnitt 1 (Stein aus dem Lager,
  übrige Güter per Zukauf, Aufbau Anhang 08 B.2) über 1000 Schritte → `serialize` gleich; `tickMonument` ändert den RNG-Zustand nie.
- **AK-M13E2-17** v11-Stand mit `wonMerchants true` (Anhang 02 E) lädt, `canPlace` sofort ok.
- **AK-M13E2-49** Speichern/Laden mitten im Abschnitt (qa B1, Anhang 08 B.2): Speichern bei Tick 1007, 1010, 1013 und
  pausiert bei 1025, Laden, weiter bis Tick 1500 → `serialize` gleich dem ununterbrochenen Zwilling; jeder Fall enthält
  Lieferungen aus dem Lager und per Zukauf.

### 10.2 Vitest Seed-Läufe, Baseline, Save

AK-M13E2-18 bis -20: Anhang 03 A (Festwerte vor dem Merge, Timeouts, Zeitreserve-Regel, Phasen einmal je Datei).

- **AK-M13E2-18** Lauf B (Anhang 03 C): ab K′-arm-Stand T0 = 11 800, 6000 Ticks → geliefert je Gut, Endbestand,
  Kaufleute als Festwerte; Hochrechnung nach Anhang 03 C; README-Satz folgt dem Messwert. Ab T0 kein Controller (Anhang 03 C); erst
  messen, dann pinnen, Grenzverletzung = Ruling-Stopp (Anhang 03 A).
- **AK-M13E2-19** Lauf C (Anhang 03 D): Abschnitt 1 fertig bei t₁ mit 4704 ≤ t₁ − t_s ≤ 8736 (11,2 min ± 30 %,
  O11); Festwert t₁; Verfehlen = Pflicht-Rulingpunkt.
- **AK-M13E2-20** Reserve im Referenzstand (Anhang 03 C, K′-Stand mit Glas und Gewürz auf Reserve + 10): nach jedem
  Schritt, in dem Glas oder Gewürz aus dem Lager geliefert wurde, gilt `stock[g] ≥ monumentReserve(w, g)`; geprüfte
  Fälle > 0 (C.3: Ziel 3 verschiebt sich nicht).
- **AK-M13E2-21** Baseline: drei Balancing-Tests grün; `git diff main -- 'tests/sim/balance*.test.ts'
tests/sim/e0Pins.ts tests/sim/e1Pins.ts tests/sim/seePins.ts` ohne Änderung (neue Datei ausgenommen).
- **AK-M13E2-22** Hash-Pins grün ohne Pin-Änderung; `foldBackToV11` (`tests/sim/helpers.ts`): v12 ohne Denkmal →
  v11-Form ohne `monument`, `monumentDone`, `JSON.stringify` gleich einem v11-Stand; Zusatzschlüssel mit Neutralwert werden entfernt, die
  Reihenfolge der übrigen bleibt: Insel mit `reserve: { wood: 0, stone: 0 }` und Welt mit `buyPct` (alle 100) am Ende
  ergeben dieselbe Form; eine Insel mit abweichender Schlüsselfolge behält ihre Folge; mit `monument`, `monumentDone
true` oder Gebäude `monument` → wirft.
- **AK-M13E2-23** Rundlauf v12 (Anhang 02 F) ok, tief gleich.
- **AK-M13E2-24** Migration v11 → v12 und Kette v1 … v11 → `version 12`, `monument null`, `monumentDone false`.
- **AK-M13E2-25** Ladeprüfung: Fälle 25a–25k aus Anhang 02 F, jeweils genau das genannte Ergebnis, ohne Ausnahme.
- **AK-M13E2-26** Inkompatibel (`tests/sim/save-v12.test.ts`): `version 13` → `'Unbekannte Version'`, abgeschnitten →
  `'Ungültiges Format'`, kein Wurf; `friendlyReason` je nicht leer.

### 10.3 Vitest UI und Render

- **AK-M13E2-27** `monumentRows` nach Anhang 07 A (u. a. «Glas 84 / 140», `pct 60`, «Reserve 64», «zukaufen (50 /
  Stück)», mit Handel 40; Vorschau «Glas 0 / 140»).
- **AK-M13E2-28** `monumentStartState`: «Abschnitt 1 beginnen (4000)»; `money 100` → nicht gesperrt, Grund `'Zu wenig
Geld'`; `running`/`stage 3` → unsichtbar; Stufe 2 → «Abschnitt 3 beginnen (8000)».
- **AK-M13E2-29** `monumentEtaText`: frisch «frühestens fertig in 3:20»; Rest 56 «… in 56 s»; ohne `running` `''`.
- **AK-M13E2-30** `monumentStallReason`: je ein Fall der fünf Gründe in Vorrang-Reihenfolge, `null` bei Lieferung.
- **AK-M13E2-31** Ziel-Chip (`tests/ui/goal.test.ts`): vor `wonSpice` gleich wie heute; danach vier Fälle U-8, u. a.
  Σ 414 / 520 → «Denkmal 2/3 · 79 %».
- **AK-M13E2-32** `monumentChronicleLine` und `monumentStageLine`: Texte Anhang 07 B, vor `wonMerchants` `null`.
- **AK-M13E2-33** `monumentEvents`: 0 → 1 ein Eintrag «Denkmal: Abschnitt 1 fertig» (`info`); 2 → 3 mit
  `monumentDone` → zwei Einträge in dieser Reihenfolge; gleicher Stand und Abriss → leer. `diffSoundEvents` liefert das
  Glocken-Ereignis genau beim Übergang `monumentDone` false → true, nicht nach dem Laden.
- **AK-M13E2-34** `monumentNeedsConfirm` und Zwei-Klick-Zustand (R483): Stufe 0 ohne Lauf `false`, laufend `true`,
  `stage 1` laufend und nicht `true`, anderes Gebäude `false`; Zustandsfälle C1–C7 aus Anhang 08 C (Klick, `Entf`,
  `Backspace`, Rücksetzen, anderes Gebäude per Taste sofort, Abriss-Werkzeug überspringt); `friendlyReason` aller Gründe U-7 wörtlich, Geldgrund «Zu wenig Geld: 4000 nötig, 100 vorhanden».
- **AK-M13E2-35** Bauleiste (`tests/ui/buildMenu.test.ts`): `tierPreviewLine('monument') === null`; Tooltip-Zeile
  U-6; `lockedToolText` vor Ziel 2 → «Denkmal: Erst nach dem Kaufleute-Ziel».
- **AK-M13E2-36** Bildstufe und Sprite (`tests/render/`, `fakeCtx.ts`): `monumentImageStage` für alle sieben
  erreichbaren Paare (`stage`, `running`) aus Anhang 06 A; fünf Stufen ergeben fünf verschiedene Aufzeichnungen;
  Höhenmass H(s) nach Anhang 06 C: streng steigend, H(4) in [2,8; 3,0], jede Stufe in ihrer Hülle; Stufe 4 höher als
  die Amtsstube (H und `bodyHeight`); seitlich in der 3×3-Rautenbreite; `drawGhost` zeichnet Stufe 4.
- **AK-M13E2-37** Picking (`picking.test.ts`): jede der neun Kacheln und die Spitze der Stufe 4 liefern die Id, neben
  der Hülle nicht; die Hülle wächst mit der Bildstufe.
- **AK-M13E2-38** Tiefensortierung (`iso.test.ts`): Haus davor (grössere `x + y`) und Baum dahinter → Denkmal
  dazwischen; Nachbar an der unteren Ecke.
- **AK-M13E2-39** Cache und Grenzen: `spriteKey` ändert sich mit der Bildstufe, fehlende Stufe = 0, Audit-Kommentar
  nennt sie; Eintrag bei Zoom 2, DPR 2 ≤ `SPRITE_MAX_BYTES`; Effekt U-12 hält `CAPS`, endet nach ≤ 3 s, entfällt bei
  reduzierter Bewegung; Render-Durchlauf lässt `serialize` gleich. Alle übrigen Gebäude: `bodyHeight`, `bodyHull`,
  `spriteKey` ohne Bildstufe gleich wie mit Bildstufe 0; bestehende Render-Tests ohne Änderung grün (qa B7d).

### 10.4 Browser (qa-playtester, Headless-Chrome)

Screenshots `.studio/qa/m13-e2/<ak>-<breite>x<höhe>.png`, 1280×720 und 1920×1080. Ausgangsstände: benannte Szenario-Stände je AK
aus Anhang 08 D (Seed 3, erzeugt in `tests/sim/scenarios.ts`, geladen wie die übrigen Browser-Szenarien).

- **AK-M13E2-40** Vor Ziel 2 «Öffentlich» ohne Denkmal; mit Ziel 2 Denkmal mit Tooltip U-6; Vorschau 3×3 mit Bild
  Stufe 4 (grün frei, rot auf Fremdinsel mit Grund); Bau → Bauplatz, Geld −500.
- **AK-M13E2-41** Panel: vier Gut-Zeilen mit Reserve und Schalter, Knopf «Abschnitt 1 beginnen (4000)»; Klick → Geld
  −4000, Bild wechselt auf Sockel mit Gerüst, Balken füllen sich, «frühestens fertig in …» zählt; «Bau pausieren» →
  Grund «Bau pausiert»; kein waagrechtes Scrollen.
- **AK-M13E2-42** Zukauf Stein bei Lager auf Reserve → Geld −15 je Sekunde, Balken steigt; ohne Weg «Nicht angebunden».
- **AK-M13E2-43** Abschnitt fertig (Zeitraffer, Vollzukauf): Meldung «Denkmal: Abschnitt 1 fertig», Bild Terrassen,
  Chip «Denkmal 1/3», Chronik-Zeile.
- **AK-M13E2-44** Wahlziel (Stand `m13e2-abschnitt3-rest` nach Laden: `stage 2`, Abschnitt 3 bis auf 1 Stück je Gut): Banner «Wahlziel erreicht: Das
  Denkmal steht!», Aufflammen und Glocke einmal, Bild Stufe 4, Chip «Wahlziel erreicht»; nach Laden kein Banner, kein
  Effekt.
- **AK-M13E2-45** (R483) Stand `m13e2-abschnitt1`: erster Klick, `Entf` bzw. `Backspace` zeigt «Wirklich abreissen?
  Fortschritt geht verloren», `Esc` setzt zurück, zweiter reisst ab; Abriss-Werkzeug meldet «Denkmal nur im Panel
  abreissen»; ein Haus per `Entf` ist sofort weg, ohne Bestätigung. Stand `m13e2-bauplatz`: Denkmal per `Entf` sofort weg.
- **AK-M13E2-46** Bild je Stufe 0–4 bei Standard-Zoom, Tag, Nacht, Regen (`46-s<n>-<licht>-<b>x<h>.png`); Stufe 4 aus
  Standard-Zoom als höchstes Bauwerk der Heimat erkennbar, nachts Leuchtfeuer.
- **AK-M13E2-47** Slot mit `version 13`: Hinweis «Unbekannte Version», Spiel läuft, keine Konsolenfehler.
- **AK-M13E2-48** 800×600 mit offenem Denkmal-Panel: keine Überlappung, keine Konsolenfehler.

## 11. Berichtigungen der E1-Spec (R466 (1), Beobachtung M13-E1)

Neufassung AK-M13E1-36, Ergänzung AK-M13E1-14 und die mechanischen Anpassungen (AK-M13E1-01, -26, -41) stehen
unverändert in [Anhang 08 F](2026-10-10-m13-e2-denkmal-design/anhang-08-nachtrag-gate.md) (Platz, R167).

## 12. Doku-Folgen

README (Abschnitt «Denkmal» unter Ziel, Inselchronik, Satz aus Lauf B) und `docs/arc42.md` (Bausteine, Tick-Ablauf,
Persistenz v12): [Anhang 05](2026-10-10-m13-e2-denkmal-design/anhang-05-doku-folgen.md). Kein ADR nötig.

## 13. Offene Punkte (mit Empfehlung)

- **P-1 bis P-3:** entschieden in R483 nach Empfehlung (Bestätigung ab Abschnitt 1; Bauplatz-Erstattung wie üblich;
  Lauf C in der synthetischen R-Welt). Zukauf und I-048: R489 (R7.1, R7.3).
- **P-4 Gerüst-Animation:** nach Playtest (S-Paket Grafik).
- **P-5 Feinwerte E3:** Mengen ±30 % nur über `MONUMENT_STAGES` (O11), mit Ruling und grünem Lauf C.

**Playtest-Frage (ab Ziel 2):** Findet der Spieler das Denkmal ohne Hilfe und wählt er je Gut bewusst Erzeugung oder
Zukauf?

## 14. Zuordnung R452 / R466

O2, O6, O7, O8, O11, B3, R466 (1), (2), R476, R477: [Anhang 04](2026-10-10-m13-e2-denkmal-design/anhang-04-zuordnung-r452-r466.md).

## 15. Grössenschätzung

**M** (Vorschlag §9 ≈ 200): M13-E2-SIM ≈ 100 Tools (3×3-Gebäude, Zustand, Zug, Save v12, Seed-Läufe), M13-E2-ART ≈ 55
Tools (Sprite fünf Bildstufen, Bildstufen-Funktion, Cache-Schlüssel, Picking, Sortierung, Effekt; Maler ab Gate Spec,
Einhängen nach dem Def-Kern, R489/tech B2), M13-E2-UI ≈ 70 Tools (Panel, Chip, Chronik, Log, Glocke, Bestätigung, README, arc42); ≈ 225. Risiko mittel:
erstes 3×3-Gebäude, Save-Reihenfolge (M13-E2-SIM vor I-049-Sim, I-049 erweitert v12 nur um Migration und
Ladeprüfung; I-048 nach Plan), Lauf C an der Spanne.
