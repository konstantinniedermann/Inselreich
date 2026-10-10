# T04 · Lager-Chip als Knopf, Tooltip-Zeile

Strang ui · Umsetzer `tech-ui-engineer` · AK-GC-10, Bau für AK-GC-14 · blocked-by T03 · Grösse M (≈ 25 Tools)

**Dateien (exklusiv):** `src/ui/hud.ts`, `src/style.css`, `tests/ui/hud.test.ts`; Ausnahme `src/ui/app.ts` nur für zwei Platzhalter-Felder in `actions`. Lesen: `ak.md`, `src/ui/goodFocus.ts` (`focusList`), `src/sim/defs/tiers.ts` (`needs`), `src/sim/population.ts` (Stufen-Zähler).

## Schritt 0: Zeilenstände nach M13-E1-Merge prüfen (Pflicht)

M13-E1-UI (T10, T11, T12) ändert `src/style.css`; T11 berührt Steuer-Tooltips in `taxView.ts`/`trade.ts`; `hud.ts` liegt nicht im Ownership von M13-E1-UI, `chipView`/`stockTooltip` könnten dennoch berührt sein.

```bash
git log --oneline 1b723334..HEAD -- src/ui/hud.ts src/style.css tests/ui/hud.test.ts
grep -n "stockTooltip\|data-field\|createElement('span')\|export interface HudActions\|export function chipRole" src/ui/hud.ts src/ui/texts.ts; echo EXIT=$?
grep -n "^\.chip\|\.stock-row" src/style.css
```

Auf `1b723334`: Chip-Erzeugung `hud.ts:226–232` (`span.chip`), `setChip` Z. 128 (setzt `role` per `chipRole`), `stockTooltip` Z. 563 (Aufruf Z. 302), `HudActions` Z. 146, `.chip` in `style.css:293` und `:1017`.

## Schritte

- [ ] **Schritt 1: Roter Test (`tests/ui/hud.test.ts`, AK-GC-10).** `stockTooltip(world, good, island)` liefert `<bestehende Zeile>\n<zweite Zeile>`; die bestehende Erwartung `AK-UX-07 stockTooltip …` (≈ Z. 55) wird um die zweite Zeile ergänzt (einzige erlaubte Änderung an einem bestehenden Test). Vier Varianten, Welten aus `tests/ui/worlds.ts`:
  1. Erzeuger und Verbraucher: „Klick: 3 Erzeuger und 1 Verbraucher zeigen“ (Zahlen aus `focusList` nach `role`).
  2. Nur Erzeuger: „Klick: 2 Erzeuger zeigen“.
  3. Kein Erzeuger: „Noch kein Erzeuger“ (auch wenn Verbraucher existieren).
  4. Hauszusatz ` · 34 Häuser verbrauchen Nahrung`, wenn Häuser einer Stufe mit `TIERS[tier].needs[good]` auf der Insel stehen (Zahl = solche Häuser); Einzahl „1 Haus verbraucht {Gut}“; kein Zusatz ohne solche Häuser.
     Dazu Einzahl-Kombinationen „1 Erzeuger und 1 Verbraucher“. Der Hausverbrauch wird in einer kleinen exportierten, getesteten Funktion `houseConsumers(world, island, good): number` gezählt. Lauf `npx vitest run tests/ui/hud.test.ts; echo EXIT=$?` → **rot**.
- [ ] **Schritt 2: `stockTooltip` erweitern.** Zeile 2 aus `focusList(world, island, good)` (Zählung nach `role`) plus Hauszusatz. Nur berechnen, wenn der Chip nicht `hidden` ist (die Aufrufstelle in `updateHud` kennt `hide`).
- [ ] **Schritt 3: Chip als Knopf.** Bei der Erzeugung in `updateHud` `document.createElement('button')` mit `type="button"`, `className = 'chip'`, `dataset.good`, `dataset.field`. `chipRole('BUTTON')` liefert bereits `null` (Test ≈ Z. 196 bleibt grün); `aria-label` setzt weiter `setChip`. `aria-pressed` je Update aus `actions.focusedGood()` (nur bei Änderung schreiben). Klick-Handler: `actions.toggleGoodFocus(good)`; bei Mausklick (`event.detail > 0`) danach `chip.blur()`, damit die Leertaste (Halten = Schwenken) den Chip nicht erneut auslöst; Tastatur-Aktivierung (`detail === 0`) behält den Fokus. Verborgene Chips (`hidden`) sind weder klickbar noch per Tab erreichbar (`hidden` genügt).
      `HudActions` ergänzen: `toggleGoodFocus(good: GoodId): void`, `focusedGood(): GoodId | null`. Fakes in Tests um die zwei Felder ergänzen (nur Typ-Erfüllung). In `app.ts` Platzhalter `toggleGoodFocus: () => {}`, `focusedGood: () => null`; T06 ersetzt sie.
- [ ] **Schritt 4: CSS.** `button.chip` ohne Browser-Standardrahmen (`background`, `border`, `font: inherit`, `color: inherit`, Padding wie `.chip`), `cursor: pointer`; `.chip[aria-pressed="true"]` sichtbar abgesetzt (Rahmen in der Fokus-Signalfarbe `#00c8ff` (derselbe Wert wie `PALETTE.signalFocus` in T05), **kein** Pulsieren); `.chip:focus-visible` mit sichtbarem Ring (2 px, Kontrast zur Leiste). Einwohner-, Geld-, Bilanz-Chips bleiben `span` mit `role="img"`. Nur Desktop.
- [ ] **Schritt 5: Prüfen.** `npx vitest run tests/ui/hud.test.ts tests/ui/goodFocus.test.ts; echo EXIT=$?`, `npx tsc --noEmit; echo EXIT=$?`, `make lint; echo EXIT=$?` → 0.
- [ ] **Schritt 6: Commit** `feat: Lager-Chip als Knopf, Tooltip nennt Erzeuger und Verbraucher (I-043)`.

## Nicht in dieser Task

Wirkung des Klicks (T06), Render.
