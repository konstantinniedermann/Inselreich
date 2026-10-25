# NU-1 · Kartenrand (Erweiterung 2 «Neue Ufer», Etappe 1) — Design-Spec

Stand: **Entwurf unfertig, offen: Zahlen aus Anhang 01 (alle «Wert A01-xx»), §6 Randfälle Nachlese, §7 AK-Feinschliff
nach Anhang 01** · Datum 2026-10-25 · Paket `design-NEUE-UFER` · Prozessstufe voll · Gate Spec: `lead-qa`, `lead-tech`

Grundlage: [Designvorschlag Neue Ufer](2026-10-25-neue-ufer-design.md) §2 (Rulings R962 F1–F6), §3.1–3.3, §6–§8, §10;
[Hauptspec](2026-09-29-inselreich-design.md); [ADR-010](../../adr/ADR-010-zufall-je-periode.md) (Zufall je Ereignis,
kein RNG-Zustand im Save). Werte: [Anhang 01 Werte](2026-10-25-nu1-kartenrand-design/anhang-01-werte.md)
(`design-economy-designer`, verbindlich für alle Zahlen; «Wert A01-xx» ist ein Platzhalter, bis Anhang 01 vorliegt; die
Nummern A01-01 bis A01-12 sind die Zuordnung dieser Spec, Liste in §3.12). Code-Stand main `b945b279`, Save v18.

Kennzeichnung: **Setzung Spec** (hier festgelegt), **[Tech]** (Umsetzungsdetail, `lead-tech` entscheidet im Plan; die
Spec legt nur das prüfbare Verhalten fest), **Entscheid L0** (offen, Liste §10). Regeln ohne Kennzeichnung sind von
`lead-design` gesetzt (Briefing NU-1). Mechaniken sind Genre-Gemeingut, Namen und Inhalte eigen (ADR-006).

## 1 Spielerzweck und Säule

**In einem Satz:** «Nach der Gewürzstadt packe ich ein Schiff für eine Fahrt in den Nebel; was ich einlade, entscheidet
unterwegs, welche Wege mir offenstehen, und der riskante Weg bringt ein Fundstück mit kleiner Dauerwirkung.»

- **Säule:** Insel besiedeln (Archipel erkunden), gestützt vom Fernhandel (das Schiff fehlt der Route). Misslingt NU-1,
  leidet nur die Phase nach Ziel 3; Ziele 1–3 bleiben bitgleich (alles hinter `wonSpice`).
- **Neue Frage:** «Welches Schiff gebe ich her, und was packe ich ein?»
- **Spürbar:** in den ersten 15 Minuten nach Ziel 3 (Kartenhaus nach etwa 1 min, erste Rückkehr nach 3–5 min,
  Richtwert; gerechnet in Anhang 01).
- **Echte Wahl:** Proviant gegen Bedingungsware bei 50 Plätzen; riskant (Fundstück, mehr Ware) gegen sicher; welches
  Schiff der Route fehlt; welches Gebiet zuerst (Hinweis-Waren).

## 2 Umfang und ausdrücklich nicht

**Dabei:** Kartenhaus (Gebäude, Heimat, eines), drei Nebelfelder auf der Seekarte, Sim-Aktionen `startExpedition`,
`chooseOption`, `cancelExpedition` (nur Wartezustand, §3.4), Expeditions-Tick in festen Ticks, Kartenpool je Gebiet mit
eigenem seeded Strom, Proviant und Umkehr, 8 Fundstücke als Def-Modifikatoren mit Sammlungsliste, Chronik-Einträge,
Ausblick-Texte der aufgedeckten Gebiete, Save main + 1, Art-Bedarf.

**Ausdrücklich nicht (aus Designvorschlag §8, NU-1-Teil):**

- Schiffsverlust, Ladungsverlust unterwegs, Erfolgsquoten, Würfel, Moralbalken.
- Mehr als eine Expedition zugleich; Expeditionen nach dem dritten aufgedeckten Gebiet.
- Nebel in der Weltansicht; mehr als 3 Gebiete; prozedurale Gebiete.
- **Keine Landung, keine Erzeugung der Nordinsel oder der Holzschären** (NU-2), kein neues Kontor, keine neue Insel in
  `world.islands`.
- **Keine neuen Güter** (`GOOD_IDS` unverändert); Fundstücke sind keine Ware und liegen nie im Lager.
- Kein Sim-Seeweg zu den Gebieten (feste Ticks, R962 F6); keine Abhängigkeit von HAFEN oder FLAECHE.
- Kein Ehrenbuch-Eintrag, kein Ziel, keine Steuer-, Zielschwellen- oder Preiswirkung der Fundstücke.
- Keine Controller-Expedition im Balancing; keine Änderung an Zielen 1–3, Preisen, `balance.test.ts`-Pins.
- Keine Ereignisse durch Krisen auf See (Sturm, Brand, Boom berühren die Expedition nicht).

## 3 Regeln

### 3.1 Kartenhaus

1. Neuer Eintrag in `src/sim/defs/buildings.ts` (Id [Tech], Vorschlag `chartroom`), Name «Kartenhaus», Grundriss 2×2
   (Setzung Spec), Kategorie `infrastructure` (Setzung Spec), Kosten **Wert A01-01**, Unterhalt **Wert A01-02**, kein
   Ertrag (Geldsenke ohne Geldlohn, R722), `site: [{ kind: 'home' }]`, `maxCount: { n: 1, reason: 'Es gibt schon ein
Kartenhaus' }`.
2. **Nicht brennbar** (kein `flammable`, Setzung Spec): Das Brand-Rechteck `flammableRect` und damit die Brandziehung
   ändern sich durch den Bau nicht; kein Zustand «brennendes Kartenhaus».
3. Baubar erst mit `world.wonSpice` (Sonderfall in `buildLock` wie das Denkmal; Sperrtext «Erst nach der Gewürzstadt»,
   Setzung Spec). Vorher erscheint es nicht im Baumenü (`buildingShown`).
4. Das Kartenhaus wirkt, solange es **steht** (auch ohne Weganschluss, Setzung Spec, KISS). Es schaltet nur die Aktion
   `startExpedition` frei; Fundstücke wirken unabhängig davon.
