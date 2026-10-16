# T04 · Szenen-Helfer `tools/render-qa/seekarte.mjs`

Strang See · Worktree `.worktrees/rel-15-see` · Branch `fix/rel-15-see` · Umsetzer `tech-ui-engineer` (sonnet, Fortsetzung des T03-Umsetzers per SendMessage) · AK-Entwurf C5 (`ak-entwuerfe.md`) · blocked-by T03 (Review OK)

**Ziel (Gate-Entscheid E3):** Seekarten-Checks werden wiederholbar. Der ungetrackte Aufbau `.studio/qa/REL-12/seekarte.mjs` (200 Zeilen, absolute Pfade) wird ein versionierter Helfer im Stil von `proben.mjs`/`smoke.mjs`; dazu die Leck-Probe aus T03.

**Files (nur diese):**

- Create: `tools/render-qa/seekarte.mjs`
- Modify: `tools/render-qa/README.md` (Tabelle „Skripte“, eine Zeile nach `smoke.mjs`)
- Lesen (Vorlage, nicht ändern): `.studio/qa/REL-12/seekarte.mjs` im Hauptcheckout, `tools/render-qa/sitzung.mjs`, `tools/render-qa/proben.mjs`

**Interfaces:** Consumes `cli`, `session`, `sleep`, `defaultRoot` aus `./sitzung.mjs` (relativer Import, keine absoluten Pfade); `session(...)` liefert `a.ev(expr)`, `a.send(method, params)`, `a.shot(file)`. Produces das CLI unten; Exit 0 bestanden, 1 Prüfung fehlgeschlagen, 2 Aufruffehler (`cli` liefert 2 schon).

## CLI (Hilfetext wörtlich als `HELP`)

```text
seekarte.mjs — Szene Seekarte: Kontor auf Insel 1, zwei Schiffe, Route 0<->1, ein Schiff im Hafen; Screenshots der offenen Karte.
Aufruf: node tools/render-qa/seekarte.mjs [--root <wurzel>] [--seed 7] [--size 1280x720,1920x1080] [--dpr 1,2] [--out <ordner>] [--port 5291] [--leck] [--help]
  --root   Arbeitsstand (Standard: Repo-Stamm des Skripts).
  --seed   Seed der Karte (Standard 7).
  --size   Fenstergrössen, kommagetrennt (Standard 1280x720,1920x1080).
  --dpr    Gerätepixel-Verhältnisse, kommagetrennt (Standard 1,2).
  --out    Ausgabeordner (Standard <root>/.studio/qa/seekarte).
  --port   Vite-Port (Standard 5291); Chrome-Port = Port + 4000. Zwei Läufe zugleich brauchen verschiedene Ports.
  --leck   zusätzlich: Inselmenü-Listener am document vor und nach zweimal „Neue Insel“ zählen (Soll: 1 und 1).
Ausgabe: seekarte-<B>x<H>-dpr<d>.png je Kombination, seekarte.txt (Zeilen BESTANDEN/NICHT BESTANDEN, Konsolenmeldungen).
Kein Messlauf: keine Lastsperre.
```

`cli({...}, HELP, { gate: false })` (Szenenaufbau, keine Messung; wie `smoke.mjs`).

## Schritte

- [ ] **Schritt 1: Rot**

Run: `node tools/render-qa/seekarte.mjs --help; echo EXIT=$?`
Expected: „Cannot find module …“, `EXIT=1`.

- [ ] **Schritt 2: Skript anlegen**

Kopf: `/* global process, console */` und ein Satz Zweck. Aufbau:

1. Argumente lesen; `--size` in `[w, h]`, `--dpr` per `numList`.
2. Je Grösse × dpr ein `session({ root, seed, w, h, dpr, port, prep: PREP }, async (a) => { … })`.
3. `PREP` aus der Vorlage übernehmen (Geld 200 000, Lager Heimat 500 je Gut, `findKontorSite` + `placeBuilding(w, 'kontor2', site.x, site.y, 1)`, zweimal `buyShip`, `setRoute(w, w.ships[0].id, { a: 0, b: 1, ab: [{ good: 'wood', reserve: 0 }], ba: [] })`) und **zusätzlich** dieselbe Route für `w.ships[1]`, damit ein Schiff mit Route im Hafen liegen kann. Ergebnis jeder Aktion per `console.log('PREP', …)`; `r.ok === false` → Zeile NICHT BESTANDEN.
4. In der Sitzung: Tempo-Knopf „⏸“ in `.hud-speed` klicken (Schiffe stehen), dann prüfen, dass mindestens ein Schiff mit Route `to === null` hat (Hafen); sonst NICHT BESTANDEN „Szene ohne Hafenschiff“.
5. Knopf `[data-field="islands"]` per echtem CDP-Klick (Vorlage `clickAt`) öffnen; `.island-pop` sichtbar → BESTANDEN „Karte offen“. Screenshot `seekarte-<w>x<h>-dpr<d>.png`.
6. Prüfzeile Marke: im Seitenkontext `mapLayout` aus `/src/render/seaMap.ts` mit `canvas.width/height` und `12 * dpr` rechnen, Anker der Heimat und von Insel 1 per `tileToMap(…anchor + 0.5)` in Leinwand-Pixel, Pixel der Leinwand bei `(x, y − (DOT_R + 1) * dpr − MARK * dpr / 2)` per `getImageData` lesen: Farbe ≈ `COLORS.kontor` (je Kanal ≥ 230) → BESTANDEN „Marke sichtbar Insel i“.
7. Bei `--leck` (nur in der ersten Kombination): Zählfunktion

