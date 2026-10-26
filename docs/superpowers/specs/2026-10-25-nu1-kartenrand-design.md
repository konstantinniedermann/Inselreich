# NU-1 · Kartenrand (Erweiterung 2 «Neue Ufer», Etappe 1) — Design-Spec

Stand: **Gate Spec** (Zahlen eingearbeitet, Sichtung `lead-design` umgesetzt) · Datum 2026-10-26 · Paket
`design-NEUE-UFER` · Prozessstufe voll · Gate Spec: `lead-qa`, `lead-tech`

Grundlage: [Designvorschlag Neue Ufer](2026-10-25-neue-ufer-design.md) §2 (Rulings R962 F1–F6), §3.1–3.3, §6–§8, §10;
[Hauptspec](2026-09-29-inselreich-design.md); [ADR-010](../../adr/ADR-010-zufall-je-periode.md) (Zufall je Ereignis,
kein RNG-Zustand im Save); R970 (E1–E5 entschieden). Werte: [Anhang 01](2026-10-25-nu1-kartenrand-design/anhang-01-werte.md)
(Rechenweg, Bilanz, Sichtung) und [Anhang 02](2026-10-25-nu1-kartenrand-design/anhang-02-def-werte.md) (normative
Def-Werte, Vorlage für `src/sim/defs/`). «A01-xx» verweist auf die Nummern in Anhang 02 §1. Code-Stand main
`b945b279`, Save v18.

Kennzeichnung: **Setzung Spec** (hier festgelegt), **[Tech]** (Umsetzungsdetail, `lead-tech` entscheidet im Plan; die
Spec legt nur das prüfbare Verhalten fest), **Entscheid L0** (offen, §10). Regeln ohne Kennzeichnung sind von
`lead-design` gesetzt. Mechaniken sind Genre-Gemeingut, Namen und Inhalte eigen (ADR-006).

## 1 Spielerzweck und Säule

**In einem Satz:** «Nach der Gewürzstadt packe ich ein Schiff für eine Fahrt in den Nebel; was ich einlade, entscheidet
unterwegs, welche Wege mir offenstehen, und der riskante Weg bringt ein Fundstück mit kleiner Dauerwirkung.»

- **Säule:** Insel besiedeln (Archipel erkunden), gestützt vom Fernhandel (das Schiff fehlt der Route). Misslingt NU-1,
  leidet nur die Phase nach Ziel 3; Ziele 1–3 bleiben bitgleich (alles hinter `wonSpice`).
- **Neue Frage:** «Welches Schiff gebe ich her, und was packe ich ein?»
- **Echte Wahl:** Proviant gegen Bedingungsware bei 50 Plätzen (für alle Fälle bräuchte man 57/63/61, der sichere Weg
  braucht 32/36/43); riskant (Fundstück, mehr Ware) gegen sicher; welches Schiff der Route fehlt; welches Gebiet zuerst.

## 2 Umfang und ausdrücklich nicht

**Dabei:** Kartenhaus (Gebäude, Heimat, eines), drei Nebelfelder auf der Seekarte, Sim-Aktionen `startExpedition`,
`chooseOption`, `cancelExpedition` (nur Wartezustand), Expeditions-Tick in festen Ticks, Kartenpool je Gebiet mit
festem Strom je Seed und Gebiet, Proviant, Umweg und Umkehr, 8 Fundstücke als Def-Modifikatoren mit Sammlungsliste,
Chronik-Einträge, Ausblick-Texte der aufgedeckten Gebiete, Save main + 1 mit Migration, Art-Bedarf.

**Ausdrücklich nicht (Designvorschlag §8, NU-1-Teil):**

- Schiffsverlust, Ladungsverlust unterwegs, Erfolgsquoten, Würfel, Moralbalken.
- Mehr als eine Expedition zugleich; Expeditionen nach dem dritten aufgedeckten Gebiet.
- Nebel in der Weltansicht; mehr als 3 Gebiete; prozedurale Gebiete.
- **Keine Landung, keine Erzeugung der Nordinsel oder der Holzschären** (NU-2), kein neues Kontor, keine neue Insel in
  `world.islands`.
- **Keine neuen Güter** (`GOOD_IDS` unverändert); Fundstücke sind keine Ware und liegen nie im Lager.
- Kein Sim-Seeweg zu den Gebieten (feste Ticks, R962 F6).
- Kein Ehrenbuch-Eintrag, kein Ziel, keine Steuer-, Zielschwellen- oder Preiswirkung der Fundstücke.
- Keine Controller-Expedition im Balancing; keine Änderung an Zielen 1–3, Preisen, `balance.test.ts`-Pins.
- Kein Neuwürfeln der Kartenfolge, keine Auto-Wahl, keine Zehrung beim Warten.

## 3 Regeln

### 3.1 Kartenhaus

1. Neuer Eintrag in `src/sim/defs/buildings.ts` (Id [Tech], Vorschlag `maphouse`), «Kartenhaus», 2×2, Kosten
   1500 Geld, 30 Holz, 15 Werkzeug, 20 Stein, Unterhalt 20 je 100 T, `site: [{ kind: 'home' }, { kind: 'supply' }]`,
   `maxCount: 1` «Es gibt schon ein Kartenhaus» (A01-01/02, Anhang 02 §2). Kein Ertrag (Geldsenke ohne Geldlohn, R722).
2. **Nicht brennbar** (kein `flammable`): `flammableRect` und die Brandziehung ändern sich durch den Bau nicht.
3. Freischaltung über neuen Unlock-Eintrag `U7` mit Auslöser `wonSpice` (neuer Auslösertyp; `UNLOCK_IDS` wächst um
   `U7`). Vor Ziel 3 ist das Kartenhaus nicht im Baumenü und `canPlace` liefert «Erst nach der Gewürzstadt».
4. Es wirkt, solange es steht, und schaltet nur `startExpedition` frei; Fundstücke wirken unabhängig davon.
5. **Abriss:** In jeder Phase einer Expedition (auch im Wartezustand) gesperrt mit `fail('Erst Expedition beenden')`
   (wie das Fremdkontor). Ohne Expedition erlaubt, Rückerstattung nach Bestand; die Sammlung bleibt.

### 3.2 Seegebiete und Nebel

1. Drei Gebiete in fester Def-Reihenfolge `SEA_AREAS` (Index für den Strom): 0 `wrecks` «Wrackfeld», 1 `skerries`
   «Holzschären», 2 `north` «Nordgebiet», in `src/sim/defs/expedition.ts` [Tech: Dateiname]. Werte je Gebiet: Anhang 02 §3.
