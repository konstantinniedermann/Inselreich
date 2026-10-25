# Ausbau-Logik der Produktionsbetriebe (Design)

Datum 2026-10-25 · Paket design-ausbau-logik · Meilenstein M14 · Quelle: R896 (3), Dauerauftrag R896 (0)
(Nachvollziehbarkeit). Grundlage: Designvorschlag lead-design mit Nachtrag (verbindlich) und Rechnung
[`2026-10-25-ausbau-logik-rechnung.md`](2026-10-25-ausbau-logik-rechnung.md) (Werte, Standortzahlen, Herleitungen; hier
übernommen, nicht neu gerechnet; Verweise «Rechnung (x)»). Save: `SAVE_VERSION` = main + 1 beim Merge (R908 E4). **Nachtrag Gate Spec (R914): [Anhang 02](2026-10-25-ausbau-logik-design/anhang-02-nachtrag-gate.md) geht dieser Datei vor.**

## Spielerzweck

Der Spieler sieht an jedem Betrieb, warum er aufsteigen kann oder nicht und wie weit er ist, und kann jede Bedingung
aus dem Spielbild erklären: Leute in der Nähe, Platz, Baustoff.

Säule: Produktionsketten. Spürbar im ersten Spiel: Die Ausbau-Karte ist eine Checkliste mit Zahlen statt eines Preises mit
sachfremder Gebühr; ein gedrosselter Betrieb sagt, was ihm fehlt.

## Umfang

- Vier Arten von Bedingungen: Wissen (Freischaltung), Baustoff (einmalig), Fachkräfte und Standort (dauerhaft).
- Gebühr Stoff/Rum entfällt; fachliche Ware nur, wo sie im Spielbild verbaut wird (Stoff beim Fischer, Glas bei Stufe 4
  der Werkstätten).
- Neue Stufe 4 für alle ausbaubaren Betriebe ausser der Jagdhütte; Freischaltung mit den ersten Kaufleuten.
- «Läuft wie Stufe k» bei verletzter Dauerbedingung, mit gedrosseltem Unterhalt (Option B).
- Ausbau-Karte als Checkliste, Zustandschip, Tooltip.
- «Gleiches bauen» und Pipette übernehmen Typ und Stufe.
- Sichtbares Merkmal je Stufe am Gebäude (Vorgabe an lead-art), ersetzt Anbau/Steinsockel/Fahne.

## Nicht im Umfang (später)

- Neues Gut Ziegel und Ziegelei (Stein gilt als Mauerwerk).
- Kapazität der Fachkräfte (ein Haus je n Betriebe); im MVP versorgt ein Haus beliebig viele Betriebe.
- Gelehrte/Wissen als eigene Ressource (I-196).
- Karten-Hervorhebung der störenden Fischer bzw. des Arbeitswegkreises.
- Spezialisierungen je Stufe; Ausbau der Gewürzplantage; Wohnhaus-Grösse (FLAECHE).
- Eigener Render-Effekt für «läuft wie Stufe k» (Boot liegt still, kein Rauch); im MVP nur Panel und Tooltip.
- Abstieg einer gebauten Stufe; Bauzeit für den Ausbau (bleibt sofort).

## Begriffe

- **Gebaute Stufe** `g` = `b.level ?? 1` (gespeichert). **Laufende Stufe** `k` (abgeleitet, nie gespeichert).
- **Bevölkerungsstufe** eines Wohnhauses = `tier` (1 Pioniere, 2 Siedler, 3 Bürger, 4 Kaufleute).
- **Abstand** zwischen Gebäuden = Mittelpunkt-Abstand `distance()` (`coverage.ts`), wie Dienst-Reichweiten.
- **Kacheln im Radius r** = `tilesInRadius` (euklidisch, Mittelpunkt des Grundrisses), eigener Grundriss zählt nicht;
  **frei** = ohne Gebäude und ohne Weg (`countFreeTerrain`, `placement.ts`). Tabelle der Kachelzahlen: Rechnung (c).

## Regeln

### R1 Wissen (global, einmalig freigeschaltet)

| Stufe | Funktion   | Freischaltung                           | Auslöser             |
| ----- | ---------- | --------------------------------------- | -------------------- |
| 2     | `upgrade2` | U3 (bestehend)                          | erstes Siedlerhaus   |
| 3     | `upgrade3` | U5 (bestehend)                          | erstes Bürgerhaus    |
| 4     | `upgrade4` | **U7 neu** in `src/sim/defs/unlocks.ts` | erstes Kaufmannshaus |

U7: `trigger: { kind: 'tierReached', tier: 4 }`, `buildings: []`, `goods: []`, `functions: ['upgrade4']`, lockText
«Erst mit den ersten Kaufleuten», whenText «sobald die ersten Kaufleute einziehen», notice «die ersten Kaufleute sind
da», tip «Kaufleute bringen Verleger: Betriebe lassen sich auf Stufe 4 ausbauen. Werkstätten brauchen Glas für die
Fenster.» `UNLOCK_CHAIN` endet mit `'U7'`; `FUNCTION_LABELS.upgrade4 = ['Ausbau Stufe 4']`; `UnlockId` und
`UnlockFunction` (`types.ts`) erweitert. Kaufleute sind `requiresWin`: Stufe 4 ist Spielinhalt nach dem ersten Ziel.
Neue Tipptexte: U3 «… Betriebe lassen sich jetzt ausbauen: Geld, Holz und Werkzeug, dazu Siedler im Arbeitsweg.»
(ersetzt «gegen Stoff ausbauen»); U5 «… Ausbau Stufe 3 ist Steinbau: Stein und Bürger im Arbeitsweg; Brennerei,
Glashütte und Werkzeugmacher brauchen eine Feuerwache.» (ersetzt «kostet Rum»).

### R2 Baustoff (einmalig beim Ausbau)

