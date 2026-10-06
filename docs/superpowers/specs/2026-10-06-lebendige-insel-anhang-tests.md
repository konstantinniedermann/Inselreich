# Anhang Tests zu „Lebendige Insel" (ART-STIL-02)

- Status: Gate-Nacharbeit R283 (T1–T6, Q1–Q7) · Autor: lead-art · 2026-10-06
- Ergänzt [2026-10-06-lebendige-insel.md](2026-10-06-lebendige-insel.md) §5–§7. Die AK aus §7 gelten weiter; dieser
  Anhang legt je Häppchen die zusätzlichen Tests, den roten Starttest und die blinden Bildfragen fest. Bei
  Widerspruch in Testfragen gilt der Anhang.
- Kennungen: `Ln-Tk` = Test k von Häppchen n. In Klammern die Gate-Punkte, die der Test schliesst.

## 0 Für alle Häppchen

- **0.1 Test-first (Q7):** Jedes Engineer-Briefing nennt den roten Starttest aus diesem Anhang wörtlich. Der Engineer
  meldet ihn rot (Ausgabe von `npx vitest run <datei>`), bevor er Produktivcode schreibt. Fehlt die rote Ausgabe im
  Arbeiterbericht, nimmt der Lead den Task nicht ab.
- **0.2 Salze (T6, R1):** Neue Salze nur aus 500–599, eingetragen im Kopfkommentar von `src/render/groundDecor.ts`
  im selben Commit wie der Code. Vergabe: **500** Inselcharakter `hash2(seed + 500, 0, k)` (k 0 Waldtyp L1, k 1
  Blüten, k 2 Küste, k 3 Gebirge, k 4 Nachtmeer; L8) · **501–519** L1 · **520–539** L2 · **540–559** L4 ·
  **560–569** L5 · **570–575** L3 (sprites.ts, material.ts) · **576–584** L6 · **585–594** L7 · **595–599** L8 (Seltenheitsbudget).
- **0.3 Unberührte Referenzen (Q2):** `tests/render/picking.test.ts` und `tests/render/verdeckung.test.ts` bleiben
  in allen Häppchen unverändert. Prüfung im Review: `git diff --stat <basis> -- tests/render/picking.test.ts
tests/render/verdeckung.test.ts` ist leer. Dasselbe gilt für `src/sim/` und `tests/sim/`.
- **0.4 Referenz zuerst (Q2):** Wo ein Häppchen „bytegleich zu main" oder „Pixeldiff ≈ 0" verspricht, ist der erste
  Commit eine Fixture, erzeugt auf der unveränderten Basis, mit eigenem Test, der auf der Basis grün ist. Erst danach
  wird Produktivcode geändert.
- **0.5 Kein `Math.random` (Q7, R1):** Je neuer Datei unter `src/render/` ein Grep-Test (Quelltext lesen, Treffer
  `Math.random` = rot). Pflicht für `decor.ts`, `decorStamps.ts`, `fauna.ts`; L1 legt ihn für `trees.ts` an.
- **0.6 Blinde Bildfragen (Q6, R282):** Kein qa-playtester je Häppchen. Die Fragen unten gehen in den einen
  Browser-Lauf je Release, den L0 startet. Der Rater bekommt nur Bild und Frage, keinen Kontext zum Häppchen, und
  öffnet Vergleichsbilder erst nach dem schriftlichen Urteil (E-018). Durchfall nach dem Kriterium je Frage →
  Häppchen fliegt aus dem Kandidaten (§6.0).
- **0.7 Perf:** Messweg §5 (`tools/render-qa/perf.mjs`, A = Basis-Commit des Häppchens, B = Kopf, Seeds 7 und 14,
  `--runs 3`, DPR 1 entscheidend, DPR 2 informativ). Je Häppchen im Bericht: `renderMedian`-Delta Zoom 1 und 2,
  `buildMs`-Verhältnis, bei L4/L5 `lastPatchMs`.

## L1 Wald organisch (T1, T2, T6, Q4, Q6, Q7)

**T1-Entscheid:** trifft lead-art im Häppchen nach einer Messung (Randkronen direkt gezeichnet gegen Randrolle in der
Variante) und begründet ihn im Bericht an L0. Die Tests unten gelten für beide Wege.