2. Je Gebiet: Abschnitte 4/5/7, Kartenstellen `cardsAfter` [2,4] / [2,4,5] / [3,5,7], zwei Hinweis-Waren mit
   Stichwort (A01-07/08), Kartenpool (§3.6).
3. Ein Gebiet ist **im Nebel** oder **aufgedeckt** (`world.seaRevealed`). Aufgedeckt wird es nur bei der Rückkehr einer
   Fahrt, die alle Abschnitte geschafft hat (§3.8); danach dauerhaft offen.
4. Im Nebel zeigt die Seekarte nur Nebel und die zwei Hinweis-Waren, keinen Namen (Name «Unbekanntes Gewässer»,
   Setzung Spec). Nach dem Aufdecken Name und Ausblick-Text (§5.5).
5. Nebel ist **nur Seekarte**, nicht Weltansicht. Die Lage der Felder ist Darstellung, kein Sim-Seeweg.

### 3.3 Aktion `startExpedition`

Signatur [Tech], Vorschlag `startExpedition(world, shipId, area, cargo): Result`; `cargo: Partial<Record<GoodId, number>>`.
Wirft nie. Prüfreihenfolge (Setzung Spec; erster Treffer ist der Grund, Texte wörtlich):

| Nr. | Bedingung                                     | Grund                                      |
| --- | --------------------------------------------- | ------------------------------------------ |
| 1   | alle drei Gebiete aufgedeckt                  | «Alle Gebiete aufgedeckt»                  |
| 2   | kein Kartenhaus steht                         | «Kein Kartenhaus»                          |
| 3   | `world.expedition !== null`                   | «Schon eine Expedition unterwegs»          |
| 4   | `area` keine Gebiets-Id                       | «Unbekanntes Gebiet»                       |
| 5   | Gebiet aufgedeckt                             | «Gebiet schon aufgedeckt»                  |
| 6   | Schiff unbekannt                              | «Unbekanntes Schiff»                       |
| 7   | Schiff nicht verfügbar (§3.4)                 | «Schiff nicht verfügbar»                   |
| 8   | Menge keine ganze Zahl ≥ 0 oder Gut unbekannt | «Ungültige Ladung»                         |
| 9   | Summe > `SHIP.capacity` (50)                  | «Ladung über 50»                           |
| 10  | Menge > Heimatlager, erstes Gut in `GOOD_IDS` | «Ware nicht im Lager: Werkzeug (12, da 4)» |
| 11  | Nahrung an Bord < 3 (A01-03)                  | «Kein Proviant an Bord»                    |

Bei Erfolg in derselben Aktion: Ladung aus dem Heimatlager abziehen (Sperrbestand I-049 gilt wie beim Bauen nicht,
Setzung Spec); die Kartenfolge ziehen (§3.6) und in `expedition.cards` speichern; `world.expedition` anlegen mit Phase
`boarding` oder direkt `leg` (§3.4). Ein abgewiesener Aufruf ändert die Welt nicht (JSON-gleich). Die Packansicht warnt,
wenn der Proviant nicht für alle Abschnitte reicht (§5.2).

### 3.4 Schiff: Verfügbarkeit, Wartezustand, Route

**Code-Fakt:** Ein Routenschiff liegt zwischen zwei Ticks nie im Heimathafen; `handleDocked` entlädt, lädt und legt im
selben Tick wieder ab (`src/sim/ships.ts`). «Das Schiff verlässt seine Route» braucht daher einen Wartezustand
(entschieden R970 E1).

1. **Verfügbar** ist ein Schiff, wenn eines gilt: (a) frei in der Heimat (`port 0`, `to null`, `route null`, nicht
   `homing`); (b) Route mit der Heimat als Ende (`route.a === 0 || route.b === 0`); (c) auf Heimkehr (`homing`).
   Nicht verfügbar: Route zwischen zwei Fremdinseln (Grund Nr. 7).
2. **Fall (a):** Die Fahrt beginnt sofort in der Aktion: 3 Nahrung abziehen, Phase `leg`, Abschnitt 1.
3. **Fall (b), (c): Phase `boarding`** («Wartet auf das Schiff»). Das Schiff fährt weiter wie bisher, bis es im
   Heimathafen anlegt. Dort entlädt es **seine gesamte Ladung** nach der Heimkehr-Regel des Bestands (`unloadAtHome`:
   bis `STORAGE_CAP`, Rest verfällt mit `ShipLoss`-Meldung), lädt nichts und wechselt im selben Tick in Phase `leg`. Die
   Route bleibt am Schiff gespeichert. Ein Fall-(b)-Schiff legt dafür auch an, wenn es nur Gewürz geladen hat (Liste
   `keep` entfällt).
4. **`cancelExpedition(world)`** nur in `boarding` (sonst «Expedition schon ausgelaufen», ohne Expedition «Keine
   Expedition»): Ladung zurück ins Heimatlager (bis `STORAGE_CAP`, Rest verfällt, Meldung im Ergebnis [Tech]),
   `world.expedition = null`. Die Kartenfolge ändert sich nicht (fest je Seed und Gebiet).
5. **Unterwegs** (Phasen `leg`, `card`, `back`): Das Schiff steht im Zustand `port 0`, `to null`; `tickShips` überspringt
   es [Tech: Ort der Ausnahme]. Es erscheint nicht in der Weltansicht und nicht als Routenpunkt der Seekarte
   (`mapDots`), sondern als Expeditionsmarke (§5.5). Schiffsunterhalt läuft weiter (Bestand).
6. Aktionen am Expeditionsschiff (alle Phasen ausser `boarding`): `retireShip`, `setRoute`, `updateRoute` liefern
   «Schiff ist auf Expedition». In `boarding` gilt für `retireShip` derselbe Grund; `setRoute`/`updateRoute` wie Bestand.
   `clearRoute` bleibt in allen Phasen erlaubt (Bestand: `route null`, `homing true`).
7. **Rückkehr:** Hat das Schiff noch eine Route, nimmt es sie ab dem nächsten Tick wieder auf. Ist die Route weg
   (`clearRoute` unterwegs), geht es über die Heimkehr-Regel in die Ruhe (frei in der Heimat).

### 3.5 Ablauf und Ticks

Phasen (Setzung Spec): `boarding` → `leg` (Abschnitt) → `card` (nach den Abschnitten in `cardsAfter`) → … → `back`
(Heimfahrt) → Rückkehr. Es gibt keine eigene Hinfahrt. Tick-Ort: neue Funktion `tickExpedition` direkt **nach**
`tickShips` in `step()` (arc42 Tick-Ablauf und ADR-005-Nachtrag mitführen). Mit `world.expedition === null` liest sie
nichts und zieht keinen Zufall.

