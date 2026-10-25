# UI-HAEPPCHEN-J: I-176 Warnmeldungen bleiben stehen, I-139 Ratsbeschluss in der Chronik, I-138 Rats-Karte nennt die Wirkung (Kurzdesign, Stufe leicht)

Stand 2026-10-25 · Paket UI-HAEPPCHEN-J · Quelle: R861, `docs/ideen.md` I-138 und I-139, I-176 (Branch `docs/ideen-16`, noch nicht auf main), Vorlage `docs/superpowers/specs/2026-10-22-ui-haeppchen-h-design.md` · Grösse je S · Save: **nein** (`SAVE_VERSION` unverändert, nichts Neues im Spielstand) · Baseline/Balancing: unberührt · Spielwert in `src/sim/defs/`: keiner neu (Anzeigedauer ist UI-Konstante, Regel P1.1) · Assets: keine · `src/sim/`: nicht berührt

Drei unabhängige Teile; Quelldateien überschneiden sich nicht (`messages.ts` / `council.ts`, `councilCard.ts` / `inspect.ts`, `app.ts` je wenige Zeilen). Ein Plan, drei Pakete.

Befund vorab (Code, main @ e9e00701): (a) **Kulanz** (Stammkunde «wartet, diesmal ohne Strafe») landet schon im Ereignis-Log (`contractLogEntries`, `src/ui/autoLog.ts`); der Teil «Kulanz» von I-139 entfällt. Kulanz ist zudem kein einmaliger Zustand («verbraucht»), sondern wiederholbar. (b) **Umschalt+R ohne Marke** ist schon behoben (`councilToggleAllowed`, `src/ui/council.ts`); der Beipack-Teil von I-138 entfällt. (c) Die Idee nennt «Marktrecht, Zunftrecht»; diese gibt es nicht. Die sechs Beschlüsse stehen in `src/sim/defs/council.ts` (Webordnung, Glockenrecht, Brennrecht, Wohnordnung, Glasrecht, Hofrecht). (d) «Inselchronik» ist die Ruhe-Ansicht (`updateRest` in `src/ui/inspect.ts`, Zeilen `rest-monument`, `rest-trial`), aus der Welt **abgeleitet**, nichts gespeichert. Der Ereignis-Log (`state.eventLog`, mit Tick) ist reiner UI-Zustand, nicht im Spielstand.

## Teil P1: I-176 Warnmeldungen bleiben lange genug stehen

### Spielerzweck

Der Spieler sieht eine Warnung (Sturm, Brand, Stammkunde wartet) auch bei 4× noch lange genug, um zu reagieren, statt sie erst im Ereignis-Log zu bemerken. Säule: Bedienung (Krisen lesbar); stützt Bevölkerung versorgen. Heute verschwindet jede nicht klebende Meldung nach 3 s (`src/ui/messages.ts`, `appendToast`).

Nicht dazu: kein Pausieren bei Krise (I-058 geparkt), keine Änderung von `MAX_TOASTS` (3) und `DEDUPE_MS`, keine neue Meldungsart, keine Hover-Pause (F1), kein Ton, keine Sim-Änderung.

### Regeln

1. **Dauer je Art:** UI-Konstante `TOAST_MS` in `src/ui/messages.ts` (kein Spielwert, nicht in `defs/`): `warn` 7000, `info` 3000, `error` 3000. Reine Funktion `toastLifetimeMs(kind): number`; `appendToast` ruft sie statt der festen 3000. Klebende (`sticky`) Meldungen bleiben unverändert (kein Ablauf).
2. **Echtzeit:** Die Dauer läuft in Echtzeit, weder Tempo noch Pause ändern sie (heute `setTimeout`, bleibt).
3. **Verdrängung unverändert:** Ab der vierten Meldung fällt die älteste nicht klebende heraus; `replaceMessage` mit Platz (`slot`) ersetzt wie bisher. Mehrere Warnungen in Folge dürfen also nie mehr als drei Karten stehen lassen.
4. **Randfälle:** Meldung wird vor Ablauf verdrängt oder per Klick (`closable`) geschlossen: der Zeitgeber findet das Element schon entfernt (`remove()` ist folgenlos). Gleiche Warnung innerhalb `DEDUPE_MS` erscheint nicht doppelt. Ende der Partie / «Neue Insel»: bestehende Meldungen laufen aus wie heute.

### Abnahmekriterien

