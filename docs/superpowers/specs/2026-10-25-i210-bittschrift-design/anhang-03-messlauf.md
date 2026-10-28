# Anhang 03 · Messlauf stabile Stadt (AK-BS-05, R-BS-1)

Gehört zu [I-210 Bittschrift](../2026-10-25-i210-bittschrift-design.md) §12, AK-BS-05 (Nachtrag Gate Spec R904, B-1).
Grundlage: Rechnung [`2026-10-25-i210-bittschrift-rechnung.md`](../2026-10-25-i210-bittschrift-rechnung.md) §1, §2 P3b,
§4 H3/H4, §5. Keine neuen Spielwerte; die Bänder sind Prüfgrenzen des Tests, keine Defs.

## 1 Aufbau und Machbarkeit (Plan-Prüfung vor Zusage)

- 6 Kaufmannshäuser (Stufe 4, cap 20) auf HOME mit allen Diensten, Lager 100 je Ware, Krisen aus, Steuer «normal».
- Bedarf je 100 T: Stoff 24, Rum 24, Glas 12, Gewürz 12, Nahrung 60 (Rechnung §2 P3b).
- **Betriebe auf 110 %:** Betriebe liefern ganze Raten (Fischer 2,5, Weberei/Brennerei/Glashütte 2 je 100 T bei Stufe 1,
  Rechnung §1). Genau 10 % ist darum nicht baubar (Stoff 26,4 → 13,2 Webereien). Der Plan prüft vor der Zusage, ob die
  Test-Helfer je Kette eine Überkapazität **ü zwischen 5 % und 14 %** bauen (Mischung von Ausbaustufen erlaubt), und
  liest das tatsächliche ü je Ware aus `goodsBalance(world, HOME)` (`flow.ts:28`). Alle Erwartungen unten sind als
  Formel von ü angegeben; die Zahlen in Klammern gelten für ü = 10 %. Gewürz kommt per Plantage auf einer Fremdinsel mit
  Route oder per Testzufuhr je 100 T; der Plan wählt, die Rate zählt.
- **«+2 Fischer»:** Machbar, wenn die Nahrungslücke L_Na ≤ 5 je 100 T ist (2 × 2,5). Plan prüft Bauplatz im Radius.
- Einschwingen 2000 T ohne Bitte. Vorbedingung: 120 Kaufleute, alle versorgt, jedes Lager ≥ 90.
- Dann B1 als Marke gesetzt (`amount` = clamp(⌈120/5⌉, 10, 40) = 24), «Ja» bzw. «Nein» im selben Tick, Zweige aus demselben
  `serialize`, je bis Nachspiel + `duration` + 300 T.

## 2 Zweige

- **J (Ja, schlank):** wie aufgebaut.
- **J+F (Ja mit +2 Fischern):** wie J, im Tick der Antwort 2 Fischer zusätzlich (angebunden).
- **N+F (Nein mit +2 Fischern):** Vergleichszweig für das Geld; die 2 Fischer sind in beiden Zweigen, damit Unterhalt und
  Nahrungsüberschuss sich aufheben.
- **N (Nein, schlank):** für die Ersparnis.

## 3 Grössen, Erwartung und Band

Mehrbedarf je Ware: M_g = 18 × Rate_g (Stoff 3,6, Nahrung 9). Lücke: L_g = M_g − ü_g × Bedarf_g (Stoff 1,2, Nahrung 3,0;
Rechnung §4 H3, R-BS-2). Die Zuzugsrampe dauert 150 T (3 Plätze × 50 T, Spec §3.5).

