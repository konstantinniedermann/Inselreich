# Recherche TIEFE-6: Spielmodi und Wiederspielwert

Stand 2026-10-26 · Paket TIEFE-6 (Nutzerauftrag R862) · Rolle design-researcher (auf Abruf) · keine Playtests als Input.
Ergänzt [`TIEFE-1`](../../recherche/2026-10-23-tiefe-1.md) (Modus-Tabelle R2) und
[`TIEFE-2`](2026-10-25-tiefe-2-recherche.md) (K1–K5); Pool-Stand: [`docs/ideen.md`](../../ideen.md).
Die Spec TIEFE-5 (Rivalen) liegt in diesem Branch nicht vor (Branch `design/tiefe-5`); Rivalen-KI bleibt hier ausgeklammert.

## Kurzfassung

1. Am längsten halten Modi, die **dieselbe Aufbau-Schleife mit neuer Randbedingung** neu starten (Härtestufe, Ziel, Seed), nicht Modi mit neuem Inhalt.
2. **Lauflänge** ist die stille Stellgrösse: 2–3 h pro Partie fördert Wiederholung (Frostpunk, Against the Storm); Endlos ohne Ziel «ermüdet» nach 2–3 h.
3. **Numerischer Meta-Fortschritt** trägt kurz und läuft aus (Against the Storm: «nach der Zitadelle bleibt nur die Härteleiter»); für Inselreich passt Härteleiter + Freischaltung von Inhalt, nicht von Werten.
4. **Tages-/Monatsmodi** binden über Rückkehrgrund, nicht über Rangliste; Ranglisten ohne Server kippen (Betrug, Fairness).
   5 neue Empfehlungen (T6-1…T6-5, alle S/M) ergänzen den Pool; die grossen Modus-Bausteine (I-190–I-192, K1, K4) sind bereits vorgemerkt und werden hier nur durch Belege gestützt.

**Belegstärke:** Die Seiten wurden per Websuche gefunden. «Abgerufen» = Seite gelesen und ausgewertet; «Treffer» = nur Suchtreffer-Zusammenfassung. Steam-Diskussionen sind Einzelstimmen, Richtung statt Statistik. Reddit liess sich nicht direkt abrufen. Beleg und Einschätzung sind getrennt: **[B]** Beleg, **[E]** eigene Einschätzung. Übernommen werden nur Mechaniken, keine Inhalte (ADR-006).

## 1 Befunde je Modus-Typ

### 1.1 Szenarien und Kampagne

- **[B]** Frostpunk: Szenarien dauern etwa 2–3 h; ein Spieler schätzt rund 10 h aus dem Basisspiel. Die kurze Dauer «führt zu mehr Wiederholungen, weil ich meinen Stil verfeinere» – «nicht jeder mag das» [Q1].
- **[B]** Frostpunk: Feste Ereignisse machen Planen leichter, einzelne Spieler empfinden dieselbe Festlegung als härter («zu langsam, entlassen») [Q1]. Vorhersehbarkeit ist also ein Regler, kein Gewinn an sich.
- **[B]** Anno-Spieler beschreiben die Kampagne als «Sandbox mit Geschichte» und als Tutorial; danach setzen sie sich eigene Ziele [Q2][Q3]. Anno 117: Kampagne «endet abrupt», Steam «gemischt» [Q4].
- **[E]** Szenarien tragen als Einstieg und Lehrstück, als Wiederspiel nur, wenn sie eine **Wertung** bekommen. Das deckt der Pool ab (I-192 «Knappe Zeiten», Szenario «Schuldbrief» in der Spec Inselproben).

### 1.2 Endlos und Sandbox

