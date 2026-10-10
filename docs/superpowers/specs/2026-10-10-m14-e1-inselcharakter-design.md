# M14 Etappe E1 «Inselcharakter» — Design-Spec

Datum: 2026-10-10 · Paket design-m14-e1 · Meilenstein M14 «Archipel mit Wert» (startet erst nach M13; diese Spec ist
Vorarbeit nach R475) · Status: **Entwurf** → Gate Spec (`lead-tech`, `lead-qa`), danach Plan (`lead-tech`) ·
Prozessstufe voll

Grundlage: [Brainstorming M14](2026-10-10-m14-brainstorming.md) §2, §3 Ansatz B, §6, §7, §9; Ruling **R486** (O1–O9),
**R487** P-4 (Save-Reihenfolge); [Anhang 01 Werte und Messung](2026-10-10-m14-e1-inselcharakter-design/anhang-01-werte.md)
(verbindlich für alle Zahlen); [Hauptspec](2026-09-29-inselreich-design.md). Muster:
[Spec M13-E2](2026-10-10-m13-e2-denkmal-design.md). Code-Stand: `main` adb7e28e.

Anhänge: [01 Werte und Messung](2026-10-10-m14-e1-inselcharakter-design/anhang-01-werte.md) ·
[02 Save, Migration, Rückfaltung](2026-10-10-m14-e1-inselcharakter-design/anhang-02-save.md) ·
[03 UI-Texte](2026-10-10-m14-e1-inselcharakter-design/anhang-03-ui-texte.md).

Kennzeichnung: **Setzung Spec** (hier ergänzt oder vom Lead gesetzt), **[Tech]** (Umsetzungsdetail; `lead-tech`
entscheidet im Plan, die Spec legt nur das prüfbare Verhalten fest). Anhang-Verweise «A1 … C» meinen Anhang 01.

## 1. Ziel

**Spielerzweck E1:** «Nach der Seefahrt-Freischaltung wählt der Spieler, welche der drei Fremdinseln er wofür
besiedelt — Möweninsel (nah, Gewürz, billigster Einstieg), Felsbucht (Gewürz, Gebirge+: Steinbruch und Glashütte
doppelt so schnell) oder Weidenau (Gewürz, fruchtbar: Zuckerrohr und Schäferei doppelt so schnell) — und verteilt
seine vier Schiffe auf die Routen.»

Heute gibt es genau einen Grund zu kolonisieren: Gewürz. Die Wahl ist rechnerisch belegt (B3, Phase c, Stufe 1):

| Muster                             | Schiffe | Einstieg (Kontor + Schiffe) | Netto / min | Heimat frei |
| ---------------------------------- | ------- | --------------------------- | ----------- | ----------- |
| P1 Felsbucht: Gewürz + Glas        | 3       | 800 + 3600                  | **1674**    | ≈ 24 Kach.  |
| P2 Weidenau: Gewürz + Rohr / Wolle | 4       | 800 + 4800                  | 1475        | ≈ 44 Kach.  |
| P3 Möweninsel: nur Gewürz          | 1       | 800 + 1200                  | 1410        | –           |

Keine Insel gewinnt auf allen Achsen: P1 bringt das meiste Geld, P2 den meisten Platz und bindet alle Schiffe, P3
kostet am wenigsten Einstieg. Damit trägt E1 die Kernfrage «welche Insel wofür» allein (Brainstorming §6).

## 2. Umfang und ausdrücklich nicht

**Im Umfang:** Traits `mountainRich` (Felsbucht) und `fertile` (neue Insel C) mit Zyklusfaktor; dritte Fremdinsel C
«Weidenau» mit einer Erzeugung, die nie wirft; Anzeige der Traits (Inselkarte und Hover, Seekarte, Gebäude-Info,
Bauleisten-Tooltip «×2»); Satz in der Freischaltmeldung U6; Save nächste Version mit Migration, Ladeprüfung,
Rückfaltung; Seed-Läufe; README, arc42.

**Ausdrücklich nicht:**

- Werft (→ M14-E2 «Werft und Seefahrt-Führung» mit I-015, I-019; R486 O4: ergänzt den Kauf am Kontor).
- Routenrisiko, Sturm auf See (→ M14-E3, nur gekoppelt an E1; R486 O5, O9).
- Erkundung, Nebel (I-038 Vollfassung, höchstens E4); Wrack I-036; Fischinsel (I-055); neues Gut (V-D);
  Piraten, Kampf.
- Änderungen an Heimat-Generierung, Controller (`tests/sim/controller.ts`, `merchantsController.ts`), Zielen 1–3,
  Preisen (`GOODS`), `LEVELS`, `BUILDING_DEFS`, `SHIP_MAX`, `SHIP`, Kontor-II-Regeln, Krisenverteilung.
- Neue Grafik-Assets: C rendert mit bestehendem Gelände; Trait-Anzeige nur als Text.
- Mobil-Optimierung (Desktop-first; 800×600 nur «stürzt nicht ab»).

## 3. Regeln

### R1 Trait-Faktor (C, B4)

- **R1.1** Steht ein Betrieb mit Typ in `TRAIT_BUILDINGS[t]` auf einer Insel, deren Def (`ISLANDS`, gefunden über
  `kind`) den Trait `t` trägt, gilt als Zyklus `cycle × TRAIT_CYCLE_PCT / 100` mit `TRAIT_CYCLE_PCT = 50` (doppelter
  Ausstoss). `cycle` ist der Zyklus der Ausbaustufe (`levels.ts`, sonst `BUILDING_DEFS`); die Faktoren wirken also
  multiplikativ.
