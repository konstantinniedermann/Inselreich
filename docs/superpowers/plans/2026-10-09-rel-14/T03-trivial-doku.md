# T03 · Trivial-Fixes und Doku

Strang A · Worktree `.worktrees/rel-14-inspektor` · Branch `fix/rel-14-inspektor` · Umsetzer: T01-Umsetzer per SendMessage fortgesetzt (`tech-ui-engineer`, sonnet; sonst frischer Start) · AK-Entwürfe A9, C1–C6 (`ak-entwuerfe.md`) · blocked-by T01 (Review OK), T02 (Review OK, nur für die Fest-Sätze)

**Ziel:** Fünf Trivial-Fixes aus R422/R423 und die Doku zu T01/T02. Jeder Punkt ist ein eigener Commit. Doku-Dateien (D1) sind für diesen Task ausdrücklich freigegeben (E-017).

**Files (nur diese):**

- Modify: `.gitignore`
- Modify: `src/render/decorStamps.ts` (Z. ~197–213 `stampWidthPx`, `FAR_MIN_CSS_PX`, `minStampScale`; Z. ~1114–1121 in `drawDecorStamp`)
- Modify: `tests/render/decorSea.test.ts` (Importe Z. ~28–29; Test „T6 Wrack und Felseiland … 10 CSS-px“ Z. ~261–272)
- Modify: `docs/arc42.md` (Zeilen `feast.ts` ~175, `hud.ts` ~265, `taxView.ts` ~275)
- Modify: `README.md` («Fest feiern» ~Z. 111–114, «Bedarfssymbole» ~Z. 169–171, Abschnitt «Aufstieg» Absatz «Das Info-Panel eines Wohnhauses zeigt …» ~Z. 446–448)
- Modify: `docs/superpowers/specs/2026-10-06-lebendige-insel.md` (§5 Punkt «Fernansicht», ~Z. 298–299)
- Modify: `docs/beobachtungen.md` (nur neuer Eintrag am Dateiende, Abschnitt «Offen»)

## Schritte

- [ ] **Schritt 1 (C1): `.gitignore`** — Zeile `.vitest/` nach `.worktrees/` einfügen.

```bash
git add .gitignore && git commit -m "fix: .vitest/ ignorieren (REL-14)"
```

- [ ] **Schritt 2 (C3): toter Fern-Code in `decorStamps.ts`, Test zuerst**

Begründung (bildneutral): `minStampScale` ist nur bei Zoom ≤ 0,25 grösser als 1, und nur für `wreck`/`islet`; beide zeichnet `drawDecorStamp` erst ab `DECOR_MIN_ZOOM` = `SEA_ELEMENT_MIN_ZOOM` = 0,5 (REL-07). Der Faktor `k` ist in jedem gezeichneten Fall 1.

(a) `tests/render/decorSea.test.ts`: den Test „T6 Wrack und Felseiland haben bei Zoom ≤ 0,25 mindestens ≈ 10 CSS-px Breite …“ löschen und `minStampScale`, `stampWidthPx` aus dem Import entfernen. Der folgende Test „Zoomschwellen und Fern-Pfad“ (zählt `drawImage` je Art bei Zoom 0,25 und 0,5) bleibt und sichert die Schwelle.
(b) Rot-Probe: `grep -rn "minStampScale\|FAR_MIN_CSS_PX\|stampWidthPx" src/ tests/` → noch Treffer in `src/render/decorStamps.ts` (Erwartung des Tasks: 0).
(c) `src/render/decorStamps.ts`: `stampWidthPx`, `FAR_MIN_CSS_PX`, `minStampScale` samt JSDoc löschen. In `drawDecorStamp` die Zeile `const k = minStampScale(…)` löschen und `* k` an allen vier Stellen der `drawImage`-Argumente streichen:

```ts
const f = z / step;
ctx.drawImage(
  stamp,
  p.x + STAMP_BOX.x0 * z,
  p.y + STAMP_BOX.y0 * z,
  stamp.width * f,
  stamp.height * f,
);
```

Wird `wreckGeom` danach nirgends mehr gebraucht, meldet ESLint/tsc es; dann nur melden, nicht weiter aufräumen (Zeichner nutzt es voraussichtlich weiter).
(d) Grün: `npx vitest run tests/render/decorSea.test.ts tests/render/decorStamps.test.ts tests/render/decor.test.ts; echo EXIT=$?` → EXIT=0; `grep` aus (b) → 0 Treffer; `npx tsc --noEmit; echo EXIT=$?` → 0.

```bash
git add src/render/decorStamps.ts tests/render/decorSea.test.ts
git commit -m "refactor: toten Fern-Code minStampScale entfernen, bildneutral (R423, REL-14)"
```

- [ ] **Schritt 3 (C2, C6): arc42**

