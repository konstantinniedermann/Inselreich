# UI-GUT-CHIP (I-043) · Abnahmekriterien AK-GC-01 … 16

Wörtlich aus dem Kurzdesign (`.studio/handoffs/2026-10-10-lead-design-UI-GUT-CHIP.md`, nicht versioniert), angenommen mit R461.
Dieser Plan ist damit selbsttragend; die Task-Dateien nennen nur die AK-IDs.

## Kurzdesign (Kern)

**Spielerzweck:** Bei rotem Holz-Pfeil klickt der Spieler auf den Holz-Chip, sieht alle Holzfäller und Holz-Verbraucher der
Insel markiert, landet beim ersten Holzfäller mit offenem Panel („Kein freier Wald in der Nähe“) und geht mit `.`/`,` die
übrigen durch.

**Mechanismus:** Der Gut-Fokus ist eine zweite Liste für denselben Sprung wie REL-17. Der Umlauf-Teil von `problemStep`
(Cursor über `key` + `sort`, Nachfolger in der frisch berechneten Liste, Rückfall über den Sortierschlüssel, Umlauf) wird ein
gemeinsamer reiner Helfer; `problemList` und `focusList` liefern Einträge desselben Typs. Ablauf wie `runProblemJump`
(Deps-Objekt, Fakes im Test): Zeigeraktion abbrechen, `centerOn` Footprint-Mitte, Info-Panel öffnen, Werkzeug bleibt,
ersetzende Meldung (Meldungs-Schlüssel `gut`).

**`focusList(world, island, good)`:** Erzeuger = alle Gebäude der Insel mit `def.produces === good` (jeder Zustand: auch nicht
angebunden, brennend, ab M13-E1 stillgelegt); Verbraucher-Betriebe = `def.consumes` enthält das Gut. Nicht dabei: Häuser,
Kontor, Baukosten. Reihenfolge: Rolle (Erzeuger vor Verbrauchern), Abstand zu `jumpTarget(world, island)`, Gebäude-ID. Nur die
aktive Insel.

| Handlung                                                                                   | Wirkung                                                                                            |
| ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| Klick (oder `Enter`/Leertaste bei Tastaturfokus) auf Lager-Chip, Fokus aus                 | Fokus an für Gut + aktive Insel; Sprung zum Eintrag 1; Chip `aria-pressed="true"`                  |
| Klick auf denselben Chip                                                                   | Fokus aus, keine Kamerabewegung, keine Meldung                                                     |
| Klick auf einen anderen Lager-Chip                                                         | Fokus wechselt auf dieses Gut, Sprung zu dessen Eintrag 1                                          |
| `.` / `,` bei aktivem Fokus                                                                | nächster / voriger Eintrag der Gut-Liste (statt der Problemliste); Problem-Cursor bleibt unberührt |
| `.` / `,` ohne Fokus                                                                       | Problem-Sprung wie REL-17                                                                          |
| `Esc`                                                                                      | wirkt wie heute **und** löscht zusätzlich den Fokus (ein Druck genügt)                             |
| Wechsel der aktiven Insel (`0`, `9`, Seekarte, Problem-Sprung auf andere Insel, Schwenken) | Fokus aus                                                                                          |
| „Neue Insel“, Laden                                                                        | Fokus aus (reiner UI-Zustand, nie im Save)                                                         |

Abriss/Neubau während des Fokus: Markierung folgt sofort (Mitgliedschaft nur über `defId`), die Liste wird je Tastendruck neu
berechnet (Rückfall wie REL-17).

**Render:** Der Renderer erhält nur `focus: { good, island } | null` und prüft je **sichtbarem** Gebäude (bestehendes Culling
`range`, nur der Frame der Fokus-Insel) `produces`/`consumes`. Form statt nur Farbe: Erzeuger durchgezogene Kontur (Footprint +
Hülle wie die Auswahl), Verbraucher gestrichelte Kontur, beide in neuer Signalfarbe (Darstellungswert in `palette.ts`, nicht Gelb
der Auswahl); die Auswahl-Kontur liegt darüber. `MAX_FOCUS_MARKS` (Vorschlag 40; Richtwert `MAX_MARKS` 60), bei Überlauf
Erzeuger zuerst. Kein Pulsieren.

