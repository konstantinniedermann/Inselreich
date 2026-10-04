# Beobachtungen (Posteingang für Befunde ausserhalb des Scopes)

Aufbau je Eintrag: Datum · Fundort · Beobachtung · Ursprung · erste Einschätzung.
Auswertung mit dem Skill `beobachtungen-auswerten`. Ein Folgeissue entsteht nur auf
ausdrückliche Zustimmung des Nutzers; im Studio gehen Paket-Kandidaten an L0.

Letzte Auswertung: 2026-09-30 (`lead-production`, Paket S16-02) gegen Commit `3b54938`.
Ergebnis: 45 Einzelbefunde. Davon sind 11 erledigt, 22 abgehakt und 12 in sechs Paket-Kandidaten
gebündelt, die unten offen stehen. Kein Befund war widerlegt, sechs trugen eine falsche Prämisse.

Nachtrag Doku-Pass M5 (D1, 2026-09-30): Die Zahlen oben sind der Stand der Auswertung gegen `3b54938`.
Seither sind zwei Paket-Kandidaten (Bedienkomfort, Spielkonzept) nach „Erledigt" verschoben, vier stehen
noch offen; die Abgehakt-Zeilen „`createRng` ohne Known-Vector-Test" (Trigger eingetreten, jetzt unter
„Offen") und „Laden setzt Geschwindigkeit und Kamera zurück" (erledigt) sind entfernt. Die gesammelten
Befunde der M5-Wellen 1–5 und von lead-art stehen als neue Einträge unter „Offen" (gegen `test/m5-int`
geprüft, noch nicht ausgewertet). M5-Nachlese (R70) hat die Kann-Befunde aus dem Final-Review M5
übertragen bzw. behoben (Einträge vom 2026-09-30 am Ende von „Offen“).

---

## Offen

Neue Einträge kommen unten dazu. Die noch offenen Paket-Kandidaten aus der Auswertung stehen hier, bis L0
über sie entschieden hat.

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

### 2026-09-30 · `tools/studio/model.py` · stop-only-Knoten in Aufwand und Qualität

**Beobachtung:** Knoten mit `agent_stop` ohne Rolle (stop-only) zählen in den Reitern Aufwand und Qualität (`records`, `effort`, Vorfälle) weiter, obwohl Graph, Organigramm, Zähler und Chronik sie ausblenden.
**Ursprung:** Paket G.
**Einschätzung:** Dasselbe Prädikat `_Builder.hidden()` wäre eine Zeile (L0-Entscheid Gate Plan: Beobachtung).

### 2026-09-30 · `tools/studio/graph.py` · `_row`

**Beobachtung:** Eine order-Zeile, deren Elternknoten in dieser Zeile keine Spur hat, bekommt `arrow = null` (kein Stummel).
**Ursprung:** Paket G.
**Einschätzung:** Selten und ungetestet; ein Test genügt, falls es je auftritt.

### 2026-09-30 · `tools/studio/server.py` · `/api/state`

**Beobachtung:** `/api/state` wächst mit dem Graphen: bei 300 Zeilen × 11 Spalten etwa 346 KB je Poll (2 s). Der Client baut nur bei Änderung neu (P35), der Transfer bleibt.
**Ursprung:** Paket G.
**Einschätzung:** Lokal unkritisch; relevant, wenn Sessions deutlich länger werden (dann `graph` separat oder inkrementell liefern).

### 2026-09-30 · `tools/studio/model.py` · `layouts`

**Beobachtung:** Schlägt das Graph-Layout einer Session fehl, fällt es still weg (leere Zeilen, Feed ohne Empfängernamen). Ein Log-Hinweis fehlt.
**Ursprung:** Paket G.
**Einschätzung:** Eine Logzeile im Fehlerfall würde die Suche abkürzen; klein, aber ohne Anlass bisher nicht nötig.

### 2026-09-30 · `tools/studio/server.py` · `paths.agents_dir`

**Beobachtung:** `server.py` liest Persona-Namen aus dem Hauptrepo (`paths.agents_dir` über `repo_root`). Aus einem Worktree gestartet zeigt das Dashboard die Namen des Hauptrepos.
**Ursprung:** Paket G.
**Einschätzung:** Playtests in Worktrees brauchen eine Temp-Kopie des Repos. Erst relevant, wenn Namen im Worktree geändert werden.

### 2026-09-30 · `tools/studio/dashboard/` · Tab-Leiste bei 390 px

**Beobachtung:** Bei 390 px ragt der Reiter „Studio“ bis x=429 hinaus. Die Leiste scrollt intern, die Seite hat keinen waagrechten Scroll.
**Ursprung:** Paket G.
**Einschätzung:** Vorbestehend, nicht durch den Graphen verursacht; kosmetisch.

### 2026-09-30 · `tools/studio/dashboard/` · Graph-Karte Layout

**Beobachtung:** Bei 1280×2000 hat die Graph-Karte 60vh (1200 px) Höhe bei etwa 590 px Inhalt, es entsteht eine grosse Leerfläche. Die klebende Kopfzeile überdeckt auf dem Handy die obersten Graph-Zeilen. Labels im Graphen sind bei 390 px stark gekürzt („Prüf-Pe…“).
**Ursprung:** Playtest Paket G.
**Einschätzung:** Kosmetisch; Höhe an den Inhalt binden (`max-height` statt fester Höhe) und Scroll-Padding unter der Kopfzeile setzen.

### 2026-09-30 · `tools/studio/tests/`, `graph.py`, `model.py`, Doku · Nachträge

**Beobachtung:** Test T1f (kaputtes SendMessage) prüft nur schwach (kein Vergleich der Felder bei `message` als Objekt). Die Hilfsfunktion `short()` in `graph.py` und `_short()` in `model.py` sind doppelt. Empfängernamen fehlen im Live-Feed, wenn das Graph-Layout einer Session fehlschlägt. Es gibt keinen automatischen Abgleich `roster.md` ↔ Persona-Frontmatter (Name, Titel, Emoji, Version).
**Ursprung:** Final-Review Paket G.
**Einschätzung:** Alles klein. Der Roster-Abgleich wäre ein Test in `test_docs`, die übrigen Punkte Aufräumen bei Gelegenheit.

### 2026-09-30 · `tools/studio/model.py` · `build_state` (`on_status`, `view`)

**Beobachtung:** `build_state` bricht bei nicht-textuellen Feldern ab, z. B. bei einem log-`status` mit Liste als Wert (`status in FINAL` in `on_status`, `status in LIVE` in `view`): TypeError, `/api/state` antwortet 500. Besteht auch auf `main`.
**Ursprung:** Final-Review Paket G (ausserhalb Scope).
**Einschätzung:** `log.py` validiert die Eingabe, ein Fehler tritt nur bei von Hand geschriebenen Events auf. Härtung per `isinstance(status, str)` wäre eine Zeile je Stelle.

### 2026-09-30 · `docs/adr/ADR-007-studio-hierarchie.md` / `docs/studio/STUDIO.md` · Vordergrund-Regel

**Beobachtung:** Leads melden: Das Agent-Tool in Subagenten hat keinen Parameter `run_in_background`; alle Arbeiter-Starts laufen asynchron trotz Vordergrund-Regel (ADR-007). Leads warten trotzdem auf das Ergebnis (Abschlussmeldung).
**Ursprung:** Leads in Paket S17 (lead-production) und zuvor; von L0 weitergegeben.
**Einschätzung:** ADR-007 und die Handbuch-Regel „Vordergrund-Regel" (STUDIO.md, Personas der Leads) prüfen, ob sie an das tatsächliche Verhalten angepasst werden müssen. Kandidat für `studio-coach`.

### 2026-09-30 · `tools/studio/hook.py` / `model.py` `on_bind` · Herkunft des Phantom-binds offen

