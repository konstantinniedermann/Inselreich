# I-112 · Ratsbeschluss je Stufe (Kurzdesign, Stufe voll)

Stand 2026-10-16 · Paket `design-I-112` · Prozessstufe voll · Auftrag R692 (Priorität 3) · Rechnung:
[anhang-01-rechnung.md](2026-10-16-i112-ratsbeschluss/anhang-01-rechnung.md) (massgeblich für die B-Seite der Stufen 3 und 4 ist
Anhang §9; §2/§3.2/§3.3 B sind dort ersetzt). Alle Zahlen sind gerechnet, nicht gemessen.

## 1 Spielerzweck (ein Satz)

Steht das erste Haus einer neuen Stufe, entscheidet der Spieler einmal und für die ganze Partie, ob er seine Kette
schneller macht oder seine Stadt anders baut (weiter mit grösserem Dienstnetz oder dichter mit volleren Häusern); der
andere Beschluss verfällt.

Säule: Bevölkerung versorgen und aufsteigen lassen; Stufe-A-Beschlüsse stärken die Produktionsketten. Wenn es misslingt
(ein Beschluss dominiert), leidet nichts weiter, aber die Karte ist eine Scheinwahl. Spürbar im 15-Minuten-Spiel: Karte 1
nach etwa 1 Minute, Karte 2 um Minute 7, Karte 3 um Minute 15 bis 17 (Anhang §6, 10 Ticks je Sekunde).

## 2 Varianten und Empfehlung

| Variante                                          | Kurz                                                             | Urteil                                                          |
| ------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------- |
| V1 Entwurf Pool (Stein −2 gegen Markt-Radius +2)  | Bau- gegen Reichweitenhebel                                      | verworfen: −2 Stein ist Geld (I-011), Markt-Radius spart 0      |
| V2 Takt gegen Dienst-Reichweite in allen 3 Stufen | einheitlich «Kette gegen Dienstnetz»                             | verworfen: B spart im Referenzlauf in jeder Stufe 0, A ~2× vorn |
| **V3 Takt gegen Stadtform (empfohlen)**           | A immer Kette (Takt); B Stufe 2 Reichweite, Stufe 3/4 Hausgrösse | Stufe 3 gleichauf, Stufe 2 Risiko A-lastig, Stufe 4 Platz-Wahl  |
| V4 nur Stufe 3 (eine Karte)                       | nur das ausgewogene Paar                                         | Rückfall, falls Gate Spec Stufe 2/4 für Scheinwahl hält         |

Empfehlung **V3**. Begründung: A belohnt den Kettenbauer und wirkt nur bei Eigenproduktion; B belohnt die Stadtform
(weite Küstenstadt bzw. enge Insel) und wirkt auch bei Zukauf. Die Wirkungsfelder überschneiden sich nicht, und keine Seite
gewinnt in allen Lagen «kleine Insel / grosse Insel / mehrere Inseln» (Anhang §4, §9).

## 3 Regeln

### 3.1 Die sechs Beschlüsse (Werte für `src/sim/defs/council.ts`, neu)

| Stufe (Auslöser)        | Seite | Name         | Hebel (wirksamer Wert, Def bleibt unverändert) | alt → neu | Kartentext (Zahl sichtbar)                                            |
| ----------------------- | ----- | ------------ | ---------------------------------------------- | --------- | --------------------------------------------------------------------- |
| 2 erstes Siedler-Haus   | A     | Webordnung   | `weaver.cycle`                                 | 50 → 40   | «Webereien +25 % schneller. Spart ab 50 Einwohnern Webereien.»        |
| 2                       | B     | Glockenrecht | `chapel.serviceRadius` (auch Festreichweite)   | 10 → 13   | «Kapellen reichen 3 Felder weiter. Spart Kapellen in weiten Städten.» |
| 3 erstes Bürger-Haus    | A     | Brennrecht   | `distillery.cycle`                             | 50 → 40   | «Brennereien +25 % schneller.»                                        |
| 3                       | B     | Wohnordnung  | `TIERS[3].maxInhabitants`                      | 15 → 16   | «Bürgerhäuser fassen 16 statt 15 Bürger.»                             |
| 4 erstes Kaufleute-Haus | A     | Glasrecht    | `glassworks.cycle`                             | 50 → 30   | «Glashütten +67 % schneller.»                                         |
| 4                       | B     | Hofrecht     | `TIERS[4].maxInhabitants`                      | 20 → 22   | «Kaufmannshäuser fassen 22 statt 20 Kaufleute.»                       |