- **R1.2** Der Faktor wirkt je Betrieb höchstens einmal, auch wenn ein Typ in mehreren Trait-Listen der Insel stünde
  (heute nicht der Fall).
- **R1.3** Zyklen in Ticks (1 min = 600 Ticks):

  | Betrieb                   | Insel     | Stufe 1   | Stufe 2   | Stufe 3   | Stück / min (St. 1 … 3) |
  | ------------------------- | --------- | --------- | --------- | --------- | ----------------------- |
  | Steinbruch                | Heimat, A | 60        | 36        | 24        | 10 · 16,7 · 25          |
  | Steinbruch                | Felsbucht | **30**    | **18**    | **12**    | 20 · 33,3 · 50          |
  | Glashütte                 | Heimat, A | 50        | 30        | 20        | 12 · 20 · 30            |
  | Glashütte                 | Felsbucht | **25**    | **15**    | **10**    | 24 · 40 · 60            |
  | Zuckerrohrpl., Schäferei  | Heimat, A | 50        | 30        | 20        | 12 · 20 · 30            |
  | Zuckerrohrpl., Schäferei  | Weidenau  | **25**    | **15**    | **10**    | 24 · 40 · 60            |
  | alle übrigen, auch Gewürz | jede      | wie heute | wie heute | wie heute | wie heute               |

  Steinbruch und Glashütte auf Weidenau, Zuckerrohr und Schäferei auf der Felsbucht: wie heute (kein Trait).

- **R1.4** Alle betroffenen Zyklen sind gerade, das Ergebnis ist ganzzahlig. **Setzung Spec:** Ein Def-Test sichert
  das ab (AK-M14E1-02); wird künftig ein ungerader Zyklus eingetragen, entscheidet `lead-tech` die Rundung
  [Tech: Vorschlag abrunden, Untergrenze 1].
- **R1.5** Verbrauch je Stück unverändert: Die Glashütte nimmt weiter je Zyklus 1 Stein und 1 Holz (Entnahme bei
  `progress 0`, `production.ts`); doppelter Ausstoss heisst doppelter Verbrauch je Minute. Unterhalt, Baukosten,
  Ausbaukosten, Auslastung (`eff`) und Sturmregel unverändert.
- **R1.6** Die Heimat hat keine Traits (`kind 'home'` steht nicht in `ISLANDS`) → Heimat bitgleich. Traits hängen
  an `kind` über `ISLANDS`, **kein Save-Feld**.
- **R1.7** Keine weitere Kappung (B4): Stapel Stufe 3 × Trait = Zyklus × 0,2. Es bremsen `STORAGE_CAP` 100 je Insel,
  der Schiffsdurchsatz (≈ 40 Stück / min auf der Felsbucht-Route je Schiff) und die Verkaufssättigung (60 Stück / min
  je Gut zum vollen Preis). Kauf-und-Verkauf-Gewinn bleibt ausgeschlossen (`buy` ≥ 2,5 × `sell`, Trait ändert keine
  Preise).
- **R1.8** Der Faktor wird an genau einer Stelle berechnet: im Zyklus-Leseort `cycleOf` (`src/sim/levels.ts`), den
  Produktion (`production.ts`) und Bilanz (`flow.ts`) schon nutzen; Anzeigen lesen ihn von dort [Tech: Signatur, z. B.
  Welt oder Insel-`kind` als Parameter].

### R2 Felsbucht (C, B1)

- **R2.1** `ISLANDS[1]`: Traits `spice`, `mountain`, **`mountainRich`**; Garantie `quarries` 1 → **3**. Das ist die
  einzige Änderung an einem bestehenden Wert; gemessen ändert sie Lage, Anker und Gelände der Felsbucht in 0 / 300
  Seeds (A2).
- **R2.2** Begründung der Umbindung (Auflage Heimat-Gebirge, R486 O7): Die Heimat hat in 300 / 300 Seeds Gebirge mit
  mindestens 15 Steinbruch-Plätzen (A1, Nachbedingung `meetsPostconditions`). Stein allein ×2 bringt darum ≈ 0
  (−96 … +108 / min); Steinbruch **und** Glashütte ×2 bringen +333 / min in (b) und +354 / min in (c), das sind
  **+0,74 je Einwohner und 100 Ticks** (B1). Rückfall bei Ablehnung: V-C (nur Glashütte ×2, +210 / min in (c)).

### R3 Insel C «Weidenau» (C, B2, A3)

- **R3.1** `ISLANDS[2]` neu: `kind 'C'`, Name «Weidenau», `dMin 30`, `dMax 35`, `size 24`, Traits `spice`, `fertile`,
  `plantations 6`, `quarries 0`. Band 30–35 statt «fern» aus dem Brainstorming (Entscheid E-3): fern macht fruchtbar
  negativ (−11 / min je eigenes Schiff bei d ≈ 47) und wirft 24-mal öfter.
- **R3.2** Gebirge wird auf C wie auf der Möweninsel zu Gras (`clipRim`) [Tech: Bedingung `kind === 'A'` erweitern].
  Die Ersatzform (`fallbackTerrain`) von C ist reines Gras wie bei A.
