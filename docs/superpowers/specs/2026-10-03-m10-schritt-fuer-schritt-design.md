# M10 „Schritt für Schritt" — Designvorschlag

Datum: 2026-10-03 · Paket H-D1 · Meilenstein M10 · Status: **Vorschlag, Gate Brainstorming bestanden (R155)** ·
Prozessstufe voll (neues System, Save v5). Das Dokument ist **keine Spec**: Es hat keine Abnahmekriterien. Die Spec
mit AK: [2026-10-03-m10-schritt-fuer-schritt-spec.md](2026-10-03-m10-schritt-fuer-schritt-spec.md).

Grundlage: Nutzerfeedback S11 (Nachtrag), S5, S9, G9 (`.studio/handoffs/nutzerfeedback-2026-10-02.md`), Programm
`docs/superpowers/specs/2026-10-02-programm-nutzerfeedback.md` §3.5, §3.7, §3.8, §4, §6, §7, §8 (F3, F4, F9, F14),
Rulings R147, R148, R150–R152, M8-Spec §4.2–4.3, §14, §16, §23 (S11-Minimum: `unlockTier`, `buildLock`,
Freischalt-Meldung), `docs/beobachtungen.md` (Eintrag „Gesperrtes vor der Freischaltung sichtbar"), Code auf `main`
(`tests/sim/controller.ts`, `src/sim/tick.ts`, `population.ts`, `placement.ts`, `trade.ts`, `orders.ts`, `tax.ts`,
`src/ui/guide.ts`, `hints.ts`, `buildMenu.ts`, `hud.ts`, `hotkeys.ts`, `menu.ts`, `startCard.ts`). Werte und Messprobe:
`design-economy-designer` (Abschnitt 9, markiert **[Werte]**).

## 1. Spielerzweck und Zeitbild (a)

**Spielerzweck in einem Satz:** „Am Anfang sehe ich nur, was ich brauche; jedes Mal, wenn meine Leute etwas Neues
wollen, kommen neue Bauten und Werkzeuge mit einer Meldung, und die Hilfe sagt mir, was als Nächstes kommt."

**Was der Spieler fühlen und entscheiden soll:**

- **Fühlen:** Übersicht statt Überforderung. Die Bauleiste beginnt mit vier Gebäuden. Jede neue Stufe ist ein kleines
  Fest: Meldung, neue Einträge, neue Symbole. Das Spiel wächst mit dem Spieler, nicht vor ihm.
- **Entscheiden:** Wann baue ich die Amtsstube (Unterhalt gegen Steuerhebel)? Sperre ich Stoff für Siedler, damit
  die Bürger satt bleiben? Kaufe ich Werkzeug zu, bis Bürger und Schule den Werkzeugmacher tragen? Rode ich Wald für
  Weideflächen?
- **Spielschleifen:** kurz — Mouse-over erklärt, was unter dem Zeiger liegt; mittel — „Haus voll → Bedürfnis →
  Freischaltung → neue Kette" in Minuten; lang — die Stufenfolge Pioniere → Kaufleute über die Partie.

**Zeitbild** (1 Tick = 100 ms bei 1×, also 600 Ticks = 1 Minute). Referenz: Controller auf Seed 3, Krisen aus,
Messprobe **[Werte]**, Abschnitt 9.1. Ein menschlicher Spieler baut früh mehr Häuser als der Controller (der nur vier
Wohnhäuser nutzt), deshalb steht daneben eine Schätzung für den Menschen.

| Freischaltung (Abschnitt 2) | Auslöser                      | Tick Controller | Minute (1×) | Schätzung Mensch |
| --------------------------- | ----------------------------- | --------------- | ----------- | ---------------- |
| U0 Start                    | Spielbeginn                   | 0               | 0           | 0                |
| U2 Siedler-Bedürfnis        | ein Pionierhaus voll          | 150             | 0:15        | 0:30–1:00        |
| U3 Erste Siedler            | erster Siedler                | 350             | 0:35        | 1:00–1:30        |
| U4 Bürger-Bedürfnis         | ein Siedlerhaus voll          | 550             | 0:55        | 1:30–2:30        |
| U1 Marktplatz               | 20 Wohnhäuser                 | — (nie)         | —           | ≈ 3:30           |
| U5 Erste Bürger             | erster Bürger                 | 3850            | 6:25        | 6–8              |
| U6 Kaufleute-Bedürfnis      | Stufe 4 offen (`tierLock` M8) | 6050 (Sieg)     | 10:05       | 10–14            |

Krisen „normal" mit Feuerwache: U2 150, U3 350, U4 550, U5 4750, Sieg 7050. Menschliche Schätzung: Startholz 40
reicht für 5–6 Häuser in rund 60 s, danach etwa ein Haus je 105 Ticks (zwei Holzfäller oder Zukauf) **[Werte]**.

**Lesart:** Der Anfang ist dicht (drei Freischaltungen in den ersten ein bis zwei Minuten), weil Pioniere und
Siedler ihre Häuser schnell füllen. Das ist gewollt: Genau dort lernt der Spieler die Grundkette. Danach öffnet sich
der Abstand (Marktplatz ≈ Minute 3–4, Bürger ≈ Minute 6–8, Kaufleute nach dem Sieg). Im ersten Spiel von
15 Minuten erlebt der Spieler damit fünf bis sechs Meldungen. Die Bitgleichheit lässt **keine spätere** Lage von U2
und U4 zu (Kapelle baut der Controller bei Tick 200, Abschnitt 7); das Gegenmittel gegen Überforderung am Anfang
ist deshalb die Zusammenfassung der Meldungen (3.1) und die Hilfe, nicht ein späterer Auslöser.

## 2. Freischaltbaum (b)

### 2.1 Grundsätze

1. **Zwei Arten von Sperren, sauber getrennt.**
   - **Freischaltung** (monoton, gespeichert in `world.unlocked`): Ab wann _gibt es_ ein Gebäude, ein Gut im Handel,
     eine Funktion. Auslöser sind Ereignisse, die der Spieler sieht (vor allem „das Bedürfnis entsteht").
   - **Bedingung** (live, nicht gespeichert): Was ein _stehendes Gebäude_ braucht, damit eine Funktion wirkt.
     Steuerregler und Ausgabesperre brauchen eine Amtsstube; der Werkzeugmacher arbeitet nur mit Schule in Reichweite.
     Fällt das Gebäude weg, fällt die Wirkung weg.
2. **Das Bedürfnis der Stufe t+1 entsteht, sobald ein Haus der Stufe t voll belegt ist** (Wortlaut S11: „erst, wenn
   die Bevölkerung das Bedürfnis entwickelt hat"). Das ist genau `planTier` im Referenz-Controller; daraus folgt die
   Bitgleichheit (Abschnitt 7).
3. **Monoton:** Einmal frei bleibt frei. Ein schrumpfendes Haus sperrt nichts. Der Rücksprung aus M8 (§23 Punkt 3,
   Hebel `unlockCitizens`) entfällt damit.
4. **Die Regel liegt in der Sim**, nicht nur in der UI: `placeBuilding`, `buy`, `sell`, `deliverOrder`,
   `clearForest`, `plantForest`, `setTaxLevel`, `setGoodLock` liefern bei Sperre `{ ok: false, reason }`. Die UI blendet
   nur aus, was die Sim ohnehin ablehnt.
5. **Werte und Texte als Einträge** in `src/sim/defs/unlocks.ts`, kein Schwellwert im Code.
6. **Eine Freischaltung, eine Meldung, ein Tipp** (Abschnitt 3).

### 2.2 Baum

| Id  | Auslöser                                                          | Gebäude (Taste)                                                          | Güter im Handel und Lager      | Funktionen                         | UI-Elemente                                                 | Begründung im Setting                                                                                            |
| --- | ----------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------ | ---------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| U0  | Spielbeginn                                                       | Weg (R), Wohnhaus (H), Holzfäller (L), Fischerhütte (F); Abriss (X)      | Holz, Werkzeug, Stein, Nahrung | Handel am Kontor, Tempo, Speichern | Geld, Bilanz, Pioniere, Ziel; vier Lager-Chips; Hilfe-Knopf | Die ersten Pioniere brauchen Dach, Holz und Fisch.                                                               |
| U1  | 20 Wohnhäuser (Abweichung von **[Werte]** 8, siehe 9.3)           | Marktplatz (M)                                                           | —                              | —                                  | Versorgungsradius des Markts im Mouse-over                  | Die Siedlung wächst über den Kontor-Radius hinaus.                                                               |
| U2  | Siedler-Bedürfnis: ein Pionierhaus voll                           | Kapelle (K), Schäferei (G), Weberei (V), Steinbruch (B), Feuerwache (E)¹ | Wolle, Stoff                   | Wald roden und aufforsten (S3)²    | Lager-Chips Wolle, Stoff; Abdeckung Glaube                  | Pioniere wollen Kleidung und Glauben; Steinbauten und Brandschutz werden nötig; Schafe brauchen Weide.           |
| U3  | erster Siedler                                                    | **Amtsstube** (neu, Taste I)                                             | —                              | Handelsaufträge                    | Einwohner-Chip Siedler; Auftragskarte                       | Eine Siedlung bekommt Verwaltung; Händler werden auf den Hafen aufmerksam.                                       |
| U4  | Bürger-Bedürfnis: ein Siedlerhaus voll                            | Schule (U), Zuckerrohrplantage (Z), Brennerei (N)                        | Zuckerrohr, Rum                | —                                  | Lager-Chips Zuckerrohr, Rum; Abdeckung Bildung              | Siedler wollen Bildung und Genuss.                                                                               |
| U5  | erster Bürger                                                     | Werkzeugmacher (T)                                                       | —                              | Ausgabesperre (S5, mit Amtsstube)  | Einwohner-Chip Bürger; Sperr-Matrix im Amtsstuben-Panel     | Qualifizierte Arbeit braucht Leute mit Schule (Wortlaut S11); erst mit drei Stufen gibt es Knappes zu verteilen. |
| U6  | Kaufleute-Bedürfnis: Stufe 4 offen (M8 `tierLock(w, 4) === null`) | Badehaus (J), Glashütte (O)                                              | Glas                           | —                                  | Lager-Chip Glas; Einwohner-Chip Kaufleute (M8 14.1)         | Bürger wollen Hygiene und Fenster (Wortlaut S11: Glashütte erst mit Bedürfnis).                                  |

¹ Die Feuerwache erscheint nur bei Krisen „mild" oder „normal"; bei Krisen „aus" bleibt sie verborgen (sie hätte
keinen Nutzen). Bedingung im Eintrag, kein Sonderfall im Code.
² Roden und Aufforsten: Sim aus H-S1 (`clearForest`, `plantForest`), Bedienung hier. Auslöser U2, weil Schäferei und
Plantage Weide brauchen und der Spieler ab dann Platz schaffen will; vorher gibt es keinen Grund zu roden
(**[Werte]** bestätigt, 9.5). Ein Holzfäller, dessen Wald gerodet wurde, arbeitet in M10 weiter (Regel „braucht
Wald" erst M11, Programm §3.7); der Mouse-over des Holzfällers zeigt dann „kein Wald mehr in der Nähe" als Warnung.

**U6 ersetzt das M8-S11-Minimum:** `buildLock` liest künftig `world.unlocked` statt `tierLock` live; `unlockTier: 4` an
Badehaus und Glashütte wird zum Eintrag U6. Die M8-Meldung „Neu freigeschaltet: Badehaus (J) und Glashütte (O) …"
wird die Meldung von U6 (Wortlaut bleibt).

### 2.3 Bedingungen (live, an Gebäude gebunden)

| Funktion                    | Bedingung                                                                                                       | ohne Bedingung                                                                                                                                                               | Werte **[Werte]**                                     |
| --------------------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| **Steuer einstellen**       | eine Amtsstube steht                                                                                            | es gilt „normal" (wirksame Stufe abgeleitet: `effectiveTaxLevel(w)`); die gewählte Stufe bleibt gespeichert und wirkt wieder, sobald eine Amtsstube steht                    | —                                                     |
| **Ausgabesperre (S5)**      | Funktion frei (U5) **und** eine Amtsstube steht                                                                 | Sperren wirken nicht (gespeichert bleiben sie); die Sperr-Matrix ist verborgen                                                                                               | —                                                     |
| **Aufstiegsstopp (Kann)**   | eine Amtsstube steht                                                                                            | wirkt nicht                                                                                                                                                                  | —                                                     |
| **Werkzeugmacher arbeitet** | eine Schule in Reichweite, angebunden und ohne Ausfall (gleiche Prüfung wie `serviceAvailable`, Mitte zu Mitte) | neuer Betriebszustand `noSchool` (wie `waitingInput`): kein Fortschritt, Unterhalt läuft weiter; Panel „Braucht eine Schule in Reichweite"; Kartenzeichen wie `waitingInput` | Radius = `school.serviceRadius` (10), kein neuer Wert |

**Warum die Steuer abgeleitet und nicht zurückgesetzt wird:** Brennt oder fällt die Amtsstube weg, springt die
Wirkung auf „normal", ohne dass ein gespeicherter Wert verloren geht. Das schliesst die entartete Strategie
„Amtsstube bauen, ‚hoch' stellen, abreissen" (Programm §3.8) und braucht keinen Abriss-Haken.

**Amtsstube** (neues öffentliches Gebäude, Silhouette Pflicht wie jedes Gebäude): Grösse, Kosten, Unterhalt
**[Werte]**, Abschnitt 9.2. Die Amtsstube hat keinen Radius und keine Versorgungswirkung; sie ist der **Ort** der
Steuer- und Verteilungspolitik. Ein Klick öffnet ihr Panel mit Steuerregler, Sperr-Matrix und (Kann)
Aufstiegsstopp. Höchstens eine Amtsstube wirkt (eine zweite bringt nichts; der Bau einer zweiten wird abgelehnt:
„Es gibt schon eine Amtsstube"). Später wohnen hier die Erlasse (Programm §3.6, Backlog).

**Ausgabesperre (S5, Programm §3.5):** Matrix „Stufe × Gut" mit den bewohnten Stufen als Zeilen und deren
freigeschalteten Bedarfsgütern als Spalten. Eine gesperrte Zelle heisst: Häuser dieser Stufe bekommen das Gut nicht;
das Bedürfnis gilt als unerfüllt (halbe Steuer, kein Wachstum, kein Aufstieg). Eine Sperre (t+1, g) blockiert auch
den Aufstieg in Stufe t+1, wenn g dort neu ist. Standard leer.

**Aufstiegsstopp (Kann):** Schalter je Stufe „Häuser dieser Stufe steigen nicht auf". Zweck: Aufstieg anhalten,
bis die Kette der nächsten Stufe steht (sanfter als Steuer „hoch", ohne Steuerwirkung). Standard aus.

**Handel:** Kaufen nur für freigeschaltete Güter; **Verkaufen**, wenn das Gut frei ist **oder** im Lager liegt (so
bleibt nach einer Migration oder einem Auftrag kein Bestand unverkäuflich). Das Handels-Panel zeigt genau diese
Güter (löst Beobachtung „Gesperrtes vor der Freischaltung sichtbar" (b), R150).

**Handelsaufträge:** Die Sim erzeugt sie weiter ab Tick 600 (Seed und Periode, kein RNG-Zustand, kein Geld). Vor U3
lehnt `deliverOrder` ab („Aufträge kommen mit den ersten Siedlern"), die UI zeigt keine Auftragskarte. Ein
verfallender Auftrag kostet nichts, also verliert der Spieler nichts. Läuft bei der Freischaltung U3 schon ein
Auftrag (der erste kommt bei Tick 600, die ersten Siedler eines Menschen oft später), erscheint seine Karte sofort
mit der Restzeit.

**Steuer „hoch" und Bedürfnis:** Bei „hoch" (Belegung 0,75) wird kein Haus voll; das nächste Bedürfnis und damit die
nächste Freischaltung entstehen nicht. Das ist folgerichtig („hoch" sperrt den Aufstieg), muss aber sichtbar sein:
`nextUnlocks` nennt in diesem Fall „Steuer ‚hoch' verhindert volle Häuser" als Fortschrittsgrund.

## 3. Freischalt-Meldung und Hilfe (c)

### 3.1 Meldung

- **Wann:** Wenn `world.unlocked` im Frame wächst. Mehrere Einträge im selben Tick werden **eine** Meldung.
  Beim Laden keine Meldung (Merkfeld wie `wonShown`: Länge von `unlocked` beim Laden).
- **Was:** Text aus dem Eintrag, Form „Neu: {Symbol Name (Taste)}, … — {Grund}", zum Beispiel „Neu: Kapelle (K),
  Schäferei (G), Weberei (V), Steinbruch (B) — deine Pioniere wollen Siedler werden. Mehr unter Hilfe (?)".
  Art `info`, bleibend bis Schliessen (wie das Siegbanner), mit Knopf „Hilfe" (öffnet die Hilfe-Karte).
- **Ton:** aus der Familie `win`, leiser Wiederverwendung (Wahl bei `lead-art`); höchstens ein Ton je Frame (wie M8
  14.1).
- **Kann:** Neue Einträge in der Bauleiste tragen ein Zeichen „neu", bis der Spieler sie einmal auswählt (nur
  UI-Zustand, nicht gespeichert).

### 3.2 Hilfe-Karte — nichts doppelt

Heute gibt es: `nextStep(world)` (Ruhe-Ansicht), `startSteps()`/`startGoal()` und die Karte „Ziel und erste Schritte"
(`openStartCard` mit `mode: 'help'`, aus dem Menü), `MAP_SIGNS`, `hints.ts` (`friendlyReason`), M8 `goalTexts`.
Vorschlag: **Die bestehende Karte „Ziel und erste Schritte" wird zur Hilfe-Karte** (gleiche Modalkarte, gleiche
Fokusregeln aus M7-UX), mit HUD-Knopf „Hilfe" neben Einstellungen und Menü und der Taste `?`. Abschnitte, jeder aus
genau einer Quelle:

| Abschnitt                    | Quelle                                                                                                                                                                                                          | neu?                 |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| Jetzt tun                    | `nextStep(world)`, unverändert als einzige Quelle für „was jetzt"                                                                                                                                               | nein                 |
| Als Nächstes freigeschaltet  | `nextUnlocks(world)` (neue reine Sim-Abfrage): nächste Einträge mit Auslöser, Fortschritt und Inhalt, z. B. „Kapelle, Schäferei, Weberei, Steinbruch — sobald ein Wohnhaus 4 Pioniere hat (jetzt 3 / 4)"        | ja (eine Funktion)   |
| Ziel und Ausblick            | `goalTexts(view)` aus M8                                                                                                                                                                                        | nein                 |
| Tipps                        | `tip` der zuletzt freigeschalteten Einträge (Texte in `defs/unlocks.ts`) und Standortregeln der freien Gebäude aus `siteText` (Bauleiste), z. B. „Schäferei: 4 Weide im Radius 2 — rode Wald, wenn es eng wird" | Texte ja, Logik nein |
| Kartenzeichen                | `MAP_SIGNS`                                                                                                                                                                                                     | nein                 |
| Erste Schritte (nur Stufe 1) | `startSteps()`                                                                                                                                                                                                  | nein                 |

- **`nextStep` filtert** künftig auf freigeschaltete Gebäude und vorhandene Bedingungen. Braucht der Rat ein
  gesperrtes Gebäude, nennt er den Auslöser („Stoff kommt mit den Siedlern: fülle ein Wohnhaus mit 4 Pionieren").
  Der Satz „… oder erhöhe die Steuer" erscheint nur mit Amtsstube; vorher „… oder baue eine Amtsstube" (ab U3).
- **Ruhe-Ansicht** behält die Zeile „Nächster Schritt" und bekommt einen Verweis „Mehr in der Hilfe (?)".
  Kopfzeile bleibt ≤ 84 px (M7:AK-UX-15): Der Knopf „Hilfe" ersetzt keinen Chip.
- **Tastenliste** im Menü (`hotkeyList`) zeigt nur freigeschaltete Werkzeuge (löst Beobachtung (a), R152 B3).
  Gesperrte Taste: Meldung „{Name}: {Auslöser}" statt Werkzeug (M8 `lockedToolText`, verallgemeinert).

## 4. Mouse-over (d, S9)

Neue reine Funktion `hoverInfo(world, tile, timeMs, extra)` in `src/ui/hover.ts` (DOM-frei, Vitest unter `tests/ui/`),
Anzeige als kleine Karte am Zeiger nach 400 ms Ruhe, verschwindet bei Bewegung über eine Kachel hinaus, beim Ziehen
und bei offenem Modal. **Nur ohne aktives Bauwerkzeug** (mit Werkzeug zeigt `placementHint` schon den Grund). Kurz:
Titel plus höchstens drei Zeilen, Details bleiben im Info-Panel (Klick). Priorität bei Überlagerung: Tier > Schiff >
Gebäude > Gelände (Picking wie `pickBuilding`/`targetTile`, Verdeckung aus ISO §10).

| Objekt        | Titel                                                                | Zeilen (höchstens drei)                                                                                                                                                                                                                                                                    |
| ------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Wohnhaus      | Symbol + Stufe („Siedlerhaus")                                       | Einwohner x / max; erstes unerfüllte Bedürfnis („Stoff fehlt") oder „zufrieden"; Aufstieg „bereit" oder erster Grund                                                                                                                                                                       |
| Betrieb       | Symbol + Name                                                        | Zustand in einem Satz: „arbeitet — 15 Nahrung / min", „wartet auf Wolle", „Lager voll", „braucht eine Schule in Reichweite", „brennt", „nicht angebunden"                                                                                                                                  |
| Dienst        | Symbol + Name                                                        | „versorgt N Häuser" (Kapelle, Schule, Badehaus), Feuerwache „schützt N Gebäude"                                                                                                                                                                                                            |
| Amtsstube     | Symbol + Name                                                        | wirksame Steuer, Zahl der Sperren; „Klicken zum Einstellen"                                                                                                                                                                                                                                |
| Kontor, Markt | Name                                                                 | „Versorgung im Radius 8"; Kontor zusätzlich „Handel: klicken"                                                                                                                                                                                                                              |
| Gelände       | Kachelart                                                            | wofür sie taugt, **nur mit freigeschalteten Gebäuden**: „Wald — Holzfäller in der Nähe", „Weide — Wohnhaus, Schäferei", „Gebirge — Steinbruch daneben", „Küste — Fischerhütte"; ab U2 „Roden: {Kosten}" bzw. „Aufforsten: {Kosten}"; ausserhalb der Versorgung „Ausserhalb der Versorgung" |
| Schiff        | „Händlerschiff"                                                      | „Kauft und verkauft am Kontor"; mit Auftrag (ab U3) „Auftrag: {n} {Gut} bis {Zeit}"                                                                                                                                                                                                        |
| Tier          | Name („Wal", „Fischschwarm", „Vogelschwarm", später „Hirsch", „Bär") | keine (reine Deko)                                                                                                                                                                                                                                                                         |

**Tiere vorbereitet:** `hoverInfo` nimmt als `extra` eine Abfrage `wildlifeAt(world, range, timeMs)` aus
`src/render/wildlife.ts` (M9 H-R2). Ist H-R2 nicht gemergt, ist die Abfrage leer; nichts bricht. Die UI fragt mit
derselben Zeit wie der Renderer ab (`timeMs` des Frames), damit Name und Bild übereinstimmen. Figuren auf Wegen
bleiben ohne Mouse-over (Nicht-Scope).

**Barrierefreiheit:** Mouse-over ist Zusatz. Dieselben Inhalte sind per Klick im Panel erreichbar.

## 5. Symbole statt Text, Schritt 1 (e, G9)

**Empfehlung: eigener, prozeduraler Symbolsatz** als SVG-Pfade in `src/ui/icons.ts` (neu), in der Palette der
M7-Anmutung, ohne fremde Dateien und ohne Lizenzprüfung. Gebäude-Symbole als **verkleinerte Silhouette** aus
`src/render/sprites.ts` (gleiche Gestalt wie auf der Karte) sind Kann; vorher reicht das Kategorie-Symbol.

| Ort                       | Symbol statt Text                                          | Text wandert nach                         |
| ------------------------- | ---------------------------------------------------------- | ----------------------------------------- |
| HUD Lager-Chips           | Gut-Symbol + Zahl + Pfeil (Bilanz)                         | `title` und `aria-label` („Stoff 12, ↑")  |
| HUD Einwohner-Chips       | Stufen-Symbol (Figur mit 1–4 Merkmalen) + Zahl             | `title`, `aria-label`                     |
| HUD Geld, Bilanz, Steuer  | Münze, Waage; Steuer nur mit Amtsstube (Abschnitt 2.3)     | `title`                                   |
| Bauleiste                 | Kategorie-Symbol auf dem Reiter; Eintrag „Symbol · Kosten" | Tooltip (Name, Kosten, Standort, Wirkung) |
| Info-Panel Haus           | Bedarfe als Symbole mit Haken oder Kreuz                   | Zeile darunter beim ersten fehlenden Gut  |
| Freischalt-Meldung, Hilfe | Symbole der neuen Gebäude und Güter vor dem Namen          | —                                         |

**Verworfen:** Emoji (Aussehen hängt vom Betriebssystem ab, Farben ausserhalb der Palette); ein fremder Symbolsatz
(passt nicht zur Anmutung, Attribution im Spiel, Lizenzprüfung, kein Mehrwert gegenüber rund 25 eigenen Symbolen).
Ein fremder Satz würde einen Lizenz-Grenzfall öffnen können; prozedural vermeidet den Vorbehalt.

**Umfang Schritt 1:** 9 Güter, 4 Stufen, Geld, Bilanz, Steuer, Glaube, Bildung, Bad, Hilfe, vier Kategorien
(≈ 25 Symbole). Gestaltung bei `lead-art` (Art Direction), Einbau im UI-Strang. Barrierefreiheit aus M7-UX bleibt:
Jedes Symbol hat einen zugänglichen Namen.

## 6. Datenmodell und Save v5 (f)

**Welt (`src/sim/types.ts`, auf M8 v4 aufbauend):**

| Feld           | Typ                                         | Standard neues Spiel                    | Zweck                    |
| -------------- | ------------------------------------------- | --------------------------------------- | ------------------------ |
| `version`      | `5`                                         | 5                                       |                          |
| `unlocked`     | `UnlockId[]` (Reihenfolge der Defs)         | `['U0']`; Option „Alles frei": alle Ids | Freischaltungen, monoton |
| `goodLocks`    | `{ tier: Tier; good: GoodId }[]` (sortiert) | `[]`                                    | Ausgabesperre S5         |
| `upgradeStops` | `Tier[]` (Kann)                             | `[]`                                    | Aufstiegsstopp           |

**Defs (`src/sim/defs/unlocks.ts`, neu):** `UNLOCKS: readonly UnlockDef[]` mit `id`, `trigger`
(`{ kind: 'start' } | { kind: 'houses'; min } | { kind: 'tierWish'; tier } | { kind: 'tierReached'; tier } |
{ kind: 'tierOpen'; tier }`), `buildings`, `goods`, `functions` (`'orders' | 'forest'`), optional `when`
(`{ crises: 'on' }` für die Feuerwache), `notice` (Grund-Satz), `tip`. Werte der Amtsstube in `defs/buildings.ts`
(`townhall`), Schulbedingung als Feld `requiresService: 'school'` am Werkzeugmacher, Kosten Roden/Aufforsten in
`defs/forest.ts` (H-S1).

**Sim (`src/sim/unlocks.ts`, neu):** `tickUnlocks(world)` als **letzter Schritt** in `step` (nach `checkWin`), damit
er denselben Zustand sieht wie der Controller vor dem nächsten Tick; reine Abfragen `isUnlocked(w, id)`,
`buildLock(w, defId)` (ersetzt M8, liefert den Auslöser-Text oder `null`), `goodUnlocked(w, g)`,
`nextUnlocks(w)`, `effectiveTaxLevel(w)`, `townhallActive(w)`. Kein Zufall, keine Gleitkommazahl im Zustand.

**Migration v4 → v5 (`save.ts`):**

1. `unlocked` = alle Einträge, deren Auslöser im geladenen Zustand gilt, **plus** alle früheren Einträge der Kette
   (eine bewohnte Stufe t beweist das Bedürfnis t und alle davor), **plus** jeder Eintrag, dessen Gebäude schon
   steht. Kein Gebäude, das der Spieler gebaut hat, verschwindet aus der Bauleiste.
2. `goodLocks = []`, `upgradeStops = []`, `version = 5`.
3. Die gespeicherte Steuerstufe bleibt; ohne Amtsstube wirkt „normal" (Abschnitt 2.3). Eine Meldung beim Laden ist
   nicht nötig: Das Steuer-Panel ist ohne Amtsstube verborgen, und der Tooltip der Bilanz nennt „Steuer: normal
   (keine Amtsstube)".
4. Test mit einem gespeicherten v4-Stand (Vorgabe aus der Verfassung) und mit einem v3-Stand über die Kette
   v3 → v4 → v5.

## 7. Bitgleichheit der Baseline (g)

**Behauptung:** `balance.test.ts` (Sieg 6050) und `balance-crises.test.ts` (Verlauf, Fingerabdruck) bleiben
bitgleich bis auf die neuen Felder. Der M8-Szenario-Lauf (B1, `balance-merchants.test.ts`) bleibt gleich.

**Nachweis am Code** (`tests/sim/controller.ts` auf `main`):

| Controller-Handlung                                                                     | Zeitpunkt im Controller                                            | Eintrag | frei zu diesem Zeitpunkt?                                                   |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ------- | --------------------------------------------------------------------------- |
| Wege, 4 Wohnhäuser                                                                      | `startColony`, Tick 0                                              | U0      | ja                                                                          |
| Holzfäller, Fischerhütten                                                               | ab Tick 0                                                          | U0      | ja                                                                          |
| Kapelle                                                                                 | `anyPlan(2)`: ein Pionierhaus voll                                 | U2      | ja: dasselbe Prädikat, von `tickUnlocks` am Ende des vorigen `step` gesehen |
| Schäferei, Weberei (`buildChain('cloth')`)                                              | `producersNeeded > 0` erst mit vollem Pionierhaus oder Siedlerhaus | U2      | ja (Siedlerhaus beweist ein volles Pionierhaus davor; monoton)              |
| Feuerwache (nur Krisen „normal")                                                        | nach der Kapelle                                                   | U2      | ja                                                                          |
| Schule                                                                                  | `anyPlan(3)`: ein Siedlerhaus voll                                 | U4      | ja                                                                          |
| Zuckerrohrplantage, Brennerei (`buildChain('rum')`)                                     | erst mit vollem Siedlerhaus oder Bürgerhaus, nach der Schule       | U4      | ja                                                                          |
| Kauf Holz, Werkzeug, Stein; Verkauf Holz, Nahrung                                       | jederzeit                                                          | U0      | ja                                                                          |
| Verkauf Stoff, Rum (`sellSurplus` ab 50)                                                | nur mit Bestand aus eigener Produktion                             | U2, U4  | ja (Produktion setzt den Betrieb voraus)                                    |
| Steuer                                                                                  | nie geändert, `taxLevel` bleibt „normal"                           | —       | wirksame Stufe ohne Amtsstube = „normal" = heute                            |
| Marktplatz, Steinbruch, Werkzeugmacher, Amtsstube, Glashütte, Badehaus, Aufträge, Roden | nie                                                                | —       | keine Wirkung                                                               |
| M8 B1 Phase 3: Badehaus, Glashütte, Glas kaufen                                         | nach dem Sieg                                                      | U6      | ja (`tierLock(w, 4) === null` ab `won`)                                     |

**Weitere Codepfade:** `canPlace` prüft `buildLock` zuerst; für freie Gebäude `null` → gleicher Pfad. `consume`
und `tryUpgrade` mit leeren `goodLocks`/`upgradeStops` → gleicher Pfad (Prüfung nur, wenn die Liste nicht leer
ist). `tickUnlocks` liest nur und schreibt nur `unlocked`; kein RNG. Der Werkzeugmacher-Zustand `noSchool` tritt ohne
Werkzeugmacher nie auf.

**Messprobe [Werte]** (Abschnitt 9.1, temporäre Probe am unveränderten Controller, danach gelöscht): In beiden
Läufen (Krisen aus und „normal" mit Feuerwache) liegt **kein Bau und kein Handel vor seinem Auslöser**. Engster
Abstand: Siedler-Bedürfnis Tick 150, Kapelle und Stoffkette Tick 200 (50 Ticks Puffer). Schule und Rumkette bei 3700
bzw. 4600, Auslöser 550. Gehandelt werden nur Holz, Werkzeug, Stein und Nahrung (alle U0); Stoff, Rum, Wolle,
Zuckerrohr und Glas nie. Sieg 6050 / `minMoney` 57 und 7050 / 56 wie Referenz. Der M8-Merchant-Controller (B1) ist
nicht auf `main`; laut M8-Plan Task 6 baut er nur Badehaus, Glashütten und Ketten nach dem Sieg und kauft Stein,
Werkzeug, Glas; keinen Werkzeugmacher, Markt oder Steinbruch. Die Spec-Messung wiederholt die Probe nach dem
M8-Merge für B1.

**Fingerabdruck:** Die Normalisierung in `tests/sim/balance-crises.test.ts` entfernt zusätzlich `unlocked`,
`goodLocks`, `upgradeStops` und setzt `version` wie bisher auf den Referenzwert (Muster M8 16.1). Kein Ruling für
einen Baseline-Bruch nötig.

**Einschränkung:** Die Bitgleichheit hängt an der Reihenfolge „`tickUnlocks` am Ende von `step`". Liegt er früher
(z. B. vor `tickPopulation`), sieht der Controller im selben Tick ein volles Haus, das noch nicht freigeschaltet ist,
und `build` wirft. Die Spec legt die Stelle deshalb als Setzung fest; ein AK prüft sie über den Referenzlauf.

## 8. Option „Alles freigeschaltet" (h)

- **Wo:** Menü „Neue Insel", neben „Krisen": „Freischaltung: Schritt für Schritt (empfohlen) · Alles frei".
  Gespeichert in den Einstellungen wie `crisisLevel`; wirkt nur auf neue Spiele.
- **Wirkung:** `unlocked` enthält beim Start alle Ids. Keine Freischalt-Meldungen; die Hilfe zeigt unter „Als
  Nächstes" den Satz „Alles freigeschaltet".
- **Bedingungen bleiben:** Steuer und Ausgabesperre brauchen auch hier die Amtsstube, der Werkzeugmacher die Schule.
  „Alles frei" heisst _alles sichtbar und baubar_, nicht _Regeln aus_. So gibt es eine Regelwelt, nicht zwei.
- **Zweck:** erfahrene Spieler und das Risiko „zäher Anfang" (Programm §7); Testszenarien (`tests/sim/scenarios.ts`,
  Galerie) nutzen sie statt des M8-Helfers `withUnlock`.

## 9. Werte und Rechnungen [Werte]

Quelle: `design-economy-designer`, abgenommen von lead-design (eine Abweichung, 9.3). Bilanz je Einwohner (EW)
und 100 Ticks bei Steuer „normal" und voller Versorgung: Pionier +1,0, Siedler +3,5, Bürger +7,5.

### 9.1 Messprobe Zeitbild (Seed 3)

| Ereignis (Tick)                                     | Krisen aus       | „normal" + Feuerwache |
| --------------------------------------------------- | ---------------- | --------------------- |
| Pionierhaus voll / erster Siedler                   | 150 / 350        | 150 / 350             |
| Siedlerhaus voll / erster Bürger                    | 550 / 3850       | 550 / 4750            |
| Sieg / `minMoney`                                   | 6050 / 57        | 7050 / 56             |
| erster Bau Kapelle, Schäferei, Weberei (Feuerwache) | 200              | 200 (200)             |
| erster Bau Schule, Zuckerrohr, Brennerei            | 3700             | 4600                  |
| erster Kauf Holz / Werkzeug / Stein                 | 200 / 300 / 3700 | 200 / 200 / 4600      |
| erster Verkauf Nahrung / Holz                       | 1600 / 1800      | 1600 / 2100           |

Werkzeug-Zukauf bis zum ersten Bürger 48 bzw. 50 (bis zum Sieg 86 bzw. 88). Freie Hausplätze im Kontor-Radius auf
Seed 3: 95 Kacheln.

### 9.2 Amtsstube

- **Werte:** 2×2, Kosten 200 Geld / 15 Holz / 2 Werkzeug / 5 Stein (505 zum Kaufpreis, billiger als die Kapelle mit
  850; Stein 5 ≤ Startlager 10, also ohne Steinbruch baubar), Unterhalt **20** je 100 Ticks.
- **„hoch" lohnt ab:** Siedlerhaus 6 EW × 7 × 1,3 − 6 × 3,5 = 33,6 statt 28 (+5,6); Bürgerhaus 11 × 14 × 1,3 −
  11 × 6,5 = 128,7 statt 112,5 (+16,2). Der Unterhalt ist ab 4 Siedlerhäusern (20 / 5,6) bzw. 2 Bürgerhäusern
  gedeckt; mit Baukosten über 2000 Ticks abgeschrieben ab ≈ 8 Siedler- bzw. 3 Bürgerhäusern.
- **Keine Dominanz:** Endzustand 4 Bürgerhäuser: „hoch" +44,8 je 100 Ticks (+0,75 je EW) gegen 60 statt 44 Bürger
  und keinen Aufstieg.
- **„niedrig":** Ein Aufstieg Siedler → Bürger 150 Ticks früher bringt ≈ +127; dagegen stehen bei 4 Siedlerhäusern
  ≈ 101 Steuerverlust plus 30 Unterhalt. Etwa ±0: eine Wahl je nach Lage, keine Pflicht.
- **Steuer erst ab Amtsstube:** Wer heute früh auf „niedrig" stellt, gewinnt höchstens einmal 150 Ticks
  (≤ 2,5 % von 6050). Nicht spürbar; die Bindung an das Gebäude kostet den Anfänger nichts.

### 9.3 Marktplatz-Schwelle (Abweichung)

`design-economy-designer` empfiehlt **8** Wohnhäuser (≈ 90–150 s beim Menschen, getrennt von U2). lead-design setzt
**20**: Der Markt wird erst gebraucht, wenn um das Kontor kein Platz mehr ist (95 Kacheln, nach Wegen rund 60
Häuser). Bei 8 Häusern zeigt die Bauleiste einen Bau ohne Nutzen mit Unterhalt 10 — das widerspricht dem
Spielerzweck „nur, was ich brauche". 20 Häuser fallen bei etwa einem Haus je 105 Ticks nach den ersten sechs auf
≈ 600 + 14 × 105 ≈ 2070 Ticks (Minute 3–4) und füllen damit die Lücke zwischen U4 und U5. Wert in `defs/unlocks.ts`.

### 9.4 Werkzeugmacher und „zäher Anfang"

- Freischaltung bei den ersten Bürgern (U5); Bedingung Schule im Radius `school.serviceRadius` (10), kein neuer Wert.
  Zur Freischaltung steht die Schule schon (sie ist Voraussetzung der Bürger); die Bedingung greift nur bei
  Entfernung oder Ausfall.
- Werkzeug bis zum ersten Bürger im Referenzlauf: 68 (2 Holzfäller 2, Fischer 14, Kapelle 5, Schäferei 8, Weberei 12,
  Schule 8, Rumpaar 6, Aufstiege 13), davon 48 zugekauft (1920 Geld; `minMoney` 57).
- Mensch mit 8 Häusern: ≈ 100 Werkzeug, abzüglich Startlager 20 → 80 zugekauft (3200 Geld) bei einem Mehrertrag von
  ≈ +224 je 100 Ticks. **Tragbar.** Der entgangene Vorteil eines Werkzeugmachers ab Tick 0 liegt bei höchstens
  ≈ +420 Geld über die Partie.
- `START_STOCK.tools` bleibt **20** (bitgleich). Hebel für den Playtest (D9): `START_STOCK.tools` höher bricht die
  Baseline; deshalb zuerst der Hebel „Werkzeugmacher bei U4 statt U5" (bitgleich, der Controller baut ihn nie).

### 9.5 Roden und Aufforsten (Bedienung M10, Sim H-S1)

- **Roden 10** Geld je Kachel (ein Holz zum Kaufpreis, ohne Ertrag): Ein Hofplatz mit 4 Weide kostet 40, etwa 12 %
  einer Farm (≈ 330).
- **Aufforsten 20** je Kachel: Eine Waldkachel schafft einen Holzfällerplatz (3,3 Holz je 100 Ticks ≈ 33 Geld). Der
  Kreis Roden → Aufforsten kostet 30 und bringt nichts; keine entartete Schleife.
- Freischaltung U2: Erst Schäferei und Plantage brauchen Weide; früher bringt Roden nichts.
- Ort der Werte: `src/sim/defs/forest.ts` (H-S1). Setzt H-S1 schon andere Werte, gelten diese; die Spec gleicht ab.

### 9.6 Ausgabesperre (Beispiel)

Zwei Webereien liefern 4 Stoff je 100 Ticks; Bedarf 1 Bürgerhaus 3 plus 2 Siedlerhäuser 3,2. Ohne Sperre ≈ +53, mit
Sperre „Stoff für Siedler" ≈ +117 je 100 Ticks (Bürger satt, Siedler zahlen halb und schrumpfen). Eine dritte Weberei
mit Schäferei bringt +171, kostet 800 und hat sich nach 1500 Ticks bezahlt. Ohne Knappheit kostet die Sperre −25,5 je
Siedlerhaus. **Die Sperre ist eine Überbrückung, keine Dauerlösung; keine Sperre dominiert.**

### 9.7 Werte je Datei

| Datei · Feld                                      | Wert                                              |
| ------------------------------------------------- | ------------------------------------------------- |
| `defs/buildings.ts` · `townhall` (Name Amtsstube) | 2×2, 200/15/2/5, Unterhalt 20, Kategorie `public` |
| `defs/buildings.ts` · `toolmaker.requiresService` | `'school'`                                        |
| `defs/unlocks.ts` · U1 `houses.min`               | 20                                                |
| `defs/unlocks.ts` · U2–U6 Auslöser                | wie 2.2                                           |
| `defs/forest.ts` · Roden / Aufforsten             | 10 / 20 (H-S1)                                    |
| `defs/goods.ts` · `START_STOCK.tools`             | 20 (unverändert)                                  |
| `defs/tiers.ts` · `TAX_LEVELS`                    | unverändert                                       |

## 10. Scope, Nicht-Scope, Pakete, Ownership (i)

### 10.1 Muss

| Nr  | Inhalt                                                                                                                                                                  |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M1  | Freischalt-Sim: `defs/unlocks.ts`, `unlocks.ts`, `tickUnlocks`, `buildLock` aus `unlocked`, Sperren in `placeBuilding`, `buy`, `sell`, `deliverOrder`, Roden/Aufforsten |
| M2  | Amtsstube (Gebäude, Silhouette) und `effectiveTaxLevel`; `setTaxLevel` nur mit Amtsstube                                                                                |
| M3  | Ausgabesperre S5 (`goodLocks`, `setGoodLock`, Wirkung in `consume` und Aufstieg)                                                                                        |
| M4  | Werkzeugmacher: Freischaltung U5 und Betriebsbedingung Schule (`noSchool`)                                                                                              |
| M5  | Save v5 mit Migration und Test alter Stände                                                                                                                             |
| M6  | UI zeigt nur Freigeschaltetes: Bauleiste, Tasten und Tastenliste, Lager- und Einwohner-Chips, Handels-Panel, Auftragskarte, Steuer im Amtsstuben-Panel                  |
| M7  | Freischalt-Meldung                                                                                                                                                      |
| M8  | Hilfe-Karte (aus „Ziel und erste Schritte"), HUD-Knopf, Taste `?`, `nextUnlocks`, Tipps; `nextStep`-Filter                                                              |
| M9  | Mouse-over für Gebäude, Gelände, Schiff; Anschluss `wildlifeAt`                                                                                                         |
| M10 | Bedienung Roden und Aufforsten (Werkzeug, Tasten, Tooltip, Mouse-over-Kosten)                                                                                           |
| M11 | Symbole Schritt 1 (Güter, Stufen, Geld, Dienste, Kategorien) in HUD, Bauleiste, Haus-Panel, Meldung                                                                     |
| M12 | Option „Alles frei"                                                                                                                                                     |
| M13 | Bitgleich-Nachweis (Referenzlauf, Krisen-Lauf, M8 B1) und Fingerabdruck-Normalisierung                                                                                  |

### 10.2 Kann (Streichreihenfolge: zuerst K4, dann K3, K2, K1)

- **K1** Aufstiegsstopp je Stufe in der Amtsstube.
- **K2** Zeichen „neu" an frisch freigeschalteten Einträgen der Bauleiste.
- **K3** Gebäude-Symbole als verkleinerte Silhouette aus `sprites.ts`.
- **K4** Krisen-Log und Kartenzeichen „Brand"/„Sturm" erst ab der ersten Krise.

### 10.3 Nicht in M10

Arbeitskräfte-System (R148 F3 (iii), Backlog) · Erlasse/Politik (Backlog) · fliessende Steuern, gedämpfter Aufstieg,
„Holzfäller braucht Wald" (M11) · weitere Nahrungsquellen (M11) · Nachwachsen des Waldes · Schulbedingung für die
Glashütte (würde M8 B1 berühren) · Freischaltung durch Geld oder Forschung · geführtes Tutorial mit Zwangsschritten ·
Mouse-over für Figuren · fremde Symbolsätze · Mobil-Bedienung · Übersetzung.

### 10.4 Grobe Pakete und Datei-Ownership

M10 startet nach dem M8-Merge (M8 gehört `population.ts`, `types.ts`, `save.ts`, `placement.ts` und der UI-Strang
U1/U2). Der UI-Strang bleibt seriell (R148 F14).

| Paket | Inhalt                                         | Lead · Arbeiter                   | Dateien (Kern)                                                                                                                                                 | Folge          |
| ----- | ---------------------------------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| S1    | M1, M5, M12 (Sim-Teil)                         | lead-tech · tech-sim-engineer     | `src/sim/unlocks.ts` (neu), `defs/unlocks.ts` (neu), `types.ts`, `tick.ts`, `save.ts`, `placement.ts`, `trade.ts`, `orders.ts`, `forest.ts`, `world.ts`; Tests | zuerst         |
| S2    | M2, M3, M4, K1                                 | lead-tech · tech-sim-engineer     | `defs/buildings.ts`, `tax.ts`, `population.ts`, `production.ts`; Tests                                                                                         | nach S1        |
| B1    | M13                                            | lead-tech · tech-sim-engineer     | `tests/sim/balance-crises.test.ts` (Normalisierung), Messung                                                                                                   | nach S2        |
| R1    | Amtsstube-Silhouette, Terrain-Cache bei Rodung | lead-art · art-rendering-engineer | `src/render/sprites.ts`, `src/render/terrain.ts` bzw. Cache-Schlüssel                                                                                          | parallel zu S2 |
| A1    | Symbolsatz (M11 Gestaltung)                    | lead-art · art-rendering-engineer | `src/ui/icons.ts` (neu), `tests/ui/icons.test.ts`                                                                                                              | parallel zu S1 |
| U1    | M6, M7, M12 (UI)                               | lead-tech · tech-ui-engineer      | `buildMenu.ts`, `hud.ts`, `hotkeys.ts`, `menu.ts`, `trade.ts`, `app.ts`, `goal.ts`, `settings.ts`                                                              | nach S1        |
| U2    | M8, M10, Amtsstuben-Panel                      | lead-tech · tech-ui-engineer      | `startCard.ts`, `guide.ts`, `inspect.ts`, `hints.ts`, `input.ts`                                                                                               | nach U1        |
| U3    | M9                                             | lead-tech · tech-ui-engineer      | `hover.ts` (neu), `input.ts`, `app.ts`, `style.css`                                                                                                            | nach U2        |
| U4    | M11 Einbau, K2, K3                             | lead-tech · tech-ui-engineer      | `hud.ts`, `buildMenu.ts`, `inspect.ts`, `style.css`                                                                                                            | nach U3 und A1 |

Text-Ownership: Freischalt-Texte und Tipps in `defs/unlocks.ts` setzt die Spec (lead-design); Wortlaut darf
`lead-art` im Rahmen der Anmutung anpassen.

## 11. Fragen an L0 (j)

| Nr  | Frage                                                                                                                         | Empfehlung                                                                                                           | Vorbehalt Nutzer? |
| --- | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ----------------- |
| D1  | Baum wie 2.2 (U0–U6), Bedingungen wie 2.3, Werte aus Abschnitt 9?                                                             | Ja.                                                                                                                  | nein              |
| D2  | Handel und Aufträge auch in der Sim sperren (nicht nur ausblenden); Verkauf bei Bestand immer erlaubt?                        | Ja. Sonst liesse sich Gesperrtes über Save oder Konsole handeln; Bestand bleibt nie hängen.                          | nein              |
| D3  | Steuer ohne Amtsstube wirkt „normal" (abgeleitet, gespeicherte Stufe bleibt); alte Stände ohne Meldung?                       | Ja. Schliesst die Abriss-Lücke ohne Haken; Wirkung ist im Bilanz-Tooltip sichtbar.                                   | nein              |
| D4  | „Alles frei" schaltet frei, hebt aber Gebäude-Bedingungen (Amtsstube, Schule) nicht auf?                                      | Ja. Eine Regelwelt statt zwei; Tests und Balancing bleiben vergleichbar.                                             | nein              |
| D5  | Symbole prozedural eigen (SVG-Pfade, Gestaltung lead-art), kein fremder Satz, keine Emoji?                                    | Ja. Kein Lizenz-Grenzfall, passt zur Palette.                                                                        | nein (prozedural) |
| D6  | Schulbedingung nur für den Werkzeugmacher, nicht für die Glashütte?                                                           | Ja. Glashütte mit Schulbedingung würde M8 B1 (Layout-Suche ohne Schulradius) berühren; Kandidat für später.          | nein              |
| D7  | Feuerwache bei Krisen „aus" verborgen?                                                                                        | Ja. Sie hätte keinen Nutzen; ein Eintrag mit Bedingung, kein Sonderfall.                                             | nein              |
| D8  | Hilfe = Umbau der bestehenden Karte „Ziel und erste Schritte" statt neuer Karte?                                              | Ja. Eine Hilfe, ein Ort; nichts doppelt.                                                                             | nein              |
| D9  | Playtest-Frage „zäher Anfang" (Werkzeug bis zu den Bürgern nur durch Kauf) im Spec-Gate, Hebel „Werkzeugmacher bei U4" (9.4)? | Ja. Rechnung zeigt: tragbar; der Hebel ist ein Defs-Wert und bitgleich.                                              | nein              |
| D10 | Marktplatz ab 20 Wohnhäusern statt 8 (Abweichung vom Wirtschaftsdesigner, 9.3)?                                               | 20. Der Markt erscheint, wenn er bald gebraucht wird, und füllt die Lücke zwischen Minute 2 und 6.                   | nein              |
| D11 | Ausgabesperre erst ab den ersten Bürgern (U5) statt ab „zwei Stufen bewohnt" (Programm §3.5)?                                 | U5. Entzerrt den dichten Anfang; vorher teilen nur Pioniere und Siedler Nahrung, eine Sperre dort ist kaum sinnvoll. | nein              |

**Nutzer-Vorbehalte:** keine. Ein fremder Symbolsatz (Lizenz-Grenzfall) wird mit D5 vermieden; das
Arbeitskräfte-System (Kernmechanik) bleibt im Backlog (R148).

## 12. Selbstprüfung Gate Brainstorming (lead-design)

| Prüffrage                       | Befund                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Säulen                          | Stärkt „Bevölkerung versorgen und aufsteigen lassen" (jede Stufe bringt sichtbar Neues) und „Wirtschaft über Steuern" (Amtsstube macht Steuer zu einer gebauten Entscheidung). Leidet bei Misslingen: Tempo des Anfangs (Werkzeug), Auffindbarkeit (versteckte Funktionen). Gegenmittel: Meldung, Hilfe, „Alles frei".                                                                                         |
| Echte Wahl                      | Amtsstube (Unterhalt gegen Steuerhebel, nie Pflicht), Ausgabesperre (untere gegen obere Stufe), Werkzeug kaufen gegen früh Schule bauen, Roden (Weide gegen Holzfäller-Standort). Keine Option dominiert (Rechnungen Abschnitt 9).                                                                                                                                                                             |
| Rückkopplungen                  | Motor gewollt: Aufstieg → Freischaltung → neue Kette → Aufstieg. Bremsen gewollt: Unterhalt der Amtsstube, unerfüllte Bedürfnisse durch Sperren, Werkzeugmacher ohne Schule. Kein endloser Überschuss neu; kein zwingender Bankrott (Amtsstube optional).                                                                                                                                                      |
| Randfälle, entartete Strategien | Amtsstube abreissen → Steuer „normal"; zweite Amtsstube abgelehnt; Schule abreissen → Werkzeugmacher `noSchool`; schrumpfendes Haus sperrt nichts; Sperre aller Güter erlaubt (Stufe zahlt halb); Bestand gesperrter Güter verkaufbar; alter Save → Migration schaltet Gebautes frei; gesperrte Taste → Meldung; Freischaltung nach Laden ohne Meldung; mehrere Freischaltungen im selben Tick → eine Meldung. |
| Einfachere Variante             | Reine UI-Ausblendung wäre einfacher, liesse Gesperrtes per Taste, Save oder Handel zu (deshalb Sim-Regel). Ein Baum aus nur „Stufe erreicht" wäre einfacher, verfehlt aber den Wortlaut „Bedürfnis entwickelt" und den Controller-Zeitpunkt. Hilfe ohne neue Karte (Umbau der bestehenden) ist bereits die einfache Variante.                                                                                  |
| Fremde Inhalte                  | Nur Mechaniken (Freischaltung nach Bedürfnis, Ausgabesperre, Verwaltungsgebäude als Ort der Steuer). Eigene Namen (Amtsstube), eigene Symbole, keine fremden Dateien.                                                                                                                                                                                                                                          |

**Risiken:** (1) Dichter Anfang: drei Meldungen in ein bis zwei Minuten (9.1) — Gegenmittel Zusammenfassung,
Hilfe, Playtest-Frage. (2) Bitgleichheit hängt an der Stelle von `tickUnlocks` am Ende von `step` (50 Ticks Puffer
bei U2) — Setzung in der Spec, AK über den Referenzlauf. (3) M8-B1 erst nach dem M8-Merge messbar. (4) UI-Last:
M10 berührt fast alle UI-Dateien; der serielle UI-Strang (U1 → U4) ist der Engpass.

**Urteil Selbstprüfung: OK.**
