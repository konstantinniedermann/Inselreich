# AUFLAGEN-KERN · Auflagen-Kern, Auflage «Ausfuhrmeister» und Abbruchpuffer (Kurzdesign, Stufe voll)

Stand 2026-10-22 · Paket `AUFLAGEN-KERN` · Prozessstufe voll · Auftrag R827: I-163 gegen I-161 mit Dominanz-Rechnung, dazu
I-162; gebaut wird höchstens eine Auflage. Kriterium R805 (4) mit Ergänzung R827. Vorgänger: I-132
[Meisterprüfung «Eigenversorgung»](2026-10-16-i132-meisterpruefung.md), live. Rechnung:
[anhang-01-rechnung.md](2026-10-22-auflagen-kern-design/anhang-01-rechnung.md), von `design-economy-designer` unabhängig
nachgerechnet. Kennzeichen dort: [M] Messwert aus dem I-132-Anhang, [G] aus den Defs gerechnet, [S] geschätzt. Neue Läufe
gab es nicht. Plan: offen (`lead-tech`).

## 1 Spielerzweck (ein Satz)

Nach dem Denkmal wählt der Spieler ein Zielgut und verkauft in 15 Minuten eine feste Menge davon, die er selbst
hergestellt hat. Seine Stadt bleibt dabei voll versorgt, und das Zielgut kann er nicht zukaufen. Zum Lohn bekommt er den
Eintrag «Ausfuhrmeister» in der Inselchronik.

- **Säulen:** Produktionsketten sowie Wirtschaft mit Handel. Ketten, die mehr liefern, als die Stadt braucht, werden zum
  Ziel. Bisher fragt nur Geld nach Überschuss, und Geld ist im Spätspiel reichlich da (Leitbefund R722).
- **Wenn es misslingt:** Nichts leidet. Die Auflage ist freiwillig, ändert keinen Spielwert und kostet nichts.
- **Spürbar im ersten Versuch:** Die Karte nennt Ziel, Startbestand und Takt (z. B. «450 Rum, ≈ 30 / min»). Der Spieler
  merkt in der ersten Minute, dass seine Brennereien gerade die Stadt decken. Er baut etwa 5 Betriebe dazu und legt den
  Verkauf an das Kontor der Erzeugerinsel.
- **Kern:** Aus der einen festen Auflage wird eine Auflagen-Tabelle. Jede weitere Auflage ist dann ein Eintrag in den Defs
  mit Zielart und Sperre.
- **Beipack I-162:** Die laufende Auflage zeigt Abbruchgrenze und Puffer. Ein Scheitern kündigt sich damit an.

## 2 Varianten und Empfehlung

| Variante                                  | Kurz                                                               | Urteil aus der Rechnung (Anhang §0, §4)                                                                                   |
| ----------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| **A: I-163 «Ausfuhrmeister» (empfohlen)** | Zielgut wählen, Zielmenge verkaufen, Zukauf der Zielkette gesperrt | (a) nur mit Anrechnung des Startbestands, (b)–(d) direkt erfüllt; Lücken mit 4 Zahlen im Zustand geschlossen              |
| B: I-161 «Eigenwuchs»                     | Einwohner der Stufen ≥ 3 um 15 % steigern, Zukauf voll gesperrt    | (a) **nicht erfüllt**; 87 % überschneiden sich mit «Eigenversorgung»; Vorab-Abriss nur mit Rekordwert je Tick schliessbar |
| C: nur Kern und I-162, keine neue Auflage | Verallgemeinerung ohne zweiten Eintrag                             | YAGNI-Verstoss: Ein Kern ohne zweite Auflage hat keinen Prüfling                                                          |

### 2.1 Dominanz-Rechnung I-163 gegen I-161 (Kriterium R805 (4) plus R827)

Volle Tabelle in [anhang-02-dominanz.md](2026-10-22-auflagen-kern-design/anhang-02-dominanz.md), Herleitung in Anhang 01.

| Kriterium                                  | I-163 «Ausfuhrmeister»                                                                                   | I-161 «Eigenwuchs»                                                |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| (a) Bedarf über die Laufzeit ≫ Lagergrenze | Ziel ÷ Inselgrenze 3,2–7,5. Reichsvorrat ≈ 1000 trägt jedes Ziel, darum G1: Lager trägt 0 %, **erfüllt** | Zuwachs 24–384 Rum = 0,04–0,64 × Reichsvorrat: **nicht erfüllt**  |
| (b) Geld kein Ausweg                       | Sperre Zielkette, Bau ≤ 1000, Erlös ≈ Unterhalt: erfüllt                                                 | Vollsperre: erfüllt                                               |
| (c) Sperre der Zielgüter                   | Zielgut + Vorprodukte                                                                                    | alle Bedarfsgüter und Baustoffe, also «Eigenversorgung + 15 %»    |
| (d) Lohn ehrenhalber                       | erfüllt                                                                                                  | erfüllt                                                           |
| Zusatz-Betriebe K'-arm                     | 5 je Gut, mit Inselvorteil 2,5–3,75; kein Gut dominiert                                                  | 7; Bürger-Pfad dominiert, offener Rat nach Start +6,7–10 % gratis |
| Neuer Zustand                              | `sale` (4 Zahlen) nur während der Auflage                                                                | Rekordwert je Tick auch ausserhalb der Auflage (Baseline-Risiko)  |

