# Handel 2 (Fernangebot) — Designvorschlag Gate Brainstorming

Stand: 2026-10-14 · Paket `design-handel-2` · Autor: lead-design · Grundlage: `docs/ideen.md` I-095 (Fernauftrag) und
I-093 (Auftrag umtauschen), aufbauend auf I-047 Stammkunde und I-092 Inselmarkt-Vorliebe (beide live) · Prozessstufe
voll. Kein Spec-Text, kein Plan: Werte sind Startwerte, die die Spec mit `design-economy-designer` nachrechnet.

## 1. Spielerzweck in einem Satz

Der Spieler sieht neben dem Auftrag «12 Holz · 84 · noch 1:00» das **Fernangebot «Felsbucht: 15 Rum · 450 · bis 2:30»**,
nimmt es an, weil seine Gewürzroute ohnehin nach Felsbucht fährt, und verzichtet dafür auf den nächsten Auftrag.

Zwei Wirkungen: Die Route bekommt neben Gewürz einen zweiten Zweck (I-095), und am Auftrag entsteht eine Wahl zwischen
zwei Bestellungen (I-093 «Wahl unter Bestellungen», ohne Geldgebühr).

## 2. Ausgangslage (Code und Werte)

- **Ein Auftragsplatz** (`orders.ts`): Ab Tick 600 kommt alle 900 Ticks (1:30) ein Angebot. Es läuft 600 Ticks (1:00)
  und zahlt `floor(buy × ORDER_PREMIUM 0,75)` je Stück. Gut und Menge sind zustandslos aus Seed, Periode und
  Höchststufe abgeleitet (ADR-010). Wer nicht liefert, zahlt keine Strafe.
- **Liefern geht heute schon von jedem Kontor**: `deliverOrder(world, island)` nimmt die Ware aus dem Lager der
  aktiven Insel (`app.ts:629`). Ein Fernauftrag, der nur den Ort festlegt, ist für sich deshalb eine **Einschränkung**
  und braucht einen Gegenwert.
- **Platz sperrt die Folgeperiode**: Neu angeboten wird nur bei `world.order === null`. Ein Auftrag mit Frist über
  900 Ticks lässt also die nächste Periode aus, ohne neue Regel.
- **Stammkunde (I-047)** belegt den Platz: Wird geliefert, kommt kein Zufallsauftrag. Wert je Lieferung 135–140, also
  ≈ 90/min, passiv ab Heimat oder Lieferinsel.
- **Vorliebe (I-092)**: Möweninsel Stoff, Weidenau Glas, Felsbucht Rum, Verkauf ×1,30 am Fremdkontor.
- **Harte Grenze aus dem Edikt Handel** (`defs/edicts.ts`, `buyFactorPct` 80): Jede Stückprämie muss unter
  0,8 × `buy` bleiben, sonst lohnt Kaufen und Liefern. Die Scout-Prämie `floor(buy × 0,95)` aus I-095 (Rum 38 > 32)
  **fällt damit weg**. Der Gegenwert eines Fernauftrags kann nur aus **Menge und Frist** kommen, nicht aus dem
  Stückpreis.
- **Bilanzen** (I-092 Anhang 01): (a) 2310, (b) 3180, (c) 5040 Geld/min; Schiff 15 je 100 Ticks = 90/min.

## 3. Varianten

### V1 · Fernangebot neben dem Auftrag (Empfehlung)

- **Regel:** Hat der Spieler mindestens einen Fremdkontor, steht in jeder Periode ohne Stammkunde **neben** dem
  Zufallsauftrag ein Fernangebot. Es nennt eine Fremdinsel mit Kontor und deren Vorliebe-Gut (I-092). Die Menge ist
  fest je Gut, der Stückpreis wie beim Auftrag (`orderUnitReward`). Das Angebot gilt so lange wie der Auftrag der
  Periode (bis zu dessen `due`).
- **Annehmen** ersetzt den Zufallsauftrag durch den Fernauftrag. Frist ist Periodenbeginn + 1500 Ticks (2:30), geliefert
  wird nur am Kontor dieser Insel. Weil der Platz belegt bleibt, fällt die nächste Periode aus. Der Fernauftrag
  verfällt vor dem übernächsten Periodenbeginn (Beginn + 1800).
