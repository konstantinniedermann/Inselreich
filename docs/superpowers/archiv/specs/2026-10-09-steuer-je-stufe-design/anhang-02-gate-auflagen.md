# Anhang 02 · Gate-Auflagen R414 (Steuer je Stufe, I-028)

Zur [Spec](../2026-10-09-steuer-je-stufe-design.md) (Spec-Commit `829aadc`). Bezug: Ruling **R414** (Gate Spec OK mit
Auflagen), Gate-Berichte lead-qa (Auflagen a–i) und lead-tech (B1, B2, Hinweise R7.4 und §6), Entscheide P-1 und P-2.

**Regel:** Anhang 02 ergänzt die Spec und geht ihr bei Widerspruch vor. Ein Eintrag «AK-Tnn ergänzt» heisst: Der
bisherige Wortlaut des AK gilt weiter, der hier genannte Wortlaut kommt hinzu. «Ersetzt» heisst: Der hier genannte
Wortlaut gilt anstelle des bisherigen. Neue AK sind ab AK-T42 nummeriert; die Spec hat damit **42 AK**.

Testwelten wie Spec §8.1 (`createWorld(3, { unlockAll: true })`, aktive Amtsstube, Häuser roh eingesetzt), sofern
nicht anders genannt.

## Auflagen lead-qa

### QA-a · AK-T14 ergänzt (Fest, R7.3)

Herkunft: lead-qa (a).

> **AK-T14 (Zusatz)** Kapelle mit genau einem Wohnhaus im Radius, einem Kaufleute-Haus; Regler
> `{1:'high',2:'high',3:'high',4:'normal'}`; Rum ausreichend → `holdFeast` liefert `ok: true`, Rum sinkt um die
> Festkosten wie bei jedem Fest, `feastAt` wird gesetzt. Das Kaufleute-Haus «normal» zählt als «wirkt» (R7.3 letzter
> Punkt), obwohl die Stufen 1–3 «hoch» stehen.

### QA-b · AK-T20 ersetzt (Unbekannte Version, R8.4)

Herkunft: lead-qa (b).

> **AK-T20** Ein gültiger Spielstand mit `version: SAVE_VERSION + 1` (bei v10 also 11) → `{ ok: false, reason:
'Unbekannte Version' }`, kein Wurf. Der Test liest die Zahl aus `SAVE_VERSION`, nicht als Literal.

### QA-c · AK-T29 ergänzt (`taxEffect`, U-1)

Herkunft: lead-qa (c).

> **AK-T29 (Zusatz)** `taxEffect('low')` → «niedrig: 70 % Steuer (Kaufleute normal) · Aufstieg nach 15 s
> Zufriedenheit · Häuser voll belegt» (Anhang 01 C).

### QA-d · AK-T36 und AK-T33 ergänzt («Steuer gemischt», U-4 und U-8)

Herkunft: lead-qa (d).

> **AK-T36 (Zusatz, U-4)** Nach den Klicks Pioniere «niedrig» und Siedler «hoch» zeigt die Panel-Zeile `tax-effect`
> «Steuer gemischt: P niedrig · S hoch · B normal · K normal»; die Zeile `tax-lock` gibt es nicht mehr
> (`querySelector('[data-field="tax-lock"]') === null`).

> **AK-T33 (Zusatz, U-8)** Ruhe-Ansicht `restView(world).tax` (`src/ui/inspect.ts`, Vitest in `tests/ui/inspect.test.ts`):
>
> - aktive Amtsstube, Regler `{1:'low',2:'normal',3:'normal',4:'high'}` → «Steuer gemischt: P niedrig · S normal ·
>   B normal · K hoch»;
> - aktive Amtsstube, alle «hoch» → `taxEffect('high')` («hoch: 130 % Steuer (Kaufleute 115 %) · kein Aufstieg ·
>   Häuser nur zu 75 % belegt»);
> - ohne aktive Amtsstube, Regler gemischt wie oben → «normal: 100 % Steuer · Aufstieg nach 30 s Zufriedenheit ·
>   Häuser voll belegt (keine Amtsstube)» (wirksamer Wert wie U-5, nicht der gespeicherte).

### QA-e · AK-T30 ergänzt (Gruppensteuer ohne Amtsstube, U-5)

Herkunft: lead-qa (e).