- Zeile `hud.ts`: „… zweite Zeile Lager mit Warenbilanz (Dauerleistung, R115) und Steuersperre in Spielzeit.“ → „… zweite Zeile Lager mit Warenbilanz (Dauerleistung, R115).“
- Zeile `taxView.ts`: nach `taxLockText` ergänzen: „(Steuersperre in Spielzeit, angezeigt im Amtsstuben-Panel)“.
- Zeile `feast.ts`: nach `feastActive (kürzt die Aufstiegs-Wartezeit auf «niedrig»)` ergänzen: „; Fest und Steuerprüfung zählen nur Häuser der Kapellen-Insel (`inChapelRadius` mit Inselvergleich, REL-14)“.

- [ ] **Schritt 4 (A9, C6): README**

- «Fest feiern»: „steigen Wohnhäuser im Wirkkreis der Kapelle schneller auf“ → „steigen Wohnhäuser im Wirkkreis der Kapelle auf derselben Insel schneller auf“; „Ohne Wirkung, wenn im Umkreis kein Haus mit Steuer «normal» wohnt“ → „… wenn im Umkreis auf der Insel der Kapelle kein Haus mit Steuer «normal» wohnt“.
- «Bedarfssymbole»: „(Versorgung vor Ware vor Dienst)“ → „(ausserhalb der Versorgung vor Ware vor Dienst)“.
- «Aufstieg», Absatz «Das Info-Panel eines Wohnhauses zeigt …» neu:

> Die Einwohnerzahl bleibt beim Aufstieg erhalten. Das Info-Panel eines Wohnhauses zeigt Einwohner, die Versorgung
> («Im Versorgungsradius», wenn ein Kontor oder angebundener Marktplatz in Reichweite liegt, sonst «Ausserhalb der
> Versorgung»), Bedürfnisse mit ✓/✗, die Mängel («Mangel: Nahrung fehlt», «Mangel: Kapelle fehlt», in derselben
> Reihenfolge wie das Kartensymbol), jede noch fehlende Aufstiegsbedingung und die Kosten.

(Wortlaut „Kapelle fehlt“ nach Gate-Entscheid E1; bei der Alternative „Kapelle fehlt in Reichweite“.)

- [ ] **Schritt 5 (C4): Spec §5 «Fernansicht»**

Ersetzen durch: „**Fernansicht:** Bei Zoom ≤ 0,25 nur, was ins Bodenbild bzw. in die Viertel-Kopie gerastert ist, plus Meeresfelsen als Stempel (Orientierung). Wrack und Felseiland erscheinen erst ab Zoom 0,5 (`SEA_ELEMENT_MIN_ZOOM`, Stand REL-07; ihre frühere Mindestbreite in der Fernansicht ist entfallen, R423). Kleinstempel (A9, A14) erst ab 0,75.“

- [ ] **Schritt 6 (C5): Beobachtungen** — am Dateiende anhängen:

```markdown
### 2026-10-09 · ART-FELS-FERNGROESSE abgehakt (R423)

- **Fundort:** `src/render/decorStamps.ts` (Meeresfels, Zoom 0,25 ≈ 5–6 px). Urteil `lead-art` NEIN: Der Meeresfels bleibt massstabstreu (reine Deko ohne Sim-Bezug; Bildrangfolge Schiff 16 px vor Fels; Blindprobe bestanden). Ursprung: Release-Check REL-11, BEOB-AUSW-03. Einschätzung: abgehakt; der tote Fern-Code (`minStampScale`) ist in REL-14 entfernt.
- **Trigger für eine Neubewertung:** (1) Felsen bekommen eine Spielwirkung; (2) ein Playtest vermisst Felsen in der Fernansicht; (3) die Schiffs-Mindestgrösse oder der kleinste Zoom ändert sich.
```

- [ ] **Schritt 7: Prüfen und Doku-Commit**

Run: `make docs-check; echo EXIT=$?` → 0 (sonst `npx prettier --write` nur auf die geänderten Doku-Dateien, erneut prüfen).
Run: `grep -n "Fehlt:" README.md` → nur Z. ~31 (Inselchronik, `goal.ts`, Gate-Entscheid E5); `grep -n "Steuersperre" docs/arc42.md` → nicht in der Zeile `hud.ts`.

```bash
git add docs/arc42.md README.md docs/superpowers/specs/2026-10-06-lebendige-insel.md docs/beobachtungen.md
git commit -m "docs: REL-14 Versorgungs-Chip, Fest je Insel, arc42 hud/taxView, Spec Fernansicht, ART-FELS abgehakt"
```

## Bericht an den Controller

Commit-Hashes je Schritt, Exit-Codes (vitest, tsc, docs-check), grep-Ergebnisse, Abweichungen.
