# I-201 Festanlass (Kurzdesign)

Datum 2026-10-25 · Paket design-I-201 · Meilenstein M14 · Quelle: `docs/ideen.md` I-201, Rechnung
[`2026-10-25-i201-festanlass-rechnung.md`](2026-10-25-i201-festanlass-rechnung.md) (Zahlen, Lagen A–E, Randfälle; hier
übernommen, nicht neu gerechnet). Entscheide R-A, R-B, R-C (Rechnung §8). Kein neuer Save-Stand (`SAVE_VERSION` bleibt).
Nachtrag Gate Spec (lead-qa BEDENKEN B1–B4, `.studio/handoffs/2026-10-25-lead-qa-gate-I-201.md`): Blattmodul
`feastEffect.ts`, Kennungen `AK-FE*` (AK-F* belegt I-136), zwei Seeds, Rangfolge, Lage C2, Rohstoffmass, Randfälle.

## Spielerzweck

An der Kapelle wählt der Spieler alle 3 min zwischen drei Festen: Aufstiegsfest, wenn Häuser steigen sollen, Erntefest,
wenn das Lager Platz hat und die Werkstätten Eingänge haben, Markttag, wenn das Lager voll ist, die Rohstoffe knapp sind
und verkauft werden soll.
Säulen: Bevölkerung versorgen (Aufstieg), Produktionsketten (Ernte), Handel (Markttag). Spürbar im ersten Spiel: drei
Knöpfe mit Preis und eigenem Sperrgrund statt einem Pflichtknopf.

## Regeln

1. **Arten.** Neue Defs-Datei `src/sim/defs/feast.ts` mit `FEAST_KIND_IDS = ['ascension', 'harvest', 'market'] as const`,
   Typ `FeastKind` und `FEAST_KINDS: Record<FeastKind, FeastKindDef>` (Werte unten). `FEAST_DURATION` 600 und
   `FEAST_COOLDOWN` 1800 bleiben in `defs/timing.ts` und gelten für alle Arten.
2. **Fest halten.** `holdFeast(world, id, kind?: FeastKind | string)`; `kind` fehlt → `ascension` (bitgleich zu heute).
   Prüfreihenfolge, erster Treffer gewinnt, bei `fail` bleibt die Welt unverändert:
   1. kein Gebäude oder kein `service: 'faith'` → «Keine Kapelle»;
   2. `kind ∉ FEAST_KIND_IDS` → «Unbekannte Festart»;
   3. allgemeine Sperren wie heute, für alle Arten: «Fest läuft», «Abklingzeit», «Kapelle brennt», «Kapelle nicht angebunden»;
   4. Sperre der Art (Regel 4);
   5. Waren: alle Einträge von `cost` in Schlüsselreihenfolge (Rum zuerst, dann Zweitware) **prüfen, bevor etwas
      abgebucht wird**; erste fehlende Ware → «Zu wenig ‹GOODS[g].name› (⌊Bestand⌋ / Bedarf)», z. B. «Zu wenig Stoff (7 / 15)».
   6. Erfolg: alle Waren aus dem Lager der Kapellen-Insel abbuchen, `feastAt = tick`; `feastKind = kind` bei `harvest` und
      `market`, bei `ascension` wird ein altes `feastKind` **gelöscht** (Feld fehlt).
3. **Abklingzeit.** Jede Kapelle behält ihre eigene Phase (ein `feastAt` für alle Arten an dieser Kapelle). Zusätzlich für
   `harvest` und `market` je Insel und Art (R-C): Hat eine andere Kapelle derselben Insel `feastKind` = Art und
   `tick − feastAt < FEAST_COOLDOWN`, wird abgewiesen mit «Erntefest auf der Insel: Abklingzeit» bzw. «Markttag auf der Insel:
   Abklingzeit». Abgeleitet aus `feastAt` und `feastKind`, kein eigenes Feld. `ascension` hat keine Inselsperre.
4. **Sperre je Art.**
   - `ascension`: `taxBlock` wie heute (nur diese Art).
   - `harvest`: Inselsperre (Regel 3); dann «Kein Betrieb im Umkreis», wenn auf der Kapellen-Insel kein Gebäude mit
     `BUILDING_DEFS[defId].cycle !== undefined` mit Mittelpunkt im Kapellen-Radius steht (gleiche Rechnung wie `inChapelRadius`;
     stillgelegte Betriebe zählen).
   - `market`: Inselsperre (Regel 3); dann der Grund von `noKontorTrade(world, chapel.island)` unverändert (z. B. «Kein Kontor
     auf …»).
