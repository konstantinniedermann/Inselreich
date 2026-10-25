# T12 · Browser-Check bei 1280 px (AK-IP-19 … -23)

`qa-playtester` (Controller-Start) · ≈ 35 Tools · AK-IP-19, -20, -21, -22, -23, -26/-29 (Anbindung, N4), Review Focus 5 · blocked-by: T04, T07, T11 und Integration (Controller merged
`feat/inselproben-mess` und `feat/inselproben-ui` per `git merge` in `feat/inselproben`, danach `make check; echo EXIT=$?` = 0) · Worktree `.worktrees/inselproben` ·
Screenshots `.studio/qa/INSELPROBEN/` · ein Check für T09–T11 (P-6, R270)

## Vorbereitung

- Dev-Server im Worktree (`npm run dev`), Headless-Chrome 1280 × 800; Zwischenablage per CDP `Browser.grantPermissions` (`clipboardReadWrite`,
  `clipboardSanitizedWrite`) für die Seiten-Origin.
- Dev-Spielstand `ip-probe1-kurz-vor-ziel` über die bestehende Szenario-Strecke (`tests/sim/scenario-saves.test.ts` schreibt die Saves; Laden wie bei
  den übrigen Dev-Szenarien in `localStorage`).
- Lokales Datum notieren (Tagesinsel).

## Schritte (je Schritt Screenshot `<nn>-<kurz>.png`, Soll-Text wörtlich prüfen)

1. **AK-IP-19:** Seitenstart → Startkarte zeigt Knopf «Inselproben» und die Zeile «Tagesinsel {TT.MM.} · {Ziel} · Bestzeit –». Klick öffnet die Proben-Karte mit
   drei Abschnitten; `Esc` schliesst. Menü → «Inselproben …» öffnet dieselbe Karte; `Esc` schliesst.
2. **AK-IP-20:** Probe 1 «Erste Ernte» starten → Chip «Probe 1 · 0:00». Tempo 4× für ≈ 15 s Echtzeit → Uhr ≈ 1:00 Spielzeit; Pause 10 s → Uhr unverändert;
   Chip-Klick zeigt «Bürger … / 50», «Bestzeit –», «Krisen aus», «Freischaltung: stufenweise».
3. **AK-IP-21:** Dev-Spielstand laden, laufen lassen bis 50 Bürger → Ergebnis-Karte «Probe bestanden · mm:ss», «erste Zeit»; «Ergebnis kopieren» →
   `navigator.clipboard.readText()` gleich «Inselreich · Probe 1 «Erste Ernte» · mm:ss · Krisen aus»; «Nochmal» → Bestätigung → neue Partie, Menü zeigt «Karte 3».
4. **AK-IP-22:** Schuldbrief starten → (1) Chip «Schuld 3000»; (2) Kasse unter 500 bringen (bauen) → «Tilgen 500» blass, Tooltip «Zu wenig Geld»; (3) Kasse ≥ 500
   → Klick, Schuld 2500 und Kasse −500; (4) ab Tick 100 enthält der Bilanz-Tooltip «Zins −… / min» mit Wert ≠ 0. Abriss eines Hauses: Hinweis und Meldung zeigen
   keine Erstattung.
5. **AK-IP-23:** `localStorage['inselreich.proben'] = 'x'`, neu laden → einmaliger Hinweis «Bestzeiten zurückgesetzt», kein Absturz, Proben-Karte öffnet.
6. **AK-IP-26/-29 in `app.ts` (N4):** Probe 1 starten, `localStorage['inselreich.proben']` notieren; Menü → «Speichern», dann «Laden» des Stands und
   «Fortsetzen» nach Seitenneustart → Ablage unverändert (Versuchszähler, Zeiten), keine Ergebnis-Karte. Danach «Neue Insel» → Ablage unverändert.
7. **Review Focus 5:** Tagesinsel starten → Menüzeile «Karte {Zahl}» und Chip bei 1280 px ohne Umbruch oder Überlauf.
8. 800 px Breite: Proben-Karte und Ergebnis-Karte öffnen → stürzt nicht ab.

## Bericht

Playtest-Report nach Persona (OK/BEDENKEN/ZURÜCK je AK, Pfade der Screenshots, Konsole ohne Fehler). Befunde → Fix im UI-Umsetzer per `SendMessage`, danach
nur die betroffenen Schritte wiederholen.