- Kosten je Typ und Stufe: Rechnung (a), übernommen in die Typ-Tabellen (Anhang 01). Stufe 2 = Anbau (Holz, Werkzeug), Stufe 3 =
  Steinbau (jeder Betrieb Stein), Stufe 4 = Manufaktur (Werkstätten Glas). Der Wert der weggefallenen Gebühr geht 1 : 1 ins
  Geld (Wert-Äquivalent W bleibt), Brennerei Stufe 2 +50 und Glashütte Stufe 2 +100 Geld gegen Dominanz (E2).
- **Rum ist nirgends Ausbauware** (E7). Fachliche Ware nur: Fischer Stoff 2 / 2 / 3 (Netz, Segel, grosses Segel); Weberei
  und Werkzeugmacher Stufe 4 Glas 3; Brennerei und Glashütte Stufe 4 Glas 4.
- Bezahlt wird aus Kasse und Lager der Insel des Betriebs (wie heute `checkAfford`/`pay`). Abriss erstattet die Hälfte von
  Geld/Holz/Werkzeug/Stein aller Stufen (`paidCost`), die fachliche Ware nicht (wie heute die Gebühr).

### R3 Fachkräfte (dauerhaft)

Stufe n braucht ein Wohnhaus **derselben Insel** mit `tier ≥ workforceTier(n)` und `distance(Haus, Betrieb) ≤
WORKFORCE_RADIUS` (8, Rechnung (d)). `workforceTier` = 2 / 3 / 4 für Stufe 2 / 3 / 4 (Siedler = Gesellen, Bürger =
Meister, Kaufleute = Verleger). Keine Kapazität. Jedes stehende Wohnhaus zählt, auch brennend (die Leute wohnen dort);
Kontor, Markt und andere Gebäude zählen nicht (R908 E3, strikt). Arbeitsweg 8 > Lärm I-128 (3): Ring 3 < d ≤ 8 bleibt
für ruhige Fachkräfte-Häuser.

### R4 Standort (dauerhaft, je Typ und Stufe)

Werte aus Rechnung (c); jede Stufe prüft ihre eigene Regel. Die Bauregel der Stufe 1 (`site`) gilt unverändert weiter.

| Typ                                  | Stufe 2                 | Stufe 3                 | Stufe 4               |
| ------------------------------------ | ----------------------- | ----------------------- | --------------------- |
| Fischerhütte                         | ≤ 1 andere F. mit d ≤ 2 | ≤ 1 andere F. mit d ≤ 3 | 0 andere F. mit d ≤ 3 |
| Holzfäller                           | freier Wald r 2 ≥ 4     | ≥ 6                     | ≥ 8                   |
| Jagdhütte                            | freier Wald r 3 ≥ 14    | ≥ 18                    | —                     |
| Steinbruch                           | Gebirge r 2 ≥ 3         | ≥ 4                     | ≥ 6                   |
| Schäferei, Zuckerrohrplantage        | freies Gras r 3 ≥ 8     | ≥ 12                    | ≥ 16                  |
| Rinderfarm                           | freies Gras r 3 ≥ 18    | ≥ 20                    | ≥ 22                  |
| Brennerei, Glashütte, Werkzeugmacher | —                       | Feuerwache              | Feuerwache            |
| Weberei                              | —                       | —                       | —                     |

- **Fischer** zählt alle anderen Fischerhütten derselben Insel, jeder gebauten Stufe (auch Stufe 1, auch stillgelegte).
- **Wald, Gras, Gebirge** zählen nicht exklusiv: Nachbarbetriebe derselben Art verdrängen sich nicht. Gebirge muss nicht frei
  sein (ist nie bebaubar).
- **Feuerwache:** gleiche Abdeckung wie der bestehende Brandschutz der Feuerwache (eine Funktion, kein zweiter Massstab;
  Reichweite `BUILDING_DEFS.firestation.serviceRadius` = 8). Bei `world.crisisLevel === 'off'` entfällt die Bedingung
  (keine Brände, Feuerwache nicht in der Bauleiste, `ONLY_WITH_CRISES`; E8).
- Die Regeln sind **monoton**: Stufe n+1 ist mindestens so streng wie n (gleiche Art, Mindestzahl ≥, Höchstzahl ≤, Radius
  ≥). Darum hat k keine Lücken.

### R5 Laufende Stufe k

- `k = max { j ∈ 1 … g : Fachkräfte(j) und Standort(j) erfüllt }`; Stufe 1 ist immer erfüllt, also `k ≥ 1`.
- k wirkt auf den **Zyklus**: `cycleOf` liest `LEVELS[defId][k − 2].cycle` (k = 1: Grundtakt), danach wie heute
  `effectiveCycle` (Rat R711 anteilig, Inselvorteil) und Erntefest I-201 auf das Ergebnis. Auslastung, `progress`, `eff`,
  `state` bleiben; Gründe «kein Fortschritt» (`noForest`, `noService` usw.) gelten unverändert vor k.
- **Kein Abstieg:** `b.level` ändert sich nie durch k; stimmt die Bedingung wieder, läuft der Betrieb wieder mit g.
- k ist eine reine, deterministische Funktion des Welt-Zustands (Gebäude, Kacheln, `tier`, `crisisLevel`), ohne RNG und
  ohne Feld im Save. Neuberechnung: **spätestens nach `LEVEL_RECHECK_TICKS` Ticks** (Vorschlag 10 in
  `src/sim/defs/levels.ts`) nach jeder Änderung, die k ändert. Tech wählt Takt, Ereignis oder Berechnung beim Lesen
  (letzteres erfüllt N = 1); Bedingung: Laden eines Stands liefert im ersten Tick dasselbe k wie der durchgelaufene Lauf
  (AK-AL-15). Ein Zwischenspeicher liegt ausserhalb von `world` oder wird nicht serialisiert.
- Abfrage für UI und Tests (Vorschlag `src/sim/levelRules.ts`): `runningLevel(world, b): number` und
  `levelChecks(world, b, level): LevelCheck[]` mit `{ id, ok, have, need, text }`, Zeilen in der Ordnung von R7 (Anhang 02
  N3: Wissen, Brand, Fachkräfte, Standort, Geld, Holz, Werkzeug, Stein, Ware). UI rendert nur (DRY).
