# T06 · Anzeige der Inselstärken: Karte, Seekarte, Gebäude-Info, Bauleiste, U6, Inselwechsel (TDD)

Strang UI · Worktree `.worktrees/m14-e1-ui` (Branch `feat/m14-e1-ui`, abgezweigt vom abgenommenen T03-Commit) ·
Umsetzer `tech-ui-engineer` (sonnet) · AK-M14E1-26 (Weidenau), -27 … -31, -32 (Taste 9, Lagerleiste), -33 ·
blocked-by T03 · parallel zu T04/T05 · ≈ 55 Tools · Spec R4, R5, §7, Anhang 03 A–C · Entscheidung E1

**Zweck:** Der Spieler sieht, wofür jede Insel gut ist. Alle Zahlen und Namen aus Defs und `islandCycle`/`traitOf`
(E1), Texte wörtlich nach Anhang 03.

## Files

- Modify: `src/ui/islandCard.ts` (Weidenau über denselben Helfer `traitEffectTexts`), `src/ui/seaMapView.ts`
  (`seaMapTip`: Label plus ` · <Abschnitt>` je Trait mit Wirkung), `src/ui/hover.ts` (`buildingInfo`: Zeile
  `Inselvorteil ×<f> (<Label>)` direkt unter der Zustandszeile, nur für Trait-Betriebe auf Trait-Insel),
  Inspektor-Panel (`src/ui/panelView.ts` bzw. `src/ui/inspect.ts`; Ort per Schritt 0, dieselbe Zeile über einen
  gemeinsamen reinen Helfer `traitLine(world, b): string | null` in `src/ui/islandCard.ts`), `src/ui/buildMenu.ts`
  (Zusatzzeile nach «Erzeugt: …», nur wenn die **aktive Insel** den Trait trägt), `src/ui/goal.ts` (`UNLOCK_NOTICE`
  - Satz Anhang 03 B, zusammengesetzt aus `ISLANDS`, `TRAIT_LABELS`, `TRAIT_BUILDINGS`).
- Modify Tests: `tests/ui/islandCard.test.ts`, `tests/ui/hover.test.ts`, `tests/ui/buildMenu.test.ts`,
  `tests/ui/goal.test.ts`, `tests/ui/islandJump.test.ts`, `tests/ui/seaMapView.test.ts`, `tests/render/seaMap*.test.ts`,
  Panel-Test des Inspektors (Schritt 0).
- Nicht: `src/sim/` (alles Nötige liefert T01/T03), `src/render/seaMap.ts` nur, wenn AK-33 rot ist (laut Tech-B11
  generisch über `islands.length`).

## Schritte

- [ ] 0. `grep -n "buildingInfo\|producesText\|perMinute(1, cycleOf" src/ui -r`; `grep -n "UNLOCK_NOTICE" src tests -r`;
      `grep -n "export function mapLayout\|seaMapPick" src -r`; Inspektor-Ort für die Zustandszeile bestimmen.
- [ ] 1. Rote Tests (Testwelt Spec §10; Fahrzeit aus dem Seeweg der Testwelt):
  - AK-26 Weidenau `Weidenau · 24 × 24 · Gewürz · Fruchtbar: Zuckerrohrplantage, Schäferei ×2 · Fahrzeit m:ss`.
  - AK-27 `foreignHoverTitle` mit Weidenau-Karte vor der Seefahrt → Karte + ` · Seefahrt mit den Kaufleuten`, danach
    ohne Zusatz.
  - AK-28 `seaMapTip` alle fünf Zeilen der Tabelle Anhang 03 A (Heimat, Möweninsel mit Kontor, Felsbucht ohne/mit
    Kontor, Weidenau ohne Kontor).
  - AK-29 Steinbruch Felsbucht → `arbeitet — 20 Stein / min` und `Inselvorteil ×2 (Gebirge+)`; Schäferei Weidenau →
    `Inselvorteil ×2 (Fruchtbar)` und `arbeitet — 24 Wolle / min`; Steinbruch Stufe 3 Felsbucht → `50 Stein / min`;
    Steinbruch Heimat und Gewürzplantage Weidenau ohne Inselvorteil-Zeile; Inspektor zeigt dieselbe Zeile.
  - AK-30 alle Zeilen der Tabelle Anhang 03 C (vier Zusatzzeilen; Heimat, Möweninsel und Gewürzplantage Weidenau
    ohne).
  - AK-31 `UNLOCK_NOTICE.startsWith(<Bestandstext aus T00-Ledger>)` und Rest exakt
    `. Jede Insel hat ihre Stärke: Möweninsel liegt nah, Felsbucht Gebirge+, Weidenau Fruchtbar` (QA-B1: Bestandstext
    im Test nicht als Literal pinnen, sondern als Präfix bis zum ersten `. Jede Insel`).
  - AK-32 Taste `9` viermal ab der Heimat → Möweninsel, Felsbucht, Weidenau, Heimat (`nextIsland`); Lagerleisten-Präfix
    auf Insel 3 «Weidenau».
  - AK-33 (`fakeCtx.ts`): `mapLayout` umfasst vier Inseln; vier Silhouetten; `seaMapPick` auf Land von C → 3.
- [ ] 2. `npx vitest run <obige Testdateien>; echo EXIT=$?` → rot.
- [ ] 3. Umsetzen. Faktor-Text `×${100 / TRAIT_CYCLE_PCT}`; Ausstoss über `perMinute(1, islandCycle(…))`; Insel-Name
      über `islandName`. Keine Zahl als Literal im UI.
- [ ] 4. Grün plus `tests/ui tests/render`. `npx tsc --noEmit; echo EXIT=$?`, `make lint; echo EXIT=$?`.
      Commit `feat: Inselstärken in Karte, Seekarte, Info und Bauleiste (M14-E1 T06)`.
- [ ] 5. Übergabe an T08 (Browser) mit Liste der geänderten Ansichten.

## Hinweise

- 1280×720: die U6-Meldung wird länger (Anhang 03 B); passt sie nicht in eine Zeile, bricht sie um — kein Abschneiden.
- Testzeit: je Test < 200 ms (UI-Helfer rein; Render über `fakeCtx`).
