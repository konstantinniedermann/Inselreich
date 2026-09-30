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
