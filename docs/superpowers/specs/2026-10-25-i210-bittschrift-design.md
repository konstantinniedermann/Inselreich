# I-210 · Bittschrift (Bitte mit zwei Antworten und spätem Nachspiel) (Spec, Stufe voll)

Stand 2026-10-25 · Paket `design-i210` · Stufe voll · Grundlage: [I-210](../../ideen.md), Rechnung
[`2026-10-25-i210-bittschrift-rechnung.md`](2026-10-25-i210-bittschrift-rechnung.md) («Rechnung §n», Zahlen übernommen,
nicht neu gerechnet) · R899 (H3 + H4, B10 gestrichen; F1 ja; R-B ja) · R896 (0) · Nachtrag Gate Spec R904 · Anhänge
[01 Lagen](2026-10-25-i210-bittschrift-design/anhang-01-lagen.md), [02 Plan-Auflagen](2026-10-25-i210-bittschrift-design/anhang-02-plan-auflagen.md),
[03 Messlauf](2026-10-25-i210-bittschrift-design/anhang-03-messlauf.md), [04 Save](2026-10-25-i210-bittschrift-design/anhang-04-save.md), [05 Anzeige](2026-10-25-i210-bittschrift-design/anhang-05-anzeige.md).
Übernommen ist nur die Genre-Mechanik «Ereigniskarte mit zwei Antworten, Nachspiel verzögert» (ADR-006).

## 1 Spielerzweck (ein Satz)

Kurz nach dem ersten Ziel und danach alle 10 Minuten bitten Bürger um Waren: Wer Vorrat in den Ketten hat, sagt «Ja» und
gewinnt befristet Einwohner, Takt oder Lagerraum; wer schlank wirtschaftet, sagt «Nein» und spart eine Zeit lang an der
Ware, die die Bitte betrifft.

- **Säulen:** Bevölkerung versorgen und aufsteigen lassen; Wirtschaft (Überkapazität gegen Unterhalt).
- **Spürbar in den ersten 15 Minuten:** Ziel 1 fällt bei Tick 6050 bis 6750 (Rechnung §2 P1; `M6:AK-B1-01`,
  `M11:AK-BAS-02`). Die erste Karte kommt `PETITION_FIRST` = 600 Ticks danach, also bei Spielzeit 11:05 bis 12:15. Zu
  dieser Zeit ist mindestens «Heimkehrer» (B8, ohne Kosten) oder «Weberfamilien» (B1, 10 Stoff bei 31 im Lager) ziehbar
  (Rechnung §2 P1), die erste Karte ist also sicher.
- **Echte Wahl (Rechnung §5, §9):** Keine Phase und keine Bitte hat eine dominante Antwort. «Ja» rechnet sich nur mit
  Puffer (≥ 15 % Überkapazität in den Bedarfsketten), «Nein» lohnt gerade dann, wenn die Kette knapp ist (Rechnung §4 H3,
  H4). Die Folgelast von «Ja» steht vorher auf der Karte.
- **Wenn es misslingt:** schlimmstenfalls ein Mangel durch ein bewusstes «Ja» (sichtbar angekündigt) oder eine Karte,
  die als Ritual weggeklickt wird. Eine Ablehnung schadet nie (§3.6).

## 2 Scope

**Im Scope:** Generator auf eigenem Zufallsstrom, Karte mit zwei Antworten, 2-min-Frist, Marken und Nachspiel, neun
Bitten B1–B9, Wirkungsarten Überbelegung, Genügsamkeit, Aufstiegs-Wartezeit, Fest-Gutschein, Takt und Lagergrenze,
Chronik-Einträge, Welt-Schalter `petitionsOn`, neues Weltfeld `petitions` mit neuer Save-Version.

**Nicht im Scope:** §11.

## 3 Regeln

Alle Zahlen sind Vorschläge für die neue Datei `src/sim/defs/petitions.ts` (§4); im Code steht keine davon. Spielzeit heisst
`world.tick` (`TICK_MS` 100, 10 min = 6000 T, Rechnung §1). Alle Lager, Kosten und Bedarfe beziehen sich auf die
Heimatinsel `HOME`; einzige Ausnahme sind die Gewürzplantagen bei B6, weil Gewürz nur auf Fremdinseln wächst
(`goal3.ts` `spiceLoop`).

### 3.1 Schalter und Start

1. `createWorld(seed, { petitionsOn? })` setzt `world.petitions.on = opts.petitionsOn ?? DEFAULT_WORLD_PETITIONS_ON`
   (`false`). Muster: `DEFAULT_WORLD_CRISIS_LEVEL` (`defs/crises.ts:10`, `world.ts:139`).
2. Der Dialog «Neue Insel» hat ein Kästchen «Bittschriften», vorbelegt mit `DEFAULT_NEW_GAME_PETITIONS_ON` (`true`).
   Muster: `DEFAULT_NEW_GAME_CRISIS_LEVEL` (`defs/crises.ts:12`, `ui/settings.ts:55`). Im laufenden Spiel ist der Schalter
   fest wie die Krisenstufe.
3. Ist `on` false, tut `tickPetitions` nichts und befragt keinen Zufallsstrom; `world.petitions` bleibt über die ganze
   Partie unverändert (Baseline bitgleich, §6).
4. Ist `on` true und `next === null`: Im ersten Tick mit `world.won === true` wird `next = tick + PETITION_FIRST` gesetzt.
   Vorher wird nichts gezogen.

### 3.2 Ziehen

1. **Zeitpunkt:** bei `tick === next`. Danach immer `next += PETITION_PERIOD` (6000, Rechnung §6), auch wenn nichts
   gezogen wurde.
2. **Sperre:** Sind `PETITION_MAX_OPEN` (2) Marken offen, wird nichts gezogen.
3. **Kandidaten:** in Tabellenreihenfolge B1 … B9 jede Bitte, deren Bedingung `when` (§4.2) gilt, die nicht schon offen
   ist und deren Kosten das Lager **jetzt** deckt (Rechnung §4 H2, §8). Gibt es keinen Kandidaten, fällt der Termin aus.
4. **Strom (ADR-010):** `r = createRng((seed ^ Math.imul(tick + 1, PETITION_SALT)) >>> 0)`, eigener Salt, nie der Strom
   von Krisen, Aufträgen oder Inseln. Feste Zug-Reihenfolge: `r1` wählt den Kandidaten
   (`⌊r1 × Anzahl⌋`), bei Bitten mit Anker `r2` den Anker unter den passenden Gebäuden, nach Id aufsteigend sortiert.
5. **Marke:** `open.push({ id, drawnAt: tick, amount, anchor? })`. `amount` ist die Kostenmenge beim Ziehen (H1-Formel,
   §4.2) und bleibt fest, solange die Karte offen ist; die Karte ändert sich also nicht unter dem Mauszeiger.

