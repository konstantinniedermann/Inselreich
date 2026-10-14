# T08 · Fernkarte, Verdrahtung, Spieler-Doku

Plan: [Index](../2026-10-14-handel-2.md) · AK-H2-30 (Browser, R633 A5), U1–U6 · Review Focus 2, 3, 5 · Modell sonnet · ≈ 60 Tools

**Files:**

- Modify: `src/ui/hud.ts` (`renderNoticeStack`, `updateNoticeStack`), `src/ui/order.ts` (`OrderActions.acceptFar`,
  `updateOrder`: Ziel-Insel, Warnzustand), `src/ui/app.ts` (Handler, Log, Meldungen, Klang), `src/style.css` (`.far-card`)
- Modify: `tests/ui/hud.test.ts` (Stapel mit `tests/ui/fakeDom.ts`), `README.md`, `docs/spielwerte.md` (D1, E-017 erlaubt)

**Interfaces:**

- Consumes (T07): `farOfferText`, `farAcceptTooltip`, `farOrderWarn`, `farAcceptedMessage`, `farDeliveredEntry`,
  `deliverTarget`, `farSnap`, `farLogEntries`; Sim: `acceptFarOrder`, `deliverOrder`.
- Produces: DOM-Felder für den Playtest: Karte `[data-field="far-card"]`, Text `far-text`, Knopf `far-accept`.

## Schritte

- [ ] **Step 1: Failing test** — `tests/ui/hud.test.ts`, neuer `describe` mit `tests/ui/fakeDom.ts` (Muster: `grep -l fakeDom tests/ui`; `hud.test.ts` hat
      heute keinen Stapel-Test):
      `renderNoticeStack` mit Welt mit Fernangebot (`farWorld(3, ['B'])` + `stepAt`) → Kinder in Reihenfolge `.order-card`,
      `[data-field="far-card"]`, `[data-field="crisis-card"]`; Fernkarte sichtbar, Text T-02, Knopf `far-accept` mit `title` T-03;
      Klick ruft `actions.acceptFar` genau einmal. Nach `acceptFarOrder` + `updateNoticeStack` → Fernkarte `hidden`, Auftragskarte
      T-04, Knopf `order-deliver` Text `deliverLabel(world, B)` (P-D) und Klasse `unaffordable` nach dem Lager von B. Ohne Angebot:
      Fernkarte `hidden`, Auftragskarte unverändert. Gesperrte Funktion `orders` → Fernkarte `hidden`.
      Fernauftrag ohne Kontor auf B → Auftragskarte hat `order-card--warn` (T-05).

- [ ] **Step 2: Rot-Beleg** — `npx vitest run tests/ui/hud.test.ts; echo EXIT=$?` → `EXIT=1`.

- [ ] **Step 3: Stapel** — `hud.ts`:

```ts
const far = document.createElement('span');
far.className = 'card far-card';
far.dataset.field = 'far-card';
far.hidden = true;
const farText = document.createElement('span');
farText.dataset.field = 'far-text';
const farBtn = document.createElement('button');
farBtn.className = 'btn';
farBtn.textContent = 'Annehmen';
farBtn.dataset.field = 'far-accept';
farBtn.addEventListener('click', () => {
  farBtn.blur();
  actions.acceptFar();
});
far.append(farText, farBtn);
stack.append(order, far, crisis);
```

`updateNoticeStack`: `const text = orderVisible(world) ? farOfferText(world) : null;` → `hidden = text === null`,
`setField(stack, 'far-text', text ?? '')`, `farBtn.title = farAcceptTooltip(world)` (nur bei Änderung schreiben).
`order.ts`: `OrderActions` um `/** Nimmt das Fernangebot an. */ acceptFar(): void;` erweitern; in `updateOrder`
`const target = deliverTarget(world, island)` für Knopftext (`deliverLabel(world, target)`) und `unaffordable`
(`world.islands[target]`); Warnklasse `contractWarn(world) || farOrderWarn(world)`.

