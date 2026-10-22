# I-153 · Seerecht, dritte Ratskarte auf Stufe 4 (Spec, Stufe voll)

Stand 2026-10-22 · Paket `SEERECHT Spec` · Prozessstufe voll · Auftrag R805 (1), vorgezogen per R809 · Designgrundlage:
[Vorschlag WIRTSCHAFT-BS-1 §2](2026-10-22-wirtschaft-bs-1-vorschlag.md) · Rechnung:
[anhang-01-rechnung.md](2026-10-22-seerecht-design/anhang-01-rechnung.md) · Baut auf
[I-112 Ratsbeschluss](2026-10-16-i112-ratsbeschluss.md) auf. Alle Zahlen sind gerechnet aus `src/sim/defs/` (main, Save
v18), nicht gemessen; Schätzungen sind markiert.

## 1 Spielerzweck (ein Satz)

Steht das erste Kaufleute-Haus, entscheidet der Spieler einmal und für die ganze Partie, ob sein Reich über die Kette
(Glasrecht), den Platz (Hofrecht) oder die Flotte (Seerecht) wächst; Seerecht ist der erste Rats-Hebel für den
Fernhandel.

Säule: Fernhandel und Versorgung der Kaufleute (Gewürz kommt nur per Schiff, `TIERS[4].needs.spice` 0,1). Wenn es
misslingt (Seerecht dominiert oder ist wirkungslos), entsteht kein Folgeschaden, aber eine Scheinwahl. Spürbar im
15-Minuten-Spiel um Minute 15 bis 17 (I-112 Anhang §6); stärker, je mehr Routen und je länger die Seewege.

## 2 Varianten und Empfehlung

| Variante                                   | Kurz                                                 | Urteil                                                      |
| ------------------------------------------ | ---------------------------------------------------- | ----------------------------------------------------------- |
| V1 Wert 9 Ticks je Seekachel               | +11 % Tempo                                          | verworfen: 7,94 je Schiff bei d 35 reicht für N 80 nicht    |
| **V2 Wert 8 Ticks je Seekachel (gewählt)** | +25 % Tempo, Restfahrzeit beim Beschluss umgerechnet | Gewinn- und Nulllage vorhanden (Anhang §2–§4)               |
| V3 Wert 6 Ticks je Seekachel               | +67 % wie Glasrecht                                  | verworfen: spart fast überall ein Schiff, verdrängt A und B |
| V4 «gilt ab nächster Abfahrt»              | ohne Umrechnung, Fahrende behalten alte Fahrzeit     | verworfen: Schiff springt auf der Linie, zwei Fahrzeiten    |

Gewählt **V2** (R805). Seerecht ist die Karte für Fernplaner und grosse Reiche, wie Hofrecht die für Platzplaner.

## 3 Regeln

### 3.1 R1 Karte (Werte in `src/sim/defs/council.ts`)

| Stufe | Seite | Name     | Hebel (wirksamer Wert, Def bleibt)                          | alt → neu | Kartentext (Zahl sichtbar)                                                                       |
| ----- | ----- | -------- | ----------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------ |
| 4     | C     | Seerecht | `seaTileTicks` (Def `SHIP_TICKS_PER_SEA_TILE`, `sea.ts:94`) | 10 → 8    | «Schiffe fahren 25 % schneller. Spart ab etwa 80 Kaufleuten ein Schiff auf langen Gewürzrouten.» |

- `COUNCIL[4]` hat die Seiten A (Glasrecht), B (Hofrecht), C (Seerecht); Stufen 2 und 3 haben nur A und B.
- `SHIP_TICKS_PER_SEA_TILE` = 10 bleibt unverändert; 8 steht nur als Hebelwert in der Rats-Tabelle.
- Hebel-Art und Typform (heute `Record<CouncilSide, CouncilDef>` je Stufe, künftig z. B. `Partial` oder eigene
  Seitenliste je Stufe) entscheidet `lead-tech`. Fundstelle: `activeLever` (`council.ts:25`) liest heute nur `'A'|'B'`.

### 3.2 R2 Ein Fahrzeit-Helfer als einziger Leseort

Ein Helfer mit Welt-Bezug (Muster `councilCycle`, R706 a) liefert:

1. wirksame Ticks je Seekachel: 8 bei `council[4] === 'C'`, sonst `SHIP_TICKS_PER_SEA_TILE` (10);
2. Fahrzeit für eine Seeweg-Länge d: wirksame Ticks × d;
3. Fahrzeit für ein Inselpaar (a, b): wie `laneTicks` (`islands.ts:75`), 0 bei a = b oder ohne Seeweg.

Namensvorschlag `seaTileTicks(world)`, `travelTicksOf(world, d)`, `laneTicksOf(world, a, b)`; Namen und Signaturen
entscheidet `lead-tech`. Alle Leser laufen darüber:

| Leser                                                   | Fundstelle                                                   | heute                       |
| ------------------------------------------------------- | ------------------------------------------------------------ | --------------------------- |
| Abfahrt `depart`                                        | `src/sim/ships.ts:142-145`                                   | `laneTicks(islands, …)`     |
| Routen-Umlauf                                           | `src/sim/routeBalance.ts:59-60`                              | 2 × `laneTicks`             |
| Schiffs-Pose, Fahrzeit-Cache                            | `src/render/shipLane.ts:20-28`, `:98`                        | Cache je `islands`-Array    |
| Inselkarte «Fahrzeit»                                   | `src/ui/islandCard.ts:75`                                    | `travelTicks(d)`, ohne Welt |
| `homeTravelTicks`                                       | `src/ui/homeTravel.ts:35`                                    | `travelTicks(lane.d)`       |
| Fernangebot «≈ … Fahrt», I-155 `farLate`, `farMark`-Tip | `src/ui/farOrder.ts` (nur UI-G): `:48`, `farLate`, `farMark` | über `homeTravelTicks`      |

Einzige Ausnahme ist die Save-Prüfung (§5, F2). `travelTicks(d)` in `islands.ts:73` bleibt als reine Def-Rechnung
(10 × d) bestehen, darf aber ausserhalb von Helfer und Save nicht mehr direkt gelesen werden.

**Render-Cache:** `ticksCache` ist je `islands`-Array verschlüsselt; das Array ändert sich beim Beschluss nicht. Nach
dem Beschluss darf der Cache keine 10er-Werte liefern. Zulässig: Schlüssel enthält die wirksamen Ticks, der Cache hält
nur die Seeweg-Länge d und multipliziert mit dem Helfer, oder er wird beim Beschluss verworfen. Wahl `lead-tech`; Prüfung
AK-SR-15.

### 3.3 R3 Umrechnung beim Beschluss

`decree(w, 4, 'C')` rechnet in derselben Aktion für jedes Schiff mit `to !== null` (auch `homing`):

`left = max(1, ceil(left × neu / alt))`, hier `ceil(left × 8 / 10)`.

- Liegende Schiffe (`to === null`) bleiben unverändert. Hafen, Ziel, Ladung, Route bleiben.
- Beispiele: 350 → 280, 7 → 6, 2 → 2, 1 → 1 (Ankunft im nächsten Tick wie geplant).
- Folge: Sim, Darstellung und Save kennen nie zwei Fahrzeiten. Die Pose `t = 1 − left / Fahrzeit` springt höchstens um
  1/(8d) zurück (Rundung durch `ceil` verlängert die Restfahrt um weniger als einen Tick), Herleitung Anhang §6.
- **Wirkung sofort in der Aktion, auch in der Pause**, nicht erst ab dem nächsten Tick. Begründung: Die übrigen Hebel
  sind abgeleitete Werte, die jeder Leser pro Tick neu holt; `left` ist dagegen gespeicherter Zustand. Bliebe die
  Umrechnung bis zum nächsten Tick liegen, sähen Render, Save-Prüfung und UI für die Dauer der Pause einen 10er-`left`
  gegen eine 8er-Fahrzeit (Sprung auf der Linie, falsche «zu spät»-Marke, `left` über der strengen Save-Grenze).
- Ein abgewiesenes `decree` rechnet nichts um.

### 3.4 R4 Ablauf sonst wie I-112