### 3.3 Antworten

`answerPetition(world, drawnAt, answer)` liefert `{ ok, reason }` und wirft nie. Prüfreihenfolge, erster Treffer gewinnt;
bei `ok: false` ist die Welt JSON-gleich zu vorher:

1. `on` false → «Bittschriften aus»;
2. keine offene Marke mit diesem `drawnAt` → «Keine offene Bitte»;
3. Marke hat schon `answer` → «Schon beantwortet»;
4. `answer ∉ {'yes','no'}` → «Unbekannte Antwort»;
5. nur bei «Ja»: Anker fehlt → «‹Gebäudename› steht nicht mehr» (z. B. «Kapelle steht nicht mehr»);
6. nur bei «Ja»: alle Kostenwaren **prüfen, bevor etwas abgebucht wird**; erste fehlende → «Zu wenig ‹GOODS[g].name›
   (⌊Bestand⌋ / Bedarf)», z. B. «Zu wenig Rum (0 / 10)» (Rechnung §8). Nichts wird teilweise abgebucht.
7. Erfolg «Ja»: Kosten abbuchen, `answer = 'yes'`, `dueTick = tick + delay` (Tabelle §4.2).
8. Erfolg «Nein»: `answer = 'no'`, `dueTick = tick + delay`; **sofort** Wirkung Genügsamkeit (§3.5) bis
   `tick + FRUGAL_TICKS`.

**Frist:** Ist eine Marke bei `tick === drawnAt + PETITION_ANSWER` (1200) noch ohne Antwort, gilt im selben Tick «Nein»
wie Schritt 8 (Rechnung §7). Ein «Ja» mit Sperrgrund (Schritte 5, 6) lässt «Nein» und die Frist unberührt.

### 3.4 Nachspiel

Bei `tick === dueTick` wird die Marke geschlossen (aus `open` entfernt):

- **«Ja», Anker steht (oder Bitte ohne Anker):** Wirkung der Bitte beginnt, `until = tick + duration`; Ereignis «Dank».
- **«Ja», Anker fehlt:** Marke verfällt ohne Folge; die Kosten werden nicht erstattet; Ereignis «Verfallen» (Rechnung §8).
- **«Nein»:** Ereignis «Klage», reiner Text, **keine** Spielwirkung (die Genügsamkeit läuft seit der Antwort).

Reihenfolge in `tickPetitions` je Tick: (a) abgelaufene Wirkungen entfernen (`until ≤ tick`, mit Ereignis «Vorbei»), (b)
Frist, (c) Nachspiele, (d) Ziehen. So schliesst eine Marke vor dem nächsten Termin: Mit dem längsten `delay` 4800 plus
`PETITION_ANSWER` 1200 = 6000 ≤ `PETITION_PERIOD` ist im Regelfall höchstens **eine** Marke offen. Die Grenze 2 schützt
nur gegen spätere Def-Änderungen (Wächter AK-BS-09).

**Tick-Platz:** `tickPetitions` läuft in `step` nach `tickCrises` und vor `checkWin`; `tickUnlocks` bleibt letzter Aufruf
(`tick.ts:52-53`, ADR-005-Nachtrag nötig, arc42 Tick-Ablauf mitführen). Die Ereignisse gehen über einen neuen Eintrag
`StepReport.petitions: PetitionEvent[]` an die UI (Muster `contract`, `tick.ts:35`); sie sind kein Teil des Spielstands.

### 3.5 Wirkungen (Leseorte)

Jede Wirkung ist ein Eintrag `{ id, answer, until, anchor? }` in `petitions.effects`; Art, Stärke und Filter liest der
Code aus `PETITIONS[id]`. **Gleiche Arten stapeln nicht, es gilt je Ziel das Maximum** (Rechnung §8).

- **`overcrowd`** (B1–B3, B8; Leseort `houseCap` (`population.ts:207`)): Haus auf HOME, Stufe passt zum Filter: cap' = cap + ⌊(cap × pct + 50) / 100⌋; pct = Maximum der passenden Wirkungen.
- **`frugal`** (alle, Nein; Leseort `consume` (`population.ts:88-113`)): Haus auf HOME: Rate der Ware × (100 − `FRUGAL_PCT`) / 100; je Ware höchstens einmal.
- **`upgradeWait`** (B4; Leseort Aufstiegsuhr wie Aufstiegsfest (`feastActive`, `feast.ts:92`)): Häuser im Radius der Ankerkapelle warten `TAX_LEVELS.low.upgradeWait` (150, `tiers.ts:61`), solange die Kapelle arbeitet.
- **`feastVoucher`** (B5; Leseort `holdFeast` / Sperrprüfung (`feast.ts`)): nächstes Fest an der Ankerkapelle: Rum-Anteil der Kosten entfällt, eigene Abklingzeit entfällt; danach ist die Wirkung weg.
- **`cycle`** (B6, B7; Leseort `cycleOf` (`levels.ts:40`), auf das Ergebnis von `effectiveCycle`): c' = max(1, ⌊c × `cyclePct` / 100⌋) für alle Betriebe des Typs; mehrere Taktlöhne: kleinster Prozentwert, nicht multipliziert.
- **`storage`** (B9; Leseort neue Abfrage `storageCap(world, island, good)` statt `STORAGE_CAP`): Grenze 100 + `plus` für die genannten Waren auf HOME; bei Ablauf wird der Bestand über 100 abgeschnitten (verfällt).

Ergänzungen:

- **Überbelegung wächst wie heute zu:** Die höhere Grenze füllt ein **versorgtes** Haus mit +1 je 50 T (`population.ts:233`),
  die 3 Zusatzplätze eines Kaufmannshauses also in 150 T. Ein unversorgtes Haus wächst nicht zu: Familien ziehen nur in
  Häuser, die sie versorgen. Nach Ablauf gilt wieder cap, und das Haus gibt mit −1 je 50 T ab (`population.ts:232`): die
  Familien ziehen weiter. Die Häuser werden laufend ermittelt; ein abgerissenes Haus zählt einfach nicht mehr, ein neues
  zählt mit (Rechnung §8).
- **Zuschläge je Hausgrösse** (gerundet, aus der Formel oben): bei 15 %: Stufe 1 (cap 4) +1, Stufe 2 (8) +1, Stufe 3 (15) +2,
  Stufe 4 (20) +3; bei 10 % (B8): +0, +1, +2, +2. Prüfwerte: P1 mit 4 Bürgerhäusern +8 (Rechnung §5 «+8 Bürger»), P3b mit
  6 Kaufmannshäusern +18 (Rechnung §5 «+18 K»).
- **Aufstieg bleibt frei:** Der Aufstieg verlangt `inhabitants ≥ maxInhabitantsOf` (`population.ts:141`); ein überbelegtes
  Haus ist «voll» und wird nicht gebremst. Die Überbelegung zählt für Steuer, Bedarf und **alle Siegziele** (§7).
