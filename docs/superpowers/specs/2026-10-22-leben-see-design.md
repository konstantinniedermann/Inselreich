# LEBEN-SEE: Kielwasser der Schiffe und Anlege-Klang (Kurzdesign, Stufe leicht)

Stand 2026-10-22 · Paket LEBEN-SEE · Quelle: R827 (IDEEN-15, Häppchen 2 «Leben auf See»: I-157 Kielwasser, I-156 Anlege-Klang), Autor lead-art · Vorlage `docs/superpowers/specs/2026-10-22-leben-strasse-design.md` (Branch `design/leben-strasse`) · Grösse S + S (zwei Pakete: P1 Kielwasser ≈ 40 Tools, P2 Klang ≈ 25 Tools) · Save: nein (`SAVE_VERSION` unverändert) · Baseline/Balancing: unberührt · Spielwerte in `src/sim/defs/`: keine · Assets: keine (prozedural bzw. synthetisch, kein Lizenzweg nach ADR-011; neues Asset nur als Option, siehe Klang) · Stilgrundlage: ADR-012, `2026-10-04-stilrahmen.md` (S1 ein Licht, S2 Tonstufen, keine Mischung mit Schwarz/Weiss)

## Bestand (geprüft im Code, main 50ff9f8d)

- **Schiffszeichnung** (`ship.ts`): `drawShip(ctx, cam, tile, timeMs, scale)` zeichnet Rumpf, Mast, Segel mit Schaukeln und Neigung aus `timeMs`; **keine Fahrtrichtung** (der Rumpf zeigt immer gleich), keine Spur (`rg wake|spur|trail src/render` ohne Treffer). Fernsicht (Zoom ≤ 0,5): heller Saum `SAUM` = `PALETTE.foam`, Mindestgrösse über `shipScale`.
- **Pose** (`shipLane.ts`): `shipPose(world, ship)` liefert die Position aus `ship.left` und der Fahrlinie `lanePoints` (Wasserroute, Polylinie in Archipel-Kacheln); rein, nur lesend. Fahrzeit 10 Ticks je Seekachel (`SHIP_TICKS_PER_SEA_TILE`), also 1 Kachel/s bei Tempo 1×. Liegende Schiffe (`to === null`) stehen am Anker.
- **Zeichenstellen** (`renderer.ts`): Insel-Durchgang Z. 626–629 (`moving.push` für Heimatschiff id 0 und `fleet`) und Z. 807–808 (`drawShip`); offene See `drawSeaShip` Z. 964–974; Schatten Z. 766 (`shipShadow`). Das Tageslicht- und Wetter-Grading ist ein **globaler Multiply-Durchgang** nach allem (Z. 1028, `gradeAt`): alles, was ein Schiff zeichnet, wird mitgetönt.
- **Ton** (`src/audio/sound.ts`): `SoundEvent` hat kein Schiffsereignis. Auslöser sind reine Vergleiche zweier Frames: `soundSnapshot`/`diffSoundEvents` in `src/ui/soundEvents.ts`, aufgerufen in `app.ts` Z. 1690–1692. Die Glocke existiert dreifach: Sample `bell.mp3` (SG1, CC0) für `alarm` und `monumentDone`, synthetische `BELL` in `buildSounds.ts:67` (Kapelle). Wasser-Klanggruppe `WATER` (Plankenklopfen und Plätschern) für Fischer und Bad. Ducking nur für `FIGURE_S` (Signale), Effekte liegen 6 dB unter den Signalen.
- **Befund zur Idee I-156 (ändert den Auslöser):** `tickShips` (`src/sim/ships.ts:221–235`) setzt bei `left === 0` `to = null` und ruft **im selben Tick** `handleDocked`, das umlädt und sofort wieder `depart` ruft. Ein Schiff auf Route ist also nie in einem Frame mit `to === null` zu beobachten (nur Schiffe ohne Route, auf Heimkehr oder frisch gekauft). Der in der Idee genannte Zustandswechsel «fährt → liegt» taugt nicht; beobachtbar ist der **Wechsel von `ship.port`** (bei Ankunft gesetzt). Anlegen und Ablegen sind ein Vorgang und bekommen **einen** Klang (Ablegen als eigener Klang entfällt, Ermüdung halbiert).

## Teil P1: Kielwasser (I-157)

### Spielerzweck

