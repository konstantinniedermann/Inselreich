> **Task-ID:** Task 8 (Paket M10-U3) — Teil 2 von 2
> **AK-IDs:** AK-U3-01, -02, -03, -06 (Vitest); AK-U3-04, -05 in QA-U3
> **blocked-by:** Task 7 (Review OK)
> **Gemeinsame Regeln:** [index.md](index.md) (Global Constraints) · Orga: [orga-06-schnittstellen.md](orga-06-schnittstellen.md) · [orga-07-datei-ownership.md](orga-07-datei-ownership.md)
> **Teile:** [T08a-mouse-over.md](T08a-mouse-over.md) · **T08b-mouse-over.md** (diese)

- [ ] **Schritt 2: Rot prüfen.** `npx vitest run tests/ui/hover.test.ts` → FAIL (`Cannot find module
'../../src/ui/hover'`). Vor der Umsetzung grün erlaubt: keiner.
- [ ] **Schritt 3: Umsetzung.** `hover.ts` nach Spec 13.2 (Priorität Tier > Schiff > Gebäude > Gelände; Gebäude über
      `world.tiles[…].buildingId`; Texte wörtlich); `renderer.ts`: `wildlifeEnvOf` exportieren und an der Stelle
      `wildlifeAt(world, wildRange, fx.timeMs, { … })` verwenden (Bild unverändert; `tests/render/renderer.test.ts`
      bleibt grün); `app.ts`: je Frame Zeiger-Kachel (Picking wie `pickBuilding`/`targetTile`), Ruhezeit, `extra.ship`
      aus dem Schiffs-Picking, `extra.animal` = Name des getroffenen Tiers aus `wildlifeAt(world, range,
fx.timeMs, wildlifeEnvOf(world, fx))` mit **derselben** `fx` wie `render()` im selben Frame; Karte als
      `div.hover-card` (`role="tooltip"`), Position `hoverPosition`; `style.css`: Karte im Card-Stil (bestehende
      Tokens, keine neuen Farben, Kontrast wie Tooltips).
- [ ] **Schritt 4: Grün prüfen.** `npx vitest run`; `make check`; Sicht-Probe; Commit
      `git commit -m "feat: M10-U3 Mouse-over für Gebäude, Gelände, Schiff und Tiere (Spec 13)"`.

---