5. **Wirkung Aufstiegsfest:** unverändert (Aufstiegs-Wartezeit im Radius, `TAX_LEVELS.low.upgradeWait`). `feastActive` zählt
   nur Kapellen ohne `feastKind` (= `ascension`); ein Ernte- oder Markttag verkürzt keine Wartezeit.
6. **Wirkung Erntefest.** Für einen Betrieb mit Zyklus gilt c' = max(1, ⌊c × `cyclePct` / 100⌋), wenn auf seiner Insel eine
   Kapelle mit `feastKind: 'harvest'`, Phase `active` und `chapelWorks` steht und der Betrieb in ihrem Radius liegt.
   Angewandt in `cycleOf` auf das Ergebnis von `effectiveCycle` (einziger Leseort; Panel-Anzeige und `producedRate` zeigen
   es mit). Stapelt nicht: mehrere Erntefeste über einem Betrieb = einmal 75 %. Der Fortschritt bleibt erhalten; nach dem
   Ende läuft der Betrieb gegen das alte c. Fehlende Eingänge oder volles Lager sind kein Fehler, der Zugewinn ist 0.
   Geprüft werden je Betrieb nur die Kapellen derselben Insel.
7. **Wirkung Markttag.** Solange auf Insel X eine Kapelle mit `feastKind: 'market'`, Phase `active` und `chapelWorks` steht,
   gilt in `sellPrice(world, good, n, X)` der Faktor m = max(boom, prefer, `sellPct`). Stapelt nicht (zwei Markttage = 125 %).
   Die Sättigung (`world.sellPct`) bleibt unverändert. Ohne Markttag bitgleich. Der Radius spielt keine Rolle (Kontor der
   Insel). `sell` ist der einzige Abnehmer in `src/sim`; UI-Preise (`src/ui/trade.ts`, `order.ts`) zeigen den Faktor mit.
8. **Blattmodul (Gate B1).** Die Wirkungsabfragen stehen in einem neuen Modul `src/sim/feastEffect.ts`: `feastState`,
   `chapelWorks`, der Radiustest (`inChapelRadius`, für Häuser und Betriebe), `feastActive` (Haus, nur `ascension`),
   `harvestActive(world, b)` und `marketActive(world, island)`. Es importiert nur `council` (`serviceRadiusOf`), `defs/*`,
   `types` und `world`, nie `economy`, `levels`, `trade`, `feast` oder `townhall`; sonst entstünde der Zyklus
   `levels → feast → economy → levels`. `levels.ts` (`cycleOf`) und `trade.ts` (`sellPrice`) importieren `feastEffect`;
   `feast.ts` behält Aktion und Sperren (`holdFeast`, `feastBlockReason`) und re-exportiert die Abfragen (DRY, bestehende
   Importe bleiben gültig).
9. **Abriss** beendet die Wirkung sofort und löscht damit die Inselsperre dieser Kapelle. **Brand** pausiert die Wirkung
   (`chapelWorks` false), die Uhr läuft weiter (wie heute); die Inselsperre läuft dabei auch weiter.

## Wahl und Nische des Markttags (Gate B4)

- **Gewollt:** Der Markttag ist bewusst eine Nische, das Ventil der vollen oder eingangsknappen Kette. Die Ernte ist das
  Werkzeug, wenn die Kette Luft hat; der Aufstieg, wenn Häuser steigen. Im Spätspiel ist die Lage «Werkstätten warten auf
  Rohstoffe, Lager voll» häufig (Rohstoffe sind der Engpass), daher ist die Nische real und kein toter Knopf. Mit zwei
  Kapellen auf einer Insel laufen Ernte und Markttag nebeneinander; die Wahl je Kapelle bleibt.
- **Mass für Waren (alle, auch Rohstoffe):** Bewertung zum Grundpreis Verkauf `GOODS[g].sell`, ohne Sättigung.
  Begründung: Eigene Rohstoffe sind Opportunitätskosten (was ihr Verkauf brächte); der Einkaufspreis gilt nur, wenn man
  zukauft, und das tun die Szenarien nicht. Eine Formel für alle Waren hält den Test einfach. Folge gegenüber Rechnung §2
  (Eingänge zum Einkaufspreis, 378): Die Ernte liegt im Test höher als +347, die Rangfolge ändert sich nicht.

