# Balancing-Revision — Kurz-Spec (Ergänzung zur Design-Spec)

Datum: 2026-09-30 · Status: freigegeben (Projektleitung) · Umsetzung: M4 Task 3

## Problem

Das Gesamt-Review von M3 hat mit Sonden gezeigt: Zeitlich sind 50 Bürger in ~1000 Ticks erreichbar,
wirtschaftlich aber nicht. Nettobilanz je Einwohner pro 100 Ticks (Steuer minus anteiliger Unterhalt
der Versorgungskette): Pionier +1.0, Siedler −1.1, Bürger −2.9; dazu Kapelle 15 und Schule 25 fix.
Jede Stufe über Pionier ist dauerhaft defizitär, Werkzeug (nur kaufbar) verschlingt ~6000 Geld.

## Ziel

- Jede Stufe ist mit eigener Versorgungskette im Dauerbetrieb **positiv**; höhere Stufen lohnen sich mehr.
- Eine gestaffelt ausgebaute Kolonie erreicht 50 Bürger in ≤ 9000 Ticks mit 5000 Startgeld,
  ohne dauerhaft negatives Geld (Schuldenphasen beim Ausbau sind erlaubt, Ende positiv).
- So wenig Stellschrauben wie möglich; Zyklen, Baukosten und Unterhalt bleiben unverändert.

## Entscheidung (Werte)

| Wert                                     | bisher | neu | Begründung                                    |
| ---------------------------------------- | ------ | --- | --------------------------------------------- |
| Steuer Pioniere                          | 2      | 2   | bereits positiv                               |
| Steuer Siedler                           | 3      | 6   | Stoffkette kostet ~2.5/Einwohner → netto +2.5 |
| Steuer Bürger                            | 5      | 12  | Stoff + Rum ~5.5/Einwohner → netto +5.5       |
| Verbrauch Stoff je Einwohner / 100 Ticks | 0.25   | 0.2 | weniger Weberei-Paare je Haus (Gebäudezahl)   |
| Verbrauch Rum je Einwohner / 100 Ticks   | 0.25   | 0.2 | dito für Brennerei-Paare                      |

Rechnung je Einwohner pro 100 Ticks (Unterhalt Kette ÷ versorgte Einwohner):
Nahrung 5 ÷ 5 = 1.0 · Stoff (10 + 15) × 0.2 ÷ 2 = 2.5 · Rum (10 + 20) × 0.2 ÷ 2 = 3.0.
Siedler: 6 − 3.5 = **+2.5** · Bürger: 12 − 6.5 = **+5.5** · Pionier: 2 − 1.0 = **+1.0**.
Beispiel Endzustand 4 Bürgerhäuser (60 Einwohner): +330 − 40 (Kapelle, Schule) = **+290 / 100 Ticks**.

Werkzeugpreis bleibt 40: Mit positiver Bilanz amortisiert sich der Kauf; eine Werkzeugproduktion
ist Backlog (kein neuer Inhalt im MVP).

## Erfolgskriterium (Test)

`tests/sim/balance.test.ts` baut eine Kolonie gestaffelt (Nahrung → Häuser → Kapelle → Stoffkette →
Rumkette → Schule, Häuser nachziehen, Werkzeug/Holz kaufen) und verlangt: `citizens ≥ 50` bei
`tick ≤ 9000` **und** `money > 0` am Ende. Schlägt der Test mit den neuen Werten fehl, gilt die
Eskalationsstufe Steuer Siedler 7 / Bürger 14; alles Weitere braucht eine neue Kurz-Spec.

## Folgeänderungen

- `src/sim/defs/tiers.ts` (tax, needs), Spec-Tabelle 2.7 nachführen, README-Abschnitt Bevölkerung
  (Zahlen, falls genannt), `docs/beobachtungen.md` Eintrag als erledigt markieren.
