# Recherche TIEFE-5: Rivalen ohne Kriegsspiel

Stand 2026-10-25 · Autor: design-researcher · Paket TIEFE-5 · Prozessstufe leicht · **Recherche, keine Spec**: Aufwandsstufen (S/M/L) sind Richtwerte, nicht gerechnet. Kontext: Skizzen TIEFE-1 (§5 Vergleich, K5 «Ratsbank», Referenz E2 «Rivalen», N-104) und TIEFE-2. Alle Mechaniken sind Genre-Gemeingut; Namen sind eigen (ADR-006).

**Methodik und Grenzen:** Websuche, ergänzt um einzelne Seitenabrufe. Mehrere Quellen (Fandom-Wikis) lieferten beim Abruf HTTP 402; deren Inhalt stammt dann aus der Suchzusammenfassung. Spielerstimmen sind Einzelmeinungen aus Foren, keine Umfrage. Zu Patrician und Port Royale fand die Suche kaum Belege zur Rivalen-KI; das ist als Lücke ausgewiesen, nicht aufgefüllt.

## Kurzfassung

- Genre-Vorbilder bauen Konkurrenz auf drei Arten: **KI-Siedler, die Inseln belegen** (Anno), **Punktewettlauf** (Settlers 7) und **politische Gegenspieler** (Tropico). Ein reiner Rivale ohne Kriegsmittel ist selten; das Genre löst Spannung meist mit Drohung (Krieg, Piraten).
- Spieler loben an Rivalen: **Handel mit ihnen lohnt** (Anno 1602), **sichtbarer Wettlauf um knappe Inseln**, **politische Zielkonflikte mit Folgen** (Tropico). Sie hassen: **passive KI** («wartet, bis ich expandiere»), **KI mit Cheats**, **KI, die alle Inseln sofort belegt**, **intransparente Punktevergabe**.
- Für ein friedliches, deterministisches Einzelspielerspiel passen am besten **sichtbare, vorab angekündigte Rivalen-Pläne** (kein verdeckter KI-Zufall) und **Rivalen als Kunde und Konkurrent zugleich**.
- Empfehlung: zuerst die kleinen Kandidaten R-D «Handelshaus-Wertung» (S) und R-C «Konzessions-Auktion» (S–M); R-A «Wettlauf um Inseln» (L) nur hinter einem Schalter und nach dem Entscheid N-104.

## R1 Vorbilder

### R1.1 Anno 1602 / 1404 (Wettlauf um Inseln, Handelspartner)

- **Mechanik:** KI-Gegner siedeln auf freien Inseln, handeln mit dem Spieler und können Krieg erklären. In 1602 ist der friedliche Sieg über Wirtschaft ausdrücklich möglich [Q2]. In 1404 setzt die KI nicht auf bereits besiedelte Inseln; wer früh Inseln beansprucht, sperrt sie aus [Q4], ein zweiter Marktplatz landeinwärts hält KI-Lager fern [Q3].
- **Spielerurteil:**
  - Positiv: Handel mit KI-Gegnern ist deutlich einträglicher als mit freien Händlern; Frieden wird belohnt, Krieg schneidet den besten Abnehmer ab [Q1].
  - Negativ: Die KI ist ausnutzbar. Sie hat Probleme mit Feuerschutz und kann Aristokraten nicht halten [Q5]; Inselsperren per Marktplatz sind ein bekannter Trick [Q3, Q4].
- **Lehre:** Der Rivale als **Kunde** macht Frieden attraktiv. Ein Wettlauf um Inseln funktioniert, aber die Regel «besiedelt bleibt gesperrt» ist leicht zu überlisten.

### R1.2 Anno 1800 (Wettbewerber mit Persönlichkeiten)

