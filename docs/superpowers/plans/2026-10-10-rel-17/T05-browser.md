# T05 · Browser-Check am Kandidaten (Release-Check REL-17)

Prüfer `qa-playtester` (sonnet), gestartet im `lead-qa`-Start „Gate Merge + Release-Check“ (R429 V3, Entscheid E9) · Kandidat `.worktrees/integrate` (nur lesen) · AK-R17-10, 11, 13–16, 18 (`ak.md`) · blocked-by T04 und Kandidat gebaut (`make check` grün)

**Ziel:** `.`/`,` führen der Reihe nach zu jedem Problem und öffnen das Panel, ohne das Werkzeug zu wechseln; der Abriss-Zug nimmt nur Wege und warnt bei Trennung. Kein Code ändern; Befunde an den Auftraggeber.

**Rahmen:** Headless-Chrome über `tools/render-qa/sitzung.mjs` (`session({ root: <Kandidat>, seed: 7, w, h, dpr: 1, port: 5717, prep })`), echte CDP-Eingaben (`Input.dispatchKeyEvent` mit `key: '.'`/`','`, `Input.dispatchMouseEvent` für Ziehen). Fenster **1280 × 720**, Schritt 1 zusätzlich **1920 × 1080**. Studioweit ≤ 2 Browser-Läufe zugleich (R424). Vor und nach dem Lauf `pgrep -fl "Chrome|chromium"`. Screenshots und Bericht unter `.studio/qa/REL-17/`; Wegwerf-Skript nur dort. Spielstand per `prep` (Seitenkontext, `w` = Welt) oder `window.__inselDev` (`src/ui/devProbes.ts`).

DOM-Sonden: Meldung `document.querySelectorAll('.toast[data-slot="problem"]')` (Anzahl, `textContent`), Panel `#panel` (`textContent`), aktives Werkzeug über die Bauleiste (`[aria-pressed="true"]` bzw. `__inselDev`), Kamera über `__inselDev` (falls vorhanden) oder Screenshot-Vergleich.

**Spielstand A** (Heimat): Weberei ohne Weg (Klasse 1), Weberei angebunden ohne Wolle (Klasse 2), Siedlerhaus ohne Kapelle (Klasse 3), ≥ 3 Häuser ohne Stoff (Klasse 4). **Spielstand B:** wie A plus mit Seefahrt ein Betrieb mit Problem auf einer Fremdinsel mit Kontor.

## Schritte

- [ ] **Schritt 1: Sprung, Panel, Werkzeug (AK-R17-10, E1).** Stand A, Taste `R` (Weg-Werkzeug), Kategorie offen lassen, `.` drücken. Erwartet: Meldung „Problem 1 von m: Weberei nicht angebunden“, Panel zeigt die Weberei, Werkzeug weiterhin Weg, Kamera auf der Weberei, Zoom unverändert; Panel und Bauleisten-Overlay überdecken sich nicht. Screenshots `s1-1280.png`, `s1-1920.png`.
- [ ] **Schritt 2: Weiterzählen, ersetzen (AK-R17-11).** `.` noch (m − 1)-mal: Zähler 2 … m, Klassenreihenfolge 1 → 4, Klasse 4 nennt die Hauszahl („Stoff fehlt in 3 Häusern“); nach jedem Druck **genau ein** Toast mit `data-slot="problem"`. Noch einmal `.` → wieder „Problem 1 von m“. Dann `,` → „Problem m von m“. Zählungen wörtlich berichten. Screenshot `s2-klasse4.png`.
- [ ] **Schritt 3: 0 Probleme.** Neue Insel ohne Probleme (Startzustand nach Kontor, oder alle Probleme per `prep` behoben): `.` → „Alles versorgt, kein Problem offen“, Kamera und Panel unverändert. Screenshot `s3-null.png`.
- [ ] **Schritt 4: zwei Inseln (Review Focus 1).** Stand B, Kamera auf der Heimat: `.` (m + 1)-mal, jede Meldung notieren. Erwartet: jedes Problem genau einmal, Fremdinsel-Texte mit ` (<Inselname>)`, kein Pendeln, danach wieder „Problem 1“. Screenshot beim Fremdinsel-Eintrag `s4-fremd.png`.
- [ ] **Schritt 5: stumm.** Menü offen (Modal) → `.` ohne Wirkung; `Strg+.` ohne Wirkung.
- [ ] **Schritt 6: Abriss-Zug (AK-R17-13, 16).** Gerader Weg von ≥ 6 Kacheln, in der Mitte ein Gebäude direkt auf der Zuglinie (oder Zuglinie quer durch einen Gebäude-Footprint). Taste `X`, Druck auf einer Wegkachel, ziehen über die ganze Linie. Erwartet: alle Wegkacheln weg, Gebäude steht, Geld + 2 je Kachel (vorher/nachher berichten), keine Sammelmeldung; während des Zugs zeigt die Vorschau die Bodenkachel (Screenshot mitten im Zug `s6-zug.png`). Dann Druck auf eine Gebäudehülle: nur dieses Gebäude fällt (Meldung „… abgerissen · zurück …“), kein Weg daneben (AK-R17-14). Klick auf leeres Gras: Fehler „Hier liegt kein Weg“ (E5). Leertaste halten + Ziehen: schwenkt, reisst nichts ab.
- [ ] **Schritt 7: Trenn-Warnung (AK-R17-15).** Angebundene Weberei mit einem Weg zum Kontor: einzelne Wegkachel per Klick abreissen → genau eine Meldung „Abriss trennt 1 Gebäude vom Kontor“; danach `.` → „Problem 1 von m: Weberei nicht angebunden“. Zweiter Fall im Zug über zwei Abzweige → „Abriss trennt 2 Gebäude vom Kontor“. `Esc` mitten im Zug: Zug endet, Abgerissenes bleibt, Warnung erscheint. Screenshot `s7-warnung.png`.
- [ ] **Schritt 8: `.` mitten im Zug (E6, Review Focus 5).** Weg-Werkzeug, Zug beginnen, Maustaste halten, `.` drücken, Maus weiterbewegen und loslassen. Erwartet: kein Weg zwischen alter und neuer Kameraposition; dasselbe mit dem Abriss-Zug (keine Wege entlang der Sprunglinie entfernt). Geld vorher/nachher.
- [ ] **Schritt 9: Konsole (AK-R17-18).** Keine Fehler oder Warnungen aus `src/` im ganzen Lauf.

## Bericht (Playtest-Report)

Je Schritt OK/Befund mit Screenshot-Pfad, die Meldungstexte und Toast-Zählungen wörtlich, Geld vorher/nachher, Konsole, Chrome-Prozesse vor/nach. Urteil OK/BEDENKEN/ZURÜCK.
