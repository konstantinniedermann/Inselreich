# T05 · Ablauf, Wahl, Rückkehr, Vergabe, Meldungen

Strang A · Persona `tech-sim-engineer` · Modell sonnet · ≈ 70 Tools · blocked-by: T04 · AK-NU1-07, -09, -10, -14 (Rückkehr), -15, -16, -18, -19 (ab Rückkehr), -21, -26, -34, -35, -36, -39 (Rückkehr)
Spec §3.5–§3.8, §3.9 Punkt 2 und 7, §3.11; Anhang 02 §5 (Satzbonus).

**Testsperre: Last ≤ 4 nötig** (`make messfenster`), sonst `waiting`.

**Files:**

- Modify: `src/sim/expedition.ts`, `src/sim/tick.ts` (`step`, `StepReport`), `tests/sim/expedition.test.ts` (Blöcke Ablauf, Wahl, Meldungen), `tests/sim/expedition-cards.test.ts` (AK-18), `tests/sim/finds.test.ts` (AK-21, AK-19 Rest), `tests/sim/finds-storage.test.ts` (AK-39 Rückkehr)
- Modify (mechanisch, `pins.md` letzte Zeile): StepReport-Literale in `tests/` und `src/ui/` um `expedition: []`

**Interfaces:**

- Consumes (T04): `beginSection`, `turnBack`, `backTicks`, `storeCargoHome`, `soleSpiceShip`; (T03) `storageCap`.
- Produces:

```ts
// expedition.ts
export type ExpeditionNotice = 'remind' | 'overflowAhead' | 'complete';
export type OptionKind = 'r' | 's' | 'detour' | 'turn';
export function tickExpedition(world: World, lost: ShipLoss[]): ExpeditionNotice[];
export function optionReason(world: World, option: unknown): string | null; // reine Vorprüfung, gleiche Texte wie chooseOption
export function chooseOption(world: World, option: unknown): Result;
export const openCard: (world: World) => CardDef | null; // Karte bei phase 'card', sonst null
// tick.ts
export interface StepReport {
  lost: ShipLoss[];
  contract: ContractEvent | null;
  expedition: ExpeditionNotice[];
}
// step(): const lost = tickShips(world); const expedition = tickExpedition(world, lost); … return { lost, contract, expedition };
```

## Ablauf je Aufruf von `tickExpedition` (Spec §3.5; `expedition null` → sofort `[]`, nichts gelesen)

- `boarding`: nichts.
- `leg`: `left -= 1`; bei 0: `leg += 1`; dann (1) `cardIndex < k` und `leg === cardsAfter[cardIndex] + extra` → `phase 'card'`, `wait 0`; sonst (2) `leg < sections + extra` → `beginSection`; sonst (3) `phase 'back'`, `done true`, `left HOME_TICKS`.
- `card`: `wait += 1`; bei `wait === REMIND_TICKS` Meldung `'remind'` (einmal je Karte, `wait` beginnt je Karte bei 0).
- `back`: **vor** dem Abzählen: `left === Math.min(WARN_BACK_TICKS, backTicks(e))` und für ein Gut `cargo[g] + Heimatlager[g] > storageCap(world, g)` → `'overflowAhead'`; dann `left -= 1`; bei 0 Rückkehr: `storeCargoHome` (Verfall in `lost`); bei `done`: Gebiet an `seaRevealed`, `areaOf(area).finds.slice(0, e.finds)` an `world.finds`; erreicht `world.finds` damit `FINDS.length`, Meldung `'complete'`; `expedition = null`; ist `route` des Schiffs `null`, `homing = false` (P-10).
- Ein Abschnitt dauert 300 Aufrufe; beginnt er in einer Aktion, zählt der nächste Tick als erster.

## Wahl (`chooseOption`, Spec §3.6 Punkt 3 und 6)

Prüfreihenfolge: keine `phase 'card'` → «Keine Karte offen»; `option` ∉ `OptionKind` oder `'s'` an Karte ohne S → «Ungültige Option»; Bedingung nicht an Bord → «Braucht 5 Werkzeug an Bord (da 2)» (erstes fehlendes Gut in Def-Reihenfolge der Bedingung, Name aus `GOODS`). Erfolg: `'r'`/`'s'` Bedingung abziehen (Nulleinträge löschen, kanonisch P-8), bei `'r'` `finds += 1`; `'detour'` `extra += DETOUR_SECTIONS`; bei `'r'`, `'s'`, `'detour'` `cardIndex += 1`, dann `leg < sections + extra` → `beginSection`, sonst `back` mit `done true`, `left HOME_TICKS`; `'turn'` → `turnBack`. Abgewiesene Wahl ändert nichts (JSON-gleich).

## Tests

Treiber: Für reine Ablauf-Tests `tickExpedition` direkt in einer Schleife (`w.tick += 1`), damit kein Test über 500 ms läuft (R905); volles `step` nur in AK-07 (Routenschiff im Folgetick), AK-15, AK-16. Ladung so wählen, dass alle Bedingungen der gezogenen Karten erfüllbar sind (Werte aus `cardOf(id).r.cond`).

