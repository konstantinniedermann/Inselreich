# Recherche TIEFE-2: neue Achsen für Spätspiel und Wiederspiel

Stand 2026-10-25 · Paket TIEFE-2 (Dauerauftrag R862) · Autor: lead-design · Prozessstufe leicht · **Recherche mit
Kandidaten, keine Spec**: Alle Zahlen sind Richtwerte zum Abwägen, weder gerechnet noch gemessen. Recherche durch zwei
Rollen auf Abruf (Strang A «Struktur über Partien», Strang B «Dynamik im Spätspiel»; je `general-purpose` auf sonnet),
dazu eigene Nachprüfung durch lead-design. Keine Playtests als Input (R862). Übernommen werden nur Mechaniken, keine
Namen oder Inhalte (ADR-006).

**Belegstärke:** 14 von 34 URLs sind abgerufen (A), der Rest sind Suchtreffer (S). Fandom-Wikis (HTTP 402), StrategyWiki
(403) und Reddit waren nicht lesbar. Spielerstimmen stammen aus Steam-Diskussionen, GOG-Rezensionen und Fachpresse,
jeweils in kleinen Stichproben. Aussagen, die nur auf Eigenwissen der Rechercheure beruhen, sind mit (E) markiert und
tragen keinen Kandidaten allein.

## 1 Ausgangslage und Suchachsen

- **Leitbefund IDEEN-17** (Handoff `.studio/handoffs/2026-10-25-lead-design-IDEEN-17.md`): Der Pool ist für
  kleine Ideen abgegrast. Die starken Hebel liegen in laufenden Paketen: Stadtrecht (V4), Wartung, Ehrenbuch (I-186),
  Inselproben (I-190–I-192), Kartennummer (I-197), Festanlass (I-201).
- **TIEFE-1** ([Skizzen](2026-10-23-tiefe-1-skizzen.md), [Recherche](../../recherche/2026-10-23-tiefe-1.md)) hat
  Langzeitmotivation, Modi und Erweiterungs-Themen schon abgedeckt. Daraus die vier N-104-Kandidaten «Neue Ufer»,
  «Ernte und Frost», «Gelehrte und Gilden» und die Rivalen (E2).
- **R864:** keine Meta-Boni über Partien; die Spielwerte bleiben je Partie gleich. Inselproben §13 schliesst
  Freischaltung und Prestige für ihren Schnitt aus.
- **Suchachsen TIEFE-2** (gezielt neu, nicht in TIEFE-1 vertieft):
  - A1 Kampagnen- und Karriere-Struktur über mehrere Karten
  - A2 Herausforderungs-Modifikatoren und Härteleitern
  - A3 Meta-Fortschritt ohne Werte-Boni
  - A4 teilbare Karten- und Regelcodes
  - B1 Weltereignisse mit Entscheidung und Folge
  - B2 Handelsnetz-Rivalität ohne Kampf
  - B3 Spezialisierung und Stadt-Identität
  - B4 Interessengruppen
  - B5 wandernder Bedarf
  - B6 Grossprojekte in Phasen

## 2 Befunde

### 2.1 Strang A: Struktur über Partien

