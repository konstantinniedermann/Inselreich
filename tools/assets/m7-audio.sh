#!/usr/bin/env bash
# tools/assets/m7-audio.sh — Schnitt und Kodierung der M7-Audiodateien (ADR-011 Punkt 7, Spec 7.6 und 8)
#
# Aufruf:   tools/assets/m7-audio.sh <Ordner mit den Originalen>
# Ziel:     <Repo>/public/audio/{music,amb,sfx}/   (die Schrift wird nicht geschnitten, siehe unten)
# Netz:     keines. ffmpeg/ffprobe sind lokale Werkzeuge, keine Projekt-Abhängigkeit (ADR-001).
#
# Erwartete Originale im Ordner (Dateinamen, SHA-256 siehe docs/CREDITS.md und das Lizenzurteil):
#   MU1_The_Bards_Tale.mp3  MU2_The_Old_Tower_Inn.mp3  MU3_Dowland_If_my_Complaints.mp3   (OpenGameArt-Dateien)
#   AM1_852826.mp3 AM2_855955.mp3 AM3_317676.mp3 AM4_857163.mp3 AM5_321885.mp3 AM6_341941.mp3 AM7_564621.mp3
#   SG1_582523.mp3 SG2_673668.mp3 FX1_847349.mp3 FX2_707864.mp3   (Freesound, HQ-Vorschau "<id>_<n>-hq.mp3")
# Quelle im Nachweis ist immer die Sound-Seite (nie die CDN-URL); die Zahl im Dateinamen ist die Freesound-ID.
#
# Pegelpolitik (Vorgabe lead-art, gemessen mit ebur128, EBU R128 / BS.1770):
#   - Statischer Gain "volume=<x>dB" je Datei, kein dynamisches loudnorm; nur die Glocke (bell) läuft zusätzlich über einen weichen Limiter.
#   - Gemessen wird so, wie der Browser spielt: Mono-Dateien als L=R (Web Audio kopiert Mono auf beide Kanäle,
#     das sind +3 LU gegenüber einer Ein-Kanal-Messung).
#   - Ziele (integriert): Musik -18 LUFS; Umgebung -26 LUFS (Möwen -28, Sturm -24); Signale (bell, foghorn)
#     -14 LUFS; Effekte (coins, hammer) -20 LUFS. True Peak der fertigen MP3 <= -1 dBTP: Reicht der Spielraum
#     nicht, wird der Gain kleiner und das Ziel verfehlt (die Zeile am Ende nennt Ist-Werte, nie Wunschwerte).
#   - Kurze Effekte (< 400 ms, coins) haben keinen integrierten Wert nach BS.1770; dort wird auf 400 ms mit Stille
#     aufgefüllt gemessen (entspricht dem höchsten Momentanwert).
# Schleifen (alle amb/): Kopf-Schwanz-Überblendung von 1 s (acrossfade, qsin/qsin = Gleichleistung). Aus dem
#   Ausschnitt S der Länge L werden Schwanz T = S[L-1, L], Kopf H = S[0, 1] und Mitte M = S[1, L-1]; die Datei ist
#   T->H überblendet, dann M. Das Ende von M geht ohne Sprung in T über, die Überblendung endet dort, wo M beginnt.
#   Die Datei ist L-1 s lang. Zusätzlich überblendet der Player zur Laufzeit (Spec 7.3).
# Kodierung: Musik Stereo 128 kbit/s CBR; Umgebung Mono 64 kbit/s (Möwen: Stereo 64 kbit/s); Signale und
#   Effekte Mono 96 kbit/s; 44,1 kHz; Metadaten weg; bitexact (gleiche Eingabe, gleiche Bytes).
# Mono-Mix: 0,5*L + 0,5*R.
#
# Schrift (kein Schnitt): public/fonts/eb-garamond-{400,700}.woff2 sind unveränderte Dateien
#   eb-garamond-latin-{400,700}-normal.woff2 aus @fontsource/eb-garamond@5.3.0 (unpkg.com, Ordner files/);
#   public/fonts/OFL.txt = Copyright-Zeile + SIL OFL 1.1 (docs/licenses/OFL-1.1.txt).
set -euo pipefail