- **Liefern** des Zufallsauftrags oder dessen Ablauf beendet das Fernangebot. Es gibt keine Strafe, wie beim Auftrag.
- **Wahl:** schnell, klein und zufällig (Zufallsauftrag 1:00) gegen gross und geplant (Fernauftrag 2:30, Schiff nötig,
  kostet den nächsten Auftrag).
- **Inselwahl ohne Zufall:** `eligible[k mod n]` über die Fremdinseln mit Kontor, deren Vorliebe-Gut die Höchststufe
  erlaubt (`order.tier ≤ maxTier`), sortiert nach Inselindex. So entsteht kein neuer Zufallsstrom, und der Spieler
  kann die Abfolge vorhersehen.

**Startwerte (Spec rechnet nach):**

| Gut   | Insel      | ab Stufe  | Menge fern | Stück | Wert fern | Auftrag Heimat (Ø Menge × Stück) |
| ----- | ---------- | --------- | ---------- | ----- | --------- | -------------------------------- |
| Stoff | Möweninsel | Siedler   | 20         | 22    | 440       | 9 × 22 = 198                     |
| Rum   | Felsbucht  | Bürger    | 15         | 30    | 450       | 9 × 30 = 270                     |
| Glas  | Weidenau   | Kaufleute | 12         | 37    | 444       | 6 × 37 = 222                     |

Die Mengen sind so gewählt, dass jeder Fernauftrag 440–450 wert ist, so wie I-047 seine Lieferwerte auf 135–140
normiert. Alle Mengen liegen unter Frachtraum 50 und Lagergrenze 100. Neu ist der Def-Wert `FAR_ORDER_DURATION` = 1500,
dazu die Mengen als Feld `order.far` in `GOODS`.

**Rechnung (je Fernauftrag, Stufe 3):**

- **Gegen Marktverkauf daheim:** 15 Rum verkauft bringen bei `sellPct` 100 und −1 je Stück ≈ 18 × 15 × 0,93 ≈ 251. Der
  Fernauftrag bringt 450, also **+199**. Stoff +223 (440 − 217), Glas +217 (444 − 227).
- **Gegen den Auftragspfad** (beide Perioden als Zufallsauftrag): Ø-Auftrag Stufe 3 = 1203 ÷ 7 ≈ 172, Stufe 4 ≈ 178. Mit
  Lieferquote P bringt der Auftragspfad 2 × 172 × P. Der Fernauftrag liegt bei P = 1 **+106** vorn, bei P = 0,6
  **+244**. Je 3 min sind das **+35 … +81/min = 1,1 … 2,6 % von (b)**. Das liegt im Band von I-047 und I-092 (≤ 3 %).
- **Obergrenze:** höchstens ein Fernauftrag je 1800 Ticks, also 150/min brutto bzw. ≤ 81/min netto gegen den
  Auftragspfad. Es entsteht keine neue Art Geldquelle.
- **Eigenes Schiff lohnt nicht:** +35 … +81 − 90 < 0. Der Fernauftrag trägt nur **auf einer bestehenden Route**,
  meist der hin leeren Gewürzroute. Das ist der gewollte zweite Zweck.
- **Kein Kauf-und-Liefer-Gewinn:** Mit Edikt Handel: Stoff 22 < 24, Rum 30 < 32, Glas 37 < 40.
- **Gegen den Stammkunden:** Der Vertrag ist passiv mit ≈ 90/min (Rum 27 je Stück). Fernaufträge kommen höchstens auf
  150/min brutto (30 je Stück), verlangen aber ein Schiff, ein Annehmen je 3 min und wechselnde Inseln (Rotation).
  Aktiv gegen passiv ist gewollt; das Risiko steht in §6.
- **Dominanz geprüft:**
  - Liegt die Ware schon auf der Fern-Insel, ist der Fernauftrag nur ein grösserer Auftrag am Ort. Er kostet trotzdem
    die nächste Periode (siehe oben), ist also nicht frei.
  - Fehlt die Ware, bleibt der Zufallsauftrag die bessere Wahl.
  - Ohne Fremdkontor oder bei laufendem Vertrag gibt es kein Angebot.

**Save und Baseline:** Save +1, mit `farOffer: { island, good, amount, reward } | null` in der Welt und `island?` am
`Order` (nur bei Fernaufträgen). Migration: `farOffer = null`, kein `island`. Ein inkompatibler Stand wird mit Test
abgewiesen. Die Baseline bleibt **bitgleich**: Der Controller baut keinen Fremdkontor (grep `tests/sim/controller.ts`:
nur `home(w).kontorId`) und liefert nie (`deliverOrder` nur aus `app.ts`). Damit gibt es kein Angebot und keinen neuen
Zufallszug. Lead-tech bestätigt das in der Spec.