**Meldungen (wörtlich):**

- **M1 Sprung:** `{Gut} {i} von {n}: {Gebäude} ({Rolle}) · {Zustand}`, Rolle `Erzeuger` bzw. `Verbraucher`, Zustand =
  `stateInfo(...).text`. Beispiele: „Holz 1 von 4: Holzfäller (Erzeuger) · Kein freier Wald in der Nähe“, „Holz 4 von 4:
  Werkzeugmacher (Verbraucher) · Wartet auf Holz“.
- **M2 kein Erzeuger:** „Noch kein Erzeuger für {Gut} — Bauen: {Namen}“ mit den freigeschalteten Erzeuger-Typen, verbunden mit
  Komma und „oder“ (z. B. „Noch kein Erzeuger für Nahrung — Bauen: Fischerhütte, Jagdhütte oder Rinderfarm“; Namen aus
  `BUILDING_DEFS`). Ist kein Erzeuger-Typ frei: „Noch kein Erzeuger für {Gut} — Erzeuger noch nicht frei“. Gibt es Verbraucher,
  geht der Fokus trotzdem an (Verbraucher markiert), aber **ohne** Kamerasprung; `.` geht sie dann mit M1 durch. Weder Erzeuger
  noch Verbraucher: Fokus bleibt aus.
- **M3 Liste leer geworden** (alles abgerissen, dann `.`): „{Gut}: nichts mehr markiert“; Fokus aus.
- **Tooltip** (`stockTooltip`, neue zweite Zeile): „Klick: 3 Erzeuger und 1 Verbraucher zeigen“ · ohne Verbraucher „Klick: 2
  Erzeuger zeigen“ · ohne Erzeuger „Noch kein Erzeuger“ · Hausverbrauch als Zusatz „ · 34 Häuser verbrauchen {Gut}“, wenn die
  Stufen das Gut brauchen. Ein-/Mehrzahl korrekt („1 Erzeuger“, „1 Haus verbraucht“).

**Randfälle:** Kein Erzeuger: M2 (auch Fremdinsel/Kolonie). Gut ohne Verbraucher: Liste nur Erzeuger, kein Sondertext. Fremdinsel:
Chips zeigen die aktive Insel, Fokus gilt dort, Markierung nur in deren Frame. Verborgener Chip (`stockChipHidden`): nicht
klickbar, nicht per Tab erreichbar. Nach Mausklick darf die Leertaste (Halten = Schwenken) den Chip nicht erneut auslösen (Chip
behält nach Mausklick keinen Tastaturfokus). Brennende Erzeuger bleiben in der Liste, Zustand nennt den Brand.

**Zugänglichkeit:** Lager-Chips werden `<button type="button">`; `chipRole` liefert dann `null`, `aria-label` bleibt „{Gut}
{Bestand} {Pfeil}“, dazu `aria-pressed`. Sichtbarer Fokusring (`:focus-visible`). Einwohner-, Geld-, Bilanz-Chips bleiben `img`.

**Mitgenommen:** `HOUSE_TITLES` zieht von `hover.ts` nach `texts.ts` (Beobachtung 8); `problems.ts` importiert nicht mehr aus
`hover.ts`. Nicht mitgenommen: `unconnectedIds` vs. `cutOffIds` (Beobachtung b, bleibt offen, `hints.ts` unberührt).

**Nicht-Ziele:** Häuser markieren/anspringen; Warenfluss-Linien; Kontor, Schiffe, Handel; dauerhafte Ebene ohne Klick (I-045);
Einwohner-/Geld-/Bilanz-Chips klickbar; Zähler-Knopf „⚠ n“; Pulsieren/Zeitablauf; Fruchtbarkeit in M2 prüfen; Sim, Save,
Spielwerte.

## AK-Tabelle

