> **Task-ID:** T15 · **AK-IDs:** AK-E4-13, AK-E4-14, AK-Z3-14; Auflage B3 (Startzustand mit Heimatanker im Bild,
> Panel-Knöpfe nicht je Tick neu)
> **blocked-by:** T14 · **Strang:** int, `.worktrees/m12-see` · `tech-ui-engineer` (sonnet), danach `qa-playtester`
> **Regeln:** Spec §8 „Routen-Bedienung", Anhang 03 F; Anhang 05 F/H (AK-Z3-14); Index P-9

## T15: UI — Schiffe und Routen im Kontor-Panel, Mouse-over Schiff

**Ziel:** Am Kontor kauft der Spieler ein Schiff und legt mit 2 Klicks eine Route an; jedes Schiff zeigt Ladung, Ziel
und Restzeit; ein Schiff auf See verrät beim Überfahren dasselbe.

**Code-Fakten (nach T14):** `ui/inspect.ts` `renderInspect` (baut einmal, `replaceChildren` nur beim Öffnen),
`updateInspect(panel, world, id)` je Tick; Kontor-Zweig mit `isKontor` (T13); Sim `ships.ts` (`buyShip`, `setRoute`,
`updateRoute`, `clearRoute`, `retireShip`, `validRoute`, `freeShipAtHome`), `islandName`, `laneTicks`, `SHIP`,
`ROUTE_RESERVE`, `goodUnlocked`; Render `shipLane.ts` `shipAt`; `hover.ts`; `StepReport.lost` aus `step` (P-3);
m:ss-Helfer aus E1 (`islandCard.ts`) bzw. `ui/time.ts`.

**Dateien:** neu `src/ui/ships.ts` (reine Sicht + DOM-Abschnitt); `src/ui/inspect.ts` (Abschnitt einhängen),
`hover.ts`, `app.ts` (Aktionen, `lost`-Meldungen); neu `tests/ui/ships.test.ts`.

## Schnittstellen (Produces, rein in `src/ui/ships.ts`)

```ts
export function shipRows(world: World, island: number): ShipRow[]; // Schiffe mit port/to/route-Bezug zu dieser Insel
export interface ShipRow {
  id: number;
  cargo: string;
  target: string;
  rest: string | null;
  route: string | null;
}
export function routeLine(world: World, route: Route, here: number): string; // „Heimat ⇄ Felsbucht: Gewürz →, ← Werkzeug"
export function routeTargets(
  world: World,
  here: number,
): { island: number; label: string; reason: string | null }[];
export function goodChoices(
  world: World,
  here: number,
  other: number,
): { fetch: GoodId[]; bring: GoodId[] };
export function routeFromClick(
  here: number,
  other: number,
  good: GoodId,
  dir: 'fetch' | 'bring',
): Route;
export function shipsKey(world: World, island: number): string; // Struktur: ids, Route ja/nein, liegend/fahrend
export function shipTooltip(world: World, id: number): string; // „Handelsschiff · 30 Gewürz · nach Heimat · 0:37"
```

## Regeln (verbindlich)

- **Abschnitt „Schiffe"** in jedem Kontor-Panel: je Schiff mit Bezug eine Zeile (Ladung, Ziel „unterwegs nach <Name>"
  bzw. „liegt in <Name>", Restzeit m:ss bei Tempo 1 = `left / 10` s aufgerundet, Route). Heimatkontor zusätzlich
  „Handelsschiff kaufen (1200 · 25 Holz · 10 Werkzeug)" — Zahlen aus `SHIP`; blass mit Sim-Grund.
- **Route in 2 Klicks:** je anderem Kontor ein Knopf „Route nach <Name>" (blass mit „Kein freies Schiff", wenn
  `freeShipAtHome` `null`). **Klick 1** öffnet im Panel die Güterauswahl mit „Holen (<Name> → hier)" und „Bringen
  (hier → <Name>)", alle freigeschalteten Güter, Güter mit Bestand > 10 auf der Quellseite zuerst. **Klick 2** auf ein
  Gut: `setRoute(world, freeShipAtHome.id, routeFromClick(...))` mit Reserve 10, Auswahl schliesst. `here = a`,
  `other = b`; „Holen" → Gut in `ba`, „Bringen" → in `ab`.
- **Schiffszeile:** weitere Güter, Reserve ± 10, „Route auflösen" (1 Klick, `clearRoute`), „Ausmustern"
  (`retireShip`, blass mit Grund); Gut, das in der Gegenrichtung fährt, blass „Fährt schon in Gegenrichtung".
- **B3 / P-9:** DOM des Abschnitts nur neu aufbauen, wenn `shipsKey` sich ändert; je Tick nur Texte (`data-field`).
- **Mouse-over Schiff** (`shipAt`) → `shipTooltip`; Klick öffnet das Panel des Heimatkontors mit hervorgehobener
  Schiffszeile.
- **Verlust-Meldung:** je `StepReport.lost`-Eintrag „<n> <Gut> verloren" über den bestehenden Meldungsweg.

## Schritte

- [ ] **1 Tests zuerst** `tests/ui/ships.test.ts`, `describe('M12 E4 UI Schiffe')`, Welt aus `seeRouteStart()`
      (T14): `routeTargets` (Felsbucht ohne Grund; ohne freies Schiff „Kein freies Schiff"); `goodChoices` (Gewürz
      zuerst in `fetch`, weil 30 > 10); `routeFromClick(0, 2, 'spice', 'fetch')` = `{ a: 0, b: 2, ab: [], ba: [{ good:
'spice', reserve: 10 }] }`; nach `setRoute` + 1 `step`: `shipRows(w, 0)[0].target` = „unterwegs nach Felsbucht",
      `rest` „0:37" o. ä. (aus `laneTicks`); `routeLine`; `shipTooltip`; `shipsKey` ändert sich bei Route an/aus, nicht
      bei `left`.
- [ ] **2 Rot-Beleg** → Commit `test: M12 E4 UI Schiffe und Routen (rot)`.
- [ ] **3 Umsetzung** → `make check`, `CI=true make check` → Commit `feat: M12 E4 Schiffe und Routen im Kontor-Panel`.
- [ ] **4 Browser-Check `qa-playtester`** (`.studio/qa/M12-SEE/T15/`, 1280 × 800 und 1920 × 1080, Tempo 1):
  - **AK-E4-13:** `see-route-start-v9.json` laden, Kamera so, dass der Heimatanker im Bild ist, Panel des
    Heimatkontors offen, keine Auswahl. Gezählt: primäre Mausklicks. Klick 1 „Route nach Felsbucht", Klick 2 „Gewürz"
    unter „Holen" → **≤ 2 Klicks und ≤ 1 s** bis „unterwegs nach Felsbucht" mit Restzeit; Schiff legt im Bild ab.
  - **AK-E4-14:** Zeile zeigt Ladung, Ziel, m:ss; Mouse-over Schiff auf See gleiche Angaben; „Route auflösen" 1 Klick.
  - **AK-Z3-14:** `z3-scenario-v9.json` laden: Chip „Ziel n / 80 Kaufleute mit Gewürz"; Route auflösen → „Fehlt: …"
    im Tooltip/Chronik; neu laden, warten bis erreicht → Banner einmal.
  - Sicht für lead-art (D-144): Schiff auf See bei Zoom 1, 0,25, 0,125; Gewürzplantage; Screenshots beilegen.

**Review-Fokus:** 2-Klick-Weg ohne Tastatur; kein Neuaufbau je Tick; Gründe aus der Sim; Restzeit bei Tempo 1;
Panel jedes Kontors, nicht nur der Heimat.
