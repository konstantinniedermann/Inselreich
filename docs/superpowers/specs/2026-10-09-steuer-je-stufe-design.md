# Steuer je Stufe (I-028) — Design-Spec

Datum: 2026-10-09 · Paket I-028 · Meilenstein: ohne · Status: **Entwurf, Abnahme lead-design, danach Gate Spec
(lead-tech, lead-qa)** · Prozessstufe voll

Grundlage: [Designvorschlag](2026-10-09-steuer-je-stufe-vorschlag.md) (verbindlich für Regeln und Zahlen, Bilanz §4,
Dominanz §5, Umschalt-Ausbeute §5 D, Herleitung Anhang A), Ruling **R412** (Gate Brainstorming OK, O1–O5 nach
Empfehlung, Wertänderung Kaufleute «hoch» 115 % freigegeben), [Hauptspec](2026-09-29-inselreich-design.md).
Code-Stand der Prüfung: `main` 89ece7c.

Anhang: [01 Rechenbeispiele und Erwartungswerte](2026-10-09-steuer-je-stufe-design/anhang-01-rechenbeispiele.md).

Kennzeichnung: **Setzung Spec** (in dieser Spec ergänzt, im Vorschlag nicht festgelegt), **[Tech]**
(Umsetzungsdetail; lead-tech entscheidet im Plan, die Spec legt nur das prüfbare Verhalten fest).

## 1. Ziel

**Spielerzweck:** «Der Spieler stellt in der Amtsstube die Steuer für Pioniere, Siedler, Bürger und Kaufleute
getrennt ein und entscheidet je Gruppe, ob sie schnell aufsteigt (niedrig), voll wächst (normal) oder wenige Köpfe
teuer zahlen (hoch).»

Heute gilt ein Regler `world.taxLevel` für die ganze Insel. Getrennte Regler schaffen eine echte Entscheidung
(Aufstiegstempo gegen Einnahmen je Gruppe). Damit «hoch» bei Kaufleuten nicht zum Pflichtregler wird (Entartung,
Vorschlag §2), sinkt ihr Satz «hoch» auf 115 %, und «niedrig» ist für Kaufleute gesperrt. Spürbar ab der ersten
Amtsstube.

## 2. Umfang und ausdrücklich nicht

**Im Umfang:**

- Sim: Zustand `taxLevels` und `taxLockedUntil` je Stufe; Steuer, Aufstiegs-Wartezeit, Belegung, Fest und
  Freischalt-Hinweis `taxBlocks` je Stufe; Aktionen `setTierTaxLevel` (neu) und `setTaxLevel` («alle Stufen»);
  Def-Wert `TAX_LEVELS.high.pctByTier`.
- Save v10 mit Migration v9 → v10, Ladeprüfung, Rückfaltung `foldBackToV9` für die Hash-Pins.
- UI: Amtsstube-Raster 4 × 3 mit Zeile «alle Stufen», Kopfzeilen-Knopf «gemischt», Tooltips, Sperrhinweis,
  Hinweise, Leitfaden, Mouse-over; reine Helfer mit Vitest.
- Anpassung der Bestandstests, die Kaufleute unter «hoch» oder «niedrig» rechnen (R412); README, arc42.

**Ausdrücklich nicht** (Vorschlag §8):

- Steuer je Insel (die Regler gelten für alle Inseln, auch die M12-Inseln);
- frei einstellbare Prozente, neue Steuerstufen;
- Abwanderung oder Abstieg von Häusern;
- Änderungen an Aufstiegs-Halt (`upgradeStops`) und Ausgabesperre (`goodLocks`);
- Controller-Strategie mit gemischten Steuern (`tests/sim/controller.ts`, `merchantsController.ts` bleiben unberührt);
- sichtbare Animation beim Umschalten; Einträge in der Ereignis-Chronik (Abschnitt 7.6);
- **keine Wertänderung für Stufen 1–3** (130 % / 70 % / Belegung 0,75 / Wartezeiten bleiben);
- Mobil-Optimierung (Desktop-first ab 1280 px; schmale Fenster nur «stürzt nicht ab»).

## 3. Regeln

Begriffe: **Stufe** = Bevölkerungsstufe `Tier` 1–4 (Pioniere, Siedler, Bürger, Kaufleute). **Steuerstufe** =
`TaxLevel` (`low` «niedrig», `normal`, `high` «hoch»). **Regler** = die Steuerstufe einer Stufe.
**Aufstiegsfähig** = `TIERS[t].upgradeCost !== null` (heute Stufen 1–3; die Regeln lesen das aus den Defs, nie
eine feste 4).

### R1 Vier Regler

- **R1.1** Der Weltzustand trägt `taxLevels: Record<Tier, TaxLevel>` (ersetzt `taxLevel`). Start: alle vier
  `DEFAULT_TAX_LEVEL` (`normal`).
- **R1.2** Wirksam ist `effectiveTaxLevel(world, tier)`: mit aktiver Amtsstube (`townhallActive`) der gespeicherte
  Regler `taxLevels[tier]`, sonst `normal` für jede Stufe (wie heute). [Tech: Signatur; alle bisherigen Aufrufer
  bekommen die Stufe des betroffenen Hauses bzw. Auslösers.]
- **R1.3** Steuer, Aufstiegs-Wartezeit und Belegung eines Hauses richten sich nach `effectiveTaxLevel(world,
house.tier)`, also nach dem Regler **seiner** Stufe.

### R2 Steuer

- **R2.1** Je Stufe t: `Sₜ = Σ Einwohner × TIERS[t].tax × (alle Bedürfnisse erfüllt ? TAX_UNIT : 1)` über alle
  Häuser der Stufe t (alle Inseln). `taxUnits(world) = Σₜ Sₜ × taxPct(effectiveTaxLevel(world, t), t)`.
- **R2.2** `taxPct(level, tier) = TAX_LEVELS[level].pctByTier?.[tier] ?? TAX_LEVELS[level].pct` (ganzzahlig).
- **R2.3** Verbuchung unverändert: `stats.taxes = ⌊taxUnits / (TAX_UNIT × 100)⌋`; `taxCarry += taxUnits` je Tick,
  ganze Geldstücke `⌊taxCarry / TAX_CARRY_DIVISOR⌋` (= 20 000) gehen in `money`. `taxCarry` bleibt **ein** Feld
  (erst je Stufe summiert, dann einmal verbucht).