Begrenzung der Werte: Wohnordnung nur k = 1, weil k = 2 das Bürger-Ziel (50) mit 3 statt 4 Häusern erreicht (Abkürzung,
Anhang §9). Hofrecht k = 2 lässt die Häuser bis 60 und 80 Kaufleute gleich (3 und 4). Glockenrecht +3 statt +2 (Anhang
§3.1 Gegenmassnahme bereits angewandt).

### 3.2 Ablauf

1. **Öffnen:** Hat zum ersten Mal in dieser Partie ein Haus auf irgendeiner Insel die Stufe n ∈ {2, 3, 4} erreicht, wird
   der Beschluss der Stufe n «offen». Das ist dauerhaft (Abriss oder Abstieg schliesst ihn nicht).
2. **Wählen:** Eine Sim-Aktion `decree(world, tier, side)` mit `side ∈ {'A','B'}` setzt den Beschluss. Ergebnis
   `{ ok, reason }`, nie werfen. Gründe: Stufe nicht offen, schon beschlossen, ungültige Stufe oder Seite.
3. **Wirkung:** Ab dem nächsten Tick reichsweit (alle Inseln, bestehende und künftige Gebäude bzw. Häuser) über
   Lese-Helfer für den wirksamen Wert (Takt, Dienst-Reichweite, Hausgrösse). Alle Leser des Hebels laufen über diese
   Helfer, auch Anzeigen (Reichweitenkreis, «{max}»-Texte der Freischaltungen, Belegung bei hoher Steuer).
4. **Dauer:** Der Beschluss gilt bis Partie-Ende. Kein Rückgängig, kein Wechsel, keine Kosten, kein Unterhalt, keine
   Abhängigkeit von der Amtsstube.
5. **Unentschieden:** Ein offener Beschluss wirkt nicht und läuft nicht ab. Mehrere können gleichzeitig offen sein.

### 3.3 Bedienung (UI, desktop-first)

- In der Kopfzeile erscheint ab dem ersten offenen Beschluss eine Marke **«Rat»**; solange ein Beschluss offen ist, ist
  sie hervorgehoben mit Zahl («Rat · 1»). Kein Modal, kein Pausieren, keine Unterbrechung des Spiels.
- Klick (oder Tastenkürzel nach Wahl von Tech, frei und in der Hilfe genannt) öffnet die Rats-Karte: je offene Stufe zwei
  Karten nebeneinander mit Name, Kartentext aus den Defs und dem Satz «Gilt für die ganze Partie, der andere Beschluss
  verfällt.» Auswählen markiert eine Seite; erst **«Beschluss fassen»** löst die Aktion aus (Schutz vor Fehlklick).
  `Esc` schliesst ohne Wahl.
- Bereits gefasste Beschlüsse stehen in derselben Karte als Liste («Stufe 2: Webordnung»); die Marke bleibt danach
  neutral sichtbar.
- Beim Öffnen eines Beschlusses einmal ein Hinweis im bestehenden Meldungsweg («Der Rat tagt: ein Beschluss steht an»).

## 4 Save-Urteil

**Save betroffen.** Neues Weltfeld `council: { 2, 3, 4 }` mit je `null` (noch nicht erreicht), `'open'` oder `'A'|'B'`.
`SAVE_VERSION` = Stand auf main beim Merge + 1 (R674; Erweiterung 1 nimmt in der Nutzer-Session ebenfalls Nummern, also
erst beim Merge festlegen). Keine Migration: ältere Stände werden mit dem bestehenden Hinweis abgewiesen (Feste Regel),
Test dafür. «Neue Insel» erzeugt eine neue Welt mit drei `null`.