5. Abriss: normale Rückerstattung (Bestand). Eine laufende Expedition (jede Phase, auch Wartezustand) läuft zu Ende; eine
   neue braucht ein neues Kartenhaus.

### 3.2 Seegebiete und Nebel

1. Drei Gebiete in fester Reihenfolge, Def `SEA_AREAS` in neuer Datei `src/sim/defs/expedition.ts` [Tech: Dateiname]:
   `north` «Nordgebiet», `skerries` «Holzschären», `wrecks` «Wrackfeld» (Namen: Entscheid L0 NU-a).
2. Je Gebiet: Zahl der Abschnitte **Wert A01-07** (2 oder 3), zwei Hinweis-Waren mit Stichwort **Wert A01-08** (z. B.
   «Eis: Werkzeug»), Kartenpool (Karten-Ids, §3.6), Ticks Hinfahrt **A01-04**, je Abschnitt **A01-05**, Rückfahrt
   **A01-06**.
3. Zustand: Ein Gebiet ist **im Nebel** oder **aufgedeckt** (`world.seaRevealed`, §4). Aufgedeckt wird es nur bei der
   Rückkehr einer Expedition, die alle Abschnitte geschafft hat (§3.8). Danach dauerhaft offen.
4. Vor dem Aufdecken zeigt die Seekarte nur Nebel und die zwei Hinweis-Waren, keinen Namen (Platzhalter «Unbekanntes
   Gewässer», Setzung Spec). Nach dem Aufdecken Name und Ausblick-Text (§5.5).
5. Nebel ist **nur Seekarte**, nicht Weltansicht. Die Lage der Felder ist Darstellung, kein Sim-Seeweg.

### 3.3 Aktion `startExpedition`

Signatur [Tech], Vorschlag `startExpedition(world, shipId, area, cargo): Result`; `cargo: Partial<Record<GoodId, number>>`.
Wirft nie. Prüfreihenfolge (Setzung Spec; erster Treffer ist der Grund, Texte wörtlich, Setzung Spec):

| Nr. | Bedingung                                                                 | Grund                                                  |
| --- | ------------------------------------------------------------------------- | ------------------------------------------------------ |
| 1   | alle drei Gebiete aufgedeckt                                              | «Alle Gebiete aufgedeckt»                              |
| 2   | kein Kartenhaus steht                                                     | «Kein Kartenhaus»                                      |
| 3   | `world.expedition !== null`                                               | «Schon eine Expedition unterwegs»                      |
| 4   | `area` keine Gebiets-Id                                                   | «Unbekanntes Gebiet»                                   |
| 5   | Gebiet aufgedeckt                                                         | «Gebiet schon aufgedeckt»                              |
| 6   | Schiff unbekannt                                                          | «Unbekanntes Schiff»                                   |
| 7   | Schiff nicht verfügbar (§3.4)                                             | «Schiff nicht verfügbar: fährt keine Route zur Heimat» |
| 8   | Mengen keine ganzen Zahlen ≥ 0 oder kein `GoodId`                         | «Ungültige Ladung»                                     |
| 9   | Summe > `SHIP.capacity` (50, `src/sim/defs/sea.ts`)                       | «Ladung über 50» (Zahl aus der Def)                    |
| 10  | eine Menge > Heimatlager (`home(world).stock[g]`), erstes Gut in GOOD_IDS | «Ware nicht im Heimatlager: Werkzeug (12, da 4)»       |

Bei Erfolg in derselben Aktion: Ladung aus dem Heimatlager abziehen (Sperrbestand I-049 gilt wie beim Bauen nicht,
Setzung Spec); Kartenfolge ziehen (§3.6) und `world.expeditionCount += 1`; `world.expedition` anlegen mit Phase
`boarding` oder direkt `out` (§3.4). Eine leere Ladung ist zulässig (Folge: Umkehr vor Abschnitt 1, §3.7; die
Packansicht warnt, §5.2). Ein abgewiesener Aufruf ändert die Welt nicht (JSON-gleich).

### 3.4 Schiff: Verfügbarkeit, Wartezustand, Route

**Code-Fakt:** Ein Routenschiff liegt zwischen zwei Ticks nie im Heimathafen; `handleDocked` entlädt, lädt und legt im
selben Tick wieder ab (`src/sim/ships.ts`). «Das Schiff verlässt seine Route» braucht daher einen Wartezustand
(Setzung Spec, Entscheid L0 E1).

1. **Verfügbar** ist ein Schiff, wenn eines gilt: (a) frei in der Heimat (`port 0`, `to null`, `route null`, nicht
   `homing`); (b) Route mit der Heimat als Ende (`route.a === 0 || route.b === 0`); (c) auf Heimkehr (`homing`).
   Nicht verfügbar: Route zwischen zwei Fremdinseln (Grund Nr. 7).
2. **Fall (a):** Phase `out` beginnt sofort in der Aktion.
3. **Fall (b), (c): Phase `boarding`** («Wartet auf das Schiff»). Das Schiff fährt weiter wie bisher (Route bzw.
   Heimkehr), bis es im Heimathafen anlegt. Dort entlädt es **seine gesamte Ladung** nach der Heimkehr-Regel des
   Bestands (`unloadAtHome`: bis `STORAGE_CAP`, Rest verfällt mit `ShipLoss`-Meldung), lädt nichts und wechselt im
   selben Tick in Phase `out`. Die Route bleibt am Schiff gespeichert. Ein Fall-(b)-Schiff legt dafür auch an, wenn es
   nur Gewürz geladen hat, das sonst an Bord bliebe (Liste `keep` entfällt).
4. **`cancelExpedition(world)`** nur in Phase `boarding` (sonst «Expedition schon ausgelaufen», ohne Expedition «Keine
   Expedition»): Ladung zurück ins Heimatlager (bis `STORAGE_CAP`, Rest verfällt, Meldung im Ergebnis [Tech]),
   `world.expedition = null`; `expeditionCount` bleibt erhöht (keine Neuziehung derselben Nummer). Setzung Spec, E1.