- **R3.3** C wird als drittes Element an `ISLANDS` angehängt und in `generateForeignIslands` im selben Strom
  `ISLANDS_SALT` **nach** A und B erzeugt. Alle Zufallszüge für A und B bleiben in Zahl und Reihenfolge gleich → A und B
  bitgleich (A3: 0 / 300 Seeds anders). `lanesClear` prüft alle Paare inklusive C.
- **R3.4** **Die Erzeugung von C wirft nie** (Entscheid E-5). Gemessen findet `place` für C in 1 / 1000 Seeds keine
  Lage (Seed 963, A3). Pflicht: eine deterministische Ersatzregel für C nach den heutigen zwei Stufen (50 Zufallslagen,
  dann 16 Richtungen im Band). Vorschlag des Leads: (a) Band schrittweise nach aussen erweitern, (b) zuletzt
  Ersatzlage ohne Bandbedingung, deren letzte Stufe konstruktiv ist (ohne Prüfung, die scheitern kann). Genaue Regel,
  Schrittweiten und Konstanten [Tech]; Konstanten in `src/sim/defs/sea.ts`. Prüfbar gefordert:
  1. `createWorld(seed)` wirft für keinen Seed in 1…1000 und keinen gepinnten Seed (1, 3, 7, 13, 42, 963).
  2. A und B bleiben bitgleich, auch bei Seeds mit Ersatzregel für C.
  3. C überlappt kein Land und hält `ISLAND_GAP_MIN` ein; der Seeweg 0–3 existiert. Ob die letzte Stufe `lanesClear`
     oder `ARCHIPEL_SPAN_MAX` lockern muss, entscheidet `lead-tech` und hält es im Plan fest.
  4. Eine Testoption erzwingt die letzte Stufe (Muster `failShapes`) [Tech: Name].
- **R3.5** `createWorld` und die Migration (R9) nutzen dieselbe Funktion; C hängt nur von `seed` und der Heimat-Lage
  (`ox`, `oy`, `width`, `height`, `anchor`) ab.

### R4 Sichtbarkeit (M12 A-05, Entscheid E-1)

C verhält sich wie A und B: von Spielstart an im Archipel zu sehen; Kontor II, Inselwechsel, Seekarte und Routen ab
der Seefahrt (U6). Vor der Seefahrt hängt die Inselkarte wie heute «Seefahrt mit den Kaufleuten» an
(`foreignHoverTitle`). Das ist die Lesart des Leads von R486 O6 «sichtbar ab Seefahrt» = sichtbar ohne Erkundung.

### R5 Anzeige (genaue Texte: Anhang 03)

- **R5.1** `TRAIT_LABELS`: `spice` «Gewürz», `mountain` «Gebirge», `mountainRich` «Gebirge+», `fertile` «Fruchtbar».
- **R5.2** Inselkarte (Hover) und Seekarten-Tooltip nennen Traits mit Wirkung, z. B. «Gebirge+: Steinbruch,
  Glashütte ×2». Der Faktor im Text wird aus `TRAIT_CYCLE_PCT` abgeleitet (100 / 50 = 2), Gebäudenamen aus
  `BUILDING_DEFS`; keine neuen Zahlen im UI-Code.
- **R5.3** Gebäude-Info (Hover und Inspektor) eines betroffenen Betriebs: Zeile «Inselvorteil ×2 (Gebirge+)» bzw.
  «(Fruchtbar)»; die vorhandene Zeile «arbeitet — … / min» zeigt den wirklichen Ausstoss (über `cycleOf`, R1.8).
- **R5.4** Bauleisten-Tooltip eines Trait-Betriebs, wenn die aktive Insel den Trait trägt: Zusatzzeile mit Insel,
  Faktor und Ausstoss der Stufe 1. Auf allen anderen Inseln keine Zusatzzeile.
- **R5.5** Freischaltmeldung U6 (`UNLOCK_NOTICE`, `src/ui/goal.ts`) bekommt einen Satz zu den Inselstärken (Anhang 03
  B). Nur eigene, allgemeine Wörter (ADR-006).
- **R5.6** Seekarte, Inselliste, Inselwechsel (Taste `9`) und Lagerleiste umfassen C ohne Sonderfall; der Inselwechsel
  läuft zyklisch Heimat → Möweninsel → Felsbucht → Weidenau → Heimat.

### R6 Bauplätze und Kontor

Bauregeln unverändert: Trait-Betriebe dürfen überall auf der Insel stehen, wo ihre Standortregel es erlaubt
(Steinbruch an Gebirge, Plantagen mit Gras im Radius). Ohne Kontor II auf der Insel ist dort nichts baubar, je Insel
ein Kontor, Baukosten aus dem Lager der Insel (wie heute).

## 4. Datenmodell und Def-Einträge

Nur `src/sim/defs/sea.ts` (Werte nie im Code), Ist → Soll:

- `IslandKind`: `'A' | 'B'` → `'A' | 'B' | 'C'`
- `IslandTrait`: `spice`, `mountain` → zusätzlich `mountainRich`, `fertile`
- `TRAIT_CYCLE_PCT` (neu): `50`
- `TRAIT_BUILDINGS` (neu): `mountainRich: ['quarry', 'glassworks']`, `fertile: ['canefarm', 'sheepfarm']`; übrige Traits leer [Tech: `Partial` oder leere Listen]
- `ISLANDS[1]`: `quarries 1`, Traits `spice, mountain` → `quarries 3`, Traits `spice, mountain, mountainRich`
- `ISLANDS[2]` (neu): `{ kind 'C', name 'Weidenau', dMin 30, dMax 35, size 24, traits ['spice','fertile'], plantations 6, quarries 0 }`
- `TRAIT_LABELS`: 2 Einträge → 4 Einträge (R5.1)
- Ersatzregel C (neu): Konstanten nach R3.4 [Tech: Namen und Werte]

