# Pitch I-222 · Erbstadt (Szenario «Stadt retten») · Baustein Inselproben Schnitt 2

Stand: 2026-10-26 · Autor: `lead-design` · Paket `design-IDEEN20-FOLGEN` · Anlass R967, R973 · Prozessstufe leicht (Pitch, keine Spec, keine
festen Spielwerte). Quelle der Idee: `docs/ideen.md` I-222 (Branch `design/ideen-20` @ `327cde3c`).

## 1 Spielerzweck (ein Satz)

Der Spieler übernimmt eine fertig gebaute, aber schlecht geplante Stadt und entscheidet in jeder Minute, was er abreisst und
was er stehen lässt, um das Ziel schneller zu erreichen als der Vorgänger.

## 2 Spielerfahrung (erste 15 Minuten)

- **Minute 0:** Die Karte «Erbstadt» zeigt die Lage: «Dein Onkel hat dir seine Stadt vererbt. Sie wächst nicht mehr. Bring
  sie auf 50 Bürger. Vorgänger-Zeit, wenn du nichts änderst: 24:30.» Die Stadt steht schon: rund 20 Häuser, ein Marktplatz,
  Holzfäller, Fischer, Schaffarm, Weberei, ein Steinbruch mitten im Wohnviertel, eine Kapelle am falschen Ende.
- **Minute 1–3:** Die Stadt zahlt sofort Steuern und liefert Ware; der Spieler sieht aber an den Haus-Panels, warum sie
  stockt: «Markt nicht erreichbar» (Sackgasse hinter dem Bach), «Lärm: +15 s» neben dem Steinbruch, «Kapelle fehlt» am
  Nordrand. Jede Ursache ist ein Ort auf der Karte.
- **Minute 3–10:** Die erste echte Abwägung: Den Steinbruch abreissen kostet die Steinlieferung jetzt (Neubau anderswo,
  volle Kosten), behalten kostet Aufstiegszeit bei acht Häusern. Den Weg um den Bach neu legen ist billig, aber das
  Viertel dahinter bleibt so lange unversorgt. Der Spieler lernt, dass nicht jeder Fehler gleich teuer ist.
- **Minute 10–15+:** Ein Teil der Erbschaft ist geräumt, ein Teil bleibt bewusst stehen. Die Uhr läuft gegen die
  Vorgänger-Zeit; wer klug umplant, ist mehrere Minuten schneller. «Nochmal» lädt dieselbe Erbstadt, und der zweite Lauf
  zeigt, dass weniger Abriss oft schneller ist.

Gefühl: «Ich sehe, was der Vorgänger falsch gemacht hat, und ich kann es besser.» Das stärkt die Säulen **Insel
besiedeln** (Stadtplanung) und **Produktionsketten** (Ketten neu ordnen); leiden würde bei Misslingen die Säule Bevölkerung
(Aufstieg stockt ohne lesbaren Grund).

## 3 Regel in drei Sätzen

1. Die Erbstadt ist ein Szenario im Proben-Rahmen: feste Karte, feste Bauliste, feste Startkasse und ein Ziel; die Uhr
   läuft vom ersten Tick bis zum Ziel.
2. Alle Gebäude der Bauliste stehen beim Start fertig und arbeiten nach den normalen Regeln; der Spieler darf jedes davon
   abreissen, umbauen oder stehen lassen.
3. Abriss erstattet im Szenario nichts (wie beim Schuldbrief), damit die Erbschaft kein Startkapital ist; die alte
   Bausubstanz bringt nur, was sie erwirtschaftet.

## 4 Mechanik (Rahmen, keine festen Werte)

- **Def:** Block `SCENARIOS.heritage` in `src/sim/defs/challenges.ts` (Datei aus Inselproben P1, Spec
  `docs/superpowers/specs/2026-10-23-modus-inselproben-design.md` §5.1, §5.4): `seed`, `crisisLevel`, `goal`, `startMoney`,
  `startStock`, `refundPct`, `layout` (Liste `{ type, x, y }`, Gebäude und Strassen), `predecessorTicks` (Vorgänger-Zeit,
  aus dem Controller-Lauf «nichts ändern»). Alle Zahlen sind Werte in den Defs, nie im Code.