Der Spieler sieht auf einen Blick, **welches Schiff fährt und wohin**: Der Rumpf hat keine Richtung, die Spur gibt sie. Fährt nichts, liegt auch keine Spur (Stillstand sofort lesbar). Säule: Lesbarkeit (Arbeit/Stillstand), Stimmung. Nicht dazu: keine Rumpfdrehung, keine Wellen- oder Wasserverformung, keine Spur der Heimatschiff-Kulisse (id 0, Auftragsschiff liegt am Kontor), keine Seekarte (eigene Darstellung, `seaMap.ts`), kein Ton, keine Sim-Änderung.

### Gestaltung

- **Spur entlang der Fahrlinie, nicht gerade:** Die Spur zeichnet die letzten `WAKE_LEN = 3` Kacheln der tatsächlichen Fahrt nach, also auch in Kurven um Küsten. Ihre Punkte ergeben sich aus `shipPose` mit grösserem `left` (öffentliche Schnittstelle, keine Änderung an `shipLane.ts`): `shipPose(world, {...ship, left: ship.left + k·5})`, `k = 1…8`, danach nach Bogenlänge auf 3 Kacheln gekürzt. Weil nur `shipPose` benutzt wird, stimmt die Spur automatisch mit der Seerecht-Fahrzeit (8 statt 10 Ticks je Seekachel) überein.
- **Form:** V aus zwei Schaumlinien. Seitenversatz zur lokalen Fahrtrichtung `±(0,06 + 0,09·d)` Kacheln bei Abstand `d` hinter dem Heck (öffnet sich nach hinten), im Kachelraum gerechnet und dann projiziert (die Iso-Stauchung kommt von selbst). Aufgeteilt in 4 Abschnitte je Seite mit Deckkraft `0,40 → 0,28 → 0,16 → 0,06`, Farbe `PALETTE.foam` (derselbe Ton wie der Fernsicht-Saum). Linienbreite `max(1, 1,5 · zoom)` px. Keine Füllung, keine Verläufe.
- **Tiefe:** gezeichnet unmittelbar **vor dem Rumpf** im selben Durchgang (dann liegt die Spur über dem Wasser und unter dem Schiff). Wer lieber im Bodendurchgang mit den Schatten zeichnet, siehe Designfrage 2.
- **Licht und Tageszeit:** keine eigene Rechnung. Die Spur liegt vor dem globalen Multiply-Durchgang und wird mit Tageslicht und Wetter getönt; nachts bleibt `foam` heller als das getönte Wasser (Kontrast ist Teil der Abnahme).
- **Wetter:** `storm`: Seitenversatz ×1,5 und Deckkraft ×1,15 (gedeckelt 0,5); `rain`/`cloudy`/`clear` unverändert. Bewegung reduziert (`reduce`): Länge fest 1,5 Kacheln, Versatz fest `0,06 + 0,05·d`, keine Sturm-Verbreiterung.
- **Anlegen und Auslaufen ohne Zustand:** Liegende Schiffe haben keine Spur. Beim Ablegen wächst die Spur von selbst (hinter dem Anker gibt es noch keine Lane, die Punkte klemmen am Start, Länge folgt der gefahrenen Strecke). Bei der Ankunft blendet die Deckkraft über die letzten 20 Ticks vor `left = 0` mit dem Faktor `left/20` aus, damit sie nicht abrupt verschwindet.
- **Zoomstufen:** Zoom ≥ 0,5 V mit 8 Strichen; Zoom 0,25 und 0,375: ein Mittelstrich (Breite 2 px, Deckkraft 0,35, 3 Kacheln); Zoom ≤ 0,125: keine Spur (Schiff mit Saum bleibt lesbar). Kein Sprite-Cache, kein Offscreen: reiner Strichzug.
- **Pause und Tempo:** Die Spur ist eine reine Funktion von `ship.left` und der Fahrlinie, ohne Uhr. Pause: `left` ändert sich nicht, Spur steht still. Tempo 2× und 4×: Spur gleich lang (3 Kacheln), das Schiff legt sie schneller zurück; es gibt **keine** Abhängigkeit von `pace.ts`, `RenderFx.speed` oder `tickClock` aus LEBEN-STRASSE (die Figuren laufen auf Echtzeit-Uhren, Schiffe laufen mit der Sim). Das Schaukeln des Rumpfes über `timeMs` bleibt wie heute. Die Spur springt wie das Schiff in Tickschritten (0,1 Kachel); eine Glättung über den Tickbruchteil ist nicht Teil dieses Pakets.
- **Obergrenze:** höchstens `WAKE_MAX = SHIP_MAX` (4) Spuren je Frame, je Spur ≤ 10 Zeichenaufrufe (8 Striche plus Pfad); das Sim-Maximum der Flotte ist ohnehin 4 (`sea.ts`). Die Konstante liegt in `wake.ts` (nicht in `limits.ts`, siehe Konflikte). Kosten je Frame: 8 `shipPose`-Aufrufe je Schiff (lineare Suche in der Polylinie), vier kleine Objekte je Schiff.

