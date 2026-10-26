# Rechnung T4-4 «Rückfracht» (Erweiterung «Neue Ufer», N-104)

Stand 2026-10-25 · Paket `RECHNUNG-RUECKFRACHT` · Prozessstufe leicht · `design-economy-designer` für `lead-design` ·
Rechenweg, Formeln und lange Tabellen: [Anhang 01](2026-10-25-rueckfracht-rechnung/anhang-01-rechenweg.md).
**Alle Zahlen sind gerechnet, nicht gemessen.** Herkunft je Zahl: Def-Datei:Zeile (Stand main `9ba7d79b`),
«gemessen I-144» oder «gerechnet I-144» (aus der Zukaufpreis-Rechnung, Commit `528ac9f5`) oder «Annahme». `src/` und
`tests/` sind unverändert.

## 0 Kurzfassung und Urteil

**Urteil: trägt nur unter drei Auflagen** (E1–E3). Ohne sie trägt T4-4 nicht.

1. **(a) Zukauf dominiert, und kein Preis ändert das.** Geld ist knapp, wenn überhaupt, nur in Ziel 1–2. «Neue Ufer»
   beginnt nach Ziel 3, und dort bindet Geld nicht (I-144). Rückfracht ist in Geld schon heute billiger als Zukauf
   (Werkzeug 21,5 gegen 40 je Stück). Zukauf ist aber **bequemer**: keine 4 Werkzeugmacher, keine Schule, kein Holz.
   Die Differenz beträgt 444 Geld/min, also 10 % des Spätspiel-Überschusses (≈ 4400/min, gerechnet I-144). Ein
   Zukauf-Faktor an der Nordküste bricht die Dominanz erst ab f ≈ 4,6 (Überschuss < 0). Das ist nicht erklärbar.
   Und er läuft ins Leere: Das Lampenöl-Schiff fährt ohnehin nach Norden, also kauft der Spieler daheim zum Listenpreis
   und lädt dort.
2. **Der Hebel, der unabhängig vom Kontostand wirkt, ist die Menge, nicht der Preis.** Gemeint ist ein Kontor
   an der Nordküste, dessen Händler das Heimatgut nicht führt (E1). Dann muss das Gut über See kommen, gekauft oder
   gebaut. Die echte Wahl liegt in der **Flotte**: Bei Grenze 4 belegt die Nordroute 2 Schiffe, Gewürz 1–2. Damit ist
   die Flotte voll, und die Expedition konkurriert (§4).
3. **(b) Neuer Überschuss ohne Gegenwicht entsteht an zwei Stellen.** Ist Lampenöl beim Händler kaufbar, ist die ganze
   Nordinsel überspringbar (E2). Ist Lampenöl ein Muss-Bedürfnis aller Kaufleute, halbiert sein Ausfall deren Steuer:
   −3960 bis −5280 Geld/min gegen ≈ 4400 Überschuss. Das ist eine Falle, keine Wahl (E3).
4. **Nahrung als Heimatgut trägt nicht.** 40 Nordleute × 0,5 brauchen 120/min, das sind 4,8 Schiffe bei Seeweg 60. Das
   sprengt die Flotte 4 und 6 und widerspricht «Fischfang ist reich» (Skizze §2.1). **Werkzeug mit 0,1** trägt.
5. **Die Skizze «60 Heimathäuser mit Licht» passt nicht zum Massstab.** Ziel 3 sind 80 Kaufleute, also 4 Häuser zu 20
   (`tiers.ts:42,57`). 60 Häuser mit Licht brauchen 720 Lampenöl/min, das sind 28,8 Schiffe. Das Ziel muss in
   Einwohnern stehen: **60 Kaufleute mit Licht**.