| Nr. | Mechanik                              | Beispiel und Spielerstimme                                                                                                                                                                                    | Belege         |
| --- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| A-1 | Aufgabenliste schaltet Phasen frei    | Against the Storm: Rund 50–80 % einer Liste kleiner Aufgaben schalten die nächste Phase frei. Die Phase ändert Kartenregeln und Härte, keine Werte-Boni. Lohn ist Zierde                                      | [S1] A, [S7]   |
| A-2 | Härteleiter mit Freischaltung im Sieg | Against the Storm: 20 Stufen, jede addiert einen Nachteil. Die nächste Stufe öffnet erst der Sieg. Lob «improve your performance». Kritik: Gestapelte Härte ergibt «ein ganz anderes Spiel», unten «too easy» | [S2] A, [S7]   |
| A-3 | Voreinstellungen plus freie Regler    | Timberborn: drei Presets, jede Änderung schaltet auf «Eigene». Farthest Frontier: feine Regler; jeder aktive Regler schaltet den Erfolgsfortschritt ab                                                        | [S3] A, [S4] A |
| A-4 | Weltkarte als Härtewahl               | Against the Storm: Vor jeder Partie wählt man ein Feld. Je weiter vom Zentrum, desto härter. Die Wahl des Ortes ist die Wahl der Schwierigkeit                                                                | [S1] A, [S8]   |
| A-5 | Karriere mit Rang, danach offen       | Caesar III und Pharaoh: Missionsfolge mit Rangleiter, Wahl zwischen friedlichem und gefährlichem Folgeauftrag. Anno 117: Kampagne als «extended tutorial» gelobt, danach Endlos                               | [S9], [S6] A   |
| A-6 | Gewerteter und gelassener Modus       | Frostpunk Endlos: «Gelassenheit» ohne Druck, «Ausdauer» mit Wertung. Erfolge gibt es nur auf der gewerteten Fassung                                                                                           | [S5] A, [S10]  |
| A-7 | Teilbarer Kartencode                  | Factorio: Ein Textcode trägt alle Einstellungen der Kartenerzeugung. Eingefügt erzeugt er «a complete copy of the map». Er lässt sich aus jedem Spielstand auslesen                                           | [S11] A        |

### 2.2 Strang B: Dynamik im Spätspiel

| Nr. | Mechanik                               | Beispiel und Spielerstimme                                                                                                                                                                              | Belege                       |
| --- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| B-1 | Bitte mit Folge über Zeit              | Frostpunk 2: Versprechen an Ratsmitglieder, bei Bruch Unruhe. Tropico: Anfragen der Gruppen, Wahlrede vor der Wahl. Lob: Entscheidungen werden greifbar. Kritik: Folgen schlecht erklärt, «man rät nur» | [S12] A, [S13], [S14], [S15] |
| B-2 | Einfluss in fremden Städten kaufen     | Anno 1404 Venedig: Ratssitze in fremden Städten mit Gold kaufen. Drei von fünf Sitzen übernehmen eine Stadt ohne Krieg. Sitze beim Gegner kosten ein Vielfaches (Spielerbericht)                        | [S16], [S17], [S18]          |
| B-3 | Handelsverträge und Exklusivrechte     | Anno 1800 Docklands: Handelsverträge statt Kontor-Handel. Patrician und Port Royale: Konkurrenzhändler drücken Preise (E)                                                                               | [S19] A, [S20], [S21] A      |
| B-4 | Leichte Interessengruppen              | Tropico 6, Frostpunk 2: Gruppen bewerten jede Wahl. Lob: Balanceakt. Kritik: unklar, wie man Gegner gewinnt. Politische Härte (Aufstand) passt nicht zum ruhigen Ton                                    | [S12] A, [S22] A, [S23]      |
| B-5 | Wünsche wandern mit dem Wohlstand      | Anno 1800, Anno 117: Neue Waren mit jeder Stufe. Kritik an Anno 117: Wirtschaftstiefe erdrückt                                                                                                          | [S19] A, [S24] A             |
| B-6 | Spezialisten-Gegenstände als Charakter | Anno 1800 und Anno 117: Gebäude nehmen Gegenstände mit Zusatzwirkung auf, begrenzte Plätze. Kritik bei Against the Storm: zu viel Zufall in der Auswahl, lieber verdient                                | [S25], [S26], [S27] A        |
| B-7 | Grossprojekt in Bauphasen              | Anno 2070 Monumente in drei Stufen. Pharaoh-Pyramiden in Abschnitten (E). Keine Spielerstimmen gefunden                                                                                                 | [S28], [S29], [S30]          |
| B-8 | Jahreswahl aus Karten unter Zeitdruck  | Against the Storm: Jährliche Auswahl prägt die Siedlung, Zeitleiste der Ungeduld. Hoch gelobt (Metacritic 91). Kritik am Zufall                                                                         | [S31] A, [S27] A             |

