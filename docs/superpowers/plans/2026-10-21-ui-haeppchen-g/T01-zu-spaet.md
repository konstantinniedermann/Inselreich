# T01 · P1 «Zu spät» an der Fern-Marke (I-155)

Umsetzer `tech-ui-engineer` · ≈ 45 Tools · AK G1 bis G9 · blocked-by: – · Spec: Teil P1 (Regeln 1 bis 6)

## Dateien

- ändern: `src/ui/farOrder.ts`, `src/ui/seaMapView.ts`, `src/render/seaMap.ts`, `tests/ui/farMark.test.ts`, `tests/ui/seaMapView.test.ts`, `tests/render/seaMapDraw.test.ts`
- neu: `tests/ui/farLate.test.ts`
- nicht ändern: `src/sim/`, `src/ui/hud.ts` (ruft `farMark(world)`, Signatur bleibt), `src/ui/homeTravel.ts` (nur nutzen)

## Verhalten

1. **`farLate(world, x: { island: number; amount: number; good: GoodId }, rest: number, lanes?: Lanes): boolean`** in `farOrder.ts`, liest nur die Welt. Falsch, wenn eine Bedingung fehlt: `rest ≤ 0`; `world.islands[x.island].kontorId === null` (dann gilt `warn`); `homeTravelTicks(world, x.island, lanes) === null`; `rest ≥ Fahrzeit` (strikt `rest < Fahrzeit` verlangt). Sonst `have = stock[good] der Fern-Insel + Σ ship.cargo[good] ?? 0 über Schiffe mit ship.to === x.island && ship.left <= rest`; Ergebnis `have < x.amount`. Nutzt `laneCache` über den Default von `homeTravelTicks`, nie `laneTicks`/`seaLanes` direkt.
2. **`MapMark`** (`seaMap.ts`): neue Felder `late: boolean` und `tip: string | null`; neue Farbe `COLORS.markLate` (Bernstein, klar verschieden von `markFill` `#f2c14e` und `markWarn` `#ff6b5a`, z. B. `#ff9f1c`; lesbar auf der Seekarte, Kontrast prüfen wie `markWarn`). Zeichner: `col = mark.warn ? markWarn : mark.late ? markLate : markFill` (Kontor-Warnung hat Vorrang, `late` ist dann ohnehin falsch).
3. **`farMark`** setzt `late` (aus `farLate` mit `rest = ticks`) und hängt bei `late` « · zu spät» an `text`; `tip = ticks_Fahrt === null ? null : \`Fahrzeit ≈ ${formatGameTime(fahrt)}, Rest ${formatGameTime(rest)}\` + (late ? ' · zu spät für Ware aus der Heimat' : '')`. Ohne `late`bleibt`text`zeichengleich zu heute (Z2). Die Fahrzeit holt`farMark`einmal über`homeTravelTicks`(Cache),`farLate`rechnet sie nochmals aus dem Cache (ein Lane-Lookup je Aufruf genügt;`seaLanes` je Welt höchstens einmal, AK-G8).
4. **`seaMapKey`**: `late` in die Markenzeile (`…:${m.warn ? 1 : 0}${m.late ? 1 : 0}`); sonst unverändert.
5. **`seaMapTip`**: hängt `m.tip` (falls nicht `null`) als **letzten** Abschnitt an (Trenner « · »); andere Inseln bitgleich.

## Testfälle (rot zuerst; Beleg im Bericht)

Neue Datei `tests/ui/farLate.test.ts` (Welt `farWorld(3, ['B'])`, `stepAt(w, periodStart(1))`, danach `acceptFarOrder(w)` für den Auftrag; Fahrzeit-Erwartung aus `homeTravelTicks(w, i)`, nie Literal):

- **AK-G1** Fahrzeit `T`: `rest = T − 1`, Lager 0 → `late`; `rest = T` → nicht `late`. (Spec nennt d=25, 250 Ticks als Beispiel; Test nimmt die Weltfahrzeit, plus ein Fall mit `T` gesetzt über eine injizierte `lanes`-Funktion `() => [{ a: 0, b: i, d: 25 }]` mit Cache-Typ `Lanes`.)
- **AK-G2** Lager = Menge → nicht `late`; Lager < Menge → `late`; Schiff `{to: i, left: rest, cargo: {good: amount}}` → nicht `late`; `left: rest + 1` → `late`; Schiff mit `to: andere Insel` oder `to: null` → `late`; Menge auf zwei Schiffen summiert sich.
- **AK-G3** `dropKontor(w, i)`: `farMark(w).warn === true`, `late === false`.
- **AK-G4** Lanes-Provider `() => []` → `late` falsch, `tip === null`, `seaMapTip` ohne «Fahrzeit», kein Wurf.
- **AK-G5** `farMark.text` endet bei `late` auf « · zu spät», sonst genau die Vorgängerform; für `kind 'order'` und `kind 'offer'`.
- **AK-G7** `seaMapTip` auf der Fern-Insel enthält «Fahrzeit ≈ {t}, Rest {r}» genau einmal (`split` zählen); bei `late` zusätzlich «zu spät für Ware aus der Heimat».
- **AK-G8** injizierter zählender `Lanes`-Provider über `createLaneCache(count)`: `farMark(w)` + `seaMapKey(w, l)` + `seaMapTip(…)` je Welt `count === 1`. Hinweis: `farMark`/`seaMapKey` benutzen den Standard-`laneCache`; der Test spionagt `seaLanes` (`vi.spyOn` auf `../../src/sim/islands` ist bei ES-Modulen nicht immer möglich) oder prüft den Cache-Vertrag über neue Welt je Test und einen optionalen `lanes`-Parameter an `farMark(world, lanes?)` (erlaubt, Standardwert `laneCache`; `seaMapKey` ruft ohne Parameter). Der Umsetzer wählt die einfachere Form und nennt sie im Bericht.
- **AK-G6** `tests/render/seaMapDraw.test.ts`: `mk()` bekommt `late: false, tip: null`; M6a erweitert: `late: true` → Text-Füllung und Strichfarbe `markLate`; `warn: true, late: true` → `markWarn`; sonst `markFill`.
- **Bestand:** `tests/ui/farMark.test.ts` AK-M5 und `tests/ui/seaMapView.test.ts` mit den genauen neuen Strings anpassen (Tooltip endet jetzt auf `tip`; `toBe`, nie `toContain`-Aufweichung). Welten ohne Fern-Marke: Tooltip/Key bitgleich.
- **AK-G9** nur Lauf: `git diff main -- src/sim` leer; `SAVE_VERSION` unberührt.

## Prüfschritte / Task-Review

Gezielte Tests laut index.md (Exit 0), `npx tsc --noEmit; echo EXIT=$?`, eslint/prettier der geänderten Dateien. Reviewer: `farLate` liest nur `world`; `seaLanes`/`laneTicks` nicht je Frame; `hud.ts` ohne Diff; Zeit-Erwartungen über `formatGameTime`.
