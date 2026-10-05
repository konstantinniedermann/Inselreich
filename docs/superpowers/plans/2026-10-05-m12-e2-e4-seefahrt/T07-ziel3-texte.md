> **Task-ID:** T07 · **AK-IDs:** AK-Z3-11, AK-Z3-12; Pins M8/M11 AK-U1-01, RF-4 (Anhang 05 I), M11:AK-U1-08
> (`UNLOCK_NOTICE`, Anhang 03 D, R230 B1)
> **blocked-by:** T06 · **Strang:** e3, `.worktrees/m12-see-e3` · `tech-ui-engineer` (sonnet)
> **Regeln:** Spec Anhang 05 F (Texte wörtlich), Anhang 03 D „U6-Meldungstext"; kein Text enthält „Tick"

## T07: Drittes Ziel — Texte, Banner, U6-Meldung

**Ziel:** Zielanzeige, Banner und U6-Meldung sprechen vom dritten Ziel und von der Seefahrt. Reine Funktionen in
`src/ui/goal.ts`, Vitest ohne DOM; Browser-Check folgt in T15 (AK-Z3-14).

**Code-Fakten:** `ui/goal.ts` `SECOND_GOAL_NAME`, `goalTexts(view)` (mit Brücke `case 'spice'` aus T06),
`GoalShown { wonShown, wonMerchantsShown }`, `initialGoalShown`, `goalBanners`, `UNLOCK_NOTICE`, `withKey`;
`hotkeys.ts` `hotkeyLabel`; `defs/unlocks.ts` `FUNCTION_LABELS.seafaring` (T02); `GOODS.spice.name`;
`WIN_SPICE_MERCHANTS` (T02); `GoalView` Phase `'spice'` (T06). Aufrufer: `hud.ts:254`, `inspect.ts:838`,
`startCard.ts:108`, Banner-Schleife in `app.ts` (generisch über `texts`, Ton `win` je Frame höchstens einmal).

**Dateien:** `src/ui/goal.ts`; `tests/ui/goal.test.ts`. `app.ts` nur, wenn die Banner-Schleife nicht generisch ist
(dann Meldung an den Controller vor der Änderung).

## Texte (verbindlich, Zahlen und Namen aus `defs`)

| Stelle              | Text                                                                                                                        |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `merchants`, `next` | `Danach: ${THIRD_GOAL_NAME} — ${WIN_SPICE_MERCHANTS} ${TIERS[4].name} mit ${GOODS.spice.name} von einer fernen Insel`       |
| `spice`, `chip`     | `Ziel ${n} / ${target} ${TIERS[4].name} mit ${GOODS.spice.name}`                                                            |
| `spice`, `title`    | `Drittes Ziel: ${target} ${TIERS[4].name}, 60 s voll versorgt — ${GOODS.spice.name} per Schiff von deiner eigenen Plantage` |
| `spice`, `rest`     | `${n} / ${target} ${TIERS[4].name} mit ${GOODS.spice.name}`                                                                 |
| `spice`, `next`     | `loop` false: `Fehlt: Schiffsroute, die ${GOODS.spice.name} von deiner Plantage heimholt`; true: `null`                     |
| `done`, `chip`      | `${THIRD_GOAL_NAME} · ${m} ${TIERS[4].name}`                                                                                |
| `done`, `title`     | `Alle drei Ziele erreicht — freies Spiel`                                                                                   |
| `done`, `rest`      | `${THIRD_GOAL_NAME} erreicht · ${m} ${TIERS[4].name}`                                                                       |
| Banner              | `Drittes Ziel erreicht: ${THIRD_GOAL_NAME} mit ${WIN_SPICE_MERCHANTS} ${TIERS[4].name}n! Das Spiel läuft weiter.`           |

Erwarteter Wortlaut mit heutigen Defs (Anhang 05 F): „Danach: Gewürzstadt — 80 Kaufleute mit Gewürz von einer fernen
Insel", „Ziel n / 80 Kaufleute mit Gewürz", „Drittes Ziel erreicht: Gewürzstadt mit 80 Kaufleuten! Das Spiel läuft
weiter." — Flexion („Kaufleuten") so bilden, dass der Wortlaut exakt entsteht; der Test pinnt den Wortlaut.
`THIRD_GOAL_NAME = 'Gewürzstadt'` (UI-Text). „60 s" ist Spielzeit bei 1×; `WIN_SPICE_HOLD / 10` aus `defs`
(`TICK_MS` 100) statt Literal 60. `fillPct` wie bisher, `done` 100.

**U6-Meldung** (R230 B1): `UNLOCK_NOTICE` = „Neu freigeschaltet: Badehaus (J), Glashütte (O) und Seefahrt (Inseln: 9)
— deine Bürger wollen Kaufleute werden; Kaufleute brauchen Gewürz von fernen Inseln" mit Namen und Tasten aus den
Defs (`withKey`, `TIERS`, `GOODS.spice.name`, `FUNCTION_LABELS.seafaring[0]`; Taste aus `ISLAND_CYCLE_KEY` in
`hotkeys.ts`, angelegt in T02).

## Schritte

- [ ] **1 Tests zuerst** `tests/ui/goal.test.ts`, `describe('M12 Z3 Texte')`:
  - **AK-Z3-11** je Phase alle Felder wörtlich (Tabelle); `spice.next` je `loop`; kein Feld enthält „Tick".
  - **AK-Z3-12** `GoalShown` + `wonSpiceShown`; `initialGoalShown({ won, wonMerchants, wonSpice: true })` → kein
    Banner; alle drei Flaggen im selben Aufruf → drei Texte in der Reihenfolge erstes, zweites, drittes; bestehende
    RF-4-Fälle grün.
  - **Pins (bewusst, Anhang 05 I, Kommentar „R239 (3)")**: AK-U1-01 Phase `merchants` mit `next`-Text statt `null`,
    Phase `done` mit Gewürzstadt-Texten; **M11:AK-U1-08** (`UNLOCK_NOTICE`, Kommentar „R230 B1") neuer Wortlaut;
    kein Test gelöscht.
- [ ] **2 Rot-Beleg** → Commit `test: M12 Z3 Texte und Banner (rot)`.
- [ ] **3 Umsetzung**, Brücke aus T06 ersetzt.
- [ ] **4 Prüfen:** `make check`, `CI=true make check` → Commit `feat: M12 Z3 Texte, Banner, U6-Meldung`.

**Review-Fokus:** Wortlaut exakt; keine Zahl 80/600/60 als Literal; Banner-Reihenfolge; nur `goal.ts` geändert.
