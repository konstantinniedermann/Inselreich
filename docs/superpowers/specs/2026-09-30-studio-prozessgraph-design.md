# Studio-Dashboard: Prozess-Graph und vereinfachte Organigramm-Kacheln — Design-Spec

Datum: 2026-09-30 · Status: von `lead-design` abgenommen, Gate Spec offen (`lead-tech`,
`lead-qa`) · Grundlage: vom Nutzer bestätigtes Design (Gate Brainstorming bestanden, Ruling R22) ·
Prozessstufe: voll · Paket: G-spec

## Ziel

Der Nutzer sieht im Studio-Dashboard auf einen Blick, **wie lange** welcher Agent lief, **wer mit
wem** gesprochen hat (Auftrag, Bericht, Nachricht) und **wer wem untersteht** — live während einer
Session und im Rückblick auf frühere Sessions. Die Organigramm-Kacheln werden einfacher und
spielerischer: Name, Rolle, Status mit Emoji, Kurzaufgabe; Details erst beim Aufklappen.

Ansatz (verbindlich): `model.py` rechnet, `app.js` zeichnet nur (SVG plus HTML-Zeilen, ohne
Bibliothek). Nur Python-Standardbibliothek und reines HTML/CSS/JS (ADR-008). Die Anzeige orientiert
sich an der **Darstellungsidee** von `git log --graph`; übernommen wird kein Code.

## Scope

- Hook: neues Event `kind="message"` für `SendMessage` (Abschnitt T).
- Modell: Namen, Instanznummer, Kurzaufgabe je Knoten; neues Feld `graph` in `/api/state`
  (Abschnitt T).
- Dashboard: neue Karte „Prozess-Graph" (Abschnitt G), vereinfachte Kacheln und einheitliche
  Status-Beschriftung (Abschnitt K).
- Demo-Fixture mit allen Fällen, unittest, Playtest-Screenshots.
- Benennung der nachzuführenden Dokumente (Abschnitt D; Änderung erst in der Umsetzung).

## Ausdrücklich nicht im Scope

- Keine neuen Abhängigkeiten (weder Python-Pakete noch JS-Bibliotheken, kein CDN).
- Kein Graph für die Session-Auswahl „Alle" (nur Hinweistext, P8).
- Kein Zoom, kein Filter, keine Suche, keine Legende-Umschaltung im Graphen.
- Keine Kommunikations-Statistik (Anzahl Nachrichten je Agent, Antwortzeiten u. Ä.).
- Keine Änderung an den `log.py`-Befehlen und ihrer Validierung.
- Kein Lesen von `.studio/archive/` (P26); `make studio-archive` behält sein Verhalten.
- Keine schreibenden Endpunkte, keine WebSockets; Polling bleibt 2 s (R6).
- Keine Änderung an Chronik, Budget, Board, Entscheiden, Puls (ausser der einheitlichen
  Status-Beschriftung, wo sie Status-Badges zeigen).
- Kein Spielcode unter `src/`; keine Werte in `src/sim/defs/` (Studio-Werkzeug, die Konstanten
  stehen wie bisher als Modulkonstanten in `tools/studio/`). Kein Einfluss auf den
  Balancing-Test.

## Schritt 0 — Vorabprüfung (erster Umsetzungsschritt, vor jedem Code)

**V1 Teil A — Frontmatter:** „Ignoriert Claude Code unbekannte Frontmatter-Felder (`studio-name`,
`studio-title`, `studio-emoji`) in `.claude/agents/*.md`?"

Prüfweg:

1. In einer Persona (Vorschlag `qa-code-reviewer.md`, weil kurz und billig) die drei Felder in der
   Frontmatter ergänzen (Werte laut Namensliste, Emoji ohne Anführungszeichen).
2. Neue Claude-Code-Session im Repo starten (Agent-Dateien werden erst in einer neuen Session
   geladen).
