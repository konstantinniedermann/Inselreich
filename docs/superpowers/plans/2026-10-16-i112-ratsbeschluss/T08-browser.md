# T08 · Browser-Check 1280 px, Zeitmessung nachher

`qa-playtester` · ≈ 30 Tools · AK 14, 15, 16, 17 · blocked-by: T05, T07 und Merge `feat/i112-ui` → `feat/i112` (Controller)

Worktree `.worktrees/i112-impl` (Branch `feat/i112` nach dem Strang-Merge). Screenshots unter `.studio/qa/i112/`.

## Ablauf

1. Spiel bei 1280 × 800 starten; Szenario mit erstem Siedler-Haus: `devParams.ts` kennt keines; konkreter Weg im Report festhalten (Spielstand-Fixture aus `tests/sim/scenarios.ts` per `localStorage` laden, oder fester Bauplan mit Koordinaten). Messbar machen: Kopfzeile `offsetHeight` vor/nach dem Fassen gleich (AK 16), Zeitanzeige als Zahl (AK 14, Pause-Probe). Zusatz: Laden eines Standes mit `'open'` zeigt keinen Hinweis (T07 Punkt 4).
2. **AK 14:** Hinweis «Der Rat tagt: ein Beschluss steht an» erscheint einmal; Marke «Rat · 1» sichtbar und hervorgehoben; Tick läuft weiter
   (Zeitanzeige vor/nach 5 s). Bild `ak14-marke.png`.
3. **AK 15:** Marke anklicken: zwei Karten «Webordnung» und «Glockenrecht», Zahl im Text lesbar, Satz «Gilt für die ganze Partie …» sichtbar.
   Karte wählen ohne «Beschluss fassen» und schliessen: `council[2]` bleibt `'open'` (Marke weiter «Rat · 1»). `Esc` schliesst. `Umschalt + R`
   öffnet. Bilder `ak15-karte.png`, `ak15-esc.png`.
4. **AK 16:** «Glockenrecht» wählen, «Beschluss fassen»: Marke neutral «Rat», Liste «Stufe 2: Glockenrecht»; Kopfzeile einzeilig bei 1280 px.
   Bild `ak16-gefasst.png`.
5. **AK 17:** Kapelle im Baumenü wählen: Reichweitenkreis 13 (Tooltip «Radius: 13»); stehende Kapelle auswählen: Kreis 13. Bilder
   `ak17-bau.png`, `ak17-auswahl.png`. Gegenprobe in neuer Partie ohne Beschluss: 10.
6. Pause-Probe (P-4): in der Pause beschliessen ist möglich, Spiel bleibt pausiert.
7. Zeitmessung nachher (R392): `uptime` ≤ 4, dann gleicher `vitest related`-Befehl wie T00 mit `--outputFile=.studio/qa/i112/zeit-nach.json`;
   Abnahmeregel aus T00 anwenden, Tabelle der Abweichungen > +50 % oder > 500 ms im Report.

## Ergebnis

Playtest-Report als Schlussbericht: je AK OK/ABWEICHUNG mit Bildpfad, Konsolenfehler (keine erwartet), Zeitvergleich. Kein Code.
