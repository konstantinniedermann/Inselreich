# TASTEN-KOMFORT — Design-Spec

Datum: 2026-10-08 · Paket TASTEN-KOMFORT · Meilenstein: ohne (Komfort-Paket aus IDEEN-03) · Status: **Entwurf,
Abnahme lead-design, danach Gate Spec (lead-tech, lead-qa)** · Prozessstufe voll

Grundlage: Ruling **R337** (a) (Bündel I-022, I-023, I-025; `Umschalt+U` statt `+`), **R121** Punkt 3 (Leertaste auf
fokussiertem Knopf bleibt Aktivierung), [Ideen](../../ideen.md) I-022, I-023, I-025;
[Hauptspec](2026-09-29-inselreich-design.md). Code-Stand der Prüfung: `main` 60562a9.

Kennzeichnung: **Setzung Spec** (in dieser Spec ergänzt, nicht im Lead-Briefing), **[Tech]** (Umsetzungsdetail;
lead-tech entscheidet im Plan, die Spec legt nur das prüfbare Verhalten fest).

## 1. Ziel

**Spielerzweck:** „Ich halte das Spiel mit einem Tipp auf die Leertaste an, übernehme den Typ eines Gebäudes mit
Strg/Cmd+Klick als Bauwerkzeug und baue das markierte Gebäude mit `Umschalt+U` aus, ohne Leiste und Panel zu
suchen."

Drei Teile: **A** Leertaste antippen = Pause/weiter (I-022), **B** Pipette und Knopf «Gleiches bauen» (I-023),
**C** Ausbau per `Umschalt+U` (I-025). Alle drei sind reine Bedienung in `src/ui/`.

## 2. Scope und ausdrücklich nicht

**Im Scope:** neue DOM-freie Helfer in `src/ui/` (`spaceTap.ts`, `pipette.ts`, Erweiterungen in `hotkeys.ts`,
`input.ts`), dünne Verdrahtung in `input.ts`, `app.ts`, `inspect.ts`; Menü «Tastenkürzel»; Tooltips; README.

**Ausdrücklich nicht:**

- keine Änderung an `src/sim/` (Regeln, Defs, Aktionen), **kein neues Save-Format** (Save-Version bleibt), keine
  Baseline, kein Balancing (`tests/sim/balance.test.ts` unberührt), kein Perf-Thema;
- Touch-Gesten (keine Pipette per Geste, kein Tipp-Pause per Touch; nur der Knopf «Gleiches bauen» wirkt auf Touch);
- Pipette für Weg, Wald, Leerkachel, Schiff; Mehrfachauswahl;
- Tasten-Umbelegung durch den Spieler; Änderung anderer Tasten (`P`, `U`, `1`–`3`, Werkzeugtasten bleiben);
- I-024 «Direkt als Stufe 2 bauen» (geparkt, R337);
- PANEL-UEBERSICHT (I-026, folgt separat; zeigt später `Umschalt+U` in der Ausbau-Karte).

## 3. Gemeinsame Regeln

- **G-1** Alle Tasten dieses Pakets wirken nur **ohne offene Karte** (Modal, `isModalOpen()`) und **nicht in
  Eingabefeldern** (`INPUT`, `TEXTAREA`, `SELECT`, `contenteditable`), wie alle Hotkeys heute.
- **G-2** Werkzeugwechsel laufen ausschliesslich über `selectTool` in `app.ts` (einzige Stelle). Sperren und
  Meldung kommen unverändert aus `lockedToolText` (`src/ui/goal.ts`): Meldung «{Name}: {Grund}», Fehlerweg
  `showError` mit Ton `error`, kein Werkzeugwechsel.
- **G-3** Neue Bedien-Konstanten sind **keine Spielwerte** und gehören nicht nach `src/sim/defs/`; sie stehen je
  einmal exportiert im zuständigen Helfer, wie `DRAG_THRESHOLD` und `PAN_PX_PER_S` in `input.ts`.
- **G-4** Desktop-first (Maus + Tastatur ab 1280 px). Touch-Verhalten bleibt unverändert (nicht verschlechtern).

## 4. Teil A — Leertaste antippen pausiert (I-022)

### 4.1 Regeln

