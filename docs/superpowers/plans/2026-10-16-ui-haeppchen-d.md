# Plan UI-HAEPPCHEN-D · Ereignis-Log vollständig, mit I-109 «Reichweite am Gut-Chip» (Stufe leicht)

Owner `lead-tech` · Quelle: Kurzdesign `design/ui-haeppchen-d` @ `ce2f3689` (R640, R641), Kurzdesign `design/i109` @ `7e25d7cf` (R653, R654), R660. Plan gegen main `2e7a269f` (Handel 2 ist auf main).
Spielerwirkung: Der Spieler findet im Log, was ohne sein Zutun geschah (verfallenes Angebot, verfallener Auftrag, automatische Vertragslieferung), auch bei «Krisen: aus». Am Gut-Chip sieht er, wann ein Gut ausgeht («Nahrung ↓ 2:10»), und baut vor dem Mangel.
**Kein Save** (`SAVE_VERSION` unverändert), **kein Spielwert** (`src/sim/` und `src/sim/defs/` ohne Diff, `balance.test.ts` unberührt), keine Abhängigkeit (ADR-001), kein Architekturentscheid, kein ADR. **Umsetzung erst nach `make push-check` Exit 0 für REL-23 (R464, R660).**

## Bündelungsentscheid (Empfehlung an L0)

- **I-109 wird gebündelt** (Teil B dieses Plans): Dateien disjunkt zu Teil A (A: `crisisLog.ts`, `eventLogView.ts`, `app.ts`, neu `autoLog.ts`, `order.ts`; B: `hud.ts`, `time.ts`, `style.css`, neu `reach.ts`); beide Kurzdesigns tragen Selbstprüfung OK und 9 AK, Save nein. Ein Gate Plan, ein Browser-Check, ein Final-Review spart ≈ 1 Gate und ≈ 1 Final-Review gegenüber zwei Paketen. Teil B ist unabhängig lieferbar: fällt B im Review durch, wird A allein gemergt (Teile sind getrennte Commit-Reihen, T06 setzt nicht auf A auf).
- **I-102 wird nicht gebündelt.** Es gibt nur den Ideen-Eintrag (`docs/ideen.md`, «bewertet», Entscheid offen), kein Kurzdesign mit AK, also nichts Planbares (Gate Brainstorming fehlt, R653 sieht es als eigenes Häppchen). Es berührt `order.ts` / Auftragskarte (Überschneidung mit T04) und hat eigene Randfälle (Stufenaufstieg ändert das Gut, Vertrag, Sperrperiode). Empfehlung: Kurzdesign I-102 als nächster freier Platz, danach eigenes Häppchen.
- **Reihenfolge laut R654:** A (T01–T05), dann B (T06–T08), Doku T09. Ein Strang, seriell (Testlock/Load; parallele Stränge brächten bei ≈ 9 kleinen Tasks wenig).

## Kurz-Spec (Abweichungen und Festlegungen zu den Kurzdesigns)

