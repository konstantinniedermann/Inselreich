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
