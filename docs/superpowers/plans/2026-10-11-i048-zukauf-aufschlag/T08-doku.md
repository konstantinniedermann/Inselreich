# T08 — Doku: README Handel/Denkmal, arc42

**Persona:** `tech-sim-engineer`. Der T06-Arbeiter wird per SendMessage fortgesetzt (kein neuer Start). Ist sein Kontext zu voll, startet der Controller nach Meldung an L0 einen Puffer-Start. Worktree `.worktrees/i048`, Branch `feat/i048`. **D1-Dateien sind ausdrücklich erlaubt (E-017):** `README.md`, `docs/arc42.md`, `docs/beobachtungen.md`.

**Spec-Abschnitte:** §10 (Doku-Folgen, Wortlaut dort). Kein AK. Das Review übernimmt das Final-Review (opus) über die ganze Branch, mit diesem Task als eigenem Prüfpunkt (Muster R485 B3).

## Schritte

- [ ] **`main` mergen** (kein Rebase), weil die Doku ein Hot Spot ist: Auch M13-E2, I-049 und UI-TASTEN ändern README und arc42. Danach README-Abschnitte «Handel» und «Denkmal» sowie die arc42-Zeilen `save.ts`/`trade.ts`/Tick-Ablauf mit `grep -n` aufsuchen und nur diese Stellen lesen.
- [ ] **README «Handel»:**
  - «Kaufpreise sind fest.» wird ersetzt durch die Regel mit Zahlen aus Spec §10: +2 Punkte je Einheit, höchstens 160 %, −1 Punkt je Sekunde bis 100 %, bis rund 30 Einheiten je Minute fast der Listenpreis, «10 Werkzeug am Stück kosten 436 statt 400». Das Edikt Handel wirkt zusätzlich −20 %.
  - Verkaufssättigung: «Jede Sekunde» → «Alle 2 Sekunden»; «Rund 10 Einheiten je Gut und 10 Sekunden» → «… und 20 Sekunden». Das Beispiel «100 Holz bringen 219 statt 400» bleibt stehen.
  - Der Dialog zeigt «Kauf … %» neben «Verkauf … %» (bisher «Preis … %»). Der Satz zu Handelsaufträgen («zuzukaufen lohnt sich nie») bleibt.
  - Hat T06 `BUY_RISE` auf 1 gesenkt (nur mit L0-Ruling), werden die Zahlen danach gesetzt (10 Werkzeug = 418).
- [ ] **README «Denkmal»:** Ein Satz kommt dazu: «Der Zukauf für das Denkmal zahlt den aktuellen Kaufpreis samt Aufschlag, hebt ihn aber nicht.» Die Summen «64 200» und «≈ 1100 Geld je Minute» bleiben, mit dem Zusatz «bei Kaufpreis 100 %», falls der Satz das nicht schon sagt.
- [ ] **`docs/arc42.md`:** Persistenz bekommt das Feld `buyPct`, die Save-Version nach der Weiche (Ledger), die Migration und die Rückfaltung (Testhelfer). Tick-Ablauf: `tickMarket` mit zwei getrennten Erholungen (Verkauf alle 20, Kauf alle 10 Ticks). Die Baustein-Zeile `trade.ts` nennt `buyQuote`/`buyQuoteFor` als reinen Preiskern. Fundstellen auf `main` @ `c62f346b`: Baustein `trade.ts` («`buy` zu Fixpreisen», ≈ Z. 167), Tick-Tabelle `tickMarket` (≈ Z. 410), Abschnitt Verkaufssättigung (≈ Z. 728, 902).
- [ ] **`docs/beobachtungen.md`:** Nur Befunde ausserhalb des Scopes aus T02–T07 (z. B. Kontor-Kopf-Trenner bleibt eigenes Thema; falls beobachtet: Testzeit der Zweilauf-AK). Mit Datum, Fundort, Ursprung «I-048» und erster Einschätzung.
- [ ] `make docs-check; echo EXIT=$?` → 0.

**Commit:** `docs: README und arc42 zu Zukauf-Aufschlag und Verkaufserholung (I-048)`.

**Prüfpunkt im Final-Review:** README-Zahlen = `defs/` (2, 160, 10, 20 bzw. die Werte nach einem Ruling) und = Spec §10. arc42 nennt die tatsächliche Save-Version. Keine Doku-Aussage widerspricht den neu gemessenen Festwerten.