- **Zufallsauftrag-Verfall** (A Regel 3) steht in neuer Datei `src/ui/autoLog.ts`; `farLogEntries` bleibt unverändert, **AK-H2-33 (d)** in `tests/ui/farOrder.test.ts` («`farLogEntries` liefert `[]`, `orderMessage` meldet») bleibt gültig und wird nicht angefasst. Die bestehende Toast-Meldung «Auftrag verfallen» (`orderMessage`) bleibt; der neue Log-Eintrag hat `toast: null` (kein Doppel-Toast). Der Kurzdesign-Satz «ersetzt AK-H2-33» gilt damit für den _Eintrag_, nicht für die Meldung.
- **Stammkunden-Angebot** (A Regel 2): Vergleich `prev.contractOffer` (Kopie) gegen `world.contractOffer` vor/nach dem Frame; verfallen = vorher gesetzt, nachher `null` oder anderes Angebot. Annehmen/Ablehnen setzt den Vergleichswert im Handler selbst zurück (Muster `prevOrder = null` in `app.ts`).
- **Vertrag** (A Regel 4): `contractLogEntries(reports, world)` aus `StepReport.contract` über `contractNotice` (gleicher Text); `delivered` → `info`, `broken` → `warn`. Zeitstempel = `world.tick` am Frameende.
- **Zeitformat B:** `formatGameTime` liefert unter einer Minute «40 s» (nicht «0:40» wie in den Beispielen des Kurzdesigns). Massgeblich ist `formatGameTime` (eine Quelle, Kurzdesign Regel 1); Suffix «↓ 40 s» hat 6 Zeichen statt 5. T07 prüft bei 1280 px, dass die Leiste nicht umbricht; Abweichung vom «höchstens 5 Zeichen» im Task-Bericht und Ruling-Entwurf an L0.
- **Schwellen B** (R654 O-1): UI-Konstanten in `src/ui/reach.ts`: `REACH_WARN_EMPTY = 180 s`, `REACH_ALARM_EMPTY = 60 s`, `REACH_WARN_FULL = 60 s`, umgerechnet über `TICK_MS` (`secToTicks`), nicht in `defs/`.

## Dateimatrix (Ownership)

| Datei                                                                     | T01 | T02 | T03 | T04 | T06 | T07 | T09 |
| ------------------------------------------------------------------------- | --- | --- | --- | --- | --- | --- | --- |
| `src/ui/crisisLog.ts`, `tests/ui/crisisLog.test.ts`                       | ja  |     |     |     |     |     |     |
| `src/ui/autoLog.ts` (neu), `tests/ui/autoLog.test.ts` (neu)               |     | ja  | ja  |     |     |     |     |
| `src/ui/app.ts`, `src/ui/eventLogView.ts` (nur Kommentar)                 | ja  |     |     | ja  |     |     |     |
| `src/ui/reach.ts` (neu), `tests/ui/reach.test.ts` (neu), `src/ui/time.ts` |     |     |     |     | ja  |     |     |
| `src/ui/hud.ts`, `tests/ui/hud.test.ts`, `src/style.css`                  |     |     |     |     |     | ja  |     |
| `README.md`, `docs/arc42.md`, `docs/ideen.md`, `docs/beobachtungen.md`    |     |     |     |     |     |     | ja  |

`src/ui/app.ts` berühren T01 (nur `crisisLogVisible` → `eventLogVisible`) und T04 (Verdrahtung): seriell, daher ein Strang, Worktree `.worktrees/ui-haeppchen-d-impl` ab `plan/ui-haeppchen-d`, main per Merge holen. Nicht angefasst: `src/sim/`, `src/render/`, `src/audio/`, `docs/studio/`, `tests/sim/`. Ownership-Erweiterung nur vorab melden.

## Tasks

| Task | Titel                                                  | Datei                 | AK-IDs                  | Strang | blocked-by  | Modell | Tools |
| ---- | ------------------------------------------------------ | --------------------- | ----------------------- | ------ | ----------- | ------ | ----- |
| T00  | Zeitmessung berührter Tests vorher (Controller, R392)  | `T00-zeitmessung.md`  | –                       | 1      | REL-23 live | sonnet | 8     |
| T01  | Sichtbarkeit und `LOG_MAX` 20                          | `T01-sichtbarkeit.md` | AK-UD-01, 02, 06        | 1      | T00         | sonnet | 30    |
| T02  | Verfall: Zufallsauftrag und Stammkunden-Angebot        | `T02-verfall.md`      | AK-UD-03, 04, 05a       | 1      | T01         | sonnet | 40    |
| T03  | Vertragslieferung und -bruch ins Log                   | `T03-vertrag.md`      | AK-UD-05b               | 1      | T02         | sonnet | 25    |
| T04  | Verdrahtung in `app.ts` (Vergleich, Rücksetzen, Laden) | `T04-verdrahtung.md`  | AK-UD-07 bis 09         | 1      | T03         | sonnet | 40    |
| T06  | `reachView` und Schwellen (I-109)                      | `T06-reach.md`        | AK-UR-01 bis 03         | 1      | T04         | sonnet | 35    |
| T07  | Chip, Tooltip, `refresh()`, CSS (I-109)                | `T07-chip.md`         | AK-UR-04 bis 09         | 1      | T06         | sonnet | 50    |
| T08  | Browser-Check A und B (`qa-playtester`)                | `T08-playtest.md`     | AK-UD-07, 08; UR-07, 08 | 1      | T07         | sonnet | 30    |
| T09  | Doku (D1, E-017) und Zeitmessung nachher               | `T09-doku.md`         | AK-UD-10, UR-10         | 1      | T08         | sonnet | 30    |

