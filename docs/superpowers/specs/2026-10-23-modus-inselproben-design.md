# Modus «Inselproben» · Inselprobe, Tagesinsel, Szenario «Schuldbrief» (Design-Spec)

Stand 2026-10-23 · Paket `design-INSELPROBEN` · Prozessstufe voll · Nutzerauftrag R862 (Modi, die länger am Ball halten) ·
Ideen I-190, I-191, I-192 · Grundlage: Skizzen TIEFE-1 §6–§7
([`2026-10-23-tiefe-1-skizzen.md`](2026-10-23-tiefe-1-skizzen.md)), Recherche
[`docs/recherche/2026-10-23-tiefe-1.md`](../../recherche/2026-10-23-tiefe-1.md) R2 · Rechnung:
[anhang-01-schuldbrief-rechnung.md](2026-10-23-modus-inselproben-design/anhang-01-schuldbrief-rechnung.md) ·
Befund Geldkurve: WIRTSCHAFT-TIEFE (`docs/recherche/2026-10-23-wirtschaft-spaetspiel.md` §1, Branch des Pakets). Alle
Mechaniken sind Genre-Gemeingut; Namen, Texte und Werte sind eigen (ADR-006). Plan: folgt durch `lead-tech`.

## 1 Spielerzweck (ein Satz)

Der Spieler wählt eine feste Insel mit festem Ziel, spielt auf Spielzeit und schlägt beim nächsten Versuch seine eigene
Bestzeit — täglich auf einer neuen, für alle gleichen Insel oder im Szenario «Schuldbrief», in dem jede Münze wieder zählt.

- **Säulen:** Der Modus stärkt alle vier Säulen, ohne eine Regel zu ändern; der Schuldbrief stärkt «Wirtschaft über Steuern
  und Handel» gezielt in der Phase, in der Geld im Grundspiel kein Engpass mehr ist (Leitbefund R722; ab min ≈ 14 wächst die
  Kasse um +2500 … +3200/min, WIRTSCHAFT-TIEFE §1.1).
- **Wenn es misslingt:** leidet nichts im Grundspiel. «Neue Insel» und jede bestehende Partie bleiben bitgleich (§9).
- **Spürbar in 15 Minuten:** Die Uhr läuft ab dem ersten Tick sichtbar in der Kopfzeile. Probe 1 ist in ≈ 11–20 min schaffbar
  (Controller: Ziel 1 bei Tick 6750 = 11:15, `docs/superpowers/specs/2026-10-17-i144-rechnung.md:84`). Das Ende zeigt die
  Zeit, die Bestzeit und «Nochmal» — der Grund für den zweiten Versuch ist sofort da.
- **Spielschleifen:** kurz = Grundspiel (Bauen, Versorgen); Minuten = Ziel unter der Uhr, im Schuldbrief «tilgen oder
  investieren»; über Partien = Bestzeit, Tagesliste, Rückkehr am nächsten Tag.

## 2 Annahmen (statt Rückfragen; L0 prüft im Gate)

| Nr. | Annahme                                                                                                                                           | Folge, wenn falsch                                         |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| A1  | Gewertet wird **Spielzeit in Ticks**, nicht Echtzeit. Tempo und Pause ändern die Wertung nicht.                                                   | Echtzeit bestraft Nachdenken; widerspräche dem ruhigen Ton |
| A2  | Bestzeiten bleiben **lokal** (kein Server, ADR-001). Vergleich mit anderen nur per Teilen-Text.                                                   | Server wäre eine Architektur- und Kostenfrage (Nutzer)     |
| A3  | Während der Probe gelten **alle Regeln des Grundspiels**; nur das Szenario fügt eigene Regeln hinzu, und nur wenn es aktiv ist.                   | sonst Grundspiel nicht bitgleich                           |
| A4  | Nach Ende (bestanden oder verloren) läuft die Partie als **freies Spiel** weiter, ohne weitere Wertung.                                           | ein harter Abbruch würde Fortschritt wegwerfen             |
| A5  | **Keine Meta-Boni** über Partien (T6, R722): Eine Bestzeit schaltet nichts frei und ändert keinen Spielwert.                                      | Vergleichbarkeit der Proben ginge verloren                 |
| A6  | Die Freischaltung ist in jeder Probe **fest «stufenweise»**; die Einstellung «Alles frei» gilt nur für «Neue Insel».                              | «Alles frei» würde jede Wertung entwerten                  |
| A7  | Ein Szenario, das Geld knapp macht, ist **kein Darlehen** im Sinne von I-094 (N-101 verworfen): Die Schuld ist Startlage, nie ein Angebot (§5.4). | Wenn L0 das anders liest: Kenntnis-Eintrag (§14 F1)        |

## 3 Schnitt und Empfehlung

| Variante                                                               | Kurz                                | Urteil                                                                                                                                                                                                  |
| ---------------------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **R: Rahmen + 5 Proben + Tagesinsel + 1 Szenario (empfohlen)**         | ein Probe-Rahmen, drei Arten darauf | Rahmen einmal bauen; jede Art ist eine Def-Zeile plus wenig Regel; ein Szenario als Prüfling der Szenario-Regel                                                                                         |
| M: wie R mit drei Szenarien (Skizze §7: + «Karge Heimat», «Sturmjahr») | Skizze                              | «Sturmjahr» ist als Auflage schon als trivial verworfen (I-132 Spec §2, A3: drei Feuerwachen ≈ 1000 Geld genügen); «Karge Heimat» braucht eine eigene Karten-Regel. Erst nach Playtest des Schuldbriefs |
| S: nur Inselproben ohne Tagesinsel und Szenario                        | kleinster Kern                      | billiger, aber ohne Rückkehrgrund (Tagesinsel) und ohne Antwort auf R722 (Szenario)                                                                                                                     |

