# M11 „Wirtschaft im Fluss" — Design-Spec

Datum: 2026-10-03 · Paket M11-SPEC · Meilenstein M11 · Status: **Spec, Entwurf zum Gate Spec** · Prozessstufe voll
(Baseline-Bruch, Save v6)

Grundlage: [Vorschlag M11](2026-10-03-m11-wirtschaft-im-fluss-design.md) mit Anhang 01 (Bilanzen) und 02
(Messprobe); Ruling **R185** (A1–A14 angenommen; Auflagen: Zerlegung des Bruchs, A9 und minMoney-20 belegen, Spec ≤
40 KB); [S12-Design](2026-10-03-s12-ausbau-design.md) (R171, für P3 unverändert, hier verdichtet);
[M10-Spec](2026-10-03-m10-schritt-fuer-schritt-spec.md); [Hauptspec](2026-09-29-inselreich-design.md). Werte nicht
neu gerechnet.

Anhänge (Ordner `2026-10-03-m11-wirtschaft-im-fluss-spec/`):
[Anhang 01](2026-10-03-m11-wirtschaft-im-fluss-spec/anhang-01-werte-und-ablauf.md) Werte je Zieldatei, Typen,
Funktionen, Tick-Ablauf, Texte;
[Anhang 02](2026-10-03-m11-wirtschaft-im-fluss-spec/anhang-02-baseline-und-pruefung.md) Baseline, rote Tests,
Fixture, Szenario-Saves; **Anhang 03** (`anhang-03-messauflagen.md`, `design-economy-designer`) Zerlegung, A9,
minMoney-20, Pin-Sollwerte.

Kennzeichnung wie M10: **Setzung Spec** (neu gesetzt), **Abweichung** (vom Vorschlag, Übersicht 13), **Änderung**
(an Hauptspec, arc42, früheren AK; Übersicht 12), **M10-Schnittstelle** (setzt auf M10 auf: Save v5,
`defs/unlocks.ts`, `tickUnlocks`, `functionLock`, `deriveUnlocks`, `normalized()`, `noService`; Stand
`feat/m10-ui`, gilt nach dem M10-Merge). **M-nn** = gemessener Sollwert aus Anhang 03 (Tabelle 14).

Code-Stand der Prüfung: Worktree `docs/m11-design` @ 0d583f8 (`main` 1c7d587, Save v4). Alle genannten Ist-Namen
existieren dort (`tickTaxes`, `totalTaxes`, `allNeedsMet`, `upgradeStatus`, `tryUpgrade`, `tickEconomy`,
`totalUpkeep`, `refundCost`, `goodsBalance`, `tickProduction`, `STORM_TICK_DIVISOR`, `isWellFormed`, `checkRule`,
`radiusReason`, `demolish`, `UPKEEP_INTERVAL`, `UPGRADE_WAIT`, `UNSATISFIED_TAX_FACTOR`).

## 1. Ziel

**Spielerzweck:** „Mein Geld fliesst stetig, ein Defizit bremst den Aufstieg, und ich wähle, woher meine Nahrung
kommt und wie ich meine Betriebe ausbaue."

- **Fühlen:** Die Kasse zählt je Tick hoch statt in Schüben alle 10 s; jeder Betrieb zeigt Zyklus (Ring) und
  Auslastung; wer mit Defizit aufsteigen will, wird gebremst und liest warum.
- **Entscheiden:** Nahrung von Küste, Wald oder Weide; mit Defizit aufsteigen (doppelte Wartezeit) oder erst Ketten;
  Neubau oder Ausbau; Stein für Glas oder Aufstieg.
- **Zeitbild** (Referenzlauf, Tabelle 14): Ring und Fluss ab Sekunde 1; Jagdhütte mit U2 (Tick 150, 0:15 min),
  Rinderfarm und Ausbau Stufe 2 mit U3 (Tick 350, ~1 min), Stufe 3 mit U5 (Tick 3850, ~6,5 min). Die ersten 15 min
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
ausbauen" (S12 3.5). **K3** B1-Szenario „Jagdhütten statt Fischer" (Sieg, `minMoney` ≥ 0). **Streichen:** K3, K2,
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
  `progress` in diesem Schritt stieg und danach `state === 'ok'`; sonst 0 (`waitingInput`, `storageFull`,
  `notConnected`, `burning`, `noService`, `noForest`, Sturm-Aussetzer).