**Baseline:** Der Balancing-Controller beschliesst nie. Damit bleibt `tests/sim/balance.test.ts` bitgleich, sofern das
Feld `council` nur gesetzt und nirgends sonst gelesen wird, solange kein Beschluss gefasst ist (Ruling-Entwurf R-1).

## 5 Balancing-Abschätzung (Anhang §3–§5, §9)

- Je Einwohner: A +0,3 (Stoff), +0,4 (Rum), +0,5 (Glas) je 100 Ticks; im Referenz-Endzustand spart A genau ein Gebäude.
- B Stufe 2: 0 bei kompakter Stadt, 1 Kapelle (850 Bau, 15 Unterhalt) bei gestreckter Stadt; Festreichweite +3 dazu.
- B Stufe 3: +7,5 je Bürgerhaus gegen A +6 je Haus plus eine Brennerei einmalig: gleichauf; Bremse +50 Ticks Füllzeit
  je Haus nur auf dem Weg zu den Kaufleuten.
- B Stufe 4: +10 % Einwohner je Kaufmannshaus (Platz, +10 % Glas- und Gewürzbedarf); Geld ist dort Kleingeld.
- Edikte: keine Stapelregel nötig, kein gemeinsames Feld (Anhang §5). Steuer hoch schwächt A, B bleibt.
- Würde der Controller A, A, A wählen: Sieg-Tick etwa −300 bis −420 Ticks (Schätzung). Kein endloser Überschuss, kein
  zwingender Bankrott: alle Hebel sparen höchstens wenige Gebäude.

## 6 Abnahmekriterien

Vitest gegen `src/sim/` (`tests/sim/council.test.ts`, neu):

1. Neue Welt: `council` ist `{2: null, 3: null, 4: null}`; `decree` auf jede Stufe liefert `{ ok: false }` mit Grund
   «nicht offen», die Welt bleibt unverändert.
2. Erreicht ein Haus Stufe 2, ist `council[2] === 'open'`; Stufe 3/4 bleiben `null`. Dasselbe für 3 und 4 (Szenario mit
   gesetzten Häusern).
3. Abriss des einzigen Siedler-Hauses und Abstieg auf Stufe 1 lassen `council[2] === 'open'` bzw. den gefassten Beschluss
   unverändert.
4. `decree(w, 2, 'A')` liefert `ok`; danach `council[2] === 'A'`; ein zweites `decree(w, 2, 'B')` liefert `ok: false`
   («schon beschlossen»), Wert bleibt `'A'`. Ungültige Stufe (1, 5) oder Seite liefert `ok: false`, wirft nie.
5. Je Beschluss ein Szenariotest auf den wirksamen Wert: Webordnung Weberei-Takt 40, Glockenrecht Kapellen-Reichweite 13
   (Versorgung eines Hauses in Abstand 12 ja, 14 nein; Festreichweite ebenso), Brennrecht 40, Wohnordnung Bürger-Maximum
   16, Glasrecht 30, Hofrecht Kaufleute-Maximum 22. Ohne Beschluss bzw. mit der anderen Seite gilt der Def-Wert.
6. Wirkung reichsweit: Webordnung beschleunigt eine Weberei auf einer zweiten Insel und eine nach dem Beschluss gebaute.
7. Wohnordnung: ein volles Bürgerhaus (15) wächst nach dem Beschluss auf 16, sofern seine Bedürfnisse erfüllt sind;
   unter unerfüllten Bedürfnissen gilt dieselbe Regel wie für die übrigen Plätze. Der Aufstiegswunsch zu Stufe 4 hängt am
   neuen Maximum.
8. Determinismus: Zwei Läufe mit gleichem Seed und gleicher Aktionsfolge inkl. `decree` liefern gleiche Welt-Hashes.
9. Save: Speichern und Laden erhält `council` je Zustand (`null`, `'open'`, `'A'`, `'B'`); ein Stand mit der Vorversion
   wird mit Hinweis abgewiesen, kein Absturz.