| Datei / Feld (Vorschlag für Spec «Neue Ufer» N2/N3)                           | Ist                                       | Soll                                       | Auswirkung                                                                                 |
| ----------------------------------------------------------------------------- | ----------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------ |
| Nordleute St. 2 `needs.tools` (neue Stufendef. analog `tiers.ts:25`)          | –                                         | **0,1** je E und 100 T (Bereich 0,05–0,13) | 24 Werkzeug/min · 0,96 Schiffe bei d 60 · Puffer im Nordlager 4,2 min                      |
| Nordinsel-Def (analog `IslandDef`, `sea.ts:19`) Feld `noBuy` (neu)            | `buy()` auf jeder Kontor-Insel (trade.ts) | `['tools']`                                | Heimatgut kommt nur über See; Zukauf daheim + Schiff bleibt der teure Ausweg               |
| `GOODS.lampoil.buy` (neues Gut, `goods.ts`)                                   | –                                         | **kein Händlerkauf**                       | sonst 36 Lampenöl/min × Preis statt Nordinsel (§5)                                         |
| `GOODS.lampoil.sell`                                                          | –                                         | **≤ c_L** (Kettenkosten je Stück)          | kein Verkaufskreis; Beispiel Rum-artige Kette: c_L 15 + Fracht 1,8–3,6 → sell ≤ 18         |
| Ziel «Zwei Reiche»: Licht-Bedarf ℓ und Umfang E_L                             | Skizze: 60 Häuser                         | ℓ **0,1**, E_L **60 Kaufleute** (40–80)    | 36 Lampenöl/min · 1,44 Schiffe bei d 60 → 2 Schiffe                                        |
| Fehlendes Lampenöl (N3)                                                       | Skizze: Bedürfnis der Oberschicht         | **Zusatz**, halbiert keine Steuer          | Ausfall kostet dann den Zusatz, nicht 90–120 % des Überschusses                            |
| Seeweg Heimat–Nordinsel d_N (Erzeugung bei Entdeckung)                        | –                                         | **45–80** Kacheln, Richtwert 60            | Umlauf 1,5–2,7 min; Lampenöl ≤ 2 Schiffe bis d 83 (E_L 60)                                 |
| Zukauf-Faktor an der Nordküste                                                | 100 % (`BUY_RISE` 0, `goods.ts:69`)       | **keiner**                                 | trägt nicht: kippt erst ab f ≈ 4,6 und ist über den Heimzukauf umgehbar                    |
| `SHIP_MAX` (`sea.ts:4`) / Werft (Erweiterung 1), `SHIP.capacity` (`sea.ts:8`) | 4 / 6 · 50                                | unverändert                                | Flotte 4: Nord 2 + Gewürz 1–2 = voll, also echte Wahl · Flotte 6: 2 frei, also weiche Wahl |

**Balancing-Test:** nicht berührt. Alle Werte sind neue Defs der Erweiterung. Sie greifen erst nach Ziel 3 auf einer
eigens erzeugten Insel, und `tests/sim/balance.test.ts` hat keine Nordinsel. E1 braucht im Code eine Prüfung in
`buy()`, die ohne Nordinsel nie greift. Bitgleich (gerechnet).

## 1 Ausgangslage

- **T4-4** (Recherche TIEFE-4, Abschnitt T4-4): Die Nordküste kann ein Grundgut nicht bauen. Es kommt aus der Heimat,
  die Heimat bekommt Lampenöl. Entartet laut Recherche: «Zukauf statt Rückfracht dominiert, falls Geld nicht knapp
  ist», Gegenmittel «Zukaufpreis an der Nordküste über Heimatniveau».
- **Skizze «Neue Ufer»** (`2026-10-23-tiefe-1-skizzen.md` §2): Phase nach Ziel 3. Nordleute in 2 Stufen, Kette
  Robbenfang → Tranküche → Lampenöl. Ziel «Zwei Reiche»: 40 Nordleute St. 2 und 60 Heimathäuser mit Licht, 10 min
  gehalten. Wärme ist Grundbedürfnis, Holz wächst langsam, Fischfang ist reich.
- **Zukaufpreis-Rechnung** (R918): kein Zukaufmodell, `BUY_RISE` bleibt 0. Kernbefund: «Geld bindet im Spätspiel
  nicht». Überschuss ≈ 4400/min (gerechnet I-144).
- **Code-Fakten:** Kauf geht auf jeder Insel mit Kontor zum gleichen Listenpreis (`trade.ts:106`). Schiffe entladen
  und laden an beiden Enden ohne Liegezeit (`ships.ts:203–210`). Fahrzeit 10 T je Kachel (`sea.ts:94`). Fehlt ein
  Gut, verliert das Haus 1 Einwohner je 50 T. Ein Abstieg der Stufe existiert nicht (`population.ts:229–233`,
  `timing.ts:6`).

## 2 Modell