SRC="${1:?Aufruf: $0 <Ordner mit den Originalen>}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OUT="$ROOT/public"
command -v ffmpeg >/dev/null || { echo "ffmpeg fehlt (lokales Werkzeug)" >&2; exit 1; }
command -v ffprobe >/dev/null || { echo "ffprobe fehlt (lokales Werkzeug)" >&2; exit 1; }
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$OUT/audio/music" "$OUT/audio/amb" "$OUT/audio/sfx"

XF=1            # Länge der Kopf-Schwanz-Überblendung in s
TP_LIMIT=-1.0   # True-Peak-Grenze der fertigen MP3 in dBTP
TP_MARGIN=-1.5  # Grenze für die Vorberechnung des Gains (MP3-Kodierung kann etwas überschwingen)
REPORT="$TMP/report.txt"
: > "$REPORT"

# Gemessen wie gespielt: Mono als L=R. Ausgabe: "<integriert LUFS> <True Peak dBTP>"
measure() {
  local ch pre
  ch="$(ffprobe -v error -select_streams a:0 -show_entries stream=channels -of csv=p=0 "$1")"
  pre="aformat=channel_layouts=stereo"
  [ "$ch" = "1" ] && pre="pan=stereo|c0=c0|c1=c0"
  ffmpeg -hide_banner -nostats -i "$1" -af "$pre,${2:-anull},ebur128=peak=true" -f null - 2>&1 |
    awk '/Summary/{s=1} s&&/^ *I:/{i=$2} s&&/^ *Peak:/{p=$2} END{printf "%s %s", i, p}'
}

# stage <ziel.wav> <quelle> <filter>: Ausschnitt/Schleife/Mono-Mix als 32-bit-Float-WAV (keine Verluste)
stage() {
  ffmpeg -y -hide_banner -loglevel error -i "$2" -af "asetpts=PTS-STARTPTS,$3,aresample=44100" -c:a pcm_f32le "$1"
}

# loop_filter <von s> <bis s>: Ausschnitt mit Kopf-Schwanz-Überblendung (s. o.)
loop_filter() {
  awk -v s="$1" -v e="$2" -v x="$XF" 'BEGIN {
    L = e - s
    printf "atrim=start=%s:end=%s,asetpts=PTS-STARTPTS,asplit=3[a][b][c];", s, e
    printf "[a]atrim=start=0:end=%s,asetpts=PTS-STARTPTS[h];", x
    printf "[b]atrim=start=%s:end=%s,asetpts=PTS-STARTPTS[t];", L - x, L
    printf "[c]atrim=start=%s:end=%s,asetpts=PTS-STARTPTS[m];", x, L - x
    printf "[t][h]acrossfade=d=%s:c1=qsin:c2=qsin[x];[x][m]concat=n=2:v=0:a=1", x
  }'
}

# encode <eingabe> <ziel.mp3> <Ziel-LUFS> <Bitrate> <Kanäle> <Name> [Messfilter]
encode() {
  local in="$1" out="$2" target="$3" br="$4" ch="$5" name="$6" mf="${7:-anull}" i tp g ng fi ftp n
  read -r i tp <<<"$(measure "$in" "$mf")"
  g="$(awk -v t="$target" -v i="$i" -v tp="$tp" -v m="$TP_MARGIN" 'BEGIN { g = t - i; if (g > m - tp) g = m - tp; printf "%.2f", g }')"
  # Der MP3-Encoder verschiebt den Pegel um etwa -0,4 LU und kann überschwingen: bis zu 5 Durchgänge, die den
  # Gain nachführen (Ziel treffen, soweit die True-Peak-Grenze es zulässt; sonst Gain senken, nie limitieren).
  for n in 1 2 3 4 5; do
    ffmpeg -y -hide_banner -loglevel error -i "$in" -af "volume=${g}dB" -ac "$ch" -ar 44100 -b:a "$br" \
      -map_metadata -1 -fflags +bitexact -flags:a +bitexact "$out"
    read -r fi ftp <<<"$(measure "$out" "$mf")"
    ng="$(awk -v g="$g" -v t="$target" -v fi="$fi" -v tp="$ftp" -v l="$TP_LIMIT" 'BEGIN {
      d = t - fi
      if (tp + d > l) d = l - tp - 0.05          # Spitze darf die Grenze nicht überschreiten
      if (d > -0.15 && d < 0.15) d = 0           # nah genug am Ziel (oder an der Grenze)
      printf "%.2f", g + d }')"
    [ "$ng" = "$g" ] && break
    g="$ng"
  done
  printf '%-22s Quelle %6s LUFS %6s dBTP | Gain %6s dB | Ergebnis %6s LUFS %6s dBTP | Ziel %s LUFS, <= %s dBTP\n' \
    "$name" "$i" "$tp" "$g" "$fi" "$ftp" "$target" "$TP_LIMIT" >>"$REPORT"
}

