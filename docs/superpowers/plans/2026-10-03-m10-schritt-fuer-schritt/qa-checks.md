> **Task-ID:** QA-Checks im Browser (qa-playtester)
> **AK-IDs:** AK-Browser-Teile, siehe Tabelle unten und abdeckung.md
> **blocked-by:** je Check: der genannte Task-SHA
> **Gemeinsame Regeln:** [index.md](index.md) (Global Constraints) · Orga: [orga-14-qa-uebersicht.md](orga-14-qa-uebersicht.md)

## QA-Checks im Browser (`qa-playtester`, Screenshots unter `<Hauptrepo>/.studio/qa/M10-<Check>/`)

**Gemeinsame Vorbereitung** (je Check eigener `$QA`, eigene Ports aus der Übersicht; Worktree am geprüften SHA):

```bash
QA=/Users/KN/CAS/projekte/anno-clone/.studio/qa/M10-QA-U1          # bzw. -QA-U2, -QA-U3, -QA-U4, -QA-ART
mkdir -p "$QA/saves"
cd /Users/KN/CAS/projekte/anno-clone/.worktrees/m10-qa
SCENARIO_OUT="$QA/saves" npx vitest run tests/sim/scenario-saves.test.ts
ls "$QA/saves" | grep -c '^m10-'                                   # 14 (7 × .json + 7 × .probes.json)
npx vite --port 5191 --strictPort > "$QA/vite.log" 2>&1 &         # Port je Check
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --remote-debugging-port=9241 \
  --user-data-dir="$QA/chrome-prof" about:blank > "$QA/chrome.log" 2>&1 &
```

- **Laden eines Szenarios** (wie M8 QA-B): Seite `http://127.0.0.1:<Port>/` offen, per CDP
  `localStorage.setItem('inselreich.save.v1', <Inhalt von "$QA/saves/<name>.json">)`,
  `localStorage.removeItem('inselreich.save.auto')`, neu laden, „Gespeichertes Spiel laden (Spielzeit …)" klicken; das
  Spiel steht pausiert. Viewports per `Emulation.setDeviceMetricsOverride` 1280 × 800 und 1920 × 1080 (DPR 1, für
  AK-R1-03 zusätzlich DPR 2).
- **Feste Koordinaten:** Kachelkoordinaten nur aus der Tabelle „Feste Prüfpunkte" (Task 5); vor jedem Klick
  `window.__inselDev.centerOn(x, y)`, dann Klick bzw. `mouseMoved` auf `window.__inselDev.tileCenter(x, y)` (CSS-Pixel).
  Gleich zu Beginn wird geprüft, dass `"$QA/saves/<name>.probes.json"` genau diese Koordinaten enthält; weicht eine
  ab, gilt die Datei, und der Check meldet die Abweichung.
- **Welt-Werte:** `window.__inselDev.world()` (nur lesen). Reine Texte zum Vergleich über das Vite-Modul derselben
  Seite, z. B. `(await import('/src/ui/guide.ts')).taxEffect('normal')`.
- **Gemessen** wird per `textContent` bzw. `aria-label` eines `data-field`, Zählung per `querySelectorAll` ohne
  `hidden`, Überlauf per `scrollWidth ≤ clientWidth`. Konsolenfehler: Soll 0 je Check. Kein sichtbarer Text mit „Tick".
- **Bericht** `report.md` nach `docs/studio/templates/playtest-report.md`; je AK Messwerte und Screenshot; „blockend"
  = AK verfehlt, Absturz oder Konsolenfehler; Befunde ausserhalb M10 im Bericht (L0 trägt in `docs/beobachtungen.md`
  ein). Aufräumen: Chrome und Vite beenden, `lsof -i :<Ports>` leer, `rm -r "$QA/chrome-prof"`, QA-Worktree entfernen.

### QA-U1 (W4b, am Merge-SHA Task 6 + Task 5)

1. **AK-U1-01** (`m10-start`, 1280 × 800 und 1920 × 1080): Hauptleiste enthält Knöpfe mit `aria-label` „Weg · 5 Geld"
   und „Abriss", keinen mit „Roden"; sichtbare `[data-category]` genau „Wohnen", „Produktion"; „Wohnen" → 1 Eintrag,
   „Produktion" → genau `[data-key="Fischerhütte · 100 Geld"]`, `[data-key="Holzfäller · 50 Geld"]`. Screenshots
   `u1-01-1280.png`, `u1-01-1920.png`.
2. **AK-U1-02** (`m10-start`): Geld notieren; Taste `k` → Werkzeug bleibt „Auswahl", genau ein `.toast.error` mit
   `textContent` „Kapelle: Erst wenn ein Wohnhaus 4 Pioniere hat", Geld unverändert. `u1-02.png`.