Öffnen mit dem ersten Kaufleute-Haus wie bisher; einmalig, kein Rückgängig, kein Wechsel, keine Kosten, kein Unterhalt.
Mit dem Beschluss einer Seite verfallen die übrigen Seiten der Stufe (auf Stufe 4 zwei). `decree(w, 2|3, 'C')` liefert
`{ ok: false, reason: 'Ungültige Seite' }`, die Welt bleibt unverändert; nie werfen.

## 4 Bedienung (UI, desktop-first)

- Die Rats-Karte zeigt für eine offene Stufe 4 **drei Karten nebeneinander** (A, B, C), für Stufen 2 und 3 weiter zwei.
  Die Seiten kommen aus den Defs (heute fest `['A', 'B']`, `src/ui/council.ts:34`).
- Satz unter den Karten, ein Text für alle Stufen: «Gilt für die ganze Partie, die übrigen Beschlüsse der Stufe
  verfallen.» (Def `COUNCIL_NOTE`, ersetzt «… der andere Beschluss verfällt.»; F1).
- Liste gefasster Beschlüsse: «Stufe 4: Seerecht».
- Sonst unverändert: Marke «Rat · n», Auswahl erst mit «Beschluss fassen», `Esc` schliesst.
- Doku: README-Abschnitt «Rat» und `docs/spielwerte.md` «Rat (Ratsbeschluss)» (Zeile ~399) bekommen die dritte Karte
  mit Wert 8 statt 10 und dem Vermerk «Prüfwert Erweiterung 1 (R805)».

## 5 Save-Urteil

**Kein neues Feld, Wertebereich wächst.** `CouncilSide` bekommt `'C'`; gültig nur unter Schlüssel 4.

- `isValidCouncil` (`save.ts:931-937`) und `isSide` (`council.ts:69`) erlauben `'C'` nur für Stufe 4. Ein Stand mit
  `'C'` auf 2 oder 3 wird mit dem bestehenden Hinweis abgewiesen, kein Absturz (Test, AK-SR-13).
- Alte Stände (ohne `'C'`) laden unverändert.
- **Versionsnummer (F3):** entscheidet `lead-tech` im Plan. Wenn eine Nummer, dann nie neben Stadtplanung v19
  (`feat/stadtplanung`), sondern main + 1 beim Merge nach Stadtplanung (oder gemeinsam mit Erweiterung 1); die Migration
  setzt nur das Versionsfeld.
- **Schiffsprüfung (F2 = streng):** `isValidShip` (`save.ts:707-718`) prüft heute `1 ≤ left ≤ laneTicks` (10 × d). Neu
  streng mit der wirksamen Fahrzeit aus `raw.council[4]` (8 × d bei `'C'`).
- **Plan-Hinweis Reihenfolge:** `isValidCouncil` (heute `save.ts:~984`) läuft derzeit nach den Schiffen
  (`isValidV9Fields`, `:~727`) und `isValidShip` kennt `council` nicht. Der Plan ordnet `isValidCouncil` vor die
  Schiffe oder übergibt `council` als Parameter; die Form von `raw.council` (Objekt, Länge) ist vor jedem Zugriff auf
  `[4]` zu prüfen. Eigener Test dafür: AK-SR-14 (manipulierter `council`).
- **Versionsprüfung älterer Build:** Ein Test sichert, dass ein älterer Build (Version main) einen Stand mit `'C'` über
  die Versionsnummer abweist (F3); AK-SR-12 prüft, dass die Migration nur das Versionsfeld setzt.

**Baseline:** `tests/sim/balance.test.ts` bleibt bitgleich: Der Controller beschliesst nie (`expectNoDecree`), und der
Helfer liefert ohne `'C'` den Def-Wert 10, also dieselben Fahrzeiten wie heute.

## 6 Balancing und BEDENKEN (R805)

Grundlage Anhang §1–§5. Umlauf 20 × d, mit Seerecht 16 × d; Kapazität 50 je Richtung; Bedarf 0,1 Gewürz je Kaufmann und
100 Ticks.

### 6.1 B1 «Glasrecht bei 60–120 Kaufleuten gleich gut oder besser»

**Bestätigt und bewusst angenommen.** In Gebäuden gezählt ist Glasrecht in jeder Zelle von Anhang-Tabelle b mindestens
gleich gut (1 bis 2 Hütten gespart). Seerecht gewinnt in drei Lagen, die keine andere Karte abdeckt:

1. **Gewürzstadt 80 bei d 35:** eine Route, ein Schiff statt zwei (8,93 statt 7,14 Gewürz je Schiff und 100 Ticks
   gegen Bedarf 8).
2. **Flottendeckel `SHIP_MAX` 4:** vier Schiffe bei d 30 bringen 41,7 statt 33,3 je 100 Ticks, also 5
   Schiff-Äquivalente. Ein fünftes Schiff kauft kein Geld nach, eine weitere Hütte schon.
3. **Glashütte auf der Felsbucht (Gebirge+):** Takt 25 → 4 Glas je 100 Ticks, mit Glasrecht 15 → 6,67; bei N 80 braucht
   es 2 Hütten mit und ohne Glasrecht (spart 0), Seerecht spart bei Gewürz aus Weidenau mit d 35 ein Schiff (Anhang §4,
   Schätzung des Vorschlags jetzt gerechnet bestätigt).

Nulllagen: N ≤ 60, d 30 bei N 80 (schon ohne Seerecht ein Schiff genug, 8,33 ≥ 8). Damit kein Pflichtzug, nicht
wirkungslos, Engpass nicht Geld. Prüfung: AK-SR-7 (Szenario) und AK-SR-8 (Wertewächter).

### 6.2 B2 «Stufe 4 zeigt drei Karten statt zwei»

**Gewollt:** Stufe 4 ist die Fernhandelsstufe; die Asymmetrie zeigt dem Spieler, dass hier eine neue Achse dazukommt.
Prüfung: AK-SR-19 (Helfer) und AK-SR-22, AK-SR-23 (Browser).

### 6.3 Erweiterung 1 (R805 (3))

Mehr Inseln und längere Seewege stärken Seerecht: Bei d 40 und N 150 spart es schon heute ein Schiff je Route; der
Deckel wird mit mehr Routen früher erreicht. Die Balancing-Prüfung von Erweiterung 1 rechnet Anhang-Tabelle b mit deren
Seewegen neu. Stolperdraht ist der Wertewächter AK-SR-8: Fällt er nach einer Änderung an Kapazität, Bedarf, Seerecht-Wert
oder Seewegen, ist der Seerecht-Wert neu zu prüfen (Werte-Ruling). Doku-Vermerk: AK-SR-25.

### 6.4 Risiko «Wert 8 nur per Rechnung und Wächter» (R553)

Die Wertgrenze 8 beruht auf einer Rechnung (Anhang §2–§7) und dem Wächter AK-SR-8, nicht auf mehreren unabhängigen
Läufen; ein Controller wählt Seerecht nie (`expectNoDecree`), ein Balancing-Lauf fehlt daher bewusst. **Rückfall:**
Fällt AK-SR-8 oder die Balancing-Prüfung von Erweiterung 1, gibt es ein Werte-Ruling (L0, auf Vorschlag Design); Wert 9
ist verworfen (V1), Wert 7 wird dann geprüft. Kein Blocker für Plan und Umsetzung.

## 7 Abnahmekriterien

Vitest gegen `src/sim/` (`tests/sim/council.test.ts`, erweitert):

1. **AK-SR-1 Tabelle:** `COUNCIL[4]` hat drei Einträge A, B, C; `COUNCIL[2]` und `COUNCIL[3]` je zwei (A, B). C hat Name
   «Seerecht», den Kartentext aus §3.1 wörtlich, Hebel `seaTileTicks` mit Wert 8; `SHIP_TICKS_PER_SEA_TILE` ist 10.
2. **AK-SR-2 Beschluss:** Bei `council[4] === 'open'` liefert `decree(w, 4, 'C')` `ok`, danach `council[4] === 'C'`; ein
   zweites `decree(w, 4, 'A')` liefert `ok: false` «Schon beschlossen», Wert bleibt `'C'`. Bei `council[4] === null`
   liefert `decree(w, 4, 'C')` «Beschluss nicht offen».
3. **AK-SR-3 Abweisung:** `decree(w, 2, 'C')` und `decree(w, 3, 'C')` bei offener Stufe liefern `ok: false` «Ungültige
   Seite»; die Welt ist danach JSON-gleich zu vorher. `decree(w, 4, 'D')` und `decree(w, 4, null)` ebenso; kein Aufruf
   wirft.