- **Gutschein (B5)** gilt bis zum nächsten Fest an der Ankerkapelle, höchstens `duration` = `PETITION_PERIOD` Ticks; er
  ersetzt nur den Rum-Anteil (mit I-201 auch bei Ernte- oder Markttag) und nur die Abklingzeit dieser Kapelle, nicht die
  Inselsperre von I-201 Regel 3 und nicht die Sperren «Fest läuft», «Kapelle brennt», «nicht angebunden».
- **Brand** der Ankerkapelle pausiert B4 wie ein Aufstiegsfest (`chapelWorks`), die Uhr läuft weiter.

### 3.6 Was «Nein» nie tut

«Nein» und die Frist setzen nur `frugal` (weniger Verbrauch) und einen Chronik-Text. Sie greifen nicht auf Krisen, Brand,
Häuser, Feste, Geld oder Lager zu. Die Ideenfolge «Kapellen-Fest −1» entfällt (R899). Ein Mangel ist nur über die
Folgelast eines «Ja» möglich, und die steht auf der Karte (Rechnung §8).

## 4 Werte (`src/sim/defs/petitions.ts`)

### 4.1 Konstanten

- `DEFAULT_WORLD_PETITIONS_ON` = `false` · Herkunft: R899 R-B, Rechnung §7 · Folge: Baseline.
- `DEFAULT_NEW_GAME_PETITIONS_ON` = `true` · Herkunft: R899 R-B · Folge: UI-Vorbelegung.
- `PETITION_FIRST` = 600 (1 min) · Herkunft: **neu**, Spec §1 (erste Karte im 15-min-Spiel) · Folge: > 2250 schiebt die erste Karte hinter 15:00 (Tick 9000).
- `PETITION_PERIOD` = 6000 (10 min) · Herkunft: Rechnung §6 · Folge: Wächter AK-BS-09 (`max(delay) + ANSWER ≤ PERIOD`).
- `PETITION_ANSWER` = 1200 (2 min) · Herkunft: Rechnung §6 · Folge: Wächter AK-BS-09.
- `PETITION_MAX_OPEN` = 2 · Herkunft: Rechnung §6, §8 · Folge: Save-Prüfung.
- `PETITION_SALT` = `0xc2b2ae35` · Herkunft: neu (Rechnung §6 «eigener Strom»); ≠ `CRISIS_SALT` `0x85ebca6b`, `ISLANDS_SALT` `0x27d4eb2f`, Auftrag `0x9e3779b1` · Folge: AK-BS-03.
- `OVERCROWD_PCT` = 15 · Herkunft: Rechnung §4 H3, R899 · Folge: Dominanz- und Mess-AK (AK-BS-04, AK-BS-05).
- `FRUGAL_PCT` = 10 · Herkunft: Rechnung §4 H4, R899 · Folge: AK-BS-04.
- `FRUGAL_TICKS` = 1800 (3 min) · Herkunft: Rechnung §4 H4, R899 · Folge: AK-BS-04.

### 4.2 Bitten (`PETITION_IDS`, `PETITIONS`)

Felder je Eintrag: `name`, `text` (Kurztext der Karte), `cost` (Waren bei «Ja»; Formel mit `E`), `reward` (Art, Stärke,
Filter), `delay`, `duration`, `when`, `anchor` (Gebäudetyp oder keiner), `no` (Ware der Genügsamkeit), `thanks` und
`lament` (Chronik-Texte). **E** = Einwohner aller Häuser ab Stufe 2 auf HOME beim Ziehen (H1, Rechnung §4). «Ziel offen»
heisst `!world.wonSpice`. Alle Werte aus Rechnung §6, ausser wo vermerkt. 15 % ist `OVERCROWD_PCT`; 10 % (B8), 80 % (`cyclePct`) und +20 (`plus`) stehen im jeweiligen Eintrag.

| #   | Id           | Name          | cost («Ja»)                 | reward, duration                                 | delay | when                                         | Anker    | no      |
| --- | ------------ | ------------- | --------------------------- | ------------------------------------------------ | ----- | -------------------------------------------- | -------- | ------- |
| B1  | `weavers`    | Weberfamilien | Stoff clamp(⌈E/5⌉, 10, 40)  | `overcrowd` 15 %, Häuser ab Stufe 2, 6000        | 4800  | Haus ≥ St. 2, Ziel offen                     | –        | Stoff   |
| B2  | `tavern`     | Schankrecht   | Rum clamp(⌈E/5⌉, 10, 40)    | `overcrowd` 15 %, nur Stufe 3, 6000              | 4800  | Haus St. 3                                   | –        | Rum     |
| B3  | `glaziers`   | Glaserbitte   | Glas clamp(⌈E/10⌉, 5, 20) ¹ | `overcrowd` 15 %, nur Stufe 4, 6000              | 4800  | Haus St. 4                                   | –        | Glas    |
| B4  | `bell`       | Glockenweihe  | Rum 10 + Stein 10           | `upgradeWait` im Kapellen-Radius, 1800           | 600   | Kapelle mit Haus im Radius unter Höchststufe | Kapelle  | Rum     |
| B5  | `feastDrink` | Festtrunk ²   | Zuckerrohr 20               | `feastVoucher`, bis zum Fest, höchstens 6000     | 600   | Kapelle                                      | Kapelle  | Rum     |
| B6  | `spiceSeed`  | Gewürzsaat    | Gewürz 10                   | `cycle` 80 % ³ für alle Gewürzplantagen, 6000    | 1200  | Gewürz ≥ 10 und eine Gewürzplantage ⁴        | Plantage | Gewürz  |
| B7  | `woolMarket` | Wollmarkt     | Wolle 20                    | `cycle` 80 % ³ für alle Webereien auf HOME, 3000 | 600   | Weberei auf HOME                             | Weberei  | Stoff   |
| B8  | `returnees`  | Heimkehrer    | keine                       | `overcrowd` 10 %, alle Stufen, 6000              | 2400  | Ziel offen                                   | –        | Nahrung |
| B9  | `granary`    | Speicherbau   | Holz 20 + Stein 10          | `storage` +20 für Stoff, Rum, Nahrung, 6000      | 600   | Lager von Stoff, Rum oder Nahrung ≥ 90       | –        | Nahrung |

