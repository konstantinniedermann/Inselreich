> **Task-ID:** T04 · **AK-IDs:** AK-E2-04, AK-E2-05, AK-E2-06, AK-E2-07, AK-E2-08, AK-E2-14
> **blocked-by:** T03; Entscheid **D-142** (L0, Gate Plan) · **Strang:** e2, `.worktrees/m12-see-e2` ·
> `tech-sim-engineer` (sonnet)
> **Regeln:** Spec Anhang 03 C.4–C.8; Index P-5; Pins `tests/sim/seePins.ts` (T00)

## T04: Handel, Aufträge, Bilanz und Krisen je Insel

**Ziel:** Jedes Kontor handelt und liefert aus seinem Lager; Bilanz und Dämpfung gelten je Insel; Brand kann alle
Inseln treffen, ohne eine zusätzliche Ziehung. Mit nur der Heimat brennbar ist alles bitgleich.

**Code-Fakten:** `trade.ts` `buy`/`sell(world, good, n, island = HOME)` (E0), `sellPct` global; `orders.ts`
`deliverOrder(world)` aus `home(w).stock`; `flow.ts` `goodsBalance(world)` (nur `HOME`), `upgradeDeficit`;
`population.ts:144/200` `budgetFrom(goodsBalance(world))`; `crises.ts` `rollCrisis(seed, k, maxTier, rect)`,
`flammableRect(world)` (nur `HOME`), `fireTarget(world, tile)`, `isProtected` (gleiche Insel, E0), `beginCrisis`
(`tile.island = HOME` seit T01). `islands.ts` `islandName`.

**Dateien:** `src/sim/trade.ts`, `orders.ts`, `flow.ts`, `population.ts` (nur Budget je Insel), `crises.ts`;
`tests/sim/trade.test.ts`, `orders.test.ts`, `flow.test.ts`, `fire.test.ts`, `storm.test.ts`.

## Regeln (verbindlich)

- **Handel:** `buy`/`sell` auf `island` ohne Kontor → **„Kein Kontor auf <Name>"**; Kauf bucht in
  `islands[island].stock` (Grenze `STORAGE_CAP` 100 je Insel), Verkauf entnimmt dort; `sellPct` bleibt global.
- **Aufträge:** `deliverOrder(world, island = HOME)`: ohne Kontor → **„Kein Kontor auf <Name>"**; zu wenig im
  Insellager → für `island ≥ 1` **„Nicht genug Ware auf <Name>"** (Heimat: heutiger Text); Prämie global. Ziehung
  (`tickOrders`, `orderForPeriod`) unverändert.
- **Bilanz:** `goodsBalance(world, island = HOME)` zählt nur Gebäude mit `b.island === island`, Versorgung über
  `inSupplyRange(world, island, …)`. Wachstumstakt (`population.ts`): Budget **je Insel** einmal je Takt
  (`Map<number, Budget>` lazy), Haus nutzt das Budget seiner Insel; Abzug nach Aufstieg im Budget dieser Insel.
  `upgradeDeficit(world, b)` mit `b.island`.
