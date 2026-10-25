# I-201 Festanlass — Rechnung Dominanz und Warenpreis

## Empfehlung

**Kurzdesign ja, aber nicht in der Ideenform.** In der Ideenform dominiert das Erntefest im
Spätspiel. Das Hafenfest bringt immer 0, das Aufstiegsfest bringt im Plateau (alle Häuser Stufe 4) 0. Gegenvorschlag:

1. Hafenfest streichen, dafür **Markttag**: Verkaufserlös der Kapellen-Insel 125 %, kostet Glas.
   Erntefest (Quelle) und Markttag (Senke) wechseln sich dann nach dem Lagerstand ab.
2. Erntefest und Markttag mit **Abklingzeit je Insel und Art**, sonst ergeben versetzte Kapellen
   eine Dauerwirkung.
3. Aufstiegsfest unverändert (10 Rum, 600/1800, je Kapelle). Damit bleibt die Baseline bitgleich.

## 1 Ist-Werte

| Wert                          | Ist                                       | Fundstelle                       |
| ----------------------------- | ----------------------------------------- | -------------------------------- |
| Rum, Dauer, Abklingzeit       | 10 · 600 · 1800 Ticks                     | `defs/timing.ts:60,62,64`        |
| Aufstiegs-Wartezeit           | 300; mit Fest 150; Defizit ×2             | `timing.ts:10,12`                |
| Festwirkung (einzige)         | `festive ? low`                           | `population.ts:152-157`          |
| Überlappung                   | `some`, stapelt nicht                     | `feast.ts:92-98`                 |
| Kapelle ohne Haus im Radius   | Fest erlaubt                              | `feast.ts:44-53`                 |
| Kapellen-Radius, Bauplatz     | 10, `site: []` (frei)                     | `defs/buildings.ts:192-193`      |
| Stufe 4 Aufstieg              | `upgradeCost: null`                       | `tiers.ts:46`                    |
| Steuer je Einw./100 Ticks     | 2/7/14/22, Haus max 4/8/15/20             | `tiers.ts:15-45`                 |
| Bedarf Stufe 4 je Einw./100 T | Stoff 0,2 · Rum 0,2 · Glas 0,1            | `tiers.ts:43`                    |
| Preise kaufen/verkaufen       | Stoff 30/12 · Rum 40/18 · Glas 50/20      | `defs/goods.ts:33-60`            |
| Lagergrenze je Gut            | 100                                       | `goods.ts:84`                    |
| Verkaufssättigung             | −1 pp/Einheit, Boden 30 %, +1 pp/10 Ticks | `goods.ts:65,67`; `timing.ts:18` |
| Boom / Vorliebe               | 150 % / 130 %, es gilt das Maximum        | `crises.ts:18`; `sea.ts:35`      |
| Zyklus Werkstätten St. 1 / 3  | 50 / 20; Werkzeug 80 / 32                 | `levels.ts:32-35`                |
| Schiffsumschlag               | Entladen, Laden, Abfahrt im selben Tick   | `ships.ts:199-217`               |

## 2 Wert je Art

**Aufstieg:** G_A = Σ_Haus (Δt/100) × ΔSteuer, mit Δt ∈ [0, 150] (bei Defizit bis 300).
Positiv ist der Wert nur für Häuser, die im Wirkfenster 150 bis 300 Ticks erfüllt sind und bei
denen Kosten, Dienste und neue Güter bereitliegen.

| Fall                                    | Rechnung                  | G_A  |
| --------------------------------------- | ------------------------- | ---- |
| 1 Pionierhaus → Siedler (unteres Ende)  | 1,5 × (8·7 − 4·2)         | 72   |
| 5 Bürger → Kaufleute, Δt Ø 100          | 5 × 1,0 × (20·22 − 15·14) | 1150 |
| dasselbe mit Edikt Wohlfahrt (Δt ≤ 50)  | 5 × 0,5 × 230             | 575  |
| Steuer «niedrig» oder Plateau (Stufe 4) | kein Zeitgewinn           | 0    |

