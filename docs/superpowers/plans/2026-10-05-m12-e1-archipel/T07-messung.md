> **Task-ID:** T07 · **AK-IDs:** AK-E1-14, AK-E1-15, AK-E1-16, AK-E1-17, AK-E1-18, AK-E1-19
> **blocked-by:** T06 · **Strang:** render, `.worktrees/m12-e1` · `tech-ui-engineer` (sonnet), danach `qa-playtester`
> **Regeln:** [index.md](index.md) Global Constraints, P-9 · Spec Anhang 02 E (Messprotokoll R1–R5), Anhang 04
> „lead-qa Teil B" (AK-E1-14 je Seed einzeln, Aufwärmen AK-E1-16, Notfall-Frames AK-E1-18, Bedingungen AK-E1-19)

## T07: Render-Messung R1–R5 und Sichtprüfung

**Ziel:** Die harten Render-Grenzen sind mit festen Bedingungen gemessen und im Ledger/PR-Text belegt; der Browser-
Check bestätigt das Bild.

**Code-Fakten:** `tools/render-qa/perf.mjs` (`--a`, `--b`, `--seed`, `--runs`, `--dpr`, `--w`, `--h`,
`--focus mountain|none`; liest `window.__inselPerf` nach 15 s; startet je Lauf Vite + Headless-Chrome über `lib.mjs`).
Heimat-`buildMs` loggt `buildTerrainLayer` in DEV als Konsolenmeldung `[terrain] Aufbau <ms> ms` (auf A und B).
Seit T06: `__inselDev.setZoom`, `focus`, `cachesReady`, `slices`, `emergency`; `__inselPerf.frameMax`,
`emergencyFrames`.

**Dateien:** `tools/render-qa/perf.mjs`; Ergebnisse nur im Ledger `.superpowers/sdd/m12-e1/ledger.md` und im
PR-Text (keine Ergebnisdatei im Repo).

## `perf.mjs` erweitern (verbindlich)

- `--zoom <z>` (Standard 1) über `__inselDev.setZoom`; `--focus home|archipel` über `__inselDev.focus` (alte Werte
  `mountain|none` bleiben). Auf A (`main`) ohne `setZoom`/`focus`: nur `--zoom 1 --focus home` zulässig; dort zentriert
  die Startkamera ohnehin die Heimat (Start = Heimatkontor), Abbruch mit Meldung bei anderen Werten.
- `--warm <ms>` (Standard 5000): erst warten, bis `cachesReady()` true ist (B; Zeitlimit 60 s, sonst Fehler), dann
  Zielzoom/Fokus setzen, `--warm` ms warten, dann Messfenster 15 s.
- `--idle`: Messfenster beginnt mit dem ersten Frame nach dem Laden und endet bei `cachesReady()`; ausgegeben werden
  `frameMax` ohne Notfall-Frames, `emergencyFrames` getrennt und `max(slices())`.
- Heimat-`buildMs` aus der Konsolenmeldung `[terrain] Aufbau` (CDP `Runtime.consoleAPICalled`), A und B.
- Kopfzeile jeder Ausgabe: `os.cpus()[0].model`, `os.release()`, `process.version`, Chrome-Version (`/json/version`),
  DPR, Fenster, Seed, Zoom, Fokus. **Je Seed eigene Ergebniszeile** (kein Mittel über Seeds).

## Messungen (Bedingungen P-9: Entwickler-Mac, Headless, DPR 2, 1920 × 1080, `--runs 3`, abwechselnd A/B)

A = aktueller `main` (enthält REL-03; enthält E0, falls schon gemerged), Worktree `.worktrees/integrate` auf `main`;
B = `.worktrees/m12-e1`. Je Seed 14 und 3 einzeln:

| AK       | Aufruf                                                                                          | Grenze                                         |
| -------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| AK-E1-14 | `--a A --b B --seed s --zoom 1 --focus home`                                                    | `renderMedian` B − A ≤ +0,2 ms, je Seed        |
| AK-E1-15 | gleicher Lauf, `buildMs`                                                                        | B ≤ 1,3 × A                                    |
| AK-E1-16 | B allein: `--zoom 0.125 --focus archipel --warm 5000` gegen `--zoom 1 --focus home --warm 5000` | Verhältnis ≤ 2,0, **hart**                     |
| AK-E1-18 | B allein: `--zoom 1 --focus home --idle`                                                        | `frameMax` ≤ 50 ms; Notfall-Frames ausgewiesen |
| AK-E1-19 | gleicher Lauf, `max(slices())`                                                                  | ≤ 8 ms                                         |

## Schritte

- [ ] **1 `perf.mjs`** erweitern; `node tools/render-qa/perf.mjs --help` zeigt die neuen Schalter; `make check` grün.
      Commit `feat: M12 E1 perf.mjs mit Zoom, Fokus, Aufwärmen, Leerlauf-Messung`.
- [ ] **2 Messen** nach Tabelle, Rohausgabe in den Ledger, Tabelle „AK · Seed · A · B · Grenze · OK" in den PR-Text.
- [ ] **3 Bei Verfehlen:** Grenze **nicht** ändern. Hebel in dieser Reihenfolge (Fix-Runde im selben Baum): R5/R4 →
      Schritte im Cache-Plan feiner teilen (T04-Code); R3 → Detailstufe/Massiv-Caches prüfen (T05-Code); R1/R2 → Diff
      `render()` Heimatpfad. Bleibt R3 > 2 ×: anhalten, Meldung Controller → lead-tech → L0 (Streichvariante B, AK-E1-12).
- [ ] **4 Browser-Check AK-E1-17** durch `qa-playtester`: Zoom 1 **und** 0,125 mit laufender Animation (Tempo 1,
      Wetter an): keine Kante zwischen Inselcache und Meer (Heimatrand eingeschlossen, Risiko R-4); 1280 × 800 bei 0,125
      alle drei Inseln sichtbar; Mouse-over A und B zeigt Name, Grösse, Merkmale, Fahrzeit. Screenshots
      `.studio/qa/M12-E1/T07/`; lead-art beurteilt die Kante im Merge-Gate anhand dieser Bilder.

**Review-Fokus:** Messbedingungen vollständig in der Kopfzeile; je Seed einzeln; Grenzen unverändert; Notfall-Frames
getrennt; keine Messwerte als Datei im Repo.
