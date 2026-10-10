# T10 · Amtsstuben-Panel, Abschnitt «Edikt» (Card-UI, desktop-first)

Strang ui · Worktree `.worktrees/m13-e1-ui` · Umsetzer `tech-ui-engineer` (sonnet, Fortsetzung) · Spec §7.2 U-1…U-6; Browser-AK AK-M13E1-34, 35, 36, 37, 39, 40 (Beleg in T14) · blocked-by T09, T04 · Grösse M (≈ 35 Tools)

**Vorbereitung (Controller C):** `git merge --no-ff feat/m13-e1-sim` (Stand T04: `buyPrice(world, …)`, mechanische Zeilen in `app.ts`/`trade.ts`). Danach gehört `src/ui/` allein diesem Strang.

**Files:**

- Create: `src/ui/edictSection.ts` (DOM: Abschnitt bauen und nachführen)
- Modify: `src/ui/inspect.ts` (`InspectActions.setEdict(id: EdictId | null)`; `renderTownhall` hängt den Abschnitt nach `tax-effect` und vor `lock-matrix` ein; `updateTownhall` ruft die Nachführung), `src/ui/app.ts` (Aktion `setEdict` im `setPanel`-Block neben `setUpgradeStop`, neue Importzeile), `src/style.css` (Karten), `src/ui/edictView.ts` (+ `edictSuccessText`), `tests/ui/edictView.test.ts`
- Lesen: `src/ui/inspect.ts` Z. 579–720 (Steuer-Raster als Muster für stabile Knoten), `src/ui/dom.ts` (`setField`), `src/ui/messages.ts` (`showMessage`), `src/ui/hints.ts` (`friendlyReason`, `ReasonCtx.cost`), Spec §7.2

## Verhalten

- **U-1** Abschnitt `data-field="edict"`: Überschrift `h3` «Edikt», Statuszeile `data-field="edict-status"` (`edictStatusLine`, vor der Freischaltung «Erst nach dem Bürger-Ziel», U-4), Sperrzeile `data-field="edict-lock"` (`edictLockText`, `hidden` bei `''`).
- **U-2** Grid mit **einer Spalte**, drei Karten in `EDICT_IDS`-Folge; je Karte `data-edict="<id>"`: Name (`EDICTS[id].name`), Wirkung (`edictEffectText`), «lohnt, wenn …» klein (`edictWhenText`), Knopf `data-edict-btn="<id>"` mit `buttonText`. Aktive Karte: Klasse `active` und `aria-pressed="true"` am Knopf.
- **U-3** Klick: aktiv → `actions.setEdict(null)`, sonst `actions.setEdict(id)`. In `app.ts`: `const r = setEdict(world, id)`; Erfolg → `showMessage(edictSuccessText(world, id))`, Klang wie Fest (`sound.play('build')`); Fehler → `showError(friendlyReason(world, r.reason, { cost: { money: EDICT_COST, wood: 0, tools: 0, stone: 0 } }))`; danach `refresh()`.
- **U-4** Vor der Freischaltung: alle Karten sichtbar, `disabled`, Klasse `locked` (blass); Klick ohne Wirkung.
- **U-5** Knoten werden **einmal** in `renderTownhall` gebaut; `updateTownhall` setzt nur Text, Klassen, `hidden`, `disabled`, `title` (Vergleich vor dem Schreiben wie beim Steuer-Raster, Fokus bleibt). «Zu wenig Geld»: Knopf bleibt klickbar, Klasse `unaffordable` (wie Bauleiste), `title` = `friendlyReason`-Text; andere Gründe: `disabled`, `title` = Grund.
- **U-6** Gründe kommen über `friendlyReason` (T09).
- **CSS:** `.edict-cards { display: grid; grid-template-columns: 1fr; gap: … }`, Karte im Card-Stil der Panel-Spalte (280 px), `.edict-card.active` hervorgehoben, `.edict-card.locked` blass; kein waagrechtes Scrollen (AK-34), `min-width: 0` und Umbruch für lange Wirkungstexte; Farben aus vorhandenen Variablen.

```ts
// src/ui/edictView.ts (Ergänzung)
/** Erfolgsmeldung nach setEdict (U-3): erlassen oder aufgehoben, mit Restzeit der neuen Sperre. */
export function edictSuccessText(w: World, id: EdictId | null): string;
// «Edikt ‹Sparen› erlassen — wieder änderbar in 5:00» · «Edikt aufgehoben — wieder änderbar in 5:00»
```

## Schritte

- [ ] **Schritt 1: Test zuerst (rot).** In `tests/ui/edictView.test.ts`: `edictSuccessText` nach `setEdict(w, 'saving')` → «Edikt ‹Sparen› erlassen — wieder änderbar in 5:00»; nach Aufheben (nach Sperrende) → «Edikt aufgehoben — wieder änderbar in 5:00». Spitze Klammern U+2039/U+203A wie in der Spec.

```bash
npx vitest run tests/ui/edictView.test.ts; echo EXIT=$?   # rot: edictSuccessText fehlt
```

- [ ] **Schritt 2: Umsetzen** (Helfer, `edictSection.ts`, Einhängen, Aktion, CSS). `tests/ui/` hat kein DOM: das Panel belegt T14 im Browser; hier nur reine Teile testen.

```bash
npx vitest run tests/ui/edictView.test.ts tests/ui/inspect.test.ts tests/ui/imports.test.ts tests/ui/hints.test.ts; echo EXIT=$?
npx tsc --noEmit; echo EXIT=$?
make lint; echo EXIT=$?
```

- [ ] **Schritt 3: Build-Probe.** `make build; echo EXIT=$?` (Typen und Bundle); der Browser-Beleg folgt gesammelt in T14 (Entscheid E6).
- [ ] **Schritt 4: Commit.** `feat: Edikt-Abschnitt im Amtsstuben-Panel (M13-E1 T10)`.

## Bericht

Rot-Zeile, Exit-Codes, Zeilenzahl `edictSection.ts`, Hunks in `app.ts` und `inspect.ts` (Zeilenbereiche); offene Darstellungsfragen als Hinweis für T14.
