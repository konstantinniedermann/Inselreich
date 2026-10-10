# T11 · `seekarte.mjs`: Rand aus der Quelle, Readback ohne Warnung, Namensschema

Strang `qa` · Worktree `.worktrees/b3-qa` · Branch `tool/b3-qa` · Umsetzer `tech-ui-engineer` Q (sonnet) · AK-TB3-17…19 · Grundlage `docs/beobachtungen.md` „Ausgewertet 2026-10-10“ (Kandidaten `seekarte.mjs` `SEA_MAP_PAD`; QA-Namensschema und `willReadFrequently`), Final-Review und Release-Check REL-15 · Grösse S (≈ 20 Tools inkl. einem Browser-Lauf) · Prüfregel V3

**Files:**

- Modify: `tools/render-qa/seekarte.mjs` (`markPixel`, Z. ~129–143)
- Modify: `tools/render-qa/README.md` (Abschnitt „Namensschema (E-039, R315)“, Z. ~40–46)
- Test: `tests/tools/renderqa.test.ts` nur, wenn sich ein reiner Helfer sinnvoll herauslösen lässt (siehe Schritt 2); sonst Nachweis per Lauf
- **Nicht ändern:** `src/**` (auch nicht `src/ui/hud.ts` für `willReadFrequently`: der Kontext der Seekarte wird für Zeichnen gebraucht, `willReadFrequently` würde ihn auf CPU zwingen), `.claude/agents/qa-playtester.md` (Persona gehört `lead-qa`, Index E7)

## Befunde

1. `markPixel` rechnet den Kartenrand mit `12 * d`; die Quelle ist `SEA_MAP_PAD` in `src/ui/seaMapView.ts:10` (von `hud.ts:25/429` benutzt). Ändert sich der Rand, misst die Probe falsch.
2. Konsole im Release-Check REL-15 (alle vier Kombinationen): `Canvas2D: Multiple readback operations using getImageData are faster with the willReadFrequently attribute set to true.` Herkunft nicht belegt; Kandidat ist `markPixel`, das `getImageData` auf dem Kontext der App (`cv.getContext('2d')`) mehrfach aufruft. `src/` liest sonst nur in `src/render/terrain.ts:2033` zurück, dort schon mit `READBACK_CTX` (`willReadFrequently: true`).
3. Screenshots `b6-*.png` im Release-Check REL-15 hatten keine Grösse im Namen; der 1920×1080-Lauf überschrieb den 1280×720-Lauf.

## Schritte

- [ ] **Schritt 1: Ausgang belegen (ein Browser-Lauf, ≤ 2 Browser studioweit, `uptime` und `pgrep -fl "Chrome|chromium"` vor/nach):**

```bash
node tools/render-qa/seekarte.mjs --size 1280x720 --dpr 1 --out .studio/qa/TOOL-BUENDEL-3/vorher --port 5491; echo EXIT=$?
grep -n "willReadFrequently\|BESTANDEN" .studio/qa/TOOL-BUENDEL-3/vorher/seekarte.txt
```

Erwartet: Warnung vorhanden (Rot-Beleg). Ist sie **nicht** da, Befund 2 als „nicht reproduziert“ berichten und nur Schritt 2 (ohne Kopie) und 3 umsetzen.

- [ ] **Schritt 2: `markPixel`.**
  - Rand: `const vm = await import('/src/ui/seaMapView.ts'); const pad = (vm.SEA_MAP_PAD ?? 12) * d;` und `sm.mapLayout(w, cv.width, cv.height, pad)` (Rückfall für ältere Stände wie bei `DOT_R`/`MARK`, Kommentar übernehmen).
  - Readback: einmal je Aufruf eine Kopie anlegen (`const k = document.createElement('canvas'); k.width = cv.width; k.height = cv.height; const g = k.getContext('2d', { willReadFrequently: true }); g.drawImage(cv, 0, 0);`) und `g.getImageData(x, y, 1, 1)` lesen. Kommentar: „Kopie mit willReadFrequently: der App-Kontext bleibt GPU-fähig, die Probe löst keine Chrome-Warnung aus.“
  - Ein reiner Helfer lohnt sich nur, wenn er ohne Browser testbar ist (z. B. `padOf(module, d)`); sonst kein neuer Test — der Lauf in Schritt 4 ist der Nachweis (AK-TB3-17/18).

- [ ] **Schritt 3: README Namensschema (AK-TB3-19).** Im Abschnitt „Namensschema“ eine Zeile ergänzen: „Playtest- und Release-Screenshots: `<fall>-<B>x<H>[-dpr<d>].png` (z. B. `belegt-haus-1280x720.png`), nie ohne Grösse, damit Läufe je Fenstergrösse sich nicht überschreiben; Ablage `.studio/qa/<paket>/`.“ In der Tabellenzeile `seekarte.mjs` nichts ändern ausser bei Bedarf „Prüfzeile Kontor-Marke (Rand aus `SEA_MAP_PAD`)“.

- [ ] **Schritt 4: Nachweis (gleicher Aufruf wie Schritt 1, Ordner `nachher`):** Warnung weg, Prüfzeile Kontor-Marke weiterhin BESTANDEN, Bilder `seekarte-1280x720-dpr1.png` vorher/nachher gleich (Sichtvergleich, kurz beschreiben). Bleibt die Warnung, prüfen, ob sie vor dem ersten `markPixel` erscheint (Zeitpunkt in `seekarte.txt`); dann stammt sie aus `src/` → im Bericht belegen, nicht in `src/` beheben (AK-TB3-18, zweite Hälfte).

- [ ] **Schritt 5: Prüfen (V3)**

```bash
npx vitest run tests/tools; echo EXIT=$?
npx tsc --noEmit; echo EXIT=$?
make lint; echo EXIT=$?
```

- [ ] **Schritt 6: Commit** `fix: seekarte.mjs liest SEA_MAP_PAD, Readback über Kopie; Namensschema Screenshots` mit Session-Trailer.

## Bericht

Ausgaben Schritt 1/4 wörtlich (Warnzeile, BESTANDEN-Zeilen), `uptime` und Chrome-Prozesse vor/nach, Pfade der Bilder. **Vorschlag an `lead-qa`** (nur im Bericht): Persona `qa-playtester`, Abschnitt Release-Check, um den Satz „Screenshots nach `tools/render-qa/README.md`, Namensschema“ ergänzen.

## Abnahme (Reviewer)

- AK-TB3-17…19 belegt; keine Änderung in `src/`; `seekarte.mjs --help` unverändert lauffähig.