4. **AK-SR-4 Helfer:** Ohne Beschluss, mit `council[4] === 'A'` oder `'B'` und mit beliebigen Stufe-2/3-Beschlüssen:
   10 Ticks je Seekachel, Fahrzeit 10 × d, Inselpaar = heutiges `laneTicks`. Mit `'C'`: 8, 8 × d, Inselpaar 8 × d;
   a = b liefert 0.
5. **AK-SR-5 Umrechnung:** Vier fahrende Schiffe mit `left` 350, 7, 2, 1 haben nach `decree(w, 4, 'C')` 280, 6, 2, 1; ein
   liegendes Schiff bleibt unverändert (`to`, `left`); ein `homing`-Schiff mit `left` 100 hat 80; löst danach ein Rückruf aus (Schiff liegt im Hafen und legt über `depart`
   ab), hat es `left = 8 × d`. Hafen, Ziel, Ladung, Route bleiben. Ein abgewiesenes `decree` (Stufe 4 schon beschlossen) ändert kein `left`.
6. **AK-SR-6 Abfahrt:** Ein nach dem Beschluss ablegendes Schiff auf einem Seeweg der Länge d hat `left = 8 × d` und liegt
   nach genau 8 × d Ticks im Zielhafen; ohne Beschluss nach 10 × d.

Vitest Szenario und Wächter (`tests/sim/seerecht.test.ts`, neu):

7. **AK-SR-7 B1 Szenario (Gewinnlage):** Route Heimat ⇄ Insel mit Seeweg d = 35 (Testwelt mit gesetzter Lage; Aufbau
   wählt `lead-tech`), ein Schiff, Gewürz heimwärts, Insellager vor jeder Ankunft mit mindestens 50 Gewürz über der
   Routen-Reserve (`ROUTE_RESERVE`), Heimatlager vor jeder Ankunft höchstens `STORAGE_CAP` − 50 (z. B. geleert), damit
   voll entladen wird; gezählt wird die in der Heimat entladene Menge. Umlauf 700 Ticks ohne, 560 mit Seerecht; der Test prüft den Umlauf direkt über die Ankunfts-Ticks (erste
   Heimankunft bei Tick 700 bzw. 560, jede weitere im Abstand 700 bzw. 560; Ankunft im Zielhafen bei 350 bzw. 280),
   nicht nur über Mengen. Über 5650 Ticks ab Ablegen in der Heimat kommen ohne Seerecht 8 × 50 = 400 Gewürz an
   (7,08 je 100 Ticks, < 8), mit Seerecht 10 × 50 = 500 (8,85 je 100 Ticks, ≥ 8).
8. **AK-SR-8 B1 Wertewächter (rein über die Defs, zweiseitig):** Mit `SHIP.capacity`, `TIERS[4].needs.spice` und den
   wirksamen Ticks (Def und Hebel) gilt: `capacity × 100 / (2 × 8 × 35) ≥ spice × 80` (8,93 ≥ 8) und
   `capacity × 100 / (2 × 10 × 35) < spice × 80` (7,14 < 8); Nulllage `capacity × 100 / (2 × 10 × 30) ≥ spice × 80`
   (8,33 ≥ 8, Seerecht spart dort 0). Die Testbeschreibung nennt: «Fällt dieser Test, Seerecht-Wert neu prüfen (R805).»

Vitest weitere Sim-Leser:

9. **AK-SR-9 Routen-Bilanz** (`tests/sim/routeBalance.test.ts`): Für eine Route mit d 35 rechnet die Bilanz mit Umlauf 560
   statt 700; der Wert der Gewürzrichtung steigt entsprechend (gleiche Rundung wie heute).
10. **AK-SR-10 Determinismus** (`tests/sim/council.test.ts`): Zwei Läufe mit gleichem Seed und gleicher Aktionsfolge,
    darin `decree(w, 4, 'C')` bei fahrenden Schiffen, liefern gleiche Welt-Hashes.

Vitest Save (`tests/sim/council-save.test.ts`):