- **L1-T1 Stempelbox (T1):** Jeder Pfadpunkt jedes Stempels (alle Varianten, Seeds 1/2/5/7, mit Versatz) liegt in
  `treeBounds(item)`. Ersetzt den alten Test „in der Spaltenbreite einer Kachel": Die Breite darf bis
  `ISO_W × (1 + 2 × 0,35)` plus Versatz wachsen, die Box wächst mit.
- **L1-T2 Überhang nur auf Wald und freie Wiese (T1, §7):** Fixture-Welt mit Gebäude am Waldrand, Weg quer durch den
  Wald und Sand am Waldrand. Für jede Krone jedes Stempels liegt der Kronenfuss (Mitte ± Radius, im Kachelraum, mit
  Versatz) nur auf Kacheln mit `forest` oder freiem `grass` (ohne Gebäude, ohne Weg).
- **L1-T3 Tiefensortierung (T1):** `sortedObjects` liefert weiter genau einen Stempel je freier Waldkachel mit
  `depthKey` der eigenen Kachel (bestehender Test AK-R1-06 bleibt grün). Da der Überhang nur auf Kacheln ohne
  Gebäude, Massiv und Figuren fällt (L1-T2), braucht es keinen neuen Sortierschlüssel.
- **L1-T4 Cache-Grenzen (Q4):** `TREE_VARIANTS ≤ 24`. Nach allen Varianten × 200 zufälligen Zoomwerten in
  [0,125; 2] hält `treeCacheSize() ≤ TREE_VARIANTS × ZOOM_STEPS.length`. Wechsel des Seeds leert den Cache
  (bestehend). Werden Einzelkronen gecacht, zählen sie in dieselbe Grenze.
- **L1-T5 Licht-Verdeckung folgt dem Stempel (T2):** In `tests/render/life*.test.ts`: Für jede Variante und einen
  Versatz liegt der Mittelpunkt jedes `crownPolys`-Vielecks auf dem Mittelpunkt der gezeichneten Krone (±0,5 px bei
  Zoom 1); die Zahl der Vielecke = Zahl der Kronen. `tests/render/lichtVerdeckung.test.ts` bleibt unverändert grün.
- **L1-T6 Determinismus:** gleicher Seed → identische Liste (Variante, Versatz) über zwei Aufbauten; Waldtyp (§3.7)
  aus `hash2(seed + 500, 0, 0)` je Seed stabil, über Seeds 1–40 mindestens 3 der 4 Waldtypen.
- **L1-T7 Kein `Math.random`** in `trees.ts` (0.5).
- **AK aus §7** als Vitest bzw. Fake-Kontext: Randabstand SD ≥ 0,12; Nachbarpaare ≥ 90 % verschiedene Stempel;
  Radien max/min ≥ 2,5; Rand ≤ 0,8 × Kern; gleiche dominante Art ≥ 0,65; keine Krone nur aus einer `ellipse` bzw.
  einem Dreieckspfad.
- **Salze (T6):** L1 trägt seine Salze (501–519 und 500/k 0) im Kopf von `groundDecor.ts` ein.
- **Roter Starttest:** `tests/render/trees-wald.test.ts` „Kronenlage aus einem Feld: Entlang eines geraden Waldrands
  von 10 Kacheln streut der Abstand der äussersten Krone zur Kachelkante mit SD ≥ 0,12 Kachel" (heute ≈ 0,02).
- **Blinde Bildfragen (Release-Lauf A):** Proben `s{1,2,5,7}-gesamt-z0.5` und `s{1,2,5,7}-wald-z1` aus
  `tools/render-qa/galerie.mjs`. (1) „Beschreibe die Form der Waldränder in einem Satz. Folgen sie einem Raster
  (Treppe, gleiche Zacken in gleichem Abstand) oder wirken sie gewachsen?" — Durchfall, wenn ≥ 2 von 4 Seeds
  „Raster/Treppe". (2) „Siehst du sich wiederholende Muster im Wald? Wo?" — Durchfall bei einem genannten
  Kachelmuster in ≥ 2 Seeds. (3) „Wo ist Wald, wo Wiese? Gibt es einzelne Bäume ausserhalb des Waldes?" — Durchfall,
  wenn Wald und Wiese verwechselt werden.

## L2 Gebirgsfuss (Q2, Q6)