| Grösse                                                          | Erwartung                                   | Band                                                           | Herleitung des Bands                                                                                                                                                   |
| --------------------------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Zusatzplätze                                                    | 6 × 3 = 18                                  | genau 18                                                       | reine Formel §3.5, kein Spielraum                                                                                                                                      |
| J: Tick des ersten unversorgten Hauses ab Ende der Rampe        | S_Na ÷ L_Na × 100 (100 ÷ 3 × 100 = 3333)    | [(S_Na − 6) ÷ L_Na × 100, S_Na ÷ L_Na × 100 + 150] (3133–3483) | unten: jedes der 6 Häuser kann eine Einheit früher entnehmen (ganzzahlige Entnahme, `population.ts:100-108`); oben: die Rampe senkt den Mehrbedarf in den ersten 150 T |
| J+F: Stoffbestand am Ende der Überbelegung                      | S_St − L_St × 60 (100 − 72 = 28)            | [Erwartung − 6, Erwartung + 3] (22–31)                         | unten: ganzzahlige Entnahme wie oben; oben: Rampe 3,6 × 1,5 ÷ 2 ≈ 2,7                                                                                                  |
| J+F: kein unversorgtes Haus im Fenster                          | Nahrung: 2 × 2,5 ≥ L_Na                     | ja/nein                                                        | Machbarkeit §1                                                                                                                                                         |
| ΔGeld(J+F − N+F) über das Fenster                               | 18 × 22 × 60 = 23 760 abzüglich Rampe ≈ 300 | [21 000, 24 500]                                               | unten: −300 Rampe und −10 % für Steuer-Übertrag (`TAX_CARRY_DIVISOR`) und Einzeltakte ohne Versorgung; oben: +300 für die Abzugsrampe nach `until` (−1 je 50 T)        |
| N: gesparter Stoff (Verbrauch Referenz − N) über `FRUGAL_TICKS` | 24 × 0,1 × 18 = 43,2                        | [37, 44]                                                       | unten: ganzzahlige Entnahme (−6); oben: Aufrundung                                                                                                                     |
| N: Stoffbestand am Ende von `FRUGAL_TICKS` minus Referenz       | ≈ 0 (Lager voll, Ersparnis verfällt)        | [0, 6]                                                         | Rechnung §4 H4: bei vollem Lager ist die Ersparnis wertlos; ≤ 6 aus ganzzahliger Entnahme                                                                              |

S_g ist der Bestand im Tick, in dem die Rampe endet (Vorbedingung ≥ 90; nach 4800 T Verzögerung ist Stoff wieder bei 100,
weil 100 − 24 + 2,4 × 48 > 100).

## 4 Fehlerrichtung und Rückfall

- **Mangel in J später als das Band oder gar nicht:** «Ja» ist in der schlanken stabilen Stadt stärker als hergeleitet;
  H3 trägt dort nicht. Rückfall: `OVERCROWD_PCT` per Ruling auf 20 (Spanne 15–20, Spec §12) und Befund an `lead-design`.
- **Mangel früher als das Band:** Die Lücke ist grösser als gerechnet («Ja» schwerer). Gewollte Richtung; Prüfung nur, ob
  AK-BS-04 grün bleibt, sonst `OVERCROWD_PCT` 12.
- **ΔGeld unter dem Band:** «Ja» bringt weniger als gerechnet; Prüfung, ob die B1-Ja-Lage in AK-BS-04 hält. **Über dem
  Band:** mehr Zuzug als 18, das ist ein Fehler in der Formel §3.5, kein Balancing-Fall.
- **N-Bestand über dem Band:** Die Genügsamkeit wirkt bei vollem Lager doch; Befund an `lead-design` (H4 stärker als
  gerechnet).
- **Grundsätzlich:** «Ja + Puffer» gewinnt in der stabilen Stadt mit Krisen aus (Zeile ΔGeld); das ist R-BS-4 (Spec §10)
  und kein Testfehler. Jede Verstellung nur in den Defs, per Ruling.

## 5 AK-BS-13 «Nein ist harmlos» (Gate B-6)

Volltext des AK aus der Spec, mit Herleitung:

- **AK-BS-13 Nein ist harmlos:** feste Welten ohne Controller nach Ziel 1, je ein Lauf mit Bittschriften an und nie einer
  Antwort gegen die Referenz ohne Bittschriften, 60 000 T, ausgewertet je Fenster von 6000 T. (a) **Versorgte Welt**
  (ü ≥ 0, keine Lücke): Einwohner je Tick gleich der Referenz, Geld am Fensterende ≥ Referenz, Krisenfolge gleich. (b)
  **Knappe Welt** (eine Kette mit ü < 0): Σ Einwohner-Ticks und Geld je Fenster ≥ 99 % der Referenz (ganzzahlige
  Entnahme verschiebt Einzeltakte), über alle Fenster ≥ Referenz. **Fehlerrichtung «Lager voll, Produktion stoppt»:** Die
  Genügsamkeit füllt das Lager; was über 100 liegt, verfällt wie heute auch in der Referenz, der Unterhalt hängt nicht vom
  Betriebszustand ab (`economy.ts:61-76`). Bestanden heisst darum: Geld und Einwohner wie oben; ein höherer Lagerstand mit
  stehendem Betrieb ist kein Fehler. Sinkt Geld unter die Referenz, ist das ein Fehler im Leseort (§3.5), kein
  Balancing-Fall. Kein Ereignis ausser «gezogen», «Klage», «Vorbei».
