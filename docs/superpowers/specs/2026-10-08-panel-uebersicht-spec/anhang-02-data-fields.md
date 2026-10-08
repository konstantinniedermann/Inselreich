# Anhang 02 — `data-field`-Namen und bestehende Tests

Zu [PANEL-UEBERSICHT](../2026-10-08-panel-uebersicht-spec.md). Grundlage: `src/ui/inspect.ts` und
`tests/ui/inspect.test.ts` auf `main` 6f61040. `data-field` ist die Schnittstelle für `setField`, für die
Browser-Checks von qa-playtester und für Skripte unter `.studio/qa/`.

## B.1 Stabil (Name **und** Textinhalt bleiben)

| `data-field`                                                                             | Panel                              | Hinweis                                                       |
| ---------------------------------------------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------- |
| `title`                                                                                  | Betrieb, Dienst, Kontor, Amtsstube | Gebäudename; beim **Wohnhaus** ändert sich der Text (B.3)     |
| `state`                                                                                  | Betrieb, Dienst                    | Text aus `stateInfo`, jetzt im Zustands-Chip                  |
| `remedy`                                                                                 | alle mit Abhilfe                   | Position: Kopf-Zone, unter den Chips                          |
| `level`                                                                                  | Betrieb (ausbaubar)                | «Stufe n», jetzt im Stufen-Chip                               |
| `progress`                                                                               | Betrieb mit Zyklus                 | Breite in % wie heute (`progressPct`)                         |
| `upgrade-box`, `level-title`, `level-cost`, `level-fee`, `level-reasons`, `upgrade`      | Betrieb (ausbaubar)                | Ausbau-Karte; `upgrade` ist der Knopf «Ausbauen»              |
| `build-same`, `demolish`, `connect`, `connect-reason`, `feast`, `feast-reason`, `refund` | Knopfleiste und Fuss               | unverändert                                                   |
| `fire-protection`, `fire-covers`                                                         | Betrieb, Dienst                    | Zusatzzeilen unter den Kacheln                                |
| `upkeep`                                                                                 | Amtsstube                          | Zeile bleibt dort (Scope-Grenze); im Betriebs-Panel siehe B.2 |
| `townhall-state`, `tax-effect`, `tax-lock`, `lock-matrix`, `upgrade-stops`               | Amtsstube                          | unverändert                                                   |
| `needs`, `first-missing`, `diagnosis`, `feast`                                           | Wohnhaus                           | unverändert (Chips wie heute)                                 |
| `upgrade-title`, `upgrade-reasons`, `deficit`, `stone-hint`, `upgrade-cost`              | Wohnhaus                           | Aufstiegs-Karte; Texte unverändert                            |
| `supplied`                                                                               | Wohnhaus                           | Name bleibt, **Text ändert sich** (B.3)                       |

## B.2 Neu

| `data-field` bzw. Attribut                                                         | Ort                             | Inhalt                                                                         |
| ---------------------------------------------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------ |
| `data-zone="head"`, `"stats"`, `"upgrade"`                                         | Zonen-Wurzeln                   | Kopf, Kennzahlen, Ausbau-/Aufstiegs-Karte                                      |
| `data-tone="ok"`, `"warn"`, `"bad"`                                                | Zustands- bzw. Versorgungs-Chip | Ton laut Anhang 01                                                             |
| `data-stat="output"`, `"utilization"`, `"input"`, `"upkeep"`, `"inhabitants"`      | Kachel-Wurzel                   | Kachel vorhanden genau dann, wenn `statTiles`/`houseTiles` sie liefert         |
| `stat-output`, `stat-utilization`, `stat-input`, `stat-upkeep`, `stat-inhabitants` | Kachel-Wert                     | `value` aus der Ansicht                                                        |
| `stat-output-sub`, `stat-input-sub`, `stat-upkeep-sub`                             | Kachel-Unterzeile               | `sub` aus der Ansicht                                                          |
| `level-pips`, `tier-pips`                                                          | Kopf                            | Pips, `aria-hidden="true"`                                                     |
| `tier`                                                                             | Kopf Wohnhaus                   | Name der Stufe, z. B. «Siedler»                                                |
| `gain-output`, `gain-upkeep`                                                       | Ausbau-Karte                    | «15 → 25 / min» mit Delta-Element `gain-output-delta` bzw. `gain-upkeep-delta` |
| `gain-inhabitants`                                                                 | Aufstiegs-Karte                 | «Einwohner höchstens 4 → 8», Delta `gain-inhabitants-delta`                    |
| `level-lock`                                                                       | Ausbau-Karte                    | Sperrgrund (`functionLock`), nur bei Kartenart `locked`                        |
| `upgrade-key`                                                                      | im Knopf «Ausbauen»             | sichtbares Kürzel «Umschalt+U» (`<kbd>`)                                       |

