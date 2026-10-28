# HAFEN · Hafen und Anlegestelle (Spec, Stufe voll)

Stand 2026-10-25 · Paket `design-hafen` · Meilenstein M14 · Prozessstufe voll · Auftrag R896 (0), Designvorschlag
lead-design (freigegeben) · Diagnose: Handoff `.studio/handoffs/2026-10-25-lead-tech-BUG-SCHIFF.md` (a)–(c) · Rechnung:
[anhang-01-rechnung.md](2026-10-25-hafen-design/anhang-01-rechnung.md) · Optik:
[anhang-02-optik.md](2026-10-25-hafen-design/anhang-02-optik.md) · Stand Code main `70a32032` (Save v18 damals), Seerecht aus
`feat/seerecht` (Save v19, nicht gemergt). Alle Zahlen stammen aus dem Designvorschlag oder Anhang 01; Schätzungen sind
markiert. Plan: docs/superpowers/plans/2026-10-25-hafen.md; R25, AK-HF-38 und AK-HF-52 gelten im Wortlaut R943, siehe Plan-Nachtrag `2026-10-25-hafen/N-nachtrag-r945.md` §2.

## 1 Spielerzweck (ein Satz) und Säule

Der Spieler sieht und versteht seinen Handel: Schiffe kommen am gebauten Kontor an, liegen dort sichtbar am Steg, fahren
in Fahrtrichtung mit einer Geschwindigkeit, die sich aus der Strecke erklärt, und der Bauplatz des Kontors II wird über
die angezeigte Fahrzeit zu einer echten Entscheidung.

Säule: Fernhandel und Lesbarkeit (Arbeit/Stillstand). Behebt die drei Befunde aus BUG-SCHIFF: (a) ungleiche Geschwindigkeit
(Faktor 1,2 bis 9,0 Ticks je Kachel Fahrlinie, Anhang 01 A), (b) Route endet bis 27 Kacheln vom Kontor, (c)
Auftragsschiff erscheint und verschwindet im selben Frame.

## 2 Varianten und Entscheide

| Frage               | Gewählt                                  | Verworfen                          |
| ------------------- | ---------------------------------------- | ---------------------------------- |
| Anlegestelle        | «Anker folgt Kontor» (V1)                | «Kontor II nur auf `kontorSite`»   |
| Kalibrierung        | K2: Generator prüft L, `k` 2,9           | K1: nur `k`                        |
| Fahrzeit-Grundlage  | A2: `ceil(L · k)` aus der Fahrlinie      | nur A1, Sim bleibt bei der Geraden |
| Auftragsschiff      | abgeleitet, ohne Liefersperre, ohne Save | «Liefern erst nach dem Anlegen»    |
| Liegezeit `D`       | 30 Ticks                                 | 20, 40                             |
| Kontor II am Wasser | Meerufer-Regel (`seaMask`)               | jedes Wasser (`coast`)             |

- **Anker folgt Kontor statt «nur auf `kontorSite`»:** Die Nachführung kostet einen Funktionsaufruf beim Bau plus
  Cache-Invalidierung (AK-HF-06); dafür wird die Platzwahl eine echte Entscheidung: −30 % / 0 / +50 % Fahrzeit über 654
  Plätze, je Insel 21–50 % Spanne, keine Falle, wenn die Vorschau die Fahrzeit zeigt (Anhang 01 E). «Nur `kontorSite`»
  wäre billiger (S), nimmt aber die Abwägung Fahrzeit gegen Rohstofflage.
- **K2 statt K1:** Mit K1 gilt A < C < B nur in 8/37 Welten (heute 37/37); die Felsbucht verliert ihren Weg-Nachteil und
  wird dominante Wahl. K2 hält die heutigen Umläufe je Art (Anhang 01 B). Kosten: alle Seed-Welten ändern sich (Pins,
  Goldwerte), Weltaufbau bis ≈ 0,75 s (Schätzung).
- **Auftragsschiff ohne Liefersperre:** «Liefern erst nach Anlegen» braucht einen Annahmetick für Fernaufträge als neuen
  Weltzustand; Gewinn nur 3,5 s Wartezeit ohne Entscheidung.
- **D 30:** x4 0,75 s sichtbar, x1 kein Stau-Eindruck; 20 zu kurz bei x4, 40 schwächt Seerecht (Anhang 01 C).
- **Meerufer:** 12 Plätze (alle Seed 1 Insel A) hätten die Anlegestelle sonst bis 5,8 Kacheln vom Kontor.

**Fallback:** Lehnt L0 K2 ab (E1), entfallen S2 und S3: A2 wird zurückgestellt, die ungleiche Geschwindigkeit bleibt,
A1 mildert nur das Ruckeln. S1, S4–S7 und die Optik bleiben gültig, S7 zeigt dann die heutige Fahrzeit (`10 · d`).

## 3 Regeln

Spielwerte stehen in `src/sim/defs/`; Darstellungswerte stehen in `src/render/` und wirken nie auf die Sim.

### 3.1 Anlegestelle (S1)

- **R1 `dockFor(terrain, w, h, kontorPos)`** (neu, rein, `src/sim/islands.ts`): Kandidaten sind die Wasserkacheln im
  8er-Ring um den 2×2-Fussabdruck (die 12 Kacheln mit Chebyshev-Abstand 1 zum Fussabdruck), die zu `seaMask` gehören.
  Wahl nach kleinstem quadriertem Abstand zu `(kontor.x + 1, kontor.y + 1)` wie `homeAnchor`; Gleichstand: kleineres y,
  dann kleineres x. Leere Kandidatenliste → Rückfall `homeAnchor(terrain, w, h, kontorPos)`.
