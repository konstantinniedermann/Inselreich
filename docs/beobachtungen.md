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
