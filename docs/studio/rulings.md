# Rulings

Dauerhafter Ledger aller Studio-Entscheide (R3). Der superpowers-Ledger unter `.superpowers/sdd/`
ist gitignored und wird nach jedem Plan gelöscht; was dort entschieden wurde, überträgt der
Tech-Lead beim Abschluss hierher.

**Format** (Vorlage [templates/ruling.md](templates/ruling.md)):

```text
Ruling: <Entscheid in 1–3 Sätzen> — <warum> — <Kosten bei Irrtum> — <Pfad zu Bericht, Plan oder Retro>
```

Richtwert **≤ 60 Wörter**; Listen aus Gate-Berichten, Planpflege, Messwerte und Zeitabläufe stehen
im verwiesenen Dokument, nicht im Ruling. Abnahmen ohne Alternative nur per `log.py result`, kein
Ruling (R129). Darunter Datum, Entscheider, Anlass und ggf. ADR-Link. Neueste Einträge **unten**.
Einträge werden nicht gelöscht; ein überholter Entscheid bekommt ein neues Ruling, das ihn ablöst
(„löst R… ab").

---

R1–R99 stehen wörtlich in [rulings-archiv.md](rulings-archiv.md) (R129).

## R100 · 2026-10-01 · M7 Gate Merge R0-ISO

Ruling: **Gate Merge Zwischen-Merge R0-ISO bestanden** für `feat/m7-render` @ `7039ddd`
(opus-Review über `aa1d058..7039ddd` OK ohne blockende/hohe Befunde; QA-R0 OK, AK-ISO-20 6/6,
Konsole fehlerfrei; `make check` am SHA grün, 298 Tests; `git merge-tree` konfliktfrei; Diff
`src/sim` leer; L0 hat die QA-Bilder gesichtet). production-integrator mergt `--no-ff 7039ddd`
nach main und pusht (R96). Danach setzt lead-production ADR-012 auf „akzeptiert" und ergänzt dort
die Konsequenz „alle vier Kamera-Tests und `ship.test.ts` geändert" (Befund lead-art). Hingenommen:
In Task 1 und A1 fehlte der Schritt „Tests zuerst rot"; die Reviewer haben die Tests per
eingebautem Fehler geprüft — Hinweis an studio-coach für die Session-Retro. arc42/CLAUDE.md
(Draufsicht) folgen mit D1 (R96). — Warum: alle Bedingungen aus R96 Punkt 2 erfüllt. — Kosten bei
Irrtum: Pages zeigt bis R2 Platzhalter-Blöcke statt der bisherigen Sprites; Revert des
Merge-Commits jederzeit möglich.

Entscheider: L0 · Anlass: Bericht lead-art Welle 1

## R101 · 2026-10-01 · M6-Sim Baseline Krisenlauf

Ruling: lead-design-Urteil **PLAUSIBEL** zur Feuerwache des Test-Controllers (`[kx+10, ky-8]`,
Regel „max. Produktionsabdeckung Radius 8", Messung Seed 3: off 6050, normal 7050, mild 6250).
Baseline angenommen. Auflagen für B2 vor dem Review: (E1) Kommentar in `tests/sim/controller.ts`
begründet den Gleichstand mit der Bau-Reihenfolge (Norden zuerst) statt „kleinstes y" und nennt die
Abhängigkeit: mit dem Spiegelplatz `[kx+10, ky+8]` läge der Sieg vermutlich > 8000 — kein
Probelauf verlangt; (E2) Spec M6 §15 nachführen (Wachenposition, Abdeckung „Kapelle, Produktion
Nord; Schule und Holzfäller ungedeckt") als `docs:`-Commit im Branch `feat/m6-balance`; (E3)
Beobachtung „Krisenlauf `mild` knapp (minMoney 13, Endgeld 40)" trägt L0 auf main ein. — Warum:
Bot-Verhalten ist spielerplausibel und eher benachteiligt; die Spiegelplatz-Abhängigkeit ist
dokumentiert statt versteckt. — Kosten bei Irrtum: Balancing-Grenze wird bei der nächsten
Werteänderung früher sichtbar (gewollt).

Entscheider: L0 · Anlass: Kurz-Urteil lead-design M6-B2

## R102 · 2026-10-01 · M6-Sim Gate Merge

Ruling: Final-Review M6-Sim BEDENKEN (kein Blocker). **Gate Merge bestanden unter Auflage**: vor
dem Merge ein Fix-Durchgang lead-tech auf `feat/m6-balance` mit (1) `docs/arc42.md` §5/§6/§8 um
Krisen (`crises.ts`, `defs/crises.ts`, Krisenschritt im Tick, Zustand `burning`) nachführen, (2)
README: Feuerwache in Bauleiste und Anleitung, mit Satz „wirkt nur bei eingeschalteten Krisen",
(3) `balance-crises.test.ts`: Grenze Sieg ≤ 8000 für normal und mild festnageln, (4) Kommentar
`controller.ts:44-55` nach R101 E1 korrigieren. Kurze Nachprüfung durch lead-qa (Fortsetzung),
dann Merge seriell `feat/m6-sim` → `feat/m6-sim-queries` → `feat/m6-balance` durch
production-integrator mit Push. Befunde 5, 6 und die zwei ausserhalb des Scopes trägt L0 als
Beobachtung ein; Tooltip-Zeile „ohne Wirkung, solange Krisen aus sind" geht als Hinweis an den
UI-Strang (M6-U1). Die Feuerwache wird nicht ausgeblendet (Spec 1, R82a). — Warum: Doku auf main
muss den Tick-Ablauf richtig beschreiben, bevor M8 darauf aufbaut; (3)/(4) sind Minuten-Fixes im
selben Themenbereich. — Kosten bei Irrtum: ein Fix-Durchgang mehr.

Entscheider: L0 · Anlass: Final-Review lead-qa M6-Sim

## R103 · 2026-10-01 · M6-Sim Gate Merge

Ruling: **Gate Merge M6-Sim vollzogen** (Auflage R102 erfüllt, Nachprüfung lead-qa OK): seriell
`--no-ff` `feat/m6-sim` @ a324c7b → b0d53b4, `feat/m6-sim-queries` @ a7e9e18 → b86e668,
`feat/m6-balance` @ bb5e4a7 → 5e0135f; Übergabe `.studio/handoffs/m6-sim-gate-merge.md`.
**Plan-Rulings des Strangs übernommen:** (1) Ausnahme B: genau eine Zeile
`put(w, 'firestation', kx + 13, ky + 1)` in `tests/sim/scenarios.ts` (S2). (2) M6-Tests in eigenen
`describe('M6 …')`-Blöcken, Testname beginnt mit AK-/RF-Nummer (42 AK-Nummern abgedeckt). (3)
v2-Fixture `tests/sim/fixtures/save-v2.json` auf main 3fcb678 über einen temporären, wieder
gelöschten Test erzeugt (Task 1a). (4) Befunde ausserhalb Scope gesammelt im Bericht statt im
Branch (R87 5). (5) Vor der Umsetzung grün erlaubt zusätzlich AK-S1-09 Fall `off`, AK-S1-10
Invariante, AK-S2-05 (R99 4). (6) Merges zwischen Strängen `--no-ff` auf geprüfte SHAs (R96 4).
(7) B2-Abweichungen (Review OK): AK-B2-04 prüft Geld als `money + stats.upkeep`; `runColony` setzt
die Gebäudezählung vor dem Zählen zurück. **Balancing (AK-B2-03, Spec 15):** Krisen-Lauf-Baseline
Seed 3: **normal 7050** (minMoney 56, Endgeld 211; Brände 4, davon gelöscht 3, leer 0; Stürme 3;
Booms 1; Trefferquote h 1,0; Feuerwache des Test-Controllers auf `[kx + 10, ky − 8]` nach
R99/R101), **mild 6250** (minMoney 13, Endgeld 40; Brände 1, gelöscht 0, leer 0; Stürme 2; Booms
1; h 1,0; keine Wache). Die `off`-Baseline 6050 (Fingerabdruck 0xbfeac8c6) und die Grenzen 9000
(Test) bzw. 8000 (Stopp-Schwelle, seit R102 im Test festgenagelt) bleiben. Mit dem Spiegelplatz
`[kx + 10, ky + 8]` läge normal vermutlich über 8000 (nicht gemessen). Messweg:
`VITE_BALANCE_LOG=1 npx vitest run tests/sim/balance-crises.test.ts --silent=false --reporter=verbose`.
Frei werden damit (R87 3): M7-R2-FW, M6-R2, M6-U1, M8-Sim. — Warum: geprüfter Stand, Auflagen
erfüllt; die Baseline macht Krisen-Balancing zum Regressionsschutz. — Kosten bei Irrtum:
seed-abhängige Krisen treffen die Kippkante `minMoney` 57 (mild knapp, R101 E3); bei Irrtum
Neumessung.

Entscheider: L0 · Anlass: Gate Merge M6-Sim

## R104 · 2026-10-01 · M7 Slice-Urteil

Ruling: **Slice-Urteil M7: OK** (QA-SLICE `test/m7-slice` @ 179dd65 = main + R1b `f77b83c` + U0-ISO
`83f8333`; AK-ISO-17 OK, R1c nicht nötig). Messauslegungen angenommen: D-M7-I1 nach Ersatzmass
(Konflikt mit ¼-Regel AK-R1-02); D-M7-FOAM Schaumkern 0,85–1 / 0,07 Kachel; I5-Ecke ohne
Kronenpixel. Bilder an den Nutzer gesendet; nach R93/R96 prüft die nächste Session zuerst eine
Nutzerreaktion, dann R2 ∥ R3, M7-U2 Teil B, M6-R2, M6-U1. — Warum: alle Muss-AK bestanden,
Abweichungen sind Wortlaut-Konflikte der Spec. — Kosten bei Irrtum: Nacharbeit in R2.

Entscheider: L0 · Anlass: Bericht lead-art Welle 1b/1c

## R105 · 2026-10-01 · M7 Zwischen-Merge Slice, Session-Ende

Ruling: Auslegung „mach weiter, setze um was thematisch noch Sinn macht, aber komm bald zu einem
Ende" als: **zweiter Zwischen-Merge des abgenommenen Slice nach main** (Render `feat/m7-render` @
`f77b83c` mit R1a/R1b, UI `feat/ui-m6m7` @ `83f8333` mit M7-U2 Teil A und U0-ISO), mit Push, damit
der isometrische Stand auf Pages spielbar ist; danach Session-Ende-Routine. **Nicht** in dieser
Session: Welle 2 (R2 ∥ R3 usw.), Audio/FX/Assets-Merge (A1/A2/R5/X1a bleiben in ihren Branches,
weil erst M7-U1 sie anbindet). Gate Merge: Basis sind die Task-Reviews (opus) R1a/R1b/U0-ISO/M7-U2A,
QA-U0 OK und QA-SLICE OK (R104) im Baum main + beide SHAs, `make check` grün; production-integrator
prüft `git merge-tree` und `make check` je Schritt gegen das aktuelle main (inkl. M6-Sim). Das
Final-Review des Meilensteins bleibt nach R98 bestehen. — Zweck der Anweisung: sichtbarer Abschluss
des Isometrie-Auftrags ohne neue lange Arbeit; Auslegung widerspricht ihm nicht, weil nur
Abgenommenes gemergt wird. — Kosten bei Irrtum: Pages zeigt bis R2 noch Platzhalter-Quader; Revert
der Merge-Commits jederzeit möglich.

Entscheider: L0 · Anlass: Nutzeranweisung

## R106 · 2026-10-01 · Studio, Retro Session 5e248230

Ruling: Vorschläge studio-coach angenommen: (1) **E-004 „Rechenweg im Budget-Ruling"** angenommen,
Start sobald ein Experiment-Platz frei wird (frühestens nach Bewertung E-001 in der M7-Retro).
(2) **Prüfauftrag Integrator**: Die nächsten 3 Merge-Briefings verlangen von lead-production
ausdrücklich `run_in_background: false` für production-integrator und die Meldung, wo der Bericht
ankam; landet er trotzdem bei L0, Eintrag in `docs/beobachtungen.md` (Harness), keine Regeländerung.
(3) Vor R2 übernimmt lead-art die Messauslegungen aus R104 (I1, FOAM, I5) in den Spec-Text
(`docs:`-Commit), damit Reviews nicht kreisen. Der Plan-Ausnahme-Nachtrag für
`tests/sim/scenario-saves.test.ts` (Render-Strang, Hinweis lead-production) geht in denselben
Commit und wird im Final-Review M7 geprüft. — Warum: zwei Muster (Rundungsfehler, Integrator im
Hintergrund) und eine Ursache für Review-Runden sind belegt. — Kosten bei Irrtum: je eine Zeile im
Briefing.

Entscheider: L0 · Anlass: Kurz-Retro Session 5e248230

## R107 · 2026-10-01 · M7/M8, verlorene lokale Branches, Push-Pflicht

Ruling: (1) Der Session-Container ist neu; `origin` kennt nur `main`. Verloren sind die nie gepushten
Branches `feat/m7-audio` @ ad4a2ee (A1, A2), `feat/m7-fx` @ 4489bdd (R5), `feat/m7-assets` @ 9ce9025 (X1a),
`docs/m8-spec` @ 2a46996 (M8-Spec) sowie alle Worktrees und `.studio/qa/M7-SLICE/`. A1, A2, R5 und X1a
werden nach Plan neu umgesetzt (Plan und Spec stehen auf `main`, nur der Code fehlt); die M8-Spec wird
nach M7 neu geschrieben. (2) **Push-Pflicht:** Jeder Controller pusht seinen Strang-Branch nach jedem
abgenommenen Commit (`git push -u origin <branch>`); ein Branch, der nur lokal liegt, gilt als nicht
vorhanden. Feature-Branches auf `origin` sind reversibel (kein Verstoss gegen §6). (3) Auftrag des Nutzers
„mach weiter, Thema abschliessen“ = M7 „Stimmung“ fertigstellen; sein Weitermachen ohne Einwand gilt als
Reaktion auf die Slice-Bilder (R93/R96 erfüllt). (4) Reihenfolge: R106 Punkt 3, dann Welle 2 mit
Nachholpaketen: Render R2 ∥ FX R5→R3 ∥ Audio A1→A2→A3 ∥ Assets X1a (lead-art); UI M7-U2 Teil B ∥ M6-U1
(lead-tech). — Warum: ephemere Container; Plan und Spec sind vollständig, Neuumsetzung ist mechanisch. —
Kosten bei Irrtum: Doppelarbeit von etwa 4 Paketen, bereits eingetreten.

Entscheider: L0 · Anlass: Session-Start, Container ohne alte Branches

## R108 · 2026-10-01 · Studio, Leads ohne Agent-Werkzeug (Cloud-Session)

Ruling: In Cloud-Sessions haben als Subagent gestartete Leads kein Agent-Werkzeug (Befund lead-tech,
Welle 2 UI). Bis das behoben ist, startet L0 die Arbeiter (Implementierer, qa-code-reviewer,
qa-playtester) direkt mit dem Briefing nach Plan; Leads werden nur für Arbeit ohne Delegation eingesetzt
(Specs, Pläne, Urteile, Merges nach Gate). Budget bleibt den Leads zugeordnet und wird von L0 je Start
mitgezählt. — Warum: Harness-Grenze, nicht änderbar aus dem Repo. — Kosten bei Irrtum: L0 trägt mehr
Steuerlast; inhaltliche Arbeit bleibt bei den Arbeitern.

Entscheider: L0 · Anlass: Bericht lead-tech (blockiert)

## R109 · 2026-10-01 · M7-X1a blockiert (Netzwerk-Policy)

Ruling: X1a pausiert. Die Netzwerk-Policy sperrt freesound.org, opengameart.org, fonts.google.com und
archive.org; die Lizenz-Handoffs unter `.studio/handoffs/` lagen nur im alten Container (R107).
Nutzerentscheid N-90 in der Warteschlange. Bis dahin: A1–A3 laufen mit den prozeduralen Rückfällen
der Spec, Schrift mit Fallback-Kette; bei Freigabe neu: Lizenzprüfung (art-license-checker), dann X1a. —
Warum: keine Umgehung der Policy, keine erfundenen Quellen (ADR-006). — Kosten bei Irrtum: M7 ohne
Musik-Assets, nachrüstbar.

Entscheider: L0 · Anlass: Bericht art-audio-engineer X1a

## R110 · 2026-10-01 · M6-U1 abgenommen mit Nachprüfung

Ruling: M6-U1 @ 0d52030 ist abgenommen (Review OK, QA-M6U1 BEDENKEN ohne blockende Befunde). Die
Krisenkarten-Teile von M6-AK-U1-02 und -03 („Krisen: mild · nächste Krise in …", „Krisen: aus") prüft
QA-M6U2 nach. Auslegung AK-U1-03: Die HUD-Auswahl zeigt die Stufe für das nächste Spiel; der geladene
Stand behält seine eigene Stufe (belegt durch erneutes Speichern) — spec-konform. — Warum: Die
fehlenden Teile hängen an M6-U2, nicht an M6-U1. — Kosten bei Irrtum: eine Fix-Runde in M6-U2.

Entscheider: L0 · Anlass: QA-M6U1

## R111 · 2026-10-01 · R3 abgenommen, Feinschliff Stimmung

Ruling: R3 @ 82f52af ist abgenommen (Review OK nach Fix-Runde, QA-R3 BEDENKEN ohne blockende Befunde,
AK-R3-03 erfüllt, Render p95 ≤ 2,4 ms). Die Sichtbarkeitsbefunde B1 (Rauch zu blass, Glut kaum sichtbar)
und B2 (Sturmwellen im Bild kaum als höher erkennbar) gehen als Feinschliff-Commit in den Render-Strang
nach M6-R2, vor R4 (Spec-Werte bleiben Untergrenze; nur Darstellungskonstanten). Die Dev-Vorschau
erhält eine Liste `feuer=<id>,<id>` für den Mehrfeuer-Test (UI-Strang, mit M6-U3). QA-Checks nutzen
ab jetzt je einen eigenen Unterordner im Scratchpad (Kollision `lib.mjs`). — Warum: Die Stimmung ist
Kern des Nutzerauftrags (R73); kein Blocker, aber sichtbarer Qualitätsgewinn. — Kosten bei Irrtum:
eine Fix-Runde.

Entscheider: L0 · Anlass: QA-R3

## R112 · 2026-10-01 · M6-U2 Ereignis-Log ausserhalb des HUD

Ruling: Das Ereignis-Log sitzt nicht im HUD, sondern als eigene, schwebende Pergament-Box am unteren
linken Rand der Spielfläche (über der Karte, unter keinem Panel). Eingeklappt (Standard, sobald mehr als
1 Eintrag) zeigt sie nur den neuesten Eintrag in einer Zeile; aufgeklappt höchstens 220 px mit internem
Scrollen. Das HUD behält seine Höhe ohne Log. Fix-Runde M6-U2 dazu: Boom-Marke nur am Boom-Gut
(`hidden` darf nicht von `.badge--boom` überstimmt werden), Fokus-Rückgabe auch beim Klick auf den
Hintergrund (Schliessen auf `click` bzw. Fokus nach dem Pointer-Ablauf setzen), Laden-Button verliert
den Fokusring nach dem Laden. `style.css` darf dafür geändert werden (UI-Strang besitzt sie, M7-U2). —
Warum: Desktop-first mit 1280×800 (R78) verlangt Platz für die Insel; das Log ist Nebeninformation.
— Kosten bei Irrtum: eine Layout-Runde.

Entscheider: L0 · Anlass: QA-M6U2

## R113 · 2026-10-01 · Picking: Silhouette vor Hülle (AK-ISO-15)

Ruling: QA-R2 zeigt, dass die Auswahl über die Körperhülle bei hohen Gebäuden (Kapelle mit Turm) leere
Hüllenfläche und sichtbare Teile dahinterstehender Häuser abfängt. AK-ISO-15 („Hover über die sichtbare
Fläche des verdeckten Gebäudes zeigt seinen Umriss") gilt unverändert; die Spec wird nicht aufgeweicht.
Auswahl und Abriss prüfen künftig in Tiefenreihenfolge (vorn zuerst) die tatsächlich gezeichneten
Silhouetten-Polygone des Körpers; die Hülle bleibt nur Vorfilter. Bauen und Wege nutzen weiter die
Bodenkachel (ADR-012 Punkt 6 bleibt im Ergebnis gleich, „exakte Körperhülle" wird als „gezeichneter
Körper" ausgelegt). Der Test `verdeckung.test.ts` prüft `hoverH2` und je eine Wand-/Dachstelle von F und
H mit der echten Auswahlfunktion. Umsetzung im Render-Strang direkt nach R4 als eigener Commit; R2
(f7dd70d) gilt bis dahin als abgenommen mit dieser Auflage. — Warum: Lesbarkeit hinter hohen Gebäuden
ist ein Kernversprechen der Isometrie (ISO §1). — Kosten bei Irrtum: ein Paket Render-Arbeit.

Entscheider: L0 · Anlass: QA-R2

## R114 · 2026-10-01 · R4: Laternen nach Spec, Schein-Pfade, Möwen stabil

Ruling: (1) Laternen folgen Spec 6.1/6.2: Stärke `k = windows`, also aus am Tag und bei `dayNight=false`;
„leuchten immer" heisst nur „unabhängig von `isLit`". Der R3-Test „ohne Feuer kein additiver Durchgang"
kehrt in der Originalform (Tick 0) zurück. (2) Der Schein je Gruppe aus Rechteck plus drei Ringpfaden
(höchstens 8 Füllungen, ein `lighter`-Block) wird als Auslegung von Spec 6.2 „ein Pfad" angenommen
(konstante Zahl, weicher Schein); Spec-Notiz im Doku-Pass. (3) Möwen werden je festem Zellraster gewählt
(kleinster Schlüssel je Zelle), damit sie beim Scrollen nicht springen oder verschwinden. (4) Kleinbefunde
B4 (Testliste je Aufruf frisch) und Importreihenfolge in life.ts mit erledigen. (5) `layoutKey`
(src/sim/queries.ts:160) kann kollidieren (Summe der Wegindizes) → eigenes Fix-Paket im Sim-Strang auf
einem Branch von main, testgetrieben, mit Merge im Final-Gate. — Warum: Spec-Treue bei Licht und Leistung
(AK-R4-06); ruhiges Bild ist Teil der Stimmung; veralteter Cache wäre ein echter Fehler. — Kosten bei
Irrtum: eine Fix-Runde.

Entscheider: L0 · Anlass: Review M7-R4

## R115 · 2026-10-01 · HUD-Bilanz bei Brand nach Spec

Ruling: Die HUD-Warenbilanz zeigt bei einem brennenden Betrieb weiter die Dauerleistung (M6-Spec 11);
L0 hatte im Briefing der UI-Nachzüge versehentlich das Gegenteil verlangt. `runningBalance` (hud.ts,
d38b9af) wird zurückgenommen. Das Info-Panel des brennenden Betriebs darf „Erzeugt X nicht — Betrieb
brennt" zeigen, weil das ein Zustand des einzelnen Gebäudes ist, keine Bilanz (Spec-Notiz im Doku-Pass).
— Warum: Die Spec-Setzung ist bewusst (Bilanz = Planungsgrösse, kurze Ausfälle verzerren sie nicht);
Spec-Treue vor L0-Eingebung (E-003 Zweck-Gegenprobe). — Kosten bei Irrtum: eine kleine Fix-Runde.

Entscheider: L0 · Anlass: Bericht tech-ui-engineer M6-U3

## R116 · 2026-10-01 · M6-U3 abgenommen, Frame-Grenze auf Echtgerät

Ruling: M6-U3 (93fecb3) mit UI-Nachzügen und R115-Fix @ 0933bcc ist abgenommen (Review OK, QA-M6U3
BEDENKEN). AK-U3-09 (≥ 30 fps, leistung-sturm, Zoom 0,5, 1920×1080) liefert in der Cloud-Umgebung mit
Software-Rendering 27,4 fps bei Render-Median 4 ms; eine leere 1920er-Canvas schafft 60 fps,
leistung-50 ohne Krise 47 fps. Die Grenze ist auf Software-Raster nicht bewertbar. Die harte Abnahme von
AK-U3-09 und AK-R4-06 erfolgt auf einem Echtgerät mit GPU nach dem Merge (Pages, `?perf=1`) — Bitte an den
Nutzer als nicht blockierender Warteschlangen-Eintrag. Fällt sie dort unter 30 fps, folgt ein
Leistungspaket (Sturm-Overlay: Regen/Tönung). Kleinbefunde QA-M6U3 (Panel brennender Betrieb
„Verbraucht …", Fokusring „+1" im Handel, Münze in der Einblendphase) gehen in die Beobachtungen.
QA-Bäume gehören exklusiv dem jeweiligen QA-Check: Reviewer nutzen eigene detached Worktrees (der Baum
ui-qa wurde während QA-M6U3 umgestellt). — Warum: Messung unter Software-Raster misst die Umgebung, nicht
das Spiel. — Kosten bei Irrtum: ein Leistungspaket nach dem Merge.

Entscheider: L0 · Anlass: QA-M6U3

## R117 · 2026-10-01 · Nachtrag R114: Scheinringe, D1 abgenommen

Ruling: (1) Der Fensterschein aus Rechteck plus 8 Ringen je Gruppe (seit 27995c9; bis 2 × 9 Füllungen plus
Feuerglühen) ist als Auslegung von Spec 6.2 bestätigt: konstante Zahl, genau ein `lighter`-Block; die
Grenze „höchstens 8 Füllungen" aus R114 Punkt 2 gilt als überholt. (2) D1 (8ec874b, 4c69776) ist
abgenommen; der Final-Review prüft die Doku mit. (3) Code-Reste aus der Streichung D3
(`EXTINGUISHED_TICKS`, `RenderFx.extinguished`, `DevPreview.extinguishedId`/`?geloescht=`), veraltete
Kommentare (renderer.ts „Laternen (immer)", eventLogView.ts „Standard offen") und die Testschwelle
`water.test.ts` (aus Konstanten ableiten) gehen in eine gemeinsame Fix-Runde mit den INT-Befunden. —
Warum: Plan „gestrichener Posten hinterlässt keinen Code"; Doku und Code sollen übereinstimmen. —
Kosten bei Irrtum: gering.

Entscheider: L0 · Anlass: Bericht D1

## R118 · 2026-10-01 · M7 Welle 2 und UX

(Ursprünglich als R107 geschrieben; Nummernkollision mit R107 der Cloud-Session, umnummeriert.)

Ruling: Nutzerreaktion auf die Slice-Bilder: „Gefällt mir" → Slice bestätigt (R93/R96 erfüllt),
Welle 2 frei. Auslegung „mach weiter mit den Gebäudegrafiken, Musik, ausserdem mach das UI besser,
es ist nicht intuitiv genug" als drei Stränge:
(1) **Gebäudegrafiken** = Render-Strang nach Plan: R106 Punkt 3 → R2 ∥ R3 → R2-FW → R4 (lead-art).
(2) **Musik** = hörbar im Spiel: A3 (Musik-Player) und M7-U1 (Audio-Anbindung, Einstellungen) →
X1b; danach Merge von Audio, FX und Assets (lead-art Audio/Assets, lead-tech UI).
(3) **Intuitivere Bedienung** = neues Paket **M7-UX** (lead-design): UX-Analyse des aktuellen
Stands auf main (Heuristik + Erstspieler-Playtest durch qa-playtester), Brainstorming und
Kurz-Spec mit testbaren AK unter `docs/superpowers/specs/`, Gate Spec (lead-tech, lead-qa); die
Umsetzung läuft im UI-Strang und **ersetzt bzw. erweitert M7-U2 Teil B**, das bis zum Gate Spec
M7-UX wartet. M6-U1–U3 bleiben im Plan, aber nach M7-UX (gleiche Dateien). Am Ende jeder Etappe
Zwischen-Merge nach main mit Push wie R100/R105, damit der Nutzer den Stand spielen kann.
Budget: aus M7-Budget 80; M7-UX bekommt einen eigenen Antrag nach Gate Spec. — Warum: alle drei
Wünsche sind im Plan angelegt bis auf „intuitiv", das eine Analyse vor dem Bauen braucht
(Brainstorming-Pflicht). — Kosten bei Irrtum: M7-U2 Teil B verzögert sich um die UX-Spec.

Zweck der Anweisung: das Spiel soll schöner klingen/aussehen und leichter bedienbar sein;
Auslegung widerspricht ihm nicht, weil die Bedienung zuerst gemessen statt geraten wird.

Entscheider: L0 · Anlass: Nutzeranweisung

## R119 · 2026-10-01 · M7 Übernahme von der Cloud-Session, Abschluss und M7-UX

Ruling: Lage nach `git fetch`: Die Cloud-Session „Thema abschliessen" (idle) hat M7 auf
`origin/feat/ui-m6m7` @ 4c69776 bis D1 fertiggestellt (R107–R117); offen sind INT-Check,
Final-Review und Gate Merge inkl. `fix/layoutkey` @ 42d39b7. Damit ist R118 Punkt (1) und (2)
erledigt bzw. überholt. Diese Session (5e248230) **übernimmt den Abschluss von M7**: (a) Die lokal
erhaltenen Assets `feat/m7-assets` @ 9ce9025 (Musik, Umgebung, Signale, Schrift, CREDITS, Lizenzen,
lokales Lizenzurteil) beantworten **N-90 ohne den Nutzer**; lead-art führt X1b auf dem Assets-Baum
(23e5eac = UI 4c69776 + Assets) durch, pusht unter einem neuen Branch (`feat/m7-assets-local`), da
`origin/feat/m7-assets` abweicht. (b) Danach Merge Assets in UI, INT-Check, Final-Review (lead-qa),
Gate Merge L0, Merge nach main mit Push. (c) N-91 (Leistung auf Echtgerät) misst lead-qa auf diesem
Mac mit GPU nach dem Merge; der Eintrag wird damit beantwortet. (d) **M7-UX** (R118 Punkt 3) bleibt:
Analyse und Kurz-Spec durch lead-design auf 4c69776; Umsetzung als eigenes Paket **nach** dem
M7-Merge auf main. (e) Push-Pflicht aus R107 (Cloud) gilt auch hier. Die Cloud-Session wird per
Nachricht informiert. — Warum: fast fertiger Meilenstein; die verlorenen Assets existieren lokal.
— Kosten bei Irrtum: Läuft die Cloud-Session doch weiter, Doppelarbeit am Abschluss; abgefangen
durch Eintrag in „Parallele Sessions" und Nachricht.

Entscheider: L0 · Anlass: Bericht lead-tech, `git fetch`

## R120 · 2026-10-01 · Cloud-Session: Übergabe an 5e248230 nach R119, INT-Ergebnis

(Lokal zuerst als R118 geschrieben, nie gepusht und per Revert zurückgenommen; wegen Nummernkollision
mit R118 der Session 5e248230 als R120 neu gefasst.)

Ruling: Die Cloud-Session nimmt R119 an und stellt die M7-Arbeit ein; sie besitzt nichts mehr. Übergabe:
(1) **INT-Check bereits gelaufen** auf 2f954c0 (detached Test-Merge UI 0933bcc + fix/layoutkey 42d39b7,
ohne Assets und ohne D1): AK-A2-04, AK-U1-06, M6 AK-R2-02 (68/68 Kanten), R2-FW, AK-R1-06 (Aufbau
324–558 ms, Teil-Neuzeichnung ≤ 6,2 ms), AK-ISO-14/15 OK; AK-U2-01 und AK-A3-05 nur mit R109-Ausnahme;
AK-R4-06/AK-U3-09 auf Software-Raster 27 fps bei Render-Median ~4 ms (→ N-91). Bericht und Bilder lagen
im Cloud-Container unter `.studio/qa/M7-INT/` (nicht im Repo). Mit Assets sind AK-U2-01, AK-A3-05 und
AK-A2-04 zu wiederholen.
(2) **Offene Kleinst-Fix-Runde** (nicht abgeschlossen): Render — Reste D3 (`EXTINGUISHED_TICKS`,
`RenderFx.extinguished`), Kommentar renderer.ts „Laternen (immer)", Testschwelle water.test.ts; ein
unvollständiger, ungeprüfter Anfang liegt auf `origin/wip/r118a-render-aufraeumen` @ 7092138 (Basis
27995c9) — verwerfen oder fertigstellen. UI — `DevPreview.extinguishedId`/`?geloescht=` entfernen,
Kommentar eventLogView.ts „Standard offen", Auswahl erst beim Loslassen ohne Ziehen.
(3) Für Nutzer-Playtest/M9 vorgemerkt (nicht in M7): siehe docs/beobachtungen.md, Eintrag „R120".
(4) Abgenommene Strang-SHAs: Render 27995c9, Audio bd575d8, UI 0933bcc (+ D1 4c69776, R117),
fix/layoutkey 42d39b7. N-90 ist durch R119 (a) beantwortet; N-91 übernimmt lead-qa auf dem Mac (R119 c).
— Warum: R119 übernimmt; Doppelarbeit vermeiden. — Kosten bei Irrtum: keine.

Entscheider: L0 (Cloud-Session) · Anlass: R119 auf main

## R121 · 2026-10-01 · M7-UX Spec-Entscheide

Ruling: Kurz-Spec `docs/superpowers/specs/2026-10-01-m7-ux-design.md` (lead-design, 29 AK, 10 Tasks
in UX-1–UX-5, Basis `feat/ui-m6m7` @ 4c69776) wird zum Gate Spec (lead-tech, lead-qa) vorgelegt.
Vorab entschieden: (1) **Zeit statt Ticks** (L8) angenommen; die in Spec §6 gelisteten Texte
abgenommener M6/M7-AK ändern sich bewusst. (2) **Rote Abriss-Vorschau**: Ausnahme für eine Zeile
in `src/render/renderer.ts` im UI-Strang (Render-Strang ist abgeschlossen). (3) Leertaste auf
fokussiertem Button bleibt Aktivierung. Umsetzung erst **nach** dem M7-Merge auf main (R119 d),
als eigenes Paket auf main-Basis. — Warum: alle drei folgen aus dem Ziel „intuitiv" und schaden
keinem bestehenden Verhalten. — Kosten bei Irrtum: Texte in bis zu ~10 AK erneut anpassen.

Entscheider: L0 · Anlass: Bericht lead-design M7-UX

## R122 · 2026-10-01 · Gate Spec M7-UX: Nacharbeit

Ruling: Gate Spec M7-UX: lead-qa BEDENKEN (2 blockend, 11 weitere), lead-tech BEDENKEN (6 mit
Spec-Änderung, 5 kleinere) → **Nacharbeit lead-design in einer Runde**, danach kurze Zweitprüfung
lead-qa, dann Plan lead-tech. Vorab entschieden: (1) Basis der Umsetzung = main nach dem M7-Merge,
Branch `feat/m7-ux` im Worktree `.worktrees/m7-ux` (bestätigt R121); AK-UX-14 prüft gegen diesen
Merge-Commit. (2) „Neue Insel" auf der Startkarte bekommt eine Bestätigung mit Hinweis, dass der
Autosave ersetzt wird (lead-qa 12). (3) Kosten- und Rückerstattungstexte einheitlich „50 Geld ·
2 Holz" (lead-qa 13, lead-tech 11); AK-UX-23 wird angepasst. (4) Budgetvorschlag lead-tech
(36 = lead-tech 34, lead-qa 2) wird im Gate Plan mit Rechenweg entschieden (E-004). — Warum: beide
Prüfer unabhängig mit überlappenden Blockern; eine gebündelte Runde ist billiger als zwei. —
Kosten bei Irrtum: eine weitere Nacharbeitsrunde.

Entscheider: L0 · Anlass: Gate Spec M7-UX

## R123 · 2026-10-01 · M7 Final-Review, Gate Merge mit Auflage

Ruling: Final-Review M7 (lead-qa, `feat/ui-m6m7` @ a8d9447) BEDENKEN, kein Blocker im Code.
**Gate Merge bestanden unter Auflage:** lead-tech führt auf dem UI-Strang in einem Commit nach:
(1) „Fremde Assets sind derzeit nicht eingebunden" in `README.md`, `docs/arc42.md` und M7-Spec durch
den tatsächlichen Stand ersetzen (Manifest, `public/`, CREDITS); (2) Reste D3 entfernen
(`EXTINGUISHED_TICKS`, `RenderFx.extinguished`, `?geloescht=`) und die falschen Kommentare
„Laternen (immer)", „Standard offen" korrigieren (R117). `origin/wip/r118a-render-aufraeumen` wird
verworfen (nur Vorlage, nicht gemergt). Danach kurze Nachprüfung lead-qa, dann Merge `--no-ff` des
abgenommenen SHA nach main durch lead-production mit production-integrator **im Vordergrund**
(R106 Punkt 2), Push, CI/Pages. Vorbedingung R120 (1) ist erfüllt: Der INT-Check lief auf a8d9447
(mit Assets 403dfea) und bestand AK-U2-01, AK-A3-05, AK-A2-04 (Bericht lead-tech, R119). Der
Test-Merge wird vor dem Merge gegen das aktuelle main neu gezogen. — Warum: Doku auf main darf
den Asset-Stand nicht falsch beschreiben; D3-Reste verstossen gegen R117. — Kosten bei Irrtum: ein
Fix-Durchgang.

Entscheider: L0 · Anlass: Final-Review M7

## R124 · 2026-10-01 · M7 auf main (Rebase-Vorfall), Gate Spec M7-UX bestanden

Ruling: (1) **M7 ist auf main und live** (origin/main 3ab4eda, CI und Pages grün). Ablauf: Der
Integrator mergte `--no-ff ce5b13a` als a3c08dc; bevor gepusht war, lief im Hauptcheckout ein
`git pull -q --rebase` (nach Reflog der Kleinkorrektur-Commit von lead-qa, Zweitprüfung M7-UX), der
den Merge zu 39 kopierten Commits linearisierte und mit 3ab4eda pushte. Der Dateistand von 183ae81
ist identisch mit a3c08dc (= geprüfter Stand ce5b13a auf main); `make check` grün, 743 Tests.
**Entscheid D-M7-MERGE-01: lineare Historie bleibt** — kein Umsetzen von `main`, kein Force-Push
(Verfassung §6), kein nachträglicher Leer-Merge. Zuordnung: geprüfter Stand `feat/ui-m6m7` @
ce5b13a ≙ main @ 183ae81. (2) **Dauerregel ab sofort:** Im Hauptcheckout nur `git pull --ff-only`,
nie `git pull --rebase`; Leads committen während eines laufenden Merges nicht im Hauptcheckout; der
Integrator prüft HEAD unmittelbar vor dem Merge und vor dem Push erneut. Übernahme in lernen.md durch
studio-coach. (3) Prüfauftrag R106 (2), Start 1/3: `run_in_background: false` wurde angenommen, das
Werkzeug startete trotzdem asynchron; der Bericht kam beim Lead an. (4) **Gate Spec M7-UX
bestanden** (lead-qa Zweitprüfung OK nach 3ab4eda, lead-tech-Punkte erledigt; 31 AK). Nächster
Schritt: Plan durch lead-tech; offene Planfragen: AK-UX-31 in CI ohne Flackern, Text der
Menü-Bestätigung ohne Slot. — Warum: Inhalt geprüft und live; jedes Umschreiben von origin wäre
schlimmer als die unschöne Historie. — Kosten bei Irrtum: Merge-Klammer fehlt in der Historie.

Entscheider: L0 · Anlass: Bericht lead-production M7-MERGE, Zweitprüfung lead-qa M7-UX

## R125 · 2026-10-01 · Gate Plan M7-UX

Ruling: Gate Plan M7-UX (Plan @ 45e65c6): lead-qa BEDENKEN (4 Punkte), lead-production BEDENKEN
(3 Muss, 3 Kann), kein ZURÜCK. **Bestanden nach Planpflege durch lead-tech**, ohne Zweitprüfung:
Plantext übernimmt (a) AK-UX-31 misst den ungünstigsten Fall (Land, `canPlace` ok, Bau- und
Weg-Werkzeug); (b) AK-UX-30: M6 AK-U2-05/-09 und Browserteil QA-UI-2 für alle drei Modalkarten
plus Fokusregeln in QA-UX1/2, fester Zählbefehl für `it(`/`test(` je Datei 183ae81 gegen HEAD;
(c) Menü-Bestätigung unterscheidet „Autosave vorhanden" (`slot === 'auto'`); (d) Push-Pflicht
nach jedem abgenommenen Commit (R107); (e) Rulings und Befunde nur im Bericht, L0 trägt auf main
ein; (f) Merge-Regeln R124 (2) im Abschluss; (g) `hud.ts` auch Task 7 in der Ownership-Tabelle.
**P-1, P-2 (`formatClock` „m:ss" statt `formatGameTime` für Zeitpunkte, Abweichung von Spec L1
hiermit genehmigt) und P-4 angenommen.** Parallelität Task 6 ∥ 7 entscheidet lead-tech (zweiter
Worktree erlaubt). Budget **36 = lead-tech 34 + lead-qa 2** (Rechenweg im Plan, E-004), Freigabe
zum Umsetzungsstart. Ausserdem: `docs/m8-spec` @ 2a46996 ist nicht verloren und jetzt auf origin
gesichert; M8-Spec wird nach M7-UX gegen den Stand nach M6/M7 geprüft statt neu geschrieben.
Worktree-Aufräumen nach Liste lead-production freigegeben (`git worktree remove` ohne `--force`,
keine Branches löschen, `m8-spec` und lokaler Branch `feat/m7-fx` bleiben). — Warum: alle Punkte
sind Plantext ohne Spec-Wirkung. — Kosten bei Irrtum: Nacharbeit im ersten Task-Review.

Entscheider: L0 · Anlass: Gate Plan M7-UX

## R126 · 2026-10-01 · Retro M7: Experimente

Ruling: Empfehlungen studio-coach aus der Meilenstein-Retro M7 (D-RETRO-M7) angenommen:
**E-001 behalten** (Schätzung aus Richtwerten; Richtwerte nachgeeicht, Minuten = Tools ÷ 4).
**E-002 beendet als „angepasst"** — die Messregel traf den eigentlichen Schaden (verlorene,
ungepushte Branches, Nummernkollisionen) nicht; abgelöst durch **E-005 „Abstimmung paralleler
Sessions über origin"** (angenommen, übernimmt den Platz). **E-004 „Rechenweg im Budget-Ruling"
startet**, erster Prüffall Budget M7-UX (R125). **E-006 „Exklusive Arbeitsbäume"** angenommen,
Start nach Ende E-003; bis dahin gilt R124 (2) als Ruling. Die Lücke der Meilenstein-Metrik
(Cloud-Session nicht erfasst) bleibt als Beobachtung für lead-production. — Warum: zwei Episoden
paralleler Sessions belegen ein Muster mit hohem Schaden (4 Pakete neu umgesetzt). — Kosten bei
Irrtum: ein Experiment-Platz falsch belegt.

Entscheider: L0 · Anlass: Meilenstein-Retro M7

## R127 · 2026-10-01 · Prozess-Aussensicht in der Retro (Nutzeranweisung)

Ruling: Nutzeranweisung „immer wenn du Fehler im Team und im Ablauf entdeckst, gib das an die Retro
weiter; führe dort einen neuen Verantwortlichen ein, der eine neutrale Aussensicht vertritt und
dessen Ziel es ist, interne Prozesse und Arbeitsabläufe zu optimieren (Scrum oder SAFe ähnlich);
regelmässig nach einem Release einer Funktion oder wann immer es Sinn macht" — umgesetzt als:
(1) **Dauerregel L0:** Jeder entdeckte Fehler im Team oder Ablauf wird als Retro-Befund geloggt
(`log.py retro` bzw. Ad-hoc-Retro), nicht nur als Ruling. (2) **Neue Persona
`studio-process-coach`** (Arbeitstitel; Rolle wie Scrum Master / SAFe Release Train Engineer):
neutral, nicht in Lieferung und Gates eingebunden, analysiert Abläufe, Übergaben, Parallelität,
Wartezeiten und Fehlerursachen, schlägt Prozessänderungen vor; L0 entscheidet per Ruling. Abgrenzung:
`studio-coach` kuratiert weiterhin lernen.md, Experimente und Metriken. (3) **Takt:** nach jedem
Release einer Funktion (Merge auf main/Pages) eine Prozess-Retro, zusätzlich ad hoc bei
Prozessproblemen. (4) Anlegen der Persona per Onboarding (lead-production) zu Beginn der nächsten
Session, vor dem Start der M7-UX-Umsetzung; Handbuch-Änderung (Rolle, Takt) durch studio-coach nach
L0-Ruling. Erste Prozess-Retro: Rückblick auf M7 (parallele Sessions, Rebase-Vorfall). — Warum:
ausdrückliche Nutzeranweisung; M7 zeigte Prozessfehler, die eine Sicht von aussen früher erkannt
hätte. — Kosten bei Irrtum: ein zusätzlicher Retro-Start je Release.

Entscheider: L0 · Anlass: Nutzeranweisung

## R128 · 2026-10-01 · Session Prozess-Retro (Nutzerauftrag)

Ruling: Nutzerauftrag „setz die neue Rolle ein und mach eine Retro; verbessere interne Prozesse, um
effizienter zu werden, nicht das Produkt (in dieser Session)" — ausgelegt als: (1) Scope dieser
Session ist ausschliesslich Studio-Prozess (`docs/studio/`, `.claude/agents/`,
`.claude/output-styles/`, `tools/studio/`); kein Code unter `src/`, M7-UX bleibt pausiert. (2)
lead-production legt `studio-process-coach` nach R127 (2) per Onboarding an. (3) Erste
Prozess-Retro über M6/M7/M7-UX-Vorbereitung mit Schwerpunkt Effizienz (Starts, Tokens, Wartezeit,
Doppelarbeit, Übergaben). (4) L0 entscheidet die Vorschläge per Ruling; studio-coach setzt die
angenommenen um. (5) Ampel rot (5h-Limit 81 %): höchstens 4 Agenten-Starts, state.md laufend. —
Warum: Wortlaut „nicht das Produkt" und „in dieser Session" grenzen eindeutig ein; Zweck-Gegenprobe
(E-003): Ziel ist Effizienz, also zählen Vorschläge, die Starts oder Wartezeit sparen, vor
Dokumentationsausbau. — Kosten bei Irrtum: M7-UX startet eine Session später.

Entscheider: L0 · Anlass: Nutzerauftrag

## R129 · 2026-10-01 · Prozess-Retro 1: Vorschläge

Ruling: Alle 5 Vorschläge aus [retros/2026-10-01-prozess-retro-1.md](retros/2026-10-01-prozess-retro-1.md)
angenommen; (1) vorerst als Handbuch-Regel (Standard eine L0-Session je Repo, Parallelität nur per
Ruling, ersetzt E-005), Start-Hook-Warnung als Werkzeug-Paket lead-production in Folgesession; E-004
abgelehnt. Umsetzung (2)–(5) und Regel (1): studio-coach, ein Start. — Warum: Effizienzauftrag R128.
— Kosten bei Irrtum: Rücknahme per Ruling, Texte in Git.

Entscheider: L0 · Anlass: Prozess-Retro 1

## R130 · 2026-10-02 · Pages-Limiten überwachen (Nutzerauftrag)

Ruling: „Limiten prüfen, im Blick behalten" ausgelegt als Paket PAGES-LIMIT (lead-tech, Budget 3):
Limiten gegen aktuelle GitHub-Doku prüfen, Ist-Grösse messen, Fakten in arc42 Kap. 7, automatische
Warnschwelle (50 % je Limit) in CI. Bei Schwelle: Warteschlange mit Alternativen. Läuft parallel zu
M7-UX (getrennte Pfade). — Kosten bei Irrtum: ein kleiner Check zu viel.

Entscheider: L0 · Anlass: Nutzerauftrag

## R131 · 2026-10-02 · Gate Merge PAGES-LIMIT

Ruling: `feat/pages-limit` @ 3065631 angenommen (Review OK, `make check` grün, Ist 0,87 % von 1 GB);
Merge per production-integrator. Node-Risiko (Typ-Stripping ab 22.18, CI pinnt 22) wird am ersten
CI-Lauf auf main belegt; bei Rot `check-latest: true` als Fix. — Kosten bei Irrtum: ein ausgesetztes
Deploy, alte Seite bleibt online.

Entscheider: L0 · Anlass: Merge-Gate

## R132 · 2026-10-02 · M7-UX AK-UX-16 Auflage

Ruling: Auflage lead-design angenommen: `.btn.unaffordable` mit Schrift `--parchment-muted` (#c0b090,
≥ 4,5:1, Paar im Kontrasttest), gestrichelt, ohne Hintergrund-Überschreibung; Spec-Text AK-UX-16
nachziehen; QA-Bild. Umsetzung lead-tech vor Merge, Final-Review prüft das Delta mit. Stolperstellen
nicht blockierend (beobachtungen.md). — Kosten bei Irrtum: drei CSS-Zeilen.

Entscheider: L0 · Anlass: Designurteil M7-UX

## R133 · 2026-10-02 · Gate Merge M7-UX: BEDENKEN

Ruling: Urteil lead-qa angenommen. Vor Merge: H1 (Tab-Kreislauf `buildMenu.ts`) durch Entfernen von
Handler und `tabOrder` samt Test, N3/N4 (README, arc42); dann Re-Review, Browser-Prüfung AK-UX-20,
Probe-Merge. Bestätigt: Esc bricht Startkarten-Bestätigung ab; AK-UX-28 A6 (Handel in 15 s
gefunden) erfüllt. N1/N2/N5–N8, 15 Minor → `beobachtungen.md` (lead-qa).

Entscheider: L0 · Anlass: Final-Review M7-UX

## R134 · 2026-10-02 · M7-UX AK-UX-20 Auslegung

Ruling: AK-UX-20 „weiteres Tab erreicht Fischerhütte" gilt als erfüllt, wenn Tab nach dem letzten
Kategorie-Knopf die Fischerhütte erreicht (DOM-Reihenfolge, Spec L2). Verbindliche Auslegung für
Browser-Check und Gate; Spec-Wortlaut bleibt, dieses Ruling ist Referenz. — Kosten bei Irrtum: ein
Tab-Druck mehr für Tastaturspieler.

Entscheider: L0 · Anlass: Fix-Runde H1 M7-UX

## R135 · 2026-10-02 · Gate Merge M7-UX bestanden

Ruling: `feat/m7-ux` @ 8246625 angenommen (lead-qa OK, Auflage arc42 erfüllt und von L0 gesichtet,
Probe-Merge konfliktfrei, 818 Tests). Merge `--no-ff` durch production-integrator nach R124 (2); M7-UX
damit abgeschlossen. Prozess-Aussensicht durch studio-process-coach nach Release (R127). — Kosten bei
Irrtum: Fix-Commit auf main.

Entscheider: L0 · Anlass: Gate Merge M7-UX

## R136 · 2026-10-02 · Prozess-Retro M7-UX: Vorschläge

Ruling: Aus [retros/2026-10-02-prozess-retro-m7ux.md](retros/2026-10-02-prozess-retro-m7ux.md)
angenommen: V1, V3, V5; V4 als Experiment; V2 mit Änderung: einfachere Variante gilt vorläufig,
Controller meldet den Widerspruch im Schlussbericht, Gate entscheidet. Umsetzung und
Meilenstein-Retro M7-UX: studio-coach, ein Start. — Kosten bei Irrtum: Rücknahme per Ruling.

Entscheider: L0 · Anlass: Prozess-Retro M7-UX

## R137 · 2026-10-02 · Experimente nach Retro M7-UX

Ruling: E-009 → behalten (alle Schwellen erfüllt). Freier Platz an E-010 (Controller-Wechsel), Start
mit dem Plan M8; E-006 bleibt vorgeschlagen (Regeln gelten über R124 (2)). Statuspflege
`experimente.md`: studio-coach. — Kosten bei Irrtum: E-010 wird nach M8 beendet.

Entscheider: L0 · Anlass: Meilenstein-Retro M7-UX

## R138 · 2026-10-02 · M8-Spec: Beobachtungen

Ruling: Empfehlungen lead-design angenommen: brennender Betrieb in `goodsBalance` wird Teil von
M8-S2 (Spec-AK vor Gate nachtragen); „Spielerführung Wirtschaft" eigene Kurz-Spec nach M8-U2; N2
(Autosave erst nach Spielzeit) bleibt Beobachtung mit Designantwort, Kandidat für ein UI-Paket nach
M8. Danach Gate Spec M8 (lead-qa, lead-tech). — Kosten bei Irrtum: ein AK verschoben.

Entscheider: L0 · Anlass: Spec-Prüfung M8

## R139 · 2026-10-02 · D-138a: Bilanz bei Brand

Ruling: R115 bleibt (HUD-Bilanz zeigt bei Brand die Dauerleistung, Planungsgrösse). R138 Punkt
`goodsBalance` zurückgenommen: AK-S2-19 streichen, Beobachtung „erledigt durch R115". Übrige R138
gilt. Lehre: Beobachtungen vor Übernahme gegen Rulings prüfen (Retro). — Kosten bei Irrtum: Bilanz
flackert nicht, Brand zeigt Warnring.

Entscheider: L0 · Anlass: Bericht lead-design M8-SPEC

## R140 · 2026-10-02 · Gate Spec M8: BEDENKEN

Ruling: Beide Urteile angenommen. Nacharbeit lead-design: lead-qa B1–B5, AK-U2-10 nach R134-Wortlaut;
lead-tech (3): S1–S3 auf einer Branch, ein Gate Merge nach S3 (R82a gilt nicht); damit entfallen (1)
und (2) als Zwischenstand, Kopfzeilen-Smoke-Check vor dem Merge. Zweitprüfung lead-qa am Diff
(B1, B2). Hinweise beider Leads gehen in den Plan. — Kosten bei Irrtum: späterer erster Merge.

Entscheider: L0 · Anlass: Gate Spec M8

## R141 · 2026-10-02 · Gate Spec M8 bestanden

Ruling: Spec M8 @ 283bd9f (79 AK) freigegeben (lead-qa Zweitprüfung OK, lead-tech BEDENKEN durch R140
erledigt). Plan durch lead-tech auf `docs/m8-spec`, mit allen Plan-Hinweisen beider Leads, Übergabe
nach S3 (E-010) und R1 als eigenem Paket lead-art parallel zu U1/U2. Spec und Plan gehen nach Gate
Plan gemeinsam nach main. — Kosten bei Irrtum: Plan-Nacharbeit.

Entscheider: L0 · Anlass: Gate Spec M8

## R142 · 2026-10-02 · M8-Plan W1–W7, Ampel rot

Ruling: Designurteil lead-design angenommen: W3 AK-S3-01 auf 54; W4 ohne Wertanpassung, Messung in
Task 6, B1-Controller investiert nur über fester Reserve; W1, W2, W5 Spec-Korrektur §20/AK-B1-02.
Umsetzung als eine Spec-Runde zusammen mit dem Gate-Plan-Ergebnis. Ampel rot: keine neuen Starts
ausser Session-Ende-Retro; Umsetzung M8 erst in der Folgesession.

Entscheider: L0 · Anlass: Designurteil M8-Plan, Limit 81 %

## R143 · 2026-10-02 · Gate Plan M8 bestanden mit Auflagen

Ruling: lead-qa OK, lead-production BEDENKEN angenommen. Auflagen (eine Runde mit R142, Sichtung L0,
keine Zweitprüfung): QA-Hinweise 1–3; B1 lead-art merged selbst; B2 Session-/Agent-ID je E-010-Messpunkt;
B3 Kanten, Worktree `m8-render` durch lead-art; B4 SHA nachführen; B5 Integrations-Merges pushen.
Bestätigt: P1, W1, W3–W6. Budget lead-tech 25 (Par. 4), lead-qa 3, lead-art 4, +1 L0 (E-010).

Entscheider: L0 · Anlass: Gate Plan M8

## R144 · 2026-10-02 · Programm Nutzerfeedback

Ruling: Nutzerfeedback G1–G9/S1–S10 („planen, in Häppchen, Abteilungen ggf. parallel") ist ein
Programm, kein Sofortauftrag: lead-design macht eine Programm-Triage mit lead-art und lead-tech
(Stränge, Meilensteinschnitt, Reihenfolge, erste Häppchen) → Gate Brainstorming L0. Bug G2 sofort
als BUG-LICHT bei lead-art (leicht). M8 läuft weiter (deckt S1 teilweise); Auflagen-Runde jetzt. —
Kosten bei Irrtum: Neuschnitt der Roadmap, kein Code — `.studio/handoffs/nutzerfeedback-2026-10-02.md`

Entscheider: L0 · Anlass: Nutzer-Anweisung · ADR: —

## R145 · 2026-10-02 · BUG-LICHT

Ruling: Kombiniertes Gate BUG-LICHT bestanden: Clip je verdecktem Gebäude in Durchgang 10
(Verdecker Gebäudekörper und Kronen, Box-Vortest), Feuerflammen (Durchgang 7) mit demselben Clip,
Figuren und Schiff verdecken kein Licht. Rauch nur mit, wenn derselbe Helfer mit höchstens einem
Zusatztest reicht, sonst beobachtungen.md. Leistung: P95 `leistung-50` Nacht ≤ +10 %. — Kosten
bei Irrtum: ein Render-Commit zurück — Archiv-Bericht lead-art Phase 1

Entscheider: L0 · Anlass: Gate BUG-LICHT · ADR: —

## R146 · 2026-10-02 · M8

Ruling: Sichtung Auflagen M8 angenommen (Spec dbda0f8, Plan f5762b1). Lesart lead-tech bestätigt:
R143 streicht nichts, K1–K3 und Zwei-Input bleiben. Spec und Plan gehen jetzt nach main
(lead-production, Integrator). Start der M8-Umsetzung erst nach dem Gate Brainstorming FB-TRIAGE,
damit dessen M8-Empfehlung einfliessen kann. — Kosten bei Irrtum: kurze Startverzögerung M8

Entscheider: L0 · Anlass: Sichtung Auflagen M8 (R143) · ADR: —

## R147 · 2026-10-02 · Programm Nutzerfeedback

Ruling: Nutzernachtrag S11 „Freischaltung und Progression" (UI zeigt nur Freigeschaltetes, Bauten
nach Bedürfnis, qualifizierte Arbeit nur mit Schule, Funktionen wie Steuern an Gebäude gebunden,
Freischalt-Meldung, Hilfe-Knopf mit nächstem Schritt) geht in FB-TRIAGE als eigener Strang.
Widerspricht M8 §3/4.3 („Glashütte ab Spielbeginn baubar"): M8-Start bleibt bis zum Gate
Brainstorming zurückgestellt; Triage empfiehlt, ob S11 vor, in oder nach M8 kommt. — Kosten bei
Irrtum: M8-Spec-Nachführung — `.studio/handoffs/nutzerfeedback-2026-10-02.md`

Entscheider: L0 · Anlass: Nutzer-Anweisung, ergänzt R144 · ADR: —

## R148 · 2026-10-02 · Programm Nutzerfeedback

Ruling: Gate Brainstorming Programm bestanden (Vorschlag @ 8143365); F1–F14 nach Empfehlung, Abweichung
F3: Freischaltung (i) und Betriebsbedingung Schule (ii) sind Muss in M10, Arbeitskräfte-System (iii)
Backlog. R90 geteilt: M9 „Lebendige Insel" (Render, parallel zu M8), M10, M11, M12 „Weite Welt". Welle
jetzt: H-M8, H-R1; H-R2, H-S1, H-D1 nach M8-Start (Woche 69 %). — Kosten bei Irrtum: Roadmap-Neuschnitt

Entscheider: L0 · Anlass: Gate Brainstorming FB-TRIAGE, löst R90 teilweise ab · ADR: —

## R149 · 2026-10-02 · M9 H-R1

Ruling: Kombiniertes Gate H-R1 Bodenbild bestanden. F8: Schattierungsgrenze je Kachelart — Sand,
Gras, Wald ±8 % (M7-Spec 5.1 bleibt), Gebirge ±12 % (nicht bebaubar, Lesbarkeit von Wegen und
Gebäuden unberührt; Vorgriff auf G3). Messgrenzen wie Kurzdesign (Terrain ≤ 1500 ms dpr 2, Frame
≤ +5 %). — Kosten bei Irrtum: ein Wert in `terrain.ts` — Archiv-Bericht lead-art H-R1 Phase 1

Entscheider: L0 · Anlass: Gate H-R1, Abweichung M7-Spec 5.1 · ADR: —

## R150 · 2026-10-02 · M8 H-M8

Ruling: Spec-Delta S11-Minimum (413d6b8, 81 AK) angenommen. Gemeldete Punkte: Auflage R86 gilt als
erfüllt (Ziel bleibt sichtbar; „Vorbereitung als Wahl" entfällt durch Nutzeranweisung S11); Glas
bleibt vor der Freischaltung im Handel kaufbar (Handel-Freischaltung in M10); Rücksprung bei gesetztem
`unlockCitizens` hingenommen. Offener Punkt 15 wie empfohlen. Weiter: Plan-Delta, Delta-Gate. —
Kosten bei Irrtum: Spec-Runde — Archiv-Bericht lead-design H-M8

Entscheider: L0 · Anlass: Sichtung H-M8, R137-Meldungen · ADR: —

## R151 · 2026-10-02 · M8 H-M8

Ruling: Plan-Delta 3b6abdc angenommen; Spec-Widersprüche W8–W10 entschieden: AK-U1-07 prüft im neuen
Spiel den Sperrtext von J und baut das Badehaus im Szenario `m8-kaufleute-ohne-glas`; AK-U2-09 zeigt
„… oder baue Glashütte (O)" nur bei freigeschalteter Glashütte; die Sperrmeldung hat dieselbe Art wie
bestehende Bau-Ablehnungen. lead-design führt die Spec nach, dann Delta-Gate lead-qa. — Kosten bei
Irrtum: AK-Wortlaut — Archiv-Bericht lead-tech H-M8

Entscheider: L0 · Anlass: R137-Meldungen Plan-Delta · ADR: —

## R152 · 2026-10-02 · M8 H-M8

Ruling: Delta-Gate S11-Minimum bestanden mit Auflagen (lead-qa BEDENKEN, Spec da3da51, Plan 4ec97f9):
B1 Messung „keine Freischalt-Meldung nach Laden" in QA-B-1 (lead-tech); B2 Doku-Abgleich Spec/Plan
(lead-design, lead-tech); B3 Tastenliste `menu.ts` als Beobachtung für M10. Eine Runde, Sichtung
L0, dann Merge nach main und M8-Start. — Kosten bei Irrtum: Plan-Nachtrag — Archiv-Bericht lead-qa

Entscheider: L0 · Anlass: Delta-Gate M8 · ADR: —

## R153 · 2026-10-02 · BUG-LICHT

Ruling: Gate Merge BUG-LICHT bestanden (e4f8c31, Review BEDENKEN ohne Blocker, P95 Nacht +6 % ≤ 10 %).
Anpassung AK-R4-05-Test (eine Füllung je Fenstergruppe nicht spec-pflichtig) angenommen. lead-art merged
selbst nach dem laufenden Doku-Merge (serialisiert durch L0). Nachmessung auf 60 Hz/gedrosselter CPU im
nächsten Leistungs-Check M8/M9. — Kosten bei Irrtum: Revert eines Merges — Archiv-Bericht lead-art Phase 2

Entscheider: L0 · Anlass: Gate Merge BUG-LICHT · ADR: —

## R154 · 2026-10-02 · M9 H-R1

Ruling: Gate Merge H-R1 Bodenbild bestanden (03aa0fd, Review OK, alle Messgrenzen gehalten,
`renderMedian` +5 % auf der Grenze). Keine weitere Anhebung der Schattierung; sichtbares Relief
im Gebirge kommt mit G3. lead-art merged selbst. — Kosten bei Irrtum: Revert eines Merges —
Archiv-Bericht lead-art H-R1 Phase 2

Entscheider: L0 · Anlass: Gate Merge H-R1 · ADR: —

## R155 · 2026-10-02 · M10

Ruling: Gate Brainstorming M10 „Schritt für Schritt" bestanden (Vorschlag aef60a3); D1–D11 wie empfohlen,
D10 (Marktplatz ab 20 Wohnhäusern) mit Playtest-Frage im Spec-Gate. H-S1 (Wald roden, Sim) geht als
Sim-Paket in M10 auf statt eigenständig. Spec durch design-spec-author, Spec-Gate nach gates.md. —
Kosten bei Irrtum: Spec-Runde — `docs/superpowers/specs/2026-10-03-m10-schritt-fuer-schritt-design.md`

Entscheider: L0 · Anlass: Gate Brainstorming M10, ändert R148 (H-S1) · ADR: —

## R156 · 2026-10-02 · M8

Ruling: Controller 1 (Tasks 1–5, QA-A) abgenommen, `feat/m8-sim` @ 766dc75. C-3: QA-A gilt als OK
(einziger Konsoleneintrag `favicon.ico` 404, bekannt, kein JS-Fehler). W-T1-1 (Testhäuser verlegt,
Prüfungen gleich) zur Kenntnis. E-010: Controller 2 übernimmt per Ledger, merged zuerst main in
`feat/m8-sim`; danach Sim-Final-Review lead-qa. — Kosten bei Irrtum: QA-A-Nachprüfung — Ledger m8

Entscheider: L0 · Anlass: Übergabe E-010, Bericht Controller 1 · ADR: —

## R157 · 2026-10-02 · M9 H-R2

Ruling: Kombiniertes Gate H-R2 Wasser- und Luftleben bestanden (Kurzdesign `.studio/handoffs/h-r2-kurzdesign.md`):
Signatur `wildlifeAt(world, range, timeMs, env?)` nach M10-Design §4; Änderung `weather.test.ts` (CAPS) zulässig;
Frame-Grenze +5 % gegen main @ 5f7e085. Möwen bei Regen/Sturm als Trivial-Fix im selben Branch (eigener
Commit). — Kosten bei Irrtum: Render-Revert — Archiv-Bericht lead-art H-R2 Phase 1

Entscheider: L0 · Anlass: Gate H-R2 · ADR: —

## R158 · 2026-10-02 · M8

Ruling: Gate Merge Sim bestanden (lead-qa OK, `feat/m8-sim` @ f71f7fa, 4 niedrige Befunde fürs
Final-Review M8 gesammelt; L-1 und L-2 gehen in D1). Merge durch production-integrator. W5 startet
erst nach dem Reset des 5-h-Fensters (19:00; jetzt 58 %, keine neuen Wellen ab ~60 %, R69). —
Kosten bei Irrtum: Revert des Sim-Merges — Archiv-Bericht lead-qa M8-SIM-FR

Entscheider: L0 · Anlass: Gate Merge Sim M8 · ADR: —

## R159 · 2026-10-02 · M10

Ruling: M10-Spec (7f805d9, 96 AK) geht ins Spec-Gate (lead-tech, lead-qa) nach dem 5-h-Reset (Ampel gelb).
Widersprüche W1–W5 aus Spec §22 wie empfohlen angenommen (u. a. `terrainRev` in `layoutKey`, ändert
M6:AK-S3-07). `renderer.ts` seriell: H-R2 → H-R3/H-R4 → M10-U2; der spätere Strang merged vorher main.
— Kosten bei Irrtum: Spec-Nachführung — Archiv-Bericht lead-design H-D1

Entscheider: L0 · Anlass: Bericht Spec M10, R137-Meldungen · ADR: —

## R160 · 2026-10-02 · M9 H-R2

Ruling: Gate Merge H-R2 bestanden mit Auflagen (2a53cdd, Review OK, Frame 0 %): Wal mit erkennbarer
Silhouette (Rücken, Fluke, Fontäne) statt Scheibe; Kappen `fish [20, 6]`, `flocks [4, 2]`, Tiere in der
Startansicht sichtbar. Re-Review per Diff, dann merged lead-art ohne neues Gate. — Kosten bei Irrtum:
eine Art-Runde — Screenshots `.studio/qa/h-r2/`

Entscheider: L0 · Anlass: Gate Merge H-R2, Art-Sichtung L0 · ADR: —

## R161 · 2026-10-02 · M8

Ruling: Controller-Entscheid C2-2 bestätigt (Ledger W-T6-1): Testhelfer `prepareUpgrade` kauft je
Glashütte 1 Stein zusätzlich; Spielwerte, Reserve, Layout und `src/**` unverändert; erster Kaufmann
8550, zweites Ziel 10 100. Gilt als bestätigte Abweichung fürs Final-Review M8. Die Stein-Konkurrenz
Glashütte↔Aufstieg (Reservierung ist M8-Nicht-Scope §3) geht als Beobachtung an M11. — Kosten bei
Irrtum: zwei Testzeilen — Ledger m8

Entscheider: L0 · Anlass: Meldung Controller 2, Spec 16.3 · ADR: —

## R162 · 2026-10-02 · M8

Ruling: Zweites Ziel 60 Kaufleute, Szenario-Baseline 10 100, erster Kaufmann 8550 (Krisen aus) —
Grenze 12 000 = Schätzung ≈ 10 000 + Marge 2000 — bei Irrtum Neumessung, `WIN_MERCHANTS` und
`unlockCitizens` ohne Codeeingriff anpassbar. Bürger-Endzustand 7300 / Geld 1490; Reserve 500,
`minMoneyAfterWin` 212; Messung mit C2-2 (R161) — Ledger m8, Ruling-Vorlage B1

Entscheider: L0 · Anlass: AK-B1-06 · ADR: —

## R163 · 2026-10-02 · M10

Ruling: Gate Spec M10 bestanden mit Auflagen (lead-qa und lead-tech BEDENKEN, 7f805d9): Spec-Delta durch
lead-design ohne neue Gate-Runde, Sichtung L0, für QA B-1…B-12 und Tech B1–B6, B8, B10. B7 angenommen:
`layoutKey` hasht die Geländeart je Kachel statt Weltfeld `terrainRev` (löst R159 W3 ab, einfacher).
B8: `maxCount` in Defs, `noService` statt `noSchool`. B9, B11 entscheidet der Plan. — Kosten bei Irrtum:
Spec-Runde — Archiv-Berichte lead-qa, lead-tech M10-SPEC-GATE

Entscheider: L0 · Anlass: Gate Spec M10, löst R159 W3 ab · ADR: —

## R164 · 2026-10-02 · M10

Ruling: Gate Plan M10 bestanden mit Auflagen (abcf92c; lead-qa und lead-production BEDENKEN): QA 1–4
und Production B1, B3–B5 arbeitet lead-tech in einer Runde ein, Sichtung L0. P1–P6, W1–W4 bestätigt.
`sprites.ts`: M10 vor M9 Welle 2. M9 Welle 1b: H-R3 nach M8-R1, H-R4 in `errands.ts` parallel, Anschluss
`renderer.ts` nach H-R3. Budget gestuft (B2): Start M10 erst nach Gate Merge M8, zuerst T1–T4 und A1. —
Kosten bei Irrtum: Plan-Nachtrag — Archiv-Berichte M10-PLAN-GATE

Entscheider: L0 · Anlass: Gate Plan M10 · ADR: —

## R165 · 2026-10-02 · M8

Ruling: Gate Merge M8 bestanden mit Auflage (Final-Review BEDENKEN): `feat/m8-balance` e1aa6cd und
`feat/m8-ui` 6cbdc56 jetzt seriell durch den Integrator; `feat/m8-render` nach Fix-Runde lead-art
(Test Fensteranker `house(4)` auf Wand/Hülle und Zeichnung, `palette.test.ts`-Verschärfung im Bericht,
main-Merge mit beiden Beobachtungs-Seiten), Nachprüfung L0 per Diff `src tests`, dann merged lead-art.
— Kosten bei Irrtum: Revert eines Merges — Archiv-Bericht lead-qa M8-FR

Entscheider: L0 · Anlass: Gate Merge M8 · ADR: —

## R166 · 2026-10-02 · Session-Ende 58d6bc4a

Ruling: Retros angenommen. E-007 und E-008 enden als „behalten"; E-010 läuft angepasst in M10 weiter
(Schwelle je Controller, Wechsel an Reset-Pausen, Doku delegieren). Neu: E-011 Rebase-Verbot in
Briefing-Vorlage (Guard-Teil per Warteschlange N-92), E-012 Pages `paths-ignore` für Nicht-Build-Pfade,
E-013 Budget-Phase = Paket-ID auch je Integrator-Start. Prozess-V1 (Hänger-Alarm 12 min), V3 (im
knappen Fenster erst abschliessen), V4 (Nutzernachtrag als ein Delta-Paket) ins Handbuch; Werkzeuge
(Pages, metrics.py „Tokens je Agent", Hänger-Alarm) als Paket lead-production nächste Session. —
Kosten bei Irrtum: Handbuch-Revert — `docs/studio/retros/2026-10-02-*.md`

Entscheider: L0 · Anlass: Retros M8, Session, Prozess · ADR: —

## R167 · 2026-10-02 · Token-Effizienz (Nutzerauftrag)

Ruling: Auslegung „Massnahmen testen/umsetzen; solche Themen sollen in Retros von selbst auffallen"
als Paket EFF, Stufe leicht, ohne Lead (L0 brieft direkt, zugleich erster Test von M1):
EFF-W **Werkzeug** (`production-studio-ops`, sonnet, Worktree): metrics.py-Abschnitt „Effizienz"
mit Anteil je Rollenklasse (Kostengewicht), Kontext je Rolle, 5-min-Neuschreibungen, opus-Anteil,
grösste gelesene Dateien und Ampel-Schwellen; Guard blockt `general-purpose` mit `Persona:` ohne
`model`. Erfüllt zugleich R166 „metrics.py Tokens je Agent". EFF-H **Handbuch 1.13** (`studio-coach`,
sonnet): Ad-hoc-Retro aus der L0-Analyse, M1/M3/M5 als E-010 angepasst („Schlanke Steuerung":
Leads ein Auftrag je Instanz, Controller sonnet, höchstens 4 Tasks je Instanz), M2 Task-Dateien
(Plan = Index + je Task ≤ 10 KB, Spec ≤ 40 KB, `rulings.md` nur per grep) und M4 L0-Sessiongrösse
als Experiment E-014 innerhalb der Grenze von 3 laufenden, Modellwahl neu, Effizienz-Ampel als
Pflichtpunkt jeder Retro. EFF-P Plan M10 danach mechanisch in Task-Dateien teilen. M6 (weniger
Prozess je Paket) erst nach Messung M10. Kein Modell-Downgrade wegen Limit (R71 bleibt): die Wahl
folgt der Aufgabe. — Kosten bei Irrtum: Handbuch-Revert auf 1.12, Guard-Regel entfernen —
`.studio/handoffs/EFF-analyse.md`

Entscheider: L0 · Anlass: Nutzerauftrag Token-Effizienz · ADR: —

## R168 · 2026-10-02 · Token-Effizienz

Ruling: E-014 („Task-Dateien und kurze L0-Sessions") wird in E-010 „Schlanke Steuerung" eingegliedert
statt auf einen Platz zu warten: Beide wirken auf dieselbe Messquelle (metrics.py „Effizienz") im
selben Zeitraum M10, die Handbuch-Regeln 1.13 gelten damit gemessen; Grenze 3 laufende bleibt.
Budget-Alarm „studio-director 13 von 3" ist ein Messartefakt: L0-Direktstarts (R167) zählen gegen die
ganze Historie statt ab dem Budget-Event; Fix im Paket EFF-W. — Kosten bei Irrtum: Experiment-Split
nachträglich — `docs/studio/retros/2026-10-02-adhoc-token-effizienz.md`

Entscheider: L0 · Anlass: Bericht EFF-H · ADR: —

## R169 · 2026-10-03 · Token-Effizienz

Ruling: (1) Gate Merge EFF bestanden (Review OK nach Fix-Runde 2), main @ 8794174, CI und Pages grün.
(2) Der Budget-Fix 2663c66 (Ersetzen statt Addieren) löste neue Fehlalarme aus (lead-art 21/3,
lead-production 2/1) und traf nicht die Ursache (Heartbeat-Knoten, beobachtungen.md 2026-10-03):
Revert durch den Autor, Merge durch den Integrator. (3) Plan M10 `orga-13` (Controller-Wechsel nach
der Hälfte, Modell laut Persona) ist durch Handbuch 1.13 / E-010 überholt; Budget R164 bleibt.
(4) Die Effizienz-Ampel ist je nach Sessionart zu lesen: Sessions ohne Spielarbeit zeigen
„Umsetzer rot“ ohne Befund; der Coach vermerkt das statt eines Experiments. — Kosten bei Irrtum:
falscher Alarm in einer Retro — `docs/studio/retros/2026-10-02-adhoc-token-effizienz.md`

Entscheider: L0 · Anlass: Merge EFF, Hook-Alarme · ADR: —

## R170 · 2026-10-03 · Nutzerfeedback Terrain, Bausound, Ausbau, Freischaltung

Ruling (Auslegung Nutzerauftrag „weiter" + 5 Punkte): (1) **H-R5 Terrain nachbessern** (Berg-Textur,
sichtbares Quadratraster) ist neues M9-Häppchen, Stufe leicht, lead-art → art-rendering-engineer, nur
`src/render/terrain*.ts`/`groundDecor.ts`/`palette.ts`; kein `renderer.ts`, kein `sprites.ts` (R159, R164);
G3 Felsmassive bleibt Welle 2. (2) **H-A1 Bausound** (Platzier-Klang je Gebäudeart) ist neues Häppchen,
Stufe leicht, lead-art → art-audio-engineer; Klänge prozedural oder Positivliste (ADR-011), Auslöser
aus `src/ui/`, `src/audio/` importiert nichts aus sim/ui. Startet nach H-R5 (Parallelität 2, Woche > 80 %).
(3) **Ausbau von Produktionsgebäuden** (Stufen je Gebäude, freigeschaltet über Bevölkerungsstufe) ist
neues System S12: Brainstorming lead-design jetzt (ohne Code), baut auf `world.unlocked` aus M10 auf;
Umsetzung im Meilenstein M11 (bricht ohnehin die Baseline), nicht in M10 — M10-Plan bleibt gültig.
(4) **„Freischaltbar für alle Gebäude"** ist M10 (Baum U0–U6, Start mit Weg, Wohnhaus, Holzfäller,
Fischerhütte) — bereits geplant. Der thematische Rahmen („ungebildete Fischer gehen an Land") kommt als
Text-Delta zur M10-Spec von lead-design (Namen und Begründungen in `defs/`, keine Strukturänderung);
M10 Stufe 1 (T01) startet nach diesem Delta. — Kosten bei Irrtum: Ausbau früher gewollt → M11 vorziehen;
Thema verlangt Strukturänderung → T01 neu briefen.

Entscheider: L0 · Anlass: Nutzerfeedback 2026-10-03 · ADR: —

## R171 · 2026-10-03 · S12 Ausbau, M10-Thema

Ruling: (1) Gate Delta M10-Spec (Abschnitt 24, nur `tip`-Texte, „Fischerleute ohne Bildung gehen an
Land") bestanden; Stufenname „Pioniere" bleibt (Umbenennung wäre Strukturänderung). T01 startet
unverändert, T01c übernimmt die neuen `tip`-Literale. (2) Gate Brainstorming S12 „Ausbau" bestanden:
Designvorschlag `docs/superpowers/specs/2026-10-03-s12-ausbau-design.md`, Variante C, Annahmen A1–A7 wie
empfohlen angenommen; Einordnung M11 nach S10, parallel S2; Spec erst mit M11. (3) Reiner
Doku-Fast-Forward `docs/s12-design` → main durch L0 ohne Integrator (kein Code, kein Konflikt).
— Kosten bei Irrtum: Nutzer will Ausbau vor S10 → S12 in M11 vorziehen (keine Abhängigkeit ausser Save-Version).

Entscheider: L0 · Anlass: Bericht S12-D · ADR: —

## R172 · 2026-10-03 · H-R5 Terrain

Ruling: Gate Merge H-R5 bestanden (`feat/h-r5-terrain` @ b2cf4a7; Review OK, Playtest OK, `make check`
grün, Kantenenergie an Kachelgrenzen 4,3 → 1,9, Felsrandsprung 74 → 8). Die Abweichung von M7-Spec 5.1
(`ROCK_EDGE` entfällt) ist angenommen. Restrisiken (Fels in Nahaufnahme verwaschen, weiche Kachel-Treppe
an Typgrenzen) gehen in die Nutzerabnahme; ein Domain-Warp wäre ein eigenes Paket. Merge durch
production-integrator. H-A1 Bausound startet danach. — Kosten bei Irrtum: Revert eines Commits.

Entscheider: L0 · Anlass: Bericht H-R5 · ADR: —

## R173 · 2026-10-03 · H-A1 Bausound, Vorfall CI

Ruling: (1) H-R5 auf main @ 07783b7 (CI, Pages grün), Paket done. (2) H-A1 Bausound startet (lead-art,
Budget 3). (3) Vorfall: CI auf main @ 592df06 rot (Prettier der Spec-Docs), weil L0 den Doku-Fast-Forward
(R171 (3)) ohne `make check` machte; behoben 6242c6d. Ab sofort prüft L0 auch bei reinen Doku-Merges
`npx prettier --check` vor dem Push. Befund an die Kurz-Retro am Session-Ende. — Kosten bei Irrtum: keine.

Entscheider: L0 · Anlass: Integrator-Bericht H-R5, Hook-Alarm CI · ADR: —

## R174 · 2026-10-03 · H-A1 Bausound

Ruling: Gate Merge H-A1 bestanden (`feat/h-a1-bausound` @ 445529e; Review OK, `make check` grün, 11 neue
Tests, prozedurale Klänge ohne Assets). Prozessabweichung: Implementierung vor Test, kein Rot-Lauf —
angenommen, weil die Tests alle 16 Gebäude-Ids, Pegel und Drosselung abdecken; Befund an die Kurz-Retro.
Klangqualität prüft der Nutzer im Browser (Hörcheck), Nachbesserung als eigenes Häppchen. Merge durch
production-integrator. — Kosten bei Irrtum: Revert eines Commits.

Entscheider: L0 · Anlass: Bericht H-A1 · ADR: —

## R175 · 2026-10-03 · M10 Stufe 1, Plan-Widersprüche

Ruling: (1) H-A1 auf main @ aa0c66a (CI, Pages grün), Paket done. (2) M10-S1B abgenommen
(`feat/m10-sim` @ f811e28, `feat/m10-forest` @ 5a81459 bewusst rot bis T03c; BG-1 winTick 6050,
minMoney 57). (3) Plan-Widerspruch AK-F1-08: es gilt T03b (Test in `tests/sim/forest.test.ts`).
AK-F1-09 „mit Speichern" in T04 mit abdecken, sonst offen für T05. Veralteter Testname „uses version 3"
als Trivial-Fix. (4) Nächste Instanz lead-tech T03c–T04c, Budget +3 (Stufe 1 gesamt 11). (5) Zweiter
Strang: lead-art H-R3 Statusmarken Kurzdesign (state.md Schritt 2). — Kosten bei Irrtum: ein Test
wandert die Datei.

Entscheider: L0 · Anlass: Berichte M10-S1B, H-A1-Merge · ADR: —

## R176 · 2026-10-03 · H-R3 Statusmarken

Ruling: Gate Merge H-R3 bestanden (`feat/h-r3-statusmarks` @ 34f0f41; Rot-Beleg vorhanden, Review OK,
Playtest-Screenshots lesbar, `make check` grün). Annahmen des Kurzdesigns angenommen (Marke nach Tönung,
`MAX_MARKS` lokal). Versatz bei 2×2-Betrieben → beobachtungen.md. Merge durch production-integrator;
danach ist `renderer.ts` frei für H-R4 (R159). — Kosten bei Irrtum: Revert eines Commits.

Entscheider: L0 · Anlass: Bericht H-R3 · ADR: —

## R177 · 2026-10-03 · M10 Stufe 1 Sim abgeschlossen

Ruling: (1) M10-S1C abgenommen (`feat/m10-sim` @ 14870ae; T03c, T04a–c Review OK je 1 Runde; BG-1
winTick 6050, minMoney 57, balance-crises 6/6, PLAN-B9 grün). Die fünf Bestandstest-Umbauten ausserhalb
der Ownership (R164 B3) und `tooltip.test.ts` Bauleiste 4 statt 3 sind angenommen (zwingende Folge der
Amtsstube über U3, Sollwerte sonst gleich). (2) Budget gestuft (R164 B2) bleibt: T01e, T05 ff. erst nach
dem Wochen-Reset (2026-10-07); lead-tech Rest 1 Start verfällt nicht, wird mit Stufe 2 verrechnet.
(3) M10-A1 (lead-art, Symbolsatz, Stufe 1) startet nach H-R4. — Kosten bei Irrtum: M10 zwei Tage später.

Entscheider: L0 · Anlass: Bericht M10-S1C · ADR: —

## R178 · 2026-10-03 · H-R4 Laufwege

Ruling: Gate Merge H-R4 bestanden (`feat/h-r4-laufwege` @ 0b91db7; Review BEDENKEN → Fix → Nachprüfung
durch denselben Reviewer OK nach R136; L0-Auflage „keine Figur über Wasser" mit Test umgesetzt;
`make check` grün laut Engineer, Integrator prüft erneut). Offen niedrig: Diagonalecken, gerade Wege durch
Nachbargebäude → beobachtungen.md, Folgehäppchen mit „Bürger Haus → Markt". Merge durch
production-integrator. Danach M10-A1 Symbolsatz (lead-art, Stufe 1). — Kosten bei Irrtum: Revert.

Entscheider: L0 · Anlass: Bericht H-R4 · ADR: —

## R179 · 2026-10-03 · Kurz-Retro Session 08e7b5f1

Ruling: (1) E-015 „Nachweiszeilen im Lead-Bericht" (Pflichtzeilen Rot-Beleg und Nachprüfung) angenommen,
Status laufend; Ausgangswert 2 von 4 Gate-Merge-Paketen ohne Nachweis (H-A1, H-R4). (2) E-010 läuft weiter;
Session-Ampel Steuerung 40 %, Umsetzer 44 %, opus 33 %, Cache-Write 26,6 % rot (kein neuer Eingriff).
(3) Werkzeug-Vorschlag `metrics.py --efficiency` je Session/Meilenstein und Tool-Ergebnis vs. Plan-Lesen
geht als Paket an lead-production (nach Reset). — Kosten bei Irrtum: eine Zeile mehr je Bericht.

Entscheider: L0 · Anlass: `docs/studio/retros/2026-10-03-session-08e7b5f1.md` · ADR: —

## R180 · 2026-10-03 · Wochenlimit aufgehoben, Experiment-Grenze

Ruling: (1) Nutzer-Anweisung „mach weiter, ignorier das Wochenlimit, darfst es ausschöpfen" ausgelegt als:
R164 B2 (Stufe 2 M10 erst nach Reset) entfällt; der Plan aus state.md läuft ab jetzt in normaler
Taktung weiter (M10 Stufe 2 → Gate Merge M10 → M9 Welle 2 → M11). E-010 „Schlanke Steuerung" gilt
unverändert, die Effizienzregeln bleiben Pflicht. (2) CI rot @ be2a58e: `test_experiments_limit` (4 statt
höchstens 3 laufend). E-015 ist angenommen (R179), aber noch nicht umgesetzt (Vorlage `bericht.md` ohne
Pflichtzeilen) → Status `vorgeschlagen` (angenommen, wartet auf Platz); Start, sobald E-011 oder E-013
abgeschlossen ist. — Kosten bei Irrtum: E-015 startet ein bis zwei Pakete später.

Entscheider: L0 · Anlass: Nutzer-Prompt Session-Start, CI-Lauf 37111435226 · ADR: —

## R181 · 2026-10-03 · M10-A1 AK-A1-03

Ruling: AK-A1-03 bestanden (Blindtest 24/24, davon 5 geraten; Anmutung bestanden mit Auflage). Auflage für
T09 (UI-Instanz lead-tech): Symbole nur auf dunklen Chips/Leisten (`--wood`), nie direkt auf Pergament
(`foam` und `wallLime` Kontrast 1,13 bzw. 1,03); keine Fix-Runde an `icons.ts`. Stufenfiguren bei 16 px
und Farbausreisser Geld/Schule gehen als Beobachtung an M9 Welle 2 / G8. Budget A1: 4 von 3 Starts
verbraucht (Tafel + blinder Rater), Überschreitung um 1 nachträglich freigegeben. — Kosten bei Irrtum:
Chips in T09 nachträglich gegen Randlinie tauschen (eine Fix-Runde).

Entscheider: L0 · Anlass: Bericht lead-art M10-A1, `.studio/qa/M10-A1/` · ADR: —

## R182 · 2026-10-03 · M10 Stufe 2 Sim abgenommen, UI-Welle frei

Ruling: M10-S2 (T01e) und M10-B1 (T05a–c) abgenommen (`feat/m10-sim` @ 6912e88; Review OK, Rot-Beleg T05
vorhanden, BG-1/BG-2 grün). Abweichungen angenommen: Arbeit in `m10-sim` statt `m10-scen` (seriell, kein
Konflikt), `Slot` lokal in `scenarios.ts`. `endMoney` 2681 statt 1490 aus R162 ist kein Regress (main
identisch); R162-Zahl gilt als veraltet, neue Referenz 2681. Frei: lead-tech UI-Instanz T06–T09 (`feat/m10-ui`
ab `feat/m10-sim` @ 6912e88, 10 Starts, Parallelität 2) mit Auflage R181; lead-art R1 parallel
(`feat/m10-render`, 3 Starts). QA-U1…U4 und Final-Review folgen über lead-qa vor Gate Merge M10.

Entscheider: L0 · Anlass: Bericht lead-tech M10-S2 · ADR: —

## R183 · 2026-10-03 · M10-R1 abgenommen

Ruling: M10-R1 (Amtsstube-Silhouette, Terrain-Teil-Neuzeichnung) abgenommen auf `feat/m10-render` @ d64a164
(Review OK, Rot-Beleg AK-R1-01/-04). Abweichung AK-R1-04 gegen 2×2-Rückfall angenommen (Plan-Variante wäre
vakuös grün). Blindtest gilt mit Vorbehalt (Tester sah vorab `galerie.probes.json`); Nachweis reicht, weil die
Erkennung über Uhrturm begründet ist — Briefing-Vorlage Playtester: Probe-Dateien erst nach dem Urteil öffnen
(an die Retro). AK-R1-03 in QA-U2. Merge in `feat/m10-ui` durch lead-tech (T07).

Entscheider: L0 · Anlass: Bericht lead-art M10-R1 · ADR: —

## R184 · 2026-10-03 · M10-UI an QA, M11-Design parallel

Ruling: M10-UI (T06–T09) auf `feat/m10-ui` @ f310abe an lead-qa für QA-U1…U4 und Final-Review (opus). Befund
E-015-Messung: Fixes T08/T09 ohne erneuten Reviewer-Lauf (R136 verletzt) → Nachprüfung im Final-Review
nachgeholt; zählt als 1 Paket mit fehlender Nachprüfung. Seriell statt parallel (Dateiüberschneidung)
angenommen. Parallel startet lead-design den Designvorschlag M11 (S10, S2, S3, S4-Prozent, S12, R161) auf
`docs/m11-design`, nur Doku. — Kosten bei Irrtum: M11-Vorschlag muss nach M10-Befunden nachgeführt werden.

Entscheider: L0 · Anlass: Bericht lead-tech M10-UI · ADR: —

## R185 · 2026-10-03 · Gate Brainstorming M11

Ruling: Gate Brainstorming M11 „Wirtschaft im Fluss" bestanden (`docs/m11-design` @ 0d583f8). Annahmen A1–A14
wie empfohlen angenommen: S10 (b) je Tick mit Übertrag und Neupinnen (Siege 7250/7850/11 300, Schwellen bleiben,
Ruling Balancing nach Programm F5, kein Nutzervorbehalt); Dämpfung prospektiv Faktor 2, Rückfall Faktor 1;
`levels` in `defs/levels.ts` (Abweichung S12 3.1 bewusst); Save v6; R161 nur Sichtbarkeit. Auflagen für die
Spec: (1) Ursache des Bruchs +1200 Ticks mit Zerlegung messen (Steuer- vs. Unterhaltsanteil), nicht nur
vermuten; (2) A9 (`free` am Holzfäller) und das minMoney-20-Szenario (A3) mit Zahlen belegen; (3) Spec ≤ 40 KB.
Spec startet jetzt, Umsetzung erst nach Gate Merge M10 (Save v5 vorher auf main, A10). — Kosten bei Irrtum: ein
Spielerlebnis 20 % langsamer bis zum Balancing-Schritt von M11.

Entscheider: L0 · Anlass: Bericht lead-design M11-D · ADR: —

## R186 · 2026-10-03 · M10 Final-Review ZURÜCK, K3 gestrichen

Ruling: Final-Review M10 ZURÜCK angenommen (QA-U1…U4 bestanden). (1) K3 (AK-U4-05, Silhouetten statt
Kategorie-Symbol, Spec 2.2 „Kann") wird per Streich-Ruling aus M10 genommen und an M9 Welle 2 / G8
(Sprite-Cache, `sprites.ts`) gegeben; die verletzte Streichreihenfolge K5→K4→K3 wird nachträglich so
gedeckt, weil K3 als einzige Variante Render-Silhouetten braucht. (2) lead-tech behebt D1 (README, arc42 §5/§8,
Spec-Verweise) und `hud.ts:110` (`role="img"` auf dem Steuer-Knopf, mit Test), dazu die niedrigen Doku-Punkte
`abdeckung.md` AK-U2-10, `qa-checks.md` (aria-label statt textContent, galerie ohne Bürgerhaus). (3) Nachprüfung
durch lead-qa (1 Reservestart), dann Gate Merge. — Kosten bei Irrtum: K3 kommt eine Welle später.

Entscheider: L0 · Anlass: Bericht lead-qa M10-QA · ADR: —

## R187 · 2026-10-03 · Gate Spec M11 BEDENKEN, A15

Ruling: Gate Spec M11 BEDENKEN (lead-qa, `docs/m11-design` @ cb1a1a1): vier blockierende Punkte (AK-Kollisionen
R136, AK-P1-08…10 hängen an P2, AK-P1-05 unscharf, fehlender UI-AK Stufe ≥ 2) und drei hohe (M10 AK-F1-05 rot
durch P2, Haupt-Pins statt Gebäudezahl/Fingerabdruck, Zeitbild §1) → Fix-Runde durch dieselbe lead-design-Instanz,
danach Gate Spec durch L0 anhand des Fix-Berichts (Nachprüfung lead-qa nur bei neuen AK-Lücken). A15 angenommen:
Pins 6750/7850/11 200 statt R185-Zahlen, nur Seed 3 gepinnt, Schwellen 7500/8000/12 000. — Kosten bei Irrtum:
Neupinnen im Balancing-Schritt.

Entscheider: L0 · Anlass: Bericht lead-qa M11-SPEC · ADR: —

## R188 · 2026-10-03 · Gate Merge M10

Ruling: Gate Merge M10 „Schritt für Schritt" bestanden: `feat/m10-ui` @ 58c6ce8 (enthält `feat/m10-sim`,
`feat/m10-render`, `feat/m10-icons`). QA-U1…U4 bestanden, Final-Review (opus) ZURÜCK → Fix-Runde → Nachprüfung
derselben Instanz BEDENKEN (Doku) → Docs-Commit 58c6ce8, Diff von L0 gesichtet (arc42 B9-Richtung, README U2 und
Auslöser-Satz, K3-Vermerke). K3 gestrichen (R186). Merge seriell durch lead-production/production-integrator
(`--no-ff`, make check, CI, Pages), danach Prozess-Retro (R127). Anschliessend frei: M9 Welle 2 (`sprites.ts`,
R164) und M11-Plan nach Gate Spec. — Kosten bei Irrtum: Revert-Merge auf main (reversibel).

Entscheider: L0 · Anlass: Nachprüfung lead-qa, Fix-Bericht lead-tech · ADR: —

## R189 · 2026-10-03 · Gate Spec M11

Ruling: Gate Spec M11 bestanden (`docs/m11-design` @ 07a45bc, Hauptdatei 39 706 B, 75 AK). Alle vier
blockierenden und drei hohen Punkte aus R187 behoben (Fix-Bericht lead-design); neue AK-UI-10 und AK-BAS-07
schliessen genannte Lücken und brauchen keine eigene Nachprüfung. 655 ‰ bleibt (ungerader Sturmstart,
beide Fälle in 3.5). Nächster Schritt: Plan M11 durch lead-tech nach dem Merge von M10 (Code-Fakten gegen main
mit Save v5); `docs/m11-design` geht mit dem Plan nach main. — Kosten bei Irrtum: AK-Nachtrag im Gate Plan.

Entscheider: L0 · Anlass: Fix-Bericht lead-design M11-SPEC · ADR: —

## R190 · 2026-10-03 · Retros M10: Experimente

Ruling: Auf Basis Meilenstein-Retro M10 und Prozess-Retro M10: (1) E-011 behalten, E-013 behalten → beide
abgeschlossen. (2) E-010 angepasst, läuft über M11 mit unveränderten Schwellen; eingegliedert wird der
Vorschlag E-016 (Lead-Instanz übergibt spätestens bei 200k Kontext oder nach 6 Arbeiter-Starts) und das
Gate-Kriterium „Spec ≤ 40 KB" in der lead-qa-Prüfung. (3) E-015 startet jetzt (Platz frei, R180). (4) E-017
angenommen und gestartet, zusammengeführt mit Prozessvorschlag V1: Doku (README, arc42, ADR, Spec-Verweise) ist
im Plan ein eigener Task mit Eigentümer, und das Umsetzer-Briefing erlaubt D1-Dateien ausdrücklich; Messung M11:
0 Final-Reviews mit fehlender Doku. (5) Vorgeschlagen, wartend: E-018 (Blindtest-Probe-Dateien erst nach dem
Urteil, Rater im Paketbudget), V3 (Parallelität aus Dateimatrix), V5 (Nachführaufwand Parallelstrang als
Berichtszeile). V4 abgelehnt (V2/E-015 deckt die Ursache). Laufend danach: E-010, E-015, E-017. Handbuch 1.14
durch studio-coach. — Kosten bei Irrtum: ein Experiment länger als nötig.

Entscheider: L0 · Anlass: `retros/2026-10-03-meilenstein-m10.md`, `retros/2026-10-03-prozess-retro-m10.md` · ADR: —

## R191 · 2026-10-03 · Gate Merge H-R6 Sprite-Cache

Ruling: Gate Merge H-R6 bestanden (`feat/h-r6-sprite-cache` @ cb7a10b; Rot-Beleg vorhanden, Review BEDENKEN →
Fix → Nachprüfung derselben Instanz OK, E-015 erfüllt). renderMedian −55 % (3,1 → 1,4 ms), Speicher ≤ 6 MB.
Pixelabweichung an 1-px-Kanten (Ganzpixel-Stempel) als niedrig angenommen. Auflage: Sichtvergleich DPR 2 und
Zoom 0,75/1,5 wird Pflicht-AK im nächsten Häppchen H-R7 (G1 + G8, Varianz und Material). Merge durch
production-integrator. — Kosten bei Irrtum: Revert-Merge oder Kantenfix in H-R7.

Entscheider: L0 · Anlass: Bericht lead-art H-R6 · ADR: —

## R192 · 2026-10-03 · Gate Plan M11

Ruling: Gate Plan M11 bestanden (`docs/m11-design` @ 3e5a387; Spec @ e784388). lead-production und lead-qa je
BEDENKEN ohne ZURÜCK; Fix-Runde erledigt (Basis 4a5130e auf `src/sim`, R2 blocked-by H-R7, Cache-Schlüssel mit
Variante/Material/`level`, Playtester-Port und Teardown, Rotliste im Ledger, Budget 52). P-12 zulässig:
Mutationsproben als Rot-Beleg für bestandsmessende Tests mit Befehl, roter Meldung und Rücknahme im Bericht,
`git diff -- src` danach leer, Reviewer prüft. Spec-Entscheid lead-design: Nahrungsverkauf mit kleinem
Grenzgewinn gewollt (13-15). Budget gestuft: Stufe 1 lead-tech 11 (C1: T00–T03), lead-art 3 (R1); Stufe 2 nach
Pin-Prüfung T03. Branch `docs/m11-design` geht vorher per Merge nach main. Befund an die Retro: Plan-Instanz lief
über den E-010-Deckel (225k) für die Fix-Runde. — Kosten bei Irrtum: Plan-Nachtrag in einer Controller-Instanz.

Entscheider: L0 · Anlass: Gate-Urteile lead-production und lead-qa M11-PLAN · ADR: —

## R193 · 2026-10-03 · M11 Stufe 1 abgenommen, Stufe 2 frei

Ruling: Abgenommen: T00–T02 (C1, `feat/m11-sim` @ 7363cb0), T03 Neupin (C2, @ b69557c; alle Haupt-Pins gleich
Spec 14, Mutationsproben nach P-12, Nachprüfung derselben Reviewer-Instanz, make check grün) und R1 Ring/Marke
(lead-art, `feat/m11-render` @ 3de65ab; Doku-Anteil kollidiert ggf. mit D1, Integrator-Merge regelt das). Stufe 2
frei: C2 setzt mit T10 (+ QA-UI) per Fortsetzung fort (Rest 3 Starts M11-C1); C3 (T04–T06, `feat/m11-sources`,
6 Starts) und C4 (T07–T08, `feat/m11-upgrade`, 4 Starts) starten parallel ab b69557c. `stash@{0}` im Worktree
`m11-sim` bleibt liegen (nur Kopien, §6). Ablauffehler L0: Push trotz rotem prettier-Check (Verkettung mit `;`),
sofort mit 7d588a2 behoben → Retro. — Kosten bei Irrtum: Merge-Konflikte W4, durch Ownership-Matrix begrenzt.

Entscheider: L0 · Anlass: Berichte C1, C2, lead-art M11-R1 · ADR: —

## R194 · 2026-10-03 · M11 W4 abgenommen, AK-P2S2-01

Ruling: Abgenommen: T10 (C2, `feat/m11-ui` @ d268c12), T04–T06 (C3, `feat/m11-sources` @ 3d12868), T07–T08 (C4,
`feat/m11-upgrade` @ ed4fa1b); jeweils Review OK ohne Fix-Runde, Pins bitgleich T03. Der von C3 gemeldete
„Spec-Widerspruch" bei `GOODS.food.sell` ist durch Spec 13-15 (R192, Grenzgewinn gewollt) erledigt; die
Task-Datei T04b trug noch den alten Wortlaut. Auflage für C5/T09: AK-P2S2-01 um die zwei Aussagen der Spec
ergänzen (Grenzgewinn `sell` − Unterhalt > 0 je Quelle; `sellPrice(w, 'food', 100)` = 164 < 200), Rot-Beleg per
Mutationsprobe. C5 startet: T09 (merge sources + upgrade in `feat/m11-sim`) und B1 (`feat/m11-scen`), 4 Starts.
— Kosten bei Irrtum: ein Testnachtrag.

Entscheider: L0 · Anlass: Berichte C2, C3, C4 · ADR: —

## R195 · 2026-10-03 · Gate Merge H-R7 Varianz und Material

Ruling: Gate Merge H-R7 (G1 + G8) bestanden (`feat/h-r7-varianz` @ 9233c35; Rot-Belege je Runde, Review
ZURÜCK → BEDENKEN → OK durch dieselbe Instanz, E-015 erfüllt). renderMedian innerhalb +10 %; R191-Pflicht
Sichtvergleich erfüllt (Stempelversatz < 0,5 Geräte-Pixel, Ursache doppeltes Runden, kein Fix ohne gerasterte
Kamera). Blindtest mit Vorbehalt (Rater 2 nicht verwertbar); Silhouetten durch Tests und Rater 1 belegt. Schwache
Typ-Erkennung kleiner Bauten (Weberei, Fischerhütte, Schule, Feuerwache) bestand schon auf main → Auflage für
M11-R2/K3: Silhouetten-Abgrenzung kleiner Bauten prüfen. `lineJoin='round'` an spitzen Dachwinkeln angenommen,
umgesetzt im nächsten Render-Häppchen H-R8 (G3 Felsmassive) mit neuen Referenz-Hashes für Variante 0. Merge durch
production-integrator; H-R7 ist Vorbedingung für M11-R2 (R192). — Kosten bei Irrtum: Revert-Merge.

Entscheider: L0 · Anlass: Bericht lead-art H-R7 · ADR: —

## R196 · 2026-10-03 · M11 T09/B1, Entscheid M-15

Ruling: T09 abgenommen (`feat/m11-sim` @ 7164dc4; Review OK, Rot-Belege inkl. R194-Mutationsprobe, Pins bitgleich
T03). B1 (`feat/m11-scen` @ 2b43e9d) offen nur wegen M-15/AK-M11B-01. D-C5-M15 entschieden wie empfohlen: Die
Fischer-Ausbau-Variante darf Werkzeug kaufen; M-15 wird als Messung gepinnt (Sieg 8250, minMoney 71, 11 Fischer
Stufe 2, nach Nachmessung durch den Reviewer); die Siegschwelle 6750 gilt nur für den Lauf ohne Ausbau. Kein
Eingriff in die Controller-Reserven (R74 bleibt). Balancing-Signal „Ausbau lohnt im Referenzpfad nicht" geht an
lead-design für M11-Abschluss/M12 (beobachtungen.md, kein Nutzervorbehalt). `stash@{0}` in `m11-sim` bleibt
(§6). C6 (T11, T12) startet parallel ab T09; `feat/m11-scen` erst nach B1-Fix holen. — Kosten bei Irrtum:
Neupin M-15.

Entscheider: L0 · Anlass: Bericht C5 (D-C5-M15) · ADR: —

## R197 · 2026-10-03 · M11 R2, T11, T12 abgenommen

Ruling: Abgenommen: R2 (lead-art, `feat/m11-render` @ ae72549; Blindtest 22/22 mit Unsicherheiten, Cache-Schranke
1,25 mit LRU 64 MB angenommen), T11 und T12 (C6, `feat/m11-ui` @ 09a7c1a; Review BEDENKEN → Fix → Nachprüfung
OK, QA-UI bestanden). Rinderfarm ohne Taste bleibt (Plan orga-02 E6, Ziffern = Tempo). Offen für C7/Final-QA:
AK-RND-05 Szenenteil und Sichtbarkeit Stufe 2 bei 1280 px mit B1-Szenen (bei Bedarf kräftigerer Aufsatz,
Fix-Runde lead-art); renderMedian mit Save inkl. neuer Typen; Holzfäller zeigt bei „Kein freier Wald" 95 %
Auslastung (prüfen, Trivial-Fix wenn Anzeige, sonst Befund); flakiger Test (zweimal gesehen, Name unbekannt) →
C7 lässt `make check` mehrfach laufen und benennt ihn. C7 startet: Integrations-Merges, D1, Trivial-Fixes. —
Kosten bei Irrtum: eine weitere Fix-Runde vor dem Gate Merge.

Entscheider: L0 · Anlass: Berichte lead-art M11-R2, C6 · ADR: —

## R198 · 2026-10-03 · Gate Merge Studio-Werkzeug

Ruling: Gate Merge `feat/studio-tools` @ ab14014 bestanden (Budget-Alarm je Freigabe-Phase und ohne Heartbeat-
Knoten, leere Paket-ID auf dem Board unterbunden; Rot-Beleg, Review BEDENKEN → Fix → Nachprüfung derselben Instanz
OK). `log.py result --package` und `metrics.py --efficiency`/„Tokens je Agent" waren schon vorhanden → in state.md
als erledigt führen. Rest-Alarme (M10-S1C 4/3, lead-art Parallelität) sind echte Überschreitungen bzw. Mass der
Parallelität, keine Zählfehler. Merge durch production-integrator. Regel für L0 (Ablauffehler R196/f8f234e): kein
eigener Commit im Hauptcheckout, solange ein Integrator dort arbeitet. — Kosten bei Irrtum: Revert-Merge.

Entscheider: L0 · Anlass: Bericht lead-production STUDIO-WERKZEUG · ADR: —

## R199 · 2026-10-03 · Final-Review M11, Auflagen

Ruling: Final-Review M11 (opus) BEDENKEN, kein blockierender Befund; QA-UI W7 bestanden. (1) renderMedian
+0,4 ms (0,9 → 1,3 ms, +44 % relativ) per Ausnahme angenommen: Massstab für M11 ist die Absolutgrenze 8 ms;
die +10 %-Schranke aus R195 galt nur H-R7. (2) Stufe 3 zu schwach von Stufe 2 unterscheidbar → Fix-Runde lead-art
auf `feat/m11-render` (deutlichere Stufenkennung), danach Merge in `feat/m11-ui` durch C7. (3) Doku-Nachträge
(orga-12, abdeckung.md, README Stein-Aufpreis) und Beobachtungen als Trivial-Fix durch C7. Gate Merge M11 nach
Bericht beider Fixes und grünem make check ohne erneutes Final-Review (Diff-Sichtung L0). Ampel gelb: keine neue
Welle bis zum Session-Ende; H-R8 läuft zu Ende. — Kosten bei Irrtum: Nachbesserung Stufenkennung in M12.

Entscheider: L0 · Anlass: Bericht lead-qa M11-QA · ADR: —

## R200 · 2026-10-03 · Gate Merge M11

Ruling: Gate Merge M11 „Wirtschaft im Fluss" bestanden: `feat/m11-ui` @ f19db1a (enthält sim, sources, upgrade,
scen, render). Final-Review (opus) BEDENKEN ohne Blocker, QA-UI W7 bestanden; Auflagen R199 erfüllt: Stufe-3-Kennung
(b928b9a, Rot-Beleg, Nachprüfung OK, Sichtprobe), Doku-Nachträge (39984a4). Diff seit Final-Review von L0 gesichtet
(6 Dateien: README, beobachtungen, abdeckung, orga-12, sprites.ts + Test; keine Konfliktmarker). Merge seriell durch
lead-production/production-integrator (`--no-ff`, make check, CI, Pages), danach Meilenstein M11 beenden. Retros
M11 am Session-Ende. — Kosten bei Irrtum: Revert-Merge (Save v6 ist abwärts migrierend, alte Stände laden weiter).

Entscheider: L0 · Anlass: Berichte lead-qa M11-QA, lead-art R2-Fix, C7 · ADR: —

## R201 · 2026-10-03 · Retros M11: Experimente

Ruling: (1) E-010 „Schlanke Steuerung" behalten → abgeschlossen (M11: Steuerung 29,8 %, Lead-Median 61k; Restgrössen
Cache-Write, grösste Datei, L0-Max werden in M12 ohne Experiment beobachtet). (2) E-022 angenommen und gestartet,
erweitert um Prozessvorschlag 1 zu „Merge-Hygiene": `.gitattributes` `docs/beobachtungen.md merge=union` und der
production-integrator mergt in einem eigenen Worktree statt im Hauptcheckout (`git worktree add` auf main, Push von
dort); Messung M12: 0 Konflikte in beobachtungen.md, 0 Vorfälle durch geteilten Arbeitsbaum. (3) E-015 und E-017
laufen weiter bis M12. (4) Vorgeschlagen, wartend: E-019 (erweitert um Abhängigkeits-Prüfung im Gate Plan und
Task-Datei-Nachzug nach Rulings), Sicherung des letzten roten Testlaufs (Werkzeug, lead-production), Wellen-Zuschnitt
nach Dauer als Hinweis. Laufend danach: E-015, E-017, E-022. Handbuch 1.15 durch studio-coach. — Kosten bei Irrtum:
union-Merge kann Dubletten erzeugen (Sichtprüfung im Review).

Entscheider: L0 · Anlass: `retros/2026-10-03-meilenstein-m11.md`, `retros/2026-10-03-prozess-retro-m11.md` · ADR: —

## R202 · 2026-10-03 · Gate Merge H-R8 Felsmassive

Ruling: Gate Merge H-R8 (G3 Felsmassive + `lineJoin='round'`) bestanden (`feat/h-r8-felsen` @ 5e07b21; Rot-Belege
71067fe/2e8ad51, Tiefensortierung nur Property-Test ohne echten Rot-Beleg — vom Reviewer als ausreichend bewertet;
5 Review-Runden mit Nachprüfung derselben Instanz, zuletzt OK). renderMedian gegen main gleichauf; 18 von 20
Variante-0-Hashes bewusst geändert (R195). Blindtest Note 3 („Gebirge", pyramidenhaft/lückig) → Feinschliff als
Beobachtung für M9-Rest. Befund: Render-Basis nach M11 bei 1920×1080/DPR 2 rund 4,0 ms → Messung für M12 neu
aufsetzen (gleiche Bedingungen wie R199). Einmaliger `make check`-Exit 2 (dritte Sichtung flakiger Test) stützt
E-023. Merge durch production-integrator im eigenen Worktree (E-022, Handbuch 1.15). — Kosten bei Irrtum: Revert-Merge.

Entscheider: L0 · Anlass: Bericht lead-art H-R8 · ADR: —

## R203 · 2026-10-03 · Session-Ende 9b13950a

Ruling: Session-Ende wegen L0-Kontext über 25 % (E-010-Regel) nach abgeschlossenem Gate-Block; alle Pakete
fertig, keine offenen Freigaben. Kurz-Retro `retros/2026-10-03-session-9b13950a.md`: Vorschläge E-025, E-023,
E-026 warten auf Platz (E-015, E-017, E-022 laufen bis M12). lernen.md um zwei Zeilen ergänzt (429-Fortsetzung,
Prüfung ohne Pipe). Nächste Session: M12 „Weite Welt" Brainstorming, parallel M9-Rest-Häppchen. — Kosten bei
Irrtum: keine.

Entscheider: L0 · Anlass: Session-Ende-Routine · ADR: —

## R204 · 2026-10-03 · Nutzerauftrag Gebirge, Relief, Kontor am Meer

Ruling: Auslegung in zwei parallelen Häppchen (Stufe leicht). **H-S1** (lead-tech, `src/sim/mapgen.ts`): Kontor
nur an Meerwasser (mit dem Kartenrand verbundenes Wasser), Gebirgsflecken unter einer Mindestgrösse werden Wiese,
Mindestgrösse als Wert in `src/sim/defs/`; Kartenänderung bewusst, Balancing grün. **H-R9** (lead-art, `src/render/`):
grosse Gebirge als zusammenhängende Grossgrafik, Mikrorelief (Hügel) in Wiese und Strand, mehr Wiesenvarianz;
kleine Flecken alter Spielstände dürfen nicht kaputt aussehen. Merge H-S1 vor H-R9. — Kosten bei Irrtum: Revert je
Häppchen; alte Spielstände unberührt (Kacheln im Save).

Entscheider: L0 · Anlass: Nutzerauftrag 2026-10-03, Beobachtung H-R8 Bergoptik · ADR: —

## R205 · 2026-10-03 · Gate Merge H-S1 Kartenerzeugung

Ruling: Gate Merge H-S1 bestanden (`feat/h-s1-kartengen` @ fca5fa7; Rot-Beleg e70d540, Final-Review OK, `make check`
grün, Balancing unverändert). Kontor nur am Meer (vorher 66 von 200 Seeds am Binnensee), `MIN_MOUNTAIN_PATCH = 12`
in `src/sim/defs/map.ts`. Merge durch production-integrator im eigenen Worktree, vor H-R9. — Kosten bei Irrtum:
Revert-Merge; alte Spielstände unberührt.

Entscheider: L0 · Anlass: Bericht lead-tech H-S1 · ADR: —

## R206 · 2026-10-03 · Gate Merge H-R9 Gebirge und Relief

Ruling: Gate Merge H-R9 bestanden (`feat/h-r9-relief` @ 0e9110c; Review OK, Playtest OK, `make check` grün,
renderMedian +1,8 %). Abweichungen angenommen: Schuttband im Gebirgszweig, Rasterfaktor ≤ 2, Alpha-Rand der Sockel.
Erstbild-Rasterung ~130 ms beim grössten Massiv und dezente Wiese bei Zoom 1 → Beobachtung; Stilurteil beim Nutzer
im Spiel. Merge durch production-integrator nach H-S1. — Kosten bei Irrtum: Revert-Merge.

Entscheider: L0 · Anlass: Bericht lead-art H-R9 · ADR: —

## R207 · 2026-10-04 · Nutzerfeedback Kreativität, Tempo, Löschrechte

Ruling: Auslegung als drei Prozessaufträge. (1) **Kreativabteilung:** Das Studio soll von sich aus Funktionen
(Inhalt, Grafik, Ton, Bedienung …) vorschlagen, bewerten und einplanen oder verwerfen; die Form (Rolle, Takt,
Ideen-Pool, Bewertungsraster, Entscheidweg) erarbeitet `studio-process-coach` auf Datenbasis als Experiment,
L0 entscheidet. Richtungswechsel (Titel, Genre, Kernsäulen) bleiben Vorbehalt des Nutzers (Verfassung §5.3).
(2) **Tempo / Release-Bündel:** Kleine Änderungen werden gebündelt integriert und gemeinsam getestet
(Browser-QA und Nutzer-Playtest je Release statt je Häppchen); §9 bleibt unberührt (Review je Task, QA mit
Screenshots je UI-Task, `make check` vor jedem Merge). Zuschnitt und Messgrösse liefert `studio-process-coach`.
(3) **Löschrechte:** Löschen im Repo (`rm`, `rmdir`, `unlink`, `git rm`) braucht keine manuelle Freigabe mehr
(Allow-Regeln in `.claude/settings.json`); der Guard verbietet Löschen ausserhalb von Repo und Temp weiterhin
(§6.4), Repo-Wurzel und `.git` bleiben geschützt. Zweck der Anweisung: das Spiel entwickelt sich schneller und
eigenständiger weiter, ohne dass der Nutzer Routine-Freigaben gibt; die Auslegung widerspricht ihm nicht, weil
sie Freigaben im Repo abbaut und nur die Verfassungsgrenzen stehen lässt. — Kosten bei Irrtum: Experimente
zurücknehmen; Allow-Regeln entfernen.

Entscheider: L0 · Anlass: Nutzerfeedback 2026-10-04 · ADR: —

## R208 · 2026-10-04 · Prozess-Retro Kreativität und Tempo angenommen

Ruling: Vorschläge V1–V4 der Prozess-Retro `retros/2026-10-04-prozess-kreativitaet-tempo.md` angenommen.
(V4) E-015 und E-017 abgeschlossen, beide **behalten**; E-022 läuft weiter. (V1) **E-028 Release-Bündel** startet
heute: Häppchen werden nach Review und Abnahme „release-reif", 2–4 je Release (Auslöser 3 reif, Session-Ende oder
Meilenstein-Merge; Hotfix einzeln), ein Kandidat, ein Browser-Lauf mit eigenem Screenshot-Abschnitt je UI-Task,
ein opus-Review über den Kandidaten, ein Gate Merge Release, ein Nutzer-Playtest mit Release-Notiz; nächstes
Häppchen startet nach Review-OK. (V2) **E-027 Discovery-Strang** startet heute: `lead-design` verantwortet
Ideen-Runden (`IDEEN-nn`) mit neuem L2 `design-idea-scout` (ersetzt den Abruf-Platzhalter
`design-genre-researcher`), Pool `docs/ideen.md`, Raster und ein reservierter Studio-Platz je Release; je Runde
≤ 2 Starts, ≤ 80 Tools. (V3) Bildziel-Zeile in `lernen.md`. Die übrigen vorgeschlagenen Experimente rücken nach
hinten. Umsetzung: `studio-coach` (Handbuch 1.16, gates, Integrator/Playtester, Vorlage, experimente, lernen,
CHANGELOG), `lead-production` (Onboarding Scout, roster, lead-design, `docs/ideen.md`). — Kosten bei Irrtum:
Rückfallzustände laut E-027/E-028.

Entscheider: L0 · Anlass: Bericht studio-process-coach P-R207 · ADR: —

## R209 · 2026-10-04 · Nutzerurteil H-R9 und Auftrag Stil-Einheit

Ruling: Nutzerurteil zu H-R9: Gebirge gelungen („sieht wie ein echtes Gebirge aus"). N-94 beantwortet: Löschen
ausserhalb des Repos bleibt verboten. Neuer Auftrag, ausgelegt als Art-Strang unter `lead-art` in zwei Phasen:
(1) **ART-STIL-01** Stil-Diagnose und Stilrahmen: Bestandsaufnahme, warum Terrains (Wiese, Wald, Strand/Dünen,
Wasser, Gebirge) und Häuser stilistisch nicht zusammenpassen; ein knapper Stilrahmen (Lichtrichtung, Palette und
Sättigung, Kontur, Detaildichte und Massstab, Relief-Sprache) mit Bildziel je Element (lernen.md, Bildziel vor
Code) und Zuschnitt in Häppchen für ein Release (E-028). Das Gebirge aus H-R9 ist Referenz, an der sich die übrigen
Terrains orientieren. (2) Umsetzung der Häppchen nach Gate: Relief/Unebenheiten für die übrigen Terrains, Dünen neu,
Angleichung der Häuser an den Stilrahmen. Zweck: ein stimmiges Gesamtbild; die Auslegung widerspricht ihm nicht,
weil sie vor dem Code die gemeinsame Richtung festlegt, statt Terrain für Terrain nachzubessern (H-R7…H-R9: 3–5
Review-Runden). — Kosten bei Irrtum: Phase 1 ist reine Analyse (~1 Lead-Instanz); Häppchen einzeln revertierbar.

Entscheider: L0 · Anlass: Nutzerfeedback 2026-10-04 · ADR: —

## R210 · 2026-10-04 · Gate Ideen-Runde IDEEN-01

Ruling: Erste Ideen-Runde (E-027) entschieden. **I-002 „Meldung führt zum Ort"** eingeplant als H-U2 auf dem
Studio-Platz von REL-01 (nur UI, ohne Risiko). **I-001 „Anbinden auf Knopfdruck"** eingeplant als H-U1 fürs
übernächste Release (Sim+UI, Randfälle kein Pfad / zu wenig Geld / Flächenverbrauch in die Kurz-Spec). I-003
„Baustelle" geparkt bis zum Stilrahmen ART-STIL-01; I-004 „Lagerhaus" geparkt fürs M12-Brainstorming; I-005
„Arbeitsgeräusche" geparkt, kleine Fassung bei freiem Studio-Platz. Befund: Playtest-Ordner enthalten keine
Textberichte als Ideen-Quelle → Beobachtung. — Kosten bei Irrtum: Häppchen nicht starten; Nutzer-Einwand →
Ruling „verwerfen".

Entscheider: L0 · Anlass: Bericht lead-design IDEEN-01 · ADR: —

## R211 · 2026-10-04 · Gate Stilrahmen und Inhalt REL-01

Ruling: Stilrahmen `specs/2026-10-04-stilrahmen.md` (S1–S6, Gebirge H-R9 als Referenz, Bildziele §3,
Performance-Budget §5) freigegeben. **REL-01 „Aus einem Guss"** = H-U2 (release-reif @ b3d17f8) + H-R10 (Ein Licht
für Häuser und Bäume) + H-R11 (Bodenrelief Wiese und Wald) + H-R12 (Dünen neu); damit ist die Höchstgrösse 4
erreicht, H-R13 (Vorberge) ist erstes Häppchen von REL-02. Steuerung: zwei lead-art-Instanzen — A: H-R10;
B: H-R11 und H-R12 (Eigentum `terrain.ts`; H-R12-Kern `dunes.ts` parallel, Andocken auf der H-R11-Branch nach
deren Review-OK, E-028 Konfliktregel 2). Je Häppchen höchstens 2 Bild-Fix-Runden; danach meldet der Lead an L0.
Release-Gate verlangt Galerie 01–15 vorher/nachher, A/B-Perf-Delta, Blindtest Häuser und die UI-Prüfpunkte von
H-U2. — Kosten bei Irrtum: Häppchen fliegt aus dem Kandidaten; main unberührt bis Gate Merge Release.

Entscheider: L0 · Anlass: Bericht lead-art ART-STIL-01 · ADR: —

## R212 · 2026-10-04 · Guard-Erweiterung N-92 und N-93

Ruling: Nutzerfreigabe „VERFASSUNG ÄNDERN" (Hauptsession 2026-10-04) für N-92 und N-93 umgesetzt, durch L0 selbst,
weil die Freigabe nur für die Hauptsession gilt (Verfassung §1.3). Guard sperrt zusätzlich `git pull --rebase`,
`-r`, `--rebase=<an>`, `git config pull.rebase|branch.<x>.rebase <an>` und `git -c pull.rebase=<an>` (§6.3) sowie
Agent/Task-Starts als `general-purpose` mit Kopfzeile `Persona:` ohne `model` (R167). Tests zuerst rot, dann grün;
unabhängiges Review durch qa-code-reviewer (§9.1). Handbuch 1.17. — Kosten bei Irrtum: Revert des Commits; der
Guard wird nur strenger.

Entscheider: L0 · Anlass: Nutzerfreigabe N-92/N-93 · ADR: —

## R213 · 2026-10-04 · REL-01 Auslösung, lastPatchMs-Abweichung

Ruling: Alle vier Häppchen von REL-01 release-reif (H-U2 @ b3d17f8, H-R10 @ b9bedd4, H-R11 @ b548f8c in H-R12
@ 794d0d9). Release-Lauf REL-01 ausgelöst (gates.md „Gate Merge Release"). Abweichung angenommen: `lastPatchMs`
H-R11+H-R12 zusammen ≈ +50 % (je Häppchen ≤ +30 % eingehalten, §5 nennt keine Gesamtgrenze); Kosten fallen nur je
Bau-/Rodeaktion an, `renderMedian` −0,2 ms, `buildMs` +32 % (Budget 50 %). Für H-R13 bleibt kaum Luft → vor H-R13
Patch-Pfad messen. Aufwand H-R11/H-R12 ≈ 570 Tools (Selbstangabe) gegen Schätzung 250 → Befund für die
Session-Retro. — Kosten bei Irrtum: Häppchen fliegt aus dem Kandidaten, Kandidat frisch aufbauen.

Entscheider: L0 · Anlass: Berichte lead-art H-R10, H-R11/H-R12 · ADR: —

## R214 · 2026-10-04 · REL-01 Dünen-Stufenkanten: Extra-Fix-Runde mit Rückfall

Ruling: Release-Lauf REL-01: H-U2, H-R10, H-R11 OK; opus-Review BEDENKEN (nur arc42, behoben in
`docs/rel-01-arc42` @ 9d5205e). Playtest-Befund hoch zu H-R12: Dünen mit rechtwinkligen Stufenkanten entlang des
Kachelrasters bei Seed 2 und 5 (`.studio/qa/REL-01/h-r12/seed2-z2.png`, `seed5-z1.png`). Da der Nutzer die Dünen
ausdrücklich bemängelt hat, geht H-R12 so nicht live. Ausnahme von R211 (höchstens 2 Bild-Fix-Runden): **eine**
gezielte dritte Runde nur für die Kachelkanten, Deckel ≈ 60 Tools, mit Delta-Review und Nachweis auf Seed 1/2/3/5.
Rückfall, falls der Deckel reisst oder der Nachweis fehlt: REL-01 mit `feat/h-r11-relief` statt `feat/h-r12-duenen`,
Dünen ins REL-02. In beiden Fällen wird der Kandidat frisch aufgebaut (gates.md), dazu `docs/rel-01-arc42`. — Kosten
bei Irrtum: Verzögerung von REL-01 um eine Fix-Runde.

Entscheider: L0 · Anlass: Playtest-Report REL-01, opus-Review REL-01 · ADR: —

## R215 · 2026-10-04 · REL-01 Rückfall ohne neue Dünen

Ruling: Die Extra-Fix-Runde H-R12 (R214) hat das Ziel verfehlt (Stufenkanten auf Seed 2 schwächer, aber sichtbar;
Deckel 60 Tools mit ≈ 125 gerissen; Zwischenstand `feat/h-r12-duenen` @ 14fd4cf ohne Delta-Review, nicht
release-reif). Rückfall greift: **REL-01 = H-U2 + H-R10 + H-R11 (`feat/h-r11-relief` @ b548f8c) + Doku**. Dünen
bleiben auf main-Stand; H-R12 wird erstes Häppchen von REL-02 auf 14fd4cf (stetige Strandbreite und Maske, ≈ 60
Tools, Lead verlangt Zwischenstand bei halbem Deckel). `docs/rel-01-arc42` wird um dunes.ts und `sandRest`
bereinigt. Kandidat frisch aufbauen, Delta-Browser-Lauf (Sand/Strand-Regression, Smoke H-U2/H-R10/H-R11), dann
Gate. Vorfall „Agent gescheitert" geht in die Session-Retro. — Kosten bei Irrtum: REL-01 ohne Dünen-Verbesserung;
Nutzerpunkt Dünen offen bis REL-02.

Entscheider: L0 · Anlass: Bericht lead-art H-R12 Fix 3 · ADR: —

## R216 · 2026-10-04 · Gate Merge Release REL-01

Ruling: Gate Merge Release REL-01 bestanden. Kandidat `rel/rel-01b` @ e19b44d (H-U2 c6b64de, H-R10 c31d9b5, H-R11
4740b26, Doku e19b44d) auf origin/main 3da4cb2; `make check` nach jedem Merge grün; opus-Review lead-qa über den
Obermengen-Kandidaten (BEDENKEN nur arc42, behoben in `docs/rel-01b-arc42`); Browser-Lauf REL-01 und Delta-Lauf
REL-01b OK. Prüfliste UI-Task → Screenshot: H-U2 `.studio/qa/REL-01b/h-u2/` (+ REL-01/h-u2), H-R10
`.studio/qa/REL-01/gal/05,06,11,12`, H-R11 `.studio/qa/REL-01/gal/01–06,13`, Sand-Regression
`.studio/qa/REL-01b/seeds/`. Push durch production-integrator `HEAD:main`, danach CI und Pages. — Kosten bei
Irrtum: Revert-Merge der vier Merge-Commits.

Entscheider: L0 · Anlass: Playtest REL-01b, opus-Review REL-01 · ADR: —

## R217 · 2026-10-04 · Session-Retro e13c3631

Ruling: Vorschläge der Kurz-Retro `retros/2026-10-04-session-e13c3631.md`: **V1** (Zwischenstand bei halbem
Deckel) und **V2** (Optik-Schätzfaktor ×2 plus eine Bild-Fix-Runde) angenommen als lernen.md-Regeln ohne
Experiment-Platz (Plätze voll); Wirkung prüft die nächste Retro an H-R12/H-R13. **V3** angenommen: lead-production
lässt `log.py retro` bei `--kind meilenstein` ohne `meilenstein:`-Trigger warnen (Werkzeug, nächste Session).
**V4** angenommen, Option (a): AK-R1-06 bekommt im CI eine Schwelle ×1,5 (lokal 1500 ms), als Häppchen H-T1 in
REL-02; Schutz bleibt das A/B-Perf-Delta im Release-Gate (R211). Offener Alarm `budget:lead-production:M5-01-merge`
bleibt bis Beleg. — Kosten bei Irrtum: lernen.md-Zeilen streichen; Schwelle zurücksetzen.

Entscheider: L0 · Anlass: Bericht studio-coach RETRO-S-2026-10-04 · ADR: —

## R218 · 2026-10-04 · Auftrag „mach weiter": REL-02 und IDEEN-02

Ruling: Auslegung „mach weiter" als Fortsetzung von state.md in derselben Session (Nutzerwunsch geht der
L0-Übergaberegel E-010 bei 25 % Kontext vor; L0 hält Briefings knapp). **REL-02** = H-R12 Dünen (auf 14fd4cf),
H-R13 Vorberge (seriell nach H-R12, gleiche Instanz, Eigentum `terrain.ts`/`dunes.ts`/`massif.ts`), H-R14
S4-Rest Schiff/Figuren/Effekte (`ship.ts`, `life.ts`, `fx.ts`, `overlays.ts`), H-T1 Zeit-Test AK-R1-06
CI-Schwelle ×1,5 (nur diese Testzeile plus Helfer; R217 V4). Schätzungen mit Optik-Faktor ×2 (R217 V2),
Zwischenstand bei halbem Deckel (V1). Parallel: **IDEEN-02** (E-027, fällig nach Release-Merge REL-01) und
Werkzeug V3 + Leerlauf-Ereignis E-028 (lead-production). M12-Brainstorming folgt nach REL-02. — Kosten bei
Irrtum: Häppchen einzeln verwerfbar; main unberührt bis Gate Merge Release.

Entscheider: L0 · Anlass: Nutzer „ok, mach weiter" · ADR: —

## R219 · 2026-10-04 · Gate Ideen-Runde IDEEN-02, Zuschnitt REL-02

Ruling: IDEEN-02 entschieden. **I-009 „Hörbarer Mangel"** zusammen mit der kleinen Fassung von **I-005** (Ton je
Produktionszyklus) als Häppchen **H-A2 „Hörbare Wirtschaft"** auf dem Studio-Platz von REL-02 (lead-art/Audio,
`src/audio/`, `src/ui/soundEvents.ts`; dateifrei zu den Grafik-Häppchen). **I-007 „Fest in der Kapelle"**
eingeplant auf dem Studio-Platz von REL-04 (REL-03 trägt H-U1; Save-Feld mit Migration, Abklingzeit, Werte in
`src/sim/defs/`). I-006 und I-008 geparkt fürs M12-Brainstorming (Handel bzw. Wirtschaft). Zuschnitt angepasst:
**REL-02 = H-R12, H-R13, H-R14, H-A2**; H-T1 (Zeit-Test) und W-V3 (Studio-Werkzeug) sind keine Spieländerungen und
gehen als Werkzeug-Merge ausserhalb des Release (Review + `make check`, kein Browser-Lauf nötig), damit main nicht
weiter flaky rot wird. — Kosten bei Irrtum: H-A2 einzeln verwerfbar; Ideen-Status in docs/ideen.md änderbar.

Entscheider: L0 · Anlass: Bericht lead-design IDEEN-02 · ADR: —

## R220 · 2026-10-04 · Gate Werkzeug-Merge H-T1 und W-V3

Ruling: Werkzeug-Merge ausserhalb des Release (R219) freigegeben: `fix/h-t1-zeittest` @ 01302f5 (AK-R1-06 CI-Schwelle
×1,5 über `tests/helpers/perfBudget.ts`, Review OK, `make check` und `CI=true` grün) und `tools/w-v3` @ 0840121
(Retro-Trigger-Warnung, Leerlauf-Messung E-028, Review OK, Owner-Fix nachgeprüft am Diff, studio-test 403 grün).
Keine Spieländerung, daher kein Browser-Lauf (§9.3 betrifft UI-Tasks). Integrator mergt seriell mit `make check`
und pusht; danach CI prüfen — der erste grüne Lauf belegt H-T1 auf dem Runner. — Kosten bei Irrtum: Revert-Merge.

Entscheider: L0 · Anlass: Berichte lead-tech H-T1, lead-production W-V3 · ADR: —

## R221 · 2026-10-04 · H-R12 zurückgestellt, REL-02 ausgelöst

Ruling: H-R12 (Dünen) verfehlt erneut (Deckel 120 mit ≈ 130 gerissen; Sägezahnkante Seed 3 bei Zoom 2; buildMs
+11–14 %, lastPatchMs bis +37 % über §5). Option (a) von lead-art angenommen: H-R12 bleibt draussen, Dünen auf
main-Stand; nach REL-02 schreibt lead-art eine **neue Kurz-Spec** (Malpfad durchgehend stetig, eigenes
Perf-Budget, neue Schätzung) — kein weiterer Flickversuch auf ca6a0e1 (Branch bleibt als Material). H-R13
(Vorberge) startet später neu auf main mit dem vollen Budget (+15 % buildMs) für REL-03 neben H-U1.
**REL-02 = H-R14 (3dfe714) + H-A2 (c2a07d6)** wird jetzt ausgelöst (2 reife Häppchen, Session läuft lange; E-028
erlaubt 2–4). Wegwerf-Worktree `/private/tmp/claude-501/main-fd97634` wird entfernt. Der Nutzerpunkt „Dünen sehen
komisch aus" bleibt offen; Befund für die Retro: zwei Anläufe auf demselben Ansatz. — Kosten bei Irrtum: Dünen
später; REL-02 ohne Grafik am Boden.

Entscheider: L0 · Anlass: Bericht lead-art H-R12/H-R13 · ADR: —

## R222 · 2026-10-04 · Gate Merge Release REL-02

Ruling: Gate Merge Release REL-02 bestanden. Kandidat `rel/rel-02` @ d58560f (H-R14 a06942b, H-A2 d58560f inkl.
Prettier-Trivial-Fix an `docs/beobachtungen.md` durch den Integrator nach L0-Freigabe — union-Merge E-022 erzeugte
eine Formatabweichung) auf origin/main fd97634; `make check` nach jedem Merge grün; opus-Review lead-qa OK (nur
Low); Browser-Lauf OK. Prüfliste UI-Task → Screenshot: H-R14 `.studio/qa/REL-02/h-r14/`, H-A2
`.studio/qa/REL-02/h-a2/` (Einstellungen `08-einstellungen-effekte0.png`), Regression `.studio/qa/REL-02/gal/`.
Befund ausserhalb Scope: `renderer.ts:96` `DIM_FIRE` mit Schwarz (S1-Rest) → beobachtungen. Push durch
production-integrator `HEAD:main`. — Kosten bei Irrtum: Revert-Merge.

Entscheider: L0 · Anlass: Playtest REL-02, opus-Review REL-02 · ADR: —

## R223 · 2026-10-04 · Hotfix H-T2 weitere Zeit-Tests

Ruling: CI auf main rot bei 2bfa38c (nur Doku) durch Zeit-Test `tests/render/terrain.test.ts` „H-R9 B4 Teil-Neuzeichnung
≤ 8 ms" (Runner 9,3 ms); Folgelauf 9ff5502 grün. Vorrang nach Verfassung §7.2. **H-T2** (lead-tech, Hotfix ausserhalb
eines Release): `perfBudget` aus H-T1 auch auf H-R9 B4 und `tests/ui/hints.test.ts` AK-UX-31 (≤ 0,5 ms) anwenden,
Review, `make check`, Werkzeug-Merge durch Integrator. Ad-hoc-Retro-Anlass geht in die Session-Retro. — Kosten bei
Irrtum: Revert; echte Perf-Regressionen fängt weiter das A/B-Perf-Delta im Release-Gate (R211).

Entscheider: L0 · Anlass: CI-Lauf 37203760767 · ADR: —

## R224 · 2026-10-04 · Gate H-T2, Retro-Nachtrag Teil 2

Ruling: **H-T2** `fix/h-t2-zeittests` @ a1e2cf1 freigegeben. Das unabhängige Review (§9.1) machte L0 am Diff, weil
lead-tech den Fix selbst schrieb (3 Testzeilen + Import + Beobachtung, `make check` und `CI=true` grün laut
Bericht). Werkzeug-Merge durch den Integrator. Vorschläge des Retro-Nachtrags: (1) E-028: Auslöser bleibt 2–4,
Messgrösse 1 wird für Releases mit 2 Häppchen auf ≤ 0,5 gelesen; Leerlauf nach Ursache trennen (wartet auf L0 /
Review / frei) — studio-coach passt E-028 an. (2) Integrator macht Fix-Commits statt `--amend` (lead-production,
Persona); keine Warteschlange, weil L0 das als Arbeitsregel festlegt. (3) Zwischenstand bei halbem Deckel wird als
`log.py status --status waiting --task "Zwischenstand …"` geloggt und in der Retro gezählt. (4) Gemeldete Kandidaten
desselben Fehlermechanismus kommen ins selbe Ruling (Zuschnitt oder Beobachtung mit Frist). (5) E-027 zählt eine Idee
als eingeplant, wenn ein Ruling sie mit Release- oder M-Ziel nennt. lernen.md (41 Zeilen) kürzt der studio-coach in
der nächsten Session. — Kosten bei Irrtum: Regeln einzeln zurücknehmen.

Entscheider: L0 · Anlass: Bericht lead-tech H-T2, Retro-Nachtrag e13c3631 · ADR: —

## R225 · 2026-10-05 · „mach weiter": Plan aus state.md, REL-03 und M12 parallel

Ruling: Auslegung „mach weiter" als Fortsetzung der Nächsten Schritte aus `state.md` ohne neues Nutzerurteil zu
REL-01/REL-02 (steht aus, Punkt 2 läuft um ihn herum). Zweck der Anweisung: Fortschritt ohne Rückfrage; Auslegung
widerspricht ihm nicht, weil alle Schritte bereits geplant und freigegeben sind. Ampel grün, volle Parallelität:
(1) studio-coach setzt R224 (1)/(3)/(4)/(5) um (E-028, Zählregeln) und kürzt `lernen.md` auf ≤ 40 Zeilen;
lead-production setzt R224 (2) in der Persona `production-integrator` um. (2) **REL-03 Art-Strang** an lead-art:
H-R12 neue Kurz-Spec (R221), danach H-R13 Vorberge neu auf main und S1-Rest (`DIM_FIRE`, Audio-Gut-Schlüssel);
Reihenfolge und Parallelität nach Dateimatrix durch lead-art. (3) **REL-03 H-U1** „Anbinden auf Knopfdruck" (I-001)
an lead-tech: Kurz-Spec mit den Randfällen aus `docs/ideen.md`, Plan, Umsetzung bis release-reif. (4) **M12 „Weite
Welt"** Brainstorming an lead-design (Bausteine I-004, I-006, I-008), Ergebnis Designvorschlag für das L0-Gate.
Der Release wird erst nach Gate gebündelt; IDEEN-03 folgt nach REL-03. — Kosten bei Irrtum: Arbeit an REL-03 vor
dem Nutzerurteil zu REL-01/02 muss eventuell nachgeschärft werden.

Entscheider: L0 · Anlass: Nutzer „mach weiter" (Session 2026-10-05) · ADR: —

## R226 · 2026-10-05 · Gate Brainstorming M12 „Weite Welt"

Ruling: Gate Brainstorming M12 bestanden (Selbstprüfung lead-design OK, L0-Prüfung der fünf Fragen OK). Vorschlag
`docs/m12-brainstorming` @ a8734e0 (`docs/superpowers/specs/2026-10-05-m12-weite-welt-design.md`, Anhang 01).
Entscheide: F-01 Ansatz C „Archipel im gemeinsamen Meer", B als Streichvariante der Darstellung. F-02 Auslegung:
R90 „grössere Karte" = grössere **Welt** aus mehreren Inseln, Heimatinsel bleibt 64×64 — kein Richtungswechsel
(§5.3), geht in den Nutzerbericht, damit der Nutzer sie kippen kann. F-03 bewusster Bruch `balance-merchants`
angenommen (Gewürz 0,1 je Kaufmann, Steuer 20 → 22, Controller kauft zu, Baseline neu messen; Eskalation Steuer 24,
dann Grenze 13 000); `balance.test.ts` bleibt bitgleich. F-04 Seefahrt mit U6. F-05 I-004/I-008 geparkt, I-006 als
Kann-Häppchen E6. F-06 E0 (Inseln im Weltzustand, Save v7, bitgleich) als Werkzeug-Merge vorab. F-07 drei
Fremdinseln, Insel C zuerst streichbar. Bedenken Render-Last und Routen-Bedienung prüfen lead-art und lead-tech im
Gate Spec. Nächster Schritt: Spec durch design-spec-author (unter lead-design), E0 zuerst spezifiziert. — Kosten bei
Irrtum: Spec-Arbeit für einen verworfenen Ansatz; Rückfall auf B ohne Sim-Änderung.

Entscheider: L0 · Anlass: Bericht lead-design M12-BRAIN · ADR: —

## R227 · 2026-10-05 · Gate Spec M12 Teil E0

Ruling: Gate Spec E0 mit **BEDENKEN** bestanden (lead-tech BEDENKEN B1–B4, lead-qa BEDENKEN 1–9, kein ZURÜCK);
Spec-Stand `docs/m12-brainstorming` @ 7c706d3. **Auflagen an die Spec** (Spec-Autor, vor dem Gate Plan): Zählung in
4.8 auf ≈ 146 Zugriffe in `src/` korrigieren (B1); Schritt 0 = erster Commit der E0-Branch auf main-Stand, nicht
auf main (B2); AK-E0-04 Hash über sortiert serialisiertes JSON (QA 1); Schritt-0-Liste und Seed für AK-E0-02/-17
vervollständigen (QA 2); Referenz und Ticks für AK-E0-05 festlegen (QA 3); AK-E0-10/-11 auf alle Zeilen von R-E0-3
erweitern, AK für R-E0-4 ergänzen (QA 4); Verweis `M6:AK-B2-05/06`. **Im Plan festzulegen** (lead-tech): B3
Migration wirft nie auf Rohdaten; B4 Minimum aus 3 Läufen mit `perfBudget`; QA 5–9 (Gründe/`isSupplied`,
Einstiegspunkte Brand, N01–N20 vollständig, Timeout Lasttest, Origin des v6-Autosaves, `save.test.ts` auf v8
umstellen); Review verlangt mechanischen Diff in `tests/sim/controller.ts`. F-S1 ja mit Präzisierung (jede
Zustandsform je Merge eigene `SAVE_VERSION`, v7 ab E0-Merge eingefroren); F-S2 Pflichtfeld, keine Kompatibilitäts-
Zugriffe auf `World`; F-S3 **eigenes ADR-013 „Inselmodell im Weltzustand"** statt Nachtrag zu ADR-002; F-S4 ≤ 6 ms
nach Messung gepinnt, Verhältnis ≥ 5× hart. **Budget E0** (Plan + Umsetzung + Reviews + Final-Review): lead-tech 21
Starts, Parallelität 1, Richtwert ≈ 500 Tools. — Kosten bei Irrtum: v7 geht mit dem E0-Merge in Autosaves und ist
danach nicht mehr umkehrbar; deshalb Final-Review opus und Browser-Check AK-E0-20 vor dem Merge-Gate.

Entscheider: L0 · Anlass: Berichte lead-tech und lead-qa M12-E0-GATE-SPEC · ADR: ADR-013 (folgt)

## R228 · 2026-10-05 · Gate Spec M12 Teil E1–E6: Nachbesserung

Ruling: Gate Spec E1–E6 (Spec @ 95ed26e) **noch nicht bestanden**: lead-tech BEDENKEN B1–B6, lead-art BEDENKEN B1–B6,
lead-qa BEDENKEN A1–A8 (A1 blockend: unladbare Autosaves). Kein ZURÜCK. Nachbesserung durch design-spec-author
unter lead-design, danach **Delta-Gate durch lead-qa** (nur die Änderungen). Entscheide jetzt: (1) Ladeprüfung:
Schiff-`port` nur gültiger Inselindex, Regel „`kontorId null` ⇒ kein Gebäude" gestrichen (nur „kein Kontor");
damit ist A1 / tech-B1/B2 gelöst; Fall in AK-E2-03. (2) **Insel C gestrichen** (R226 F-07 geändert: zwei
Fremdinseln) — später hinzufügen ist billig, nach dem Merge entfernen kostet Spielerfortschritt; ≈ 9,4 MB Cache
weniger. (3) F-P9: v8 = E1; v9 = Seefahrt-Bündel E2+E3+E4 über eine Integrationsbranch, ein Merge; v10 = E6.
(4) F-P2 2 × Heimat bei Zoom 1 hart (nach Aufwärmen), F-P3 Leerlauf-Rasterung in Scheiben ≤ 8 ms, F-P4 Mindestzoom
0,125. (5) Render-Auflagen lead-art B1–B6 als AK in Anhang 02/04 (Scheiben, Messaufbau `--focus home`, Meerkante
auf `waterDeep`, Speicher ehrlich in `limits.ts`, Detailstufe ≤ 0,25 mit Viertel-Kopie, Schiffe in Tiefensortierung
mit Mindestgrösse); R4 (kein Frame > 50 ms) als AK. (6) lead-qa A2–A8 in die Spec (betroffene alte Pins mit
Meilenstein R226 F-03 zuordnen, Verhalten alter Spielstände mit Kaufleuten als AK — Spielurteil lead-design,
AK-M12-B3 „jeweils gültiger Pin", Klickzählung AK-E2-11 eindeutig, fehlende Regel-AK). (7) Auflagen für die Pläne:
lead-tech B3 (k = 0, Kamera im Startzustand, kein `replaceChildren` je Tick für Knöpfe), B4 (Migration idempotent
gegen aktuelles `GOOD_IDS`), B5 ADR-005-Nachtrag `tickShips`, B6 (`createWorld` ≤ 5 ms, `Math.sqrt`), lead-qa Teil B.
E1-Render startet erst nach dem REL-03-Merge. — Kosten bei Irrtum: eine weitere Spec-Runde; ohne (1) unladbare
Autosaves.

Entscheider: L0 · Anlass: Berichte lead-tech, lead-art, lead-qa M12-GATE-SPEC · ADR: ADR-005-Nachtrag (folgt)

## R229 · 2026-10-05 · Gate Plan M12-E0

Ruling: Gate Plan M12-E0 (`feat/m12-e0` @ 635dbae) mit **BEDENKEN** bestanden (lead-qa B1–B5, lead-production
B1–B4, kein ZURÜCK). **Plan-Nachtrag durch lead-tech vor T00** (ohne Zweitprüfung): prod-B1 H-U1
(`feat/h-u1-anbinden` @ a852d4a, release-reif) wird **vor T01 per Merge in `feat/m12-e0` geholt**, damit
`connect.ts` mit umgestellt wird — T01 wartet nicht auf REL-03; prod-B2 T06 bekommt einen eigenen Doku-Umsetzer
(15 Starts); prod-B3 Ersatz-Implementierer bei C1/C2 löst Übergabe an eine neue Controller-Instanz aus; qa-B2
Timeout 120 000 für AK-E0-12(a); qa-B3 Lasttest AK-E0-15 in T05 vor der Umsetzung (Platzhalter-Pin 6, rot), nach
Messung pinnen; qa-B4 v6-Autosave für AK-E0-20 vom Spiel auf main-Stand erzeugt (Weg und Haus), Sichtvergleich
„Neues Spiel Seed 3" auf beiden Builds; qa-B5 Fall I16 (Wache auf Insel 1 schützt nichts auf Insel 0).
**P-14 angenommen mit Auflage:** T00 erzeugt auf v6-Code einen zweiten echten Stand `save-v6-locks.json`
(`unlockAll`, Amtsstube, `setGoodLock`, `setUpgradeStop`, Glas gekauft); AK-E0-06 lädt ihn; `upkeepCarry` 0
hingenommen; Anhang 01 C gleicht der Spec-Autor an. **Final-Review** opus durch **lead-qa** (qa-B1): 1 Start von
lead-tech an lead-qa (lead-tech 20, lead-qa 1). Merge-Reihenfolge: REL-03 (H-U1 → S1-Rest → H-R13 → H-R12b, H-R12b
fällt raus, wenn nicht fertig) vor E0; E0 erst nach REL-03 auf main (sonst v7 ungewollt mit REL-03 in Autosaves).
— Kosten bei Irrtum: Merge-Konflikt H-U1 in E0 doppelt zu lösen; v7 nach Merge nicht umkehrbar.

Entscheider: L0 · Anlass: Berichte lead-qa und lead-production M12-E0-GATE-PLAN · ADR: —

## R230 · 2026-10-05 · Gate Spec M12 E1–E6 bestanden

Ruling: Delta-Gate lead-qa (95ed26e → 37850ad) BEDENKEN nicht blockend → **Gate Spec M12 E1–E6 bestanden** mit
Auflage B1: lead-design ergänzt vor dem Plan des Seefahrt-Bündels die Pin-Liste in Anhang 03 D um die durch E2
gebrochenen Pins `M8:AK-S1-01` (U6-Zeile `unlocks.test.ts`) und `M11:AK-U1-08` (`UNLOCK_NOTICE`) mit Bezug R226
F-03 und entscheidet den künftigen U6-Meldungstext. Die Plan-Punkte von lead-qa (AK-E2-03 Schiff in Felsbucht beim
Abriss, Rezept `save-v8.json`, Übergangsbestand über die Kette ab v7, Browser-Check Lade-Meldung, Aufwärmen AK-E1-16,
Notfall-Frames AK-E1-18, Messbedingungen AK-E1-19) ergänzt lead-design in Teil B der Plan-Auflagen. Spielurteil
QA-A3 (Übergangsbestand Gewürz, AK-E3-07) angenommen. F-P7 (Werte E6) prüft design-economy-designer vor dem E6-Plan.
Nächster Schritt: E1-Plan durch lead-tech auf Basis E0-Plan; E1-Render-Umsetzung erst nach REL-03 auf main. —
Kosten bei Irrtum: alte Pins ohne Ruling-Bezug geändert; U6-Text vom Umsetzer entschieden.

Entscheider: L0 · Anlass: Bericht lead-qa M12-GATE-SPEC-DELTA · ADR: —

## R231 · 2026-10-05 · Gate Plan M12-E1, D-139

Ruling: **D-139:** Fahrstrecke `d` zählt nur die offene See ausserhalb aller Inselrechtecke (Heimatanker liegt 13–31
Kacheln tief im Rechteck, Band 25–30 sonst unerreichbar); Bänder und Wirtschaft unverändert; Spec @ fbeebca.
**Gate Plan M12-E1** (`feat/m12-e1` @ 1acbc40) mit BEDENKEN bestanden (lead-production B1–B4, lead-qa B1–B7, kein
ZURÜCK). Plan-Nachtrag durch lead-tech vor dem jeweiligen Task, ohne Zweitprüfung: prod-B1 T02 `blocked-by` E0-T05
(Review OK), Neu-Merge falls E0 danach `src/sim` ändert; prod-B2 Merge-Fluss nur main → E0 → E1 (E1 holt main
direkt nur per L0-Ruling); prod-B3 fällt H-R12b aus REL-03, wartet es bis E1 auf main; prod-B4/qa-B7 Ownership und
Index-Tabelle vervollständigen, L0 startet die Controller ausserhalb der Formel; qa-B1 `HOME_CALLS` vor dem
Terrain-Merge erzeugen, Kamera schliesst den 4-Kachel-Rand aus (sonst unter R-4 benennen); qa-B2 Helfer
`createIslandLayers` mit Test zuerst, Browser-Schritt „direkt nach Laden auf 0,125"; qa-B3 AK-E1-17 als Vitest
Seeds 1…200; qa-B4 Fremdinseln nach Migration aus v1…v6 gleich; qa-B5 P-5 an Spec angleichen; qa-B6 Quelle des
v7-Autosaves nennen. Merge-Reihenfolge main: REL-03 → E0 → E1. **Budget E1:** lead-tech 27 Starts (Parallelität 2
nur T03/T04), lead-qa 1. Umsetzung beginnt, wenn E0-T03 (Sim) bzw. REL-03 auf main (Render) erreicht sind. —
Kosten bei Irrtum: Neu-Merges E0 → E1; Regressionsschutz Heimatbild schwächer ohne qa-B1.

Entscheider: L0 · Anlass: Berichte lead-qa, lead-production M12-E1-GATE-PLAN; D-139 lead-tech · ADR: —

## R232 · 2026-10-05 · Gate Merge Release REL-03

Ruling: Gate Merge Release REL-03 bestanden. Kandidat `rel/rel-03` @ aa2ee4b auf main d0db854: H-U1 (0760dc9),
S1-Rest (cba13ab), H-R13 (fb29bd2), H-R12b (aa2ee4b); `make check` nach jedem Merge und `CI=true make check` grün
(1588 Tests). opus-Review lead-qa BEDENKEN nicht blockend; Perf A/B im Stilrahmen §5 (`buildMs` +9–13 %,
`lastPatchMs` +17–18 %, `renderMedian` +0,1 ms). Browser-Lauf OK. Prüfliste UI-Task → Screenshot: H-U1
`.studio/qa/REL-03/kandidat/h-u1/`, S1-Rest `…/kandidat/s1-rest/`, H-R13 `…/kandidat/h-r13/`, H-R12b
`…/kandidat/h-r12b/`, Regression `…/kandidat/regression/`. **Auflage vor dem Push:** B1 — Merge-Artefakt in
`docs/beobachtungen.md` (Zeile „Ergebnis: erledigt in fix/s1-rest" vom Wald-Eintrag in den S1-Rest-Eintrag
verschieben) als eigener Fix-Commit des Integrators; B2 (`connectBuilding` multipliziert nur Geld) und
CI-Zeitreserve AK-R1-06 (≈ 2,0–2,05 s von 2,25 s) als Beobachtungen. Die Leistungs-Einschätzung von lead-art
(„Ruling" im Bericht) gilt erst mit diesem Ruling; Leads treffen keine Rulings (Retro). Wald-Gleichstand H-U1 bleibt
so (Vorschau zeigt den Weg), Frage an lead-design über beobachtungen. H-R12b ist der dritte Dünen-Anlauf; Nutzerpunkt
„Dünen sehen komisch aus" gilt nach dem Nutzertest als erledigt oder offen. Push durch production-integrator
`HEAD:main`. — Kosten bei Irrtum: Revert-Merge; CI-Zeittest kann rot werden (dann Hotfix nach §7.2).

Entscheider: L0 · Anlass: opus-Review und Playtest REL-03 · ADR: —

## R233 · 2026-10-05 · Retro-Vorschläge Session ad51d3c5 und Prozess-Retro REL-03

Ruling: Angenommen aus der Kurz-Retro (`docs/studio/retros/2026-10-05-session-ad51d3c5.md`): (1) Briefing jeder
Persona-Änderung nennt CHANGELOG-Eintrag und `make check` als Pflicht; (3) Berichtsvorlage sagt „Einschätzung" statt
„Ruling" — Leads treffen keine Rulings; (4) Briefings mit Messaufträgen enthalten „Messproben nie im Hauptcheckout,
nur Worktree oder Scratchpad"; (6) Phasen-Labels je Session eindeutig vergeben, Zählweise von `effort.py` als
Beobachtung. Punkte (2), (5), (7) ohne Massnahme (Einzelfall bzw. Messartefakt; Muster weiter beobachten). Aus der
Prozess-Retro (`docs/studio/retros/2026-10-05-prozess-retro-rel-03.md`): **V1** angenommen (Warte-Turn-Enden der Leads
senken, als `waiting` loggen); **V2** angenommen (Folgeplan-Gate eines bereits gegateten Meilensteins mit einem
Prüfer lead-qa + L0 für Ownership/Budget); **V3** angenommen (Spec-Selbstcheck mit Zahlenbeispiel vor dem Gate;
höchstens 2 Bildrunden je Häppchen, dann Gate-Entscheid); **V4** zurückgestellt (nur, wenn Review-Starts nicht
steigen — Messung zuerst); **V5** festgestellt (Gates der Stufe voll unverändert). Umsetzung der Handbuch-Änderungen
durch studio-coach in der nächsten Session. — Kosten bei Irrtum: Regeln einzeln zurücknehmen.

Entscheider: L0 · Anlass: Kurz-Retro und Prozess-Retro 2026-10-05 · ADR: —

## R234 · 2026-10-05 · Hotfix H-T3 Teil-Neuzeichnung nach REL-03

Ruling: CI auf main rot bei 1188514 (nur Doku) durch `tests/render/terrain.test.ts` „H-R9 B4 Teil-Neuzeichnung ≤ 8 ms"
(Runner 14,7 ms > 12 ms mit CI-Faktor); REL-03-Lauf 1a24d25 war grün. Ursache vermutet: `foothillField` (H-R13)
rechnet je Patch zwei Box-Blur über das ganze Gebirgsfeld (beobachtungen.md, REL-03-Eintrag (1); opus-Review
`lastPatchMs` +17–18 %). Vorrang nach Verfassung §7.2. **H-T3** an lead-art: Ursache messen (A/B gegen d0db854), Fix
durch Cache von `foothillField` je `fields` (kein Lockern der Schwelle, solange ein Fix möglich ist), Review,
`make check` und `CI=true make check`, Werkzeug-Merge durch den Integrator. Ad-hoc-Retro-Anlass: Release-Gate
akzeptierte `lastPatchMs` +17 % ohne Blick auf die CI-Reserve von H-R9 B4 (nur AK-R1-06 geprüft). — Kosten bei
Irrtum: Revert H-R13; Schwelle nur per weiterem Ruling.

Entscheider: L0 · Anlass: CI-Lauf 37295831843 · ADR: —

## R235 · 2026-10-05 · Gate H-T3, CI-Grenze H-R9 B4

Ruling: Befund H-T3: Ursache des roten H-R9 B4 ist nicht `foothillField`, sondern `paintPixels` (+≈ 10 % durch REL-03)
bei einem Runner, der für diesen Test ≈ 4× langsamer ist als lokal; Neustart des CI-Laufs erneut rot (13,9 ms > 12 ms).
Entscheid D-H-T3: (1) Cache `foothillsFor` (`fix/h-t3-patchzeit` @ a54ce52, Review OK, pixelgleich, `make check` und
`CI=true` grün) wird gemergt. (2) CI-Grenze nur für H-R9 B4 auf **20 ms** (lokal bleibt 8 ms) über einen optionalen
Faktor-Parameter von `perfBudget` (Faktor 2,5, mit Kommentar R235) — Umsetzung als Fortsetzung des Arbeiters auf
derselben Branch, Review am Diff durch L0. Echte Regressionen fängt das A/B-Perf-Delta im Release-Gate (R211); ab
jetzt prüft das Release-Gate die CI-Reserve **aller** Zeittests im Render-Diff, nicht nur AK-R1-06. (3) Paket
„paintPixels-Performance" (Vorberechnung je Zelle) als Kandidat REL-04/M9 in beobachtungen. Kein Rückbau von H-R12b/
H-R13. — Kosten bei Irrtum: eine Perf-Regression bis +40 % auf dem Runner bleibt im CI unbemerkt bis zum nächsten
Release-Gate.

Entscheider: L0 · Anlass: Bericht lead-art H-T3, CI-Läufe 37295831843 (2×) · ADR: —

## R236 · 2026-10-05 · Ad-hoc-Retro CI rot (H-T3)

Ruling: Vorschläge der Ad-hoc-Retro (Abschnitt in `docs/studio/retros/2026-10-05-session-ad51d3c5.md`) angenommen:
(a) Release-Gate prüft die CI-Reserve aller Zeittests im Diff (bereits R235); (b) Hotfix-Briefings trennen
Beobachtung/Beleg von Vermutung, Vermutungen als „unbelegt" markiert, keine Fix-Vorgabe aus einer Vermutung; (c)
Briefings mit CI-Prüfung nennen Lauf-ID und Workflow-Namen (CI ≠ Pages). Dritter Zeittest-Fall dieser Klasse
(AK-R1-06, H-R9 B4 ×2): Paket „paintPixels-Performance" bekommt in REL-04 Vorrang. Umsetzung (b)/(c) im Handbuch mit
R233 durch studio-coach. — Kosten bei Irrtum: Regeln einzeln zurücknehmen.

Entscheider: L0 · Anlass: Ad-hoc-Retro CI rot, CI-Lauf 37295831843 · ADR: —

## R237 · 2026-10-05 · Session-Fokus Spielinhalte

Ruling: Nutzerauftrag „weiter, Fokus auf Spielinhalte" heisst: Vorrang für Arbeit, die das Spiel inhaltlich erweitert —
M12 „Weite Welt" (E0 C2 → C3, danach E1 und Plan Seefahrt-Bündel) und Ideen-Runde IDEEN-03. Prozessarbeit (Handbuch-
Umsetzung R233/R236 durch studio-coach) und Technik ohne Spielwirkung (REL-04-Kandidat paintPixels-Performance) ruhen
in dieser Session; Pflicht-Retros und Session-Ende-Routine bleiben. Budget E0 neu geloggt (Session-Wechsel). — Kosten
bei Irrtum: Handbuch-Nachführung eine Session später.

Entscheider: L0 · Anlass: Nutzerauftrag Session-Start · ADR: —

## R238 · 2026-10-05 · Gate IDEEN-03

Ruling: Empfehlungen lead-design übernommen. **I-010 „Drittes Ziel «Gewürzstadt»" eingeplant** als Zusatz zum
Seefahrt-Bündel E2+E3+E4: lead-design schreibt einen Spec-Nachtrag (Anhang zur M12-Spec auf `docs/m12-brainstorming`)
mit testbaren AK, Wert n rechnet design-economy-designer gegen die Gewürz-Erzeugung (Vorschlag 80); Ziel-Flagge läuft
mit Save v9; Determinismus-Risiko (Controller nach zweitem Ziel, Neupin `feedSpice`/`wonMerchantsTick`) als Auflage an
den Bündel-Plan. I-011, I-012, I-014 geparkt; I-013 verworfen. Befund „Geldschwemme ab Kaufleuten" kommt als
Beobachtung in `docs/beobachtungen.md` (Input fürs nächste Wirtschafts-Brainstorming). `docs/ideen-03` @ dffcdbd geht
mit dem nächsten Integrator-Lauf nach main. — Kosten bei Irrtum: Nachtrag verwerfen, Bündel ohne drittes Ziel.

Entscheider: L0 · Anlass: Bericht lead-design IDEEN-03 · ADR: —

## R239 · 2026-10-05 · Gate Spec-Nachtrag I-010 (Anhang 05)

Ruling: Anhang 05 „Drittes Ziel «Gewürzstadt»" (`docs/m12-brainstorming` @ 619eea5) angenommen: n = 80
(`WIN_SPICE_MERCHANTS`), Haltezeit 600 Ticks (`WIN_SPICE_HOLD`), Save-v9-Feld `wonSpice`, AK-Z3-01…14. (1)
**Schleifen-Bedingung übernommen** (Ziel zählt nur mit Schiffsroute, die Gewürz von einer Fremdinsel mit eigener
Plantage heimholt; Zukauf bleibt Notversorgung) — sonst wäre das Ziel „20 Kaufleute mehr". (2) **Plantagenplätze
Felsbucht bleiben 3** (E1/Anhang 02 A unverändert; Zukauf schliesst die Lücke, Inselwahl bleibt eine Abwägung). (3)
Änderungen abgenommener AK laut Anhang 05 I (AK-S3-03 Phase `'spice'`, AK-U1-01 Texte, RF-4 `wonSpiceShown`,
AK-M12-B2 Fold-back) sind mitbeschlossen. Auflagen J (u. a. Neupin `wonMerchantsTick` auf der Integrationsbranch,
Szenario-Tests statt Balancing-Pin) gehen an den Plan des Seefahrt-Bündels E2+E3+E4, der jetzt startet (vorgezogen
vor E0-Merge, R237). — Kosten bei Irrtum: B.2/AK-Z3-04 streichen.

Entscheider: L0 · Anlass: Bericht lead-design M12-I010 · ADR: —

## R240 · 2026-10-05 · Kombiniertes Gate Spec/Plan H-I007 „Fest in der Kapelle"

Ruling: Kurzdesign lead-design (AK-I007-01…12, Werte FEAST_RUM 10 / FEAST_DURATION 600 / FEAST_COOLDOWN 1800) und Plan
lead-tech (P1 Sim+Save, P2 UI + Browser-Check; `.studio/handoffs/2026-10-05-h-i007-{kurzdesign,plan}.md`) angenommen,
Umsetzungsbudget 7 Starts. **D-140:** `feastAt` als optionales, geprüftes Gebäudefeld **ohne neue Save-Version** —
Auslegung der festen Regel „versionieren und migrieren": Zweck (alte Spielstände laden, mit Test AK-09; ungültige Werte
abgewiesen AK-10) ist erfüllt; ein Versionswechsel hätte eine leere Migration und kollidierte mit v7 aus E0. Weil das
eine Auslegung einer Verfassungsregel ohne Präzedenz ist, geht ein Vorbehalt in die Warteschlange; vor dem Release
REL-04 umkehrbar. **D-141:** H-I007 geht vor E0 nach main; E0 holt es per Merge (wie H-U1/REL-03). Sim-Riegel vor U4
entfällt (Rum-Bestand genügt, YAGNI). — Kosten bei Irrtum: Versionswechsel v6→v7 nachziehen und E0-Versionen schieben.

Entscheider: L0 · Anlass: Berichte lead-design/lead-tech H-I007 · ADR: —

## R241 · 2026-10-05 · Gate Plan Seefahrt-Bündel E2+E3+E4

Ruling: Gate Plan (`feat/m12-see` @ 9a1fe08) mit **BEDENKEN** bestanden (lead-qa B1–B7, lead-production B1–B7, kein
ZURÜCK; `.studio/handoffs/2026-10-05-m12-see-gate-{qa,prod}.md`). **Plan-Nachtrag durch lead-tech** vor T00 ohne
Zweitprüfung. Designfragen nach Urteil lead-design (`.studio/handoffs/2026-10-05-m12-see-design-d142-144.md`):
**D-142** Gut mit `islandTrait`-Betrieben dämpft den Hausaufstieg nur auf Inseln mit diesem Merkmal (Gewürz dämpft in
der Heimat nie); „Schiffsladung zählt in die Bilanz" verworfen. **D-143** vor `seafaring` ist die aktive Insel immer
die Heimat (Index 0), Lagerleiste ohne Inselnamen; ab `seafaring` C.1. **D-144** Platzhalter aus vorhandenen Formen mit
drei Mindestregeln (eigener Palettenton Gewürzplantage, eigene Chip-Farbe Gewürz, Schiff nach AK-E4-15); lead-art
urteilt über T15-Screenshots, Nacharbeit = eigenes Art-Paket. Budget **50 Starts** (lead-tech 49, lead-qa 1),
Freigabe ab M0. **Studioweite Obergrenze 5 gleichzeitig laufende Arbeiter** (Risiko prod). — Kosten bei Irrtum:
D-142 zurück auf Spec-Wortlaut (Neupin-Risiko R-2).

Entscheider: L0 · Anlass: Gate Plan lead-qa, lead-production, Designurteil lead-design · ADR: —

## R242 · 2026-10-05 · M12-E0 C2 abgenommen, Start E0 C3 und E1 C1

Ruling: E0 T03–T05 (`feat/m12-e0` @ 0428c15) angenommen. Abweichungen vom Plan übernommen: `fieldWorld(world)` in
`src/render/terrainField.ts`, `islandAt()` in `placement.ts`, `isSupplySource` in `coverage.ts`, `upgradeView`-Fix in
`inspect.ts` (T02-Fehler), mechanische Typ-Fixes (`connect.ts`, `roads.ts`, `soundEvents.ts`, `sprites.ts`). Start
**E0 C3** (T06 + Final-Review lead-qa; Final-Review prüft zusätzlich die Testlücke Schlüsselreihenfolge
`migrateV6ToV7`) und parallel **E1 C1** (Sim T00–T02 ab E0 @ 0428c15). H-I007 bleibt vor E0 auf main (R240 D-141): E0
holt main nach dem REL-04-Merge erneut; Final-Review E0 erst danach endgültig, falls H-I007 vor dem E0-Merge landet.
— Kosten bei Irrtum: Abweichungen einzeln zurücknehmen.

Entscheider: L0 · Anlass: Bericht lead-tech M12-E0 C2 · ADR: —

## R243 · 2026-10-05 · H-I007 abgenommen, REL-04 vorgezogen

Ruling: H-I007 „Fest in der Kapelle" (`feat/h-i007-fest` @ 6205dae) release-reif angenommen; P2-Abweichung (rein
lesende `feastBlockReason` in `src/sim/feast.ts`) übernommen. **REL-04 startet jetzt mit H-I007 allein** (Ausnahme zur
Auslösung „3 Häppchen", Grund: kritischer Pfad — M0 des Seefahrt-Bündels verlangt H-I007 in main → E0 → E1, R241);
dazu die Doku-Branch `docs/ideen-03` @ eafa57c. paintPixels-Performance bleibt nach R237 ausserhalb. Der Browser-Lauf
am Kandidaten prüft zusätzlich die Sperrgrund-Zeile am Fest-Knopf (nach dem H-I007-Browser-Check entstanden).
Vorbehalt N-95 (D-140) bleibt offen; ein späteres Nein heisst Versionswechsel mit Identitäts-Migration. — Kosten bei
Irrtum: ein zusätzlicher Release-Lauf.

Entscheider: L0 · Anlass: Bericht lead-tech H-I007 · ADR: —

## R244 · 2026-10-05 · Gate Merge Release REL-04

Ruling: Gate Merge Release REL-04 **OK** (Kandidat `.worktrees/integrate` @ 50deea8: H-I007 + `docs/ideen-03`;
`make check` und `CI=true make check` grün; Prüfliste vollständig `.studio/qa/REL-04/h-i007/`; opus-Review OK mit drei
niedrigen Befunden). Push durch den Integrator. Befunde in `docs/beobachtungen.md`: Kapelle in `save.ts` per `defId`,
in `feast.ts` per `service` erkannt; arc42 ohne `feastAt`-Prüfung/`feastBlockReason`; `formatClock` zeigt in den
letzten Ticks „0:00"; Sperrgrund-Zeile fehlt bei laufendem Fest/Abklingzeit; Knopf-Umbruch bei nicht angebundener
Kapelle. Ad-hoc-Hinweis „Agent unbekannt inaktiv" geht an die Session-Retro (lernen.md: bekanntes Messartefakt). —
Kosten bei Irrtum: Hotfix auf main.

Entscheider: L0 · Anlass: Bericht lead-production REL-04 · ADR: —

## R245 · 2026-10-05 · M12-E0 C3 abgenommen, Delta-Merge main vor Gate Merge

Ruling: E0 T06 und Final-Review (lead-qa BEDENKEN, vier niedrige Befunde, zwei behoben; `feat/m12-e0` @ 6c64aab)
angenommen. (1) CI-Faktor 4 im Lasttest `tests/sim/perf.test.ts` (lokal Pin 2,5 ms, CI 10 ms) als Abweichung von
P-8/R-3 **genehmigt** (Runner ≈ 4× langsamer, vgl. R235). (2) Rot-Commit dcecfdf ohne Beleg im Text: **keine
Historien-Änderung** (§6). (3) Da REL-04 (H-I007) jetzt auf main ist (50deea8), holt E0 main per Merge; Konflikte in
`types.ts`/`save.ts` und der semantische Konflikt `world.stock` → Insel-Lager in `src/sim/feast.ts` werden auf
`feat/m12-e0` gelöst (Rum vom Lager der Kapellen-Insel, wie lead-design im Kurzdesign vorgesehen), mit Delta-Review
durch qa-code-reviewer; `make check`/`CI=true make check` grün und AK-I007-Tests grün. Danach Gate Merge E0 durch L0.
— Kosten bei Irrtum: Faktor 4 verdeckt Sim-Regressionen bis +60 % im CI.

Entscheider: L0 · Anlass: Bericht lead-tech M12-E0 C3 · ADR: —

## R246 · 2026-10-05 · M12-E1 C1 abgenommen

Ruling: E1 T00–T02 (`feat/m12-e1` @ fdad208, Save v8, Migration v7→v8, Reviews OK Runde 0) angenommen. Abweichungen
übernommen: `home()` liefert `HomeIsland` (Cast), Fremdinseln mit möglicherweise negativen `ox`/`oy`, Plantagen-
Platzsuche zählt den Kandidaten als belegt, Zusatzwerte `FALLBACK_DIRECTIONS`/`FALLBACK_MOUNTAIN_SIDE` in `sea.ts`,
mechanische Test-Anpassungen (`islands.test.ts`, `scenario-saves.test.ts`, `unlocks.test.ts`). Hinweis: Zusatzwerte
gehören laut Architekturregel nach `src/sim/defs/` — falls es Spielwerte sind, verschiebt C2 sie dorthin (Review
prüft). **E1 C2 startet nach dem Delta-Merge main → E0 (R245)** mit dem Merge des dann aktuellen E0 (enthält H-I007);
damit ist M0 des Seefahrt-Bündels erfüllt (E1-T02 OK + H-I007 in `feat/m12-e1`). — Kosten bei Irrtum: Abweichungen
einzeln zurücknehmen.

Entscheider: L0 · Anlass: Bericht lead-tech M12-E1 C1 · ADR: —

## R247 · 2026-10-05 · Gate Merge M12-E0 (Etappen-Merge)

Ruling: Gate Merge für die Etappe E0 **OK** (`feat/m12-e0` @ 21ac49b). Auslegung: M12 merged etappenweise (R228:
Save-Versionen je Etappe, Merge-Reihenfolge main → E0 → E1 → Seefahrt-Bündel); das Gate je Etappe ersetzt das eine
Meilenstein-Gate, das Final-Review auf opus über die ganze Etappen-Branch ist Pflicht und liegt vor (lead-qa, R245).
Prüffragen: `make check`/`CI=true make check` grün (1720 Tests); Final-Review ohne ZURÜCK, BEDENKEN behoben bzw. in
R245 geregelt; Delta-Merge REL-04 mit Review OK; ADR-013, arc42, `docs/index.md` nachgeführt, README ohne
Bedienänderung; Commit-Konvention eingehalten. Risiko R-4 (Pages-Rollback nach v7-Autosave) akzeptiert. Merge durch
den Integrator, danach CI und Pages. Parallel startet **E1 C2** auf Basis E0 @ 21ac49b. — Kosten bei Irrtum: Revert
des Merge-Commits; v7-Autosaves wären dann im alten Build unladbar.

Entscheider: L0 · Anlass: Berichte lead-tech M12-E0 C3, Final-Review lead-qa · ADR: ADR-013

## R248 · 2026-10-05 · M12-E1 C2 abgenommen, Session-Übergabe

Ruling: E1 C2 (`feat/m12-e1` @ 218b191: Merge E0 766df67, T03–T05, Fest-Rum-Test mit Kapelle auf `islands[1]`)
angenommen; Abweichungen AK-ISO-04 (`ZOOM_STEPS[0]`) und grössere Fixture `water.test.ts` übernommen. Die Fix-Runden
T03/T04 ohne Zweit-Review deckt das Final-Review von C4 ab — Auftrag an lead-qa: Delta der Fix-Commits ausdrücklich
prüfen. **M0 Seefahrt-Bündel erfüllt ab 766df67.** Weiter in der nächsten Session (L0-Kontext ≈ 25 %): E1 C3 (T06 UI
inkl. Baumstempel-Seed-Test, T07 Browser-Messung Malbänder/`SLICE_ROWS`, Playtests) ∥ Seefahrt C1 (T00–T02 auf der
Integrationsbranch, Budget R241), Obergrenze 5 Arbeiter. — Kosten bei Irrtum: Fix-Runden-Fehler erst im Final-Review.

Entscheider: L0 · Anlass: Bericht lead-tech M12-E1 C2 · ADR: —

## R249 · 2026-10-05 · Vorschläge Kurz-Retro S-6a98e530 und Prozess-Retro REL-04/E0

Ruling: (1) **Release mit einem Häppchen** prüft im Release-Review nur das Delta seit dem Final-Review (Prozess-Retro
V1) — angenommen. (2) **Reihenfolge-Entscheide mit Prognose:** Berührt ein Häppchen Dateien, die eine laufende Etappe
exklusiv hält, nennt das Ruling den erwarteten Etappen-Merge; fällt er in dieselbe Session, fährt das Häppchen mit der
Etappe (Lehre aus D-141) — angenommen. (3) **Zeittests nicht unter paralleler Last** (Prozess-Retro V3 = E-030):
angenommen als Regel; Umsetzung (`vite.config.ts`/`Makefile`) als kleines Werkzeug-Paket an lead-tech in der nächsten
Session; Schwellen werden erst gelockert, wenn ein Lauf ohne Last rot ist. (4) E-029 (Steuerung je Tätigkeit, Lead-
Übergabe bei 200k) wartet auf einen Experiment-Platz, erster Nachrücker. (5) Integrator-Briefings übernehmen den
Attributions-Trailer unverändert aus der Session. (6) Die Handbuch-Umsetzung R233/R236 (b)/(c) und (1)–(3), (5) durch
studio-coach ruht nicht länger — sie läuft in der nächsten Session parallel zu den Inhaltssträngen (R237 gilt nur
für den Vorrang). — Kosten bei Irrtum: Regeln einzeln zurücknehmen.

Entscheider: L0 · Anlass: Retros `docs/studio/retros/2026-10-05-session-6a98e530.md`, `…-prozess-rel04-e0.md` · ADR: —

## R250 · 2026-10-05 · Session-Plan: vier Stränge, Lastregel für Messungen

Ruling: Nutzer-Auftrag „starte" = Plan aus state.md fortsetzen (R248, R249). Vier Stränge parallel: **(A)** lead-tech
E1 C3 (T06 UI inkl. Baumstempel-Seed-Test, T07 Browser-Messung, Playtests) in `.worktrees/m12-e1`, höchstens 2
Arbeiter gleichzeitig; **(B)** lead-tech Seefahrt C1 (T00–T02) in `.worktrees/m12-see`, Budget aus R241, höchstens 2
Arbeiter; **(C)** lead-tech Werkzeug-Paket E-030 „Zeittests lokal seriell" (R249 (3)) in eigenem Worktree ab `main`,
nur `vite.config.ts`/`Makefile`/Doku, 1 Arbeiter; **(D)** studio-coach Handbuch-Umsetzung R233/R236 (b)/(c) und R249
(1)–(3), (5) — Eigentum `docs/studio/STUDIO.md`, `templates/`, `experimente.md`, `lernen.md`; `rulings.md` und
`state.md` bleiben bei L0. Summe ≤ 5 Arbeiter (R241). **Lastregel:** Browser-Messung T07 und rote Zeittests gelten nur
ohne parallele `vitest`/`make check`-Läufe anderer Worktrees (Prüfung per `ps`, sonst warten bzw. Wiederholung allein);
Last-Zustand steht im Bericht. E-030 startet als Experiment mit diesem Paket. — Kosten bei Irrtum: verzerrte
Messwerte, Wiederholung der Messung.

Entscheider: L0 · Anlass: Session-Start, state.md · ADR: —

## R251 · 2026-10-05 · Handbuch 1.19 abgenommen, E-028 bewerten, E-030 nachrücken

Ruling: Handbuch 1.19 (`196bcce`) angenommen. **E-028** hat seinen Zeitraum erreicht (REL-01…REL-04 ≥ 3 Releases) →
studio-coach bewertet und schliesst es; danach rückt **E-030** auf den freien Platz (laufend ab dieser Session, Start
R250; Verfassung §10 höchstens 3). Bewährt sich E-028, bleibt die Arbeitsweise als Regel im Handbuch. `docs/studio/
gates.md` „Gate Plan" bekommt den Satz zum Folgeplan-Gate (R233 V2) durch studio-coach. V1 (Warte-Turn-Enden als
`waiting`) nimmt L0 ab sofort in Lead-Briefings auf. — Kosten bei Irrtum: E-028 wieder öffnen, E-030 zurückstellen.

Entscheider: L0 · Anlass: Bericht studio-coach PROZ-HB-R233 · ADR: —

## R252 · 2026-10-05 · Gate Werkzeug-Merge TOOL-E030

Ruling: Werkzeug-Merge ausserhalb eines Release (wie R220) freigegeben: `tool/e030-zeittests-seriell` @ 37e393a
(Vitest-Projekte `parallel` → `zeit` seriell, Wächter `make zeittests`, README; Review OK, Testzahl unverändert
1721, `make check` und `CI=true make check` grün, kein Diff in `tests/`). Keine Spieländerung, daher kein Browser-Lauf.
Integrator mergt nach `main`, `make check`, Push, CI- und Pages-Lauf prüfen. Danach holen `feat/m12-e1` und
`feat/m12-see` `main` per Merge an ihrem nächsten Task-Ende (E1 nach R250 normal; See nur per L0-Ruling laut
Plan-Index → hiermit erlaubt, nur dieser Merge). — Kosten bei Irrtum: Revert-Merge.

Entscheider: L0 · Anlass: Bericht lead-tech TOOL-E030 · ADR: —

## R253 · 2026-10-05 · ZEITTESTS-Einträge für E1-Zeittests

Ruling: Nach Merge von `main` @ 39f0b5f (E-030) meldet der Wächter `make zeittests` zwei E1-Zeittests ausserhalb der
Liste: `tests/render/renderer.test.ts` (R3-Verhältnis) und `tests/sim/save.test.ts` (B6). Freigabe für lead-tech E1:
genau diese zwei Einträge in `ZEITTESTS` in `vite.config.ts` auf `feat/m12-e1`, ein eigener Commit `test:`, sonst
nichts an `vite.config.ts`. `feat/m12-see` trägt beide Tests seit M0 ebenfalls: lead-tech See übernimmt nach seinem
Main-Merge **genau diesen Commit per `git cherry-pick`** (inhaltsgleich, damit der spätere E1-Merge konfliktfrei
bleibt), nicht von Hand nachschreiben. Neue Zeittests der Stränge tragen sich künftig selbst in `ZEITTESTS` ein
(gehört zur Testdatei). — Kosten bei Irrtum: Merge-Konflikt in einer Listenzeile.

Entscheider: L0 · Anlass: Rückfrage lead-tech M12-E1-C3 · ADR: —

## R254 · 2026-10-05 · Seefahrt C1 abgenommen, D-145, Start C2 (e2 ∥ e4)

Ruling: Seefahrt C1 (`feat/m12-see` @ 7ddcfb5: T00–T02 je Review OK, T02 nach einer Fix-Runde; Merges M0, main
39f0b5f, Cherry-pick R253 = fcdabe9) angenommen, ebenso die Controller-Entscheide C1-1 (Fixture mit 4 Häusern, Fall
„11 Häuser" über `village(11)`) und C1-2 (Gewürz in U6 und Routen-Werte aus T02 vorgezogen). Ledger-Pfad
`.superpowers/sdd/m12-see/int.md` nach Plan-Konvention übernommen. **D-145:** Schranke Sprite-Speicher (H-R7 AK7,
`variants.test`) 1,25 → 1,30 angenommen (+26 % durch `kontor2`/`spicefarm`, LRU-gedeckelt); der render-Strang misst
bei jedem weiteren Gebäudetyp neu, T10/T11 entfernen die Fallback-Ausnahmen. **C2 startet** mit neuem lead-tech
(Kontext des C1-Leads > 160k, Lead-Übergabe): Stränge **e2** (T03, T04) und **e4** (T08, T09) parallel ab 7ddcfb5;
render wartet auf M1 (E1-T08 OK), e3 auf T04 OK. Budget aus R241: 12 Starts, Parallelität 3 (studioweit ≤ 5 neben
E1 C3). — Kosten bei Irrtum: Schranke zurück auf 1,25 mit eigener Silhouette.

Entscheider: L0 · Anlass: Bericht lead-tech M12-SEE-C1 · ADR: —

## R255 · 2026-10-05 · Seefahrt C2 abgenommen, Start C3 (e3), Inaktiv-Meldung

Ruling: Seefahrt C2 angenommen: e2 `feat/m12-see-e2` @ 570420b (T03, T04), e4 `feat/m12-see-e4` @ 5ba5905 (T08, T09),
je Review OK, Pins unverändert. Controller-Entscheide **C2-1 … C2-5 bestätigt**; C2-3 berührt `economy.ts`
(`checkAfford`) und `placement.test.ts` ausserhalb der e2-Ownership — nachträglich genehmigt, T14 prüft die
Zusammenführung mit dem e4-Hunk; C2-5 (`islands-gen.test.ts`) ist Merge-Punkt für M2. Commit-Text 1d77725
(`RED_PLACEHOLDER`) bleibt, Beleg in c70d887. Überschreitung der Übergabeschwelle (8 Starts in einer Instanz, R190)
als Befund an die Kurz-Retro. **C3 startet** mit neuem lead-tech: Strang **e3** (T05–T07) ab 7ddcfb5 mit Quer-Merge e2
@ 570420b; Budget aus R241: 8 Starts, Parallelität 2. render und e2-UI (T10–T13) warten auf M1. **Inaktiv-Meldung
tech-ui-engineer (E1 C3, T07):** Heartbeats alle ~10 min aus langen Bash-Messläufen — Messartefakt nach lernen.md,
keine Ad-hoc-Retro. — Kosten bei Irrtum: Retro nachholen; C2-Entscheide in T15 vereinheitlichen.

Entscheider: L0 · Anlass: Bericht lead-tech M12-SEE-C2, Hook-Meldung · ADR: —

## R256 · 2026-10-05 · D-146 Folgen von TIERS[4] in Fremddateien (Seefahrt T05)

Ruling: Empfehlung lead-tech angenommen. (a) e3 darf `tests/sim/fixtureV8.ts` (Eigentum int, dort ruht die Arbeit bis
T14) so ändern, dass das Rezept mit den v8-Werten rechnet (`TIERS[4]` ohne Gewürz, Steuer 20; `feedSpice` nur, wenn
die Stufe Gewürz verlangt); Fixture und `save.test.ts` bleiben bytegleich. (b) e3 passt die Pins in `tests/ui/hud.test.ts`
(AK-UX-07, AK-S1-18), `tests/render/overlays.test.ts` (AK-R1-03) und `flow.test.ts` (AK-P1-11) an, je Kommentar
`R226 F-03`; die Pin-Liste Anhang 03 D wird im e3-Ledger erweitert, T16 überträgt sie in die Spec. (c) Hinweistext
`guide.ts` AK-U2-08 (d): Wortlaut nach Spec Anhang 03 D „kaufe es am Kontor oder gründe ein Kontor auf einer
Gewürzinsel", ohne Tastenklammer, wenn das Gebäude in der Heimat nicht baubar ist (leere „()" ist ein Fehler); kein
eigener lead-design-Start, weil der Wortlaut aus der Spec kommt; e3 setzt ihn in der T05-Fix-Runde um, T07 übernimmt
ihn. Ownership-Ausnahmen gelten nur für diese Dateien und Stellen; T14 prüft die Zusammenführung. Alternative „alles
in T14" verworfen (roter Strang). — Kosten bei Irrtum: Pins in T14 nachziehen.

Entscheider: L0 · Anlass: Bericht lead-tech M12-SEE-C3 (D-146) · ADR: —

## R257 · 2026-10-05 · D-147 Messbedingung AK-E1-18 (frameMax im Leerlauf)

Ruling: Empfehlung lead-tech angenommen. AK-E1-18 „frameMax ≤ 50 ms im Leerlauf" wird unter Headless-Chrome bei
1920 × 1080 und **DPR 1** gemessen und entschieden (Grundframe 16,7 ms); Grenze 50 ms unverändert. Die DPR-2-Werte
(Grundframe dort bereits 50 ms, Software-Rendering, Vsync-Raster) stehen informativ im Bericht, zusätzlich als
„Zuwachs über Grundframe" (Variante b, nur informativ). AK-E1-19 (Scheiben ≤ 8 ms) bleibt mit unveränderter Grenze;
Teilen des `quarterLayer` in Streifen ist der planmässige Weg. Die erste Messserie ist wegen eines liegengebliebenen
Headless-Chrome ungültig und wird wiederholt; Befund an die Kurz-Retro (Aufräumen von Probe-Prozessen). Spec-Nachtrag
zur Messbedingung im E1-Ledger, T08 (Doku) überträgt ihn. — Kosten bei Irrtum: Messung bei DPR 2 auf echter GPU
nachholen (N-91-Weg).

Entscheider: L0 · Anlass: Rückfrage lead-tech M12-E1-C3 (D-147) · ADR: —

## R258 · 2026-10-05 · Seefahrt C3 (e3) abgenommen

Ruling: e3 `feat/m12-see-e3` @ e3afd51 (T05–T07 je Review OK, `make check`/`CI=true` grün ohne Last, Neupin
`balance-merchants` vorläufig [6750, 11500, 320]) angenommen, ebenso C3-1 (zweite leere Tastenklammer im Mangeltext
mit Spec-Wortlaut behoben). C3-2 (AK-Z3-06 nur über Reihenfolge prüfbar) und C3-3 (Merkfeld drittes Banner optional)
zur Kenntnis; **Pflicht für T15:** `app.ts` übernimmt das Merkfeld (Zeilen in der Übergabe C3 → C4), sonst erscheint
das Banner nach dem Sieg je Frame neu. Seefahrt wartet jetzt auf M1 (E1-Final-Review OK) für render (T10/T11) und
e2-UI (T12/T13). — Kosten bei Irrtum: Nacharbeit in T14/T15.

Entscheider: L0 · Anlass: Bericht lead-tech M12-SEE-C3 · ADR: —

## R259 · 2026-10-05 · F-P7 Werte E6 prüfen lassen (Wartezeit bis M1 nutzen)

Ruling: Während Seefahrt auf M1 wartet, prüft lead-design mit design-economy-designer die offenen E6-Werte **F-P7**
(Händlerschiff: Periode 3000, Dauer 600, erster Tick 3600; Angebot ≤ 20 % unter Kaufpreis, ≤ 20 Einheiten) gegen die
Wirtschaft nach Seefahrt-Bündel (Neupin `balance-merchants` vorläufig). Nur Empfehlung als Handoff, keine Spec- oder
Code-Änderung; Ergebnis entscheidet L0 vor einem E6-Plan. Budget 2 Starts. Ob E5/E6 (Kann-Teile) überhaupt geplant
werden, bleibt offen bis nach dem Seefahrt-Merge. — Kosten bei Irrtum: ein verworfener Wertevorschlag.

Entscheider: L0 · Anlass: Leerlauf Seefahrt bis M1, state.md · ADR: —

## R260 · 2026-10-05 · Nutzerentscheide: N-95 an L0, Spielstände ohne Rückwärtskompatibilität

Ruling: Nutzer (2026-10-05): „ich überlasse solche entscheidungen dir. spielstände müssen in zukunft nicht
rückwärtskompatibel sein." (1) **N-95** entscheidet L0: Ja (neues optionales Feld ohne neue Versionsnummer, wie
empfohlen). Auslegungsfragen zu Spielstand und Technik kommen nicht mehr in die Warteschlange; Vorbehalte nach §5.3
bleiben. (2) **Spielstände:** Ab sofort müssen ältere Spielstände nicht mehr ladbar sein. Weiter gilt: Format
versionieren; ein inkompatibler Spielstand wird mit Hinweis abgewiesen, nie ein Absturz, mit Test für das Abweisen.
Keine neuen Migrationen (z. B. E6/v10). Bestehende Migrationen v1…v9 (inkl. E1 v8, Seefahrt v9) bleiben, da gebaut und
getestet; Entfernen nur, wenn sie Aufwand verursachen (eigenes Paket). Der Verfassungstext §3 („migrieren, mit Test für
alte Spielstände") ist schreibgeschützt; die Wortlaut-Änderung liegt als **N-96** beim Nutzer (`VERFASSUNG ÄNDERN`).
Bis dahin tragen Briefings unter dem Regelblock die Zeile „Spielstand: R260 — keine Rückwärtskompatibilität nötig".
— Kosten bei Irrtum: Migrationen für betroffene Versionen nachbauen.

Entscheider: Nutzer, ausgelegt durch L0 · Anlass: Nutzernachricht · ADR: —

## R261 · 2026-10-05 · Verfassung 1.2: Spielstände ohne Rückwärtskompatibilität

Ruling: Nutzer hat per `VERFASSUNG ÄNDERN` freigegeben (N-96). Feste Regel §3 lautet jetzt: „Save-Format versionieren;
ältere Spielstände müssen nicht ladbar sein. Ein inkompatibler Spielstand wird mit Hinweis abgewiesen, nie ein Absturz;
Test für das Abweisen." Verfassung 1.2; der wörtlich kopierte Regelblock in `templates/briefing.md` ist nachgeführt;
die Zusatzzeile aus R260 entfällt. Sonst keine Änderung an der Verfassung. — Kosten bei Irrtum: Nutzer stellt den
alten Wortlaut wieder her.

Entscheider: Nutzer, umgesetzt durch L0 · Anlass: N-96 · ADR: —

## R262 · 2026-10-05 · F-P7 Werte E6 Händlerschiff entschieden

Ruling: Empfehlung lead-design (`.studio/handoffs/2026-10-05-m12-fp7-werte-e6.md`) angenommen: Periode 3000, Dauer
600, erster Tick 3600, Menge 10–20, Rabatt 20 %, Wahl unter allen Kontoren — unverändert. **Neu:** Angebote nur für
Güter mit Kaufpreis ≥ 30 (`OFFER_MIN_BUY`; heute Werkzeug, Stoff, Rum, Glas, Gewürz), damit Angebote nie wertlos sind.
Rabatt bleibt unter 25 % (sonst lohnt Auftragsbedienung mit Angebotsware). Für einen E6-Plan gelten: eigener
Zufallsstrom, `normalized()` entfernt `offer`, Ladeprüfung v10 erlaubt nach Teilkauf Mengen 1–20; nach R261 **keine
Migration** auf v10 (alter Spielstand wird mit Hinweis abgewiesen). Die vorgeschlagenen defs-Tests (Angebotspreis >
Auftragsprämie und > Boom-Verkaufserlös; Zufallsströme ohne Überschneidung) und der Ablageort der `OFFER_*`-Konstanten
gehen in den E6-Plan. Ob E5/E6 geplant werden, entscheidet L0 nach dem Seefahrt-Merge. — Kosten bei Irrtum: ein Wert
in `src/sim/defs/`.

Entscheider: L0 · Anlass: Bericht lead-design M12-FP7 · ADR: —

## R263 · 2026-10-06 · E1 C3: T06 abgenommen, T07 in C3b, Ad-hoc-Retro

Ruling: T06 (`feat/m12-e1`, Review OK nach einer Fix-Runde, Playtest a–g OK) angenommen; Fixes 332336e
(`requestIdleCallback`-Timeout) und 26dec9c angenommen. **T07** läuft in einer neuen Controller-Instanz **C3b**
(lead-tech auf `sonnet` nach Handbuch, 6 freie Starts aus R250, Übergabe `.studio/handoffs/2026-10-05-m12-e1-C3-an-C4.md`).
**Auslegung AK-E1-19 vorab:** Zuerst Ursache der Spitzen isolieren. Liegt sie in unserem Code (unteilbare Arbeit in
einer Scheibe), wird sie behoben, Grenze 8 ms auf das Maximum. Liegt sie nachweislich ausserhalb (Speicherbereinigung,
Compositor, Browser), entscheidet **p95 ≤ 8 ms**, das Maximum steht informativ im Bericht. AK-E1-14 Seed 14 mit 7
Läufen nachmessen. Ein lastfreier `make check` und `CI=true make check` auf dem Endstand ist Pflicht vor C4.
**Verbot:** `pkill`/`killall` auf allgemeine Prozessnamen (`node`, `chrome`) — nur eigene PIDs beenden. **Ad-hoc-Retro**
durch studio-coach: Dauer E1 C3 (≈ 11,6 h statt ~20 min Schätzung), Messumgebung (Fremdlast, Ruhezustand,
liegengebliebenes Chrome, `pkill -x node`), qa-playtester ohne Lebenszeichen 2,5 h, Controller auf opus statt sonnet
(Handbuch Z. 124), Integrator-Merge im Hauptcheckout statt `.worktrees/integrate`. — Kosten bei Irrtum: AK-E1-19 in
C4 neu auslegen.

Entscheider: L0 · Anlass: Bericht lead-tech M12-E1-C3, Hook-Meldung Inaktivität · ADR: —

## R264 · 2026-10-06 · Vorschläge Ad-hoc-Retro E1 C3

Ruling: Retro `docs/studio/retros/2026-10-06-adhoc-e1-c3.md` angenommen, Vorschläge als **Fehlerbehebungen** (Verfassung
§10.5: offensichtliche Fehler brauchen keine Datenbasis; kein Experiment-Platz nötig): **V1** `tools/render-qa/perf.mjs`
beendet sein Chrome nur per eigener PID; ein Messfenster-Wächter (Last, vitest/vite/Chrome fremder Worktrees,
`caffeinate -i` gegen Ruhezustand) läuft vor jeder Messserie — als kleines Werkzeug-Paket **nach** E1 C3b (gleiche
Dateien), Ziel ≤ 1 ungültige Serie je Messpaket. **V2** statt Guard-Regel: Persona `lead-tech` bekommt `model: sonnet`
als Vorgabe; Plan, Plan-Überarbeitung und Meilenstein-Retro startet L0 ausdrücklich mit `opus` (Handbuch Z. 124
unverändert); Messung: 0 Controller-Starts auf opus je Session. **V3** E-026 als Persona-Korrektur ohne Experiment:
`production-integrator` merged in `.worktrees/integrate` (detached, `git push origin HEAD:main`) und prüft vorher
`git rev-parse --show-toplevel`; E-026 wird als „übernommen R264" geschlossen. Umsetzung V2/V3 durch studio-coach
(Persona-Version + CHANGELOG). B3 (verwaister Playtester-Start) beobachten, keine Massnahme. — Kosten bei Irrtum:
Persona-Versionen zurücksetzen.

Entscheider: L0 · Anlass: Ad-hoc-Retro RETRO-ADHOC-E1C3 · ADR: —

## R265 · 2026-10-06 · E1 C3b abgenommen, AK-E1-19 nach p95, Start C4

Ruling: T07 (`feat/m12-e1` @ 3727c3f, Review OK, `make check`/`CI=true` grün — „unter Last" durch macOS-Dienste,
gekennzeichnet) angenommen. **AK-E1-19:** Die Spitzen 15–30 ms lagen in unserem Code (unteilbare Halbkopie) und sind
behoben; das Rest-Maximum 8,4–10,1 ms (periodisch, Ursache unbelegt, weitere Teilung ohne Wirkung) liegt deutlich unter
einem Frame (16,7 ms). Abweichend von R263 entscheidet **p95 ≤ 8 ms** (gemessen 7,7–7,9); das Maximum steht als
informative Grenze ≤ 12 ms im Spec-Nachtrag. Kein weiterer Start für einen Chrome-Trace. **C4** startet: lead-tech
(sonnet) T08 Doku inkl. Spec-Nachträge R257/R265 und Übertrag der C3/C3b-Befunde (zwei Cache-Pläne je Seite in
`app.ts`, H-R11-Tests unter Last rot, Inselkarte 1280 px, Flachwasser-Schlieren) nach `docs/beobachtungen.md`; danach
Final-Review lead-qa auf opus über `feat/m12-e1` (Fix-Runden T03/T04 ausdrücklich, R248). Budget: 2 Starts lead-tech
aus R250-Rest, 1 Start lead-qa. Mess-Wächter (R264 V1) folgt nach dem E1-Merge auf main. — Kosten bei Irrtum:
Nachmessung mit Trace in einem Häppchen.

Entscheider: L0 · Anlass: Bericht lead-tech M12-E1-C3B · ADR: —

## R266 · 2026-10-06 · Gate Merge M12-E1 mit BEDENKEN, Fix-Runde F1

Ruling: Final-Review lead-qa (`feat/m12-e1` @ 2282086: BEDENKEN, nur niedrige Befunde, Fix-Runden T03/T04 bestätigt,
Determinismus-Probe Seeds 3/14/77 und Fixtures v3–v7 grün) und Bildurteil lead-art (BEDENKEN, Schlieren nicht
blockierend → Häppchen **H-R15** „Saum Fernansicht" nach dem Merge) angenommen. **Merge freigegeben unter Bedingung:**
vorher kurze Fix-Runde **F1** durch lead-tech (sonnet, 2 Starts: Umsetzer + Review): Q1 (Viertel-Streifen-Test muss
rot werden können), Q2 (`GRID_BAND_ROWS` 2 im Gittertest), Q3 (Detailstufe ohne Möwen/Vogelschwärme testen), Q5
(`perf.mjs`-Texte auf R257/R265), Q6 (ADR-013 einheitlich 8,4–10,1 ms), arc42 `save-v7.json`; Q4, Q8 und die
Ausser-Scope-Befunde (Gebäudekoordinaten gegen Inselgrösse ab E2, Fremdinsel-Felder in `limits.ts`, Rastern im Modus
`jump`, Viertel-Kopie synchron beim ersten Zoom) nach `docs/beobachtungen.md`. **Q7** angenommen: Seed 3 misst der
Mess-Wächter (R264 V1) mit. Sind F1-Review OK und `make check`/`CI=true make check` grün, mergt production-integrator
ohne weiteres Gate in `.worktrees/integrate` nach `main` (Save v8 live). Danach ist **M1** für das Seefahrt-Bündel
erfüllt. — Kosten bei Irrtum: Revert-Merge; v8-Spielstände wären im alten Build unladbar (nach R261 hingenommen).

Entscheider: L0 · Anlass: Final-Review lead-qa, Urteil lead-art · ADR: —

## R267 · 2026-10-06 · CI rot nach E1-Merge: Hotfix H-T4, Ad-hoc-Retro

Ruling: Beobachtung: Workflow **CI**, Lauf 37438286587 auf `main` @ d2d08fb rot — 1 von 1835 Tests:
`tests/render/terrain.test.ts:1236` AK-E1-11 „gridBands … GRID_BAND_ROWS" → „Test timed out in 5000ms"; lokal und im
Integrations-Worktree grün. Workflow **Pages** Lauf 37438286556 stand > 10 min in `queued`. Vermutung (unbelegt): F1 Q2
hat den Gittertest auf dem CI-Runner über das Vitest-Timeout gehoben. Kein Revert: E1 bleibt auf `main`, Hotfix
**H-T4** durch lead-tech (sonnet, 2 Starts) auf `fix/h-t4-gridbands-timeout` ab `origin/main`: Ursache belegen
(Laufzeit des Tests lokal und unter `CI=true`, Vergleich vor/nach F1), dann kleinste Korrektur (Test verkleinern oder
begründetes Test-Timeout; keine Schwelle einer Leistungsprüfung lockern), Review, `CI=true make check`; Merge durch
production-integrator ohne weiteres Gate, sobald Review OK. **M1** für das Seefahrt-Bündel gilt erst mit grüner CI.
Ad-hoc-Retro (CI rot, Integrator `failed`) durch studio-coach nach dem Hotfix; Prüffrage: Warum lief der nach dem
Final-Review geänderte Zeittest nicht durch die CI-Reserve-Prüfung (R236 (a))? — Kosten bei Irrtum: Revert-Merge.

Entscheider: L0 · Anlass: Bericht production-integrator M12-E1-MERGE, Hook-Meldung · ADR: —

## R268 · 2026-10-06 · E1 live, M1 erfüllt; Start Seefahrt C4 und H-R15

Ruling: H-T4 (7b4fde0) gemergt, Workflow „CI" Lauf 37440669276 grün, Workflow „Pages" Lauf 37440669368 grün —
**M12-E1 ist live** (Save v8). Der hängende Pages-Lauf 37438286556 (Job `deploy` > 24 min `queued`, blockierte über
die Concurrency-Gruppe `pages` den Folgelauf) wurde von L0 abgebrochen; der Folgelauf deployte denselben Stand plus
H-T4. **M1 erfüllt.** Start **Seefahrt C4** (lead-tech, sonnet): `main` in `feat/m12-see` mergen (Plan: nach dem
E1-Merge nur noch `main`), dann Strang **render** (T10, T11) und Strang **e2-UI** (T12, T13 mit Quer-Merge render
nach T10) parallel; Budget aus R241: 12 Starts, Parallelität 3. Start **H-R15 „Saum Fernansicht"** (lead-art mit
art-rendering-engineer, Stufe leicht, höchstens eine Bild-Fix-Runde, Abnahme nach Urteil lead-art R266) ab `main`;
Datei-Eigentum nur Wasser-/Terrain-Malcode und dessen Tests — nicht die Dateien des render-Strangs (`archipel.ts`,
`renderer.ts`, `ship.ts`, `shipLane.ts`, `overlays.ts`, `sprites.ts`, `palette.ts`); Budget 4 Starts. H-R15 wird nach
Abnahme release-reif (Release-Bündel REL-05). — Kosten bei Irrtum: Konflikt beim T14-Merge in einer Malroutine.

Entscheider: L0 · Anlass: Bericht production-integrator H-T4, Pages-Lauf · ADR: —

## R269 · 2026-10-06 · Gate Werkzeug-Merge Mess-Wächter

Ruling: `tool/messfenster` @ e5bcc9d (Review OK nach 2 Runden; Selbsttest „belegt"/„frei", kein Chrome/Vite nach Lauf
und `kill -INT`; `make check` grün; `CI=true make check` rot nur am H-T4-Fall vor dessen Merge) freigegeben wie R252:
Werkzeug-Merge ausserhalb eines Release, Integrator mergt in `.worktrees/integrate` auf aktuellen `main` (mit H-T4)
und belegt `make check` mit Exit-Code, danach CI. Ab dem Merge nutzen Messpakete `make messfenster` (R264 V1; Zählung
ungültiger Serien beginnt im Seefahrt-Bündel). Alte `renderqa-*`-Verzeichnisse in `$TMPDIR` liegen ausserhalb des Repos
(Löschen dort verboten, R207) — Hinweis an den Nutzer, kein Eingriff. — Kosten bei Irrtum: Revert-Merge.

Entscheider: L0 · Anlass: Bericht lead-tech TOOL-MESSWAECHTER · ADR: —

## R270 · 2026-10-06 · Vorschläge Ad-hoc-Retro CI H-T4

Ruling: Retro `docs/studio/retros/2026-10-06-adhoc-ci-ht4.md` angenommen, V1–V3 als **Regeln** (kein Experiment):
**V1** Gate Merge und Gate Merge Release prüfen die CI-Reserve aller Zeittests im Diff — ausdrücklich auch Änderungen
aus Fix-Runden nach dem Final-Review; der Integrator führt vor jedem Push `CI=true make check; echo EXIT=$?` aus
(Schwelle: 0 rote CI-Läufe durch Zeittests in den nächsten 3 Merges); hebt die R237-Pause für diese Zeile in
`gates.md` auf. **V2** Integrator meldet einen Pages-`deploy`-Job, der > 10 min `queued` steht; Workflow unverändert.
**V3** Status `failed` nur bei nicht erfülltem Auftrag, sonst `done` mit Vermerk (z. B. „CI rot"); Controller nennen
Exit-Codes im Bericht und begründen eingesparte Arbeiter-Starts. Umsetzung durch studio-coach in `gates.md`,
`production-integrator.md`, `lead-tech.md` (Versionen, CHANGELOG). — Kosten bei Irrtum: Regeln einzeln zurücknehmen.

Entscheider: L0 · Anlass: Ad-hoc-Retro RETRO-ADHOC-HT4 · ADR: —

## R271 · 2026-10-06 · CI rot nach Mess-Wächter-Merge: Hotfix H-T5 mit Zeitreserve-Audit

Ruling: Beobachtung: Workflow „CI" Lauf 37441859308 auf `main` @ f10b479 rot — `tests/sim/islands-gen.test.ts:171`
AK-E1-01 „Seeds 1…200" im 5-s-Timeout; derselbe Test lief im grünen Lauf 37440669276 bereits mit 4992 ms (Reserve
≈ 0). Der Merge (nur `tools/render-qa`, `Makefile`, README) ist nicht Ursache; Pages Lauf 37441859292 grün. Ursache:
Test aus E1-T01 ohne CI-Reserve — die Regel R270 V1 greift nur für Tests **im Diff**, nicht für Bestand. **Hotfix
H-T5** durch lead-tech (sonnet, 2 Starts): (a) AK-E1-01 mit Reserve (aufteilen wie H-T4, Aussage unverändert, Rot-
Beleg); (b) **Audit:** alle Tests, die im CI-Log von 37441859308 > 2,5 s ohne eigenes Timeout bzw. > 50 % ihres
Timeouts liefen, auflisten und mit Reserve versehen (Aufteilen bevorzugt, sonst begründetes Timeout). Änderungen an
`islands-gen.test.ts` minimal halten (e2 änderte die Datei, C2-5) und im Seefahrt-Ledger für T14 vermerken. Keine
eigene Ad-hoc-Retro: gleiche Klasse wie RETRO-ADHOC-HT4 (dort angenommen); das Audit ist die Massnahme, der Fall zählt
als Datenpunkt für R270 V1. — Kosten bei Irrtum: weitere rote Läufe durch Bestandstests.

Entscheider: L0 · Anlass: Bericht production-integrator TOOL-MESSWAECHTER · ADR: —

## R272 · 2026-10-06 · Seefahrt C4 abgenommen, Start C5 (T14–T16)

Ruling: C4 angenommen: M1 in `feat/m12-see` (9a5e066, Prettier-Fix aefed6f), render `feat/m12-see-render` @ 530221d
(T10 OK, T11 BEDENKEN niedrig — Seelane je Frame und Schiff, doppeltes Schiffskonzept: angenommen, Messung mit ≥ 4
Schiffen in T14/T15), e2 `feat/m12-see-e2` @ a503f69 (T12 OK + Playtest OK, T13 OK + Playtest BEDENKEN niedrig).
Pflichtpunkte erfüllt; AK7 misst 1,253, Schranke 1,30 bleibt (D-145). **T15 übernimmt** die Ausbau-Grundtexte
(`hints.ts`, `deficitLine` nennen auf Fremdinseln den Heimat-Bestand) und den T11-Rest. **C5 startet** (lead-tech,
sonnet): M2 = `main` (E1, H-T4, H-T5 mit Merge-Hinweis `islands-gen.test.ts`, Mess-Wächter) in `feat/m12-see`, dann
**T14** Integration aller Stränge mit Neupin endgültig (P-8: Wert muss dem vorläufigen [6750, 11500, 320] gleichen,
sonst R74), danach **T15** UI Schiffe (+ Playtest; lead-art urteilt über T15-Screenshots, D-144) und **T16** Doku;
Final-Review lead-qa (opus) startet L0 danach. Budget aus R241: 9 Starts, Parallelität 1. Messungen nur mit
`make messfenster` (R269). — Kosten bei Irrtum: Neupin-Abweichung stoppt T14.

Entscheider: L0 · Anlass: Bericht lead-tech M12-SEE-C4 · ADR: —

## R273 · 2026-10-06 · H-R15 release-reif, fährt mit dem Seefahrt-Bündel

Ruling: H-R15 „Saum Fernansicht" (`feat/h-r15-saum` @ 55e5da1; Review OK nach einer Code-Fix-Runde, Bildvergleich
bestanden, Zoom 0,5/1/2 pixelgleich, Urteil lead-art OK, `make check`/`CI=true` EXIT=0 auf 060ed7e, danach nur Doku;
`renderMedian` unverändert, p95 Scheiben 7,6–8,0 ms) ist **release-reif**. Nach R249 (2) fährt es mit dem
Seefahrt-Merge (Konfliktgefahr `terrain.ts` mit dem render-Strang): Release **REL-05** = Seefahrt-Bündel + H-R15,
Merge-Reihenfolge Seefahrt zuerst, dann H-R15 per Merge von `main`. Kommt der Seefahrt-Merge nicht in dieser Session,
geht H-R15 am Session-Ende allein als REL-05 (Auslöser Session-Ende). Erster Zoom-out der Heimat in einem Zug ≈ 33 ms
(< 50 ms) hingenommen, Beobachtung bleibt. — Kosten bei Irrtum: H-R15 später, Konflikt dann in `terrain.ts`.

