# UI-HAEPPCHEN-I: I-168 Kassen-Reichweite, I-167 Bestand im Bau-Tooltip, I-170 Wachstumsbremse im Einwohner-Chip (Kurzdesign, Stufe leicht)

Stand 2026-10-22 · Paket UI-HAEPPCHEN-I · Quelle: R827, `docs/ideen.md` I-168, I-167, I-170 (IDEEN-15, Branch `docs/ideen-15`), Vorlage `docs/superpowers/specs/2026-10-22-ui-haeppchen-h-design.md` · Grösse P1 S, P2 S, P3 S–M (zusammen ≈ 110 Tools) · Save: **nein** (`SAVE_VERSION` unverändert) · Baseline/Balancing: unberührt · Spielwert in `src/sim/defs/`: keiner neu (UI-Schwellen leben in `src/ui/`, wie `reach.ts`) · Assets: keine · `src/sim/`: keine Änderung

Drei unabhängige Teile. Alle sind reine Lesefunktionen über die Welt; sie schreiben nie in sie.

## Befund vorab: Stadtplanung liefert keinen Aufstiegsgrund «Lärm»

Die Idee I-170 nimmt an, `houseDiagnosis` liefere nach dem Stadtplanung-Merge Lärm und Park «ohne Zusatzarbeit». Das stimmt nicht (`git diff main...feat/stadtplanung`): `src/sim/queries.ts` bleibt unverändert, `Diagnosis` kennt weiter nur `supply`, `good`, `service`. Lärm wirkt anders: Er senkt die **Belegungsgrenze** (`noiseFactor`, `NOISE_OCCUPANCY` 0,75, `src/sim/quiet.ts`, `src/sim/caps.ts`); das Haus füllt sich bis zur gesenkten Grenze, gilt dort als «voll» (`isFull` mit Faktor) und steigt trotzdem auf. Lärm bremst also die Einwohnerzahl, nicht den Aufstieg. Der Park ist keine Ursache, sondern das Mittel (`parkRadius` schirmt ab, `houseNoise(...).shielded`). Folge: P3 zählt Lärm als **eigene Zeile** mit `houseNoise`/`houseCap` (Regel G5), nicht als Eintrag der Ursachenliste. Der Park erscheint als Hinweis. Das ist der einzige Teil, der vom Stadtplanung-Merge abhängt (P1 und P2 nicht).

## Teil P1: I-168 «Kasse leer in ≈ m:ss»

### Spielerzweck

Im Frühspiel (U1–U3), wo die Kasse wirklich kippen kann, sieht der Spieler bei negativer Bilanz, wie lange das Geld noch reicht, und entscheidet zwischen Stilllegen, Abreissen, Steuer und Warenverkauf, bevor es schiefgeht. Säule: Wirtschaft über Steuern und Handel. Heute zeigt der Geld-Chip nur `Geld n`; der Hinweis «Deine Kasse schrumpft» (`guide.ts`) erscheint erst bei Minus.

Nicht dazu: kein Verlauf und keine Kurve (I-067 geparkt), keine Prognose mit Handel, Aufträgen oder Bauplänen, kein Alarmton, keine neue Meldung im Log, keine Änderung der Bilanz-Kopfzeile (I-108), keine Einstellung.

### Regeln