- **R2.4** Rechenbeispiel (AK-T02, Anhang 01 A): gemischte Stufen ergeben 669,3 je 100 Ticks; nach 100 Ticks ab
  `taxCarry = 0` sind es +669 Geld und `taxCarry = 6000`.

### R3 Satz «hoch» je Stufe (Entartungs-Lösung, O1)

- **R3.1** Def-Eintrag `src/sim/defs/tiers.ts`: `TAX_LEVELS.high.pctByTier = { 4: 115 }`. Typ in
  `src/sim/types.ts`: `TaxLevelDef.pctByTier?: Partial<Record<Tier, number>>` (ganzzahlig wie `pct`; fehlt eine
  Stufe, gilt `pct`). `low` und `normal` bekommen keinen Eintrag.
- **R3.2** Pioniere, Siedler, Bürger behalten «hoch» 130 %. Die Belegung «hoch» bleibt `TAX_LEVELS.high.occupancy =
0.75` für alle vier: Zielbelegung `max(1, ⌊maxInhabitants × 0,75⌋)` = 3 / 6 / 11 / **15** Einwohner.
- **R3.3** Kaufleute «hoch» zahlen damit je volles, erfülltes Haus 15 × 22 × 1,15 = **379,5 je 10 s** (100 Ticks)
  gegen 440 bei «normal» (Vorschlag §4). Schwelle g\* = 12,1 (Vorschlag Anhang A); «hoch» lohnt nur bei knappen
  Kaufleute-Waren.
- **R3.4** Die Wertänderung gilt auch für «alle Stufen hoch» (früher globales «hoch»): Kaufleute zahlen dort
  ebenfalls 115 %. Bewusst, freigegeben mit R412.

### R4 «niedrig» nur für aufstiegsfähige Stufen (O2)

- **R4.1** Für eine nicht aufstiegsfähige Stufe (heute Kaufleute) ist «niedrig» verboten:
  `setTierTaxLevel(world, 4, 'low')` liefert `{ ok: false, reason: 'Kaufleute steigen nicht auf' }` (Text
  `${TIERS[t].name} steigen nicht auf`) und ändert nichts.
- **R4.2** Der Zustand `taxLevels[t] = 'low'` für eine nicht aufstiegsfähige Stufe ist ungültig (Ladeprüfung R8.3).

### R5 Sperre je Regler (O3)

- **R5.1** `taxLockedUntil: Record<Tier, number>` (ersetzt die eine Zahl). Nach einem Umschalten ist **dieser**
  Regler bis `tick + TAX_SWITCH_LOCK` gesperrt; `TAX_SWITCH_LOCK = 300` Ticks (30 s) in `src/sim/defs/timing.ts`,
  Wert unverändert. Start: alle vier 0.
- **R5.2** Gesperrt heisst `world.tick < taxLockedUntil[t]`. Die Sperre eines Reglers berührt die anderen nicht.
- **R5.3** Die Sperre läuft auch ohne aktive Amtsstube und bei negativem Geld weiter; Umschalten kostet nichts
  (wie heute).

### R6 Aktionen (O4)

Beide Aktionen werfen nie, ziehen keinen Zufall und ändern bei `ok: false` nichts an der Welt.

**R6.1 `setTierTaxLevel(world, tier: number, level: string): Result`** (neu, `src/sim/tax.ts`). Prüfreihenfolge:

1. `tier` nicht 1–4 (ganzzahlig) oder `level` kein Schlüssel von `TAX_LEVELS` → `'Ungültige Stufe'`;
2. `level === 'low'` und Stufe nicht aufstiegsfähig → `'Kaufleute steigen nicht auf'` (R4.1);
3. keine aktive Amtsstube → `townhallReason(world)` (`'Braucht eine Amtsstube'` / `'Amtsstube wirkt nicht'`);
4. `taxLevels[tier] === level` → `'Stufe bereits aktiv'`;
5. Regler gesperrt → `'Sperrzeit'`;
6. sonst `taxLevels[tier] = level`, `taxLockedUntil[tier] = tick + 300`, `ok`.

**R6.2 `setTaxLevel(world, level: string): Result`** bleibt und heisst in der UI «alle Stufen». Zielwert je Stufe:
`ziel(t) = level`, ausser `level === 'low'` und t nicht aufstiegsfähig → `ziel(t) = 'normal'`. Menge der zu
ändernden Stufen `C = { t : taxLevels[t] ≠ ziel(t) }`. Prüfreihenfolge:

1. `level` ungültig → `'Ungültige Stufe'`;
2. keine aktive Amtsstube → `townhallReason(world)`;
3. `C` leer → `'Stufe bereits aktiv'`;
4. irgendein t ∈ C gesperrt → `'Sperrzeit'`, **nichts** wird geändert (atomar);
5. sonst für jedes t ∈ C: `taxLevels[t] = ziel(t)`, `taxLockedUntil[t] = tick + 300`. Stufen ausserhalb von C
   behalten Wert **und** Sperre.

**Setzung Spec:** Ein gesperrter Regler, der schon auf dem Ziel steht, blockiert «alle Stufen» nicht (er ist nicht
in C). Bei vier gleichen Reglern verhält sich `setTaxLevel` in Ergebnis und Sperre wie heute; einzige Abweichung:
«niedrig» lässt die Kaufleute auf «normal» (R4, Abschnitt 6).

### R7 Folgeregeln je Stufe

- **R7.1 Aufstiegs-Wartezeit** (`upgradeStatus`): `base = TAX_LEVELS[effectiveTaxLevel(world, house.tier)]
.upgradeWait` (150 / 300 / `null`); Fest und Defizit-Faktor 2 wirken wie heute auf `base`. `base === null` →
  Grund `'Steuer zu hoch'` (Text unverändert). Massgeblich ist die Stufe, **aus** der das Haus aufsteigt.
- **R7.2 Belegung** (`houseCap`): `max(1, ⌊TIERS[house.tier].maxInhabitants × TAX_LEVELS[effectiveTaxLevel(world,
house.tier)].occupancy⌋)`. Ein Haus über der Zielbelegung verliert wie heute 1 Einwohner je Wachstumstakt
  (`GROWTH_INTERVAL = 50` Ticks).