- **L2-T0 Referenz zuerst (Q2):** Fixture `tests/render/fixtures/massif-kern.json` mit `shadeColor` der Kernknoten
  (hn ≥ 0,35) für Seeds 7 und 14, erzeugt auf der Basis; Test vergleicht mit ΔE < 1 im Mittel. Grün auf der Basis.
- **L2-T1** bis **L2-T3** = AK §7 L2 (Randabstand ≥ 1,8, Tonumfang, Schnee, Krüppelbäume).
- **L2-T4 Andocken:** `terrain.ts` (Schuttzweig) erst nach Merge von `feat/art02-l1-wald` (nach dessen Review-OK) per
  Merge, kein Rebase; danach alle Tests aus L1 grün.
- **Roter Starttest:** `tests/render/massif.test.ts` „Randabstand, bei dem der Körper 24 % der Amplitude erreicht,
  ≥ 1,8 Kacheln" (heute 1,1).
- **Blinde Bildfragen (A):** Proben `s*-gebirgsfuss-z1`, `s*-gebirgsfuss-z2`. (1) „Was liegt zwischen Berg und
  Wiese?" — Durchfall, wenn ≥ 2 von 4 Seeds „Nebel, Schmutz, grauer Rand" o. ä. (2) „Ist bei z2 am Bergfuss
  Bildrauschen zu sehen?" — Durchfall bei „ja" in ≥ 2 Seeds.

## L3 Gebäudekanten (Q2, Q5)

- **L3-T0 Referenz zuerst (Q2):** Fixture `tests/render/fixtures/body-shapes.json` mit Picking-Polygonen und
  `bodyHull` aller Typen und Stufen (Variante 0–3), erzeugt auf der Basis; Test bytegleich. `picking.test.ts`,
  `verdeckung.test.ts` unverändert (0.3).
- **L3-T1 Signale (Q5):** Fake-Kontext: Die Aufrufe von `statusMarks` (Farben, Lage) sind gleich zur Basis; Lichtkante
  und Kontaktschatten haben ΔE2000 ≥ 20 zu allen `signal*` (`tests/render/deltaE.ts`).
- **L3-T2** bis **L3-T4** = AK §7 L3.
- **Blindtest (Q5):** Probenblatt 15 nach Ablauf E-018. Endstand H-R10 (`.studio/qa/H-R10/blindtest-urteil.md`):
  22 Blätter, 12 sicher, 5 unsicher, 5 geraten. Bestanden, wenn richtig erkannt ≥ Endstand-Treffer und sicher ≥ 12.
- **Roter Starttest:** `tests/render/sprites.test.ts` „Je Körper höchstens ein Kontur-Strich, keine Striche auf
  Innenkanten".

## L4 Deko-Fundament und Wiese (T3, T4, Q3, Q4, Q7)

- **L4-T0 Patch-Pfad messen (T3, erster Task):** `lastPatchMs` auf main nach Merge von L1 (Bau, Abriss, Roden; Seed 7)
  als Basiswert in den Plan. Boden-Deko wird nur im Patch-Rechteck neu gemalt (Test: Zahl der gemalten Kacheln ≤
  Fläche des Patch-Rechtecks).
- **L4-T1 Nur Heimatinsel (T4, §3.6):** Inselansichten fremder Inseln liefern keine Deko-Stempel in
  `sortedObjects`, nur Boden. Cache-Thrash: abwechselnd Heimat- und Ansichts-Seed über 10 Frames → der
  Deko-Stempel-Cache wird höchstens einmal geleert (`cacheSeed`).
- **L4-T2 Patch = Vollaufbau (Q3):** Deko nach Patch == Deko nach Vollaufbau für Bau, Abriss, Roden, Aufforsten;
  Picking mit und ohne Deko gleich; Deko gleich nach `serialize` + Laden.
- **L4-T3 R5-Grenzen (Q3):** stehende Deko ≤ `TREE_H`; Solitär ≥ 2 Kacheln vom Wald und ≤ 1 je 3 × 3; Findling ≤ 0,3
  Kachel; auf bebaubaren Kacheln kein Wasser-Look (kein Ton mit ΔE2000 < 10 zu den Wassertönen).
- **L4-T4 LRU (Q4):** `DECOR_CACHE_MAX_BYTES` = 8 MiB in `limits.ts`; nach Füllen über die Grenze ≤ 8 MiB, der älteste
  Eintrag fliegt zuerst.