- **A-1** Konstante `SPACE_TAP_MAX_MS = 300` (exportiert aus `src/ui/spaceTap.ts`, einzige Stelle).
- **A-2** **Tippen** = Leertaste unten und wieder los, Dauer `keyUp.t − keyDown.t < 300` ms, kein Zeiger-Druck dazwischen. Ausgelöst wird beim **Loslassen** (keyup).
- **A-3** Wirkung des Tippens = Wirkung von `P`: Aktion `{ kind: 'pause' }` über denselben Hotkey-Weg (`onHotkey` → `afterPause`, Tempo-Merker `lastSpeed`). Kein eigener Pause-Code.
- **A-4** **Halten** (≥ 300 ms) ohne Zeiger-Druck: nichts.
- **A-5** Halten + linke Maus ziehen: Karte verschieben wie heute (`spaceDown`, Pan). Nach **jedem** Zeiger-Druck während des Haltens löst das Loslassen nie Pause aus, auch bei Klick ohne Ziehen und bei Dauer < 300 ms.
- **A-6** Als Zeiger-Druck zählt jedes `pointerdown` im Fenster (jede Taste, auch ausserhalb der Karte). **Setzung Spec:** Läuft beim Drücken der Leertaste schon eine Zeigeraktion (`input.isDragging()`), zählt das ebenfalls als Zeiger-Druck (kein Pausieren mitten im Weg-Zug). [Tech]: Capture-Listener am Fenster.
- **A-7** Tastenwiederholung (`e.repeat`) setzt die Startzeit nicht neu und startet keine Erkennung.
- **A-8** Fokussierter Knopf (`target.tagName === 'BUTTON'`): Leertaste bleibt Knopf-Aktivierung (R121 Punkt 3), weder Pause noch Pan; die Erkennung startet nicht.
- **A-9** Eingabefeld, offene Karte, oder Strg/Cmd/Alt gedrückt (bei keydown **oder** keyup): nichts; eine laufende Erkennung wird verworfen.
- **A-10** Fenster verliert den Fokus (`blur`): laufende Erkennung verworfen, `spaceDown` wie heute gelöscht.
- **A-11** `P` bleibt unverändert als zweiter Weg.
- **A-12** Zeitquelle ist der Zeitstempel des Ereignisses (`e.timeStamp`, monoton) [Tech]; der Helper selbst liest keine Uhr.

### 4.2 Reiner Helfer `src/ui/spaceTap.ts`

Zustandsautomat mit Zeitstempeln als Parameter, keine Uhr, kein DOM. Zustände: `idle`, `armed(t0)`, `spoiled`.

| Eingabe              | aus `idle`         | aus `armed(t0)`                                               | aus `spoiled`      |
| -------------------- | ------------------ | ------------------------------------------------------------- | ------------------ |
| `keyDown(t, false)`  | → `armed(t)`       | → `armed(t)` (neuer Druck ohne keyup)                         | → `armed(t)`       |
| `keyDown(t, true)`   | bleibt `idle`      | bleibt `armed(t0)`                                            | bleibt `spoiled`   |
| `pointerDown()`      | bleibt `idle`      | → `spoiled`                                                   | bleibt `spoiled`   |
| `keyUp(t)` → Ausgabe | `'none'`, → `idle` | `t − t0 < 300` und `t ≥ t0` ? `'toggle'` : `'none'`, → `idle` | `'none'`, → `idle` |
| `blur()`             | bleibt `idle`      | → `idle`                                                      | → `idle`           |

Ausgabe nur bei `keyUp`: `'toggle' | 'none'`. Form (Klasse, Fabrik oder reine Übergangsfunktion) [Tech].

### 4.3 Verdrahtung in `input.ts`

- Reine Funktion **`spaceKeyRole(target, modalOpen, mods)`** → `'button' | 'ignore' | 'map'`: `'button'` bei
  `tagName === 'BUTTON'`; `'ignore'` bei Eingabefeld, offener Karte oder Strg/Cmd/Alt; sonst `'map'` (Name [Tech]).
