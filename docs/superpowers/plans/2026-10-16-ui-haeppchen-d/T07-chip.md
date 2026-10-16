# T07 · Chip-Suffix, Tooltip, `refresh()`, CSS (I-109, Teil B)

Umsetzer `tech-ui-engineer` · ≈ 50 Tools · AK-UR-04 bis 09 · blocked-by: T06

## Dateien

- ändern: `src/ui/hud.ts` (`chipView`, `stockTooltip`, Chip-Schleife in `updateHud`, `TREND_EPS` aus `reach.ts` importieren), `src/style.css` (`.reach-warn`, `.reach-alarm`, `.reach-full`), `tests/ui/hud.test.ts`
- Berührung mit Handel 2: `goodsBalance` nimmt keine Fernhandel-Flüsse auf; Reichweite zeigt Inselerzeugung (Tooltip-Zusatz «ohne Handel und Aufträge»). Handel 2 ist auf main; vor dem Start `git diff main -- src/ui/hud.ts` mit dem Plan-Stand vergleichen.

## Verhalten

- `chipView`: Text «{Bestand} {Pfeil}» unverändert; mit `warn`/`alarm` Suffix «↓ <Zeit>» (leer), «↑ <Zeit>» (voll, nur `warn`), Bestand 0 mit net < 0: «0 ↓ leer». Zeit = `formatGameTime(ticks)`. `label` (zugänglicher Name) enthält den Suffix. `ChipView` bekommt ein optionales Feld `reach?: 'warn' | 'alarm' | 'full-warn'` für die Klasse.
- `updateHud` setzt die Klassen `reach-warn`/`reach-alarm`/`reach-full` nur bei Änderung (`classList.toggle`-Muster wie `negative`); Farbe nie allein (Text und Pfeil bleiben); voll nie rot.
- `stockTooltip`: Zeile vor `focusLine`: «Leer in 2:10 bei −6,0 / min (ohne Handel und Aufträge)» bzw. «Voll in 40 s bei +3,0 / min (…)»; bei `→` oder Sättigung keine Zeile; immer, auch ausserhalb der Schwelle.
- Fallback laut R654: bei Platzproblem Suffix streichen, Tooltip und Farbe behalten.

## Testfälle (rot zuerst)

- **AK-UR-04** `chipView` ohne Schwelle: Text «12 ↓», `label` unverändert; mit Schwelle Suffix, `label` enthält ihn.
- **AK-UR-05** `stockTooltip` enthält «Leer in …» bzw. «Voll in …» mit Rate je Minute und «ohne Handel und Aufträge»; bei `→` keine Zeile.
- **AK-UR-06** Pause/Tempo: zwei `updateHud` ohne Tick liefern gleiche Texte und Klassen; `state.speed` 1/2/4 ändert die Anzeige nicht (Test über die reine Ansicht, nicht über Zeit).
- **AK-UR-07, 08** (Browser, T08): Fischer abreissen → Suffix, warn, alarm/«leer»; neu bauen → Suffix weg; Holz → «↑ …» gedämpft, nie rot; Leiste umbricht bei 1280 px nicht.
- **AK-UR-09** `git diff main -- src/sim tests/sim` leer; Spielstand ohne neues Feld; `make check` grün.

## Prüfschritte / Task-Review

Reviewer: Schreibzugriffe nur bei Änderung (`chip.title !== tip`-Muster), eine Division je Gut; `TREND_EPS` hat genau eine Definition.
