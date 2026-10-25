# T06 Kapellen-Knöpfe, Betriebs- und Handelszeile

Persona `tech-ui-engineer` · Strang C · Tools ≈ 60 · AK-FE17 bis FE20 (Vitest-Teil), P-4, P-10 · blocked-by T03.

**Worktree:** `.worktrees/i201-ui`, Branch `feat/i201-ui` vom T03-Hash auf `feat/i201` (`git worktree list` zuerst). Kein `src/sim/`-Diff (Sim-Fehler → Meldung an den Controller).

**Files:** Modify `src/ui/feast.ts`, `src/ui/inspect.ts` (`renderBetrieb`, Kapellen-Knöpfe, `updateFeast`, `InspectActions.holdFeast`), `src/ui/app.ts` (Aktion `holdFeast`), `src/ui/trade.ts` (`renderTrade`, `updateTrade`), `src/style.css` (nur falls nötig), `tests/ui/feast.test.ts`, ein Test für `marketDayTag` (bestehende `tests/ui/trade*.test.ts` per `ls tests/ui | rg trade`), ein Test für P-10 (bestehende `panelView`-Tests per `rg -ln "upgradeGain" tests/ui`). Vorher `rg -n "feastView|data-field=\"feast\"|Fest feiern" tests src` und alle Treffer mitziehen.

**Interfaces:**

- Consumes: `FEAST_KINDS`, `FEAST_KIND_IDS`, `FeastKind` (`../sim/defs/feast`); `feastBlockReason(world, chapel, kind)`, `feastState`, `feastKindOf`, `feastActive`, `harvestActive`, `marketActive`, `holdFeast(world, id, kind)` (`../sim/feast`, Fassade, P-8); `GOODS`, `formatClock`.
- Produces (DOM-frei, `src/ui/feast.ts`; `feastView` entfällt):

```ts
export interface FeastButtonView {
  kind: FeastKind;
  label: string; // `${name} · ${feastCostText(kind)}`, z. B. «Erntefest · 10 Rum, 15 Stoff»
  disabled: boolean; // feastBlockReason(…) !== null
  title: string; // feastBlockReason(…) ?? ''
  reason: string | null; // sichtbare Zeile: Sperrgrund nur in Phase «bereit», sonst null (P-4)
}
export function feastCostText(kind: FeastKind): string; // «10 Rum, 15 Stoff» aus cost und GOODS[g].name, Schlüsselreihenfolge
export function feastButtons(world: World, b: Building): FeastButtonView[] | null; // null: keine Kapelle oder Rum gesperrt (U4)
export function feastStatusLine(world: World, chapel: Building): string | null;
// active: `${FEAST_KINDS[feastKindOf].name} läuft noch ${formatClock(remaining)}`; cooldown: `Nächstes Fest in ${formatClock(remaining)}`; ready: null
export function harvestLine(world: World, b: Building): string | null; // harvestActive → `Erntefest: Zyklus ${FEAST_KINDS.harvest.cyclePct} %`
// src/ui/trade.ts
export function marketDayTag(world: World, island: number): string; // marketActive → `Markttag ${FEAST_KINDS.market.sellPct} %`, sonst ''
```

`feastKindOf` für die Statuszeile kommt aus der Fassade `../sim/feast` (Re-Export aus T01).

## Verdrahtung

- `InspectActions.holdFeast(id: number, kind: FeastKind): void`; `app.ts`: `holdFeast(world, id, kind)`, Fehlertext wie heute über `friendlyReason`.
- Kapellen-Panel: je Art ein Knopf `data-field="feast-<kind>"` in `FEAST_KIND_IDS`-Reihenfolge, je eine Zeile `data-field="feast-reason-<kind>"` (Klasse `negative`, `hidden` bei `reason === null`), eine Zeile `data-field="feast-status"` (`hidden` bei `null`). `updateFeast` setzt `textContent`, `disabled`, `title`, `hidden` nur bei Änderung (Muster `updateTrade`).
- Betrieb-Panel (`renderBetrieb`): Zeile `data-field="harvest"`, in `updateInspect` aus `harvestLine` nachgeführt (`hidden` bei `null`).
- Handelsfenster (`renderTrade`): Marke `data-field="market-day"` im Kopf, `updateTrade` setzt Text und `hidden = tag === ''`.
- Hausanzeige unverändert («Fest: schnellerer Aufstieg» nur beim Aufstiegsfest, folgt aus `feastActive`).

## Schritte

- [ ] **Tests zuerst** (`tests/ui/feast.test.ts`, Aufbau wie dort `setup()`, plus Werkstatt per `putBuilding` aus `../sim/helpers`):
  - **AK-FE17:** bereit, Lager reichlich: drei Knöpfe mit Labels genau «Aufstiegsfest · 10 Rum», «Erntefest · 10 Rum, 15 Stoff», «Markttag · 10 Rum, 5 Glas», alle frei. Stoff 4: Erntefest `disabled`, `reason` «Zu wenig Stoff (4 / 15)», `title` gleich. Nach `holdFeast(w, id, 'harvest')`: `feastStatusLine` = «Erntefest läuft noch ${formatClock(FEAST_DURATION)}»; alle drei `disabled`, `title` «Fest läuft», `reason` null. Abklingzeit: «Nächstes Fest in …». Rum gesperrt → `null` (bestehender U4-Fall).
  - **AK-FE18:** `harvestLine` im Radius «Erntefest: Zyklus 75 %», ausserhalb `null`, bei `tick = feastAt + FEAST_DURATION` `null`.
  - **AK-FE19:** `marketDayTag(w, HOME)` «Markttag 125 %» während, `''` davor und danach; `sellTexts(w, 'rum', 10).price` während grösser als davor.
  - **AK-FE20:** zweite Kapelle derselben Insel nach Erntefest an der ersten: ihr Erntefest-Knopf `reason` «Erntefest auf der Insel: Abklingzeit»; Markttag-Knopf frei.
  - **P-10:** Werkstatt Stufe 2 im Radius, `upgradeGain(w, b, 3)`: Zeile `output` hat mit laufendem Erntefest denselben `after`-Wert wie ohne; `before` ist grösser (schnellerer Zyklus).
- [ ] **Rot-Lauf:** `npx vitest run tests/ui/feast.test.ts <trade-Test> <panelView-Test>; echo EXIT=$?` → Exit ≠ 0.
- [ ] **Umsetzen** und verdrahten.
- [ ] **Grün:** derselbe Lauf → 0; dazu `npx vitest related --run src/ui/feast.ts src/ui/inspect.ts src/ui/trade.ts src/ui/app.ts; echo EXIT=$?` → 0.
- [ ] **Sichtprüfung lokal:** `make help` für den Dev-Server; Kapelle wählen, drei Knöpfe sichtbar, Panel bei 1280 px ohne Umbruchfehler (Screenshot nur für den Bericht, Abnahme macht T07).
- [ ] **Teilbeleg:** `npx tsc --noEmit`, `make lint`, `make zeittests`, `make conflicts`, je `; echo EXIT=$?`.
- [ ] **Commit:** gezielt die geänderten Dateien · `feat: Festwahl an der Kapelle, Ernte- und Markttag-Anzeige (I-201 T06)`.