- **AK-07:** freies Schiff, Wrackfeld, sofortige Wahl: `card` nach 600 Aufrufen, `left` zählt in `card` nicht, nächste Karte nach weiteren 600, Heimfahrt 600, Rückkehr nach 1800 Aufrufen; Gebiet in `seaRevealed`, Restladung im Lager, Fundstücke in `world.finds`, `expedition null`. Routenschiff: im Folgetick `to !== null` (mit `step`). Holzschären 2100, Nordgebiet 2700, Kartenstellen aus `cardsAfter`.
- **AK-09:** zu wenig Ware → Grund wörtlich, JSON-gleich; erlaubte Wahl verbraucht genau die Bedingung (auch zwei Waren); «Keine Karte offen» in `leg`; «Ungültige Option» für `'x'`, `2`, `null` und `'s'` an «Versunkene Glocke».
- **AK-10:** 10 Nahrung Wrackfeld, `'r'` an Karte 1 → Umkehr am Beginn von Abschnitt 4, `left 600`, `done false`; nach Rückkehr Gebiet nicht aufgedeckt, `world.finds` `[]`, Restladung im Lager. 3 Nahrung → Umkehr am Beginn von Abschnitt 2, `left 300`.
- **AK-14 (Rückkehr):** `clearRoute` in `leg` → nach Rückkehr `route null`, `homing false`, `port 0`.
- **AK-15:** erzwungener Brand, Sturm, Boom während `leg` (Bestand-Helfer per `rg -n "crisis = \{" tests/sim`): `world.expedition` nach jedem `step` gleich einem Lauf ohne Krise; Seerecht-Beschluss (`decree`) während `leg` ändert `left` nicht.
- **AK-16:** Rückkehr bei vollem Heimatlager → Lager = Grenze, Überschuss in `step(w).lost`.
- **AK-18** (`tests/sim/expedition-cards.test.ts`, `it.each` k = 0 … Kartenzahl, alle drei Gebiete): k-mal `'r'`, sonst `'s'`/`'detour'` → `world.finds` = erste k Stücke der Gebietsliste in Reihenfolge; Gebiet aufgedeckt.
- **AK-19 (Rest):** während `back` mit `finds` 2 ist `hasFind` für F1 falsch; nach der Rückkehr wahr; `laneTicksOf` erst danach verkürzt.
- **AK-21:** 10 Fahrten mit Umkehr (je Gebiet) plus je eine geschaffte Fahrt mit allen R → kein Stück doppelt, 8 Stücke, Meldung `'complete'` genau einmal über den ganzen Lauf.
- **AK-26:** `expedition null` → `JSON.stringify(w)` vor = nach `tickExpedition`, Rückgabe `[]`.
- **AK-34:** `'detour'` an Karte 1 (Wrackfeld) → `extra 2`, 6 Nahrung mehr verbraucht, Karte 2 bei `leg 6`; `'detour'` an der letzten Karte → 2 Abschnitte, dann `back`, `done true`; ohne Nahrung dabei Umkehr, kein Fund.
- **AK-35:** `'turn'` → `back`, `left 600`, `done false`, nach Rückkehr `world.finds` `[]`, Gebiet Nebel, Ware zurück.
- **AK-36:** `'remind'` genau einmal nach 3000 Aufrufen offener Karte (auch nach 6000 nur einmal); `'overflowAhead'` bei `left 300` in `back` nur mit Überlauf (Gegenfall ohne Überlauf: keine Meldung; Umkehr mit `backTicks` 300: Meldung im ersten `back`-Aufruf); `soleSpiceShip` wahr beim einzigen Gewürzschiff, falsch, sobald ein zweites Schiff Gewürz fährt.
- **Review Focus 3:** Schiff auf Route unterwegs (`to !== null`, `left` L) im Rückkehr-Tick mit F1 → `left` bleibt L; die nächste Abfahrt nutzt die verkürzte Zeit (P-4).
- **Review Focus 4:** Holzschären, Karte «Fest am Strand» gezogen, S-Option (4 Nahrung) bei 5 Nahrung an Bord → Umkehr am Beginn des nächsten Abschnitts, kein Fund (Spec §3.7 Punkt 4).
- **AK-39 (Rückkehr):** mit F7 Rückkehr entlädt Gewürz/Nahrung bis 120, Holz bis 100; ohne F7 alles bis 100.

## Schritte

- [ ] Tests schreiben; **Rot:** `npx vitest run tests/sim/expedition.test.ts tests/sim/expedition-cards.test.ts tests/sim/finds.test.ts tests/sim/finds-storage.test.ts; echo EXIT=$?` → ≠ 0.
- [ ] Umsetzen; StepReport-Literale (`rg -n "contract: null \}" tests src/ui`) ergänzen.
- [ ] **Grün:** derselbe Befehl → 0; `npx vitest run tests/sim/tick*.test.ts tests/sim/ships.test.ts tests/ui/ships.test.ts tests/sim/balance.test.ts tests/sim/imports.test.ts; echo EXIT=$?` → 0.
- [ ] Zeiten: `npx vitest run tests/sim/expedition*.test.ts tests/sim/finds*.test.ts --reporter=verbose; echo EXIT=$?` — kein Test > 500 ms (Ledger).
- [ ] Teilbeleg: `npx tsc --noEmit; echo EXIT=$?`, `make lint; echo EXIT=$?`, `make zeittests; echo EXIT=$?`, `make conflicts; echo EXIT=$?`.
- [ ] Commit `feat: NU-1 Expedition Ablauf, Wahl, Rückkehr, Fundstück-Vergabe (T05)`.