- keydown Leertaste mit Rolle `'map'`: wie heute `spaceDown = true`, `preventDefault`; zusätzlich
  `spaceTap.keyDown(e.timeStamp, e.repeat)`, bei laufender Zeigeraktion danach `spaceTap.pointerDown()` (A-6).
  Rolle `'ignore'`: `spaceTap.blur()`. Rolle `'button'`: nichts (wie heute).
- keyup Leertaste: `spaceDown = false` wie heute (immer). Ist die Rolle `'map'`, dann
  `spaceTap.keyUp(e.timeStamp)`; bei `'toggle'` → `onAction({ type: 'hotkey', action: { kind: 'pause' } })`.
  Sonst `spaceTap.blur()`.
- `pointerdown` im Fenster → `spaceTap.pointerDown()`; `blur` → `spaceTap.blur()`.

### 4.4 Menü und Tooltip

- `NAV_KEYS`: Eintrag «Leertaste + Ziehen» = «Karte schwenken mit der Maus» bleibt; **neu** «Leertaste (antippen)» =
  «Pause / weiter». Eintrag `P` in `hotkeyList` bleibt.
- Ist-Stand Kopfzeile: Der Pause-Knopf `⏸` hat **keinen** Tooltip (nur 2× und 4× tragen `speedTooltip`,
  `src/ui/hud.ts` Z. 228); dort wird `P` nicht genannt, also keine Pflichtänderung (Briefing-Bedingung). Siehe
  Offene Designfrage OF-3.

## 5. Teil B — Pipette und «Gleiches bauen» (I-023)

### 5.1 Regeln

- **B-1** **Pipetten-Klick** = `pointerdown` mit `button === 0`, `ctrlKey || metaKey`, Zeiger nicht Touch, Leertaste **nicht** gehalten. Gilt in **jedem** Werkzeug. Umschalt und Alt spielen keine Rolle.
- **B-2** Ziel = Gebäude unter dem Zeiger, bestimmt **wie im Werkzeug «Auswahl»** (`pickTarget` mit `{ kind: 'select' }`: Gebäude-Hülle, also jede Kachel der Grundfläche und die sichtbare Silhouette), unabhängig vom aktiven Werkzeug; auch auf Fremdinseln.
- **B-3** Gebäude mit Werkzeug → `selectTool({ kind: 'build', defId })` (G-2). Wohnhaus → `house`; Rinderfarm → `cattlefarm` (ohne Taste, Werkzeug aus der Bauleiste).
- **B-4** `kontor` → kein Werkzeug, Meldung **«Kontor lässt sich nicht nachbauen»** (Fehlerweg `showError`, Ton `error`), kein Werkzeugwechsel. **Setzung Spec:** `kontor2` (Name ebenfalls «Kontor») gleich behandelt (OF-2).
- **B-5** Weg, Wald, Leerkachel, Meer, Schiff, ausserhalb der Karte: nichts, still (keine Meldung, kein Ton, kein Werkzeugwechsel).
- **B-6** Der Pipetten-Klick baut, reisst ab, zeichnet und wählt nichts aus; er erzeugt keinen Zieh-Zustand (kein `drag`, kein Weg-Zug, kein `dragEnd`, keine Auswahl beim Loslassen, kein Handel-Panel beim Heimatkontor).
- **B-7** Ist das Werkzeug desselben Typs schon aktiv, bleibt es aktiv (kein Zurückschalten auf «Auswahl» wie bei der Hotkey-Doppeltaste), keine Meldung. **Setzung Spec.**
- **B-8** Mittlere Maustaste bleibt Karte verschieben, auch mit Strg/Cmd. Leertaste gehalten + Strg/Cmd+Klick: **Pan hat Vorrang**. Rechtsklick unverändert (Werkzeug ablegen).
- **B-9** macOS: Strg+Klick löst zusätzlich `contextmenu` aus; das ist am Canvas schon unterdrückt (`onContextMenu`). Cmd+Klick ist der Hauptweg. Plattformprüfung siehe OF-4.
- **B-10** Touch: keine Pipette per Geste; nur der Knopf «Gleiches bauen».

### 5.2 Knopf «Gleiches bauen»

- Neue Aktion in `InspectActions`: `buildSame(defId)`; in `app.ts` derselbe Weg wie die Pipette (B-3/B-4 über
  `selectTool`). Ein Bauwerkzeug schliesst das Panel (bestehendes Verhalten von `selectTool`).
