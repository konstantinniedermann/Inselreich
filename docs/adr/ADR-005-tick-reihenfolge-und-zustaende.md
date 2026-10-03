# ADR-005: Tick-Reihenfolge und Zustandssemantik der Gebäude

Status: akzeptiert · Datum: 2026-09-30 · Nachtrag M5 (Markt-Erholung, Handelsaufträge): 2026-09-30, siehe unten

## Kontext

Unterhalt, Steuern, Wachstum und Aufstieg laufen in festen Takten (100 bzw. 50 Ticks).
Ob `world.tick` vor oder nach den Systemen erhöht wird, entscheidet, wie viele Buchungen in
einer Anzahl Schritte stattfinden. Die Gebäudezustände (`waitingInput`, `storageFull`,
`notConnected`) sind das einzige Feedback an den Spieler, warum etwas nicht produziert.

## Entscheidung

- `step(world)` erhöht **zuerst** `world.tick`, dann laufen die Systeme in der Reihenfolge
  Produktion → Bevölkerung → Steuern → Wirtschaft (Unterhalt) → Sieg. `world.tick` zählt
  damit abgeschlossene Schritte; ein Takt von 100 bucht bei Tick 100, 200, 300 …
- Zustände bleiben bestehen, bis ihre Ursache behoben ist: `storageFull` bis zur nächsten
  eingelagerten Einheit, `waitingInput` bis der Input entnommen werden konnte,
  `notConnected` bis zur Wiederanbindung (setzt dann `ok`; andere Zustände werden im
  nächsten Tick von der Produktion neu abgeleitet).
- Dieselbe Konvention gilt für Häuser: `satisfied`/`services`/`supplied` werden jeden Tick
  neu abgeleitet und nie durch einen Übergang „vorzeitig" auf gut gesetzt.

## Konsequenzen

- Tests können Buchungen exakt vorhersagen (300 Schritte = 3 Buchungen).
- Das Inspect-Panel zeigt Probleme dauerhaft statt nur für einen Tick.
- Wer neue Takte einführt, orientiert sich an `tick % INTERVAL === 0` mit `tick > 0`.

## Nachtrag M5 (2026-09-30): Markt-Erholung und Handelsaufträge

- Die Reihenfolge lautet jetzt Produktion → Bevölkerung → Steuern → Wirtschaft (Unterhalt) →
  Markt (`tickMarket`) → Aufträge (`tickOrders`) → Sieg. Aufträge laufen nach der Bevölkerung, damit
  ein Aufstieg im selben Tick die Höchststufe und damit den Güterpool schon erweitert.
- `tickMarket` und `tickOrders` verändern kein Geld und keine Lagerbestände.
- Beide Takte haben einen eigenen Rhythmus, unabhängig vom Buchungstakt (100): Erholung alle 10 Ticks
  (`tick % 10 === 0`, `tick > 0`); Aufträge ab Tick 600 alle 900 Ticks (Versatz 600,
  `(tick − 600) % 900 === 0`), Laufzeit 600. Ein Auftrag ist bis einschliesslich `due` lieferbar und
  verfällt bei `tick > due`. Der Zufall der Aufträge folgt ADR-010.

## Nachtrag M6 (2026-09-30): Krisen

- Die Reihenfolge lautet jetzt Produktion → Bevölkerung → Steuern → Wirtschaft (Unterhalt) → Markt → Aufträge →
  **Krisen (`tickCrises`)** → Sieg. Der Krisenschritt läuft nach der Bevölkerung (Höchststufe für den Boom-Pool
  wie bei den Aufträgen) und nach der Buchung (eine Instandsetzungsgebühr ändert Steuer und Unterhalt des Ticks
  nicht). Ein Schritt `T` produziert noch normal; der Ausfall gilt in den Schritten `T + 1 … T + 200`.
- **Takt mit Versatz:** Krisen beginnen bei `tick ≥ 2400 && (tick − 2400) % P === 0` (`P` 600 bei `normal`,
  1200 bei `mild`, keine bei `off`). Wie die Aufträge weicht das bewusst von `tick % INTERVAL === 0` ab.
- **Zustand `burning`:** gesetzt beim Brandbeginn zusammen mit `outageUntil`; er hat Vorrang vor
  `notConnected` (Produktion und `recomputeConnectivity` lassen ihn stehen) und endet am Ende des Schritts
  `outageUntil` mit `connected ? 'ok' : 'notConnected'`. Massgeblich für den Ausfall ist `outageUntil`.

## Nachtrag M8 (2026-10-02): Inputs als Liste, zweites Ziel

- **Inputs als Liste, atomar entnommen:** `BuildingDef.consumes` ist `readonly GoodId[]` (je 1 Einheit je Zyklus).
  Bei `progress 0` entnimmt ein Betrieb je 1 Einheit aller Inputs nur, wenn jeder Input mit Bestand ≥ 1 im Lager
  liegt; sonst entnimmt er nichts. Es gibt keinen Teilzyklus und keine Reservierung.
- **`waitingInput` bis alle Inputs entnommen werden konnten.** Konkurrieren Betriebe um die letzte Einheit, gewinnt
  die kleinere Id (Iterationsreihenfolge von `world.buildings`). Ein-Input-Betriebe verhalten sich wie bisher.
- **Siegschritt setzt `won`, dann `wonMerchants`:** erst `won` bei `citizens ≥ WIN_CITIZENS` (Bürger und höher),
  danach `wonMerchants` bei `won && merchants ≥ WIN_MERCHANTS`. Beide werden nie zurückgesetzt. Die Reihenfolge der
  Systeme bleibt; die Sperre der Stufe 4 liest `won` aus dem Vorschritt, der früheste Aufstieg 3 → 4 liegt bei
  `W + 50`.

## Nachtrag M10 (2026-10-03): Freischaltung am Ende des Schritts, Zustand `noService`

- **`tickUnlocks` ist der letzte Aufruf in `step`**, nach `checkWin`. Begründung: Der Controller liest vor Schritt
  t+1 genau den Zustand, den `tickUnlocks` am Ende von Schritt t gesehen hat; nur so ist der Referenzlauf bitgleich
  (Spec 9.1, BG-1: `winTick` 6050, `minMoney` 57).
- **Freischaltung ist gespeichert und monoton** (`world.unlocked`, nie zurückgesetzt). Bedingungen, die sich ändern
  können (Amtsstube aktiv, Schule in Reichweite, Krisenstufe), sind live und nicht gespeichert.
- **Sperren prüfen zuerst:** `canPlace` (`buildLock`), `buy` (`goodLock`) und `deliverOrder` (`functionLock`)
  scheitern vor allen anderen Regeln mit dem Sperrgrund; `sell`, `tickOrders` und bereits stehende Gebäude bleiben
  unberührt.
- **Neuer Zustand `noService`** (ab Task 4, Amtsstube) mit der Prüfreihenfolge Ausfall → Anbindung → Dienst →
  Sturm → Input.
