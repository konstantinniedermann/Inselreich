# T06 · Browser-Check Haus-Panel und Cursor-Schild (`qa-playtester`)

Strang UI · Worktree `.worktrees/rel-15-ui` (nur lesen) · Prüfer `qa-playtester` (sonnet) · AK-Entwürfe A4, B5, B6 (`ak-entwuerfe.md`) · blocked-by T02 (Review OK)

**Ziel:** Im Haus-Panel steht der Mangel einmal und darunter die Abhilfe mit Verb; das Cursor-Schild weicht der Mouse-over-Karte und kommt beim Kachelwechsel zurück; beim Bauen gibt es nie eine Karte. Kein Code ändern; Befunde an den Controller.

**Rahmen:** Headless-Chrome über `tools/render-qa/sitzung.mjs` (`session({ root: <Worktree>, seed: 7, w, h, dpr: 1, port: 5291, prep })`), echte CDP-Mausereignisse (`Input.dispatchMouseEvent`), Fenster **1280 × 720 und 1920 × 1080**. Studioweit ≤ 2 Browser-Läufe zugleich (R424); T07 läuft parallel auf Port 5391, dieser Lauf auf **5291**. Vor und nach dem Lauf `pgrep -fl "Chrome|chromium"`. Screenshots und Bericht unter `.studio/qa/REL-15/ui/`. Wegwerf-Skript nur dort, nicht im Repo. Spielstand per `prep` (Seitenkontext, `w` = Welt) oder Dev-Hilfen `window.__inselDev` (`src/ui/devProbes.ts`).

DOM-Sonden: Schild `document.querySelector('.cursor-hint')` (`hidden`, `textContent`), Karte `document.querySelector('.hover-card')` (`hidden`), Panel `document.querySelector('#panel')` (`textContent`).

## Schritte

- [ ] **Schritt 1: Haus-Panel Dienst-Mangel (A4), nur 1280 × 720.** Siedlerhaus im Versorgungsradius, Nahrung und Stoff erfüllt, keine Kapelle (z. B. Wohnhaus nahe dem Kontor setzen und per `prep` auf Stufe 2 mit erfüllten Gütern bringen, wie `setHouse` in `tests/ui/worlds.ts`), Haus anklicken. Erwartet: Panel-Text enthält „Mangel: Kapelle fehlt“ **genau einmal** (Anzahl der Vorkommen im `textContent` zählen und berichten), die Abhilfe-Zeile `[data-field="remedy"]` lautet „Baue Kapelle (K) in Reichweite“, nirgends „fehlt:“. Screenshot `a4-dienst.png`. Wenn ohne Aufwand erreichbar: Nahrung fehlt → Abhilfe „Baue mehr Fischerhütte oder kaufe Nahrung am Kontor“, Screenshot `a4b-nahrung.png`.

- [ ] **Schritt 2: Schild → Karte → Schild (B5 = AK-R15-09), je Grösse.** Ausdrücklich zu bestätigen (R437 B5): beim Kachelwechsel ist das Schild im selben Frame wieder da (Karte `hidden` und Schild sichtbar im ersten Frame nach dem Wechsel, per `requestAnimationFrame`-Probe oder ≤ 1 Frame Wartezeit). Auswahl-Werkzeug (Esc), Zeiger per `mouseMoved` auf die Mitte eines Wohnhauses.
  - nach ≈ 100 ms: Schild sichtbar (`hidden === false`, Text mit Hausname), Karte `hidden === true` → `b5-<grösse>-1-schild.png`
  - nach weiteren ≥ 500 ms ohne Bewegung: Karte sichtbar, Schild `hidden === true` → `b5-<grösse>-2-karte.png`
  - kleine Bewegung um 2 px innerhalb derselben Kachel: Karte bleibt, Schild bleibt aus (Review Focus 2)
  - Zeiger auf die Nachbarkachel (eine Kachel weiter, z. B. + 64 px in x bei Zoom 1), nach ≤ 100 ms: Schild sichtbar, Karte `hidden === true` → `b5-<grösse>-3-wechsel.png`
  - Ziehen (Maustaste gedrückt, Bewegung) bei offener Karte: Karte weg, Schild da (Zustand berichten).

- [ ] **Schritt 3: Bauen ohne Karte (B6), 1280 × 720.** Bauwerkzeug Wohnhaus (Taste H) oder Weg (R), Zeiger ≥ 1 s ruhig über einem bestehenden Haus: Karte bleibt `hidden`, Schild sichtbar und Text unverändert gegenüber dem ersten Frame → `b6-bauen.png`.

- [ ] **Schritt 4: Dialog (B6, Gate-Entscheid E5), 1280 × 720.** Mit Auswahl-Werkzeug Karte erscheinen lassen, dann „Menü“ öffnen (Taste oder Knopf): Schild und Karte beide `hidden`. Menü mit `Esc` schliessen, Zeiger wieder über das Haus bewegen: zuerst nur das Schild, nach ≥ 400 ms nur die Karte. Zustände berichten, Screenshot `b6-dialog.png`.

- [ ] **Schritt 5: Konsole.** Keine Fehler oder Warnungen aus `src/` während des ganzen Laufs (`session` sammelt sie).

## Bericht (Playtest-Report)

Je Schritt und Grösse: OK/Befund mit Screenshot-Pfad, die gemessenen `hidden`-Werte und Wartezeiten wörtlich, Zählung „Mangel: Kapelle fehlt“, Konsole, Chrome-Prozesse vor/nach dem Lauf. Urteil OK/BEDENKEN/ZURÜCK.