### 2.3 Was die Befunde gemeinsam sagen

1. **Härte als Wahl trägt Wiederspiel**, wenn sie lesbar bleibt. Gestapelte Modifikatoren kippen in ein «anderes Spiel»
   (A-2). Für den ruhigen Ton heisst das: wenige, benannte Stufen, kein Zwang.
2. **Gewertet und frei getrennt halten** (A-3, A-6): Wer frei regelt, verliert die Wertung. Das schützt Bestenliste und
   Ehrenbuch, ohne den Komfort zu verbieten.
3. **Ort als Schwierigkeit** (A-4, A-5): Eine sichtbare Folge von Karten macht aus vielen Einzelproben eine Reise. Das
   Lob gilt der Struktur; die Kritik gilt dem Roguelite-Neustart, den wir nicht übernehmen.
4. **Entscheidungen mit verzögerter Folge** (B-1) sind das Gegenmittel zum Plateau. Sie funktionieren nur, wenn die Folge
   vorher lesbar ist.
5. **Einfluss statt Besitz** (B-2) gibt Geld im Spätspiel ein Ziel. Andere Städte gewinnt man, ohne Krieg zu führen.

## 3 Kandidaten

Je Kandidat: Mechanik · Belege · Spielerwirkung · Ton · Aufwand · Save/Balancing · Abhängigkeiten · Überschneidungen.

### K1 «Seegang» (Härteleiter, freigespielt im Sieg)

- **Mechanik:**
  - Fünf benannte Stufen bei «Neue Insel», jede legt **eine** lesbare Regel auf die vorige. Beispiele: Zukauf ×1,5;
    Krisen hoch; kein Zukauf bis Ziel 2; Lager −25 %; Startgeld halb.
  - Stufe n+1 öffnet sich, sobald auf Stufe n Ziel 3 erreicht ist. «Frei» (eigene Regler) bleibt jederzeit offen,
    wertet aber nicht (A-3).
  - Höchste bestandene Stufe steht im Ehrenbuch und im Teilen-Text.
- **Belege:** A-2, A-3, A-6; [S2], [S3], [S4], [S5].
- **Spielerwirkung:** «Ich habe die Gewürzstadt auf Seegang 2 geschafft; jetzt will ich wissen, ob ich ohne Zukauf
  durchkomme.» Die zweite und dritte Partie hat ein Ziel, das die erste nicht hatte.
- **Ton:** gut. Härte ist Wahl, keine Niederlage erzwungen, höchstens fünf Stufen (Gegenmittel zu «anderes Spiel»).
- **Aufwand:** M (≈ 3 Pakete: Def-Tabelle und Sim-Schalter, Neue-Insel-UI, Ablage und Ehrenbuch-Anschluss).
- **Save/Balancing:**
  - Weltfeld `seegang: 0–5`, Save-Sprung +1 mit Migration auf 0. Die höchste Stufe liegt neben dem Spielstand wie
    die Ehrenbuch-Ablage.
  - Stufe 0 bitgleich, Balancing-Test unberührt. Jede Stufe braucht einen Lösbarkeitslauf (Rechnung
    `design-economy-designer`), nicht im Balancing-Test.
- **Abhängigkeiten:** Ehrenbuch (Anzeige), Szenario-Schalter aus Inselproben (Wiederverwendung der Startbedingungen).
- **Überschneidungen:**
  - Krisenstufe (live) wird eine Zutat der Leiter.
  - Gelübde I-198 (geparkt) liefert Inhalte für Stufen. Empfehlung: I-198 in K1 aufgehen lassen.
  - Bewährung I-193 (Endlos) bleibt getrennt.
  - **R864** bleibt gewahrt: Die Freischaltung öffnet Härte und keinen Vorteil; die Werte je Stufe sind für alle gleich.
    L0 bestätigt die Auslegung (§7, T2-1).
  - N-104: keine Überschneidung. «Ernte und Frost» könnte später eine Stufe beisteuern.

### K2 «Seefahrerbrief» (Archipel-Reise über feste Karten)