- **k-Wechsel mitten im Zyklus:** `progress` bleibt; ist `progress ≥` neuer Zyklus, gibt der nächste Schritt genau 1 Einheit
  und setzt `progress` 0, kein Übertrag (Anhang 02 N4, AK-AL-44).

### R6 Unterhalt

Reihenfolge in `buildingUpkeep`, erster Treffer gilt, **nicht gestapelt**:

1. **Stillgelegt** (`paused`): `ceil(upkeep(g) × PAUSED_UPKEEP_PCT / 100)` wie heute; k spielt keine Rolle.
2. **Gedrosselt** (k < g): `upkeep(k) + ceil((upkeep(g) − upkeep(k)) × THROTTLED_UPKEEP_PCT / 100)`, neue Konstante
   `THROTTLED_UPKEEP_PCT = 50` in `src/sim/defs/buildings.ts` neben `PAUSED_UPKEEP_PCT` (E5, Option B). Bild: «Das grosse
   Boot liegt im Hafen und kostet halb.» Beispiele (Rechnung (d)): Fischer 3 → k 1: 7; Brennerei 3 → k 2: 30; Glashütte 4 →
   k 2: 44.
3. Sonst `upkeep(g)`.

### R7 Ausbau (`upgradeBuilding`)

Prüfreihenfolge, erster Treffer gewinnt, bei `fail` bleibt die Welt unverändert (`JSON.stringify` gleich):

1. «Gebäude nicht gefunden».
2. «Kann nicht ausgebaut werden» (kein `LEVELS`-Eintrag).
3. «Höchste Stufe erreicht» (`g = 1 + LEVELS[defId].length`: Jagdhütte 3, sonst 4).
4. Freischaltung der Zielstufe (`functionLock`, lockText).
5. «Gebäude brennt».
6. Erste verletzte Dauerbedingung der Zielstufe, Fachkräfte vor Standort (z. B. «Keine Meister im Umkreis 8 (Bürgerhaus
   nötig, nächstes 11 Felder)»).
7. Geld, Holz, Werkzeug, Stein («Zu wenig Stein (0 / 2)»; Schritte 4–8 liefern den ✗-Text aus `levelChecks`, Anhang 02 N3).
8. Fachliche Ware «Zu wenig Stoff (1 / 2)».
9. Erfolg: `pay` + `takeStock`, `b.level = g + 1`, `progress`/`eff`/`state` bleiben.

Ein Betrieb mit k < g kann weiter ausbauen, sobald die Bedingungen der Zielstufe stimmen (Monotonie: dann auch alle
darunter).

### R8 «Gleiches bauen» und Pipette mit Stufe (Entscheid lead-design)

- Das Bauwerkzeug trägt Typ **und** Stufe des Quellgebäudes: `Tool { kind: 'build', defId, level?: 2 | 3 | 4 }`
  (`level` fehlt = Stufe 1). Anzeige «Fischerhütte · Stufe 3». Stufe 1 gibt es über die Bauleiste; Kontore bleiben nicht
  nachbaubar (`PIPETTE_KONTOR_TEXT`).
- Sim: `placeBuilding(world, defId, x, y, island, level?)`. Prüfreihenfolge: Bauregel (`canPlace`) → Freischaltung der
  Stufe → Dauerbedingungen der Stufe **am Zielort** (als stünde der Betrieb dort; er zählt sich selbst nicht als anderen
  Fischer) → Geld/Baustoffe als **Summe** Neubau + alle Stufenkosten bis `level` → Summe der fachlichen Waren → Erfolg
  (atomar: alles abbuchen, `b.level = level`). Bei `fail`: Welt unverändert, Vorschau rot mit erstem Grund, **kein Bau und
  kein stiller Rückfall** auf eine kleinere Stufe.
- Begründung: reine Klick-Ersparnis ohne Rabatt (kein dominanter Weg), ohne Aufschlag (Komfort), ohne stilles Geldausgeben
  für eine andere Stufe als gewählt (erklärbar). Abriss wie R2.
- Ist die Stufe des Quellgebäudes noch gesperrt (z. B. Pipette auf einen geladenen Stand), liefert `pipetteResult` den
  lockText der Stufe; das Werkzeug wird nicht gesetzt.

### R9 Anzeige (Panel, Chip, Tooltip)

**Ausbau-Karte** «Ausbau auf Stufe n» als Checkliste, je Zeile ✓/✗, Ist und Soll (Texte aus `levelChecks`):

```text
Ausbau auf Stufe 3 — Fischerhütte
✓ Wissen: Ausbau Stufe 3 bekannt (erste Bürger)
✓ Meister im Umkreis 8: Bürgerhaus, nächstes 6 Felder
✗ Fischgrund überfischt: 2 andere Fischerhütten im Umkreis 3 (erlaubt 1)
✓ Geld 65 (Kasse 812)
✓ Holz 4 (Lager 23)
✓ Werkzeug 2 (Lager 5)
✗ Zu wenig Stein (0 / 2)
✓ Stoff 2 (Lager 14) — Segel
```

Alle Zeilentexte: Anhang 02 N5 (z. B. «Keine Handwerker im Umkreis 8 (kein Siedlerhaus auf dieser Insel)», «Zu wenig
Wald: 3 freie Waldfelder im Umkreis 2 (nötig 4)», «Keine Feuerwache in Reichweite 8 (Brennofen)»). Abstand angezeigt als
`ceil(distance)`; damit gilt ✓ ⇔ angezeigte Zahl ≤ 8. Knopf «Ausbauen» nur aktiv, wenn alle Zeilen ✓; der Tooltip des
gesperrten Knopfs ist der Text der ersten ✗-Zeile = `reason` von `upgradeBuilding` (AK-AL-37). Höchste Stufe: keine
Checkliste, nur «Höchste Stufe erreicht».

