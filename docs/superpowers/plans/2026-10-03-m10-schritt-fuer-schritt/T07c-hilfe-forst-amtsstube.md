> **Task-ID:** Task 7 (Paket M10-U2) — Teil 3 von 3
> **AK-IDs:** Vitest-Teile AK-U2-01, -02, -07, -10, -11, -12 (Browser-Teile in QA-U2), `RF-5`
> **blocked-by:** QA-U1 (OK), R1 (Review OK, gemergt), **M9 H-R3 und H-R4 auf `main`** (R159)
> **Gemeinsame Regeln:** [index.md](index.md) (Global Constraints) · Orga: [orga-06-schnittstellen.md](orga-06-schnittstellen.md) · [orga-07-datei-ownership.md](orga-07-datei-ownership.md) · [orga-08-abhaengigkeiten-extern.md](orga-08-abhaengigkeiten-extern.md)
> **Teile:** [T07a-hilfe-forst-amtsstube.md](T07a-hilfe-forst-amtsstube.md) · [T07b-hilfe-forst-amtsstube.md](T07b-hilfe-forst-amtsstube.md) · **T07c-hilfe-forst-amtsstube.md** (diese)

- [ ] **Schritt 2: Rot prüfen.** `npx vitest run tests/ui -t "M10"` → FAIL (`helpSections is not a function`, …).
      **Vor der Umsetzung grün erlaubt:** keiner.
- [ ] **Schritt 3: `renderer.ts` (Ausnahme, R159):** `Tool` + `{ kind: 'clearForest' } | { kind: 'plantForest' }`;
      Werkzeug-Vorschau der Forst-Werkzeuge: Rauten-Umriss der Kachel unter dem Zeiger, Farbe wie die gültige bzw.
      ungültige Bau-Vorschau (gleicher Weg wie `road`), keine weitere Änderung. Danach `npx tsc --noEmit`: jeder
      `switch` über `Tool` (z. B. `sameTool`, `toolName`, `categoryOf`, `tooltipLines`, `placementHint`) bekommt die
      zwei Fälle.
- [ ] **Schritt 4: Hilfe.** `startCard.ts`: `helpSections(world)` nach Spec 12.1 (Abschnitte, Quellen, Formate; „Als
      Nächstes" aus `nextUnlocks` mit `${names.join(', ')} — ${when}` + ` (jetzt ${now} / ${need})` + taxBlocks-Zusatz;
      leer → „Alles freigeschaltet"; „Tipps": `tip` der freien Einträge absteigend, höchstens 3, danach je freies
      Gebäude mit Standortregel „{Name}: {siteText}" aus der Bauleiste; „Kartenzeichen": `mapSigns(world)`; „Erste
      Schritte": `startSteps()` nur ohne Siedler). Modus `help`: Titel und `aria-label` „Hilfe", Knopf „Weiter
      spielen", Abschnitte als `[data-field=help-…]`. Öffner: HUD-Knopf „Hilfe" vor „Einstellungen" in `.hud-sound`,
      Taste `?` (`hotkeyAction` → `{ kind: 'help' }`), Menü-Knopf „Hilfe" (statt „Ziel und erste Schritte"), Knopf
      „Hilfe" der Freischalt-Meldung; Esc schliesst, Fokus zurück zum Öffner; bei offener Karte keine Werkzeugtaste.
      Ruhe-Ansicht (`inspect.ts`): unter „Nächster Schritt" `[data-field=help-hint]` „Mehr in der Hilfe (?)".
- [ ] **Schritt 5: `guide.ts`.** Steuer-Regel und Kassen-Satz lesen `effectiveTaxLevel`; Kassen-Satz in drei Fassungen
      (Spec 12.3); `remedyText` `noService`: `buildLock(w, 'school')` ≠ null → `Schule kommt, ${whenText U4}`, sonst
      `Baue eine Schule (U) in Reichweite` (Name und Taste aus `SERVICE_BUILDING[requiresService]` und `hotkeyLabel`);
      `mapSigns(world)` filtert die Brand- und Sturm-Zeilen, solange `!crisisLogVisible(world)` (K4).
      `crisisLogVisible(w)` = `w.crisisLevel !== 'off' && w.tick >= CRISIS_FIRST_TICK` (in `crisisLog.ts`); das
      Krisen-Log in `eventLogView.ts` ist bis dahin `hidden`.