| AK       | Prüfung                         | Inhalt                                                                                                                                                                                       | Task                                     |
| -------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| AK-GC-01 | Vitest `focusList`              | Erzeuger vor Verbrauchern, je Rolle nach Abstand zu `jumpTarget`, dann ID; nur Gebäude der Insel; keine Häuser, kein Kontor                                                                  | T02                                      |
| AK-GC-02 | Vitest                          | nicht angebundene und brennende Erzeuger sind in der Liste (nach M13-E1 auch stillgelegte), Zustand aus `stateInfo`                                                                          | T02                                      |
| AK-GC-03 | Vitest                          | M1 wörtlich für Erzeuger und Verbraucher, `i`/`n` 1-basiert                                                                                                                                  | T02                                      |
| AK-GC-04 | Vitest                          | gemeinsamer Umlauf-Helfer: Umlauf am Ende, `,` rückwärts, Rückfall nach Abriss des Cursor-Eintrags; alle bestehenden `tests/ui/problems.test.ts` unverändert grün                            | T01                                      |
| AK-GC-05 | Vitest                          | M2 mit „oder“-Liste nur freigeschalteter Erzeuger-Typen; Variante „Erzeuger noch nicht frei“; mit Verbrauchern Fokus an, kein `centerOn`                                                     | T02 (Text), T03 (Ablauf)                 |
| AK-GC-06 | Vitest (Deps-Fakes)             | weder Erzeuger noch Verbraucher: M2, Fokus bleibt aus, kein `centerOn`, kein Panel                                                                                                           | T03                                      |
| AK-GC-07 | Vitest (reiner Zustands-Helfer) | Klick gleicher Chip → aus; anderer Chip → Wechsel + Sprung; `Esc`, Inselwechsel, Neue Insel/Laden → aus                                                                                      | T03 (Helfer), T06 (Verdrahtung)          |
| AK-GC-08 | Vitest                          | `.`/`,` mit Fokus gehen die Gut-Liste durch, ohne Fokus die Problemliste; der Problem-Cursor ist nach Fokus-Ende unverändert                                                                 | T03                                      |
| AK-GC-09 | Vitest                          | M3: Liste leer → Meldung, Fokus aus                                                                                                                                                          | T03                                      |
| AK-GC-10 | Vitest `stockTooltip`           | zweite Zeile in allen vier Varianten inkl. Ein-/Mehrzahl und Hauszusatz                                                                                                                      | T04                                      |
| AK-GC-11 | Vitest (fakeCtx)                | Konturen nur für Gebäude im sichtbaren Bereich des Fokus-Frames; Erzeuger durchgezogen, Verbraucher gestrichelt; höchstens `MAX_FOCUS_MARKS`, Erzeuger zuerst; `focus: null` zeichnet nichts | T05                                      |
| AK-GC-12 | Vitest                          | Welt nach allen Fokus-Aktionen JSON-gleich zur Welt davor (abgesehen von Kamera/UI); Save-Format unverändert                                                                                 | T03                                      |
| AK-GC-13 | Browser 1280×720                | Holz-Chip klicken: Kamera springt, Panel offen, Konturen sichtbar; zweiter Klick löscht; `Esc` löscht; `9` löscht                                                                            | T08 (Verdrahtung T06)                    |
| AK-GC-14 | Browser                         | Chip per Tab erreichbar, `Enter` schaltet, `aria-pressed` wechselt, verborgene Chips nicht erreichbar; nach Mausklick löst Leertaste-Halten den Chip nicht aus                               | T08 (Bau T04, T06)                       |
| AK-GC-15 | Browser                         | Kolonie: Fokus markiert nur dort, M2 bei fehlendem Erzeuger                                                                                                                                  | T08                                      |
| AK-GC-16 | Review                          | `problems.ts` importiert nicht aus `hover.ts`; `HOUSE_TITLES` in `texts.ts`; README-Bedienung (Chip-Klick, `.`/`,` im Fokus) nachgeführt                                                     | T01 (Import), T07 (README), Final-Review |