Unverändert: `ISLANDS[0]`, `SHIP_MAX`, `SHIP`, `ISLANDS_SALT`, `ISLAND_TRIES`, `ISLAND_GAP_MIN`, `ISLAND_RIM`,
`FALLBACK_*`, alle Preise, `LEVELS`, `BUILDING_DEFS`. **Weltzustand:** kein neuer Weltschlüssel, kein neuer
Inselschlüssel; `islands` hat vier statt drei Einträge. Name «Weidenau» (Weide + Au): allgemeiner Flurname, keine
Marke bekannt; Ersatz bei Bedenken «Weideland».

## 5. Randfälle

- **Altstand der Vorversion mit Betrieben auf der Felsbucht laden:** Steinbruch und Glashütte dort sofort mit halbem Zyklus. Liegt `progress` ≥ neuem Zyklus (z. B. 45 bei Zyklus 30), liefert der nächste Tick ein Stück, `progress 0` (bestehende Regel `production.ts`). Kein Hinweis beim Laden.
- **Altstand laden:** Insel C wird angehängt: ohne Kontor, Lager leer, Gelände aus `seed` (R9). Nach dem Laden sichtbar wie A und B.
- **Abriss eines Trait-Betriebs, Neubau:** Erstattung wie heute; der Neubau startet mit `progress 0` und Trait-Zyklus.
- **Ausbaustufe auf Trait-Insel:** Zyklus der Stufe × 0,5 (R1.3); Kosten, Gebühr, Unterhalt der Stufe wie in der Heimat.
- **Glashütte auf der Felsbucht ohne Stein oder Holz:** `waitingInput` wie heute; kein Ausstoss, keine Teilentnahme.
- **Lager der Insel voll (`STORAGE_CAP`):** Stück geht verloren, `storageFull` wie heute; der Trait füllt nur schneller.
- **Sturm auf Weidenau:** Zuckerrohr und Schäferei (`stormAffected`) wie in der Heimat betroffen; der Trait ändert die Sturmwirkung nicht.
- **Brand:** Unbebaute Insel C ändert `fireRect` nicht (nur Inseln mit brennbaren Gebäuden) → Krisenziehungen in Bestandsständen unverändert. Mit Gebäuden auf C gilt die bestehende Regel.
- **Inselwechsel:** zyklisch über vier Inseln (R5.6); vor der Seefahrt keine Wirkung wie heute.
- **Routen zwischen Fremdinseln (z. B. Felsbucht–Weidenau):** erlaubt wie heute, Seeweg aus `seaLanes`.
- **Seed mit Ersatzregel für C (Seed 963):** Spiel startet; C liegt nach R3.4 eventuell ausserhalb des Bands; Inselkarte zeigt die echte Fahrzeit.
- **Spielstand mit 3 Inseln und neuer Version (manipuliert):** `'Beschädigter Spielstand'`, kein Absturz.
- **Fahrlinien (Darstellung, SEE-F1):** Eine bestehende Fahrlinie kann um C herum anders gerundet werden; Seeweg `d` und Fahrzeit bleiben (reine Darstellung). Prüfauftrag §6.3.

## 6. Baseline und Hash-Pins

### 6.1 Balancing und Heimat-Pins

Balancing-Tests (`tests/sim/balance*.test.ts`) und alle Heimat-Pins (`e0Pins.ts`, `e1Pins.ts`, `seePins.ts`) bleiben
**bitgleich**: Der Controller (Seed 3) gründet weder auf der Felsbucht noch auf C ein Kontor, die Heimat hat keinen
Trait, A bleibt bitgleich, eine leere Insel C ändert weder Brand noch Aufträge. Sieg-Zeiten unverändert (B5).

### 6.2 Fremdinsel-Pins (Prüfauftrag an `lead-tech` vor dem Plan)

Welche Pins und Goldwerte schliessen Fremdinseln oder `islands.length` ein? Mindestens zu prüfen:
`tests/sim/seaGolden.test.ts` (Lanes, Ticks aller Paare, Welt-Hash), `CHAIN_HASHES` und `V6_FORMS`
(`tests/sim/save.test.ts`, `e0Pins.ts`), `tests/sim/islands-gen.test.ts`, `islands-rng.test.ts`, `islands.test.ts`,
Render-Tests der Seekarte und des Archipel-Rechtecks. **Bevorzugt (Entscheid E-4):** Bestehende Pins bleiben
wertgleich, weil die Rückfaltung (R9.5) eine unberührte Insel C entfernt; die neuen Lanes `0-3`, `1-3`, `2-3` kommen
als **zusätzliche** Goldwerte hinzu (gemessen, dann gepinnt). Nur wo das nicht geht: Pin-Änderung per Ruling
(Entwurf R-c, Anhang 01).

### 6.3 Weitere Prüfaufträge an `lead-tech`

- Validator `islands.length === 1 + ISLANDS.length` (`save.ts`) wird 4 ohne Codeänderung; `isValidForeign` liest
  `ISLANDS[i − 1].size`.