- **Mechanik:** Wettbewerber haben Schwierigkeitsstufen und Persönlichkeiten. Leichte KI fragt vor einer Inselbesiedlung um Erlaubnis, mittlere und schwere nicht [Q6]. Ein Friedensschalter existiert; die Entwickler begründen Krieg als Abschreckung («Die Möglichkeit eines Krieges schreckt viele Spieler und KI ab») und Frieden als aktiven Prozess [Q9].
- **Spielerurteil:**
  - Die mittlere KI gilt als passiv: «sie erweitern nur sehr passiv ihre eigenen Inseln», selbst Piraten seien wenig aktiv [Q7]. Harte Gegner machen die Welt «lebendiger» [Q7].
  - Andere Seite: Nach Entdeckung der Neuen Welt seien alle Inseln sofort von der KI belegt gewesen, was den Durchgang ruiniere [Q11]. Wer ohne KI spielt, langweile sich nach etwa 25 bis 35 Stunden, weil Verluste und Inselkampf fehlen [Q11].
  - KI-Handel gilt als «meh» und «sehr episodisch» [Q8]. Cheat-Vorwürfe bei höheren Stufen kehren wieder [Q7, Q11].
  - Eine Stimme: Die KI sei ein Puffer zwischen Spieler und Piraten, Wert für das Tempo statt für den Kampf [Q11].
  - Land-Kampf lehnen viele ab: «Anno is not a combat game» [Q10].
- **Lehre:** Zwei Fehlerbilder gegenüberstellen: **zu passiv** (Rivale wartet) und **zu gierig/unfair** (Rivale belegt alles). Beide entstehen, wenn der Rivale verdeckt entscheidet. Dazu passt ein **Schalter** (Rivalen aus/leicht/stark), den das Genre selbst anbietet.

### R1.3 The Settlers 7 (Siegpunkte)

- **Mechanik:** Sieg durch Besiegen der Gegner oder durch Siegpunkte für Reichtum, Land oder Technologie; die Punkte zählen vor allem in Mehrspieler- und Gefechtsmodus gegen die KI [Q12].
- **Spielerurteil:** Die drei Pfade verschwimmen, die Punktelogik wird als Versprechen kritisiert, das nicht eingelöst werde [Q13]. Ein Spieler beklagt, die KI sammle früh Punkte und besetze Schlüsselorte, während seine Wirtschaft hinterherhinke [Q14]. Kampagnen gegen einen Gegner dauerten über drei Stunden und seien für Neulinge steil [Q12].
- **Lehre:** Eine **Wertung** gibt dem Spiel ein Ziel neben dem Bauen, wird aber zur Frustquelle, wenn der Rivale früh enteilt und der Spieler nicht erkennt, warum. Lesbarkeit der Punkte entscheidet.

### R1.4 Tropico 6 (Fraktionen, Wahl, Gegenspieler)

- **Mechanik:** Fraktionen stellen Aufträge, belohnen Erfüllung und missbilligen Gegenentscheide; vor der Wahl lässt sich ein Rivale bestechen, Wahlen sind manipulierbar mit Kosten für die Zustimmung [Q15].
- **Spielerurteil:** Gelobt als echte strategische Spannung («wer eine Fraktion stützt, verärgert die andere»). Kritik: Folgen seien zu zahm, etwa verärgere sich das Militär nie [Q16].
- **Lehre:** Ein Gegenspieler muss **Folgen mit Biss** haben, sonst ist er Dekor. Für Inselreich liegt die Nähe zum Rat nahe (Skizzen TIEFE-1 §4: Risiko «Nähe zum Rat»).

### R1.5 Dorfromantik und Islanders (Wertung ohne Gegner)

- **Mechanik:** Kein Kampf, keine Rivalen; Spannung entsteht aus einer **Punktejagd** gegen den eigenen Bestwert und aus Aufgaben, die Plättchen freischalten [Q17, Q18].
- **Spielerurteil:** Wenig Herausforderung ist hier gewollt («Herausforderung ist das Gegenteil dessen, was die meisten in diesem Genre wollen») [Q17]. Die Punktejagd ist ein optionaler Anspruch für Wiederspiel [Q18].
- **Lehre:** Ein **Gegenüber muss nicht bedrohen**. Eine Kurve, die man schlagen will, genügt. Das passt zu den Inselproben (TIEFE-1 §6).

### R1.6 Patrician IV, Port Royale 4, Anno 2070 (Pirat, Handel, Wahlmodus)