- **R7.3 Fest** (I-007, `feast.ts`, O5). Ein Fest wirkt auf ein Haus, wenn `effectiveTaxLevel(world, house.tier)
=== 'normal'` (bei «niedrig» ist die Wartezeit schon 150, bei «hoch» gibt es keinen Aufstieg). Im Haus selbst
  ändert sich nichts: R7.1 rechnet je Haus. Ablehnung (`feastBlock`) nach den bisherigen Prüfungen (läuft,
  Abklingzeit, brennt, nicht angebunden), vor der Rum-Prüfung:
  - H = alle Wohnhäuser im Dienstradius der Kapelle (gleiche Geometrie wie `feastActive`: Mittelpunktabstand ≤
    `serviceRadius`).
  - H leer oder mindestens ein Haus in H mit Steuerstufe «normal» → **keine** Steuer-Ablehnung.
  - Sonst Ablehnung mit Grundtext: alle Häuser in H «hoch» → `Steuer «hoch»: kein Aufstieg`; alle «niedrig» →
    `Steuer «niedrig»: Fest ohne Wirkung`; gemischt «niedrig»/«hoch» → `Steuer: Fest wirkt auf kein Haus`
    (**Setzung Spec**; die ersten beiden Texte sind die heutigen).
  - Kaufleute-Häuser mit «normal» zählen als «wirkt» (wie heute: Fest ist bei globalem «normal» erlaubt, auch wenn
    nur Kaufleute im Radius wohnen).
- **R7.4 Freischalt-Hinweis** `taxBlocks` (`nextUnlocks`, `unlocks.ts`): `true`, wenn der Auslöser `tierWish` oder
  `tierReached` mit Stufe t ist **und** `effectiveTaxLevel(world, t − 1) === 'high'` (die Vorstufe, deren Häuser
  aufsteigen müssten). Andere Auslöser: `false`. Nicht mehr global.
- **R7.5** Aufstiegs-Halt (`upgradeStops`) bleibt unverändert und unabhängig (Vorschlag §5 B).

### R8 Save v10

- **R8.1** `SAVE_VERSION = 10`. Gespeichert werden `taxLevels` (`{"1": …, "2": …, "3": …, "4": …}`) und
  `taxLockedUntil` (gleiche Schlüssel, ganze Zahlen). `taxLevel` entfällt. [Tech: Beide Schlüssel stehen in
  `createWorld` an der Stelle von `taxLevel`/`taxLockedUntil`, damit die Rückfaltung die Schlüsselreihenfolge
  hält.]
- **R8.2 Migration `migrateV9ToV10(raw)`** (wirft nie, läuft vor der Prüfung, Kette v1 → … → v9 → v10): mit `L =
raw.taxLevel`, `X = raw.taxLockedUntil`: `taxLevels[t] = L` für alle t, **Ausnahme R4**: ist `L === 'low'`, bekommt
  jede nicht aufstiegsfähige Stufe `normal` (Kaufleute zahlen im geladenen Stand 100 % statt 70 %).
  `taxLockedUntil[t] = X` für alle t. `taxLevel` wird gelöscht, `version = 10`. Ungültige Werte (`L = 'extreme'`, `X
= -1`) werden unverändert übernommen und von R8.3 abgewiesen.
- **R8.3 Ladeprüfung** (ersetzt die `taxLevel`-Prüfung in `isValidV2Fields`): `taxLevels` ist ein Objekt mit genau den
  Schlüsseln `"1"`–`"4"`, jeder Wert ein Schlüssel von `TAX_LEVELS`, kein `low` für nicht aufstiegsfähige Stufen;
  `taxLockedUntil` ist ein Objekt mit genau denselben Schlüsseln, jeder Wert ganzzahlig ≥ 0. Sonst `{ ok: false,
reason: 'Beschädigter Spielstand' }`; die UI zeigt wie heute den Hinweis, kein Absturz.
- **R8.4** `version` > 10 (z. B. 11) → `{ ok: false, reason: 'Unbekannte Version' }`.
- **R8.5 Versionsnummer:** Die M12-Spec reserviert v10 für E6 (geparkt). Laut R412 nimmt, wer zuerst gemergt wird,
  v10, der andere v11. Kommt E6 zuerst, gelten in dieser Spec überall v11 statt v10 und v10 statt v9 (Migration
  `migrateV10ToV11`, Rückfaltung `foldBackToV10`); Regeln und AK bleiben sonst gleich.
- **R8.6** Ältere Spielstände (v1–v9) bleiben über die Kette ladbar; kein Spielstand-Bruch.

## 4. Datenmodell und Def-Einträge

| Ort                          | Eintrag                                                              | Wert / Typ                                        |
| ---------------------------- | -------------------------------------------------------------------- | ------------------------------------------------- |
| `src/sim/defs/tiers.ts`      | `TAX_LEVELS.high.pctByTier`                                          | `{ 4: 115 }` (**neu**, R3.1)                      |
| `src/sim/defs/tiers.ts`      | `TAX_LEVELS.{low,normal,high}.pct / upgradeWait / occupancy`         | unverändert: 70/150/1 · 100/300/1 · 130/null/0,75 |
| `src/sim/defs/tiers.ts`      | `DEFAULT_TAX_LEVEL`                                                  | unverändert `'normal'`                            |
| `src/sim/defs/timing.ts`     | `TAX_SWITCH_LOCK`                                                    | unverändert 300 (gilt jetzt je Regler)            |
| `src/sim/types.ts`           | `TaxLevelDef.pctByTier?`                                             | `Partial<Record<Tier, number>>` (neu)             |
| `src/sim/types.ts` (`World`) | `taxLevels` (ersetzt `taxLevel`), `taxLockedUntil` (Zahl → je Stufe) | `Record<Tier, TaxLevel>`, `Record<Tier, number>`  |
| `src/sim/save.ts`            | `SAVE_VERSION`, `migrateV9ToV10`, Prüfung                            | 10 (R8)                                           |

Neue bzw. geänderte Sim-Funktionen: `taxPct(level, tier)` (R2.2), `effectiveTaxLevel(world, tier)` (R1.2),
`setTierTaxLevel` (R6.1), `setTaxLevel` (R6.2), `taxUnits` (R2.1), `houseCap`, `upgradeStatus`, `feastBlock`,
`nextUnlocks`. [Tech: Modulzuordnung; `taxPct` darf in `defs/tiers.ts` oder `tax.ts` liegen.]

Keine neue Laufzeit-Abhängigkeit, kein RNG-Zugriff, `src/sim/` bleibt DOM-frei.

## 5. Randfälle

