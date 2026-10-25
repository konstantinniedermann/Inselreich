# Anhang 01 · Texte Volllast (Panel, Tooltip, Sperrgründe, Warnungen)

Gehört zu [Spec Volllast](../2026-10-25-volllast-design.md), Regeln 7, 8 und 12. Quelle der Inhalte: Rechnung §9
([`2026-10-25-volllast-rechnung.md`](../2026-10-25-volllast-rechnung.md)). Alle Zahlen kommen zur Laufzeit aus
`cycleOf`, `buildingUpkeep`, `upkeepOf` und den Defs (`OVERTIME_*`, `PAUSED_UPKEEP_PCT`), nie als Literal im Text.
Zeiten mit `formatGameTime` (`src/ui/time.ts`: unter 60 s «59 s», sonst «m:ss», aufgerundet), Raten mit `perMinute`
(`/ min`, eine Nachkommastelle, Zahlformat wie die bestehenden Panelzeilen). Vorzeichen mit `signedNum`.

## A Sperrgründe

Die Sim liefert feste Texte (Regel 8); die UI hängt bei Phase `overtime` und `rest` die Restzeit an.

| Bedingung (Rangfolge) | `reason` der Sim (exakt)       | Text am gesperrten Knopf (UI)    | Beispiel                     |
| --------------------- | ------------------------------ | -------------------------------- | ---------------------------- |
| 1 keine Id            | «Gebäude nicht gefunden»       | – (Knopf nicht sichtbar)         | –                            |
| 2 kein Betrieb        | «Nur Betriebe kennen Volllast» | – (Knopf nicht sichtbar)         | –                            |
| 3 Phase `overtime`    | «Volllast läuft»               | «Volllast läuft noch ‹Restzeit›» | «Volllast läuft noch 2:13»   |
| 4 Phase `rest`        | «Ruht»                         | «Ruht noch ‹Restzeit›»           | «Ruht noch 1:05»             |
| 5 stillgelegt         | «Stillgelegt: erst anfahren»   | gleich                           | «Stillgelegt: erst anfahren» |
| 6 brennt              | «Brennt»                       | gleich                           | «Brennt»                     |
| 7 ohne Strasse        | «Keine Strassenverbindung»     | gleich                           | «Keine Strassenverbindung»   |

`‹Restzeit›` = `formatGameTime(overtimeState(world, b).remaining)`; Beispiele: `remaining` 1330 → «2:13», 650 →
«1:05», 590 → «59 s».

## B Tooltip des freien Knopfs

Aufbau, eine Zeile je Punkt. `c` = `cycleOf` heute (normal), `c'` = `overtimeCycle(c)`, `u` = `upkeepOf(b)`,
`u'` = `ceil(u × OVERTIME_UPKEEP_PCT / 100)`, `uR` = `ceil(u × PAUSED_UPKEEP_PCT / 100)`.

