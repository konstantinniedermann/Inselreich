# Anhang 02 · Auflagen für den Plan (Gate Spec R904)

Gehört zu [I-210 Bittschrift](../2026-10-25-i210-bittschrift-design.md) §13. Quelle: Gate-Bericht `lead-qa`
(`.studio/handoffs/2026-10-25-lead-qa-gate-spec-I-210.md`, B-5, B-7 bis B-10), Ruling R904. Die Auflagen richten sich an
`lead-tech`; sie ändern keine Spielwerte.

## B-5 Laufzeit des Dominanztests (AK-BS-04)

- **Umfang:** 9 Bitten × 2 Lagen × 2 Seeds × 2 Antworten = **72 Läufe**, je bis ≈ 11 000–12 000 T (B1–B3: Antwort plus 4800, 6000 und 300 T), zusammen ≈ 0,8 Mio Ticks. Dazu AK-BS-03
  (30 000 T × 2), AK-BS-10 (60 000 T), AK-BS-13 (60 000 T × 2), AK-BS-01 (20 000 T).
- **Messen vor Zusage:** Der Plan misst die Tickrate einer Anhang-01-Lage (B1-Ja-Lage, 6 Kaufmannshäuser) und rechnet
  die Laufzeit hoch. **Soll:** jede Testdatei < 30 s unter Testlock.
- **Sonst, in dieser Reihenfolge:** (1) Aufteilung in drei Dateien B1–B3 / B4–B5 / B6–B9; (2) ein Seed je Lage, mit
  Begründung nach R553 im Plan (welche Lage, warum ein Seed reicht, welcher Seed fest ist).
- **Ersatzmass für schwer baubare Lagen:**
  - **B6 (Fremdinsel, Plantage, Schiff):** Ist die Route mit den Test-Helfern nicht in vertretbarer Zeit baubar, gilt
    eine Testzufuhr: Gewürz kommt alle `L` Ticks mit fester Menge in die Heimat (L = Umlauf der Route, Menge = Ladung).
    Ja-Lage: Ladung ist kleiner als der Fremdbestand, der Zusatz kommt an. Nein-Lage: Ladung = Schiffsraum voll, der
    Zusatz bleibt im Fremdlager (Lager 100, verfällt). Das Mass bleibt der Nettowert in der Heimat.
  - **B9 (Sturm):** Der Test setzt den Krisenzustand direkt (Sturm aktiv ab festem Tick im Fenster, Dauer wie
    `timing.ts` Sturm). Gelingt das nicht ohne Eingriff in `crises.ts`, ersetzt ein fester Ausfall gleicher Grösse
    (halber Takt der `stormAffected`-Betriebe über 300 T, Rechnung §1) den Sturm; der Plan nennt die Wahl.

## B-7 Save-Abweisung ohne feste Nummer (AK-BS-15)

Migrations- und Abweisungstests verwenden `SAVE_VERSION - 1` (vorige Version) und `SAVE_VERSION + 1` (unbekannt), nie
18, 19 oder 20. So bleiben sie nach SEERECHT und nach jedem weiteren Sprung grün.

## B-8 Inselproben ohne Bittschriften (F-2, AK-BS-23)

Entschieden (R904): Proben laufen fest **ohne** Bittschriften. Der Schalter entsteht in I-210, darum steht der AK im
I-210-Plan (Spec AK-BS-23). Ist INSELPROBEN schon in main, setzt der I-210-Plan `petitionsOn: false` im Proben-Start;
kommt INSELPROBEN später, übernimmt dessen Plan den AK unverändert.

## B-9 Strukturtest Werte (AK-BS-16)

Die Literal-Suche erfasst nur die eindeutigen Zeitwerte der Tabelle (6000, 4800, 3000, 2400, 1800, 1200) und
`PETITION_SALT`. Prozentwerte und kleine Zahlen (10, 15, 20, 40, 50, 80, 100) sind **nicht** Teil der Literal-Suche, weil
sie als Formelkonstanten vorkommen (Rundung `+ 50) / 100`, Indizes). Für sie prüft der Test die Defs gegen die Tabelle
und dass `petitions.ts` die Werte über `PETITIONS[id]` bzw. die Konstanten liest (Import vorhanden).

## B-10 Controller-Zusatztest (AK-BS-17)

Der Plan entscheidet: entweder ein echter Test (läuft in `make test` mit, rot heisst rot) oder gestrichen. Ein Test
«ohne Gate-Wirkung» gibt es nicht. Empfehlung: echter Test für Ziel 2 mit dem Kaufleute-Controller, weil dort die
Genügsamkeit über mehrere Fristen wirkt; der Ziel-1-Teil kann entfallen (die erste Karte kommt erst nach Ziel 1).