**Empfehlung A (I-163), I-161 nicht bauen.** I-161 scheitert am Kriterium selbst: Der Zuwachs lässt sich aus dem Lager
decken, und die Prüfung wiederholt «Eigenversorgung». I-163 erfüllt das Kriterium mit den Gegenmitteln aus §4.4. Seine
Zielmengen gleichen den Aufwand je Gut an (≈ 5 Betriebe). Der Scout-Wert Stein 300 wäre schon mit 2 Steinbrüchen
dominant (Anhang §2.5).

## 3 Auflagen-Kern (verallgemeinert)

Heute ist der Kern auf eine Auflage festgelegt:

- `src/ui/trial.ts:17` setzt `ID = 'selfSupply'`.
- `src/ui/app.ts:649` ruft `startTrial(world, 'selfSupply')` auf.
- Chip, Karte und Chronik lesen nur `passed[0]` (`src/ui/trial.ts:36,82,128`).
- `trialBuyBlock(world)` sperrt jedes Gut (`src/sim/trial.ts:57`).

Künftig ist jede Auflage ein Eintrag in den Defs mit **Zielart** und **Sperre**. Der Rahmen bleibt gemeinsam:
Startbedingungen, Dauer, Abbruch unter 70 %, Abzeichen und Meldungen.

### 3.1 Defs (`src/sim/defs/trials.ts`)

| Eintrag                   | Wert                                                                           | Bedeutung                                                                                                                   |
| ------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `TRIAL_IDS`               | `['selfSupply', 'export']`                                                     | Reihenfolge auf der Karte und in der Chronik                                                                                |
| `TrialDef.goal`           | `'hold'` · `'sell'`                                                            | `hold`: bestanden, wenn die Dauer ohne Abbruch abläuft. `sell`: bestanden, sobald `sold ≥ goal`; nicht bestanden bei Ablauf |
| `TrialDef.lock`           | `'all'` · `'chain'`                                                            | Zukaufsperre: `all` sperrt jedes Gut (selfSupply, bitgleich), `chain` sperrt Zielgut und `consumes` seines Erzeugers        |
| `TRIALS.export`           | Name «Ausfuhrmeister», Kurz «Zielgut verkaufen, ohne Zukauf», Regeltext (§4.1) | Texte für Karte und Chronik                                                                                                 |
| `TRIAL_EXPORT_GOALS`      | `{ rum: 450, cloth: 450, glass: 320, stone: 750 }`                             | Grundziel je wählbarem Gut (Anhang §2.1, §6). Wählbar sind genau diese Schlüssel                                            |
| `TRIAL_WARN_POP_PCT`      | 85                                                                             | I-162: Chip warm, sobald Einwohner × 100 < `e0` × 85. Reine Anzeige, kein Spielwert                                         |
| `TRIAL_DURATION_TICKS`    | 9000 (unverändert, gemeinsam)                                                  | 15 min bei 1×                                                                                                               |
| `TRIAL_MIN/MAX_MERCHANTS` | 60 / 150 (unverändert, gemeinsam)                                              | Startbedingung für jede Auflage                                                                                             |
| `TRIAL_FAIL_POP_PCT`      | 70 (unverändert, gemeinsam)                                                    | Abbruch für jede Auflage                                                                                                    |

Die Sperrliste `chain` wird aus `BUILDING_DEFS` abgeleitet: Erzeuger mit `produces = Zielgut`, dazu dessen `consumes`.
Eine zweite Tabelle gibt es nicht. Die Ableitung ist rein und hat einen Test, der genau die Listen aus §2.1 (c) erwartet.

### 3.2 Gemeinsamer Ablauf (Sim, `src/sim/trial.ts`)

1. **Start:** `startTrial(world, id, good?)` liefert `{ ok, reason }` und wirft nie. Die Gründe werden in dieser Reihenfolge
   geprüft:
   - Gemeinsam wie heute: unbekannte Auflage · Wahlziel fehlt · eine Auflage läuft · bereits bestanden · Kasse negativ ·
     weniger als 60 bzw. mehr als 150 Kaufleute.
   - Nur bei `sell`: «Zielgut wählen», wenn `good` fehlt oder nicht in `TRIAL_EXPORT_GOALS` steht. «<Gut> noch nicht
     freigeschaltet», wenn `goodLock` greift.
   - Bei `hold` wird `good` ignoriert.
   - Bei Erfolg: `active`, `ticks = 0`, `e0` wie heute. Bei `sell` zusätzlich `sale` nach §4.2.
2. **Sperre:** `trialBuyBlock(world, good)` bekommt das Gut als Parameter. `buy` und `monumentBuyBlock` geben ihr Gut
   weiter. Grund: «Auflage <Name>: kein Zukauf». Bei `chain` lautet er «Auflage Ausfuhrmeister: kein Zukauf von <Gut>»,
   nur für die Güter der Sperrliste.
3. **Zählen:** `tickTrial` je Sim-Tick, Position unverändert direkt nach `tickPopulation`. Die Prüfungen laufen in dieser
   Reihenfolge:
   - Abbruch unter 70 % von `e0`, für alle Auflagen.
   - `ticks += 1`.
   - Bei `sell`: bestanden, wenn `sold ≥ goal`.
   - Bei `ticks = 9000`: `hold` bestanden, `sell` nicht bestanden.

   Ein Übergang setzt `active = null`, `ticks = 0` und `sale = null`. «Bestanden» trägt zusätzlich `{ id, tick, good }` in
   `passed` ein.

4. **Verkauf zählen:** `sell` meldet nach einer erfolgreichen Entnahme `noteTrialSale(world, good, n)`. Die Funktion zählt
   nur, wenn alles zutrifft: Auflage `sell` aktiv, `good = sale.good`, Vollbedingung G3' erfüllt (§4.2). Sie ändert nur
   `sale.sold` und wirft nie. Das Bestehen erkennt erst der nächste `tickTrial`. So gibt es genau eine Stelle, an der
   Übergänge passieren, und die UI erkennt sie am Zustand.
