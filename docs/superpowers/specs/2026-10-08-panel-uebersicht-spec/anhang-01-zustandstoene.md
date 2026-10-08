# Anhang 01 — Zustandstöne, Stufen-Pips, Beispielwerte

Zu [PANEL-UEBERSICHT](../2026-10-08-panel-uebersicht-spec.md). Code-Stand der Prüfung: `main` 6f61040.

## A.1 Zustandstexte und Ton (Betriebs-Panel)

Quelle der Texte: `stateInfo(b, tick, missing)` in `src/ui/texts.ts`. Die Prüfreihenfolge ist die der Funktion; die
erste zutreffende Zeile gilt. `stateTone(b)` (neu, `src/ui/panelView.ts`) prüft **dieselben Bedingungen in derselben
Reihenfolge** und liefert nur den Ton. Invariante (AK-PU-02): `stateTone(b) === 'ok'` genau dann, wenn
`stateInfo(b, …).ok === true`.

| Nr. | Bedingung (Reihenfolge wie `stateInfo`)                        | Text (unverändert)                              | `ok`  | Ton    | Begründung des Tons                               |
| --- | -------------------------------------------------------------- | ----------------------------------------------- | ----- | ------ | ------------------------------------------------- |
| 1   | `b.outageUntil !== undefined`                                  | «Brennt — wieder in Betrieb in {Zeit}»          | false | `bad`  | Betrieb steht, Krise                              |
| 2   | `!b.connected`                                                 | «Nicht an Kontor angebunden»                    | false | `bad`  | steht, bis der Spieler eingreift                  |
| 3   | `def.produces === undefined` (Dienste, Marktplatz, Feuerwache) | «Angebunden»                                    | true  | `ok`   | Dienst wirkt                                      |
| 4   | `b.state === 'ok'` oder `'notConnected'`                       | «In Betrieb»                                    | true  | `ok`   | läuft                                             |
| 5   | `b.state === 'waitingInput'`                                   | «Wartet auf {Güter}» (z. B. «Wartet auf Wolle») | false | `warn` | läuft wieder von selbst, sobald Ware da ist       |
| 6   | `b.state === 'storageFull'`                                    | «Lager voll»                                    | false | `warn` | läuft wieder von selbst, sobald Platz ist         |
| 7   | `b.state === 'burning'`                                        | «Brennt — wieder in Betrieb in {Zeit}»          | false | `bad`  | wie Nr. 1                                         |
| 8   | `b.state === 'noForest'`                                       | «Kein freier Wald in der Nähe»                  | false | `bad`  | steht, bis der Spieler eingreift (Wald, Standort) |
| 9   | `b.state === 'noService'`                                      | «Braucht eine {Dienst} in Reichweite»           | false | `bad`  | steht, bis der Spieler eingreift (Dienst bauen)   |

Regel: `warn` = vorübergehend, Marktlage löst es ohne Bau; `bad` = steht, braucht Eingriff oder Krise. Neue
`BuildingState`-Werte (spätere Pakete) müssen in `stateTone` ergänzt werden; der `switch` ist erschöpfend
([Tech]: `never`-Prüfung, damit TypeScript eine Lücke meldet).

Symbol vor dem Text (sichtbar, `aria-hidden`): `ok` → «✓», `warn` → «!», `bad` → «✗» (`TONE_SYMBOL`).

## A.2 Wohnhaus-Versorgung (Kopf)

| Bedingung              | Chip-Text        | Ton   | `title` und `aria-label` (Langtext, bisheriger Zeilentext) |
| ---------------------- | ---------------- | ----- | ---------------------------------------------------------- |
| `isSupplied(world, b)` | «Versorgt»       | `ok`  | «Versorgung: ✓ im Radius»                                  |
| sonst                  | «Nicht versorgt» | `bad` | «Versorgung: ✗ ausserhalb von Kontor/Markt»                |

## A.3 Farben der Töne (`src/style.css`, `:root`)

Der Ton erscheint **nie als Textfarbe** (Regel aus `style.css`: «Auf Pergament: Tinte als Text, Zustand als
farbige Kante»). Text bleibt `--ink` auf `--parchment` (11,9 : 1). Neue Variablen für Kante und Pips, Grafik-Kontrast
≥ 3 : 1 auf `--parchment` **und** `--parchment-edge` (geprüft mit der WCAG-Formel aus `tests/ui/contrast.test.ts`):

| Variable      | Wert      | auf `--parchment` | auf `--parchment-edge` | Ersetzt für Panel-Kanten            |
| ------------- | --------- | ----------------- | ---------------------- | ----------------------------------- |
| `--tone-ok`   | `#2f6b2a` | 5,05 : 1          | 3,87 : 1               | `--ok` (2,25 : 1)                   |
| `--tone-warn` | `#9a5410` | 4,51 : 1          | 3,45 : 1               | `--warn-amber` (2,63 : 1 auf Kante) |
| `--tone-bad`  | `#b3261e` | 5,12 : 1          | 3,92 : 1               | `--signal-red` (2,73 : 1)           |

