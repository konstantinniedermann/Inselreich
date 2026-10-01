# ADR-012: Isometrische Darstellung

Status: vorgeschlagen (angenommen mit dem Gate Spec M7-ISO) · Datum: 2026-10-01 · ersetzt
[ADR-003](ADR-003-topdown-statt-isometrie.md) · Ruling R91 · Spec:
[M7-ISO](../superpowers/specs/2026-10-01-m7-iso-design.md), Nachtrag zu
[M7 Stimmung](../superpowers/specs/2026-09-30-m7-stimmung-design.md)

## Kontext

ADR-003 hat für das MVP eine Draufsicht mit quadratischen 32-px-Kacheln gewählt. Isometrie war als späteres Upgrade
vorgesehen, der Renderer dafür isoliert. Nach M5 hat der Nutzer bessere Grafik und Stimmung verlangt (R73) und am
2026-10-01 ausdrücklich „isometrische Grafiken". L0 hat das als Wechsel auf die Rautenprojektion von Anno 1602
ausgelegt (R91).

Der M7-Render-Plan (Terrain R1a, Gebäude R1b und R2) setzt noch auf Draufsicht. Würde er so gebaut und danach auf
Isometrie umgestellt, entstünde die Arbeit doppelt.

Die Sim rechnet auf einem quadratischen Kachelraster mit euklidischen Radien. Sie kennt keine Höhen und darf sich
nicht ändern (ADR-002).

## Entscheidung

1. **Projektion:** isometrisch 2:1 mit Rauten von 64 × 32 Bildpixeln bei Zoom 1 und fester Blickrichtung ohne Drehen.
   Die Kachel (0, 0) liegt oben. Projektion und Umkehrung sind reine Funktionen in `src/render/iso.ts`. Die
   Trefferprüfung ist exakt (`floor` der Umkehrung) und braucht keine Nachschlagetabelle.
2. **Kachelraum bleibt die Wahrheit:** Sim, Footprints, Radien, Wege, Küstenfeld und Figurenpfade rechnen weiter im
   Kachelraum. Nur das Zeichnen projiziert. Die Sim, das Speicherformat und die Spielwerte bleiben unverändert.
3. **Boden über eine affine Abbildung:** Die Bodentextur entsteht im Kachelraum, wie sie für die Draufsicht geplant
   war. Sie wird je Frame mit der Iso-Matrix gezeichnet; flache Elemente (Wasser, Schaum, Wege) unter derselben
   Matrix. Eine vorgerenderte Iso-Ebene ist verworfen: Sie wäre zur Hälfte leer und überschreitet bei Faktor 2 die
   Canvas-Grenze von Safari.
4. **Höhe nur für Objekte:** Gebäude, Bäume, Schiff und Figuren haben Höhe, der Boden ist flach. Objekte werden nach
   dem Tiefenschlüssel `2x + w + 2y + h` sortiert, bei Gleichstand nach x, dann nach Id. Schatten liegen in einem
   eigenen Durchgang davor, Signale ungetönt über allem.
5. **Grafik bleibt prozedural** (ADR-006 erlaubt fremde Grafik, die Tür aus M7-Spec 2.3 bleibt mit Massstab 64 × 32).
6. **Picking:** Bauen und Wege nutzen die Bodenkachel. Auswählen und Abreissen prüfen zuerst die exakte Körperhülle
   der Gebäude (Sechseck aus Footprint-Raute und Höhe) in umgekehrter Zeichenreihenfolge; das Bildrechteck dient
   nur für Culling und Effekte.

## Konsequenzen

- Der Anno-Look wird möglich, ohne `src/sim/` anzufassen. Die Isolation aus ADR-002 und ADR-003 trägt.
- Zwei Pakete kommen dazu. R0-ISO baut die Darstellung im alten Look auf Isometrie um und stellt die
  Kamera-Aufrufe in `src/ui/` mit um, denn `clampCamera` und `TILE` entfallen und `zoomAt` nimmt Kachelmasse. Das
  kleine UI-Paket U0-ISO schliesst Bau-Anker und Picking an. Der Render-Strang von M7 wird etwa 30 % grösser.
- Die bestehenden reinen Render-Tests bleiben bis auf zwei bewusste Änderungen gültig: den Schritttest in
  `camera.test.ts` und den Schiffsplatz in `ship.test.ts`. Neu kommen Tests für Rundreise, Kanten, Culling,
  Tiefenschlüssel, Ellipse und Picking dazu.
- **Grenze des Tiefenschlüssels:** Er ist nur für Footprints mit `w = h` bewiesen. Ein späteres Gebäude mit
  `w ≠ h` braucht einen paarweisen Vergleich über die trennende Achse statt eines Schlüssels.
- **Höhen im Gelände** (Berge, Klippen) sind nicht enthalten. Sie bräuchten Höhendaten, die die Sim nicht hat. Ein
  späteres Vorhaben kann sie rein darstellend nachrüsten.
- Hohe Gebäude verdecken, was hinter ihnen steht. Dagegen helfen die Höhenhülle (höchstens 2 bzw. 3 Rautenhöhen),
  Signale und Umrisse in der obersten Ebene.
- arc42 (Abschnitte 4, 9, 11) und die Test-Strategie in der Projekt-CLAUDE.md führt der Doku-Pass D1 nach.