- **[B]** Frostpunk Endlos: «2–3 Stunden, dann langweilig»; mehr Karten ausserhalb der Szenarien geben nur Spielraum zum Experimentieren [Q1]. Nachträglich mit Varianten ergänzt: Ausdauer (härter), Baumeister, Gelassenheit (ohne Druck) [Q5].
- **[B]** Frostpunk 2 «Utopia Builder»: sieben Startorte, drei Ziele, zufällige Ressourcen und Layouts, «ein paar Stunden» je Partie [Q6]. Die Community-Stimmung zur Langzeitbindung bleibt gemischt (Treffer) [Q7].
- **[B]** Islanders: Sandbox «ohne Grenzen oder Ziele» ist die Ergänzung; die Punktejagd trägt. Kritik: immer dieselben Landschaften und wenige Bausätze [Q8].
- **[B]** Dorfromantik: «Kreativmodus» wird von Einzelnen als der schönste genannt [Q9][Q10].
- **[E]** Sandbox ist Rückzugsort (Entspannung), kein Rückkehrgrund. Bei Inselreich praktisch vorhanden (Krisen aus, Alles frei; TIEFE-1); ein Ausbau lohnt nicht.

### 1.3 Herausforderungen mit Regeln und Schwierigkeitsleiter

- **[B]** Timberborn: drei Stufen plus eigene Optionen vor dem Start; «keine Strafe fürs Spielen auf Leicht»; alle Gebäude und Techniken auf jeder Stufe, nur der Überlebensdruck unterscheidet sich. Spieler erfinden Eigenregeln (ein Bezirk, Minimalbau, Speedrun) [Q11].
- **[B]** Timberborn: Schalter für Dürre und Giftflut wurden nachträglich als Kontrollkästchen ergänzt, Eskalation auf Leicht/Normal gedämpft [Q12].
- **[B]** Against the Storm: «Spielziel ist die erfolgreiche Siedlung auf der höchsten Stufe, die man schafft»; schwerere Stufen nehmen Optionen weg, statt Zahlen aufzublasen [Q13][Q14].
- **[B]** Slay the Spire (Genre-Nachbar): Sieg schaltet pro Charakter die Aufstiegsstufen 1–20 frei, steigend schwerer [Q15].
- **[B]** Dorfromantik: «Custom Mode» (eigene Regelsätze erstellen und teilen), «Schnell» und «Schwer» als Kurz-/Meisterformat [Q9].
- **[E]** Die Härteleiter mit Freischaltung durch Sieg ist der am breitesten belegte Wiederspielhebel und braucht keinen Server. Sie ist als K1 «Seegang» vorgemerkt; Timberborns Befund (alle Inhalte auf allen Stufen) stützt K1 und spricht gegen Stufen, die Inhalt sperren.

### 1.4 Tägliche, wöchentliche, monatliche Seeds

- **[B]** Dorfromantik bietet «jeden Monat eine neue Herausforderung» [Q9]. Spelunky: Daily-Challenge-Modus mit einem Versuch je Tag [Q16].
- **[B]** Slay the Spire 2: Tagesläufe zählen nur den ersten Versuch, damit nicht durch Wiederholen «gecheesed» wird; Einzelspieler-Ranglisten gelten als betrugsanfällig, tägliche/wöchentliche Rücksetzung mildert das (Treffer) [Q15].
- **[E]** Rückkehrgrund ohne Server geht über **lokale** Bestzeit plus Teilen-Text (I-191). Ein Monatsrhythmus (Dorfromantik) ist die sanftere Form: kein Tagesdruck, verpasste Termine kosten nichts. Im Pool fehlt der Monatsrhythmus (→ T6-3).

### 1.5 Roguelite-Läufe und Meta-Fortschritt