- **Mechanik:**
  - Eine Übersichtskarte mit 9 Inseln in drei Ringen. Jede Insel ist eine Probe-Def: Kartennummer, Startbedingung,
    Ziel.
  - Ein Sieg öffnet die Nachbarinseln. Je Ring gibt es die Wahl zwischen einer ruhigen und einer fordernden Insel
    (A-5).
  - Lohn: Siegel auf der Karte und ein Ehrenbuch-Stück je Ring. Kein Werte-Bonus, kein Geld.
  - Nach dem äusseren Ring folgt das freie Spiel.
- **Belege:** A-1, A-4, A-5; [S1], [S6], [S8], [S9].
- **Spielerwirkung:** «Ich sehe, wohin die Reise geht: drei Inseln geschafft, die Felsküste im zweiten Ring wartet.» Das
  macht aus Einzelproben eine Partie über Abende.
- **Ton:** sehr gut. Ruhige Wahl des Ortes statt Würfel; jede Insel ist ein normales Inselreich-Spiel.
- **Aufwand:** M–L (≈ 4–5 Pakete). Kartenansicht (UI, Art leicht), 9 Defs mit Lösbarkeitsrechnung, Ablage des
  Reisestands. Der Inhalt (9 gerechnete Inseln) ist der grössere Teil.
- **Save/Balancing:**
  - Welt: nur die Proben-Kennung (Feld aus Inselproben), daher kein eigener Sprung, wenn das Feld reicht.
  - Neben dem Spielstand: Ablage `inselreich.reise` mit Version. Fremdformat wird mit Hinweis verworfen.
  - Grundspiel bitgleich.
- **Abhängigkeiten:** Inselproben live (Probe-Def, Wertung), «Knappe Zeiten» (Startbedingungen), Kartennummer I-197.
- **Überschneidungen:**
  - Inselproben: K2 ist eine Struktur **über** den Proben, keine neue Regel.
  - Auftragsreihe I-017 (geparkt) ist eine Lernreihe in einer Partie; K2 spannt über Partien.
  - Inselproben §13 schliesst Freischaltung für ihren Schnitt aus. K2 wäre ein eigener späterer Schnitt (§7, T2-1).
  - N-104 «Neue Ufer» entdeckt Seegebiete **in** der Partie; K2 wählt Karten **zwischen** Partien. Keine Doppelung,
    aber Namen und Bildsprache (Karte, Nebel) abgrenzen.

### K3 «Bittschrift» (Entscheidung mit Nachspiel)

- **Mechanik:**
  - Ab Ziel 1 kommt etwa alle 10 min eine Bittschrift mit zwei Antworten. Die Folge jeder Antwort steht auf der Karte,
    zum Beispiel «Ja: −20 Stoff jetzt · in ≈ 8 min: Zuzug +15 Bürger» oder «Nein: nichts · Kapellen-Fest −1 für 10 min».
  - Die Antwort setzt eine Marke. Ein Folgeereignis löst sie später ein (Dank oder Klage).
  - Ein eigener seeded Strom (ADR-010). Ohne Antwort nach 2 min gilt «Nein».
- **Belege:** B-1; [S12], [S13], [S14], [S15]. Kritik «Folgen schlecht erklärt» → Folge vorher sichtbar.
- **Spielerwirkung:** «Gebe ich jetzt Glas her, damit in acht Minuten die Gilde kommt? Mein Lager ist knapp.» Die stabile
  Stadt muss wieder abwägen. Der Lohn ist Wachstum, Zeit oder Fest, nie Geld (R722).
- **Ton:** gut, wenn die Bitten Bürgerwünsche sind und keine Drohungen, und eine Ablehnung nie eine Krise auslöst.
- **Aufwand:** M (≈ 3 Pakete: Sim-Strom und Marken, Karte und Chronik, Inhalt 8–12 Bitten mit Rechnung).
- **Save/Balancing:**
  - Weltfeld für offene Marken, Save-Sprung +1.
  - Baseline: Der Controller antwortet nie, also «Nein» ohne Folge. Dann ist das Grundspiel bitgleich, solange
    «Nein» wirkungsfrei ist. Sonst Schalter «Bittschriften an/aus», Standard aus im ersten Schnitt.
  - Je Bitte eine Dominanz-Prüfung, damit kein «Ja» immer gewinnt.
