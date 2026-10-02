# ADR-010: Zufall je Periode aus dem Seed statt RNG-Strom im Save

Status: akzeptiert · Datum: 2026-09-30 · Spec:
[M5 Spielerlebnis](../superpowers/specs/2026-09-30-m5-spielerlebnis-design.md) (Abschnitt 5.3)

## Kontext

Handelsaufträge (Gut, Menge) brauchen Zufall. Bisher nutzte die Simulation im Spielverlauf keinen:
`step()` zieht keine Zufallszahlen, nur die Kartenerzeugung nutzt den seeded RNG (`rng.ts`). Ein
laufender RNG-Strom müsste im Save mitgeführt werden (Format, Migration, jede Änderung an der
Reihenfolge der Ziehungen verschöbe alle späteren Ergebnisse) und wäre anfällig dafür, dass Laden
den Verlauf verändert.

## Entscheidung

Der Zufall eines Auftrags wird je Periode `k` neu abgeleitet: `createRng((seed ^ Math.imul(k + 1,
0x9e3779b1)) >>> 0)`, eine frische Instanz je Periode (`orderForPeriod` in `src/sim/orders.ts`). Die
Funktion ist rein; Eingaben sind Seed, Periode und höchste Hausstufe. Kein RNG-Zustand liegt in der
Welt oder im Save.

## Konsequenzen

- Gleicher Seed, gleiche Periode und gleiche Höchststufe ergeben denselben Auftrag, auch über
  Speichern und Laden (Test AK-S2-12).
- `step()` zieht sonst keinen Zufall; es wird keine bestehende Folge verschoben.
- Die Höchststufe zum Angebotszeitpunkt ist Teil der Eingabe: ein Aufstieg im selben Tick zählt
  (Bevölkerung vor Aufträgen, ADR-005 Nachtrag).
- Die Simulation bleibt ohne Uhr und ohne DOM; arc42 §8 nennt den seed-abgeleiteten Zufall.
- Wer weiteren Zufall braucht, leitet ihn nach demselben Muster je Ereignis aus Seed und einem
  Zähler ab und legt keinen RNG-Strom in den Save.

## Nachtrag M6 (2026-09-30): Krisen

- Krisen nutzen eine **zweite Konstante** `CRISIS_SALT = 0x85ebca6b` (`src/sim/defs/crises.ts`):
  `createRng((seed ^ Math.imul(k + 1, CRISIS_SALT)) >>> 0)`, eine eigene Instanz je Krisenperiode `k`
  (`rollCrisis` in `src/sim/crises.ts`). Aufträge und Krisen ziehen damit unabhängig voneinander.
- **Feste Zug-Reihenfolge:** r1 → Art (`floor(r × 100)` gegen die kumulierten Gewichte fire, storm, boom);
  Brand mit Rechteck r2 → x, r3 → y; Boom r2 → Gut aus dem Auftragspool der Höchststufe. Eine neue Ziehung
  kommt nur hinten dazu, sonst verschieben sich alle Tests (AK-S1-07, AK-S1-08).
- Der Save trägt keinen RNG-Zustand, nur das Ergebnis (`world.crisis`); das Brandziel hängt vom Gebäudestand ab
  und wird deshalb gespeichert.