- **Mechanik:** Patrician und Port Royale setzen auf Handelsrang, Ruf und Piraterie; Port Royale 4 lässt Städte erobern oder Flotten jagen [Q21]. Anno 2070 stellt Piraten als zeitlich begrenztes Weltereignis dar und lässt die Wahl, ob KI-Gegner als Rivale oder Freund auftreten [Q22].
- **Spielerurteil:** Port Royale 4 hat gemischte Wertungen (56,8 % auf Steam, Stand der Fundstelle) [Q21]. Zu Patrician IV: «viel besser, wenn Piraten das Spiel nicht kaputt machten» [Q19]. Eine KI mit Anpassung der Schwierigkeit wird nur als Werbetext genannt [Q20]. Belege zum Preiskampf der Händler fanden sich nicht.
- **Lehre:** Wo Piraterie im Mittelpunkt steht, wird sie zur Hauptquelle von Frust. Das stützt die Linie, Bedrohungen **begrenzt und vorhersehbar** zu halten (E1 hat bereits Piraten mit Geleit).

## R2 Muster

### Was trägt

1. **Der Rivale ist auch Kunde.** Handel mit dem Gegner lohnt mehr als mit Neutralen [Q1]; so hat Frieden einen Preis, nicht nur eine Moral.
2. **Knappheit mit Zeitdruck.** Inseln, die ein anderer belegt, sind ein spürbarer Verlust ohne Krieg [Q3, Q4, Q11].
3. **Sichtbarer Plan.** Wer vorher weiss, was der Rivale tut, kann vorbauen. Tropico belohnt das mit Aufträgen und klaren Folgen [Q15].
4. **Wertung gegen eine Kurve** reicht als Ziel (Dorfromantik, Settlers 7) [Q12, Q18].
5. **Schalter für die Härte.** Anno bietet ihn selbst an [Q6, Q9, Q11].

### Was nervt

1. **Passive KI**, die auf den Spieler wartet [Q7, Q11].
2. **Cheat-KI** und unlesbare Boni [Q7, Q11, Q14].
3. **Totalbelegung** freier Inseln, bevor der Spieler reagieren kann [Q11].
4. **Ausnutzbare Sperrregeln** (Marktplatz-Trick) [Q3, Q4].
5. **Folgenlose Gegenspieler** [Q16].
6. **Punkte, die niemand versteht** [Q13, Q14].
7. **Zu lange Partien durch Gegner** [Q12].

## R3 Mechanik-Kandidaten

Gemeinsame Regel für alle Kandidaten (Determinismus): Rivalen-Entscheidungen sind **eine reine Funktion von Seed, Tick und Weltzustand** und ziehen aus einem **eigenen seeded Strom** (wie ADR-010 für Expeditionen), nie aus dem Hauptstrom. Dann bleiben Ziele 1–3 ohne Rivalen bitgleich, solange der Schalter «Rivalen aus» ist. Jeder Kandidat erhöht die Save-Version um 1, älter wird mit Hinweis abgewiesen (Test).

### R-A Wettlauf um Inseln («Vorkaufsrecht»)

- **Idee:** Ein Handelshaus kündigt an, welche Fremdinsel es zu welcher Zeit anläuft («Haus Brandt rüstet nach Weidenau, Ankunft in 12 min»). Mit Kontor oder Vorkaufsrecht kommt der Spieler zuvor. Verlust: Die Insel ist für diese Partie gesperrt oder teurer.
- **Beleg:** Wettlauf um Inseln trägt, wenn lesbar [Q3, Q11]; Totalbelegung und Cheat-Gefühl vermeiden durch Ankündigung und Obergrenze (höchstens eine Insel je Zeitfenster) [Q11].
- **Nutzen:** hoch (neue Säule «Konkurrenz», Skizzen §5). **Aufwand: L** (Rivalen-Akteur, Planer, Fernkarte-UI, Balancing-Rechnung).
- **Abhängigkeiten:** Fernkarte (live), Kontor-System, Inselruf I-187, Entscheid N-104.
- **Risiko:** Sim- und Save-Feld je Fremdinsel («Besitzer», «Ankunft»). **Ziele 1–3 nicht bitgleich** ausser mit Schalter «aus». Balancing-Test braucht Rivalen-aus-Baseline.

### R-B Marktanteil am Fernmarkt

