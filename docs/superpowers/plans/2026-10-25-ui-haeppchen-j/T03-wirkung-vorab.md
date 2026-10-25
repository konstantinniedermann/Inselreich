# T03 · P3 Rats-Karte nennt die Wirkung vorab (I-138)

Umsetzer `tech-ui-engineer` · ≈ 40 Tools · AK J9 bis J14 · blocked-by: T02 (gleiche Dateien) · Spec: Teil P3 (Regeln 1 bis 6)

## Dateien

- ändern: `src/ui/council.ts` (`councilPreview`, `CouncilCard.preview`, `councilCards` füllt es), `src/ui/councilCard.ts` (eigenes Element nach dem Kartentext), `src/style.css` (eine Klasse, gedämpft, kleiner), `tests/ui/council.test.ts`, `tests/ui/councilCard.test.ts` (Ergänzungen)
- nicht ändern: `src/sim/defs/council.ts`, Auswahl und «Beschluss fassen»

## Verhalten

1. `councilPreview(world, tier, side): string` liest `COUNCIL[tier][side].lever`; zählt **nur stehende** Gebäude (nicht Baustelle) über alle Inseln; Namen aus `BUILDING_DEFS`. Stand «stehend» wie im Bau-Tooltip/`standLine` (Feld prüfen: `built`/`constructing`, per `rg` im Code ermitteln, nicht raten).
2. `cycle` und `serviceRadius`: `Betrifft jetzt: n × <Name>`; `maxInhabitants`: `Betrifft jetzt: n Häuser (+m Plätze)`, m = n × (Hebelwert − Grundwert aus `defs`, nicht hart codiert). n = 0: `Wirkt noch nicht: <Name> fehlt`.
3. `councilCard.ts`: Zeile als eigenes Element mit neuer Klasse nach dem Kartentext; Kartenaufbau/Update liest `card.preview`.

## Testfälle (rot zuerst)

- AK-J9: 3 Webereien auf zwei Inseln: Text enthält `3` und den Gebäudenamen; ohne Weberei `Wirkt noch nicht` und der Name. Nur Zahl und Name prüfen, nicht die Pluralform.
- **Auflage 5:** eine Baustelle (nicht fertig) zählt nicht (n bleibt, bzw. 0 → `Wirkt noch nicht`).
- AK-J10: n Kapellen; 0 → `Wirkt noch nicht`.
- AK-J11: Stufe 3: n Bürgerhäuser, `+m` mit m aus `defs` (beide Werte im Test aus `defs` gelesen).
- AK-J12: `councilCards` liefert `preview` für beide Karten jeder offenen Stufe; entschiedene Stufe ohne Karte.
- AK-J13: Vorschau in eigenem Element nach dem Kartentext; bestehende `councilCard`-Tests grün.
- AK-J14: Welt vor/nach `serialize`-gleich.

## Prüfungen

`npx vitest run tests/ui/council.test.ts tests/ui/councilCard.test.ts; echo EXIT=$?` (vorher rot), dann Teilbeleg komplett: `npx tsc --noEmit`, `make lint`, `make zeittests`, `make conflicts` je mit `echo EXIT=$?`; Testzeiten mit T00 vergleichen. Commit `feat: Rats-Karte nennt die Wirkung vorab (I-138)`.