### Abnahmekriterien Kielwasser

Vitest (neu `tests/render/wake.test.ts`, ergänzt `tests/render/shipLane.test.ts` nicht, Zeichner gegen `tests/render/fakeCtx.ts`; reine Mathematik, keine Browser-Läufe):

- AK-W1 Punkte: `wakeTrail(world, ship)` für ein fahrendes Schiff liefert 2 bis 9 Punkte, der erste Punkt ist `shipPose` des Schiffs, alle folgenden liegen auf der Fahrlinie (Abstand zur Polylinie < 1e-6), die Bogenlänge ist genau 3 Kacheln, ausser das Schiff ist weniger als 3 Kacheln gefahren (dann gleich der gefahrenen Strecke).
- AK-W2 Liegend: `to === null` liefert keine Punkte (leere Spur), ebenso das Heimatschiff-Sinnbild (id 0, kein Ship-Eintrag).
- AK-W3 Kurve: bei einer Fahrlinie mit Knick folgt die Spur dem Knick (Test mit `laneWorld`-Fixture oder handgebauter Polylinie über `lanePoints`-Cache): mindestens ein Spurpunkt liegt auf dem ersten Abschnitt, wenn das Schiff auf dem zweiten fährt.
- AK-W4 Seerecht: gleiches Schiff, gleiche Strecke bei `seaTileTicks` 10 und 8 liefert dieselbe Länge (3 Kacheln); die Spur entsteht nur aus `shipPose` (Test mit `council[4] = 'C'`, soweit der Seerecht-Strang gemerged ist, sonst aufgeschoben, siehe Startbedingung).
- AK-W5 Form: Seitenversatz bei `d = 0` ist `0,06`, bei `d = 3` ist `0,33` (±1e-9); Sturm ×1,5; `reduce`: Länge 1,5 Kacheln, Versatz `0,06 + 0,05·d`, auch bei Sturm.
- AK-W6 Deckkraft: Abschnitte `0,40 / 0,28 / 0,16 / 0,06` (Sturm ×1,15, gedeckelt 0,5); letzte 20 Ticks vor Ankunft Faktor `left/20`; bei `left = 20` Faktor 1, bei `left = 1` Faktor 0,05.
- AK-W7 Pause/Tempo: `JSON.stringify` der Welt vor und nach `wakeTrail` ist gleich (Render schreibt nie in die Welt); zwei Aufrufe bei unverändertem `left` liefern bitgleiche Punkte (Pause); `wakeTrail` hat keinen Zeitparameter (Signatur-Test oder Typ).
- AK-W8 Zeichnung (Fake-Kontext): Zoom 1: genau zwei Seiten à 4 Striche in `PALETTE.foam` (Farbe aus `rgbaOfCss`), ≤ 10 Zeichenaufrufe je Spur, kein `fill`; Zoom 0,25: ein Strich; Zoom 0,125: kein Aufruf. Linienbreite ≥ 1 px bei jedem Zoom.
- AK-W9 Reihenfolge und Zahl: im Renderer-Test (`tests/render/renderer.test.ts` bzw. Fake-Kontext) liegen alle Spurstriche eines Schiffs vor dessen Rumpf (`fill` mit `HULL`); bei 4 fahrenden Schiffen ≤ 4 Spuren, nie mehr als `WAKE_MAX`.
- AK-W10 Palette und Licht: Spurfarbe ist ausschliesslich `PALETTE.foam` (kein Schwarz/Weiss, S1-Prüfung des Stilrahmens); Kontrast `foam` gegen Tiefwasser, beide durch `gradeAt(nacht, storm)` getönt, ≥ dem vom Plan gemessenen und festgeschriebenen Mindestwert (Fernsicht-Saum erreicht ≥ 2,2).
- AK-W11 Sim unberührt: Replay-Hash/Baseline bitgleich, `tests/sim/balance.test.ts` unverändert, `SAVE_VERSION` unverändert, `shipLane.ts` und `ship.ts` im Diff höchstens um Importe/Exporte ergänzt (kein geänderter Ausdruck).
- AK-W12 Leistung: `tools/render-qa/perf.mjs` mit 4 fahrenden Schiffen in Sicht bei Zoom 1: Median der Frame-Mehrkosten gegenüber main ≤ 0,2 ms; keine neue Allokation je Frame ausser den bis zu 4 × 8 kleinen Posen-Objekten (Beschreibung im Plan).