| Phase      | Restticks `left`    | je Tick                | Übergang                           |
| ---------- | ------------------- | ---------------------- | ---------------------------------- |
| `boarding` | 0 (unbenutzt)       | nichts                 | Schiff legt an → Abschnitt 1       |
| `leg`      | 300, zählt ab       | `left −= 1`            | `left` 0: `leg += 1`, weiter s. u. |
| `card`     | 0                   | nur `wait += 1` [Tech] | nur `chooseOption` (§3.6)          |
| `back`     | Heimfahrt, zählt ab | `left −= 1`            | Rückkehr (§3.8)                    |

- **Zustand:** `leg` = gefahrene (abgeschlossene) Abschnitte, `cardIndex` = Index der nächsten Karte in `cards`,
  `extra` = Zusatzabschnitte aus Umwegen (Namen [Tech]). Gesamtzahl der Abschnitte = `sections + extra`.
- **Beginn eines Abschnitts** (beim Start, nach `boarding`, nach jeder Wahl): Sind mindestens 3 Nahrung an Bord, werden
  3 abgezogen und der Abschnitt dauert 300 T. Sonst **Umkehr**: Phase `back` mit `min(600, 300 × leg)` T, `done = false`.
- **Karte fällig**, wenn `cardIndex < k` und `leg === cardsAfter[cardIndex] + extra`. Die letzte Karte liegt nach dem
  letzten Abschnitt. Nach ihr beginnt, falls `leg < sections + extra` (Umweg gewählt), der nächste Abschnitt; sonst
  `back` mit 600 T und `done = true`. Genau 0 Nahrung nach dem letzten Abschnitt gilt als geschafft.
- Die Fahrt hält bei offener Karte an, das Spiel läuft weiter (kein Zeitdruck). In der Spielpause zählt nichts.
- Feste Ticks (F6): Rat (Seerecht), HAFEN-Fahrzeiten und Krisen (Brand, Sturm, Boom) wirken nicht auf die Expedition.
- **Dauer ohne Umweg:** `sections × 300 + 600` T = 3,0 / 3,5 / 4,5 min (Anhang 02 §3).

### 3.6 Wahl-Karten: Pool, Ziehung, Wahl

1. Def `EXPEDITION_CARDS` in `src/sim/defs/expedition.ts`: je Karte Id, Gebiet, Titel, Text, genau eine **R-Option**
   (Bedingung, `find: true`) und höchstens eine **S-Option** (Bedingung, kein Fund). Katalog: Anhang 02 §4 (A01-09).
2. Eine **Bedingung** ist eine Liste von höchstens zwei Waren `{ good, n }`; sie wird bei der Wahl von der Ladung an
   Bord abgezogen (Beispiel «15 Holz + 5 Werkzeug»).
3. **Umweg U (Regel, keine Def-Option):** Jede Karte bietet zusätzlich «Umweg», immer wählbar. Er fügt 2 Abschnitte
   direkt nach der Karte ein (`extra += 2`). Damit gibt es nie eine Sackgasse. **Umkehren (E-10):** Bei offener Karte
   ist «Umkehren» eine weitere Wahl: Phase `back` mit `min(600, 300 × leg)` T, `done = false`, keine Fundstücke.
4. **Def-Regeln (Wächter-Test):** jede Karte genau eine R-Option mit Bedingung und `find: true`; S ohne `find`; alle
   Bedingungsgüter ∈ `GOOD_IDS`; Pool je Gebiet ≥ Kartenzahl der Fahrt (4/5/5 gegen 2/3/3); Zahl der Gebietsstücke =
   Kartenzahl der Fahrt.
5. **Ziehung beim Start** (ADR-010-Muster, Setzung Spec): Strom `r = createRng((seed ^ Math.imul(gebietIndex + 1, EXPEDITION_SALT)) >>> 0)`,
   `EXPEDITION_SALT = 0xc2b2ae35`, verschieden von Auftrag, `CRISIS_SALT`, `ISLANDS_SALT`. Kandidaten = Pool des
   Gebiets in Def-Reihenfolge. Für Stelle i = 0 … k−1: `j = floor(r() × Kandidaten.length)`, Karte j nehmen und
   entfernen. Die Folge ist je Seed und Gebiet **fest** (jeder Versuch zeigt dieselben Karten, kein Neuwürfeln durch
   Abbruch oder Umkehr), wird beim Start gezogen und in `expedition.cards` gespeichert. Es gibt keinen Zähler und keinen
   RNG-Zustand im Save.
6. **`chooseOption(world, index)`** (Signatur [Tech]; Index 0 = R, 1 = S, dann Umweg, Umkehren, oder Option-Art, [Tech]).
   Gründe: «Keine Karte offen», «Ungültige Option», bei Mangel «Braucht 5 Werkzeug an Bord (da 2)» (erstes fehlendes Gut
   in Def-Reihenfolge der Bedingung, Gut-Name aus `GOODS`). Bei Erfolg: Bedingung abziehen; bei R `finds += 1`;
   `cardIndex += 1`; bei Umweg `extra += 2`; Karte schliessen; weiter nach §3.5.
7. Die Folge ist vor dem Start dem Spieler verborgen; die UI zeigt nur die offene Karte und «Abschnitt i von n».

### 3.7 Proviant und Umkehr

1. Proviant ist nur Nahrung, 3 je Abschnitt, auch für Umweg-Abschnitte (A01-03); die Heimfahrt braucht keinen.
2. Umkehr ist die Heimfahrt `min(600, 300 × leg)` T (A01-05); sie tritt ein, wenn zu Beginn eines Abschnitts weniger als
   3 Nahrung an Bord sind, oder durch «Umkehren» an einer offenen Karte.
3. Bei Umkehr bleibt das Gebiet im Nebel und es gibt **kein Fundstück** (auch nicht von bereits gewählten R-Optionen);
   keine Ware geht verloren, die Restladung kommt zurück. Das Warten auf eine Wahl verbraucht keinen Proviant.
4. Eine Bedingungsware darf Nahrung sein (S-Option «Fest am Strand», «Eingeschlossenes Schiff»); die Wahl kann so die
   nächste Prüfung kippen (gewollt, Kapazität als Spannung).

### 3.8 Rückkehr

In dem Tick, in dem `back` auf 0 fällt (Reihenfolge, Setzung Spec):

1. Restladung ins Heimatlager in `GOOD_IDS`-Reihenfolge bis `STORAGE_CAP` je Gut; Überschuss verfällt und wird
   gemeldet (wie `unloadAtHome`, `StepReport` [Tech]).