- **R2 Meerufer-Regel:** Kontor II braucht mindestens eine angrenzende Kachel (wie `coast`, `adjacentOf`) in `seaMask`.
  Neue Platzregel (Vorschlag `{ kind: 'seaCoast' }` in `placement.ts`), ersetzt `coast` in `BUILDING_DEFS.kontor2.site`
  (`src/sim/defs/buildings.ts:256`). Fehlertext «Kontor braucht Zugang zum Meer». Das Heimatkontor ist fest und
  unberührt. Erfüllt ein Platz R2, ist die Kandidatenliste von R1 nicht leer (Kantennachbarn ⊂ 8er-Ring).
- **R3 Anker beim Bau:** Beim erfolgreichen Bau von `kontor2` setzt `build` `island.anchor = dockFor(...)` der Insel.
  `island.anchor` bleibt das gespeicherte Feld; es ist künftig veränderlich (`types.ts`-Kommentar anpassen).
- **R4 Abriss:** Abriss von Kontor II lässt den Anker stehen (Steg verschwindet, Ankerplatz bleibt). Abriss bleibt
  gesperrt, solange ein Schiff die Insel braucht (`build.ts` `shipNeedsIsland`, «Erst Route auflösen»).
- **R5 Cache-Invalidierung:** Nach einer Ankeränderung liefern `seaRoute`, `seaLanes`, `laneTicks`, `lanePoints` und
  `cachedTicks` Werte zum neuen Anker. Heute sind `cache`/`gridCache` (`seaRoute.ts:41`), `ticksCache` und `pointsCache`
  (`shipLane.ts:21, 33`) per `islands`-Array-Identität gekeyt; der Fingerabdruck (`seaRoute.ts:372`) enthält den Anker
  schon. Wie invalidiert wird (z. B. neues `islands`-Array oder Versionszähler), entscheidet Tech; Pflicht ist AK-HF-06.
- **R6 Eine Anlegestelle:** `shipTile` (Auftragsschiff, `src/render/ship.ts:54`), die Pose liegend (`shipLane.ts:92`) und
  die Fahrlinie lesen nur noch `island.anchor`. Heimat unverändert (Anker = `homeAnchor(kontorSite)`, heute schon gleich
  `shipTile`, Beleg q.test).

### 3.2 Generator K2 (S2)

- **R7 L-Bänder:** `layoutValid` (`islands.ts:388`) prüft L (Länge der `seaRoute`-Polylinie Heimatanker → Kandidatanker)
  statt d. Neue Felder in `ISLANDS` (`src/sim/defs/sea.ts`): `lMin`/`lMax` A 76/93, C 97/110, B 110/128 Kacheln (Anhang
  01 B). `dMin`/`dMax` bleiben als Streuung der Kandidatenerzeugung (`originFor`, `searchFar`); ob ihre Spanne für genug
  Treffer erweitert werden muss, zeigt AK-HF-12 (offen O-3).
- **R8 Generator-Anker:** Der Generator setzt den Anker jeder **Fremdinsel** neuer Welten mit `dockFor(kontorSite)` statt
  `homeAnchor` (der Heimatanker bleibt `homeAnchor(kontorSite)`, R6), damit
  das L-Band für den Anker gilt, den ein Kontor II am vorgesehenen Platz bekommt (Folge aus R1/R3, AK-HF-14).
- **R9 Ersatzlagen** (`searchFar`, Stufe 3) bleiben ohne Bandprüfung wie heute.
- K2 betrifft nur neue Welten; gespeicherte Welten tragen ihre Inseln.

### 3.3 Fahrzeit aus der Fahrlinie (S3)

- **R10 Fahrzeit** `T(a, b) = ceil(L · k)`, L = Länge der `seaRoute(islands, min, max)`-Polylinie Anker → Anker, `k` =
  wirksamer Wert. Neuer Spielwert `SHIP_TICKS_PER_ROUTE_TILE = 2.9` (`src/sim/defs/sea.ts`), ersetzt
  `SHIP_TICKS_PER_SEA_TILE` 10 für alle Fahrzeiten. `seaRoute` wird spielrelevant; Kommentar `defs/sea.ts:110` («reine
  Darstellung, beeinflusst … Fahrzeit nicht») ändern. Notanker Gerade bleibt (L = Länge der Geraden, `T ≥ 1`).
- **R11 Gleichmässige Geschwindigkeit:** Auf jeder Lane gilt `|L/T − 1/k| < 1/(k · T)` (nur `ceil` bedingt).
- **R12 Seerecht:** `COUNCIL[4].C.lever` (`src/sim/defs/council.ts`, `kind: 'seaTileTicks'`) 8 → **2,32** (= 2,9 × 0,8,
  Fahrt +25 %). Kartentext bleibt. Der Rückfallwert von `seaTileTicks(world)` (`council.ts`, heute
  `SHIP_TICKS_PER_SEA_TILE`) wird `SHIP_TICKS_PER_ROUTE_TILE`. Umrechnung beim Beschluss (`rescaleVoyages`, `ceil`) gilt unverändert mit `T`.
- **R13 Frist-Invariante Fernauftrag:** `600 + 2 · (ceil(k · L_max) + D) ≤ FAR_ORDER_DURATION` (1700); hält bis L ≤ 179
  (gemessen max 171,6), mit K2 und B ≤ 128: 1404 (Anhang 01 H). Die Prüfung nimmt eine L-Grenze statt `dMax`.
- **R14 Eine Quelle:** Inselkarte (`islandCard.ts:74`), `homeTravelTicks` (`homeTravel.ts:35`), Seekarte (`seaMap.ts`),
  `routeBalance`, `depart` und die Save-Prüfung lesen die Fahrzeit aus derselben Funktion (heute `laneTicks` bzw. auf
  `feat/seerecht` `laneTicksOf`). `travelTicks(d)` entfällt als Fahrzeitquelle.