11. **AK-SR-11 Runde:** Welt mit `council[4] === 'C'` und einem nach der Umrechnung fahrenden Schiff: Speichern und Laden
    liefert eine gleiche Welt (inkl. `left`).
12. **AK-SR-12 Alter Stand:** Ein Stand ohne `'C'` (heutiger Inhalt) lädt; `council` und Schiffe sind unverändert (bei
    neuer Versionsnummer über die Migration, die nur das Versionsfeld setzt).
13. **AK-SR-13 Abweisung:** Ein Stand mit `council[2] === 'C'` oder `council[3] === 'C'` wird mit Hinweis abgewiesen, kein
    Absturz; `council[4] === 'C'` ist gültig.
14. **AK-SR-14 Schiffsprüfung (F2 = streng):** Mit `council[4] === 'C'` wird ein Schiff mit `left = 10 × d`
    abgewiesen, `left = 8 × d` angenommen; ohne `'C'` ist `10 × d` gültig. Ein Stand mit gültigem `'C'` und
    Schiff `left` zwischen 8 × d und 10 × d wird abgewiesen (alter Stand ohne Umrechnung). Zusätzlich (eigener Test,
    Reihenfolge): Ein Stand mit manipuliertem `council` (kein Objekt, falsche Länge, `'C'` auf 2/3) wird abgewiesen,
    ohne dass die Schiffsprüfung auf `raw.council[4]` zugreift und abstürzt.

Vitest Render (`tests/render/shipLane.test.ts`):

15. **AK-SR-15 Pose und Cache:** `shipPose` wird vor dem Beschluss aufgerufen (Cache gefüllt). Seeweg d = 30: Schiff mit
    `left` 150 hat vorher t = 0,5 und nachher (left 120, Fahrzeit 240) t = 0,5; Schiff mit `left` 7 springt von
    0,97667 auf 0,975, Abstand ≤ 1/(8d) = 0,00417. Ein nach dem Beschluss abgelegtes Schiff (`left` 240) hat t = 0
    (mit veraltetem 10er-Cache wäre es 0,2).

Vitest UI-Helfer:

16. **AK-SR-16 Inselkarte** (`tests/ui/islandCard.test.ts`): Für eine Insel mit d 30 zeigt die Karte «Fahrzeit 0:30» ohne
    und «Fahrzeit 0:24» mit Seerecht (`TICK_MS` 100).
17. **AK-SR-17 `homeTravelTicks`** (`tests/ui/homeTravel.test.ts`): 300 ohne, 240 mit Seerecht bei d 30.
18. **AK-SR-18 «Zu spät»** (`tests/ui/farOrder.test.ts`, nach UI-G): Fernauftrag auf eine Insel mit d 30, Rest 260 Ticks,
    Lager und rechtzeitige Fracht decken die Menge nicht. Ohne Seerecht `farLate` wahr, `farMark`-Text endet auf
    «· zu spät»; mit Seerecht `farLate` falsch, Text ohne «zu spät», Tip nennt die Fahrzeit 240 Ticks im
    `formatGameTime`-Format. Das Fernangebot zeigt «≈ … Fahrt» mit 240 Ticks.
19. **AK-SR-19 Rats-Karten** (`tests/ui/council.test.ts`): `councilCards` liefert für offene Stufe 4 drei Karten in der
    Reihenfolge Glasrecht, Hofrecht, Seerecht mit Text aus den Defs, für offene Stufe 2 oder 3 zwei; mit Stufe 3 und 4
    gleichzeitig offen beide Gruppen nach Stufe. Nach dem Beschluss steht «Stufe 4: Seerecht» in der Liste; `note`
    ist der neue Text aus §4.

Baseline:

20. **AK-SR-20 Balancing:** `tests/sim/balance.test.ts` und die übrigen `balance-*.test.ts` laufen ohne Änderung an
    Erwartungen grün und bitgleich (gleicher Sieg-Tick); `expectNoDecree` gilt weiter.
