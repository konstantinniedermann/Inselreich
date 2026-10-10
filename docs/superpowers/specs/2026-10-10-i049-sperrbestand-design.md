# I-049 Sperrbestand (Reserve je Gut) — Kurzdesign

- Stufe: leicht (Kurzdesign, keine volle Spec) · Paket: `design-i049-reserve` · Quelle: `docs/ideen.md` I-049 (IDEEN-06, R474, R475)
- Säule: Produktionsketten (gestärkt); Bevölkerung versorgen (geschützt, weil der Ausbau nicht mehr am Holz der Werkstätten scheitert)
- Autor: lead-design · Stand: 2026-10-10

## 1 Spielerzweck

**In einem Satz:** Der Spieler legt am Kontor «Holz: Reserve 20» fest, und Werkzeugmacher und Glashütte nehmen nur noch Holz, solange mehr als 20 im Lager liegen, damit Holz zum Bauen übrig bleibt.

**Spürbar in 15 Minuten:** Im Frühspiel zieht der Werkzeugmacher das Holz ab, das für Häuser, Markt und Aufstieg fehlt. Heute hilft nur Abreissen oder Stilllegen. Mit der Reserve wird daraus eine Abwägung zwischen Bauen und Produzieren, die sich selbst auflöst, sobald genug Holz da ist.

**Schleifen:** kurzer Handgriff (Reserve am Kontor setzen) · Ziel in Minuten (Bauwelle ohne Holzmangel) · über die Partie (Reserve wieder senken, wenn die Kette trägt).

## 2 Regeln

### R1 Reserve-Güter

Eine Reserve gibt es nur für **Holz und Stein**. Das sind die Güter, die zugleich Baumaterial und Betriebs-Input sind (Holz: Werkzeugmacher, Glashütte; Stein: Glashütte). Werte in `src/sim/defs/` (z. B. `defs/goods.ts` oder `defs/reserve.ts`):

| Name            | Wert                | Bedeutung                   |
| --------------- | ------------------- | --------------------------- |
| `RESERVE_GOODS` | `['wood', 'stone']` | Güter mit Reserve           |
| `RESERVE_STEPS` | `[0, 20, 40, 60]`   | erlaubte Stufen; Standard 0 |

Haushaltsgüter (Nahrung, Stoff, Rum, Glas, Gewürz) stehen nie in `RESERVE_GOODS`. So hungert kein Haus wegen der Reserve, und das gilt schon durch die Daten, nicht erst durch eine Sonderregel. Wolle und Zuckerrohr bekommen keine Reserve: Sie haben keinen Bauzweck, eine Reserve würde dort nur die Kette anhalten.

### R2 Wirkung nur auf Betriebe

Ein Betrieb mit `consumes` entnimmt bei `progress === 0` seine Inputs wie bisher atomar (M8 5.3). Die Prüfreihenfolge in `advance` wird um einen Schritt ergänzt:

1. Ist bei einem Input-Gut `stock < 1`: Zustand `waitingInput` (unverändert; fehlende Ware hat Vorrang).
2. Sonst: Ist bei einem Input-Gut `stock ≤ reserve(insel, gut)`: neuer Zustand **`waitingReserve`**. Es wird nichts entnommen, `progress` bleibt 0.
3. Sonst: je Input 1 Einheit entnehmen (unverändert).

`reserve(insel, gut)` ist der Wert der Insel für Holz bzw. Stein, für alle anderen Güter 0. Bei Reserve 0 ist Schritt 2 dasselbe wie heute (`stock ≥ 1` ⇔ `stock > 0`), daher bitgleich.

Die Reserve wirkt **nicht** auf Bauen, Ausbau (Stufe 2/3), Hausaufstieg (`upgradeCost`), Kauf und Verkauf am Kontor, Handelsauftrag, Fest (Rum), Haushaltsbedarf und Schiffsladung (Routen haben ihre eigene Reserve, `ROUTE_RESERVE`). Genau diese Verbraucher soll sie schützen.

Ein laufender Zyklus (`progress > 0`) läuft zu Ende; die Reserve greift erst bei der nächsten Entnahme. Ein Betrieb in `waitingReserve` zählt für die Auslastung `eff` wie `waitingInput` (Ziel 0) und zahlt vollen Unterhalt.

### R3 Je Insel

Die Reserve gilt **je Insel** (Empfehlung, siehe E1): `Island.reserve: Record<'wood' | 'stone', 0 | 20 | 40 | 60>`. Jede Insel hat ein eigenes Lager (M12), der Handelsdialog ist je Insel, und Routen-Reserven sind auch je Hafen. Eine Kolonie mit Werkzeugmacher und eine Heimat in der Bauphase brauchen verschiedene Werte.

### R4 Sim-Aktion

