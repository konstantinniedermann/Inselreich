# M13 Etappe E1 «Edikte der Amtsstube» und «Betrieb stilllegen» (I-031, I-035) — Design-Spec

Datum: 2026-10-10 · Paket M13-E1-SPEC · Meilenstein M13 «Spätspiel mit Richtung» · Status: **Entwurf, Gate Spec
(lead-qa, L0), danach Plan (lead-tech)** · Prozessstufe voll

Grundlage: [Designvorschlag](2026-10-10-spaetspiel-vorschlag.md) §4.1, §6, §7, §8, §9 (verbindlich für Regeln und
Zahlen), [Rechnung](2026-10-10-spaetspiel-vorschlag/anhang-01-rechnung.md) B, D; Ruling **R452** (Ansatz A, O1–O11
wie empfohlen, Auflagen B1–B3); `docs/ideen.md` I-031, I-035; [Hauptspec](2026-09-29-inselreich-design.md). Muster:
[Spec Steuer je Stufe](2026-10-09-steuer-je-stufe-design.md). Code-Stand der Prüfung: `main` 08079e66.

Anhänge: [01 Rechenbeispiele und Erwartungswerte](2026-10-10-m13-e1-edikte-design/anhang-01-rechenbeispiele.md) ·
[02 Save v11](2026-10-10-m13-e1-edikte-design/anhang-02-save-v11.md) ·
[03 Seed-Läufe B1/B3](2026-10-10-m13-e1-edikte-design/anhang-03-seed-laeufe.md) ·
[04 Zuordnung R452](2026-10-10-m13-e1-edikte-design/anhang-04-zuordnung-r452.md).

Kennzeichnung: **Setzung Spec** (hier ergänzt, im Vorschlag nicht festgelegt), **[Tech]** (Umsetzungsdetail; lead-tech
entscheidet im Plan, die Spec legt nur das prüfbare Verhalten fest).

## 1. Ziel

**Spielerzweck E1:** «Nach dem Bürger-Ziel erlässt der Spieler in der Amtsstube genau ein Edikt — Sparen, Handel oder
Wohlfahrt —, zahlt 600 Geld und gibt seiner Insel eine Richtung; ein Wechsel kostet erneut und ist 5 Minuten
gesperrt.»

**Spielerzweck I-035:** «Bei vollem Lager legt der Spieler einen Betrieb im Panel still, zahlt nur noch halben
Unterhalt und fährt ihn mit einem Klick wieder an, wenn die Ware gebraucht wird.»

Heute wächst die Kasse nach Ziel 1 ohne Entscheid (Vorschlag §2). Die Edikte sind eine Ausschluss-Wahl, die mit der
Spielphase kippt: Sparen gewinnt die stehende Kolonie, Handel den Zukauf, Wohlfahrt die Ausbauwelle; kein Edikt ist
Pflicht (Rechnung B.4). Das Stilllegen ist die erste kleine Unterhalts-Entscheidung «Geld gegen Bereitschaft der
Kette». Beide Teile teilen nur den Save-Sprung auf v11 (O10) und sind sonst unabhängig.

## 2. Umfang und ausdrücklich nicht

**Im Umfang:**

- Sim Edikte: Zustand `edict`, `edictLockedUntil`; Aktion `setEdict`; Wirkungen auf Steuer, Unterhalt, Kaufpreis,
  Wachstumstakt und Aufstiegs-Wartezeit; Stapelregel; Ruhe bei nicht wirkender Amtsstube; Abriss.
- Sim Stilllegen (§8): Flag `paused` je Betrieb, Zustand `'paused'`, Aktion `setPaused`, halber Unterhalt, Bilanz.
- Save v11 mit Migration v10 → v11, Ladeprüfung, Abweisen inkompatibler Stände mit Hinweis, Rückfaltung
  `foldBackToV10` für die Hash-Pins.
- UI: Abschnitt «Edikt» im Amtsstuben-Panel, Kaufpreise am Kontor, Tooltip Steuerknopf, Knopf «Stilllegen» im
  Betriebs-Panel; reine Helfer mit Vitest; README, arc42.
- Seed-Läufe für die Auflagen B1 (Wohlfahrt trägt) und B3 (Baseline).

**Ausdrücklich nicht** (Vorschlag §10, R452):

- Denkmal (Etappe E2, eigene Spec; O7, O8, O11 und Auflage B3 «Denkmal-Dauer» gehören dorthin);
- Edikte je Insel, mehr als ein aktives Edikt, frei einstellbare Edikt-Werte, Wechselgebühr (O9: erst nach Playtest);
- Controller-Strategie mit Edikt oder Stilllegung (`tests/sim/controller.ts`, `merchantsController.ts` unverändert);
- Wertänderungen an bestehenden Defs (`TAX_LEVELS`, `TIERS`, `GOODS`, `BUILDING_DEFS`, Fest, `GROWTH_INTERVAL`);
- Handel H1 (Sättigungs-Erholung); Chronik-Einträge für Edikt oder Stilllegung; neue Statusmarke oder Grafik;
- automatisches Stilllegen bei «Lager voll» (I-035: nimmt die Wahl weg); Stilllegen von Diensten, Häusern, Kontor;
- Tastenkürzel für Edikt oder Stilllegen; Mobil-Optimierung (Desktop-first ab 1280 px).

## 3. Regeln Edikte

Begriffe: **Edikt** = `EdictId` (`'saving'` Sparen, `'trade'` Handel, `'welfare'` Wohlfahrt). **Wirkendes Edikt** =
`activeEdict(w)`. **Amtsstube wirkt** = `townhallActive(w)` (angebunden, ohne Ausfall; heutige Funktion).

### R1 Zustand und Wirkung

- **R1.1** Der Weltzustand trägt `edict: EdictId | null` (Start `null`) und `edictLockedUntil: number` (Start 0).
  Genau ein Edikt ist erlassen oder keines; es gilt für alle Inseln.
- **R1.2** `activeEdict(w) = townhallActive(w) ? w.edict : null`. Alle Wirkungen R3–R5 lesen nur `activeEdict`.
  Wirkt die Amtsstube nicht (brennt, nicht angebunden), ruhen sie; `edict` und `edictLockedUntil` bleiben
  (Vorschlag E2, wie `effectiveTaxLevel`).
- **R1.3** Ohne wirkendes Edikt rechnet jede Formel exakt wie heute (Steuerabzug 0, kein Unterhalts-Abzug, Takt
  `GROWTH_INTERVAL`, Wartezeit unverändert, Kaufpreis `n × buy`). Kein Pfad zieht Zufall.

### R2 Aktion `setEdict(world, id: unknown): Result`

