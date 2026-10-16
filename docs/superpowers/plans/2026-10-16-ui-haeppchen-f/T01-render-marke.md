# T01 · Render: `MapMark` und Marke in `drawSeaMap` (I-101)

Umsetzer `tech-ui-engineer` (oder `art-rendering-engineer`) · ≈ 35 Tools · AK M6, M7 · blocked-by: T00

## Dateien

- ändern: `src/render/seaMap.ts`, `tests/render/seaMapDraw.test.ts`
- nicht ändern: `hitIsland`, `mapDots`, Kontor-Marke, `src/sim/`, `src/ui/`

## Verhalten

```ts
/** Marke an einer Insel (Fernangebot hohl, Fernauftrag gefüllt); die UI baut sie, der Zeichner kennt nur diese Form. */
export interface MapMark {
  island: number;
  kind: 'offer' | 'order';
  text: string;
  warn: boolean;
}
export interface MapUi {
  hover: number | null;
  dpr: number;
  mark?: MapMark | null;
}
```

1. `drawSeaMap` zeichnet nach den Kontor-Marken, **vor** dem Hover-Rahmen und den Schiffspunkten genau eine Marke, wenn `ui.mark` gesetzt und `world.islands[mark.island]` existiert.
2. Lage: Mitte eine Markenhöhe (`MARK`) über der Kontor-Marke (`lift` + `MARK` + `MARK_GAP`) am Anker der Insel. Münze: Kreis Radius `MARK * px * 0.9`; `offer` = nur Ring (`stroke`), `order` = gefüllt (`fill`). Text rechts daneben (`fillText`, Schrift `11px` × `px`, `textBaseline: 'middle'`) mit dunklem Umriss (`strokeText` ist erlaubt, zählt aber nicht als zweiter `fillText`).
3. Farben nur als neue Einträge in `COLORS` (UI-Konstanten): `markFill`, `markWarn`; `warn` tauscht die Farbe, nicht die Form.
4. **Klemmen:** Textbreite per `ctx.measureText(text).width` (Fake-Kontext liefert Wert); steht Münze plus Text über den rechten Kartenrand `l.w`, wird der Text **links** der Münze gesetzt (`textAlign: 'right'`); y wird auf `[Münzradius, l.h − Münzradius]` begrenzt.
5. Ohne `ui.mark` (undefiniert oder `null`) bleibt die Aufrufliste des Kontexts **bitgleich** zu heute.
6. Keine Trefferfläche: `hitIsland`/`seaMapPick` unverändert.

## Testfälle (rot zuerst; Beleg im Bericht)

Hilfen: `tests/render/fakeCtx.ts`, bestehende Welt-/Layout-Aufbauten in `seaMapDraw.test.ts` wiederverwenden.

- **AK-M6a** `offer`: Aufrufliste enthält genau einen `arc` mehr als ohne Marke, einen `stroke` und genau einen `fillText` mit `mark.text`; `order`: `fill` statt `stroke` für die Münze; `warn`: `fillStyle`/`strokeStyle` ist `COLORS.markWarn`.
- **AK-M6b** Ohne Marke und mit `mark: null`: Aufrufliste `toEqual` zur Aufrufliste des Bestandstests (Abgleich gegen eine Aufnahme im selben Test mit `mark` weggelassen).
- **AK-M6c** Marke nahe `l.w`: `textAlign` `'right'`; Marke nahe `l.h`/`0`: y innerhalb der Grenzen.
- **AK-M7** `hitIsland(world, l, px, py)` am Markenpunkt liefert dasselbe wie ohne Marke (kein Mausfang; Funktion bekommt die Marke gar nicht).

## Prüfschritte / Task-Review

Reviewer: Render schreibt nie in die Welt, kein Import aus `ui`/`sim/orders`; `tsc` und `make lint` Exit 0; Rot-Belege vorhanden.