**Erntefest (Vorschlag p = 75 %):** c' = max(1, ⌊c·p/100⌋), Zugewinn je Betrieb
⌊600/c'⌋ − ⌊600/c⌋. Das gilt nur, wenn Eingänge vorrätig sind und das Ausgangslager nicht voll ist
(sonst verfällt die Einheit, `production.ts:67-69`).

| Betrieb              | c → c'  | Einheiten/600 | Zugewinn |
| -------------------- | ------- | ------------- | -------- |
| Stufe 1 (Zyklus 50)  | 50 → 37 | 12 → 16       | +4       |
| Stufe 3 (Zyklus 20)  | 20 → 15 | 30 → 40       | +10      |
| Werkzeug St. 3 (32)  | 32 → 24 | 18 → 25       | +7       |
| Rinderfarm St. 3 (8) | 8 → 6   | 75 → 100      | +25      |

Spätspiel-Beispiel: Im Radius stehen 2 Webereien, 3 Brennereien, 1 Glashütte und 1 Werkzeugmacher,
alle Stufe 3. Das Fest bringt +20 Stoff, +30 Rum, +10 Glas und +7 Werkzeug, Verkaufswert 1085.
Die zusätzlichen Eingänge (20 Wolle, 30 Rohr, 10 Stein, 17 Holz) kosten 378. Bleibt eine **Marge
von 707 Geld**. Unteres Ende: 2 Betriebe der Stufe 1 bringen +8 Einheiten, etwa 60 Geld.

**Hafenfest:** **0, immer.** Schiffe haben keine Ladezeit (`ships.ts:199-217`) und sind keine
Gebäude, stehen also in keinem Wirkkreis. Eine schnellere Fahrt (250–400 Ticks je Strecke) wäre
ein Routenbonus, kein Kapellenfest.

**Markttag (Vorschlag m = 125 %):** Bonus = (m − 100)/100 × Erlös der Verkäufe im Wirkfenster. Er
stapelt nicht mit Boom oder Vorliebe (Maximum wie in `trade.ts:84-88`). Beispiel aus vollem Lager:
60 Rum, 60 Stoff und 40 Glas verkaufen. Die mittleren Anteile sind 70,5 % bzw. 80,5 %, der Erlös
42,3·18 + 42,3·12 + 32,2·20 = 1913, der **Bonus 478**. Unteres Ende: Ohne Verkauf ist der Bonus 0.

## 3 Preis je Art

Spätspiel mit 6 Kaufleute-Häusern (120 Einwohner): Die Steuer bringt 2640 je 100 Ticks, also
47 520 je Abklingzeit von 1800 Ticks. Im selben Zeitraum werden 432 Rum, 432 Stoff und 216 Glas
verbraucht.

| Art           | Preis             | Verk./Kauf | Steuer | Verbrauch   | je Einw./100 T |
| ------------- | ----------------- | ---------- | ------ | ----------- | -------------- |
| Aufstiegsfest | 10 Rum (Ist)      | 180/400    | 0,8 %  | Rum 2,3 %   | 0,19           |
| Erntefest     | 10 Rum + 15 Stoff | 360/850    | 1,8 %  | Stoff 3,5 % | 0,39           |
| Markttag      | 10 Rum + 5 Glas   | 280/650    | 1,4 %  | Glas 2,3 %  | 0,30           |

Als Geld schmerzt kein Preis (gegen 22 Steuer je Einwohner). Spürbar sind die Lagerschwelle
(15 Stoff = 15 % der Lagergrenze) und das Risiko, den Hausbedarf zu unterschreiten: Unerfüllte
Häuser zahlen die halbe Steuer (`tiers.ts:7`), bei 120 Kaufleuten −1320 je 100 Ticks. Der Preis
ist also eine Bedingung; die Wahl trägt der Lagerzustand.