1. **Quelle:** `net = world.stats.taxes − world.stats.upkeep` je `UPKEEP_INTERVAL` (100 Ticks); dieselbe Zahl wie die Bilanz-Kopfzeile (`flowLabel`). Handel, Aufträge, Bau und Abriss sind nicht in `stats`; der Text sagt das («ohne Handel und Aufträge», wie `reachLine`).
2. **Wann:** `money > 0` und `net ≤ −TREND_EPS` (`reach.ts`). Sonst keine Zeile (positive oder ausgeglichene Bilanz, Rauschen).
3. **Reine Funktion** `cashReach(money, taxes, upkeep): CashReach | null` in neuer Datei `src/ui/cashReach.ts`; sie nutzt `reachView(money, net, Infinity)` (gleiche Schwellen wie die Lager-Chips: `warn` ≤ 180 s, `alarm` ≤ 60 s Spielzeit). Test sichert `GOODS_BALANCE_TICKS === UPKEEP_INTERVAL` (die Umrechnung in `reachView` setzt es voraus).
4. **Rundung:** Ticks → Sekunden Spielzeit (1×, tempo-unabhängig), auf 10 s gerundet, mindestens 10 s; Format `formatGameTime`.
5. **Text (Tooltip des Geld-Chips, `data-field="money"`):** `Kasse leer in ≈ 4:10 bei −12 / min (ohne Handel und Aufträge)`; die Rate ist `signedNum(perMinute(net, UPKEEP_INTERVAL))`. Bei `money ≤ 0` und `net ≤ −TREND_EPS`: `Kasse ist leer bei −12 / min (ohne Handel und Aufträge)`. Ohne Zeile ist der Tooltip leer (Attribut entfernt).
6. **Chip-Zustand:** `warn`/`alarm` setzt die vorhandenen Klassen `reach-warn`/`reach-alarm` am Geld-Chip (CSS: `.hud-money.reach-warn`, `.hud-money.reach-alarm` zu den bestehenden Regeln `.chip.reach-*` ergänzt, keine neuen Farben); `negative` bei `money < 0` bleibt unabhängig. Das `aria-label` des Chips wird um den Satz aus 5 ergänzt (Farbe steht nie allein). Der Chip-Text (`Geld n`) bleibt.
7. **Takt:** `updateMoney` läuft je Frame; die Funktion ist O(1). Tooltip, Klassen und `aria-label` werden nur bei Änderung geschrieben.
8. **Randfälle:** Einmalzahlungen (Bau, Handel) ändern `money`, nicht `net`: die Zahl springt mit; das «≈» und die 10-s-Rundung fangen es. `stats` hinkt bis zu 100 Ticks nach einer Änderung (Stilllegen, Steuer) nach; akzeptiert. Pause und Tempo ändern den Text nicht. Spätspiel mit Überschuss (R722): Zeile fehlt, richtig so.

### Abnahmekriterien

Vitest (`tests/ui/cashReach.test.ts`, kleine Ergänzung `tests/ui/hud.test.ts`):

- AK-I1 Keine Zeile bei `taxes ≥ upkeep` und bei `|net| < TREND_EPS`.
- AK-I2 Rechnung: Geld 500, Steuern 20, Unterhalt 32 → Minus 12 je 100 Ticks; Sekunden = `500 × 100 / 12` Ticks in Spielzeit, auf 10 s gerundet; Text gleich `Kasse leer in ≈ ${formatGameTime(secToTicks(gerundet))} bei −… / min …` (TICK_MS-unabhängig geprüft); Rate gleich der Netto-Zahl in `flowLabel`.
- AK-I3 Rundung: Vielfache von 10 s; nie weniger als 10 s; Sprung von 4:14 auf 4:10 bzw. 4:20 an der Grenze 4:15 (Halbwerte nach oben).
- AK-I4 Stufen: 181 s → keine Klasse, 180 s → `reach-warn`, 60 s → `reach-alarm`.
- AK-I5 `money = 0` mit Minus → «Kasse ist leer …»; `money < 0` behält `negative`, die Zeile erscheint, wenn `net` negativ ist.
- AK-I6 Chip-Text unverändert `Geld n`; `aria-label` enthält den Satz genau dann, wenn die Zeile besteht.
- AK-I7 Reinheit: Welt vor/nach `serialize`-gleich; 1000 `updateMoney`-Aufrufe ohne Änderung erzeugen höchstens einen `title`- und einen `setAttribute`-Schreibzugriff (Spy).
- AK-I8 Sim unberührt: Replay-Hash/Baseline bitgleich, `tests/sim/balance.test.ts` und `SAVE_VERSION` unverändert (nur der Lauf).

Browser-Check (`qa-playtester`): AK-I9 Neue Insel, mehrere Betriebe ohne Häuser bauen bis die Bilanz negativ ist: Mauszeiger auf `Geld` zeigt «Kasse leer in ≈ …»; Betrieb stilllegen: Zeit wächst; ab 3:00 Gelb, ab 1:00 Rot; Tempo 4× ändert den Text nicht.