Bestehende Variablen bleiben unverändert (HUD, Toasts, Karte nutzen sie). Die vorhandenen Listen `.needs`/`.reasons`
behalten `--ok`/`--signal-red` (ausserhalb Scope; Hinweis für `docs/beobachtungen.md`, siehe Spec OF-7). Werte sind
**Setzung Spec**; lead-tech darf andere Töne wählen, solange AK-PU-19 grün ist.

## A.4 Stufen-Pips

| Panel                                      | Quelle                                     | `max` | Beispiel                  | `label` (aria)           |
| ------------------------------------------ | ------------------------------------------ | ----- | ------------------------- | ------------------------ |
| Betrieb                                    | `b.level ?? 1`, nur wenn `LEVELS[b.defId]` | 3     | Stufe 2: «Stufe 2» + ●●○  | «Stufe 2 von 3»          |
| Wohnhaus                                   | `b.house.tier`                             | 4     | Siedler: «Siedler» + ●●○○ | «Siedler, Stufe 2 von 4» |
| Dienste, Gewürzplantage, Kontor, Amtsstube | —                                          | —     | kein Stufen-Chip          | —                        |

`max` des Wohnhauses = Anzahl Einträge in `TIERS` (heute 4), nicht hart im Code.

## A.5 Beispielwerte (Erwartungen der Vitest-AKs)

Alle Werte aus `perMinute` (`src/ui/time.ts`, 1 Nachkommastelle, Punkt als Trenner wie heute), `TICK_MS = 100`.

**Kennzahlen `statTiles`** (Reihenfolge = Anzeige-Reihenfolge):

| Betrieb                          | `output` value / sub                          | `utilization`         | `input` value / sub              | `upkeep` value / sub |
| -------------------------------- | --------------------------------------------- | --------------------- | -------------------------------- | -------------------- |
| Fischerhütte St. 1, ohne `eff`   | «15 / min» / «Nahrung · alle 4 s»             | «100 %»               | —                                | «30 / min» / «Geld»  |
| Fischerhütte St. 2               | «25 / min» / «Nahrung · alle 3 s»             | «100 %»               | —                                | «42 / min» / «Geld»  |
| Fischerhütte St. 1, `eff` 94 208 | «15 / min» / «Nahrung · alle 4 s»             | «36 %»                | —                                | «30 / min» / «Geld»  |
| Fischerhütte, brennt             | «15 / min» / «Nahrung · ruht, Betrieb brennt» | wie `utilizationText` | —                                | «30 / min» / «Geld»  |
| Weberei St. 1                    | «12 / min» / «Stoff · alle 5 s»               | «100 %»               | «12 / min» / «Wolle»             | «90 / min» / «Geld»  |
| Glashütte St. 1                  | «12 / min» / «Glas · alle 5 s»                | «100 %»               | «je 12 / min» / «Stein und Holz» | «150 / min» / «Geld» |
| Gewürzplantage                   | «12 / min» / «Gewürz · alle 5 s»              | «100 %»               | —                                | «90 / min» / «Geld»  |
| Kapelle (Dienst)                 | —                                             | —                     | —                                | «90 / min» / «Geld»  |

Zyklus-Zeit im `sub` über `formatGameTime(cycleOf(b))`, Fischer St. 2: 24 Ticks → «3 s» (aufgerundet, wie
`producesText`). Güternamen immer aus `GOODS[…].name`; die Tabelle zeigt die heutigen Namen.

**Ausbau-Gewinn `upgradeCard`** (`gains`, je Zeile `before`, `after`, `delta`):

| Betrieb, Schritt   | Ausstoss (/ min)         | Unterhalt (/ min)    |
| ------------------ | ------------------------ | -------------------- |
| Fischerhütte 1 → 2 | 15 → 25, Delta «+10»     | 30 → 42, Delta «+12» |
| Fischerhütte 2 → 3 | 25 → 37.5, Delta «+12.5» | 42 → 54, Delta «+12» |
| Steinbruch 1 → 2   | 10 → 16.7, Delta «+6.7»  | 60 → 78, Delta «+18» |

Delta = `Math.round((after − before) × 10) / 10`, formatiert mit `signedNum` (`src/ui/time.ts`; «+», typografisches
«−», «±0»). Steinbruch prüft die Rundung (16.7 − 10 ergibt ohne Rundung 6.699…).

**Aufstiegs-Karte Wohnhaus** (`riseCard`, Gewinn = Höchstzahl der Einwohner aus `TIERS[…].maxInhabitants`):

| Stufe heute | Titel                   | Gewinn-Zeile                        |
| ----------- | ----------------------- | ----------------------------------- |
| Pioniere    | «Aufstieg zu Siedler»   | «Einwohner höchstens 4 → 8», «+4»   |
| Bürger      | «Aufstieg zu Kaufleute» | «Einwohner höchstens 15 → 20», «+5» |
| Kaufleute   | «Höchste Stufe»         | keine                               |

Die Zahlen gelten für die heutigen Defs; die Tests rechnen die Erwartung aus `TIERS`, nicht aus Literalen.