- Abhängigkeit: S3 setzt `feat/seerecht` in main voraus (Hebel, `rescaleVoyages`, v19).

### 3.4 Liegezeit (S4)

- **R15 Spielwert** `SHIP_DOCK_TICKS = 30` (`src/sim/defs/sea.ts`).
- **R16 Neues Feld** `Ship.dwell` (ganzzahlig, 0 … `SHIP_DOCK_TICKS`): verbleibende Liegeticks.
- **R17 Ankunft** (`left` → 0, Tick t0) eines Schiffs mit Route: `port = to`, `to = null`, sofort entladen wie heute
  (`unload` mit `keep` = Güter der Ladeliste dieses Hafens, sofern `port` in der Route liegt), `dwell = 30`. Kein Laden,
  keine Abfahrt in t0.
- **R18 Liegen:** In jedem Folgetick mit `to === null` und `dwell > 0`: `dwell -= 1`. Erreicht `dwell` 0 (Tick t0 + 30),
  läuft im selben Tick der heutige `handleDocked`-Rest: liegt `port` in der Route → `load` nach der **aktuellen**
  Ladeliste, dann `depart`; sonst `depart` nach `route.a`. Umlauf damit `2 T + 2 D`.
- **R19 Ohne Route:** Schiffe ohne Route liegen wie heute unbegrenzt (`dwell` bleibt 0). Heimkehr (`homing`) entlädt bei
  Ankunft sofort (`unloadAtHome`, Verlustmeldung wie heute), ohne Liegezeit; an einem Fremdhafen legt ein Schiff mit
  `homing` wie heute sofort Richtung Heimat ab.
- **R20 Routenwechsel in der Liegezeit:** `updateRoute` gilt beim Ablegen (Ladeliste wird erst in R18 gelesen).
  `clearRoute` setzt `dwell = 0`; danach greift `homing` wie heute ab dem nächsten Durchlauf.
- **R21 Route auf liegendes Schiff** (`setRoute`, `dwell` 0): Abfahrt wie heute im nächsten Tick, ohne Liegezeit.
- **R22 `routeBalance.cycleTicks`** = `T(a, b) + T(b, a) + 2 · SHIP_DOCK_TICKS` (`routeBalance.ts:59`).

### 3.5 Darstellung Hafen (S5, nach A1)

- **R23 Steg:** Auf der Ankerkachel jeder Insel mit Kontor (Heimat und jede Insel mit `kontorId ≠ null`) ein Steg vom
  Kontorrand zur Mitte der Ankerkachel; reine Darstellung, kein Sim-Objekt, nichts wird unbebaubar (Wasser ist es
  schon). Optik Anhang 02 §I. Seekarte (`seaMap.ts`) unverändert.
- **R24 Liegeplätze:** Mehrere liegende Schiffe am selben Anker (Flotte nach `id`, das Auftragsschiff zuerst) erhalten je
  Rang einen Versatz; Mittelpunkte paarweise ≥ `BERTH_MIN_GAP = 0.5` Kachel (Darstellungswert, `src/render/shipLane.ts`),
  jeder Mittelpunkt auf einer Wasserkachel. Platzierungsregel (Kette entlang des Stegs, Ring) wählt Tech/Art.
- **R25 Pose:** `shipPose(world, ship, frac)` (A1) liefert zusätzlich `heading` (eine von 4 Iso-Richtungen NO/NW/SO/SW
  aus der Tangente der Fahrlinie an der Pose) und `furled` (`to === null`). Liegend: `heading` der Ankunftstangente;
  Schiff ohne vorherige Fahrt: feste Richtung nach Anhang 02.

### 3.6 Auftragsschiff (S6, nach A1 und S5)

- **R26 Anfahrt** beginnt am Angebotstick `t_A = ORDER_FIRST_TICK + order.period · ORDER_PERIOD`
  (`src/sim/defs/timing.ts`) und dauert `ceil(12 · SHIP_TICKS_PER_ROUTE_TILE)` = **35** Ticks. Weg: die letzten 12
  Kacheln der Fahrlinie von der nächstgelegenen anderen Insel (kürzeste Lane nach `T`) zum Anker; ohne Lane die Gerade
  von aussen (Richtung Inselmitte → Anker, über den Anker hinaus um 12 Kacheln verlängert). Darstellungswert
  `ORDER_SHIP_TILES = 12` (`src/render/`, neues Modul Vorschlag `orderShip.ts`). Pose = reine Funktion von
  `world.order`, `world.tick` und `frac`.
- **R27 Liegen:** am Anker (Liegeplatz Rang 0), solange `world.order !== null`.
- **R28 Abfahrt** beim Ende (Lieferung oder Ablauf) rückwärts über den Anfahrtsweg mit gleicher Geschwindigkeit: ab
  Anker 35 Ticks; endet der Auftrag während der Anfahrt bei Anteil f, dreht das Schiff an der aktuellen Pose und fährt
  `ceil(f · 35)` Ticks zurück. Den Endtick merkt sich die Darstellung (Render-Zustand, nicht in der Welt); nach dem Laden
  wird keine Abfahrt nachgespielt.
- **R29 Fernauftrag** (`order.island` gesetzt): Die Darstellung beobachtet die Annahme (Wechsel `order.island` null →
  i). Das Heimat-Auftragsschiff legt ab (R28), ein Schiff fährt den Anker von Insel i nach R26 an (Start = beobachteter
  Tick). Nach dem Laden liegt es direkt dort.