`setReserve(world, island, good, value): Result` wirft nie und liefert `{ ok, reason }`:

| Fall                                    | Ergebnis                                |
| --------------------------------------- | --------------------------------------- |
| Insel unbekannt                         | `fail('Unbekannte Insel')`              |
| Insel ohne Kontor (`kontorId === null`) | `fail` mit dem Text von `noKontorTrade` |
| Gut nicht in `RESERVE_GOODS`            | `fail('Keine Reserve für <Gut>')`       |
| Wert nicht in `RESERVE_STEPS`           | `fail('Ungültige Reserve')`             |
| sonst                                   | setzt den Wert, `ok`                    |

Kostet nichts, hat keine Sperrzeit und ist auch in der Pause erlaubt (wie der Handelsdialog). Eine eigene Freischaltung gibt es nicht: Die Reserve steht dort, wo der Handelsdialog der Insel offen ist.

### R5 Bedienung (Handelsdialog des Kontors)

Der Gut-Chip ist seit I-043 mit dem Fokus-Klick belegt. Die Reserve steht deshalb im Handelsdialog (`src/ui/trade.ts`), in den Zeilen Holz und Stein:

- Anzeige «Reserve 20» mit Knöpfen − und + (Schritt 20, 0 bis 60), wie die Routen-Reserve in `src/ui/ships.ts`.
- Tooltip: «Betriebe nehmen Holz nur, solange mehr als 20 im Lager liegen. Bauen, Handel und Schiffe sind frei.»
- Ist die Reserve > 0 und stehen auf dieser Insel Betriebe wegen ihr: Zusatz «hält 2 Betriebe an» (Anzahl der Betriebe der Insel in `waitingReserve`, deren `consumes` das Gut enthält und bei denen `stock ≤ reserve` gilt).

### R6 Zustand und Texte

| Ort                            | Text bzw. Wirkung                                                                                                                                  |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Panel (`stateInfo`)            | «Wartet auf Holz (Reserve)»; bei mehreren Gütern «Wartet auf Stein, Holz (Reserve)» (über `goodList`) · `ok: false` · Ton `warn` (wie Stilllegung) |
| Hover (`workshopInfo`)         | «wartet auf Holz (Reserve)»                                                                                                                        |
| Hinweis (`guide.ts`)           | «Senke die Reserve für Holz im Handel am Kontor oder baue <Erzeuger>»                                                                              |
| Statusmarke (`statusMarks.ts`) | keine (bewusster Halt wie Stilllegung; `statusMarkOf` liefert für unbekannte Zustände schon `null`)                                                |
| Tageslicht (`daynight.ts`)     | dunkel wie die anderen stehenden Betriebe                                                                                                          |
| Gut-Fokus (I-043)              | Verbraucher in `waitingReserve` erscheinen in der Liste mit dem Panel-Text oben                                                                    |

Eine neue Abfrage `reservedInputs(world, b)` liefert die Input-Güter mit `1 ≤ stock ≤ reserve` (Reihenfolge wie `consumes`), als Gegenstück zu `missingInputs`.

### R7 Problemliste (`.`/`,`, I-042)

Die Reserve ist ein **Grund, kein Fehler**: Ein Betrieb in `waitingReserve` erzeugt keinen Eintrag, wie ein stillgelegter Betrieb. Stehen nur solche Betriebe, bleibt «Alles versorgt, kein Problem offen». Gefunden werden sie über den Gut-Fokus (R6) und den Zusatz im Handelsdialog (R5).

### R8 Wechselwirkungen

- **Stilllegen (M13-E1):** `paused` steht in der Prüfreihenfolge vor der Reserve. Ein stillgelegter Betrieb zeigt nie `waitingReserve`. Die beiden Werkzeuge ergänzen sich: Stilllegen hält einen Betrieb dauerhaft an und halbiert den Unterhalt. Die Reserve hält alle Verbraucher eines Gutes nur in Mangelphasen an, bei vollem Unterhalt.
- **Gut-Fokus (I-043):** unverändert bedient; nur der Zustandstext ist neu (R6).
- **Edikte, Krisen, Sturm:** keine Wechselwirkung. Brand und Sturm stehen in der Prüfreihenfolge vorher.
- **Handelsauftrag, Verkauf:** dürfen unter die Reserve gehen. Das ist der Spielerwille im Augenblick des Klicks.

## 3 Save