Namen der CSS-Klassen sind [Tech]; die `data-*`-Namen oben sind verbindlich (Browser-Checks greifen darauf zu).

## B.3 Entfällt oder ändert sich

| Bisher                                                                             | Neu                                                                           |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `utilization` (Zeile «Auslastung n %», Betrieb)                                    | Kachel `stat-utilization` mit Wert «n %», Beschriftung «Auslastung»           |
| `produces` (Zeile «Erzeugt X alle n s»)                                            | Kachel `stat-output` («15 / min») + `stat-output-sub` («Nahrung · alle 4 s»)  |
| Zeile «Verbraucht X» (ohne `data-field`)                                           | Kachel `stat-input`                                                           |
| `upkeep` (Zeile «Unterhalt n / min», Betrieb/Dienst)                               | Kachel `stat-upkeep`                                                          |
| `level-preview` («Ausstoss a → b / min · Unterhalt …»)                             | `gain-output`, `gain-upkeep` (zwei Zeilen mit Delta)                          |
| `title` Wohnhaus «Wohnhaus — Siedler»                                              | `title` «Wohnhaus», Stufe in `tier`                                           |
| `supplied` «Versorgung: ✓ im Radius» / «Versorgung: ✗ ausserhalb von Kontor/Markt» | Chip-Text «Versorgt» / «Nicht versorgt»; Langtext in `title` und `aria-label` |
| `inhabitants` («Einwohner 4 / 8»)                                                  | Kachel `stat-inhabitants` mit Wert «4 / 8», Beschriftung «Einwohner»          |

Die reinen Text-Funktionen dahinter (`utilizationText`, `producesText`, `upkeepText`, `levelText`, `upgradeView`
inkl. Feld `preview`) **bleiben exportiert und unverändert**: `hover.ts` (`levelText`, `utilizationText`) und die bestehenden Tests
nutzen sie.

## B.4 Bestehende Tests in `tests/ui/inspect.test.ts`

Alle `describe`-Blöcke bleiben **ohne Änderung an Erwartungen** grün (AK-PU-18). Besonders als Regressionsschutz:

| Test                                                                               | Warum er unverändert bleiben muss                                                         |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| AK-UI-03 (`utilizationText`, `levelText`)                                          | Kacheln und Chip zeigen dieselben Zahlen; Tooltip (`hover.ts`) nutzt sie                  |
| AK-UI-04 (`upgradeView` inkl. `null` vor U3, `preview`)                            | `upgradeCard` baut auf `upgradeView` auf; `null` bleibt Vertrag von `upgradeView`         |
| AK-U2-02, AK-S2-17, QA-M6U1 (`stateInfo`, `producesText`, `burningText`)           | Zustands-Chip zeigt `stateInfo`-Text; Form `{ text, ok }` bleibt (Tests nutzen `toEqual`) |
| AK-U4-01 (`needIcons`)                                                             | Wohnhaus-Bedarfe bleiben Symbol-Chips                                                     |
| M11 Rückerstattung (`refundLine`)                                                  | Abriss-Erstattung bleibt                                                                  |
| AK-UI-07 (`deficitLine`)                                                           | Aufstiegs-Karte zeigt die Zeile wie heute                                                 |
| TASTEN-KOMFORT AK-TK-28/30 (`buildSameShown`, `BUILD_SAME_TITLE`, `UPGRADE_TITLE`) | Knopf «Gleiches bauen» und Tooltip «Ausbauen (Umschalt+U)» bleiben                        |

Neue Tests kommen in eine **neue Datei** `tests/ui/panelView.test.ts`; Kontrast und CSS-Regeln in
`tests/ui/contrast.test.ts` (Erweiterung, bestehende Paare unverändert).