**Aufwand:** M, ≈ 2 Pakete (SIM, UI) + Spec.

### V2 · Fernhändler rufen (I-093 umgedeutet, Spieler wandelt den Auftrag um)

- **Regel:** Auf der Auftragskarte steht der Knopf «Fernhändler rufen: Insel X». Er wandelt den laufenden Auftrag in
  einen Fernauftrag um: gleiches Gut, Frist bis Beginn + 1500, Lieferung nur auf X, nächste Periode fällt aus. Einmal
  je Auftrag, ohne Geldgebühr.
- **Rechnung:** Der Stückpreis bleibt unter 0,8 × `buy` (Edikt-Grenze), also bringt das Umwandeln **nur Zeit**. Mit
  gleicher Menge ist der Fernauftrag immer schlechter als zwei Aufträge, solange P > 0. Wählt der Spieler die Insel
  selbst, wählt er die, auf der die Ware schon liegt. Dann fährt kein Schiff, und der zweite Zweck der Route fehlt.
- **Kern:** Im Grunde ist das «Frist verlängern gegen den nächsten Auftrag». Das ist eine Rettungstaste für leere
  Lager, keine Routenfrage.
- **Save:** `island?` und ein Umwandlungsmerker am `Order`, also Save +1. Aufwand S–M.
- **Verworfen**, weil sie ein Ziel verfehlt: Die Route bekommt keinen Zweck. Das Rettungsmotiv hat zudem kleinen
  Spielwert, weil ein verfallener Auftrag heute nichts kostet (I-093-Bewertung).

### V3 · Fernauftrag ersetzt jeden dritten Auftrag (I-095 pur)

- **Regel:** Nach Seefahrt ist jede dritte Periode ein Fernauftrag (Gut aus dem Auftragspool, Insel per Zufall, Frist
  2:30). Der Spieler wählt nicht.
- **Rechnung:** Der Stückpreis ist gedeckelt (0,75). Mit gleicher Menge ist der Fernauftrag ein Auftrag mit Schiffspflicht
  zum gleichen Lohn. Für Spieler ohne Route **verliert** jede dritte Periode faktisch ihren Wert (−172 je 4:30 ≈
  −38/min). Hebt man die Menge an, damit es sich lohnt, wird er zum Pflichttermin. Rohgüter (Holz 20–40) sind ein
  Ärgernis (Holz 7 je Stück, zwei Fahrten).
- **Save +1, eigener Zufallsstrom** (ADR-010).
- **Verworfen:** Es gibt keine Wahl, also eine Strafe für Nicht-Seefahrer und keine Entscheidung.

### Vergleich

| Kriterium                 | V1 Fernangebot   | V2 Fernhändler rufen | V3 jeder dritte |
| ------------------------- | ---------------- | -------------------- | --------------- |
| Route bekommt einen Zweck | ja               | kaum                 | ja (Pflicht)    |
| Echte Wahl am Auftrag     | ja, je Periode   | nur bei leerem Lager | nein            |
| Wirkung (b)               | +1,1 … 2,6 %     | ≈ 0 … +1 %           | −1,2 … +1 %     |
| Zufall                    | keiner neu       | keiner neu           | neuer Strom     |
| Save                      | +1               | +1                   | +1              |
| Aufwand                   | M (≈ 2 Pakete)   | S–M                  | M               |
| Passung zu I-092          | stark (Vorliebe) | keine                | keine           |

## 4. Empfehlung

**V1 Fernangebot.** Begründung:

- Nur V1 trifft beide Ziele des Auftrags (Routenzweck und Wahl), und das unter der Edikt-Grenze.
- Sie verbindet I-092 und I-095 zu einer Geschichte: Jede Insel hat einen Markt (Vorliebe) und gelegentlich einen
  Grosskunden (Fernangebot).
- Sie braucht keinen neuen Zufallsstrom.

**I-093** geht in V1 auf («Wahl unter Bestellungen»). Die Fassung mit Geldgebühr (60 Geld, anderes Gut) wird verworfen,
weil sie bei leerem Lager immer gewählt würde (Bewertung IDEEN-09).

**Annahmen (selbst beantwortet, L0 kann korrigieren):**

