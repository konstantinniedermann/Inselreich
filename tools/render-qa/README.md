# tools/render-qa — Render-QA- und Messskripte

Nur Entwicklungswerkzeug (macOS, Headless-Chrome, Vite), nie im Build. Alle Skripte haben `--help`.

## Skripte

| Skript                                                                                           | Zweck                                                                                                             | Aufruf (Kurzform)                                                                 |
| ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `hitch.mjs`                                                                                      | Bau-Ruckel-Messung (Frames > 25 ms je Hausbau); Schalter `--ohne-bau`, `--detail`, `--swaps`                      | `node tools/render-qa/hitch.mjs --a <A> [--b <B>] --seed 7,14 --runs 3`           |
| `altwald.mjs`                                                                                    | Waldaufbau-Probe (Kontaktbogen, Differenz je Frame) beim Hausbau am Waldrand                                      | `node tools/render-qa/altwald.mjs --root <A> --seed 7 --spot 0`                   |
| `proben.mjs`                                                                                     | Fernansicht-Proben Wrack/Eiland bei Zoom 0.25 und 0.5 (Screenshots)                                               | `node tools/render-qa/proben.mjs --root <A> --seed 7,14`                          |
| `perf-lauf.sh`                                                                                   | Serie `perf.mjs` über Seeds und Fokus mit Kopf, `uptime` vor/nach                                                 | `tools/render-qa/perf-lauf.sh --a <A> --b <B> --seeds 7,14 --focus home,mountain` |
| `lastgate.mjs`                                                                                   | Lastabbruch (R329), Exit 0/1                                                                                      | `node tools/render-qa/lastgate.mjs`                                               |
| `vergleich.mjs`                                                                                  | Vergleichsart, Dateiname und Kopf (E-039); CLI `kopf`/`name` für Shell                                            | `node tools/render-qa/vergleich.mjs kopf <A> <B>`                                 |
| `sitzung.mjs`                                                                                    | gemeinsamer Sitzungshelfer (Spielstand per Seed, Dev-Hooks `__inselDev`, Argumente)                               | Bibliothek, kein Aufruf                                                           |
| `perf.mjs`, `galerie.mjs`, `probenblatt.mjs`, `sichtvergleich.mjs`, `messfenster.mjs`, `lib.mjs` | bestehend: renderMedian A/B; Galerie; Probenblatt; Sichtvergleich; Mess-Wächter (fremde Prozesse); Browser-Helfer | siehe Kopfkommentar je Datei                                                      |

## Lastregel (R329, R330)

Mess- und Ruckel-Skripte (`hitch`, `altwald`, `proben`, `perf-lauf`) rufen zu Beginn `lastgate.mjs`: Liegt der
1-min-Load (`os.loadavg()[0]`) über **4** (Konstante `LOAD_MAX`), brechen sie ohne Warten mit Exit 1 und deutscher
Meldung ab. `--help` läuft ohne Prüfung. Zum Belegen der Abbruchlogik: `LASTGATE_FAKE_LOAD=9 node tools/render-qa/lastgate.mjs`
(simulierte Last, nur für Test und Probe). `uptime` vor und nach dem Lauf gehört in den Beleg (`perf-lauf.sh` schreibt es mit).

## Namensschema (E-039, R315)

- Wurzeln per `--root` (Einzelstand) bzw. `--a`/`--b` (Verzeichnisse); Standard ist der Repo-Stamm (`git rev-parse --show-toplevel`).
- Ausgabe in `--out` (Standard `<Wurzel>/.studio/qa/<skript>`).
- Dateiname: `aa-<Stand>-<name>` (gleicher Stand gegen sich, auch Einzelstand-Läufe) oder `ab-<A>-vs-<B>-<name>`.
- Erste Zeile jeder Textausgabe: `Vergleich: A/A|A/B | A=<Stand>@<Hash> | B=<Stand>@<Hash>` mit beiden Commit-Hashes.
- Tests: `tests/tools/renderqa.test.ts` (Lastabbruch, Vergleich; ohne Browser).
