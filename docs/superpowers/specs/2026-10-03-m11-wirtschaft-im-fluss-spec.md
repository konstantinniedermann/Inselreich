# M11 „Wirtschaft im Fluss" — Design-Spec

Datum: 2026-10-03 · Paket M11-SPEC · Meilenstein M11 · Status: **Spec, Entwurf zum Gate Spec** · Prozessstufe voll
(Baseline-Bruch, Save v6)

Grundlage: [Vorschlag M11](2026-10-03-m11-wirtschaft-im-fluss-design.md) (Anhang 01 Bilanzen, 02 Messprobe);
Rulings **R185** (A1–A14) und **R187** (Gate Spec, A15); [S12-Design](2026-10-03-s12-ausbau-design.md) (R171, für P3
verdichtet); [M10-Spec](2026-10-03-m10-schritt-fuer-schritt-spec.md); [Hauptspec](2026-09-29-inselreich-design.md).

Anhänge (`2026-10-03-m11-wirtschaft-im-fluss-spec/`):
[01](2026-10-03-m11-wirtschaft-im-fluss-spec/anhang-01-werte-und-ablauf.md) Werte je Zieldatei, Typen, Funktionen,
Tick-Ablauf, Texte; [02](2026-10-03-m11-wirtschaft-im-fluss-spec/anhang-02-baseline-und-pruefung.md) Baseline, rote
Tests, Fixture, Szenen; **03** (`anhang-03-messauflagen.md`) Messauflagen und Sollwerte.

Kennzeichnung wie M10: **Setzung Spec** (neu gesetzt), **Abweichung** (vom Vorschlag, Übersicht 13), **Änderung**
(an Hauptspec, arc42, früheren AK; Übersicht 12), **M10-Schnittstelle** (setzt auf M10 auf: Save v5,
`defs/unlocks.ts`, `tickUnlocks`, `functionLock`, `deriveUnlocks`, `normalized()`, `noService`; Stand
`feat/m10-ui`, gilt nach dem M10-Merge). **M-nn** = gemessener Sollwert aus Anhang 03 (Tabelle 14).

Code-Stand der Prüfung: `main` 1c7d587 (Save v4); alle genannten Ist-Namen existieren dort (13-8).

## 1. Ziel

**Spielerzweck:** „Mein Geld fliesst stetig, ein Defizit bremst den Aufstieg, und ich wähle, woher meine Nahrung
kommt und wie ich meine Betriebe ausbaue."

- **Fühlen:** Die Kasse zählt je Tick hoch statt in Schüben alle 10 s; jeder Betrieb zeigt Zyklus (Ring) und
  Auslastung; wer mit Defizit aufsteigen will, wird gebremst und liest warum.
- **Entscheiden:** Nahrung von Küste, Wald oder Weide; mit Defizit aufsteigen (doppelte Wartezeit) oder erst Ketten;
  Neubau oder Ausbau; Stein für Glas oder Aufstieg.
- **Zeitbild** (Referenzlauf, M-11): Ring und Fluss ab Sekunde 1; Jagdhütte mit U2 (Tick 150, 0:15 min),
  Rinderfarm und Ausbau Stufe 2 mit U3 (Tick 350, 0:35 min), Stufe 3 mit U5 (Tick 4150, 6:55 min). Die ersten 15 min
  enthalten eine Nahrungswahl und einen ersten Ausbau.

## 2. Scope

### 2.1 Muss

- **M1** S10 Buchung je Tick mit Übertrag, Neupin (P1, 3.1, 6) · **M2** Dämpfung prospektiv, `flow.ts` (P1, 3.2) ·
  **M3** Save v6 (P1, 5)
- **M4** Jagdhütte · **M5** Rinderfarm und Regelfeld `free` (P2, 3.3) · **M6** Wald live, `noForest` (P2, 3.4) ·
  **M7** Auslastung `eff` (P2, 3.5)
- **M8** Ausbau Stufe 2 und 3 für 11 Betriebe (P3, 3.6) · **M9** R161-Hinweis (UI, 3.7) · **M10** Freischaltung U2,
  U3, U5 (P1, P2, 4)
- **M11** Bedienung (UI, 7) · **M12** Silhouetten, Stufen-Aufsatz, Marke, Ring (RND, 8) · **M13** Szenarien, README,
  arc42 (B1, 12)

### 2.2 Kann und Streichreihenfolge

**K1** Zonen-Overlay zeigt bei `free` nur freie Kacheln. **K2** Strg-Klick „alle gleichen Betriebe im Radius
ausbauen" (S12 3.5). **K3** B1-Szenario „Jagdhütten statt Fischer" (Sieg, `minMoney` ≥ 0). AK für K1–K3 entstehen
erst bei Aufnahme (Plan). **Streichen:** K3, K2,
K1; dann Auslastung in Prozent → nur Zustandssymbol (`eff` entfällt aus Save und AK-P2S4); dann Rinderfarm; dann
Ausbau Stufe 3. **Nicht streichbar:** S10, Dämpfung, Jagdhütte, S3, Save v6.

### 2.3 Ausdrücklich nicht in M11

Zweites Nahrungsgut (S2 B); Wildbestand; Erschöpfung und Nachwachsen von Wald; Live-Prüfung für Weide (Gras nur beim
Bau); exklusive Zonen; Glashütten-Reserve (R161 Variante 2, verworfen); Eingangssperre (Backlog); Ausbau von
Wohnhäusern, öffentlichen Gebäuden, Markt, Kontor; Rückbau, Stufe 4, Bauzeit, Ausbau-Hotkey; Arbeiter; neue Güter;
Lager je Insel, zweite Insel (M12); Erlasse; Interpolation des Kontostands; neue HUD-Einheit; Controller baut im
Referenzlauf neue Gebäude oder aus.

## 3. Regeln

### 3.1 P1 — S10 Fluss (Variante b)

Werte und Verträge: Anhang 01 A.1, A.2, C, D.

- **Steuer** (`tickTaxes` in `population.ts`): je Schritt `taxCarry += taxUnits(world)`, `taxUnits` = (Σ Häuser
  EW × `tier.tax` × (`allNeedsMet` ? 2 : 1)) × `pct` (Ganzzahl; `pct` 70/100/130). Gebucht wird
  `n = floor(taxCarry / 20000)`: `money += n`, `taxCarry −= n × 20000`. Teiler `TAX_CARRY_DIVISOR` =
  `UPKEEP_INTERVAL` × 100 × `TAX_UNIT` in `defs/tiers.ts` (Abweichung 13-1).
- **Unterhalt** (`tickEconomy` in `economy.ts`): `upkeepCarry += totalUpkeep(world)` (Σ `upkeepOf(b)`), gebucht
  `n = floor(upkeepCarry / 100)`: `money −= n`, `upkeepCarry −= n × 100`.
- **Invarianten:** nach jedem Schritt `taxCarry` 0 … 19 999, `upkeepCarry` 0 … 99, ganzzahlig. Bei festem Zustand
  bucht die Steuer in 100 Schritten genau `taxUnits / 200` abgerundet (Rundungsverlust < 1 statt bis 5 je Minute).
  `stats.taxes` (= `totalTaxes`) und `stats.upkeep` bleiben Nominalwerte je 100 Ticks für die HUD-Bilanz.