```js
const menuListeners = async (a) =>
  (
    await a.send('Runtime.evaluate', {
      expression:
        "getEventListeners(document).pointerdown.filter((l) => String(l.listener).includes('box.contains')).length",
      includeCommandLineAPI: true,
      returnByValue: true,
    })
  ).result.value;
```

Ablauf: Zahl `n0` lesen (Soll 1; 0 → NICHT BESTANDEN „Probe greift nicht“). Zweimal: Knopf „Menü“, Auswahl „Freischaltung für die neue Insel“ auf `all` setzen (`select[aria-label="Freischaltung für die neue Insel"]`, `value = 'all'`, `change`-Ereignis), Knopf „Neue Insel“, Knopf „Ja, neue Insel“; warten, bis `.hud-row` wieder da ist und `__inselDev.world()` eine andere Welt ist (Seed oder Objekt). Dann `n2` lesen: `n2 === 1` → BESTANDEN „kein Listener-Leck (n0, n2)“, sonst NICHT BESTANDEN mit beiden Zahlen. Danach in der neuen Insel „Inseln“ öffnen, `Escape` schliesst, erneut öffnen, Klick daneben schliesst → je eine Zeile.

8. Konsolenmeldungen der Sitzung (Fehler, Warnungen) in `seekarte.txt`; jede Meldung aus `src/` → NICHT BESTANDEN.
9. Am Ende `process.exitCode = fehlschlaege > 0 ? 1 : 0`.

Hilfsfunktionen `mouse`, `clickAt`, `key` aus der Vorlage übernehmen (Prettier-Format). Keine absoluten Pfade; Ausgabeordner per `mkdirSync(out, { recursive: true })`.

- [ ] **Schritt 3: Lauf gegen den Worktree** (Browser-Lauf mit festen Ports **5491** (Hauptlauf) und **5591** (Gegenprobe), R437 B2: 5291 gehört T06, 5391 T07; vorher `pgrep -fl "Chrome|chromium"`; studioweit ≤ 2 zugleich)

Run: `node tools/render-qa/seekarte.mjs --help; echo EXIT=$?` → Hilfetext, `EXIT=0`
Run: `node tools/render-qa/seekarte.mjs --size 1280x720 --dpr 1 --leck --port 5491 --out .studio/qa/REL-15/t04; echo EXIT=$?` → alle Zeilen BESTANDEN, `EXIT=0`
Gegenprobe Leck (zeigt, dass die Probe greift): `node tools/render-qa/seekarte.mjs --root <Hauptcheckout> --size 1280x720 --dpr 1 --leck --port 5591 --out .studio/qa/REL-15/t04-main; echo EXIT=$?` → Zeile „Listener-Leck“ NICHT BESTANDEN (gemessen: n0 = 2, n2 = 4), `EXIT=1` (erwartet; `main`-Stand ohne T03). Hinweis: der Hauptcheckout hat das Skript nicht; `--root` zeigt nur, wessen Vite und Quellen geladen werden, das Skript läuft aus dem Worktree.

- [ ] **Schritt 4: README-Zeile** in `tools/render-qa/README.md`, Tabelle „Skripte“ nach `smoke.mjs`:

`| \`seekarte.mjs\` | Szene Seekarte (Kontor auf Insel 1, Schiffe, Route, Hafenschiff), Screenshots je Grösse und dpr, Prüfzeile Kontor-Marke; \`--leck\` zählt die Inselmenü-Listener vor/nach zwei Neustarts | \`node tools/render-qa/seekarte.mjs [--size 1280x720] [--dpr 1,2] [--leck] [--port 5291]\` |`

(Tabelle danach mit `npx prettier --write tools/render-qa/README.md` ausrichten.)

- [ ] **Schritt 5: Lint und Commit**

Run: `make lint; echo EXIT=$?` → `EXIT=0`

```bash
git add tools/render-qa/seekarte.mjs tools/render-qa/README.md
git commit -m "feat: Szenen-Helfer Seekarte mit Leck-Probe (tools/render-qa, UI-SEEKARTE-NACHZUG)"
```

Präfix `feat:` (neues Werkzeug); Screenshots unter `.studio/qa/` werden nicht committet.

## Abnahme für den Review

- Keine absoluten Pfade, relativer Import von `./sitzung.mjs`, `--help` ohne Browser.
- Beleg im Bericht: beide Läufe mit Exit-Code und den Zeilen BESTANDEN/NICHT BESTANDEN.