- **Neue Sim-Regel:** nur eine Startfunktion, die die Bauliste ohne Kosten setzt (`placeLayout` o. ä., Name Sache des
  Plans); danach gelten ausschliesslich bestehende Regeln. `createWorld` ohne Szenario bleibt unverändert (Baseline
  bitgleich).
- **Abriss:** Der Schuldbrief führt `refundPct` als Szenario-Feld ein (Inselproben §5.4: `refundCost`, `grantRefund`,
  `effectiveRefund` und die Anzeigen zeigen 0). Die Erbstadt nutzt dasselbe Feld; heute erstattet Abriss 50 % von Geld und
  Gütern (`src/sim/economy.ts:45`, `refundCost`; Güter gekappt auf freien Lagerplatz, `src/sim/queries.ts:207`).
- **Wertung:** wie Inselproben §6.1 (`result.tick`, kleiner ist besser). Die Vorgänger-Zeit steht nur als Zahl auf Start-
  und Ergebnis-Karte («23:10, Vorgänger 24:30»); keine Medaillen (Inselproben §13 bleibt für Proben gültig).
- **Save:** kein eigener Sprung. Der Stand nennt `challenge.kind = 'scenario'`, `id = 'heritage'` (Feld aus Inselproben §7);
  die gesetzten Gebäude sind normale Gebäude der Welt. Neue Def-Einträge heben `CHALLENGE_REV`.

## 5 Planungsfehler der Bauliste (Level-Design)

Jeder Fehler muss im Haus- oder Betriebs-Panel lesbar sein und eine Ursache auf der Karte haben (R896).

| Fehler                                             | sichtbar durch                         | Quelle der Regel                                  |
| -------------------------------------------------- | -------------------------------------- | ------------------------------------------------- |
| Viertel hinter Wasser/Sackgasse ohne Wegreichweite | «Markt nicht erreichbar»               | I-061 (Stadtplanung)                              |
| Steinbruch bzw. Werkzeugmacher im Wohnviertel      | «Lärm: +15 s»                          | I-128 (Stadtplanung)                              |
| Kapelle am Rand, Teil der Häuser ohne Dienst       | Bedürfnis «Kapelle» fehlt              | `serviceRadius` (`src/sim/defs/buildings.ts:192`) |
| zwei Betriebe einer Art bei halber Auslastung      | Betriebsrangliste, Unterhalt je Minute | bestehend                                         |
| Marktplatz zu klein bzw. abseits                   | `supplyRadius` 8 (`buildings.ts:19`)   | bestehend                                         |

Ohne I-061 und I-128 bleiben nur die letzten drei Zeilen; das trägt kein Szenario (Fehler zu billig, Lösung «einen Markt
dazubauen»). Darum steht die Erbstadt hinter Stadtplanung.

## 6 Prüfung auf dominante Wahl (R722) und Entartungen

- **«Alles stehen lassen»** ist die Vorgänger-Zeit. Dominiert es, sind die Fehler zu billig → Bauliste schärfen.
- **«Alles abreissen, neu bauen»:** Mit `refundPct` 0 bekommt der Spieler kein Geld zurück, nur eine leere Insel mit
  Startkasse; das ist eine langsame Probe 1. Ohne diese Regel wäre Abriss eine Geldpumpe (50 % von Gebäuden, die er nie
  bezahlt hat) und würde immer gewinnen.
- **Zielbild für die Werte-Rechnung (Schnitt-2-Spec):** Der beste Lauf (Controller «gezielte Umplanung») reisst 20–40 % der
  Gebäude ab und ist mindestens 15 % schneller als die Vorgänger-Zeit; «alles abreissen» ist langsamer als «nichts
  ändern». Beides ist mit zwei Controller-Läufen prüfbar und gehört als Lösbarkeitslauf in die Abnahme.
