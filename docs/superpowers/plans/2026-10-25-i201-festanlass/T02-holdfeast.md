# T02 `holdFeast` mit Art, Sperren, Inselsperre

Persona `tech-sim-engineer` · Strang A · Tools ≈ 55 · AK-FE2, FE3, FE4, FE5, FE6, FE15 (`feast.ts`-Teil), Review Focus 5 · blocked-by T01.

**Files:** Modify `src/sim/feast.ts`, `src/sim/islands.ts` (neu: `noKontorTrade`), `src/sim/trade.ts` (nur Verschiebung und Re-Export), `tests/sim/feastKinds.test.ts`, `tests/sim/feast.test.ts` (Strukturtest Rum ersetzen).

**Interfaces:**

- Consumes (T01): `FEAST_KINDS`, `FeastKind`, `isFeastKind`, `feastKindOf`, `feastState`, `chapelWorks`, `inChapelRadius` (aus `./feastEffect`); `takeStock` aus `./economy`.
- **P-11 kein neuer Importzyklus:** `feast.ts` darf `./trade` nicht importieren (`trade → trial`/`unlocks → population → feast`). `noKontorTrade(world, island): string | null` wandert unverändert im Text nach `src/sim/islands.ts` (neben `islandName`; `islandAt` dort als Einzeiler `Number.isInteger(island) ? (world.islands[island] ?? null) : null` inline, weil `placement` `islands` importiert). `trade.ts` braucht es selbst (eigene Aufrufe in `buy`/`sell`), darum **lokal importieren und re-exportieren (P11-a):** `import { islandName, noKontorTrade } from './islands';` plus `export { noKontorTrade } from './islands';` — `orders.ts`, `reserve.ts`, `tests/sim/reserve.test.ts` bleiben unverändert. **P11-c:** Der inline-`islandAt` in `islands.ts` bekommt einen Kommentar als bewusste DRY-Ausnahme: «gleich `placement.islandAt`; inline, weil `placement` `islands` importiert (Zyklus); bei Änderung beide nachziehen».
- Produces (T03, T06):

```ts
export function holdFeast(world: World, id: number, kind: string = 'ascension'): Result;
export function feastBlockReason(
  world: World,
  chapel: Building,
  kind: string = 'ascension',
): string | null;
```

## Prüfreihenfolge (Spec Regel 2, erster Treffer gewinnt, bei fail Welt unverändert)

1. kein Gebäude oder `service !== 'faith'` → «Keine Kapelle» (nur `holdFeast`);
2. `!isFeastKind(kind)` → «Unbekannte Festart»;
3. allgemeine Sperren unverändert: «Fest läuft», «Abklingzeit», «Kapelle brennt», «Kapelle nicht angebunden»;
4. Sperre der Art: `ascension` → `taxBlock` (wie heute); `scope === 'island'` → zuerst Inselsperre `` `${FEAST_KINDS[kind].name} auf der Insel: Abklingzeit` `` (andere Kapelle `o` mit `o.id !== chapel.id`, `o.island === chapel.island`, `o.feastAt !== undefined`, `feastKindOf(o) === kind`, `world.tick − o.feastAt < FEAST_COOLDOWN`; Brand egal), dann `harvest` → «Kein Betrieb im Umkreis» (kein Gebäude mit `BUILDING_DEFS[defId].cycle !== undefined` und `inChapelRadius(world, chapel, b)`; stillgelegte zählen), `market` → `noKontorTrade(world, chapel.island)`;
5. Waren: `goodsShortage(world, chapel, kind)` geht über `Object.entries(FEAST_KINDS[kind].cost)` in Schlüsselreihenfolge, erste fehlende Ware → `` `Zu wenig ${GOODS[g].name} (${Math.floor(stock)} / ${n})` ``;
6. Erfolg: eine Schleife über `cost` mit **genau einem** `takeStock(islandOf(world, chapel), g, n)`-Aufruf; `chapel.feastAt = world.tick`; `ascension` → `delete chapel.feastKind`, sonst `chapel.feastKind = kind`.

`feastBlockReason` = Schritte 2 bis 5 ohne Abbuchung (rein lesend). `spendRum`/`rumShortage` entfallen.

## Schritte