5. **Unterwegs** (Phasen `out`, `leg`, `card`, `back`): Das Schiff steht im Zustand `port 0`, `to null`; `tickShips`
   überspringt es [Tech: Ort der Ausnahme]. Es erscheint nicht in der Weltansicht und nicht als Routenpunkt der Seekarte
   (`mapDots`), sondern als Expeditionsmarke (§5.5). Schiffsunterhalt läuft weiter (Bestand).
6. Aktionen am Expeditionsschiff (alle Phasen ausser `boarding`): `retireShip`, `setRoute`, `updateRoute` liefern
   «Schiff ist auf Expedition». In `boarding` gilt für `retireShip` derselbe Grund; `setRoute`/`updateRoute` wie Bestand.
   `clearRoute` bleibt in allen Phasen erlaubt (Bestand: `route null`, `homing true`).
7. **Rückkehr:** Hat das Schiff noch eine Route, nimmt es sie ab dem nächsten Tick wieder auf (Bestand: liegt in der
   Heimat, `handleDocked` lädt und legt ab). Ist die Route weg (`clearRoute` unterwegs), geht es über die
   Heimkehr-Regel in die Ruhe (frei in der Heimat).

### 3.5 Ablauf und Ticks

Phasen (Setzung Spec): `boarding` → `out` → (`leg` → `card`) × Abschnitte → `back` → Rückkehr. Tick-Ort: neue Funktion
`tickExpedition` direkt **nach** `tickShips` in `step()` (Setzung Spec; arc42 Tick-Ablauf und ADR-005-Nachtrag
mitführen). Mit `world.expedition === null` liest sie nichts und zieht keinen Zufall.

| Phase      | Restticks `left`        | je Tick              | Übergang bei `left` 0 bzw. Ereignis         |
| ---------- | ----------------------- | -------------------- | ------------------------------------------- |
| `boarding` | 0 (unbenutzt)           | nichts               | Schiff legt in der Heimat an → `out` (§3.4) |
| `out`      | Hinfahrt **A01-04**     | `left −= 1`          | Abschnitt 0 beginnen (Proviantprüfung §3.7) |
| `leg`      | je Abschnitt **A01-05** | `left −= 1`          | → `card`, offene Karte = `cards[leg]`       |
| `card`     | 0                       | **nichts** (hält an) | nur durch `chooseOption` (§3.6)             |
| `back`     | Rückfahrt **A01-06**    | `left −= 1`          | Rückkehr (§3.8)                             |

- Die Expedition hält bei offener Karte an, das Spiel läuft weiter (kein Zeitdruck). In der Spielpause zählt nichts.
- Spieltempo wirkt wie auf alle Ticks; Rat (Seerecht) und HAFEN-Fahrzeiten wirken **nicht** (feste Ticks, F6).
- Krisen (Brand, Sturm, Boom) lesen und ändern die Expedition nicht.

### 3.6 Wahl-Karten: Pool, Ziehung, Wahl

1. Def `EXPEDITION_CARDS` in `src/sim/defs/expedition.ts`: je Karte Id, Gebiet, Titel, Text, 2–3 Optionen (Katalog
   **Wert A01-09**). Option: Beschriftung, höchstens eine **Bedingung** `{ good, n }` (Ware an Bord, wird verbraucht),
   höchstens ein **Fundstück** `find`.
2. **Def-Regeln (Wächter-Test):** jede Karte hat mindestens eine Option ohne Bedingung (sonst Stillstand bei leerer
   Ladung); jedes der 8 Fundstücke hängt an genau einer Option im ganzen Katalog; eine Option mit Fundstück hat eine
   Bedingung; Pool je Gebiet ≥ Abschnitte des Gebiets.
3. **Ziehung beim Start** (ADR-010-Muster, Setzung Spec): `r = createRng((seed ^ Math.imul(n + 1, EXPEDITION_SALT))

> > > 0)`mit`n = world.expeditionCount`vor dem Erhöhen;`EXPEDITION_SALT`neue Konstante in
  `src/sim/defs/expedition.ts`, verschieden von Auftrag `0x9e3779b1`, `CRISIS_SALT`, `ISLANDS_SALT`[Tech: Wert].
   Kandidaten = Pool des Gebiets in Def-Reihenfolge **ohne** Karten, deren Fundstück schon in`world.finds`liegt. Für
   Abschnitt i = 0 … k−1:`j = floor(r() × Kandidaten.length)`, Karte j nehmen und entfernen. Reichen die Kandidaten
   nicht, werden die übrigen Plätze ohne Ziehung mit den ausgeschlossenen Karten in Def-Reihenfolge gefüllt. Keine Karte
   doppelt je Fahrt. Die Folge wird gespeichert (`expedition.cards`); kein RNG-Zustand im Save, nur Zähler und Ergebnis.

4. Eine Option, deren Fundstück schon in der Sammlung oder an Bord liegt, ist **gesperrt** mit «Schon in der Sammlung»
   (tritt nur im Auffüll-Fall aus 3. auf).
5. **`chooseOption(world, index)`** (Signatur [Tech]): Gründe «Keine Karte offen», «Ungültige Option», «Braucht 12
   Werkzeug an Bord (da 4)» (Gut-Name aus `GOODS`, Menge aus der Def), «Schon in der Sammlung». Bei Erfolg: Bedingung
   von `expedition.cargo` abziehen; Fundstück an `expedition.finds` anhängen; offene Karte schliessen; nächster
   Abschnitt mit Proviantprüfung (§3.7) oder, nach dem letzten, Phase `back` mit `done = true`.
6. Die Kartenfolge ist dem Spieler verborgen; die UI zeigt nur die offene Karte und «Abschnitt i von k».

### 3.7 Proviant und Umkehr

1. Proviant-Gut und Menge je Abschnitt: **Wert A01-03** (Def in `src/sim/defs/expedition.ts`).
2. Prüfung beim Beginn **jedes** Abschnitts (nach der Hinfahrt und nach jeder Wahl): `cargo[Proviant] ≥ Menge` →
   abziehen, Phase `leg`. Sonst **Umkehr**: Phase `back` mit Rückfahrt **A01-06** [A01: gleiche Rückfahrt wie bei
   voller Fahrt oder eigener Wert], `done = false`.