- **Beispiel:** 20 Siedlerhäuser à 8 EW, erfüllt, „normal": `taxUnits` 224 000 → je Schritt +11, jeder 5. +12,
  nach 100 Schritten +1120 (wie heute); „niedrig" +784; 10 von 20 unerfüllt +840.
- **Reihenfolge in `step` unverändert** (Anhang 01 D); Buchung in jedem Schritt statt bei `tick % 100 === 0`. Kein
  Zufall, keine Gleitkommazahl im Zustand. Der Ton `coin` bleibt im 100-Tick-Takt (**Setzung Spec**).
- **Naht für P2 ∥ P3** (Setzung Spec, Abweichung 13-4): P1 legt `src/sim/levels.ts` (`cycleOf`, `upkeepOf`,
  `utilization`) und eine leere `defs/levels.ts` an und ersetzt jeden Lesezugriff auf `def.cycle`/`def.upkeep` in
  `src/sim/` und `src/render/errands.ts` (bitgleich ohne `level`).

### 3.2 P1 — Gedämpfter Aufstieg

- **Regel:** `wait` = `TAX_LEVELS[taxLevel].upgradeWait` × (Defizit ? `UPGRADE_DEFICIT_WAIT_FACTOR` : 1), Faktor 2
  (`defs/timing.ts`): normal 300 → 600, niedrig 150 → 300, hoch bleibt ohne Aufstieg. Kein Verbot.
- **Defizit (prospektiv):** ein Gut g der Zielstufe mit `budget[g] − Δ[g] < −1e-9`; Δ[g] = maxEW(Ziel) × Rate
  Ziel − EW × Rate jetzt (0, wenn g heute kein Bedarf). Δ: 1→2 Nahrung 2,0, Stoff 1,6; 2→3 Nahrung 3,5, Stoff 1,4,
  Rum 3,0; 3→4 Nahrung 2,5, Stoff 1,0, Rum 1,0, Glas 2,0 (Abweichung 13-2).
- **Budget:** im Wachstumstakt (`tick % 50 === 0`) einmal vor der Häuserschleife `budget = goodsBalance(world)`
  (net, nominell: Brand, Sturm, Lagerstand zählen nicht, R115). Jeder **erfolgreiche** Aufstieg zieht sein Δ ab;
  spätere Häuser (Id aufsteigend) sehen das Rest-Budget. Bilanz genau 0 nach Δ dämpft nicht.
- **Nicht im Budget:** Einmalkosten (Aufstieg, 1 Einheit je neuem Gut, Ausbau-Gebühr). Mehrausstoss eines Ausbaus
  zählt ab dem nächsten Wachstumstakt.
- **Modul** `src/sim/flow.ts` (neu): `goodsBalance` zieht dorthin (Versorgung über `inSupplyRange` aus `supply.ts`;
  `queries.ts` re-exportiert), dazu `upgradeDelta`, `deficitGood`, `upgradeDeficit`. `flow.ts` importiert weder
  `population.ts` noch `queries.ts` (Importzyklus).
