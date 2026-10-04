# Retro adhoc prozess-kreativitaet-tempo — 2026-10-04

- Datum: 2026-10-04
- Art: adhoc (Prozess-Retro, Aussensicht `studio-process-coach`)
- Auslöser: Nutzerfeedback 2026-10-04, Ruling R207 (1) Kreativabteilung, (2) Tempo / Release-Bündel; Paket P-R207
- Datenbasis: `.studio/events.jsonl` über `tools/studio/model.py build_state` (Instanzen, Dauer, Tool-Aufrufe,
  `max_gap_s`, `log.py result`; Paket über die Elternkette zugeordnet, Skript im Scratchpad, nicht im Repo),
  `python3 tools/studio/metrics.py --efficiency --sessions 3`, `docs/studio/metriken/M11.md`,
  `git log --merges --first-parent main --since=2026-10-03`, `docs/studio/rulings.md` (R172–R207 per grep),
  `docs/superpowers/specs/2026-10-02-programm-nutzerfeedback.md` §2/§4, `.claude/agents/lead-design.md`,
  `docs/studio/STUDIO.md` (Umsetzungszyklus), Retros `2026-10-03-session-347a6598`, `2026-10-03-session-9b13950a`,
  `2026-10-03-meilenstein-m11`, `2026-10-03-prozess-retro-m11`.

Messregeln (Verfassung §8.3): „gemessen" heisst aus den genannten Quellen gezählt. Agentenminuten sind die
Laufzeit einer Instanz und enthalten Wartezeit in der Instanz. L0-Zeit, CI-/Pages-Dauer und die Zeit des Nutzers
im Live-Playtest sind **nicht gemessen** (in den drei Sessions 0 `ci`-Events mit Session-ID). Schätzungen sind
als „Schätzung" markiert.

## Beobachtung

### B1 · Ideen kommen nur vom Nutzer (Teil A)