- Sichtbar in der Knopfreihe (`panel-actions`) jedes Gebäudes, für das `toolForBuilding(defId) !== null`
  (Wohnhaus, Amtsstube, Betriebe, Dienste); **nicht** bei `kontor`, `kontor2`. Sichtbar auch bei gesperrtem Typ;
  der Klick nennt dann den Sperrgrund (G-2).
- Beschriftung «Gleiches bauen», `data-field="build-same"`, Tooltip (`title`): «Diesen Gebäudetyp als Bauwerkzeug
  wählen (Strg/Cmd+Klick auf ein Gebäude)». Position vor «Abreissen» [Tech].

### 5.3 Reine Helfer

- **`src/ui/pipette.ts`**:
  - `PIPETTE_KONTOR_TEXT = 'Kontor lässt sich nicht nachbauen'`;
  - `toolForBuilding(defId): Tool | null` — `null` für `kontor`, `kontor2`, sonst `{ kind: 'build', defId }`;
  - `pipetteResult(world, defId)` → `{ ok: true, tool } | { ok: false, reason }`; `reason` ist
    `PIPETTE_KONTOR_TEXT` oder genau `lockedToolText(world, tool)`;
  - `buildingDefAt(world, island, x, y): BuildingDefId | null` (über `tile.buildingId`).
- **`input.ts`**: `isPipetteClick(button, mods: { ctrl, meta }, spaceDown, touch): boolean` (Signatur [Tech]).

## 6. Teil C — Ausbau per `Umschalt+U` (I-025)

### 6.1 Regeln

- **C-1** `hotkeyAction` erhält Umschalt (Position abwärtskompatibel [Tech], z. B. optionales `shift` im `mods`-Objekt) und liefert **neu** `{ kind: 'upgrade' }` für Taste `u`/`U` mit `shift === true` und ohne Strg/Cmd/Alt, nicht im Formularfeld, nicht bei offener Karte.
- **C-2** `U` ohne Umschalt bleibt Werkzeug Schule, auch Gross-`U` durch Feststelltaste (`shiftKey === false`). Feststelltaste + Umschalt (`e.key === 'u'`, `shiftKey === true`) = Ausbau.
- **C-3** Nur für `U` ändert sich die Umschalt-Behandlung. Alle anderen Umschalt+Buchstaben bleiben Werkzeug-/Pause-Tasten wie heute; `?` weiter mit Umschalt.
- **C-4** Ziel = Gebäude des offenen Info-Panels: `state.panel.kind === 'inspect'` und `world.buildings[panel.id]` existiert. Sonst (kein Panel, Handel-Panel, Gebäude weg, Bauwerkzeug aktiv): Meldung **«Kein Gebäude markiert»** (Fehlerweg, Ton `error`), kein Werkzeugwechsel.
- **C-5** Ausbau über **dieselbe Funktion** wie der Knopf «Ausbauen»: den `upgrade`-Callback in `app.ts` in eine gemeinsame Funktion ziehen (z. B. `upgradeSelected(id)`). Gleicher Erfolgston (`build`), gleiche Fehlermeldung über `friendlyReason` mit Kosten-Kontext.
- **C-6** Sperrgründe ohne Sonderfall aus `upgradeBuilding` (`src/sim/upgrade.ts`): «Kann nicht ausgebaut werden» (auch Wohnhaus, Amtsstube, Dienste, Kontor II), «Höchste Stufe erreicht», Freischaltung U3/U5, «Gebäude brennt», Kosten bzw. Gebühr fehlen.
- **C-7** Tastenwiederholung: Halten von `Umschalt+U` baut höchstens **einmal** aus (bestehende Regel `!e.repeat` in `onKeyDown`).
- **C-8** Knopf «Ausbauen» trägt den Tooltip «Ausbauen (Umschalt+U)».
- **C-9** `hotkeyList` (Menü «Tastenkürzel»): neuer Eintrag «Umschalt + U» = «Markiertes Gebäude ausbauen»; Eintrag `U` Schule bleibt. **Setzung Spec:** Eintrag erst, wenn `functionLock(world, 'upgrade2') === null` (Regel «nur Freigeschaltetes», wie die Inseltasten).