**Prüfling «Schuldbrief» statt «Karge Heimat»:** Der Auftrag lautet «Geld wieder knapp». Der Schuldbrief trifft die Kasse
direkt und braucht nur zwei neue Regeln (Zins, Tilgen). «Karge Heimat» macht Stein knapp und Geld nur mittelbar
(Zukauf 15 je Stein, `src/sim/defs/goods.ts:15`).

## 4 Ablauf für den Spieler

### 4.1 Einstieg

- **Startkarte** (`src/ui/startCard.ts`): neben «Fortsetzen», «Laden» und «Neue Insel» ein vierter Knopf **«Inselproben»**.
  Darunter eine Zeile «Tagesinsel {TT.MM.} · {Ziel} · Bestzeit {mm:ss | –}».
- **Menü** (`src/ui/menu.ts`): unter «Neue Insel» ein Knopf **«Inselproben …»** mit gleicher Wirkung.
- Beide öffnen die **Proben-Karte** (Modal, desktop-first ab 1280 px, Card-UI) mit drei Abschnitten:
  1. **Tagesinsel:** Datum, Kartennummer, Ziel und Krisen von heute, Bestzeit heute und Zahl der Versuche; darunter die Liste
     der letzten 14 Tage (Datum, Ziel, Bestzeit oder «–»).
  2. **Proben:** fünf Zeilen (Name, Karte, Ziel, Krisen, Bestzeit, Rang 1–5 als Mini-Liste beim Aufklappen).
  3. **Szenarien:** «Schuldbrief» mit Lagetext, Frist, Stand «offen | bestanden {mm:ss} | verloren».
- Jede Zeile hat «Starten». Der Start fragt wie «Neue Insel» nach Bestätigung, wenn eine Partie mit Fortschritt läuft
  (`newIslandPrompt`, `src/ui/menu.ts:24`), weil der Autosave überschrieben wird.

### 4.2 Während der Probe

- **Kopfzeilen-Chip** «Probe 3 · 12:40» (Tagesinsel: «Tagesinsel · 12:40»; Szenario: «Schuldbrief · 12:40 · Frist 30:00»).
  Klick öffnet eine kleine Karte: Ziel mit Fortschritt (z. B. «Bürger 34 / 50»), Bestzeit, Krisenstufe.
- **Szenario Schuldbrief** zusätzlich: Chip «Schuld 3000» mit Karte «Schuld 3000 · Zins 90/min · Tilgen 500 · Tilgen (alles,
  was die Kasse trägt)». In der Bilanz eine eigene Zeile «Zins».
- Alles andere ist das Grundspiel. Die Uhr ist `world.tick` ab Partiestart; die Anzeige rechnet 600 Ticks = 1 min
  (`TICK_MS` 100, `src/sim/defs/timing.ts:2`), ab 60 min als «h:mm:ss».

### 4.3 Ende

- **Bestanden:** Ergebnis-Karte «Probe bestanden · 38:12», darunter «Bestzeit 41:50 → 38:12» (oder «erste Zeit»), Rang in den
  besten 5, im Szenario zusätzlich «Zins gezahlt 1200» (Beispiel).
- **Verloren** (nur Szenario, Frist verstrichen): Karte «Schuldbrief verloren · Schuld offen 1500» (Beispiel).
- Knöpfe: **«Ergebnis kopieren»** (Teilen-Text §6.3), **«Nochmal»** (dieselbe Probe neu, mit Bestätigung), **«Weiterspielen»**
  (freies Spiel, Chip zeigt danach «Probe 3 · bestanden 38:12»).
- **Abbruch:** «Neue Insel», eine andere Probe oder Laden eines anderen Stands. Kein Eintrag, keine Strafe.

## 5 Regeln

### 5.1 Rahmen (für alle drei Arten)

- **Def-Tabelle** `src/sim/defs/challenges.ts` (neu). Code-Name `challenge`, um Verwechslung mit der Auflage (`trial`,
  `src/sim/defs/trials.ts`) und den Dev-Sonden (`src/ui/devProbes.ts`) zu vermeiden; im Spiel heisst es «Probe».
- **Felder einer Probe-Def:** `id`, `name`, `seed`, `crisisLevel` (`off | mild | normal`, `src/sim/defs/crises.ts:4-8`), `goal`,
  optional `scenario` (§5.4). Freischaltung immer stufenweise (A6).
- **Ziel-Arten** (vorhandene Flaggen, `src/sim/tick.ts:21-29`, `src/sim/monument.ts:130`):

| `goal`      | Bedingung                                          | Flagge         | Text im Spiel  |
| ----------- | -------------------------------------------------- | -------------- | -------------- |
| `citizens`  | 50 Bürger (`WIN_CITIZENS`, `tiers.ts:53`)          | `won`          | «50 Bürger»    |
| `merchants` | 60 Kaufleute (`WIN_MERCHANTS`, `tiers.ts:55`)      | `wonMerchants` | «Handelsstadt» |
| `spice`     | 80 Kaufleute 600 Ticks gehalten (`tiers.ts:57-58`) | `wonSpice`     | «Gewürzstadt»  |
| `monument`  | Denkmal fertig                                     | `monumentDone` | «Denkmal»      |

