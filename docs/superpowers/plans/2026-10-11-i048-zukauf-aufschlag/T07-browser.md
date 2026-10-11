# T07 — Browser-Check Handelsdialog (qa-playtester)

**Persona:** `qa-playtester` (sonnet), als Controller-Start · Stand: `feat/i048` nach T06 (Werte B), Baum `.worktrees/i048` (nur lesen, keine Commits) · Headless-Chrome wie in den bisherigen Browser-Checks.

**Spec-Abschnitte:** §7.2, §9.4 AK-ZK-23…-28 · Screenshots unter `.studio/qa/i048/`, Dateiname `<ak>-<breite>x<höhe>.png`, jeweils 1280 × 720 und 1920 × 1080 (AK-ZK-28: 800 × 600). Spielgeschwindigkeit 1×.

**AK:** AK-ZK-23, -24, -25, -26, -27, -28. Dieser Check deckt auch die UI aus T04 ab. Er läuft erst nach B, weil die geprüften Werte (436, 120 %, 349) `BUY_RISE` 2 voraussetzen.

## Ausgangsstände (qa B8)

| AK             | Ausgangsstand                                                                                                                                                                                                                                                |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 23, 24, 25, 28 | Neues Spiel (Startgeld 5000) mit Kontor. Wie in bisherigen Checks über die Startkarte plus das Kontor-Setzen, oder über den Szenario-Stand `m10-start`, falls er ein Kontor hat (vorher prüfen)                                                              |
| 26             | Szenario `m13-ziel1` (Ziel 1 erreicht, Amtsstube vorhanden): `SCENARIO_OUT=<scratch>/szen npx vitest run tests/sim/scenario-saves.test.ts; echo EXIT=$?`, dann laden wie bisher (localStorage-Schlüssel des Spielstands). Im Spiel das Edikt Handel erlassen |
| 27             | `tests/sim/fixtures/save-v11.json` aus T03, geladen über denselben Ladeweg                                                                                                                                                                                   |

Die Szenario-Stände werden **auf dem Branch-Stand** erzeugt (v12/v13 mit `buyPct`); alte QA-Stände aus früheren Checks gelten nicht (Spec §8, Fall v12).

## Prüfschritte

- [ ] **AK-ZK-23:** Handelsdialog öffnen. Für jedes der 10 Güter sind «Kauf 100 %» und «Verkauf 100 %» sichtbar (DOM-Text der Felder `buy-pct-<g>` und `price-<g>`). Kein waagrechtes Scrollen: Für den Dialog gilt `scrollWidth ≤ clientWidth` (Wert im Bericht). Keine Konsolenfehler.
- [ ] **AK-ZK-25:** Hover auf den Knopf «+10» bei Werkzeug **vor** dem Kauf. Der Titel lautet «10 Werkzeug kaufen für 436 Geld · im Mittel 109 %».
- [ ] **AK-ZK-24:** Den Knopf «+10» bei Werkzeug klicken. Das Geld sinkt um genau 436 (Anzeige vorher/nachher), die Zeile zeigt «Kauf 120 %» und der Stückpreis «48 Geld». Ohne weiteren Kauf: Nach 10 s Wandzeit bei 1× steht dort **108 … 112 %** (Toleranz ±2, qa B8), nach ≥ 22 s genau «Kauf 100 %». Gemessen wird mit Zeitstempeln im Skript; die Werte gehen in den Bericht. Weicht der Takt ab (Tab im Hintergrund), wird nicht nachgebessert: wiederholen, im Vordergrund.
- [ ] **AK-ZK-26:** Ausgangsstand `m13-ziel1`, Edikt Handel aktiv, Anteil Werkzeug 100. Der Knopftitel nennt 349, der Kauf senkt das Geld um 349. Danach zeigt die Zeile «Kauf 120 %» wie ohne Edikt.
- [ ] **AK-ZK-27:** Den v11-Stand laden. Er lädt ohne Hinweis, alle Güter zeigen «Kauf 100 %», und die Verkaufsanteile entsprechen dem Stand (`sellPct.wood` 55 → «Verkauf 55 %»).
- [ ] **AK-ZK-28:** Fenster 800 × 600, Dialog offen: keine Überlappung (Screenshot), keine Konsolenfehler («stürzt nicht ab»).
- [ ] **Querblick (kein AK):** Das Denkmal-Panel nennt den Zukauf-Preis je Stück über `buyPrice(w, g, 1)`. Ist im Ausgangsstand ein Denkmal vorhanden, nach einem Handkauf Stein prüfen, ob der Preis dort mitsteigt (Spec §7.2). Ohne Denkmal entfällt der Querblick; das gehört dann in den Bericht.

## Bericht

Playtest-Report als Schlussbericht: je AK OK/Befund mit Screenshot-Pfad, Messwerte AK-ZK-24 (Zeitpunkte, Anzeige) und `scrollWidth`/`clientWidth`. Befunde gehen an den Controller; die Fix-Runde übernimmt der T04-Arbeiter (`tech-ui-engineer`, per SendMessage fortgesetzt) im Baum `.worktrees/i048`, danach folgt ein erneuter Check nur der betroffenen AK. Spielerlebnis-Befunde ausserhalb der AK (z. B. «Kauf 160 %» wirkt abschreckend oder unauffällig) kommen in den Bericht als Antwort auf die Playtest-Frage der Spec, nicht als Fix.