3. Bei Umkehr bleibt das Gebiet im Nebel; **gewonnene Fundstücke bleiben** (an Bord, Übergabe bei Rückkehr); keine Ware
   geht verloren. Auf Hin- und Rückfahrt wird kein Proviant verbraucht.
4. Eine Bedingungsware darf das Proviant-Gut sein; die Wahl kann so die nächste Prüfung kippen (gewollt, Kapazität als
   Spannung).

### 3.8 Rückkehr

In dem Tick, in dem `back` auf 0 fällt (Setzung Spec, Reihenfolge):

1. Restladung ins Heimatlager in `GOOD_IDS`-Reihenfolge bis `STORAGE_CAP`; Überschuss verfällt und wird gemeldet
   (Regel des Bestands wie `unloadAtHome`, im `StepReport` [Tech]).
2. `expedition.finds` an `world.finds` anhängen (Wirkung ab dem nächsten Tick).
3. Bei `done`: Gebiet an `world.seaRevealed` anhängen.
4. `world.expedition = null`; das Schiff nimmt §3.4 Punkt 7.
5. Chronik/Ereignis-Log (UI aus Zustandsvergleich, Muster `monumentEvents`, §5.6).

### 3.9 Fundstücke

1. Acht Stücke, Def `FINDS` in `src/sim/defs/expedition.ts` (oder `finds.ts` [Tech]): Id, Name, Kurztext mit Zahl,
   Symbol-Kennung, Hebel. Katalog und Werte **Wert A01-10**.
2. **Hebel:** wirksamer Wert über einen Helfer mit Weltbezug (Muster Rat `activeLever`, Seerecht-Spec §3.2); die Def
   bleibt unverändert. Hebelarten nur aus A01 (Typ-Union [Tech]); **nie** auf Steuer (`TAX_*`), Zielschwellen
   (`WIN_*`), Preise (`GOODS.buy/sell`) und nie auf Werte, die vor `wonSpice` wirken können, ohne dass ein Fundstück
   besessen wird (automatisch erfüllt, weil `world.finds` vor Ziel 3 leer ist).
3. Wirkung **ab Übergabe** (Rückkehr), nicht an Bord. Kein Stapeln: jedes Stück höchstens einmal in `world.finds`
   (§3.6 Punkt 3–4). Sammlung nie verlierbar, auch nicht durch Abriss des Kartenhauses.
4. Zusammenspiel mit Rat und Inselvorteil: Das Fundstück wirkt als **letzter** Faktor auf den wirksamen Wert (nach Def,
   Ausbaustufe, Rat, Trait; Setzung Spec); Rundung [Tech], Prüfwerte in A01.
5. **Sichtbar in jeder Partie:** jede Wirkung erscheint an der Stelle, die den Wert schon zeigt (Gebäudekarte,
   Inselkarte, Schiffsliste …), mit Zusatz «(Fundstück «Name»)»; Leseort je Stück nennt A01.
6. Satzbonus für alle 8: nur wenn A01 ihn führt (**Wert A01-11**); ohne Eintrag keiner. Kein Prozentstapel.

### 3.10 Ende und Grenzen

- Höchstens eine Expedition zugleich (Grund Nr. 3). Nach dem dritten aufgedeckten Gebiet keine mehr (Grund Nr. 1); das
  Kartenhaus bleibt stehen (Unterhalt läuft, Abriss erlaubt, Karte zeigt «Alle Gebiete aufgedeckt»).
- Wiederholung nach Umkehr: beliebig oft, neue Folge aus neuem Zähler.

### 3.11 Warnung Gewürz

Vor dem Auslaufen (UI, Packansicht): fährt das gewählte Schiff eine Route mit `spice` in `ab` oder `ba`, erscheint
«Dieses Schiff fährt Gewürz. Ohne die Route kann die Gewürzstadt Kaufleute verlieren.» (Setzung Spec); «Auslaufen»
bleibt möglich. Keine Sim-Sperre.

### 3.12 Werteliste (Platzhalter bis Anhang 01)

| Nr.    | Wert                                                           | Ort (`src/sim/defs/`)              |
| ------ | -------------------------------------------------------------- | ---------------------------------- |
| A01-01 | Kartenhaus-Kosten (Geld, Holz, Werkzeug, Stein)                | `buildings.ts` Kartenhaus          |
| A01-02 | Kartenhaus-Unterhalt                                           | `buildings.ts` Kartenhaus          |
| A01-03 | Proviant-Gut und Menge je Abschnitt                            | `expedition.ts`                    |
| A01-04 | Hinfahrt-Ticks je Gebiet                                       | `expedition.ts` `SEA_AREAS`        |
| A01-05 | Ticks je Abschnitt je Gebiet                                   | `expedition.ts` `SEA_AREAS`        |
| A01-06 | Rückfahrt-Ticks je Gebiet (voll / nach Umkehr)                 | `expedition.ts` `SEA_AREAS`        |
| A01-07 | Abschnitte je Gebiet (2–3)                                     | `expedition.ts` `SEA_AREAS`        |
| A01-08 | Hinweis-Waren und Stichworte je Gebiet                         | `expedition.ts` `SEA_AREAS`        |
| A01-09 | Kartenkatalog (Karten, Optionen, Bedingungen, Fundstück)       | `expedition.ts` `EXPEDITION_CARDS` |
| A01-10 | 8 Fundstücke (Name, Text, Hebel, Wert, Leseort)                | `expedition.ts` `FINDS`            |
| A01-11 | Satzbonus (oder keiner)                                        | `expedition.ts`                    |
| A01-12 | Prüfrechnung: Dauer erste Expedition, Packlage «kein Dominant» | nur Anhang (AK-NU1-30)             |

`SHIP.capacity` (50) und `STORAGE_CAP` (100) sind Bestand und bleiben unverändert.

## 4 Zustand und Save

Neue Weltfelder (Namen [Tech], Form Setzung Spec):