¹ Rechnung §6 nennt ⌈E/10⌉ ohne Grenzen; die Grenzen 5 und 20 sind die halben von B1/B2, weil der Glasbedarf je
Einwohner halb so hoch ist (0,1 gegen 0,2, Rechnung §1). ² Rechnung «Erntedank»; umbenannt, damit es nicht mit dem
I-201-«Erntefest» verwechselt wird. Die Wirkung ist unverändert. ³ «Takt 40» der Rechnung bei Stufe 1 (50 → 40); als
Prozentwert, damit ausgebaute Betriebe (Zyklus 25, 20) ebenfalls +25 % Ausstoss bekommen und nicht langsamer werden. ⁴
Rechnung §6 nennt als «Nein»-Lage «keine Plantage». Ohne Plantage gäbe es aber keinen Anker; die «Nein»-Lage ist darum
«Plantagen stehen voll, das Schiff ist ausgelastet» (Anhang 01, B6). B10 «Baumeistergilde» ist gestrichen (R899).

**Kostenmengen in den Phasen** (Rechnung §5): B1 bei E = 50 → 10 Stoff, E = 60 → 12, E = 75 → 15, E = 120 → 24.

## 5 Karte, Insel und Chronik (UI)

### 5.1 Karte

Neue reine Abfrage `petitionPreview(world, drawnAt)` in `src/sim/petitions.ts` (liest nur, ändert nichts); die UI
(`src/ui/petition.ts`, DOM-freier Helfer, plus Panel) zeigt daraus:

- **Kopf:** Name, Kurztext (§8), Restfrist «Antwort bis 1:43» (Spielzeit, steht in der Pause).
- **«Ja»-Spalte:** «jetzt −10 Stoff» (rot, wenn das Lager nicht reicht, mit dem Sperrgrund aus §3.3 statt des Knopfs);
  Lohn mit Zahl, Verzögerung und Dauer, z. B. «in 8 min für 10 min: bis +8 Einwohner (Häuser ab Stufe 2)».
- **Folgelast und Reserve** (nur `overcrowd`), je Bedarfsware der betroffenen Stufen eine Zeile:
  «Stoff · Lager 31 · heute netto ±0 je 100 T · Mehrbedarf 1,6 → Lücke 1,6 · Lager reicht ≈ 3 min». Netto aus
  `goodsBalance(world, HOME).net` (`flow.ts:28`); Mehrbedarf = Σ Zusatzplätze × Rate (`tiers.ts`); Lücke =
  max(0, Mehrbedarf − max(0, netto)); Reichweite = Lager ÷ Lücke × 100 T, «kein Engpass» bei Lücke 0. Die Zusatzplätze
  sind die Summe aus §3.5 über die passenden Häuser beim Ziehen (Anzeige «bis +n», weil nur versorgte Häuser zuziehen).
- **Reserve bei Takt und Lager** (B6, B7, B9): Zahl der Betriebe, Eingangsware mit Lager und netto (B7: Wolle; B6: Gewürz
  auf der Plantageninsel), bei B9 die drei Lagerbestände. **B6 zusätzlich** die Zeile «Wirkung hängt am Schiffsraum»
  mit Gewürz im Fremdlager und Zahl der Schiffe mit Gewürzroute.
- **«Nein»-Spalte:** «für 3 min −10 % Stoffbedarf (spart ≈ 18 Stoff)»; Ersparnis = Rate der Ware auf HOME ×
  `FRUGAL_PCT`/100 × `FRUGAL_TICKS`/100 (P1: 10 × 0,1 × 18 = 18, Rechnung §4 H4). Bei Lager ≥ 90 Zusatz «Lager fast
  voll: Ersparnis verfällt teilweise». Eigene Zeile **«Warum ‹Ware›»** mit dem Grund der Nein-Ware (Feld `noReason` in
  `PETITIONS`, Text aus §8, kein Spielwert). Darunter «Keine weitere Folge».

Die Karte erscheint als Meldung und bleibt über einen Chip «Bittschrift 1:43» in der Kopfleiste offen erreichbar; ohne
Antwort schliesst sie nach der Frist mit dem Hinweis «Keine Antwort: abgelehnt». Das Spiel pausiert nicht von selbst.
Kartenformat (Rahmen, zwei Spalten, Knöpfe) wird mit «Neue Ufer» N4 geteilt, der Inhalt nicht (§10).

### 5.2 Insel und Chronik

Panels zeigen jede laufende Wirkung am betroffenen Haus, Betrieb, Lager oder an der Kapelle mit Restzeit (z. B. «23 / 20
(Weberfamilien bis 31:40)», «Genügsam: Stoffbedarf −10 % bis 14:20»); die Chronik bekommt aus `StepReport.petitions`
(Muster `ui/crisisLog.ts`, kein Teil des Spielstands) die Einträge «gezogen», **Dank**, **Klage** (reiner Text),
«Verfallen» und «Vorbei». Alle Zeilen und Beispieltexte: [Anhang 05](2026-10-25-i210-bittschrift-design/anhang-05-anzeige.md).

## 6 Baseline und Save (R899 R-B)

- **Baseline bitgleich:** Welt-Standard aus (§3.1); `tickPetitions` kehrt sofort zurück, kein Zugriff auf einen Strom,
  und alle Leseorte aus §3.5 liefern ohne Eintrag in `effects` den heutigen Wert.
  `tests/sim/balance.test.ts` und die gepinnten Sieg-Ticks bleiben unverändert, kein Ruling zum Test (Rechnung §7).
- **Neues Weltfeld** (Form nach Rechnung §7, ergänzt um `amount` und `null` für «noch nicht geplant»):

```text
petitions: {
  on: boolean,
  next: number | null,
  open: { id: PetitionId, drawnAt: number, amount: number, anchor?: number,
          answer?: 'yes' | 'no', dueTick?: number }[],
  effects: { id: PetitionId, answer: 'yes' | 'no', until: number, anchor?: number }[]
}
```

- **Save-Version:** `SAVE_VERSION` = Stand von main **+ 1 beim Merge** (heute 18, `save.ts:55`; SEERECHT bringt
  voraussichtlich 19, dann wird es 20). Keine feste Nummer im Plan.
- **Migration** vorige Version → neue (Muster `migrateV17ToV18`, `save.ts:940`): setzt
  `petitions = { on: false, next: null, open: [], effects: [] }`. Alte Partien laden ohne Bittschriften und spielen bitgleich
  weiter. Noch ältere Stände laufen durch die bestehende Kette.
- **Prüfregeln** (`isValidPetitions`, sonst `{ ok: false, reason: 'Beschädigter Spielstand' }`, nie ein Wurf): vollständig in
  [Anhang 04](2026-10-25-i210-bittschrift-design/anhang-04-save.md); Kern: `open.length ≤ PETITION_MAX_OPEN`, Ids aus
  `PETITION_IDS`, Zeiten im Fenster der Fristen, bei `on: false` alles leer.
- **Unbekannte Version** (neuer als der Build) → «Unbekannte Version» (`save.ts:1031`).

## 7 Siegziele und Ehrenbuch (R899 F1)

