# UI-TEXTE-1 — Wortlaute und Lesbarkeit (Kurzdesign)

Stand 2026-10-11 · Stufe leicht · Quelle: `docs/beobachtungen.md` (Bündel UI-TEXTE-1), R467, R526, R528.

## Zweck

Spieler lesen im Spiel keine Regeln nach. Widersprüchliche oder blasse Texte («halber Unterhalt» gegen 60 %,
«Höchstens eine Denkmal», kein Hinweis nach dem dritten Ziel) kosten Vertrauen. Dieses Paket gleicht nur
Wortlaut und Farbe an; es ändert keine Spielwerte, keinen Save und keine Sim-Logik.

## Nicht dazugehört

- Keine Änderung an `src/sim/`, an der 60-%-Aufrundung (Spec M13-E1 S4, R467) oder am Ausstoss stillgelegter Betriebe.
- Kein neues Layout, keine Mobil-Optimierung (Desktop-first ab 1280 px; schmale Fenster: nur «stürzt nicht ab», R526).
- Kein neuer Spielstand, keine neuen Schaltflächen ausser den unten genannten Beschriftungen.

## Abhängigkeit

`src/ui/texts.ts` und `src/ui/trade.ts` werden von I-049-UI berührt. Umsetzung (Plan und Code) erst nach I-049-UI,
sonst Merge-Konflikte (R528). Plan durch `lead-tech`.

## Abnahmekriterien

Prüfart V = Vitest (reiner Text-/Helfertest in `tests/ui/`), B = Browser-Check bei 1280×800.