- **[B]** Against the Storm: Läufe ~2 h, bewusst vor dem «Plattwalzen» beendet, damit sie nicht langweilig werden; Königin-Zeitgeber erzeugt Enddruck; 10–20 h Fortschritt gehen mit dem Weltkarten-Reset nicht verloren [Q13]. Die Mechanik wiederholt den spannendsten Teil (Anfangsplanung) [Q17].
- **[B]** Spielerstimme: Die grösseren Belohnungen am Laufende machen den nicht-bleibenden Lauf wert; mit nur kleinen Freischaltungen wäre es nicht genug. Nicht-Permanenz hält Einzelne vom Kauf ab; andere sagen, es «wird nach einer Weile dünn» [Q14].
- **[B]** Nach der Zitadelle ist «die permanente Meta-Progression erledigt, es bleibt die Leiter der Herausforderung»; ein Spieler sieht «keinen Grund weiterzuspielen», andere halten die Härte selbst für das Ziel [Q18].
- **[B]** Entwickler: Zitadellen-Baum nur noch für dauerhafte Verbesserungen, neue Inhalte schalten sich per Stufe automatisch frei («fühlten sich nicht wie Upgrades an»); Wunsch, Blaupausen vorab zu wählen oder zu sperren, abgelehnt («das Beste aus dem Blatt machen») – stattdessen Zufall verbessert [Q19].
- **[B]** Cookie-Clicker-Prestige: Reset-Zeitpunkt umstritten (TIEFE-1) – Idle-Logik, nicht übertragbar.
- **[E]** Der Meta-Fortschritt trägt die ersten Dutzend Läufe und endet dann in der Härteleiter. Inselreich hat keinen Platz für Wertboni (Balancing-Test, Vergleichbarkeit der Proben, R722). Brauchbar: **Inhalt freischalten** (Ehrenbuch, K1), keine Zahlen.

### 1.6 Kurze Wertungsrunden

- **[B]** Islanders: Punktziel «wischt das Brett leer» und beginnt neu; die Zufallsinsel wird als «Roulette» kritisiert, wenn die nächste Karte kaum Platz bietet [Q8].
- **[B]** Dorfromantik: «Quick mode» als Kurzpause, ~96 % positive Bewertungen bei rund 15 800 Rezensionen [Q9]; Wiederholung kritisiert, DLC-Wunsch (Treffer) [Q10].
- **[E]** Faire Seeds sind die Voraussetzung jeder Wertung. Die Spec Inselproben kuratiert Kartennummern und prüft `seedUsed`; das genügt.

## 2 Passung zu Inselreich

| Modus-Typ                   | Beleg stark?      | Bereits im Pool / im Spiel                    | Passung                                          |
| --------------------------- | ----------------- | --------------------------------------------- | ------------------------------------------------ |
| Szenario mit Wertung        | mittel            | I-192, Spec Inselproben, Meisterprüfung       | ja; Wertung ist der Hebel                        |
| Endlos/Sandbox              | stark (dünn)      | schon vorhanden                               | Rückzugsort, nicht ausbauen                      |
| Härteleiter durch Sieg      | stark             | K1 Seegang, I-198 Gelübde                     | beste Passung (Sim deterministisch, ohne Server) |
| Tagesseed                   | mittel            | I-191                                         | ja, lokal                                        |
| Monatsrhythmus              | schwach/mittel    | nicht im Pool                                 | ja, S (T6-3)                                     |
| Roguelite mit Wert-Meta     | stark (Kehrseite) | –                                             | nein (Balancing, R722)                           |
| Inhalt freischalten         | mittel            | Ehrenbuch I-186, K1                           | ja                                               |
| Lauflänge/Kurzpartie        | mittel            | I-200 (geparkt)                               | ja; Priorität heben (T6-4)                       |
| Regler (Leicht/Eigenregeln) | mittel            | K4 Partiebrief (Regelcode), K1 (nur aufwärts) | teilweise neu (T6-5)                             |

## 3 Empfehlungen

Alle ohne neue Abhängigkeit; Save-Änderungen nur wie in den genannten Vorgängern. Nutzen/Aufwand nach dem Raster der Pool-Tabelle (Richtwert).

**T6-1 Leitplanke «Härte statt Zahlen» (Grundsatz, S).**
Meta-Fortschritt in Inselreich schaltet nur **Inhalt und Härtestufen** frei, nie Werte (Belege Q13, Q18, Q19; R722).
Nutzen: verhindert, dass Ehrenbuch/K1 später durch einen «Vermächtnis»-Bonus (I-134, geparkt) aufgeweicht werden.
Abgrenzung: I-134 bleibt geparkt; K1 und I-186 bleiben unverändert, T6-1 ist nur ein Ruling-Satz. Abhängigkeit: keine. Entscheidung: L0-Ruling.