Browser-Check (`qa-playtester`, Headless, Galerie `tools/render-qa/galerie.mjs`):

- AK-W13 Zoom 1 / 0,5 / 0,25 mit zwei Schiffen auf offener See und einem im Hafenbereich: Spur sichtbar, zeigt von weitem hinter das Schiff (Richtung lesbar, auch bei Kurve); liegendes Schiff ohne Spur; Tag, Abend, Nacht und Sturm je ein Bild; Pause: Spur steht; 4×: Spur gleich lang. Screenshotsatz unter `.studio/qa/LEBEN-SEE/`.

## Teil P2: Anlege-Klang (I-156)

### Spielerzweck

Der Spieler **hört**, dass ein Schiff angelegt hat, auch wenn die Kamera auf einer anderen Insel steht, und weiss ohne Text, dass seine Route läuft. Säule: Handel hörbar, Lesbarkeit unter Musik und Umgebung. Nicht dazu: kein Klang je Be- und Entladen, keine Klänge für Stürme (bestehen), keine Wirkung auf Spielregeln, kein Ton bei Pause.

### Bestandsprüfung: gibt es einen passenden Klang?

| Vorhanden                                        | Eignung für «Schiff angelegt»                                                                                                                                                                |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sample `bell.mp3` (SG1, `alarm`, `monumentDone`) | **Nein.** Wäre mit dem Brandalarm und dem Denkmal-Signal zu verwechseln; ein Handelsgeräusch darf nie wie ein Warnsignal klingen (Lautstärke-Hierarchie: Signale laut, Rückmeldungen leise). |
| Synth `BELL` (`buildSounds.ts:67`, Kapelle)      | Nein, gleicher Grund, dazu ein Bau-Klang der Kapelle.                                                                                                                                        |
| Synth `WATER` (Plankenklopfen und Plätschern)    | **Ja als Grundlage:** Holz an Wasser ist genau das Anlegen. Eigene Figur, aber dieselbe Bausteinsprache (`tone`/`burst`), keine Datei.                                                       |
| `coins.mp3`, Münz-Figur `coin`                   | Nein (Einnahmen, kein Schiff).                                                                                                                                                               |
| Umgebungsschleifen (`sea`, `gulls`)              | Nein (Dauer, kein Ereignis).                                                                                                                                                                 |

**Ergebnis:** kein Asset nötig. Empfohlen ist eine **neue synthetische Figur** `shipDock` («Holzstoss»: dumpfer Anschlag Ton 150 → 90 Hz, 0,09 s, dazu ein kurzer gefilterter Rausch-Impuls als Tauknarren), Spitzenpegel jedes Bausteins ≤ 0,08 auf dem Effekte-Bus, kein Ducking.

**Option Asset (nicht empfohlen vor Playtest):** Klingt die Synthese nach dem Hörtest (`qa-playtester` mit `debugState`, Nutzerurteil) zu dünn, kommt ein CC0-Sample (kurzes Anlegen/Schiffshorn, ≤ 30 KB, mp3 mono) nach ADR-011 dazu: `art-asset-scout` liefert Kandidaten, `art-license-checker` prüft vor dem Einbau (Veto gilt), `art-audio-engineer` schneidet, legt nach `public/audio/sfx/`, trägt Zeile in `docs/CREDITS.md` und Lizenztext in `docs/licenses/` ein, `manifest.ts` nimmt die Datei in `SFX_FILES` auf (synthetischer Rückfall bleibt), `tests/assets/` Budget und Prüfsumme. Das ist ein eigenes Folgepaket, kein Teil von P2.