## Teil P2: I-167 Bestand im Bau-Tooltip

### Spielerzweck

Beim Überfahren eines Bauleisten-Eintrags liest der Spieler «Steht: 4 (1 still)» und entscheidet, ob eine weitere Fischerhütte oder Weberei sinnvoll ist, statt die Karte abzuzählen. Säule: Produktionsketten (Kettenverhältnis im Moment der Bauentscheidung).

Nicht dazu: keine Erzeuger-Liste je Gut (I-043), keine Rangliste (I-062), kein Klick-Sprung, keine Auslastung, kein Bestand für Werkzeuge ohne gebaute Gebäude (Weg, Abriss, Aufforsten).

### Regeln

1. **Wo:** neue Tooltip-Zeile `tt-line tt-stand` direkt nach der Bilanz-Zeile (`tt-balance`) der Bau-Einträge (`attachTooltip` in `src/ui/buildMenu.ts`). Wie die Bilanz-Zeile wird sie lazy gefüllt (`open`, `refreshShownBalance`), nie in `tooltipLines` (die kennt keine Welt).
2. **Zählung:** `Steht: n` = Gebäude dieser Art auf der **Insel der Kamera**; `(k still)` hängt an, wenn `k > 0` (`b.paused === true`, Stilllegen I-035). Hängt am Text `· alle Inseln: m`, genau wenn `m > n` (Gebäude gleicher Art auf anderen Inseln). Bei `n = 0` und `m = 0`: `Steht: noch keins`.
3. **Entfällt** für Kontor, Kontor II und jedes Gebäude mit `maxCount.n === 1` (Amtsstube, Denkmal; dort sagt «Nur einmal je Insel» es schon).
4. **Reine Funktion** `standLine(world, defId, island): string | null` in `src/ui/buildStand.ts`; ein Durchlauf über `world.buildings`, nur für sichtbare Tooltips (`.tooltip.show`), nie für verborgene.
5. **Randfälle:** Brennende und nicht angebundene Gebäude zählen als stehend (nur `paused` ist «still»). Kamerawechsel: die nächste Auffrischung rechnet neu. Gebäude im Bau-Werkzeug gewählt und gebaut, während der Tooltip offen ist: Zeile wird mit der nächsten Auffrischung (HUD-Takt) aktuell.

### Abnahmekriterien

Vitest (`tests/ui/buildStand.test.ts`, `tests/ui/buildMenu.test.ts`):

- AK-I10 `standLine` für 4 Fischerhütten, 1 stillgelegt, Heimat: «Steht: 4 (1 still)»; ohne stillgelegte «Steht: 4»; ohne Gebäude «Steht: noch keins».
- AK-I11 Zwei Inseln: Kamera-Insel mit 2, andere mit 3 → «Steht: 2 · alle Inseln: 5»; nur Kamera-Insel besetzt → ohne den Zusatz.
- AK-I12 `null` für Kontor, Kontor II, Amtsstube, Denkmal.
- AK-I13 Die Zeile erscheint im Tooltip eines Bau-Eintrags nach der Bilanz-Zeile; für Weg, Abriss, Aufforsten und Pflanzen gibt es sie nicht.
- AK-I14 Nur sichtbare Tooltips rechnen: bei einem geöffneten Tooltip und 20 verborgenen genau ein `standLine`-Aufruf je Auffrischung (Spy).
- AK-I15 Reinheit: Welt unverändert; Sim, Save, Baseline unberührt (nur der Lauf).

Browser-Check: AK-I16 Fischerhütte dreimal bauen, eine stilllegen, Tooltip der Fischerhütte: «Steht: 3 (1 still)»; vierte bauen bei offenem Tooltip: nach kurzer Zeit 4.

## Teil P3: I-170 Wachstumsbremse im Einwohner-Chip

### Spielerzweck