**Überbelegung zählt für die Siegziele.** `checkWin` (`tick.ts:20-30`) liest `citizens`, `merchants`
(`population.ts:280-295`) und `spiceMerchants` (`goal3.ts:8-17`); alle summieren `house.inhabitants`. Die Überbelegung
erhöht genau dieses Feld, es braucht also keine Codeänderung und keinen Sonderfall, nur einen Test (AK-BS-14).

- **Ziel 3** (80 Kaufleute, 600 T gehalten, `tiers.ts:57-58`): bis **≤ 550 T** früher (Rechnung §10). Gegenprobe mit der
  Zuwachsregel aus §3.5: 3 volle Kaufmannshäuser plus ein viertes mit 8 Bewohnern brauchen ohne Lohn 12 × 50 = 600 T,
  mit +3 je Haus 150 T, Vorsprung 450 T ≤ 550 T. Die Haltezeit 600 T bleibt (`satisfiedSince`).
- **Ziel 2** (60 Kaufleute): Vorsprung bis 300 T (zwei volle Häuser und eines mit 11 Bewohnern: 450 T gegen 150 T).

**Ehrenbuch-Prüfung (I-186):** Trägt ein Eintrag die Überbelegung als Lohn ohne Geld? **Ja, vorhandene Einträge; kein
neuer Eintrag.**

- `swiftTrade` «Kaufmannseile» (Ziel 2 bis Tick `HONOR_SWIFT_MERCHANT_TICK` 18 000, `defs/honors.ts:24`; I-186 Spec §2.2)
  liegt im Wirkfenster: erste Karte bei ≈ 6650–7350, Zuzug nach «Ja» bei ≈ 11 450–13 350, Überbelegung bis
  ≈ 17 450–19 350. Für Spieler, die langsamer als das Skript (Ziel 2 bei 11 500) sind, kann ein «Ja» das Tempo-Stück
  holen; das ist ein Lohn ohne Geld.
- `spiceTown` «Gewürzstadt» (Ziel 3) wird ebenso früher erreicht.
- Der Tracker liest nur die Ziel-Flags (I-186 §2.1, `honorMarks`), die Bittschrift braucht dort nichts.
- **Kein neuer Eintrag:** Ein Stück «n Bitten angenommen» wäre Sammeln um des Sammelns willen (I-186 §2.2, «Nicht
  aufgenommen», letzter Punkt), bräuchte einen Sim-Zähler und ein Save-Feld und belohnte «Ja» ohne Lage, also die
  Dominanz, die H3 verhindern soll.
- **Folge für die Tempo-Schwellen:** Neue Partien starten mit Bittschriften, die Tempo-Stücke werden dadurch höchstens
  leichter, nie schwerer. Die Nachjustier-Regel R-EB-1 (I-186 §2.2) bleibt der Weg, falls «Kaufmannseile» zu leicht wird.

## 8 Nachvollziehbarkeit (R896 (0))

Grundregel für alle Bitten: **«Ja»** heisst, die Stadt gibt Waren her und bekommt dafür etwas, das selbst Waren braucht
oder Waren schafft. **«Nein»** heisst, die Stadt hat entschieden, mit dem Vorhandenen auszukommen, und spart darum eine
Zeit lang an der **Ware, die die Bitte betrifft**: an der erbetenen Ware selbst (B1–B4, B6) oder an der Ware, der der Lohn
gedient hätte (B5 Rum aus dem Rohr, B7 Stoff aus der Wolle, B8 Nahrung für die Heimkehrer, B9 Nahrung als grösster Posten
des Speichers). Beides steht als Zahl auf der Karte; das Nachspiel kommt als Dank oder Klage in die
Chronik.

- **B1** «Weberfamilien möchten zuziehen und bitten um Stoff als Hausrat.» — **Ja:** Nach 8 min zeigen versorgte Häuser ab Stufe 2 «23 / 20»; Steuer steigt; die Bedarfszeilen aller Waren der Stufe steigen. **Nein:** Häuser zeigen «Genügsam: Stoff −10 %»; Klage «ziehen weiter». **Fachlich:** Wer zuzieht, braucht Hausrat und danach wie alle Nahrung und Stoff: der Lohn bringt die Folgelast selbst mit.
- **B2** «Wirtsleute wollen eine Schenke eröffnen und brauchen Rum für den Ausschank.» — **Ja:** Bürgerhäuser (Stufe 3) überbelegt; Rumbedarf steigt mit. **Nein:** Rum −10 %: ohne Schenke wird weniger getrunken. **Fachlich:** Schankleute leben, wo Rum getrunken wird (Stufe 3); sie trinken selbst mit.
- **B3** «Glasermeister bitten um Glas für ihre Werkstattfenster.» — **Ja:** Kaufmannshäuser (Stufe 4) überbelegt; Glas- und Gewürzbedarf steigen. **Nein:** Glas −10 %. **Fachlich:** Glaser sind Kaufleute; sie brauchen, was Kaufleute brauchen.
- **B4** «Die Gemeinde will eine Glocke weihen: Stein für den Turm, Rum für die Feier.» — **Ja:** Nach 1 min läuft im Kapellenkreis die kurze Aufstiegsuhr (wie Aufstiegsfest) für 3 min. **Nein:** Rum −10 %: die Gemeinde feiert schlicht. **Fachlich:** Eine geweihte Glocke zieht wie ein Fest Leute an die Kapelle; ohne Feier wird weniger Rum getrunken.
- **B5** «Die Kapelle bittet um Zuckerrohr und brennt den Festtrunk selbst.» — **Ja:** Kapelle zeigt «Festtrunk»: nächstes Fest ohne Rum und ohne Abklingzeit. **Nein:** Rum −10 %. **Fachlich:** Aus Rohr wird Rum; wer das Rohr gibt, spart den Rum des nächsten Fests.
- **B6** «Die Pflanzer bitten um Gewürz als Saat.» — **Ja:** Nach 2 min zeigen alle Gewürzplantagen «Zyklus 80 %» für 10 min; mehr Gewürz kommt per Schiff, wenn das Schiff Platz hat. **Nein:** Gewürz −10 %: die Kaufleute würzen sparsamer. **Fachlich:** Saat bringt Ernte, aber nur, wenn die Ernte auch heimkommt (Schiff, Lager der Fremdinsel).
- **B7** «Die Weber bitten um Wolle für einen Wollmarkt.» — **Ja:** Nach 1 min alle Webereien auf HOME «Zyklus 80 %» für 5 min; der Stoff-Ausstoss steigt, solange Wolle da ist. **Nein:** Stoff −10 %. **Fachlich:** Ein Markt bringt den Webern Aufträge; ohne Wolle stehen auch schnelle Webstühle still.
- **B8** «Ausgewanderte kehren heim und bitten um Aufnahme bei Verwandten.» — **Ja:** Nach 4 min alle versorgten Häuser +10 % für 10 min; vor allem der Nahrungsbedarf steigt. **Nein:** Nahrung −10 %: «Wir weisen sie ab, weil die Vorräte knapp sind, und teilen die Nahrung sparsamer zu.» **Fachlich:** Heimkehrer kosten nichts beim Einzug, essen aber mit: die ganze Last liegt in der Nahrungsreserve; wer ablehnt, tut es wegen eben dieser Reserve und rationiert sie.
- **B9** «Die Händler wollen einen Speicher bauen: Holz und Stein.» — **Ja:** Lagerzeile «120» für Stoff, Rum, Nahrung für 10 min; bei Ablauf verdirbt, was darüber liegt. **Nein:** Nahrung −10 %: «Ohne neuen Speicher wird der Vorrat geschont; die Nahrung, der grösste Posten, wird sparsamer zugeteilt.» **Fachlich:** Ein Speicher hilft nur, wenn etwas gelagert wird, das sonst verfällt, oder vor einem Sturm; wer auf ihn verzichtet, muss mit dem heutigen Lager durch den nächsten Engpass und spart am grössten Verbrauch (Nahrung 0,5 je Einwohner gegen 0,2 Stoff oder Rum, Rechnung §1).