- `upgradeStatus` nennt die wirksame Zahl („… noch nicht 600 Ticks erfüllt"); die UI übersetzt (7). Rückfall bei
  Irrtum: Faktor 1 (= heute).

### 3.3 P2 — S2 Jagdhütte und Rinderfarm (Variante A, Gut `food`)

| Feld (`defs/buildings.ts`)  | `hunter` Jagdhütte            | `cattlefarm` Rinderfarm      | Fischer (Ist)  |
| --------------------------- | ----------------------------- | ---------------------------- | -------------- |
| Grösse, `cost` G/H/W/S      | 1×1, 50/2/1/0                 | 2×2, 250/15/3/0              | 1×1, 100/5/2/0 |
| `upkeep`, `cycle`           | 5, 50 (2,0 je 100 Ticks)      | 10, 20 (5,0)                 | 5, 40 (2,5)    |
| `site` (`radius`)           | 3, `forest`, `min` 10, `free` | 3, `grass`, `min` 16, `free` | `coast`        |
| `stormAffected`/`flammable` | nein / ja                     | ja / ja                      | ja / ja        |
| EW je Bau; Geld je EW/6000  | 4; 87,5                       | 10; 85                       | 5; 80          |

- Kein Eingang. In `BUILDING_DEFS` direkt nach `fisher` (Bauleiste, Setzung Spec).
- **`free?: true`** an `SiteRule` `radius`: Es zählen nur Kacheln mit dem Terrain, `buildingId === null`, ohne Weg
  und **ausserhalb des eigenen Grundrisses** (Setzung Spec: Bau- und Live-Prüfung zählen gleich). Ohne `free` zählt
  die Regel wie heute (Schäferei, Plantage bitgleich). Zonen dürfen überlappen. Gründe: „Zu wenig freier Wald in
  der Nähe" / „Zu wenig freie Weide in der Nähe".

### 3.4 P2 — S3 Holzfäller braucht Wald (live)

- **Variante A:** `lumberjack.site` erhält `free` (Radius 2, `min` 1); A9 belegt (Anhang 03 B: Referenz-Layout
  bitgleich). **Rückfall Variante C:** Bau-Regel unverändert, die Live-Prüfung
  zählt bei Wald-Regeln nur freie Kacheln.
- **Live je Schritt** in `tickProduction` nach `burning`, `notConnected`, M10 `noService`, vor dem Sturm-Aussetzer:
  verletzte `radius`-Regel mit `terrain: 'forest'` → `state = 'noForest'`; kein Fortschritt, keine Entnahme,
  `progress` bleibt, Unterhalt läuft. Erfüllt → nächster Schritt läuft weiter. Gilt für Holzfäller und Jagdhütte.
- Roden (M10, 10 Geld) liefert kein Holz; Aufforsten 20 (M10; Abweichung 13-6). Jagdhütte per Aufforsten 250 gegen
  Fischer 100: nicht dominant.

### 3.5 P2 — S4 Auslastung

- `Building.eff` (nur Betriebe mit `produces`): Ganzzahl-Akkumulator 0 … 256 000 (`EFF_WINDOW` × `EFF_MAX`); fehlt
  = 256 000. Anzeige `utilization(b)` = `floor(eff / 256)` in Promille 0 … 1000 (Abweichung 13-3).
- Je Schritt in **jedem** Zweig von `tickProduction`: `eff ← eff − floor(eff / 256) + Ziel`. Ziel 1000, wenn
  `progress` in diesem Schritt stieg und danach `state === 'ok'`; sonst 0 (in Prüfreihenfolge `burning`,
  `notConnected`, `noService`, `noForest`, Sturm-Aussetzer, `waitingInput`, `storageFull`).
- Nachgerechnet: Beharrung `ok` bleibt 256 000 (1000 ‰); Ziel 0 ab 1000 ‰: nach 256 Schritten 367 ‰, nach 1913
  genau 0; Ziel 1000 ab 0: nach 1913 genau 1000 ‰; Dauersturm 499–501 ‰; 300-Tick-Sturm 1000 → 655 ‰ (erster
  Sturmtick ungerade wie im Ist, `from` = Periodenstart + 201; bei geradem 654 ‰).
- Geld und Waren hängen nicht an `eff`. Gespeichert: Wiederladen = durchgelaufene Welt.

### 3.6 P3 — S12 Ausbau (verdichtet; Werte Anhang 01 A.4)

- **Betriebe:** alle 11 mit `produces` (9 heute, `hunter`, `cattlefarm`); Stufen 1, 2, 3. Je Stufe ändern sich nur
  `cycle` (≈ ×0,6 / ×0,4), `upkeep` (×1,3 / ×1,7, gerundet), Kosten (50 % / 75 % der Baukosten) und Gebühr (Stufe 2
  Stoff, Stufe 3 Rum; 2 oder 3 Einheiten). Fläche, Radius, Eingang je Zyklus bleiben (Verarbeiter ziehen schneller:
  Kette gemeinsam ausbauen).
- **Ort:** `LEVELS` in `src/sim/defs/levels.ts`, Schlüssel `defId` (Abweichung S12 3.1, R185 A8). `Building.level?:
2 | 3`, fehlt = 1.
- **`upgradeBuilding(world, id)`** (`src/sim/upgrade.ts`, neu) → `{ ok, reason }`, wirft nie. Prüfreihenfolge:
  (1) „Gebäude nicht gefunden"; (2) ohne `LEVELS`-Eintrag „Kann nicht ausgebaut werden"; (3) Stufe 3 „Höchste Stufe
  erreicht"; (4) `functionLock(w, 'upgrade2' | 'upgrade3')` → `lockText` (M10-Schnittstelle); (5) `outageUntil` →
  „Gebäude brennt"; (6) `checkAfford(cost)`; (7) Gebühr fehlt → „Zu wenig Stoff" / „Zu wenig Rum". Erfolg: `pay`,
  Gebühr aus dem Lager, `level` +1; `progress` und `eff` bleiben; `progress ≥ cycleOf` schliesst im nächsten Schritt
  ab. Bei `fail` bleibt die Welt gleich. Anbindung ist keine Bedingung (Setzung Spec).
- **Abriss:** `refundCost(paidCost(b))` = 50 % abgerundet von Bau- plus bezahlten Stufenkosten, ohne Gebühr.
  Fischer Stufe 3: bezahlt 225/12/5/0 → Erstattung 112/6/2/0.
- Unterhalt über `upkeepOf` durch den Übertrag; Brand: 200 Ticks Ausfall, Stufe bleibt. Holzfäller und
  Jagdhütte bewusst R > 1,4 (Neubau bleibt dort der Weg).

### 3.7 R161 — nur Sichtbarkeit

Keine Sim-Änderung, keine Reserve, Testhelfer-Stein bleibt. Haus-Panel: Grund „Zu wenig Stein" und ≥ 1 Glashütte →
Zusatzzeile „Die Glashütte verbraucht ebenfalls Stein — baue weitere Steinbrüche." Die Glashütte ohne Stein zeigt
den Ist-Text „Wartet auf Stein" (Abweichung 13-5) und sinkende Auslastung; die Lager-Bilanz zeigt Stein negativ.

## 4. Freischalt-Einbindung (M10-Schnittstelle)

- `defs/unlocks.ts`: U2 `buildings` + `hunter` (P2); U3 `buildings` + `cattlefarm` (P2), `functions` + `upgrade2`
  (P1); U5 `functions` + `upgrade3` (P1). Auslöser unverändert (U2 `tierWish` 2, U3 `tierReached` 2, U5
  `tierReached` 3); die Kette U2 → U3 hält die Rinderfarm hinter der Schäferei.
- `UnlockFunction` + `'upgrade2' | 'upgrade3'`; `FUNCTION_LABELS` „Ausbau Stufe 2" / „Ausbau Stufe 3"; je ein
  Tipp-Satz (Anhang 01 A.5). `deriveUnlocks`: Betrieb mit `level ≥ 2` → U3, `level 3` → U5 (ohne Kette, Setzung
  Spec).
- **Folge für M10-Tests (Änderung):** M10:AK-S1-01 (jedes Gebäude, jede Funktion in genau einem Eintrag), Zählung
  M10 11.1 (Produktion U0+U2 6, +U3 7, +U4 9, +U5 10, +U6 11, „Alles frei" 11), Meldungen U2/U3/U5. Der Controller
  baut die neuen Gebäude nie; Freischalt-Ticks ändern nur S10 und Dämpfung (M-11).

## 5. Datenmodell und Save v6

Typen: Anhang 01 B. `World.version 6`, `taxCarry`, `upkeepCarry`; `Building.eff?`, `Building.level?: 2 | 3`;
`BuildingState` + `'noForest'`; `SiteRule.free?: true`; `BuildingDefId` + `'hunter' | 'cattlefarm'` (P2);
`UnlockFunction` + `'upgrade2' | 'upgrade3'`. `createWorld`: Überträge 0, kein `eff`, kein `level`.

- `SAVE_VERSION = 6`; Kette v1 → … → v5 (M10-Schnittstelle) → **`migrateV5ToV6`**: `taxCarry 0`, `upkeepCarry 0`,
  `version 6`; `eff`/`level` fehlen (= 256 000 bzw. Stufe 1). `deserialize` wirft nie; `version` ≠ 6 nach der Kette
  → „Unbekannte Version".
- **`isWellFormed` zusätzlich** (sonst „Beschädigter Spielstand"): `taxCarry` Ganzzahl 0 … 19 999; `upkeepCarry`
  0 … 99; `eff` nur an Betrieben mit `produces`, Ganzzahl 0 … 256 000; `level` nur bei `LEVELS`-Eintrag, 2 oder 3;
  `state` aus der `BuildingState`-Liste (Setzung 13-7).
- **Fixture** `tests/sim/fixtures/save-v5.json` (Controller Seed 3, Krisen „normal" + Feuerwache, Tick 2650 im
  Sturm), erzeugt auf `main` nach M10-Merge vor P1 (Anhang 02 E). v4 (M10-Fixture) lädt durch die Kette.
- Wiederladen im Sturm (`balance-crises` M6:AK-B2-06) wird mit gespeicherten Überträgen wieder bitgleich (Pflicht).

## 6. Bitgleichheit und Baseline

- **Bricht** (bewusst, R185): Geldverlauf und Siegtick durch S10 und Dämpfung. **Bleibt:** S2, S3 (wenn A9 hält),
  S4, S12, R161; der Controller baut weder Jagdhütte, Rinderfarm noch aus und rodet nie (Anhang 02 A).
- **Ursache** (Auflage 1): Steuer aus dem Tick-Mittel statt dem Stand am Buchungstick; Zerlegung M-13.
- **Fingerabdruck:** `normalized()` (M10-Fassung) entfernt zusätzlich `taxCarry`, `upkeepCarry`, je Gebäude `eff`,
  `level`.
- **Haupt-Pins** (Anhang 02 C): Siegtick, `minMoney`, `endMoney` (M-01 bis M-03, dazu M-04, M-07, M-08, M-10, M-11).
  Weicht einer bei der Umsetzung ab → nicht nachstellen, Meldung an L0 (R74). **Neupin mit Beleg** (kein R74-Fall):
  Gebäudezahlen (M-05) und Fingerabdruck (M-06) werden in P1 auf dem Code mit Überträgen und M10-`normalized()` neu
  gemessen und mit Messbefehl und Commit im Testkommentar gepinnt; der Anhang-03-Wert ist nur Richtwert. Schwellen
  bleiben: Sieg ≤ 7500 (`WIN_TICK_LIMIT`), „normal" ≤ 8000 (`CRISIS_WIN_STOP`), Ziel 2 ≤ 12 000, Endgeld > 0.
- **Rote Tests** nach P1: Messprobe 14 von 304 (4 exakte Pins inkl. Wiederladen im Sturm, 10 Unit-Tests auf den
  100-Tick-Takt in `economy`, `taxes`, `merchants`, `fire`, `population`); nach M10 plus Freischalt-Pins (M-12).
  Liste und Umschreib-Muster: Anhang 02 D. Kein Test wird gelöscht.
- **A13:** „Controller baut 3 statt 5 Brennereien" wird mitgemessen (M-05), nicht korrigiert.

## 7. Bedienung (UI-Welle, `src/ui/`)

- **Kontostand** `data-field="money"` je Frame aus `world.money` (Ist: `updateHud` je Frame), ohne Interpolation.
- **Bilanz** „/ min" höchstens alle 500 ms neu: Helfer `balanceDue(nowMs, lastMs)`, Darstellungskonstante
  `BALANCE_REFRESH_MS = 500` in `src/ui/`.
- **Betriebs-Panel** (`inspect.ts`): „Stufe {n}", „Auslastung {p} %" (p = `floor(‰ / 10)`), Zustand `noForest`
  „Kein freier Wald in der Nähe"; Abschnitt „Ausbau zu Stufe {n}" ab Freischaltung (sonst verborgen): Kosten,
  Gebühr, „Ausstoss a → b / min · Unterhalt c → d / min", Knopf „Ausbauen", Gründe als „✗ …"-Zeilen
  (`friendlyReason`); bei Stufe 3 „Höchste Stufe".
- **Haus-Panel:** bei vollem Haus mit Defizit „{Gut}-Bilanz negativ — Aufstieg verzögert; Vorrat reicht noch {X}
  Minuten" (Regeln für X: Anhang 01 E); R161-Zeile (3.7).
- **Mouse-over** (M10 §13, M10-Schnittstelle): „{Name}, Stufe {n} · Auslastung {p} %".
- **Werte ab Stufe 2:** Jede Anzeige eines stehenden Betriebs liest `cycleOf(b)`/`upkeepOf(b)` statt
  `def.cycle`/`def.upkeep`: `inspect.ts` (Erzeugungszeile, Unterhaltszeile, Fortschrittsbalken), `producesText` in
  `texts.ts` (nimmt den Zyklus als Zahl), Mouse-over-Ausstoss. Nur der Bauleisten-Tooltip (`buildMenu.ts`) zeigt
  bewusst die Werte des Neubaus (Stufe 1). Zahlen: AK-UI-10.
- **Bauleiste:** Jagdhütte und Rinderfarm nach der Fischerhütte, nur wenn freigeschaltet; Tooltip nennt Ausstoss je
  Stufe. **Tasten:** Jagdhütte **Y** (nach M10 einziger freier Buchstabe); Rinderfarm ohne Taste (offen 13-10).
- Kein UI-Text enthält „Tick" (M7:AK-UX-13).

## 8. Darstellung (Render-Welle, `src/render/`)

- **Silhouetten** `hunter` (1×1, Hütte mit Fellgestell und Holzstapel), `cattlefarm` (2×2, langer Stall mit
  Gatter); eigene Formen (ADR-006).
- **Stufen-Aufsatz:** gemeinsame Funktion `drawLevelTopper(ctx, def, b)` (Stufe 2 zweites Element, Stufe 3 Fahne und
  Steinsockel); liest `b.level`, schreibt nie in die Welt.
- **Marke `noForest`** in `statusMarks.ts` (Form ≠ `waitingInput`); `daynight.ts` zählt `noForest` als stillstehend.
- **Fortschrittsring:** `ringFraction(b, frac)` = min(0,99999, (`progress` + `frac`) / `cycleOf(b)`) (Muster
  `errands.ts`), läuft nur bei `state === 'ok'`, sonst grau eingefroren; Culling wie Statusmarken. R1 startet
  parallel zu P1 mit `def.cycle` und stellt in der Render-Welle auf `cycleOf` um.

## 9. Paketschnitt, Ownership, Parallelität

- **Stufe 0** Spec, Plan, Gates, Fixture `save-v5.json` — `docs/`, `tests/sim/fixtures/`; nach dem M10-Merge.
- **Stufe 1 — P1** (seriell, zuerst; 3.1, 3.2, 4-Funktionen, 5, 6): `population.ts`, `economy.ts`, `flow.ts` (neu),
  `queries.ts`, `levels.ts` (neu), `types.ts`, `save.ts`, `defs/timing.ts`, `defs/tiers.ts`, `defs/levels.ts`
  (leer), `defs/unlocks.ts`, `render/errands.ts` (Zugriff `cycleOf`), Pins und Umschreibungen in `tests/sim/`.
- **Stufe 1 ∥** R1 Ring (neues Modul in `src/render/`) und B0 Messgerüst `tests/sim/balance-flow.test.ts` (neu).
- **Stufe 2 — P2** (3.3–3.5, 4-Gebäude): `defs/buildings.ts`, `placement.ts`, `production.ts`, `types.ts` (nur
  `BuildingDefId`), `defs/unlocks.ts` (U2/U3 `buildings`, Tipps).
- **Stufe 2 ∥ — P3** (3.6): `defs/levels.ts` (Füllung), `upgrade.ts` (neu), `build.ts` (`demolish`),
  `src/sim/unlocks.ts` (`deriveUnlocks`). Die Einträge `hunter`/`cattlefarm` in `LEVELS` setzt das zuletzt gemergte
  der beiden Pakete (Setzung Spec).
- **Stufe 3** UI-Welle (7, 3.7): `src/ui/` (inkl. Zugriffsersatz `cycleOf`/`upkeepOf` in `inspect.ts`, `texts.ts`,
  Mouse-over), `index.html`, `src/style.css`, ein serieller Strang. **∥** Render-Welle (8): `sprites.ts`,
  `statusMarks.ts`, `daynight.ts`, Ring.
- **Geteilte Testdateien** bei P2 ∥ P3 (`defs.test.ts`, `unlocks.test.ts`): je Paket ein eigener `describe`-Block;
  das zweite Paket holt `main` vor seinem Merge per Merge (kein Rebase) und lässt beide Blöcke laufen. P2 schreibt
  M10:AK-F1-05 um (12).
- **Stufe 4 — B1** (zuletzt): Szenarien in `tests/sim/`, `README.md`, `docs/arc42.md`.
- `types.ts` und `save.ts` gehören nur P1 (ausser `BuildingDefId` in P2).

## 10. Randfälle

- Defizit bei vollem Haus: Aufstieg nach 600 statt 300; leert sich das Lager, gilt Hunger wie heute (AK-P1-09). Lager voll bei Defizit:
  dämpft trotzdem (AK-P1-12). Bilanz nach Δ genau 0: dämpft nicht
  (AK-P1-08). Mehrere Aufstiege im selben Takt: Δ
  nacheinander, Id-Reihenfolge (AK-P1-10).
- Abriss mit Übertrag: Übertrag bleibt, ab dem nächsten Schritt ohne den Unterhalt (AK-P1-06). Geld negativ durch
  Unterhalt je Tick: erlaubt, Bauen gesperrt („Kein Geld"), Steuer läuft (AK-P1-07).
- Nahrungsüberschuss: Lager 100, Verkauf 3 < Unterhalt 2,0–2,5 je Einheit (AK-P2S2-01).
- Wald der Jagdhütte gerodet: `noForest`, Unterhalt läuft; Aufforsten oder Abriss (AK-P2S3-02). Brand während
  `noForest`: `burning` hat Vorrang (AK-P2S3-03).
- Rinderfarm gegen Schäferei: die später gebaute Farm scheitert am Standort; die stehende läuft (AK-P2S2-03).
- Ausbau mitten im Zyklus oder `progress ≥` neuer Zyklus: Abschluss im nächsten Schritt (AK-P3-04). Ausbau ohne
  Gebührenware: „Zu wenig Stoff", Kauf am Kontor (AK-P3-03). Kettenmismatch Weberei 2 / Schäferei 1:
  `waitingInput`, Auslastung < 100 % (AK-P3-07).
- Laden v4/v5: Migration, Überträge 0, Auslastung 100 %, Stufe 1 (AK-SAV-02). Stand mit `level` vor U3:
  `deriveUnlocks` → U3 (AK-UNL-04).

## 11. Abnahmekriterien

Vitest läuft in CI (`make test`); „neu" = neue Datei. Browser-Checks nach Anhang 02 G (1280 × 800 und 1920 × 1080,
Szenen Anhang 02 F).

### 11.1 Sim

**P1** (`tests/sim/flow.test.ts` neu, `taxes.test.ts`, `economy.test.ts`, `defs.test.ts`)

- **AK-P1-01** (Vitest `defs.test.ts`) `TAX_UNIT` 2, `UNSATISFIED_TAX_FACTOR` 0,5, `TAX_CARRY_DIVISOR` 20 000,
  `UPGRADE_DEFICIT_WAIT_FACTOR` 2, `EFF_WINDOW` 256, `EFF_MAX` 1000.
- **AK-P1-02** (Vitest `taxes.test.ts`) 20 Siedlerhäuser à 8 EW, erfüllt, „normal", ohne Betriebe: je Schritt +11
  oder +12, nach 100 Schritten genau +1120; `taxCarry` stets 0 … 19 999.
- **AK-P1-03** (Vitest `taxes.test.ts`) wie AK-P1-02: „niedrig" +784, 10 von 20 unerfüllt +840 je 100 Schritte.
- **AK-P1-04** (Vitest `economy.test.ts`) Unterhalt Σ 115 ohne Häuser: je Schritt −1 oder −2, nach 100 Schritten
  genau −115; `upkeepCarry` stets 0 … 99.
- **AK-P1-05** (Vitest `balance-flow.test.ts` neu) Referenzlauf Seed 3, Krisen „aus": Δ = `money` direkt nach
  `step` − `money` direkt vor `step` (Bau, Abriss, Kauf, Verkauf des Controllers liegen zwischen den Schritten und
  fallen heraus). Ausgenommen sind Schritte, in denen Σ `house.tier` steigt (Aufstieg bezahlt in `step`). In allen
  übrigen Schritten `|Δ − (stats.taxes − stats.upkeep) / 100| ≤ 2` (Werte nach dem Schritt).
- **AK-P1-06** (Vitest) Abriss eines Fischers bei `upkeepCarry` 50: Übertrag bleibt 50; der nächste Schritt addiert
  Σ Unterhalt ohne die 5.
- **AK-P1-07** (Vitest) Geld 10, Unterhalt 115, ohne Häuser: nach 20 Schritten Geld < 0, `placeBuilding` → „Kein
  Geld"; mit Häusern bucht die Steuer weiter.
- **AK-P1-08** (Vitest `flow.test.ts`, rein) `deficitGood` für 1→2 mit Budget {Nahrung 2,0, Stoff 1,6} (= Δ) →
  `null`; Nahrung 1,999 → `food`; Stoff 1,599 → `cloth`.
- **AK-P1-09** (Vitest, Testhelfer-Welt nur mit P1-Gebäuden) volles Pionierhaus (4 EW), Kapelle, angebundene Weberei
  (Stoff net 2,0 ≥ 1,6), Lager Nahrung und Stoff je 100, `satisfiedSince` = t0 (Vielfaches von 50): mit 2 Fischern
  (Nahrung net 5,0 − 2,0 = 3,0 ≥ Δ 2,0) Aufstieg im Takt t0 + 300; mit 1 Fischer (0,5 − 2,0 < 0) kein Aufstieg bei
  t0 + 300, Aufstieg bei t0 + 600; „niedrig" 300 statt 150; „hoch" nie.
- **AK-P1-10** (Vitest) zwei volle Pionierhäuser, 3 Fischer (net 7,5 − 4,0 = 3,5), 2 Webereien (net 4,0), gleiches
  t0: kleinere Id steigt bei t0 + 300 auf (Rest-Budget Nahrung 1,5), die andere sieht 1,5 − 2,0 < 0 und steigt bei
  t0 + 600 auf.
- **AK-P1-11** (Vitest) `upgradeDelta` wie 3.2 (± 1e-9).
- **AK-P1-12** (Vitest) Rum 100 im Lager bei Rum-Defizit → 600; brennende Brennerei zählt nominell.
- **AK-P1-13** (Vitest) ohne `level` liefern `cycleOf`/`upkeepOf` für jeden Betrieb `def.cycle`/`def.upkeep`
  (Fischer 40/5); Stufenwerte prüft AK-P3-02.
- **AK-P1-14** (Review) `flow.ts` ohne Import von `population.ts`/`queries.ts`; `queries.ts` re-exportiert
  `goodsBalance`; in `src/sim/` liest nur `levels.ts` `def.cycle`/`def.upkeep`.

**P2S2** (`tests/sim/sources.test.ts` neu, `placement.test.ts`, `defs.test.ts`)

- **AK-P2S2-01** (Vitest `defs.test.ts`) Felder wie 3.3; Geld je EW aus den Defs (80; 87,5; 85): Maximum ≤ 1,10 ×
  Minimum; `GOODS.food.sell` < Unterhalt je Nahrung (2,0–2,5).
- **AK-P2S2-02** (Vitest `placement.test.ts`) Jagdhütte bei genau 10 freien Waldkacheln ok; Weg oder Gebäude auf
  einer → „Zu wenig freier Wald in der Nähe"; 9 freie plus Wald unter dem eigenen Grundriss → ebenso.
- **AK-P2S2-03** (Vitest) Rinderfarm bei 16 freien Graskacheln ok; nach einer Schäferei auf 4 davon scheitert eine
  zweite Farm dort („Zu wenig freie Weide in der Nähe"); die stehende produziert weiter.
- **AK-P2S2-04** (Vitest) Jagdhütte 1 Nahrung je 50 Schritte, Rinderfarm je 20; im Sturm Rinderfarm je 40,
  Jagdhütte je 50.
- **AK-P2S2-05** (Vitest) Regeln ohne `free` zählen wie heute (Schäferei mit bebauter Weide ok).

**P2S3** (`tests/sim/forest.test.ts`, M10-Schnittstelle)

- **AK-P2S3-01** (Vitest) Holzfäller mit 1 freier Waldkachel; `clearForest` → nach dem nächsten Schritt `noForest`,
  `progress` gleich, kein Holz, Unterhalt gebucht; `plantForest` → nächster Schritt `ok`, `progress` +1.
- **AK-P2S3-02** (Vitest) Jagdhütte mit 10 freien Waldkacheln, eine roden → `noForest`, aufforsten → `ok`.
- **AK-P2S3-03** (Vitest) Vorrang vor `noForest`: brennend → `burning`, nicht angebunden → `notConnected`,
  M10-Bedingung fehlt → `noService` (Reihenfolge wie Anhang 01 D).
- **AK-P2S3-04** (Vitest, nur Variante A, M-09) Holzfäller, dessen einziger Wald unter dem eigenen Grundriss
  liegt → „Zu wenig freier Wald in der Nähe".

**P2S4** (`tests/sim/utilization.test.ts` neu)

- **AK-P2S4-01** (Vitest) Fischer ohne `eff`, 500 Schritte `ok`: `eff` 256 000, `utilization` 1000.
- **AK-P2S4-02** (Vitest) Weberei ohne Wolle: nach 256 Schritten 367, nach 2000 genau 0.
- **AK-P2S4-03** (Vitest) ab `eff` 0 mit `ok`: nach 2000 Schritten genau 1000.
- **AK-P2S4-04** (Vitest) Dauersturm (`crisis.until` +3000): Fischer nach 2000 Schritten 450 … 550 (erwartet
  499–501); Jagdhütte 1000.
- **AK-P2S4-05** (Vitest) Speichern nach 777 Schritten, Laden, je 500 weitere: `serialize` gleich.
- **AK-P2S4-06** (Vitest) Häuser, Kapelle, Markt nie mit `eff`; Zwilling mit `eff` 0 hat nach 1000 Schritten gleiches
  Geld und Lager.

**P3** (`tests/sim/upgrade.test.ts` neu)

- **AK-P3-01** (Vitest `defs.test.ts`) `LEVELS` hat genau die 11 Betriebe mit `produces`, Werte Anhang 01 A.4,
  ganzzahlig, Stufe 3 schneller als 2.
- **AK-P3-02** (Vitest) Fischer, U3 frei, Geld 1000, Stoff 2: ok; Geld −50, Holz −3, Werkzeug −1, Stoff −2,
  `level 2`, `cycleOf` 24, `upkeepOf` 7; `goodsBalance` Nahrung +100/24; `totalUpkeep` +2.
- **AK-P3-03** (Vitest) je ein Fall der 7 Gründe aus 3.6 in Reihenfolge; `serialize` vorher = nachher.
- **AK-P3-04** (Vitest) Fischer `progress` 30, Ausbau: nächster Schritt +1 Nahrung, `progress` 0.
- **AK-P3-05** (Vitest) Abriss Fischer Stufe 3: +112 Geld, +6 Holz, +2 Werkzeug; Stoff und Rum unverändert.
- **AK-P3-06** (Vitest) Brand: Stufe bleibt; Ausbau während Ausfall → „Gebäude brennt".
- **AK-P3-07** (Vitest) Weberei Stufe 2, Schäferei Stufe 1, Wolle 0: in 600 Schritten mindestens einmal
  `waitingInput`, `utilization` < 1000.

**UNL** (`tests/sim/unlocks.test.ts`, M10-Schnittstelle)

- **AK-UNL-01** (Vitest) U2 enthält `hunter`, U3 `cattlefarm` und `upgrade2`, U5 `upgrade3`; jede `BuildingDefId`
  ausser `kontor` und jede Funktion in genau einem Eintrag; `FUNCTION_LABELS` wie 4.
- **AK-UNL-02** (Vitest) neue Welt: `canPlace(w, 'hunter', …)` → U2-`lockText`, nach U2 ok; `cattlefarm` mit U3.
- **AK-UNL-03** (Vitest) `upgradeBuilding` vor U3 → U3-`lockText`; Stufe 2 → 3 vor U5 → U5-`lockText`.
- **AK-UNL-04** (Vitest) `deriveUnlocks` mit Fischer `level 2` ohne Häuser enthält U3, nicht U2; mit `level 3` U5.
- **AK-UNL-05** (Vitest) `tip` U2, U3, U5 enthalten die Sätze aus Anhang 01 A.5; kein Text enthält „Tick".

**SAV** (`tests/sim/save.test.ts`)

- **AK-SAV-01** (Vitest) `createWorld(3)`: `version 6`, Überträge 0; nach 1000 Schritten `deserialize(serialize(w))`
  gleich.
- **AK-SAV-02** (Vitest) `save-v5.json` lädt: `version 6`, Überträge 0, ohne `eff`/`level`, alle `utilization`
  1000, 100 Schritte fehlerfrei; `save-v4.json` (M10) und v1–v3 laden durch die Kette.
- **AK-SAV-03** (Vitest `balance-crises.test.ts`) M6:AK-B2-06 (Laden bei Tick 2601) grün ohne Teständerung; Zwilling mit
  `taxCarry` 12 345, `upkeepCarry` 67: Laden, 300 Schritte, `serialize` gleich.
- **AK-SAV-04** (Vitest) „Beschädigter Spielstand" bei `taxCarry` −1, 20 000, 1,5; `upkeepCarry` 100; `eff` −1,
  256 001, 1,5 oder an einem Haus; `level` 1, 4 oder an der Kapelle; `state 'foo'`. `'noForest'` wird angenommen.
- **AK-SAV-05** (Vitest) `version 7` → „Unbekannte Version".

**BAS** (`balance.test.ts`, `balance-crises.test.ts`, `balance-merchants.test.ts`)

- **AK-BAS-01** (Vitest) Referenz `off`, Haupt-Pins: Sieg 6750 (M-01), `minMoney` 117 (M-02), `endMoney` 339
  (M-03), erste Siedler/Bürger 350/4150 (M-04); zwei Läufe ergeben gleiches `serialize`.
- **AK-BAS-02** (Vitest) Schwellen: Sieg ≤ 7500 und Geld > 0; „normal" M-07 ≤ 8000; Ziel 2 M-08 ≤ 12 000;
  `minMoneyAfterWin` M-10.
- **AK-BAS-03** (Vitest) Freischalt-Ticks M10 9.3 auf M-11 gepinnt.
- **AK-BAS-04** (Vitest) `normalized()` entfernt `taxCarry`, `upkeepCarry`, `eff`, `level` (Unit-Test).
- **AK-BAS-05** (Vitest) Referenz-Endwelt: 0 `hunter`, 0 `cattlefarm`, kein `level`; nie ein Betrieb `noForest`.
- **AK-BAS-06** (Review `lead-qa`) Haupt-Pins = Tabelle 14 oder Abweichung an L0 gemeldet; Umschreibungen tragen
  „(M11 S10)"; kein Test gelöscht; M10:AK-F1-05 umgeschrieben (12).
- **AK-BAS-07** (Vitest) Gebäudezahlen (M-05) und Fingerabdruck (M-06) sind in P1 neu gemessen und gepinnt;
  Testkommentar nennt Messbefehl, Commit und den Richtwert aus Anhang 03.

### 11.2 UI (`tests/ui/` und Browser)

- **AK-UI-01** (Browser `m11-fluss`, 1×) `data-field="money"` ändert sich in 2 s mindestens 10-mal, steigend.
- **AK-UI-02** (Vitest `hud.test.ts`; Browser) `balanceDue(1000, 600)` false, `(1100, 600)` true; `data-field=
"balance"` ändert sich in keinem 1-s-Fenster öfter als 2-mal (10 s beobachtet).
- **AK-UI-03** (Vitest `inspect.test.ts`) Fischer ohne `eff` „Auslastung 100 %", `eff` 94 208 → „Auslastung 36 %";
  `level 2` → „Stufe 2"; Haus ohne Auslastungszeile.
- **AK-UI-04** (Vitest `inspect.test.ts`; Browser `m11-ausbau`) Fischer Stufe 1: „Ausbau zu Stufe 2", 50 Geld, 3
  Holz, 1 Werkzeug, 2 Stoff, „Ausstoss 15 → 25 / min"; vor U3 verborgen; Klick baut aus; Stufe 3 „Höchste Stufe";
  ohne Stoff „✗ Zu wenig Stoff".
- **AK-UI-05** (Vitest `hotkeys.test.ts`) `hotkeyAction('y')` → `hunter`; keine Taste → `cattlefarm`; Y in
  `hotkeyList(world)` erst nach U2.
- **AK-UI-06** (Browser `m11-wald`) Bauleiste: Jagdhütte, Rinderfarm nach der Fischerhütte; Roden der letzten
  freien Waldkachel → Panel „Kein freier Wald in der Nähe" innerhalb 1 s.
- **AK-UI-07** (Vitest, Helfer in `src/ui/`; Browser `m11-defizit`) Rum 40, keine Brennerei: „Rum-Bilanz negativ —
  Aufstieg verzögert; Vorrat reicht noch 2 Minuten"; Rum 0 → „Vorrat leer"; ohne Defizit keine Zeile.
- **AK-UI-08** (Browser) Mouse-over Fischer Stufe 2: „Fischerhütte, Stufe 2 · Auslastung 100 %".
- **AK-UI-09** (Vitest) Meldung U3 nennt „Rinderfarm" und „Ausbau Stufe 2", U5 „Ausbau Stufe 3"; kein neuer Text
  enthält „Tick".
- **AK-UI-10** (Vitest `inspect.test.ts`; Browser `m11-ausbau`) Fischer Stufe 2 / 3: `producesText` „Erzeugt
  Nahrung alle 3 s" / „alle 2 s"; Panel „Unterhalt 42 / min" / „54 / min"; Balken bei `progress` 12 auf Stufe 2
  50 %; Mouse-over Stufe 2 „25 Nahrung / min"; Bauleisten-Tooltip weiter Stufe-1-Werte.
- **AK-R161-01** (Vitest `hints.test.ts`) „Zu wenig Stein" mit 1 Glashütte → Zusatzzeile 3.7; ohne Glashütte keine.
- **AK-R161-02** (Browser `m11-stein`) Haus-Panel zeigt die Zeile; Glashütte „Wartet auf Stein".
- **AK-R161-03** (Review) `production.ts` ohne Stein-Reserve; Testhelfer-Stein bleibt.

### 11.3 Render (`tests/render/` und Browser)

- **AK-RND-01** (Vitest `sprites.test.ts`) `hunter`, `cattlefarm` in `bodyHull` (± 0,5 px), Höhe ≤ `H_MAX`; Pfad ≠
  Fischer bzw. Schäferei.
- **AK-RND-02** (Vitest, `fakeCtx`) je `LEVELS`-Typ ergeben Stufe 1, 2, 3 drei verschiedene Aufzeichnungen; die Welt
  bleibt unverändert (`serialize` gleich).
- **AK-RND-03** (Vitest `statusMarks.test.ts`, `daynight.test.ts`) `noForest` hat eine Marke ≠ `waitingInput` und
  gilt als stillstehend.
- **AK-RND-04** (Vitest, Ring-Modul) `ringFraction`: Fischer `progress` 20 → 0,5; Stufe 2 `progress` 12 → 0,5;
  höchstens 0,99999.
- **AK-RND-05** (Browser, Urteil `lead-art`) Ring läuft sichtbar; Jagdhütte, Rinderfarm, Stufen 1/2/3 auf
  Standardzoom unterscheidbar.

### 11.4 QA, Balancing, Doku (Paket B1; IDs `AK-M11B`, R136)

- **AK-M11B-01** (Vitest `balance-upgrade.test.ts` neu) Controller-Variante „baut Fischer aus" (Stufe 2 ab U3, 3 ab
  U5): Sieg ≤ M-01, `minMoney` ≥ 0 (Ergebnis M-15).
- **AK-M11B-02** (Vitest `scenario-saves.test.ts`) die 5 Szenen aus Anhang 02 F sind `isWellFormed` und überstehen
  `deserialize(serialize(w))` gleich.
- **AK-M11B-03** (Review) Anhang 03 belegt M-09, M-13, M-14 mit Zahlen; A13 berichtet.
- **AK-M11B-04** (Review) README und arc42 nach 12 nachgeführt.

## 12. README, arc42 und Änderungen

- **README:** „Unterhalt und Geld" (Buchung je Tick), „Produktionsketten" (Jagdhütte, Rinderfarm, freier Wald,
  Auslastung, Ring, Ausbau mit Stoff/Rum), „Aufstieg" (doppelte Wartezeit bei Defizit), „Tastatur und Maus" (Y).
- **arc42:** Bausteine `flow.ts`, `levels.ts`, `upgrade.ts`, `defs/levels.ts`; Laufzeit-Tabelle „`tickTaxes`,
  `tickEconomy`: je Tick mit Übertrag"; Persistenz v6; Glossar „Bilanz" (Rate je 100 Ticks, Buchung je Tick).
- **Änderung** Hauptspec „Wirtschaft" und arc42 „Buchung alle 100": Buchung je Tick, Raten weiter „pro 100 Ticks".
  **Änderung** M10:AK-S1-01, M10 11.1, Meldungen U2/U3/U5 (4), M10 6 „Holzfäller arbeitet nach Roden weiter" (gilt
  nicht mehr). **M10:AK-F1-05** wird mit P2 rot: P2 schreibt den Holzfäller-Teil um (alle Waldkacheln im Radius 2
  gerodet → `noForest`, nach 300 Schritten Holz +0, Unterhalt gebucht); der Schäferei-Teil bleibt. **M10:AK-U3-02**
  (Mouse-over „kein Wald mehr in der Nähe") übernimmt in der UI-Welle den Zustandstext `noForest` (Anhang 02 D). Kein neues ADR (Spielregel, Ruling R185).

## 13. Annahmen, Abweichungen, offene Punkte

- **13-1 Abweichung:** `TAX_CARRY_DIVISOR` in `defs/tiers.ts`, nicht `timing.ts` (Importzyklus der Defs).
- **13-2 Abweichung:** Δ nach Vorschlag-Anhang 01 d (Rum 2→3 = 3,0), nicht nach der Kurzformel in Vorschlag 3.1; Anhang 03
  hat die Spec-Formel nachgemessen: bitgleich zur Kurzformel.
- **13-3 Abweichung:** `eff` als Akkumulator × 256, Anzeige 0–1000 ‰ abgeleitet (exakte Rundung, 0 und 1000
  erreichbar).
- **13-4 Abweichung:** alle Typ- und Save-Änderungen und die Naht `cycleOf`/`upkeepOf` in P1; P2 nur
  `BuildingDefId`; P3 ohne `types.ts`/`save.ts` (P2 ∥ P3 ohne Engstelle).
- **13-5 Abweichung:** Glashütte zeigt Ist-Text „Wartet auf Stein" statt „kein Stein".
- **13-6 Abweichung:** Aufforsten 20 Geld (M10-Spec) statt 25 (Vorschlag-Anhang 01 f).
- **13-7 Setzung:** `isWellFormed` prüft ab v6 `state` (Ist: `isValidBuilding` prüft nur `defId`, `x`, `y`).
- **13-8 Code-Ist:** `tickTaxes` liegt in `population.ts` (nicht `tax.ts`); `goodsBalance` in `queries.ts`
  importiert `isSupplied` aus `population.ts` (Grund für `flow.ts`).
- **13-9 Setzung:** Live-Prüfung nur für Wald (2.3).
- **13-10 Offen:** Rinderfarm ohne Taste; nach M10 sind alle Buchstaben ausser Y belegt. Empfehlung: Entscheid im UI-Plan (z. B. Ziffer 4).
- **13-11 Entschieden:** Holzfäller Variante A (A9 hält, M-09); Variante C bleibt Rückfall.
- **13-12 M10-Schnittstellen** nach dem Merge prüfen: Save v5, `UNLOCKS`, `FUNCTION_LABELS`, `functionLock`,
  `deriveUnlocks`, `noService`-Reihenfolge, `normalized()`, M10 9.3, §13, `save-v4.json`.
- **13-13 Abweichung von R185:** Neupin-Siegticks 6750 / 7850 / 11 200 statt 7250 / 7850 / 11 300; R185 nannte den
  Lauf ohne Dämpfung. Die Schwellen halten; Neupinnen wie beschlossen (A1); von R187 (A15) angenommen.
- **13-14 Entscheid A3:** Dämpfung Faktor 2 bleibt; das minMoney-20-Szenario gibt es nur ohne (b). Auf fremden Seeds
  sind Minima < 30 Controller-Reserve-Effekte (Anhang 03 C); darum nur Seed 3 pinnen.

## 14. Gemessene Sollwerte (Anhang 03)

Seed 3, Buchung je Tick + Dämpfung Faktor 2 nach 3.2 (Anhang 03 D; Spec-Formel bitgleich zur Kurzformel, 22 von 22
Läufen). Soll für die Neupin-Prüfung (6); Abweichung → Meldung an L0 (R74), ausser M-05/M-06 (Neupin mit Beleg).

| ID   | Grösse                              | Sollwert                                                         |
| ---- | ----------------------------------- | ---------------------------------------------------------------- |
| M-01 | Siegtick Referenz `off`             | **6750** (R185: 7250 ohne Dämpfung; 13-13, R187 A15)             |
| M-02 | `minMoney` Referenz                 | 117 (Tick 4150)                                                  |
| M-03 | `endMoney` Referenz                 | 339                                                              |
| M-04 | erste Siedler / erste Bürger        | 350 / 4150                                                       |
| M-05 | Gebäudezahlen `OFF_REFERENCE` (A13) | Neupin mit Beleg in P1 (Ist 3 Brennereien)                       |
| M-06 | `OFF_FINGERPRINT`                   | Neupin mit Beleg in P1; Richtwert `0x701c6da5` (ohne Überträge)  |
| M-07 | Sieg „normal" + Feuerwache / mild   | 7850 / 7850 (Abstand 150 zu 8000)                                |
| M-08 | Kaufleute Ziel 1 / Ziel 2           | 6750 / 11 200                                                    |
| M-09 | A9 Holzfäller Variante A            | **hält** (22 bitgleiche Vergleiche; Mindestwald 3 gegen `min` 1) |
| M-10 | `minMoneyAfterWin` Kaufleute        | 320                                                              |
| M-11 | Freischalt-Ticks U2/U3/U4/U5/U6     | `off` 150/350/550/4150/6750; „normal" …/5150/7850; mild …/4250   |
| M-12 | Zahl roter Tests nach P1            | 14 von 304 vor M10, plus M10-Freischalt-Pins; Liste aus P1       |
| M-13 | Zerlegung +1200                     | Steuer 100 %, Unterhalt 0 % (unten)                              |
| M-14 | minMoney-20-Szenario                | nur ohne (b) (Tick 4950); mit (b) und Dämpfung 117 (13-14)       |
| M-15 | Sieg, `minMoney` „Fischer ausbauen" | bei B1 gemessen; AK-M11B-01 verlangt ≤ 6750 und ≥ 0              |

**M-13** (Anhang 03 A): Der alte Takt bucht die Steuer aus dem Stand am Buchungstick, bis Tick 6000 +1145,5 Münzen
(64 % kurz unerfüllte Häuser, 36 % Wachstum/Aufstieg) ≈ 600 Ticks; die übrigen ≈ 600 sind eine Controller-Schwelle
beim letzten Aufstieg, nicht der Entscheidungstakt (Vorschlag 3 korrigiert). Darum nur Seed 3 pinnen, kein
`minMoney`-Pin für Krisenläufe.