- Neues Feld `Island.reserve` je Insel, immer vollständig geschrieben (`{ wood, stone }`).
- **Save-Version: die nächste freie Nummer zum Zeitpunkt des Plans** (heute ist `SAVE_VERSION` 11; M13-E2 und I-048 planen parallel). Bringt eines davon schon eine Versionserhöhung mit, die noch nicht auf `main` ist, kann I-049 sie mitbenutzen. Das legt `lead-tech` im Plan fest.
- Migration vorher → neu: jede Insel bekommt `reserve: { wood: 0, stone: 0 }`; sonst ändert sich nichts.
- Prüfung beim Laden: Werte nur aus `RESERVE_STEPS`, sonst `{ ok: false }`. `waitingReserve` kommt in die Liste `BUILDING_STATES`.
- Neue Welten (`world.ts`, `mapgen.ts`, Gründung von Fremdinseln) legen das Feld mit 0 an.

## 4 Wirtschaft und Balancing

- Keine Werte ändern sich; alle Reserven stehen auf 0. Der Balancing-Test bleibt unberührt, und die Baseline (Controller) ist bitgleich, weil der Controller die Reserve nie setzt.
- **Echte Wahl:** Mit Reserve 20 steht der Werkzeugmacher, solange Holz knapp ist. Dann fehlt später Werkzeug (Kauf 40 je Stück). Ohne Reserve fehlt Holz zum Bauen (Kauf 10 je Stück). Keine Option dominiert.
- **Entartung:** Reserve 60 bei schwacher Holzerzeugung legt Werkzeug und Glas lahm. Das ist sichtbar (Panel, Fokus, «hält n Betriebe an») und mit einem Klick behoben. Ein endloser Überschuss entsteht nicht, weil die Reserve keine Ware erzeugt.

## 5 Nicht im Umfang

- Reserve für andere Güter, Priorität je Betrieb (z. B. «Glashütte vor Werkzeugmacher»), globale Reserve über alle Inseln.
- Wirkung auf Schiffsladung (bleibt bei `ROUTE_RESERVE`), auf Verkauf oder Handelsauftrag, Warnungen beim Verkauf unter die Reserve.
- Neue Statusmarke, neuer Klang, Tastenkürzel, Reserve am Gut-Chip.

## 6 Abnahmekriterien

| AK       | Kriterium                                                                                                                                                                                                                                                                                                   | Prüfung              |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| AK-SB-01 | `RESERVE_GOODS` = Holz, Stein und `RESERVE_STEPS` = 0/20/40/60 stehen in `src/sim/defs/`; keines der Haushaltsgüter aus `TIERS[*].needs` ist ein Reserve-Gut.                                                                                                                                               | Vitest               |
| AK-SB-02 | Holz 21, Reserve 20, Werkzeugmacher bei `progress 0`: entnimmt 1 Holz, Lager 20, Zustand nicht `waitingReserve`.                                                                                                                                                                                            | Vitest               |
| AK-SB-03 | Holz 20, Reserve 20: keine Entnahme, `progress` 0, Zustand `waitingReserve`; `reservedInputs` = `['wood']`.                                                                                                                                                                                                 | Vitest               |
| AK-SB-04 | Holz 0, Reserve 20: Zustand `waitingInput` (fehlende Ware hat Vorrang), `reservedInputs` leer.                                                                                                                                                                                                              | Vitest               |
| AK-SB-05 | Glashütte, Stein 0 und Holz 10 bei Holz-Reserve 20: `waitingInput` mit `missingInputs` = `['stone']`. Stein 15 und Holz 10: `waitingReserve`, beide Lager unverändert (atomar).                                                                                                                             | Vitest               |
| AK-SB-06 | Läuft ein Zyklus (`progress > 0`), wenn die Reserve gesetzt wird, endet er normal; erst die nächste Entnahme wird gesperrt.                                                                                                                                                                                 | Vitest               |
| AK-SB-07 | Bei Reserve 20 und Holz 15 gelingen Bauen, Ausbau, Hausaufstieg, Verkauf, Handelsauftrag und Schiffsladung (mit Routen-Reserve 10) wie ohne Reserve.                                                                                                                                                        | Vitest               |
| AK-SB-08 | Stillgelegter Betrieb bei Holz ≤ Reserve: Zustand `paused`, nie `waitingReserve`.                                                                                                                                                                                                                           | Vitest               |
| AK-SB-09 | `setReserve` liefert die fünf Fälle aus R4; ungültige Eingaben ändern die Welt nicht.                                                                                                                                                                                                                       | Vitest               |
| AK-SB-10 | Reserve je Insel: Reserve 40 auf der Heimat lässt den Werkzeugmacher einer Kolonie mit Holz 30 laufen.                                                                                                                                                                                                      | Vitest               |
| AK-SB-11 | Save: Rundlauf erhält `reserve`; ein Stand der Vorversion lädt mit `reserve` 0 auf jeder Insel; Wert 30 oder ein unbekanntes Gut im Stand → `ok: false`; `waitingReserve` wird als Zustand angenommen.                                                                                                      | Vitest               |
| AK-SB-12 | Bitgleichheit: Ein Lauf über N Schritte mit allen Reserven 0 ergibt denselben serialisierten Zustand (ohne das neue Feld) wie vor der Änderung; Balancing-Test und Baseline grün ohne Neumessung.                                                                                                           | Vitest               |
| AK-SB-13 | `stateInfo` liefert «Wartet auf Holz (Reserve)», `ok: false`, Ton `warn`; bei der Glashütte mit beiden Gütern gesperrt «Wartet auf Stein, Holz (Reserve)». Hover und Hinweistext wie R6.                                                                                                                    | Vitest (`tests/ui/`) |
| AK-SB-14 | Problemliste: Ein Betrieb in `waitingReserve` erzeugt keinen Eintrag; ist er der einzige stehende, lautet der Text `NO_PROBLEM_TEXT`.                                                                                                                                                                       | Vitest (`tests/ui/`) |
| AK-SB-15 | Gut-Fokus Holz: Ein Verbraucher in `waitingReserve` steht in `focusList`, `focusMessage` endet mit «Wartet auf Holz (Reserve)».                                                                                                                                                                             | Vitest (`tests/ui/`) |
| AK-SB-16 | Handelsdialog: Die Zeilen Holz und Stein zeigen «Reserve 0» mit −/+; + dreimal → 60, ein weiteres + bleibt 60; − bei 0 bleibt 0. Andere Zeilen haben keine Reserve. Zusatz «hält 1 Betrieb an» erscheint, sobald ein Werkzeugmacher wegen der Reserve steht. Kein Umbruch und keine Überlappung ab 1280 px. | Browser-Check        |
| AK-SB-17 | Statusmarke: `statusMarkOf('waitingReserve')` ist `null`.                                                                                                                                                                                                                                                   | Vitest               |