Neues Modul `src/sim/edicts.ts`. Wirft nie, zieht keinen Zufall, ändert bei `ok: false` nichts. `id === null` heisst
«Aufheben». Prüfreihenfolge:

1. `id` weder `null` noch Schlüssel von `EDICTS` → `'Ungültiges Edikt'`;
2. nicht freigeschaltet (`world[EDICT_UNLOCK] !== true`, heute `world.won`) → `'Erst nach dem Bürger-Ziel'`;
3. Amtsstube wirkt nicht → `townhallReason(world)` (`'Braucht eine Amtsstube'` / `'Amtsstube wirkt nicht'`);
4. `id === world.edict` → bei `null` `'Kein Edikt aktiv'`, sonst `'Edikt bereits aktiv'`;
5. `world.tick < world.edictLockedUntil` → `'Edikt-Sperrzeit'`;
6. `id !== null` und `world.money < EDICT_COST` (auch bei negativem Geld) → `'Zu wenig Geld'`;
7. sonst: bei `id !== null` `money −= EDICT_COST`; `edict = id`; `edictLockedUntil = tick + EDICT_LOCK`; `ok`.

Folgen: Erlassen und Wechseln kosten je 600 Geld; Aufheben ist kostenlos und sperrt ebenfalls 3000 Ticks (5 min).
Es gibt keine Erstattung. **Setzung Spec:** Der eigene Grund `'Edikt-Sperrzeit'` trennt die Sperre vom Steuer-Grund
`'Sperrzeit'`, damit `friendlyReason` den richtigen Resttext findet.

### R3 Sparen — Unterhalt −20 %, Steuer −7 Punkte

- **R3.1 Unterhalt:** `totalUpkeep(w)` = Summe S der `buildingUpkeep(b)` aller Gebäude plus `ships.length ×
SHIP.upkeep` (heutige Summe; `buildingUpkeep` berücksichtigt die Stilllegung, S4). Hat `activeEdict` ein
  `upkeepPct < 100`, gilt `⌊S × upkeepPct / 100⌋`, sonst S unverändert. Einmal auf die Summe, nicht je Gebäude.
- **R3.2** `stats.upkeep` und die Buchung über `upkeepCarry` nutzen diesen wirksamen Wert; Kopfzeile und Bilanz
  zeigen ihn. Die Unterhaltszeile im Gebäude-Panel bleibt der Wert des Gebäudes (ohne Edikt-Abzug).
- **R3.3 Steuer:** `edictTaxPoints(w)` = `EDICTS[activeEdict].taxPoints` oder 0. Je Stufe t gilt
  `effectiveTaxPct(w, t) = taxPct(effectiveTaxLevel(w, t), t) − edictTaxPoints(w)` und
  `taxUnits(w) = Σₜ base[t] × effectiveTaxPct(w, t)`. Prozentpunkte, ganzzahlig: normal 100 → 93, niedrig 70 → 63,
  hoch 130 → 123, Kaufleute hoch 115 → 108. `TAX_CARRY_DIVISOR` und Verbuchung unverändert.
- **R3.4** Rechenbeispiele: Anhang 01 A (Steuer), B (Unterhalt).

### R4 Handel — Kaufpreise −20 %, aufgerundet

- **R4.1** `buyPrice(world, good, n)` (neue Signatur mit Welt, `src/sim/trade.ts`): mit `EDICTS[activeEdict].buyPct
< 100` gilt `⌈n × GOODS[good].buy × buyPct / 100⌉` über die Gesamtmenge, sonst `n × GOODS[good].buy`. [Tech:
  ganzzahlig rechnen, z. B. `⌊(n × buy × pct + 99) / 100⌋`; alle Aufrufer in `src/` und `tests/` bekommen die Welt.]
- **R4.2** Gilt für jeden Kauf an jedem Kontor (`buy` mit beliebiger Insel). Aufrunden ist Pflicht: Kein Gut lässt
  sich mit Gewinn kaufen und über einen Auftrag liefern oder im Boom verkaufen (Anhang 01 C, Marge ≥ 1 je Stück bei
  n = 1). Auftragsprämie (`⌊buy × ORDER_PREMIUM⌋`) und Verkaufspreise bleiben unverändert.

### R5 Wohlfahrt — Takt 40, Wartezeit 200, Steuer −5 Punkte

- **R5.1 Takt:** `growthInterval(w) = EDICTS[activeEdict].growthInterval ?? GROWTH_INTERVAL`. `tickPopulation`
  wächst und prüft Aufstiege, wenn `tick % growthInterval(w) === 0 && tick > 0`. Der Takt ist die Phase des Ticks,
  nicht ab Erlass gezählt (Anhang 01 G). Er wirkt in beide Richtungen: Bei Mangel schrumpfen Häuser ebenfalls alle
  40 Ticks (zweiter Preis, Vorschlag E4).
- **R5.2 Wartezeit:** `EDICTS.welfare.upgradeWait = 200` geht in die Stapelregel R7 ein.
- **R5.3 Steuer:** 5 Punkte nach R3.3.

### R6 Amtsstube abgerissen, brennt, neu gebaut

- **R6.1** `demolish` der Amtsstube setzt `edict = null`; `edictLockedUntil` bleibt (kein Sperr-Reset durch Abriss
  und Neubau). Keine Erstattung der 600; die Gebäude-Erstattung wie heute.
- **R6.2** Brand oder fehlende Anbindung: R1.2 (Wirkung ruht, Zustand bleibt). Nach Ende des Ausfalls wirkt das
  Edikt ohne Aktion wieder.
- **R6.3** Eine neue Amtsstube übernimmt kein Edikt (es ist `null`); ein neues Edikt ist erst nach Ablauf der
  bestehenden Sperre möglich.

### R7 Stapelregel der Aufstiegs-Beschleuniger (Vorschlag E5)

- **R7.1** In `upgradeStatus` gilt für `base = TAX_LEVELS[effectiveTaxLevel(w, tier)].upgradeWait ≠ null`:
  `waitBase = max(TAX_LEVELS.low.upgradeWait, min(base, festive ? TAX_LEVELS.low.upgradeWait : ∞, edictWait))` mit
  `edictWait = EDICTS[activeEdict].upgradeWait ?? ∞`. Danach unverändert `wait = waitBase × (damped ?
UPGRADE_DEFICIT_WAIT_FACTOR : 1)`: Der Defizit-Faktor greift **nach** dem Minimum.
- **R7.2** Nichts multipliziert sich; die Untergrenze 150 Ticks gilt immer (Def-Test und Klemme). «hoch»
  (`base === null`) bleibt «Steuer zu hoch»; Wohlfahrt schaltet den Aufstieg nicht frei. Das Fest wirkt wie heute.
- **R7.3** Ergebnistabelle (alle Kombinationen): Anhang 01 D. Kernfall: «niedrig» + Fest + Wohlfahrt = 150, mit
  Defizit 300.