- **Start:** `createWorld(def.seed, { crisisLevel: def.crisisLevel, unlockAll: false })` plus `challenge`-Zustand (§7). Die
  Szenario-Startwerte (Kasse, Schuld) setzt dieselbe Startfunktion; `createWorld` ohne Probe bleibt unverändert.
- **Bestanden:** im ersten Tick, nach dem die Ziel-Bedingung gilt. Probe und Tagesinsel lesen die einmaligen Flaggen. Das
  Szenario prüft **den aktuellen Stand**: jetzt ≥ 50 Bürger und Schuld = 0 (sonst reicht Abriss nach Ziel 1, §5.4).
  Ergebnis `result = { outcome: 'passed', tick: world.tick }` (Tickwert nach `step`, §10). Die Prüfung läuft in einem eigenen Schritt `tickChallenge` als letzter Aufruf von `step`, hinter `checkWin`
  (`tick.ts:21-29`) und `tickUnlocks`.
- **Verloren:** nur mit Frist (Szenario). Reihenfolge im selben Tick: erst Bestehen prüfen, dann Frist. Gilt nach der
  Bestehen-Prüfung `world.tick >= deadlineTicks` ohne `result`, folgt `result = { outcome: 'failed', tick: world.tick }`.
  Wer genau im Frist-Tick besteht, hat bestanden.
- **Werte im laufenden Stand:** Frist, Zins, Schritt und Erstattung kommen live aus den Defs, wie alle Spielwerte; nur
  `goal`, `debt` und `interestPaid` stehen im Stand (§7). Ändert ein Ruling die Werte, steigt `CHALLENGE_REV` (§6.2).
- **Nach `result`:** keine weitere Wertung, keine Szenario-Regel mehr (A4).

### 5.2 Inselproben (I-190)

| Nr. | Name (Vorschlag) | Karte | Ziel        | Krisen | Absicht                                       |
| --- | ---------------- | ----- | ----------- | ------ | --------------------------------------------- |
| 1   | «Erste Ernte»    | 3     | `citizens`  | aus    | Einstieg; Controller-Referenz 11:15 (i144:84) |
| 2   | «Unruhige Küste» | 21    | `citizens`  | normal | Ziel 1 unter Krisen                           |
| 3   | «Handelsstadt»   | 58    | `merchants` | mild   | Ziel 2, mittlere Partie                       |
| 4   | «Gewürzstadt»    | 345   | `spice`     | mild   | Ziel 3, Schiffe und Fremdinseln               |
| 5   | «Feuerschale»    | 777   | `monument`  | normal | lange Probe, Denkmal                          |

- **Karten-Nummern sind Vorschläge.** Abnahme (§10, AK-IP-03): `generateMap(seed).seedUsed === seed` und eine Prüfung im
  Browser, dass die Karte spielbar wirkt. Fällt eine Nummer durch, nimmt die Umsetzung die nächste Zahl, für die beides gilt,
  und trägt sie in die Def ein (Entscheid der Umsetzung, im Bericht nennen).
- Krisen folgen dem Seed (`rollCrisis`, `src/sim/crises.ts:46-52`): gleiche Probe, gleiche Krisenzeitpunkte und -arten für
  alle; die Ziele der Brände hängen vom Bau des Spielers ab (gewollt).

### 5.3 Tagesinsel (I-191)

- **Kartennummer** = Datum als Zahl `JJJJ·10000 + MM·100 + TT` in **Ortszeit beim Start** (z. B. 20261023). Die UI liest das
  Datum und reicht die Zahl an die Sim; die Sim kennt keine Uhrzeit (ADR-002, deterministisch).
- **Ziel und Krisen** aus dem Wochentag, den die Sim rein aus der Zahl rechnet (keine `Date`-Abhängigkeit in `src/sim/`):

| Wochentag  | Ziel        | Krisen | Absicht                      |
| ---------- | ----------- | ------ | ---------------------------- |
| Montag     | `citizens`  | mild   | kurzer Wochenstart           |
| Dienstag   | `citizens`  | normal |                              |
| Mittwoch   | `citizens`  | aus    | ruhiger Tag, reine Bauzeit   |
| Donnerstag | `citizens`  | normal |                              |
| Freitag    | `citizens`  | mild   |                              |
| Samstag    | `merchants` | mild   | längere Partie am Wochenende |
| Sonntag    | `merchants` | normal |                              |

- **Mitternacht:** Die Partie behält die Karte des Starts (`challenge.date`). Die Ablage bucht die Zeit auf dieses Datum.
- **Versuche:** beliebig viele, aber **der erste bestandene Lauf des Tages ist der Tageswert** (Konvention der
  Tages-Herausforderungen, Recherche §16 F1). Spätere Läufe sind «Übung» mit eigener Bestzeit. Ein Abbruch verbraucht nichts.
  Die Ablage zählt Starts je Tag (beim Start, nicht beim Laden). Der Teilen-Text nennt den Tageswert. Verpasste Tage
  bestrafen nicht (keine Serie mit Verlust).
- **Grosse Zahlen:** Heute liegen Kartennummern bei 0 … 99 999 (`src/ui/app.ts:326`). Die Tageszahl ist achtstellig; die
  Kartenerzeugung muss dafür gültig bleiben (AK-IP-09). Weicht `seedUsed` ab (`src/sim/mapgen.ts:186`, `seed + i`), ist das
  gewollt: Es ist für alle gleich. Das Menü zeigt `world.seed` (die genutzte Nummer), der Teilen-Text das Datum.
