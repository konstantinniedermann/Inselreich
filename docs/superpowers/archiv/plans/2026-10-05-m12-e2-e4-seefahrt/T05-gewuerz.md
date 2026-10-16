> **Task-ID:** T05 · **AK-IDs:** AK-E3-01 (`TIERS[4]`), AK-E3-02 (Produktion), AK-E3-03, AK-E3-04, AK-E3-05
> (vorläufiger Pin), AK-M12-B3; Pin-Liste Anhang 03 D (E3-Teil); lead-qa Teil B (`taxUnits`, M8:AK-B1-02/-04)
> **blocked-by:** T02, **T04 (Review OK, per Merge `feat/m12-see-e2` → `feat/m12-see-e3`)** ·
> **Strang:** e3, `feat/m12-see-e3`, Worktree `.worktrees/m12-see-e3` · `tech-sim-engineer` (sonnet)
> **Regeln:** Spec §7, Anhang 03 D; Anhang 05 J.1, J.2; Index P-8, R-2

## T05: Gewürz und Kaufleute — bewusster Bruch `balance-merchants`, vorläufiger Neupin

**Ziel:** Kaufleute brauchen 0,1 Gewürz je Einwohner und zahlen Steuer 22; die Plantage liefert ins Insellager. Der
Test-Controller kauft Gewürz (`feedSpice`) und erreicht das zweite Ziel weiter unter 12 000 Ticks.

**Code-Fakten:** `defs/tiers.ts` `TIERS[4]` (`needs`, `tax` 20); `population.ts` Verbrauch über `needs` (generisch);
`tax.ts` `taxUnits`; `orders.ts` `orderPool(maxTier)`; `tests/sim/merchantsController.ts` `feedGlassworks`
(Muster), `runMerchants`, `MERCHANT_TICK_LIMIT`; `balance-merchants.test.ts` AK-BAS-02, AK-E0-18 `[6750, 11200, 320]`;
`seePins.ts` `ORDER_PINS`; `seaHelpers.ts` `seaWorld`, `foundKontor2Literal`, `plantationSites`.

**Dateien:** `src/sim/defs/tiers.ts` (nur `TIERS[4]`); `tests/sim/merchantsController.ts` (`feedSpice`), neu
`tests/sim/spice.test.ts`; `defs.test.ts` (Zeile `TIERS[4]`), `merchants.test.ts`, `taxes.test.ts`, `orders.test.ts`
(AK-E3-04), `scenario-saves.test.ts`, `balance-merchants.test.ts`, `flow.test.ts` (nur D-142-Wirkung).

## Schritte