Der Spieler hält den Zeiger auf den Einwohner-Chip einer Stufe und liest «14 Häuser: 5 ausserhalb der Versorgung · 4 ohne Tuch · 3 ohne Kapelle · 2 ohne Mangel». Er weiss, was er als Nächstes baut, statt Häuser einzeln anzuklicken. Säule: Bevölkerung versorgen und aufsteigen lassen (stärkste Entscheidungshilfe der Runde für die erste Stunde). Heute nennt `tierTooltip` nur den Bedarf der Stufe; Mangel gibt es je Haus (`houseDiagnosis`, Haus-Panel) und je Haus in der Problemliste.

Nicht dazu: kein Klick-Sprung (Designfrage F1), keine Karte (I-045), keine Änderung am Haus-Panel oder der Problemliste, keine Sim-Änderung (auch nicht an `houseDiagnosis`), keine Aufstiegs-Vorhersage («bereit» wird bewusst nicht behauptet, siehe 3).

### Regeln

1. **Ort:** Tooltip des Chips `pop-{tier}` im Kopf (`title`). Erste Zeile bleibt der bestehende `tierTooltip`. Die Zählung gilt für die **Insel der Kamera** und für Häuser genau dieser Stufe. Brennende Häuser zählen nicht (wie in der Problemliste).
2. **Ursache je Haus (genau eine):** erste zutreffende aus `houseDiagnosis` in der Rangfolge ausserhalb der Versorgung (`supply`) → Ware (`good`, erstes in `GOOD_IDS`-Reihenfolge) → Dienst (`service`, Reihenfolge der Stufe). Häuser ohne Eintrag zählen als **ohne Mangel**. Die Summe aller Teile ist die Häuserzahl.
3. **Wortwahl «ohne Mangel» statt «bereit»:** Ein Haus ohne Diagnose kann noch wachsen, die Wartezeit abwarten oder Geld brauchen; «bereit» wäre falsch. Die Zeile behauptet nur, was `houseDiagnosis` hergibt.
4. **Text (Zeile 2):** `{n} Häuser: ` (bei 1 «1 Haus: »), danach höchstens **3** Ursachen absteigend nach Anzahl (Gleichstand: Reihenfolge aus 2), je `{n} ausserhalb der Versorgung`, `{n} ohne {Gut}`, `{n} ohne {Dienstgebäude}`; weitere Ursachen als `{n} weitere`; zuletzt `{n} ohne Mangel`, nur wenn `n > 0`. Trenner « · ». Sind alle ohne Mangel: `Alle {n} Häuser ohne Mangel` (1 Haus: «Das Haus ohne Mangel»). Keine Häuser der Stufe auf der Insel: keine Zeile.
5. **Lärm (Zeile 3, nach Stadtplanung-Merge):** Ein Haus der Stufe zählt als «im Lärm», wenn `houseNoise(world, b, cov).noisy` und der Verlust `k = houseCap(h, 1) − houseCap(h, NOISE_OCCUPANCY)` grösser als 0 ist (dieselbe Regel wie `noisePreview`: bei hoher Steuer sperrt oft schon die Steuer). Text: `{n} im Lärm (−{Σk} Einwohner)`; ist `buildingShown(world, 'park')` wahr, folgt « — ein Park schirmt ab». Abgeschirmte Häuser (`shielded`) zählen nicht. Ein Haus mit Mangel **und** Lärm steht in beiden Zeilen. Ohne Lärm-Häuser keine Zeile. Vor dem Merge gibt es `quiet.ts` nicht; die Umsetzung von 5 wartet deshalb.
6. **Spitzenstufe:** wird **nicht** ausgenommen (Abweichung von der Idee): Mangel lässt auch dort Einwohner abziehen (`tickPopulation`), die Zeile bleibt lesbar. Nur das Wort «Aufstieg» fällt nirgends.
7. **Reine Funktionen** in neuer Datei `src/ui/growthBrake.ts`: `growthBrakes(world, island, cov?): Record<Tier, GrowthBrake>` rechnet alle Stufen in einem Durchlauf mit einmal gebauter Coverage (`buildCoverage`); `brakeLines(brake, parkShown): string[]` setzt die Texte. `src/ui/hud.ts` ruft sie nur im Chip-Refresh.
8. **Takt und Cache (Pflicht, Beobachtung 2026-10-16 «focusLine/focusList je Chip ungemessen»):** Neu gerechnet wird höchstens alle `BRAKE_REFRESH_MS` = 1000 ms Wandzeit (UI-Konstante wie `BALANCE_REFRESH_MS`, `balanceDue`-Muster) und nur, wenn mindestens ein Stufen-Chip sichtbar ist; nie je Frame. `title` wird nur bei Änderung geschrieben. Die Messung (Zeit einer Rechnung mit ≥ 200 Häusern) wird berichtet (AK-I27).
9. **Randfälle:** Stufe ohne Häuser → nur Basis-Tooltip. Alle ohne Mangel und kein Lärm → eine Zeile. Gesperrte oder verborgene Chips (`popChipHidden`) rechnen nicht. Inselwechsel der Kamera → nächste Auffrischung. Haus während des Tooltips abgerissen → nächste Auffrischung.