5. **Abbruch:** `abortTrial` wie heute, zusätzlich `sale = null`. Ein Neustart ist jederzeit möglich, auch mit anderem
   Zielgut. `s0` und `c0` werden beim Neustart neu festgehalten.
6. **Abzeichen:** höchstens eines je Auflage und Partie, nicht je Gut. Das Gut steht im Eintrag. Lohn ist nur der Eintrag
   (R827). Eine bestandene Auflage lässt sich nicht erneut starten, eine andere schon.
7. **Pause, Tempo, Krisen, Steuer, Bauen:** wie I-132 §3.2. Gezählt werden Sim-Ticks, Krisen zählen mit, und nichts
   Weiteres ist gesperrt. Insbesondere gibt es **keine Abriss-Sperre**, denn G3' deckt den Abriss ab (§4.4).
8. **Kein Zufall, kein Geld:** `tickTrial` und `noteTrialSale` schreiben nur `world.trial`; `cloneTrial` (`app.ts:644`) kopiert tief. Ohne aktive Auflage kehren sie
   früh zurück. Der Lauf bleibt dann bitgleich.

### 3.3 Bedienung (UI, desktop-first ab 1280 px)

- **Chip «Ziel»:**

  | Zustand                 | Chip                           | Fortschritt   |
  | ----------------------- | ------------------------------ | ------------- |
  | vor dem ersten Bestehen | «Meisterprüfung»               | –             |
  | `hold` läuft            | «Eigenversorgung m:ss / 15:00» | wie heute     |
  | `sell` läuft            | «Ausfuhr Rum 210 / 630 · m:ss» | `sold ÷ goal` |
  | ein Teil bestanden      | «Meisterprüfung 1 / 2»         | –             |
  | alles bestanden         | «Meisterprüfung ✓»             | –             |

  Der Chip ist warm, wenn I-162 warnt (§5).

- **Auflagen-Karte:** Sie hat einen Abschnitt je Eintrag in `TRIAL_IDS` mit Name, Regel, Bedingung und Status. Es gibt
  einen Knopf je Abschnitt, und nur einer ist wirksam, weil höchstens eine Auflage läuft.
  - «Eigenversorgung» bleibt inhaltlich wie heute (Vorschau der Fehlmengen).
  - «Ausfuhrmeister» zeigt vor dem Start eine Zeile mit vier Gutknöpfen (Rum, Stoff, Glas, Stein).
  - Je Gut stehen dort: Grundziel, Startbestand `s0`, wirksames Ziel, reichsweiter Überschuss jetzt je Minute
    (`goodsBalance` wie `selfSupplyPreview`) und der nötige Takt `goal ÷ 15` je Minute. Beispiel: «Rum: 450 + Vorrat
    180 = 630 · Überschuss jetzt +1 / min · nötig ≈ 42 / min».
  - Ein gesperrtes Gut ist blass und nennt seinen Grund.
  - «Auflage beginnen» ist blass, bis ein Gut gewählt ist. Danach gilt das bestehende Muster (blass mit Grund, Abbruch mit
    zweitem Klick, `Esc` schliesst, kein Modal).
