# M10 „Schritt für Schritt" — Design-Spec

Datum: 2026-10-03 · Paket H-D1 · Meilenstein M10 · Status: **Spec, Gate Spec bestanden mit Auflagen (R163), Delta eingearbeitet** · Prozessstufe
voll (neues System, Save v5)

Grundlage: [Designvorschlag M10](2026-10-03-m10-schritt-fuer-schritt-design.md) (Gate Brainstorming bestanden, R155,
D1–D11 wie empfohlen, D10 mit Playtest-Frage im Spec-Gate), Ruling R155 (H-S1 „Wald roden" geht als Sim-Paket in M10
auf), R148 (Programm Nutzerfeedback), R150–R152 (M8 S11-Minimum), Programm
[Nutzerfeedback](2026-10-02-programm-nutzerfeedback.md) §3.7 (S3 Wald) und §6 (H-S1), Stilvorlage und M8-Stand:
[M8-Spec](2026-09-30-m8-kaufleute-design.md). Hauptspec [2026-09-29-inselreich-design.md](2026-09-29-inselreich-design.md).
Werte aus dem Vorschlag (Abschnitt 9, `design-economy-designer`, abgenommen von `lead-design`), hier nicht neu gerechnet.

Kennzeichnung wie M8: **„Setzung Spec"** markiert eine Zahl, einen Namen oder einen Text, der im Vorschlag nicht
stand und hier begründet gesetzt wird. **„Abweichung"** markiert eine Stelle, an der die Spec vom Vorschlag abweicht
(Begründung dabei, Übersicht in Abschnitt 22). **„Änderung"** markiert eine bewusste Abweichung von Hauptspec,
arc42, ADR oder einem Abnahmekriterium früherer Meilensteine (Übersicht in Abschnitt 20). **„M8-Schnittstelle"**
markiert eine Stelle, die auf dem M8-Stand aufsetzt und sich **bis zum M8-Merge ändern kann** (Abschnitt 17).
Fremde Abnahmekriterien tragen das Präfix ihres Meilensteins (`M7:AK-UX-15`, `M8:AK-S1-21`).

Code-Stand der Prüfung (Delta R163): `main` @ 9460ab9 mit M8-Sim (Save v4, `migrateV3ToV4`, `tierLock`,
`buildLock`, `unlockTier`, Badehaus, Glashütte, Glas), M9 H-R1 und H-R2 (`wildlifeAt`); M8-UI auf `feat/m8-ui` @ 6cbdc56
noch nicht gemergt (`goalTexts`, `UNLOCK_NOTICE`, `initialUnlockShown`, `unlockNotice`, `lockedToolText` in
`src/ui/goal.ts`, Merkfeld `unlockShown` in `app.ts`, Tasten J und O). M10 startet nach dem M8-Merge (Vorschlag 10.4)
und setzt auf dessen Stand auf. Die M8-Branches ändern `src/sim/` nicht mehr (lead-tech, Gate Spec).

## 1. Ziel

**Spielerzweck:** „Am Anfang sehe ich nur, was ich brauche; jedes Mal, wenn meine Leute etwas Neues wollen, kommen
neue Bauten und Werkzeuge mit einer Meldung, und die Hilfe sagt mir, was als Nächstes kommt."

M10 bringt einen Freischaltbaum in der Sim (sieben Einträge U0–U6), die Amtsstube als Ort von Steuer und
Ausgabesperre, die Betriebsbedingung „Werkzeugmacher braucht Schule", Wald roden und aufforsten (aus H-S1), eine
Hilfe-Karte, Mouse-over und einen ersten Symbolsatz. Die Referenzläufe bleiben bitgleich.

**Zeitbild** (1 Tick = 100 ms bei 1×, 600 Ticks je Minute; Controller Seed 3, Vorschlag 9.1):

| Freischaltung          | Auslöser                      | Tick Controller, Krisen aus | Krisen „normal" + Feuerwache | Schätzung Mensch (min) |
| ---------------------- | ----------------------------- | --------------------------- | ---------------------------- | ---------------------- |
| U0 Start               | Spielbeginn                   | 0                           | 0                            | 0                      |
| U2 Siedler-Bedürfnis   | ein Pionierhaus voll          | 150                         | 150                          | 0:30–1:00              |
| U3 Erste Siedler       | erster Siedler                | 350                         | 350                          | 1:00–1:30              |
| U4 Bürger-Bedürfnis    | ein Siedlerhaus voll          | 550                         | 550                          | 1:30–2:30              |
| U1 Marktplatz          | 20 Wohnhäuser                 | nie                         | nie                          | ≈ 3:30                 |
| U5 Erste Bürger        | erster Bürger                 | 3850                        | 4750                         | 6–8                    |
| U6 Kaufleute-Bedürfnis | Stufe 4 offen (M8 `tierLock`) | 6050 (Sieg)                 | 7050 (Sieg)                  | 10–14                  |

**Prüfbar** über AK-B1-01 (Ticks), AK-U1-09 (Meldung im Browser) und die Playtest-Fragen P-01 bis P-03 (18.2).

## 2. Scope

### 2.1 Muss

