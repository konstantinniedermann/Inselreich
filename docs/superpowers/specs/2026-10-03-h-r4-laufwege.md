# H-R4 Laufwege (Programm G6) — Kurzdesign

Status: Umsetzungsnotiz, kein Gate. Annahmen sind mit **[A]** markiert. Reine Darstellung: liest `b.progress`,
`b.state`, `b.connected`, Terrain und Weggraph, schreibt nie in die Welt.

## Phase und Zeit
- Phase `p = (progress + frac) / cycle`, nur bei Zustand `ok` und `connected`. `frac` (0..1) ist der Anteil des
  laufenden Ticks. **[A]** Der Renderer kennt Tempo und Tickbruchteil nicht; `errands.ts` merkt sich je Welt
  (WeakMap, ein Eintrag) Tickwechsel und Zeit und schätzt daraus Tickdauer und `frac`. So laufen Figuren flüssig
  statt in Tick-Sprüngen, und das Tempo ist bekannt (Tickdauer < `TICK_MS / 2` = über 2x).
- Pause: `frac` bleibt bei 1 stehen, Figuren stehen.

## Figuren je Betrieb (eine Figur je Betrieb)
- **Sammler** (Betrieb mit `produces` und Standortregel Wald/Fels/Küste: Holzfäller, Steinbrecher, Fischer):
  Phase 0–0,30 hin zur Zielkachel, 0,30–0,40 Arbeit (steht), 0,40–0,70 zurück **mit Last** (Lastpunkt in Warenfarbe).
- **Zielkachel:** begehbar (kein Wasser, kein Gebäude), Terrain laut Regel (Wald, Fels; Küste: Land mit Wasser-Nachbar)
  im Radius `rule.radius + 1` (sonst 2,5) um die Mitte; Wert = Abstand + `hash2(seed + 93, x, y) · 0,4`, kleinster gewinnt.
  Start: Punkt auf dem Gebäuderand zum Ziel hin. **[A]** Gerade Linie; bei verwinkelter Küste kann sie Wasser streifen.
- **Träger** (jeder Betrieb mit `produces`): Phase 0,75–1 (Nicht-Sammler 0,70–1) vom Betrieb über den Weggraph zum nächsten
  Kontor oder angebundenen Markt (Breitensuche, Mehrquellen, Wegkacheln neben dem Betrieb bis Wegkacheln neben dem Ziel);
  Lastpunkt die ganze Strecke, an der Ankunft ausgeblendet. Ohne Wegverbindung keine Figur.
- Ein-/Ausblenden über Phase (5 % des Zyklus), nicht über `FADE_MS`: Die Phase ist Simzeit, `FADE_MS` Echtzeit **[A]**.
  Bei Phase 0 und kurz vor 1 ist `alpha` 0, die Figur steht nie sichtbar auf dem Betrieb.
- **Bürger Haus → Markt:** **Folgehäppchen.** Viele Häuser, kein Phasensignal in der Sim (kein `progress`); eine
  ehrliche Regel braucht eigene Taktung und kostet Figurenbudget. Nicht in H-R4.

## Budget und Leistung
- Figurenlimit 40 (`CAPS.walkers`, unverändert, reduziert 12): **Errands zuerst**, Spaziergänger bekommen den Rest
  (`cap − Errands`). `MAX_ERRANDS` = 16 (reduziert 6), lokal in `errands.ts`; gezählt werden nur gerade sichtbare Figuren.
- Über 2x Tempo: deterministische Teilmenge (`hash2(seed + 95, id, 0) < 0,5`).
- Nur Betriebe im Bildbereich (um 6 Kacheln erweitert) werden berechnet; Figuren ausserhalb des Bereichs nicht gezeichnet.
- Pfad-Cache `WeakMap<RoadGraph, Map<Betriebs-ID, Plan>>`: der Weggraph wird bei jeder Layoutänderung neu gebaut,
  damit verfällt der Cache von selbst; Obergrenze `PLAN_CACHE_MAX` = 512 Einträge (darüber geleert). Breitensuche nur
  bei Cache-Fehlgriff. `renderStats.errands` zählt die Figuren des letzten Frames.

## Zeichnung
Tiefensortierung über die `moving`-Liste mit `kind: 'walker'` und `id = ERRAND_ID_BASE (1000) + Betriebs-ID`
(`iso.ts` und `sprites.ts` bleiben unberührt). Schatten wie Spaziergänger, Figur über `drawWalker`, danach
`drawErrandLoad` (Punkt mit dunkler Kontur, mind. 2,5 px, Palettenfarbe je Ware, keine Signalfarben).