```ts
type SeaAreaId = 'north' | 'skerries' | 'wrecks';
type ExpeditionPhase = 'boarding' | 'out' | 'leg' | 'card' | 'back';
interface Expedition {
  ship: number; // Schiff-id
  area: SeaAreaId;
  phase: ExpeditionPhase;
  leg: number; // 0 … k−1, aktueller Abschnitt
  left: number; // Restticks der Phase (0 in boarding/card)
  cargo: Partial<Record<GoodId, number>>; // nur Einträge ≥ 1, Summe ≤ SHIP.capacity
  cards: CardId[]; // gezogene Folge, Länge k
  open: CardId | null; // offene Karte, ≠ null genau in Phase card (= cards[leg])
  finds: FindId[]; // an Bord gewonnene Stücke
  done: boolean; // alle Abschnitte geschafft (nur in back aussagekräftig)
}
// World:
expedition: Expedition | null;
seaRevealed: SeaAreaId[]; // Aufdeck-Reihenfolge, ohne Doppelte
finds: FindId[]; // Sammlung in Fund-Reihenfolge, ohne Doppelte
expeditionCount: number; // Strom-Zähler (ADR-010), monoton
```

- Kartenhaus ist ein normales Gebäude in `world.buildings`.
- **Version:** `SAVE_VERSION` = main + 1 zum Merge-Zeitpunkt (R909, keine feste Nummer in der Spec).
- **Alter Stand** (Version < neu): wird mit Hinweis abgewiesen, nie ein Absturz (Setzung Briefing; Verfassung §3).
  Hinweistext [Tech], z. B. bestehend «Unbekannte Version». Alternative Migration: Entscheid L0 E2.
- **Ladeprüfung** (Abweisen mit «Beschädigter Spielstand», kein Wurf), Einzelheiten [Tech]:
  - `wonSpice false` ⇒ `expedition null`, `seaRevealed` leer, `finds` leer, `expeditionCount 0`, kein Kartenhaus.
  - Höchstens ein Kartenhaus, Insel 0. `expeditionCount ≥ seaRevealed.length` und ≥ 1 bei laufender Expedition.
  - `seaRevealed`, `finds`: gültige Ids, ohne Doppelte; `expedition.finds` disjunkt zu `world.finds`.
  - Expedition: Schiff existiert; Gebiet gültig und nicht in `seaRevealed`; `cards` Länge k, Ids aus dem Pool des
    Gebiets, ohne Doppelte; `leg` in 0 … k−1; `open` wie oben; `left` in 1 … Phasenwert für `out`, `leg`, `back`, 0 für
    `boarding` und `card`; Ladung ganzzahlig ≥ 1 je Eintrag, Summe ≤ Kapazität; ausser in `boarding` gilt am Schiff
    `port 0`, `to null`, `cargo` leer; in `boarding` hat das Schiff eine Route mit Heimat-Ende oder `homing`.
- **Determinismus:** Speichern und Laden in jeder Phase (auch bei offener Karte) und Weiterlaufen ergibt dieselbe Welt
  wie ohne Unterbrechung.
- **Doku-Folgen:** ADR-010 Nachtrag «Expeditionen: Salt, Zähler, Ergebnis im Save»; arc42 Tick-Ablauf und Persistenz;
  README (Kartenhaus, Expedition); `docs/spielwerte.md` Abschnitt Expedition.

## 5 Bedienung (desktop-first ab 1280 px)

### 5.1 Kartenhaus-Karte (Gebäudekarte)

Zeigt: Gebiete «aufgedeckt k / 3», Fundstücke «k / 8», Zustand der Expedition («Keine Expedition» · «Wartet auf Schiff
3» · «Hinfahrt Nordgebiet · noch 0:42» · «Abschnitt 2 von 3» · «Karte wartet» · «Rückfahrt · noch 0:30»), Knopf
«Expedition ausrüsten» (öffnet §5.2; gesperrt mit Sim-Grund aus §3.3 Nr. 1–3), im Wartezustand «Abbrechen».
Zeitformat `formatGameTime` (R835).

### 5.2 Packansicht

- **Gebiet:** drei Felder; Nebelgebiet mit zwei Hinweis-Waren («Eis: Werkzeug · Kälte: Stoff»), aufgedeckte grau mit
  Namen und «aufgedeckt»; je Gebiet «k Abschnitte · Dauer ≈ m:ss» (Summe der festen Ticks ohne Wartezeit).
- **Schiff:** Liste aller Schiffe mit Zustand: «frei», «Route Heimat ⇄ Möweninsel (läuft nach Ankunft aus)», «Route ohne
  Heimat» (gesperrt, Grund Nr. 7). Bei Gewürz-Route die Warnung §3.11.
- **Ladung:** je Gut im Heimatlager Zeile mit Bestand, Feld/Knöpfe −/+ (Schritt 1, mit Umschalt 5 [Tech]),
  Hinweis-Waren hervorgehoben; **Kapazitätsbalken** «n / 50» (Wert aus `SHIP.capacity`), voll in Warnfarbe.
- **Proviantzeile:** «Proviant reicht für p von k Abschnitten»; bei p < k Warnfarbe und «Das Schiff kehrt vorher um».
- **Auslaufen:** Knopf gesperrt mit dem Grund aus einer reinen Vorprüfung, die dieselben Regeln wie `startExpedition`
  nutzt [Tech: gemeinsame Prüffunktion]. Kein stilles Scheitern.

### 5.3 Kartendialog

- Öffnet bei `phase card` automatisch nicht modal [Tech], über HUD-Chip «Expedition: Karte wartet» jederzeit erneut;
  `Esc` schliesst ohne Wahl (Karte bleibt offen).
- Zeigt Titel, Text, «Abschnitt i von k», aktuelle Ladung an Bord und Proviant.
- Je Option ein Knopf mit Bedingung («−12 Werkzeug») und ggf. Fundstück-Symbol mit Name; **gesperrte Option** grau mit
  Grund aus `chooseOption` («Braucht 12 Werkzeug an Bord (da 4)»). Sim-Grund und Anzeige sind derselbe Text.

### 5.4 Fundstück-Liste

In der Seekarte (Popover «Inseln») ein Abschnitt «Fundstücke k / 8»: 8 Plätze in Def-Reihenfolge; gefunden: Symbol,
Name, Wirkungstext mit Zahl; an Bord: Symbol blass, «an Bord»; nicht gefunden: «?» ohne Namen. Bei Satzbonus dessen
Zeile.