- `migrateV7ToV8` ruft `generateForeignIslands` und erzeugt damit für alte v7-Stände sofort A, B **und** C; die neue
  Migration darf dann nicht ein zweites C anhängen (Anhang 02 B). Folgemigrationen, die über alle Inseln laufen
  (`addSpiceToIslands`, I-049 `reserve`), müssen C mit abdecken.
- Fahrlinien-Raster (`ROUTE_MARGIN` um den Archipel) und Seekarten-Layout (`mapLayout`) wachsen mit C: Pins dazu
  benennen.
- Rundung des Trait-Zyklus bei Stufen (R1.4).

## 7. UI

Ausgangsstand je Sicht (main adb7e28e) und Änderung; Texte wörtlich in Anhang 03.

- **Inselkarte (Hover über Fremdinsel, `islandCard.ts`)** — heute: «Felsbucht · 36 × 36 · Gewürz, Gebirge · Fahrzeit m:ss»; neu: Traits ohne Wirkung als Liste, je Trait mit Wirkung ein Abschnitt «Gebirge+: Steinbruch, Glashütte ×2» (Anhang 03 A)
- **Hover vor Seefahrt (`foreignHoverTitle`)** — heute: Karte + «· Seefahrt mit den Kaufleuten»; neu: gleich, auch für Weidenau
- **Seekarte, Tooltip (`seaMapTip`)** — heute: Listenlabel «Felsbucht» bzw. «Felsbucht · Kontor»; neu: Label + Abschnitte der Traits mit Wirkung (Anhang 03 A); Inselliste darunter unverändert
- **Seekarte, Bild (`render/seaMap.ts`)** — heute: drei Silhouetten; neu: vier Silhouetten, Layout umfasst C
- **Gebäude-Info Hover und Inspektor** — heute: «arbeitet — 10 Stein / min»; neu: auf Trait-Insel «arbeitet — 20 Stein / min» und Zeile «Inselvorteil ×2 (Gebirge+)»
- **Bauleisten-Tooltip** — heute: Erzeugt-Zeile je Def; neu: auf Trait-Insel Zusatzzeile (Anhang 03 C)
- **Freischaltmeldung U6** — heute: Text heute (`tests/ui/goal.test.ts`); neu: plus Satz zu den Inselstärken (Anhang 03 B)
- **Inselliste, Taste `9`, Lagerleiste** — heute: drei Inseln; neu: vier Inseln, «Weidenau»

Desktop-first: Alle Texte passen bei 1280×720 ohne waagrechtes Scrollen; bei 800×600 kein Absturz.

## 8. Grafik

Keine neue Grafik und keine neuen Assets. C rendert mit dem bestehenden Gelände (Gras, Wald, Strand, Wasser, ohne
Gebirge). Trait-Anzeige nur als Text. Kein Asset-Budget betroffen.

## 9. Save

- **R9.1 Version:** nächste freie Version nach den Sprüngen von M13-E2, I-048 und I-049: **`SAVE_VERSION + 1`**
  relativ zu `main` beim Planstart, im Folgenden «**neu**»; die Version davor heisst «**Vorversion**». Erwartet
  v13, wenn M13-E2, I-048 und I-049 sich v12 teilen (R477, R487 P-4). Die AK nennen keine festen Zahlen.
- **R9.2 Format:** kein neuer Welt- oder Inselschlüssel. Änderung: `islands` hat genau 4 Einträge, `islands[3].kind
=== 'C'`, gleiche Schlüsselfolge wie die von `createWorld` erzeugten Fremdinseln.
- **R9.3 Migration Vorversion → neu:** Insel C aus `seed` und der gespeicherten Heimat-Lage mit derselben Funktion
  wie `createWorld` erzeugen (R3.5), ohne Kontor, Lager leer, ans Ende anhängen; nur wenn genau 3 Inseln vorliegen;
  wirft nie (Anhang 02 B).
- **R9.4 Ladeprüfung:** genau 4 Inseln, Insel `i` hat `kind === ISLANDS[i − 1].kind` und `size` der Def, Insel 3
  also `'C'` mit 24 × 24; Verstoss → `'Beschädigter Spielstand'` (Anhang 02 C).
- **R9.5 Rückfaltung** `foldBackTo<Vorversion>` in `tests/sim/helpers.ts` [Tech: Name, erwartet `foldBackToV12`] mit
  Positivliste nach Muster M13-E2 Anhang 02 D: unbekannter Weltschlüssel → Fehler (Gate-Befund B9); `islands[3]` nur
  entfernen, wenn unberührt, sonst Fehler «Insel C nicht rückfaltbar» (Anhang 02 D).
- **R9.6 Inkompatibel:** `version` > neu → `'Unbekannte Version'`, kein JSON → `'Ungültiges Format'`; kein Absturz,
  das laufende Spiel bleibt unverändert, die UI zeigt den Grund über `friendlyReason` (Verfassung §3).

## 10. Abnahmekriterien

Testwelt, sofern nicht anders genannt: `createWorld(3, { unlockAll: true })`, Kontor II per Helfer auf der
genannten Insel [Tech: Helfer aus `tests/sim/seaHelpers.ts`], `money 100 000`, Lager der Insel Holz 50, Stein 50,
Werkzeug 20. Datei `tests/sim/islandTraits.test.ts`, sofern nicht anders genannt. Erwartungswerte Save: Anhang 02 F.

### 10.1 Vitest Sim