**Zustandschip** bei k < g: «Läuft wie Stufe k: <erster verletzter Grund der Stufe k + 1>», z. B. «Läuft wie Stufe 2: Keine
Meister im Umkreis 8 (Bürgerhaus nötig, nächstes 11 Felder)», «Läuft wie Stufe 2: Keine Feuerwache in Reichweite 8 (Brennofen)».
Tooltip des Chips: alle verletzten Bedingungen aller Stufen k + 1 … g und der Unterhalt «Unterhalt 7 statt 9 (gedrosselt)».
Bei `paused` oder brennend kein Chip (Stilllegung geht vor, R6).

## Tabellen je Gebäudetyp

Je Gebäudetyp (11) eine Tabelle «Stufe → Bedingung (Baustoff │ Fachkräfte │ Standort) → Begründung im Spielbild →
sichtbares Merkmal»: [Anhang 01](2026-10-25-ausbau-logik-design/anhang-01-typtabellen.md). Der Anhang ist verbindlicher
Teil der Spec; Kosten, c und u aus Rechnung (a), Standort aus R4, Merkmal aus dem Nachtrag lead-design. Beispiel
Fischerhütte Stufe 3: 65 Geld, 4 Holz, 2 Werkzeug, 2 Stein, Stoff 2 │ Bürgerhaus ≤ 8 │ ≤ 1 andere Fischerhütte mit d ≤ 3 →
«Boot mit Segel fährt weiter hinaus, braucht Steg und Meister» → kleines Segelboot am Steinsteg.

## Vorgabe an lead-art

Ersetzt `drawLevelTopper` (Anbau vorn links, Steinsockel, Fahne) in `src/render/sprites.ts`; liest weiter nur `b.level`
(gebaute Stufe g, nicht k).

1. Jede Stufe fügt **ein** Element hinzu, das zeigt, was besser wurde; das Element der Vorstufe bleibt (Stufe 4 zeigt drei
   Elemente). Keine Fahne.
2. Stufe 3 zeigt zusätzlich Stein (Sockel, Kai, Schornstein), weil Stufe 3 Steinbau ist; Stufe 4 der Werkstätten zeigt
   Glasfenster, weil Glas verbaut ist.
3. Merkmale je Typ und Stufe: Spalte «Merkmal» der Typ-Tabellen (Anhang 01; 11 Typen, 32 Merkmale). Fischer: Stufe 3
   kleines Segelboot am Steinsteg (Segel = verbauter Stoff), Stufe 4 grosses Segelboot am Kai; Bootgrösse unterscheidet
   die Stufen.
4. Aufsätze mit festem Ankerpunkt je Typ, innerhalb der Gebäudehülle; drehen mit dem Gebäude (GEBAEUDE-VARIANZ, 90°) und
   gelten auf jeder Formvariante.
5. «Läuft wie Stufe k»: Merkmal bleibt sichtbar (gebaut ist gebaut); kein eigener Render-Effekt im MVP.
6. Auf Standardzoom unterscheidbar: Stufe 1 … 4 eines Typs im Browser-Check ohne Panel erkennbar (AK-AL-31).

## Datenmodell (Vorschlag für `src/sim/defs/`)

`src/sim/defs/levels.ts`:

```ts
export type LevelSite =
  | { kind: 'fisherSpacing'; radius: number; maxOthers: number }
  | { kind: 'freeTerrain'; terrain: 'forest' | 'grass'; radius: number; min: number }
  | { kind: 'terrainNear'; terrain: 'mountain'; radius: number; min: number }
  | { kind: 'fireStation' };
export interface LevelDef {
  cycle: number;
  upkeep: number;
  cost: Cost; // Geld, Holz, Werkzeug, Stein, halbe Erstattung
  extra?: { good: GoodId; amount: number }; // fachliche Ware, nicht erstattet (ersetzt `fee`)
  workforceTier: Tier; // 2 | 3 | 4
  site?: LevelSite;
}
export const LEVELS: Readonly<Partial<Record<BuildingDefId, readonly LevelDef[]>>>; // Jagdhütte 2, sonst 3 Einträge
export const WORKFORCE_RADIUS = 8;
export const LEVEL_RECHECK_TICKS = 10;
```

`src/sim/defs/buildings.ts`: `THROTTLED_UPKEEP_PCT = 50`. `src/sim/defs/unlocks.ts`: Eintrag U7, Texte U3/U5, Label
`upgrade4`. Keine Zahl dieser Spec steht im Code (AK-AL-46). Welt-Zustand: kein neues Feld; `b.level` erlaubt neu 4,
`world.unlocked` neu `'U7'`; das Werkzeug `Tool.level` ist UI-Zustand, nicht im Save.

## Randfälle