- **Abhängigkeiten:** keine harten. Passt neben Festanlass I-201 (Fest als Lohn).
- **Überschneidungen:**
  - Rat und Stadtrecht (A/B-Wahl): Die Wahl dort ist einmalig und sofort; K3 ist wiederkehrend und verzögert.
  - Auflagen (befristete Lieferung): K3 fragt «ob», nicht «wie viel».
  - Story-Rahmen I-018 (geparkt, Erzählung als Säule wäre §5.3): K3 bleibt Wirtschaftsentscheidung mit kurzem Text,
    keine Erzählung.
  - N-104: keine Überschneidung. «Neue Ufer» N4 nutzt Wahl-Karten auf See; Format teilen, Inhalt trennen.

### K4 «Partiebrief» (Regelcode zum Teilen)

- **Mechanik:** Ein kurzer Code (z. B. `IR-48213-K2-S1-F0`) trägt Kartennummer, Krisenstufe, Freischaltung und, falls K1
  kommt, die Seegang-Stufe. «Neue Insel» nimmt den Code an und erzeugt dieselbe Partie; das Menü «Spielstand» zeigt den
  Code der laufenden Partie. Ungültige Codes werden mit Hinweis abgewiesen.
- **Belege:** A-7 [S11] (Kartencode mit vollständiger Kopie), A-3 [S3], [S4].
- **Spielerwirkung:** «Spiel mal meine Insel mit meinen Regeln, ich hatte 41 Minuten.» Jede freie Partie wird
  vergleichbar, nicht nur die Proben.
- **Ton:** sehr gut. Reiner Komfort, kein Druck.
- **Aufwand:** S (≈ 1 Paket UI plus Parser in `src/sim/`, wenn I-197 live ist; sonst als Teil von I-197).
- **Save/Balancing:** kein Save-Sprung, die Felder stehen schon in der Welt. Balancing unberührt. Vitest: Code →
  Einstellungen → Code bitgleich, ungültiger Code abgewiesen.
- **Abhängigkeiten:** Kartennummer I-197 (Voraussetzung), K1 optional.
- **Überschneidungen:** Ausbau von I-197 und des Teilen-Texts der Inselproben, keine neue Idee im engen Sinn. Empfehlung:
  beim Kurzdesign I-197 als Erweiterung prüfen, nicht als eigene Pool-Idee. N-104: keine.

### K5 «Ratsbank» (Einfluss auf Fremdinseln ohne Kampf)

- **Mechanik:**
  - Jede Fremdinsel hat einen Rat mit 5 Sitzen. Ein Sitz kostet Geld und Inselruf (I-187), jeder weitere teurer
    (Kostenleiter wie Stadtrecht).
  - Mit 3 Sitzen wird die Insel **Partnerinsel**. Dort gilt eine Regel statt Geld, zum Beispiel: ihre Vorliebe
    (I-092) wandert nicht, der Stammkunde dort kennt keine Strafe, oder ein Bauplatz am Kontor (Bezug I-182).
  - Höchstens zwei Partnerinseln je Partie, damit es eine Wahl bleibt.
- **Belege:** B-2 [S16], [S17], [S18], B-3 [S19], [S20].
- **Spielerwirkung:** «Weidenau oder die Felsbucht? Beide geht nicht.» Geld im Spätspiel bekommt ein Ziel ausser
  Geld (R722), und das Handelsnetz bekommt eine Richtung.