Variablen: Bedarf q je Einwohner und 100 T, Einwohner E, Seeweg d (Kacheln), Umlauf R = 20·d T = d ÷ 30 min.

- **Fluss je min:** 6·q·E. **Schiffe je Richtung:** n = q·E·d ÷ 250 (Anhang A.1).
- **Kosten je Stück:** Eigenproduktion c = Σ Unterhalt ÷ Ausstoss. Fracht, wenn nur diese Richtung lädt:
  u = 0,06·d. Zukauf: f · `buy`.
- **Die bindende Richtung trägt das Schiff.** Weil n_L (Lampenöl) ≥ n_H (Heimatgut), fährt das Heimatgut gratis mit.

## 3 Rechnung (Mengengerüst und Kosten, Endzustand Ziel «Zwei Reiche»)

Annahmen (offen): 40 Nordleute St. 2 mit Steuer 7 und 8 Einwohnern je Haus (wie Siedler, `tiers.ts:24–27`). Heimatgut
Werkzeug q 0,1. Lampenöl ℓ 0,1 für E_L 60 Kaufleute. d_N 60. Gewürz-Seeweg 25–40 (`sea.ts:43–70`).

| Fluss                           | je min | Schiffe bei d 60 | Bemerkung                                                    |
| ------------------------------- | ------ | ---------------- | ------------------------------------------------------------ |
| Werkzeug Heimat → Nord (q 0,1)  | 24     | 0,96             | fährt gratis mit, solange n_H ≤ n_L                          |
| Lampenöl Nord → Heimat (E_L 60) | 36     | 1,44 → **2**     | bindend; bei E_L 80: 1,92                                    |
| Gewürz Insel → Heimat (80 K)    | 48     | 0,8–1,28 → 1–2   | besteht seit Ziel 3                                          |
| **Flotte belegt**               |        | **3–4**          | Grenze 4: voll, Expedition nur durch Abzug · Werft 6: 2 frei |

**Kosten Heimatgut je min** (Spätspiel-Überschuss ≈ 4400, gerechnet I-144):

| Weg                                                              | Geld/min | Anteil Überschuss | je Stück |
| ---------------------------------------------------------------- | -------- | ----------------- | -------- |
| Rückfracht, Eigenproduktion (3,2 Werkzeugmacher, 1,2 Holzfäller) | 516      | 11,7 %            | 21,5     |
| Zukauf daheim + Lampenöl-Schiff (Fracht gratis)                  | 960      | 21,8 %            | 40       |
| Zukauf Nordküste, f = 1 (Ist)                                    | 960      | 21,8 %            | 40       |
| Schiffe Nordroute (2 × 15 je 100 T, `sea.ts:7`)                  | 180      | 4,1 %             | –        |

Die Differenz Eigen gegen Zukauf beträgt 444 Geld/min, also 6 s Überschuss je Minute. Das ist spürbar, bindet aber
nicht. Wäre «Neue Ufer» vor Ziel 3 spielbar (Überschuss 2538, Bürger), läge der Zukauf bei 38 %. Das bleibt nur ein
Merkposten, weil die Skizze die Erweiterung nach Ziel 3 legt.

**Bilanz je Einwohner und 100 T** (Rechenweg A.3):

| Stufe / Weg                         | Steuer            | anteiliger Unterhalt  | Netto                                             |
| ----------------------------------- | ----------------- | --------------------- | ------------------------------------------------- |
| Nordleute St. 2, Werkzeug selbst    | 7                 | 3,75                  | **+3,25**                                         |
| Nordleute St. 2, Werkzeug zugekauft | 7                 | 5,60                  | **+1,40**                                         |
| Kaufleute mit Licht, Mehrkosten     | Zusatz offen (E3) | 1,50 (Lampenöl-Kette) | −1,50 + Zusatz; ohne E3 schützt das Licht 11 je E |

Endzustand: 40 Nordleute bringen +130 je 100 T (eigen), also +780/min, oder +56 (Zukauf), also +336/min. Beide Pfade
sind positiv, keiner führt in die Pleite. Für «beide Pfade ≥ 0» gilt q ≤ 0,135 (Zukauf) bzw. q ≤ 0,25 (eigen).

## 4 Prüfung der Gegenmittel

