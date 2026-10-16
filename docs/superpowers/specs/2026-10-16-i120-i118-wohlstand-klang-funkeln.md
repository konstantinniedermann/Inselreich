# I-120 «Wohlstandsklang der Stadt» + I-118 «Aufstiegs-Funkeln am Haus» (Kurzdesign, Stufe leicht)

Stand 2026-10-16 · Paket design-I-120-I-118 · Quelle: R692, I-120, I-118 (IDEEN-11 Scout C) · Save: nein · neuer Spielwert: nein · Sim-Änderung: nein · Assets: keine (prozedural/synthetisch, kein ADR-011-Weg nötig)

## Spielerzweck

Versorgung und Aufstieg werden hör- und sichtbar, ohne Menü und ohne Zahlen. Säule: Bevölkerung. Heute hängt die Stadtschicht `town` nur an der Einwohnerzahl im Bild (`ambienceMix`, `src/audio/ambience.ts`, `townBase = min(1, inhabitants/60) * (0.3 + 0.7*zn)`); ein Aufstieg ist nur ein Ton, `src/render/fx.ts` kennt nur Krisen- und Feuerschalen-Effekte. Beide Teile sind unabhängig und einzeln lieferbar, teilen aber Spec, Plan und Gate (R692).

## Teil A: I-120 Wohlstandsklang

1. **Eingang.** `ViewStats` (`src/audio/mix.ts`, Spiegel von `src/render/viewStats.ts`) bekommt das optionale Feld `suppliedShare?: number` (0…1, Anteil voll versorgter Häuser im Bild) und `houses?: number` (Häuser im Bild). Fehlt `suppliedShare` oder ist es nicht endlich, gilt das heutige Verhalten (Faktor 1). `src/audio/` importiert weiter nichts aus `sim/` oder `ui/`; die Zahl kommt über die bestehende Brücke `viewStats(...)` → `sound.setAmbience(...)` in `src/ui/app.ts` (Zeile ~1671, 250-ms-Takt).
2. **Berechnung** in `viewStats` (Render, DOM-frei): im Bildausschnitt gezählte Häuser mit `b.house !== undefined`; «voll versorgt» heisst `house.supplied === true` und kein offener Bedarf (derselbe Begriff wie das Bedarfssymbol am Haus, Plan wählt das vorhandene Prädikat aus `src/sim/population.ts`/`statusMarks.ts`, kein neues in `sim/`). `suppliedShare = voll / houses`, bei `houses === 0` nicht gesetzt.
3. **Glättung ≈ 10 s.** Reiner Helfer `smoothShare(prev, next, dtS, tauS = 10)` (exponentiell, `prev` undefiniert → `next`), Zustand im Schichtenmotor von `ambience.ts`; `dtS` aus der Audio-Uhr, nicht aus der Spielgeschwindigkeit (hohe Geschwindigkeit ändert die Mittelung nicht). Pause ändert nichts: der Takt läuft weiter, Klang bleibt.
4. **Kurve** `townFactor(share)` (rein, in `ambience.ts` neben `ambienceMix`), multipliziert `townBase`:
   - Variante A (Stufen wie I-120): ≥ 0,8 → 1; 0,4…0,8 → 0,5…1 linear; 0,2…0,4 → 0,5; < 0,2 → 0.
   - Variante B (stetig, ohne Sprung): 0,2 → 0; 0,4 → 0,5; 0,8 → 1; dazwischen linear, ausserhalb geklemmt.
   - **Empfehlung B**: dieselben Eckpunkte, kein hörbarer Knick; die 10-s-Mittelung und `GLIDE_S` (1,5 s) bleiben als Gleiten. Variante A klingt an den Stufen unruhig.
5. **Wind statt Stadt.** Unter 0,2 fällt `town` auf 0 und `wind` steigt um `0,15 * (1 - townFactor)` (nur wenn `houses > 0`, Ergebnis geklemmt auf 1). Keine neue Schicht, kein neues Sample.
6. **Randfälle.** Keine Häuser im Bild: `suppliedShare` fehlt, Schicht wie heute. Ton aus oder Bus 0: ohne Wirkung (Mix läuft unverändert, kein Sonderpfad). Nachtfaktor 0,3 und Zoom-Faktor bleiben, `townFactor` kommt multiplikativ dazu. Hammerschläge (`HAMMER_TOWN_MIN`, Zeile ~527) hängen am gleichen Zielpegel `z` und werden bei darbender Stadt mit leiser; gewollt. Lautstärke-Hierarchie unverändert: Signale (Mangel, Krise, Aufstieg) bleiben über dem Umgebungs-Bus; der Eingriff senkt nur `town`, hebt `wind` um höchstens 0,15 (Trim 0,25).
7. **Hörbarkeit.** Der Unterschied voll/darbend muss im Pegel messbar sein: `town`-Ziel bei Share 1 gegenüber Share 0,2 mindestens Faktor 2 (Test-AK unten).

