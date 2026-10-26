# T07 · UI-Helfer: Packen, Karte, Log, Seekarte

Strang B · Persona `tech-ui-engineer` · Modell sonnet · ≈ 65 Tools · blocked-by: T05 (Review OK; B zweigt von A ab) · AK-NU1-27, -28, -29, -56
Spec §3.11, §5.1–§5.6; Anhang 02 §8.7. Worktree `.worktrees/nu1-ui`, Branch `feat/nu1-ui` von `feat/nu1-kartenrand` @ T05.

**Testsperre: Last ≤ 4 nötig** (`make messfenster`), sonst `waiting`.

**Files:**

- Create: `src/ui/expeditionView.ts`, `tests/ui/expeditionView.test.ts`, `tests/ui/expedition-source.test.ts`
- Modify: `src/ui/seaMapView.ts`, `src/render/seaMap.ts` (`mapDots`, neu `fogFields`, `expeditionMark`), `tests/ui/seaMapView.test.ts`
- Modify (nur Lagergrenze/Radius, Schritt 4): `src/ui/trade.ts` ≈ 292, `src/ui/storageFull.ts` ≈ 52/80, `src/ui/hud.ts` ≈ 92/131/841, `src/ui/hints.ts` ≈ 238, `src/ui/inspect.ts` ≈ 824 (45 KB: nur per `rg -n`), `src/ui/hover.ts` ≈ 184, `src/ui/buildMenu.ts` ≈ 133, `src/render/overlays.ts` ≈ 123

**Interfaces:**

- Consumes (Sim, nur lesend): `startReason`, `optionReason`, `openCard`, `shipAvailable`, `soleSpiceShip`, `areaDuration`, `backTicks`, `expeditionShipAway`, `ExpeditionNotice`, `storageCap`, `supplyRadiusOf`, `findNote`, Defs aus `defs/expedition.ts`; `formatGameTime` (`src/ui/time.ts`, R835); `LogEntry` (`src/ui/crisisLog.ts`).
- Produces (alle DOM-frei, für T08):

```ts
export interface PackSel {
  area: SeaAreaId | null;
  ship: number | null;
  cargo: Partial<Record<GoodId, number>>;
}
export function packView(world: World, sel: PackSel): PackView; // Gebiete, Schiffe, Güterzeilen, Balken, Proviant, Warnung, launchReason
export function cardView(world: World): CardView | null; // offene Karte mit Optionen inkl. Umweg, Umkehren
export function maphouseView(world: World): MaphouseView; // Gebäudekarte §5.1
export function expeditionStatusText(world: World): string; // «Keine Expedition» · «Wartet auf Schiff 3» · «Abschnitt 3 von 5 · noch 0:42» · «Karte wartet» · «Heimfahrt · noch 0:30»
export function findListView(world: World): FindListView; // «Fundstücke k / 8», 8 Plätze, Zeile «Kartenrand vollständig»
export function chronicleLine(world: World): string | null; // «Seegebiete k/3 · Fundstücke k/8», null vor wonSpice
export function expeditionSnap(world: World): ExpSnap; // Kopie, keine Referenzen
export function expeditionLogEntries(prev: ExpSnap, world: World): LogEntry[];
export function noticeTexts(reports: readonly StepReport[]): string[]; // 'remind' → «Expedition wartet auf deine Wahl»; 'overflowAhead' → Text E-NU-5
// render/seaMap.ts (rein)
export function fogFields(l: MapLayout): Record<SeaAreaId, { x: number; y: number; r: number }>; // im Randstreifen ausserhalb des Insel-Rechtecks
export function expeditionMark(world: World, l: MapLayout): { x: number; y: number } | null; // back: Linie Feld → Heimat, Anteil 1 − left / backTicks; leg/card: am Feld; sonst null
```

## Texte (wörtlich, Spec)