## 4. Datenmodell und Def-Einträge

`src/sim/defs/edicts.ts` (neu), `EDICTS: Record<EdictId, EdictDef>`:

| Schlüssel | `name`    | `upkeepPct` | `taxPoints` | `buyPct` | `growthInterval` | `upgradeWait` |
| --------- | --------- | ----------- | ----------- | -------- | ---------------- | ------------- |
| `saving`  | Sparen    | 80          | 7           | 100      | `null`           | `null`        |
| `trade`   | Handel    | 100         | 0           | 80       | `null`           | `null`        |
| `welfare` | Wohlfahrt | 100         | 5           | 100      | 40               | 200           |

| Ort                         | Eintrag                                       | Wert / Typ                                     |
| --------------------------- | --------------------------------------------- | ---------------------------------------------- |
| `src/sim/defs/edicts.ts`    | `EDICT_IDS`                                   | `['saving', 'trade', 'welfare']` (Kartenfolge) |
| `src/sim/defs/edicts.ts`    | `EDICT_COST`                                  | 600                                            |
| `src/sim/defs/edicts.ts`    | `EDICT_UNLOCK`                                | `'won'` (Weltflagge)                           |
| `src/sim/defs/timing.ts`    | `EDICT_LOCK`                                  | 3000 Ticks                                     |
| `src/sim/defs/buildings.ts` | `PAUSED_UPKEEP_PCT`                           | 50 (§8, S4)                                    |
| `src/sim/types.ts`          | `EdictId`, `EdictDef`, `World.edict`, `…Lock` | neu; `World.version: 11`                       |
| `src/sim/types.ts`          | `Building.paused?`, `BuildingState`           | `true`; Zustand `'paused'` neu                 |
| `src/sim/save.ts`           | `SAVE_VERSION`, `migrateV10ToV11`, Prüfung    | 11 (Anhang 02)                                 |

Neue bzw. geänderte Sim-Funktionen: `activeEdict`, `setEdict`, `edictTaxPoints`, `growthInterval` (`edicts.ts`);
`effectiveTaxPct` (`townhall.ts`), `taxUnits`, `tickPopulation`, `upgradeStatus` (`population.ts`), `totalUpkeep`
(`economy.ts`), `buyPrice`, `buy` (`trade.ts`), `demolish` (`build.ts`); für §8 `setPaused`, `buildingUpkeep`,
`advance`, `goodsBalance`, `tickCrises`, `recomputeConnectivity`. [Tech: Modulzuordnung, solange keine
Importkreise entstehen.] Keine neue Laufzeit-Abhängigkeit, kein RNG-Zugriff, `src/sim/` bleibt DOM-frei.

**Def-Test** (`tests/sim/defs.test.ts`): `EDICTS.welfare.upgradeWait ≥ TAX_LEVELS.low.upgradeWait`;
`0 < growthInterval < GROWTH_INTERVAL`, falls gesetzt; jedes `taxPoints` kleiner als der kleinste Satz aus
`TAX_LEVELS` (70) und ganzzahlig ≥ 0; `upkeepPct`, `buyPct` ganzzahlig in 1 … 100; `EDICT_IDS` = Schlüssel von
`EDICTS`; `PAUSED_UPKEEP_PCT` ganzzahlig in 1 … 99.

## 5. Randfälle Edikte

- **Vor Ziel 1:** `'Erst nach dem Bürger-Ziel'`; die UI zeigt den Abschnitt gesperrt (U-4).
- **Spielstand mit Ziel 1 oder 2 erreicht** (v10 geladen): sofort wählbar (Anhang 02 B).
- **Geld unter 600 oder negativ:** Erlassen und Wechseln abgelehnt, Aufheben erlaubt. Ein laufendes Edikt wirkt
  weiter; es gibt keine laufenden Kosten, also keine Pleite-Spirale.
- **Sperre läuft** auch ohne Amtsstube, bei negativem Geld und über Speichern/Laden (Feld im Stand).
- **Amtsstube brennt, Abriss, Neubau:** R1.2, R6; während des Ausfalls liefert `setEdict` `'Amtsstube wirkt nicht'`.
- **Wechsel Wohlfahrt → anderes Edikt** mitten im Aufstieg: Wartezeit und Takt gelten ab dem nächsten Tick neu; die
  bereits erfüllte Zeit (`satisfiedSince`) bleibt, ein Haus kann also durch den Wechsel länger warten.
- **Leere Insel / keine Häuser:** Steuerabzug wirkt auf 0; Sparen spart nur Unterhalt.
- **Zyklisches Umschalten** (Sparen ↔ Handel für Zukauf-Blöcke): erlaubt, gebunden an Einkaufsvolumen, ≈ 3,6 % des
  Einkommens (Rechnung B.6); kein Dauer-Exploit, keine Wechselgebühr (O9).

## 6. Baseline, Balancing und Auflagen

**Bitgleich ohne Edikt und ohne Stilllegung** (Vorschlag §7, D.2):

- (a) Controller und Balancing-Tests rufen weder `setEdict` noch `setPaused` auf → `edict` bleibt `null`, kein
  Gebäude trägt `paused`.
- (b) R1.3: alle Formeln ohne wirkendes Edikt identisch; `buyPrice` ohne Handel `n × buy`; `goodsBalance` und
  Unterhalt ohne `paused` wie heute.
- (c) Neue Weltschlüssel stehen am Ende; `foldBackToV10` entfernt sie für Hash-Pins (Anhang 02 D).
- (d) Kein RNG-Zugriff in neuen Pfaden; Brandziele hängen nicht an `state` oder `paused` (`fireTarget` liest nur
  `flammable`, Lage, Id).

**Balancing-Test:** `tests/sim/balance.test.ts` bleibt ohne Änderung grün; keine Pin-Änderung in `e0Pins.ts`,
`e1Pins.ts`, `balance-merchants.test.ts`. Keine Wertänderung an bestehenden Defs, also kein Balancing-Ruling;
nur neue Konstanten.

**Auflagen R452:**

- **B1 Wohlfahrt per Simulation belegen:** AK-E1-16 (Pfadzeiten, exakt), AK-E1-17 (Seed-Lauf «reich»), AK-E1-18
  (Seed-Lauf «Welle», Kern), AK-E1-11 (Schrumpfen als Preis). Aufbau und Grenzen: Anhang 03. Fällt AK-E1-18 durch,
  greift der Rückfall O3 (§12, P-1).
- **B2 Wirkung im Endzustand bewusst klein:** AK-E1-20 mit Welt Phase c: Sparen +244 je 600 Ticks (4,3 % der
  Bilanz), Handel +144 bei 48 Stein Zukauf, Wohlfahrt −528 stationär (Anhang 01 F). README sagt es in einem Satz
  (§11).
