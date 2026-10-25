# T01 · Fernauftrag: `farOrderParts`, Auftragskarte mit Lager-Span, `resumeCard` (Befund 1, 2)

Umsetzer `tech-ui-engineer` · ≈ 40 Tools · AK BF1 bis BF5 · blocked-by: – · Spec: Regeln 1 bis 3, 9

## Dateien

- ändern: `src/ui/farOrder.ts`, `src/ui/order.ts`, `src/ui/resumeCard.ts`, `src/style.css` (ein Selektor), `tests/ui/farOrder.test.ts`, `tests/ui/order.test.ts`, `tests/ui/resumeCard.test.ts`
- nicht ändern: `src/sim/`, `src/ui/hud.ts`, `farLate`-Logik

## Verhalten

1. `farOrderParts(world, o, lanes?)` → `{ lead, stock, short, late }` laut Spec Regel 1; Muster `farOfferParts`/`farOfferLead`. `farOrderText` = `lead + stock + (late ? ' · zu spät' : '')`.
2. `order.ts` (`orderCardText`, ≈ Z. 127): bei Fernauftrag Lead-Text plus Span `data-field="order-stock"` (Klasse `far-stock--low` bei `short`, `title` «Fehlt <n> <Gut>» bei `short`, sonst keiner), «· zu spät» als Anhang dahinter ohne eigene Farbe. Heimatauftrag und Stammkunde bleiben Klartext; beim Wechsel keine alten Spans (Knoten leeren).
3. `style.css:969`: Selektor um `.notice-stack .order-card .far-stock--low` erweitern.
4. `resumeCard.ts:44-48`: Anhang und lokale `farLate`-Berechnung entfernen; Text bleibt gleich.
5. Randfälle laut Regel 9 (kein Kontor, `rest <= 0`, kein Seeweg).

## Testfälle (rot zuerst)

- **BF1** Lager 7/15 short, 15 und 20 nicht; `lead + stock` gleich bisherigem Text (`farOrder.test.ts:65`).
- **BF2** ohne `late` byte-gleich; mit `late` endet auf «· zu spät»; rechtzeitige Fracht ohne.
- **BF3** `order-stock` mit Klasse und `title` «Fehlt 8 Rum», nach Auffüllen ohne beides; `textContent` = `farOrderText`; Heimatauftrag/Stammkunde ohne `order-stock`.
- **BF4** Fern- zu Heimatauftrag im selben Knoten ohne Rest-Span.
- **BF5** `resumeCard`: «zu spät» genau einmal.

## Prüfschritte

Gezielte Tests, `tsc`, eslint/prettier laut index.md. Keine Fix-Runde ohne Rotbeleg.
