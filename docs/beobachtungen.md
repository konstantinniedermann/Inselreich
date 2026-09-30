# Beobachtungen (Posteingang für Befunde ausserhalb des Scopes)

Aufbau je Eintrag: Datum · Fundort · Beobachtung · Ursprung · erste Einschätzung.
Auswertung mit dem Skill `beobachtungen-auswerten`. Ein Folgeissue entsteht nur auf
ausdrückliche Zustimmung des Nutzers.

---

## 2026-09-29 · dep-guard-Hook (`~/.claude/hooks/dep_guard.py`) · Fehlalarm bei Heredoc-Text

**Beobachtung:** Ein Bash-Aufruf, der Dateien per Heredoc anlegte _und_ danach `npm install -D …` ausführte,
wurde blockiert, weil der Hook Wörter aus dem Heredoc (README-/Makefile-Text) als Paketnamen gelesen hat.
**Ursprung:** Task 1 (Scaffold), Implementierer-Bericht. Workaround: Dateianlage und Install getrennt ausführen.
**Einschätzung:** Falsch-positiv durch Tokenisierung des gesamten Kommandos statt nur der Install-Zeile.
Betrifft alle CAS-Projekte (geteilter Baustein). Kandidat für eine kleine Härtung des Hooks: nur die Zeile
mit dem Install-Kommando tokenisieren.

## 2026-09-29 · M1 Fundament · Aufschiebbare Befunde aus Task- und Gesamt-Review

Alle vom Gesamt-Review als „fine to defer" eingestuft; keine betrifft Spielbarkeit oder Spec-Konformität.

**Darstellung / UI** (`src/render`, `src/ui`) — Ursprung: Reviews Task 6/7