3. **AK-U1-03** (`m10-start`): Menü öffnen, Tastenliste: keine Zeile mit Taste K, J, O, I.
4. **AK-U1-04** (`m10-start`): `.stock-row` Chips ohne `hidden` = 4, Namen Holz, Werkzeug, Stein, Nahrung.
5. **AK-U1-05** (`m10-start`): von `[data-field^=pop-]` nur `pop-1` sichtbar.
6. **AK-U1-06** (`m10-start`, 1280): Kontor (32, 31) anklicken → Handels-Panel mit genau den Zeilen Holz, Werkzeug,
   Stein, Nahrung; `#panel` `scrollWidth ≤ clientWidth`. `u1-06.png`.
7. **AK-U1-07** (`m10-siedler-fast`, 1×): vorher kein sichtbares `[data-field=order-text]`, `world().order !== null`;
   `[data-speed="1"]`, warten bis `world().tick ≥ 1550`, pausieren: Auftragskarte sichtbar, Text passt auf
   `/^Auftrag: \d+ \S+ · Prämie \d+ · noch /`, Restzeit = `due − tick` als Spielzeit. Zahl der `.toast` mit „Auftrag"
   = 0. `u1-07.png`.
8. **AK-U1-09** (`m10-pionier-fast-voll` Krisen „normal", dann `m10-siedler-fast`, je 1×): durch den Wachstumstakt
   laufen (Tick 100 bzw. 1550): genau ein neuer `.toast.info`, bleibend (nach 5 s noch da), Text U2 bzw. U3 wörtlich
   wie AK-U1-08, mit Knopf „Hilfe" (öffnet die Karte „Ziel und erste Schritte"); „Produktion" zählt danach 5 bzw.
   „Öffentlich" enthält „Amtsstube · 200 Geld". Menü „Speichern", Seite neu laden, Stand laden, 3 s bei 1×: keine
   Freischalt-Meldung, im Audio-Zustand (`window.__inselAudio`, M7-Sonde) kein neues `unlock`. `u1-09-a.png`, `-b.png`.
9. **AK-U1-10**: Menü → „Neue Insel", Freischaltung „Alles frei", Krisen „normal", starten: sichtbare Einträge
   „Infrastruktur" 1, „Wohnen" 1, „Produktion" 9, „Öffentlich" 5; 30 s Echtzeit bei 4× (= 2 Spielminuten): kein
   `.toast` mit „Neu". Seite neu laden, Menü → „Neue Insel": Auswahl steht auf „Alles frei".
10. **AK-U1-11** (1280 × 800; `m10-start`, `m10-amtsstube`, `m10-amtsstube-aus`): `.hud-tax` in `m10-start` und
    `m10-amtsstube-aus` `hidden`; in `m10-amtsstube` `[data-field=tax]` = „Steuer normal", Klick → `#panel` Titel
    „Amtsstube"; je Szenario `#hud` Höhe ≤ 84 und `scrollWidth ≤ clientWidth`. `u1-11-<szenario>.png`.
11. **AK-U1-13** (`m10-amtsstube-aus`, ohne Auswahl): `[data-field=rest-tax]` = `taxEffect('normal') + ' (keine Amtsstube)'`;
    Bilanz-Tooltip (Hover über `[data-field=balance]`) enthält „Steuer: normal (keine Amtsstube)".
12. **AK-S2-16 Taste I** (R164 QA 3): `m10-start` → Taste `i`: Werkzeug bleibt „Auswahl", `.toast.error`
    „Amtsstube: Erst mit den ersten Siedlern"; `m10-siedler-fast` bei 1× durch Tick 1550 (U3), dann Taste `i`:
    aktives Werkzeug ist die Amtsstube (Bau-Eintrag „Amtsstube · 200 Geld" `active`, Tooltip-Kopf „Amtsstube (I)").

### QA-U2 (W6, am Task-7-SHA; enthält R1)

1. **AK-U2-03** (`m10-start`, ohne Auswahl): `[data-field=help-hint]` = „Mehr in der Hilfe (?)".
2. **AK-U2-04** (`m10-start`, 1280 und 1920): in `.hud-sound` steht „Hilfe" vor „Einstellungen"; Klick, Taste `?`
   und Menü-Knopf „Hilfe" öffnen dieselbe Karte (Titel „Hilfe", sechs `[data-field^=help-]` in der Reihenfolge
   `help-now`, `help-next`, `help-goal`, `help-tips`, `help-signs`, `help-steps`); Esc schliesst, `document.activeElement`
   ist wieder der Öffner; bei offener Karte wählt Taste `h` kein Werkzeug; Karte `scrollWidth ≤ clientWidth`; `#hud`
   ≤ 84 bei 1280. `u2-04-1280.png`, `-1920.png`.