- **Ton:** gut, solange es keinen Gegenspieler gibt, der Sitze zurückkauft. Das gehört zu den Rivalen.
- **Aufwand:** M (≈ 3–4 Pakete: Sim Sitze und Partner-Regeln, Fernkarte-UI, Rechnung).
- **Save/Balancing:**
  - Weltfeld Sitze je Fremdinsel, Save-Sprung +1.
  - Baseline: Der Controller kauft nicht, also bitgleich. Die Kostenleiter braucht eine Rechnung gegen Stadtrecht,
    damit zwei Senken nicht dieselbe Kasse doppelt leeren.
- **Abhängigkeiten:** Inselruf I-187 (sonst nur Geld), Stadtrecht live (Abgleich der Senken), Fernkarte I-136 (live).
- **Überschneidungen:**
  - **N-104 Rivalen (E2):** Inselbesitz und Seekampf sind dort. K5 nimmt das **nicht** vorweg, legt aber eine
    Mechanik, an die Rivalen andocken könnten (Sitze zurückkaufen). Darum Reihenfolge erst nach dem Entscheid N-104
    (§7, T2-3).
  - Stammkunde I-047/I-091 und Vertragsgrösse I-152 (geparkt): K5 ändert deren Regeln, ersetzt sie nicht.
  - Erschliessung I-182 (geparkt) könnte die Partner-Regel werden.

## 4 Rangliste Nutzen/Aufwand

Raster wie `docs/ideen.md` (2 × Spass + Passung + Aufwand + Risiko, je 0–2; Richtwert lead-design).

| Rang | Kandidat          | Achse                 | Grösse | Summe | Nutzen/Aufwand                                        | Empfehlung                                                                 |
| ---- | ----------------- | --------------------- | ------ | ----- | ----------------------------------------------------- | -------------------------------------------------------------------------- |
| 1    | K1 Seegang        | Wiederspiel, Härte    | M      | 11    | zweite bis fünfte Partie mit eigenem Ziel, ≈ 3 Pakete | nächste Ideen-Runde als Idee aufnehmen; I-198 hineinziehen; nach Ehrenbuch |
| 2    | K4 Partiebrief    | Wiederspiel, Teilen   | S      | 11    | jede Partie vergleichbar, ≈ 1 Paket                   | ins Kurzdesign I-197 als Erweiterung, keine eigene Pool-Idee               |
| 3    | K3 Bittschrift    | Spätspiel, Ereignis   | M      | 10    | stabile Stadt entscheidet wieder, ≈ 3 Pakete          | Idee aufnehmen; Rechnung zur Dominanz vor dem Kurzdesign                   |
| 4    | K2 Seefahrerbrief | Wiederspiel, Struktur | M–L    | 9     | stärkster Langzeit-Hebel, aber 9 Inseln Inhalt        | parken bis Inselproben und K1 live; dann eigener Schnitt                   |
| 5    | K5 Ratsbank       | Spätspiel, Handel     | M      | 8     | Geld mit Ziel ausser Geld, Risiko Nähe zu Rivalen     | parken bis N-104 entschieden und Inselruf gerechnet                        |

Begründung der Reihenfolge: K1 und K4 nutzen, was die deterministische Sim und die laufenden Pakete schon mitbringen.
K3 ist die einzige neue **Spätspiel**-Achse ohne Abhängigkeit. K2 hat den höchsten Eigenwert, aber den grössten
Inhaltsaufwand. K5 hängt an zwei offenen Entscheiden.

## 5 Ausgeschieden (Doppelung oder Ton)