| Nr  | Inhalt                                                                                                                                        | Pakete     | Abschnitt |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | --------- |
| M1  | Freischalt-Sim: `defs/unlocks.ts`, `unlocks.ts`, `tickUnlocks`, `buildLock` aus `unlocked`, Sperren in `placeBuilding`, `buy`, `deliverOrder` | S1         | 4         |
| M2  | Amtsstube (Gebäude, Silhouette), `effectiveTaxLevel`, `setTaxLevel` nur mit Amtsstube                                                         | S2, R1     | 5.1, 5.2  |
| M3  | Ausgabesperre S5 (`goodLocks`, `setGoodLock`, Wirkung in `consume` und Aufstieg)                                                              | S2         | 5.3       |
| M4  | Werkzeugmacher: Freischaltung U5, Betriebsbedingung Schule (`noService`)                                                                      | S1, S2     | 5.5       |
| M5  | Save v5 mit Migration v4 → v5 und Test alter Stände                                                                                           | S1         | 8         |
| M6  | UI zeigt nur Freigeschaltetes: Bauleiste, Tasten, Tastenliste, Lager- und Einwohner-Chips, Handels-Panel, Auftragskarte, Amtsstuben-Panel     | U1, U2     | 11        |
| M7  | Freischalt-Meldung                                                                                                                            | U1         | 11.6      |
| M8  | Hilfe-Karte (Umbau „Ziel und erste Schritte"), HUD-Knopf, Taste `?`, `nextUnlocks`, Tipps, `nextStep`-Filter                                  | S1, U2     | 12        |
| M9  | Mouse-over für Gebäude, Gelände, Schiff, Anschluss `wildlifeAt`                                                                               | U3         | 13        |
| M10 | Wald roden und aufforsten: Sim (H-S1, R155) und Bedienung (Werkzeuge, Tasten, Tooltip, Mouse-over), Terrain-Cache                             | F1, R1, U2 | 6, 7      |
| M11 | Symbole Schritt 1 (Güter, Stufen, Geld, Dienste, Kategorien) in HUD, Bauleiste, Haus-Panel, Meldung                                           | A1, U4     | 14        |
| M12 | Option „Alles frei"                                                                                                                           | S1, U1     | 10        |
| M13 | Bitgleich-Nachweis (Referenzlauf, Krisen-Lauf, M8 B1), Fingerabdruck-Normalisierung, Messung der Freischalt-Ticks                             | S1, B1     | 9         |

### 2.2 Kann und Streichreihenfolge

Gestrichen wird in dieser Reihenfolge: **K5, K4, K3, K2, K1** (Vorschlag: K4, K3, K2, K1; K5 ist neu und fällt zuerst).

- **K1** Aufstiegsstopp je Stufe in der Amtsstube (5.4). Das Save-Feld `upgradeStops` kommt auch ohne K1 (8.1).
- **K2** Zeichen „neu" an frisch freigeschalteten Einträgen der Bauleiste (nur UI-Zustand, nicht gespeichert).
- **K3** Gebäude-Symbole als verkleinerte Silhouette aus `src/render/sprites.ts`.
- **K4** Krisen-Log und Kartenzeichen „Brand"/„Sturm" erst ab der ersten Krisenperiode (11.10).
- **K5** (**Setzung Spec**) Roden und Aufforsten durch Ziehen über mehrere Kacheln wie beim Weg. Ohne K5 wirkt das
  Werkzeug je Klick auf eine Kachel.

## 3. Ausdrücklich nicht in M10

Arbeitskräfte-System (R148 F3 (iii), Backlog) · Erlasse und Politik (Backlog) · fliessende Steuern, gedämpfter
Aufstieg, „Holzfäller braucht Wald" (M11) · weitere Nahrungsquellen (M11) · Nachwachsen des Waldes · Holz aus dem
Roden · Schulbedingung für die Glashütte (würde M8 B1 berühren) · Freischaltung durch Geld oder Forschung · geführtes
Tutorial mit Zwangsschritten · Mouse-over für Figuren auf Wegen · ein Info-Panel für Gelände (Klick auf eine
unbebaute Kachel) · fremde Symbolsätze, Emoji · Mobil-Bedienung · Übersetzung · neue Laufzeit-Abhängigkeiten ·
geänderte Werte in `defs/tiers.ts`, `defs/goods.ts` (inklusive `START_STOCK.tools` 20) und `defs/timing.ts` ·
Änderungen am Controller (`tests/sim/controller.ts`) und an `balance.test.ts`.

## 4. Regeln: Freischaltbaum

### 4.1 Grundsätze (Vorschlag 2.1, verbindlich)

1. **Freischaltung** (monoton, gespeichert in `world.unlocked`) und **Bedingung** (live, an ein stehendes Gebäude
   gebunden, nicht gespeichert) sind getrennt.
2. Das Bedürfnis der Stufe t+1 entsteht, sobald ein Haus der Stufe t voll belegt ist (`planTier` des Controllers).
3. Einmal frei bleibt frei. Ein schrumpfendes Haus oder ein abgerissenes Gebäude sperrt nichts.
4. Die Regel liegt in der Sim: `placeBuilding`, `buy`, `deliverOrder`, `clearForest`, `plantForest`, `setTaxLevel`,
   `setGoodLock`, `setUpgradeStop` liefern bei Sperre `{ ok: false, reason }` und werfen nie. Die UI blendet nur aus,
   was die Sim ohnehin ablehnt (Ausnahme Feuerwache bei Krisen „aus", 4.4).
5. Werte und Texte sind Einträge in `src/sim/defs/unlocks.ts`; kein Schwellwert im Code.

### 4.2 Baum (`src/sim/defs/unlocks.ts`, `UNLOCKS`)

Reihenfolge der Einträge = Reihenfolge in `UNLOCKS` = gespeicherte Reihenfolge in `world.unlocked`.

| Id  | `trigger`                          | `buildings`                                               | `goods`                          | `functions` |
| --- | ---------------------------------- | --------------------------------------------------------- | -------------------------------- | ----------- |
| U0  | `{ kind: 'start' }`                | `house`, `fisher`, `lumberjack`                           | `wood`, `tools`, `stone`, `food` | —           |
| U1  | `{ kind: 'houses', min: 20 }`      | `market`                                                  | —                                | —           |
| U2  | `{ kind: 'tierWish', tier: 2 }`    | `quarry`, `sheepfarm`, `weaver`, `chapel`, `firestation`¹ | `wool`, `cloth`                  | `forest`    |
| U3  | `{ kind: 'tierReached', tier: 2 }` | `townhall` (ab S2; in S1 leer)                            | —                                | `orders`    |
| U4  | `{ kind: 'tierWish', tier: 3 }`    | `canefarm`, `distillery`, `school`                        | `cane`, `rum`                    | —           |
| U5  | `{ kind: 'tierReached', tier: 3 }` | `toolmaker`                                               | —                                | `goodLocks` |
| U6  | `{ kind: 'tierOpen', tier: 4 }`    | `bathhouse`, `glassworks` (M8-Schnittstelle)              | `glass` (M8-Schnittstelle)       | —           |

Weg (R) und Abriss (X) sind keine Gebäude und immer frei. Das Kontor ist in keinem Eintrag (nicht baubar).
¹ `firestation` trägt die Anzeige-Bedingung `onlyWithCrises: true` (4.4).

**Typen (Setzung Spec):** `UnlockId = 'U0' | … | 'U6'`; `UnlockFunction = 'forest' | 'orders' | 'goodLocks'`
(**Abweichung** Vorschlag 6: dort nur `'orders' | 'forest'`; die Ausgabesperre ist eine Funktion von U5 und
braucht einen Namen); `UnlockDef = { id; trigger; buildings; goods; functions; lockText; whenText; notice; tip }`.

**Auslöser-Prädikate** (`src/sim/unlocks.ts`, rein; `houses(w)` = alle Gebäude mit `house`):

| `trigger.kind` | erfüllt, wenn                                                                                                                                              |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `start`        | immer                                                                                                                                                      |
| `houses`       | Zahl der Gebäude mit `defId === 'house'` ≥ `min`                                                                                                           |
| `tierWish`     | ein Haus mit `planTier(h) ≥ tier`; `planTier(h)` = `h.tier + 1`, wenn `h.inhabitants === TIERS[h.tier].maxInhabitants` und `h.tier < tier`, sonst `h.tier` |
| `tierReached`  | ein Haus mit `h.tier ≥ tier`                                                                                                                               |
| `tierOpen`     | M8 `tierLock(w, tier) === null` (M8-Schnittstelle)                                                                                                         |

`tierWish` vergleicht mit `TIERS[t].maxInhabitants`, nicht mit `houseCap` (Steuer „hoch" belegt nur zu 75 %, das
Haus wird also nie voll, 4.6). Das Prädikat ist für `tier ≤ 3` gleich `anyPlan(tier)` des Controllers
(`tests/sim/controller.ts`, Ist-Stand `main`); daraus folgt die Bitgleichheit (9).

**Kette (Setzung Spec):** Die Einträge U2 → U3 → U4 → U5 → U6 bilden eine Kette. Schaltet `tickUnlocks` (oder
`triggeredUnlocks`) einen Eintrag der Kette über seinen **Auslöser** frei, schaltet es alle früheren mit frei. Ein
Eintrag, der nur über ein stehendes Gebäude dazukommt (`deriveUnlocks`, Migration und Szenarien, 8.2), zieht keine
Kette nach; dort kann also ein späterer Eintrag ohne frühere frei sein. U0 ist immer frei, U1 liegt ausserhalb der
Kette.

### 4.3 Ablauf `tickUnlocks(world)`

- **Setzung Spec (Pflicht für die Bitgleichheit):** `tickUnlocks` ist der **letzte Aufruf in `step`**, nach
  `checkWin`. `step` = `tick += 1` → Produktion → Bevölkerung → Steuern → Wirtschaft → Markt → Aufträge → Krisen →
  Sieg → **Freischaltung**. So sieht `tickUnlocks` am Ende von Schritt t genau den Zustand, den der Controller vor
  Schritt t+1 liest (AK-S1-05).
- Wirkung: `unlocked` = Vereinigung aus dem bisherigen `unlocked`, allen Einträgen, deren Prädikat jetzt gilt, und
  deren Kettenvorgängern; sortiert nach `UNLOCKS`. Kein Eintrag wird entfernt.
- Liest nur, schreibt nur `unlocked`; kein Zufall, keine Gleitkommazahl im Zustand.

### 4.4 Abfragen und Sperren

| Funktion (`src/sim/unlocks.ts`, rein) | Liefert                                                                                                                      |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `isUnlocked(w, id)`                   | `w.unlocked.includes(id)`                                                                                                    |
| `entryOfBuilding(defId)`              | Eintrag, der das Gebäude enthält, oder `null` (Kontor)                                                                       |
| `buildLock(w, defId)`                 | `null`, wenn der Eintrag frei ist oder das Gebäude in keinem Eintrag steht; sonst Sperrgrund (4.5). Ersetzt M8 (17)          |
| `goodUnlocked(w, g)`                  | Eintrag mit `g` in `goods` ist frei                                                                                          |
| `functionLock(w, f)`                  | `null` oder Sperrgrund des Eintrags mit `f`                                                                                  |
| `buildingShown(w, defId)`             | `buildLock === null` und (ohne `onlyWithCrises` oder `w.crisisLevel !== 'off'`); Grundlage aller UI-Listen                   |
| `triggeredUnlocks(w)`                 | Ids, deren Prädikat jetzt gilt, plus Kettenvorgänger, plus U0                                                                |
| `deriveUnlocks(w)`                    | `triggeredUnlocks(w)` plus jeder Eintrag, von dessen `buildings` ein Gebäude steht (ohne Kette); für Migration und Szenarien |
| `nextUnlocks(w)`                      | 12.2                                                                                                                         |

**Feuerwache bei Krisen „aus" (Abweichung, Präzisierung Vorschlag 2.2 Fussnote 1):** Die Bedingung wirkt nur auf
die Anzeige (`buildingShown`): Bauleiste, Tastenliste, Meldung, Hilfe. `buildLock` und `canPlace` bleiben für die
Feuerwache unberührt. Grund: Eine Feuerwache ohne Krisen bringt keinen Vorteil (kein entarteter Weg), und
Testszenarien wie `galerie` bauen sie in Welten mit Krisen „aus". Die Taste E zeigt bei Krisen „aus" die Meldung
„Feuerwache: ohne Krisen nicht nötig" (**Setzung Spec**) und wählt kein Werkzeug (11.2).

**Sperren in Sim-Aktionen** (Prüfung jeweils **zuerst**, vor allen anderen Gründen, wie M8 4.3):

| Aktion                       | Sperre                                | Ergebnis bei Sperre                                   |
| ---------------------------- | ------------------------------------- | ----------------------------------------------------- |
| `canPlace`, `placeBuilding`  | `buildLock(w, defId)`                 | `fail(lockText)`, nichts gebucht                      |
| `buy(w, g, n)`               | `goodUnlocked(w, g)`                  | `fail(lockText)`, Geld und Lager unverändert          |
| `sell(w, g, n)`              | **keine** (Präzisierung, siehe unten) | —                                                     |
| `deliverOrder(w)`            | `functionLock(w, 'orders')`           | `fail(lockText)`, Auftrag, Geld und Lager unverändert |
| `clearForest`, `plantForest` | `functionLock(w, 'forest')`           | `fail(lockText)` (6)                                  |
| `setGoodLock`                | `functionLock(w, 'goodLocks')`        | `fail(lockText)` (5.3)                                |

**Verkauf (Präzisierung, R137-Meldung 1):** Der Vorschlag erlaubt den Verkauf, „wenn das Gut frei ist oder im Lager
liegt". `sell` verlangt schon heute Bestand ≥ n; damit ist die Bedingung immer erfüllt, wenn `sell` überhaupt gelingt.
`sell` bleibt deshalb in der Sim **unverändert**; die Regel wirkt nur in der Anzeige des Handels-Panels (11.5).

`tickOrders` bleibt unverändert: Aufträge entstehen ab Tick 600 auch vor U3 (Seed und Periode, kein RNG-Zustand).
Ein Auftrag vor U3 kann nicht geliefert werden und verfällt ohne Kosten.

### 4.5 Texte je Eintrag (Setzung Spec, `defs/unlocks.ts`)

Platzhalter werden aus `defs/` gefüllt: `{min}` aus `trigger.min`, `{max}` aus `TIERS[tier − 1].maxInhabitants`;
Stufennamen stehen wörtlich. Den Wortlaut darf `lead-art` im Rahmen der Anmutung anpassen, den Inhalt nicht.

| Id  | `lockText` (Sim-Grund)                     | `whenText` (Hilfe)                     | `notice` (Grund in der Meldung)              | `tip`                                                                                                       |
| --- | ------------------------------------------ | -------------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| U0  | —                                          | —                                      | —                                            | Wohnhäuser brauchen keinen Weg, Betriebe schon: verbinde sie mit dem Kontor.                                |
| U1  | Erst ab {min} Wohnhäusern                  | sobald {min} Wohnhäuser stehen         | deine Siedlung wächst über das Kontor hinaus | Ein Marktplatz versorgt Wohnhäuser wie das Kontor; er braucht einen Weg.                                    |
| U2  | Erst wenn ein Wohnhaus {max} Pioniere hat  | sobald ein Wohnhaus {max} Pioniere hat | deine Pioniere wollen Siedler werden         | Die Schäferei braucht Weide im Umkreis: rode Wald (C), wenn es eng wird.                                    |
| U3  | Erst mit den ersten Siedlern               | sobald die ersten Siedler einziehen    | die ersten Siedler sind da                   | In der Amtsstube stellst du die Steuer ein. Aufträge am Kontor bringen eine Prämie.                         |
| U4  | Erst wenn ein Wohnhaus {max} Siedler hat   | sobald ein Wohnhaus {max} Siedler hat  | deine Siedler wollen Bürger werden           | Zuckerrohr wächst wie Schafe nur mit Weide im Umkreis.                                                      |
| U5  | Erst mit den ersten Bürgern                | sobald die ersten Bürger einziehen     | die ersten Bürger sind da                    | Der Werkzeugmacher arbeitet nur mit einer Schule in Reichweite. In der Amtsstube sperrst du Güter je Stufe. |
| U6  | M8 `tierLock(w, 4)` („Erst nach dem Ziel") | nach dem Ziel ({WIN_CITIZENS} Bürger)  | (M8-Text, 11.6)                              | Kaufleute brauchen Glas und ein Badehaus.                                                                   |

Damit lauten die Sperrgründe heute: U1 „Erst ab 20 Wohnhäusern", U2 „Erst wenn ein Wohnhaus 4 Pioniere hat", U4
„Erst wenn ein Wohnhaus 8 Siedler hat". **Präzisierung:** Der Vorschlag nennt für `deliverOrder` den Satz „Aufträge
kommen mit den ersten Siedlern"; die Spec nutzt einheitlich `lockText` („Erst mit den ersten Siedlern"), weil die
Auftragskarte vor U3 ohnehin verborgen ist. Kein Text enthält „Tick" (M7:AK-UX-13).

### 4.6 Steuer „hoch" und Fortschritt

Bei wirksamer Steuer „hoch" (nur mit Amtsstube, 5.2) wird kein Haus voll; `tierWish` entsteht nicht, `tierReached`
nicht (Aufstieg gesperrt). Das ist gewollt. `nextUnlocks` meldet es als `taxBlocks: true` (12.2); die Hilfe zeigt
„Steuer ‚hoch' verhindert volle Häuser".

## 5. Regeln: Amtsstube, Ausgabesperre, Aufstiegsstopp, Werkzeugmacher

### 5.1 Amtsstube (`defs/buildings.ts`, `townhall`)

| Merkmal       | Wert                                                    | Herkunft                        |
| ------------- | ------------------------------------------------------- | ------------------------------- |
| Name, Id      | Amtsstube, `townhall` (am **Ende** von `BUILDING_DEFS`) | Vorschlag 9.7; Ort Setzung Spec |
| Grösse        | 2 × 2                                                   | Vorschlag 9.2                   |
| Kosten        | 200 Geld / 15 Holz / 2 Werkzeug / 5 Stein               | Vorschlag 9.2                   |
| Unterhalt     | 20 je 100 Ticks (Tooltip „120 / min")                   | Vorschlag 9.2                   |
| Kategorie     | `public`                                                | Vorschlag 9.7                   |
| Standort      | `site: []`, kein Radius, keine Versorgung, kein Dienst  | Vorschlag 2.3                   |
| brennbar      | `flammable: true`, nicht `stormAffected`                | **Setzung Spec** (wie Kapelle)  |
| Taste         | I                                                       | Vorschlag 2.2                   |
| Freischaltung | U3                                                      | Vorschlag 2.2                   |

- **Höchstens eine (Delta R163, B8):** neues optionales Def-Feld `BuildingDef.maxCount?: { n: number; reason: string }`,
  bei `townhall` `{ n: 1, reason: 'Es gibt schon eine Amtsstube' }`. `canPlace` prüft nach der Sperrprüfung allgemein:
  stehen schon `n` Gebäude dieses Typs (auch brennend oder unverbunden) → `fail(maxCount.reason)`; sonst die
  bisherigen Prüfungen. Keine Abfrage der Id `townhall` in `placement.ts`.
- **Aktiv** (`townhallActive(w)`, **Setzung Spec**): eine Amtsstube steht, ist angebunden (`connected`) und hat
  keinen Ausfall (`outageUntil` fehlt). Gleiche Prüfung wie bei Diensten (`serviceAvailable`), ohne Radius. Grund:
  Jeder Betrieb und Dienst braucht einen Weg; `nextStep` Regel 2 nennt das schon.
- **Grund bei fehlender Wirkung** (`townhallReason(w)`, **Setzung Spec**): keine Amtsstube →
  `'Braucht eine Amtsstube'`; Amtsstube steht, ist aber nicht aktiv → `'Amtsstube wirkt nicht'`. Alle Aktionen der
  Amtsstube (5.2–5.4) liefern diesen Grund.
- **Ort der Logik (Abweichung Vorschlag 6):** `townhallActive`, `effectiveTaxLevel`, `setGoodLock`,
  `setUpgradeStop` liegen in `src/sim/townhall.ts` (neu), nicht in `unlocks.ts`. Grund: Freischaltung und
  Amtsstube sind getrennte Regeln; S2 berührt `unlocks.ts` damit nur für `nextUnlocks` (`taxBlocks`).

### 5.2 Steuer (`effectiveTaxLevel`)

- `effectiveTaxLevel(w)` = `w.taxLevel`, wenn `townhallActive(w)`, sonst `'normal'`. Die gespeicherte Stufe bleibt
  (Vorschlag 2.3, D3).
- **Alle Lesestellen** von `TAX_LEVELS[world.taxLevel]` lesen künftig `TAX_LEVELS[effectiveTaxLevel(world)]`:
  `population.ts` (`upgradeStatus` Wartezeit, `houseCap` Belegung, `totalTaxes` Prozent; Ist-Stand @ 9460ab9 Zeilen 124, 166,
  199), `src/ui/guide.ts` (Steuer-Regel), `src/ui/inspect.ts` (`rest-tax`), `src/ui/hud.ts` (aktive Stufe).
- `setTaxLevel(w, level)` prüft in dieser Reihenfolge (**Setzung Spec**): unbekannte Stufe → `'Ungültige Stufe'`;
  nicht `townhallActive` → `townhallReason(w)`; gleiche Stufe → `'Stufe bereits aktiv'`; Sperrzeit →
  `'Sperrzeit'`. Bei `fail` bleiben `taxLevel` und `taxLockedUntil` unverändert. Werte in `TAX_LEVELS` und
  `TAX_SWITCH_LOCK` bleiben.
- Entartete Strategie „Amtsstube bauen, ‚hoch', abreissen" (Programm §3.8) ist geschlossen: Nach dem Abriss wirkt
  „normal", ohne Abriss-Haken.

### 5.3 Ausgabesperre (S5, `goodLocks`)

- **Daten:** `world.goodLocks: { tier: Tier; good: GoodId }[]`, sortiert nach `tier`, dann nach `GOOD_IDS`-Index,
  ohne Doppelte. Standard `[]`.
- **Wirkt**, wenn `isUnlocked(w, 'U5')` **und** `townhallActive(w)`. Sonst bleiben Sperren gespeichert und wirken
  nicht.
- **Aktion** `setGoodLock(w, tier, good, locked: boolean)` in `townhall.ts`, Prüfreihenfolge (**Setzung Spec**):
  `functionLock(w, 'goodLocks')` → `lockText`; nicht `townhallActive` → `townhallReason(w)`; `tier` keine
  Stufe aus `TIERS` oder `good` nicht in `TIERS[tier].needs` → `'Ungültige Sperre'`. Sonst setzt oder entfernt sie
  den Eintrag und liefert `ok`; ein unveränderter Zustand ist auch `ok` (idempotent, **Setzung Spec**).
- **Wirkung in `consume`** (`population.ts`): Für ein gesperrtes Paar (Stufe des Hauses, Gut) entnimmt das Haus
  nichts; `satisfied[g] = false` sofort, `demand[g] = min(demand + Zuwachs, 1)` (wie leeres Lager). Folge wie heute:
  halbe Steuer (`UNSATISFIED_TAX_FACTOR`), Schrumpfen um 1 je Wachstumstakt bis 1, kein Aufstieg.
- **Wirkung auf den Aufstieg:** Ist (t+1, g) gesperrt und g ein neues Bedarfsgut der Stufe t+1, nennt
  `upgradeStatus` den Grund **„{Gut} für {Stufenname t+1} gesperrt"** (zum Beispiel „Stoff für Siedler gesperrt",
  **Setzung Spec**), eingereiht bei den Gütergründen. Eine Sperre eines nicht neuen Guts blockiert den Aufstieg nicht.
- **Bitgleich:** Ist `goodLocks` leer, läuft `consume` und `upgradeStatus` auf dem heutigen Pfad.

### 5.4 Aufstiegsstopp (Kann K1, `upgradeStops`)

- `world.upgradeStops: Tier[]`, aufsteigend, ohne Doppelte, nur Stufen mit `TIERS[t].upgradeCost !== null`. Standard
  `[]`. Das Feld gehört zu Save v5, auch wenn K1 gestrichen wird (dann schreibt keine Aktion hinein, 8.1).
- Wirkt, wenn `townhallActive(w)`. `upgradeStatus` nennt dann als ersten Grund nach dem M8-Sperrgrund
  „Aufstieg in der Amtsstube angehalten" (**Setzung Spec**).
- `setUpgradeStop(w, tier, stopped)`: nicht `townhallActive` → `townhallReason(w)`; ungültige Stufe →
  `'Ungültige Stufe'`; sonst `ok` (idempotent).

### 5.5 Werkzeugmacher (Freischaltung U5, Bedingung Schule)

- `defs/buildings.ts` `toolmaker.requiresService = 'school'` (neues optionales Feld
  `BuildingDef.requiresService?: ServiceId`). Radius = `school.serviceRadius` (10), kein neuer Wert.
- **Neuer Zustand** `BuildingState` `'noService'` (Delta R163, B8: allgemeiner Name, damit ein späterer Betrieb mit
  anderem `requiresService` keine Migration braucht). Texte nennen den Dienst über `SERVICE_BUILDING[requiresService]`
  („Braucht eine Schule in Reichweite").
  `tickProduction` prüft in dieser Reihenfolge: Ausfall → `burning`; nicht angebunden → `notConnected`;
  `requiresService` und kein `serviceAvailable(world, b, service)` → `noService` (kein Fortschritt, keine
  Entnahme, `progress` bleibt); Sturm; Input → `waitingInput`; Fortschritt. Der Unterhalt läuft weiter
  (`tickEconomy` unverändert).
- `serviceAvailable` gilt Mitte zu Mitte für jedes Gebäude, nicht nur Häuser (Ist-Stand `population.ts` Zeile 59 @ 9460ab9,
  ohne Codeänderung nutzbar).
- Ohne Werkzeugmacher tritt `noService` nie auf (bitgleich).

## 6. Regeln: Wald roden und aufforsten (Sim, Paket F1, H-S1 in M10)

**Dateien:** `src/sim/forest.ts` (neu), `src/sim/defs/forest.ts` (neu), `tests/sim/forest.test.ts` (neu).

| Wert              | Feld (`defs/forest.ts`)   | Wert                                         |
| ----------------- | ------------------------- | -------------------------------------------- |
| Kosten Roden      | `CLEAR_FOREST_COST: Cost` | `{ money: 10, wood: 0, tools: 0, stone: 0 }` |
| Kosten Aufforsten | `PLANT_FOREST_COST: Cost` | `{ money: 20, wood: 0, tools: 0, stone: 0 }` |

**Aktionen** (rein bis auf die Wirkung, `{ ok, reason }`, werfen nie):

- `canClearForest(w, x, y)` / `canPlantForest(w, x, y)`: Prüfung ohne Wirkung (Vorschau und Hinweise).
- `clearForest(w, x, y)`: Wald → Weide (`'forest'` → `'grass'`), bucht `CLEAR_FOREST_COST`.
- `plantForest(w, x, y)`: Weide → Wald (`'grass'` → `'forest'`), bucht `PLANT_FOREST_COST`.

**Prüfreihenfolge** (**Setzung Spec**, Texte aus `placement.ts` wiederverwendet, wo es sie gibt):

1. `functionLock(w, 'forest')` → U2-`lockText` („Erst wenn ein Wohnhaus 4 Pioniere hat").
2. Koordinaten keine ganzen Zahlen oder ausserhalb der Karte → `'Ausserhalb der Karte'`.
3. Kachel mit Gebäude (auch Kontor) oder Weg → `'Bereits bebaut'`.
4. Roden: Gelände ≠ `forest` → `'Kein Wald'`; Aufforsten: Gelände ≠ `grass` → `'Keine Weide'` (Wasser, Sand,
   Gebirge, die jeweils andere Art).
5. `checkAfford` → `'Kein Geld'` (Geld < 0) bzw. `'Zu wenig Geld'`.

Bei `fail` ändert sich nichts an der Welt.

**Regeln:** Roden liefert **kein Holz**. Kein Nachwachsen, keine Erstattung. Kein Zufall. Ein stehender Holzfäller,
dessen Wald gerodet wurde, **arbeitet weiter** (Standortregel nur beim Bau; „braucht Wald" ist M11); Mouse-over warnt
(13.2). Eine stehende Schäferei oder Plantage verliert durch Aufforsten nichts. Der Kreis Roden → Aufforsten kostet
30 und bringt nichts (Vorschlag 9.5). Freischaltung U2; mit „Alles frei" ab Tick 0.

**Cache-Schlüssel (Teil von F1, Delta R163 B7, löst R159 W3 ab):** `layoutKey(world)` in `src/sim/queries.ts` hasht
zusätzlich die **Geländeart jeder Kachel** (in der Kachel-Schleife, die heute schon die Wege hasht). Kein neues
Weltfeld. Der Doc-Kommentar lautet dann „ändert sich bei Bau, Abriss, Weg, Anbindung und Geländewechsel, nicht durch
`step()` allein".

## 7. Terrain-Cache und Darstellung nach Geländewechsel

**Befund (Beobachtung „Terrain-Cache hängt an `layoutKey`", `docs/beobachtungen.md`, 2026-10-02, FB-TRIAGE):**
Heute hängen vier Caches an `layoutKey`: Terrain-Ebene (`src/render/terrain.ts`), Baumstempel in `sortedObjects`
(`src/render/iso.ts`), Abdeckung (`src/render/overlays.ts`) und Weggraph (`src/render/life.ts`). `layoutKey` kennt
kein Gelände. Zusätzlich zeichnet `updateTerrainLayer` nur Kacheln mit geänderter **Belegung** neu (`occupancy`,
`dirtyRect`); das Gelände-Raster `grid` (`buildGrid`, geglättete Felder) wird nur beim Aufbau berechnet.

**Vorgabe:**

1. Kein neues Weltfeld (Delta R163, B7). `layoutKey` hasht die Geländeart je Kachel (F1, 6). Damit verwerfen
   Terrain-, Baum-, Abdeckungs- und Weggraph-Cache ihren Stand nach jedem Geländewechsel ohne eigene Logik. Auch das
   erzwungene Gelände des Controllers (`forceTerrain`) ändert den Schlüssel; das ist ohne Wirkung auf die Sim.
2. **Gelände-feste Caches (Delta R163, B3):** Drei weitere Caches gehen davon aus, dass sich das Gelände nie ändert:
   Tier-Anker in `src/render/wildlife.ts` (Vögel über „Wald oder Weide"), Küstenfeld in `src/render/water.ts` und
   `src/render/life.ts`. Sie bleiben gültig, **weil Forst-Aktionen nur zwischen Wald und Weide wechseln** und die
   Küste nie berühren (Setzung Spec). Jede künftige Geländeänderung anderer Art muss diese Caches neu bewerten. R1
   passt die Code-Kommentare an; AK-R1-05 prüft die Bedingung.
3. `updateTerrainLayer` (R1) erkennt einen Geländewechsel über ein Gelände-Abbild je Kachel (analog `occupancy`) und
   zeichnet das Rechteck der geänderten Kacheln **plus den Rand der Feld-Glättung** neu, inklusive Neuberechnung des
   Rasters in diesem Rechteck. Ein vollständiger Neuaufbau ist **nicht** zulässig (≈ 650 ms bei dpr 2, lead-tech B10);
   erwartet sind ≤ 15 ms je Forst-Aktion (Teil-Neuzeichnung nach Bau heute 3,4–4,3 ms). Messpunkt ist
   `updateTerrainLayer().ms`; arc42 §10 bekommt dazu eine Zeile (R1).
4. Die Baumstempel einer gerodeten Kachel verschwinden, eine aufgeforstete Kachel bekommt Bäume (`sortedObjects`,
   Variante weiter aus `treeVariant(seed, x, y)`).

**Die Beobachtung gilt mit F1 und R1 als gelöst** (AK-F1-08, AK-R1-01, AK-R1-02, AK-R1-05). Die Datei `docs/beobachtungen.md`
ändert diese Spec nicht; den Eintrag schliesst das Paket R1 beim Merge.

## 8. Datenmodell und Save v5

### 8.1 Typen (`src/sim/types.ts`, auf M8 v4 aufbauend)

```ts
export type UnlockId = 'U0' | 'U1' | 'U2' | 'U3' | 'U4' | 'U5' | 'U6';
export type BuildingDefId = /* bestehend inkl. M8 */ 'townhall'; // am Ende
export type BuildingState = /* bestehend */ 'noService';
export interface BuildingDef {
  /* bestehend; M8 `unlockTier` entfällt (17) */
  requiresService?: ServiceId; // Betrieb arbeitet nur mit diesem Dienst in Reichweite (5.5)
  maxCount?: { n: number; reason: string }; // Höchstzahl dieses Typs (5.1, Delta R163 B8)
}
export interface World {
  version: 5; // war 4 (M8)
  /* alle bestehenden Felder unverändert */
  unlocked: UnlockId[]; // Reihenfolge wie UNLOCKS, monoton
  goodLocks: { tier: Tier; good: GoodId }[]; // sortiert (5.3)
  upgradeStops: Tier[]; // aufsteigend (5.4, K1)
}
```

- `createWorld(seed, opts?)` mit `opts.unlockAll?: boolean` (**Setzung Spec**): `version 5`, `unlocked` = `['U0']`
  bzw. alle Ids bei `unlockAll`, `goodLocks []`, `upgradeStops []`. Alles andere wie nach M8;
  `unlockAll` ändert keinen Zufall und kein anderes Feld.

### 8.2 Save v5 (`src/sim/save.ts`)

- `SAVE_VERSION = 5`. `serialize` schreibt immer v5. `deserialize` wirft weiterhin nie.
- Kette: v1 → v2 → v3 → v4 (bestehend, M8-Schnittstelle) → **`migrateV4ToV5(raw)`** → Prüfung. `version` ≠ 5 nach
  der Kette → `'Unbekannte Version'` (auch `version 6`).
- **`migrateV4ToV5`** (Vorschlag 6, präzisiert, Delta R163 B1): setzt `unlocked = ['U0']` (Platzhalter),
  `goodLocks = []`, `upgradeStops = []`, `version = 5` und merkt sich „aus v4 migriert". **Erst nachdem
  `isWellFormed` den Stand angenommen hat**, setzt `deserialize` für einen migrierten Stand
  `unlocked = deriveUnlocks(Welt)` (4.4: Auslöser jetzt erfüllt plus Kettenvorgänger plus jeder Eintrag, dessen
  Gebäude steht). So läuft `deriveUnlocks` nie auf ungeprüften Rohdaten, und `deserialize` wirft weiterhin nie.
  Gebäude, Häuser, `taxLevel`, `taxLockedUntil`, Lager, Auftrag und Krise bleiben unberührt. **Präzisierung:** Ein Eintrag, der nur über ein stehendes Gebäude dazukommt, zieht keine Kette nach
  (sonst schaltete ein früh gebauter Werkzeugmacher Kapelle und Schule frei).
- **Strukturprüfung zusätzlich** (Verstoss → `'Beschädigter Spielstand'`, **Setzung Spec**):
  - `unlocked` ist ein Array aus bekannten Ids, ohne Doppelte, enthält `'U0'`, in `UNLOCKS`-Reihenfolge.
  - `goodLocks` ist ein Array aus Objekten mit `tier` (Schlüssel von `TIERS`) und `good` (in `GOOD_IDS` und in
    `TIERS[tier].needs`), ohne Doppelte, sortiert (5.3).
  - `upgradeStops` ist ein Array aus Stufen mit `upgradeCost !== null`, ohne Doppelte, aufsteigend.
  - Nicht geprüft (bewusst): ob stehende Gebäude freigeschaltet sind (ein Stand mit Schule ohne U4 ist gültig, 18.3).
- `recomputeConnectivity` wie heute. Der `localStorage`-Schlüssel bleibt `inselreich.save.v1`.
- **Laden zeigt keine Freischalt-Meldung** (11.6) und spielt keinen Ton (11.7).
- **Fixture** `tests/sim/fixtures/save-v4.json` (**Setzung Spec**), erzeugt mit dem Sim-Code von `main` ab 9460ab9
  (M8-Sim gemergt, Save v4; die M8-UI-Branches ändern `src/sim/` nicht) **vor M10-S1** als erster Schritt auf `main`: Controller Seed 3, Krisen „normal" mit Feuerwache, angehalten bei Tick
  **4800** (erster Bürger 4750), danach `setTaxLevel(w, 'high')`, dann `serialize`. Bei Tick 4800 läuft der Auftrag
  der Periode 4 (angeboten 4200, fällig 4800). Der Testkommentar nennt Erzeugungs-Commit und Erzeugungsweg.
  `tests/sim/fixtures/` steht in `.prettierignore`.

## 9. Bitgleichheit der Baseline

### 9.1 Behauptung und Nachweis

`balance.test.ts` (Sieg **6050**, `minMoney` **57**) und `balance-crises.test.ts` (Verlauf `OFF_REFERENCE`,
Fingerabdruck `OFF_FINGERPRINT`, Krisen „normal" Sieg **7050**, `minMoney` **56**, Laden mitten im Lauf) bleiben
**ohne Änderung am Test-Code** gleich, bis auf die Normalisierung. Der M8-Szenario-Lauf B1
(`balance-merchants.test.ts`) bleibt gleich (nach dem M8-Merge zu messen, AK-B1-02).

Nachweis am Code (Vorschlag 7, am Ist-Stand `main` geprüft):

| Controller-Handlung                                                | Zeitpunkt                               | Eintrag | frei?                                                     |
| ------------------------------------------------------------------ | --------------------------------------- | ------- | --------------------------------------------------------- |
| Wege, 4 Wohnhäuser, Holzfäller, Fischerhütten                      | `startColony`, ab Tick 0                | U0      | ja                                                        |
| Kapelle; Schäferei, Weberei; Feuerwache (nur „normal")             | `anyPlan(2)` (gleiches Prädikat wie U2) | U2      | ja: `tickUnlocks` am Ende des vorigen `step` sah es (4.3) |
| Schule; Plantage, Brennerei                                        | `anyPlan(3)` (gleiches Prädikat wie U4) | U4      | ja                                                        |
| Kauf Holz, Werkzeug, Stein; Verkauf über `sellSurplus`             | jederzeit                               | U0      | ja; `sell` ohne Sperre (4.4)                              |
| Steuer                                                             | nie geändert                            | —       | `effectiveTaxLevel` = „normal" = `taxLevel`               |
| Marktplatz, Steinbruch, Werkzeugmacher, Amtsstube, Aufträge, Roden | nie                                     | —       | keine Wirkung                                             |
| M8 B1 Phase 3: Badehaus, Glashütte, Glas kaufen                    | nach dem Sieg                           | U6      | ja: `tickUnlocks` nach `checkWin` im Siegtick             |

Weitere Pfade: `canPlace` mit `buildLock === null` läuft wie heute; `consume` und `upgradeStatus` mit leeren
`goodLocks` und `upgradeStops` wie heute; `noService` ohne Werkzeugmacher nie; `layoutKey` ist eine Abfrage, kein
Zustand. Die Messprobe aus Vorschlag 9.1 fand **keinen Bau und keinen Handel vor seinem Auslöser** (engster Abstand
U2 Tick 150, Kapelle Tick 200).

**Einschränkung (Pflicht-Setzung):** Die Bitgleichheit hängt an „`tickUnlocks` ist der letzte Aufruf in `step`".
Läge er früher, sähe der Controller ein volles Haus vor dessen Freischaltung, und `build` würfe „kein freier Platz".
AK-S1-05 hält die Reihenfolge fest.

### 9.2 Fingerabdruck

Die Normalisierung `normalized()` in `tests/sim/balance-crises.test.ts` entfernt zusätzlich `unlocked`,
`goodLocks` und `upgradeStops` und setzt `version` wie bisher auf den Referenzwert (Muster M8 16.1).
Kein Ruling für einen Baseline-Bruch nötig.

### 9.3 Sollwerte der Freischaltung (Messtabelle Vorschlag 9.1)

| Messgrösse (Seed 3)                              | Krisen aus      | „normal" + Feuerwache |
| ------------------------------------------------ | --------------- | --------------------- |
| erster Tick mit U2 / U3 / U4                     | 150 / 350 / 550 | 150 / 350 / 550       |
| erster Tick mit U5                               | 3850            | 4750                  |
| erster Tick mit U6 (= Sieg)                      | 6050            | 7050                  |
| U1                                               | nie             | nie                   |
| erster Bau Kapelle, Schäferei, Weberei           | 200             | 200                   |
| erster Bau Schule, Zuckerrohrplantage, Brennerei | 3700            | 4600                  |

Weicht ein Istwert ab, wird nicht nachgestellt: Meldung an L0 mit Messwerten (R74-Regel).

## 10. Option „Alles frei"

- **Einstellung** `unlockMode: 'stepwise' | 'all'` in `src/ui/settings.ts` (**Setzung Spec** für den Namen),
  Standard `'stepwise'`, geprüft wie `crisisLevel` (unbekannter Wert → Standard). Wirkt nur auf neue Spiele.
- **Menü** „Neue Insel", neben „Krisen": Auswahl mit `aria-label` „Freischaltung für die neue Insel", Optionen
  „Schritt für Schritt (empfohlen)" und „Alles frei" (Vorschlag 8).
- **Wirkung:** `createWorld(seed, { crisisLevel, unlockAll: unlockMode === 'all' })`. Keine Freischalt-Meldung, kein
  Ton; die Hilfe zeigt unter „Als Nächstes" „Alles freigeschaltet".
- **Bedingungen bleiben** (D4): Steuer und Ausgabesperre brauchen die Amtsstube, der Werkzeugmacher die Schule, die
  Feuerwache wird bei Krisen „aus" nicht angezeigt (4.4).
- **Tests:** Szenarien bauen in einer Welt mit `unlockAll` und setzen am Ende `w.unlocked = deriveUnlocks(w)`
  (Helfer `finishUnlocks`, **Setzung Spec**). So zeigt ein Szenario genau das, was ein geladener alter Stand mit
  diesen Gebäuden zeigen würde. Der M8-Helfer `withUnlock` entfällt (M8-Schnittstelle, 17).
- Bestehende Sim-, Render- und UI-Tests, die gesperrte Gebäude in `createWorld(…)` bauen, bekommen
  `{ unlockAll: true }` (bewusst geänderte Tests, Liste im Plan). `balance.test.ts`, `balance-crises.test.ts` und der
  Controller bleiben bei `createWorld(3)` (Schritt für Schritt), damit die Sperren im Referenzlauf wirken.

## 11. Bedienung

Zielplattform Desktop (R78), geprüft bei 1280 × 800 und 1920 × 1080. Alle Zahlen kommen aus `src/sim/defs/` bzw.
den Sim-Abfragen. Texte mit **Setzung Spec** sind Vorgaben; Wortlaut nach Anmutung durch `lead-art`, Inhalt fest.

### 11.1 Bauleiste (U1, Forst-Knöpfe U2)

- Einträge je Kategorie: alle `BUILDING_IDS` ausser `kontor` mit `buildingShown(w, id)`, Reihenfolge `BUILDING_IDS`.
- **Kategorie-Knopf ohne sichtbaren Eintrag ist verborgen** (`hidden`, **Setzung Spec**). Ist die offene Kategorie
  leer, schliesst die Einträge-Leiste.
- Hauptleiste: „Weg · 5 Geld" und „Abriss" immer; ab U2 (bzw. „Alles frei") zusätzlich „Roden · 10 Geld" und
  „Aufforsten · 20 Geld" nach „Abriss" (**Setzung Spec**; Zahlen aus `defs/forest.ts`).
- Zählung (Krisen „normal"; bei „aus" je eine Feuerwache weniger in „Öffentlich"):

| Stand            | Infrastruktur  | Wohnen | Produktion                           | Öffentlich              |
| ---------------- | -------------- | ------ | ------------------------------------ | ----------------------- |
| U0 (neues Spiel) | verborgen      | 1      | 2 (Fischerhütte, Holzfäller)         | verborgen               |
| U0 + U2          | verborgen      | 1      | 5 (+ Steinbruch, Schäferei, Weberei) | 2 (Kapelle, Feuerwache) |
| + U3             | verborgen      | 1      | 5                                    | 3 (+ Amtsstube)         |
| + U4             | verborgen      | 1      | 7 (+ Zuckerrohrplantage, Brennerei)  | 4 (+ Schule)            |
| + U5             | verborgen      | 1      | 8 (+ Werkzeugmacher)                 | 4                       |
| + U6             | verborgen      | 1      | 9 (+ Glashütte)                      | 5 (+ Badehaus)          |
| + U1             | 1 (Marktplatz) | —      | —                                    | —                       |
| „Alles frei"     | 1              | 1      | 9                                    | 5 (Krisen „aus": 4)     |

### 11.2 Tasten (U1; I in S2; C, Q, `?` in U2)

**Prüfstand der Belegung** (`main` @ 9460ab9 plus `feat/m8-ui` @ 6cbdc56): `TOOL_HOTKEYS` R, X, H, K, U, M, F, L, B, G, V, Z, N, T, E
(15) plus M8 J, O (17); `SPEED_KEYS` 1, 2, 3; P (Pause); `PAN_KEYS`/`NAV_KEYS` W, A, S, D, Pfeile, Leertaste, Esc,
Mausrad, Rechtsklick. **Frei und neu belegt:** I (Amtsstube), C (Roden), Q (Aufforsten), `?` (Hilfe). Danach 20
Werkzeugtasten.

- `Tool` (`src/render/renderer.ts`) bekommt `{ kind: 'clearForest' }` und `{ kind: 'plantForest' }`
  (**Setzung Spec**); `toolName` „Roden" bzw. „Aufforsten".
- `?` ist kein Werkzeug: `hotkeyAction` liefert `{ kind: 'help' }` (Shift ist erlaubt; Strg, Cmd, Alt nicht; nicht
  bei offenem Modal oder in Formularfeldern, wie heute).
- **Gesperrte Taste** (M8 `lockedToolText` verallgemeinert, M8-Schnittstelle): `lockedToolText(world, tool)` liefert
  „{Name}: {friendlyReason(Sperrgrund)}" (zum Beispiel „Kapelle: Erst wenn ein Wohnhaus 4 Pioniere hat", „Roden:
  Erst wenn ein Wohnhaus 4 Pioniere hat"), für die Feuerwache bei Krisen „aus" „Feuerwache: ohne Krisen nicht nötig",
  sonst `null`. Art wie M8 (R151 W10): `showMessage(text, 'error')` plus Ton `error`; kein Werkzeug wird gesetzt.
- **Tastenliste** (`hotkeyList(world)`, **Änderung** M7:AK-UX-06: Signatur mit Welt): nur Werkzeuge mit
  `buildingShown` bzw. freier Funktion, dann Tempo 1–3, „P Pause / weiter", „? Hilfe", `NAV_KEYS`. Löst Beobachtung
  „Gesperrtes vor der Freischaltung sichtbar" (a) (R152 B3).

### 11.3 Lager-Chips (U1)

Chip `stock-{g}` sichtbar genau dann, wenn `goodUnlocked(w, g)` **oder** `w.stock[g] > 0`, sonst `hidden`. Neues
Spiel: Holz, Werkzeug, Stein, Nahrung (4). Ersetzt die M8-Regel für `stock-glass` (gleiches Ergebnis vor U6).

### 11.4 Einwohner-Chips (U1)

`pop-1` immer; `pop-2` ab U3, `pop-3` ab U5, `pop-4` ab U6, jeweils auch bei Einwohnern > 0 (**Setzung Spec**).
Ersetzt die M8-Regel für `pop-4` (gleiches Ergebnis).

### 11.5 Handels-Panel und Auftragskarte (U1)

- **Handel:** Zeile je Gut mit `goodUnlocked` oder Bestand > 0; Kaufknöpfe nur bei `goodUnlocked`, Verkaufsknöpfe
  wie heute. Löst Beobachtung (b) (R150).
- **Auftragskarte** (`order.ts`): vor U3 verborgen, auch der Satz „Nächster Auftrag in …". Vor U3 keine
  Auftragsmeldungen („Neuer Auftrag", „Auftrag verfallen") und kein Ton `order`. Läuft bei U3 ein Auftrag, erscheint
  die Karte sofort mit dem heutigen Text „Auftrag: {n} {Gut} · Prämie {p} · noch {Restzeit}".

### 11.6 Freischalt-Meldung (U1, `src/ui/goal.ts`)

- Reine Funktion `unlockNoticeText(prev: readonly UnlockId[], world)` (**Setzung Spec**, ersetzt M8 `unlockNotice`):
  neue Ids = `world.unlocked` ohne `prev`; leer → `null`.
  - Nur U6 neu → M8-Text wörtlich: „Neu freigeschaltet: Badehaus (J) und Glashütte (O) — deine Bürger wollen
    Kaufleute werden".
  - Sonst: „Neu: {Namen} — {notice des letzten neuen Eintrags}. Mehr unter Hilfe (?)". {Namen} = je neuem Eintrag in
    `UNLOCKS`-Reihenfolge die angezeigten Gebäude in `BUILDING_IDS`-Reihenfolge als „{Name} ({Taste})", dann die
    Funktionen („Roden (C)", „Aufforsten (Q)", „Handelsaufträge", „Ausgabesperre"), getrennt durch „, ".
- Texte heute (Krisen „normal"): U2 „Neu: Steinbruch (B), Schäferei (G), Weberei (V), Kapelle (K), Feuerwache (E),
  Roden (C), Aufforsten (Q) — deine Pioniere wollen Siedler werden. Mehr unter Hilfe (?)"; bei Krisen „aus" ohne
  „Feuerwache (E), ". U1 „Neu: Marktplatz (M) — deine Siedlung wächst über das Kontor hinaus. Mehr unter Hilfe (?)".
  U3 „Neu: Amtsstube (I), Handelsaufträge — die ersten Siedler sind da. Mehr unter Hilfe (?)". U4 „Neu:
  Zuckerrohrplantage (Z), Brennerei (N), Schule (U) — deine Siedler wollen Bürger werden. Mehr unter Hilfe (?)". U5
  „Neu: Werkzeugmacher (T), Ausgabesperre — die ersten Bürger sind da. Mehr unter Hilfe (?)".
- `app.ts` hält das Merkfeld `unlockedSeen` (wie `wonShown`): beim Laden und bei „Neu" = `world.unlocked` des
  Stands; je Frame höchstens **eine** Meldung, auch wenn mehrere Ticks oder Einträge in den Frame fallen.
- Art `info`, bleibend bis Schliessen (wie das Siegbanner), mit Knopf „Hilfe", der die Hilfe-Karte öffnet.

### 11.7 Ton (U1)

Neues `SoundEvent` `'unlock'` (**Setzung Spec**): `diffSoundEvents` meldet es einmal je Frame, wenn `unlocked`
wächst; nicht beim Laden, nicht bei „Neu". Fällt `won` in denselben Frame, nur `win`. Klang: Wiederverwendung der
`win`-Datei mit kleinerem Pegel; Wahl und Pegel bei `lead-art` (Vorschlag 3.1).

### 11.8 Steuer in der Kopfzeile und Amtsstuben-Panel (U1 Kopfzeile, U2 Panel)

- **Kopfzeile (Setzung Spec, Präzisierung Vorschlag 5 „Steuer nur mit Amtsstube"):** Der Steuerregler (drei Knöpfe
  und Sperrhinweis) verlässt die Kopfzeile. Ohne aktive Amtsstube ist `.hud-tax` verborgen. Mit aktiver Amtsstube
  zeigt `.hud-tax` einen Knopf `[data-field=tax]` „Steuer {Stufe}" (wirksame Stufe), der die Amtsstube auswählt und
  ihr Panel öffnet. `#hud` ≤ 84 px bei 1280 × 800 (M7:AK-UX-15) in beiden Zuständen.
- **Bilanz-Tooltip:** ohne aktive Amtsstube zusätzlich die Zeile „Steuer: normal (keine Amtsstube)".
- **Ruhe-Ansicht** `rest-tax`: `taxEffect(effectiveTaxLevel(w))`, ohne aktive Amtsstube mit Zusatz „ (keine
  Amtsstube)".
- **Amtsstuben-Panel** (Info-Panel bei Auswahl der Amtsstube, `inspect.ts`):
  - Titel „Amtsstube"; ist sie nicht aktiv, Zeile `[data-field=townhall-state]` „Wirkt nicht: nicht angebunden" bzw.
    „Wirkt nicht: brennt" (**Setzung Spec**).
  - Steuer: drei Knöpfe `[data-tax]` (nie `disabled`, Klick ruft `setTaxLevel`, Ablehnung als Meldung), aktive
    Stufe markiert, Zeile `taxEffect`, Sperrhinweis `[data-field=tax-lock]` wie heute.
  - Sperr-Matrix (ab U5): Zeilen = Stufen mit Einwohnern > 0, Spalten = freigeschaltete Bedarfsgüter dieser Stufe;
    je Zelle ein Knopf `[data-lock="{tier}-{good}"]` mit `aria-pressed`. Vor U5 verborgen.
  - Kann K1: je Stufe mit Aufstieg und Einwohnern > 0 ein Schalter `[data-stop="{tier}"]` „Häuser dieser Stufe
    steigen nicht auf" mit `aria-pressed`.
  - Abriss-Zeile wie bei allen Gebäuden.

### 11.9 Tooltips und Info-Panel (U2)

| Amtsstube                                           | Roden                         | Aufforsten                 |
| --------------------------------------------------- | ----------------------------- | -------------------------- |
| „Amtsstube (I)"                                     | „Roden (C)"                   | „Aufforsten (Q)"           |
| „Kosten: 200 Geld · 15 Holz · 2 Werkzeug · 5 Stein" | „Kosten: 10 Geld"             | „Kosten: 20 Geld"          |
| „Unterhalt: 120 / min"                              | „Wald wird Weide — kein Holz" | „Weide wird Wald"          |
| „Steuer und Ausgabesperre einstellen"               | „Nur auf unbebautem Wald"     | „Nur auf unbebauter Weide" |
| „Brennbar"                                          | —                             | —                          |
| „Standort: frei"                                    | —                             | —                          |
| „Höchstens eine Amtsstube"                          | —                             | —                          |

(**Setzung Spec** für alle Zeilen ausser den Formaten aus M7-UX.)

- **Werkzeugmacher:** Zustandstext `stateInfo` (`texts.ts`) für `noService` „Braucht eine Schule in Reichweite";
  `remedyText` „Baue eine Schule (U) in Reichweite", ist die Schule gesperrt (`buildLock('school') ≠ null`, etwa in
  einem migrierten v4-Stand) „Schule kommt, {whenText von U4}" („Schule kommt, sobald ein Wohnhaus 8 Siedler hat",
  Delta R163 B-3). Kartenzeichen wie `waitingInput` (Vorschlag 2.3).
- **Gründe** (`hints.ts` `REASON_TABLE`, Erweiterung M7:AK-UX-03, **Setzung Spec**): „Es gibt schon eine Amtsstube"
  → „Es gibt schon eine Amtsstube — höchstens eine wirkt"; „Braucht eine Amtsstube" → „Baue zuerst eine Amtsstube (I)"; „Amtsstube wirkt nicht" → „Die Amtsstube wirkt erst mit Weg und ohne Brand"; „Kein Wald" → „Hier ist kein Wald"; „Keine Weide" → „Aufforsten geht nur auf Weide"; alle `lockText`, „{Gut}
  für {Stufe} gesperrt", „Aufstieg in der Amtsstube angehalten", „Ungültige Sperre" → wörtlich. „Erst nach dem Ziel"
  bleibt wie M8 („Erst nach dem Ziel (50 Bürger)").
- **Vorschau der Forst-Werkzeuge:** `placementHint(world, tool, x, y)` liefert für `clearForest`/`plantForest` das
  Ergebnis von `canClearForest`/`canPlantForest`: gültig „Roden: 10 Geld" bzw. „Aufforsten: 20 Geld", sonst
  `friendlyReason`. Ein Klick ruft die Aktion; `fail` zeigt den Grund wie eine Bau-Ablehnung (`error` plus Ton), Erfolg
  spielt `build`.

### 11.10 Krisen-Log und Kartenzeichen (Kann K4, U2)

Krisen-Log und die `MAP_SIGNS`-Zeilen für Brand und Sturm sind sichtbar, sobald `w.crisisLevel !== 'off'` **und**
`w.tick ≥ CRISIS_FIRST_TICK` (**Setzung Spec**, „ab der ersten Krisenperiode"); vorher verborgen.

## 12. Hilfe (U2) und `nextStep` (S1-Filter, U2)

### 12.1 Hilfe-Karte (D8: Umbau „Ziel und erste Schritte")

- `openStartCard(…, { mode: 'help' })` wird zur Hilfe-Karte: Titel „Hilfe", `aria-label` „Hilfe", gleiche Modal- und
  Fokusregeln (M7-UX), Knopf „Weiter spielen". Der Modus `start` bleibt unverändert.
- Öffnen: HUD-Knopf „Hilfe" (vor „Einstellungen" und „Menü" in `.hud-sound`), Taste `?`, Menü-Knopf „Hilfe" (bisher
  „Ziel und erste Schritte", **Setzung Spec**), Knopf „Hilfe" in der Freischalt-Meldung. Esc schliesst, der Fokus
  kehrt zum Öffner zurück.
- Inhalt aus der reinen Funktion `helpSections(world)` (**Setzung Spec**, `src/ui/startCard.ts`), Abschnitte in
  dieser Reihenfolge, je genau eine Quelle (Vorschlag 3.2):

| Abschnitt (`data-field`)          | Quelle und Format                                                                                                                                                                                             |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| „Jetzt tun" (`help-now`)          | `nextStep(world)`                                                                                                                                                                                             |
| „Als Nächstes" (`help-next`)      | je Eintrag aus `nextUnlocks`: „{Namen} — {whenText}" plus „ (jetzt {now} / {need})", wenn Fortschritt bekannt, plus „ · Steuer ‚hoch' verhindert volle Häuser" bei `taxBlocks`; leer → „Alles freigeschaltet" |
| „Ziel und Ausblick" (`help-goal`) | M8 `goalTexts(goalView(world))`: `rest`, darunter `next`, falls nicht `null`                                                                                                                                  |
| „Tipps" (`help-tips`)             | `tip` der freien Einträge in absteigender `UNLOCKS`-Reihenfolge, höchstens 3; danach je freies Gebäude mit Standortregel eine Zeile „{Name}: {siteText}" (Bauleisten-Text)                                    |
| „Kartenzeichen" (`help-signs`)    | `MAP_SIGNS` (mit K4 gefiltert)                                                                                                                                                                                |
| „Erste Schritte" (`help-steps`)   | `startSteps()`, nur solange keine Siedler leben                                                                                                                                                               |

- {Namen} in „Als Nächstes" wie in der Meldung, aber ohne Tasten. Beispiel neues Spiel (Krisen „normal", keine
  Häuser): „Marktplatz — sobald 20 Wohnhäuser stehen (jetzt 0 / 20)" und „Steinbruch, Schäferei, Weberei, Kapelle,
  Feuerwache, Roden, Aufforsten — sobald ein Wohnhaus 4 Pioniere hat (jetzt 0 / 4)".
- **Ruhe-Ansicht:** Zeile „Nächster Schritt" bleibt; darunter `[data-field=help-hint]` „Mehr in der Hilfe (?)".

### 12.2 `nextUnlocks(world)` (S1, `taxBlocks` S2)

Liefert `{ id; names: string[]; when: string; now: number | null; need: number | null; taxBlocks: boolean }[]`:
den ersten nicht freien Eintrag der Kette U2 → U6 und U1, falls nicht frei; Reihenfolge `UNLOCKS`. `names` wie
11.6 ohne Tasten (Feuerwache nur, wenn angezeigt). Fortschritt (**Setzung Spec**): `houses` → Zahl der Wohnhäuser /
`min`; `tierWish t` → grösste Einwohnerzahl eines Hauses der Stufe t−1 (0 ohne solches Haus) / `TIERS[t−1].maxInhabitants`;
`tierReached` → `null`; `tierOpen 4` → `citizens` / `WIN_CITIZENS`. `taxBlocks` = `effectiveTaxLevel(w) === 'high'`
und Auslöser `tierWish` oder `tierReached`.

### 12.3 `nextStep` und `remedyText` (Filter, Änderung M7:AK-UX-08)

- **S1 (Ausnahme `guide.ts`, wie M8:AK-S1-19):** Nennt ein Satz ein Gebäude mit `buildLock ≠ null`, lautet er
  stattdessen „{Name} kommt, {whenText}" (zum Beispiel „Marktplatz kommt, sobald 20 Wohnhäuser stehen",
  **Setzung Spec**). Der M8-Filter (Stufen nur bei `tierLock(w, t + 1) === null`) bleibt.
- **U2:** Steuer-Regel und Kassen-Satz lesen `effectiveTaxLevel`. Kassen-Satz: vor U3 „Deine Kasse schrumpft:
  versorge mehr Wohnhäuser oder verkaufe Waren am Kontor"; ab U3 ohne aktive Amtsstube „Deine Kasse schrumpft:
  versorge mehr Wohnhäuser, verkaufe Waren am Kontor oder baue eine Amtsstube (I)"; mit aktiver Amtsstube wörtlich
  wie heute („… oder erhöhe die Steuer").
- `remedyText`: „oder baue {Name} ({Taste})" nur bei `buildLock === null` (Holzfäller `storageFull` vor U5 →
  „Verkaufe Holz am Kontor"); `noService` → „Baue eine Schule (U) in Reichweite" bzw. bei gesperrter Schule
  „Schule kommt, sobald ein Wohnhaus 8 Siedler hat" (11.9). Kein Satz enthält „Tick".

## 13. Mouse-over (U3, S9)

### 13.1 Ablauf

- Reine Funktion `hoverInfo(world, tile, timeMs, extra)` in `src/ui/hover.ts` (neu, DOM-frei, Vitest unter
  `tests/ui/`) liefert `{ title: string; lines: string[] } | null`, `lines.length ≤ 3`. `extra` (**Setzung Spec**):
  `{ ship: boolean; animal: string | null }`, ermittelt in `app.ts` über das Picking des Renderers und
  `wildlifeAt(world, range, timeMs, env)` (M9 H-R2, gemergt) mit **derselben `timeMs` und derselben `env`**
  (`phase`, `weather`, `reduce`) wie der Renderer im Frame (Delta R163 B6), sonst nennt der Mouse-over Tiere, die
  nicht gezeichnet sind.
- Anzeige als Karte am Zeiger nach **400 ms** Ruhe über derselben Kachel; verschwindet bei Wechsel der Kachel, beim
  Ziehen, bei offenem Modal. **Nur mit dem Auswahl-Werkzeug** (bei jedem anderen Werkzeug zeigt `placementHint`
  den Grund). Die Karte bleibt im Fenster (kein Überlauf am Rand).
- Priorität: Tier > Schiff > Gebäude > Gelände (Picking wie `pickBuilding`/`targetTile`, Verdeckung ISO §10).

### 13.2 Inhalte (Setzung Spec, Vorschlag 4)

| Objekt        | `title`                                                       | `lines`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Wohnhaus      | „Pionierhaus", „Siedlerhaus", „Bürgerhaus", „Kaufmannshaus"   | „Einwohner {n} / {max}"; erste Diagnose („{Gut} fehlt", „{Gebäude} fehlt in Reichweite", „Ausserhalb der Versorgung") oder „zufrieden"; „Aufstieg bereit" oder „Aufstieg: {friendlyReason(erster Grund)}" (höchste Stufe: keine dritte Zeile)                                                                                                                                                                                                                                                                                               |
| Betrieb       | Name                                                          | Zustand: `ok` „arbeitet — {600 / cycle} {Gut} / min"; `waitingInput` „wartet auf {Güter aus `missingInputs`, mit „und"}"; `storageFull` „Lager voll"; `noService` „braucht eine Schule in Reichweite"; `burning` „brennt"; `notConnected` „nicht angebunden". Holzfäller ohne Wald im Standortradius zusätzlich „kein Wald mehr in der Nähe"                                                                                                                                                                                                |
| Dienst        | Name                                                          | Kapelle, Schule, Badehaus: „versorgt {n} Häuser" (Wohnhäuser mit Mittenabstand ≤ `serviceRadius`; 0, wenn nicht angebunden oder brennend, dann zweite Zeile mit dem Zustand); Feuerwache: „schützt {protectedCount} Gebäude"                                                                                                                                                                                                                                                                                                                |
| Amtsstube     | „Amtsstube"                                                   | „Steuer: {wirksame Stufe}"; „Sperren: {Zahl goodLocks}"; „Klicken zum Einstellen" bzw. „Wirkt nicht: …"                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Kontor, Markt | Name                                                          | „Versorgung im Radius {supplyRadius}"; Kontor zusätzlich „Handel: klicken"                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Weg           | „Weg"                                                         | „Verbindet Betriebe mit dem Kontor"                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Gelände       | „Wald", „Weide", „Sand", „Gebirge", „Wasser"                  | (1) „Gut für {Namen}" aus angezeigten Gebäuden: Wald → Holzfäller; Weide → Wohnhaus (nur im Versorgungsgebiet), Schäferei, Zuckerrohrplantage; Sand → Wohnhaus (nur im Versorgungsgebiet); Gebirge → Steinbruch daneben; Wasser → Fischerhütte an der Küste; Landkachel mit Wasser daneben zusätzlich Fischerhütte; ohne Namen keine Zeile. (2) unbebauter Wald „Roden: {Kosten} Geld", unbebaute Weide „Aufforsten: {Kosten} Geld", nur bei freier Funktion `forest`. (3) Landkachel ausserhalb der Versorgung „Ausserhalb der Versorgung" |
| Schiff        | „Händlerschiff"                                               | „Kauft und verkauft am Kontor"; ab U3 mit Auftrag „Auftrag: {n} {Gut}, noch {Restzeit}"                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Tier          | Name aus `wildlifeAt` („Wal", „Fischschwarm", „Vogelschwarm") | keine                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |

**Barrierefreiheit (Präzisierung Vorschlag 4):** Mouse-over ist Zusatz. Für Gebäude und Schiff stehen dieselben
Inhalte im Info-Panel bzw. Handel (Klick). Für Gelände und Tiere gibt es in M10 kein Panel (Nicht-Scope); die
Gelände-Inhalte (Nutzen, Kosten) stehen in Tooltips der Bauleiste und in der Hilfe (Tipps). Offener Punkt 4.

## 14. Symbole Schritt 1 (A1 Gestaltung, U4 Einbau)

- `src/ui/icons.ts` (neu): `ICON_IDS` mit genau **24** Symbolen (**Setzung Spec**, Vorschlag ≈ 25): 9 Güter (`wood`,
  `tools`, `stone`, `food`, `wool`, `cloth`, `cane`, `rum`, `glass`), 4 Stufen (`tier-1` … `tier-4`, Figur mit 1–4
  Merkmalen), `money`, `balance`, `tax`, `faith`, `school`, `bath`, `help`, 4 Kategorien (`cat-infrastructure`,
  `cat-housing`, `cat-production`, `cat-public`). Je Symbol `{ label: string; paths: string[]; color: PaletteKey }`.
- Prozedural als SVG-Pfade, Farben nur aus `PALETTE`, keine fremden Dateien, kein `url(`, kein `href`, kein Emoji
  (D5). `iconSvg(id)` liefert ein `<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">`; das Symbol ist
  Schmuck, der zugängliche Name sitzt am Träger.
- **Regel für jeden Träger (Setzung Spec):** Weicht ein sichtbarer Name einem Symbol, trägt das Element
  `aria-label` = bisheriger `textContent` **wörtlich** und `title` wie bisher (oder den Namen, wo es keinen gab).
  So bleiben M7-Barrierefreiheit und Tests über den zugänglichen Namen gültig; Tests über `textContent` ändern sich
  bewusst (Abschnitt 20).

| Ort                        | sichtbar                                                               | zugänglicher Name (`aria-label`)               |
| -------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------- |
| Lager-Chip                 | Symbol, Bestand, Pfeil                                                 | „{Gut} {Bestand} {Pfeil}" (bisheriger Text)    |
| Einwohner-Chip             | Stufen-Symbol, Zahl                                                    | „{Stufe} {Zahl}"                               |
| Geld, Bilanz, Steuer-Knopf | Münze / Waage / Steuer-Symbol, Wert                                    | bisheriger Text                                |
| Kategorie-Reiter           | Kategorie-Symbol                                                       | Kategoriename; `title` = Kategoriename         |
| Bau-Eintrag                | Symbol der Kategorie (K3: Silhouette), Kosten                          | „{Name} · {n} Geld" (heute schon `aria-label`) |
| Info-Panel Haus            | Bedarfe als Symbole mit ✓ / ✗; darunter Zeile zum ersten fehlenden Gut | Gutname je Symbol                              |
| Meldung, Hilfe             | Symbol vor jedem Gebäude- bzw. Gutnamen                                | `textContent` unverändert (Symbol ohne Text)   |

## 15. Werte je Zieldatei

| Ort                                  | Feld                                                 | Wert                                                            |
| ------------------------------------ | ---------------------------------------------------- | --------------------------------------------------------------- |
| `src/sim/defs/unlocks.ts` (neu)      | `UNLOCKS`                                            | 4.2, Texte 4.5                                                  |
| `src/sim/defs/unlocks.ts`            | U1 `trigger.min`                                     | **20** (D10)                                                    |
| `src/sim/defs/buildings.ts`          | `townhall`                                           | 5.1 (200 / 15 / 2 / 5, Unterhalt 20, 2 × 2, `public`, brennbar) |
| `src/sim/defs/buildings.ts`          | `toolmaker.requiresService`                          | `'school'`                                                      |
| `src/sim/defs/buildings.ts`          | `bathhouse.unlockTier`, `glassworks.unlockTier` (M8) | entfallen (U6)                                                  |
| `src/sim/defs/forest.ts` (neu)       | `CLEAR_FOREST_COST`, `PLANT_FOREST_COST`             | Geld 10 / 20, sonst 0                                           |
| `src/sim/defs/goods.ts`              | `START_STOCK.tools`                                  | 20 (unverändert, Hebel D9 siehe 21)                             |
| `src/sim/defs/tiers.ts`, `timing.ts` | alle                                                 | unverändert                                                     |

Keine Zahl der Spec steht im Code; Texte mit Zahlen nutzen Platzhalter (4.5). Jede Änderung in `src/sim/defs/`
muss `balance.test.ts` grün lassen (AK-S1-16).

## 16. Tick-Reihenfolge und Aktionen (Übersicht)

`step(world)`: `tick += 1` → `tickProduction` (mit `noService`) → `tickPopulation` (wirksame Steuer, `goodLocks`,
`upgradeStops`) → `tickTaxes` (wirksame Steuer) → `tickEconomy` → `tickMarket` → `tickOrders` → `tickCrises` →
`checkWin` → **`tickUnlocks`**.

| Funktion                                                                                                                                      | Modul                      | Art                             | Paket  |
| --------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- | ------------------------------- | ------ |
| `tickUnlocks`, `isUnlocked`, `buildLock`, `goodUnlocked`, `functionLock`, `buildingShown`, `triggeredUnlocks`, `deriveUnlocks`, `nextUnlocks` | `unlocks.ts` (neu)         | neu, rein bis auf `tickUnlocks` | S1     |
| `migrateV4ToV5`                                                                                                                               | `save.ts`                  | neu                             | S1     |
| `canPlace`, `placeBuilding`                                                                                                                   | `placement.ts`, `build.ts` | Sperre zuerst; eine Amtsstube   | S1, S2 |
| `buy`, `deliverOrder`                                                                                                                         | `trade.ts`, `orders.ts`    | Sperre zuerst                   | S1     |
| `townhallActive`, `effectiveTaxLevel`, `setGoodLock`, `setUpgradeStop`                                                                        | `townhall.ts` (neu)        | neu                             | S2     |
| `setTaxLevel`                                                                                                                                 | `tax.ts`                   | braucht aktive Amtsstube        | S2     |
| `consume`, `upgradeStatus`, `houseCap`, `totalTaxes`                                                                                          | `population.ts`            | wirksame Steuer, Sperren        | S2     |
| `tickProduction`                                                                                                                              | `production.ts`            | `noService`                     | S2     |
| `clearForest`, `plantForest`, `canClearForest`, `canPlantForest`                                                                              | `forest.ts` (neu)          | neu                             | F1     |
| `layoutKey`                                                                                                                                   | `queries.ts`               | hasht die Geländeart je Kachel  | F1     |

## 17. Schnittstellen zu M8 (kann sich bis zum M8-Merge ändern)

**Regel:** Nach dem M8-Merge gleicht `lead-design` diese Spec per **Delta** gegen den gemergten M8-Stand ab (Namen,
Signaturen, Texte, AK-Nummern). Weicht M8 ab, gilt der M8-Stand, und das Delta passt die betroffenen Stellen hier an;
Werte und Regeln von M10 ändern sich dadurch nicht ohne Gate.

| M8-Stelle (Stand M8-Spec)                                                                                                                                 | M10                                                                                                                                                           |
| --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `buildLock(world, defId)` in `placement.ts` aus `tierLock(world, def.unlockTier)`                                                                         | Quelle wird `world.unlocked` (`unlocks.ts`); `placement.ts` re-exportiert `buildLock`, damit M8-Importe gültig bleiben. U6-Sperrgrund bleibt `tierLock(w, 4)` |
| `BuildingDef.unlockTier`, `bathhouse`/`glassworks.unlockTier: 4`                                                                                          | entfällt; ersetzt durch Eintrag U6                                                                                                                            |
| `tierLock(world, 4)` (`population.ts`)                                                                                                                    | Prädikat `tierOpen` von U6; unverändert genutzt                                                                                                               |
| `unlockNotice(wasLocked, world)` (`goal.ts:107` @ 6cbdc56), `UNLOCK_NOTICE` (`goal.ts:99`), Text „Neu freigeschaltet: Badehaus (J) und Glashütte (O) — …" | ersetzt durch `unlockNoticeText(prev, world)`; der Text ist die Meldung von U6, wörtlich                                                                      |
| `lockedToolText(world, defId)` (`goal.ts:112` @ 6cbdc56)                                                                                                  | verallgemeinert auf `lockedToolText(world, tool)` inklusive Forst-Werkzeuge und Feuerwache bei Krisen „aus"                                                   |
| `goalTexts(view)`, `goalView(world)`                                                                                                                      | unverändert; Quelle des Hilfe-Abschnitts „Ziel und Ausblick"                                                                                                  |
| `src/ui/guide.ts` `nextStep` mit M8-Filter (M8 14.8)                                                                                                      | bleibt; M10-Filter zusätzlich (12.3)                                                                                                                          |
| `hotkeyList()` (M7:AK-UX-06), Tasten J, O                                                                                                                 | `hotkeyList(world)`; J und O bleiben belegt                                                                                                                   |
| `initialUnlockShown(world)` (`goal.ts:102` @ 6cbdc56), Merkfeld `state.unlockShown` (`app.ts:84`, gesetzt `app.ts:181`, gelesen `app.ts:380`)             | ersetzt durch das Merkfeld `unlockedSeen` (11.6); beide entfallen (Delta R163 B5)                                                                             |
| `MAP_SIGNS` (`guide.ts:167` @ 6cbdc56, Konstante)                                                                                                         | bleibt Konstante; K4 braucht eine Filterfunktion (11.10)                                                                                                      |
| Helfer `withUnlock` in `tests/sim/scenarios.ts`                                                                                                           | entfällt; `createWorld(…, { unlockAll: true })` plus `finishUnlocks` (10)                                                                                     |
| HUD-Regeln `stock-glass` und `pop-4` (M8 14.1)                                                                                                            | verallgemeinert (11.3, 11.4), gleiches Ergebnis                                                                                                               |
| Save v4, `migrateV3ToV4`, Fixture `save-v3.json`                                                                                                          | Kette v3 → v4 → v5; neue Fixture `save-v4.json` nach dem M8-Merge (8.2)                                                                                       |
| `normalized()` mit M8-Feldern (M8 16.1)                                                                                                                   | zusätzlich `unlocked`, `goodLocks`, `upgradeStops` (9.2)                                                                                                      |
| M8 B1 `balance-merchants.test.ts`, `merchantsController.ts`                                                                                               | Messung nach dem M8-Merge (AK-B1-02); Merchant-Controller baut nach dem Sieg, also nach U6                                                                    |
| Reihenfolge `BUILDING_IDS` nach M8 (…, `firestation`, M8-Ids)                                                                                             | `townhall` am Ende                                                                                                                                            |

## 18. Abnahmekriterien

Vitest-Kriterien laufen in CI (`make test`). **Browser-Checks** prüft `lead-qa` im Dev-Server in Chrome per CDP bei
**1280 × 800 und 1920 × 1080** (R78), Echtzeit höchstens 1 Minute plus ein Lauf bei 4× (R65). Messbar heisst: Text
per `textContent` oder `aria-label` eines `data-field`, Zählung per `querySelectorAll` ohne `hidden`, Überlauf per
`scrollWidth ≤ clientWidth`, Welt-Werte per Dev-Werkzeug. Wo ein Urteil nötig ist, ist der Urteiler benannt. Kein
Text der UI enthält „Tick" (M7:AK-UX-13).

### 18.1 Szenario-Saves für Browser-Checks (B1)

Seed 3, Krisen „off", wenn nicht anders genannt; gebaut mit `unlockAll`, am Ende `finishUnlocks` (10). Erzeugung
und Laden wie M8 18.1 (`SCENARIO_OUT=<ordner> npx vitest run tests/sim/scenario-saves.test.ts`, pausieren, per CDP
`localStorage.setItem('inselreich.save.v1', <json>)`, „Laden"). „1 vor dem Wachstumstakt" heisst `tick = 50 · n − 1`.

**Prüfpunkte (Delta R163 B-1):** Alle Szenarien nutzen das Gelände und die Lage aus `prepareLayout` (Kontor bei
`(kx, ky)`, wie der Controller). Die Koordinaten unten sind relativ zum Kontor. `scenario-saves.test.ts` schreibt je
Szenario neben das JSON eine Datei `<name>.probes.json` mit den **absoluten** Kachel-Koordinaten jedes benannten
Prüfpunkts (Name → `{ x, y }`); Browser-Checks klicken und zeigen nur auf diese Punkte. AK-B1-03 prüft, dass jeder
Prüfpunkt existiert und das genannte Objekt bzw. Gelände trägt.

| Szenario                | Prüfpunkte (relativ zu `(kx, ky)`)                                                                                                                                                                        |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `m10-start`             | `kontor` (0, 0)                                                                                                                                                                                           |
| `m10-pionier-fast-voll` | `haus3` (+3, −2) mit 3 EW                                                                                                                                                                                 |
| `m10-siedler-fast`      | `haus-voll` (+3, −2), `kapelle` (+6, −2)                                                                                                                                                                  |
| `m10-wald`              | `wald` (+20, −7) unbebauter Wald; `weide` (+12, −3) unbebaute Weide; `holzfaeller` (+19, −5) angebunden, Wald (+20, …) im Radius 2                                                                        |
| `m10-amtsstube`         | `amtsstube` (+11, −7) angebunden; `schule` (+6, +1); `werkzeug-mit` (+11, +1), Mittenabstand zur Schule 5; `werkzeug-ohne` (+17, +6), Mittenabstand > 10; Häuser auf den vier Hausplätzen des Controllers |
| `m10-amtsstube-aus`     | `amtsstube` (+3, −6) ohne Weg; sonst wie `m10-amtsstube`                                                                                                                                                  |
| `m10-krise-bald`        | `kontor` (0, 0)                                                                                                                                                                                           |
| `galerie`               | je Gebäudetyp ein Prüfpunkt `<defId>` (Lage schreibt der Test aus dem gebauten Stand)                                                                                                                     |

| Szenario                | Inhalt                                                                                                                                                                                                             | genutzt von                                                               |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| `m10-start`             | `createWorld(3)`, Krisen „normal", Tick 0, `unlocked ['U0']`                                                                                                                                                       | AK-U1-01, -02, -03, -04, -05, -06, -11, AK-U2-03, -04, -05, AK-U4-01, -02 |
| `m10-pionier-fast-voll` | 4 Pionierhäuser, eines mit 3 EW, alle versorgt und zufrieden, Nahrung 30, Krisen „normal", 1 vor dem Wachstumstakt, `unlocked ['U0']`                                                                              | AK-U1-09, AK-U2-05                                                        |
| `m10-siedler-fast`      | U0, U2; Kapelle angebunden; ein volles Pionierhaus seit ≥ 300 Ticks zufrieden, Stoff 5, Geld 2000, Holz 20, Werkzeug 10; Auftrag aktiv (angeboten 1500, fällig 2100); **Tick 1549** (1 vor dem Wachstumstakt 1550) | AK-U1-07, AK-U1-09                                                        |
| `m10-wald`              | U0, U2; Waldkachel und Weide (Prüfpunkte), ein Holzfäller angebunden, Geld 500                                                                                                                                     | AK-U2-06, AK-R1-03, AK-U3-05                                              |
| `m10-amtsstube`         | U0–U5; Pionier-, Siedler- und Bürgerhäuser bewohnt; Amtsstube angebunden; Stoff 2; ein Werkzeugmacher mit Schule in Reichweite, einer ohne                                                                         | AK-U1-11, AK-U2-08, AK-U2-09, AK-U3-04                                    |
| `m10-amtsstube-aus`     | wie `m10-amtsstube`, Amtsstube ohne Weg; `taxLevel 'high'`                                                                                                                                                         | AK-U1-11, AK-U1-13, AK-U2-08                                              |
| `m10-krise-bald`        | `createWorld(3)` mit Krisen „normal", Tick **2399** (1 vor `CRISIS_FIRST_TICK`), nur das Kontor, `unlocked ['U0']`                                                                                                 | AK-U2-11                                                                  |
| `galerie` (bestehend)   | jeder `BUILDING_IDS`-Typ inklusive Amtsstube; `finishUnlocks` (alle Einträge mit stehenden Gebäuden)                                                                                                               | AK-U3-04, AK-R1-04, AK-U4-03                                              |

### 18.2 Nutzer-Playtest (keine Abnahmekriterien)

- **P-01** (D10, R155, Prüfpunkt im Spec-Gate) „Hat dir der Marktplatz gefehlt, bevor du 20 Wohnhäuser hattest?"
  Bei Ja: Wert U1 `trigger.min` 8 (Empfehlung `design-economy-designer`) als Ruling-Vorschlag. U1 bleibt bis dahin
  bei 20 (R163); ein späteres Ruling nennt das AK-Delta: AK-S1-01, AK-S1-03, AK-S1-10, AK-B1-01, AK-U2-01, AK-U2-05.
- **P-02** (D9) „War der Anfang zäh, weil Werkzeug nur über den Kauf kam?" Bei Ja: Hebel „Werkzeugmacher bei U4 statt
  U5" (bitgleich, Defs-Wert, Vorschlag 9.4).
- **P-03** (Risiko dichter Anfang) „Waren die drei Meldungen in den ersten ein bis zwei Minuten zu viel?"
- **P-04** „Hast du die Hilfe (?) und den Mouse-over gefunden und genutzt?"

### S1 — Freischalt-Sim, Save v5, Option „Alles frei" (Sim-Teil), Fingerabdruck

- **AK-S1-01** (Vitest, Defs) `UNLOCKS` hat 7 Einträge U0 … U6 in dieser Reihenfolge mit `trigger`, `buildings`,
  `goods`, `functions` wie 4.2 (U3 `buildings` in S1 leer); U1 `trigger.min` 20. Jede `BuildingDefId` ausser
  `kontor` steht in genau einem Eintrag, jede `GoodId` in genau einem, jede `UnlockFunction` in genau einem.
  `firestation` trägt `onlyWithCrises: true`. Jeder Eintrag ausser U0 hat nicht leere `lockText`, `whenText`,
  `notice`; jeder hat `tip`; kein Text enthält „Tick". Die Platzhalter liefern „Erst ab 20 Wohnhäusern", „Erst wenn
  ein Wohnhaus 4 Pioniere hat", „Erst wenn ein Wohnhaus 8 Siedler hat".
- **AK-S1-02** (Vitest) `createWorld(3)`: `version 5`, `unlocked ['U0']`, `goodLocks []`, `upgradeStops []`; kein
  Feld `terrainRev`. `createWorld(3, { unlockAll: true })`: `unlocked` = alle 7 Ids in Reihenfolge; `serialize` beider
  Welten ist bis auf `unlocked` gleich.
- **AK-S1-03** (Vitest, Auslöser) Nach je einem `step`: vier Pionierhäuser, eines mit 4 EW → `unlocked` enthält U2,
  mit höchstens 3 EW nicht; ein Siedlerhaus (Stufe 2) → U2 und U3; ein Bürgerhaus → U2, U3, U4, U5; ein voll
  belegtes Siedlerhaus (8 EW) → U4; 20 Wohnhäuser → U1, 19 → nicht; `won true` (M8, `tierLock(w, 4) === null`) →
  U6 und U2 … U5. `unlocked` ist stets in `UNLOCKS`-Reihenfolge und ohne Doppelte.
- **AK-S1-04** (Vitest, monoton) Nach U2 schrumpft das Haus auf 1 EW, dann werden alle Häuser abgerissen: `unlocked`
  enthält U2 nach 200 weiteren Schritten.
- **AK-S1-05** (Vitest und Review, Reihenfolge in `step`) (a) Ein Pionierhaus erreicht 4 EW im Wachstumstakt von
  Schritt t: `unlocked` enthält U2 **direkt nach** Schritt t (nicht erst nach t+1). (b) Im Schritt t erreicht
  die Bürgerzahl `WIN_CITIZENS`: direkt nach Schritt t gilt `won true` **und** `unlocked` enthält U6. (c) Review:
  `step` in `src/sim/tick.ts` ruft `tickUnlocks` als letzten Aufruf nach `checkWin`; arc42 §6 nennt die Stelle; der
  Nachtrag zu ADR-005 (lead-tech, S1) nennt `tickUnlocks` als letzten Aufruf in `step` mit Begründung Bitgleichheit,
  die Trennung „Freischaltung gespeichert, Bedingung live" und den Zustand `noService` (Delta R163 B4).
- **AK-S1-06** (Vitest, Bausperre) Neue Welt, freier angebundener Platz: `buildLock(w, 'chapel')` = „Erst wenn ein
  Wohnhaus 4 Pioniere hat"; `canPlace` → `{ ok: false, reason: 'Erst wenn ein Wohnhaus 4 Pioniere hat' }` auch auf
  Wasser (Sperre zuerst); `placeBuilding` → `ok false`, Geld und Lager unverändert. Je ein Fall: `market` „Erst ab 20
  Wohnhäusern", `school` „Erst wenn ein Wohnhaus 8 Siedler hat", `toolmaker` „Erst mit den ersten Bürgern",
  `bathhouse` „Erst nach dem Ziel". Nach U2 ist `buildLock(w, 'chapel')` `null` und der Bau gelingt. `buildLock` für
  `house`, `fisher`, `lumberjack`, `kontor` ist immer `null`.
- **AK-S1-07** (Vitest, stehende Gebäude) Eine Schule, roh in eine Welt ohne U4 gesetzt, versorgt Häuser wie heute,
  lässt sich abreissen (Erstattung wie heute); ein zweiter Bau scheitert mit dem U4-Grund.
- **AK-S1-08** (Vitest, Handel) Neue Welt: `buy(w, 'wool', 1)` → `fail('Erst wenn ein Wohnhaus 4 Pioniere hat')`,
  Geld und Lager unverändert; `buy(w, 'wood', 1)` ok. Wolle 5 im Lager vor U2: `sell(w, 'wool', 5)` ok mit dem Erlös
  aus `sellPrice`; `sell(w, 'wool', 6)` → `'Nicht genug Ware'`. Nach U2 gelingt `buy(w, 'wool', 1)`.
- **AK-S1-09** (Vitest, Aufträge) Ohne Siedler bei Tick 600: `world.order` ist gesetzt (wie heute); mit genug Ware
  liefert `deliverOrder` `fail('Erst mit den ersten Siedlern')`, Auftrag, Geld und Lager unverändert. Mit U3 gelingt
  die Lieferung. `tickOrders` erzeugt in beiden Welten dieselben Aufträge.
- **AK-S1-10** (Vitest, `nextUnlocks`) Neue Welt mit vier Pionierhäusern (3, 2, 1, 1 EW): genau zwei Einträge, U1
  mit `now 4`, `need 20` und U2 mit `now 3`, `need 4`, `names` von U2 = „Steinbruch", „Schäferei", „Weberei",
  „Kapelle", „Feuerwache", „Roden", „Aufforsten" bei Krisen „normal", ohne „Feuerwache" bei „off"; `taxBlocks false`.
  Nach U2 ist der Ketteneintrag U3 mit `now null`. Mit `won false` und allen Einträgen ausser U6: U6 mit `now` =
  `citizens`, `need 50`. Mit `unlockAll`: `[]`.
- **AK-S1-11** (Vitest, Round-trip v5) `deserialize(serialize(w))` gleich `w` für eine Welt mit
  `unlocked ['U0', 'U2', 'U3']`, `goodLocks [{ tier: 2, good: 'cloth' }]`, `upgradeStops [1]`.
- **AK-S1-12** (Vitest, Migration v4) `save-v4.json` lädt `ok`: `version 5`,
  `unlocked ['U0', 'U2', 'U3', 'U4', 'U5']`, `goodLocks []`, `upgradeStops []`, `taxLevel 'high'`; Gebäude, Lager, Geld, Tick,
  `taxLockedUntil`, `sellPct`, `order`, `crisisLevel`, `crisis`, `won`, `wonMerchants` gleich wie im Fixture. Ohne
  Amtsstube ist `effectiveTaxLevel` „normal" (ab S2 prüfbar, AK-S2-04). Der Testkommentar nennt Erzeugungs-Commit
  und -weg.
- **AK-S1-13** (Vitest, Kette) `save-v3.json` (4 Wohnhäuser, kein Marktplatz, Häuser der Stufe 3, `won false`)
  lädt über v4 nach v5 mit `unlocked` genau `['U0', 'U2', 'U3', 'U4', 'U5']` (Delta R163 B-8). `save-v1.json` und `save-v2.json` laden über alle Migrationen mit `version 5` und den v5-Feldern
  aus `deriveUnlocks`.
- **AK-S1-14** (Vitest, Migration je Fall, synthetische v4-Stände) (a) vier Pionierhäuser mit 1 EW → `['U0']`;
  (b) ein volles Pionierhaus → `['U0', 'U2']`; (c) ein Werkzeugmacher steht (angebunden, Holz 10,
  `progress 20`), nur Pioniere, keine Schule → `['U0', 'U5']` (ohne Kette); danach 100 Schritte: Zustand
  `noService`, `progress 20`, Holz 10, Werkzeug unverändert (Delta R163 B-3); (d) ein Marktplatz steht → enthält U1; (e) 20 Wohnhäuser → enthält U1; (f) `won true`, keine Bürgerhäuser
  mehr → U2 … U6; (g) Krisen „off" mit stehender Feuerwache → enthält U2.
- **AK-S1-15** (Vitest, Negativfälle) → `{ ok: false, reason: 'Beschädigter Spielstand' }`, ohne Ausnahme: `unlocked`
  fehlt; `unlocked` kein Array; enthält `'U9'`; enthält `2`; `['U0', 'U2', 'U2']`; ohne `'U0'`; `['U2', 'U0']`;
  `goodLocks` fehlt; `{ tier: 5, good: 'food' }`; `{ tier: 2, good: 'gold' }`; `{ tier: 1, good: 'cloth' }`
  (kein Bedarf); doppelter Eintrag; unsortiert; `upgradeStops` fehlt; `[0]`; `[4]` (kein Aufstieg); `[1, 1]`;
  `[2, 1]`. Ein v4-Stand mit beschädigten Gebäuden (`buildings` kein Objekt; ein Haus ohne `house`) → `'Beschädigter
Spielstand'`, ohne Ausnahme (Delta R163 B1: `deriveUnlocks` läuft erst nach `isWellFormed`). `version 6` →
  `{ ok: false, reason: 'Unbekannte Version' }`.
- **AK-S1-16** (Vitest, bitgleich) `balance.test.ts` ohne Diff grün, Sieg **6050**, `minMoney` **57** (Log mit
  `VITE_BALANCE_LOG=1`, `--silent=false`). `balance-crises.test.ts`: `OFF_REFERENCE` und `OFF_FINGERPRINT`
  unverändert mit erweiterter Normalisierung (9.2); Krisen „normal" Sieg **7050**, `minMoney` **56**; der Test
  „Laden mitten im Lauf" grün. Der Controller wirft in keinem Lauf.
- **AK-S1-17** (Vitest, „Alles frei" bitgleich) `buildColony` auf `createWorld(3, { unlockAll: true })` liefert
  denselben `Trajectory` wie auf `createWorld(3)` (Sperren haben im Referenzlauf keine Wirkung).
- **AK-S1-18** (Vitest, Anzeige-Bedingung) Krisen „off", `unlockAll`: `buildingShown(w, 'firestation')` `false`,
  `buildLock(w, 'firestation')` `null`, `canPlace` ok; Krisen „mild": `buildingShown` `true`.
- **AK-S1-19** (Vitest, `nextStep`-Filter S1, Ausnahme `guide.ts`) Eine Welt mit einem Haus ausserhalb der
  Versorgung (roh gesetzt) ohne U1 → „Marktplatz kommt, sobald 20 Wohnhäuser stehen"; mit U1 → wörtlich wie heute
  („Ein Wohnhaus liegt ausserhalb der Versorgung: baue einen Marktplatz (M)"). M7:AK-UX-08 und M8:AK-S1-19 bleiben
  grün (Testwelten mit `unlockAll`).
- **AK-S1-20** (Review) arc42 §8 Persistenz nennt Save v5, Migration v4 → v5, die neuen Prüfungen und das Fixture;
  `tests/sim/fixtures/save-v4.json` liegt vor S1 auf `main`.

### F1 — Wald roden und aufforsten (Sim)

- **AK-F1-01** (Vitest, Defs) `CLEAR_FOREST_COST` = `{ money: 10, wood: 0, tools: 0, stone: 0 }`,
  `PLANT_FOREST_COST` = `{ money: 20, wood: 0, tools: 0, stone: 0 }`.
- **AK-F1-02** (Vitest, Roden) Welt mit U2, unbebaute Waldkachel, Geld 100: `clearForest` ok; Kachel `grass`, Geld
  **90**, Holz unverändert, `tick` unverändert, alle anderen Kacheln gleich; `layoutKey` vorher ≠ nachher.
- **AK-F1-03** (Vitest, Aufforsten) Unbebaute Weide, Geld 100: `plantForest` ok; Kachel `forest`, Geld **80**,
  `layoutKey` geändert. Danach `clearForest` auf derselben Kachel: Geld **70**, `grass`, `layoutKey` gleich dem
  Stand vor dem Aufforsten (der Schlüssel hängt am Gelände, nicht an einem Zähler).
- **AK-F1-04** (Vitest, Negativfälle) Je Fall `{ ok: false, reason }`, `serialize(w)` vorher gleich nachher:
  Roden auf Wasser, Sand, Gebirge, Weide → `'Kein Wald'`; Aufforsten auf Wasser, Sand, Gebirge, Wald →
  `'Keine Weide'`; Waldkachel unter einem Gebäude (roh gesetzt), mit Weg, Kontor-Kachel → `'Bereits bebaut'`;
  Aufforsten auf Weide unter einem Wohnhaus und auf Weide mit Weg → `'Bereits bebaut'` (Delta R163 B-6); `x = -1`,
  `x = width`, `y = height`, `x = 1.5` → `'Ausserhalb der Karte'`; Geld 9 (Roden) bzw. 19 (Aufforsten) →
  `'Zu wenig Geld'`; Geld −5 → `'Kein Geld'`; neue Welt ohne U2 → `'Erst wenn ein Wohnhaus 4 Pioniere hat'` (auch auf Wasser:
  Sperre zuerst).
- **AK-F1-05** (Vitest, Holzfäller arbeitet weiter) Angebundener Holzfäller; alle Waldkacheln im Radius 2 gerodet:
  nach 300 Schritten (Krisen „off") Holz **+10**, gleich wie in der Vergleichswelt ohne Rodung; Zustand `ok`.
  Ebenso: Aufforsten aller freien Weidekacheln im Radius 2 einer stehenden, angebundenen Schäferei ändert deren
  Wolle nach 300 Schritten nicht gegenüber der Vergleichswelt (Delta R163 B-6).
- **AK-F1-06** (Vitest, Vorschau) `canClearForest`/`canPlantForest` liefern für jeden Fall aus AK-F1-02 bis AK-F1-04
  dasselbe Ergebnis wie die Aktion und ändern die Welt nicht.
- **AK-F1-07** (Vitest, Nutzen) Ein Schäferei-Platz mit 3 Weide im Radius 2 liefert `'Zu wenig Weide in der Nähe'`;
  nach dem Roden einer Waldkachel im Radius ist `canPlace(w, 'sheepfarm', …)` ok.
- **AK-F1-08** (Vitest, `layoutKey`, **Änderung** M6:AK-S3-07) `layoutKey` ändert sich nach jedem erfolgreichen
  `clearForest`/`plantForest`, nicht nach einem gescheiterten und nicht durch `step()`; der bestehende Test „ändert
  sich nur durch Bau, Abriss, Weg und Anbindung" wird um „und Geländewechsel" ergänzt.
- **AK-F1-09** (Vitest, Determinismus) Dieselbe Folge aus Roden, Aufforsten und 100 Schritten auf zwei Kopien
  derselben Welt ergibt gleiches `serialize`. Variante mit Speichern (Delta R163 B-9): nach Roden, Aufforsten und
  gesetzten `goodLocks` (aktive Amtsstube, U5) `deserialize(serialize(w))`, dann 100 Schritte auf beiden Welten →
  gleiches `serialize`. `forest.ts` importiert keinen RNG.
- **AK-F1-10** (Vitest, „Alles frei") `createWorld(3, { unlockAll: true })`: `clearForest` gelingt bei Tick 0.

### S2 — Amtsstube, Steuer, Ausgabesperre, Werkzeugmacher, Aufstiegsstopp (K1)

- **AK-S2-01** (Vitest, Defs) `townhall`: Name „Amtsstube", 2 × 2, Kosten 200 / 15 / 2 / 5, Unterhalt 20, `public`,
  `site []`, `flammable true`, nicht `stormAffected`, ohne `service`, `serviceRadius`, `supplyRadius`;
  `maxCount { n: 1, reason: 'Es gibt schon eine Amtsstube' }`, kein anderes Gebäude hat `maxCount` (Delta R163 B8);
  letzter Eintrag von `BUILDING_IDS`. U3 `buildings` = `['townhall']`. `toolmaker.requiresService` = `'school'`, sonst hat kein Gebäude
  `requiresService`. Die brennbaren Ids (M6:AK-S2-10, M8) enthalten `townhall`.
- **AK-S2-02** (Vitest, eine Amtsstube) Mit U3: erste Amtsstube ok; zweite → `'Es gibt schon eine Amtsstube'`, auch
  wenn die erste brennt oder unverbunden ist; nach Abriss der ersten gelingt der Bau.
- **AK-S2-03** (Vitest, `townhallActive`) angebunden ohne Ausfall → `true`; ohne Weg → `false`; mit `outageUntil` →
  `false`; keine Amtsstube → `false`.
- **AK-S2-04** (Vitest, wirksame Steuer) Ein Siedlerhaus 8 EW, alle Bedürfnisse erfüllt: ohne Amtsstube und mit
  `taxLevel 'high'` → `effectiveTaxLevel` `'normal'`, `totalTaxes` **56**, `houseCap` 8; mit aktiver Amtsstube
  `'high'` → **72**, `houseCap` 6; `'low'` → **39**. Brennt die Amtsstube → wieder 56. Der Fixture-Stand aus
  AK-S1-12 hat `effectiveTaxLevel` `'normal'`.
- **AK-S2-05** (Vitest, `setTaxLevel`) Ohne Amtsstube → `'Braucht eine Amtsstube'`, mit unverbundener Amtsstube →
  `'Amtsstube wirkt nicht'`, jeweils `taxLevel` und `taxLockedUntil` unverändert; `'foo'` → `'Ungültige Stufe'` (zuerst); mit aktiver Amtsstube die bisherigen Fälle
  aus M5 unverändert (`'Stufe bereits aktiv'`, `'Sperrzeit'`, ok mit Sperre 300). Mit
  `createWorld(3, { unlockAll: true })` ohne Amtsstube ebenfalls `'Braucht eine Amtsstube'` (Delta R163 B-2).
- **AK-S2-06** (Vitest, Abriss-Lücke) Amtsstube bauen, `'high'` setzen, abreissen: im nächsten Schritt wirkt
  „normal", `taxLevel` bleibt `'high'`; nach Neubau (angebunden) wirkt wieder „hoch", ohne neue Sperrzeit.
- **AK-S2-07** (Vitest, `setGoodLock`) Vor U5 → U5-`lockText`; ohne Amtsstube → `'Braucht eine Amtsstube'`;
  `(5, 'food')`, `(2, 'gold')`, `(1, 'cloth')` → `'Ungültige Sperre'`. Setzen von `(3, 'rum')` dann `(2, 'cloth')` →
  `goodLocks [{ 2, 'cloth' }, { 3, 'rum' }]`; erneutes Setzen ok ohne Doppelte; Entfernen löscht den Eintrag. Mit
  `unlockAll` ohne Amtsstube → `'Braucht eine Amtsstube'` (Delta R163 B-2).
- **AK-S2-08** (Vitest, Sperre in `consume`) Siedlerhaus 8 EW mit Kapelle in Reichweite, Nahrung 50, Stoff 50, aktive
  Amtsstube, U5, Sperre `(2, 'cloth')`, Start Tick 0: nach dem ersten Schritt `satisfied.cloth false`,
  `stats.taxes` **28**; nach Tick 101 Stoff **50**, Einwohner **6**. Nach Abriss der Amtsstube entnimmt das Haus
  wieder Stoff, `goodLocks` bleibt gespeichert.
- **AK-S2-09** (Vitest, Sperre und Aufstieg) Volles Pionierhaus, sonst bereit zum Aufstieg, Sperre `(2, 'cloth')`
  wirksam: `upgradeStatus.reasons` enthält „Stoff für Siedler gesperrt", kein Aufstieg im Wachstumstakt. Sperre
  `(2, 'food')` blockiert den Aufstieg nicht.
- **AK-S2-10** (Vitest, Knappheit, Vorschlag 9.6) Stoff 1; Siedlerhaus (kleinere Id) und Bürgerhaus brauchen im
  selben Schritt je 1 Stoff: ohne Sperre bekommt das Siedlerhaus die Einheit; mit wirksamer Sperre `(2, 'cloth')`
  das Bürgerhaus.
- **AK-S2-11** (Vitest, Werkzeugmacher) Angebunden, Holz 10, `progress 0`: ohne Schule nach 100 Schritten Zustand
  `noService`, `progress 0`, Holz 10, Werkzeug unverändert, `stats.upkeep` enthält 25. Schule angebunden mit
  Mittenabstand 10 (dx 10, dy 0) → nach genau 80 Schritten Werkzeug +1, Holz −1. Mittenabstand 11 → `noService`.
  Schule brennt oder ist unverbunden → `noService`. Bei `progress 40` wird die Schule abgerissen: 100 Schritte
  `progress 40`; nach Neubau läuft der Zyklus ab 40 weiter. In `createWorld(3, { unlockAll: true })` ohne Schule
  ebenfalls `noService` nach 100 Schritten (Delta R163 B-2).
- **AK-S2-12** (Vitest, `taxBlocks`) Aktive Amtsstube mit `'high'`, U0, U2, U3: der Eintrag U4 in `nextUnlocks` hat
  `taxBlocks true`, U1 `false`; ohne Amtsstube bei gespeichertem `'high'` beide `false`.
- **AK-S2-13** (Vitest, Kann K1) Aktive Amtsstube, `setUpgradeStop(w, 1, true)`: ein volles, bereites Pionierhaus
  steigt nicht auf, erster Grund nach dem M8-Sperrgrund „Aufstieg in der Amtsstube angehalten"; ohne aktive
  Amtsstube steigt es auf. `setUpgradeStop(w, 4, true)` → `'Ungültige Stufe'`; ohne Amtsstube →
  `'Braucht eine Amtsstube'`.
- **AK-S2-14** (Vitest, bitgleich nach S2) AK-S1-16 und AK-S1-17 sind nach S2 grün.
- **AK-S2-15** (Vitest, Render-Mindestpflicht, Ausnahme) `SILHOUETTES.townhall` ist definiert (Rückfall `public`);
  `tests/render/sprites.test.ts` (M7:AK-R2-03) ohne Lockerung grün, einzige Änderung ist ein Erwartungseintrag für
  den Rückfall, falls der Fensteranker-Test ihn verlangt (wie M8 R142 W1).
- **AK-S2-16** (Vitest, Taste I, Ausnahme `hotkeys.ts`) `hotkeyAction('i', …)` wählt `townhall`; `hotkeyLabel` → „I";
  `TOOL_HOTKEYS` hat 18 Einträge; `nk('townhall')` = „Amtsstube (I)"; alle bisherigen Tasten unverändert.
- **AK-S2-17** (Vitest, Texte, Ausnahmen `texts.ts`, `hints.ts`) `stateInfo` für `noService` = „Braucht eine Schule in
  Reichweite"; `friendlyReason` für „Es gibt schon eine Amtsstube" und „Braucht eine Amtsstube" wie 11.9; die
  Vollständigkeitsprüfung M7:AK-UX-03 ist grün.

### B1 — Messung, Szenarien

- **AK-B1-01** (Vitest, neue Datei `tests/sim/unlock-timeline.test.ts`) Der Controller-Lauf protokolliert je
  Eintrag den ersten Tick in `unlocked` und je `defId` den ersten Tick, an dem das Gebäude steht. Sollwerte 9.3
  exakt (Krisen „off" und „normal" mit Feuerwache): U2 150, U3 350, U4 550, U5 3850 / 4750, U6 6050 / 7050, U1 nie;
  für jedes Gebäude ist der erste Bautick ≥ dem Freischalt-Tick seines Eintrags.
- **AK-B1-02** (Vitest, M8 B1, nach dem M8-Merge) `balance-merchants.test.ts` grün mit denselben Messwerten
  (`winTick`, Bürger-Endzustand, `firstMerchantTick`, `wonMerchantsTick`) wie im M8-Ruling zur Szenario-Baseline.
  Weicht ein Wert ab, wird nicht nachgestellt: Meldung an L0.
- **AK-B1-03** (Vitest) `tests/sim/scenario-saves.test.ts` erzeugt alle Szenarien aus 18.1; jedes lädt mit
  `deserialize` als v5 `ok`; `unlocked` jedes Szenarios ist gleich `deriveUnlocks` der Welt (ausser `m10-start`:
  `['U0']`); `galerie` enthält jeden `BUILDING_IDS`-Typ inklusive `townhall`; kein Szenariotext enthält „Tick".
  Je Szenario liegt `<name>.probes.json` vor; jeder Prüfpunkt aus 18.1 ist darin, liegt auf der Karte und trägt das
  genannte Gebäude bzw. Gelände (Wald, Weide), die Mittenabstände der Werkzeugmacher zur Schule stimmen (≤ 10 bzw.
  > 10), `amtsstube` in `m10-amtsstube-aus` ist nicht angebunden (Delta R163 B-1).
- **AK-B1-04** (Review) Die Messwerte aus AK-B1-01 und AK-B1-02 stehen im Bericht an L0 als Ruling-Vorlage
  („Freischalt-Ticks Seed 3: …, Baseline unverändert").

### R1 — Amtsstube-Silhouette, Terrain-Cache

- **AK-R1-01** (Vitest, `terrain.ts`, reine Helfer) Für eine Welt vor und nach `clearForest(w, x, y)`: das
  Gelände-Abbild unterscheidet sich genau in Kachel (x, y); das Rechteck der Teil-Neuzeichnung enthält (x, y) und den
  Rand der Feld-Glättung, auf die Karte geklemmt; ohne Forst-Aktion, nur mit `step()`, wird nichts neu gezeichnet
  (`shouldPatch` false). Ein Bau ohne Geländewechsel verhält sich wie heute (Rechteck aus `occupancy`).
- **AK-R1-02** (Vitest, `iso.ts`) `sortedObjects(w)` enthält nach `clearForest(w, x, y)` kein Baum-Objekt mit
  `id = y · width + x`, nach `plantForest` an einer Weidekachel genau eines mit `variant` = `treeVariant(seed, x, y)`.
- **AK-R1-03** (Browser, Szenario `m10-wald`, 1280 × 800, dpr 1 und 2, `?perf=1`) Roden einer Waldkachel mit dem
  Werkzeug: Ausschnitt der Kachel vor und nach dem Klick unterscheidet sich (Pixelvergleich, Bäume weg, Wiesenbild);
  Aufforsten einer Weidekachel zeigt Bäume. **Messung (Delta R163 B-7, B10):** Messgrösse ist
  `updateTerrainLayer().ms` des Frames nach der Forst-Aktion (nicht die Frame-Renderzeit), bei dpr 2, je 10
  Forst-Aktionen auf den Prüfpunkten (5 × Roden, 5 × Aufforsten, abwechselnd); Grenze: höchster Einzelwert ≤ **100 ms**
  (**Setzung Spec**: ab etwa 100 ms ruckelt der Klick spürbar), erwartet ≤ 15 ms. Urteiler Bild: `qa-playtester`.
- **AK-R1-04** (Vitest und Browser) `SILHOUETTES.townhall` ist ein eigener Eintrag statt des Rückfalls aus S2; alle
  Fensteranker liegen im Footprint (M7:AK-R2-03). Blindtest im Szenario `galerie`: `qa-playtester` ordnet die
  Amtsstube ohne Beschriftung richtig zu (Legende erlaubt). Urteiler `qa-playtester`, Anmutung `lead-art`.
- **AK-R1-05** (Vitest, gelände-feste Caches, Delta R163 B3) Für eine Welt vor und nach `clearForest` und
  `plantForest`: die Tier-Anker aus `src/render/wildlife.ts` und das Küstenfeld aus `src/render/water.ts` bzw.
  `src/render/life.ts` sind gleich (Forst-Aktionen wechseln nur zwischen Wald und Weide und berühren die Küste nicht).
  Review: Die Code-Kommentare der drei Caches nennen diese Bedingung.

### A1 — Symbolsatz

- **AK-A1-01** (Vitest, `tests/ui/icons.test.ts`) `ICON_IDS` hat genau die 24 Ids aus 14; je Symbol `label` nicht
  leer und eindeutig, mindestens ein Pfad; jeder Pfad besteht nur aus SVG-Pfadbefehlen, Zahlen, Leerzeichen, Komma,
  Punkt und Minus; kein Text enthält `url(`, `href`, `http` oder ein Emoji.
- **AK-A1-02** (Vitest) Jede Farbe ist ein Schlüssel von `PALETTE`. `iconSvg(id)` liefert `viewBox="0 0 16 16"`,
  `aria-hidden="true"`, `focusable="false"`.
- **AK-A1-03** (Browser, Blindtest) Eine Tafel aller 24 Symbole bei 16 und 24 px ohne Beschriftung: `qa-playtester`
  ordnet mindestens 20 von 24 richtig zu (Liste der Namen erlaubt). Anmutung (Palette, Strichstärke): Urteiler
  `lead-art`.

### U1 — Bauleiste, Tasten, Chips, Handel, Auftrag, Meldung, Ton, „Alles frei", Kopfzeile

- **AK-U1-01** (Browser, `m10-start`) Hauptleiste „Weg · 5 Geld", „Abriss"; kein Knopf „Roden"; Kategorie-Knöpfe
  sichtbar genau „Wohnen" und „Produktion"; „Wohnen" öffnet 1 Eintrag, „Produktion" 2 („Fischerhütte · 100 Geld",
  „Holzfäller · 50 Geld"). Vitest: die Zählung je Stand aus der Tabelle 11.1 (Welten mit den genannten Einträgen,
  Krisen „normal" und „off").
- **AK-U1-02** (Vitest und Browser, gesperrte Taste) Vitest: `lockedToolText(w, { kind: 'build', defId: 'chapel' })`
  in neuer Welt = „Kapelle: Erst wenn ein Wohnhaus 4 Pioniere hat"; Feuerwache bei Krisen „off" mit `unlockAll` = „Feuerwache: ohne Krisen nicht nötig";
  freie Werkzeuge → `null`. Browser (`m10-start`): Taste K → kein Werkzeug aktiv, Meldung mit Klasse `toast error`
  und diesem Text, Geld unverändert.
- **AK-U1-03** (Vitest, `hotkeyList(world)`, **Änderung** M7:AK-UX-06) Neue Welt: Werkzeugtasten genau R, X, H, F, L
  (in `TOOL_HOTKEYS`-Reihenfolge), dann 1, 2, 3, P, dann `NAV_KEYS`; mit `unlockAll` und Krisen „normal" alle 18
  Werkzeugtasten des Stands nach S2 (mit I). Browser (`m10-start`): Menü-Tastenliste ohne K, J, O, I. Die Tasten C, Q
  und `?` prüft AK-U2-12 (Delta R163 B2).
- **AK-U1-04** (Browser, `m10-start`) In `.stock-row` sind genau 4 Chips ohne `hidden` (Holz, Werkzeug, Stein,
  Nahrung). Vitest: Wolle 3 im Lager ohne U2 → Chip `stock-wool` sichtbar.
- **AK-U1-05** (Browser, `m10-start`; Vitest je Stand) Nur `pop-1` sichtbar; mit U3 auch `pop-2`, mit U5 `pop-3`, mit
  U6 `pop-4`; ein Chip mit Einwohnern > 0 ist immer sichtbar.
- **AK-U1-06** (Browser, `m10-start`, Kontor anklicken) Das Handels-Panel zeigt genau die Zeilen Holz, Werkzeug,
  Stein, Nahrung; Vitest: mit Wolle 3 ohne U2 hat die Zeile Wolle Verkaufs-, aber keine Kaufknöpfe. Das Panel hat
  `scrollWidth ≤ clientWidth` bei 1280.
- **AK-U1-07** (Browser, `m10-siedler-fast`, 1×) Vor dem Wachstumstakt ist die Auftragskarte verborgen (kein
  `[data-field=order-text]` sichtbar), obwohl `world.order` gesetzt ist. Nach dem Wachstumstakt (erster Siedler, U3)
  ist sie im selben Frame sichtbar mit „Auftrag: {n} {Gut} · Prämie {p} · noch {Restzeit}" (Restzeit aus
  `due − tick`). Vor U3 erscheint keine Auftragsmeldung und kein Ton `order` (Vitest auf `orderChange`-Filter).
- **AK-U1-08** (Vitest, `unlockNoticeText`) Für `prev`/`unlocked`-Paare: U2 bei Krisen „normal" und „off", U1, U3,
  U4, U5 wörtlich wie 11.6; nur U6 → M8-Text wörtlich; U2 und U3 zusammen → „Neu: Steinbruch (B), Schäferei (G),
  Weberei (V), Kapelle (K), Feuerwache (E), Roden (C), Aufforsten (Q), Amtsstube (I), Handelsaufträge — die ersten
  Siedler sind da. Mehr unter Hilfe (?)"; gleiche Listen → `null`. Kein Text enthält „Tick".
- **AK-U1-09** (Browser, `m10-pionier-fast-voll` und `m10-siedler-fast`, 1×) Nach dem Wachstumstakt genau eine
  Meldung, Art `info`, bleibend, mit dem U2- bzw. U3-Text und einem Knopf „Hilfe" (bis U2 öffnet er die bisherige
  Karte „Ziel und erste Schritte"; die Hilfe-Karte prüft AK-U2-12); der neue Eintrag steht danach in der Bauleiste. Speichern und Laden: keine erneute Meldung, kein Ton (R152 B1).
- **AK-U1-10** (Browser und Vitest, „Alles frei") Vitest: `loadSettings` liest `unlockMode`, unbekannter Wert →
  `'stepwise'`. Browser: Menü → „Neue Insel" mit „Alles frei" und Krisen „normal": „Infrastruktur" 1, „Wohnen" 1,
  „Produktion" 9, „Öffentlich" 5; 2 Minuten bei 4× ohne Freischalt-Meldung. Die Wahl bleibt nach Neuladen der Seite
  im Menü erhalten. Roden und Aufforsten in der Leiste und „Alles freigeschaltet" in der Hilfe prüft AK-U2-12.
- **AK-U1-11** (Browser, 1280 × 800, `m10-start`, `m10-amtsstube`, `m10-amtsstube-aus`) Ohne aktive Amtsstube ist
  `.hud-tax` verborgen; mit aktiver Amtsstube zeigt `[data-field=tax]` „Steuer normal", ein Klick wählt die Amtsstube
  und öffnet ihr Panel. `#hud` ≤ 84 px und `scrollWidth ≤ clientWidth` in allen drei Szenarien (M7:AK-UX-15).
- **AK-U1-12** (Vitest, Ton) `diffSoundEvents`: `unlocked` wächst → genau ein `unlock`; zwei neue Einträge im selben
  Frame → ein `unlock`; `won` und U6 im selben Frame → nur `win`; Laden (Basis = geladener Stand) → kein Ton; alle
  bisherigen Töne unverändert.
- **AK-U1-13** (Vitest und Browser) Bilanz-Tooltip ohne aktive Amtsstube enthält „Steuer: normal (keine Amtsstube)";
  in `m10-amtsstube-aus` zeigt die Ruhe-Ansicht `rest-tax` den Text von `taxEffect('normal')` plus „ (keine
  Amtsstube)".

### U2 — Hilfe, `nextStep`, Forst-Bedienung, Amtsstuben-Panel, Tooltips, Gründe

- **AK-U2-01** (Vitest, `helpSections`) Neue Welt mit vier Pionierhäusern (3, 2, 1, 1 EW), Krisen „normal":
  Abschnitte in der Reihenfolge aus 12.1; „Jetzt tun" = `nextStep(w)`; „Als Nächstes" genau „Marktplatz — sobald 20
  Wohnhäuser stehen (jetzt 4 / 20)" und „Steinbruch, Schäferei, Weberei, Kapelle, Feuerwache, Roden, Aufforsten —
  sobald ein Wohnhaus 4 Pioniere hat (jetzt 3 / 4)"; „Tipps" beginnt mit dem U0-Tipp; „Erste Schritte" vorhanden. Mit
  einem Siedler fehlt „Erste Schritte". Mit `unlockAll`: „Als Nächstes" = „Alles freigeschaltet". Mit aktiver
  Amtsstube auf „hoch" (U0, U2, U3) endet die U4-Zeile mit „ · Steuer ‚hoch' verhindert volle Häuser".
- **AK-U2-02** (Vitest, `nextStep` und `remedyText`, **Änderung** M7:AK-UX-08 und M7:AK-UX-10) Kasse schrumpft:
  ohne U3 „Deine Kasse schrumpft: versorge mehr Wohnhäuser oder verkaufe Waren am Kontor"; mit U3 ohne aktive
  Amtsstube „Deine Kasse schrumpft: versorge mehr Wohnhäuser, verkaufe Waren am Kontor oder baue eine Amtsstube (I)";
  mit aktiver Amtsstube wörtlich wie heute. Gespeichertes `'high'` ohne Amtsstube → kein Steuer-Satz. Werkzeugmacher
  `noService` mit gesperrter Schule (Stand aus AK-S1-14 (c)) → „Schule kommt, sobald ein Wohnhaus 8 Siedler hat"
  (Delta R163 B-3). Holzfäller `storageFull` ohne U5 → „Verkaufe Holz am
  Kontor", mit U5 wörtlich wie heute. Werkzeugmacher `noService` → „Baue eine Schule (U) in Reichweite". Alle übrigen
  Testwelten aus M7:AK-UX-08 und M8:AK-U2-08 grün (mit `unlockAll`).
- **AK-U2-03** (Browser) Ruhe-Ansicht zeigt unter „Nächster Schritt" `[data-field=help-hint]` „Mehr in der Hilfe (?)".
- **AK-U2-04** (Browser, 1280 und 1920) HUD-Knopf „Hilfe" steht vor „Einstellungen"; Klick, Taste `?` und Menü-Knopf
  „Hilfe" öffnen dieselbe Karte mit Titel „Hilfe" und den sechs Abschnitten (`help-now`, `help-next`, `help-goal`,
  `help-tips`, `help-signs`, `help-steps`); Esc schliesst, der Fokus kehrt zum Öffner zurück; bei offener Karte wählt
  keine Werkzeugtaste ein Werkzeug. Die Karte hat `scrollWidth ≤ clientWidth`. `#hud` ≤ 84 px bei 1280 × 800.
- **AK-U2-05** (Browser, `m10-start`, `m10-pionier-fast-voll`) In `m10-start` zeigt `help-next` die zwei Zeilen
  wie AK-U2-01 mit „(jetzt 0 / 20)" und „(jetzt 0 / 4)"; nach dem Wachstumstakt in `m10-pionier-fast-voll` steht dort
  der U3-Eintrag „Amtsstube, Handelsaufträge — sobald die ersten Siedler einziehen".
- **AK-U2-06** (Browser, `m10-wald`) Hauptleiste zeigt „Roden · 10 Geld" und „Aufforsten · 20 Geld"; Taste C wählt
  Roden; Klick auf eine unbebaute Waldkachel: Gelände `grass` (Dev-Werkzeug), Geld −10, Ton `build`; Klick auf
  Weide mit Roden: Meldung „Hier ist kein Wald" (`toast error`), Geld unverändert. Taste Q, Klick auf Weide: `forest`,
  Geld −20. Der Holzfäller daneben bleibt im Zustand `ok`.
- **AK-U2-07** (Vitest, Vorschau und Tooltip) `placementHint` für `clearForest` auf unbebautem Wald → gültig mit
  „Roden: 10 Geld"; auf Weide → „Hier ist kein Wald"; `plantForest` auf Wald → „Aufforsten geht nur auf Weide";
  `tooltipLines` für Amtsstube, Roden und Aufforsten wörtlich wie Tabelle 11.9, in dieser Reihenfolge.
- **AK-U2-08** (Browser, `m10-amtsstube`, `m10-amtsstube-aus`) Klick auf die Amtsstube: Titel „Amtsstube", drei
  Knöpfe `[data-tax]`, aktiver markiert; „hoch" wählen → `world.taxLevel 'high'`, Sperrhinweis erscheint. Sperr-Matrix
  mit Zeilen Pioniere, Siedler, Bürger; Zelle `[data-lock="2-cloth"]` umschalten → `goodLocks` enthält `{ 2, 'cloth' }`,
  `aria-pressed="true"`. In `m10-amtsstube-aus`: Zeile „Wirkt nicht: nicht angebunden"; ein Klick auf einen
  Steuer-Knopf zeigt die Meldung „Die Amtsstube wirkt erst mit Weg und ohne Brand", `taxLevel` unverändert. Panel
  `scrollWidth ≤ clientWidth`. Mit K1: Schalter `[data-stop="1"]` setzt `upgradeStops [1]`.
- **AK-U2-09** (Browser, `m10-amtsstube`) Info-Panel des Werkzeugmachers ohne Schule: Zustand „Braucht eine Schule in
  Reichweite", Abhilfe „Baue eine Schule (U) in Reichweite"; der andere Werkzeugmacher zeigt den heutigen Text.
- **AK-U2-10** (Vitest, Gründe, Erweiterung M7:AK-UX-03) `friendlyReason` für jede Zeile aus 11.9 (Amtsstube, Wald,
  Weide, `lockText`, Gut-Sperre, Aufstiegsstopp, „Ungültige Sperre"); Vollständigkeitsprüfung grün.
- **AK-U2-12** (Vitest und Browser, Teile aus U1 nach U2, Delta R163 B2) Vitest: `lockedToolText(w, { kind:
'clearForest' })` in neuer Welt = „Roden: Erst wenn ein Wohnhaus 4 Pioniere hat"; `hotkeyList(world)` der neuen Welt
  enthält „?" mit „Hilfe" nach P; mit `unlockAll` und Krisen „normal" alle 20 Werkzeugtasten. Browser (`m10-start`):
  Menü-Tastenliste ohne C, Q; Knopf „Hilfe" einer Freischalt-Meldung (`m10-pionier-fast-voll`) öffnet die Hilfe-Karte;
  mit „Alles frei" (Neue Insel, Krisen „normal") Roden und Aufforsten in der Hauptleiste, `help-next` =
  „Alles freigeschaltet".
- **AK-U2-11** (Vitest und Browser, Kann K4) Krisen „normal" bei Tick 2399: Krisen-Log und die `MAP_SIGNS`-Zeilen für
  Brand und Sturm verborgen; bei Tick 2400 sichtbar; bei Krisen „off" nie.

### U3 — Mouse-over

- **AK-U3-01** (Vitest, `hoverInfo`, Wohnhaus) Siedlerhaus 6 / 8 ohne Stoff → Titel „Siedlerhaus", Zeilen
  „Einwohner 6 / 8", „Stoff fehlt", „Aufstieg: {friendlyReason(„Haus nicht voll belegt")}"; volles, bereites
  Pionierhaus → dritte Zeile „Aufstieg bereit"; versorgtes Haus → zweite Zeile „zufrieden".
- **AK-U3-02** (Vitest, Betrieb und Dienst) Fischerhütte `ok` → „arbeitet — 15 Nahrung / min"; Weberei
  `waitingInput` → „wartet auf Wolle"; `storageFull` → „Lager voll"; Werkzeugmacher `noService` → „braucht eine Schule
  in Reichweite"; brennend → „brennt"; unverbunden → „nicht angebunden"; Holzfäller ohne Wald im Radius 2 zusätzlich
  „kein Wald mehr in der Nähe". Kapelle mit drei Wohnhäusern im Radius → „versorgt 3 Häuser"; Feuerwache →
  „schützt {protectedCount} Gebäude"; Amtsstube → „Steuer: normal", „Sperren: 0", „Klicken zum Einstellen".
- **AK-U3-03** (Vitest, Gelände, Schiff, Tier) Waldkachel ohne U2 → Titel „Wald", Zeilen genau „Gut für Holzfäller";
  mit U2 zusätzlich „Roden: 10 Geld". Weide im Versorgungsgebiet ohne U2 → „Gut für Wohnhaus"; mit U2 → „Gut für
  Wohnhaus, Schäferei" und „Aufforsten: 20 Geld"; Weide ausserhalb → letzte Zeile „Ausserhalb der Versorgung".
  Gebirge mit U2 → „Gut für Steinbruch daneben". `extra.ship` ohne U3 → „Händlerschiff", „Kauft und verkauft am
  Kontor"; mit U3 und Auftrag zusätzlich „Auftrag: {n} {Gut}, noch {Restzeit}". `extra.animal 'Wal'` → Titel „Wal",
  keine Zeilen, auch über einem Gebäude (Priorität). Nie mehr als 3 Zeilen; kein Text enthält „Tick".
- **AK-U3-04** (Browser, `galerie` und `m10-amtsstube`, 1280 und 1920) Mit Auswahl-Werkzeug erscheint die Karte über
  einem Gebäude nach 400 ms (± 100 ms) Ruhe, mit dem Titel aus `hoverInfo`; Wechsel auf eine andere Kachel blendet sie
  aus; beim Ziehen der Karte, mit offenem Modal und mit aktivem Bauwerkzeug erscheint keine. Am rechten und unteren
  Fensterrand liegt die Karte vollständig im Fenster.
- **AK-U3-05** (Browser, `m10-wald`) Mouse-over über einer Waldkachel zeigt „Roden: 10 Geld"; nach dem Roden zeigt
  dieselbe Kachel „Weide" und „Aufforsten: 20 Geld".
- **AK-U3-06** (Vitest, Anschluss Tiere) Ohne H-R2 (Abfrage liefert keine Tiere) bricht nichts; mit einer Fake-Abfrage
  nutzt `app.ts` dieselbe `timeMs` und dieselbe `env` (`phase`, `weather`, `reduce`) wie der Renderer im Frame
  (Prüfung über einen reinen Helfer, Name im Plan): Bei Regen oder reduzierter Bewegung liefert der Helfer genau die
  Tiere, die der Renderer zeichnet.

### U4 — Symbole im Einbau, Kann K2 und K3

- **AK-U4-01** (Vitest und Browser, Kopfzeile) Jeder Lager- und Einwohner-Chip und die Felder Geld und Bilanz tragen
  ein Symbol und `aria-label` = bisheriger Text wörtlich (zum Beispiel „Holz 40 →", „Pioniere 4", „Geld 5000");
  `title` unverändert. Browser 1280 × 800: `#hud` ≤ 84 px, `scrollWidth ≤ clientWidth`; `tests/ui/contrast.test.ts`
  (M7:AK-U2-02) ohne Änderung grün.
- **AK-U4-02** (Browser, Bauleiste) Kategorie-Reiter zeigen das Kategorie-Symbol mit `aria-label` und `title` =
  Kategoriename; Bau-Einträge behalten `aria-label` „{Name} · {n} Geld"; Tab und Enter erreichen und wählen Einträge
  wie M7-UX (R134).
- **AK-U4-03** (Browser, `galerie`) Info-Panel eines Bürgerhauses zeigt die Bedarfe als Symbole mit ✓ / ✗, jedes mit
  zugänglichem Namen; fehlt ein Gut, steht darunter eine Zeile mit dessen Namen. Meldung und Hilfe zeigen Symbole vor
  den Namen, `textContent` unverändert.
- **AK-U4-04** (Vitest und Browser, Kann K2) Nach U2 tragen die neuen Einträge der Bauleiste das Zeichen „neu" (mit
  zugänglichem Namen „neu"), bis der Spieler sie einmal wählt; nach Laden ohne Zeichen (nicht gespeichert).
- **AK-U4-05** (Browser, Kann K3) Bau-Einträge zeigen die verkleinerte Silhouette ihres Gebäudes statt des
  Kategorie-Symbols; Blindtest wie AK-A1-03 für die Einträge. Urteiler `qa-playtester`.

### D1 — Doku

- **AK-D1-01** (Review) README-Spielanleitung: Freischaltung Schritt für Schritt (Tabelle U0–U6 mit Auslösern),
  Option „Alles frei", Amtsstube (Taste I, Kosten, Unterhalt, Steuer und Ausgabesperre), Werkzeugmacher braucht
  Schule, Roden (C, 10) und Aufforsten (Q, 20), Hilfe (`?`), Mouse-over.
- **AK-D1-02** (Review) arc42: §5 Bausteine `unlocks`, `townhall`, `forest`, `hover`, `icons`; §8 Gebäudezustände
  mit `noService`, Steuerstufe mit `effectiveTaxLevel`, Caches mit Geländeart im `layoutKey` und den gelände-festen
  Caches (7); §10 Messzeile `updateTerrainLayer().ms` (aus R1). arc42 §6, §8 Persistenz und der Nachtrag zu ADR-005
  liegen bei S1 (AK-S1-05, AK-S1-20; Delta R163 B4) und werden hier nur auf Stand geprüft.
- **AK-D1-03** (Review) Hauptspec 2.4, 2.7, 2.8, 3.3, 3.7 verweisen auf diese Spec (Abschnitt 20).

**Summe:** 98 Abnahmekriterien (S1 20 · F1 10 · S2 17 · B1 4 · R1 5 · A1 3 · U1 13 · U2 12 · U3 6 · U4 5 · D1 3;
Delta R163: neu AK-R1-05, AK-U2-12),
davon Kann: AK-S2-13 und Teil von AK-U2-08 (K1), AK-U4-04 (K2), AK-U4-05 (K3), AK-U2-11 (K4); K5 ohne eigenes Kriterium (fällt
zuerst). Dazu 4 Punkte „Nutzer-Playtest" (18.2).

### 18.3 Randfälle (Übersicht)

| Randfall                                                                               | Antwort                                                                                         | AK                                                         |
| -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Gebäude vor der Freischaltung                                                          | Sperre zuerst, nichts gebucht, nicht in der Bauleiste, Taste zeigt Grund                        | AK-S1-06, AK-U1-01, AK-U1-02                               |
| Haus schrumpft, Gebäude abgerissen                                                     | Freischaltung bleibt                                                                            | AK-S1-04                                                   |
| Mehrere Freischaltungen im selben Frame                                                | eine Meldung, ein Ton                                                                           | AK-U1-08, AK-U1-12                                         |
| Freischaltung im Siegtick (U6)                                                         | `won` und U6 nach demselben Schritt, nur Ton `win`                                              | AK-S1-05, AK-U1-12                                         |
| Laden eines Stands                                                                     | keine Meldung, kein Ton                                                                         | AK-U1-09, AK-U1-12                                         |
| Alter Spielstand v1–v4                                                                 | Migration, `deriveUnlocks`, gebaute Gebäude bleiben baubar                                      | AK-S1-12 – AK-S1-14                                        |
| Beschädigter v4- oder v5-Stand, `version 6`                                            | `Beschädigter Spielstand` bzw. `Unbekannte Version`, kein Wurf                                  | AK-S1-15                                                   |
| v4-Stand mit Werkzeugmacher ohne Schule                                                | Werkzeugmacher steht, arbeitet nicht (`noService`), Abhilfe „Schule kommt, …" (Offener Punkt 2) | AK-S1-14, AK-S2-11, AK-U2-02, AK-U2-09                     |
| v4-Stand mit Steuer „hoch"                                                             | gespeichert bleibt „hoch", wirksam „normal" bis zur Amtsstube                                   | AK-S1-12, AK-S2-04                                         |
| Gesperrtes Gut im Lager                                                                | verkaufbar, Chip und Handelszeile sichtbar, nicht kaufbar                                       | AK-S1-08, AK-U1-04, AK-U1-06                               |
| Auftrag vor U3                                                                         | entsteht, nicht lieferbar, Karte verborgen, verfällt ohne Kosten                                | AK-S1-09, AK-U1-07                                         |
| Auftrag läuft bei U3                                                                   | Karte sofort mit Restzeit                                                                       | AK-U1-07                                                   |
| Zweite Amtsstube                                                                       | abgelehnt, auch wenn die erste brennt                                                           | AK-S2-02                                                   |
| Amtsstube brennt, unverbunden, abgerissen                                              | Steuer wirkt „normal", Sperren und Stopp wirken nicht, Werte bleiben gespeichert                | AK-S2-04, AK-S2-06, AK-S2-08                               |
| Steuer „hoch"                                                                          | kein volles Haus, kein Fortschritt; Hilfe nennt den Grund                                       | AK-S2-12, AK-U2-01                                         |
| Alle Güter einer Stufe gesperrt                                                        | erlaubt; Stufe zahlt halb und schrumpft bis 1                                                   | AK-S2-07, AK-S2-08                                         |
| Knappes Gut, Sperre für die untere Stufe                                               | obere Stufe bekommt die Einheit                                                                 | AK-S2-10                                                   |
| Schule abgerissen während Werkzeugproduktion                                           | `noService`, `progress` bleibt, Unterhalt läuft                                                 | AK-S2-11                                                   |
| Roden um einen Holzfäller                                                              | Holzfäller arbeitet weiter, Mouse-over warnt                                                    | AK-F1-05, AK-U3-02                                         |
| Roden auf Wasser, Sand, Gebirge, Gebäude, Weg, Kontor, Kartenrand, ohne Geld, gesperrt | `fail` mit Grund, Welt unverändert                                                              | AK-F1-04                                                   |
| Roden → Aufforsten im Kreis                                                            | kostet 30, bringt nichts                                                                        | AK-F1-03                                                   |
| Bild nach Geländewechsel                                                               | Kachel und Bäume neu gezeichnet, ≤ 100 ms; Tier-Anker und Küste unverändert                     | AK-R1-01 – AK-R1-03, AK-R1-05                              |
| Feuerwache bei Krisen „aus"                                                            | nicht angezeigt, Taste mit Hinweis, in der Sim baubar                                           | AK-S1-18, AK-U1-02                                         |
| „Alles frei"                                                                           | alles sichtbar und baubar, Bedingungen bleiben, keine Meldung                                   | AK-S1-17, AK-S2-05, AK-S2-07, AK-S2-11, AK-U1-10, AK-U2-12 |
| Mouse-over mit Bauwerkzeug, beim Ziehen, mit Modal                                     | keine Karte                                                                                     | AK-U3-04                                                   |
| Kopfzeile mit Steuer-Knopf und Symbolen                                                | `#hud` ≤ 84 px bei 1280                                                                         | AK-U1-11, AK-U4-01                                         |

## 19. Pakete und Datei-Ownership

Stränge wie M8 17: **Sim** = `tech-sim-engineer` (`src/sim/**`, `tests/sim/**`), **Balancing** =
`design-balancing-analyst` mit `tech-sim-engineer` (nur Testdateien), **Render/Art** = `art-rendering-engineer`
(`lead-art`), **UI** = `tech-ui-engineer`, serieller Strang U1 → U2 → U3 → U4 (R148 F14), **Doku** = Doku-Paket.
**Regel: Keine Datei liegt in zwei parallel laufenden Paketen.** Jedes Paket hält `make check` grün.

| Paket                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Inhalt                                                                                     | Lead · Arbeiter                                      | Dateien                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Folge                                      |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------ |
| S1                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | M1 (ohne Amtsstube), M5, M12 (Sim), Fingerabdruck, `nextStep`-Filter                       | lead-tech · tech-sim-engineer (+ tech-save-engineer) | `src/sim/unlocks.ts` (neu), `src/sim/defs/unlocks.ts` (neu), `types.ts`, `world.ts`, `tick.ts`, `save.ts`, `placement.ts`, `build.ts` (falls nötig), `trade.ts`, `orders.ts`, `defs/buildings.ts` (nur `unlockTier` entfernen), `tests/sim/unlocks.test.ts` (neu), `save.test.ts`, `fixtures/save-v4.json` (neu, vorab auf `main`), `placement.test.ts`, `trade.test.ts`, `orders.test.ts`, `defs.test.ts`, `balance-crises.test.ts` (`normalized()`), `helpers.ts`, `scenarios.ts` (`finishUnlocks`, `unlockAll`), Tests mit gesperrten Bauten (nur `unlockAll`, Liste im Plan), `docs/arc42.md` (§6 `step`, §8 Persistenz),                                                                                |
| `docs/adr/ADR-005-…` (Nachtrag: `tickUnlocks`, Freischaltung gespeichert / Bedingung live, `noService`; Delta R163 B4); Ausnahmen `src/ui/guide.ts` + `tests/ui/guide.test.ts` (nur Filter 12.3), `src/ui/hints.ts` + `tests/ui/hints.test.ts` (nur `lockText`-Zeilen, falls M7:AK-UX-03 sie verlangt), `src/ui/goal.ts` + `tests/ui/goal.test.ts` (nur Typanpassung, falls `unlockTier` gelesen wird), Render- und UI-Tests mit gesperrten Bauten (nur `unlockAll`) | M8 auf `main`; Fixture vorab                                                               |
| F1                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | M10 Sim (H-S1), `layoutKey`                                                                | lead-tech · tech-sim-engineer                        | `src/sim/forest.ts` (neu), `src/sim/defs/forest.ts` (neu), `src/sim/queries.ts` (nur `layoutKey`), `tests/sim/forest.test.ts` (neu), `tests/sim/queries.test.ts` (M6:AK-S3-07)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | S1; parallel zu S2                         |
| S2                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | M2, M3, M4 (Bedingung), K1                                                                 | lead-tech · tech-sim-engineer                        | `src/sim/townhall.ts` (neu), `defs/buildings.ts`, `defs/unlocks.ts` (U3 `townhall`), `types.ts`, `tax.ts`, `population.ts`, `production.ts`, `placement.ts` (eine Amtsstube), `unlocks.ts` (`taxBlocks`), `tests/sim/townhall.test.ts` (neu), `taxes.test.ts`, `population.test.ts`, `production.test.ts`, `defs.test.ts`, `fire.test.ts`, `scenarios.ts` (`galerie` + Amtsstube); Ausnahmen `src/render/sprites.ts` + `tests/render/sprites.test.ts` (Rückfall), `src/ui/hotkeys.ts` + `tests/ui/hotkeys.test.ts` (nur I), `src/ui/texts.ts` (nur `noService`), `src/ui/hints.ts` + `tests/ui/hints.test.ts` (Gründe 11.9), `src/render/overlays.ts` (nur falls ein Zustands-`switch` `noService` verlangt) | S1; parallel zu F1                         |
| B1                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | M13 Messung, Szenarien 18.1                                                                | lead-tech · design-balancing-analyst                 | `tests/sim/unlock-timeline.test.ts` (neu), `tests/sim/scenarios.ts`, `tests/sim/scenario-saves.test.ts`; Messung `balance-merchants.test.ts` ohne Änderung                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | S2 und F1                                  |
| R1                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Amtsstube-Silhouette, Terrain-Cache, Baumstempel                                           | lead-art · art-rendering-engineer                    | `src/render/sprites.ts`, `src/render/terrain.ts`, `src/render/iso.ts` (nur falls AK-R1-02 nicht schon über `layoutKey` grün ist),                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `src/render/wildlife.ts`, `src/render/water.ts`, `src/render/life.ts` (nur Kommentare, AK-R1-05), `tests/render/wildlife.test.ts`, `docs/arc42.md` (§10, eine Zeile), `tests/render/sprites.test.ts`, `tests/render/terrain.test.ts`, `tests/render/iso.test.ts`                                                                                                                                                                                                     | S2 (sprites), F1 (`layoutKey`); parallel zu U1                                             |
| A1                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Symbolsatz (M11 Gestaltung)                                                                | lead-art · art-rendering-engineer                    | `src/ui/icons.ts` (neu), `tests/ui/icons.test.ts` (neu)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | parallel zu S1 (vor R1, gleicher Arbeiter) |
| U1                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | M6 (Bauleiste, Tasten, Liste, Chips, Handel, Auftrag, Kopfzeile Steuer), M7, M12 (UI), Ton | lead-tech · tech-ui-engineer                         | `buildMenu.ts`, `hud.ts`, `hotkeys.ts`, `menu.ts`, `trade.ts`, `order.ts`, `app.ts`, `goal.ts`, `settings.ts`, `soundEvents.ts`, Tests dazu; Ausnahme `src/audio/sound.ts` (+ Zuordnung in `src/audio/`, nur `'unlock'`) und `tests/audio/`                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | S2, F1 auf `main`; Browser nach B1         |
| U2                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | M8 (Hilfe), M10 Bedienung, Amtsstuben-Panel, Tooltips, Gründe, K4                          | lead-tech · tech-ui-engineer                         | `startCard.ts`, `guide.ts`, `inspect.ts`, `hints.ts`, `texts.ts`, `input.ts`, `hotkeys.ts`, `buildMenu.ts`, `menu.ts`, `app.ts`, `crisisLog.ts`, `eventLogView.ts`, Tests dazu; Ausnahme `src/render/renderer.ts` (nur `Tool`-Typ und Werkzeug-Vorschau der Forst-Werkzeuge)                                                                                                                                                                                                                                                                                                                                                                                                                                 | U1; R1 für Browser-Check                   |
| U3                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | M9 Mouse-over                                                                              | lead-tech · tech-ui-engineer                         | `src/ui/hover.ts` (neu), `input.ts`, `app.ts`, `src/style.css`, `tests/ui/hover.test.ts` (neu)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | U2                                         |
| U4                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | M11 Einbau, K2, K3                                                                         | lead-tech · tech-ui-engineer                         | `hud.ts`, `buildMenu.ts`, `inspect.ts`, `src/style.css`, Tests dazu                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | U3, A1                                     |
| D1                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Doku-Pass                                                                                  | lead-design · Doku                                   | `README.md`, `docs/arc42.md` (§5, §8 ausser Persistenz), Hauptspec                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | U4                                         |

Pfade ohne Präfix liegen im Ordner des Strangs. **Parallelität:** A1 ∥ S1; nach S1: F1 ∥ S2; nach S2 und F1: B1 ∥
R1 ∥ U1; U2 nach U1 (und R1 für den Browser-Check der Forst-Werkzeuge); U3, U4, D1 seriell.
**Planhinweise aus dem Gate Spec (R163, regelt der Plan von lead-tech):** (B9) Importkreis `unlocks` →
`population` (`tierLock`) → `townhall` → `unlocks`; in ESM nur mit Funktionen unkritisch, der Plan legt die Richtung
fest. (B11) Zwischen den Merges von S2 und U1/U2 scheitern die Steuer-Knöpfe der Kopfzeile ohne Amtsstube, und
`guide.ts` liest noch das gespeicherte `taxLevel`; der Plan sieht einen M10-Integrationsbranch vor oder legt den
Zwischenstand per Ruling fest. Möglich ist auch die Teilung von S1 in S1a (Freischaltung) und S1b (Save v5).
**Abhängigkeiten ausserhalb M10:** `src/render/renderer.ts` (Ausnahme U2) teilt M9 H-R2, H-R3, H-R4 — U2 läuft erst
nach deren Merge oder seriell per L0 (Risiko 3). `src/render/sprites.ts` teilt M9 Welle 2 (G1/G8) — R1 und S2 nicht
parallel dazu.

## 20. Änderungen gegenüber Hauptspec, arc42, ADR und früheren AK

| Dokument / Stelle                       | bisher                                                              | mit M10                                                                                                                             |
| --------------------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Hauptspec 2.4 Gebäude                   | alle Gebäude ab Spielbeginn baubar (M8: ausser Bad, Hütte)          | Freischaltbaum U0–U6; Amtsstube neu; Werkzeugmacher mit Betriebsbedingung Schule                                                    |
| Hauptspec 2.2 Karte                     | Gelände fest                                                        | Wald roden und aufforsten (6)                                                                                                       |
| Hauptspec 2.8 Wirtschaft (Steuerregler) | Steuer jederzeit                                                    | **Änderung:** nur mit aktiver Amtsstube; sonst wirkt „normal"                                                                       |
| Hauptspec 3.3 Datenmodell               | `World.version: 4` (M8)                                             | `version: 5`, `unlocked`, `goodLocks`, `upgradeStops`; `BuildingState` + `noService`; `requiresService`, `maxCount`                 |
| Hauptspec 3.7, arc42 §8 Persistenz      | Save v4                                                             | Save v5, Migration v4 → v5, neue Prüfungen, Fixture `save-v4.json`                                                                  |
| arc42 §6 `step`                         | endet mit `checkWin`                                                | endet mit `tickUnlocks`                                                                                                             |
| arc42 §8 Gebäudezustände, ADR-005       | `ok`, `waitingInput`, `storageFull`, `notConnected`, `burning`      | + `noService` (Nachtrag ADR-005)                                                                                                    |
| arc42 §8 Caches                         | `layoutKey` ohne Gelände                                            | mit Geländeart je Kachel (Delta R163 B7); Terrain-Teil-Neuzeichnung auch bei Geländewechsel; gelände-feste Caches mit Bedingung (7) |
| arc42 §5                                | —                                                                   | Bausteine `unlocks`, `townhall`, `forest`, `hover`, `icons`                                                                         |
| M6:AK-S3-07 (`queries.test.ts`)         | `layoutKey` nur durch Bau, Abriss, Weg, Anbindung                   | **Änderung:** zusätzlich Geländewechsel (AK-F1-08)                                                                                  |
| M7:AK-UX-06                             | `hotkeyList()` enthält jede Taste aus `TOOL_HOTKEYS`                | **Änderung:** `hotkeyList(world)`, nur freigeschaltete (AK-U1-03)                                                                   |
| M7:AK-UX-08, M7:AK-UX-10                | Kassen- und Steuer-Satz mit `taxLevel`; Abhilfe nennt jedes Gebäude | **Änderung:** wirksame Steuer, Amtsstube, gesperrte Gebäude gefiltert (AK-S1-19, AK-U2-02)                                          |
| M7:AK-UX-15                             | Steuerregler in der Kopfzeile                                       | gilt weiter; Steuer-Knopf nur mit Amtsstube (AK-U1-11)                                                                              |
| M7:AK-UX-16                             | neues Spiel: „Produktion" 8 Einträge (M8: 9 ab S2)                  | **Änderung:** neues Spiel 2 Einträge; 9 erst mit U6 bzw. „Alles frei" (AK-U1-01, AK-U1-10)                                          |
| M7:AK-UX-03                             | Reason-Tabelle                                                      | **Erweiterung** um die Zeilen aus 11.9 (AK-S2-17, AK-U2-10)                                                                         |
| M7:AK-UX-11, M7:AK-UX-25 (Legende)      | 11 Zeilen                                                           | mit K4 vor der ersten Krisenperiode ohne Brand und Sturm (AK-U2-11)                                                                 |
| M8 14.1 HUD, M8:AK-U1-04, M8:AK-U1-05   | `stock-glass`, `pop-4` mit M8-Regel; Text „Glas 5"                  | Regel verallgemeinert (gleiches Ergebnis); mit U4 steht der Name im `aria-label` (AK-U4-01)                                         |
| M8:AK-U1-09, M8 14.1                    | `lockedToolText(world, defId)`, `unlockNotice`                      | `lockedToolText(world, tool)`, `unlockNoticeText(prev, world)` (17)                                                                 |
| M8:AK-U2-06, M8:AK-U2-10                | Zählung „Produktion" 8 / 9                                          | gilt mit `finishUnlocks` in den M8-Szenarien weiter; Eintragstext im `aria-label` (AK-U4-02)                                        |
| M8:AK-S1-21, M8:AK-S2-19                | `buildLock` aus `unlockTier`                                        | aus `unlocked` (U6), gleiche Texte                                                                                                  |
| M8 18.1 `galerie` mit `withUnlock`      | Helfer setzt `won`                                                  | `unlockAll` plus `finishUnlocks`; `galerie` + Amtsstube                                                                             |
| Programm §6 H-S1                        | „bitgleich, kein Save-Wechsel"                                      | **Änderung (R155):** Sim-Paket F1 in M10; bitgleich, kein eigenes Save-Feld (Delta R163 B7)                                         |

**Kein neues ADR:** Freischaltung, Amtsstube und Roden sind Designentscheide (R155), keine Architekturentscheide.
Keine Änderung an ADR-001 (keine Abhängigkeit), ADR-002 (Sim DOM-frei, `hover.ts` und `icons.ts` liegen in
`src/ui/`), ADR-006 (Symbole eigen, prozedural), ADR-010 (kein neuer Zufall). ADR-005 bekommt einen Nachtrag
(lead-tech in S1, Delta R163 B4): `tickUnlocks` als letzter Aufruf in `step` (Bitgleichheit), Trennung „Freischaltung
gespeichert, Bedingung live", Zustand `noService`.

**Bestehende Tests, bewusst geändert** (Paket in Klammern, Liste im Plan zu vervollständigen):
`tests/sim/balance-crises.test.ts` (`normalized()`; S1), `tests/sim/save.test.ts` (`SAVE_VERSION 5`, „Unbekannte
Version" für 6, Ketten-Erwartungen; S1), `tests/sim/defs.test.ts` (`BUILDING_IDS` + `townhall`, `unlockTier` entfällt;
S1, S2), `tests/sim/fire.test.ts` (brennbare Ids + `townhall`; S2), `tests/sim/queries.test.ts` (M6:AK-S3-07; F1),
`tests/sim/taxes.test.ts` und `tests/sim/population.test.ts` (Steuerfälle mit Amtsstube; S2), alle Sim-, Render- und
UI-Tests mit gesperrten Bauten (`unlockAll`; S1), `tests/sim/scenarios.ts` (S1, S2, B1), `tests/ui/hotkeys.test.ts`
(I; S2 — C, Q, `?`, `hotkeyList(world)`; U1, U2), `tests/ui/guide.test.ts` (S1, U2), `tests/ui/hints.test.ts` (S2,
U2), `tests/render/sprites.test.ts` (S2, R1).

## 21. Offene Punkte mit Empfehlung

1. **Marktplatz-Schwelle 20 (D10, R155, R163).** Entschieden: U1 bleibt bei 20. Playtest P-01 bleibt. Bei „Ja" in
   P-01 Ruling auf 8 (ein Wert in `defs/unlocks.ts`, bitgleich, der Controller baut keinen Markt) **mit AK-Delta**
   AK-S1-01, AK-S1-03, AK-S1-10, AK-B1-01, AK-U2-01, AK-U2-05 (lead-qa B-12).
2. **Alte Stände mit Werkzeugmacher ohne Schule.** Vor M10 war der Werkzeugmacher ab Tick 0 baubar; nach der
   Migration steht er, arbeitet aber ohne Schule nicht (`noService`). Das ist die Folge von D4 („eine Regelwelt").
   _Empfehlung:_ hinnehmen; Panel, Abhilfe und Mouse-over erklären es. Alternative (nicht empfohlen): Bedingung für
   migrierte Werkzeugmacher aussetzen — zweite Regelwelt.
3. **Zäher Anfang (D9).** Playtest P-02. _Empfehlung:_ Hebel „Werkzeugmacher bei U4" vor `START_STOCK.tools`
   (letzterer bricht die Baseline).
4. **Gelände und Tiere ohne Panel.** Der Vorschlag sagt „dieselben Inhalte per Klick im Panel"; für Gelände und
   Tiere gibt es kein Panel (13.2). _Empfehlung:_ in M10 hinnehmen (Inhalte stehen in Tooltips und Hilfe), ein
   Gelände-Panel als Kandidat für M11.
5. **Zeitgrenze Terrain-Neuzeichnung 100 ms (AK-R1-03).** Laut lead-tech (Gate Spec, B10) machbar: Die Glättung
   wirkt nur lokal (etwa eine Kachel Rand), erwartet ≤ 15 ms. _Empfehlung:_ R1 misst `updateTerrainLayer().ms`; liegt
   der Wert über 100 ms, Ruling-Vorlage an L0 mit Messwert statt stiller Lockerung.
6. **Dichter Anfang.** Drei Meldungen in ein bis zwei Minuten (P-03). _Empfehlung:_ beobachten; Hebel wäre eine
   kürzere Meldung ohne „Mehr unter Hilfe (?)" ab der zweiten, kein späterer Auslöser (Bitgleichheit).
7. **Ton `unlock`.** Erfordert eine kleine Ausnahme in `src/audio/` (U1). _Empfehlung:_ so lassen; verzichtet
   `lead-art` auf einen eigenen Pegel, spielt `unlock` die `win`-Datei unverändert.

## 22. Widersprüche und Präzisierungen (R137, nicht still entschieden)

| Nr  | Stelle                                      | Befund                                                                                                                      | Entscheid der Spec (Empfehlung)                                                                                                                |
| --- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Vorschlag 2.1 Punkt 4, 2.3 Handel           | `sell` „frei oder im Lager" ist in der Sim immer erfüllt, wenn `sell` gelingt                                               | `sell` bleibt unverändert; Regel nur in der Anzeige (4.4)                                                                                      |
| 2   | Vorschlag 2.2 Fussnote 1 vs. 2.1 Punkt 4    | Feuerwache bei Krisen „aus" als Sim-Sperre bräche `galerie` und „Alles frei" ohne Nutzen                                    | nur Anzeige-Bedingung `buildingShown`; Taste mit Hinweis (4.4)                                                                                 |
| 3   | Briefing „Cache-Schlüssel in `src/render/`" | Baumstempel, Abdeckung und Weggraph hängen auch an `layoutKey` (`src/sim/queries.ts`)                                       | Geländeart je Kachel in `layoutKey` (F1, Delta R163 B7, löst R159 W3 ab); Render nutzt ihn mittelbar, plus Gelände-Abbild in `terrain.ts` (R1) |
| 4   | Vorschlag 6 Migration Punkt 1               | „frühere Kette" auch für Einträge aus stehenden Gebäuden? Ein früher Werkzeugmacher schaltete sonst Kapelle und Schule frei | Kette nur für Auslöser-Einträge (8.2)                                                                                                          |
| 5   | Vorschlag 6 (Ort)                           | `effectiveTaxLevel`, `townhallActive` in `unlocks.ts`                                                                       | `src/sim/townhall.ts` (neu); trennt Regeln und Paket-Dateien (5.1)                                                                             |
| 6   | Vorschlag 6 `functions`                     | nur `'orders' \| 'forest'`; Ausgabesperre ohne Namen                                                                        | `'goodLocks'` ergänzt (4.2)                                                                                                                    |
| 7   | Vorschlag 5 „Steuer nur mit Amtsstube"      | offen, ob der Regler in der Kopfzeile bleibt                                                                                | Regler ins Amtsstuben-Panel, Kopfzeile nur ein Knopf mit aktiver Amtsstube (11.8)                                                              |
| 8   | Vorschlag 4 Barrierefreiheit                | Gelände und Tiere haben kein Panel                                                                                          | hingenommen, Offener Punkt 4                                                                                                                   |
| 9   | Vorschlag 2.3 `deliverOrder`-Text           | eigener Satz „Aufträge kommen mit den ersten Siedlern"                                                                      | einheitlich `lockText` (4.5)                                                                                                                   |
| 10  | Vorschlag 3.1 Meldungsformat vs. M8         | U6-Text ist M8-Wortlaut ohne „Mehr unter Hilfe (?)"                                                                         | U6 allein wörtlich M8 (M8:AK-U1-09 bleibt), sonst Format „Neu: …" (11.6)                                                                       |
| 11  | Programm §6 H-S1 „kein Save-Wechsel"        | Briefing verlangte `terrainRev` in Save v5                                                                                  | entfallen (Delta R163 B7): kein Weltfeld, Geländeart im `layoutKey`                                                                            |
| 12  | Vorschlag 9.2 Amtsstube                     | `flammable` nicht genannt                                                                                                   | brennbar wie Kapelle (Setzung, 5.1)                                                                                                            |

**Gelöste Beobachtungen** (Eintrag in `docs/beobachtungen.md` schliesst das jeweilige Paket, nicht diese Spec):
„Gesperrtes vor der Freischaltung sichtbar" (a) Tastenliste → U1 (AK-U1-03), (b) Handels-Panel → U1 (AK-U1-06);
„Terrain-Cache hängt an `layoutKey`" → F1 und R1 (AK-F1-08, AK-R1-01, AK-R1-02).

## 23. Delta Gate Spec (R163)

Gate Spec bestanden mit Auflagen (R163). Befunde aus den Berichten von `lead-qa` (B-1 bis B-12) und `lead-tech` (B1 bis
B11), eingearbeitet von `lead-design` in einer Runde. AK-Zahl 96 → **98** (neu AK-R1-05, AK-U2-12).

| Befund           | Stelle in dieser Spec                                                                                          |
| ---------------- | -------------------------------------------------------------------------------------------------------------- |
| QA B-1           | 18.1 Prüfpunkte relativ zum Kontor, `<name>.probes.json`, AK-B1-03                                             |
| QA B-2           | AK-S2-05, AK-S2-07, AK-S2-11 mit `unlockAll`                                                                   |
| QA B-3           | 11.9, 12.3 „Schule kommt, …"; AK-S1-14 (c) mit `noService` und Lager; AK-U2-02                                 |
| QA B-4           | 4.2 Kette nur über Auslöser                                                                                    |
| QA B-5           | AK-S1-05 (b) „Bürgerzahl erreicht `WIN_CITIZENS`"                                                              |
| QA B-6           | AK-F1-04 (Aufforsten auf bebauter Weide), AK-F1-05 (Schäferei)                                                 |
| QA B-7, Tech B10 | 7 Punkt 3, AK-R1-03: Messgrösse `updateTerrainLayer().ms`, 10 Aktionen, Neuaufbau unzulässig; Offener Punkt 5  |
| QA B-8           | AK-S1-13 feste Liste                                                                                           |
| QA B-9           | AK-F1-09 mit Speichern und Laden                                                                               |
| QA B-10          | 18.1: Szenario `m10-krise-bald`, Tick 1549 für `m10-siedler-fast`, „genutzt von" korrigiert                    |
| QA B-11          | 12.3 `M8:AK-S1-19`, 22 Nr. 10 `M8:AK-U1-09`                                                                    |
| QA B-12          | 18.2 P-01, Offener Punkt 1: U1 bleibt 20, AK-Delta bei späterem Ruling benannt                                 |
| Tech B1          | 8.2 `deriveUnlocks` erst nach `isWellFormed`; AK-S1-15 v4 mit beschädigten Gebäuden                            |
| Tech B2          | AK-U1-02, -03, -09, -10 gekürzt; Teile nach AK-U2-12                                                           |
| Tech B3          | 7 Punkt 2 gelände-feste Caches; AK-R1-05; 19 R1                                                                |
| Tech B4          | AK-S1-05 (c), 19 S1 (arc42 §6, ADR-005-Nachtrag), AK-D1-02, 20                                                 |
| Tech B5          | 17: `initialUnlockShown`, `unlockShown`, Zeilen @ 6cbdc56, `MAP_SIGNS`                                         |
| Tech B6          | 13.1, AK-U3-06: gleiche `env`                                                                                  |
| Tech B7 (L0)     | `terrainRev` entfällt; Geländeart im `layoutKey` (6, 7, 8, 9.2, 16, 17, 20, 22); löst R159 W3 ab               |
| Tech B8 (L0)     | 5.1 `maxCount`; Zustand `noService` überall                                                                    |
| Tech B9, B11     | 19 Planhinweise (regelt der Plan)                                                                              |
| Kopf             | Code-Stand `main` @ 9460ab9, `feat/m8-ui` @ 6cbdc56; Zeilen `population.ts` 124/166/199, `serviceAvailable` 59 |

## 24. Delta R170 (4): Thema „Fischer gehen an Land" (Texte, keine Struktur)

Stand 2026-10-03, Auftrag Ruling R170 (4), Nutzerwortlaut: „‚Freischaltbar' auch für alle bisherigen Gebäude
einschalten. Konzept, welches thematisch Sinn macht. Am Anfang ungebildete Fischer, die an Land gehen." Dieses Delta
ändert **nur den Wortlaut der Spalte `tip`** in `defs/unlocks.ts` (4.5). Es ändert keinen Baum, keine Typen, keine
Auslöser, keine Werte und keine Abnahmekriterium-Aussage.

**Abdeckung (geprüft gegen `BUILDING_DEFS`, 16 Gebäude):** Jede `BuildingDefId` ausser `kontor` steht in genau einem
Eintrag von 4.2 (`townhall` in U3, ab S2). Weg und Abriss sind frei, das Kontor ist nicht baubar. Es fehlt nichts; der
Baum deckt alle bisherigen Gebäude ab (AK-S1-01 prüft das schon). Auch thematisch trägt die Reihe: Die Kette
Fischerhütte → Kapelle/Weberei → Schule → Werkzeugmacher folgt dem Weg von ungebildeten Fischerleuten zu qualifizierter
Arbeit (die Schule steht vor dem Werkzeugmacher, 5.5).

**Rahmen:** Die ersten Bewohner (Stufe 1, „Pioniere") sind einfache Fischerleute ohne Bildung, die mit einem Kontor am
Strand an Land gehen. Jede Stufe weckt ein neues Bedürfnis: Kleidung und Glauben (U2), Verwaltung (U3), Bildung und
Genuss (U4), gelernte Arbeit (U5), Hygiene und Glas (U6). Den Stufennamen **„Pioniere" behalten wir**: Er trägt den
Rahmen schon (wer an Land geht, ist Pionier), und eine Umbenennung auf „Fischer" verwechselt sich mit der Fischerhütte.
Die Umbenennung ist **keine Textänderung** (Treffer in `TIERS`, `lockText`, `whenText`, `popChipView`, T02a, T03b, T06b,
T07b, T09, `qa-checks`, README) und wird hier **nicht** vorgenommen.

**Neue Spalte `tip` (ersetzt die Texte in 4.5 und in T01c; ≤ 175 Zeichen, kein „Tick"):**

| Id  | `tip`                                                                                                                                                     |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| U0  | Fischerleute gehen an Land, ohne Bildung und ohne Besitz: Dach, Holz und Fisch müssen reichen. Wohnhäuser brauchen keinen Weg, Betriebe schon: verbinde sie mit dem Kontor. |
| U1  | Aus dem Lager am Strand wird ein Dorf. Ein Marktplatz versorgt Wohnhäuser wie das Kontor und braucht einen Weg.                                           |
| U2  | Die Fischer wollen mehr als Fisch: Kleidung, Glauben, feste Mauern. Die Schäferei braucht Weide im Umkreis: rode Wald (C), wenn es eng wird.              |
| U3  | Aus Siedlern wird eine Gemeinde, und Händler laufen deinen Hafen an. In der Amtsstube stellst du die Steuer ein; Aufträge am Kontor bringen eine Prämie.  |
| U4  | Wer Kleidung und Glauben hat, will lesen und feiern: Schule und Rum. Zuckerrohr wächst wie Schafe nur mit Weide im Umkreis.                               |
| U5  | Gelernte Hände fertigen Werkzeug: Der Werkzeugmacher arbeitet nur mit einer Schule in Reichweite. In der Amtsstube sperrst du Güter je Stufe.             |
| U6  | Bürger wollen Hygiene und helle Fenster. Kaufleute brauchen Glas und ein Badehaus.                                                                        |

**`notice` bleibt unverändert** (4.5, 11.6): Die Gründe erzählen den Bogen schon („deine Pioniere wollen Siedler
werden", „die ersten Siedler sind da"), und ihr Wortlaut steht als Literal in T06b, 11.6 und `qa-checks`. `lockText`
und `whenText` bleiben unverändert (AK-S1-01, T01b, T02a, T03b, T07b prüfen sie wörtlich).

**Folgen für M10:** Keine für T01a, T01b, T01d, T01e, T02 bis T09 und alle AK. Einzig **T01c** übernimmt die sieben
`tip`-Literale aus der Tabelle (keine Assertion dahinter ausser „nicht leer" und „kein Tick", T01b; T07b prüft
`UNLOCKS[0].tip` per Verweis, nicht per Literal). **T01 kann unverändert starten**; die Tip-Literale lassen sich in
T01c nachziehen. Das Hilfe-Fenster zeigt höchstens drei Tipps (12.1), also passt die längere U0-Zeile bei Spielstart
neben zwei weitere. Ein Tip-Text, der die Zeilenbreite der Hilfe-Karte sprengt, kürzt `lead-art` (Wortlaut, nicht
Inhalt, 4.5).

**Nicht Teil dieses Deltas:** Fortschreibung des Themas in den Gebäude-Mouse-overs (13.2) und im Text der Start-Karte
(`startSteps`, Test `startCard.test.ts`); beides wäre eine Änderung geprüfter Literale. Vorschlag für später (Kann).