**T6-2 Partie-Ende-Angebot «Nächste Insel» (S).**
Am Ende einer Partie (Sieg oder Scheitern) zeigt ein Abschlussbild bis zu drei konkrete Angebote: eine noch offene Meisterstück-Zeile, die nächste Härtestufe (sobald K1 live), eine Probe/die Tagesinsel. Belege: ATS beendet Läufe bewusst mit Belohnung und Anschluss [Q13]; «größere Belohnungen am Laufende» [Q14].
Nutzen: wandelt «Ende» in «noch eine». Abgrenzung: I-186 (Ehrenbuch) legt Meisterstücke ab, bietet aber keinen Folgeschritt an; I-197 (Kartennummer) betrifft den Start, nicht das Ende; die Chronik (Rückblick) bleibt unverändert. Aufwand: reine UI (`src/ui/`), liest vorhandene Zustände. Abhängigkeit: nach I-186 und Inselproben-UI (`menu.ts`), sonst leere Angebote.

**T6-3 Monatsprobe (S–M).**
Zusätzlich zur Tagesinsel (I-191) eine Probe, die sich **monatlich** aus dem Datum ergibt (Karte plus eine Regelabwandlung aus einer Def-Liste). Verpasste Monate kosten nichts, Bestzeit lokal. Belege: Dorfromantik «monatliche Herausforderung» [Q9]; Tagesläufe sind betrugs- und druckanfällig [Q15].
Nutzen: Rückkehrgrund mit wenig Druck; Spielerwirkung: «Der Spieler öffnet das Spiel am Monatsersten und spielt die Regelvariante des Monats.»
Abgrenzung: I-191 ist täglich, I-190 fest; K4 Partiebrief ist spielergemacht, T6-3 vom Datum gesetzt. Aufwand: Def-Liste plus Datumslogik auf dem Probenrahmen, kein Server. Abhängigkeit: Inselproben live (Save v19). Risiko: eine Regelabwandlung je Monat braucht Lösbarkeitsrechnung (Controller-Lauf).

**T6-4 Lauflänge als Ziel: I-200 «Kleine Insel» vorziehen (Priorität, M).**
Belege: 2–3 h-Partien führen zu mehr Wiederholung [Q1]; ATS plant ~2 h [Q13]; Dorfromantik «Quick» [Q9]. Der Pool parkt I-200 «als Baustein Inselproben Schnitt 2».
Nutzen: Eine Kurzpartie senkt die Schwelle für jeden anderen Modus (Proben, Monat, Härteleiter). Abgrenzung: keine neue Idee, nur Rangänderung; Risiko laut Pool: Kartenmasse über fünf Dateien. Abhängigkeit: Inselproben Schnitt 1. Entscheid bei L0.

**T6-5 Eigenregeln und Entlastung mit ehrlicher Wertung (M).**
Vor dem Start wenige Regler (Krisenstärke, Startmittel), Partie wird im Ehrenbuch mit Reglerstand gekennzeichnet; Meisterstücke zählen nur auf Standard. Belege: Timberborn «keine Strafe auf Leicht», alle Inhalte auf allen Stufen [Q11][Q12]; Dorfromantik Custom Mode [Q9]; Frostpunk «Gelassenheit» [Q5].
Nutzen: Einsteiger nicht abgewiesen, Meister bleiben vergleichbar. Abgrenzung: K1 geht nur **aufwärts** und wird erst durch Sieg frei; K4 teilt Regelcodes, liefert aber nicht die Regler selbst; «Krisen aus» ist ein Schalter, keine Stufe. Abhängigkeit: K4 (Regelcode) als Träger, K1 für die Stufenlogik. Vor dem Kurzdesign mit K1 und K4 zusammenlegen, damit nicht drei Regelmechanismen entstehen.

### Empfohlene Reihenfolge

