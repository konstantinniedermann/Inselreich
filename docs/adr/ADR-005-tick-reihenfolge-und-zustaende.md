# ADR-005: Tick-Reihenfolge und Zustandssemantik der Gebäude

Status: akzeptiert · Datum: 2026-09-30

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
  (`tick % 10 === 0`, `tick > 0`); Aufträge ab Tick 600 alle 900 Ticks (Versatz 600, `(tick − 600) %
900 === 0`), Laufzeit 600. Ein Auftrag ist bis einschliesslich `due` lieferbar und verfällt bei
  `tick > due`. Der Zufall der Aufträge folgt ADR-010.