- [ ] **Tests zuerst** in `tests/sim/feastKinds.test.ts`. Aufbau wie `tests/sim/feast.test.ts` (`createWorld(3, { unlockAll: true })`, `houseNearKontor`, `placeService(w, 'chapel', …)`, `w.tick = 1000`); Betrieb im Radius per `putBuilding(w, 0, 'weaver', …)` (Def-Id per `rg -n "cycle: 20|id: '" src/sim/defs/buildings.ts` prüfen; Werkstatt mit Zyklus). Ein lokaler Helfer `stockOf(w, chapel)` = `islandOf(w, chapel).stock`.
  - **AK-FE2:** Zwei gleiche Welten; in w1 `holdFeast(w1, id)`, in w2 `holdFeast(w2, id, 'ascension')`, in w3 manuell `chapel.feastAt = tick; stock.rum -= 10`. Alle drei `serialize` gleich; `'feastKind' in chapel` falsch.
  - **AK-FE3:** `holdFeast(w, id, 'harbor')` → `{ ok: false, reason: 'Unbekannte Festart' }`, `JSON.stringify(w)` gleich vorher. Nach erfolgreichem Aufstiegsfest (Fest läuft) liefert `'harbor'` weiterhin «Unbekannte Festart».
  - **AK-FE4:** Rum 30, Stoff 7: `harvest` → «Zu wenig Stoff (7 / 15)», Rum bleibt 30. Rum 3, Stoff 0: «Zu wenig Rum (3 / 10)». Rum 30, Glas 2: `market` → «Zu wenig Glas (2 / 5)». Erfolg je Art: Rum −10 und Stoff −15 bzw. Glas −5, sonst kein Lagerwert geändert. Rum 9,5 (Bruch) → «Zu wenig Rum (9 / 10)».
  - **AK-FE5:** Amtsstube und `setAllTax(w, 'high')` (Muster `feast.test.ts` «Steuer hoch», danach `chapel.connected = true`): `ascension` gesperrt, `harvest` und `market` ok. Kapelle ohne Betrieb im Radius: `harvest` → «Kein Betrieb im Umkreis»; stillgelegter Betrieb (`paused: true`) im Radius → ok. Betrieb auf Insel 1 an denselben Koordinaten zählt nicht (`twoIslandWorld`). `market` auf Insel 1 mit `w.islands[1]!.kontorId = null` → genau der Text von `noKontorTrade(w, 1)`. Für jede Art und jeden dieser Fälle: `feastBlockReason(w, c, kind)` gleich dem Grund von `holdFeast` und `JSON.stringify(w)` unverändert durch `feastBlockReason`; bei freier Kapelle `null`.
  - **AK-FE6:** zwei Kapellen K1, K2 auf der Heimat, je ein Betrieb im Radius. `harvest` an K1 bei Tick t. K2: `harvest` bei t + 1799 → «Erntefest auf der Insel: Abklingzeit», bei t + 1800 ok (Lager jeweils auffüllen); `market` und `ascension` an K2 sofort ok (eigene Welt je Fall). Analog Markttag → «Markttag auf der Insel: Abklingzeit». `twoIslandWorld`: Erntefest an Heimat-K1 sperrt eine Kapelle auf Insel 1 nicht. Abriss von K1 (`demolish(w, K1.id)`) → `harvest` an K2 sofort ok. **Achtung:** `demolish` ruft `recomputeConnectivity`; danach `K2.connected = true` und Betriebe wieder `connected = true` setzen, sonst prüft der Test «nicht angebunden». Brand an K1 (`outageUntil = tick + 100`) während ihres Erntefests → Sperre an K2 bleibt.
  - **Review Focus 5:** Kapelle auf Insel 1 (`twoIslandWorld`, Rum und Stoff nur im Lager von Insel 1, Betrieb dort im Radius): `harvest` ok, Lager Insel 1 −10 Rum −15 Stoff, Heimatlager unverändert; Ware nur im Heimatlager → «Zu wenig …».
- [ ] **Strukturtest ersetzen** (`tests/sim/feast.test.ts`, «Aufbau von feast.ts»): «greift nur an einer Stelle auf Rum zu» → «genau ein `takeStock`-Aufruf» auf dem Quelltext ohne Kommentare (`src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')`, `match(/takeStock\(/g)` Länge 1). Zusätzlich in `feastKinds.test.ts` (AK-FE15, `feast.ts`-Teil): derselbe Quelltext ohne Kommentare enthält weder `/\b(75|125|15)\b/` noch `'cloth'`, `'glass'`, `'rum'`.
- [ ] **Rot-Lauf:** `npx vitest run tests/sim/feastKinds.test.ts tests/sim/feast.test.ts; echo EXIT=$?` → Exit ≠ 0.
- [ ] **Strukturtest P-11** (`feastKinds.test.ts`, `describe('AK-FE21 Importstruktur (Blatt)')` ergänzen): `src/sim/feast.ts` importiert nicht `./trade`; `src/sim/islands.ts` importiert nur `./mapgen`, `./rng`, `./types`, `./defs/…`; **transitiv (P11-b):** `importClosure('src/sim/islands.ts')` (Helfer aus T01) enthält weder `feast` noch `population`.
- [ ] **Umsetzen** nach der Prüfreihenfolge; zuerst `noKontorTrade` verschieben, `npx vitest run tests/sim/reserve.test.ts tests/sim/orders*.test.ts; echo EXIT=$?` grün (Charakterisierung der Verschiebung).
- [ ] **Grün:** `npx vitest run tests/sim/feastKinds.test.ts tests/sim/feast.test.ts tests/sim/council.test.ts tests/sim/edicts.test.ts tests/ui/feast.test.ts; echo EXIT=$?` → 0 (alle AK-I007-xx unverändert grün).
- [ ] **Teilbeleg:** `npx tsc --noEmit`, `make lint`, `make zeittests`, `make conflicts`, je `; echo EXIT=$?`.
- [ ] **Commit:** `git add src/sim/feast.ts src/sim/islands.ts src/sim/trade.ts tests/sim/feastKinds.test.ts tests/sim/feast.test.ts` · `feat: holdFeast mit Festart und Inselsperre (I-201 T02)`.