> **AK-T30 (Zusatz)** Welt aus AK-T02, Amtsstube mit `outageUntil > tick` (wirkt nicht) → `tierTaxPerMinute`
> liefert den wirksamen Wert «normal» (`Sₜ × 100 × 3 / 100`): Pioniere 48, Siedler 504, Bürger 924, Kaufleute 1980. `taxLevels` bleibt `{1:'low',2:'normal',3:'high',4:'high'}`; die Hervorhebung im Raster folgt weiter dem
> gespeicherten Regler (U-2).

### QA-f · AK-T36 ergänzt (Knoten und Fokus bleiben, U-6)

Herkunft: lead-qa (f).

> **AK-T36 (Zusatz, U-6, Browser-Schritt)** Vor dem Klick Pioniere «niedrig» wird der Knopf per Konsole gemerkt
> (`window.__probe = <Knopf>`; `__probe.dataset.probe = '1'`). Klick, danach mindestens 20 Ticks laufen lassen
> (2 s Spielzeit, Countdown hat sich geändert). Erwartet: `document.contains(window.__probe) === true`,
> `window.__probe.dataset.probe === '1'`, `document.activeElement === window.__probe`; das Raster hat weiterhin genau
> 15 Steuer-Knöpfe (3 in «alle Stufen» + 4 × 3).

### QA-g · AK-T19 ergänzt (`taxLockedUntil` Schlüssel, R8.3)

Herkunft: lead-qa (g).

> **AK-T19 (Zusatz)** Je Fall `{ ok: false, reason: 'Beschädigter Spielstand' }` ohne Ausnahme:
> `taxLockedUntil` ohne Schlüssel `"3"` (`{"1":0,"2":0,"4":0}`); `taxLockedUntil` mit Zusatzschlüssel `"5"`
> (`{"1":0,"2":0,"3":0,"4":0,"5":0}`).

### QA-h · AK-T17 ergänzt (Weiterlauf nach Laden, R8.1)

Herkunft: lead-qa (h).

> **AK-T17 (Zusatz)** Welt `w` bei `tick = 1000` mit je einem versorgten Haus der Stufen 1–4, Regler und Sperren wie
> AK-T17 (`{1:'low',2:'normal',3:'high',4:'high'}`, `{1:1300,2:0,3:900,4:0}`). `w2 = deserialize(serialize(w)).world`.
> Beide Welten laufen 600 × `step`; bei Tick 1300 wird in beiden `setTierTaxLevel(·, 1, 'normal')` aufgerufen (beide
> `ok: true`). Danach `serialize(w2) === serialize(w)` (Textvergleich) und `w2.tick === 1600`.

### QA-i · AK-T13 ergänzt (Sperre ohne Amtsstube, neue Amtsstube, R5.3 und §5)

Herkunft: lead-qa (i).

> **AK-T13 (Zusatz)** Bei Tick 1000 `setTierTaxLevel(w, 2, 'high')` → ok, `taxLockedUntil[2] === 1300`. Danach
> `demolish(w, <Amtsstube>)` → ok. Bei Tick 1100 `setTierTaxLevel(w, 2, 'normal')` → `'Braucht eine Amtsstube'`;
> `effectiveTaxLevel(w, 2) === 'normal'`, `taxLevels[2] === 'high'`. Bis Tick 1350 `step` ohne Amtsstube, dann neue
> Amtsstube bauen und anbinden (`placeBuilding`, `placeRoad` wie in `tests/sim/townhall.test.ts`). Erwartet:
> `taxLockedUntil[2] === 1300` (unverändert, Sperre abgelaufen), `effectiveTaxLevel(w, 2) === 'high'` (neue Amtsstube
> übernimmt alle vier Regler), `setTierTaxLevel(w, 2, 'normal')` → ok ohne Wartezeit.

## Auflagen lead-tech

### TECH-B1 · AK-T23 ergänzt (v9-Byte-Vergleiche)

Herkunft: lead-tech B1.

Schreibweise in diesem Abschnitt und in TECH-B2: `v9Text(w)` steht für
`JSON.stringify(foldBackToV9(JSON.parse(serialize(w))))`.