Entscheider: L0 · Anlass: Bericht lead-art H-R15 · ADR: —

## R274 · 2026-10-06 · Hex-Raster-Demo als Wegwerf-Prototyp ausserhalb des Spiels

Ruling: Nutzerauftrag „quick und dirty eine Demo mit hexagonalem Raster" wird als **Discovery-Prototyp** ausgelegt
(E-027), nicht als Umstellung des Spiels. Eine eigenständige HTML-Datei (Canvas 2D, ohne Abhängigkeiten) im
Session-Scratchpad, kein Code in `src/`, keine Spec, kein Plan, kein Review-Gate; ein Arbeiter (art-rendering-engineer,
sonnet) baut sie, L0 veröffentlicht sie als privates Artifact. Inhalt: Hex-Insel mit Terrain, Bauen per Klick,
Einflussradius, Strassen-Pfadsuche, Umschalter Quadrat/Hex zum Vergleich. Ein Umbau des Spiels auf Hex wäre ein
eigener Meilenstein mit Brainstorming und ADR (bricht ADR-012 Isometrie und alle Spielstände). — Kosten bei Irrtum:
eine Wegwerf-Datei, kein Eingriff in laufende Stränge.

Entscheider: L0 · Anlass: Nutzerauftrag · ADR: —

## R274b · 2026-10-06 · Gate Seefahrt: Fix-Runde F2 vor REL-05