## Werte (`src/sim/defs/feast.ts`)

| Feld               | Wert                     | Spannweite (Rechnung §7) | Folge                                       |
| ------------------ | ------------------------ | ------------------------ | ------------------------------------------- |
| `ascension.name`   | «Aufstiegsfest»          | –                        | Knopf, Meldungen                            |
| `ascension.cost`   | `{ rum: 10 }`            | unverändert              | ersetzt `FEAST_RUM`, gleicher Wert          |
| `ascension.scope`  | `'chapel'`               | –                        | keine Inselsperre                           |
| `harvest.name`     | «Erntefest»              | –                        |                                             |
| `harvest.cost`     | `{ rum: 10, cloth: 15 }` | –                        | Schwelle Stoff, netto +347 (Lage B)         |
| `harvest.cyclePct` | `75`                     | 67 … 85                  | 67: Ernte schlägt Markt auch in C; 85: kaum |
| `harvest.scope`    | `'island'`               | –                        | ≤ 600 von 1800 Ticks je Insel               |
| `market.name`      | «Markttag»               | –                        |                                             |
| `market.cost`      | `{ rum: 10, glass: 5 }`  | –                        | Schwelle Glas                               |
| `market.sellPct`   | `125`                    | 115 … < 130              | ≥ 130 wirkungslos auf Vorliebe-Inseln       |
| `market.scope`     | `'island'`               | –                        | wie Ernte                                   |

Auswirkung Balancing-Test: keine. Der Controller hält nie ein Fest; ohne Fest sind `cycleOf` und `sellPrice` bitgleich,
`tests/sim/balance.test.ts` bleibt unverändert grün, kein Ruling (Rechnung §5). Der Dominanztest AK-FE1 ist der
Schutz bei jeder Wertänderung in `defs/feast.ts`.

**Risiko (R553, Gate B3):** Die Rangfolge stützt sich auf die Rechnung und zwei Seeds je Lage. Sie kann bei Änderungen an
Kartenerzeugung, Zyklen, Preisen oder Steuern kippen. Auslöser: AK-FE1 rot. Rückfall: `cyclePct` innerhalb 67 … 85 und
`sellPct` innerhalb 115 … < 130 verstellen, bis AK-FE1 grün ist; jede Verstellung als Ruling durch L0. Reicht die
Spannweite nicht, geht die Frage als Design-Befund an lead-design.

## Save (R-B)

- Neues optionales Feld `Building.feastKind?: FeastKind`, nur zusammen mit `feastAt` und nur an der Kapelle. Fehlt es, gilt
  `ascension`; bei `ascension` wird es nicht geschrieben. Alte Stände und die Baseline bleiben bitgleich, **keine
  Save-Version, keine Migration** (Präzedenz `isValidFeast`, `save.ts:582-585`).
- Prüfung in `isValidFeast` (oder Nachbarfunktion): `feastKind` ohne `feastAt`, an einer Nicht-Kapelle oder
  `∉ FEAST_KIND_IDS` → `deserialize` liefert `{ ok: false }` mit dem bestehenden Hinweis für ungültige Stände, kein Absturz.
  Ein ausdrücklich geschriebenes `feastKind: 'ascension'` ist gültig und gleichwertig zum fehlenden Feld.
- Die Inselsperre braucht kein Feld; sie ergibt sich nach dem Laden aus `feastAt` und `feastKind`.

## Bedienung (Browser-Check, `src/ui/feast.ts` und Panels)

- Kapellen-Panel: drei Knöpfe «Aufstiegsfest · 10 Rum», «Erntefest · 10 Rum, 15 Stoff», «Markttag · 10 Rum, 5 Glas»
  (Texte aus `FEAST_KINDS`), jeder mit eigenem Sperrgrund aus `feastBlockReason(world, chapel, kind)` (rein lesend, `kind`
  fehlt → `ascension`, liefert denselben Grund wie `holdFeast`). Läuft ein Fest: Art und Restzeit sichtbar.