**Prüfstein:** Jede Zeile beantwortet «Warum passiert das?» aus dem Spielbild heraus: Die Ware auf der Karte ist die Ware,
die die Bittsteller selbst brauchen (B1–B3, B8), die Ware, aus der ihr Werk entsteht (B4–B7), oder Baustoff (B4, B9). Die
Nein-Ware folgt der Grundregel oben und steht mit Grund auf der Karte (§5.1, AK-BS-24). Es gibt keine sachfremde Kopplung
(R896 (3)).

## 9 Randfälle

Regel jeweils in §3, Zahlen aus Rechnung §8:

- **Ware fehlt beim «Ja»** oder fällt während der Frist: `{ ok: false, reason: 'Zu wenig Rum (0 / 10)' }`, nichts teilweise;
  «Nein» und Frist bleiben (AK-BS-06).
- **Nicht bezahlbar beim Ziehen:** kein Kandidat (P1: Rum 0 → nie B2); nach Ziel 3 nie B1, B8 (AK-BS-07).
- **Zwei offene Marken:** kein Ziehen, `next += PETITION_PERIOD`; Regelfall eine Marke (AK-BS-08, AK-BS-09).
- **Gleiche Lohnart doppelt / Endlos-Überschuss:** Maximum, nie Summe; jede Wirkung hat `until`; Speicherbau-Ablauf schneidet
  auf 100 (AK-BS-10).
- **Abriss:** Anker vor dem Nachspiel → verfällt ohne Folge und Erstattung; vor der Antwort → «Ja» gesperrt; überbelegtes
  Haus → zählt nicht mehr (AK-BS-11).
- **Pause:** alles rechnet in Ticks und steht (AK-BS-12).
- **«Nein» oder Frist:** nur `frugal` und Text, keine Krise, kein Mangel (AK-BS-13).
- **Alter Spielstand:** Migration, Bittschriften aus, bitgleich (AK-BS-15).

## 10 Abhängigkeiten und Risiken

- **I-201 Festanlass (B4, B5):** B4 nutzt die Aufstiegsuhr des Aufstiegsfests, B5 den Festaufruf. Kommt I-201 zuerst, lesen
  B4 und B5 über das Blattmodul `feastEffect.ts` (I-201 Regel 8), der Gutschein erlässt nur den Rum-Anteil jeder Festart.
  Kommt I-210 zuerst, gilt dasselbe gegen `FEAST_RUM` und `feast.ts`; der Plan der späteren Spec zieht nach. Kein
  gegenseitiger Import über `feastEffect` hinaus.
- **«Neue Ufer» N4** (Wahl-Karten, `2026-10-23-tiefe-1-skizzen.md` §2): Kartenrahmen und Knopf-Modell teilen, Inhalte,
  Strom und Weltfeld getrennt halten.
- **SEERECHT, INSELPROBEN:** beide berühren den Save; die Version wird beim Merge vergeben (§6). INSELPROBEN: offene Frage
  F-2 (§13, entschieden: Proben ohne Bittschriften).
- **AUSBAU-LOGIK (R896 (3)):** kann Waren der Ketten und Ausbauten ändern. Dann sind Kostenwaren und `when` der Bitten
  nachzuziehen (nur in den Defs) und der Dominanztest erneut zu prüfen.
- **R-BS-1 «stabile Stadt hergeleitet, nicht gemessen»** (Rechnung §2 P3b): AK-BS-05, Anhang 03.
- **R-BS-2 Zwei Lückenwerte in der Rechnung (kein Widerspruch):** §3 rechnet die Ideenform mit festen 15 Einwohnern
  (15 × 0,2 − 2,4 = 0,6 Stoff; 15 × 0,5 − 6 = 1,5 Nahrung je 100 T), §4 H3 mit +15 % = 18 Kaufleuten (1,2 und 3,0).
  Massgeblich ist §4 (R899). AK-BS-05 misst es.
- **R-BS-3 Testlaufzeit:** AK-BS-04 rechnet 18 Lagen × 2 Seeds × 2 Antworten = **72 Läufe** über bis zu ≈ 12 000 T.
  Messung vor Zusage, Soll und Aufteilung: Anhang 02, B-5.
- **R-BS-4 Vorbereitetes «Ja» dominiert in der stabilen Stadt mit Krisen aus** (Gate B-4): Wer gezielt ≥ 15 % Puffer baut
  oder die Lücke zukauft (`BUY_RISE = 0`, Rechnung §4 Punkt 2, §9), gewinnt mit «Ja» (AK-BS-05: ΔGeld ≈ 23 760 gegen
  ≈ 0). Die Wahl liegt dann in der Vorbereitung, nicht in der Karte. Mit R899 so beschlossen. **Beobachtung:** Playtest-
  Frage nach Release («Sagt eine vorbereitete Stadt noch je Nein?»). **Rückfall:** `OVERCROWD_PCT` löst es nicht (höherer
  Zuzug macht vorbereitetes «Ja» noch stärker); nur ein steigender Zukaufpreis macht den Puffer selbst knapp. Anschluss an
  die laufende L0-Rechnung «Zukaufpreis steigt» (`BUY_RISE`, R899). Kein neuer Wert in dieser Spec.

## 11 Nicht im Scope

- **Sandkasten nach Ziel 3 mit Krisen aus:** Dort ist ausser Geld nichts knapp, die Wahl bleibt leicht (Rechnung §4
  «Grenze», R899 F1). Kein Nachschärfen in dieser Spec.