- **L4-T5 Salz-Register (T6):** Test liest `src/render/*.ts`, sammelt `seed + 5dd` und prüft: jedes Salz steht im
  Kopf von `groundDecor.ts` und liegt im Bereich seines Häppchens (0.2).
- **L4-T6** Grep-Test kein `Math.random` in `decor.ts`, `decorStamps.ts` (0.5).
- **Roter Starttest:** `tests/render/decor.test.ts` „Keine Deko auf Gebäude- oder Wegkacheln; kein Stempel auf (+x,
  +y, +x+y) vor Gebäuden".

## L5 Küste und Meer (T5, Q6)

- **L5-T1 Fernansicht (T5):** Bei Zoom ≤ 0,25 liefert der Fern-Pfad ≤ 300 Stempel je Insel (nur Wrack, Meeresfelsen
  und Bodenbild), über Seeds 1–50.
- **L5-T2** bis **L5-T3** = AK §7 L5 (Lanes, Anker, Kegel, `shipAt`).
- **Roter Starttest:** `tests/render/decor.test.ts` „Seeds 1–200: kein Meer-Element < 3 Kacheln von einer Lane".
- **Blinde Bildfragen (Release-Lauf B):** Proben `s*-gesamt-z0.25` mit Wrack bzw. E8. (1) „Was ist das?" (Zeiger auf
  das Objekt) — **E8 fällt durch** (wird gestrichen, §9 (3)), wenn es in ≥ 1 von 2 Proben als Insel, Bauland oder
  Schiff gelesen wird. (2) Wrack: Durchfall, wenn es als fahrendes oder Handelsschiff gelesen wird.

## L6 Gebirge und Wald entdecken (Q2, Q6)

- **L6-T0 Referenz zuerst (Q2):** Kern-Fixture aus L2 neu erzeugt auf main nach Merge von Release A; Pixeldiff
  ausserhalb der Elementmasken wie L2-T0.
- **L6-T1 Perf (Q6):** `buildMs` am Massiv ≤ +30 % gegen main nach Merge A.
- **L6-T2** = AK §7 L6.
- **Roter Starttest:** `tests/render/massif.test.ts` „Bergsee nur in einer Mulde (Steilheit < 0,2, hn 0,4–0,7)".

## L7 Tierleben (Q1, Q7)

- **L7-T1 CAPS bewusst erweitert (Q1):** `tests/render/weather.test.ts:57` prüft `CAPS` per `toEqual`. Das Briefing
  nennt die Änderung: alte Schlüssel und Werte unverändert, die 13 neuen Schlüssel aus §5 ergänzt. Review prüft per
  Diff, dass nur Zeilen hinzukommen.
- **L7-T2** Grep-Test kein `Math.random` in `fauna.ts` (0.5).
- **L7-T3** = AK §7 L7.
- **Roter Starttest:** `tests/render/fauna.test.ts` „Obergrenzen `CAPS` normal und reduziert eingehalten".

## L8 Seltenheit (Q7)

- **L8-T1 Laufzeitgrenze (Q7):** Der Test über Seeds 1–500 nutzt nur die reine Platzierung (`decor.ts`, kein Canvas)
  und setzt ein Vitest-`timeout` von 20 s; misst er Wandzeit, steht er in `ZEITTESTS` (`make zeittests`).
- **L8-T2** = AK §7 L8.
- **Roter Starttest:** `tests/render/decor.test.ts` „Seeds 1–500: jede Insel hat 3–6 S/E-Elemente".

## Zuordnung der Gate-Punkte

| Punkt | Häppchen | Test            | Punkt | Häppchen       | Test                  |
| ----- | -------- | --------------- | ----- | -------------- | --------------------- |
| T1    | L1       | L1-T1 bis L1-T3 | Q1    | L7             | L7-T1                 |
| T2    | L1       | L1-T5           | Q2    | L2, L3, L6     | 0.3, 0.4, L2/L3/L6-T0 |
| T3    | L4       | L4-T0           | Q3    | L4             | L4-T2, L4-T3          |
| T4    | L4       | L4-T1           | Q4    | L1, L4         | L1-T4, L4-T4          |
| T5    | L5       | L5-T1           | Q5    | L3             | L3-T1, Blindtest      |
| T6    | alle     | 0.2, L4-T5      | Q6    | L1, L2, L5, L6 | Bildfragen, L6-T1     |
|       |          |                 | Q7    | alle           | 0.1, 0.5, L8-T1       |