### 5.5 Seekarte mit Nebel

- Drei Nebelfelder am Rand des Archipels (Lage [Tech]/Art; Vorgabe: ausserhalb des Insel-Rechtecks, ohne Überdeckung von
  Inseln, Layout reserviert dafür einen Randstreifen). Tooltip: Hinweis-Waren bzw. Name und Ausblick.
- Ausblick-Texte nach Aufdecken (Setzung Spec): Nordgebiet «Nordküste · vereist, noch keine Landung möglich» (NU-b);
  Holzschären «Holzschären · bewaldete Schären, noch keine Landung möglich»; Wrackfeld «Wrackfeld · kein Land, nur
  Wracks».
- Expeditionsmarke: in `out` und `back` auf der Linie Heimat ⇄ Nebelfeld (Anteil aus `left`), in `leg`/`card` am Feld;
  `boarding` ohne Marke (Schiff fährt noch seine Route).
- `seaMapKey` enthält Nebelzustand, Expeditionsphase und Marke, damit die Karte neu zeichnet.

### 5.6 Chronik und HUD

Ereignis-Log-Einträge (UI-Zustandsvergleich, Muster `monumentEvents`, Texte Setzung Spec): «Expedition ins Nordgebiet
ausgelaufen» · «Expedition: Karte wartet» (Meldung) · «Proviant aus: Expedition kehrt um» · «Expedition zurück» · je
übergebenem Stück «Fundstück: Name» · «Nordgebiet aufgedeckt». Inselchronik-Zeile «Seegebiete k/3 · Fundstücke k/8»
erst nach `wonSpice`. HUD-Chip nur in Phase `card`.

## 6 Randfälle

| Fall                                                | Erwartetes Verhalten                                                                      |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Heimatlager leer, Ladung 0                          | Start erlaubt; Umkehr vor Abschnitt 1, Gebiet bleibt Nebel; Packansicht warnt             |
| Ware fehlt im Lager                                 | Grund Nr. 10 mit Gut und Mengen, Welt unverändert                                         |
| Ladung genau 50 / 51                                | 50 erlaubt, 51 «Ladung über 50»                                                           |
| Route-Schiff gewählt                                | `boarding`, läuft bei nächster Heimankunft aus; Routenladung nach Heimkehr-Regel entladen |
| Route zwischen Fremdinseln                          | Grund Nr. 7                                                                               |
| Abbruch im Wartezustand                             | Ladung zurück (Lagergrenze), Zähler bleibt; nach Auslaufen kein Abbruch                   |
| Route unterwegs aufgelöst                           | Rückkehr in die Ruhe (frei in der Heimat)                                                 |
| Kontor II der Routen-Gegeninsel abreissen           | Bestand «Erst Route auflösen» (Route bleibt am Schiff gespeichert)                        |
| Schiff verkaufen unterwegs                          | «Schiff ist auf Expedition»                                                               |
| Kartenhaus abgerissen (jede Phase)                  | Fahrt läuft zu Ende; neue Fahrt erst mit neuem Kartenhaus (Grund Nr. 2)                   |
| Speichern bei offener Karte, Laden                  | Karte wieder offen, gleiche Optionen und Sperren                                          |
| Karte nie gewählt                                   | Expedition wartet unbegrenzt; Schiff fehlt der Route; Spiel läuft normal                  |
| Alle Optionen gesperrt                              | ausgeschlossen durch Def-Regel (Option ohne Bedingung, AK-NU1-08)                         |
| Proviant vor letztem Abschnitt aus                  | Umkehr, Fundstücke an Bord bleiben, Gebiet Nebel                                          |
| Fundstück schon in Sammlung                         | Karte nicht gezogen; im Auffüll-Fall Option gesperrt «Schon in der Sammlung»              |
| Heimatlager voll bei Rückkehr                       | bis `STORAGE_CAP` entladen, Rest verfällt, Meldung (Bestand)                              |
| Sturm, Brand, Boom während der Fahrt                | keine Wirkung auf Expedition und Schiff                                                   |
| Seerecht beschlossen während der Fahrt              | keine Umrechnung von `left` (feste Ticks)                                                 |
| Drittes Gebiet aufgedeckt                           | Grund Nr. 1 für jeden weiteren Start; Kartenhaus bleibt                                   |
| Spielstand ohne Ziel 3 mit Expedition (manipuliert) | abgewiesen                                                                                |
| Alter Spielstand (v18)                              | abgewiesen mit Hinweis, kein Absturz (oder Migration nach E2)                             |
| Spielpause                                          | keine Restticks laufen; Wahl in der Pause erlaubt                                         |

## 7 Abnahmekriterien

(V) = Vitest, (B) = Browser-Check bei 1280 px durch `qa-playtester`, Screenshots `.studio/qa/NU-1/`. Testwelten mit
gesetztem `wonSpice` und Kartenhaus über Test-Helfer [Tech].

**Kartenhaus** (`tests/sim/expedition.test.ts`):

1. **AK-NU1-01 (V)** Vor `wonSpice` liefert `canPlace` für das Kartenhaus «Erst nach der Gewürzstadt»; danach `ok` auf
   der Heimat, auf einer Fremdinsel «Nur auf der Heimatinsel»; ein zweites «Es gibt schon ein Kartenhaus». Kosten und
   Unterhalt gleich A01-01/02 aus der Def.
2. **AK-NU1-02 (V)** Bau des Kartenhauses ändert `flammableRect` nicht (gleiches Rechteck vorher/nachher).

**Start** (`tests/sim/expedition.test.ts`):

3. **AK-NU1-03 (V)** Jede Zeile der Tabelle §3.3 hat einen Fall mit genau dem Grundtext; nach jedem abgewiesenen Aufruf
   ist die Welt JSON-gleich; kein Aufruf wirft (auch `null`, negative, gebrochene Mengen, fremde Gut-Ids).
4. **AK-NU1-04 (V)** Erfolg mit freiem Schiff: Heimatlager um die Ladung kleiner, Phase `out`, `left` = A01-04,
   `expeditionCount` +1, `cards` Länge k ohne Doppelte, alle aus dem Pool.