# encode_limited <eingabe> <ziel.mp3> <Ziel-LUFS> <Bitrate> <Kanäle> <Name>: wie encode, aber mit weichem Limiter
# (nur für bell, Fix-Runde X1a). Gain und Limiter-Decke werden nachgeführt: Gain bis zum Ziel, Decke so, dass der
# True Peak der fertigen MP3 knapp unter TP_LIMIT liegt. Der Bericht nennt zusätzlich Spitze minus LUFS (Crest).
LIM_ATTACK=5    # ms
LIM_RELEASE=60  # ms
encode_limited() {
  local in="$1" out="$2" target="$3" br="$4" ch="$5" name="$6" i tp g=0 lim=-1.6 fi ftp n ng nl
  read -r i tp <<<"$(measure "$in")"
  g="$(awk -v t="$target" -v i="$i" 'BEGIN { printf "%.2f", t - i }')"
  for n in 1 2 3 4 5 6 7 8; do
    ffmpeg -y -hide_banner -loglevel error -i "$in" \
      -af "volume=${g}dB,alimiter=limit=$(awk -v d="$lim" 'BEGIN { printf "%.5f", 10 ^ (d / 20) }'):attack=${LIM_ATTACK}:release=${LIM_RELEASE}:level=0" \
      -ac "$ch" -ar 44100 -b:a "$br" -map_metadata -1 -fflags +bitexact -flags:a +bitexact "$out"
    read -r fi ftp <<<"$(measure "$out")"
    ng="$(awk -v g="$g" -v t="$target" -v fi="$fi" 'BEGIN { d = t - fi; if (d > -0.15 && d < 0.15) d = 0; printf "%.2f", g + d }')"
    nl="$(awk -v l="$lim" -v tp="$ftp" -v lim="$TP_LIMIT" 'BEGIN { d = (lim - 0.1) - tp; if (d > -0.05 && d < 0.35) d = 0; printf "%.2f", l + d }')"
    [ "$ng" = "$g" ] && [ "$nl" = "$lim" ] && break
    g="$ng"; lim="$nl"
  done
  printf '%-22s Quelle %6s LUFS %6s dBTP | Gain %6s dB, Limiter %s dB | Ergebnis %6s LUFS %6s dBTP, Spitze-LUFS %s dB | Ziel %s LUFS, <= %s dBTP\n' \
    "$name" "$i" "$tp" "$g" "$lim" "$fi" "$ftp" "$(awk -v a="$ftp" -v b="$fi" 'BEGIN { printf "%.1f", a - b }')" "$target" "$TP_LIMIT" >>"$REPORT"
}

MONO='pan=mono|c0=0.5*c0+0.5*c1'

# ---------------------------------------------------------------------------------------------------------------
# Musik — Stereo 128 kbit/s CBR, Ziel -18 LUFS, keine Schnittpunkte (ganze Stücke), Änderungen: nur Kodierung/Pegel
# ---------------------------------------------------------------------------------------------------------------
# MU1 bards-tale — "Medieval: The Bard's Tale", https://opengameart.org/content/medieval-the-bards-tale ,
#   RandomMind, CC0 1.0; ganzes Stück 0:00–2:38,6, Re-Encode 192 -> 128 kbit/s, Pegel
encode "$SRC/MU1_The_Bards_Tale.mp3" "$OUT/audio/music/bards-tale.mp3" -18 128k 2 "MU1 bards-tale"
# MU2 old-tower-inn — "Medieval: The Old Tower Inn", https://opengameart.org/content/medieval-the-old-tower-inn ,
#   RandomMind, CC0 1.0; ganzes Stück 0:00–1:45,5, Re-Encode 192 -> 128 kbit/s, Pegel
encode "$SRC/MU2_The_Old_Tower_Inn.mp3" "$OUT/audio/music/old-tower-inn.mp3" -18 128k 2 "MU2 old-tower-inn"
# MU3 dowland-complaints — "If my complaints could passions move",
#   https://opengameart.org/content/historic-renaissance-music-from-1597-if-my-complaints-could-passions-move-by-john-dowland ,
#   Of Far Different Nature (Einspielung) / John Dowland (Komposition), CC0 1.0; ganzes Stück 0:00–2:41,5,
#   Re-Encode 320 -> 128 kbit/s, Pegel (Original ist mit +1,0 dBTP übersteuert, daher der grösste Gain-Abzug)
encode "$SRC/MU3_Dowland_If_my_Complaints.mp3" "$OUT/audio/music/dowland-complaints.mp3" -18 128k 2 "MU3 dowland-complaints"

