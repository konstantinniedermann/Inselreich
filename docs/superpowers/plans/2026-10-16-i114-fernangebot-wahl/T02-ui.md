# T02 · UI: zwei Fernkarten mit Wahl

`tech-ui-engineer` · ≈ 40 Tools · AK-10 · blocked-by: T01 · Test zuerst

Dateien: `src/ui/farOrder.ts`, `src/ui/order.ts` (nur `acceptFar(pick?: 0 | 1): void`), `src/ui/hud.ts` (Kartenstapel `renderNoticeStack`/`updateNoticeStack`), `src/ui/app.ts` (`acceptFar`-Handler, ≈ Z. 397), `src/style.css` (nur `.far-card`-Regeln, ≈ Z. 947ff.), `tests/ui/farOrder.test.ts`, `tests/ui/farChoice.test.ts` (neu). Zeilen aus dem Ledger von T00.

## Umsetzung

1. `farOrder.ts`: Hilfe `farOfferOf(world, which: 0 | 1): FarOffer | null` (`0` → `world.farOffer`, `1` → `farAlternative(world)`); `farOfferText(world, which = 0)` und `farAcceptTooltip(world, which = 0)` lesen daraus (Text bitgleich für `which = 0`, Format `farOfferText` für beide Karten). Die Frist `farOfferDue` ist für beide gleich.
2. `hud.ts`: zweite Karte `far-card-2` (`data-field="far-card-2"`, `far-text-2`, `far-accept-2`) neben der ersten, gleiche Struktur über kleinen lokalen Helfer (DRY, keine Kopie des Blocks); Knopf 2 ruft `actions.acceptFar(1)`, Knopf 1 `actions.acceptFar(0)`. `updateNoticeStack`: Karte 2 verborgen, wenn `farOfferText(world, 1) === null` oder Auftrag nicht sichtbar (`orderVisible`); Text und Tooltip je Karte per `setField`/`title` nur bei Änderung.
3. `app.ts`: `acceptFar: (pick = 0) => { const r = acceptFarOrder(world, pick); … }`, übrige Zeilen (Snapshots, `refresh()`) unverändert.
4. `style.css`: gleiche Regeln für beide Karten (Selektor `.far-card` trägt beide); nur wenn der Browser-Check (T03) Platzmangel zeigt, kompakte zweite Karte (P-3).

## Tests

`farChoice.test.ts` (AK-10): zwei Kontore → beide Texte vorhanden, Format wie `farOfferText`, Tooltip nennt die jeweilige Insel; ein Kontor → `farOfferText(world, 1) === null`; Text `which = 0` bitgleich zum Bestand; `updateNoticeStack` (falls mit jsdom im Bestand testbar, sonst reine Textfunktionen, wie Spec AK-10). `farOrder.test.ts` bleibt unverändert grün.

## Prüfschritte

`npx vitest run tests/ui; echo EXIT=$?` · `make check; echo EXIT=$?`. Commit `feat: zwei Fernkarten zur Wahl (I-114)`.