- **R30 Regeln unverändert:** Lieferung bleibt während der Anfahrt erlaubt; keine Liefersperre; kein Save-Feld. Pause
  friert alles (tickbasiert, Sub-Tick-Anteil aus A1). Das Auftragsschiff ist optisch fremd (Anhang 02 §H) und nicht
  anklickbar (`shipAt` liefert es nicht).

### 3.7 Fahrzeit-Vorschau (S7, nach S1 und S3)

- **R31** Die Bauvorschau für Kontor II zeigt «Fahrzeit zur Heimat m:ss (vorgesehener Platz m:ss)». Erster Wert: `T` zum
  Anker, den `dockFor` an diesem Platz liefern würde; zweiter: `T` zum Anker des Platzes `kontorSite`. Gleiche Funktion
  wie R14; Ergebnis je Kachel gecacht (≈ 5 ms je Route, Anhang 01 I). Ungültiger Platz: Fehlertext der Platzregel statt
  Fahrzeit.

### 3.8 Schiffsoptik (Optik-Strang lead-art)

- **R32** Vorgaben in Anhang 02: Silhouette, Rahsegel, Zweiton-Rumpf, 4 Fahrtrichtungen, gesetzt/gerefft, Massstab,
  Saum/Mindestgrösse/Trefferbox, Fremdfarbe Auftragsschiff, Steg. Prozedural, keine Assets.

### 3.9 Werte

| Name                        | Wert                         | Ort                       | Art                          |
| --------------------------- | ---------------------------- | ------------------------- | ---------------------------- |
| `SHIP_TICKS_PER_ROUTE_TILE` | 2,9                          | `src/sim/defs/sea.ts`     | Spielwert (neu)              |
| `SHIP_DOCK_TICKS`           | 30                           | `src/sim/defs/sea.ts`     | Spielwert (neu)              |
| `ISLANDS[].lMin/lMax`       | A 76/93, C 97/110, B 110/128 | `src/sim/defs/sea.ts`     | Spielwert (neu)              |
| `COUNCIL[4].C.lever.value`  | 8 → 2,32                     | `src/sim/defs/council.ts` | Spielwert (geändert)         |
| `SHIP_TICKS_PER_SEA_TILE`   | 10                           | `src/sim/defs/sea.ts`     | entfällt für Fahrzeiten (S3) |
| `BERTH_MIN_GAP`             | 0,5 Kachel                   | `src/render/shipLane.ts`  | Darstellungswert             |
| `ORDER_SHIP_TILES`          | 12 Kacheln                   | `src/render/orderShip.ts` | Darstellungswert             |

**Balancing-Test** (`tests/sim/balance.test.ts`) liest keine Lanes, Schiffe oder Fahrzeiten und bleibt **unverändert**
grün (AK-HF-22). Die gepinnten Fahrzeit-Tests (Anhang 01 H) werden bewusst neu gepinnt (E4).

## 4 Randfälle

- **Kontor II an Platz nur mit Binnenwasser:** Bau abgelehnt, «Kontor braucht Zugang zum Meer» (AK-HF-03).
- **Abriss und Neubau Kontor II an anderem Platz, ohne Schiffe:** Anker bleibt beim Abriss, folgt beim Neubau; Routen
  danach zum neuen Anker (AK-HF-05, -06).
- **Schiff ohne Route liegt an der Fremdinsel, Abriss und Neubau:** erlaubt (`shipNeedsIsland` falsch); das Schiff steht
  danach am neuen Anker, Sprung ohne Fahrt (AK-HF-05, O-2).
- **Abriss Kontor II während der Liegezeit:** gesperrt, «Erst Route auflösen» (AK-HF-31).
- **Routenwechsel in der Liegezeit:** `updateRoute` gilt beim Ablegen (AK-HF-25); `clearRoute` setzt `dwell` 0, Heimkehr
  wie heute (AK-HF-26).
- **Lager voll beim Entladen:** Entladen bis `STORAGE_CAP`, Rest bleibt an Bord wie heute, kein zweiter Versuch beim
  Ablegen (AK-HF-27, O-1).
- **4 Schiffe und Auftragsschiff am selben Anker:** 5 Liegeplätze auf Wasser, paarweise ≥ 0,5 Kachel (AK-HF-36).
- **Notanker Gerade** (`compute` findet keinen Wasserweg): L = Länge der Geraden, `T ≥ 1` (AK-HF-17).
- **Laden mitten in Fahrt oder Liegezeit:** `left`, `dwell` gespeichert, gleicher Verlauf wie ohne Laden (AK-HF-32).
- **Laden mitten in der Anfahrt des Auftragsschiffs:** Pose aus `order.period` und `tick`, gleich wie ohne Laden; eine
  laufende Abfahrt wird nicht nachgespielt (AK-HF-45).
- **Lieferung während der Anfahrt:** erlaubt; das Schiff dreht an der aktuellen Pose ab, `ceil(f · 35)` Ticks
  (AK-HF-43).
- **Fernauftrag-Annahme:** Heimatschiff legt ab, ein Schiff fährt den Zielanker an; nach Laden liegt es dort (AK-HF-44).
- **Seerecht-Beschluss während Fahrt:** `rescaleVoyages` mit `T` aus R10 (2,9 → 2,32), Pose springt nicht; während der
  Liegezeit bleibt `dwell`, die nächste Fahrt gilt mit 2,32 (AK-HF-18).
- **Pause:** alle Posen (Flotte, Auftragsschiff) stehen (AK-HF-41).
- **Alter Spielstand:** Migration nach §5, unbekannte Version abgewiesen (AK-HF-33 bis -35).
- **Ersatzlage ausserhalb des L-Bands:** erlaubt wie heute; Frist-Invariante über Seeds 1–40 gemessen (AK-HF-12, -20).