- Nachgerechnet: Beharrung `ok` bleibt 256 000 (1000 ‰); Ziel 0 ab 1000 ‰: nach 256 Schritten 367 ‰, nach 1913
  genau 0; Ziel 1000 ab 0: nach 1913 genau 1000 ‰; Dauersturm 499–501 ‰; 300-Tick-Sturm 1000 → 655 ‰.
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
- Unterhalt über `upkeepOf` durch den Übertrag; Brand: 200 Ticks Ausfall, Stufe bleibt. Wirkung (S12): Fischer fürs
  Siegziel 10 → 6 (Stufe 2) bzw. 4 (Stufe 3); Holzfäller und Jagdhütte bewusst R > 1,4.

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
- **Folge für M10-Tests (Änderung):** M10 AK-S1-01 (jedes Gebäude, jede Funktion in genau einem Eintrag), Zählung
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
- Wiederladen im Sturm (`balance-crises` AK-B2-06) wird mit gespeicherten Überträgen wieder bitgleich (Pflicht).

## 6. Bitgleichheit und Baseline

- **Bricht** (bewusst, R185): Geldverlauf und Siegtick durch S10 und Dämpfung. **Bleibt:** S2, S3 (wenn A9 hält),
  S4, S12, R161; der Controller baut weder Jagdhütte, Rinderfarm noch aus und rodet nie (Anhang 02 A).
- **Ursache** (Auflage 1): Steuer aus dem Tick-Mittel statt dem Stand am Buchungstick; Zerlegung M-13.
- **Fingerabdruck:** `normalized()` entfernt zusätzlich `taxCarry`, `upkeepCarry`, je Gebäude `eff`, `level`; neuer
  Sollwert M-06.
- **Neupin** (Anhang 02 C): Messung vor P1, Umsetzung, Vergleich mit Anhang 03; Abweichung → nicht nachstellen,
  Meldung an L0 (R74). Schwellen bleiben: Sieg ≤ 7500 (`WIN_TICK_LIMIT`), „normal" ≤ 8000 (`CRISIS_WIN_STOP`), Ziel
  2 ≤ 12 000, Endgeld > 0.
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
- **Stufe 3** UI-Welle (7, 3.7): `src/ui/`, `index.html`, `src/style.css`, ein serieller Strang. **∥** Render-Welle
  (8): `sprites.ts`, `statusMarks.ts`, `daynight.ts`, Ring.
- **Stufe 4 — B1** (zuletzt): Szenarien in `tests/sim/`, `README.md`, `docs/arc42.md`.
- `types.ts` und `save.ts` gehören nur P1 (ausser `BuildingDefId` in P2).

## 10. Randfälle

- Leeres Lager mit Defizit: Aufstieg nach 600 statt 300; Hunger wie heute (AK-P1-09). Lager voll bei Defizit:
  dämpft trotzdem (AK-P1-12). Bilanz nach Δ genau 0: dämpft nicht (AK-P1-08). Mehrere Aufstiege im selben Takt: Δ
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
- **AK-P1-05** (Vitest `balance-flow.test.ts` neu) Referenzlauf Seed 3, Krisen „aus": in jedem Schritt ohne
  Controller-Eingriff `|Δmoney − (stats.taxes − stats.upkeep) / 100| < 2`.
- **AK-P1-06** (Vitest) Abriss eines Fischers bei `upkeepCarry` 50: Übertrag bleibt 50; der nächste Schritt addiert
  Σ Unterhalt ohne die 5.
- **AK-P1-07** (Vitest) Geld 10, Unterhalt 115, ohne Häuser: nach 20 Schritten Geld < 0, `placeBuilding` → „Kein
  Geld"; mit Häusern bucht die Steuer weiter.
- **AK-P1-08** (Vitest `flow.test.ts`) volles Pionierhaus, Stoff da, 2 Jagdhütten (Nahrung net 2,0 = Δ 2,0), Weberei
  mit Schäferei: Aufstieg nach 300 Ticks Zufriedenheit.
- **AK-P1-09** (Vitest) wie AK-P1-08 mit 1 Jagdhütte: kein Aufstieg bei 300, Aufstieg bei 600; „niedrig" 300 statt
  150; „hoch" nie; Lager Nahrung 0 ändert nichts daran.
- **AK-P1-10** (Vitest) zwei volle Pionierhäuser im selben Takt, Budget Nahrung 2,0: kleinere Id steigt nach 300
  auf, die andere sieht −2,0 und wartet 600.
