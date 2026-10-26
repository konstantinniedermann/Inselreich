# Anhang 01 · Ja- und Nein-Lage je Bitte (Dominanztest AK-BS-04)

Gehört zu [I-210 Bittschrift](../2026-10-25-i210-bittschrift-design.md) §12, AK-BS-04. Die Lagen sind aus der Rechnung
[`2026-10-25-i210-bittschrift-rechnung.md`](../2026-10-25-i210-bittschrift-rechnung.md) §2 (Phasen P1, P3a, P3b), §5 und
§6 (Spalten «Ja wählt …», «Nein wählt …») abgeleitet. Die Welten baut der Test mit `tests/sim/helpers.ts` aus
`createWorld(seed, { unlockAll: true, crisisLevel: 'off', petitionsOn: true })`, die Marke wird direkt gesetzt (`id`,
`drawnAt = tick`, `amount`, `anchor`). Je Lage zwei feste Seeds (R553). Mass und Erwartung: Spec AK-BS-04.

**Überkapazität ü** heisst: Produktion je Kette = (1 + ü) × Bedarf je 100 T auf HOME (`goodsBalance`, `flow.ts:28`).
«Schlank» heisst ü = 0 wie beim Controller-Bau (Rechnung §2).

| #   | Ja-Lage (Ja > Nein erwartet)                                                                                                                                                                                   | Nein-Lage (Nein > Ja erwartet)                                                                                  | Quelle                |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------- |
| B1  | 6 Kaufmannshäuser, ü = 20 % in allen 5 Ketten, Lager je 60                                                                                                                                                     | P1: 4 Bürgerhäuser (St. 3), ü = 0, Stoff 31, Rum 5, Nahrung 38                                                  | §5 P1, §4 H3, §6      |
| B2  | 4 Bürgerhäuser, Rum ü = 20 %, Nahrung und Stoff ü = 20 %, Rum 40                                                                                                                                               | P1 (60 Bewohner): Rum 12 (= Kosten der Bitte), Rum-Erzeugung = 0,6 × Bedarf (6 gegen 10), Stoff 31, Nahrung 38  | §2 P1, §6, R999       |
| B3  | 3 Kaufmannshäuser, Glas und Gewürz ü = 20 %, übrige ü = 20 %, Glas 40                                                                                                                                          | P3a: **alle Ketten schlank (ü = 0)**, Glas 26, Erzeugung 6 gegen Bedarf 6, übrige Lager 60, Gewürz ü = 0 (R999) | §2 P3a, §6            |
| B4  | Kapelle, 5 Häuser im Radius aufstiegsbereit innerhalb des Fensters (wie I-201 Lage A), Rum 30, Stein 30                                                                                                        | Plateau: alle Häuser im Radius Stufe 4, Rum 15, Rum-Produktion = Bedarf                                         | §3, §6; I-201 §AK-FE1 |
| B5  | Kapelle in Abklingzeit, Aufstiegswelle wie B4-Ja; der Test hält nach dem Nachspiel ein Aufstiegsfest (Gutschein)                                                                                               | Plateau wie B4-Nein, Rohr 25 und Rohr-Produktion = Bedarf der Brennereien                                       | §6; I-201 Rechnung    |
| B6  | Plantage auf Fremdinsel, Route mit freiem Schiffsraum, Fremdlager Gewürz 20, Heimat Gewürz 40                                                                                                                  | Plantage, Fremdlager Gewürz 100 (voll), Schiff voll ausgelastet; Heimat Gewürz 12, Gewürz-Zufuhr = Bedarf       | §6 (Fussnote ⁴ Spec)  |
| B7  | 3 Webereien, Wolle 80 und Wolle ü = 30 %, Stoff 40 und Stoff ü = 0                                                                                                                                             | 3 Webereien warten auf Wolle (Wolle 20, Wolle-Produktion = Webereibedarf), Stoff 30                             | §6                    |
| B8  | 4 Bürgerhäuser, ü = 15 % in Nahrung, Stoff und Rum                                                                                                                                                             | P1: ü = 0, Nahrung 38                                                                                           | §6                    |
| B9  | Krisen «aus», 11 Bürgerhäuser (Stufe 3) auf Höchstbelegung, ü = 10 % (Stoff, Rum, Nahrung), Lager je 100; **Sturm vom Test gesetzt ab Antwort + `FRUGAL_TICKS` + 600 (= 2400)**, Dauer `STORM_DURATION` (R999) | Krisen aus, Lager Nahrung 90, ü = 0 (nichts zu speichern)                                                       | §4 (Sturm), §6        |

Hinweise für den Plan:

- **P1 = 60 Bewohner (R999):** vier Bürgerhäuser auf Höchstbelegung (4 × 15). Sonst wachsen die Häuser im Fenster
  von selbst auf 60, und «ü = 0» stimmt nicht mehr. Die Kosten von B2 sind dann ⌈60 / 5⌉ = 12 Rum, von B1 ⌈60 / 6⌉
  gemäss §4.2. Gilt für B1-Nein, B2-Nein und B8-Nein.
- **B9-Ja (R999):** Der Sturm beginnt hinter der Genügsamkeitsfrist des Nein-Zweigs (Spec §3.4); sonst würde der
  Nein-Lauf im Sturm schon sparsamer essen und die Lage nichts mehr zeigen. Vorbedingung: Im Nein-Lauf fällt die
  Nahrung im Sturm auf 0, im Ja-Lauf nicht. Zusatzmass und Rückfall: Anhang 06.
- **B4, B5:** Der Steuerzuwachs aus den Aufstiegen im Fenster gehört ins Mass (Spec AK-BS-04). Hängt I-201 noch nicht in
  main, gilt der Festaufruf mit `FEAST_RUM`.
- **B6:** Die Ja-Lage verlangt, dass im Fenster mindestens eine zusätzliche Schiffsladung in der Heimat ankommt; das
  prüft der Test als Vorbedingung.
- **B9:** Die Nein-Lage hat Lager ≥ 90, sonst wäre B9 nicht ziehbar (`when`); ü = 0 sorgt dafür, dass der Zusatzraum leer
  bleibt.
- **Vorbedingungen je Lage:** Alle Antworten liefern `ok`; die Häuser der Ja-Lage sind beim Nachspiel versorgt; in der
  Nein-Lage von B1, B2, B3 und B8 tritt im Ja-Zweig ein Mangel oder ein Zukaufbedarf auf (sonst ist die Lage falsch
  gebaut, nicht die Regel).