### Abnahmekriterien

Vitest (`tests/ui/growthBrake.test.ts`, kleine Ergänzung `tests/ui/hud.test.ts`):

- AK-I17 Zählung: 6 Häuser Stufe 1; 2 ausserhalb der Versorgung, 2 ohne Gut X, 1 ohne Dienst, 1 ohne Mangel → Teile 2/2/1/1, Summe 6; ein Haus mit Versorgung weg **und** Gut fehlt zählt nur unter Versorgung.
- AK-I18 Mehrere fehlende Waren: nur die erste in `GOOD_IDS`-Reihenfolge zählt.
- AK-I19 Höchstens 3 Ursachen, Rest als «weitere», sortiert nach Anzahl, Gleichstand nach Rangfolge; «ohne Mangel» nie unter den dreien und nur bei `n > 0`.
- AK-I20 Texte (Gold-Strings): «14 Häuser: 5 ausserhalb der Versorgung · 4 ohne Holz · 3 ohne Kapelle · 2 ohne Mangel», Einzahl «1 Haus: 1 ohne Holz», «Alle 14 Häuser ohne Mangel»; Ware nach `GOODS[..].name`, Dienst nach Gebäudename (`BUILDING_DEFS[SERVICE_BUILDING[..]].name`).
- AK-I21 Insel und Stufe: Häuser anderer Inseln und anderer Stufen zählen nicht; brennende Häuser zählen nicht; keine Häuser → keine Zeile, Tooltip gleich `tierTooltip`.
- AK-I22 Spitzenstufe liefert Zeilen; kein Text enthält «Aufstieg» oder «bereit».
- AK-I23 Lärm (erst nach Merge): Haus im Lärm mit `k > 0` → «1 im Lärm (−k Einwohner)»; abgeschirmtes Haus zählt nicht; Lärm bei hoher Steuer mit `k = 0` zählt nicht; Hinweis «ein Park schirmt ab» nur bei `buildingShown(world, 'park')`; Haus mit Mangel und Lärm in beiden Zeilen.
- AK-I24 Reinheit: Welt vor/nach `serialize`-gleich; `houseDiagnosis`, `noiseFactor`, `buildCoverage` ändern nichts (Lauf).
- AK-I25 Takt: 100 `updateHud`-Aufrufe innerhalb 1000 ms (gestubbte `performance.now`) erzeugen genau eine Berechnung (Spy auf `growthBrakes`); nach 1000 ms eine zweite; kein Aufruf, wenn alle Stufen-Chips verborgen sind; `title` wird nur bei geändertem Text geschrieben.
- AK-I26 Chip-Text (Zahl) und `aria-label` unverändert (bestehende `hud.test.ts` bleibt grün); Sim, Save, Baseline unberührt, `git diff src/sim` leer.