| Befund                         | Grund                                                                                                           |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| B-7 Grossprojekt in Bauphasen  | Doppel: Das Denkmal baut schon in drei Abschnitten (live). Ausschreibung I-104 und Feuerschale I-171 geparkt    |
| B-5 Wandernde Wünsche          | Doppel zu I-172 (wandernde Vorliebe, geparkt) und V2b (Bedarf wächst mit der Stadt, Wirtschaft im Spätspiel)    |
| B-6 Spezialisten-Gegenstände   | Doppel zu I-077 (Spezialisierung ab Stufe 3, geparkt). Exklusive Pfade nimmt N-104 «Gelehrte und Gilden» vorweg |
| B-4 Interessengruppen          | Nähe zu Rat, Stadtrecht und Edikten. Politische Härte passt nicht zum Ton; sanfte Fassung ist K3                |
| B-8 Jahreswahl aus Karten      | Doppel zum Rat (Wahl je Stufe); Zeitdruck passt nicht zum Ton                                                   |
| B-3 Exklusivrecht für sich     | Nähe zu Stammkunde und I-152; als Partner-Regel in K5 aufgegangen                                               |
| A-6 Gelassen/Ausdauer          | Ausdauer ist Bewährung I-193 (geparkt); die Trennung «gewertet/frei» ist in K1 aufgegangen                      |
| A-3 Freie Regler allein        | Krisenstufe und «Alles frei» sind live; neu ist nur «Frei wertet nicht», in K1 aufgegangen                      |
| A-1 Phasen über Aufgabenlisten | Struktur über dem Ehrenbuch; in K2 aufgegangen (Ringe statt Phasen)                                             |

## 6 Abgrenzung zu N-104

| N-104-Kandidat        | K1            | K2                                     | K3                        | K4  | K5                                               |
| --------------------- | ------------- | -------------------------------------- | ------------------------- | --- | ------------------------------------------------ |
| «Neue Ufer»           | –             | Bildsprache Karte; in/zwischen Partien | Wahl-Karten-Format teilen | –   | –                                                |
| «Ernte und Frost»     | Stufe denkbar | –                                      | –                         | –   | –                                                |
| «Gelehrte und Gilden» | –             | –                                      | –                         | –   | –                                                |
| Rivalen (E2)          | –             | –                                      | –                         | –   | Andockstelle (Sitze zurückkaufen), kein Vorgriff |

Kein Kandidat setzt eine N-104-Erweiterung voraus. Keiner ändert Kernsäule, Genre oder Titel (§5.3), daher kein Eintrag in
die Warteschlange.

## 7 Entscheidungsbedarf (Entwurf an L0)

| Nr.  | Frage                                                                                                | Empfehlung                                                                          | Entscheider |
| ---- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ----------- |
| T2-1 | Gilt «Freischaltung von Härte, nicht von Vorteil» (K1, K2) als vereinbar mit R864 «keine Meta-Boni»? | ja: Spielwerte je Stufe für alle gleich; Freischaltung öffnet nur Härte bzw. Karten | L0          |
| T2-2 | K1, K3 in die nächste Ideen-Runde als Ideen übernehmen; K4 ins Kurzdesign I-197                      | ja; I-198 Gelübde in K1 zusammenfassen                                              | L0          |
| T2-3 | K2 und K5 parken                                                                                     | ja: K2 bis Inselproben und K1 live; K5 bis N-104 entschieden und Inselruf gerechnet | L0          |

## 8 Selbstprüfung (Prüffragen lead-design)

1. **Säulen:** K1 und K2 stärken alle Säulen, weil sie das Grundspiel erneut stellen. K3 stärkt Bevölkerung und Ketten.
   K4 stärkt Besiedeln (Kartenwahl). K5 stärkt Handel. Misslingt ein Kandidat, leidet nur sein Modus oder seine
   Spätphase. Das Grundspiel bleibt durch Stufe 0, «Nein ohne Folge» und den Controller ohne Kauf geschützt.
2. **Echte Wahl:** K1 (welche Härte), K2 (ruhige oder fordernde Insel), K3 (Einsatz jetzt gegen Folge später), K5 (zwei
   von vier Partnerinseln). Dominanzgefahr: K3 «Ja» immer besser, K5 eine Partnerregel immer besser. Beides braucht die
   Rechnung vor dem Kurzdesign.
3. **Rückkopplung:** K5 ist ein kleiner Motor, gedeckelt auf zwei Inseln. K3 ist Störung mit Gegenspiel gegen das Plateau
   (TIEFE-1 R1 1.8). K1 ist eine gewollte Bremse nach Wahl.