3. `/agents` bzw. die Agent-Liste prüfen: Die Persona erscheint mit unveränderter `description`.
4. Den Agenten mit einem Einzeiler-Auftrag starten („lies README.md, melde die erste Zeile"): Er
   lädt, läuft mit dem Modell aus der Frontmatter und meldet normal; im Hook-Log steht ein
   `agent_start` mit `role=qa-code-reviewer`.

Ergebnis „ja, ignoriert" → Weg **Frontmatter** (Felder in allen 13 Persona-Dateien). Ergebnis
„nein" (Fehler, Agent fehlt in der Liste, Felder stören) → Weg **names.json**: Datei
`tools/studio/names.json` im Format `{"<rolle>": {"name": "…", "title": "…", "emoji": "…"}}`, von
`model.py` gelesen. Beide Wege liefern exakt dieselben Felder an `build_state` (P20). Der Entscheid
fällt nach der Prüfung und wird als Ruling festgehalten; die Testfälle (T-Namen) gelten für beide
Wege, nur die Quelle im Test wechselt.

**V1 Teil B — SendMessage-Payload (P27):** In derselben Probesession sendet ein Lead einem
laufenden Arbeiter eine `SendMessage`, und L0 setzt einen beendeten Agenten per `SendMessage`
fort. Mit einem vorübergehend protokollierenden Hook (wie im Machbarkeits-Kurztest der Studio-Spec,
isoliertes Testprojekt) festhalten: Schlüssel in `tool_input` (`to`, `message`, `summary`), Form
des `to`-Werts (Agent-ID, Name, `name [ref]`), und ob die Fortsetzung ein `SubagentStart` desselben
`agent_id` auslöst. Weichen die Feldnamen ab, wird nur die Abbildung in P1/P2 angepasst (Ruling),
nicht das Event-Schema.

## Abschnitt T — Telemetrie und Datenmodell

### T1 Hook: `message`-Event

`hook.py` erzeugt bei `PreToolUse` mit `tool_name == "SendMessage"` statt eines Heartbeats ein Event
nach P1. Neue Konstanten in `hook.py`: `MESSAGE_TOOL = "SendMessage"`, `MESSAGE_TEXT_MAX = 160`,
`MESSAGE_TO_MAX = 120`. Der Zweig steht vor dem allgemeinen Heartbeat-Zweig. Alle anderen Tools
bleiben Heartbeats; `Agent`/`Task` und `log.py`-Aufrufe unverändert.

Event-Schema (zusätzlich zu den Grundfeldern `ts`, `session_id`, `agent_id`, `source`, ggf.
`role`):

| Feld   | Typ    | Inhalt                                                                                                                                                    |
| ------ | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `kind` | string | `"message"`                                                                                                                                               |
| `to`   | string | `str(tool_input["to"])`, auf 120 Zeichen gekürzt (+ „…"); fehlt es: `""`                                                                                  |
| `text` | string | `tool_input["message"]`, wenn String und nicht leer, sonst `tool_input["summary"]`, sonst `""`; Leerraum zusammengefasst; auf 160 Zeichen gekürzt (+ „…") |

Beispielzeile in `.studio/events.jsonl`:

```json
{
  "ts": "2026-09-30T10:16:00.000Z",
  "session_id": "7c1d2e3f-4a5b-4c6d-8e9f-0a1b2c3d4e5f",
  "agent_id": "g-lt",
  "source": "hook",
  "role": "lead-tech",
  "kind": "message",
  "to": "g-ts1",
  "text": "Bitte die zwei Review-Befunde beheben: erstens die Rundung in trade.ts auf ganze Taler umstellen, zweitens einen Test für leere Lager ergänzen; danach make chec…"
}
```

(In der Datei steht jedes Event auf **einer** Zeile; hier zur Lesbarkeit umbrochen.)

`.claude/settings.json` bleibt unverändert: Der `PreToolUse`-Matcher ist bereits `"*"`.

### T2 Modell: `message` verarbeiten

- `on_message`: berührt den Absender-Knoten (Lebenszeichen, wie ein Heartbeat); keine
  Statusänderung.
- Empfänger-Auflösung nach P2, Ergebnis wird erst im Graph-Nachlauf (P4) verwendet.
- Live-Feed: Zeile mit `kind="message"` und Text „✉ → <Empfängername>: <text>" (P1); bei
  unzuordenbarem Empfänger „✉ → ? <to>: <text>".

### T3 Namen, Titel, Emoji, Instanz

- Quelle: Frontmatter-Felder `studio-name`, `studio-title`, `studio-emoji` (oder `names.json`, V1).
  Neue Funktion `read_agent_names(agents_dir: Path) -> dict[str, dict]` neben
  `read_agent_models`, Rückgabe `{rolle: {"name", "title", "emoji"}}`; umschliessende
  Anführungszeichen (`"…"`, `'…'`) werden entfernt (P10).
- `build_state(..., agent_names: dict[str, dict] | None = None)` als neuer optionaler Parameter;
  `server.py` liest die Namen bei jeder Anfrage wie heute die Modelle (P20).
- Rückfallwerte als Konstanten in `model.py`: `DIRECTOR_NAME` = („Boss Bruno", „Studio-Direktor",
  „🎬"); `FOREIGN_NAME` = „Aushilfe", `FOREIGN_EMOJI` = „🧑‍🔧", Titel = Rollenname. Fehlt nur ein
  Feld, gilt der Rückfallwert nur für dieses Feld.
- Instanznummer nach P9, berechnet im Nachlauf nach P21. Öffentliche Knotenfelder (P10 mit P20):
  `name` (Anzeigename, ab Instanz 2 mit Zusatz „ (n)"), `title`, `emoji`, `instance` (int),
  `task_short` (P12).

Namensliste (verbindlich):

| Rolle                     | Name             | Titel                    | Emoji |
| ------------------------- | ---------------- | ------------------------ | ----- |
| `studio-director`         | Boss Bruno       | Studio-Direktor          | 🎬    |
| `lead-production`         | Planungs-Paula   | Produktionschefin        | 📋    |
| `lead-design`             | Ideen-Ida        | Design-Chefin            | 💡    |
| `lead-tech`               | Technik-Toni     | Tech-Chef                | 🔧    |
| `lead-art`                | Pinsel-Pia       | Kunst-Chefin             | 🎨    |
| `lead-qa`                 | Prüf-Peter       | QA-Chef                  | 🔍    |
| `production-integrator`   | Merge-Moritz     | Zusammenführer           | 🔀    |
| `design-spec-author`      | Spec-Sabine      | Spec-Schreiberin         | 📝    |
| `design-economy-designer` | Taler-Theo       | Wirtschaftsplaner        | 💰    |
| `tech-sim-engineer`       | Logik-Lars       | Spiellogik-Entwickler    | ⚙️    |
| `tech-ui-engineer`        | UI-Ursula        | Oberflächen-Entwicklerin | 🖱️    |
| `art-license-checker`     | Paragraphen-Paul | Lizenzprüfer             | ⚖️    |
| `qa-code-reviewer`        | Review-Rita      | Code-Prüferin            | 👓    |
| `qa-playtester`           | Zocker-Zoe       | Spieltesterin            | 🎮    |

Namensregel für künftige Rollen: Alliteration, das Präfix ist direkt das Arbeitswort der Rolle.
`studio-director` hat keine Persona-Datei; sein Name kommt aus `DIRECTOR_NAME` (P19).

### T4 Neues Feld `graph` in `/api/state`

Für eine einzelne gewählte Session (auch `latest`, aufgelöst auf die neueste) liefert `result()`
das Feld `graph`; für `all` oder ohne Sessions `null` (P8). Konstanten in `model.py`:
`GRAPH_ROWS = 300`, `PAUSE_GAP = 300.0`, `MESSAGE_TEXT_MAX = 160`, `SHORT_TASK = 30`; weiter
genutzt: `BIND_WINDOW = 30.0`.

Schema:

| Feld              | Typ           | Inhalt                                                                          |
| ----------------- | ------------- | ------------------------------------------------------------------------------- |
| `graph.session`   | string        | Session-ID                                                                      |
| `graph.columns`   | int           | maximale Spaltenzahl der ganzen Session (auch bei Kürzung)                      |
| `graph.truncated` | bool          | `true`, wenn mehr als 300 Zeilen berechnet wurden (P7)                          |
| `graph.rows`      | list          | Zeilen, **neueste zuerst** (Index 0 = jüngste Zeile), höchstens 300             |
| `row.id`          | string        | `"<kind>:<session>:<agent_id>:<ts>"` (P11, Details P24)                         |
| `row.t`           | float         | Epoch-Sekunden des bestimmenden Events                                          |
| `row.time`        | string        | `"HH:MM"`, lokale Zeit des Servers                                              |
| `row.kind`        | string        | `start`, `end`, `order`, `report`, `message`, `resume`, `status`, `pause`       |
| `row.from`        | string / null | Knotenschlüssel `"<session>:<agent_id>"` des Handelnden                         |
| `row.to`          | string / null | Knotenschlüssel des Ziels, `"?"` bei unzuordenbarem Empfänger, sonst null       |
| `row.label`       | string        | „Name" bzw. „Name → Name" bzw. „Name → ? <to>" (P2, P25)                        |
| `row.text`        | string        | Kurztext nach P25, höchstens 160 Zeichen + „…"                                  |
| `row.status`      | string        | bei `status`-Zeilen der Status, sonst `""`                                      |
| `row.lanes`       | list          | genau `columns` Einträge `{key, department, up, down}` (P24)                    |
| `row.dot`         | int / null    | Spalte des Ereignis-Punkts (P23); `null` bei `pause`                            |
| `row.arrow`       | object / null | `{from_col: int, to_col: int \| null, style: "branch" \| "merge" \| "message"}` |

`lanes[i].up` = Spurstück von dieser Zeile zur nächst **neueren** Zeile (in der Anzeige oberhalb
des Punkts), `lanes[i].down` = zur nächst **älteren**; Werte `"solid"`, `"dashed"`, `"none"`.
Freie Spalten: `{key: null, department: null, up: "none", down: "none"}`.

Beispiel einer Zeile (Fixture, Zeile 18 der Referenz: Nachricht mit Fortsetzung):

```json
{
  "id": "message:7c1d2e3f-4a5b-4c6d-8e9f-0a1b2c3d4e5f:g-lt:2026-09-30T10:16:00.000Z",
  "t": 1790763360.0,
  "time": "12:16",
  "kind": "message",
  "from": "7c1d2e3f-4a5b-4c6d-8e9f-0a1b2c3d4e5f:g-lt",
  "to": "7c1d2e3f-4a5b-4c6d-8e9f-0a1b2c3d4e5f:g-ts1",
  "label": "Technik-Toni → Logik-Lars",
  "text": "Bitte die zwei Review-Befunde beheben: erstens die Rundung in trade.ts auf ganze Taler umstellen, zweitens einen Test für leere Lager ergänzen; danach make chec…",
  "status": "",
  "lanes": [
    { "key": "7c1d…:main", "department": "studio", "up": "solid", "down": "solid" },
    { "key": "7c1d…:g-lt", "department": "tech", "up": "solid", "down": "solid" },
    { "key": "7c1d…:g-ts1", "department": "tech", "up": "solid", "down": "dashed" },
    { "key": null, "department": null, "up": "none", "down": "none" },
    { "key": null, "department": null, "up": "none", "down": "none" }
  ],
  "dot": 1,
  "arrow": { "from_col": 1, "to_col": 2, "style": "message" }
}
```

(`7c1d…` steht hier nur zur Kürzung für die volle Session-ID; `t` und `time` hängen von der
Zeitbasis ab.)

### T5 Zeilenbildung und Spalten

Regeln: P3 (Zeilen), P4 (Nachlauf), P5 (Spalten), P6 (Pausen), P7 (Begrenzung), ergänzt durch
P21–P25. Reihenfolge bei gleichem Zeitstempel: Reihenfolge der sortierten Events (stabil wie
`build_state`). Heartbeats, `prompt`, `turn_end`, `bind`, `spawned`, `budget`, `package`,
`decision` und `status` mit `active`/`delegated`/`idle` erzeugen keine Zeilen.

### T6 Kurzaufgabe

`task_short` nach P12: `task` mit zusammengefasstem Leerraum; länger als 30 Zeichen → erste 30
Zeichen + „…". Direktor: aus seinem `task` (erste Zeile des letzten Nutzerauftrags, vorhandene
Regel).

### Randfälle (Modell)

| Fall                                                          | Verhalten                                                                                      |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Alte `events.jsonl` ohne `message`-Events                     | Graph ohne Nachricht-Zeilen, sonst vollständig; keine Migration nötig (append-only JSONL)      |
| `message` mit leerem `to`                                     | unzuordenbar: `to = "?"`, Label „<Absender> → ? " , Stummel                                    |
| Nachricht an beendeten Knoten ohne Fortsetzung                | Pfeil ohne Ziel-Spur: `to_col = null`, `to` = Knotenschlüssel, Label mit Namen, kein „?" (P23) |
| Nachricht an sich selbst                                      | Zeile mit Punkt, `arrow = null` (P23)                                                          |
| Fortsetzung ohne vorausgehende Nachricht (> 30 s)             | eigene `resume`-Zeile „Fortsetzung" (P3)                                                       |
| `spawned` korrigiert eine frühere Zuordnung                   | ganze Session wird neu gelegt, ältere Zeilen dürfen sich ändern (P4); `id` bleibt gleich       |
| Session ohne `session_start`                                  | keine Start-Zeile des Direktors; seine Spur beginnt an der ältesten Zeile (P22)                |
| Knoten ohne `agent_start` (Telemetrie mitten im Lauf)         | Start-Zeile beim ersten Event des Knotens (P22)                                                |
| log-only-Knoten `log:<rolle>`                                 | eine Spur vom ersten bis zum letzten eigenen `status`-Event (P22)                              |
| Agent hängt, kein `agent_stop`                                | Spur läuft bis `session_end` bzw. bleibt offen (oben durchgezogen) (P22)                       |
| Persona auf Abruf ohne Datei (`general-purpose` + `Persona:`) | Rückfall „Aushilfe" / Rollenname / 🧑‍🔧                                                          |
| Mehr als 300 Zeilen                                           | neueste 300 ausgeliefert, `truncated: true`, Spuren der ältesten Zeile korrekt (P7)            |
| Kaputtes Event                                                | wird wie bisher übersprungen; der Graph kippt nie den ganzen Zustand                           |

## Abschnitt G — Darstellung des Graphen

- **G1 Karte:** neue `section.card.wide` „Prozess-Graph" direkt unter dem Organigramm
  (`index.html`), Kopf mit Überschrift und dem Hinweis „▲ n neue Ereignisse" (G7). Innenbereich
  `.graph-body` mit fester Höhe `60vh`, `overflow-y: auto`.
- **G2 Ausrichtung:** Zeit nach unten, neueste oben, eine Zeile je `graph.rows`-Eintrag, in
  gelieferter Reihenfolge.
- **G3 Aufbau:** Im Scroll-Container liegen nebeneinander der Spurbereich (ein `<svg>` für alle
  Zeilen, Breite `columns × 14 px + 8 px`, Höhe `Zeilen × 28 px`) und die Zeilenliste (je Zeile ein
  HTML-Element von 28 px Höhe): Uhrzeit | Label | Kurztext. Kurztext einzeilig mit CSS-Ellipse „…";
  `title`-Attribut = `row.text` (Tooltip). Uhrzeit mit `title` = Uhrzeit mit Sekunden aus `row.t`.
  Konstanten in `app.js`: `GRAPH_COL_PX = 14`, `GRAPH_ROW_PX = 28` (P16, P30).
- **G4 Spuren:** senkrechte Linien je Spalte in Bereichsfarbe (`stroke: var(--dep-<bereich>)` über
  die vorhandenen Klassen `dep-*`, hell/dunkel automatisch), Strichstärke 2 px. `solid` =
  durchgezogen, `dashed` = gestrichelt (`stroke-dasharray: 4 3`), `none` = nichts. Spalte `i` hat
  ihre Mitte bei `x = 4 + 14·i + 7`; Zeile `r` ihre Mitte bei `y = 28·r + 14`. Punkt = Kreis mit
  Radius 4 in Spalte `row.dot`.
- **G5 Pfeile:** in derselben Zeile von `from_col` nach `to_col`. `branch` (Auftrag): durchgezogene
  Kurve, abzweigend; `merge` (Bericht): durchgezogene Kurve, einmündend; `message`: gepunktet
  (`stroke-dasharray: 1 3`) mit Pfeilspitze (SVG-`marker`). `to_col = null`: kurzer Stummel (eine
  Spaltenbreite) nach rechts; bei `row.to == "?"` mit Zeichen „?" am Ende.
- **G6 Pausen-Trenner:** `pause`-Zeile blass über die ganze Breite (Hintergrund
  `color-mix(… var(--muted) 12%, transparent)`), Text zentriert „… n min …"; laufende Spuren gehen
  durch (P6).
- **G7 Live:** Neue Zeilen erscheinen oben, Polling 2 s. Ist `scrollTop > 0`, bleibt dieselbe
  Zeile oben sichtbar (`scrollTop += n × 28`) und „▲ n neue Ereignisse" erscheint; Antippen
  springt nach oben, Scrollen ganz nach oben blendet ihn aus (P15). Sessionwechsel: nach oben,
  kein Hinweis.
- **G8 Fokus:** Klick auf eine Zeile hebt die beteiligten Kacheln (`from`, `to`) im Organigramm
  mit Rahmen in Bereichsfarbe hervor; Klick auf eine Kachel hebt deren Spur, Punkte und Zeilen
  hervor, alle anderen Spuren und Zeilen werden blass (`opacity: 0.3`); zweiter Klick hebt auf
  (P14, P28).
- **G9 Rückblick:** über die vorhandene Session-Auswahl, auch beendete Sessions (P26).
- **G10 „Alle":** Karte zeigt nur „Prozess-Graph nur für eine einzelne Session — oben eine Session
  wählen" (P8). Leere Session: „Noch keine Ereignisse". `truncated`: unter der letzten Zeile
  „Ältere Ereignisse ausgeblendet (höchstens 300 Zeilen)".
- **G11 Handybreite:** unter 720 px (kleinster vorhandener Breakpoint) ist der Spurbereich höchstens
  8 Spalten breit (`120 px`) und scrollt waagrecht (`overflow-x: auto`); Uhrzeit, Label und
  Kurztext bleiben stehen (P16).
- **G12 Sicherheit:** alle Texte (`label`, `text`, `to`, Namen) nur per `textContent` bzw.
  `setAttribute`/`title`; kein `innerHTML` (P17).
- **G13 Status in Zeilen:** `status`-Zeilen zeigen vor dem Kurztext Emoji + Wort aus der
  Status-Tabelle (P13), z. B. „⏳ wartet · Wartet auf Review".

## Abschnitt K — Vereinfachte Organigramm-Kacheln

- **K1 Zugeklappt** (`<details>`/`<summary>`): Zeile 1 Emoji + `name` (fett); Zeile 2 `title`
  (klein); Zeile 3 Status (Emoji + Wort) + `task_short`. Linker Rand 4 px in Bereichsfarbe.
  Leads (L1) behalten die etwas grössere Darstellung über `data-level`. Die bestehende
  Inaktiv-Hervorhebung (Animation) bleibt.
- **K2 Entfällt zugeklappt:** Ebenen-Marke L0/L1/L2, Chips Modell/Paket/Session, langer
  Aufgabentext, Ergebnis, Lebenszeichen.
- **K3 Aufgeklappt:** Modell · Paket (· Session, nur wenn mehrere Sessions angezeigt werden),
  Aufgabe voll (`task`), Ergebnis (`summary`), Lebenszeichen („vor n min").
- **K4 Status-Tabelle** (eine Tabelle in `app.js`, ersetzt `STATUS_LABEL`, gilt für Kacheln,
  Status-Karte, Feed-Badges und Graph):

| Status      | Anzeige            |
| ----------- | ------------------ |
| `active`    | 🔨 arbeitet        |
| `delegated` | 📣 lässt arbeiten  |
| `waiting`   | ⏳ wartet          |
| `blocked`   | 🚧 steckt fest     |
| `idle`      | ☕ bereit          |
| `done`      | ✅ fertig          |
| `failed`    | 💥 gescheitert     |
| `ended`     | 🌙 Feierabend      |
| inaktiv     | 💤 döst seit n min |

Inaktiv überschreibt die Anzeige, n = `floor(idle_seconds / 60)`; die Status-Karte zeigt die
Kachel „💤 döst" (P13).

- **K5 Klick = Agent fokussieren:** zugeklappte Kachel → aufklappen und Agent-Fokus setzen;
  aufgeklappte Kachel → zuklappen und, falls sie den Fokus hat, Fokus aufheben (P14, P28).
- **K6 Zustand über Neuzeichnen:** `app.js` merkt sich offene Kacheln als Menge von
  Agent-Schlüsseln und genau einen Fokus (Agent-Schlüssel oder Zeilen-`id`); verschwindet der
  Schlüssel, wird er still verworfen (P14).
- **K7 Doppelinstanz:** Zweite gleichzeitige Instanz zeigt „<Name> (2)" (aus `name`).

## Fixture-Session „alle Fälle"

**Ort:** neue Funktion `graph_session(start: float) -> list[dict]` in
`tools/studio/tests/fixtures/make_demo.py`, mit eigener Zeitbasis `start` (nicht `NOW`). `main()`
hängt `graph_session(NOW - 22 * 60)` an die bisherige Ausgabe an. Tests importieren sie per
`from tests.fixtures import make_demo` (falls nötig leere `fixtures/__init__.py`) mit
`start = T0`, `now = T0 + 22 * 60`; die Rückblick-Referenz nutzt `make_demo.old_session()` mit
`now = make_demo.NOW`. Session-ID `7c1d2e3f-4a5b-4c6d-8e9f-0a1b2c3d4e5f` (kurz `G`).

Rollen: `main` Boss Bruno · `g-lt` lead-tech Technik-Toni · `g-ts1` tech-sim-engineer Logik-Lars ·
`g-ts2` tech-sim-engineer Logik-Lars (2) · `g-ex` Explore Aushilfe · `g-qr` qa-code-reviewer
Review-Rita.

### Event-Abfolge (Zeit = mm:ss ab `start`)

`log`-Events haben `agent_id: ""`, `source: "log"`; alle anderen `source: "hook"`.

| Nr  | Zeit        | kind            | agent_id | Felder                                                                                                            |
| --- | ----------- | --------------- | -------- | ----------------------------------------------------------------------------------------------------------------- |
| 1   | 00:00       | `session_start` | main     | status=idle, model=opus                                                                                           |
| 2   | 00:05       | `prompt`        | main     | status=active, task="Handelsrouten umsetzen und prüfen"                                                           |
| 3   | 00:30       | `spawn`         | main     | subagent_type=lead-tech, description="Handelsrouten umsetzen", model=opus, tool_use_id=g1                         |
| 4   | 00:31       | `spawned`       | main     | child_id=g-lt, tool_use_id=g1                                                                                     |
| 5   | 00:32       | `agent_start`   | g-lt     | role=lead-tech, status=active                                                                                     |
| 6   | 01:00       | `spawn`         | g-lt     | subagent_type=tech-sim-engineer, description="Routen-Simulation", package=G-1, model=sonnet, tool_use_id=g2       |
| 7   | 01:01       | `spawned`       | g-lt     | child_id=g-ts1, tool_use_id=g2                                                                                    |
| 8   | 01:02       | `agent_start`   | g-ts1    | role=tech-sim-engineer, status=active                                                                             |
| 9   | 01:10       | `spawn`         | g-lt     | subagent_type=tech-sim-engineer, description="Zollberechnung", package=G-2, model=sonnet, tool_use_id=g3          |
| 10  | 01:11       | `spawned`       | g-lt     | child_id=g-ts2, tool_use_id=g3                                                                                    |
| 11  | 01:12       | `agent_start`   | g-ts2    | role=tech-sim-engineer, status=active                                                                             |
| 12  | 01:40       | `spawn`         | main     | subagent_type=Explore, description="Bestehende Handelsdateien suchen", tool_use_id=g4                             |
| 13  | 01:41       | `spawned`       | main     | child_id=g-ex, tool_use_id=g4                                                                                     |
| 14  | 01:42       | `agent_start`   | g-ex     | role=Explore, status=active                                                                                       |
| 15  | 01:30–05:30 | `heartbeat`     | g-ts1    | alle 30 s, tool reihum Read, Edit, Bash                                                                           |
| 16  | 01:30–03:00 | `heartbeat`     | g-ts2    | alle 30 s, tool reihum Read, Edit                                                                                 |
| 17  | 01:50–02:50 | `heartbeat`     | g-ex     | alle 20 s, tool reihum Grep, Glob, Read                                                                           |
| 18  | 03:00       | `agent_stop`    | g-ex     | role=Explore, status=done, summary="3 Dateien gefunden: trade.ts, ships.ts, ports.ts"                             |
| 19  | 03:30       | `bind`          | g-ts2    | role=tech-sim-engineer, package=G-2                                                                               |
| 20  | 03:31       | `status` (log)  | —        | role=tech-sim-engineer, status=blocked, task="Zollsatz fehlt in defs", package=G-2                                |
| 21  | 04:00       | `message`       | g-ts2    | role=tech-sim-engineer, to="main", text="Zollsatz fehlt in src/sim/defs — 10 % oder 15 %?"                        |
| 22  | 04:30       | `message`       | main     | to="g-lt [lead-tech]", text="Zoll 10 %, bitte an Logik-Lars (2) weitergeben"                                      |
| 23  | 05:00       | `message`       | g-lt     | role=lead-tech, to="zoll-helfer", text="<img src=x onerror=alert(1)>"                                             |
| 24  | 05:29       | `bind`          | g-ts2    | role=tech-sim-engineer, package=G-2                                                                               |
| 25  | 05:30       | `status` (log)  | —        | role=tech-sim-engineer, status=failed, summary="Zollberechnung abgebrochen, Werte fehlen", package=G-2            |
| 26  | 05:40       | `agent_stop`    | g-ts2    | role=tech-sim-engineer, status=done, summary="Abgebrochen"                                                        |
| 27  | 05:59       | `bind`          | g-ts1    | role=tech-sim-engineer, package=G-1                                                                               |
| 28  | 06:00       | `status` (log)  | —        | role=tech-sim-engineer, status=done, summary="Routen-Simulation fertig, 12 Tests grün", package=G-1               |
| 29  | 06:10       | `agent_stop`    | g-ts1    | role=tech-sim-engineer, status=done, summary="Fertig."                                                            |
| 30  | 06:30       | `spawn`         | g-lt     | subagent_type=qa-code-reviewer, description="Review Routen-Simulation", package=G-1, model=sonnet, tool_use_id=g5 |
| 31  | 06:31       | `spawned`       | g-lt     | child_id=g-qr, tool_use_id=g5                                                                                     |
| 32  | 06:32       | `agent_start`   | g-qr     | role=qa-code-reviewer, status=active                                                                              |
| 33  | 06:40–08:50 | `heartbeat`     | g-qr     | alle 30 s, tool reihum Read, Grep                                                                                 |
| 34  | 07:00       | `bind`          | g-lt     | role=lead-tech                                                                                                    |
| 35  | 07:01       | `status` (log)  | —        | role=lead-tech, status=waiting, task="Wartet auf Review"                                                          |
| 36  | 09:00       | `agent_stop`    | g-qr     | role=qa-code-reviewer, status=done, summary="2 Befunde: Rundung in trade.ts, fehlender Test"                      |
| 37  | 16:00       | `message`       | g-lt     | role=lead-tech, to="g-ts1", text=LANG (siehe unten, 231 Zeichen, ungekürzt)                                       |
| 38  | 16:05       | `agent_start`   | g-ts1    | role=tech-sim-engineer, status=active (Fortsetzung)                                                               |
| 39  | 16:30–19:00 | `heartbeat`     | g-ts1    | alle 30 s, tool reihum Edit, Bash                                                                                 |
| 40  | 19:30       | `agent_stop`    | g-ts1    | role=tech-sim-engineer, status=done, summary="Befunde behoben, 14 Tests grün"                                     |
| 41  | 19:59       | `bind`          | g-lt     | role=lead-tech                                                                                                    |
| 42  | 20:00       | `status` (log)  | —        | role=lead-tech, status=done, summary="Handelsrouten umgesetzt und geprüft"                                        |
| 43  | 21:00       | `agent_stop`    | g-lt     | role=lead-tech, status=done, summary="Handelsrouten fertig"                                                       |
| 44  | 21:10       | `turn_end`      | main     | status=idle, summary="Handelsrouten fertig"                                                                       |

LANG = „Bitte die zwei Review-Befunde beheben: erstens die Rundung in trade.ts auf ganze Taler
umstellen, zweitens einen Test für leere Lager ergänzen; danach make check laufen lassen und kurz
berichten, welche Tests neu dazugekommen sind." Die Fixture speichert ihn **ungekürzt**, damit die
Kürzung des Modells geprüft wird (die Kürzung des Hooks prüft `test_hook.py`).

Abgedeckte Fälle: Auftrag (Nr. 3–14, 30–32) · Bericht (18, 26, 29, 36, 40, 43) · Nachricht an
laufenden Agenten (22, Form `name [ref]`) · Nachricht mit Fortsetzung (37+38) · Nachricht Agent →
main (21) · Pause > 5 min (09:00 → 16:00) · nicht zuordenbarer Empfänger (23) · Doppelinstanz
(g-ts1 und g-ts2 laufen gleichzeitig) · Statuswechsel blocked (20), failed (25), waiting (35), done
gefaltet (28 → 29) und done als eigene Zeile (42, 60 s vor dem Stop) · Fremdrolle Explore (12–18) ·
XSS-Text (23) · überlange Nachricht (37) · Spalten-Wiederverwendung (g-qr in Spalte 3 von g-ts2) ·
reservierte gestrichelte Spalte (g-ts1 zwischen 06:10 und 16:05) · Heartbeats, `prompt`,
`turn_end`, `bind` ohne Zeile.

### Erwartete Graph-Zeilen (chronologisch; ausgeliefert in umgekehrter Reihenfolge)

Spuren = Zustand **oberhalb** der Zeile (`lanes[i].up`) für Spalten 0–4: S = solid, D = dashed,
· = none. `graph.columns = 5`, `truncated = false`, 21 Zeilen. Spalten: 0 main, 1 g-lt, 2 g-ts1,
3 g-ts2 und danach g-qr, 4 g-ex.

| #   | Zeit  | kind      | label                         | text                                                     | dot  | arrow                  | Spuren    |
| --- | ----- | --------- | ----------------------------- | -------------------------------------------------------- | ---- | ---------------------- | --------- |
| 1   | 00:00 | `start`   | Boss Bruno                    | Session beginnt                                          | 0    | –                      | S · · · · |
| 2   | 00:30 | `order`   | Boss Bruno → Technik-Toni     | Handelsrouten umsetzen                                   | 1    | 0→1 branch             | S S · · · |
| 3   | 01:00 | `order`   | Technik-Toni → Logik-Lars     | Routen-Simulation                                        | 2    | 1→2 branch             | S S S · · |
| 4   | 01:10 | `order`   | Technik-Toni → Logik-Lars (2) | Zollberechnung                                           | 3    | 1→3 branch             | S S S S · |
| 5   | 01:40 | `order`   | Boss Bruno → Aushilfe         | Bestehende Handelsdateien suchen                         | 4    | 0→4 branch             | S S S S S |
| 6   | 03:00 | `report`  | Aushilfe → Boss Bruno         | 3 Dateien gefunden: trade.ts, ships.ts, ports.ts         | 4    | 4→0 merge              | S S S S · |
| 7   | 03:31 | `status`  | Logik-Lars (2)                | Zollsatz fehlt in defs (status=blocked)                  | 3    | –                      | S S S S · |
| 8   | 04:00 | `message` | Logik-Lars (2) → Boss Bruno   | Zollsatz fehlt in src/sim/defs — 10 % oder 15 %?         | 3    | 3→0 message            | S S S S · |
| 9   | 04:30 | `message` | Boss Bruno → Technik-Toni     | Zoll 10 %, bitte an Logik-Lars (2) weitergeben           | 0    | 0→1 message            | S S S S · |
| 10  | 05:00 | `message` | Technik-Toni → ? zoll-helfer  | `<img src=x onerror=alert(1)>` (als Text)                | 1    | 1→null message, to="?" | S S S S · |
| 11  | 05:30 | `status`  | Logik-Lars (2)                | Zollberechnung abgebrochen, Werte fehlen (status=failed) | 3    | –                      | S S S S · |
| 12  | 05:40 | `report`  | Logik-Lars (2) → Technik-Toni | Abgebrochen                                              | 3    | 3→1 merge              | S S S · · |
| 13  | 06:10 | `report`  | Logik-Lars → Technik-Toni     | Routen-Simulation fertig, 12 Tests grün                  | 2    | 2→1 merge              | S S D · · |
| 14  | 06:30 | `order`   | Technik-Toni → Review-Rita    | Review Routen-Simulation                                 | 3    | 1→3 branch             | S S D S · |
| 15  | 07:01 | `status`  | Technik-Toni                  | Wartet auf Review (status=waiting)                       | 1    | –                      | S S D S · |
| 16  | 09:00 | `report`  | Review-Rita → Technik-Toni    | 2 Befunde: Rundung in trade.ts, fehlender Test           | 3    | 3→1 merge              | S S D · · |
| 17  | –     | `pause`   | (leer)                        | … 7 min …                                                | null | –                      | S S D · · |
| 18  | 16:00 | `message` | Technik-Toni → Logik-Lars     | erste 160 Zeichen von LANG + „…"                         | 1    | 1→2 message            | S S S · · |
| 19  | 19:30 | `report`  | Logik-Lars → Technik-Toni     | Befunde behoben, 14 Tests grün                           | 2    | 2→1 merge              | S S · · · |
| 20  | 20:00 | `status`  | Technik-Toni                  | Handelsrouten umgesetzt und geprüft (status=done)        | 1    | –                      | S S · · · |
| 21  | 21:00 | `report`  | Technik-Toni → Boss Bruno     | Handelsrouten fertig                                     | 1    | 1→0 merge              | S · · · · |

Zusätzlich in Zeile 18: `lanes[2].down = "dashed"`, `lanes[2].up = "solid"` (Fortsetzung in die
Nachricht-Zeile gefaltet, keine eigene `resume`-Zeile). Zeile 13: `lanes[2].down = "solid"`,
`up = "dashed"`; die `status done`-Meldung von 06:00 hat keine eigene Zeile. Zeile 14:
`lanes[3].down = "none"`. Die Pausen-Zeile 17 hat `id = "pause:<G>:-:<ts von Zeile 16>"`.

Knotenzustand am Ende (für die Kachel-Prüfung; `on_status` überschreibt `task`/`summary` wie
bisher): Boss Bruno ☕ bereit, `task_short` „Handelsrouten umsetzen und prü…" · Technik-Toni ✅
fertig, Aufgabe „Wartet auf Review" · Logik-Lars ✅ fertig, „Routen-Simulation" · Logik-Lars (2) 💥
gescheitert, „Zollsatz fehlt in defs", Ergebnis „Zollberechnung abgebrochen, Werte fehlen" ·
Aushilfe ✅ fertig, Titel „Explore" · Review-Rita ✅ fertig, „Review Routen-Simulation".

Rückblick-Referenz für die bestehende alte Demo-Session (`0a9d8c7b-…`, beendet): `start` (Boss
Bruno) · `order` Boss Bruno → Zocker-Zoe „Speichern/Laden durchspielen" · `pause` „… 20 min …" ·
`report` Zocker-Zoe → Boss Bruno · `pause` „… 8 min …" · `end` „Session beendet"; über `end`
keine Spur mehr.

## Präzisierungen (von L0 zu bestätigen)

P1–P18 stammen von `lead-design` und sind wörtlich übernommen. P19–P30 sind Ergänzungen des
Spec-Autors für Lücken, die beim Lesen des Codes aufgefallen sind; sie sind ebenfalls von L0 zu
bestätigen.

**P1 Hook message-Event:** bei PreToolUse mit tool_name "SendMessage": kind="message", agent_id
(Absender, "main" wenn fehlt), to = str(tool_input["to"]) gekürzt auf 120 Zeichen, text =
tool_input["message"] (Fallback tool_input["summary"]) mit zusammengefassten Leerzeichen, gekürzt
auf 160 Zeichen + „…". Der Matcher in .claude/settings.json ist bereits "\*", keine Änderung nötig.
Kein Heartbeat zusätzlich; das message-Event zählt als Lebenszeichen des Absenders. Live-Feed zeigt
es als „✉ → <Empfängername>: <text>".

**P2 Empfänger-Auflösung (model.py):** to == "main" → main-Knoten der Session; sonst Teil vor einem
„ [" (Form „name [ref]") abschneiden und mit agent_id der Knoten derselben Session vergleichen →
Treffer; sonst unzuordenbar: Zeile bleibt, Pfeil endet als Stummel „?", Namensspalte „<Absender> →
? <to>".

**P3 Zeilenbildung ohne Doppelungen:** spawn (+ zugeordneter agent_start des Kindes) = EINE
Auftrag-Zeile zur Zeit des spawn; die Kind-Spur beginnt dort. agent_start ohne zugeordneten spawn
= Start-Zeile. session_start = Start-Zeile des Direktors. agent_stop = Bericht-Zeile an den
Elternknoten (zugleich Laufende). session_end = Ende-Zeile, alle Spuren enden dort. Fortsetzung
(agent_start eines schon gestarteten Knotens): geht innerhalb von 30 s (BIND_WINDOW) eine message
an diesen Knoten voraus, gehört die Fortsetzung zu dieser Nachricht-Zeile (Spur nimmt dort wieder
auf); sonst eigene Zeile „Fortsetzung". Statuswechsel-Zeilen aus log.py status mit done, blocked,
waiting und zusätzlich failed (Abweichung vom Design: failed ergänzt, weil Scheitern sonst im
Graphen unsichtbar wäre); ein status done desselben Knotens höchstens 30 s vor seinem agent_stop
wird in die Bericht-Zeile gefaltet (Kurztext = dessen summary). prompt/turn_end des Direktors und
Heartbeats erzeugen keine Zeilen.

**P4** Graph wird bei jedem build_state als Nachlauf über alle Events der Session mit den
ENDGÜLTIGEN Zuordnungen (nach spawned-Korrekturen) berechnet, nicht inkrementell. Folge: eine
spätere Korrektur oder Fortsetzung kann ältere Zeilen umlegen; das ist gewollt (git-artig, kennt
die ganze Geschichte).

**P5 Spalten:** Direktor immer Spalte 0 durchgehend bis session_end. Jeder Lauf eines Agenten
belegt ab seiner Start-/Auftrag-Zeile die kleinste freie Spalte. Nach einem Bericht bleibt die
Spalte reserviert und wird gestrichelt gezeichnet, WENN derselbe Knoten später fortgesetzt wird
(die Fortsetzung läuft in derselben Spalte weiter); ohne spätere Fortsetzung ist die Spalte ab der
Zeile nach dem Bericht frei. Damit ist „Fortsetzung bekommt wieder eine Spalte" als „bekommt ihre
reservierte Spalte zurück" gelesen.

**P6 Pausen-Trenner:** zwischen zwei chronologisch benachbarten Zeilen mit Abstand > PAUSE_GAP =
300 s; Text „… n min …" mit n = abgerundete Minuten; laufende Spuren gehen durch den Trenner
hindurch (durchgezogen/gestrichelt je Zustand).

**P7 Begrenzung:** Graph über die ganze Session rechnen, dann die neuesten GRAPH_ROWS = 300 Zeilen
(Trenner zählen mit) ausliefern; Feld truncated: true, wenn gekürzt; die Spaltenbelegung der
ältesten ausgelieferten Zeile stimmt trotzdem (aus der Vollrechnung).

**P8 Session „Alle":** graph = null; die Karte zeigt „Prozess-Graph nur für eine einzelne Session
— oben eine Session wählen".

**P9 Doppelinstanz:** Beim ersten Start eines Knotens bekommt er eine feste Instanznummer: 1, wenn
kein anderer nicht-finaler (Status nicht in done/failed/ended) Knoten derselben Rolle in derselben
Session existiert; sonst die kleinste Zahl ≥ 2, die kein solcher Knoten hält. Die Nummer ändert
sich danach nie. Anzeige: Nummer 1 ohne Zusatz, sonst „<Name> (n)". Gilt auch für Fremdrollen
(„Aushilfe (2)").

**P10 Neue öffentliche Knotenfelder:** name, title, emoji, instance (int). Direktor-Knoten
(agent_id main) und log-only-Knoten (log:<rolle>) bekommen Namen über ihre Rolle wie alle anderen.
Frontmatter-Werte: umschliessende Anführungszeichen entfernen; fehlt studio-name → Rückfallwerte
(Fremdrolle: „Aushilfe" / Rollenname / 🧑‍🔧).

**P11 Graph-Zeilen-Schema** (Vorschlag, Autor präzisiert Feldnamen): id (stabil über Polls:
"<kind>:<session>:<agent_id>:<ts>"), t, time ("HH:MM"), kind
(start|end|order|report|message|resume|status|pause), from (Knotenschlüssel|null), to
(Knotenschlüssel|null|"?"), label („Name → Name"), text (≤ 160), status (bei status-Zeilen), lanes
(Liste je Spalte: {key, department, style: solid|dashed|none}), dot (Spaltenindex des Ereignisses),
arrow ({from_col, to_col|null, style: branch|merge|message}). Dazu graph.columns (maximale
Spaltenzahl) und graph.truncated.

**P12 Kurzaufgabe:** SHORT_TASK = 30 Zeichen, bei Kürzung 30 Zeichen + „…"; das Modell liefert
task_short; volle Aufgabe bleibt task. Direktor: erste Zeile des letzten Nutzerauftrags
(bestehendes task-Feld).

**P13** Status-Beschriftung dashboardweit aus EINER Tabelle in app.js (ersetzt die heutigen
STATUS_LABEL-Wörter); inaktiv überschreibt die Anzeige als „💤 döst seit n min" mit n =
floor(idle_seconds/60); Status-Karte zeigt dieselben Emoji + Wörter.

**P14 Fokus-Zustand in app.js:** genau ein Fokus (Agent-Schlüssel ODER Graph-Zeilen-id) überlebt
das Neuzeichnen; verschwindet der Schlüssel aus dem Zustand, wird der Fokus still aufgehoben.
Kachel-Klick setzt Agent-Fokus (klappt auf); Zeilen-Klick setzt Zeilen-Fokus (hebt beteiligte
Kacheln hervor, klappt nichts auf). Offene Kacheln merkt sich app.js zusätzlich als Menge von
Agent-Schlüsseln (Fokus aufheben per zweitem Klick klappt zu).

**P15 „Neue Ereignisse"-Hinweis:** app.js vergleicht die Zeilen-ids mit dem letzten Poll; ist
scrollTop > 0, bleibt die Position an derselben Zeile stehen und „▲ n neue Ereignisse" erscheint;
Antippen oder Scrollen ganz nach oben blendet ihn aus.

**P16 Handybreite:** unterhalb des vorhandenen kleinsten Breakpoints in style.css scrollt nur der
Spurbereich waagrecht (overflow-x), Uhrzeit/Namen/Kurztext bleiben stehen; Spaltenbreite 14 px,
Zeilenhöhe fest (Autor nennt Wert, Vorschlag 28 px). → **Festgelegt: 28 px**; kleinster
Breakpoint ist `720px`.

**P17 Sicherheit:** Nachrichtentexte, to-Werte und Namen nur per textContent/setAttribute; Fixture
enthält `<img src=x onerror=alert(1)>` als Nachricht; Abnahme: im Screenshot als Text sichtbar,
kein Alert, kein <img> im DOM.

**P18 Tests:** neue Klassen in tools/studio/tests/test_model.py (z. B. GraphTest, NamesTest) und in
test_hook.py (message-Event, Kürzung, fehlendes message-Feld wirft nicht); Namen aus Frontmatter
über ein temporäres agents-Verzeichnis wie im bestehenden test_read_agent_models.

**P19 Anzahl Persona-Dateien (Ergänzung):** Die Namensliste hat 14 Einträge; `studio-director` hat
keine Persona-Datei. Frontmatter bekommen also **13** Dateien unter `.claude/agents/`; der Direktor
erhält seinen Namen ausschliesslich aus `DIRECTOR_NAME` in `model.py` (bzw. aus `names.json` beim
Rückfallweg, dort ebenfalls 14 Einträge möglich).

**P20 Namen in `build_state` (Ergänzung, präzisiert P10):** neue Funktion
`read_agent_names(agents_dir) -> {rolle: {name, title, emoji}}` (Frontmatter-Weg) bzw. Lesen von
`tools/studio/names.json` (Rückfallweg), gleiches Rückgabeformat; neuer optionaler Parameter
`agent_names` von `build_state` (bestehende Aufrufe und Tests bleiben gültig, ohne Namen gelten die
Rückfallwerte). Das öffentliche Feld `name` ist der **Anzeigename** inklusive „ (n)" ab Instanz 2;
`instance` trägt die Zahl. Namen werden in der Ausgabe aus der **endgültigen** Rolle bestimmt.

**P21 Instanznummer im Nachlauf (Ergänzung, präzisiert P9 im Sinn von P4):** Die Nummer wird nach
dem Durchlauf aller Events mit den endgültigen Rollen vergeben, Knoten in Reihenfolge ihres ersten
Starts (bei Gleichstand nach Schlüssel). Ein anderer Knoten B „hält" zum Startzeitpunkt t eine
Nummer, wenn t in einem seiner Läufe liegt (Knoten mit `agent_start`), bzw. bei Knoten ohne Läufe
zwischen `started` und `stopped` (offen = bis jetzt). Zwischen Bericht und Fortsetzung hält B
keine Nummer. Der Direktor hat immer Instanz 1.

**P22 Laufgrenzen (Ergänzung):** Der Lauf eines Hook-Knotens endet nur mit `agent_stop` oder
`session_end`, nicht mit `log.py status done/failed` (die Spur bleibt bis zum Bericht sichtbar).
log-only-Knoten `log:<rolle>`: eine Spur vom ersten bis zum letzten eigenen `status`-Event; ihre
erste `status`-Zeile gilt zugleich als Start (bei Status ohne eigene Zeile, z. B. `active`, entsteht
dafür eine `start`-Zeile). Knoten ohne `agent_start`: `start`-Zeile beim ersten Event des Knotens.
Session ohne `session_start`: keine Direktor-Start-Zeile, Spalte 0 beginnt an der ältesten Zeile.
Damit hat jeder Knoten genau eine Spalte über seine ganze Lebensdauer.

**P23 Punkt und Pfeilziel (Ergänzung):** `dot` je Art: `order` → Spalte des Kindes, `report` →
Spalte des Berichtenden, `message` → Spalte des Absenders, `start`/`resume`/`status` → Spalte des
Knotens, `end` → 0, `pause` → null. `to_col` = Spalte des Zielknotens, wenn er in dieser Zeile eine
Spur (`solid` oder `dashed`) hat; sonst `null` (Stummel). Das Zeichen „?" gibt es nur bei
unzuordenbarem Empfänger (`to = "?"`); ein bekannter Empfänger ohne Spur (Nachricht an beendeten,
nie fortgesetzten Agenten) erhält einen Stummel ohne „?", Label mit seinem Namen. Nachricht an sich
selbst: `arrow = null`.

**P24 Spuren mit zwei Hälften und id-Details (Ergänzung, präzisiert P11):** statt `style` je Spalte
liefert jeder Eintrag `up` und `down` (Spurstück zur neueren bzw. älteren Nachbarzeile), damit
Beginn, Ende, Übergang gestrichelt↔durchgezogen in derselben Zeile eindeutig sind. `lanes` hat
immer `graph.columns` Einträge. `<ts>` in der `id` ist der unveränderte `ts`-String des
bestimmenden Events (`spawn` bei `order`, `agent_stop` bei `report`, `message` bei Nachricht auch
mit gefalteter Fortsetzung); Pausen-id `pause:<session>:-:<ts der älteren Nachbarzeile>`; bei
Kollision Zusatz `#2`, `#3` in Event-Reihenfolge.

**P25 Kurztexte und Labels (Ergänzung):** `start` Direktor „Session beginnt", sonst `task` oder
„Start"; `order` = `description`; `report` = gefaltete `status done`-summary, sonst
`agent_stop`-summary, sonst „fertig"; `message` = Nachrichtentext; `resume` = „Fortsetzung";
`status` = `task` oder `summary` des Events (app.js stellt Emoji + Wort voran); `end` = „Session
beendet"; `pause` = „… n min …". Label: bei `order`/`report`/`message` „Name → Name", sonst „Name";
`pause` leer. Alle Texte mit zusammengefasstem Leerraum, höchstens 160 Zeichen + „…".

**P26 Rückblick (Ergänzung, Lesart des Designs):** „auch archivierte Sessions" wird gelesen als
„auch beendete Sessions, solange sie in `.studio/events.jsonl` stehen". Das Dashboard liest
`.studio/archive/` nicht; `make studio-archive` behält sein dokumentiertes Verhalten („Dashboard
startet leer", README).

**P27 Vorabprüfung Teil B (Ergänzung):** Die Feldnamen von `SendMessage` (`to`, `message`,
`summary`), die Form von `to` und das `SubagentStart` bei Fortsetzung sind im Repo nicht belegt;
sie werden in Schritt 0 an einer echten Payload geprüft (siehe V1 Teil B).

**P28 Klick-Regeln (Ergänzung, präzisiert P14):** Klick auf zugeklappte Kachel → aufklappen und
Agent-Fokus auf sie. Klick auf aufgeklappte Kachel → zuklappen; hatte sie den Fokus, wird er
aufgehoben. Klick auf eine Graph-Zeile → Zeilen-Fokus (ein bestehender Agent-Fokus weicht, offene
Kacheln bleiben offen); Klick auf dieselbe Zeile → Fokus aufheben. Wirkung Agent-Fokus: Spur,
Punkte und Zeilen mit `from`/`to` = Agent voll, alles andere im Graphen `opacity: 0.3`. Wirkung
Zeilen-Fokus: Zeile hervorgehoben, Kacheln von `from` und `to` mit Rahmen in Bereichsfarbe, übrige
Kacheln unverändert.

**P29 Interaktions-Screenshots (Ergänzung):** Klicks, Scrollen und DOM-Abfragen führt
`qa-playtester` per Chrome DevTools Protocol aus (`--remote-debugging-port`, wie in seiner Persona
vorgesehen); statische Ansichten per `--screenshot`. Kein neues Paket.

**P30 Layout des Spurbereichs (Ergänzung):** ein gemeinsames `<svg>` links und die Zeilenliste
rechts im selben vertikalen Scroll-Container (`.graph-body`, 60vh), damit Spuren und Text
zeilengenau übereinanderliegen; unter 720 px ist der Spurbereich höchstens 120 px breit (8 Spalten
plus Rand) und hat eigenes `overflow-x: auto`.

## Abnahmekriterien

### Unittest — `tools/studio/tests/test_hook.py`

| ID  | Kriterium                                                                                           | Test (Klasse `MessageEventTest`, sofern nicht anders genannt) |
| --- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| T1a | `SendMessage` aus Subagent → `kind="message"`, `agent_id`, `to`, `text` korrekt; kein `tool`-Feld   | `test_send_message_creates_message_event`                     |
| T1b | Ohne `agent_id` ist der Absender `main`                                                             | `test_main_is_sender_without_agent_id`                        |
| T1c | `text`: Leerraum zusammengefasst, 161 Zeichen → 160 + „…"                                           | `test_message_text_collapsed_and_cut_at_160`                  |
| T1d | `to` mit 130 Zeichen → 120 + „…"; `to` als Zahl → String                                            | `test_to_cut_at_120_and_stringified`                          |
| T1e | fehlendes/leeres `message` → `summary`; beides fehlt → `text=""`                                    | `test_summary_fallback`                                       |
| T1f | `message` als Objekt, `tool_input` fehlt oder ist kein dict → kein Fehler, Event mit leeren Feldern | `test_malformed_send_message_does_not_raise`                  |
| T1g | andere Tools bleiben `heartbeat`                                                                    | `test_other_tools_stay_heartbeat`                             |
| T1h | `main()` mit SendMessage-Payload schreibt genau eine Zeile `kind=message` (STUDIO_HOME temporär)    | `MainTest.test_main_writes_message_event`                     |
| T1i | `PreToolUse`-Matcher in `.claude/settings.json` deckt `SendMessage` ab (`"*"`)                      | `SettingsTest.test_pretooluse_matcher_covers_send_message`    |

### Unittest — `tools/studio/tests/test_model.py`

| ID  | Kriterium                                                                                                                                                              | Test                                                                                                 |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| T2a | `message` berührt `last_seen` des Absenders, ändert keinen Status                                                                                                      | `GraphTest.test_message_is_heartbeat_of_sender`                                                      |
| T2b | Feed-Zeile „✉ → Technik-Toni: …" bzw. „✉ → ? zoll-helfer: …"                                                                                                           | `GraphTest.test_message_feed_text`                                                                   |
| T3a | Namen aus temporärem agents-Verzeichnis, Anführungszeichen entfernt, fehlendes Feld → Rückfall nur für dieses Feld                                                     | `NamesTest.test_read_agent_names_from_frontmatter`                                                   |
| T3b | Direktor ohne Eintrag → Boss Bruno / Studio-Direktor / 🎬; Explore → Aushilfe / Explore / 🧑‍🔧                                                                           | `NamesTest.test_director_and_foreign_fallbacks`                                                      |
| T3c | zwei gleichzeitige tech-sim-engineer → „Logik-Lars", „Logik-Lars (2)", `instance` 1/2                                                                                  | `NamesTest.test_second_instance_gets_suffix`                                                         |
| T3d | P9-Regel: A(1) fertig, B(2) läuft, C startet → C = 3; nach Ende aller startet D → 1; Nummer ändert sich nie                                                            | `NamesTest.test_instance_number_rule`                                                                |
| T3e | Zwischen Bericht und Fortsetzung hält ein Knoten keine Nummer (P21)                                                                                                    | `NamesTest.test_paused_node_holds_no_instance`                                                       |
| T3f | log-only-Knoten und Fremdrolle „Aushilfe (2)" bekommen Namen                                                                                                           | `NamesTest.test_log_only_and_foreign_second_instance`                                                |
| T3g | `spawned`-Korrektur der Rolle ändert Namen gemäss endgültiger Rolle                                                                                                    | `NamesTest.test_name_follows_final_role`                                                             |
| T6a | `task_short`: 30 Zeichen bleiben, 31 → 30 + „…"; Direktor aus erster Zeile des Auftrags                                                                                | `NamesTest.test_task_short`                                                                          |
| T4a | `graph` für einzelne Session und `latest`, `null` für `all`                                                                                                            | `GraphTest.test_graph_only_for_single_session`                                                       |
| T4b | spawn + agent_start = eine `order`-Zeile zur spawn-Zeit; keine separate `start`-Zeile                                                                                  | `GraphTest.test_order_row_merges_spawn_and_start`                                                    |
| T4c | `agent_stop` → `report` an Eltern, `merge`, Spur endet ohne spätere Fortsetzung                                                                                        | `GraphTest.test_report_row_ends_lane`                                                                |
| T4d | Nachricht an laufenden Agenten: `message`-Pfeil zwischen beiden Spalten                                                                                                | `GraphTest.test_message_to_running_agent`                                                            |
| T4e | Nachricht + Fortsetzung ≤ 30 s → eine Zeile, `down=dashed`/`up=solid` in der Zielspalte                                                                                | `GraphTest.test_resume_folds_into_message_row`                                                       |
| T4f | Fortsetzung ohne Nachricht (oder > 30 s danach) → eigene `resume`-Zeile                                                                                                | `GraphTest.test_resume_without_message_has_own_row`                                                  |
| T4g | Nachricht Agent → `main` zielt auf Spalte 0                                                                                                                            | `GraphTest.test_message_to_main`                                                                     |
| T4h | `to="g-lt [lead-tech]"` wird aufgelöst                                                                                                                                 | `GraphTest.test_recipient_bracket_form`                                                              |
| T4i | unzuordenbarer Empfänger: Zeile bleibt, `to="?"`, `to_col=null`, Label „… → ? zoll-helfer"                                                                             | `GraphTest.test_unresolvable_recipient_keeps_row`                                                    |
| T4j | bekannter Empfänger ohne Spur → `to_col=null`, `to`=Knotenschlüssel, kein „?"; an sich selbst → `arrow=null`                                                           | `GraphTest.test_message_target_without_lane`                                                         |
| T4k | Spalten-Wiederverwendung: freie Spalte geht an den nächsten Lauf (kleinste freie)                                                                                      | `GraphTest.test_column_reuse_after_finish`                                                           |
| T4l | Spalte bleibt bis zur späteren Fortsetzung reserviert und gestrichelt                                                                                                  | `GraphTest.test_reserved_dashed_column_until_resume`                                                 |
| T4m | Pause > 300 s → `pause`-Zeile „… 7 min …"; genau 300 s → keine; Spuren laufen durch                                                                                    | `GraphTest.test_pause_separator`                                                                     |
| T4n | Status-Zeilen für blocked, waiting, failed, done; active erzeugt keine; done ≤ 30 s vor Stop gefaltet                                                                  | `GraphTest.test_status_rows_and_done_folding`                                                        |
| T4o | Heartbeat, prompt, turn_end, bind, spawned erzeugen keine Zeilen                                                                                                       | `GraphTest.test_silent_events_make_no_rows`                                                          |
| T4p | `session_end` → `end`-Zeile, alle Spuren enden (`up=none` überall)                                                                                                     | `GraphTest.test_session_end_closes_all_lanes`                                                        |
| T4q | 320 Zeilen → 300 ausgeliefert, `truncated=true`, `columns` und Spuren der ältesten Zeile wie in der Vollrechnung                                                       | `GraphTest.test_truncation_keeps_lanes`                                                              |
| T4r | `id` stabil über zwei `build_state`-Aufrufe und nach Anhängen neuer Events                                                                                             | `GraphTest.test_row_ids_stable`                                                                      |
| T4s | späte `spawned`-Korrektur legt ältere Zeilen um (P4)                                                                                                                   | `GraphTest.test_late_correction_relayouts`                                                           |
| T4t | log-only-Knoten erhält eine Spur vom ersten bis letzten Status; Knoten ohne agent_start eine start-Zeile                                                               | `GraphTest.test_log_only_and_startless_lanes`                                                        |
| T4u | Text > 160 im Modell auf 160 + „…" gekürzt; `lanes` immer `columns` lang; Ausgabe JSON-serialisierbar                                                                  | `GraphTest.test_text_limit_lane_width_json`                                                          |
| T5  | Fixture-Session ergibt exakt die 21 Referenzzeilen (kind, label, text, dot, arrow, Spuren) in umgekehrter Reihenfolge; alte Demo-Session ergibt die Rückblick-Referenz | `GraphFixtureTest.test_fixture_matches_reference`, `GraphFixtureTest.test_old_session_retrospective` |

Bestehende Tests bleiben grün; `make check` (inkl. `studio-test`, ESLint, Prettier) grün.

### Playtest — `qa-playtester`, Headless-Chrome, Screenshots unter `.studio/qa/G/`

Aufbau: `TMP=$(mktemp -d)`; `python3 tools/studio/tests/fixtures/make_demo.py "$TMP/events.jsonl"`;
`STUDIO_HOME="$TMP" python3 tools/studio/server.py --port <frei>`; URL
`http://127.0.0.1:<port>/?session=7c1d2e3f-4a5b-4c6d-8e9f-0a1b2c3d4e5f&theme=light` (bzw.
`theme=dark`). Breit = 1280×2000, schmal = 390×2400. Interaktionen per CDP (P29).

| ID    | Screenshot / Check                                                                                                                                                                                  | Muss zu sehen sein                                                                                                                                                                                                                                                                                                                                                                                           |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| G-S1  | breit, hell                                                                                                                                                                                         | Karte „Prozess-Graph" direkt unter „Organigramm", über die ganze Breite; oberste Zeile „Technik-Toni → Boss Bruno · Handelsrouten fertig"; 21 Zeilen inkl. blasser Zeile „… 7 min …"; 5 Spuren, Spalte 0 blau (studio), Spalten 1–3 in Tech-Farbe, Review-Rita in QA-Farbe, Aushilfe in Extern-Farbe                                                                                                         |
| G-S2  | breit, hell, Ausschnitt Zeilen 10–18                                                                                                                                                                | gestrichelte Spur in Spalte 2 zwischen „Logik-Lars → Technik-Toni · Routen-Simulation fertig…" und der Nachricht 16:00, danach durchgezogen; Abzweig-Kurve bei den Aufträgen, Einmündung bei Berichten, gepunkteter Pfeil mit Spitze bei Nachrichten; Stummel mit „?" bei „Technik-Toni → ? zoll-helfer"                                                                                                     |
| G-S3  | breit, dunkel                                                                                                                                                                                       | gleiche Inhalte, Spurfarben aus den dunklen `--dep-*`-Tokens, Text lesbar                                                                                                                                                                                                                                                                                                                                    |
| G-S4  | schmal, hell                                                                                                                                                                                        | Graph-Karte einspaltig, Spurbereich ≤ 120 px, Uhrzeit/Label/Kurztext lesbar, Kurztexte mit „…" abgeschnitten                                                                                                                                                                                                                                                                                                 |
| G-S5  | schmal, nach CDP-Scroll des Spurbereichs um 60 px nach rechts                                                                                                                                       | Spuren verschoben, Uhrzeit/Label/Kurztext an gleicher Stelle wie in G-S4                                                                                                                                                                                                                                                                                                                                     |
| G-S6  | XSS                                                                                                                                                                                                 | Zeile 05:00 zeigt den Text `<img src=x onerror=alert(1)>` wörtlich; CDP: `document.querySelectorAll('img').length === 0`, kein `Page.javascriptDialogOpening`                                                                                                                                                                                                                                                |
| G-S7  | Tooltip                                                                                                                                                                                             | CDP: `title` der Zeile 16:00 = `row.text` (160 Zeichen + „…")                                                                                                                                                                                                                                                                                                                                                |
| G-S8  | Zeilen-Fokus: CDP-Klick auf Zeile 04:00                                                                                                                                                             | Kacheln „Logik-Lars (2)" und „Boss Bruno" mit Rahmen hervorgehoben, andere Kacheln unverändert, keine Kachel aufgeklappt; zweiter Klick: Hervorhebung weg                                                                                                                                                                                                                                                    |
| G-S9  | neue Ereignisse: Graph per CDP um 200 px nach unten scrollen, dann 2 Events anhängen (`message` main → `g-ex` „Danke für die Suche"; `message` main → `unbekannt-7` „Test", ts = jetzt), 3 s warten | Hinweis „▲ 2 neue Ereignisse"; oberste sichtbare Zeile dieselbe wie vor dem Anhängen; nach Klick auf den Hinweis: ganz oben zwei neue Zeilen (Stummel ohne „?" bei Aushilfe, mit „?" bei unbekannt-7), Hinweis weg                                                                                                                                                                                           |
| G-S10 | `?session=all`                                                                                                                                                                                      | Graph-Karte zeigt nur „Prozess-Graph nur für eine einzelne Session — oben eine Session wählen"                                                                                                                                                                                                                                                                                                               |
| G-S11 | Rückblick: alte Demo-Session in der Auswahl                                                                                                                                                         | Zeilen laut Rückblick-Referenz, zwei Pausen-Trenner, oberste Zeile „Boss Bruno · Session beendet", keine Spur über ihr                                                                                                                                                                                                                                                                                       |
| K-S1  | breit, hell, Organigramm                                                                                                                                                                            | Kacheln zugeklappt: Zeile 1 „🔧 Technik-Toni" fett, Zeile 2 „Tech-Chef", Zeile 3 „✅ fertig · Wartet auf Review"; „🎬 Boss Bruno" mit „☕ bereit · Handelsrouten umsetzen und prü…"; „⚙️ Logik-Lars (2)" mit „💥 gescheitert · Zollsatz fehlt in defs"; „🧑‍🔧 Aushilfe" mit Titel „Explore"; keine L0/L1/L2-Marken, keine Modell-/Paket-Chips, kein Ergebnis, kein Lebenszeichen; linker Rand in Bereichsfarbe |
| K-S2  | Status-Karte                                                                                                                                                                                        | Kacheln mit Emoji + Wort laut Tabelle K4, inkl. „💤 döst"                                                                                                                                                                                                                                                                                                                                                    |
| K-S3  | Neueste Session (bestehende Demo), breit                                                                                                                                                            | Kachel „🖱️ UI-Ursula" zeigt „💤 döst seit n min" (n ≥ 5) und die Kurzaufgabe `<img src=x onerror=alert(1)>` als Text                                                                                                                                                                                                                                                                                         |
| K-S4  | CDP-Klick auf „Logik-Lars (2)", 5 s warten (≥ 2 Polls)                                                                                                                                              | Kachel weiterhin aufgeklappt mit „sonnet · G-2", Aufgabe „Zollsatz fehlt in defs", Ergebnis „Zollberechnung abgebrochen, Werte fehlen", Lebenszeichen; im Graphen die Spur von Logik-Lars (2) in Spalte 3 (01:10–05:40) und die Zeilen 4, 7, 8, 11, 12 voll, übrige Spuren und Zeilen blass (auch Review-Rita in Spalte 3)                                                                                   |
| K-S5  | zweiter Klick auf dieselbe Kachel                                                                                                                                                                   | Kachel zugeklappt, Graph ohne Blässe                                                                                                                                                                                                                                                                                                                                                                         |
| K-S6  | schmal, dunkel, eine Kachel aufgeklappt                                                                                                                                                             | Kacheln einspaltig lesbar, Emoji sichtbar, aufgeklappter Teil umbricht ohne waagrechten Seiten-Scroll                                                                                                                                                                                                                                                                                                        |

## Nachzuführende Dokumente (in der Umsetzung, hier nur benannt)

| Dokument                                             | Änderung                                                                                                                                                                            |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/adr/ADR-008-studio-telemetrie.md`              | Nachtrag: `message`-Event aus `PreToolUse(SendMessage)`; Datenschutz: Nachrichtenanfänge ≤ 160 Zeichen und Empfänger ≤ 120 im Klartext, lokal, gitignored                           |
| `docs/studio/roster.md`                              | Namensspalte (Name, Titel, Emoji) in „Aktive Personas"; Namensregel (Alliteration, Präfix = Arbeitswort); Direktor „Boss Bruno"; Schritt „Namen vergeben" in „Neue Persona anlegen" |
| `docs/studio/STUDIO.md`                              | Onboarding neuer Personas: Name nach Namensregel vergeben (Verweis auf roster.md); keine Regeländerung                                                                              |
| `docs/studio/templates/persona.md`                   | Frontmatter-Vorlage um `studio-name`, `studio-title`, `studio-emoji` (bzw. Hinweis auf `names.json` beim Rückfallweg)                                                               |
| `.claude/agents/*.md`                                | 13 Dateien: drei Frontmatter-Felder laut Namensliste (ohne `studio-director`, P19) — nur beim Frontmatter-Weg                                                                       |
| `tools/studio/names.json`                            | nur beim Rückfallweg: neu, 13 bzw. 14 Einträge                                                                                                                                      |
| `docs/superpowers/specs/2026-09-30-studio-design.md` | Verweis auf diese Spec in „Server und Dashboard" (Ansichten) und im Event-Schema (`kind` `message`)                                                                                 |
| `docs/index.md`                                      | Eintrag dieser Spec in der Spec-Liste                                                                                                                                               |
| `README.md`                                          | geprüft per grep: beschreibt nur Make-Befehle und das automatische Öffnen, keine Ansichten → **keine Änderung**                                                                     |
| `docs/arc42.md`                                      | geprüft per grep: nennt das Studio nur in der ADR-Tabelle → **keine Änderung**                                                                                                      |
| `docs/studio/herkunft.md`                            | keine Änderung: von `git log --graph` wird nur die Darstellungsidee übernommen, kein Code                                                                                           |

## Auswirkungen

- **Spielstand/Save-Format:** keine; das Spiel ist nicht betroffen. `events.jsonl` wird nur um eine
  Event-Art erweitert; alte Dateien bleiben lesbar (Randfälle).
- **Balancing-Test:** nicht betroffen (keine Änderung unter `src/`).
- **Leistung:** Der Graph wird bei jeder Anfrage aus allen Events der Session neu berechnet (wie
  heute der ganze Zustand); die Ausgabe ist auf 300 Zeilen begrenzt.

## Offene Punkte

Keine TBD. Die Präzisierungen P1–P30 sind von L0 zu bestätigen; der Weg für die Namen
(Frontmatter oder `names.json`) und die genaue `SendMessage`-Abbildung entscheiden sich in
Schritt 0 und werden als Ruling festgehalten.
