> **Task-ID:** Task 6 (Paket M10-U1) — Teil 3 von 3
> **AK-IDs:** Vitest-Teile von AK-U1-01 … -13 (Browser-Teile in QA-U1), `RF-4`
> **blocked-by:** Task 4
> **Gemeinsame Regeln:** [index.md](index.md) (Global Constraints) · Orga: [orga-06-schnittstellen.md](orga-06-schnittstellen.md) · [orga-07-datei-ownership.md](orga-07-datei-ownership.md)
> **Teile:** [T06a-bedienung-freigeschaltet.md](T06a-bedienung-freigeschaltet.md) · [T06b-bedienung-freigeschaltet.md](T06b-bedienung-freigeschaltet.md) · **T06c-bedienung-freigeschaltet.md** (diese)

- [ ] **Schritt 2: Rot prüfen.** `npx vitest run tests/ui tests/audio -t "M10"` → FAIL (`unlockNoticeText is not a
function`, `visibleCategories is not a function`, `hotkeyList` liefert alle Tasten, …). **Vor der Umsetzung
      grün erlaubt:** keiner.
- [ ] **Schritt 3: Reine Helfer.**
  - `buildMenu.ts`: `buildEntries` filtert über `buildingShown` statt `buildLock`; `visibleCategories(world)` =
    Kategorien mit mindestens einem Eintrag; `renderBuildMenu`/`updateBuildMenu`: Kategorie-Knopf ohne Eintrag
    `hidden`; ist die offene Kategorie leer, schliesst die Einträge-Leiste.
  - `goal.ts`: `unlockNoticeText(prev, world)` nach Spec 11.6 — neue Ids = `world.unlocked` ohne `prev`; leer → `null`;
    nur U6 → `UNLOCK_NOTICE`; sonst `Neu: ${namen.join(', ')} — ${notice des letzten neuen Eintrags}. Mehr unter Hilfe (?)`,
    Namen je neuem Eintrag (UNLOCKS-Reihenfolge): angezeigte Gebäude (`buildingShown`-Bedingung `ONLY_WITH_CRISES`)
    in `BUILDING_IDS`-Reihenfolge als `${name} (${hotkeyLabel})`, dann Funktionen: `forest` → „Roden (C)",
    „Aufforsten (Q)" (Tasten fest aus Spec 11.2, ab Task 7 aus `hotkeyLabel`), `orders` → „Handelsaufträge",
    `goodLocks` → „Ausgabesperre" (`FUNCTION_LABELS`). `frameUnlock(seen, world)` = `{ text: unlockNoticeText(seen,