> **AK-T23 (Zusatz)** Die beiden v9-Fixture-Vergleiche vergleichen nach der Rückfaltung:
>
> - `tests/sim/save.test.ts`, «M12 Fixture see-route-start-v9 (AK-E4-13)», Fall «gleicht dem Rezept
>   seeRouteStart()»: `expect(json).toBe(v9Text(seeRouteStart()))`;
> - `tests/sim/goal3.test.ts`, «AK-Z3-02»: `expect(json).toBe(v9Text(spiceGoalScenario({ forBrowser: true })))`.
>
> `deserialize(json).ok === true` bleibt in beiden Fällen (Kette v9 → v10). Die Fixtures
> `tests/sim/fixtures/see-route-start-v9.json` und `tests/sim/fixtures/z3-scenario-v9.json` sind unverändert
> (`git diff main -- tests/sim/fixtures/` zeigt keine geänderte und keine gelöschte Datei). Die Versions-Assertions,
> die heute 9 erwarten, erwarten 10: `tests/sim/save.test.ts` («uses version 5»: `SAVE_VERSION`; AK-S1-01:
> `fresh.version`), `tests/sim/unlocks.test.ts` (AK-S1-02: `w.version`), `tests/sim/scenario-saves.test.ts`
> (`r.world.version`).

### TECH-B2 · AK-T24 ergänzt (Schlüsselreihenfolge, migrierter Stand)

Herkunft: lead-tech B2.

**Regel zu Spec §6:** `foldBackToV9` baut das Ergebnis neu auf und schreibt die Schlüssel in der Reihenfolge von
`V9_WORLD_KEYS` (`tests/sim/helpers.ts`; Verfahren wie `foldBackToV6`: nur vorhandene Schlüssel, in Listenfolge).
Erlaubte Eingabeschlüssel sind `V9_WORLD_KEYS` mit `taxLevels` statt `taxLevel`; jeder andere Schlüssel, auch ein
noch vorhandenes `taxLevel`, wirft. Damit ist die Lage der Schlüssel nach `migrateV9ToV10` (z. B. `taxLevels` am
Objektende) für alle Text- und Hash-Vergleiche ohne Belang.

> **AK-T24 (Zusatz)**
>
> - Frischer Stand: `Object.keys(foldBackToV9(JSON.parse(serialize(createWorld(3)))))` ist gleich
>   `Object.keys(JSON.parse(<Text von see-route-start-v9.json>))`.
> - Migrierter Stand v8: `save-v8.json` laden →
>   `JSON.stringify(foldBackToV8(foldBackToV9(JSON.parse(serialize(r.world)))))` ist gleich dem Fixture-Text
>   (ersetzt den heutigen Vergleich «T00 save-v8.json lädt (v8)»).
> - Migrierter Stand v9: `see-route-start-v9.json` laden → `v9Text(r.world)` ist gleich dem Fixture-Text.
> - Eingabe mit Zusatzschlüssel `foo` oder mit `taxLevel` → `foldBackToV9` wirft.

### TECH-H-R7.4 · R7.4 und AK-T15 ergänzt (Vorstufe erst ab t ≥ 2)

Herkunft: lead-tech, Hinweis R7.4.

**R7.4 ergänzt:** Die Vorstufe wird nur für t ≥ 2 geprüft. Ein Auslöser `tierWish`/`tierReached` mit Stufe 1 liefert
`taxBlocks = false`; `effectiveTaxLevel` wird nie mit Stufe 0 aufgerufen. Die Prüfung liegt in einer exportierten,
reinen Funktion `triggerTaxBlocked(world: World, trigger: UnlockTrigger): boolean` in `src/sim/unlocks.ts`, die
`nextUnlocks` nutzt. [Tech: Name und Typname dürfen im Plan angepasst werden, die Funktion muss exportiert sein.]

> **AK-T15 (Zusatz)** Alle vier Regler «hoch», aktive Amtsstube: `triggerTaxBlocked(w, { kind: 'tierWish', tier: 1
})` und `triggerTaxBlocked(w, { kind: 'tierReached', tier: 1 })` liefern `false` und werfen nicht;
> `triggerTaxBlocked(w, { kind: 'tierWish', tier: 2 })` liefert `true`.

### TECH-H-§6 · Spec §6 und AK-T21 ergänzt (Fixtures ohne Kaufleute)

Herkunft: lead-tech, Hinweis §6.