21. **AK-SR-21 Defs (Wächter-Test, `tests/sim/seerecht.test.ts`):** Ein Grep-Test liest die Quelltexte unter `src/sim`,
    `src/render`, `src/ui` (ohne `src/sim/defs/`) und weist ein Zahl-Literal 8 oder 10 als Faktor oder Divisor der
    Fahrzeit-Rechnung ab (Muster etwa `\b(8|10) \*` und `\* (8|10)\b` in Zeilen mit `Ticks`, `travel`, `lane`); ausserdem
    steht der Wert 8 in `src/sim/defs/council.ts` und 10 in `src/sim/defs/sea.ts` genau einmal. Muster und Ausnahmeliste
    wählt `lead-tech`.

Browser-Check bei 1280 px (qa-playtester, Screenshots `.studio/qa/SEERECHT/`):

22. **AK-SR-22 Drei Karten:** Stufe 4 offen: drei Karten nebeneinander, Namen und Texte voll lesbar, Zahl «25 %» und «80»
    sichtbar, kein horizontales Scrollen, Kopfzeile einzeilig. Ebenso mit Stufe 3 und 4 gleichzeitig offen (zwei plus
    drei Karten). Satz «… die übrigen Beschlüsse der Stufe verfallen.» sichtbar.
23. **AK-SR-23 Schmales Fenster:** Bei 800 px Breite öffnet die Rats-Karte ohne Absturz und Konsolenfehler (Layout darf
    umbrechen).
24. **AK-SR-24 Wirkung sichtbar:** In der Pause mit einem fahrenden Schiff Seerecht beschliessen: Schiff springt nicht
    sichtbar (Screenshot vorher/nachher), Inselkarte zeigt die kürzere Fahrzeit, Liste «Stufe 4: Seerecht»; nach dem
    Fortsetzen fährt das Schiff weiter und kommt an.

Doku (Review, `make docs-check`):

25. **AK-SR-25 Doku:** README «Rat» nennt drei Karten auf Stufe 4 mit Seerecht und Kartentext; `docs/spielwerte.md` «Rat
    (Ratsbeschluss)» hat die Zeile Seerecht (Hebel, 10 → 8, Def-Ort) mit «Prüfwert Erweiterung 1 (R805)».

## 8 Randfälle

- **Beschluss im Ankunfts-Tick** (`left` 1): bleibt 1, Ankunft im nächsten Tick wie geplant (AK-SR-5).
- **In der Pause:** erlaubt wie bei I-112; Umrechnung sofort, Pose springt höchstens 1/(8d) (AK-SR-15, AK-SR-24).
- **Ohne Schiffe:** Beschluss wirkt formal (Helfer liefert 8), nichts umzurechnen; spätere Schiffe fahren 8 × d.
- **Schiff legt im selben Tick ab:** Vor dem Tick beschlossen → `depart` liest schon 8 × d. Im vorigen Tick abgelegt
  (`left` 10 × d) → wird mit umgerechnet. Beides 8er-Fahrzeit, keine Doppelzählung.
- **Fernauftrag mit Rückruf:** Ein `homing`-Schiff wird umgerechnet; ein später ausgelöster Rückruf legt über `depart`
  mit 8 × d ab.
- **Zwei Stufen offen:** Stufe 3 zeigt zwei, Stufe 4 drei Karten; ein Beschluss auf Stufe 3 rechnet nichts um.
- **Inselvorteil:** Seerecht und Inseleigenschaften sind unabhängig (kein Inselvorteil wirkt auf die Fahrzeit).
- **`SHIP_MAX` 4:** unverändert; Seerecht hebt nur den Durchsatz je Schiff.
- **Manipulierter Stand:** `'C'` auf 2/3 abgewiesen (AK-SR-13); `left` über der Fahrzeit nach F2 (AK-SR-14).

## 9 Nicht dazugehört

Keine Änderung an Kapazität, Schiffszahl (`SHIP_MAX`), Schiffskosten, Fahrlinien, Handelspreisen; keine dritte Karte auf
Stufe 2 oder 3; keine Controller-Wahl im Balancing-Test; keine neue Grafik oder neuer Ton; kein «zurück leer»-Hinweis
(I-154-Beipack, eigenes Thema); kein Umentscheiden oder Rückgängig.

## 10 Abhängigkeiten

