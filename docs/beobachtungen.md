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
- Toasts stapeln sich unbegrenzt bei Klick-Spam; Touch-Bedienung nur teilweise (kein Pinch, Werkzeuge ohne Pan).
- `#panel` ist bis M2 eine leere Karte.
- `startGame` fängt einen möglichen `throw` aus `createWorld` (50 Seeds ohne gültige Insel) nicht ab; praktisch unerreichbar.

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
- **Handelsbuttons** sind bei Geldmangel nur deaktiviert, ohne Grund; `'Kein Geld'` aus `buy()` ist so vom UI aus unerreichbar. Konsistent zur Bauleiste wäre „klickbar + Toast".
- **Refund-Text nominal:** zeigt `refundCost`, obwohl `grantRefund` am Lagerlimit kappt; Verlust ist beabsichtigt, Anzeige könnte das andeuten.
- **BFS-Richtungsarray** wird je Iteration alloziert (`roads.ts`); bei 64×64 unerheblich.
- **`refresh()` je Weg-Kachel während Drag** (statt 10-Frame-Takt); drei billige textContent-Vergleiche.
- **`sell` ignoriert Rückgabe von `takeStock`**, `buy` die von `addStock` — nach den Vorprüfungen sicher, per Kommentar dokumentiert.
- **Nach Deserialisierung (M4)** `recomputeConnectivity` aufrufen statt persistiertem `connected` zu vertrauen.
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
- Spec 3.2 nennt `economy.ts` für Steuern; tatsächlich `population.ts` (ADR-005). Doku-Pass M4.
- Frisch aufgestiegenes Haus zahlt in derselben 100er-Buchung halbe Steuer (neue Bedürfnisse noch offen).
- `SERVICE_BUILDING`, `GROWTH_INTERVAL`, `UPGRADE_WAIT` gehören nach `defs/` (M4 `timing.ts`).
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