- **Handel:** Kauf-Knöpfe sind nur für gesperrte Güter blass (`trialBuyBlock(world, good)` je Knopf). Verkauf bleibt frei.
  Während `sell` zeigt die Handelszeile des Zielguts «zählt für Ausfuhrmeister» bzw. «zählt nicht: Stadt nicht voll» (G3').
- **Meldungen:** Start «Meisterprüfung begonnen: Ausfuhrmeister (Rum) — 630 in 15:00». Bestanden «Meisterprüfung
  bestanden: Ausfuhrmeister (Rum)». Nicht bestanden durch Zeit «… nicht bestanden: Zeit abgelaufen, 512 von 630
  verkauft». Nicht bestanden durch Einwohner wie heute.
- **Inselchronik:** eine Zeile je Auflage, etwa «Meisterprüfung: Eigenversorgung bestanden (42:10) · Ausfuhrmeister
  offen». Bestanden mit Gut: «Ausfuhrmeister (Rum) bestanden (1:05:30)».
- **«Wo war ich?»-Karte** (`resumeCard.ts:73`): Bei `sell` lautet die Frist «Auflage Ausfuhrmeister: noch 4:10, 118 Rum
  offen».

## 4 Auflage «Ausfuhrmeister» (I-163)

### 4.1 Regeltext (Defs)

«Wähle ein Zielgut und verkaufe in 15 Minuten die Zielmenge an deine Kontore. Was beim Start im Lager oder auf Schiffen
liegt, zählt nicht. Ein Verkauf zählt nur, solange die Häuser, die das Gut brauchen, voll belegt sind. Zielgut und seine
Vorprodukte kannst du nicht zukaufen.»

### 4.2 Werte beim Start und Zählregel

| Grösse | Festgehalten beim Start                                                                                                                                                                                                                                      | Gegenmittel |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- |
| `good` | gewähltes Zielgut                                                                                                                                                                                                                                            | –           |
| `goal` | `TRIAL_EXPORT_GOALS[good] + s0`. `s0` = Bestand des Zielguts + `min` über die Vorprodukte des Erzeugers, jeweils summiert über alle Inseln und alle Schiffsladungen. Kein Vorprodukt (Stein): nur das Zielgut                                                | G1          |
| `sold` | 0. Steigt nur über `noteTrialSale`                                                                                                                                                                                                                           | –           |
| `c0`   | Summe der je Haus abgerundeten Grenzen `floor(maxInhabitantsOf × Lärmfaktor)`, mindestens 1, ohne Steuerfaktor, über alle Häuser, deren Stufe das Zielgut braucht (Stein: Glas). Lärmfaktor `NOISE_OCCUPANCY` wie `houseCap` auf Stadtplanung (Anhang 03 §1) | G3'         |

**Vollbedingung G3':** Ein Verkauf zählt nur, wenn die Einwohner aller Bedarfsträger-Häuser zusammen mindestens `c0`
betragen. Das prüft `noteTrialSale` im Moment des Verkaufs. Die Steuer «hoch» macht die Häuser nicht voll, ein Abriss
senkt die Einwohner unter `c0`, Aushungern und Dienstbrand lassen die Häuser schrumpfen. In allen drei Fällen ruht die
Zählung. Neu gebaute Bedarfsträger-Häuser heben die Einwohner und schaden nie. Die Helferfunktion für «Belegungsgrenze
ohne Steuerfaktor» legt `lead-tech` fest. Sie muss dieselbe Grenze lesen, gegen die `population.ts` wächst, ohne
`TAX_LEVELS[*].occupancy`.

### 4.3 Bilanz und Aufwand (Anhang §2)

| Zielgut | Grundziel | Takt ohne Vorrat | Zusatz-Betriebe (ohne / mit Inselvorteil) | Bau-Geld | Erlös voll |
| ------- | --------: | ---------------: | ----------------------------------------- | -------: | ---------: |
| Rum     |       450 |         30 / min | 5,0 / 3,75 (Weidenau)                     |     1000 |       8100 |
| Stoff   |       450 |         30 / min | 5,0 / 3,75 (Weidenau)                     |      875 |       5400 |
| Glas    |       320 |       21,3 / min | 5,0 / 3,0 (Felsbucht)                     |      907 |       6400 |
| Stein   |       750 |         50 / min | 5,0 / 2,5 (Felsbucht, Stufe 2 nötig [S])  |      750 |       4500 |

Bilanz je Einwohner im Stand K'-arm mit Ziel Rum: Bürger +5,0, Kaufleute +7,5, gesamt +7,0 (Referenz +6,8). Es gibt weder
eine Senke noch eine Quelle von Gewicht, also keinen endlosen Überschuss und keinen zwingenden Bankrott. Ein
Ratsbeschluss (Glasrecht −14 %, Brennrecht und Webordnung −10 % Betriebe) belohnt eine frühere Entscheidung. Er ist
unumkehrbar und hat einen Preis, deshalb braucht es keinen Eingriff.

### 4.4 Entartete Strategien (Anhang §5.1) und Urteil

| Strategie                                                                                                    | Gegenmittel                                                                                                                                             |
| ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vor dem Start Zielgut oder Vorprodukte kaufen, 4 Kontore und 4 Schiffe füllen (bis ≈ 1000)                   | **G1** `s0` geht ins Ziel                                                                                                                               |
| Zukauf während der Auflage, Kauf-dann-Verkauf                                                                | **G2** Sperre `chain`                                                                                                                                   |
| Steuer «hoch» frei 75–155 % des Rum-Ziels, Aushungern 90–186 %                                               | **G3'** Vollbedingung                                                                                                                                   |
| Wohnhaus während der Auflage abreissen (1 Kaufmannshaus = 360 Rum)                                           | **G3'**: Einwohner < `c0`, Zählung ruht (ersetzt die Abriss-Sperre G4 des Anhangs)                                                                      |
| Lärmquelle während der Auflage neben Bedarfsträger bauen                                                     | **G3'**: `c0` enthält den Lärmfaktor vom Start, neue Lärmquellen senken die Einwohner                                                                   |
| Aufträge, Stammkunde, Fernangebot, Sättigung, Boom, Vorliebe                                                 | keins nötig: Nur `sell` zählt, Geld ist nicht der Prüfgegenstand                                                                                        |
| Vor dem Start Bedarfsträger-Häuser abreissen oder in Lärm stellen (kleinere Stadt, Ketten werden Überschuss) | **Rest-Lücke**. Wiederaufbau ≈ 1300 Ticks, 1000 Geld und Material je Haus, Steuerausfall 440 / 100 je Haus: teurer als 5 Betriebe. Playtest-Trigger §10 |

Abweichung vom Anhang: G3 (jedes Haus einzeln voll) mit G4 (Abriss-Sperre) wird zu **G3'** (eine Summe `c0`, keine
Sperre). Grund: Mit Stadtplanung erreicht ein Haus im Lärm nie die Obergrenze der Stufe. G3 bräuchte dann ohnehin die
Lärmgrenze je Haus, und eine Lärmquelle während der Auflage bliebe offen. G3' schliesst Abriss, Lärm, Steuer und
Aushungern mit einer Zahl und ohne neuen Sperrgrund beim Abriss (Entscheidung lead-design, D1 in §11).

## 5 Abbruchpuffer (I-162, Beipack)

- **Statuszeile der laufenden Auflage** (Karte, Tooltip des Chips): «Einwohner 412 · Abbruch unter 281 · Puffer 131».
  Die Grenze ist `ceil(e0 × 70 ÷ 100)`, die kleinste Zahl, die noch nicht abbricht. Der Puffer ist Einwohner − Grenze,
  mindestens 0.
- **Warnung:** Der Chip trägt die warme Klasse, solange Einwohner × 100 < `e0` × `TRIAL_WARN_POP_PCT` (85). Dazu kommt
  kein Klang und keine Meldung. Damit warnt der Chip nicht dauernd, wenn die Einwohnerzahl um wenige Punkte pendelt.