- **D-142 (Dämpfung bei Gewürz):** Ohne Ruling gilt Spec-Wortlaut (Gewürz-Defizit dämpft den Aufstieg 3 → 4 auch in
  der Heimat). Entscheidet L0 die Empfehlung („Güter, die auf der Hausinsel nicht erzeugt werden können, dämpfen
  nicht"), dann überspringt `deficitGood` solche Güter (Test D1 unten). Beides bitgleich, solange `TIERS[4]` kein
  Gewürz braucht (vor T05).
- **Brand (P-5):** `fireRect(world): { rect: TileRect; parts: { island: number; r: TileRect }[] } | null` — Teile
  = `flammableRect` je Insel (nur Inseln mit brennbaren Gebäuden, Inselfolge), Gesamt = `{ x0: R_f.x0, y0: R_f.y0,
x1: R_f.x0 + Wmax − 1, y1: R_f.y0 + ΣH − 1 }` (`R_f` = erster Teil). `rollCrisis(seed, k, maxTier, fire.rect)`
  unverändert. Rückrechnung `fireTile(fire, tile)`: `dy = y − y0`, Teile der Reihe nach (`dy −= h_i`), `dx = x − x0`;
  `dx ≥ w_i` → `null` (**Fehlschlag** wie ohne Gebäude); sonst `{ island, x: r.x0 + dx, y: r.y0 + dy }`.
  `beginCrisis` speichert `tile = { x, y, island }`; `fireTarget(world, tile)` sucht auf `islands[tile.island]`.
  Feuerwache schützt nur ihre Insel (E0, unverändert).
- **Sturm** wirkt auf `stormAffected`-Betriebe aller Inseln (heute global — nur Test). **Boom** unverändert (Pool
  ohne Gewürz, T05 prüft).

## Schritte

- [ ] **1 Tests zuerst** (Welt `seaWorld()`, `foundKontor2Literal(w, 2)`; Namen Felsbucht = 2):
  - `trade.test.ts` **AK-E2-04**: Kauf 10 Holz auf 2 → Lager 2 +10, Heimat gleich; Lager 2 Holz 95, Kauf 10 → Grenze
    100 wie heute; Verkauf 10 Werkzeug Heimat + 10 auf 2 → `sellPct.tools` −20 Punkte gegenüber Start; Kauf auf A
    ohne Kontor → „Kein Kontor auf Möweninsel", Welt unverändert.
  - `orders.test.ts` **AK-E2-05**: Auftrag (Literal `w.order`) Werkzeug 10, Heimat 50, Lager 2 = 5 →
    `deliverOrder(w, 2)` „Nicht genug Ware auf Felsbucht"; Lager 2 = 10 → `ok`, Lager 2 −10, Heimat gleich, Geld +
    Prämie. **AK-E2-14** `deliverOrder(w, 1)` (A ohne Kontor) → „Kein Kontor auf Möweninsel", `serialize` gleich.
  - `flow.test.ts` **AK-E2-06**: Wohnhaus und Fischer auf 2 → `goodsBalance(w, 2)` zählt sie, `goodsBalance(w, 0)`
    nicht; Defizit Nahrung auf 2 → Heimat-Haus steigt ohne Dämpfung (`upgradeStatus` Wartezeit einfach) und umgekehrt.
    **D1** (nur bei Ruling-Variante): `importOnly(world, island, g)` (`flow.ts`, rein) = kein Gebäude mit
    `produces g` hat auf dieser Insel ein erfüllbares `islandTrait` → `importOnly(w, 0, 'spice') === true`,
    `importOnly(w, 2, 'spice') === false`, `importOnly(w, 0, 'food') === false`. `deficitGood(budget, house, skip)`
    bekommt `skip: (g: GoodId) => boolean` (Standard `() => false`); Aufrufer übergeben `g => importOnly(w, i, g)`.
    Die Wirkung (Heimat-Aufstieg 3 → 4 ohne Dämpfung trotz Gewürz-Defizit) prüft T05, sobald `TIERS[4]` Gewürz braucht.
  - `fire.test.ts` **AK-E2-07**: Seeds `SEE_SEEDS`, `k` 0 … 29, nur Heimat brennbar → `fireTile(fireRect(w), roll.tile)`
    = `FIRE_PINS` mit `island 0`; Heimat + Plantage/Holzfäller auf 2 brennbar → Gesamtrechteck Höhe = Summe, Breite =
    max; es gibt ein `k` mit Ziel auf 2; Ziehungszahl je Periode genau 2 bei Brand (Spion auf dem RNG-Ergebnis von
    `rollCrisis`: Zähler in einem Wrapper um `createRng` per `vi.mock`, eigene Datei falls nötig); Treffer rechts
    ausserhalb des schmaleren Teils → `null`; `crisis.tile.island` nach `beginCrisis` gesetzt.
  - `storm.test.ts`/`fire.test.ts` **AK-E2-08**: Sturm halbiert Produktion eines `stormAffected`-Betriebs auf 2;
    angebundene Feuerwache auf 2 schützt Kapelle auf 0 an gleichen Koordinaten nicht.
- [ ] **2 Rot-Beleg** → Commit `test: M12 E2 Wirtschaft und Krisen je Insel (rot)`.
- [ ] **3 Umsetzung**; Standardwerte `island = HOME` halten UI-Aufrufer lauffähig (keine UI-Änderung).
- [ ] **4 Prüfen:** Bitgleich — `OFF_FINGERPRINT`, „normal"/„mild" 7850, AK-E0-19, `balance-merchants
[6750, 11200, 320]`, `balance.test.ts` Diff leer; `make check`, `CI=true make check` → Commit
      `feat: M12 E2 Handel, Aufträge, Bilanz und Brand je Insel`.

**Review-Fokus:** genau zwei Brand-Ziehungen; Rückrechnung inklusive Fehlschlag; Budget je Insel einmal je Takt (keine
Mehrkosten mit einer Insel); Heimat-Texte unverändert; D-142 nach Ruling umgesetzt.