3. **AK-U2-05**: `m10-start` → `help-next` genau „Marktplatz — sobald 20 Wohnhäuser stehen (jetzt 0 / 20)" und
   „Steinbruch, Schäferei, Weberei, Kapelle, Feuerwache, Roden, Aufforsten — sobald ein Wohnhaus 4 Pioniere hat (jetzt 0 / 4)";
   `m10-pionier-fast-voll` bei 1× durch Tick 100 → dort steht „Amtsstube, Handelsaufträge — sobald die ersten Siedler
   einziehen".
4. **AK-U2-06** (`m10-wald`, 1280): Hauptleiste „Roden · 10 Geld", „Aufforsten · 20 Geld"; Taste `c` → Werkzeug
   „Roden"; Klick auf `wald` (52, 24): `world().tiles[24·64+52].terrain === 'grass'`, Geld −10, Ton `build`; Klick auf
   `weide` (44, 28) mit Roden: `.toast.error` „Hier ist kein Wald", Geld gleich; Taste `q`, Klick auf `weide`
   (44, 28): `forest`, Geld −20; Holzfäller (51, 26) `state === 'ok'`. `u2-06.png`.
5. **AK-R1-03** (`m10-wald` neu geladen, 1280 × 800, `?perf=1`, DPR 1 und DPR 2): Ausschnitt 3 × 3 Kacheln um `wald`
   (52, 24) vor und nach dem Roden per Screenshot-Clip; Pixel unterscheiden sich, Bäume weg (Urteil `qa-playtester`);
   Aufforsten auf `weide` (44, 28) zeigt Bäume. **Messung bei DPR 2:** `const t = await import('/src/render/terrain.ts');
t.terrainStats.patches.length = 0`; dann 10 Forst-Aktionen abwechselnd auf `wald` (Roden, Aufforsten, … — 5 × Roden,
   5 × Aufforsten), je einen Frame warten; `t.terrainStats.patches` hat 10 Werte; höchster Einzelwert **≤ 100 ms**
   (erwartet ≤ 15 ms). Alle 10 Werte in den Bericht. Über 100 ms: blockend, Messwerte an den Controller (Offener Punkt 5).
6. **K5** (falls umgesetzt; `m10-wald`): mit Roden über drei Waldkacheln ziehen → alle drei Weide, Geld −30, höchstens
   eine Fehlermeldung. Kein AK; Beobachtung im Bericht.
7. **AK-U2-08** (`m10-amtsstube`): Amtsstube (43, 24) anklicken: Titel „Amtsstube", drei `[data-tax]`, aktiver
   markiert; „hoch" klicken → `world().taxLevel === 'high'`, `[data-field=tax-lock]` sichtbar; Sperr-Matrix mit Zeilen
   Pioniere, Siedler, Bürger; `[data-lock="2-cloth"]` klicken → `world().goodLocks` enthält `{ tier: 2, good: 'cloth' }`,
   `aria-pressed="true"`; mit K1 `[data-stop="1"]` → `world().upgradeStops` = `[1]`. `m10-amtsstube-aus`: Amtsstube
   (35, 25): `[data-field=townhall-state]` „Wirkt nicht: nicht angebunden"; Klick auf einen `[data-tax]` →
   `.toast.error` „Die Amtsstube wirkt erst mit Weg und ohne Brand", `taxLevel` unverändert. Panel
   `scrollWidth ≤ clientWidth`. `u2-08-a.png`, `-b.png`.
8. **AK-U2-09** (`m10-amtsstube`): Werkzeugmacher `werkzeug-ohne` (49, 37): Zustand „Braucht eine Schule in
   Reichweite", Abhilfe „Baue eine Schule (U) in Reichweite"; `werkzeug-mit` (43, 32): Zustand wie vor M10 (kein
   `noService`-Text).
9. **AK-U2-11** (`m10-krise-bald`, 1×): vor dem Lauf Krisen-Log verborgen und Legende ohne Brand-/Sturm-Zeile; nach
   `world().tick ≥ 2400` beide sichtbar. Neue Insel mit Krisen „aus", 30 s bei 4×: Krisen-Log nie sichtbar.