Vitest (`tests/ui/messages.test.ts`, kein DOM nötig, reine Funktion):

- AK-J1 `toastLifetimeMs('warn') === 7000`, `'info'` und `'error'` je 3000; sticky bleibt davon unberührt (kein Ablauf; Browser-Check AK-J2).
- AK-J1b Jede Meldungsart aus `showMessage`s Typ (`'info' | 'error' | 'warn'`) hat einen Eintrag (Exhaustive-Check, kein `undefined`).

Browser-Check (`qa-playtester`, Headless): AK-J2 Sturm oder Brand bei 4× auslösen: die Warnung steht etwa 7 s (Echtzeit), eine Info-Meldung etwa 3 s; drei Warnungen kurz hintereinander: höchstens drei Karten, älteste fällt zuerst. AK-J3 Pause (Leertaste) während einer Warnung: Ablauf unverändert 7 s.

## Teil P2: I-139 Ratsbeschluss in der Inselchronik

### Spielerzweck

Der Spieler liest in der Inselchronik «Rat: Webordnung · Brennrecht» und im Ereignis-Log «Rat beschliesst: Webordnung» und erkennt den Weg seiner Insel. Säule: Insel besiedeln (Rückblick). Heute steht ein gefasster Beschluss nur in der Rats-Karte.

Nicht dazu: keine Zeitangabe in der Chronik-Zeile (kein Tick im Spielstand, Save-Wechsel verboten), kein Kulanz-Eintrag (schon vorhanden), kein Speichern des Logs (I-125 verworfen), keine Sim-Änderung.

### Regeln

1. **Chronik-Zeile (abgeleitet):** reine Funktion `councilChronicleLine(world): string | null` in `src/ui/council.ts`. `null`, solange `councilBadge(world) === null` (nie ein Beschluss offen) oder kein Beschluss gefasst und keiner offen. Sonst `Rat: <Namen>` mit den Namen der gefassten Beschlüsse in Stufenfolge, getrennt durch « · » (z. B. `Rat: Webordnung · Brennrecht`), und `— n offen`, wenn `openCouncilTiers(world).length = n > 0` (nur offen: `Rat: n Beschluss offen`). Eine Zeile, kein Mehrzeiler (Ereignisflut ausgeschlossen).
2. **Anzeige:** neue Zeile `rest-council` in der Ruhe-Ansicht (`addLine`/`setField` wie `rest-trial`, `src/ui/inspect.ts`), nach `rest-trial`; `hidden`, wenn `null`.
3. **Log-Eintrag (UI-Zustand):** reine Funktion `councilDecided(prev, next): CouncilTier[]` neben `councilOpened` (Stufen, die von `'open'` auf `'A'`/`'B'` wechselten; `prev === null` ergibt `[]`) und `councilDecidedEntries(prev, next, tick): LogEntry[]` mit Text `Rat beschliesst: <Name>` (`toast: null`, `tick`). `app.ts` ruft sie dort auf, wo `councilOpened` steht (`prevCouncil`), schiebt per `pushLog` und `nextUnread` in den Ereignis-Log. Laden setzt `prevCouncil` auf den geladenen Stand, erzeugt also keine Doppeleinträge; «Neue Insel» ebenso.
4. **Höchstens drei Eintragsarten** in der Chronik-Zeile: gefasst, offen, leer; kein Eintrag je Hebel.
5. **Randfälle:** Beschluss und Laden im selben Frame: kein Eintrag. Mehrere Stufen gleichzeitig (Sprung): je ein Log-Eintrag, eine Zeile. Altstand ohne Beschluss: Zeile `null`, kein Wurf.

### Abnahmekriterien

Vitest (`tests/ui/council.test.ts`):

- AK-J4 `councilChronicleLine`: ohne Marke `null`; nur offen `Rat: 1 Beschluss offen`; Stufe 2 gewählt A `Rat: Webordnung`; Stufe 2 A und 3 B `Rat: Webordnung · Wohnordnung`; gefasst und noch eine offen `Rat: Webordnung — 1 offen`.
- AK-J5 `councilDecided`: `open → A` meldet die Stufe, `null → open` und `A → A` nicht, `prev === null` ergibt `[]`.
- AK-J6 `councilDecidedEntries`: Text `Rat beschliesst: Glockenrecht`, `toast === null`, `tick` durchgereicht, keine Zielangabe.
- AK-J7 Reine Lesefunktionen: Welt vorher/nachher `serialize`-gleich; `SAVE_VERSION`, Replay-Hash/Baseline und `tests/sim/balance.test.ts` unverändert (nur der Lauf).