| Hebel                                            | wirkt ab                                                | erklärbar?                            | Urteil                                                                                       |
| ------------------------------------------------ | ------------------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------- |
| Zukauf-Faktor f Nordküste                        | Nordstadt-Netto < 0 ab f 1,35 · Überschuss < 0 ab f 4,6 | 1,35 ja («Fernzuschlag»), 4,6 nein    | **trägt nicht:** Netto < 0 bindet nicht (Heimat deckt), und der Heimzukauf + Schiff umgeht f |
| Händler Nordküste führt das Heimatgut nicht (E1) | sofort, unabhängig vom Kontostand                       | ja: «Der Norden kennt keine Schmiede» | **trägt:** Route Pflicht; Zukauf daheim bleibt ein Ausweg (Recherche: «gültig, teuer»)       |
| Händlervorrat (M2h) an der Nordküste             | Stoss > V                                               | ja                                    | nicht empfohlen: neuer Mechanismus, R918 hat M2 nicht gewählt; Fluss 24/min unter jedem Knie |
| Flottengrenze 4 ohne Werft                       | immer                                                   | ja                                    | **ist die eigentliche Wahl:** Nord 2 + Gewürz 1–2 = 4; mit Werft weich                       |

**Was die Wahl ist (R722):** Die Wahl «Rückfracht oder Zukauf» liegt im Spätspiel nur im Geld, und Geld bindet dort
nicht. Mit E1 entstehen zwei Fragen, die nicht am Kontostand hängen:

1. **Flotte:** Welches Schiff fährt Nord, Gewürz oder Expedition? Bei Grenze 4 ist das hart.
2. **Puffer:** Wie viel Werkzeug liegt im Nordlager (≤ 100, `goods.ts:84`)? Davon hängt ab, wie lange eine Störung
   zu überbrücken ist.

Zwei Ausbaupfade bleiben lohnend: Werkzeug daheim bauen (+3,25/E) oder daheim kaufen (+1,40/E).

## 5 Überschuss (Motor und Bremse)

- **Motor:** das Ziel «Zwei Reiche» und der Licht-Bedarf der Kaufleute. Sie ziehen Lampenöl.
- **Bremse:** die Flotte (50 je Fahrt, 4 bzw. 6 Schiffe), das Nordlager (100) und der Werkzeugfluss nach Norden.
- **Werkzeug-Kreis:** Kauf 40 > Eigen 21,5 > Verkauf 15 (`goods.ts:11`). Weder «billig bauen, teuer verkaufen» noch
  «kaufen und verkaufen» bringt Gewinn. **Kein Kreis.**
- **Lampenöl-Kreis:**
  - **Kaufbar:** Ist Lampenöl beim Händler kaufbar, kauft der Spieler daheim 36/min statt eine Nordstadt zu bauen.
    Bei einem Preis um 40 sind das 1440/min, 33 % des Überschusses. Das wäre ein Freikauf der Erweiterung → E2.
  - **Verkäuflich:** Verkauf ist erlaubt. Die Sättigung (−1 Punkt je Stück, +1 je 10 T, Boden 30 %, `goods.ts:65–67`,
    `timing.ts:18`) begrenzt ihn auf ≈ 60/min zum vollen Preis. Mit sell ≤ c_L entsteht kein Motor. Bei sell 25 statt
    18 entstünden höchstens (25 − 18,6) × 60 ≈ 384/min (9 %): klein, aber ein Geldfluss ohne Gegenwicht.
- **Lampenöl als Muss-Bedürfnis:** Fehlt es, halbiert sich die Steuer der Kaufleute (`population.ts:247`). Bei 60
  Kaufleuten sind das −3960/min (90 % des Überschusses), bei 80 −5280/min (> 100 %). Das wird beim Freischalten
  rückwirkend wirksam → E3.

## 6 Randfälle (mit Zahlen, Rechenweg A.4)

