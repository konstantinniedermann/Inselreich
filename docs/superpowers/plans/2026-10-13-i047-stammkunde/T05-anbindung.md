# T05 — Anbindung: Knöpfe, Aktionen, Meldungen, Warnfarbe, Dev-Sonde, README (AK-SK-28, Vorbereitung AK-SK-29)

Paket I047-UI. Persona `tech-ui-engineer`, Fortsetzung nach T04. Schätzung ≈ 20 Tools. Dateien: `src/ui/order.ts`
(DOM-Teil `renderOrder`/`updateOrder`), `src/ui/hud.ts` (nur `renderNoticeStack`), `src/ui/app.ts` (Aktionen,
Step-Schleife, Dev-Sonde), `src/ui/devProbes.ts` (ein Feld), `src/style.css` (nur `.order-card`-Regeln),
`tests/ui/order.test.ts`, `README.md` Abschnitt «Handelsaufträge» (D1, E-017).

## Kontext (nur das)

- `order.ts`: `OrderActions { deliver(): void }`, `renderOrder` (Text + Knopf `order-deliver`), `updateOrder`
  (Sichtbarkeit, `unaffordable`).
- `hud.ts` ab Z. ~480: `renderNoticeStack(gameEl, world, deliver)` baut `.order-card` und Krisenkarte;
  `updateNoticeStack(stack, world, island)`.
- `app.ts`: Z. ~343 `showError`, Z. ~355 `renderNoticeStack(gameEl, world, () => actions.deliverOrder())`, Z. ~550
  `actions.deliverOrder` (Muster für Fehler, Meldung, `refresh()`), Z. ~1391 Step-Schleife (`reports`,
  `lossMessages`), Z. ~1341 `exposeDevProbe({...})`. Zeilennummern nach dem Merge von UI-HAEPPCHEN-A per Symbol-Suche.
- `devProbes.ts`: `interface DevProbe`, nur Dev-Build (`import.meta.env.DEV`).
- `style.css` Z. ~909 `.notice-stack .order-card`, Tokens `--warn-parchment`, `--warn-amber`.

## Tests zuerst (Rot-Beleg)

`tests/ui/order.test.ts` mit `tests/ui/fakeDom.ts` (wie andere DOM-Tests):

- [ ] `renderOrder` + `updateOrder`: Zustand Angebot → Knöpfe `order-accept` («Annehmen») und `order-decline`
      («Ablehnen») sichtbar, `order-deliver`/`order-cancel` verborgen; Vertrag → nur `order-cancel` («Kündigen»);
      Auftrag → nur `order-deliver`; nichts → keiner. Klick ruft die passende Aktion (Spy).
- [ ] Warnzustand: `contractWarn` wahr → Karte hat Klasse `order-card--warn`; sonst nicht.
- [ ] `npx vitest run tests/ui/order.test.ts; echo EXIT=$?` → `EXIT=1`, Beleg.

## Umsetzung

- [ ] `order.ts`: `OrderActions` um `accept()`, `decline()`, `cancel()`; `renderOrder` legt die drei Knöpfe (Klasse
      `btn`, `data-field`, `blur()` wie «Liefern») an; `updateOrder` setzt `hidden` je Zustand und toggelt
      `order-card--warn` über `contractWarn`. Bestehendes Verhalten «Liefern» unverändert.
- [ ] `hud.ts`: `renderNoticeStack(gameEl, world, actions: OrderActions)` reicht `actions` an `renderOrder` durch
      (einziger Aufrufer `app.ts`).
- [ ] `app.ts`:
  - `actions.acceptContract`: `r = acceptContract(world)`; Fehler → `showError(r.reason)`; ok →
    `showMessage(contractAgreedMessage(world))`; `refresh()`.
  - `actions.declineContract`: Fehler → `showError`; ok → still; `refresh()`.
  - `actions.cancelContract`: Fehler → `showError`; ok → `showMessage(CONTRACT_CANCELLED)`; `refresh()`.
  - `renderNoticeStack(gameEl, world, { deliver: () => actions.deliverOrder(), accept: () =>
actions.acceptContract(), decline: …, cancel: … })`.
  - Step-Schleife direkt nach `lossMessages`: `announceContract(reports, { show: (t, k) => showMessage(t, k), play:
(e) => { recordContractSound(e); sound.play(e); } }, world)`; `recordContractSound` hält höchstens 20 Einträge
    (Ringpuffer in der `launch`-Closure).
  - `exposeDevProbe({ …, contractSounds: () => [...contractSoundLog] })`.
  - Hinweis: Nach einem Bruch erscheint im selben Tick der Zufallsauftrag; die bestehende Meldung «Neuer Auftrag …»
    aus `orderMessageFor` bleibt so (gewollt, R7). Eine Lieferung des Vertrags lässt `order` `null`, also keine
    Auftragsmeldung.
- [ ] `devProbes.ts`: `DevProbe.contractSounds(): string[]` mit JSDoc «Kopie der letzten Vertragsklänge (I-047,
      Klang-Spy AK-SK-29)». Kein Import aus `src/audio/` nötig.
- [ ] `style.css`: `.notice-stack .order-card.order-card--warn { border-left-color: var(--warn-amber); background:
var(--warn-parchment); }`; Knöpfe passen in die 300-px-Karte (Umbruch über bestehendes `flex-wrap`).
- [ ] `README.md` «Handelsaufträge» (Z. ~397): Unterabschnitt «Stammkunde»: Angebot nach einer Lieferung ab Stufe 3
      (bis zum nächsten Auftragstakt), Annehmen/Ablehnen, feste Menge und Stückpreis je Gut (Tabelle aus Spec B.3/W.1:
      Menge, Preis, Wert je Lieferung), Abbuchung von der Lieferinsel alle 1:30, kein Zufallsauftrag solange er läuft,
      Kündigen kostenlos, Bruch bei Ware/Kontor fehlt mit Strafe in Höhe einer Lieferung; Werte aus den Defs
      abgeschrieben (W.1), keine eigene Rechnung.
- [ ] Grün: `npx vitest run tests/ui/order.test.ts tests/ui/hud.test.ts tests/ui/time.test.ts tests/ui/ships.test.ts;
echo EXIT=$?` → `EXIT=0`; `npx tsc --noEmit; echo EXIT=$?` → `EXIT=0`. Der Controller fährt danach `make lint`
      und `make docs-check`.
- [ ] Commit `feat: Stammkunde in der Auftragskarte (Annehmen, Ablehnen, Kündigen, Meldungen)` und `docs: README
Stammkunde`.
