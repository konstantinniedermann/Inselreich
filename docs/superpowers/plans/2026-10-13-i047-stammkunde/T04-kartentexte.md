# T04 — Kartentexte, Warnzustand, Meldungen als reine Helfer (AK-SK-28)

Paket I047-UI. Persona `tech-ui-engineer`. Start erst nach Merge von UI-HAEPPCHEN-A und `git merge main` im Worktree
(Controller). Schätzung ≈ 15 Tools. Dateien: `src/ui/order.ts` (nur reine, DOM-freie Funktionen),
`tests/ui/order.test.ts`.

## Kontext (nur das)

- `src/ui/order.ts`: `orderCardText(world, island)`, `deliveredMessage`, `orderVisible`; Zeitformat `formatGameTime`
  (`src/ui/time.ts`: unter 60 s «30 s», sonst «m:ss»).
- Sim (aus I047-SIM): `world.contract`, `world.contractOffer`, `ContractEvent` (`types.ts`), `StepReport.contract`
  (`tick.ts`), `contractUnitPrice` (`orders.ts`), `nextOrderTick`, `noKontorTrade` (`trade.ts`), `islandName`
  (`islands.ts`), `ORDER_PERIOD` (`defs/timing.ts`), `HOME` (`world.ts`).
- `SoundEvent` (`src/audio/sound.ts:40`, nur `import type`); `showMessage(text, kind)` mit `'info' | 'warn' | 'error'`.

## Wortlaut (Spec B.4, Insel-Zusatz nach Entwurf L0 2)

`Z(i)` = `''` für `HOME`, sonst `` ` auf ${islandName(world, i)}` ``; `m`, `p` beim Angebot aus den Defs
(`GOODS[g].order!.contract`, `contractUnitPrice(g)`), beim Vertrag aus `world.contract`; `rest =
formatGameTime(nextOrderTick(world) - world.tick)`; `takt = formatGameTime(ORDER_PERIOD)` («1:30»).

| Fall                  | Text                                                                               | Art / Klang       |
| --------------------- | ---------------------------------------------------------------------------------- | ----------------- |
| Angebot               | `Stammkunde: ${m} ${Gut}${Z} alle ${takt} zu ${p} je Stück · Angebot noch ${rest}` | Karte             |
| Vertrag aktiv         | `Stammkunde: ${m} ${Gut}${Z} · nächste Lieferung ${rest} · Lager ${x}/${m}`        | Karte             |
| vereinbart            | `Stammkunde: ${m} ${Gut}${Z} alle ${takt} vereinbart`                              | info, kein Klang  |
| geliefert             | `Stammkunde: ${amount} ${Gut} geliefert, +${pay}`                                  | info, `orderDone` |
| Bruch `stock`         | `Stammkunde abgesprungen: zu wenig ${Gut}. Strafe ${penalty}`                      | warn, `error`     |
| Bruch `kontor`        | `Stammkunde abgesprungen: kein Kontor auf ${Insel}. Strafe ${penalty}`             | warn, `error`     |
| Bruch `lock`/`island` | `Stammkunde abgesprungen. Strafe ${penalty}`                                       | warn, `error`     |
| gekündigt             | `Stammkunde gekündigt`                                                             | info, kein Klang  |

`x` = Lager der **Lieferinsel** `world.islands[contract.island].stock[good]`, unabhängig von der aktiven Insel.

## Tests zuerst (Rot-Beleg) — `tests/ui/order.test.ts` (erweitern)

Welten aus `createWorld(3, { unlockAll: true })` bzw. `tests/ui/worlds.ts`, Felder direkt gesetzt; Rum, Tick so, dass
`nextOrderTick - tick` = 450 («45 s») bzw. 750 («1:15»).

- [ ] Angebot Heimat: `orderCardText(w)` genau «Stammkunde: 5 Rum alle 1:30 zu 27 je Stück · Angebot noch 1:15».
- [ ] Angebot Insel 1: Text mit « auf <Name Insel 1>» hinter «Rum».
- [ ] Aktiv Heimat, Lager 12: «Stammkunde: 5 Rum · nächste Lieferung 1:15 · Lager 12/5»; aktiv Insel 1, aktive
      Insel `HOME`, Heimat Rum 0, Insel 1 Rum 3: Text enthält «auf <Name>» und «Lager 3/5» (Aufruf mit `island =
HOME`).
- [ ] `contractWarn(w)`: Lager 4/5 → `true`; 5/5 → `false`; Lieferinsel ohne Kontor (`kontorId = null`) → `true`;
      ohne Vertrag → `false`.
- [ ] Ohne Vertrag und Angebot: bisherige Texte unverändert (bestehende Fälle bleiben grün).
- [ ] `contractNotice(ev, w)` für `delivered` und jede der vier Bruchgründe: genau Text, Art und Klang aus der Tabelle;
      `contractAgreedMessage(w)` und `CONTRACT_CANCELLED` genau.
- [ ] **Klang-Spy:** `announceContract(reports, out)` mit `out = { show: vi.fn(), play: vi.fn() }`: Berichte `[{ lost:
[], contract: null }, { lost: [], contract: delivered }]` → `show` einmal mit (Text, `'info'`), `play` einmal mit
      `'orderDone'`; Bruch → `play('error')`, `show(…, 'warn')`; nur `null` → keine Aufrufe.
- [ ] `npx vitest run tests/ui/order.test.ts; echo EXIT=$?` → `EXIT=1`, Beleg.

## Umsetzung (`src/ui/order.ts`, DOM-frei)

- [ ] `orderCardText(world, island = HOME)`: Reihenfolge `contract` → `contractOffer` → bisher. Kein Parameter
      hinzu (Aufrufer `time.test.ts`, `hud.ts` bleiben).
- [ ] Exporte: `contractWarn(world): boolean`, `contractAgreedMessage(world): string` (liest `world.contract` nach
      dem Annehmen), `CONTRACT_CANCELLED = 'Stammkunde gekündigt'`, `contractNotice(ev: ContractEvent, world):
{ text: string; kind: 'info' | 'warn'; sound: SoundEvent }`, `announceContract(reports: readonly StepReport[],
out: { show(text: string, kind: 'info' | 'warn'): void; play(e: SoundEvent): void }, world: World): void`.
- [ ] Kein Spielwert als Literal: 5, 27, 135 nur in Tests; Texte bilden sich aus Defs und Ereignis.
- [ ] Grün: `npx vitest run tests/ui/order.test.ts tests/ui/time.test.ts; echo EXIT=$?` → `EXIT=0`; `npx tsc
--noEmit; echo EXIT=$?` → `EXIT=0`.
- [ ] Commit `feat: Stammkunde-Kartentexte und Meldungen (AK-SK-28)`.
