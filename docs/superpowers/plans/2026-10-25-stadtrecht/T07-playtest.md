# T07 · Browser-Check Stadtrecht (`qa-playtester`)

Prüfer `qa-playtester` · ≈ 35 Tools · AK-ST-16, AK-ST-17 · blocked-by: T06 · Stand `feat/stadtrecht` in `.worktrees/stadtrecht` · Screenshots `.studio/qa/STADTRECHT/` · ändert keine Datei im Repo

## Vorbereitung

- Dev-Server aus `.worktrees/stadtrecht` (`make help` → Start-Befehl), Headless-Chrome bei **1280 × 800**; Gegenprobe **800 × 800** nur «stürzt nicht ab».
- **Spielstände (P-9, B8):** die drei Stände **«Glas 0»**, **«alles leistbar»** und **«Rang 6»** entstehen im Seitenkontext aus dem Sim-Skript, nie von Hand, und tragen damit den `SAVE_VERSION` des Merge-Stands:
  `const { charterFixture } = await import('/tests/sim/charterFixtures.ts'); const { serialize } = await import('/src/sim/save.ts'); localStorage.removeItem('inselreich.save.v1'); localStorage.setItem('inselreich.save.auto', serialize(charterFixture('glas0')));` (Namen `glas0`, `alles`, `rang6`), dann Seite neu laden und «Fortsetzen» (Muster `tools/render-qa/sitzung.mjs:122-135`). Liefert Vite `/tests/…` nicht aus: Befund an den Controller, kein Ersatz von Hand.
- Konsolen-Log je Stand mitschneiden.

## Prüfschritte

1. **AK-ST-16 (Stand «Glas 0», 1280 px):** Marke «Rat · Stadtrecht» klicken oder `Umschalt + R`. Abschnitt «Stadtrecht · Rang 0 von 6», Kostenzeile der Sitzung 1 aus den Defs, zwei Karten mit «+2 %» bzw. «+50 %» lesbar, «Gilt für die ganze Partie.». Screenshot `16-rang0.png`.
2. **AK-ST-16 (Auswahl ohne Kauf):** Karte A anklicken, Kasse und Rang unverändert (Kopfzeile vorher/nachher im Report), Karte markiert. Screenshot `16-auswahl.png`.
3. **AK-ST-17 (Kauf in der Pause):** Spiel pausieren, «Sitzung einberufen». Ohne Fortsetzen: Kasse sinkt um den Betrag der Sitzung 1 (vorher/nachher-Zahl), Überschrift «Rang 1 von 6», Liste zeigt «Marktrecht: Steuer +2 %». Screenshot `17-nach-kauf.png`.
4. **AK-ST-16 (Glas fehlt):** jetzt Sitzung 2: Glas-Posten hervorgehoben, Knopf gesperrt, Grund «Zu wenig Glas» sichtbar. Screenshot `16-glas-gesperrt.png`.
5. **AK-ST-17 (Kopfzeile):** Stand «alles leistbar»: Kopfzeile mit «Rat · Stadtrecht» einzeilig; Höhe der Kopfzeile per `getBoundingClientRect().height` mit Stand «Rang 6» («Rat») vergleichen, gleich ± 1 px, kein Umbruch. Screenshot `17-kopfzeile.png`. Meldung «Der Rat kann tagen: Stadtrecht leistbar» erscheint beim Laden **nicht** (Spec §3.3).
6. **AK-ST-16 (Rang 6):** Stand «Rang 6»: nur Überschrift und Liste mit sechs Rechten, keine Karten, kein Knopf. Screenshot `16-rang6.png`.
7. Gegenprobe 800 px: Rats-Karte öffnet, keine Konsolenfehler. Screenshot `schmal.png`.

## Bericht

Playtest-Report als Schlussbericht: je AK OK/BEDENKEN/ZURÜCK mit Screenshot-Pfad, gemessene Kopfzeilen-Höhen, Konsolenfehler wörtlich, Weg der Spielstand-Erzeugung. «Melde dein Ergebnis per SendMessage an <agentId des Controllers>, nie an main.»