## 7 Offene Entscheide (an L0)

- **E1 Je Insel oder global?** Empfehlung **je Insel**. Lager, Handelsdialog und Routen-Reserve sind schon je Insel. Global würde dieselbe Zahl auf Heimat und Kolonie erzwingen, obwohl die eine baut und die andere produziert. Der Mehraufwand ist ein Feld je Insel statt eines in der Welt.
- **E2 Welche Güter?** Empfehlung **nur Holz und Stein** (R1). Wolle und Zuckerrohr hätten nur die Wirkung «Kette anhalten», das kann Stilllegen besser.
- **E3 Schiffsladung einbeziehen?** Empfehlung **nein**. Routen haben eine eigene, sichtbare Reserve; zwei Reserven, die sich gegenseitig überdecken, wären schwer zu durchschauen. Kommt in einem Playtest der Wunsch auf, ist `max(Routen-Reserve, Insel-Reserve)` eine Zeile.
- **E4 Problemliste:** Empfehlung **kein Eintrag** (R7), wie bei Stilllegen. Sichtbarkeit über den Handelsdialog und den Gut-Fokus.

## 8 Selbstprüfung Gate Brainstorming

- Säule: stärkt die Produktionsketten, schützt Bauen und Aufstieg; der Haushaltsbedarf ist durch die Daten ausgeschlossen. **OK**
- Echte Wahl: Holz zum Bauen gegen Werkzeug; Stilllegen und Reserve sind verschiedene Werkzeuge (dauerhaft gegen bedingt, halber gegen voller Unterhalt). **OK**
- Rückkopplung: Bremse nur in Mangelphasen, löst sich selbst; kein Wachstumsmotor. **OK**
- Randfälle: leeres Lager (Vorrang `waitingInput`), laufender Zyklus, Stilllegung, Inseln ohne Kontor, Save der Vorversion sind abgedeckt. **OK**
- Einfachere Variante: eine globale Reserve oder nur Holz wäre kleiner. Je Insel kostet kaum mehr und passt zum Lager; Stein kostet nur eine Zeile. **OK**
- Risiko: Save-Version kollidiert mit M13-E2/I-048. Das ist über «nächste freie Nummer» gelöst und braucht Abstimmung im Plan. **BEDENKEN (gering)**

Urteil der Selbstprüfung: **OK** mit dem Save-Hinweis.

## 9 Schätzung

- Plan (`lead-tech`): ≈ 25 Tools.
- Umsetzung: Sim (Defs, `advance`, `setReserve`, `reservedInputs`, Save und Migration, Tests) ≈ 55 Tools; UI (Handelsdialog, Texte, Hover, Hinweis, Problemliste, Tests, README) ≈ 45 Tools; Browser-Check ≈ 15 Tools. Zusammen ≈ 115 Tools, 1 Häppchen mit zwei Umsetzern (Sim vor UI).
- README: Abschnitt Handel und Kontor um die Reserve ergänzen (Spielwerte 0/20/40/60, nur Holz und Stein, nur Betriebe).
