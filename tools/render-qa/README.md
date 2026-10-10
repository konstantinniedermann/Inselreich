# tools/render-qa — Render-QA- und Messskripte

Nur Entwicklungswerkzeug (macOS, Headless-Chrome, Vite), nie im Build. Alle Skripte haben `--help`.

## Skripte

| Skript                                                                                           | Zweck                                                                                                                                                                                             | Aufruf (Kurzform)                                                                                   |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `hitch.mjs`                                                                                      | Bau-Ruckel-Messung (Frames > 25 ms je Hausbau); Schalter `--ohne-bau`, `--detail`, `--swaps`                                                                                                      | `node tools/render-qa/hitch.mjs --a <A> [--b <B>] --seed 7,14 --runs 3`                             |
| `altwald.mjs`                                                                                    | Waldaufbau-Probe (Kontaktbogen, Differenz je Frame) beim Hausbau am Waldrand                                                                                                                      | `node tools/render-qa/altwald.mjs --root <A> --seed 7 --spot 0`                                     |
| `proben.mjs`                                                                                     | Fernansicht-Proben Wrack/Eiland bei Zoom 0.25 und 0.5 (Screenshots)                                                                                                                               | `node tools/render-qa/proben.mjs --root <A> --seed 7,14`                                            |
| `blindprobe.mjs`                                                                                 | Anonymer Bildsatz Meeresfels/Boot für die Blindprobe (ART-MEERESFELS, E-018): `probe-nn.png` gemischt, Zuordnung getrennt in `ZUORDNUNG-NICHT-OEFFNEN.json`; `--nur fels` für den Vergleichsstand | `node tools/render-qa/blindprobe.mjs [--root <A>] [--nur fels]`                                     |
| `perf-lauf.sh`                                                                                   | Serie `perf.mjs` über Seeds und Fokus mit Kopf, `uptime` vor/nach                                                                                                                                 | `tools/render-qa/perf-lauf.sh --a <A> --b <B> --seeds 7,14 --focus home,mountain`                   |
| `kalt.mjs`                                                                                       | Kaltstart-Messung: ms seit Navigation bis `cachesReady()` (PERF-L57)                                                                                                                              | `node tools/render-qa/kalt.mjs --a <A> [--b <B>] --seed 14 --runs 2`                                |
| `quoten.mjs`                                                                                     | Seltenheitsquoten (ART-L8-SELTEN): Histogramm S/E je Insel, Quote je Element gegen Soll ±10 pp, Katalog-Sichtanteil über 5er-Seed-Gruppen; reine Platzierung, kein Browser                        | `node tools/render-qa/quoten.mjs [--von 1] [--bis 500]`                                             |
| `korridor.mjs`                                                                                   | Meer-Korridor (SEE-F1-KORRIDOR): Lane-Abstand aller Meer-Elemente und Anteil Wrack/Eiland/Felsen <= 2 Kacheln von einer Route, Seeds 1–200; reine Platzierung, kein Browser                       | `node tools/render-qa/korridor.mjs [--von 1] [--bis 200]`                                           |
| `lastgate.mjs`                                                                                   | Lastabbruch (R329), Exit 0/1                                                                                                                                                                      | `node tools/render-qa/lastgate.mjs`                                                                 |
| `vergleich.mjs`                                                                                  | Vergleichsart, Dateiname und Kopf (E-039); CLI `kopf`/`name` für Shell                                                                                                                            | `node tools/render-qa/vergleich.mjs kopf <A> <B>`                                                   |
| `smoke.mjs`                                                                                      | Release-Smoke a–f + Menü bei 1280×720 und 1920×1080 (echte CDP-Eingaben), Konsolenzählung, Exit 1 bei Fehlschlag; Bilder unter `.studio/qa/<paket>/smoke/`                                        | `node tools/render-qa/smoke.mjs --paket REL-09 [--seed 7] [--size 1280x720,1920x1080] [--root <W>]` |
| `seekarte.mjs`                                                                                   | Szene Seekarte (Kontor auf Insel 1, Schiffe, Route, Hafenschiff), Screenshots je Grösse und dpr, Prüfzeile Kontor-Marke; `--leck` zählt die Inselmenü-Listener vor/nach zwei Neustarts            | `node tools/render-qa/seekarte.mjs [--size 1280x720] [--dpr 1,2] [--leck] [--port 5291]`            |
| `sitzung.mjs`                                                                                    | gemeinsamer Sitzungshelfer (Spielstand per Seed, Dev-Hooks `__inselDev`, Argumente)                                                                                                               | Bibliothek, kein Aufruf                                                                             |
| `perf.mjs`, `galerie.mjs`, `probenblatt.mjs`, `sichtvergleich.mjs`, `messfenster.mjs`, `lib.mjs` | bestehend: renderMedian A/B; Galerie; Probenblatt; Sichtvergleich; Mess-Wächter (fremde Prozesse); Browser-Helfer                                                                                 | siehe Kopfkommentar je Datei                                                                        |

## Release-Smoke (R365)

`smoke.mjs` ersetzt die Wegwerf-Skripte des Playtesters beim Release-Check: Seed-Karte laden, schwenken/zoomen (a), Haus bauen,
Panel, Pipette, Umschalt+U (b), Leertaste antippen/halten (c), Bau im Wald (d), Speichern und Laden mit Vorher/Nachher (e),
Menü bei jeder Grösse: `scrollTop` 0 und «Speichern» sichtbar (m), Konsole (f). Der Playtester beurteilt die Bilder und ergänzt
nur paketspezifische Schritte. Läuft gegen `--root` (Standard: der Checkout des Skripts); Vite und Chrome beendet `lib.mjs` auch
bei Fehler. Kein Messlauf: hohe Last bricht nicht ab, wird nur im Kopf vermerkt. Exit 0 bestanden, 1 Schritt oder Konsole
fehlgeschlagen, 2 Aufruffehler.

## Lastregel (R329, R330)

Mess- und Ruckel-Skripte (`hitch`, `kalt`, `altwald`, `proben`, `perf-lauf`) rufen zu Beginn `lastgate.mjs`: Liegt der
1-min-Load (`os.loadavg()[0]`) über **4** (Konstante `LOAD_MAX`), brechen sie ohne Warten mit Exit 1 und deutscher
Meldung ab. `--help` läuft ohne Prüfung. Zum Belegen der Abbruchlogik: `LASTGATE_FAKE_LOAD=9 node tools/render-qa/lastgate.mjs`
(simulierte Last, nur für Test und Probe). `uptime` vor und nach dem Lauf gehört in den Beleg (`perf-lauf.sh` schreibt es mit).

## Namensschema (E-039, R315)

- Wurzeln per `--root` (Einzelstand) bzw. `--a`/`--b` (Verzeichnisse); Standard ist der Repo-Stamm (`git rev-parse --show-toplevel`).
- Ausgabe in `--out` (Standard `<Wurzel>/.studio/qa/<skript>`).
- Dateiname: `aa-<Stand>-<name>` (gleicher Stand gegen sich, auch Einzelstand-Läufe) oder `ab-<A>-vs-<B>-<name>`.
- Erste Zeile jeder Textausgabe: `Vergleich: A/A|A/B | A=<Stand>@<Hash> | B=<Stand>@<Hash>` mit beiden Commit-Hashes.
- Tests: `tests/tools/renderqa.test.ts` (Lastabbruch, Vergleich; ohne Browser).