Ruling: Final-Review lead-qa (`feat/m12-see` @ 4250784: BEDENKEN, nur niedrige Befunde; Determinismus-Probe mit
Schiffen zeichengleich, Bitgleichheit bestätigt, CI-Reserve ok) und Urteil lead-art (ZURÜCK nur wegen D-144 Regel 3:
Schiff bei Zoom 0,25/0,125 gezeichnet 6–8 px statt ≥ 12 px; Regeln 1/2 OK) angenommen. **Fix-Runde F2** vor dem
Merge (lead-tech, sonnet, 4 Starts aus R241: Umsetzer, Review, Playtest, lead-art-Bestätigung): (a) Mindestbreite gilt
für die gezeichnete Silhouette, nicht die Box (Vorgabe ≈ 16 px Formel-Minimum), Test misst Rumpf+Segel im
Fake-Kontext; Screenshots `1280-20*` neu, lead-art bestätigt; (b) N1 Ladeprüfung `left ≥ 1` bei `to ≠ null`; (c) N2
Abriss setzt `kontorId` nur bei `kontorId === b.id` auf `null`; (d) N5 Testtitel „version 10"; (e) N3 Kommentar
`defs/sea.ts:8`. N4 und Befunde → `docs/beobachtungen.md`. **Folgepakete nach REL-05** (eigene Rulings): Fahrlinie mit
Wegpunkten im Wasser (ändert `d`/E1-Band), UX-Paket (Heimatkontor-Klick → Schiffe, Text „spiel frei weiter" bei
offenem drittem Ziel), Art-Paket Schiffskontrast (heller Rand/Kielwasser). Nach F2: Gate Merge Release REL-05 =
Seefahrt + H-R15 durch L0. — Kosten bei Irrtum: Schiff in der Fernansicht weiter kaum sichtbar.

