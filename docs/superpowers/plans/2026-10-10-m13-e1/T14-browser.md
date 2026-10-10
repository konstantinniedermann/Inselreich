# T14 · Browser-Lauf am Kandidaten (Spielstand ab Ziel 1, R452)

Rolle `qa-playtester` (sonnet) · gestartet von Controller D · AK-M13E1-34…41, AK-M13STL-10 · Spec §10.4, §8.3 · Entscheid E6 (ein Lauf für T10–T12), E7 (Szenarien) · blocked-by T13 · 1 Lauf (≈ 60 Tools)

**Gegenstand:** `.worktrees/m13-e1-ui` (enthält Sim-Strang und `main`), Stand nach `make check` Exit 0. Ablage `.studio/qa/m13-e1/`, Dateiname `<ak>-<breite>x<höhe>.png` (z. B. `e1-34-1280x720.png`, `stl-10-1920x1080.png`). Fenster 1280 × 720 und 1920 × 1080, für AK-M13E1-40 zusätzlich 800 × 600.

## Vorbereitung

```bash
SCENARIO_OUT=.studio/qa/m13-e1/saves npx vitest run tests/sim/scenario-saves.test.ts; echo EXIT=$?
```

Spielstände `m13-ziel1.json` (Ziel 1 erreicht, aktive Amtsstube, Geld 3000) und `m13-vor-ziel.json` (vor Ziel 1, Amtsstube) wie bei früheren Browser-Checks in einen Slot laden (Werkzeuge `tools/render-qa/`, `lib.mjs`). Konsole von Anfang an mitschneiden.

## Schritte

1. **AK-M13E1-34** `m13-ziel1`, Amtsstube anklicken: Abschnitt «Edikt» nach der Steuerzeile, drei Karten **untereinander** (Sparen, Handel, Wohlfahrt) mit Name, Wirkung, «lohnt, wenn …», Knopf «Erlassen (600)»; Panel `scrollWidth ≤ clientWidth` (per `evaluate` gemessen, Wert im Report). Beide Fenstergrössen.
2. **AK-M13E1-35** `m13-vor-ziel`: Karten blass, Zeile «Erst nach dem Bürger-Ziel»; Klick ändert weder Geld noch Status.
3. **AK-M13E1-36** `m13-ziel1`: Klick «Erlassen (600)» bei Sparen → Geld −600, Karte hervorgehoben mit «Aufheben», Zeile «wieder änderbar in 5:00» zählt herunter (zwei Screenshots im Abstand), Klick auf Handel → Meldung «Edikt erst in … wieder änderbar»; Unterhalt in der Kopfzeile sinkt (Wert vorher/nachher). Fokus bleibt auf dem Knopf über mehrere Ticks (U-5).
4. **AK-M13E1-37** Zeitraffer bis Sperrende, «Aufheben» → Meldung «Edikt aufgehoben — wieder änderbar in 5:00», Status «Kein Edikt», Geld unverändert.
5. **AK-M13E1-38** (nach erneutem Sperrende) Handel erlassen, Kontor-Panel: Stückpreis Nahrung 7, Glas 40, Zusatz «Edikt Handel: −20 %»; Kauf von 10 Nahrung kostet 64 (Geld vorher/nachher).
6. **AK-M13E1-39** Amtsstube abreissen und neu bauen: Status «Kein Edikt», Sperrzeile mit Restzeit sichtbar.
7. **AK-M13STL-10** Fischer anklicken → Knopf «Stilllegen»; Klick → Zustand «Stillgelegt — halber Unterhalt», Unterhaltszeile halbiert, Unterhalt der Kopfzeile sinkt, Nahrungs-Trend der Kopfzeile fällt um die Rate eines Fischers; «Wieder anfahren» → «In Betrieb». Wohnhaus und Kapelle zeigen keinen Knopf. Beide Fenstergrössen.
8. **AK-M13E1-40** Fenster 800 × 600, Amtsstuben-Panel und Betriebs-Panel offen: keine Überlappung, kein Absturz, keine Konsolenfehler.
9. **AK-M13E1-41** Slot mit `version: 12` (gespeicherten Stand per `evaluate` umschreiben) laden: Hinweis «Unbekannte Version» bzw. der Text aus `friendlyReason`, laufendes Spiel läuft weiter (Tick steigt), keine Konsolenfehler.
10. **Querschnitt:** Konsole ohne Fehler und Warnungen aus `src/` im ganzen Lauf; Spielerzweck-Probe (Spec §12 Playtest-Frage) in zwei Sätzen: Ist ohne Erklärung erkennbar, welches Edikt wann lohnt? Ist «Stilllegen» bei «Lager voll» auffindbar (Leitfaden-Hinweis)?

## Ausgabe

Playtest-Report als Schlussbericht: je AK bestanden/nicht bestanden mit Screenshot-Pfad und Messwert; Befunde mit Schweregrad und Ort; Vorschläge ausserhalb des Scopes für `docs/beobachtungen.md`. Kein Code ändern. Nicht bestandene AK gehen als Fix-Runde an den UI-Umsetzer (SendMessage), danach Teil-Wiederholung der betroffenen Schritte (Fortsetzung, kein neuer Start).