Browser-Check (`qa-playtester`): AK-I27 Partie mit ≥ 200 Häusern (weite Partie): Messung einer `growthBrakes`-Rechnung im Browser (Median aus 20) wird berichtet; über 4 ms geht P3 vor dem Merge an L0 zurück; Bildrate bei geöffnetem Tooltip nicht sichtbar schlechter (Perf-Probe wie bisher). AK-I28 Pioniere ohne Marktplatz in Reichweite: Chip-Tooltip nennt «ausserhalb der Versorgung»; Marktplatz bauen: Zahl sinkt innerhalb von 1–2 s; Kapelle fehlt bei Stufe 2: «ohne Kapelle». AK-I29 (nach Merge) Steinmetz neben ein Haus bauen: Zeile «im Lärm (−n Einwohner) — ein Park schirmt ab»; Park bauen: Zeile verschwindet.

## Überschneidungen

- **Stadtplanung** (`feat/stadtplanung`, `feat/stadtplanung-ui`, geprüft per `git diff main...`): berührt `hud.ts`, `buildMenu.ts` und `style.css` **nicht**; `problems.ts`, `inspect.ts`, `texts.ts` ja, die dieses Häppchen nicht ändert (P3 liest `houseDiagnosis`, `diagnosisText`-Muster und `SERVICE_BUILDING` nur). Harte Abhängigkeit nur für P3 Regel 5 (`src/sim/quiet.ts`, `NOISE_OCCUPANCY`, `caps.ts`, Park-Def); P1, P2 und P3 Regeln 1–4, 6–9 laufen auch ohne. Empfehlung: P1 und P2 dürfen vor dem Merge starten, P3 nach dem Merge (oder P3 ohne Regel 5 vorab und Regel 5 als Nachtrag).
- **UI-BEIPACK-FERN** (R825 P1, noch kein Branch; geplante Dateien laut Ruling: `farOrder.ts`, `hud.ts`, `trial.ts`, Texte, README): gemeinsame Datei `src/ui/hud.ts`, aber disjunkte Stellen (Beipack: `syncGoalChip`/Ziel-Chip und Fern-Text; hier: `updateMoney`, `moneyView`, Stufen-Chips, `tierTooltip`). Gemeinsam ist `tests/ui/hud.test.ts`; neue Tests liegen deshalb in eigenen Dateien. Reihenfolge egal, Rebase erwartet klein. Kein Konflikt in `buildMenu.ts` (nur P2).
- **UI-HAEPPCHEN-H P1** (`app.ts`, `storage.ts`, `menu.ts`, `startCard.ts`): keine gemeinsame Datei. **ORT-A** (`app.ts`, `devProbes.ts`, `src/render/`): keine gemeinsame Datei.
- **Beide README-Abschnitte** (Geld/Bilanz, Bau-Tooltip, Einwohner-Chip) liegen am gemeinsamen Ende der README-Tabelle; Konflikt mit H/Beipack möglich, Auflösung: beide Zeilen behalten.
- Innerhalb des Häppchens: P1 und P3 teilen `hud.ts` (ein Umsetzer, nacheinander); P2 (`buildMenu.ts`) läuft parallel dazu.

## Zuschnitt und Dateien

Zwei Umsetzer-Stränge (`tech-ui-engineer`): **A** P1 dann P3 — `src/ui/cashReach.ts` (neu), `src/ui/growthBrake.ts` (neu), `src/ui/hud.ts` (`updateMoney`/`moneyView`, Chip-Refresh, `BRAKE_REFRESH_MS`), `src/style.css` (zwei Selektoren), Tests `tests/ui/cashReach.test.ts`, `tests/ui/growthBrake.test.ts`, kleine Ergänzung `tests/ui/hud.test.ts`; **B** P2 — `src/ui/buildStand.ts` (neu), `src/ui/buildMenu.ts` (Zeile und Auffrischung), Tests `tests/ui/buildStand.test.ts`, `tests/ui/buildMenu.test.ts`. `README.md` (Spielanleitung: Geld-Tooltip «Kasse leer in», Bau-Tooltip «Steht», Einwohner-Chip-Tooltip) je Strang. Kein `src/sim/`, kein `src/audio/`, kein `src/render/`, kein Save, keine Laufzeit-Abhängigkeit.