- **Idee:** Auf jeder Fremdinsel hält der Spieler einen Anteil an der Nachfrage je Ware, das Handelshaus den Rest. Lieferverlässlichkeit und Stammkunden-Treue (Aufträge) steigern den Anteil; eine Lücke gibt ihn ab. Wirkung: Preis- und Mengenbonus statt Verlust.
- **Beleg:** KI-Handel gilt als episodisch und wirkungslos [Q8]; ein Marktanteil macht den Rivalen **spürbar** ohne Krieg. Rivale als Kunde [Q1] bleibt möglich, wenn der Rest-Anteil bei ihm als Abnahme erscheint.
- **Nutzen:** mittel bis hoch (verknüpft Aufträge, Stammkunden und Fernangebote zu einem Ziel). **Aufwand: M.**
- **Abhängigkeiten:** Aufträge, Stammkunden (I-047/I-091), Fernangebote.
- **Risiko:** Ändert bestehende Regeln («K5 ändert, ersetzt nicht»); Dominanz-Rechnung nötig. Weltfeld «Anteil je Insel und Ware»; deterministisch, solange der Anteil eine Funktion von Liefertreue ist.

### R-C Konzessions-Auktion

- **Idee:** Alle N Minuten werden Sitze oder Privilegien (Vorkaufsrecht, Kontorplatz, Fernangebot) versteigert. Das **Höchstgebot des Handelshauses steht vorab fest** und ist sichtbar («Haus Brandt bietet 340»). Der Spieler überbietet oder lässt es.
- **Beleg:** Sichtbarer Plan statt verdeckter KI [Q15]; bindet Geld im Spätspiel ein (R722). Knüpft an K5 «Ratsbank» an (Skizzen §4, Sitze zurückkaufen).
- **Nutzen:** mittel; macht Geld zu einer Senke mit Gegenüber. **Aufwand: S–M.**
- **Abhängigkeiten:** K5 Ratsbank, Stadtrecht (Abgleich der Senken), Inselruf I-187.
- **Risiko:** Gering. Gebote aus Seed-Strom plus Tabelle; Save-Feld «Gebotstabelle». Gefahr: zwei Senken leeren dieselbe Kasse (Kostenleiter rechnen).

### R-D Handelshaus-Wertung (Ghost-Kurve)

- **Idee:** Ein oder zwei Handelshäuser haben eine **vorberechnete Kurve** (Handelsvolumen, Inselzahl) abhängig von Schwierigkeit und Seed. Der Spieler sieht die Kurve neben seiner eigenen und kann sie überholen. Kein Eingriff in die Spielwelt. Ende der Partie: Rang in der Chronik.
- **Beleg:** Punktejagd gegen eine Kurve trägt [Q17, Q18]; Settlers 7 zeigt die Fallen: Rivale enteilt früh und Punkte sind unlesbar [Q13, Q14]. Darum **Kurve flach beginnen, jede Punktquelle einzeln ausweisen**.
- **Nutzen:** mittel (Ziel für Spät- und Wiederspiel). **Aufwand: S.**
- **Abhängigkeiten:** Chronik und Ehrenbuch (live), Inselproben, Partiebrief K4.
- **Risiko:** Sehr gering, keine Rückwirkung auf die Sim; Save nur Seed und Schwierigkeit. Gefahr: «Cheat»-Gefühl, wenn die Kurve nicht erklärt wird [Q7].

### R-E Rivale als Kunde und Gunst

- **Idee:** Das Handelshaus kauft zu festen Zeiten Überschüsse zum Aufpreis und hat eine **Gunst-Skala** (Tropico-artig): Aufträge des Hauses erfüllen steigert Gunst und Preise; ein Konkurrenzauftrag eines anderen Hauses senkt sie. Entscheiden statt Kämpfen.
- **Beleg:** Handel mit Rivalen lohnt [Q1]; Fraktionsaufträge mit Belohnung und Gegenwirkung [Q15]; Folgen müssen Biss haben [Q16].
- **Nutzen:** mittel. **Aufwand: M.**
- **Abhängigkeiten:** Aufträge, Stammkunden, Fernangebote.
- **Risiko:** Nähe zu Stammkunden-Regeln (I-047/I-091), deren Strafe geparkt ist. Weltfeld «Gunst je Haus».

### R-F Gegenantrag im Rat