- **B3 Baseline:** AK-E1-21 (Referenzlauf ohne Edikt 6750 / 11 500 Ticks, Balancing-Test grün). Der Denkmal-Teil
  von B3 gehört zur Spec E2.

**Befund zur Rechnung:** §12 P-2 (Messwerte ohne Amtsstube; Pfadzeit 800 statt 790, Anhang 01 E).

## 7. UI Edikte

Desktop-first für die Panel-Spalte (280 px) ab 1280 px Fensterbreite (Zielauflösungen 1280×720 und 1920×1080);
schmalere Fenster nur «stürzt nicht ab». Alle Zahlen und Namen kommen aus `EDICTS`, `EDICT_COST`, `EDICT_LOCK` und
Sim-Abfragen, keine kopierte Zahl im UI. Card-UI, CSS Grid.

### 7.1 Reine Helfer (DOM-frei, Vitest unter `tests/ui/`, z. B. `src/ui/edictView.ts` [Tech])

- **`edictEffectText(id)`** → Wirkung aus den Def-Werten, Teile mit « · »:
  Sparen «Unterhalt −20 % · Steuer −7 Punkte»; Handel «Kaufpreise am Kontor −20 %»; Wohlfahrt «Wachstum alle 4 s
  statt 5 s · Aufstieg nach 20 s · Steuer −5 Punkte» (Zeiten über `formatGameTime`).
- **`edictWhenText(id)`** → fester Satz «lohnt, wenn …» je Edikt (Setzung Spec, Text aus dem Vorschlag E4): Sparen
  «die Kolonie steht und wenig kauft», Handel «du Ware zukaufst», Wohlfahrt «du viele neue Häuser hochziehst».
- **`edictLockText(w)`** → `wieder änderbar in {formatGameTime(rest)}` mit `rest = edictLockedUntil − tick > 0`,
  sonst `''`. Beispiele: Rest 3000 → «wieder änderbar in 5:00», Rest 450 → «… in 45 s».
- **`edictCardState(w, id)`** → `{ active, disabled, reason, buttonText }`:
  `active = w.edict === id`; `buttonText` = aktiv «Aufheben», sonst «Erlassen (600)»; `reason` = der Grund, den
  `setEdict` liefern würde (über eine reine Prüffunktion, nicht durch Ausführen [Tech]), sonst `null`; `disabled =
reason !== null` ausser bei `'Zu wenig Geld'` (Knopf bleibt klickbar mit Klasse `unaffordable`, wie Bauleiste).
- **`edictStatusLine(w)`** → «Edikt: Sparen» / «Kein Edikt» / bei erlassenem Edikt und nicht wirkender Amtsstube
  «Edikt Sparen ruht: Amtsstube wirkt nicht».

### 7.2 Amtsstuben-Panel, Abschnitt «Edikt»

- **U-1** Neuer Abschnitt nach der Steuerzeile `tax-effect`, vor Ausgabesperre und Aufstiegsstopp: Überschrift
  «Edikt», Statuszeile `edictStatusLine`, darunter die Sperrzeile `edictLockText` (verborgen ohne Sperre).
- **U-2** Drei Karten in `EDICT_IDS`-Reihenfolge, **untereinander** in einem Grid mit einer Spalte (**Setzung
  Spec:** Die Skizze «nebeneinander» passt nicht in 280 px). Je Karte: Name (`EDICTS[id].name`), `edictEffectText`,
  `edictWhenText` (klein), ein Knopf mit `buttonText`. Die aktive Karte trägt Klasse `active` und
  `aria-pressed="true"`.
- **U-3** Klick «Erlassen (600)» ruft `setEdict(w, id)`, Klick «Aufheben» ruft `setEdict(w, null)`. Erfolg →
  Meldung «Edikt ‹Sparen› erlassen — wieder änderbar in 5:00» bzw. «Edikt aufgehoben — wieder änderbar in 5:00»;
  Fehler → `friendlyReason` (U-6).
- **U-4** Vor der Freischaltung sind alle Karten sichtbar, blass (`disabled`) mit der Zeile «Erst nach dem
  Bürger-Ziel» statt der Statuszeile (Ausblick, Vorschlag §12 Punkt 2).
- **U-5** Die Karten werden einmal je Auswahl gebaut; die Nachführung setzt nur Text, Klassen, `hidden`, `disabled`,
  `title` (Knoten bleiben über Ticks gleich, Fokus bleibt; Muster Steuer-Raster U-6).
- **U-6 Gründe** (`src/ui/hints.ts`): `'Edikt-Sperrzeit'` → «Edikt erst in {formatGameTime(rest)} wieder änderbar»;
  `'Zu wenig Geld'` mit `cost.money = EDICT_COST` → «Zu wenig Geld: 600 nötig, {money} vorhanden» (vorhandene
  Regel); `'Erst nach dem Bürger-Ziel'`, `'Edikt bereits aktiv'`, `'Kein Edikt aktiv'`, `'Ungültiges Edikt'`
  wörtlich; Amtsstuben-Gründe wie heute.

### 7.3 Übrige Stellen

- **U-7 Kontor-Handel** (`src/ui/trade.ts`, `app.ts` `tradeCtx`): Stückpreis-Spalte zeigt `buyPrice(w, g, 1)`,
  Kaufknopf-Text und Leistbarkeit nutzen `buyPrice(w, g, n)`. Mit wirkendem Handel trägt die Spaltenüberschrift
  bzw. der Tooltip den Zusatz «Edikt Handel: −20 %» [Tech: Ort].
- **U-8 Kopfzeile:** Tooltip des Steuerknopfs (`taxButtonTitle`) bekommt bei wirkendem Edikt den Zusatz
  « · Edikt: {Name}»; ohne Edikt unverändert.
- **U-9 Steuerraster:** Die Spalte «… / min» (`tierTaxPerMinute`) rechnet mit `effectiveTaxPct` (wirksamer Wert);
  die Knopf-Tooltips (`tierTaxTooltip`) zeigen weiter den Satz der Steuerstufe. `taxStatusLine` bekommt bei
  wirkendem Edikt mit Steuerabzug den Zusatz « · Edikt −7 Punkte» bzw. «−5 Punkte».
- **U-10 Haus-Panel:** «Aufstieg in höchstens {formatGameTime(growthInterval(w))}» statt fester 50 Ticks
  (`inspect.ts`); die Wartezeit im Grund folgt R7 von selbst.

## 8. Betrieb stilllegen (I-035, eigenes S-Teil im selben Save-Sprung)

### 8.1 Regeln