2. Bei `done`: Gebiet an `world.seaRevealed` anhängen; bei `finds = r` die **ersten r Stücke der Gebietsliste**
   (Anhang 02 §5) an `world.finds` anhängen (Wirkung ab dem nächsten Tick). Ohne `done` weder noch.
3. `world.expedition = null`; das Schiff nimmt §3.4 Punkt 7.
4. Chronik/Ereignis-Log (UI aus Zustandsvergleich, §5.6).

### 3.9 Fundstücke

1. Acht Stücke, Def `FINDS` in `src/sim/defs/expedition.ts` (oder `finds.ts` [Tech]): Id, Name, Kurztext mit Zahl,
   Symbol-Kennung, Hebel, Gebietsplatz. Katalog, Wirkung, Rundung, Leseort, Prüfwert: Anhang 02 §5 (A01-10).
2. **Vergabe:** Eine geschaffte Fahrt mit k R-Wahlen bringt die ersten k Stücke der Gebietsliste (F1–F2 Wrackfeld,
   F3–F5 Holzschären, F6–F8 Nordgebiet). Da jedes Gebiet nur einmal aufgedeckt wird, kommt jedes Stück höchstens einmal
   vor; die übrigen Stücke eines Gebiets sind nach dem Aufdecken verloren (Preis des sicheren Wegs).
3. **Hebel:** wirksamer Wert über einen Helfer mit Weltbezug (Muster Rat `activeLever`); die Def bleibt unverändert.
   **Nie** auf Steuer (`TAX_*`), Zielschwellen (`WIN_*`) und Preise (`GOODS.buy/sell`); ohne Stück sind alle Hebel
   neutral, also bitgleich zum Bestand.
4. Das Fundstück ist der **letzte** Faktor (nach Def, Ausbaustufe, Rat, Inselvorteil). Zyklen und Fahrzeit:
   `ceil(z × 90 / 100)`, mindestens 1; Prüfwert Holzfäller Stufe 3: 12 → 11 (A01 §4, E-14). Die Rundung ist festgelegt.
5. **Sichtbar:** Jede Wirkung erscheint an der Stelle, die den Wert schon zeigt, mit Zusatz «(Fundstück «Name»)»; Leseort
   je Stück in Anhang 02 §5. Wirkung ab Übergabe, nicht an Bord. Die Sammlung ist nie verlierbar.
6. **F7 «Eiskiste»** braucht einen Helfer für die Lagergrenze je Gut (Umfang [Tech]); `STORAGE_CAP` bleibt 100. Hält der
   Plan den Aufwand für zu gross, folgt ein Spec-Nachtrag mit Ersatz, kein stiller Tausch.
7. **Satzbonus** (A01-11): Sind alle 8 gefunden, erscheint einmal die Chronik-Meldung «Kartenrand vollständig» und in
   der Fundstück-Liste eine Zeile; keine Zahl, kein Ehrenbuch.

### 3.10 Ende und Grenzen

- Höchstens eine Expedition zugleich (Grund Nr. 3). Nach dem dritten aufgedeckten Gebiet keine mehr (Grund Nr. 1); das
  Kartenhaus bleibt stehen (Karte zeigt «Alle Gebiete aufgedeckt»).
- Wiederholung nach Umkehr: beliebig oft, mit **derselben** Kartenfolge.

### 3.11 Meldungen und Warnungen

1. **Warnung Gewürz (E-06):** Fährt das gewählte Schiff als **einziges** eine Route mit `spice` in `ab` oder `ba`, zeigt
   die Packansicht: «Einziges Gewürzschiff: Lager reicht ≈ m:ss, Fahrt ≈ m:ss. Ohne die Route kann die Gewürzstadt
   Kaufleute verlieren.» Lagerreichweite = Gewürzbestand ÷ Verbrauch [Tech: Quelle], Fahrt = Dauer ohne Umweg (§3.5).
   «Auslaufen» bleibt möglich; keine Sim-Sperre. Fahren andere Schiffe Gewürz, erscheint keine Warnung.
2. **Erinnerung (E-05):** Steht eine Karte 3000 T (`REMIND_TICKS`) offen, kommt einmal je offener Karte eine Meldung
   «Expedition wartet auf deine Wahl». Keine Auto-Wahl.
3. **Vorwarnung Überlauf (E-08):** Erreicht `left` in `back` den Wert 300 (`WARN_BACK_TICKS`; beginnt `back` mit höchstens
   300, beim Eintritt), kommt eine Meldung, wenn für mindestens ein Gut Restladung + Heimatlager über `STORAGE_CAP` liegen.

### 3.12 Werteliste

Alle Zahlen und Tabellen stehen in Anhang 02 §1 (Nr. → Wert → Def-Ort); hier die Kurzwerte, Ort `src/sim/defs/`.

- A01-01/02 `buildings.ts`: Kartenhaus 1500 Geld, 30 Holz, 15 Werkzeug, 20 Stein, 2×2, Unterhalt 20 je 100 T.
- A01-03 bis A01-08 `expedition.ts`: `PROVISION` Nahrung 3 je Abschnitt · `SECTION_TICKS` 300 · `HOME_TICKS` 600 ·
  `DETOUR_SECTIONS` 2 · `SEA_AREAS` Abschnitte 4/5/7, `cardsAfter` [2,4] / [2,4,5] / [3,5,7], Hinweis-Waren, Stichworte.
- A01-09 bis A01-11 `expedition.ts`: `EXPEDITION_CARDS` (4/5/5 Karten) · `FINDS` (8, Gebietslisten 2/3/3) · Satzbonus ohne Zahl.
- A01-12 nur Anhang 02 §7 (AK-NU1-30). Ohne Nummer: `REMIND_TICKS` 3000, `WARN_BACK_TICKS` 300, `EXPEDITION_SALT`
  (`expedition.ts`); Unlock `U7` Auslöser `wonSpice` (`unlocks.ts`).

`SHIP.capacity` (50), `STORAGE_CAP` (100) und die Basiswerte der Fundstücke sind Bestand und unverändert. Auswirkung
auf den Balancing-Test: keine (Controller erreicht Ziel 3 nie; alle Hebel sind ohne Fund neutral).

## 4 Zustand und Save

Neue Weltfelder (Namen [Tech], Form Setzung Spec):