### 6.2 Reiner Helfer

`upgradeTarget(panel: PanelState, world)` → `{ ok: true, id } | { ok: false, reason: 'Kein Gebäude markiert' }`
(Ort [Tech], z. B. `hotkeys.ts`; Text als exportierte Konstante `NO_SELECTION_TEXT`).

## 7. Menü «Tastenkürzel» gesamt

Neu genau drei Einträge: «Leertaste (antippen)» (A, immer), «Umschalt + U» (C-9, ab Ausbau-Freischaltung) und
**Setzung Spec** «Strg/Cmd + Klick auf Gebäude» = «Gebäudetyp als Bauwerkzeug (Pipette)» in `NAV_KEYS` (Maus-Einträge
wie «Rechtsklick» stehen schon dort). Keine zweite Liste (Spec L2).

## 8. Randfälle

| Fall                                                             | Soll                                                                                        |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Leertaste antippen während Weg-Zug mit gedrückter Maus           | keine Pause (A-6)                                                                           |
| Leertaste gedrückt, Karte öffnet sich, Leertaste los             | keine Pause (A-9: offene Karte bei keyup)                                                   |
| Leertaste-keydown auf Knopf, Fokus wechselt, keyup auf Karte     | keine Pause (Erkennung nie gestartet)                                                       |
| Leertaste tippen, dabei Strg drücken                             | keine Pause (A-9)                                                                           |
| Tippen bei Tempo 2×, nochmals tippen                             | Pause, dann wieder 2× (Tempo-Merker wie `P`)                                                |
| Pipette auf brennendes Gebäude                                   | Werkzeug wie sonst (Brand sperrt nur Ausbau)                                                |
| Pipette auf Gebäude eines aktuell gesperrten/ausgeblendeten Typs | Meldung «{Name}: {Grund}» aus `lockedToolText`, z. B. «Feuerwache: ohne Krisen nicht nötig» |
| Pipette auf Amtsstube                                            | wie Taste `I` (dieselben Sperren; Platzierung meldet ihren Grund wie heute)                 |
| Pipette auf Heimatkontor im Werkzeug «Auswahl»                   | Meldung B-4, Handel-Panel öffnet **nicht**                                                  |
| Strg+Klick im Werkzeug «Abriss» auf ein Gebäude                  | Werkzeug wechselt, Gebäude bleibt stehen (heute: Abriss)                                    |
| Strg+Klick mit offenem Info-Panel eines anderen Gebäudes         | Werkzeug wechselt, Panel schliesst                                                          |
| `Umschalt+U` bei aktivem Bauwerkzeug                             | «Kein Gebäude markiert» (Panel ist dann zu)                                                 |
| `Umschalt+U` im Handel-Panel (Heimatkontor)                      | «Kein Gebäude markiert» (C-4)                                                               |
| `Umschalt+U` bei Stufe 3                                         | «Höchste Stufe erreicht»                                                                    |
| `Umschalt+U`, Gebäude brennt / zu wenig Geld oder Gebührenware   | Meldung wie Knopf («Gebäude brennt», «Zu wenig …»)                                          |
| Alter Spielstand                                                 | unberührt; kein Save-Feld, keine Migration                                                  |

## 9. Datenmodell, Save, Werte

Kein neues Feld in `World`, **keine neue Save-Version**, keine Migration, kein Eintrag in `src/sim/defs/`. Neue
Konstanten (`SPACE_TAP_MAX_MS`, `PIPETTE_KONTOR_TEXT`, `NO_SELECTION_TEXT`) sind UI-Bedienwerte (G-3). Balancing-Test,
Baseline und Fingerabdruck bleiben bitgleich.

## 10. Abnahmekriterien

### 10.1 Vitest

Datei je AK in Klammern.