- **Amtsstube fällt aus** (Brand, `outageUntil` gesetzt) oder **nicht angebunden**: alle vier wirken «normal»
  (Steuer 100 %, Wartezeit 300, volle Belegung); `taxLevels` und `taxLockedUntil` bleiben gespeichert und wirken
  nach Ende des Ausfalls wieder. Häuser unter «hoch» wachsen in der Zwischenzeit auf volle Belegung.
- **Abriss der Amtsstube:** wie Ausfall; die Regler-Werte bleiben im Zustand. Eine neue Amtsstube übernimmt sie
  (gleiches Verhalten wie heute mit `taxLevel`). Aktionen liefern `'Braucht eine Amtsstube'`.
- **Aufstieg in eine Stufe mit «hoch»:** Wartezeit zählt nach der alten Stufe (R7.1). Nach dem Aufstieg gilt die
  Zielbelegung der neuen Stufe: Siedler 8 → Bürger «hoch» wächst nur bis 11 statt 15; Bürger 15 → Kaufleute
  «hoch» bleibt bei 15 statt auf 20 zu wachsen. Zieht in keinem Fall Einwohner ab, weil die Höchstbelegung der
  Folgestufe nie kleiner ist.
- **Haus über Belegung:** Umschalten auf «hoch» lässt ein volles Haus je Wachstumstakt um 1 schrumpfen (Kaufleute
  20 → 15 in 5 Takten = 250 Ticks, Anhang 01 B); zurück auf «normal» wächst es, wenn versorgt, wieder um 1 je Takt.
- **Negatives Geld:** Umschalten erlaubt und kostenlos (R5.3); keine Steuer-Aktion prüft Geld.
- **Umschalten in der Sperre:** `'Sperrzeit'`; Welt unverändert; die UI nennt Stufe und Restzeit (7.4).
- **«alle Stufen» bei gemischtem Stand:** ändert nur die abweichenden Regler, sperrt nur diese (R6.2).
- **Kaufleute ohne Häuser oder vor dem Sieg:** Regler einstellbar wie die anderen; ohne Häuser wirkt er auf nichts.
- **Leere Insel / keine Häuser:** `taxUnits = 0` bei jeder Einstellung.
- **Alter Spielstand mit «niedrig»:** Kaufleute werden beim Laden «normal» (R8.2), ein Hinweis erscheint nicht
  (**Setzung Spec**: der Spieler sieht es im Raster).
- **Manipulierter Spielstand** (Kaufleute «low», fehlende Stufe, Sperre negativ): abgewiesen mit Hinweis (R8.3).

## 6. Baseline und Balancing

**Bitgleich bei vier gleichen Werten** (Vorschlag §6 a–f):

- (a) Controller und Balancing-Test rufen keine Steuer-Aktion auf (`tax` in `tests/sim/controller.ts`,
  `merchantsController.ts`, `balance.test.ts`: kein Treffer) → alle vier Regler bleiben `normal`.
- (b) `Σₜ Sₜ × 100 = 100 × Σₜ Sₜ`; alle Summanden ganze Zahlen weit unter 2⁵³, Reihenfolge und Aufteilung der
  Summe ändern das Ergebnis nicht; `taxCarry`, `stats.taxes` und `money` bleiben bitgleich.
- (c) Wartezeit, Belegung, Fest und `taxBlocks` lesen für jede Stufe `normal` wie heute.
- (d) `pctByTier` greift nur bei «hoch».
- (e) Kein RNG-Zugriff in den neuen Pfaden.
- (f) Hash-Pins falten heute über `foldBackToV8` zurück; ein vorgeschaltetes `foldBackToV9` hält sie bitgleich.

**`foldBackToV9(v10)`** (neu in `tests/sim/helpers.ts`): ersetzt `taxLevels` an derselben Schlüsselstelle durch
`taxLevel` = Wert der Stufen 1–3, wenn diese gleich sind und Stufe 4 gleich ist oder (Stufen 1–3 = `low` und Stufe
4 = `normal`); sonst wirft der Helfer (Fehler im Test). `taxLockedUntil` → Maximum der vier Werte; `version` → 9.
Unbekannter Schlüssel → Fehler (wie `foldBackToV8`). Jede heutige Stelle `foldBackToV8(x)` wird
`foldBackToV8(foldBackToV9(x))` (u. a. `tests/sim/save.test.ts`, `balance-crises.test.ts`); die Hash-Werte über
`deserialize(...).world` (`CHAIN_HASHES`) werden ebenso über `foldBackToV9` gebildet.

**Balancing-Test:** `tests/sim/balance.test.ts` bleibt ohne Änderung grün; kein Pin in `tests/sim/e0Pins.ts`, kein
Fingerabdruck- oder Sieg-Zeit-Pin wird nachgestellt.

**Bewusste Wertänderung (R412):** Kaufleute «hoch» 130 % → 115 % und Kaufleute unter «alle niedrig» 70 % → 100 %
betreffen Bestandstests, die Kaufleute unter «hoch» oder «niedrig» rechnen (Aufrufe von `setTaxLevel` mit
`high`/`low` in `tests/sim/` und `tests/ui/hints.test.ts`; Fixtures `save-v2.json` und `save-v4.json` mit
`taxLevel` ≠ `normal`). Der Plan listet sie und passt nur die Erwartungen an, die Kaufleute betreffen; Erwartungen
für Stufen 1–3 bleiben.

## 7. UI

Gilt Desktop-first für die Panel-Spalte 280 px ab 900 px Fensterbreite (Zielauflösungen 1280×720 und 1920×1080).
Unter 900 px nur: nichts überlappt, kein waagrechtes Scrollen im Panel, kein Absturz. Alle Zahlen und Texte kommen
aus `TAX_LEVELS`, `TIERS` und den Sim-Abfragen, keine kopierte Zahl im UI.

### 7.1 Reine Helfer (DOM-frei, Vitest unter `tests/ui/`)

[Tech: Modul, z. B. `src/ui/taxView.ts` oder Erweiterung von `guide.ts`/`hud.ts`.]

- **`taxSummary(world)`** → `TaxLevel | 'mixed'`: L, wenn für jede Stufe `taxLevels[t] === ziel_L(t)` (Zielwert aus
  R6.2, also «niedrig» mit Kaufleuten «normal» zählt als `low`); sonst `'mixed'`. Gelesen wird der gespeicherte
  Stand (wie die heutige Hervorhebung).