### Abnahmekriterien Teil A (Vitest, Fake-`AudioContext`, `tests/audio/`)

- AK-A1 `townFactor`: Variante B liefert 1 bei 0,8 und 0,9; 0,5 bei 0,4; 0 bei 0,2 und 0; monoton steigend; `NaN`/`undefined`/negativ → 1 (kein Eingriff).
- AK-A2 `ambienceMix`: gleiche Ansicht, `suppliedShare` 1,0 gegenüber 0,3 → `town` mindestens Faktor 2 grösser; ohne `suppliedShare` identisch zum Ergebnis vor der Änderung (bestehende Tests in `tests/audio/mix.test.ts`/`ambience.test.ts` bleiben grün).
- AK-A3 Wind: `suppliedShare` 0,1 mit `houses > 0` → `town` 0 und `wind` grösser als bei Share 1; mit `houses` 0 → `wind` unverändert.
- AK-A4 `smoothShare`: Sprung 1 → 0 nach 10 s Audio-Zeit bei ≈ 37 % des Ausgangs, nach 30 s < 6 %; gleiche Eingabefolge ergibt gleiche Ausgabe (deterministisch, keine Zufallsquelle); `dtS` ≤ 0 ändert nichts.
- AK-A5 Motor mit Fake-`AudioContext`: Wechsel von Share 1 auf 0,2 setzt das `town`-Gain-Ziel per `setTargetAtTime` mit Zeitkonstante `GLIDE_S / 3` (kein harter Sprung); `setAmbience` wirft bei kaputter Eingabe nicht.
- AK-A6 `viewStats` (Render-Test, Welt-Fixture): 4 Häuser im Bild, 3 voll versorgt → `suppliedShare` 0,75, `houses` 4; Haus ausserhalb des Bildes zählt nicht; keine Häuser → Felder fehlen.
- AK-A7 Importgrenze: `src/audio/` hat keinen neuen Import aus `sim/`/`ui/` (bestehender Grenz-Test bzw. `rg` im Plan).

## Teil B: I-118 Aufstiegs-Funkeln

1. **Erkennung (Render, schreibt nie in die Welt).** Neues reines Modul `src/render/aufstieg.ts`: `detectRises(prev: Map<id, tier>, buildings, nowMs) → { next: Map; started: Rise[] }`. Ein Aufstieg ist `tier` strikt grösser als im Vorframe für dieselbe Gebäude-Id. Neue Ids (gebaut, geladen) und Abstiege erzeugen nichts, sie aktualisieren nur die Map. Der erste Aufruf (Start, Laden, Neue Insel) merkt nur den Stand (`prev` leer → keine Effekte); beim Laden/Neustart setzt die UI die Map zurück (Plan: wie `monumentFlareStart`-Verdrahtung in `renderer.ts`).
2. **Effekt.** `Rise = { id, startMs, tier }`, Dauer 1500 ms. Zeichner `drawRiseGlow(ctx, rect, elapsedMs, tier, reduce)` in `src/render/fx.ts` (Muster `drawMonumentFlare`/`flareStrength`): warmer Lichtkranz (Ellipse in Hausbreite, Farbe aus `PALETTE`, kein neuer Farbwert ohne Ausweis), Stärke = schneller Anstieg (≈ 200 ms), sanftes Abklingen bis 1500 ms; 6–8 Funken (Stufe 2: 6, Stufe 3: 7, ab Stufe 4: 8, jeweils grösserer Radius ab Stufe 3), deterministisch aus `id` und Funkenindex (keine `Math.random` im Zeichner). Elapsed ≥ 1500 oder < 0 → nichts.
3. **Deckel.** Höchstens 6 gleichzeitige Effekte (Konstante `riseGlow: [6, 6]` in `CAPS`, `src/render/limits.ts`; Funkenzahl `riseSparks: [8, 0]`); bei Überschreitung fällt der älteste zuerst (R-Regel «älteste zuerst»). Nur Häuser im Bildausschnitt werden gezeichnet; ausserhalb gestartete laufen still aus.
4. **«Bewegung reduzieren».** Nur der Kranz (statisch, 1500 ms Ausblenden), keine Funken, keine Pulsation.
5. **Pause.** Die Zeit läuft über `fx.timeMs` (Wanduhr): in der Pause friert der Effekt nicht von selbst ein. Daher Plan-Entscheid: Effekt-Uhr als Spielzeit-Akkumulator nur bei `speed > 0` (Empfehlung) oder Effekt endet in der Pause wie heute der Feuerschalen-Flare. Test deckt die gewählte Variante ab (AK-B6).
6. **Hohe Geschwindigkeit.** Mehrere Aufstiege im selben Frame: alle gestartet, Deckel greift; kein Stau, kein Nachholen nach Ende des Deckels.
7. **Lesbarkeit.** Der Kranz liegt über dem Haus, unter Bedarfs- und Statussymbolen (`statusMarks.ts`), damit Mangel-Marken nie verdeckt werden; Mangel hat Vorrang vor Schmuck. Warmer Farbton hebt sich von Rauch und Feuer (rot/dunkel) und vom Warnring ab; Browser-Check Standard-Zoom bei Tag und Nacht.