## 5 Save und Migration

- **S1:** kein Versionswechsel. `anchor` ist schon gespeichert; alte Stände behalten ihre Anker bis zur Migration in S3.
- **S3 (A2): `SAVE_VERSION` +1** (= Stand von main beim Merge + 1; heute main 18, SEERECHT 19, danach 20; feste Nummern
  gelten nur als Beispiel, R909/R913). Migration statt Abweisen (Empfehlung, E3), in dieser
  Reihenfolge (Anhang 01 G):
  1. `isValidShip` (`save.ts:707`) prüft `left` gegen `T_alt` aus dem alten Stand: `10 · d` bzw. `seaTileTicks` des
     alten Rats (Seerecht 8), mit den gespeicherten Ankern.
  2. Anker jeder Fremdinsel mit Kontor II := `dockFor(Kontorposition)`.
  3. `left_neu = clamp(ceil(left_alt · T_neu / T_alt), 1, T_neu)` für Schiffe mit `to ≠ null`; `T_neu` aus R10 mit den
     neuen Ankern (`seaRoute` beim Laden, einmalig ≤ ≈ 75 ms je Stand, Schätzung Anhang 01 I). `to = null`: `left` 0.
- **S4 (Liegezeit): `SAVE_VERSION` +1 (Stand main beim Merge + 1)** mit `dwell = 0` für alle Schiffe (alte Stände liegen nie mit Route), oder mit S3
  zusammengelegt, wenn derselbe Plan (Tech entscheidet). Prüfung: `dwell` ganzzahlig in 0 … `SHIP_DOCK_TICKS`;
  `dwell > 0` nur bei `to === null` und `route ≠ null`; sonst abgewiesen mit Hinweis, kein Absturz.
- **K2** ändert nur neue Welten. Der Render-Zustand des Auftragsschiffs (Endtick, beobachtete Annahme) wird nicht
  gespeichert.
- Der Abweisungstest für unbekannte Versionen bleibt.

## 6 Schnitte

Je Schnitt ≤ 1 Session (Schätzung). Reihenfolge S1 → S2 → S3 → S4; S5/S6 nach A1; S7 nach S3. A1 ist eigenes Paket.

- **S1 Sim Anlegestelle** (R1–R6): `dockFor`, Meerufer-Regel, Anker beim Bau, Cache-Invalidierung, `shipTile` auf den
  Anker. Dateien: `src/sim/islands.ts`, `placement.ts`, `build.ts`, `defs/buildings.ts`, `seaRoute.ts`,
  `src/render/ship.ts` (nur `shipTile`), `src/render/shipLane.ts` (nur Caches). Ohne Save-Wechsel.
- **S2 Sim Generator K2** (R7–R9), nach S1: L-Bänder, Generator-Anker, Laufzeit- und Ersatzlagen-AK, Neupinnen der
  Goldwerte. Dateien: `src/sim/islands.ts`, `defs/sea.ts`, `tests/sim/seaGolden*`.
- **S3 Sim Fahrzeit A2** (R10–R14), nach S2 und Merge `feat/seerecht`: `k`, Seerecht-Wert, Lade-Migration,
  Frist-Invariante, Anzeigen aus einer Quelle. Dateien: `src/sim/islands.ts`, `ships.ts`, `routeBalance.ts`, `save.ts`,
  `defs/sea.ts`, `defs/council.ts`, `src/ui/islandCard.ts`, `src/ui/homeTravel.ts`, `src/render/seaMap.ts`.
- **S4 Sim Liegezeit** (R15–R22), nach S3: `dwell`, `routeBalance`, Save. Dateien: `src/sim/ships.ts`, `types.ts`,
  `routeBalance.ts`, `save.ts`, `defs/sea.ts`.
- **S5 Render Hafen** (R23–R25), nach A1, S4 und Optik: Steg, Liegeplätze, Pose liegend und `heading`. Dateien:
  `src/render/shipLane.ts`, `renderer.ts`, neuer Steg-Zeichner.
- **S6 Render Auftragsschiff** (R26–R30), nach A1 und S5. Dateien: `src/render/orderShip.ts` (neu), `renderer.ts`,
  `ship.ts`.
- **S7 UI Fahrzeit-Vorschau** (R31), nach S1 und S3. Dateien: Bauvorschau in `src/ui/`, reiner Helfer in `src/ui/`.
- **Optik** (R32, lead-art, Anhang 02): `drawShip` neu, Steg-Zeichner; parallel zu S1–S4, vor S5 mergen. Datei-Eigentum
  `src/render/ship.ts` mit S1 (nur `shipTile`) im Plan klären oder S1 zuerst mergen.

## 7 Abnahmekriterien

«Rot heute» heisst: der Test schlägt auf main `70a32032` fehl (Rot-Beleg vor dem Fix). Seed-Welten:
`createWorld(seed, { unlockAll: true })`.

**S1 Anlegestelle** (`tests/sim/dock.test.ts`, neu, ausser anders genannt):

1. **AK-HF-01 `dockFor` Wahl:** Synthetisches Terrain 8×8, Kontor bei (3, 3): liefert die Ring-Kachel in `seaMask` mit
   kleinstem Abstand; bei zwei gleich nahen Kacheln die mit kleinerem y, dann kleinerem x; Binnenwasser im Ring wird nie
   gewählt.
2. **AK-HF-02 Rückfall:** Ohne Meerkachel im Ring liefert `dockFor` genau `homeAnchor(...)`.
3. **AK-HF-03 Meerufer** (`tests/sim/placement.test.ts`): Seed 1 Insel A, ein Platz nur an Binnenwasser: `build`
   liefert `ok: false` «Kontor braucht Zugang zum Meer»; ein Meerplatz derselben Insel `ok`. Rot heute (Binnenplatz ok).
