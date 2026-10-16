# T11 · Kontor-Preise, Steuer-Tooltips, Haus-Text mit Edikt (TDD)

Strang ui · Worktree `.worktrees/m13-e1-ui` · Umsetzer `tech-ui-engineer` (sonnet, Fortsetzung) · AK-M13E1-31, 32, 33; Browser-Teil AK-M13E1-38 in T14 · Spec §7.3 U-7…U-10 · blocked-by T10, T06 · Grösse M (≈ 25 Tools)

**Vorbereitung (Controller C):** `git merge --no-ff feat/m13-e1-sim` (Stand T06: `effectiveTaxPct`, `edictTaxPoints`, `growthInterval`).

**Files:**

- Modify: `src/ui/trade.ts`, `src/ui/taxView.ts`, `src/ui/inspect.ts` (nur `upgradeOkText` und sein Aufruf Z. 539), `tests/ui/trade.test.ts`, `tests/ui/taxView.test.ts`, `tests/ui/inspect.test.ts` (Z. 184 bewusst angepasst: neue Signatur)
- Lesen: `src/sim/trade.ts` (`buyPrice`), `src/sim/edicts.ts`, `src/ui/hud.ts` (`taxButtonTitle`-Aufruf Z. 316), `src/ui/app.ts` (`tradeCtx` nutzt schon `buyPrice(world, …)`, T04)

## Schnittstelle und Regeln

```ts
// src/ui/trade.ts — reine Helfer neben sellTexts
export function buyUnitText(w: World, good: GoodId): string; // `${buyPrice(w, good, 1)} Geld`
export function buyTitle(w: World, good: GoodId, n: number): string; // `${n} ${GOODS[good].name} kaufen für ${buyPrice(w, good, n)} Geld`
export function buyHeadNote(w: World): string; // wirkendes Handel: `Edikt ${name}: −${100 − buyPct} %`, sonst ''
// src/ui/inspect.ts
export function upgradeOkText(w: World): string; // `✓ Bedingungen erfüllt — Aufstieg in höchstens ${formatGameTime(growthInterval(w))}`
```

- **U-7 Kontor:** Stückpreis-Zelle bekommt `data-field="buy-price-<good>"` und wird in `updateTrade` aus `buyUnitText` gesetzt (das Edikt kann bei offenem Panel wechseln); Kaufknopf-`title` aus `buyTitle` in `updateTrade` nachführen; Leistbarkeit nutzt `buyPrice(world, good, n)` (schon seit T04). Ort des Zusatzes (Spec [Tech]): Spaltenkopf «Kaufen» bekommt ein `<small data-field="buy-note">` mit `buyHeadNote` (`hidden` bei `''`) und denselben Text als `title`. Ohne Edikt Anzeige und Texte **wörtlich wie heute**.
- **U-8** `taxButtonTitle(w)`: bei `activeEdict(w) !== null` Zusatz ` · Edikt: ${EDICTS[e].name}`; sonst unverändert.
- **U-9** `tierTaxPerMinute` rechnet mit `effectiveTaxPct(w, tier)`; `tierTaxTooltip` bleibt beim Satz der Steuerstufe; `taxStatusLine` bekommt bei `edictTaxPoints(w) > 0` den Zusatz ` · Edikt −${n} Punkte`.
- **U-10** `upgradeOkText(world)` mit `growthInterval(world)`.

## Schritte

- [ ] **Schritt 1: Tests zuerst (rot).** Welt: `createWorld(3, { unlockAll: true })`, `won = true`, `placeTownhall(w)`, Edikt über `setEdict` (Geld vorher setzen).
  1. `AK-M13E1-31` (`tests/ui/trade.test.ts`): ohne Edikt `buyUnitText(w, 'food') === '8 Geld'`, `buyTitle(w, 'food', 10) === '10 Nahrung kaufen für 80 Geld'`, `buyHeadNote(w) === ''`; mit Handel 7 Geld, «10 Nahrung kaufen für 64 Geld», `buyHeadNote` «Edikt Handel: −20 %»; Handel erlassen, Amtsstube brennt → wieder 8 / 80 / `''`.
  2. `AK-M13E1-32` (`tests/ui/taxView.test.ts`): `taxButtonTitle` mit Sparen endet auf « · Edikt: Sparen»; ohne Edikt gleich dem heutigen Wert (vorher gemessen); `tierTaxPerMinute(w, 4)` mit 4 Kaufleute-Häusern à 20, erfüllt, «normal», Sparen → 9820 (ohne Edikt 10 560); `taxStatusLine` mit Sparen endet auf « · Edikt −7 Punkte», mit Wohlfahrt « · Edikt −5 Punkte», mit Handel ohne Zusatz.
  3. `AK-M13E1-33` (`tests/ui/inspect.test.ts`): `upgradeOkText(w)` ohne Edikt «✓ Bedingungen erfüllt — Aufstieg in höchstens 5 s»; mit Wohlfahrt «… 4 s».

```bash
npx vitest run tests/ui/trade.test.ts tests/ui/taxView.test.ts tests/ui/inspect.test.ts; echo EXIT=$?   # rot: Helfer fehlen, Werte ohne Edikt
```

- [ ] **Schritt 2: Umsetzen.**

```bash
npx vitest run tests/ui/trade.test.ts tests/ui/taxView.test.ts tests/ui/inspect.test.ts tests/ui/hud.test.ts tests/ui/hints.test.ts tests/ui/imports.test.ts; echo EXIT=$?
npx tsc --noEmit; echo EXIT=$?
make lint; echo EXIT=$?
make build; echo EXIT=$?
```

- [ ] **Schritt 3: Commit.** `feat: Kontor-Preise und Steueranzeige mit Edikt (M13-E1 T11)`.

## Bericht

Je AK Testname und Rot-Zeile, Exit-Codes, Liste der geänderten Exporte (Signatur `upgradeOkText`), `git diff --stat main...HEAD -- src/ui tests/ui`.
