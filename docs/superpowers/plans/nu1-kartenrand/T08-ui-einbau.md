# T08 · UI-Einbau: Karte, Dialoge, HUD, Seekarte, Liste

Strang B · Persona `tech-ui-engineer` · Modell sonnet · ≈ 75 Tools · blocked-by: T07 · AK-NU1-31, -32, -47, -48, -49, -50, -51 (Einbau; Abnahme im Browser durch T10)
Spec §5 (ganz), §3.9 Punkt 5 (Leseorte), Anhang 02 §5 Spalte «Leseort», §8.5. Desktop-first ab 1280 px (CLAUDE.md).

**Testsperre: Last ≤ 4 nötig** (`make messfenster`), sonst `waiting`.

**Files (alle grossen Dateien nur abschnittsweise per `rg -n`):**

- Modify: `src/ui/inspect.ts` (45 KB; Gebäudekarte Kartenhaus, Abriss-Knopf), `src/ui/app.ts` (72 KB; Aktionen, Dialoge, Log-Anbindung, Esc), `src/ui/hud.ts` (36 KB; Chip «Expedition: Karte wartet»), Seekarten-Popover «Inseln» (Fundstück-Liste; Ort per `rg -n "seaMapKey|Inseln" src/ui`), `src/ui/ships.ts` (Leseort F1/F2, Zustand «auf Expedition»), Ort der Zyklusanzeige (`src/ui/panelView.ts`, Leseort F3/F6/F8), Reichweiten-Tooltip (`src/ui/hover.ts`, F4/F5), `src/render/renderer.ts` (44 KB; ≈ 958 Schiffs-Posen ohne `expeditionShipAway`), `src/style.css`
- Create: `src/ui/expeditionDialog.ts` (DOM: Packansicht und Kartendialog, nur Darstellung der Modelle aus T07)
- Tests: `tests/ui/expeditionDialog.test.ts` mit `tests/ui/fakeDom.ts` (Bestand-Muster), nur Verdrahtung

**Interfaces:**

- Consumes (T07): `packView`, `cardView`, `maphouseView`, `expeditionStatusText`, `findListView`, `chronicleLine`, `expeditionSnap`, `expeditionLogEntries`, `noticeTexts`, `fogFields`, `expeditionMark`; (Sim) `startExpedition`, `chooseOption`, `cancelExpedition`, `demolish`, `findNote`.
- Produces: keine Sim-Schnittstelle. `src/render/` schreibt nie in die Welt.

## Einbau

1. **Kartenhaus-Karte** (§5.1): `maphouseView` in der Gebäudekarte; Knopf «Expedition ausrüsten» (gesperrt mit `startReason`-Grund Nr. 1–3), im Wartezustand «Abbrechen» → `cancelExpedition`, Verfall aus `lost` als Meldung; Abriss-Knopf zeigt während einer Expedition «Erst Expedition beenden» (Grund aus `demolish`, AK-49).
2. **Packansicht** (§5.2): Dialog aus `packView`; −/+ je Gut (Schritt 1, mit Umschalt 5); Balken «n / 50», voll in Warnfarbe; Hinweis-Waren hervorgehoben; Auslaufen gesperrt mit `launchReason` (kein stilles Scheitern).
3. **Kartendialog** (§5.3, §8.7): öffnet nicht modal bei Phasenwechsel nach `card`; HUD-Chip «Expedition: Karte wartet» nur in `card`, Klick öffnet erneut; `Esc` schliesst ohne Wahl (Karte bleibt offen, Chip bleibt, AK-51); Optionen aus `cardView`, gesperrt grau mit Grund; Wahl auch in der Spielpause möglich, ohne den Tick fortzuschreiben (AK-50).
4. **Seekarte** (§5.5): Nebelfelder aus `fogFields`, Marke aus `expeditionMark`, Tooltips aus `seaMapTip`; Expeditionsschiff weder in `mapDots` noch in der Weltansicht (`renderer.ts` filtert `expeditionShipAway`).
5. **Fundstück-Liste** (§5.4) im Popover «Inseln»; Inselchronik-Zeile `chronicleLine`.
6. **Log und Meldungen** (§5.6, §3.11): `expeditionLogEntries` im Ereignis-Log (Muster `autoLog.ts`: Schnappschuss je Frame, Vergleich nach `step`); `noticeTexts` aus den `StepReport`s wie `lossMessages`.
7. **Leseorte** (Anhang 02 §5): Zusatz `findNote(…)` an Routen-Dialog und Fahrzeit der Schiffsliste (F1), Zeile «Güter je Richtung» (F2, Wert `routeGoodsPerDirection`), Zyklusanzeige Holzfäller/Werkzeugmacher/Schäferei (F3/F6/F8), Reichweitenkreis Badehaus und Fremdkontor (F4/F5), Lageranzeige Kontor (F7, schon T07).
8. **Speichern/Laden** (`src/ui/storage.ts` unverändert): nach dem Laden bei `phase 'card'` Dialog wieder offen bzw. Chip sichtbar (AK-47).
9. **Platzhalter-Sprite** des Kartenhauses aus T01 bleibt; NU1-ART ersetzt ihn (anderes Paket).

## Tests (Vitest, `tests/ui/expeditionDialog.test.ts`)

- Packansicht: Klick «+» bei Holz erhöht `n / 50`; Auslaufen-Knopf `disabled` mit `title` = `launchReason`.
- Kartendialog: `Esc` schliesst, `world.expedition.phase` bleibt `'card'`; Klick auf gesperrte Option ruft `chooseOption` nicht auf.
- Kartenhaus-Karte: Abriss-Knopf trägt «Erst Expedition beenden» bei Expedition; «Abbrechen» nur in `boarding`.

## Schritte

- [ ] Tests schreiben; **Rot:** `npx vitest run tests/ui/expeditionDialog.test.ts; echo EXIT=$?` → ≠ 0.
- [ ] Einbau 1–9.
- [ ] **Grün:** derselbe Befehl → 0; `npx vitest related --run src/ui/inspect.ts src/ui/hud.ts src/ui/app.ts src/render/renderer.ts --maxWorkers=2; echo EXIT=$?` → 0 (Last ≤ 4).
- [ ] Sichtprüfung lokal (`make dev` laut `make help`): ein Screenshot je Dialog bei 1280 px unter `.studio/qa/NU-1/dev/` (nicht versioniert), Befund an den Controller; die Abnahme macht T10.
- [ ] Teilbeleg: `npx tsc --noEmit; echo EXIT=$?`, `make lint; echo EXIT=$?`, `make zeittests; echo EXIT=$?`, `make conflicts; echo EXIT=$?`.
- [ ] Commit `feat: NU-1 Kartenhaus-Karte, Packansicht, Kartendialog, Seekarte (T08)`. Danach meldet der Controller «B bereit»; Merge B → A vor T09.
