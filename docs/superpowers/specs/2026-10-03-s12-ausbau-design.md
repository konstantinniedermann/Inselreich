# S12 „Ausbau" — Designvorschlag

Datum: 2026-10-03 · Paket S12-D · Meilenstein M11 „Wirtschaft im Fluss" · Status: **Vorschlag** (Prozessstufe voll:
neues System, Save-Folge). Das Dokument ist **keine Spec**: Es hat keine Abnahmekriterien; die Spec folgt nach dem
Gate Brainstorming. Grundlage: Ruling R170 (3) und (4), Nutzerwortlaut 2026-10-03 („Gebäude sollen upgradebar werden
(freischalten ab Bevölkerungsstufe), ansonsten braucht es 20 Fischer, um nur ein paar Häuser der höheren Stufe zu
unterhalten"), M10-Spec (Freischaltmodell `world.unlocked`, `defs/unlocks.ts`, Delta §24), Rechnung
`design-economy-designer` (Abschnitt 2, markiert **[Werte]**). Annahmen sind mit **(A)** markiert.

## 1. Spielerzweck und Zeitbild

**Spielerzweck in einem Satz:** „Wenn meine Leute mehr brauchen, baue ich meine Betriebe aus, statt die Küste mit
Hütten zuzupflastern, und zahle den Ausbau mit den Gütern, die die höhere Stufe herstellt."

- **Fühlen:** Die Siedlung reift. Der Fischer, der mit den ersten Pionieren gebaut wurde, bekommt ein zweites Netz und
  später ein Boot mit Mannschaft. Mit jeder Bevölkerungsstufe öffnet sich ein neuer Ausbauschritt (Meldung).
- **Entscheiden:** Neubau oder Ausbau? Wo der Platz knapp ist (Küste, Weide, Versorgungsradius), gewinnt der Ausbau;
  wo er frei ist, entscheiden Unterhalt, Brandrisiko und Gebührenware. Und: **welche** Kette baue ich zuerst aus?
- **Zeitbild:** Ausbau Stufe 2 ab den ersten Siedlern (Referenzlauf Tick 350, Minute 1), Stufe 3 ab den ersten Bürgern
  (Tick 3850). Ein erster Ausbau passt in die ersten 15 Minuten: Er amortisiert sich in 1200 bis 1900 Ticks (2 bis 3 min).

**Säulen:** stärkt Produktionsketten und Bevölkerung versorgen/aufsteigen; berührt Wirtschaft (Unterhalt, Gebührenware
als neue Güter-Senke). Es leidet die Säule „Insel besiedeln" nicht: Es braucht weniger Fläche je Bürger.

## 2. Problem, quantifiziert [Werte]

Bedarf je 100 Ticks aus `consume` (Einwohner × Rate), Ausstoss je 100 Ticks = 100 / `cycle`. Die Nahrungsrate 0,5 gilt
für alle Stufen, also sind es 0,2 Fischer je Einwohner (Fischer 2,5 Nahrung je 100 Ticks).

| Stufe     | EW je Haus | Häuser, die 20 Fischer tragen |
| --------- | ---------- | ----------------------------- |
| Pioniere  | 4          | 25                            |
| Siedler   | 8          | 12,5                          |
| Bürger    | 15         | 6,7                           |
| Kaufleute | 20         | 5                             |

**Beleg „20 Fischer":** 100 Einwohner brauchen 20 Fischer; ab ca. 7 Bürgerhäusern ist die Zahl erreicht. Das Siegziel
(50 Bürger, 3,3 Häuser) braucht 10 Fischer, 60 Kaufleute brauchen 12. Dazu kommen je Bürger-Siegziel 5 Weberei, 5
Schäferei, 5 Brennerei, 5 Plantage (30 Betriebe) und bei 60 Kaufleuten 43 Betriebe samt Glaskette. Das Problem ist
**Fläche und Versorgung, nicht Geld:** 120 Kacheln Weide für 3 Häuser, 63 Küstenplätze im Radius 16 um das Kontor (Seed
3), Kontor und Markt versorgen nur Radius 8. Steuer minus Kettenunterhalt je EW bleibt positiv (Basis: Pioniere +1,0,
Siedler +3,5, Bürger +7,5, Kaufleute +11,5 je 100 Ticks).

## 3. Konzept

### 3.1 Welche Gebäude, wie viele Stufen

- **Alle Gebäude mit `produces`** (heute: Fischerhütte, Holzfäller, Steinbruch, Schäferei, Weberei, Zuckerrohr,
  Brennerei, Werkzeugmacher, Glashütte). Wohnhäuser steigen weiter über die Bevölkerungsstufe auf; öffentliche
  Gebäude und Marktplatz bleiben unverändert (kein Ausstoss, Nicht-Scope).
- **3 Stufen** (Basis, 2, 3), passend zu den drei Bevölkerungsstufen vor den Kaufleuten. Kaufleute (Stufe 4) schalten
  keinen weiteren Ausbau frei.
- **Neues System allgemein:** `levels` am `BuildingDef` (ein Eintrag je Stufe). Jedes künftige Betriebsgebäude (S2:
  weitere Nahrungsquellen) bekommt Ausbau mit einem Eintrag, ohne Code.

### 3.2 Was ändert sich je Stufe

Nur **Ausstoss** (kürzerer `cycle`), **Unterhalt** und **Kosten**. Keine Fläche, kein Radius, keine Arbeiter (das Spiel
kennt keine Arbeitskräfte). Eingangsgüter von Verarbeitern skalieren mit dem Ausstoss (Weberei Stufe 2 zieht 1 Wolle je
kürzerem Zyklus, also 1,67-fach): Der Ausbau einer Kette braucht gleiche Stufe auf beiden Seiten, sonst zeigt der
Verarbeiter `waitingInput`. Das ist gewollt: eine Rückkopplung („Kette gemeinsam ausbauen").

**Gewählte Variante C [Werte]** (A und B verworfen: Ausbau kostete 1,5- bis 3-fach den Neubau, der Ausbau hätte nie
gelohnt). Zyklus explizit (ganzzahlig), Unterhalt ganzzahlig gerundet **(A: Rundung durch lead-design)**, Geldkosten
50 % (Stufe 2) bzw. 75 % (Stufe 3) der Baukosten, Güterkosten aufgerundet. Gebühr = Güter der höheren Stufe: Stufe 2
**Stoff**, Stufe 3 **Rum** („Rum für die Mannschaft").

| Gebäude (Basis: Zyklus / Unterhalt) | Stufe 2: Zyklus, Unterhalt, Kosten (Geld, Holz, Werkzeug, Stein) + Gebühr | Stufe 3: Zyklus, Unterhalt, Kosten + Gebühr |
| ----------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------- |
| Fischerhütte (40 / 5)               | 24, 7, {50, 3, 1, 0} + 2 Stoff                                            | 16, 9, {75, 4, 2, 0} + 2 Rum                |
| Holzfäller (30 / 5)                 | 18, 7, {25, 0, 1, 0} + 2 Stoff                                            | 12, 9, {38, 0, 1, 0} + 2 Rum                |
| Steinbruch (60 / 10)                | 36, 13, {75, 5, 2, 0} + 2 Stoff                                           | 24, 17, {113, 8, 3, 0} + 2 Rum              |
| Schäferei, Plantage (50 / 10)       | 30, 13, {75, 5, 1, 0} + 3 Stoff                                           | 20, 17, {113, 8, 2, 0} + 3 Rum              |
| Weberei (50 / 15)                   | 30, 20, {100, 8, 2, 0} + 3 Stoff                                          | 20, 26, {150, 12, 3, 0} + 3 Rum             |
| Werkzeugmacher (80 / 25)            | 48, 33, {100, 8, 2, 0} + 3 Stoff                                          | 32, 43, {150, 12, 3, 0} + 3 Rum             |
| Brennerei (50 / 20)                 | 30, 26, {125, 8, 2, 3} + 3 Stoff                                          | 20, 34, {188, 12, 3, 4} + 3 Rum             |
| Glashütte (50 / 25)                 | 30, 33, {150, 10, 3, 5} + 3 Stoff                                         | 20, 43, {225, 15, 5, 8} + 3 Rum             |

Ausstoss Stufe 2 ×1,67, Stufe 3 ×2,5; Unterhalt ×1,3 bzw. ×1,7. Die Stufen werden **nacheinander** bezahlt (Stufe 3
setzt Stufe 2 voraus). Der Holzfäller ist mit Absicht teurer als sein Neubau (R 1,5 bis 2,1): Er hat Platz, der
Ausbau soll dort nicht lohnen. Wirkung: Fischer fürs Siegziel 10 → 6 (Stufe 2) bzw. 4 (Stufe 3); für 60 Kaufleute
12 → 8 bzw. 5; für 100 EW 20 → 8 (Stufe 3). Bilanz je EW steigt (Bürger +7,5 → +9,6 bei Stufe 3), bleibt positiv.

**Echte Wahl (Prüffrage 2):** Ausbau kostet je Mehrleistung etwa so viel wie ein Neubau (R 0,9 bis 1,4), spart aber
~45 % Unterhalt je Mehrleistung, braucht weder Platz noch Weg. Der Neubau dagegen verteilt Brandrisiko und liefert
sofort ohne Gebührenware. Amortisation (Fischer Stufe 2): 1200 bis 1500 Ticks, Stufe 3: 1600 bis 1900 Ticks (nur wenn
die Ware gebraucht wird; zum Verkaufspreis amortisiert sich nichts, Überschuss lohnt nicht, kein Endlos-Überschuss).
**Klumpenrisiko:** Ein Brand legt einen Stufe-3-Betrieb 200 Ticks lang mit 2,5-fachem Ausstoss lahm (Feuerwache
wird wichtiger).

### 3.3 Freischaltung (M10-Modell)

Anbindung an `defs/unlocks.ts` **ohne neue Auslöser**: zwei neue `UnlockFunction`: `upgrade2` im Eintrag **U3**
(`tierReached 2`, erste Siedler) und `upgrade3` im Eintrag **U5** (`tierReached 3`, erste Bürger). Die Funktionen
erscheinen in der Freischalt-Meldung („Neu: Amtsstube (I), Handelsaufträge, Ausbau Stufe 2 — …") über
`FUNCTION_LABELS`; `notice`/`tip` bekommen einen Satz (Thema M10-Delta: „Die Fischer …": Stufe 2 „Das zweite Netz",
Stufe 3 „Boote mit Mannschaft", Rum). Sperre in der Sim: `upgradeBuilding` liefert vor der Freischaltung
`{ ok: false, reason: <lockText> }`; die UI blendet den Knopf bis dahin aus. **Folge für M10-Tests** (erst bei der
Umsetzung S12, M10 ist dann gemergt): `FUNCTION_ENTRY`, `FUNCTION_LABELS`, AK-S1-01 (jede Funktion in genau einem
Eintrag) und die Meldungstexte U3/U5 ändern sich bewusst. **(A)** Ausbau-Freischaltung folgt M10; vor dem M10-Merge
gibt es kein Ausbau-Feld.

### 3.4 Sim

- `Building.level?: 2 | 3` (fehlt = 1; unveränderte Gebäude und alte Saves bleiben bit-gleich).
- Aktion `upgradeBuilding(world, id)` → `{ ok, reason }`, wirft nie. Ablehnungsgründe: nicht freigeschaltet,
  Höchststufe, Geld/Holz/Werkzeug/Stein/Gebührenware fehlt, Gebäude brennt (`outageUntil`).
- **Sofortiger** Ausbau (keine Bauzeit): Zahlung sofort, `level` +1, `progress` bleibt erhalten (läuft der Zyklus
  weiter, schliesst er sofort ab, nichts geht verloren). Eingangsgüter schon entnommen: unverändert.
- Abriss: Erstattung 50 % (abgerundet, `refundCost`) auf Baukosten **plus** bezahlte Stufenkosten (Geld, Holz,
  Werkzeug, Stein); Gebührenware wird nicht erstattet (Senke bleibt echt). Kein Rückbau auf eine tiefere Stufe.
- `Cost` kennt heute nur vier Felder: Gebühr als eigenes Feld `fee: { good, amount }` in `levels` (Entscheid
  `lead-tech`, kein neues Gut im Feld `Cost`).
- Werte ausschliesslich in `defs/buildings.ts` (`levels`), nie im Code.

### 3.5 Bedienung

- **Ausbau-Knopf im Gebäude-Panel** (`inspect.ts`), Abschnitt „Ausbau zu Stufe 2": Kosten, Ertrag
  („Ausstoss 15 → 25 je Minute, Unterhalt 30 → 42 je Minute"), Gründe als „✗ …"-Zeilen wie beim Hausaufstieg
  (`friendlyReason`). Kein Hotkey (Kann: Strg-Klick „alle gleichen Betriebe im Radius ausbauen", Streichkandidat).
- **Mouse-over** (M10 §13) zeigt Stufe und Ausstoss („Fischerhütte, Stufe 2").
- **Freischalt-Meldung** und Hilfe-Karte („Als Nächstes freigeschaltet": „Ausbau Stufe 3 — sobald die ersten Bürger
  einziehen") über das M10-Modell; kein neuer Mechanismus.
- Bauleisten-Tooltip des Betriebs nennt die Ausbauwerte (nicht die Baukosten der Stufen).

### 3.6 Darstellung (Hinweis für `lead-art`)

Jede Stufe erkennbar an der **Silhouette**, nicht an einer Zahl: Stufe 2 ein Anbau/zweites Element (Fischer: zweites
Netzgestell; Weberei: zweiter Webstuhl-Giebel), Stufe 3 ein Wahrzeichen (Fahne, Steinsockel, Boot am Steg). Pflicht
wie bei jedem Gebäude: `sprites.test.ts` prüft je (Typ, Stufe), dass die Silhouette von der vorherigen abweicht.
Rendering liest `building.level`, schreibt nie in die Welt. Kosten-Hinweis: eine **gemeinsame Stufen-Aufsatz-Funktion**
(Dachfarbe, Fahne, zusätzlicher Schornstein) statt 18 Einzel-Silhouetten (Größe S statt M).

### 3.7 Save und Baseline

- **Save:** `level` ist optional (fehlt = Stufe 1); `isWellFormed` prüft `level ∈ {2, 3}` nur bei Vorhandensein und nur
  bei Betriebsgebäuden. Eigene Versionsnummer nur, wenn sie nicht schon S10 hebt: **Empfehlung** S12 nach S10, dann
  teilen beide die Versionsanhebung (Migration trivial: `level` fehlt = 1). Test mit gespeichertem Vorgängerstand.
- **Baseline:** S12 bricht die Baseline **nicht**: Der Referenz-Controller baut nie aus, Stufe 1 hat die heutigen Werte,
  Sieg bleibt bei Tick 6050. Ein bewusstes Ruling ist nicht nötig. Zusätzlich ein **neues Szenario** im
  Balancing-Test (Controller-Variante „baut Fischer aus": Sieg nicht später als Baseline, `minMoney` ≥ 0, keine
  Dominanz: Variante C verlangt R ≈ 1). Die Neumessung von S10 gilt dann auch für S12 (ein Messlauf).
- **README:** Spielanleitung mit Ausbau (Knopf, Kosten, Freischaltung) bei der Umsetzung.

## 4. Randfälle und entartete Strategien (Prüffrage 4)

| Fall                                     | Verhalten                                                                                                               |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Ausbau mitten im Zyklus                  | `progress` bleibt; Zyklus kann sofort abschliessen                                                                      |
| Gebührenware fehlt (kein Stoff/Rum)      | `{ ok: false, reason: 'Zu wenig Stoff' }`; der Spieler kauft am Kontor (Stoff 30, Rum 40) oder baut die Kette          |
| Abriss nach Ausbau                       | 50 % der bezahlten Stufenkosten (ohne Gebühr); kein Abriss-Gewinn                                                       |
| Lager voll (100)                         | schnellerer Zyklus verliert Überschuss wie bisher (`storageFull`)                                                       |
| Sturm                                    | `stormAffected` halbiert unverändert; Faktor relativ                                                                    |
| Feuer                                    | Ausfall 200 Ticks, Stufe bleibt                                                                                         |
| Kettenmismatch (Weberei 2, Schäferei 1)  | Verarbeiter zeigt `waitingInput`, Panel nennt den Grund                                                                 |
| Ausbau-Spam zur Geldfabrik               | nein: Verkaufspreis < Kaufpreis, Amortisation zum Verkaufspreis > 5000 Ticks, Preis fällt je Einheit (`SELL_DROP`)     |
| Holzfäller-Ausbau mit S3 (braucht Wald)  | Ausbau erhöht Holzverbrauch am Wald; Ausstoss hängt in M11 am Wald (S3), Ausbau lohnt dort bewusst weniger (R 1,5–2,1) |
| Laden eines Standes mit Ausbau vor U3/U5 | `deriveUnlocks` (M10 §8.2): bestehendes `level ≥ 2` schaltet `upgrade2`/`upgrade3` frei (kein verschwundener Ausbau)    |

## 5. Einordnung in M11 und Grösse

- **Reihenfolge: S10 → S12, parallel zu S2.** S10 (Flüsse) verändert `tickEconomy`; der erhöhte Unterhalt muss durch
  denselben Fluss laufen, und die Neumessung der Baseline gilt für beide. S2 (weitere Nahrung) beantwortet
  dasselbe Problem von der anderen Seite (Alternative zur Küste); S12 liefert `levels`, S2-Gebäude bekommen sie mit
  einem Eintrag.
- **Grösse M** (4 Pakete): Sim S (`levels`, `upgradeBuilding`, Abriss, Save, Tests), UI S (Panel, Tooltip, Meldung,
  Hilfe), Render S (Stufen-Aufsatz), Balancing S (Controller-Variante, Szenario). Prozessstufe voll.
- **Nicht Teil von S12:** Ausbau von Wohnhäusern (Bevölkerungsstufen bleiben), öffentliche Gebäude, Arbeiter,
  Rückbau, Stufe 4, Ausbau-Hotkey, Sammelausbau, neue Güter.

## 6. Annahmen und Fragen an L0

| #  | Annahme / Frage                                                                                  | Empfehlung                        |
| -- | ------------------------------------------------------------------------------------------------ | --------------------------------- |
| A1 | 3 Stufen (Basis, 2, 3); Kaufleute schalten nichts frei                                           | so                                |
| A2 | Gebühr in Stoff (Stufe 2) und Rum (Stufe 3), nicht erstattet                                     | so (Güter höherer Stufe, Senke)   |
| A3 | Freischaltung als Funktionen `upgrade2` in U3, `upgrade3` in U5 (kein neuer Auslöser)            | so; M10 bleibt unverändert        |
| A4 | Ausbau sofort, kein Rückbau, Abriss erstattet 50 % der bezahlten Stufenkosten ohne Gebühr        | so                                |
| A5 | S12 nach S10 (eine Neumessung); keine Baseline-Änderung durch S12                                | so                                |
| A6 | Variante C (R ≈ 1 gegen Neubau) statt A/B; ganzzahlig gerundeter Unterhalt (6,5 → 7 usw.)         | so; Feinabstimmung im Playtest    |
| A7 | Kein Spielerzwang: Ausbau optional, der Neubau bleibt gleichwertig                                | so                                |

## 7. Selbstprüfung Gate Brainstorming

1. **Säulen:** Produktionsketten, Bevölkerung, Wirtschaft; die Säule Besiedeln gewinnt (weniger Fläche).
2. **Echte Wahl:** ja, Neubau und Ausbau sind je Geld gleichwertig, unterscheiden sich in Platz, Unterhalt und Risiko.
3. **Rückkopplung:** Wachstumsmotor Bürger → mehr Bedarf → Ausbau; Bremse: Gebührenware (Stoff/Rum), Unterhalt,
   Klumpenrisiko, Kettenabgleich. Gewollt.
4. **Randfälle:** Abschnitt 4, ohne offenen Fall.
5. **Einfachere Variante:** nur ein Ausbauschritt (Stufe 2) hätte dasselbe Gefühl mit weniger Aufwand; wir behalten
   zwei Schritte, weil sie an die Bevölkerungsstufen 2 und 3 gebunden sind. Streichvariante: Stufe 3 nach M12.

**Urteil Selbstprüfung: OK** (mit A1 bis A7 als Annahmen; Bedenken: Feinabstimmung der Werte im Playtest, ungeprüft
am echten Controller).