- **«Nochmal»** bei der Tagesinsel startet die Karte von `challenge.date`, auch nach Mitternacht; die Zeit zählt als Übung
  jenes Tages, solange er in der 14-Tage-Liste steht, sonst wird sie nicht gebucht.

### 5.4 Szenario «Schuldbrief» (I-192, Prüfling)

_Werte sind Vorschlag bis AK-IP-14 grün ist (F7)._

**Lage:** «Die Krone hat dir die Insel auf Pfand überlassen. Begleiche die Schuld und bau eine Stadt mit 50 Bürgern, bevor
die Frist abläuft.»

| Wert             | Vorschlag               | Einheit        | Herleitung                                   |
| ---------------- | ----------------------- | -------------- | -------------------------------------------- |
| Karte            | 3                       | Seed           | gemessene Kurve                              |
| Krisen           | aus                     | –              | wie Messung                                  |
| Startkasse `K0`  | 5000                    | Geld           | Anhang 01 a (wie Grundspiel, `goods.ts:85`)  |
| Startschuld `S0` | 3000                    | Geld           | Anhang 01 a, g                               |
| Zins `z`         | 5                       | ‰ je 100 Ticks | Anhang 01 a, c (15 je Takt, 90/min bei 3000) |
| Tilgungsschritt  | 500                     | Geld           | Bedienung                                    |
| Frist `T`        | 18 000                  | Ticks (30:00)  | Anhang 01 a, b (2,07 × t_ref)                |
| Ziel             | `citizens` und Schuld 0 | –              | –                                            |

- **Zins:** in jedem Tick mit `world.tick > 0` und `world.tick % 100 === 0` (Länge `UPKEEP_INTERVAL`,
  `src/sim/defs/timing.ts:4`; erster Zins bei Tick 100) zieht `tickChallenge` `ceil(Schuld × z / 1000)` von der Kasse ab und
  addiert ihn auf `interestPaid`. Der Unterhalt läuft unverändert über `upkeepCarry` (`economy.ts:72-77`); kein neues
  `stats`-Feld, die Bilanzzeile «Zins» liest `debt` und die Def. Zins fällt vor der Frist-Prüfung desselben Ticks. Die Kasse darf negativ werden; dann gelten die bestehenden Sperren (Bauen `src/sim/economy.ts:29`, Zukauf
  `src/sim/trade.ts:122`). Kein Zins auf eine Schuld von 0.
- **Tilgen:** Sim-Aktion `repayDebt(world, amount)` → `{ ok, reason }`: `amount` ist 500 oder der Rest der Schuld, wenn er
  kleiner ist; Gründe «Kein Schuldbrief», «Zu wenig Geld» (Kasse < Betrag), «Schuld beglichen», «Ungültiger Betrag». Die UI
  bietet zusätzlich «Tilgen (alles)»: grösstes Vielfaches von 500, das die Kasse trägt, oder der Rest.
- **Keine Abriss-Erstattung bei offener Schuld** (`refundPct` 0, Erzählung: «Was auf Pfand steht, gehört der Krone»): weder
  Geld noch Güter, auch nicht für Strassen (sonst Umgehung über die Güterrückgabe). Eingriff ist grösser als eine Zeile:
  `refundCost` (`src/sim/economy.ts:43`) ist rein und kennt die Welt nicht; `grantRefund`, `effectiveRefund`
  (`src/sim/queries.ts:207`) und die Anzeigen (`src/ui/inspect.ts:182`, Hinweise) müssen 0 zeigen. Sonst
  bringt Abriss nach Ziel 1 bis ≈ 6750 Erstattung (50 %, `src/sim/economy.ts:45`) und das Szenario fällt auf 11,3 min, unter
  jede ehrliche Strategie (Anhang 01 §f). Preis: Ein Fehlspieler verliert den Ausweg «Abriss»; ihm bleibt die Frist, danach
  freies Spiel. Bei Schuld 0 gilt wieder die Grundregel.
- **Entscheidung:** wann tilgen. Jede getilgte Münze spart Zins, fehlt aber beim Ausbau, der Steuer bringt. Die Rechnung
  zeigt, dass weder «sofort» noch «erst am Ende» dominiert (Anhang 01 §d):

| Strategie                              | bestanden | Gesamtzins (S) |
| -------------------------------------- | --------- | -------------- |
| gemischt (tilgen ab 53–70 % Endausbau) | 14,5 min  | ≈ 1200         |
| erst Endausbau, dann alles tilgen      | 16,7 min  | ≈ 1500         |
| sofort tilgen                          | 21,3 min  | –              |
| ohne Schuld (Vergleich, Probe 1)       | 11,3 min  | 0              |

- **Ehrliche Grenze der Wahl:** Bis ≈ 45 % Endausbau ist Bauen Pflicht; die Wahl liegt im Fenster 45–94 % und ist ≈ 2 min
  wert. Das Optimum ist flach (53–70 % liegen ≤ 0,3 min auseinander). Für eine Bestzeit-Probe genügt das; mehr Spreizung
  bringt S0 3750 (Anhang 01 §g, Rang bleibt), erst nach Playtest.
- **Geld bindet bis zum Ende:** Die Kasse liegt im Modell in jedem Takt bis zum Bestehen unter 650 (nächster Bau oder
  Tilgungsschritt plus Reserve, Anhang 01 §e). Der Überschuss ab min 14 aus dem Grundspiel tritt nicht ein, weil das Bestehen
  an der Schuld hängt.