**§6 «Bewusste Wertänderung» präzisiert:** `save-v2.json` (`low`) enthält nur Pioniere-Häuser, `save-v4.json`
(`high`) nur Siedler- und Bürger-Häuser; keines hat ein Kaufleute-Haus. Beim Laden ändern sich dort nur Feldnamen
und -formen (`taxLevel` → `taxLevels`, Zahl → Objekt), keine Geld- oder Steuerwerte. Bestandstests auf diesen
Fixtures behalten ihre Geld- und Steuer-Erwartungen; die Wertänderung R412 betrifft nur Läufe mit Kaufleute-Häusern.

> **AK-T21 (Zusatz)** Nach dem Laden von `save-v2.json` und `save-v4.json` gibt es je 0 Häuser mit `tier === 4`, und
> `taxUnits(world)` ist gleich `taxPct(L, 1) × Σₜ Sₜ` mit L = `low` (v2) bzw. `high` (v4), falls `townhallActive`,
> sonst `100 × Σₜ Sₜ` (gleiche Formel wie AK-T03).

## Entscheide

### P-1 · R8.1, R8.5 und AK-T18 ergänzt (Save v10 fest)

Herkunft: R414 P-1 (Empfehlung lead-tech).

**Entscheidung:** Save **v10 ist fest** für I-028; E6 ist geparkt, es gibt keine Branch und keinen Worktree. R8.5
bleibt nur als Notfallregel: Sie greift ausschliesslich, wenn vor dem Merge von I-028 ein anderes Paket v10 auf
`main` bringt, und braucht dann ein eigenes L0-Ruling.

> **AK-T18 (Zusatz)** `SAVE_VERSION === 10`; `createWorld(3).version === 10`; jeder geladene Stand v1–v9 hat nach
> `deserialize` `version === 10`.

### P-2 · AK-T31 und AK-T32 ergänzt, AK-T42 neu (Grund mit Stufe)

Herkunft: R414 P-2 (Empfehlung lead-tech).

**Entscheidung:**

1. Die Sim-Gründe bleiben wörtlich: `'Sperrzeit'` (R6.1, R6.2) und `'Steuer zu hoch'` (R7.1). Die Muster
   `/^Sperrzeit$/` und `/^Steuer zu hoch$/` in `REASON_TABLE` bleiben.
2. `ReasonCtx` in `src/ui/hints.ts` bekommt das Feld `tier?: Tier` (Typ aus `src/sim/types.ts`). Das Panel übergibt
   die Stufe des geklickten Knopfs, das Mouse-over eines Hauses `b.house.tier`.
3. Die Menge C aus R6.2 wird eine reine Sim-Funktion in `src/sim/tax.ts`:

   ```ts
   /** Zielwert ziel(t) aus R6.2: 'low' für nicht aufstiegsfähige Stufen wird 'normal'. */
   export function taxTarget(level: TaxLevel, tier: Tier): TaxLevel;
   /** Menge C aus R6.2: Stufen t mit taxLevels[t] ≠ taxTarget(level, t), aufsteigend 1 → 4, neues Array. */
   export function taxChangeSet(world: World, level: TaxLevel): Tier[];
   ```

   Beide lesen nur, schreiben nichts, ziehen keinen Zufall und werfen nicht. `taxChangeSet` liest den gespeicherten
   Stand `taxLevels` (unabhängig von `townhallActive`). `setTaxLevel` bestimmt C und die Zielwerte nur über diese
   beiden Funktionen. Die UI nutzt sie für `taxSummary` (`taxSummary(w) === L` genau dann, wenn
   `taxChangeSet(w, L).length === 0`; höchstens ein L erfüllt das, sonst `'mixed'`) und für
   den Sperrhinweis von «alle Stufen». Kein zweiter Code für ziel(t) in `src/ui/` (Review-Punkt).

> **AK-T31 (Zusatz, `tests/ui/hints.test.ts`)** Welt bei Tick 1000, `taxLockedUntil = {1:0,2:1200,3:1150,4:0}`:
> `friendlyReason(w, 'Sperrzeit', { tier: 2 })` → «Steuer für Siedler erst in 20 s wieder änderbar»;
> `friendlyReason(w, 'Sperrzeit')` ohne `tier` → Text für die kleinste gesperrte Stufe: «Steuer für Siedler erst in
> 20 s wieder änderbar»; ohne gesperrte Stufe (alle Sperren ≤ 1000) und ohne `tier` → `'Sperrzeit'` unverändert.
> Für «alle Stufen» übergibt die UI als `tier` das kleinste t aus `taxChangeSet(w, level)`, für das
> `w.tick < w.taxLockedUntil[t]` gilt.