- **`taxSummaryText(world)`**: `low`/`normal`/`high` → `TAX_LEVELS[L].name`; `mixed` → «gemischt».
- **`taxMixList(world)`** → «P niedrig · S normal · B normal · K hoch» (Anfangsbuchstabe von `TIERS[t].name`,
  Name der Steuerstufe, Trenner « · »).
- **`tierTaxTooltip(tier, level)`**: `'{taxPct} % · {Aufstieg} · {Zielbelegung} Einwohner'`; Aufstieg = «Aufstieg
  nach {formatGameTime(upgradeWait)}» bzw. «kein Aufstieg»; für nicht aufstiegsfähige Stufen entfällt der
  Aufstiegsteil. Für Kaufleute «niedrig»: «Kaufleute steigen nicht auf». Werte in Anhang 01 C.
- **`taxEffect(level, tier?)`** (bestehend, erweitert): ohne `tier` wie heute, bei «hoch» mit Zusatz «(Kaufleute
  115 %)» aus `pctByTier`: «hoch: 130 % Steuer (Kaufleute 115 %) · kein Aufstieg · Häuser nur zu 75 % belegt».
  «niedrig» bekommt den Zusatz «(Kaufleute normal)». `normal` unverändert.
- **`tierTaxPerMinute(world, tier)`** → `⌊Sₜ × taxPct(effectiveTaxLevel(world, t), t) × 3 / 100⌋` (= Steuer der
  Gruppe je 600 Ticks, abgerundet). Die Summe der vier Zeilen kann wegen Rundung um bis zu 3 unter der Bilanz liegen.
- **`taxLockText(world, tier)`** → «wieder änderbar in {formatGameTime(rest)}» oder `''` ohne Sperre.

### 7.2 Amtsstube-Panel (Abschnitt «Steuer»)

- **U-1 Zeile «alle Stufen»** (Kopfzeile des Rasters): Beschriftung «alle Stufen», drei Knöpfe niedrig / normal /
  hoch, Klick ruft `setTaxLevel`. Hervorgehoben (`active`, `aria-pressed="true"`) ist der Knopf L mit
  `taxSummary === L`; bei `mixed` keiner. Tooltip je Knopf = `taxEffect(L)`.
- **U-2 Raster 4 × 3** darunter: je Stufe eine Zeile mit Gruppenname (`TIERS[t].name`), drei Knöpfen (Klick ruft
  `setTierTaxLevel(t, L)`, hervorgehoben, wenn `taxLevels[t] === L`), rechts «{tierTaxPerMinute} / min» und darunter
  bzw. daneben `taxLockText` (verborgen ohne Sperre). Tooltip je Knopf = `tierTaxTooltip(t, L)`.
- **U-3** Kaufleute «niedrig» ist `disabled` mit Tooltip «Kaufleute steigen nicht auf» (R4); für aufstiegsfähige
  Stufen sind alle drei Knöpfe bedienbar.
- **U-4** Die heutige Zeile `tax-effect` zeigt `taxEffect(taxSummary)` bzw. bei `mixed` «Steuer gemischt: » +
  `taxMixList`; die globale Zeile `tax-lock` entfällt (ersetzt durch U-2). Ausgabesperre und Aufstiegs-Halt folgen
  unverändert darunter.
- **U-5** Ohne aktive Amtsstube bleibt das Raster sichtbar und bedienbar wie heute die drei Knöpfe; die Zustandszeile
  «Wirkt nicht: …» bleibt; Klicks scheitern mit dem Grund, Gruppensteuer zeigt den wirksamen Wert (normal).
- **U-6** Das Raster wird einmal je Auswahl gebaut; die Nachführung setzt nur Text, Klassen, `hidden`, `disabled`
  (Knoten bleiben über Ticks gleich, Fokus bleibt).

### 7.3 Kopfzeile (HUD)

Die Kopfzeile hat heute **einen** Steuer-Knopf (`data-field="tax"`), der die Amtsstube öffnet; das bleibt so.

- **U-7** Text: `taxSummaryText` («normal», «niedrig», «hoch» oder «gemischt»); `aria-label` «Steuer {Text}»
  (`taxButtonText`). Tooltip (`title`): bei einheitlichem Stand `taxEffect(L)`, bei `mixed` `taxMixList`. Sichtbar
  wie heute nur mit aktiver Amtsstube.
- **U-8** Mouse-over der Amtsstube: «Steuer: {taxSummaryText}». Ruhe-Ansicht (`inspect.ts`, Zeile Steuer):
  `taxEffect`/«Steuer gemischt: …» wie U-4, plus « (keine Amtsstube)» wie heute.

### 7.4 Sperr- und Fehlerhinweise

- **U-9** `'Sperrzeit'` aus `setTierTaxLevel(t, …)` → «Steuer für {Gruppe} erst in {m:ss / n s} wieder änderbar»;
  aus `setTaxLevel` → dieselbe Form für die **kleinste** gesperrte Stufe in C. [Tech: wie `friendlyReason` die
  Stufe erfährt; der Sim-Grund bleibt `'Sperrzeit'`.]
- **U-10** `'Kaufleute steigen nicht auf'` wird unverändert angezeigt; `'Stufe bereits aktiv'` → «Diese
  Steuerstufe gilt bereits» (wie heute).

### 7.5 Hinweise, Leitfaden, Mouse-over eines Hauses

- **U-11** Hinweis zum Aufstiegsgrund `'Steuer zu hoch'` nennt die Gruppe des Hauses: «Steuer ‚hoch' für Bürger
  verhindert den Aufstieg». [Tech: Weg zur Stufe; Sim-Grund bleibt `'Steuer zu hoch'`.]
- **U-12** Leitfaden (`guide.ts`, nächster Schritt): kleinste Stufe t mit wirksamem «hoch», in der ein Haus
  aufsteigen könnte (`canRise`) → «Steuer ‚hoch' für {Gruppe} verhindert den Aufstieg: stelle sie auf ‚normal'
  oder ‚niedrig'». Gibt es keine solche Stufe, entfällt der Satz.
- **U-13** Mouse-over eines Wohnhauses: mit aktiver Amtsstube zusätzliche letzte Zeile «Steuer: {Name der wirksamen
  Steuerstufe seiner Gruppe}»; ohne aktive Amtsstube keine Steuerzeile (wie heute).

### 7.6 Chronik

