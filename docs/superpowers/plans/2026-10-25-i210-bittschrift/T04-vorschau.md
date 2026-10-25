# T04 Kartenvorschau `petitionPreview`

Persona `tech-sim-engineer` · Strang A · Tools ≈ 30 · AK-BS-18 · blocked-by T03.

**Files:** Modify `src/sim/petitions.ts`, `tests/sim/petitions.test.ts`.

## Interfaces

- Consumes: `goodsBalance(world, HOME)` (`flow.ts`, netto mit Genügsamkeit, P-4), `TIERS[t].needs`, `overcrowdCap`, `houseCap`, `petitionCost`, `PETITIONS`, `FRUGAL_PCT`, `FRUGAL_TICKS`, `PETITION_ANSWER`.
- Produces (für T09; liest nur, ändert nichts, Spec §5.1):

```ts
export interface PetitionReserveLine {
  good: GoodId;
  stock: number;
  net: number; // net je 100 T aus goodsBalance
  extra: number; // Mehrbedarf = Σ Zusatzplätze je passendem Haus × Rate der Stufe
  gap: number; // max(0, extra − max(0, net))
  reach: number | null; // stock / gap × 100 in Ticks, gerundet; null bei gap 0 («kein Engpass»)
}
export interface PetitionPreview {
  id: PetitionId;
  drawnAt: number;
  left: number; // drawnAt + PETITION_ANSWER − tick
  cost: Partial<Record<GoodId, number>>; // wie petitionCost
  yesBlock: string | null; // Sperrgrund aus answerPetition-Schritten 5–6, sonst null
  delay: number;
  duration: number;
  extraPlaces: number; // nur overcrowd: Σ Zuschläge der passenden Häuser auf HOME
  reserve: PetitionReserveLine[]; // nur overcrowd: je Bedarfsware der betroffenen Stufen, GOOD_IDS-Reihenfolge
  producers: { count: number; input: { good: GoodId; stock: number; net: number } | null } | null; // B6, B7
  spiceRoute: { foreignStock: number; ships: number } | null; // nur B6 (AK-BS-25)
  stocks: Partial<Record<GoodId, number>> | null; // nur B9
  noGood: GoodId;
  noSaving: number; // HOME-Rate (consumed je 100 T) × FRUGAL_PCT / 100 × FRUGAL_TICKS / 100
  nearFull: boolean; // Lager der Nein-Ware ≥ 90 (Wert aus `PETITIONS.granary.when.min`, kein Literal)
}
export function petitionPreview(world: World, drawnAt: number): PetitionPreview | null; // null ohne offene Marke
```

`yesBlock` prüft dieselben Gründe in derselben Reihenfolge wie `answerPetition`. Die Prüflogik teilst du in eine interne Funktion, die beide nutzen (DRY); die Vorschau bucht nie ab. B6 `input` ist Gewürz auf der Plantageninsel des Ankers; `spiceRoute.ships` ist die Zahl der Schiffe mit einer Route, die Gewürz lädt (bestehende Abfrage in `ships.ts` oder `goal3.ts` per `rg -n "spice" src/sim/ships.ts src/sim/goal3.ts`, keine neue Zustandsführung).

## Schritte

- [ ] **Test zuerst** `AK-BS-18` in `tests/sim/petitions.test.ts`: Welt P1 mit 4 Häusern Stufe 3 und zusammen 50 Einwohnern (13, 13, 12, 12), Stoff 31, Stoff-Netto 0 (Weber mit Wolle so gesetzt, dass `goodsBalance(w).cloth.net === 0`; Vorbedingung als eigenes `expect`), Marke B1 mit `amount` 10. Erwartet: `cost.cloth === 10`, `extraPlaces === 8`, Reserve Stoff `extra` 1,6, Nahrung 4,0, Rum 1,6 (`toBeCloseTo`, 6 Stellen); Stoff `gap` 1,6, `reach` 1938 (± 1); `noSaving` 18 (`toBeCloseTo`); `JSON.stringify(world)` vor und nach dem Aufruf gleich. Dazu: Stoff 5 → `yesBlock` «Zu wenig Stoff (5 / 10)»; B9-Marke → `stocks` hat genau `cloth`, `rum`, `food`; B6-Marke → `spiceRoute` nicht null, B1 → `spiceRoute === null`.
- [ ] Rot: `npx vitest run tests/sim/petitions.test.ts; echo EXIT=$?`.
- [ ] Umsetzen.
- [ ] Grün plus Teilbeleg: `npx vitest run tests/sim/petitions.test.ts; echo EXIT=$?`, `npx tsc --noEmit`, `make lint`, `make conflicts`, je `; echo EXIT=$?`.
- [ ] Commit `feat: I-210 Kartenvorschau petitionPreview`.