> **AK-T32 (Zusatz, `tests/ui/hints.test.ts`)** `friendlyReason(w, 'Steuer zu hoch', { tier: 3 })` → «Steuer ‚hoch'
> für Bürger verhindert den Aufstieg»; ohne `tier` → «Steuer ‚hoch' verhindert den Aufstieg» (Text wie heute).
> `upgradeStatus` eines Bürger-Hauses unter «hoch» enthält weiterhin genau den Grund `'Steuer zu hoch'`.

> **AK-T42 (neu, `tests/sim/taxTiers.test.ts`)** `taxTarget`/`taxChangeSet`:
>
> - `taxTarget('low', 1) === 'low'`, `taxTarget('low', 4) === 'normal'`, `taxTarget('high', 4) === 'high'`,
>   `taxTarget('normal', 3) === 'normal'`.
> - Alle «normal»: `taxChangeSet(w, 'normal')` → `[]`; `'low'` → `[1, 2, 3]`; `'high'` → `[1, 2, 3, 4]`.
> - `{1:'low',2:'low',3:'low',4:'normal'}`: `'low'` → `[]`; `'normal'` → `[1, 2, 3]`.
> - `{1:'low',2:'normal',3:'normal',4:'high'}`: `'normal'` → `[1, 4]`; `'high'` → `[1, 2, 3]`.
> - Ohne aktive Amtsstube (`outageUntil > tick`) dieselben Ergebnisse.
> - `serialize(w)` und RNG-Zustand vor und nach jedem Aufruf gleich; zwei Aufrufe liefern verschiedene Arrays.
> - Gleichlauf mit der Aktion: Für jeden der drei Stände oben, jedes L ∈ {low, normal, high} und keine Sperre gilt:
>   `setTaxLevel(w, L)` ist `ok` genau dann, wenn `taxChangeSet(w, L)` (vor dem Aufruf) nicht leer ist, und ändert
>   genau die Stufen dieser Menge (`taxLevels[t] === taxTarget(L, t)`, `taxLockedUntil[t] === tick + 300`); alle
>   anderen Stufen behalten Wert und Sperre.
> - `tests/ui/`: Für die Stände aus AK-T26 gilt `taxSummary(w) === L` genau dann, wenn `taxChangeSet(w, L)` leer
>   ist.

## Zuordnung Auflage → AK bzw. Regel

| Auflage     | Herkunft       | AK / Regel                      | Art                         |
| ----------- | -------------- | ------------------------------- | --------------------------- |
| QA-a        | lead-qa (a)    | AK-T14                          | ergänzt                     |
| QA-b        | lead-qa (b)    | AK-T20                          | ersetzt                     |
| QA-c        | lead-qa (c)    | AK-T29                          | ergänzt                     |
| QA-d        | lead-qa (d)    | AK-T36 (U-4), AK-T33 (U-8)      | ergänzt                     |
| QA-e        | lead-qa (e)    | AK-T30 (U-5)                    | ergänzt                     |
| QA-f        | lead-qa (f)    | AK-T36 (U-6)                    | ergänzt (Browser)           |
| QA-g        | lead-qa (g)    | AK-T19                          | ergänzt                     |
| QA-h        | lead-qa (h)    | AK-T17                          | ergänzt                     |
| QA-i        | lead-qa (i)    | AK-T13                          | ergänzt                     |
| TECH-B1     | lead-tech B1   | AK-T23                          | ergänzt                     |
| TECH-B2     | lead-tech B2   | §6 `foldBackToV9`, AK-T24       | Regel präzisiert, ergänzt   |
| TECH-H-R7.4 | lead-tech R7.4 | R7.4, AK-T15                    | Regel ergänzt, AK ergänzt   |
| TECH-H-§6   | lead-tech §6   | §6, AK-T21                      | Text präzisiert, AK ergänzt |
| P-1         | R414 P-1       | R8.1, R8.5, AK-T18              | entschieden, AK ergänzt     |
| P-2         | R414 P-2       | R6.2, U-9, U-11, AK-T31, AK-T32 | entschieden, AK ergänzt     |
| P-2         | R414 P-2       | `taxTarget`, `taxChangeSet`     | **AK-T42 neu**              |