### Gestaltung und Pegel

- **Ereignis** `shipDock` (neuer Wert in `SoundEvent`, `sound.ts`), kein Eintrag in `SFX_FILES`, `figures.shipDock` synthetisch. `FIGURE_S` ohne Eintrag: keine Absenkung von Musik und Umgebung. `THROTTLE_MS.shipDock = 4000` (global, gemessen an `ctx.currentTime`, also in Echtzeit: bei Tempo 4× laufen Schiffe viermal so schnell, der Klang nicht öfter als alle 4 s).
- **Pegel-Hierarchie:** Spitze `shipDock` ≤ 0,08, also unter `coin`, `build`, `order` und weit unter `alarm`/`stormWarning`/`monumentDone`; er ist die leiseste Rückmeldung nach den Arbeitsgeräuschen. Gegen I-120 (Wohlstandsklang `upgrade`) und `coin`: anderes Klangbild (tief, dumpf, ohne Dur-Akkord), damit er nicht als Münzton gehört wird.
- **Auslöser** (UI, rein, ohne Sim-Import in `src/audio/`): `SoundSnapshot` bekommt `ships: Record<number, number>` (Schiffs-id → `port`), gefüllt in `soundSnapshot(world)`. `diffSoundEvents` meldet `shipDock`, **höchstens einmal je Frame**, wenn mindestens ein Schiff in beiden Snapshots vorkommt und sein `port` sich geändert hat. Neue ids (Kauf) und verschwundene (Verkauf) sind kein Anlegen. Ankunft und Abfahrt im selben Tick sind ein Klang. Heimkehr ohne Route (`port` → 0) ist ebenfalls ein Klang.
- **Gehört auch ausserhalb des Bildes:** Es gibt keine Sichtbarkeitsprüfung (Absicht: Kamera woanders, Route trotzdem hörbar).
- **Pause, Stumm, Tab verborgen:** wie die übrigen Ereignisse (`play` prüft Stumm und `setHidden`); in der Pause ändert sich `port` nicht, also kein Klang.
- **Entartung:** vier Schiffe auf kurzen Routen: Entprellung 4 s global begrenzt das Dauerläuten auf einen leisen Schlag je 4 s; Pegel klein. Ob das trotzdem ermüdet, entscheidet der Hörtest, Gegenmassnahme wäre ein Schalter in den Einstellungen (nicht Teil dieses Pakets, Designfrage 5).

### Abnahmekriterien Klang

Vitest (`tests/ui/soundEvents.test.ts` ergänzt; `tests/audio/sound.test.ts` ergänzt, Fake-`AudioContext`; `tests/audio/shipDock.test.ts` neu bei Bedarf):

- AK-K1 Auslöser: zwei Snapshots, in denen ein Schiff gleicher id einen anderen `port` hat → `diffSoundEvents` enthält genau einmal `shipDock`; zwei Schiffe im selben Frame → ebenfalls genau einmal.
- AK-K2 Kein Klang: gleicher `port` (fährt, liegt, Pause); neue Schiffs-id (Kauf); fehlende id (Verkauf); `to` ändert sich ohne `port` (Abfahrt vom Hafen ohne Ankunft) → jeweils keiner.
- AK-K3 Echter Ablauf: Welt mit Route, `tickShips` bis zur Ankunft: der Snapshot-Vergleich vor und nach dem ankommenden Tick liefert `shipDock`; im selben Tick abgelegt (`to !== null` nach dem Tick) ändert nichts am Ergebnis. Heimkehr ohne Route liefert ebenfalls einen Klang.
- AK-K4 Sim unberührt und Importregel: `soundSnapshot` liest nur; `src/audio/` importiert weiterhin nichts aus `src/sim/` oder `src/ui/` (bestehende Prüfung/ESLint-Regel grün); `src/sim/` ohne Diff.
- AK-K5 Wiedergabe: Fake-`AudioContext`: `play('shipDock')` erzeugt Bausteine, jeder mit Spitze ≤ 0,08, keine Quelle aus einem geladenen Sample; `SFX_FILES` und `public/` unverändert.
- AK-K6 Entprellung: zweiter Aufruf < 4000 ms (an `ctx.currentTime`) später wird nicht gespielt, einer ≥ 4000 ms später ja; `debugState().events.shipDock` zählt nur die gespielten.
- AK-K7 Hierarchie: Tabellentest über die Spitzenpegel: `shipDock` < `coin` und < `build` und < `order` < `alarm`; `FIGURE_S.shipDock` nicht vorhanden (kein Ducking: `debugState().duck` bleibt 1).
- AK-K8 Stumm/verborgen/ohne Entsperren: `play('shipDock')` erzeugt keine Bausteine bei `muted`, bei `setHidden(true)` und vor `unlock()`.
- AK-K9 Laden: Der erste Frame nach Laden eines Spielstands oder neuem Spiel löst keinen Klang aus (Test an der Stelle, an der `prevSnap` gesetzt wird; falls `app.ts` den Stand nicht neu aufsetzt, ergänzt der Plan diese Zeile und einen Test in `tests/ui/`).
- AK-K10 Assets: `tests/assets/` (Budget, Prüfsummen) unverändert grün (kein neues Asset).