- **AK-M14E1-01** Defs: `TRAIT_CYCLE_PCT === 50`; `TRAIT_BUILDINGS` wie §4; `ISLANDS` hat 3 Einträge; `ISLANDS[0]`
  tief gleich wie heute; `ISLANDS[1]` unterscheidet sich vom heutigen Eintrag nur in `quarries 3` und `traits`;
  `ISLANDS[2]` tief gleich dem Soll aus §4; `TRAIT_LABELS` hat genau die vier Texte aus R5.1.
- **AK-M14E1-02** Ganzzahligkeit: Für jeden Trait-Betrieb ist `cycle × TRAIT_CYCLE_PCT / 100` für den Basiszyklus und
  beide `LEVELS`-Zyklen eine ganze Zahl ≥ 1.
- **AK-M14E1-03** `cycleOf` je Insel und Betrieb: Werte der Tabelle R1.3 für Stufe 1, 2, 3 (Steinbruch und Glashütte
  auf Felsbucht, Zuckerrohrplantage und Schäferei auf Weidenau, jeweils auch Heimat); Gewürzplantage auf Felsbucht und
  Weidenau 50; Holzfäller auf der Felsbucht wie in der Heimat; Zuckerrohrplantage auf der Felsbucht und auf der
  Möweninsel 50.
- **AK-M14E1-04** Ausstoss: Ein angebundener Steinbruch auf der Felsbucht ab `progress 0` liefert in 600 Ticks genau
  20 Stein, ein Steinbruch in der Heimat im selben Lauf genau 10; eine Zuckerrohrplantage auf Weidenau genau 24.
- **AK-M14E1-05** Verbrauch je Stück: Glashütte auf der Felsbucht, Lager Stein 50, Holz 50, 600 Ticks → Glas +24,
  Stein −24, Holz −24 (ohne weitere Verbraucher). Mit Stein 0: Zustand `waitingInput`, Glas +0, Holz unverändert.
- **AK-M14E1-06** Stufe × Trait: Steinbruch auf der Felsbucht nach zweimal `upgradeBuilding` (Stufe 3; Gebühr Stoff und Rum im Lager der Insel) → `cycleOf` 12;
  600 Ticks → 50 Stein, sofern Lager nicht voll (Lager vorher 0).
- **AK-M14E1-07** Heimat unverändert: Für jeden Betrieb in `BUILDING_DEFS` mit Zyklus ist `cycleOf` auf Insel 0 auf
  allen Stufen gleich `levels.ts` bzw. `BUILDING_DEFS`.
- **AK-M14E1-08** Altstand-`progress`: Steinbruch auf der Felsbucht mit `progress 45` → nach einem `step` Stein +1,
  `progress 0`.
- **AK-M14E1-09** Bilanz: `flow.ts` meldet für die Felsbucht mit einem Steinbruch Stein-Erzeugung 20 / min
  [Tech: Funktion und Einheit wie bestehende Flow-Tests].
- **AK-M14E1-10** Lager voll: Felsbucht Stein 100 (`STORAGE_CAP`), Steinbruch → nach 30 Ticks Zustand `storageFull`,
  Stein 100.
- **AK-M14E1-11** Sturm: Zuckerrohrplantage auf Weidenau im aktiven Sturm verhält sich wie eine gleiche Plantage in
  der Heimat (gleiche Zustandsfolge über 600 Ticks, Ausstoss im Verhältnis der Zyklen).

### 10.2 Vitest Weltgenerierung, Seed-Läufe, Baseline, Save

- **AK-M14E1-12** A und B bitgleich (`tests/sim/islands-gen.test.ts`): Für Seeds 1…300 und 1, 3, 7, 13, 42, 963 sind
  `islands[1]` und `islands[2]` (`JSON.stringify`) gleich der Referenz vor der Änderung [Tech: Fixture mit Hash je
  Seed, auf `main` vor T01 erzeugt].
- **AK-M14E1-13** C wirft nie: `createWorld(seed)` für Seeds 1…1000 und 963 wirft nicht, `islands.length === 4`,
  `islands[3].kind === 'C'`, 24 × 24.
- **AK-M14E1-14** Band: Seeweg 0–3 liegt in [30, 35] für alle Seeds 1…1000 ohne Ersatzregel; Seeds mit Ersatzregel
  werden gezählt, erwartet ≤ 3 (gemessen 1: Seed 963).
- **AK-M14E1-15** Seed 963 und erzwungene letzte Stufe (R3.4 Punkt 4): C liegt ohne Landüberlappung, Abstand ≥
  `ISLAND_GAP_MIN` zu jeder Insel, Seeweg 0–3 vorhanden, A und B wie AK-12.
- **AK-M14E1-16** C-Gelände: Seeds 1…300 → keine Kachel `mountain` auf C; C hat ≥ 6 freie Plätze nach
  `PLANTATION_SITE` (Garantie aus `buildShape`); mit `failShapes` ebenso (Ersatzform).
- **AK-M14E1-17** Felsbucht: Seeds 1…300 → nach dem Kontor II ≥ 3 Plätze, an denen `canPlace(w, 'quarry', x, y, 2)`
  gültig ist (gemessen Min 13).
- **AK-M14E1-18** Baseline: alle Balancing-Tests grün; `git diff main -- 'tests/sim/balance*.test.ts'
tests/sim/e0Pins.ts tests/sim/e1Pins.ts tests/sim/seePins.ts` ohne Änderung.
- **AK-M14E1-19** Fremdinsel-Pins (nach Prüfauftrag §6.2): `CHAIN_HASHES`, `V6_FORMS` und der Hash in `seaGolden`
  wertgleich über die Rückfaltung; die Lane- und Tick-Einträge `0-1`, `0-2`, `1-2` unverändert; `0-3`, `1-3`, `2-3`
  neu gepinnt. Abweichung nur mit Ruling.