Entscheider: L0 · Anlass: Final-Review lead-qa, Urteil lead-art · ADR: —

## R275 · 2026-10-06 · F2 abgenommen, Kandidat REL-05 bauen

Ruling: F2 (`feat/m12-see` @ cb8bc9c: Schiff gezeichnet 16 px bei Zoom 0,25/0,125, N1/N2/N3/N5, Review OK, Playtest
OK, lead-art OK Regel 3, `make check`/`CI=true` EXIT=0 — Messfenster „belegt" durch Last 4,38 ohne Fremdprozesse,
für Breitenmessung unerheblich) angenommen. **REL-05** nach Gate Merge Release: (1) production-integrator baut den
Kandidaten in `.worktrees/integrate` ab `origin/main`: `feat/m12-see` @ cb8bc9c, dann `feat/h-r15-saum` @ 55e5da1, je
`--no-ff --no-commit`, `make check` + `CI=true make check`, grün committen, **noch kein Push**; Konflikt → stoppen und
melden. (2) qa-playtester am Kandidaten, je UI-Task ein Abschnitt (T12, T13, T15, H-R15) unter `.studio/qa/REL-05/`.
(3) lead-qa (opus) Delta-Review über Kandidat: F2-Delta seit dem Final-Review, H-R15 und die Merge-Stellen (R249 (1)).
(4) Gate durch L0, dann Push. — Kosten bei Irrtum: Kandidat frisch aufbauen.