Browser-Check (`qa-playtester`, Headless, über `debugState().events`): AK-K11 Spiel mit einer Route zwischen zwei Inseln, Kamera auf der Heimatinsel, Tempo 4×: `events.shipDock` steigt je Ankunft um 1, höchstens alle 4 s; in der Pause bleibt er stehen; Hörurteil des Nutzers (Warteschlange) steht aus, Hinweis im Playtest-Bericht.

Zusammen 24 Abnahmekriterien (13 Kielwasser, 11 Klang, je eines davon Browser-Check).

## Konflikte und Startbedingung

Geprüft per `git diff main...<branch>` (`--stat`, `--name-only`, hunk-Zeilen mit `-U0`):

| Strang                                                         | Berührung mit LEBEN-SEE                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ORT-A (`feat/ort-a-k1`, `…k2`)                                 | `ship.ts`, `shipLane.ts`, `src/audio/`, `soundEvents.ts`: **nicht berührt**. `renderer.ts`: K2 ändert u. a. Z. 749–770 (Schattenblock) und 805–810 (Objektdurchgang, Deko), K1 Z. 759–770 und 805–811; der geplante Aufruf `drawWake` steht bei Z. 807 und Z. 974 → **Textkonflikt bei Z. 807 wahrscheinlich**, klein. `limits.ts`: beide fügen Zeilen nach `riseSparks` ein → LEBEN-SEE ändert `limits.ts` bewusst **nicht**. `src/ui/app.ts` (16 Zeilen, Messhaken): LEBEN-SEE ändert `app.ts` nicht (nur ggf. eine Zeile für AK-K9). |
| LEBEN-STRASSE (`feat/leben-strasse`)                           | `renderer.ts` Z. 638, 811–817 (`drawWalker`/`drawErrandLoad` direkt unter `drawShip` Z. 807–808): **benachbarte Zeilen**, Textkonflikt möglich; sonst keine gemeinsame Datei. LEBEN-SEE braucht `pace.ts`, `RenderFx.speed` und `tickClock` nicht (Teil P1, Pause und Tempo).                                                                                                                                                                                                                                                           |
| SEERECHT (`plan/seerecht`, T03 Render-Cache)                   | T03 ändert `shipLane.ts` (`ticksCache`, `cachedTicks`, Doku Z. 20 und 89) und `tests/render/shipLane.test.ts`, **Signatur von `shipPose` bleibt**. LEBEN-SEE ändert `shipLane.ts` nicht und liest nur `shipPose` und `lanePoints`; darum **kein Dateikonflikt**. Fachlich profitiert die Spur: sie folgt der wirksamen Fahrzeit (8 Ticks) automatisch. AK-W4 braucht `council[4]`-Fixture (`decree`, `laneWorld`) aus SEERECHT T01; steht der Merge aus, wird AK-W4 an die Fahrzeit-Variante gebunden, die dann existiert.              |
| Audio-Dateien (`sound.ts`, `soundEvents.ts`, `buildSounds.ts`) | in keinem der genannten Stränge geändert (Dateiliste aller sechs Branches ohne Treffer).                                                                                                                                                                                                                                                                                                                                                                                                                                                |

**Startbedingung:**