### Abnahmekriterien Teil B (Vitest, `tests/render/`, Fake-Kontext `fakeCtx.ts`)

- AK-B1 `detectRises`: Stufe 1 → 2 liefert genau einen Eintrag; gleiche Stufe, Abstieg 3 → 2 und neue Id nichts; erster Aufruf mit leerer Map nichts; die zurückgegebene Map enthält alle aktuellen Ids (abgerissene fehlen).
- AK-B2 `drawRiseGlow` bei elapsed 0, 200, 700, 1500: Stärke 0 → Maximum bei ≈ 200 ms → abfallend → bei 1500 nichts gezeichnet (Fake-Kontext zeichnet 0 Pfade); negative/NaN-Zeit zeichnet nichts.
- AK-B3 Funkenzahl: Stufe 2 → 6, Stufe 3 → 7, Stufe 4+ → 8 Funken; `reduce` → 0 Funken, Kranz bleibt; Funkenpositionen für gleiche `id` identisch bei zwei Aufrufen (deterministisch), für verschiedene `id` verschieden.
- AK-B4 Deckel: 9 gleichzeitige Aufstiege → höchstens 6 gezeichnet, die 3 ältesten fehlen; nach Ablauf eines Effekts rückt kein verworfener nach.
- AK-B5 Bildausschnitt: Aufstieg eines Hauses ausserhalb des Culling-Rechtecks → keine Zeichenaufrufe.
- AK-B6 Pause: bei angehaltener Effekt-Uhr (gewählte Variante) bleibt die Stärke zwischen zwei Frames gleich (bzw. endet der Effekt wie beschrieben).
- AK-B7 Laden: `detectRises` nach Zurücksetzen der Map mit einer Welt höherer Stufen → keine Effekte.
- AK-B8 `src/render/` schreibt nicht in die Welt: Test reicht eine eingefrorene (`Object.freeze`) Gebäudeliste durch.
- Browser-Check (Playtester, nicht Vitest): Aufstieg per Schnellvorlauf auslösen, Kranz in Standard-Zoom erkennbar, kein Verdecken der Bedarfssymbole.

## Varianten und Empfehlung

| Variante | Inhalt                                                                                              | Urteil                                                                                                         |
| -------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 1        | A+B in einem Plan, zwei Tech-Pakete (Audio: `art-audio-engineer`; Render: `art-rendering-engineer`) | **empfohlen**: keine gemeinsamen Dateien ausser der Verdrahtung in `app.ts` (eine Zeile `viewStats`/Map-Reset) |
| 2        | nur A (Klang) zuerst                                                                                | falls die Verdrahtung in `app.ts` wegen UI-HAEPPCHEN-D gesperrt ist; B danach                                  |
| 3        | B mit Ton-Kopplung (Aufstiegston verschieben)                                                       | verworfen: Eingriff in `economySounds.ts`, kein Mehrwert                                                       |

Mix-Kurve: **B (stetig)**. Pause-Verhalten Funkeln: **Spielzeit-Akkumulator**. Grösse: gesamt S–M (≈ 90 Tools, zwei Pakete; I-120 ≈ 40, I-118 ≈ 50). Assets 0 Byte, keine CREDITS-Zeile.

## Abgrenzung

- **ORT-A/ORT-B** (Ortsrand): statische Gestalt von Häusern/Rändern; I-118 ist ein zeitlicher Effekt. Kein gemeinsames Modul; `aufstieg.ts` und `fx.ts`-Zusatz berühren keine Ortsrand-Dateien. Wegen `renderer.ts` (Einhängepunkt) Merge-Reihenfolge im Plan prüfen.
- **I-009 Hörbarer Mangel** und **I-007 Fest**: Einzelsignale, die Dauerstimmung hier ändert sie nicht.
- **I-119/I-121** (Bewohner, Wartende): Pool; teilen Perf-Deckel der Figuren nicht, zählen aber später mit.
- **UI-HAEPPCHEN-D** berührt `src/ui/app.ts`; die Verdrahtung beschränkt sich dort auf wenige Zeilen.

## Save, Sim, Werte

Kein Save (`suppliedShare` und Aufstiegs-Map sind abgeleitet, nicht gespeichert; Save-Version unverändert). Keine Änderung in `src/sim/`; Balancing-Test unberührt. Pegel (0,15 Wind, 10 s, 1500 ms, Deckel 6) sind Darstellungswerte in `src/audio/` bzw. `src/render/limits.ts`, keine Spielwerte.

## Offene Punkte für den Plan (lead-tech)

- Prädikat «voll versorgt» festlegen (Wiederverwendung statt neuer Sim-Logik).
- Ort der Aufstiegs-Map (Renderer-Zustand) und Reset beim Laden.
- Pause-Uhr für den Effekt.
