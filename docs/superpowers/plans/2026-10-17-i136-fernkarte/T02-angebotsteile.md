# T02 `farOfferParts`, Fahrzeit-Segment, `short` (AK-F3, AK-F4, AK-F5)

Dateien: `src/ui/farOrder.ts`, `tests/ui/farOrder.test.ts` (und `tests/ui/farChoice.test.ts` nur, wenn ein bestehender Text-Golden bricht). Blockiert von T01.

## Soll

```ts
export interface FarOfferParts {
  head: string;
  travel: string | null;
  stock: string;
  short: boolean;
  tip: string;
}
export function farOfferParts(world: World, which: 0 | 1 = 0, lanes?: Lanes): FarOfferParts | null; // null wie farOfferText
export function farOfferLead(p: FarOfferParts): string; // head + (travel ? ' · ' + travel : '') + ' · '
export function farOfferText(world, which = 0, lanes?): string | null; // farOfferLead(p) + p.stock, null wie bisher
```

- `head` = `Fernangebot {Insel}: {n} {Gut} · {Prämie} · Frist {t}`; `travel` = `≈ {formatGameTime(homeTravelTicks)} Fahrt` oder `null`; `stock` = `Lager {s}/{n}` (Lager der Fern-Insel, `stockOn`); `short = s < n`; `tip` = `Fehlt {n−s} {Gut}` bei `short`, sonst ''.
- `homeTravelTicks` mit Standard-Cache; Reihenfolge Frist, Fahrzeit, Lager. `farOrderText` bleibt **unverändert**.

## Schritte (Tests zuerst, jeder Fall rot belegt)

- [ ] AK-F4 **Golden-String fest im Test** (nicht aus dem Code abgeleitet): für `farWorld(3, ['B'])`, `stepAt(w, P)` den vollständigen erwarteten Text wörtlich im Test (Insel, Menge, Prämie, Frist, «≈ m:ss Fahrt», «Lager s/n»); Werte einmal ausgeben und als Literal einsetzen. Ohne Lane: `farOfferText(w, 0, () => [])` (Lane-Provider als dritter Parameter) → `travel === null`, Text ohne «Fahrt» und zeichengleich zur Vorgänger-Form (Literal `Fernangebot …: … · Frist … · Lager s/n`).
- [ ] AK-F3: Text enthält `≈ {formatGameTime(travelTicks)} Fahrt` genau einmal, Index von «Frist» < «Fahrt» < «Lager»; beide Karten (`which` 0 und 1) mit zwei Fremdinseln (`farWorld(3, ['B','C'])`, soweit Wahl-Angebot erscheint) zeigen die Fahrzeit der eigenen Insel; bei verschiedenem `d` zwei verschiedene Werte (sonst Test mit `expect(...).toContain` je Karte).
- [ ] AK-F5 `short`: 3/12 → `true`, 12/12 → `false`, 20/12 → `false` (Lager der Fern-Insel setzen: `w.islands[i].stock[good] = n`); Heimat-Lager hoch, Fern-Lager niedrig → `true`.
- [ ] Randfälle: Fern-Insel **ohne Kontor** (`dropKontor`) → `stock === 'Lager 0/n'`, `short === true`; **nur ein Fernangebot** (`which = 1` ergibt `null`, `which = 0` hat Fahrzeit); **kein Schiff** (Welt ohne Schiffe) → `travel !== null`.
- [ ] `tip` zu `short`: genau `Fehlt {n−s} {Gut}`; nicht `short` → ''.
- [ ] Umsetzen, grün, Je-Task-Prüfungen aus dem Index, Commit `feat: I-136 T02 Fernangebot mit Fahrzeit und short`.