Die Ereignis-Chronik (`crisisLog.ts`, `eventLogView.ts`) führt nur Krisen; Steuer-Umschalten erscheint dort heute
nicht (`setTax` in `app.ts` meldet nur Fehler). **Keine Änderung:** auch das Umschalten einzelner Regler erzeugt
keinen Chronik-Eintrag.

## 8. Abnahmekriterien

### 8.1 Vitest Sim

Neue Datei `tests/sim/taxTiers.test.ts`, sofern nicht anders genannt. Testwelten mit `createWorld(3, { unlockAll:
true })`, aktive Amtsstube (angebunden, ohne Ausfall), Häuser roh eingesetzt wie in `tests/sim/taxes.test.ts`.
Erwartungswerte: Anhang 01.

- **AK-T01** `createWorld`: `taxLevels` = `{1:'normal',2:'normal',3:'normal',4:'normal'}`, `taxLockedUntil` =
  `{1:0,2:0,3:0,4:0}`; kein Feld `taxLevel`.
- **AK-T02** Steuer je Stufe (Anhang 01 A): Pioniere 4 Einw. erfüllt «niedrig», zwei Siedler-Häuser 8 Einw.
  «normal» (eines erfüllt, eines nicht), Bürger 11 erfüllt «hoch», Kaufleute 15 erfüllt «hoch» → `taxUnits` =
  133 860; nach 100 × `tickTaxes` ab `taxCarry = 0` und `money = 0`: `money === 669`, `taxCarry === 6000`,
  `stats.taxes === 669`.
- **AK-T03** Vier gleiche Regler: für L ∈ {normal, high} und eine Welt nur mit Häusern der Stufen 1–3 gilt
  `taxUnits === TAX_LEVELS[L].pct × Σₜ Sₜ`; bei allen «normal» mit Kaufleuten `taxUnits === 100 × Σₜ Sₜ`.
- **AK-T04** `taxPct`: `('high', 4) === 115`, `('high', 1..3) === 130`, `('low', t) === 70`, `('normal', t) === 100`.
- **AK-T05** Kaufleute «hoch»: Haus Kaufleute 20 Einw. voll versorgt, `setTierTaxLevel(w, 4, 'high')` bei einem
  Tick, der Vielfaches von 50 ist → `houseCap === 15`; nach 250 Ticks (5 Wachstumstakte) Einwohner 15, nach weiteren 500 Ticks weiter 15;
  danach `taxUnits` des Hauses je Tick 75 900, Steuer je 100 Ticks 379,5 (gegen 440 bei «normal»: 88 000).
- **AK-T06** `houseCap` bei «hoch» je Stufe: 3 / 6 / 11 / 15; bei «normal» und «niedrig»: 4 / 8 / 15 / 20.
- **AK-T07** Wartezeit je Haus: Pioniere «niedrig», Siedler «normal», Bürger «hoch», je voll, Dienste und Waren
  vorhanden, `satisfiedSince = tick − 100` → `upgradeStatus`-Gründe enthalten «Bedürfnisse noch nicht 150 Ticks
  erfüllt» (Pioniere), «Bedürfnisse noch nicht 300 Ticks erfüllt» (Siedler), «Steuer zu hoch» (Bürger).
- **AK-T08** Sperre je Regler: bei Tick 1000 `setTierTaxLevel(w, 2, 'low')` ok → `taxLockedUntil[2] === 1300`;
  im selben Tick `setTierTaxLevel(w, 3, 'high')` ok; bei Tick 1299 `setTierTaxLevel(w, 2, 'normal')` →
  `'Sperrzeit'`, bei Tick 1300 ok. `taxLockedUntil[1]` und `[4]` bleiben 0.
- **AK-T09** «alle» atomar: Pioniere «niedrig» gesperrt bis 1300; bei Tick 1100 `setTaxLevel(w, 'high')` →
  `'Sperrzeit'`, `taxLevels` und `taxLockedUntil` tief gleich wie vorher. `setTaxLevel(w, 'low')` im selben Tick
  → ok, ändert nur Siedler und Bürger (beide gesperrt bis 1400), Pioniere-Sperre bleibt 1300, Kaufleute bleiben
  «normal» mit Sperre 0.
- **AK-T10** «alle niedrig»: aus allen «normal» → `taxLevels` `{1:'low',2:'low',3:'low',4:'normal'}`, Sperren 1–3 =
  tick + 300, Sperre 4 unverändert; zweiter Aufruf → `'Stufe bereits aktiv'`. Aus allen «normal»
  `setTaxLevel(w, 'normal')` → `'Stufe bereits aktiv'`.
- **AK-T11** Kaufleute «niedrig»: `setTierTaxLevel(w, 4, 'low')` → `{ ok: false, reason: 'Kaufleute steigen nicht
auf' }`, `serialize(w)` vorher = nachher; auch ohne Amtsstube derselbe Grund (Reihenfolge R6.1).
- **AK-T12** Gründe `setTierTaxLevel`: `tier` 0, 5, `2.5` → `'Ungültige Stufe'`; `level` `'x'` → `'Ungültige
Stufe'`; ohne Amtsstube → `'Braucht eine Amtsstube'`; Amtsstube brennt → `'Amtsstube wirkt nicht'`; gleicher
  Wert → `'Stufe bereits aktiv'`. `setTaxLevel(w, 'x')` → `'Ungültige Stufe'`.
- **AK-T13** Ohne aktive Amtsstube: alle vier «hoch» gespeichert, Amtsstube `outageUntil` gesetzt →
  `effectiveTaxLevel(w, t) === 'normal'` für t = 1…4, `taxUnits === 100 × Σ Sₜ`, `houseCap` voll; `taxLevels`
  unverändert «hoch»; nach Ende des Ausfalls wieder `'high'`.
- **AK-T14** Fest (`tests/sim/feast.test.ts`): Kapelle mit Siedler «normal» und Bürger «hoch» im Radius →
  `holdFeast` ok; Siedler-Wartezeit 150, Bürger weiter «Steuer zu hoch». Nur Häuser «hoch» im Radius →
  `Steuer «hoch»: kein Aufstieg`; nur «niedrig» → `Steuer «niedrig»: Fest ohne Wirkung`; gemischt niedrig/hoch →
  `Steuer: Fest wirkt auf kein Haus`; Haus «normal» ausserhalb des Radius ändert die Ablehnung nicht; kein Haus im
  Radius und alle Regler «hoch» → ok. Bei Ablehnung bleiben Rum und `feastAt` unverändert.