| Fall                                              | Verhalten                                                            | AK       |
| ------------------------------------------------- | -------------------------------------------------------------------- | -------- |
| Abriss oder Abstieg des letzten Fachkräfte-Hauses | k sinkt spätestens nach `LEVEL_RECHECK_TICKS`; Chip nennt den Grund  | AK-AL-16 |
| neue Fischerhütte neben einer Stufe-3-Hütte       | Bau erlaubt (Stufe-1-Regel); die Stufe-3-Hütte prüft neu, k sinkt    | AK-AL-17 |
| brennender Betrieb                                | kein Ausbau («Gebäude brennt»), k unverändert abgeleitet             | AK-AL-18 |
| stillgelegter Betrieb                             | Unterhalt halb nach g, kein Drossel-Unterhalt, kein Chip             | AK-AL-13 |
| alter Stand: Stufe 3 im Fischer-Cluster           | lädt, läuft wie k mit Grund, kein Fehler                             | AK-AL-35 |
| Stufe 4 vor den ersten Kaufleuten                 | gesperrt mit lockText U7                                             | AK-AL-19 |
| Insel ohne Wohnhäuser (Kolonie)                   | kein Ausbau, Grund «kein Siedlerhaus auf dieser Insel» (E3)          | AK-AL-21 |
| Haus im Abstand ≤ 8 auf anderer Insel             | zählt nicht                                                          | AK-AL-06 |
| Krisen aus                                        | Feuerwache-Bedingung entfällt (E8)                                   | AK-AL-09 |
| Ausbau bei k < g                                  | erlaubt, wenn alle Bedingungen der Zielstufe stimmen                 | AK-AL-04 |
| Gleiches bauen am ungeeigneten Ort                | rote Vorschau mit Grund, kein Bau, kein Rückfall                     | AK-AL-26 |
| Gleiches bauen: Geld da, Glas fehlt               | `fail`, nichts abgebucht                                             | AK-AL-27 |
| Jagdhütte Stufe 3 ausbauen                        | «Höchste Stufe erreicht»                                             | AK-AL-19 |
| k wechselt mitten im Zyklus                       | `progress` bleibt, höchstens 1 Einheit, kein Übertrag (Anhang 02 N4) | AK-AL-44 |
| `crisisLevel` wechselt im Lauf                    | Feuerwache-Bedingung neu, k folgt nach N Ticks                       | AK-AL-45 |

## Abnahmekriterien

Vitest (DOM-frei), Aufbau, wo nicht anders genannt: feste Welt aus `createWorld(seed, { unlockAll: true, crisisLevel:
'off' })` (für Feuerwache `'normal'`), Heimatinsel mit Kontor, Terrain und Wohnhäuser (`tier`) per Hand gesetzt, Geld und
Lager ausreichend. Neue AK ab AK-AL-35 und Schnitt-Zuordnung: Anhang 02. Neue Dateien: `tests/sim/levelRules.test.ts`, `tests/sim/placeLevel.test.ts`,
`tests/ui/levelChecklist.test.ts`; bestehend angepasst: `tests/sim/upgrade.test.ts`, `levels.test.ts`, `save.test.ts`,
`unlock-timeline.test.ts`, `tests/ui/pipette.test.ts`, `tests/render/` (Aufsatz, `fakeCtx`).

- **AK-AL-01 Werte aus Rechnung** (`levelRules.test.ts`): `LEVELS` je Typ gleich den Typ-Tabellen in Anhang 01 (c, u, cost, extra,
  workforceTier, site); Länge 2 bei `hunter`, 3 bei den übrigen zehn; kein `extra.good === 'rum'`; `extra` nur bei `fisher`
  (cloth 2/2/3) und Stufe 4 von `weaver`/`toolmaker` (glass 3), `distillery`/`glassworks` (glass 4); kein Feld `fee`.
- **AK-AL-02 Stufe 2/3 Takt und Unterhalt unverändert:** c und u der Stufen 2 und 3 aller Typen gleich dem Stand vor der
  Änderung (Liste im Test); I-201 AK-FE7 bleibt grün.
- **AK-AL-03 Monotonie:** je Typ ist `site` der Stufe n+1 von gleicher Art und mindestens so streng; `workforceTier` = Stufe.
- **AK-AL-04 Ausbau-Prüfreihenfolge** (`upgrade.test.ts`): je Schritt von R7 eine Welt, in der genau dieser Schritt als
  erster scheitert → erwarteter Text, `JSON.stringify(world)` unverändert. Betrieb mit g = 3, k = 2 und erfüllten Bedingungen
  der Stufe 4 → `ok`.
- **AK-AL-05 Ausbau bucht genau:** Fischer 2 → 3 bucht 65 Geld, 4 Holz, 2 Wz, 2 Stein, 2 Stoff ab, sonst nichts;
  `level` 3; `progress`, `eff`, `state` unverändert. Rum-Bestand bleibt bei jedem Ausbau jedes Typs gleich.
- **AK-AL-06 Fachkräfte:** Fischer g = 2: Siedlerhaus im Abstand 8,0 → k 2; Abstand √65 ≈ 8,06 → k 1; Pionierhaus im
  Abstand 3 → k 1; Bürgerhaus im Abstand 5 → k 2; Siedlerhaus im Abstand 4 auf einer zweiten Insel (`twoIslandWorld`) → k 1;
  brennendes Siedlerhaus im Abstand 5 → k 2. Ergänzt durch AK-AL-47 (2 × 2-Grundriss).
- **AK-AL-07 Fischgrund:** gerade Küste: Hütte A g = 2 mit einer anderen Hütte im Abstand 2 → k 2, mit zwei → k 1;
  A g = 3 mit einer anderen in Abstand 3 → k 3, zweite in Abstand 3 → k 2 (Stufe-2-Regel d ≤ 2 hält, wenn beide in
  Abstand 3); A g = 4 mit einer anderen in Abstand 3 → k 3. Hütten anderer Insel zählen nicht; Stufe-1-Hütten und
  stillgelegte zählen.
- **AK-AL-08 Wald, Gras, Gebirge:** Holzfäller g = 3 mit genau 6 freien Waldkacheln in r 2 → k 3; ein Weg auf einer davon →
  5 frei, k 2; zwei weitere bebaut → 3 frei, k 1. Steinbruch an gerader Gebirgskante (4 in r 2) → k 3, Ecke (7)
  mit g = 4 → k 4. Schäferei g = 2 mit 8 freien Graskacheln in r 3 → k 2, eine bebaut → k 1. Zwei Holzfäller teilen dieselben
  Waldkacheln, beide behalten k (nicht exklusiv).
- **AK-AL-09 Feuerwache:** `crisisLevel: 'normal'`: Brennerei g = 3 ohne Feuerwache → k 2; mit Feuerwache in Abdeckung →
  k 3; Feuerwache abgerissen → k 2. Gleiche Welt mit `'off'` ohne Feuerwache → k 3. Weberei g = 4 ohne Feuerwache → k 4.
- **AK-AL-10 Zyklus folgt k:** `cycleOf` = c(k) für k = 1 … 4 an einem Typ mit Stufe 4 (Fischer 40 / 24 / 16 / 12 ohne
  Vorteil); `b.level` bleibt g.