- Weg-Kacheln können bei fraktionalem Zoom feine Nähte zeigen (Rundung von Position/Grösse fehlt).
- Bau-/Abriss-Aktion wirkt auf die Release-, nicht die Press-Kachel; kleines Verrutschen trifft den Nachbarn.
- Abriss-Regel „Gebäude, sonst Weg" steht doppelt (Hover in `input.ts`, Aktion in `app.ts`); Viewgrösse wird doppelt geführt. Beim dritten Aufrufer (Inspect-Panel M2) zusammenziehen.
- Tastatur-Pan ist framerate-abhängig (16 px/Frame); bei Arbeiten am Loop auf `dt` umstellen.
- Kein `dispose()` für Listener/ResizeObserver/rAF; relevant sobald `startGame` zweimal läuft („Neu" in M4).
  **Erledigt in M4:** `startGame` liefert `dispose()` (Loop, ResizeObserver, Listener, Meldungsfläche, HUD-Timer); Laden und Neu rufen es vor dem Neustart auf (`src/ui/app.ts`).
- Toasts stapeln sich unbegrenzt bei Klick-Spam; Touch-Bedienung nur teilweise (kein Pinch, Werkzeuge ohne Pan).
  **Toast-Stapel erledigt in M4:** höchstens drei sichtbar, gleiche Meldung innert einer Sekunde nur einmal (`src/ui/messages.ts`). Touch bleibt offen.
- `#panel` ist bis M2 eine leere Karte.
  **Erledigt in M2:** Info-Panel und Handelsdialog (`src/ui/inspect.ts`, `src/ui/trade.ts`).
- `startGame` fängt einen möglichen `throw` aus `createWorld` (50 Seeds ohne gültige Insel) nicht ab; praktisch unerreichbar.
  **Erledigt in M4:** `startGame` fängt Startfehler ab und zeigt eine bleibende Meldung (`src/ui/app.ts`).

**Simulation / Tests** (`src/sim`, `tests`) — Ursprung: Reviews Task 2–5

- Gebirgsanteil je nach Seed 1–27 % der Insel; Balancing in M4 prüfen.
- `adjacentReason`/`radiusReason` leiten die Meldung aus dem Terrain ab; bei einer fünften Regel Lookup je Terrain einführen.
- `hash2` hat schwache Avalanche (eine Multiplikationsrunde); nur relevant, falls Karten sichtbare Muster zeigen.
- `createRng` (mulberry32) ist angelegt, aber ungenutzt; keine Known-Vector-Prüfung.
- `defs.test` prüft nur wenige Werte gegen die Spec-Tabellen (voller Tabellenvergleich wäre Duplikation).

**Konventionen** — Ursprung: Gesamt-Review

- Commit-Präfix `chore:` wird verwendet, steht aber nicht in der Präfixliste der übergeordneten `CLAUDE.md`. Entscheid: Liste dort ergänzen oder hier verzichten.

## 2026-09-30 · M2 Wirtschaft · Aufschiebbare Befunde aus Task- und Gesamt-Review

Vom Gesamt-Review als „fine to defer" eingestuft; keine betrifft Spielbarkeit oder Spec-Konformität.

- **Zeitkonstanten verstreut** (`UPKEEP_INTERVAL` in `economy.ts`, M3 bringt `GROWTH_INTERVAL` und die 300-Tick-Aufstiegswartezeit): nach M3 in ein `defs/timing.ts` zusammenziehen (Regel „Spielwerte nur in defs").
  **Erledigt in M4:** `src/sim/defs/timing.ts` (`TICK_MS`, `UPKEEP_INTERVAL`, `GROWTH_INTERVAL`, `UPGRADE_WAIT`); alte Exporte als Re-Export.
- **Handelsbuttons** sind bei Geldmangel nur deaktiviert, ohne Grund; `'Kein Geld'` aus `buy()` ist so vom UI aus unerreichbar. Konsistent zur Bauleiste wäre „klickbar + Toast".
- **Refund-Text nominal:** zeigt `refundCost`, obwohl `grantRefund` am Lagerlimit kappt; Verlust ist beabsichtigt, Anzeige könnte das andeuten.
- **BFS-Richtungsarray** wird je Iteration alloziert (`roads.ts`); bei 64×64 unerheblich.
- **`refresh()` je Weg-Kachel während Drag** (statt 10-Frame-Takt); drei billige textContent-Vergleiche.
- **`sell` ignoriert Rückgabe von `takeStock`**, `buy` die von `addStock` — nach den Vorprüfungen sicher, per Kommentar dokumentiert.
- **Nach Deserialisierung (M4)** `recomputeConnectivity` aufrufen statt persistiertem `connected` zu vertrauen.
  **Erledigt in M4:** `deserialize` ruft `recomputeConnectivity` auf (`src/sim/save.ts`), Test in `tests/sim/save.test.ts`.
- **Prozess:** Zwei Implementierer-Subagenten blieben nach dem Schreiben der Tests ohne Fortschritt hängen (Watchdog 600 s); Muster: komplexe Einzeiler-Shellbefehle zum Editieren. Gegenmassnahme im Dispatch: Edit/Write-Tools verlangen, Shell kurz halten.

## 2026-09-30 · M3 Bevölkerung · Balancing-Befund und aufschiebbare Punkte aus dem Gesamt-Review

**Balancing (Ursprung: Gesamt-Review M3, Sonden im Scratchpad):** Mit den aktuellen `defs/`-Werten ist das
Erfolgskriterium der Spec (50 Bürger in einer Sitzung) wirtschaftlich nicht erreichbar, zeitlich schon
(Sonde mit unbegrenztem Geld: Sieg bei Tick ~1000).

- Steuer je Einwohner pro 100 Ticks minus Unterhalt der Versorgungskette je Einwohner: Pionier +1.0,
  Siedler −1.1, Bürger −2.9; dazu Kapelle 15 und Schule 25 fix. Jede Stufe über Pionier ist dauerhaft defizitär.
- 60 Bürger brauchen ~46 Produktionsgebäude (14 Fischer, 9 Schäferei/Weberei, 9 Zuckerrohr/Brennerei),
  weil der Verbrauch (0.5/0.25/0.25) hoch ist gegenüber dem Ausstoss (2.5/2/2 je 100 Ticks je Gebäude).
- Werkzeug ist nur kaufbar (≈6000 Geld für 150 Stück); Startgeld 5000; Sonde mit realem Startgeld war
  bei Tick ~500 negativ.
- Einziger positiver Produzent: Holzfäller (Holz verkaufen).

**Einschätzung:** Strukturelle Lücke (~5× Startgeld), kein Sim-Fehler. M4 Task 3 wird als Design-Pass mit
Kurz-Spec geführt (Kandidaten: Steuersätze Siedler/Bürger ×3–5, Verbrauch senken oder Ausstoss erhöhen,
Werkzeugproduktion oder billigeres Werkzeug, Unterhalt der Luxusketten senken). Spec-Tabellen nachführen.

**Erledigt in M4 Task 3, Werte siehe balancing-design.md** (`docs/superpowers/specs/2026-09-30-balancing-design.md`;
übernommen: Eskalationsstufe Steuer 7/14, Verbrauch Stoff/Rum 0.2; Nachweis `tests/sim/balance.test.ts`:
50 Bürger bei Tick 5950, Geld am Ende 176).

**Aufschiebbar (Ursprung: Gesamt-Review M3):**

- Aufstieg prüft „≥ 1 Einheit im Lager", reserviert sie aber nicht: zwei Häuser können im selben
  Wachstums-Tick aufsteigen, eines schrumpft danach sofort. Option: `tryUpgrade` entnimmt die Einheit.
- HUD zeigt Steuern und Unterhalt, aber keine Nettozahl (Spec 2.8 „Bilanz"); M4 Task 4.
  **Erledigt in M4:** Kopfzeile zeigt „Steuern +T · Unterhalt −U = ±B / 100 Ticks" (eigenes Feld `net`, negativ hervorgehoben; `src/ui/hud.ts`).
- Spec 3.2 nennt `economy.ts` für Steuern; tatsächlich `population.ts` (ADR-005). Doku-Pass M4.
  **Erledigt in M4:** Modulliste in Spec 3.2 nachgeführt (inkl. `supply.ts`, `defs/timing.ts`, `ui/storage.ts`).
- Frisch aufgestiegenes Haus zahlt in derselben 100er-Buchung halbe Steuer (neue Bedürfnisse noch offen).
- `SERVICE_BUILDING`, `GROWTH_INTERVAL`, `UPGRADE_WAIT` gehören nach `defs/` (M4 `timing.ts`).
  **Teilweise erledigt in M4:** `GROWTH_INTERVAL` und `UPGRADE_WAIT` liegen in `defs/timing.ts`; `SERVICE_BUILDING` (Zuordnung Dienst → Gebäude, kein Zahlenwert) steht weiter in `population.ts`.
- MkDocs ist der CAS-Default für Projektdoku, würde hier aber eine Python-Abhängigkeit einführen;
  bewusst nicht in M4, Markdown-Doku mit `docs/index.md`. Nachrüsten auf Wunsch trivial.

## 2026-09-30 · `tests/sim/balance.test.ts` · Balancing-Marge und Controller-Empfindlichkeit

**Beobachtung:** Mit den Primärwerten 6/12 erreichte die Skript-Kolonie 50 Bürger erst bei Tick 8650
(Grenze 9000). Das Ergebnis hing an der Strategie: Überschussverkauf erst ab 90 statt 50 Einheiten → 45 Bürger,
ohne Schulbau-Budget → 17 Bürger. Deshalb wurde die Eskalationsstufe 7/14 übernommen: Sieg bei Tick 5950, der Test
verlangt jetzt Sieg bis Tick 7500. Geld-Minimum im Lauf bleibt knapp (2).
Zweiter Treiber: Zwei Häuser steigen im selben Wachstums-Tick zu Bürgern auf, die Rumkette reicht nur für
eines; das zweite schrumpft auf 1 Einwohner und bleibt dort lange (siehe Aufstiegs-Reservierung oben).
**Ursprung:** M4 Task 3 (Balancing-Durchlauf), Implementierer und Review.
**Einschätzung:** Mit 7/14 erfüllt, Eskalationsregel ausgeschöpft. Beim Playtest beobachten; weitere Änderungen
nur über eine neue Kurz-Spec.

## 2026-09-30 · M4 Persistenz · Aufschiebbare Befunde aus dem Gesamt-Review

- **Spielstand-Validierung lückenhaft:** `deserialize` prüft weder `seed` noch die `defId` des Kontors noch
  die Kachelfelder. Nicht fatal, vom Gesamt-Review nachgezeichnet.
  **Ursprung:** M4 Gesamt-Review. **Einschätzung:** bei Bedarf nachrüsten, etwa wenn Spielstände extern entstehen.
- **Laden setzt Zustand zurück:** Laden stellt die Geschwindigkeit auf 1× und zentriert die Kamera neu
  (Nebeneffekt von `restart` → `startGame`). **Ursprung:** M4 Gesamt-Review. **Einschätzung:** kosmetisch.

## 2026-09-30 · Playtest des Nutzers (Pages-Build)

**Beobachtung:** Alles funktioniert soweit, Grundlage ist tragfähig. Es fehlen Tiefe, Dynamik, Ambiente und
Quality-of-Life; das Spielerlebnis soll verbessert werden.
**Ursprung:** Nutzer-Playtest nach M4.
**Einschätzung:** Kein Fehler, sondern Richtung für die nächste Phase (M5+): Erlebnis-Design als eigenes
Brainstorming mit Spec, nicht als Einzelmassnahmen.

## 2026-09-30 · Studio-Setup · Aufschiebbare Befunde aus Reviews und Probelauf

- **Vordergrund-`sleep` gesperrt:** Claude Code blockiert einen nackten Bash-Aufruf `sleep N`
  („standalone sleep"). Briefings, die Wartezeiten verlangen, brauchen `python3 -c "import time; …"`
  oder den Monitor-Mechanismus. **Ursprung:** Probelauf 1 (der Arbeiter hat die Sperre korrekt nicht
  umgangen). **Einschätzung:** Hinweis bei Bedarf in `templates/briefing.md` aufnehmen.
- **Eigene Session im Dashboard:** Nach dem Merge protokollieren die Hooks jede Session im Repo, auch
  Setup- oder Wartungssessions; diese erscheinen als „neueste" Session. Mit `?session=<id>` lässt sich
  eine bestimmte Session verlinken. **Ursprung:** Probelauf 2. **Einschätzung:** so gewollt (jede
  Hauptsession ist L0); bei Bedarf Filter „nur Sessions mit Leads".
- **Bind bei jeder Erwähnung von `log.py`:** Der Hook erzeugt ein bind-Event für jeden Bash-Aufruf, der
  `tools/studio/log.py` enthält (auch `cat`), eine leere Rolle überschreibt dann `agent_type`.
  **Ursprung:** Review Task 1. **Einschätzung:** harmlos, das Modell ignoriert binds ohne Rolle.
- **Zeitformate:** Feed-`ts` ist UTC, Chronik-`ts` lokal mit Offset; das Dashboard nutzt überall `t`.
  **Ursprung:** Review Task 2. **Einschätzung:** kosmetisch.
- **Entscheid erneut gesendet:** Ein `log.py decision` mit bestehender ID öffnet einen gelösten Entscheid
  wieder. **Ursprung:** Review Task 2. **Einschätzung:** akzeptiert, bei Bedarf dokumentieren.
- **Verdrängter FIFO-Knoten (geparkt, R17):** Fehlt das `spawned`-Event eines Arbeiters, behält ein falsch
  zugeordneter Knoten fremde Attribute. **Ursprung:** Re-Review Task 2. **Einschätzung:** tritt nur bei
  verlorenen Hook-Events auf.
- **Rückfrage eines Leads erscheint als „fertig":** Gibt ein Lead Fragen an L0 zurück, endet er (Status
  `done`) statt `waiting`. **Ursprung:** Review Task 7. **Einschätzung:** die Ansicht „Offene Entscheide"
  deckt es ab.
- **Server-Tests brauchen ~5 s:** Jeder Test fährt einen echten Server hoch und herunter.
  **Ursprung:** Task 2. **Einschätzung:** unkritisch; bei Wachstum `poll_interval` beim Herunterfahren senken.

## 2026-09-30 · `docs/studio/gates.md` · Gate Spec ohne Variante für Studio-Specs

**Beobachtung:** Die Prüffragen von Gate Spec sind auf Spielcode zugeschnitten (Balancing,
Save-Format); für Studio-Specs fehlt eine Variante.
**Ursprung:** Gate Spec Session 1.5 (`lead-qa`).
**Einschätzung:** Kandidat für ein Experiment des Studio-Coachs.

## 2026-09-30 · Studio-Telemetrie (`tools/studio/model.py`) · inaktiv-Vorfälle abgebrochener Sessions

**Beobachtung:** Endet eine Session ohne SessionEnd-Event (Abbruch, Absturz), bleiben ihre Knoten
lebend; nach 5 Minuten entstehen `inaktiv:`-Vorfälle, die im nächsten Start-Kontext als fällige
Retro erscheinen.
**Ursprung:** Final-Review Session 1.5.
**Einschätzung:** Vor einem Neustart `make studio-archive` ausführen (steht in der
state.md-Übergabe); ein automatisches Schliessen verwaister Sessions wäre eine spätere Verbesserung.

## 2026-09-30 · `src/sim/population.ts` `tryUpgrade` · Aufstieg entnimmt die Ware nicht

**Beobachtung:** Beim Aufstieg eines Hauses wird die Ware im Lager nur geprüft, nicht entnommen;
zwei Häuser können auf dieselbe Einheit aufsteigen.
**Ursprung:** Probelauf Session 1.5 (autonome Session im isolierten Klon, `lead-tech` M5-01).
**Einschätzung:** Echter Spiellogik-Fehler. Ein ungeprüfter Fix-Entwurf mit Regressionstest liegt
lokal unter `.studio/handoffs/2026-09-30-probelauf-m5-01-aufstieg.patch`; Review-Befund dazu: die
entnommene Einheit als ausgeliefert zählen, sonst doppelter Verbrauch.
