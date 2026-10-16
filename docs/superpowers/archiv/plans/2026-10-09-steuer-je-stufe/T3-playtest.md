# T3 Browser-Check (`qa-playtester`)

Plan-Index: [../2026-10-09-steuer-je-stufe.md](../2026-10-09-steuer-je-stufe.md). AK-IDs: AK-T34–T41, AK-T36 + QA-d + QA-f — Wortlaut Spec §8.5 und Anhang 02 (geht vor). Ändert keinen Code; Befunde gehen als Fix-Runde an `tech-ui-engineer` (SendMessage durch den Controller), danach Nachprüfung derselben AK.

**Szene:** Testwelt `createWorld(3, { unlockAll: true })`, aktive Amtsstube, je ein Haus der Stufen 1–4, über das Szenenskript unter `.studio/qa/steuer-je-stufe/` (nicht im Repo-Code). Screenshots `.studio/qa/steuer-je-stufe/<ak>-<breite>x<höhe>.png` bei 1280×720 und 1920×1080; AK-T41 bei 800×600. Konsole je Lauf mitschneiden.

## Schritte

- [ ] **AK-T34:** Zeile «alle Stufen» + 4 Zeilen × 3 Knöpfe, je Zeile «… / min»; alles «normal» hervorgehoben; Panel `scrollWidth ≤ clientWidth`.
- [ ] **AK-T35:** Kaufleute «niedrig» `disabled`, Hover «Kaufleute steigen nicht auf»; Hover Kaufleute «hoch» «115 % · 15 Einwohner».
- [ ] **AK-T36 + QA-d + QA-f (H-3, H-4):**
  1. Vor dem Klick: `window.__probe = <Knopf Pioniere «niedrig»>; __probe.dataset.probe = '1'; __probe.focus()`.
  2. Klick Pioniere «niedrig»: nur die Pioniere-Zeile zeigt «wieder änderbar in 30 s» und zählt herunter.
  3. Klick Siedler «hoch» gelingt sofort; danach Fokus wieder auf `__probe` setzen.
  4. Mindestens 20 Ticks laufen lassen (Countdown hat sich geändert). Erwartet: `document.contains(window.__probe) === true`, `window.__probe.dataset.probe === '1'`, `document.activeElement === window.__probe`; das Raster hat genau **15** Steuer-Knöpfe (`[data-tax]`, 3 + 4 × 3).
  5. Kopfzeilen-Knopf zeigt «gemischt», Tooltip «P niedrig · S hoch · B normal · K normal»; in «alle Stufen» ist kein Knopf hervorgehoben.
  6. Panel-Zeile `[data-field="tax-effect"]` hat exakt den Text «Steuer gemischt: P niedrig · S hoch · B normal · K normal»; `document.querySelector('[data-field="tax-lock"]') === null`.
- [ ] **AK-T37:** in der Sperre Klick «alle Stufen: normal» → Meldung «Steuer für Pioniere erst in … wieder änderbar»; Hervorhebungen unverändert.
- [ ] **AK-T38:** nach Ablauf der Sperren «alle Stufen: niedrig» → Pioniere bis Bürger «niedrig», Kaufleute «normal», «alle Stufen: niedrig» hervorgehoben, Kopfzeile «niedrig».
- [ ] **AK-T39:** Mouse-over Bürger-Haus bei Bürger «hoch» → «Steuer: hoch» und Aufstiegsgrund «Steuer ‚hoch' für Bürger verhindert den Aufstieg».
- [ ] **AK-T40:** Ereignis-Chronik vor und nach einem Umschalten gleich.
- [ ] **AK-T41:** 800×600: Raster ohne Überlappung, Panel ohne waagrechtes Scrollen, Konsole ohne Fehler.

**Bericht:** Schlussbericht = Playtest-Report (je AK bestanden/nicht, Screenshot-Pfad, Konsolenbefund); kein eigener Report-Pfad.