- **AK-AL-11 k mit Inselvorteil, Rat, Erntefest:** Glashütte g = 4, k = 2 auf Glas-Vorteilsinsel → `cycleOf` =
  `effectiveCycle(…, 30)`; mit Rat anteilig (R711) und aktivem Erntefest nach I-201 Regel 6 auf dieses Ergebnis.
- **AK-AL-12 Drossel-Unterhalt:** `buildingUpkeep` = 7 (Fischer g 3, k 1), 30 (Brennerei g 3, k 2), 44 (Glashütte g 4,
  k 2); bei k = g = 9 / 34 / 55.
- **AK-AL-13 Pause vor Drossel:** Fischer g 3, k 1, `paused` → `ceil(9 × 50 / 100)` = 5, nicht 4 oder 7; kein Chip
  (`levelChipText` liefert `null`).
- **AK-AL-14 Neuberechnung spätestens nach N:** letztes Bürgerhaus bei Tick t abgerissen → spätestens ab Tick t +
  `LEVEL_RECHECK_TICKS` ist `runningLevel` 2; neues Bürgerhaus → spätestens nach N wieder 3. Test liest N aus den Defs.
- **AK-AL-15 Determinismus k:** zwei gleiche Welten (gleicher Seed, gleiche Aktionen inkl. Abriss eines Fachkräfte-Hauses,
  1 800 Ticks) → gleiches `serialize`. Lauf mit `serialize` → `deserialize` nach 300 Ticks, weitere 900 Ticks → gleiches
  `serialize` und in jedem Tick gleiches `runningLevel` je Betrieb wie der durchgelaufene Lauf. Der serialisierte Betrieb hat
  dieselben Schlüssel wie vor der Änderung (kein k-Feld).
- **AK-AL-16 Letztes Fachkräfte-Haus:** Abriss und alternativ Abstieg (`tier` 3 → 2) des einzigen Bürgerhauses im
  Arbeitsweg → k von 3 auf 2 (Regel AK-AL-14), Chiptext «Läuft wie Stufe 2: Keine Meister im Umkreis 8 …»; `level` 3.
- **AK-AL-17 Neuer Nachbar-Fischer:** neben Hütte A (g 3, k 3) wird Hütte B (Stufe 1) im Abstand 2 und C im Abstand 3
  gebaut → beide `ok`; A k 2 (zwei andere in d ≤ 3); B k 1 ohne Chip. Abriss von C → A k 3.
- **AK-AL-18 Brand:** brennender Betrieb → `upgradeBuilding` «Gebäude brennt», Welt unverändert.
- **AK-AL-19 Stufe 4 und Höchststufe:** ohne Kaufmannshaus (`unlockAll` aus, U5 erreicht) → Ausbau 3 → 4 mit lockText U7;
  nach erstem Haus `tier` 4 → `ok`. Jagdhütte g 3 → «Höchste Stufe erreicht»; Fischer g 4 → dasselbe.
- **AK-AL-20 Freischaltung U7 und Texte** (`unlock-timeline.test.ts`): U7 wird nach U6 frei, sobald ein Haus `tier` 4
  steht, mit Meldung «die ersten Kaufleute sind da»; `UNLOCK_CHAIN` endet mit U7; `unlockAll` enthält U7. Tipps U3/U5
  enthalten weder «gegen Stoff» noch «kostet Rum».
- **AK-AL-21 Insel ohne Häuser:** Steinbruch auf Kolonie ohne Wohnhaus → Ausbau `fail` «Keine Handwerker im Umkreis 8
  (kein Siedlerhaus auf dieser Insel)»; ein Kontor auf der Insel ändert nichts (R908 E3).
- **AK-AL-22** — ersetzt durch AK-AL-35 (Anhang 02).
- **AK-AL-23** — ersetzt durch AK-AL-36 (Anhang 02).
- **AK-AL-24 Checkliste aus der Sim:** `levelChecks(world, b, 3)` am Fischer-Beispiel aus R9 liefert die Einträge in der
  Reihenfolge von R7 (Anhang 02 N3) mit `ok`, `have`, `need`; der Text der Fachkräfte-Zeile nennt `ceil(distance)`; für jede Zeile gilt
  `ok` ⇔ Ausbau scheitert nicht an diesem Schritt (Vergleich mit `upgradeBuilding`); erster Grund: AK-AL-37.
- **AK-AL-25 Gleiches bauen kostet die Summe** (`placeLevel.test.ts`): `placeBuilding(w, 'fisher', x, y, HOME, 3)` bucht
  Neubau + Stufe 2 + Stufe 3 (Geld, Holz, Wz, Stein) und Stoff 4 ab; `level` 3; Kasse, Lager und `paidCost` gleich wie
  nach Bau + zwei Ausbauten. Abriss erstattet die Hälfte von `paidCost`, keinen Stoff.
- **AK-AL-26 Kein Rückfall:** Ziel ohne Bürgerhaus im Arbeitsweg → `fail` mit Fachkräfte-Grund, Welt unverändert, kein
  Gebäude Stufe 1 oder 2 entsteht. Ziel neben zwei Fischern → Fischgrund-Grund. Ungültige Bauregel → Grund von `canPlace`.
- **AK-AL-27 Atomar:** Geld und Baustoffe reichen, Glas 2 von 3 (Weberei Stufe 4) → «Zu wenig Glas (2 / 3)», nichts
  abgebucht.
- **AK-AL-28 Pipette und Knopf** (`pipette.test.ts`): Quelle Fischer g 3 → `{ kind: 'build', defId: 'fisher', level: 3 }`,
  Werkzeugname «Fischerhütte · Stufe 3»; Quelle Stufe 1 → ohne `level`; Kontor → `PIPETTE_KONTOR_TEXT`; Quelle g 4 bei
  gesperrtem `upgrade4` → `ok: false` mit lockText U7. Bauleiste setzt immer Stufe 1.
