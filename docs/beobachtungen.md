# Beobachtungen (Posteingang für Befunde ausserhalb des Scopes)

Aufbau je Eintrag: Datum · Fundort · Beobachtung · Ursprung · erste Einschätzung.
Auswertung mit dem Skill `beobachtungen-auswerten`. Ein Folgeissue entsteht nur auf
ausdrückliche Zustimmung des Nutzers; im Studio gehen Paket-Kandidaten an L0.

Letzte Auswertung: 2026-09-30 (`lead-production`, Paket S16-02) gegen Commit `3b54938`.
Ergebnis: 45 Einzelbefunde. Davon sind 11 erledigt, 22 abgehakt und 12 in sechs Paket-Kandidaten
gebündelt, die unten offen stehen. Kein Befund war widerlegt, sechs trugen eine falsche Prämisse.

Nachtrag Doku-Pass M5 (D1, 2026-09-30): Zwei Paket-Kandidaten (Bedienkomfort, Spielkonzept) nach „Erledigt"
verschoben; die gesammelten Befunde der M5-Wellen 1–5 und von lead-art stehen als neue Einträge unter „Offen"
(gegen `test/m5-int` geprüft, noch nicht ausgewertet).

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
- `tests/sim/queries.test.ts`: Purity-Test ohne AK-/RF-Präfix (~:412); `directHouse` setzt Flags, die die
  Abfragen nicht lesen, ohne Kommentar (~:213–235); Setup für AK-S3-07 (Holzfäller) umständlich (~:386–391).
- `tests/sim/trade.test.ts` bzw. S2-Test AK-S2-09 enthält ein Füll-`expect(GOOD_IDS.length)`.
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
  Auswahl, Slot). Beim Seitenstart läuft das Spiel sofort mit 1×, während noch der Toast „Spielstand
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
  Gebäuden, unkritisch). Das Symbol „nicht versorgt" hat keine Legende.
- `ship.ts`: nicht auf den sichtbaren Ausschnitt begrenzt (vernachlässigbar); bei `timeMs: 0` fester
  Neigungsversatz (~0.05 rad).
- Vorschau: Ungültig-Vorschau auf Gras bräunlich statt klar rot, auf Wasser violett.

**Ursprung:** Task-Reviews A1, A3, Silhouette S4 (lead-art); Browser-Checks A1, A3.
**Einschätzung:** Alles niedrig, Pflege durch lead-art bei der nächsten Render-Arbeit. Die Farbe der
Ungültig-Vorschau und die Legende berühren die Lesbarkeit und sind die ersten Kandidaten.
**Erledigt seither:** Die Wellen-Amplitude in `water.ts` ist inzwischen eine benannte Konstante
(`WAVE_AMPLITUDE`).

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
Wirkung der Tag-Nacht-Tönung über einen ganzen Tag (10 min bei 1×), „niedrig" im Steuerregler (Spec 17.1).
**Ursprung:** Übergaben Welle 3–5, Spec 14.2.
**Einschätzung:** Eingabe für den Nutzer-Playtest nach dem Merge von M5, kein Paket.

---

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
