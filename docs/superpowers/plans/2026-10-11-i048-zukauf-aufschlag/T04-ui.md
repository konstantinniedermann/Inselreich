# T04 — UI A: Helfer, Feld «Kauf … %», «Verkauf … %», `tradeReasonCtx`

**Persona:** `tech-ui-engineer` (sonnet) · Worktree `.worktrees/i048-ui`, Branch `feat/i048-ui`. Der Controller legt ihn nach dem T02-Review mit Urteil OK an: `git worktree add .worktrees/i048-ui -b feat/i048-ui feat/i048`. **Läuft parallel zu T03.** Desktop-first ab 1280 px, Card-UI, CSS Grid.

**Spec-Abschnitte:** §7 (7.1, 7.2), §9.3 AK-ZK-19, -21, -32. In Schritt A gilt `BUY_RISE` 0; die Texte bleiben dadurch bei Anteil 100 wortgleich zu heute.

**AK:** AK-ZK-19 (`buyPctText`), AK-ZK-21 (wortgleich bei `rise` 0, über den reinen Kern, ohne Mock), AK-ZK-32 (`sellPctText`, kein «Preis … %» mehr). AK-ZK-20 und -22 prüfen B-Werte (436, 516) und liegen in T06. Die Helfer dafür baut aber **dieser** Task.

**Dateien:** `src/ui/trade.ts`, `src/ui/app.ts` (nur `tradeCtx`, ≈ Z. 910), `src/style.css` (nur `.trade-*`), `tests/ui/trade.test.ts`. Keine Datei in `src/sim/`.

## Schritte

- [ ] **Test zuerst** in `tests/ui/trade.test.ts` (neuer `describe('I-048 Kaufanteil')`; die bestehenden Tests bleiben unverändert):
  - AK-ZK-19: `buyPctText(w, 'tools')` bei `w.buyPct.tools` 109 → `'Kauf 109 %'`, bei 100 → `'Kauf 100 %'`.
  - AK-ZK-32: `sellPctText(w, 'wood')` bei `sellPct.wood` 80 → `'Verkauf 80 %'`, bei 100 → `'Verkauf 100 %'`. Grep-Test: `readFileSync('src/ui/trade.ts', 'utf8')` enthält nicht `` `Preis ${`` (Muster für Datei-Lesen: `tests/ui/imports.test.ts`).
  - AK-ZK-21: Für alle `GOOD_IDS`, n ∈ {1, 10} und `edictPct` ∈ {100, 80} gilt `buyTitleText(GOODS[g].name, n, buyQuote(GOODS[g].buy, 100, n, 0, BUY_CAP, edictPct))` = `` `${n} ${name} kaufen für ${p} Geld` ``. Dabei ist `p` = `n × buy` bzw. `floor((n × buy × 80 + 99) / 100)`, ohne « · im Mittel». Bei n 1 entspricht der Stückpreis-Text `` `${p} Geld` `` dem heutigen `buyUnitText`.
  - Zusatz (kein AK, reine Formatierung): `buyTitleText('Werkzeug', 10, { price: 436, meanPct: 109, endPct: 120 })` → `'10 Werkzeug kaufen für 436 Geld · im Mittel 109 %'`. Mit `meanPct` 100 entfällt der Zusatz.
  - Zusatz (kein AK, Grundlage für AK-ZK-22 in T06): `tradeReasonCtx(w, 'buy', 'tools', 10, HOME).cost.money` = `buyPrice(w, 'tools', 10)` bei Anteil 120. Verglichen wird gegen `buyPrice`, nicht gegen eine Zahl; der Test bleibt deshalb in B grün. `tradeReasonCtx(w, 'sell', 'wood', 5, HOME)` → `{ good: 'wood', amount: 5, island: HOME }`.
  - Lauf: `npx vitest run tests/ui/trade.test.ts; echo EXIT=$?` → **rot**.
- [ ] **Umsetzung** `src/ui/trade.ts`:
  - `buyPctText(w, g)` → `` `Kauf ${w.buyPct[g]} %` `` und `sellPctText(w, g)` → `` `Verkauf ${w.sellPct[g]} %` ``.
  - `buyTitleText(name, n, quote: { price: number; meanPct: number })`: Grundtext `` `${n} ${name} kaufen für ${quote.price} Geld` ``; ist `meanPct > 100`, folgt `` ` · im Mittel ${quote.meanPct} %` ``.
  - `buyTitle(w, g, n)` = `buyTitleText(GOODS[g].name, n, buyQuoteFor(w, g, n))`. `buyQuoteFor` kommt aus `src/sim/trade.ts` (T02) und ist die einzige Stelle, die Anteil, `BUY_RISE`, `BUY_CAP` und Edikt-Faktor zusammenführt. Nicht nachbauen.
  - `buyUnitText` bleibt `` `${buyPrice(w, g, 1)} Geld` `` und enthält damit den Aufschlag.
  - `tradeReasonCtx(world, op, good, n, island): ReasonCtx` mit dem Rumpf des heutigen `tradeCtx` aus `app.ts`. In `app.ts` ruft `tradeCtx` nur noch `tradeReasonCtx(world, …)` (eine Zeile).
  - `renderTrade`: In der Gut-Zeile kommt ein neues `<small data-field="buy-pct-${good}">` zwischen `stock-…` und `price-…`. `updateTrade` setzt `buy-pct-${good}` über `buyPctText` und `price-${good}` über `sellPctText`. Der Feldname `price-…` bleibt; sonst brechen Tests und Browser-Skripte.
  - CSS nur bei Bedarf. Die Gut-Zeile bricht schon um (`flex-wrap`). Ziel: kein waagrechtes Scrollen bei 1280 × 720 mit allen 10 Gütern.
- [ ] **Grün:** `npx vitest run tests/ui/trade.test.ts tests/ui/edictView.test.ts tests/ui/hints.test.ts; echo EXIT=$?` → 0. Die bestehenden Erwartungen (80/64 Geld) bleiben in A grün. In T06 werden sie Klasse S.
- [ ] `npx eslint src/ui tests/ui && npx prettier --check src/ui src/style.css tests/ui; echo EXIT=$?`.
- [ ] **Sichtprüfung lokal (kurz, kein Ersatz für T07):** `make dev`, Handelsdialog öffnen, Screenshot 1280 × 720 nach `.studio/qa/i048/t04-1280x720.png`. Der Pfad kommt in den Bericht.

**Commits:** `test: I-048 Handelsdialog-Helfer (rot)` · `feat: Handelsdialog zeigt Kauf- und Verkaufsanteil, Knopftitel mit Mittel (I-048)`.

**Review-Fokus:** Alle Texte kommen aus reinen Helfern; kein Text «Preis … %» bleibt übrig. `buyTitle` und `buyPrice` liefern denselben Preis, weil sie denselben Kern mit denselben Parametern rufen. `app.ts` hat nur den einen delegierenden Hunk. Kein `src/sim/` berührt.
