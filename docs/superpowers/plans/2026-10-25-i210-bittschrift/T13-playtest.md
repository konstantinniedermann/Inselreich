# T13 Browser-Check

Persona `qa-playtester` (Controller-Start) · Strang A (zusammengeführter Stand) · Tools ≈ 35 · AK-BS-19, -20, -21, -22 · blocked-by T14. **Last ≤ 4 nötig** (Messfenster frei, kein fremder Headless-Chrome; liegengebliebene fremde Headless-Chrome nach R922 per PID beenden).

**Vorlauf (Controller, nicht der Playtester):**

- `feat/i210-mess` und `feat/i210-ui` per Merge in `feat/i210` (kein Rebase).
- Teilbeleg auf dem Ergebnis: `npx vitest run tests/sim/petitions.test.ts tests/sim/petitionsRuns.test.ts tests/sim/petitionsHarmless.test.ts tests/sim/petitionsSave.test.ts tests/ui/petition.test.ts tests/ui/petitionLog.test.ts; echo EXIT=$?`. Die Dominanz- und Messdateien laufen einzeln: `npx vitest run tests/sim/petitionsDominance-b1b3.test.ts; echo EXIT=$?`, ebenso `-b4b5`, `-b6b9`, `tests/sim/petitionsStable.test.ts` und `tests/sim/petitionsController.test.ts`. Dazu `npx tsc --noEmit`, `make lint`, `make zeittests`, `make conflicts`, je `; echo EXIT=$?`.
- **Spielstand für den Check:** Einmal-Skript im Scratchpad (nicht im Repo): `createWorld(3, { petitionsOn: true })`, `startColony` plus `runColony` bis `won`, dann `step` bis `next − 50` (Karte kommt nach 5 s Spielzeit), `serialize` → Datei `.studio/qa/i210/vor-karte.json`. Ein zweiter Stand `.studio/qa/i210/stoff-knapp.json`: dieselbe Welt mit Stoff unter `amount` direkt nach dem Ziehen. Ladeweg: der bestehende Speicher-Schlüssel aus `src/ui/storage.ts` (per `rg -n "localStorage" src/ui/storage.ts`), im Headless-Browser vor dem Laden gesetzt.

**Prüfung** (Headless, Desktop 1280 × 800 und 1920 × 1080; Screenshots unter `.studio/qa/i210/`):

- **AK-BS-19:** Dialog «Neue Insel»: Kästchen «Bittschriften» ist an. Stand `vor-karte` laden, laufen lassen: Die Karte erscheint mit beiden Spalten, Zahlen wie Spec §5.1 (Kosten, «bis +n Einwohner», Reservezeilen, «spart ≈ n», «Warum …», «Keine weitere Folge») und der Restfrist. Pause: Die Restfrist steht (zwei Screenshots im Abstand von 3 s Wanduhr). Chip «Bittschrift m:ss» in der Kopfleiste öffnet die Karte wieder.
- **AK-BS-20:** «Ja» auf B1 (oder auf die gezogene Bitte; ist es nicht B1, dann einen Stand mit B1-Marke über das Skript): Das Lager sinkt sofort um die Kosten. Nach 8 min (Zeitraffer) zeigt die Chronik «Dank» und das Hauspanel «23 / 20 (…)». Nach Ablauf folgt «ziehen weiter».
- **AK-BS-21:** «Nein»: Das Hauspanel zeigt 3 min lang «Genügsam: … −10 % bis …»; nach `delay` steht «Klage» in der Chronik, sonst ändert sich nichts (Geld und Lager nur durch normalen Lauf).
- **AK-BS-22:** Stand `stoff-knapp`: «Ja» zeigt den Sperrgrund statt des Knopfs, «Nein» ist klickbar.
- **Zusatz:** Konsole ohne Fehler. Speichern und Laden mit offener Karte: Die Karte ist über den Chip wieder erreichbar, die Restfrist gleich. Ohne Kästchen gestartete Insel: keine Karte nach Ziel 1. Bei 1280 px passen beide Spalten ohne horizontales Scrollen.

Ergebnis: Playtest-Report (Urteil, Screenshot-Pfade, Abweichungen) an den Controller. Befunde behebt `tech-ui-engineer` per `SendMessage`, die Nachprüfung macht derselbe Playtester per `SendMessage`.