- **AK-M14E1-20** Rundlauf neu: Welt mit Kontor II und Gebäuden auf Weidenau → `serialize`/`deserialize` ok, tief
  gleich.
- **AK-M14E1-21** Migration Vorversion → neu: `islands.length` 3 → 4; `islands[3]` tief gleich
  `createWorld(seed).islands[3]` desselben Seeds; Inseln 0–2, Gebäude, Schiffe, Geld unverändert; `version` neu.
- **AK-M14E1-22** Kette: Fixtures v1 … Vorversion → `version` neu, genau 4 Inseln, Insel 3 `'C'`; ein v7-Stand
  bekommt C schon in `migrateV7ToV8` und kein fünftes Element.
- **AK-M14E1-23** Ladeprüfung: Fälle 23a–23f aus Anhang 02 F, jeweils genau das genannte Ergebnis.
- **AK-M14E1-24** Rückfaltung (`tests/sim/helpers.test.ts` [Tech]): Fälle 24a–24h aus Anhang 02 F.
- **AK-M14E1-25** Inkompatibel (`tests/sim/save.test.ts` oder neue Datei): `version` neu + 1 →
  `'Unbekannte Version'`; abgeschnittenes JSON → `'Ungültiges Format'`; Migration mit kaputter Heimat → kein Wurf,
  `'Beschädigter Spielstand'`; `friendlyReason` je nicht leer.

### 10.3 Vitest UI und Render

- **AK-M14E1-26** `formatIslandCard` und `islandCard` (`tests/ui/islandCard.test.ts`): genau die Texte aus Anhang
  03 A für Möweninsel, Felsbucht und Weidenau (Fahrzeit aus dem Seeweg der Testwelt).
- **AK-M14E1-27** `foreignHoverTitle` vor der Seefahrt mit der Weidenau-Karte → Karte + «· Seefahrt mit den
  Kaufleuten»; danach ohne Zusatz.
- **AK-M14E1-28** `seaMapTip` über C → Anhang 03 A Zeile «Seekarte»; über die Heimat «Heimat» wie heute.
- **AK-M14E1-29** Gebäude-Info (`tests/ui/hover.test.ts`): Steinbruch auf der Felsbucht → Zeilen «arbeitet — 20 Stein
  / min» und «Inselvorteil ×2 (Gebirge+)»; Schäferei auf Weidenau → «Inselvorteil ×2 (Fruchtbar)»; Steinbruch in der
  Heimat und Gewürzplantage auf Weidenau ohne Inselvorteil-Zeile. Inspektor-Panel zeigt dieselbe Zeile [Tech: Ort].
- **AK-M14E1-30** Bauleisten-Tooltip (`tests/ui/buildMenu.test.ts`): aktive Insel Felsbucht, Steinbruch → Zeile aus
  Anhang 03 C; aktive Insel Heimat → keine Zusatzzeile; Gewürzplantage auf Weidenau → keine.
- **AK-M14E1-31** `UNLOCK_NOTICE` (`tests/ui/goal.test.ts`): genau der Text aus Anhang 03 B.
- **AK-M14E1-32** Inselwechsel und Liste (`tests/ui/`): `islandList` liefert vier Einträge, Index 3 «Weidenau»;
  Taste `9` viermal ab der Heimat → Möweninsel, Felsbucht, Weidenau, Heimat; Lagerleisten-Präfix auf Insel 3
  «Weidenau».
- **AK-M14E1-33** Seekarte (`tests/render/`, `fakeCtx.ts`): `mapLayout` umfasst alle vier Inseln; Zeichnung enthält
  vier Silhouetten; `seaMapPick` auf das Land von C liefert 3.

### 10.4 Browser (qa-playtester, Headless-Chrome)

Screenshots `.studio/qa/m14-e1/<ak>-<breite>x<höhe>.png`, 1280×720 und 1920×1080. Szenario-Stände werden in
`tests/sim/scenarios.ts` erzeugt und wie die übrigen Browser-Szenarien als Slot geladen [Tech: Namen; Vorschlag
unten]. Jede AK nennt ihren Ausgangsstand.

- **AK-M14E1-34** Stand `m14e1-start` (Seed 3, `unlockAll`, Geld 20 000, keine Kontore auf Fremdinseln), Zoom 1/8:
  drei Fremdinseln sichtbar, Weidenau ohne Gebirge; Hover über jede Fremdinsel zeigt die Karte aus Anhang 03 A.
- **AK-M14E1-35** Stand `m13-vor-ziel` (vorhanden: Tick 6000, kurz vor Ziel 1): vor dem Ziel Hover über Weidenau mit
  «Seefahrt mit den Kaufleuten»; Zeitraffer bis zum Ziel → Freischaltmeldung mit dem Satz aus Anhang 03 B, vollständig
  lesbar bei 1280×720.
- **AK-M14E1-36** Stand `m14e1-felsbucht` (Seed 3, `unlockAll`, Kontor II auf der Felsbucht, 1 Steinbruch und
  1 Glashütte angebunden, Lager der Felsbucht Stein 20, Holz 20): Inspektor des Steinbruchs zeigt «Inselvorteil ×2
  (Gebirge+)» und «20 Stein / min»; nach 1 min Spielzeit Stein auf der Felsbucht sichtbar gestiegen.