- **AK-AL-29 Browser-Check Panel** (Szene S1, ergänzt um S2/S3, Anhang 02 N7): Fischer Stufe 2 mit Nachbar im Abstand 2 und 3 öffnen: Karte «Ausbau auf Stufe 3» zeigt
  die Zeilen aus R9 mit ✓/✗ und Zahlen, Knopf gesperrt mit Fischgrund-Tooltip; nach Abriss des Nachbarn ✓ und Knopf aktiv.
  Bürgerhaus abreissen: Chip «Läuft wie Stufe …» mit Grund, Tooltip «Unterhalt 6 statt 7 (gedrosselt)» (g 2 → k 1). Screenshot.
- **AK-AL-30 Browser-Check Gleiches bauen** (Szene S4): Knopf «Gleiches bauen» an Fischer Stufe 3 → Werkzeug «Fischerhütte · Stufe
  3»; Vorschau grün an geeigneter Küste, rot mit Grund neben zwei Fischern; Klick dort baut nichts. `Cmd/Strg`+Klick gleich.
- **AK-AL-31 Merkmale** (`tests/render/`, `fakeCtx`): Aufsatz je Typ zeichnet für Stufe n alle Zeichenbefehle der Stufe
  n − 1 und weitere (Präfix-Eigenschaft); Stufe 3 enthält keine Fahne mehr; Stufe 1 zeichnet nichts. Browser-Check:
  11 Typen × Stufen 1 … 4 nebeneinander, je Stufe unterscheidbar, in jeder Drehung der GEBAEUDE-VARIANZ. Screenshot an lead-art.
- **AK-AL-32 Balancing** (geteilt in 32a/32b, Anhang 02 N2): `tests/sim/balance.test.ts` und Baseline unverändert grün (Rechnung (g)). `balance-upgrade.test.ts`
  liest `extra` statt `fee`; der Pin M-15 wird nach AL-2 neu gemessen und nur per Ruling geändert (E9).
- **AK-AL-33** — ersetzt durch AK-AL-46 (Anhang 02).
- **AK-AL-34 Doku:** `rg -n "gegen Stoff|kostet Rum" README.md docs/spielwerte.md src/sim/defs/unlocks.ts` ohne Treffer;
  `docs/spielwerte.md` Abschnitt «Ausbau» nennt die vier Bedingungsarten und Stufe 4.

## Save-Wirkung und Migration

- Kein neues gespeichertes Feld; k ist abgeleitet. Neu gültig: `level` 4 bei Typen mit drei `LEVELS`-Einträgen
  (`save.ts:577` prüft `2 ≤ level ≤ 1 + LEVELS[defId].length`), `'U7'` in `world.unlocked`.
- **R908 E4:** `SAVE_VERSION` = Wert auf main + 1 beim Merge von AL-4, keine feste Zahl. Der Vorgängerstand
  (`SAVE_VERSION − 1`) wird entweder über einen Schritt geladen, der nur `version` erhöht (Test belegt Laden und k mit
  Grund), oder mit Hinweis abgewiesen (Test); der Plan wählt und legt die Merge-Reihenfolge der Save-Kette fest (Anhang 02
  N1, AK-AL-35). Neuere und kaputte Stände: abgewiesen mit Hinweis, nie ein Absturz (AK-AL-36).
- Steht in einem geladenen Vorgängerstand schon ein Kaufmannshaus, wird U7 beim nächsten Freischalt-Check frei (einmal
  Meldung). `docs/arc42.md` (Persistenz) im Schnitt AL-4 mitführen.

## Balancing-Test

Keine bewusste Änderung an `tests/sim/balance.test.ts` nötig. Beleg Rechnung (g): `balance.test.ts` und der Controller
bauen nie aus; Stufe-1-Regeln und Grundwerte bleiben, die Fischer-Abstandsregel gilt erst ab Stufe 2. **Ergänzung zur
Rechnung:** `tests/sim/balance-upgrade.test.ts` (M11B AK-M11B-01) baut Fischer auf Stufe 2 aus und pinnt M-15 (`winTick` 8250,
11 Fischer Stufe 2). Die Werte der Fischer-Stufe 2 bleiben gleich (AL-1 ändert dort nur `fee` → `extra`), aber ab AL-2
gelten Fachkräfte und Fischgrund; liegen die Controller-Fischer dichter als erlaubt, sinkt die Zahl der Ausbauten. Neu
messen, Pin per Ruling (E9).

## Schnitte (je ≤ 1 Session)

Verbindlich ist die Schnitt-Tabelle in Anhang 02 N2 (R914): AL-1 → AL-2a (`levelRules` als reine Abfrage) → AL-2b (k wirkt,
Ausbau verlangt Bedingungen, Messungen) → AL-3 (UI); AL-4 (Stufe 4, Save) nach AL-2b; AL-5 nach AL-4; AL-6a
(Rohstoffbetriebe) und AL-6b (Werkstätten) parallel ab AL-1, Stufe 4 nach AL-4. Stufe-4-Teile eines AK liegen in AL-4.
Voraussetzungen: I-201 auf main (I-201 AK-FE7, Erntefest-Teil von AK-AL-11), FLAECHE (Weidezahlen vor AL-2a),
GEBAEUDE-VARIANZ (Drehung in AK-AL-31), Zukaufpreis (AK-AL-49), Save-Kette (AK-AL-35).

## Abgrenzung

- **FLAECHE (R896 (5)):** zeichnet Weide/Fläche und ändert die Wohnhaus-Grösse. AUSBAU-LOGIK liefert je Stufe nur die
  Flächenzahlen (Gras, Wald) als Daten in `defs/levels.ts`. Zeichnet FLAECHE eine andere Fläche, gelten die Anteile der
  Rechnung (c) (Schaf/Rohr 29 / 43 / 57 %, Rind 64 / 71 / 79 % von r 3); Abstimmung über Handoff.