1. Titel: «Volllast für ‹formatGameTime(OVERTIME_TICKS)›, danach ‹formatGameTime(OVERTIME_REST_TICKS)› Ruhe»
2. «Ausstoss ‹Gut›: ‹perMinute(1, c)› → ‹perMinute(1, c')› / min (+‹p› %)» mit
   `p = round((c / c' − 1) × 100)`
3. «Unterhalt: ‹perMinute(u, 100)› → ‹perMinute(u', 100)› / min»
4. je Eingangsgut (nur mit `consumes`): «Eingang ‹Gut›: ‹perMinute(1, c)› → ‹perMinute(1, c')› / min»
5. «Danach ‹formatGameTime(OVERTIME_REST_TICKS)› Ruhe ohne Ausstoss, Unterhalt ‹perMinute(uR, 100)› / min»
6. Warnungen aus D (0 bis mehrere Zeilen)

Beispiel **Weberei Stufe 1** (Heimatinsel, ohne Rat und Vorteil; `c` 50, `c'` 38, `u` 15, `u'` 23, `uR` 8):

```text
Volllast für 3:00, danach 2:00 Ruhe
Ausstoss Stoff: 1.2 → 1.6 / min (+32 %)
Unterhalt: 90 → 138 / min
Eingang Wolle: 1.2 → 1.6 / min
Danach 2:00 Ruhe ohne Ausstoss, Unterhalt 48 / min
```

Beispiel **Rinderfarm Stufe 3** (`c` 8, `c'` 6, `u` 17, `u'` 26, `uR` 9): Ausstoss «7.5 → 10 / min (+33 %)»,
Unterhalt «102 → 156 / min», Ruhe «Unterhalt 54 / min». Zahlformat (Punkt oder Komma) wie die bestehende Panelzeile
«‹Rate› / min» (`panelView.ts:159`); der Test vergleicht gegen dieselbe Formatierung.

Abweichung zur Rechnung §9: dort «50 → 38 Ticks» und «15 → 23 je 100 Ticks». Das Panel zeigt Ticks nirgends und den
Unterhalt je Minute (`panelView.ts:191`); der Tooltip folgt dem Panel, damit Spieler die Zahlen vergleichen können.

## C Zustand und Unterhaltszeile

- **Zustandszeile** (`src/ui/texts.ts`, Zustandstext; `panelView.ts`):
  - Phase `overtime` und Zustand `ok` → «Volllast ‹Restzeit›», z. B. «Volllast 2:13».
  - Phase `overtime` und anderer Zustand → bestehender Zustandstext, dahinter « · Volllast ‹Restzeit›», z. B. «Wartet
    auf Wolle · Volllast 2:13» (zeigt, dass die Volllast verpufft).
  - Zustand `'resting'` → «Ruht ‹Restzeit›», z. B. «Ruht 1:05» (`ok: false`, wie «Stillgelegt» als Hinweisfarbe).
  - Stillgelegt in einer Phase → bestehender Text «Stillgelegt …», dahinter « · Volllast ‹Restzeit›» bzw.
    « · Ruht ‹Restzeit›».
- **Hover** (`src/ui/hover.ts`): `'resting'` → «Ruht noch ‹Restzeit›».
- **Unterhaltszeile** (`panelView.ts:191`): bestehender Wert `perMinute(buildingUpkeep, 100)`, dahinter in Klammern
  der Zusatz, wenn nicht stillgelegt:
  - Phase `overtime`: «(‹signedNum(Δ)› / min durch Volllast)», Δ = `perMinute(u', 100) − perMinute(u, 100)`; Weberei
    St. 1: «138 / min (+48 / min durch Volllast)».
  - Phase `rest`: «(‹signedNum(Δ)› / min in der Ruhe)»; Weberei St. 1: «48 / min (−42 / min in der Ruhe)».
- **Unterhaltsliste** (`src/ui/upkeepRank.ts`): Zeilenwert ist `buildingUpkeep` (enthält die Phase), keine eigene Zeile.

## D Warnungen im Tooltip (ohne Sperre)

Reiner Helfer `overtimeWarnings(world, b)` in `src/ui/overtime.ts`. Ruhefenster `W = [tick + OT, tick + OT + RT)`.

| Bedingung                                                                                  | Text                                                                  |
| ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| Zustand `waitingInput` oder `waitingReserve`                                               | «Eingang fehlt: Volllast verpufft»                                    |
| Zustand `storageFull`                                                                      | «Lager ‹Gut› voll: Volllast verpufft»                                 |
| Zustand `noService` oder `noForest`                                                        | «Kein Fortschritt (‹Zustandstext›): Volllast verpufft»                |
| `world.contract` mit `good` = Ausstossgut und `island` = `b.island`, Abrechnung `s` in `W` | «Ruhe überdeckt die Vertragsabrechnung in ‹formatGameTime(s − tick)›» |
| `world.order` mit `good` = Ausstossgut und `due` in `W`                                    | «Ruhe überdeckt die Auftragsfrist in ‹formatGameTime(due − tick)›»    |

- `s` ist die erste Abrechnung `≥ tick + OT` (Abrechnungen bei `ORDER_FIRST_TICK + k × ORDER_PERIOD`, wie
  `nextSettleTick`, `orders.ts:307`). Weil `RT` (1200) > `ORDER_PERIOD` (900), liegt bei laufendem Vertrag des Guts
  immer eine Abrechnung im Fenster; die Warnung ist dann immer da, und das ist richtig (Rechnung §4 Lage E).
- Aufträge: Insel spielt keine Rolle (Fernaufträge werden per Schiff beliefert); nur das Gut zählt.
- Beispiel: Tick 4000, Abrechnungen bei 4300, 5200, 6100, 7000; `W` = [5800, 7000) → erste Abrechnung im Fenster 6100
  → «Ruhe überdeckt die Vertragsabrechnung in 3:30».
