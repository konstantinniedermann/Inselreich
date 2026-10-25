# T07 · Browser-Check Seerecht (`qa-playtester`)

Prüfer `qa-playtester` · ≈ 30 Tools · AK-SR-22 bis AK-SR-24 · blocked-by: T06 · Stand `feat/seerecht` in `.worktrees/seerecht` · Screenshots `.studio/qa/SEERECHT/` · ändert keine Datei im Repo

## Vorbereitung

- Dev-Server aus `.worktrees/seerecht` (`make help` → Start-Befehl), Headless-Chrome bei **1280 × 800** und **800 × 800**.
- Spielstand: Stufe 3 und Stufe 4 offen (`council` `{ 2: 'A', 3: 'open', 4: 'open' }`), ein Schiff fährt auf einer Route (Fernziel, `left` gross genug für vorher/nachher). Erzeugung wie in bisherigen Playtests (Speicherstand in `localStorage` aus einer Testwelt; Lade-Werkzeug TOOL-LOADSNAP, falls auf main). Weg im Report nennen.

## Prüfschritte

1. **AK-SR-22** (1280 px): Rats-Karte öffnen (`Umschalt + R` oder Marke «Rat · 2»). Stufe 3 zwei Karten, Stufe 4 **drei Karten nebeneinander** (Glasrecht, Hofrecht, Seerecht), Namen und Texte voll lesbar, «25 %» und «80» sichtbar, kein horizontales Scrollen, Kopfzeile einzeilig, Satz «… die übrigen Beschlüsse der Stufe verfallen.» sichtbar. Screenshot `22-drei-karten.png`; nur Stufe 4 offen: `22-nur-stufe4.png`.
2. **AK-SR-23** (800 px): Rats-Karte öffnet, keine Konsolenfehler (Konsole-Log im Report), Umbruch erlaubt. Screenshot `23-schmal.png`.
3. **AK-SR-24**: Spiel pausieren; Screenshot des fahrenden Schiffs `24-vorher.png`; Seerecht wählen, «Beschluss fassen»; Screenshot `24-nachher.png` (Schiff ohne sichtbaren Sprung). Inselkarte (Hover über die Zielinsel) zeigt die kürzere Fahrzeit (vorher/nachher-Text im Report), Liste «Stufe 4: Seerecht». Fortsetzen, Schiff fährt weiter und kommt an (Screenshot `24-ankunft.png`).
   3a. **Fernkarte in der Pause (R828 N3):** Stand mit laufendem Fernauftrag bzw. Fernangebot auf eine Insel, deren Rest knapp über 8 × d und unter 10 × d liegt (Weg im Report). In der Pause vor dem Beschluss: Fernkarte/Seekarte zeigt «≈ … Fahrt» mit 10er-Zeit und die Marke «· zu spät»; nach «Beschluss fassen» **ohne Fortsetzen**: «≈ … Fahrt» mit 8er-Zeit, «zu spät» verschwunden, Tooltip der Marke nennt die kürzere Fahrzeit. Screenshots `24-fern-vorher.png`, `24-fern-nachher.png`. Bleibt der alte Text bis zum nächsten Tick stehen: BEDENKEN mit Screenshot (Review Focus 1).
4. Gegenprobe: Stufe 3 beschliessen rechnet nichts um (Inselkarte gleich).

## Definition of Done

Browser-Check je AK mit Screenshot; ändert keine Datei, daher kein Test- oder Lint-Lauf nötig. Vorab im Baum Teilbeleg grün (T06: `npx tsc --noEmit`, `make lint`, gezielte Tests); kein `make check` (R858, R860).

## Bericht

Playtest-Report als Schlussbericht: je AK OK/BEDENKEN/ZURÜCK mit Screenshot-Pfad; Konsolenfehler wörtlich.