- **S1 Wer:** stilllegbar ist jedes Gebäude mit `BUILDING_DEFS[defId].produces` (Betriebe, auf jeder Insel). Nicht:
  Wohnhäuser, Dienste (Kapelle, Schule, Badehaus, Feuerwache), Markt, Kontor, Kontor 2, Amtsstube.
- **S2 Aktion `setPaused(world, id: unknown, paused: unknown): Result`** (wirft nie, kein Zufall, bei `ok: false`
  keine Änderung, kein Geld, keine Sperre, keine Amtsstube nötig). Prüfreihenfolge:
  1. kein Gebäude mit dieser Id → `'Gebäude nicht gefunden'`;
  2. `paused` kein Boolean → `'Ungültiger Wert'`;
  3. kein Betrieb (S1) → `'Nur Betriebe lassen sich stilllegen'`;
  4. `paused === true` und schon still → `'Schon stillgelegt'`; `paused === false` und läuft → `'Läuft bereits'`;
  5. Stilllegen: `b.paused = true`; `state = 'paused'`, ausser er ist `'burning'`. Anfahren: Schlüssel `paused`
     löschen; `state = outageUntil ? 'burning' : connected ? 'ok' : 'notConnected'` (wie Ende eines Ausfalls). `ok`.
- **S3 Produktion** (`advance`): Prüfreihenfolge Ausfall → **stillgelegt** → Anbindung → Dienst → Wald → Sturm →
  Eingang. Stillgelegt: `state = 'paused'`, kein Fortschritt, keine Entnahme, `progress` bleibt. Die Auslastung
  `eff` läuft mit Zielwert 0 (wie «Lager voll»). Ende eines Ausfalls (`tickCrises`) und `recomputeConnectivity`
  setzen bei `paused` den Zustand `'paused'` (Vorrang nach `'burning'`).
- **S4 Unterhalt:** `buildingUpkeep(b) = paused ? ⌈upkeepOf(b) × PAUSED_UPKEEP_PCT / 100⌉ : upkeepOf(b)`; die
  Ersparnis ist höchstens die Hälfte (5 → 3, 25 → 13, Stufe 2 Glashütte 33 → 17; Anhang 01 B). Gilt auch während
  eines Brands. Mit Sparen: erst je Gebäude halbieren, dann die Summe nach R3.1.
- **S5 Bilanz:** `goodsBalance` zählt stillgelegte Betriebe weder als Erzeuger noch als Verbraucher. Folge: Die
  Warenbilanz der Kopfzeile zeigt keinen falschen Trend, und die Aufstiegs-Dämpfung sieht das Defizit, das die
  Stilllegung erzeugt (gewollt: Stilllegen hat einen Preis).
- **S6 Übriges:** Ausbau (`upgradeBuilding`) und Abriss wie heute, das Flag bleibt bzw. verschwindet mit dem Gebäude.
  Ein stillgelegter Betrieb kann brennen (Brandziel unverändert, §6 d); das Flag bleibt, nach dem Ausfall ist er
  wieder `'paused'`. Ketten laufen leer: Eine stillgelegte Schäferei lässt die Weberei nach Verbrauch der Wolle mit
  `'waitingInput'` stehen. Freischaltungen zählen den Betrieb weiter als gebaut.
- **S7 Save:** Flag `paused?: true` und Zustand `'paused'` in v11 (Anhang 02 C5–C7).

### 8.2 UI

- **U-11** Betriebs-Panel: Knopf «Stilllegen» bzw. «Wieder anfahren» unter der Zustandszeile; Tooltip «Halber
  Unterhalt, keine Erzeugung». Klick ruft `setPaused`; Fehler über `friendlyReason` (Gründe aus S2 wörtlich).
- **U-12** Zustandstext (`src/ui/texts.ts`, Fall `'paused'`): «Stillgelegt — halber Unterhalt» (nicht ok);
  Unterhaltszeile zeigt `buildingUpkeep` (z. B. Glashütte «Unterhalt 78 / min» statt 150). Mouse-over (`hover.ts`):
  Zeile «Stillgelegt». Panel-Übersicht (`panelView.ts`): Zustand «stillgelegt».
- **U-13** Leitfaden (`guide.ts`) bei «Lager voll»: Zusatz «oder lege den Betrieb still». Für einen stillgelegten
  Betrieb kein Hinweis. Keine Statusmarke auf der Karte (`statusMarkOf('paused')` liefert `null`).

### 8.3 Abnahmekriterien Stilllegen

Datei `tests/sim/pause.test.ts`, Welt `createWorld(3, { unlockAll: true })`, Gebäude roh eingesetzt und angebunden.

- **AK-STL-01** Fischer läuft: `setPaused(w, id, true)` → ok, `paused === true`, `state === 'paused'`; zweiter
  Aufruf → `'Schon stillgelegt'`; `setPaused(w, id, false)` → ok, kein Schlüssel `paused`, `state === 'ok'`;
  erneut → `'Läuft bereits'`.
- **AK-STL-02** Gründe und Unversehrtheit: Id 9999 → `'Gebäude nicht gefunden'`; Wohnhaus, Kapelle, Kontor,
  Amtsstube, Markt → `'Nur Betriebe lassen sich stilllegen'`; `paused` `'ja'` / `1` / `undefined` →
  `'Ungültiger Wert'`. Für `id` ∈ {−1, 0, 1.5, `NaN`, `'2'`} × `paused` ∈ {`true`, `false`, `'x'`}: nie eine
  Ausnahme, bei `ok: false` `serialize(w)` unverändert, RNG-Zustand gleich.
- **AK-STL-03** Produktion ruht: Fischer mit `progress 5`, stillgelegt bei Tick 1000; nach 100 Schritten `progress
=== 5`, Nahrung im Lager unverändert, `state === 'paused'`, `eff` gesunken (< Startwert). Weberei stillgelegt mit
  5 Wolle im Lager: nach 100 Schritten weiter 5 Wolle. Anfahren → der Fischer produziert ab dem nächsten Schritt.
- **AK-STL-04** Unterhalt: Welt aus Anhang 01 B Zeile 1 → `totalUpkeep 55`; Glashütte still → 43; mit Sparen und
  wirkender Amtsstube → 34; nach 100 × `tickEconomy` ab `upkeepCarry 0` sinkt `money` um genau 34. `buildingUpkeep`:
  Fischer 5 → 3, Werkzeugmacher 25 → 13, Glashütte Stufe 2 33 → 17, Stufe 3 43 → 22.
- **AK-STL-05** Bilanz und Kette: 2 Fischer, einer still → `goodsBalance(w).food.produced` = Rate eines Fischers;
  Schäferei still, Weberei läuft, Wolle im Lager 2 → nach Verbrauch `state === 'waitingInput'` an der Weberei,
  `goodsBalance(w).wool.produced === 0`.