- **Geld als Lohn:** keine Bitte zahlt oder erstattet Geld (R722).
- **Zukaufpreis `BUY_RISE`** (`goods.ts:69`): eigene Rechnung bei L0 (R899, «Zukaufpreis steigt»).
- **Story-Rahmen I-018** (geparkt, §5.3): keine Figuren, keine Handlung; nur Kurztext.
- **Interessengruppen** (TIEFE-2 B-4, ausgeschieden).
- **H2 Kostenware nach Engpass** (Rechnung §4): B3 fordert fest Glas; eine wechselnde Kostenware müsste auch die Ware der
  Genügsamkeit wechseln und die Karte unruhig machen (F-1, §12).
- Neue Grafik, eigener Klang, Controller-Antworten (der Balancing-Controller antwortet nie), Umschalten im laufenden Spiel.

## 12 Abnahmekriterien

Vitest (DOM-frei): `tests/sim/petitions.test.ts` (neu, Regeln, Save, Randfälle), `tests/sim/petitionsDominance.test.ts`
(neu, AK-BS-04), `tests/sim/petitionsStable.test.ts` (neu, AK-BS-05), `tests/ui/petition.test.ts` (neu, Karte).

- **AK-BS-01 Baseline bitgleich:** `createWorld(seed)` hat `petitions = { on: false, next: null, open: [], effects: [] }`;
  über 20 000 T mit Balancing-Controller ändert sich `JSON.stringify(world.petitions)` nie, und `createRng` wird mit
  `PETITION_SALT` nie aufgerufen (Spion auf den Strom-Helfer in `petitions.ts`; Mittel wählt der Plan). `tests/sim/balance.test.ts` und die gepinnten Sieg-Ticks
  (6050, 6750, 11 500) unverändert grün.
- **AK-BS-02 Start:** mit `petitionsOn: true` vor Ziel 1 kein Zug, `next` null; im ersten Tick mit `won` (wonTick) →
  `next = wonTick + 600`; die erste Marke entsteht bei `tick === wonTick + 600` (§3.2.1), keine früher; der zweite
  Termin liegt bei `wonTick + 6600`. **Kein Kandidat beim ersten Termin** (Welt mit `won` und `wonSpice` gesetzt, Rum,
  Glas, Wolle, Gewürz 0, keine Kapelle, kein Lager ≥ 90): nach §3.2.3 fällt der Termin aus, keine Marke, `next =
wonTick + 6600` (wie AK-BS-07); ist dort ein Kandidat bezahlbar, entsteht die Marke dann.
- **AK-BS-03 Determinismus:** zwei Welten mit gleichem Seed und gleichen Aktionen über 30 000 T → gleiche Folge
  `(drawnAt, id, amount, anchor)` und gleiches `serialize`. Speichern und Laden mitten in einer Frist ergibt dasselbe
  `serialize` wie der durchgelaufene Lauf. Eigener Strom: Ein Lauf mit Krisen «normal» und Bittschriften an hat dieselbe
  Krisenfolge wie derselbe Lauf mit Bittschriften aus.
- **AK-BS-04 Dominanz-Regressionsschutz** (`petitionsDominance.test.ts`, Pflicht): je Bitte B1–B9 eine Ja-Lage und eine
  Nein-Lage aus Anhang 01, je Lage zwei feste Seeds. Aus demselben Stand zwei Läufe («Ja», «Nein») über das Fenster
  `[Antwort, Antwort + delay + duration + 300]`. Mass wie I-201: Nettowert = ΔGeld + Σ_g ΔLager_g × `GOODS[g].sell`; bei
  B4 und B5 zählt der Steuerzuwachs aus Aufstiegen darin mit. Erwartung: in der Ja-Lage Ja > Nein, in der Nein-Lage
  Nein > Ja; nur Rangfolgen, keine Beträge. Der Test prüft seine Vorbedingungen (alle Antworten `ok`, kein Brand, Krise nur
  wo die Lage sie setzt). Fällt er nach einer Def-Änderung, gilt der Rückfall aus AK-BS-05.
- **AK-BS-05 Messlauf stabile Stadt (R-BS-1)** (`petitionsStable.test.ts`): 6 Kaufmannshäuser, Betriebe je Kette mit
  ü ≈ 10 % (Machbarkeit 5–14 % prüft der Plan vor Zusage), Lager 100, Krisen aus; B1 mit `amount` 24; Zweige J, J+F (+2
  Fischer, Machbarkeit wie oben), N+F, N. Bänder (für ü = 10 %; im Test als Formel von ü, Herleitung je Band und
  Fehlerrichtung in Anhang 03): Zusatzplätze genau 18; J erstes unversorgtes Haus 3133–3483 T nach der Zuzugsrampe
  (Erwartung 3333, Rechnung §4 H3); J+F Stoff am Ende 22–31 (28) und kein Mangel; ΔGeld(J+F − N+F) 21 000–24 500
  (23 760, Rechnung §1, §5); N gesparter Stoff 37–44 (43,2, Rechnung §4 H4), Stoff gegen Referenz +0 bis +6 (Ersparnis
  verfällt). Rückfall bei Abweichung: Anhang 03 §4 (`OVERCROWD_PCT` 20 oder 12, nur per Ruling in den Defs).
- **AK-BS-06 Ware fehlt:** Rum 0, offene B2 (gesetzt) → «Zu wenig Rum (0 / 10)», Welt JSON-gleich; B4 mit Rum 30, Stein 4 →
  «Zu wenig Stein (4 / 10)», Rum bleibt 30; danach «Nein» ok. Lager fällt nach dem Ziehen unter `amount`: «Ja» gesperrt, bei
  `drawnAt + 1200` gilt «Nein».
- **AK-BS-07 Kandidaten:** Welt mit Rum 0: in 50 Termin-Seeds nie B2; ohne Kapelle nie B4/B5; ohne Plantage nie B6; nach
  `wonSpice` nie B1/B8; ohne jeden Kandidaten fällt der Termin aus und `next` rückt um 6000.
- **AK-BS-08 Zwei offene Marken:** zwei Marken gesetzt, Termin erreicht → keine dritte, `next += 6000`; `answerPetition`
  arbeitet auf beiden getrennt.
- **AK-BS-09 Wächter Defs:** `max(delay) + PETITION_ANSWER ≤ PETITION_PERIOD`; `PETITION_FIRST + 6750 ≤ 9000`; jede
  Bitte hat `duration > 0`; alle `cost`-Waren und `no`-Waren sind `GoodId`; neun Einträge, keine B10.
- **AK-BS-10 Stapeln und Frist:** zwei B1-Wirkungen überlappend → Haus Stufe 4 hat cap 23, nicht 26; B1 und B8 zugleich →
  15 %; zwei Taktlöhne → 80 %, nicht 64 %; Erntefest (I-201) und Taktlohn → kleinerer Wert. Nach `until` gilt cap, das Haus
  gibt −1 je 50 T ab; Speicherbau-Ablauf schneidet 117 Stoff auf 100. «Ja» auf jede Bitte über 60 000 T: nie ein Haus über
  cap + Zuschlag (15 %).