- **Tiefpunkte:** z = 5 ‰ lässt die gemessenen Kassentiefs (min 2, 7, 9) im Plus; z nicht über 5 ‰ ohne neue Rechnung
  (Anhang 01 §c). Eine Fehlinvestition von ≈ 2000 in Minute 3 macht das Szenario unlösbar (Anhang 01 §f); zulässig, weil
  danach freies Spiel folgt.
- **Kein Bankrott:** Eine negative Kasse beendet das Szenario nie; nur die Frist entscheidet. Ein hartes Ende bei kurzzeitig
  negativer Kasse gilt bei Spielern als Falle, wenn Einnahmen schubweise kommen (Recherche §16 F2); bei uns kommen Aufträge
  und Schiffsverkäufe schubweise.
- **Nach `result`:** Zins stoppt; eine offene Schuld bleibt als Anzeige stehen, Tilgen liefert «Schuldbrief beendet».
- **Abgrenzung zu I-094 (N-101):** Das verworfene Darlehen war ein Dauerangebot mit Pflichtzug vor dem Bürger-Ausbau und
  kippte bei kleinen Zinsänderungen (20 oder 30 % Aufschlag: +3277 gegen −27 761). Hier gibt es keine Wahl «ob», nur
  «wann». Bei z ± 50 % und S0 ± 25 % bleibt die Rangfolge in 9 von 9 Fällen, die beste Zeit schwankt bei z allein um −6 % /
  +9 %, alle Zeiten ≤ 27,5 min < Frist (Anhang 01 §g). Der Pflichtzug-Mangel besteht nur bis ≈ 45 % Endausbau fort.
- **Werte in den Defs:** Block `SCENARIOS.debt` in `src/sim/defs/challenges.ts` (Anhang 01 §h nennt eine eigene Datei
  `scenarios.ts`; eine Datei für den ganzen Modus ist einfacher, Entscheid der Umsetzung): `seed` 3, `crisisLevel` `off`,
  `startMoney` 5000, `debt` 3000, `interestPermille` 5, `deadlineTicks` 18 000, `repayStep` 500, `refundPct` 0.

## 6 Wertung und Ablage der Bestzeiten

### 6.1 Wertung

- Wertung = `result.tick` (kleiner ist besser). Gleichstand: die ältere Zeit bleibt vorn.
- Verlorene Szenarien zählen als Versuch, nicht als Zeit.

### 6.2 Ablage `inselreich.proben` (neben dem Spielstand, wie `inselreich.settings`, `src/ui/settings.ts:46`)

```text
{ v: 1, rev: CHALLENGE_REV,
  probes:   { [id]: [{ ticks, at }] },          // beste 5, aufsteigend
  daily:    [{ date, goal, first: ticks|null, best: ticks|null, tries }],   // letzte 14 Tage, neueste zuerst
  scenarios:{ [id]: { best: ticks|null, tries } } }
```

- `at` = Datum als Zahl (nur Anzeige). Grenzen: 5 Einträge je Probe, 14 Tage; ältere fallen beim Schreiben heraus.
- **Kaputt oder fremd** (kein JSON, `v` unbekannt, falsche Typen): verwerfen, einmaliger Hinweis «Bestzeiten
  zurückgesetzt», kein Absturz. `localStorage` gesperrt: Modus spielbar, Hinweis «Bestzeiten werden nicht gespeichert».
- **Fassung `rev`:** `CHALLENGE_REV` in `src/sim/defs/challenges.ts`. Ändert ein Ruling Spielwerte so, dass Zeiten nicht mehr
  vergleichbar sind, erhöht der Plan die Zahl; Einträge mit anderem `rev` gelten als «ältere Fassung», werden einmalig
  gemeldet und verworfen. Wächter: Der Balancing-Test pinnt den Controller-Sieg (Tick 6750, Probe 1); bricht er, ist das
  der Anlass zu prüfen.
- Die Ablage schreibt nur die UI (`src/ui/`), beim Start (Versuchszähler) und beim **Übergang** `result` null → gesetzt,
  den sie im laufenden Spiel beobachtet. Nach dem Laden gilt das geladene `result` als Ausgangslage; ein Stand mit gesetztem
  `result` schreibt nie erneut. Die Sim kennt die Ablage nicht.

### 6.3 Teilen-Text (Knopf «Ergebnis kopieren», `navigator.clipboard.writeText`, sonst markiertes Textfeld)

- Probe: `Inselreich · Probe 3 «Handelsstadt» · 38:12 · Krisen mild`
- Tagesinsel: `Inselreich · Tagesinsel 23.10.2026 · 50 Bürger · 31:40` (Tageswert; ist er noch offen, die Übungszeit mit
  dem Zusatz `· Übung`)
- Szenario: `Inselreich · Schuldbrief · bestanden 24:10`
- Ohne Spoiler (keine Bauliste). Die Kartennummer steckt im Datum bzw. in der Probe-Nummer.

## 7 Save-Folgen

- **Ja, ein Save-Sprung, versionsneutral:** Version «`main` beim Merge + 1» (R674, R874 E-A; Reihenfolge Stadtplanung →
  Inselproben → Seerecht → Stadtrecht), Konstante `SAVE_V_CHALLENGE`. Neues letztes Weltfeld:

```text
challenge: null | {
  kind: 'probe' | 'daily' | 'scenario',
  id: string,            // Probe- oder Szenario-Id; 'daily' bei der Tagesinsel
  date: number | null,   // JJJJMMTT nur bei 'daily'
  goal: 'citizens' | 'merchants' | 'spice' | 'monument',
  debt: number,          // offene Schuld, 0 ausser im Schuldbrief
  interestPaid: number,  // Summe Zins, 0 ausser im Schuldbrief
  result: null | { outcome: 'passed' | 'failed', tick: number }
}
```