- **AK-T15** `taxBlocks`: Auslöser `tierWish` 2 → `true` genau bei Pioniere «hoch» (Siedler «hoch» allein →
  `false`); `tierWish` 3 und `tierReached` 3 → `true` bei Siedler «hoch»; ohne aktive Amtsstube immer `false`;
  Auslöser `houses` → `false`.
- **AK-T16** Werfen nie: `setTierTaxLevel` mit `tier` ∈ {−1, 0, 1, 4, 5, `1.5`, `NaN`} × `level` ∈ {'low', 'normal',
  'high', '', 'x'} und `setTaxLevel` mit denselben `level` liefern immer ein `Result` ohne Ausnahme; bei `ok:
false` ist `serialize(w)` unverändert; der RNG-Zustand der Welt bleibt in allen Fällen gleich.

### 8.2 Vitest Save (`tests/sim/save.test.ts`)

- **AK-T17** Rundlauf v10: gemischte Regler und Sperren (`{1:'low',2:'normal',3:'high',4:'high'}`, Sperren
  `{1:1300,2:0,3:900,4:0}`) → `deserialize(serialize(w))` ok und tief gleich.
- **AK-T18** Migration v9 → v10 (v9-Text aus Fixture oder über `foldBackToV9` erzeugt [Tech]): `taxLevel 'high'`,
  `taxLockedUntil 450` → alle vier `'high'`, alle Sperren 450; `'low'` → 1–3 `'low'`, 4 `'normal'`, alle Sperren
  450; `'normal'` → alle `'normal'`. Ergebnis `version 10`, kein Feld `taxLevel`.
- **AK-T19** Ladeprüfung, je Fall `{ ok: false, reason: 'Beschädigter Spielstand' }` ohne Ausnahme: `taxLevels[2] =
'extreme'`; `taxLevels[4] = 'low'`; Schlüssel `"3"` fehlt; Zusatzschlüssel `"5"`; `taxLevels` fehlt (nur
  `taxLevel`); `taxLockedUntil[1] = -1`; `= 1.5`; `= '300'`; `taxLockedUntil` als Zahl statt Objekt; v9 mit
  `taxLevel 'extreme'` (Migration wirft nicht, Prüfung weist ab).
- **AK-T20** `version: 11` → `{ ok: false, reason: 'Unbekannte Version' }`.
- **AK-T21** Kette: alle Fixtures v1 … v9 laden ok; `save-v2.json` (`low`, Sperre 1300) ergibt
  `{1:'low',2:'low',3:'low',4:'normal'}` und alle Sperren 1300; `save-v4.json` (`high`, 5100) ergibt alle `'high'`
  und alle Sperren 5100.

### 8.3 Vitest Baseline

- **AK-T22** `tests/sim/balance.test.ts` ist grün, und `git diff main -- tests/sim/balance.test.ts` ist leer.
- **AK-T23** Hash-Pins: `git diff main -- tests/sim/e0Pins.ts` ist leer; alle Tests, die heute über
  `foldBackToV8` gegen `V6_FORMS`, `CHAIN_HASHES` oder feste JSON-Texte prüfen, laufen mit
  `foldBackToV8(foldBackToV9(…))` grün, ohne Pin-Wert zu ändern.
- **AK-T24** `foldBackToV9` (Helfer-Test): `{1..4: 'normal'}` → `taxLevel 'normal'`; `{1..3:'low',4:'normal'}` →
  `'low'`; `{1:'low',2:'normal',…}` → wirft; Sperren `{1:1300,2:1300,3:1300,4:0}` → `taxLockedUntil 1300`;
  Schlüsselreihenfolge von `JSON.stringify` gleich wie bei einem v9-Stand.
- **AK-T25** Fingerabdruck- und Sieg-Zeit-Pins (`balance-crises.test.ts`, `seaRoute.test.ts`, `balance-*.test.ts`)
  unverändert grün; `git diff main` zeigt in diesen Dateien höchstens die Umstellung auf `foldBackToV9`, keinen
  geänderten Pin-Wert.

### 8.4 Vitest UI (reine Helfer, `tests/ui/`)

- **AK-T26** `taxSummary`: alle «normal» → `'normal'`; 1–3 «niedrig» + 4 «normal» → `'low'`; alle «hoch» →
  `'high'`; `{1:'low',2:'normal',3:'normal',4:'high'}` → `'mixed'`; `taxSummaryText` dazu «gemischt»,
  `taxButtonText` «Steuer gemischt».
- **AK-T27** `taxMixList` für den gemischten Stand aus AK-T26 → «P niedrig · S normal · B normal · K hoch».
- **AK-T28** `tierTaxTooltip`: Kaufleute «hoch» → «115 % · 15 Einwohner»; Kaufleute «normal» → «100 % · 20
  Einwohner»; Kaufleute «niedrig» → «Kaufleute steigen nicht auf»; Pioniere «niedrig» → «70 % · Aufstieg nach 15 s
  · 4 Einwohner»; Bürger «hoch» → «130 % · kein Aufstieg · 11 Einwohner» (alle Zeilen Anhang 01 C).
- **AK-T29** `taxEffect('high')` → «hoch: 130 % Steuer (Kaufleute 115 %) · kein Aufstieg · Häuser nur zu 75 %
  belegt»; `taxEffect('normal')` unverändert gegen heute.
- **AK-T30** `tierTaxPerMinute` in der Welt aus AK-T02 → Pioniere 33, Siedler 504, Bürger 1201, Kaufleute 2277.
- **AK-T31** `taxLockText`: Sperre bis tick + 200 → «wieder änderbar in 20 s»; ohne Sperre `''`. Sperrhinweis
  (U-9) für Siedler mit Rest 200 → «Steuer für Siedler erst in 20 s wieder änderbar»; «alle hoch» mit gesperrten
  Pioniere und Bürger → Text nennt Pioniere.
- **AK-T32** Hinweis U-11 für ein Bürger-Haus unter «hoch» → «Steuer ‚hoch' für Bürger verhindert den Aufstieg»;
  Leitfaden U-12 mit vollem Siedler-Haus, Siedler «hoch», sonst «normal» → «Steuer ‚hoch' für Siedler verhindert
  den Aufstieg: stelle sie auf ‚normal' oder ‚niedrig'».
