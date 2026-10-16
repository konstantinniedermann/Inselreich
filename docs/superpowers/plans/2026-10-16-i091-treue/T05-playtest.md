# T05 · Browser-Check (qa-playtester)

Plan: [Index](../2026-10-16-i091-treue.md) · Spec §5, AK-TR-19 · Prüfer `qa-playtester` · Modell sonnet · ≈ 30 Tools ·
blocked-by: T04 · Screenshots und Report unter `.studio/qa/i091/`

## Weg zum Stand (Spec AK-19: «Fixture oder Entwicklerwerkzeug» → hier: Fixture über den Spiel-Speicher)

Fünf echte Perioden dauern zu lange (Gate-Spec-Handoff, AK-19). Der Controller erzeugt vor dem Start den Stand mit dem
Generator aus T04:

```bash
SCENARIO_OUT=.studio/qa/i091 npx vitest run tests/sim/loyalty.test.ts -t "schreibt"; echo EXIT=$?
```

→ `.studio/qa/i091/i091-kulanz.json` (treuer Vertrag Rum auf der Heimat, `deliveries = N`, Rum 0, keine Häuser, Kasse 5000,
5 s vor dem Periodenbeginn). Der Prüfer lädt ihn **über den normalen Ladeweg**: Dev-Server (`make dev`), Seite öffnen,
`localStorage.setItem('inselreich.save.v1', <Dateiinhalt>)` (Schlüssel `SAVE_KEY` aus `src/ui/storage.ts`), Seite neu
laden, im Menü «Laden» (manueller Slot). Werkzeug: `tools/render-qa/sitzung.mjs` (Muster `.studio/qa/playtest-i047/lauf.mjs`);
`window.__inselDev.world()` nur **lesend** (Kasse, `contract.deliveries`).

## Schritte

- [ ] **1** Fenster 1280×720. Stand laden (oben). Screenshot `01-geladen-1280x720.png`: Karte zeigt «Stammkunde: 5 Rum ·
      nächste Lieferung … · Lager 0/5 · treu: verzeiht einmal», Warnfarbe «knapp» aktiv (Spec §5). Kasse notieren.
- [ ] **2** Tempo 1× bis über den Periodenbeginn (≈ 5 s). Meldung «Stammkunde wartet: zu wenig Rum, diesmal ohne Strafe»
      als Warnung; Fehlerklang über die Dev-Sonde `contractSounds()` (letzter Eintrag `error`). Screenshot
      `02-kulanz-1280x720.png`.
- [ ] **3** Kasse unverändert gegenüber Schritt 1 (keine Häuser, kein Unterhalt; Abweichung → Befund mit Betrag), Karte zeigt
      «… · Lager 0/5 · Treue 0/5» (N = 5 aus `CONTRACT_LOYAL_AFTER`), Vertrag besteht (`__inselDev.world().contract`
      ≠ `null`, `deliveries === 0`), keine Auftragskarte «Auftrag: …» und kein Fernangebot in dieser Periode. Screenshot
      `03-karte-danach-1280x720.png`.
- [ ] **4** Breite: Karte bricht bei 1280 px nicht um (Text eine Zeile wie vor I-091); bei 1024×700 kein Fehler in der
      Konsole (desktop-first, nur «stürzt nicht ab»). Screenshot `04-1024x700.png`.
- [ ] **5** Konsole: keine Fehler und Warnungen aus `src/` über den ganzen Lauf.
- [ ] **6** Optional (wenn Zeit im Budget): nächste Periode ohne Rum → «Stammkunde abgesprungen: zu wenig Rum. Strafe 135»,
      Kasse −135 (Deckel R-T4). Screenshot `05-deckel-1280x720.png`.

## Ergebnis

Report `.studio/qa/i091/report.md`: je Schritt OK/Befund mit Screenshot-Pfad, Last (`uptime`) zu Beginn, Urteil
OK/BEDENKEN/ZURÜCK. Befunde an der Karte gehen als Fix-Runde an den Umsetzer von T03 (SendMessage), dann Wiederholung der
betroffenen Schritte.