Packansicht §5.2: «n / 50» (`SHIP.capacity`), «Proviant reicht für s von k Abschnitten», bei s < k zusätzlich «Das Schiff kehrt vorher um»; Schiffszustände «frei», «Route Heimat ⇄ ‹Insel› (läuft nach Ankunft aus)», «Route ohne Heimat»; Gebiet «n Abschnitte · Dauer ≈ m:ss»; Gewürz §3.11.1 «Einziges Gewürzschiff: Lager reicht ≈ m:ss, Fahrt ≈ m:ss. Ohne die Route kann die Gewürzstadt Kaufleute verlieren.» (Verbrauch aus derselben Quelle wie die Reichweite im HUD, `hud.ts` `reachView`). Kartendialog §5.3 und §8.7: «Abschnitt i von n», «−12 Werkzeug», «Umweg (+2 Abschnitte, 6 Nahrung)», «Umkehren», «Proviant reicht noch für n Abschnitte» (n = ⌊Nahrung / 3⌋), an R-Optionen «Fund nur, wenn die Fahrt zu Ende geht». Log §5.6: «Expedition ins Wrackfeld ausgelaufen» (in die Holzschären / ins Nordgebiet), «Expedition: Karte wartet», «Proviant aus: Expedition kehrt um», «Expedition kehrt um», «Expedition zurück», «Fundstück: ‹Name›» je Stück, «Wrackfeld aufgedeckt», «Kartenrand vollständig». Nebel: «Unbekanntes Gewässer» (`FOG_NAME`) plus Stichwort; aufgedeckt: `outlook`.

## Tests (`tests/ui/expeditionView.test.ts`, `tests/ui/seaMapView.test.ts`)

- **AK-27:** `packView`: `capacityText` «42 / 50», `full` bei 50; Proviantzeile «reicht für 2 von 4» mit Warnung bei 7 Nahrung Wrackfeld; Gewürz-Warnung genau beim einzigen Gewürzschiff, Zahlen im Format `m:ss`, keine Warnung mit zweitem Gewürzschiff; `launchReason === startReason(world, …)` für jede Zeile der Tabelle §3.3; Schiffsliste mit den drei Zuständen.
- **AK-28:** `cardView`: gesperrte Option trägt `optionReason` wörtlich; `expeditionLogEntries` erzeugt je Übergang (Start, Karte, Proviant-Umkehr, freiwillige Umkehr, Rückkehr, je Fundstück, Aufdecken, Vollständig) genau einen Eintrag; gleicher Stand → `[]`.
- **AK-56:** «Proviant reicht noch für 2 Abschnitte» bei 7 Nahrung; Hinweis «Fund nur, wenn die Fahrt zu Ende geht» nur an `'r'`.
- **AK-29:** Nebelfeld-Tip ohne Namen mit beiden Hinweis-Waren; aufgedeckt Ausblick wörtlich §5.5; `seaMapKey` ändert sich bei Phasenwechsel und Aufdecken; `mapDots` ohne Expeditionsschiff (ausser `boarding`); `expeditionMark` in `back` auf der Strecke Feld → Heimat (Anteil aus `left`), in `leg`/`card` gleich Feldmitte, in `boarding` `null`.
- `tests/ui/expedition-source.test.ts` (Wächter UI, Gegenstück AK-40): keine Datei unter `src/ui` und `src/render` nennt `STORAGE_CAP`; Radius-Werte für Kreise und Texte kommen aus `supplyRadiusOf` (Existenzprüfungen `def.supplyRadius !== undefined` bleiben erlaubt).

## Schritte

- [ ] Tests schreiben; **Rot:** `npx vitest run tests/ui/expeditionView.test.ts tests/ui/seaMapView.test.ts tests/ui/expedition-source.test.ts; echo EXIT=$?` → ≠ 0.
- [ ] Helfer umsetzen; Texte nur hier, keine Spielwerte (Zahlen aus `defs/`).
- [ ] **Schritt 4 Lagergrenze/Radius:** jede Stelle der Liste auf `storageCap(world, good)` bzw. `supplyRadiusOf(world, defId)`; `stockChipView`/`reachLine` bekommen die Grenze als Parameter. `inspect.ts` ≈ 824: «Lagerkapazität 100 je Gut» plus mit F7 «, Gewürz und Nahrung 120» und `findNote` (Leseort F7).
- [ ] **Grün:** derselbe Befehl → 0; `npx vitest run tests/ui/hud.test.ts tests/ui/trade.test.ts tests/ui/hints.test.ts tests/ui/hover.test.ts tests/render/seaMap*.test.ts tests/render/overlays*.test.ts; echo EXIT=$?` → 0.
- [ ] Teilbeleg: `npx tsc --noEmit; echo EXIT=$?`, `make lint; echo EXIT=$?`, `make zeittests; echo EXIT=$?`, `make conflicts; echo EXIT=$?`.
- [ ] Commit `feat: NU-1 UI-Helfer Packansicht, Kartendialog, Log, Seekarte (T07)`.
