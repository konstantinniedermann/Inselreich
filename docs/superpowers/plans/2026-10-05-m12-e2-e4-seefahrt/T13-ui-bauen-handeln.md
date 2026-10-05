> **Task-ID:** T13 · **AK-IDs:** Spielweg zu AK-E2-01 … -05, -12 … -14 (Sim-AK in T03/T04); AK-E3-07 Browser-Teil
> (Lade-Meldung, lead-qa R230)
> **blocked-by:** T12, **T10 (Review OK, per Merge `feat/m12-see-render` → `feat/m12-see-e2`)** · **Strang:** e2,
> `.worktrees/m12-see-e2` · `tech-ui-engineer` (sonnet), danach `qa-playtester`
> **Regeln:** Spec Anhang 03 C.2–C.5; Anhang 03 D (Meldung beim Laden); Index P-6

## T13: UI — Bauen, Handeln und Liefern auf Fremdinseln; Lade-Meldung

**Ziel:** Der Spieler gründet per Bauleiste ein Kontor auf der Felsbucht, baut dort, handelt am neuen Kontor und
liefert Aufträge aus dem Insellager. Ein alter Stand mit Kaufleuten meldet beim Laden einmal den Gewürz-Wunsch.

**Code-Fakten (nach T12 und Merge `render`):** `ui/input.ts`/`app.ts` Bau-Klick → `placeBuilding(world, defId, x, y)`
(Heimat); `connect.ts`/`ui/connect.ts` Anbinden; Wege-Werkzeug; `inspect.ts` `renderInspect` (`b.defId === 'kontor'`
→ „Handeln"); `ui/trade.ts` `renderTrade(panel, world, actions)` (Heimatlager); `ui/order.ts` Liefern →
`deliverOrder(world)`; `storage.ts` Laden → `deserialize` (`LoadResult.notice`, T01); `render` `hover { island, … }`
(T10); `pickArchipel`; aktive Insel (T12); Sim: alle Aktionen mit `island`-Parameter (E0, T03, T04).

**Dateien:** `src/ui/app.ts`, `input.ts`, `hover.ts`, `inspect.ts` (nur Kontor-Zweig), `trade.ts`, `order.ts`,
`storage.ts` bzw. Lade-Pfad in `app.ts`, `messages.ts`; Tests `tests/ui/trade.test.ts`, `order.test.ts`, ggf. neu
`tests/ui/islandTools.test.ts`.

## Regeln (verbindlich)

- **Zielinsel jedes Bau-, Weg-, Forst- und Abriss-Klicks** = `pickArchipel(...).island`; Koordinaten inselintern.
  Aktionen bekommen `island`; Gründe der Sim unverändert anzeigen. Vorschau: `hover` mit `island` an den Renderer.
  Klick auf Meer: nichts.
- **Bauleiste** bezieht Freischaltung und Kosten-Tooltip auf die aktive Insel: `kontor2` mit Kosten „aus der
  Heimat"; auf einer Insel ohne Kontor sind alle anderen Werkzeuge blass mit „Erst ein Kontor auf dieser Insel"
  (Grund aus `canPlace` mit der Insel unter dem Zeiger, sonst der aktiven Insel).
- **Kontor-Panel:** `isKontor(b.defId)` → „Lagerkapazität …" und „Handeln"; Handel öffnet `renderTrade` für
  `b.island` (Titel „Handel · <Name>"); Kauf/Verkauf mit `island`. Abriss-Knopf nur bei `kontor2`
  (Grund „Erst Route auflösen" aus der Sim).
- **Auftragskarte „Liefern"** liefert auf der aktiven Insel (`deliverOrder(world, aktiv)`), Knopftext nennt den Namen
  ausserhalb der Heimat („Liefern · Felsbucht").
- **Lade-Meldung:** liefert `deserialize` `notice`, erscheint sie einmal als Meldung (bestehender Meldungsweg wie
  Auftrags-/Krisenmeldungen). Nichts wird gespeichert; erneutes Laden desselben (v9-)Standes meldet nichts.
- `src/ui/` enthält keine Spielwerte; Texte der Gründe kommen aus der Sim.

## Schritte

- [ ] **1 Tests zuerst** (reine Helfer, `describe('M12 E2 UI Bauen und Handeln')`):
  - `islandTools.test.ts`: `toolTarget(pick, active)` → Insel und Koordinaten; Meer → `null`; Bauleisten-Grund auf
    Insel ohne Kontor = „Erst ein Kontor auf dieser Insel", für `kontor2` = kein solcher Grund.
  - `trade.test.ts`: `tradeRows(world, island)` liest das Insellager; `tradeTitle(world, 2)` = „Handel · Felsbucht".
  - `order.test.ts`: `deliverLabel(world, 0)` = heutiger Text, `(world, 2)` = „Liefern · Felsbucht".
  - Lade-Meldung: reiner Helfer `loadNotice(result)` → Text oder `null`.
- [ ] **2 Rot-Beleg** → Commit `test: M12 E2 UI Bauen und Handeln auf Fremdinseln (rot)`.
- [ ] **3 Basis/Umsetzung:** zuerst `git merge feat/m12-see-render` (SHA „T10 OK"), `make check` grün; dann umsetzen
      → `make check`, `CI=true make check` → Commit `feat: M12 E2 Bauen, Handeln, Liefern auf Fremdinseln`.
- [ ] **4 Browser-Check `qa-playtester`** (`.studio/qa/M12-SEE/T13/`, 1280 × 800, Seed 3, „Alles frei"): Kamera auf
      Felsbucht; Holzfäller → blass „Erst ein Kontor auf dieser Insel"; `kontor2` an der Küste bauen (Kosten aus der
      Heimat, Geld −800); Holzfäller ohne Holz im Insellager → „Nicht genug Holz auf Felsbucht"; am neuen Kontor 20 Holz
      kaufen, Holzfäller + Weg bauen, angebunden; Auftrag „Liefern · Felsbucht" ohne Ware → Grund; Gebäude auf der
      Insel sichtbar (T10). **Lade-Meldung:** `tests/sim/fixtures/save-v8.json` in den Speicherplatz legen, laden →
      Meldung einmal; speichern, neu laden → keine Meldung.

**Review-Fokus:** jeder Klick trägt die richtige Insel; Heimat-Bedienung unverändert; Handel/Liefern am richtigen
Lager; Meldung einmalig und nicht im Save.