- **GEBAEUDE-VARIANZ (R896 (4)):** Formvarianten und Drehung. Stufenmerkmale sind Aufsätze mit festem Ankerpunkt und
  gelten auf jeder Variante.
- **I-201 Festanlass:** Erntefest wirkt in `cycleOf` auf den Zyklus der laufenden Stufe k. Stufe-3-Zyklen unverändert,
  I-201 AK-FE7 (c = 20 → 15) bleibt.
- **I-128 Lärm:** Arbeitsweg 8 > Lärm 3; der Ring 3 < d ≤ 8 bleibt.
- **Rat R711:** anteiliger Stufentakt gilt auch für Stufe 4 und für k (über `effectiveCycle`).

## Entscheidungsbedarf L0 (Ruling-Entwürfe)

Stand R908: E1–E3 und E5–E9 angenommen (E3 strikt, ohne Kontor-Ersatz); E4 geändert (main + 1, Abschnitt Save).

- **E1** Gebühr → fachliche Ware, Rest kostenneutral ins Geld (W gleich). Empfehlung: annehmen — hält die Wahl Breite gegen
  Tiefe stabil (Rechnung (e)).
- **E2** Brennerei Stufe 2 Geld 265 (+50), Glashütte Stufe 2 Geld 340 (+100). Empfehlung: annehmen — sonst dominiert der
  Ausbau den Neubau (M < 0).
- **E3** Fachkräfte auch auf fernen Inseln Pflicht (Kolonie ohne Häuser baut nicht aus). Empfehlung: «Pflicht überall» —
  eine Regel für alle Inseln, fachlich «keine Meister vor Ort». Alternative: Kontor im Arbeitsweg zählt als
  Stufe-2-Fachkraft (Stufe 3/4 weiter mit Häusern).
- **E4** (geändert durch R908, Errata Plan R924) `SAVE_VERSION` = main + 1 beim Merge von AL-4, keine feste Zahl;
  Vorgängerstand ladbar über einen reinen Versionsschritt (Plan: Variante A, Anhang 02 N1, AK-AL-35).
- **E5** Unterhalt bei «läuft wie k» = Option B mit `THROTTLED_UPKEEP_PCT = 50`. Empfehlung: annehmen — Option A verstärkt
  die Rum-Spirale.
- **E6** «Gleiches bauen» kostet genau Neubau + Summe der Stufenkosten inkl. Ware, kein Rabatt, kein Aufschlag, kein Rückfall
  auf eine kleinere Stufe. Empfehlung: annehmen — Komfort ohne dominanten Weg, jede Abweisung erklärbar.
- **E7** Rum fällt als Ausbauware ganz weg. Empfehlung: annehmen — sachfremd (Nutzerbefund), entschärft den Rum-Engpass der
  Bürgerphase um ≈ 14 % (Rechnung (f)).
- **E8** (neu) Feuerwache-Bedingung entfällt bei Krisen «aus». Empfehlung: annehmen — ohne Brände keine Brandauflage, und
  die Feuerwache steht dann nicht in der Bauleiste; sonst wäre Stufe 3 der drei Werkstätten unerreichbar.
- **E9** (neu) Pin M-15 in `balance-upgrade.test.ts` nach AL-2 neu messen und per Ruling setzen. Empfehlung: annehmen — die
  Variante misst Fischer-Ausbau, der jetzt Fachkräfte und Fischgrund braucht; bewusste Änderung, kein Regressionsfehler.

## Selbstprüfung Nachvollziehbarkeit (R896 (0))

| Bedingung           | Ursache im Spielbild                               | Wirkung im Spielbild                                                          |
| ------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------- |
| Wissen              | erstes Haus Siedler / Bürger / Kaufleute zieht ein | Meldung, Ausbau-Zeile ✓ «Ausbau Stufe n bekannt»                              |
| Baustoff            | Lager und Kasse                                    | Zeile ✓/✗ mit Lagerzahl; Merkmal zeigt das Verbaute (Stein, Glas, Tuch)       |
| Fachkräfte          | Wohnhaus passender Stufe in ≤ 8 Feldern            | Zeile mit Abstand des nächsten Hauses; fällt es weg: Chip «Läuft wie Stufe k» |
| Fischgrund          | andere Fischerhütten in der Nähe                   | Zeile «n andere Fischer im Umkreis r (erlaubt m)»; Nachbar abreissen hebt k   |
| Wald, Gras, Gebirge | freie Kacheln um den Betrieb, Weg oder Bau darauf  | Zeile «n freie Waldfelder im Umkreis r (nötig m)»; Bau darauf senkt k         |
| Feuerwache          | grosser Ofen, Kessel, Esse ab Stufe 3              | Zeile «Feuerwache in Reichweite 8»; ohne sie Chip mit Grund                   |
| Drossel-Unterhalt   | grosser Betrieb steht teilweise still              | Tooltip «Unterhalt 7 statt 9 (gedrosselt)»                                    |
| Gleiches bauen      | Quellgebäude mit Stufe                             | Werkzeugname mit Stufe, Vorschau grün oder rot mit erstem Grund               |

Jede Zeile hat eine Zahl, die der Spieler auf der Karte nachzählen kann; kein Grund ohne sichtbare Ursache.

## Risiken und Stellschrauben

Spirale, Arbeitsweg und Dominanz beruhen auf Rechnung (d)–(f) (analytisch). Stellschrauben `WORKFORCE_RADIUS`,
`THROTTLED_UPKEEP_PCT` und die E2-Aufschläge liegen in den Defs; Rückfall = Wertänderung per Ruling; Messung AK-AL-48 und
AK-AL-49 (Anhang 02 N6).

## Offene Punkte

- Weidezahlen vor AL-2a mit FLAECHE fixieren (Handoff; Rechnung, Annahmen).
- Laufzeit der k-Abfrage (Häuser und Kacheln je Betrieb): Tech wählt Takt/Ereignis/Lesen nach R5 und misst im Plan.