## 4 Dominanzprüfung

Nettowert = Wert − Preis (zum Verkaufswert), Zahlen aus Abschnitt 2.

| Lage                                     | Aufstieg | Ernte    | Hafen | Markt   | Beste    |
| ---------------------------------------- | -------- | -------- | ----- | ------- | -------- |
| A Wachstum, 5 Häuser steigen im Radius   | +970     | +347     | −180  | ≈ 0     | Aufstieg |
| B Plateau, Lager halb, Eingänge da       | −180     | +347     | −180  | +50     | Ernte    |
| C Plateau, Fertigwaren ≥ 90              | −180     | ≈ −360   | −180  | +198    | Markt    |
| D Stoff < 15                             | möglich  | gesperrt | –     | möglich | A/Markt  |
| E Kapelle im Werkstattviertel, kein Haus | −180     | +347     | −180  | +198    | lageabh. |

- **Ideenform:** In den Plateau-Lagen B und C ist das Erntefest die einzige Art mit positivem Wert.
  Hafenfest und Aufstiegsfest lohnen sich dort nie. **Das Erntefest dominiert.**
- **Gegenvorschlag:** Keine Art liegt in allen Lagen vorn. Im Plateau entscheidet der Lagerstand:
  halb voll spricht für Ernte, voll für den Markt. Das ergibt alle 3 min einen echten Entscheid.
- **Zwei Ausbaupfade:** Die Kapelle kann im Wohnviertel stehen (Aufstieg) oder im Werkstattviertel
  (Ernte). Eine reine Erntekapelle bringt +347 je 1800 Ticks, das sind ≈ 19 je 100 Ticks bei 15
  Unterhalt. Sie deckt also gerade ihren Unterhalt und ist nicht dominant.

**Randfälle**

- **Leeres Lager:** `holdFeast` prüft beide Waren, bevor etwas abgebucht wird, und meldet `fail`
  mit dem Grund «Zu wenig Stoff (x / 15)». Die Welt bleibt dabei unverändert, nach dem Muster in
  `feast.ts:29-41`.
- **Eingänge fehlen:** Das ist kein Fehler. Die Betriebe stehen auf `waitingInput`, der Zugewinn
  ist 0.
- **Mehrere Kapellen:** Heute hat jede Kapelle ihre eigene Abklingzeit. Drei versetzte Kapellen
  wirken damit zu 100 %. Darum gilt für Ernte und Markt die Abklingzeit je Insel; die Wirkung ist
  dann höchstens 1/3 der Zeit aktiv.
- **Überlappende Wirkkreise:** Gleiche Arten stapeln nicht (`some`). Verschiedene Arten wirken
  nebeneinander.
- **Fest während der Produktion:** Geprüft wird `progress >= cycle`. Liegt der Fortschritt über
  c', fertigt der Betrieb im nächsten Schritt, ohne Verlust und ohne Doppelung. Nach dem Fest läuft
  er gegen das alte c weiter.
- **Steuersperre:** `taxBlock` gilt nur für das Aufstiegsfest. Ernte und Markt wirken nicht auf
  Häuser und werden davon nicht gesperrt.

## 5 Balancing-Test

Der Controller hält nie ein Fest (`rg feast tests/sim/controller.ts` findet nichts). Die Baseline
bleibt bitgleich, solange drei Dinge gelten:

- `holdFeast(world, id)` ohne Art bedeutet `ascension`.
- `cycleOf` liefert ohne laufendes Erntefest den heutigen Wert. Der Abschlag gehört in den
  einzigen Leseort `cycleOf`/`effectiveCycle` (`levels.ts:33-44`), damit `producedRate` ihn
  mitzeigt.
- `sellPrice` liefert ohne Markttag den heutigen Wert.

