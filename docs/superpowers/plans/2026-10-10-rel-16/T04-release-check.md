# T04 · Release-Check REL-16 im Browser (`qa-playtester`)

Strang `ui` · Kandidat REL-16 (`.worktrees/integrate`, nur lesen) · Prüfer `qa-playtester` (sonnet), gestartet im Release-Lauf durch `lead-qa` (Ein-Paket-Release: Gate Merge Release und Release-Check in einem `lead-qa`-Start, R444/R429; Index E2) · AK-R16-08…10 · blocked-by T03, Kandidat gebaut · Grösse S (1 Lauf, Wanduhr-Limit 30 min, `.studio/qa/REL-16/stand.md` nach jedem Schritt)

**Ziel:** Das Schild nennt Gelände und Belegung an der Zielkachel, der Klick meldet dasselbe, Neustarts hinterlassen keine Inselmenü-Listener; Standard-Smoke grün. Kein Code ändern; Befunde an `lead-qa`.

**Rahmen:** `tools/render-qa/sitzung.mjs` (`session({ root: <Kandidat>, seed: 7, w, h, dpr: 1, port: 5291, prep })`), echte CDP-Mausereignisse, Fenster **1280 × 720 und 1920 × 1080**. Studioweit ≤ 2 Browser zugleich (R424), vor und nach dem Lauf `pgrep -fl "Chrome|chromium"` und `uptime`. Ablage `.studio/qa/REL-16/`, Namensschema **`<fall>-<B>x<H>.png`** (AK-TB3-19; nie ohne Grösse, sonst überschreibt der zweite Lauf den ersten). Wegwerf-Skript nur unter `.studio/qa/REL-16/`.

**Lehre aus REL-15 (Index, Befund Geisterbau):** Pixelkoordinaten **nach jeder Kamerabewegung neu messen** (`window.__inselDev.tileCenter(x, y)` liefert Seitenkoordinaten der Rautenmitte). Kein Ziehen mit dem Auswahl-Werkzeug zwischen Messung und Prüfung; Zielkachel im Bericht immer mit Kachelkoordinaten nennen.

DOM-Sonden: Schild `document.querySelector('.cursor-hint')` (`hidden`, `textContent`), Meldung des Klicks: die sichtbare Fehlermeldung (Toast) im `#game` (Text auslesen, Selektor im Kandidaten per `grep -n "showError" src/ui/*.ts` bestimmen), Welt `window.__inselDev.world()`.

## Szene (prep, Seed 7)

Wie `.studio/qa/REL-15/ui/t06.mjs`: Häuser per `placeBuilding(w, 'house', x, y)` ab Ring 3 um den Kontor; erwartet u. a. Haus auf (39, 35). Festwerte aus der Planungsprobe: (38, 35) = Gebirge, (39, 35) = Haus. Wasserkachel: im prep die erste Kachel mit `terrain === 'water'`, die an Land grenzt, im Umkreis 8 des Kontors suchen und in `globalThis` ablegen. Wegkachel: `placeRoad` auf eine freie Wiese neben dem Haus. Kamera per `window.__inselDev.setZoom(1); centerOn(39, 35)`, 1,5 s warten, dann erst messen.

## Schritte (je Fenstergrösse)

- [ ] **Schritt 1: Gebirge (AK-R16-08).** Werkzeug Wohnhaus (Taste H), Zeiger auf `tileCenter(38, 35)`: Schild „Kein Bauland: Gebirge“ → `gebirge-haus-<B>x<H>.png`. Werkzeug Weg (R), gleiche Stelle: derselbe Text → `gebirge-weg-<B>x<H>.png`.
- [ ] **Schritt 2: Wasser.** Wohnhaus-Werkzeug auf die Wasserkachel: „Kein Bauland: Wasser“ → `wasser-<B>x<H>.png`.
- [ ] **Schritt 3: Belegt.** Wohnhaus-Werkzeug auf `tileCenter(39, 35)`: „Platz belegt: Wohnhaus“ → `belegt-haus-<B>x<H>.png`; Weg-Werkzeug auf die Wegkachel: „Platz belegt: Weg“ → `belegt-weg-<B>x<H>.png`.
- [ ] **Schritt 4: Klick (AK-R16-09), nur 1280 × 720.** In Schritt 1 und 3 je einmal klicken (Drücken und Loslassen an derselben Stelle): Meldung = Schildtext, Anzahl Gebäude und Geld unverändert (vorher/nachher aus `world()` berichten) → `klick-gebirge-1280x720.png`, `klick-belegt-1280x720.png`.
- [ ] **Schritt 5: Leck-Probe (AK-R16-10).** `node tools/render-qa/seekarte.mjs --root <Kandidat> --size 1280x720 --dpr 1 --leck --out .studio/qa/REL-16/seekarte --port 5391; echo EXIT=$?` (nicht gleichzeitig mit dem eigenen Lauf auf 5291 starten, wenn schon ein anderer Browser läuft). Erwartet die Zeile mit „1 und 1“ und BESTANDEN.
- [ ] **Schritt 6: Smoke.** `node tools/render-qa/smoke.mjs --paket REL-16 --root <Kandidat>; echo EXIT=$?` → Exit 0; Bilder unter `.studio/qa/REL-16/smoke/` beurteilen (Standardschritte a–f, Menü).
- [ ] **Schritt 7: Konsole.** Keine Fehler oder Warnungen aus `src/` im ganzen Lauf (die `session` sammelt sie); eine Readback-Warnung aus der Seekarten-Probe getrennt ausweisen.

## Bericht (Playtest-Report, eigener Abschnitt für das UI-Häppchen UI-REL16)

Je Schritt und Grösse: OK/Befund, Kachelkoordinaten, Schildtext wörtlich, Screenshot-Pfad; Klick: Meldung und Weltwerte vorher/nachher; Leck-Zeile wörtlich; Smoke-Exit; Konsole; Chrome-Prozesse und `uptime` vor/nach. Urteil OK/BEDENKEN/ZURÜCK. Fehlt ein Screenshot, ist das blockend (Gate Merge Release, Prüfliste).
