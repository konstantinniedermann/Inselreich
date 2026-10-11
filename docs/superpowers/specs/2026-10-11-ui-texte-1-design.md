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

| ID       | Wortlaut / Soll                                                                                                                                                                                                                                                                                                                                                                                                | Fundstelle                                                     | Prüfart                                                             |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------- |
| AK-UT-01 | Stilllegen-Status lautet **«Stillgelegt — Unterhalt auf 60 %»**. Beide Fälle (`b.paused`, `state 'paused'`) liefern genau diesen Text. Der Begriff «halber Unterhalt» kommt in `src/ui` nicht mehr vor.                                                                                                                                                                                                        | `src/ui/texts.ts:64`, `:79`                                    | V (beide Pfade; Grep-Test auf «halber» in `src/ui/*.ts` leer)       |
| AK-UT-02 | Der Wert 60 % im Text stammt aus der Regel, nicht aus einer Zahl im Code: Konstante in `src/sim/defs/` bzw. bestehender Def-Wert wird gelesen; ändert sich der Def-Wert, ändert sich der Text. Fehlt ein lesbarer Def-Wert, entscheidet der Plan über den Weg, Text bleibt «60 %».                                                                                                                             | `texts.ts`                                                     | V                                                                   |
| AK-UT-03 | Der Hover-Text für stillgelegte Betriebe bleibt «Stillgelegt» (kurz, ohne Zahl).                                                                                                                                                                                                                                                                                                                               | `src/ui/hover.ts:114`                                          | V (unverändert)                                                     |
| AK-UT-04 | Das README (Abschnitt «Stilllegen») sagt: «zahlt **60 % des Unterhalts** (je Betrieb aufgerundet)». Gilt nach Umsetzung als Doku-Folgeänderung durch `lead-design`.                                                                                                                                                                                                                                            | `README.md` Abschnitt Stilllegen                               | B (Lesen)                                                           |
| AK-UT-05 | Die Zeile für `maxCount.n === 1` lautet **«Nur ein <Name> je Insel»** (Beispiel «Nur ein Denkmal je Insel»); der Name steht im Nominativ, kein Genus-Fehler. Prüfung für jedes Gebäude mit `maxCount.n === 1`.                                                                                                                                                                                                 | `src/ui/buildMenu.ts:152`                                      | V (je Def mit maxCount 1)                                           |
| AK-UT-06 | Nach dem dritten Ziel (`wonMerchants && wonSpice`) lautet `nextStep`: **«Handelsstadt erreicht — spiel frei weiter. Das Denkmal bleibt als eigenes Ziel offen.»** Der Satz fällt weg, sobald das Denkmal fertig ist (`w.monumentDone`-Entsprechung im Weltzustand; Plan nennt das Feld). Wenn kein Denkmal-Zustand existiert, Plan meldet das an Design.                                                       | `src/ui/guide.ts:130`                                          | V (drei Zustände: Denkmal offen, im Bau, fertig)                    |
| AK-UT-07 | Die Beschriftung im Denkmal-Bau-Stand: **«Bau pausieren»** wird zu **«Bau anhalten»** und **«Bau fortsetzen»** bleibt; Panel-Status «Bau angehalten». Begründung: «pausieren» kollidiert mit der Spielpause, «Stilllegen» ist für Betriebe reserviert.                                                                                                                                                         | `src/ui/monumentView.ts:222`, Statuszeile im Panel             | V                                                                   |
| AK-UT-08 | Der Abriss-Knopf trägt den Kürzel-Hinweis **«Entf / ⌫»** (Entf und Rücktaste; auf dem Mac gibt es keine Entf-Taste). Der Tooltip zeigt beide. Die Taste Rücktaste löst den Abriss tatsächlich aus; sonst bleibt der Hinweis «Entf» und der Plan meldet die Lücke.                                                                                                                                              | `src/ui/inspect.ts:822, 829, 839, 853`                         | V (Hinweistext), B (Taste)                                          |
| AK-UT-09 | Der Spaltenkopf im Kontor-Handel zeigt Titel und Edikt-Hinweis **getrennt**: «Kaufen» und darunter in eigener Zeile «Edikt Handel: −20 %». `textContent` der Kopfzelle enthält keinen Zusammenschluss «KaufenEdikt»; `small` ist `display: block`.                                                                                                                                                             | `src/ui/trade.ts:102–107`, `src/style.css` `.trade-head`       | V (Zeilenumbruch/Block per Klasse), B (Screenshot mit Edikt Handel) |
| AK-UT-10 | Im Menü steht die Laden-Liste sichtbar **vor** «Speichern» nicht; Soll: Reihenfolge **Laden, Speichern**, weil Spieler erst einen Stand wählen, dann sichern. Alternativ (Plan wählt, Design empfiehlt Variante A): A = Reihenfolge «Speichern», «Laden» bleibt, aber Überschrift «Speichern» wird ergänzt, damit der Knopf nicht wie ein Eintrag der Laden-Liste wirkt.                                       | `src/ui/menu.ts:67–128`                                        | B                                                                   |
| AK-UT-11 | Blasse Texte: Neues Token `--ink-muted: #5a4a30` in `src/style.css`. Alle Texte auf **Pergament** (`.card`, `--parchment` / `--parchment-edge`), die heute `--parchment-muted` nutzen (`.edict-card.locked`, `.edict-when`, `.monument-reserve`, `.ship-reserve` und alle weiteren auf Pergament), wechseln auf `--ink-muted`. `--parchment-muted` bleibt für Texte auf Holz (`.btn`, Kontrast dort ≥ 4,98:1). | `src/style.css:24, 212, 1156, 1205, 1209, 1239`                | V (siehe AK-UT-12)                                                  |
| AK-UT-12 | **Kontrast messbar:** Test berechnet das WCAG-Kontrastverhältnis aus den Hex-Werten der Tokens. `--ink-muted` gegen `--parchment` ≥ 4,5:1 (Soll 6,70) und gegen `--parchment-edge` ≥ 4,5:1 (Soll 5,13). `--parchment-muted` gegen `--wood` und `--wood-light` ≥ 4,5:1 (Ist 6,42 / 4,98). Ist-Wert des Fehlers: `--parchment-muted` gegen `--parchment` = 1,67:1.                                               | `src/style.css` Tokens, neuer Test `tests/ui/contrast.test.ts` | V                                                                   |
| AK-UT-13 | «lohnt, wenn …»-Zeilen und deaktivierte Edikt-Knöpfe (`.edict-card.locked`, `.btn.unaffordable` auf Pergament) sind mit Browser-Check lesbar: Textfarbe ≥ 4,5:1 gegen den gerenderten Hintergrund (Berechnung per `getComputedStyle`); gestrichelter Rand bleibt als zweites Merkmal.                                                                                                                          | Edikt-Panel                                                    | B                                                                   |

## Randfälle

- Edikt Handel 0 % (kein Edikt): AK-UT-09 zeigt keine zweite Zeile (Feld bleibt `hidden`).
- Mehrere Zustände von `nextStep` (nur erstes oder nur zweites Ziel): Text unverändert, nur der Endzustand ändert sich.
- Gebäude mit `maxCount.n > 1` bekommen keine «Nur ein»-Zeile.
- Ändert sich später ein Name im Genus: AK-UT-05 nutzt «Nur ein <Name> je Insel» (Name nach «ein» ist kein Artikel-Problem bei Denkmal/Amtsstube/Kontor).

## Entscheidungsbedarf für L0

1. Wortlaut «Unterhalt auf 60 %» statt «halber Unterhalt»: Entwurf für ein Ruling (kein neuer Spielwert, folgt R467 Befund 4).
2. «Ausstoss weiter 15/min» aus der Beobachtung ist nicht eindeutig; Plan prüft, ob eine Raten-Anzeige für stillgelegte Betriebe noch 15/min zeigt (dann Fehler in Anzeige, sonst gegenstandslos).