- [ ] **Step 4: `app.ts`** (Stellen per grep `renderNoticeStack(`, `deliverOrder: () =>`, `orderMessageFor(`):
  - `let farPrev = farSnap(world);` neben `prevOrder` (neues Spiel/Laden baut die App neu auf → frisch; prüfen, ob
    `restart()`/Laden diese Closure ersetzt, sonst dort ebenfalls `farPrev = farSnap(world)` — Review Focus 2).
  - `acceptFar: () => { const r = acceptFarOrder(world); if (!r.ok) showError(r.reason); else
showMessage(farAcceptedMessage(world, world.order!)); farPrev = farSnap(world); prevOrder = world.order ? { ...world.order } : null; refresh(); }`
    — T-07 ohne Klang, Fehler mit Klang `error` (T-09, über `showError`).
  - `deliverOrder`: `const target = deliverTarget(world, state.activeIsland);` statt `state.activeIsland` in `deliverOrder`
    und `friendlyReason`. Bei Erfolg mit `o.island !== undefined`: `const e = farDeliveredEntry(o, world.tick);
state.eventLog = pushLog(state.eventLog, [e]); showMessage(e.text);` statt `deliveredMessage(o)` (ein Eintrag, keine
    Doppelmeldung); Klang `orderDone` wie bisher und `recordContractSound('orderDone')` für die Dev-Sonde (Kommentar dort auf
    «Auftrags- und Vertragsklänge» erweitern). Danach `farPrev = farSnap(world)`.
  - Frame-Schleife, direkt vor `orderMessageFor(...)`: `const farLogged = farLogEntries(farPrev, world); farPrev = farSnap(world);
if (farLogged.length > 0) { state.eventLog = pushLog(state.eventLog, farLogged); for (const e of farLogged) if (e.toast !== null) showMessage(e.text, e.toast); }`.
- [ ] **Step 5: CSS** — `.notice-stack .far-card` wie `.order-card` (Breite 300 px, gleicher Abstand 7 px), Knopfzeile unter dem
      Text; Höhe bei 1280×720 ≤ 110 px; `overflow-wrap: anywhere`, damit `scrollWidth <= clientWidth` gilt.
- [ ] **Step 6: Doku** — `README.md`, Abschnitt Handelsaufträge, Unterabschnitt «Fernangebot» mit dem Text aus Anhang 02 T.4
      (Werte aus den Defs). `docs/spielwerte.md`, «### Handelsaufträge» → «Fernangebot»: Tabelle Insel, Gut, ab Stufe, Menge, Wert
      (Möweninsel Stoff 2 · 20 · 440; Felsbucht Rum 3 · 15 · 450; Weidenau Glas 4 · 12 · 444), Frist 2:50 ab Auftragsbeginn,
      Rotation, nächster Auftrag entfällt. `npx prettier --check README.md docs/spielwerte.md; echo EXIT=$?` → 0.
- [ ] **Step 7: Grün** — `npx vitest run tests/ui/hud.test.ts tests/ui/farOrder.test.ts tests/ui/order.test.ts
tests/ui/devProbes.test.ts; echo EXIT=$?` → 0; `npx tsc --noEmit; echo EXIT=$?`; `npx eslint src/ui; echo EXIT=$?` → 0.
- [ ] **Step 8: Commit** — `git commit -m "feat: eigene Fernkarte, Annehmen, Liefern und Log (Handel 2 T08)"`.

## Playtest (Controller startet `qa-playtester`, AK-H2-30)

Briefing-Kern: Ablage `.studio/qa/handel-2/`. **Spielstand:** Sim-Skript im Scratchpad (nicht committen): `createWorld(3)` +
`buildColony`-Lauf (`tests/sim/controller.ts`, `runColony` mit `stop` bei Höchststufe 3), dann `foundKontor2Literal(w, B)`,
Rum 20 auf B, Uhr vor einen Periodenbeginn, ein `step`, `serialize` → Datei; über «Laden» einspielen, pausiert.
Ablauf und Messung exakt nach AK-H2-30: zwei Karten (T-01, darunter T-02) → **Annehmen** → Fernkarte weg, T-04 «Lager 20/15»
bei aktiver Heimat, T-07 → **Liefern** → T-08, `contractSounds()` der Dev-Sonde enthält `orderDone` → «Nächster Auftrag in
m:ss» bis P(k + 2). Messung `getBoundingClientRect` und `scrollWidth <= clientWidth` (A5) für Auftrags-, Fern-, Krisenkarte;
Reihenfolge, Breite 300 ± 2, Höhe ≤ 110; Sturm (Krisen «normal», Warnung aktiv) → Rechtecke paarweise schnittfrei, Unterkante
≤ 420, Screenshot `fernkarte-sturm-1280x720.png`. Zusätzlich: Kontor auf B abreissen bei offener Fernkarte → Annehmen →
Meldung «Kein Kontor auf Felsbucht» (Review Focus 3); Fenster 1024×700 → keine Konsolenfehler (Review Focus 5). Urteil OK/BEDENKEN/ZURÜCK.