- `goal` wird gespeichert, obwohl es bei Probe und Tagesinsel aus Def bzw. Datum ableitbar ist: Ein geänderter Wochenplan
  ändert so keinen laufenden Stand.
- **Migration** (Vorgängerversion → `SAVE_V_CHALLENGE`) wirft nie, setzt `challenge: null` (R711 R-4).
- **Ladeprüfung:** `kind` bekannt; `id` in der Def-Tabelle (bei `daily` genau `'daily'`); `date` gültig genau bei `daily`;
  `debt`, `interestPaid` ganzzahlig ≥ 0, `debt > 0` nur bei `scenario`; `result.tick` ganzzahlig 0 … `world.tick`. Sonst
  «Beschädigter Spielstand». `SAVE_VERSION + 1`: «Unbekannte Version». Nie ein Absturz.
- **Hash-Pins** älterer Läufe bleiben gültig über einen Rückfalt-Helfer (`foldBackChallenge`, entfernt nur `challenge`; wie `foldBackToV11`, arc42 Persistenz), der mit den Helfern anderer Specs in beliebiger Reihenfolge zusammenarbeitet (AK-IP-11).
- **Autosave und Laden:** Eine Probe-Partie speichert und lädt wie jede Partie; der Chip läuft nach dem Laden weiter. Ein
  älterer Stand setzt die Uhr ehrlich zurück.

## 8 Determinismus

- Gleiche Probe-Def bzw. gleiches Datum → gleiche Karte (`seedUsed`), gleiche Krisenfolge, gleiche Aufträge (alle aus dem
  Seed, ADR-010). Zwei Läufe mit gleicher Aktionsfolge liefern gleiche Welt-Hashes, auch im Schuldbrief (Zins ist ganzzahlig,
  ohne Zufall).
- Die Tagesinsel ist für alle Spieler mit demselben Ortsdatum gleich; zwischen Zeitzonen kann das Datum am Start abweichen
  (der Teilen-Text nennt es).
- Die Sim rechnet Wochentag und Ziel nur aus der Zahl; die einzige Uhrzeit-Quelle ist die UI beim Start.

## 9 Abgrenzung

- **Grundspiel bitgleich:** `createWorld` ohne Probe setzt `challenge: null`; der Tick tut dann nichts Neues. Balancing-Tests
  unverändert grün; der Controller startet nie eine Probe.
- **Keine Meta-Boni** (A5): keine Freischaltung, kein Startbonus, kein Geld aus Bestzeiten.
- **Auflagen** (I-132, `trial`): unabhängig. Nach einer Denkmal-Probe kann der Spieler im freien Spiel die Meisterprüfung
  starten; sie ist nicht Teil der Wertung.
- **Andockstelle Ehrenbuch (I-186, parallel):** Das Ergebnis (`kind`, `id`, `result`) ist das Ereignis, an das das Ehrenbuch
  ein Stück «Probe bestanden» oder «Schuldbrief bestanden» hängen kann. Hier nicht festgelegt.
- **Andockstelle WIRTSCHAFT-TIEFE (parallel):** Kommt eine Geldsenke ins Grundspiel (z. B. V4 Stadtrecht oder E1 Wartung),
  gilt sie im Schuldbrief mit; dessen Werte müssen dann neu gerechnet werden und `CHALLENGE_REV` steigt. Der Schuldbrief
  bleibt eine Szenario-Regel und ersetzt keine Grundspiel-Senke.
- **Erweiterung 1** wird nicht berührt. Neue Ziele (z. B. Ziel 4 «Seestadt») wären später eine weitere `goal`-Art.

## 10 Abnahmekriterien

Kennungen **`AK-IP-nn`** (R874; `AK-IP-01 … -23` = bisherige Nummern 1–23, `AK-IP-24 …` neu). Wortlaut, Strategien und
Rückverfolgung zu den Gate-Auflagen: [anhang-02-abnahmekriterien.md](2026-10-23-modus-inselproben-design/anhang-02-abnahmekriterien.md).

**Tick-Konvention (verbindlich):** Jeder Tickwert ist `world.tick` **nach** `step` (das Inkrement läuft zuerst,
`tick.ts:40`). `tickChallenge` ist der **letzte** Aufruf in `step`, hinter `checkWin` und `tickUnlocks`; ohne Probe kehrt
er sofort zurück (Bitgleichheit). Reihenfolge darin: Zins → Bestehen → Frist. Grenzen werden als `t − 1 / t / t + 1`
geprüft (Frist `T`, Zins Tick 99/100/101).

| Prüfweg                                       | Kennungen                                                                                                                                                                                                                                                                                                                       |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vitest sim `tests/sim/challenge.test.ts`      | 01 Grundspiel bitgleich · 02 Start · 03 Karten · 04 Bestanden je Ziel · 05 Schuldbrief-Regeln · 06 Frist · 07 Zins · 08 `repayDebt` · 09 Tagesinsel und Kalender · 10 Determinismus · 11 Save (versionsneutral) · 12 Werte nur in Defs · 13 Balancing grün · 30 Speichern/Laden im Schuldbrief · 31 Reihenfolge `tickChallenge` |
| Vitest sim, Controller-Läufe (eigene Dateien) | 14 Lösbarkeit und Wahl Schuldbrief (Referenz Ref, Gegenstrategien G1–G3) · 24 Lösbarkeit Proben 2–5 (Seeds 21, 58, 345, 777)                                                                                                                                                                                                    |
| Vitest ui `tests/ui/challenge.test.ts`        | 15 `formatClock` · 16 Ablage · 17 `shareText` · 18 `todayNumber` · 25 gesperrtes `localStorage` · 26 Laden zählt nicht · 27 «Nochmal» nach Mitternacht · 28 «Alles frei» ignoriert · 29 Abbruch                                                                                                                                 |
| Browser 1280 px (`qa-playtester`)             | 19 Startkarte · 20 Uhr · 21 Ergebnis-Karte (Dev-Spielstand) · 22 Schuldbrief-Bedienung · 23 kaputte Ablage                                                                                                                                                                                                                      |