- **AK-STL-06** Brand: stillgelegter Betrieb wird über `beginCrisis` gezielt angezündet → `state === 'burning'`,
  `paused === true`; nach dem Ausfall (`outageUntil` erreicht) `state === 'paused'`, nicht `'ok'`. Brandziel bei
  gleicher Lage gleich mit und ohne Flag (`fireTarget` liefert dieselbe Id).
- **AK-STL-07** Ausbau eines stillgelegten Fischers → ok, Stufe 2, `paused` bleibt; Abriss → Erstattung wie bei
  einem laufenden Fischer (`refundCost(paidCost(b))`).
- **AK-STL-08** Anbindung: stillgelegter Betrieb, Weg entfernt → nach `recomputeConnectivity` `state === 'paused'`;
  Anfahren ohne Anbindung → `state === 'notConnected'`.
- **AK-STL-09** UI-Helfer (`tests/ui/`): Zustandstext für `'paused'` «Stillgelegt — halber Unterhalt»;
  Unterhaltszeile einer stillgelegten Glashütte «Unterhalt 78 / min»; Knopf-Text «Stilllegen» / «Wieder anfahren»;
  `friendlyReason('Nur Betriebe lassen sich stilllegen')` wörtlich; `statusMarkOf('paused') === null`.
- **AK-STL-10** Browser (1280×720, 1920×1080): Fischer anklicken → Knopf «Stilllegen»; Klick → Zustand
  «Stillgelegt — halber Unterhalt», Unterhaltszeile halbiert, Unterhalt in der Kopfzeile sinkt; Nahrungs-Trend der
  Kopfzeile fällt um die Rate des Fischers; Klick «Wieder anfahren» → «In Betrieb». Wohnhaus und Kapelle zeigen keinen
  Knopf. Screenshot `.studio/qa/m13-e1/stl-10-<b>x<h>.png`.

## 9. Save v11 (gemeinsam)

- **R9.1** `SAVE_VERSION = 11`; neue Weltschlüssel `edict`, `edictLockedUntil` am Ende nach `wonSpice`; Gebäude
  optional `paused: true`; Zustand `'paused'`.
- **R9.2** `migrateV10ToV11`: `edict null`, `edictLockedUntil 0`, Gebäude unverändert, `version 11`; Kette v1 … v11
  bleibt ladbar (kein Spielstand-Bruch).
- **R9.3** Ladeprüfung C1–C7 (Anhang 02 C); Verstoss → `'Beschädigter Spielstand'`.
- **R9.4** Inkompatible Stände werden **mit Hinweis abgewiesen, nie ein Absturz**: `version` > 11 →
  `'Unbekannte Version'`, kein JSON → `'Ungültiges Format'`; das laufende Spiel bleibt unverändert, die UI zeigt den
  Grund (Verfassung §3, Test AK-E1-26 und Browser AK-E1-41).
- **R9.5** Hash-Pins über `foldBackToV10` (Anhang 02 D); Fixtures nach Anhang 02 E.

## 10. Abnahmekriterien Edikte

Neue Datei `tests/sim/edicts.test.ts`, sofern nicht anders genannt. Testwelt `createWorld(3, { unlockAll: true })` (Krisen aus, Standard),
`won = true`, Amtsstube roh eingesetzt, angebunden, ohne Ausfall; `money = 1000`, Tick 1000, sofern nicht anders
genannt. Erwartungswerte: Anhang 01.

### 10.1 Vitest Sim

- **AK-E1-01** `createWorld`: `edict === null`, `edictLockedUntil === 0`; `Object.keys(w).slice(-2)` =
  `['edict', 'edictLockedUntil']`; `version === 11`.
- **AK-E1-02** Def-Test nach §4 (alle Bedingungen), Werte `EDICT_COST 600`, `EDICT_LOCK 3000`, Tabelle §4.
- **AK-E1-03** Ablauf: `setEdict(w, 'saving')` → ok, `money 400`, `edict 'saving'`, Sperre 4000. Tick 3999
  `setEdict(w, 'trade')` → `'Edikt-Sperrzeit'`. Tick 4000 mit `money 400` → `'Zu wenig Geld'`; mit `money 600` → ok,
  `money 0`, Sperre 7000. Tick 7000 `setEdict(w, null)` → ok, `money 0`, `edict null`, Sperre 10 000.
- **AK-E1-04** Gründe und Reihenfolge: `'x'`, `3`, `{}` → `'Ungültiges Edikt'`; `won = false` → `'Erst nach dem
Bürger-Ziel'` (auch ohne Amtsstube); ohne Amtsstube → `'Braucht eine Amtsstube'`; Amtsstube brennt → `'Amtsstube
wirkt nicht'`; gleiches Edikt → `'Edikt bereits aktiv'` (auch in der Sperre); `null` ohne Edikt → `'Kein Edikt
aktiv'`; `money −50` und `'trade'` → `'Zu wenig Geld'`, `null` mit `money −50` bei erlassenem Edikt nach Ablauf der Sperre → ok.
- **AK-E1-05** Werfen nie: `setEdict` mit `id` ∈ {`null`, `undefined`, `''`, `'saving'`, `'trade'`, `'welfare'`,
  `'x'`, 0, `NaN`, `[]`} in Welten mit und ohne `won`, mit und ohne Amtsstube liefert immer ein `Result`; bei `ok:
false` ist `serialize(w)` unverändert; RNG-Zustand in allen Fällen gleich.
- **AK-E1-06** Steuer «gemischt» (Anhang 01 A.1): `taxUnits` keins 133 860, Sparen 125 796, Wohlfahrt 128 100,
  Handel 133 860; `effectiveTaxPct(w, 4)` bei Kaufleute «hoch» mit Sparen 108.
- **AK-E1-07** Steuer verbucht: Welt A.1, 100 × `tickTaxes` ab `taxCarry 0`, `money 0` → keins 669 / 6000, Sparen
  628 / 19 600, Wohlfahrt 640 / 10 000 (`money` / `taxCarry`). Welt A.2 → 1760 / 1636 / 1672.
- **AK-E1-08** Unterhalt (Anhang 01 B): Welt Zeile 1 → `totalUpkeep` keins 55, Sparen 44; Zeile 3 (mit Schiff) 70 /
  56; nach 100 × `tickEconomy` ab `upkeepCarry 0` mit Sparen `money` −44, `stats.upkeep 44`. Handel und Wohlfahrt
  → 55.
- **AK-E1-09** Kaufpreis mit Handel: `buyPrice(w, 'food', 1) 7`, `('food', 10) 64`, `('glass', 10) 400`, `('spice',
  1. 32`; ohne Edikt `('food', 10) 80`. `buy(w, 'food', 10)`mit Handel senkt`money` um 64. Handel erlassen,
     Amtsstube brennt → 80.