4. **AK-HF-04 Anker folgt Kontor:** Seeds 1, 2, 3, 37, jede Fremdinsel, jeder nach R2 gültige 2×2-Platz: nach dem Bau
   gilt `anchor = dockFor(...)` und Abstand Anker–Kontormitte ≤ 2,2 Kacheln. Rot heute (Median 10,6–19,3).
5. **AK-HF-05 Abriss/Neubau:** Kontor II an Platz P bauen, abreissen: Anker unverändert; an Platz Q ≠ P bauen: Anker =
   `dockFor(Q)`. Liegt ein Schiff ohne Route dort, steht seine Pose danach am neuen Anker.
6. **AK-HF-06 Cache:** `seaRoute`, `lanePoints`, `laneTicks` vor dem Bau aufrufen (Cache gefüllt), dann Kontor II an
   einem Nicht-Standardplatz bauen: letzter Punkt von `seaRoute(…, 0, i)` und `lanePoints(w, 0, i)` = neuer Anker + 0,5;
   `laneTicks` entspricht dem neuen Anker.
7. **AK-HF-07 Heimat** (`tests/render/ship.test.ts`): Seeds 1–40 mit Auftrag: `shipTile(world)` = Heimatanker; ohne
   Auftrag `null`.
8. **AK-HF-08 Determinismus:** Zwei Welten, gleicher Seed und gleiche Baufolge: Anker und Routen JSON-gleich.

**S2 Generator K2** (`tests/sim/islandGen.test.ts`, neu, ausser anders genannt):

9. **AK-HF-09 Bänder:** Seeds 1–40, jede Fremdinsel ohne Ersatzlage: `lMin ≤ L(Heimat → i) ≤ lMax` ihrer Art.
10. **AK-HF-10 Inselrollen:** jede Welt ohne Ersatzlage: `T(A) < T(C) ≤ T(B)` (Bandgrenze 110 geteilt). Rot-Beleg: A2
    ohne K2 (nur 8/37 Welten, Anhang 01 B).
11. **AK-HF-11 Laufzeit:** `createWorld` ≤ 1000 ms je Welt, Maximum über Seeds 1–40 (`performance.now()`; ist der Test
    im CI unruhig, als Messprobe mit Ergebnis im Plan-Bericht, Entscheid Tech).
12. **AK-HF-12 Ersatzlagen:** Anteil Fremdinseln in Ersatzlage über Seeds 1–40 ≤ heutiger Anteil + 5 Prozentpunkte; der
    heutige Anteil wird zu Beginn von S2 auf main gemessen und im Plan festgehalten.
13. **AK-HF-13 Goldwerte** (`tests/sim/seaGolden.test.ts`): neu gepinnt (Lanes, Ticks, Welt-Hash), Verweis auf das
    Ruling zu E4 im Testkommentar.
14. **AK-HF-14 Generator-Anker:** Seeds 1–40: Kontor II auf `kontorSite` gebaut ändert den Anker nicht.

**S3 Fahrzeit** (`tests/sim/islands.test.ts`, `tests/sim/council.test.ts`, `tests/sim/farOrder-defs.test.ts`):

15. **AK-HF-15 Formel:** `SHIP_TICKS_PER_ROUTE_TILE === 2.9`; Seeds 1–40, jede Lane: Fahrzeit = `ceil(L · 2.9)` mit L
    aus `seaRoute`.
16. **AK-HF-16 Gleichmass:** Seeds 1–40, jede Lane: `|L/T − 1/k| < 1/(k · T)`. Rot heute (1,2–9,0 Ticks je Kachel).
17. **AK-HF-17 Notanker:** Inselpaar ohne Wasserweg (synthetisch): Route = Gerade, `T = ceil(|Gerade| · 2.9) ≥ 1`.
18. **AK-HF-18 Seerecht:** `COUNCIL[4].C.lever.value === 2.32`; mit `'C'` ist `T = ceil(L · 2.32)`; Beschluss während
    Fahrt rechnet `left` mit `ceil` um, Pose springt höchstens um eine Tickstrecke (`M14:AK-SR-15` neu, liegt auf `feat/seerecht`, nicht auf main); Beschluss während
    Liegezeit lässt `dwell` unverändert.
19. **AK-HF-19 `M14:AK-SR-7`/`M14:AK-SR-8` neu** (auf `feat/seerecht`): Formel `cap × 100 / (2 · ceil(k · L) + 2 · D)`: L 110 ergibt Umlauf 698 / 572 und 7,16
    / 8,74 je Schiff (Gewinnlage), L 90 ergibt 8,59 ohne Seerecht (Nulllage) (Anhang 01 D).
20. **AK-HF-20 Frist-Invariante:** `600 + 2 · (ceil(2.9 · lMax_B) + 30) ≤ FAR_ORDER_DURATION`; zusätzlich Seeds 1–40
    jede Heimat-Lane einschliesslich Ersatzlagen: `600 + 2 · (T + 30) ≤ 1700`.
21. **AK-HF-21 Anzeigen** (`tests/ui/islandCard.test.ts`, `tests/ui/homeTravel.test.ts`): Seeds 1, 2, 3, jede Fremdinsel:
    Inselkarte und `homeTravelTicks` = Sim-Fahrzeit derselben Lane (mit und ohne Seerecht).
22. **AK-HF-22 Neupinnen:** Die Tests aus Anhang 01 H (`ships.test.ts:327`, `farOrder-defs:33, 47`, `seaGolden:285`,
    `routeBalance:34, 47`, `homeTravel:17`, `islandCard:29`, `farOrder-sea:22, 81`, AK-SR-7/-8, `ships-rng`) sind neu
    gepinnt und grün; `git diff` auf `tests/sim/balance.test.ts` ist leer.