- **Idee:** Bei einem Ratsbeschluss stellt ein Handelshaus einen **Gegenantrag**; der Spieler muss beide Seiten abwägen (Gunst und Kosten).
- **Beleg:** Tropico-Fraktionen [Q15, Q16].
- **Nutzen:** gering bis mittel. **Aufwand: M.**
- **Risiko:** Hohe Nähe zu Rat und Edikten (TIEFE-1 §4); Doppelung. **Nicht empfohlen**, nur geparkt.

### Übersicht

| Kürzel | Mechanik                | Nutzen        | Aufwand | Ziele 1–3 bitgleich       | Save       | Risiko                   |
| ------ | ----------------------- | ------------- | ------- | ------------------------- | ---------- | ------------------------ |
| R-D    | Handelshaus-Wertung     | mittel        | S       | ja                        | +1 (klein) | sehr gering              |
| R-C    | Konzessions-Auktion     | mittel        | S–M     | ja (Baseline kauft nicht) | +1         | gering                   |
| R-E    | Rivale als Kunde, Gunst | mittel        | M       | ja mit Schalter           | +1         | mittel (Nähe Stammkunde) |
| R-B    | Marktanteil             | mittel–hoch   | M       | nein, nur mit Schalter    | +1         | mittel (Dominanz)        |
| R-A    | Wettlauf um Inseln      | hoch          | L       | nein, nur mit Schalter    | +1         | hoch (Balancing)         |
| R-F    | Gegenantrag im Rat      | gering–mittel | M       | ja mit Schalter           | +1         | hoch (Doppelung)         |

## Empfehlung

1. **Reihenfolge:** R-D und R-C zuerst. Sie sind klein, brechen nichts und prüfen, ob ein Gegenüber das Spätspiel trägt. Danach R-E. R-A und R-B erst nach N-104 und nur mit Schalter «Rivalen aus/leicht/stark» [Q6, Q9].
2. **Warum so:** Die Belege zeigen zwei Hauptfehler, **Passivität** und **Unfairness** [Q7, Q11, Q14]. Beides kommt von verdeckten Entscheidungen. Angekündigte, vorab berechnete Rivalen-Züge vermeiden beides und sind obendrein ohne Zufall testbar.
3. **Keine Kampf-Mechanik.** Drohung wirkt im Genre als Abschreckung [Q9]. Ein friedliches Spiel ersetzt sie durch Knappheit und Zeitdruck (R-A, R-C), nicht durch Gewalt.
4. **Schalter von Anfang an.** Viele Spieler wollen keine KI-Rivalen [Q10, Q11]. «Rivalen aus» hält Ziele 1–3 bitgleich.
5. **Lesbarkeit als Abnahmekriterium:** Jede Rivalen-Aktion zeigt vorab Ziel, Zeitpunkt und Grund (Anti-Cheat-Gefühl) [Q7, Q13].

## Entscheidungsbedarf (Entwurf an L0, kein Ruling)

- **E-1:** R-D und R-C als Ideen in den Pool, Reihenfolge vor N-104? Empfehlung: ja, beide laufen ohne Seekampf und ohne Inselbesitz.
- **E-2:** Rivalen-Schalter («aus/leicht/stark») als Pflichtbestandteil jeder Rivalen-Spec? Empfehlung: ja.
- **E-3:** Eigener seeded Strom für Rivalen (Analogon ADR-010) als Grundsatz? Empfehlung: ja, bei Umsetzung als ADR festhalten.
- **E-4:** R-F fallen lassen? Empfehlung: parken, wegen Rat-Doppelung.

## Quellenliste

Hinweis: Aussagen zu «Spielzeit ohne KI» (Q11) stammen aus Suchzusammenfassungen zu Anno-1800-Foren; Primärtext nur für den Land-Kampf-Teil abgerufen.