- **Bei `sell` zusätzlich:** «verkauft 210 von 630 · nötig ≈ 35 / min» (Rest ÷ Restminuten, aufgerundet). Ruht die Zählung,
  folgt der Hinweis «· zählt nicht: Stadt nicht voll (398 von 430)».
- Reine Lesefunktionen in `src/ui/trial.ts`. Sie brauchen kein Save und ändern keinen Spielwert.

## 6 Save-Urteil

**Save betroffen.**

- **Form:**
  `trial: { active, ticks, e0, sale: { good, goal, sold, c0 } | null, passed: { id, tick, good: GoodId | null }[] }`.
  `sale` ist genau dann gesetzt, wenn `active` eine `sell`-Auflage ist. `passed[].good` ist bei `sell` das Zielgut, sonst
  `null`.
- **Startwerte** in `createWorld`: `{ active: null, ticks: 0, e0: 0, sale: null, passed: [] }`.
- **Version:** `SAVE_VERSION` = Stand auf main beim Merge + 1 (R674, R805 (1)). Geplant ist **v21** nach Stadtplanung v19
  und Seerecht v20 (`plan/seerecht` P-3). Die Nummer liegt nie parallel zu einem der beiden. Die Versionsnummer setzt der
  letzte Sim-Task nach dem Holen von main. Tests nennen keine Literalzahl (R633 T5).
- **Migration** vom Vorgänger, wirft nie und verliert nichts: setzt `trial.sale = null` und ergänzt jeden `passed`-Eintrag
  um `good: null`. Ein Stand mit laufender «Eigenversorgung» läuft weiter.
- **Strukturprüfung** (zusätzlich zu `isValidTrial`, `save.ts:959`):
  - `sale === null` genau bei `active ∉ sell`.
  - Bei gesetztem `sale`: `good` ∈ `TRIAL_EXPORT_GOALS`, `goal` ganz > 0, `sold` ganz ≥ 0, `c0` ganz ≥ 0.
  - `passed[].good` ist `null` für `hold` und ein Schlüssel von `TRIAL_EXPORT_GOALS` für `sell`.
  - Ein ungültiger Stand wird mit «Beschädigter Spielstand» abgewiesen, eine Version über der eigenen mit «Unbekannte
    Version». Für beides gibt es einen Test.
  - `sold ≥ goal` ist gültig, weil zwischen Verkauf und nächstem Tick gespeichert werden kann. Das Bestehen folgt beim
    nächsten Tick.
- **Erweiterung 1:** K2 Hafenrecht und folgende Kapitel nehmen ihre Nummer ebenfalls main + 1 beim Merge. Es gibt kein
  gemeinsames Feld. Neue Inseln oder Kontore zählen in `s0`, `c0` und beim Verkauf automatisch mit, weil alle über
  `world.islands` und `world.ships` laufen. Für die Balancing-Prüfung von Erweiterung 1 gilt: Der Controller startet keine
  Auflage, Ziel 4 bleibt unberührt.
- **Konfliktfläche:**
  - Mit `feat/stadtplanung`: `save.ts` (Kette), `types.ts`, `world.ts`, `app.ts`, `inspect.ts`, `tests/sim/helpers.ts`,
    `balance.test.ts`.
  - Mit Seerecht: `save.ts`, `types.ts`.
  - Alles additiv. Den Plan schreibt `lead-tech` erst ab main nach dem Seerecht-Merge, oder er setzt die Version in einem
    Nachzug-Task wie Seerecht T09.

**Balancing-Test:** Kein Spielwert ändert sich, und der Controller ruft `startTrial` nie auf. Die Basisläufe bleiben
bitgleich, weil `tickTrial` und `noteTrialSale` ohne Auflage früh zurückkehren und `buy` nur das Feld prüft.
Das Literal der Startwerte steht aber an mehreren Stellen (AK-AUF-K14) und zieht auf
`{ active: null, ticks: 0, e0: 0, sale: null, passed: [] }` mit. Das ist eine Formänderung ohne neue Zahl. Ruling-Entwurf
R-6 (§11).

## 7 Abnahmekriterien

Alle 22 AK tragen den Präfix `AUF-` (Kollision mit m5/m6/m7/i101/i120, R136), dazu vier neue (K15 bis K18). Wortlaut der
Nachträge, Randfälle und Prüfwerte: [anhang-03-testmatrix.md](2026-10-22-auflagen-kern-design/anhang-03-testmatrix.md), dort
gilt bei Abweichung der Anhang. Der Plan startet nach dem Merge von Stadtplanung und Seerecht, die Lärm-AK sind unbedingt.

Vitest gegen `src/sim/` (`tests/sim/trial.test.ts` erweitert, `tests/sim/trial-export.test.ts` neu, Szenarien mit
`monumentDone`, gesetzten Häusern und Lagern):

1. **AK-AUF-K1 Defs:** `TRIAL_IDS = ['selfSupply', 'export']`. `TRIALS.selfSupply`: `goal: 'hold'`, `lock: 'all'`;
   `TRIALS.export`: `goal: 'sell'`, `lock: 'chain'`. `TRIAL_EXPORT_GOALS` = `{ rum: 450, cloth: 450, glass: 320, stone: 750 }`.
   `TRIAL_WARN_POP_PCT = 85`.
2. **AK-AUF-K2 Sperrliste:** abgeleitet: glass `[glass, stone, wood]`, rum `[rum, cane]`, cloth `[cloth, wool]`, stone
   `[stone]`, ohne Reihenfolgebindung.