5. **AK-NU1-05 (V)** Routenschiff Heimat ⇄ Insel: Phase `boarding`; beim nächsten Anlegen in der Heimat wird die gesamte
   Routenladung entladen (bis Lagergrenze), Phase `out` im selben Tick, Route am Schiff unverändert. Homing-Schiff
   ebenso. Route zwischen zwei Fremdinseln: Grund Nr. 7.
6. **AK-NU1-06 (V)** `cancelExpedition` in `boarding` gibt die Ladung zurück und setzt `expedition null`, Zähler bleibt;
   in `out` liefert es «Expedition schon ausgelaufen», ohne Expedition «Keine Expedition».

**Ablauf** (`tests/sim/expedition.test.ts`):

7. **AK-NU1-07 (V)** Volle Fahrt mit genug Proviant: Ticks bis zur ersten Karte = A01-04 + A01-05; Restticks laufen in
   `card` nicht; nach k Wahlen Rückfahrt A01-06; Rückkehr im erwarteten Tick; Gebiet in `seaRevealed`, Restladung im
   Lager, Fundstücke in `world.finds`, `expedition null`; Routenschiff fährt im Folgetick wieder seine Route.
8. **AK-NU1-08 (V, Wächter `tests/sim/expedition-defs.test.ts`)** Def-Regeln §3.6 Punkt 2: jede Karte ≥ 1 Option ohne
   Bedingung; jedes Fundstück an genau einer Option; Fundstück-Optionen haben eine Bedingung; Pool ≥ Abschnitte; 3
   Gebiete mit 2–3 Abschnitten und je 2 Hinweis-Waren; 8 Fundstücke; Bedingungsgüter ∈ `GOOD_IDS`.
9. **AK-NU1-09 (V)** `chooseOption`: gesperrte Option liefert «Braucht n Gut an Bord (da m)» und ändert nichts;
   erlaubte verbraucht genau die Bedingung, hängt das Fundstück an `expedition.finds`; «Keine Karte offen» ausserhalb
   `card`; «Ungültige Option» für Index ausserhalb.
10. **AK-NU1-10 (V)** Proviant reicht für 1 von k Abschnitten: nach Karte 1 Umkehr, `done false`, Gebiet nach Rückkehr
    nicht in `seaRevealed`, Fundstück aus Karte 1 in `world.finds`, keine Ware ausser Verbrauch fehlt.
11. **AK-NU1-11 (V)** Ladung 0: Umkehr direkt nach der Hinfahrt.
12. **AK-NU1-12 (V)** Höchstens eine Expedition; nach drittem aufgedeckten Gebiet «Alle Gebiete aufgedeckt», auch mit
    neuem Kartenhaus.
13. **AK-NU1-13 (V)** Kartenhaus während `leg` abreissen: Fahrt endet normal; danach Start «Kein Kartenhaus».
14. **AK-NU1-14 (V)** Am Expeditionsschiff liefern `retireShip`, `setRoute`, `updateRoute` «Schiff ist auf
    Expedition»; `clearRoute` unterwegs → nach Rückkehr frei in der Heimat (`route null`, nicht `homing`).
15. **AK-NU1-15 (V)** Brand, Sturm und Boom während der Fahrt (erzwungene Krise): `world.expedition` tickweise gleich
    einem Lauf ohne Krise; Seerecht-Beschluss ändert `left` nicht.
16. **AK-NU1-16 (V)** Rückkehr mit vollem Heimatlager: entladen bis `STORAGE_CAP`, Überschuss gemeldet (Bestand).

**Ziehung** (`tests/sim/expedition-cards.test.ts`):

17. **AK-NU1-17 (V)** Gleicher Seed und Zähler ⇒ gleiche Folge; anderer Zähler ⇒ eigene Folge; die Ziehung ändert keine
    Auftrags-, Krisen- oder Inselziehung (Vergleich `orderForPeriod`, `rollCrisis`, Inselerzeugung mit und ohne
    Expedition). Prüffolgen für Seeds 1–3 gepinnt.
18. **AK-NU1-18 (V)** Karten mit besessenem Fundstück werden nicht gezogen; Auffüll-Fall in Def-Reihenfolge mit gesperrter
    Option «Schon in der Sammlung».

**Fundstücke** (`tests/sim/finds.test.ts`):

19. **AK-NU1-19 (V)** Je Fundstück ein Test: wirksamer Wert ohne Stück = Def, mit Stück = A01-10-Prüfwert; Def-Objekt
    unverändert; Wirkung erst ab Rückkehr, nicht an Bord.
20. **AK-NU1-20 (V, Wächter)** Kein Hebel zielt auf Steuer, `WIN_*`, `GOODS.buy/sell`; mit leerem `world.finds` liefern
    alle Helfer die heutigen Werte (gleiche Ergebnisse für bestehende Testwelten).
21. **AK-NU1-21 (V)** Kein Stück zweimal in `world.finds` über beliebige Wiederholungsfahrten (Lauf mit 10 Umkehr-Fahrten).

**Save** (`tests/sim/expedition-save.test.ts`):

22. **AK-NU1-22 (V)** Round-Trip in jeder Phase (`boarding`, `out`, `leg`, `card`, `back`): tief gleich; danach N Ticks
    und Wahlen ergeben denselben Welt-Hash wie ohne Speichern.
23. **AK-NU1-23 (V)** `SAVE_VERSION` gegenüber dem Stand vor NU-1 erhöht (relativ, ohne Literal); ein Fixture mit
    `SAVE_VERSION − 1` wird mit nicht leerem Hinweis abgewiesen, kein Wurf (bei E2 = Migration statt dessen: lädt mit
    `expedition null`, leeren Listen, Zähler 0).
24. **AK-NU1-24 (V)** Manipulierte Stände nach §4 Ladeprüfung (je Regel ein Fall, u. a. Expedition ohne `wonSpice`,
    doppelte Karte, `open` ausserhalb `card`, Fundstück doppelt, zwei Kartenhäuser) werden abgewiesen, kein Wurf.