- **AK-TK-01** `keyDown(0,false)`, `keyUp(120)` → `'toggle'` (`tests/ui/spaceTap.test.ts`)
- **AK-TK-02** Grenze: Dauer 299 ms → `'toggle'`; 300 ms → `'none'`; `SPACE_TAP_MAX_MS === 300` (`tests/ui/spaceTap.test.ts`)
- **AK-TK-03** `keyDown(0)`, `pointerDown()`, `keyUp(100)` → `'none'` (`tests/ui/spaceTap.test.ts`)
- **AK-TK-04** `keyDown(0,false)`, `keyDown(250,true)`, `keyUp(320)` → `'none'` (Wiederholung setzt Start nicht neu); `keyDown(0,true)`, `keyUp(50)` → `'none'` (`tests/ui/spaceTap.test.ts`)
- **AK-TK-05** `keyUp(100)` ohne `keyDown` → `'none'` (`tests/ui/spaceTap.test.ts`)
- **AK-TK-06** `keyDown(0)`, `blur()`, `keyUp(100)` → `'none'`; danach `keyDown(200)`, `keyUp(300)` → `'toggle'` (`tests/ui/spaceTap.test.ts`)
- **AK-TK-07** Zwei Tipps nacheinander (0→100, 400→500) → zwei `'toggle'`; nach verdorbenem Druck (AK-TK-03) liefert der nächste Tipp `'toggle'` (`tests/ui/spaceTap.test.ts`)
- **AK-TK-08** `spaceKeyRole`: `BUTTON` → `'button'`; `INPUT`/`TEXTAREA`/`SELECT`/contenteditable → `'ignore'`; offene Karte → `'ignore'`; Strg/Cmd/Alt → `'ignore'`; `null`/`CANVAS`/`DIV` → `'map'` (`tests/ui/input.test.ts` [Tech: Datei])
- **AK-TK-09** `NAV_KEYS` enthält «Leertaste + Ziehen» und «Leertaste (antippen)» = «Pause / weiter»; `hotkeyList(createWorld(…))` enthält beide und weiter `P` (`tests/ui/hotkeys.test.ts`)
- **AK-TK-10** `isPipetteClick`: (0, ctrl) und (0, meta) → `true`; (0, keine) → `false`; (1, ctrl) und (2, ctrl) → `false`; (0, ctrl, spaceDown) → `false`; Touch → `false` (`tests/ui/input.test.ts`)
- **AK-TK-11** `toolForBuilding`: jede ID in `BUILDING_DEFS` ausser `kontor`, `kontor2` → `{ kind: 'build', defId }`; `house` → Wohnhaus, `cattlefarm` → Rinderfarm; `kontor`, `kontor2` → `null` (`tests/ui/pipette.test.ts`)
- **AK-TK-12** `pipetteResult` in frischer Welt: freier Typ (`fisher`) → `ok: true`; gesperrter Typ (z. B. `school`) → `ok: false`, `reason === lockedToolText(world, tool)`, enthält den Namen (`tests/ui/pipette.test.ts`)
- **AK-TK-13** `pipetteResult(world, 'kontor')` und `'kontor2'` → `reason === 'Kontor lässt sich nicht nachbauen'` (`tests/ui/pipette.test.ts`)
- **AK-TK-14** `buildingDefAt`: jede Kachel der Grundfläche eines gebauten 2×2-Betriebs → dessen `defId`; Weg-, Wald-, Leerkachel, ausserhalb → `null` (`tests/ui/pipette.test.ts`)
- **AK-TK-15** `hotkeyAction`: (`'U'`, shift) → `{ kind: 'upgrade' }`; (`'u'`, ohne shift) und (`'U'`, ohne shift, Feststelltaste) → Schule; (`'U'`, shift+ctrl), shift+meta, shift+alt → `null`; im Formularfeld → `null` (`tests/ui/hotkeys.test.ts`)
- **AK-TK-16** `hotkeyAction` mit shift für jede andere Werkzeugtaste liefert dasselbe wie ohne shift (z. B. `'H'` → Wohnhaus); `'?'` → Hilfe; `'P'` → Pause; bestehende Aufrufe ohne shift unverändert (`tests/ui/hotkeys.test.ts`)
- **AK-TK-17** `hotkeyList`: «Umschalt + U» fehlt in frischer Welt, erscheint nach Freischaltung `upgrade2`; «U» Schule bleibt (sofern Schule sichtbar) (`tests/ui/hotkeys.test.ts`)
- **AK-TK-18** `upgradeTarget`: `none` und `trade` → `reason === 'Kein Gebäude markiert'`; `inspect` mit vorhandener ID → `{ ok: true, id }`; mit entfernter ID → `reason` (`tests/ui/hotkeys.test.ts` [Tech: Datei])
- **AK-TK-19** NAV_KEYS enthält «Strg/Cmd + Klick auf Gebäude» (`tests/ui/hotkeys.test.ts`)
- **AK-TK-20** Regression: `make test` grün inkl. `tests/sim/balance.test.ts`; `git diff main -- src/sim` leer; `SAVE_VERSION` unverändert (Gesamtlauf, Prüfung lead-qa)