3. **AK-AUF-K3 Start gemeinsam:** Gründe aus [I-132](2026-10-16-i132-meisterpruefung.md) AK 2 gelten auch für `export`; dazu
   «Zielgut wählen» (ohne Gut, `'food'`, Zahl, `'constructor'` per `Object.hasOwn`) und «… noch nicht freigeschaltet». Kein
   Fehlschlag ändert die Welt, keiner wirft.
4. **AK-AUF-K4 selfSupply bitgleich:** Nach `startTrial(w, 'selfSupply')` ist `sale = null`, `buy` scheitert für jedes Gut mit
   «Auflage Eigenversorgung: kein Zukauf». Die I-132-Tests ändern sich nur in der Form `sale`.
5. **AK-AUF-K5 Start export:** Rum 60 Heimat, 30 Fremdinsel, 20 auf Schiff, Zuckerrohr 50 / 40 / 0: `sale.goal = 450 + 110 +
min(90) = 650`, `sold = 0`. Glas 25, Stein 70, Holz 40: Ziel 320 + 25 + `min(70, 40)` = 385.
6. **AK-AUF-K6 Sperre chain:** Bei Glas scheitern `buy(glass)`, `buy(stone)`, `buy(wood)` an jedem Kontor mit Grund, Geld und
   Lager unverändert. `buy(spice)`, `buy(food)` wie ohne Auflage. `monumentBuyBlock` sperrt Glas und Stein, nicht Werkzeug
   und Gewürz.
7. **AK-AUF-K7 Zählen:** `sell(w, rum, 40)` zählt +40 bei erfülltem G3'. Anderes Gut, Fremdkontor (zählt), Aufträge,
   Stammkunde, Fernangebot (zählen nicht). Fehlgeschlagener `sell` zählt nicht; `sold` darf `goal` überschreiten.
8. **AK-AUF-K8 G3':** Abriss eines Kaufmannshauses oder Steuer «hoch» unter `c0`: Verkauf zählt nicht, Geld fliesst. Nach
   Neubau und Auffüllen über `c0` zählt er wieder; ein neues Bedarfsträger-Haus lässt die Zählung laufen.
9. **AK-AUF-K9 Bestehen:** Bei `sold ≥ goal` nach dem nächsten `step`: `active = null`, `sale = null`, `passed` hat
   `{ id: 'export', tick, good: 'rum' }`. Davor läuft sie. Abbruch unter 70 % im selben Tick hat Vorrang.
10. **AK-AUF-K10 Zeit abgelaufen:** `sold < goal` bei `ticks = 9000`: nicht bestanden, `passed` unverändert; bei 8999 läuft sie.
    `sold ≥ goal` genau bei Tick 9000 ist bestanden.
11. **AK-AUF-K11 Abbruch und Neustart:** `abortTrial` setzt `sale = null`. Neustart mit Stoff hält `s0`, `c0` neu fest. Ist
    `export` bestanden: «bereits bestanden», `selfSupply` startbar (und umgekehrt).
12. **AK-AUF-K12 Bitgleich, Determinismus:** Die vorhandenen Pins in `balance.test.ts` und `balance-monument.test.ts` bleiben
    ohne Auflage unverändert grün. Zwei Läufe mit gleichem Seed und Aktionsfolge (`startTrial`, `sell`, `abortTrial`)
    liefern gleiche JSON-Welten.
13. **AK-AUF-K13 Save:** Speichern und Laden erhält `trial` (inaktiv, `hold`, `sell` mit `sold > 0`, `passed` mit Gut).
    Migration setzt `sale: null`, `passed[].good: null`. Abgewiesen mit Hinweis: `sale` bei `selfSupply`, fehlendes `sale`
    bei `export`, `good: 'food'`, `goal: 0`, negatives `sold`, `passed` mit `export` ohne Gut. Version über der eigenen:
    «Unbekannte Version».
14. **AK-AUF-K14 Balancing, Literal:** Alle Balancing-Tests bleiben grün. Das Startwert-Literal zieht an allen Stellen mit
    (R-6): `balance.test.ts:32`, `balance-monument.test.ts:164`, `trial.test.ts:29/203/273`, `trial-save.test.ts`,
    `tests/ui/trial.test.ts:42`, `src/sim/world.ts:159`.
15. **AK-AUF-K15 Gleichgewicht:** Voll versorgte Stadt, Steuer «normal», mit und ohne Lärmhaus erreicht Einwohner = `c0`
    (Summe der abgerundeten Grenzen); `sell` zählt sofort.
16. **AK-AUF-K16 Lärm während der Auflage:** Eine neue Lärmquelle senkt die Einwohner unter `c0`: Zählung ruht, `c0` bleibt.
17. **AK-AUF-K17 Steuer «niedrig»:** verhält sich wie «normal» (gleiche Einwohner, `sell` zählt).
18. **AK-AUF-K18 Determinismus über Save:** N Ticks, speichern, laden, M Ticks = N+M Ticks (JSON), mit aktivem `sell`,
    `sold > 0`.

Reine UI-Helfer (`tests/ui/trial.test.ts` erweitert):

19. **AK-AUF-U1 Chip:** fünf Zustände aus §3.3 mit Texten aus den Defs. Warm genau bei Einwohner × 100 < `e0` × 85, 85 % selbst
    nicht.
20. **AK-AUF-U2 Puffer (I-162):** Grenze `ceil(e0 × 70 ÷ 100)` ganzzahlig, Prüfwerte `e0` = 10, 20, 100 (und 401 → 281);
    Sim und Anzeige gegeneinander. Puffer nie negativ. Takt bei `sell` = `ceil((goal − sold) ÷ Restminuten)`.
