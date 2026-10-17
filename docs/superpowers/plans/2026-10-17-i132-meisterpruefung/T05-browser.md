# T05 · Browser-Check 1280 px, Zeitmessung nachher

`qa-playtester` · ≈ 30 Tools · AK 18, 19, 20 · blocked-by: T04 (Merge `feat/i132-ui` → `feat/i132` erledigt) · läuft parallel zu T06

Worktree `.worktrees/i132` (Branch `feat/i132`). Screenshots unter `.studio/qa/i132/`. Kein Code.

## Spielstände

`SCENARIO_OUT=.studio/qa/i132/saves npx vitest run tests/sim/scenario-saves.test.ts; echo EXIT=$?` schreibt die Szenario-Saves (migriert auf v18);
verwendet wird `m13e2-bild-4` (Denkmal fertig, 4 Kaufmannshäuser × 20 = 80 Kaufleute, kein Gewürz-Erzeuger → Gewürz-Defizit). Laden per `localStorage`
wie in früheren Browser-Checks; Weg im Report festhalten. Die Häuser des Szenarios sind unversorgt und schrumpfen (bei 1× fällt die Auflage nach
rund 30 s unter 70 %): nach dem Laden pausieren, Karte und Start in der Pause (Starten in der Pause ist erlaubt), «Spiel läuft weiter» vor dem Start prüfen.

## Ablauf

- [ ] 1. **AK 18:** Fenster 1280 × 800, Stand laden. Ziel-Chip zeigt «Meisterprüfung». Klick öffnet die Karte: Name «Eigenversorgung», Regeltext,
      Bedingung «15 Minuten, Einwohner nicht unter 70 % des Starts», Vorschau «Ohne Zukauf fehlen: … Gewürz −… / min …», Feuerwachen-Hinweis,
      Knopf «Auflage beginnen». Spiel läuft weiter (Zeitanzeige vor/nach 5 s verschieden). `Esc` schliesst. Bilder `ak18-karte.png`, `ak18-esc.png`.
- [ ] 2. **AK 19:** «Auflage beginnen»: Meldung «Meisterprüfung begonnen: …». Handel öffnen: Kauf-Knöpfe blass; Klick zeigt
      «Auflage Eigenversorgung: kein Zukauf». Chip «Eigenversorgung m:ss / 15:00» zählt hoch. Kopfzeile einzeilig: `offsetHeight` der Kopfzeile
      vor dem Start = während der Auflage; mit sichtbarer Rats-Marke. Bilder `ak19-handel.png`, `ak19-kopfzeile.png`.
- [ ] 3. **AK 20 Abbruch:** Karte öffnen, «Abbrechen» → Text «Wirklich abbrechen?», zweiter Klick → Meldung «Meisterprüfung abgebrochen», Chip wieder
      «Meisterprüfung», Kauf wieder möglich. Bild `ak20-abbruch.png`.
- [ ] 4. **AK 20 nicht bestanden:** neu starten, Tempo 4×, warten bis die Einwohner unter 70 % fallen: Meldung «Meisterprüfung Eigenversorgung nicht bestanden:
      Einwohner unter 70 %» genau einmal. Inselchronik (Ruhe-Ansicht) zeigt unter dem Wahlziel «Meisterprüfung: offen». Bilder `ak20-nicht-bestanden.png`,
      `ak20-chronik.png`.
- [ ] 5. **Laden mitten in der Auflage** (Review Focus 3): starten, speichern, laden → keine Meldung «bestanden/nicht bestanden», Chip zählt ab dem
      gespeicherten Stand weiter.
- [ ] 6. Konsole: keine Fehler.
- [ ] 7. Zeitmessung nachher (R392): `uptime` ≤ 4, dann der `vitest related`-Befehl aus T00 mit zusätzlich `src/sim/trial.ts src/ui/trial.ts src/ui/trialCard.ts`
      und `--outputFile=.studio/qa/i132/zeit-nach.json`; Abnahmeregel aus T00, Tabelle der Abweichungen im Report.

## Ergebnis

Playtest-Report als Schlussbericht: je AK OK/ABWEICHUNG mit Bildpfad, Konsolenfehler, Zeitvergleich. Abweichungen gehen an den Controller (Fix in T04
per SendMessage an denselben Umsetzer, Nachprüfung per SendMessage an denselben Playtester).
