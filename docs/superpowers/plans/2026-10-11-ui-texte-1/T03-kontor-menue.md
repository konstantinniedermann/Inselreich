# T03 — Kontor-Kopf und Menü «Speichern» (AK-UT-09, -10)

Dateien: `src/ui/trade.ts` (nur Kopf `:102–107`), `src/ui/menu.ts` (`:67–128`), `src/style.css` (nur `.trade-head`), `tests/ui/trade.test.ts`, `tests/ui/menu.test.ts`. `trade.ts` ist von I-049-UI/I-048-UI berührt: Basis ist `main` nach deren Merge, Änderung nur am Kopf.

## Tests zuerst (Rot-Beleg)

- [ ] AK-UT-09 `trade.test.ts`: Kopfzelle «Kaufen» hat den Titel als eigenen Textknoten und `small[data-field="buy-note"]` als Kind; `textContent` der Kopfzelle ohne Edikt enthält nur «Kaufen»; mit Edikt Handel `textContent` ergibt nicht «KaufenEdikt…» (Titel in eigenem `span`, `small` danach, Text «Edikt Handel: −20 %»). Edikt 0 %: `small.hidden === true`. CSS-Text enthält `.trade-head small` mit `display: block` (Quelltext von `style.css` per `readFileSync`).
- [ ] AK-UT-10 `menu.test.ts`: Reihenfolge der Kinder der Karte: Titel, Überschrift «Speichern», Speichern-Knopf, Überschrift «Laden», Liste; Überschrift «Laden» bleibt.
- [ ] `npx vitest run tests/ui/trade.test.ts tests/ui/menu.test.ts; echo EXIT=$?` → `EXIT=1`, Beleg.

## Umsetzung

- [ ] `trade.ts`: Titel in `span`, `small` bleibt nach dem Titel (Zeile ~105), kein Layoutumbau; `style.css`: `.trade-head small { display: block; }` (Gross-/Kleinschreibung: `text-transform: none` für `small`, damit «Edikt Handel» lesbar bleibt).
- [ ] `menu.ts`: `h('Speichern')` vor `save`-Knopf (Zeile 68), analog zu `h('Laden')` (Zeile 126).
- [ ] Grün, `EXIT=0`, `npx tsc --noEmit; echo EXIT=$?`; Commit `feat: Kontor-Kopf getrennt, Menü-Überschrift Speichern (AK-UT-09/10)`.