- **Kasse leer:** gleiche Regel wie im Proben-Rahmen; negative Kasse beendet nichts, sperrt nur Bau und Zukauf. Eine Erbstadt
  ohne Frist kann nicht verloren werden, nur langsam sein.
- **Bauliste passt nicht zur Karte:** fester Seed; ein Def-Test prüft, dass jeder Eintrag der Liste auf dem Seed baubar ist
  (Gelände, Überlappung, Strasse angebunden).
- **Krisen:** Vorschlag `off` im ersten Schnitt, damit die Vorgänger-Zeit ein fester Wert ist.

## 7 Abhängigkeiten

| Abhängigkeit                              | warum                                            | Stand                                        |
| ----------------------------------------- | ------------------------------------------------ | -------------------------------------------- |
| Inselproben P1 (Rahmen, `challenge`-Feld) | Start, Uhr, Wertung, Ablage, Save                | in Umsetzung (Plan `2026-10-25-inselproben`) |
| Inselproben P4 (Schuldbrief, `refundPct`) | Abriss-Erstattung 0 im Szenario wird dort gebaut | in Umsetzung                                 |
| I-061 Wegreichweite                       | Hauptfehler «Viertel nicht erreichbar»           | eingeplant (R529, Stadtplanung)              |
| I-128 Lärm und Rauch                      | zweiter Hauptfehler «Gewerbe im Wohnviertel»     | eingeplant (R737, Stadtplanung)              |

## 8 Aufwand und Schnitt

≈ 2–3 Pakete, Stufe voll (neue Spielwerte): **E1** Startfunktion mit Bauliste und Def-Test der Baubarkeit (S); **E2**
Bauliste, Werte-Rechnung (`design-economy-designer`) und zwei Controller-Läufe (M); **E3** UI: Lage-Text und
Vorgänger-Zeit auf den Proben-Karten (S, fast nur Text). Raster bestätigt: Spass 3 · Passung 3 · Aufwand 2 · Risiko 2 = 13.

## 9 Nicht dazugehört

Kein Szenario-Editor; nur eine Erbstadt im ersten Schnitt; keine Ruinen- oder Verfallsgrafik; keine neue Sim-Regel ausser
der Startfunktion; keine Medaillen oder Richtzeit-Stufen; keine Erbstadt im freien Spiel («Neue Insel» bleibt unverändert);
keine Änderung an Grundspielwerten oder am Balancing-Test.

## 10 Ergebnis

**Tragfähig als Baustein Inselproben Schnitt 2**, startbar erst, wenn Inselproben (P1, P4) und Stadtplanung (I-061, I-128)
auf main sind. Die Technik ist fast vorhanden (Proben-Rahmen, `refundPct`); der Aufwand liegt im Level-Design der Bauliste
und im Lösbarkeitslauf.

## 11 Offene Fragen an L0 (mit Empfehlung)

- **F1 Ziel:** `citizens` (50 Bürger, Stadt startet auf Siedler-Stufe) oder `merchants`. **Empfehlung `citizens`:** spürbar
  in 15–25 Minuten; `merchants` braucht Glas und Gewürz von Fremdinseln und verdünnt die Planungsfrage.
- **F2 Vorgänger-Zeit zeigen:** **Empfehlung ja**, als eine Zahl ohne Medaillen; sie ist der erzählerische Haken und macht
  die Wertung lesbar (TIEFE-5 «Punkte, die niemand versteht»).
- **F3 Abriss-Erstattung:** **Empfehlung `refundPct` 0** szenarioweit (Wiederverwendung Schuldbrief, kein Feld je Gebäude);
  ein abweichender Wert nur, wenn die Rechnung in E2 zeigt, dass «nichts ändern» sonst dominiert.
