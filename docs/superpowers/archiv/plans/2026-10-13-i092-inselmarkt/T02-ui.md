# T02 UI und Doku: Karte, Handelsdialog, Anleitung (AK-IM-12…14)

Persona `tech-ui-engineer`, Modell sonnet, blocked-by T01. Dateien (nur diese): `src/ui/islandCard.ts`, `src/ui/trade.ts`,
neu `tests/ui/inselmarkt.test.ts`, `tests/ui/islandCard.test.ts` und `tests/ui/trade.test.ts` (nur begründet angepasste Erwartungen), `README.md`, `docs/spielwerte.md` (D1-Dateien ausdrücklich erlaubt). Nicht anfassen:
`src/sim/`, `app.ts`, `order.ts`, `seaMapView.ts`. Spec B.4, B.7, R609. Texte aus `PREFER_PCT`/`BOOM_PCT`/`GOODS`, nichts hart.

## Schritte

- [ ] **1. Test zuerst** `tests/ui/inselmarkt.test.ts` (Muster `islandCard.test.ts`, `fakeDom.ts`); roter Lauf `EXIT=1` belegen.
  - AK-IM-12 `islandEffectTexts(w, i)`: Weidenau endet mit «Markt: Glas +30 %», Felsbucht «Markt: Rum +30 %», Möweninsel
    **genau** `['Markt: Stoff +30 %']`; Heimat `[]`; Trait-Zeilen davor unverändert.
  - AK-IM-13 `sellTexts(w,'glass',1,weidenau)` → `price` «26 Geld», `title` «1 Glas verkaufen für 26 Geld»; `HOME` «20 Geld».
    `preferTag`: Weidenau Glas «Vorliebe +30 %»; Boom auf Glas «statt Vorliebe +30 %»; Weidenau Stoff und Heimat Glas → `''`.
  - Weltkarten-Hover zeigt die Markt-Zeile ebenfalls (R610 2): Erwartungen in `islandCard.test.ts` begründet anpassen.
  - DOM-Test (Fake-DOM): `renderTrade`/`updateTrade` für Weidenau legen `prefer-glass` an, blenden es in der Heimat aus.
- [ ] **2. Umsetzung** `islandCard.ts`: reiner Helfer `marketTexts(def)` (`Markt: <Name> +<PREFER_PCT − 100> %`), in
      `islandEffectTexts` hinter `traitEffectTexts` angehängt (nicht in die Kopfzeile Zeile 71 doppeln: prüfen, ob
      `islandCard`-Kopf `traitEffectTexts` nutzt, und dort `marketTexts` ebenfalls anhängen). `ui/trade.ts`: `sellTexts`
      **exportieren** (Zeile 44), Parameter `island` ergänzen, `sellPrice(world, good, n, island)`; Aufrufer Zeile ~174
      (`renderTrade`) und ~281 (`updateTrade`) reichen die Insel des Dialogs durch; `preferTag(world, island, good)` mit
      `prefersGood` aus `sim/trade.ts` und `boomGood`; Feld `prefer-<good>` neben `boom-<good>`, in `updateTrade` aktualisiert.
- [ ] **3. Doku** `README.md` Abschnitt «Seefahrt und Gewürz»: Tabelle der drei Inseln (Gut, +30 %), «Boom gilt statt Vorliebe».
      `docs/spielwerte.md` «Kontor II»: Preise global, ausser Vorliebe-Gut am Fremdkontor ×1,30, nicht mit Boom gestapelt.
- [ ] **4. Grün:** `npx vitest run tests/ui/inselmarkt.test.ts tests/ui/islandCard.test.ts tests/ui/trade.test.ts; echo EXIT=$?`, `npx tsc --noEmit; echo EXIT=$?`.
      Neue Datei ×3 mit Dauer. Commit `feat: Inselmarkt in Karte und Handelsdialog (I-092)`, `docs: README und Spielwerte Inselmarkt`.
- [ ] **5. Browser-Check (AK-IM-14)** durch `qa-playtester`, 1280×720 und 1920×1080, alle Schritte **pausiert** (Pause direkt nach
      «Laden»). Spielstand 1: Kontor Weidenau und Felsbucht, Glas in beiden Lagern, `sellPct.glass` 100, kein Boom: (1) Hover
      Weidenau → «Markt: Glas +30 %»; (2) Handel Felsbucht Glas −1 = 20, keine Marke; (3) Handel Weidenau Marke «Vorliebe +30 %»,
      −1 = 26, Klick → Geld +26, «Verkauf 99 %»; (4) Heimat Glas −1 = 19, keine Marke. Spielstand 2 (zusätzlich Boom Glas):
      (5) Weidenau Boom-Marke plus «statt Vorliebe +30 %», −1 = 30. Kein Überlappen, kein Ausbrechen bei 1280 px. Screenshots
      `.studio/qa/i092/`; Spielstände präpariert über Fixture + Skript im Scratchpad, nicht ins Repo.
