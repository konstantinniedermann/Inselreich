# Anhang 03 · UI-Texte (Spec M14-E1)

Gehört zu [Spec M14-E1 Inselcharakter](../2026-10-10-m14-e1-inselcharakter-design.md), R5 und §7. Alle Texte setzen
sich aus vorhandenen Quellen zusammen: Inselnamen aus `ISLANDS`, Traitnamen aus `TRAIT_LABELS`, Gebäudenamen aus
`BUILDING_DEFS`, Gütername aus `GOODS`, Faktor `100 / TRAIT_CYCLE_PCT` (= 2), Ausstoss über `perMinute` und
`cycleOf`. Fest im UI-Code stehen nur die verbindenden Wörter. Nur eigene, allgemeine Wörter (ADR-006).

## A. Inselkarte und Seekarte

**Trait-Abschnitte** [Tech: Helfer, z. B. `traitEffectTexts(def)` in `src/ui/islandCard.ts`]:

- Traits **ohne** Eintrag in `TRAIT_BUILDINGS` (heute `spice`, `mountain`): Labels in Def-Reihenfolge, mit «, »
  verbunden, ein Abschnitt.
- Je Trait **mit** Eintrag: eigener Abschnitt `<Label>: <Gebäudenamen mit «, »> ×<Faktor>`.

**Inselkarte** (`formatIslandCard`): `<Name> · <B> × <H> · <Traits ohne Wirkung> · <Abschnitte mit Wirkung> · Fahrzeit
<m:ss>`; ein leerer Abschnitt entfällt samt Trenner.

| Insel      | Text (Fahrzeit aus dem Seeweg wie heute)                                                     |
| ---------- | -------------------------------------------------------------------------------------------- |
| Möweninsel | `Möweninsel · 24 × 24 · Gewürz · Fahrzeit m:ss` (unverändert)                                |
| Felsbucht  | `Felsbucht · 36 × 36 · Gewürz, Gebirge · Gebirge+: Steinbruch, Glashütte ×2 · Fahrzeit m:ss` |
| Weidenau   | `Weidenau · 24 × 24 · Gewürz · Fruchtbar: Zuckerrohrplantage, Schäferei ×2 · Fahrzeit m:ss`  |

Vor der Seefahrt hängt `foreignHoverTitle` wie heute ` · Seefahrt mit den Kaufleuten` an.

**Seekarte, Tooltip** (`seaMapTip`): Label der Inselliste (unverändert) plus je Trait mit Wirkung ` · <Abschnitt>`:

| Insel und Lage        | Text                                                      |
| --------------------- | --------------------------------------------------------- |
| Heimat                | `Heimat`                                                  |
| Möweninsel mit Kontor | `Möweninsel · Kontor`                                     |
| Felsbucht ohne Kontor | `Felsbucht · Gebirge+: Steinbruch, Glashütte ×2`          |
| Felsbucht mit Kontor  | `Felsbucht · Kontor · Gebirge+: Steinbruch, Glashütte ×2` |
| Weidenau ohne Kontor  | `Weidenau · Fruchtbar: Zuckerrohrplantage, Schäferei ×2`  |

Die Inselliste unter der Seekarte bleibt unverändert (schmal, Tastaturweg).

## B. Freischaltmeldung U6 (`UNLOCK_NOTICE`, `src/ui/goal.ts`)

Heute (`tests/ui/goal.test.ts`):

> Neu freigeschaltet: Badehaus (J), Glashütte (O) und Seefahrt (Inseln: 9) — deine Bürger wollen Kaufleute werden;
> Kaufleute brauchen Gewürz von fernen Inseln

Neu (angehängt, Satzpunkt davor):

> Neu freigeschaltet: Badehaus (J), Glashütte (O) und Seefahrt (Inseln: 9) — deine Bürger wollen Kaufleute werden;
> Kaufleute brauchen Gewürz von fernen Inseln. Jede Insel hat ihre Stärke: Möweninsel liegt nah, Felsbucht Gebirge+,
> Weidenau Fruchtbar

Zusammensetzung: `. Jede Insel hat ihre Stärke: ` + je Fremdinsel in `ISLANDS`-Reihenfolge `<Name> <Stärke>`, mit
«, » verbunden; Stärke = Labels der Traits mit Wirkung (mit « / » verbunden, falls mehrere), ohne solche Traits das
feste `liegt nah`. Die Meldung muss bei 1280×720 vollständig lesbar sein (AK-M14E1-35).

## C. Gebäude-Info und Bauleiste

**Gebäude-Info** (Hover `buildingInfo` in `src/ui/hover.ts` und Inspektor [Tech: Ort im Panel]), nur für
Trait-Betriebe auf einer Insel mit dem Trait, direkt unter der Zustandszeile:

- `Inselvorteil ×2 (Gebirge+)` bzw. `Inselvorteil ×2 (Fruchtbar)`

Die Zustandszeile zeigt den wirklichen Ausstoss, z. B. `arbeitet — 20 Stein / min` (Steinbruch Stufe 1 auf der
Felsbucht), `arbeitet — 24 Wolle / min` (Schäferei Stufe 1 auf Weidenau), `arbeitet — 50 Stein / min` (Steinbruch
Stufe 3 auf der Felsbucht).

**Bauleisten-Tooltip** (`src/ui/buildMenu.ts`), Zusatzzeile nur, wenn die aktive Insel den Trait des Betriebs trägt,
nach der Zeile «Erzeugt: …»:

- `Auf <Insel>: <Label> ×<Faktor> — <Ausstoss Stufe 1> <Gut> / min`

| Aktive Insel              | Betrieb            | Zeile                                              |
| ------------------------- | ------------------ | -------------------------------------------------- |
| Felsbucht                 | Steinbruch         | `Auf Felsbucht: Gebirge+ ×2 — 20 Stein / min`      |
| Felsbucht                 | Glashütte          | `Auf Felsbucht: Gebirge+ ×2 — 24 Glas / min`       |
| Weidenau                  | Zuckerrohrplantage | `Auf Weidenau: Fruchtbar ×2 — 24 Zuckerrohr / min` |
| Weidenau                  | Schäferei          | `Auf Weidenau: Fruchtbar ×2 — 24 Wolle / min`      |
| Heimat, Möweninsel, sonst | jeder              | keine Zusatzzeile                                  |