An `tests/sim/balance.test.ts` ändert sich nichts, ein Ruling zum Test entfällt. Ernte-Prüfung je Tick nur über
die Kapellen der Insel.

## 6 Save-Folge

- Neues optionales Feld `feastKind`, nur zusammen mit `feastAt`. Fehlt es, gilt `ascension`. Alte
  Stände laden damit ohne Migration (Präzedenz `save.ts:582-585`).
- Die Prüfung verlangt `feastKind ∈ FEAST_KIND_IDS`. Eine unbekannte Art wird mit Hinweis
  abgewiesen; dafür braucht es einen Test.
- Die Abklingzeit je Insel braucht kein eigenes Feld. Sie ergibt sich aus `feastAt` und
  `feastKind` der Kapellen auf der Insel.

## 7 Defs-Vorschlag

Neue Datei `src/sim/defs/feast.ts` mit `FEAST_KINDS`. `FEAST_RUM` geht in
`ascension.cost.rum` auf, der Wert bleibt gleich. `FEAST_DURATION` und `FEAST_COOLDOWN` bleiben in
`timing.ts`.

| Feld               | Ist        | Soll                     | Auswirkung                     |
| ------------------ | ---------- | ------------------------ | ------------------------------ |
| `ascension.cost`   | `rum: 10`  | `{ rum: 10 }`            | unverändert, bitgleich         |
| `ascension.scope`  | je Kapelle | `'chapel'`               | unverändert                    |
| `harvest.cost`     | –          | `{ rum: 10, cloth: 15 }` | Schwelle Stoff, netto +347     |
| `harvest.cyclePct` | –          | `75`                     | +10 je Betrieb Stufe 3         |
| `harvest.scope`    | –          | `'island'`               | ≤ 600 von 1800 Ticks je Insel  |
| `market.cost`      | –          | `{ rum: 10, glass: 5 }`  | Schwelle Glas (knappe Kette)   |
| `market.sellPct`   | –          | `125`                    | +478 aus vollem Lager, sonst 0 |
| `market.scope`     | –          | `'island'`               | wie Ernte                      |

Spannweiten für die Feinabstimmung:

- **`cyclePct`:** Bei 67 bringt jeder Betrieb +15 (Zyklus 20 → 13), und die Ernte schlägt den
  Markt auch in Lage C knapp. Bei 85 sind es nur +5 (20 → 17), die Ernte liegt dann kaum über
  ihrem Preis.
- **`sellPct`:** Bei 130 hätte der Markttag auf Vorliebe-Inseln keine Wirkung, weil die Vorliebe
  schon 130 % gibt. Bei 115 bringt er im Beispiel nur +287 und lohnt sich kaum noch.

## 8 Ruling-Entwürfe für L0

- **R-A:** I-201 bekommt ein Kurzdesign mit Aufstiegsfest, Erntefest und Markttag; das Hafenfest
  entfällt. — Das Hafenfest wirkt nicht, weil der Umschlag in einem Tick erledigt ist; in der
  Ideenform dominiert die Ernte im Plateau. — Bei Irrtum wählt niemand eine der Arten, und ihr
  UI-Platz liegt brach. Die Art lässt sich über die Defs abschalten.
- **R-B:** `feastKind` ist optional, fehlt bei `ascension` und braucht keine neue Save-Version
  ; eine unbekannte Art wird abgewiesen. — Alte Stände laden unverändert, und
  das Abweisen ist getestet. — Bei Irrtum folgt später eine Versionserhöhung mit kleiner Migration.
- **R-C:** Ernte und Markt haben eine Abklingzeit je Insel und Art, das Aufstiegsfest bleibt je
  Kapelle. — Ohne diese Regel bringen versetzte Kapellen dauerhaft +33 % Ausstoss bzw. +25 %
  Erlös. — Bei Irrtum können die Viertel einer Insel nicht gleichzeitig ernten; das kostet
  Komfort, aber nicht die Wirtschaft.
