# Anhang 06 · Nachtrag R999 (Wertprüfung B3/B9): Regeln R-BS-5, R-BS-6 und Abnahmekriterien

Gehört zu [I-210 Bittschrift](../2026-10-25-i210-bittschrift-design.md) §10 und §12. Grundlage: Ruling R999 und
`docs/superpowers/specs/2026-10-26-i210-b3-wertpruefung.md` (Branch `design/pool-b3`; Rechnung, nicht gemessen). Werte
bleiben unverändert (`OVERCROWD_PCT`, Bitten B3 und B9 in `src/sim/defs/petitions.ts`); dieser Nachtrag ändert nur
Testlagen (Anhang 01) und Regeltext. Umsetzungsstand: `feat/i210` @ `7df6518b` (Lagen in `tests/sim/petitionWorlds.ts`).

## Regeln (Spec §10)

- **R-BS-5 Eine knappe Kette macht «Ja» nicht falsch.** B3 «Ja» in der Lage «eine einzelne Kette knapp, übrige voll»
  ist richtig (Kaufmann-Steuer 220 je Glas gegen Verkauf 20, kein Dominanzfehler). «Nein» ist besser, wenn zwei oder
  mehr Ketten schlank sind (Lage B3-Nein, Anhang 01). Die Wahl liegt in der Lage der Stadt, nicht in der Karte.
- **R-BS-6 B9 wirkt nur gegen Stürme nach der Genügsamkeitsfrist oder durch Verkauf vor Ablauf.** Ein Sturm innerhalb
  der Frist des Nein-Zweigs (`FRUGAL_TICKS` = 1800) trifft beide Zweige ähnlich; B9-Ja lohnt, wenn der Sturm danach
  kommt oder wenn der Spieler den Zusatzraum vor Ablauf (Ende `duration` 6000) verkauft. B9 «Nein» schont die
  Nahrung, solange kein Sturm droht. Der Befund B9 −74 in der Lage «Sturm in der Frist» ist ein Patt der Lage, kein
  Wertfehler (R999).

## Abnahmekriterien

- **AK-BS-26 B3-Lagen (Anhang 01):** In `petitionsDominance-b1b3` bildet die B3-Nein-Lage «P3a, alle Ketten ü = 0,
  Glas 26» ab; Erwartung Nein > Ja, Ja-Lage unverändert Ja > Nein. Die Lage prüft ihre Vorbedingung: im Ja-Zweig
  Zukaufbedarf oder Mangel (sonst ist die Lage falsch gebaut). Zusatzprüfung R-BS-5 (nur Rangfolge): Mit nur Glas knapp
  und übrigen Ketten ü = 20 % gewinnt «Ja».
- **AK-BS-27 B2-Nein und P1:** B2-Nein-Lage und B1-/B8-Nein-Lagen verwenden P1 mit vier Häusern zu je 15 Bewohnern;
  die Bitte B2 kostet dort 12 Rum (Test prüft `amount === 12` und den Lagerstand Rum 12).
- **AK-BS-28 B9-Ja mit Sturm (R-BS-6):** Die B9-Ja-Lage setzt `world.crisis` auf einen Sturm ab `answerAt + 2400`
  (Dauer `STORM_DURATION`), `crisisLevel` bleibt `'off'`; 11 Bürgerhäuser, ü = 10 %, Lager je 100. Vorbedingung:
  im Nein-Lauf fällt Nahrung im Sturm auf 0 (Mangel), im Ja-Lauf nicht. Erwartung: Ja > Nein; Mass wie AK-BS-04
  (Nettowert). Die Nein-Lage bleibt «Krisen aus, Lager Nahrung 90, ü = 0».
- **AK-BS-29 B9-Zusatzmass «Lagerwert bei Wirkungsende»:** Bleibt in AK-BS-28 der Abstand Ja − Nein unter +50, gilt
  zusätzlich in beiden Lagen das Mass Geld + Σ Lager × `GOODS[g].sell` im letzten Tick der Wirkung; Ja gewinnt in der
  Ja-Lage, Nein in der Nein-Lage. Der gemessene Stand (B9 +83, R1000; Zusatzmass +785 / −131) ist angenommen, das
  Zusatzmass bleibt als zweiter Test erhalten.
- **AK-BS-23 (Hinweis R1000):** entfällt bis INSELPROBEN; sie ist dann gemeinsam mit dem Proben-Paket (P-12) neu zu fassen.

## Playtest-Frage (Gate Merge, Anschluss an R-BS-4)

«Sagt ein Spieler mit knappem Glas, aber vollen übrigen Ketten zu Recht «Ja» auf B3, und versteht er warum?»
Rückfall bei «B3 immer Ja» im Playtest: Mangelregel (Steuer unerfüllter Häuser, Schrumpfen) oder `BUY_RISE` (R899),
nicht B3; beides berührt Grundspiel und Balancing-Test und braucht eine eigene Rechnung.