- [ ] **Schritt 6: Forst-Bedienung.** `hotkeys.ts`: `c: { kind: 'clearForest' }`, `q: { kind: 'plantForest' }` (nach
      `i`), `?` → `{ kind: 'help' }` (Shift erlaubt), `toolName` „Roden"/„Aufforsten", `toolShown` für Forst =
      `functionLock(w, 'forest') === null`, `hotkeyList` + `{ key: '?', label: 'Hilfe' }` nach P. `buildMenu.ts`:
      Hauptleiste nach „Abriss" „Roden · 10 Geld" und „Aufforsten · 20 Geld" (Zahlen aus `defs/forest.ts`), nur bei
      freier Funktion; `tooltipLines` für `townhall`, `clearForest`, `plantForest` (Tabelle 11.9). `hints.ts`:
      `placementHint` für Forst-Werkzeuge aus `canClearForest`/`canPlantForest` (gültig „Roden: 10 Geld" bzw.
      „Aufforsten: 20 Geld", sonst `friendlyReason`); `REASON_TABLE` + Zeilen 11.9 (AK-U2-10). `goal.ts`
      `lockedToolText` für Forst-Werkzeuge: `Roden: ${friendlyReason(functionLock)}` bzw. `Aufforsten: …`; die Namen in
      `unlockNoticeText` kommen jetzt aus `hotkeyLabel`. `input.ts`/`app.ts`: Klick mit Forst-Werkzeug ruft
      `clearForest`/`plantForest`; `fail` → Meldung `error` + Ton `error`, Erfolg → Ton `build`; Klick vs. Ziehen
      wie beim Bauen (Ziehen der Karte rodet nicht).
- [ ] **Schritt 7: Amtsstuben-Panel (`inspect.ts`).** Titel „Amtsstube"; nicht aktiv →
      `[data-field=townhall-state]` „Wirkt nicht: nicht angebunden" bzw. „Wirkt nicht: brennt"; drei Knöpfe
      `[data-tax]` (nie `disabled`, Klick `setTaxLevel`, Ablehnung als Meldung mit `friendlyReason`), aktive Stufe
      markiert, Zeile `taxEffect`, Sperrhinweis `[data-field=tax-lock]`; Sperr-Matrix ab U5 aus `lockMatrix(world)`
      (Zeilen Stufen mit Einwohnern > 0, Spalten freigeschaltete Bedarfsgüter der Stufe, Knopf
      `[data-lock="{tier}-{good}"]` mit `aria-pressed`, Klick `setGoodLock`); K1: je Stufe mit Aufstieg und Einwohnern
      Schalter `[data-stop="{tier}"]` „Häuser dieser Stufe steigen nicht auf" (`aria-pressed`, `setUpgradeStop`);
      Abriss-Zeile wie bei allen Gebäuden. Werkzeugmacher-Panel: Zustand aus `stateInfo`, Abhilfe aus `remedyText`.
      `#panel` `scrollWidth ≤ clientWidth` bei 1280.
- [ ] **Schritt 8 (Kann K4):** `eventLogView.ts`/`crisisLog.ts` verborgen bis `crisisLogVisible`; Legende über
      `mapSigns`.
- [ ] **Schritt 9 (Kann K5):** Roden und Aufforsten durch Ziehen über mehrere Kacheln wie beim Weg (`input.ts`):
      je Kachel einmal die Aktion, Abbruch ohne Fehlermeldungsflut (eine Meldung je Zug mit dem ersten Grund). Ohne
      eigenes AK; der Reviewer prüft am Diff, QA-U2 Schritt 6 sieht es an.
- [ ] **Schritt 10: Grün prüfen.** `npx vitest run`; `npx tsc --noEmit`; `make check`; Sicht-Probe wie Task 6
      (Hilfe mit `?`, Roden auf einer Waldkachel); Commit
      `git commit -m "feat: M10-U2 Hilfe-Karte, Forst-Werkzeuge, Amtsstuben-Panel, Gründe (Spec 11.8–11.10, 12)"`.

---