| ID       | Wortlaut / Soll                                                                                                                                                                                                                                                                                                                                                                                                | Fundstelle                                               | Prüfart                                                             |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------- |
| AK-UT-01 | Stilllegen-Status lautet **«Stillgelegt — Unterhalt auf 60 %»**. Beide Fälle (`b.paused`, `state 'paused'`) liefern genau diesen Text. «halber Unterhalt» kommt in `src/ui/` nicht mehr vor (Grep über `src/`; `tests/` und README ausgenommen).                                                                                                                                                               | `src/ui/texts.ts:64`, `:79`                              | V (beide Pfade; Grep-Test auf «halber» in `src/ui/*.ts`)            |
| AK-UT-02 | Die 60 % im Text stammen aus der Regel: Der Test importiert den Wert aus der Def (`src/sim/defs/`) und erwartet ihn im Text; ändert sich der Def-Wert, ändert sich der Text. Fehlt ein lesbarer Def-Wert, meldet der Plan das **vor der Umsetzung** an `lead-design`.                                                                                                                                          | `texts.ts`                                               | V (Import aus der Def)                                              |
| AK-UT-03 | Der Hover-Text für stillgelegte Betriebe bleibt «Stillgelegt» (kurz, ohne Zahl).                                                                                                                                                                                                                                                                                                                               | `src/ui/hover.ts:114`                                    | V (unverändert)                                                     |
| AK-UT-04 | Das README (Abschnitt «Stilllegen») sagt: «zahlt **60 % des Unterhalts** (je Betrieb aufgerundet)». Gilt nach Umsetzung als Doku-Folgeänderung durch `lead-design`.                                                                                                                                                                                                                                            | `README.md` Abschnitt Stilllegen                         | B (Lesen)                                                           |
| AK-UT-05 | Die Zeile für `maxCount.n === 1` lautet **«Nur ein <Name> je Insel»** (Beispiel «Nur ein Denkmal je Insel»). Der Test läuft über **alle** Defs mit `maxCount.n === 1`, keine Namensliste.                                                                                                                                                                                                                      | `src/ui/buildMenu.ts:152`                                | V (Schleife über alle Defs)                                         |
| AK-UT-06 | `nextStep` bei `wonMerchants && wonSpice`: Satz 1 **«Handelsstadt erreicht — spiel frei weiter.»**, Satz 2 **«Das Denkmal bleibt als eigenes Ziel offen.»** Einziger Schalter ist `w.monumentDone`: «offen» und «im Bau» zeigen denselben Text mit Satz 2, nur «fertig» zeigt allein Satz 1.                                                                                                                   | `src/ui/guide.ts:130`                                    | V (offen, im Bau, fertig)                                           |
| AK-UT-07 | Die Beschriftung im Denkmal-Bau-Stand: **«Bau pausieren»** wird zu **«Bau anhalten»** und **«Bau fortsetzen»** bleibt; Panel-Status «Bau angehalten». Begründung: «pausieren» kollidiert mit der Spielpause, «Stilllegen» ist für Betriebe reserviert.                                                                                                                                                         | `src/ui/monumentView.ts:222`, Statuszeile im Panel       | V                                                                   |
| AK-UT-08 | Der Abriss-Knopf trägt den festen Hinweis **«Entf / ⌫»** (U+232B); der Tooltip zeigt ihn ebenso. Die Rücktaste löst den Abriss seit REL-19 aus (`demolishConfirm.ts:14`).                                                                                                                                                                                                                                      | `src/ui/inspect.ts:822, 829, 839, 853`                   | V (Hinweistext)                                                     |
| AK-UT-09 | Der Spaltenkopf im Kontor-Handel zeigt Titel und Edikt-Hinweis **getrennt**: «Kaufen» und darunter in eigener Zeile «Edikt Handel: −20 %». `textContent` der Kopfzelle enthält keinen Zusammenschluss «KaufenEdikt»; `small` ist `display: block`.                                                                                                                                                             | `src/ui/trade.ts:102–107`, `src/style.css` `.trade-head` | V (Zeilenumbruch/Block per Klasse), B (Screenshot mit Edikt Handel) |
| AK-UT-10 | Variante A: Über dem Knopf steht die wörtliche Überschrift **«Speichern»**; die Laden-Liste behält die Überschrift «Laden». Reihenfolge im Menü: Titel, «Speichern» (Überschrift), Speichern-Knopf, «Laden», Liste.                                                                                                                                                                                            | `src/ui/menu.ts:67–128`                                  | V (Reihenfolge der Karten-Kinder), zusätzlich B                     |
| AK-UT-11 | Blasse Texte: Neues Token `--ink-muted: #5a4a30` in `src/style.css`. Alle Texte auf **Pergament** (`.card`, `--parchment` / `--parchment-edge`), die heute `--parchment-muted` nutzen (`.edict-card.locked`, `.edict-when`, `.monument-reserve`, `.ship-reserve` und alle weiteren auf Pergament), wechseln auf `--ink-muted`. `--parchment-muted` bleibt für Texte auf Holz (`.btn`, Kontrast dort ≥ 4,98:1). | `src/style.css:24, 212, 1156, 1205, 1209, 1239`          | V (siehe AK-UT-12)                                                  |
| AK-UT-12 | **Kontrast messbar:** Der bestehende `tests/ui/contrast.test.ts` wird erweitert und nutzt seine vorhandene `luminance` weiter. `--ink-muted` gegen `--parchment` ≥ 4,5:1 (Soll 6,70) und gegen `--parchment-edge` ≥ 4,5:1 (Soll 5,13); `--parchment-muted` gegen `--wood` und `--wood-light` ≥ 4,5:1 (Ist 6,42 / 4,98). Fehler-Ist: `--parchment-muted` gegen `--parchment` = 1,67:1.                          | `src/style.css` Tokens, `tests/ui/contrast.test.ts`      | V                                                                   |
| AK-UT-13 | «lohnt, wenn …»-Zeilen und gesperrte Edikt-Karten verwenden `--ink-muted`; Berechnung wie AK-UT-12 gegen `--parchment` und `--parchment-edge`, je ≥ 4,5:1. Der gestrichelte Rand bleibt als zweites Merkmal.                                                                                                                                                                                                   | Edikt-Panel, `src/style.css`                             | V (Berechnung), B (Sichtprüfung)                                    |
| AK-UT-14 | Die Raten-Anzeige eines stillgelegten Betriebs zeigt keine Produktionszahl «x/min», sondern 0 oder «Stillgelegt».                                                                                                                                                                                                                                                                                              | Raten-Anzeige im Betriebs-Panel (Plan nennt die Stelle)  | V                                                                   |

## Randfälle

- Edikt Handel 0 % (kein Edikt): AK-UT-09 zeigt keine zweite Zeile (Feld bleibt `hidden`).
- Mehrere Zustände von `nextStep` (nur erstes oder nur zweites Ziel): Text unverändert, nur der Endzustand ändert sich.
- Gebäude mit `maxCount.n > 1` bekommen keine «Nur ein»-Zeile.
- Ändert sich später ein Name im Genus: AK-UT-05 nutzt «Nur ein <Name> je Insel» (Name nach «ein» ist kein Artikel-Problem bei Denkmal/Amtsstube/Kontor).

## Entscheidungen

R530 (Gate Spec): Wortlaut «Unterhalt auf 60 %» angenommen; Nachtrag mit neun Punkten eingearbeitet, neu AK-UT-14.