- **AK-E1-10** Arbitrage je Gut (Anhang 01 C): für alle `GOOD_IDS` und n ∈ {1, 10, 100} mit Handel `buyPrice(w, g, n)
  > n × ⌊buy × ORDER_PREMIUM⌋`(Güter mit Auftrag) und`> sellPrice(w′, g, n)`in einer Welt w′ mit Boom auf g und`sellPct[g] = 100`. Tabellenwerte n = 1 exakt.
- **AK-E1-11** Takt (Anhang 01 G): Pionierhaus 1 Einwohner, erfüllt, ab Tick 2000: keins → 4 Einwohner bei 2150,
  3 bei 2149; Wohlfahrt → 4 bei 2120, 3 bei 2119. Kaufleute-Haus 20, Nahrung 0 ab 2000: bei 2400 keins 12,
  Wohlfahrt 10. Erlass bei 2010 → erster Wachstumsschritt 2040. `growthInterval` mit brennender Amtsstube 50.
- **AK-E1-12** Stapelregel: Siedlerhaus voll, Dienste und Waren da, `satisfiedSince = tick − 100`; Grund nennt die
  Wartezeit aus Anhang 01 D für jede der acht Zeilen (z. B. normal + Wohlfahrt «Bedürfnisse noch nicht 200 Ticks
  erfüllt», niedrig + Fest + Wohlfahrt «… 150 …», mit Defizit 300; hoch + Wohlfahrt «Steuer zu hoch»).
- **AK-E1-13** Ruhe: Sparen erlassen, Amtsstube `outageUntil` gesetzt → `taxUnits`, `totalUpkeep`, `buyPrice`,
  `growthInterval`, Wartezeit gleich wie ohne Edikt; `edict` und Sperre unverändert; nach Ende des Ausfalls wieder
  Sparen-Werte. Gleiches bei nicht angebundener Amtsstube.
- **AK-E1-14** Abriss: Sparen erlassen bei Tick 1000 (Sperre 4000), `demolish` der Amtsstube bei 2000 → `edict
null`, Sperre 4000, Geld = vorher + Gebäude-Erstattung (keine 600). Neue Amtsstube bei 2500, `setEdict(w,
'trade')` → `'Edikt-Sperrzeit'`; bei 4000 → ok.
- **AK-E1-15** Freischaltung: `won = false` → abgelehnt; nach `won = true` ok. Ein v10-Stand mit `won true` (Anhang
  02 E) lädt und erlaubt `setEdict` sofort.
- **AK-E1-16** Pfadzeiten (B1 analytisch, Anhang 01 E): ein Haus ab t0 = 2000 unter den Bedingungen dort; Tick, an
  dem es Stufe 4 mit 20 Einwohnern ist: keins 3200, keins + P/S «niedrig» 2950, Wohlfahrt 2880, Wohlfahrt + P/S
  «niedrig» 2800; Zwischenstufen nach der Tabelle. Vor jedem Aufstieg `upgradeDeficit(w, b) === null` (Vorbedingung
  im Test geprüft).
- **AK-E1-17** Seed-Lauf «reich» (B1, Anhang 03 C): Wohlfahrt erreicht `wonMerchants` echt früher als K′; K′ ≤ 8000.
- **AK-E1-18** Seed-Lauf «Welle» (B1 Kern, Anhang 03 D): alle vier Abnahmen dort erfüllt (W je Haus ≥ 250 Ticks
  früher voll, `money(W) − money(K) > 0`, `money(W) > money(S)`, kein Schrumpfen).
- **AK-E1-19** Seed-Lauf «arm» (Anhang 03 B): Sparen und Handel je K′ − 600 ≤ Tick ≤ K′ − 100; Wohlfahrt `null` oder
  später als K′.
- **AK-E1-20** Endzustand (B2, Anhang 01 F): 600 Schritte (`tickTaxes` + `tickEconomy`) ab Überträgen 0 → Bilanz
  keins 5640, Sparen 5884 (+244), Wohlfahrt 5112 (−528), Handel 5640; `buyPrice(w, 'stone', 48)` mit Handel 576 gegen 720. Testname nennt «bewusst klein».

### 10.2 Vitest Baseline und Save

- **AK-E1-21** Baseline (B3, Anhang 03 E): `balance.test.ts` grün und `git diff main -- tests/sim/balance.test.ts`
  leer; `balance-merchants.test.ts` Pins 6750 / 11 500 unverändert grün; `e0Pins.ts`, `e1Pins.ts` ohne Diff.
- **AK-E1-22** Hash-Pins: alle Tests über `CHAIN_HASHES`, `V6_FORMS` oder feste JSON-Formen laufen mit
  `foldBackToV8(foldBackToV9(foldBackToV10(…)))` grün, ohne Pin-Wert zu ändern. Helfer-Test: v11 ohne Edikt →
  Schlüssel ohne `edict`, `edictLockedUntil`, `version 10`, `JSON.stringify` gleich einem v10-Stand; mit `edict
'trade'`, mit Sperre 1, mit Gebäude `paused` → wirft.
- **AK-E1-23** Rundlauf v11 (Anhang 02 F) → `deserialize(serialize(w))` ok und tief gleich.
- **AK-E1-24** Migration v10 → v11 und Kette v1 … v10 (Anhang 02 F) → ok, `version 11`, `edict null`, Sperre 0.
- **AK-E1-25** Ladeprüfung: Fälle 25a–25h aus Anhang 02 F mit genau dem dort genannten Ergebnis, ohne Ausnahme.
- **AK-E1-26** Inkompatibel: `version 12` → `'Unbekannte Version'`; abgeschnittener Text → `'Ungültiges Format'`;
  `friendlyReason` liefert für beide einen nicht leeren Hinweistext (`tests/ui/hints.test.ts`).

### 10.3 Vitest UI (reine Helfer, `tests/ui/`)

- **AK-E1-27** `edictEffectText`: die drei Texte aus 7.1 wörtlich; `edictWhenText` je Edikt nicht leer.
- **AK-E1-28** `edictCardState`: `won false` → alle `disabled`, `reason 'Erst nach dem Bürger-Ziel'`; Sparen aktiv →
  Sparen `active`, `buttonText 'Aufheben'`; in der Sperre andere Karten `disabled`, `reason 'Edikt-Sperrzeit'`;
  `money 100` → `disabled false`, `reason 'Zu wenig Geld'`; ohne Sperre und mit Geld → `reason null`,
  `buttonText 'Erlassen (600)'`.
- **AK-E1-29** `edictLockText`: Rest 3000 → «wieder änderbar in 5:00»; 450 → «wieder änderbar in 45 s»; 0 → `''`.
  `friendlyReason('Edikt-Sperrzeit')` bei Rest 450 → «Edikt erst in 45 s wieder änderbar».