**Beobachtung:** S17-02 verwirft ein `bind` für eine unbekannte `agent_id` (Symptomschutz). Woher die fremde `agent_id` a4262c63e036f5c23 stammte, ist weiter offen: Im ganzen Event-Log ist es der einzige solche Fall. Ein verworfener bind zählt ausserdem keinen Tool-Aufruf (`count_tool`). Kommt ein bind zeitgleich mit `agent_start` und wird falsch sortiert, geht die Bindung verloren; `resolve` fällt dann auf Rolle und Paket zurück.
**Ursprung:** Task-Review S17-02 (Retro ci-pages B3 verlangte „zuerst Ursache klären").
**Einschätzung:** Harmlos, solange der Fall selten bleibt. Tritt er wieder auf, den Hook-Payload der fremden `agent_id` mitschreiben (z. B. `agent_type`) und die Quelle klären.

### 2026-09-30 · `docs/studio/STUDIO.md` / `docs/studio/lernen.md` / `tools/studio/` · Nachträge aus dem Final-Review S17

**Beobachtung:** (1) STUDIO.md, Abschnitt „Budget" (Z. ~152–174) und Z. ~440, beschreibt die neue Zählung nicht: Budgets zählen je Session, ein Start zählt für die Freigabe seiner Session (Paketname bevorzugt, sonst jüngste Freigabe), eine Session ohne Freigabe erscheint als „ohne Freigabe". Es fehlt auch der Satz, dass `ci:<run>` erledigt ist, sobald der neueste Versuch grün ist. (2) Ein Start vor der ersten Freigabe seiner Session zählt in keiner Budget-Zeile. Nach einem Sessionwechsel (z. B. `/clear`) muss L0 die Freigabe neu loggen. (3) Die Zeilen in `lernen.md` zu Phantomknoten, ci-Rerun, Budget-Anzeige und Meilenstein-Metrik sind nach dem Merge von S17 überholt. (4) `budget_view` gibt kein `since` aus, deshalb haben Budget-Vorfälle `t = 0.0` (`effort.py`, bestand schon vorher). (5) DRY, niedrig: `effort.py` baut die Budget-Id doppelt. `budget_view` wiederholt den Kandidatenfilter aus `budget_key`. `attempt` wird in `on_ci` und `ci._attempt` je gleich gelesen.
**Ursprung:** Final-Review S17 (opus).
**Stand:** (1)–(3) erledigt mit Handbuch 1.3 und bereinigter `lernen.md` (Ruling R58, Paket S17-05); (4)–(5) bleiben offen.
**Einschätzung:** (1)–(3) betreffen das Handbuch und gehen an `studio-coach` bzw. über ein L0-Ruling; (1) ist dringend, weil das Handbuch sonst eine überholte Zählung beschreibt. (4)–(5) räumt man bei der nächsten Arbeit an `tools/studio/` mit auf.

### 2026-09-30 · .prettierignore / Worktrees · Prettier formatiert Worktree-Dateien vom Hauptrepo aus still nicht

**Beobachtung:** Die `.prettierignore` des Hauptrepos schliesst `.worktrees/` aus. `npx prettier --write <worktree-datei>`
aus dem Hauptrepo heraus lässt die Datei still unverändert; „Prettier gelaufen" war deshalb zweimal falsch gemeldet.
Im Worktree selbst ausgeführt (mit dem `node_modules` des Hauptrepos) funktioniert es.
**Ursprung:** lead-design, Spec M5 (Session 2026-09-30).
**Einschätzung:** Hinweis in Briefings für Worktree-Arbeit („Prettier im Worktree ausführen") und Kandidat für eine
lernen.md-Zeile durch den studio-coach.

### 2026-09-30 · `src/sim/` · Sim und Spielstand nach M5

- **`won` ist ein Latch** (`src/sim/tick.ts` `checkWin`): wird nie zurückgesetzt. Szenarien, die mit ≥ 50
  Bürgern starten, setzen `won` sofort. So gewollt (Spec 2.9), aber eine Falle für Test-Szenarien.
- **Auftragstakte in der Save-Prüfung** (`src/sim/save.ts` `isValidOrder`): prüft `due` gegen
  `ORDER_FIRST_TICK`, `ORDER_PERIOD`, `ORDER_DURATION`. Ändert ein Balancing die Takte, werden Stände mit
  laufendem Auftrag als „Beschädigter Spielstand" abgewiesen (auch in arc42 §11).
- **Abgewandelte Szenario-Saves:** Wer in einem Save `tick` ändert, ohne `order.due` anzupassen, bekommt
  „Beschädigter Spielstand". Die Prüfung ist korrekt; die Falle trifft QA, die Szenarien von Hand abwandelt.
- **`createRng` ohne Known-Vector-Test** (`src/sim/rng.ts`, `tests/sim/rng.test.ts`): Der Trigger aus der
  Auswertung ist eingetreten — seit S2 nutzt Sim-Code den Generator (`orderForPeriod`). Die Tests prüfen nur
  Determinismus und Wertebereich, keinen festen Wert; eine unbemerkte Änderung am Generator würde alle
  Aufträge verschieben, ohne dass ein Test rot wird.

**Ursprung:** S1-Implementierer und -Reviewer, Lead (S2), Browser-Check A4, Auswertung 2026-09-30.
**Einschätzung:** Der Known-Vector-Test ist ein Trivial-Test (ein fester Wert für `createRng(1)` und ein
fester Auftrag für `orderForPeriod(3, 0, 1)`) und gehört ins nächste Sim-Paket. Die Takt-Kopplung wird erst
relevant, wenn ein Balancing die Auftragstakte ändert (dann Migration, Auflage R61). Die übrigen Punkte sind
Hinweise für Szenario-Autoren.

### 2026-09-30 · `tests/` · Testqualität aus den M5-Reviews

- `tests/sim/helpers.ts` `placeService`: Kapelle/Schule verlieren beim Platzieren einer weiteren Schule
  `connected`; der Helfer setzt es nur einmal.
- `tests/sim/save.test.ts` „never throws on garbage input" nutzt `{"version":1}` und läuft seit S1 durch den
  Migrationspfad statt direkt in die Prüfung (Testabsicht verschoben, unproblematisch).
- `tests/sim/queries.test.ts`: Purity-Test ohne AK-/RF-Präfix (~:248); `directHouse` setzt Flags, die die
  Abfragen nicht lesen, ohne Kommentar (~:50–71); Setup für AK-S3-07 (Holzfäller) umständlich (~:222–226).
- `tests/sim/orders.test.ts` (~:103, AK-S2-09) enthält ein Füll-`expect(GOOD_IDS.length)`.
- `tests/sim/m5-session.test.ts`: Name des Determinismus-Tests lang.
- `tests/sim/defs.test.ts:11`: Test für AK-S4-04 heisst „has 13 building defs…" und beginnt nicht mit
  `AK-S4-04` — die AK-Abdeckung per `grep` findet ihn nicht.
- `tests/ui/soundEvents.test.ts`: Test zu `UNLOCK_EVENTS` prüft nur die Konstante (Wirkung im Browser belegt).
- `tests/render/overlays.test.ts`: Zoom-Schwellen-Test prüft nur die Konstante `SYMBOL_MIN_ZOOM`, nicht das
  Ausblenden.
- `tests/render/ship.test.ts`: kein Test für „kein Wasser-Nachbar → `null`" und für die Reihenfolge bei
  mehreren Wasser-Nachbarn.
- `tests/audio/sound.test.ts`: Lücken bei der Verkabelung Meer → Master, der `onended`-Trennung (der Fake
  ruft `onended` nie), `setMuted(false)` bei verborgenem Tab ohne `resume` und einem abgewiesenen
  `resume()`-Promise.
- Szenario `bedarf` verliert über 200 Ticks Bewohner (spielüblich, für Checks beachten).
- U3: Tests kamen erst im dritten Commit (c3f7366 und e59fbe5 ohne eigene Tests); Rot-zuerst ist nur für
  `format`, `order` und `balanceLabel` belegt.

**Ursprung:** Task-Reviews S1, S2, S3, S4, B1, U2, A1, A2, A3 (M5).
**Einschätzung:** Alles niedrig, als Aufräum-Paket „Testpflege" bei der nächsten Arbeit im jeweiligen Strang.
Hinweis fürs Final-Review: AK-S4-04 ist durch den genannten Test in `defs.test.ts` abgedeckt, auch wenn die
grep-Liste ihn nicht zeigt.

### 2026-09-30 · `src/ui/` · Code-Befunde aus den M5-Reviews

- `src/ui/app.ts`: Die Autosave-Zeitlogik steht inline im Loop und ist ungetestet; eine reine Funktion
  (`autosaveDue`) wäre billig testbar.
- `src/ui/app.ts` / `src/audio/sound.ts` ~:232–238: je Spiel ein neuer `AudioContext` (`dispose()` schliesst
  ihn) — unkritisch.
- `src/ui/input.ts`: `onPointerCancel` setzt `gesture` nicht zurück (harmlos). Touch: Der Hover-Rahmen bleibt
  nach dem Loslassen am letzten Fingerort stehen (kosmetisch).
- `src/ui/inspect.ts`: `REFUND_GOODS` ist nach `refundText` deklariert. „Mangel: Kapelle fehlt" steht doppelt
  zur Bedürfnisliste („Kapelle ✗").
- `src/ui/hud.ts`: Die Klasse `active` heisst beim Tag-Nacht-Schalter „an", beim Stumm-Schalter „stumm"
  (gleiche Optik, gegensätzliche Bedeutung).

**Ursprung:** Task-Reviews U1a, U1b, U2, U3, U-KANN (M5).
**Einschätzung:** Niedrig. Die doppelte Mangelzeile und die `active`-Semantik gehören zu einem kleinen
UI-Pflegepaket; der Rest bei Gelegenheit.

### 2026-09-30 · `src/ui/`, `src/style.css` · Layout und Bedienung (Browser-Checks M5)

- **390 px:** Die Laden-Auswahl streckt Speichern/Laden/Neu auf 148 px Höhe; eine leere Leiste liegt zwischen
  Canvas und Bauleiste; das Info-Panel liegt unter Karte und Bauleiste und ist nur per Seitenscroll
  erreichbar, „Abreissen" teils unter dem Falz. Das mobile HUD belegt ~394 px (46 % von 844), die Karte
  ~300 px.
- **Tippziele:** Der Tag-Nacht-Button ist 34 px hoch (wie alle HUD-Buttons) — knapp für Touch.
- **Tooltips:** Der Bauleisten-Tooltip verdeckt Nachbar-Einträge; ein Langdruck-Tooltip verschwand einmal zu
  früh (nicht reproduzierbar).
- **Handelspanel:** „Zurück" ist bei 1280×800 halb abgeschnitten (Panel scrollt).
- **Start und Laden:** Reload startet immer eine neue Zufallswelt, und das frische Spiel zählt als
  Fortschritt — „Laden" braucht deshalb immer zwei Klicks, mit Autosave-Slot drei Stufen (Bestätigen,
  Auswahl, Slot). Laden eines Stands mit demselben Seed behält die aktuelle Kamera, weil der Spielstand
  keine Kamera enthält (so gewollt nach Spec 10.1 Q6, wirkt aber nach einem Reload zufällig). Beim Seitenstart läuft das Spiel sofort mit 1×, während noch der Toast „Spielstand
  vorhanden" steht.
- **`favicon.ico`** fehlt (404 im Dev-Server).

**Ursprung:** Browser-Checks U1a, U2, U1b, U3, B1, A4 (M5, headless).
**Einschätzung:** Kandidat für ein Paket „Mobile-Layout und Startablauf" nach dem Nutzer-Playtest auf einem
echten Gerät (dort erst entscheiden, ob HUD-Höhe und Tippziele stören). `favicon.ico` ist ein Trivial-Fix
für den nächsten UI-Strang.

### 2026-09-30 · `src/render/` · Befunde lead-art aus M5

- `sprites.ts` `fallback()`: neue Closure je Zeichnen und `Painter` je Gebäude und Frame; Fallbacks einmal je
  Kategorie vorab bauen (greift heute nicht, alle Typen haben Silhouetten).
- `sprites.ts` Werkzeugmacher: Grautöne als Hex-Literale (`#5a5a5a`, `#4a4a4a`, `#b8b8b8`) statt benannter
  Konstanten.
- `sprites.ts` Rauch: `SMOKE_ORIGIN` ist eine Konstante für alle Betriebe, nicht je Silhouette; bei
  1×1-Gebäuden ist der Rauch kaum sichtbar.
- Terrain-Layer wird ungerundet skaliert gezeichnet, Wege/Gebäude auf gerundeten Pixeln (Versatz ≤ 0.5 px);
  der Weg-Mittelstreifen zeigt bei Zoom ≈ 1.7 eine 1-px-Stufe.
- `overlays.ts`: `interface Symbol` verdeckt das globale `Symbol` (umbenennen, z. B. `NeedSymbol`);
  `houseDiagnosis` läuft ungecacht je sichtbarem Haus und Frame (gemessen 2.5–3.1 ms je Frame bei 57
  Gebäuden, unkritisch; auch Final-Review M5, B-F2: Leistung bei grossen Städten). Das Symbol „nicht versorgt" hat keine Legende.
- `ship.ts`: nicht auf den sichtbaren Ausschnitt begrenzt (vernachlässigbar); bei `timeMs: 0` fester
  Neigungsversatz (~0.05 rad).
- Vorschau: Ungültig-Vorschau auf Gras bräunlich statt klar rot, auf Wasser violett.

**Ursprung:** Task-Reviews A1, A3, Silhouette S4 (lead-art); Browser-Checks A1, A3.
**Einschätzung:** Alles niedrig, Pflege durch lead-art bei der nächsten Render-Arbeit. Die Farbe der
Ungültig-Vorschau und die Legende berühren die Lesbarkeit und sind die ersten Kandidaten.
**Erledigt seither (teilweise):** Die Wellen-Amplitude in `water.ts` ist inzwischen eine benannte Konstante
(`WAVE_AMPLITUDE`); `water.ts:~74` enthält aber noch feste Faktoren (u. a. `sh * 0.1`, `sh * 0.25`, `sw * 0.2`, `sw * 0.8`, `sw * 0.5`).

### 2026-09-30 · `src/audio/sound.ts` · Befunde lead-art aus A2

- ~:192/196: `unlock()` ruft `resume()` auch bei verborgenem Tab oder stumm (Risiko gering, `unlock` kommt
  aus einer Nutzergeste).
- ~:227: `setHidden(true)` suspendiert auch bei stumm (sinnvoll, ungetestet).
- ~:208: `play()` prüft `ctx.state` nicht; ungedrosselte Ereignisse (`order`, `orderDone`, `win`) während
  `suspended` erklingen beim `resume` gebündelt. Bewusst akzeptiert.

**Ursprung:** Task-Review A2 (lead-art).
**Einschätzung:** Im Nutzer-Playtest beobachten (Rückkehr in einen Tab nach längerer Zeit); sonst nichts tun.

### 2026-09-30 · Studio · Briefing-Nachträge aus M5

- Ein Reviewer lud einmalig `vite-node` per `npx` in den npm-Cache (nichts im Repo). Seit Auflage R62 steht
  „kein `npx`-Download ausserhalb von `package.json`" im Briefing; eine `lernen.md`-Zeile fehlt.
- `make test` zeigt Typfehler nicht, erst `make check` (ein `process.env`-Zugriff in einem Sim-Test brach
  `tsc`, weil der Typ-Shim `process` nicht kennt).
- Ein Playtest-Erstlauf wertete gestauchte Panel-Screenshots nicht. Playtester-Briefings sollten verlangen,
  jedes geöffnete Panel auf Lesbarkeit und Überlauf zu prüfen.
- Canvas-Pixelmessung für Rauch im 1000-ms-Takt trifft die 500-ms-Periode (Messartefakt); Animationen über
  Screenshots belegen.

**Ursprung:** Übergaben Welle 3 und 4 (lead-tech).
**Einschätzung:** Kandidat für `studio-coach`: drei Zeilen in `lernen.md` bzw. der Playtest-Vorlage.

### 2026-09-30 · Nutzer-Playtest M5 · offene Punkte (keine Befunde)

Nur auf einem echten Gerät bzw. hörbar zu beurteilen: 390 px und Ton auf einem Touch-Gerät (P-01…P-04),
Frame-Zeit mit GPU, Höhe des mobilen HUD, Ton-Hooks (Münze, Auftrag geliefert, Fehler) hörbar, subjektive
Wirkung der Tag-Nacht-Tönung über einen ganzen Tag (10 min bei 1×), Gefühl von Pinch-Zoom und Zwei-Finger-Pan,
„niedrig" im Steuerregler (Spec 17.1).
**Ursprung:** Übergaben Welle 3–5, Spec 14.2.
**Einschätzung:** Eingabe für den Nutzer-Playtest nach dem Merge von M5, kein Paket.

### 2026-09-30 · `tests/sim/`, `src/sim/` · Final-Review M5: Sim und Tests

- `tests/sim/save.test.ts:63`: AK-S1-02 vergleicht nur die Gebäude-IDs, die Spec verlangt den ganzen
  Gebäudevergleich (Teststärkung, kein Label).
- Das Literal 100 (voller Verkaufsanteil) steht dreifach in `src/sim/world.ts`, `trade.ts` und `save.ts`;
  Refactoring in eine Konstante in `src/sim/defs/`.
- `citizens()` zählt nur `tier === 3`, und `tryUpgrade` läuft automatisch: Falle für jede künftige vierte Stufe.

**Ursprung:** Final-Review M5 (lead-qa), R70; `citizens()`/`tryUpgrade` aus M6-PREP (design-economy-designer).
**Einschätzung:** Niedrig; der Sim-Code gehört zu tech-sim-engineer. Die vierte Stufe ist bei K-C zwingend
mitzuplanen.

### 2026-09-30 · `src/ui/` · Final-Review M5: Bedienung

- **B-F1 (mittel)** `src/ui/app.ts:88-91,116,424-437`: Nach einem Reload überschreibt der Autosave der neuen
  Zufallswelt nach 120 s den Autosave der vorigen Sitzung. Spec-konform (Spec 10.8), der manuelle Slot bleibt.
- **B-F6** `src/ui/app.ts:140-142`: Wirft `launch`, bleiben die Listener registriert.
- **B-F7** `src/ui/input.ts:303-315,328`: Pfeil- und WASD-Tasten wirken bei fokussiertem Button nicht, die
  Hotkeys schon.
- **B-F8** `src/ui/buildMenu.ts:144-155,188-191`: Nach einem Langdruck mit Abbruch wird der nächste Klick
  verschluckt.

**Ursprung:** Final-Review M5 (lead-qa), R70.
**Einschätzung:** B-F1 ist Eingabe für die M6-Auswahl bzw. den Nutzer-Playtest (R70). B-F6 bis B-F8 sind
Verhaltensänderungen, niedrig, bei der nächsten UI-Arbeit.

### 2026-09-30 · `src/render/`, `src/audio/` · Final-Review M5: Render und Audio für M7

- **B-F4** `tests/render/ship.test.ts:15-26`: tautologisch (rechnet den Sollwert wie der Code).
- **B-F5** `src/render/overlays.ts:73-80,123`: Der Cache hält alte Welten fest.
- **B-F9** `src/audio/sound.ts:192,207-215`: Ein abgelehntes Ton-Resume bekommt keinen zweiten Versuch
  (ergänzt die `resume()`-Befunde oben).

**Ursprung:** Final-Review M5 (lead-qa), R70.
**Einschätzung:** Niedrig, bündeln in M7 (Render/Audio, lead-art).

### 2026-09-30 · M5-Spec §4.1, Sim · Design-Befunde für M6/M7

- **Steuer „hoch" nach dem Sieg:** Die Tabelle rechnet „hoch" je Einwohner mitwachsend, den Endzustand mit
  festem Kettenunterhalt. Wer Ketten auf die kleinere Belegung zurückbaut, fährt nach dem Sieg mit „hoch"
  dauerhaft besser (Bürgerhaus 129 statt 112.5 je 100 Ticks): drohende dominante Strategie.

**Ursprung:** M6-PREP (design-economy-designer).
**Einschätzung:** Für lead-design, relevant für M6/M7 (K-C).

---

### 2026-09-30 · Spiel auf dem Handy · Mobil unspielbar

**Beobachtung:** Der Nutzer meldet nach dem M5-Playtest, das Spiel sei „auf dem handy momentan
unspielbar". **Ursprung:** Nutzer, Ruling R78. **Einschätzung:** Kein Ziel mehr (Desktop-first);
Trigger für ein Mobil-Paket nur, wenn der Nutzer das Handy wieder will.

### 2026-09-30 · `tools/studio/` · Restbefunde Limit-Sensor

**Beobachtung:** (1) Ampel gelb färbt den Text nicht, nur Leiste und Wort; (2) veraltete Werte
werden nicht abgeschwächt dargestellt; (3) ohne `$CLAUDE_PROJECT_DIR` bleibt die Statuszeile
leer; (4) Hook-Zeile gilt 600 s als frisch, Dashboard 1 h; (5) `renderLimits` ohne JS-Test,
Tooltip mit Reset-Zeiten nur im Code geprüft. **Ursprung:** lead-qa und lead-tech, STUDIO-LIMIT
(R76, R80). **Einschätzung:** niedrig; bündeln, sobald wieder an `tools/studio/` gearbeitet wird.

### 2026-09-30 · `tools/studio/`, Harness · Starts melden `async_launched` trotz Vordergrund

**Beobachtung:** Alle 25 `spawned`-Events der Session 664ac8d3 (auch 15 Starts von Leads an
Arbeiter, alle mit `background: false`) und 15 von 15 in 2bf010b4 tragen `status: async_launched`.
L0 meldet zwei Starts des `production-integrator`, die als Hintergrund liefen. **Ursprung:**
studio-coach, Retro `docs/studio/retros/2026-09-30-session-664ac8d3.md` B4. **Einschätzung:**
mittel; per Headless-Probe klären, ob die Laufzeit `run_in_background: false` beachtet und was der
Status bedeutet, dann Dashboard-Ansicht und ADR-007 prüfen.

### 2026-09-30 · `tools/studio/metrics.py` · Fortgesetzte Agenten verzerren Schätzung und Paket

**Beobachtung:** 9 von 10 verglichenen Agenten wurden per SendMessage fortgesetzt (39
Fortsetzungen); ihre Schätzung deckt nur den ersten Auftrag, der Datensatz trägt das zuletzt
geloggte Paket. Werkzeugaufrufe +91 % bei fortgesetzten, −53 % beim einzigen nicht fortgesetzten
Agenten. **Ursprung:** studio-coach, Retro 664ac8d3 B2. **Einschätzung:** mittel; hängt am
Vorschlag zu E-001 (Folgeauftrag nennt Schätzung, Auswertung summiert).

### 2026-09-30 · `.github/workflows/` · `ubuntu-latest` wechselt auf Ubuntu 26

**Beobachtung:** Die CI-Ausgabe (Lauf 36763696005) kündigt an, dass `ubuntu-latest` ab 2026-10-19
auf Ubuntu 26 umgestellt wird. **Ursprung:** production-integrator, Merge STUDIO-LIMIT.
**Einschätzung:** niedrig; nur Hinweis, CI und Pages sind grün. Nach dem Wechsel den ersten Lauf
prüfen; bei Bruch Runner-Version pinnen.

### 2026-09-30 · `src/sim/defs/`, M8-Werte · Steuer „hoch" dominiert auch im Endzustand M8

**Beobachtung:** Mit Stufe 4 (M8) dominiert im Endzustand wieder die Steuer „hoch" (262,5 gegen
230 je Haus); M8 verschiebt den M5-Befund „hoch nach Sieg dominiert" nur. **Ursprung:**
lead-design, M8-Designvorschlag (R86). **Einschätzung:** Kandidat für eine Kurz-Spec nach M8.

### 2026-10-01 · `docs/studio/rulings.md` R88, `docs/studio/STUDIO.md` Budgetformel · Aufteilung je Lead ergibt mehr als die Summe

**Beobachtung:** R88 nennt den M7-Budgetantrag mit 64 Starts, die Aufteilung lead-art 41, lead-tech 23,
lead-qa 1 ergibt aber 65. Die Formel wird auf die Gesamtsumme angewandt und aufgerundet, die Anteile je Lead
werden danach einzeln aufgerundet; die Rundungsreste addieren sich. Das Handbuch sagt nur „L0 teilt die
Freigabe auf", nicht, wie gerundet wird. Der überarbeitete M7-Plan (`docs/m7-spec` @ 6396d15, 76 Starts)
hält die Summe nur, weil lead-qa ohne Aufschlag bei 1 bleibt, obwohl er „aufgerundet je Anteil" schreibt.
**Ursprung:** lead-tech, Plan-Überarbeitung M7-ISO; aufgenommen von lead-production im Gate Plan M7.
**Einschätzung:** niedrig, kein Schaden (Freigaben gehen je Session-Welle, der Gate Plan setzt die Zahlen
neu). Kandidat für den Verbesserungsprozess (`studio-coach`): ein Satz zur Aufteilung, z. B. „Summe der
Anteile = Formelsumme, Rundungsrest beim grössten Anteil".

### 2026-10-01 · `.claude/agents/tech-ui-engineer.md` / `art-rendering-engineer.md` · Ownership `src/render/`

**Beobachtung:** `tech-ui-engineer` führt `src/render/` weiter in seiner Ownership, der neue
`art-rendering-engineer` ebenso. Die Doppelung schadet nur, wenn ein Briefing die Dateien nicht je
Paket trennt.
**Ursprung:** Onboarding der M7-Personas (lead-production, R96 Punkt 8).
**Einschätzung:** Kandidat für die nächste Persona-Pflege: `src/render/` bei `tech-ui-engineer`
auf „nur auf Briefing" setzen. Bis dahin trennt der M7-Plan die Dateien je Task.

### 2026-10-01 · `docs/studio/templates/` / Roster · Persona-Feld `version`

**Beobachtung:** Die Persona-Vorlage hat kein Feld `version`, das Roster verlangt `version: 1.0`.
In `lead-art.md` steht ausserdem noch, Leads tragen Befunde selbst in `docs/beobachtungen.md` ein,
was R87 leicht widerspricht.
**Ursprung:** Onboarding der M7-Personas (lead-production, R96 Punkt 8).
**Einschätzung:** Fall für `studio-coach` bei der nächsten Handbuch-Pflege.

### 2026-10-01 · `src/render/`, Nachtrag M7-ISO · Iso-Folgethemen ausserhalb von M7

- **Berge und Klippen mit Höhe:** Der Anno-Look kennt sie, M7-ISO hält den Boden flach (D-08), weil die Sim keine
  Höhen hat. Fels bleibt flach in der Textur.
- **Durchsichtige Vordergebäude:** Hohe Gebäude verdecken, was dahinter steht. In M7 helfen nur die Höhenhülle und
  die Signale und Umrisse in der obersten Ebene (AK-ISO-15).
- **Achssperre beim Weg ziehen:** Ein waagerechter Zug im Bild ergibt eine Treppe aus Kachelschritten (D-15).
- **Lange Gebäude (`w ≠ h`):** Der Tiefenschlüssel ist nur für Quadrate bewiesen (ADR-012).

**Ursprung:** `lead-art`, Paket M7-ISO, Spec-Nachtrag Abschnitt 15.
**Einschätzung:** Berge und Klippen sind ein Kandidat für M9 oder eine spätere Stimmungsrunde, rein darstellend.
Die anderen drei Punkte prüft erst der Playtest nach dem Slice bzw. ein neues Gebäude. Kein Paket jetzt.

### 2026-10-01 · `tests/sim/balance.test.ts` (M6-Krisenlauf) · Krisenlauf `mild` knapp

**Beobachtung:** Der Krisenlauf `mild` (Seed 3) endet mit minMoney 13 und Endgeld 40. Ein einziger
zusätzlicher Brand (z. B. Schule, ≈ −400) kann ihn bei der nächsten Werteänderung rot machen.
Der Sieg im Lauf `normal` hängt zudem an der Wachenposition (Spiegelplatz vermutlich > 8000).
**Ursprung:** Kurz-Urteil lead-design zu M6-B2 (R101).
**Einschätzung:** Kein Design-Risiko für Spieler (Bot hält keinen Puffer), aber Test-Risiko: bei
jeder Änderung in `src/sim/defs/` zuerst diesen Lauf prüfen.

### 2026-10-01 · `src/sim/`, `tests/sim/`, `src/ui/inspect.ts` · Nachträge Final-Review M6-Sim

**Beobachtung:** (a) `tests/sim/scenario-saves.test.ts:215` führt brennbare Gebäude als feste
Id-Liste statt über das Flag `flammable`. (b) `src/sim/save.ts:86-87` wiederholt `CrisisKind` und
`FireOutcome` als Listen. (c) `src/ui/inspect.ts:30-31` zeigt „Brennt" nicht für Dienste und nicht
für brennende, nicht angebundene Betriebe. (d) `isWellFormed` prüft `tick` nicht als
nicht-negative Ganzzahl (bestand schon vor M6). (e) Feuerwache ohne Hinweis, dass sie ohne Krisen
nicht wirkt (Tooltip). (f) Abdeckungsregel der Feuerwache doppelt (`queries.ts` und `isProtected`
in `crises.ts`), durch AK-S4-02/03 gleich gehalten.
**Ursprung:** Final-Review lead-qa M6-Sim (R102), Bericht lead-tech M6-SIM.
**Einschätzung:** (c) und (e) gehören zu M6-U1; (a), (b), (f) beim nächsten Sim-Durchgang; (d) mit
dem Spielstand-Validierungs-Eintrag zusammen auswerten.

### 2026-10-01 · Plan-Vorlagen (`docs/superpowers/plans/`) · Rot-Erwartung bei fehlendem Export

**Beobachtung:** Pläne erwarten für den roten Testlauf die Meldung „does not provide an export". Vitest
liefert bei einem fehlenden Export stattdessen einen Laufzeit-`TypeError`.
**Ursprung:** M6-Sim, Tasks S2, S4 und B2 (Übergabe Gate Merge M6-Sim).
**Einschätzung:** niedrig; Hinweis für künftige Pläne (Rot-Erwartung „TypeError … is not a function"
bzw. allgemein „Test rot").

### 2026-10-01 · `tests/sim/scenarios.ts` · Importreihenfolge

**Beobachtung:** Der Import aus `defs/timing` steht vor `defs/tiers` und ist damit nicht alphabetisch.
**Ursprung:** Review M6-B2 (Übergabe Gate Merge M6-Sim).
**Einschätzung:** kosmetisch; beim nächsten Eingriff in die Datei mitziehen. M7-R1b fügt dort einen
Import ein (Regel im M7-Plan, Ausnahme `scenarios.ts`).

### 2026-10-01 · `src/sim/queries.ts` `goodsBalance` · Brennender Betrieb zählt in der Warenbilanz

**Beobachtung:** Die Warenbilanz rechnet nominal und übergeht `outageUntil`. Eine brennende Brennerei
hält deshalb „Rum ↑" in der Kopfzeile (Meldung lead-tech, S10). Der Playtest konnte es nicht prüfen,
weil die Dev-Vorschau Feuer nicht lief.
**Ursprung:** Heuristik-Prüfung und Playtest M7-UX (Stand `4c69776`).
**Einschätzung:** mittel. Das ist eine Sim-Änderung und gehört deshalb nicht zu M7-UX (UI-only). Beim
nächsten Sim-Durchgang mit Test beheben: Ausfall bedeutet keine Produktion in der Bilanz.
**Stand 2026-10-02:** erledigt durch R115 (R139): Die Bilanz zeigt bewusst die Dauerleistung.

### 2026-10-01 · `src/sim/` · Reason-Texte statt Codes, Literal 100 in `goodsBalance`, keine Auslastung

**Beobachtung:** (a) Sim-Aktionen liefern deutsche Freitexte als `reason`. M7-UX übersetzt sie in der UI
(`friendlyReason`) und hängt damit an den genauen Strings. (b) `goodsBalance` rechnet mit dem Literal 100
(Ticks je Bilanzzeitraum), nicht mit einer Konstante aus `defs`. (c) Eine Auslastung in % je Betrieb
liefert die Sim nicht, die UI könnte sie nur ungenau schätzen.
**Ursprung:** Kurz-Spec M7-UX, Abschnitt 5.
**Einschätzung:** niedrig. AK-UX-03 pinnt die Strings bis dahin. Beim nächsten Sim-Durchgang Reason-Codes
plus Text und eine Konstante prüfen. Auslastung nur, wenn ein späteres Paket sie braucht.

### 2026-10-01 · `src/ui/devParams.ts` · Dev-Vorschau `boom`/`signal` ohne Krisenkarte

**Beobachtung:** `?boom=1` und `?signal=alarm` ändern nur Darstellung und Ton, nicht die Krisenkarte der
Kopfzeile und nicht den Handel. Browser-Checks zu Karte und Boom-Marke brauchen deshalb echte Krisen.
**Ursprung:** Playtest M7-UX.
**Einschätzung:** niedrig; prüfen, ob M7-Spec 9.5 das so vorsieht. Sonst lassen sich Checks mit
Szenario-Saves fahren.

### 2026-10-01 · Spieltakt bei 4× · Tickrate schwankt

**Beobachtung:** Bei 4× liefen im Headless-Chrome etwa 15–40 Ticks/s statt 40.
**Ursprung:** Playtest M7-UX (Headless, CDP).
**Einschätzung:** niedrig; wahrscheinlich eine Grenze von Headless und Drosselung. Erst auf einem
Echtgerät nachmessen, bevor jemand handelt.

### 2026-10-01 · `src/ui/`, `src/render/`, Dev-Server · Nachträge INT-Check M7

**Beobachtung:** (a) `favicon.ico` liefert 404 (Dev-Server). (b) In der Einstellungs-Karte ist das
Segment „Bewegung reduzieren" schmaler als die Zeile darüber. (c) Terrain-Aufbau bei DPR 2 bis
988 ms, nahe der Grenze 1500 ms (AK-R1-06). (d) AK-U1-06 (≤ 12 Figuren) nur per Auge prüfbar; ein
Dev-Zähler in `__inselRender` würde es messbar machen. (e) HUD-Select „Krisen" zeigt Arial statt
`--font-serif`.
**Ursprung:** INT-Check M7 (lead-tech, R119), Bericht X1b (lead-art).
**Einschätzung:** niedrig; (a), (b), (e) passen zu M7-UX, (c) beobachten, (d) beim nächsten QA-Werkzeug.

### 2026-10-01 · `src/ui/`, Git-Historie · Nachträge Final-Review M7

**Beobachtung:** (a) `src/ui/eventLogView.ts`: `toggle.blur()` nimmt Tastaturnutzern nach Enter oder
Leertaste den Fokus; die Einstellungs-Karte (`aria-modal`) hat keine Fokus-Falle. (b) `saveSettings`
schreibt bei jedem `input`-Ereignis der Regler in `localStorage` (statt bei `change`). (c) Commit
463da8b auf `feat/ui-m6m7` trägt das Präfix `style:` ausserhalb der Commit-Konvention; ohne Rebase
nicht korrigierbar. (d) `tests/render/water.test.ts`: `STORM_WAVE_ALPHA` 0,32 liegt nur 0,03 unter der
Schaum-Schwelle 0,35; eine Invariante `STORM_WAVE_ALPHA < FOAM_ALPHA[0]` fehlt.
**Ursprung:** Final-Review M7 (lead-qa, qa-code-reviewer opus) auf `feat/ui-m6m7` @ a8d9447.
**Einschätzung:** niedrig; (a), (b) passen zu M7-UX, (c) nur zur Kenntnis, (d) bei der nächsten
Render-Änderung mitnehmen, falls nicht schon in der Kleinst-Fix-Runde erledigt.

### 2026-10-01 · `docs/superpowers/specs/2026-10-01-m7-ux-design.md` L1 · Startkarten-Text ohne Autosave

**Beobachtung:** Die Startkarte zeigt bei jedem ladbaren Slot den L1-Text „Der bisherige Autosave
wird … ersetzt", auch wenn nur ein manueller Stand existiert. Das Menü unterscheidet seit R125
über `slot === 'auto'`, die Startkarte nicht.
**Ursprung:** Planpflege lead-tech nach Gate Plan M7-UX (R125).
**Einschätzung:** niedrig; im Task-Review der Startkarte (Task 4) mit derselben Fallunterscheidung lösen.

### 2026-10-01 · `tools/studio/metrics.py --milestone` · Meilenstein-Metrik ohne Cloud-Session

**Beobachtung:** `metriken/M7.md` zählt nur die lokalen Sessions 664ac8d3 und 5e248230. Die
Cloud-Session ddd9a9ac (96 Agenten, 323,8 min, 1650 Werkzeugaufrufe laut
`metriken/S-2026-10-01-ddd9a9ac.md`) fehlt, weil ihre Rohdaten im Cloud-Container lagen; Welle 2 von
M7 ist in Aufwand und Qualität der Meilenstein-Metrik nicht enthalten. Zudem führt die Zeile
`studio-director` 812 Agenten bei 1 gemessenen.
**Ursprung:** Retro M7 (studio-coach), B7.
**Einschätzung:** mittel für die Verbesserungsschleife (Meilenstein-Vergleiche werden schief, sobald
Cloud-Sessions mitarbeiten). Denkbar: Session-Metrik-Dateien beim Meilenstein-Lauf mitsummieren oder die
Lücke im Bericht ausweisen; Kandidat für lead-production.

### 2026-10-02 · `src/ui/startCard.ts`, `src/ui/modal.ts` · Erster Tab nach der Startkarte

**Beobachtung:** Erster Tab nach dem Schliessen der Startkarte landet im Panel auf „Kartenzeichen" statt in
der Kopfzeile.
**Ursprung:** Browser-Prüfung M7-UX-H1 (lead-qa, Final-Review M7-UX).
**Einschätzung:** niedrig; vermutlich geht der Fokus beim Schliessen (`restoreFocus`) an kein Element der
Kopfzeile zurück, sodass der Browser die Tab-Folge an der zuletzt fokussierten Stelle im DOM fortsetzt.

### 2026-10-02 · `src/ui/menu.ts:99`, `src/ui/trade.ts` · Gesperrtes vor der Freischaltung sichtbar (M8, S11)

**Beobachtung:** Nach M8 (S11-Minimum) sind Glashütte und Badehaus bis zur Freischaltung der Stufe 4 gesperrt und
fehlen in der Bauleiste. Zwei Stellen zeigen sie trotzdem ab Spielbeginn: (a) die Tastenliste im Menü
(`hotkeyList()` in `menu.ts:99`) nennt J und O mit Namen; (b) das Handels-Panel bietet Glas zum Kauf und Verkauf an
(`trade.ts` bleibt in M8 unverändert, R150; M8-Spec §23 Widerspruch 2).
**Ursprung:** Delta-Gate H-M8 (R152, B3) und Spec-Nachführung H-M8 (R150).
**Einschätzung:** niedrig, kein Fehler im Sinne der M8-Spec. Dieselbe Klasse „UI zeigt nur Freigeschaltetes"
(Nutzernachtrag S11): gehört in die M10-Spec „Schritt für Schritt" (Programm
`docs/superpowers/specs/2026-10-02-programm-nutzerfeedback.md` §3.8, Grundsatz 5), dort zusammen mit Lager-Chips,
Hotkeys und Bauleiste über `unlocked` lösen.

- 2026-10-03 · Studio-Werkzeuge (`tools/studio/model.py`, Budget-Zählung) · Der Alarm „Budget von studio-director überschritten“ zählt Knoten mit Rolle „unbekannt“ mit, die nur aus `general-purpose`-Heartbeats entstehen (Live: 22 von 3 bei 3 echten Starts nach dem Budget-Event EFF). Der Zählbeginn ab dem jüngsten Budget-Event ist seit `2663c66` korrigiert, die Zuordnung der Heartbeat-Knoten nicht. Ursprung: Paket EFF-W (R168). Erste Einschätzung: Heartbeat-Knoten ohne Rolle nicht als Start zählen bzw. dem Spawn per agent_id zuordnen; wichtig, sobald L0 nach E-010 öfter direkt Arbeiter startet.

## Ausgewertet 2026-09-30

### Erledigt (überholt)

- Kein `dispose()` für Listener, ResizeObserver und rAF → M4: `startGame` liefert `dispose()` (`src/ui/app.ts`).
- Toast-Stapel bei Klick-Spam → M4: `MAX_TOASTS` 3, `DEDUPE_MS` 1000 (`src/ui/messages.ts`). Touch-Teil → M5 U1a (unten).
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
- Paket-Kandidat Bedienkomfort (QoL) aus M1–M4 → M5 (Spec 10.1, Q1–Q7): Aktion auf der Drück-Kachel,
  Tastatur-Pan mit `dt`, Pinch und Zwei-Finger-Pan (U1a, `src/ui/input.ts`); Handelsbuttons klickbar mit
  Grund, tatsächliche Rückerstattung (U1b, `src/ui/trade.ts`, `inspect.ts`); Laden behält Tempo und Kamera
  bei gleicher Karte (U1a, `src/ui/app.ts`); ganzzahlige Kachelkanten gegen Weg-Nähte (A1,
  `src/render/camera.ts`). Browser-Checks U1a, U1b, A1 OK. Damit auch die Abgehakt-Zeile „Laden setzt
  Geschwindigkeit und Kamera zurück".
- Paket-Kandidat Spielkonzept „Tiefe, Dynamik, Ambiente, QoL" (Nutzer-Playtest nach M4) → M5
  (`docs/superpowers/specs/2026-09-30-m5-spielerlebnis-design.md`).
- „Verkauf als Dauergewinn" (stapelbarer Gewinn aus Verkauf zu Fixpreisen, Werte-Datei M5, stand nie als
  eigener Eintrag hier) → M5-S2: Verkaufssättigung (`src/sim/trade.ts`, Spec 5.2), Test AK-S2-01.