| ID   | Frage                                           | Annahme                                                                                                                                           |
| ---- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| AN-1 | Gut des Fernangebots frei oder Vorliebe-Gut?    | Vorliebe-Gut der Insel (kein Rohgut, stimmige Inselrolle, keine Zufallsziehung)                                                                   |
| AN-2 | Stückpreis höher als 0,75?                      | Nein, Edikt-Grenze 0,8 (§2); der Gegenwert kommt aus der Menge                                                                                    |
| AN-3 | Stapelt die Vorliebe ×1,30 mit dem Fernauftrag? | Nein, der Fernauftrag liest `PREFER_PCT` nicht (I-092 R6 bleibt wahr)                                                                             |
| AN-4 | Frist ab Annehmen oder ab Periodenbeginn?       | Ab Periodenbeginn (+1500), damit der Fernauftrag nie in den übernächsten Beginn ragt; frühes Annehmen lohnt                                       |
| AN-5 | Angebot nach Lieferung eines Fernauftrags?      | Stammkunde-Angebot wie I-047 R1 mit Lieferinsel; nichts Neues                                                                                     |
| AN-6 | Reicht 2:30 für eine Fahrt?                     | Seeweg 25–40 Kacheln × 10 Ticks ≈ 300–480 je Richtung; eine Schleife ≈ 600–960 Ticks passt. Spec prüft gegen Seed 3 (Seekarte)                    |
| AN-7 | Wo sieht der Spieler das Angebot?               | Zweite Zeile auf der Auftragskarte mit «Annehmen» und Lager der Fern-Insel x/Menge; Marke an der Insel auf der Seekarte nur in der Spec, optional |

## 5. Randfälle (für die Spec)

- Der Kontor der Fern-Insel wird nach dem Annehmen abgerissen: Liefern meldet den Fehlgrund, der Auftrag verfällt
  ohne Strafe.
- Liefern auf einer anderen Insel als der Fern-Insel: `fail('Nur auf <Insel>')`. Der normale Auftrag bleibt von jedem
  Kontor lieferbar.
- Ein Vertrag ist aktiv oder die Funktion `orders` gesperrt: kein Fernangebot, Annehmen schlägt mit Grund fehl.
- Wird die Höchststufe gesenkt, ändert das einen angenommenen Fernauftrag nicht. Die Rotation liest die Stufe nur beim
  Anbieten.
- Ein Save mit `farOffer.island` ohne Kontor oder ausserhalb der Inseln wird beim Laden abgewiesen (Test) bzw. beim
  Annehmen mit Grund abgelehnt.
- Entartung «Kaufen und liefern» ist mit Edikt Handel ausgeschlossen (§3 V1). Entartung «Schiff nur für Fernaufträge»
  ist negativ (−9 … −55/min).

## 6. Risiken

- **Weiche Wertgrenzen:** Die Rechnung ist analytisch, nicht simuliert (wie I-047 L6). Rückfall per Ruling, nur
  `src/sim/defs/`: zuerst Fernmengen auf Wert ≈ 360 senken (Rum 12, Stoff 16, Glas 10), dann `FAR_ORDER_DURATION`
  verkürzen.
- **Fernaufträge verdrängen den Stammkunden** bei aktiven Spielern (§3). Das ist gewollt, weil passiv gegen aktiv eine
  Wahl ist. Prüfung im ersten Playtest zusammen mit I-091 (Treuebonus, geparkt bis Playtest I-047).
- **Sichtbarkeit:** Das Fernangebot erscheint erst mit Seefahrt (nach dem Bürger-Ziel), also nicht in den ersten
  15 Minuten. Das gilt genauso für I-047 und I-092.
- **Save-Nummer:** Main steht auf v14. Erweiterung 1 plant eigene Sprünge, deshalb vergibt die Merge-Reihenfolge die
  Nummer (wie R487 P-4).

## 7. Abgrenzung zu Erweiterung 1 «Stände und Segel» (nur gelesen)