# ---------------------------------------------------------------------------------------------------------------
# Umgebung — Mono 64 kbit/s, Schleifen 20–40 s. Schnittpunkte gewählt aus der Momentanlautheit (M, 400 ms, 10 Hz):
# Kopf- und Schwanzzone (je 1 s) haben gleiche Lautheit (|Mkopf - Mschwanz| < 1 LU), bei Ereignisklängen liegen
# beide in ruhigen Stellen.
# ---------------------------------------------------------------------------------------------------------------
# AM1 sea — freesound 852826 "Gentle Ocean Waves Loop", https://freesound.org/people/kkenny101/sounds/852826/ ,
#   kkenny101, CC0 1.0; Schnitt 0:00–0:21,76 (ganzes Original, 21,77 s), Schleife -> 20,76 s (>= 20 s, daher kein
#   Ersatz AM1b nötig), Mono-Quelle, Ziel -26 LUFS
stage "$TMP/sea.wav" "$SRC/AM1_852826.mp3" "$(loop_filter 0 21.76)"
encode "$TMP/sea.wav" "$OUT/audio/amb/sea.mp3" -26 64k 1 "AM1 sea"
# AM2 birds — freesound 855955 "04 - Birds_stereo", https://freesound.org/people/Nordliecht/sounds/855955/ ,
#   Nordliecht, CC0 1.0; Schnitt 0:03,5–0:35,0 (31,5 s; Kopf/Schwanz bei -30,2/-30,0 LUFS in einer Ruhestelle),
#   Schleife -> 30,5 s, Mono-Mix (Phasenmittel 1,0: Quelle faktisch Mono), Ziel -26 LUFS
stage "$TMP/birds.wav" "$SRC/AM2_855955.mp3" "$MONO,$(loop_filter 3.5 35)"
encode "$TMP/birds.wav" "$OUT/audio/amb/birds.mp3" -26 64k 1 "AM2 birds"
# AM3 gulls — freesound 317676 "STC_moewen.flac" (HQ-Vorschau), https://freesound.org/people/nikitralala/sounds/317676/ ,
#   nikitralala, CC0 1.0; Schnitt 0:45,5–1:17,0 (31,5 s; Kopf/Schwanz bei -34,6/-34,6 LUFS, mehrere Rufe im Fenster),
#   Schleife -> 30,5 s. BLEIBT STEREO 64 kbit/s (Spec 16.1): aphasemeter-Mittel der Quelle 0,107 < 0,2, obwohl der
#   Mono-Mix nur 2,8 LU (< 3 LU) verliert (Fenster: Stereo -29,6, Mono-Mix -32,4 LUFS). Ziel -28 LUFS
stage "$TMP/gulls.wav" "$SRC/AM3_317676.mp3" "$(loop_filter 45.5 77)"
encode "$TMP/gulls.wav" "$OUT/audio/amb/gulls.mp3" -28 64k 2 "AM3 gulls (Stereo)"
# AM4 crickets — freesound 857163 "Quiet Night Atmosphere - Soft Crickets (Eagle Mountain, Utah)",
#   https://freesound.org/people/Goldenboy76/sounds/857163/ , Goldenboy76, CC0 1.0; Schnitt 3:50,0–4:21,0 (31 s):
#   30-s-Fenster mit der geringsten Lautheitsschwankung der ganzen Datei (Standardabweichung M 0,90 LU,
#   Spannweite 4,2 LU; ganze Datei: 1,95 LU), Schleife -> 30 s, Mono-Quelle, Ziel -28 LUFS (lead-art: Nachtschicht leise, weniger
#   angehobenes Rauschen; Quelle -49,5 LUFS)
stage "$TMP/crickets.wav" "$SRC/AM4_857163.mp3" "$(loop_filter 230 261)"
encode "$TMP/crickets.wav" "$OUT/audio/amb/crickets.mp3" -28 64k 1 "AM4 crickets"
# AM5 rain — freesound 321885 "Steady Rainstorm", https://freesound.org/people/Talitha5/sounds/321885/ ,
#   Talitha5, CC0 1.0; Schnitt 0:03,5–0:30,5 (27 s; Kopf/Schwanz -29,9/-29,4 LUFS, Standardabweichung M 1,2 LU),
#   Schleife -> 26 s, Mono-Mix (Phasenmittel 0,96), Ziel -26 LUFS
stage "$TMP/rain.wav" "$SRC/AM5_321885.mp3" "$MONO,$(loop_filter 3.5 30.5)"
encode "$TMP/rain.wav" "$OUT/audio/amb/rain.mp3" -26 64k 1 "AM5 rain"
# AM6 storm — freesound 341941 "wind rain thunder 01 49sec.mp3", https://freesound.org/people/Qwirkie/sounds/341941/ ,
#   Qwirkie, CC0 1.0; Schnitt 0:07,0–0:32,5 (25,5 s): ohne den Einblendteil (< 0:07) und ohne den Donner, dessen
#   Anstieg bei 0:35,2 beginnt (Pause 2,7 s); höchste Momentanlautheit im Fenster +2,1 LU über dem Median (-35,6 LUFS;
#   Grenze +6 LU) -> Ersatz AM6b nicht nötig. Schleife -> 24,5 s, Mono-Mix (Phasenmittel 0,95), Ziel -24 LUFS
stage "$TMP/storm.wav" "$SRC/AM6_341941.mp3" "$MONO,$(loop_filter 7 32.5)"
encode "$TMP/storm.wav" "$OUT/audio/amb/storm.mp3" -24 64k 1 "AM6 storm"
# AM7 fire — freesound 564621 "Ambiance_Fire_Bushes_Loop_Stereo.wav", https://freesound.org/people/Nox_Sound/sounds/564621/ ,
#   Nox_Sound, CC0 1.0; Schnitt 0:00–0:11,0 (ganzes Original, 11 s: zu kurz für 20 s), Schleife -> 10 s, danach
#   dreimal hintereinander (30 s, ohne Sprung, weil die Schleife nahtlos ist), Mono-Mix (Phasenmittel 0,78), Ziel -26 LUFS
stage "$TMP/fire1.wav" "$SRC/AM7_564621.mp3" "$MONO,$(loop_filter 0 11)"
ffmpeg -y -hide_banner -loglevel error -stream_loop 2 -i "$TMP/fire1.wav" -c:a pcm_f32le "$TMP/fire.wav"
encode "$TMP/fire.wav" "$OUT/audio/amb/fire.mp3" -26 64k 1 "AM7 fire (3 x 10 s)"