- Betrieb im Wirkkreis eines laufenden Erntefests: Zeile «Erntefest: Zyklus 75 %».
- Handelsfenster der Insel mit laufendem Markttag: «Markttag 125 %».
- Hausanzeige unverändert. Die README-Spielanleitung wird bei der Umsetzung mitgeführt (Hinweis an den Plan).

## Randfälle

- **Leeres Lager / Zweitware fehlt:** fail «Zu wenig Stoff (x / 15)» bzw. «Zu wenig Glas (x / 5)», Rum nicht abgebucht.
- **Wechsel der Art an derselben Kapelle:** nach Erntefest und abgelaufener Abklingzeit ein Aufstiegsfest → `feastKind`
  gelöscht; sonst wirkte die neue Feier als Ernte.
- **Zwei Kapellen, eine Insel:** Erntefest an K1 sperrt Erntefest an K2 bis `feastAt(K1) + 1800`; Markttag und
  Aufstiegsfest an K2 bleiben frei. Andere Inseln sind nicht betroffen.
- **Überlappende Wirkkreise:** gleiche Art stapelt nicht; verschiedene Arten wirken nebeneinander.
- **Fest während der Produktion:** `progress ≥ c'` → der Betrieb fertigt im nächsten Schritt einmal, ohne Verlust und
  ohne Doppelung.
- **Steuersperre:** gilt nur für `ascension`; Ernte und Markt wirken nicht auf Häuser.
- **Markttag ohne Verkauf:** Wirkung 0, Preis bezahlt (Rechnung §2, unteres Ende).
- **Abriss und Neubau zum Dauer-Erntefest:** möglich (Abriss löscht die Inselsperre), aber unrentabel: Neubau der
  Kapelle 300 Geld plus Baustoffe gegen netto +347 je Erntefest (Rechnung §4). Kein eigener Schutz.
- **Alter Spielstand** mit `feastAt` ohne `feastKind`: lädt als laufendes Aufstiegsfest.
- **Abriss während des Erntefests:** Wirkung endet im selben Tick, Betriebe laufen gegen c weiter und behalten `progress`;
  die Inselsperre fällt mit der Kapelle (AK-FE6, AK-FE7).
- **Laden mit laufendem Erntefest oder Markttag:** Die Wirkung gilt ab dem ersten Tick nach dem Laden weiter, abgeleitet aus
  `feastAt` und `feastKind`; kein Zusatzfeld (AK-FE14).

## Abnahmekriterien

Vitest (DOM-frei): `tests/sim/feastKinds.test.ts` (neu), `tests/sim/feastDominance.test.ts` (neu), bestehend
`tests/sim/feast.test.ts`.

