# T09 · Perf-Messung AK-V11 (40 Figuren, ≤ +0,3 ms)

`qa-playtester` (fortgesetzt aus T08) · ≈ 20 Tools · AK-V11 · blocked-by T08 und ruhiges Lastfenster

## Bedingungen

- **ORT-A-Messungen haben Vorrang:** Vor dem Start `uptime` (1-min-Load ≤ 4), kein `vitest`/`make check`/`perf.mjs`-Lauf anderer Controller (`ps`, Vorbild `tools/render-qa/messfenster.mjs`). Sonst `waiting` melden, nicht erzwingen.
- Messung gegen main als Referenz im selben Fenster (abwechselnd, wie `perf-lauf.sh`).

## Ablauf

`tools/render-qa/perf.mjs` mit 40 Figuren bei Zoom 1 (Aufruf per `tools/render-qa/README.md`); Median der Frame-Mehrkosten gegen main ≤ 0,3 ms; keine neue Obergrenze in `limits.ts`. Bei Überschreitung: Zahlen in den Bericht, Rückgabe an T05 (Pfade bündeln, Strichvariante bei Zoom < 1), nicht selbst ändern. Keine Datei im Repo ändern.