- **AK-P1-11** (Vitest) `upgradeDelta` wie 3.2 (± 1e-9).
- **AK-P1-12** (Vitest) Rum 100 im Lager bei Rum-Defizit → 600; brennende Brennerei zählt nominell.
- **AK-P1-13** (Vitest) `cycleOf`/`upkeepOf` Fischer 40/5, mit `level 2` 24/7; `goodsBalance` 100/24; `totalUpkeep`
  enthält 7.
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
- **AK-P2S3-03** (Vitest) brennend → `burning`, nicht angebunden → `notConnected` vor `noForest`.
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
- **AK-P3-02** (Vitest) Fischer, U3 frei, Geld 1000, Stoff 2: ok; Geld −50, Holz −3, Werkzeug −1, Stoff −2, `level
2`, `cycleOf` 24.
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
- **AK-SAV-03** (Vitest `balance-crises.test.ts`) AK-B2-06 (Laden bei Tick 2601) grün ohne Teständerung; Zwilling mit
  `taxCarry` 12 345, `upkeepCarry` 67: Laden, 300 Schritte, `serialize` gleich.
- **AK-SAV-04** (Vitest) „Beschädigter Spielstand" bei `taxCarry` −1, 20 000, 1,5; `upkeepCarry` 100; `eff` −1,
  256 001, 1,5 oder an einem Haus; `level` 1, 4 oder an der Kapelle; `state 'foo'`. `'noForest'` wird angenommen.
- **AK-SAV-05** (Vitest) `version 7` → „Unbekannte Version".

**BAS** (`balance.test.ts`, `balance-crises.test.ts`, `balance-merchants.test.ts`)

- **AK-BAS-01** (Vitest) Referenz `off`: Sieg M-01, `minMoney` M-02, `endMoney` M-03, erste Siedler/Bürger M-04,
  Gebäudezahlen M-05, Fingerabdruck M-06; zwei Läufe ergeben gleiches `serialize`.
- **AK-BAS-02** (Vitest) Schwellen: Sieg ≤ 7500 und Geld > 0; „normal" M-07 ≤ 8000; Ziel 2 M-08 ≤ 12 000;
  `minMoneyAfterWin` M-10.
- **AK-BAS-03** (Vitest) Freischalt-Ticks M10 9.3 auf M-11 gepinnt.
- **AK-BAS-04** (Vitest) `normalized()` entfernt `taxCarry`, `upkeepCarry`, `eff`, `level` (Unit-Test).
- **AK-BAS-05** (Vitest) Referenz-Endwelt: 0 `hunter`, 0 `cattlefarm`, kein `level`; nie ein Betrieb `noForest`.
- **AK-BAS-06** (Review `lead-qa`) Pins = Anhang 03 oder Abweichung an L0 gemeldet; Umschreibungen tragen „(M11
  S10)"; kein Test gelöscht.

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

### 11.4 QA, Balancing, Doku (B1)

- **AK-B1-01** (Vitest `balance-upgrade.test.ts` neu) Controller-Variante „baut Fischer aus" (Stufe 2 ab U3, 3 ab
  U5): Sieg ≤ M-01, `minMoney` ≥ 0 (Ergebnis M-15).
- **AK-B1-02** (Vitest `scenario-saves.test.ts`) die 5 Szenen aus Anhang 02 F sind `isWellFormed` und überstehen
  `deserialize(serialize(w))` gleich.
- **AK-B1-03** (Review) Anhang 03 belegt M-09, M-13, M-14 mit Zahlen; A13 berichtet.
- **AK-B1-04** (Review) README und arc42 nach 12 nachgeführt.

## 12. README, arc42 und Änderungen

- **README:** „Unterhalt und Geld" (Buchung je Tick), „Produktionsketten" (Jagdhütte, Rinderfarm, freier Wald,
  Auslastung, Ring, Ausbau mit Stoff/Rum), „Aufstieg" (doppelte Wartezeit bei Defizit), „Tastatur und Maus" (Y).
- **arc42:** Bausteine `flow.ts`, `levels.ts`, `upgrade.ts`, `defs/levels.ts`; Laufzeit-Tabelle „`tickTaxes`,
  `tickEconomy`: je Tick mit Übertrag"; Persistenz v6; Glossar „Bilanz" (Rate je 100 Ticks, Buchung je Tick).
- **Änderung** Hauptspec „Wirtschaft" und arc42 „Buchung alle 100": Buchung je Tick, Raten weiter „pro 100 Ticks".
  **Änderung** M10 AK-S1-01, M10 11.1, Meldungen U2/U3/U5 (4), M10 6 „Holzfäller arbeitet nach Roden weiter" (gilt
  nicht mehr). Kein neues ADR (Spielregel, Ruling R185).

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
- **13-13 Abweichung von R185:** Neupin-Siegticks 6750 / 7850 / 11 200 statt 7250 / 7850 / 11 300; R185 nannte den
  Lauf ohne Dämpfung. Die Schwellen halten; Neupinnen wie beschlossen (A1), Zahlen an L0 zur Kenntnis.