- **AK-T33** Mouse-over: Bürger-Haus, aktive Amtsstube, Bürger «hoch» → letzte Zeile «Steuer: hoch»; ohne aktive
  Amtsstube keine Steuerzeile (Zeilen wie heute); Amtsstube bei gemischtem Stand → «Steuer: gemischt».

### 8.5 Browser (qa-playtester, Headless-Chrome)

Screenshots unter `.studio/qa/steuer-je-stufe/`, Dateiname `<ak>-<breite>x<höhe>.png`, Auflösungen 1280×720 und
1920×1080, sofern nicht anders genannt. Testwelt mit `unlockAll`, aktiver Amtsstube und Häusern aller vier Stufen.

- **AK-T34** Amtsstube-Panel: Zeile «alle Stufen» mit drei Knöpfen, darunter 4 Zeilen (Pioniere, Siedler, Bürger,
  Kaufleute) × 3 Knöpfe, je Zeile «… / min»; bei «normal» überall ist «normal» in allen Zeilen und in «alle
  Stufen» hervorgehoben. Kein waagrechtes Scrollen im Panel (`scrollWidth ≤ clientWidth`).
- **AK-T35** Kaufleute «niedrig» ist deaktiviert; Hover zeigt «Kaufleute steigen nicht auf»; Hover Kaufleute «hoch»
  zeigt «115 % · 15 Einwohner».
- **AK-T36** Klick Pioniere «niedrig»: nur in der Pioniere-Zeile erscheint «wieder änderbar in 30 s» und zählt
  herunter; Klick Siedler «hoch» gelingt sofort; Kopfzeilen-Knopf zeigt «gemischt», Tooltip «P niedrig · S hoch · B
  normal · K normal»; in «alle Stufen» ist kein Knopf hervorgehoben.
- **AK-T37** In der Sperre Klick «alle Stufen: normal» → Fehlermeldung «Steuer für Pioniere erst in … wieder
  änderbar»; alle Hervorhebungen bleiben.
- **AK-T38** Klick «alle Stufen: niedrig» (nach Ablauf der Sperren): Pioniere bis Bürger «niedrig», Kaufleute
  «normal», «alle Stufen: niedrig» hervorgehoben, Kopfzeile «niedrig».
- **AK-T39** Mouse-over eines Bürger-Hauses bei Bürger «hoch» zeigt «Steuer: hoch» und als Aufstiegsgrund «Steuer
  ‚hoch' für Bürger verhindert den Aufstieg».
- **AK-T40** Umschalten erzeugt keinen Eintrag in der Ereignis-Chronik (Liste vor und nach dem Klick gleich).
- **AK-T41** Fenster 800×600: Raster ohne Überlappung, Panel ohne waagrechtes Scrollen, keine Fehlermeldung in der
  Konsole (nur «stürzt nicht ab»).

## 9. Doku-Folgen

- **README «Steuern und Steuerregler»** (heute Z. 450–468) neu fassen: Regler je Stufe **in der Amtsstube** (der
  heutige Satz «Steuerregler in der Kopfzeile» ist überholt), Zeile «alle Stufen», Kopfzeile zeigt «gemischt»,
  Sperre 30 s je Regler. Neue Tabelle:

  | Stufe   | Steuer                 | Aufstieg nach | Belegung der Häuser                                   |
  | ------- | ---------------------- | ------------- | ----------------------------------------------------- |
  | niedrig | 70 % (nicht Kaufleute) | 15 s          | voll                                                  |
  | normal  | 100 %                  | 30 s          | voll                                                  |
  | hoch    | 130 %, Kaufleute 115 % | kein Aufstieg | 75 % (Pioniere 3, Siedler 6, Bürger 11, Kaufleute 15) |

  Dazu ein Satz «Kaufleute steigen nicht auf; für sie gibt es kein ‹niedrig›. ‹hoch› lohnt bei Kaufleuten nur, wenn
  ihre Waren knapp sind.» Mitführen: Z. 114 (Fest: «ohne Wirkung, wenn im Umkreis kein Haus mit Steuer ‹normal›
  wohnt»), Z. 240–241 (Amtsstube), Z. 411, 426, 433 (Steuerregler → «Regler der Stufe»), Z. 58 (Wirkung der
  Steuerstufe in der Ruhe-Ansicht, «gemischt»).

- **`docs/arc42.md`:** Persistenz betroffen. Bausteinzeile `save.ts` (Z. ~177: Version 10, `migrateV9ToV10`),
  Abschnitt Steuerstufe (Z. ~684: `taxLevels` je Stufe, `effectiveTaxLevel(world, tier)`, `pctByTier`),
  Persistenz-Abschnitt (Z. ~871–914: «Gespeichert wird immer Version 10», v2-Feldprüfung `taxLevels`/`taxLockedUntil`
  je Stufe, Kette v1 … v10).
- Keine ADR nötig (keine Abhängigkeit, kein Architekturentscheid; Save-Versionierung nach bestehendem Muster).

## 10. Offene Punkte

Keine offenen Designfragen; O1–O5 sind mit R412 entschieden. Für Plan und Gate Spec markiert:

- **P-1 Versionsnummer** (R8.5): lead-tech prüft beim Planen, ob E6 schon v10 belegt.
- **P-2 Grund mit Stufe** (U-9, U-11): Die Sim-Gründe `'Sperrzeit'` und `'Steuer zu hoch'` bleiben wörtlich, damit
  Bestandstests und Hinweis-Muster gelten; lead-tech wählt den Weg, wie die UI die Stufe erfährt.
- **P-3 Feinwert nach Playtest:** 115 % liegt knapp an der Schwelle (Vorschlag §10); nachstellbar nur über
  `pctByTier` (110 % → g\* 15,4; 120 % → g\* 8,8, dann dominiert «hoch» wieder). Jede Änderung braucht ein Ruling.

**Playtest-Frage (15 Minuten):** Stellt der Spieler Pioniere ohne Erklärung auf «niedrig», und versteht er
«gemischt» in der Kopfzeile?

## 11. Grössenschätzung

Gesamt **M** (Vorschlag §10): ein Sim-Paket (Zustand, Steuer, Wartezeit, Belegung, Fest, `taxBlocks`, zwei
Aktionen, Save v10, `foldBackToV9`, Bestandstests) und ein UI-Paket (Raster, Kopfzeile, Hinweise, Leitfaden,
Mouse-over, README, arc42). Risiko mittel: Save und Hash-Pins (abgefangen durch `foldBackToV9`), Wertänderung
Kaufleute «hoch» (R412).
