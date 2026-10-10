# Anhang 07 · UI-Helfer und Texte (Spec M13-E2)

Gehört zu [Spec M13-E2 Denkmal als Wahlziel](../2026-10-10-m13-e2-denkmal-design.md), §7. Reine, DOM-freie Helfer in
`src/ui/monumentView.ts` [Tech: Modul], Vitest `tests/ui/monumentView.test.ts`. Zahlen und Namen nur aus
`MONUMENT_STAGES`, `MONUMENT_GOODS`, `GOODS`, `buyPrice`, `monumentReserve`, `formatGameTime`.

## A. Panel-Helfer

- **`monumentRows(w)`** → je Gut in `MONUMENT_GOODS`-Reihenfolge `{ good, label, pct, reserveText, buyText, buyOn }`:
  - `label`: «{Gutname} {geliefert} / {Soll}» im laufenden Abschnitt, z. B. «Glas 84 / 140»; zwischen Abschnitten
    Vorschau des nächsten Abschnitts mit 0, z. B. «Glas 0 / 140»; nach `stage 3` leer (Zeilen verborgen).
  - `pct` = ⌊100 × geliefert / Soll⌋ (84 / 140 → 60).
  - `reserveText` «Reserve {monumentReserve(w, g)}», z. B. «Reserve 64».
  - `buyText` «zukaufen ({buyPrice(w, g, 1)} / Stück)», z. B. «zukaufen (50 / Stück)», mit Handel «zukaufen (40 /
    Stück)».
- **`monumentStartState(w)`** → `{ visible, disabled, reason, buttonText }`: `buttonText` «Abschnitt {stage + 1}
  beginnen ({Geld})»; `reason` aus einer reinen Prüffunktion mit derselben Reihenfolge wie `startMonumentStage`
  (nicht durch Ausführen); `disabled = reason !== null` ausser bei `'Zu wenig Geld'`; `visible false` bei `running`
  oder `stage 3`.
- **`monumentEtaText(w)`** → «frühestens fertig in {formatGameTime(maxRest × MONUMENT_PULL_TICKS)}» bei `running`,
  sonst `''`. 2000 Ticks → «3:20», 560 Ticks → «56 s».
- **`monumentStallReason(w)`** → erster zutreffender Grund, sonst `null`:
  1. `!running` → `null`;
  2. `paused` → «Bau pausiert»;
  3. nicht angebunden → «Nicht angebunden»;
  4. es gibt ein Gut mit Rest > 0, `stock ≤ Reserve`, `buy` an und Zukauf nicht möglich (R7.1) → «Kein Kontor»;
  5. es gibt ein Gut mit Rest > 0, `stock ≤ Reserve`, `buy` an und `money < buyPrice(w, g, 1)`, und kein Gut ist
     lieferbar → «Zu wenig Geld für den Zukauf»;
  6. kein Gut mit Rest > 0 ist lieferbar (aus Lager oder Kauf) → «Lager auf Reserve»;
  7. sonst `null`.
- **`monumentStageLine(w)`**: `running` → «Abschnitt {stage + 1} / 3 · {Name}» (z. B. «Abschnitt 2 / 3 · Terrassen»);
  zwischen Abschnitten → «{stage} / 3 fertig · nächster: {Name}» (z. B. «1 / 3 fertig · nächster: Terrassen»);
  `stage 0` ohne Lauf → «Bauplatz · nächster: Sockel»; `stage 3` → «Denkmal fertig».

## B. Ziel-Chip, Chronik, Ereignisse, Abriss

- **Ziel-Chip** (Phase `'done'`): siehe Spec U-8; Titel bei `monumentDone` «Wahlziel Denkmal erreicht — freies Spiel»,
  ohne Denkmal «Denkmal in der Bauleiste unter Öffentlich», sonst «Wahlziel Denkmal: {monumentStageLine}».
- **`monumentChronicleLine(w)`**: vor `wonMerchants` `null`; `monumentDone` → «Wahlziel erreicht: Das Denkmal steht»;
  ohne Denkmal → «Wahlziel: Denkmal bauen (Öffentlich)»; `running` → «Denkmal: Abschnitt {n}/3 · {x} %»; zwischen
  Abschnitten → «Denkmal: {stage}/3 fertig». `monumentDone` hat Vorrang (auch nach Abriss und Neubau).
- **`monumentEvents(prev, cur, tick)`** → `LogEntry[]` (Muster `crisisLogEntries`): `cur.stage > prev.stage` →
  `{ text: 'Denkmal: Abschnitt {cur.stage} fertig', toast: 'info' }`; danach `!prev.monumentDone && cur.monumentDone`
  → `{ text: 'Wahlziel erreicht: Das Denkmal steht!', toast: null }` (Banner statt Toast). Abriss (`monument` →
  `null`) und gleicher Stand → `[]`. Schnappschuss ohne Denkmal: `stage` = −1 [Tech], damit ein Neubau keinen
  Eintrag erzeugt.
- **Klang:** `diffSoundEvents` bekommt `monumentDone` im Schnappschuss; Übergang false → true liefert das
  Glocken-Ereignis (Datei `public/audio/sfx/bell.mp3`) [Tech: Ereignisname].
- **`monumentNeedsConfirm(w, id)`** (nur bei P-1): `w.monument !== null && id === w.monument.buildingId &&
(w.monument.running || w.monument.stage >= 1)`. Knopftext beim ersten Klick bzw. Tastendruck «Wirklich abreissen?
  Fortschritt geht verloren»; Meldung beim Abriss-Werkzeug «Denkmal nur im Panel abreissen».

## C. Meldungen und Gründe

| Anlass                      | Text                                                            |
| --------------------------- | --------------------------------------------------------------- |
| Start ok                    | «Abschnitt {n} begonnen: {Name}» (z. B. «… 1 begonnen: Sockel») |
| Start mit zu wenig Geld     | «Zu wenig Geld: {Geld} nötig, {money} vorhanden»                |
| übrige Gründe aus R1–R4     | wörtlich über `friendlyReason`                                  |
| Bauleiste, Tooltip-Zeile    | «Wahlziel in drei Abschnitten: Stein, Werkzeug, Glas, Gewürz»   |
| `lockedToolText` vor Ziel 2 | «Denkmal: Erst nach dem Kaufleute-Ziel»                         |