4. **Randfälle:**
   - K1: Eine Stufe ist unlösbar → Lösbarkeitslauf je Stufe.
   - K3: Bitte bei leerem Lager → «Ja» gesperrt mit Grund.
   - K4: fremder oder alter Code → Hinweis, kein Absturz.
   - K5: Abriss des Kontors auf der Partnerinsel → Sitze bleiben, Regel ruht.
5. **Einfachere Variante:** K4 allein liefert einen Teil des Wiederspiels für ≈ 1 Paket. K1 ohne Freischaltung (alle
   Stufen offen) wäre noch einfacher, verliert aber die Leiter. Wenn L0 T2-1 verneint, ist das der Rückfall.

**Urteil der Selbstprüfung:** OK für K1, K3, K4 als Grundlage der nächsten Ideen-Runde. BEDENKEN für K2 (Inhaltsaufwand)
und K5 (Abhängigkeit von N-104 und I-187).

## Quellen

A = abgerufen, S = Suchtreffer.

- [S1] A · https://eremitegames.com/devlog-world-map-deeds-and-phases
- [S2] A · https://steamcommunity.com/app/1336490/discussions/0/7222135213513880136 (Spieler)
- [S3] A · https://timberborn.wiki.gg/wiki/Difficulty
- [S4] A · https://www.farthestfrontier.com/guide/game-settings/custom-game/
- [S5] A · https://www.gamereactor.eu/an-endless-mode-arrives-in-frostpunk/
- [S6] A · https://www.thesixthaxis.com/2025/11/17/anno-117-pax-romana-review/
- [S7] S · https://gog.com/game/against_the_storm (Spieler-Rezensionen)
- [S8] S · https://www.gog.com/en/game/against_the_storm?page=33 (Spieler-Rezensionen)
- [S9] S · https://en.wikipedia.org/wiki/Caesar_III
- [S10] S · https://steamcommunity.com/app/323190/discussions/0/2969524117987552591 (Spieler)
- [S11] A · https://wiki.factorio.com/Map_generator
- [S12] A · https://en.wikipedia.org/wiki/Frostpunk_2
- [S13] S · https://www.gamingnexus.com/Article/5913/Tropico-6/
- [S14] S · https://www.thumbsticks.com/tropico-6-review/
- [S15] S · https://gamingbolt.com/tropico-6-review-the-man-for-the-hour/amp
- [S16] S · https://steamcommunity.com/app/1281630/discussions/0/603019462398989977 (Spieler)
- [S17] S · https://www.mobygames.com/game/45431/
- [S18] S · https://www.tvtropes.org/pmwiki/pmwiki.php/VideoGame/Anno1404
- [S19] A · https://en.wikipedia.org/wiki/Anno_1800
- [S20] S · https://butwhytho.net/2021/03/14/dlc-review-anno-1800-season-3-kicks-off-strong-with-docklands/
- [S21] A · http://www.anno-union.com/devblog-your-own-trading-empire/
- [S22] A · https://en.wikipedia.org/wiki/Tropico_6
- [S23] S · https://steamcommunity.com/app/492720/discussions/0/1815422173031233898 (Spieler)
- [S24] A · https://en.wikipedia.org/wiki/Anno_117:_Pax_Romana
- [S25] S · https://anno1800.fandom.com/wiki/Pier
- [S26] S · https://www.anno-union.com/updates/anno-117-pax-romana-patch-1-5-2/
- [S27] A · https://steamcommunity.com/app/1336490/discussions/0/3792632416051835773 (Spieler)
- [S28] S · https://anno2070.fandom.com/wiki/File:Arrow-right.png
- [S29] S · https://strategywiki.org/wiki/Pharaoh/Monuments
- [S30] S · https://www.pcgamer.com/au/nebuchadnezzar-channels-classic-city-builders-like-pharaoh-and-zeus
- [S31] A · https://en.wikipedia.org/wiki/Against_the_Storm_(video_game)
- Weitere Suchtreffer ohne eigene Aussage: https://gamicus.fandom.com/wiki/Caesar_III (HTTP 402),
  https://gamesdb.launchbox-app.com/games/details/42326, https://wikipedia.com/wiki/Anno_1404