- **AK-BS-11 Abriss:** Ankerkapelle von B4 nach «Ja» abgerissen → beim Nachspiel keine Wirkung, Ereignis «Verfallen»,
  Kosten nicht zurück; vor der Antwort abgerissen → «Kapelle steht nicht mehr», «Nein» ok. Überbelegtes Haus abgerissen →
  übrige Häuser unverändert, kein Wurf.
- **AK-BS-12 Pause:** Welt mit offener Marke, kein `step` über beliebige Wanduhrzeit → Restfrist unverändert; nach 1199
  Schritten noch offen, nach 1200 «Nein».
- **AK-BS-13 Nein ist harmlos:** feste Welten ohne Controller, Bittschriften an und nie eine Antwort, gegen die Referenz
  ohne Bittschriften, 60 000 T, je Fenster 6000 T: (a) versorgte Welt: Einwohner je Tick gleich, Geld ≥ Referenz,
  Krisenfolge gleich; (b) knappe Welt: Einwohner-Ticks und Geld je Fenster ≥ 99 %, gesamt ≥ Referenz. Volles Lager mit
  stehendem Betrieb ist kein Fehler; Geld unter Referenz ist ein Fehler im Leseort. Mass und Fehlerrichtung: Anhang 03 §5.
- **AK-BS-14 Siegziele:** Haus Stufe 4 mit 23 Bewohnern unter Überbelegung zählt 23 in `merchants` und `spiceMerchants`;
  konstruierte Welt mit 3 × 23 + 11 = 80 versorgten Kaufleuten setzt nach 600 T Haltezeit `wonSpice`.
- **AK-BS-15 Save:** Rundlauf mit offener Marke (beantwortet und unbeantwortet) und laufenden Wirkungen aller Arten
  erhält alles; Migration eines Stands mit `SAVE_VERSION - 1` → `on: false`, Weiterspielen bitgleich zum ungeladenen Lauf.
  Abgewiesen mit Hinweis, ohne Wurf: drei offene Marken, Id `'guild'`, doppelte Id, `answer: 'maybe'`, `dueTick` ohne
  `answer`, `until` über der Höchstdauer, `on: false` mit Wirkung, `next` als Text; Stand mit `SAVE_VERSION + 1` →
  «Unbekannte Version».
- **AK-BS-16 Werte nur aus Defs:** Strukturtest auf `src/sim/petitions.ts` ohne Kommentare: keine Literale der Zeitwerte
  6000, 4800, 3000, 2400, 1800, 1200 und kein `PETITION_SALT`-Wert, keine Waren-Ids als Text; Formelkonstanten (z. B.
  `+ 50) / 100`) und kleine Zahlen sind ausgenommen (Anhang 02, B-9); `defs/petitions.ts` exportiert die Werte aus §4 (Test liest sie
  gegen die Tabelle).
- **AK-BS-17 Controller (echter Test oder gestrichen, Plan entscheidet, Anhang 02 B-10):** Balancing-Controller mit `petitionsOn: true` erreicht Ziel 1 bis
  `WIN_TICK_LIMIT`; Kaufleute-Controller erreicht Ziel 2 bis `MERCHANT_TICK_LIMIT` (beide antworten nie, also nur
  Genügsamkeit).
- **AK-BS-18 Karte (UI-Helfer):** `petitionPreview` für B1 in P1-Lage (4 Bürgerhäuser, Stoff 31, netto 0): Kosten 10,
  Zusatzplätze 8, Mehrbedarf Stoff 1,6, Nahrung 4,0, Rum 1,6; Reichweite Stoff 31 ÷ 1,6 × 100 ≈ 1938 T; Ersparnis «Nein» 18.
  Die Abfrage ändert die Welt nicht.
- **AK-BS-23 Inselproben (F-2, R904):** Eine Welt aus dem Proben-Start hat `petitions.on === false`, auch wenn das Kästchen
  «Bittschriften» an ist (Anhang 02, B-8).
- **AK-BS-24 Nein-Begründung auf der Karte (R896 (0)):** Für jede der 9 Bitten enthält das Kartenmodell der «Nein»-Spalte
  den Namen der Nein-Ware (`GOODS[no].name`) und einen nicht leeren Grund aus `PETITIONS[id].noReason`; bei B5, B7, B8, B9
  nennt der Grund zusätzlich, warum es nicht die erbetene Ware ist (Text enthält den Namen der erbetenen bzw. der
  Lohn-Ware, B8: «Nahrung»).
- **AK-BS-25 B6-Hinweis:** Das Kartenmodell von B6 enthält in der «Ja»-Spalte die Zeile «Wirkung hängt am Schiffsraum»
  mit Fremdlager-Gewürz und Zahl der Schiffe mit Gewürzroute; bei anderen Bitten fehlt die Zeile.

Browser-Check (`qa-playtester`, Headless):

- **AK-BS-19** Neue Insel: Kästchen «Bittschriften» ist an; nach Ziel 1 erscheint nach 1 min die Karte mit beiden Spalten,
  Zahlen wie §5.1 und Restfrist; die Frist steht in der Pause.
- **AK-BS-20** «Ja» auf B1: Lager sinkt sofort um die Kosten; nach 8 min Chronik «Dank» und Hauspanel «23 / 20»; nach
  Ablauf «ziehen weiter».
- **AK-BS-21** «Nein»: Hauspanel «Genügsam …» für 3 min, nach `delay` Chronik «Klage», sonst keine Änderung.
- **AK-BS-22** Lager zu klein: «Ja» zeigt den Sperrgrund statt des Knopfs; «Nein» klickbar.

## 13 Entschieden (R904) und Auflagen für den Plan

- **F-1 H2 für B3:** entschieden, Glas fest (§11); nach dem Playtest prüfen.
- **F-2 Inselproben:** entschieden, Proben fest **ohne** Bittschriften (AK-BS-23).
- **F-3 `PETITION_FIRST` 600:** angenommen; Wächter AK-BS-09.
- **Auflagen für den Plan** (`lead-tech`, Gate B-5, B-7 bis B-10): [Anhang 02](2026-10-25-i210-bittschrift-design/anhang-02-plan-auflagen.md)
  (Laufzeit und Aufteilung AK-BS-04, Ersatzmass B6/B9, `SAVE_VERSION - 1`, Proben-AK, Strukturtest-Wortlaut,
  Controller-Test). Dazu: README-Spielanleitung, arc42 (Modul `petitions`, Tick-Ablauf, Persistenz) und ADR-005-Nachtrag
  mitführen; `storageCap` ersetzt `STORAGE_CAP` in `economy.ts:13` und `trade.ts:127` bitgleich.