- **UI-HAEPPCHEN-G** (`feat/ui-haeppchen-g`): Plan und Umsetzung erst nach dem Merge. `farOfferParts`, `farLate` und
  `farMark` lesen `homeTravelTicks`; ohne G auf main fehlt dem Helfer die I-155-Lesestelle. Fehlerrichtung bei falscher
  Reihenfolge: Die Marke rechnet mit der 10er-Fahrzeit und meldet «zu spät», obwohl die Ware rechtzeitig käme.
- **Stadtplanung** (`feat/stadtplanung` Save v19, `feat/stadtplanung-ui`): Plan und Umsetzung erst nach dem Merge; beide
  Zweige ändern `src/sim/save.ts` und `tests/sim/council.test.ts`. Save-Nummer nie parallel (§5).
- **Erweiterung 1** (Nutzer-Session): Mergt sie zuerst, wird Anhang-Tabelle b mit ihren Seewegen neu gerechnet und der
  Wächter AK-SR-8 geprüft.
- **UI-HAEPPCHEN-H** (`plan/ui-haeppchen-h`): keine gemeinsamen Sim- oder Helferdateien. Mögliche Textkonflikte nur in
  `src/style.css` (Rats-Karte `.council-card` um Zeile 1456, falls die drei Karten neue Regeln brauchen) und
  `src/ui/app.ts`, falls die Rats-Karte dort verdrahtet wird; lokal per `git merge main` lösbar.
- Die Spec ist laut R809 vorgezogen. Ändern UI-G oder Stadtplanung die Lesestellen aus §3.2, wird die Spec vor dem Plan
  nachgezogen.

## 11 Offene Designfragen

- **F1 Notiz-Text (entschieden: ja, R-Gate Spec):** Empfehlung ein Text für alle Stufen («… die übrigen Beschlüsse der Stufe verfallen.»), nicht je Kartenzahl verschieden; einfacher, ein Def-Eintrag.
- **F2 Schiffsprüfung im Save (entschieden: streng):** streng mit der wirksamen Fahrzeit aus `raw.council[4]`; fängt manipulierte Stände. Die lose Variante ist gestrichen.
- **F3 Versionsnummer (entschieden: ja, Feinwahl lead-tech im Plan; ein Test sichert, dass ein älterer Build einen Stand mit `'C'` über die Version abweist):** eine Nummer (main + 1 beim Merge nach Stadtplanung, Migration nur Versionsfeld), weil der Wertebereich wächst und ältere Builds einen Stand mit `'C'` dann über die Versionsprüfung statt über die Feldprüfung abweisen. Entscheid `lead-tech`.

## 12 Selbstprüfung Gate Brainstorming

1. Säule: Fernhandel und Kaufleute-Versorgung; misslingt es, ist es eine Scheinwahl ohne Folgeschaden. OK
2. Echte Wahl: Jede der drei Karten hat Gewinn- und Nulllage (Anhang §5). **Glasrecht ist in Tabelle b in jeder Zelle
   mindestens gleich gut**; Seerecht gewinnt über Deckel, Felsbucht und 80/d 35. BEDENKEN, bewusst angenommen (B1).
3. Rückkopplung: schnellere Schiffe → mehr Gewürz → mehr Kaufleute; begrenzt durch `SHIP_MAX` und Plantagenplätze,
   keine Schleife. OK
4. Randfälle: Ankunfts-Tick, Pause, Rückruf, Save-Manipulation, zwei offene Stufen genannt. OK
5. Einfacher: «ab nächster Abfahrt» wäre einfacher, erzeugt aber zwei Fahrzeiten (V4). OK

Gesamt: **OK mit Bedenken** (B1 bewusst angenommen, B2 gewollt).

## 13 Grösse

**S–M (Schätzung)**, ein Plan, etwa 5–6 Tasks: (1) Defs, Typ, Fahrzeit-Helfer; (2) `decree` mit Umrechnung; (3) Sim-
und Render-Leser (`ships`, `routeBalance`, `shipLane` mit Cache); (4) UI-Leser und Rats-Karte mit drei Karten; (5) Save
(`isValidCouncil`, `isSide`, F2, ggf. Version); (6) Doku und Browser-Check. Risiko: Lesestellen, die `travelTicks` oder
`laneTicks` direkt nutzen und hier nicht genannt sind; der Plan sucht sie per `rg` vollständig.