- **AK-FE1 Nicht-Dominanz** (`feastDominance.test.ts`, Pflicht). Vier feste Welten (A, B, C, C2) aus `createWorld(seed,
{ unlockAll: true, crisisLevel: 'off' })`, je Welt **zwei feste Seeds** (Parametrisierung, R553), Heimatinsel mit Kontor, eine Kapelle, Festbeginn T0, Fenster T0 … T0 + `FEAST_DURATION`:
  - **A Wachstum:** ≥ 5 Häuser im Radius erfüllt und aufstiegsbereit innerhalb des Wirkfensters (Kosten, Dienste, neue
    Güter da), Steuer «normal»; ein Betrieb mit Zyklus im Radius ohne Eingänge (damit `harvest` gehalten wird). Verkauf: keiner.
  - **B Plateau:** alle Häuser im Radius Stufe 4; Lager Rum, Stoff, Glas je ≈ 50; Eingänge vorrätig; 2 Webereien,
    3 Brennereien, 1 Glashütte, 1 Werkzeugmacher Stufe 3 im Radius (Rechnung §2). Verkauf: 30 Rum, 30 Stoff, 20 Glas.
  - **C Plateau voll, Rohstoffe knapp:** wie B, Lager Rum, Stoff, Glas je ≥ 90, aber Eingänge der Werkstätten = 0 und kein
    Rohstoffbetrieb im Radius (Werkstätten auf `waitingInput`). Verkauf: 60 Rum, 60 Stoff, 40 Glas (Rechnung §2). Grund: Der
    Verkauf läuft in allen Läufen und schafft Lagerplatz; mit Eingängen gewönne dann die Ernte auch in C. Der Markttag
    gewinnt nur, wo die Ernte keinen Ausstoss bringt (Lager voll oder Eingänge knapp); genau das ist die Wahl.
  - **Läufe und Mass (alle Welten):** je Welt vier Läufe: kein Fest, `ascension`, `harvest`, `market`. In **allen vier** Läufen geschieht der Verkauf derselben
    Menge im Tick T0 nach dem Festaufruf, damit nur der Faktor zählt. Mass: Nettowert = ΔGeld + Σ_g ΔLager_g ×
    `GOODS[g].sell` gegen den Lauf ohne Fest am Tick T0 + `FEAST_DURATION` (Festpreis enthalten; der Aufstiegsvorsprung von 150 Ticks liegt
    darin, weil beide Läufe bis dahin aufgestiegen sind). Erwartung: A → `ascension` höchster
    Nettowert, B → `harvest`, C → `market`; unter A, B, C ist jede Art in genau einer Lage beste. Der Test prüft seine Vorbedingungen mit
    (alle `holdFeast` und `sell` liefern `ok`; in B erreicht im Ernte-Lauf kein Fertiggut die Lagergrenze; in C fertigt im
    Ernte-Lauf keine Werkstatt; in A sind die Häuser im Lauf ohne Fest bis T0 + `FEAST_DURATION` aufgestiegen; kein Brand,
    keine Krise im Fenster). Referenz der Erwartung: Rechnung §4, Tabelle Lagen A–C.
  - **C2 Plateau voll mit Eingängen (dokumentierte Nische):** wie C, aber Eingänge vorrätig wie in B; Verkauf 60/60/40.
    Keine volle Rangfolge verlangt, nur `harvest` > `market` und das Band 0 < Netto(`harvest`) − Netto(`market`) ≤ 800. Das Band macht die Nische sichtbar:
    Fällt der Abstand ≤ 0, verliert die Ernte ihren Platz; steigt er über 800, wird der Markttag zum toten Knopf. Beides ist
    ein Drift-Befund mit Rückfall wie unter «Risiko».
  - **Form der Erwartung:** nur Rangfolgen (beste Art je Lage, in C2 das Band), keine Beträge. Mass: siehe «Wahl und
    Nische», alle Waren zu `GOODS[g].sell`. Gilt für beide Seeds.
- **AK-FE2 Bitgleich ohne Art:** `holdFeast(w, id)` und `holdFeast(w, id, 'ascension')` ergeben dasselbe `serialize` wie der
  heutige Aufruf; das Ergebnis enthält kein `feastKind`. Alle bestehenden AK-I007-xx bleiben grün.
- **AK-FE3 Unbekannte Art:** `holdFeast(w, id, 'harbor')` → `{ ok: false, reason: 'Unbekannte Festart' }`, `JSON.stringify(w)`
  unverändert; auch bei laufendem Fest an der Kapelle lautet der Grund «Unbekannte Festart» (Prüfreihenfolge Regel 2).
- **AK-FE4 Waren vorab geprüft:** Rum 30, Stoff 7: Erntefest → «Zu wenig Stoff (7 / 15)», Rum bleibt 30; Rum 3, Stoff 0 →
  «Zu wenig Rum (3 / 10)». Markttag mit Glas 2 → «Zu wenig Glas (2 / 5)». Erfolg bucht genau `cost` ab.
- **AK-FE5 Sperren je Art:** Steuer «hoch» für alle Häuser im Radius sperrt nur `ascension`; Kapelle ohne Betrieb im Radius →
  `harvest` «Kein Betrieb im Umkreis»; Insel ohne Kontor → `market` mit dem Grund von `noKontorTrade`. `feastBlockReason(w,
c, kind)` liefert für jede Art denselben Grund wie `holdFeast` und ändert die Welt nicht.
- **AK-FE6 Inselsperre:** zwei Kapellen K1, K2 auf einer Insel: nach Erntefest an K1 liefert K2 für `harvest` «Erntefest auf
  der Insel: Abklingzeit» bis Tick `feastAt + 1799`, ab `feastAt + 1800` ok; `market` und `ascension` an K2 sofort ok. Analog
  Markttag. Auf einer zweiten Insel (`twoIslandWorld`) keine Sperre. Nach Abriss von K1 ist `harvest` an K2 sofort frei. Brennt K1 während ihres Erntefests, bleibt die Sperre an K2
  bestehen (Uhr läuft weiter).