21. **AK-AUF-U3 Vorschau Ausfuhr:** je Gut Grundziel, `s0`, wirksames Ziel, Überschuss je Minute, nötiger Takt; gesperrtes Gut
    mit Grund, derselbe wie bei `startTrial`, ohne Weltänderung.
22. **AK-AUF-U4 Chronik und Meldungen:** eine Zeile je Auflage, bestanden mit Gut. «Zeit abgelaufen» mit Zahlen und
    «Einwohner unter 70 %» unterscheiden sich. Geladener Stand löst keine Meldung aus. `cloneTrial` kopiert tief:
    «512 von 630» stammt aus dem Vorzustand, auch nach `sale = null`.
23. **AK-AUF-U5 Handel:** Sperrgrund je Gut = `trialBuyBlock(world, good)`. Bei `sell` steht der Zählhinweis in der
    Zielgut-Zeile.

Browser-Check bei 1280 px (qa-playtester, Screenshots `.studio/qa/AUFLAGEN-KERN/`, Spielstand mit `monumentDone` und
Weidenau):

24. **AK-AUF-B1:** Karte zeigt beide Abschnitte; Gutwahl zeigt Ziel, Vorrat, Takt; «Auflage beginnen» erst nach der Wahl
    wirksam; Spiel läuft weiter, `Esc` schliesst.
25. **AK-AUF-B2:** Nach dem Start sind nur Rum und Zuckerrohr kaufbar blass, Gewürz bleibt. Chip zeigt Fortschritt und Zeit;
    Kopfzeile bleibt einzeilig, auch mit Rats-Marke.
26. **AK-AUF-B3:** Prüfstand wie B1 plus Skript (Anhang 03 §2): Abriss eines Kaufmannshauses zeigt «zählt nicht: Stadt nicht
    voll»; bei 4× mit Aushungern fallende Einwohner geben den warmen Chip; Bestehen erzeugt Meldung und Chronikzeile mit Gut.

## 8 Randfälle

- **Zielgut mit vollem Lager beim Start:** Das Ziel steigt um den Bestand. Die Vorschau zeigt das vor dem Start.
  Verkaufen vor dem Start senkt das Ziel, bringt aber nichts, weil die verkaufte Ware dann für die Auflage fehlt. Das ist
  gewollt.
- **Vorprodukte als Baustoff** (Stein und Holz bei Glas): `min(Stein, Holz)` erhöht das Glas-Ziel um bis zu 400. Der
  Spieler sieht das vor dem Start. Wer Stein und Holz nicht vorrätig hält, wählt anders oder verbaut sie vorher. Das
  Risiko steht in §10.
- **Keine Bedarfsträger-Häuser** (`c0 = 0`): Die Vollbedingung ist trivial erfüllt. Das kann nicht vorkommen, weil die
  Startbedingung mindestens 60 Kaufleute verlangt und Kaufleute alle vier Zielgüter bzw. Glas brauchen.
- **Häuser beim Start noch nicht voll:** `c0` zählt sie mit voller Grenze. Die Zählung ruht, bis sie voll sind. Die
  Vorschau nennt «Stadt nicht voll (n von c0)» schon vor dem Start.
- **Kaufmannszahl steigt während der Auflage über 150:** kein Abbruch, wie I-132.
- **Schiff mit Zielgut verkauft am Fremdkontor:** Das zählt, die Ladung stand in `s0`.
- **Kasse negativ durch Brandinstandsetzung:** kein Abbruch. Verkaufen bleibt möglich und hilft der Kasse.
- **Laden mit aktivem `sell`:** Die Auflage läuft weiter mit `goal`, `sold` und `c0`. `s0` wird nicht neu berechnet.
- **Zielgut wird während der Auflage durch eine Gütersperre der Amtsstube vom Verbrauch abgehalten:** Die Häuser
  schrumpfen, also greift G3'.
- **Seerecht beschlossen:** Schiffe sind schneller, aber Schiffe braucht es ohnehin nicht (Verkauf am Erzeugerkontor).
  Kein Stapelfall.

## 9 Nicht dazugehört

- Keine I-161 «Eigenwuchs» und keine weitere Auflage.
- Kein Abzeichen je Gut, keine Rangliste, kein Geld- oder Spielwert-Lohn, keine Freischaltung.
- Keine Abriss-Sperre und keine Ratssperre in der Auflage.
- Keine Auflage vor dem Wahlziel und kein Controller-Lauf mit Auflage im Balancing-Test.
- Keine eigene Grafik und kein Klang (bestehender Meldungs- und Glockenweg).
- Keine Änderung an «Eigenversorgung» ausser der Form im Save und der Sperrsignatur.
- Kein Rekordwert ausserhalb der Auflage.

## 10 Risiken und Playtest-Trigger

- **Vorab-Abriss** (Rest-Lücke §4.4): Besteht ein Spieler ein Ziel ohne neuen Betrieb, wird die Startbedingung an einen
  Rekordwert der Bedarfsträger-Plätze gekoppelt. Das bringt neuen Weltzustand und ein eigenes Ruling.
- **Glas-Ziel durch Baustoff-Vorrat:** Empfinden Spieler den Aufschlag `min(Stein, Holz)` als Strafe, zählt beim Glas
  künftig nur das Zielgut in `s0`. Die Defs-Regel wird dann «Vorprodukte zählen ausser Baustoffen».
- **G3' ruht nach Dienstbrand** etwa 800 Ticks [M]. Wer daran mehrfach scheitert, braucht einen deutlicheren Hinweis,
  keine weichere Regel.