[E] T6-1 (Ruling, sofort) → Inselproben (I-190/191/192, eingeplant) → T6-2 → K1 Seegang (mit T6-5 als Teil) → T6-4 → T6-3. K2 Seefahrerbrief, K5 und I-198 bleiben wie in TIEFE-2 geparkt.

## 4 Entscheidungsbedarf (Entwurf an L0)

1. Ruling-Entwurf zu T6-1: «Meta-Fortschritt schaltet Inhalt und Härte frei, nie Spielwerte; I-134 bleibt geparkt.» Empfehlung: annehmen.
2. T6-2 bis T6-5 als Pool-Ideen aufnehmen? Empfehlung: T6-2 und T6-3 ja, T6-4 als Rangänderung von I-200, T6-5 in K1/K4 zusammenlegen.

## Quellen

- [Q1] https://steamcommunity.com/app/323190/discussions/0/1749022203138797517 – Frostpunk: Endlos, Szenarien, Wiederspiel (abgerufen, Spieler)
- [Q2] https://steamcommunity.com/app/916440/discussions/0/3812910027107620114 – Anno 1800: Kampagne gegen Sandbox (abgerufen, Spieler)
- [Q3] https://steamcommunity.com/app/916440/discussions/0/6770657417430370673 – Anno 1800: Ziele nach der Kampagne (Treffer, Spieler)
- [Q4] https://www.cgmagonline.com/review/anno-117-pax-romana-pc/ – Anno 117: Kampagne und Endlos (Treffer)
- [Q5] https://store.steampowered.com/app/323190/Frostpunk/ – Frostpunk: Endlos-Varianten (Shop, nur Suchtreffer)
- [Q6] https://theouterhaven.net/?p=277468 – Frostpunk 2 Utopia Builder (abgerufen, Medium)
- [Q7] https://twt.omada.cafe/r/Frostpunk/comments/1miw3cs/frostpunk_2_steam_player_chart – Reddit-Spiegel zur Spielerzahl Frostpunk 2 (Treffer)
- [Q8] https://www.cubed3.com/games/reviews/nintendo-switch/islanders-console-edition – Islanders: Modi und Wiederspielwert (abgerufen)
- [Q9] https://store.steampowered.com/app/1455840/Dorfromantik/ – Dorfromantik: Modi, monatliche Herausforderung (abgerufen)
- [Q10] https://vaporlens.app/app/1455840/dorfromantik – Dorfromantik: Review-Zusammenfassung (Treffer, automatisch erzeugt)
- [Q11] https://timberborn.org/articles/difficulty-settings-game-modes – Timberborn: Stufen und Eigenregeln (abgerufen)
- [Q12] https://steamdb.info/patchnotes/13334489 – Timberborn: Schalter für Dürre und Giftflut (Treffer)
- [Q13] https://www.gamedeveloper.com/road-to-igf-2023/how-against-the-storm-managed-to-mix-city-building-and-roguelite-play – Against the Storm: Designinterview (abgerufen)
- [Q14] https://steamcommunity.com/app/1336490/discussions/0/4039230498603204707 – Against the Storm: Spieler zu Meta-Fortschritt (abgerufen)
- [Q15] https://steamcommunity.com/app/646570/discussions/0/3559414588257866834/ – Slay the Spire: Aufstieg, Daily Climb (Treffer, Spieler)
- [Q16] https://spelunky.fandom.com/wiki/Daily_Challenge_Mode_(HD) – Spelunky: Daily Challenge (aus TIEFE-1 [Q29])
- [Q17] https://shacknews.com/article/135267/against-the-storm-gdc-2023-interview – Against the Storm: Verleger zur Laufstruktur (abgerufen)
- [Q18] https://steamcommunity.com/app/1336490/discussions/0/4288061352815620461 – Against the Storm: «nur noch die Leiter» (Treffer, Spieler)
- [Q19] https://eremitegames.com/progression-update/ – Against the Storm: Progression-Update (abgerufen, Entwickler)