Entscheider: L0 · Anlass: Bericht lead-tech M12-SEE-F2 · ADR: —

## R276 · 2026-10-06 · REL-05: Formatfix nach Union-Merge freigegeben

Ruling: Kandidat REL-05 Merge 1 (`feat/m12-see` → 5c52eed, `make check`/`CI=true` EXIT=0) steht. Merge 2
(`feat/h-r15-saum`) konfliktfrei, aber `prettier --check` rot: `merge=union` in `docs/beobachtungen.md` liess eine
Leerzeile fehlen. Freigabe an den Integrator: Merge 2 erneut, dann `npx prettier --write docs/beobachtungen.md` (nur
diese Datei), beide Checks, als **eigener Commit** `docs: Leerzeile nach Union-Merge (REL-05)` nach dem Merge-Commit;
dann `rel/rel-05` setzen. Wiederkehrendes Risiko (Union-Merge + Prettier) → Beobachtung für ein kleines Werkzeug
(z. B. Prettier im Merge-Ablauf des Integrators). — Kosten bei Irrtum: keine (Doku-Format).

Entscheider: L0 · Anlass: Bericht production-integrator REL-05 · ADR: —

## R277 · 2026-10-06 · Gate Merge Release REL-05: OK

Ruling: REL-05 = Seefahrt-Bündel E2+E3+E4 + drittes Ziel (Save v9) + H-R15 freigegeben. Prüfliste erfüllt: Kandidat
`rel/rel-05` @ 30a9f50 (Basis origin/main 6a58af9), `make check`/`CI=true` EXIT=0 (2132 Tests); Delta-Review lead-qa
OK (F2, H-R15, Merge-Stellen, CI-Reserve ≤ 20 %, Bitgleichheit); Browser-Lauf qa-playtester OK mit Abschnitten
`.studio/qa/REL-05/T12/`, `T13/`, `T15/`, `H-R15/`, `Allgemein/` (Ausbau-Hinweis mit Inselbestand im Browser belegt,
Banner einmal, Schiff 14–16 px, v1–v8 migriert, v99/kaputt abgewiesen, keine Exceptions). Doku nachgeführt (T16).
Integrator pusht `rel/rel-05` nach `main` (Fast-Forward), prüft CI und Pages. Niedrige Befunde (v99 „beschädigt"
statt „zu neu", fehlendes favicon) → `docs/beobachtungen.md`. Folgepakete nach R274b bleiben. — Kosten bei Irrtum:
Revert-Merge; v9-Spielstände wären im alten Build unladbar (nach R261 hingenommen).

Entscheider: L0 · Anlass: Delta-Review lead-qa, Playtest-Report REL-05 · ADR: —

## R278 · 2026-10-06 · Vorschläge Kurz-Retro e51712dd und Prozess-Retro REL-05

Ruling: Angenommen als Regeln (Umsetzung durch studio-coach bzw. ein Werkzeug-Paket in der nächsten Session):
(1) Integrator führt nach jedem Merge, der Dateien unter `docs/` per Union-Merge zusammenführt, `prettier --write` auf
genau diese Dateien aus und committet das ohne eigenes Ruling (Kurz V1 = Prozess V4; Schwelle 0 Formatbrüche in 3
Merges). (2) Studio-Test schlägt bei doppelter R-Nummer fehl (Kurz V2; kleines Werkzeug-Paket). (3) E-029 ist erster
Nachrücker für den nächsten freien Experiment-Platz, ergänzt um „L0-Kontext Max ≤ 250k" (Kurz V3). (4) Folgestränge
starten, sobald der Vorgänger die Schnittstelle mit Review OK liefert, auf dem Vorgänger-Branch (Prozess V1; Ziel ≤ 2 h
Wartezeit statt 12,4 h); Pläne nennen diesen Startpunkt. (5) Messkriterien (Bedingung, Statistik) und eine Zeitbox (3 h
oder 2 ungültige Serien) stehen vorab im Plan (Prozess V2). (6) Release-Playtest prüft Delta und Merge-Stellen; für
unveränderte UI-Tasks verweist die Prüfliste auf deren Strang-Playtest (Prozess V3). (7) Steuerungsanteil rot: R233 V1
bleibt, studio-coach misst die Wirkung in der nächsten Retro (Prozess V5). — Kosten bei Irrtum: Regeln einzeln
zurücknehmen.

Entscheider: L0 · Anlass: Retros `2026-10-06-session-e51712dd.md`, `2026-10-06-prozess-rel05.md` · ADR: —

## R279 · 2026-10-06 · Hex-Raster verworfen

Ruling: Nutzer hat die Hex-Demo (R274) gesehen und verwirft die Idee („gefällt mir nicht"). Das Spiel bleibt beim
Iso-Rautenraster (ADR-012); kein Hex-Meilenstein, kein Eintrag im Ideen-Pool. Das private Demo-Artifact bleibt
bestehen, bis der Nutzer das Löschen ausdrücklich verlangt (Verfassung §6, irreversibel). — Kosten bei Irrtum: keine,
die Demo ist reproduzierbar.

Entscheider: Nutzer · Anlass: Rückmeldung zur Hex-Demo · ADR: —

## R280 · 2026-10-06 · Auftrag „Lebendige Insel" (ART-STIL-02)

Ruling: Nutzerfeedback ausgelegt als Art-Strang unter `lead-art` nach dem Muster R209: (1) **ART-STIL-02** Diagnose
und Stilrahmen-Nachtrag: Wald organisch statt geometrisch-repetitiv, Gebirge weicher im Übergang zu Wiese/Küste
(Gelungenes behalten), Gebäudekanten weicher; Katalog ≥ 30 Entdeckungs-Elemente (Nutzerliste + eigene) mit
Seltenheit und Ort; Zuschnitt in Häppchen. Referenz: Flachwasser, Küste, Strand, Wiese, Tierleben. Alle Elemente
rein darstellend, deterministisch aus dem Seed, ohne Sim- oder Save-Änderung. (2) Umsetzung nach Gate. Zweck:
mehr zu entdecken in einem Guss; die Auslegung widerspricht ihm nicht, weil sie Bildziele vor Code festlegt. —
Kosten bei Irrtum: Phase 1 ist reine Analyse; Häppchen einzeln revertierbar.

Entscheider: L0 · Anlass: Nutzerfeedback 2026-10-06 · ADR: —

## R281 · 2026-10-06 · ART-STIL-02 direkt in die Produktion

Ruling: Nutzer: „ich muss nichts testen, setze es um, ich teste an der Produktion." ART-STIL-02 läuft ohne
Nutzer-Zwischenstände bis Pages durch: L0 entscheidet das kombinierte Gate sofort nach Eingang, Häppchen folgen
ohne Pause, Release nach Gate Merge. Interne Prüfungen (Review je Task, Browser-Check, opus-Review) bleiben
(Verfassung §9). — Kosten bei Irrtum: Revert des Release-Merges.

Entscheider: Nutzer · Anlass: Nutzerantwort 2026-10-06 · ADR: —

## R282 · 2026-10-06 · Bündeln von Prüfungen (ART-STIL-02)

Ruling: Nutzer: „Sachen bündeln, visuelle Tests und Playtests bündeln." Ausgelegt für ART-STIL-02: kein
qa-playtester je Häppchen, sondern **ein** Browser-Lauf je Release über alle Häppchen; Bildurteil je Häppchen
nur per Galerie-Skript durch lead-art (kein Agent-Start); unabhängige kleine Tasks eines Häppchens in einen
Engineer-Start (R233 V1); Blindtest L3 im Release-Lauf A. Review je Task und opus-Review je Release bleiben
(§9). Zweck: Zeit und Tokens sparen; Auslegung widerspricht ihm nicht, weil Prüftiefe am Release erhalten
bleibt. — Kosten bei Irrtum: Fehler fallen später auf, Fix-Runde im Release-Lauf.

Entscheider: Nutzer · Anlass: Nutzeranweisung 2026-10-06 · ADR: —

## R283 · 2026-10-06 · Gate ART-STIL-02 (kombiniert)

Ruling: Nachtrag „Lebendige Insel" freigegeben (lead-tech, lead-qa: BEDENKEN). Nacharbeit T1–T6, Q1–Q7 als
Test-Anhang zur Spec, ohne Zweitprüfung; §9: Caches ja, Mouse-over zurückgestellt, E8 mit Durchfallkriterium,
zwei Releases mit einer Freigabe. Stufe leicht nach E-028 trotz 8 Häppchen: je Häppchen ≤ 1 Session, keine
Sim-/Save-Änderung, opus-Review je Release. Budget lead-art 26 / lead-qa 2, Parallelität 3. — Kosten bei
Irrtum: Häppchen fliegt aus dem Kandidaten.

Entscheider: L0 · Anlass: `.studio/handoffs/2026-10-06-l0-lead-art-gate.md` · ADR: —

## R284 · 2026-10-06 · Playtest REL-05: Schiff unauffindbar

Ruling: Nutzer-Playtest bestätigt Folgepaket (2) aus R274b. Ein Schiff kann man kaufen (Heimatkontor → Handel →
«Zurück» → Schiffe), aber das Spiel sagt es nirgends: Der Leitsatz endet bei „Gründe ein Kontor“, der Grund „Kein
freies Schiff“ nennt keinen Weg. Nutzer-Auftrag: in dieser Session nichts umsetzen, nur Ideen aufnehmen →
IDEEN-04 (design-idea-scout): Seefahrt-Leitsätze (S), Werft (M), Auftragsreihe Seefahrt (M), Story-Rahmen (L).
Die S-Idee bekommt Vorrang im nächsten Release und wird mit Folgepaket (2) gebündelt; Werft, Auftragsreihe
und Story sind Bausteine für das nächste Meilenstein-Brainstorming. Bewertung durch lead-design in einer
späteren Session. — Kosten bei Irrtum: ein Häppchen wird umsortiert.

Entscheider: L0 · Anlass: Nutzer-Playtest 2026-10-06 · ADR: —

## R285 · 2026-10-06 · IDEEN-04b Nachtrag Playtest

Ruling: Nutzer-Nachtrag aufgenommen, weiterhin ohne Umsetzung. I-019 „Schiffsangebot am Kontor“ (gelbes «!»)
wird mit I-015 und Folgepaket (2) R274b gebündelt. Die Nutzeranforderungen an die Fahrlinie (nur Wasser, Tiefwasser
bevorzugt, Hindernisse meiden, flüssig) gehen als Beobachtung in Folgepaket (1). Die Glättung der Schiffspose ist
reines Render-Thema und lässt sich vorziehen; Wegpunkte brauchen weiter ein eigenes Ruling (`d`, E1-Band).
Figuren-Tempo (Streuung ≤ 1,5 : 1) als eigenes Render-Häppchen, nicht in ART-STIL-02 (das berührt die Figuren
nicht). — Kosten bei Irrtum: ein Häppchen wird umsortiert.

Entscheider: L0 · Anlass: Nutzer-Playtest 2026-10-06 · ADR: —

## R286 · 2026-10-06 · Playtest: Geisterbauten und Träger-Tempo

Ruling: Diagnose DIAG-PT1 angenommen (Einträge in `docs/beobachtungen.md`). Geisterbauten auf der Heimat sind ein
Live-Fehler aus M12-E2 und werden in der nächsten Session als erstes Häppchen (Hotfix H-F1, Render/UI, Reihentest
über alle Heimat-Iteratoren) vor allen Folgepaketen umgesetzt. Träger-Tempo wird ein Render-Häppchen zusammen mit
der Schiffs-Glättung (R285). In dieser Session keine Umsetzung (Nutzer-Auftrag). — Kosten bei Irrtum: Fehler bleibt
eine Session länger live.

Entscheider: L0 · Anlass: Nutzer-Playtest 2026-10-06 · ADR: —

## R287 · 2026-10-06 · Beobachtungen: fester Auswertungs-Takt

Ruling: Befund auf Nutzerfrage: letzte Auswertung von `docs/beobachtungen.md` am 2026-09-30, seither rund 175
neue Einträge (1227 Zeilen) ohne Sichtung; das Handbuch kennt keinen Takt. Neu: (a) Auswertung mit Skill
`beobachtungen-auswerten` durch `lead-production` nach jedem Release (Merge auf main/Pages) und spätestens, wenn
seit der letzten Auswertung 40 Einträge dazugekommen sind; (b) Ergebnis je Eintrag: erledigt (streichen),
abgehakt, Paket-Kandidat (Board) oder Idee (`docs/ideen.md`); (c) Kopfzeile „Letzte Auswertung“ ist Pflicht und
erscheint im Start-Bericht von L0. Erste Auswertung in der nächsten Session parallel zum Hotfix H-F1 (nur Doku,
disjunkte Dateien). Handbuch-Änderung setzt `studio-coach` beim Session-Ende um. — Kosten bei Irrtum: eine
Auswertung pro Release zu viel.

Entscheider: L0 · Anlass: Nutzerfrage 2026-10-06 · ADR: —

## R288 · 2026-10-06 · Beobachtungen: harte Schwelle beim Session-Start (ersetzt R287 (a))

Ruling: Nutzervorschlag übernommen. Stehen beim Session-Start mehr als 30 ungesichtete Einträge in
`docs/beobachtungen.md`, ist die Auswertung (`lead-production`, Skill `beobachtungen-auswerten`) das erste Paket
der Session; jeder Eintrag endet als erledigt, abgehakt, eingeplant (Board) oder Idee. Bis sie fertig ist,
startet keine neue Funktionsarbeit. Ausnahme: Hotfix für einen Live-Fehler läuft parallel. Die Zählung macht der
SessionStart-Hook (Einträge unter der Marke „Letzte Auswertung“) und meldet sie im Start-Kontext, nicht das
Gedächtnis von L0; Einbau des Zählers und Handbuch-Text durch `studio-coach` beim Session-Ende. Der Takt nach
Release (R287 (a)) entfällt. R287 (b) und (c) gelten weiter. — Kosten bei Irrtum: eine Session beginnt mit
Aufräumen statt mit Inhalt.

Entscheider: L0 · Anlass: Nutzervorschlag 2026-10-06 · ADR: —

## R289 · 2026-10-06 · Aufträge aus der Parallel-Session und R288-Übergang

Ruling: Vom Nutzer übermittelte Aufträge der Parallel-Session übernommen: Hotfix H-F1 (lead-tech) und Auswertung
`docs/beobachtungen.md` (lead-production) starten sofort parallel, R288-Umsetzung durch studio-coach. ART-STIL-02
läuft weiter: gestartet vor R288, kein neuer Start; weitere Funktionsarbeit (L4 ff., Träger-Tempo, Seefahrt-Hilfe)
erst nach der Auswertung. H-F1 geht als Hotfix-Release einzeln vor REL-A auf main. — Kosten bei Irrtum: Merge-
Nacharbeit in `iso.ts`/`life.ts` für L1.

Entscheider: L0 · Anlass: Nachricht Parallel-Session (vom Nutzer übermittelt) · ADR: —

## R290 · 2026-10-06 · Gate H-F1 und CI-Formatfehler

Ruling: Kurzplan H-F1 freigegeben, Alternative B (Helfer `homeBuildings`, Einzeilen-Umstellung je rot belegter
Stelle) statt gefiltertem `islandView`, weil kleiner und konfliktarm zu ART-STIL-02. Browser-Check gebündelt im
Hotfix-Release-Lauf (R282). CI rot auf main (R288/R289: Prettier in `beobachtungen.md`) per `prettier --write`
behoben (dc91839, R278 (1) sinngemäss). — Kosten bei Irrtum: Fix-Runde im Release-Lauf.

Entscheider: L0 · Anlass: Bericht lead-tech H-F1, CI 37488497826 · ADR: —