## Designfragen für L0 (Entwürfe mit Empfehlung)

- **F1 Klick-Sprung beim Einwohner-Chip?** Die Idee sieht ihn vor. Die Chips sind `span`; ein Sprung macht sie zu Knöpfen (Fokus, `aria`, Tastatur) und braucht ein Ziel-Haus-Protokoll (≈ +25 Tools). Empfehlung: **nein im ersten Häppchen**; die Problemliste (`.`) springt schon zu einzelnen Häusern, der Tooltip beantwortet «was fehlt». Nachziehen, wenn der Playtest den Klick vermisst.
- **F2 Eine Ursache je Haus oder alle?** Empfehlung: **eine** (Rangfolge in Regel 2): Summe gleich Häuserzahl, lesbar. Nachteil: eine zweite fehlende Ware bleibt verborgen, bis die erste behoben ist; das Haus-Panel zeigt alle.
- **F3 Lärm als eigene Zeile oder als Ursache?** Empfehlung: **eigene Zeile** (Befund vorab): Lärm ist eine Obergrenze der Belegung, kein Aufstiegsgrund. Sonst bekäme ein Haus «im Lärm» ein falsches «blockiert».
- **F4 «ohne Mangel» statt «bereit».** Empfehlung: **ja** (Regel 3).
- **F5 Spitzenstufe zeigen?** Empfehlung: **ja** (Regel 6), Abweichung von I-170.
- **F6 Kassen-Chip färben (Gelb ≤ 3:00, Rot ≤ 1:00) oder nur Tooltip?** Empfehlung: **färben** mit den vorhandenen Lager-Schwellen und `aria-label`; ein Tooltip allein wird im Frühspiel nicht gelesen. Kostet zwei CSS-Selektoren.
- **F7 Bestand «alle Inseln»?** Empfehlung: **nur wenn mehr als auf der Kamera-Insel** (Regel 2), sonst stünde die Zahl doppelt.
- **F8 Startzeitpunkt:** Empfehlung: P1 und P2 sofort nach freier Testsperre (kein Stadtplanung-Bezug), P3 nach dem Stadtplanung-Merge; ein Plan, drei Pakete.
- **Korrektur an I-170:** Die Annahme «`houseDiagnosis` liefert die Stadtplanung-Gründe» gehört in `docs/ideen.md` richtiggestellt (Lehre WIRTSCHAFT-BS-1); lead-design trägt es bei der nächsten Pool-Pflege nach.

## Selbstprüfung (Gate Brainstorming)

| Frage               | Befund                                                                                                                                                                                                                                        |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Säule               | P1 Wirtschaft (Pleite vorhersehbar), P2 Produktionsketten (Verhältnis im Bau-Moment), P3 Bevölkerung (Mangel der Stufe in einem Blick). Misslingt es, bleibt das Spiel gleich; es fehlt nur Lesbarkeit.                                       |
| Echte Wahl          | P1: Stilllegen, Abreissen, Steuer, Verkauf; P2: noch eine Hütte oder nicht; P3: welche Lücke zuerst. Reine Information, keine dominante Option und keine neue Pflichtroutine.                                                                 |
| Rückkopplung        | Keine in der Sim. Eine Leseanzeige kann Verhalten steuern (früher stilllegen, gezielter bauen): gewollt, bremst die Frühspiel-Pleite, ohne Zahlen zu ändern.                                                                                  |
| Randfälle           | Bilanz ±0, Kasse 0 oder Minus, Einmalzahlungen, `stats`-Nachlauf; Bestand ohne Gebäude, Stilllegung, mehrere Inseln, Kontor und Denkmal; Stufe ohne Häuser, brennende Häuser, Mehrfachmangel, Lärm bei hoher Steuer, Park ohne Freischaltung. |
| Einfachere Variante | P3 nur mit der ersten Ursache je Stufe wäre kleiner, verschweigt aber die Hälfte; P1 ohne Färbung (F6) und P3 ohne Lärmzeile sind die Rückfälle, wenn der Umfang drückt.                                                                      |

Urteil Selbstprüfung: OK.
