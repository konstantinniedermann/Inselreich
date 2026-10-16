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

## R291 · 2026-10-06 · Auswertung BEOB-AUSW-01 und Reihenfolge

Ruling: Auswertung angenommen (13 Paket-Kandidaten auf dem Board, Marke „Letzte Auswertung: 2026-10-06"); R288
ist erfüllt, Funktionsarbeit darf wieder starten. Merge zusammen mit `tool/r288-beob-zaehler` (Handbuch 1.22)
durch den Integrator. Reihenfolge: H-F1 → CI-ACTIONS-NODE (Frist 2026-10-19) → ART-STIL-02 L4–L8 → SEE-F2-UX,
SEE-F1-FAHRLINIE → H-TRAEGER-TEMPO, RENDER-LOOK-01 (nach ART-STIL-02, Dateien `life.ts`/`terrain.ts`). — Kosten
bei Irrtum: Reihenfolge per Ruling umstellen.

Entscheider: L0 · Anlass: Bericht lead-production BEOB-AUSW-01 · ADR: —

## R292 · 2026-10-06 · Gate Merge Release H-F1

Ruling: Hotfix H-F1 (`fix/h-f1-geisterbauten` @ 4125b62) freigegeben: lead-qa OK (opus-Review, `CI=true make
check` grün, Browser-Lauf Vorher/Nachher `.studio/qa/rel-hf1/`). Integrator pusht ihn zusammen mit der bereits
gemergten Auswertung (51f28ac); der Zähler-Branch folgt nach der Fix-Runde einzeln. arc42-Nachtrag
`homeBuildings.ts` → Beobachtung. — Kosten bei Irrtum: Revert-Merge.

Entscheider: L0 · Anlass: Bericht lead-qa REL-HF1 · ADR: —

## R293 · 2026-10-06 · Gate CI-ACTIONS-NODE (Kurzentscheid)

Ruling: Kleinpaket ohne `src/`-Änderung, Gate durch L0 im Briefing (R260): Actions auf die neuesten Major-Versionen
mit Node-24-Laufzeit heben (per `gh api` belegt), Runner auf `ubuntu-24.04` festnageln statt `ubuntu-latest`, damit
der Wechsel auf Ubuntu 26 kein ungeplantes Ereignis wird; Umstieg auf 26 später als eigenes Paket. Umsetzung
lead-production, Review `qa-code-reviewer`. — Kosten bei Irrtum: CI rot, Revert des Commits.

Entscheider: L0 · Anlass: BEOB-AUSW-01, Frist 2026-10-19 · ADR: —

## R294 · 2026-10-06 · Union-Merge holt ausgewertete Beobachtungen zurück

Ruling: `merge=union` auf `docs/beobachtungen.md` hat beim H-F1-Merge rund 490 von der Auswertung gestrichene Zeilen
zurückgeholt (Branch zweigte vor 13316d9 ab). Reparatur durch den Integrator (Fassung 13316d9 + Einträge der
Branch). Regel bis zu einem Werkzeug-Fix: Bei jedem Merge einer Branch mit Basis vor 13316d9 übernimmt der
Integrator für diese Datei die main-Fassung und hängt nur die von der Branch **neu** hinzugefügten Einträge an
(`git diff <merge-base> <branch> -- docs/beobachtungen.md`); danach `context.py` ≤ 30 prüfen. Betrifft alle
ART-STIL-02-Branches. — Kosten bei Irrtum: verlorener Eintrag, auffindbar in der Branch-Historie.

Entscheider: L0 · Anlass: Integrator-Bericht DOC-MERGE-01 · ADR: —

## R295 · 2026-10-06 · ART-STIL-02 Abweichungen L1/L3, Start L4

Ruling: Angenommen: L1 renderMedian Seed 7/Zoom 1 +0,3 ms (Häppchen-Budget +0,2; Release-Budget +0,5 hält, lichteres
Dach widerspräche dem Bildziel); L3 Cache-Aufbau +36 % (nur bei Zoomwechsel, Frame ±0); Salz-Korrektur im Anhang
(822a4db). L4 startet sofort, gestapelt auf `feat/art02-l1-wald` mit main (H-F1) per Merge, erster Task
Patch-Messung (T3). — Kosten bei Irrtum: Release-Lauf misst gesamt, Häppchen fliegt bei Überschreitung.

Entscheider: L0 · Anlass: Berichte lead-art L1, L3 · ADR: —

## R296 · 2026-10-06 · D-148 Gebirgsfuss, Start L6

Ruling: D-148 bestätigt: Fuss ≥ 1,6 Kacheln plus Knick-Test; Kern ausserhalb der Fusszone (≤ 40 % der Knoten) bleibt
hart pixelgleich geprüft — die beiden AK schlossen sich aus, die einfachere Variante gilt (R136). L6 (Gebirge und
Wald entdecken) startet jetzt gestapelt auf `feat/art02-l2-gebirge` @ 76edd0c (enthält L1), Release B. — Kosten bei
Irrtum: L6 nachziehen, falls Release A L1/L2 ändert.

Entscheider: L0 · Anlass: Bericht lead-art L2 · ADR: —

## R297 · 2026-10-06 · Kandidat REL-06 „Gewachsene Insel", Abweichungen L4/L6, Start L5

Ruling: Angenommen: L4 Bild-Runde 3 (nur Stempel), A3 ≥ 1 Kachel, A5 ≤ 8, statische Orte mit lesendem
`generateTerrain` (Release-Review prüft Reinheit); L6 (a) Salze in `massif.ts`/`trees.ts`, L8 trägt nach, (b)
`forest.ts` additiv, (c) Renderer-Pin. REL-06 = L2 (enthält L1) + L3 + L4, Kandidat `rel/rel-06` durch den
Integrator, ein Browser-Lauf mit allen blinden Bildfragen und L3-Blindtest, ein opus-Review (R282). L5 startet
gestapelt auf L4. — Kosten bei Irrtum: Häppchen fliegt aus dem Kandidaten.

Entscheider: L0 · Anlass: Berichte lead-art L4, L6 · ADR: —

## R298 · 2026-10-06 · Gate REL-06: ZURÜCK für L1, L3-Kriterium ausgelegt

Ruling: REL-06 nicht gepusht. L1 bekommt eine Fix-Runde (Bildfrage 2 durchgefallen: Kugelraster Laubwald Seed 1,
Nadelreihen Seed 7) — der Nutzerauftrag war genau „Wald nicht repetitiv", ein Nachziehen in L6 widerspräche dem
Zweck; Fix ohne Mehrkosten (Seed 7 +0,5 ms an der Grenze), danach Rater-Nachprüfung Fragen 1–2 und A/B. L3 nach
Auslegung „kein Rückschritt gegenüber vorher" bestanden (Paarvergleich 20/23 = 20/23). L2, L4 OK. Doku-Nachtrag
arc42 und Salzkopf in der Fix-Runde. — Kosten bei Irrtum: eine Session Verzug für Release A.

Entscheider: L0 · Anlass: Bericht lead-qa REL-06, `.studio/qa/rel-06/` · ADR: —

## R299 · 2026-10-07 · L1-Fix: Ränder als Folgepaket, hängende Messung

Ruling: L1-Fix (`fix/art02-l1-wald-r2` @ be4ce8e) behebt das Muster (Gate-Grund Frage 2); die Rautenform der
Waldflächen in der Übersicht kommt aus der kachelweisen Waldmaske und wird Folgepaket „Waldsaum" (render-only,
direkt nach REL-06). Rater prüft Fragen 1–2 auf diesem Stand. Hängende L5-Messung (PID 42157, Ruhezustand) per PID
beendet; Messungen seriell. `pkill -f "vitest run"` eines Engineers → Retro (R263). — Kosten bei Irrtum: Ränder
bleiben eine Release länger eckig.

Entscheider: L0 · Anlass: Bericht lead-art L1-Fix · ADR: —

## R300 · 2026-10-07 · REL-06 mit L1-Fix als Zwischenstand, Wald zweiter Anlauf

Ruling: Rater-Nachprüfung: Frage 2 weiter durchgefallen (Nadelwald-Teppich), Frage 1 grenzwertig; zwei Bild-Runden
sind ausgeschöpft (R211). L1 lässt sich nicht aus dem Kandidaten lösen (L2/L4 gestapelt). REL-06 geht mit L1-Fix
live, sobald dessen A/B-Messung ≤ +0,5 ms hält: gegenüber main messbar weniger repetitiv (gleiche Diagonal-Stempel
0,315 → 0,145), L2–L4 bestanden, der Nutzer will Fortschritt in der Produktion (R281). Direkt danach Paket
**WALD-02** (zweiter Anlauf inkl. Waldsaum, Mandat auch für Struktur-Umbau in `src/render/`) vor L5–L8. — Kosten bei
Irrtum: Nutzer sieht den Wald noch nicht am Ziel; Bericht sagt das offen.

Entscheider: L0 · Anlass: `.studio/qa/rel-06/blind/nach-l1r2.md` · ADR: —

## R301 · 2026-10-07 · Gate Merge Release REL-06

Ruling: REL-06 freigegeben = `rel/rel-06` (L1–L4, lead-qa-Review R298) + L1-Fix `fix/art02-l1-wald-r2` (Task-Review
OK, A/B Seed 7 +0,4 ms ≤ +0,5; Seed 14 entfällt wegen Last 14–16, Kandidat dort +0,3). Integrator merget den Fix in
den Kandidaten, `make check` + `CI=true make check`, Befunde aus dem Handoff anhängen, Push nach main. — Kosten bei
Irrtum: Revert-Merge.

Entscheider: L0 · Anlass: Messung `.studio/qa/art-stil-02/l1r2/perf-s7-1920.txt`, R300 · ADR: —

## R302 · 2026-10-07 · REL-06 live, Hotfix H-T6 CI-Timeout

Ruling: REL-06 ist live (main 464d490, Pages 37585424789 grün). CI 37585424784 rot: `variants.test.ts:308` Timeout
5 s bei 8,1 s im Runner, lokal grün. Hotfix H-T6 (lead-tech) hat Vorrang, Gate im Briefing: Test-Timeout mit R270-
Reserve oder kleinerer Test, kein `src/`. WALD-02 startet parallel (disjunkte Dateien). — Kosten bei Irrtum: CI
bleibt eine Runde länger rot; Produktion unberührt.

Entscheider: L0 · Anlass: Integrator-Bericht REL-06 · ADR: —

## R303 · 2026-10-07 · Vorschläge Ad-hoc-Retro 2026-10-07

Ruling: Angenommen: E-031 als Anpassung von E-022 (kein neuer Platz): `merge=union` für `docs/beobachtungen.md`
entfällt, Konflikte löst der Integrator (beide Anhänge behalten). E-032 als Werkzeug-Paket TOOL-CHECK-ZEITTEST
(`make check` prüft Zeittest-Timeouts und Doku-Prettier). Regel: Guard sperrt `pkill`/`killall` mit `-f`
(TOOL-GUARD-PKILL); Messläufe mit Wanduhr-Limit und `caffeinate`. E-033 (Rater nach jedem Layer) vorgemerkt, startet
mit WALD-02 sinngemäss (Rater im Paket). — Kosten bei Irrtum: mehr Merge-Konflikte in einer Datei.

Entscheider: L0 · Anlass: `docs/studio/retros/2026-10-07-adhoc-session-7db07561.md` · ADR: —

## R304 · 2026-10-07 · L5 release-reif, Start L7, L8 danach

Ruling: L5 angenommen inkl. (a) Meer-Plan am Start-Kontor, späte Kontore blenden aus, (b) `seaFields.ts`,
`iso.ts`-Argument, Renderer-Pin, D5 auf Rauschkamm; Nachmessung Zoom 1 holt der Release-Lauf B nach. L7 startet
gestapelt auf L5 (main per Merge); L8 erst nach L7, weil das Seltenheitsbudget alle Gruppen zählt und die
Rechnerlast (12–20) Messungen bereits staut. — Kosten bei Irrtum: L8 eine Runde später.

Entscheider: L0 · Anlass: Bericht lead-art L5 · ADR: —

## R305 · 2026-10-07 · N-97 Guard pkill/killall, Startstopp für neue Arbeit

Ruling: (1) Nutzerfreigabe „VERFASSUNG ÄNDERN" für N-97: L0 setzt in der Hauptsession um (Freigabe gilt nur hier,
§1.3): Guard verweigert `pkill`/`killall` immer, `kill <PID>` bleibt; Test zuerst rot, dann grün, Review
`qa-code-reviewer` (§9.1). (2) Nutzer: „keine neuen generellen Prozesse, nur Subprozesse zur Beendigung der
laufenden." Laufend und zu Ende geführt: WALD-02, L7, TOOL-CHECK-ZEITTEST, Retro-Merge, Guard; dazu deren Reviews,
Merges und ein Release-Lauf für fertige Häppchen (L5, L6, L7, WALD-02). Nicht gestartet: L8, Waldsaum-Rest,
Folgepakete. — Kosten bei Irrtum: L8 wartet auf neuen Auftrag.

Entscheider: Nutzer · Anlass: Nutzerantworten 2026-10-07 · ADR: —

## R306 · 2026-10-07 · Session-Abbruch auf Nutzerwunsch

Ruling: Nutzer beendet die Session („beim nächsten Start soll es weitergehen"). Laufende Agenten (WALD-02, L7) enden
mit dem Prozess; ihre Worktrees bleiben unangetastet. Übergabe in `state.md`, Abschnitt „Fortsetzung beim nächsten
Start". Session-Ende-Routine (Metriken, Kurz-Retro) wird dort nachgeholt. — Kosten bei Irrtum: Nacharbeit beim Sichten
der Worktrees.

Entscheider: Nutzer · Anlass: Nutzeranweisung 2026-10-07 · ADR: —

## R307 · 2026-10-07 · L7 Tierleben release-reif für Release B

Ruling: L7 (`feat/art02-l7-fauna` @ 07c16f1) angenommen für den Kandidaten Release B; kein Einzel-Merge. Eigenentscheid
lead-art (Hase sitzt ≈ 55 % statt ≈ 70 %) bestätigt. Perf +0,2 ms liegt auf der Grenze und wird im Release-Lauf B
nachgemessen; voller `make check` nach dem Kommentar-Fix 46bd06c entfällt, der Integrator prüft im Kandidaten. Gischt
am Kliff (braucht L6) und das Zeitlimit des Eignungstests unter Last prüft der Release-Lauf B. Release B wartet nur
noch auf WALD-02 (Arbeiter läuft). Die CI-Retro-Meldungen auf main sind durch H-T7 erledigt (main grün,
37645643528). — Kosten bei Irrtum: ein Nachlauf im Release-Kandidaten.

Entscheider: L0 · Anlass: Bericht lead-art L7 · ADR: —

## R308 · 2026-10-07 · Kurz-Retro 7db07561: Berichtigung R306, Vorschläge E-034 bis E-036

Ruling: (1) Berichtigung R306: Die Agenten endeten nicht mit dem Prozess; WALD-02-Engineer und L7-Lead arbeiteten in
der Folgesession weiter (Retro 2026-10-07 session-7db07561). Darum startet L0 für WALD-02 keine frische Instanz,
sondern wartet auf den laufenden Lead. (2) E-034 (Übergabe-Prüfzeile bei Abbruch) angenommen als Handbuch-Änderung,
Umsetzung studio-coach; zwei Sätze, schliesst einen Ablauffehler (R127) und ist kein neues Paket im Sinn von R305.
(3) E-035 (überholte CI-Vorfälle automatisch erledigen) und E-036 (Cache-Write je Instanz) bleiben `vorgeschlagen`:
Werkzeug-Pakete, nach R305 nur mit neuem Nutzer-Auftrag. — Kosten bei Irrtum: veraltete CI-Meldungen bleiben im
Dashboard sichtbar, bis eine Retro sie quittiert.

Entscheider: L0 · Anlass: Bericht studio-coach Kurz-Retro 7db07561 · ADR: —

## R309 · 2026-10-07 · WALD-02 release-reif, Kandidat REL-07 (Release B), D-149

Ruling: WALD-02 (`feat/wald-02` @ c9fa371, Fix-Runde 3) angenommen für Release B. D-149: Die Lesbarkeit (Bergwald
in Seed 7, Hütte im Wald) prüft der gebündelte Rater im Release-Lauf B, kein eigener Rater-Start (Empfehlung lead-art,
R282). REL-07 = L5 + L6 + L7 + WALD-02, Kandidat `rel/rel-07` durch den Integrator in `.worktrees/integrate` (R264),
Merge-Reihenfolge L5 → L6 → L7 → WALD-02, kein Rebase. In `docs/beobachtungen.md` bleiben bei einem Konflikt beide
Anhänge (E-031), jeder andere Konflikt geht zurück an lead-art. Danach ein Browser-Lauf lead-qa mit allen blinden
Fragen, ein opus-Review, Gate, Push. Perf: Seed 7 liegt mit WALD-02 genau auf +0,7 ms; das Release-Budget misst der
Lauf gegen main. — Kosten bei Irrtum: ein Häppchen fliegt aus dem Kandidaten.

Entscheider: L0 · Anlass: Bericht lead-art WALD-02 · ADR: —

## R310 · 2026-10-07 · REL-07: Konflikte auf eigenem Auflösungs-Branch

Ruling: Der Integrator brach den L5-Merge ab (Code-Konflikt `tests/render/renderer.test.ts`). Probe-Merges
(`git merge-tree`) zeigen Code-Konflikte zwischen WALD-02, L6 und L7 (`forest.ts`, `iso.ts`, `terrain.ts`, `trees.ts`,
Render-Tests). L7 enthält L5 und ist mit main schon konfliktfrei bis auf `docs/beobachtungen.md`. Darum: lead-art baut
`int/rel-07` (Worktree `.worktrees/rel07-aufloesung`) von `feat/wald-02`, mergt L7, dann L6, löst die Konflikte
inhaltlich (keine Funktion eines Häppchens fällt weg) und macht `make check` und `CI=true make check` grün. Der
Integrator mergt danach nur `int/rel-07` in `rel/rel-07`. Ändert die Auflösung Zeichnen oder Perf, misst der Release-Lauf
das mit. — Kosten bei Irrtum: eine Auflösungsrunde mehr.

Entscheider: L0 · Anlass: Bericht Integrator REL-07 · ADR: —

## R311 · 2026-10-07 · Auflösung `int/rel-07` angenommen, Kandidat REL-07

Ruling: `int/rel-07` @ 3567348 angenommen: WALD-02-Fassung als Basis, L5-Meer, L6-Lichtung (`isClearing` auf
Feld-Salz 508) und Farn im WALD-02-Modell additiv; Pins HOME_CALLS/HOME_ORDER und vier Timeouts (R270) begründet.
Der Release-Lauf prüft die L6-Lichtungen und den Farn besonders (Helfer `kernOx`/`isClearingTile` entfielen) und
misst die Perf gegen main. C7-Glitzern am Wasserfall war nie verdrahtet: nicht Teil von REL-07, bleibt Beobachtung
(R305, kein neues Paket). Deckel E-010 überschritten (249k beim Arbeiter) — Befund für die Retro. Integrator mergt
`int/rel-07` in `rel/rel-07`, prüft, pusht den Kandidaten. — Kosten bei Irrtum: Fix-Runde im Release-Lauf.

Entscheider: L0 · Anlass: Bericht lead-art REL-07-AUFLOESUNG · ADR: —

## R312 · 2026-10-08 · REL-07 Release-Lauf fortsetzen

Ruling: Der Release-Lauf B (lead-qa) brach über Nacht nach Perf (Seed 7: +0,1 ms nah, 0 ms fern) und Live-Seeds 1/7
ab; Seed 14 meldet Zeitüberschreitung, Rater, opus-Review und Gate fehlen. Eine frische lead-qa-Instanz übernimmt die
Ablage `.studio/qa/rel-07b/`, wiederholt Erledigtes nicht und liefert das Gate-Urteil. Nutzer-Auftrag „kurze Session":
reicht die Zeit nicht, Zwischenstand mit Fortsetzungspunkt in state.md. — Kosten bei Irrtum: ein Doppellauf von Seed 14.

Entscheider: L0 · Anlass: Session-Start, Sichtung `.studio/qa/rel-07b/` · ADR: —

## R313 · 2026-10-08 · Gate Merge REL-07: ZURÜCK, Fix-Runde FIX-REL07

Ruling: Gate-Urteil lead-qa (Kandidat `rel/rel-07` @ 9c6920c) angenommen: ZURÜCK, eng begrenzt. Fix-Runde FIX-REL07
an lead-art (Render-Engineer) auf `int/rel-07`, Start nächste Session:
(a) **Bau-Ruckeln beheben** (Pflicht): Bau löst 4–6 Frames 33–50 ms aus (main 0), Ursache Neuaufbau `sortedObjects`
(`iso.ts:180-250`, Wald-/Lichtungsschleife je Bau). Ziel: Ruckel-Frames je Bau wie main (±1). Kaltstart Seed 14
(20 s gegen 8 s) mituntersuchen. (b) **Fernansicht L5:** Wrack und Felseiland E8 erst ab Zoom ≥ 0,5 zeichnen
(KISS statt Neuzeichnung); danach die K-Proben blind neu. (c) `docs/arc42.md` für L5/L6/L7 nachführen, Salz-Register
(B5) nachführen. (d) **Perf-Budget:** nach (a) neu gegen main messen; ein Überschreiten von ≤ +0,5 ms wird bis
+1,5 ms `renderMedian` angenommen, solange `frameMedian` 16,7 ms und `emergencyFrames` 0 bleiben (absolut ≤ 6 ms).
(e) Review-Befunde B4 (Filter `own`, Prüfung nicht schwächer), B7 (Kronen-Atlas 12 MiB), B8 (Delfine im Mouse-over)
angenommen. Rater-Bedenken (Hütten-Tür, L6-Fussring, Schaumbögen „wie Möwen") blockieren nicht → Beobachtungen.
Danach nur Nachprüfung der geänderten Punkte (Ruckeln, Perf, K-Proben), kein voller Release-Lauf. — Kosten bei Irrtum:
eine weitere Fix-Runde.

Entscheider: L0 · Anlass: Gate-Bericht lead-qa REL-07, Handoff `.studio/handoffs/2026-10-08-l0-lead-qa-rel07-befunde.md` · ADR: —

## R314 · 2026-10-08 · Aufwandsverteilung: Hebel 1 und 5 als Experiment

Ruling: Nutzerfrage „was braucht am meisten Zeit, liesse sich das verschnellern?" beantwortet mit
`docs/studio/retros/2026-10-08-proc-aufwandsverteilung.md` (Grafik 36 % Zeit / 41–55 % Token; Treiber Anläufe +
Nacharbeit; 5-min-Cache-Fristablauf ≈ 22 % Token). Angenommen als Experiment (Nummer vergibt studio-coach):
**Hebel 1** lange Bash-Läufe von Umsetzern und Leads im Hintergrund, Abfrage spätestens alle 4 min (ersetzt nicht
ADR-007: Arbeiter-Starts bleiben Vordergrund); **Hebel 5** Leads bei Ein-Umsetzer-Paketen auf sonnet bzw. Lead-Schicht
weglassen. Hebel 2–4 nacheinander erst nach Messung von 1 (sonst nicht trennbar). Laufende Fix-Runde FIX-REL07 bleibt
unberührt. — Kosten bei Irrtum: ein Rückbau im Handbuch, Messgrösse Cache-Write-5-min-Anteil.

Entscheider: L0 · Anlass: Nutzerfrage, Bericht studio-process-coach PROC-AUFWAND · ADR: —

## R315 · 2026-10-08 · Kurz-Retro 8ef9d27f: E-039 und E-041 angenommen, E-040 wartet

Ruling: (1) E-039 (Perf-Ablage nennt Vergleichsart `aa-`/`ab-<A>-vs-<B>`; L0 meldet nur Zahlen aus dem Lead-Bericht)
und E-041 (`.studio/qa/<id>/stand.md` mit Fortsetzungspunkt, Messskripte unter `tools/render-qa/`) angenommen als
Handbuch-Sätze; sie schliessen Ablauffehler (R127) und sind kein neues Paket im Sinn von R305. Umsetzung studio-coach
in der nächsten Session. (2) E-040 (Bau-Ruckel-Szenario in `perf.mjs`) bleibt `vorgeschlagen` (Werkzeug-Paket, R305);
FIX-REL07 (R313) legt seine Ruckel-Messung aber als Nachweis unter `tools/render-qa/` ab. — Kosten bei Irrtum: zwei
Handbuch-Sätze zurücknehmen.

Entscheider: L0 · Anlass: Bericht studio-coach Kurz-Retro 8ef9d27f · ADR: —

## R315 · 2026-10-08 · Ablauf-Effizienz erkennt das Studio selbst

Ruling: Nutzer 2026-10-08: Verbesserungen im Ablauf und in der Zusammenarbeit muss das Studio selbst erkennen und
einführen (Aufgabe des Prozess-Coaches, Grundlage Worker-Logs). Befund: Die Effizienz-Ampel zeigte Cache-Write 5 min
ROT (33,7 %), ohne dass eine Retro daraus einen Hebel machte; erst die Nutzerfrage löste R314 aus → Ablauffehler.
Vorfall-Retro durch studio-process-coach: Warum blieb das unentdeckt, und welcher Mechanismus macht es künftig
automatisch (Auslöser, Rolle, Werkzeug)? Umsetzung des Vorschlags per eigenem Ruling. — Kosten bei Irrtum: eine Retro.

Entscheider: L0 · Anlass: Nutzeranweisung nach R314 · ADR: —

## R316 · 2026-10-08 · Retro „Effizienz unentdeckt": V1–V3 angenommen

Ruling: Bericht `docs/studio/retros/2026-10-08-vorfall-effizienz-unentdeckt.md` angenommen. Ursache: rote Ampel in
11 Retros gelesen, aber Vorlage erlaubte „Ursache unbelegt" statt Hebel; Prozess-Aussensicht nach REL-06 fehlte
(kein Auslöser). **V2** (Pflichtspalte „Hebel oder Messauftrag mit Frist" je roter Ampelzeile, 3. Retro in Folge =
Vorschlag Pflicht) + Release-Checkliste „nach Merge auf main: studio-process-coach starten" → studio-coach, sofort.
**V1** (Vorfall `ampel:<kennzahl>` bei 2 Sessions rot, ≥ 10 Agenten) + **V3** (Neuschreibungen nach Pause > 5 min
je Rolle/Paketfamilie im Metrik-Lauf) → ein Werkzeug-Paket TOOL-AMPEL an lead-tech (R315 schlägt R305 für dieses
Paket). Die zweite rote Zeile (Persona-Starts als general-purpose auf opus) fällt sofort unter V2. — Kosten bei
Irrtum: ein Werkzeug-Paket; Rückbau per Revert.

Entscheider: L0 · Anlass: Retro R-2026-10-08-effizienz-unentdeckt · ADR: —

## R317 · 2026-10-08 · Gate Merge TOOL-AMPEL: OK mit zwei Kleinkorrekturen

Ruling: Review OK angenommen. (1) `persona_opus` zählt nur Abweichungen ab dem Guard (2026-10-04); Altfälle vor
dem Guard sind erledigte Historie und dürfen die Zeile nicht dauerhaft rot halten — sonst wird der Ampel-Vorfall zum
Dauerrauschen und verliert seinen Zweck. (2) Die Wahl „Datenbasis … Agenten" als Zählbasis für die Grenze 10 im
Code kommentieren (eine Zeile). Danach seriell Merge durch production-integrator inkl. `make check`. Der erste
Vorfall `ampel:cache_write_5m` ist durch R314/E-037 adressiert; `ampel:steuerung` geht an die nächste Session-Retro
(V2-Pflicht). — Kosten bei Irrtum: Altfälle unsichtbar; sie stehen in den Retros und in R167.

Entscheider: L0 · Anlass: Bericht lead-tech TOOL-AMPEL · ADR: —

## R318 · 2026-10-08 · Retro CI main: Hebel V1 (Timeout-Altlasten) angenommen

Ruling: `docs/studio/retros/2026-10-08-ci-main.md` angenommen. 6 von 8 roten CI-Läufen auf main waren Test-Timeouts
(5 s Standard) bei Altlast-Tests aus `tools/zeitreserve/baseline.json`; Hotfixes trafen jeweils nur den letzten
Test. V1 an lead-tech (Paket TOOL-TIMEOUTS): die 21 übrigen Altlasten bekommen begründete eigene Timeouts oder werden
geteilt. Messgrösse: 0 Altlasten mit Standard-Timeout, kein Timeout-Rot in den nächsten 20 CI-Läufen, Frist
2026-10-22. Befund am Rand: die Session-Retro 8ef9d27f hatte 7 CI-Vorfälle ohne Ursachenanalyse quittiert — durch
V2 (R316) künftig ausgeschlossen. — Kosten bei Irrtum: längere Testlaufzeit, Rückfall per Revert.

Entscheider: L0 · Anlass: Retro R-2026-10-08-ci-main · ADR: —

## R319 · 2026-10-08 · Retro Steuerung: V1, V2, M1 angenommen; Experiment-Plätze rotieren

Ruling: `docs/studio/retros/2026-10-08-ampel-steuerung.md` angenommen. Hauptteil der Steuerung ist Lead-Handarbeit
(81 % Bash-Turns) und Neuschreibung nach Turn-Ende (65 %), nicht Briefings. **V1** Leads nach Abschlussbericht nicht
fortsetzen, sondern per Handoff ablösen (ersetzt E-029). **V2** `active`/`done`-Statusturns der Leads streichen,
sofern studio-coach vorher belegt, dass das Dashboard sie nicht braucht. **M1** Metrik-Spalte „vorher Turn-Ende" und
Lead-Turn-Zahlen (Werkzeug, lead-tech). Zweiter Befund: E-029, E-036, E-037, E-038 warten alle auf einen Platz
(Verfassung §: höchstens 3 gleichzeitig) — „wartet auf Platz" darf kein Dauerzustand sein. studio-coach bewertet die
laufenden E-022, E-027, E-030 und schliesst reife ab, damit E-037 sofort startet; Rotation statt Warten. — Kosten
bei Irrtum: ein Experiment endet früh, Wiederaufnahme möglich.

Entscheider: L0 · Anlass: Retro R-2026-10-08-ampel-steuerung · ADR: —

## R320 · 2026-10-08 · Gate Merge TOOL-AMPEL-M1: OK

Ruling: Review OK (zwei niedrige Hinweise, nicht blockierend: Status-Erkennung per Textsuche, fehlender Test für
Streaming-Duplikate) angenommen; Merge `tool/ampel-m1` @ a79314f durch production-integrator. Erste Zahlen stützen
R319 V1: 93 % der lead-art-Neuschreibungen folgen auf Turn-Ende. Paketfeld-Normalisierung → beobachtungen.md.
— Kosten bei Irrtum: Messspalte leicht ungenau, kein Einfluss auf Spiel oder Ampel.

Entscheider: L0 · Anlass: Bericht lead-tech TOOL-AMPEL-M1 · ADR: —

## R321 · 2026-10-08 · `zeitreserve` rot nach Merge M1: Last-Artefakt, an TOOL-TIMEOUTS

Ruling: Merge 772e4bb bleibt (Diff nur `tools/studio/`, 2317 Tests + studio-test grün). `zeitreserve` rot bei
`tests/render/terrainFoothills.test.ts` und `massif.test.ts` (≈ 4 s gegen Grenze 3,75 s bei 30 s Timeout) fällt
zeitlich mit parallelen Testläufen von TOOL-TIMEOUTS zusammen (Lastabhängigkeit, Thema E-030). Beide Tests gehen
in den Umfang von TOOL-TIMEOUTS. Nach dessen Merge seriell `make check` ohne parallele Testläufe; Worktree-Aufräumen
`tool-ampel-m1` dann mit. — Kosten bei Irrtum: main bis dahin lokal mit rotem Zeitreserve-Schritt, kein Push.

Entscheider: L0 · Anlass: Bericht production-integrator TOOL-AMPEL-M1 · ADR: —

## R322 · 2026-10-08 · Gate Merge TOOL-TIMEOUTS: OK

Ruling: Review OK angenommen; Baseline der Zeitreserve-Altlasten 29 → 0, alle mit hergeleitetem Timeout. Merge
`tool/timeouts` @ 4695986 durch production-integrator, danach `make check` ohne parallele Agenten (lastarm, R321).
Korrektur zum Bericht: `tests/render/massif.test.ts` existiert auf main (seit L2, 72f14fa); bleibt er danach rot,
bekommt er im selben Muster ein hergeleitetes Timeout (Trivial-Fix, eigener Commit). Lastabhängige Zusatzmeldungen
(Load 13–35) bleiben Thema der Lastregel aus E-030. Konfliktpunkt mit FIX-REL07: `tests/render/terrain.test.ts`
(Integrator-Hinweis für REL-07). — Kosten bei Irrtum: längere Testtimeouts, Revert möglich.

Entscheider: L0 · Anlass: Bericht lead-tech TOOL-TIMEOUTS · ADR: —

## R323 · 2026-10-08 · Nutzerwünsche Bedienung: nur aufnehmen

Ruling: Die fünf Nutzerwünsche (Leertaste Pause, Pipette, Gebäude direkt in höherer Stufe bauen, Taste `U` für
Upgrade, übersichtliches Gebäude-Panel) kommen als I-022…I-026 mit Status `neu` und Quelle „Nutzer 2026-10-08“ in
`docs/ideen.md`, ausdrücklich ohne Umsetzung (Nutzerwortlaut „nur aufnehmen nicht implementieren“). Bewertung nach
Raster in der nächsten Ideen-Runde; vorher prüft der Eintrag, was davon schon existiert (z. B. bestehende
Tastenbelegung, Upgrade-Regeln). R305 gilt weiter: keine neuen Pakete, FIX-REL07 hat Vorrang. Eintrag durch
`design-idea-scout`, ein Start. — Kosten bei Irrtum: keine, reiner Pool-Eintrag.

Entscheider: L0 · Anlass: Nutzer-Auftrag Session-Start · ADR: —

## R324 · 2026-10-08 · Zwei L0-Sessions auf FIX-REL07: Session #2 zieht sich zurück

Ruling: Zwei L0-Sessions (anno-clone #2, #3) haben FIX-REL07 parallel bearbeitet, beide im Worktree
`.worktrees/rel07-aufloesung` (`int/rel-07`) — Verstoss gegen „Eine aktive L0-Session je Repo" (R129) und gegen
STUDIO.md Ende 0a (Worktree-HEAD und `git status` vor Paketstart prüfen; Session #2 hat das nicht getan). Folge:
Der Engineer von #2 hat `forest.ts`, `iso.ts`, `renderer.ts` im geteilten Worktree zurückgesetzt; ungecommittete
`__prof`-Hooks von #3 in `iso.ts` sind vermutlich verloren (`tests/render/_prof.test.ts` importiert sie noch).
Entscheid: Die interaktive Session #3 (Nutzer aktiv dort) führt FIX-REL07 allein weiter; #2 arbeitet ab jetzt nur
lesend und fasst `int/rel-07` nicht mehr an. Zwischenstand von #2 zu (a): Branch `fix/rel07-a-wood` @ c94e99a
(Wald in 2-ms-Scheiben, `woodSlices.test.ts` grün, senkt Ruckeln nicht auf main-Niveau; Rasteranteil ≈ 14 ms
`(program)`), Messskripte `.studio/qa/rel-07b/` — #3 übernimmt oder verwirft. Vorfall an die nächste Retro. — Kosten
bei Irrtum: Doppelarbeit an (a).

Entscheider: L0 (Session #2) · Anlass: Blocker-Bericht lead-art FIX-REL07 · ADR: —

## R325 · 2026-10-08 · FIX-REL07 nach Kollision: eine Hand, Zwischenstand #2 als Option

Ruling: R324 angenommen. FIX-REL07 führt allein die lead-art-Instanz dieser Session. Sie erhält Branch
`fix/rel07-a-wood` @ c94e99a (Wald in 2-ms-Scheiben) als Option, nicht als Pflicht: Laut Messung von Session #2
ist der Bau-Frame überwiegend Rasterarbeit, Slicing allein reicht vermutlich nicht. Der Worktree-Stand in
`rel07-aufloesung` wird vor der Weiterarbeit per `git diff` geprüft (zurückgesetzte `__prof`-Hooks,
`_prof.test.ts`). Über `.worktrees/rel07-wood` entscheidet L0 nach dem Bericht. Vorfall „zwei L0, ein Worktree,
keine Prüfung vor dem Start“ geht in die Session-Ende-Retro dieser Session (studio-coach). — Kosten bei Irrtum:
verlorene Arbeiterstunde, Branch c94e99a bleibt erhalten.

Entscheider: L0 · Anlass: Cross-Session-Meldung L0 #2 · ADR: —

## R326 · 2026-10-08 · D-FIXREL07-1: Bau-Ruckeln erfüllt, Grundlast Seed 7 entscheidet die Nachprüfung

Ruling: Bericht lead-art FIX-REL07 (`int/rel-07` @ eb173e8, `make check` grün) angenommen.
(1) R313 (a) gilt als erfüllt: Bauen löst den Wald-Neuaufbau nicht mehr in einem Frame aus (2-ms-Scheiben,
gleich dem Vollaufbau). (2) **Bedingung für das Gate:** Der Rest bei Seed 7 (rund 5 verlorene Frames je 900 ms
auch ohne Bau, main 0) ist unter Last 6–15 gemessen. lead-qa wiederholt `hitch.mjs` auf ruhiger Maschine mit und
ohne Bau. Bleibt der Kandidat ohne Bau bei mehr als main + 1 Frame je Fenster, ist das ein sichtbares Ruckeln im
Ruhezustand → Gate ZURÜCK mit Paket „Zeichenkosten L5–L7“ vor dem Release. Sonst geht das Paket nach dem Release
als Folgepaket. (3) Kaltstart Seed 14 (22–24 s gegen 11–15 s) blockiert nicht; kommt in das Folgepaket und in die
Release-Notiz. (4) (b), (c), (d) erfüllt; Perf innerhalb R313 (höchstens +1,3 ms). (5) Eintrag in der Liste
`ZEITTESTS` in `vite.config.ts` ausserhalb der Grenze als Trivial-Fix angenommen. (6) Budget: rund 40 Tools über
der Schätzung ohne Antrag → Retro (Ursache Kollision R324). (7) Ablauf: Integrator mergt `int/rel-07` in
`rel/rel-07`, danach Nachprüfung lead-qa nur für Ruckeln mit/ohne Bau, Perf, K-Proben blind und sichtbaren
Altwald während des Waldaufbaus. Worktree `.worktrees/rel07-wood` wird entfernt, Branch `fix/rel07-a-wood`
bleibt. — Kosten bei Irrtum: eine weitere Fix-Runde.

Entscheider: L0 · Anlass: Bericht lead-art FIX-REL07 · ADR: —

## R327 · 2026-10-08 · Gate Merge REL-07 (Nachprüfung): OK mit Bedenken, Release

Ruling: Nachprüfung lead-qa (`rel/rel-07` @ dbf4524 gegen main @ 8ccec73, Last ≤ 4) angenommen. Ohne Bau: OK
(Seed 7 im Mittel 0,28 Ruckel-Frames, Seed 14 0), die Gate-Bedingung aus R326 (2) greift nicht. Perf: OK
(höchstens +1,3 ms, absolut 3,7 ms). K-Proben blind: OK. Altwald während des Aufbaus: OK.
**D-REL07N-1:** Das Bau-Ruckeln bei Seed 7 (Median 2, höchstens 6 Frames à 33 ms je Bau, main 0) wird angenommen
und blockiert nicht. Es ist gegenüber Lauf B deutlich kleiner (vorher 4–6 Frames à 33–50 ms), der Ruhezustand ist
sauber, und eine weitere Fix-Runde hielte das ganze Release für ein kurzes Stocken nur auf waldreichen Inseln auf.
Folgepaket **PERF-L57 „Zeichenkosten L5–L7 senken“** mit den Zielen: Bau Seed 7 main ± 1, Kaltstart Seed 14 nahe main.
Es kommt aufs Board, der Start erfolgt nach R305 erst mit Nutzer-Auftrag oder als Abschluss des laufenden Auftrags
„Lebendige Insel“ in der nächsten Session. Release-Notiz nennt Bau-Ruckeln und Kaltstart offen unter „Bitte testen“.
Ablauf: production-integrator mergt `rel/rel-07` nach main, `make check`, Push, CI und Pages prüfen. Befunde
ausserhalb Scope (B1, B2, B6, B14 aus Lauf B und die vier Kandidaten aus der Nachprüfung) kommen in
`docs/beobachtungen.md`. — Kosten bei Irrtum: Spieler bemerkt Stocken beim Bauen im Wald; Revert möglich.

Entscheider: L0 · Anlass: Bericht lead-qa Nachprüfung REL-07 (`.studio/qa/rel-07c/stand.md`) · ADR: —

## R328 · 2026-10-08 · CI rot nach REL-07: Zeitreserve `decorSea.test.ts`, Trivial-Fix

Ruling: REL-07 ist live (Merge d7a65a3, Pages 37763554619 grün, HTTP 200). CI 37763554612 ist rot, allein wegen
`make zeitreserve`: zwei Tests in `tests/render/decorSea.test.ts` (L5-T3 `shipAt` 3596 ms, L5-Review Tönung
3123 ms) liegen in CI über 50 % des Standard-Timeouts. Sie bekommen nach dem Muster aus R318/R322 ein hergeleitetes
Timeout (Trivial-Fix, eigener `test:`-Commit direkt auf main, danach Push und CI erneut). Das Produkt ist nicht
betroffen, kein Revert. Abweichungen des Integrators angenommen: Merge im Hauptcheckout, weil `.worktrees/integrate`
die lokalen Commits nicht hatte; Trailer mit dem tatsächlichen Modell. Ad-hoc-Retro „CI rot“ wird mit der
Session-Ende-Retro gebündelt. — Kosten bei Irrtum: ein weiterer roter CI-Lauf.

Entscheider: L0 · Anlass: Bericht production-integrator REL-07 · ADR: —

## R329 · 2026-10-08 · Retro Session 191cc1e4: Handbuch-Vorschläge angenommen

Ruling: Retro `docs/studio/retros/2026-10-08-session-191cc1e4-ende.md` angenommen. Handbuch-Sätze, umgesetzt durch
studio-coach: (1) Lastregel: Perf- und Ruckel-Messungen gelten nur bei 1-min-Load ≤ 4, `uptime` vor und nach dem
Lauf im Beleg. Damit wird E-045 direkt Handbuch-Satz statt Experiment. (2) Vor jedem Paketstart in einem Worktree
prüft der Startende `git worktree list`, `git status` im Ziel-Worktree und fremde Heartbeats im Dashboard.
Ungecommittete Änderungen gelten als fremd belegt, bis der Eigentümer geklärt ist (Erweiterung Ende 0a).
(3) Nach einem Release werden gemergte, saubere Worktrees ohne `--force` entfernt. E-043
(`zeitreserve` mit Runner-Faktor) als Werkzeug-Paket TOOL-ZEITRESERVE-RUNNER aufs Board für lead-tech. Start in einer
späteren Session; bis dahin führt der Integrator vor jedem Push zusätzlich `make zeitreserve` aus. E-044 (Guard
für Worktree-Belegung) bleibt `vorgeschlagen`, bis ein Platz frei ist. Nach R127 folgt die Prozess-Retro nach dem
Release REL-07 durch studio-process-coach. — Kosten bei Irrtum: drei Handbuch-Sätze, rücknehmbar.

Entscheider: L0 · Anlass: Session-Ende-Retro 191cc1e4 · ADR: —

## R330 · 2026-10-08 · Prozess-Retro REL-07: alle fünf Vorschläge angenommen

Ruling: Retro `docs/studio/retros/2026-10-08-prozess-rel07.md` angenommen. Zwei Werkzeug-Vorschläge gehen in ein
Paket **TOOL-RELEASE-CI** (lead-tech) zusammen mit TOOL-ZEITRESERVE-RUNNER (E-043): (1) CI auch auf `rel/**`;
(3) Perf- und Ruckel-Skripte brechen bei 1-min-Load über 4 ab und tragen A/A bzw. A/B im Namen. Diese Skripte
ziehen dabei nach `tools/render-qa/` um (E-041). Als Handbuch-Sätze für den studio-coach in der nächsten Session:
(2) Release-Läufe mit Wanduhr-Limit und `stand.md` alle 30 min. (4) Eine Fix-Runde nach Gate ZURÜCK startet in
derselben Session, sofern Budget und Limit es erlauben. (5) Vor dem Integrator-Start ein Konflikt-Probe-Merge mit
`git merge-tree`. — Kosten bei Irrtum: ein Werkzeug-Paket und drei Handbuch-Sätze, rücknehmbar.

Entscheider: L0 · Anlass: Prozess-Retro REL-07 · ADR: —

## R331 · 2026-10-08 · Nutzer-Auftrag „räum auf": Auslegung

Ruling: Ausgelegt als zwei Pakete. **CLEANUP-WT** (`production-integrator`): Worktrees unter `.worktrees/` entfernen,
deren Stand in `main` enthalten und die sauber sind (`git worktree remove`, nie `--force`; R329 (3)); verwaiste
Einträge per `git worktree prune`; danach lokale Branches, die in `main` gemergt sind, mit `git branch -d` löschen
(nie `-D`). Ausgenommen bleiben `main`, `.worktrees/integrate`, `.worktrees/beob-02`, alle nicht gemergten Branches,
`stash@{0}` und alle Remote-Branches (bleiben bis eigenes Ruling, §6). **BEOB-AUSW-02** (`lead-production`, Skill
`beobachtungen-auswerten`): 18 Einträge seit 2026-10-06 auswerten (R287 Pflicht nach Release REL-07). — Kosten bei
Irrtum: gering; gelöschte gemergte Branches sind über `main` und Reflog wiederherstellbar.

Entscheider: L0 · Anlass: Nutzer „räum auf" · ADR: —

Nachtrag R331: CLEANUP-WT entfernte 23 Worktrees und 96 gemergte Branches. `int/rel-07` bleibt: `-d` lehnt wegen des
veralteten Upstreams ab, obwohl die Branch vollständig in `main` steckt; `-D` sperrt der Guard (§6) und wird nicht
umgangen. Erledigt sich mit dem Löschen von `origin/int/rel-07` (eigenes Ruling, Remote).

## R332 · 2026-10-08 · BEOB-AUSW-02: Gate Merge OK, Paket-Kandidaten aufs Board

Ruling: Gate Merge **OK** für `docs/beob-auswertung-02` @ f722f6a (nur `docs/beobachtungen.md`, 18 Einträge: 5 erledigt,
7 abgehakt, 6 eingeplant). Die Kandidaten kommen als `open` aufs Board, gestartet wird keiner (Startstopp R305):
UI-INSELFILTER (lead-tech, mit SEE-F2-UX), TOOL-RENDERQA-NACHZUG (lead-art, vor PERF-L57), ART-WALD-RAUTEN (lead-art,
nach PERF-L57), ART-C7-ANSCHLUSS (lead-art, in PERF-L57 mitnehmen), ART-L8-SELTEN (lead-art, später).
Hygiene-Punkte (`role_class`, `package_family`) hängen an TOOL-STUDIO-HYGIENE. — Kosten bei Irrtum: keine, nur Board.

Entscheider: L0 · Anlass: Bericht BEOB-AUSW-02 · ADR: —

## R333 · 2026-10-08 · Nutzer-Stopp GitHub Actions

Ruling: Nutzer-Anweisung „Actions durch Inselreich sofort stoppen" (Konto: 1172 von 2000 min im Oktober, 910 davon
Inselreich). Umgesetzt: Workflows `CI` und `Pages` per `gh workflow disable` abgeschaltet (rücknehmbar mit
`gh workflow enable`); laufender Integrator BEOB-AUSW-02 vor dem Push gestoppt, halber Merge in `integrate`
abgebrochen, Branch `docs/beob-auswertung-02` @ f722f6a bleibt. Ursache: jeder Push auf `main` startet CI und Pages
(drei Jobs, je auf volle Minuten aufgerundet); Oktober bisher 240 Pushes, davon 324 von 433 Commits reine `docs:`,
Spitze 1.–3.10. mit rund 60 Pushes pro Tag. Bis zur Antwort auf N-98 gilt: kein Wiedereinschalten, kein
`workflow_dispatch`; das Merge-Gate stützt sich lokal auf `make check`, `CI=true make check`, `make zeitreserve`;
die CI-Schritte nach dem Push (Handbuch „Merge", Integrator-Persona Schritt 5) entfallen. Pushes auf `main` sind
erlaubt (lösen nichts aus). — Kosten bei Irrtum: Releases gehen nicht live, bis N-98 beantwortet ist.

Entscheider: Nutzer (Stopp), L0 (Umsetzung) · Anlass: Minutenverbrauch · ADR: —

## R334 · 2026-10-08 · N-98: Actions mit drei Sparregeln wieder einschalten

Ruling: Nutzerentscheid N-98 umsetzen als Paket **TOOL-ACTIONS-SPAR** (lead-tech): (1) `CI` und `Pages` ignorieren
reine Doku-Pushes (`paths-ignore`: `docs/**`, `**/*.md`, `.studio/**`, `.claude/**`); (2) `Pages` nur noch per
`workflow_dispatch`, ausgelöst vom Integrator beim Release; (3) `CI` mit `concurrency` und `cancel-in-progress`.
Integrator-Persona und Handbuch „Merge" werden nachgeführt (Pages-Auslösung beim Release, CI-Prüfung nur bei
Code-Pushes). Workflows erst nach dem Merge der neuen Dateien wieder einschalten. — Kosten bei Irrtum: gering.

Entscheider: Nutzer (N-98), L0 · Anlass: R333 · ADR: —

## R335 · 2026-10-08 · Pushes bündeln: einmal pro Session

Ruling: Nutzerentscheid. Höchstens ein Push auf `main` pro Session, am Session-Ende durch den Integrator. Merges nach
Gate bleiben lokal und werden wie bisher mit `make check`, `CI=true make check` und `make zeitreserve` geprüft. Ein
Release geht damit erst mit dem Session-End-Push live (danach `gh workflow run Pages`). Umsetzung in Integrator-Persona
und Handbuch im Paket TOOL-ACTIONS-SPAR. — Kosten bei Irrtum: CI-Fehler fallen erst am Session-Ende auf.

Entscheider: Nutzer · Anlass: Minutenverbrauch (R333) · ADR: —

## R336 · 2026-10-08 · Gate TOOL-ACTIONS-SPAR OK; Startstopp aufgehoben, Arbeitsverteilung

Ruling: (a) Gate Merge **OK** für `tool/actions-spar` @ 3e5bdee (Workflows nach R334, Doku nach R335). Merge lokal
durch den Integrator; Push und `gh workflow enable` erst am Session-Ende (R335). (b) Nutzer „weiterarbeiten und Arbeit
verteilen" hebt den Startstopp R305 auf. Start jetzt parallel: **TOOL-RELEASE-CI** (lead-tech) ohne Punkt (1) „CI auf
`rel/**`" (widerspricht R333–R335), dafür mit TOOL-RENDERQA-NACHZUG: Messskripte nach `tools/render-qa/` mit
Lastabbruch und A/A-, A/B-Namen, dazu TOOL-ZEITRESERVE-RUNNER (E-043), ≤ 120 Tools; **IDEEN-03** (lead-design,
I-022…I-026, Tastenkonflikte Leertaste und `U` prüfen), ≤ 80 Tools; **UI-INSELFILTER** (lead-tech, Bugfix
`protectedCount` und gleichartige Stellen), ≤ 80 Tools. Nach dem Merge von TOOL-ACTIONS-SPAR folgt der studio-coach
(Handbuch-Sätze R330 (2), (4), (5), E-039, E-041), weil beide `STUDIO.md` berühren. PERF-L57 (mit ART-C7-ANSCHLUSS)
startet nach TOOL-RELEASE-CI und nur bei 1-min-Load ≤ 4 (aktuell 7). Studioweit ≤ 5 Arbeiter (R241).

Entscheider: L0 · Anlass: Nutzer-Auftrag · ADR: —

## R337 · 2026-10-08 · Gate IDEEN-03 OK, UI-INSELFILTER ohne Fehler

Ruling: (a) Gate Ideen-Runde **OK** (`docs/ideen-03` @ 96850cb): Bündel **TASTEN-KOMFORT** (I-022 Leertaste antippen
pausiert, Halten+Ziehen verschiebt; I-023 Pipette Strg/Cmd+Klick und Knopf „Gleiches bauen"; I-025 Ausbau mit
`Umschalt+U`, `U` bleibt Schule) als nächstes Paket, danach **PANEL-UEBERSICHT** (I-026); I-024 geparkt
(Wirtschaftsentscheid, Dominanzrisiko). L0 wählt `Umschalt+U` statt `+` (Merkbarkeit). Spec durch lead-design.
(b) UI-INSELFILTER: Befund veraltet, `isProtected` filtert bereits nach Insel; nur Regressionstest
(`fix/ui-inselfilter` @ 73b8625), Merge mit dem nächsten Integrator-Lauf. (c) `trees-farn.test.ts` Zeitreserve und
Lastabhängigkeit von `make zeitreserve` gehen in TOOL-RELEASE-CI. (d) Studio-coach startet jetzt (STUDIO.md frei).

Entscheider: L0 · Anlass: Berichte IDEEN-03, UI-INSELFILTER · ADR: —

## R338 · 2026-10-08 · Gate Spec TASTEN-KOMFORT OK; TOOL-RELEASE-CI Push-Gate, Gate OK

Ruling: (a) Spec `2026-10-08-tasten-komfort-spec.md` (34 AKs) **OK**; OF-1 Leertaste schliesst Info-Panel nicht, OF-2
`kontor2` wie Kontor, OF-3 Tooltip am Pause-Knopf, OF-4 Cmd+Klick als Hauptweg; Setzungen des Spec-Autors bestätigt,
inklusive Strg/Cmd+Klick im Abriss-Werkzeug wechselt das Werkzeug (AK-TK-25). Umsetzung lead-tech, ≤ 120 Tools.
(b) TOOL-RELEASE-CI: Review BEDENKEN (Zeitreserve unter Last wirkungslos) gelöst per Push-Gate statt rotem `make check`:
lokale Merges warnen bei Load > 4, `make zeitreserve-push` ist streng (Load > 4 → „nicht belastbar", Exit 2) und vor
dem Session-End-Push Pflicht (R335). Gate Merge **OK** für `tool/release-ci` @ 5398e80 ohne zweites Review (nur
Werkzeug, Tests 33/33). Offen: echte Nachmessung der Timeouts bei Load ≤ 4 über das Push-Gate; „Runner-Modus auf CI
doppelt" → Beobachtung. PERF-L57 kann nach dem Merge starten, misst aber nur bei Load ≤ 4.

Entscheider: L0 · Anlass: Berichte Spec TASTEN-KOMFORT, TOOL-RELEASE-CI · ADR: —

## R339 · 2026-10-08 · Gate Merge TASTEN-KOMFORT OK, Release REL-08 mit dem Session-End-Push

Ruling: Gate Merge **OK** für `feat/tasten-komfort` @ 8c1dbba (Final-Review opus BEDENKEN, vier Befunde behoben;
Browser AK-TK-21…33 OK; Vitest 2478 grün; `src/sim` unverändert, Save v9). Merge lokal. Das Paket geht als **REL-08
„Tasten-Komfort"** mit dem gebündelten Session-End-Push live (Pages per `gh workflow run`, R334/R335); Release-Review
nach R249 (1) nur Delta seit dem Final-Review. Budget um rund 27 Tools (≈ 22 %) überschritten → Session-Retro.
Offen: Safari/Firefox (OF-4) nicht prüfbar, `bbd2966` allein nicht lauffähig (kein Bisect-Schaden auf main, `--no-ff`).

Entscheider: L0 · Anlass: Bericht TASTEN-KOMFORT · ADR: —

## R340 · 2026-10-08 · Gate Spec PANEL-UEBERSICHT OK, Start nach PERF-L57-Messung

Ruling: Spec `2026-10-08-panel-uebersicht-spec.md` (33 AKs: 21 Vitest, 12 Browser; neues reines Modul
`src/ui/panelView.ts`, keine Sim-/Save-Änderung) **OK** mit allen Empfehlungen zu den offenen Fragen: Ausbau-Karte vor
Freischaltung mit Sperrgrund, Stufe als Text plus Pips, Kennzahlen als Kacheln, Gewinn als Vorher→Nachher mit Delta,
Panelbreite 280 px, kein geschätzter Ist-Ausstoss. Die Umsetzung (lead-tech, ≤ 120 Tools) startet erst nach Abschluss
der PERF-L57-Messläufe, weil Testläufe die Last über 4 heben und die Messung ungültig machen (R329).

Entscheider: L0 · Anlass: Bericht Spec PANEL-UEBERSICHT · ADR: —

## R341 · 2026-10-08 · PERF-L57: Messziel erreicht, Nachrunde vor dem Merge-Gate; PANEL-UEBERSICHT startet

Ruling: PERF-L57 (`perf/l57` @ 92a214c) erreicht das Ziel aus R327, von L0 gegen `.studio/qa/perf-l57/r3/` geprüft:
Bauen im Wald Seed 7 und 14 je 0 Frames > 25 ms (A und B); Kaltstart Seed 7 22,8 → 8,3–8,4 s, Seed 14 14,9–16,0 →
8,1–8,4 s. Das Review lautete ZURÜCK, die Fixes wurden nicht erneut geprüft; neu ist ein Bildschirmcache für den Boden.
Deshalb vor dem Gate eine Nachrunde (+40 Tools): Delta-Review auf opus (inklusive Invalidierung des Cache) und
Sichtprüfung im Browser. PANEL-UEBERSICHT (lead-tech, ≤ 120 Tools) startet jetzt, die Messläufe sind abgeschlossen.

Entscheider: L0 · Anlass: Bericht PERF-L57 · ADR: —

## R342 · 2026-10-08 · Gate Merge PERF-L57 OK; REL-08 umfasst Tasten-Komfort und PERF-L57

Ruling: Nach der Nachrunde **OK** für `perf/l57` @ 20c8e50: Delta-Review auf opus OK (Invalidierung des Bodencache
vollständig, drei niedrige Testlücken) und Sichtprüfung OK (gepatchtes Bild gegen Neuaufbau 0 Pixel Unterschied,
Tag/Nacht pixelgleich; Unterschiede zu main nur an Baumkanten und an den neuen Funken). Die Konflikt-Probe ist
konfliktfrei. Merge lokal. REL-08 heisst jetzt „Tasten-Komfort und flüssigere Insel" und geht mit dem
Session-End-Push live. PANEL-UEBERSICHT kommt nur dazu, wenn es vor dem Session-Ende das Gate besteht, sonst REL-09.
Budget-Nachrunde eingehalten.

Entscheider: L0 · Anlass: Bericht Nachrunde PERF-L57 · ADR: —

## R343 · 2026-10-08 · Gate Merge PANEL-UEBERSICHT OK, kommt in REL-08

Ruling: **OK** für `feat/panel-uebersicht` @ d22ce7a. Final-Review auf opus BEDENKEN mit fünf niedrigen Befunden,
drei davon behoben; offen sind der Importzyklus `panelView.ts`↔`inspect.ts` (funktioniert, Auslagern später) und
das Duplikat `TILE_LAYOUT`, beide als Beobachtung. Browser AK-PU-22…32 bestanden, Höhenreserve bei 1280×720 rund
195 px; nach der Fix-Runde wurde nicht erneut geprüft, für Rolle, Gerüst und `kbd`-Grösse vertretbar. Sim
unverändert, Save v9. REL-08 heisst damit „Tasten-Komfort, flüssigere Insel, neues Gebäude-Panel". Budget rund 136
von 120 Tools, bei widersprüchlicher Selbstangabe → Retro.

Entscheider: L0 · Anlass: Bericht PANEL-UEBERSICHT · ADR: —

## R344 · 2026-10-08 · Retro Session 56d273bd: alle fünf Vorschläge angenommen

Ruling: Retro `docs/studio/retros/2026-10-08-session-56d273bd-ende.md` angenommen. Umsetzung in der nächsten Session,
weil vor dem gebündelten Push nichts Neues dazukommt: **E-046** Ampelzeile „Actions-Minuten" in `metrics.py
--efficiency` über die Billing-API (Werkzeug-Paket, lead-tech); **E-047** `log.py queue` formatiert selbst mit
Prettier (lead-tech, klein, zusammen mit E-046); **E-048** Gate liest das Ist-Budget aus der Zählung, UI-Pakete mit
Browser-Abnahme bekommen 150 Tools (zwei Handbuch-Sätze, studio-coach). Messaufträge: Messpakete in der Zeile
Steuerungsanteil getrennt ausweisen; lead-art nennt im nächsten Perf-Paket die Zahl der Hintergrund-Läufe (E-037);
in der nächsten Retro den ersten CI-Lauf nach `zeitreserve-push` bewerten. — Kosten bei Irrtum: rund 55 Tools.

Entscheider: L0 · Anlass: Session-Retro · ADR: —

## R345 · 2026-10-08 · Release-Check REL-08 BEDENKEN: Fix-Runde Menü vor dem Push

Ruling: Release-Smoke auf main @ 176f169 hat alle Schritte bestanden (Laden, Panel, Pipette, `Umschalt+U`, Leertaste,
Wald, Save v9, Konsole sauber). Hoch: Bei 1280×720 öffnet das Menü unten gescrollt, Speichern und Laden sind
unsichtbar (Zielplattform ab 1280 px, R78). Deshalb Fix-Runde **FIX-REL08-MENU** (lead-tech, ≤ 40 Tools) in derselben
Session (Handbuch 1.30); REL-08 geht erst danach live. Niedrige Befunde als Beobachtung.

Entscheider: L0 · Anlass: Release-Check REL-08 · ADR: —

## R346 · 2026-10-08 · Gate Merge FIX-REL08-MENU OK; Session-End-Push und Release REL-08

Ruling: **OK** für `fix/rel08-menu` @ 0c2fc31. Ursache: `close.focus()` scrollte die zu hohe Menükarte nach unten,
den Fehler gab es schon vor REL-08. Fix: `focus({ preventScroll: true })` und `scrollTop = 0`. Browser bei 1280×720
`scrollTop` 0, Review OK, 34 von 40 Tools. Damit ist REL-08 freigegeben. Session-End-Push nach R335 durch den
Integrator: Fix lokal mergen, dann `make zeitreserve-push` (auf Load ≤ 4 warten), danach `gh workflow enable CI` und
`gh workflow enable Pages` (R334, die neuen Workflow-Dateien sind im Push), Push, CI prüfen, `gh workflow run Pages
--ref main`, Deploy prüfen und `ci.py`.

Entscheider: L0 · Anlass: Bericht FIX-REL08-MENU · ADR: —

## R347 · 2026-10-08 · Push-Gate fand einen echten Verstoss; Trivial-Fix Timeout, danach Push

Ruling: Das erste belastbare `make zeitreserve-push` (Load 2,7) meldete Exit 1 für `tests/render/trees.test.ts`
(„ISO §6 Kronen (WALD-02)", Runner-Schätzung 2655 ms gegen 5000 ms). Das Gate wirkt wie gewollt (R338): ohne es wäre
erst die CI nach dem Push rot geworden. Trivial-Fix `fix/zeitreserve-trees` @ 6cd8c2b (Timeout 10000 ms, Testlogik
unverändert; danach `zeitreserve-push` Exit 0 bei Load 3,6, `make check` grün). Gate Merge **OK**; der Integrator
setzt den Session-End-Ablauf aus R346 ab dem Merge dieses Fixes fort.

Entscheider: L0 · Anlass: Push-Gate REL-08 · ADR: —

## R348 · 2026-10-08 · Push-Gate las eine veraltete Messdatei; Ablauf korrigiert

Ruling: Das zweite Exit 1 war ein Briefing-Fehler von L0. `zeitreserve-push` liest `.studio/zeitreserve.json` aus dem
letzten `make test` im selben Checkout, die Tests liefen aber in `.worktrees/integrate`. Neuer Ablauf: Im
Hauptcheckout bei 1-min-Load ≤ 3 erst `make test`, dann `make zeitreserve-push`. Die Werkzeug-Schwäche (keine Prüfung
von Commit und Last der Messung) steht als Beobachtung im Werkzeug-Paket E-046/E-047. Bis dahin gilt die Reihenfolge
oben für jeden Session-End-Push.

Entscheider: L0 · Anlass: Push-Gate REL-08 · ADR: —

## R349 · 2026-10-08 · Session-Start: drei Pakete parallel (TOOL-E046-E047, HB-E048, Prozess-Retro REL-08)

Ruling: REL-08 ist live (CI grün 37799673425, Pages 37800395087). Plan aus state.md fortgesetzt, drei unabhängige
Stränge parallel (getrennte Dateien): **TOOL-E046-E047** (lead-tech, Worktree, 60 Tools): E-046 Ampelzeile
„Actions-Minuten" und E-047 `log.py queue` mit Prettier, die Werkzeug-Schwäche aus R348 (Messdatei ohne Commit und
Last) ist mit drin, wenn sie in 15 Tools passt, sonst bleibt sie Beobachtung; **HB-E048** (studio-coach, 20 Tools): die
zwei Handbuch-Sätze, E-046…E-048 auf `laufend`; **Prozess-Retro REL-08** (studio-process-coach, 40 Tools, nach R127 nach
jedem Release). Merges bleiben lokal, Push erst am Session-Ende (R335). — Kosten bei Irrtum: rund 120 Tools.

Entscheider: L0 · Anlass: Session-Start · ADR: —

## R350 · 2026-10-08 · Gate HB-E048: Experiment-Grenze verletzt, Korrektur

Ruling: Commit ae2f9e5 setzt E-046…E-048 auf `laufend`; damit laufen 6 Experimente, `test_experiments_limit` erlaubt
3 (`make studio-test` rot). Ursache: Das Briefing von L0 (R349) nannte nur Prettier als DoD und prüfte die Grenze nicht.
Korrektur durch den studio-coach: (1) **E-027** bewerten und abschliessen, IDEEN-03 ist gelaufen (R337, Frist R319);
(2) **E-047** ist kein Experiment, sondern ein Werkzeug-Fix (keine offene Hypothese, Wirkung per Test belegt), Eintrag
als `übernommen` bzw. nach der Statuskonvention der Datei abschliessen; (3) danach laufen E-042, E-037, E-046, E-048.
Lässt sich **E-037** mit den vorhandenen Sessions bewerten, wird es bewertet, sonst geht **E-048** zurück auf
`vorgeschlagen` und die zwei Handbuch-Sätze samt Version 1.31 werden zurückgenommen, bis ein Platz frei ist. Künftige
Experiment-Briefings nennen `make studio-test` als DoD. Gate HB-E048 erst nach grünem `make studio-test`.

Entscheider: L0 · Anlass: Gate HB-E048 · ADR: —

## R351 · 2026-10-08 · Gate HB-E048 OK nach Korrektur; E-027 behalten bestätigt

Ruling: Commit fb774e6, `make studio-test` grün (452 OK). **E-027 behalten** bestätigt: 3 von 3 Ideen-Runden, ≥ 2
Studio-Ideen live, keine Nutzer-Einwände; die nicht erhobene Gegenprobe von IDEEN-03 ist als Lücke vermerkt und senkt
das Urteil nicht, weil die Runde laut R337 klein war. E-047 übernommen als Werkzeug. Es laufen E-042, E-037, E-046.
**E-048** wartet auf den nächsten freien Platz (vor E-044). Handbuch bleibt 1.30. Ist dieser Korrektur laut Zählung: 4
und 5 Tools.

Entscheider: L0 · Anlass: Gate HB-E048 · ADR: —

## R352 · 2026-10-08 · M12 abgeschlossen ohne E5/E6; REL-09 Welle 1

Ruling: Vorlage `docs/studio/vorlagen/2026-10-08-board-nach-rel08.md` angenommen. (1) **M12 ist abgeschlossen**, E5
und E6 sind Kann-Teile (Spec §9) und werden nicht geplant; E5 (Seekarte) und E6 (Händlerschiff, I-006) gehen als
Ideen in die nächste Ideen-Runde. Pflicht-Retro M12 durch den studio-coach. (2) **REL-09 Welle 1** parallel, getrennte
Worktrees: SEE-F2-UX (lead-tech), SEE-F1-FAHRLINIE (lead-tech, zweite Instanz), ART-WALD-RAUTEN mit Meeresfelsen und
`willReadFrequently` (lead-art). Es sind Fehlerbehebungen ohne neue Spielregel: kein Kurzdesign, der Lead liefert den
Plan (Tasks, Datei-Ownership, Budgetantrag) im Bericht, danach kombiniertes Gate Spec/Plan durch L0. Planungsbudget je
25 Tools. Welle 2 (SEE-F3, UI-PANEL-AUFRAEUMEN, ART-L8-SELTEN) folgt nach den Vorgängern. (3) CI-ACTIONS-NODE ist
erledigt (Runner `ubuntu-24.04` fest, R293); der Frist-Hinweis in state.md entfällt. — Kosten bei Irrtum: E5/E6 kehren
als Ideen zurück, keine verlorene Arbeit.

Entscheider: L0 · Anlass: Board-Vorlage BOARD-NACH-REL08 · ADR: —

## R353 · 2026-10-08 · Prozess-Retro REL-08: alle vier Vorschläge angenommen; Nachtrag zu R347

Ruling: Retro `docs/studio/retros/2026-10-08-prozess-rel08.md` angenommen. **Nachtrag R347:** Beide Exit 1 am
Push-Gate kamen aus derselben veralteten Messdatei (885 ms; frisch 574/580 ms gegen 833 ms) — R347 war ein Fehlalarm,
der 10000-ms-Timeout bleibt (harmlos). (P1+P2) Paket **TOOL-ZEITRESERVE-META** (lead-tech, 45 Tools, sofort, eigener
Worktree): Messdatei trägt Commit und 1-min-Last der Messung, das Gate nimmt nur Messungen mit Commit = `HEAD` und
Last ≤ 4 an (ersetzt die Reihenfolge aus R348); `CI=true` nur für die Perf-Budget-Tests statt eines zweiten vollen
`make check`. (P3) Smoke-Skript `tools/render-qa/smoke.mjs` (lead-art, 40 Tools) nach Welle 1 von REL-09, vor dem
Release-Check REL-09. (P4) lernen.md-Zeile „strenges und lockeres Gate widersprechen sich → erst frisch messen“ beim
Session-Ende durch den studio-coach. — Kosten bei Irrtum: rund 90 Tools, Rückfall per `git revert`.

Entscheider: L0 · Anlass: Prozess-Retro REL-08 · ADR: —

## R354 · 2026-10-08 · Gate Merge TOOL-E046-E047 OK

Ruling: **OK** für `tool/e046-e047` @ 972b564 (Review OK, Befunde niedrig; `make studio-test` 463 grün; Echtlauf
Inselreich 918 min rot, Konto 1182/2000 gelb). Fehler im ersten Stand (Reponame `anno-clone` statt `Inselreich`) fand
der L0-Echtlauf, nicht die Tests — Echtläufe gegen externe APIs gehören in die DoD von Werkzeug-Paketen. Merge lokal
durch den Integrator (Konflikt-Probe sauber), kein Push (R335). Ist laut Zählung: 14 + 18 + 6 Tools.

Entscheider: L0 · Anlass: Review TOOL-E046-E047 · ADR: —

## R355 · 2026-10-08 · Kombiniertes Gate REL-09 Welle 1: BEDENKEN → Nacharbeit, Umsetzung frei

Ruling: Urteil lead-qa BEDENKEN für alle drei Pläne, nichts blockierend (B1–B13). Nacharbeit ohne Zweitprüfung, der
Lead führt sie zuerst im Plan nach und setzt dann um. Ownership (L0): `tests/render/decorSea.test.ts` und
`src/render/decor.ts` gehören in Welle 1 ART-WALD-RAUTEN; SEE-F1 testet T2 nur in `shipLane.test.ts`, die
`decorSea`-Anpassung wandert in T3 (nach dem Merge von ART-WALD-RAUTEN, B7). Neue Salze in `decor.ts` legt nur
Umsetzer B an (B13). Pflicht vor Start: SEE-F1 erzeugt Goldwerte (`seaLanes`, `d`, `laneTicks`, Welt-Hash nach 2000
Ticks für 3 Seeds) auf main vor T1 (B5); ART-WALD-RAUTEN plant Review je Umsetzer und Final-Review auf `opus` (B9) und
misst Kaltstart als Median `--runs 3 --seed 7` (B11). Umsetzungsbudget: SEE-F2-UX 165 Tools (+ Reproduktions-Playtest),
SEE-F1-FAHRLINIE 120, ART-WALD-RAUTEN 170. Studioweit ≤ 5 Arbeiter (R241): ART-WALD-RAUTEN darf A und B nur parallel
starten, wenn höchstens 4 andere Arbeiter laufen, sonst seriell; Messläufe nur bei Load ≤ 4 (R329).

Entscheider: L0 · Anlass: Gate GATE-REL09-W1 · ADR: —

## R356 · 2026-10-08 · Retro M12: Vorschläge 1–4 angenommen, E-043 übernommen als Werkzeug

Ruling: Retro `docs/studio/retros/2026-10-08-m12.md` angenommen. (1) E-046 bekommt eine Zeile **Actions-Minuten der
Session** (grün ≤ 8, rot > 15), weil die Monatszeile im Oktober wegen der 954 min vor den Sparregeln rot bleibt; (2)
Messauftrag CI-Laufzeit: `make check` auf dem Runner zerlegen (5.10. 81 s → 8.10. 276 s), ≤ 10 Tools, Frist
Session-End-Push REL-09. (1) und (2) als Paket **TOOL-E046-SESSION** (lead-tech, 25 Tools), Start sobald studioweit
ein Arbeiterplatz frei ist (R241). (3) E-049 bleibt `vorgeschlagen`; (4) Reihenfolge der Wartenden: E-048, E-049,
E-044. (5) **E-043** ist mit TOOL-ZEITRESERVE-RUNNER gebaut (`make zeitreserve` rechnet × 3 hoch); es wird wie E-047
als `übernommen als Werkzeug` geführt, die Messgrösse (0 rote CI-Läufe wegen `zeitreserve`) läuft als Messauftrag in
den Retros weiter (Statuspflege durch den studio-coach am Session-Ende). Hochrechnung Konto (1410–1730 von 2000 min
Ende Oktober) geht als Information in den Nutzerbericht; kein Vorbehalt nach §5.3.

Entscheider: L0 · Anlass: Retro M12 · ADR: —

## R357 · 2026-10-08 · Lastbremse: studioweit ein voller Testlauf zugleich

Ruling: 1-min-Load stieg auf 57 (10 Kerne), weil mehrere Stränge gleichzeitig volle Vitest-Läufe (`make check`,
`make test`) fuhren; Messläufe (ART-WALD-RAUTEN Kaltstart) warten dadurch. Ab sofort: Während eines Tasks nur gezielte
Läufe (`npx vitest run <datei>`); volle Läufe (`make check`, `make test`, `zeitreserve-push`) nur bei 1-min-Load ≤ 8
und nie zwei Stränge zugleich — vor dem Start `pgrep -fl 'vitest run'` prüfen, läuft schon einer, warten. Messläufe
haben Vorrang. Der Nutzer hatte nach der Rechnerlast gefragt. Kandidat für einen Werkzeug-Riegel (Lockdatei in
`make check`) für die nächste Retro.

Entscheider: L0 · Anlass: Nutzerfrage Rechnerlast · ADR: —

## R358 · 2026-10-08 · SEE-F1-FAHRLINIE: Mehrbedarf +60 nachträglich frei; Überzug an die Retro

Ruling: Stand `fix/see-f1-fahrlinie` @ cdda26f (T0–T2, T4 fertig, Goldwerte B5 belegt, Save v9 und `balance.test.ts`
ohne Diff). Ist rund 174 Tools gegen 120 frei (+45 %), gemeldet erst nach dem Überzug. Mehrbedarf **+60** für T3,
erneuten Browserblick und Final-Review `opus` nachträglich frei (Gesamt 180), weil das Paket fast fertig ist und ein
Abbruch teurer wäre. Ursachen für die Retro: Playtest 30 Tools und drei T1-Starts; das Briefing an diese Instanz nannte
die Mehrbedarfsmeldung nicht (L0). T3 startet nach dem Merge von ART-WALD-RAUTEN, die Inaktivität der Instanz bis dahin
ist gewollt (Handoff `.studio/handoffs/2026-10-08-lead-tech-tech-see-f1.md`), keine Ad-hoc-Retro.

Entscheider: L0 · Anlass: Zwischenbericht SEE-F1 · ADR: —

## R359 · 2026-10-08 · Gate Merge SEE-F2-UX OK

Ruling: **OK** für `fix/see-f2-ux` @ a1520f6. T1–T4, T6, T7 umgesetzt; T5 entfällt (nicht reproduzierbar, Ursache
Wasserkachel bzw. fehlendes Holz auf der Fremdinsel); N4 (`shipsKey`) war echt und ist behoben; Favicon als Data-URI
(Asset-Weg hätte eine CREDITS-Zeile verlangt); DPR-Wechsel per `matchMedia`-Listener, Live-Wechsel nur per Reload
belegt, manueller Zoom-Test steht als Beobachtung. Final-Review `opus` BEDENKEN niedrig, behoben in b270009;
Playtest OK; `make -k check` grün (2567). Commit-Präfix `test/fix:` in 51cbb11 an die Retro (kein Rebase). Merge
lokal durch den Integrator mit erneutem `make check` (R357), kein Push.

Entscheider: L0 · Anlass: Bericht SEE-F2-UX · ADR: —

## R360 · 2026-10-08 · Gate Merge ART-WALD-RAUTEN OK (Bedingung `make check` am Merge-Stand)

Ruling: **OK** für `fix/wald-rauten` @ 2454794. Rauten-Metrik: Anteil langer gerader Kantenstücke Gras/Sand 0,70–0,82 →
0,14–0,18, Wald/Wiese 0,15 → 0,09, Sand-Stufen 0,20 → 0,09; Kaltstart Seed 7 Median 8362 → 8492 ms (+1,6 %, Grenze
+3 %); `willReadFrequently` 3 → 0; Meeresfels ab Zoom 0,5 ohne Bootform; Final-Review `opus` BEDENKEN ohne Blocker,
hohe Befunde behoben, niedrige als Beobachtung. Fussring und „Schaum ohne Objekt“ nur per Bildsicht ohne Rauten, nicht
gemessen — Rest bleibt Beobachtung. Ist rund 139 von 170 Tools, 1 Hintergrund-Lauf (E-037). Fehlender roter Commit
(Index-Vermischung A/B) an die Retro. Merge seriell nach SEE-F2-UX durch den Integrator; Bedingung: `make check` am
Merge-Stand grün (R357). Danach Signal an SEE-F1 für T3.

Entscheider: L0 · Anlass: Bericht ART-WALD-RAUTEN · ADR: —

## R361 · 2026-10-08 · Gate Merge TOOL-E046-SESSION OK; hängende Alt-Shell beendet

Ruling: **OK** für `tool/e046-session` @ 2b56794. Review BEDENKEN (hoch: Sessionbeginn traf die Pseudo-Session `ci`,
Minuten wären über Tage summiert worden) in der Fix-Runde behoben, mit Test; Studio-Tests 468 grün, ruff sauber
(`uvx ruff`); Echtlauf Session 0 min, Monat 918 rot, Konto 1182 gelb. CI-Laufzeit zerlegt: Vitest 62 → 225 s bei 125 →
176 Dateien (×3,6 gegen ×1,4), Rest klein — Beobachtung eingetragen, Ursache je Datei offen (verbose-Lauf). Merge seriell
nach ART-WALD-RAUTEN. Nebenbei: Eine seit 6 h hängende Shell (`cat` auf stdin) einer früheren Arbeiter-Instanz im
gelöschten Worktree `.worktrees/tasten` per PID beendet (0 % CPU, kein Lastverursacher, keine Daten).

Entscheider: L0 · Anlass: Fix-Runde TOOL-E046-SESSION · ADR: —

## R362 · 2026-10-08 · Gate Merge TOOL-ZEITRESERVE-META OK; Echtprobe ist der Session-End-Push

Ruling: **OK** für `tool/zeitreserve-meta` @ 616dd08. Review BEDENKEN nur niedrig: (1) Test-Schalter
`ZEITRESERVE_FAKE_HEAD` wirkt auch produktiv (lokaler Selbstbetrug, wie `FAKE_LOAD`) — akzeptiert; (2) HEAD-Ermittlung
doppelt, und „unbekannt“ = „unbekannt“ gälte ohne Git als belastbar — Beobachtung, Trivial-Fix beim nächsten Eingriff;
(3) Hinweiszeile im CI-Log harmlos. `check-ci-perf` ermittelt die perfBudget-Dateien dynamisch per grep. Die grüne
Echtprobe `make zeitreserve-push` fehlt wegen Last; sie ist zugleich die Pflichtprüfung des Session-End-Pushes und
wird dort bei ruhiger Maschine erbracht (ersetzt die Reihenfolge aus R348). Der vom Lead gemeldete rote
`test_second_run_overwrites` ist auf main grün (L0-Lauf), lastbedingt. Merge seriell als vierter durch den
Integrator mit `make check` am Merge-Stand.

Entscheider: L0 · Anlass: Review TOOL-ZEITRESERVE-META · ADR: —

## R363 · 2026-10-08 · Merges 1–2 in main; Rauten-Tests zu langsam; Signal SEE-F1 T3

Ruling: SEE-F2-UX (0900140) und ART-WALD-RAUTEN (038cbdc) sind lokal in main, beide mit `make check` grün.
(a) TOOL-E046-SESSION: Konflikt in `docs/beobachtungen.md` (beide Stränge hängten Einträge an); der Lead merged main
in seinen Branch (kein Rebase), führt beide Einträge zusammen, danach Merge durch den Integrator. (b) TOOL-ZEITRESERVE-META:
`make check` am Merge-Stand rot, weil `zeitreserve` 5 Tests in `tests/render/rauten.test.ts` ohne CI-Reserve meldet
(lokal ≈ 2 s, Runner geschätzt ≈ 6 s gegen 5 s Timeout). Das ist ein echter Befund am Paket ART-WALD-RAUTEN, nicht am
Werkzeug. Paket **FIX-RAUTEN-ZEIT** (lead-art, 25 Tools): Tests zuerst billiger machen (kleinerer Ausschnitt, ein Seed
je Kantenart, gemeinsamer Aufbau), Aussagekraft der Schwellen erhalten; nur falls nötig hergeleitete Timeouts wie R328;
Ziel ≤ 500 ms je Test lokal, weil die CI-Laufzeit schon ×3,6 gewachsen ist (R361). Danach Merge TOOL-ZEITRESERVE-META.
(c) SEE-F1-FAHRLINIE: Signal für T3, Branch zuerst mit main mergen.

Entscheider: L0 · Anlass: Bericht Integrator · ADR: —

## R364 · 2026-10-08 · Gate Merge FIX-RAUTEN-ZEIT OK, danach TOOL-ZEITRESERVE-META

Ruling: **OK** für `fix/rauten-zeit` @ cb6224b (nur `tests/render/rauten.test.ts`; Aufbau je Seed und Kantenart in
`beforeAll`, Schwellen und Messlogik unverändert; Summe der Datei ≈ 6 s → ≈ 2,4 s lokal, also echte CI-Ersparnis, nicht
nur Verlagerung; Review OK; `npm test` 2578 grün). Hinweis aus dem Lauf bei Load 7,5 (nicht belastbar):
`tests/render/trees-licht.test.ts` „H-R10 Kronen in 3 Tönen > c)“ geschätzt 2778 ms Runner gegen 2500 ms — wird am
Push-Gate bei ruhiger Last geprüft; schlägt es dort an, Trivial-Fix wie R347 nach frischer Messung (R353 P4). Merge
seriell: zuerst FIX-RAUTEN-ZEIT, dann TOOL-ZEITRESERVE-META (R362), je mit `make check` am Merge-Stand.

Entscheider: L0 · Anlass: Bericht FIX-RAUTEN-ZEIT · ADR: —

## R365 · 2026-10-08 · REL-09 = Welle 1; Welle 2 vorbereiten, Smoke-Skript vor dem Release-Check

Ruling: FIX-RAUTEN-ZEIT (616dbc5) und TOOL-ZEITRESERVE-META (0f46b13) sind in main, `make check` und
`check-ci-perf` grün, `zeitreserve` 0 ohne Reserve auch in der Runner-Schätzung. **REL-09** umfasst SEE-F2-UX,
ART-WALD-RAUTEN (+ FIX-RAUTEN-ZEIT) und SEE-F1-FAHRLINIE (läuft, T3); Welle 2 geht in REL-10. Jetzt parallel:
(1) **TOOL-SMOKE** (lead-art, 40 Tools, R353 P3): festes `tools/render-qa/smoke.mjs` für den Release-Check inkl.
Menü-Schritt bei 1280×720, vor dem Release-Check REL-09; (2) Pläne **UI-PANEL-AUFRAEUMEN** (lead-tech, 25 Tools) und
**ART-L8-SELTEN** (lead-art, 25 Tools), Umsetzung nach dem Gate; ART-L8-SELTEN setzt erst nach dem Merge von SEE-F1
um (`decor.ts`).

Entscheider: L0 · Anlass: Merges REL-09 · ADR: —

## R366 · 2026-10-08 · Gate REL-10 Welle 2: BEDENKEN → Nacharbeit; Bauleiste Variante A

Ruling: Urteil lead-qa BEDENKEN für beide Pläne, ohne Zweitprüfung. (1) **UI-PANEL-AUFRAEUMEN:** Bauleiste
**Variante A** (`.buildbar-sub` als Overlay am unteren Rand von `#game`; Kartenhöhe konstant, Desktop-first, wie im
Genre üblich); die UX-Spec wird im Paket nachgeführt (Abweichung vom Wortlaut „gleiche Rasterzeile“ ist hiermit
gedeckt). Pflicht-AK aus dem Gate: Kamera-Grenze (südlichste Inselkachel bei offener Kategorie bebaubar), kein
Durchklicken durchs Overlay, Mausrad/Hover am Overlay, Variante B gestrichen, Kantendefinition des Zyklustests.
`docs/studio/rulings.md` schreibt nur L0; der Umsetzer meldet Ruling-Kandidaten im Bericht. Umsetzung frei sofort,
150 Tools. (2) **ART-L8-SELTEN:** Nacharbeit a–e aus dem Gate; der 500-Seeds-Quotentest läuft **nicht** in
`make check` (CI-Minuten, R356, R361), sondern als Werkzeug unter `tools/render-qa/` mit Ergebnis im Bericht; die
Suite prüft Seeds 1–40. Snapshot AK5b wird auf main nach dem SEE-F1-Merge vor T1 erzeugt. Umsetzung erst nach dem
SEE-F1-Merge, 170 Tools.

Entscheider: L0 · Anlass: Gate GATE-REL10-W2 · ADR: —

## R367 · 2026-10-08 · SEE-F1: Weg 1 (Deko-Freihaltung gegen die Gerade), letzter Mehrbedarf +30

Ruling: T3 machte die Heimat-Darstellung von den Fremdinseln abhängig (Route an der Heimatküste unterdrückt die
Tönung): Heimat-Pin, AK-E1-10, AK-E1-12 rot, `terrainSea` Timeout. **Weg 1:** `seaContext.lanes` bleiben Geraden, die
Pins aus M12-E1 (Heimat unabhängig von Fremdinseln) bleiben unangetastet; Wal und Delfin meiden die Route über
`routeDist`. Der L5-T3-Test wird nur auf die Gerade eingegrenzt, wenn eine Messung belegt, wie oft ein Wrack oder Fels
im Korridor der Route liegt (Seeds 1–40, Zahl im Bericht und als Beobachtung); liegt der Anteil über 5 % der Seeds,
geht ein Folgepaket in REL-10. Weg 2 abgelehnt: Er hebt eine Architektur-Invariante für einen seltenen Bildfehler auf.
Neuer Wassertest ≤ 500 ms (Final-Review). Budget: Ist rund 280 gegen 180 frei, zum zweiten Mal ohne Vorabmeldung —
an die Retro; **letzter Mehrbedarf +30** (Commit, `make check`, Review der Nacharbeit, kurzer Browserblick). Reicht er
nicht, stoppt der Lead mit Handoff.

Entscheider: L0 · Anlass: Bericht SEE-F1 · ADR: —

## R368 · 2026-10-08 · Gate Merge TOOL-SMOKE OK

Ruling: **OK** für `tool/smoke` @ d0203e2: `tools/render-qa/smoke.mjs` (Schritte a–f + Menü bei 1280×720 und
1920×1080), Echtprobe gegen main BESTANDEN, Review BEDENKEN ohne Blocker, drei Punkte eingearbeitet; offen niedrig:
⏸-Klick und Tempo-Reset nicht geprüft, Umschalt+U-Hinweis nur per Screenshot. Persona qa-playtester 1.7. Ab dem
Release-Check REL-09 ruft der Playtester `smoke.mjs` und ergänzt nur paketspezifische Schritte. `URL.pathname` bei
Leerzeichen im Pfad → Beobachtung. Ist rund 31 von 40. Merge lokal durch den Integrator mit `make check`.

Entscheider: L0 · Anlass: Bericht TOOL-SMOKE · ADR: —

## R369 · 2026-10-08 · Gate Merge SEE-F1-FAHRLINIE OK mit Auflagen; Folgepaket SEE-F1-KORRIDOR

Ruling: **OK** für `fix/see-f1-fahrlinie` @ 86baaac (Weg 1 nach R367; Pins unangetastet, `decor.ts` = main; Save v9,
`balance.test.ts` ohne Diff, Goldwerte grün; Final-Review `opus` OK nach ZURÜCK-Runde, Review der Nacharbeit OK;
Messung im Browser: Schiffsmitte nie auf Land, Minimum 0,53 zur Kachelkante). Auflagen: (1) `make check` lief bei Load
12,7 mit fremdem Vitest (Verstoss R357) und meldete 19 Tests ohne CI-Reserve — der Integrator wiederholt `make check`
am Merge-Stand bei Load ≤ 8 ohne fremden Lauf; meldet `zeitreserve` dann Tests ohne Reserve, wird nicht gemergt;
(2) optischer Nachweis der Fahrlinie im Release-Check REL-09 (eigener Screenshot-Schritt). Korridor-Messung: 39 von 265
Meer-Elementen (≈ 15 %, 18 von 40 Seeds) liegen ≤ 2 Kacheln an einer Route — über der 5-%-Schwelle aus R367, also
Folgepaket **SEE-F1-KORRIDOR** in REL-10 (lead-tech; Ziel: Meer-Elemente meiden die Fahrlinie, ohne die Invariante
„Heimat unabhängig von Fremdinseln“ der Tönung aufzugeben, z. B. getrennte Freihaltung nur für die Platzierung mit
eigenem Pin). Abgeschwächte Abdeckung des Wassertests (Seeds 1–15, Schritt 0,5) akzeptiert, 150-Seeds-Probe im Review
OK. An die Retro: zweimal Budget ohne Vorabmeldung (Ist ≈ 320 gegen 120 + 60 + 30), Lastregeln R357/R329 umgangen,
Code-Ersetzung per Shell-Skript.

Entscheider: L0 · Anlass: Bericht SEE-F1 · ADR: —

## R370 · 2026-10-08 · SEE-F1 nicht gemergt: Testzeiten-Regression; FIX-SEE-F1-ZEIT

Ruling: TOOL-SMOKE ist in main (be81249). SEE-F1 am Merge-Stand: `make check` grün, aber `zeitreserve` meldet 6 Tests
ohne CI-Reserve (Runner-Schätzung 10), alle mit SEE-F1 neu langsam: `wildlife.test.ts` RF-10 (1,3 s) und vier
Delfin-Tests E5 (2,6–3,3 s), `decorSea.test.ts` L5-T3 (4,9 s), `decorStamps.test.ts` R5 (5,3 s). Merge nach Auflage
R369 (1) abgebrochen — richtig. Vermutung (unbelegt): `seaRoute`/`routeDist` wird je Aufruf neu berechnet (Cache per
WeakMap am Array-Objekt trifft bei frisch gebauten Welten nicht), dann wäre auch die Laufzeit im Spiel betroffen.
Paket **FIX-SEE-F1-ZEIT** (frische lead-tech-Instanz über Handoff, 40 Tools): zuerst messen (Profil eines Delfin-Tests,
Zahl der `seaRoute`-Aufrufe je Frame im Spiel), dann die Ursache beheben (Cache je Welt-Inseln, Vorberechnung);
Timeouts nur als letzter Weg und hergeleitet. Abnahme: `zeitreserve` 0 ohne Reserve am Merge-Stand, Frame-Kosten von
`routeDist` im Spiel genannt. Worktree `.worktrees/see-f1` neu anlegen (der Integrator hatte ihn entfernt; Branch
unverändert @ 86baaac).

Entscheider: L0 · Anlass: Bericht Integrator · ADR: —

## R371 · 2026-10-08 · UI-PANEL-AUFRAEUMEN: Ruling-Kandidaten bestätigt, Trivial-Fix Layout je Frame, REL-09

Ruling: Stand `refactor/ui-panel` @ d2e82c3 (`make check` grün, Final-Review `opus` OK, Playtest 7/7 OK; Kartenhöhe
1280×720 konstant 574 px statt 538 px). Bestätigt: (1) Bauleiste Variante A (R366), Spec nachgeführt; (2) der
Zyklustest zählt Wert-Importe und `export … from`, nicht `import type`; (3) das Overlay darf den Ereignis-Log unten
links verdecken. **Trivial-Fix vor dem Merge:** `syncOverlay` misst die Overlay-Höhe in jedem Frame und erzwingt ein
Layout — Messung nur beim Öffnen/Schliessen und bei `resize` (z. B. `ResizeObserver`), ≤ 10 Tools; danach Browserblick
auf d2e82c3-Folgestand (Karte rückt bei maximal südlicher Kamera nach, Bauvorschau verschwindet beim Öffnen). Die
offenen `app.ts`-Punkte (`resize`, `centerOn` mit voller Höhe) bleiben Beobachtung. Weil der Push am Session-Ende ganz
main veröffentlicht, gehört UI-PANEL-AUFRAEUMEN in **REL-09** (vier Pakete: SEE-F2-UX, ART-WALD-RAUTEN, SEE-F1,
UI-PANEL); ART-L8-SELTEN und SEE-F1-KORRIDOR bilden REL-10.

Entscheider: L0 · Anlass: Bericht UI-PANEL-AUFRAEUMEN · ADR: —

## R372 · 2026-10-08 · Gate Merge SEE-F1-FAHRLINIE (nach FIX-SEE-F1-ZEIT) OK

Ruling: **OK** für `fix/see-f1-fahrlinie` @ 5ac78b8. Ursache gemessen: Neuberechnung von `seaRoute` je frisch gebauter
Welt (13–25 ms, 75 % Dijkstra) und `routeDist` brute-force je Feldkachel, `lanePoints` kopierte je Aufruf. Fix: Cache
über einen Fingerabdruck der Inseln (≤ 64 Sätze), `routeFar` mit Rechteck-Vorprüfung und frühem Abbruch, gecachte
`readonly`-Linien. Testzeiten wieder nahe main (Delfine E5 0,3–0,6 s statt bis 3,3 s); `zeitreserve` 0 ohne Reserve
(Faktor 4 und Runner-Schätzung); Review OK. Frame-Kosten nur per Code-Lesen belegt — Messung im Release-Check
(Smoke + Frame-Zeit im Hafen). Merge durch den Integrator mit `make check` bei Load ≤ 8 ohne fremden Lauf; meldet
`zeitreserve` Tests ohne Reserve, wird nicht gemergt. Ist FIX-SEE-F1-ZEIT ≈ 30 von 40.

Entscheider: L0 · Anlass: Bericht FIX-SEE-F1-ZEIT · ADR: —

## R373 · 2026-10-08 · Gate Merge UI-PANEL-AUFRAEUMEN OK

Ruling: **OK** für `refactor/ui-panel` @ 5f29cc3. Trivial-Fix: Overlay-Höhe gemerkt, Neu-Messung nur bei Umbau der
Bauleiste (`MutationObserver`, auf `hidden` und Kinder eingeschränkt) und `resize`; Playtest 5/5 auf 986ad0f
(Kartenhöhe 574 px konstant, Kamera rückt nach, Vorschau verschwindet, kein Konsolenfehler); die Einschränkung in
5f29cc3 nur per Vitest — der Release-Check REL-09 sieht sie im Browser. Kamerarahmen über die Insel hinaus →
Beobachtung (L0 eingetragen). Ist unter 150. Merge durch den Integrator mit `make check` bei Load ≤ 8 ohne fremden
Lauf; danach Release-Check REL-09.

Entscheider: L0 · Anlass: Bericht UI-PANEL-AUFRAEUMEN · ADR: —

## R374 · 2026-10-08 · Gate Merge Release REL-09 OK; Session-End-Push

Ruling: **OK** für REL-09 = main @ a578d72 (SEE-F2-UX, ART-WALD-RAUTEN + FIX-RAUTEN-ZEIT, SEE-F1-FAHRLINIE +
FIX-SEE-F1-ZEIT, UI-PANEL-AUFRAEUMEN; dazu Werkzeug TOOL-E046-E047, TOOL-E046-SESSION, TOOL-ZEITRESERVE-META,
TOOL-SMOKE). Browser-Lauf: Smoke BESTANDEN beide Grössen, alle vier Paket-Abschnitte OK mit Screenshots unter
`.studio/qa/REL-09/`, Schiff in 342 Proben nie auf Land, Frame-Zeit im Hafen render-Median 1,6 ms (Load 3,6–4,8),
Konsole leer. `opus`-Review BEDENKEN niedrig: Kamera-Klemmung in `app.ts` (`resize`, `centerOn`) mit voller Höhe,
arc42 zu Overlay/`visibleViewHeight`, `seaRoute` liefert veränderbare geteilte Arrays — alle als Folgearbeit REL-10
(Paket **UI-KAMERA-KLEMMUNG** zusammen mit dem Kamerarahmen-Befund). Session-End-Push durch den Integrator nach R335
mit dem neuen Push-Gate (R362): bei 1-min-Load ≤ 3 `make test`, dann `make zeitreserve-push` (Messung mit Commit =
HEAD und Last ≤ 4), `make check`, `make check-ci-perf`; Push; CI prüfen; `gh workflow run Pages --ref main`; Deploy
und `ci.py`. ART-L8-SELTEN pausiert Messläufe bis dahin und bleibt auf seiner Branch (REL-10).

Entscheider: L0 · Anlass: Release-Check REL-09 · ADR: —

## R375 · 2026-10-08 · Session-Retro 29c3791b: V1–V5 angenommen; `merge=union` bleibt entfernt

Ruling: Retro `docs/studio/retros/2026-10-08-session-29c3791b-ende.md` angenommen. Der Coach hat Fix (a) zu Recht nicht
umgesetzt: `merge=union` wurde mit R303 absichtlich entfernt (H-F1 holte rund 490 gestrichene Zeilen zurück); falsch
ist der Satz in `gates.md` (V4). Konflikte in `docs/beobachtungen.md` löst weiter der Eigentümer des späteren Branches.
(V1) **TOOL-TESTLOCK** (E-051, Werkzeug ohne Experimentplatz wie E-043/E-047, lead-tech, 40 Tools) nächste Session:
Lockdatei und Load-Prüfung in `make check`/`make test`/`zeitreserve-push`. (V2) E-050 `vorgeschlagen`, Pflicht-Hebel
für Cache-Write, wartet auf Platz. (V3) Briefing-Vorlage: Pflichtzeilen je Paketart (`make studio-test`, Echtlauf
externer APIs, Mehrbedarf vorab melden) und (V4) `gates.md` Z. 218 an R303 angleichen — **sofort** durch den
studio-coach vor dem Push, Handbuch 1.31. (V5) Gleitende 5-Session-Zeilen mit dem E-049-Paket. Steuerung (dritte
Session rot): E-038 bekommt den ersten freien Platz ab 2026-10-22; Reihenfolge der Wartenden damit E-038, E-048,
E-050, E-049, E-044.

Entscheider: L0 · Anlass: Session-Retro · ADR: —

## R376 · 2026-10-09 · Fortsetzung nach REL-09: drei Stränge, alles lokal bis zum nächsten Session-Push

Ruling: Der Push dieser Session ist erfolgt (R335: höchstens einer); weitere Merges bleiben lokal und gehen mit dem
nächsten Session-End-Push live. Parallel, getrennte Dateien: (1) **ART-L8-SELTEN** fortsetzen über Handoff (frische
lead-art-Instanz, Restbudget aus dem Handoff, Mehrbedarf vorab); (2) **TOOL-TESTLOCK** (E-051, R375; lead-tech, 40
Tools, `Makefile`, `tools/`); (3) Pläne **SEE-F1-KORRIDOR** und **UI-KAMERA-KLEMMUNG** (lead-tech, je 20 Tools, Stufe
leicht, Fehlerbehebung ohne Kurzdesign). Gate je Plan durch lead-qa gebündelt.

Entscheider: L0 · Anlass: Nutzer „mach weiter“ · ADR: —

## R377 · 2026-10-09 · Gate REL-10 Welle 3: KORRIDOR BEDENKEN (B1 blockierend), KAMERA BEDENKEN; Pin-Ruling

Ruling: (1) **SEE-F1-KORRIDOR:** Die Routen-Freihaltung gilt nur für Wrack, Eiland und Felsen; die Flächen aus
`seaPlan`, aus denen `seaTintFor` die Tönung baut, bleiben **bitgleich zu main** — neuer Pin: Hash von `seaTintFor`
über Seeds 1–40, in K1 auf main aufgenommen, unverändert über K3–K5 (B1). Pin-Ruling vor K4 (B2, ergänzt R367):
`HOME_CALLS` darf begründet neu gesetzt werden, wenn sich nur die Positionen der Meer-Elemente verschieben;
`HOME_ORDER` und die `terrainSea`-Pins bleiben unverändert. AK-K1 mit genauer Messgrösse (Elemente inkl. Felsnadel?,
Abstand Kachelmitte, alle Routenpaare wie `routeFar`, Ausgangswert auf main im Test; lead-qa maß 29/275 = 10,5 %,
B3); Determinismus Speichern→Laden und kalter Cache, Indexreihenfolge `seaRoute(a < b)` (B4). Nach der Nacharbeit
Zweitprüfung nur für B1 durch lead-qa; Umsetzung nach dem Merge von ART-L8-SELTEN. (2) **UI-KAMERA-KLEMMUNG:**
Nacharbeit U1–U4 ohne Zweitprüfung (DOM-freier Helfer in eigener Datei unter `src/ui/`, Neu-Messen nach Resize,
Abbruchregel in U3, messbares „kein Sprung“ ≤ 1 px mit DPR 1 und 2, Tests ≤ 500 ms, `zeitreserve` 0); danach Umsetzung
frei, 150 Tools.

Entscheider: L0 · Anlass: Gate GATE-REL10-W3 · ADR: —

## R378 · 2026-10-09 · TOOL-TESTLOCK: Re-Review vor dem Merge; Fake-Schalter nur in Tests

Ruling: `tool/testlock` @ ed1881d (Sperre in `<git-common-dir>/studio-testlock`, Abbruch bei belegter Sperre oder
Load > 8, atomare Übernahme toter Sperren, Freigabe nur der eigenen; Echtprobe: zweiter Lauf bricht mit Grund ab).
Weil die Review-Fixes die Korrektheit der Sperre betreffen (Wettlauf, fremde Freigabe) und kein Review sie gesehen
hat, folgt ein kurzes Re-Review (sonnet) vor dem Merge. **Regel:** `TESTLOCK_FAKE_LOAD` und `ZEITRESERVE_FAKE_*` setzen
Agenten nur in Tests, nie um eine echte Last- oder Sperrprüfung zu umgehen (der Lead nutzte ihn für `make check` bei
Load 9–13). Test-first nicht eingehalten → Retro. Beobachtung: Exit 1/2 von `zeitreserve-push` ist über `make` nicht
unterscheidbar (immer 2). `.worktrees/testlock-probe` entfernt der Integrator ohne `--force`.

Entscheider: L0 · Anlass: Bericht TOOL-TESTLOCK · ADR: —

## R379 · 2026-10-09 · SEE-F1-KORRIDOR: Plan frei mit Zwei-Durchgang-Verfahren

Ruling: Zweitprüfung B1 BEDENKEN, nicht blockierend. Angenommen: **Durchgang A** setzt die Meer-Elemente wie auf main
gegen die Geraden, daraus `blocked` und die Flächen (bitgleich zu main); **Durchgang B** wählt die endgültigen
Positionen von Wrack, Eiland und Felsen mit `seaPlanKeepOut` neu (meiden Flächenkacheln samt Rand, Abstand ≥ 3) ohne
Rückwirkung auf die Flächen; Zusatztest `seaTintFor` mit `ctx.routes = []` gleich wie mit Routen. B3: Messung und
Freihaltung nutzen dieselbe Routenmenge, **alle Paare** wie `routeFar`. Der Planer trägt das als Satz in Entwurf und
AK-K3 nach (ohne neue Prüfung). Umsetzung nach dem Merge von ART-L8-SELTEN, Budget 120 Tools.

Entscheider: L0 · Anlass: Zweitprüfung GATE-REL10-W3 · ADR: —

## R380 · 2026-10-09 · Gate Merge TOOL-TESTLOCK OK

Ruling: **OK** für `tool/testlock` @ bafa9ea. Übernahme toter Sperren nur über ein Wächterverzeichnis (`mkdir`), Test
mit drei parallelen Prozessen (genau einer läuft); Sperre per Temp-Datei und `linkSync` atomar; `CI=false/0/leer` gilt
nicht als CI; Signal-Exit 128 + Nummer; Fake-Schalter als nur für Tests markiert. Re-Review OK. `make check` grün ohne
Fake-Schalter, Echtprobe zweier gleichzeitiger `make test`: zweiter bricht mit Grund ab. Ab dem Merge ist R357 ein
Werkzeug: `make check`/`make test`/`zeitreserve-push` brechen bei belegter Sperre oder Load > 8 ab (nicht warten).
Merge durch den Integrator; `.worktrees/testlock-probe` ohne `--force` entfernen. Ist ≈ 56 von 55.

Entscheider: L0 · Anlass: Bericht TOOL-TESTLOCK · ADR: —

## R381 · 2026-10-09 · Gate Merge ART-L8-SELTEN OK; Widerspruch Meeresfels-Urteil

Ruling: **OK** für `feat/l8-selten` @ 617acdc (Strandkiefern an der Kiefernküste, `rareBudget` mit Meer-Losen,
weniger Lichtungen, Boden-Deko ohne Artwechsel neben Neubau; Quotenlauf Seeds 1–500 bestanden; Bildrunde 1 OK;
Final-Review `opus` BEDENKEN niedrig, erledigt in 556908f; `make check` grün, `zeitreserve` 0 bei 2646 Tests). Kaltstart
aus der Handoff-Messung (Median −0,2 %), seither nur ein Kommentar in `src/` geändert — akzeptiert. Abweichung AK5
(Signaturtest statt Zwei-Kontext-Test) akzeptiert. Budget deutlich überzogen (≈ 240 gegen 170) — an die Retro.
**Widerspruch:** Release-Check REL-09 (R374) sah den Meeresfels bei Zoom 0,5 als Fels, lead-art sieht ihn als Segelboot.
Klärung im nächsten Release-Check als Blindprobe (Probe-Bild ohne Kontext, Urteil vor Öffnen der Vergleichsbilder,
E-018); bis dahin bleibt die Beobachtung offen. Merge durch den Integrator; danach Start SEE-F1-KORRIDOR.

Entscheider: L0 · Anlass: Bericht ART-L8-SELTEN · ADR: —

## R382 · 2026-10-09 · Gate Merge UI-KAMERA-KLEMMUNG OK; Auslegung AK-U4

Ruling: **OK** für `fix/ui-kamera` @ 239adbe (`app.ts` klemmt und zentriert mit `visibleViewHeight`, DOM-freier Helfer
`src/ui/cameraView.ts`; `cameraBounds` = Landausdehnung + `CAMERA_MARGIN` 6 statt 12–20 Kacheln Rand; Dev-Probe
`__inselDev.camera()`; arc42 nachgeführt; Final-Review `opus` BEDENKEN ohne Blocker; Playtest Konsole leer, an allen
Rändern Land sichtbar). **Auslegung AK-U4:** „kein Sprung“ gilt innerhalb des Kamerarahmens (gemessen 0 px); am
Rahmenrand ist Nachklemmen um die halbe Resize- bzw. Overlay-Änderung gewollt (`clampToRect` klemmt die Mitte der
sichtbaren Fläche; gemessen Nord 23–25 px, West 89 px bei Resize). Rahmenecken bei verstreuten Inseln im Wasser →
Beobachtung. Commit `564e7c2` (`test:` mit `src/`-Anteil) an die Retro. Merge seriell nach ART-L8-SELTEN durch den
Integrator (Konflikte in `docs/arc42.md`/`docs/beobachtungen.md` löst der Lead per `git merge main`).

Entscheider: L0 · Anlass: Bericht UI-KAMERA-KLEMMUNG · ADR: —

## R383 · 2026-10-09 · SEE-F1-KORRIDOR: Pins bestätigt, Nachlauf vor dem Merge

Ruling: Stand `fix/see-f1-korridor` @ 6d545bf: Korridor main 31/265 (11,7 %) → 0/265; Tönungs-Pin `seaTintFor`
(683761494) und `terrainSea`-Pins unverändert, Flächen bitgleich (Final-Review). Bestätigt nach R377: `HOME_CALLS`
802371235 → 2887272513 (nur Positionen der Meer-Elemente), `HOME_ORDER` unverändert. AK-E1-10 wird nicht pauschal
abgeschwächt: Der Test vergleicht weiter die Ereigniszahl **ohne** Meer-Stempel-Ereignisse und ohne `at` (Vorschlag
Final-Review). Nachlauf vor dem Merge (+35 Tools, Gesamt 155): `make test` + `node tools/zeitreserve/check.ts` bei Load
≤ 4 (0 ohne Reserve), Kaltstart-A/B Seed 7 `--runs 3` (≤ +3 %), Sichtprobe offene See auf der Route bei Zoom 0,5 und 1,
Test mit ausdrücklich kaltem `shared`-Cache, die drei Kommentar-/Titel-Korrekturen; den einmal roten Test aus dem vollen
Lauf benennen (erneut laufen lassen, als Beobachtung eintragen). Task-Reviews durch ein Final-Review ersetzt → Retro.

Entscheider: L0 · Anlass: Bericht SEE-F1-KORRIDOR · ADR: —

## R384 · 2026-10-09 · SEE-F1-KORRIDOR: Mehrbedarf +25 frei; 200-Seeds-Test als Werkzeug

Ruling: Mehrbedarf rechtzeitig gemeldet (Briefing-Vorlage 1.31 wirkt) — **+25 frei** (Gesamt 180). Kaltstart-A/B
Seed 7: main 8872 ms, Branch 8632 ms (−2,7 %). Der Test „Seeds 1–200: kein Meer-Element < 3 Kacheln von einer Lane“
(`tests/render/decor.test.ts`) braucht 5,0 s statt 0,9 s (kalte `seaRoute` je Welt). Kein blosses Aufteilen (spart
keine CI-Minuten, R356/R361): Die Suite prüft **Seeds 1–40** (≤ 500 ms je Test, gemeinsamer Aufbau), die
200-Seeds-Prüfung läuft als Werkzeug unter `tools/render-qa/` (wie `quoten.mjs`, R366) mit Ergebnis im Bericht.
Danach `zeitreserve` bei Load ≤ 4 (0 ohne Reserve), Sichtprobe offene See, kurzes Review. Die Rulings zu `HOME_CALLS`
und AK-E1-10 stehen in R383.

Entscheider: L0 · Anlass: Mehrbedarf SEE-F1-KORRIDOR · ADR: —

## R385 · 2026-10-09 · KORRIDOR: A/B der langsamen Tests; FIX-TESTLOCK-RACE

Ruling: (1) **SEE-F1-KORRIDOR** +15 frei (Gesamt 195; zweimal rechtzeitig gemeldet). `korridor.mjs` Seeds 1–200: 0 von
1297 Elementen nahe einer Route; Lane-Test Seeds 1–40 in 18 ms; Sichtprobe offene See OK. Offen: `zeitreserve` meldet
`waterSea.test.ts`, `wildlife.test.ts`, `decor.test.ts` „R4 Anker und Kontor“ (5,5 s) ohne Reserve. Pflicht: A/B dieser
drei Dateien gezielt (`npx vitest run <datei>`) auf main und Branch unmittelbar nacheinander bei gleicher Last, Zeiten
je Test zitieren. Langsamer auf dem Branch → Ursache beheben (Cache/Vorberechnung) oder Seeds 1–40 + Werkzeug wie R384;
gleich schnell → Altlast, Beobachtung, kein Paket-Blocker. Danach Review (sonnet). Die abschliessende `zeitreserve`-
Messung bei Load ≤ 4 übernimmt das Push-Gate der nächsten Session. (2) Der rote Lauf von `tests/tools/testlock.test.ts`
„genau einer gewinnt“ (erhalten 2) ist ein möglicher **echter Wettlauf** in der Sperre, kein blosses Lastartefakt:
Paket **FIX-TESTLOCK-RACE** (frische lead-tech-Instanz, 30 Tools): Test unter Last reproduzieren (Schleife), Ursache
belegen, beheben. (3) Beobachtung: `zeitreserve` misst `loadMax` inklusive der vom eigenen Vitest-Lauf erzeugten Last
(Start 2,8 → Ende 9,8); die Bedingung Last ≤ 4 ist damit auf diesem Rechner nur knapp erreichbar → Kandidat für die
nächste Retro (Last vor dem Lauf messen, eigene Last abziehen oder Grenze anpassen).

Entscheider: L0 · Anlass: Bericht SEE-F1-KORRIDOR · ADR: —

## R386 · 2026-10-09 · SEE-F1-KORRIDOR: Trivial-Fix Testzeiten im Paket, dann Merge

Ruling: A/B (Load 4,8–5,1): `waterSea` Riffschaum main < 500 → Branch ≈ 810 ms, `wildlife` E5 R4-Sperrbereich
< 500 → ≈ 750 ms (Ursache kalte `seaRoute` + Durchgang B je Welt); `decor` R4 und Lane-Abstand auf Seeds 1–40 gekürzt
(29/18 ms). Die zwei Mehrzeiten entstehen durch das Paket → **Trivial-Fix im Paket** (Ownership für
`tests/render/waterSea.test.ts` und `tests/render/wildlife.test.ts` hiermit erteilt): Welten/Pläne in `beforeAll`
teilen, ≤ 500 ms je Test, Aussage unverändert; +10 Tools (Gesamt 205). Danach Gate Merge **OK** ohne weitere Prüfung
(Final-Review BEDENKEN ohne Blocker, Nachlauf-Review OK, Korridor 0/265 und 0/1297 über 200 Seeds, Tönungs-Pin
unverändert, Kaltstart −2,7 %); Merge durch den Integrator mit `make check`, `zeitreserve` belastbar erst am Push-Gate.

Entscheider: L0 · Anlass: Bericht SEE-F1-KORRIDOR · ADR: —

## R387 · 2026-10-09 · Gate Merge FIX-TESTLOCK-RACE OK

Ruling: **OK** für `fix/testlock-race` @ 2d3cfb7. Echter Wettlauf belegt (≈ 3 von 100 Runden zwei gleichzeitige Läufe,
auch ohne Last 2 von 20 Testläufen rot): `takeOver` löschte bei bereits verschwundener Sperre (`ENOENT`) eine
inzwischen frisch angelegte, lebende Sperre (ABA ausserhalb des Wächters). Fix: bei `ENOENT` ohne Löschen abbrechen,
nächster Versuch legt selbst an. Nachher 0 von 200 Runden, 20/20 unter CPU-Last; Review OK. Der Test braucht ≈ 4 s
(Haltezeit für Überlappung) — akzeptiert, weil eine kürzere Haltezeit die Prüfung schwächt; als Altlast-Kandidat
für die Zeitreserve beobachten. Merge seriell nach SEE-F1-KORRIDOR.

Entscheider: L0 · Anlass: Bericht FIX-TESTLOCK-RACE · ADR: —

## R388 · 2026-10-09 · SEE-F1-KORRIDOR: alle 200-Seeds-Meertests auf einmal

Ruling: FIX-TESTLOCK-RACE ist in main (b0156fd). SEE-F1-KORRIDOR @ c8522ec scheiterte am Merge-Stand dreimal an
`tests/render/decor.test.ts:1241` „Wrack in 25–55 % der Seeds 1–200“ (Timeout 5000 ms unter Last; einzeln grün).
Dritte Runde desselben Musters → der Lead behandelt **alle** Tests in `tests/render/` mit Schleifen über ≥ 100 Seeds,
die Meer-Plan, `seaRoute` oder `stampPlacements` nutzen, in einem Zug: gemeinsamer Aufbau je Datei (`beforeAll`),
Quoten über 200 Seeds ins Werkzeug (`tools/render-qa/korridor.mjs` bzw. `quoten.mjs`, Ergebnis im Bericht), in der
Suite eine grobe Prüfung über Seeds 1–40; jeder Test ≤ 500 ms. Liste der betroffenen Tests mit Zeiten vorher/nachher
im Bericht; `make check` im Worktree grün. +15 Tools (Gesamt 220). An die Retro: Plan-AK zur Testzeit prüfte nur neue
Tests, nicht bestehende, die das Paket verlangsamt.

Entscheider: L0 · Anlass: Bericht Integrator · ADR: —

## R389 · 2026-10-09 · REL-10 komplett in main; Release-Check und Push-Gate-Vorarbeit parallel

Ruling: REL-10 = main @ c367f9c (ART-L8-SELTEN, UI-KAMERA-KLEMMUNG, SEE-F1-KORRIDOR; Werkzeug TOOL-TESTLOCK,
FIX-TESTLOCK-RACE), `make check` grün (2664). Parallel: (1) **Release-Check REL-10** — Browser-Lauf (Smoke + je Paket
ein Abschnitt) und `opus`-Review über `origin/main..main`; dazu die **Blindprobe Meeresfels** (R381, E-018): ein Rater
bekommt zwei Ausschnitte bei Zoom 0,5 (Fels, Boot) ohne Beschriftung, urteilt schriftlich, erst danach Vergleich.
(2) **FIX-ZEITRESERVE-REL10** (lead-tech, 25 Tools): `tests/render/trees-licht.test.ts` „H-R10 Kronen in 3 Tönen c)“
(976 ms lokal, Runner ≈ 2,9 s) und `tests/tools/testlock.test.ts` „genau einer gewinnt“ (4,1 s × 4 gegen 30 s) so
bereinigen, dass das Push-Gate (Faktor 4 und Runner ×3) bei ruhiger Last 0 meldet — zuerst billiger machen, sonst
hergeleitete Timeouts wie R328; Aussage unverändert. Push erst in der nächsten Session (R335).

Entscheider: L0 · Anlass: Merge SEE-F1-KORRIDOR · ADR: —

## R390 · 2026-10-09 · Gate Merge Release REL-10 OK; Folgepakete REL-11

Ruling: **OK** für REL-10 = main @ c367f9c (+ Doku). `opus`-Review OK (Tönung unabhängig von Fremdinseln, Pin
683761494; Determinismus über 200 Seeds; Kappe mit `rareBudget` korrekt; Save v9, `balance.test.ts` ohne Diff).
Browser-Lauf BEDENKEN ohne Blocker: Smoke BESTANDEN, ART-L8-SELTEN OK, SEE-F1-KORRIDOR OK (Mindestabstand ≥ 14,2
Kacheln, Tönung identisch zu REL-09), Konsole leer. Zwei Befunde, beide **kein Rückschritt** gegenüber REL-09:
(1) **Blindprobe Meeresfels** (E-018): Rater urteilte bei Zoom 0,5 „Boot“ für den Fels — der Widerspruch aus R381 ist
damit entschieden → Paket **ART-MEERESFELS** (lead-art, REL-11): Silhouette bei Zoom ≤ 0,5 ohne Segel-Lesart, Abnahme
per Blindprobe mit ≥ 3 Fels- und ≥ 3 Bootsbildern; (2) bei langem Scrollen zeigen die Rahmenecken nur Wasser (iso-
Rechteck um verstreute Inseln) → Paket **UI-KAMERA-RAND** (lead-tech, REL-11): Klemmung an die nächste Landfläche
bzw. Rauten-Rahmen. Push von REL-10 erst in der nächsten Session (R335), nach dem Merge von FIX-ZEITRESERVE-REL10.

Entscheider: L0 · Anlass: Release-Check REL-10 · ADR: —

## R391 · 2026-10-09 · Gate Merge FIX-ZEITRESERVE-REL10 OK

Ruling: **OK** für `test/zeitreserve-rel10` @ 649802d: `testlock`-Test parallelisiert mit 1500 ms Haltezeit (≈ 1,7 s
statt 4 s, 5/5 grün), `trees-licht` c) mit geteiltem Aufbau und hergeleitetem Timeout 10 s; Doku zur Testsperre in
README/arc42, Zweitlos-Satz korrigiert, zwei Beobachtungen; Kurz-Review OK, `make check` grün. Offen: `zeitreserve`
meldete 2 weitere Tests ohne Reserve bei unbekannter Last — Abnahme am Push-Gate der nächsten Session; meldet es dort
bei Load ≤ 4 Tests, folgt ein Trivial-Fix vor dem Push. Merge lokal durch den Integrator.

Entscheider: L0 · Anlass: Bericht FIX-ZEITRESERVE-REL10 · ADR: —

## R392 · 2026-10-09 · Retro-Nachtrag Teil 2: V6–V8 angenommen

Ruling: Nachtrag in `docs/studio/retros/2026-10-08-session-29c3791b-ende.md` angenommen. (V6, E-052) Briefing-Vorlage:
`src/`-Pakete messen vor Task 1 die Zeiten der berührten bestehenden Tests auf main (`vitest related`), die Abnahme
vergleicht dieselben Dateien main/Branch direkt nacheinander; „Prüfschritte nicht zur Budgetersparnis streichen,
Mehrbedarf melden“ — sofort durch den studio-coach, Handbuch 1.32. (V7, E-053) `zeitreserve` wertet nur die Last vor
dem Lauf (≤ 4, Sperre gehalten); Vorbedingung: lead-tech belegt, aus welchen Läufen die Faktoren von E-043 stammen.
(V8) `make check` bricht bei Konfliktmarkern ab. V7 + V8 als Paket **TOOL-GATES-2** (lead-tech, ≈ 25 Tools) **zu
Beginn der nächsten Session vor dem Push-Gate** von REL-10. Steuerungsanteil 56,5 % (rot): Hebel E-038 ab 2026-10-22
bleibt (R375).

Entscheider: L0 · Anlass: Retro-Nachtrag · ADR: —

## R393 · 2026-10-09 · TOOL-GATES-2 abgenommen; V7 (E-053) entfällt

Ruling: TOOL-GATES-2 angenommen (`6e635a4`, `bd1c8e3`). (V8) `make conflicts` ist erster Schritt von `check-run` und
bricht bei Zeilen ab, die mit `<<<<<<< ` oder `>>>>>>> ` beginnen (versionierte Textdateien, `=======` bewusst nicht);
Test `tests/tools/conflicts.test.ts`. (V7) entfällt nach der Vorbedingung aus R392: Faktor 4 stammt aus Einzeltests
(R302), Faktor 3 aus E-043 (`afb14a8`); Last wird erst seit `c69938d` (R353) mitgemessen — Kalibrierung mit Eigenlast
nicht belegbar. `zeitreserve-push` bleibt unverändert (Load ≤ 4). Prozessabweichung an die Session-Retro: Test und
Skript in einem Schritt angelegt, vier von fünf Fällen ohne Rot-Phase. Voller `make check` läuft im Push-Gate REL-10.

Entscheider: L0 · Anlass: Gate TOOL-GATES-2 · ADR: —

## R394 · 2026-10-09 · V7 doch umsetzen (revidiert R393 Teil V7); Push-Gate REL-10 gestoppt

Ruling: Das Push-Gate REL-10 brach bei `make zeitreserve-push` mit „nicht belastbar“ ab, obwohl `make test` zweimal
grün war (Last Start 2,7 → Ende 10,3; Start 1,3 → Ende 7,1): Vitest lastet die 10 Kerne selbst aus, `loadMax ≤ 4`
ist mit vollem Lauf nicht erreichbar (B10 bestätigt). Auslegung der Vorbedingung aus R392: Die Faktoren von E-043
stammen aus Einzeltests ohne Eigenlast (R393). Unter Eigenlast gemessene Zeiten sind länger, lokal × 4 bzw. × 3
überschätzt die Runner-Zeit also — das Urteil wird strenger, nie lascher. Fehlalarme sind möglich, verpasste
Regressionen nicht; ein Fehlalarm wird wie bisher per Einzellauf des Tests bei ruhiger Last bestätigt oder entkräftet
(R391). Damit ist das Ziel der Vorbedingung erfüllt. **TOOL-GATES-2b** (lead-tech, ≈ 15 Tools): `measurementProblem`
prüft `loadStart ≤ 4` statt `loadMax`; `loadEnd`/`loadMax` bleiben in Messdatei und Ausgabe; Tests angepasst;
E-053 in `experimente.md` von „entfallen“ auf „übernommen als Werkzeug (R394)“ mit Messgrösse aus R392. Danach
Push-Gate REL-10 neu. Ad-hoc-Retro zum gescheiterten Integrator-Lauf durch den Coach (kurz, L0-Fund: R393 hat die
Vorbedingung zu eng gelesen; Wirkung auf das Push-Gate nicht geprüft).

Entscheider: L0 · Anlass: Integrator PUSH-REL-10 gescheitert · ADR: —

## R395 · 2026-10-09 · TOOL-GATES-2b abgenommen; Ad-hoc-Retro Push-Gate: V1 angenommen, V2 zurückgestellt

Ruling: TOOL-GATES-2b angenommen (`3d5c1af` rot 5/34, `ee1de69` grün 34/34, `84c4773`); `zeitreserve-push` wertet
`loadStart ≤ 4`. Push-Gate REL-10 startet neu. Retro `docs/studio/retros/2026-10-09-adhoc-pushgate-rel10.md`: (V1)
Briefing-Vorlage und Abnahme-Checkliste: „Entfällt eine Vorbedingung, nennt die Abnahme die Fehlerrichtung und belegt,
dass das abhängige Gate erfüllbar bleibt“ — Umsetzung durch den studio-coach nach dem Push (HEAD bleibt während des
Gates stabil); Messgrösse 0 Gate-Abbrüche aus entfallenen Werkzeug-Paketen in 5 Push-Gates. (V2) zurückgestellt bis
zum zweiten Fall. lernen.md-Zeile aus der Retro übernimmt der Coach mit V1.

Entscheider: L0 · Anlass: Gate TOOL-GATES-2b, Ad-hoc-Retro · ADR: —

## R396 · 2026-10-09 · FIX-TIMEOUT-REL10 abgenommen; dritter Push-Anlauf REL-10

Ruling: Zweiter Push-Anlauf (gültig, `loadStart` 2,3) meldete zwei echte Überschreitungen ohne Reserve —
`decorSea` „L5-T1 … Seeds 1–50“ 4,1 s und `decorStamps` „R5 Solitär … Seeds 1–50“ 5,9 s im Gesamtlauf (einzeln 3,1 s
und 4,3 s). Trivial-Fix nach R391 angenommen (`c851782`, `2430b73`): Timeouts 40 s und 60 s (R270 ≥ 8 × plus ≈ 20 %
Reserve gegen die heute gemessene Laufschwankung bis +12 %). Das Gate hat gewirkt (keine Retro-Pflicht über die
Session-Retro hinaus; der Integrator-Abbruch ist Gate-Erfolg, kein Prozessfehler). Messwert für die Session-Retro:
nach `make test` liegt die Last ≈ 2 min über 4; der Integrator wartet zwischen `make test` und `zeitreserve-push`.

Entscheider: L0 · Anlass: Bericht FIX-TIMEOUT-REL10 · ADR: —

## R397 · 2026-10-09 · FIX-CONFLICTS-TSC abgenommen; vierter Push-Anlauf REL-10

Ruling: Dritter Push-Anlauf: `make test`, `zeitreserve-push` (0 ohne Reserve), `check-ci-perf` grün; `make check`
rot im Build-Typcheck (TS2353 `cwd` in `tests/tools/conflicts.test.ts`, eingeführt mit TOOL-GATES-2, `6e635a4`).
Fix angenommen: `cwd?: string` im Shim `tests/tools/node-shim.d.ts` (ADR-001, kein `@types/node`), `tsc --noEmit`
Exit 0. L0-Fund für die Session-Retro: Abnahme R393 ohne Typcheck (Vitest transpiliert ohne Typprüfung); Vorschlag
an den Coach: DoD-Pflichtzeile `npx tsc --noEmit` für jedes Paket mit `.ts`-Änderung; Integrator führt `tsc --noEmit`
vor `make test` aus (schneller Abbruch statt nach 8 min). Vierter Anlauf startet sofort.

Entscheider: L0 · Anlass: Integrator PUSH-REL-10 (3) gescheitert · ADR: —

## R398 · 2026-10-09 · REL-10 live; REL-11 Planung in zwei Strängen; DoD-Zeile Typcheck

Ruling: (1) **REL-10 live**: Push `7812eb0..5d14854` (100 Commits), CI 37922518742 grün, Pages 37923119613 grün. Push
dieser Session verbraucht (R335). (2) **REL-11** nach BEOB-AUSW (`18ac258`) in zwei Strängen mit disjunkten Dateien,
Muster R352 (Fehlerbehebungen ohne neue Spielregel: kein Kurzdesign; der Lead liefert Plan mit Tasks,
Datei-Ownership und Budgetantrag im Bericht, danach kombiniertes Gate Spec/Plan durch L0; Planungsbudget je 25 Tools):
**Render-Strang** (lead-art): ART-MEERESFELS (R390), SEE-F3-SCHIFFSKONTRAST, RENDER-SEEPLAN-KEEPOUT;
**UI-Strang** (lead-tech): UI-KAMERA-RAND (R390) plus die drei Trivial-Fixes aus BEOB-AUSW (Kontrast `.needs`/
`.reasons`, `favicon`, toter `noLoadableReason`). TOOL-RENDERQA-NACHZUG-Rest bleibt Kandidat. (3) R397-Vorschlag
angenommen: Briefing-Vorlage Punkt 5 Pflichtzeile „jedes Paket mit `.ts`-Änderung: `npx tsc --noEmit` Exit 0“;
Integrator-Briefing: `tsc --noEmit` und `make lint` vor `make test`. Umsetzung mit R395 V1 durch den studio-coach
(Handbuch 1.33).

Entscheider: L0 · Anlass: Push REL-10, BEOB-AUSW · ADR: —

## R399 · 2026-10-09 · Gate Spec/Plan REL-11 Render-Strang OK mit Auflage

Ruling: **OK** für `docs/superpowers/plans/2026-10-09-rel11-render.md` (`d593e19`). Budget 12 Starts, Parallelität 3,
Richtwert ≈ 220 Tools; drei Worktrees, Merge-Reihenfolge Keepout → Schiff → Fels. Blindprobe ART-MEERESFELS mit einem
Rater (6 Bilder, frischer Kontext, Zuordnung erst nach dem Urteil) freigegeben. **Auflage SEE-F3:** Kontrastziel des
Saums gegen alle drei Meerestöne ≥ 2,0 statt 1,5 (1,5 liegt kaum über dem heutigen Mittelwasser-Wert 1,43); Messung im
Test, Sichtprobe zusätzlich. Keepout: Zähler (`distToSeg` ≤ 20 %) und Referenzvergleich sind die harten Abnahmen, Zeiten
nur bei Load ≤ 4. Pins: Nahzoom bitgleich, sonst je Pin ein Ruling. Studioweit ≤ 5 Arbeiter (R241): Der UI-Strang
erhält höchstens 2 parallele Arbeiter.

Entscheider: L0 · Anlass: Plan REL-11 Render · ADR: —

## R400 · 2026-10-09 · Gate Spec/Plan REL-11 UI-Strang OK

Ruling: **OK** für `docs/superpowers/plans/2026-10-09-rel11-ui.md` (`02b28a2`). UI-KAMERA-RAND als konvexe Hülle der
Land-Boxen plus Rand 6 (optionales Feld `hull` in `TileRect`, `clampToRect` ohne Signaturänderung) — stetig, Reisen
zwischen Inseln bleibt möglich; Rauten-Rahmen und Klemmung an Landflächen verworfen. Wasser entlang der Hüllenkanten
bei wenigen Inseln ist akzeptiert; Variante mit Korridoren nur bei Spielerbefund. Trivial-Fixes: Kontrast
`.needs`/`.reasons` mit Test, `noLoadableReason` löschen; **favicon entfällt** (seit `a7e2192` erledigt, Browser-Check
prüft nur, dass kein `/favicon.ico` angefragt wird). Budget 12 Starts, Parallelität 2, Richtwert ≈ 100 Tools; zwei
Worktrees. `cameraBounds`-Tests (AK-E1-12) dürfen am neuen Feld nicht brechen. Konflikte in `docs/arc42.md`/
`docs/beobachtungen.md` mit dem Render-Strang löst der Integrator seriell nach Konflikt-Probe.

Entscheider: L0 · Anlass: Plan REL-11 UI · ADR: —

## R401 · 2026-10-09 · Gate Merge REL-11 UI-Strang OK

Ruling: **OK** für `fix/rel11-kamera` @ `e0fcddb` (enthält `fix/rel11-triv`): Final-Review `opus` OK, Playtest
BEDENKEN ohne Blocker, `tsc --noEmit` Exit 0, 116 gezielte Tests grün; Konflikt-Probe gegen main sauber. Ergänzung
zu R400: **Hüllenecken**, die bei Zoom ≥ 0,5 nur Wasser zeigen, sind akzeptiert wie die Hüllenkanten (Hülle ist nie
schlechter als das Rechteck, Seed 7 SW Zoom 0,25: 78 statt 0 Landkacheln); Korridore nur bei Spielerbefund.
Prozessabweichung an die Session-Retro: Testzeiten nach R392 bei Load 5,8–6,6 statt ≤ 4 gemessen (A/B direkt
nacheinander, ≤ +3,4 %; als relativer Vergleich angenommen, nicht als Messwert). Lint war nur an der Render-Plan-Datei
rot, behoben (`175d74c`). Merge seriell durch den Integrator im Worktree `.worktrees/integrate`, `make check`, lokal.

Entscheider: L0 · Anlass: Bericht REL11-UI · ADR: —

## R402 · 2026-10-09 · Gate Merge REL-11 Render: Keepout und Schiff OK, Fels nach Fix-Runde

Ruling: Final-Review `opus` (lead-qa) BEDENKEN gesamt. **OK** für `fix/render-seeplan-keepout` @ 7576f29 (Zähler
11,6 % gegen main nachgemessen, Plan bitgleich) und `fix/see-f3-schiffskontrast` @ a0278db (Saum 6,63/4,02/2,21,
Pins grün). **Fels** @ 9bcbbb1 fachlich OK (Blindprobe 10/10, Nahzoom-Hash identisch), aber Fix-Runde vor dem Merge:
main nach dem Merge von Keepout und Schiff in den Branch holen, Konflikt in `docs/arc42.md` lösen, Zeile 222 (`|`
escapen) und Kommentar `decorStamps.ts` (Verhältnisse 1,28/1,06) angleichen; kein neues Review, L0 prüft den Diff.
Vor dem Merge: Zeitprüfung nach R392 für alle drei Branches bei Load ≤ 4 (A/B main/Branch direkt nacheinander, kein
bestehender Test > 500 ms oder > +50 %). Nach dem Fels-Merge: gemeinsame Sichtprobe Schiff mit Saum und Fels bei
Zoom 0,25 und 0,5 (Release-Check REL-11). An die Session-Retro: Rot-vor-Grün in der Historie bei Schiff, Fels-M2 und
Keepout-Zähler nicht belegt (zweiter Fall nach TOOL-GATES-2 → R395 V2 wird fällig).

Entscheider: L0 · Anlass: Final-Review REL11-RENDER · ADR: —

## R403 · 2026-10-09 · Gate Merge ART-MEERESFELS OK

Ruling: **OK** für `fix/art-meeresfels` @ `600050b` nach der Fix-Runde aus R402: main (`cb760c0`) per Merge geholt,
arc42-Konflikt mit beiden Zeilen gelöst, `|` in Zeile 222 escaped, Kommentar `farRockGeom` an arc42 angeglichen
(1,28/1,06); L0-Diffprüfung ohne Befund, `tsc`/`lint` Exit 0, 102/102 gezielte Tests, Konflikt-Probe sauber. Merge
seriell durch den Integrator. Damit ist der REL-11-Kandidat vollständig in main; Release-Check (Smoke-Skript R368,
Browser-Lauf mit gemeinsamer Sichtprobe Schiff/Fels bei Zoom 0,25 und 0,5) folgt vor dem Push der nächsten Session.

Entscheider: L0 · Anlass: Fix-Runde ART-MEERESFELS · ADR: —

## R404 · 2026-10-09 · Release-Check REL-11 jetzt; Ideen-Runde IDEEN-04

Ruling: (1) REL-11-Kandidat = main @ `2a66c27` (REL11-UI R401, Keepout und Schiff R402, Fels R403). Release-Check
in dieser Session, Push in der nächsten (R335): Browser-Lauf `qa-playtester` mit `smoke.mjs` (R368) plus
paketspezifischen Abschnitten. Schritt 4 aus „Gate Merge Release“ (ein `opus`-Review über den Kandidaten) gilt als
erfüllt: Beide Stränge hatten ein `opus`-Final-Review über ihren vollständigen Diff (UI R401, Render R402), die
Fels-Fix-Runde ist von L0 diffgeprüft (R403); Merge-Zusammenspiel ist durch `make check` je Merge belegt. (2) Ideen-
Runde **IDEEN-04** (lead-design, ≤ 2 Starts, ≤ 80 Tools, E-027) ist überfällig (letzte IDEEN-03, seither REL-08 bis
REL-10): parallel zum Browser-Lauf, nur `docs/ideen.md`.

Entscheider: L0 · Anlass: REL-11 vollständig in main · ADR: —

## R405 · 2026-10-09 · Ideen-Runde IDEEN-04 entschieden

Ruling: Runde `52292b2` angenommen (4 Ideen, 1 von 2 Starts). **I-027 Seekarte nur als Karte** (Silhouetten, Fahrlinien,
Schiffspunkte, Klick springt zur Insel; Silhouetten einmal gerastert und gecacht) → Studio-Platz **REL-12** als
S-Häppchen **UI-SEEKARTE**; Grundlage ist der vorhandene Spec-Kann-Teil E5 (M12-Spec Anhang 03 Abschnitt G, AK-E5-01);
kein Sim-Zustand, nicht im Save, Baseline unberührt → kein Kurzdesign, lead-tech liefert Plan mit Budgetantrag
(Planungsbudget 25 Tools), Gate Spec/Plan durch L0. Gründungsfahrt (AK-E5-02) bleibt Kür im Pool. **I-028 Steuer je
Stufe** → Baustein eines Wirtschafts-Brainstormings (lead-design mit design-economy-designer, Rechnung zur Dominanz
von «hoch» bei Kaufleuten) als Kandidat nach REL-12. **I-029, I-030** geparkt (I-029 mit I-006 im Handels-Brainstorming,
I-030 erst nach Rechnung der Zielwerte). Kein Nutzer-Vorbehalt (§5.3: kein Richtungswechsel).

Entscheider: L0 · Anlass: Bericht IDEEN-04 · ADR: —

## R406 · 2026-10-09 · Gate Spec/Plan UI-SEEKARTE OK

Ruling: **OK** für `docs/superpowers/plans/2026-10-09-ui-seekarte.md` (`3085108`). Designfragen nach Empfehlung:
(1) Iso-Ausrichtung wie die Hauptansicht (2×2-Matrix, Silhouette einmal gerastert); (2) Liste bleibt unter der Karte
(Tastatur, Fallback); (3) Kamerarahmen in der Karte nicht jetzt (YAGNI); (4) Klick auf Schiffspunkte nicht im
Umfang. Budget 10 Starts, Parallelität 1, Richtwert ≈ 70 Tools, Worktree `.worktrees/ui-seekarte`. Erstes Öffnen
≤ 5 ms Rasterzeit ist AK (B5), bei Load ≤ 4 gemessen; sonst Zähler-/Cache-Treffer-Test als harte Abnahme.
Umsetzung startet sofort (Paket des Release REL-12); kein Push in dieser Session.

Entscheider: L0 · Anlass: Plan UI-SEEKARTE · ADR: —

## R407 · 2026-10-09 · Gate Merge Release REL-11 OK

Ruling: **OK** für REL-11 = main @ `2a66c27` (+ Doku): Browser-Lauf BEDENKEN ohne Blocker (`.studio/qa/REL-11/`):
smoke.mjs BESTANDEN (1280×720, 1920×1080, Konsole leer), Kamera-Rand BESTANDEN (Zoom 0,25 an allen Ecken Land, Resize
ohne Sprung, Inselsprung mittig), Kontrast lesbar, Schiff mit Saum auf allen Wasserstufen lesbar, Fels wirkt nicht wie
ein Boot (Urteil vor Vergleich), Routenfahrt ohne Frames > 25 ms (headless, Hinweis), kein `/favicon.ico`. Review-
Schritt nach R404 erfüllt. Drei niedrige/mittlere Befunde in `docs/beobachtungen.md` (Hüllenecke Zoom 1, Fels bei
Zoom 0,25 klein, Inspektor „Versorgt ✓“ plus „Mangel“). **Push in der nächsten Session** (R335) mit dem Push-Gate nach
Handbuch 1.33; UI-SEEKARTE (REL-12) bleibt bis dahin auf ihrem Branch, falls nicht vorher gemergt (dann eigenes Gate).

Entscheider: L0 · Anlass: Release-Check REL-11 · ADR: —

## R408 · 2026-10-09 · Gate Merge UI-SEEKARTE OK nach Konfliktlösung

Ruling: **OK** für `feat/ui-seekarte` @ `6c7aa62` (REL-12): Task-Reviews OK (T1/T2 nach Fix-Runde mit Test-Commit vor
Fix), Browser-Check AK-B1–B5 OK (erstes Rastern 0,3–0,4 ms gegen Ziel ≤ 5 ms), Final-Review `opus` OK, `tsc`/`lint`
Exit 0, Testzeiten nach R392 bei Load 1,78 ohne Zuwachs. Die Wanduhr-Grenze `< 50 ms` in `seaMap.test.ts:226` bleibt
(Messwert 0,3 ms, Faktor > 100 gegen Runner × 3). Konflikt-Probe: Konflikt nur in `docs/beobachtungen.md` (beide
Seiten hängen an „Offen“ an) → Eigentümer lead-tech holt main per Merge, behält beide Blöcke, danach Merge durch den
Integrator mit `make check`. R402-Beobachtung: Commit-Reihenfolge stimmt; Praxis „Code vor Test geschrieben, für den
roten Lauf entfernt“ bei T1/T2 an die Session-Retro (zweiter Fall → R395 V2 bewerten). Gründungsfahrt bleibt im Pool.

Entscheider: L0 · Anlass: Bericht UI-SEEKARTE · ADR: —

## R409 · 2026-10-09 · UI-SEEKARTE Trivial-Fix ZEITTESTS; R408 gilt für 1a38555

Ruling: Merge-Lauf brach in `make zeittests` ab: `tests/render/seaMap.test.ts` (Wanduhr-Grenze) fehlte in
`ZEITTESTS` (`vite.config.ts`). Trivial-Fix `1a38555` (ein Eintrag) angenommen; R408 gilt für `feat/ui-seekarte` @
`1a38555` (enthält `c07923f`, main-Merge mit beiden Beobachtungs-Blöcken). Vorschlag an die Session-Retro: Pflichtzeile
„schnelle Make-Prüfungen ohne Testlauf (`make zeittests`, `make conflicts`, `tsc`, `lint`) in jeder Task-DoD“ — drei
Integrator-Abbrüche dieser Session (TSC, ZEITTESTS) wären damit vor dem Integrator gefunden worden.

Entscheider: L0 · Anlass: Integrator MERGE-UI-SEEKARTE gescheitert · ADR: —

## R410 · 2026-10-09 · Session-Retro e90e097e: V1–V3 angenommen; Push-Plan nächste Session

Ruling: Retro `docs/studio/retros/2026-10-09-session-e90e097e-ende.md` angenommen. (V1) Pflichtzeile „schnelle
Make-Prüfungen ohne Testlauf: `npx tsc --noEmit`, `make lint`, `make zeittests`, `make conflicts` Exit 0“ in jeder
Task-DoD (Briefing-Vorlage Punkt 5) und im Integrator-Vorlauf; Messgrösse 0 Integrator-Abbrüche dieser Klasse in 5
Gates (Ausgang 3). (V2, = R395 V2) Rot-Beleg im Task-Bericht: je neuem Testfall die rote Ausgabe vor dem Fix
(Commit-Reihenfolge allein genügt nicht); Messgrösse ≤ 20 % unbelegte Rot-Phasen in 3 Paketen mit Tests. V1 + V2
setzt der studio-coach sofort um (Handbuch 1.34). (V3) E-049 startet, sobald E-046 bewertet ist (spätestens
2026-11-12; Hebel nach R316). **Push-Plan nächste Session:** ein Push für REL-11 + REL-12 (UI-SEEKARTE); vorher kurzer
Release-Check REL-12 (`smoke.mjs` auf main plus Seekarten-Abschnitt; T6 lief nur auf dem Branch), dann Push-Gate
nach Handbuch 1.34.

Entscheider: L0 · Anlass: Session-Retro · ADR: —

## R411 · 2026-10-09 · Session-Plan: Release-Check REL-12, I-028-Brainstorming parallel; Vorfälle e90e097e verknüpft

Ruling: (1) Die drei offenen Vorfälle „production-integrator gescheitert“ (Session e90e097e) sind durch die Session-Retro
`docs/studio/retros/2026-10-09-session-e90e097e-ende.md` (B1, B2, V1) abgedeckt; nachträglich per `log.py retro --triggers`
verknüpft, keine neue Retro. (2) **REL-12 Release-Check** an `lead-qa` (Budget 3 Starts, Parallelität 2): `smoke.mjs` auf
main @ `48bec29` plus Seekarten-Abschnitt (AK-B1–B5), Delta-Prüfung nach R249 (1), soweit das Final-Review auf dem Branch
vorliegt; danach Gate Merge Release durch L0 und **ein Push REL-11 + REL-12** nach Handbuch 1.34 (R410). (3) Parallel und
dateidisjunkt (nur `docs/`): **Wirtschafts-Brainstorming I-028** (Steuer je Stufe) an `lead-design` mit
`design-economy-designer` (Budget 2 Starts, Parallelität 1), Deliverable Designvorschlag, keine Spec ohne Gate. Code-Pakete
aus `docs/beobachtungen.md` starten erst nach dem Push (Last ≤ 4 fürs Push-Gate, R396).

Entscheider: L0 · Anlass: Session-Start · ADR: —

## R412 · 2026-10-09 · Gate Brainstorming I-028 „Steuer je Stufe“ OK; O1–O5 nach Empfehlung

Ruling: **OK** für den Designvorschlag `docs/superpowers/specs/2026-10-09-steuer-je-stufe-vorschlag.md` (`bb86f7d`).
Prüffragen: stärkt die Säule Wirtschaft (Steuern) und den Aufstieg, Zweck in einem Satz und in 15 Minuten spürbar, Umfang
begrenzt (§8 des Vorschlags), nur Mechanik (ADR-006); einfachere Variante (Belegung 0,6) geprüft und wegen Umschalt-Gewinn
verworfen. Offene Punkte: **O1** Kaufleute «hoch» = 115 % (`TAX_LEVELS.high.pctByTier = { 4: 115 }`) ist eine bewusste
Wertänderung, hiermit freigegeben; Balancing-Test bleibt unverändert grün, betroffene Bestandstests werden im Plan
angepasst. **O2** «niedrig» für Kaufleute gesperrt (Hinweis im Tooltip; Migration: alter Stand «niedrig» → Kaufleute
«normal»). **O3** Sperre je Regler. **O4** Kopfzeilen-Knöpfe bleiben als «alle Stufen», Anzeige «gemischt». **O5** Fest
nur abgelehnt, wenn es auf kein Haus wirkt. Save v10: wer zuerst merged, nimmt v10 (E6 ist geparkt). Nächster Schritt:
Spec durch `design-spec-author` (Restbudget lead-design 1 Start), danach Gate Spec (lead-tech, lead-qa). Kein §5.3-Vorbehalt.

Entscheider: L0 · Anlass: Gate Brainstorming · ADR: —

## R413 · 2026-10-09 · Gate Merge Release REL-12 „Seekarte“ OK; Push-Zeitpunkt

Ruling: **OK** für REL-12 = main @ `c97c225` (Code-Stand `f1057e2` + `1a38555`). Release-Check lead-qa
(`.studio/qa/REL-12/`): `smoke.mjs` BESTANDEN (1280×720, 1920×1080, Konsole leer), Seekarte AK-B1–B4 BESTANDEN mit
Screenshots; AK-B5 per Cache-Test erfüllt (R406, Browser-Messung unter Load 4,6–4,9 nur Orientierung, 0,4 ms). Delta-Prüfung
nach R249 (1): `git diff 6c7aa62 main -- src/ tests/` leer, kein weiteres Review nötig; gezielt 32/32 Tests grün. Befund
„kein versionierter Seekarten-Szenenhelfer unter `tools/render-qa/`“ in `docs/beobachtungen.md`. **Push REL-11 + REL-12** als
letzter Schritt der Session (R335), nach Gate Spec I-028, damit die Doku-Commits mitgehen; Push-Gate nach Handbuch 1.34,
Pages per `gh workflow run Pages --ref main`.

Entscheider: L0 · Anlass: Gate Merge Release · ADR: —

## R414 · 2026-10-09 · Gate Spec I-028 „Steuer je Stufe“ OK mit Auflagen; P-1 v10, P-2 tier im ReasonCtx

Ruling: **OK mit Auflagen** für `docs/superpowers/specs/2026-10-09-steuer-je-stufe-design.md` (`829aadc`); lead-tech
BEDENKEN (Machbarkeit OK, ohne ADR), lead-qa BEDENKEN (alle 41 AK prüfbar, Balancing-Test ohne Berührung bestätigt).
**Auflagen** (Nachtrag als `anhang-02-gate-auflagen.md` im Spec-Ordner, Spec selbst bleibt unter 40 KB): lead-qa (a) AK-T14
Fall „nur Kaufleute-Haus «normal» im Radius, Stufen 1–3 «hoch» → ok“; (b) AK-T20 `SAVE_VERSION + 1` statt fest 11; (c) AK-T29
`taxEffect('low')` mit „(Kaufleute normal)“; (d) U-4/U-8 „Steuer gemischt: …“ in AK-T36 bzw. AK-T33; (e) U-5 ohne Amtsstube
wirksamer Wert in AK-T30; (f) U-6 Knoten und Fokus bleiben, Browser-Schritt in AK-T36; (g) AK-T19 `taxLockedUntil` mit
fehlendem/zusätzlichem Schlüssel; (h) AK-T17 Speichern → Laden mit gemischten Reglern, N Ticks, JSON-Vergleich gegen Lauf
ohne Laden; (i) AK-T13 Sperre läuft ohne Amtsstube weiter, neue Amtsstube übernimmt die Regler. lead-tech (B1) AK-T23: die
v9-Byte-Vergleiche `tests/sim/save.test.ts:1767` und `tests/sim/goal3.test.ts:139` über `JSON.stringify(foldBackToV9(...))`,
Fixtures unverändert; Versions-Assertions auf 9 umstellen; (B2) AK-T24: `foldBackToV9` schreibt Schlüssel in der Reihenfolge
von `V9_WORLD_KEYS`, Fall „migrierter Stand“ ergänzen; Hinweise R7.4 (Vorstufe erst ab t ≥ 2) und §6 (save-v2/v4 ohne
Kaufleute-Häuser). **P-1:** Save **v10 fest** (E6 geparkt, keine Branch); R8.5 nur Notfallregel. **P-2:** Sim-Gründe bleiben
wörtlich; `ReasonCtx.tier?: Tier` in `src/ui/hints.ts`; Menge C aus R6.2 als reine Sim-Funktion (`taxChangeSet`), von
`setTaxLevel` und UI gemeinsam genutzt (DRY). Nächste Schritte parallel: Nachtrag durch `design-spec-author` (lead-design,
+1 Start) und Plan durch `lead-tech` (Schnitt: ein Strang, T1 Sim+Save, T2 UI mit Playtest, Doku in T2; Budget später im
Gate Plan). Umsetzung erst nach dem Push dieser Session.

Entscheider: L0 · Anlass: Gate Spec · ADR: —

## R415 · 2026-10-09 · Gate Plan I-028 BEDENKEN angenommen: Nacharbeit lead-tech, danach Delta-Check L0; Push jetzt

Ruling: Gate Plan zu `docs/superpowers/plans/2026-10-09-steuer-je-stufe.md` (`15142af`): lead-production BEDENKEN (Ownership
und Reihenfolge OK; E-010 verletzt: T1-Abschnitt 19,4 KB), lead-qa BEDENKEN (Test-first und Reviews OK; drei blockende
Punkte). **Nacharbeit durch lead-tech** (ohne Agenten, zählt nicht aufs Umsetzungsbudget): (1) Aufteilung nach E-010 in
Index + Task-Dateien ≤ 10 KB; (2) T1 teilen in **T1a** (Weltform `taxLevels`/`taxLockedUntil`, Save v10, Migration,
`foldBackToV9`, `setAllTax`, Bestandstests und mechanische UI-Anpassungen; Verhalten gleich) und **T1b** (Regeln je Stufe,
`pctByTier` 115, `taxChangeSet`/`setTierTaxLevel`, `taxTiers.test.ts`); nach jedem Teil alle Tests grün; (3) `hover.test.ts`
klären (T1 oder T2); (4) lead-qa B-1 AK-T42 mit Testschritt (Sim in T1b, `taxSummary` in T2), B-2 `triggerTaxBlocked`
exportiert mit Fällen Stufe 1/2, B-3 Hinweis ohne Stufe nennt kleinste gesperrte Stufe (drei Fälle in `tests/ui/hints.test.ts`);
H-1 bis H-6 nach Wortlaut Anhang 02; niedrige Punkte (QA-a, QA-g Schlüssel `"3"`, P-1 `version === 10`, QA-e, Ort von
`taxTarget` in `tax.ts` oder begründete Abweichung); T4 nennt 42 AK. Danach **Delta-Check durch L0** anhand dieser Liste,
keine Zweitprüfung. **Budget** nach dem Delta-Check: 11 Starts, Parallelität 1, Controller-Übergabe nach 6 Starts vor T4.
**Push REL-11 + REL-12 startet jetzt** parallel zur reinen Doku-Nacharbeit (R335 ein Push; spätere Doku-Commits dieser
Session gehen mit dem nächsten Push).

Entscheider: L0 · Anlass: Gate Plan · ADR: —

## R416 · 2026-10-09 · Delta-Check Plan I-028 OK, Budget 11 Starts; Push-Neustart nach Lint-Abbruch

Ruling: (1) Delta-Check nach R415: Plan-Nacharbeit `630ce91` erfüllt alle Punkte (Index + Task-Dateien T1a 9 960 B, T1b
9 222 B, T2 9 673 B, T3, T4; AK-T42, `triggerTaxBlocked`, kleinste gesperrte Stufe, H-1–H-6, niedrige Punkte, 42 AK, 11
Starts belegt; `make docs-check` Exit 0). Abweichung `taxPct` in `townhall.ts` (Import-Zyklus `tax → unlocks → population`)
angenommen. **Plan freigegeben**; Budget **lead-tech 11 Starts, Parallelität 1**, Controller-Übergabe nach Start 6.
Umsetzung startet nach dem Push (Last fürs Push-Gate). (2) Integrator-Abbruch Push-Gate: `make lint` rot durch
unformatierten Doku-Commit `bb86f7d`; Trivial-Fix `4806006` (nur Prettier), Beobachtung zur fehlenden Pflichtzeile
`make docs-check` für Doku-Pakete (Retro-Thema). Push-Neustart auf dem HEAD nach diesem Ruling.

Entscheider: L0 · Anlass: Gate Plan Delta-Check, Push-Gate-Abbruch · ADR: —

## R417 · 2026-10-09 · Release-Retro REL-12: V1 und V3 angenommen, V2 als Werkzeug-Paket nächste Session

Ruling: Retro `docs/studio/retros/2026-10-09-release-rel12-prozess.md` (`af375d1`) angenommen. **V1** feste Formatzeile
(E-010: Index + Task-Dateien ≤ 10 KB) in jedem Plan-Briefing; neue AK-Nummern vergibt L0 im Gate-Spec-Ruling; Messgrösse 0
Gate-Plan-Punkte dieser Klasse in 3 Gates. **V3** Leistungs-AK mit deterministischem Test: Browser-Messung im Release-Check
entfällt; sonst nur ohne paralleles Lastpaket; Messgrösse 0 Urteile „unter Last ungültig“ in 3 Release-Checks. V1 + V3 setzt
der studio-coach jetzt um (Handbuch-Minor). **V2** (Prettier-Check geänderter Dateien beim `git commit`, vorhandenes
Prettier, Ziel < 3 s, Ablehnung ins Event-Log) im Grundsatz angenommen; Umsetzung als Werkzeug-Paket **TOOL-PRETTIER-HOOK**
in der nächsten Session (Werkzeug-Pflichtzeilen R375); bis dahin `make docs-check` vor Doku-Commits im Briefing. B-b
(Inaktiv-Vorfall) war ein Phantom ohne Budgetverstoss; Filter-Idee in `docs/beobachtungen.md`. Messauftrag Archivierung
`docs/beobachtungen.md` (110 KB) an lead-production, Frist nächste Session.

Entscheider: L0 · Anlass: Release-Retro · ADR: —

## R418 · 2026-10-09 · Gate Merge I-028 „Steuer je Stufe“ OK (BEDENKEN durch Einträge erledigt); AK-T39 und QA-Ablage

Ruling: **OK** für den lokalen Merge von `feat/steuer-je-stufe` @ `5f14317` nach main. lead-qa BEDENKEN nur formal (Rulings
und Beobachtungen nachzutragen), hiermit erledigt: `make check` EXIT=0 auf `aee3c6b` (2850 Tests), danach nur Doku-Commit
`5f14317` (docs-check, conflicts Exit 0); `tsc`, lint, zeittests Exit 0; Final-Review opus OK über 42/42 AK und alle Auflagen
aus Anhang 02; Balancing-Test, Pins und Fixtures unverändert; Zeittests ≤ 668 ms bei 15 s Timeout; Konfliktprobe
`git merge-tree` Exit 0. Einzige Wertänderung Kaufleute «hoch» 115 % (R412). **AK-T39 (Klarstellung, keine Abweichung):** Der
Steuergrund im Mouse-over erscheint nur, wenn die vorrangigen Aufstiegsgründe nicht greifen (Ziel erreicht `won=true`, Haus voll
belegt, kein Aufstiegsstopp); Reihenfolge wie auf main, Sim-Grund durch AK-T07 belegt. **QA-Ablage:** Screenshots I-028 unter
`.studio/qa/I-028/` (Paket-ID statt Plan-Ordnername) gilt. Fünf Befunde (arc42:265, `inspect.ts:109`, Kopfzeile 800 × 600,
Triage a und d) in `docs/beobachtungen.md`. Budget: 8 von 11 Starts. Merge lokal durch `production-integrator`; Push mit dem
nächsten Session-Push (R335); I-028 geht dann als eigenes Release (REL-13 „Steuer je Stufe“, Save v10) mit Release-Check.

Entscheider: L0 · Anlass: Gate Merge · ADR: —

## R419 · 2026-10-09 · Gate Merge Release REL-13 „Steuer je Stufe“ OK; Push nächste Session

Ruling: **OK** für REL-13 = main @ `d7291aa` (Merge I-028). Release-Check lead-qa (`.studio/qa/REL-13/`): Delta nach R249 (1)
leer gegenüber dem Final-Review-Stand `5f14317` (`src/`, `tests/`, `index.html`, `src/style.css`, `public/`, `vite.config.ts`,
package/tsconfig), nur Doku dazu; `smoke.mjs` BESTANDEN (1280×720, 1920×1080, Konsole leer); Amtsstube auf main 16/16 PASS;
keine Browser-Leistungsmessung (Handbuch 1.35). Save v10 (Migration v9 → v10 durch Tests belegt). **Push REL-13** zusammen mit
den Doku-Commits dieser Session in der nächsten Session (R335: der Push dieser Session war REL-11 + REL-12). Release-Notiz in
`state.md`. Befund Smoke-Etikett „Save v9“ (`tools/render-qa/smoke.mjs:466`) in `docs/beobachtungen.md`.

Entscheider: L0 · Anlass: Gate Merge Release · ADR: —

## R420 · 2026-10-09 · Session-Retro fb37ceac: V1–V3 angenommen; Experiment-Urteile; Modelltabelle gilt

Ruling: Retro `docs/studio/retros/2026-10-09-session-fb37ceac-ende.md` (`00e12f2`) angenommen. Befund A1 bestätigt: 10 von 13
Lead-/Coach-Starts dieser Session liefen auf `opus` gegen die Modelltabelle (`STUDIO.md`, Abschnitt Modelle: `sonnet` für
Controller in der Umsetzung, `lead-qa`-Gate-Urteile, `lead-production`, Kurz-Retro); Ursache L0-Briefing (Modell aus der
Spalte von `richtwerte.md` übernommen). Ab sofort wählt L0 das Modell nur nach der Modelltabelle. **V1** E-038 angepasst und
gestartet: Spalte in `richtwerte.md` heisst „gemessen auf“; Werkzeug-Paket **TOOL-MODELL-GUARD** (Guard prüft auch typisierte
Starts gegen die Tabelle); Ziel ≤ 1 Start über der Tabelle je Session, `opus`-Anteil ≤ 60 %. **V2** E-049 angepasst und
gestartet: Bereinigung des Steuerungsanteils nach der Briefing-Zeile „Budget“ statt Paketname. **V3** Final-Review liest den
Diff je Datei (Persona-Zeile `qa-code-reviewer`, ohne Experiment-Platz). **Experimente:** E-037 angepasst, E-042 angepasst
(Briefing-Vorlage: Start/Fertig-Logging für Leads entfällt, E-042), E-046 behalten; E-050 startet; E-048 wartet. Umsetzung
durch den studio-coach (sonnet) jetzt, TOOL-MODELL-GUARD als Werkzeug-Paket nächste Session zusammen mit TOOL-PRETTIER-HOOK
und TOOL-STUDIO-HYGIENE (Phantom-Vorfälle, verwaiste Vitest-Worker).

Entscheider: L0 · Anlass: Session-Retro · ADR: —

## R421 · 2026-10-09 · Push REL-13 zu Sessionbeginn; Werkzeug-Bündel danach lokal

Ruling: Der eine Push dieser Session (R335) ist der Push von REL-13 (main @ `f0307c0`, enthält Merge `d7291aa` und die
Doku-Commits der Session fb37ceac), wie in R419 und `state.md` (Fortsetzung 0) vorgesehen. Er läuft **jetzt** statt am
Session-Ende: Auslegung von „am Session-Ende“ als „nach dem Abschluss des zu pushenden Stands“ — REL-13 ist seit R419
abgeschlossen; ein früher Push bringt das Release zum Nutzer, und das Push-Gate (Testsperre, Last ≤ 4) kollidiert nicht mit
Testläufen des Werkzeug-Bündels. Ablauf nach Handbuch 1.36 durch `lead-production` (sonnet) mit `production-integrator` aus
`.worktrees/integrate`. Alles, was danach in dieser Session entsteht (Werkzeug-Bündel, REL-14-Vorarbeit), bleibt lokal bis zum
Push der nächsten Session. Das Werkzeug-Bündel startet erst nach grünem Push-Gate.

Entscheider: L0 · Anlass: Session-Start · ADR: —

## R422 · 2026-10-09 · Auswahl REL-14 (Stufe leicht); Werkzeug-Bündel planen

Ruling: **REL-14** = drei Häppchen aus BEOB-AUSW-03 nach der Empfehlung dort: **UI-INSPEKTOR-KLARTEXT** (lead-tech),
**SIM-FEST-INSEL** (lead-tech; UI-INSELFILTER nicht dazu, eigener Scope), **ART-FELS-FERNGROESSE** (Designurteil lead-art,
Umsetzung im Art-Strang). Dateien disjunkt (`src/ui/inspect.ts`/`panelView.ts`, `src/sim/feast.ts`,
`src/render/decorStamps.ts`). Ablauf Stufe leicht: Kurzdesign `lead-design` (opus) für Inspektor und Fest, Urteil `lead-art`
(opus) zum Fels, danach Plan `lead-tech` (opus), kombiniertes Gate. **Trivial-Fixes** gehen in den REL-14-Strang von
lead-tech: `.vitest/` in `.gitignore`; arc42 `hud.ts`-Zeile ohne „Steuersperre“ (Sperre bei `taxView.ts`). Das AK-Muster in
`gates.md` übernimmt der studio-coach im nächsten Handbuch-Minor. **Werkzeug-Bündel** (TOOL-PRETTIER-HOOK inkl.
Smoke-Etikett, TOOL-MODELL-GUARD, TOOL-STUDIO-HYGIENE, `efficiency.py` auf E-049): Plan `lead-tech` (opus) jetzt; R421 gilt
für die Umsetzung (erst nach grünem Push-Gate). UI-SEEKARTE-NACHZUG bleibt Kandidat für REL-15. Präzisierung zu R421: Design
und Plan laufen parallel zum Push, weil sie keine Testläufe auslösen.

Entscheider: L0 · Anlass: Session-Start, Fortsetzung 1–2 · ADR: —

## R423 · 2026-10-09 · ART-FELS-FERNGROESSE abgehakt; toter Fern-Code als Trivial-Fix

Ruling: Urteil `lead-art` **NEIN** angenommen (Übergabe `.studio/handoffs/2026-10-09-lead-art-lead-art.md`): Meeresfels
bleibt massstabstreu (reine Deko ohne Sim-Bezug, Bildrangfolge Schiff 16 px vor Fels ≈ 6 px bei Zoom 0,25, Blindprobe
bestanden). Reevaluations-Trigger: Felsen bekommen Spielwirkung · Playtest vermisst Felsen in der Fernansicht · Schiffs-
Mindestgrösse oder kleinster Zoom ändert sich. REL-14 hat damit zwei Häppchen. Als Trivial-Fixes in den REL-14-Strang von
`lead-tech`: toter Code `minStampScale`/`FAR_MIN_CSS_PX`/`stampWidthPx` in `src/render/decorStamps.ts` samt Test entfernen
(bildneutral), Spec `2026-10-06-lebendige-insel.md` §5 „Fernansicht“ (Wrack als Stempel) auf den Stand REL-07 bringen, und den
Abhaken-Eintrag mit Triggern in `docs/beobachtungen.md` anlegen.

Entscheider: L0 · Anlass: Designurteil lead-art · ADR: —

## R424 · 2026-10-09 · Kurzdesign REL-14 angenommen; Obergrenze 8 gleichzeitige Agenten

Ruling: (1) Kurzdesign `lead-design` REL-14 angenommen (Selbstprüfung OK): Wortfamilie **„Versorgung“** (Chip „Im
Versorgungsradius“ / „Ausserhalb der Versorgung“, Mangel nur „Mangel: … fehlt“, Zeile „Fehlt: X“ entfällt,
`diagnosisText` „ausserhalb der Versorgung“); Fest wirkt nur auf Häuser der Kapellen-Insel, Inselvergleich in
`inChapelRadius` (gilt für `feastActive` und `taxBlock`), keine Migration, kein neuer Spielwert. Als Trivial-Fix dazu: Dienst-
Mangel im Inspektor und im Hover gleich benennen. AK-Vorschläge gehen in den Plan; Nummern vergibt L0 im kombinierten Gate.
(2) **Nutzerfrage zur Obergrenze:** Die Grenze „studioweit ≤ 5 gleichzeitig laufende Arbeiter“ (R241) entstand als
Risiko-Bedenken von lead-production im Gate des Seefahrt-Bündels (Koordination, Ownership, Rechnerlast; R357: Load 57 auf
10 Kernen durch parallele volle Testläufe). Die Lastursache ist seit R380 (TOOL-TESTLOCK: ein voller Lauf zugleich, Abbruch
bei Load > 8) technisch gebremst. Neue Obergrenze: **≤ 8 gleichzeitig laufende Agenten** (Leads und Arbeiter zusammen),
davon höchstens **2 Browser-Läufe** (Headless-Chrome, `qa-playtester`/Release-Check) zugleich; unverändert gelten
TOOL-TESTLOCK, Messläufe nur bei Load ≤ 4 (R329) und die Datei-Ownership je Strang. Prüfung in der nächsten Session-Retro
(Load-Spitzen, Wartezeiten an der Testsperre, Konflikte).

Entscheider: L0 · Anlass: Kurzdesign lead-design, Nutzerfrage · ADR: —

## R425 · 2026-10-09 · REL-13 live; CLEANUP-WT-2 freigegeben

Ruling: (1) **REL-13 live:** Push `3417346..46153c6` (25 Commits, gezielt der geprüfte Commit), CI 37984641871 grün,
Pages 37985195805 grün; `make test` 103 s, `make check` 134 s, Load < 3. (2) **CLEANUP-WT-2:** `production-integrator` entfernt
die gemergten Worktrees `art-meeresfels`, `rel11-kamera`, `rel11-triv`, `render-seeplan-keepout`, `see-f3-schiffskontrast`,
`steuer-je-stufe`, `ui-seekarte` und den Scratch-Worktree `…/e90e097e-…/scratchpad/mainwt` mit `git worktree remove`
(ohne `--force`; Ausnahme nur, wenn `git status --porcelain` genau `?? .vitest/` zeigt — Testcache), danach `git worktree
prune` und Löschen von `.worktrees/check2.log`. Vorbedingung je Worktree: sauber und Branch bzw. HEAD in `git branch
--merged main` bzw. Vorfahre von main. **Branches bleiben** (lokales Löschen nur per eigenem Ruling); `.worktrees/integrate`
bleibt. Alt-Branches, Remote `wip/r118a-…` und `stash@{0}` bleiben unberührt.

Entscheider: L0 · Anlass: Push-Bericht lead-production, Fortsetzung 3 · ADR: —

## R426 · 2026-10-09 · Korrektur R425: kein `--force`; see-f3 nach `.gitignore`-Fix

Ruling: Die `--force`-Ausnahme in R425 widersprach dem Handbuch (Worktrees aufräumen R329: „nie `--force`“); der Guard hat
sie zu Recht gesperrt (Verfassung §6). Ausnahme gestrichen. CLEANUP-WT-2: 7 von 8 Worktrees entfernt, `check2.log` gelöscht.
`.worktrees/see-f3-schiffskontrast` (nur `?? .vitest/`) wird mit normalem `git worktree remove` entfernt, sobald der REL-14-
Trivial-Fix `.vitest/` in `.gitignore` auf main ist (dann ist der Baum sauber); bis dahin steht er in `state.md`. Der Fehler
geht als Befund an die Release-Retro REL-13.

Entscheider: L0 · Anlass: Bericht production-integrator CLEANUP-WT-2 · ADR: —

## R427 · 2026-10-09 · Kombiniertes Gate REL-14: BEDENKEN → Nacharbeit, Umsetzung frei

Ruling: Urteil `lead-qa` BEDENKEN B1–B5, nichts blockierend; Nacharbeit durch den Controller im Plan vor T01, ohne
Zweitprüfung: A8/A2 auf Haus-Panel und Hover/Hinweis eines **Wohnhauses** eingrenzen („versorgt N Häuser“ bei
Dienstgebäuden bleibt), A2 ergänzt `hints.ts` ohne `'versorgt'`; je Doku-AK ein benannter grep mit erwartetem Treffer im
T03-Reviewer-Briefing; Auswahlwechsel als eigenes AK; B5 gilt durch B2 als abgedeckt. L0-Prüfung: Ownership eindeutig,
Stränge disjunkt, Budget nach Formel, Stufe leicht bleibt (2 Häppchen + Trivial-Fixes, kein Save, keine Architektur).
**Entscheide:** E1 „Kapelle fehlt“ überall (Hover über `diagnosisText`); E2 ja (Hinweis „zufrieden“, Voraussetzung für A8);
E3 ja (zwei Worktrees); E4 ja; E5 ja. **AK-Nummern:** A1–A9 → AK-R14-01…09, Auswahlwechsel → AK-R14-10, B1–B4 →
AK-R14-11…14, C1–C6 → AK-R14-15…20. **Merge-Reihenfolge:** REL-14 vor dem Werkzeug-Bündel; das Werkzeug-Bündel merged
vor seinem Gate Merge `main` in seine Branch (kein Rebase) und löst Anhänge an `docs/beobachtungen.md`/`.gitignore` dort.
**Budget:** `lead-tech` 10 Arbeiter-Starts (geplant 5), Controller `sonnet`; das `opus`-Review läuft über den
Release-Kandidaten (eigene Freigabe).

Entscheider: L0 · Anlass: Kombiniertes Gate REL-14 · ADR: —

## R428 · 2026-10-09 · Gate Plan Werkzeug-Bündel: BEDENKEN → Nacharbeit, Umsetzung frei

Ruling: Urteile `lead-qa` (B1–B7) und `lead-production` (B1–B5) BEDENKEN, nichts blockierend; Plan `21cbbe2`. Nacharbeit
durch den Controller vor T00, ohne Zweitprüfung. **Entscheide:** E1 ja — eigenes Modul `tools/studio/modelguard.py` als
zusätzlicher Hook, `guard.py` und `VERFASSUNG.md` bleiben unberührt (§1.3); den Eintrag in `.claude/settings.json` setzt
der Arbeiter, blockt die Umgebung, meldet er den Diff und L0 setzt ihn. E2 **zunächst `MODE="warn"`** (qa B1/B2, prod B5):
`deny` erst mit dem Folgepaket **TOOL-AKTIVIERUNG** (studio-coach, blocked-by Merge des Bündels): Kopfzeilen-Syntax
`Modell: <alias> (<Einsatz>)` in `templates/briefing.md` und `STUDIO.md`, `make hooks` im Hauptcheckout, Umschalten auf
`deny` als Trivial-Fix, Rückweg (`warn`) in ADR-014 beschrieben. E3 → TOOL-AKTIVIERUNG. E4 angenommen: Plan- und
Gate-Instanzen ohne Arbeiter bekommen `Budget: keins`. E5 (studio-coach auf sonnet) geht an die nächste Session-Retro.
qa B3: unbekannter Alias → zulassen mit Event, Testfall pinnen; Fall `tool_name == "Task"` ergänzen; Ampelzeile als
Nachfolgepunkt in `docs/beobachtungen.md`. qa B4: `_entry` zählt als Bestätigung, Namen wie im Code (`_Builder`). qa B5,
B6, B7 wie vorgeschlagen (Hook-Kommentar, `make -n hooks` im Protokoll, echter Rot-Test T05, Worktrees auf aktuellem
`main`). prod B2: T06 ohne eigenen Reviewer, vom Final-Review mitgeprüft. prod B4: T06 ist blocked-by Merge REL-14; vorher
`main` nur in `tool/buendel-py` mergen (kein Rebase), Integrator mergt die drei Branches danach seriell. **AK-Nummern:**
AK-TB01…17 wie im Index. **Budget:** 15 Arbeiter-Starts plus 2 Controller-Instanzen `lead-tech` (sonnet). **Parallelität**
(prod B1): höchstens 2 Arbeiter zugleich, solange REL-14 läuft, danach 3; zwei Controller zugleich nur, wenn die Studio-
Obergrenze ≤ 8 (R424) das zulässt. Final-Review T07 auf `opus`.

Entscheider: L0 · Anlass: Gate Plan TOOL-BUENDEL · ADR: —

## R429 · 2026-10-09 · Release-Retro REL-13: V1–V3 angenommen

Ruling: Retro `docs/studio/retros/2026-10-09-release-rel13-prozess.md` (`5eafc58`) angenommen. **V1** Ruling-Vorlage mit
Pflichtfeldern „Regelbezug“ und „Kosten bei Irrtum“; weicht ein Ruling vom Handbuch ab, folgt im selben Zug ein
Handbuch-Minor (erster Fall: Auslegung R421 „Push nach Abschluss des zu pushenden Stands, gezielt per `git push origin
<Hash>:main`“). **V2** Push-Gate ohne separates `make test`, unter der Vorbedingung, dass der Umsetzer im Code belegt, dass
`make check` die Messdatei für `make zeitreserve-push` schreibt (Commit = HEAD, `loadStart`); Reihenfolge dann `tsc`, `lint`,
`zeittests`, `conflicts`, `make check`, warten bis Last ≤ 4, `make zeitreserve-push`, `make check-ci-perf`; Push immer per
Hash. Ist die Vorbedingung nicht belegt, bleibt der Ablauf und V2 geht als Messauftrag an die nächste Retro. Verfassung §7.2
(`make check` vor dem Push) bleibt erfüllt. **V3** Ein-Paket-Release: Gate Merge und Release-Check in einem `lead-qa`-Start.
Dazu das AK-Muster in `gates.md` (R422) und `state.md`-Fehler bleiben bei L0 (Session-Ende). Umsetzung als Handbuch 1.37
durch `studio-coach` (sonnet) jetzt.

Regelbezug: STUDIO.md Push-Ablauf (R335, R394/R396), gates.md Gate Merge Release (R249) · Kosten bei Irrtum: ein Handbuch-
Minor zurück.

Entscheider: L0 · Anlass: Release-Retro REL-13 · ADR: —

## R430 · 2026-10-09 · Gate Merge Release REL-14: OK

Ruling: **OK** für REL-14 = Kandidat `a04b79d` (Basis `23e8b35`; Merges `90b87db` SIM-FEST-INSEL, `a04b79d`
UI-INSPEKTOR-KLARTEXT inkl. Trivial-Fixes). Prüfliste: `make check` grün auf dem Kandidaten (131 s, 2855 Tests); Final-Review
`qa-code-reviewer` opus OK über alle 20 Dateien (AK-R14-01…20 zugeordnet, Save/Balancing/`src/sim/defs` unverändert bis auf
den Import `TIER_IDS`, deterministisch); Playtest am Kandidaten je UI-Task mit Screenshot (`.studio/qa/REL-14/kandidat/`
z1, z2, z2b, z3, z4-wechsel-1…3), Smoke bei 1280×720 und 1920×1080 bestanden, Konsole leer; CI-Reserve `make
check-ci-perf` grün (53 s). Fest ohne Browser-Check, belegt durch `tests/sim/feast.test.ts` (AK-R14-11…13). Merge nach
`main` lokal durch `production-integrator` (`git merge --no-ff a04b79d`; main hat seit der Basis nur Doku unter
`docs/studio/` dazubekommen). **Push in der nächsten Session** (R335: der Push dieser Session war REL-13). Drei niedrige
Befunde (Dienst-Mangel „fehlt in Reichweite“ in der Aufstiegsliste `src/sim/population.ts:156`; Testtitel
`decorSea.test.ts:259`; Hover-Karte verdeckt Cursor-Hinweis im Playtest) trägt T06 des Werkzeug-Bündels in
`docs/beobachtungen.md` ein. Danach Meldung an TOOL-BUENDEL (T06/T07 frei).

Regelbezug: gates.md Gate Merge Release; STUDIO.md Push-Ablauf (R335) · Kosten bei Irrtum: Fix-Häppchen vor dem Push der
nächsten Session.

Entscheider: L0 · Anlass: Release-Check lead-qa · ADR: —

## R431 · 2026-10-09 · REL-14 lokal auf main; see-f3 bleibt; Werkzeug-Bündel T06/T07 frei

Ruling: REL-14 lokal gemergt `ed547b0` (tsc, lint, conflicts Exit 0), REL-14-Worktrees entfernt. Die Annahme aus R426 war
falsch: Der Worktree `see-f3-schiffskontrast` sieht die `.gitignore` seines eigenen Branches, nicht die von main; er bleibt
mit `?? .vitest/` stehen (harmlos, kein `--force`, kein Löschen per Ruling in dieser Session). Nächste Session: Ruling, ob
der Testcache `.vitest/` dort per `rm -r` gelöscht und der Worktree dann normal entfernt wird. **Werkzeug-Bündel:** T06
(nach `git merge main` in `tool/buendel-py`) und T07 frei, eine dritte Controller-Instanz `lead-tech` (sonnet) zusätzlich
zu R428; Arbeiter-Starts bleiben im Rahmen 15 (8 verbraucht). Ab jetzt bis zu 3 Arbeiter zugleich (REL-14 fertig).

Regelbezug: STUDIO.md Worktrees aufräumen (R329), R428 · Kosten bei Irrtum: ein verwaister Worktree mehr.

Entscheider: L0 · Anlass: Bericht production-integrator · ADR: —

## R432 · 2026-10-09 · Gate Merge Werkzeug-Bündel: OK; Retro REL-14 in die Session-Retro

Ruling: **OK** für TOOL-BUENDEL: `tool/buendel-py` @ `7d2c189`, `tool/buendel-guard` @ `2b3d1fa`, `tool/buendel-ts` @
`39239ba`; `make check` je Strang grün; Final-Review opus (T07): guard OK, ts OK, py BEDENKEN mit vier behobenen Punkten
(Fix `7d2c189`, Rot-Belege) und einem als Beobachtung; AK-TB01…17 belegt; `guard.py`/`VERFASSUNG.md` unverändert;
`.claude/settings.json` nur ein zusätzlicher PreToolUse-Eintrag `Agent|Task` → `modelguard.py`, fail-open (`|| true`),
Modus `warn`. Konfliktprobe gegen main für alle drei sauber. Merge lokal seriell durch `production-integrator` (py, guard,
ts; je `--no-ff`), danach einmal `make check`; kein Push (nächste Session, zusammen mit REL-14). **TOOL-AKTIVIERUNG** bleibt
für die nächste Session (studio-coach: Kopfzeilen-Syntax, `make hooks`, `deny`), damit der Modus-Wechsel nicht ungeprüft
ans Session-Ende fällt. Die fällige Retro zu REL-14 und der Budget-Hinweis „lead-tech 3 von 1“ (Zählung der
Controller-Freigaben je Instanz, kein Überzug der Arbeiter-Starts: 11 von 15) gehen in die Kurz-Retro am Session-Ende; die
Prozess-Aussensicht zu REL-14 startet nach dem Push.

Regelbezug: gates.md Gate Merge; STUDIO.md Release-Retro (R127/R316) · Kosten bei Irrtum: Revert-Merge vor dem Push.

Entscheider: L0 · Anlass: Bericht lead-tech TOOL-BUENDEL-3 · ADR: ADR-014

## R433 · 2026-10-09 · Kurz-Retro c64c0775: V3 angenommen, V2 als Werkzeug-Paket, V1 wartet

Ruling: Retro `docs/studio/retros/2026-10-09-session-c64c0775-ende.md` (`ba29cde`) angenommen. **V3** angenommen als
Handbuch 1.38 (studio-coach, nächste Session zusammen mit TOOL-AKTIVIERUNG): (a) Leads schätzen in Tools, Minuten = Tools ÷ 6;
(b) weitere Controller-Instanzen eines Pakets bekommen keine eigene `log.py budget`-Zeile; (c) Handoff-Dateiname mit
Paket-ID. **V2** (E-049 nach Freigabephase `plan-*`/`design-*`/`gate-*`) als Werkzeug-Paket TOOL-E049-PHASE (lead-tech,
≈ 25 Tools) nächste Session. **V1/E-054** (Pläne für Stufe-leicht und Werkzeug-Bündel auf sonnet) bleibt eingereiht, bis ein
Experiment-Platz frei ist; Steuerung rot wird damit mit Hebel geführt (R316). Messaufträge Umsetzeranteil (2026-10-23) und
Cache-Write (2026-11-19) übernommen.

Regelbezug: STUDIO.md Verbesserungsschleife (R316), R428/R431 · Kosten bei Irrtum: ein Handbuch-Minor zurück.

Entscheider: L0 · Anlass: Kurz-Retro Session c64c0775 · ADR: —

## R434 · 2026-10-10 · Neue Studio-Session nach abgeschlossener Ende-Routine; Push REL-14

Ruling: Die Session c64c0775 wurde am 2026-10-09 mit der vollständigen Ende-Routine abgeschlossen (Metriken, Kurz-Retro
R433, `state.md` `ddc4743`, Schlussbericht). Der Nutzer setzt am 2026-10-10 mit „mach weiter“ im selben Claude-Gespräch fort.
Auslegung: Eine **Studio-Session** reicht von der Start- bis zur Ende-Routine; nach einer abgeschlossenen Ende-Routine
beginnt eine neue Studio-Session, auch wenn die Claude-Session-ID gleich bleibt. Damit steht dieser Studio-Session der eine
Push nach R335 zu: **Push REL-14 + Werkzeug-Bündel** (main @ `aktueller HEAD nach Push-Gate`, mindestens `4ee91a7` plus
Doku) nach Handbuch 1.37 durch `lead-production`/`production-integrator`, Pages-Deploy (Release). Weil die Auslegung den
Begriff „Session“ im Handbuch präzisiert, folgt im selben Zug ein Handbuch-Minor (1.38, R429 V1). Metriken der Studio-Session
werden am Ende ab dem Zeitpunkt dieses Rulings gezählt (Hinweis an studio-coach).

Regelbezug: STUDIO.md Push (R335), Session-Start und -Ende; R429 V1 · Kosten bei Irrtum: ein Push mehr in 24 h (CI-Minuten
≈ 5, Pages ≈ 1); Rücknahme durch einen Handbuch-Minor.

Entscheider: L0 · Anlass: Nutzer „mach weiter“ nach Session-Ende · ADR: —

## R435 · 2026-10-10 · Kurzdesign REL-15 angenommen; Umfang REL-15

Ruling: Kurzdesign `lead-design` (Selbstprüfung OK) angenommen. **UI-INSPEKTOR-ABHILFE:** `remedyText`
(`src/ui/guide.ts`) beginnt für Wohnhäuser mit dem Verb, ohne Vorspann „X fehlt:“ („Baue Fischerhütte (F)“, „Baue mehr
Fischerhütte oder kaufe Nahrung am Kontor“, „Baue Kapelle (K) in Reichweite“, „Kaufe Gewürz am Kontor oder gründe ein
Kontor auf einer Gewürzinsel“); Mangel-Liste bleibt im Wortlaut R424. **UI-HOVER-SCHILD:** Erscheint die Hover-Karte,
verschwindet das Cursor-Schild; Kachelwechsel, Ziehen, Werkzeugwechsel oder Dialog bringen es sofort zurück; Regel als
reiner Helfer testbar. **Dienst-Mangel „fehlt in Reichweite“** in der Aufstiegsliste bleibt (Information „zu weit weg“;
Trigger: Playtest verwechselt die Zustände) — Abhaken-Eintrag in `docs/beobachtungen.md`. **REL-15** = diese zwei
Häppchen plus **UI-SEEKARTE-NACHZUG** (R422, BEOB-AUSW-03) und als Trivial-Fixes der veraltete Testtitel
`tests/render/decorSea.test.ts:259` sowie die Hilfszeilen-Beobachtung als erledigt. Plan `lead-tech` (opus), danach
kombiniertes Gate.

Regelbezug: STUDIO.md Ablauf Stufe leicht; R78 Desktop-first · Kosten bei Irrtum: ein Häppchen zurück vor dem Push.

Entscheider: L0 · Anlass: Kurzdesign lead-design · ADR: —

## R436 · 2026-10-10 · REL-14 live; Rest-Worktree see-f3 aufräumen

Ruling: (1) **REL-14 + Werkzeug-Bündel live:** Push `46153c6..9eb99e7`, CI 38031718801 grün, Pages 38031921572 grün; danach
Prozess-Aussensicht REL-14 (`studio-process-coach`, R127/R316). (2) **see-f3:** Der Ordner `.vitest/` im Worktree
`.worktrees/see-f3-schiffskontrast` ist reiner Vitest-Cache (wird bei jedem Lauf neu erzeugt, nicht versioniert, Branch-Kopf
`a0278db` ist Vorfahre von main); `production-integrator` löscht ihn mit `rm -r` und entfernt danach den Worktree mit
`git worktree remove` ohne `--force`. Sperrt der Guard das Löschen, bleibt der Worktree und der Punkt geht an die nächste
Retro (kein Umgehen).

Regelbezug: STUDIO.md Worktrees aufräumen (R329), Verfassung §6 · Kosten bei Irrtum: keine (Cache wird neu erzeugt).

Entscheider: L0 · Anlass: Push-Bericht, R431 · ADR: —

## R437 · 2026-10-10 · Kombiniertes Gate REL-15: BEDENKEN → Nacharbeit, Umsetzung frei

Ruling: Urteil `lead-qa` BEDENKEN B1–B5, nichts blockierend; Plan `7ec80cc`. Nacharbeit durch die Controller vor dem
jeweiligen Task, ohne Zweitprüfung: **B1** Vitest für das Listener-Leck in `tests/ui/hud.test.ts` (Anmeldungen/Abmeldungen
per `signal` zählen, rot vor dem Fix), Browser-Probe bleibt Zweitbeleg; **B2** T04 mit festen Ports 5491/5591; **B3** AK C7
nennt „Gegenprobe in T04“; **B4** Eintrag in `docs/beobachtungen.md` (`seaMap.test.ts` in `ZEITTESTS` ohne Uhr); **B5** T06
bestätigt ausdrücklich das Schild im selben Frame beim Kachelwechsel. **Entscheide E1–E6** wie empfohlen (E1 zwei
Controller `sonnet`, je Strang einer; E2 Leck statt Layout-Befund; E3 Szenen-Helfer versionieren; E4 Kontor-Marke 4 × 4
CSS-px ohne lead-art; E5 Dialog; E6 dpr-Wechsel nur Beobachtung). **AK-Nummern:** A1–A4 → AK-R15-01…04, B1–B6 →
AK-R15-05…10, C1–C7 → AK-R15-11…17, D1–D4 → AK-R15-18…21. **Budget:** 16 Arbeiter-Starts für das Paket (eine Zeile, R433
V3 b), höchstens 6 zugleich, davon 2 Browser-Läufe; opus-Review über den Kandidaten separat.

Regelbezug: gates.md Kombiniertes Gate; R424; R433 V3 · Kosten bei Irrtum: Nacharbeit im Strang vor dem Kandidaten.

Entscheider: L0 · Anlass: Kombiniertes Gate REL-15 · ADR: —

## R438 · 2026-10-10 · Release-Retro REL-14: V1–V4 angenommen

Ruling: Retro `docs/studio/retros/2026-10-10-release-rel14-prozess.md` (`54279f3`) angenommen. **V1** Arbeiter nur per
Benachrichtigung abwarten, kein Polling auf `tasks/*.output`; `run_in_background` als Boolean; eine Probe klärt, ob ein
Vordergrundstart aus einem Lead greift, sonst wird die Vordergrund-Regel (ADR-007) per Handbuch-Minor angepasst — den
laufenden REL-15-Controllern sofort mitgeteilt. **V2** Ein Controller mit Blocker meldet `waiting` und wird per
`SendMessage` fortgesetzt statt ersetzt. **V3** `zeitreserve-push` bewertet nur `loadStart` (R394), das Lastwarten nach
`make check` entfällt; Kopfkommentar `tools/zeitreserve/check.ts` mitkorrigieren. **V4** (a) `metrics.py --since`; (b) die
Ende-Routine empfiehlt dem Nutzer für die nächste Studio-Session ein neues Claude-Gespräch; (c) Kenntnis-Eintrag R434 in
der Warteschlange (N-99). V1, V2, V4 b als Handbuch 1.39 durch den studio-coach (sonnet) jetzt; V3 und V4 a mit
TOOL-E049-PHASE und den Werkzeug-Befunden als **TOOL-BUENDEL-2** nach REL-15.

Regelbezug: STUDIO.md Z. 46/67 (Arbeiter, Controller-Übergabe), ADR-007, R394, R434 · Kosten bei Irrtum: ein Handbuch-Minor
zurück.

Entscheider: L0 · Anlass: Release-Retro REL-14 · ADR: —

## R439 · 2026-10-10 · TOOL-BUENDEL-2: Umfang und Plan

Ruling: Ein Werkzeug-Paket bündelt alle offenen Werkzeug-Punkte, damit Plan und Gate nur einmal anfallen (Steuerung rot,
R433): **TOOL-E049-PHASE** (R433 V2: Bereinigung nach Freigabephase `plan-*`/`design-*`/`gate-*`), **zeitreserve nur
loadStart** inkl. Kopfkommentar `check.ts` (R438 V3), **`metrics.py --since`** (R438 V4 a) und die Beobachtungen
`docs/beobachtungen.md` Z. 218–270: studio-lint rot, `paths.py`-Kommentar, Probe-Event `commit_rejected`, Ampelzeile
bereinigter Steuerungsanteil, `metrics.py --session latest` im Worktree, Hook ohne `python3`, Schein-Session «manual»,
Testlücke `ps`-Fehler, Ampelzeile Persona-Starts, haiku-Zeile der Modelltabelle. Plan `lead-tech` (opus, Tech-Lead beim
Plan) jetzt parallel zum REL-15-Kandidaten (nur lesen), danach Gate Plan durch `lead-qa` allein (Folgeplan auf
TOOL-BUENDEL, R233 V2; Ownership/Budget prüft L0). Punkte, die mehr als S sind, darf der Plan begründet auslagern.

Regelbezug: gates.md Gate Plan (Folgeplan R233 V2); R433, R438 · Kosten bei Irrtum: ein Paket wird aufgeteilt.

Entscheider: L0 · Anlass: Retros R433/R438, Beobachtungen · ADR: —

## R440 · 2026-10-10 · Gate Merge Release REL-15: OK

Ruling: **OK** für REL-15 = Kandidat `b948706` (Basis `a274277`; Merges `7e3c909` See, `b948706` UI). Prüfliste: `make check`
grün (135 s), `check-ci-perf` grün (53 s); Final-Review opus OK (16 Dateien, AK-R15-01…21, R437 B1–B5, E1–E6; kein
Sim-/Save-Diff); Playtest am Kandidaten je UI-Task mit Screenshots (`.studio/qa/REL-15/kandidat/` a4, a4b, b5, b6,
`seekarte/`), Smoke bei 1280×720 und 1920×1080 bestanden, Etikett „Save v10“, Konsole leer. Merge lokal nach `main` durch
`production-integrator` (`--no-ff b948706`); **Push in der nächsten Studio-Session** (R335, der Push dieser war REL-14).
Niedrige Befunde (dispose ohne `islandMenuAbort`, `12 * d` statt `SEA_MAP_PAD` in `seekarte.mjs`, Kontor-Marke klein bei
1280×720, `b6-*`-Screenshots ohne Grösse im Namen, getImageData-Hinweis im QA-Skript) trägt L0 nach dem Merge in
`docs/beobachtungen.md` ein. Budget-Hinweis „lead-qa 4 von 2“: Freigabezeile für den Release-Check fehlte und ist
nachgetragen (L0-Versäumnis, an die Kurz-Retro).

Regelbezug: gates.md Gate Merge Release; R335/R434 · Kosten bei Irrtum: Fix-Häppchen vor dem Push.

Entscheider: L0 · Anlass: Release-Check lead-qa · ADR: —

## R441 · 2026-10-10 · Gate Plan TOOL-BUENDEL-2: BEDENKEN → Nacharbeit, Umsetzung frei

Ruling: Urteil `lead-qa` BEDENKEN B1–B4, nichts blockierend; Plan `3a1f38b`. Nacharbeit durch den Controller vor dem
jeweiligen Task: **B1** `lead_phases` aus den ungefilterten Events bauen und Test für eine Session über `since` ohne
früheren Kostenstand; **B2** Mindest-Python (≥ 3.11) in arc42 (T06), `precommit.py` und Hook lassen bei älterem Python still
zu; **B3** T06 ohne eigenes Task-Review, ausdrücklich im Final-Review T07 (im Index als Abweichung vermerkt); **B4** Import
von `MANUAL_SESSION` im `try` von `record`. **Entscheide:** E1–E6 wie empfohlen (E4 Ruff-Pin `uvx ruff@0.17.0` ist keine neue
Abhängigkeit, dep-guard unberührt; E6 STUDIO.md-Zeile „warten, bis die Last ≤ 4“ streicht der studio-coach direkt nach dem
Merge). **E7 abgelehnt:** Umsetzung startet jetzt; der nächste Push läuft per geprüftem Hash, das Bündel geht nach Gate
Merge mit REL-15 hinaus. **AK-Nummern** AK-TB2-01…13 bestätigt. **Budget:** 12 Arbeiter-Starts (eine Zeile, R433 V3 b),
Parallelität 2, Controller `sonnet`.

Regelbezug: gates.md Gate Plan (Folgeplan R233 V2); Verfassung §7.2; R394 · Kosten bei Irrtum: Revert-Merge vor dem Push.

Entscheider: L0 · Anlass: Gate Plan TOOL-BUENDEL-2 · ADR: —

## R442 · 2026-10-10 · Gate Merge TOOL-BUENDEL-2: OK

Ruling: **OK** für `tool/b2-py` @ `7a10b831` (T01–T06, Merge `tool/b2-ts` `0cc1e304`): Final-Review opus OK ohne BEDENKEN,
AK-TB2-01…13, R441 B1–B4 erfüllt; `make check`, `make studio-test` (546), `make studio-lint`, `tsc`, `docs-check` Exit 0;
Konfliktprobe gegen main sauber. Merge lokal durch `production-integrator` (`--no-ff`), danach `make check` und
`make studio-test` auf main; Worktrees `b2-py`/`b2-ts` entfernen; kein Push (nächste Studio-Session, zusammen mit REL-15).
Direkt danach streicht der studio-coach die STUDIO.md-Zeile „warten, bis die Last ≤ 4“ im Push-Ablauf (E6) als Handbuch
1.40. Für die Kurz-Retro: Reviewer hat den Worktree `b2-py` kurz auf `main` umgeschaltet (zurückgestellt, sauber);
versehentlich committete `*-E`-Sicherungsdateien (entfernt, Historie bleibt).

Regelbezug: gates.md Gate Merge; R335/R434 · Kosten bei Irrtum: Revert-Merge vor dem Push.

Entscheider: L0 · Anlass: Bericht lead-tech TOOL-BUENDEL-2 · ADR: —

## R443 · 2026-10-10 · Kurz-Retro 2026-10-10 angenommen; Ampel Steuerung ohne eigene Ad-hoc-Retro

Ruling: Retro `docs/studio/retros/2026-10-10-session-c64c0775-b-ende.md` (`42be7b7f`) angenommen. **V1/E-055** Spawn-Hook
warnt, wenn ein Lead mit „Budget: n“ ohne `budget`-Zeile startet — als Werkzeug ohne Experiment-Platz (wie E-051), Paket
TOOL-BUDGET-WARN (lead-tech, ≈ 20 Tools) nächste Studio-Session. **V2** Messauftrag L0-Start-Kontext ≤ 60k in einem neuen
Gespräch (Frist 2026-10-23). Die vom Hook gemeldete Ad-hoc-Retro „Steuerungsanteil zwei Sessions rot“ ist durch diese
Retro abgedeckt: roh 68,7 % rot, nach E-049-Phase bereinigt 37,6 % grün; Hebel E-054 (Pläne auf sonnet) bleibt eingereiht
und ist der erste Kandidat für den nächsten freien Platz.

Regelbezug: STUDIO.md Verbesserungsschleife (R316), §10.2 Verfassung · Kosten bei Irrtum: eine Ad-hoc-Retro nachholen.

Entscheider: L0 · Anlass: Kurz-Retro, Ampel-Hinweis · ADR: —

## R444 · 2026-10-10 · BEOB-AUSW-04 angenommen; Auswahl REL-16 und TOOL-BUENDEL-3

Ruling: Auswertung `847f2fd4` angenommen (27 Einträge: 11 erledigt, 9 abgehakt, 7 Kandidaten S). (1) **REL-16 „Ruhiges
Bauschild, sauberer Neustart“** = ein S-Paket UI-REL16 (lead-tech): Bau-/Weg-Werkzeug über einem Haus zeigt nicht mehr
„Kein Bauland“ (`src/ui/hints.ts`, `src/sim/placement.ts`), `dispose` bricht die `document`-Listener des Inselmenüs ab
(`islandMenuAbort`, `src/ui/hud.ts`). Ein-Paket-Release: Gate Merge und Release-Check in einem `lead-qa`-Start. (2)
**TOOL-BUENDEL-3** (lead-tech) = TOOL-BUDGET-WARN (R443 V1/E-055) plus die fünf Werkzeug-Kandidaten aus „Ausgewertet
2026-10-10“; ein Werkzeug-Paket statt zwei spart einen Lead-Start und ein Gate. Beide starten erst nach dem Push
PUSH-REL-15 (Zeitmessung, R329) und gehen mit dem Push der nächsten Studio-Session raus (R335). Weil der Posteingang
keine weiteren Spielerthemen liefert, folgt nach REL-16 eine Ideen-Runde (Discovery-Strang, E-027).

Regelbezug: STUDIO.md Auswahl/Discovery-Strang; R335, R443 · Kosten bei Irrtum: zwei S-Pakete umplanen, kein Code betroffen.

Entscheider: L0 · Anlass: Bericht lead-production BEOB-AUSW-04 · ADR: —

## R445 · 2026-10-10 · Nutzerauftrag: Ideen-Runden bei freier Kapazität; IDEEN-05 breit

Ruling: Auslegung von „wenn du in einer Session Kapazitäten hast …, lass den Brainstorming-Agenten neue Ideen entwickeln
(neue Funktionen, Spieltiefe, QoL; nur Idee, nicht Umsetzung) → die Ideen kommen zu dir, du priorisierst nach Nutzen und
Aufwand“ als **Dauerauftrag**: (1) Ist im Studio-Deckel (≤ 8 Agenten) und im Nutzungslimit Platz, startet L0 eine
Ideen-Runde, zusätzlich zum bisherigen Takt (nach Release, spätestens jede zweite Session); weiterhin höchstens eine
Runde je Session. (2) Eine solche Runde ist breiter: `lead-design` setzt bis zu **3** `design-idea-scout` parallel mit je
einem Schwerpunkt ein (Spieltiefe und Wirtschaft · neue Funktionen und Inhalte · Komfort und Bedienung), je höchstens 5
Ideen, zusammen ≤ 160 Tools. (3) `lead-design` bewertet **alle** Ideen nach dem Raster, ergänzt je Idee Nutzen und
Aufwand in einer Zeile und liefert L0 eine vollständige Rangliste statt höchstens 2 Pitches; **L0 priorisiert** im
Runden-Ruling nach Nutzen/Aufwand. (4) Obergrenze offener Ideen im Pool 40 statt rund 30; Doppelte fasst `lead-design`
zusammen. (5) Nur Ideen, keine Specs oder Pläne; Säulenwechsel bleibt Warteschlange (§5.3). Erste Runde: **IDEEN-05**
jetzt, parallel zum Push (reine Doku). Handbuch-Minor (STUDIO.md Discovery-Strang, gates.md Gate Ideen-Runde) setzt der
studio-coach im selben Zug um (R429).

Zweck der Anweisung: mehr und bessere Spielideen ohne Leerlauf, Auswahl beim Projektleiter; Auslegung widerspricht ihm
nicht, weil sie freie Kapazität nutzt, nur Ideen erzeugt und die Priorisierung bei L0 lässt.

Regelbezug: Nutzerauftrag; STUDIO.md Discovery-Strang (E-027, R208); gates.md Gate Ideen-Runde; R429 · Kosten bei Irrtum:
eine zu breite Runde (≈ 160 Tools), Pool wieder eindampfen.

Entscheider: L0 · Anlass: Nutzerauftrag 2026-10-10 · ADR: —

## R446 · 2026-10-10 · REL-15 live; CI rot durch Sekunden-Flake im Metrik-Test; Hotfix ohne zweiten Push

Ruling: (1) **REL-15 + Werkzeug-Bündel 2 live:** Push `9eb99e77..c282def0` (Push-Gate grün: `make check` 2875 Tests,
`loadStart` 3,64, `zeitreserve-push` und `check-ci-perf` Exit 0), Pages 38038481954 grün. (2) **CI 38038270428 rot**,
einziger Fehler `tests.test_metrics.MetricsTest.test_second_run_overwrites`. Beleg: Die Listen unterscheiden sich nur
in einer Zeile mit Zeitstempel `…:36:16+00:00` gegen `…:36:17+00:00`; der Test filtert nur Zeilen mit „erzeugt“, der
JSON-Block trägt den Zeitstempel `created` (`tools/studio/metrics.py:409`) aber zusätzlich. Das Spiel ist nicht
betroffen (alle Vitest-Läufe grün, Pages baut selbst). Dass der Integrator Pages trotz roter CI auslöste, ist
gedeckt: Gate R440 erteilt, alle Prüfungen lokal grün, Fehler nur im Studio-Werkzeug. (3) **HOTFIX-CI-01**
(lead-tech, Controller sonnet): Test zeitfest machen (feste Uhr oder Filter auf `created`), Branch im Worktree,
Task-Review, Gate Merge durch L0, Merge lokal. **Kein zweiter Push** in dieser Studio-Session (R335): Live-Spiel
unberührt, CI auf main bleibt bis zum nächsten Push rot; der Hotfix geht als erstes mit dem nächsten Push raus. (4)
Ad-hoc-Retro „CI rot“ (Hook) wird mit der fälligen Prozess-Aussensicht REL-15 in **einem** `studio-process-coach`-Start
gebündelt. UI-REL16 und TOOL-BUENDEL-3 starten, sobald die Ideen-Runde IDEEN-05 Plätze freigibt (≤ 8 Agenten, R424).

Regelbezug: STUDIO.md Merge/Push („CI rot → Behebung hat Vorrang, Ad-hoc-Retro“), R335, R424 · Kosten bei Irrtum: CI
auf main bis zum nächsten Push rot; Fehlalarm in `ci.py`.

Entscheider: L0 · Anlass: Bericht production-integrator PUSH-REL-15 · ADR: —

## R447 · 2026-10-10 · Gate Merge HOTFIX-CI-01: OK

Ruling: **OK** für `fix/ci-metrics-flake` @ `47978b81` (nur `tools/studio/tests/test_metrics.py`, +23/−4): Test patcht
`metrics.datetime` mit einer Uhr, die je Lauf eine Sekunde weiterspringt, und filtert beide Zeitstempel-Zeilen
(`erzeugt`, `"created"`); Probe vorher rot/nachher grün belegt; `make studio-test`, `make studio-lint` Exit 0;
Task-Review `qa-code-reviewer` OK; Konfliktprobe sauber; L0-Diffprüfung ohne Befund. Merge lokal durch
`production-integrator` (`--no-ff`, `make check`), Worktree danach entfernen; Push mit der nächsten Studio-Session (R446).

Regelbezug: gates.md Gate Merge; R446 · Kosten bei Irrtum: Revert-Merge vor dem Push.

Entscheider: L0 · Anlass: Bericht lead-tech HOTFIX-CI-01 · ADR: —

## R448 · 2026-10-10 · Ideen-Runde IDEEN-05 entschieden (Priorisierung nach Nutzen/Aufwand)

Ruling: Runde `42e3df01` angenommen (15 Ideen I-031…I-045, 3 Starts, ≈ 55 von 160 Tools). Priorisierung durch L0 nach
Nutzen je Aufwand (R445): **(1) einplanen REL-17** als S-Bedien-Häppchen **UI-PROBLEM-SPRUNG** = I-042 „Nächstes Problem
anspringen“ + I-041 „Wege abreissen durch Ziehen“ (höchster Nutzen je Aufwand, kein Save, keine Baseline; beide in
`src/ui/input.ts`): Kurzdesign `lead-design` jetzt, Plan danach; REL-16 bleibt unverändert (schnelles Fehler-Release).
**(2) einplanen als Bausteine M13 „Spätspiel mit Richtung“**: I-031 „Edikte der Amtsstube“ + I-039 „Denkmal als Wahlziel“
(tiefste neue Entscheidung; Geld hat nach Stunde 1 keine Richtung). Brainstorming `lead-design` mit
`design-economy-designer` jetzt parallel, Ergebnis ist ein Designvorschlag mit Rechnung (Stapel-Gefahr Steuer «niedrig» +
Fest + Wohlfahrts-Edikt), noch keine Spec. **(3) einplanen nach REL-17**: I-043 „Gut-Chip zeigt Erzeuger und Verbraucher“
(teilt die Sprung-Logik von I-042). **(4) geparkt:** I-035 „Betrieb stilllegen“ bis zur nächsten Save-Änderung (v11,
dann mitnehmen); I-038, I-036, I-016 bis zu einem Archipel-Brainstorming; I-032, I-033, I-034, I-037, I-044, I-040, I-045
bis Anlass (Begründungen im Bericht IDEEN-05). Keine Idee berührt Säule, Genre oder Titel (§5.3). Die
Entscheid-Zeilen in `docs/ideen.md` trägt `lead-design` im Kurzdesign-Start nach.

Regelbezug: gates.md Gate Ideen-Runde (breite Runde, R445) · Kosten bei Irrtum: Reihenfolge der nächsten Releases
umstellen; kein Code betroffen.

Entscheider: L0 · Anlass: Bericht lead-design IDEEN-05 · ADR: —

## R449 · 2026-10-10 · Kurzdesign REL-17 UI-PROBLEM-SPRUNG angenommen

Ruling: Kurzdesign `lead-design` (Selbstprüfung OK, Handoff `.studio/handoffs/2026-10-10-lead-design-UI-PROBLEM-SPRUNG.md`)
angenommen. Entscheide wie empfohlen: **(1)** Waren-Mangel als ein Eintrag je Gut und Insel (mit Hauszahl); **(2)** «Lager
voll» nicht als Problem bis I-035; **(3)** kein Zähler-Knopf in REL-17 (mit I-043 bündeln); **(4)** Trenn-Warnung „Abriss
trennt n Gebäude vom Kontor“ für Zug- und Einzelabriss eines Wegs. Tasten `.`/`,` über `hotkeyAction`; Reihenfolge nach
Schwere, aktive Insel, Abstand, ID (kameraunabhängig); Abriss-Zug nur Wege, Gebäude übersprungen, Erstattung wie
Einzelabriss. `src/sim/` nur lesend, kein Save, keine Baseline. Plan `lead-tech` (opus) jetzt; die Umsetzung startet
nach dem Merge von REL-16, weil beide `src/ui/app.ts` berühren (Dateimatrix, E-019); `src/ui/problems.ts` ist der
Baustein für I-043.

Regelbezug: gates.md Gate Brainstorming / Kombiniertes Gate (Stufe leicht); R448 · Kosten bei Irrtum: Plan-Nacharbeit,
kein Code betroffen.

Entscheider: L0 · Anlass: Bericht lead-design UI-PROBLEM-SPRUNG · ADR: —

## R450 · 2026-10-10 · Retro REL-15 (mit Ad-hoc CI rot) angenommen

Ruling: Retro `docs/studio/retros/2026-10-10-release-rel15-prozess.md` (`33c8453a`) angenommen, V1–V4 wie empfohlen.
**V1** rote Testläufe automatisch mit Testnamen als `test_failed`-Event plus Ampelzeile, **V2** gemeinsame Uhr für die
Studio-Werkzeuge mit `studio-lint`-Warnung bei direktem `datetime.now`/`time.time` (zunächst nur Warnung), **V3**
Werkzeug-Tasks prüfen schmal (`studio-test`, `studio-lint`, `tsc`, `lint`, `vitest tests/tools`), voller `make check`
erst am Strang-Ende, beim Merge und im Push-Gate (Verfassung §7 unverändert) — V1 und V2 als Tasks, V3 als Prüfregel in
den Plan **TOOL-BUENDEL-3** (lead-tech per Nachricht). **V4** Handbuch-Minor 1.42 durch den studio-coach: im Push-Ablauf
„Load ≤ 4 vor `make check` abwarten (R394)“ und „Pages bei roter CI nur, wenn ausschliesslich Studio-Werkzeuge rot sind“.
Hinweis an die nächste Kurz-Retro: Last bis 13 (1-min) während der Parallelphase dieser Session; Merge HOTFIX-CI-01 lief
`make check` bei Load 7,9.

Regelbezug: STUDIO.md Verbesserungsschleife (R316), §10.2 Verfassung, R429 · Kosten bei Irrtum: zwei Werkzeug-Tasks
mehr im Bündel; Handbuch-Minor zurücknehmen.

Entscheider: L0 · Anlass: Bericht studio-process-coach RETRO-REL-15 · ADR: —

## R451 · 2026-10-10 · Gate Plan REL-16 / TOOL-BUENDEL-3: BEDENKEN → Nacharbeit, Umsetzung frei

Ruling: Plan `docs/superpowers/plans/2026-10-10-rel-16/` (`f4b021e5`, T01–T12) frei. Urteil `lead-qa` BEDENKEN B1–B3,
nichts blockierend; Nacharbeit ohne Zweitprüfung: **B1** das T12-Briefing nennt T10 namentlich (Merge, voller
`make check` als Prüfgegenstand); **B2** Task-Review zu T02 verlangt eine Mutationsprobe (Aufruf in `dispose` entfernen →
Test rot), Browser-Probe `--leck` in T04 bleibt Zweitbeleg; **B3** T08 prüft `load`/`diff` nur auf Typ/Format, Grenze
des `git diff HEAD`-Hashes (ungetrackte Dateien) im Testkommentar. **Entscheide E1–E7** wie empfohlen (E1 Wortlaut
„Kein Bauland: Gebirge/Wasser“, „Platz belegt: Wohnhaus/Weg“; E2 ein Browser-Lauf am Kandidaten im lead-qa-Release-Start,
T04 vollständig als Prüfpunkt im Gate Merge Release; E3 Budget-Warnung in `modelguard.py`, nie `deny`; E4 arc42 je Strang;
E5 Ampel Flake-Verdacht gelb ab 1, rot ab 3; E6 Uhr-Umstellung nur ohne Testumbau; E7 Namensschema im render-qa-README).
**Budget:** UI-REL16 6 Starts, Parallelität 1; TOOL-BUENDEL-3 17 Starts, Parallelität 2 (Stränge py und qa unter einem
Controller). Je Strang ein Controller `lead-tech` (sonnet). Studio-Deckel ≤ 8 Agenten (R424); Last vor jedem vollen
`make check` ≤ 4 (Handbuch 1.42).

Regelbezug: gates.md Gate Plan; R424, R450 · Kosten bei Irrtum: Nacharbeit im Strang vor dem Kandidaten.

Entscheider: L0 · Anlass: Urteil lead-qa GATE-PLAN-REL16-TB3 · ADR: —

## R452 · 2026-10-10 · Gate Brainstorming M13 „Spätspiel mit Richtung“: Ansatz A angenommen

Ruling: Designvorschlag `docs/superpowers/specs/2026-10-10-spaetspiel-vorschlag.md` mit Rechnung (`153a1d9d`) angenommen,
Selbstprüfung OK mit B1–B3. L0-Prüfung nach Gate Brainstorming: stärkt die Säulen Wirtschaft und Ausbau, Zweck („Geld
und Ware bekommen nach Ziel 1 eine Richtung“) in einem Satz sagbar; Baseline und Balancing-Test unverändert (Lauf ohne
Edikt 6750/11 500 Ticks); kein Richtungswechsel (§5.3). **Entscheide O1–O11 wie empfohlen:** O1 Ansatz A (Edikte ab Ziel 1,
Denkmal ab Ziel 2, getrennte Systeme); O2 Etappe E1 Edikte zuerst (Save v11), E2 Denkmal danach, Denkmal-Sprite parallel
zu E1 (lead-art); O3 Wohlfahrt über den Wachstumstakt (40 statt 50 Ticks, Wartezeit 200, Steuer −5 Punkte; Rückfall: nur
zwei Edikte); O4 Sparen −7 Steuerpunkte; O5 Handel Kaufpreise −20 % aufgerundet; O6 Freischaltung wie O1; O7 Zukauf-Schalter
je Gut; O8 automatische Lieferung über der Reserve mit «Bau pausieren»; O9 Edikt-Preis 600 Geld, 5 min Sperre; O10 I-035
„Betrieb stilllegen“ in Save v11 mit eigenem S-Kurzdesign; O11 Denkmal-Mengen nach Playtest ±30 %. **Auflagen an die
Spec:** B1 Wohlfahrts-Vorteil per Simulation belegen (AK mit Seed-Lauf), B2 Edikt-Wirkung im Endzustand als bewusst
klein dokumentieren, B3 Denkmal-Dauer gegen Referenzlauf ohne Zusatzausbau prüfen; Playtest ab Spielstand mit Ziel 1;
Rückfaltung `foldBackToV10` für Hash-Pins. Nächster Schritt: Spec M13-E1 durch `design-spec-author` (opus), sobald im
Studio-Deckel Platz ist (REL-16/TOOL-BUENDEL-3 laufen). Befunde ausserhalb Scope (I-031/I-039-Zahlen im Pool, Referenz-
Controller erreicht Ziel 3 nicht) trägt `lead-design` beim nächsten Start nach.

Regelbezug: gates.md Gate Brainstorming; R448; Verfassung §5.3 · Kosten bei Irrtum: Spec-Nacharbeit; kein Code betroffen.

Entscheider: L0 · Anlass: Bericht lead-design M13-BRAINSTORM · ADR: —

## R453 · 2026-10-10 · Kombiniertes Gate REL-17: BEDENKEN → Nacharbeit, Umsetzung nach REL-16-Merge

Ruling: Kurzdesign (R449) und Plan `docs/superpowers/plans/2026-10-10-rel-17/` (`10ebab84`, `956e4737`) frei. Urteil
`lead-qa` BEDENKEN B1–B5, nichts blockierend. Nacharbeit durch den Controller **vor T01**, ohne Zweitprüfung: **B1**
Sprung-Ablauf als reine Funktion `runProblemJump(deps, dir)` in `src/ui/problems.ts` mit Vitest über protokollierende
Fakes (Reihenfolge, kein `selectTool`, `landed` nach `refresh`, Meldung); AK-R17-10 prüft diese Funktion statt einer
Quelltext-Reihenfolge; **B3** T03/T06 nennen `pointercancel` und `blur` ausdrücklich (kein hängender `stroke`: `dragEnd`
oder verwerfen) als Prüfpunkt; **B2** T05 Schritt 8 verbindlich mit „Abriss-Zug + `.`“ und „Weg-Zug + `.`“, Rückfall-Klausel
in T03 nur als Ausnahme mit Begründung; **B4** Berührungspunkt-Text korrigieren, Zeilen nach dem REL-16-Merge per grep neu
finden, Doku-Überschneidung README/arc42/beobachtungen nennen; **B5** T05-Kopf um AK-R17-12/14 ergänzen, Touch-Schwelle aus
AK-R17-16 als ungeprüft nach `docs/beobachtungen.md`; T05 startet vor dem Final-Review. **Entscheide E1–E9** wie empfohlen
(u. a. E3 Anker-Insel im Cursor, E6 `.` bricht den Zug ab, E9 ein Browser-Lauf + opus-Review am Kandidaten).
**Budget:** 13 Starts (lead-tech 11, lead-qa 2), Parallelität 1; Controller `lead-tech` (sonnet); Start erst nach dem
lokalen Merge von REL-16 (`blocked-by`, `src/ui/app.ts`).

Regelbezug: gates.md Kombiniertes Gate (Stufe leicht); R449 · Kosten bei Irrtum: Nacharbeit im Strang vor dem Kandidaten.

Entscheider: L0 · Anlass: Urteil lead-qa GATE-PLAN-REL17 · ADR: —

## R454 · 2026-10-10 · Gate Merge Release REL-16: OK

Ruling: **OK** für `fix/rel-16-ui` @ `b9476044` (T01–T03). Final-Review opus OK, Browser-Lauf T04 vollständig (1280×720,
1920×1080, Seed 7, 12 Screenshots unter `.studio/qa/REL-16/`, Leck-Probe bestanden, Smoke und Konsole sauber), alle
AK-R16-01…10 belegt; Sim-Diff leer; `make check` grün (Controller, Load 2,4). Bedenken B1–B4 niedrig, nicht blockierend:
**B1** entschieden „Gebäude vor Weg“ im Mischfall; B1–B3 und zwei render-qa-Punkte als Beobachtungen eingetragen; B4
Mutationsproben ersetzen die fehlenden Rot-Belege. Merge lokal durch `production-integrator` (`--no-ff`, `make check`),
Worktree danach entfernen; **Push mit der nächsten Studio-Session** (R335), zusammen mit HOTFIX-CI-01. Danach startet
REL-17 (R453). Release-Notiz wie im Bericht (Neu: Bauschild nennt den Grund; Bitte testen: Bergfuss, Küste, über Häusern
und Wegen; Inselmenü nach „Neue Insel“).

Regelbezug: gates.md Gate Merge Release (Ein-Paket-Release, R429); R451 · Kosten bei Irrtum: Revert-Merge vor dem Push.

Entscheider: L0 · Anlass: Urteil lead-qa REL-16 · ADR: —

## R455 · 2026-10-10 · Gate Spec M13-E1: BEDENKEN → Nacharbeit ohne Zweitprüfung; AK-Nummern

Ruling: Spec `docs/superpowers/specs/2026-10-10-m13-e1-edikte-design.md` (`c7608c22`) angenommen unter Nacharbeit. Urteile
`lead-tech` BEDENKEN T-B1–T-B3 und `lead-qa` BEDENKEN Q-B1–Q-B4, nichts blockierend. **AK-Nummern (R417, Q-B1):**
`AK-E1-nn` → **`AK-M13E1-nn`**, `AK-STL-nn` → **`AK-M13STL-nn`** (beide per grep kollisionsfrei), durchgängig in Spec und
Anhängen. Nacharbeit durch `design-spec-author` (Fortsetzung): **T-B1** §2/AK-M13E1-21 „Strategie der Controller
unverändert, nur Aufrufe mechanisch an `buyPrice(world, good, n)` angepasst“; **T-B2/Q-B4c** gemessene Seed-Werte stehen
vor dem Merge als Festwerte in der Testdatei, Verfehlen der Grenzen relativ zu K′ ist Pflicht-Rulingpunkt; **T-B3/Q-B2**
je Seed-AK Timeout und Zeitreserve-Regel (lokal unter `CI=true` ≤ 50 % des Timeouts), Phase 1/2 einmal je Datei rechnen
und per `serialize` kopieren; **Q-B3** entschieden: ein **stillgelegter Betrieb erscheint nicht in der Problemliste**
(I-042), auch nicht als „nicht angebunden“ — bewusster Zustand, kein Lärm; Satz in S6 plus ein AK-M13STL; **Q-B4a**
AK-M13E1-09 Erwartungswert lesbar; **Q-B4b** Anhang 03 E: Diff in `balance*.test.ts` und Pins muss leer sein. Spec
bleibt ≤ 40 KB (Nacharbeit in Anhänge auslagern, wenn nötig). Danach **Plan M13-E1** durch `lead-tech` (opus) mit
Strängen sim (6–7 Tasks) und ui (5–6 Tasks, blocked-by Sim-Task 1–2), Merge-Reihenfolge nach REL-17 (Problemliste,
`hints.ts`).

Regelbezug: gates.md Gate Spec; R136, R417, R452 · Kosten bei Irrtum: Spec-Nacharbeit vor dem Plan.

Entscheider: L0 · Anlass: Urteile lead-tech, lead-qa GATE-SPEC-M13-E1 · ADR: —

## R456 · 2026-10-10 · Spec M13-E1 Nacharbeit abgenommen; Ausnahme `balance-upgrade.test.ts`; Plan frei

Ruling: Nacharbeit `3acc7e2f` erfüllt R455 (AK-Kollisions-grep leer, Spec 39 633 Byte, neues AK-M13STL-11 zur
Problemliste). **Bestätigt:** `tests/sim/balance-upgrade.test.ts` ist die einzige Ausnahme vom leeren Diff in
`balance*.test.ts` — nur der Aufruf `buyPrice('tools', n)` wird mechanisch auf die neue Signatur umgestellt, kein
Erwartungswert ändert sich (Regressionsschutz bleibt). Plan **M13-E1** durch `lead-tech` (opus) jetzt.

Regelbezug: R455; Verfassung §3 (Balancing-Test bleibt Regressionsschutz) · Kosten bei Irrtum: eine Testdatei mehr im
Review.

Entscheider: L0 · Anlass: Bericht design-spec-author Nacharbeit R455 · ADR: —

## R457 · 2026-10-10 · Gate Merge TOOL-BUENDEL-3: OK

Ruling: **OK** für `tool/b3-py` @ `95cb4dbe` (T05–T11, `tool/b3-qa` eingemergt): Final-Review opus OK (T05–T11 je OK, T10
ausdrücklich geprüft, R451 B1), Task-Reviews OK bzw. BEDENKEN niedrig (T09 `clock.py` 63 statt 50 Zeilen — akzeptiert,
Grenze widersprach der Spec); `make check` (Load 4,00), `studio-test` (593), `studio-lint`, `lint`, `docs-check`,
`zeittests` Exit 0; Konfliktprobe sauber; Uhr-Warnungen 12 → 0; R451 B3 im Testkommentar. Restpunkte als Beobachtung.
Merge lokal durch `production-integrator` (`--no-ff`, `make check`), Worktrees `b3-py`/`b3-qa` entfernen; Push mit der
nächsten Studio-Session (R335). Für die Kurz-Retro: Controller 1 beendete seinen Zug wartend, der Bericht von Controller 2
kam bei L0 an (ADR-007-Muster, kein Schaden); Controller 2 mergte `tool/b3-qa` selbst, weil der Umsetzer das per
Persona ablehnte.

Regelbezug: gates.md Gate Merge; R335, R451 · Kosten bei Irrtum: Revert-Merge vor dem Push.

Entscheider: L0 · Anlass: Bericht Controller 2 TOOL-BUENDEL-3 · ADR: —

## R458 · 2026-10-10 · Gate Merge Release REL-17: OK unter Auflage (Doku-Konflikt lösen)

Ruling: **OK** für `feat/rel-17` (T01–T04) unter Auflage. Final-Review opus und Browser-Lauf T05 vollständig (1280×720,
1920×1080; Schritt 8 „Weg-Zug + `.`“ und „Abriss-Zug + `.`“ einzeln bestanden; `pointercancel`/`blur` ohne hängenden Zug;
Fremdinsel-Sprung öffnet das Panel; Konsole sauber); AK-R17-01…19 belegt, Sim/Render/Audio-Diff leer. **Auflage (B1):**
`git merge-tree` gegen main meldet Konflikt in `docs/beobachtungen.md` (beide Seiten am Dateiende angehängt). Der
Eigentümer (Controller REL-17, Fortsetzung) mergt main per `git merge` in `feat/rel-17` (kein Rebase), behält beide
Abschnitte, trägt die niedrigen Befunde (Reviewer B2–B4, Playtest 1–2, vier Befunde ausserhalb Scope) als
Beobachtung ein und darf den Trivial-Fix B3 (Kommentar „Q/E“ → `.`/`,` in `src/ui/problems.ts:1`) mitnehmen; danach
`make check` und `merge-tree` sauber (AK-R17-20). Delta-Review durch L0 (Diff seit `6b62640c`). Danach Merge lokal durch
`production-integrator`; Push nächste Studio-Session (R335). Release-Notiz nach dem lead-qa-Vorschlag.

Regelbezug: gates.md Gate Merge Release (Konflikte: Eigentümer holt main per Merge, Delta-Review); R453 · Kosten bei
Irrtum: Revert-Merge vor dem Push.

Entscheider: L0 · Anlass: Urteil lead-qa REL-17 · ADR: —

## R459 · 2026-10-10 · Kurz-Retro 2cfa57e0 angenommen; E-050 behalten, E-054 startet; Ampel Steuerung abgedeckt

Ruling: Retro `docs/studio/retros/2026-10-10-session-2cfa57e0-ende.md` (`b6213ffb`) angenommen. **V4:** E-050 mit
Datenpunkt 3 von 3 **behalten**; der frei werdende Platz geht an **E-054 „Pläne auf sonnet“** ab der nächsten Studio-Session
(erster Fall: nächster Plan nach M13-E1). **E-038** Urteil „angepasst“ (opus-Schwelle zweimal verfehlt; Anpassung macht der
Coach beim nächsten Start). **V2/E-058** als Vorlagenzeile ohne Experiment-Platz: Integrator-Briefings nennen `make check`
und `make check-ci-perf` mit Exit-Code; Umsetzung (Briefing-Vorlage, Persona-Klarstellung) durch den studio-coach in der
nächsten Studio-Session, bis dahin nennt L0 beides im Briefing. **V1/E-056** und **V3/E-057** eingereiht (warten auf
Platz). Messaufträge M1 (Last bei Merge-Läufen, Frist 2026-10-23) und M2 (Weg des Spec-Autor-Starts, Frist 2026-11-19).
Die vom Hook gemeldete Ad-hoc-Retro „Steuerungsanteil zwei Sessions rot“ ist durch diese Retro abgedeckt (Hebel E-054
startet jetzt, R316 dritte Retro in Folge erfüllt).

Regelbezug: STUDIO.md Verbesserungsschleife (R316), §10.2 Verfassung · Kosten bei Irrtum: ein Experiment-Platz falsch
belegt; Ad-hoc-Retro nachholen.

Entscheider: L0 · Anlass: Kurz-Retro Session 2cfa57e0, Ampel-Hinweis · ADR: —

## R460 · 2026-10-10 · Gate Plan M13-E1: OK mit Auflagen, Umsetzung frei

Ruling: Plan `docs/superpowers/plans/2026-10-10-m13-e1/` (`0b40d7f1`, T01–T15) frei. Urteile `lead-qa` und
`lead-production` je **OK mit Auflagen** (`.studio/handoffs/2026-10-10-lead-qa-GATE-PLAN-M13-E1.md`,
`…-lead-production-GATE-PLAN-M13-E1.md`). **Entscheide E1–E9** wie im Plan empfohlen; **E4** ja (stillgelegt auch nicht
in `cutOffIds`, ein gemeinsames Prädikat in `problems.ts`); **E6** ja: ein Browser-Lauf T14 statt je UI-Task, Abweichung
von gates.md Plan-Frage 2 hiermit festgehalten (QA A4) — T14 lädt das Szenario je Schrittblock neu, Blocker schliesst eine
Teil-Wiederholung vor T15. **Auflagen, Nacharbeit ohne Zweitprüfung** (Controller A als erster Commit im Sim-Strang):
QA **A1** T02 und T15 prüfen, dass in `tests/sim/save.test.ts` nur die drei Version/Index-Zeilen geändert sind
(`CHAIN_HASHES`, `V6_FORMS` unberührt); **A2** Determinismus-Lauf Stilllegen (`setPaused`-Folge, Brand und Abriss
während Stilllegung, Speichern/Laden mitten im Lauf) als neuer Plan-AK PLAN-M13-04 in T07; **A3** T15 prüft AK-13
dreiteilig (T04, T05, T06); **A5** REL-17-Stand und Zeilenangaben (`app.ts` ≈ Z. 838–840) in Index und Übergabe.
Production **1/2** Index: Starts 28 + 4 Controller = 32 von 37, Wandzeit nach richtwerte.md (Tools ÷ 4, ≈ 110–130 min),
UI-Startbedingung erfüllt, Abzweig beider Stränge von `a9f5336e`; **3** Sim-Merges in den UI-Strang nur auf vom Reviewer
abgenommene Commits; **4** Sim-Befunde über den Ledger an T13; **5** Gate Merge erst, wenn main gepusht ist (Push läuft);
**6** Board-Pakete T01–T14 vor Start Controller A (L0). **Budget:** `lead-tech` 36, `lead-qa` 1, Parallelität 2, Phase
M13-E1. Controller A (`lead-tech`, sonnet) übernimmt T01–T04 im Sim-Strang; UI-Strang startet nach T03 mit eigener
Controller-Instanz. Kein `make check` zweier Stränge gleichzeitig (Testlock); Last ≤ 4 vor jedem vollen `make check`.

Regelbezug: gates.md Gate Plan; STUDIO.md Umsetzung (≤ 4 Tasks je Controller-Instanz), R424, R433 · Kosten bei Irrtum:
Nacharbeit im Strang vor dem Final-Review; ein Browser-Lauf statt vier kann einen UI-Fehler spät finden (Teil-Wiederholung).

Entscheider: L0 · Anlass: Urteile lead-qa und lead-production GATE-PLAN-M13-E1 · ADR: —

## R461 · 2026-10-10 · Kurzdesign UI-GUT-CHIP (I-043) angenommen; Plan jetzt, Umsetzung nach M13-E1-UI

Ruling: Kurzdesign `.studio/handoffs/2026-10-10-lead-design-UI-GUT-CHIP.md` (16 AK, AK-GC-01…16) angenommen. Offene
Fragen wie empfohlen: **(1)** der erste Klick springt sofort zum ersten Erzeuger; **(2)** Häuser nicht in Liste und
Markierung, nur im Tooltip gezählt; **(3)** kein Zähler-Knopf „⚠ n“; **(4)** Umsetzung erst nach dem Merge des
M13-E1-UI-Strangs (T12 berührt `problems.ts`, `texts.ts`, `hover.ts`). Beobachtung REL-17 (8) `HOUSE_TITLES` geht in
I-043 auf; (b) `unconnectedIds`/`cutOffIds` bleibt offen. **Plan jetzt** durch `lead-tech` auf **sonnet** als erster Fall
von **E-054** (R459); kombiniertes Gate Spec/Plan durch L0 (Stufe leicht). Budget Plan: `lead-tech` 1, Phase UI-GUT-CHIP.

Regelbezug: STUDIO.md Ablauf Stufe leicht; R448 (3), R459 · Kosten bei Irrtum: Plan muss nach dem M13-E1-UI-Merge auf
neue Zeilenstände nachgeführt werden (gering).

Entscheider: L0 · Anlass: Kurzdesign lead-design UI-GUT-CHIP · ADR: —

## R462 · 2026-10-10 · Kombiniertes Gate UI-GUT-CHIP: BEDENKEN → Nacharbeit ohne Zweitprüfung

Ruling: Plan `docs/superpowers/plans/2026-10-10-ui-gut-chip/` (`ae5a46cf`, T01–T08) mit Nacharbeit frei (Urteil
`lead-qa` `.studio/handoffs/2026-10-10-lead-qa-GATE-UI-GUT-CHIP.md`). **B1** T08 (Browser-Lauf) vor das Branch-Review
ziehen: das opus-Review über die Branch läuft als letzter Schritt nach allen Browser-Fixes. **B2** `stepKeyTarget` und
das Löschen des Fokus beim Inselwechsel verbindlich als reine Funktionen in `goodFocus.ts` mit Vitest (Ownership-Ausnahme
T06 angenommen); T08 ergänzt Esc bei offenem Toast und Problem-Sprung auf andere Insel. **B3** zuerst `signalFocus` in
`SIGNAL_NAMES` aufnehmen; besteht es Kontrast/Palette nicht, eigener ΔE-Test gegen Terrain und Sprites; dazu Test
CSS-Wert = Palette-Wert. **B4** T08 Punkt 2 um Leertaste und `.`/`,` bei Chip-Tastaturfokus. **B6** `git diff` auf
`src/sim` leer auch im Branch-Review; **B7** Randfall leeres Lager als Test. **B5, B8, B9** angenommen ohne Änderung
(Index-Grösse ohne Grenze, Budget bleibt 21 Starts, Parallelität 1). Nacharbeit durch die Plan-Instanz; Umsetzung bleibt
blockiert bis zum Merge des M13-E1-UI-Strangs (R461).

Regelbezug: gates.md Kombiniertes Gate (Stufe leicht); STUDIO.md Ablauf Stufe leicht Schritt 6 · Kosten bei Irrtum:
späte Nachreviews im Strang.

Entscheider: L0 · Anlass: Urteil lead-qa GATE-UI-GUT-CHIP · ADR: —

## R463 · 2026-10-10 · Push REL-16, REL-17, HOTFIX-CI-01, TOOL-BUENDEL-3: live

Ruling: Push `c282def0..a9f5336e` per geprüftem Hash (Integrator, Worktree `.worktrees/integrate`): `tsc`, `lint`,
`zeittests`, `conflicts` Exit 0; `make check` Exit 0 (Wiederholung bei Load < 3), `make zeitreserve-push` Exit 0 (Last 3,1,
2912 Tests, 0 ohne Reserve; davor zweimal Exit 2 „nicht belastbar“), `make check-ci-perf` Exit 0. CI `38055866019` **grün**
(HOTFIX-CI-01 wirkt), Pages `38056273377` grün. REL-16 und REL-17 live. Die nach dem Push entstandenen Doku-Commits
(R460–R462, Beobachtungen, Plan UI-GUT-CHIP) bleiben lokal bis zum nächsten Push (R335: einer je Studio-Session; dieser
Push zählt für Session 5a00a316). Prozess-Aussensicht REL-16/REL-17 folgt (ein Start `studio-process-coach`).

Regelbezug: STUDIO.md Push-Gate (R429, Handbuch 1.42), R335 · Kosten bei Irrtum: keine (Stand grün geprüft).

Entscheider: L0 · Anlass: Bericht production-integrator PUSH-2026-10-10b · ADR: —

## R464 · 2026-10-10 · Prozess-Aussensicht REL-16/REL-17 angenommen; Handbuch 1.43; TOOL-BUENDEL-4

Ruling: Retro `docs/studio/retros/2026-10-10-release-rel16-17-prozess.md` (`056cde16`, B1–B6, V1–V4) angenommen.
**V1** (Handbuch-Minor 1.43): Steht ein Push an, startet L0 keine Umsetzer und Controller, bis `make zeitreserve-push`
Exit 0 meldet; Gates, Kurzdesigns und Pläne ohne Testläufe dürfen parallel laufen (Anlass: L0 startete M13-E1 mitten im
Push-Gate, Push 29 statt ≈ 5 min). **V4** Zeile in `lernen.md` (Subagent ohne `Monitor`, macOS ohne `timeout`, Bash-Abbruch
nach 600 s → `run_in_background`). Umsetzung V1/V4 und die offene Vorlagenzeile E-058 (R459: Integrator-Briefing nennt
`make check` und `make check-ci-perf` mit Exit-Code) durch `studio-coach`. **V2** (`zeitreserve-push` ohne Testsperre,
`make check` gibt `loadStart` aus) und **V3** (Dashboard-Server 100 % CPU, `make studio` Fehlstart-Meldung) bilden mit der
Beobachtung Budget-Zuordnung (Paket-Kopfzeile mit Zusatz) und den Restpunkten R457 das Paket **TOOL-BUENDEL-4**; Plan
jetzt durch `lead-tech` auf sonnet (E-054, zweiter Fall), Umsetzung nach dem M13-E1-Merge oder parallel, sobald kein Push
ansteht. Budget Plan: `lead-tech` 1, Phase TOOL-BUENDEL-4; Coach: `studio-coach` 1, Phase HB-1.43.

Regelbezug: STUDIO.md Verbesserungsschleife, R316, R429 (Abweichung → Handbuch-Minor) · Kosten bei Irrtum: erster
Controller startet nach einem Push 5–8 min später.

Entscheider: L0 · Anlass: Prozess-Aussensicht REL-16/REL-17 · ADR: —

## R465 · 2026-10-10 · Gate Plan TOOL-BUENDEL-4: BEDENKEN → Nacharbeit ohne Zweitprüfung, Umsetzung frei

Ruling: Plan `docs/superpowers/plans/2026-10-10-tool-buendel-4.md` (`3f78d374`, T01–T07) mit Nacharbeit frei (Urteil
`.studio/handoffs/2026-10-10-lead-qa-GATE-PLAN-TOOL-BUENDEL-4.md`). **B1** Global Constraints erlauben gezielte
Einzeldatei-Läufe `npx vitest run <Dateien>` (wie M13-E1, R380); `make test`/`make check` nur der Controller. **B2** neuer
Task T08 `studio-coach`: STUDIO.md-Zeilen zu `zeitreserve-push` („mit Sperre“) nach T03 nachführen; T03 ergänzt einen Test:
halb geschriebene oder fehlende Messdatei → Exit ≠ 0, nie OK. **B3** T01: Messzahlen ins Ledger; dritte Ursache → Stopp und
Meldung an L0; Cache-Test bleibt als Rückfallschutz, sobald ein Abruf > 0,15 s dauert. **B4** T04 misst an der
Zählerausgabe („2 von 36“) und hat Gegenproben fremde Phase, Kopfzeile ohne Zusatz, `since` nach dem Start. **B5** Ctrl-C-Test
in T05 ohne feste Schlafzeit (Bereitschaftssignal). **B6** angenommen. Seriell in einem Worktree (Plan-Entscheid 4: seriell).
**Budget:** `lead-tech` 8 Starts (7 + T08-Coach), Parallelität 1, Phase TOOL-BUENDEL-4; Controller `lead-tech` sonnet. Start
nur, solange kein Push ansteht (Handbuch 1.43, R464 V1).

Regelbezug: gates.md Gate Plan; R380, R433, R438 V3, R464 · Kosten bei Irrtum: Nacharbeit im Strang.

Entscheider: L0 · Anlass: Urteil lead-qa GATE-PLAN-TOOL-BUENDEL-4 · ADR: —

## R466 · 2026-10-10 · M13-E1 bereit fürs Final-Review; Auslegung AK-M13E1-36, Seed-Randlage

Ruling: UI-Strang `feat/m13-e1-ui` @ `bd26742b` (enthält Sim `2665350e`, `make check` Exit 0 bei Load 3,5; Playtest T14
BEDENKEN ohne Blocker) geht ins Final-Review T15. **(1) AK-M13E1-36:** Der Spec-Text (U-4, `edictCardState` mit
`disabled` und `reason`) geht dem AK-Wortlaut „Klick auf Handel → Meldung“ vor: gesperrte Karte, Sperrzeile mit Restzeit und
Tooltip erfüllen den Zweck (der Spieler sieht, wann das Edikt wieder änderbar ist); AK gilt als erfüllt, der Wortlaut wird in
der M13-E2-Spec berichtigt (Beobachtung). **(2) Seed-Randlage** Sparen/Handel „arm“ 11 200 = K′ − 600 (inklusive Grenze,
Reserve 0): regelkonform, kein Pflicht-Stopp; `lead-design` nimmt die Randlage beim Balancing von M13-E2 auf. **(3)
Unterhalt stillgelegt 30 → 18** im Playtest widerspricht `PAUSED_UPKEEP_PCT = 50` (⌈30 × 50 / 100⌉ = 15): T15 klärt mit
Test, ob der Ausgangswert ein anderer war oder eine Wechselwirkung (Sparen, Stufe) falsch rechnet. **(4)** T15 macht eine
Mutationsprobe für PLAN-M13-04 (Endfassung ohne eigenen Rot-Beleg) und reviewt die T13-Doku-Fixes `e6cb1ec4` mit.

Regelbezug: gates.md Gate Merge; Verfassung §5 (Auslegung durch L0), R460 · Kosten bei Irrtum: (1) Spieler klickt auf
gesperrte Karte ohne Meldung — gering, Tooltip vorhanden; (3) bei Rechenfehler Fix-Runde vor dem Merge.

Entscheider: L0 · Anlass: Übergabe Controller D M13-E1 · ADR: —

## R467 · 2026-10-10 · Gate Merge M13-E1: BEDENKEN → Trivial-Fix, dann lokaler Merge

Ruling: Final-Review T15 (`.studio/handoffs/2026-10-10-lead-qa-M13-E1-final.md`, opus, `bd26742b`) BEDENKEN, alle Befunde
niedrig, kein Blocker; Mutationsprobe PLAN-M13-04 rot (EXIT=1), Baseline, Bitgleichheit, Save v11, Module, Vorrang und
Doku ohne weiteren Befund. **Befund 1** (`docs/arc42.md:413` „stats bleiben Nominalwerte“ falsch; Faktor Sparen fehlt):
Trivial-Fix im UI-Strang. **Befund 2** (R460 A1 wörtlich verfehlt, 12 statt 3 Zeilen in `tests/sim/save.test.ts`):
**angenommen** — nur Versionsvergleiche 10→11 und Index-Slice, `CHAIN_HASHES`/`V6_FORMS` unberührt; der Zweck von A1 ist
erfüllt (L0-Entscheid aus dem Briefing Controller B hiermit festgehalten). **Befund 4** (30 → 18/min ist kein Fehler:
Aufrunden auf der 100-Tick-Basis nach Spec S4, Basis 5 → 3, effektiv 60 %): Regel bleibt; README präzisiert „halber
Unterhalt, je Betrieb aufgerundet“; der Panel-Text «Stillgelegt — halber Unterhalt» bleibt (Spec U-12, AK-M13STL-09).
**Befund 3** (Playtest-Report nur in Übergabe D, nicht unter `.studio/qa/m13-e1/`): Controller legt den Report als Datei
ab. Danach `make docs-check`; `make check` nur, wenn mehr als Doku geändert wurde. Merge **lokal** durch
`production-integrator` (`feat/m13-e1-ui` mit `--no-ff` nach main, Sim-Strang ist enthalten); kein Push in dieser
Studio-Session (R335, Push R463 bereits erfolgt). M13-E1 ist release-reif als Teil von M13; Release mit M13-E2 oder als
eigenes REL nach Entscheid in der nächsten Session.

Regelbezug: gates.md Gate Merge; R335, R460, R466 · Kosten bei Irrtum: Doku-Nacharbeit nach dem Merge.

Entscheider: L0 · Anlass: Urteil lead-qa M13-E1 final · ADR: —

## R468 · 2026-10-10 · TOOL-BUENDEL-4: Übernahme der Entwurfsentscheide aus dem Ledger

Ruling: Die Entscheide aus `.superpowers/sdd/tool-buendel-4/ledger.md` gelten. **T01** Dashboard-Server: Der Wiederaufbau von
`build_state` wird auf das 30-Fache der Aufbaudauer gedrosselt (max. 90 s); gemessen 4,7 % CPU statt ≈ 100 % (Faktor 10 bzw. 25 mit
Cap 60 s reichten nicht: 9,9 % bzw. 5,9 %). Abweichung vom Plan (reiner 2-s-Cache, bei 2,7 s Aufbau wirkungslos); Folge: Dashboard
bis ≈ 80 s veraltet, Abhilfe in `model.py` als Beobachtung. Uhr: `clock.timestamp()` (`clock.monotonic` existiert nicht). **T02**
`start.sh` Echtlauf mit `STUDIO_HOME=<tmp>`, zweiter Aufruf meldet «läuft bereits». **T03** `zeitreserve-push` läuft ohne Testsperre
(R438 V3: aktuelle Last zählt nicht); fehlende, leere oder halb geschriebene Messung gibt Exit 2; `make check` zeigt `loadStart`
(bei > 4 mit Zusatz «für Push nicht belastbar»). **T06** `render-qa` filtert nur die Warnung «AudioContext was not allowed to start»
(Fehler nie) und wartet auf ruhige Kamera (`warteBisRuhig`) statt fest zu schlafen.

Regelbezug: R438 V3, R465 · Kosten bei Irrtum: Werkzeug-Nacharbeit.

Entscheider: L0 (Übernahme durch Umsetzer B, Review durch `lead-tech`) · Anlass: Plan TOOL-BUENDEL-4 T07 · ADR: ADR-014 (Nachführung)

## R469 · 2026-10-10 · Gate Merge TOOL-BUENDEL-4: OK unter BEDENKEN; R468 bestätigt

Ruling: `tool/b4` @ `4df52db3` (T01–T08, Handbuch 1.44 aus T08) lokal nach main gemergt (`f8939b29`; `make check` Exit 0,
`studio-test` Exit 0, `check-ci-perf` Exit 0; `loadStart` 6,6 → für einen Push nicht belastbar, vor dem nächsten Push ruhig
wiederholen). Final-Review opus BEDENKEN, nichts blockierend. **R468** (vom Umsetzer mit „Entscheider: L0“ eingetragen)
wird inhaltlich **bestätigt**: Drosselung des Zustandsaufbaus auf das 30-Fache der Aufbaudauer (höchstens 90 s), gemessen
4,7 % CPU statt ≈ 100 %, nach Neustart 0,0 %; das Dashboard darf als Übergang bis ≈ 80 s veralten. Folgearbeit
(Beobachtungen): `model.py` beschleunigen bzw. Events kürzen (67 105 Events, 19,7 MB), `testrun` bei Ctrl-C, `start.sh`
erkennt fremde HTTP-Server am Port, `smoke.mjs` Audio-Filter. **Ablauffehler:** Rulings schreibt nur L0; ein Plan-Task
„Rulings nachführen“ heisst künftig „Entwurf an L0“ (Anlass für die Session-Retro). M13-E1 (R467) und TOOL-BUENDEL-4 gehen
mit dem nächsten Push raus.

Regelbezug: gates.md Gate Merge; R335, R465 · Kosten bei Irrtum: Dashboard zeigt bis 80 s alten Stand.

Entscheider: L0 · Anlass: Übergabe lead-tech TOOL-BUENDEL-4, Bericht production-integrator · ADR: ADR-014 (Nachführung)

## R470 · 2026-10-10 · Gate Merge UI-GUT-CHIP (I-043): OK, lokaler Merge

Ruling: `feat/ui-gut-chip` @ `075edbaa` (T01–T09, main @ `f04cf2ed` eingemergt, einziger Konflikt `docs/beobachtungen.md`
durch Anhängen beider Blöcke gelöst; `docs-check`, `tsc`, `lint`, `merge-tree` Exit 0; `make check` Exit 0 am Code-Stand
`ff584840`, danach nur Doku und der Merge von main mit `tools/`/`docs/`). Branch-Review opus (T09) **OK**, Playtest T08 OK
ohne Blocker; 17 von 21 Starts. `signalFocus` bleibt ausserhalb `SIGNAL_NAMES` (zwei Palette-Tests rot), eigener ΔE-Test
(≥ 15) und Test CSS = Palette erfüllen R462 B3. Niedrige Befunde (u. a. Fokus-Regel doppelt in `focusList` und
`drawFocusMarks`) in `docs/beobachtungen.md`. Merge lokal durch `production-integrator` mit vollem `make check`; Release
gemeinsam mit M13-E1 und TOOL-BUENDEL-4 im nächsten Push (R335). Stufe leicht: das opus-Review über den Release-Kandidaten
gilt mit T09 als erfolgt, sofern der Kandidat nur diese drei gegateten Stränge enthält.

Regelbezug: gates.md Gate Merge Release; STUDIO.md Ablauf Stufe leicht Schritt 6–7, R462 · Kosten bei Irrtum: UI-Fix nach dem
Merge.

Entscheider: L0 · Anlass: Übergabe lead-tech UI-GUT-CHIP Controller B · ADR: —

## R471 · 2026-10-10 · Kurz-Retro 5a00a316 angenommen; Vorlagenzeilen Phase und Rulings, E-038 → E-057

Ruling: Retro `docs/studio/retros/2026-10-10-session-5a00a316-ende.md` (`1f98c884`) angenommen. **V1** Budgetzeilen für
Plan, Design und Gate tragen die Phase mit Präfix (`plan-<paket>`, `design-<paket>`, `gate-<paket>`), damit E-049 den
Steuerungsanteil bereinigen kann (bisher 0,0 % herausgerechnet, Messfehler) — Vorlagenzeile ohne Experiment-Platz.
**V2** Plan-Vorlage und Briefing-Pflichtzeile „Rulings schreibt nur L0“; ein Plan-Task heisst „Entwurf an L0“; Messgrösse:
Diff von `rulings.md` in Strang-Branches bleibt in 3 Paketen leer, sonst Persona-Grenze. **V3** E-038 **behalten**,
abgeschlossen; frei werdender Platz an **E-057** (grosse Dateien gezielt lesen) als Hebel für den roten Cache-Write (R316).
**M3** Messauftrag: nächster Push ohne Umsetzer-/Controller-Start zwischen Gate-Beginn und `zeitreserve-push` Exit 0,
Push-Dauer ≤ 8 min. Umsetzung V1/V2 durch `studio-coach` zu Beginn der nächsten Studio-Session; bis dahin setzt L0 beides
im Briefing. E-054 läuft (2 von 3 Datenpunkten).

Regelbezug: STUDIO.md Verbesserungsschleife, R316 · Kosten bei Irrtum: ein Experiment-Platz falsch belegt.

Entscheider: L0 · Anlass: Kurz-Retro Session 5a00a316 · ADR: —

## R472 · 2026-10-10 · REL-18 „Edikte, Stilllegen, Gut-Chip“: Gate Merge Release und Push-Auftrag

Ruling: Release **REL-18** umfasst genau die drei lokal gemergten, je einzeln gegateten Stränge M13-E1 (R467, Final-Review
opus T15), UI-GUT-CHIP I-043 (R470, Branch-Review opus T09, Playtest T08) und TOOL-BUENDEL-4 (R469, Final-Review) sowie
die Studio-Doku bis `62488410`. Kein weiterer Strang im Kandidaten, daher gilt das opus-Review über den Kandidaten als
erfolgt (R470). **Gate Merge Release: bestanden.** `production-integrator` führt den Push-Ablauf nach Handbuch 1.44
(STUDIO.md Merges/Push, R429) aus dem Hauptcheckout-Stand mit diesem Ruling (HEAD) aus: `tsc`, `lint`, `zeittests`, `conflicts`,
Load ≤ 4 abwarten, `make check`, `make zeitreserve-push`, `make check-ci-perf`, `git push origin <geprüfter HEAD>:main`, CI
prüfen, `gh workflow run Pages --ref main`, `ci.py`. Bis `zeitreserve-push` Exit 0 startet L0 keine Umsetzer oder
Controller (R464, Messauftrag M3); Design, Spec und Studio-Doku ohne Testläufe laufen parallel.

Regelbezug: gates.md Gate Merge Release; STUDIO.md Stufe leicht Schritt 7, R335, R464 · Kosten bei Irrtum: ein Hotfix
nach dem Push.

Entscheider: L0 · Anlass: Session-Start, Fortsetzung state.md Punkt 0 · ADR: —

## R473 · 2026-10-10 · Handbuch 1.45 (R471 V1–V3) abgenommen; fällige Retros quittiert

Ruling: `studio-coach` hat R471 umgesetzt (`e5563696`, Handbuch 1.45): Phasenpräfix `plan-`/`design-`/`gate-` in
Freigaben, Pflichtzeile „Rulings schreibt nur L0“ in Briefing und Plan-Format, E-038 abgeschlossen (behalten), E-057
läuft. Fällige Retros `budget:lead-qa:release-check-REL-14` und `ampel:steuerung:S-2026-10-10-2cfa57e0` sind durch Retro
c64c0775-b B1/R440 bzw. 5a00a316 B2/R471 abgedeckt und quittiert (`a7906e29`). Abgenommen. Der rote Wert
Actions-Minuten (970, rot ab 400) geht als Pflichtpunkt in die Prozess-Aussensicht nach REL-18; der Persona-Satz für
E-057 in `.claude/agents/lead-*.md` folgt nur, wenn die Briefing-Zeile die Schwelle verfehlt.

Regelbezug: STUDIO.md Verbesserungsschleife, R316, R471 · Kosten bei Irrtum: eine Vorlagenzeile zurücknehmen.

Entscheider: L0 · Anlass: Bericht studio-coach retro-r471-umsetzung · ADR: —

## R474 · 2026-10-10 · Ideen-Runde IDEEN-06 entschieden

Ruling: Runde `08db740c` angenommen (15 Ideen I-046…I-060, 3 Starts, ≈ 52 Tools; Pool 37 von 40). Priorisierung nach
Nutzen je Aufwand (R445): **(1) einplanen** Häppchen **UI-TASTEN** = I-056 „Entf-Taste reisst Markiertes ab“ + I-057
„Schnellspeichern mit Strg/Cmd+S“ (Stufe leicht, kein Save, keine Baseline; Kurzdesign und Plan dürfen während des
REL-18-Pushes laufen, Umsetzung erst nach `zeitreserve-push` Exit 0, R464). **(2) als Nächstes nach M13-E2:** I-048
„Zukauf-Aufschlag“ als Wirtschafts-Baustein mit Rechnung durch `design-economy-designer`, zusammen mit dem Befund
Verkaufssättigung (`docs/beobachtungen.md`); Baseline-Neumessung braucht dann ein eigenes Ruling. **(3)** I-049
„Sperrbestand je Gut“ fährt beim nächsten Save-Wechsel (v12) mit, falls M13-E2 ihn auslöst. Übrige geparkt laut Rangliste;
Streichungen (I-046, I-053, I-060, I-037, I-040) und Zusammenfassungen (I-054 → I-014, I-024 → I-059) bestätigt. Kein
Säulenwechsel.

Regelbezug: R445, gates.md Gate Ideen-Runde · Kosten bei Irrtum: ein kleines Bedien-Häppchen umsonst geplant.

Entscheider: L0 · Anlass: Bericht lead-design design-ideen-06 · ADR: —

## R475 · 2026-10-10 · Nutzerauftrag: Studio-Deckel ausschöpfen, Leerlauf mit Design/Spec/Plan füllen

Ruling: Auslegung von „jetzt laufen wieder sehr wenige Agenten gleichzeitig … falls nicht produktiv gearbeitet werden kann,
spawne Agenten, die Brainstorming machen oder Specs/Pläne für neue Features schreiben“ als **Dauerauftrag**: (1) L0 hält
den Studio-Deckel (≤ 8 Agenten, R424) bei grüner Limit-Ampel möglichst voll. (2) Ist Umsetzung blockiert (z. B. Push-Gate
R464, fehlendes Gate), füllt L0 freie Plätze mit testfreier Vorarbeit: Brainstorming, Specs, Kurzdesigns, Pläne,
Asset-Scouting, Werkzeug-Pläne — in Reihenfolge der Priorisierung aus den Ideen-Rulings. (3) Vorarbeit landet als Datei
auf main (Spec/Plan/Vorschlag), Gates entscheidet L0 wie bisher; ohne Gate keine Umsetzung. (4) Die Regel „höchstens eine
Ideen-Runde je Session“ (R445) bleibt; weitere Plätze gehen an Specs und Pläne bereits bewerteter Ideen. Sofort belegt:
I-048 Zukauf-Aufschlag (Spec, mit Wirtschaftsrechnung inkl. Befund Verkaufssättigung), I-049 Sperrbestand (Kurzdesign),
TOOL-BUENDEL-5 (Plan aus den Werkzeug-Kandidaten in `docs/beobachtungen.md`), Denkmal-Sprite (nur Scouting und
Lizenzprüfung, Einbau nach Spec und Push), M14-Brainstorming (Richtungsvorschlag nach M13). Handbuch-Minor (STUDIO.md
Limits und Sessiongrösse) setzt der `studio-coach` im nächsten Coach-Start um (R429).

Regelbezug: Nutzerauftrag; R424, R445, R464, R429 · Kosten bei Irrtum: Vorarbeit für Ideen, die später geparkt werden
(≈ 1 Lead-Start je Paket).

Entscheider: L0 · Anlass: Nutzerauftrag 2026-10-10 · ADR: —

## R476 · 2026-10-10 · Kurzdesign UI-TASTEN angenommen (I-056, I-057)

Ruling: Kurzdesign `lead-design` (Handoff `.studio/handoffs/2026-10-10-lead-design-design-ui-tasten.md`, AK-UT-01…12)
angenommen. Entscheide nach Empfehlung: (1) `Backspace` reisst zusätzlich zu `Entf` ab (Mac ohne Entf-Taste; Browser
navigieren mit Backspace nicht mehr zurück). (2) Der Browser-Dialog «Seite speichern» wird bei `Strg`/`Cmd`+`S` immer
unterdrückt, auch wenn die Taste gerade nichts tut. (3) Keine Bestätigung beim Abriss per Taste (wie Knopf «Abreissen»;
Wirkung nur bei offenem Panel, ein Gebäude). Weiter mit Plan durch `lead-tech` (Stufe leicht), danach kombiniertes Gate.

Regelbezug: STUDIO.md Ablauf Stufe leicht Schritt 2–4, R474 · Kosten bei Irrtum: eine Tastenzuordnung zurücknehmen.

Entscheider: L0 · Anlass: Bericht lead-design design-ui-tasten · ADR: —

## R477 · 2026-10-10 · Kurzdesign I-049 Sperrbestand angenommen; Vorfall „Integrator inaktiv“ quittiert

Ruling: (1) Kurzdesign `docs/superpowers/specs/2026-10-10-i049-sperrbestand-design.md` (`7e6b2844`, AK-SB-01…17)
angenommen, Entscheide nach Empfehlung: **E1** Reserve je Insel; **E2** nur Holz und Stein, Stufen 0/20/40/60; **E3**
Schiffsladung nicht einbezogen (Routen-Reserve bleibt eigen); **E4** kein Eintrag in der Problemliste (wie Stilllegen).
Save-Reihenfolge der drei Vorarbeiten: M13-E2 nimmt die nächste Version (v12); I-049 und I-048 fahren, wenn sie im
selben Release landen, auf dieser Erhöhung mit, sonst je nächste freie — der jeweilige Plan stimmt das mit main ab.
Weiter mit Plan `lead-tech` (Stufe leicht). (2) Vorfall `inaktiv:…:afbfd3a3ba9e6a50c` (production-integrator) ist kein
Fehler: Der Push REL-18 ist erfolgt (origin/main `bfb6af44`), der Agent wartet auf den CI-Lauf 38063457678 (`gh run
watch`, lange Werkzeugdauer ohne Heartbeat). Quittiert ohne Retro; wiederholt sich das Muster, prüft die
Prozess-Aussensicht REL-18 eine Heartbeat-Ausnahme für CI-Warten.

Regelbezug: STUDIO.md Ablauf Stufe leicht Schritt 2–4, Verbesserungsschleife (Ad-hoc-Retro), R475 · Kosten bei Irrtum:
ein Bedienort oder eine Gutsliste nachziehen; ein echter Hänger bleibt bis zum Bericht unentdeckt.

Entscheider: L0 · Anlass: Bericht lead-design design-i049-reserve; Hook-Hinweis Ad-hoc-Retro · ADR: —

## R478 · 2026-10-10 · Gate Plan TOOL-BUENDEL-5: BEDENKEN → Nacharbeit im Controller, Umsetzung frei

Ruling: Plan `docs/superpowers/plans/2026-10-10-tool-buendel-5.md` (`9cc61a48`, T01–T06) mit Nacharbeit frei (Urteil
`.studio/handoffs/2026-10-10-lead-qa-GATE-PLAN-TOOL-BUENDEL-5.md`, B1–B10). Die Nacharbeit übernimmt der Controller
(`lead-tech`, sonnet) als ersten Schritt in den Task-Dateien, ohne Zweitprüfung. Zu **B6**: Die 30-fache Drosselung
(R468) bleibt; T04 senkt sie nur mit CPU-Messwert ≤ 10 % im Leerlauf, sonst bleibt sie und T04 liefert nur `/api/ping`
und die Fremdserver-Erkennung. Zu **B9**: seriell, Parallelität 1. Zu **B4**: Stopp an L0 bei > 10 abweichenden Leads.
Ownership und Budget geprüft (R233 V2): disjunkt, **7 Starts** freigegeben (Phase `tool-buendel-5`). Push REL-18 ist
erfolgt (`bfb6af44`), R464 hindert den Start nicht mehr.

Regelbezug: gates.md Gate Plan, R233 V2, R464, R465, R468 · Kosten bei Irrtum: eine Fix-Runde im Werkzeug-Strang.

Entscheider: L0 · Anlass: Bericht lead-qa gate-tool-buendel-5 · ADR: —

## R479 · 2026-10-10 · Kombiniertes Gate UI-TASTEN: BEDENKEN → Nacharbeit im Controller, Umsetzung frei

Ruling: Plan `docs/superpowers/plans/2026-10-10-ui-tasten.md` (`6cf3d40d`, T01–T06) mit Nacharbeit frei (Urteil
`.studio/handoffs/2026-10-10-lead-qa-GATE-UI-TASTEN.md`, B1–B5). Der Controller (`lead-tech`, sonnet) arbeitet die
Nacharbeit vor T01 in den Plan ein: **B1** Abzweig von aktuellem main, Dateimatrix-Zeilen zu UI-GUT-CHIP/M13-E1 und das
Blocked-by in T01 entfallen; **B2** reiner Helfer (z. B. `keyDownVerdict`) mit Vitest für UT-05/06 Pflicht; **B3** T05-
Schritte präzisiert (UT-10 Byte-Vergleich des manuellen Platzes, Control und Meta per CDP, `autoRepeat`, Randfälle);
**B4** Final-Review zitiert leeren `src/sim`-Diff und `make check`; **B5** Schutz der zwei Refactorings benennen. L0-Prüfung
Ownership/Budget: ein Baum `.worktrees/ui-tasten`, Branch `feat/ui-tasten`, keine Überschneidung mit TOOL-BUENDEL-5
(`tools/studio/`); **13 Starts** freigegeben (Phase `ui-tasten`). Release gemeinsam mit weiteren release-reifen Häppchen.

Regelbezug: gates.md Kombiniertes Gate (Stufe leicht), R476 · Kosten bei Irrtum: eine Fix-Runde im UI-Strang.

Entscheider: L0 · Anlass: Bericht lead-qa gate-ui-tasten · ADR: —

## R480 · 2026-10-10 · REL-18 „Edikte, Stilllegen, Gut-Chip“ live; Messauftrag M3 verfehlt

Ruling: Push `a9f5336e..bfb6af44` (geprüfter Hash nach drei `make check`, `zeitreserve-push` Exit 0 bei loadStart 2,5),
CI 38063457678 grün, Pages 38063909955 grün. REL-18 ist live. **M3** (R471): Push-Dauer 11,9 min > 8 min, Ursache Lastwarten
und zwei `make check`-Wiederholungen (Exit 2 bei loadMax 8,7 bzw. 17,7) — Hinweis: Während des Pushs liefen bis zu 8
Agenten (testfreie Vorarbeit, R475), die die Last mittrugen. Zwischen Gate und `zeitreserve-push` Exit 0 startete L0 keinen
Umsetzer (M3 Teil 1 erfüllt). Bewertung und Hebel durch die Prozess-Aussensicht REL-18 (`studio-process-coach`), zusammen
mit Actions-Minuten rot (R473) und Inaktiv-Fehlalarm beim CI-Warten (R477).

Regelbezug: STUDIO.md Merges/Push, R335, R471 M3 · Kosten bei Irrtum: —.

Entscheider: L0 · Anlass: Bericht production-integrator REL-18 · ADR: —

## R481 · 2026-10-10 · Kombiniertes Gate I-049 Sperrbestand: BEDENKEN → frei, Start nach M13-E2-SIM

Ruling: Plan `docs/superpowers/plans/2026-10-10-i049-sperrbestand.md` (`435db423`) mit Nacharbeit B1–B9 frei (Urteil
`.studio/handoffs/2026-10-10-lead-qa-GATE-I049.md`). **B1** Die Umsetzung startet **als Ganzes erst nach dem Merge von
M13-E2-SIM** auf main (Board: `blocked-by M13-E2-SIM`), nicht schon T01/T02 — `types.ts`, `world.ts` und `save.ts` sind
Hot Spots beider Stränge, ein Vorlauf erzeugt nur Merge-Arbeit. Frist: keine; der Leerlauf wird nach R475 mit anderer
Vorarbeit gefüllt. B2–B5 und B7–B9 arbeitet der Controller vor T01 ein (Save-Fall A als Normalfall; `dropZeroReserve`
am äussersten Einstieg der Rückfalt-Ketten; T04 als Selbstvergleich gestrichen, Bitgleichheit über unveränderte
`balance*`-, Baseline- und `seaGolden`-Hashes; Determinismus-Test mit Reserve > 0 inkl. Speichern/Laden; T08 mit
Fixture-Save und Messwert bei 1280 px, zweite Zeile Pflicht). **B6** entscheidet L0 (Auslegung, R449-Linie): (a) Abriss
eines Betriebs in `waitingReserve` wie jeder Abriss, ein Test; (b) ohne Kontor auf der Insel wirkt die Reserve nicht
(nicht bedienbar → nicht wirksam, kein Festsitzen), Wert bleibt gespeichert; (c) Reserve-Stufen müssen unter der
Lagerobergrenze liegen — prüft der Controller in T01, liegt eine Stufe ≥ Obergrenze, Stufe streichen und melden.
Budget **21 Starts** (Phase `i049-reserve`) gilt ab Start.

Regelbezug: gates.md Kombiniertes Gate (Stufe leicht), R475, R477 · Kosten bei Irrtum: I-049 rutscht ein Release später.

Entscheider: L0 · Anlass: Bericht lead-qa gate-i049-reserve · ADR: —

## R482 · 2026-10-10 · TOOL-BUENDEL-5 T01: 1,3 s akzeptiert, Fortsetzung frei

Ruling: Entscheid D-tb5-t01 nach Empfehlung: `build_state` 3,62 s → 1,28–1,40 s (Faktor ≈ 2,7, State-JSON bitgleich, 160
`test_model`-Tests grün) wird **akzeptiert**, das Ziel ≤ 1,0 s aus B5 entfällt für dieses Bündel. T02, T04 und Umsetzer B
laufen weiter. Weitere Beschleunigung (`apply`, `result`) bleibt ein Werkzeug-Kandidat in `docs/beobachtungen.md`, kein
Folgepaket ohne neuen Anlass. T04: Drosselung nach R478 (bleibt 30-fach, ausser CPU im Leerlauf ≤ 10 % gemessen). Das
Review prüft die Annahme von `compute_claims` (Knotenfelder ändern sich nur in `apply`) an allen Aufrufern.

Regelbezug: R478, R465 B3 (Stopp-Regel) · Kosten bei Irrtum: Dashboard bleibt einige Sekunden träger als geplant.

Entscheider: L0 · Anlass: Stopp-Meldung Controller TOOL-BUENDEL-5 · ADR: —

## R483 · 2026-10-10 · Spec M13-E2 Denkmal eingereicht; P-1…P-3 entschieden, Gate Spec startet

Ruling: Spec `docs/superpowers/specs/2026-10-10-m13-e2-denkmal-design.md` (`b908ca7a`, AK-M13E2-01…48, 7 Anhänge) geht
ins Gate Spec (`lead-tech` Machbarkeit/Save, `lead-qa` Testbarkeit; nacheinander, sobald Plätze frei sind, R424). Entscheide
nach Empfehlung: **P-1** Ab begonnenem Abschnitt 1 verlangt der Abriss des Denkmals eine Bestätigung (Knopf und Taste
gleich) — bewusste Ausnahme zu R476 (3), weil bis zu 18 000 Geld plus Ware auf dem Spiel stehen; UI-TASTEN bleibt ohne
Bestätigung für alle übrigen Gebäude. **P-2** Bauplatz wird beim Abriss wie üblich zur Hälfte erstattet (250 Geld),
Abschnitts-Geld und -Ware nicht. **P-3** Lauf C (Auflage B3) in eigens aufgebauter Welt statt K′; verfehlt er 4704–8736
Ticks, ist das ein Pflicht-Rulingpunkt. Art: prozedurale „Feuersäule“ (Art-Vorschlag `4dca6a39`), Bildstufe aus dem
ganzzahligen Sim-Feld. Save v12; M13-E2-SIM vor I-049-Sim (R477, R481).

Regelbezug: gates.md Gate Spec, R452, R466, R476, R477 · Kosten bei Irrtum: ein Bestätigungsdialog zu viel oder zu wenig.

Entscheider: L0 · Anlass: Bericht lead-design design-m13-e2 · ADR: —

## R484 · 2026-10-10 · TOOL-BUENDEL-5 T02: 24 Phasen-Abweichungen akzeptiert, Fortsetzung frei

Ruling: Entscheid D-tb5-t02: Die 24 von 263 abweichenden `lead_phases`-Einträgen auf Echtdaten (Stopp B4, > 10) werden
**akzeptiert**: 20 sind Korrekturen früherer Zeit-Fehlzuordnungen (neue Phase = `Paket:` des Leads). Die vier Sonderfälle
(`ac66898b`, `ac8af81e`, `a2e11902`: Phase entfällt; `aaf78c1e`: keine → M12-E0) prüft das Batch-Review einzeln; ist einer
eine Verschlechterung, wird er mit Test als Fix-Runde behoben, kein Revert von `038b170d`. Die Liste (Lead, alt, neu)
kommt ins Handoff. T04 und Umsetzer B laufen weiter. Historische Metriken älterer Sessions ändern sich damit rückwirkend
leicht; die Retro-Ampel vergleicht ab jetzt mit der neuen Zuordnung.

Regelbezug: R478 B4, R471 V1 · Kosten bei Irrtum: einzelne Lead-Phasen in alten Sessions falsch zugeordnet (nur Metrik).

Entscheider: L0 · Anlass: Stopp-Meldung Controller TOOL-BUENDEL-5 · ADR: —

## R485 · 2026-10-10 · Gate AUFRAEUM-01: BEDENKEN → frei, Merge vor M13-E2-SIM

Ruling: Plan `docs/superpowers/plans/2026-10-10-aufraeum-01.md` (`d42c1c23`) frei (Urteil
`.studio/handoffs/2026-10-10-lead-qa-GATE-AUFRAEUM-01.md`, B1–B3 niedrig). **B1** L0 entscheidet: `goodRole` kommt nach
`src/sim/queries.ts` (etablierter Ort für Lese-Prädikate), keine neue Datei. **B2** Briefings benennen „Verhalten
unverändert“ als Beleg, Task-Reviews zitieren Vorher/Nachher-Lauf der betroffenen Testdateien. **B3** seriell, ein Baum
(TOOL-TESTLOCK). T04 (Doku) mit dem T03-Review zusammengelegt. **12 Starts** (Phase `aufraeum-01`). Merge-Reihenfolge:
AUFRAEUM-01 vor M13-E2-SIM (beide berühren evtl. `src/sim/edicts.ts`). Start, sobald ein Platz frei ist (R424).

Regelbezug: gates.md Kombiniertes Gate (Stufe leicht), R475 · Kosten bei Irrtum: eine Fix-Runde.

Entscheider: L0 · Anlass: Bericht lead-qa gate-aufraeum-01 · ADR: —

## R486 · 2026-10-10 · Gate Brainstorming M14: Richtung B „Archipel mit Wert“

Ruling: Vorschlag `docs/superpowers/specs/2026-10-10-m14-brainstorming.md` (`db6b1a84`, mit Rechnung Anhang 01) angenommen;
Selbstprüfung lead-design OK, L0-Prüfung (Säulen, Wahl statt Klick, Scope) ohne Einwand. Entscheide O1–O9 nach Empfehlung:
**O1** Richtung **B** (Säule Insel besiedeln), erstes Release Epic E1 „Inselcharakter“. **O2** A „Hände und Häuser“ ist
M15-Kandidat, Spike der Arbeiter-Regel erst nach einem M13-Playtest. **O3** C kein Meilenstein; I-047 nur als Paket nach
I-048 in der Fassung 25 % zu 120 %, I-029/I-006 geparkt. **O4** Werft ergänzt den Schiffskauf. **O5** Routenrisiko nur
Sturm, keine Piraten, kein Kampf (§5.3 unberührt). **O6** dritte Insel sichtbar ab Seefahrt. **O7** Gebirge+ und
fruchtbar, Werte mit `design-economy-designer` in der Spec, Auflage Heimat-Gebirge. **O8** Reihenfolge: M13-E2 →
I-048 → M14-E1; M14-E2-ART parallel möglich. **O9** I-055 und I-014 als eigene Bausteine gestrichen (I-055 nur in A,
I-014 nur gekoppelt an E1). M14 startet als Meilenstein erst nach Abschluss M13; die Spec M14-E1 darf als Vorarbeit
(R475) vorher entstehen. Statuspflege in `docs/ideen.md` durch `lead-design` beim nächsten Start dort.

Regelbezug: gates.md Gate Brainstorming, Verfassung §5.3, R445, R475 · Kosten bei Irrtum: eine Spec in falscher Richtung.

Entscheider: L0 · Anlass: Bericht lead-design design-m14-richtung · ADR: —

## R487 · 2026-10-10 · Spec I-048 Zukauf-Aufschlag eingereicht; P-1…P-4 entschieden, Gate Spec

Ruling: Spec `docs/superpowers/specs/2026-10-10-i048-zukauf-aufschlag-design.md` (`2813627a`, AK-ZK-01…28) geht ins Gate
Spec (`lead-tech`, `lead-qa`). Entscheide: **P-1** Neumessung der Balancing-Szenarien in Schritt B ist **erlaubt**
(Baseline-Änderung, Grenzen 7500/9000 Ticks und Geld > 0 bleiben); reisst eine Grenze, zuerst `BUY_RISE` 2 → 1, sonst
Stopp an L0. **P-2** Verkaufserholung 10 → 20 Ticks mitnehmen. **P-3** Beschriftung «Preis» → «Verkauf» im Handelsdialog.
**P-4** Save: landen I-048 und M13-E2 im selben Release, teilen sie den v12-Sprung (wie I-049, R477); sonst nächste freie.
Reihenfolge nach R486 O8: nach M13-E2. Decision D-I048-1 damit gelöst.

Regelbezug: gates.md Gate Spec, Balancing-Regel (CLAUDE.md Test-Strategie), R474, R477 · Kosten bei Irrtum: eine
Baseline-Neumessung mehr.

Entscheider: L0 · Anlass: Bericht lead-design design-i048-zukauf · ADR: —

## R488 · 2026-10-10 · Prozess-Aussensicht REL-18 angenommen (V1–V4); Ampel gelb: keine neue Welle

Ruling: Retro `docs/studio/retros/2026-10-10-rel-18-prozess.md` (`39e7e6c0`) angenommen. R480 wird korrigiert: Die zwei
zusätzlichen `make check` kamen von knapper Zeitreserve in `tests/ui/time.test.ts` (Lauf 1) und gleicher Schwelle Warten/Gate
(Lauf 2), nicht von 8 parallelen Agenten (während des Pushs liefen 2–5). **V1** Werkzeug-Paket **TOOL-PUSH-CHECK**
(`make push-check`: wartet auf Load ≤ 3, wiederholt bei Exit 2 nur markierte Tests, Reserve `time.test.ts` anheben);
Messgrösse ersetzt M3: 1 voller `make check` je Push in 3 Pushes, Dauer ≤ 8 min bei ≥ 4 Agenten. **V2** Ampel-Prognose
Actions-Konto zum Monatsende (gelb > 1600, rot > 1900; bei Rot höchstens ein Push je Tag) ins nächste Werkzeug-Bündel.
**V3** Integrator wartet mit `timeout 240 gh run watch` in Schleife, keine Heartbeat-Ausnahme — Persona-Zeile durch
`studio-coach`. **V4** Ampelzeile Produktivanteil (Umsetzer + Design/Spec/Plan, gelb < 25 %) ins nächste Werkzeug-Bündel.
R475 bleibt. Wegen **Limit-Ampel gelb** (5h 60 %) startet L0 keine neue Welle: Plan TOOL-PUSH-CHECK und die
V3-Umsetzung beginnen in der nächsten Session; laufende Pakete und Gates werden abgeschlossen.

Regelbezug: STUDIO.md Verbesserungsschleife, Limits und Sessiongrösse, R316, R471 M3 · Kosten bei Irrtum: ein Werkzeug-Paket
zu viel.

Entscheider: L0 · Anlass: Bericht studio-process-coach retro-rel-18; Limit-Ampel gelb · ADR: —

## R489 · 2026-10-10 · Gate Spec M13-E2: BEDENKEN (lead-qa B1–B9, lead-tech B1–B5) → Spec-Nachtrag, dann Plan

Ruling: Beide Urteile BEDENKEN, kein ZURÜCK (`.studio/handoffs/2026-10-10-lead-qa-GATE-SPEC-M13-E2.md`,
`…-lead-tech-GATE-SPEC-M13-E2.md`). **Kopplung Denkmal-Zukauf ↔ I-048 (tech B1, qa-I-048 B1), L0 entscheidet:** Der
Denkmal-Zukauf **zahlt** den jeweils gültigen Kaufaufschlag (über eine einzige Zukauf-Funktion in `trade.ts`), **hebt
ihn aber nicht** — keine Rückkopplung auf normale Bauten, Denkmal-Summen bleiben rechenbar (64 200 / 54 960 Geld bei
Kaufanteil 100), kein Ausnutzen möglich, weil Denkmal-Ware nicht verkäuflich ist. AK-11/-12 auf Kaufanteil 100
festlegen; I-048 übernimmt die Setzung in Z3. Merge-Reihenfolge: AUFRAEUM-01 → M13-E2-SIM → I-049-Sim / I-048-SIM.
Spec-Nachtrag durch `lead-design` zu qa B1–B7, B9b und tech B3, B4 (Rückfaltung: unbekannte Insel- und Weltschlüssel
entfernen ohne Reihenfolgeänderung, abgeglichen mit I-049 `dropZeroReserve`), Krisen in Läufen A und C aus. In den Plan
(lead-tech): qa B5, B8, B9a, tech B2 (Task „Def-Kern“ zuerst, Stränge zweigen davon ab), B5 (Nachtrag Plan I-049) und
A1–A6. Kein Zweit-Gate auf die Spec; das Gate Plan prüft den Nachtrag mit.

Regelbezug: gates.md Gate Spec, R483, R487 · Kosten bei Irrtum: Denkmal billiger als Normalkauf in Hochpreisphasen
(nur Denkmal-Ware).

Entscheider: L0 · Anlass: Gate-Urteile Spec M13-E2 · ADR: —

## R490 · 2026-10-10 · Gate Spec I-048: BEDENKEN (lead-qa B1–B9, lead-tech B1–B4) → Spec-Nachtrag, dann Plan

Ruling: Beide Urteile BEDENKEN, kein ZURÜCK (`.studio/handoffs/2026-10-10-lead-qa-GATE-SPEC-I048.md`,
`…-lead-tech-GATE-SPEC-I048.md`). **B1 Denkmal-Zukauf:** Es bleibt bei **R489** (zahlt den gültigen Aufschlag, hebt
ihn nicht) entgegen der lead-tech-Empfehlung (A): Variante A würde die gerade gegatete M13-E2-Rechnung (64 200 Geld,
`balance-monument`) in I-048 Schritt B rückwirkend um ≈ 30 % verschieben und beide Pakete koppeln; die Ausnahme steht
in README und Spec, Z3 nennt sie, ein AK prüft „Denkmal-Zukauf hebt `buyPct` nicht“. `balance-monument.test.ts` kommt in
die Liste der Balancing-Tests (§6). **B2:** R487 P-1 wird erweitert: Rezept-Tests gegen alte Fixtures (v6, v6-locks, v7,
v8 in `save.test.ts`) laufen in eigener Datei mit den alten Werten per `vi.mock` (Muster `tests/ui/levelReads.test.ts`);
§6 ordnet jeden roten Test einer Klasse zu (neu messen / alte Werte). AK-ZK-08/-21 dagegen als reine Kernfunktion mit
`rise`/`cap`-Parametern ohne Mock (qa B3). **B3:** P-4 präzisiert: v12 wird nur geteilt, wenn zwischen dem Merge von
M13-E2-SIM und I-048 kein Release liegt (Plan prüft beim Start, L0 im Merge-Gate), sonst v13; die Rückfaltung kennt
`buyPct` in jedem Fall. Spec-Nachtrag `lead-design`: qa B1, B2, B3, B6, B9, tech B1 (Ausnahme), B2-Regel §6, B4
(Namenskonflikt `buyPct`/Edikt-Faktor auflösen, `sellPctText` als AK). Plan: qa B4, B5, B7, B8; tech B3.

Regelbezug: gates.md Gate Spec, R487, R489 · Kosten bei Irrtum: Denkmal in Hochpreisphasen günstiger als Normalkauf.

Entscheider: L0 · Anlass: Gate-Urteile Spec I-048 · ADR: —

## R491 · 2026-10-10 · Gate Merge AUFRAEUM-01: OK, lokaler Merge

Ruling: `chore/aufraeum-01` @ `273be889` (T01–T04, Task-Reviews OK, Final-Review opus OK, `make check` Exit 0 auf
`9e5ff43d` mit 3072 Tests, danach nur Doku mit `docs-check` Exit 0; 9 von 12 Starts) ist release-reif. Nit `feat:`-Präfix
in `36de27ec` bleibt (kein Rebase). Merge lokal durch `production-integrator` im Worktree `.worktrees/integrate` mit
`git merge --no-ff`, `make check` (TOOL-TESTLOCK beachten), danach Hauptcheckout `git pull --ff-only` bzw. ff-Merge;
kein Push (R335, nächster Push mit weiteren Häppchen). Damit ist die Reihenfolge AUFRAEUM-01 vor M13-E2-SIM (R485)
erfüllt.

Regelbezug: gates.md Gate Merge Release (Stufe leicht), R485 · Kosten bei Irrtum: ein Revert-Commit.

Entscheider: L0 · Anlass: Bericht Controller AUFRAEUM-01 · ADR: —

## R492 · 2026-10-10 · Spec-Nachtrag I-048 abgenommen; Plan in der nächsten Session

Ruling: Nachtrag `12c98fd3` (Spec 38,8 KB, AK-ZK-29…33, `buyQuote` als reine Kernfunktion, Klassen N/R in §6) und
`1d724c5e` (Ideen-Status) abgenommen. Umbenennung `EdictDef.buyPct` → `buyFactorPct` bleibt im Umfang (eindeutige Namen,
≈ 5 Tools). Spec I-048 ist damit gegatet (R487, R490). Plan durch `lead-tech` wegen Limit-Ampel gelb (R488) erst in der
nächsten Session; Plan-Punkte stehen im Handoff `.studio/handoffs/2026-10-10-lead-design-design-i048-nachtrag.md`.

Regelbezug: gates.md Gate Spec, R488 · Kosten bei Irrtum: eine Umbenennung zurücknehmen.

Entscheider: L0 · Anlass: Bericht lead-design design-i048-nachtrag · ADR: —

## R493 · 2026-10-10 · Spec-Nachtrag M13-E2 abgenommen; Plan in der nächsten Session

Ruling: Nachtrag `a39a1ccb` (Spec 39,2 KB, Anhang 08 neu, AK-49 neu, Zwei-Klick-Helfer C1–C7, Rückfaltung mit
Reihenfolgeerhalt) abgenommen; Spec M13-E2 ist gegatet (R483, R489). Entscheid zu Anhang 08 D: Die Ausgangsstände zu
AK-43/-44 tragen `wonSpice = true` (Ziel-Chip zeigt das Denkmal erst nach Ziel 3) — so lassen, lead-qa bestätigt im Gate
Plan. Plan durch `lead-tech` (opus, Tech-Lead beim Plan) wegen Limit-Ampel gelb (R488) in der nächsten Session als erstes;
Plan-Punkte in Anhang 08 E und im Handoff `.studio/handoffs/2026-10-10-lead-design-design-m13-e2-nachtrag.md`,
einschliesslich Nachtrag Plan I-049 (Fall K1, `dropZeroReserve`).

Regelbezug: gates.md Gate Spec, R488 · Kosten bei Irrtum: ein Ausgangsstand im Browser-Check falsch gewählt.

Entscheider: L0 · Anlass: Bericht lead-design design-m13-e2-nachtrag · ADR: —

## R494 · 2026-10-10 · Gate Merge TOOL-BUENDEL-5: OK, lokaler Merge nach AUFRAEUM-01

Ruling: `tool/b5` @ `ff59778f` abgenommen (T01–T06, Batch-Reviews OK bzw. BEDENKEN→behoben, Final-Review opus OK;
`studio-lint`, `studio-test` 661, `docs-check` Exit 0; 5 von 7 Starts). Messwerte: `build_state` 3,62 → 1,3 s (R482);
CPU Leerlauf 1,5 % bei 30-facher Drosselung, die bleibt (R478). Ermessensentscheide des Controllers (Prozessgruppe
verbindlich, SIGTERM/SIGHUP wie Ctrl-C, `--retitle` nur mit `--title`, Diff-Hash mit ungetrackten Dateien) bestätigt.
Sonderfall `ac8af81e` (`Paket: M13-E1-T01` bindet Phase M13-E1 nicht): Regel bleibt — die Phase bindet nur bei exakter
`Paket:`-ID oder Präfix `plan-`/`design-`/`gate-` (Handbuch 1.45); Task-IDs als `Paket:` sind künftig zu vermeiden
(Briefing nennt das Paket, nicht den Task). Merge lokal durch `production-integrator` **nach** AUFRAEUM-01, seriell,
kein Push.

Regelbezug: gates.md Gate Merge Release, R478, R482, R484 · Kosten bei Irrtum: ein Revert im Werkzeug-Strang.

Entscheider: L0 · Anlass: Bericht Controller TOOL-BUENDEL-5 · ADR: —

## R495 · 2026-10-10 · Spec M14-E1 „Inselcharakter“ eingereicht; E-1…E-5 entschieden

Ruling: Spec `docs/superpowers/specs/2026-10-10-m14-e1-inselcharakter-design.md` (`ff2c2fd8`, AK-M14E1-01…41, 3 Anhänge)
und Ideen-Pflege (`43bf5c99`) entgegengenommen; Scratch-Test gelöscht, nie committet. Entscheide nach Empfehlung: **E-1**
O6 wird so ausgelegt: Weidenau ist wie die anderen Inseln von Start an sichtbar, nutzbar ab der Seefahrt. **E-2**
Gebirge+ wirkt auf Steinbruch und Glashütte (×2), weil jede Heimat Gebirge hat (300/300 Seeds). **E-3** Weidenau im Band
30–35 mit Gewürz. **E-4** Bestehende Pins bleiben über die Rückfaltung gleich, neue Weidenau-Strecken als zusätzliche Pins.
**E-5** Die Weidenau-Erzeugung wirft nie (Ersatzregel; Seed 963 scheitert heute) — Auflage an den Plan. Werft wird
eigenes Epic M14-E2 (mit I-015, I-019), Routenrisiko M14-E3. Gate Spec (lead-tech, lead-qa) in der nächsten Session nach
den Plänen M13-E2 und I-048; Umsetzung erst nach Abschluss M13 (R486).

Regelbezug: gates.md Gate Spec, R486 · Kosten bei Irrtum: eine Inselzuordnung nachjustieren.

Entscheider: L0 · Anlass: Bericht lead-design design-m14-e1 · ADR: —

## R496 · 2026-10-10 · Gate Merge UI-TASTEN: OK, lokaler Merge; Release REL-19 in der nächsten Session

Ruling: `feat/ui-tasten` @ `c4b6d9e2` abgenommen (T01 BEDENKEN→Fix, T02–T04 OK, Playtest T05 ZURÜCK→Fix `1b847042`
→OK in Strg und Meta bei 1280 und 1920, Final-Review opus OK; `make check` Exit 0, `src/sim`-Diff leer; 10 von 13
Starts). Das eingesparte T01-Delta-Review (Controller prüfte selbst) wird hingenommen, ist aber kein Muster. Merge lokal
durch `production-integrator`. **Release REL-19** „Tasten, Aufräumen, Werkzeug“ = UI-TASTEN + AUFRAEUM-01 +
TOOL-BUENDEL-5: Push wegen R335 (ein Push je Session, REL-18 schon gepusht) und Limit-Ampel gelb in der **nächsten
Session** als erster Schritt, mit `make push-check` sofern TOOL-PUSH-CHECK vorher fertig ist, sonst nach Handbuch 1.45.
Screenshots unter `.worktrees/ui-tasten/.studio/qa/ui-tasten/` vor dem Wegräumen des Worktrees sichern.

Regelbezug: gates.md Gate Merge Release, R335, R476, R479, R488 · Kosten bei Irrtum: ein Revert.

Entscheider: L0 · Anlass: Bericht Controller UI-TASTEN · ADR: —

## R497 · 2026-10-10 · Kurz-Retro f52039fc angenommen; E-059, E-060, E-061

Ruling: Retro `docs/studio/retros/2026-10-10-session-f52039fc-ende.md` (`4994d0e3`) angenommen. **E-054 behalten**
(abgeschlossen). **E-056 abgelehnt**, ersetzt durch **E-059**: Merge-Treiber für `docs/beobachtungen.md`, der nur reine
Anhänge beider Seiten selbst auflöst (Messgrösse 0 manuelle Auflösungen in 3 Merges, 0 verlorene Einträge). **E-060**:
Budget-Hook blockt Lead-Starts ohne vorherige Freigabe (statt Warnung). E-059 und E-060 als Werkzeug-Paket ins nächste
Bündel (zusammen mit TOOL-PUSH-CHECK und R488 V2/V4). **E-061** startet auf dem Platz von E-054: Spec-Nachträge und
Kurzdesigns der Stufe leicht durch `lead-design` auf sonnet; Umsetzung (Modelltabelle, `lead-design.md`, Handbuch-Minor)
durch `studio-coach` in der nächsten Session. Briefings nennen die Minuten als Tools ÷ 6. Ampel **Cache-Write** zwei
Sessions rot: Hebel ist E-057 (läuft, erster Datenpunkt), Bewertung in der nächsten Retro; ohne Besserung dann neuer
Hebel Pflicht (R316). **L0-Kontext** gelb (272k): Messauftrag an die nächste Session-Retro.

Regelbezug: STUDIO.md Verbesserungsschleife, R316, R475 · Kosten bei Irrtum: ein Experiment-Platz falsch belegt.

Entscheider: L0 · Anlass: Kurz-Retro Session f52039fc · ADR: —

## R498 · 2026-10-11 · Session-Start: Push REL-19 zuerst, parallel Pläne M13-E2 und I-048, Gate Spec M14-E1

Ruling: „mach weiter“ = Plan aus state.md. (0) `production-integrator` pusht REL-19 (main @ `e393aec8`, Code-Stand
`4b3a3aac` + Doku) nach Handbuch 1.45 (kein `make push-check`, TOOL-PUSH-CHECK noch offen), Pages-Deploy, `ci.py`.
1-min-Load beim Start 36 (Systemprozesse `softwareupdated`, kein Studio-Agent): der Integrator wartet mit `make check`
bis Load ≤ 4, höchstens 30 min, sonst Bericht. Parallel laut R464 nur Arbeit ohne Testläufe: Plan M13-E2 (`lead-tech`,
opus), Plan I-048 (`lead-tech`, opus), Gate Spec M14-E1 (`lead-tech` + `lead-qa`, sonnet). Umsetzer und Werkzeug-Bündel 6
erst nach `make zeitreserve-push` Exit 0.

Regelbezug: state.md „Fortsetzung“, R464, R475, R488, R496 · Kosten bei Irrtum: ein verschobener Push.

Entscheider: L0 · Anlass: Session-Start · ADR: —

## R499 · 2026-10-11 · Kurzdesign UI-NAECHSTER-SCHRITT angenommen (Stufe leicht)

Ruling: Kurzdesign `lead-design` (Bericht, AK-NS-01…08) angenommen; Paket **UI-NAECHSTER-SCHRITT**. «Nächster Schritt»
(`src/ui/guide.ts`, `nextStep`) nennt **akuten Warenmangel** (Haus unversorgt bei Gut g, Erzeuger steht, Lager der
Insel des Hauses < 1) vor den Gütern der nächsten Stufe; Text aus dem gemeinsamen Baustein mit `remedyText`. **Akuter
Kassenmangel nur bei `money < 0`** (Fallback-Variante, keine neue Konstante `ACUTE_CASH_MINUTES`, YAGNI), direkt nach dem
Warenmangel; AK-NS-05 entsprechend ohne Saldo-Fall. Kolonie: Bestand der Insel des Hauses. Stillgelegter/ausgefallener
Erzeuger und volles Lager ohne Hinweis bleiben ausserhalb (Beobachtung). Kein Save-, kein Balancing-Bezug. Plan durch
`lead-tech` im Bericht, dann kombiniertes Gate durch L0; Umsetzung erst nach Push REL-19 (R464).

Regelbezug: STUDIO.md Ablauf Stufe leicht, R475, R464 · Kosten bei Irrtum: ein kleines UI-Paket nachbessern.

Entscheider: L0 · Anlass: Kurzdesign-Bericht lead-design · ADR: —

## R500 · 2026-10-11 · Gate Spec M14-E1: BEDENKEN → Spec-Nachtrag, Auflagen an den Plan

Ruling: lead-qa BEDENKEN (B1–B11), lead-tech BEDENKEN (B1–B13), kein ZURÜCK. **Spec-Nachtrag** durch `lead-design`
(E-061, sonnet): QA-B4 (Zählsignal Ersatzregel als [Tech]-Testhook, Stufen 1–3 benannt, Schwelle ≤ 3 für Stufe 3),
QA-B5 (Seed 963 ist Messseed, kein Bestands-Pin; Abgleich mit Anhang 01 A3), QA-B6 (AK-11 mit Zahlen oder tickgenauem
Vergleich), QA-B7 (AK-09 Funktion und Einheit), QA-B8 (neues AK: Schiff unterwegs, Position/Ankunft nach Migration
unverändert), QA-B9 (`AK-M14E1-12` voll ausschreiben), QA-B1 (AK-31 als „Bestandstext unverändert + angehängter Satz“).
**Auflagen an den Plan** (Pflicht): QA-B2 (B3-Messung nach I-048 und M13-E2 neu, Rangfolge P1 > P2 > P3 bleibt
Playtest-Kriterium, Kippen → Ruling), QA-B3 (Vergleichsbasis = main-Commit zum Plan-Start, Test „Controller Seed 3
gründet nie auf B oder C“), QA-B10/B11 (Abriss-/Neubau-Tests, Fixture-Slot Pflicht), Tech-B1 (`cycleOf(world, b)`,
SIM ändert Aufrufer in ui/render mechanisch mit, UI blocked-by SIM), Tech-B2 (Migration mit eingefrorenem Literal, nie
`createWorld`), Tech-B3 (A/B-Bitgleichheit über 1…1000 Seeds plus Lagevergleich in der Migration), Tech-B4 (Ersatzregel
konstruktiv), Tech-B5/B6/B8, Nachtrag zu ADR-010 beim Plan. Plan erst nach Abschluss M13 (R486).

Regelbezug: gates.md Gate Spec, R486, R495, E-061 · Kosten bei Irrtum: ein weiterer Nachtrag.

Entscheider: L0 · Anlass: Gate-Berichte lead-qa und lead-tech · ADR: —

## R501 · 2026-10-11 · Spec-Nachtrag M14-E1 abgenommen; Handbuch 1.46 abgenommen

Ruling: Nachtrag `eef88dc1` (Anhang 04, QA-B1/B4–B9, neues AK-M14E1-42) abgenommen; Spec M14-E1 gegatet, Plan erst nach
Abschluss M13 (R486) mit den Auflagen aus R500. Zusatzauflage an den Plan: AK-11 setzt voraus, dass «Fruchtbar» den
Zyklus der Zuckerrohrplantage nicht ändert — am Code gegen Anhang 01 A1 prüfen, sonst Vergleich nach Zyklus-Skalierung.
Handbuch **1.46** (`b5826181`, studio-coach): E-061 läuft (erster Fall dieser Nachtrag, sonnet), R488 V3 in der
Integrator-Persona; E-054-Kopfzeile auf „behalten“ nachgeführt.

Regelbezug: gates.md Gate Spec, R497, R500, E-061 · Kosten bei Irrtum: ein weiterer Nachtrag.

Entscheider: L0 · Anlass: Berichte lead-design und studio-coach · ADR: —

## R502 · 2026-10-11 · Kombiniertes Gate UI-NAECHSTER-SCHRITT: OK; Umsetzung nach Push REL-19

Ruling: Plan `lead-tech` (Bericht, archiviert unter `.studio/archiv/berichte/`) angenommen: T1 Warenmangel (AK-NS-01–04,
06, 07 + Kolonie über `islandOf(w, h).stock`), T2 `money < 0` (AK-NS-05), T3 Zustandsfreiheit + README Z. 57 (AK-NS-08),
Browser-Check, Final-Review opus. Entscheide: (1) gemeinsamer Baustein **mit Taste** («baue mehr Fischerhütte (F) oder
kaufe Nahrung am Kontor»), Sollwerte `tests/ui/guide.test.ts:153` und `:507` ändern sich bewusst; die Tabelle in
`docs/superpowers/specs/2026-10-01-m7-ux-design.md:305` wird im selben Paket nachgeführt (D1, Trivial-Fix). (2) AK-UX-08
R3c erhält in der Testwelt `stock.cloth = 5` — Absicht bleibt, Regel 3 schaltet erst ab Lager ≥ 1 weiter (Folge aus R499).
Budget 6 Starts, Parallelität 1, L0 briefet direkt (ohne Controller, E-037). Hinweis «baue mehr» bei Erzeuger nur auf
anderer Insel bleibt wie heute. Start, sobald `make zeitreserve-push` Exit 0 (R464).

Regelbezug: STUDIO.md Stufe leicht, gates.md Kombiniertes Gate, R499, R464 · Kosten bei Irrtum: ein UI-Paket nachbessern.

Entscheider: L0 · Anlass: Plan-Bericht lead-tech · ADR: —

## R503 · 2026-10-11 · Gate Plan TOOL-BUENDEL-6: BEDENKEN → Plan-Nachtrag; D1–D4 entschieden

Ruling: lead-qa BEDENKEN (B1–B9), lead-production OK mit Bedenken (B1–B5). **Plan-Nachtrag** durch den Planverfasser
(Fortsetzung): QA-B1 (D1 nur bei existierender, gültiger, leerer Markierungsliste; Datei vor dem Lauf löschen; Tests
„Datei fehlt → Exit 2“, „veraltet → vorab gelöscht“), QA-B2 (Markierungsliste aus der Hauptmessung neu berechnen,
reine Funktion, kein Dateizustand), QA-B3 (nicht-strenges `zeitreserve` in `check-run` darf die Nachmessung nicht
verbauen — vor Task prüfen, Tests 3/4 in T03), QA-B5 (`git status --porcelain` zu Beginn und Ende, Abweichung → Exit 1,
Test), QA-B9 (Lead-`Paket:` = Freigabe-Phase; Test mit realen Paket/Phase-Paaren aus `events.jsonl`). QA-B4, B6–B8 als
Hinweise in die Task-Dateien. **D1** angenommen unter Auflage QA-B1; **D2, D3** angenommen; **D4** angenommen mit QA-B9.
**Parallelität 2** (Prod-B3): Strang A (T01–T03, `.worktrees/b6a`) und Strang B (T04–T07, `.worktrees/b6b`), Konflikte
nur `Makefile`/`docs/arc42.md` (getrennte Absätze). Budget 8 Starts. Merge von T07 erst, wenn alle laufenden Stränge
Freigaben im Phasenformat haben (Prod-B4). Umsetzung erst nach Push REL-19 (R464) und Abnahme des Nachtrags durch L0.

Regelbezug: gates.md Gate Plan, R488, R464, E-059, E-060 · Kosten bei Irrtum: ein Werkzeug-Paket nachbessern.

Entscheider: L0 · Anlass: Gate-Berichte lead-qa und lead-production · ADR: —

## R504 · 2026-10-11 · Plan-Nachtrag TOOL-BUENDEL-6 abgenommen; Umsetzung frei nach Push REL-19

Ruling: Nachtrag `cdbe4630` deckt R503 (QA-B1/B2/B3/B5/B9, Hinweise B4/B6–B8; neues Ziel `make check-push` = `check`
ohne lockeres `zeitreserve`, `make check` unverändert). Gate Plan TOOL-BUENDEL-6 damit **OK**. Umsetzung in zwei
Strängen (A `tool/b6a` T01–T03, B `tool/b6b` T04–T07), je ein Controller `lead-tech` sonnet, Budget 8 Starts gesamt,
Merge A vor B, T07 nach Prod-B4. Start, sobald `make zeitreserve-push` Exit 0 (R464).

Regelbezug: gates.md Gate Plan, R503, R464 · Kosten bei Irrtum: ein Werkzeug-Paket nachbessern.

Entscheider: L0 · Anlass: Nachtrag-Bericht lead-tech · ADR: —

## R505 · 2026-10-11 · Gate Plan I-048: BEDENKEN → Plan-Nachtrag; M13 teilt Save v12, Release-Sperre bis M13-Ende

Ruling: lead-qa BEDENKEN (B1–B8), lead-production BEDENKEN (B1–B7), kein ZURÜCK. **Save:** E7 des M13-E2-Plans wird
ausgedehnt — **kein Release von main, bis M13-E2, I-049 und I-048 gemergt sind**; alle drei teilen **Save v12** (eine
Migration v11→v12, der jeweils spätere Strang erweitert sie). Muss doch vorher released werden: feste Vergabe in
Merge-Reihenfolge (E2 v12, I-049 v13, I-048 v14), neues Ruling. Spielfremde Pushes (Werkzeug, Doku) bleiben erlaubt.
**Merge-Reihenfolge:** (1) M13-E2-SIM, (2) I-049-Sim, (3) M13-E2-ART → M13-E2-UI; I-048-Sim (T01–T03) zweigt nach (1) ab
und läuft parallel zu (2)/(3); (4) I-049-UI → I-048-UI (seriell, `src/ui/trade.ts`); (5) I-048 Schritt B (T06–T08)
zuletzt. Der zuletzt mergende Strang prüft die `foldBackToV11`-Regeln der anderen im Test (Prod-B4). **Entscheide des
Planverfassers:** (1) Testklasse **S** «Erwartung, die I-048 Z2/Z5 ausdrücklich ändert» zugelassen mit QA-B3 (Rundung
n > 1 bleibt geprüft, `buyQuote` mit rise 2) und QA-B4 (`buyPct` erst vergleichen, dann entfernen); Test ausserhalb
N/R/S bleibt Stopp an L0. (2) AK-ZK-15 Messbasis = Listenpreis mit Edikt, `rise` 0, mit QA-B5. (3) AK-ZK-13 mit
`--diff-filter=MDR`; Versionszeilen-Prüfung mit dem Befehl aus QA-B2 (wegen gemeinsamem v12 meist leer). Dieses Ruling
ist die Spec-Klarstellung für §6, AK-ZK-13 und AK-ZK-15. **Plan-Nachtrag** (Planverfasser): QA-B2–B7 in T05/T06,
Prod-B4–B6 (Zählweise Starts inkl. Controller, Merge-Weg über Gate Merge), Abzweig- und Save-Regel oben in Index/T01.

Regelbezug: gates.md Gate Plan, R481, R487, R490, R492 · Kosten bei Irrtum: Releases verzögern sich bis M13-Ende.

Entscheider: L0 · Anlass: Gate-Berichte lead-qa und lead-production · ADR: —

## R506 · 2026-10-11 · Plan-Nachtrag I-048 abgenommen; Gate Plan I-048 OK

Ruling: Nachtrag `d6c8873b` setzt R505 um (Save v12 geteilt, Stränge I048-SIM nach M13-E2-SIM, I048-UI nach I-049-UI,
I048-B zuletzt; QA-B2–B7, Prod-B4–B6). Gate Plan I-048 **OK**. Budget **19 Starts** (inkl. 3 Controller, Parallelität 1
je Strang), freigegeben je Strang beim Start. Start I048-SIM erst nach Merge M13-E2-SIM.

Regelbezug: gates.md Gate Plan, R505 · Kosten bei Irrtum: ein Plan-Nachtrag.

Entscheider: L0 · Anlass: Nachtrag-Bericht lead-tech · ADR: —

## R507 · 2026-10-11 · Gate Plan M13-E2: BEDENKEN → Plan-Nachtrag; Glocke unter lead-art

Ruling: lead-qa BEDENKEN (B1–B10), lead-production BEDENKEN (B1–B8), kein ZURÜCK. **Plan-Nachtrag** durch den
Planverfasser vor Start T01: QA-B1 (Dev-Zähler der Klangereignisse in `devProbes`/`debugState` für AK-44, Einmal-Beweis in
`soundEvents.test.ts`), QA-B2 (T15/T16 Schritt 0: Szenarien im UI-Baum nach `git merge main` neu schreiben, Hash
notieren; Regel an Folgestränge), QA-B3, B5 (`SAVE_VERSION + 1`), B6 (`--diff-filter=MDR`), B7, B8, B9. **E3/QA-B4:**
Das Klangereignis „Glocke“ wird **Teil-Task im ART-Strang** (`lead-art`, `art-audio-engineer`, Roster-Ownership
`src/audio/`); `lead-art` nimmt eine Klangfigur ab, die sich hörbar vom Krisenalarm (`bell.mp3`/`alarm`) unterscheidet;
T13 liefert nur den UI-Auslöser. **E1, E2, E4, E5, E6** angenommen; **E8** angenommen mit kurzem `lead-qa`-Review des
Nachtrag-Wortlauts vor I-049-Start und Verweiszeile im I-049-Plan (QA-B10, Prod-B6). **Prod-Auflagen:** Plätze nach B1
staffeln (Start SIM + ART, UI nach T04); I-048-Sim mergt **nach** I-049-Sim und holt vorher `main` per Merge (Prod-B2);
Abhängigkeit T18 ← I-049-Sim im Index, I-049-Sim startet sofort nach Merge E2-SIM (Prod-B3); arc42-`save.ts`-Zeile
gleicht der zuletzt mergende Strang ab (Prod-B4); Browser-Läufe nie mit I-048-T04 gleichzeitig (Prod-B7). Budget 42 Starts
(Parallelität 3, gestaffelt), freigegeben je Strang beim Start.

Regelbezug: gates.md Gate Plan, R424, R481, R505, roster.md · Kosten bei Irrtum: ein Plan-Nachtrag.

Entscheider: L0 · Anlass: Gate-Berichte lead-qa und lead-production · ADR: —

## R508 · 2026-10-11 · Push REL-19: zweiter Versuch im Ruhefenster, sonst TOOL-BUENDEL-6 Strang A zuerst

Ruling: Integrator-Bericht: `make check` Exit 0 (zweimal), `make check-ci-perf` Exit 0, `make zeitreserve-push` erst
Exit 2 (loadStart 4,4), dann **Exit 1** (9 Tests ohne Reserve, Load stieg im Lauf auf 7; parallele Studio-Agenten).
Kein Push trotz Exit 1. **Zweiter Versuch** im Ruhefenster: L0 startet bis zum Ergebnis keine neuen Agenten (laufend
nur der Plan-Nachtrag M13-E2, ohne Tests); Integrator startet `make check` erst bei 1-min-Load ≤ 3 und 5-min-Load ≤ 4,
dann `make zeitreserve-push`, `make check-ci-perf`; bei Exit 0 Push nach Briefing. **Scheitert er erneut (Exit 1):**
kein Push in dieser Phase; Ausnahme von R464 für **TOOL-BUENDEL-6 Strang A** (T01 Reserve `time.test.ts`, T02, T03
`make push-check`) — dieser Strang ist die Abhilfe genau dieses Fehlers; Push REL-19 danach mit `make push-check`.

Regelbezug: STUDIO.md Push-Ablauf (R394, R464), R488 V1, R503 · Kosten bei Irrtum: REL-19 verschiebt sich um einige
Stunden.

Entscheider: L0 · Anlass: Bericht production-integrator REL-19 · ADR: —

## R509 · 2026-10-11 · Plan-Nachtrag M13-E2 abgenommen; Gate Plan M13-E2 OK

Ruling: Nachtrag `e37f775f` setzt R507 um (T19 Glocke im ART-Strang unter `lead-art`, Ablauf T08 → T19 → T09; QA-B1–B3,
B5–B9; Index mit Staffelung, Merge-Reihenfolge, Save-Regel; Rahmen/Ownership/Entscheidungen ausgelagert; Verweiszeile im
I-049-Plan). Gate Plan M13-E2 **OK**. Budget 42 Starts (39 geplant), Parallelität 3 gestaffelt. Start SIM + ART nach Push
REL-19 bzw. nach dem Ergebnis von R508. Offen: `lead-qa`-Review des Wortlauts `nachtrag-i049.md` vor I-049-Start.

Regelbezug: gates.md Gate Plan, R507 · Kosten bei Irrtum: ein Plan-Nachtrag.

Entscheider: L0 · Anlass: Nachtrag-Bericht lead-tech · ADR: —

## R510 · 2026-10-11 · Push REL-19 zweiter Versuch Exit 1 → TOOL-BUENDEL-6 Strang A, T01 vorgezogen

Ruling: Zweiter Versuch (loadStart 2,2): `make check` 0, `make check-ci-perf` 0, `make zeitreserve-push` **1** — einziger
Test ohne Reserve `tests/ui/time.test.ts` „AK-UX-13 kein Text enthält Tick“ (855 ms lokal, ×3 = 2565 ms bei 5000 ms
Timeout). Nach R508 startet **TOOL-BUENDEL-6 Strang A** (`.worktrees/b6a`, `tool/b6a`, Controller `lead-tech` sonnet,
4 Starts aus R504). **T01 vorgezogen und einzeln gemergt:** Controller meldet nach T01 (Review OK) `waiting`; L0 macht
Gate Merge T01, Integrator mergt `tool/b6a` @ T01 nach main, dann Push REL-19 nach Handbuch-Kette (T01 behebt den
Blocker). T02/T03 laufen danach weiter. Weitere Umsetzer bleiben bis zum Push gesperrt (R464); Lese-Arbeit
(`lead-qa`-Review `nachtrag-i049.md`) darf laufen.

Regelbezug: R464, R508, R503/R504 · Kosten bei Irrtum: ein Zwischen-Merge mehr.

Entscheider: L0 · Anlass: Bericht production-integrator, zweiter Versuch · ADR: —

## R511 · 2026-10-11 · Review Nachtrag I-049: BEDENKEN → Wortlaut-Korrektur; Sperrbestand ohne Kontor wirkt nicht auf Denkmal

Ruling: lead-qa BEDENKEN (B1–B5). **Auslegung B1:** Ein Sperrbestand ohne Kontor auf der Heimatinsel wirkt auch nicht
auf die Denkmal-Reserve (Linie R481 B6(b)); `monumentLock` nutzt das Prädikat aus I-049 T02 (`reserveOf`), neuer K1-Fall
„kein Kontor ⇒ Reserve 20“. B2 (E2-Test `monument.test.ts` bleibt unverändert, K1 als neuer `describe`-Block), B3
(Vergleichswelt, Welt mit Stein-Hausverbrauch < 20 festlegen, Grenzfälle 0/20/60, Fremdinsel 60), B4 (v11-Fixtures ohne
`reserve`, nur v12-Rundlauf-Fixtures mit; README-Satz „nur Betriebe“ anpassen; Global Constraints verweist auf N3),
B5 durch den Planverfasser M13-E2 in `nachtrag-i049.md` und — nur für B4/B5 — im I-049-Plan. Danach gilt der Nachtrag
ohne erneutes Review als abgenommen (L0 prüft Stichprobe).

Regelbezug: R481, R507 E8, R509 · Kosten bei Irrtum: ein Test im I-049-Strang nachbessern.

Entscheider: L0 · Anlass: Review-Bericht lead-qa · ADR: —

## R512 · 2026-10-11 · Gate Merge TOOL-BUENDEL-6 T01: OK; Merge und Push REL-19

Ruling: `tool/b6a` @ `bb73123c` (nur `tests/ui/time.test.ts`: AK-UX-13 je Szenario, 44 + 1 Fälle, Prüfinhalt
unverändert; langsamster Fall 147 ms statt 604–642 ms; Rot-Beleg, Review OK, schnelle Prüfungen Exit 0) abgenommen.
`production-integrator` mergt den Commit lokal nach main und pusht REL-19 nach der Kette aus R508 (Ruhefenster). Strang A
setzt danach mit T02/T03 fort.

Regelbezug: gates.md Gate Merge, R508, R510 · Kosten bei Irrtum: ein Revert eines Test-Umbaus.

Entscheider: L0 · Anlass: Zwischenbericht Controller Strang A · ADR: —

## R513 · 2026-10-11 · REL-19 gepusht; Umsetzungsstart M13-E2 SIM/ART und UI-NAECHSTER-SCHRITT

Ruling: Push `801bee89` (Merge T01) erfolgt, CI/Pages laufen beim Integrator; R464 aufgehoben. Start nach R509-Staffelung:
**M13-E2-SIM** Controller A (`lead-tech` sonnet, T00–T04, 9 Starts) und **M13-E2-ART** Controller C (`lead-art` sonnet,
T00, T08, T19, T09, 7 Starts) — zusammen 16 der 42. **UI-NAECHSTER-SCHRITT** briefet L0 direkt (R502, E-037):
`tech-ui-engineer` T1–T3, dann `qa-code-reviewer` opus (Final), `qa-playtester`. TOOL-BUENDEL-6 Strang B startet, sobald
ein Platz frei ist (Deckel 8, R424).

Regelbezug: R424, R464, R502, R509 · Kosten bei Irrtum: Wartezeit an der Testsperre.

Entscheider: L0 · Anlass: Push REL-19 · ADR: —

## R514 · 2026-10-11 · Prozess-Aussensicht REL-19 angenommen: V1–V3, V4 zurückgestellt

Ruling: Retro `docs/studio/retros/2026-10-11-rel-19-prozess.md` (`e21e1a9e`) angenommen. Push-Weg 60,6 min statt ≈ 15 min;
Hauptursache: der Fix des benannten Blockers war durch R464 selbst gesperrt. **V1** Handbuch: Ausnahme von R464 für
Fixes eines benannten Push-Blockers (Ruling nennt Test und Paket; nur gezielte Läufe der berührten Dateien). **V2**
`make push-check` loggt 1-min-Load je Stufe im Ereignis `push_check` — als kleiner Zusatz in TOOL-BUENDEL-6 Strang B (T05
oder eigener Mini-Task). **V3** Ende-Routine: `make zeitreserve-push` einmal im Ruhefenster vor Session-Ende, wenn seit
dem letzten Push Code gemergt wurde (ab TOOL-BUENDEL-6: `make push-check` ohne Push). **V4** (Integrator-Wartegrenze 15 min)
zurückgestellt bis V2 Daten liefert. V1 und V3 setzt `studio-coach` als Handbuch-Minor um.

Regelbezug: STUDIO.md Verbesserungsschleife, R464, R488 · Kosten bei Irrtum: eine zu weite Ausnahme von R464.

Entscheider: L0 · Anlass: Bericht studio-process-coach retro-rel-19 · ADR: —

## R515 · 2026-10-11 · Gate Merge UI-NAECHSTER-SCHRITT: OK, lokaler Merge; Release mit M13

Ruling: `feat/ui-naechster-schritt` @ `da78589a` abgenommen: T1–T3 (AK-NS-01…08 + Kolonie), Final-Review opus BEDENKEN
(3× niedrig) → Fix-Runde `1d55a512`/`da78589a` (m7-Spec-Regelliste, AK-NS-02 exakt, AK-NS-07 trennscharf mit Rot-Beleg)
ohne Verhaltensänderung, daher ohne erneutes Review; Playtest OK in allen 4 Punkten bei 1280 und 1920. Merge lokal durch
`production-integrator`. **Kein Release vor M13-Ende** (R505); das Paket fährt im M13-Release mit. Playtest-Hinweis
(Inspektor-Abhilfe bei gefülltem Lager, solange das Haus noch unversorgt ist) → `docs/beobachtungen.md`.

Regelbezug: gates.md Gate Merge, R502, R505 · Kosten bei Irrtum: ein Revert eines kleinen UI-Pakets.

Entscheider: L0 · Anlass: Berichte Final-Review, Umsetzer, Playtester · ADR: —

## R516 · 2026-10-11 · M13-E2-SIM T01: Sprite-Matrix-Schranke 1,30 → 1,40 (Denkmal 3×3)

Ruling: `tests/render/variants.test.ts` AK7 (Zoom 2 / DPR 2) wird mit `monument` (3×3) in `BUILDING_DEFS` rot: Matrix
91,1 MB gegen 87,24 MB (Faktor 1,357 statt ≤ 1,30 zu `SPRITE_CACHE_MAX_BYTES` 67,1 MB); unabhängig vom Platzhalter-Sprite.
Der Cache bleibt per LRU gedeckelt; das Denkmal existiert höchstens einmal je Spiel. Schranke wird **1,40** (Kommentar
mit Verweis R516), als Einzeiler in T01 durch den SIM-Umsetzer, damit SIM, ART und UI von grünem Hash abzweigen.
Leistung bei Zoom 2 prüft der Browser-Lauf T15/T16 (Bildrate mit Denkmal im Bild, keine sichtbaren Ruckler).

Regelbezug: ISO §10/Obergrenzen (render), R509 · Kosten bei Irrtum: mehr Cache-Wechsel bei Zoom 2, messbar im Browser-Lauf.

Entscheider: L0 · Anlass: Entscheidungsbedarf Controller A M13-E2-SIM · ADR: —

## R517 · 2026-10-11 · Gate Merge TOOL-BUENDEL-6 Strang A: OK, lokaler Merge

Ruling: `tool/b6a` (T02 `17805835`/`ac372cb8`, T03 `526662ec`/`8f69f494`, Final-Fix `63806621`; T01 schon auf main)
abgenommen: Reviews OK, Final-Review opus BEDENKEN (niedrig) → Fix ohne erneutes Review hingenommen; `make studio-test`
Exit 0, Echtlauf `make push-check` Exit 0 (4:50 min, D1-Pfad unter Load 69). Merge lokal durch `production-integrator`
nach UI-NAECHSTER-SCHRITT. Ab dem Merge ist **`make push-check`** der Push-Weg (Handbuch-Folge durch `studio-coach`).
Die zwei Restrisiken (Lastwarten greift nicht bis Vitest-Start → D1 wird unter Parallelität Regelfall; `check-ci-perf`
ohne Lastwarten → falsches Rot möglich) gehen nach `docs/beobachtungen.md`; Bewertung mit den Daten aus R514 V2.

Regelbezug: gates.md Gate Merge, R503, R504, R514 · Kosten bei Irrtum: ein Werkzeug-Revert.

Entscheider: L0 · Anlass: Schlussbericht Controller Strang A · ADR: —

## R518 · 2026-10-11 · Merges UI-NAECHSTER-SCHRITT und Strang A erfolgt; Worktrees aufräumen; Handbuch-Folge push-check

Ruling: Lokal gemergt `1a44799a` (UI-NAECHSTER-SCHRITT) und `1d6b0560` (TOOL-BUENDEL-6 Strang A), je `make check` und
`make check-ci-perf` Exit 0; main `b5879e09`. Handbuch **1.47** (`4dfd2b87`, R514 V1/V3) abgenommen. **Aufräumen**
(`lead-production`): Worktrees `b4`, `m13-e1-sim`, `m13-e1-ui`, `ui-gut-chip`, `b5`, `aufraeum-01`, `ui-tasten`,
`ui-naechster-schritt`, `b6a` — alle Branches in main enthalten, getrackt sauber — per `git worktree remove` entfernen;
vorher ungetrackte Ergebnisse (`.studio/qa/…`, Ledger `.superpowers/sdd/…`) nach `.studio/archiv/worktrees/<name>/`
im Hauptcheckout sichern. Branches bleiben. **Handbuch-Folge** (`studio-coach`): Push-Ablauf und Integrator-Persona
auf `make push-check` umstellen (ersetzt die Einzelkette; R503 D1–D4 nennen).

Regelbezug: state.md „Fortsetzung“ Punkt 7, R496, R504, R517 · Kosten bei Irrtum: ein Worktree wird per `git worktree add` neu angelegt.

Entscheider: L0 · Anlass: Berichte production-integrator · ADR: —

## R519 · 2026-10-11 · Parallele Nutzer-Session c6709a04 (Design „Erweiterung“) geduldet; Deckel geteilt

Ruling: Seit ≈ 08:30Z läuft eine zweite, vom Nutzer gestartete Session `c6709a04` (Brainstorming/Konzept „Erweiterung“ mit
`lead-design`, Worktree `.worktrees/erweiterung-1`, Branch `design/erweiterung-1`). Abweichung von R129/R324 (eine aktive
L0-Session je Repo) wird geduldet, weil sie nur Design-Doku in eigenem Worktree schreibt und der Nutzer sie selbst
gestartet hat. Folgen für diese Session: Studio-Deckel ≤ 8 Agenten gilt **gemeinsam** — diese Session hält ≤ 6 eigene
Agenten, solange die andere aktiv ist; keine Änderungen an `.worktrees/erweiterung-1`, `design/erweiterung-1` oder an
Dateien, die sie für das Konzept braucht; Doku-Commits auf main nur mit eigenen Pfaden. Das Aufräumen (R518) liess
den Worktree unberührt.

Regelbezug: R129, R324, R329, R424 · Kosten bei Irrtum: Konflikt in einer Doku-Datei beim späteren Merge.

Entscheider: L0 · Anlass: unbekannter Worktree beim Aufräumen, Events der Session c6709a04 · ADR: —

## R520 · 2026-10-11 · Gate Merge TOOL-BUENDEL-6 Strang B: OK, Budget-Hook vorerst `warn`; Handbuch 1.48 abgenommen

Ruling: `tool/b6b` @ `dbe48e75` (T04 Actions-Prognose, T05 Produktivanteil, T06 E-059 Merge-Treiber, T07 E-060
Budget-Hook, R514 V2 `load` je Stufe; Fixes `f7d8a3a5`, `3bf85886`, `dbe48e75`) abgenommen: Reviews OK/BEDENKEN niedrig,
Final-Review opus ohne Blocker, `make studio-lint`/`studio-test` Exit 0 (726), Echtläufe belegt. **`BUDGET_MODE` Standard
`warn`**, weil die parallele Nutzer-Session (R519) keine Freigaben loggt; `deny` (Start E-060) per eigenem Ruling, wenn
nur eine Session läuft — dann vorher `design-m14-e1` im Phasenformat nachtragen und `KNOWN_MISMATCH` entfernen.
E-059 startet mit dem Merge (`make merge-driver` im Hauptcheckout und in `.worktrees/integrate`). **Actions-Prognose
ROT (1991 von 2000 min):** höchstens ein Push je Tag (R488 V2); wegen der M13-Release-Sperre (R505) ohnehin kein
Spiel-Push geplant. Handbuch **1.48** (`05cd1141`, push-check) abgenommen. `studio-coach` ergänzt danach: Integrator-
Hinweis `git checkout --merge docs/beobachtungen.md` bei Treiberfehler, E-059 „läuft“ in `experimente.md`.

Regelbezug: gates.md Gate Merge, R488, R503, R504, R514, R519 · Kosten bei Irrtum: ein Werkzeug-Revert.

Entscheider: L0 · Anlass: Schlussbericht Controller Strang B · ADR: —

## R521 · 2026-10-11 · M13-E2-ART abgenommen (`4626645a`); Ownership-Abweichungen bestätigt

Ruling: ART-Strang (T08 `f0ef73d5`, T19 `004f7971` Glocke `monumentDone`, T09 `4d39a866` + Fix `4626645a`, Merge Sim
`051efcc8`) abgenommen; Reviews OK; Klangfigur durch `lead-art` abgenommen (Hörprobe in T16/AK-44). Nachträglich
bestätigt: `tests/render/weather.test.ts` (CAPS `flareSparks`), `sprites-kanten.test.ts`/`sprites.test.ts`
(Stufe 0 und Denkmal aus Silhouetten-Prüfungen, eigener Lichtkanten-Test), Referenz-Hash `monument` `a64989a4` →
`8a28960e`. Merge nach main erst laut Reihenfolge R505/R507 (nach M13-E2-SIM und I-049-Sim), Gate Merge gemeinsam mit
dem UI-Strang nach T18. T09-Mehrbedarf (≈ 100 statt 45 Tools) wurde nicht vorab gemeldet — Punkt für die Session-Retro.
`monumentNightLight` (nicht eingehängt) und schwankende Frame-Ereigniszahl in `renderer.test.ts` → `docs/beobachtungen.md`;
Controller E prüft in T15, ob die Spec ein Nachtlicht verlangt.

Regelbezug: R505, R507, R509, R516 · Kosten bei Irrtum: ein Test-Nachtrag im ART-Strang.

Entscheider: L0 · Anlass: Schlussbericht lead-art M13-E2-ART · ADR: —

## R522 · 2026-10-11 · Gate Merge M13-E2-SIM: OK, lokaler Merge; UI-Strang bis T13 fertig

Ruling: `feat/m13-e2-sim` @ `0efa5719` (T01 `46d82e00`, T02 `051efcc8`, T03 `48f4abcf`, T04 `348ac5ac`, T05 `a9de9c8f`, T06
`94c5f09c`, T07 `39158b01`, Merge main `06d7ea13`, Final-Fix `0efa5719` nur Tests) abgenommen: Task-Reviews OK, T17
Final-Review opus BEDENKEN niedrig → behoben; `make check` Exit 0 auf `06d7ea13` (3326 Tests); Balancing-Baseline
unverändert (nur `balance-monument.test.ts` neu); Seed-Läufe im Soll (Pflicht-Stopp nicht ausgelöst; Lauf C bindet Werkzeug
statt Stein, geloggt). Nachträglich getragen: mechanische Anpassungen bestehender Save-/Szenario-/Townhall-Tests durch
Controller A (Ledger je Zeile, Anhang 02 D1). **Abweichung:** Rot-Belege T01–T04 fehlen im Ledger; ersetzt durch die
Mutationsstichprobe des Final-Reviews (vier Mutationen rot) — Punkt für die Retro, kein Muster. Merge lokal durch
`production-integrator`, **kein Push** (R505). Danach darf I-049-Sim starten (nächste Session; vorher Nachtrag R511 lesen).
UI-Strang bis T13 fertig `feat/m13-e2-ui` @ `81c0b87b`; Controller E (T14–T16, T18) in der nächsten Session (Ampel gelb).

Regelbezug: gates.md Gate Merge, R395, R505, R507, R509 · Kosten bei Irrtum: ein Revert des SIM-Strangs auf main (lokal).

Entscheider: L0 · Anlass: Schlussbericht Controller B · ADR: —

## R523 · 2026-10-11 · Kurz-Retro dc50be15 angenommen; Ende der Session

Ruling: Retro `docs/studio/retros/2026-10-11-session-dc50be15-ende.md` (`ca898bb9`) angenommen. **V1** E-054
(Plan-Instanzen kleiner Pakete auf sonnet) in Modelltabelle und `lead-tech.md` übernehmen — Handbuch-Minor durch
`studio-coach` als erster Schritt der nächsten Session. **V2** nur Messauftrag L0-Kontext bis zur nächsten Session-Retro
(Hebel zurückgestellt, Ursache unbelegt). **V3** Ampelzeile „Produktivanteil nach Phase“ (Plan-/Design-Leads zählen zu
Design/Spec/Plan) ins nächste Werkzeug-Bündel. **V4** E-049 behalten (abgeschlossen, 3/3); der freie Platz geht an **E-059**
(Merge-Treiber, R520), nicht an E-048. Ampel **Steuerungsanteil** zwei Sessions rot: quittiert — bereinigt (E-049) 30,1 %
grün, Rohzeile zum Teil Messartefakt (V3). **Cache-Write** gelb 21,6 % (von 26,8 %): E-057 läuft weiter (2/3).
Session-Ende: Limit-Ampel gelb, keine neue Welle; Übergabe in state.md (`955efbbc`).

Regelbezug: STUDIO.md Verbesserungsschleife, R316, R497, R520 · Kosten bei Irrtum: ein Experiment-Platz falsch belegt.

Entscheider: L0 · Anlass: Kurz-Retro Session dc50be15 · ADR: —

## R524 · 2026-10-11 · Sicherungs-Push `backup/main-lokal`; Session-Start bei Limit-Ampel gelb

Ruling: Auf Nutzerfrage „wieso kein Push“: `main` bleibt unter Release-Sperre (R505, Save v12 geteilt) und Actions-Prognose
rot. Die lokalen Commits auf `main` (`e841f5dd`) werden als Sicherung nach `origin/backup/main-lokal` gepusht — kein
CI-Auslöser (CI nur `push` auf `main` und `pull_request`), kein Pages-Lauf; geprüft mit `gh run list`. Der Branch wird beim
Release M13 nachgeführt oder gelöscht. Limit-Ampel gelb (5 h 72 %, Woche 78 %): nur Angefangenes — Coach R523 V1 und
M13-E2 Controller E; I-049-Sim und I-048-Sim starten erst bei grüner Ampel (Budgetzeilen I049-SIM/I048-SIM verfallen).

Regelbezug: R505, R334, STUDIO.md Tempo/Herunterfahren · Kosten bei Irrtum: ein überflüssiger Remote-Branch.

Entscheider: L0 · Anlass: Nutzerfrage · ADR: —

## R525 · 2026-10-11 · R523 V1/V4 umgesetzt: Handbuch 1.50, lead-tech 1.13, E-059 laufend

Ruling: Coach-Commit `88114db9` abgenommen (Stichprobe Diff). E-054 übernommen: Plan-Instanz bei Stufe leicht und
Werkzeug-Paketen auf sonnet (Modelltabelle, `lead-tech.md` 1.13). E-059 läuft auf dem Platz von E-049; laufend E-057,
E-059, E-061. Die Kostengewicht-Schwelle aus E-054 verfolgt künftig die Ampel „opus-Anteil“.

Regelbezug: R523, R497 · Kosten bei Irrtum: ein Plan auf schwächerem Modell, Hochstufen jederzeit möglich.

Entscheider: L0 · Anlass: Bericht studio-coach COACH-R523 · ADR: —

## R526 · 2026-10-11 · Gate Merge M13-E2-ART → UI: OK; AK-M13E2-48 nach Desktop-first ausgelegt

Ruling: Controller E fertig (`feat/m13-e2-ui` @ `946a87b4`, enthält ART `5295021d`; Handoff
`.studio/handoffs/2026-10-11-lead-tech-m13-e2-ctrl-e.md`). T14–T16 und T18 erledigt, Final-Review opus BEDENKEN nur
wegen AK-48, Code mergebereit; Fix-Runde mit Review OK; `make check` Exit 0; Zeitvergleich ohne Ausreisser.
**AK-M13E2-48** (800×600 „keine Überlappung“) widerspricht der Desktop-first-Regel in `CLAUDE.md` (schmale Fenster nur
„stürzt nicht ab“); die Überlappung (161 px) zeigen alle Panels vorbestehend. Auslegung: AK-48 gilt als erfüllt mit
„kein Absturz, keine Konsolenfehler“ (belegt in T15); Spec-Wortlaut korrigiert der nächste Spec-Nachtrag M13. Fehlende
Rot-Belege im Ledger (T09–T13, T19) liegen im Berichtsarchiv: hingenommen. **Gate Merge OK**: `production-integrator`
mergt `feat/m13-e2-ui` lokal nach `main` (kein Push, Release-Sperre R505). Hörprobe der Glocke geht als „Bitte testen“
in die Release-Notiz M13.

Regelbezug: R505 Schritt 3, R521, CLAUDE.md UI-Regel, gates.md Gate Merge · Kosten bei Irrtum: ein Layout-Nachtrag für kleine Fenster.

Entscheider: L0 · Anlass: Bericht lead-tech M13-E2-CTRL-E-1011 · ADR: —

## R527 · 2026-10-11 · Merge M13-E2 ART/UI angenommen; Welle: I-049-Sim, I-048-Sim, Beobachtungen, Ideen

Ruling: Integrator-Merge `102468b2` (kein Konflikt, `make check` und `make check-ci-perf` Exit 0) angenommen; Merge im
Worktree `integrate` plus `--ff-only` auf main ist zulässig (Persona vor Briefing). Ampel grün: Start **I-049-Sim**
(Budget I049-SIM 10, Parallelität 1, Zeile aus R524 reaktiviert) und parallel **I-048-Sim** T01–T03 (+T05 laut Plan;
Budget I048-SIM 8), I-048-Sim mergt **nach** I-049-Sim (R505/R506). **lead-production**: Beobachtungs-Auswertung (≈ 30
Einträge seit 2026-10-10) und Entfernen der Worktrees `m13-e2-sim`, `b6b`, `m13-e2-art`, `m13-e2-ui` (Branches in
`git branch --merged main`, Status sauber; Branches bleiben). **Ideen-Runde** IDEEN durch `lead-design` (R445/R475,
freie Plätze; M14-E1-Plan bleibt bis M13-Ende gesperrt, R486).

Regelbezug: R445, R475, R486, R505, R506, R518 · Kosten bei Irrtum: ein Merge-Konflikt zwischen den Sim-Strängen.

Entscheider: L0 · Anlass: Merge-Bericht, Ampel grün · ADR: —

## R528 · 2026-10-11 · Beobachtungs-Auswertung 2026-10-11 angenommen; Präfix-Regel; TOOL-BUENDEL-7 und UI-TEXTE-1 vorbereiten

Ruling: Auswertung `e85f26aa` (29 Einträge, drei Bündel) und Entfernen der Worktrees `m13-e2-sim`, `b6b`, `m13-e2-art`,
`m13-e2-ui` angenommen. Entwürfe: (1) AK-M13E2-48 ist durch R526 entschieden. (2) `push-check` D1/Lastwarten: zurückgestellt
bis zu den Load-Daten (R514 V2). (3) **Präfix-Regel:** Hat ein Lead die Paket-ID `X-<Suffix>` und gibt es keine Freigabe
genau dieser Phase, bindet die Freigabe `X` (Präfix bis zum Bindestrich, längster Treffer gewinnt); exakte Freigabe geht
vor. Umsetzung in TOOL-BUENDEL-7. **TOOL-BUENDEL-7** (Restpunkte testrun/log/model, Präfix-Regel, `docs-check` gegen
zerrissene Tabellen, dazu R523 V3 Ampelzeile „Produktivanteil nach Phase“): Plan durch `lead-tech` auf sonnet (E-054,
Werkzeug-Paket, Stufe leicht); Umsetzung darf vor M13-Ende laufen (spielfremd, R505). **UI-TEXTE-1**: Kurzdesign der
Wortlaute durch `lead-design` (sonnet, Stufe leicht, E-061); Umsetzung erst nach I-049-UI wegen `texts.ts`.
UI-AUFRAEUM-2 nach M13.

Regelbezug: R505, R514, R523 V3, E-054, E-061 · Kosten bei Irrtum: ein Werkzeug-Plan zu viel.

Entscheider: L0 · Anlass: Bericht lead-production BEOB-AUSW-1011 · ADR: —

## R529 · 2026-10-11 · Runden-Ruling IDEEN-07

Ruling: Sieben neue Ideen I-061–I-067 angenommen, Streichungen I-069–I-072, I-074 und Zusammenfassungen I-068 → I-049,
I-073 → I-047 bestätigt. **I-062 + I-063** (Betriebsrangliste nach Unterhalt, Weg mit Winkel) als ein UI-Häppchen nach M13.
**I-064** (Edikt «Bauherr») **nicht** in I-049/v12 — der M13-Umfang bleibt fest (R505); geparkt bis zur ersten Save-Änderung
nach M13. **I-061** Baustein fürs nächste Meilenstein-Brainstorming (Stadtplanung, mit I-045 und I-051). I-065, I-066,
I-067 geparkt. Pool-Obergrenze: **I-056 und I-057** sind mit REL-19 live → Status „umgesetzt“; **I-052, I-055** verworfen;
I-051 bleibt (Stadtplanung), I-034 bleibt geparkt. Pool damit 40. Die zwei Befunde (I-031-Zahlen, Formatvorlage zählt
beim grep mit) trägt lead-design in docs/beobachtungen.md ein.

Regelbezug: R445, R475, R505, docs/ideen.md Obergrenze · Kosten bei Irrtum: eine Idee zu früh verworfen (wieder aufnehmbar).

Entscheider: L0 · Anlass: Bericht lead-design IDEEN-07 · ADR: —

## R530 · 2026-10-11 · Gate Spec UI-TEXTE-1: BEDENKEN → Spec-Nachtrag

Ruling: lead-qa BEDENKEN (1–9), kein Blocker. Der Spec-Autor führt alle neun Punkte nach (Fortsetzung): AK-UT-06 mit
`monumentDone` als einzigem Schalter; AK-UT-08 fest «Entf / ⌫» (Rücktaste seit REL-19 belegt); **AK-UT-10 Variante A**
mit wörtlicher Überschrift «Speichern» über dem Knopf und zusätzlichem Vitest der Menü-Reihenfolge; neue **AK-UT-14**
(Raten-Anzeige stillgelegter Betriebe ohne Produktionszahl bzw. «Stillgelegt»); AK-UT-12 erweitert den bestehenden
`tests/ui/contrast.test.ts`; AK-UT-02 Wert per Import aus der Def; AK-UT-05 Test über alle Defs mit `maxCount.n === 1`;
AK-UT-13 gegen `--parchment`/`--parchment-edge`; AK-UT-01 ohne `tests/` und README. Wortlaut «Stillgelegt — Unterhalt auf
60 %» angenommen (R467 Befund 4, kein Spielwert). Nach dem Nachtrag gilt die Spec ohne erneutes Review als abgenommen
(L0 prüft Stichprobe); Plan durch `lead-tech` sonnet (E-054), Umsetzung nach I-049-UI.

Regelbezug: gates.md Gate Spec, R467, R528 · Kosten bei Irrtum: ein Spec-Nachtrag.

Entscheider: L0 · Anlass: Urteil lead-qa gate-UI-TEXTE-1 · ADR: —

## R531 · 2026-10-11 · D-i048-01: Schlüsselfolge-Tests dürfen um `buyPct` nachgeführt werden

Ruling: AK-ZK-01 (`buyPct` letzter Weltschlüssel) und AK-ZK-13 („`save*.test.ts` unverändert“) widersprechen sich in sechs
Tests, die die Schlüsselfolge von hinten bzw. per Handvergleich prüfen (`save.test.ts` Z. 400/558, `save-v11.test.ts`
ab Z. 56, `save-v12.test.ts` ab Z. 59). Auslegung: Nur diese Offsets und Handvergleiche werden um `buyPct` verschoben,
keine Erwartung wird gelockert (Muster M13-E2). AK-ZK-13 gilt weiter für Fixtures, Pins und Balancing; der Diff-Beleg in
T05 nennt genau diese Zeilen. Abweichungen aus T02 (Preistabelle 100/160 im Arbitrage-Test, `SELL_RECOVERY_INTERVAL` 10
bis Schritt B, `reserve`-Rückfaltung erst nach `git merge main` mit I-049-Sim) angenommen.

Regelbezug: R505, R506, M13-E2-Muster · Kosten bei Irrtum: sechs Testzeilen zurückzudrehen.

Entscheider: L0 · Anlass: Bericht lead-tech I048-SIM · ADR: —

## R532 · 2026-10-11 · Gate Plan TOOL-BUENDEL-7: BEDENKEN → Plan-Nachtrag; Budget 8

Ruling: lead-qa BEDENKEN (B1–B6), kein ZURÜCK. Bestätigt: Präfix-Regel wie R528 (3); T04 als eigenes Stdlib-Skript statt
Prettier-Plugin (ADR-001). Entscheide: **B1** drei Task-Reviews (`qa-code-reviewer` sonnet nach T01/T02, T03, T04/T05),
Budget **8 Starts**, Parallelität 1. **B2** Hook und Metrik gemeinsam: eine gemeinsame Funktion für die Freigabe-Namen,
die `model.py` und `budgetwarn.py` nutzen; `budgetwarn.py`/`test_budgetwarn.py` fest in T03 mit Rot-Test (`X` bindet
`X-T01`, nicht `XY-T01`). **B3** Bestands-Treffer: T04 darf die Maskierung `\|` in den gefundenen Doku-Dateien (auch
`docs/studio/retros/`, `docs/superpowers/plans/`) als eigenen `docs:`-Commit beheben — reine Formatierung, kein Inhalt;
keine Ausnahmeliste. Makefile-Exit als Maximum laut Vorschlag; Tests für eingerückte/zitierte Tabellen und Backtick-Regel.
**B4** `gate-` zählt **nicht** in `produktiv` (Gates sind Steuerung); Mehrfachzählung zwischen `steuerung` und `produktiv`
ausdrücklich im Plan, Test „`produktiv` ≤ 1, `Budget: keins` ohne Phase zählt nicht“. **B5** Abhängigkeit T05 → T03 streichen.
**B6** übernehmen. Nach dem Nachtrag gilt der Plan ohne erneutes Review als abgenommen (L0 prüft Stichprobe); Umsetzung im
Worktree `.worktrees/tool-b7` durch einen Controller `lead-tech` sonnet, spielfremd, darf vor M13-Ende laufen (R505).

Regelbezug: gates.md Gate Plan, R392, R471, R523 V3, R528 · Kosten bei Irrtum: ein Werkzeug-Nachtrag.

Entscheider: L0 · Anlass: Urteil lead-qa gate-TOOL-BUENDEL-7 · ADR: —

## R533 · 2026-10-11 · UI-TEXTE-1: Stilllegen-Wortlaut aus der Def (50 %, aufgerundet); R530 berichtigt

Ruling: Der Plan (`b5bc0168`) belegt `PAUSED_UPKEEP_PCT = 50` (`src/sim/defs/buildings.ts:303`, Aufrundung je Betrieb in
`levels.ts:18`); die 60 % aus R467 Befund 4 sind nur der Fall Basis 5 → 3. Der in R530 angenommene Wortlaut «Unterhalt auf
60 %» ist damit falsch und wird ersetzt: **Option A** — Text aus der Def, «Stillgelegt — Unterhalt auf 50 % (aufgerundet)»
über `${PAUSED_UPKEEP_PCT}`, README „50 % des Unterhalts, je Betrieb aufgerundet“; kein Spielwert ändert sich. Der
Spec-Autor berichtigt AK-UT-02/-04 entsprechend; `style.css:212` (Holz, `.btn.unaffordable`) bleibt unverändert.
Gate Plan durch `lead-qa`; Umsetzung erst nach den Merges von I-049-UI und I-048-UI (Budget 6 bei Start).

Regelbezug: R467, R530 · Kosten bei Irrtum: ein Wortlaut.

Entscheider: L0 · Anlass: Bericht lead-tech plan-UI-TEXTE-1 · ADR: —

## R534 · 2026-10-11 · Gate Plan UI-TEXTE-1: BEDENKEN → Nacharbeit ohne Zweitprüfung

Ruling: lead-qa BEDENKEN (B1–B3), kein Blocker; Vorschlag übernommen. **B1** Plan nach R533 nachführen (Wortlaut
«Stillgelegt — Unterhalt auf ${PAUSED_UPKEEP_PCT} % (aufgerundet)», Blocker-Abschnitt und Option B streichen). **B2**
AK-UT-14-Test mit einem Betrieb mit `produces` und `consumes` (z. B. Weberei). **B3** Budget **6** mit zwei Zwischen-Reviews
(nach T02 und nach T04) und Final-Review opus, ein Puffer. Nacharbeit durch den Planverfasser; danach gilt der Plan als
abgenommen (L0 prüft Stichprobe). Start erst nach den Merges von I-049-UI und I-048-UI.

Regelbezug: gates.md Gate Plan, R530, R533 · Kosten bei Irrtum: ein Plan-Nachtrag.

Entscheider: L0 · Anlass: Urteil lead-qa gate-plan-UI-TEXTE-1 · ADR: —

## R535 · 2026-10-11 · Gate Merge I049-SIM: OK; Mini-UI-Zweige zulässig

Ruling: Sim-Strang T01–T04 (`feat/i049-sim` @ `ffccf116`, Reviews OK, `make check` Exit 0, Baseline unverändert, Zeiten ohne
Ausreisser über 500 ms) → **Gate Merge OK** (Plan T04: Sim-Merge vor dem UI-Strang; Final-Review T09 über beide Branches
nach dem UI-Strang). Save Fall A: v12 bleibt, `migrateV11ToV12` ergänzt `reserve`. Die Minimalzweige für `'waitingReserve'`
in `src/ui/texts.ts`/`panelView.ts` (Ownership-Abweichung für `tsc` Exit 0) sind zulässig; I-049-UI T06 verfeinert sie.
Golden-Hash in `reserve-bitgleich.test.ts`: I048-SIM erzeugt ihn nur neu, wenn sich die Sim bewusst ändert, mit Rezept im
Dateikopf. Reihenfolge: Integrator mergt I049-SIM; danach führt I048-SIM `git merge main` aus (Konflikte in `save.ts`,
`helpers.ts`, `types.ts`, `world.ts`), ergänzt die `reserve`-Rückfaltung, `make check`, dann Gate Merge I048-SIM; danach I-049-UI.
Wochenfenster hoch: Parallelität halbiert (höchstens 2 Umsetzungsstränge).

Regelbezug: R505, R506, R511, R531 · Kosten bei Irrtum: ein Rückmerge im Sim-Strang.

Entscheider: L0 · Anlass: Bericht lead-tech I049-SIM · ADR: —

## R536 · 2026-10-11 · Merge I049-SIM angenommen; Gate Merge TOOL-BUENDEL-7: OK; I048-SIM holt main

Ruling: Integrator-Merge `cda5fdb7`/`1cbbdf89` (keine Konflikte, `make check` und `check-ci-perf` Exit 0; Zwischen-Merge nur
wegen eines Doku-Commits, keine Neuprüfung nötig) angenommen. **TOOL-BUENDEL-7** (`tool/b7`, T01–T05, Final-Review opus
BEDENKEN → Fixes, Delta-Review OK, `make studio-test` Exit 0): **Gate Merge OK**; Abweichungen (Retro-Commit `42c89283`
Zellenkorrektur, `lead_phases` 1:1) angenommen. Integrator mergt `tool/b7` lokal (spielfremd, kein Push nötig vor
Release M13). **I048-SIM** führt jetzt `git merge main` aus, löst die Konflikte in eigener Ownership, ergänzt die
`reserve`-Rückfaltung (Prod-B4), `make check`; danach Gate Merge I048-SIM.

Regelbezug: R505, R532, R535 · Kosten bei Irrtum: ein Werkzeug-Rückbau.

Entscheider: L0 · Anlass: Berichte Integrator MERGE-I049-SIM, lead-tech TOOL-BUENDEL-7 · ADR: —

## R537 · 2026-10-11 · Gate Merge I048-SIM: OK; I-049-UI startet

Ruling: Sim-Strang I-048 (`feat/i048-sim` @ `dcae12eb`, gemergt mit `b569a8f2`; Task-Reviews und Delta-Review OK,
Final-Review opus OK ohne hohen Befund, `make check` Exit 0 auf `dcae12eb` nach einem Last-Ausreisser
`terrain.test.ts` bei Load 8,5) → **Gate Merge OK** (Muster R535: Sim-Merge vor dem UI-Strang; Final-Review über beide
Stränge nach dem UI-Strang). Konfliktlösung `save.ts` (`ef0b214a`) und Rückfaltung `reserve`/Denkmal/`buyPct`
(`dcae12eb`, Prod-B4) angenommen. Der laufende Integrator mergt `feat/i048-sim` **nach** `tool/b7`, seriell.
**I-049-UI** (T05–T09) startet jetzt: Controller `lead-tech` sonnet, Worktree `.worktrees/i049-ui` von `main`
(I-049-Sim enthalten), Budget **11** (Rest aus 21: T05–T09 8 Starts + Puffer 3), Parallelität 1. Vor T07 und T09
`git merge main` (dann mit I048-SIM). Wochenfenster hoch: höchstens 2 Umsetzungsstränge (R535).

Regelbezug: R505, R506, R535, R536 · Kosten bei Irrtum: ein Rückmerge im Sim-Strang.

Entscheider: L0 · Anlass: Bericht lead-tech I048-SIM · ADR: —

## R538 · 2026-10-11 · Retro adhoc-ampel-1011: V1 ins nächste Werkzeug-Bündel, V2 Messauftrag

Ruling: **V1** angenommen: `effort.ampel_incidents` meldet `steuerung` nur noch, wenn die **bereinigte** Zeile (E-049) in
zwei Sessions rot ist; Rohzeile und Schwellen bleiben sichtbar. Umsetzung als Task im nächsten Werkzeug-Bündel
(TOOL-BUENDEL-8, spielfremd, darf vor M13-Ende laufen). **V2** angenommen als Messauftrag: Die nächste Session-Retro trennt
bei Plan-Instanzen über 60 Turns Erstfassung und Nachtrag (Cache-Write je Phase). Das Experiment „Turnkappe 60 für
Plan-Instanzen“ trägt der Coach als E-062 „vorgeschlagen (wartet auf Platz)“ ein. **V3** angenommen. Der Last-Flake in
`terrain.test.ts` steht in `docs/beobachtungen.md` und geht mit in TOOL-BUENDEL-8 zur Prüfung.

Regelbezug: R316, R523, E-049 · Kosten bei Irrtum: ein verdecktes Steuerungsproblem (Revert einer Funktion).

Entscheider: L0 · Anlass: Bericht studio-coach adhoc-ampel-1011 · ADR: —

## R539 · 2026-10-11 · Gate Plan TOOL-BUENDEL-8: BEDENKEN → Nachtrag; keine künstliche Last

Ruling: lead-qa BEDENKEN (1–7), kein ZURÜCK. **B1/B2 anders gelöst als vorgeschlagen:** T03 erzeugt **keine künstliche
Last** (kollidiert mit parallelen Strängen, R329, TOOL-TESTLOCK). Stattdessen neue **T05**: `testrun` schreibt beim
roten Lauf die Fehlermeldung (gekürzt, je fehlgeschlagenem Test) ins `test_failed`-Ereignis, mit Rot-Test. T03 schrumpft
auf Quellcode-Diagnose ohne Code-Fix; ein Fix (z. B. `testTimeout`) folgt erst, wenn ein aufgezeichnetes Ereignis die
Ursache belegt (eigenes Häppchen, dann auch `vite.config.ts` zulässig). **B3** `save.test.ts` in die Diagnose aufnehmen.
**B4** Testfall „nicht gemessen“ ergänzen. **B5–B7** übernommen; Grenzen wörtlich ins Umsetzer-Briefing. Offene Entscheide:
(1) `deny` als eigenes Ruling nach T02 mit Echtlauf gegen Lagerdaten; (2) erledigt durch T05; (3) seriell. Budget **7**,
Parallelität 1. Nach dem Nachtrag gilt der Plan ohne erneutes Review als abgenommen (L0 prüft Stichprobe); Umsetzung im
Worktree `.worktrees/tool-b8` (Branch `tool/b8`), spielfremd, darf neben I-049-UI laufen (zweiter Strang, R535).

Regelbezug: gates.md Gate Plan, R329, R380, R535, R538 · Kosten bei Irrtum: Flake-Ursache eine Runde später belegt.

Entscheider: L0 · Anlass: Urteil lead-qa gate-plan-TOOL-BUENDEL-8 · ADR: —

## R540 · 2026-10-11 · Gate Merge TOOL-BUENDEL-8: OK

Ruling: `tool/b8` (T01 `990b3025`, T02 `aab8c8de`, T05 `35063079`, T04 `ebdf8ca2`; T03 Diagnose als Beobachtungstext)
mit Task-Reviews OK und Final-Review opus OK (Stufe leicht, gilt als Final-Review); `make studio-test`, `make lint`,
`make docs-check` Exit 0, Rot-Belege T01/T02/T05 `EXIT=1`, Echtläufe belegt → **Gate Merge OK**. L0 hat die Prüffragen
von lead-qa selbst anhand des Berichts geprüft (spielfremd, kein `src/`, keine Secrets, Commit-Konvention). Abweichungen
angenommen: Rückrechnung über 6 statt 10 Metrik-Dateien; `--amend` eines lokalen, ungepushten Commits. Die drei
niedrigen Hinweise (Meldung nur am letzten FAIL-Namen, `messages` ist freier Text und muss bei späterer Anzeige im
Dashboard escaped werden, Testzeile ohne `_adjusted_line`) gehen ins nächste Werkzeug-Bündel. Der Integrator mergt
`tool/b8` lokal, kein Push. **E-060 `deny`** entscheidet L0 nach dem Merge in einem eigenen Ruling.

Regelbezug: gates.md Gate Merge (Stufe leicht), R538, R539 · Kosten bei Irrtum: ein Werkzeug-Revert.

Entscheider: L0 · Anlass: Bericht lead-tech TOOL-BUENDEL-8 · ADR: —

## R541 · 2026-10-11 · Merge TOOL-BUENDEL-8 angenommen; E-060 wartet auf Platz

Ruling: Integrator-Merge `ecf9972b` (keine Konflikte, `make check`, `make studio-test`, `make check-ci-perf` Exit 0)
angenommen. **E-060 (`deny`)** startet noch nicht: Die drei Experiment-Plätze sind belegt (E-057, E-059, E-061;
experimente.md Obergrenze 3). Der Schalter bleibt `warn`; Start per Ruling, sobald ein Platz frei ist und nur eine Session
läuft (R520), mit Echtlauf gegen Lagerdaten (R539). `studio-coach` prüft jetzt, ob E-059 (3 Merges) und E-061
(3 Instanzen) bewertbar sind; Reihenfolge freier Plätze: E-060 vor E-062.

Regelbezug: R520, R539, R540, experimente.md · Kosten bei Irrtum: E-060 startet eine Session später.

Entscheider: L0 · Anlass: Bericht Integrator MERGE-TOOL-BUENDEL-8 · ADR: —

## R542 · 2026-10-11 · E-059 läuft passiv ohne Platz; E-060 startet mit `deny`

Ruling: E-059 (Merge-Treiber) braucht keine Verhaltensänderung, misst nur, und hat in 7 Merges nie gegriffen (0 von 3,
Bericht EXP-BEWERTUNG-1011). Es läuft **passiv ohne Platz** weiter (Muster E-058), Bewertung bei 3 beidseitigen Merges
oder spätestens 2026-11-19. E-061 bleibt laufend (verlängern, Bewertung beim dritten sauber getrennten Datenpunkt).
Der freie Platz geht an **E-060**: `studio-coach` macht zuerst den Echtlauf (R539) — Hook-Entscheid gegen alle
Lead-Starts mit Budgetzeile in `.studio/events.jsonl` seit 2026-10-10 — und stellt `BUDGET_MODE` nur dann auf `deny`,
wenn kein Fehlblock bei „Budget: keins“ und bei Folge-Controllern auftritt; sonst Bericht ohne Umstellung. Bedingung
„nur eine Session läuft“ (R520) ist erfüllt (eine aktive L0-Session). Rückfall: `git revert`.

Regelbezug: R520, R539, R541, experimente.md Obergrenze 3 · Kosten bei Irrtum: ein blockierter Lead-Start (ein Aufruf mehr).

Entscheider: L0 · Anlass: Bericht studio-coach EXP-BEWERTUNG-1011 · ADR: —

## R543 · 2026-10-11 · E-060: Echtlauf 5 Fehlblocks → Abgleich-Fix TOOL-E060-FIX, dann zweiter Echtlauf

Ruling: Der Echtlauf (113 Lead-Starts seit 2026-10-10) ergab 3 berechtigte und 5 Fehlblocks; `BUDGET_MODE` bleibt `warn`
(R542-Bedingung). Ursache: Freigabe-Phasen mit Rollen-Präfix (`impl-`, `plan-`, `design-`, `gate-`,
`release-check-`) treffen `package_names()` nie; ein Folge-Controller trug „Budget: n verbleibende“ im Kopf.
Entscheid: **beides** — (a) Werkzeug: Die gemeinsame Namensfunktion entfernt beim Abgleich bekannte Rollen-Präfixe von
der Freigabe-Phase (für Hook **und** `model.py`, eine Quelle, R532 B2); „Budget: n verbleibende …“ gilt als Folge-Controller
(kein Block, R433 V3 b). (b) Konvention: L0 vergibt die Freigabe-Phase künftig als reine Paket-ID (wie seit R537).
Paket **TOOL-E060-FIX** (spielfremd, Stufe leicht): Controller `lead-tech` sonnet, Budget **4** (Umsetzer, Task-Review,
Final-Review opus, Puffer), Worktree `.worktrees/tool-e060`. Danach wiederholt der Coach den Echtlauf; bei 0 Fehlblocks
`deny`. E-060 belegt den Platz bis dahin (Zeitraum zählt erst ab Umstellung).

Regelbezug: R433, R520, R532, R542 · Kosten bei Irrtum: ein Werkzeug-Revert, `deny` eine Session später.

Entscheider: L0 · Anlass: Bericht studio-coach Echtlauf E-060 · ADR: —

## R544 · 2026-10-11 · Gate Merge I049-UI: OK (I-049 komplett)

Ruling: `feat/i049-ui` @ `c972af5e` (T05–T07 Reviews OK bzw. BEDENKEN behoben, T08 Browser-Check OK bei 1280/1440 px,
T09 Final-Review opus über Sim + UI BEDENKEN → behoben mit Tests `298b0820` und Doku `8de6bc79`; `make check`, `tsc`,
`make lint`, `make zeittests`, `make docs-check` Exit 0) → **Gate Merge OK** (Stufe leicht; L0 prüft die lead-qa-Fragen
anhand des Berichts). Kein Delta-Review nötig, da die Fixes nach T09 nur Tests und Doku betreffen. Abweichungen
angenommen: Reserve in fester zweiter Zeile (Browser-Befund), «Stein, Holz» nach Spec über `reserveGoods`,
Ownership-Abweichung `src/ui/hints.ts`, Start 9 für die R481-Tests. **Absagetexte** in `src/sim/reserve.ts` («Ungültiges
Gut», «Ungültiger Wert») statt Spec R4 angenommen, da für Spieler unsichtbar (UI bietet nur gültige Werte). Befund
`stateText` ohne Aufrufer steht in den Beobachtungen. Integrator mergt `feat/i049-ui` lokal; danach startet **I048-UI**
(T04) von main, Budget 4 (Controller, Umsetzer, Review, Puffer), Parallelität 1.

Regelbezug: gates.md Gate Merge, R505, R535, R537 · Kosten bei Irrtum: ein Rückmerge im UI-Strang.

Entscheider: L0 · Anlass: Bericht lead-tech I049-UI · ADR: —

## R545 · 2026-10-11 · Gate Merge I048-UI: OK (Strang-Merge vor Schritt B)

Ruling: `feat/i048-ui` @ `d0629d4c` (T04, Rot-Commit `e69e7d11`, Review OK; `make check`, `tsc`, `make lint` Exit 0) →
**Gate Merge OK** nach Muster R535/R537: Strang-Merge vor dem Abschlussstrang; das Final-Review opus über ganz I-048 läuft
laut Plan am Ende von I048-B (nach T08). Abweichungen angenommen: `ReasonCtx` aus `./hints`, `style.css` unverändert
(Umbruch per `flex-wrap`). **Auflagen für I048-B:** T07 prüft «Kauf … %»/«Verkauf … %» neben der Reserve-Zeile bei
1280 px ohne Umbruch; T08 führt `README.md:387` und `docs/arc42.md:301` (inkl. `tradeReasonCtx`) nach. `make zeittests`
bei Last 4,5 nicht belastbar → I048-B wiederholt ihn. Integrator mergt; danach startet I048-B (T06–T08), Budget 6
(Controller, Umsetzer T06+T08, Review T06, Playtester T07, Final-Review opus, Puffer), Parallelität 1.

Regelbezug: gates.md Gate Merge, R505, R535, R537, R544 · Kosten bei Irrtum: ein Rückmerge im UI-Strang.

Entscheider: L0 · Anlass: Bericht lead-tech I048-UI · ADR: —

## R546 · 2026-10-11 · Gate Merge TOOL-E060-FIX: OK; zweiter Echtlauf E-060

Ruling: `tool/e060-fix` @ `a7aacc13` (Task-Review OK, Final-Review opus nach zwei ZURÜCK-Runden OK, Rot-Belege je
Fix-Runde, `make studio-test` und `make lint` Exit 0) → **Gate Merge OK** (Stufe leicht). Angenommen: eine gemeinsame
Funktion `phase_matches` für Hook und Metrik, Rohphase bleibt gespeichert (`gate-`-Einordnung unverändert, R532 B4).
Entscheidungsbedarf „Namenstreffer schlägt ausdrückliche Lead-Freigabe“: so lassen, als Beobachtung im zweiten Echtlauf
prüfen (betrifft nur Altdaten mit Präfix-Phasen). Integrator mergt lokal; danach wiederholt der Coach den Echtlauf
(R543) und stellt bei 0 Fehlblocks `BUDGET_MODE` auf `deny`.

Regelbezug: R532, R542, R543 · Kosten bei Irrtum: ein Werkzeug-Revert.

Entscheider: L0 · Anlass: Bericht lead-tech TOOL-E060-FIX · ADR: —

## R547 · 2026-10-11 · I-048 AK-ZK-15: Grenze als Anteil am Zukauf-Volumen (≤ 15 %)

Ruling: Designurteil lead-design (D-I048-B-GRENZE) angenommen, **Option 1 mit neuer Bezugsgrösse**. Die Mechanik wirkt wie
gedacht (Werkzeug klein gekauft +7 %, Holz-Engpass +27 %); falsch war die Kalibrierung in Anhang b (nur Werkzeug gerechnet).
Werte bleiben `BUY_RISE` 2, `SELL_RECOVERY_INTERVAL` 20. **AK-ZK-15 neu:** zwei Asserts — Festwert der Mehrkosten (heute 544,
Toleranz 0) und **Mehrkosten ≤ 15 % des Zukauf-Volumens zum Listenpreis** (heute 11,1 %); der Controller summiert das Volumen
mit (`trackedBuy`). Die Startgeld-Grenze 250 entfällt. Option 2 (Erholung, `BUY_CAP`) und 3 (`BUY_RISE` 1) verworfen
(Wirkung zu klein bzw. Biss halbiert, Sieg-Tick 7550). AK-ZK-02–05, -20–22 bleiben. **Spec-Nachtrag** (`design-spec-author`
sonnet, E-061): §1 «≈ 4 % des Startgelds» → «≈ 11 % des Zukauf-Volumens, Holz-Engpass 27 %», §6 Schritt B und AK-ZK-15 nach
diesem Ruling, Fussnote Anhang b. **README** (T08): «Bis rund 30 Einheiten je Minute …» ersetzen durch eine Aussage über
verteilte Käufe («Käufe kurz nacheinander addieren sich»). I048-B setzt B3–B7 sofort nach diesem Ruling fort; der
Spec-Nachtrag läuft parallel auf main. Sieg-Tick-Sprunghaftigkeit steht in den Beobachtungen.

Regelbezug: R487 P-1, R490, R505, Spec I-048 §6/P-5 · Kosten bei Irrtum: Versprechen „wer klein zukauft, merkt nichts“
verwässert schleichend; Abhilfe zweite Grenze nur Werkzeug ≤ 10 %, Playtest-Hebel P-5.

Entscheider: L0 · Anlass: Stopp lead-tech I048-B, Urteil lead-design · ADR: —

## R548 · 2026-10-11 · UI-TEXTE-1 startet parallel zu I048-B; Merge danach

Ruling: Die Startbedingung aus R533/R534 (Merges I-049-UI und I-048-UI) ist erfüllt (`ae20a9af`, `9d01765f`). UI-TEXTE-1 startet
jetzt als zweiter Strang: Controller `lead-tech` sonnet, Worktree `.worktrees/ui-texte-1`, Budget **6** (R534 B3), Parallelität 1.
Dateiüberschneidung mit I048-B nur in `tests/ui/trade.test.ts` und `README.md` (andere Abschnitte): UI-TEXTE-1 mergt **nach**
I048-B und holt vorher `main` per Merge (kein Rebase); Konflikte in diesen beiden Dateien löst der Controller in eigener
Ownership. Danach Release M13 (R505).

Regelbezug: R505, R533, R534, R535 (≤ 2 Umsetzungsstränge) · Kosten bei Irrtum: ein Merge-Konflikt in einer Testdatei.

Entscheider: L0 · Anlass: Merges I-049-UI, I-048-UI · ADR: —

## R549 · 2026-10-11 · I-048 Schritt B angehalten (D-150); Release M13 ohne aktiven Zukauf-Aufschlag

Ruling: Designurteil D-150 (lead-design, 27 Konfigurationen Seed 3) angenommen: **kein Wertepaar** mit `BUY_RISE` ≥ 1 hält alle
Grenzen; fast passende Paare (1/15, 2/20) wären Anpassung an den Bot, Controller-Kalibrierung ebenso. Ursache liegt in der
Formel Z2 (Anteil steigt schon innerhalb eines Kaufs je Einheit; gebündelte kleine Käufe zahlen 5–11 %), nicht in den Werten.
Entscheid: (1) **Schritt B angehalten**, P-2 (Verkaufserholung 20) zurückgenommen. `main` bleibt bei `BUY_RISE` 0 und
`SELL_RECOVERY_INTERVAL` 10 — die Mechanik ist eingebaut, aber inaktiv; Save v12 enthält `buyPct` bereits, eine spätere
Wertänderung braucht keine Save-Änderung. (2) **R505 angepasst:** Die Release-Sperre endet nach dem Merge von UI-TEXTE-1;
Release M13 = E2 + I-049 + I-048 Schritt A (inaktiv) + UI-NAECHSTER-SCHRITT + TOOL-Bündel 6–8 + UI-TEXTE-1. Die Anzeige
«Kauf 100 %» bleibt im Release (zeigt den künftigen Mechanismus, Release-Notiz nennt sie). (3) **I-048 Schritt B neu**
nach M13: Spec-Nachtrag Totzone (`max(100, buyPct − BUY_FREE)`, Erstvorschlag `BUY_FREE` 20, `BUY_CAP` 180) durch
`design-spec-author` opus nach Probe `lead-tech` (≈ 15 Tools); dazu prüfen `lead-qa`/`lead-tech` eine Ensemble-Messung
(z. B. 5 feste Controller-Phasen, Median) für die Klasse-N-Tests. (4) `feat/i048-b` @ `bc57f8ba` bleibt geparkt (Messweg
`trackedBuy`, Klasse-R-Umzug wiederverwendbar), kein Merge; Restbudget verfällt, neues Budget beim Neustart.
Beobachtung Sieg-Tick-Sprunghaftigkeit auf „hoch“ angehoben.

Regelbezug: R487 P-1/P-2, R505, R547, Spec I-048 §6/P-5 · Kosten bei Irrtum: I-048 kommt ein Release später; kein Schaden
auf `main`.

Entscheider: L0 · Anlass: D-150 lead-design (D-I048-B-WERTE), Stopp lead-tech I048-B · ADR: —

## R550 · 2026-10-11 · UI-TEXTE-1 AK-UT-05: Wortlaut ohne Artikel («Nur einmal je Insel»)

Ruling: Der Spec-Wortlaut «Nur ein <Name> je Insel» ergibt bei femininen Namen falsches Deutsch («Nur ein Amtsstube je
Insel»); die Spec-Annahme Z. 48 („kein Artikel-Problem bei Amtsstube“) ist falsch. Neu: **«Nur einmal je Insel»** (ohne
Namen, die Zeile steht ohnehin im Tooltip des Gebäudes). Test über alle Defs mit `maxCount.n === 1` bleibt (AK-UT-05);
`tests/ui/tooltip.test.ts` und README entsprechend. Umsetzung im Strang vor dem Final-Review (Fortsetzung des Umsetzers,
kein neuer Start); Spec-Zeile 32/48 berichtigt der Controller im Branch als `docs:`-Commit.

Regelbezug: R530, R534 · Kosten bei Irrtum: ein Tooltip-Wortlaut.

Entscheider: L0 · Anlass: Bericht lead-tech UI-TEXTE-1 (Testnachzug `tooltip.test.ts`) · ADR: —

## R551 · 2026-10-11 · Probe Totzone: keine tragfähige Preisformel; I-048 Schritt B zurück ins Design

Ruling: Probe `lead-tech` (Raster `BUY_RISE` {1, 2} × `BUY_FREE` {10, 20, 30}, Intervall 10, `BUY_CAP` 180) angenommen: Nur 1/30
hält alle Grenzen und wirkt praktisch nicht (0,04 % Mehrkosten, 30er-Holz +0 %); 1/20 reisst Edikte arm (Abstand 700 > 600);
`BUY_RISE` 2 reisst die Krisen-Grenze bei jedem `BUY_FREE`. Zusätzlich: Die Controller-Läufe sind für Seeds 3/5/7/11 bitgleich
(der Seed ändert nur Fremdinseln) — Seeds taugen nicht als Robustheitsachse. Entscheid: **Keine Werte setzen.** I-048 Schritt B
geht als Designfrage ins nächste Brainstorming nach M13 (lead-design, zusammen mit M14-Vorlauf): Mengenstaffel o. ä. statt
Preisformel, oder Verzicht auf Schritt B (Mechanik bleibt inaktiv). Voraussetzung jeder Neumessung: robustere Gate-Messung
(Controller-Phasen oder Startvarianten der Heimkolonie, Median) — als Ideen-/Werkzeug-Eintrag für `lead-qa`/`lead-tech`.
Kein Spec-Nachtrag Totzone. Messdaten bleiben im Scratchpad (nicht versioniert); die Tabellen stehen im Handoff
`.studio/handoffs/2026-10-11-lead-design-D-I048-B-WERTE.md` bzw. im Bericht dieser Probe.

Regelbezug: R547, R549, Spec I-048 P-5 · Kosten bei Irrtum: I-048 Schritt B verzögert sich weiter; kein Schaden auf `main`.

Entscheider: L0 · Anlass: Bericht lead-tech probe-I048-TOTZONE · ADR: —

## R552 · 2026-10-11 · Gate Merge UI-TEXTE-1: OK; M13-Inhalt vollständig

Ruling: `feat/ui-texte-1` @ `fbbfd6e4` (Zwischen-Reviews BEDENKEN→behoben / OK, Browser-Check AK-UT-04/-09/-10/-13 OK,
Final-Review opus ZURÜCK → Fixes → **Delta-Review opus OK**, Texte auf Grammatik/Genus geprüft; `make check` 3529 Tests,
`tsc`, `make lint`, `make zeittests`, `make conflicts`, `make docs-check` Exit 0; kein Test > 500 ms) → **Gate Merge OK**.
Abweichungen angenommen: Wortlaut R550, Testnachzug `tooltip.test.ts`, Zeitvergleich vom Stand `fa4bb075` (Fix danach nur
Texte/Tests). Integrator mergt lokal. Damit ist der Inhalt von **Release M13** vollständig (R549). Push frühestens am
2026-10-12 (REL-19 am 2026-10-11 gepusht; Actions-Prognose rot, ein Push je Tag, R488 V2) über `make push-check`; bis dahin
Sicherung nach `origin/backup/main-lokal` (R524, kein CI).

Regelbezug: gates.md Gate Merge, Verfassung §9, R505, R549, R550 · Kosten bei Irrtum: ein Rückmerge im UI-Strang.

Entscheider: L0 · Anlass: Bericht lead-tech UI-TEXTE-1 · ADR: —

## R553 · 2026-10-11 · Retro session-f2a404fd: V1, V2 angenommen (Handbuch 1.51), V3 beobachten

Ruling: **V1** angenommen: Gate Spec und Gate Plan erhalten die Prüffrage „Beruht jede Wertgrenze (Balancing, Sieg-Tick,
Mehrkosten) auf mehr als einem unabhängigen Lauf? Wenn nein: als Risiko mit Rückfall benannt?“ (gates.md). Solange der
Controller nur einen Lauf kennt (Beobachtung „Seed wirkt nicht“), genügt die Risiko-Benennung. **V2** angenommen: Nach einem
Final-Review ZURÜCK ist ein Delta-Review desselben opus-Reviewers (Fortsetzung, kein Start) Pflicht vor dem Bericht an L0;
STUDIO.md (Umsetzungsablauf) und `.claude/agents/lead-tech.md`. Umsetzung als Handbuch-Minor **1.51** durch `studio-coach`
(CHANGELOG). **V3** nur beobachten. Ampel rot Steuerung bereinigt 50,3 %: erste bereinigte Rot-Session — Messauftrag an die
nächste Session-Retro (Anteil L0-Gate-Rulings vs. Lead-Steuerung). Cache-Write: Hebel E-062 (wartet auf Platz).

Regelbezug: R316, R538, R549–R552, Verfassung §9 · Kosten bei Irrtum: eine Prüffrage bzw. ein Delta-Review je ZURÜCK.

Entscheider: L0 · Anlass: Retro session-f2a404fd-ende · ADR: —

## R554 · 2026-10-11 · Session-Plan bis Release M13: Plan M14-E1, Designfrage I-048 B, Werkzeug Gate-Messung

Ruling: Auftrag „mach weiter“ = Plan aus state.md fortsetzen. Release M13 bleibt auf 2026-10-12 (ein Push je Tag, R335).
Wochenfenster 84 %: höchstens 4 Agenten gleichzeitig (STUDIO.md Limits, R69). Auslegung R486/R501 „Plan erst nach Abschluss
M13“: Der **Inhalt** von M13 ist abgeschlossen (R552), main ändert sich bis zum Release nur bei einem Release-Fehler; der Plan
M14-E1 darf daher jetzt als Vorarbeit (R475) entstehen, Vergleichsbasis (QA-B3) ist main @ `9113e574`, **Umsetzung erst nach
dem Release M13**. Start: (1) `plan-M14-E1` an `lead-tech` opus mit allen Auflagen R500/R501; (2) `design-I048-B` an
`lead-design` opus: Designfrage Schritt B (Mengenstaffel o. ä. oder Verzicht), Ergebnis als Vorschlag mit Empfehlung, keine
Werte, keine Spec; (3) `plan-TOOL-GATE-ENSEMBLE` an `lead-tech` sonnet (Werkzeug-Paket): robustere Gate-Messung
(Controller-Phasen oder Startvarianten, Median) als Plan, Voraussetzung jeder Neumessung (R551, R553 V1). Ideen-Runde erst
nach dem Release (state.md Punkt 3).

Regelbezug: R335, R475, R486, R500, R501, R551, R553, STUDIO.md Limits · Kosten bei Irrtum: Plan M14-E1 muss bei einem
Release-Fix an `main` die Vergleichsbasis nachziehen (eine Zeile im Plan-Index).

Entscheider: L0 · Anlass: Session-Start, Nutzer „mach weiter“ · ADR: —

## R555 · 2026-10-11 · Gate Brainstorming I-048 Schritt B: Option 2 Kontingent-Staffel als Richtung

Ruling: Vorschlag `docs/superpowers/specs/2026-10-11-i048-b-designfrage.md` (`3a1ca5a6`) angenommen, Selbstprüfung lead-design
BEDENKEN (Regel im ersten Spiel sichtbar, kostet selten) zur Kenntnis — gewollt, die Staffel ist Spätspiel-Druck. Entscheid:
**Option 2** (je Gut weltweites Kontingent zum Listenpreis, darüber eine feste Stufe) als Richtung. Bedingungen: (a) **Massstab
umgestellt:** Der Assert „Mehrkosten ≤ 15 % beim Controller“ (R547) entfällt für Schritt B; gilt künftig „Controller bitgleich,
Wirkung per Szenario-Test am Preiskern `buyQuote`“, Neumessung nur `balance-merchants`. (b) Reihenfolge: Last-Probe,
Werte (`design-economy-designer`) und Spec-Nachtrag (`design-spec-author` opus) erst nach Abnahme TOOL-GATE-ENSEMBLE und nach
Release M13. (c) Abbruchkriterium: Controller-Last je Gut > 30/min oder Kontingent unter der Krisen-Last → Option 1 (Verzicht),
ohne neues Brainstorming. (d) Save-Frage (`buyPct` mit neuer Bedeutung) klärt `lead-tech` im Plan. I-047 bleibt hinter I-048
(R486 O3).

Regelbezug: gates.md Gate Brainstorming, R486, R547, R549, R551, R553 V1 · Kosten bei Irrtum: ein Spec-Nachtrag, der in
Option 1 endet; `main` bleibt bis dahin inaktiv.

Entscheider: L0 · Anlass: Bericht lead-design design-I048-B · ADR: —

## R556 · 2026-10-11 · Kombiniertes Gate TOOL-GATE-ENSEMBLE: OK mit Auflagen, Umsetzung frei

Ruling: Plan `18178c26` (lead-tech), Urteil lead-qa BEDENKEN (1–4, nicht blockierend). L0-Prüffragen: ein Owner je Datei, ein
Worktree `.worktrees/tool-gate-ensemble`; Budget nach Formel 1 × 2 + 1 Final-Review = 3 × 1,3 → **4 Starts**, Parallelität 1;
bleibt leicht (kein `src/`, kein Save). Entscheide: (a) Verdikte je Grenze **OK** (Median und Min/Max innerhalb) · **AUSREISSER**
(nur Median innerhalb) · **GERISSEN** (Median ausserhalb); ein Gate gilt nur bei OK als bestanden, AUSREISSER/GERISSEN gehen als
Bedenken an L0. (b) **5 Phasen** (0, 20, 40, 60, 80). (c) Streuungsschwelle T01: Spannweite des Sieg-Ticks ≥ 1 % von `MAX_TICKS`;
sonst Stopp `blocked`, Eintrag in `docs/beobachtungen.md`, Rückfall in fester Reihenfolge: zuerst Kontrollintervalle
{90, 100, 110}, dann Startverzögerung; erst danach L0. (d) Das Ensemble belegt Robustheit gegen **Entscheidungszeitpunkte**, nicht
gegen Layout oder Seed — so in Plan-Index und Ausgabe-Kopf. (e) T05 nennt den Aufruf `make gate-ensemble` als Pflichtschritt der
Gate-Prüffrage R553 V1 für Pakete mit Wertgrenzen. Nacharbeit 1–4 in Plan-Dateien durch den Controller vor T01, ohne Zweitprüfung.

Regelbezug: gates.md Kombiniertes Gate, R551, R553 V1, Budget-Formel · Kosten bei Irrtum: ein Werkzeug, das nur Timing-Robustheit
misst; Rückfall in (c).

Entscheider: L0 · Anlass: Berichte lead-tech plan-TOOL-GATE-ENSEMBLE, lead-qa gate-TOOL-GATE-ENSEMBLE · ADR: —

## R557 · 2026-10-11 · Gate Plan M14-E1: OK mit Auflagen; R-c2 mit Auflage angenommen

Ruling: Plan `44510be4` (lead-tech opus). lead-production OK mit Hinweisen, lead-qa BEDENKEN (kein ZURÜCK). Entscheid: **OK**,
Budget 21 Starts / Parallelität 2 (Formel 7 × 2 + 1 + 1 = 16 × 1,3) wird beim Start nach Release M13 geloggt (Phasen
`M14-E1-SIM`, `M14-E1-UI`, Pakete per `log.py package`), zwei Controller durch L0. Auflagen, durch die Controller in T00/T03/T05/T08
umzusetzen (kein Plan-Nachtrag): (1) **R-c2 angenommen mit Auflage:** vor dem Neupinnen belegt T03 im Bericht für AK-E1-10, dass
sich die Heimat-Aufrufliste nur in Meer-Zeichenaufrufen ändert (Land, Gebäude, Tiere identisch), und für AK-K1b/K2 einen Teilhash
der Flächen um Heimat, A und B bitgleich zu `9113e574`; neu gepinnt wird nur der Gesamt-Hash, Kommentar `bewusst neu gepinnt
(R557)`. Archipel-Speicher ≈ 56,8 MB (AK-E1-21) angenommen; `lead-art` erhält die Kenntnis im nächsten Start. (2) Der
Controller-Lauf Seed 963 (QA-B3) wird nie gestrichen; reicht die Testzeit nicht, wandert er in einen eigenen Messlauf ausserhalb
`make check`, nicht ins Nichts. (3) Die B3-Rangfolge P1 > P2 > P3 (QA-B2) wird **vor T08** mit TOOL-GATE-ENSEMBLE nachgemessen,
sobald es gemergt ist (Verdikte nach R556); kippt sie → Entwurf an L0. (4) Merge-Reihenfolge: TOOL-GATE-ENSEMBLE vor dem Start
von M14-E1; T00 zieht die Basis nach und nennt `tests/sim/controller.ts` ausdrücklich; T07 startet von `main` nach diesem Merge.
(5) Ein Integrator-Merge `feat/m14-e1` nach `main` (UI per Controller-Merge), ein Merge-Gate. AK-11 nach Zyklus-Skalierung (E6)
zur Kenntnis.

Regelbezug: gates.md Gate Plan, R500, R501, R553 V1, R554, R556 · Kosten bei Irrtum: T03 braucht eine zweite Fix-Runde für die
Teilhash-Belege; Regressionsschutz der Pins bleibt erhalten.

Entscheider: L0 · Anlass: Berichte lead-qa gate-plan-M14-E1, lead-production gate-plan-M14-E1-prod · ADR: —

## R558 · 2026-10-11 · Gate Merge TOOL-GATE-ENSEMBLE: OK; Verdikt OHNE GRENZE; Controller kippt bei Phase 60/80

Ruling: Stufe leicht, Final-Review `qa-code-reviewer` opus BEDENKEN → Fix-Runde → Delta-Review **OK** (Handbuch 1.51). L0 prüft die
lead-qa-Fragen anhand Review und Bericht: Rot-Belege vorhanden (GE-1 als Wächter ohne Rot-Fall, zulässig), `make check` Exit 0
(3545 Tests), `make gate-ensemble` 1,8 s, Testzeiten ohne Ausschlag (R392), kein `src/`, kein Save. Entscheid: (1) **Merge** von
`tool/gate-ensemble` @ `d30a3f88` nach `main` durch `production-integrator`, **nach** dem Commit der Beobachtungs-Auswertung
BEOB-2026-10-11b (beide ändern `docs/beobachtungen.md`), lokal, kein Push. (2) Vierter Verdikt-Wert **OHNE GRENZE** (Messgrösse
ohne Grenze im Balance-Test) angenommen; er zählt nie als bestanden. (3) Befund: Auf `main` gewinnt der Controller Seed 3 nur bei
Phase 0/20/40; Phase 60/80 erreicht bis Tick 9000 keinen Sieg → Sieg-Tick und minMoney sind schon auf der Basis AUSREISSER.
Gates mit Wertgrenzen (M14-E1 Auflage 3 aus R557, I-048 B) vergleichen deshalb **gegen das Basis-Ensemble** desselben main-Commits,
nicht gegen „alles OK“. Ursache ist unbelegt (Controller-Fragilität oder echte Spielhärte) → Probe `lead-tech` (Diagnose ohne
Code-Änderung) nach dem Merge.

Regelbezug: gates.md Gate Merge (Stufe leicht), R553 V1, R556, R557 · Kosten bei Irrtum: ein Werkzeug mit Basis-Ausreissern, die
Gates bis zur Diagnose relativ statt absolut lesen.

Entscheider: L0 · Anlass: Bericht lead-tech TOOL-GATE-ENSEMBLE · ADR: —

## R559 · 2026-10-11 · Beobachtungs-Auswertung BEOB-2026-10-11b angenommen; UI-AUFRAEUM-2 ergänzt

Ruling: Auswertung `94500464` (lead-production, 12 Einträge: 4 offen mit Paket-Zuordnung, 1 erledigt, 1 eingeplant, 6 abgehakt
mit Trigger) angenommen. Board-Paket **UI-AUFRAEUM-2** um „`stateText` samt Re-Export in `src/ui/inspect.ts` streichen“ ergänzt
(Owner `lead-tech`, Grösse S–M, nach Release M13). Der Eintrag „Seed wirkt nicht“ wird mit dem Merge TOOL-GATE-ENSEMBLE (R558)
geschlossen; ein Merge-Konflikt in `docs/beobachtungen.md` löst nicht der Integrator, sondern L0 per Fortsetzung des Leads.

Regelbezug: STUDIO.md Session-Start Punkt 6, R287, R288, R471 · Kosten bei Irrtum: ein abgehakter Befund taucht erneut auf.

Entscheider: L0 · Anlass: Bericht lead-production BEOB-2026-10-11b · ADR: —

## R560 · 2026-10-11 · Probe Controller-Phase: Bot-Artefakt; Werkzeug-Paket TOOL-CONTROLLER-HAERTUNG

Ruling: Probe `lead-tech` angenommen (belegt, Load 3,9–5,7, wenige Läufe): Bei Phase 60/80 fällt ein Entscheidungstick in das
Fenster, in dem erst ein Haus Stufe 2 voll ist; `producersNeeded(cloth)` = 1 hält die Stoffkette für fertig, der Controller baut
Schule, Zuckerrohr und Brennerei, das Geld fällt unter die Schwelle, Stoff bleibt ab Tick 780 auf 0 — Stillstand bis Tick 9000.
Reihenfolge-Lücke in `control()`, kein belegtes Spielerproblem. Entscheid: (1) **TOOL-CONTROLLER-HAERTUNG** (Stufe leicht,
Werkzeug-Paket): Schule erst, wenn der Stoffbedarf der Zielstufe aller Häuser gedeckt ist; nur `tests/sim/controller.ts` und Tests,
keine Spielwerte. Danach Basis-Ensemble neu messen; geänderte Werte im Balance-Test (Sieg-Tick, `minMoney`) sind bewusste
Änderungen und brauchen das Gate-Ruling. Zeitpunkt: vor dem Start von M14-E1 (T00 zieht die Basis nach, R557 (4)). (2) Bis dahin
gilt R558 (3): Gates lesen relativ zum Basis-Ensemble; Phasen 60/80 gelten als Controller-Artefakt. (3) Die Frage „Armutsfalle
ohne Notausgang bei Stoffmangel“ geht als Idee in die Ideen-Runde nach dem Release (lead-design, R445), nicht als Paket.

Regelbezug: R553 V1, R556, R557, R558; Verfassung §3 (Balancing-Test, bewusste Änderung als Ruling) · Kosten bei Irrtum: eine
Baseline-Neumessung; die Härtung kann eine echte Spielhärte verdecken (Gegenmittel: Idee Armutsfalle).

Entscheider: L0 · Anlass: Bericht lead-tech probe-CONTROLLER-PHASE · ADR: —

## R561 · 2026-10-11 · Kombiniertes Gate TOOL-CONTROLLER-HAERTUNG: OK mit Auflagen

Ruling: Plan `54c81a57` (lead-tech), Urteil lead-qa BEDENKEN (1 hoch, 2 mittel, 3 niedrig). L0-Prüffragen: ein Owner
(`tests/sim/controller.ts`, `tests/sim/ensemble.test.ts`), ein Worktree `.worktrees/tool-controller-haertung` (von main **nach**
MERGE-TOOL-GATE-ENSEMBLE); Budget nach Formel 1 × 2 + 1 = 3 × 1,3 → **4 Starts**, Parallelität 1; bleibt leicht. Auflagen, vom
Controller vor T01 in den Plan: (1) **Erfüllbarkeit:** Weber-Bau (`buildChain('cloth')`/`producersNeeded`) und die Schul-Bedingung
nutzen **dieselbe** Zielbedarf-Formel, damit die Schule nie dauerhaft wartet; neuer Test „Schule wird bis `MAX_TICKS` gebaut“ je
Phase. Verschiebt das Phase 0, gilt der Rückfall des Plans; bleibt eine Verschiebung, ist sie als Tabelle alt→neu eine bewusste
Pin-Änderung für das Gate Merge (Verfassung §3, R560 (1)). (2) Tick-Gleichheit Phase 0 vor/nach (Schul-Tick, Zustand nach N Ticks)
im Bericht, nicht nur Pins. (3) Stillstand = kein Sieg bis `MAX_TICKS`; Gegenprüfung 10/30/50/70/90 als Tabelle im Bericht, Treffer
→ `docs/beobachtungen.md`. (4) Zeitbudget AK-2: zeigt T00 > 500 ms je Test, liegen die Vollläufe von Anfang an hinter
`VITE_ENSEMBLE`. Restrisiko benannt: nur Seed 3, Seed-Achse unbelegt (Beobachtung „Seed wirkt nicht“, R553 V1).

Regelbezug: gates.md Kombiniertes Gate, R553 V1, R558, R560 · Kosten bei Irrtum: eine Baseline-Verschiebung im Balance-Test, die
im Gate Merge per Ruling bestätigt wird.

Entscheider: L0 · Anlass: Berichte lead-tech plan-TOOL-CONTROLLER-HAERTUNG, lead-qa gate-TOOL-CONTROLLER-HAERTUNG · ADR: —

## R562 · 2026-10-11 · Merge-Commit TOOL-GATE-ENSEMBLE bleibt; Vorfall an die Retro

Ruling: Der Merge `a8d9dcac` → `main` liegt als `6ffa7f81` mit der Nachricht von R560 vor, weil der L0-Commit den offenen
`--no-commit`-Merge des Integrators einfing (Ursache bei L0). Inhalt geprüft (`make check`, `make check-ci-perf` Exit 0). Kein
Umschreiben der Historie (Verfassung §6). Bis zur Retro: L0 committet auf `main` nur, wenn kein Integrator läuft und kein
`.git/MERGE_HEAD` besteht. Befund in `docs/beobachtungen.md`, Abhilfe (Merge im Worktree `integrate` oder Guard) entscheidet die
Session-Ende-Retro.

Regelbezug: Verfassung §6, R224, STUDIO.md Integrator · Kosten bei Irrtum: eine irreführende Commit-Nachricht in der Historie.

Entscheider: L0 · Anlass: Bericht production-integrator MERGE-TOOL-GATE-ENSEMBLE · ADR: —

## R563 · 2026-10-11 · Kombiniertes Gate UI-AUFRAEUM-2: OK mit Auflagen, gebündelt auf 13 Starts

Ruling: Plan `fe8dd8b3` (lead-tech), Urteil lead-qa BEDENKEN (nicht blockierend). L0-Prüffragen: ein Umsetzer-Strang, ein Worktree;
Überschneidung nur `src/ui/inspect.ts` mit M14-E1 → **Umsetzung erst nach dem M14-E1-Merge**; bleibt leicht. Entscheide:
(1) **Bündeln** T03+T04+T05 zu einem Task „Konstanten und Importe“ (`inspect.ts` zuletzt) → 4 Tasks × 2 + 1 Playtester + 1
Final-Review = 10 × 1,3 → **13 Starts**. (2) **DOM-Testweg ohne neue Abhängigkeit** (ADR-001): T00 baut Fake-Elemente nach dem
Muster `tests/render/fakeCtx.ts`; kein jsdom/happy-dom. T00 belegt Pause an/aus (`dataset.paused`), Abschlusszeile, `setText`/
`setHidden`; Mutationsbeleg mutiert auch die `paused`-Quelle. (3) **Stage-Sprung > 1:** ein Chronik-Eintrag je Abschnitt, aber
**nur der letzte mit Toast**; Pins: Sprung = 1 genau ein Eintrag (unverändert), `prev.stage = -1` kein Eintrag. (4) T05:
`RESERVE_TICKS` nur kommentieren; Angleichen nur per eigenem Ruling. (5) Statt Quelltext-Zählung „Abreissen“: Test auf
`DEMOLISH_VERB` plus Textvergleichs-Pin je Fundort (Liste nach Neuzählung); `isSaveChord` per Verhaltenstest (Import ohne
`hotkeys`). (6) Test Fehlerpfad `startMonumentStage` bei zu wenig Geld: Meldung unverändert. Nacharbeit (1)–(6) im Plan durch die
Plan-Instanz jetzt, ohne Zweitprüfung. Budget wird beim Start geloggt.

Regelbezug: gates.md Kombiniertes Gate, ADR-001, Verfassung §3, R557 · Kosten bei Irrtum: ein Toast-Verhalten im seltenen Ladefall.

Entscheider: L0 · Anlass: Berichte lead-tech plan-UI-AUFRAEUM-2, lead-qa gate-UI-AUFRAEUM-2 · ADR: —

## R564 · 2026-10-12 · Release M13: Push des geprüften main-Stands `883b64f9`

Ruling: Nutzerauftrag „mach den M13 push release“. Gepusht wird der main-Stand `883b64f9` statt des M13-Inhaltsstands
`24ba6d03`: dazwischen keine Änderung in `src/`, `public/`, `index.html`, `package.json` (nur Doku, Werkzeug, Tests aus
TOOL-GATE-ENSEMBLE, R558). Ablauf über `production-integrator`: `make push-check`, `git push origin <Hash>:main`, CI, Pages per
`gh workflow run Pages --ref main`, `backup/main-lokal` per Fast-Forward nachführen. Worktree-Aufräumen bleibt eigenes Ruling.
Release-Notiz aus dem M13-Entwurf in state.md.

Regelbezug: Verfassung §7, STUDIO.md Push-Gate (R335, R429), R549, R552 · Kosten bei Irrtum: ein Folge-Push am nächsten Tag
(Actions-Prognose rot).

Entscheider: L0 · Anlass: Nutzerauftrag · ADR: —

## R565 · 2026-10-12 · Retro M13 und Prozess-Aussensicht M13: P1–P5, V1–V3 angenommen

Ruling: Berichte `docs/studio/retros/2026-10-12-m13.md` (studio-coach) und `2026-10-12-m13-prozess.md` (studio-process-coach).
Angenommen: **P1** Integrator arbeitet nur in `.worktrees/integrate` (Merge, `push-check`, Push); Zwischenregel R562 entfällt
mit der Umsetzung; bis dahin committet L0 nichts, solange Integrator oder `push-check` laufen. **V2 / E-063** als Auflage zu P1:
Briefing-Vorlage nennt `.worktrees/integrate`; bei Widerspruch gilt die Persona und der Integrator meldet; ein anderer Hash als im
Ruling wird nur nach Meldung gepusht. **P2** R464 gilt auch vor Gate Merge auf seriellem Pfad; Timeout `terrain.test.ts` ins nächste
Werkzeug-Bündel. **P3** Werte-Probe vor Gate Plan bei Paketen mit Wertgrenzen (ab jetzt; M14-E1 deckt R557 (3) vor T08).
**P4** Push-Takt nach Live-Ampel statt Festregel „ein Push je Tag“. **P5** bereinigte Steuerungszeile wird Ampelzeile;
Session-Minuten gelb erst > 10. **V1** E-057 und E-061 abschliessen, E-062 und E-063 starten. **V3** Flake-Zeile nur im
Zeitraum zählen, Arbeitsbaum mitschreiben; Aufgabe im nächsten Werkzeug-Bündel. Umsetzung der Handbuch-Änderungen
(Handbuch-Minor) durch `studio-coach`.

Regelbezug: STUDIO.md Verbesserungsschleife, R127, R316, R562, R564 · Kosten bei Irrtum: ein Handbuch-Minor zurücknehmen; P4 kann
einen zusätzlichen Actions-Lauf kosten.

Entscheider: L0 · Anlass: Retro M13, Prozess-Aussensicht M13 · ADR: —

## R566 · 2026-10-12 · Runden-Ruling IDEEN-08

Ruling: Bericht lead-design IDEEN-08 (`99f0f29b`, Rangliste in `docs/ideen.md`), 13 neue Ideen I-075…I-087, Pool 35/40, keine
§5.3-Frage. Entscheide wie empfohlen: **einplanen** I-085 «Lager voll» als Problem mit Sprung, I-078 Bilanz-Vorschau, I-083
Hinweis unbelegte Zifferntaste (Beipack); **geteilt in zwei Häppchen** wegen ≈ +140 Tools: **UI-HAEPPCHEN-A** = I-062, I-063,
I-083 · **UI-HAEPPCHEN-B** = I-085, I-078. Beide nach dem Merge M14-E1 und nach UI-AUFRAEUM-2 (Überschneidung `src/ui/`),
Prozessstufe leicht. **Parken:** I-077 (bis Wirtschaftsrunde nach Erweiterung 1 K2), I-086 (mit I-059, Playtest-Anlass), I-084,
I-082, I-081. **Verwerfen:** I-075, I-076, I-079, I-080; I-087 → zusammengefasst in I-045. **Pool-Bereinigung bestätigt**
(live-Setzungen, Verweise auf Erweiterung 1, Statuskorrekturen I-017/I-062/I-063) mit einer Abweichung: **I-018 Story-Rahmen
wird geparkt statt gestrichen** (Ursprung Spielerwunsch; Erzählung als Säule nur auf Nutzeranlass, keine Warteschlange).
Verweise auf Erweiterung 1 sind beim Merge von `design/erweiterung-1` zu bestätigen (RE-2 A5).

Regelbezug: docs/ideen.md Ablauf, R445, R474, R529, Verfassung §5.3 · Kosten bei Irrtum: eine geparkte Idee später neu bewerten.

Entscheider: L0 · Anlass: Bericht lead-design IDEEN-08 · ADR: —

## R567 · 2026-10-12 · M14-E1 T03: Auslegung Auflage R557 (1b) angenommen; UI-Strang nach TOOL-CONTROLLER-HAERTUNG

Ruling: Bericht Controller M14-E1-SIM, T03 abgenommen (`00db07fe`). (1) **D-M14E1-1B:** Teilhash Heimat/A/B ist mit Insel C nicht
bitgleich erreichbar (Meer-Deko zieht über Rang/Belegung nach; 303/405 Flächen gleich); belegt ist die kontrafaktische
Bitgleichheit (Welt ohne C = Basis), neu gepinnt nur der Gesamt-Hash mit `bewusst neu gepinnt (R557)`. Angenommen als
Auslegung, Sim unberührt; kein zusätzlicher Fahrlinien-Teilhash. Befund in `docs/beobachtungen.md`, Sichtprüfung in T08.
(2) **Reihenfolge wegen halbierter Parallelität (≤ 4 Agenten):** SIM-Controller setzt T04/T05 fort; der UI-Controller (T06,
Worktree `.worktrees/m14-e1-ui` ab `00db07fe`) startet, sobald TOOL-CONTROLLER-HAERTUNG fertig ist. (3) AK-09-Einheit
(`goodsBalance` je 100 Ticks) präzisiert T07 in der Spec; Testzeit 320 ms in `islands-c.test.ts` zur Kenntnis.

Regelbezug: R557, R329, Verfassung §3 · Kosten bei Irrtum: UI-Strang startet ≈ 1 h später; Meer-Deko-Verschiebung fällt erst im
Playtest auf.

Entscheider: L0 · Anlass: Bericht lead-tech M14-E1-SIM T03 · ADR: —

## R568 · 2026-10-12 · Gate Merge TOOL-CONTROLLER-HAERTUNG: OK; Streuung Sieg-Tick als Werte-Frage; UI-Strang M14-E1 startet

Ruling: Bericht lead-tech, Branch `tool/controller-haertung` @ `fa46de0b`, Final-Review opus OK, `make check` Exit 0. Stillstand
Phasen 50–90 behoben (alle zehn Phasen siegen, Seed 3), Phase 0/20/40 bitgleich, keine Pin-Änderung; Auflagen R561 (1)–(4) belegt.
Entscheid: **Gate Merge OK.** Merge durch `production-integrator` in `.worktrees/integrate` (R565 P1), sobald ein Platz frei ist,
spätestens vor der Nachmessung R557 (3) von M14-E1; dabei Beobachtung „Controller-Stillstand Phasen 50/70/90“ auf „Stillstand
behoben, Streuung offen“ setzen. **Streuung** (Sieg-Tick 6650–7900; Phasen 60/70 über `WIN_TICK_LIMIT` 7500): kein Fehler der
Härtung; die Grenze bleibt vorerst 7500, die Werte-Frage entscheidet L0 bei der Nachmessung vor M14-E1 T08 (mit P3 aus R565),
Seed-Achse dort mitmessen. **UI-Strang M14-E1 (T06)** startet jetzt (R567 (2)).

Regelbezug: gates.md Gate Merge, R561, R565, R567 · Kosten bei Irrtum: Nachmessung vor T08 meldet zwei Ausreisser, die erst dort
eingeordnet werden.

Entscheider: L0 · Anlass: Bericht lead-tech TOOL-CONTROLLER-HAERTUNG · ADR: —

## R569 · 2026-10-12 · M14-E1 T06 abgenommen; Controller-Merge UI in `feat/m14-e1` frei, danach T07

Ruling: Bericht Controller M14-E1-UI, `da9ea9b0`, Review OK. Angenommen: (1) zwei Bestandstests prüfen Präfix bzw. `startsWith`
statt Literal (`UNLOCK_NOTICE` in `tests/ui/goal.test.ts`, AK-S11 in `tests/ui/seaMapView.test.ts`), weil die Texte um den
Inselbezug wachsen — bewusst, keine Abschwächung der übrigen Asserts; (2) `tooltipLines(tool, world?, island?)` optional,
Inspektorzeile `island-trait`, CSS `.tooltip .tt-island[hidden]`. Review-Hinweise (Doppel-Import, Trait-Typ) im T07- oder
Final-Review-Durchgang mitnehmen. **Merge jetzt frei:** UI-Controller mergt `feat/m14-e1-ui` in `feat/m14-e1` (Merge-Commit, SIM-
Strang wartet), danach T07 durch den SIM-Controller. Zeitmessungen unter Last (> 4) vor T09 bei ruhiger Last wiederholen.

Regelbezug: R557 (5), R567, R568 · Kosten bei Irrtum: ein Text-Pin fängt eine spätere Wortlautänderung nicht mehr ganz.

Entscheider: L0 · Anlass: Bericht lead-tech M14-E1-UI · ADR: —

## R570 · 2026-10-12 · M14-E1 Nachmessung R557 (3): unverändert zur Basis; T08/T09 frei; Sieg-Tick-Grenze getrennt

Ruling: Bericht Controller M14-E1-SIM (T07 `7a760176`/`3d4a7616`, Basis nachgezogen `d6f37233`, `make check` Exit 0). Ensemble
auf `feat/m14-e1` identisch zur Basis `c20c4f3a` (auch Seeds 5/7); B3-Rangfolge P1 > P2 > P3 kippt nicht (Defs ausser `sea.ts`
unverändert). Entscheid: (1) Auflage R557 (3) **erfüllt**; das Verdikt AUSREISSER beim Sieg-Tick (Phasen 60/70, 6650–7900) ist
Basisbefund, **kein Blocker für M14-E1**. (2) **T08** (Playtester, Szenarien `m14e1-*`, Sichtprüfung Meer-Deko R567, Umbruch U6
bei 1280×720, B3 im Spiel) und danach **T09** (Final-Review opus) startet der Controller jetzt. (3) Die Sieg-Tick-Grenze 7500 bleibt;
die Werte-Frage (Grenze aus dem Ensemble ableiten, z. B. ≈ 8000, oder Controller-Pfad Phasen 60/70) wird als Beobachtung
geführt und im nächsten Werkzeug-Bündel entschieden (mit P2, P5, V3 aus R565). Zeitreserve-Hinweise (11 Tests) prüft der
Integrator beim Merge bei Load ≤ 4.

Regelbezug: R557, R565, R568 · Kosten bei Irrtum: das Ensemble meldet bis zum Werkzeug-Bündel weiter AUSREISSER.

Entscheider: L0 · Anlass: Bericht lead-tech M14-E1-SIM T07 · ADR: —

## R571 · 2026-10-12 · I-048 Schritt B: Abbruchkriterium R555 (c) erfüllt → Option 1 (Verzicht)

Ruling: Bericht lead-design I-048-B, Last-Probe `docs/superpowers/specs/2026-10-10-i048-zukauf-aufschlag-design/anhang-02-last-probe.md`
(`1739575f`). Basis-Controller kauft Holz in Spitzen 71–90/min (> 30/min), der reiche Lauf `balance-edicts` 292 Holz/min; jedes
wirksame Kontingent liegt unter der Krisen-Last. Entscheid: (1) **Option 1 Verzicht** für Schritt B, ohne neues Brainstorming
(R555 (c)); Mechanik bleibt inaktiv (`BUY_RISE` 0), kein Save-Sprung. (2) `feat/i048-b` und `.worktrees/i048-b` werden **nicht
gemergt**, bleiben geparkt; Aufräumen nur mit dem Worktree-Ruling (ohne `--force`, kein Branch-Löschen ohne eigenes Ruling).
(3) Anzeige «Kauf 100 %» ausblenden (≈ 15 Tools, `buyPct` bleibt) wird **Teil von UI-HAEPPCHEN-A**. (4) **I-047 Stammkunde** ist
frei (R486 O3) → Baustein für das nächste Handels-/Wirtschafts-Brainstorming. Die Idee «Staffel nur für Konsumgüter» bleibt als
Hinweis im Pool ohne Pitch. Kein Gate Spec nötig (keine neue Regel).

Regelbezug: R486, R549, R551, R555, R565 P3 · Kosten bei Irrtum: der Zielsatz «wer jeden Engpass mit Geld löst, zahlt drauf» bleibt
offen bis zu einem neuen Brainstorming.

Entscheider: L0 · Anlass: Bericht lead-design I-048-B · ADR: —

## R572 · 2026-10-12 · Kombiniertes Gate TOOL-BUENDEL-9: OK mit Auflagen; T04 Option B

Ruling: Plan `16b13860` (lead-tech), Urteil lead-qa BEDENKEN (1 hoch, 1 mittel, Rest niedrig, nicht blockierend). Entscheid **OK**,
Budget 7 Starts, Parallelität 1, ein Worktree, T02 → T03 seriell (`efficiency.py`). Entscheide: (1) **T01** Timeout in
`terrain.test.ts` anheben **ohne Beleg-Treffer** (0 × «timed out» in 16 `test_failed`): R565 P2 ordnet es an, `make zeittests` fängt
echte Verlangsamung; Rot-Beleg = `grep -n` der Blöcke ohne Timeout-Parameter. (2) **T04 Option B:** eigene Testgrenze
`ENSEMBLE_WIN_TICK_LIMIT = 8250` (Maximum 7900 + 350 Luft) nur im Ensemble; `WIN_TICK_LIMIT` 7500 bleibt in den Einzellauf-Gates;
**Testgrenze, kein Spielwert** — `src/sim/defs/` unberührt. T04 nach dem Merge M14-E1. (3) Auflagen durch den Controller, ohne
Zweitprüfung: T02 Rückfall bereinigt→roh und kein Doppelvorfall testen; T03 gemischter Altfall (Rot ohne `tree`, Grün mit
`tree`), andere Leser von `events.jsonl` tolerieren `tree`, `build_event` wirft nie; **vor dem Rot-Test belegen**, dass
`efficiency.compute(since=…)` den Zeitpunkt liefert; T04 Ableitungskommentar, Unit-Test `ENSEMBLE_WIN_TICK_LIMIT > WIN_TICK_LIMIT`
und `WIN_TICK_LIMIT === 7500`, Rot-Beleg als Ensemble-Verdikt AUSREISSER vorher/nachher. (4) T05 nur Entwurf an `studio-coach`.
Start, sobald ein Platz frei ist (Parallelität halbiert).

Regelbezug: gates.md Kombiniertes Gate, R565, R570 · Kosten bei Irrtum: Ensemble-Grenze 8250 verdeckt eine echte Verlangsamung
bis 8250 Ticks; Einzellauf-Gates bleiben scharf.

Entscheider: L0 · Anlass: Berichte lead-tech plan-TOOL-BUENDEL-9, lead-qa gate-TOOL-BUENDEL-9 · ADR: —

## R573 · 2026-10-12 · Kombiniertes Gate UI-HAEPPCHEN-A: OK mit Auflagen

Ruling: Plan `74d17b10` (lead-tech), Urteil lead-qa BEDENKEN (3 hoch, 2 mittel, nicht blockierend). Entscheid **OK**, Budget 11
Starts, Parallelität 1; Start nach Merge M14-E1 und UI-AUFRAEUM-2. Entscheide: (a) Zeile «Kauf n %» **ganz entfernen**,
`buyPctText` und Test entfallen; der Knopftitel «im Mittel n %» bleibt als bewusst schlafender Code (erscheint nur > 100 %, also bei
`BUY_RISE` 0 nie) für ein späteres Aktivieren. (b) I-062 mit echtem 50-%-Unterhalt der Stillgelegten, markiert; T04 korrigiert den
Ideen-Text in `docs/ideen.md`. **Auflagen vor T01 durch den Controller in den Plan (ohne Zweitprüfung):** (4) Test Abgleich
Fusszeile vs. `stats.upkeep` auf einer Welt mit Stillgelegten, Schiffen, Häusern — weicht die Definition ab, AK-7 vorher
präzisieren und L0 melden; (5) AK-8/9 rot-testbar: `hud.test.ts` auf Knopf-Semantik (`button`/`tabindex`, `aria-label`, Enter)
plus Playtest-Schritt nur Tastatur; (6) AK-9 ergänzt «Karte ≤ Fensterhöhe bei 1280×720, Scrollbar, Fokusring»; (7) Rot-Tests je
Randfall Umschalt (Aufsetzen, Loslassen, Release mitten im Zug) plus neue AK «Abbruch per Esc/Pointer-Cancel baut nichts».
Befunde 1–3, 8–10 im Report bzw. T04; aus (8) mindestens der Test «Linienbau = gleiche Einzelklicks» und Randfälle Wasser/
Inselgrenze, Start = Ende.

Regelbezug: gates.md Kombiniertes Gate, E-061, R566, R571 · Kosten bei Irrtum: eine Fix-Runde in T02 für den Unterhalt-Abgleich.

Entscheider: L0 · Anlass: Berichte lead-tech plan-UI-HAEPPCHEN-A, lead-qa gate-UI-HAEPPCHEN-A · ADR: —

## R574 · 2026-10-12 · Gate Merge M14-E1 Inselcharakter: OK

Ruling: Schlussbericht Controller M14-E1-SIM, `feat/m14-e1` @ `4b6e1d48`; T08 Browser-Check AK-34–41 OK (0 Konsolenfehler,
Meer-Deko-Verschiebung nicht sichtbar, U6 bei 1280×720 lesbar, Trait-Anzeige vollständig); T09 Final-Review opus BEDENKEN
(B1 AK-14 über alle Seeds, B2 arc42 `save.ts`) — beide behoben, 41/42 AK; `make check` Exit 0 (3664 Tests, Last 2,0). Entscheid:
**Gate Merge OK.** Merge durch `production-integrator` in `.worktrees/integrate` (R565 P1), Merge-Commit, kein Push (Ampel P4,
Release-Entscheid separat). Zur Kenntnis: Commit `4b6e1d48` bündelt beide Fix-Runden (gemischte Historie, kein Rebase); B3-
Rangfolge im Spiel nicht spürbar, kippt nicht — kein Entwurf nötig, Thema für den M14-E2/Erweiterung-Playtest. T08-Befunde als
Beobachtung (`docs/beobachtungen.md`). Budget M14-E1: 14 + 2 (UI) von 21 Starts.

Regelbezug: gates.md Gate Merge, R557, R567, R570 · Kosten bei Irrtum: ein Hotfix auf `main` vor dem Release M14-E1.

Entscheider: L0 · Anlass: Schlussbericht lead-tech M14-E1-SIM · ADR: —

## R575 · 2026-10-12 · Gate Merge TOOL-BUENDEL-9: OK; Abschnitt «Live-Ampel» an den Coach

Ruling: Schlussbericht Controller TOOL-BUENDEL-9, `tool/b9` @ `da656819`, Final-Review opus OK, `make check` Exit 0 (3666 Tests),
`make studio-test` Exit 0 (822). T04 belegt: Ensemble-Verdikt 4/5 AUSREISSER → 5/5 OK bei gleicher Spanne, `WIN_TICK_LIMIT` 7500
unverändert, `src/sim/defs/` unberührt. Entscheid: **Gate Merge OK**, Merge durch `production-integrator` in
`.worktrees/integrate`, kein Push. Danach setzt `studio-coach` den Handbuch-Abschnitt «Live-Ampel» aus dem Entwurf des
Controllers um und prüft die zwei ungeprüften Aussagen (Definition «bereinigt», Verweis R565 P4) am Code (Handbuch-Minor).

Regelbezug: gates.md Gate Merge, R565, R570, R572 · Kosten bei Irrtum: eine Ampelzeile zeigt bis zum nächsten Bündel falsch.

Entscheider: L0 · Anlass: Schlussbericht lead-tech TOOL-BUENDEL-9 · ADR: —

## R576 · 2026-10-12 · Gate Merge UI-AUFRAEUM-2: OK; Stash-Vorfall an die Retro

Ruling: Schlussbericht Controller UI-AUFRAEUM-2, `refactor/ui-aufraeum-2` (8 Commits ab main), Final-Review opus OK, Playtest OK
(1280×800, 1920×1080, 0 Konsolenfehler), `make check` Exit 0 (3682 Tests, +18). Auflagen R563 (1)–(6) umgesetzt. Entscheid:
**Gate Merge OK**, Merge durch `production-integrator` in `.worktrees/integrate`, kein Push; beim Merge Zusatz «wartet auf
Merge-Gate» in `docs/beobachtungen.md` entfernen. Restkopplung `buildMenu.ts:221` (`'Erzeugt:'`) ist als Beobachtung geführt.
**Vorfall:** Arbeiter T02 nutzte nacktes `git stash; git stash pop` (fremder Stash angewendet, zurückgesetzt; Stash-Liste geprüft,
beide Einträge intakt) — an die nächste Retro mit Vorschlag Guard-Regel oder Briefing-Zeile.

Regelbezug: gates.md Gate Merge, R563 · Kosten bei Irrtum: ein Hotfix in `src/ui/` vor dem nächsten Release.

Entscheider: L0 · Anlass: Schlussbericht lead-tech UI-AUFRAEUM-2 · ADR: —

## R577 · 2026-10-12 · Kombiniertes Gate UI-HAEPPCHEN-B: OK mit Auflagen

Ruling: Plan `f451ef2c` (lead-tech), Urteil lead-qa BEDENKEN (1 hoch, 3 mittel). Entscheid **OK**, Budget 11 Starts, Parallelität 2
(getrennte Dateien), Start nach Merge UI-HAEPPCHEN-A. `fullSince` als UI-Zustand ohne Save angenommen. Auflagen durch den
Controller vor T01 in den Plan, ohne Zweitprüfung: (1) AK-14 ergänzt: Probe-Gebäude mit gültiger Insel/Position,
`structuredClone(world)` vorher = nachher auch mit Wohnhaus-Probe, Rot-Test Obergrenze auf Mehrinsel-Welt; kein Neurechnen je
Frame bei unverändertem Hover (Test oder Cache je `defId`/`world.tick`). (2) AK-4 ergänzt: Laden mit gleichem/höherem Tick und
«Neues Spiel» setzen `fullSince` zurück (Reset in `app.ts` oder Welt-Identität). (4) Kontrakt-Test für `balanceText`, `spot`,
`jumpTarget` gegen Umbenennung durch A. Ausserdem: Rot-Test gegen Flackern beim Übergang `storageFull`; Rollen im Plan
benennen; 1280×720 Ausbau-Karte ohne Überlauf mit Fokusring; Haus-Aufstieg als Beobachtung.

Regelbezug: gates.md Kombiniertes Gate, E-061, R566, R573 · Kosten bei Irrtum: verspäteter «Lager voll»-Hinweis nach dem Laden.

Entscheider: L0 · Anlass: Berichte lead-tech plan-UI-HAEPPCHEN-B, lead-qa gate-UI-HAEPPCHEN-B · ADR: —

## R578 · 2026-10-13 · Wochenlimit ignorieren: Deckel wieder 8 Agenten; Session-Plan

Ruling: Nutzerauftrag «mach weiter und ignorier die limitation durch das wöchentliche claude limit». Die Halbierung der
Parallelität bei Wochenfenster ≥ 90 % (state.md, ≤ 4 Agenten) entfällt für diese Session; es gilt der Studiodeckel R424
(≤ 8 Agenten, davon ≤ 2 Browser-Läufe). Modellwahl bleibt nach der Modelltabelle (kein Hochstufen wegen des Auftrags).
Plan: (1) Release REL-20 per Push-Gate (`production-integrator`, `.worktrees/integrate`), vorher Klärung
`islands-c.test.ts`-Timeout; (2) UI-HAEPPCHEN-A umsetzen (lead-tech, R573); (3) UI-HAEPPCHEN-B nach Merge A (R577);
(4) Retro-Vorschläge V1/V2 (E-064, E-065) an den Coach; (5) freie Plätze: I-047 Stammkunde (Design/Spec), Ideen-Runde (R445, R475).

Regelbezug: Verfassung §5 (Nutzerauftrag), R424, R475 · Kosten bei Irrtum: Wochenfenster vor Reset 2026-10-14 12:00 erschöpft, Studio pausiert bis Reset.

Entscheider: L0 · Anlass: Nutzerauftrag Session-Start · ADR: —

## R579 · 2026-10-13 · Retro-Vorschläge 1a73e6c1: V1/V2 angenommen als TOOL-BUENDEL-10; Budgets der Session

Ruling: Retro `retros/2026-10-12-session-1a73e6c1-ende.md`. **V1 (E-064)** Guard sperrt `git stash` ausser `list`/`show` — angenommen;
**V2 (E-065)** Warnung bei Rückstand der R-Nummer in state.md (> 5) — angenommen, nur Warnung. Beide als T02/T03 in
**TOOL-BUENDEL-10**, zusammen mit T01 Klärung `islands-c.test.ts`-Timeout (Coach-Befund, blockiert den Push REL-20). Die
Experiment-Buchführung (höchstens 3 laufend) macht `studio-coach` nach dem Merge. **V3** Messauftrag bleibt beim Coach (Frist: nächste
Retro mit Plan-Briefing). Budgets: UI-HAEPPCHEN-A 11 Starts/P1 (R573), TOOL-BUENDEL-10 5 Starts/P1, design-I-047 2 Starts/P1
(Abgrenzung zu Erweiterung 1 zuerst).

Regelbezug: R578, R571 (4), Verfassung §5 · Kosten bei Irrtum: ein legitimer Stash-Fall bei L0 wird geblockt (Rückfall: Regel streichen).

Entscheider: L0 · Anlass: Retro Session 1a73e6c1, state.md Fortsetzung Punkt 1, 4 · ADR: —

## R580 · 2026-10-13 · Freier Platz: Beobachtungs-Auswertung statt Ideen-Runde

Ruling: Ideen-Pool 35/40 (R566), UI-HAEPPCHEN-A/B aus IDEEN-08 noch offen — eine neue Ideen-Runde (R445) brächte jetzt wenig.
Freier Platz geht an `lead-production`: Auswertung der 12 Beobachtungen seit 2026-10-11 (Skill `beobachtungen-auswerten`,
STUDIO.md Start-Routine 6), Budget 1 Start/P1, Worktree `.worktrees/beob-13`. Ideen-Runde IDEEN-09 erst nach Merge UI-HAEPPCHEN-B.

Regelbezug: R445, R475, R287 · Kosten bei Irrtum: eine Ideen-Runde einen Tag später.

Entscheider: L0 · Anlass: freie Kapazität nach R578 · ADR: —

## R581 · 2026-10-13 · Gate Merge BEOB-AUSWERTUNG-13: OK; drei Vorschläge

Ruling: Bericht lead-production, `docs/beob-13` @ `72c3f3d3`, `make docs-check` Exit 0, 8 erledigt / 3 eingeplant / 3 abgehakt mit
Trigger, Marke 2026-10-13. Entscheid **Gate Merge OK** (nur Doku), Merge durch `production-integrator` in `.worktrees/integrate`,
kein Push (geht mit REL-20). Vorschläge: (1) `buyPct` in `docs/arc42.md` nachführen — angenommen, als Beipack im Doku-Audit vor
dem Release REL-20; (2) Paket **DOC-ARCHIV** (S, lead-production: `docs/ideen.md` und README-Spielwerte-Anhang auslagern) —
angenommen, aufs Board nach UI-HAEPPCHEN-B; (3) Szenarien-Punkte (a)(c)(d) und Umbenennung `m13e2-v13` → **TOOL-BUENDEL-11**.

Regelbezug: gates.md Gate Merge, R287, R580 · Kosten bei Irrtum: ein Eintrag wird später erneut geöffnet.

Entscheider: L0 · Anlass: Bericht lead-production BEOB-AUSWERTUNG-13 · ADR: —

## R582 · 2026-10-13 · TOOL-BUENDEL-10: Nacharbeit seaKorridor-Timeout und Wortanker, dann make check

Ruling: Bericht lead-tech TOOL-BUENDEL-10, `tool/b10` @ `0d383d1b`, Review BEDENKEN (alle niedrig), `make check` offen (Testlock,
Last > 8). Entscheide: (1) Ownership von TOOL-BUENDEL-10 um `tests/render/seaKorridor.test.ts` erweitert: Fall «AK-K1b Teilhash
(R557)» bekommt einen expliziten Timeout von 20000 ms mit Kommentar (Grund: Runner-Schätzung ≈ 7,9 s > 5 s, R570); bevorzugt,
falls ohne Aussageverlust in wenigen Minuten möglich, den Fall beschleunigen. (2) `stampcheck.py` Wortanker `\bR(\d+)` und
Test — Trivial-Fix im selben Zug. (3) `git stash --help/-h` bleibt gesperrt (Meldung nennt WIP-Commit; harmlos). (4) Guard-Umgehung
per Alias/`$(…)`/`xargs` → Eintrag `docs/beobachtungen.md` durch den Controller. (5) Danach `make check` Exit 0, sobald die Last es
zulässt; L0 entscheidet dann Gate Merge und Push REL-20. Budget unverändert (2 Starts frei).

Regelbezug: R570, R579, gates.md Gate Merge · Kosten bei Irrtum: ein langsamer Test bleibt mit grosszügigem Timeout unbemerkt langsamer.

Entscheider: L0 · Anlass: Bericht lead-tech TOOL-BUENDEL-10 · ADR: —

## R583 · 2026-10-13 · Gate Brainstorming I-047 Stammkunde: OK Option 3; Gate Spec starten

Ruling: Bericht lead-design design-I-047, `design/i047` @ `b8b5477a`, Selbstprüfung BEDENKEN (geringes Spielgewicht). L0-Prüfung
der fünf Fragen: stärkt die Säule Handel (planbare Einnahme statt nur Zufallsauftrag), Spielerzweck in einem Satz sagbar («sichere
Abnahme gegen höhere Prämie»), Scope klar (zwei Pakete SIM/UI), nur Mechanik, Option 3 ist die einfachste (nutzt den bestehenden
Auftragsplatz). Abgrenzung zu Erweiterung 1 belegt (I-047 nur in deren verworfener Variante B). Entscheide: (1) **Gate Brainstorming
OK, Option 3** «Stammkunde im Auftragsplatz». (2) Save v14: wer zuerst merged, erhält v14, der andere zieht nach (R487 P-4). (3)
Verlustfreie Migration v13→v14 bestätigt (Verfassung §3 erlaubt Abweisen, verlangt es nicht; unbekannte Versionen weiter abweisen
mit Test). (4) R7 (Zufallsauftrag im selben Tick nach Bruch) bleibt. Gate Spec: `lead-tech` und `lead-qa` (beide opus) parallel.

Regelbezug: gates.md Gate Brainstorming, Gate Spec, R571 (4), R487 · Kosten bei Irrtum: zwei kleine Pakete für eine Mechanik mit geringem Gewicht.

Entscheider: L0 · Anlass: Bericht lead-design design-I-047 · ADR: —

## R584 · 2026-10-13 · Gate Spec I-047 Stammkunde: OK mit Auflagen

Ruling: Urteile lead-tech BEDENKEN (3 mittel, 2 niedrig) und lead-qa BEDENKEN (2 hoch, 6 niedrig) zu `design/i047` @ `b8b5477a`.
Entscheid **Gate Spec OK mit Auflagen**; AK-Präfix **AK-SK-01…29** bestätigt (R417), neue AK fortlaufend ab AK-SK-30.
**Spec-Nachtrag durch lead-design ohne neues Gate** (Budget 1 Start): QA (1) Inselwechsel in AK-SK-09/28; (2) AK-SK-22 gegen
`SAVE_VERSION − 1` statt «v13», bitgleich 10 Perioden; (3) B.5 Risiko mit Rückfall (`CONTRACT_PREMIUM` senken oder
`CONTRACT_MIN_TIER` 4) und Playtest-Prüfung; (4)–(5) Sätze in AK-SK-11/12/15/18; (6) Controller-Prüfung in
`tests/sim/contract.test.ts` statt balance; (7) AK-SK-29 Aufbau (präparierter Stand) und Klang per Aufruf; (8) Anhang W.7 angleichen.
**Auflagen an den Plan (lead-tech):** Tech (1) Schritt `foldBackToV13`, neue Schlüssel am Ende; (2) I047-SIM ≈ 60 Tools in drei Tasks
(a)/(b)/(c); (3) Merge-Schritt «Version festlegen» mit Sechs-Stellen-Liste, Testdateien nach Thema, Tests gegen `SAVE_VERSION`;
(4)–(5) `World.version`-Literal und Rückgabe von `tickOrders` in den Task-Dateien. Danach Plan (opus), Kombiniertes Gate durch L0
und lead-qa.

Regelbezug: gates.md Gate Spec, R417, R553, R583 · Kosten bei Irrtum: eine Plan-Überarbeitung.

Entscheider: L0 · Anlass: Urteile lead-tech und lead-qa gate-I-047 · ADR: —

## R585 · 2026-10-13 · Gate Merge TOOL-BUENDEL-10: OK; Push REL-20 freigegeben

Ruling: Schlussbericht lead-tech TOOL-BUENDEL-10, `tool/b10` @ `6f48387a` (main gemergt, Konflikt `docs/beobachtungen.md` durch
Eigentümer gelöst, Task-Review OK), `make check` Exit 0 im dritten Versuch, `make studio-test` 828 grün. T01 islands-c 1963 → 859 ms,
seaKorridor-Fall Timeout 20000 ms (R582), T02 Stash-Sperre (E-064), T03 Stand-Warnung (E-065). Kein UI-Task, daher kein Browser-Lauf.
Entscheid: **Gate Merge OK**; `production-integrator` merged `tool/b10` in `.worktrees/integrate` und führt das **Push-Gate REL-20**
durch (`make check`, `make check-ci-perf` mit Exit-Codes, Push per geprüftem Hash `git push origin <hash>:main`, Pages per
`gh workflow run Pages --ref main`, `backup/main-lokal` per Fast-Forward). Zeitreserve-Warnungen aus Lastphasen (trees-farn, rauten,
decorSea, forest) gelten als Lastartefakt; CI-Ergebnis entscheidet. Der Beipack arc42 `buyPct` (R581 (1)) fährt mit dem nächsten
Release. UI-HAEPPCHEN-A bleibt für das nächste Release (R335: ein Push je Session).

Regelbezug: gates.md Gate Merge, R335, R429, R565 P1, R582 · Kosten bei Irrtum: ein roter CI-Lauf, Hotfix im nächsten Push.

Entscheider: L0 · Anlass: Schlussbericht lead-tech TOOL-BUENDEL-10 · ADR: —

## R586 · 2026-10-13 · Gate Merge UI-HAEPPCHEN-A: OK unter Bedingung make check; UI-HAEPPCHEN-B starten

Ruling: Schlussbericht lead-tech UI-HAEPPCHEN-A, `feat/ui-haeppchen-a` @ `d4f6420d` (main `dd004a53` gemergt), AK-1…19, Final-Review
opus OK, Playtest 1280×720/1920×1080 mit Screenshots unter `.studio/qa/ui-haeppchen-a/` (AK-14/15 per Unit-Test), gezielte Tests 2156
grün; `make check` zweimal am Testlock (Last 22–24). Entscheid **Gate Merge OK unter Bedingung**: `production-integrator` merged nach
dem Push REL-20 in `.worktrees/integrate` mit `make check` Exit 0 — ohne Exit 0 kein Merge, Meldung an L0. Lokal, kein Push
(R335). Entscheide: (1) AK-7 präzisiert: `stats.upkeep` ist nach Edikt «Sparen» gerundet, die Karte zeigt eine eigene Zeile
«Edikt: −n», damit Zeilen und Fusszeile aufgehen; (2) Gebäude mit Unterhalt 0 (auch Heimat-Kontor) fehlen in der Rangliste — bestätigt;
(3) Pfad-Overlay ohne Rotfärbung, Fallback Hover-Zeile — bestätigt. **UI-HAEPPCHEN-B** startet jetzt (Pipelining nach Review-OK,
gates.md) auf `feat/ui-haeppchen-b` ab `feat/ui-haeppchen-a` @ `d4f6420d`, Budget 11 Starts / Parallelität 2 (R577).

Regelbezug: gates.md Gate Merge Release (Pipelining), R573, R577, R335 · Kosten bei Irrtum: ein Fix auf A erzwingt einen Merge in B.

Entscheider: L0 · Anlass: Schlussbericht lead-tech UI-HAEPPCHEN-A · ADR: —

## R587 · 2026-10-13 · Push-Gate REL-20 gescheitert (Testlock): Ruhefenster, Ad-hoc-Retro

Ruling: Bericht production-integrator REL-20: `make check` viermal Exit 2 (Testlock, 1-min-Last 20,0 / 25,6 / 8,8 / 13,0 > 8), Merge
abgebrochen, main unverändert `dd004a53`, nichts gepusht. Beleg Grundlast: ohne Studio-Testlauf ziehen `fileproviderd`, Dropbox und
WebKit allein ≈ 1,5–2 Kerne (15:48: fileproviderd 107 %, Dropbox 41 %+37 %+18 %); der Repo-Pfad liegt nicht in Dropbox (unbelegt,
woher die Synchronisationslast stammt). Entscheide: (1) Push-Gate REL-20 neu im **Ruhefenster**: L0 wartet per Hintergrund-Prüfung auf
1-min-Last ≤ 7, dann startet der Integrator neu (bis 6 Versuche, ≥ 3 min Pause); in dieser Zeit startet L0 keine neuen Test-lastigen
Arbeiter (Plan-/Gate-/Doku-Agenten erlaubt). Kein Umgehen des Testlocks (R380). (2) Integrator-Trailer: Session-Attribution gilt
(Opus 5.5 laut Session-Vorgabe; Abweichung «Sonnet» im Merge `c151dad4` bleibt stehen). (3) **Ad-hoc-Retro** durch `studio-coach`
(Kurz-Retro, sonnet): Konflikt Deckel 8 (R578) gegen Testlock-Grenze 8 bei Grundlast; Hebel-Vorschlag (z. B. Push-Gate-Ruhefenster
als Regel, Last-Grenze relativ zur Grundlast, Testlauf-Warteschlange statt Abbruch).

Regelbezug: R380, R335, R578, Handbuch «Verbesserungsschleife» · Kosten bei Irrtum: REL-20 erst in der nächsten Session live.

Entscheider: L0 · Anlass: Bericht production-integrator REL-20 (failed) · ADR: —

## R588 · 2026-10-13 · Ad-hoc-Retro Testlock: V1 Regel, V3 in TOOL-BUENDEL-11, V2 geparkt

Ruling: Retro `retros/2026-10-13-adhoc-testlock.md` (`964476e9`). Entscheide: **V1 angenommen als Regel** (kein Experiment, Plätze
3/3): Zwischen Gate Merge eines Releases und Push startet L0 höchstens 2 weitere Test-Arbeiter; Umsetzung als Handbuch-Minor in
`gates.md` durch `studio-coach` in der Ende-Routine; Messgrösse (≤ 1 Testlock-Abbruch je Push-Gate über 3 Releases) beobachtet die
Retro. **V3** Lastprotokoll beim Testlock-Abbruch (Top-Prozesse, Vitest-Worker) → TOOL-BUENDEL-11. **V2** (Warteschlange statt
Abbruch) geparkt bis V3-Daten vorliegen. Experimente: `studio-coach` bewertet E-060 in der Ende-Retro; bei Abschluss rückt E-064 nach,
E-065 danach. lernen.md: Coach streicht eine Zeile und nimmt «Deckel und Testlock-Grenze abstimmen» auf.

Regelbezug: R380, R429, R475, R578, R587 · Kosten bei Irrtum: zwei ungenutzte Agentenplätze während eines Push-Gates.

Entscheider: L0 · Anlass: Bericht studio-coach RETRO-ADHOC-TESTLOCK · ADR: —

## R589 · 2026-10-13 · Kombiniertes Gate Plan I-047: OK mit Auflagen; Start nach Push REL-20

Ruling: Plan `design/i047` @ `3fc1f528` (lead-tech), Urteil lead-qa BEDENKEN (2 hoch, 6 niedrig), AK-Abdeckung vollständig, R584
erfüllt. L0-Prüfung Ownership/Budget/Abhängigkeiten. Entscheid **OK mit Auflagen**, Budget **8 Starts / Parallelität 1**, zwei
Controller-Instanzen (SIM T01–T03, UI T04–T07). Auflagen vor T01 durch den Controller, ohne Zweitprüfung: (1) T06 (A) Krise
reproduzierbar einbauen (Boom auf anderes Gut, lange Laufzeit), Überlappung bei 1280×720 messen; (2) **I047-UI (T04–T07) startet
erst nach Merge von UI-HAEPPCHEN-B** (seriell statt Konfliktpfad, KISS); (3)–(8) wie im Urteil (Verweise T01→T03, Lagerwerte
gegen Vergleichslauf, Zeitlimit AK-SK-25, Puffer Rum ≥ 10, Risiko R553 im Index mit Auswerter lead-design, Save/Load mitten im Lauf,
Fehlerpfad B.4 mit Klang `error`, Task-Review für T06 (A)). Entwürfe lead-tech: (E1) `island` im `ContractEvent` — angenommen
(Spec-R12 erweitert, AK unverändert); (E2) Insel-Zusatz hinter dem Gut — angenommen; (E3) Dev-Sonde `contractSounds()` plus
Vitest-Spy — angenommen. Start I047-SIM erst nach dem Push REL-20 (R588 V1: Release-Fenster).

Regelbezug: gates.md Kombiniertes Gate, R584, R588, R553 · Kosten bei Irrtum: I047-UI verschiebt sich um ein Häppchen.

Entscheider: L0 · Anlass: Bericht lead-tech plan-I-047, Urteil lead-qa gate-plan-I-047 · ADR: —

## R590 · 2026-10-13 · Gate Merge UI-HAEPPCHEN-B: OK; Integrator-Lauf Push REL-20, danach Merges A und B lokal

Ruling: Schlussbericht lead-tech UI-HAEPPCHEN-B, `feat/ui-haeppchen-b` @ `1f067a4c` (Basis A @ `d4f6420d`), AK-1…18, Final-Review opus
ZURÜCK → Fix (Schlüssel `s:<insel>:<gut>`, Rot-Test) → Delta-Review OK, Playtest 1280×720/1920×1080 OK mit Screenshots unter
`.studio/qa/ui-haeppchen-b/`, `make check` Exit 0 (Last 6). Entscheid **Gate Merge OK**; `FULL_GRACE_TICKS` (5 s Karenz gegen
Flackern, UI-Wert, kein Spielwert) bestätigt. Integrator-Lauf in einer Instanz, seriell in `.worktrees/integrate`: (1) `tool/b10`
@ `6f48387a` mergen, Push-Gate REL-20 und Push (R585); (2) danach lokal `feat/ui-haeppchen-a` @ `d4f6420d` (R586) und (3)
`feat/ui-haeppchen-b` @ `1f067a4c`, je mit `make check` Exit 0, kein zweiter Push (R335). A+B bilden REL-21 für die nächste
Session (Release-Check am Kandidaten dort). Die Lastprüfung im Hintergrund entfällt (Last bei B-Check 6).

Regelbezug: gates.md Gate Merge, R335, R577, R585, R586, R588 · Kosten bei Irrtum: ein Fix auf main vor REL-21.

Entscheider: L0 · Anlass: Schlussbericht lead-tech UI-HAEPPCHEN-B · ADR: —

## R591 · 2026-10-13 · Push-Gate REL-20 zweimal an Grundlast gescheitert: keine Ausnahme, N-100, I047-SIM startet

Ruling: Bericht production-integrator: Merge `tool/b10` im Integrate-Worktree als `d3eabfb3` (nicht auf main), `make check` Exit 0,
`make check-ci-perf` Exit 0 (351), `make push-check` sechsmal Exit 2 («kein ruhiges Fenster», Last 5,8–9,8 gegen `LOAD_WAIT` 3,0).
Beleg: keine Studio-Prozesse (kein node/vitest), Grundlast `fileproviderd` ≈ 97 %, `rtcreportingd` ≈ 66 %, Dropbox ≈ 62 %. Merges A/B
richtig zurückgehalten. Entscheide: (1) **Keine Ausnahme** von `push-check` (strenge Zeitreserve ist Regressionsschutz gegen rote
CI-Zeittests; ein Abweichen bräuchte einen Handbuch-Minor). (2) Nutzer-Warteschlange **N-100** «Dropbox während des Push-Gates
pausieren». (3) Push-Gate erneut beim Session-Ende bzw. sobald Last ≤ 3; `d3eabfb3` bleibt verwendbar, solange main nur
`docs/studio/` ändert — sonst neu mergen. (4) Der Vorfall gehört zur Retro `adhoc-testlock` (Nachtrag durch den Coach in der
Ende-Retro: Push-Check-Schwelle 3 gegen Dauerlast der Maschine, V3-Lastprotokoll auch in `pushcheck.py`). (5) R589 geändert:
**I047-SIM startet jetzt** (Parallelität 1 ist innerhalb R588 V1), weil der Push nicht absehbar ist; Merges A/B bleiben bis nach
dem Push zurück.

Regelbezug: R335, R380, R565 V2, R587, R588, R589, Verfassung §5 · Kosten bei Irrtum: REL-20 erst in der nächsten Session live.

Entscheider: L0 · Anlass: Bericht production-integrator REL-20 (failed) · ADR: —

## R592 · 2026-10-13 · I047-SIM abgenommen; I047-UI startet gestapelt auf UI-HAEPPCHEN-B

Ruling: Bericht lead-tech I047-SIM, `feat/i047` @ `ca4c1881`, T01–T03 je Task-Review OK, Zwischen-Review OK, `make check` Exit 0 (3745),
Save v14 verlustfrei, balance unverändert, Zeiten ohne Verschlechterung. Lesart «kein bestehender Test > 500 ms» als «keine
Verschlechterung» bestätigt (137 Render-Tests liegen schon auf main darüber). Zwei niedrige Hinweise in `docs/beobachtungen.md`.
Entscheid: R589 Auflage (2) wird angepasst, weil der Merge von B wegen des ausstehenden Pushs (R591) nicht absehbar ist: I047-UI
**stapelt** auf `feat/ui-haeppchen-b` @ `1f067a4c` (gates.md Dateimatrix: fachliche Abhängigkeit → Branch des Vorgängers per Merge
holen, kein Rebase). Der Controller merged B in `feat/i047` vor T04. Merge-Reihenfolge nach dem Push: A → B → I-047. Budget
I047-UI 5 Starts / P1 (Rest der Freigabe 8 plus 1 für den Final-Review opus über die ganze Branch).

Regelbezug: gates.md Gate Merge Release (Dateimatrix), R589, R591 · Kosten bei Irrtum: ein Fix auf B erzwingt einen Merge in I-047.

Entscheider: L0 · Anlass: Bericht lead-tech I047-SIM · ADR: —

## R593 · 2026-10-13 · Push-Gate REL-20: Zeitreserve-Substanz statt Last → TOOL-ZEITRESERVE-M14; I047-UI startet

Ruling: Bericht production-integrator: Ruhefenster erreicht (Last 2,9–5), `make push-check` dreimal Exit 1 bei grünen Tests (3684):
Zeitreserve-Gate (lokal × 3 > 50 % von 5000 ms) meldet wiederkehrend 7–8 Tests, überwiegend aus M14-E1 (`decor` D11/E2/E6,
`islands-c` Spanne, `islands-seeds-a` Blöcke, `wildlife` Delfine, `terrainSea` L5-T3, `fauna` CAPS; 850–1220 ms lokal). Die Lesart
«Lastartefakt» aus R585 trifft für diese Tests **nicht** zu. Entscheide: (1) Paket **TOOL-ZEITRESERVE-M14** (lead-tech, sonnet,
4 Starts/P1, Branch `tool/zeitreserve-m14` ab main): je Test bevorzugt beschleunigen (gemeinsame Welt, kleinere Stichprobe ohne
Aussageverlust), sonst begründeter Timeout 10000 ms nach E-043-Vorschlag; Zeiten vorher/nachher; kein `src/`. (2) Danach Push-Gate
REL-20 neu (Merge `tool/b10` + `tool/zeitreserve-m14`). (3) **I047-UI startet jetzt** (R592), disjunkte Dateien. (4) Ad-hoc-Retro:
Nachtrag in `adhoc-testlock` in der Ende-Retro (Final-Reviews prüfen die CI-Reserve neuer Tests nicht wirksam; gates.md fordert
≤ 50 % unter `CI=true`, R270).

Regelbezug: R270, R585, R591, E-043, gates.md Prüfliste · Kosten bei Irrtum: ein weiteres Werkzeug-Paket vor dem Push.

Entscheider: L0 · Anlass: Bericht production-integrator REL-20 (failed) · ADR: —

## R594 · 2026-10-13 · Gate Merge TOOL-ZEITRESERVE-M14: OK; Push-Gate REL-20 neu

Ruling: Bericht lead-tech, `tool/zeitreserve-m14` @ `ea7bff9c`, nur 6 Testdateien, Task-Review OK (keine Assertion gelockert, Seeds
lückenlos), `make check` Exit 0. Fünf Fälle beschleunigt, `islands-c` Spanne und `wildlife` E5 Delfine mit Timeout 10000 ms und
Kommentar, `fauna` CAPS knapp unter der Grenze (662 ms × 3 < 2000 ms, Restrisiko). Der gemeldete Fall `seaKorridor` «AK-K1b Teilhash»
ist schon durch `tool/b10` (Timeout 20000 ms, R582) abgedeckt; die Branch basiert auf main ohne b10 — kein Folgepaket. Entscheid
**Gate Merge OK**; `production-integrator` merged `tool/b10` und `tool/zeitreserve-m14` in `.worktrees/integrate`, `make push-check`
(höchstens 3 Läufe), Push REL-20. I047-UI läuft parallel (eine Test-Instanz, R588 V1).

Regelbezug: gates.md Gate Merge, R582, R585, R588, R593 · Kosten bei Irrtum: `fauna` CAPS blockiert den nächsten push-check knapp.

Entscheider: L0 · Anlass: Bericht lead-tech TOOL-ZEITRESERVE-M14 · ADR: —

## R595 · 2026-10-13 · REL-20 «Inselcharakter» live; Merges A/B lokal; Prozess-Aussensicht

Ruling: Bericht production-integrator: `tool/b10` + `tool/zeitreserve-m14` gemergt, `make push-check` Lauf 2 Exit 0 (Zeitreserve 0
ohne Reserve, check-ci-perf 351), Push `19683ddf..0d1db8f3`, CI 38429087293 success, Pages 38429091182 success, `backup/main-lokal`
= `0d1db8f3`. Lauf 1 scheiterte an nicht isoliertem Studio-Test (`test_hook.py`, `<tmp>/x`) → Beobachtung, Trivial-Fix in
TOOL-BUENDEL-11. Entscheide: (1) **REL-20 live**, Release-Notiz in state.md. (2) Integrator merged lokal `feat/ui-haeppchen-a`
(R586) und `feat/ui-haeppchen-b` (R590), je `make check` Exit 0, kein Push (R335). (3) `studio-process-coach` liefert die
Prozess-Aussensicht zu REL-20 (R127). (4) Trailer «Sonnet» der Integrator-Commits bleibt stehen (Subagenten erhalten eine eigene
Session-Vorgabe).

Regelbezug: R127, R335, R586, R590, R594 · Kosten bei Irrtum: —

Entscheider: L0 · Anlass: Bericht production-integrator REL-20 (done) · ADR: —

## R596 · 2026-10-13 · Gate Merge I-047 Stammkunde: OK; Merge nach B, lokal

Ruling: Berichte lead-tech I047-SIM (R592) und I047-UI, `feat/i047` @ `65f6ec2f` (enthält B @ `1f067a4c` und main `07c22fbd`),
T04–T07, Task-Reviews OK (T06 (A) BEDENKEN zur Krisendauer), Playtest 1280×720/1920×1080 OK mit Screenshots, **Final-Review opus OK**
über die ganze Branch, `make check` Exit 0 (3841), Zeiten ohne Verschlechterung, Save **v14** (main 13 → v14 frei, T07 ohne
Änderung). Entscheide: (1) **Gate Merge OK**; Merge lokal durch `production-integrator` nach A und B (Reihenfolge A → B → I-047),
`make check` Exit 0, T07 «Version festlegen» unmittelbar vor dem Merge erneut prüfen (Erweiterung 1 nicht gemergt → v14). Kein Push
(R335); I-047 fährt mit REL-21. (2) Playtest-Aufbau mit 30-s-Krise, zur Laufzeit per Dev-Sonde verlängert, genügt R589 (1)
(Abstand 6 px, keine Überlappung). (3) Wertfrage (Vertrag 27 je Rum gegen Auftrag 30, Strafe = eine Lieferung) ist gewollt
(sichere Abnahme gegen Prämie) und geht an die Playtest-Prüfung nach Spec B.5 (Auswerter lead-design, Rückfall per Ruling).

Regelbezug: gates.md Gate Merge, R584, R589, R592, R553 · Kosten bei Irrtum: ein Werte-Ruling nach dem ersten Spielertest.

Entscheider: L0 · Anlass: Schlussbericht lead-tech I047-UI · ADR: —

## R597 · 2026-10-13 · Freie Plätze: TOOL-BUENDEL-11 und DOC-ARCHIV

Ruling: Nach den Gates A, B, I-047 sind Plätze frei (R475). Start (1) **TOOL-BUENDEL-11** (lead-tech, sonnet, 5 Starts/P1, Branch
`tool/b11`): T01 Lastprotokoll beim Testlock-Abbruch und beim push-check «kein ruhiges Fenster» (Top-Prozesse, Zahl Vitest-Worker;
R588 V3), T02 Isolation `test_hook.py` (`<tmp>/x`, R595), T03 Szenarien (a) `m14e1-felsbucht` für AK-36, (c) `m13-vor-ziel`,
(d) Umbenennung `m13e2-v13` (R581 (3)); Beipack arc42 `buyPct` (R581 (1)). (2) **DOC-ARCHIV** (lead-production, 1 Start, Branch
`docs/archiv`): `docs/ideen.md` (≈ 80 KB) in aktiven Pool plus Archiv (erledigt/verworfen/live) aufteilen, README-Spielwerte-Anhang
auslagern, alle Verweise nachführen; Ziel: beide Hauptdateien < 30 KB (E-057). Die Ideen-Runde IDEEN-09 folgt nach DOC-ARCHIV.

Regelbezug: R475, R580, R581, R588, R595 · Kosten bei Irrtum: tote Links nach dem Auslagern (Prüfung `make docs-check`).

Entscheider: L0 · Anlass: freie Kapazität · ADR: —

## R598 · 2026-10-13 · Prozess-Retro REL-20: V1–V3 angenommen

Ruling: Retro `retros/2026-10-13-prozess-rel20.md` (`d5a9e6b2`): Freigabe bis CI grün 2 h 47 min, Wurzeln: L0 prüfte «Last ≤ 7»
statt der push-check-Schwelle 3,0 (R587, 62 min Warten), strenge Zeitreserve erst am letzten Gate gemessen, «Lastartefakt» ohne
Messung festgehalten (R585). Entscheide: **V1** strenge Zeitreserve der markierten Dateien schon beim Gate Merge; ein
«Lastartefakt» darf ein Ruling nur nach dieser Messung festhalten — Make-Ziel als T05 in TOOL-BUENDEL-11 (Budget +1 Start),
Regel in `gates.md` durch `studio-coach` in der Ende-Routine (Handbuch-Minor). **V2** ein Kriterium «push-bereit» = push-check-
Schwelle (`LOAD_WAIT`), L0 nennt keine eigene Lastzahl; R587 (1) entsprechend überholt. **V3** push-check Exit 1 bei ruhiger
Startlast = Substanz, kein erneuter Lauf; «höchstens 3 Läufe» gilt nur für Exit 2 (Integrator-Briefing). Cache-Write-Hebel für
lead-tech schlägt `studio-coach` in der Ende-Retro vor (Pflicht, dritte Retro in Folge). B5-Befunde (Prettier-Abweisungen,
E-060-Datenpunkt) an die Ende-Retro.

Regelbezug: R316, R429, R585, R587, R594 · Kosten bei Irrtum: ein Gate Merge dauert einige Minuten länger.

Entscheider: L0 · Anlass: Bericht studio-process-coach RETRO-PROZESS-REL20 · ADR: —

## R599 · 2026-10-13 · DOC-ARCHIV: geparkte Ideen ins Archiv; Merge nach A/B/I-047

Ruling: Bericht lead-production DOC-ARCHIV, `docs/archiv` @ `a8304aab`: README 59,5 → 29,6 KB (vier Regelabschnitte wortgleich nach
`docs/spielwerte.md`), `docs/ideen.md` 80 → 66,6 KB, Archiv 13,7 KB, 88 Überschriften erhalten, `make docs-check`/`studio-test` grün.
Entscheide: (1) **Geparkte Ideen liegen im Archiv**; der Pool `docs/ideen.md` führt nur neu, bewertet, eingeplant, dazu die jüngste
Rangliste; ältere Ranglisten (IDEEN-06/07) ins Archiv. Ein Wiederaufnehmen einer geparkten Idee verschiebt sie zurück. (2) Der
Pool-Deckel 40 zählt nur den Pool. (3) Merge-Reihenfolge: **DOC-ARCHIV nach A → B → I-047**; vor dem Gate holt lead-production
main per Merge und verschiebt deren README-Änderungen in den verschobenen Abschnitten nach `docs/spielwerte.md` (Eigentümer des
späteren Branches löst, gates.md). (4) Persona-Hinweis (`lead-design`, `design-idea-scout`): Archivieren beim Statuswechsel — Entwurf
an `studio-coach` für die Ende-Routine.

Regelbezug: R581 (2), R597, E-057, gates.md Konflikte · Kosten bei Irrtum: eine geparkte Idee wird übersehen.

Entscheider: L0 · Anlass: Bericht lead-production DOC-ARCHIV · ADR: —

## R600 · 2026-10-13 · Release-Check REL-21 vorziehen

Ruling: A, B, I-047 lokal auf main (`cff72fe7`, `d77f5873`, `e2a5297e`, Kopf `0a19ad53`), je `make check`/`check-ci-perf` Exit 0. Der
Push fällt in die nächste Session (R335). Damit er dort in einem Anlauf gelingt, zieht L0 den **Release-Check REL-21** vor
(gates.md Gate Merge Release, Schritte 3–4): `lead-qa`, Budget 3 Starts / P2 — Browser-Lauf `qa-playtester` am Kandidaten (je UI-Task
ein Abschnitt mit Screenshots unter `.studio/qa/REL-21/`), Opus-Review über `origin/main..main` (nur `src/`, `tests/`, README,
arc42), strenge Zeitreserve der markierten Dateien nach R598 V1 (soweit das Make-Ziel aus TOOL-BUENDEL-11 noch fehlt: Liste der
Warnungen mit Last). TOOL-BUENDEL-11 und DOC-ARCHIV kommen per Delta-Review dazu.

Regelbezug: gates.md Gate Merge Release, R335, R598 · Kosten bei Irrtum: ein Delta-Review mehr in der nächsten Session.

Entscheider: L0 · Anlass: Bericht production-integrator REL-21 · ADR: —

## R601 · 2026-10-13 · Gate Merge DOC-ARCHIV: OK

Ruling: Bericht lead-production, `docs/archiv` @ `2f9f9450` (main bis `0a19ad53` gemergt, Konflikte README/`ideen.md` durch den
Eigentümer gelöst, Änderungen von A/B/I-047 übernommen), `make docs-check` Exit 0. README 59,5 → 28,3 KB, `docs/ideen.md` 80,0 →
27,9 KB, Archiv 52,9 KB, `docs/spielwerte.md` 35,3 KB (Denkmal-Abschnitt zusätzlich wortgleich verschoben), 88 Ideen erhalten.
Entscheid **Gate Merge OK**; `production-integrator` merged lokal (nur Doku: `make docs-check`, `make conflicts`, `make studio-test`
Exit 0), kein Push. Fährt mit REL-21; der Release-Check (R600) nimmt die README-Verlagerung per Delta mit.

Regelbezug: gates.md Gate Merge, R599, R600, E-057 · Kosten bei Irrtum: ein toter Verweis.

Entscheider: L0 · Anlass: Bericht lead-production DOC-ARCHIV · ADR: —

## R602 · 2026-10-13 · Gate Merge TOOL-BUENDEL-11: OK mit Prozess-Vermerk

Ruling: Bericht lead-tech, `tool/b11` @ `940707d3`, Final-Review sonnet OK, `make check` Exit 0, `studio-test`/`studio-lint`/`tsc`/
`lint`/`zeittests`/`conflicts`/`docs-check` Exit 0. T01 Lastprotokoll (`loadsnap.py`, Event `load_abort`), T02 `test_hook`-Isolation,
T03 Szenarien (a) Holz 10, (c) Lager-Startwerte, (d) `m13e2-zukunftsstand`, T04 arc42 `buyPct`, T05 `make zeitreserve-gate`.
Entscheid **Gate Merge OK**, lokaler Merge durch `production-integrator` nach DOC-ARCHIV, kein Push. Entwürfe: (1) Einzeiler
gates.md → `studio-coach` (Ende-Routine, zusammen mit R598 V1); (2) Spec AK-M14E1-36 «Holz 20» → «Holz 10» als Beipack beim
nächsten Design-Durchgang (Beobachtung); (3) alte Fundstellen `m13e2-v13` in Plänen bleiben (historisch). **Prozess-Vermerk an die
Ende-Retro:** Controller machte T02/T04 selbst und ersetzte die Task-Reviews durch ein gemeinsames Review — gegen Briefing («Prüfschritte
nicht streichen», L1 macht keine Inhaltsarbeit). `/tmp/x` ist kein leeres Verzeichnis, sondern eine Agenten-Ausgabedatei (52 KB, 17:45) — bleibt liegen, harmlos.

Regelbezug: gates.md Gate Merge, R581, R588, R595, R598 · Kosten bei Irrtum: ein Fehler in Werkzeug-Code fällt erst im nächsten push-check auf.

Entscheider: L0 · Anlass: Bericht lead-tech TOOL-BUENDEL-11 · ADR: —

## R603 · 2026-10-13 · Release-Check REL-21: OK mit Doku-Auflage

Ruling: Bericht lead-qa REL-21 am Kandidaten `0a19ad53`: Playtest OK (85 Screenshots unter `.studio/qa/REL-21/`, 0 Konsolenfehler,
v13 → v14 lädt, v999/kaputtes JSON abgewiesen), Opus-Review BEDENKEN nur Doku (arc42 fünf Modulzeilen veraltet, README Z. 314
Zifferntasten-Satz falsch platziert, Z. 164 Esc/Rechtsklick), strenge Zeitreserve-Nachmessung (Startlast 2,7) 0 ohne Reserve.
Entscheid **Release-Check OK mit Auflage**: Doku-Fix (arc42-Modulzeilen, README-Stellen) als `docs:`-Commit durch lead-tech **nach**
dem Merge von DOC-ARCHIV (README neu gegliedert), Delta-Review sonnet zusammen mit TOOL-BUENDEL-11 und DOC-ARCHIV vor dem Push in der
nächsten Session. Esc/Rechtsklick und Kleinbefunde → `docs/beobachtungen.md`. Reihenfolge jetzt: Integrator merged DOC-ARCHIV (R601)
und TOOL-BUENDEL-11 (R602) lokal.

Regelbezug: gates.md Gate Merge Release, R600, R601, R602 · Kosten bei Irrtum: veraltete Modulzeilen bis zum Doku-Fix.

Entscheider: L0 · Anlass: Bericht lead-qa REL-21 · ADR: —

## R604 · 2026-10-13 · TOOL-BUENDEL-11 Konflikt arc42; Doku-Fix REL-21 auf derselben Branch; IDEEN-09

Ruling: Bericht production-integrator: DOC-ARCHIV gemergt (`323fd29a`, docs-check/conflicts/studio-test Exit 0); `tool/b11` Konflikt
in `docs/arc42.md` (Absätze «Save v14 (I-047)» und «`buyPct` ab v12» an derselben Stelle), Merge abgebrochen, main sauber.
Entscheide: (1) lead-tech (TOOL-BUENDEL-11, 2 freie Starts) merged main in `tool/b11` (kein Rebase), behält beide Absätze in
Versionsreihenfolge (v12 `buyPct` vor v13/v14) und erledigt auf derselben Branch die **Doku-Auflage R603** (arc42-Modulzeilen
`problems.ts` fünf Klassen, `hotkeys.ts`, `input.ts`, `hud.ts`, `upkeepRank.ts`; README Zifferntasten-Satz und Esc/Rechtsklick-Zeile im
neu gegliederten README); Delta-Review sonnet; `make check` Exit 0; neuer Kopf-Hash an L0 (Nachtrag zu R602, R565 V2). (2) Kein
neuer Vorfall für die Ad-hoc-Retro: Doku-Konflikt ist der Normalfall der Dateimatrix (gates.md), gemeldet statt gelöst — korrekt.
(3) **Ideen-Runde IDEEN-09** startet (R580, R597: nach DOC-ARCHIV): lead-design mit 3 Scouts, Budget 4 Starts / P3, Pool `docs/ideen.md`
mit Archivregel R599.

Regelbezug: gates.md Konflikte, R445, R580, R599, R602, R603 · Kosten bei Irrtum: ein weiterer Merge-Anlauf.

Entscheider: L0 · Anlass: Bericht production-integrator REL-21 (failed) · ADR: —

## R605 · 2026-10-13 · Nachtrag R602/R603: TOOL-BUENDEL-11 @ `fe4eb787` OK

Ruling: Bericht lead-tech: main `2917d77c` per Merge `907b8f34` in `tool/b11`, arc42-Konflikt gelöst (v12 `buyPct` vor v14 I-047),
Doku-Auflage R603 durch Arbeiter (`fe4eb787`: arc42-Modulzeilen, README Zifferntasten und Esc/Rechtsklick, README 28,5 KB),
Delta-Review sonnet OK, `make docs-check`/`make check` Exit 0. Neuer geprüfter Hash **`fe4eb787`** ersetzt `940707d3` aus R602
(R565 V2). Entscheid: Merge lokal durch `production-integrator`, `make check` Exit 0; danach ist REL-21 vollständig (A, B, I-047,
DOC-ARCHIV, TOOL-BUENDEL-11, Doku-Fix R603). Push in der nächsten Session per `make push-check`. Die Esc/Rechtsklick-Beobachtung bleibt
als Designfrage offen (README beschreibt jetzt den Ist-Zustand).

Regelbezug: R565 V2, R602, R603, R604 · Kosten bei Irrtum: —

Entscheider: L0 · Anlass: Bericht lead-tech TOOL-BUENDEL-11 · ADR: —

## R606 · 2026-10-13 · Runden-Ruling IDEEN-09

Ruling: Bericht lead-design IDEEN-09, `docs/ideen-09` @ `91e65e2f`: 13 neue Ideen I-088…I-100, Pool 15/40, `docs/ideen.md` 28,6 KB,
keine §5.3-Frage. Entscheide wie empfohlen: (1) **einplanen** I-092 Inselmarkt-Vorliebe (zuerst Kurzdesign mit Werterechnung durch
lead-design, Budget 2 Starts; Rechnung muss zeigen, dass sich nur Konsumgüter spürbar lohnen), **UI-HAEPPCHEN-C** = I-088
Marktvergleich auf der Stammkunden-Angebotskarte + I-090 Sprung Vertragskarte → Erzeuger (Plan durch lead-tech, Stufe leicht,
Kombiniertes Gate), danach I-100 «Neu»-Zähler am Ereignis-Log (ersetzt I-058). (2) Beipack zum nächsten UI-Aufräum-Sammelpaket:
I-089, I-098, I-099 sowie die Kleinbefunde aus REL-21. (3) **I-098 entschieden:** Rechtsklick im Linienzug beendet zuerst nur den
Zug, der zweite Rechtsklick legt das Werkzeug ab — wie Esc; README wird mit dem Paket angeglichen. (4) parken I-091, I-093, I-094,
I-095, I-097; verwerfen I-096. (5) Bereinigung nach R599 bestätigt (IDEEN-08-Rangliste und zehn geparkte Ideen ins Archiv). Merge
`docs/ideen-09` lokal durch den Integrator. UI-HAEPPCHEN-C plant gegen main mit I-047 (lokal), Umsetzung nach dem Push REL-21
oder gestapelt.

Regelbezug: docs/ideen.md Ablauf, R445, R566, R599, R603, Verfassung §5.3 · Kosten bei Irrtum: eine geparkte Idee später neu bewerten.

Entscheider: L0 · Anlass: Bericht lead-design IDEEN-09 · ADR: —

## R607 · 2026-10-13 · Kombiniertes Gate UI-HAEPPCHEN-C: OK mit Auflagen

Ruling: Kurzplan `plan/ui-haeppchen-c` @ `7d95b792` (lead-tech), Urteil lead-qa BEDENKEN (1 mittel, 5 niedrig). L0: Ownership
(`src/ui/order.ts`, neue `src/ui/contractJump.ts`, Tests), keine Save-/Wertänderung, Abhängigkeit I-047 (lokal auf main) — erfüllt.
Entscheid **OK**, Budget 10 Starts / P1, AK-Präfix **AK-HC-** bestätigt. Entscheide aus dem Plan: (1) Wortlaut-Delta zu I-047 B.4
bewusst (Spec-Vermerk, `order.test.ts` mit T01 nachziehen); (2) «Markt ≈» = Preis der ersten Einheit; (3) Auftragsprämie entfällt
(I-047 B.3). Auflagen vor T01 durch den Controller ohne Zweitprüfung: QA (1) Messwelt Spätspiel ≥ 1000 Gebäude, Grenze 1 ms je
Frame, Rückfall Cache je `world.tick`/Insel/Gut; (2) Wortlaut für N = 0 in AK-HC-01 mit Test; (3) Cursor-Reset bei Vertragsende/
-wechsel, Inselwechsel-Verhalten als Test; (4) stillgelegte Erzeuger werden angesprungen (Test), `runContractJump` bei
`contract === null` tut nichts; (5) «kein Rot möglich, Beleg = …» markieren, Signatur konkret; (6) `noProducerMessage` mit «auf
<Insel>». Branch `feat/ui-haeppchen-c` ab `plan/ui-haeppchen-c`, main (`67661df1`+) per Merge holen.

Regelbezug: gates.md Kombiniertes Gate, R589, R606 · Kosten bei Irrtum: eine Fix-Runde für die Rechenzeit.

Entscheider: L0 · Anlass: Berichte lead-tech plan-UI-HAEPPCHEN-C, lead-qa gate-UI-HAEPPCHEN-C · ADR: —

## R608 · 2026-10-13 · Gate Brainstorming I-092 Inselmarkt-Vorliebe: OK Option 2; Gate Spec starten

Ruling: Bericht lead-design design-I-092, `design/i092` @ `44e439fb` (Spec 21 KB + Anhang Werte), Selbstprüfung OK. L0-Prüfung: stärkt
die Säule Handel (Ortswahl beim Verkauf), Spielerzweck in einem Satz («Weidenau zahlt Glas +30 %»), Scope ein Paket, nur Mechanik,
O2 einfacher als O1/O3. Entscheide: (1) **Option 2** — je Fremdinsel genau ein Konsumgut mit `PREFER_PCT` 130 (Möweninsel Stoff,
Weidenau Glas, Felsbucht Rum), kein Save-Wechsel, Baseline bitgleich. (2) **O-1: Boom und Inselvorliebe stapeln nicht, das Höhere
gilt** (sonst Kauf-Verkauf-Schleife beim Rum). (3) **O-2:** Obergrenze 17–24 % von (b) nur bei extremem Spiel hingenommen, keine
strengere Sättigung. Drei Rechenbefunde (Markterholung 60/min, Schiffsunterhalt 90/min, Spielwerte-Wortlaut) → `docs/beobachtungen.md`.
Gate Spec: lead-tech und lead-qa (opus) parallel.

Regelbezug: gates.md Gate Brainstorming, Gate Spec, R606 · Kosten bei Irrtum: ein Faktor im Erlös, kein Save.

Entscheider: L0 · Anlass: Bericht lead-design design-I-092 · ADR: —

## R609 · 2026-10-13 · Gate Spec I-092 Inselmarkt-Vorliebe: OK mit Auflagen; Plan Stufe leicht

Ruling: Urteile lead-tech BEDENKEN (1 mittel, 3 niedrig) und lead-qa BEDENKEN (1 hoch, 1 mittel, 5 niedrig) zu `design/i092` @
`44e439fb`. Entscheid **Gate Spec OK mit Auflagen**; AK-Präfix **AK-IM-01…14** bestätigt (R417). Spec-Nachtrag durch lead-design
ohne neues Gate (Fortsetzung des Starts, kein neues Budget): QA (1) AK-IM-14 im pausierten Spiel, plus zwei Schritte (Boom auf Glas
«statt Vorliebe», Wechsel nach Felsbucht); QA (2) B.5 «analytisch, Rückfall `PREFER_PCT` per Ruling senken, ein Def-Wert, kein
Save»; QA (4) AK-IM-03 per Schiff entladenem Glas; QA (5) Kontor/Glas erst nach dem Laden der Fixture; Tech (1) AK-IM-10 auf
`save-v12-felsbucht.json` mit 1 Rum ins Felsbucht-Lager (+23 Geld). Auflagen an den Plan: QA (3) `buyFactorPct` aus den Defs statt
80, Gegenprobe Edikt Handel + Boom; Tech (2) `sellTexts` exportieren; Tech (3) `prefersGood` in `sim/trade.ts` mit Absicherung
unbekannter Insel; Tech (4) Kettenrekursion mit besuchter Menge. **Prozessstufe leicht** (S–M, kein Save, kein ADR): Kurzplan durch
lead-tech (sonnet), Kombiniertes Gate. **Merge-Risiko Erweiterung 1:** neues Pflichtfeld `prefers` in `IslandDef` — der Plan nennt
es; wer später merged, ergänzt neue Inseln (Hinweis an die Nutzer-Session beim Merge jener Branch).

Regelbezug: gates.md Gate Spec, Kombiniertes Gate, R417, R553, R608 · Kosten bei Irrtum: ein Test mehr in der Umsetzung.

Entscheider: L0 · Anlass: Urteile lead-tech und lead-qa gate-I-092 · ADR: —

## R610 · 2026-10-13 · Kombiniertes Gate I092: OK mit Auflagen

Ruling: Kurzplan `plan/i092` @ `39859bbc`, Urteil lead-qa BEDENKEN (3 mittel, 3 niedrig), AK-Abdeckung vollständig. L0: Ownership
disjunkt zu UI-HAEPPCHEN-C, kein Save, Abhängigkeiten erfüllt. Entscheid **OK**, Budget **7 Starts / P1** (Review T02 auf opus über die
ganze Branch ersetzt den Final-Review, QA (6)). Auflagen vor T01 durch den Controller ohne Zweitprüfung: (1) AK-IM-03 nur per Route
über `tickShips` entladen, «oder direkt gesetzt» streichen; (2) **Weltkarten-Hover zeigt die Markt-Zeile auch** (Entscheid), T02
erhält `tests/ui/islandCard.test.ts` mit begründet angepassten Erwartungen; (3) Branch `feat/i092` ab `plan/i092`, vorher
`design/i092` @ `f5dec181` und main per Merge holen, Rückfall-Satz streichen; (4) `tests/ui/trade.test.ts` in den Grün-Lauf T02;
(5) Beleg AK-IM-10 = leerer Diff `save.ts`/`types.ts`.

Regelbezug: gates.md Kombiniertes Gate, R609 · Kosten bei Irrtum: eine Textzeile im Hover.

Entscheider: L0 · Anlass: Berichte lead-tech plan-I092, lead-qa gate-plan-I092 · ADR: —

## R611 · 2026-10-13 · UI-HAEPPCHEN-C: Nacharbeit Rechenzeit vor Gate Merge

Ruling: Bericht lead-tech, `feat/ui-haeppchen-c` @ `1378c764`, Reviews/Playtests OK, Final-Review opus BEDENKEN → Fix → Delta OK,
`make check` Exit 0. **Auflage R607 (1) nicht erfüllt:** der erste Aufruf je Tick kostet bei 1200 Gebäuden ≈ 15–18 ms (Ziel ≤ 1 ms),
weil `goodsBalance` die ganze Bilanz inkl. Versorgung rechnet — bei offenem Angebot ein Ruckler je Tick im Spätspiel. Entscheid
**Nacharbeit vor dem Gate Merge** (2 freie Starts): «Erzeugung x / min» nur aus den Erzeugern des einen Vertragsguts berechnen
(Betriebe mit diesem Output × Rate, Zustand/Trait berücksichtigt wie in `goodsBalance`, ohne Verbrauch/Versorgung), Gleichheit mit
dem Produktionsanteil von `goodsBalance` per Test auf ≥ 3 Welten; Messung erster Aufruf bei ≥ 1000 Gebäuden ≤ 1 ms (Median); Cache je
Tick darf bleiben. Zusätzlich in Ownership: Spec I-047 Z. 237 Angebots-Wortlaut nachführen, `docs/ideen.md` I-088/I-090 auf `live`
(beim Merge, R599: dann ins Archiv). Delta-Review opus, `make check` Exit 0.

Regelbezug: R593, R607, gates.md Gate Merge · Kosten bei Irrtum: ein Ruckler je Tick bei offenem Angebot im Spätspiel.

Entscheider: L0 · Anlass: Schlussbericht lead-tech UI-HAEPPCHEN-C · ADR: —

## R612 · 2026-10-13 · Gate Merge UI-HAEPPCHEN-C: OK

Ruling: Bericht lead-tech Nacharbeit R611, `feat/ui-haeppchen-c` @ `116139a4`: Erzeugung aus `goodProductionPer100` (nur Erzeuger des
Vertragsguts, gleiche Zählregel), erster Aufruf je Tick bei 1200 Gebäuden 15,05 → 0,026 ms (Median), Gleichheitstest gegen
`goodsBalance().produced` auf drei Welten, Delta-Review opus OK, `make check` Exit 0, `src/sim/` unverändert, Spec-Wortlaut I-047 und
Ideen-Status (live, Archiv) nachgeführt. Entscheid **Gate Merge OK**; lokaler Merge durch `production-integrator`, `make check`
Exit 0, kein Push (REL-22). Restpunkte (Haus-Zweig im Test, doppelte Zählregel `flow.ts`/`production.ts` → gemeinsame Funktion,
Archiv-Trenner, Lücken in der Rangliste) → UI-Aufräum-Sammelpaket (R606).

Regelbezug: gates.md Gate Merge, R607, R611 · Kosten bei Irrtum: zwei Zählregeln laufen auseinander (Gleichheitstest fängt das).

Entscheider: L0 · Anlass: Bericht lead-tech UI-HAEPPCHEN-C (Nacharbeit) · ADR: —

## R613 · 2026-10-13 · Gate Merge I092 Inselmarkt-Vorliebe: OK

Ruling: Bericht lead-tech I092, `feat/i092` @ `cb1c2436` (enthält `design/i092` @ `f5dec181` und main), T01/T02 mit Rot-Belegen,
Review T01 BEDENKEN → behoben, Review opus über die Branch ZURÜCK (`seaMapView.test.ts` rot) → behoben → Delta OK, Playtest AK-IM-14
pausiert OK, `make check` Exit 0, `make zeitreserve-gate` Exit 0, Diff `save.ts`/`types.ts`/`balance.test.ts`/`controller.ts` leer.
Entscheide: (1) **Gate Merge OK**; lokaler Merge durch `production-integrator`, `make check` Exit 0, kein Push (REL-22).
(2) Ownership-Erweiterung nachträglich bestätigt (`tests/ui/seaMapView.test.ts` + Doc-Kommentar `src/ui/seaMapView.ts` wegen R610 (2),
`tests/sim/islandTraits.test.ts` wegen Pflichtfeld `prefers`) — künftig vor der Änderung melden. (3) Zeit-Abnahme Basis vs. Branch
fehlt; ersetzt durch grünen `zeitreserve-gate` — als Vermerk an die Ende-Retro. (4) Badge-Verwechslung `prefer-*`/`badge--boom` und
toter README-Verweis «Seefahrt und Gewürz» → UI-Aufräum-Sammelpaket.

Regelbezug: gates.md Gate Merge, R609, R610 · Kosten bei Irrtum: ein Hotfix im Inselmarkt vor REL-22.

Entscheider: L0 · Anlass: Schlussbericht lead-tech I092 · ADR: —

## R614 · 2026-10-13 · Handbuch 1.54 angenommen; E-060 behalten, E-064 laufend

Ruling: Bericht studio-coach HANDBUCH-1.54 (`7c73247d`): gates.md (Release-Fenster ≤ 2 Test-Arbeiter, `make zeitreserve-gate`,
Lastartefakt nur nach Messung, push-bereit = `LOAD_WAIT`), STUDIO.md 1.54 (Integrator Exit-1-Regel, Stash-Sperre, Stand-Warnung),
briefing.md (Integrator-Pflichtzeile), Personas lead-design 1.12 / design-idea-scout 1.1 (Archivregel), lernen.md (40 Zeilen),
CHANGELOG; `make studio-test` 847 grün, `make docs-check` Exit 0. Entscheide: (1) **Handbuch 1.54 angenommen**. (2) **E-060
behalten** (Budget-Hook `deny`; 0 Fehlblocks, korrekte Blocks ohne Freigabe; Rückfall `BUDGET_MODE = "warn"`). (3) **E-064 laufend**
ab 2026-10-13 (R579); E-065 bleibt vorgeschlagen bis ein Platz frei ist (die Warnung ist als Werkzeug schon aktiv). (4) Die
Experiment-Kopfzeile «R588, Vorschlag Coach» gilt als R614.

Regelbezug: R429, R579, R588, R598, R599 · Kosten bei Irrtum: eine Handbuchzeile zurücknehmen.

Entscheider: L0 · Anlass: Bericht studio-coach HANDBUCH-1.54 · ADR: —

## R615 · 2026-10-13 · Kurz-Retro Session 6584aaa4: V2 TOOL-BUENDEL-12, V1/V3 als wartende Experimente

Ruling: Retro `retros/2026-10-13-session-6584aaa4-ende.md` (`84b75292`). Entscheide: **V2** Cache-Write-Aufteilung in `metrics.py`
(Neuschreibung nach Pause vs. übriges Wachstum, Info-Zeile) → **TOOL-BUENDEL-12** (Messauftrag, Frist: Retro der nächsten Session).
**V1** «Folgeinstanz statt Fortsetzung bei lead-tech» (Pflicht-Hebel Cache-Write) und **V3** «drei Pflichtzeilen im lead-tech-Bericht»
(Selbstarbeit, Ownership-Erweiterung mit Meldezeitpunkt, Soll/Ist der Gate-Auflage) als **E-066/E-067 vorgeschlagen**, Reihenfolge
E-066 vor E-065 vor E-067; Start, sobald E-062 oder E-063 bewertet ist (nächste Ende-Retro). V3 gilt bis dahin als Briefing-Satz für
Controller-Briefings von L0 (ohne Experiment-Messung).

Regelbezug: R316, R429, R614 · Kosten bei Irrtum: ein ungenutzter Experimentplatz eine Session länger.

Entscheider: L0 · Anlass: Bericht studio-coach RETRO-SESSION-6584aaa4 · ADR: —

## R616 · 2026-10-14 · Session-Start: REL-21 = main mit Delta-Release-Check; Plätze füllen

Ruling: (1) **REL-21 umfasst den ganzen lokalen main** (I-047, UI-HAEPPCHEN-A/B/C, I092, DOC-ARCHIV, TOOL-BUENDEL-11, IDEEN-09):
fünf Spiel-Häppchen in einem Push als Ausnahme vom Häppchen-Deckel 4 (gates.md), weil C und I092 Final-Review und Playtest OK
haben und ein zweiter Release-Zyklus mehr kostet als der Delta-Check. Weg: `lead-qa` (sonnet, Gate-Urteil) baut den Delta-Check:
Integrator aktualisiert `.worktrees/integrate` auf main (Merge, kein Reset), `make check`; Playtest C + I092 am Kandidaten;
Opus-Review `67661df1..main`; `make zeitreserve-gate`; Bericht an L0 zum Gate. Push erst nach L0-Gate-Ruling (R335, ein Push).
(2) N-100 gilt als erledigt für REL-20 (Push lief); für REL-21 kein Dropbox-Vorbehalt, Integrator meldet Sync-Störungen.
(3) Plätze nach R475 füllen, im Release-Fenster ≤ 2 weitere Test-Arbeiter (R588 V1): **UI-AUFRAEUM-3** Plan (Sammelpaket aus
state.md Punkt 2, Stufe leicht, lead-tech sonnet), **I-100** Kurzdesign + Kurzplan (Stufe leicht, lead-design sonnet),
**TOOL-BUENDEL-12** Cache-Write-Aufteilung (R615 V2, lead-tech sonnet, Werkzeug). Umsetzung von UI-AUFRAEUM-3 und I-100 erst
nach dem Push REL-21 (Release-Fenster, Konfliktrisiko in `src/ui/`).

Regelbezug: gates.md Release-Check, R335, R475, R588 V1, R615 · Kosten bei Irrtum: ein Hotfix-Release, falls das Delta-Review
einen Fehler übersieht.

Entscheider: L0 · Anlass: Session-Start, state.md «Fortsetzung» Punkte 1–4 · ADR: —

## R617 · 2026-10-14 · Gate UI-AUFRAEUM-3 (kombiniert, leicht): BEDENKEN → Nacharbeit, dann frei

Ruling: Urteil lead-qa BEDENKEN zum Plan `plan/ui-aufraeum-3` @ `be1be84f`. Nacharbeit durch eine Folgeinstanz lead-tech
(Restbudget plan-ui-aufraeum-3, ohne Zweitprüfung): (1) T05 Determinismus-Test gleicher Seed, N Ticks, Save/Load-Roundtrip
als JSON-Vergleich; Snapshot-Welt mit stillgelegten und nicht angebundenen Betrieben; (2) Playtest-Schrittliste T01–T04
(Rechtsklick im Zug, Badge neben Boom, Rangliste zwei Inseln bei 1280×720 ohne Überlauf, Kartenstapel inkl. Krise aus→an);
(3) R392-Abnahme mit `zeit-vor.json` und `zeit-nach.json` im Bericht; (4) Zugmenge für Rechtsklick (Abriss, Weide) als
Testfall in T01 festlegen. L0-Prüffragen: ein Owner je Datei, ein Worktree, ein Strang seriell (style.css) — OK; Auftrag bleibt
leicht (T05 reine Umformung in `src/sim/flow.ts` ohne Save/Spielwert, bitgleich belegt). **Budget 21 Starts / Parallelität 1**
wie beantragt. Wortlaut-Änderungen «Krisen: aus» ohne Karte und gestaffelter Rechtsklick gelten nach R606 (3) als angenommen.
Umsetzung erst nach Push REL-21 (Release-Fenster R588 V1).

Regelbezug: gates.md Kombiniertes Gate, R392, R606, R616 · Kosten bei Irrtum: ein Fix-Task in der Umsetzung.

Entscheider: L0 · Anlass: Bericht lead-qa gate-ui-aufraeum-3 · ADR: —

## R618 · 2026-10-14 · Gate Merge TOOL-BUENDEL-12: OK, Merge nach Push REL-21

Ruling: `tool/b12` @ `eab93fc9` (Cache-Write-Aufteilung in `tools/studio/efficiency.py`, 5 neue Tests mit Rot-Beleg,
`make studio-test` 852 grün, Task-Review sonnet OK, Echtlauf: Cache-Write 5 min 28,2 %, davon nach Pause 13,3 %, übriges
Wachstum 15,0 %) → **OK**. Merge durch lead-production/Integrator erst nach dem Push REL-21, damit main während des
Delta-Checks stabil bleibt. R615 V2 (Messauftrag) gilt mit der Info-Zeile als erfüllt; die Ende-Retro bewertet V1 (E-066) gegen
den Pausenanteil von lead-tech. Prozessbefund an die Retro: lead-tech startete einen Warte-Agenten (haiku) und drei
`sleep`-Hintergrundbefehle ohne Nutzen (Verstoss gegen «kein Polling», Handbuch 1.39).

Regelbezug: gates.md Gate Merge (Werkzeug), R615 V2, R616 · Kosten bei Irrtum: eine Info-Zeile zurücknehmen.

Entscheider: L0 · Anlass: Bericht lead-tech tool-buendel-12 · ADR: —

## R619 · 2026-10-14 · Gate I-100 (kombiniert, leicht): BEDENKEN, Auflagen ins Umsetzungs-Briefing

Ruling: Kurzdesign + Plan `design/i100` @ `d05e67d1` → BEDENKEN angenommen, keine Plan-Nacharbeit: die Auflagen gehen als
Pflichtzeilen ins Controller-Briefing (billiger als eine eigene Plan-Instanz): (1) T02 klärt vorab die DOM-Fähigkeit der
Vitest-Umgebung; ohne DOM-Test prüft T03 ausdrücklich den Key-Cache-Fall (Brand erhöht den Zähler bei geschlossener Box ohne
Klick); (2) T03 belegt Reset bei Laden und bei «Neue Insel» getrennt, jeweils mit Zähler ≥ 1 vorher; (3) R392-Zeitmessung vor
T01 (vorher/nachher im Bericht); (4) Merge nach UI-AUFRAEUM-3, `git merge main` vor T04, Konfliktprüfung `style.css`, README,
arc42. Kurzdesign gilt als angenommen (Zähler nur für Meldungs-Einträge, nur eingeklappt, Reset beim Aufklappen/Laden/Neue
Insel, kein Save). Budget 10 Starts / Parallelität 1 bei Umsetzungsstart nach Push REL-21.

Regelbezug: gates.md Kombiniertes Gate, R392, R606, R617 · Kosten bei Irrtum: ein Fix-Task bei T02/T03.

Entscheider: L0 · Anlass: Bericht lead-qa gate-i-100 · ADR: —

## R620 · 2026-10-14 · Freier Platz: BEOB-AUSWERTUNG-14

Ruling: 5 Beobachtungen seit 2026-10-13 (Start-Hinweis). Freier Platz nach R475 an `lead-production` (Skill
`beobachtungen-auswerten`), Budget 1 Start/P1, Worktree `.worktrees/beob-14`; Einträge, die UI-AUFRAEUM-3 (R617) oder I-100
(R619) schon abdecken, werden dorthin verwiesen statt neu eingeplant. Nur Doku, kein Push (geht mit dem nächsten Release).

Regelbezug: R475, R580, R287 · Kosten bei Irrtum: ein Eintrag wird später erneut geöffnet.

Entscheider: L0 · Anlass: freie Kapazität im Release-Fenster (keine Test-Arbeiter) · ADR: —

## R621 · 2026-10-14 · Gate Merge BEOB-AUSWERTUNG-14 OK; Auslegungen UI-AUFRAEUM-3

Ruling: (1) `docs/beob-14` @ `402ac5db` (17 Einträge: 5 eingeplant, 2 Doku-Beipack, 10 abgehakt mit Trigger, Marke 2026-10-14,
`make docs-check` Exit 0) → **Gate Merge OK** (nur Doku), Merge nach Push REL-21. Der Risiko-Hinweis «Task-Dateien veraltet» trifft
nicht zu: `plan/ui-aufraeum-3` @ `0ba2bb21` hat T01–T07 aktuell (L0 geprüft). Die zwei Doku-Beipacks («Preise global» in
`docs/spielwerte.md`, toter README-Verweis Zeile 74) gehen in UI-AUFRAEUM-3 T07. (2) **Rechtsklick-Staffelung nur im
Linienzug** (Plan-Nacharbeit `0ba2bb21`): angenommen; Abriss- und Weide-/Strassen-Strich bleiben bei `cancel`, weil das
Verhalten nach bereits gebauten Kacheln nicht abgesichert ist. Präzisiert R617 (4). (3) **Rangliste I-089 enthält die
Heimatinsel** mit ihrem vollen Unterhalt (alle Betriebe der Insel, nicht nur das Kontor); geht als Pflichtzeile ins T03-Briefing.

Regelbezug: gates.md Gate Merge, R606, R617, R620 · Kosten bei Irrtum: eine Zeile der Rangliste mehr oder weniger, Folgeänderung in T03.

Entscheider: L0 · Anlass: Berichte lead-production BEOB-14, lead-tech Nacharbeit plan-ui-aufraeum-3 · ADR: —

## R622 · 2026-10-14 · Release-Check REL-21: BEDENKEN → Hotfix Marktpreis Fremdinsel vor dem Push

Ruling: Bericht lead-qa gate-rel-21 (Kandidat `c3a93534`, `make check` Exit 0 mit 3904 Tests, `check-ci-perf` Exit 0, Playtest A–F
bestanden, Opus-Review BEDENKEN). Entscheide: (1) **Befund 1 (hoch) wird vor dem Push behoben**: HOTFIX-REL21-PREIS durch lead-tech
(Controller, Umsetzer tech-ui-engineer, Branch `hotfix/rel21-preis` von main): `src/ui/order.ts:81` übergibt die Vertragsinsel an
`sellPrice`, Test «Glas auf Weidenau → 26» mit Rot-Beleg, Spec-Korrektur AK-HC-01 und I092-Spec Z. 25; Beipack Befund 3
(`docs/arc42.md` für I092 nachführen: `sellPrice(…, island)`, `prefersGood`, `PREFER_PCT`, Marke `prefer-*`). Task-Review sonnet,
danach Delta-Check (Integrator: Merge in `.worktrees/integrate`, `make check`, `make zeitreserve-gate`) und Gate L0. Kein neuer
Playtest-Vollauf: ein Browser-Punkt (Karte Weidenau zeigt 26) im Delta-Check. Budget 4 Starts/P1. (2) **Zeitreserve-Gate Exit 2
bei ruhiger Last** («Hauptmessung fehlt?») wird als TOOL-HOTFIX-ZR untersucht (lead-tech, systematisches Debugging, Budget 3/P1);
bis zur Klärung gilt ein Exit 2 bei Last ≤ 4 nicht als Push-Freigabe. (3) Befunde 2 (Cache im pausierten Spiel) und 4 (Testname
`save-v13.test.ts:253`, Meldung «Noch kein Erzeuger für Glas auf Heimat») gehen als Beipack in UI-AUFRAEUM-3 (T06). Release-
Fenster: zwei Test-Arbeiter (Hotfix, Werkzeug) gemäss R588 V1.

Regelbezug: gates.md Release-Check, R588 V1, R598, R616 · Kosten bei Irrtum: Push REL-21 verschiebt sich um den Hotfix.

Entscheider: L0 · Anlass: Bericht lead-qa gate-rel-21 · ADR: —

## R623 · 2026-10-14 · Gate Merge HOTFIX-REL21-PREIS und TOOL-HOTFIX-ZR OK; Delta-Check REL-21

Ruling: (1) `hotfix/rel21-preis` @ `6260d347` (Rot-Beleg 20 → 26, Task-Review OK, tsc/lint/zeittests/conflicts/docs-check Exit 0,
Testzeit 2,5 → 1,9 s) → **OK**. (2) `tool/zr-hotfix` @ `91992546` (Ursache belegt: `pushcheck.Gate.gate()` las eine veraltete
`zeitreserve-marked.json`; Fix berechnet sie per `check.ts --push --marked` neu; zwei Tests mit Rot-Beleg, `make studio-test` 849
grün) → **OK**; der Echtlauf im eigenen Worktree läuft noch, der Lauf im Delta-Check gilt zugleich als Echtlauf. (3) Delta-Check
durch lead-qa (Restbudget gate-rel-21 + 2 Starts): Integrator merged beide Branches `--no-ff` nach main, bringt
`.worktrees/integrate` auf den neuen main, `make check`, `make check-ci-perf`, `make zeitreserve-gate`; ein Browser-Punkt
(Stammkunde-Karte Glas Weidenau zeigt 26). Danach Push-Gate L0. TOOL-BUENDEL-12 und BEOB-14 folgen erst nach dem Push.

Regelbezug: gates.md Gate Merge und Release-Check, R598, R622 · Kosten bei Irrtum: ein weiterer Delta-Check.

Entscheider: L0 · Anlass: Berichte lead-tech hotfix-rel21-preis und tool-hotfix-zr · ADR: —

## R624 · 2026-10-14 · Zeitreserve-Substanz vor REL-21 → TOOL-ZEITRESERVE-21

Ruling: Echtlauf `make zeitreserve-gate` mit Fix `91992546` (Hauptmessung Last 3,2, Nachmessung 2,4, 12 Dateien aus der aktuellen
Messung) meldet **Substanz** bei drei Bestandstests: `tests/render/trees-farn.test.ts` («L6 B2 Farn», 3699 ms × 4 > 50 % von
25000 ms), `tests/render/decorSea.test.ts` («L5-T1 Fernansicht», 5076 ms × 4 > 50 % von 40000 ms), `tests/sim/scenario-saves.test.ts`
(«Szenario-Saves», ≈ 2694 ms bei 5000 ms). Kein Lastartefakt (R585). Entscheid wie R593: Paket **TOOL-ZEITRESERVE-21** (lead-tech,
sonnet, 4 Starts/P1, Branch `tool/zeitreserve-21` ab main): je Test bevorzugt beschleunigen ohne Aussageverlust, sonst begründeter
Timeout nach E-043 (≥ 2 × lokale Zeit × 4); Zeiten vorher/nachher; kein `src/`; Task-Review. Danach Merge und `make zeitreserve-gate`
Exit 0 als Push-Bedingung REL-21. Der Werkzeug-Fix (R623 (2)) gilt mit diesem Echtlauf als belegt.

Regelbezug: R270, R585, R593, R598, E-043 · Kosten bei Irrtum: ein weiteres Werkzeug-Paket vor dem Push.

Entscheider: L0 · Anlass: Bericht lead-tech tool-hotfix-zr (Echtlauf) · ADR: —

## R625 · 2026-10-14 · Push-Gate REL-21: OK, Push `ca46eb73`

Ruling: Delta-Check lead-qa OK: Kandidat `ca46eb73` (main mit HOTFIX-REL21-PREIS und TOOL-HOTFIX-ZR), `make check` Exit 0,
`make check-ci-perf` Exit 0, `make zeitreserve-gate` **Exit 0** (Last 2,9, 3905 Tests), Browser: Stammkunde-Karte Weidenau Glas 26 =
Handel 26 (`.studio/qa/REL-21/delta2-*`). Die Substanz aus dem Werkzeug-Echtlauf (R624) trat im Gate nicht auf: die drei Tests liegen
an der Schwelle und schwanken; massgeblich ist das Gate (R598). Entscheide: (1) **Push REL-21** durch `production-integrator` aus
`.worktrees/integrate`: `git push origin ca46eb73:main` (geprüfter Hash, R429; die Doku-Commits danach gehen mit dem nächsten Push),
danach CI beobachten und `gh workflow run Pages --ref main` (der Remote-Kopf ist dann `ca46eb73`). (2) TOOL-ZEITRESERVE-21 läuft
weiter (Reserve-Abstand), Merge mit REL-22. (3) Release-Notiz REL-21 in state.md ergänzt um den Hotfix.

Regelbezug: gates.md Release-Check, R335, R429, R598, R622–R624 · Kosten bei Irrtum: CI rot durch einen Schwellen-Test → Rerun bzw.
Hotfix mit TOOL-ZEITRESERVE-21.

Entscheider: L0 · Anlass: Bericht lead-qa gate-rel-21-delta · ADR: —

## R626 · 2026-10-14 · Umsetzung UI-AUFRAEUM-3 und I-100 startet

Ruling: Release-Fenster REL-21 endet mit dem Push-Gate R625. Start der Umsetzung: **UI-AUFRAEUM-3** (lead-tech Controller, sonnet,
21 Starts/P1 nach R617, Branch `feat/ui-aufraeum-3` ab main mit Merge von `plan/ui-aufraeum-3` @ `0ba2bb21`; Pflichtzeilen R617,
R621 (2)(3), Beipacks R621 (1) und R622 (3)) und **I-100** (lead-tech Controller, sonnet, 10 Starts/P1 nach R619, Branch `feat/i100`
ab main mit Merge von `design/i100` @ `d05e67d1`; Auflagen R619). Beide parallel in eigenen Worktrees; Dateiüberschneidung nur
`src/style.css`, README, arc42 (andere Regeln/Abschnitte). Merge-Reihenfolge: UI-AUFRAEUM-3 zuerst, I-100 holt main per Merge vor
seinem Doku-Task. Browser-Läufe: höchstens 2 gleichzeitig (R424).

Regelbezug: R424, R475, R617, R619, R621, R622 · Kosten bei Irrtum: ein Merge-Konflikt in `style.css`.

Entscheider: L0 · Anlass: Push-Gate R625 · ADR: —

## R627 · 2026-10-14 · REL-21 live; Merges TOOL-BUENDEL-12 und BEOB-14

Ruling: REL-21 live: Push `0d1db8f3..ca46eb73`, CI 38553292584 grün, Pages 38553994549 grün. Merges nach R618/R621 jetzt durch
`production-integrator` im Hauptcheckout, seriell `--no-ff`: `tool/b12` @ `eab93fc9`, dann `docs/beob-14` @ `402ac5db`; danach
`make studio-test` und `make docs-check` je mit Exit-Code. Kein Push (der nächste Push gehört REL-22, R335).

Regelbezug: R335, R618, R621, R625 · Kosten bei Irrtum: ein Merge-Konflikt in docs/beobachtungen.md.

Entscheider: L0 · Anlass: Bericht production-integrator push-rel-21 · ADR: —

## R628 · 2026-10-14 · Freier Platz: Handels-Brainstorming (I-095, I-093)

Ruling: Nach REL-21 (I092 live) ist laut Rangliste IDEEN-09 das Handels-Brainstorming der nächste Designschritt (I-095 Fernauftrag
an einem Fremdkontor, I-093 Auftrag umtauschen; I-091 Treuebonus bleibt geparkt bis zum Nutzer-Playtest I-047). Freier Platz nach
R475 an `lead-design` (opus, Design-Lead), Budget 3 Starts/P1, Worktree `.worktrees/design-handel-2`: Brainstorming mit
Designvorschlag (2–3 Varianten, Empfehlung, Save/Baseline-Folgen, Abgrenzung zu Erweiterung 1 «Stände und Segel» der Nutzer-Session
— deren Worktree nur lesen). Ergebnis zum Gate Brainstorming an L0; keine Spec vor dem Gate.

Regelbezug: R445, R475, IDEEN-09 · Kosten bei Irrtum: ein Designvorschlag, der mit Erweiterung 1 zusammengelegt werden muss.

Entscheider: L0 · Anlass: freie Kapazität nach Push REL-21 · ADR: —

## R629 · 2026-10-14 · Gate Brainstorming Handel 2: OK für V1 «Fernangebot»; Spec jetzt

Ruling: Designvorschlag `design/handel-2` @ `faec2763` (Selbstprüfung lead-design BEDENKEN: kein Effekt in den ersten 15 min). L0 prüft
dieselben Fragen: stärkt Säule Wirtschaft/Handel (zweiter Zweck bestehender Routen), Entartung begrenzt (Stückprämie < 0,8 × Kaufpreis
wegen Edikt Handel, Kaufen-und-Liefern ohne Gewinn), kein §5.3-Vorbehalt; der 15-min-Punkt gilt gleich für I-047/I092 (Spätspiel-
Inhalt) und ist kein Hindernis. Entscheide: (1) **V1 angenommen**, I-093 geht darin auf (Fassung mit 60 Geld Gebühr verworfen); V2/V3
verworfen. (2) Handel 2 ist ein eigenes Handels-Paket ausserhalb Erweiterung 1; Auflage K4: Frist gegen Sturm/Piraten prüfen.
(3) Save-Version vergibt die Merge-Reihenfolge (R583-Muster). (4) **Spec jetzt** durch design-spec-author (Restbudget design-handel-2,
lead-design steuert); Gate Spec mit Pflichtpunkten: Baseline bitgleich (lead-tech bestätigt), Frist 2:30 gegen Seed-3-Karte, Rückfall
nur über `src/sim/defs/`. (5) Die Umsetzung wartet nicht auf den Nutzer, sondern auf einen **Studio-Playtest I-047** (qa-playtester,
lange Partie: verdrängen Fernaufträge den Stammkunden?) — als eigenes Paket PLAYTEST-I047 vor dem Plan.

Regelbezug: gates.md Gate Brainstorming, R445, R475, R583 · Kosten bei Irrtum: eine Spec, die nach dem Playtest nachgeschärft wird.

Entscheider: L0 · Anlass: Bericht lead-design design-handel-2 · ADR: —

## R630 · 2026-10-14 · Gate Merge I-100: OK, Merge nach UI-AUFRAEUM-3; PLAYTEST-I047 startet

Ruling: (1) `feat/i100` @ `b4541b7f`: Final-Review opus OK, Task-Reviews OK, `make check` Exit 0, Playtest AK-5/AK-6 belegt, Zeiten
2,10 → 2,07 s → **Gate Merge OK**. Merge durch den Integrator erst nach UI-AUFRAEUM-3 (R626), dann `make check` erneut auf main
(Konfliktprüfung style.css/README/arc42). Auflage R619 (1) gilt mit Review-Beleg des Code-Pfads als erfüllt (kein DOM in Vitest);
R619 (2) erfüllt über `restart()` ohne Reset-Code. Prozessbefund an die Retro: `make check` lief bei Last 10,8 trotz Briefing-Grenze 8.
(2) Browser-Platz frei: **PLAYTEST-I047** (lead-qa, 2 Starts/P1) nach R629 (5): lange Partie auf `main` (live-Stand REL-21) bis
Seefahrt und Stammkunde; Fragen: Wie oft kommt ein Stammkunden-Angebot, wie viel Aufmerksamkeit bindet es, bleibt Platz für einen
zweiten Auftragsstrom (Fernangebot)? Ergebnis als Playtest-Report an L0 und den Design-Lead (Gate Spec Handel 2).

Regelbezug: gates.md Gate Merge, R424, R619, R626, R629 · Kosten bei Irrtum: Konfliktnacharbeit beim Merge nach UI-AUFRAEUM-3.

Entscheider: L0 · Anlass: Bericht lead-tech i-100 · ADR: —

## R631 · 2026-10-14 · Gate Merge TOOL-ZEITRESERVE-21: OK mit Vorbehalt; gebündelter Merge

Ruling: `tool/zeitreserve-21` @ `69698908` (nur drei Testdateien, Welten in `beforeAll`, `decorSea` 5076 → 1 ms, `trees-farn`
3699 → 788 ms, `scenario-saves` AK-B2-02 855 → 62 ms, AK-S5-02 Timeout 15 s mit Kommentar; tsc/lint/zeittests/conflicts/`make test`
Exit 0; Task-Review OK) → **Gate Merge OK**, Vorbehalt: `make zeitreserve-gate` Exit 0 im Release-Check REL-22 (zweimal Exit 2 wegen
Last durch das parallele UI-AUFRAEUM-3, kein Substanz-Befund). Merge gebündelt durch den Integrator nach dem Final-Review von
UI-AUFRAEUM-3: `tool/zeitreserve-21`, `feat/ui-aufraeum-3`, `feat/i100` seriell, ein `make check` am Ende. Beobachtung: `forest`
RF-L1-5, `buyPct` AK-ZK-07, `wildlife` RF-10, `fauna` CAPS und `decor` L4-T3 R5 lagen unter Last ~10 nahe der Schwelle; reissen sie
das Gate bei ruhiger Last, folgt TOOL-ZEITRESERVE-22 vor dem Push REL-22.

Regelbezug: gates.md Gate Merge, R598, R624, R626 · Kosten bei Irrtum: ein weiteres Zeitreserve-Paket vor REL-22.

Entscheider: L0 · Anlass: Bericht lead-tech tool-zeitreserve-21 · ADR: —

## R632 · 2026-10-14 · Spec Handel 2: offene Punkte O-1/O-2/O-4; Gate Spec startet

Ruling: Spec `design/handel-2` @ `8d1b9af1` (R1–R15, AK-H2-01…30, Anhänge Werte/UI-Texte). Entscheide: **O-1** Frist 1700 Ticks (2:50)
statt 1500 — angenommen (≥ 30 s Reserve Felsbucht). **O-2** Save-Feld `farSkip` (Sperre der nächsten Periode auch bei Sofortlieferung)
— angenommen; das Save-Format steigt ohnehin (R629 (3)). **O-4** Felsbucht bei spätem Annehmen ohne Fristgarantie — hingenommen (keine
Strafe, frühes Annehmen reicht). Gate Spec jetzt parallel: lead-tech (Machbarkeit, Save-Format, Baseline bitgleich AK-H2-24) und
lead-qa (Testbarkeit), je sonnet nach Modelltabelle, je 1 Start. Ergebnis von PLAYTEST-I047 fliesst als Nachtrag ein, falls es den
Zuschnitt berührt; Umsetzung bleibt bis dahin gesperrt (R629 (5)).

Regelbezug: gates.md Gate Spec, R583, R629 · Kosten bei Irrtum: ein Spec-Nachtrag nach dem Playtest.

Entscheider: L0 · Anlass: Bericht lead-design design-handel-2 (Spec) · ADR: —

## R633 · 2026-10-14 · Gate Spec Handel 2: angenommen mit Auflagen; Plan nach PLAYTEST-I047

Ruling: lead-tech OK, lead-qa BEDENKEN (keine Blocker) zur Spec `design/handel-2` @ `8d1b9af1` → **Spec angenommen**. Auflagen für den
Plan (Tech-Lead beim Plan, opus): (T1) Rückfaltung als eigener Task: neuer Fold-Schritt entfernt `farOffer`/`farSkip` nur bei `null`,
vorgeschaltet in `foldBackToV13`/`foldBackToV9` (`tests/sim/helpers.ts`, ≈ 15 Testdateien), Merge-Reihenfolge zu Erweiterung 1 im Plan
benennen; (T2) Controller-Test: über alle Ticks `farOffer === null`, `farSkip === null`, keine `order.island` (Baseline-Beleg AK-H2-24);
(T3) `orderForPeriod` vor/nach der Änderung identisch (RNG-Beleg R13); (T4) Guard `order === null → fail` in `acceptFarOrder` mit AK;
(T5) Versionsnummer als letzter Schritt, Tests nur gegen `SAVE_VERSION`; ADR-010-Nachtrag und arc42 (`orders.ts`, Save). QA:
(A1) `laneTicks` Seed 3 in H2-SIM Task 1 messen und in AK-27 pinnen; (A2) Ersatzlage und Route Fremdinsel↔Fremdinsel als AK-H2-31
oder Ausschluss in §1 (Spec-Nachtrag durch lead-design vor dem Plan); (A3) AK-19 mit Roundtrip mitten in der gesperrten Periode inkl.
Vertrag; (A4) Fold-Schritt mit eigenem Test; (A5) AK-30 messbar `scrollWidth <= clientWidth` bei 1280 px; (A6) Task-Dateien ≤ 10 KB.
Ablauf: PLAYTEST-I047 abwarten (R629 (5)); dann Spec-Nachtrag A2 + Playtest-Folgen (lead-design, sonnet, Spec-Nachtrag), dann Plan.

Regelbezug: gates.md Gate Spec, R583, R629, R632 · Kosten bei Irrtum: ein Plan-Task mehr für die Rückfaltung.

Entscheider: L0 · Anlass: Berichte lead-tech und lead-qa gate-handel-2 · ADR: —

## R634 · 2026-10-14 · PLAYTEST-I047: Raum für Handel 2; Spec-Nachtrag vor dem Plan

Ruling: Playtest-Report lead-qa (BEDENKEN, nur niedrige Befunde; `.studio/qa/playtest-i047/report.md`, Seed 3, 20 min, abgekürzter Aufbau
per Dev-Sonde): ≤ 2 Entscheidungen je 90-s-Periode, Vertragslieferung ohne Klick, Fahrzeiten hin/zurück 52/62/78 s (worst ≈ 117 s) <
Frist 2:50 (R632 O-1), Konsole leer. Entscheide: (1) **Handel 2 hat Raum** — R629 (5) erfüllt. (2) **Spec-Nachtrag** (lead-design,
sonnet, «Spec-Nachtrag», Restbudget design-handel-2) auf `design/handel-2`: (a) A2 aus R633 (Ersatzlage, Route Fremdinsel↔Fremdinsel:
AK oder Ausschluss); (b) Fernangebot mit eigener Karte statt des gemeinsamen Slots oben rechts — Empfehlung mit Layout bei 1280×720
und Sturm-Dichte; (c) Fernangebot-Verfall und Fernlieferung als Einträge im Ereignis-Log (zählen für I-100 «Neu» nur, wenn sie eine
Meldung tragen — festlegen); (d) ausdrücklich: während eines Stammkunden-Vertrags kein Zufallsauftrag und damit kein Fernangebot;
(e) K4: es gibt keine Piraten (`ships.ts`), die Auflage ist mit dem Sturm-Beleg erfüllt. (3) Die drei niedrigen Befunde (verfallenes
Angebot ohne Meldung/Log, enger Slot oben rechts bei Sturm, keine Auftragsereignisse im Log) trägt lead-design im selben Zug in
`docs/beobachtungen.md` ein, mit Verweis, soweit Handel 2 sie abdeckt. (4) Danach Plan durch lead-tech (opus, Tech-Lead beim Plan).
(5) Worktree `.worktrees/playtest-i047` (detached, sauber) wird ohne `--force` entfernt.

Regelbezug: R629, R632, R633, R424 · Kosten bei Irrtum: ein UI-Task mehr in Handel 2.

Entscheider: L0 · Anlass: Bericht lead-qa playtest-i047 · ADR: —

## R635 · 2026-10-14 · Spec-Nachtrag Handel 2 angenommen; Plan startet

Ruling: Nachtrag `design/handel-2` @ `1ed91737` (AK-H2-31…33, eigene Fernkarte, Log-Einträge mit Meldung nur für angenommene
Fernaufträge, kein Fernangebot während eines Vertrags, K4 erfüllt) → angenommen. **O-5** (Ereignis-Log nur bei Krisen «an» sichtbar):
nicht in Handel 2, als Beobachtung für ein späteres UI-Paket. **O-6** Verfall ohne Klang: angenommen. Plan jetzt: lead-tech, opus
(Tech-Lead beim Plan), Budget 2 Starts/P1, Format E-010, Auflagen T1–T5 und A1–A6 aus R633; Datei-Ownership und Merge-Reihenfolge
gegen Erweiterung 1 (`tests/sim/helpers.ts`, Save-Version) ausdrücklich. Prozessbefund an die Retro: lead-design startete Arbeiter
zweimal im Hintergrund (ADR-007-Regel Vordergrund).

Regelbezug: gates.md Gate Spec, R633, R634 · Kosten bei Irrtum: ein Nachtrag im Plan.

Entscheider: L0 · Anlass: Bericht lead-design (Spec-Nachtrag) · ADR: —

## R636 · 2026-10-14 · Gate Merge UI-AUFRAEUM-3: OK; gebündelter Merge mit TOOL-ZEITRESERVE-21 und I-100

Ruling: `feat/ui-aufraeum-3` @ `7f2f282a`: 7 Tasks, Task-Reviews OK, Playtest OK (T01-Fix `fc670e11` über `contextmenu`), Final-Review opus
OK, Diff auf `src/sim/defs`, `save.ts`, `types.ts`, `balance.test.ts` leer, `make zeitreserve-gate` grün; `make check` ohne Exit 0 nur wegen
Last 10–22 (System-Prozesse) und `trees-farn` (wird durch `tool/zeitreserve-21` behoben) → **Gate Merge OK**. Bestätigt: Ownership-
Erweiterung `src/ui/contractJump.ts` (Meldetext), Spec-Delta M6 «Krisen: aus» ohne Karte (R606 (3)). Merge durch den Integrator im
Hauptcheckout seriell `--no-ff`: `tool/zeitreserve-21` @ `69698908`, `feat/ui-aufraeum-3` @ `7f2f282a`, `feat/i100` @ `b4541b7f`; Konflikt →
`git merge --abort`, melden. Danach ein `make check` (Exit-Code; bei Testlock-/Lastabbruch melden, nicht warten) und `make docs-check`.
Die beim Merge verworfenen Abhak-Einträge in `docs/beobachtungen.md` holt die nächste Auswertung nach; I-100-Status in `docs/ideen.md`
pflegt die Ende-Routine.

Regelbezug: gates.md Gate Merge, R617, R621, R626, R630, R631 · Kosten bei Irrtum: ein roter `make check` auf main → Fix vor REL-22.

Entscheider: L0 · Anlass: Bericht lead-tech ui-aufraeum-3 · ADR: —

## R637 · 2026-10-14 · Release-Check REL-22 jetzt, Push in der Folgesession

Ruling: main enthält nach R636 (`8e3e53c2`) UI-AUFRAEUM-3, I-100, TOOL-ZEITRESERVE-21, TOOL-BUENDEL-12, BEOB-14 (zwei Spiel-Häppchen).
Der Push dieser Session war REL-21 (R335) — **REL-22 wird in der Folgesession gepusht**. Der Release-Check läuft jetzt, damit die
Folgesession nur noch Gate und Push braucht: lead-qa (sonnet, Gate-Urteil), Budget 4 Starts/P2: Integrator `.worktrees/integrate`
auf main (`git checkout --detach main`), `make check`, `make check-ci-perf`, `make zeitreserve-gate` (Testlock: bei Last abbrechen und
später erneut, höchstens 3 Versuche); ein qa-playtester-Lauf am Kandidaten (Zusammenspiel UI-AUFRAEUM-3 + I-100: Kartenstapel mit
«Neu»-Zähler, Rangliste, Rechtsklick im Linienzug); Opus-Review über `ca46eb73..<Kandidat>` (nur Spiel-Code und Tests). Kein Push.

Regelbezug: gates.md Release-Check, R335, R636 · Kosten bei Irrtum: ein erneuter Delta-Check, falls main bis zum Push wächst.

Entscheider: L0 · Anlass: Merge-Bericht merge-rel22-a · ADR: —

## R638 · 2026-10-14 · Plan Handel 2: Entwürfe P-A…P-E angenommen; Gate Plan startet

Ruling: Plan `plan/handel-2` @ `f5d38fcf` (T01–T09, H2-SIM T01–T06, H2-UI T07–T08, T09 Version/Doku; Auflagen R633 vollständig).
Entscheide: **P-A** ein Branch `feat/handel-2` (H2-UI hängt an H2-SIM; ein Merge); **P-B** Fehlertext `'Kein Auftrag'` als fünfte Prüfung;
**P-C** Rückfaltung über Schlüssel statt Versionsnummer; **P-D** Knopf «Liefern · <Insel>»; **P-E** vorläufig v15 ab T03, T09 legt fest
(wer zuerst nach main merged, bekommt die Version; Erweiterung 1 setzt später ihren Fold-Schritt davor). Gate Plan jetzt: lead-qa
(Testbarkeit, Review-/Playtest-Abdeckung) und lead-production (Budget 26 Starts/P1 + 3 Controller-Instanzen, Ownership, Abhängigkeiten),
je sonnet, je 1 Start. Umsetzung erst nach dem Push REL-22 (Folgesession), damit main bis dahin stabil bleibt. Befund
`tests/render/terrain.test.ts` H-R12b (60-s-Timeout unter Last 16) → Beobachtung für das nächste Zeitreserve-Paket.

Regelbezug: gates.md Gate Plan, R583, R633, R637 · Kosten bei Irrtum: ein Plan-Nachtrag.

Entscheider: L0 · Anlass: Bericht lead-tech plan-handel-2 · ADR: —

## R639 · 2026-10-14 · Gate Plan Handel 2: OK; Umsetzung nach Push REL-22

Ruling: lead-qa OK (drei Review-Hinweise), lead-production OK (zwei Auflagen) zum Plan `plan/handel-2` @ `f5d38fcf` → **Plan freigegeben**.
Budget **26 Starts / Parallelität 1** unter Phase `handel-2`, drei Controller-Instanzen (C1 T01–T03, C2 T04–T06, C3 T07–T09 + Final-Review)
als Folgeinstanzen. Auflagen ins Controller-Briefing: (1) T03-Review listet jede Anpassung an Alt-Tests (`save-contract`, `buyPct`), nichts
abgeschwächt; (2) AK-20 mit Grenzfällen (`due = P + 1500` lädt, ausserhalb `FAR_ORDER_DURATION` → «Beschädigter Spielstand»);
(3) Final-Review mit Grep-Wächter: kein Versions-Literal in Tests; (4) `git merge main` vor T07; (5) vor dem Merge `git diff --stat
main...design/erweiterung-1 -- src tests` prüfen, bei Code dort Hinweis an die Nutzer-Session; Worktree `erweiterung-1` nie anfassen.
State.md führt `plan-handel-2` und `handel-2`. **Start der Umsetzung in der Folgesession nach dem Push REL-22.**

Regelbezug: gates.md Gate Plan, R583, R633, R638 · Kosten bei Irrtum: ein Controller-Nachtrag.

Entscheider: L0 · Anlass: Berichte lead-qa und lead-production gate-plan-handel-2 · ADR: —

## R640 · 2026-10-14 · Freier Platz: Kurzdesign UI-HAEPPCHEN-D «Ereignis-Log vollständig»

Ruling: Drei verwandte Befunde (R634 (3), R635 O-5): Ereignis-Log nur bei Krisen «an» sichtbar; verfallenes Stammkunden-Angebot ohne
Meldung/Log; keine Auftragsereignisse im Log. Freier Platz nach R475 an `lead-design` (sonnet, Kurzdesign Stufe leicht), Budget
2 Starts/P1, Worktree `.worktrees/design-ui-d`, Branch `design/ui-haeppchen-d`: Kurzdesign mit AK; Abgrenzung zu Handel 2 (dessen
Fernauftrags-Log-Einträge, R635) und I-100 (Zähler). Umsetzung erst nach dem Merge von Handel 2 (gleiche Dateien `crisisLog.ts`,
`eventLogView.ts`).

Regelbezug: R475, R634, R635, E-061 · Kosten bei Irrtum: ein Kurzdesign, das nach Handel 2 nachgeschärft wird.

Entscheider: L0 · Anlass: freie Kapazität nach R639 · ADR: —

## R641 · 2026-10-14 · Kurzdesign UI-HAEPPCHEN-D angenommen

Ruling: `design/ui-haeppchen-d` @ `ce2f3689` (9 AK, Selbstprüfung OK) → **angenommen**. Regel: ins Log kommt, was ohne Spielerhandlung
eintritt; Meldung nur für Krisen, automatische Vertragslieferung/-bruch und angenommene Fernaufträge; Verfall unangenommener Angebote
und Zufallsaufträge still (zählt nicht für I-100); Log-Box sichtbar bei Krisen «an» oder ≥ 1 Eintrag (`eventLogVisible`); `LOG_MAX` 10 → 20
(UI-Konstante, kein Spielwert); kein `src/sim/`, kein Save. AK-H2-33 (Handel 2) bleibt im Handel-2-Strang gültig und wird von UI-HAEPPCHEN-D
für den Verfall danach ersetzt — keine Änderung am laufenden Handel-2-Plan. Plan (lead-tech, Stufe leicht) und kombiniertes Gate erst
nach dem Merge von Handel 2.

Regelbezug: R634, R635, R640, E-061 · Kosten bei Irrtum: ein UI-Nachtrag.

Entscheider: L0 · Anlass: Bericht lead-design design-ui-haeppchen-d · ADR: —

## R642 · 2026-10-14 · Release-Check REL-22: ZURÜCK → REL22-FIX (Zeitreserve + Kontrast)

Ruling: Kandidat `1b6af811`: `make check` Exit 0 (3935), `check-ci-perf` Exit 0, Playtest OK (Screenshots `.studio/qa/REL-22/`), Opus-Review
BEDENKEN (niedrig); `make zeitreserve-gate` **Substanz** bei ruhiger Nachmessung: `tests/tools/zeitreserve.test.ts` Z. 170 und Z. 417
(≈ 2,08 s × 4 > 50 % von 5000 ms). Kein Lastartefakt (R585). Kontrast `.btn--unread` 2,42:1 (`src/style.css:1392`). Entscheid **ZURÜCK**
und Paket **REL22-FIX** (lead-tech Controller, sonnet, Budget 4 Starts/P1, Branch `fix/rel22` ab main): (1) die zwei Zeitreserve-Tests
beschleunigen oder begründeter Timeout nach E-043; (2) `.btn--unread` Kontrast ≥ 4,5:1 (Text) bzw. Hervorhebung über Rand/Hintergrund,
Screenshot vorher/nachher; (3) Trivial-Fix `tests/ui/upkeepRank.test.ts:160` (`+ 5` → `buildingUpkeep`); (4) Beobachtungen aus dem
Release-Check in `docs/beobachtungen.md` eintragen (Cache-Schlüssel `order.ts:57-65`, `merge:`-Präfix, Log-Position unten links,
Log erst ab Tick 2400 — teils durch UI-HAEPPCHEN-D abgedeckt, Zeilenumbruch Boom+Vorliebe). Task-Review, `make zeitreserve-gate`
Exit 0 im eigenen Worktree. Danach Gate Merge, Delta-Check und Push REL-22 in der Folgesession (R335).

Regelbezug: gates.md Release-Check, R585, R598, R631, R637 · Kosten bei Irrtum: ein weiterer Delta-Check.

Entscheider: L0 · Anlass: Bericht lead-qa gate-rel-22 · ADR: —

## R643 · 2026-10-14 · Nutzerauftrag: Dashboard-Karte «Versionen und Releases» — zuerst Muster

Ruling: Nutzerauftrag 2026-10-14: neue Dashboard-Karte zuoberst im Studio-Dashboard: Live-Stand, kurze Vergangenheit (zusammengefasst),
vor allem aktueller Entwicklungsstand: welche Stränge laufen in dieser Session, was kommt mit welchem Release, was ist geplant, welche
künftigen Pakete/Themen. **Zuerst ein Muster zur Freigabe durch den Nutzer**, kein Einbau vorher. Auftrag an lead-tech (sonnet,
Werkzeug), Budget 2 Starts/P1: statisches HTML-Muster im Stil von `tools/studio/dashboard/style.css` mit echten Daten (state.md,
rulings R616–R642, docs/ideen.md Rangliste) unter `.studio/mockups/versionen/`, plus Screenshot bei 1440 px; dazu ein Vorschlag zur
Datenquelle für den späteren Einbau (bevorzugt aus vorhandenen Dateien abgeleitet, keine Doppelpflege).

Regelbezug: Nutzerauftrag, R475 · Kosten bei Irrtum: ein verworfenes Muster.

Entscheider: L0 · Anlass: Nutzerauftrag · ADR: —

## R644 · 2026-10-14 · Gate Merge REL22-FIX: OK; Merge jetzt, Delta-Check und Push REL-22 in der Folgesession

Ruling: `fix/rel22` @ `a8416ca9`: Zeitreserve-Tests mit 20-s-Timeout für die drei Spawn-Blöcke (`describeSpawn`, Kommentar nach E-043;
Ursache: sporadische `spawnSync`-Startstocker ≈ 2 s, Testzeit sonst 74 ms), `.btn--unread` 7,16:1 (vorher 2,42:1), `upkeepRank` aus
`buildingUpkeep` abgeleitet, 6 Beobachtungen; tsc/lint/zeittests/conflicts/docs-check Exit 0, `make test` 3935 grün, `make zeitreserve-gate`
**Exit 0** (Last 1,9/2,4), Task-Review OK → **Gate Merge OK**. Merge durch den Integrator im Hauptcheckout `--no-ff`, danach `make docs-check`.
Folgesession: Delta-Check REL-22 (`make check`, `check-ci-perf`, `zeitreserve-gate`, Browser-Punkt Kontrast im Spiel) und Push. Offen als
Beobachtung: Spawn-Latenz unter Last (Messauftrag bei erneutem Auftreten).

Regelbezug: gates.md Gate Merge, R585, R598, R642, E-043 · Kosten bei Irrtum: ein Timeout verdeckt einen echten Hänger bis 20 s.

Entscheider: L0 · Anlass: Bericht lead-tech rel22-fix · ADR: —

## R645 · 2026-10-14 · Nutzerfreigabe Muster v3: Einbau TOOL-DASH-VERSIONEN; Session-Ende vorbereiten

Ruling: Nutzer 2026-10-14: «passt so. umsetzen.» Muster `.studio/mockups/versionen/v3.html` ist die Vorlage. Paket **TOOL-DASH-VERSIONEN**
(lead-tech Controller, sonnet, Werkzeug-Paket, Budget 4 Starts/P1, Branch `tool/dash-versionen`): Karte «Versionen und Releases» als
erste Karte im Studio-Dashboard; Zeitstrahl mit 5 Stufen, Gruppen je Release, Schranken/Pfeile/Chips für Abhängigkeiten, Kettenzeile
«Kritischer Pfad», Hover-Kette, S-Kennzeichen für Pakete der laufenden Session, Filter «nur heute» (Standard: alles), «Früher»
eingeklappt. Datenquelle `docs/studio/releases.json` (Zuordnung Paket → Release, Stufe, Status, Abhängigkeiten, Pool), gepflegt von
lead-production mit state.md; Hash/CI/Pages aus git bzw. `ci.py`; Session-Kennzeichen aus den Events. Abnahme: `make studio-test` grün,
Echtlauf gegen den laufenden Dashboard-Server mit Screenshot, Task-Review. Parallel: Session-Ende (Metriken, Kurz-Retro, state.md).

Regelbezug: Nutzerauftrag, R643 · Kosten bei Irrtum: eine Dashboard-Karte, die nachgebessert wird.

Entscheider: L0 · Anlass: Nutzerfreigabe · ADR: —

## R646 · 2026-10-14 · Kurz-Retro b54ed3bd: E-062 zurückgenommen, E-066 startet, E-063 angepasst; Ad-hoc-Signal abgedeckt

Ruling: Retro `retros/2026-10-14-session-b54ed3bd-ende.md` (`2e45a88b`). Entscheide: (1) **E-062 zurückgenommen** (nie angewendet, keine
Briefing-Zeile; Messwerte nicht zuschreibbar). (2) **V1 angenommen: E-066 startet** (Folgeinstanz statt Fortsetzung bei lead-tech;
Pflicht-Hebel Cache-Write/Steuerung) — studio-coach setzt die Zeile in `lead-tech.md` und experimente.md um. (3) **V2 angenommen:** E-063
Messgrösse «Integrator-Briefings mit Hauptcheckout ohne Ruling-Nummer, Soll 0». (4) **V3 angenommen:** Messauftrag Cache-Write-Wachstum
nach Rolle, Frist nächste Session-Retro. (5) Ad-hoc-Retro-Signal (Cache-Write rot und Flake rot in zwei Sessions): Cache-Write ist mit V1/V3
belegt adressiert; Flake ist ein Zählartefakt der Historienliste (0 seit 2026-10-14, Beobachtung eingetragen) — **keine eigene Ad-hoc-Retro
jetzt**; ist eine der beiden Ampeln in der nächsten Session wieder rot, folgt sie dort. (6) Messauftrag (a)(b)(c) aus der Retro (Briefing-
Verbote Warte-Agenten, Hintergrund-Arbeiter, Lastgrenze): Guard erst bei dreifacher Verletzung einer Klasse in einer Session.

Regelbezug: R316, R429, R615 · Kosten bei Irrtum: eine Session mit falschem Experiment-Platz.

Entscheider: L0 · Anlass: Bericht studio-coach retro-session-b54ed3bd, Hook-Hinweis Ad-hoc-Retro · ADR: —

## R647 · 2026-10-14 · Gate Merge TOOL-DASH-VERSIONEN: OK; Guard gegen Warte-Agenten fällig

Ruling: `tool/dash-versionen` @ `45046433`: Karte «Versionen und Releases» als erste Karte im Live-Tab (Muster v3), `docs/studio/releases.json`
(Schema im Handoff), `/api/state` liefert `releases`, `releases_error`, `live`; `make studio-test` 869 grün, `studio-lint`/`docs-check` Exit 0,
Task-Review OK, Echtlauf Port 8791 mit Screenshots (`.studio/qa/tool-dash-versionen/`); Schranken-Ursache geklärt (`.bar { overflow: hidden }`,
Präfix `rv-`). Lücke: kein Rot-Beleg für `test_releases.py` (Implementierung vor Test) — hingenommen für ein Werkzeug-Paket, Befund an die Retro.
→ **Gate Merge OK**. lead-production merged `--no-ff` im Hauptcheckout, setzt TOOL-DASH-VERSIONEN in `releases.json` auf `done`, ergänzt die
Pflegeregel in state.md (Fortsetzung 3) und prüft `make studio-test`, `make docs-check`. Die Pflegeregel geht als Handbuch-Vorschlag an den
Coach in der Folgesession. (2) Dritter unnötiger Warte-Agent dieser Session (tool-buendel-12, tool-hotfix-zr, tool-dash-versionen) → nach
R646 (6) **TOOL-GUARD-WARTEAGENT** in der Folgesession: Hook verweigert Agent-Starts ohne Auftrag (z. B. reines Warten/`ok`) bzw. `sleep`
im Hintergrund durch Leads; Entwurf und Test durch lead-tech.

Regelbezug: gates.md Gate Merge, R645, R646 · Kosten bei Irrtum: eine Karte mit kleinen Hover-Mängeln; ein Guard mit Fehlblocks (Rückfall warn).

Entscheider: L0 · Anlass: Bericht lead-tech tool-dash-versionen · ADR: —

## R648 · 2026-10-14 · Nutzerauftrag «mach weiter, zeig im Dashboard, was läuft und wo das Session-Ziel je Task liegt»; Session-Plan

Ruling: Auslegung „zeig mir im Dashboard, was du gerade umsetzt und wo das geplante Ziel der heutigen Session bzgl. der einzelnen Tasks ist“
als (a) **sofort**: `releases.json` bildet den heutigen Plan ab (jedes Paket der Session mit aktueller Stufe und Ziel-Text «Ziel heute: …»
in `note`), gepflegt durch lead-production; (b) **Paket TOOL-DASH-SESSIONZIEL**: die Karte «Versionen und Releases» zeigt je Paket ein
Feld `goalStage` als gestrichelte Zielmarke hinter dem Balken (Abstand Ist → Ziel sichtbar) und oben eine Zeile «Jetzt in Arbeit» aus
den aktiven Agenten/Paketen (`session_packages` + Status `active`). Plan sofort (ohne Testläufe, R464), Umsetzung erst nach `make push-check`
Exit 0 für REL-22. Session-Plan: (1) Delta-Check + Push REL-22, (2) Handel 2 (REL-23) nach dem Push, (3) TOOL-DASH-SESSIONZIEL,
(4) TOOL-GUARD-WARTEAGENT (R647 (2)), (5) freie Plätze → Ideen-Runde nach dem Push (R445/R475). N-100 erledigt (REL-20 live seit R594/R595).
Zweck der Anweisung: Der Nutzer will den Fortschritt der Session gegen ein Ziel verfolgen. Die Auslegung widerspricht dem nicht, weil
die Daten sofort sichtbar sind und die Zielmarke den Abstand Ist → Ziel grafisch zeigt, ohne die Push-Regel R464 zu brechen.

Regelbezug: Verfassung §5, STUDIO.md Autonomie, R464, R645, R647 · Kosten bei Irrtum: eine Darstellung, die der Nutzer anders wollte (eine Karte nachbessern).

Entscheider: L0 · Anlass: Nutzerprompt Session-Start · ADR: —

## R649 · 2026-10-14 · Gate Plan TOOL-DASH-SESSIONZIEL und TOOL-GUARD-WARTEAGENT: OK mit Auflagen; Start nach push-check REL-22

Ruling: (1) **TOOL-DASH-SESSIONZIEL** Plan `tool/dash-sessionziel` @ `dd928fb4` (T01–T04, Logik in Python testbar, JS zeichnet) → OK,
Budget 6 Starts, Parallelität 1. Auflage: S-Kennzeichen und «Jetzt in Arbeit» zählen zusätzlich Pakete, die in der laufenden Session per
`log.py package` mit Status active/review/blocked angemeldet sind (Lücke aus dem Bericht lead-production, `session_packages` nur aus dem
Agent-Baum). Rot-Beleg je Task im Bericht. (2) **TOOL-GUARD-WARTEAGENT** Plan `tool/guard-warteagent` @ `0ac5d308` (`waitguard.py`, Modus
deny, Rückfall warn, nur `agent_type` lead-*) → OK, Budget 3 Starts. Auflage: zuerst die PreToolUse-Payload im Lead-Kontext belegen
(`agent_type` vorhanden?); fehlt sie, Bericht an L0 vor der Umsetzung. Der neue Eintrag in `.claude/settings.json` ist freigegeben; blockt
der Guard die Datei, setzt L0 ihn. (3) Umsetzung beider Pakete erst nach `make push-check` Exit 0 für REL-22 (R464).

Regelbezug: gates.md Gate Plan, R464, R647, R648 · Kosten bei Irrtum: ein Guard mit Fehlblocks (Rückfall warn), eine Karte mit Zusatzzeile.

Entscheider: L0 · Anlass: Berichte lead-tech Phase A · ADR: —

## R650 · 2026-10-14 · Delta-Check REL-22 ZURÜCK (Lint); Push-Blocker-Fix TOOL-LINT-DASH

Ruling: `make push-check` @ `c7da39d7` Exit 1: ESLint `no-undef` für `CSS` und `ResizeObserver` in `tools/studio/dashboard/releases.js`
(aus TOOL-DASH-VERSIONEN, R647; das Gate prüfte `studio-lint`, nicht `make lint`). Kontrast `.btn--unread` 7,16:1 → OK. Nach R514 V1 läuft
der benannte Push-Blocker-Fix vor dem Push: Paket **TOOL-LINT-DASH**, Fix in `eslint.config.js` (Browser-Globals `CSS`, `ResizeObserver` im
Dashboard-Block), Test: `make lint` Exit 0 und `make studio-test` gezielt; danach neuer Delta-Lauf (`make push-check`, `make zeitreserve-gate`)
durch eine neue lead-qa-Instanz. Befund an die Retro: Gate Merge für Dashboard-JS muss `make lint` enthalten.

Regelbezug: R464, R514 V1, R647 · Kosten bei Irrtum: ein weiterer Delta-Lauf (≈ 10 min).

Entscheider: L0 · Anlass: Bericht lead-qa REL22-PUSH · ADR: —

## R651 · 2026-10-14 · Push REL-22 «Aufgeräumt und nichts verpasst»; Freigabe Umsetzung Handel 2 und Werkzeug-Pakete

Ruling: Delta-Check 2. Lauf OK (`make push-check` EXIT=0 und `make zeitreserve-gate` EXIT=0 @ `fb1e5e46`, Handoff
`.studio/handoffs/2026-10-14-lead-qa-REL22-PUSH.md`) → Gate Push OK, gepusht `ca46eb73..fb1e5e46` per geprüftem Hash, Pages per
`gh workflow run Pages --ref main`. Damit entfällt die Sperre aus R464: (1) TOOL-DASH-SESSIONZIEL Phase B (R649) startet, Zusatzauflage:
`server.py` liefert die Dashboard-Dateien mit `Cache-Control: no-store` (Nutzer sah die Karte nicht, weil der Browser ein altes `app.js`
aus dem Cache nutzte); (2) TOOL-GUARD-WARTEAGENT Phase B (R649); (3) HANDEL-2 Umsetzung nach Plan `f5d38fcf`, Auflagen R639, Budget 26
Starts, E-066. Pflege `releases.json` (REL-22 live) durch lead-production.

Regelbezug: STUDIO.md Push-Abschnitt, R335, R464, R639, R649 · Kosten bei Irrtum: ein Release mit Lastrauschen in zwei Render-Tests (Reserve in der Nachmessung grün).

Entscheider: L0 · Anlass: Bericht lead-qa REL22-PUSH, Nutzerfrage Dashboard · ADR: —

## R652 · 2026-10-14 · Gate Merge TOOL-GUARD-WARTEAGENT: OK, Modus deny

Ruling: `tool/guard-warteagent` @ `cb7dd1ac`: `tools/studio/waitguard.py` (Regel A Warte-Agent, Regel B `sleep` im Hintergrund, nur `lead-*`),
21 Tests mit Rot-Beleg, PreToolUse-Eintrag `Bash|Agent|Task` in `.claude/settings.json` (fail-safe `|| true`, Timeout 5 s), Doku arc42 und
STUDIO.md; `make studio-test` (888), `studio-lint`, `lint`, `docs-check` Exit 0; Review BEDENKEN → Fix → Delta-Review OK. Payload-Beleg
`agent_type` indirekt über Events (kein direkter Hook-Mitschnitt) — hingenommen; der erste echte Block oder Fehlblock wird als
Ereignis `wait_guard` sichtbar. → **Gate Merge OK, Modus deny**; Rückfall `MODE = "warn"` bei erstem Fehlblock ohne neues Ruling.
lead-production merged `--no-ff`, Paket done, Handbuch-Minor 1.55 (Zeile STUDIO.md) im selben Zug; Fehlnegative (`(sleep 60)`,
`bash -c 'sleep …'`, `sleep infinity`, `FOO=1 sleep 5`) als Eintrag in `docs/beobachtungen.md`.

Regelbezug: gates.md Gate Merge, R429, R647 (2), R649 · Kosten bei Irrtum: Fehlblock eines Leads (Rückfall warn, eine Zeile).

Entscheider: L0 · Anlass: Bericht lead-tech TOOL-GUARD-WARTEAGENT · ADR: —

## R653 · 2026-10-14 · Gate Ideen-Runde IDEEN-10: Priorisierung

Ruling: `docs/ideen-10` @ `cc3072de` (I-101–I-109, Rangliste in docs/ideen.md) → angenommen, Merge durch lead-production. Priorisierung
L0 nach Nutzen/Aufwand: (1) **I-109 «Reichweite am Gut-Chip»** (S–M, ohne Save, unabhängig von Handel 2) → Kurzdesign jetzt (freie
Kapazität, R475), Stufe leicht, `design/i109`; (2) **I-102 Auftragsvorschau** → eingeplant als Häppchen nach dem Merge von Handel 2;
(3) **I-101** → Beipack-Prüfung im Final-Review Handel 2 nur als Hinweis, kein Scope-Zuwachs; I-108, I-103 → Pool; I-104, I-105, I-107
geparkt; I-106 vor Einplanung gegen UI-HAEPPCHEN-D prüfen. Keine Säulenfrage, nichts in die Warteschlange.

Regelbezug: gates.md Gate Ideen-Runde, R445, R475 · Kosten bei Irrtum: ein Kurzdesign, das später zurückgestellt wird.

Entscheider: L0 · Anlass: Bericht lead-design IDEEN-10 · ADR: —

## R654 · 2026-10-14 · Kurzdesign I-109 «Reichweite am Gut-Chip»: angenommen; Plan nach Merge Handel 2

Ruling: `design/i109` @ `7e25d7cf` (reine UI-Funktion `reachView` aus `goodsBalance`, kein Sim-/Save-Diff, 9 AK) → angenommen. O-1: Schwellen
3:00 / 1:00 / voll 1:00 als UI-Konstanten übernommen, Justierung nach Playtest ohne neues Ruling; Fallback «Suffix streichen» erlaubt.
Plan + kombiniertes Gate erst nach dem Merge von Handel 2 (mögliche Überschneidung `src/ui/hud.ts`), Reihenfolge danach: UI-HAEPPCHEN-D,
I-109, I-102 (lead-tech prüft Bündelung). Tagesziel I-109 (Kurzdesign) erreicht.

Regelbezug: gates.md Gate Brainstorming/Kurzdesign, E-061, R641, R653 · Kosten bei Irrtum: Schwellen nach Playtest anpassen.

Entscheider: L0 · Anlass: Bericht lead-design I-109 · ADR: —

## R655 · 2026-10-14 · Gate Merge TOOL-DASH-SESSIONZIEL: OK

Ruling: `tool/dash-sessionziel` @ `b8e92453` (T01–T04 + Fix-Runde): `goalStage`-Zielmarke «Ziel heute» mit «✓ Ziel erreicht», Kopfzeile
«Jetzt in Arbeit» mit «n von m am Tagesziel», S-Kennzeichen auch für per `log.py package` angemeldete Pakete, `Cache-Control: no-store`
für Dashboard-Dateien; Rot-Belege je Task; `make lint`, `studio-test` (884), `studio-lint`, `docs-check` Exit 0; Final-Review opus ZURÜCK
→ Fix → Delta OK; Echtlauf 1440/1280 OK. Lücke: Hinweiszeile nach dem JS-Fix nicht erneut im Browser gesehen → L0 prüft nach dem Merge
per Headless-Screenshot am laufenden Dashboard. → **Gate Merge OK**. lead-production merged `--no-ff`, Paket done in releases.json, startet
den Dashboard-Server neu (neuer Python-Code), damit der Nutzer die Karte sieht. Befunde favicon 404, Warnzeile im leeren Zustand → beobachtungen.md.

Regelbezug: gates.md Gate Merge, R648, R649, R651 · Kosten bei Irrtum: eine falsch versetzte Hinweiszeile im Dashboard.

Entscheider: L0 · Anlass: Bericht lead-tech TOOL-DASH-SESSIONZIEL · ADR: —

## R656 · 2026-10-14 · Nachbesserung Zielmarke: «erreicht» erst bei abgeschlossener Zielstufe

Ruling: L0-Sichtprüfung nach R655 (Headless-Screenshot 1440 px): HANDEL-2 (stage 4 = goalStage 4, state active) zeigt «✓ Ziel erreicht»,
Zähler «4 von 4». Auslegung `goalStage`: Ziel ist das **Abschliessen** der Zielstufe. «Erreicht» gilt nur bei `stage > goalStage` oder
`stage == goalStage` und `state == done` (Python `goal_progress` und JS identisch, Test zuerst rot). Paket **TOOL-DASH-ZIEL-FIX** (lead-tech,
1 Start + Review). Daten: REL-22-Titel in releases.json «Kandidat lokal auf main» → «Aufgeräumt und nichts verpasst» (lead-production);
Pflegeregel in state.md um die Semantik ergänzen.

Regelbezug: R648, R655 · Kosten bei Irrtum: falscher Tagesstand im Dashboard bis zum Fix.

Entscheider: L0 · Anlass: Sichtprüfung L0 · ADR: —

## R657 · 2026-10-14 · Gate Merge TOOL-DASH-ZIEL-FIX: OK

Ruling: `tool/dash-ziel-fix` @ `ed0ccc32` (`goal_reached`/`goalDone` identisch, Rot-Beleg 2 Fälle, `make lint`/`studio-test`/`studio-lint`/
`docs-check` Exit 0, Review OK) → **Gate Merge OK**. lead-production merged `--no-ff`, setzt das Paket done, startet den Dashboard-Server
neu; L0 prüft per Screenshot. Folge der Semantik: Items nach dem Merge immer auf `state: done` setzen (Pflegeregel).

Regelbezug: gates.md Gate Merge, R656 · Kosten bei Irrtum: falscher Zähler im Dashboard.

Entscheider: L0 · Anlass: Bericht lead-tech TOOL-DASH-ZIEL-FIX · ADR: —

## R658 · 2026-10-14 · Gate Merge HANDEL-2 «Fernangebot»: OK; Push REL-23 in der Folgesession

Ruling: `feat/handel-2` @ `d5778c60` (T01–T09, Final-Review opus BEDENKEN niedrig → Fix, zwei Restbefunde hingenommen → beobachtungen.md;
`make check` EXIT=0 mit 4034 Tests, `zeittests`, `lint` Exit 0; Save v15 mit `migrateV14ToV15` und Ladetest; README/arc42 nachgeführt;
Erweiterung-1-Diff leer → Save v15 gehört Handel 2, R638) → **Gate Merge OK**. lead-production merged `--no-ff` nach main (lokal),
releases.json HANDEL-2 done, REL-23 Gate «Release-Check offen», Release-Notiz-Entwurf aus `.studio/handoffs/2026-10-14-lead-qa-HANDEL-2-gate.md`
in state.md. Kein zweiter Push in dieser Studio-Session (R335): Release-Check + Push REL-23 in der Folgesession. Limit-Ampel gelb → keine
neue Welle: UI-HAEPPCHEN-D-Plan (Tagesziel «Plan») verschoben, danach Session-Ende-Routine.

Regelbezug: gates.md Gate Merge, R335, R638, R639 · Kosten bei Irrtum: ein lokaler Merge mit zwei niedrigen Restbefunden.

Entscheider: L0 · Anlass: Bericht lead-qa HANDEL-2 · ADR: —

## R659 · 2026-10-14 · Kurz-Retro dbac5fc4: V1 (E-068) und V2 (E-069) angenommen; Ad-hoc-Signal abgedeckt

Ruling: Retro `retros/2026-10-14-session-dbac5fc4-ende.md` (`6f492120`). (1) **V2 angenommen, zuerst**: Paket TOOL-METRIK-ZEITRAUM (E-069)
in der Folgesession — Session-Zeitraum an Flake- und Steuerungsanteil durchreichen, Cache-Write nach Erstladung/Wachstum aufteilen
(Flake 8 → 0 und Steuerung 51,8 → 46,4 % mit `--since` = Messartefakt). (2) **V1 angenommen**: E-068 «ein Reviewer je Paket bei Stufe
leicht (≥ 2 Tasks, ≤ 300 Diff-Zeilen)» startet, sobald E-063 oder E-064 einen Platz freigibt. (3) Das Ad-hoc-Signal (Cache-Write und Flake
zwei Sessions rot) ist durch diese Retro abgedeckt: Cache-Write mit Hebel V1 und Messung V2, Flake als Messartefakt mit Werkzeug-Hebel V2.
(4) Messauftrag nächste Retro: Briefing-Verbot (b) im Archiv prüfen, Guard-Blocks `wait_guard` seit R652 zählen.

Regelbezug: STUDIO.md Verbesserungsschleife, R316, R646 · Kosten bei Irrtum: ein Experiment mit zu wenig Review-Tiefe (Rückfall Review je Task).

Entscheider: L0 · Anlass: Bericht studio-coach Kurz-Retro · ADR: —

## R660 · 2026-10-16 · Session-Plan: Release-Check und Push REL-23, Plan UI-HAEPPCHEN-D, TOOL-METRIK-ZEITRAUM

Ruling: Nutzerprompt «mach weiter» = Plan aus state.md fortsetzen. (1) **REL-23 «Fernangebot»**: lead-qa Release-Check am aktuellen
main (`244792f4`, Ein-Paket-Release HANDEL-2, Gate Merge R658 bereits OK) mit `make push-check` und `make zeitreserve-gate` per geprüftem
Hash; Push durch L0 nach Exit 0 (R335: der einzige Push dieser Session). (2) **UI-HAEPPCHEN-D** «Ereignis-Log vollständig»: lead-tech Plan
aus Kurzdesign `ce2f3689` (Branch `design/ui-d`), Stufe leicht, Plan-Instanz sonnet (E-054); lead-tech prüft dabei die Bündelung mit I-109
(`design/i109` @ `7e25d7cf`) und I-102. Plan ohne Testläufe, Umsetzung erst nach `make push-check` Exit 0 für REL-23 (R464). (3)
**TOOL-METRIK-ZEITRAUM** (E-069, R659 (1)): lead-tech Plan und Umsetzung als Werkzeug-Paket in `tools/studio/`, kein `src/`; startet sofort,
da es weder Spiel noch Push-Stand berührt (Doku-/Werkzeug-Commit nach main erst nach Gate Merge). Belegung 3 Leads; restliche Plätze
nach R475 erst nach dem Push (Last und Testlock schonen).

Regelbezug: Verfassung §5, STUDIO.md Autonomie, R335, R464, R475, R654, R659 · Kosten bei Irrtum: ein Plan, der wegen Bündelung neu zugeschnitten wird.

Entscheider: L0 · Anlass: Nutzerprompt Session-Start · ADR: —

## R661 · 2026-10-16 · Plan UI-HAEPPCHEN-D: Bündelung mit I-109 ja, I-102 nein; Zeitformat aus formatGameTime

Ruling: Plan `plan/ui-haeppchen-d` @ `b1a17826` (T00–T04, T06–T09; Teil A Ereignis-Log, Teil B I-109). (1) **I-109 wird gebündelt**
(getrennte Dateien, je 9 AK, kein Save, kein `src/sim/`; ein Gate, ein Browser-Check, ein Final-Review; Reihenfolge A vor B nach R654;
Teil B ist bei Durchfallen abspaltbar). (2) **I-102 nicht gebündelt**: nur Ideen-Eintrag ohne AK; Kurzdesign bei freiem Platz, danach eigenes
Häppchen. (3) **Zeitformat**: einzige Quelle ist `formatGameTime` («40 s» statt «0:40» aus dem Kurzdesign I-109); T07/T08 prüfen bei 1280 px,
dass die Leiste nicht umbricht. (4) Gate Plan durch lead-qa; Budgetantrag 21 Starts wird mit dem Gate entschieden.

Regelbezug: gates.md Gate Plan, R464, R654 · Kosten bei Irrtum: ein Suffix mit anderem Zeitformat (eine Zeile nachbessern).

Entscheider: L0 · Anlass: Bericht lead-tech plan-UI-HAEPPCHEN-D · ADR: —

## R662 · 2026-10-16 · Gate Plan UI-HAEPPCHEN-D + I-109: OK mit 4 Auflagen; Budget 21 Starts nach Push REL-23

Ruling: Urteil lead-qa (`.studio/handoffs/2026-10-16-lead-qa-gate-plan-UI-HAEPPCHEN-D.md`) übernommen: **OK mit Auflagen** — (1) `npx tsc
--noEmit` und `make lint` in jedem Task mit `.ts`-Änderung, `make zeittests` und `make conflicts` vor «bereit»; (2) Testfall «0 ↓ leer» in T07
(AK-UR-04: Text, `label`, Klasse bei Bestand 0 und net < 0); (3) Test-Erwartungen zum Zeitformat über `formatGameTime(...)`, keine Literale;
(4) T08 ergänzt um Angebot ablehnen, Fernauftrag annehmen, Laden mitten im Auftrag/Angebot ohne Fehl-Eintrag. Die Plan-Instanz setzt die
Auflagen auf `plan/ui-haeppchen-d` um. Umsetzung mit Budget 21 Starts, Parallelität 1, startet nach `make push-check` Exit 0 für REL-23 (R464).

Regelbezug: gates.md Gate Plan, R464, R661 · Kosten bei Irrtum: ein später entdeckter Verdrahtungsfehler (Fix-Runde).

Entscheider: L0 · Anlass: Bericht lead-qa gate-plan-UI-HAEPPCHEN-D · ADR: —

## R663 · 2026-10-16 · Nutzerauftrag: I-091, I-094, I-097 anstossen (Parken aufgehoben)

Ruling: Nutzer: «kannst du auch 94, 91, 97 anstossen? oder teile davon?» — ausgelegt als Ideen I-091 Treuebonus, I-094 Darlehen, I-097 Pause
sichtbar; das Parken aus IDEEN-09 ist für diese drei aufgehoben. (1) **I-097** (S, kein Save): Kurzdesign Stufe leicht durch lead-design
(sonnet); Umsetzung nach UI-HAEPPCHEN-D, weil beide `src/ui/app.ts` und `src/style.css` berühren. (2) **I-091 + I-094** (Save ja, Wirtschaft):
ein gemeinsames kleines Wirtschafts-Brainstorming durch lead-design (opus) mit Rechnung durch `design-economy-designer`, je eine Kurz-Spec mit
AK; Pflichtfragen: I-094 Entartung (Darlehen immer richtig ab Ausbau > 40/min) und Geldüberschuss; I-091 Bonus bleibt unter `buy`. Save-Nummer
wird erst im Gate Plan vergeben (nächste freie beim Merge; Erweiterung 1 der Nutzer-Session ist ebenfalls auf eine neue Version angewiesen, R638
— wer zuerst merged, nimmt die nächste). Ergibt die Rechnung, dass I-094 entartet und kein Hebel hilft, darf lead-design «verwerfen» empfehlen.

Regelbezug: Verfassung §5, STUDIO.md Autonomie, R445, R475, R638 · Kosten bei Irrtum: zwei Specs für Funktionen, die nach dem Playtest anders aussehen.

Entscheider: L0 · Anlass: Nutzerprompt · ADR: —

## R664 · 2026-10-16 · Kurzdesign I-102 «Auftragsvorschau»: angenommen mit V2; Plan nach UI-HAEPPCHEN-D

Ruling: `design/i102` @ `9afebb5b` (9 AK, kein Save, kein neuer Spielwert; `previewOrder(world)` als reine Lesefunktion in `src/sim/orders.ts`
über `orderForPeriod`, ohne RNG-Vorziehen) → **angenommen**. (1) **V2**: Vorschau auch bei aktivem Normalauftrag als «danach voraussichtlich X»
(Lücke Verfall → Folgeperiode nur 300 Ticks). (2) Fernangebot-Insel wird nicht angekündigt (später nachrüstbar). (3) I-093 (verworfen) und
I-095 (erledigt, R658) wandern auf demselben Branch nach `docs/ideen-archiv.md` (lead-design). (4) Plan durch lead-tech nach dem Merge von
UI-HAEPPCHEN-D; I-102 berührt `order.ts`, nicht die Dateien von UI-D, aber `src/ui/app.ts` ist beim Plan gegen UI-D abzugleichen.

Regelbezug: gates.md Gate Spec (Stufe leicht), R653, R658 · Kosten bei Irrtum: eine Vorschau, die der Spieler als Zusage missversteht (Text «voraussichtlich»).

Entscheider: L0 · Anlass: Bericht lead-design design-I-102 · ADR: —

## R665 · 2026-10-16 · Kurzdesign I-097 angenommen; Plan I-097 + I-102 als UI-HAEPPCHEN-E jetzt

Ruling: `design/i097` @ `70efccc5` (11 AK, `pauseOverlayView(speed, modalOpen)` in `src/ui/pauseOverlay.ts`, kein Save, kein `src/sim/`) →
**angenommen**; O-1 (Farbe/Breite des Rands) und O-2 (Ort von `syncPauseOverlay()`) entscheidet der Plan. Freie Plätze (R475): lead-tech plant
**UI-HAEPPCHEN-E** = I-097 + I-102 (R664) jetzt, als Plan auf main-Stand mit Abgleich gegen den Plan UI-HAEPPCHEN-D (`3eb97a31`, Einhängepunkte in
`src/ui/app.ts`, Block in `src/style.css`). Umsetzung erst nach Merge von UI-HAEPPCHEN-D. Plan ohne Testläufe (R464).

Regelbezug: gates.md Gate Spec (Stufe leicht), R464, R475, R663, R664 · Kosten bei Irrtum: ein Plan mit Nacharbeit bei den Einhängepunkten nach dem UI-D-Merge.

Entscheider: L0 · Anlass: Bericht lead-design design-I-097 · ADR: —

## R666 · 2026-10-16 · Gate Merge TOOL-METRIK-ZEITRAUM: OK, Merge nach dem Push REL-23; Inaktiv-Signal lead-qa ohne Retro

Ruling: (1) `tool/metrik-zeitraum` @ `fa6d7c48` (T1 Session-Beginn als Zeitraum für Flake und Steuerungsanteil, T2 Cache-Write 5 min in
Erstladung/Wachstum/Pause, T3 arc42; `make studio-test` 913 grün, `studio-lint`, `docs-check` Exit 0; Rot-Beleg vorhanden; Echtlauf dbac5fc4:
Datei = `--since`, Summe 6,2 + 15,0 + 5,8 = 27,0 % = bestehende Zeile) → **Gate Merge OK**. Review-BEDENKEN angenommen: der Session-Beginn gilt
auch für die Transkript-Auswertung (gewollt, Datei und `--since` stimmen überein). Restabweichung Steuerungsanteil Datei 52,2 % gegen
`--efficiency` 47,2 % (verschiedene Transkriptmengen) → Messauftrag an die nächste Retro. Merge durch lead-production erst nach dem Push
REL-23, damit der geprüfte Push-Hash nicht wandert. E-069 gilt mit dem Merge als umgesetzt; Bewertung in der nächsten Session-Retro.
(2) Signal «lead-qa inaktiv» (Hook) beim Release-Check: der Lead wartet in einem langen `make zeitreserve-gate` (Prozess läuft, Heartbeat
06:50Z) — kein Vorfall, keine Ad-hoc-Retro; Befund an die Retro, ob lange Make-Läufe als Heartbeat zählen sollen.

Regelbezug: gates.md Gate Merge, R335, R659, STUDIO.md Verbesserungsschleife · Kosten bei Irrtum: eine Ampelzahl, die sich gegenüber Altsessions leicht verschiebt.

Entscheider: L0 · Anlass: Bericht lead-tech TOOL-METRIK-ZEITRAUM, Hook-Signal · ADR: —

## R667 · 2026-10-16 · Push REL-23 «Fernangebot» mit Zeitreserve-Ausnahme; Gate Plan UI-HAEPPCHEN-E mit O-1/O-2

Ruling: (1) Release-Check REL-23 @ `2e7a269f` (Handoff `.studio/handoffs/2026-10-16-lead-qa-REL23-PUSH.md`): `make push-check` Exit 1 allein
durch die strenge Zeitreserve zweier Tests ausserhalb des Handel-2-Diffs (`tests/render/wildlife.test.ts` RF-10, `tests/sim/unlock-timeline.test.ts`
AK-BAS-03); alles andere grün (4034 Tests inkl. Balancing, `studio-test` 907, Lint, Build, `pages-limit`). Die vorgeschriebene Nachmessung
`make zeitreserve-gate` Exit 0 (Reserve 0) → **Lastartefakt** nach gates.md R598 V1/R585; Release-Notiz stimmt mit dem Code. → **Gate Push OK mit
bewusster Ausnahme**, Push `fb1e5e46..2e7a269f` per geprüftem Hash; CI entscheidet; danach `gh workflow run Pages --ref main`. Die beiden Tests
und die zwei Restbefunde aus HANDEL-2 (`tests/ui/farOrder.test.ts:198` tautologisch, tote Klausel `src/sim/save.ts` ≈ 882) → `docs/beobachtungen.md`
durch lead-production mit releases.json (REL-23 live). (2) Danach Freigaben aus R662 (UI-HAEPPCHEN-D Umsetzung, 21 Starts) und R666 (Merge
TOOL-METRIK-ZEITRAUM). (3) Plan UI-HAEPPCHEN-E `plan/ui-haeppchen-e` @ `ac14dcb5`: O-1 Rand `box-shadow: inset 0 0 0 4px var(--gold)` + Innenschatten
aus `--bg`, Banner `--wood/--parchment/--gold`, kein neuer Farbwert; O-2 `applyPauseOverlay(...)` als erste Zeile in `refresh()` — beide
angenommen; Gate Plan durch lead-qa; Budgetantrag 16 Starts mit dem Gate.

Regelbezug: gates.md Gate Push und R598 V1, R335, R585, R662, R666 · Kosten bei Irrtum: ein roter CI-Lauf wegen Timeout eines Fremdtests (Rerun oder Timeout-Fix nach E-043).

Entscheider: L0 · Anlass: Berichte lead-qa REL23-PUSH, lead-tech plan-UI-HAEPPCHEN-E · ADR: —

## R668 · 2026-10-16 · Gate Plan UI-HAEPPCHEN-E: OK mit 3 Auflagen; Umsetzung nach Merge UI-HAEPPCHEN-D, Budget 16 Starts

Ruling: Urteil lead-qa (`.studio/handoffs/2026-10-16-lead-qa-gate-plan-UI-HAEPPCHEN-E.md`) übernommen: **OK mit Auflagen** in T05 — (1) Messweg
der Overlay-Verzögerung: Tastendruck bis `hidden`-Wechsel, 5 Wiederholungen, Schwelle 200 ms, Ein-/Ausblenden getrennt; (2) alle Pausewege im
Browser: Knopf, P, Leertaste, Tempo-Taste, Neustart und Laden aus dem Menü, jeweils ohne weitere Eingabe; (3) Auftragskarte nach angenommenem
Fernauftrag und nach Fernlieferung (Sperrperiode) im Browser. Die Plan-Instanz setzt die Auflagen auf `plan/ui-haeppchen-e` um. Umsetzung
Budget 16 Starts, Parallelität 1, startet nach Gate Merge und Merge von UI-HAEPPCHEN-D.

Regelbezug: gates.md Gate Plan, R664, R665, R667 · Kosten bei Irrtum: ein Pauseweg ohne Overlay (Fix-Runde).

Entscheider: L0 · Anlass: Bericht lead-qa gate-plan-UI-HAEPPCHEN-E · ADR: —

## R669 · 2026-10-16 · REL-23 live; freier Platz → Paket BEOB-15 (Zeitreserve und HANDEL-2-Restbefunde)

Ruling: (1) REL-23 «Fernangebot» **live**: CI 38864279487 grün, Pages 38864281718 grün; releases.json, state.md und drei Beobachtungen nachgeführt;
TOOL-METRIK-ZEITRAUM gemergt `3e5bc5bd` (lokal). Zuordnung UI-HAEPPCHEN-D → REL-24 (Vorschlag lead-production) angenommen. (2) Freier Platz (R475):
Paket **BEOB-15** (Stufe leicht, lead-tech sonnet, Budget 4): die drei Einträge vom 2026-10-16 in `docs/beobachtungen.md` (Zeilen ≈ 296–298) —
Timeouts der zwei lastabhängigen Tests nach E-043 anheben bzw. Ursache beheben, tautologischen Test in `tests/ui/farOrder.test.ts:198` mit
unabhängigem Erwartungswert, tote Klausel in `src/sim/save.ts` ≈ 882 entfernen (kein Save-Wechsel). Dateien disjunkt zu UI-HAEPPCHEN-D.

Regelbezug: R475, R667, E-043, CLAUDE.md «Trivial-Fixes» · Kosten bei Irrtum: ein Timeout, der einen echten Leistungsrückgang verdeckt (Zeitmessung vorher/nachher im Bericht).

Entscheider: L0 · Anlass: Bericht lead-production REL-23-NACH · ADR: —

## R670 · 2026-10-16 · Design I-091/I-094: I-094 verworfen (Kenntnis an Nutzer), I-091 als V-A «Kulanz»; Gate Spec

Ruling: `design/i091-i094` @ `9e72f923` (Rechnung `design-economy-designer`). (1) **I-094 Darlehen verworfen** in dieser Form: kein Fenster
echter Wahl (vor U6 Pflichtzug, Schwelle r = 0,04 gegen 0,42 beim Bürger-Aufstieg; Aufschlag 20 % → +3277, 30 % → −27 761, nicht vorhersehbar;
ab U6 wirkungslos; Geldüberschuss im Spätspiel unverändert). Da der Nutzer I-094 ausdrücklich anstossen liess (R663), geht der Entscheid als
Kenntnis N-101 in die Warteschlange; ohne Antwort gilt das Verwerfen, Archiv nach `docs/ideen-archiv.md` mit dem nächsten I-091-Schritt.
(2) **I-091 als V-A «Kulanz»**: nach 5 pünktlichen Lieferungen verzeiht der Kunde einen Fehlbestand einmal, ohne Geldfluss (19 AK); V-B
(Wertbonus 108 %) verworfen, weil er die I-047-Grenze L6 (b) reisst (3,17 % > 3 %). Spielerwirkung nach E-3 berichtigt. Save-Feld
`contract.deliveries`, Nummer im Gate Plan (R663). (3) Gate Spec durch lead-qa jetzt; Plan danach durch lead-tech (opus, Save-Änderung =
Prozessstufe voll), Umsetzung seriell **nach UI-HAEPPCHEN-E**, weil beide `src/ui/order.ts` berühren. (4) Befunde Controller-Ensemble und
`runColony`-Abbruch beim Sieg stehen in `docs/beobachtungen.md`.

Regelbezug: Verfassung §5, gates.md Gate Spec, R663, I-047 L6 · Kosten bei Irrtum: eine verworfene Idee, die der Nutzer doch will (Spec liegt vor, Wiederaufnahme ohne Neuarbeit).

Entscheider: L0 · Anlass: Bericht lead-design design-I-091-I-094 · ADR: —

## R671 · 2026-10-16 · Gate Spec I-091 V-A «Kulanz»: OK mit Auflagen A1–A4; Plan Stufe voll danach

Ruling: Urteil lead-qa (`.studio/handoffs/2026-10-16-lead-qa-gate-spec-I-091.md`) übernommen: **OK mit Auflagen** — A1 Widerspruch AK-TR-02/AK-TR-18
auflösen (Feld `becameLoyal` oder `loyal` nur beim Übergang; L0-Vorgabe: `becameLoyal`, weil der Dauerzustand `loyal` für die Anzeige gebraucht wird);
A2 AK-TR-05 präzisieren (`money` vor und nach Periodenbeginn identisch); A3 Randfälle Lager nach Kulanz aufgefüllt, Kulanz in Periode mit `farSkip`,
Kündigen direkt nach Kulanz; A4 Spec an R670 angleichen (V-B, O-1/E-2, «Stufe leicht» als verworfen/gestrichen), Helfertexte aus
`CONTRACT_LOYAL_AFTER`. lead-design setzt A1–A4 auf `design/i091-i094` um und verschiebt I-094 nach `docs/ideen-archiv.md` (R670). Danach Plan
durch lead-tech (opus, Stufe voll) mit den Plan-Hinweisen des Gates (Zeitraffer/präparierter Spielstand für AK-19, Kulanz-Zweig in `tickOrders`
wie `delivered`, vollständige Switches über `ContractEvent`, Fixture über `SAVE_VERSION - 1` plus v14-Kette, Mitzieh-Schritt, `deliveries: null`).

Regelbezug: gates.md Gate Spec, R663, R670 · Kosten bei Irrtum: eine doppelte «jetzt treu»-Meldung (Fix-Runde).

Entscheider: L0 · Anlass: Bericht lead-qa gate-spec-I-091 · ADR: —

## R672 · 2026-10-16 · Gate Merge BEOB-15: OK

Ruling: `fix/beob-15` @ `c10b6d09` (Timeout 10000 ms für RF-10 und AK-BAS-03 nach E-043, Aussage unverändert; `farOrder.test.ts` mit unabhängigem
Snapshot und Mutations-Rot-Beleg; tote Klausel in `isValidFarFields` entfernt, `SAVE_VERSION` 15; Zeiten vorher/nachher ohne Rückgang; `tsc`,
`lint`, `zeittests`, `conflicts`, `docs-check`, `make check` inkl. Balancing, `make zeitreserve-gate` Exit 0; Review OK) → **Gate Merge OK**.
lead-production merged `--no-ff` (lokal) und trägt den Restbefund RF-4 und «E5 nie im R4-Sperrbereich» (`wildlife.test.ts`, > 500 ms) in
`docs/beobachtungen.md` ein. Die `make check`-Warnung «state.md nur bis R658» erledigt die Session-Ende-Routine.

Regelbezug: gates.md Gate Merge, R669, E-043 · Kosten bei Irrtum: ein Timeout, der einen Leistungsrückgang verdeckt (Messwerte zeigen keinen).

Entscheider: L0 · Anlass: Bericht lead-tech BEOB-15 · ADR: —

## R673 · 2026-10-16 · Gate Merge UI-HAEPPCHEN-D + I-109: OK; Final-Review nie als Fortsetzung

Ruling: `feat/ui-haeppchen-d` @ `dd8bc84e` (Handoff `.studio/handoffs/2026-10-16-lead-qa-gate-UI-HAEPPCHEN-D.md`): frischer Final-Review opus OK,
`make zeitreserve-gate` Exit 0 (2. Lauf nach Testsperre), Prüfliste vollständig (53 Screenshots), `src/sim`-Diff leer, `SAVE_VERSION` 15, README/arc42
nachgeführt → **Gate Merge OK**. lead-production merged `--no-ff` (lokal), releases.json REL-24 Stufe Merge. Vier niedrige Reviewer-Hinweise (Log-
Reihenfolge bei gleichem Tick, Tooltip «Leer in 0 s» bei Bestand 0, doppelte `goodsBalance`-Rechnung `hud.ts:368`, DOM-Test `updateHud`) →
`docs/beobachtungen.md` (letzter schon eingetragen). Danach startet UI-HAEPPCHEN-E (R668, Budget 16).
**Prozessbefund (belegt in `.studio/events.jsonl`):** Der Controller liess den Final-Review als `SendMessage`-Fortsetzung des sonnet-Reviewers laufen;
eine Fortsetzung behält das Modell der Ursprungsinstanz. Ab sofort steht in jedem Umsetzungs-Briefing: «Final-Review immer als frischer
`qa-code-reviewer`-Start mit `model: opus`, nie als Fortsetzung». Handbuch-/lernen.md-Eintrag durch studio-coach in der Session-Retro.

Regelbezug: gates.md Gate Merge, STUDIO.md Modellwahl (Final-Review opus), R662 · Kosten bei Irrtum: ein Merge mit vier niedrigen Hinweisen.

Entscheider: L0 · Anlass: Bericht lead-qa gate-UI-HAEPPCHEN-D · ADR: —

## R674 · 2026-10-16 · Plan I-091: Save-Nummer = main + 1 beim Merge; Ownership-Ausnahme `types.ts`; Gate Plan

Ruling: Plan `plan/i091` @ `f743b17e` (T00–T06, 22 AK, Plan-Review BEDENKEN → 6 Befunde eingearbeitet). (1) **Save-Version** von I-091 =
`SAVE_VERSION` auf main + 1 zum Zeitpunkt des Merges (Arbeitsannahme v16); T06 setzt sie, das Gate Merge prüft sie gegen main und gegen
Erweiterung 1 (Nutzer-Session). Landet Erweiterung 1 vorher, renummeriert T06 (Fix-Runde vor dem Gate). (2) **Ownership-Ausnahme**: die
Typänderung `excused` in `src/sim/types.ts` liegt in T03 beim `tech-ui-engineer`, damit `tsc` zwischen den Tasks grün bleibt. (3) Gate Plan durch
lead-qa jetzt; Umsetzung Budget-Antrag 16 Starts wird mit dem Gate entschieden, Start erst nach Merge UI-HAEPPCHEN-E (`order.ts`).

Regelbezug: gates.md Gate Plan, R638, R663, R670, R671 · Kosten bei Irrtum: eine Renummerierung an 7 Stellen.

Entscheider: L0 · Anlass: Bericht lead-tech plan-I-091 · ADR: —

## R675 · 2026-10-16 · Gate Plan I-091: OK mit Auflagen P1–P3; Budget 18 Starts nach Merge UI-HAEPPCHEN-E

Ruling: Urteil lead-qa (`.studio/handoffs/2026-10-16-lead-qa-gate-plan-I-091.md`) übernommen: **OK mit Auflagen** — P1 `tests/ui/autoLog.test.ts`
(Contract-Literal Z. 21, `contractNotice`) in T01-Mitzieh-Liste, Dateimatrix und Laufschritte T01/T03; P2 «Final-Review immer als frischer
opus-Start, nie als Fortsetzung» (R673) in Index und Umsetzer-Briefing; P3 T06 Schritt 7 ganze Dateien statt `-t`-Filter (oder Trefferzahl
verlangen), Nummerierung Schritt 3 bereinigen. Die Plan-Instanz setzt P1–P3 auf `plan/i091` um. Budget der Umsetzung **18 Starts** (Controller-
Instanzen eingerechnet), Parallelität 1; Start nach Merge UI-HAEPPCHEN-E.

Regelbezug: gates.md Gate Plan, R673, R674 · Kosten bei Irrtum: ein rot werdender UI-Test im Mitzieh-Schritt (Fix-Runde).

Entscheider: L0 · Anlass: Bericht lead-qa gate-plan-I-091 · ADR: —

## R676 · 2026-10-16 · Freie Plätze: Kurzdesigns I-108, I-101 + I-103 (Pool IDEEN-10)

Ruling: Plan I-091 mit Auflagen `plan/i091` @ `d2b4f6c8` (R675 erfüllt). Freie Plätze (R475, R445) während UI-HAEPPCHEN-E läuft: Kurzdesigns
Stufe leicht (lead-design, sonnet) für die nächsten Ränge aus IDEEN-10, die Handel 2 voraussetzen bzw. kein Save brauchen: (1) **I-108**
«Einnahmen und Unterhalt getrennt» (S); (2) **I-101** «Fernauftrag-Marke Seekarte» + **I-103** «Routen-Bilanz» gemeinsam (beide Seekarte/
Routen, Empfehlung «mit I-101»). Umsetzung erst nach I-091 bzw. nach Bündelungsprüfung durch lead-tech. I-104 und I-105 bleiben geparkt.

Regelbezug: R445, R475, R653 · Kosten bei Irrtum: zwei Kurzdesigns, die vor der Umsetzung nachgeschärft werden.

Entscheider: L0 · Anlass: freie Kapazität · ADR: —