**S4 Liegezeit** (`tests/sim/ships.test.ts`, `tests/sim/routeBalance.test.ts`):

23. **AK-HF-23 Ablauf:** Schiff auf Route kommt in Tick t0 an: Lager steigt in t0, `dwell` = 30, `to === null`; in
    t0 + 29 noch `to === null`; in t0 + 30 geladen und `to` gesetzt, `left = T`. Rot heute (Abfahrt in t0).
24. **AK-HF-24 Umlauf** (`M12:AK-E4-03` neu): Rundreise = `2 T + 60` Ticks.
25. **AK-HF-25 Routenwechsel:** `updateRoute` in `dwell` 15 mit neuer Ladeliste: beim Ablegen wird nach der neuen Liste
    geladen.
26. **AK-HF-26 `clearRoute`:** in der Liegezeit am Fremdhafen: `dwell` 0, `homing`, Abfahrt Richtung Heimat im nächsten
    Durchlauf; am Heimathafen: `unloadAtHome` wie heute.
27. **AK-HF-27 Lager voll:** Lager des Ziels bei `STORAGE_CAP − 5`, Schiff bringt 20: 5 entladen in t0, 15 bleiben an
    Bord und fahren mit.
28. **AK-HF-28 Ohne Route:** gekauftes Schiff liegt, `dwell` bleibt 0 über 100 Ticks; Heimkehr entlädt bei Ankunft im
    selben Tick (Verlustmeldung wie heute).
29. **AK-HF-29 `routeBalance`:** `cycleTicks = T(a, b) + T(b, a) + 60`.
30. **AK-HF-30 `setRoute`:** auf liegendes Schiff ohne Route: Abfahrt im nächsten Tick, keine Liegezeit.
31. **AK-HF-31 Abriss:** Kontor II, an dem ein Schiff mit Route liegt: `demolish` liefert «Erst Route auflösen».

**Save** (`tests/sim/save.test.ts`):

32. **AK-HF-32 Runde:** Welt mit Schiffen mitten in Fahrt und mitten in der Liegezeit speichern und laden; nach 500
    weiteren Ticks JSON-gleich zur durchgelaufenen Welt.
33. **AK-HF-33 Migration vom Vorgängerstand (main beim Merge, heute v18/v19):** Stand mit Kontor II abseits `kontorSite` und fahrendem Schiff: nach dem Laden Anker
    = `dockFor`, `left = clamp(ceil(left_alt · T_neu / T_alt), 1, T_neu)`; `left = T_alt` → `T_neu`, `left = 1` → 1;
    `left > T_alt` im alten Stand wird vor der Umrechnung abgewiesen.
34. **AK-HF-34 `dwell`** (gilt für die Version, die `dwell` einführt, eigene oder die von S3): alter Stand lädt mit `dwell = 0`; `dwell` 31, −1, 1,5 oder `dwell > 0` mit `to ≠ null` wird
    mit Hinweis abgewiesen, kein Absturz.
35. **AK-HF-35 Abweisung:** unbekannte Version (`SAVE_VERSION + 1` und höher, relativ zur aktuellen Konstante) mit Hinweis abgewiesen.

**S5 Render Hafen** (`tests/render/shipLane.test.ts`, `tests/render/dock.test.ts` neu, Fake-Kontext):

36. **AK-HF-36 Liegeplätze:** 4 liegende Flottenschiffe und Auftragsschiff am selben Anker: 5 Mittelpunkte auf
    Wasserkacheln, paarweise ≥ 0,5 Kachel, Rang 0 = Auftragsschiff, danach `id`-Folge.
37. **AK-HF-37 Pose:** liegendes Schiff (`dwell > 0` oder ohne Route) am Liegeplatz mit `furled` wahr; fahrendes `furled`
    falsch.
38. **AK-HF-38 Fahrtrichtung:** Lane mit Tangente in jedem Iso-Quadranten: `heading` ist NO, NW, SO bzw. SW; liegend die
    Ankunftsrichtung.
39. **AK-HF-39 Steg-Zeichner:** Insel mit Kontor zeichnet einen Steg, Insel ohne Kontor keinen; in der Zeichenfolge liegt
    der Steg vor dem Schiff am selben Anker.
40. **AK-HF-40 Browser Hafen:** Seed 1, Insel B, Kontor II an einem Platz abseits `kontorSite`, Route Heimat ↔ B,
    Zoom 1: Screenshot zeigt Steg am Kontor und das Schiff liegend am Steg mit gerefftem Segel; nach ≈ 3 s (x1) legt es
    mit gesetztem Segel ab, Bug in Fahrtrichtung.

**S6 Auftragsschiff** (`tests/render/orderShip.test.ts`, neu):

41. **AK-HF-41 Anfahrt:** Tick `t_A − 1`: kein Auftragsschiff; `t_A`: 12 Kacheln vor dem Anker auf dem Anfahrtsweg, noch
    nicht an der Anlegestelle; `t_A + 35`: am Anker; dazwischen Abstand monoton fallend, Geschwindigkeit gleichmässig;
    gleicher Tick und `frac` (Pause) ergibt dieselbe Pose. Rot heute (Schiff liegt ab `t_A` am Kontor).
42. **AK-HF-42 Ohne Lane:** Insel ohne Nachbar-Lane: Startpunkt = Anker + 12 · Einheitsvektor (Inselmitte → Anker).
43. **AK-HF-43 Lieferung während Anfahrt:** Lieferung bei f = 0,4: Schiff fährt ab der aktuellen Pose zurück und ist nach
    `ceil(0,4 · 35)` = 14 Ticks weg.
