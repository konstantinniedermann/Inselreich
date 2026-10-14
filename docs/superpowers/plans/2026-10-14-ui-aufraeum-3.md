# Plan UI-AUFRAEUM-3 · Sammelpaket kleiner Reibungen (Stufe leicht)

Owner `lead-tech` · Quelle: R606 (2), R612, R613 (4); `docs/ideen.md` I-089, I-098, I-099; `docs/beobachtungen.md` (Kleinbefunde REL-21, Badge `prefer-*`, README-Verweis, Zählregel). Plan gegen main `c3a93534`.
Spielerwirkung: Rechtsklick im Wegzug wirkt wie Esc, die Unterhalt-Karte nennt den Preis jeder Insel, der Kartenstapel oben rechts ist ruhig und eindeutig, die Vorliebe-Marke ist nicht mehr mit Boom zu verwechseln.
**Kein Save** (`SAVE_VERSION` unverändert), **kein Spielwert** (`src/sim/defs/` und `balance.test.ts` unberührt), keine Abhängigkeit (ADR-001), kein Architekturentscheid. Einziger Eingriff in `src/sim/`: T05 (reine Umformung, Ergebnis bitgleich). **Umsetzung erst nach dem Push REL-21.**

## Herausgenommen (Bericht an L0)

- `balanceAfterUpgrade` ohne Cache je Panel-Refresh: Cache-Schlüssel in der Pause unklar (Bau ändert die Welt ohne Tick), kein Messwert. Bleibt in `docs/beobachtungen.md`; erst messen (R392).
- `goodsBalance` mehrfach je `refresh()` (HC-Kleinbefund a), Fokus-Reset beim Inselwechsel (b), `blur` nach Enter (c): nicht in der Auftragsliste, bleiben Beobachtung.
- Kleinbefund REL-21 «Vertragskarte 6 px neben Krisenkarte» ist in T04 (I-099) gelöst.

## Kurz-Spec

- **I-098** (R606 3): Rechtsklick mit laufendem Linienzug (`drag?.line === true`) beendet nur den Zug (`cancelPointerAction()`), **kein** `cancel`-Action; erst der zweite Rechtsklick (kein Zug) sendet `cancel` und legt das Werkzeug ab. Ohne Zug unverändert. `src/ui/input.ts` Z. 361 ff. Abriss-/Weide-Zug (`drag.road`/`drag.demolish`) sind keine Linienzüge; Randfall «gleich behandeln» laut Idee: dort gilt dieselbe Staffelung (`drag !== null && drag.button === 0` und Zug aktiv → nur Zug beenden). Der Umsetzer prüft in T01, welche Züge Rechtsklick heute abbrechen, und legt die Menge im Test fest.
- **I-089**: `upkeepSummary` bekommt `islands: { island, count, upkeep }[]` (Summe der Betriebe mit Unterhalt je Insel, Stillgelegte mit ihrem Wert nach Stilllegung, ohne Schiffe), nur mit Seefahrt (`islandLabel !== null`) und bei mindestens zwei Inseln mit Betrieben; Karte zeigt oben «Felsbucht · 3 Gebäude · 140 / min». Fusszeile aus `totalUpkeep(world)` statt `stats.upkeep` (Pausen-Befund); Heimat-Kontor erscheint als Inselzeile mit 0 nicht (Insel ohne Unterhalt-Betrieb fehlt), der Hinweis klärt sich über die Inselzeile. Summe der Inselzeilen + Schiffe + Edikt = Fusszeile (Test).
- **I-099**: Meldungsstapel `.notice-stack` mit einem festen Abstand `--stack-gap` (Variable, ein Wert für alle Karten), «Krisen: aus» ist keine Karte mehr (`crisisCardText` liefert `''`, `updateNoticeStack` blendet bereits bei `''` aus); die Krisenstufe bleibt in Menü/Einstellungen lesbar (README Z. 206). Krisenkarte mit laufender Krise und «nächste Krise in …» bleibt.
- **Badge**: `prefer-*` bekommt Klasse `badge--prefer` (neutraler Ton, Rand wie Boom, andere Füllung), Boom bleibt `badge--boom`.
- **Zählregel**: `producedRate(world, b)` (0 oder `100 / cycle`; Bedingungen `connected`, nicht `paused`, `cycleOf`) in `src/sim/flow.ts` exportiert; `goodsBalance` und `goodProductionPer100` rufen sie. Summationsreihenfolge je Gut bleibt (Gebäude-Reihenfolge), damit Gleitkomma bitgleich.
- **REL-21-Kleinbefunde**: Testname `'uses version 5'` → `'createWorld uses SAVE_VERSION'`; `startKey` in `storageFull.ts` Präfix `g:` → `f:` (kollidiert nur namentlich mit `problems.ts`), Tests nachziehen.
- **Doku**: README (Rechtsklick Z. 94–95 und Tabelle Z. 138 «Esc oder Rechtsklick», Z. 74 Verweis → `docs/spielwerte.md`, Krisenkarte, Unterhalt-Karte), `docs/ideen.md` (I-089/098/099 live, Ranglisten-Lücken Rang 2 und 7 schliessen), `docs/ideen-archiv.md` (Überschrift «Rangliste IDEEN-09, live gegangene Zeilen» als Trenner, I-089/098/099 archivieren nach Regel), Beobachtungen abhaken, arc42 (Zählregel).

## Dateimatrix (Ownership)