Browser-Check: AK-J8 Beschluss fassen: Ruhe-Ansicht (Inselkarte ohne Auswahl) zeigt `Rat: …` mit dem Namen; Ereignis-Log trägt «Rat beschliesst: …»; Seite neu laden: Chronik-Zeile bleibt, im Log kein zweiter Eintrag; «Neue Insel»: Zeile weg.

## Teil P3: I-138 Rats-Karte nennt die Wirkung vorab

### Spielerzweck

Der Spieler liest unter «Webordnung» «Betrifft jetzt: 3 Webereien», unter «Glockenrecht» «Betrifft jetzt: 0 Kapellen» und weiss vor der einmaligen Wahl, was sie ihm heute bringt. Säule: Bevölkerung versorgen und aufsteigen lassen. Der Kartentext nennt die Wirkung schon allgemein; die Zeile macht sie für die eigene Insel konkret.

Nicht dazu: keine Reichweitenkreise (Versorgungsebene gehört zur Stadtplanung), keine Prognose künftiger Gebäude, keine Empfehlung «besser», keine Änderung der Beschlusswerte oder des Rats-Ablaufs, kein neuer Spielwert.

### Regeln

1. **Reine Funktion** `councilPreview(world, tier, side): string` in `src/ui/council.ts`, liest `COUNCIL[tier][side].lever` und die Welt, schreibt nichts. Rückgabe in `CouncilCard` als neues Feld `preview`; `councilCards` füllt es; `councilCard.ts` zeigt es als eigene Zeile unter dem Kartentext (kleiner, gedämpft; Klasse im vorhandenen Stil).
2. **Je Hebelart** (Zahlen über alle Inseln, nur stehende Gebäude des Typs; Namen aus `BUILDING_DEFS`, keine Texte im Code ausser dem Rahmen):
   - `cycle` (`defId`): `Betrifft jetzt: n <Gebäudename Plural>` (Plural als einfacher Zusatz; der Umsetzer wählt eine Form, die für Weberei, Brennerei, Glashütte stimmt, z. B. «n × Weberei»).
   - `serviceRadius` (`defId`): gleiche Form (Kapellen); keine Berechnung von Häusern in Reichweite (F2).
   - `maxInhabitants` (`tier`): `Betrifft jetzt: n Häuser (+m Plätze)` mit n = stehende Häuser dieser Stufe, m = n × (Hebelwert − heutiger Wert aus `defs`).
3. **Nichts vorhanden:** n = 0 → `Wirkt noch nicht: <Name> fehlt` (Beschluss bleibt wählbar, kein Sperren).
4. **Entschiedene Stufe:** keine Karten, also keine Zeile (Karten nur für offene Stufen, wie heute).
5. **Live:** die Zeile folgt dem Weltzustand beim Aufbau der Karte; ändert sich der Bestand bei offener Karte, genügt der nächste `update` (kein eigener Takt).
6. **Wahl bleibt echt:** die Zeile nennt Zahlen, keine Wertung. Zeigen die Zahlen eine Seite dauerhaft als schlechter (z. B. 0 gegen 12), ist das ein Balancing-Befund zu I-112 und gehört in `docs/beobachtungen.md`, nicht in die Anzeige.

### Abnahmekriterien

Vitest (`tests/ui/council.test.ts`, `tests/ui/councilCard.test.ts`):

- AK-J9 `councilPreview` für `cycle`: Welt mit 3 Webereien (zwei Inseln) → Text enthält `3`; ohne Weberei `Wirkt noch nicht` und den Gebäudenamen.
- AK-J10 `serviceRadius`: n Kapellen gezählt; 0 → `Wirkt noch nicht`.
- AK-J11 `maxInhabitants` (Stufe 3): n Bürgerhäuser und `+n` Plätze (Hebelwert 16 minus Grundwert aus `defs`, nicht hart codiert: Test liest beide aus `defs`).
- AK-J12 `councilCards` liefert `preview` für alle zwei Karten jeder offenen Stufe; entschiedene Stufe erzeugt keine Karte.
- AK-J13 Karte (`councilCard`): Vorschau steht in einem eigenen Element nach dem Kartentext; Auswahl und «Beschluss fassen» ändern sich nicht (bestehende Tests grün).
- AK-J14 Reine Lesefunktion: Welt vorher/nachher `serialize`-gleich; Baseline und Balancing unverändert.