- **AK-FE7 Ernte wirkt und endet:** Betrieb Stufe 3 (c = 20) im Radius: `cycleOf` = 15 während `active`, 20 danach und
  ausserhalb des Radius bzw. auf anderer Insel; `max(1, …)`-Grenze mit c = 1 → 1. Mit Inselvorteil oder Ratsbeschluss wird
  auf das Ergebnis von `effectiveCycle` abgerundet. Brand der Kapelle → c, nach Brandende wieder c'. Abriss der Kapelle während des Erntefests: `cycleOf` im selben Tick c,
  der Betrieb behält seinen `progress` (keine Einheit verloren, keine zusätzlich). Die Panel-Vorschau der nächsten Stufe
  (`panelView.ts`, `effectiveCycle` mit `next.cycle`) zeigt bewusst kein Erntefest; nur `cycleOf` wirkt (Test oder Hinweis
  im Plan).
- **AK-FE8 Ernte stapelt nicht:** Über `holdFeast` verhindert die Inselsperre zwei Erntefeste; der Test setzt darum
  `feastAt = tick` und `feastKind = 'harvest'` direkt an zwei Kapellen mit überlappendem Radius (z. B. aus einem geladenen
  Stand) → `cycleOf` = 15, nicht 11.
- **AK-FE9 Fest während Produktion:** Betrieb mit `progress` = 17 (> c' = 15), Erntefest beginnt: im nächsten Schritt genau
  eine Einheit, danach normaler Lauf; Summe über 600 Ticks = ⌊600/15⌋ ± 1 (Phase), keine Doppelung. Der Überstand des
  Fortschritts (hier 17 + 1 − 15) verfällt, weil `progress` bei Fertigung auf 0 springt (`production.ts`); «ohne Verlust»
  heisst nur: keine Einheit geht verloren.
- **AK-FE10 Markttag-Faktor:** `sellPrice(w, 'rum', 10, X)` mit Markttag = Wert mit m = 125 (nachgerechnet); mit Boom 150 % →
  Boom-Wert; auf einer Vorliebe-Insel mit 130 % für das Gut → gleicher Wert wie ohne Markttag; zwei Markttage = einmal 125;
  `world.sellPct` nach `sell` gleich wie ohne Markttag; ohne Markttag bitgleich.
- **AK-FE11 Arten nebeneinander:** Aufstiegsfest an K1 und Erntefest an K2 mit überlappendem Radius: Haus hat
  `feastActive` true, Betrieb hat c'; ein Haus nur im Radius von K2 hat `feastActive` false.
- **AK-FE12 Art-Wechsel:** nach Erntefest und `tick ≥ feastAt + 1800` an derselben Kapelle `ascension` → kein `feastKind`,
  Betriebe im Radius wieder c.
- **AK-FE13 Save:** Rundlauf erhält `feastKind` für `harvest` und `market`; alter Stand ohne `feastKind` lädt als
  Aufstiegsfest. Abgewiesen (`ok: false`, kein Wurf): `feastKind` ohne `feastAt`, an einer Nicht-Kapelle, `'harbor'`, `5`.
  `SAVE_VERSION` unverändert.
- **AK-FE14 Determinismus:** je Art zweimal dieselbe Welt (Seed, Aktionen, 1800 Ticks) → gleiches `serialize`. Zusätzlich je
  Art: Fest halten, 300 Ticks, `serialize` → `deserialize`, weitere 900 Ticks; gleiches `serialize` wie der durchgelaufene
  Lauf. Darin enthalten: ein geladener Stand mit laufendem Erntefest hat im ersten Tick nach dem Laden c' (`cycleOf`), ein
  laufender Markttag den Faktor 125.
- **AK-FE15 Werte nur aus Defs:** Strukturtest wie «Aufbau von feast.ts», auf dem Quelltext **ohne Kommentare** (Zeilen- und
  Blockkommentare vorher entfernt): `src/sim/feast.ts`, `src/sim/feastEffect.ts`, `src/sim/levels.ts`, `src/sim/trade.ts`
  enthalten weder `75` noch `125` als Zahlenliteral, `feast.ts` zusätzlich weder `15` noch `'cloth'`,
  `'glass'` oder `'rum'` (Kosten nur über `FEAST_KINDS[kind].cost`); `src/sim/defs/feast.ts` exportiert `FEAST_KINDS` und
  `FEAST_KIND_IDS` mit den Werten oben (Test liest die Werte gegen die Tabelle). Der bisherige Strukturtest «nur eine
  Stelle Rum» (`feast.test.ts:295`) wird ersetzt durch «genau ein `takeStock`-Aufruf in `feast.ts`» (Abbuchung in einer
  Schleife über `cost`).
- **AK-FE16 Regression:** `tests/sim/balance.test.ts` und die Baseline unverändert grün.
- **AK-FE21 Importstruktur (Gate B1):** Strukturtest auf die Importzeilen: `src/sim/levels.ts` und `src/sim/trade.ts`
  importieren aus `./feastEffect`; `src/sim/feastEffect.ts` importiert weder `./economy`, `./levels`, `./trade`, `./feast`
  noch `./townhall`; `src/sim/feast.ts` wird von `levels.ts` und `trade.ts` nicht importiert.

Browser-Check (`qa-playtester`, Headless):

- **AK-FE17** Kapelle wählen: drei Knöpfe mit Preisen wie oben; ohne Stoff ist «Erntefest» gesperrt mit «Zu wenig Stoff
  (x / 15)»; nach Klick auf «Erntefest» Restzeit und Art sichtbar, die beiden anderen Knöpfe zeigen «Fest läuft».
- **AK-FE18** Werkstatt im Radius zeigt «Erntefest: Zyklus 75 %», ausserhalb nicht; nach Festende (`FEAST_DURATION`) Zeile weg.
- **AK-FE19** Markttag halten, Handelsfenster der Insel: «Markttag 125 %» und höherer Verkaufspreis; nach Festende weg.
- **AK-FE20** Zweite Kapelle auf derselben Insel: «Erntefest» gesperrt mit «Erntefest auf der Insel: Abklingzeit».

## Nicht im Scope

- **Hafenfest** (R-A): Schiffe entladen, laden und fahren im selben Tick ab (`ships.ts:199-217`) und stehen in keinem
  Wirkkreis; die Wirkung wäre immer 0.
- **Feststapel:** keine Mehrfachwirkung gleicher Arten, keine Kombi-Feste, keine Warteschlange von Festen.
- **Neue Freischaltung:** die Arten sind mit der Kapelle verfügbar, kein eigener Freischalt-Eintrag.
- **Controller-Feste:** der Balancing-Controller hält weiter kein Fest.
- **Audio:** kein eigener Klang je Art.
- Keine Änderung an Hausanzeige, Kapellen-Radius, Dauer, Abklingzeit, Sättigung oder Speicherversion.

## Offene Punkte für Tech

1. **Importzyklus:** entschieden (Regel 8, AK-FE21): Blattmodul `feastEffect.ts`. Offen für den Plan nur, ob weitere
   Importeure von `feastState` (z. B. `src/ui/feast.ts`) direkt auf `feastEffect` umgestellt werden.
2. **Leistung:** `cycleOf` läuft je Betrieb und Tick. Empfehlung: Kapellen je Insel filtern (`b.island`), nicht ganz
   `world.buildings`; kein Cache im Welt-Zustand (nicht JSON-pflichtig, abgeleitet).
3. **`inChapelRadius`** heisst heute für Häuser; für Betriebe gleich verwenden (Parameter umbenennen).
4. **`FEAST_RUM`:** wird durch `FEAST_KINDS.ascension.cost.rum` ersetzt (L0 angenommen). `tests/sim/feast.test.ts:7` und
   `src/ui/feast.ts` im selben Task umstellen, sonst bricht `tsc`.
5. **Strukturtest Rum:** ersetzt durch «genau ein `takeStock`-Aufruf» (L0 angenommen, AK-FE15).
6. **AK-FE1 Kalibrierung:** Lage A verlangt aufstiegsbereite Häuser, deren Aufstieg ohne Fest erst nach 300 Ticks käme; die
   Welten baut der Test mit `tests/sim/helpers.ts`. Die Verkaufsmengen in B weichen von 60/60/40 ab (Lager ≈ 50 erlaubt das
   nicht). Lage C ist bewusst inputknapp (lead-design-Abnahme): Rechnung §4 setzt in C einen vollen Ausgang voraus, der Verkauf
   in allen Läufen würde ihn leeren. Eigener Plan-Task mit Test-Helfer (`tests/sim/helpers.ts`) und Rot-Phase für die vier
   Welten × zwei Seeds.