- [ ] **0 Basis:** `git merge feat/m12-see` (T02), dann `git merge feat/m12-see-e2` am SHA „T04 OK"; `make check` grün.
- [ ] **1 Tests zuerst** (rot):
  - `defs.test.ts` **AK-E3-01** `TIERS[4].needs.spice === 0.1`, `TIERS[4].tax === 22` (Pin M8:AK-S1-01 bewusst,
    Kommentar „R226 F-03, Anhang 03 D").
  - `spice.test.ts` **AK-E3-02 (Produktion)**: `spicefarm` auf B an `plantationSites` (Kontor per Literal, Lager B
    Holz/Werkzeug 50, Weg angebunden) → nach 50 Schritten Lager B Gewürz +1, Heimat 0.
    **AK-E3-03**: Kaufmannshaus 20 EW in der Heimat, alles versorgt, Gewürz 10 → nach 100 Schritten −2; Gewürz 0 →
    Bedarf unerfüllt, Steuer halbiert (heutige Regel); mit allem → `taxUnits` = 22 je EW (über `taxUnits`, nicht über
    Geld-Differenz, lead-qa Teil B).
  - `orders.test.ts` **AK-E3-04**: `orderPool(t)` für `t` 0 … 4 und der Boom-Pool enthalten nie `spice`;
    `orderForPeriod` für `SEE_SEEDS` × `k` 0 … 19 = `ORDER_PINS`.
  - **Pin-Liste Anhang 03 D (E3)**, je Test neu gepinnt **oder** um Gewürz im Lager ergänzt, keiner gelöscht; je
    geänderte Zeile ein Kommentar `// R226 F-03: <Grund>`: `merchants.test.ts` M8:AK-S1-05 (Steuer 300 mit Satz 22),
    -07, -08, -10 (je Test prüfen: Gewürz ins Lager legen, wo der Test „alles versorgt" meint; Erwartungswert neu,
    wo er die Steuer misst); `scenario-saves.test.ts` M8:AK-B2-01 (Gewürz im Kaufleute-Szenario).
  - **D-142-Wirkung (R241, AK-E2-06-Zusatz, Pflicht, `flow.test.ts`):** Haus Stufe 3 voll in der Heimat, Gewürz-
    Bilanz der Heimat −8 (keine Plantage), sonst alles erfüllt → `upgradeStatus` verlangt die einfache Wartezeit
    (nicht × `UPGRADE_DEFICIT_WAIT_FACTOR`); gleiche Lage auf B (Kontor per Literal, Haus auf B) → Wartezeit ×2.
- [ ] **2 Rot-Beleg** → Commit `test: M12 E3 Gewürz und Kaufleute (rot)`.
- [ ] **3 Umsetzung:** `TIERS[4].needs.spice = 0.1`, `TIERS[4].tax = 22` — sonst kein Wert.
- [ ] **4 Controller `feedSpice`** (`merchantsController.ts`, Muster `feedGlassworks`, Testhelfer, kein Spielwert):
      vor dem ersten Aufstieg 3 → 4 kauft er am Heimatkontor 1 Gewürz (`buy(w, 'spice', 1)`); danach hält er den
      Heimatbestand ≥ `ceil(Σ Kaufleute-EW × 0,1)` (Bedarf der nächsten 100 Ticks), Kauf in einem Zug, höchstens bis 100. Er baut keine Insel, kein Kontor, kein Schiff; **kein Ausbau um das dritte Ziel** (J.1). Aufruf an derselben
      Stelle wie `feedGlassworks` (eine neue Zeile).
- [ ] **5 Vorläufiger Neupin (P-8):** `npx vitest run tests/sim/balance-merchants.test.ts` → gemessene
      `[winTick, wonMerchantsTick, minMoneyAfterWin]`. Bedingungen: `winTick === 6750`, `wonMerchantsTick ≤ 12 000`,
      `minMoneyAfterWin > 0`, M8:AK-B1-01, -02, -04 grün. **Erfüllt** → AK-BAS-02 und AK-E0-18 auf die Werte
      pinnen, Kommentar `// vorläufig T05 (R226 F-03), Bestätigung T14 (Anhang 05 J.2)`; Befehl und Werte ins Ledger.
      **Nicht erfüllt** → nicht nachstellen, keine Steuer ändern: anhalten, Meldung Controller → lead-tech → L0
      (Eskalation Stufe 1 Steuer 24 / Stufe 2 Grenze 13 000 nur per Ruling, R-2).
- [ ] **6 Prüfen:** übrige Baselines unverändert (`OFF_FINGERPRINT`, „normal"/„mild" 7850, `balance-flow`,
      `balance-upgrade`, `balance.test.ts` Diff leer); weicht eine ab → anhalten (R74). `make check`,
      `CI=true make check` → Commit `feat: M12 E3 Kaufleute brauchen Gewürz, Steuer 22, Neupin vorläufig`
      (Befehl und gemessene Werte im Commit-Text).

**Review-Fokus:** nur `TIERS[4]` geändert; jeder geänderte Pin steht in der Liste Anhang 03 D und trägt R226 F-03;
kein Test gelöscht; `feedSpice` kauft nur, baut nichts; Messung mit Befehl belegt, nichts geschätzt.