```ts
type SeaAreaId = 'wrecks' | 'skerries' | 'north';
type ExpeditionPhase = 'boarding' | 'leg' | 'card' | 'back';
interface Expedition {
  ship: number; // Schiff-id
  area: SeaAreaId;
  phase: ExpeditionPhase;
  leg: number; // gefahrene Abschnitte (0 …)
  cardIndex: number; // nächste Karte, 0 … k
  extra: number; // Zusatzabschnitte aus Umwegen, gerade
  left: number; // Restticks der Phase (0 in boarding/card)
  wait: number; // Ticks seit Karte offen (nur card)
  cargo: Partial<Record<GoodId, number>>; // nur Einträge ≥ 1, Summe ≤ SHIP.capacity
  cards: CardId[]; // gezogene Folge, Länge k
  finds: number; // R-Wahlen dieser Fahrt
  done: boolean; // alle Abschnitte geschafft (nur in back aussagekräftig)
}
// World:
expedition: Expedition | null;
seaRevealed: SeaAreaId[]; // Aufdeck-Reihenfolge, ohne Doppelte
finds: FindId[]; // Sammlung in Fund-Reihenfolge, ohne Doppelte
```

- Kartenhaus ist ein normales Gebäude in `world.buildings`. `world.unlocked` wächst um `U7`.
- **Version:** `SAVE_VERSION` = main + 1 zum Merge-Zeitpunkt (R909, keine feste Nummer in der Spec).
- **Migration** (R970 E2): Ein Stand der Vorversion lädt mit `expedition null`, leerem `seaRevealed` und `finds`; `U7`
  folgt `wonSpice`. **Abgewiesen** (Hinweis, nie ein Absturz) werden nur `SAVE_VERSION + 1` und beschädigte Felder
  («Beschädigter Spielstand»). Je ein Test (AK-NU1-23, 24).
- **Ladeprüfung** (kein Wurf), Einzelheiten [Tech]:
  - `wonSpice false` ⇒ `expedition null`, `seaRevealed` leer, `finds` leer, kein Kartenhaus.
  - Höchstens ein Kartenhaus, Insel 0. `seaRevealed`, `finds`: gültige Ids, ohne Doppelte; `finds` ist Präfix der
    Gebietslisten der aufgedeckten Gebiete.
  - Expedition: Schiff existiert; Gebiet gültig und nicht aufgedeckt; `cards` Länge k, Ids aus dem Pool, ohne Doppelte;
    `cardIndex` in 0 … k; `extra` gerade und ≤ 2 × `cardIndex`; in `card` gilt `cardIndex < k` und
    `leg = cardsAfter[cardIndex] + extra`; `left` in 1 … 300 (`leg`), 1 … 600 (`back`), 0 sonst; `wait` nur in `card`;
    `finds` in 0 … `cardIndex`; Ladung ganzzahlig ≥ 1 je Eintrag, Summe ≤ Kapazität; ausser in `boarding` gilt am
    Schiff `port 0`, `to null`, `cargo` leer; in `boarding` hat das Schiff eine Route mit Heimat-Ende oder `homing`.
- **Determinismus:** Speichern und Laden in jeder Phase (auch bei offener Karte) und Weiterlaufen ergibt dieselbe Welt
  wie ohne Unterbrechung.
- **Doku-Folgen:** ADR-010-Nachtrag «Expeditions-Karten: eigener Salt, Schlüssel seed × Gebiet, gezogene Folge als
  Ergebnis im Save, kein Zähler, kein RNG-Zustand»; arc42 Tick-Ablauf und Persistenz; README (Kartenhaus, Expedition);
  `docs/spielwerte.md` Abschnitt Expedition.

## 5 Bedienung (desktop-first ab 1280 px)

### 5.1 Kartenhaus-Karte (Gebäudekarte)

Zeigt: Gebiete «aufgedeckt k / 3», Fundstücke «k / 8», Zustand («Keine Expedition» · «Wartet auf Schiff 3» · «Abschnitt
3 von 5 · noch 0:42» · «Karte wartet» · «Heimfahrt · noch 0:30»), Knopf «Expedition ausrüsten» (öffnet §5.2; gesperrt
mit Sim-Grund aus §3.3 Nr. 1–3), im Wartezustand «Abbrechen». Zeitformat `formatGameTime` (R835). Der Abriss-Knopf zeigt
während einer Expedition «Erst Expedition beenden».

### 5.2 Packansicht

- **Gebiet:** drei Felder; Nebelgebiet mit zwei Hinweis-Waren und Stichwort («Eis: Werkzeug · Kälte: Stoff»), aufgedeckte
  grau mit Namen und «aufgedeckt»; je Gebiet «n Abschnitte · Dauer ≈ m:ss» (Summe der festen Ticks ohne Wartezeit).
- **Schiff:** Liste aller Schiffe mit Zustand: «frei», «Route Heimat ⇄ Möweninsel (läuft nach Ankunft aus)», «Route ohne
  Heimat» (gesperrt, Grund Nr. 7). Bei einzigem Gewürzschiff die Warnung §3.11.
- **Ladung:** je Gut im Heimatlager Zeile mit Bestand, Feld/Knöpfe −/+ (Schritt 1, mit Umschalt 5 [Tech]),
  Hinweis-Waren hervorgehoben; **Kapazitätsbalken** «n / 50» (Wert aus `SHIP.capacity`), voll in Warnfarbe.
- **Proviantzeile:** «Proviant reicht für s von k Abschnitten» (k = Abschnitte des Gebiets); bei s < k Warnfarbe und
  «Das Schiff kehrt vorher um»; unter 3 Nahrung zusätzlich der Grund Nr. 11.
- **Auslaufen:** Knopf gesperrt mit dem Grund aus einer reinen Vorprüfung, die dieselben Regeln wie `startExpedition`
  nutzt [Tech: gemeinsame Prüffunktion]. Kein stilles Scheitern.

### 5.3 Kartendialog

- Öffnet bei `phase card` automatisch nicht modal [Tech], über HUD-Chip «Expedition: Karte wartet» jederzeit erneut;
  `Esc` schliesst ohne Wahl (Karte bleibt offen).
- Zeigt Titel, Text, «Abschnitt i von n», aktuelle Ladung an Bord und Proviant.
- Je Option ein Knopf mit Bedingung («−12 Werkzeug») und ggf. Fundstück-Symbol mit Name (R), S, «Umweg (+2
  Abschnitte, 6 Nahrung)» und «Umkehren». **Gesperrte Option** grau mit Grund aus `chooseOption` («Braucht 5 Werkzeug an
  Bord (da 2)»). Sim-Grund und Anzeige sind derselbe Text.

### 5.4 Fundstück-Liste