### 10.2 Browser (qa-playtester, Headless-Chrome)

- **AK-TK-21** Tempo 2×, Fokus auf Karte, Leertaste ca. 100 ms tippen → Kopfzeile `⏸` aktiv; erneut tippen → `2×` aktiv.
- **AK-TK-22** Leertaste halten, linke Maus 200 px ziehen, loslassen → Kamera verschoben, Tempo unverändert. Leertaste 1 s halten ohne Maus → Tempo unverändert. Leertaste halten + Klick ohne Ziehen (< 300 ms) → Tempo unverändert, nichts gebaut.
- **AK-TK-23** Knopf per Tab fokussieren (z. B. «Menü»), Leertaste → Knopf aktiviert, Tempo unverändert. Bei offener Karte (Menü): Leertaste → Tempo unverändert.
- **AK-TK-24** Werkzeug «Auswahl», Strg+Klick (Linux/Win-Emulation) bzw. Cmd+Klick auf eine Fischerhütte → Werkzeug Fischerhütte: Eintrag in der Bauleiste hervorgehoben, Platzier-Vorschau unter dem Zeiger, Panel zu, Geld unverändert.
- **AK-TK-25** Werkzeug «Abriss», Strg+Klick auf Holzfäller → Werkzeug Holzfäller, Holzfäller steht noch. Werkzeug «Weg», Strg+Klick auf Leerkachel → kein Weg, kein Werkzeugwechsel, keine Meldung.
- **AK-TK-26** Spielstand mit einem Gebäude gesperrten bzw. ausgeblendeten Typs (Testwelt): Strg+Klick → Meldung «{Name}: {Grund}», Ton `error`, Werkzeug unverändert.
- **AK-TK-27** Strg+Klick auf das Heimatkontor → Meldung «Kontor lässt sich nicht nachbauen», kein Handel-Panel, Werkzeug unverändert.
- **AK-TK-28** Info-Panel der Fischerhütte: Knopf «Gleiches bauen» mit Tooltip «… (Strg/Cmd+Klick auf ein Gebäude)»; Klick → Werkzeug Fischerhütte, Panel zu. Panel Kontor II: kein Knopf. Wohnhaus-Panel: Knopf vorhanden.
- **AK-TK-29** Ausbau freigeschaltet, genug Mittel, Fischerhütte markiert, `Umschalt+U` → Panel zeigt «Stufe 2», Ton `build`, Geld um die Ausbaukosten gesunken. Zweites `Umschalt+U` ohne Mittel → dieselbe Meldung wie Knopf «Ausbauen».
- **AK-TK-30** Wohnhaus markiert, `Umschalt+U` → «Kann nicht ausgebaut werden». Nichts markiert → «Kein Gebäude markiert». `U` allein → Werkzeug Schule bzw. deren Sperrgrund. Tooltip «Ausbauen (Umschalt+U)».
- **AK-TK-31** Mittlere Maustaste ziehen (auch mit Strg) → Kamera verschoben, kein Werkzeugwechsel. Leertaste halten + Strg+Klick ziehen → Kamera verschoben, kein Werkzeugwechsel. Rechtsklick → Werkzeug «Auswahl».
- **AK-TK-32** Touch-Emulation: Tippen auf ein Gebäude im Werkzeug «Auswahl» öffnet das Panel wie bisher; Zwei-Finger-Geste schwenkt wie bisher.
- **AK-TK-33** Menü «Tastenkürzel» zeigt «Leertaste (antippen)», «Strg/Cmd + Klick auf Gebäude» und (nach Ausbau-Freischaltung) «Umschalt + U».
- **AK-TK-34** README (Abschnitt 12) entspricht dem Verhalten (Prüfung lead-qa beim Gate Code).