**Baseline**:

25. **AK-NU1-25 (V)** `tests/sim/balance.test.ts`, alle `balance-*.test.ts`, `seePins.ts`, `e0Pins.ts`, `e1Pins.ts`,
    `seaGolden.test.ts` ohne Änderung an Erwartungen grün und bitgleich; der Controller ruft keine Expeditions-Aktion
    (Quelltext-Prüfung `tests/sim/controller.ts`).
26. **AK-NU1-26 (V)** Mit `expedition null` ändert `tickExpedition` nichts (Welt JSON-gleich vor/nach dem Aufruf).

**UI-Helfer** (`tests/ui/expeditionView.test.ts`, `tests/ui/seaMapView.test.ts`):

27. **AK-NU1-27 (V)** Packmodell: Kapazität «n / 50», Proviantzeile «reicht für p von k», Gewürz-Warnung genau bei
    Route mit `spice`, Auslaufen-Grund = Sim-Grund; Schiffsliste mit Zuständen §5.2.
28. **AK-NU1-28 (V)** Kartenmodell: gesperrte Option trägt den Sim-Grund wörtlich; Ereignis-Einträge §5.6 aus
    Zustandsvergleich (je Übergang genau ein Eintrag, gleicher Stand ergibt []).
29. **AK-NU1-29 (V)** Seekarte: Nebel ohne Namen mit Hinweis-Waren; aufgedeckt mit Ausblick-Text §5.5 wörtlich;
    `seaMapKey` ändert sich bei Phase und Aufdecken; `mapDots` enthält das Expeditionsschiff nicht.

**Werte und Browser**:

30. **AK-NU1-30 (V oder Rechnung)** A01-12: Dauer der ersten Expedition ohne Wartezeit in 3–5 min Spielzeit; je Gebiet
    gibt es mit 50 Plätzen keine Packung, die alle Fundstück-Optionen und vollen Proviant zugleich erlaubt (Wächter über
    die Defs, Rechnung A01).
31. **AK-NU1-31 (B)** Ablauf: Kartenhaus bauen, Packansicht (Balken, Hinweis-Waren, Warnung bei Gewürz-Schiff),
    Auslaufen, Kartendialog mit gesperrter Option und Grund, Wahl, Rückkehr; Seekarte zeigt Nebel, Marke, danach
    «Nordküste · vereist, noch keine Landung möglich»; Fundstück-Liste und sichtbare Wirkung an der Leseort-Stelle.
32. **AK-NU1-32 (B)** Bei 1280 px keine Abschnitte abgeschnitten, kein horizontales Scrollen; bei 800 px kein Absturz,
    keine Konsolenfehler; Expeditionsschiff nicht in der Weltansicht.
33. **AK-NU1-33 (Review)** Doku: README, `docs/spielwerte.md`, arc42 (Tick-Ablauf, Persistenz), ADR-010-Nachtrag;
    `make docs-check` Exit 0.

## 8 Schnitte für den Plan (Vorschlag)

| Schnitt | Inhalt                                                                                        | AK             |
| ------- | --------------------------------------------------------------------------------------------- | -------------- |
| NU1-SIM | Defs `expedition.ts`, Kartenhaus, Aktionen, `tickExpedition`, Ziehung, Fundstück-Helfer, Save | 01–26, 30      |
| NU1-UI  | Kartenhaus-Karte, Packansicht, Kartendialog, HUD-Chip, Chronik, Seekarte Nebel und Liste      | 27–29, 31–33   |
| NU1-ART | Sprite Kartenhaus, Nebelfelder, Silhouetten, 8 Symbole, Expeditionsmarke                      | 31, 32 (Optik) |

SIM vor UI; ART parallel zu SIM (nur Bilder und Zeichner gegen Fake-Kontext). Ist SIM zu gross, Schnitt SIM-a (Defs,
Kartenhaus, Aktionen, Tick, Ziehung) und SIM-b (Fundstücke, Save) [Tech]. Save-Nummer erst beim Merge (R909).

## 9 Art-Bedarf (Notiz für `lead-art`)

- Kartenhaus-Sprite 2×2 (Heimat, ruhiger Ton, Kartenrollen/Globus-Motiv eigen), mit Varianz nach GEBAEUDE-VARIANZ.
- Seekarte: Nebelfeld (weich, animiert höchstens leicht), drei Gebiets-Silhouetten (vereiste Küste, kleine bewaldete
  Schären, Wrackmasten ohne Land), Expeditionsmarke (Schiff mit Fähnchen).
- 8 Fundstück-Symbole (klein, 16–24 px, prozedural oder Glyphe), blasse Form «an Bord», «?»-Platz.
- Keine fremden Assets geplant; Nachweis nach ADR-011, falls doch.

## 10 Entscheide L0 (mit Empfehlung)

| Nr. | Frage                                                                                                              | Empfehlung                                                                                                           |
| --- | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| E1  | Wartezustand `boarding` für Routen- und Heimkehrschiffe (Code-Fakt §3.4) samt Abbruch nur vor dem Auslaufen        | ja; sonst müsste der Spieler die Route auflösen, was «nimmt die Route wieder auf» unmöglich macht                    |
| E2  | Alter Stand: Abweisen (gesetzt) oder Migration v18 → neu mit `expedition null`, leeren Listen, Zähler 0            | Migration: trivial, alles hinter `wonSpice`, Bestandspraxis (Kette v1–v18) und Persona-Regel; AK-NU1-23 deckt beides |
| E3  | Namen «Kartenhaus», «Nordgebiet», «Holzschären», «Wrackfeld», «Unbekanntes Gewässer», Fundstück-Namen (A01) — NU-a | ja (Gattungswörter, ADR-006)                                                                                         |
| E4  | Routenladung beim Anlegen für die Expedition nach Heimkehr-Regel (Überschuss über Lagergrenze verfällt)            | ja (Bestand, selten; Packansicht nennt es nicht eigens)                                                              |
| E5  | Gebiet erst bei der Rückkehr aufdecken (nicht schon bei der letzten Wahl)                                          | ja (einfachere Invarianten; Setzung «nach dem letzten Abschnitt» erfüllt)                                            |