### Abgehakt (bewusst nichts tun, mit Trigger)

| Befund (Fundort)                                                                                                    | Begründung                                                             | Zurück, wenn …                                                                         |
| ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Abriss-Regel doppelt, Viewgrösse doppelt (`input.ts` `updateHover`, `app.ts`)                                       | Zwei Aufrufer, `inspect.ts` nutzt die Regel nicht                      | ein dritter Aufrufer entsteht                                                          |
| Gebirgsanteil schwankt stark je Seed (`mapgen.ts`)                                                                  | Nachbedingungen sichern Wald und Land; Balancing-Test läuft auf Seed 3 | ein Playtest eine unspielbare Karte meldet oder der Balancing-Test mehrere Seeds prüft |
| `adjacentReason`/`radiusReason` leiten die Meldung aus dem Terrain ab (`placement.ts`)                              | Vier Meldungen, überschaubar                                           | eine fünfte Regel dazukommt                                                            |
| `hash2` mit schwacher Avalanche (`noise.ts`)                                                                        | Keine sichtbaren Muster gemeldet                                       | Karten sichtbare Muster zeigen                                                         |
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

### Falsche Prämissen

| Befund                                  | Behauptet                                                 | Gemessen                                                                                                       |
| --------------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Gebirgsanteil je Seed                   | 1–27 % der Insel                                          | 0,7–55 % des Landes über die Seeds 1–200 (Median 14 %, Messung per `generateMap`)                              |
| Handelsbuttons ohne Grund               | „`'Kein Geld'` aus `buy()` unerreichbar"                  | „Kein Geld" gilt für negativen Kontostand; bei zu wenig Geld meldet `buy` „Zu wenig Geld" — beide unerreichbar |
| inaktiv-Vorfälle abgebrochener Sessions | Workaround „steht in der state.md-Übergabe"               | `state.md` nennt `make studio-archive` nicht, nur `STUDIO.md`                                                  |
| Halbe Steuer nach dem Aufstieg          | „in derselben 100er-Buchung"                              | nur wenn der Aufstieg auf einen Buchungstick fällt (Wachstum alle 50, Buchung alle 100 Ticks)                  |
| Abriss-Regel doppelt                    | Zusammenziehen „beim dritten Aufrufer (Inspect-Panel M2)" | `inspect.ts` gibt es, er nutzt die Regel nicht; der Trigger ist nicht eingetreten                              |
| Server-Tests                            | „~5 s"                                                    | 14 Tests, 7,4 s (`python3 -m unittest tests.test_server`)                                                      |

