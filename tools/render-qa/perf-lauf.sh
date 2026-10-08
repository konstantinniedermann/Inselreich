#!/bin/bash
# perf-lauf.sh — Perf-Serie über Seeds und Fokus mit perf.mjs (REL-07 Nachprüfung, R313 d): 1920x1080, DPR 1, Zoom 1.
# Lastabbruch (R329): vor jedem perf.mjs-Aufruf prüft lastgate.mjs; Load > 4 -> Abbruch mit Exit 1, kein Warten.
# Ausgabe nach E-039: <out>/aa-<A>-perf-s<seed>-z1-<fokus>-1920.txt bzw. ab-<A>-vs-<B>-..., erste Zeile = Kopf
# mit Vergleichsart und beiden Commit-Hashes, `uptime` vor und nach dem Lauf (R329).
set -u
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TOP="$(git -C "$HERE" rev-parse --show-toplevel)"
A="$TOP"; B=""; SEEDS="7,14"; FOCI="home,mountain"; RUNS=3; OUT=""
usage() {
  cat <<'USAGE'
perf-lauf.sh — Perf-Serie (perf.mjs) über Seeds und Fokus, mit Lastabbruch (R329) und Namensschema (E-039).
Aufruf: tools/render-qa/perf-lauf.sh [--a <wurzel>] [--b <wurzel>] [--seeds 7,14] [--focus home,mountain]
                                      [--runs 3] [--out <ordner>] [--help]
  --a, --b   Arbeitsstände (Verzeichnisse). Standard: A = Repo-Stamm; ohne --b ist B = A (Vergleichsart aa-).
  --seeds    kommagetrennte Seeds (Standard 7,14); je Seed ein eigener perf.mjs-Aufruf.
  --focus    kommagetrennte Fokus-Werte (home, archipel, mountain, none; Standard home,mountain).
  --runs     Läufe je Aufruf (Standard 3).
  --out      Ausgabeordner (Standard <A>/.studio/qa/perf).
Lastregel: Load (1 min) > 4 -> Abbruch mit Exit 1 (lastgate.mjs). Exit 1 auch, wenn ein perf.mjs-Aufruf scheitert.
Probe der Lastgrenze: LASTGATE_FAKE_LOAD=9 tools/render-qa/perf-lauf.sh   (simulierte Last, nur Test/Probe)
USAGE
}
while [ $# -gt 0 ]; do
  case "$1" in
    --a) A="$2"; shift 2 ;;
    --b) B="$2"; shift 2 ;;
    --seeds) SEEDS="$2"; shift 2 ;;
    --focus) FOCI="$2"; shift 2 ;;
    --runs) RUNS="$2"; shift 2 ;;
    --out) OUT="$2"; shift 2 ;;
    --help|-h) usage; exit 0 ;;
    *) echo "unbekannte Option: $1" >&2; usage >&2; exit 2 ;;
  esac
done
[ -n "$B" ] || B="$A"
[ -n "$OUT" ] || OUT="$A/.studio/qa/perf"
mkdir -p "$OUT"
RC=0
IFS=',' read -r -a SEED_LIST <<< "$SEEDS"
IFS=',' read -r -a FOCUS_LIST <<< "$FOCI"
KOPF="$(node "$HERE/vergleich.mjs" kopf "$A" "$B")"
for s in "${SEED_LIST[@]}"; do
  for f in "${FOCUS_LIST[@]}"; do
    # Lastabbruch zu Beginn jedes Aufrufs; Meldung kommt von lastgate.mjs (stderr), Exit 1.
    node "$HERE/lastgate.mjs" || exit 1
    file="$OUT/$(node "$HERE/vergleich.mjs" name "$A" "$B" "perf-s$s-z1-$f-1920.txt")"
    { echo "$KOPF"; echo "uptime vor: $(uptime)"; } > "$file"
    node "$HERE/perf.mjs" --a "$A" --b "$B" --seed "$s" --zoom 1 --focus "$f" --dpr 1 --w 1920 --h 1080 --runs "$RUNS" >> "$file" 2>&1 || RC=1
    echo "uptime nach: $(uptime)" >> "$file"
    echo "geschrieben: $file"
  done
done
echo FERTIG
exit $RC