- **AK-M14E1-37** Stand `m14e1-weidenau` (Seed 3, `unlockAll`, Kontor II auf Weidenau, 1 Zuckerrohrplantage,
  1 Schäferei): Inspektor der Schäferei mit «Inselvorteil ×2 (Fruchtbar)»; Bauleisten-Tooltip Steinbruch ohne
  Zusatzzeile, Zuckerrohrplantage mit Zeile aus Anhang 03 C.
- **AK-M14E1-38** Stand `m14e1-start`: Knopf «Inseln» → Seekarte mit vier Silhouetten, Tooltip über Weidenau nach
  Anhang 03 A; Klick auf Weidenau springt dorthin; Taste `9` läuft über alle vier Inseln.
- **AK-M14E1-39** Stand `m14e1-altstand` (Vorversion, erzeugt per Rückfaltung aus `m14e1-felsbucht` [Tech], 3 Inseln):
  Laden → 4 Inseln, Weidenau sichtbar und ohne Kontor, Felsbucht-Betriebe mit «×2», keine Konsolenfehler.
- **AK-M14E1-40** Slot mit `version` neu + 1: Hinweis «Unbekannte Version», Spiel läuft weiter, keine
  Konsolenfehler.
- **AK-M14E1-41** 800×600, Stand `m14e1-felsbucht` mit offener Seekarte und offenem Inspektor: kein Absturz, keine
  Konsolenfehler.

## 11. Doku-Folgen

- README: Abschnitte «Ferne Inseln» (Z. ≈ 74) und «Seefahrt und Gewürz» (Z. ≈ 384): drei Fremdinseln mit Grösse und
  Traits, Wirkung «×2» für Steinbruch und Glashütte auf der Felsbucht, Zuckerrohrplantage und Schäferei auf Weidenau,
  Zusatzzeilen in Inselkarte und Inspektor.
- `docs/arc42.md`: Weltgenerierung (dritte Fremdinsel im Strom `ISLANDS_SALT`, Ersatzregel C), Persistenz (Version
  neu, Migration C, Ladeprüfung 4 Inseln), Bausteinsicht `cycleOf` mit Trait-Faktor.
- Hauptspec: Verweis auf diese Spec im Abschnitt Fremdinseln.
- Kein ADR nötig: ADR-010 (eigener Strom) bleibt, keine neue Abhängigkeit.

## 12. Offene Punkte (mit Empfehlung, Entscheider L0)

- **E-1 Lesart R486 O6:** C wie A und B von Start an sichtbar, nutzbar ab Seefahrt (R4). Empfehlung: annehmen.
  Alternative: C bis zur Seefahrt verborgen (Sichtungs-Moment, ≈ +30 Tools, neue Sichtbarkeitsregel in Render und
  Picking).
- **E-2 Umbindung Gebirge+ auf Steinbruch und Glashütte** (Entwurf R-a): Empfehlung annehmen; Rückfall V-C (nur
  Glashütte ×2, halber Wert).
- **E-3 C im Band 30–35 mit Gewürz statt «fern»** (Entwurf R-b): Empfehlung annehmen.
- **E-4 Pins und Goldwerte** (Entwurf R-c): Empfehlung wertgleich über die Rückfaltung, neue C-Lanes zusätzlich;
  Ruling nur, falls `lead-tech` im Prüfauftrag §6.2 einen nicht rückfaltbaren Pin findet.
- **E-5 Erzeugung von C wirft nie** als Auflage an `lead-tech` (Entwurf R-d): Empfehlung annehmen.

**Playtest-Fragen** (ab Stand nach Ziel 1): Gründet der Spieler ohne Erklärung ein Kontor auf der Felsbucht oder
auf Weidenau und kann er sagen, warum diese Insel? Verteilt er die vier Schiffe bewusst? Wird Glas von der Felsbucht
zur Geldquelle Nr. 1 (B4: höchstens +730 / min am Kontor II der Felsbucht)?

## 13. Schnitt und Grösse

E1 ist das erste spielbare Release von M14, zwei Pakete:

- **M14-E1-SIM** ≈ 110–130 Tools: Defs, Trait-Faktor in `cycleOf`, Insel C mit Ersatzregel, Save neu mit Migration,
  Ladeprüfung und Rückfaltung, Seed-Läufe, Pins nach §6.2, Szenario-Stände §10.4.
- **M14-E1-UI** ≈ 60–80 Tools: Inselkarte, Hover, Seekarte, Gebäude-Info, Bauleisten-Tooltip, Freischaltmeldung,
  Inselwechsel, README, arc42.

Zusammen ≈ 180–210 Tools (≤ 250). Risiko mittel: Ersatzregel C und die Pin-Frage §6.2.

**Folge-Epics:** M14-E2 «Werft und Seefahrt-Führung» (I-016, I-015, I-019; eigener Save-Sprung oder mit E1 geteilt;
E2-ART Werft-Sprite parallel möglich). Die Werft gehört **nicht** in E1: neues Gebäude mit Auftrag und Bauzeit im
Weltzustand, Sprite und UI würden E1 über 250 Tools heben, und E1 trägt die Kernwahl allein. M14-E3 «Routenrisiko»
(I-014, nur Sturm, Daueranweisung je Route; erst sinnvoll, wenn drei Routen alle Schiffe binden, Muster P2). M14-E4
optional (I-036, I-038 Erkundung).
