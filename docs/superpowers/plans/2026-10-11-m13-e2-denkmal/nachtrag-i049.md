# Nachtrag an Plan I-049 (tech B5, R489; korrigiert nach R511) — Wortlaut zur Übernahme

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

(`tests/sim/helpers.ts` gehört T03 bereits; die Verschärfung N3 braucht keinen Zusatz.)

## N2 · Fall K1 als I-049-AK (in T02, Task-Tabelle AK-Spalte «K1»)

Neues AK, im Plan als **AK-SB-K1** geführt (Kopplung Sperrbestand → Denkmal-Reserve). **Auslegung R511 B1:** Ohne
Kontor auf der Heimatinsel wirkt der Sperrbestand nicht (Linie R481 B6 b), auch nicht auf das Denkmal.

**Umsetzung:** Rumpf `monumentLock(w, g) = g === 'stone' ? reserveOf(…Heimat…, 'stone') : 0` mit dem Prädikat
`reserveOf` aus I-049 T02 (liefert 0 ohne Kontor auf der Insel), **nicht** `home(w).reserve.stone` direkt. Kein
Importkreis (`tests/sim/imports.test.ts` grün). Kein Wert in `src/sim/defs/monument.ts` ändert sich;
`balance-monument.test.ts` bleibt grün (Sperrbestand dort 0).

**Tests (rot zuerst):** neuer `describe('AK-SB-K1 Sperrbestand → Denkmal-Reserve')` in `tests/sim/monument.test.ts`;
der bestehende E2-Test (AK-M13E2-09, «Sperrbestand-Funktion liefert 0») bleibt **unverändert** (R511 B2; er läuft mit
Sperrbestand 0 und bleibt grün).

- Testwelt: `village(0, { unlockAll: true })` (keine Häuser; Stein hat ohnehin keinen Hausverbrauch, also ⌈8 × U⌉ = 0
  < 20), `wonMerchants = true`, Heimat mit Kontor.
- Grenzfälle Heimat `reserve.stone` → `monumentReserve(w, 'stone')`: **0 → 20**, **10 → 20**, **20 → 20**,
  **40 → 40**, **60 → 60**.
- Holz: Heimat `reserve.wood = 60` → Reserve von Stein, Werkzeug, Glas, Gewürz je gleich einer **Vergleichswelt mit
  `reserve.wood = 0`** (sonst gleich gebaut).
- `monumentLock(w, g)` für `tools`, `glass`, `spice` bleibt 0 (bei `reserve.stone = 60`).
- **Kein Kontor:** Heimat `reserve.stone = 60`, `kontorId = null` (synthetisch) → Reserve Stein **20**.
- **Fremdinsel:** Fremdinsel mit Kontor und `reserve.stone = 60`, Heimat 0 → Reserve Stein 20; Fremdinsel ohne Kontor,
  `reserve.stone = 60` → ebenfalls 20.

## N3 · `dropZeroReserve` in der Rückfaltung (in T03, ersetzt den dortigen Satz «muss `reserve` verwerfen»)

- `foldBackToV11` Regel 6 (Anhang 02 D): `islands[*].reserve` wird nur entfernt, wenn **alle Werte 0** sind; sonst
  Fehler `foldBackToV11: Sperrbestand nicht rückfaltbar`. Die Schlüsselfolge der übrigen Inselschlüssel bleibt.
- Ort: am äussersten Einstieg der Kette (R481 B2–B5), also in `foldBackToV11`; `foldBackToV10` und `foldBackToV9`
  sehen `reserve` dann nie.
- Der E2-Helfertest AK-M13E2-22 nutzt nur `reserve: { wood: 0, stone: 0 }` und bleibt ohne Änderung grün.
- **Rot zuerst** (vor der Verschärfung): neuer I-049-Test «Insel mit `reserve.stone 20` → `foldBackToV11` wirft» ist
  rot, solange `foldBackToV11` bedingungslos entfernt; danach grün.

## N4 · Save-Weiche (T03 Schritt 0): Fall A fest (R505)

Nach R505 gilt **Fall A (Mitfahrt auf v12)** ohne Weiche: kein Release bis M13-E2, I-049 und I-048 gemergt sind.
`migrateV11ToV12` ergänzt `isl.reserve ??= { wood: 0, stone: 0 }`, `isValidV12Fields` prüft `reserve` als Pflichtfeld.
Nur die **v12-Rundlauf-Fixtures** aus E2 bekommen `reserve`; v11-Fixtures (z. B. v11 mit `wonMerchants`) bleiben
**ohne** `reserve`, die Migration ergänzt es (R511 B4). Fall B nur nach neuem Ruling (dann I-049
v13). Fall C entfällt. I-049-Sim mergt direkt nach M13-E2-SIM, vor M13-E2-ART/-UI.

## N5 · Doku (T07)

`docs/arc42.md`, Zeile `save.ts` und Baustein `monument.ts`: Satz «Die Denkmal-Reserve übernimmt den Stein-Sperrbestand
der Heimat (Fall K1)». README-Abschnitt «Denkmal», Reserve-Satz: «… mindestens 20, sonst 8 × Hausverbrauch je 100
Ticks, beim Stein mindestens der Sperrbestand der Heimat (nur mit Kontor)». I-049-README-Satz «nur Betriebe» wird um
«beim Stein auch das Denkmal der Heimat» ergänzt (R511 B4).