- **P2 Klang** (`sound.ts`, `soundEvents.ts`, Tests): startet **sofort**, kein Konflikt, nicht blockiert.
- **P1 Kielwasser, Teil 1** (`wake.ts` und `tests/render/wake.test.ts`, neue Dateien, nur `shipPose` lesend): startet **sofort**.
- **P1 Kielwasser, Teil 2** (zwei Aufrufzeilen und ein Import in `renderer.ts`): **nach dem ORT-A-Merge**, auf die neue main rebasiert; steht LEBEN-STRASSE dann ebenfalls aus, danach rebasen, wer später mergt. Das ist der einzige wartende Task, rund 4 Zeilen.
- SEERECHT muss **nicht** abgewartet werden.

Datei-Ownership im Plan: LEBEN-SEE besitzt `src/render/wake.ts`, `tests/render/wake.test.ts`, `tests/ui/soundEvents.test.ts` (Ergänzung), `tests/audio/shipDock.test.ts`; teilt `renderer.ts` (4 Zeilen) mit ORT-A und LEBEN-STRASSE; ändert `sound.ts` und `src/ui/soundEvents.ts` allein.

## Aufwand, Dokumentation

Grösse S + S. P1: `wake.ts` (Spurpunkte, Form, Deckkraft, Zeichner) mit Tests, 4 Zeilen im Renderer, Browser-Galerie. P2: ein `SoundEvent`, eine Figur, Snapshot-Feld, Differenz, Entprellung, Pegel-Test. Mitzuführen: `docs/arc42.md` (Render: Schiffe, Spur; Audio: Ereignis), `README.md` (Abschnitt Leben/Ton: «Schiffe ziehen ein Kielwasser, ein leiser Anlegeton meldet die Ankunft»). Kein neues ADR nötig (Darstellung und Klang ohne Architekturentscheidung; ADR-012 und ADR-011 unverändert). Reihenfolge: P2 und P1 Teil 1 parallel (kein gemeinsamer Besitz), P1 Teil 2 zuletzt.

## Designfragen (Entwürfe mit Empfehlung lead-art)

1. **Spur entlang der Fahrlinie (gekrümmt) oder gerade hinter dem Schiff?** Empfehlung: entlang der Fahrlinie über `shipPose` (zeigt Kurven um Küsten, braucht keine Richtung am Rumpf, unabhängig von `shipLane.ts` und Seerecht). Gerade wäre einfacher, würde aber in Kurven neben dem Wasser liegen.
2. **Bodendurchgang (wie Schatten) oder unmittelbar vor dem Rumpf?** Empfehlung: unmittelbar vor dem Rumpf (ein Aufruf je Stelle, kein Eingriff in den ORT-A-Schattenblock Z. 749–770). Nachteil: sehr selten schneidet die Spur ein vorderes Gebäude am Hafen; die Lane ist Wasserroute, im Browser-Check zu prüfen. Fällt es auf, wandert der Aufruf in den Bodendurchgang nach dem ORT-A-Merge.
3. **Länge 3 Kacheln, V-Öffnung 0,06 → 0,33, Deckkraft 0,40 → 0,06:** Empfehlung wie festgelegt, alle Werte stehen zentral in `wake.ts` und sind im Browser-Check (AK-W13) abstimmbar.
4. **Nur Anlegen oder auch Ablegen (Idee: ein Schlag, zwei Schläge)?** Empfehlung: ein Klang je Hafenaufenthalt, weil Ankunft und Abfahrt im selben Tick liegen (Befund oben); ein zweiter Klang wäre nicht zu trennen und verdoppelte die Ermüdung.
5. **Ermüdungsschutz:** 4 s Entprellung genügt für den Start. Empfehlung: kein Einstellungsschalter, erst nach Hörurteil; der Pegel 0,08 und der dumpfe Klang sind die erste Gegenmassnahme.
6. **Synthese oder Sample:** Empfehlung Synthese zuerst (kein Lizenzweg, keine Bytes), Sample nur als Folgepaket nach Hörurteil (Option Asset oben). Das ist ein Hörurteil des Nutzers und keine Lizenzfrage; geht über die Warteschlange erst, wenn ein Asset ernsthaft in Betracht kommt.
7. **Rumpf in Fahrtrichtung spiegeln (nicht beauftragt)?** Empfehlung: zurückstellen. Die Spur trägt die Richtung; eine Spiegelung ändert `drawShip`, Treffer (`shipAt`) und Saum und gehört, falls gewünscht, in ein eigenes Kurzdesign.