# ---------------------------------------------------------------------------------------------------------------
# Signale und Effekte — Mono 96 kbit/s, <= 6 s, Mono-Mix 0,5*L + 0,5*R (Verlust < 1 LU bei allen vieren)
# ---------------------------------------------------------------------------------------------------------------
# SG1 bell — freesound 582523 "6 Bell Ring.WAV", https://freesound.org/people/gsparrysound/sounds/582523/ ,
#   gsparrysound, CC0 1.0; Schnitt 0:00,48–0:05,90 (5,42 s): drei Schläge (Einsätze laut Hüllkurve bei
#   0,52 s, 1,60 s und 2,70 s im Original), der dritte Schlag klingt natürlich aus; 5 ms Einblendung, 400 ms
#   Ausblendung am Ende (Pegel dort ca. -37 dB unter dem Maximum). Ziel -15 LUFS (lead-art; nicht -14, damit die
#   Anschläge nicht platt werden). Nur diese Datei bekommt einen Limiter (alimiter, Attack 5 ms, Release 60 ms,
#   level=0, Decke per Nachführung so, dass der True Peak der MP3 <= -1 dBTP bleibt): Das Alarmsignal muss über allem
#   stehen, ohne Limiter begrenzt der Crest der Schläge (Spitze-LUFS 17,5 dB) den Pegel auf -18,5 LUFS
stage "$TMP/bell.wav" "$SRC/SG1_582523.mp3" "$MONO,atrim=start=0.48:end=5.9,asetpts=PTS-STARTPTS,afade=t=in:d=0.005,afade=t=out:st=5.02:d=0.4"
encode_limited "$TMP/bell.wav" "$OUT/audio/sfx/bell.mp3" -15 96k 1 "SG1 bell"
# SG2 foghorn — freesound 673668 "Cruise ship foghorn", https://freesound.org/people/TomOstepop/sounds/673668/ ,
#   TomOstepop, CC0 1.0; Schnitt 0:05,15–0:07,15 (2,0 s): natürlicher Anstieg des Horns (Einsatz bei 5,28 s) und
#   gleichmässiger Ton, 10 ms Einblendung, 150 ms Ausblendung. Ziel -14 LUFS
stage "$TMP/foghorn.wav" "$SRC/SG2_673668.mp3" "$MONO,atrim=start=5.15:end=7.15,asetpts=PTS-STARTPTS,afade=t=in:d=0.01,afade=t=out:st=1.85:d=0.15"
encode "$TMP/foghorn.wav" "$OUT/audio/sfx/foghorn.mp3" -14 96k 1 "SG2 foghorn"
# FX1 coins — freesound 847349 "handful-of-coins-006", https://freesound.org/people/ilyaShevelev/sounds/847349/ ,
#   ilyaShevelev, CC0 1.0; ganzes Original 0:00–0:00,23, 5 ms Ein- und Ausblendung gegen Knackser, Mono-Mix.
#   Ziel -20 LUFS, gemessen auf 400 ms aufgefüllt (zu kurz für einen integrierten Wert)
stage "$TMP/coins.wav" "$SRC/FX1_847349.mp3" "$MONO,afade=t=in:d=0.005,afade=t=out:st=0.2225:d=0.005"
encode "$TMP/coins.wav" "$OUT/audio/sfx/coins.mp3" -20 96k 1 "FX1 coins" "apad=whole_dur=0.4"
# FX2 hammer — freesound 707864 "Hammer on Wood", https://freesound.org/s/707864/ , L.i.Z.e.L.l.E_+, CC0 1.0;
#   Schnitt 0:00,20–0:02,00 (1,8 s; vier Schläge, die ersten 0,2 s sind Stille/Rauschen), 5 ms Einblendung,
#   10 ms Ausblendung, Mono-Mix. Ziel -20 LUFS
stage "$TMP/hammer.wav" "$SRC/FX2_707864.mp3" "$MONO,atrim=start=0.2:end=2.0,asetpts=PTS-STARTPTS,afade=t=in:d=0.005,afade=t=out:st=1.79:d=0.01"
encode "$TMP/hammer.wav" "$OUT/audio/sfx/hammer.mp3" -20 96k 1 "FX2 hammer"

# ---------------------------------------------------------------------------------------------------------------
# Prüfung der Ergebnisse (Ausgabe, kein Abbruch): Pegel, Länge, Stille am Rand der Schleifen
# ---------------------------------------------------------------------------------------------------------------
echo "== Pegel (Ist-Werte der fertigen MP3, gemessen wie gespielt) =="
cat "$REPORT"
echo "== Dauer der Dateien =="
for f in "$OUT"/audio/*/*.mp3; do
  printf '%-14s %s s\n' "$(basename "$f")" "$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f" | awk '{printf "%.2f", $1}')"
done
echo "== Stille (silencedetect -60 dB, >= 0,3 s) in den Schleifen; leer = keine =="
for f in "$OUT"/audio/amb/*.mp3; do
  printf '%-14s %s\n' "$(basename "$f")" "$(ffmpeg -hide_banner -nostats -i "$f" -af silencedetect=n=-60dB:d=0.3 -f null - 2>&1 | grep -c silence_start || true) Treffer"
done