| Datei                                                                                                    | T01 | T02 | T03 | T04 | T05 | T06 | T07 |
| -------------------------------------------------------------------------------------------------------- | --- | --- | --- | --- | --- | --- | --- |
| `src/ui/input.ts`, `tests/ui/input.test.ts`                                                              | ja  |     |     |     |     |     |     |
| `src/ui/trade.ts`, `src/style.css` (Badge), `tests/ui/inselmarkt.test.ts`                                |     | ja  |     |     |     |     |     |
| `src/ui/upkeepRank.ts`, `src/ui/upkeepCard.ts`, `tests/ui/upkeepRank.test.ts`                            |     |     | ja  |     |     |     |     |
| `src/ui/crisis.ts`, `src/style.css` (Stapel), `tests/ui/crisis.test.ts`, `hud.test.ts`                   |     |     |     | ja  |     |     |     |
| `src/sim/flow.ts`, `src/ui/production.ts`, `tests/sim/flow-count.test.ts`, `tests/ui/production.test.ts` |     |     |     |     | ja  |     |     |
| `tests/sim/save.test.ts` (Name), `src/ui/storageFull.ts`, `tests/ui/storageFull.test.ts`                 |     |     |     |     |     | ja  |     |
| `README.md`, `docs/arc42.md`, `docs/ideen*.md`, `docs/beobachtungen.md`                                  |     |     |     |     |     |     | ja  |

`src/style.css` wird von T02 und T04 berührt (verschiedene Regeln): daher **ein Strang, seriell**, Worktree `.worktrees/ui-aufraeum-3-impl` ab `plan/ui-aufraeum-3`, main per Merge holen. Nicht angefasst: `src/sim/defs/`, `src/sim/save.ts`, `src/render/`, `src/audio/`, `docs/studio/`. Ownership-Erweiterung nur vorab melden (R613 2).

## Tasks

| Task | Titel                                  | Datei                     | AK-IDs           | Strang | blocked-by  | Modell | Tools |
| ---- | -------------------------------------- | ------------------------- | ---------------- | ------ | ----------- | ------ | ----- |
| T01  | Rechtsklick staffelt wie Esc (I-098)   | `T01-rechtsklick.md`      | AK-UA3-01 bis 03 | 1      | REL-21 live | sonnet | 30    |
| T02  | Badge `prefer-*` eigene Klasse         | `T02-badge.md`            | AK-UA3-04, 05    | 1      | T01         | sonnet | 20    |
| T03  | Unterhalt je Insel + Fusszeile (I-089) | `T03-unterhalt-inseln.md` | AK-UA3-06 bis 10 | 1      | T02         | sonnet | 60    |
| T04  | Kartenstapel ordnen (I-099)            | `T04-kartenstapel.md`     | AK-UA3-11 bis 14 | 1      | T03         | sonnet | 50    |
| T05  | Gemeinsame Zählregel                   | `T05-zaehlregel.md`       | AK-UA3-15 bis 17 | 1      | T04         | sonnet | 30    |
| T06  | Kleinbefunde REL-21                    | `T06-kleinbefunde.md`     | AK-UA3-18, 19    | 1      | T05         | sonnet | 15    |
| T07  | Doku und Ranglisten (D1, E-017)        | `T07-doku.md`             | AK-UA3-20 bis 22 | 1      | T06         | sonnet | 35    |

Summe ≈ 240 Tools Umsetzer. Je Task Umsetzer `tech-ui-engineer` (T05 `tech-sim-engineer`), danach `qa-code-reviewer` (sonnet) je Task; T01–T04 zusätzlich ein gemeinsamer Browser-Check `qa-playtester` 1280×720 und 1920×1080 (Screenshots `.studio/qa/ui-aufraeum-3/`); letzter Review über die Branch mit `model: opus` als Final-Review (Stufe leicht). Fix-Runden per SendMessage.
**Budgetantrag:** 7 Pakete × 2 + 1 Playtest + 1 Final-Review = 16, + 30 % Puffer = **21 Starts**, Parallelität 1 (ein Strang, gemeinsame Dateien).

## Zeitmessung berührter Tests (R392)

Nicht gemessen: 1-min-Load 13,8 (> 8, Testlock-Regel R380) und `node_modules` im neuen Worktree fehlt; Abbruch laut Auftrag. Der Controller misst **vor T01** auf main `npx vitest related --run src/ui/input.ts src/ui/trade.ts src/ui/upkeepRank.ts src/ui/upkeepCard.ts src/ui/crisis.ts src/ui/hud.ts src/ui/production.ts src/ui/storageFull.ts src/sim/flow.ts` nach `.studio/qa/ui-aufraeum-3/zeit-vor.json`, bei Load ≤ 4. Umfang als Anhalt: `input` 38, `hud` 37, `trade` 16, `crisis` 8, `upkeepRank` 8, `inselmarkt` 7, `production` 2 Testfälle; `related` zieht über `flow.ts` viele Sim-Tests mit (grösster Posten, T05). Neue Tests lokal × 3 grün, je ≤ 50 % des Timeouts (R593).

## Pflichtläufe

Rot-Beleg je AK-Gruppe vor der Umsetzung (Ausgabe im Task-Bericht); am Ende `make check; echo EXIT=$?`, `make zeitreserve-gate`, `make docs-check`; `git diff main -- src/sim/defs src/sim/save.ts src/sim/types.ts tests/sim/balance.test.ts` leer.