In der Seekarte (Popover «Inseln») ein Abschnitt «Fundstücke k / 8»: 8 Plätze in Def-Reihenfolge; gefunden: Symbol, Name,
Wirkungstext mit Zahl; nicht gefunden: «?» ohne Namen. Bei vollständiger Sammlung die Zeile «Kartenrand vollständig».

### 5.5 Seekarte mit Nebel

- Drei Nebelfelder am Rand des Archipels (Lage [Tech]/Art; ausserhalb des Insel-Rechtecks, Layout reserviert einen
  Randstreifen). Tooltip: Hinweis-Waren bzw. Name und Ausblick.
- Ausblick-Texte nach Aufdecken (Setzung Spec): Nordgebiet «Nordküste · vereist, noch keine Landung möglich»; Holzschären
  «Holzschären · bewaldete Schären, noch keine Landung möglich»; Wrackfeld «Wrackfeld · kein Land, nur Wracks».
- Expeditionsmarke: in `back` auf der Linie Heimat ⇄ Nebelfeld (Anteil aus `left`), in `leg`/`card` am Feld; `boarding`
  ohne Marke (Schiff fährt noch seine Route).
- `seaMapKey` enthält Nebelzustand, Expeditionsphase und Marke, damit die Karte neu zeichnet.

### 5.6 Chronik und HUD

Ereignis-Log-Einträge (UI-Zustandsvergleich, Texte Setzung Spec): «Expedition ins Wrackfeld ausgelaufen» · «Expedition:
Karte wartet» · «Proviant aus: Expedition kehrt um» · «Expedition kehrt um» (freiwillig) · «Expedition zurück» · je
übergebenem Stück «Fundstück: Name» · «Wrackfeld aufgedeckt» · «Kartenrand vollständig». Inselchronik-Zeile «Seegebiete
k/3 · Fundstücke k/8» erst nach `wonSpice`. HUD-Chip nur in Phase `card`.

## 6 Randfälle

| Fall                             | Erwartetes Verhalten                                              |
| -------------------------------- | ----------------------------------------------------------------- |
| Heimatlager leer                 | Grund Nr. 10 bzw. Nr. 11; Welt unverändert                        |
| Nahrung 2 an Bord                | Grund Nr. 11 «Kein Proviant an Bord»                              |
| Nahrung 10 im Wrackfeld          | Umkehr am Beginn von Abschnitt 4; 600 T, kein Fund                |
| Ware fehlt im Lager              | Grund Nr. 10 mit Gut und Mengen, Welt unverändert                 |
| Ladung genau 50 / 51             | 50 erlaubt, 51 «Ladung über 50»                                   |
| Route-Schiff                     | `boarding`; Routenladung bei Ankunft nach Heimkehr-Regel entladen |
| Route zwischen Fremdinseln       | Grund Nr. 7                                                       |
| Abbruch im Wartezustand          | Ladung zurück; nach Auslaufen kein Abbruch                        |
| Route unterwegs aufgelöst        | danach frei in der Heimat                                         |
| Kontor der Gegeninsel abreissen  | Bestand «Erst Route auflösen»                                     |
| Schiff verkaufen unterwegs       | «Schiff ist auf Expedition»                                       |
| Kartenhaus abreissen             | in jeder Phase «Erst Expedition beenden»                          |
| Speichern bei offener Karte      | Karte wieder offen, gleiche Sperren, `wait` bleibt                |
| Karte nie gewählt                | wartet unbegrenzt; einmal Erinnerung nach 3000 T                  |
| Umweg an der letzten Karte       | 2 Abschnitte, dann `back` 600 T; ohne Nahrung Umkehr, kein Fund   |
| Umkehren bei offener Karte       | `back` 600 T, kein Fund, Gebiet Nebel                             |
| Heimatlager voll bei Rückkehr    | bis `STORAGE_CAP`, Rest verfällt, Meldung                         |
| Einziges Gewürzschiff            | Warnung mit Zahlen; Auslaufen möglich                             |
| Sturm, Brand, Boom               | keine Wirkung                                                     |
| Seerecht beschlossen             | `left` unverändert                                                |
| Drittes Gebiet aufgedeckt        | Grund Nr. 1; Kartenhaus bleibt                                    |
| Stand ohne Ziel 3 mit Expedition | abgewiesen                                                        |
| Alter Spielstand                 | migriert: `expedition null`, leere Listen, `U7` nach `wonSpice`   |
| `SAVE_VERSION + 1`               | abgewiesen mit Hinweis                                            |
| Spielpause                       | nichts zählt; Wahl erlaubt                                        |

## 7 Abnahmekriterien

(V) = Vitest, (B) = Browser-Check bei 1280 px durch `qa-playtester`, Screenshots `.studio/qa/NU-1/`. Testwelten mit
gesetztem `wonSpice` und Kartenhaus über Test-Helfer [Tech]. AK-25a/b, 37–56: Anhang 02 §8.

**Kartenhaus** (`tests/sim/expedition.test.ts`):

1. **AK-NU1-01 (V)** Vor `wonSpice` liefert `canPlace` für das Kartenhaus «Erst nach der Gewürzstadt»; `U7` fehlt in
   `world.unlocked`; danach `ok` auf der Heimat, auf einer Fremdinsel «Nur auf der Heimatinsel»; ein zweites «Es gibt
   schon ein Kartenhaus». Kosten und Unterhalt gleich A01-01/02 aus der Def.
2. **AK-NU1-02 (V)** Bau des Kartenhauses ändert `flammableRect` nicht (gleiches Rechteck vorher/nachher).

**Start** (`tests/sim/expedition.test.ts`):

3. **AK-NU1-03 (V)** Jede Zeile der Tabelle §3.3 (Nr. 1–11) hat einen Fall mit genau dem Grundtext; nach jedem
   abgewiesenen Aufruf ist die Welt JSON-gleich; kein Aufruf wirft (auch `null`, negative, gebrochene Mengen, fremde
   Gut-Ids).
4. **AK-NU1-04 (V)** Erfolg mit freiem Schiff: Heimatlager um die Ladung kleiner, Phase `leg`, `left` 300, 3 Nahrung
   verbraucht, `cards` Länge k (2/3/3) ohne Doppelte, alle aus dem Pool des Gebiets.
5. **AK-NU1-05 (V)** Routenschiff Heimat ⇄ Insel: Phase `boarding`; beim nächsten Anlegen in der Heimat wird die gesamte
   Routenladung entladen (bis Lagergrenze), Phase `leg` im selben Tick, Route am Schiff unverändert. Homing-Schiff
   ebenso. Route zwischen zwei Fremdinseln: Grund Nr. 7.