- **Ungemessen:** Die Ausbau-Zyklen ×0,6 / ×0,4 und Felsbucht-Stein Stufe 2 sind [S]. Die Bauplatzzahl der Heimat ist
  kartenabhängig. Messlauf T5 mit mindestens 2 Seeds als Beleg für AK-AUF-K9, keine Pins. Rückfall R553: Zielmenge per Werte-Ruling senken, beim Glas den Baustoff-Aufschlag streichen (Anhang 03 §3).

## 11 Entscheidungsbedarf (Entwürfe für L0, Format `<was> — <warum> — <Kosten bei Irrtum>`)

1. **R-1** «Ausfuhrmeister rechnet den Startbestand an (Zielgut + `min` Vorprodukte, alle Inseln und Schiffe)» —
   (a) ist über die Zielhöhe nicht erreichbar, der Reichsvorrat liegt bei ≈ 1000 — ein Feld und eine Kartenzeile.
2. **R-2** «Zukaufsperre je Auflage; `export` sperrt Zielgut und `consumes` seines Erzeugers» — R827, (b) hält — Signatur
   `trialBuyBlock(world, good)`, umkehrbar auf Vollsperre.
3. **R-3 (D1, Abweichung vom Anhang)** «Vollbedingung G3' über eine Summe `c0` statt Haus-für-Haus mit Abriss-Sperre» —
   robust gegen den Lärmfaktor aus Stadtplanung, schliesst Steuer, Aushungern, Abriss und Lärm — Irrtum: ein Feld mehr,
   G3 + G4 bleibt als Rückfall.
4. **R-4** «Zielmengen Rum 450, Stoff 450, Glas 320, Stein 750» — gleicher Zusatz von ≈ 5 Betrieben, Scout-Stein 300 wäre
   dominant — Werte in den Defs, nach Playtest nachziehbar.
5. **R-5** «I-161 verworfen (Archiv), Begründung (a) nicht erfüllt und 87 % Überschneidung mit Eigenversorgung» — Kriterium
   R805 (4) — eine Wachstumsprüfung fehlt, später als neue Idee mit Plätzen statt Einwohnern möglich.
6. **R-6** «Literal der `trial`-Startwerte zieht an allen Stellen (AK-AUF-K14) auf die neue Form mit, keine Zahl ändert sich» —
   Verfassung §3 (bewusste Änderung als Ruling) — keine Spielfolge.
7. **D2 (Empfehlung, kein Ruling nötig):** ein Abzeichen je Auflage, nicht je Gut (YAGNI). Der Wiederspielwert liegt in
   der Gutwahl der nächsten Partie.

Kein Nutzer-Vorbehalt: Kernsäule, Genre und Titel bleiben unverändert (§5.3).

## 12 Grösse und Paketzuschnitt

**M**, ein Umsetzungspaket `AUFLAGEN-KERN` nach dem Seerecht-Merge (oder mit Nachzug-Task für die Version), Schätzung
6 Tasks:

| Task | Inhalt                                                                                                                       | AK                 |
| ---- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| T1   | Defs, Typen, Weltfeld, Save mit Migration und Prüfung, Literal an allen Stellen (K14)                                        | K1, K2, K13, K14   |
| T2   | Kern-Sim: Start mit Gut, Sperre je Gut, `tickTrial` mit Zielart, `noteTrialSale`, G1, G3'                                    | K3 bis K12, K15–18 |
| T3   | UI-Helfer: Chip, Puffer, Vorschau Ausfuhr, Chronik, Meldungen, Kartenmodell mit Abschnitten                                  | U1 bis U5          |
| T4   | UI-Verdrahtung: Karte mit Gutwahl, Handelsknöpfe je Gut, `app.ts`, «Wo war ich?»                                             | U5                 |
| T5   | Messlauf K'-arm mit Rum-Ausfuhr (Beleg, keine Pins), Version nach main + 1                                                   | K9 (Lauf)          |
| T6   | Doku (`docs/spielwerte.md` Abschnitt «Meisterprüfung», `arc42.md` Save und `trial.ts`, README-Kurzhinweis) und Browser-Check | B1 bis B3          |

Rund 250 bis 320 Tools. Den Plan schreibt `lead-tech`.

## 13 Selbstprüfung Gate Brainstorming

| Prüffrage                        | Urteil                                                                                                                                                      |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Säule und Schaden bei Misslingen | Produktionsketten, Handel. Misslingt die Auflage, bleibt das Spätspiel wie heute                                                                            |
| Echte Wahl                       | ja: 4 Zielgüter ohne dominantes Gut, abhängig von Insellage, Rat und eigener Steinversorgung. Zeitpunkt frei                                                |
| Rückkopplungen                   | Netto je Einwohner +7,0 statt +6,8. Weder Senke noch Quelle, der Erlös ist kein Anreiz. Die Bremse ist freiwillig                                           |
| Entartete Strategien             | Vorrat (G1), Zukauf (G2), Steuer, Aushungern, Abriss, Lärm (G3') geschlossen. Rest-Lücke Vorab-Abriss ist teurer als der ehrliche Weg, mit Playtest-Trigger |
| Einfachere Variante              | I-161 wäre im Code kleiner, verfehlt aber das Kriterium. G3' ist einfacher als G3 + G4. Kern ohne zweite Auflage wäre YAGNI                                 |

Urteil: **OK** für Variante A. BEDENKEN nur zum Glas-Aufschlag durch Baustoff-Vorrat und zur ungemessenen Stein-Rechnung
auf der Felsbucht. Beide sind als Playtest-Trigger und Messlauf T5 abgefangen.