| Fall                                                | Zahl                                                                                            | Wirkung / Gegenmittel                                                                                            |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Schiff leer zurück (N2 ohne N3: noch kein Lampenöl) | 1 Schiff für 24/min; Fracht 90 ÷ 24 = 3,75 je Stück; Rückfracht 25,3 gegen Zukauf 40            | Rückfracht bleibt billiger; die Rückfahrt kann Tran oder Fisch zum Verkauf tragen                                |
| Heimat ohne Bedarf (Lampenöl nicht frei)            | Nord produziert ins Lager 100; Verkauf mit Sättigung ≤ 60/min                                   | kein endloser Überschuss: Lager voll, dann gehen Einheiten verloren (`production.ts:68`)                         |
| Heimat produziert Werkzeug nicht mehr               | Puffer daheim 100 + Nord 100 → 8,3 min, dann Schrumpfen 350 T                                   | Ausweg: Heimzukauf 960/min (21,8 %)                                                                              |
| Zukauf billiger als Rückfracht                      | in Geld nie im Bereich: Gleichstand erst bei d 308 (21,5 + 0,06 d = 40)                         | Zukauf gewinnt nur über Bequemlichkeit, darum E1                                                                 |
| Route gestrichen                                    | Nordlager 100 ÷ 24 = 4,2 min; dann 8 → 1 Einwohner in 350 T (35 s); Steuer halb ab leerem Lager | **«Abstieg langsam» (Recherche) stimmt nicht:** Schrumpfen ist schnell. Warnung ab Reichweite < 2 min (48 Stück) |
| Lampenöl-Route gestrichen                           | Heimlager 100 ÷ 36 = 2,8 min; danach (ohne E3) −3960/min                                        | E3                                                                                                               |
| Flottengrenze 4 ohne Werft                          | Nord 2 + Gewürz 1–2 → 3–4; Expedition (N1) nimmt 1                                              | bei Gewürz-Seeweg > 31: Expedition oder Gewürz oder Nord, nicht alle; Skizze §2.3 empfiehlt Werft vorher         |
| Gründung ohne Werkzeug (Folge E1)                   | Kontor 8 Werkzeug, Haus 0, Fischer 2 (`buildings.ts:252,49`)                                    | erste Fahrt muss Werkzeug laden; Hinweis im Gründungsdialog (UI, ausserhalb Rechnung)                            |

## 7 Entwürfe an L0 (R471, kein Entscheid)

- **E1** Der Händler am Nordkontor führt das Heimatgut nicht (Def-Feld `noBuy` der Nordinsel, Prüfung in `buy()`). —
  Warum: Geld bindet nach Ziel 3 nicht, kein Preisfaktor öffnet die Wahl, und der Heimzukauf umgeht jeden Nordfaktor. —
  Kosten bei Irrtum: S (Feld streichen), kein Save-Feld.
- **E2** Lampenöl hat keinen Händler-Kaufpreis, Verkauf mit sell ≤ c_L. — Warum: Sonst ersetzt der Kauf von 36/min
  die Nordinsel. — Kosten bei Irrtum: S (Preis nachtragen).
- **E3** Lampenöl wirkt als Zusatz für Häuser mit Licht und halbiert keine bestehende Kaufleute-Steuer. Das Ziel zählt
  **60 Kaufleute mit Licht** statt 60 Häuser. — Warum: Muss-Bedürfnis kostet beim Ausfall 90–120 % des Überschusses,
  und 60 Häuser brauchen 28,8 Schiffe. — Kosten bei Irrtum: M (Ziel und Bedürfnisregel in N3).
- **E4** Heimatgut Werkzeug, q 0,1 (Bereich 0,05–0,13); Nahrung verwerfen. Seeweg d_N 45–80. — Warum: §3, Anhang A.2. —
  Kosten bei Irrtum: S (Def-Werte).
- **E5** Warnung «Nordlager reicht < 2 min» und Recherche-Satz «Abstieg langsam» in der Spec «Neue Ufer» korrigieren.
  — Warum: Schrumpfen dauert 35 s je Haus. — Kosten bei Irrtum: S.

## 8 Offen

- Nordleute-Werte (Steuer, Einwohner je Haus, Wärme-Bedarf) und die Lampenöl-Kette sind **Annahmen**. N2 legt sie
  fest, danach ist §3 neu zu rechnen (Formeln A.1).
- Wie gross die Kaufleute-Zahl im Spätspiel wirklich ist (E_L), zeigt erst eine Messung nach Ziel 3. Gerechnet wurde mit
  80 (Ziel 3) und 60.
- Die Werft (Flotte 6) setzt Erweiterung 1 voraus. Ohne Werft ist die Expedition (N1) bei Gewürz-Seeweg > 31 nur durch
  den Abzug einer Route möglich.