| Nr. | Quelle                                                                                                                               | Verwendet für                                                         |
| --- | ------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| Q1  | GOG, Anno 1602 AD, Nutzerbericht: https://www.gog.com/ru/game/anno_1602_ad                                                           | Handel mit KI lohnt, Frieden belohnt                                  |
| Q2  | Wikipedia, Anno 1602: https://en.wikipedia.org/wiki/Anno_1602                                                                        | Friedlicher Sieg möglich                                              |
| Q3  | GOG-Forum, 1404 AI island settlements: https://www.gog.com/forum/anno_series/1404_ai_island_settlements                              | Marktplatz-Trick gegen KI-Siedler                                     |
| Q4  | Anno 1404 Wiki, Hard AI guide: https://anno1404.fandom.com/wiki/Hard_AI_guide                                                        | Besiedelte Inseln gesperrt (Abruf 402, Suchauszug)                    |
| Q5  | Steam, Anno 1404 History Edition: https://steamcommunity.com/app/1281630/discussions/0/3190238550313121845                           | KI-Schwächen Feuer, Aristokraten                                      |
| Q6  | Anno 1800 Wiki, Competitors: https://anno1800.fandom.com/wiki/Competitors                                                            | Persönlichkeiten, Erlaubnis bei Inselbelegung (Abruf 402, Suchauszug) |
| Q7  | Steam, Anno 1800, Passivität: https://steamcommunity.com/app/916440/discussions/0/4353365966424663853                                | Passive KI, Piraten, Cheat-Vorwürfe (abgerufen)                       |
| Q8  | Reddit r/anno (Spiegel), AI's favourite goods: https://redlib.belloworld.it/r/anno/comments/1g9ct5b/ais_favourite_goods              | KI-Handel episodisch                                                  |
| Q9  | Anno Union, Devblog «The Art of War I»: https://www.anno-union.com/devblog-the-art-of-war-i/                                         | Friedensoption, Abschreckung (abgerufen)                              |
| Q10 | Steam, Anno 1800, Landkampf: https://steamcommunity.com/app/916440/discussions/0/3976176932754139001                                 | «Anno is not a combat game» (abgerufen)                               |
| Q11 | Steam, Anno 1800, KI-Inselbelegung: https://steamcommunity.com/app/916440/discussions/0/4353365446957125974/?l=greek                 | Totalbelegung, Spiel ohne KI (Suchauszug)                             |
| Q12 | Expert Reviews, Settlers 7: https://www.expertreviews.co.uk/technology/gaming/ubisoft-the-settlers-7-paths-to-a-kingdom-review       | Siegpunkte, Dauer (Suchauszug)                                        |
| Q13 | Gamereactor, Settlers 7: https://www.gamereactor.eu/the-settlers-7-paths-to-a-kingdom-review/                                        | Pfade verschwimmen (Suchauszug)                                       |
| Q14 | Steam, Settlers 7: https://steamcommunity.com/app/48120/discussions/0/523898291511961278                                             | KI sammelt früh Punkte (Suchauszug)                                   |
| Q15 | Windows Central, Tropico 6: https://windowscentral.com/tropico-6-pc-review-hilarious-city-building-simulator-surprising-amount-depth | Fraktionen, Wahl (Suchauszug)                                         |
| Q16 | Steam, Tropico 6: https://steamcommunity.com/app/492720/discussions/0/1679190184077235074                                            | Folgen zu zahm (Suchauszug)                                           |
| Q17 | Nintendo Life, Dorfromantik: https://www.nintendolife.com/reviews/switch-eshop/dorfromantik                                          | Geringe Herausforderung gewollt (Suchauszug)                          |
| Q18 | GamingOnLinux, Dorfromantik: https://www.gamingonlinux.com/2022/05/relaxing-and-gorgeous-city-builder-dorfromantik-is-out-now/       | Punktejagd, Islanders-Vergleich (Suchauszug)                          |
| Q19 | Steam, Patrician IV: https://steamcommunity.com/app/57620/discussions/0/530649887212597059                                           | Piraten als Spielbrecher                                              |
| Q20 | Steam, Patrician III: https://store.steampowered.com/app/33570/Patrician_III/                                                        | Ruf, Bürgermeister, KI-Werbetext                                      |
| Q21 | SteamDB-Spiegel, Port Royale 4: https://steamdata.ai/en-US/game/1024650/port-royale-4                                                | Wertung gemischt                                                      |
| Q22 | Steam, Anno 2070: https://steamcommunity.com/app/48240/discussions/0/864971287517943410?l=german                                     | KI als Rivale oder Freund wählbar                                     |