Browser-Check: AK-J15 Rat öffnen mit Webereien auf der Insel: Zeile mit der Anzahl unter «Webordnung»; Kapelle abreissen/bauen und Karte neu öffnen: Zahl folgt.

## Überschneidungen

- `src/ui/app.ts`: P2 ergänzt wenige Zeilen bei `prevCouncil` (um Zeile 1002), nichts am Autosave/Ladepfad (UI-HAEPPCHEN-H). `src/ui/inspect.ts`: nur `buildRest`/`updateRest` (eine Zeile). `src/style.css`: P3 eine Klasse, P1 keine CSS-Änderung (F1 ohne Hover). Mit UI-BEIPACK-FERN auf main (R861-Bedingung) keine offene Überschneidung bekannt; Umsetzer prüft `git diff` gegen main vor dem Start.
- README: P1 (Meldungen: Warnungen bleiben 7 s), P2 (Chronik-Zeile «Rat»), P3 (Vorschauzeile in der Rats-Karte, Abschnitt «Rat»).

## Zuschnitt und Dateien

Ein `tech-ui-engineer`, drei Aufgaben (P1 ≈ 25, P2 ≈ 30, P3 ≈ 35 Tools). Dateien: `src/ui/messages.ts`, `src/ui/council.ts`, `src/ui/councilCard.ts`, `src/ui/inspect.ts`, `src/ui/app.ts` (wenige Zeilen), `src/style.css` (eine Klasse), `README.md`; Tests `tests/ui/messages.test.ts`, `council.test.ts`, `councilCard.test.ts`. Kein `src/sim/`, kein Save, keine Abhängigkeit.

## Designfragen für L0 (Entwürfe mit Empfehlung)

- **F1 Hover-Pause der Warnung (Idee I-176)?** Empfehlung: **streichen**. Die Meldungsfläche ist `pointer-events: none` (`src/style.css`, `.messages`); Hover bräuchte `pointer-events: auto` und würde Karten-Klicks unter der Meldung schlucken, bei 4× schädlich. 7 s lösen das Problem.
- **F2 Wirkungszeile mit Zahl Häuser in Reichweite (Kapelle)?** Empfehlung: nein, nur Anzahl der Gebäude (kein Versorgungs-Rechenlauf in der UI, Perf und Duplizierung der Sim-Logik).
- **F3 Kulanz-Eintrag und Umschalt+R:** Empfehlung: als erledigt streichen (beide im Code vorhanden, Befund oben); I-139/I-138 im Pool entsprechend kürzen.
- **F4 Ratsbeschluss mit Minute?** Empfehlung: Log-Eintrag trägt den Tick (Zeitstempel im Log), die Chronik-Zeile nicht (kein Save-Wechsel). Ein Zeitstempel im Spielstand wäre Save-Version und gehört nicht in ein Häppchen.

## Selbstprüfung (Gate Brainstorming)

| Frage               | Befund                                                                                                                                                                                        |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Säule               | P1 Bedienung (Krisen lesbar), P2 Insel besiedeln (Rückblick), P3 Bevölkerung versorgen (informierte Weiche). Bei Fehlschlag bleibt das Spiel gleich, es fehlt Komfort.                        |
| Echte Wahl          | P3 informiert nur, wertet nicht; die Wahl bleibt zwischen zwei Hebeln. P1/P2 ohne Entscheidung. Keine dominante Option; Scheinwahl-Befund geht als Balancing-Beobachtung weiter (P3 Regel 6). |
| Rückkopplung        | Keine; keine Änderung an Sim oder Wirtschaft. Gewollt: früheres Reagieren auf Krisen bei hohem Tempo.                                                                                         |
| Randfälle           | Warnungsflut (MAX_TOASTS), Verdrängung, Pause; Laden und Neue Insel ohne Doppeleintrag, Altstand ohne Beschluss; Bestand 0 (wählbar), mehrere Inseln, Sprung mehrerer Stufen.                 |
| Einfachere Variante | P1 ohne Hover (F1), P2 ohne Minute in der Chronik (F4), P3 nur Anzahl statt Reichweite (F2): jeweils die einfachere Variante mit gleicher Spielerwirkung.                                     |

Urteil Selbstprüfung: OK.
