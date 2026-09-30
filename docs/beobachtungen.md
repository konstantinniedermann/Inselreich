# Beobachtungen (Posteingang für Befunde ausserhalb des Scopes)

Aufbau je Eintrag: Datum · Fundort · Beobachtung · Ursprung · erste Einschätzung.
Auswertung mit dem Skill `beobachtungen-auswerten`. Ein Folgeissue entsteht nur auf
ausdrückliche Zustimmung des Nutzers; im Studio gehen Paket-Kandidaten an L0.

Letzte Auswertung: 2026-09-30 (`lead-production`, Paket S16-02) gegen Commit `3b54938`.
Ergebnis: 45 Einzelbefunde. Davon sind 11 erledigt, 22 abgehakt und 12 in sechs Paket-Kandidaten
gebündelt, die unten offen stehen. Kein Befund war widerlegt, sechs trugen eine falsche Prämisse.

---

## Offen

Neue Einträge kommen unten dazu. Die noch offenen Paket-Kandidaten aus der Auswertung stehen hier, bis L0
über sie entschieden hat.

### Paket-Kandidat · `src/ui` · Bedienkomfort (Quality-of-Life) aus M1–M4

Befunde aus den Reviews, die zusammen den QoL-Wunsch aus dem Nutzer-Playtest treffen:

- Die Bau- und Abriss-Aktion wirkt auf die Kachel beim Loslassen, nicht beim Drücken. Ein kleines
  Verrutschen trifft deshalb den Nachbarn (`src/ui/input.ts` → `endDrag` ruft
  `tileAction(p.sx, p.sy, …)` mit der Loslass-Position auf).
- Der Tastatur-Pan ist abhängig von der Framerate (`src/ui/input.ts` → `PAN_PER_FRAME`, `applyKeys`
  ohne `dt`).
- Die Touch-Bedienung ist nur teilweise vorhanden: kein Pinch, und die Werkzeuge haben keinen Pan
  (kein Touch- oder Pinch-Code in `src/ui/`).
- Die Handelsbuttons werden bei Geldmangel nur deaktiviert, ohne Grund (`src/ui/trade.ts` →
  `updateTrade`). Die Gründe „Kein Geld" und „Zu wenig Geld" aus `buy()` sind vom UI aus nicht
  erreichbar. Konsistent zur Bauleiste wäre „klickbar + Toast".
- Der Rückerstattungstext zeigt den nominalen `refundCost` (`src/ui/inspect.ts`), obwohl
  `grantRefund` über `addStock` am Lagerlimit kappt.
- Laden stellt die Geschwindigkeit auf 1× und zentriert die Kamera neu (`src/ui/app.ts` → `restart`
  → `startGame`, `speed: 1`).
- Weg-Kacheln können bei fraktionalem Zoom feine Nähte zeigen. `tileToScreen`
  (`src/render/camera.ts`) und `drawRoad` runden nicht. Nur am Code belegt, im Browser nicht
  gemessen.

**Ursprung:** Reviews M1 Task 6/7, Gesamt-Reviews M2 und M4, Nutzer-Playtest nach M4.
**Einschätzung:** Als Paket im nächsten Meilenstein bündeln, nicht einzeln abarbeiten.
**Verifiziert:** 2026-09-30 gegen `3b54938` — belegt an den genannten Symbolen.

### Paket-Kandidat · Spielkonzept · Richtung nach dem Nutzer-Playtest