| E1-Teil                                                           | Berührung                                                                                          | Vorschlag                                                   |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| §10 «Aufträge für neue Güter» ausgeschlossen, keine Preisänderung | Fernangebot nur für Stoff, Rum, Glas; Porzellan und Konfekt nie; kein Preis in `GOODS` ändert sich | keine Überschneidung                                        |
| K2 Hafenrecht (Reeder, Arbeiter, Inseldorf)                       | keine; Fernauftrag liest weder Stufe 5 noch Arbeiter-Pool                                          | keine                                                       |
| K3 Werft (Flotte 4 → 6)                                           | mehr Frachtraum macht Fernaufträge leichter                                                        | Synergie, keine Regeländerung                               |
| K4 Gefahren der See (Sturm-Anweisung, Piraten ab Seeweg 35)       | Felsbucht (35–40) liegt im Piratenbereich; Sturm-Halt kann 2:30 sprengen                           | bei K4-Spec `FAR_ORDER_DURATION` nachprüfen (Auflage an K4) |
| Variante B (Rivalen, Verträge), Kandidat E2                       | Fernangebot wäre später Baustein «Angebot eines Handelshauses»                                     | nichts jetzt                                                |
| Save-Sprünge K2–K4                                                | beide brauchen Save +1                                                                             | Nummer nach Merge-Reihenfolge                               |

**Zuordnung:** Handel 2 ist ein **eigenständiges Handels-Paket ausserhalb von E1**, wie I-047 und I-092. Es ändert
nichts, was E1 festlegt, und hängt an keinem E1-Kapitel.

## 8. Zuschnitt in Häppchen

1. **design-handel-2-spec** (Stufe voll): Spec mit Anhang Werte (`design-spec-author` opus, `design-economy-designer`
   für Mengen, Frist und Seed-3-Fahrzeiten), ≈ 60–80 Tools.
2. **H2-SIM** (`tech-sim-engineer`):
   - `farOffer` beim Anbieten (Rotation), `acceptFarOrder`, Ortsprüfung in `deliverOrder`
   - Defs `order.far` und `FAR_ORDER_DURATION`
   - Save +1 mit Migration und Abweise-Test
   - Invarianten-Test (Stück < 0,8 × `buy`, Wert 440–450, Menge ≤ 50)
   - Baseline-Nachweis bitgleich
   - ≈ 120–150 Tools
3. **H2-UI** (`tech-ui-engineer`): zweite Zeile der Auftragskarte, Annehmen, Lager der Fern-Insel, Meldungen; README
   und `docs/spielwerte.md` (Abschnitt Handelsaufträge); ≈ 100–130 Tools. Hängt an H2-SIM.

Zusammen ≈ 280–360 Tools, Grösse M.

**Nicht im Umfang:**

- Stückpreis über 0,75
- Strafe für verfallene Fernaufträge
- Gebühr-Tausch (I-093 alt)
- mehrere Fernangebote gleichzeitig
- Fernangebote für Rohgüter oder E1-Güter
- Marke auf der Seekarte (optional in der Spec)
- Treuebonus (I-091)
- Kaufseite (I-006) und Zeitnachfrage (I-029)

## 9. Selbstprüfung Gate Brainstorming — Urteil BEDENKEN

1. **Säulen:** Stärkt «Wirtschaft über Handel» und «Insel besiedeln» (ein Fremdkontor bekommt einen Absatzzweck).
   Misslingt es, leidet Handel nur wenig: Das Angebot ist optional und bestehende Aufträge bleiben unverändert. **OK.**
2. **Ein Satz und 15 Minuten:** Der Satz steht in §1. In den ersten 15 Minuten ist **nichts spürbar**, weil Seefahrt
   nach dem Bürger-Ziel kommt. **BEDENKEN**, wie bei I-047 und I-092 hingenommen: Es ist ein Mittelspiel-Baustein.
3. **Scope:** begrenzt und mit «Nicht im Umfang» in §8; zwei Umsetzungspakete. **OK.**
4. **Nur Mechanik:** ortsgebundene Grossbestellung und Wahl unter Bestellungen als Genre-Mechanik; Namen eigen
   (ADR-006). **OK.**
5. **Einfacher?**
   - V2 ist einfacher, verfehlt aber den Routenzweck.
   - Gar nichts tun wäre möglich, weil I-092 Routen schon einen Absatzgrund gibt. V1 fügt aber das, was I-092 fehlt,
     hinzu: einen Entscheidungsmoment mit Einsatz (nächster Auftrag) statt eines stillen Faktors.
   - **OK** mit dem Hinweis, dass V1 erst nach dem I-047-Playtest priorisiert werden sollte, um Verträge und
     Fernaufträge gemeinsam zu prüfen.

Kein Vorbehalt nach Verfassung §5.3: Kernsäule, Genre und Titel bleiben unberührt.
