# Retro session 8ef9d27f-ende — 2026-10-08

- Datum: 2026-10-08
- Art: session
- Auslöser: Session-Ende 8ef9d27f; Vorfälle `ci:` (7 Läufe, überholt), `inaktiv:` (3, davon `qa-playtester`)
- Datenbasis: `docs/studio/metriken/S-2026-10-08-8ef9d27f.md`, `docs/studio/rulings.md` (R307, R312, R313, R314), `.studio/qa/rel-07b/` (`perf-nah-b.txt`, `perf-fern-b.txt`), `tools/render-qa/perf.mjs`, `docs/studio/experimente.md` (E-034, E-035, E-036)

## Befunde

### B1 · A/A-Lauf als A/B gelesen

- Beobachtung: `perf-nah-b.txt` und `perf-fern-b.txt` enthalten Zeilen `A`/`B`, beide aus demselben Stand (Kandidat gegen Kandidat). Der Kopf (`seed`, `zoom`, `focus`, `runs`) nennt weder die Stände noch die Art des Vergleichs. L0 las die Differenz als A/B und meldete „+0,1 ms“; R312 übernahm den Wert (Seed 7: +0,1 ms nah, 0 ms fern). Gate-Urteil später: +0,5…+1,4 ms gegen main (R313).
- Beleg: `.studio/qa/rel-07b/perf-nah-b.txt` (renderMedian A 3,8 / B 3,8–3,9, Zeilen 2–5); R312 und R313 in `docs/studio/rulings.md`.
- Wirkung: Falsche Zahl an den Nutzer; Ruling R312 stützte sich darauf. Kosten klein (korrigiert im selben Lauf), Wiederholungsrisiko hoch, solange der Dateiname nichts sagt.
- Deutung: Ursache ist die Ablage (Vergleichsart nicht im Artefakt), nicht das Lesen allein. Einzelfall in den Daten; das Muster „unfertige Rohdaten als Ergebnis zitiert“ gab es schon mit der unbelegten Ursache in R169 (lernen.md). Ein Fall, daher Handbuch-Satz statt Umbau.

### B2 · Bau-Ruckeln nur im Release-Lauf sichtbar

- Beobachtung: `perf.mjs` misst `renderMedian`, `frameMax` und `frameMaxAfterBuild`; „Aufbau“ meint dort die Terrain-Erzeugung (`BUILD_RE = [terrain] Aufbau`), nicht das Platzieren eines Gebäudes durch den Spieler. Ein Szenario „Bau im laufenden Spiel“ fehlt im Perf-Werkzeug (`tools/render-qa/perf.mjs`, Zeilen 22, 142). Das Ruckeln (4–6 Frames 33–50 ms je Bau, R313) fiel erst der QA im Release-Lauf auf.
- Beleg: `tools/render-qa/perf.mjs:22,142`; R313 (a).
- Wirkung: Mehrere Häppchen (L5/L6/L7/WALD-02) liefen ohne Hinweis durch; Fix-Runde FIX-REL07 nach dem Release-Lauf, also am teuersten Punkt.
- Deutung: Lücke der Messung, kein Ausreisser: vier Häppchen betroffen, kein einziges hätte es gemeldet. Die Ruckel-Quelle (`sortedObjects`-Neuaufbau je Bau) ist erst durch die QA-Messung belegt; ein Werkzeug dafür ist ein Vorschlag, kein Befund.

### B3 · Erstlauf ohne Zwischenbericht, Messskript nur im Scratchpad

- Beobachtung: Der Lauf brach über Nacht bei Seed 14 (Zeitüberschreitung) ab; es lag nur die Ablage `.studio/qa/rel-07b/` vor, ohne Fortsetzungspunkt. Das Ruckel-Skript der QA lag im Scratchpad, nicht im Repo (Auftragstext L0).
- Beleg: R312; `.studio/qa/rel-07b/` (`partA.done`, `partC.done`, keine `stand`-Datei).
- Wirkung: Die frische Instanz musste den Stand aus Rohdateien rekonstruieren (R312 nennt „wiederholt Erledigtes nicht“); das Ruckel-Skript ist für die Nachprüfung nach FIX-REL07 nur von der QA zu holen.
- Deutung: Zweiter Fall nach E-034 (Übergabe bei Abbruch, Retro session-7db07561-ende B1). Das Muster „Übergabe fehlt“ besteht, E-034 deckt den L0-Teil ab, nicht den Lead-Teil.

### B4 · Fällige Meldungen