**Beobachtung:** Alles funktioniert, die Grundlage ist tragfähig. Es fehlen Tiefe, Dynamik, Ambiente
und Quality-of-Life.
**Ursprung:** Nutzer-Playtest nach M4 (Pages-Build).
**Einschätzung:** Das ist kein Fehler, sondern Eingabe für die Meilenstein-Wahl durch L0
(`docs/studio/state.md`: „Nächster Meilenstein: offen"). Erlebnis-Design läuft als eigenes
Brainstorming mit Spec, nicht als Einzelmassnahmen.

### Paket-Kandidat · `tools/studio/model.py` · inaktiv-Vorfälle abgebrochener Sessions

**Beobachtung:** Endet eine Session ohne SessionEnd-Event (Abbruch, Absturz), bleiben ihre Knoten
lebend. Nach 5 Minuten entstehen `inaktiv:`-Vorfälle, die im nächsten Start-Kontext als fällige Retro
erscheinen. Das ist dieselbe Schadensklasse wie der Vorfall zu Vordergrund-Agenten, der in S16-01
behoben wurde.
**Ursprung:** Final-Review Session 1.5.
**Einschätzung:** Der Workaround ist `make studio-archive` vor einem Neustart (dokumentiert in
`docs/studio/STUDIO.md`, nicht in `state.md`). Kandidat für `production-studio-ops`: verwaiste
Sessions beim Einlesen automatisch schliessen.
**Verifiziert:** 2026-09-30 gegen `3b54938` — belegt.

- Nur `on_session_end` setzt Knoten auf `ended`.
- `view` meldet `inactive`, sobald `quiet > inactive_after` (`INACTIVE_DEFAULT` 300 s).

### Paket-Kandidat · `docs/studio/` · Nachträge für den Studio-Coach

- **Gate Spec ohne Variante für Studio-Specs:** Die Prüffragen und der Kontext von Gate Spec
  (`docs/studio/gates.md`) sind auf Spielcode zugeschnitten (Save-Format, `balance.test.ts`). Für
  Studio-Specs fehlt eine Variante. Ursprung: Gate Spec Session 1.5 (`lead-qa`).
- **Vordergrund-`sleep` gesperrt:** Claude Code blockiert einen nackten Bash-Aufruf `sleep N`.
  Briefings, die Wartezeiten verlangen, brauchen `python3 -c "import time; …"` oder Monitor. Der
  Hinweis fehlt noch in `templates/briefing.md` und `lernen.md`. Ursprung: Probelauf 1.

**Einschätzung:** Zwei kleine Handbuch-Nachträge, gebündelt als Experiment für `studio-coach` in der
nächsten Verbesserungsschleife.
**Verifiziert:** 2026-09-30 gegen `3b54938` — belegt. `grep -n "sleep"` über `docs/studio/` ist leer,
und `gates.md` Abschnitt „Gate Spec" hat keine Studio-Variante.

### Paket-Kandidat (ausserhalb des Repos) · `~/.claude/hooks/dep_guard.py` · Fehlalarm bei Heredoc-Text

**Beobachtung:** Ein Bash-Aufruf, der Dateien per Heredoc anlegte _und_ danach `npm install -D …`
ausführte, wurde blockiert. Der Hook hat Wörter aus dem Heredoc als Paketnamen gelesen.
**Ursprung:** M1 Task 1 (Scaffold). Workaround: Dateianlage und Install getrennt ausführen.
**Einschätzung:** Der Hook ist ein geteilter Baustein aller CAS-Projekte und liegt im User-Scope. Die
Änderung entscheidet deshalb der Nutzer, nicht das Studio. Härtung: nur das Segment des
Install-Kommandos tokenisieren.
**Verifiziert:** 2026-09-30 — belegt. `extract_packages` ruft `shlex.split(command)` auf das ganze
Kommando auf. Das erste Token `install`/`add`/`i` irgendwo im Text schaltet `seen_verb` ein.

### 2026-09-30 · `tools/studio/model.py` / `docs/studio/STUDIO.md` · Nachträge aus dem Final-Review S16

- **Gescheiterter Vordergrund-Agent ohne Stop-Signal:** Scheitert ein eingebauter Vordergrund-Agent,
  kommt vermutlich kein `spawned`-Event. Er bliebe dann trotz S16-01 als inaktiv stehen. In den
  Transkripten nicht beobachtet, nur vermutet.
- **Messdoku:** `STUDIO.md` nennt in der Tabelle „Was wie gemessen wird" (Zeilen „Dauer je Agent",
  „Inaktiv/gescheitert") noch nicht, dass ein Vordergrund-Agent ohne `SubagentStop` über
  `status: completed` abgeschlossen wird und sein Lauf aus `totalDurationMs` stammt.
- **Chronik bei Stop nach spawned:** Kommt `SubagentStop` erst nach `spawned completed` und hat der
  Knoten einen Auftragstext, steht in der Chronik der Auftragstext statt der Zusammenfassung
  (`on_spawned`). In der Praxis kommt der Stop zuerst.

**Ursprung:** Final-Review S16 (`qa-code-reviewer`, opus).
**Einschätzung:** Die Messdoku ist ein kleiner Nachtrag für den nächsten Studio-Strang. Die beiden
anderen Punkte werden erst relevant, wenn sie beobachtet werden.

---

## Ausgewertet 2026-09-30

### Erledigt (überholt)

- Kein `dispose()` für Listener, ResizeObserver und rAF → M4: `startGame` liefert `dispose()` (`src/ui/app.ts`).
- Toast-Stapel bei Klick-Spam → M4: `MAX_TOASTS` 3, `DEDUPE_MS` 1000 (`src/ui/messages.ts`). Touch-Teil siehe QoL-Kandidat.
- `#panel` leer → M2: `src/ui/inspect.ts`, `src/ui/trade.ts`.
- `startGame` fängt einen Startfehler aus `createWorld` nicht ab → M4: Fehler-Stub in `src/ui/app.ts`.
- Zeitkonstanten verstreut → M4: `src/sim/defs/timing.ts`.
- Nach dem Deserialisieren `recomputeConnectivity` aufrufen → M4: `src/sim/save.ts`, Test in `tests/sim/save.test.ts`.
- Balancing wirtschaftlich nicht erreichbar → M4 Task 3, `docs/superpowers/specs/2026-09-30-balancing-design.md`.
- HUD ohne Nettozahl → M4: Feld `net` in `src/ui/hud.ts`.
- Spec 3.2 nennt `economy.ts` für Steuern → M4: Modulliste nachgeführt.
- `GROWTH_INTERVAL` und `UPGRADE_WAIT` nach `defs/` → M4: `defs/timing.ts`. `SERVICE_BUILDING` siehe unten.
- Implementierer hängen bei Shell-Einzeilern → Regel in `docs/studio/lernen.md` („Edit/Write statt Shell-Einzeiler").
- Aufstieg entnimmt Ware, volle Steuer im Aufstiegstick → M5-01: `tryUpgrade`, Tests in `tests/sim/population.test.ts`.

### Abgehakt (bewusst nichts tun, mit Trigger)

| Befund (Fundort)                                                                                                    | Begründung                                                             | Zurück, wenn …                                                                         |
| ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Abriss-Regel doppelt, Viewgrösse doppelt (`input.ts` `updateHover`, `app.ts`)                                       | Zwei Aufrufer, `inspect.ts` nutzt die Regel nicht                      | ein dritter Aufrufer entsteht                                                          |
| Gebirgsanteil schwankt stark je Seed (`mapgen.ts`)                                                                  | Nachbedingungen sichern Wald und Land; Balancing-Test läuft auf Seed 3 | ein Playtest eine unspielbare Karte meldet oder der Balancing-Test mehrere Seeds prüft |
| `adjacentReason`/`radiusReason` leiten die Meldung aus dem Terrain ab (`placement.ts`)                              | Vier Meldungen, überschaubar                                           | eine fünfte Regel dazukommt                                                            |
| `hash2` mit schwacher Avalanche (`noise.ts`)                                                                        | Keine sichtbaren Muster gemeldet                                       | Karten sichtbare Muster zeigen                                                         |
| `createRng` ohne Known-Vector-Test (`rng.ts`, in `src/` ungenutzt)                                                  | Nur Tests nutzen ihn                                                   | Sim-Code ihn erstmals nutzt (dann Known-Vector-Test)                                   |
| `defs.test` prüft nur Stichproben                                                                                   | Voller Tabellenvergleich wäre Duplikation                              | —                                                                                      |
| Commit-Präfix `chore:`                                                                                              | Im Studio etabliert (`qa-code-reviewer`, `lead-qa`)                    | die Präfixliste der übergeordneten `CLAUDE.md` überarbeitet wird                       |
| BFS-Richtungsarray je Iteration (`roads.ts` `reachableRoads`)                                                       | Bei 64×64 unerheblich                                                  | die Karte deutlich wächst                                                              |
| `refresh()` je Weg-Kachel während Drag (`app.ts` `onAction`)                                                        | Billige Vergleiche                                                     | ein Profiling Ruckler beim Wegziehen zeigt                                             |
| `sell`/`buy` ignorieren die Rückgabe von `takeStock`/`addStock`                                                     | Nach den Vorprüfungen sicher, kommentiert                              | die Vorprüfungen sich ändern                                                           |
| `SERVICE_BUILDING` in `population.ts`                                                                               | Zuordnung, kein Zahlenwert                                             | ein neuer Dienst dazukommt (dann nach `defs/`)                                         |
| MkDocs nicht eingesetzt                                                                                             | Würde eine Python-Abhängigkeit bringen; Markdown mit `docs/index.md`   | der Nutzer es wünscht                                                                  |
| Balancing-Marge knapp (`balance.test.ts`, Sieg ≤ 7500)                                                              | Eskalationsregel ausgeschöpft; zweiter Treiber mit M5-01 behoben       | ein Playtest oder eine `defs/`-Änderung die Marge kippt (neue Kurz-Spec)               |
| Spielstand-Validierung lückenhaft (`save.ts` `isWellFormed`: kein `seed`, keine Kontor-`defId`, keine Kachelfelder) | Spielstände entstehen nur im eigenen Spiel                             | Spielstände extern entstehen (Import, Teilen)                                          |
| Eigene Session im Dashboard als „neueste"                                                                           | So gewollt, `?session=<id>` vorhanden (`dashboard/app.js`)             | Sessions ohne Leads stören                                                             |
| bind-Event bei jeder Erwähnung von `log.py` (`hook.py` `log_args`)                                                  | Harmlos, `on_bind` ignoriert leere Rollen                              | binds mit Rolle falsch zugeordnet werden                                               |
| Zeitformate: Feed UTC, Chronik lokal                                                                                | Kosmetisch, das Dashboard nutzt `t`                                    | jemand Rohdaten auswertet                                                              |
| `log.py decision` mit bestehender ID öffnet den Entscheid neu (`model.py` `on_decision`)                            | Akzeptiert                                                             | es versehentlich passiert                                                              |
| Verdrängter FIFO-Knoten bei fehlendem `spawned` (R17)                                                               | Tritt nur bei verlorenen Hook-Events auf                               | verlorene Events beobachtet werden                                                     |
| Rückfrage eines Leads erscheint als `done`                                                                          | Entscheide laufen über `log.py decision`; Ansicht „Offene Entscheide"  | eine Rückfrage übersehen wird                                                          |
| Server-Tests langsam (echter Server je Test)                                                                        | Unkritisch                                                             | die Suite deutlich wächst                                                              |
| Laden setzt Geschwindigkeit und Kamera zurück                                                                       | Siehe QoL-Kandidat                                                     | —                                                                                      |

### Falsche Prämissen

| Befund                                  | Behauptet                                                 | Gemessen                                                                                                       |
| --------------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Gebirgsanteil je Seed                   | 1–27 % der Insel                                          | 0,7–55 % des Landes über die Seeds 1–200 (Median 14 %, Messung per `generateMap`)                              |
| Handelsbuttons ohne Grund               | „`'Kein Geld'` aus `buy()` unerreichbar"                  | „Kein Geld" gilt für negativen Kontostand; bei zu wenig Geld meldet `buy` „Zu wenig Geld" — beide unerreichbar |
| inaktiv-Vorfälle abgebrochener Sessions | Workaround „steht in der state.md-Übergabe"               | `state.md` nennt `make studio-archive` nicht, nur `STUDIO.md`                                                  |
| Halbe Steuer nach dem Aufstieg          | „in derselben 100er-Buchung"                              | nur wenn der Aufstieg auf einen Buchungstick fällt (Wachstum alle 50, Buchung alle 100 Ticks)                  |
| Abriss-Regel doppelt                    | Zusammenziehen „beim dritten Aufrufer (Inspect-Panel M2)" | `inspect.ts` gibt es, er nutzt die Regel nicht; der Trigger ist nicht eingetreten                              |
| Server-Tests                            | „~5 s"                                                    | 14 Tests, 7,4 s (`python3 -m unittest tests.test_server`)                                                      |