10. Werte nur in `src/sim/defs/council.ts`; ein Test liest die Tabelle (6 Einträge, je Stufe A und B, Felder Name, Text,
    Hebel, Wert).
11. Balancing-Test unverändert grün; der Controller ruft `decree` nie auf und `council` steht am Ende auf
    `{2: 'open', 3: 'open', 4: …}` je nach erreichter Stufe.

Reine UI-Helfer (`tests/ui/council.test.ts`):

12. `councilBadge(world)` liefert «Rat · n» bei n offenen, «Rat» ohne Zahl bei 0 offenen und ≥ 1 gefasstem, nichts vor
    dem ersten offenen.
13. `councilCards(world)` liefert je offene Stufe zwei Karten mit Text aus den Defs und die Liste der gefassten.

Browser-Check bei 1280 px (qa-playtester, Screenshots `.studio/qa/<paket>/`):

14. Nach dem ersten Siedler-Haus: Hinweis erscheint, Marke «Rat · 1» sichtbar, Spiel läuft weiter.
15. Rats-Karte: zwei Karten lesbar, Zahl im Text sichtbar; Auswahl ohne «Beschluss fassen» ändert nichts; `Esc` schliesst.
16. Nach dem Fassen: Marke neutral, Liste zeigt den Beschluss; Kopfzeile bleibt einzeilig.
17. Glockenrecht: Reichweitenkreis der Kapelle beim Bauen und Auswählen zeigt 13.

## 7 Randfälle

- Zwei Stufen gleichzeitig offen (Spieler wartet): beide Karten in der Rats-Karte, Reihenfolge nach Stufe.
- Beschluss ohne Wirkungsfeld (Ware nur zugekauft, nur eine Kapelle nötig): wirkt formal, spart nichts; nicht kaputt.
- Takt-Wechsel mitten im Zyklus: der laufende Zyklus endet nach dem neuen Takt; Glättung und Sturm wirken unverändert.
- Hohe Steuer (Belegung 75 %): rechnet mit dem neuen Maximum.
- Ein Haus über dem Maximum kann nicht entstehen (Maximum steigt nur).
- Pause: Beschliessen ist auch in der Pause möglich (Entscheidung ohne Zeitvorteil); Tech kann das an die bestehende
  Pausen-Regel für Edikte angleichen.

## 8 Nicht dazugehört

Kein Rückgängig oder Umentscheiden, keine Kosten, keine Zufallsauswahl, keine Beschlüsse für Stufe 1, keine KI-Wahl des
Controllers, keine eigene Grafik oder Musik (bestehende Karten-Optik), kein Erfolg/Statistik-Eintrag, keine Kopplung an
Amtsstube oder Edikte, keine weiteren Hebel als die sechs.

## 9 Selbstprüfung Gate Brainstorming

1. Säule: Bevölkerung (B) und Ketten (A); misslingt es, ist es eine Scheinwahl ohne Folgeschaden. OK
2. Echte Wahl: Stufe 3 gleichauf; Stufe 4 Platz gegen Kette, beides klein; **Stufe 2 A-lastig** (B spart nur in
   gestreckten Städten). BEDENKEN, Rückfall V4 oder Glockenrecht +4 per Werte-Ruling nach Playtest.
3. Rückkopplung: kleine Wachstumshilfe, keine Schleife; Wohnordnung bremst den Aufstieg leicht. OK
4. Randfälle: Abriss, Abstieg, Zukauf, mehrere Inseln, zwei offene Karten genannt. OK
5. Einfacher: V4 mit nur einer Karte wäre einfacher, verliert aber den Rhythmus über die Partie. OK

Gesamt: **OK mit Bedenken** (Stufe 2).

## 10 Grösse

M · zwei Pakete: (1) Sim: Defs, Weltfeld, Öffnen, `decree`, wirksame Werte, Save (≈ 5 Tasks); (2) UI: Marke, Rats-Karte,
Hinweis, README-Spielanleitung (≈ 3 Tasks). Risiko: viele Leser von `maxInhabitants` und `serviceRadius` müssen auf die
Helfer umgestellt werden (Anhang nennt `population.ts`, `feast.ts`, `queries.ts`).