- **13-14 Entscheid A3:** Dämpfung Faktor 2 bleibt; das minMoney-20-Szenario gibt es nur ohne (b). Auf fremden Seeds
  sind Minima < 30 Controller-Reserve-Effekte (Anhang 03 C); darum nur Seed 3 pinnen.
- **13-12 M10-Schnittstellen** nach dem Merge prüfen: Save v5, `UNLOCKS`, `FUNCTION_LABELS`, `functionLock`,
  `deriveUnlocks`, `noService`-Reihenfolge, `normalized()`, M10 9.3, §13, `save-v4.json`.

## 14. Gemessene Sollwerte (Anhang 03)

Seed 3, Modus „Buchung je Tick + Dämpfung Faktor 2 nach 3.2" (Anhang 03 D). Die Spec-Formel (mit Δ und Budget) ist
bitgleich zur Kurzformel der Messprobe (22 von 22 Läufen). **Diese Werte sind Soll für die Neupin-Prüfung** (6);
weichen sie bei der Umsetzung ab, wird nicht nachgestellt, sondern an L0 gemeldet (R74).

| ID   | Grösse                              | Sollwert                                                                                             |
| ---- | ----------------------------------- | ---------------------------------------------------------------------------------------------------- |
| M-01 | Siegtick Referenz `off`             | **6750** (R185 nannte 7250 = ohne Dämpfung; Abweichung 13-8)                                         |
| M-02 | `minMoney` Referenz                 | 117 (Tick 4150)                                                                                      |
| M-03 | `endMoney` Referenz                 | 339                                                                                                  |
| M-04 | erste Siedler / erste Bürger        | 350 / 4150                                                                                           |
| M-05 | Gebäudezahlen `OFF_REFERENCE` (A13) | bei P1 aus dem roten Lauf lesen (3 Brennereien als Ist); Pin = Messwert der Umsetzung                |
| M-06 | `OFF_FINGERPRINT` (normalisiert)    | `0x701c6da5` (roh `0x599eef72`); „normal" `0x77c82470`; mild `0x3f76d4bd`; Kaufleute `0x1b066873`    |
| M-07 | Sieg „normal" + Feuerwache / mild   | 7850 / 7850 (Abstand 150 zu 8000)                                                                    |
| M-08 | Kaufleute Ziel 1 / Ziel 2           | 6750 / 11 200 (≤ 12 000)                                                                             |
| M-09 | A9 Holzfäller Variante A            | **hält** (22 bitgleiche Vergleiche, Mindestwald 3 gegen `min` 1): Variante A, C ist Rückfall         |
| M-10 | `minMoneyAfterWin` Kaufleute        | 320                                                                                                  |
| M-11 | Freischalt-Ticks U2/U3/U4/U5/U6     | `off` 150/350/550/4150/6750; „normal" 150/350/550/5150/7850; mild …/4250/7850                        |
| M-12 | Zahl roter Tests nach P1            | 14 von 304 vor M10; nach M10 plus Freischalt-Pins; endgültige Liste aus dem roten Lauf               |
| M-13 | Zerlegung +1200                     | siehe unten                                                                                          |
| M-14 | minMoney-20-Szenario                | existiert nur **ohne** (b) (Tick 4950); mit (b) und Dämpfung 117; Faktor 2 bleibt (Abweichung 13-14) |
| M-15 | Sieg, `minMoney` „Fischer ausbauen" | wird bei B1 gemessen; AK verlangt Sieg ≤ 6750 und `minMoney` ≥ 0                                     |

**M-13 Zerlegung** (Anhang 03 A): Steuer **100 %**, Unterhalt **0 %**. Der alte Takt bucht die Steuer aus dem Stand am
Buchungstick: bis Tick 6000 +1145,5 Münzen (7,1 % der Steuer; 64 % kurz unerfüllte Häuser, 36 % Wachstum und
Aufstieg im Fenster). Das erklärt ≈ 600 der 1200 Ticks (Grenzrate 607); die übrigen ≈ 600 sind ein Schwelleneffekt des
Controllers beim letzten Aufstieg (Rum-Lager leer, Werkzeugkauf erst bei Rum ≥ 1). Der Entscheidungstakt ist nicht die
Ursache (Takt 1: +1050). Die Begründung im Vorschlag 3 („Controller-Effekt des Entscheidungstakts") ist damit
**korrigiert**. Pins sind wegen der Controller-Schwelle empfindlich (Reserve oder Takt verschieben den Sieg um bis zu
2000 Ticks): nur Seed 3 pinnen, kein `minMoney`-Pin für Krisenläufe.