## 11. Umsetzungsvorschlag

Ein Branch, vier Tasks; reine Helfer zuerst (TDD), Verdrahtung danach.

1. **T1 Helfer A+C (rein):** `src/ui/spaceTap.ts`, `spaceKeyRole`, `hotkeyAction` mit shift und `{ kind: 'upgrade' }`,
   `upgradeTarget`, `NAV_KEYS`/`hotkeyList`-Einträge. AK-TK-01 bis 09, 15 bis 18.
2. **T2 Helfer B (rein):** `src/ui/pipette.ts`, `isPipetteClick`, NAV-Eintrag Pipette. AK-TK-10 bis 14, 19.
3. **T3 Verdrahtung `input.ts`/`app.ts`:** Leertaste-Tippen (keydown/keyup/pointerdown/blur), Pipetten-Zweig in
   `onPointerDown` vor dem Drag-Aufbau (neue `InputAction`, z. B. `{ type: 'pipette'; island; x; y }` [Tech]),
   `onHotkey` für `upgrade`, gemeinsame Ausbau-Funktion. AK-TK-20 bis 27, 29 bis 32.
4. **T4 Panel, Tooltips, README:** Knopf «Gleiches bauen» (`InspectActions.buildSame`), Tooltip «Ausbauen
   (Umschalt+U)», README laut Abschnitt 12. AK-TK-28, 30, 33, 34.

## 12. Doku-Pflichten

- **README «Tastatur und Maus»** (Z. 124–144): Zeile «Leertaste (halten)» wird «Leertaste antippen: Pause an/aus;
  halten + Ziehen: Karte verschieben»; Zeile `P` bleibt; neue Zeile «`Umschalt+U` — Markiertes Gebäude ausbauen
  (wie «Ausbauen»)»; neue Zeile «Strg/Cmd + Linksklick auf Gebäude — dessen Typ als Bauwerkzeug wählen (Pipette)».
- **Hinweis unter der Tabelle:** «Hotkeys wirken nur ohne Strg, Cmd oder Alt; Gross- und Kleinschreibung ist egal»
  gilt nur noch für die **Werkzeugtasten**; `Umschalt+U` und Strg/Cmd+Klick als ausdrückliche Ausnahmen nennen.
- **README Z. 77** (Verschieben): Leertaste halten + Ziehen bleibt; Antippen pausiert.
- **README Z. 267** (Info-Panel): Knopf «Gleiches bauen» und `Umschalt+U` beim Knopf «Ausbauen» nennen.
- `docs/arc42.md`: keine Pflicht (keine neuen Module ausserhalb `src/ui/`, kein Tick-/Persistenz-Bezug); lead-tech
  prüft, ob die UI-Bausteinliste neue Dateien aufführt.

## 13. Offene Designfragen

- **OF-1 Pause durch Antippen schliesst das Info-Panel?** Empfehlung: **nein**; Pause ändert nur das Tempo, wie `P`.
- **OF-2 Kontor II (`kontor2`) per Pipette/«Gleiches bauen»?** `categoryOf` schliesst nur `kontor` aus, `kontor2` hat
  ein Werkzeug (Bauleiste, nur Fremdinseln). Die Spec setzt: wie Kontor behandeln (B-4). Empfehlung: **so lassen**;
  auf der angeklickten Insel steht schon ein Kontor, ein Werkzeug dort führt nur zu einer Platzier-Ablehnung, und der
  Name «Kontor» passt zur Meldung.
- **OF-3 Tooltip am Pause-Knopf `⏸`?** Heute ohne Tooltip. Empfehlung: **ja**, `title` «Pause / weiter (P oder
  Leertaste antippen)» in T4 aufnehmen (eine Zeile, Browser-Check in AK-TK-33 ergänzen); sonst Beobachtung.
- **OF-4 Plattformprüfung macOS:** Ob Strg+Klick in Safari/Firefox auf macOS `pointerdown` mit `button 0` liefert,
  ist im Headless-Chrome nicht prüfbar. Empfehlung: Cmd+Klick als dokumentierter Hauptweg auf macOS; Chrome-Check
  in AK-TK-24 genügt fürs Gate, Abweichungen anderer Browser als Beobachtung.
