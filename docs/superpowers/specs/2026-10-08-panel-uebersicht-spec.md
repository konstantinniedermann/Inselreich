# PANEL-UEBERSICHT — Design-Spec

Datum: 2026-10-08 · Paket PANEL-UEBERSICHT · Meilenstein: ohne (Komfort-Paket aus IDEEN-03, Reihenfolge 2) · Status:
**Entwurf, Abnahme lead-design, danach Gate Spec (lead-tech, lead-qa)** · Prozessstufe voll

Grundlage: Ruling **R337** (Reihenfolge IDEEN-03: TASTEN-KOMFORT vor PANEL-UEBERSICHT), [Ideen](../../ideen.md)
I-026 (verwandt I-025); [TASTEN-KOMFORT-Spec](2026-10-08-tasten-komfort-spec.md) (Knopf «Gleiches bauen»,
`Umschalt+U`, Tooltip «Ausbauen (Umschalt+U)»); [Hauptspec](2026-09-29-inselreich-design.md). Code-Stand der
Prüfung: `main` 6f61040 (TASTEN-KOMFORT gemergt).

Anhänge: [01 Zustandstöne, Pips, Beispielwerte](2026-10-08-panel-uebersicht-spec/anhang-01-zustandstoene.md) ·
[02 `data-field`-Namen und bestehende Tests](2026-10-08-panel-uebersicht-spec/anhang-02-data-fields.md).

Kennzeichnung: **Setzung Spec** (in dieser Spec ergänzt, nicht im Lead-Briefing), **[Tech]** (Umsetzungsdetail;
lead-tech entscheidet im Plan, die Spec legt nur das prüfbare Verhalten fest).

## 1. Ziel

**Spielerzweck:** „Der Spieler erkennt beim Anklicken eines Betriebs auf einen Blick Zustand, Ausstoss je Minute,
Auslastung und den Gewinn des nächsten Ausbaus, gegliedert in Kopf, Kennzahlen und Ausbau-Karte statt in einem
Textblock."

Nutzerwunsch (wörtlich, I-026): „Beschrieb beim Anklicken mit Produktionsstatistik, Upgrade usw. auf einen Blick
statt unformatiertem, undurchsichtigem Text".

Heute baut `renderInspect` (`src/ui/inspect.ts`) das Betriebs-Panel aus untereinander gestapelten `<p class=
"panel-line">`-Zeilen (Zustand, Stufe, Auslastung, Erzeugung, Verbrauch, Balken, Unterhalt, Ausbau-Abschnitt). Das
Paket ordnet **dieselben Werte** in drei Zonen als Card-UI mit CSS Grid; es erfindet keine neuen Spielwerte.

Drei Teile: **A** Betriebs-Panel in drei Zonen (Betriebe und Dienste), **B** Wohnhaus-Panel in denselben drei
Zonen, **C** Kopf-Konsistenz für Amtsstube und Kontor. Grundlage aller drei: **reine Ansichts-Helfer** in einem
neuen Modul `src/ui/panelView.ts` (Abschnitt 4).

## 2. Scope und ausdrücklich nicht

**Im Scope:** neues DOM-freies Modul `src/ui/panelView.ts`; Umbau von `renderInspect`, `updateInspect`,
`renderHouse`/`updateHouse`, `renderUpgradeBox`/`updateUpgradeBox` in `src/ui/inspect.ts`; neue Regeln und drei
Farbvariablen in `src/style.css`; Tests `tests/ui/panelView.test.ts` (neu) und Erweiterung
`tests/ui/contrast.test.ts`; README-Absatz «Info-Panel»; arc42-Bausteinzeile.

**Ausdrücklich nicht:**

- keine Änderung an `src/sim/` (Regeln, Defs, Abfragen), **kein neues Save-Format** (`SAVE_VERSION` bleibt 9), keine
  Migration, keine Baseline, kein Balancing (`tests/sim/balance.test.ts` unberührt), kein Perf-Paket;
- keine neuen Spielwerte und keine neuen Einträge in `src/sim/defs/`; alle Zahlen kommen aus bestehenden Abfragen
  (`perMinute`, `cycleOf`, `upkeepOf`, `utilization`, `upgradeView`, `progressPct`, `TIERS`, `LEVELS`);
- **Amtsstube und Kontor:** nur der gemeinsame Kopf (Teil C); Steuerknöpfe, Sperr-Matrix, Aufstiegsstopp,
  Lagerzeile, Handel und Schiffsabschnitt bleiben inhaltlich und in der Reihenfolge wie heute;