6. **AK-NU1-06 (V)** `cancelExpedition` in `boarding` gibt die Ladung zurück und setzt `expedition null`; ein neuer Start
   zieht dieselbe Folge; in `leg` liefert es «Expedition schon ausgelaufen», ohne Expedition «Keine Expedition».

**Ablauf** (`tests/sim/expedition.test.ts`):

7. **AK-NU1-07 (V)** Volle Fahrt Wrackfeld: Karte nach 2 × 300 Ticks, `card` zählt `left` nicht ab, nächste Karte nach
   weiteren 600 Ticks, Heimfahrt 600, Rückkehr nach 1800 Ticks Spielzeit; Gebiet in `seaRevealed`, Restladung im Lager,
   Fundstücke in `world.finds`, `expedition null`; Routenschiff fährt im Folgetick wieder seine Route. Holzschären und
   Nordgebiet entsprechend (2100 / 2700 Ticks, Kartenstellen aus `cardsAfter`).
8. **AK-NU1-08 (V, Wächter `tests/sim/expedition-defs.test.ts`)** Def-Regeln §3.6 Punkt 4 (genau eine R-Option mit
   `find: true`, S ohne `find`, Bedingungen ≤ 2 Waren, Güter ∈ `GOOD_IDS`, Pool ≥ Kartenzahl), 3 Gebiete in Reihenfolge
   `wrecks`, `skerries`, `north` mit je 2 Hinweis-Waren, 8 Fundstücke in den Gebietslisten 2/3/3.
9. **AK-NU1-09 (V)** `chooseOption`: eine Option mit zu wenig Ware liefert «Braucht n Gut an Bord (da m)» (erstes
   fehlendes Gut) und ändert nichts; eine erlaubte verbraucht genau die Bedingung (auch zwei Waren); «Keine Karte offen»
   ausserhalb `card`; «Ungültige Option» für Index ausserhalb.
10. **AK-NU1-10 (V)** Umkehr: Ladung mit 10 Nahrung im Wrackfeld, R-Wahl an Karte 1 → am Beginn des vierten Abschnitts
    Umkehr, Heimfahrt `min(600, 300 × 3)` = 600 T, `done false`, Gebiet nach Rückkehr nicht in `seaRevealed`,
    **`world.finds` unverändert leer**, Restladung im Lager. Mit 3 Nahrung: Umkehr am Beginn von Abschnitt 2, Heimfahrt 300 T.
11. **AK-NU1-11 (V)** Ladung mit 2 Nahrung: `startExpedition` liefert Grund Nr. 11, Welt JSON-gleich; mit 3 Nahrung ok.
12. **AK-NU1-12 (V)** Höchstens eine Expedition; nach drittem aufgedeckten Gebiet «Alle Gebiete aufgedeckt», auch mit
    neuem Kartenhaus.
13. **AK-NU1-13 (V)** Abriss des Kartenhauses in `boarding`, `leg`, `card` und `back`: je «Erst Expedition beenden», Welt unverändert; ohne Expedition erlaubt, danach Start «Kein Kartenhaus».
14. **AK-NU1-14 (V)** Am Expeditionsschiff liefern `retireShip`, `setRoute`, `updateRoute` «Schiff ist auf
    Expedition»; `clearRoute` unterwegs → nach Rückkehr frei in der Heimat (`route null`, nicht `homing`).
15. **AK-NU1-15 (V)** Brand, Sturm und Boom während der Fahrt (erzwungene Krise): `world.expedition` tickweise gleich
    einem Lauf ohne Krise; Seerecht-Beschluss ändert `left` nicht.
16. **AK-NU1-16 (V)** Rückkehr mit vollem Heimatlager: entladen bis `STORAGE_CAP`, Überschuss gemeldet (Bestand).

**Ziehung und Vergabe** (`tests/sim/expedition-cards.test.ts`):

17. **AK-NU1-17 (V)** Gleicher Seed und Gebiet ⇒ gleiche Folge, auch beim zweiten Versuch nach Abbruch oder Umkehr; anderes
    Gebiet bzw. anderer Seed ⇒ eigene Folge; die Ziehung ändert keine Auftrags-, Krisen- oder Inselziehung (Vergleich
    `orderForPeriod`, `rollCrisis`, Inselerzeugung mit und ohne Expedition). Prüffolgen Seeds 1–3 gepinnt.
18. **AK-NU1-18 (V)** Vergabe: Eine geschaffte Fahrt mit k R-Wahlen (k = 0 … Kartenzahl) bringt genau die ersten k Stücke
    der Gebietsliste in Listenreihenfolge in `world.finds`; mit 0 R-Wahlen keins; Gebiet aufgedeckt.

**Fundstücke** (`tests/sim/finds.test.ts`):

19. **AK-NU1-19 (V)** Je Fundstück ein Test: wirksamer Wert ohne Stück = Def, mit Stück = Prüfwert aus Anhang 02 §5 (u. a.
    Holzfäller Stufe 3: 12 → 11, Seeweg 30: 300 → 270); Def-Objekt unverändert; Wirkung erst ab Rückkehr, nicht an Bord.
20. **AK-NU1-20 (V, Wächter)** Kein Hebel zielt auf Steuer, `WIN_*`, `GOODS.buy/sell`; mit leerem `world.finds` liefern
    alle Helfer die heutigen Werte (gleiche Ergebnisse für bestehende Testwelten).
21. **AK-NU1-21 (V)** Kein Stück zweimal in `world.finds` über beliebige Wiederholungsfahrten (Lauf mit 10
    Umkehr-Fahrten und allen drei Gebieten); bei 8 Stücken genau eine Meldung «Kartenrand vollständig».

**Save** (`tests/sim/expedition-save.test.ts`):

22. **AK-NU1-22 (V)** Round-Trip in jeder Phase (`boarding`, `leg`, `card`, `back`, auch mit `extra` > 0): tief gleich;
    danach N Ticks und Wahlen ergeben denselben Welt-Hash wie ohne Speichern.
23. **AK-NU1-23 (V)** `SAVE_VERSION` gegenüber dem Stand vor NU-1 erhöht (relativ, ohne Literal). Ein Fixture mit
    `SAVE_VERSION − 1` lädt mit `expedition null`, `seaRevealed` und `finds` leer, `U7` nach `wonSpice`; ein Fixture mit
    `SAVE_VERSION + 1` wird mit nicht leerem Hinweis abgewiesen, kein Wurf.
