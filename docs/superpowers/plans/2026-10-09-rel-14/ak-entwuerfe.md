# REL-14 — AK-Entwürfe (Arbeitskennungen; Nummern vergibt L0 im kombinierten Gate)

Quelle: AK-Vorschläge des Kurzdesigns (R424 (1)), ergänzt um die Trivial-Fixes aus R422, R423, R424 und die Gate-Entscheide E1–E5 im Index.

## A · UI-INSPEKTOR-KLARTEXT

- **A1** `supplyChip` liefert im Radius `{ text: 'Im Versorgungsradius', tone: 'ok', label: 'Kontor oder Marktplatz in Reichweite: Waren kommen an' }`, ausserhalb `{ text: 'Ausserhalb der Versorgung', tone: 'bad', label: 'Kein Kontor oder angebundener Marktplatz in Reichweite: keine Waren' }`, für Nicht-Häuser `null` (Vitest `tests/ui/panelView.test.ts`).
- **A2** Die Wörter „Versorgt“ und „Nicht versorgt“ kommen in `src/ui/` nicht mehr vor (`grep -rnw "Versorgt" src/ui/` und `grep -rn "Nicht versorgt" src/ui/` ohne Treffer; zusätzlich Quelltext-Test in `panelView.test.ts`).
- **A3** `diagnosisText({ kind: 'supply' })` ergibt „ausserhalb der Versorgung“ (Vitest `tests/ui/format.test.ts`).
- **A4** Das Haus-Panel hat kein Feld `first-missing` mehr: kein Treffer für `first-missing` und `setFirstMissing` in `src/ui/inspect.ts` und `src/style.css` (grep und Quelltext-Test).
- **A5** Dienst-Mangel heisst in Inspektor, Cursor-Hinweis und Hover gleich: die Hover-Diagnosezeile ist `diagnosisText(d)` mit grossem Anfangsbuchstaben, für jede Diagnoseart (Versorgung, Ware, Dienst); Wortlaut nach Gate-Entscheid E1 (Vitest `tests/ui/hover.test.ts`).
- **A6** Cursor-Hinweis (`placementHint`, Werkzeug Auswahl) eines Hauses ohne Mangel endet auf „· zufrieden“, eines Hauses ausserhalb auf „· ausserhalb der Versorgung“ (Vitest `tests/ui/hints.test.ts`; Gate-Entscheid E2).
- **A7** `TIER_LIST` kommt in `src/` nicht mehr vor; `TIER_IDS` ist nur in `src/sim/defs/tiers.ts` definiert (`grep -rn "TIER_LIST\|const TIER_IDS" src/` → genau ein Treffer in `defs/tiers.ts`).
- **A8** Browser-Check der drei Zustände mit je einem Screenshot: ausserhalb der Versorgung, im Radius mit fehlender Ware, voll erfüllt. In keinem steht neben einem grünen Chip ein Wort, das „versorgt“ behauptet; keine Zeile „Fehlt: …“; Konsole ohne Fehler.
- **A9** README: Abschnitt „Aufstieg“ (Absatz „Das Info-Panel eines Wohnhauses zeigt …“) nennt den Chip-Wortlaut „Im Versorgungsradius“ / „Ausserhalb der Versorgung“; in diesem Absatz und unter „Bedarfssymbole“ steht kein „Fehlt:“ (Gate-Entscheid E5).

## B · SIM-FEST-INSEL

- **B1** Zwei Inseln, Haus auf Insel 1 mit denselben Koordinaten wie ein Heimathaus im Kapellenradius, Fest läuft: `feastActive` ist für das Heimathaus wahr, für das Kolonie-Haus falsch (Vitest `tests/sim/feast.test.ts`, vorher rot).
- **B2** `feastBlockReason` und `holdFeast` werten nur Häuser der Kapellen-Insel aus: daheim im Radius nur Steuer «hoch», auf der Kolonie ein Haus mit «normal» an passender Stelle → Grund „Steuer «hoch»: kein Aufstieg“, kein Rum abgebucht, `feastAt` bleibt leer (vorher rot). Gegenprobe: daheim «normal», Kolonie «hoch» → kein Sperrgrund.
- **B3** Eine Kolonie-Kapelle mit Fest wirkt auf das Kolonie-Haus und nicht auf das Heimathaus mit gleichen Koordinaten; der Rum kommt aus dem Lager der Kolonie (vorher rot).
- **B4** Alle bestehenden Fest-Tests und `tests/sim/balance.test.ts` grün; `SAVE_VERSION` unverändert, kein Diff in `src/sim/save.ts`, `src/sim/types.ts`, `src/sim/defs/`.

## C · Trivial-Fixes (R422, R423) und Doku

- **C1** `.gitignore` enthält `.vitest/`.
- **C2** `docs/arc42.md`: Zeile `hud.ts` nennt keine „Steuersperre“ mehr; die Zeile `taxView.ts` nennt die Steuersperre in Spielzeit (`taxLockText`, angezeigt im Amtsstuben-Panel).
- **C3** `minStampScale`, `FAR_MIN_CSS_PX` und `stampWidthPx` kommen in `src/` und `tests/` nicht mehr vor; `drawDecorStamp` zeichnet ohne Faktor `k`; `tests/render/decorSea.test.ts`, `decorStamps.test.ts`, `decor.test.ts` grün (bildneutral).
- **C4** Spec `docs/superpowers/specs/2026-10-06-lebendige-insel.md` §5 „Fernansicht“: bei Zoom ≤ 0,25 nur Meeresfelsen als Stempel; Wrack und Felseiland erst ab Zoom 0,5 (`SEA_ELEMENT_MIN_ZOOM`, REL-07).
- **C5** `docs/beobachtungen.md` Abschnitt „Offen“: Abhaken-Eintrag ART-FELS-FERNGROESSE (R423) mit den drei Reevaluations-Triggern.
- **C6** README «Fest feiern» und arc42-Zeile `feast.ts` nennen: Ein Fest wirkt nur auf Häuser der Kapellen-Insel.
