# I-223 Nachtrag: Stufen-Steuer-Tooltip bei aktivem Zehnt

Stand 2026-10-28 · Stufe leicht, Spec-Nachtrag ohne neue Spielwerte · Bezug: Spec `2026-10-26-i223-zehnt-design.md`,
R1014, Gate-Handoff lead-qa (Befund `tierTaxTooltip`). Umsetzung als Häppchen I-223-NACH durch `lead-tech`.

## Problem

`tierTaxTooltip` (`src/ui/taxView.ts`) nennt `taxPct(level, tier) %` als Steuersatz. Bei wirkendem Zehnt fliesst
dieser Satz für Pioniere gar nicht (Geldanteil 0), für Siedler nur zu 90 %. Der Spieler soll im Tooltip sehen, was
wirklich in die Kasse geht (R896).

## Entscheid

Der Satz bleibt als Nennsatz stehen (er bestimmt die Steuer), danach folgt ein Zehnt-Teil. Der Teil erscheint nur,
wenn der Zehnt der Stufe **wirkt**: Stufe in `TITHE_GOOD`, `world.titheOn[tier]` und `townhallActive(world)`.
Der Aufteilungs-Text wird aus `TITHE_PCT[tier]` und `GOODS[TITHE_GOOD[tier]].name` gebildet, nie als Literal.

Reihenfolge der Teile: Nennsatz · Zehnt-Teil · Aufstieg · Einwohner. Der Sperrtext «Aufstieg nicht möglich»
(`noRiseReason`) hat Vorrang und bleibt unverändert.

| Fall                                                 | Tooltip (Beispiel Level normal, Pioniere)                                   |
| ---------------------------------------------------- | --------------------------------------------------------------------------- |
| Zehnt aus, oder Stufe ohne Zehnt (Bürger, Kaufleute) | unverändert: `<p> % · <Aufstieg> · <n> Einwohner`                           |
| Zehnt wirkt, `TITHE_PCT` = 100 (Pioniere)            | `<p> % · Zehnt: alles als Werkzeug, kein Geld · <Aufstieg> · <n> Einwohner` |
| Zehnt wirkt, `TITHE_PCT` < 100 (Siedler, 10)         | `<p> % · Zehnt: 90 % Geld, 10 % als Stein · <Aufstieg> · <n> Einwohner`     |
| Zehnt eingeschaltet, Amtsstube wirkt nicht           | `<p> % · Zehnt ruht: <townhallReason> · <Aufstieg> · <n> Einwohner`         |

«90 %» ist 100 − `TITHE_PCT`. Wörter «Werkzeug», «Stein» kommen aus den Gut-Defs. Prozentzahlen ohne Dezimalstellen.

## Abnahmekriterium

- **AK-ZE-28 Stufen-Tooltip nennt den Zehnt** (`tests/ui/taxView.test.ts`): Welt mit Amtsstube, `tierTaxTooltip` je Fall der
  Tabelle: (a) Zehnt aus → Text enthält kein «Zehnt»; (b) Pioniere an → enthält «alles als Werkzeug, kein Geld»;
  (c) Siedler an → enthält «90 % Geld, 10 % als Stein»; (d) Pioniere an, Amtsstube mit `outageUntil` → enthält
  «Zehnt ruht»; (e) Bürger → kein «Zehnt». Die Zahlen werden gegen `TITHE_PCT` gerechnet, nicht fest eingetragen
  (ausser ein Absolutfall (b) und (c) als Regressionsanker). Der Nennsatz-Teil bleibt in allen Fällen gleich.

## Randfälle

Tooltip nach Umschalten sofort neu (`inspect.ts` setzt `btn.title` je Tick, nur bei Änderung). Wird `TITHE_PCT` je
auf 0 gesetzt, entfällt die Zeile (Stufe zählt als ohne Zehnt). Kein Save-, Sim- oder Balancing-Einfluss.

## Nicht dazugehörig

Die vier Aufräum-Punkte aus dem Gate-Handoff (Literale aus `TAX_CARRY_DIVISOR`, AK-ZE-12 auf Betrag, Testtitel,
`dropTithe`-TypeError) sind eigene Häppchen-Punkte ohne Textentscheid. Keine Änderung am Schalter-Tooltip (AK-ZE-17).
