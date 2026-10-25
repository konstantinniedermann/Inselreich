# T06 · Integration und Defs-Wächter (Grep-Test)

Umsetzer `tech-sim-engineer` · ≈ 25 Tools · AK-SR-21, AK-SR-20 (Lauf) · blocked-by: T02, T03, T04, T05 · Worktree `.worktrees/seerecht` (`feat/seerecht`) · Spec §3.2 «einziger Leseort», §7 AK-SR-21, Gate Q3

## Vorher (Controller)

In `.worktrees/seerecht`: `git merge feat/seerecht-render`, `git merge feat/seerecht-save` (disjunkte Dateien, kein Rebase); `feat/seerecht-ui` erst nach dem Rot-Beleg (Step 2). Konflikt → `blocked` an `lead-tech`.

## Dateien

- ändern: `tests/sim/seerecht.test.ts` (neuer Block)
- nur bei Befund des Wächters: die betroffene Lesestelle (Befund im Bericht, Controller entscheidet über Fix-Runde beim Eigentümer-Task)

## Verhalten (Wächter, Node `fs` wie `tests/sim/forest.test.ts`)

Rekursiv alle `*.ts` unter `src/sim`, `src/render`, `src/ui` lesen, `src/sim/defs/` ausgenommen.

1. **Faktor-Muster (geschärft, R828 B2):** reine Funktion in der Testdatei `factorHit(line: string): boolean` = Schlüsselwort **und** Faktor:
   - Schlüsselwort `/(?<![a-z])(?:lane|travel|ticks?)|Lane|Travel|Ticks/` (Wortanfang, damit `plane` nicht trifft; `laneTicks`, `travelTicksOf`, `cycleTicks` treffen);
   - Faktor `/(?<![\w.])(?:8|10)(?![\w.])\s*[*\/]|[*\/]\s*(?:8|10)(?![\w.])/` (Ziffern-Grenze: `0.8`, `1000`, `x10` treffen nicht).
   - `ALLOW: { file: string; line: string; why: string }[]` mit genau einem Eintrag: `src/ui/time.ts` `perMinute` (`* 10) / 10`, Rundung auf eine Nachkommastelle, kein Fahrzeit-Bezug; Schlüsselwort über `perTicks`). Der zweite bekannte Fehltreffer `src/render/sprites.ts:2067` (`0.8 * 0.5`, `plane`) fällt durch das geschärfte Muster weg und braucht keinen Eintrag. Weitere Einträge nur mit `why` und Nennung im Bericht.
   - Selbsttest `it('factorHit trifft Fahrzeit-Faktoren, nicht Dezimalzahlen')`: wahr für `ship.left = 10 * lane.d`, `travel * 8`, `const t = cycleTicks / 10`; falsch für `R(0.2, 0.4, 0.35 * 0.5 * h, 0.8 * 0.5 * h), plane: 0.56`, `ticks * 100`, `lane.d * 1000`.
2. **Leser-Muster:** `/\b(travelTicks|laneTicks)\(/` nur in `src/sim/islands.ts`, `src/sim/council.ts`, `src/sim/save.ts`.
3. **Werte genau einmal:** in `src/sim/defs/council.ts` genau eine Zeile mit `/kind: 'seaTileTicks', value: 8\b/`; in `src/sim/defs/sea.ts` genau eine Zeile mit `/SHIP_TICKS_PER_SEA_TILE\s*=\s*10\b/`.

Fehlermeldung nennt Datei, Zeilennummer und Zeile.

## Steps

- [ ] **Test schreiben** `it('AK-SR-21 Fahrzeit nur über den Helfer, 8 und 10 nur in den Defs')` (drei `expect` nach Verhalten 1–3) und den Selbsttest `factorHit`.
- [ ] **Rot-Beleg getrennt nach Muster (R828 B2):** (a) **Faktor-Muster:** Selbsttest `factorHit` zuerst gegen eine Funktion `() => false` laufen lassen → rot, dann Muster einsetzen → grün; der Datei-Scan mit Faktor-Muster ist auf dem Stand nach T02/T05 schon grün (sonst Befund). (b) **Leser-Muster:** Der Controller merged `feat/seerecht-ui` als **letzten** Zweig; den Test vorher laufen lassen: `npx vitest run tests/sim/seerecht.test.ts; echo EXIT=$?` → ≠ 0 nur wegen `travelTicks(` in `src/ui/islandCard.ts`/`homeTravel.ts` (Ausgabe in den Bericht). Dann Merge `feat/seerecht-ui`.
- [ ] **Lauf grün** nach allen drei Merges: `npx vitest run tests/sim/seerecht.test.ts; echo EXIT=$?` → 0.
- [ ] **Abgleich `rg`:** `rg -n "travelTicks|laneTicks|SHIP_TICKS_PER_SEA_TILE|homeTravelTicks|ticksCache" src tools` — Liste mit der Tabelle «Fahrzeit-Lesestellen» im Plan-Index vergleichen, Abweichung im Bericht.
- [ ] **Balancing (AK-SR-20), Teilbeleg:** `git diff main -- tests/sim/balance*.test.ts src/sim/defs/sea.ts` leer; der gezielte Balancing-Lauf folgt in T09, der volle Lauf (`make push-check`) beim Integrator (R858, R860).
- [ ] **Teilbeleg:** `npx tsc --noEmit; echo EXIT=$?` → 0 und `make lint; echo EXIT=$?` → 0 (statt `make check`).
- [ ] **Commit:** `test: Wächter für die Fahrzeit-Lesestellen (I-153 T06)`.

## Task-Review (per `SendMessage` an den T02-Reviewer)

Selbsttest deckt Treffer und Fehltreffer; `ALLOW` nur `time.ts` mit `why`; Balancing ohne Diff, verbindlicher Lauf erst in T09 (R-SR-P3); T06-Lauf nur bei freier Sperre, sonst `git diff` leer als Teilbeleg.