- **AK-E1-30** `edictStatusLine`: «Kein Edikt»; «Edikt: Handel»; Amtsstube brennt → «Edikt Handel ruht: Amtsstube
  wirkt nicht».
- **AK-E1-31** Handel-Anzeige: Stückpreis Nahrung 7 statt 8; Knopftext «10 Nahrung kaufen für 64 Geld» [Tech: an den
  heutigen Wortlaut angepasst]; ohne Edikt unverändert gegen heute.
- **AK-E1-32** `taxButtonTitle` mit Sparen → endet auf « · Edikt: Sparen»; ohne Edikt gleich wie heute;
  `tierTaxPerMinute` Kaufleute 4 × 20 erfüllt «normal» mit Sparen → 9820 (statt 10 560).
- **AK-E1-33** Haus-Text «Aufstieg in höchstens 4 s» mit Wohlfahrt, «… 5 s» ohne.

### 10.4 Browser (qa-playtester, Headless-Chrome)

Screenshots unter `.studio/qa/m13-e1/`, Dateiname `<ak>-<breite>x<höhe>.png`, 1280×720 und 1920×1080. Testwelt:
Spielstand mit Ziel 1 erreicht, aktive Amtsstube, Geld ≥ 2000 (Playtest-Stand nach Vorschlag §12).

- **AK-E1-34** Amtsstuben-Panel: Abschnitt «Edikt» mit drei Karten untereinander (Sparen, Handel, Wohlfahrt), je
  Name, Wirkung, «lohnt, wenn …», Knopf «Erlassen (600)»; kein waagrechtes Scrollen (`scrollWidth ≤ clientWidth`).
- **AK-E1-35** Stand vor Ziel 1: Karten blass, Zeile «Erst nach dem Bürger-Ziel», Klick ohne Wirkung.
- **AK-E1-36** Klick «Erlassen (600)» bei Sparen: Geld −600, Karte hervorgehoben mit «Aufheben», Zeile «wieder
  änderbar in 5:00» zählt herunter, Klick auf Handel → Meldung «Edikt erst in … wieder änderbar»; Unterhalt der
  Kopfzeile sinkt.
- **AK-E1-37** Nach Ablauf (Zeitraffer) «Aufheben»: Meldung «Edikt aufgehoben — wieder änderbar in 5:00», Status «Kein
  Edikt», Geld unverändert.
- **AK-E1-38** Handel erlassen: Kontor-Panel zeigt Stückpreise −20 % (Nahrung 7, Glas 40), Kauf von 10 Nahrung kostet 64.
- **AK-E1-39** Amtsstube abreissen und neu bauen: Status «Kein Edikt», Sperrzeile mit Restzeit sichtbar.
- **AK-E1-40** Fenster 800×600: Panel ohne Überlappung, keine Konsolenfehler («stürzt nicht ab»).
- **AK-E1-41** Laden eines Slots mit `version 12`: Hinweis «Unbekannte Version» (Wortlaut über `friendlyReason`),
  das laufende Spiel läuft weiter, keine Konsolenfehler.

## 11. Doku-Folgen

- **README:** Abschnitt «Edikte» unter Amtsstube (Tabelle der drei Edikte mit Wirkung und Preis, 600 Geld, 5 min
  Sperre, Aufheben kostenlos, ruht ohne wirkende Amtsstube, Stapelregel in einem Satz «nie unter 15 s») und ein Satz
  zu B2: «Im späten Spiel sind Edikte eine Feinsteuerung von wenigen Prozent; spürbar werden sie beim Zukauf und bei
  vielen neuen Häusern.» Abschnitt Betriebe: «Stilllegen» (halber Unterhalt, keine Erzeugung, Kette läuft leer).
  Kontor: Preise mit Handel.
- **`docs/arc42.md`:** Bausteine (`edicts.ts`, `defs/edicts.ts`), Tick-Ablauf (Wachstumstakt aus `growthInterval`),
  Persistenz (Version 11, `migrateV10ToV11`, Prüfung C1–C7, Kette v1 … v11).
- **ADR:** keine nötig (keine Abhängigkeit, Save-Versionierung nach bestehendem Muster).

## 12. Offene Punkte (mit Empfehlung)

- **P-1 Rückfall Wohlfahrt (O3):** entschieden, ausgelöst nur durch AK-E1-18. Empfehlung: Fällt der Seed-Lauf
  durch, zuerst prüfen, ob `topUp` oder Plätze die Welle verzerren (Anhang 03 D), dann Ruling L0 «zwei Edikte».
- **P-2 Messwerte ohne Amtsstube** (Befund §6): Die Grenzen in Anhang 03 sind relativ zu K′ gefasst. Empfehlung:
  `lead-design` trägt im Vorschlag-Anhang D.1 einen Hinweis nach; kein Einfluss auf Regeln.
- **P-3 Kartenanordnung:** untereinander statt nebeneinander (Setzung U-2). Empfehlung: so lassen; erst bei einer
  breiteren Panel-Spalte neu prüfen.
- **P-4 Statusmarke «stillgelegt»:** bewusst keine (Scope). Empfehlung: nach Playtest entscheiden, ob Spieler
  stillgelegte Betriebe auf der Karte suchen; dann eigenes S-Paket in `src/render/statusMarks.ts`.
- **P-5 Feinwerte nach Playtest:** Edikt-Werte, Preis und Sperre stehen in `defs/edicts.ts` und `timing.ts`;
  Wechselgebühr 1500 nur, falls der Playtest Umschalt-Takt zeigt (O9). Jede Änderung braucht ein Ruling und lässt
  den Balancing-Test grün.

**Playtest-Frage (ab Spielstand Ziel 1):** Erlässt der Spieler ohne Erklärung ein Edikt und kann er sagen, warum
dieses? Legt er bei «Lager voll» einen Betrieb still?

## 13. Zuordnung der Entscheide R452

O1–O11 und B1–B3 sind je einem Abschnitt oder einer AK zugeordnet:
[Anhang 04](2026-10-10-m13-e1-edikte-design/anhang-04-zuordnung-r452.md). Nicht hier: O7, O8, O11 und der
Denkmal-Teil von B3 (Spec E2).

## 14. Grössenschätzung

Gesamt **M + S** (Vorschlag §9): M13-E1-SIM (Edikte, Save v11, `foldBackToV10`, Seed-Läufe, Stilllegen als eigener
Task im selben Save-Sprung) und M13-E1-UI (Edikt-Abschnitt, Kontor-Preise, Tooltips, Stilllegen-Knopf, README,
arc42). Risiko mittel: Save und Hash-Pins (`foldBackToV10`), Seed-Lauf «Welle» (B1, Rückfall vorbereitet).