24. **AK-NU1-24 (V)** Manipulierte Stände nach §4 Ladeprüfung (je Regel ein Fall, u. a. Expedition ohne `wonSpice`,
    doppelte Karte, `card` mit falschem `leg`, ungerades `extra`, Fundstück doppelt, zwei Kartenhäuser) werden
    abgewiesen mit «Beschädigter Spielstand», kein Wurf.

**Baseline**:

25. **AK-NU1-25 (V)** `tests/sim/balance.test.ts`, alle `balance-*.test.ts`, `seePins.ts`, `e0Pins.ts`, `e1Pins.ts`,
    `seaGolden.test.ts` ohne Änderung an Erwartungen grün und bitgleich (Pins auf die Länge von `UNLOCK_IDS`, falls
    vorhanden, folgen `U7` [Tech]); der Controller ruft keine Expeditions-Aktion (Quelltext-Prüfung `tests/sim/controller.ts`).
26. **AK-NU1-26 (V)** Mit `expedition null` ändert `tickExpedition` nichts (Welt JSON-gleich vor/nach dem Aufruf).

**UI-Helfer** (`tests/ui/expeditionView.test.ts`, `tests/ui/seaMapView.test.ts`):

27. **AK-NU1-27 (V)** Packmodell: Kapazität «n / 50», Proviantzeile «reicht für s von k», Gewürz-Warnung §3.11 genau beim
    einzigen Gewürzschiff (Zahlen m:ss), Auslaufen-Grund = Sim-Grund; Schiffsliste mit Zuständen §5.2.
28. **AK-NU1-28 (V)** Kartenmodell: gesperrte Option trägt den Sim-Grund wörtlich; Ereignis-Einträge §5.6 aus
    Zustandsvergleich (je Übergang genau ein Eintrag, gleicher Stand ergibt []).
29. **AK-NU1-29 (V)** Seekarte: Nebel ohne Namen mit Hinweis-Waren; aufgedeckt mit Ausblick-Text §5.5 wörtlich;
    `seaMapKey` ändert sich bei Phase und Aufdecken; `mapDots` enthält das Expeditionsschiff nicht; Marke in `back` auf
    der Linie, in `leg`/`card` am Feld.

**Werte und Browser**:

30. **AK-NU1-30 (V, Wächter über die Defs)** Je Gebiet: Dauer ohne Umweg = 3,0 / 3,5 / 4,5 min (alle in 3–5 min); der
    Bedarf für alle R-Optionen des Pools plus vollen Proviant ist > 50 (57 / 63 / 61, Obergrenzen); der sichere Weg ist ≤ 50 (32 / 36 /
    43); jede mögliche Ziehung lässt alle R zugleich mit vollem Proviant in 50 Plätzen zu (höchstens 48 / 49 / 49, Anhang 02 §7).
31. **AK-NU1-31 (B)** Ablauf: Kartenhaus bauen, Packansicht (Balken, Hinweis-Waren, Warnung beim einzigen Gewürzschiff),
    Auslaufen, Kartendialog mit gesperrter Option und Grund, Wahl, Rückkehr; Seekarte zeigt Nebel, Marke, danach
    «Wrackfeld · kein Land, nur Wracks»; Fundstück-Liste und sichtbare Wirkung an der Leseort-Stelle.
32. **AK-NU1-32 (B)** Bei 1280 px keine Abschnitte abgeschnitten, kein horizontales Scrollen; bei 800 px kein Absturz,
    keine Konsolenfehler; Expeditionsschiff nicht in der Weltansicht.
33. **AK-NU1-33 (Review)** Doku: README, `docs/spielwerte.md`, arc42 (Tick-Ablauf, Persistenz), ADR-010-Nachtrag;
    `make docs-check` Exit 0.

**Wahl und Meldungen** (`tests/sim/expedition.test.ts`):

34. **AK-NU1-34 (V)** Umweg: Nach der Wahl an Karte 1 (Wrackfeld) kommen 2 Abschnitte (`extra` 2, 6 Nahrung), Karte 2
    erscheint nach `4 + 2` Abschnitten; Umweg an der letzten Karte endet nach 2 Abschnitten in `back` mit `done true`.
35. **AK-NU1-35 (V)** «Umkehren» bei offener Karte: `back` mit 600 T, `done false`, `world.finds` leer, Gebiet Nebel, Ware
    zurück; ohne offene Karte «Keine Karte offen».
36. **AK-NU1-36 (V)** Meldungen: Erinnerung genau einmal nach 3000 Ticks offener Karte; Vorwarnung bei `left` 300 in `back`
    nur, wenn Restladung + Heimatlager für ein Gut über `STORAGE_CAP` liegen; Gewürz-Warnung nur bei einzigem
    Gewürzschiff (kein Treffer, wenn ein zweites Schiff Gewürz fährt).

## 8 Schnitte für den Plan (Vorschlag)

| Schnitt | Inhalt                                                          | AK               |
| ------- | --------------------------------------------------------------- | ---------------- |
| NU1-SIM | Defs, Kartenhaus, U7, Aktionen, Tick, Ziehung, Fundstücke, Save | 01–26, 30, 34–36 |
| NU1-UI  | Kartenhaus-Karte, Packansicht, Kartendialog, Chronik, Seekarte  | 27–29, 31–33     |
| NU1-ART | Sprite, Nebel, Silhouetten, 8 Symbole, Marke                    | 31, 32 (Optik)   |

SIM vor UI; ART parallel. Teilung SIM-a (Defs, Aktionen, Tick, Ziehung) / SIM-b (Fundstücke, Save) [Tech].

## 9 Art-Bedarf (Notiz für `lead-art`)

- Kartenhaus-Sprite 2×2 (Kartenrollen/Globus-Motiv eigen), mit Varianz nach GEBAEUDE-VARIANZ.
- Seekarte: Nebelfeld, drei Gebiets-Silhouetten (vereiste Küste, bewaldete Schären, Wrackmasten), Expeditionsmarke.
- 8 Fundstück-Symbole (klein, 16–24 px, prozedural oder Glyphe), «?»-Platz.
- Keine fremden Assets geplant; Nachweis nach ADR-011, falls doch.

## 10 Entscheide

**Entschieden R970:** E1 Wartezustand `boarding` samt Abbruch nur davor: ja · E2 alter Stand: **Migration** statt Abweisen
· E3 Namen (Kartenhaus, Gebiete, Fundstücke, «Unbekanntes Gewässer»): ja · E4 Routenladung beim Anlegen nach
Heimkehr-Regel: ja · E5 Gebiet erst bei der Rückkehr aufdecken: ja.

**Entscheid L0 offen:** keiner. Stichworte und Meldungstexte: Setzung Spec.