world), seen: [...world.unlocked] }`. `lockedToolText(world, tool)`: `build` → `buildLock` ≠ null →
    `${name}: ${friendlyReason(world, lock)}`; sonst nicht `buildingShown` → `${name}: ohne Krisen nicht nötig`;
    sonst `null`; andere Werkzeuge `null` (Forst ab Task 7). `initialUnlockShown`, `unlockNotice` entfallen.
  - `hotkeys.ts`: `toolShown(world, tool)` (`build` → `buildingShown`, sonst `true`); `hotkeyList(world)` filtert
    die Werkzeugtasten mit `toolShown`.
  - `hud.ts`: `stockChipHidden(w, g)` = `!(goodUnlocked(w, g) || w.stock[g] > 0)`; `popChipHidden(w, t)` =
    Einwohner der Stufe 0 **und** Eintrag nicht frei (t = 2 → U3, 3 → U5, 4 → U6; Zuordnung als Konstante
    `POP_CHIP_UNLOCK` in `hud.ts`, kein Spielwert); `taxButtonText(w)`; Bilanz-Tooltip-Zeile.
  - `trade.ts` (UI): `tradeRows(w)` = Güter mit `goodUnlocked || stock > 0`, `canBuy = goodUnlocked`.
  - `order.ts`: `orderVisible(w)` = `functionLock(w, 'orders') === null`; `orderMessageFor`.
  - `soundEvents.ts`: `SoundSnapshot.unlocked: number` (Länge von `unlocked`); `diffSoundEvents` meldet `'unlock'`
    einmal, wenn die Zahl wächst und `won` nicht im selben Frame neu ist; `orderPeriod` gesperrt → `null`.
  - `settings.ts`: `unlockMode: 'stepwise' | 'all'`, Standard `'stepwise'`, Prüfung wie `crisisLevel`.
  - `inspect.ts`: `rest-tax` = `taxEffect(effectiveTaxLevel(w))` + ohne aktive Amtsstube „ (keine Amtsstube)".
- [ ] **Schritt 4: DOM und Verdrahtung.**
  - `messages.ts`: `showMessage(text, kind, sticky, closable, action?: { label: string; onClick: () => void })` —
    Knopf im Toast mit `action.label`, `click` ruft `onClick` und stoppt die Weitergabe (der Toast schliesst sich
    beim Klick auf den Knopf nicht ungewollt doppelt).
  - `app.ts`: Merkfeld `state.unlockedSeen: UnlockId[]` statt `unlockShown` (beim Laden und bei „Neu" =
    `world.unlocked`); je Frame `frameUnlock` → höchstens eine Meldung `showMessage(text, 'info', true, true,
{ label: 'Hilfe', onClick: openHelp })` (bis Task 7 öffnet `openHelp` die bisherige Karte im Modus `help`);
    `selectTool`: `lockedToolText` ≠ null → `showError` (Meldung `error` + Ton `error`), kein Werkzeug; „Neue
    Insel": `createWorld(seed, { crisisLevel, unlockAll: settings.unlockMode === 'all' })`; Kopfzeile: Klick auf
    `[data-field=tax]` wählt die Amtsstube (erste aktive) und öffnet ihr Info-Panel; DEV:
    `exposeDevProbe({ world: () => state.world, tileCenter, centerOn })` → `window.__inselDev`, mit
    `tileCenter(x, y)` = Mitte der Raute aus `tileCorners(cam, x, y)` (`src/render/camera.ts`) plus Canvas-Offset
    (`getBoundingClientRect`) in CSS-Pixeln und `centerOn(x, y)` = Kamera so verschieben, dass die Kachel in der
    Bildmitte liegt (gleicher Weg wie das Schwenken per Tastatur, nur Kamera-Zustand).
  - `hud.ts` DOM: Steuer-Knöpfe und Sperrhinweis verlassen die Kopfzeile; `.hud-tax` `hidden` ohne aktive Amtsstube,
    sonst Knopf `[data-field=tax]` mit `taxButtonText`. `#hud` bleibt ≤ 84 px bei 1280 × 800.
  - `menu.ts`: „Neue Insel" mit Auswahl `aria-label` „Freischaltung für die neue Insel", Optionen „Schritt für Schritt
    (empfohlen)" (`stepwise`) und „Alles frei" (`all`), Wert aus und nach `settings` (bleibt nach Neuladen).
  - Handels-Panel (`trade.ts`), Auftragskarte (`order.ts`), Lager- und Einwohner-Chips (`hud.ts`) über die Helfer.
  - `src/audio/sound.ts`: `SoundEvent` + `'unlock'`, Zuordnung auf die `win`-Datei.
- [ ] **Schritt 5: Grün prüfen.** `npx vitest run`; `npx tsc --noEmit`; `make check`. Bewusst geänderte Tests T-7,
      T-11 auflisten. `grep -rn "unlockShown\|initialUnlockShown\|unlockNotice(" src tests` → keine Treffer.
- [ ] **Schritt 6: Sicht-Probe (Implementierer, kein QA-Ersatz):** `npx vite --port 5196`, neues Spiel bei 1280 × 800:
      Bauleiste „Wohnen" und „Produktion", Taste K → Meldung; Screenshot in den Bericht.
- [ ] **Schritt 7: Commit.** `git add src tests && git commit -m "feat: M10-U1 Bedienung zeigt nur Freigeschaltetes, Freischalt-Meldung, Ton, Alles frei (Spec 10, 11)"`

**Integration (Controller, W4b):** nach Review OK von Task 5 und Task 6:
`git -C .worktrees/m10-ui merge --no-edit <T5-SHA>`, `make check`, push; dann QA-U1 am Merge-SHA.

---