- 2026-10-01 · Harness · In der Cloud-Session fehlt Subagent-Leads das Agent-Werkzeug (nur Read, Grep, Glob, Write, Edit, Bash, Skill, SendMessage). Folge: R108, L0 startet Arbeiter direkt.
- 2026-10-01 · Tests · `tests/render/terrain.test.ts` AK-R1-08 (I5, Z. 338) läuft unter voller Parallellast von `make check` in den 5-s-Timeout (isoliert grün). Vorschlag: eigener Timeout für diesen Test (Render-Strang, Fix-Kandidat R2/R4). Quelle: Review M7-R5.
- 2026-10-01 · UI · `protectedCount` (src/ui/inspect.ts, M6-U1 @ 0d52030) rechnet die Abdeckungsgeometrie der Feuerwache in der UI nach (dieselbe Formel wie `isProtected`). Entscheid L0 (Review M6-R2): nicht auf die Render-Maske umstellen (2×2 nur Näherung), sondern auf die Sim-Abfragen `isProtected`/`unprotectedFlammables`; Umsetzung im UI-Strang mit M6-U3. Quelle: Bericht tech-ui-engineer M6-U1.
- 2026-10-01 · UI/Dev · `favicon.ico` 404 im Vite-Dev-Server erzeugt einen Konsolen-`error` (QA-M6U1).
- 2026-10-01 · UI · Nach „Laden" läuft der Stand sofort mit 1× weiter statt pausiert; die M6-Spec nimmt für Szenarien Pause an. Prüfen in M6-U2/INT-Check (QA-M6U1, `04-feuerwache-szenario.png`).
- 2026-10-01 · UI/Sim · Eine brennende Brennerei zeigt weiter „Rum ↑ +2.0" im HUD und „Erzeugt Rum alle 50 Ticks" im Panel; prüfen, ob die Anzeige den Ausfall berücksichtigen muss (QA-M6U1, `08-brennt-1280.png`).
- 2026-10-01 · Tests · Muster (3× in dieser Session): Zeittests in `tests/render/terrain.test.ts` (AK-R1-06 Z. 218 mit festem 1500-ms-Limit, AK-R1-08 Z. 338/339) flackern unter Volllast von `make check`. L0: Fix im Render-Strang direkt nach R2 (eigener Commit), Gate-Läufe bis dahin einmal wiederholen.
- 2026-10-01 · Doku (für D1) · `docs/arc42.md:181,428` nennen noch `{ muted, volume }` und das alte `createSound`; `README.md:92` beschreibt die Kopfzeile mit Lautstärke und Tag-Nacht. Nach M7-U1: Busse master/music/ambience/effects, `reduceMotion`, `crisisLevel`, Migration volume→master, HUD nur Stumm + Einstellungen (Review M7-U1).
- 2026-10-01 · UI · `DevPreview.extinguishedId` (devParams.ts:45) wird geparst, aber nicht verwendet; vorgesehen für den Lösch-Effekt (Kann K1/M6-U3).
- 2026-10-01 · Studio · Ein Implementierer nutzte `git stash` für einen Rot-Nachweis, während fünf Worktrees parallel liefen (der Stash-Stapel ist allen Worktrees gemeinsam). Ging gut, ist aber riskant. Vorschlag für Briefings: Rot-Nachweis per WIP-Commit oder `git worktree add --detach` am alten SHA, nie bare `git stash` (Retro-Kandidat).
- 2026-10-01 · UI · Ein Drag zum Pannen, der auf einem Gebäude beginnt, wählt das Gebäude aus (Panel öffnet). Prüfen im INT-Check, ob Auswahl erst beim Loslassen ohne Bewegung erfolgen soll (QA-R2).
- 2026-10-01 · Doku (für D1) · Spec 5.2/6.5 nennen die Feinschliff-Werte aus R111 nicht (Wellenalpha 0,32, Boost 0,5, Rauch 0,85, Bodenschein). Im Doku-Pass nachtragen. `water.test.ts:245` Schwelle 0,35 aus den Konstanten ableiten (Review 2cace60).
- 2026-10-01 · Render · Rauch-Puffs zeigen sichtbare Scheibenkanten („gestempelt"), niedrig; Kandidat für die Kann-Welle oder einen Feinschliff nach R4 (QA-R3b).
- 2026-10-01 · Spec (für D1) · AK-R3-03 Pixelprobe hängt vom Blinktakt ab (an/aus); Formulierung auf „in mindestens einem von N Bildern im Abstand 0,4 s" präzisieren (QA-R3, QA-R3b).
- 2026-10-01 · Dev · `?feuer=<id>` hängt von der Gebäude-ID des Spielstands ab; QA-Briefings nennen das Gebäude, nicht die ID (QA-R3b).
- 2026-10-01 · UI (mit M6-U3) · `gameButton` ruft `blur()` bei jedem Klick: Enter auf „Laden" zeigt „Wirklich laden?", der Fokus geht auf body, Bestätigen per Tastatur nur über Shift+Tab (QA-UI-2).
- 2026-10-01 · UI (mit M6-U3) · Boom-Marke bricht in der Gut-Zelle in die Zeile der Verkaufen-Spalte um; gehört an den Gutnamen (QA-UI-2).
- 2026-10-01 · UI (INT) · HUD wächst bei aktiver Krisenkarte um ~45 px (174 → 219 px) und verschiebt die Spielfläche (QA-UI-2).
- 2026-10-01 · UI · Randfall: Druck auf Hintergrund, Loslassen im Dialog schliesst trotzdem (click geht an den gemeinsamen Vorfahren). Selten, Fokus korrekt; mit M6-U3 über pointerup-Ziel lösen (QA-UI-2).
- 2026-10-01 · Audio (INT) · Musik: In 25 s Testlauf kein Ladeversuch beobachtet (keine Audio-404), Zustand blieb idle/pause; den Rückfall „aus nach 2 Fehlversuchen" im INT-Check mit längerem Lauf belegen (QA-UI-2).
- 2026-10-01 · Tests (Render, Nachzug) · Review R113: (a) `tests/ui/target.test.ts` und `iso.test.ts` laden `sprites.ts` nicht und testen nur den Hüllenpfad; Test mit geladenem sprites über `targetTile` ergänzen. (b) Kein Test führt `bodyPolygons` für alle SILHOUETTES/Fallbacks aus (Aufzeichnungskontext kennt nur Pfadoperationen; Verläufe würden werfen). (c) Kommentar/Beschreibung zu `hoverPoint` in verdeckung.test.ts präzisieren (`inHull` tol −3 = „3-px-Randzone"). (d) arc42: Picking über Silhouette und Registrierung `setBodyShapes` im Doku-Pass beschreiben.
- 2026-10-01 · Render (Feinschliff nach R4) · QA-R4: Herdrauch morgens/abends zu schwach gegen die warm getönte Wiese; Möwen über hellem Sand kaum sichtbar (Kontur/Schatten); Fensterschein bei starkem Zoom als Ringe mit Kante erkennbar. L0: kleiner Feinschliff-Commit im Render-Strang vor dem Final-Review.
- 2026-10-01 · UI (INT) · Roter Punkt und violetter Ring mit weissem Rand an Gebäuden (z. B. Werkzeugmacher, Kapelle) sind im Spiel nicht erklärt; Legende/Tooltip prüfen (QA-R4).
- 2026-10-01 · Render (niedrig) · `layoutKey` ist ein Gesamtschlüssel; der Weggraph in life.ts baut bei Brand/Anbindungswechsel unnötig neu (separater `roadKey` möglich); `layoutKey` läuft bis zu 5× je Frame (~0,2–0,4 ms), Frame-Memo möglich (Review fix/layoutkey 42d39b7).
- 2026-10-01 · Studio (Retro-Kandidat) · Eine per SendMessage nachgeschobene Aufgabe, die über das ursprüngliche Briefing hinausging („nur Tests" → Produktcode), wurde vom Permission-Classifier blockiert; der Implementierer hatte zudem per Python-Skript statt Edit/Write geändert. Lehre: Umfangserweiterungen als neues Briefing an einen neuen Arbeiter, nicht als Nachtrag; Briefings nennen Edit/Write ausdrücklich.
- 2026-10-01 · Doku (für D1) · M6-U3: Kann-Posten D3 „Gelöscht" (extinguished) nicht verdrahtet — Streichung im Doku-Pass festhalten; Spec-Notiz zur Panelzeile „Erzeugt X nicht — Betrieb brennt" (R115); Stimmungswetter noch `null` (Kann K3).
- 2026-10-01 · UI (niedrig) · QA-M6U3: Panel einer brennenden Brennerei zeigt weiter „Verbraucht Zuckerrohr" (Textfrage); nach „Handeln" trägt der erste Knopf „+1" einen Fokusring trotz Mausklick; Boom-Münze kurz nach Boom-Start nicht sichtbar (Einblendphase?).
- 2026-10-01 · Studio · QA-Baum `ui-qa` wurde während QA-M6U3 von einem Reviewer auf einen neuen Stand umgestellt (R116: QA-Bäume exklusiv, Reviewer nutzen eigene detached Worktrees).
- 2026-10-01 · Erledigt durch D1 (8ec874b, 4c69776 auf feat/ui-m6m7): arc42/README zu Settings und HUD (Review M7-U1); Doku-Teil der R111-Werte; AK-R3-03-Formulierung; R113 (d) arc42 Picking/setBodyShapes; M6-U3 Doku-Punkte (D3, R115, K3). Offen bleiben: `water.test.ts`-Schwelle (Code, R117) und R113 (a) Test über `targetTile` in tests/ui.
- 2026-10-01 · Nutzer-Playtest/M9 (R120) · HUD springt bei Sturmwarnung um 38 px (1280×800); Laden behält das Tempo; Bedarfsmarker ohne Legende; Warnringe bei vielen Bränden kantig/überlappend; Abend (Tick 2400) kaum getönt; Sturm am Tag wenig Himmelstönung; AK-A2-04 Wording (sfx nach Bedarf unter audio/sfx/). Messhinweis: Headless-Chromium braucht `--disable-gpu`, sonst ~1 fps.
- 2026-10-01 · Studio (Werkzeug) · `make studio-test` rot: `test_all_personas_have_names` erwartet `studio-process-coach` in `PERSONA_NAMES` (`tools/studio/model.py`); das Onboarding 339c728 legte nur die Persona-Datei an. Vor dem nächsten Push von `main` beheben (Paket lead-production); Retro `retros/2026-10-01-session-8c0e0295.md` B3.
- 2026-10-02 · Doku (README:370) · Kommentar zu `make check` („Lint, Tests und Build wie in der CI") nennt die neue Plattformwache `pages-limit` nicht (Review PAGES-LIMIT; README war nicht im Paket-Scope). Beim nächsten Doku-Pass mitnehmen.
- 2026-10-02 · CI (niedrig) · `node tools/pages/check.ts` braucht Node ≥ 22.18 (Typ-Stripping ohne Schalter); Workflows setzen nur `node-version: 22`. Erster CI-Lauf auf `main` belegt es; schlägt er fehl, `check-latest: true` in `setup-node` setzen (Review PAGES-LIMIT).
- 2026-10-02 · Design (Kandidat späterer Design-Durchgang „Spielerführung Wirtschaft") · Erstspieler-Playtest M7-UX-QA (`.studio/qa/M7-UX-QA/report.md`, 3e4123c), alle spec-konform, also Designlücken: (a) Neue Stolperstelle 2: `nextStep` Regel 3 sieht nur den Ist-Zustand (`houseDiagnosis`) und die Bedürfnisse der nächsten Stufe; sinkender Bestand eines Grundguts (Nahrung ↓ ohne Fischerhütte) wird erst gemeldet, wenn er fehlt — vorher zeigt „Nächster Schritt" schon auf Stoff. Vorschlag: Regel „Gut mit negativem Saldo, Vorrat < N Minuten, kein Erzeuger → baue {P}" vor die Stufen-Bedürfnisse; ändert AK-UX-08. (b) Neue Stolperstelle 5: Handel am Kontor zeigt keinen Bezug zum Auftrag (A6 „grenzwertig", 90 s); Vorschlag: Auftragsgut im Handel markieren („Auftrag: 11 Nahrung"). (c) Neue Stolperstelle 1: Weg-Vorschau „verbunden mit dem Kontor" bezieht sich auf die Wegkachel, liest sich aber wie „Betrieb verbunden"; Text präzisieren (z. B. „Weg am Kontor-Netz", bei berührtem unverbundenem Betrieb „verbindet {Name}").
- 2026-10-02 · UI (niedrig, spec-konform) · M7-UX-QA: Bauleiste wächst beim Öffnen einer Kategorie um ~35 px (AK-UX-15 erlaubt ≥ 520 px); Menü-Karte scrollt bei 1280 × 800 intern (Seite scrollt nicht, AK-UX-15 erfüllt); Legende „Kartenzeichen" zeigt den roten Punkt als eckiges Feld (Farbfeld rund zeichnen, Trivial-Fix-Kandidat) und ist standardmässig zu (so spezifiziert).
- 2026-10-02 · UI/Design (niedrig) · Bau-Eintrag zeigt nur „{Name} · {n} Geld"; ist er wegen einer Ware unbezahlbar (Schule: Stein), wirkt die Geldangabe bei vollem Konto irreführend, der Grund steht nur im Tooltip. Kandidat für den Design-Durchgang oben (fehlende Ware im Eintrag nennen).
- 2026-10-02 · Persistenz (`src/ui/app.ts`, `src/ui/storage.ts`, `src/ui/startCard.ts`) · Final-Review M7-UX (lead-qa, qa-code-reviewer opus, `feat/m7-ux` @ 0be9b8c, R133): (a) N1 niedrig: Ist der Speicher nicht verfügbar, geht die im Menü gewählte Krisenstufe bei „Neue Insel" still verloren (`app.ts:259–262` ignoriert das Ergebnis von `saveSettings`, `restart` liest `loadSettings()` neu; das alte `setCrisisLevel` meldete den Fehler). Repro: `setItem` werfen lassen → Menü → „mild" → Neue Insel → Ja → Standardstufe. Vorschlag: Stufe über `StartOptions` durchreichen. (b) N2 niedrig, **Designfrage an lead-design**: `pagehide` (`app.ts:704`, `autosaveOnHide`) schreibt den gerade geladenen älteren Stand als Autosave. Repro: Autosave 30:00, manueller Stand 5:00 → Startkarte „Laden (5:00)" → Tab schliessen → Reload zeigt „Fortsetzen — Autosave (5:00)", 30:00 ist weg. Frage: Soll Laden den Autosave ersetzen (dann Hinweis wie bei „Neue Insel") oder erst nach Spielfortschritt (`tick` seit Laden gestiegen)? (c) N6: Der Eintrag „Startkarten-Text ohne Autosave" vom 2026-10-01 ist in Task 4 nicht gelöst worden (`startCard.ts:136`), bleibt offen.
- 2026-10-02 · UI (niedrig) · Final-Review M7-UX, aufgeschobene Minor-Befunde aus dem Ledger: (a) aktiv + unbezahlbar: `.btn.active` macht die gestrichelte Kante unsichtbar (Gold auf Gold; lead-tech, nach R132). (b) N7: `guide.ts:169` „Weg (R)" fest im Text statt `hotkeyLabel`; `nextStep` Regel 2 und `remedyText` nutzen `hotkeyLabel` ohne Null-Schutz (heute theoretisch). (c) Esc oder Rechtsklick mit Fokus auf einem Bau-Eintrag lässt den Fokus auf `body` fallen (QA-UX5). (d) Esc in den Credits schliesst die ganze Einstellungs-Karte (Altverhalten). (e) Ladefehler laufen über `showError` mit Fehlerton. (f) `#panel` `max-height: 38vh` unter 600 px Fensterhöhe ungeprüft. (g) Unter 1280 px (Desktop-first, geparkt): Toast überlappt bei 800 px den Meldungsstapel um ~40 px (QA-UX1); „Menü" liegt bei 390 px ausserhalb (QA-UX2). (h) Zwei gleichnamige Betriebe, die im selben Schritt angebunden werden, ergeben durch den `showMessage`-Dedupe nur eine Meldung (QA-UX3). N8 (Bau-Eintrag nennt nur Geld) steht schon oben.
- 2026-10-02 · Code/Tests/Doku (niedrig) · Final-Review M7-UX: (a) N5 toter Code: `storage.ts:82 noLoadableReason` ohne Aufrufer; `balanceLabel`, `orderChange` nur noch von Tests benutzt; CSS `.btn small` ohne Verwender. (b) Testlücken, jeweils im Browser abgenommen: kein Vitest für „Kontor öffnet Handel" und den Lebenszyklus des Meldungsstapels, keiner für „Hotkeys stumm bei offener Karte"; `toolName` nur indirekt geprüft; `settingsPanel.test.ts` nur Smoke-Test (Ausnahme laut Spec); `guide.test.ts` prüft bei R5/R6 nur den Satzanfang; `format.test.ts` importiert doppelt aus `dom`; Szenario `leistung-50` hat nur ~34 Wegkacheln (AK-UX-31 misst damit ein kleineres Netz als der Name sagt). (c) `README.md:252` Klammer mitten im Satz „Unterhalt und Geld". Bei der nächsten UI-Runde mitnehmen.
- 2026-10-02 · Render (Leistung, vor M9/M12) · Gebäude werden jeden Frame ohne Cache neu gezeichnet; das belastet das Frame-Budget, sobald M9/M12 mehr Gebäude und Effekte bringen (FB-TRIAGE). Einschätzung: Kandidat für einen Render-Cache je Gebäudetyp/Zustand, mit `leistung-50` messen, bevor M9 plant.
- 2026-10-02 · Sim (Leistung, vor M12) · `serviceAvailable` wird je Haus und Tick über alle Gebäude gerechnet (O(Häuser × Gebäude)) und skaliert schlecht mit grossen Karten (FB-TRIAGE). Einschätzung: vor M12 ein Index je Dienst-Gebäude oder Abdeckung bei Layout-Wechsel vorberechnen; Determinismus und Balancing-Test bleiben Prüfgrundlage.
- 2026-10-02 · Render (Terrain-Cache) · Der Terrain-Cache hängt an `layoutKey` und bemerkt keine Terrainwechsel (FB-TRIAGE). Einschätzung: heute ohne Wirkung, wird mit Strang S3 „Wald roden/aufforsten" zum Fehler; Cache-Schlüssel um einen Terrain-Stand erweitern, im Plan von S3 mitnehmen.
- 2026-10-02 · Studio (Dashboard/Board) · Im Board steht ein Eintrag mit Meilenstein „Studio-Graph" im Status `blocked` ohne Paket-ID (`package_id` fehlt in `.studio/events.jsonl`), vermutlich altes Event-Format (lead-production, Board-Aufräumen M8-DOCS-MERGE). Einschätzung: `production-studio-ops` prüft, ob `model.py` das alte Format lesen soll oder der Eintrag archiviert wird.
- 2026-10-02 · Render (`src/render/renderer.ts` Durchgang 7, `drawAir`/`drawHearthSmoke`; `sprites.ts` `drawAir`) · Betriebs- und Herdrauch zeigt denselben Tiefenfehler wie das Fensterlicht: er wird nach allen Objekten gezeichnet und liegt über Gebäuden und Bäumen, die davor stehen. Ursprung: BUG-LICHT. Der Clip-Helfer `clipOutOccluders` passt, aber für jedes Gebäude mit Rauch pro Frame (nicht nur nachts, nicht nur bei Licht) wären Verdeckersuche und Clips nötig; die Rauchbox ist zudem nicht dieselbe wie die Bildbox (Puffs steigen über die Bildbox hinaus). Das sprengt „ohne Umbau und höchstens ein Test". Erste Einschätzung: eigenes kleines Paket mit Leistungsmessung; Variante: Rauch in den sortierten Durchgang 6 direkt hinter sein Gebäude ziehen, statt zu clippen.
- 2026-10-02 · Render (`src/render/life.ts` Licht-Verdecker) · Review BUG-LICHT (qa-code-reviewer, BEDENKEN ohne Blocker), aufgeschobene Niedrig-Befunde: (a) Der Flächen-Cache `buildingClips` rendert `bodyPolygons` ohne `env`; die Kaimauern des Kontors (`waterSides`) verdecken deshalb kein Licht (nur eine dünne Kante). (b) `CROWN_RY` ist in `life.ts` aus `trees.ts` dupliziert, ohne Test, der beide bindet; Vorschlag: in `trees.ts` exportieren und die Kopie entfernen. (c) `pruneContained` prüft Enthaltensein nur über Eckpunkte und ist für nicht konvexe Flächen unsicher (mögliches Licht-Leck); bei Kanten-Nachbarn kann mit 0,5 px Toleranz eine Haarlinie durchscheinen, in der Sichtprüfung nicht sichtbar. (d) Testlücken: kein Test „Figuren verdecken nicht" und keiner für mehrere Clip-Gruppen mit echter Überlappung. (e) Leistung: P95 `leistung-50` bei Nacht +6 % (vsync-gedeckelt bei 120 Hz), Skriptzeit je Frame aber +33 % (2,7 → 3,6 ms) und GPU-Zeit etwa verdoppelt (1,9 → 3,9 ms); auf schwacher Hardware nachmessen (60 Hz oder CPU-Drosselung). Ursprung: BUG-LICHT. Erste Einschätzung: (a) bis (d) bei der nächsten Render-Runde mitnehmen, (e) im nächsten Leistungs-Check von M8/M9.
- 2026-10-02 · QA-Werkzeuge (`.studio/qa/M7-SLICE/mess/measure.mjs`, `run-slice.sh`, ungetrackt) · Die M7-Mess-Skripte laden den Spielstand über „Laden" im Menü. Mit der Startkarte aus M7-UX laufen sie ins Leere. Für BUG-LICHT gab es eine lokale Kopie unter `.studio/qa/bug-licht/mess/`, die über die Startkarte „Fortsetzen" lädt. Ursprung: BUG-LICHT (art-rendering-engineer). Erste Einschätzung: Mess-Skripte versioniert unter `tools/` ablegen und an die Startkarte anpassen, damit der nächste Leistungs-Check (M8/M9) nicht wieder improvisiert.
- 2026-10-02 · Render (`src/render/life.ts` `crownPolys`, `src/render/trees.ts`) · Seit H-R1 gibt es Nadelbäume (Dreiecke, Spitze über der Ellipse, Fuss breiter). Die Licht-Verdecker aus BUG-LICHT nähern jede Krone weiter als Ellipse an; an Nadelbaumspitzen kann Fensterlicht minimal durchscheinen, neben dem Fuss minimal zu viel verdeckt werden. `life.ts` lag nicht im Scope von H-R1. Ursprung: H-R1 (lead-art beim Zusammenführen mit BUG-LICHT). Erste Einschätzung: bei der nächsten Render-Runde `crownPolys` nach `crown.kind` formen und zusammen mit `CROWN_RY` aus `trees.ts` exportieren (siehe Review BUG-LICHT (b)).
- 2026-10-02 · Render (`src/render/terrain.ts`) · H-R1: (a) Je Ladevorgang erscheinen drei `[terrain] Aufbau`-Zeilen in der Konsole; die Terrain-Ebene wird beim Start offenbar mehrfach gebaut (je ~250 ms bei dpr 1, ~650 ms bei dpr 2). (b) Die Teil-Neuzeichnung nach einem Gebäude kostet seit H-R1 3,4–4,3 ms statt 0,7–0,8 ms (Grenze 8 ms); `paintDecor` prüft `isFreeGrass` und `valueNoise` je Tonschleife neu. (c) Pixel am Kachelrand färben sich nach dem Nachbartyp (Graskachel zeigt Felspixel am Rand). (d) Die Hangschattierung am Gebirge ist gemessen fast doppelt so stark, im Bild aber vom kräftigen Felsmuster überdeckt. Ursprung: H-R1 (qa-playtester, qa-code-reviewer, art-rendering-engineer). Erste Einschätzung: (a) prüfen, wer `buildTerrainLayer` mehrfach ruft (Startkarte/Fortsetzen); (b) Deko je Kachel vorberechnen, falls Bauserien ruckeln; (c) Absicht der weichen Übergänge, nur beobachten; (d) mit G3 (Felsmassive) lösen, nicht über eine weitere Anhebung der Grenze.
- 2026-10-02 · QA-Werkzeuge (`.studio/qa/bug-licht/mess/`, Dev-Sonden) · H-R1-Playtest: `window.__inselPerf` füllt sich nur mit `?perf=1`; `cdp.mjs` wirft bei `Input.dispatchKeyEvent` mit `text` für Nicht-Zeichen-Tasten (Escape); `frameMedian` ist bei 120-Hz-Bildschirmen auf 8,3 ms gedeckelt und trennt Stände kaum, `renderMedian` ist die aussagekräftige Zahl. Ursprung: H-R1 (qa-playtester). Erste Einschätzung: zusammen mit dem Eintrag oben (Mess-Skripte versioniert unter `tools/`) erledigen.
- 2026-10-02 · Tests (niedrig) · M8 Tasks 1 und 3 (Reviews qa-code-reviewer): (a) `tests/sim/defs.test.ts` Testtitel „has 14 building defs …" ist veraltet (prüft jetzt 16); der Plan erlaubt in Bestandstests nur Erwartungswerte, deshalb nicht umbenannt. (b) `tests/sim/helpers.ts` `placeService` (Z. 59–63) setzt `won` ohne `try/finally` zurück; bei einem Wurf bleibt `won` im Testzustand gesetzt (`withUnlock` in `tests/sim/scenarios.ts` hat `try/finally`; berichtigt nach Sim-Final-Review M8, L-1). Ursprung: M8-S1/S2. Erste Einschätzung: bei der nächsten Sim-Test-Runde mitnehmen (Titel aus `BUILDING_IDS.length` bilden, `finally` ergänzen).
- 2026-10-02 · Render (`src/render/life.ts` `gullAnchors`) · Die Möwen kappen auf `cap('gulls')` nur über die Zellen, die den Bildbereich schneiden. Welche Möwen gezeichnet werden, hängt damit vom Ausschnitt ab, und am Bildrand können sie beim Scrollen auftauchen oder verschwinden. Das Wildlife (H-R2) kappt deshalb global je Welt mit Cache. Ursprung: Review H-R2 (qa-code-reviewer). Erste Einschätzung: Bei Gelegenheit auf dasselbe Muster wie `wildlife.ts` (`anchorsOf`) umstellen, zusammen mit H-R4 (`life.ts`), wenig Aufwand.
- 2026-10-02 · Render (`src/render/wildlife.ts` Anker-Cache) · Die Anker von Fischen und Vögeln werden je Welt ohne Schlüssel gecacht. Das setzt voraus, dass sich Kachelarten nicht ändern, ausser grass↔forest (Roden/Aufforsten H-S1, beides zulässig für Vögel). Wandelt ein späteres Feature andere Arten um (Landgewinnung, Sand→Gras), braucht der Cache einen Schlüssel. Ursprung: Re-Review H-R2. Erste Einschätzung: In der Spec des Features prüfen, das als erstes andere Kachelarten ändert.
- 2026-10-02 · Render (`src/render/palette.ts` `mixHex`/`rgbOf`) · `mixHex` liefert `rgb(…)`, `rgbOf` parst aber nur Hex. Verschachtelte `mixHex`-Aufrufe ergeben deshalb stumm Schwarz (NaN → 0). In H-R2 ist das beim Wal passiert und erst im Playtest aufgefallen, der Typ `string` verhindert es nicht. Ursprung: H-R2 Playtest und Review. Erste Einschätzung: Typ-Alias `Hex` oder Guard in `palette.ts` (M8-R1-Datei, deshalb nicht in H-R2), wenig Aufwand.
- 2026-10-02 · Render (`src/render/sprites.ts` `glassworksBody`, Fensteranker; `daynight.ts`) · Blindtest M8-R1 Teil B (qa-playtester): Bei Nacht ist die Glashütte nur „eher" erkennbar; das Ofenmaul ist kein Fensteranker und geht neben den gelben Fensterlichtern unter, es bleibt die Kegelform. Die Nacht-Tönung ist insgesamt mild. Ursprung: M8-R1, `.studio/qa/M8-R1/b-galerie-nacht.png`. Einschätzung: niedrig, AK-R1-02 bestanden; Kandidat für ein Art-Häppchen „Glut nachts" (Ofenmaul als eigener Lichtanker mit wärmerem, stärkerem Schein).
- 2026-10-02 · Szenario `galerie` (`tests/sim/scenarios.ts`) · Läuft `galerie` auf 4× bis zur Nacht (~2,5 min), steigen die Wohnhäuser ab (Bilanz −924/min, Stein und Nahrung leer); Nacht-Lesbarkeit der vier Wohnhaus-Stufen ist dadurch ungeprüft. Ursprung: Blindtest M8-R1 Teil B. Einschätzung: Szenario ist ein Standbild, kein Langlauf; für Licht-Checks einen Weg ohne Sim-Lauf vorsehen (z. B. Dev-Parameter für die Tageszeit analog `?wetter=`).
- 2026-10-02 · UI/Tests (Final-Review M8, niedrig, aus `feat/m8-ui`) · (a) `src/ui/goal.ts:35` bildet „Bürgern" als `name + 'n'`; das trägt nur für Stufennamen, die im Dativ Plural auf „-n" enden. (b) `src/ui/hud.ts:277` rechnet `populationByTier` in jedem Frame neu. (c) `tests/sim/merchantsController.ts:9` trägt einen veralteten K1-Kommentar. Ursprung: Final-Review M8 (lead-qa), R165. Einschätzung: alle drei klein, Kandidaten für die nächste UI-Nachlese; (b) erst bei messbarer Frame-Zeit.
- 2026-10-02 · Sim/Spielgefühl (`src/sim/production.ts` Input-Entnahme, `src/sim/population.ts` Aufstieg alle `GROWTH_INTERVAL`) · Die Glashütte verbraucht Stein laufend, der Aufstieg Bürger → Kaufleute wird aber nur alle 50 Schritte geprüft. Wer knapp genug Stein (10) kauft, sieht dauerhaft „Zu wenig Stein", obwohl er den Stein gekauft hat — die Hütte nimmt ihn vor der Prüfung weg. Ursprung: M8 Task 6 (W-T6-1, Controller-Entscheid C2-2, R161; der Testhelfer kauft deshalb je Glashütte 1 Stein mehr). Erste Einschätzung: für M11 („Wirtschaft im Fluss") Reservierung von Aufstiegsmaterial oder Sichtbarkeit der Konkurrenz um ein Gut; in M8 ist Reservierung Nicht-Scope (Spec §3).
- 2026-10-02 · Tests (niedrig) · Sim-Final-Review M8 (L-4): `tests/sim/defs.test.ts` prüft nicht, dass `consumes` keine Duplikate enthält (bei `['stone', 'stone']` prüfen `tickProduction` und `missingInputs` je Gut nur Bestand ≥ 1, entnommen würden aber 2 Einheiten). Ursprung: M8 Sim-Final-Review (lead-qa). Erste Einschätzung: einzeiliger Defs-Test bei der nächsten Sim-Runde.
- 2026-10-02 · UI (`src/ui/app.ts` Esc, `src/ui/messages.ts`) · QA-B-1: `Escape` schliesst auch sichtbare Meldungen (Toasts). Eine Messung, die vorher `Escape` drückt, sieht ein gerade erschienenes Banner nicht mehr; ein Spieler, der nach dem Sieg schnell `Esc` drückt, verpasst es ebenso. Bei 800 px Breite sind ausserdem die rechten Kopfzeilen-Knöpfe abgeschnitten (erlaubt, R78). Ursprung: M8 QA-B-1 (qa-playtester). Erste Einschätzung: prüfen, ob `Esc` Banner (`sticky`) schliessen soll; sonst nur beobachten.
- 2026-10-03 · Balancing (`tests/sim/controller.ts`, Seed 3) · S12-D (design-economy-designer, ungeprüft): Der Referenz-Controller baut bis zum Sieg (Tick 6050) nur 3 Brennereien; für 50 Bürger rechnerisch nötig wären 5. Das Ziel wird mit unterversorgtem Rum erreicht. Ursprung: S12-D Rechnung, Einschätzung: vor der Neumessung in M11 (S10) prüfen, ob der Controller Rum abdeckt.

- 2026-10-03 · Fundort: `make check` (lint), main @ 592df06 · **Erledigt 6242c6d (L0, Prettier).** Beobachtung: `prettier --check .` meldet `docs/superpowers/specs/2026-10-03-m10-schritt-fuer-schritt-spec.md` und `docs/superpowers/specs/2026-10-03-s12-ausbau-design.md`; `make check` ist dadurch auf main rot (Code, Tests, Build grün). Zudem Testname „uses version 3" in `tests/sim/save.test.ts` irreführend. · Ursprung: M10-S1A Review · Einschätzung: lead-design formatiert beide Spec-Docs (`prettier --write`); sonst Merge-Gate M10 rot.
- 2026-10-03 · Doku (`docs/superpowers/specs/` M7-Spec 5.1) · H-R5 (lead-art): Die M7-Spec nennt noch das Felsrandband `ROCK_EDGE`, das H-R5 entfernt hat; braucht einen Verweis auf R170/R172. Ursprung: Bericht H-R5. Einschätzung: Doku-Trivialfix beim nächsten Render-Paket.
- 2026-10-03 · Render (`src/render/statusMarks.ts`) · H-R3 (lead-art): Bei 2×2-Betrieben und eng stehenden Gebäuden sitzt die Statusmarke teils auf dem Sprite oder beim Nachbarn; zudem kann sie den roten Punkt aus `drawUnconnected` überlappen. Ursprung: Bericht H-R3, Screenshots 03/04. Einschätzung: Versatz nach Fussabdruck als Folgehäppchen, mit M9 Welle 2.

- 2026-10-03 · H-R4 Laufwege (lead-art) · Fundort: `src/render/life.ts` `roadGraph`/`layoutKey`, `renderer.ts` Walker-Block. Beobachtung: `roadGraph` rechnet pro Aufruf `layoutKey` über alle Kacheln; Walker-Block ruft es je Frame separat auf (neben errands). Ursprung: Review H-R4. Einschätzung: Frame-Cache (z. B. an `world.tick`) prüfen, wenn Profil es zeigt.
- 2026-10-03 · H-R4 Laufwege (lead-art) · Fundort: `errands.ts` Sammelweg. Beobachtung: gerade Linie kreuzt in dichter Bebauung Nachbargebäude/Küste (Playtest Seeds 7, 33). Einschätzung: Wegpunkte um Hindernisse als Folgehäppchen, zusammen mit Bürger Haus → Markt.

- 2026-10-03 · Sim (`src/sim/placement.ts`, Regel `site: radius`) · M11-D (design-economy-designer, ungeprüft): Die Radius-Regel zählt Kacheln des Terrains auch unter Gebäuden mit. „Schäferei min 4" ist mit dem eigenen 2×2-Grundriss auf Gras schon erfüllt, ein Holzfäller auf Wald erfüllt „min 1" mit seiner eigenen Kachel; die Standortregel schränkt dort also praktisch nicht ein. Ursprung: M11-D Anhang 01. Einschätzung: für S3 (Holzfäller braucht Wald) relevant, M11-Design führt das Regelfeld `free` ein; Wirkung auf bestehende Betriebe im Balancing-Test in der Spec prüfen.

- 2026-10-03 · Balancing (`tests/sim/controller.ts`, `upgradeReserve`) · M11-SPEC Anhang 03 (design-economy-designer): Der Controller kauft Werkzeug für Aufstiege nur bei Rum ≥ 1; fällt das Rum-Lager auf 0, wartet der letzte Aufstieg auf eine weitere Rumkette (Schwelleneffekt bis +800 Ticks, Fremd-Seeds 1/2 „normal" siegen nicht bis 9000). Erklärt zugleich die „3 statt 5 Brennereien" (A13). Ursprung: Messauflage R185. Einschätzung: bei der Neumessung (B1) Controller-Rum-Abdeckung prüfen, nicht die Regel ändern; Pins nur Seed 3.
- 2026-10-03 · **Erledigt 27635aa (M10-U2, effectiveTaxLevel); veraltete Testtitel bleiben offen.** UI (`src/ui/guide.ts` Z. 129–135) · Guide-Hinweis „Steuer verhindert den Aufstieg“ liest `w.taxLevel` statt `effectiveTaxLevel(w)`; ohne aktive Amtsstube kann er falsch sein. Zudem veraltete Testtitel `hotkeys.test.ts` „17 Werkzeugtasten“ (jetzt 18) und `defs.test.ts` „has 14 building defs“. Ursprung: Review M10-S2 (qa-code-reviewer). Einschätzung: niedrig; guide.ts in T06/T07 mitnehmen.
- 2026-10-03 · Tests (`tests/sim/scenario-saves.test.ts`, M10-B1) · Review (niedrig): Prüfpunkte `haus3`/`haus-voll`/`kapelle`/`schule`/`werkzeug-*` werden nur auf Lage geprüft, nicht auf ein Gebäude dort; "Wald im Radius 2" beim Holzfäller nicht getestet. R162 nennt Geld 1490, gemessen `endMoney` 2681 (identisch auf main, kein Regress) — Ruling-Zahl veraltet.
- 2026-10-03 · Studio (`tools/studio/tests/test_docs.py::test_experiments_limit`) · im Worktree feat/m10-sim nach Merge main rot (4 laufende Experimente > 3), im Hauptcheckout grün (ungemergte Änderung?) — vor Merge nach main prüfen.

- 2026-10-03 · Dev-Server (lead-art, M10-R1) · `GET /favicon.ico` liefert 404 (kein Favicon). Einschätzung: kosmetisch, Konsole-Rauschen in Browser-Checks; Mini-Favicon als Asset-Häppchen.
- 2026-10-03 · UI (`src/ui/buildMenu.ts`, M10-U4 Review) · Das „neu"-Zeichen (`aria-label` „neu") sitzt im Button mit eigenem `aria-label` und wird vom Screenreader nie vorgelesen. Einschätzung: „neu" in das `aria-label` des Eintrags aufnehmen, sobald Spec den Wortlaut „{Name} · {n} Geld" lockert.
- 2026-10-03 · UI (`src/ui/hud.ts` `.hud-tax`, M10-U1) · Verbergen der Steuer geschieht per Inline-`style.display`, weil `style.css` nicht in der Ownership von Task 6 lag. Einschätzung: `.hud-tax[hidden] { display: none }` in CSS, Inline-Style entfernen. Zudem `.lock-row` (Amtsstuben-Panel) ohne CSS.
- 2026-10-03 · UI (`src/ui/trade.ts`, M10-U1) · Zeilenliste fest beim Rendern: Kommt ein Gut bei offenem Panel ins Lager, erscheint seine Zeile erst nach erneutem Öffnen. Einschätzung: niedrig.
- 2026-10-03 · Tests (`tools/studio/tests`, M10-U1 Review) · `studio-test` einmal flaky an einem Zeitstempelvergleich (Sekundenwechsel). Einschätzung: Zeitquelle im Test festnageln. Nachtrag M11-D1: Beim Merge feat/m11-ui und bei B1 war je einmal ein Test rot, in 17 Läufen (3 `make check`, 6 vitest, 8 `studio-test`) nicht reproduziert, Testname unbekannt; Kandidat bleibt dieser Zeitstempeltest.
- 2026-10-03 · UI (`src/ui/guide.ts` `CRISIS_SIGNS`, M10-U2 Review) · hängt an Renderer-Schlüsselstring `'drawWarnRing, DIM_FIRE'`; robuster wäre ein `crisis`-Flag am `MapSign`. Einschätzung: niedrig.
- 2026-10-03 · UI (`src/ui/hover.ts`, M10-U3) · Schiffs-Trefferfläche ist genau die Kachel `shipTile`; ob das zum gezeichneten Rumpf passt, prüft QA-U3. Plural „versorgt 1 Haus" weicht von Spec 13.2 ab (Test vorhanden).
- 2026-10-03 · Render (`src/render/spriteCache.ts`, H-R6 Review) · LRU-Thrash: Ist der Frame-Arbeitssatz grösser als 64 MB, verdrängt die LRU Einträge, die im selben Frame noch gebraucht werden; jeder Frame füllt neu, teurer als direkt zeichnen. Einschätzung: bei heutigen Spritegrössen kaum erreichbar; Absicherung (Cache bei hoher Fehlgriffsquote einige Frames abschalten) nur, wenn die Messung es zeigt.
- 2026-10-03 · Tests (`tests/render/spriteCache.test.ts`, H-R6 Review) · Bildgleichheit des Cache nur gegen den Fake-Kontext belegt; Browser-Sichtvergleich bei DPR 2 und Zoom 0,75/1,5 offen. Einschätzung: qa-playtester beim Abnahmelauf (siehe `.studio/qa/H-R6/`).
- 2026-10-03 · Szenarien (`tests/sim/scenarios.ts` `m11-fluss`, M11-B1) · Plan-Prüfschwelle „Bilanz ≥ +500 je 100 Ticks" ist im Referenzlauf bei Tick 3000 nicht erreichbar: gemessen Steuer 224, Unterhalt 160, Bilanz +64. Der Test prüft `stats.taxes − stats.upkeep > 0`; Tick 3000 bleibt (L0-Vorgabe). Ursprung: Spec Anhang 02 F. Einschätzung: Spec-Lücke, Wert in der Spec anpassen oder späteren Tick wählen (AK-UI-01 knapp bei +0,64 je Tick).
- 2026-10-03 · Szenarien (`tests/sim/scenarios.ts` `m11-defizit`, M11-B1) · Ohne Ergänzung wäre das Defizitgut „Nahrung" (erstes Gut in `GOOD_IDS`), nicht „Rum". Das Szenario ergänzt 3 Fischer und 2 Webereien, damit Nahrung und Stoff das Δ decken und `upgradeDeficit(w, haus)?.good === 'rum'` gilt. Ursprung: Plan B1b, Anhang 02 F. Einschätzung: Spec-Ergänzung nachziehen.
- 2026-10-03 · Balancing (`tests/sim/balance-upgrade.test.ts` M-15, M11-B1) · Die Variante „baut Fischer aus" greift im Referenzlauf nie: der Controller hält Werkzeug auf 0 (kauft nur just-in-time), Ausbau Stufe 2 braucht 1 Werkzeug (42 von 68 Takten scheitern nur daran). Kauft die Variante das fehlende Werkzeug selbst, siegt sie erst bei Tick 8250 (minMoney 71, 11 Fischer Stufe 2). Entschieden mit Ruling R196: die Variante kauft das Werkzeug selbst, AK-M11B-01 ist reine Messung (Sieg-Schwelle 6750 entfällt für die Variante); M-15 gepinnt auf Sieg 8250, minMoney 71, 11 Fischer Stufe 2. Der Ausbau verzögert den Sieg um 1500 Ticks, Balance-Folge für M11-Spielgefühl offen.
- 2026-10-03 · Render (`src/render/spriteCache.ts`, `camera.ts`, H-R7 AK6) · Sichtvergleich Cache gegen ungecacht (DPR 1 und 2, Zoom 0,75 und 1,5): Der Stempel liegt seit H-R6 auf Geräte-Pixeln; die Abweichung entsteht durch doppeltes Runden (`worldToScreen` rundet jeden Eckpunkt, der Stempel rundet den Ursprung erneut), einzelne Eckpunkte weichen bis etwa 1 CSS-Pixel ab (die 0,45 Pixel der Messung sind nur der Rundungsrest der Testkamera). Exakt nur mit pixelgerasterter Kamera oder Sprites je Pixelphase; nicht behoben, plausibel. Skript `tools/render-qa/sichtvergleich.mjs`.
- 2026-10-03 · Render (`src/render/camera.ts`, H-R7) · Dasselbe doppelte Runden lässt auch ungecacht beim Kartenverschieben einzelne Eckpunkte springen (jeder Punkt rundet für sich). Einschätzung: niedrig; Abhilfe wäre eine pixelgerasterte Kamera.
- 2026-10-03 · Render (`src/render/sprites.ts`, H-R7) · Nicht umgesetzt von G1: Hofkram und Anbau (Art Direction erlaubt sie innerhalb der Hülle). Grund: Yard-Fläche ist vom Körper fast ganz verdeckt, Anbauten ändern die gezeichneten Flächen und damit Picking und Verdeckung. Einschätzung: bei Bedarf als eigenes Häppchen mit Prüfung der Pick-Fläche; Gaube bleibt fest (ragt aus der Dachfläche).
- 2026-10-03 · Render (`src/render/material.ts`, H-R7) · Material erscheint erst, wenn der Cache warm ist (ein Frame nach Zoom-/DPR-Wechsel); beim Zoom-Wischen ist es aus. Einschätzung: kaum sichtbar (Fugen alpha 0,16); falls doch, Material beim kalten Frame ebenfalls weglassen ist schon der Fall, Gegenrichtung wäre teurer.
- 2026-10-03 · Render (`src/render/variants.ts`, H-R7) · Wandtönung wirkt auf alle Flächen des Körpers (auch Fenster und Türen, Abstand 13–18 %, Fenster in Variante 1 sichtbar heller); Zeichner, die ohne `IsoPainter.poly` füllen (Drehkörper `lathe`/`disc`), tönen nicht mit. Einschätzung: niedrig, Varianz dort nur über Dach/Kamin.
- 2026-10-03 · Render (`src/render/material.ts`, H-R7 Nachprüfung) · In etwa 40 von 9827 Material-Linien bleibt ein Strich auf einer Fensterkante: `COVER_PAD` hält nur in Laufrichtung Abstand, nicht quer zur Linie. Kaum sichtbar wegen der Umrisslinie. Einschätzung: niedrig; Vorschlag: Linien näher als 0,75 px an einer Deckkante verwerfen.
- 2026-10-03 · Render (`src/render/sprites.ts` `IsoPainter.poly`, H-R7 Fix 3) · Der kleine Strich-Haken an First und Dachecke von Satteldächern (Weberei, Werkzeugmacher, Fischerhütte, Brennerei, Amtsstube) ist schon auf main @ 4a5130e vorhanden: der 1-px-Umriss nutzt die Standard-Gehrung (`lineJoin = 'miter'`) und spitzt an spitzen Winkeln aus; H-R7 hat `poly` nur um die Tönung der Füllung ergänzt. Nicht behoben, damit Variante 0 bytegleich bleibt. Einschätzung: niedrig; Abhilfe `ctx.lineJoin = 'round'` in `IsoPainter.poly` (ändert Variante 0 sichtbar, eigenes Ruling).

## 2026-10-03 · M11-R1 · 16 Rot-Tests auf feat/m11-sim @ 9ef025f

- Fundort: `tests/sim` (balance-crises, balance-merchants, economy, merchants, scenario-saves, taxes, unlock-timeline, unlocks), `tests/ui/goal.test.ts`; `make check` dort rot.
- Beobachtung: vom T01-Stand, nicht von R1; Plan erwartet das bis Neupin (T03, index.md:51). Vom Reviewer bestätigt.
- Ursprung: M11-R1 (lead-art). Einschätzung: kein Handlungsbedarf, beim Merge nach T03 prüfen.

## 2026-10-03 · M11-R2 · Abgrenzung kleiner Bauten (Auflage R195)

- Fundort: `src/render/sprites.ts` (Silhouetten), Test «M11 Abgrenzung kleiner Bauten» in `tests/render/sprites.test.ts`.
- Beobachtung: Hamming-Abstand der 16 x 16 Silhouetten-Rasterfüllung (256 Zellen). Kleine Bauten (w·h <= 2): house-fisher 11 (engste Paarung), house-hunter 15, fisher-hunter 18, house-lumberjack 21, fisher-lumberjack 20, fisher-quarry 23, lumberjack-quarry 25, hunter-quarry 27, hunter-lumberjack 30, house-quarry 32, lumberjack-firestation 40, quarry-firestation 45, fisher-firestation 58, house-firestation 61, hunter-firestation 70. Weberei und Schule sind 2x2, nicht klein. Rinderfarm gegen 2x2: market 13 (engste), toolmaker 16, bathhouse 19, sheepfarm/weaver/canefarm 21, school 24, distillery 27, kontor 28, chapel 30, glassworks 36, townhall 39. Die engste alte Paarung (Wohnhaus Stufe 1 gegen Fischerhütte) liegt bei 4,3 % der Zellen; Schwellen im Test: alt >= 10, neu >= 14 (1x1) bzw. >= 12 (2x2).
- Ursprung: M11-R2. Einschätzung: alte Bauten nicht geändert (Variante-0-Referenz bleibt); Wohnhaus/Fischerhütte im Blindtest (QA-ART) beobachten, bei Verwechslung ein Dach- oder Farbakzent in eigenem Häppchen.

## 2026-10-03 · M11-R2 · QA-ART Blindtest und offene Messungen

- Fundort: `.studio/qa/M11-R2/` (Probenblätter, Szenen, key.json).
- Beobachtung: Blindtest 22/22 Typ-Blätter und 11/11 Stufen-Blätter richtig, Wohnhaus/Fischerhütte nicht verwechselt; unsicher (Sicherheit 1-2) blieben Jagdhütte, Holzfäller, Fischerhütte sowie Brennerei, Werkzeugmacher, Kontor bei Zoom 1.0. Stufe 2 (kleiner Anbau) ist in der provisorischen Szene bei 1280 x 800 kaum sichtbar, bei 1920 x 1080 nur bei genauem Hinsehen; Stufe 3 (Fahne) klar. renderMedian +7,7 % (1,30 gegen 1,40 ms, Messauflösung), der Perf-Save enthält weder Jagdhütte, Rinderfarm noch Stufen.
- Ursprung: M11-R2 (lead-art). Einschätzung: Szenen-Teil von AK-RND-05 (m11-wald, -ausbau, -fluss, Ring läuft) erst nach B1 prüfbar; dann Stufe-2-Anbau-Sichtbarkeit bei 1280 px erneut bewerten (ggf. kräftigeres Dach oder Fahnenwimpel auch in Stufe 2); Perf mit Save inklusive neuer Typen wiederholen.

## 2026-10-03 · M11-D1 · Befunde des Laufs (Ledger C2 bis C6)

- 2026-10-03 · UI/Sim-Anzeige (`src/sim/production.ts` `tickProduction`, `src/ui/inspect.ts`) · Ein Holzfäller mit «Kein freier Wald in der Nähe» zeigt weiter etwa 95 % Auslastung und den Fortschrittsbalken. Kein Fehler: `eff` ist ein gleitender Mittelwert (`EFF_WINDOW` 256, Zielwert 0 bei `noForest`) und fällt erst nach einigen hundert Schritten; der Balken bleibt, weil `progress` laut Design stehen bleibt. Ursprung: QA-UI T12 (C6). Einschätzung: niedrig, Design-Entscheid; bei Bedarf Anzeige «Auslastung —» und Balken ausgrauen, solange der Betrieb still steht.
- 2026-10-03 · UI (`src/ui/menu.ts` `hotkeyList`, Hilfe) · Taste `Y` ist in Hilfe und Tastenliste im Browser nicht auffindbar; der Anzeigeort von `hotkeyList` ist ungeprüft (die README-Tabelle nennt sie). Ursprung: T12 (C6). Einschätzung: niedrig, bei der nächsten UI-Nachlese im Browser prüfen.
- 2026-10-03 · Tests (`src/ui/app.ts` `demolishBuilding`) · Die Reihenfolge «Kosten (`paidCost`) vor `demolish()`» ist nicht getestet. Ursprung: T11 (C6). Einschätzung: niedrig; ein Test am Abriss-Ablauf, sonst bleibt es eine stille Annahme.
- 2026-10-03 · UI (`src/ui/inspect.ts` `refundLine`, `src/ui/hints.ts`) · Beide rechnen die Rückerstattung auf `paidCost` getrennt. Ursprung: T11 (C6). Einschätzung: niedrig; DRY, eine gemeinsame reine Funktion in `texts.ts`.
- 2026-10-03 · Plan (`docs/superpowers/plans/2026-10-03-m11-wirtschaft-im-fluss/orga-12`) · Zwei geänderte Tests fehlen in orga-12: `tests/ui/hotkeys.test.ts:73-75` («y» aus der Null-Liste, «(M11 Y)») und `tests/ui/tooltip.test.ts:66-72` (Glashütte «Ausstoss je Stufe»). Ursprung: T12 (C6). Einschätzung: niedrig, in orga-12 nachtragen (Studio-Ownership, nicht D1).
- 2026-10-03 · QA (`.studio/qa/M11-T11`, `M11-T12`) · Die Panel-Szenen wurden nur mit Dev-Werten geprüft, nicht im echten Spielverlauf. Ursprung: QA-UI T11/T12 (C6). Einschätzung: niedrig; im Abnahmelauf M11 einmal mit echtem Spielstand gegenlesen.
- 2026-10-03 · Doku (`docs/arc42.md` §5) · Prettier hat die Tabellen neu gepolstert (rund 68 Zeilen Rauschen je in T11 und T12), dazu D1 weitere Zeilen. Ursprung: T11/T12 (C6). Einschätzung: kein Handlungsbedarf; bei künftigen arc42-Diffs `git diff -w` nutzen.
- 2026-10-03 · UI-Test (`src/ui/inspect.ts` `updateInspect`, `data-field="upkeep"`) · Kein Test für das Feld; Bilanz-Anlaufsprung (+2244 → +732) in W7 im Browser gegenzuprüfen. Ursprung: T10 (C2). Einschätzung: niedrig.
- 2026-10-03 · Tests (`hunterSite` in sources- und placement-Tests, T04) · Hilfsfunktion doppelt vorhanden (planbedingt). Einschätzung: niedrig, bei der nächsten Test-Nachlese in einen Helfer ziehen.
- 2026-10-03 · Spielwerte (`GOODS.food.sell`, AK-P2S2-01, T04) · Widerspruch zwischen Spec-Wert und Def lag bei L0; T09 hat per Mutation `sellPrice` (300 ≠ 164) belegt. Einschätzung: niedrig, Stand in der Spec gegenlesen.
- 2026-10-03 · Tests (T09 Grenzgewinn-Schleife) · Die Schleife ist redundant zu den Pins. Einschätzung: niedrig, bei Gelegenheit streichen oder begründen.
- 2026-10-03 · Tests (`tests/sim/balance-upgrade.test.ts`, B1) · Der M15-Kommentar nennt den Messstand `2b43e9d`, gepinnt gilt R196 (Sieg 8250). Einschätzung: niedrig, Kommentar angleichen.
- 2026-10-03 · Studio (Worktree `m11-sim`, `stash@{0}`) · Alter T02-WIP (AK-BAS-03 Freischalt-Ticks), inhaltlich in T03 enthalten, nicht gelöscht (Hook blockt `stash drop`). Einschätzung: Nutzer oder L0 löschen.
- 2026-10-03 · Render (`src/render/statusMarks.ts`, QA-ART M11-R2) · Die Marke an der Weberei ähnelt der an der Fischerhütte; im Blindtest nicht sicher unterscheidbar. Ursprung: Final-Review M11. Einschätzung: niedrig; Form oder Farbe der Marke nachschärfen.
- 2026-10-03 · Render (`src/render/ring.ts`, Szene `m11-wald`) · Der Ring der Rinderfarm verdeckt dort die benachbarte Jagdhütte. Ursprung: Final-Review M11. Einschätzung: niedrig; Ringversatz oder Szenen-Abstand anpassen.
- 2026-10-03 · Render (`src/render/sprites.ts`, Rinderfarm) · Die Tiere der Rinderfarm wirken wie Kisten. Ursprung: Final-Review M11. Einschätzung: niedrig; Art-Häppchen, Tiere klarer als Tiere zeichnen.
- 2026-10-03 · Szenarien (`tests/sim/scenarios.ts` `m11-fluss`) · Die Kamera steht am Kontor; die Betriebe liegen teils ausserhalb des Bildes. Ursprung: Final-Review M11. Einschätzung: niedrig; Kameraziel auf die Betriebsgruppe setzen.
- 2026-10-03 · Szenarien (`tests/sim/scenarios.ts` `m11-stein`) · Das Szenario hat keine Nahrungsquelle; die Häuser hungern vor dem Stein-Hinweis. Ursprung: Final-Review M11. Einschätzung: niedrig; einen Fischer ergänzen.
- 2026-10-03 · Studio (Hook, Teardown-Auftrag QA) · Der Hook sperrt `git worktree remove --force`, der Teardown-Auftrag der QA-Läufe verlangt es. Ursprung: Final-Review M11. Einschätzung: Teardown-Auftrag ohne `--force` formulieren oder Ausnahme per Ruling.
- 2026-10-03 · Studio (QA-Läufe) · Parallele Playtester teilen sich das Scratchpad und überschreiben einander Dateien. Ursprung: Final-Review M11. Einschätzung: je Playtester ein eigenes Unterverzeichnis vorgeben.
- 2026-10-03 · Perf (`renderMedian`, R199) · `renderMedian` liegt um etwa 0,4 ms höher als vor M11 (Ringe, Marken, Aufsätze). Ursprung: Final-Review M11, Ruling R199. Einschätzung: innerhalb des Budgets, bei der nächsten Perf-Messung mitführen.
- 2026-10-03 · Render (Felsmassive, `rocks.ts`) · Blindtest Endstand: Gebirge liest sich als Gebirge (Note 3), aber noch pyramidenhaft und lückig (graue Geländetextur zwischen den Stempeln, keine Höhenstaffelung nach hinten); die dichte Variante mit 363 Stempeln wirkte massiger, kostete aber +137 % `renderMedian`. Ursprung: H-R8 (Blind-Rater). Einschätzung: Optik-Feinschliff (Sockel/Übergang in der Geländeebene unter den Stempeln, `terrain.ts`, oder gestufte Rücken) als eigenes Häppchen nach Nutzerurteil im Spiel.
- 2026-10-03 · Perf-Messung (H-R8) · Absolute `renderMedian`-Basis auf Seed 7 (1920x1080, DPR 2, Zoom 1): vor M11 etwa 2,0 ms, nach M11 (dc1eab9) etwa 4,0 ms, also mehr als die in R199 notierten 0,4 ms; Messskripte (Seed-7-Aufbau per Dev-Import, `perf.mjs`) liegen nur im Scratchpad. Ursprung: H-R8 (qa-playtester). Einschätzung: bei der nächsten Perf-Messung Ursache trennen (Ringe/Marken vs. Messaufbau) und Skripte unter `tools/` versionieren.
- 2026-10-03 · Spielwerte (`src/sim/mapgen.ts`) · Die Postcondition-Schwellen (Land 800, Wald 40) und `MAX_ATTEMPTS = 50` stehen fest in `mapgen.ts` statt in `src/sim/defs/`. Ursprung: Final-Review H-S1. Einschätzung: niedrig; bei Gelegenheit nach `defs/map.ts` ziehen.
- 2026-10-03 · Render (`src/render/massif.ts` / `terrain.ts`) · `LIGHT` (D-11) und `rotNoise` stehen doppelt: `terrain.ts` exportiert sie nicht, und `terrain.ts` gehörte in H-R9 Teil B. Ursprung: H-R9 Teil A. Einschätzung: niedrig; nach dem Zusammenführen einen gemeinsamen Helfer exportieren (z. B. `light.ts`). **Erledigt (H-R9 Fix 2):** gemeinsames Modul `src/render/light.ts`.
- 2026-10-03 · Render (Massiv, Wege und Gebäude auf Gebirgskacheln) · ~~Sattel und Weg quer durchs Massiv~~ — falsche Prämisse: Gebirge ist nicht bebaubar, auch nicht für Wege (`isLand` in `src/sim/mapgen.ts`, `checkGround` in `placement.ts`). Sattel und Sichtschneise sind entfernt (H-R9 Fix 2); Bebauung grenzt nur aussen an, dafür trägt der A5-Property-Test. Ursprung: H-R9 Teil A. Einschätzung: erledigt.
- 2026-10-03 · Perf-Messung (`tools/render-qa/perf.mjs`, H-R9 A8) · Headless mit `--disable-gpu` misst auf Seed 14 (1920x1080, DPR 2, Zoom 1, Kamera auf dem Massiv) `renderMedian` ≈ 27 ms auf beiden Seiten (main und Branch); absolute Werte sind nicht mit den 2–4 ms der H-R8-Notiz vergleichbar (anderer Messaufbau), nur das A/B-Delta zählt. Ursprung: H-R9 Teil A. Einschätzung: bei Gelegenheit klären, welcher Anteil (vermutlich Boden-`drawImage` unter der Bodenmatrix) den Software-Pfad dominiert.
- 2026-10-03 · Tests (Vitest, `tests/render/terrain.test.ts` u. a.) · Schlägt `toEqual` auf zwei sehr grosse Arrays (z. B. `Array.from(paintPixels(...))`, Millionen Elemente) fehl, bleibt Vitest minutenlang hängen, weil der Diff berechnet und ausgegeben wird. Ursprung: H-R9 Teil B, Rot-Phase (Vitest-Läufe hingen mit Exit 144). Einschätzung: bei grossen Arrays den Vergleich auf einen Zähler oder Hash der Abweichungen reduzieren, nicht `toEqual`; kein Handlungsbedarf für die Spielwerte.
- 2026-10-03 · Render (`src/render/daynight.ts`) · Das Nachtlicht ist generell schwach (Multiplikator 0,73), das Gebirgsmassiv wirkt bei Nacht kaum abgedunkelt. Ursprung: H-R9 Playtest. Einschätzung: Nachtstimmung als eigenes Häppchen prüfen, nicht Teil von H-R9.
- 2026-10-03 · Studio (`tools/studio/effort.py`, Retro-Fälligkeit) · Der Hook meldet „Meilenstein M11 abgeschlossen: Retro fällig“, obwohl die Retros `R-2026-10-03-m11` (triggers `[]`) und `R-2026-10-03-prozess-m11` (triggers `["M11"]`) geloggt sind. Vermutung (nicht verifiziert): Die Fund-ID lautet `meilenstein:M11`, die Retro quittiert nur `M11`, der Abgleich gegen `acknowledged` greift nicht. Ursprung: Retro session-347a6598 B3. Einschätzung: niedrig bis mittel (Fehlalarm bei jedem Meilenstein); vor einem Fix Quittierlogik gegen echte Events prüfen (R169), Briefing-Vorlage ggf. `--triggers meilenstein:<id>` nennen.
- 2026-10-04 · Studio (`tools/studio/metrics.py --milestone`, Spawn-Kopfzeile `Meilenstein`) · `docs/studio/metriken/M11.md` zählt 54 Agenten und 1514 Tool-Aufrufe; ordnet man die Instanzen über die Elternkette den M11-Paket-IDs zu, sind es 70 Instanzen und 1919 Aufrufe. Spawns u. a. zu `M11-PLAN`, `M11-SPEC`, `M11-DOCS` und `S12-D` tragen keinen Meilenstein und fallen aus der Meilenstein-Verdichtung. Ursprung: Prozess-Retro 2026-10-04 (P-R207). Einschätzung: mittel für Retros (Aufwand je Meilenstein wird unterschätzt); Paket-Präfix oder Elternkette in `_milestone_state` berücksichtigen, oder Meilenstein-Kopfzeile im Briefing erzwingen.
- 2026-10-04 · Render-QA (Galerie-Skript, `.studio/qa/ART-STIL-01/skripte/gal.mjs`) · Das Skript für die Stil-Galerie (Seed 1, Siedlung mit allen Haustypen, feste Kameras 01–14) liegt nur unter `.studio/` und ist damit gitignoriert; die Häppchen H-R10 ff. brauchen es für Vorher/Nachher-Bilder. Ursprung: ART-STIL-01 (qa-playtester). Einschätzung: niedrig bis mittel; nach `tools/render-qa/` versionieren (Spec Stilrahmen §6, „Später"), bis dahin aus `.studio/` nutzen.
- 2026-10-04 · Speichern (`src/sim/save.ts`, Dev-Läufe) · Ein Spielstand mit Stufe-4-Häusern ohne `won`/`wonMerchants` meldet beim Fortsetzen „Spielstand beschädigt“; das ist Absicht der Validierung, aber für Entwickler-Szenarien irreführend, und ein Szenario lässt sich nur über `localStorage` plus Knopf „Fortsetzen“ laden (kein URL-Parameter). Ursprung: ART-STIL-01 (qa-playtester). Einschätzung: niedrig; bei Gelegenheit Dev-Szenario-Parameter prüfen.
- 2026-10-04 · Render (`src/render/ship.ts`, `life.ts`) · Beide haben je eine lokale Schattenrichtung `SHADOW_DIR` mit `3 / Math.sqrt(10)` statt `-LIGHT` aus `light.ts`; `fx.ts` (`SMOKE_COLOR`), `life.ts` (`DARK_OUTLINE`, `OUTLINE`) und `overlays.ts` (`BADGE_EDGE` rgba(0,0,0,0.7)) mischen weiter mit Schwarz. Ursprung: H-R10 (art-rendering-engineer). Einschätzung: niedrig; S1 des Stilrahmens gilt dort noch nicht, bei einem Folge-Häppchen (Schiffe/Figuren) mitziehen; Signal-Badges dürfen bewusst hart bleiben (Lesbarkeit).
- 2026-10-04 · Render (`src/render/overlays.ts`, `sprites.ts` `EDGE`) · `EDGE` bleibt nach H-R10 nur als Export bestehen (jetzt Eigenton aus `wallTimber`), weil `overlays.ts` ihn importiert; Körper nutzen ihn nicht mehr. Ursprung: H-R10. Einschätzung: niedrig; `overlays.ts` auf eine eigene Farbe umstellen und `EDGE` entfernen.
- 2026-10-04 · Render (`src/render/renderer.ts`, Bodenebene) · Bei Zoom 2 wird die Bodenebene weich hochskaliert. Auch nach H-R11 bleibt so eine Grundunschärfe von etwa 2 Geräte-px, Tonkanten lassen sich nicht schärfer als ≈ 1,5 CSS-px zeichnen (S3 Stilrahmen). Ursprung: H-R11 (art-rendering-engineer). Einschätzung: niedrig bis mittel; Nearest-Skalierung oder Ebenenfaktor 4 prüfen, nach REL-01 mit Perf-Messung.
- 2026-10-04 · Render-QA (`.studio/qa/ART-STIL-01/skripte/gal.mjs`) · Das Galerie-Skript sucht die Dünenkamera über `tm.duneMask`. H-R12 entfernt `duneMask`, gegen REL-01 bricht das Skript deshalb bei Bild 07/08. Ersatz mit fester Koordinate (7, 32): `.studio/qa/H-R12/skripte/gal.mjs`. Ursprung: H-R12. Einschätzung: mittel für das Release-Gate REL-01 (Galerie 01–15); beim Versionieren nach `tools/render-qa/` die feste Koordinate übernehmen.
- 2026-10-04 · Render (`src/render/terrain.ts`, `sandRestField`/`patchGrid`) · Ändern sich Sand oder Küste, reicht die Strandbreite über den Patch-Rand hinaus, und am Fensterrand wären Nahtkanten möglich. Heute tauscht das Spiel nur Wald und Gras, deshalb steht nur ein Kommentar im Code. Ursprung: Review H-R12. Einschätzung: niedrig; erst relevant, wenn eine Funktion Sand oder Küste ändert (z. B. Aufschütten).
- 2026-10-04 · Render (Seed 1, Dünen) · Auf Seed 1 sind die meisten Strände schmal (2–3 Kacheln) und tragen deshalb keine Dünen; die Galerie-Kamera 07/08 zeigt nur Rippeln. Dünenfelder sind nur an breiten Stränden zu sehen (Beleg 07b/08b bei Kachel 44,47). Ursprung: H-R12. Einschätzung: niedrig; im Playtest REL-01 auf weiteren Seeds prüfen, ob Dünen oft genug vorkommen.
- 2026-10-04 · Render (REL-01 opus-Review, Sammeleintrag, alle niedrig) · (1) Kühler Schattenton 4× definiert: `palette.SHADE_TONE`, `dunes.DUNE_SHADOW`, `terrain.TONE_COOL`, `light.LIGHT_COLORS`; auf eine Quelle zusammenführen. (2) `meadowTint` ist exportiert, aber in `landColor` inline dupliziert. (3) `landShares` wird nur von Tests genutzt. (4) `DuneSample` berechnet `crest`/`ripple`/`grain` je Sandknoten, gelesen nur in Tests. (5) Veralteter Kommentar `WET_SAND` in `dunes.ts`. (6) `paintDecor` rechnet `groundToneAt` je Büschel neu und kostet `buildMs`/`lastPatchMs`; je Kachel cachen. (7) Dünenlicht 85 % Wind/30 % Sonne weicht von S1 ab: Frage an lead-art für REL-02. (8) `variants.ts` nutzt `#000000`/`#ffffff` und setzt zur Laufzeit um, schwer lesbar. (9) S4 bei `ship.ts:17` und `life.ts:166` noch offen (REL-02-Kandidat). Ursprung: REL-01 opus-Review. Einschätzung: niedrig; (1), (6), (9) als REL-02-Kandidaten bündeln. Die Punkte zu `dunes.ts` ((4), (5), (7)) betreffen H-R12, also REL-02.

### 2026-10-04 · CI · Zeit-Test AK-R1-06 flaky auf dem Runner

- Fundort: `tests/render/terrain.test.ts` AK-R1-06 „Aufbau Faktor 1 ≤ 1500 ms"; main-Läufe 37147743622, 37180893425, 37182089359 rot.
- Beobachtung: GitHub-Runner liegt dauerhaft an der 1500-ms-Grenze; lokal grün.
- Ursprung: Session-Retro e13c3631. Einschätzung: als H-T1 in REL-02 (CI-Schwelle ×1,5, R217).
- Ergebnis H-T1: Helfer `tests/helpers/perfBudget.ts`, CI-Faktor 1,5, nur AK-R1-06 angewendet; weitere Kandidaten: `tests/render/terrain.test.ts` H-R9 B4 (Median ≤ 8 ms, Z. ~1104–1111) und `tests/ui/hints.test.ts` AK-UX-31 (Median ≤ 0,5 ms, Z. ~353–365). Weitere feste ms-Grenzen mit `performance.now`/`Date.now` gibt es in `tests/` nicht.

### 2026-10-04 · Studio-Werkzeug · Retro-Trigger und Leerlauf-Messung

- Fundort: `tools/studio/log.py retro`, Metrik E-028.
- Beobachtung: Meilenstein-Retros M10/M11 ohne `meilenstein:`-Trigger geloggt (Alarm blieb offen); für E-028 fehlt ein Ereignis „Häppchen n+1 gestartet", Leerlauf nicht messbar.
- Ursprung: Session-Retro e13c3631. Einschätzung: lead-production, nächste Session (R217 V3).

### 2026-10-04 · Render · `EDGE` in `sprites.ts` weiter intern genutzt

- Fundort: `src/render/sprites.ts:30` (Definition), `:832–834` (Linien), Folge des Eintrags zu `EDGE`/`overlays.ts` aus H-R10.
- Beobachtung: `overlays.ts` importiert `EDGE` seit H-R14 nicht mehr (eigene Konstante `MARK_EDGE`). `sprites.ts` zeichnet damit aber noch selbst drei Linien; der Export kann erst entfallen, wenn diese Stelle auf einen lokalen Eigenton umgestellt ist.
- Ursprung: H-R14 (art-rendering-engineer). Einschätzung: niedrig; beim nächsten Häppchen, das `sprites.ts` besitzt, mitziehen.

### 2026-10-04 · Render-QA · Schiff in Seed 1 vom Kontor verdeckt

- Fundort: Galerie-Szene Seed 1 (Schiffskachel 19,16, Kontor 19,17), `.studio/qa/H-R14/skripte/shots.mjs`.
- Beobachtung: Das Schiff liegt nördlich hinter dem Kontor und ist nur halb sichtbar; für den Bildnachweis musste das Kontor an eine andere Küstenstelle verschoben werden (`shots-r1.mjs`). Im Spiel kann der Liegeplatz damit generell hinter dem Kontor liegen.
- Ursprung: H-R14 (qa-playtester). Einschätzung: niedrig bis mittel; prüfen, ob die Liegeplatzwahl die Seite vor dem Kontor (Blickrichtung) bevorzugen soll; beim Versionieren der Galerie (`tools/render-qa/`) eine Schiffskamera mit freiem Liegeplatz aufnehmen.

### 2026-10-04 · Render (Overlays) · Braune Ringe neben roten Marken

- Fundort: `.studio/qa/H-R14/crops/*-02-schiff.png`, `*-04-brand.png` (brauner Ring neben der roten Marke über Kontor bzw. Steinbruch).
- Beobachtung: Der Playtester konnte das Zeichen nicht zuordnen; vermutlich ein Bedarfs-/Versorgungssymbol (`SIGN_COLOR` in `overlays.ts`). Lesbarkeit: zwei Marken dicht nebeneinander, Bedeutung für Spieler unklar.
- Ursprung: H-R14 (qa-playtester). Einschätzung: niedrig; bei der nächsten Overlay-/Lesbarkeitsrunde Bedeutung prüfen und ggf. in der Legende erklären.

### 2026-10-04 · Ton · Befunde aus der Browser-Probe H-A2

- Fundort: `.studio/qa/H-A2/` (Probe auf `feat/h-a2-hoerbar`), `src/ui/soundEvents.ts` (`diffSoundEvents`), `src/render/camera.ts` (`visibleTileRange`).
- Beobachtung: (1) Bei 4× Tempo erklingt der Münzton etwa alle 2,5 s (56–60 je Minute) und wirkt dicht. (2) Der Arbeitston nutzt die Bounding-Box `visibleTileRange`, die grösser als das Bild ist; Betriebe bis ~400 px ausserhalb klingen mit (von lead-art als „Kameranähe" angenommen). (3) Ein `make check`-Lauf im Review war einmal mit 1 rotem Test, Name nicht erfasst; zwei Folgeläufe grün.
- Ursprung: qa-playtester und qa-code-reviewer, Paket H-A2. Einschätzung: (1) Ton-Drosselung je Tempo prüfen, lead-art; (2) nur bei Spielerfeedback enger filtern (Bildschirm-Test statt Kachelbox); (3) zum H-T1-Eintrag oben (Kandidat `tests/ui/hints.test.ts` AK-UX-31).

### 2026-10-04 · Render · S1-Rest `DIM_FIRE` und Gut-Schlüssel im Audio

- Fundort: `src/render/renderer.ts:96` (`DIM_FIRE = 'rgba(0,0,0,0.35)'`); `src/audio/economySounds.ts` `SHORTAGE_VOICES`.
- Beobachtung: Brennende Gebäude werden mit reinem Schwarz abgedunkelt (S1). Die Stimmen-Schlüssel je Gut doppeln die Gut-IDs der Sim ohne Test; Umbenennung fällt still auf die Grundstimme zurück.
- Ursprung: opus-Review REL-02. Einschätzung: nächster S1/S4-Rest bzw. kleiner Test, Kandidat REL-03.