- 20 von 20 Punkten des laufenden Programms (G1–G9, S1–S11) stammen aus dem Nutzerfeedback
  (`programm-nutzerfeedback.md` §2, „Tabelle aller 20 Punkte"); M9, M10, M11 und M12 sind daraus geschnitten (§4).
  H-S1 und H-R9 gehen auf den Nutzerauftrag R204 zurück. Bausteine mit Studio-Ursprung seit 2026-10-02: **0**
  (gemessen für M9–M12 und die Häppchen H-R1…H-R9, H-S1, H-A1; M5–M8 nicht geprüft).
- Es gibt keinen Ideen-Pool: `docs/` enthält als Sammelstelle nur `beobachtungen.md` (Befunde, keine Vorschläge).
- Rohmaterial für Ideen entsteht laufend, wird aber nicht zu Vorschlägen: z. B. „Tiere der Rinderfarm wirken wie
  Kisten", „Ausbau lohnt im Referenzpfad nicht (M-15)", „Nachtlicht generell schwach" (`docs/beobachtungen.md`,
  Einträge 2026-10-03; `state.md` führt sie nur als „Signale").
- Der Umsetzungszyklus beginnt mit „Auftrag → L0 startet" (`STUDIO.md`, Umsetzungszyklus Schritt 1). `lead-design`
  verantwortet „Designvorschläge" und liefert sie „im Bericht an L0" auf Auftrag (`.claude/agents/lead-design.md`,
  Verantwortung, Arbeitsweise Schritt 2); einen eigenen Takt hat die Rolle nicht. Die Säulen-Prüffrage (Insel
  besiedeln, Produktionsketten, Bevölkerung versorgen und aufsteigen, Wirtschaft über Steuern und Handel) existiert
  bereits in derselben Persona.
- Retros erzeugen nur Prozessvorschläge (26 `retro`-Events, Verfassung §10); für Produktideen gibt es kein
  Gegenstück.

### B2 · Wohin die Zeit bei Häppchen geht (Teil B)

Neun Häppchen in drei Sessions, gemessen:

| Häppchen | Session  | Wanduhr Start bis Merge | Instanzen | Tools | Review-Runden (`log.py result`, Max.) |
| -------- | -------- | ----------------------- | --------- | ----- | ------------------------------------- |
| H-R5     | 08e7b5f1 | 28 min                  | 5         | 111   | nicht erfasst                         |
| H-A1     | 08e7b5f1 | 8 min                   | 4         | 39    | nicht erfasst                         |
| H-R3     | 08e7b5f1 | 10 min                  | 5         | 70    | nicht erfasst                         |
| H-R4     | 08e7b5f1 | 20 min                  | 5         | 107   | nicht erfasst                         |
| H-R6     | 9b13950a | 27 min                  | 5         | 97    | 1                                     |
| H-R7     | 9b13950a | 97 min                  | 7         | 267   | 3                                     |
| H-R8     | 9b13950a | 106 min                 | 6         | 264   | 5                                     |
| H-S1     | 347a6598 | 12 min                  | 4         | 66    | 1                                     |
| H-R9     | 347a6598 | 164 min                 | 6         | 683   | 3 (Retro 347a6598: 5 Fix-Runden)      |

Phasen über alle neun Häppchen (Summe 567 Agentenminuten, 1704 Tool-Aufrufe; die Spec liegt bei Häppchen als
Kurz-Spec im Lead-Briefing und ist nicht getrennt messbar):

| Phase                                    | Agentenminuten | Anteil | Tools | Anteil |
| ---------------------------------------- | -------------- | ------ | ----- | ------ |
| Umsetzung (Engineers)                    | 298,0          | 52,6 % | 835   | 49,0 % |
| QA/Playtest (`qa-playtester`)            | 113,9          | 20,1 % | 338   | 19,8 % |
| Review (`qa-code-reviewer`)              | 81,4           | 14,4 % | 194   | 11,4 % |
| Steuerung Lead (`lead-art`, `lead-tech`) | 46,9           | 8,3 %  | 251   | 14,7 % |
| Merge (`production-integrator`)          | 26,0           | 4,6 %  | 74    | 4,3 %  |
| Blindtest-Rater                          | 0,9            | 0,2 %  | 12    | 0,7 %  |

- **Nacharbeit dominiert:** Die drei Optik-Häppchen mit 3–5 Review-Runden (H-R7, H-R8, H-R9) tragen 254,9 von
  298,0 Umsetzungsminuten (85,5 %) und 85,1 von 113,9 QA-Minuten (74,7 %). Jede Runde löst Nachprüfung und
  Browser-Lauf erneut aus (H-R7: 3 Playtester-Instanzen; H-R8: 1 Instanz mit 4 Wiederaufnahmen, 54,5 min).
- **Fixkosten je Häppchen:** 9 Häppchen → 9 Integrator-Instanzen (2,3–3,6 min, 7–10 Tools, Mittel 2,9 min /
  8,2 Tools), 9 Gate-Merge-Rulings (R172, R174, R176, R178, R191, R195, R202, R205, R206), 9 Pushes auf main mit
  Pages-Deploy. Erster Playtester-Lauf je UI-Häppchen 19–73 Tools. Am 2026-10-03 entstanden 13 Merge-Commits
  auf main (`git log --merges --first-parent`), davon 8 mit Häppchen-Titel; jeder ist ein Live-Stand für den
  Nutzer-Playtest (Nutzerzeit nicht gemessen).
- **Serielle Kette:** Das nächste Häppchen startet erst nach dem Merge des vorigen: H-R5-Merge 10:11 → H-A1-Start
  10:11; H-A1 10:19 → H-R3 10:20; H-R3 10:30 → H-R4 10:30; H-R6 13:54 → H-R7 13:55. Leerlauf des
  Umsetzungsstrangs (Ende Engineer → Start nächster Engineer): 7, 6, 8, 18 min (Median 7,5 min). H-A1 (Audio,
  `src/audio/`) lief seriell zwischen Render-Häppchen, obwohl die Dateien disjunkt sind.
- **Sessions sind voll, nicht leer:** Agenten waren 91 % (08e7b5f1, 79 min), 100 % (9b13950a, 438 min) und 80 %
  (347a6598, 205 min) der Session-Spanne aktiv (Vereinigung der Instanz-Intervalle).

### B3 · Wohin die Zeit bei M11 ging (Teil B, Meilenstein)

M11 über die Elternkette zugeordnet: 70 Instanzen, 468,8 Agentenminuten, 1919 Tools, Wanduhr 414 min, davon
271 min mit mindestens einer aktiven M11-Instanz.

| Phase          | Agentenminuten | Anteil | Tools | Anteil |
| -------------- | -------------- | ------ | ----- | ------ |
| Steuerung Lead | 142,4          | 30,4 % | 283   | 14,7 % |
| Plan           | 79,0           | 16,9 % | 338   | 17,6 % |
| Spec/Design    | 77,6           | 16,5 % | 323   | 16,8 % |
| Umsetzung      | 70,7           | 15,1 % | 390   | 20,3 % |
| QA/Playtest    | 57,3           | 12,2 % | 334   | 17,4 % |
| Review         | 35,0           | 7,5 %  | 216   | 11,3 % |
| Merge          | 6,8            | 1,4 %  | 35    | 1,8 %  |

- Spec, Plan und Steuerung zusammen 63,8 % der Agentenminuten; Merge 1,4 %. `tech-plan-architect`: 3 Instanzen,
  Kontext max. 402k (`metriken/M11.md`). Die Lead-Minuten enthalten Wartezeit auf Arbeiter.
- `metriken/M11.md` zählt 54 Agenten / 1514 Tools, weil Spawns ohne Meilenstein-Kennung (u. a. `M11-PLAN`,
  `M11-SPEC`, `M11-DOCS`, `S12-D`) fehlen → Befund in `docs/beobachtungen.md`.

### B4 · Laufende Experimente

- **E-015** (Zeitraum: 8 Pakete mit Gate Merge): 7 von 8 erreicht (R191, R195, R198, R200, R202, R205, R206);
  in keinem stellt L0 einen fehlenden Rot-Beleg oder eine fehlende Nachprüfung fest (Schwelle 0, erfüllt).
  R206 (H-R9, 3 Review-Runden) nennt weder Rot-Beleg noch Nachprüfung; die Messregel erfasst nur Beanstandungen.
- **E-017** (Zeitraum M11, abgelaufen): Final-Review M11 meldete Doku-Nachträge (niedrig, R199 Punkt 3, behoben
  in C7) → Schwelle „0 Final-Reviews mit fehlender Doku" verfehlt (Retro M11, Bewertung offen).
- **E-022** (Zeitraum M12, noch nicht begonnen): seit R201 vier Merges im Integrator-Worktree ohne
  Konflikt in `docs/beobachtungen.md` (R202, R205, R206; Retro 9b13950a „ohne Auffälligkeit").

## Effizienz-Ampel

Quelle: `python3 tools/studio/metrics.py --efficiency --sessions 3` (Sessions 08e7b5f1, 9b13950a, 347a6598).

| Kennzahl                       | Wert    | Ampel | Befund / Ursache                                                                                                                                                                                                                                                                              |
| ------------------------------ | ------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Steuerungsanteil (L0 + Leads)  | 23,5 %  | grün  | –                                                                                                                                                                                                                                                                                             |
| Umsetzeranteil                 | 39,9 %  | grün  | –                                                                                                                                                                                                                                                                                             |
| Cache-Write 5 min              | 26,8 %  | rot   | Beobachtung: Lücken > 5 min in Häppchen-Instanzen (Reviewer H-R7 34,4 min; Engineer H-R9 10,1, H-R8 9,8; Playtester H-R6 9,0, H-R8 8,4; `max_gap_s`). Deutung: Instanzen warten über Fix-Runden. Kein eigenes Experiment (Plätze, siehe V4); V3 senkt die Runden, E-028 trägt die Gegenprobe. |
| Lead-Kontext Median            | 64k     | grün  | –                                                                                                                                                                                                                                                                                             |
| L0-Kontext Max                 | 329k    | gelb  | Session 9b13950a mit M11, H-R6–H-R8 und Studio-Werkzeug (438 min); je Häppchen ein Gate Merge. E-028 senkt die Gate-Zahl (Hypothese, nicht gemessen).                                                                                                                                         |
| opus-Anteil                    | 65,0 %  | gelb  | H-R9 bewusst auf opus (Retro 347a6598). E-027 setzt den Scout auf `sonnet`, damit Kreativarbeit den Anteil nicht treibt.                                                                                                                                                                      |
| Persona-Starts general-purpose | 3       | gelb  | bekannt (Persona im selben Zug, roster.md); kein neuer Befund.                                                                                                                                                                                                                                |
| Grösste gelesene Datei         | 44,5 KB | gelb  | Tool-Ergebnis-Dateien; kein neuer Befund.                                                                                                                                                                                                                                                     |

## Deutung (5-Why)

### Teil A — Kreativität

1. Warum liefert der Nutzer alle Inputs? Jedes Paket beginnt mit einem Auftrag, und L0 leitet Aufträge aus
   Nutzerwünschen und Befunden ab (B1).
2. Warum nicht aus eigenen Ideen? Kein Schritt im Ablauf erzeugt Produktideen: Der Umsetzungszyklus beginnt bei
   „Auftrag", Retros liefern nur Prozessvorschläge.
3. Warum fehlt der Schritt? Das Studio ist als Liefer- und Verbesserungsorganisation gebaut (Rollen liefern,
   prüfen, verbessern); Produkt-Discovery lag stillschweigend beim Nutzer.
4. Warum stillschweigend? Verfassung §5.3 behält nur Richtungswechsel (Titel, Genre, Kernsäulen) dem Nutzer vor;
   Funktionen innerhalb der Säulen darf L0 entscheiden (R207 bestätigt das). Ohne Eigentümer, Takt, Ablage und
   Budget hat aber niemand den Auftrag, solche Funktionen zu erfinden; das Rohmaterial versickert in
   `beobachtungen.md`.
5. **Wurzel:** Es fehlt ein Discovery-Strang (Dual-Track) neben der Lieferung, mit Eigentümer, Takt, Pool und
   Entscheidweg. Muster, kein Einzelfall (0 von 20 Programmpunkten, kein Pool).

Eine neue L1-Abteilung ist nicht nötig: `lead-design` („Ideen-Ida") hat die Säulen-Prüffrage schon, und eine
weitere Lead-Ebene erhöht den Steuerungsanteil (Leads 15,9–19,8 % der Kosten). Was fehlt, ist der Auslöser und
ein günstiger Ideenlieferant.

### Teil B — Tempo

1. Warum dauern Sessions lange? Weil sie voll sind (80–100 % aktiv, B2), nicht weil viel gewartet wird.
2. Warum ist so viel Arbeit drin? Zwei Ursachen: (a) Nacharbeit in Optik-Häppchen (85,5 % der
   Umsetzungsminuten, 74,7 % der QA-Minuten in 3 Häppchen mit 3–5 Runden); (b) die Kette läuft seriell, und jedes
   Häppchen trägt die volle Merge-Strecke (Gate, Integrator, Push, Pages, Nutzer-Playtest).
3. Zu (a), warum so viele Runden? Bildziel und Prämissen waren vor dem Code nicht geklärt (H-R9 nahm bebaubares
   Gebirge an, Retro 347a6598 B2; H-R8 Blindtest Note 3 „pyramidenhaft"). Zu (b), warum seriell? Das nächste
   Häppchen baut auf dem frischen main auf und startet ≤ 1 min nach dem Merge des vorigen.
4. Warum auf main? main ist der einzige Integrationsstand; integrieren heisst gleichzeitig veröffentlichen.
5. **Wurzel (b):** Integration und Release sind gekoppelt; jedes Häppchen ist ein eigenes Release. **Wurzel (a):**
   Optik-Häppchen starten ohne abgestimmtes Bildziel.

Die Vermutung des Nutzers stimmt teilweise. Die Fixkosten je Häppchen (Merge, Gate, Deploy, erster Browser-Lauf,
Nutzer-Playtest) sind real und für den Nutzer am teuersten (9 Live-Stände für 9 Häppchen). In Agentenminuten
ist der grössere Hebel aber die Nacharbeit (a). Bündeln behebt (b), nicht (a); deshalb V2 und V3 zusammen.

## Vorschlag

Nach Hebel sortiert; Streichen und Vereinfachen vor neuen Regeln.

### V1 · Release-Bündel statt Merge je Häppchen (Experiment E-028)

**Modell:**

| Bleibt je Häppchen                                                                        | Wird je Release gebündelt                                                                                                     |
| ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Kurz-Spec, Branch, Umsetzung, TDD-Rot-Beleg                                               | Integration aller release-reifen Branches in einen Kandidaten (Integrator, `.worktrees/integrate`)                            |
| Review je Task durch `qa-code-reviewer` (§9.1), Fix-Runden im eigenen Baum                | `make check` nach jedem Einzel-Merge in den Kandidaten (§9.2, wie heute)                                                      |
| `make check` grün auf der Branch, Abnahme durch den Lead, `log.py result` mit Häppchen-ID | Ein Browser-Lauf `qa-playtester` am Kandidaten mit **eigenem Abschnitt und Screenshots je UI-Task** (§9.3)                    |
| Lizenzprüfung vor Asset-Einbau (§9.4)                                                     | Ein opus-Review über den Kandidaten-Diff (ersetzt den opus-Schlussreview je Häppchen der Stufe leicht; deckt alle Stränge ab) |
| Status „release-reif" statt Gate Merge                                                    | Ein Gate Merge Release (L0, ein Ruling), ein Push, ein CI-/Pages-Lauf                                                         |
|                                                                                           | Ein Nutzer-Playtest mit Release-Notiz in `state.md` („Neu" und „Bitte testen", ≤ 10 Zeilen)                                   |

- **Auslöser:** 3 Häppchen release-reif, oder Session-Ende mit ≥ 1 release-reifem Häppchen (nichts überdauert die
  Session unintegriert), oder ein Meilenstein-Merge (fertige Häppchen fahren im selben Integrator-Lauf mit).
  **Grösse:** höchstens 4 Häppchen (Controller-Grenze 4 Tasks, E-010). **Ausnahme Hotfix:** CI auf main rot oder
  spielbrechender Fehler (Absturz, Spielstand defekt) geht einzeln wie heute.
- **Pipelining:** Das nächste Häppchen startet, sobald das Review des vorigen OK ist, nicht nach dem Merge.
  Unabhängige Häppchen mit disjunkten Dateien (z. B. Audio neben Render) laufen parallel in eigenen Worktrees
  (Verfassung §5.8).
- **Konflikte:** (1) Release-Planung prüft eine Dateimatrix: gleiche Datei in zwei Häppchen → dieselbe Branch
  nacheinander (Stapel), nie parallel. (2) Fachliche Abhängigkeit (wie H-R7 → H-R8, R195) → abhängiges Häppchen
  zweigt von der Branch des Vorgängers ab. (3) Konflikt beim Kandidaten-Merge → Integrator stoppt und meldet
  (§6); der Eigentümer des späteren Häppchens holt den Kandidaten per Merge (kein Rebase), Delta-Review.
  (4) Fällt ein Häppchen im Release-Lauf durch: Fix auf seiner Branch mit Review, oder es fliegt raus; der
  Kandidat wird dann frisch aufgebaut (`git worktree add --detach` auf origin/main), nicht zurückgesetzt.
  (5) `docs/beobachtungen.md` mit `merge=union` (E-022).
- **Erwartete Einsparung (Schätzung, aus B2):** bei 3 Häppchen je Release je Release −2 Integrator-Instanzen
  (≈ −6 min, −16 Tools), −2 Gate-Merge-Rulings, −2 Pages-Deploys, −2 Nutzer-Playtests, −1 bis −2 Playtester-Starts
  (Grundlast je Start ≈ 20 Tools, kleinste gemessene Läufe 19–22 Tools), −2 opus-Schlussreviews, und ≈ −15 min
  Wanduhr durch Pipelining (2 Übergänge × Median 7,5 min). Auf 9 Häppchen: rund −120 Tools (≈ 7 % von 1704) und
  rund −60 min Wanduhr; der grösste Gewinn liegt beim Nutzer (9 → 3 Live-Stände) und bei L0 (9 → 3 Gates).
- **Messbarkeit:** Häppchen behalten ihre Paket-ID und ihr `log.py result`; der Release bekommt eine eigene
  Paket-ID `REL-nn` für Integrator, Release-Lauf, opus-Review und Gate. `metrics.py` trennt damit Häppchen- und
  Release-Kosten.
- **Aufwand:** mittel; Handbuch (Ablauf Stufe leicht Schritt 6/7 und Absatz „Merge" ersetzen, netto ≤ 0 Zeilen,
  `STUDIO.md` hat 401 Zeilen), `gates.md`, Personas `production-integrator` und `qa-playtester`,
  `templates/playtest-report.md`.
- **§9-Prüfung:** 9.1 Review je Task unverändert vor „release-reif"; 9.2 `make check` vor jedem Merge (Branch und
  jeder Kandidaten-Merge); 9.3 jeder UI-Task hat im Release-Lauf eigenen Abschnitt mit Screenshots, das
  Release-Gate prüft eine Liste UI-Task → Screenshot-Pfad, fehlt einer, kein Merge; 9.4 unberührt (im Häppchen);
  9.5 Meilenstein-Final-Review unberührt, Meilensteine bleiben eigene Releases. Gebündelt werden nur Läufe, keine
  Prüfung fällt weg.

```markdown
## E-028 · vorgeschlagen · Release-Bündel für Häppchen

- Hypothese: Wenn Häppchen (Stufe leicht, ohne Save-Format- oder Architekturänderung) nach Review und Abnahme
  nur „release-reif" werden und erst gebündelt (2–4 je Release; Auslöser 3 reif, Session-Ende oder
  Meilenstein-Merge; Hotfix einzeln) in einen Kandidaten integriert, in einem Browser-Lauf mit eigenem
  Screenshot-Abschnitt je UI-Task geprüft, mit einem Gate Merge veröffentlicht und vom Nutzer einmal getestet
  werden, und das nächste Häppchen nach Review-OK statt nach dem Merge startet, dann sinken die Fixkosten je
  Häppchen und der Leerlauf der Umsetzungskette, ohne dass ein UI-Task ungeprüft live geht (R207 (2); Prozess-Retro
  2026-10-04 B2).
- Messgrösse: (1) Integrator-Instanzen, Gate-Merge-Rulings und Pushes auf main mit Spieländerung je Häppchen
  jeweils ≤ 0,4 (Ausgang 9 Häppchen H-R3…H-R9, H-A1, H-S1: je 1,0). (2) Leerlauf Umsetzungsstrang zwischen
  aufeinanderfolgenden Häppchen Median ≤ 2 min (Ausgang 7,5 min; 7/6/8/18 min). (3) Releases mit Spieländerung je
  Session ≤ 2 (Ausgang 2026-10-03: 13 Merges auf main an einem Tag, 8 davon Häppchen). Gegenproben: 100 % der
  UI-Tasks mit eigenem Screenshot-Abschnitt im Release-Lauf, 0 Merges ohne grünes `make check`; Fix-Commits
  auf main für Fehler aus einem Release vor dem nächsten Release ≤ 1 je Release (Ausgang beim ersten Release
  erheben); Cache-Write 5 min ≤ 26,8 %. Abbruch: ein UI-Task geht ohne Screenshots live oder ein Release wird
  per Revert zurückgenommen.
- Zeitraum: die nächsten 3 Releases, mindestens 8 Häppchen (M9-Rest, Nebenstränge zu M12).
- Rückfall: Merge je Häppchen mit eigenem Gate (Handbuch 1.15, Umsetzungszyklus „Ablauf eines Auftrags (Stufe
  leicht)" Schritt 6–7 und Absatz „Merge"; `git show HEAD:docs/studio/STUDIO.md`).
- Dateien: `docs/studio/STUDIO.md` (Umsetzungszyklus), `docs/studio/gates.md` (Gate Merge Release),
  `.claude/agents/production-integrator.md`, `.claude/agents/qa-playtester.md`,
  `docs/studio/templates/playtest-report.md`, `docs/studio/CHANGELOG.md`
- Ruling: –
- Start: –
- Bewertung: –
```

### V2 · Discovery-Strang mit Ideen-Pool (Experiment E-027, Persona-Entwurf unten)

**Form:** keine neue L1-Abteilung. `lead-design` wird Eigentümerin des Discovery-Strangs („Kreativabteilung" =
Design-Bereich); dazu ein L2-Ideenlieferant `design-idea-scout`, der die Rolle `design-genre-researcher` (auf
Abruf, ohne Datei) ersetzt statt sie zu ergänzen. Andere Leads liefern kein Zusatzformular; der Scout erntet ihre
Playtest-Berichte und Beobachtungen.

- **Takt (Dual-Track):** eine **Ideen-Runde** nach jedem Gate Merge eines Releases oder Meilensteins, spätestens
  in jeder zweiten Session; höchstens eine Runde je Session. Sie läuft parallel zur Lieferung und nie auf dem
  kritischen Pfad.
- **Ablauf einer Runde (Paket-ID `IDEEN-nn`):** (1) `design-idea-scout` liest die neuen Einträge in
  `docs/beobachtungen.md`, die Berichte der letzten Browser-Läufe (höchstens 3 Screenshots), offene
  Nutzer-Punkte und Genre-Mechaniken (nur Mechaniken, ADR-006) und trägt **höchstens 5** neue Ideen in den Pool
  ein. (2) `lead-design` bewertet sie mit dem Raster und pitcht **höchstens 2** im Bericht an L0, je mit
  Empfehlung. (3) L0 entscheidet mit **einem** Ruling je Runde: einplanen, parken oder verwerfen. Eine Idee, die
  eine Kernsäule, das Genre oder den Titel ändert, geht in die Warteschlange (§5.3).
- **Einfluss in die Lieferung:** Eine eingeplante S-Idee wird ein Häppchen im nächsten Release (V1); dort ist
  **ein Platz je Release** für eine Studio-Idee reserviert, Nutzerwünsche haben Vorrang auf den übrigen. M- und
  L-Ideen werden Bausteine für das nächste Meilenstein-Brainstorming. Die Release-Notiz markiert sie mit „vom
  Studio vorgeschlagen"; ein Einwand des Nutzers wird zum Ruling „verwerfen".
- **Ideen-Pool:** `docs/ideen.md` (Produktdokument neben `beobachtungen.md`, nicht unter `docs/studio/`),
  höchstens rund 30 offene Ideen; verworfene bleiben einzeilig stehen. Format je Idee:

  ```markdown
  ### I-001 · neu · <Kurzname>

  - Bereich: Inhalt | Grafik | Ton | Bedienung | Technik · Säule: <Säule> · Quelle: <Pfad, Playtest, Nutzer, Genre-Mechanik>
  - Spielerwirkung: „Der Spieler …" (ein Satz)
  - Grösse: S | M | L · Risiko: <Save, Baseline, Perf, Lizenz oder keins>
  - Raster: Spass x · Passung x · Aufwand x · Risiko x = Summe
  - Entscheid: <Ruling> → eingeplant <H-/M-ID> | geparkt bis <Anlass> | verworfen (<Grund>)
  ```

  Status: neu → bewertet → gepitcht → eingeplant | geparkt | verworfen → live.

- **Bewertungsraster** (je 1–3 Punkte; Summe = 2 × Spielspass + Passung + Aufwand + Risiko, höchstens 15; Pitch ab 11):

  | Kriterium                 | 3                                                                          | 2                            | 1                                                                          |
  | ------------------------- | -------------------------------------------------------------------------- | ---------------------------- | -------------------------------------------------------------------------- |
  | Spielspass (×2)           | neue echte Entscheidung oder sichtbares Erlebnis in der ersten Spielstunde | spürbar für Fortgeschrittene | Kosmetik ohne Entscheidung                                                 |
  | Säulen-Passung            | stärkt eine Säule direkt                                                   | stärkt eine Säule indirekt   | keine; **schwächt eine Säule = K.O.** (Warteschlange, falls Säulenwechsel) |
  | Aufwand (`richtwerte.md`) | S: ≤ 1 Häppchen                                                            | M: 2–4 Pakete                | L: Meilenstein                                                             |
  | Risiko                    | berührt weder Save, Baseline, Perf noch Lizenz                             | berührt eines davon          | berührt mehrere                                                            |

- **Budget (Schätzung, gemessen über `IDEEN-nn`):** je Runde höchstens 2 Starts (Scout `sonnet`, Bewertung
  `lead-design`) und 80 Tool-Aufrufe; das entspricht etwa einem kleinen Häppchen (H-S1: 66 Tools). Kreativarbeit
  höchstens 10 % der Tool-Aufrufe einer Session.
- **Aufwand:** klein bis mittel; neue Persona (lead-production), eine neue Datei, 3 Zeilen Handbuch.
- **§9-Prüfung:** Die Ideen-Runde erzeugt keinen Code und kein Asset. Eingeplante Ideen durchlaufen den normalen
  Zyklus mit Review je Task, `make check`, Browser-Check je UI-Task, Lizenzprüfung und Final-Review; nichts davon
  wird verkürzt. §5.3 bleibt gewahrt (Säulen-K.O. → Warteschlange).

```markdown
## E-027 · vorgeschlagen · Discovery-Strang mit Ideen-Pool

- Hypothese: Wenn `lead-design` nach jedem Release- oder Meilenstein-Merge (spätestens jede zweite Session) eine
  Ideen-Runde verantwortet, in der `design-idea-scout` höchstens 5 Ideen in `docs/ideen.md` einträgt,
  `lead-design` sie mit dem Raster (Spielspass ×2, Säulen-Passung, Aufwand, Risiko) bewertet und höchstens 2 an
  L0 pitcht, L0 je Runde ein Ruling fällt und jedes Release einen Platz für eine Studio-Idee reserviert, dann
  entwickelt sich das Spiel auch ohne Nutzer-Input weiter, zu begrenzten Kosten (R207 (1); Prozess-Retro
  2026-10-04 B1).
- Messgrösse: Anteil der im Zeitraum eingeplanten Bausteine (Häppchen und Meilenstein-Bausteine) mit
  Studio-Ursprung (Verweis auf `I-nnn` im Ruling) ≥ 25 % und ≥ 2 Studio-Ideen live (Ausgang: 0 von 20
  Programmpunkten, 0 Häppchen). Gegenproben: je Runde ≤ 2 Starts und ≤ 80 Tool-Aufrufe (Paket-ID `IDEEN-nn`);
  von live gegangenen Studio-Ideen höchstens 1 von 3 per Nutzer-Einwand verworfen oder zurückgenommen.
- Zeitraum: 3 Ideen-Runden (voraussichtlich M12 und die Releases daneben).
- Rückfall: keine Ideen-Runden; `docs/ideen.md` bleibt als Archiv; `design-idea-scout` zurück nach „Auf Abruf"
  als `design-genre-researcher`; `lead-design` 1.5 (`git show HEAD:.claude/agents/lead-design.md`).
- Dateien: `docs/studio/STUDIO.md` (Umsetzungszyklus, Discovery-Strang), `.claude/agents/lead-design.md`,
  `.claude/agents/design-idea-scout.md` (neu), `docs/studio/roster.md`, `tools/studio/tests/test_model.py`
  (`PERSONA_NAMES`), `docs/ideen.md` (neu), `docs/studio/CHANGELOG.md`
- Ruling: –
- Start: –
- Bewertung: –
```

### V3 · Bildziel vor Code bei Optik-Häppchen (lernen.md, kein Experiment)

- Beobachtung/Deutung: B2 (a), 85,5 % der Häppchen-Umsetzungsminuten in drei Optik-Häppchen mit 3–5 Runden.
- Vorschlag: eine Zeile in `lernen.md` (Kuratierung `studio-coach`, kein Handbuch-Eingriff, braucht keinen
  Experiment-Platz): „Optik-Häppchen: Die Kurz-Spec nennt vor dem ersten Engineer-Start ein Bildziel
  (Referenz aus vorhandenem Screenshot plus höchstens 3 prüfbare Bild-Kriterien) und prüft ihre Prämissen gegen
  die Sim-Regeln (z. B. `isLand`, `checkGround`)."
- Erwartete Einsparung (Schätzung): eine Fix-Runde je Optik-Häppchen, bei H-R7…H-R9 grob 20–40 min und 50–100
  Tools je Häppchen.
- Messgrösse mit Schwelle: Review-Runden je Optik-Häppchen im Mittel ≤ 2 über die nächsten 4 (Ausgang 3,7 aus 3,
  5, 3). Rückfall: Zeile streichen. Aufwand: klein.
- §9-Prüfung: keine Prüfung entfällt; die Regel liegt vor dem Code.

### V4 · Experiment-Plätze freimachen

- **E-015 abschliessen, behalten** (sofort oder mit dem 8. Gate Merge): 7 von 8 Gate Merges ohne Beanstandung,
  Schwelle 0 erfüllt. Abschluss vor E-028 ist nötig: E-028 senkt die Zahl der Gate Merges und würde die
  Messgrundlage von E-015 verdünnen (§10.5 Messbarkeit). Hinweis für die Bewertung: R206 nennt die Nachweise
  nicht, die Regel misst nur Beanstandungen.
- **E-017 abschliessen** (Zeitraum M11 abgelaufen): Schwelle verfehlt (ein niedriger Doku-Nachtrag statt
  fehlender Doku). Empfehlung: behalten, weil die Zeile billig ist und sich die Fehlerklasse von „fehlt" zu
  „Nachtrag niedrig" verschoben hat; ein weiterer Messzeitraum blockiert einen Platz ohne neuen Erkenntnisgewinn.
- **E-022 weiterlaufen lassen:** Der Zeitraum M12 hat noch nicht begonnen, und E-028 bündelt Merges; die
  `union`-Regel schützt genau die Kandidaten-Merges.
- **Reihenfolge der freien Plätze:** E-028 zuerst (Nutzerauftrag, senkt Gates und Live-Stände), dann E-027. Die
  Warteschlange (E-025, E-023, E-026, E-019, E-024, E-018, E-020, E-012, E-006) rückt dadurch nach hinten; das
  ist ein Entscheid von L0 und gehört ins Ruling.

## Persona-Entwurf `design-idea-scout` (für lead-production, nicht angelegt)

Frontmatter:

- `name: design-idea-scout`
- `description:` Ideen-Scout des Studios. Sammelt je Ideen-Runde höchstens 5 Funktionsideen (Inhalt, Grafik, Ton,
  Bedienung) aus Playtests, Beobachtungen und Genre-Mechaniken und trägt sie in `docs/ideen.md` ein. Schreibt
  keinen Code, keine Specs, entscheidet nichts.
- `tools: Read, Grep, Glob, Edit, Write, Bash` (Bash nur für `log.py`; kein `Agent`-Tool, Arbeiter; Websuche
  nur, wenn L0 sie im Briefing freigibt)
- `model: sonnet` · `version: 1.0`
- `studio-name: Kreativ-Kai` · `studio-title: Ideen-Scout` · `studio-emoji:` Keimling (U+1F331; die Glühbirne
  trägt schon `lead-design`)
- Ebene L2, Bereich `design`, Lead `lead-design`; ersetzt die Zeile `design-genre-researcher` unter „Auf Abruf".

**Persona und Expertise.** Spieleentwickler mit Gespür für Aufbauspiele (Anno-Reihe, Siedler, Banished) und
Erfahrung in Discovery: Ideen aus Spielerbeobachtung ableiten, nicht aus dem Nichts erfinden. Denkt vom
Spielermoment aus: „Was sieht, entscheidet oder fühlt der Spieler danach anders?"

Prüffragen:

1. Welchen Spielermoment erzeugt die Idee, in welcher Spielphase?
2. Welche Säule stärkt sie, schwächt sie eine?
3. Aus welcher Quelle stammt sie (Pfad, Playtest, Beobachtung, Genre-Mechanik)?
4. Gibt es eine kleinere Fassung, die in ein Häppchen passt?
5. Steht sie schon im Pool, im Programm oder in `beobachtungen.md`?

**Verantwortung und Grenzen.** Ändert nur `docs/ideen.md` (neue Einträge mit Status `neu`). Bewertet nicht
abschliessend (das macht `lead-design`), plant nicht ein (L0), übernimmt nie Inhalte, Namen oder Marken anderer
Spiele (ADR-006), schlägt keine Richtungswechsel vor (Titel, Genre, Kernsäulen, §5.3) ausser als ausdrücklich
markierte Frage. Liest höchstens 3 Screenshots je Runde.

**Arbeitsweise.** (1) Pool und neue Einträge in `beobachtungen.md` seit der letzten Runde lesen. (2) Berichte der
letzten Browser-Läufe und offene Nutzer-Punkte lesen. (3) Höchstens 5 Ideen über mindestens 2 Bereiche
formulieren, je im Pool-Format mit Selbstbewertung nach Raster. (4) Doppelte verwerfen. (5) Bericht an
`lead-design`.

**Qualitätsmassstab.** Jede Idee hat Quelle, Spielerwirkung in einem Satz und Grösse; mindestens eine Idee ist S.
Höchstens 40 Tool-Aufrufe je Runde.

**Bericht und Logging.** Bericht ≤ 10 Zeilen (Ideen-IDs, je ein Satz, Empfehlung für den Pitch). Logging wie alle
Arbeiter mit `--role design-idea-scout --package IDEEN-nn`.

## Bewertung laufender Experimente

- E-015: 7/8 Pakete, 0 Beanstandungen (Schwelle 0) → Empfehlung behalten und abschliessen (V4).
- E-017: Zeitraum M11 vorbei, Schwelle verfehlt (1 niedriger Doku-Nachtrag) → Empfehlung abschliessen, behalten (V4).
- E-022: Zeitraum M12 nicht begonnen; Zwischenstand 0 Konflikte seit R201 → weiter beobachten.

## Änderungen an lernen.md

- Vorschlag neu (V3, Umsetzung `studio-coach` nach Ruling): Bildziel und Prämissen-Check vor Optik-Häppchen.