(T05 entfällt; Nummern T06 ff. bleiben, damit Teil B in den Kurzdesign-Verweisen stabil ist.) Summe ≈ 290 Tools Umsetzer. Umsetzer `tech-ui-engineer`; je Task `qa-code-reviewer` (sonnet); T08 `qa-playtester` für A und B gemeinsam (1280×720 und 1920×1080, Screenshots `.studio/qa/ui-haeppchen-d/`); letzter Review über die Branch mit `model: opus` als Final-Review (Stufe leicht). Fix-Runden per SendMessage.
**Budgetantrag:** 7 Umsetzer-Pakete (T01–T04, T06, T07, T09) × 2 + 1 Playtest + 1 Final-Review = 16, + 30 % Puffer = **21 Starts**, Parallelität 1.

## AK-Zuordnung

`AK-UD-nn` = Kurzdesign D `AK-n`; `AK-UD-05` ist in 05a (Verfall nicht notable) und 05b (Vertrag notable) geteilt; `AK-UD-10` = Doku. `AK-UR-nn` = Kurzdesign I-109 `AK-n`; `AK-UR-10` = Doku. Jede AK mit Art Vitest hat einen Testfall, der **vor** der Umsetzung rot ist.

## Zeitmessung berührter Tests (R392)

Nicht ausgeführt (R464, Push REL-23 läuft). **T00** (Controller, vor T01, Load ≤ 4, Testlock beachten): `npx vitest related --run src/ui/crisisLog.ts src/ui/app.ts src/ui/order.ts src/ui/farOrder.ts src/ui/hud.ts src/ui/time.ts` nach `.studio/qa/ui-haeppchen-d/zeit-vor.json`; in T09 derselbe Befehl nach `zeit-nach.json`. Bericht mit Vergleichstabelle (Datei, Dauer vor/nach, Differenz); Abnahme, wenn kein berührter Testfall um mehr als 25 % und kein Lauf über 50 % des Timeouts liegt (R593), sonst Beobachtung oder Fix-Task. Anhalt: `hud.test.ts` ≈ 37, `crisisLog.test.ts`, `farOrder.test.ts`, `order.test.ts` kleine Zahlen; `app.ts` hat keinen Unit-Test.

## Pflichtläufe

**Je Task mit `.ts`-Änderung (T01–T04, T06, T07):** `npx tsc --noEmit; echo EXIT=$?` und `make lint; echo EXIT=$?` mit Exit 0 im Task-Bericht. **Vor «bereit»:** zusätzlich `make zeittests; echo EXIT=$?` und `make conflicts; echo EXIT=$?`.

**Rot-Beleg:** je neuem Testfall die rote Ausgabe vor der Umsetzung im Task-Bericht (R395, R410); Commit-Reihenfolge allein genügt nicht. Neue Tests lokal × 3 grün. Am Ende `make check; echo EXIT=$?`, `make zeitreserve-gate; echo EXIT=$?`, `make docs-check; echo EXIT=$?`; `git diff main -- src/sim tests/sim` leer (AK-UD-09, AK-UR-09); Spielstand ohne Log-/Reach-Feld.