10. **AK-U2-12** (`m10-start`): Menü-Tastenliste ohne C, Q, mit „? Hilfe" nach P; `m10-pionier-fast-voll` bei 1× durch
    Tick 100, Knopf „Hilfe" der Meldung öffnet die Hilfe-Karte; „Neue Insel" mit „Alles frei", Krisen „normal":
    „Roden · 10 Geld" und „Aufforsten · 20 Geld" in der Hauptleiste, `help-next` = „Alles freigeschaltet".

### QA-U3 (W7, am Task-8-SHA)

1. **AK-U3-04** (`galerie` und `m10-amtsstube`, 1280 und 1920, Auswahl-Werkzeug): Zeiger per `mouseMoved` auf die
   Kachel eines Gebäudes (`galerie`: Prüfpunkt `chapel`; `m10-amtsstube`: `amtsstube` (43, 24)), alle 50 ms auf
   `.hover-card` prüfen: erscheint nach 400 ms (± 100 ms) mit dem Titel aus `hoverInfo` (über das Vite-Modul
   `/src/ui/hover.ts` mit `world()` berechnet); `mouseMoved` auf eine andere Kachel → Karte weg; Ziehen (Maustaste
   gedrückt, bewegen) → keine Karte; Menü offen → keine; Taste `h` (Bauwerkzeug) → keine. Am rechten und unteren
   Fensterrand (Kachel nahe der Ecke anfahren) liegt `getBoundingClientRect()` der Karte vollständig im Fenster.
   `u3-04-*.png`.
2. **AK-U3-05** (`m10-wald`): Mouse-over über `wald` (52, 24) enthält „Roden: 10 Geld"; Taste `c`, Klick, `Escape`,
   Mouse-over erneut: Titel „Weide", Zeile „Aufforsten: 20 Geld". `u3-05.png`.

### QA-U4 (W8, am Task-9-SHA)

1. **AK-U4-01** (`m10-start`, 1280 × 800): jeder sichtbare Lager- und Einwohner-Chip, `[data-field=money]` und
   `[data-field=balance]` enthält ein `svg[aria-hidden=true]`; `aria-label` = bisheriger Text (z. B. „Holz 40 →",
   „Pioniere 4", „Geld 5000" — Vergleich gegen den bisherigen Text aus dem Stand vor Task 9; gemessen wird `aria-label`, nicht `textContent`, da der Chip nur noch den Wert trägt); `title` unverändert; `#hud` ≤ 84, `scrollWidth ≤ clientWidth`.
2. **AK-U4-02**: Kategorie-Reiter mit Symbol, `aria-label` und `title` = Kategoriename; Bau-Einträge `aria-label`
   „{Name} · {n} Geld"; Tastatur: `Tab` bis zum Reiter „Produktion", `Enter`, `Tab` zum ersten Eintrag, `Enter` →
   Eintrag `active`.
3. **AK-U4-03** (`galerie`): das Wohnhaus der höchsten in `galerie` vorhandenen Stufe anklicken (`galerie` enthält kein Bürgerhaus): Bedarfe als Symbole mit ✓ / ✗, jedes mit zugänglichem Namen; fehlt
   ein Gut, darunter eine Zeile mit seinem Namen; Freischalt-Meldung (`m10-pionier-fast-voll`, durch Tick 100) und
   Hilfe zeigen Symbole vor den Namen; der Text ohne Symbole (`textContent` der Meldung, Namen im Eintrag per `aria-label`) ist gleich dem aus QA-U1/QA-U2.
4. **AK-U4-04** (K2, `m10-pionier-fast-voll`): nach Tick 100 tragen die fünf neuen Einträge das Zeichen „neu"
   (`aria-label` „neu"); nach einmaligem Wählen von „Kapelle" fehlt es dort; Speichern, Laden: kein Zeichen.
5. **AK-U4-05** (K3, `galerie`): Bau-Einträge zeigen die verkleinerte Silhouette; Blindtest wie AK-A1-03 für die
   Einträge (Urteiler `qa-playtester`).

### QA-ART (lead-art, W7)

1. **AK-A1-03:** Symboltafel im Browser: per CDP in einer leeren Seite des Dev-Servers
   `const m = await import('/src/ui/icons.ts')` und je Id `m.iconSvg(id)` bei 16 px und 24 px ohne Beschriftung in
   ein Raster schreiben (Reihenfolge gemischt, Schlüssel nur im Bericht); `qa-playtester` ordnet mit der Namensliste zu:
   **≥ 20 von 24** richtig. Anmutung (Palette, Strichstärke): Urteil `lead-art`.
2. **AK-R1-04** (`galerie`): Amtsstube ohne Beschriftung unter den Gebäuden finden (Legende erlaubt); Urteiler
   `qa-playtester`, Anmutung `lead-art`.

---