44. **AK-HF-44 Fernauftrag:** Annahme beobachtet: Heimat-Auftragsschiff legt ab, Schiff fährt Zielanker in 35 Ticks an;
    neu geladener Stand mit laufendem Fernauftrag: Schiff liegt sofort am Zielanker, keines an der Heimat.
45. **AK-HF-45 Laden in Anfahrt:** Stand bei `t_A + 10` geladen: Pose gleich der Pose ohne Laden.
46. **AK-HF-46 Browser Auftragsschiff:** Tempo x1, Auftrag erscheint: Screenshot-Folge (0 s, ≈ 1,7 s, ≈ 3,5 s) zeigt das
    fremde Schiff auf dem Anfahrtsweg und dann am Steg; nach Lieferung fährt es ab.

**S7 Vorschau** (`tests/ui/kontorPreview.test.ts`, neu, reiner Helfer):

47. **AK-HF-47 Wert:** Seed 1, Insel B, 5 gültige Plätze: angezeigte Fahrzeit = Sim-Fahrzeit nach dem Bau an diesem
    Platz; zweiter Wert = Fahrzeit für `kontorSite`.
48. **AK-HF-48 Ungültig:** Binnenplatz (Seed 1 Insel A) zeigt «Kontor braucht Zugang zum Meer», keine Fahrzeit.
49. **AK-HF-49 Cache:** zweite Abfrage derselben Kachel rechnet keine Route neu (Zähler).
50. **AK-HF-50 Browser Vorschau:** Kontor II über zwei Plätze ziehen: Text «Fahrzeit zur Heimat … (vorgesehener Platz …)»
    wechselt den ersten Wert, der zweite bleibt.

**Optik** (Anhang 02):

51. **AK-HF-51 Galerie (Browser):** 4 Richtungen × fahrend/liegend, Zoom 0,5 / 1 / 2, plus Auftragsschiff; Prüfpunkte
    nach Anhang 02 §J.
52. **AK-HF-52 Trefferbox** (`tests/render/shipLane.test.ts`): `shipAt` trifft die neue Silhouette in allen 4 Richtungen
    an Rumpfmitte und Mastspitze, nicht 0,2 Kachel neben dem Rumpf; Auftragsschiff nie.

## 8 Abgrenzung, nicht im Scope

- **A1** Sub-Tick-Interpolation `shipPose(world, ship, frac)`: eigenes Paket, Voraussetzung für S5/S6.
- **LEBEN-SEE** (Kielwasser I-157, Anlege-Klang I-156): nicht im Scope. Hinweis: Mit der Liegezeit gibt es erstmals den
  beobachtbaren Zustand «liegt» (`to === null` mit Route); der Klang-Auslöser `port`-Wechsel bleibt gültig, eine
  Umstellung entscheidet LEBEN-SEE. Das Kielwasser liest `shipPose` und folgt der neuen Fahrzeit von selbst.
- Ausdrücklich nicht: Hafenausbau, Kai-Stufen, Hafengebühren, Stau oder Warteschlange am Steg, Lotsen, Anklicken des
  Auftragsschiffs, Klang, Kielwasser, neue Schiffstypen, Änderung der Seekarte, Änderung der Liefer- oder Fristregeln.

## 9 Mitzuführende Doku

- **README** Spielanleitung, Abschnitt Seehandel: Fahrzeit folgt der Strecke (2,9 Ticks je Kachel Fahrlinie), Liegezeit
  3 s bei x1, Kontor II braucht Zugang zum Meer, Bauvorschau zeigt die Fahrzeit, Seerecht +25 % Fahrt.
- **arc42** (`docs/arc42.md`): Bausteinsicht `seaRoute` spielrelevant (nicht mehr reine Darstellung), `island.anchor`
  veränderlich; Tick-Ablauf `tickShips` mit `dwell`; Persistenz neue Version(en) mit Migration; Render-Zustand
  Auftragsschiff (`orderShip.ts`).

## 10 Offene Entscheide an L0

| Nr. | Frage                                                             | Empfehlung                           |
| --- | ----------------------------------------------------------------- | ------------------------------------ |
| E1  | K2 (Generator prüft L) mit A2                                     | ja; ohne K2 gilt der Fallback aus §2 |
| E2  | Meerufer-Regel für Kontor II                                      | ja                                   |
| E3  | Migration statt Abweisen bei S3/S4                                | ja                                   |
| E4  | Gepinnte Fahrzeit-Tests bewusst neu pinnen, Balancing-Test bleibt | ja (Liste AK-HF-22)                  |

Kleinpunkte, von lead-design entschieden (keine L0-Entscheide):

- **O-1** Lager voll: kein zweiter Entladeversuch beim Ablegen (ein Versuch je Anlegen wie heute, KISS).
- **O-2** Schiff ohne Route an einer Fremdinsel springt beim Neubau des Kontors II zum neuen Anker: hingenommen (selten,
  keine Spielwirkung).
- **O-3** `dMin`/`dMax` der Kandidatenerzeugung erweitert S2 nur, falls AK-HF-12 verfehlt wird; der Wert folgt aus der
  Messung und kommt als Spielwert-Änderung an lead-design zurück.
- **O-4** Anfahrt des Auftragsschiffs fest 35 Ticks, auch mit Seerecht: Es ist ein fremdes Schiff, der Ratsbeschluss gilt
  für die eigene Flotte.
- **O-5** Ein- und Ausblenden des Auftragsschiffs am Wegende: Dauer legt lead-art fest (Anhang 02 §H), Darstellungswert
  in `src/render/`.