- **AK-IP-11 (Save):** gegen `SAVE_VERSION + 1` («Unbekannte Version»); die Migration läuft von der Vorgängerversion zur
  Version «`main` beim Merge + 1» und setzt `challenge: null`. Keine feste Nummer in AK oder Tests.
- **AK-IP-14:** Referenz Ref (tilgen ab 63 % Endausbau) besteht vor Tick 14 400; Rang Ref < G1 (erst Endausbau) < G2
  (sofort tilgen); G3 (Abriss) nicht schneller. **Die Werte F7 gelten erst nach grünem Lauf als Ruling.**
- **AK-IP-24:** je Probe 2–5 ein Controller-Lauf erreicht das Ziel; sonst Fallback Seed-Wechsel (§5.2), dann Krisenstufe tiefer.

## 11 Randfälle

- **Start kurz vor Mitternacht:** Karte und Ablage-Datum des Starts (§5.3).
- **Laden eines Probe-Stands aus der Ladeliste:** Probe läuft weiter; Versuchszähler steigt nicht (AK-IP-26).
- **Laden eines älteren Stands derselben Probe nach dem Bestehen:** neues Ergebnis möglich; es zählt wie ein weiterer Lauf.
  Spielzeit bleibt ehrlich, weil sie `world.tick` ist (Routenwissen ist gewollt, wie bei Bestzeit-Läufen üblich).
- **Ziel vor der ersten Minute** (unmöglich nach Defs): keine Sonderregel nötig.
- **Bevölkerung sinkt nach dem Ziel:** bestanden bleibt (Flaggen sind einmalig, `tick.ts:21`).
- **Schuldbrief, Kasse negativ durch Zins:** Bauen und Zukauf gesperrt wie im Grundspiel; Ausweg über Verkauf, Aufträge,
  Steuer «hoch» (schadet, Anhang 01 §f). Abriss erstattet bei offener Schuld nichts (§5.4). Eine Zinsspirale droht nur bei
  Einkommen unter 90/min, also in den ersten ≈ 2 min oder nach Totalverlust (Anhang 01 §f).
- **Abriss zum Tilgen:** ohne Wirkung, weil die Erstattung bei offener Schuld 0 ist (§5.4).
- **Startlager verkaufen:** bringt ≈ 510 (ein Schritt) und kostet ≈ 1510 Wiederbeschaffung (Anhang 01 §f); keine Regel nötig.
- **Tagesinsel-Datum ungültig** (manipulierte Uhr): Sim liefert `ok: false`, UI meldet «Tagesinsel nicht verfügbar».
- **Defs ändern sich zwischen Versionen:** `rev` (§6.2); ein laufender Stand behält sein gespeichertes `goal`.
- **Probe mit «Alles frei» in den Einstellungen:** wird ignoriert (A6); der Chip-Text nennt «stufenweise».

## 12 Etappen (Paketzuschnitt, Plan durch `lead-tech`)

| Etappe | Inhalt                                                                                                                                                                                          | AK                      | Grösse |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | ------ |
| P1     | Rahmen: Defs `challenges.ts` (5 Proben, Wochenplan, Schuldbrief-Werte, `CHALLENGE_REV`), Weltfeld vollständig inkl. `debt`/`interestPaid`, Save-Sprung (versionsneutral), Start, Ziel-Erkennung | 01–04, 10–13, 24, 30–31 | M      |
| P2     | UI Proben: Startkarte, Proben-Karte, Chip mit Uhr, Ergebnis-Karte, Ablage, Teilen-Text, «Nochmal»                                                                                               | 15–17, 19–21, 23, 25–29 | M      |
| P3     | Tagesinsel: `dailyDef`, `todayNumber`, Tagesliste                                                                                                                                               | 09, 18                  | S      |
| P4     | Szenario Schuldbrief: Zins, `repayDebt`, Frist, Chip, Bilanzzeile, Lösbarkeits-Lauf                                                                                                             | 05–08, 14, 22           | M      |

- Reihenfolge P1 → P2 → (P3 ∥ P4). Ein Save-Sprung für alles, weil P1 das ganze Feld anlegt. Kommen P3/P4 in ein späteres
  Release, braucht es keinen weiteren Sprung.
- Doku je Etappe: README Spielanleitung (Abschnitt «Inselproben»), arc42 Persistenz und Bausteine, `docs/spielwerte.md`.

## 13 Nicht dazugehört

Keine globale Rangliste und kein Server; keine Meta-Boni, Freischaltungen oder Prestige über Partien; keine Szenarien
«Karge Heimat» und «Sturmjahr» in diesem Schnitt; keine Meisterprüfung als Proben-Ziel; keine Zwischenzeiten (Splits) und
kein «Geist»-Vergleich; keine Medaillen oder Richtzeiten; keine Serie (Streak) mit Verlust; kein Darlehen als Angebot
(N-101); kein Wochen- oder Monatsmodus; keine eigene Grafik oder Musik (bestehende Karten, Meldungen und Glocke); keine
Änderung an «Neue Insel», an Spielwerten des Grundspiels oder am Balancing-Test.

