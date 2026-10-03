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