- Handel-Panel (`src/ui/trade.ts`), Ruhe-Ansicht «Inselchronik», Mouse-over-Tooltip (`src/ui/hover.ts`), HUD;
- `src/render/` (keine Kartenmarken, keine Vorschau-Änderung);
- geschätzter Ist-Ausstoss (Nennwert × Auslastung), Verlaufsgrafik, Statistik über Zeit (OF-6);
- Panel-Breite im Layout (`#app`-Grid bleibt `1fr 280px` ab 900 px, OF-5);
- I-024 «Direkt als Stufe 2 bauen» (geparkt, R337); Texte von I-015;
- Mobil-Optimierung (Desktop-first; schmale Fenster nur „stürzt nicht ab").

## 3. Gemeinsame Regeln

- **G-1 Gleiche Quelle.** Jede Zahl und jeder Text im Panel stammt aus einer bestehenden Abfrage oder einem reinen
  Helfer in `src/ui/panelView.ts`, der nur solche Abfragen zusammensetzt. Kein Helfer liest eine Uhr, das DOM oder
  ändert die Welt. Die Ausbau-Vorschau bleibt der Probelauf auf einer Kopie (`upgradeView`); AK-PU-10 prüft, dass
  die Welt unverändert bleibt.
- **G-2 Drei Zonen.** Jedes Betriebs-, Dienst- und Wohnhaus-Panel besteht aus `data-zone="head"` (Kopf),
  `data-zone="stats"` (Kennzahlen) und, wo vorhanden, `data-zone="upgrade"` (Ausbau- bzw. Aufstiegs-Karte); danach
  folgen unverändert Knopfleiste (`panel-actions`), Grund-Zeilen (`connect-reason`, `feast-reason`) und die
  Abriss-Erstattung (`refund`). Semantik: Kopf ist `<header>`, die beiden anderen Zonen sind `<section>` mit
  `aria-label` «Kennzahlen» bzw. «Ausbau» / «Aufstieg» [Tech: Elementwahl, solange die `aria-label` stimmen].
- **G-3 Kein Neuaufbau pro Tick.** `renderInspect` baut das Gerüst einmal je Auswahl; `updateInspect` setzt nur
  Texte, Attribute und `hidden` (über `setField`, das nur bei geändertem Text schreibt). Welche Kacheln und Zeilen
  es gibt, hängt nur vom Gebäudetyp ab (`defId`) und ändert sich bei Stufe, Zustand oder Brand nicht
  (`statKeys`, AK-PU-17). Listen mit wechselnder Länge (Gründe, Bedarfe) laufen weiter über `setList` mit
  Key-Vergleich. Folge: Knoten bleiben über Ticks identisch, Tastaturfokus bleibt auf einem fokussierten Knopf.
- **G-4 Zustand nicht nur per Farbe.** Der Ton (`ok`/`warn`/`bad`) erscheint als farbige Kante und Symbol (✓ ! ✗);
  der Zustandstext bleibt sichtbar und unverändert. Textfarbe auf Pergament bleibt `--ink` (Regel aus `style.css`).
- **G-5 Desktop-first.** Gestaltet für die Panel-Spalte von 280 px ab 900 px Fensterbreite (Zielauflösungen
  1280×720 und 1920×1080). Unter 900 px (einspaltig, Panel max. 38vh) gilt nur: nichts überlappt, kein
  waagrechtes Scrollen im Panel, nichts stürzt ab.
- **G-6 Kein Spielwert, keine Bedien-Konstante in `defs`.** Neue Texte (`TONE_SYMBOL`, Beschriftungen,
  `UPGRADE_KEY_LABEL = 'Umschalt+U'`) stehen je einmal exportiert in `src/ui/panelView.ts`; Farben in `src/style.css`
  `:root`. Keine Zahl aus `src/sim/defs/` wird im UI kopiert.

## 4. Reine Helfer `src/ui/panelView.ts`

Alle Funktionen DOM-frei, ohne Seiteneffekt, Eingabe nur `World` und `Building`. Rückgabeformen sind verbindlich;
Feldreihenfolge und Typnamen [Tech]. Beispielwerte: [Anhang 01](2026-10-08-panel-uebersicht-spec/anhang-01-zustandstoene.md) A.5.

```ts
export type Tone = 'ok' | 'warn' | 'bad';
export const TONE_SYMBOL: Record<Tone, string>; // { ok: '✓', warn: '!', bad: '✗' }
export const UPGRADE_KEY_LABEL = 'Umschalt+U';

export interface Chip {
  text: string;
  tone: Tone;
  label: string;
} // label = aria-label/title
export interface Pips {
  level: number;
  max: number;
  label: string;
}
export type StatKey = 'output' | 'utilization' | 'input' | 'upkeep' | 'inhabitants';
export interface StatTile {
  key: StatKey;
  label: string;
  value: string;
  sub: string | null;
}
export interface GainRow {
  key: 'output' | 'upkeep' | 'inhabitants';
  label: string;
  before: number;
  after: number;
  delta: string;
  text: string;
}
export type UpgradeCard =
  | {
      kind: 'next';
      title: string;
      gains: GainRow[];
      cost: string;
      fee: string;
      reasons: string[];
      ok: boolean;
      key: string;
    }
  | { kind: 'locked'; title: string; gains: GainRow[]; lock: string }
  | { kind: 'max'; title: 'Höchste Stufe' };
```

Funktionen (Signatur — Rückgabe — Regel):

- **`stateTone(b)`** — `Tone` — Anhang 01 A.1; dieselbe Prüfreihenfolge wie `stateInfo`; erschöpfender `switch`
  über `BuildingState` [Tech].
- **`stateChip(world, b)`** — `Chip` — `text = stateInfo(b, world.tick, missingInputs(world, b)).text`,
  `tone = stateTone(b)`, `label = 'Zustand: ' + text`.
- **`supplyChip(world, b)`** — `Chip | null` — nur Wohnhaus, Anhang 01 A.2; sonst `null`.
- **`levelPips(b)`** — `Pips | null` — `LEVELS[b.defId]` vorhanden → `{ level: b.level ?? 1, max:
LEVELS[defId].length + 1, label: 'Stufe n von 3' }`; sonst `null`.
- **`tierPips(b)`** — `Pips | null` — nur Wohnhaus: `{ level: tier, max: Anzahl TIERS, label: '{Name}, Stufe n von
m' }`.
- **`statTiles(b)`** — `StatTile[]` — Abschnitt 5.2; Reihenfolge `output`, `utilization`, `input`, `upkeep`; jede
  Kachel nur, wenn ihre Quelle existiert.
- **`houseTiles(b)`** — `StatTile[]` — nur Wohnhaus: genau `inhabitants` (Abschnitt 6.2).
- **`statKeys(defId)`** — `StatKey[]` — Struktur ohne Werte; gleich `statTiles(b).map(t => t.key)` für jedes `b`
  dieses Typs, unabhängig von Stufe, Zustand, Brand (G-3).
- **`upgradeGain(b, to)`** — `GainRow[]` — `to` = Zielstufe 2 oder 3; `output`: `perMinute(1, cycleOf(b))` →
  `perMinute(1, LEVELS[defId][to − 2].cycle)`; `upkeep`: `perMinute(upkeepOf(b), UPKEEP_INTERVAL)` →
  `perMinute(next.upkeep, UPKEEP_INTERVAL)`; `delta = signedNum(round1(after − before))`; `text = '{before} →
{after} / min'`; angezeigt wird `label + ' ' + text` (z. B. «Ausstoss 15 → 25 / min»).
- **`upgradeCard(world, b)`** — `UpgradeCard | null` — `null` ohne `LEVELS`-Eintrag. Stufe 3 → `max`. Funktion
  `upgrade2`/`upgrade3` gesperrt (`functionLock ≠ null`) → `locked` mit `lock = functionLock(…)`, `title = 'Ausbau
zu Stufe n'`, `gains = upgradeGain(…)`. Sonst `next`: `title`, `cost`, `fee`, `reasons`, `ok` **wörtlich aus
  `upgradeView`**, `gains = upgradeGain(…)`, `key = UPGRADE_KEY_LABEL`.
- **`riseCard(world, b)`** — `{ title; gain: GainRow | null }` — nur Wohnhaus: Titel «Aufstieg zu {nächste Stufe}»
  bzw. «Höchste Stufe»; `gain` = `TIERS[t].maxInhabitants` → `TIERS[t + 1].maxInhabitants` mit `label = 'Einwohner
höchstens'`, `text = 'a → b'`, `delta = signedNum(b − a)`; höchste Stufe → `null`.
- **`progressView(b)`** — `{ pct; label } | null` — nur mit Zyklus: `pct = progressPct(b)`, `label = 'Fortschritt
{pct} %'` (für `aria-valuenow`); sonst `null`.

`round1(x) = Math.round(x × 10) / 10`. `upgradeView` bleibt unverändert und exportiert (Anhang 02 B.4).

## 5. Teil A — Betriebs-Panel (Betriebe und Dienste)

Gilt für jedes Gebäude ohne `house`, das weder `kontor`, `kontor2` noch `townhall` ist (heute der `else`-Zweig in
`renderInspect`).

### 5.1 Kopf (`data-zone="head"`)

- **A-1** Zeile 1: Gebäudename (`data-field="title"`, `h2.panel-title`, unverändert) und rechtsbündig der
  **Stufen-Chip** (nur ausbaubare Betriebe): Text «Stufe n» (`data-field="level"`, Text aus `levelText`) plus Pips
  (`data-field="level-pips"`, n gefüllte und `max − n` leere Punkte, `aria-hidden="true"`); `aria-label` und `title`
  des Chips = `levelPips(b).label` («Stufe 2 von 3»).
- **A-2** Zeile 2: **Zustands-Chip** (`data-field="state"` trägt den Text, Chip-Element trägt `data-tone`), davor
  das Symbol aus `TONE_SYMBOL` (`aria-hidden`); `aria-label` = `stateChip(...).label`. **Setzung Spec:** kein
  `aria-live` (Zustände wechseln oft; Ansagen bei jedem Wechsel stören).
- **A-3** Darunter die **Abhilfe** (`data-field="remedy"`, Text und Sichtbarkeit wie heute aus `remedyText`).
  **Setzung Spec:** die Abhilfe gehört zum Kopf, weil sie den Zustand erklärt.
- **A-4** Nur im DEV-Build bleibt die Positionszeile direkt unter dem Titel.

### 5.2 Kennzahlen (`data-zone="stats"`)

Kacheln in einem CSS Grid (`display: grid`, zwei Spalten in 280 px; [Tech] z. B.
`repeat(auto-fit, minmax(110px, 1fr))`). Jede Kachel: Beschriftung (klein), Wert (gross, fett), optional
Unterzeile. Werte und Texte aus `statTiles(b)`:

| Kachel        | Bedingung                 | `label`      | `value`                                                                | `sub`                                                                                   |
| ------------- | ------------------------- | ------------ | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `output`      | `def.produces` und Zyklus | «Ausstoss»   | `'{perMinute(1, cycleOf(b))} / min'`                                   | `'{Gut} · alle {formatGameTime(cycleOf(b))}'`; brennt: `'{Gut} · ruht, Betrieb brennt'` |
| `utilization` | `utilization(b) !== null` | «Auslastung» | `'{floor(u / 10)} %'` (gleiche Zahl wie `utilizationText`)             | `null`                                                                                  |
| `input`       | `def.consumes`            | «Verbrauch»  | ein Gut: `'{perMinute(1, cycleOf(b))} / min'`; mehrere: `'je … / min'` | `goodList(def.consumes)` («Wolle», «Stein und Holz»)                                    |
| `upkeep`      | immer                     | «Unterhalt»  | `'{perMinute(upkeepOf(b), UPKEEP_INTERVAL)} / min'`                    | «Geld»                                                                                  |

- **A-5** Ausstoss ist der **Nennwert der Stufe** (gleiche Grösse wie in der Ausbau-Karte); die Auslastung steht
  daneben. Kein geschätzter Ist-Wert (OF-6).
- **A-6** Unter dem Grid, über die volle Breite: **Fortschrittsbalken** (bestehendes `.progress` mit
  `data-field="progress"` auf dem Füllelement), nur mit Zyklus. Der Balken-Container trägt `role="progressbar"`,
  `aria-valuemin="0"`, `aria-valuemax="100"`, `aria-valuenow` = `progressView(b).pct`, `aria-label` = «Fortschritt
  Zyklus»; `updateInspect` setzt `aria-valuenow` nur bei Änderung.
- **A-7** Zusatzzeilen bleiben Zeilen unter dem Balken: `fire-protection` («Brandschutz: ja/nein», brennbare
  Gebäude), `fire-covers` («Schützt N brennbare Gebäude», Feuerwache).
- **A-8** Dienste (Kapelle, Schule, Badehaus, Feuerwache, Marktplatz): nur die Kachel `upkeep` plus Zusatzzeilen;
  kein Balken, keine Ausbau-Karte. Gewürzplantage (Erzeugung ohne `LEVELS`): `output`, `utilization`, `upkeep`,
  Balken; keine Ausbau-Karte.

### 5.3 Ausbau-Karte (`data-zone="upgrade"`)

Bestehendes Element `data-field="upgrade-box"` wird zur Karte (abgesetzter Rahmen innerhalb der Panel-Karte,
[Tech]: Rand `--parchment-edge`, Innenabstand). Inhalt aus `upgradeCard(world, b)`:

- **A-9** `null` → Karte `hidden` (Dienste, Gewürzplantage).
- **A-10** **`next`:** Titel «Ausbau zu Stufe n» (`level-title`); zwei Gewinn-Zeilen `gain-output` «Ausstoss 15 →
  25 / min» mit Delta-Marke «+10» (`gain-output-delta`) und `gain-upkeep` «Unterhalt 30 → 42 / min» mit «+12»;
  danach `level-cost` («Kosten 50 Geld · 3 Holz · 1 Werkzeug») und `level-fee` («Gebühr 2 Stoff») wörtlich aus
  `upgradeView`; Gründe `level-reasons` (✗-Liste wie heute); Knopf «Ausbauen» (`data-field="upgrade"`, Tooltip
  `UPGRADE_TITLE` «Ausbauen (Umschalt+U)» bleibt) mit sichtbarem Kürzel `<kbd data-field="upgrade-key">Umschalt+U</kbd>`
  im Knopf. Bei `ok === false` trägt der Knopf `unaffordable` wie heute; der Klick zeigt den Grund wie heute.
- **A-11** Delta-Marke: Text aus `GainRow.delta`; **Setzung Spec:** sie ist neutral gefärbt (Ausstoss-Plus ist gut,
  Unterhalt-Plus ist Kosten; eine Wertung per Farbe wäre irreführend). `aria-label` der Zeile = «Ausstoss von 15
  auf 25 je Minute, plus 10» [Tech: Wortlaut, solange alle drei Zahlen genannt sind].
- **A-12** **`locked`** (Funktion `upgrade2` bzw. `upgrade3` noch gesperrt): Titel «Ausbau zu Stufe n», beide
  Gewinn-Zeilen, dann `level-lock` mit dem Sperrgrund aus `functionLock` (z. B. «Erst mit den ersten Siedlern»);
  **keine** Kosten, Gebühr, Gründe, **kein** Knopf. **Setzung Spec** (heute ist die Box dann verborgen; OF-1).
- **A-13** **`max`** (Stufe 3): Titel «Höchste Stufe», keine weiteren Zeilen, kein Knopf (wie heute).
- **A-14** Wechsel zwischen `locked`, `next`, `max` läuft nur über `hidden` der Zeilen; die Karte wird nicht neu
  gebaut (G-3). Nach Ausbau per Knopf oder `Umschalt+U` zeigt das nächste `updateInspect` Stufen-Chip, Kacheln und
  Karte der neuen Stufe.

### 5.4 Knopfleiste und Fuss

- **A-15** Unverändert in Inhalt, Reihenfolge und Verhalten: «Fest feiern» (Kapelle), «Anbinden» mit
  Pfad-Vorschau und `connect-reason`, «Gleiches bauen», «Abreissen»; darunter `feast-reason` und die
  Abriss-Erstattung `refund` («Rückerstattung: …», `refundLine`).

## 6. Teil B — Wohnhaus-Panel

### 6.1 Kopf

- **B-1** Titel «Wohnhaus» (`title`; heute «Wohnhaus — Siedler»), rechtsbündig der **Stufen-Chip** mit
  Stufenname (`data-field="tier"`, z. B. «Siedler») und Pips (`tier-pips`, 1 bis 4), `aria-label` aus `tierPips`.
- **B-2** Zeile 2: **Versorgungs-Chip** (`data-field="supplied"`, `data-tone`) mit Kurztext «Versorgt» bzw.
  «Nicht versorgt» und Symbol; der bisherige Langtext steht in `title` und `aria-label` (Anhang 01 A.2).
- **B-3** Darunter wie heute: Fest-Zeile (`feast`, nur während eines Festes), Mangel-Liste (`diagnosis`), Abhilfe
  (`remedy`).

### 6.2 Kennzahlen

- **B-4** Kachel `inhabitants`: Beschriftung «Einwohner», Wert «4 / 8» (`house.inhabitants` / `TIERS[tier].
maxInhabitants`, wie heute).
- **B-5** Unter dem Grid, volle Breite: Bedarfs-Chips (`needs`, `needIcons`, unverändert ✓/✗ mit `aria-label`) und
  die Zeile «Fehlt: …» (`first-missing`, unverändert).

### 6.3 Aufstiegs-Karte

- **B-6** Bestehendes `.upgrade` des Wohnhauses wird dieselbe Karte wie in Teil A (`data-zone="upgrade"`, gleiche
  Optik). Inhalt: Titel `upgrade-title` (aus `riseCard`), **neu** die Gewinn-Zeile `gain-inhabitants` «Einwohner
  höchstens 4 → 8» mit Delta «+4», dann unverändert `upgrade-reasons`, `deficit`, `stone-hint`, `upgrade-cost`.
- **B-7** Höchste Stufe: Titel «Höchste Stufe», alle übrigen Zeilen verborgen (wie heute). Wohnhäuser haben
  keinen Knopf «Ausbauen» (sie steigen selbst auf); `Umschalt+U` meldet weiter «Kann nicht ausgebaut werden».
- **B-8** Knopfleiste («Gleiches bauen», «Abreissen») und `refund` unverändert.

## 7. Teil C — Amtsstube und Kontor (nur Kopf)

- **C-1** Beide nutzen dasselbe Kopf-Gerüst (`<header data-zone="head">` mit `h2.panel-title`), damit Titel,
  Abstand und Typografie in allen Info-Panels gleich sind.
- **C-2** Kein Stufen-Chip, kein Zustands-Chip, keine Kacheln, keine Karte. Alle übrigen Elemente (Amtsstube:
  `townhall-state`, Steuerknöpfe, `tax-effect`, `tax-lock`, Sperr-Matrix, Aufstiegsstopp, `remedy`, `upkeep`,
  `fire-protection`; Kontor: Lagerzeile, «Handeln», Schiffsabschnitt) bleiben in Inhalt und Reihenfolge wie heute.
- **C-3** Das Handel-Panel (`trade.ts`, eigene `.panel-head`) bleibt unberührt; die neuen Klassen dürfen
  `.panel-head` nicht umdefinieren [Tech: eigene Klassennamen].

## 8. Darstellung (`src/style.css`)

- **D-1** Neue `:root`-Variablen `--tone-ok`, `--tone-warn`, `--tone-bad` (Anhang 01 A.3), Grafik-Kontrast ≥ 3 : 1
  auf `--parchment` und `--parchment-edge`. Bestehende Variablen unverändert.
- **D-2** Zustands-/Versorgungs-Chip: Pergament-Grund, 1 px Rand `--wood`, linke Kante 4 px in der Tonfarbe
  (`[data-tone="ok"|"warn"|"bad"]`), Text `--ink`, fett. Stufen-Chip: Stil `.card .chip`; Pips gefüllt `--wood`,
  leer nur Umriss `--wood`.
- **D-3** Kennzahlen-Grid: `display: grid`, Abstand 4–6 px; Kachel mit Rand `--parchment-edge`, Radius 6 px;
  Wert 18 px fett, Beschriftung und Unterzeile 12–13 px; `min-width: 0` und Umbruch, damit lange Güternamen
  («Zuckerrohr · alle 5 s») nicht über die Kachel laufen. Exakte Masse [Tech].
- **D-4** Karte: wie `.upgrade` heute, zusätzlich Rahmen und Innenabstand; `[hidden]` bleibt `display: none`.
  `<kbd>` im Knopf: kleine Schrift (wie `.btn small`), sichtbarer Rahmen.
- **D-5** Höhenbudget 1280×720: Kopf, Kennzahlen und die Ausbau-Karte **bis einschliesslich Knopf «Ausbauen»**
  sind bei einer Fischerhütte Stufe 1 (Zustand «In Betrieb», ein Ausbau-Grund) ohne Scrollen im Panel sichtbar.
  Knopfleiste und Fuss dürfen bei 720 px Höhe scrollen; bei 1920×1080 ist das ganze Panel ohne Scrollen sichtbar.

## 9. Randfälle

- **Dienst ohne Erzeugung (Kapelle, Schule, Marktplatz, Feuerwache):** Kopf mit Chip «Angebunden» (`ok`) bzw. «Nicht an Kontor angebunden» (`bad`); nur Kachel Unterhalt; keine Karte
- **Nicht angebunden:** Chip `bad` «Nicht an Kontor angebunden», Abhilfe «Baue einen Weg (…) …», Knopf «Anbinden» wie heute
- **Brennt:** Chip `bad` «Brennt — wieder in Betrieb in …»; Ausstoss-Kachel Unterzeile «… · ruht, Betrieb brennt»; Karte `next` mit Grund «Gebäude brennt», Knopf `unaffordable`
- **Lager voll:** Chip `warn` «Lager voll», Abhilfe wie heute; Kacheln unverändert
- **Wartet auf Rohstoff:** Chip `warn` «Wartet auf Wolle» (fehlende Güter aus `missingInputs`), Kachel Verbrauch zeigt den Bedarf
- **Kein Wald / Dienst fehlt (Holzfäller, Werkzeugmacher):** Chip `bad` mit dem Text aus `stateInfo`
- **Ausbau vor U3 bzw. Stufe 2 vor U5:** Karte `locked`: Titel, Gewinn-Zeilen, Sperrgrund; kein Knopf (A-12)
- **Stufe 3:** Karte «Höchste Stufe», kein Knopf; Stufen-Chip ●●●
- **Zu wenig Geld oder Gebührenware:** Karte `next`, Grund «✗ Zu wenig Stoff» o. Ä., Knopf `unaffordable` (wie heute)
- **Gebäude nicht ausbaubar mit Erzeugung (Gewürzplantage):** keine Karte, kein Stufen-Chip
- **Wohnhaus höchste Stufe (Kaufleute):** Aufstiegs-Karte «Höchste Stufe», keine Gewinn-Zeile
- **Wohnhaus nicht versorgt:** Versorgungs-Chip `bad` «Nicht versorgt», Langtext im Tooltip
- **Gebäude wird während offenem Panel abgerissen/brennt ab:** wie heute: `setPanel({ kind: 'none' })` in `app.ts` (unberührt)
- **Auswahl wechselt zu anderem Gebäude:** `renderInspect` baut neu (wie heute)
- **Ausbau während offenem Panel:** kein Neuaufbau; nächstes Update zeigt neue Stufe, neue Kacheln, neue Karte (A-14)
- **Fenster < 900 px:** Panel unter der Karte, Kacheln brechen um, kein waagrechtes Scrollen, kein Absturz
- **Alter Spielstand:** unberührt; kein Save-Feld, keine Migration

## 10. Datenmodell, Save, Werte

Kein neues Feld in `World` oder `Building`, **keine neue Save-Version**, keine Migration, kein Eintrag in
`src/sim/defs/`. Alle Zahlen kommen aus `src/sim/defs/levels.ts` (`LEVELS`: Zyklus, Unterhalt, Kosten, Gebühr),
`src/sim/defs/buildings.ts` (`cycle`, `upkeep`, `produces`, `consumes`), `src/sim/defs/tiers.ts`
(`maxInhabitants`, Namen) und `src/sim/defs/timing.ts` (`TICK_MS`, `EFF_WINDOW`) über die bestehenden Abfragen.
Balancing-Test, Baseline und Fingerabdruck bleiben bitgleich.

## 11. Abnahmekriterien

### 11.1 Vitest

Neue Datei `tests/ui/panelView.test.ts`, sofern nicht anders genannt. Testwelten wie in `tests/ui/inspect.test.ts`
(`createWorld(3, { unlockAll: true })`, Betrieb roh einsetzen mit `put`). Erwartungen aus Anhang 01 A.5; Zahlen
aus Defs werden im Test über `perMinute`/`TIERS` berechnet, wo die Spec das sagt.

- **AK-PU-01** `stateTone` je Zeile von Anhang 01 A.1: brennend (`outageUntil` gesetzt) → `bad`; nicht angebunden
  → `bad`; Kapelle angebunden → `ok`; Fischer `ok` und `notConnected` (angebunden) → `ok`; Weberei `waitingInput`
  → `warn`; `storageFull` → `warn`; `burning` → `bad`; Holzfäller `noForest` → `bad`; Werkzeugmacher `noService` →
  `bad`.
- **AK-PU-02** Invariante: für jede `defId` mit Panel-Zweig A × jeden `BuildingState` × `connected` ∈ {true,
  false} × brennend ∈ {ja, nein} gilt `(stateTone(b) === 'ok') === stateInfo(b, 0).ok`; `noService` nur für
  Typen mit `requiresService` (sonst ist der Zustand im Spiel unmöglich).
- **AK-PU-03** `stateChip`: Text = `stateInfo(b, tick, missingInputs(w, b)).text` (Glashütte mit `state
'waitingInput'`, Holz ≥ 1, Stein 0: «Wartet auf Stein»), `label` = «Zustand: » + Text; `TONE_SYMBOL` = `{ ok: '✓', warn: '!', bad: '✗' }`.
- **AK-PU-04** `levelPips`: Fischer ohne `level` → `{ level: 1, max: 3, label: 'Stufe 1 von 3' }`; `level: 3` →
  `level 3`; Kapelle, Gewürzplantage, Wohnhaus → `null`. `tierPips`: Wohnhaus Stufe 2 → `{ level: 2, max:
Object.keys(TIERS).length, label: '{TIERS[2].name}, Stufe 2 von 4' }`; Fischer → `null`.
- **AK-PU-05** `supplyChip`: versorgtes Haus → `{ text: 'Versorgt', tone: 'ok', label: 'Versorgung: ✓ im Radius' }`;
  unversorgt → `{ text: 'Nicht versorgt', tone: 'bad', label: 'Versorgung: ✗ ausserhalb von Kontor/Markt' }`;
  Fischer → `null`.
- **AK-PU-06** `statTiles` Fischerhütte Stufe 1 ohne `eff` → genau `[output «15 / min» «Nahrung · alle 4 s»,
utilization «100 %», upkeep «30 / min» «Geld»]` (Labels laut 5.2); Stufe 2 → output «25 / min» «Nahrung · alle
  3 s», upkeep «42 / min»; `eff` 94 208 → utilization «36 %» (gleiche Zahl wie `utilizationText`).
- **AK-PU-07** `statTiles` Weberei → enthält `input` «12 / min» / «Wolle» zwischen `utilization` und `upkeep`;
  Glashütte → `input` «je 12 / min» / «Stein und Holz»; Gewürzplantage → Schlüssel `[output, utilization, upkeep]`.
- **AK-PU-08** `statTiles` Kapelle → genau `[upkeep]`; brennende Fischerhütte → output-`sub` «Nahrung · ruht,
  Betrieb brennt», `value` unverändert «15 / min».
- **AK-PU-09** `houseTiles`: Haus Stufe 1 mit 3 Einwohnern → `[inhabitants «3 / {TIERS[1].maxInhabitants}»]`;
  Fischer → `[]`.
- **AK-PU-10** `upgradeCard` Fischer Stufe 1, alles freigeschaltet, genug Mittel → `kind 'next'`, `title`,
  `cost`, `fee`, `reasons`, `ok` gleich `upgradeView(w, f)`; `gains` = output 15 → 25 «+10», upkeep 30 → 42 «+12»;
  `key === 'Umschalt+U'`; `serialize(w)` vor und nach dem Aufruf gleich.
- **AK-PU-11** `upgradeCard` Gründe: Stoff 0 → `reasons ['✗ Zu wenig Stoff']`, `ok false`; brennend → `ok false`,
  ein Grund mit «brennt».
- **AK-PU-12** `upgradeCard` gesperrt: `createWorld(3)` Fischer → `kind 'locked'`, `title 'Ausbau zu Stufe 2'`,
  `lock === functionLock(w, 'upgrade2')`, `gains` wie AK-PU-10, keine Felder `cost`/`fee`; Fischer Stufe 2 in einer
  Welt ohne U5 → `locked`, `title 'Ausbau zu Stufe 3'`, `lock === functionLock(w, 'upgrade3')`.
- **AK-PU-13** `upgradeCard` Stufe 3 → `{ kind: 'max', title: 'Höchste Stufe' }`; Kapelle, Gewürzplantage, Wohnhaus
  → `null`.
- **AK-PU-14** `upgradeGain` Rundung und Format: Fischer 2 → 3: output 25 → 37.5, `delta '+12.5'`; upkeep 42 → 54,
  `'+12'`; Steinbruch 1 → 2: output 10 → 16.7, `delta '+6.7'` (nicht 6.699…); `text` = «10 → 16.7 / min».
- **AK-PU-15** `riseCard`: Pioniere → Titel «Aufstieg zu {TIERS[2].name}», `gain.label` «Einwohner höchstens»,
  `gain.text` «{max1} → {max2}», `delta` `signedNum(max2 − max1)`; höchste Stufe → `{ title: 'Höchste Stufe', gain: null }`.
- **AK-PU-16** `progressView`: Fischer `progress` 20 bei Zyklus 40 → `{ pct: 50, label: 'Fortschritt 50 %' }`
  (gleich `progressPct`); Kapelle → `null`.
- **AK-PU-17** Struktur-Stabilität: für jede `defId` aus Teil A und jede Variation (Stufe 1–3, wo erlaubt;
  `eff`; `state`; `connected`; brennend) gilt `statTiles(b).map(t => t.key)` deepEqual `statKeys(b.defId)`.
- **AK-PU-18** Regression: `tests/ui/inspect.test.ts` läuft **ohne geänderte Erwartungen** grün
  (`git diff main -- tests/ui/inspect.test.ts` enthält keine entfernten oder geänderten `expect`-Zeilen);
  `upgradeView`, `levelText`, `utilizationText`, `upkeepText`, `progressPct`, `needIcons`, `stateInfo`,
  `buildSameShown`, `UPGRADE_TITLE` bleiben exportiert (Anhang 02 B.4).
- **AK-PU-19** Kontrast (`tests/ui/contrast.test.ts`): `--tone-ok`, `--tone-warn`, `--tone-bad` je ≥ 3 : 1 auf
  `--parchment` und auf `--parchment-edge`; bestehende Paare unverändert grün.
- **AK-PU-20** CSS-Regeln (`tests/ui/contrast.test.ts`, Muster wie «Boom-Marke bleibt mit hidden verborgen»): die
  Regel für das Kennzahlen-Grid enthält `display: grid`; für jeden Ton gibt es eine Regel `[data-tone='…']` mit der
  passenden Variable; versteckte Zeilen in der Karte haben `display: none` (Selektor-Namen [Tech], im Test
  benannt).
- **AK-PU-21** Gesamtlauf: `make test` grün inkl. `tests/sim/balance.test.ts`; `git diff main -- src/sim` leer;
  `SAVE_VERSION` unverändert 9 (Prüfung lead-qa).

### 11.2 Browser (qa-playtester, Headless-Chrome)

Screenshots unter `.studio/qa/panel-uebersicht/`, Dateiname `<ak>-<breite>x<höhe>.png`; Auflösungen **1280×720**
und **1920×1080**, sofern nicht anders genannt. Testwelt mit `unlockAll` bzw. Dev-Parameter, wie in bisherigen
QA-Läufen.

- **AK-PU-22** Fischerhütte Stufe 1, «In Betrieb»: Panel zeigt `[data-zone="head"]`, `[data-zone="stats"]`,
  `[data-zone="upgrade"]` in dieser Reihenfolge; Kopf mit «Fischerhütte», Chip «Stufe 1» mit ●○○, Zustands-Chip
  «In Betrieb» mit `data-tone="ok"` und grüner Kante; Kacheln Ausstoss «15 / min», Auslastung, Unterhalt «30 / min»
  in zwei Spalten. Bei 1280×720: Unterkante von `[data-field="upgrade"]` ≤ Unterkante von `#panel`
  (`getBoundingClientRect`, `#panel.scrollTop === 0`) (D-5). Bei 1920×1080: `#panel.scrollHeight ≤ clientHeight`.
- **AK-PU-23** Zustände: Weberei ohne Wolle → Chip «Wartet auf Wolle», `data-tone="warn"`, Abhilfe sichtbar,
  Kachel Verbrauch «12 / min» / «Wolle»; Weg zum Kontor entfernen → «Nicht an Kontor angebunden», `bad`, Knopf
  «Anbinden»; Lager des Guts voll → «Lager voll», `warn`; Betrieb in Brand (Krise «Brand» oder Dev-Parameter) →
  `bad`, Ausstoss-Unterzeile «… ruht, Betrieb brennt». Je ein Screenshot (nur 1280×720).
- **AK-PU-24** Ausbau-Karte `next`: Zeilen «Ausstoss 15 → 25 / min» mit «+10» und «Unterhalt 30 → 42 / min» mit
  «+12», Kosten, Gebühr; Knopf «Ausbauen» mit sichtbarem «Umschalt+U» und Tooltip «Ausbauen (Umschalt+U)». Klick
  (genug Mittel) → ohne Panel-Schliessen: Chip «Stufe 2» ●●○, Kachel Ausstoss «25 / min», Karte zeigt Stufe 3
  (`next` oder `locked`). `Umschalt+U` wirkt gleich (AK-TK-29 bleibt grün).
- **AK-PU-25** Ausbau gesperrt und höchste Stufe: frische Welt (vor U3) → Karte «Ausbau zu Stufe 2» mit
  Gewinn-Zeilen und Sperrgrund «Erst mit den ersten Siedlern», kein Knopf `[data-field="upgrade"]` sichtbar;
  Fischer Stufe 3 → Karte «Höchste Stufe», kein Knopf, Chip ●●●. Zu wenig Stoff → Grund «✗ Zu wenig Stoff»,
  Knopf blass.
- **AK-PU-26** Ohne Ausbau: Kapelle → Chip «Angebunden», nur Kachel Unterhalt, kein Balken, keine Karte, Knopf «Fest
  feiern» vorhanden; Gewürzplantage → Kacheln Ausstoss/Auslastung/Unterhalt, kein Stufen-Chip, keine Karte;
  Feuerwache → Zeile «Schützt N brennbare Gebäude».
- **AK-PU-27** Wohnhaus Siedler: Kopf «Wohnhaus», Chip «Siedler» ●●○○, Versorgungs-Chip «Versorgt» (`ok`); Kachel
  Einwohner «x / 8»; Bedarfs-Symbole wie bisher; Aufstiegs-Karte mit «Einwohner höchstens 8 → 15» und Gründen;
  unversorgtes Haus → «Nicht versorgt» (`bad`), Tooltip mit Langtext; Haus Kaufleute → «Höchste Stufe».
- **AK-PU-28** Amtsstube und Kontor: Titel im Kopf-Gerüst (`[data-zone="head"] .panel-title`); alle übrigen
  Elemente laut C-2 vorhanden und in gleicher Reihenfolge wie auf `main` (Vergleichs-Screenshot `main` vs.
  Branch, beide 1280×720).
- **AK-PU-29** Kein Flackern, Fokus bleibt: Fischerhütte bei Tempo 4×, Knopf «Ausbauen» per Tab fokussieren;
  Referenzen auf `[data-field="upgrade"]`, `[data-field="stat-output"]` und `[data-field="state"]` merken; 5 s
  warten → `document.activeElement` ist derselbe Knoten, alle drei Referenzen `===` aktuelle `querySelector`-Treffer
  (kein Neuaufbau), Balken bewegt sich (`aria-valuenow` ändert sich).
- **AK-PU-30** Zugänglichkeit: Zustands-Chip hat `aria-label` «Zustand: …»; Stufen-Chip «Stufe n von 3»; Pips
  `aria-hidden="true"`; Balken mit `role="progressbar"` und `aria-valuenow`; kein `aria-live` am Zustands-Chip.
  Graustufen-Screenshot (CSS `filter: grayscale(1)` per DevTools) von AK-PU-23: alle Zustände sind am Text und am
  Symbol ✓/!/✗ unterscheidbar.
- **AK-PU-31** Schmale Fenster 800×600 und 1000×700: Panel öffnet für Fischerhütte, Weberei und Wohnhaus ohne
  Konsolenfehler; `#panel.scrollWidth ≤ #panel.clientWidth`; Kacheln überlappen nicht (Screenshot).
- **AK-PU-32** Knopfleiste und Fuss: «Gleiches bauen», «Anbinden» (wenn nötig), «Abreissen», «Fest feiern»
  (Kapelle) wie auf `main`; Zeile «Rückerstattung: …» vorhanden; Abriss funktioniert und schliesst das Panel.
- **AK-PU-33** README-Absatz «Info-Panel» entspricht dem Verhalten (Prüfung lead-qa beim Gate Code).

**Zählung:** 21 Vitest-AKs (AK-PU-01 bis 21), 12 Browser-AKs (AK-PU-22 bis 33), zusammen 33.

## 12. Offene Designfragen

- **OF-1 Ausbau-Karte vor Freischaltung sichtbar oder verborgen?** Heute verborgen (`upgradeView` → `null`).
  Empfehlung: **sichtbar als kompakte `locked`-Karte** (Titel, Gewinn, Sperrgrund, kein Knopf). Sie zeigt dem
  Spieler früh, wozu der Aufstieg zu Siedlern gut ist, und macht den Ausbau entdeckbar; kostet drei Zeilen.
  Alternative: verborgen wie heute (A-12 entfällt, AK-PU-12/25 werden zu «Karte `hidden`»).
- **OF-2 Stufe als Pips oder Text?** Empfehlung: **beides** — Text «Stufe 2» (bleibt `levelText`, Hover nutzt ihn)
  plus Pips für den schnellen Blick; Pips allein wären ohne Legende unklar, Text allein gliedert schlechter.
- **OF-3 Kennzahlen als Kacheln oder Tabelle?** Empfehlung: **Kacheln** im 2-Spalten-Grid: grosse Zahl zuerst, in
  280 px lesbar, entspricht Card-UI. Eine Tabelle braucht eine Spalte für Beschriftungen und wird bei vier Werten
  länger als die Kacheln.
- **OF-4 Gewinn als absolutes Delta oder Vorher→Nachher?** Empfehlung: **beides in einer Zeile** («15 → 25 / min»
  plus Marke «+10»): Vorher→Nachher ist die Grösse aus `upgradeView.preview` (bekannt), das Delta beantwortet die
  Frage «was bringt es» auf einen Blick. Prozentangaben nicht (doppelte Information).
- **OF-5 Panel-Breite und -Höhe im 1280-px-Layout?** Empfehlung: **280 px beibehalten**; zwei Kacheln à ca.
  125 px passen, und die Karte behält ihre Fläche. Höhe: Panel scrollt wie heute; Pflicht ist nur D-5 (Kopf bis
  Ausbau-Knopf ohne Scrollen bei 720 px). Breiter (z. B. 320 px ab 1280 px) erst, wenn der Browser-Check D-5 nicht
  erfüllt; dann als eigene Entscheidung, weil die Karte schmaler wird.
- **OF-6 Geschätzter Ist-Ausstoss (Nennwert × Auslastung)?** Empfehlung: **nein** in diesem Paket. Die Auslastung
  ist ein geglätteter Wert; ein abgeleiteter «≈ 9 / min» suggeriert Messgenauigkeit, die es nicht gibt. Bei
  Playtest-Wunsch als eigene Idee.
- **OF-7 Tonfarben der bestehenden Listen `.needs`/`.reasons`?** Ihre Kanten (`--ok` 2,25 : 1, `--signal-red`
  2,73 : 1 auf Pergament) liegen unter 3 : 1. Empfehlung: in diesem Paket **nicht** anfassen (Scope); lead-design
  trägt den Befund in `docs/beobachtungen.md` ein, Umstellung auf `--tone-*` als Kleinst-Folgepaket.

## 13. Doku-Folgen

- **README «Info-Panel»** (Abschnitt Grundregeln, heute Z. 268–272) neu fassen, sinngemäss: «Das Info-Panel eines
  Betriebs hat drei Teile: oben Name, Stufe (Stufe 1–3 mit Punkten) und Zustand als farbig umrandeter Chip
  (✓ läuft, ! wartet, ✗ steht) mit Abhilfe; darunter Kacheln für Ausstoss und Verbrauch je Minute, Auslastung und
  Unterhalt sowie der Fortschritt; unten die Ausbau-Karte mit dem Gewinn des nächsten Ausbaus (Ausstoss und
  Unterhalt vorher → nachher), Kosten, Gebühr und dem Knopf «Ausbauen» (`Umschalt` + `U`). Vor der Freischaltung
  nennt die Karte, wann der Ausbau möglich wird. Das Wohnhaus zeigt Stufe, Versorgung, Einwohner, Bedarfe und die
  Aufstiegs-Karte im gleichen Aufbau.» Sätze zu «Gleiches bauen» und Mouse-over bleiben.
- **`docs/arc42.md`** (Bausteinsicht UI, Tabelle Z. ~255–285): neue Zeile `panelView.ts` («Info-Panel, rein:
  Zustandston, Chips, Pips, Kennzahl-Kacheln, Ausbau- und Aufstiegs-Karte aus bestehenden Abfragen; `inspect.ts`
  rendert nur») und Zeile `inspect.ts` anpassen (Zonen statt Zeilen). Kein Tick-, Persistenz- oder Modulgrenzen-
  Bezug.
- Keine ADR nötig (keine Abhängigkeit, kein Architekturentscheid; reine Darstellung in `src/ui/`).

## 14. Grössenschätzung

Gesamt **M** (wie I-026). Ein Branch, vier Tasks; Helfer zuerst (TDD), dann Gerüst, dann Optik.

1. **T1 `panelView.ts` (rein, TDD):** Typen, `stateTone`, Chips, Pips, `statTiles`/`statKeys`/`houseTiles`,
   `upgradeGain`, `upgradeCard`, `riseCard`, `progressView`. AK-PU-01 bis 17. Gross: ca. 200 Zeilen Code, 250 Zeilen
   Tests.
2. **T2 Gerüst Teil A und C in `inspect.ts`:** Zonen, Chips, Kacheln, Karte inkl. `locked`; `updateInspect` auf
   `data-field`-Namen aus Anhang 02; keine Knoten-Neuerzeugung im Update. AK-PU-18, 22 bis 26, 28, 29, 32. Mittel.
3. **T3 Wohnhaus Teil B:** Kopf, Kachel, Aufstiegs-Karte mit Gewinn-Zeile. AK-PU-27. Klein.
4. **T4 CSS, Zugänglichkeit, Doku:** `:root`-Töne, Grid, Chips, Karte, `kbd`; ARIA; Kontrast-/CSS-Tests; README,
   arc42. AK-PU-19, 20, 30, 31, 33. Klein bis mittel.

Risiken: Höhenbudget D-5 bei 720 px (Mitigation OF-5); Merge-Konflikte nur, falls parallel jemand `inspect.ts`
ändert; Browser-Checks brauchen Testwelten für Brand und volles Lager (Dev-Parameter vorhanden laut bisherigen
QA-Läufen, sonst Hinweis an lead-qa).