## 14 Offene Fragen an L0 (mit Empfehlung)

| Nr. | Frage                                                                                                                                       | Empfehlung                                                                      | Entscheider |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ----------- |
| F1  | Berührt der Schuldbrief N-101 (Nutzer verwarf Darlehen)?                                                                                    | nein; Kenntnis-Zeile im Ruling genügt, kein Vorbehalt (A7, §5.4)                | L0          |
| F2  | Startkarte mit viertem Knopf «Inselproben» oder nur Menü?                                                                                   | Startkarte: die Tageszeile ist der Rückkehrgrund                                | L0          |
| F3  | Versuche je Tag beliebig oder nur einer?                                                                                                    | beliebig; der erste bestandene Lauf ist der Tageswert, Rest Übung (§5.3)        | L0          |
| F7  | Schuldbrief-Werte K0 5000, S0 3000, z 5 ‰, T 18 000, Schritt 500, keine Pflichtrate, Erstattung 0 bei Schuld, Bestehen nach aktuellem Stand | Ruling erst **nach grünem AK-IP-14**; bis dahin Vorschlag, danach nachjustieren | L0          |
| F6  | Richtzeit je Probe (Studio-Zeit aus einem Controller-Lauf, wie eine «Autorenzeit»)?                                                         | später; heute gibt es nur für Probe 1 einen Lauf (11:15). Nach Playtest         | L0          |
| F4  | `CHALLENGE_REV` von Hand pflegen?                                                                                                           | ja, Anlass: gebrochener Balancing-Pin (§6.2)                                    | L0          |
| F5  | Reihenfolge zu Ehrenbuch und WIRTSCHAFT-TIEFE                                                                                               | Modus nach dem Ehrenbuch; Schuldbrief-Werte nach WIRTSCHAFT-TIEFE prüfen        | L0          |

Kein Nutzer-Vorbehalt nach Verfassung §5.3: Kernsäule, Genre und Titel bleiben.

## 15 Selbstprüfung Gate Brainstorming

| Prüffrage                        | Urteil                                                                                                       |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Säule und Schaden bei Misslingen | alle Säulen, Schuldbrief gezielt Wirtschaft; misslingt der Modus, bleibt das Grundspiel bitgleich            |
| Echte Wahl                       | Probe: Bauweg zur Bestzeit; Schuldbrief: wann tilgen (Anhang 01 §d); Tagesinsel: neue Karte, neue Route      |
| Rückkopplungen                   | Zins ist eine gewollte Bremse nur im Szenario; keine Rückwirkung über Partien (A5)                           |
| Entartete Strategien             | «Alles frei» (A6), Abriss zum Tilgen, Zinsspirale, Laden zum Zurücksetzen (§11)                              |
| Einfachere Variante              | S (nur Proben) wäre billiger, verliert aber Rückkehrgrund und R722-Antwort; R ist der kleinste volle Schnitt |

Urteil: **OK** als Grundlage für das Gate Spec. **BEDENKEN** nur zum Schuldbrief: Das Modell glättet Klumpenkäufe
(absolute Zeiten ± 1 min, Anhang 01 §0), und die Wahl ist mit ≈ 2 min Spreizung schmal. Beides prüft der Lösbarkeits-Lauf
(AK-IP-14) und ein Playtest; Stellschraube S0 3750 ist gerechnet.

## 16 Nachrecherche (Mechaniken, keine Inhalte; (S) = nur Suchtreffer)

- **F1 Tages-Herausforderung:** In einem Rundenspiel zählt nur der erste Versuch je Tag («how well you can do it once»),
  Ranglisten dort sind von Betrugsvorwürfen geprägt
  ([Steam-Diskussion](https://steamcommunity.com/app/646570/discussions/0/1743357605566110144)); Nachfolger zeigt nur noch
  Freunde (S, [Patch-Notiz](https://sts2.untapped.gg/fr/patch-notes/v0.103.0?tab=notes)); Tageswechsel um Mitternacht
  Ortszeit führt bei falscher Zeitzone zu Verwirrung (S,
  [Support-Artikel](https://support.chess.com/en/articles/8708995-my-daily-amount-of-puzzles-didn-t-reset-what-s-going-on)).
- **F2 Startschuld:** Start halb mit Kredit, Zins steigt nach Insolvenz
  ([Spezifikation eines Eisenbahn-Klassikers](https://freerails.readthedocs.io/en/latest/specification_rt1.html)); hartes
  Ende bei vorübergehenden Schulden mit schubweisen Einnahmen wird als unfair empfunden (S,
  [Steam-Diskussion](https://steamcommunity.com/app/492720/discussions/0/1815422173027571288)); einmaliger Ausgleich der
  ersten Schuld als Gnade (S, [Steam-Diskussion](https://steamcommunity.com/app/1351080/discussions/0/3777993814842995018)).
- **F3 Zeitwertung:** Spielzeit statt Echtzeit, weil sie Schritte zählt und Lag ignoriert (S,
  [Forum](https://www.speedrun.com/posts/sxuuq)); Medaillen- und Autorenzeiten als Richtwert ohne Rangliste (S,
  [Blog](https://tm.mania.exchange/blogs/entry/569/what-do-you-think-medal-times)).
- Befunde zu Splits in Aufbauspielen gab es nicht; Splits bleiben Nicht-Ziel (§13).