- `ci:37441859308`, `ci:37488304652`, `ci:37488497826`, `ci:37586282252`, `ci:37588301975`, `ci:37591827393`, `ci:37590084349`: überholt (main grün seit R307; Ausgang für E-035). Quittiert.
- `inaktiv:…:main` (studio-director), `inaktiv:…:a5fd7b5fd69b18be7` (unbekannt), `inaktiv:…:a9b148c183027b384` (qa-playtester): Messartefakt (lange Bash-Läufe ohne Lebenszeichen und Fortsetzung mit neuer ID, lernen.md „Anzeige inaktiv“; Retro session-ad51d3c5 B5). Der Lauf endete mit Gate-Urteil, kein Agent ging verloren. Quittiert.

## Effizienz-Ampel

Quelle: `python3 tools/studio/metrics.py --efficiency` (Historie, 31 Sessions) und Abschnitt „Effizienz“ der Session-Datei (1 Session, 3 Agenten, 153 Aufrufe). Die Session-Zeilen sind bei dieser Datenbasis schwach (3 Agenten); Historie und Session getrennt lesen (lernen.md).

| Kennzahl                     | Historie | Session | Ampel (Hist./Sess.) | Befund / Ursache                                                                                            |
| ---------------------------- | -------- | ------- | ------------------- | ----------------------------------------------------------------------------------------------------------- |
| Steuerungsanteil             | 49,8 %   | 32,8 %  | gelb / grün         | Historie knapp unter rot; E-010 läuft nicht mehr, Hebel 5 (R314) zielt darauf                               |
| Umsetzeranteil               | 24,6 %   | 0,0 %   | grün / rot          | Session ohne Umsetzer (nur lead-qa-Nachlauf und L0): Messartefakt, kein Befund                              |
| Cache-Write 5 min            | 29,2 %   | 21,7 %  | rot / gelb          | Ursache laut Deutung: Fristablauf bei Wartezeiten (Aufwands-Retro, R314); E-036 prüft, Hebel 1 (R314) wirkt |
| Lead-Kontext Median          | 75k      | 103k    | grün / gelb         | Session: eine lead-qa-Instanz mit 167 Aufrufen; Einzelfall                                                  |
| L0-Kontext Max               | 774k     | 92k     | rot / grün          | Historischer Höchstwert aus früheren Sessions; diese Session unauffällig, kein neuer Vorschlag              |
| opus-Anteil                  | 74,1 %   | 70,7 %  | gelb / gelb         | Hebel 5 (R314) zielt auf sonnet bei Ein-Umsetzer-Paketen                                                    |
| Persona-Starts general-purp. | 45       | 0       | rot / grün          | Alt-Bestand, in dieser Session 0; kein neuer Vorschlag, weil Session sauber                                 |
| Grösste gelesene Datei       | 59,0 KB  | –       | gelb / –            | Tool-Ergebnis möglich (lernen.md); nicht weiter verfolgt                                                    |

Rot-Zeilen: Cache-Write ist durch E-036 und R314 Hebel 1 abgedeckt; L0-Kontext und general-purpose-Starts sind Historie ohne Wirkung in dieser Session, daher kein eigener Vorschlag.

## Befragung der Leads

- lead-qa: nicht befragt (Kurz-Retro); Gate-Bericht über R313 und Handoff `.studio/handoffs/2026-10-08-l0-lead-qa-rel07-befunde.md` gelesen.

## Vorschläge

Drei, alle mit Messgrösse; Umsetzung der Werkzeuge nur nach Ruling und frühestens nach R305.

- E-039 (Handbuch-Satz, B1): Vergleichsart im Artefakt. Kosten: 1 Satz, rund 5 Tool-Aufrufe.
- E-040 (Werkzeug-Paket, B2): Bau-Ruckel-Szenario in `perf.mjs`. Kosten: ein Häppchen (rund 100 Tool-Aufrufe), nur nach R305.
- E-041 (Handbuch-Satz, B3): Fortsetzungspunkt-Datei und Mess-Skripte im Repo. Kosten: 1 Satz, rund 5 Tool-Aufrufe.

Zusätzlich vergab diese Retro die von R314 verlangten Nummern: E-037 (Hebel 1) und E-038 (Hebel 5), beide „angenommen R314, wartet auf Platz“ (3 Experimente laufen). Sie zählen nicht als Vorschläge dieser Retro.

## Bewertung laufender Experimente

- E-022, E-027, E-030: unverändert laufend, in dieser Session keine Daten (Nachlauf ohne Merge, ohne Zeittest, ohne Ideen-Pool).
- E-034: Der Abbruch der Vor-Session hatte Heartbeat-Prüfung (R312, Handoff vorhanden); die Zählung beginnt erst mit `laufend`. Fall B3 spricht für Erweiterung auf Leads (E-041).

## Änderungen an lernen.md

- neu: Zeile zu Ablage unfertiger Messläufe (A/A, A/B) · gestrichen: keine
