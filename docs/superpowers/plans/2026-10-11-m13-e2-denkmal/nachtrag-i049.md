# Nachtrag an Plan I-049 (tech B5, R489) — Wortlaut zur Übernahme

Gehört zum [Index M13-E2](../2026-10-11-m13-e2-denkmal.md), Entscheidung E8. Dieser Plan ändert den Plan I-049
(`docs/superpowers/plans/2026-10-10-i049-sperrbestand.md`, gegatet R481) nicht selbst; der I-049-Controller arbeitet
die Punkte vor T01 ein, wie R481 B2–B9. Grundlage: Spec M13-E2 R6.1, Anhang 02 D Regel 6, Anhang 08 A «Fall K1».

## Voraussetzung

I-049 startet als Ganzes erst nach dem Merge von **M13-E2-SIM** auf `main` (R481 B1). Dann gibt es auf `main`:

- `SAVE_VERSION 12`, `migrateV11ToV12`, `isValidV12Fields` (`src/sim/save.ts`);
- `foldBackToV11` in `tests/sim/helpers.ts` (entfernt unbekannte Insel- und Weltschlüssel **ohne Umordnen**, also
  auch `islands[*].reserve` bedingungslos);
- `monumentLock(w, g)` in `src/sim/monument.ts`, liefert in E2 immer 0;
- `tests/sim/monument.test.ts` mit AK-M13E2-09 («Sperrbestand-Funktion liefert für alle vier Güter 0»).

## N1 · Ownership-Ergänzung (Tabelle «Worktrees und Datei-Ownership»)

| Task | zusätzliche Dateien                                                                                                     |
| ---- | ----------------------------------------------------------------------------------------------------------------------- |
| T02  | `src/sim/monument.ts` — **nur der Rumpf** von `monumentLock`; `tests/sim/monument.test.ts` — **nur ergänzen** (Fall K1) |
| T03  | `tests/sim/helpers.ts` — Verschärfung in `foldBackToV11` (N3), keine andere Regel                                       |

## N2 · Fall K1 als I-049-AK (in T02)

Neues AK im I-049-Kurzdesign-Bezug, im Plan als **AK-SB-K1** geführt (Kopplung Sperrbestand → Denkmal-Reserve):

- Heimat `reserve.stone = 40` → `monumentReserve(w, 'stone') === 40`;
- Heimat `reserve.stone = 10` → `monumentReserve(w, 'stone') === 20` (`MONUMENT_RESERVE_MIN`);
- Heimat `reserve.wood = 60` → Reserve von Stein, Werkzeug, Glas, Gewürz unverändert (Holz ist kein Denkmal-Gut);
- `monumentLock(w, g)` für `tools`, `glass`, `spice` bleibt 0;
- Fremdinsel-Sperrbestand ändert die Reserve nicht.

Umsetzung: Rumpf `monumentLock(w, g) = g === 'stone' ? home(w).reserve.stone : 0` (nur Stein ist Denkmal-Gut und
Reserve-Gut). Rot zuerst: der bestehende E2-Test «liefert 0» bleibt für `tools`, `glass`, `spice`; der Teil «Stein 0»
wird auf «Stein = Sperrbestand» umgestellt (einzige erlaubte Änderung an einem E2-Test, Ledger-Vermerk). Kein Wert in
`src/sim/defs/monument.ts` ändert sich; `balance-monument.test.ts` bleibt grün (Sperrbestand dort 0).

## N3 · `dropZeroReserve` in der Rückfaltung (in T03, ersetzt den dortigen Satz «muss `reserve` verwerfen»)

- `foldBackToV11` Regel 6 (Anhang 02 D): `islands[*].reserve` wird nur entfernt, wenn **alle Werte 0** sind; sonst
  Fehler `foldBackToV11: Sperrbestand nicht rückfaltbar`. Die Schlüsselfolge der übrigen Inselschlüssel bleibt.
- Ort: am äussersten Einstieg der Kette (R481 B2–B5), also in `foldBackToV11`; `foldBackToV10` und `foldBackToV9`
  sehen `reserve` dann nie.
- Der E2-Helfertest AK-M13E2-22 nutzt nur `reserve: { wood: 0, stone: 0 }` und bleibt ohne Änderung grün; neuer
  I-049-Test: `reserve.stone 20` → wirft.

## N4 · Save-Weiche (T03 Schritt 0): Fall A fest (R505)

Nach R505 gilt **Fall A (Mitfahrt auf v12)** ohne Weiche: kein Release bis M13-E2, I-049 und I-048 gemergt sind.
`migrateV11ToV12` ergänzt `isl.reserve ??= { wood: 0, stone: 0 }`, `isValidV12Fields` prüft `reserve` als Pflichtfeld,
die E2-Fixtures (v11 mit `wonMerchants`, Rundlauf v12) bekommen `reserve`. Fall B nur nach neuem Ruling (dann I-049
v13). Fall C entfällt. I-049-Sim mergt direkt nach M13-E2-SIM, vor M13-E2-ART/-UI.

## N5 · Doku (T07)

`docs/arc42.md`, Zeile `save.ts` und Baustein `monument.ts`: Satz «Die Denkmal-Reserve übernimmt den Stein-Sperrbestand
der Heimat (Fall K1)». README-Abschnitt «Denkmal», Reserve-Satz: «… mindestens 20, sonst 8 × Hausverbrauch je 100
Ticks, beim Stein mindestens der Sperrbestand».
