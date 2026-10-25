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

R1–R739 stehen wörtlich in [rulings-archiv.md](rulings-archiv.md) (R129, R682); für Suchen immer `rulings*.md` verwenden.

## R740 · 2026-10-16 · I-112 Delta-Review BEDENKEN (Perf-Regression aus Befund-2-Fix): +2 Starts, Ansatz «nur sichtbarer Tooltip»

Ruling: `feat/i112` @ `fbc4cf78` (`make check` Exit 0; Befunde 1–4 aus R734 behoben, Naht-Ausnahme bestätigt) → Delta-Review opus BEDENKEN mit neuer hoher Regression:
das Live-Update der Takt-Zeilen (`src/ui/buildMenu.ts:558`) rechnet je Tick für jedes produzierende Gebäude eine Bilanz-Probe und bricht I-078 AK-14 (verzögertes Rechnen).
Befundklasse neu (Leistung statt Anzeige), daher kein V1-Umschnitt. **Ansatz vorgegeben (KISS):** `.tt-cycle` nur im sichtbaren Tooltip füllen wie `fillBalance`; Lazy-Test
«I-078» um `.tt-cycle` erweitern (Rot-Beleg); dazu `.messages` z-index 11 und doppelter Radius-Text `buildMenu.ts:548`. Regel: Live-Updates von Tooltip-Zeilen lösen nie eine
Bilanz-Probe ausserhalb des sichtbaren Tooltips aus. **+2 Starts** (UI-Umsetzer sonnet, frisches Delta-Review opus); Budget (V3) I-112 **24 von 25**. Danach `make check`
bei Last ≤ 8, dann Gate Merge. Bei erneutem BEDENKEN derselben Klasse: V1 (Ansatzprüfung vor jedem weiteren Start).

Regelbezug: R673, R708, R734, R735 · Kosten bei Irrtum: zwei Starts für eine Regression, die sonst erst im Playtest auffiele.

Entscheider: L0 · Anlass: Bericht lead-tech I-112 C4 · ADR: —

## R741 · 2026-10-16 · Gate Plan I-122 + I-123: OK; Budget 12 + 1, Parallelität 2; Start nach I-112-Merge

Ruling: `plan/i122-i123` @ `70486f0b` (T00–T07, Handoff `.studio/handoffs/2026-10-16-lead-tech-plan-I-122-I-123.md`) → **Gate Plan OK** (Stufe leicht, L0). Probe R738 per
Codelesung bestätigt (`settleContract` trotz `farSkip`, `nextOrderTick` eine Periode zu weit) → T01 belegt per Test, T02 Beipack (`orderCardText` nutzt `nextSettleTick`).
Reichweite in neuer Datei `src/ui/contractDrain.ts` angenommen; Ablagen `contractWarning` (`orders.ts`), `shouldWarnNow`/`flashOrderCard` (`order.ts`), `warnedPeriod` (`app.ts`)
angenommen. Review-Form: ein frisches Final-Review opus bei Diff ≤ 300 Zeilen Code (E-068), sonst zusätzlich Task-Review T01. Vertragskarten-Umbruch bei 1280 px prüft T06,
Fallback kleinere Schrift. Budget (V3) **12 Arbeiter-Starts + 1 Controller, Parallelität 2** (statt 3: Deckel 6 und Last). **Start nach dem Merge von I-112**, T00 holt main.

Regelbezug: gates.md Gate Plan, R738, E-068 · Kosten bei Irrtum: ein Strang, der eine halbe Stunde später läuft.

Entscheider: L0 · Anlass: Bericht lead-tech plan-I-122-I-123 · ADR: —

## R742 · 2026-10-16 · Gate Merge I-112: OK mit M-1/M-2; Merge jetzt (Save v17); danach I-122 + I-123

Ruling: `feat/i112` @ `3fbd13b4` (Gate-Handoff `.studio/handoffs/2026-10-16-lead-qa-gate-I-112.md`; `make check` Exit 0, 4320 Tests; 17 AKs belegt; Baseline bitgleich) →
**Gate Merge OK**. **M-1:** `SAVE_VERSION` = main + 1 beim Merge = **17** (main ist 16; Erweiterung 1 hat nicht gemergt); die Nutzer-Session nimmt für Erweiterung 1 dann
main + 1 = 18 (R674). **M-2:** Playtest-Bilder bleiben lokal unter `.studio/qa/i112/` im Worktree (Arbeitsablage, nicht versioniert; Aufräumen nach R682). Regel aus R740
(Tooltip-Zeilen nur sichtbar) gilt dauerhaft. lead-production merged lokal (`--no-ff`), nimmt I-112 in REL-26 auf (Save v16 → v17 mit Migration) und setzt in
`docs/ideen.md` I-112 auf «gemergt (R742)». Danach startet I-122 + I-123 (R741). Budget (V3) I-112 abgeschlossen mit 24 von 25.

Regelbezug: gates.md Gate Merge, R674, R682, R706, R711, R740, R741 · Kosten bei Irrtum: eine Save-Nummer, die vor dem Push neu vergeben werden muss.

Entscheider: L0 · Anlass: Bericht lead-qa gate-I-112 · ADR: —

## R743 · 2026-10-16 · TOOL-GUARD-ALLOWLIST: V1-Umschnitt — Feld `command` entfällt; +1 Start (Delta-Review)

Ruling: `tool/guard-redact` @ `bad87718` (Handoff `.studio/handoffs/2026-10-16-lead-tech-TOOL-GUARD-ALLOWLIST.md`) → Delta-Review opus ZURÜCK: freie Tokens gelangen weiter ins
Feld `command` (erstes Argument bei Programmen ohne Unterbefehl; erstes Wort bei Nicht-Bash-Werkzeugen). Dritte Runde derselben Befundklasse «freier Text im Ereignis» →
**V1 (R735): Ansatz statt Fix.** `guard_block` speichert **kein** Feld `command` mehr, nur `rule`, `tool`, `summary` (fester Text je Regel) und `command_hash`
(SHA-256-Präfix, 12 Zeichen). Leser geprüft: kein Werkzeug in `tools/studio/` liest `command` aus `guard_block` (nur `hook.py`/`efficiency.py` aus `tool_input`).
Die Schwärzung `redact` bleibt für andere Ausgaben. Umsetzung per Fortsetzung des Umsetzers, **+1 Start** frisches Delta-Review opus; bei OK Gate Merge (lead-qa). Budget (V3):
TOOL-GUARD-REDACT 5 von 3 (abgeschlossen), TOOL-GUARD-ALLOWLIST **4 von 3**.

Regelbezug: R673, R725, R732, R733, R735, OWASP · Kosten bei Irrtum: ein Diagnosefeld weniger (Regel und Hash bleiben).

Entscheider: L0 · Anlass: Bericht lead-tech TOOL-GUARD-ALLOWLIST · ADR: —

## R744 · 2026-10-16 · Gate Merge TOOL-GUARD-ALLOWLIST: OK; Ampel gelb → herunterfahren

Ruling: (1) `tool/guard-redact` @ `bea0179c` (Gate-Handoff `.studio/handoffs/2026-10-16-lead-qa-gate-TOOL-GUARD-ALLOWLIST.md`) → **Gate Merge OK**; `guard_block` speichert nach
R743 weder Befehl noch Befehlsteile. lead-production merged lokal (`--no-ff`), nimmt es in REL-26 auf und trägt «`_shown_command`/`COMMAND_LIMIT` nur noch von Tests genutzt»
als Beobachtung ein. (2) **Limit-Ampel gelb (5h 60 %)**: keine neuen Pakete oder Wellen. Abschliessen: I-122 + I-123 bis Gate Merge und Merge; Kurzdesign I-132 bis Gate Spec
(Plan in der Folgesession); ORT-A C3 bis T06, danach Pause — C4 (Fixture, T09) in der Folgesession, T09 braucht ohnehin das freie Messfenster (N-102). Danach
Session-Ende-Routine. REL-26-Push frühestens 2026-10-17 (R712).

Regelbezug: gates.md Gate Merge, R69, R712, R743 · Kosten bei Irrtum: ORT-A C4 startet eine Session später.

Entscheider: L0 · Anlass: Bericht lead-qa gate-TOOL-GUARD-ALLOWLIST, Ampel gelb · ADR: —

## R745 · 2026-10-16 · Gate Spec I-132 «Meisterprüfung»: Variante S (nur «Eigenversorgung»); I-133 verworfen; Plan in der Folgesession

Ruling: `design/i132` (Spec `e1d1cf1c`, Anhang `42d32eb7`; Handoff `.studio/handoffs/2026-10-16-lead-design-design-I-132.md`) → **Gate Spec OK, Variante S**. **E1:** nur die Auflage
«Eigenversorgung» (Zukauf gesperrt; im Messlauf ohne Vorbereitung Scheitern bei Tick 150, Engpass Schiffstransport von Gewürz/Stein — erfüllt den Massstab R722);
«Genügsam» (Kasse nie < 2454) und «Sturmjahr» (3 Feuerwachen halten ≥ 93 %) sind gerechnet trivial → gestrichen, **I-133 verworfen**. **E2:** keine Abriss- oder Steuersperre; die
Abbruchschwelle deckelt das Verkleinern. **E3:** Startfenster 60–150 Kaufleute (Obergrenze geschätzt, Playtest-Trigger Spec §10). **E4:** Abbruch unter 70 % der Starteinwohner
(90 % reisst im Normalspiel in 11 von 16 Seeds). Save: Feld `trial`, `SAVE_VERSION` = main + 1 beim Merge (main jetzt v17), Migration wie R711 R-4; Baseline bitgleich. Plan in
der Folgesession ab main (I-112 ist gemergt). Drei Controller-Befunde (keine Nahrungsreserve, keine Feuerwache, Gewürzkauf nur 100 Ticks voraus) trägt lead-production in
`docs/beobachtungen.md` ein. Budget (V3) design-I-132 1 von 2.

Regelbezug: gates.md Gate Spec, R674, R711, R722, R737 · Kosten bei Irrtum: eine Obergrenze, die nach dem Playtest verschoben wird.

Entscheider: L0 · Anlass: Bericht lead-design design-I-132-I-133 · ADR: —

## R746 · 2026-10-16 · ORT-A C3 bis T06 abgenommen; T06-BEDENKEN zuerst in C4; ORT-A pausiert bis zur Folgesession

Ruling: `feat/ort-a` @ `310c6e00` (T04–T06, T05b, U1-Zuschnitt `548b8440`/`339f535b`, Fix `cf5a239b`; Handoff `.studio/handoffs/2026-10-16-lead-tech-ORT-A-C3.md`) → abgenommen mit
offenem T06-BEDENKEN (mittel). Richtwert nach T06 B/A ≈ 1,41 (Last 5–9, «Messfenster belegt»; vorher 2,5) — weiter über +20 %, Entscheid in T09 (R739). **C4 beginnt in der
Folgesession mit:** (a) Unit-Test des Ringpfads von `twoZonePieces` mit zwei `GroundEdge` (Ring schmutzig erzwingen) — schlägt er fehl oder zeigt er keinen Nutzen, wird auf
Rand 1 vereinfacht (Entscheid L0 nach Bericht); (b) Merge `feat/ort-a-mess` (P-1); (c) Fixture und Schwellen Z. 200/205 (R730); (d) T09 nur bei freiem Messfenster. AK-07
(≤ 2 s je Fall, unter Last 2,8–3,8 s) wird bei T21 verkleinert. Budget (V3): C3 **9 von 9**; ORT-A-Puffer **9 von 12**; Gesamt ORT-A ≈ 30 von 57 Starts.

Regelbezug: R705, R730, R735, R736, R739, R744 · Kosten bei Irrtum: ein Ringpfad, der als toter Code in den Merge geht.

Entscheider: L0 · Anlass: Bericht lead-tech ORT-A C3 · ADR: —

## R747 · 2026-10-16 · Actions-Sparregeln (N-98) gelockert: Inselreich ist öffentlich, Minuten zählen nicht

Ruling: Nutzeranweisung „public repo, Actions-Minuten zählen nicht zum Limit, Limitation aufweichen“. Beleg: `gh repo view` → `PUBLIC`;
Billing-Usage Oktober: Inselreich 1074 min, `discountAmount` = `grossAmount`, netto 0. Die Ampel „Actions-Minuten (Monat)“ zählt diese
Minuten bisher gegen das Kontingent von 2000 min (Konto-Prognose ROT) — Fehlbewertung. Auslegung (Paket **TOOL-ACTIONS-FREI**):
**V1** `ci.yml`: `paths-ignore` entfällt (Push auf main und PR), damit auch Doku-/Studio-Pushes `make check` durchlaufen (prüft u. a.
`docs/studio/`); `cancel-in-progress` bleibt (überholte Läufe, kein Sparzweck). **V2** `pages.yml`: Deploy wieder automatisch, aber erst
nach grüner CI auf main (`workflow_run` von CI, `conclusion == success`, Checkout `head_sha`); `workflow_dispatch` bleibt für Reruns und
die R450-Ausnahme. Der manuelle Schritt `gh workflow run Pages` beim Release entfällt; der Integrator prüft den Deploy-Lauf weiterhin.
**V3** `tools/studio/actions.py`: Minuten öffentlicher Repos (Inselreich) zählen nicht zu Konto-Minuten und Konto-Prognose, sondern stehen
nur als Info; Session-Minuten nur Info, solange das Repo öffentlich ist. Damit entfällt die Grundlage für R488 V2 (Rot → ein Push je
Tag) für Inselreich und für „REL-26 frühestens 2026-10-17“ (R712). **Bleibt:** „höchstens ein Push je Session“ (R335), Merges lokal,
`make push-check` vor jedem Push — das sind keine reinen Minuten-Regeln. **V4** Doku nachführen: STUDIO.md (Push-Ablauf, Session-Ende),
`production-integrator.md` (Schritte 4/5), Workflow-Kommentare, arc42 (Deploy-Diagramm), lernen.md (Actions-Zeile). E-012 „Pages nur bei
Spieländerungen“ wird gegenstandslos (Status setzt der Coach in der nächsten Retro). Kein Nutzer-Vorbehalt nötig: N-98 ist durch die
Nutzeranweisung selbst gelockert.

Regelbezug: N-98, R334, R335, R450, R488 V2, R712 · Kosten bei Irrtum: zusätzliche CI-/Pages-Läufe ohne Kosten; falls das Repo wieder
privat wird, greift das Kontingent wieder (actions.py prüft die Sichtbarkeit).

Entscheider: L0 · Anlass: Nutzeranweisung 2026-10-16 · ADR: —

## R748 · 2026-10-16 · Gate Merge TOOL-ACTIONS-FREI: OK; Merge lokal, Push mit REL-26

Ruling: `feat/tool-actions-frei` @ `42e04202` (Handoff `.studio/handoffs/2026-10-16-lead-tech-TOOL-ACTIONS-FREI.md`) → OK. Review-BEDENKEN
(Fork-PR von Branch `main` löst `workflow_run` aus) ist in `42e04202` behoben (`workflow_run.event == 'push'`); L0 hat den Workflow-Diff
selbst geprüft, Delta-Review entfällt (Budget 2/2, Änderung eine Bedingung). `make check` lief nach `dd5bb89a` grün, der letzte Lauf brach an
der Testsperre ab (kein Testfehler) → der Integrator fährt `make check` beim Merge ohnehin. Merge lokal; die neuen Workflows wirken erst mit
dem nächsten Push (REL-26, Release-Check in der pushenden Session, R712 V2). Rest-Befund: Minuten anderer öffentlicher Repos des Kontos
zählen weiter (≈ 480 min) → Beobachtung.

Regelbezug: R747, R712 V2 · Kosten bei Irrtum: ein Pages-Lauf zu viel oder zu wenig; Rückfall per `workflow_dispatch`.

Entscheider: L0 · Anlass: Bericht lead-tech TOOL-ACTIONS-FREI · ADR: —

## R747 · 2026-10-16 · Gate Merge I-122 + I-123: OK; Merge jetzt; Cache-Write-Ad-hoc in die Kurz-Retro

Ruling: (1) `feat/i122-i123` @ `2af563fc` (Gate-Handoff `.studio/handoffs/2026-10-16-lead-qa-gate-I-122-I-123.md`; `check.log` 4361 Tests grün nach dem Fix) → **Gate Merge OK**.
BEDENKEN 1–3 als Beobachtungen (Rot-Beleg im Ledger nicht nachvollziehbar; widersprüchliche Exit-Zeilen `final.txt`/`check.log`; lead-tech-Beobachtungen Umbruch «Strafe / 135»
bei 1280 px, verzögerter Klang bei Pause-Annahme, `querySelector` in `app.ts`, hängender Playtester-Lauf) — der volle Lauf im `push-check` vor REL-26 deckt Punkt 2 ab.
lead-production merged lokal (`--no-ff`), trägt die Beobachtungen ein, setzt I-122/I-123 in `docs/ideen.md` auf «gemergt (R747)» und nimmt das Paket in REL-26 auf. Budget (V3)
I-122-I-123 10 von 12. (2) Hook «Ad-hoc-Retro fällig: Cache-Write 5 min zwei Sessions rot» → in die laufende Kurz-Retro ca9d40c8 aufgenommen (Ursache nach Rolle, Hebel Pflicht nach
R316), kein eigener Start.

Regelbezug: gates.md Gate Merge, R316, R712 V2, R741, R744 · Kosten bei Irrtum: ein Rot-Beleg, der im Push-Check nicht auffällt.

Entscheider: L0 · Anlass: Bericht lead-qa gate-I-122-I-123, Hook Ad-hoc-Retro · ADR: —

## R750 · 2026-10-16 · Kurz-Retro ca9d40c8: V1–V3 angenommen (Umsetzung Folgesession); Session-Ende ca9d40c8

Ruling: Bericht `docs/studio/retros/2026-10-16-session-ca9d40c8-ende.md` (`8d11ea5e`) → angenommen; deckt auch die Hook-Ad-hoc «Cache-Write 5 min zwei Sessions rot» (R747 dieser
Session, umnummeriert auf R749). **V1:** `test_passed`/`test_failed` tragen 1-min-Last und Vitest-Worker-Zahl; bei Last ≥ 8 begrenzt `make` die Worker (Wert prüft lead-tech) —
im nächsten Werkzeug-Bündel zusammen mit dem Aufräumen von `_shown_command`/`COMMAND_LIMIT` (R744); Messgrösse Last ≥ 8 an ≤ 25 % der Läufe, max. Last ≤ 20, Bewertung 2026-10-30.
**V2:** Briefings schätzen nur in Tools, Minuten = Tools ÷ 6 durch das Werkzeug (Handbuch-Minor); Messgrösse |Minuten-Abweichung| ≤ 30 % in 2 Session-Retros. **V3:** je
Controller-Instanz höchstens eine Wartepause > 5 min, danach Handoff und Folgeinstanz (Handbuch-Minor); Messgrösse Pause-Anteil lead-tech ≤ 20 % (heute 40 %), Cache-Write ≤ 25 %,
Frist 2026-10-30. Messauftrag «L0-Zwischenstand in state.md ab 250k»: erfüllt (`1c41da14` bei R726). Ruling-Kollision mit der parallelen L0-Session anno-clone #2: dort R747/R748,
meine R747 wird R749 (Absprache per Nachricht); diese Session schreibt danach keine Rulings mehr. Session-Ende ca9d40c8: alle gestarteten Pakete abgeschlossen oder pausiert
(ORT-A nach T06, R746); REL-26-Push und Push-Gate gehören der nächsten Session bzw. anno-clone #2 (R335).

Regelbezug: R129, R316, R335, R708, R735 · Kosten bei Irrtum: zwei Handbuch-Minors, die nach der Bewertung zurückgenommen werden.

Entscheider: L0 · Anlass: Kurz-Retro ca9d40c8, Session-Ende · ADR: —

## R751 · 2026-10-16 · Nutzerauftrag «push»: neue Studio-Session, REL-26 jetzt inkl. TOOL-ACTIONS-FREI

Ruling: Nutzer: «push.» nach dem Session-Ende ca9d40c8 → neue Studio-Session (R434), ihr einziger Push ist REL-26 (R335). Ablauf: (1) lead-production merged
`feat/tool-actions-frei` @ `42e04202` lokal (Gate OK R748 der Parallel-Session, «Push mit REL-26»); (2) lead-qa Release-Check REL-26 mit Release-Notizen (Handbuch 1.60:
nur in der Push-Session); (3) `production-integrator` in `.worktrees/integrate`: `make push-check`, Push per geprüftem Hash, CI- und Pages-Lauf prüfen. R488 V2 «ein Push
je Tag» entfällt durch R747 der Parallel-Session (öffentliches Repo); der Nutzerauftrag geht ohnehin vor. Ruling-Nummern: R749 bleibt für die Umnummerierung durch
anno-clone #2 reserviert (offline); diese Session nutzt R751 ff. und prüft vor jedem Ruling `main`.

Regelbezug: R335, R434, R712 V2, R747/R748 (anno-clone #2), VERFASSUNG §5 · Kosten bei Irrtum: ein Release, das einen Paket-Merge der Parallel-Session vorwegnimmt.

Entscheider: L0 · Anlass: Nutzerauftrag · ADR: —

## R752 · 2026-10-16 · Release-Check REL-26: OK; push-check und Push jetzt

Ruling: `main` (Release-Handoff `.studio/handoffs/2026-10-16-lead-qa-release-REL-26.md`, geprüft auf `9d02e700` gegen `origin/main` `8fe744df`) → **Release REL-26 OK**. Inhalt:
I-120, I-118, UI-AUFRAEUM-4, TOOL-BUENDEL-14, I-114, BEOB-17, PERF-BILANZ-COV, I-112 (Save v16 → v17 mit Migration), TOOL-GUARD-ALLOWLIST, IDEEN-12, I-122 + I-123,
TOOL-ACTIONS-FREI. Auflagen an den `production-integrator`: (1) `make push-check` mit vollem Lauf, Exit-Code im Bericht (deckt R727 und die Exit-Lücke aus I-122 BEDENKEN 2);
(2) Push nur des geprüften Hashes (`git push origin <Hash>:main`); (3) danach CI-Lauf und — da TOOL-ACTIONS-FREI die Workflows ändert — Pages-Lauf prüfen, Rückfall
`gh workflow run Pages --ref main` (R748). L0 committet bis zum Ende des push-checks nicht auf main (R697).

Regelbezug: gates.md Release, R335, R697, R712 V2, R748, R751 · Kosten bei Irrtum: ein roter CI-Lauf auf main, der per Hotfix behoben wird.

Entscheider: L0 · Anlass: Release-Check lead-qa REL-26 · ADR: —

## R753 · 2026-10-16 · REL-26 live; Push-Session beendet

Ruling: `make push-check` EXIT=0 auf `6f14a354` (4361 Tests, `check-ci-perf` grün), Push `8fe744df..6f14a354`, CI 38914539819 grün, Pages 38915602338 grün — automatisch per `workflow_run`,
der erste Lauf mit den Workflows aus TOOL-ACTIONS-FREI. **REL-26 «Rat, Vorwarnung, Klang» live**, Save v17. Release-Notiz in `state.md`. Die push-check-Hinweise «Ereignis nicht
geschrieben» und «Lastprotokoll fehlgeschlagen» gehen ins Werkzeug-Bündel 15 (R750). Die Push-Session (R751–R753) bestand nur aus Merge, Release-Check und Push; ihre Kurz-Retro
deckt die Retro ca9d40c8 ab (keine eigene, Abweichung von der Ende-Routine wegen Umfang). Nächste Session: neues Claude-Gespräch, Plan aus `state.md`.

Regelbezug: R335, R434, R751, R752 · Kosten bei Irrtum: eine fehlende Mini-Retro für eine Push-Session.

Entscheider: L0 · Anlass: Bericht production-integrator REL-26 · ADR: —

## R754 · 2026-10-17 · Session 21273458: «mach weiter» = Plan aus state.md; vier Pakete parallel

Ruling: Nutzer: «mach weiter» → Plan aus `state.md` fortsetzen (R434, Autonomie §5). Parallel-Session anno-clone #2 ohne frische Heartbeats (letzte Ereignisse 2026-10-16) → diese
Session ist die aktive L0-Session (R129); Ruling-Nummern weiter gegen `origin/main` prüfen. Start, Deckel 6 (R698): **(A) RETRO-ADHOC-17** `studio-coach` (sonnet, Kurz-Retro):
Hook-Ad-hoc (Budget lead-tech 5 von 3, Cache-Write zwei Sessions rot, studio-director inaktiv) gegen R735/R750 abgleichen, nur Neues bewerten; im selben Start Handbuch-Minor
R750 V2 (Schätzung nur in Tools) und V3 (eine Wartepause je Controller-Instanz). **(B) TOOL-BUENDEL-15** `lead-tech` (sonnet, Werkzeug-Paket): R750 V1, R744
(`_shown_command`/`COMMAND_LIMIT`), push-check-Hinweise aus R753; Budget 5 Starts, Parallelität 1. **(C) plan-i132** `lead-tech` (opus, Tech-Lead beim Plan): Plan nach R745,
Save main + 1 = v18; Budget 1 Start (eine Plan-Prüfung). **(D) ORT-A C4** `lead-tech` (sonnet, Controller): Schritte (a)–(c) aus R746, T09 nur bei freiem Messfenster;
Budget 3 Starts aus dem ORT-A-Puffer (dann 12 von 12), Parallelität 1. Last beim Start 8,4: Testläufe halten TOOL-TESTLOCK ein (R380); Mehrbedarf vor dem Überschreiten melden.

Regelbezug: R129, R380, R434, R698, R735, R744, R745, R746, R750, R753 · Kosten bei Irrtum: ein Werkzeug-Bündel, das bei hoher Last länger braucht als geschätzt.

Entscheider: L0 · Anlass: Session-Start 21273458 · ADR: —

## R755 · 2026-10-17 · Ad-hoc-Retro RETRO-ADHOC-17: abgedeckt bis auf «inaktiv»-Fehlalarm; V1 angenommen für Werkzeug-Bündel 16; Handbuch 1.63

Ruling: Bericht `docs/studio/retros/2026-10-17-adhoc-hook.md` (`5a3c27e9`) → angenommen. Budget «lead-tech 5 von 3» ist durch R735, Cache-Write durch R750 V3 und E-068 abgedeckt
(Messauftrag Tool-Ergebnisgrösse bis 2026-10-23 abwarten). **V1 angenommen:** `studio-director` und `lead-qa` gelten nicht als inaktiv, solange Kind-Agenten Heartbeats senden
oder ein langer Make-Lauf läuft; Umsetzung im **Werkzeug-Bündel 16** (nicht nachträglich in das laufende TOOL-BUENDEL-15, um dessen Zuschnitt nicht zu ändern), Messgrösse 0 Signale
über 3 Sessions, Frist 2026-10-30, Rückfall: Regel entfernen. Handbuch 1.63 (R750 V2 und V3) umgesetzt; die Reibung von V3 mit R438 V2 bewertet die Retro am 2026-10-30.

Regelbezug: R735, R750, R754, E-068 · Kosten bei Irrtum: ein Fehlalarm, der zwei Wochen weiter erscheint.

Entscheider: L0 · Anlass: Bericht studio-coach RETRO-ADHOC-17 · ADR: —

## R756 · 2026-10-17 · ORT-A C4 abgenommen (Ringpfad bleibt); C5 startet T09, bei OK T10

Ruling: `feat/ort-a` (Handoff `.studio/handoffs/2026-10-17-lead-tech-ORT-A-C4.md`) → abgenommen. (a) Ringtest `twoZonePieces` grün, Mutation `dirty = false` färbt 3 von 4 Fällen rot,
Nutzen belegt (> 20 % weniger Ringkacheln, pixelgleich) → **kein Rückbau auf Rand 1**, T06-BEDENKEN aus R746 erledigt. (b) `feat/ort-a-mess` gemergt (`560dbdde`, P-1). (c) Fixture
`tools/render-qa/fixtures/ort-a-siedlung.json` (Ablage unter `tools/render-qa/` statt `fixtures/` akzeptiert) und Schwellen `kantenprofil.mjs` mit Rot-Beleg. Offener niedriger
Review-Punkt (`a.w !== b.w` in `hofsaumTileChanged` ungetestet) geht in T21. **C5:** T09 (`make messfenster`, gewertete Messung, Frühwarnung E6); Messfenster belegt → höchstens
eine Wartepause ≤ 5 min (R750 V3), sonst Handoff ohne T09. Ergibt T09 keinen E6-Entscheidungsbedarf, darf C5 im selben Start T10 (Browser-Check, `qa-playtester`, 1 Browser-Lauf)
anschliessen. Budget: verbleibend 2 von 3 Starts (R754).

Regelbezug: R730, R739, R746, R750 V3, R754 · Kosten bei Irrtum: ein selten durchlaufener Ringpfad bleibt im Code.

Entscheider: L0 · Anlass: Bericht lead-tech ORT-A C4 · ADR: —

## R757 · 2026-10-17 · Gate Merge TOOL-BUENDEL-15: OK, Merge lokal; Werkzeug-Bündel 16 startet

Ruling: `tool/buendel-15` @ `ef0988d2` (Handoff `.studio/handoffs/2026-10-17-lead-tech-TOOL-BUENDEL-15.md`, Review OK in einer Runde, `make studio-test` 997 grün, ruff und docs-check
Exit 0) → **Gate Merge OK**; `production-integrator` merged lokal nach main, kein Push (R335). R750 V1 erfüllt (`load`/`workers` in Testereignissen, Deckel 4 Worker bei Last ≥ 8);
R744 erledigt; R753-Hinweise sind Testrauschen aus absichtlichen `OSError`-Tests, jetzt abgefangen. Diff 326 Zeilen knapp über E-068 (300) — ein Reviewer genügt hier, weil reiner
Werkzeugcode ohne Spieleinfluss. **Befund:** Der Worker-Deckel greift nur bei Last genau 8, weil TOOL-TESTLOCK über 8 abbricht → **TOOL-BUENDEL-16** (`lead-tech`, sonnet,
Werkzeug-Paket; Budget 3 Starts, Parallelität 1): (1) R755 V1 «inaktiv»-Fehlalarm für studio-director/lead-qa, (2) Deckel-Schwelle mit TOOL-TESTLOCK abstimmen (Vorschlag
lead-tech mit Begründung, z. B. Deckel ab Last 6), (3) stdout-Rauschen `test_aufraeumen`.

Regelbezug: R335, R744, R750, R753, R755, E-068 · Kosten bei Irrtum: ein Worker-Deckel, der in der Praxis selten wirkt, bis Bündel 16 gemergt ist.

Entscheider: L0 · Anlass: Bericht lead-tech TOOL-BUENDEL-15 · ADR: —

## R758 · 2026-10-17 · ORT-A: Importzyklus TEX blockiert T09; Fix-Task FIX-TEX in C6, dann T09/T10; Puffer +2

Ruling: Bericht C5 (`.studio/qa/ort-a/messung-ort1.md`, Handoff `.studio/handoffs/2026-10-17-lead-tech-ORT-A-C5.md`): `feat/ort-a` lädt im Browser nicht — `ReferenceError: Cannot access
'TEX' before initialization` (`src/render/limits.ts:74`), Zyklus `iso.ts` → `ortsrand.ts` → `limits.ts` → `iso.ts`; Vitest und tsc sehen ihn nicht. T09 ungewertet (A-Werte nur Referenz).
→ Empfehlung angenommen: **FIX-TEX** in C6 — `TEX` nach `src/render/isoBase.ts`, Re-Export in `iso.ts`, `limits.ts` importiert aus `isoBase`; Test, der `iso.ts` zuerst in frischem
Modulgraphen lädt, mit Rot-Beleg; Task-Review. Danach T09 und (ohne E6-Bedarf) T10. Zusätzlich in C6: ein Browser-Smoke (Spiel lädt, keine Konsolenfehler) vor T09 als
Vorbedingung. Budget: 2 verbleibende Starts aus R756 + **2 zusätzliche** (ORT-A-Puffer überschritten: 14 von 12, bewusst, weil ein Ladefehler sonst erst im Release auffiele).
Lernpunkt an die Session-Retro: Render-Stränge laufen mehrere Tasks ohne Browser-Ladeprobe.

Regelbezug: R746, R750 V3, R756 · Kosten bei Irrtum: zwei Starts über Puffer.

Entscheider: L0 · Anlass: Bericht lead-tech ORT-A C5 · ADR: —

## R759 · 2026-10-17 · Gate Plan I-132: OK mit lead-qa-Auflagen; Umsetzung startet jetzt (17 + 1 Starts)

Ruling: `plan/i132` @ `7b7c3312` (Handoff `.studio/handoffs/2026-10-17-lead-tech-plan-I-132.md`) → **Gate Plan OK mit Auflagen**. lead-production: OK, Ownership eindeutig, ORT-A berührt
nur getrennte Hunks in `src/ui/app.ts`, Erweiterung 1 ohne Code (wer später merged, zieht die Save-Version nach; I-132 voraussichtlich v18). lead-qa: BEDENKEN ohne Blocker → Auflagen
verbindlich, eingearbeitet durch Controller C1 **vor T00** als Plan-Commit: (1) Index-Risiken: Obergrenze 150 und Schwelle 70 % mit Rückfall (Obergrenze senken oder «A1 sperrt nur
Gewürz und Stein») und Playtest-Trigger aus Spec §10; AK 6 emuliert den Sollfluss und belegt den Ausbaupfad nicht (so im Bericht). (2) T02: `trial-run` auf mindestens einem zweiten
Seed (mindestens «ohne Zufuhr scheitert», Ende-Tick und Abstand zur Schwelle), notfalls als einmalige Messung im Ledger; Minimum Einwohner/`e0` mitloggen. (3) T02: Test «speichern
mitten in der Auflage, laden, N Schritte» gegen ununterbrochenen Lauf. (4) T02: Laufzeit `trial-run.test.ts` messen, Timeouts aus dem Messwert. (5) T02: AK-11 (a) Zusicherung
behalten, `startTrial` nach Abbruch wieder `ok`. (6) T01: `isValidTrial` fordert bei `active !== null` `e0 > 0`. (7) T05: v17-Spielstand im Browser laden. Plan-Entscheide P-1 bis P-8
bestätigt. Budget: **18 Arbeiter-Starts** (17 laut Antrag + 1 für Auflage 2), 3 Controller-Instanzen, Parallelität 2 nur bei freiem Deckel 6 und Last < 8 (R708 V2).
Worktree `.worktrees/i132`, Branch `feat/i132` ab main mit Merge von `plan/i132`.

Regelbezug: gates.md Gate Plan, R553, R674, R698, R708, R745 · Kosten bei Irrtum: eine Obergrenze, die nach dem Playtest verschoben wird.

Entscheider: L0 · Anlass: Gate-Urteile lead-qa und lead-production gate-i132 · ADR: —

## R760 · 2026-10-17 · ORT-A C6 abgenommen (FIX-TEX, Smoke grün); T09 wartet auf ein Ruhefenster des Studios

Ruling: `feat/ort-a` @ `67cd0498` (Handoff `.studio/handoffs/2026-10-17-lead-tech-ORT-A-C6.md`) → abgenommen: `TEX` in `src/render/isoBase.ts`, Zyklus aufgelöst, `importZyklus.test.ts`
(3 von 4 rot vor dem Fix), Review OK, `npx vitest run` 4318 grün, Browser-Smoke Seed 7 ohne Konsolenmeldung. T09 nicht gelaufen (Last 6,2–9,5 nach einer Pause, R750 V3 korrekt).
Die Last stammt zum Teil aus dem Studio selbst (I-132, Werkzeug-Bündel). **Messfenster-Regel für diese Session:** L0 startet **C7** (T09, bei OK T10) erst, wenn kein anderer
Agent Testläufe fährt (I-132 zwischen zwei Tasks oder pausiert, Bündel 16 gemergt) und `lastgate.mjs` frei meldet; C7 läuft die Messung am Stück. C7 nimmt die zwei Kleinbefunde
mit (Trivial-Fix-Regel): `massif.ts` importiert `ISO_H` aus `isoBase` (Bestandszyklus `massif` ↔ `iso` weg), Pfad in `importZyklus.test.ts` unabhängig vom Arbeitsverzeichnis.
Budget: 2 verbleibende Starts aus R758.

Regelbezug: R329, R750 V3, R758 · Kosten bei Irrtum: T09 verschiebt sich in die Folgesession.

Entscheider: L0 · Anlass: Bericht lead-tech ORT-A C6 · ADR: —

## R761 · 2026-10-17 · Gate Merge TOOL-BUENDEL-16: OK, Merge lokal

Ruling: `tool/buendel-16` @ `bbc94841` (Handoff `.studio/handoffs/2026-10-17-lead-tech-TOOL-BUENDEL-16.md`; Paket-Review opus BEDENKEN → Fix `bbc94841`, frischer Delta-Review opus OK;
`make studio-test` 1008 grün, `studio-lint` Exit 0) → **Gate Merge OK**, `production-integrator` merged lokal in `.worktrees/integrate`, kein Push. Inhalt: R755 V1 (Ausnahme vom
«inaktiv»-Signal für studio-director/lead-qa bei lebenden Nachfahren oder Bash-Heartbeat ≤ 1800 s), R757 (`LOAD_CAP` 6,0 < `LOAD_MAX`, per Test gekoppelt), Rauschen
`test_aufraeumen`. Der Satz zur Ausnahme in `docs/studio/verbesserung.md` (Abschnitt inaktiv) trägt der studio-coach in der Session-Ende-Retro nach. Bis zum Merge-Bericht
committet L0 nicht auf main (Lernpunkt aus R757-Merge).

Regelbezug: R755, R757, E-068, R673 · Kosten bei Irrtum: ein hängender Bash-Aufruf bleibt bis zu 30 min ohne Inaktiv-Signal.

Entscheider: L0 · Anlass: Bericht lead-tech TOOL-BUENDEL-16 · ADR: —

## R762 · 2026-10-17 · TOOL-BUENDEL-16 gemergt; freie Plätze → Brainstorming «Stadtplanung» ohne Testläufe

Ruling: Merge `7c7e3188` (TOOL-BUENDEL-16, `make studio-test` 1008 grün, R761) bestätigt. Freie Plätze im Deckel 6 (R475, R698): **design-stadtplanung** an `lead-design` (opus,
Design-Lead; Budget 2 Starts, Parallelität 1): Designvorschlag mit 2–3 Varianten aus I-128, I-061, I-051, I-045 (Baustein laut R529/R737), Branch `design/stadtplanung`;
**keine Test- oder Sim-Messläufe**, damit das Ruhefenster für ORT-A T09 (R760) erreichbar bleibt. I-131 bleibt geparkt: I-112 ist live, die zweite Bedingung (Edikt-Überarbeitung mit
I-064) fehlt noch.

Regelbezug: R475, R529, R698, R737, R760 · Kosten bei Irrtum: ein Designvorschlag, der vor dem nächsten Meilenstein-Brainstorming veraltet.

Entscheider: L0 · Anlass: Merge-Bericht production-integrator, freie Kapazität · ADR: —

## R763 · 2026-10-17 · Gate Brainstorming «Stadtplanung»: Variante B «Wohnen und Werkstatt» als Meilenstein-Kandidat; D1–D8 angenommen

Ruling: `design/stadtplanung` @ `c8396fa6` (Handoff `.studio/handoffs/2026-10-17-lead-design-design-stadtplanung.md`) → **angenommen mit BEDENKEN der Selbstprüfung** (offene
Messungen M1, M2, M4). Kernbefund bestätigt: Nähe bringt heute nichts; Lärm allein ergibt eine Pflicht, keine Wahl. **D1** Variante B (Lärm senkt Belegung im Radius 3, vier
Werkstätten nur im Versorgungsradius, Park als Lärmschutz, Ebene aus I-045; 5 Pakete, ein Release); C erst nach Playtest von B. **D2** Strafe Belegung 75 % statt +15 s. **D3** alle vier
Werkstätten inkl. Weberei. **D4** Lärm nur bei stehendem, angebundenem, nicht stillgelegtem, nicht brennendem Betrieb. **D5** Park ohne Weg, brennt nicht, Radius 2, ab U2. **D6**
Balancing-Änderung erwartet, Ruling beim Gate Spec auf Basis M5. **D7** M1/M2 jetzt (lesend, ohne Sim-Lauf), dann Spec; M3–M5 erst nach ORT-A T09. **D8** Ideen-Status pflegt
lead-production beim Merge des Vorschlags. Kein Nutzer-Vorbehalt (§5.3: keine Kernsäule berührt). Fortsetzung: dieselbe lead-design-Instanz mit den 2 freien Starts
(design-economy-designer für M1/M2 auf Papier, design-spec-author für den Spec-Entwurf mit Platzhaltern für M3–M5).

Regelbezug: R529, R722, R737, R762, VERFASSUNG §5.3 · Kosten bei Irrtum: eine Spec, die nach M4 (Park als Reflexbau) nachgeschärft wird.

Entscheider: L0 · Anlass: Bericht lead-design design-stadtplanung · ADR: —

## R764 · 2026-10-17 · I-132 C1 abgenommen (T00–T03); C2 (T04) startet nach ORT-A T09

Ruling: `feat/i132` @ `cabbd8c8` (Handoff `.studio/handoffs/2026-10-17-lead-tech-I-132-C1.md`) → abgenommen: Auflagen R759 eingearbeitet (`075cba4d`); T01–T03 Review OK; Save v18 mit
Migration und Abweise-Test, Balancing grün. Auflage 2 erfüllt: ohne Zufuhr scheitert die Prüfung auf Seed 3 und Seed 1 gleich (Tick 400, Minimum 51 von `e0` 75); `trial-run.test.ts`
1,3 s. Abweichungen (zweiter Seed 1 statt 5, AK-11 mit 100 Kaufleuten, `recomputeConnectivity` vor dem Speichern-Test) als vertretbar übernommen. Fehlender Rundungstest
`perMin → 0` geht in T04. **C2 (T04, tech-ui-engineer) startet erst, wenn ORT-A C7 die Messung T09 abgeschlossen oder abgegeben hat** (R760: kein Testlauf neben der Messung; T00
trieb die Last auf 17). Budget: 6 von 18 Starts, Instanz 1 von 3. `SAVE_VERSION` 18 vor dem Merge gegen main + 1 prüfen (R674).

Regelbezug: R674, R759, R760, R750 V3 · Kosten bei Irrtum: I-132 verliert eine Stunde Wanduhr.

Entscheider: L0 · Anlass: Bericht lead-tech I-132 C1 · ADR: —

## R765 · 2026-10-17 · Gate Spec «Stadtplanung» (Variante B): OK mit Auflagen; Spec-Nachtrag ohne neues Gate; D6 erst nach M5

Ruling: `design/stadtplanung` @ `1f1b2c89` (Urteile lead-tech und lead-qa: je BEDENKEN, kein ZURÜCK) → **Gate Spec OK mit Auflagen**, Nachtrag durch `lead-design` (sonnet, Spec-Nachtrag)
ohne neues Gate, Prüfung der Auflagen im Gate Plan. **Technik:** A1 Save = `SAVE_VERSION` auf main + 1 beim Merge (R674; heute 19, falls I-132 vorher landet), Migration und AK-S1
parametrisiert («Vorversion = SAVE_VERSION − 1»); A2 alle Lesestellen der Belegungsgrenze in §4 (`unlocks.ts:61`, `population.ts:141`, `flow.ts:68`), Lärmquellen einmal je Schritt
sammeln; A3 neuer AK: Ladehinweis «n Werkstätten ausserhalb der Versorgung» (reiner Lesehelfer), Weiterlärmen stillstehender Werkstätten als bewusst benennen; A4 Park-Kategorie,
Ebenen-Taste, Cache bleiben Plan-Entscheide; Reihenfolge «stilllegen → ruhig» im selben Schritt als Plan-Prüfpunkt. **QA:** Messwert für AK-B5, Feldliste für AK-P3; AK-L9 als
`placeBuilding`-Test kennzeichnen; Playtest-Schritt «neues Spiel bis Minute 15: Steinbruch, Belegung fällt, Park hilft»; wertabhängige AKs (Radien, Kosten) lesen aus den Defs oder
tragen «wertabhängig, Anpassung per Ruling»; AK für alte Stände mit Häusern im Lärm; Randfälle Rundreise mit `noSupply`, Steuer «niedrig» im Lärm, Park bei negativem Geld, Pause;
M3/M4 mit mindestens 3 Seeds und beiden Controllern; Rückfall für den 75-%-Faktor; SP-5 erst nach M3–M6. **AK-Eindeutigkeit (R136/R417):** alle AKs der Spec tragen das Präfix
`AK-STADT-` (z. B. `AK-STADT-L1`); der Befehl aus gates.md muss danach 0 Kollisionen liefern. **D6 wird nicht jetzt entschieden**, sondern nach M5 mit Tabelle alt/neu/Differenz und
Begründung bei > 10 % (Schutz AK-W7 bleibt). **D9/D10** (Controller-Layouts als Testcode) angenommen, Risiko «keine Reserve» benannt; parametrisiertes Layout mit klarer
Fehlermeldung als Plan-Option.

Regelbezug: gates.md Gate Spec, R136, R417, R553, R674, R763 · Kosten bei Irrtum: ein Spec-Nachtrag mehr vor dem Plan.

Entscheider: L0 · Anlass: Gate-Urteile lead-tech und lead-qa gate-stadtplanung · ADR: —

## R766 · 2026-10-17 · Spec-Nachtrag «Stadtplanung» abgenommen; Plan jetzt (lead-tech opus)

Ruling: `design/stadtplanung` @ `75965223` → Nachtrag R765 vollständig (55 AKs mit Präfix `AK-STADT-`, 0 Kollisionen, Spec 39,3 KB, Messaufträge M3–M6 in Anhang 03). Rückfallreihenfolge
für den Lärmfaktor (0,85, dann `noiseRadius` 2, dann Controller-Layout) übernommen. **plan-stadtplanung** an `lead-tech` (opus, Tech-Lead beim Plan; Budget 1 Start für eine
Plan-Prüfung): Plan nach E-010 ab main mit Merge von `design/stadtplanung`; Zeilenverweise der Belegungsgrenze gegen den Code prüfen; SP-5 erst nach M3–M6; keine Testläufe während
der ORT-A-Messung.

Regelbezug: R674, R765, E-010 · Kosten bei Irrtum: ein Plan, der nach M3–M6 nachgeschärft wird.

Entscheider: L0 · Anlass: Bericht lead-design Spec-Nachtrag · ADR: —

## R767 · 2026-10-17 · ORT-A E6: Grenze relativ gerissen, absolut unkritisch → keine dritte Perf-Runde; absolute Release-Grenze; T10 und Strang k1 starten; I-132 C2 startet

Ruling: T09 (`.studio/qa/ort-a/messung-ort1.md`, Handoff `.studio/handoffs/2026-10-17-lead-tech-ORT-A-C7.md`): `patchMs` B/A 1,74–1,96 (Grenze 1,20), absolut 4,0–8,6 ms je Patch; Hitch
Σover25 = 0 in A und B; Render ±1 ms (Last). → **Option 3** statt T05b-Zusatzarbeit oder Saumreichweite: Die Spielerwirkung (kein Frame > 25 ms) ist erfüllt, eine dritte
Perf-Runde derselben Befundklasse widerspräche R735 V1/R739. Die relative Frühwarnung E6 (AK-17) wird für ORT-A ersetzt durch eine **absolute Release-Grenze in T23**:
`patchMs` ≤ 10 ms je Patch (Seeds 7, 14, Siedlung) und Σover25 = 0; reisst T23 sie, entscheidet L0 dann zwischen Zwei-Zonen-Ausbau und Saumreichweite. Spec-Abweichung AK-17
mit diesem Ruling; die Galerie-Werte gelten. Trivial-Fixes `23ce0ecc` gehen in den nächsten Task-Review. **ORT-A C8:** T10 (qa-playtester, Item-Zählung Siedlung), dann Strang k1
T11–T13 seriell; Budget **7 Starts** neu (ORT-A gesamt ≈ 39 von 57 laut Plan), Parallelität 1. **I-132 C2:** T04 jetzt (R764, Messung beendet), Parallelität 1 bis der Deckel frei ist.

Regelbezug: R705, R735 V1, R739, R746, R764 · Kosten bei Irrtum: ein Release, das in T23 an der absoluten Grenze scheitert und dann die verschobene Perf-Runde braucht.

Entscheider: L0 · Anlass: Bericht lead-tech ORT-A C7 (D-ORT1-E6) · ADR: —

## R768 · 2026-10-17 · ORT-A C8 durch Fremdlast blockiert; C9 in der Folgesession; Session-Ende eingeleitet (Kontext L0 25 %)

Ruling: Bericht C8 (Handoff `.studio/handoffs/2026-10-17-lead-tech-ORT-A-C8.md`): `lastgate.mjs` Exit 1 über ≈ 25 min (Last 11,4 → 6,6, Fremdprozesse apfsd, Dropbox, WebKit), eine Wartepause
verbraucht, nichts umgesetzt, 0 von 7 Starts. `D-ORT1-E6` gelöst (R767). → **C9 startet in der Folgesession**, sobald `node tools/render-qa/lastgate.mjs` Exit 0 meldet; Budget-Rest
7 Starts verfällt mit der Session und wird neu erteilt. Frage an die Retro: Braucht T10 (Browser-Sichtprüfung) dieselbe Lastgrenze wie eine Messung? Kontext L0 erreicht 25 %
(STUDIO.md «Sessiongrösse») → **Session-Ende eingeleitet**: keine neuen Pakete; laufende I-132 C2 und plan-stadtplanung schliessen ab oder pausieren mit Handoff; danach push-check
ohne Push (R514 V3, Werkzeug-Merges `43afeb6f`, `7c7e3188`), Kurz-Retro, state.md.

Regelbezug: R68, R329, R514 V3, R750 V3, R767 · Kosten bei Irrtum: ORT-A verliert eine Session Wanduhr.

Entscheider: L0 · Anlass: Bericht lead-tech ORT-A C8, Kontextgrenze · ADR: —

## R769 · 2026-10-17 · Kurz-Retro 21273458: V1–V3 angenommen; Cache-Write-Ad-hoc durch R750 V3 gedeckt

Ruling: Bericht `docs/studio/retros/2026-10-17-session-21273458-ende.md` (`9c3eeb16`) → angenommen. **V1:** Render-Pläne enthalten eine Browser-Ladeprobe nach höchstens 3
Render-Tasks und vor jeder Messung; Messgrösse 0 Ladefehler erst in Messung oder Release über 2 Render-Stränge, Frist 2026-11-30. **V2:** Handbuch: kein L0-Commit auf main während
eines Integrator-Merges; Integrator-Briefings nennen `.worktrees/integrate`; Messgrösse 0 neu gebaute Merges über 3 Merges, Frist 2026-11-15. V1 und V2 setzt der studio-coach als
Handbuch-Minor in der Folgesession um. **V3:** ORT-A C9 darf T10 (Item-Zählung und Sichtprüfung ohne Zeitwert) bei 1-min-Last ≤ 8 fahren, `uptime` vor und nach dem Lauf im
Bericht; Zeitwerte bleiben an `lastgate.mjs`; Frist 2026-10-24, Rückfall Warten auf `lastgate`. Hook-Ad-hoc «Cache-Write 5 min zwei Sessions rot» (26,7 %, Neuschreibung nach Pause
9,5 %) ist durch R750 V3 (Frist 2026-10-30) gedeckt, keine eigene Retro.

Regelbezug: R697, R750, R755, R768 · Kosten bei Irrtum: eine Item-Zählung, die unter Last ungenau ist und wiederholt wird.

Entscheider: L0 · Anlass: Kurz-Retro studio-coach RETRO-S-21273458 · ADR: —

## R770 · 2026-10-17 · Nutzer «weiter»: lastfreie Pakete statt Leerlauf bis I-132 C2 fertig ist

Ruling: Nutzer: «weiter» während des eingeleiteten Session-Endes (R768) → Auslegung: weiterarbeiten, ohne die Übergabegrenze (Kontext L0 ≈ 26 %) zu sprengen. Solange I-132 C2 (Final-Review)
läuft und die Last bei ≈ 14 liegt, starten nur **lastfreie** Pakete (keine Test-, Mess- oder Browserläufe): (a) **gate-stadtplanung-plan** — Gate Plan `plan/stadtplanung` @ `3824007c` durch
lead-qa und lead-production (sonnet, nur lesen); (b) **HANDBUCH-1.64** — studio-coach setzt R769 V1 und V2 als Handbuch-Minor um. Danach Session-Ende wie R768 (push-check ohne Push im
Ruhefenster, state.md). ORT-A C9 bleibt in der Folgesession.

Regelbezug: R68, R434, R768, R769, VERFASSUNG §5.2 · Kosten bei Irrtum: zwei Berichte mehr im L0-Kontext vor der Übergabe.

Entscheider: L0 · Anlass: Nutzerauftrag «weiter» · ADR: —

## R771 · 2026-10-17 · Gate Plan «Stadtplanung»: OK mit Auflagen; Umsetzung ab der Folgesession (38 Starts)

Ruling: `plan/stadtplanung` @ `3824007c` (Handoff `.studio/handoffs/2026-10-17-lead-tech-plan-stadtplanung.md`; lead-qa und lead-production je BEDENKEN, kein ZURÜCK) → **Gate Plan OK mit
Auflagen**, eingearbeitet durch Controller C1 **vor T00** als Plan-Commit: (1) Browser-Ladeprobe (qa-playtester, Laden + Konsole) nach T10 und vor T11 (R769 V1), zählt zugleich als
Playtester-Check der UI-Tasks T08/T09 (in deren Task-Dateien vermerken); (2) T02/T04: `messung-pins.md` mit Alt-Wert aus main je Zeile, unerwartete Pin-Verschiebung ist Befund an
lead-tech (T04 erwartet nur `balance-edicts`), `make check` am Ende zitiert die bewegten Pins; (3) T06: Test «gleicher Seed, speichern und laden mittendrin, Fortsetzung JSON-gleich»
mit Haus im Lärm, Park und Werkstatt in `noSupply`; (4) T11/T14: M3 und M5 auf demselben Commit von `mess/stadtplanung-basis`, Commit im Kopf von `anhang-04-messung.md`; T11 bestimmt
zuerst die tragfähigen Seeds (< 3 → Blocker an L0); (5) Spec §9: AK-Summe 53 (42 Vitest) statt 55/44 korrigieren. Plan-Entscheid-Entwürfe 1–6 angenommen (Ownership-Ausnahmen,
vorläufige Pins mit Marker «vorläufig bis Ruling D6» und Gate-Merge-Bedingung `rg` = 0, A2 als «höchstens zwei Sammlungen je Schritt» mit M6 als Kontrolle, Controller vor Regel,
Start nach ORT-A T09 — erfüllt —, Render-Tasks T09/T10 nach ORT-A-Merge, Merge-Reihenfolge ORT-A → I-132 → Stadtplanung; kein I-132-Merge zwischen T02 und T04, nach jedem Merge
`make check`). ≈ 660 Tools bewusst akzeptiert. Budget **38 Starts** (37 + Ladeprobe), Parallelität 2, 8 Controller-Instanzen — Freigabe beim Start in der Folgesession.

Regelbezug: gates.md Gate Plan, R553, R674, R765, R766, R769 V1 · Kosten bei Irrtum: ein Merge-Konflikt in `sprites.ts`/`iso.ts`, der mehr als eine Stelle kostet.

Entscheider: L0 · Anlass: Gate-Urteile lead-qa und lead-production gate-stadtplanung-plan · ADR: —

## R772 · 2026-10-17 · I-132 C2 abgenommen (Final-Review OK); Gate Merge und Release-Check REL-27 in der Folgesession

Ruling: `feat/i132` @ `b8fabe4e` (Handoff `.studio/handoffs/2026-10-17-lead-tech-I-132-C2.md`) → abgenommen: T04–T06 fertig, Final-Review opus OK (vier niedrige Befunde in
`docs/beobachtungen.md` auf dem Branch), Playtest inkl. v17-Spielstand ohne Absturz, `SAVE_VERSION` 18 = main + 1, Probe-Merge gegen main konfliktfrei. **Entscheid:** Zugang zur
Meisterprüfung ab `monumentDone`, auch in der Gewürz-Phase; der Prüfungs-Chip ersetzt dort den Ziel-Chip, sein Titel nennt den Zielstand (Spec-Wortlaut). Offen vor dem Merge: voller
`make check` auf `b8fabe4e` (letzter Lauf vor `c46fa474`; Final-Review fuhr wegen Last nur 533 gezielte Tests) und Browser-Nachprüfung des Hand-Cursors. **Folgesession:** ein
`lead-qa`-Start für Gate Merge I-132 und Release-Check **REL-27** (I-132 + TOOL-BUENDEL-15/16) im Ruhefenster, danach Merge, push-check, Push (R335). Die Merge-Reihenfolge aus R771
(ORT-A → I-132 → Stadtplanung) betrifft nur den Stadtplanung-Strang; I-132 wartet nicht auf ORT-A (R759). Befund an die Retro: Für frische Delta-Reviews auf opus fehlt ein Einsatz in
der Modelltabelle; C2 nutzte «Final-Review».

Regelbezug: R674, R697, R759, R764, R771 · Kosten bei Irrtum: ein Merge, dessen voller `make check` in der Folgesession rot wird.

Entscheider: L0 · Anlass: Bericht lead-tech I-132 C2 · ADR: —

## R773 · 2026-10-17 · N-101 erledigt; Nutzer «Studio starten, am nächsten Release weiter»: REL-27 zuerst, lastfreie Pakete parallel

Ruling: (1) **N-101** beantwortet (Nutzer: einverstanden, verwerfen) → I-094 bleibt verworfen im Archiv (R670), erledigt. (2) Auslegung «am nächsten Release weiterarbeiten» als
**REL-27 = I-132 + TOOL-BUENDEL-15/16** (R772) im jetzigen Ruhefenster (1-min-Last 3,8): ein `lead-qa`-Start (sonnet) für vollen `make check` auf `feat/i132` @ `b8fabe4e`,
Browser-Nachprüfung Hand-Cursor (qa-playtester), Gate Merge I-132 und Release-Check REL-27; danach Merge durch `production-integrator`, `make push-check`, Push (R335). Bis
`push-check` Exit 0 starten keine Umsetzer oder Controller (R464); ORT-A C9 und Stadtplanung-Umsetzung danach. (3) Parallel nur lastfreie Pakete (Deckel 8, R475): **IDEEN-13**
(lead-design opus, 2 Scouts, R445; letzte Runde vor einer Session), **RULINGS-ARCHIV** (lead-production, Aufräumen fällig: 173 Rulings / 203 KB; im Worktree, nur Rulings vor R700
ins Archiv verschieben, damit L0-Anhänge am Ende konfliktfrei bleiben), **plan-stadtplanung-auflagen** (lead-tech opus arbeitet die Auflagen 1–5 aus R771 als Plan-Commit ein;
Auslegung von R771 «Controller C1 vor T00» als Plan-Arbeit ohne Testlauf, damit sie während der Push-Sperre laufen darf), **RETRO-FAELLIG** (studio-coach: Budget lead-tech 5 von 3,
fehlender Modell-Einsatz «Delta-Review opus» aus R772; Cache-Write durch R750 V3 gedeckt, R769).

Zweck der Anweisung: das nächste Release ausliefern und das Studio auslasten; Auslegung widerspricht ihm nicht, weil REL-27 der einzige abnahmebereite Stand ist und die Parallelpakete
keine Testlast erzeugen.

Regelbezug: R335, R445, R464, R475, R670, R771, R772, VERFASSUNG §5 · Kosten bei Irrtum: Plan-Auflagen, die C1 vor T00 noch einmal anfassen muss (≈ 1 Start).

Entscheider: L0 · Anlass: Nutzerauftrag · ADR: —

## R774 · 2026-10-17 · RULINGS-ARCHIV gemergt; Ad-hoc-Retro fällige Punkte: V1 angenommen, V2 ins nächste Werkzeug-Bündel

Ruling: (1) `docs/rulings-archiv-773` @ `06d3478d` (R601–R699 ins Archiv, `rulings.md` 74 Rulings / 91 KB, Aufräumprüfung Exit 0) vor dem REL-27-Push auf main gemergt (`10a6ba57`),
abweichend von R773 «nach dem Push», damit der Stand mit dem einzigen Push der Session (R335) live geht; reine Doku. (2) Retro `RETRO-ADHOC-FAELLIG-17` (studio-coach): Alarme
kamen wieder, weil frühere Ad-hoc-Retros mit leeren bzw. falschen Trigger-IDs quittierten; Budget lead-tech 5/3 gehört zu TOOL-GUARD-REDACT (ca9d40c8), durch R725/R732 bewilligt,
Hebel R735 V1/V3. **V1 angenommen:** opus-Einsatz `Delta-Review (frisch, nach BEDENKEN oder ZURÜCK)` in die Modelltabelle (Handbuch-Minor 1.65), Umsetzung studio-coach im
Worktree mit `make studio-test` inkl. modelguard-Tests, Merge vor dem push-check; Messgrösse 0 Guard-Blocks über 5 Controller-Pakete bis 2026-11-30. **V2** (`log.py retro` warnt
bei `adhoc` ohne Trigger; Trigger-IDs aus `state.incidents[].id`) ins nächste TOOL-BUENDEL. Cache-Write: Messauftrag mit Frist 2026-10-30 (R750 V3), drei rote Sessions in Folge
vermerkt.

Regelbezug: R335, R428, R471, R735, R750, R772, R773 · Kosten bei Irrtum: ein Handbuch-Minor, der den Modell-Guard für einen Einsatz falsch parst (studio-test deckt das).

Entscheider: L0 · Anlass: Bericht lead-production RULINGS-ARCHIV, Bericht studio-coach RETRO-FAELLIG · ADR: —

## R775 · 2026-10-17 · Stadtplanung: Plan-Auflagen R771 eingearbeitet und abgenommen; Entwürfe (a)–(d) angenommen

Ruling: `plan/stadtplanung` @ `b27e7e8f` (Handoff `.studio/handoffs/2026-10-17-lead-tech-plan-stadtplanung-auflagen.md`) → Auflagen 1–5 aus R771 erfüllt, kein neues Gate. Entwürfe
angenommen: (a) T12 mitgezogen (Auflage 4 betrifft ihn); (b) Ladeprobe als eigener Task T10b ohne Umnummerierung (R769 V1); (c) Seed-Probe in T11 mit 3 000 Ticks, Blocker in T12
bleibt Rückfallnetz; (d) die AK-Zahl 55/44 in R766 ist durch R771 auf 53/42 korrigiert. Umsetzung (Controller C1 ab T00, Budget 38 Starts, Parallelität 2) startet erst nach
`make push-check` Exit 0 für REL-27 (R464). Der Plan-Index liegt mit 28,8 KB über der Task-Grenze von 10 KB (R417), wie schon beim Gate R771 akzeptiert; Task-Dateien ≤ 8,3 KB.

Regelbezug: R417, R464, R766, R769 V1, R771, R773 · Kosten bei Irrtum: eine Seed-Probe, die einen erst im vollen Lauf ausfallenden Seed übersieht (fängt T12).

Entscheider: L0 · Anlass: Bericht lead-tech plan-stadtplanung-auflagen · ADR: —

## R776 · 2026-10-17 · Gate Ideen-Runde IDEEN-13: Rangliste angenommen; Kurzdesign I-136 und Brainstorming I-144 jetzt

Ruling: `docs/ideen-13` @ `e62a7c73` (Handoff `.studio/handoffs/2026-10-17-lead-design-IDEEN-13.md`) → angenommen und von L0 auf main gemergt (`8a594330`, reine Doku).
Einplanen: **I-136** Fernkarte mit Fahrzeit und roter Lagerzahl (Häppchen, Kurzdesign Stufe leicht jetzt, lead-design sonnet); **I-137** Abstiegs-Dämpfer (Häppchen nach ORT-A
T10); **I-144** Zukauf-Ordnung als Wirtschafts-Brainstorming Stufe voll jetzt (lead-design opus mit `design-economy-designer`, drei Fassungen gegeneinander gerechnet; Baseline-
und Balancing-Neumessung braucht ein eigenes Ruling in der Spec). Beipack: I-138 (nur Textzeile) mit dem Umschalt+R-Befund; I-106 bleibt Beipack-Kandidat. Parken: I-139 bis I-132
live, I-111 bis I-144 entschieden. Verworfen: I-141, I-142, I-143, I-145 (reine Geld-Senken tragen nicht, Leitbefund R722 bestätigt). Beide Design-Pakete sind lastfrei und laufen
während der REL-27-Push-Sperre (R464). Budget: design-I-136 2 Starts, design-I-144 3 Starts.

Regelbezug: R445, R464, R475, R571, R599, R722 · Kosten bei Irrtum: ein Brainstorming (≈ 80 Tools), dessen Ergebnis I-144 doch verwirft.

Entscheider: L0 · Anlass: Bericht lead-design IDEEN-13 · ADR: —

## R777 · 2026-10-17 · Gate Merge I-132 und Release-Check REL-27: OK; Merge, push-check, Push

Ruling: `feat/i132` @ `b8fabe4e` (Handoff `.studio/handoffs/2026-10-17-lead-qa-gate-REL-27.md`) → **Gate Merge OK, Release-Check REL-27 OK**: voller `make check` Exit 0 (4460 Vitest,
studio-test 997, Balancing unverändert), Probe-Merge konfliktfrei, `SAVE_VERSION` 18 = main + 1 mit getesteter Migration v17→v18, Browser-Check (Hand-Cursor, Zugang ab
`monumentDone`, drei v17-Stände) ohne Befund. **REL-27 «Meisterprüfung»** = I-132 + TOOL-BUENDEL-15/16, dazu die Doku-Merges dieser Session (R774–R776) und, falls bis zum
Integrator-Start abgenommen, Handbuch 1.65 (R774 V1). `production-integrator` merged `feat/i132` im Worktree `.worktrees/integrate`, holt main, fährt `make push-check` und pusht genau
den geprüften Hash nach `origin/main` (R335, einziger Push der Session); bis zum Merge-Bericht committet L0 nichts auf main (R769 V2). Zeitreserve: die strenge Bewertung im
push-check entscheidet (Warnungen im Gate-Lauf nur Render-Altlasten bei Last 5–10). Restrisiko: Laden über den manuellen Slot im Browser ungeprüft (Sim-Test deckt es). Danach
Erweiterung 1 bekommt beim Merge v19 (R519).

Regelbezug: R335, R464, R517, R519, R565 V2, R769 V2, R772 · Kosten bei Irrtum: ein Live-Release mit Ladefehler im manuellen Slot (Hotfix ≈ 1 Paket).

Entscheider: L0 · Anlass: Bericht lead-qa gate-rel-27 · ADR: —

## R778 · 2026-10-17 · I-136 «Fernkarte»: Gate Spec und Gate Plan OK mit Auflagen; Handbuch 1.65 gemergt

Ruling: (1) **Gate Spec I-136** (`design/i136` @ `6c2491dd`, lead-qa): OK mit zehn nicht blockierenden Auflagen (seaLanes-Zählung injizierbar und Frame-Pfad-Test, Randfälle kein
Kontor / ein Angebot / kein Schiff, Tooltip und Entfernen von `far-stock--low`, Golden-String AK-F4, AK-F10 präzisiert, Spans-Zusammensetzung, Screenshots beider Werte, Konflikt
benannt, `farOrderText`-Rotfärbung als Beobachtung statt Umfang). Grösse S, kein Save, keine Baseline. (2) **Gate Plan I-136** (`plan/i136` @ `65ee7301`; lead-qa OK mit Hinweisen
A–C, lead-production OK mit Auflage 1): angenommen, P-1 (zwei Kind-Spans, FakeDom) bestätigt. Auflagen an den Umsetzer: Rot-Belege mit echtem Assertion-Fehler (leerer Stub statt
fehlender Datei), Golden-Werte per Handrechnung plausibilisiert, Spec AK-F6 und Plan-Abschnitt «Konflikte» im ersten Commit nachgezogen (kein Dateiüberlapp mit Stadtplanung nach
T08-Dateiliste, Prüfung beim Gate Merge per `git diff --name-only`). Merge-Reihenfolge frei gegenüber ORT-A und Stadtplanung (wer fertig ist, zuerst). Budget 4 Starts
(Umsetzer, ein Paket-Review nach E-068, Playtester, Puffer), Parallelität 1; L0 briefet den Umsetzer direkt (Stufe leicht). (3) **Handbuch 1.65** (`docs/handbuch-1.65` @
`b8c4a586`, studio-test 1009 OK) lokal gemergt (`abe7ee0d`); Wortlaut des Einsatzes `Delta-Review frisch` statt der Klammerform aus R774, weil der Guard als Präfix vergleicht.

Regelbezug: R392, R395, R464, R693, R774, gates.md Gate Spec und Gate Plan · Kosten bei Irrtum: ein UI-Häppchen, dessen Frame-Cache-Test im echten DOM nicht greift (Playtest T04 fängt es).

Entscheider: L0 · Anlass: Berichte lead-design design-I-136, lead-qa gate-I-136-spec und gate-I-136-plan, lead-production gate-I-136-plan, studio-coach HANDBUCH-1.65 · ADR: —

## R779 · 2026-10-17 · REL-27 live; ORT-A C9 und Stadtplanung C1 gestartet

Ruling: **REL-27 «Meisterprüfung» live**: Merge `add28350` (I-132), `make push-check` Exit 0 (check 4460 Tests, check-ci-perf Exit 0), Push `6f14a354..add28350`, CI 39033715341 und
Pages 39034234219 grün (automatisch). Damit ist die Push-Sperre R464 aufgehoben; der einzige Push dieser Session ist verbraucht (R335), alles Weitere bleibt lokal. Gestartet: **ORT-A
C9** (lead-tech sonnet, 7 Starts, T10 → k1 T11–T13) und **Stadtplanung Instanz I** (lead-tech sonnet, 38 Starts gesamt, Parallelität 2, T00–T02). I-136-Umsetzung startet, sobald
ein Platz im Deckel frei ist und die 1-min-Last < 8 liegt (R708 V2). Befund an die Retro: Der Hook meldete «production-integrator inaktiv», während `make push-check` als ein
langer Bash-Aufruf ohne Heartbeat lief (7:47).

Regelbezug: R335, R464, R708 V2, R771, R777 · Kosten bei Irrtum: drei Teststränge gleichzeitig, die Messfenster von ORT-A T10 und Stadtplanung T02 belegen.

Entscheider: L0 · Anlass: Bericht production-integrator REL-27 · ADR: —

## R780 · 2026-10-17 · Gate Brainstorming I-144 «Zukauf-Ordnung»: verworfen; I-110, I-111, I-130, I-134 geparkt mit neuem Auslöser

Ruling: `design/i144` @ `43264557` (Handoff `.studio/handoffs/2026-10-17-lead-design-design-I-144.md`, Rechnung `docs/superpowers/specs/2026-10-17-i144-rechnung.md`) → **verworfen**
(A, B, C), auf main gemergt als Beleg. Befund: Vollzukauf ist heute schon 1,6- bis 2,7-mal so teuer wie Bauen; die Wahl fehlt, weil nach dem Kaufleute-Ziel (ab min 19,2) kein Geld
mehr knapp ist. (A) Einkaufsplätze laufen mit Startbelegung fest oder entarten zu «Gewürz + X», (B) Konsumgüter-Staffel öffnet kein Wahlfenster, (C) `BUY_RISE` 2 reisst das Sieg-Gate
(Tick 8450 > 7500, bestätigt R571). Fassung B als Bremse wird nicht gebaut (kleiner Nutzen). **Folge:** I-110, I-130, I-134 (warteten auf `BUY_RISE` > 0) und I-111 werden
**geparkt bis «Geld bindet nach dem Kaufleute-Ziel»** statt verworfen — das Spätspiel-Geldproblem ist jetzt zweimal (I-094, I-144) als Kernursache belegt und gehört in ein eigenes
Wirtschafts-Brainstorming, sobald Stadtplanung live ist (Lärm/Parks schaffen ggf. neue Bindung). Status in `docs/ideen.md` zieht die nächste Ideen-Runde nach (Pool-Pflege R599).
Studio-Idee, daher keine Kenntnis an den Nutzer nötig.

Regelbezug: R571, R599, R670, R722, R776, gates.md Gate Brainstorming · Kosten bei Irrtum: vier geparkte Ideen, die mit dem neuen Auslöser nie wieder geprüft werden.

Entscheider: L0 · Anlass: Bericht lead-design design-I-144 · ADR: —

## R781 · 2026-10-17 · I-136 abgenommen; Gate Merge in der Folgesession (Ampel gelb, Push verbraucht)

Ruling: `feat/i136` @ `6f7bbc21` → abgenommen: Final-Review opus BEDENKEN (arc42-Tabelle neu umgebrochen, zwei niedrige), Fixes `19a2fa30`/`e2849686`/`6f7bbc21`, frisches Delta-Review
opus OK (Handbuch 1.65 «Delta-Review frisch»); Browser-Check OK (AK-F8–F10, Fahrzeit 27 s / 36 s = Inselkarte, Rot `rgb(255, 59, 92)` und zurück, keine Mutation im Leerlauf, v18 lädt);
gezielte Tests 103 grün, `src/sim/` unberührt. Diff 20 Dateien +623/−28. **Gate Merge** (voller `make check` auf der Branch) und lokaler Merge erst in der Folgesession als Teil
von **REL-28**, weil der Push dieser Session verbraucht ist (R335) und die Ampel gelb steht (keine neue Welle, R69); ein lokaler Merge jetzt bringt dem Spieler nichts. Drei niedrige
Befunde in `docs/beobachtungen.md`. Budget I-136: 4 von 4 Starts verbraucht (Umsetzer, Final-Review, Playtester, Delta-Review), Fix-Runde als Fortsetzung.

Regelbezug: R69, R335, R673, R693, R774, R778 · Kosten bei Irrtum: I-136 kommt eine Session später live.

Entscheider: L0 · Anlass: Berichte qa-code-reviewer (Final- und Delta-Review), qa-playtester, tech-ui-engineer I-136 · ADR: —

## R782 · 2026-10-17 · ORT-A C9: T10 und T11 abgenommen; `roadCenter` nach `isoBase.ts`; T12/T13 in der Folgesession

Ruling: Bericht lead-tech ORT-A C9 (Handoff `.studio/handoffs/2026-10-17-lead-tech-ORT-A-C9.md`) → **T10** (Browser-Check BEDENKEN niedrig: Saum dezent, Fixture ohne Bauland in Versorgung,
Beobachtung eingetragen) und **T11** (`feat/ort-a-k1` @ `c2756d1e`, Review OK inkl. `23ce0ecc`, Zeiten ohne Rückgang) abgenommen. Entscheide: (1) **`roadCenter` zieht nach
`src/render/isoBase.ts`**, `sprites.ts` re-exportiert es — vermeidet den Importzyklus `roadShape` ↔ `sprites` wie bei FIX-TEX (R760); die Sperre in der T12-Task-Datei ist damit
aufgehoben, Änderung als eigener `refactor:`-Commit vor T12. (2) T11-Abweichungen bestätigt: Welle Amplitude 0,04 / Periode 0,6 (AK-19 sonst 0,505 > 0,5), `edges` als geschlossene Ringe
(T12/T13 richten sich danach), AK-28-Sackgasse als Halbellipse ab Kachelmitte (Task-Text «0,5 ± 0,04 bis zum Ende» gilt bis zur Kachelmitte). lead-art erhält die Welle zur Kenntnis mit
dem nächsten Art-Start. (3) **T12/T13 in der Folgesession**: 1-min-Last 7,5–9,6 (Fremdlast), L0-Kontext an der Übergabegrenze (≈ 25 %, R768); Restbudget 4 verfällt, neu erteilen.
Befund an die Retro: T11-Tests entstanden nach der Implementierung, Rot-Beleg nachträglich per Stub (zwei Tests waren vakuös grün und wurden nachgeschärft) — Test-first-Regel verletzt.

Regelbezug: R395, R410, R708 V2, R760, R767, R768 · Kosten bei Irrtum: ein Re-Export, der einen weiteren Zyklus in `isoBase.ts` erzeugt (`make check` fängt ihn).

Entscheider: L0 · Anlass: Bericht lead-tech ORT-A C9 · ADR: —

## R783 · 2026-10-17 · Nutzer «mach weiter»: ORT-A C10 (roadCenter, T12, T13) und Stadtplanung C1 starten; REL-28 im Ruhefenster

Ruling: Auslegung «mach weiter» als Fortsetzung des Plans aus R781/R782/R775 ohne neuen Auftrag. Zweck der Anweisung: Arbeit ohne Rückfrage voranbringen; Auslegung widerspricht ihm
nicht, weil nur bereits gegatete Pakete starten. (1) **ORT-A C10** an `lead-tech` (Controller sonnet): `refactor:`-Commit `roadCenter` → `src/render/isoBase.ts` (R782), dann T12 und T13
seriell auf `feat/ort-a-k1` @ `c2756d1e`, je Umsetzer + Task-Review; Budget **5 Starts** (4 + 1 Delta-Review frisch opus), Parallelität 1; Messungen nur bei 1-min-Last ≤ 4. (2) **Stadtplanung
C1** an `lead-tech` (Controller sonnet) ab T00 auf Basis `plan/stadtplanung` @ `b27e7e8f` (R775), Budget **38 Starts**, Parallelität 2; T09/T10 erst nach ORT-A-Merge. Die Push-Sperre
R464 gilt nicht mehr (REL-27 live, R779). (3) **REL-28** (I-136 Gate Merge mit vollem `make check` auf `feat/i136` @ `6f7bbc21`, Merge, `make push-check`, Push) startet L0, sobald die
1-min-Last ≤ 8 ist (jetzt 20, Fremdlast); bis dahin keine `make check`-Läufe. Deckel 6 gleichzeitige Agenten (R698).

Regelbezug: R464, R698, R775, R779, R781, R782 · Kosten bei Irrtum: zwei Controller teilen sich bei hoher Last die Testzeit; schlimmstenfalls warten Tasks auf ein Ruhefenster.

Entscheider: L0 · Anlass: Nutzer «mach weiter» · ADR: —

## R784 · 2026-10-17 · REL-28 Gate Merge I-136 ZURÜCK: Fernlager-Zahl in `--tone-bad` statt Signalrot (Variante b)

Ruling: Bericht lead-qa REL-28 (Handoff `.studio/handoffs/2026-10-17-lead-qa-gate-REL-28.md`) → ZURÜCK angenommen: `make check` auf `feat/i136` @ `6f7bbc21` rot an
`tests/ui/contrast.test.ts` «Spec 9.1 Signalrot ist nie Textfarbe» (`.far-stock--low { color: var(--signal-red) }`, I-136 T03). Entscheid **Variante (b)**, nicht die empfohlene
Ausnahme (a): Die Regel M7 §9.1 bleibt ohne Ausnahme; die Zahl wird mit dem vorhandenen Ton `--tone-bad` (#b3261e) gefärbt, der als Textton auf Pergament schon kontrastgeprüft ist
(AK-PU-19). Damit bleibt die Zahl rot, die Spec-Regel gilt ohne Sonderfall und es braucht keinen neuen Test. AK-F9 in der I-136-Spec wird auf «computed color = `--tone-bad`» nachgeführt.
Fix an `lead-tech` (sonnet, 1 Start Umsetzer): CSS-Zeile + Spec-AK + ggf. Browser-Erwartung `rgb(179, 38, 30)`; Diff ≤ 20 Zeilen prüft der Lead am Diff (kein Delta-Review), dann
voller `make check`; danach setzt `lead-qa` das Gate nur für den Rest fort (Integrator, `make push-check`).

Regelbezug: R781, M7-Spec §9.1, Handbuch «Kleine Fixes ≤ ~20 Zeilen» · Kosten bei Irrtum: ein dunkleres Rot fällt weniger auf als Signalrot; Sichtprüfung im nächsten Playtest.

Entscheider: L0 · Anlass: Bericht lead-qa REL-28 · ADR: —

## R785 · 2026-10-17 · Gate Merge REL-28 (I-136) OK; Kandidat im Worktree `integrate` auf lokalem main; Push-Auftrag

Ruling: Gate Merge I-136 → **OK** (lead-qa: Delta `6f7bbc21..c51af713` eine Farbzeile + Doku, `make check` EXIT 0, R784 erfüllt). Arbeitsort-Frage des Integrators: weder Ausnahme
von der Persona noch Handarbeit von L0 — der Integrator bleibt in `.worktrees/integrate` (R565 P1), setzt den Kandidaten aber auf **lokales `main`** statt `origin/main`
(`git -C .worktrees/integrate checkout --detach main`), damit die ungepushten Doku-Commits R780–R785 mitkommen; dann `git merge --no-ff feat/i136` (@ `c51af713`), `make check`,
`make check-ci-perf`, Merge-Commit. Der Hash dieses Merge-Commits gilt als Ruling-Hash. **Push-Auftrag:** nach `make push-check` EXIT 0 (bei 1-min-Last > 4 per until-Schleife auf
Ruhefenster warten) `git push origin <geprüfter Hash>:main`, dann CI und Pages prüfen. L0 zieht danach lokales `main` per `git merge --ff-only origin/main` nach. Bis zum Merge-Bericht
committet L0 nichts auf `main` (R697). Abweichung Persona Schritt 1 (`origin/main` → lokales `main`) gilt nur, wenn lokales `main` ausschliesslich ungepushte Doku-Commits über
`origin/main` trägt.

Regelbezug: R335, R565 P1/V2, R697, R781, R784 · Kosten bei Irrtum: ein Doku-Commit mehr im Release-Push (CI ignoriert reine Doku nicht, da I-136 Code enthält — ein Lauf).

Entscheider: L0 · Anlass: Bericht lead-qa REL-28 (Fortsetzung) · ADR: —

## R786 · 2026-10-17 · ORT-A C10 abgenommen (k1 nach `feat/ort-a` @ `cb0cc48e`); C11: Browser-Check k1, T14, Strang k2

Ruling: Bericht lead-tech ORT-A C10 (Handoff `.studio/handoffs/2026-10-17-lead-tech-ORT-A-C10.md`) → abgenommen, `make check` EXIT 0 bei Last 6,15. Entwürfe: (1) T12-Abweichungen
angenommen (Argument `{zoom}`, PolyPath ohne Path2D, Ebenenreihenfolge über alle Blöcke, keine KS3 im Kern, `ROAD_FADE_COLOR`). (2) Test-Pins in `a3bae764` angenommen: AK-01-Hashes
ändern sich zwingend durch den Wegfall der Konturstriche (AK-18), Salze 61/62 folgen der Verschiebung nach `isoBase.ts` (R782); alte Werte bleiben im Kommentar. (3) T13-Abweichungen
angenommen (Saumbreiten 0,17/0,14/0,11, Saumfarbe als Mischung zur Erde); `lead-art` zur Kenntnis mit dem nächsten Art-Start. (4) Niedrige Reviewhinweise und die zwei Beobachtungen
gehen nach `docs/beobachtungen.md` (Rauschen nur nahe Schwelle; Saum bei Wasseranteil; `edge.way` aus `occ`; Cache-Obergrenze ohne Test); die drei neuen langsamen Tests (3,9 s / 4,4 s /
2,3 s) gehören zu ZEITRESERVE-PFLEGE. **Korrektur Lead-Aussage:** Stadtplanung T09/T10 warten auf den Merge von ORT-A nach **main** (R783), nicht auf den Strang-Merge.
**C11** an `lead-tech` (sonnet): Browser-Check k1 durch `qa-playtester` (Füllregel bei überlappenden Wegen, Zoom 0,75, Nähte an 8er-Blockgrenzen, Wasser-/Sandkante, Übergang am
Gebäude) parallel zu Strang k2 (T15, T16 je Umsetzer + Review); T14 (Messung k1) nur bei Last ≤ 4, sonst nach hinten. Budget **7 Starts**, Parallelität 2.

Regelbezug: R424 (≤ 2 Browser-Läufe), R782, R783 · Kosten bei Irrtum: ein Browser-Befund in k1 zwingt k2 zu einer Nacharbeit.

Entscheider: L0 · Anlass: Bericht lead-tech ORT-A C10 · ADR: —

## R787 · 2026-10-17 · R464 nachgezogen: Umsetzer-Stopp bis REL-28-Push

Ruling: L0 hat mit R786 (ORT-A C11) Umsetzer gestartet, obwohl seit R785 ein Push ansteht — Verstoss gegen R464. Korrektur: beide Controller (ORT-A, Stadtplanung C1) starten bis zum
REL-28-Push keine neuen Umsetzer, Reviews oder `make check`; Laufendes endet regulär. Befund an die Session-Retro: Last 11–15 entsteht teils aus eigenen Testläufen und blockiert das
Push-Ruhefenster (≤ 4).

Regelbezug: R464, R785, R786 · Kosten bei Irrtum: ORT-A und Stadtplanung stehen bis zum Push still.

Entscheider: L0 · Anlass: Last 14,5 bei wartendem Integrator · ADR: —

## R788 · 2026-10-17 · ORT-A C11 Zwischenstand: k2 rot (paveImage), Entwürfe angenommen, Sackgassen-Lappen bei T20b mit lead-art

Ruling: Bericht lead-tech ORT-A C11 (Handoff `.studio/handoffs/2026-10-17-lead-tech-ORT-A-C11.md`) → T15/T16 bleiben abgenommen, k2 aber nicht gemergt: `make check` rot an
`tests/render/sprites-kanten.test.ts:134` (AK-L3-a, `paveImage` zeichnet einen 114-Punkte-Strich). Fix-Runde am T15-Umsetzer (Fortsetzung) nach dem REL-28-Push, Test bleibt
unverändert; dann `make check` und Merge k2. Entwürfe: (1) T16 Kernschatten über `SHADOW` + `globalAlpha` angenommen (Bestandsfilter bleiben gültig, Rechnung geprüft); (2) neue Pins
`bildmodus-ks.json`, `schatten-ks.json`, `HOME_CALLS*`, `shadowFills` angenommen; (3) Strangabschluss-`make check` bleibt Pflicht (wirkt: fand den Querbefund). (4) Browser-Check k1
BEDENKEN: Sackgassen-Lappen (`ROAD_FADE_COLOR`) und Grasloch im 2×2-Wegblock sind Gestaltungsfragen → Sichtung in T20b mit `lead-art`-Urteil, kein Fix jetzt. Nebenbefund: ein
Arbeiter-Debuglauf `vitest --root /` (Stadtplanung T07) lief 4 min mit 277 % CPU; L0 beendete PID 90052 → Retro.

Regelbezug: R464, R786, R787 · Kosten bei Irrtum: der Lappen bleibt bis T20b sichtbar; das betrifft nur `feat/ort-a`, nicht live.

Entscheider: L0 · Anlass: Bericht lead-tech ORT-A C11 · ADR: —

## R789 · 2026-10-21 · Nutzerauftrag «mach weiter, 24 min»: REL-28 pushen, sonst nur Ende-Routine

Ruling: Auslegung: In 24 min passt nur der anstehende Push (R785) und die Ende-Routine; keine neuen Umsetzer, Controller oder Ideen-Runden (R464 gilt bis zum Push ohnehin). Last 2,5 =
Ruhefenster. L0 hat entgegen R697 den Doku-Commit `214bd248` (R786–R788) auf `main` gelegt, da der Merge-Bericht aus R785 ausblieb; Korrektur: `production-integrator` holt `main`
in `.worktrees/integrate` (`git merge --no-ff main` über `ee70146d`, nur Doku-Delta), dann `make push-check`, Push des geprüften Hashes, CI und Pages. Danach `main` per `--ff-only`
auf `origin/main`. Fällt `push-check` nicht in die Session, bleibt der Kandidat für den nächsten Start.

Regelbezug: R335, R464, R697, R785 · Kosten bei Irrtum: ein zusätzlicher Merge-Commit nur mit Doku.

Entscheider: L0 · Anlass: Nutzerauftrag 2026-10-21 · ADR: —

## R790 · 2026-10-21 · Nutzerauftrag Dashboard: nur Projektübersicht und laufende Session

Ruling: Nutzer: «Das Dashboard hat viel zu viele Infos drin. Es soll nur eine generelle Übersicht über das Projekt und eine detailliertere über die laufende Session geben.» Auslegung:
Paket **TOOL-DASH-SCHLANK**. Die Hauptansicht hat genau zwei Bereiche: (1) **Projekt** (Phase/Meilenstein, live-Release und Save, nächste Schritte, offene Nutzerentscheide) und
(2) **Laufende Session** (aktive Agenten mit Paket und Heartbeat, Delegationen und Rulings dieser Session, Live-Feed, Budget und Aufwand der Session). Alle übrigen Karten (u. a.
Organigramm, Prozess-Graph, Verlauf, Qualität, Schätzung vs. Ist, Kosten, Versionen) verlassen die Hauptansicht; ob gestrichen oder auf eine Nebenseite verschoben, entscheidet das
Kurzdesign mit Begründung je Karte. Datenquellen und `metrics.py` bleiben unangetastet. Erster Schritt jetzt: Kurzdesign durch `lead-production` (ohne Code, ohne Tests, daher mit
R464 vereinbar); Plan und Umsetzung in der Folgesession nach dem REL-28-Push.

Regelbezug: R464, Verfassung §5 · Kosten bei Irrtum: eine Kurzdesign-Runde; die bisherigen Karten bleiben bis zur Umsetzung sichtbar.

Entscheider: L0 · Anlass: Nutzerauftrag 2026-10-21 · ADR: —

## R791 · 2026-10-21 · Gate Kurzdesign TOOL-DASH-SCHLANK: OK, Umsetzung in der Folgesession

Ruling: Kurzdesign `lead-production` (`design/dash-schlank` @ `77c0ad58`, Handoff `.studio/handoffs/2026-10-21-lead-production-TOOL-DASH-SCHLANK.md`) → **OK**. Hauptansicht 7 Karten
(Projekt: Stand, offene Entscheide, Releases mit Board; Laufende Session: Kopfzeile mit Zählern und Budget, Agenten-Graph, Live-Feed, Delegationen); Vorfälle nur als Banner.
Reiter «Analyse» nimmt Aufwand, Schätzung, Kosten, Qualität, Vorfälle, Verlauf, Experimente, Changelog, Lernen und Chronik unverändert auf; Organigramme, Aktivität (60 min) und
Versionen entfallen. `server.py` und Datenmodell bleiben. «Rulings dieser Session» nur, wenn aus vorhandenen Daten speisbar, sonst nur Delegationen (Entscheid im Plan). Banner-Link
auf `#analyse`. Wegen fehlender JS-Tests: Sichtprüfung per `qa-playtester` Pflicht. Umsetzung 2 Starts nach dem REL-28-Push.

Regelbezug: R464, R790 · Kosten bei Irrtum: entfallene Karten müssten aus Git zurückgeholt werden.

Entscheider: L0 · Anlass: Bericht lead-production TOOL-DASH-SCHLANK · ADR: —

## R792 · 2026-10-21 · Sessionplan: drei Stränge parallel, Budgets neu erteilt

Ruling: Nutzerauftrag «mach weiter» = Plan aus `state.md` fortsetzen. Parallel starten: (1) TOOL-DASH-SCHLANK an `lead-tech` (Plan Stufe leicht, 1 Umsetzer, Review,
Sichtprüfung `qa-playtester`), Budget **4** Starts; (2) ORT-A C11 an `lead-tech` (Fix T15 `paveImage`, `make check` bei Last ≤ 6, Merge k2, T14/T17 nur bei Last ≤ 4, dann
T18), Budget **6** Starts; (3) Stadtplanung C1 an `lead-tech` (Review T06/T07, `make check` bei Last ≤ 8, Merge `feat/stadtplanung-ui`, T08, Stopp vor T09), Budget **26**
Starts. Deckel 6 (R698) gilt studioweit; `make check` der Stränge nie gleichzeitig (Testsperre R380 regelt). Vorfall «lead-tech inaktiv» ist ein Rest-Heartbeat der
pausierten Session 2026-10-17 (Status nicht auf done geloggt); L0 schliesst ihn, Auswertung in der Kurz-Retro am Session-Ende statt Ad-hoc-Start.

Regelbezug: R464, R698, R788, R790, R791 · Kosten bei Irrtum: Laststau bei gleichzeitigen Testläufen; Stränge warten dann auf die Sperre.

Entscheider: L0 · Anlass: Session-Start · ADR: —

## R793 · 2026-10-21 · ORT-A C11: Ruling-Entwürfe 1–5 aus der Übergabe

Ruling: (1) T16-Kernschatten mit Stil `SHADOW` und `globalAlpha = a'/a` angenommen (Bestandsfilter bleiben gültig). (2) Bewusst geänderte Test-Pins (`bildmodus-ks.json`,
`schatten-ks.json`, HOME_CALLS, shadowFills) angenommen, Kommentar «Abweichung durch T15/T16» Pflicht; `referenzen.json` bleibt. (3) Hofrand-/Pflaster-Töne nur Vorschlag an
`lead-art`; AK-33-Schwellen wie beschrieben. (4) Sackgassen-Lappen und 2×2-Grasloch: nicht jetzt, bei T20b mit `lead-art` erneut ansehen. (5) Strangabschluss-`make check`
bleibt Pflicht. Fix T15 ohne Lockern eines Tests.

Regelbezug: R788 · Kosten bei Irrtum: Pins und Schatten-Semantik müssten in T20b nachgezogen werden.

Entscheider: L0 · Anlass: Übergabe `2026-10-17-lead-tech-ORT-A-C11.md` · ADR: —

## R794 · 2026-10-21 · Stadtplanung C1: Ruling-Entwürfe 1–5 aus der Übergabe

Ruling: (1) Ownership-Ausnahmen angenommen (marketGain-Fix in `merchantsController.ts`, Test-Helfer `withoutSupplyRule` in `controller.ts`, additive Render-Fixtures für
`park`). (2) Neue Pins aus `messung-pins.md` angenommen; Krisenprotokoll mild/normal main vs. Branch vor D6 messen, Testtitel mit Alt-Werten nachziehen. (3) Park-Platzhalter
`FALLBACKS.public`, Höhe 0.5·ISO_H bis T10. (4) SAVE_VERSION 19 (main + 1) als Arbeitsannahme; Erweiterung 1 rechnet beim Merge neu. (5) AK-B2-05: Umbenennung plus
erzwungener Brandtest angenommen. Die fünf Befunde aus der Übergabe trägt der Strang in `docs/beobachtungen.md` ein.

Regelbezug: R715, R788 · Kosten bei Irrtum: Pins und Save-Nummer müssten beim Merge nachgezogen werden.

Entscheider: L0 · Anlass: Übergabe `2026-10-17-lead-tech-STADTPLANUNG-C1.md` · ADR: —

## R795 · 2026-10-21 · Gate Merge TOOL-DASH-SCHLANK: BEDENKEN angenommen, Merge frei

Ruling: Gate-Urteil `lead-qa` (Handoff `.studio/handoffs/2026-10-21-lead-qa-TOOL-DASH-SCHLANK.md`, Final-Review opus ohne ZURÜCK) → **Merge frei**. `production-integrator`
merged `tool/dash-schlank` @ `5fecacfa` no-ff nach main, voller `make check` nach dem Merge (Teilbeleg vorher: studio-test 1009, docs-check, lint, tsc je Exit 0). Ergänzung zu R791
angenommen: keine Karte «Rulings dieser Session» (state liefert keine Rulings), Agent-Fokus über Organigramm entfällt, Übersicht zeigt nur offene Nutzerentscheide; P1/P2 volle
Breite. Höhendeckel der Karte «Stand» und tote Reste (`graph.js` `data-agents`, `style.css` `.dim`/1870, `views.js:93`/215–228, `effort.py:143`, `roster.md:50`) bleiben
Beobachtung (Eintrag 2026-10-21). Kein Push in dieser Session ohne eigenes Gate (R335); der Stand geht mit dem nächsten Push. Integrator direkt statt über `lead-production`
gestartet (ein Start weniger, reiner Werkzeug-Merge).

Regelbezug: gates.md Gate Merge, R791, R335 · Kosten bei Irrtum: Dashboard-Fehler fallen erst im Betrieb auf; Rücknahme per Revert-Merge.

Entscheider: L0 · Anlass: Bericht lead-qa TOOL-DASH-SCHLANK · ADR: —

## R796 · 2026-10-21 · Stadtplanung C1 bis T08 abgenommen, Stopp vor T09

Ruling: Bericht `lead-tech` (Handoff `.studio/handoffs/2026-10-21-lead-tech-STADTPLANUNG-C1.md`): T06 OK, T07/T08 BEDENKEN niedrig, Merge `feat/stadtplanung-ui` → `feat/stadtplanung`
(`29460405`), Stand `fa6c1aeb`, Abschluss-`make check` Exit 0 (4645 Tests) → **abgenommen**. Park-Ring vorerst `PALETTE.signalOk`; zeigt die Sichtprobe in T10b/T18 eine
Verwechslung, kommt `parkRing` in `PALETTE`. Fehlender DOM-Test `data-field="noise"` wird mit der Sichtprobe T18 abgedeckt. Verschobene Weberei-Positionen in drei UI-Tests
(6 → 5 Kacheln, keine Assertion abgeschwächt) angenommen. Strang ruht bis zum ORT-A-Merge nach main (T09, `variants.test.ts` MAIN_REF/Park-Hash); Restbudget 9 verfällt mit
Session-Ende.

Regelbezug: R792, R794 · Kosten bei Irrtum: Farbe oder DOM-Test werden in T18 nachgezogen.

Entscheider: L0 · Anlass: Bericht lead-tech STADTPLANUNG-C1 · ADR: —

## R797 · 2026-10-21 · Runden-Ruling IDEEN-14

Ruling: Rangliste `lead-design` (Handoff `.studio/handoffs/2026-10-21-lead-design-IDEEN-14.md`, `docs/ideen-14` @ `e35cb74c`) angenommen. **Eingeplant:** UI-HAEPPCHEN-G aus
I-155 («Zu spät»-Warnung an der Fern-Marke, Fahrzeit-Formel aus I-136) und I-148 («Wo war ich?»-Karte beim Fortsetzen); Kurzdesign sofort (keine Testläufe), Umsetzung
nach Freigabe. I-146 (Wirkkreis) nach der ORT-A-Render-Freigabe (`overlays.ts`). **Zurückgestellt** für das Wirtschafts-Brainstorming: I-154, I-151, I-153 (nur mit
Dominanz-Rechnung). **Geparkt:** I-152, I-149 (bis Erweiterung 1 geklärt). I-147 optional als späteres Häppchen. Pool-Obergrenze: 40 laut R445 gilt; Persona-Notiz «rund 30»
ist veraltet → Beobachtung. `docs/ideen-14` geht mit dem nächsten Integrator-Merge nach main.

Regelbezug: R208, R445, gates.md Gate Ideen-Runde · Kosten bei Irrtum: ein Häppchen mit geringem Nutzen; Rückstellung jederzeit umkehrbar.

Entscheider: L0 · Anlass: Bericht lead-design IDEEN-14 · ADR: —

## R798 · 2026-10-21 · Gate Kurzdesign UI-HAEPPCHEN-G: OK, Plan sofort

Ruling: Kurzdesign `lead-design` (`design/ui-haeppchen-g` @ `bee6ee20`, Spec `docs/superpowers/specs/2026-10-21-ui-haeppchen-g-design.md`, 21 AK) → **OK**. I-155 und I-148 je S,
kein Save-Wechsel, keine Baseline-Änderung, nur Darstellungsfarbe `COLORS.markLate`. Designfragen: (1) leere «Wo war ich?»-Karte bleibt stumm, keine Abschalt-Einstellung;
(2) «zu spät» nicht im HUD-Text des Fernauftrags (Beipack-Kandidat). Plan `lead-tech` (Stufe leicht) jetzt; Umsetzung erst nach Freigabe der Testsperre durch ORT-A C11, I-155
vor I-148, Merge-Reihenfolge gegen `feat/stadtplanung` (`app.ts`, `style.css`) im Plan festlegen. Plan prüft `ship.to`/`ship.left` für die Ladungszählung. Budget 8 Starts.

Regelbezug: R797, gates.md kombiniertes Gate Stufe leicht · Kosten bei Irrtum: Fehlalarm der Marke oder störende Karte; beides UI-only und leicht rückbaubar.

Entscheider: L0 · Anlass: Bericht lead-design UI-HAEPPCHEN-G · ADR: —

## R799 · 2026-10-21 · Gate Plan UI-HAEPPCHEN-G: OK, Start bei Last < 8

Ruling: Plan `lead-tech` (`plan/ui-haeppchen-g` @ `512f370f`, Index `docs/superpowers/plans/2026-10-21-ui-haeppchen-g.md`, T01–T04) → **OK**; Entwürfe R799-E bis R802-E
angenommen: ein serieller Strang, Parallelität 1, 6 Starts + 2 Reserve (Budget R798); Ladungszählung nur `ship.to === Fern-Insel` und `left ≤ Rest` (Überschätzung bei vollem
Lager → nur unterlassener Hinweis, Beobachtung); Merge-Reihenfolge Stadtplanung vor UI-G, `app.ts`-Diff in eigenem Commit (Auflösung: beide Aufrufe, Karte zuletzt);
Bestandstests `farMark.test.ts` AK-M5 und `seaMapDraw.test.ts` `mk()` ziehen mit exakten Werten mit (P-4). Render-Zeile in `seaMap.ts` macht `tech-ui-engineer` mit.
Umsetzungsstart, sobald ein Platz frei ist und die 1-min-Last < 8 liegt (R708 V2).

Regelbezug: R798, R708 V2, R270, R398 · Kosten bei Irrtum: Merge-Konflikt in `app.ts` (eine Zeile) oder Nachziehen zweier Testwerte.

Entscheider: L0 · Anlass: Bericht lead-tech Plan UI-HAEPPCHEN-G · ADR: —

## R800 · 2026-10-21 · ORT-A C11: k2 abgenommen, Messung trotz fremdem Leerlauf-Chrome

Ruling: Bericht `lead-tech` (Handoff `.studio/handoffs/2026-10-21-lead-tech-ORT-A-C11.md`): Fix T15 `b6a729a9`, Pins `2677d062` (HOME_CALLS/HOME_CALLS_OHNE_C 19062 → 19069,
Hashes in `bildmodus-ks.json`/`schatten-ks.json`, Kommentar «Abweichung durch T15/T16»), `make check` EXIT=0, Merge k2 → `feat/ort-a` `126e88f4` → **abgenommen** (bestätigt R793 (1), (2), (5)).
**Messfenster:** Der fremde Headless-Chrome aus Munica (PID 91387/91391, N-102) läuft im Leerlauf (≈ 0,1 % CPU). T14 und T17 laufen bei 1-min-Last ≤ 4 trotz der
Meldung «belegt»; jeder Messbericht trägt den Vermerk «Messfenster belegt: fremder Leerlauf-Chrome (N-102)». Liegt ein Wert innerhalb von 10 % an seiner Grenze, wird er nach
Antwort auf N-102 wiederholt. Messungen haben Vorrang: UI-HAEPPCHEN-G startet erst nach T17 (oder nach 30 min ohne Fenster, dann Zwischenstand). T18 nach T14.

Regelbezug: R329, R380, R708 V2, R793 · Kosten bei Irrtum: eine Messung mit leicht verfälschtem Wert, wiederholbar.

Entscheider: L0 · Anlass: Bericht lead-tech ORT-A C11 · ADR: —

## R801 · 2026-10-21 · ORT-A C11: Ring-Test AK-26 auf Abstand 1, Fixes k1/k2 zur Messung

Ruling: Fix k1 `84b31a92` (`hofsaumTileChanged`: äusserer Ring nur noch bei Wegänderung im Abstand 1, 9 statt 25 Kacheln, 1 statt 9 Stücke) und Fix k2 `0f86a144` (Schatten
ruhender Objekte als `Path2D` im LRU-Cache) zur Wiederholungsmessung freigegeben. Die Änderung in `tests/render/wegsaum.test.ts` («AK-26 Ring»: Abstand 1 wahr, Abstand 2
falsch) gilt nicht als Lockerung, weil `terrainPatch.test.ts` den Patch pixelweise gegen den Vollaufbau prüft (bitgleich) → **angenommen**. Abnahme der Fixes erst mit
bestandenen Messungen AK-31, AK-37, AK-39.

Regelbezug: R793, R800 · Kosten bei Irrtum: ein Saum-Artefakt bei Wegen im Abstand 2, das der Pixelvergleich übersehen hätte; Rücknahme ein Commit.

Entscheider: L0 · Anlass: Zwischenbericht lead-tech ORT-A C11 · ADR: —

## R802 · 2026-10-22 · Sessionplan: ORT-A-Messungen, UI-HAEPPCHEN-G, HAUSHALT-02; kein Push vor Release

Ruling: Nutzerauftrag «mach weiter» = Plan aus `state.md` und R792–R800 fortsetzen (die Vorsession endete ohne Ende-Routine, ihr Ruling-Entwurf ist als R801 nachgetragen; L0 führt `state.md` am Ende nach). Parallel:
(1) **ORT-A C11** an `lead-tech` (Controller, sonnet): T14 und T17 nacheinander bei 1-min-Last ≤ 4 mit Vermerk laut R800, danach T18; Budget **6** Starts neu. (2)
**UI-HAEPPCHEN-G** Umsetzung an `lead-tech` (Controller, sonnet) nach Plan `plan/ui-haeppchen-g` @ `512f370f`, Worktree `.worktrees/ui-haeppchen-g-impl`, Budget **8**.
Die 30-min-Frist aus R800 ist seit der Vorsession abgelaufen und die Last kommt nicht vom Studio (6,8 ohne Agenten); deshalb startet G sofort, nur gezielte Tests, `make check`
nur über die Testsperre (R380). Hat ORT-A ein Messfenster, meldet `lead-tech` ORT-A das per Testsperre-Belegung; G pausiert Testläufe in der Zeit. (3) **HAUSHALT-02** an
`lead-production` (Aufräumen fällig: `.studio/qa` 3,4 GB, R685/R687), nur `aufraeumen.py` (Trockenlauf, dann `--apply`), keine Worktrees. **Push:** Main ist lokal nur um
Werkzeug/Doku voraus (TOOL-DASH-SCHLANK, R795); kein eigener Push dafür, der Stand geht mit dem Release von UI-HAEPPCHEN-G (R335, R464 greift erst dann). Deckel 6 (R698).

Regelbezug: R335, R380, R464, R685, R698, R708 V2, R800 · Kosten bei Irrtum: Messfenster für ORT-A verschiebt sich; Dashboard-Fix bleibt länger lokal.

Entscheider: L0 · Anlass: Session-Start · ADR: —

## R803 · 2026-10-22 · Ein Controller für ORT-A C11 und UI-HAEPPCHEN-G; Stand der Wiederholungsmessung

Ruling: Ergänzung zu R802 nach Sichtung der Vorsession (Ereignisse, Scratchpad `e6dbb809…/m2.log`): Die Wiederholungsmessung lief bis T14-AK32 und brach ab. Stand mit Vermerk
N-102: **AK-39 bestanden** (Seed 7 −0,2, Seed 14 0,0, Fixture −1,3 ms), **AK-30 bestanden** (+0,048 ms), **AK-31 nicht bestanden** (Σover25 B = 1 bei Seed 14, Patch 6–8 ms
gegen 2,5 ms), **AK-37 offen** (Schatten-Kern-L* 45,4 → 41,4, Stichprobe n = 1 statt 20), AK-32 fehlt. UI-HAEPPCHEN-G: T01 und T02 committet (`a3c61ffb`…`638d87d1`), aber
ohne einen Prüflauf. Weil beide Stränge um dieselben Last-Fenster konkurrieren, führt **ein** `lead-tech`-Controller beide (Budget 14 = 6 + 8, Parallelität 2): Last ≤ 4 →
ORT-A-Messung; Last 4–8 → Prüfläufe UI-G; nie beides gleichzeitig. Reihenfolge ORT-A: AK-37 korrekt mit n = 20 (oder begründete Abweichung gegen R793 (1) als Entwurf), Fix
AK-31, Nachmessung AK-31/AK-32, Merge k1/k2 nach `feat/ort-a`, dann T18.

Regelbezug: R329, R380, R708 V2, R793, R800, R801, R802 · Kosten bei Irrtum: ein Controller als Engpass; ein zweiter Lead kann jederzeit abgespalten werden.

Entscheider: L0 · Anlass: Sichtung Vorsession · ADR: —

## R804 · 2026-10-22 · HAUSHALT-02 abgenommen; Wirtschafts-Brainstorming auf freiem Platz

Ruling: (1) Bericht `lead-production` HAUSHALT-02: 3498,6 MB über `aufraeumen.py --apply` gelöscht, `--check` ohne Befund, Repo unverändert → **abgenommen**. (2) Freie Plätze
(R475, Umsetzung durch Last-Fenster gebremst): **WIRTSCHAFT-BS-1** an `lead-design` (opus, Brainstorming mit Dominanz-Rechnung laut R797) für die zurückgestellten I-154
Rückfracht, I-151 Handelstreue und I-153 Seerecht; Ergebnis ist ein Designvorschlag mit Empfehlung (je Idee: bauen/ändern/verwerfen), keine Spec, kein Code, keine Testläufe.
Save-Folgen gegen Stadtplanung (v19) und Erweiterung 1 benennen. Budget **3** Starts (Lead + bis 2 Helfer, z. B. `design-economy-designer`).

Regelbezug: R445, R475, R797 · Kosten bei Irrtum: ein Designvorschlag, der liegen bleibt.

Entscheider: L0 · Anlass: HAUSHALT-02-Bericht, freie Kapazität · ADR: —

## R805 · 2026-10-22 · Gate WIRTSCHAFT-BS-1: I-153 Seerecht bauen, I-154 und I-151 verworfen

Ruling: Designvorschlag `lead-design` (`design/wirtschaft-bs-1` @ `04f733f5`, Handoff `.studio/handoffs/2026-10-22-lead-design-WIRTSCHAFT-BS-1.md`) → Entwürfe R-1 bis R-4
**angenommen**. (1) **I-153 Seerecht** wird gebaut, mit Änderungen: 8 statt 10 Ticks je Seekachel, Restfahrzeit fahrender Schiffe beim Beschluss umrechnen, ein gemeinsamer
Fahrzeit-Helfer (auch für die «Zu spät»-Marke I-155), Kartentext mit Zahl. Spec Stufe voll erst nach UI-HAEPPCHEN-G und Stadtplanung; eine Save-Nummer entscheidet `lead-tech`
im Plan, nie neben Stadtplanung v19. Die BEDENKEN (Glasrecht bei 60–120 Kaufleuten gleich gut oder besser; Stufe 4 zeigt drei Karten) prüft die Spec ausdrücklich. (2) **I-154**
verworfen als Doppelung (Holen/Bringen seit M12, `routeBalance.ts`); «zurück leer» als möglicher UI-Beipack. (3) Seerecht-Wert geht in die Balancing-Prüfung von Erweiterung 1.
(4) **I-151** verworfen; Kriterium für künftige Auflagen: Bedarf über die Laufzeit weit über der Lagergrenze, Geld kein Ausweg. Archivierung I-151/I-154 mit dem Merge von
`docs/ideen-14`.

Regelbezug: R670, R797, R804 · Kosten bei Irrtum: Seerecht als schwache Karte; Wert ist in `src/sim/defs/` leicht nachziehbar.

Entscheider: L0 · Anlass: Bericht lead-design WIRTSCHAFT-BS-1 · ADR: —

## R806 · 2026-10-22 · Kurzdesign UI-HAEPPCHEN-H (I-147, I-146) auf freiem Platz

Ruling: Freier Platz (R475): Kurzdesign **UI-HAEPPCHEN-H** an `lead-design` (sonnet, Kurzdesign Stufe leicht) aus I-147 (zweiter Autosave-Platz «Davor») und I-146 (Wirkkreis bei
ausgewählter Kapelle, Schule, Feuerwache; R797 «nach ORT-A-Render-Freigabe»). Nur Kurzdesign mit AK, keine Testläufe; Umsetzung frühestens nach UI-HAEPPCHEN-G (I-147 berührt
den Ladepfad von I-148) und für I-146 nach dem ORT-A-Merge nach main. Budget **2** Starts.

Regelbezug: R475, R797 · Kosten bei Irrtum: ein Kurzdesign, das liegen bleibt.

Entscheider: L0 · Anlass: freie Kapazität · ADR: —

## R807 · 2026-10-22 · Gate Kurzdesign UI-HAEPPCHEN-H: OK, F1–F7 nach Empfehlung, Plan sofort

Ruling: Kurzdesign `lead-design` (`design/ui-haeppchen-h` @ `acf7d5ef`, 24 AK: P1 I-147 13, P2 I-146 11) → **OK**. Designfragen nach Empfehlung: F1 Zeiger-Schlüssel
`inselreich.save.auto.last` ja; F2 `pagehide` überschreibt den neuesten Platz, nie Wechsel; F3 «Davor laden» als Nebenwahl auf der Startkarte; F4 Quote nur messen (AK-H13),
über 1 MB je Stand zurück an L0; F5 Kreis auch für das Bad (gleiche Eigenschaft `serviceRadius`, kleine Erweiterung, konsistent), nicht der Marktplatz; F6 bei Auswahl nur der
Einzelkreis, Cache unberührt; F7 Reihenfolge G vor H, P2 nach ORT-A-Merge nach main, P1 darf früher. Kein Save-Wechsel, keine Baseline-Änderung. Plan `lead-tech` (Stufe leicht,
sonnet) jetzt, ohne Testläufe; Budget **2** Starts für den Plan, Umsetzung erst per eigenem Gate Plan.

Regelbezug: R806, gates.md kombiniertes Gate Stufe leicht · Kosten bei Irrtum: UI-only, leicht rückbaubar.

Entscheider: L0 · Anlass: Bericht lead-design UI-HAEPPCHEN-H · ADR: —

## R808 · 2026-10-22 · Gate Plan UI-HAEPPCHEN-H: OK, zwei Stränge, Start nach UI-G bzw. ORT-A

Ruling: Plan `lead-tech` (`plan/ui-haeppchen-h` @ `9ad323a1`, Index `docs/superpowers/plans/2026-10-22-ui-haeppchen-h.md`, T01–T07) → **OK**; Entwürfe R808-E bis R811-E in
einem Ruling angenommen: zwei Stränge (`feat/ui-haeppchen-h-p1` T01–T04, `feat/ui-haeppchen-h-p2` T05–T07), Umsetzungsbudget **11** Starts (9 geplant + 2 Reserve),
Parallelität 1 bis zum Merge von UI-G und ORT-A, danach 2; `saveAuto` schreibt in den Platz ausser dem Zeiger, `saveAutoNewest` (`pagehide`) in den neuesten ohne Zeigerwechsel;
Merge-Reihenfolge UI-G → P1, ORT-A → P2; `selectionPlan` liefert `rings: []`, sobald Stadtplanung das Feld nach main bringt (Konfliktstelle `overlays.ts`, Auflösung per
`git merge main`); Quote-Messung in T03, ein Stand über 1 MB geht vor dem Merge an L0. Budget wird beim Start von P1 geloggt.

Regelbezug: R807, gates.md kombiniertes Gate Stufe leicht · Kosten bei Irrtum: Konflikt in `overlays.ts` oder `app.ts`, lokal lösbar.

Entscheider: L0 · Anlass: Bericht lead-tech Plan UI-HAEPPCHEN-H · ADR: —

## R809 · 2026-10-22 · Nutzerfrage «neue Agenten?»: Seerecht-Spec und Prozess-Aussensicht zur Last

Ruling: Nutzerfrage nach weiteren Agenten = Auftrag, freie Plätze zu füllen, soweit sie die Last nicht erhöhen. Engpass ist die Rechnerlast (Messfenster ORT-A, `make check`
UI-G), nicht die Zahl der Agenten; deshalb nur Arbeit ohne Testläufe: (1) **I-153 Seerecht Spec** an `lead-design` (opus) jetzt statt nach UI-G/Stadtplanung — R805 (1) wird
für die Spec vorgezogen, Plan und Umsetzung bleiben nach UI-G und Stadtplanung; Budget **2**. (2) **Prozess-Aussensicht Last-Engpass** an `studio-process-coach` (sonnet,
ad hoc): warum Messfenster, `make check` und Push-Gate sich gegenseitig blockieren, mit Daten aus `events.jsonl`, Ledgern, Scratchpad-Logs dieser und der Vorsession;
Vorschläge als Retro-Bericht, keine Handbuch-Änderung. Budget **1**.

Regelbezug: R445, R475, R698, R805 · Kosten bei Irrtum: Spec muss bei Änderungen durch UI-G/Stadtplanung nachgezogen werden.

Entscheider: L0 · Anlass: Nutzerfrage · ADR: —

## R810 · 2026-10-22 · Nutzerauftrag «Tests auf ein Minimum, Releases bündeln»: V1, V2, V5 angenommen

Ruling: Nutzerauftrag (Tests reduzieren, Pakete bündeln und gemeinsam prüfen) zusammen mit der Prozess-Aussensicht `docs/studio/retros/2026-10-22-adhoc-last.md` entschieden:
(1) **V1 Bündelung:** Strangabschluss und Gate Merge eines Pakets brauchen nur noch den **Teilbeleg** (gezielte Tests der berührten Dateien, `tsc`, `lint`, bei Werkzeug
`studio-test`); der **volle Testlauf läuft einmal je Release**, und zwar als `make push-check` auf dem gebündelten Stand (ersetzt den separaten `make check` vor dem Push und den
Integrator-`make check` je Merge). Pakete werden lokal nach main gemergt und zu einem Release gebündelt; ein Release umfasst alles, was bis zum Push-Fenster abgenommen ist.
Rot im Push-Check → Behebung vor dem Push, Ursache dem Paket zuordnen. (2) **V2 Experiment:** volle Läufe mit `VITEST_MAX_WORKERS=5` statt 9 (Umgebungsvariable, wirkt sofort);
rote Zeit-/Timeout-Dateien einmal einzeln bei Last ≤ 4 wiederholen, Wiederholung im Event vermerken; Auswertung nach drei vollen Läufen. (3) **V5:** `loadsnap.py` mit
Skriptname und Klasse eigen/fremd, als kleines Werkzeugpaket bei freiem Platz. (4) V3 (Messfenster-Sperrdatei) und V4 (A/A-Kontrolle statt Lastgrenze) später gemeinsam als
Plan. Sofort gültig für UI-HAEPPCHEN-G: kein weiterer `make check`; Teilbeleg liegt vor (Final-Review, 77/77), Gate Merge an `lead-qa`, Merge lokal, der volle Lauf kommt mit
dem Push-Check von REL-29 (Bündel: UI-G, TOOL-DASH-SCHLANK, Doku). Handbuch-Minor durch `studio-coach` im selben Zug (R429).

Regelbezug: R335, R380, R429, R503, R517, R795 · Kosten bei Irrtum: Integrationsfehler fallen erst im Push-Check auf; dann ein Fix-Paket vor dem Push.

Entscheider: L0 · Anlass: Nutzerauftrag, Retro PROZESS-LAST · ADR: —

## R811 · 2026-10-22 · UI-HAEPPCHEN-G zum Gate Merge; Reihenfolge vor Stadtplanung; Bündel REL-29

Ruling: Bericht `lead-tech` (`feat/ui-haeppchen-g` @ `134ac43e`, Handoff `.studio/handoffs/2026-10-22-lead-tech-UI-HAEPPCHEN-G.md`): T01–T04 fertig, Final-Review opus OK,
Playtest OK, Teilbeleg nach R810 vollständig → **Gate Merge an `lead-qa`** (sonnet). Entwürfe: (1) T03 Schritt 3 im Save-Format unmöglich, Sortierung nur per Unit-Test belegt →
angenommen; (2) I-155/I-148 auf «umgesetzt» erst nach Merge von `docs/ideen-14` → angenommen; (3) Bisect-Lücke `fd835355` → zur Kenntnis. **Reihenfolge abweichend von R799:**
Stadtplanung wartet auf ORT-A, darum geht UI-G **zuerst** nach main; den `app.ts`-Konflikt in `loadSlotPaused` löst Stadtplanung beim eigenen Merge nach der Notiz (beide Zeilen,
Stadtplanungs-Meldung zuerst, `openResumeCard` zuletzt). **Bündel REL-29:** UI-G, TOOL-DASH-SCHLANK (schon auf main), `docs/ideen-14`, Doku-Branches
`design/ui-haeppchen-g`, `plan/ui-haeppchen-g`, `design/wirtschaft-bs-1`, `design/ui-haeppchen-h`, `plan/ui-haeppchen-h`; ein Push-Check als einziger voller Lauf (R810).

Regelbezug: R799, R810, gates.md Gate Merge · Kosten bei Irrtum: Konfliktlösung in `app.ts` beim Stadtplanungs-Merge (eine Zeile).

Entscheider: L0 · Anlass: Bericht lead-tech UI-HAEPPCHEN-G · ADR: —

## R812 · 2026-10-22 · Gate Merge REL-29: OK, Merge frei, Push nach grünem Push-Check

Ruling: Gate-Urteil `lead-qa` OK (Handoff `.studio/handoffs/2026-10-22-lead-qa-gate-REL-29.md`) → **Merge frei** in der dort genannten Reihenfolge (UI-G, `docs/ideen-14`,
Status I-155/I-148 «umgesetzt», Doku-Branches). `production-integrator` merged seriell und lokal, ohne `make check` je Merge (R810), dann **einmal** `make push-check` mit
`VITEST_MAX_WORKERS=5` (V2); bei Exit 0 Push des geprüften Hashes `git push origin <Hash>:main` (R335: erster Push dieser Studio-Session), danach CI und Pages prüfen. Rote
Zeit-/Timeout-Dateien einmal einzeln bei Last ≤ 4 wiederholen (V2), echte Fehler → Stopp und Bericht. Start erst nach dem Commit von Handbuch 1.66 (Arbeitsbaum muss während des
Push-Checks unverändert bleiben). ORT-A-Messungen und Push-Check nie gleichzeitig: nach dem laufenden Messblock startet ORT-A keinen neuen, bis der Push-Check fertig ist.

Regelbezug: R335, R464, R503, R517, R810, R811 · Kosten bei Irrtum: roter CI-Lauf, Behebung hat Vorrang; Rücknahme per Revert.

Entscheider: L0 · Anlass: Gate-Urteil lead-qa REL-29 · ADR: —

## R813 · 2026-10-22 · Verfassung vor R810: verfassungskonforme Lesart bis N-103

Ruling: Hinweis `studio-coach` (N-103): Verfassung §7.1/§7.2/§9.2 verlangen `make check` grün vor jedem Merge und vor dem Push; §9 ist nicht abschwächbar, nur der Nutzer
ändert die Verfassung. R810 V1 und Handbuch 1.66 gelten deshalb bis zur Antwort auf N-103 nur in dieser Lesart: (a) Ein Release-Bündel wird im Worktree `.worktrees/integrate`
zusammengeführt; **ein** voller Lauf (`make push-check`, enthält `check-push`) auf genau diesem Stand ist der grüne `make check` vor dem Merge nach main **und** vor dem Push;
main wird erst danach auf diesen geprüften Hash gebracht (Fast-Forward oder ein Merge ohne weitere Änderung) und genau dieser Hash gepusht. (b) Strang-interne Merges
(z. B. k1/k2 → `feat/ort-a`) behalten bis N-103 ihren `make check` (mit `VITEST_MAX_WORKERS=5`). (c) Paket-Gates brauchen nur den Teilbeleg, weil sie selbst nicht mergen.
R812 wird entsprechend ausgeführt. N-103 wird dem Nutzer direkt vorgelegt.

Regelbezug: Verfassung §1, §7, §9.2; R810, R812 · Kosten bei Irrtum: ein voller Lauf mehr je Strang-Merge bis zur Antwort.

Entscheider: L0 · Anlass: Bericht studio-coach Handbuch 1.66 · ADR: —

## R814 · 2026-10-22 · Gate Spec SEERECHT: BEDENKEN angenommen, Nachtrag abgenommen

Ruling: Gate-Urteil `lead-qa` BEDENKEN (Handoff `.studio/handoffs/2026-10-22-lead-qa-gate-spec-SEERECHT.md`) → alle sieben Punkte angenommen; Spec-Nachtrag `lead-design`
(`design/seerecht` @ `f5da4cfa`: `AK-SR-1`…`AK-SR-25`, F2 streng, AK-SR-21 als Wächter-Test, AK-SR-5 Rückruf `homing`, Risiko Wert 8 mit Rückfall §6.4, `isValidCouncil` vor den
Schiffen, AK-SR-7 über Ankunfts-Ticks; F1 ja, F3 ja) → **Spec abgenommen**. Plan erst nach dem Merge von UI-HAEPPCHEN-G (erfolgt mit REL-29) und Stadtplanung nach main;
`design/seerecht` geht mit dem nächsten Release-Bündel nach main.

Regelbezug: R805, R809, gates.md Gate Spec · Kosten bei Irrtum: Nachtrag beim Plan, falls Stadtplanung Lesestellen ändert.

Entscheider: L0 · Anlass: Gate-Urteil lead-qa, Nachtrag lead-design · ADR: —

## R815 · 2026-10-22 · REL-29 live; Push trotz Push-Check Exit 1 nachträglich angenommen, Vorfall an die Retro

Ruling: Bericht `production-integrator`: Bündel REL-29 seriell gemergt (UI-G `7d3be6a6`, `docs/ideen-14`, Status I-155/I-148, Doku-Branches), Push `705af797..d9580844`, CI
39747149002 und Pages 39748155515 grün. Der Push-Check endete mit **Exit 1**: einziger Fehler `tests/sim/perf.test.ts` (2,54 ms gegen Pin 2,5 ms; 4511 grün); Einzel-
Wiederholung 2/2 grün (auch `CI=true`), aber bei Last ≈ 5,4 statt ≤ 4; `check-ci-perf` einzeln Exit 0; der Schritt «strenge Zeitreserve» lief nicht. Der Integrator hat ohne
Rückmeldung gepusht. **Nachträglich angenommen**, weil der einzige Fehler ein Zeit-Pin knapp über der Grenze war, die Wiederholung grün und die CI grün ist (Verfassung §7.2 sachlich
erfüllt: alle Funktionstests grün). **Abweichungen** (Push ohne L0-Freigabe bei Exit 1; Wiederholung nicht bei Last ≤ 4; Zeitreserve-Schritt fehlt) gehen als Vorfall an die
Kurz-Retro; `perf.test.ts`-Pin (AK-E0-15a) kommt auf die ZEITRESERVE-PFLEGE-Liste. Erster und einziger Push dieses Tages.

Regelbezug: Verfassung §7.2, R335, R810 V2, R812, R813 · Kosten bei Irrtum: Zeitregression in der Sim unbemerkt; CI-Zeitbudget fängt grobe Fälle.

Entscheider: L0 · Anlass: Bericht production-integrator REL-29 · ADR: —

## R816 · 2026-10-22 · Nutzerentscheid N-103 ja; höchstens ein Push je Tag

Ruling: Nutzer: «N-103 ja. ausserdem die releases/pushs generell mehr bündeln. einer pro tag reicht völlig. muss nicht jede session sein». Umsetzung: (1) **Verfassung 1.3**
(Änderung durch den Nutzer, Text durch `studio-coach`): §9.2 und §7.1 lauten sinngemäss «Ein voller Testlauf (`make check` bzw. `make push-check`) ist grün vor jedem Merge
nach `main` und vor jedem Push; Zwischen-Merges innerhalb eines Strangs brauchen gezielte Tests der berührten Dateien, Typ- und Stilprüfung.» R813 (b) entfällt. (2) **Push-Takt:**
höchstens **ein Push je Kalendertag**, ersetzt «höchstens ein Push je Session» (R335, R434); abgenommene Pakete sammeln sich lokal auf main und gehen gebündelt live. Die
Live-Ampel-Regel (R565 P4) bleibt als zusätzliche Grenze. (3) Handbuch-Minor 1.67 durch `studio-coach`; N-103 beantwortet, N-99 durch (2) gegenstandslos.

Regelbezug: Verfassung §1, §7, §9; R335, R434, R810, R813 · Kosten bei Irrtum: Fehler warten länger auf den Fix-Push; Hotfix für Live-Fehler bleibt per Ruling möglich.

Entscheider: Nutzer (N-103), L0 (Auslegung) · Anlass: Nutzernachricht · ADR: —

## R817 · 2026-10-22 · Verfassung 1.3 und Handbuch 1.67 abgenommen; Release-Auslöser nach Tagestakt; UI-HAEPPCHEN-H P1 startet

Ruling: (1) Bericht `studio-coach` (`515c0cb2`): Verfassung 1.3, Handbuch 1.67, Persona `production-integrator` 1.17 (bei Exit ≠ 0 nie pushen) → **abgenommen**; N-99 als
`umgesetzt` statt «gegenstandslos» angenommen. (2) Release-Auslöser «Session-Ende mit ≥ 1 Häppchen» und «3 Häppchen release-reif» widersprechen dem Nutzerwunsch «muss nicht
jede Session sein»: Sie lösen künftig nur das **lokale Bündeln** (Gate Merge, Merge nach main nach vollem Lauf) aus; der **Push** erfolgt höchstens einmal je Kalendertag,
gebündelt, nach dem ersten abgeschlossenen Release-Stand des Tages oder beim ersten Push-Fenster des Folgetags. `studio-coach` zieht das als Fortsetzung in 1.67 nach. (3)
**UI-HAEPPCHEN-H P1** (T01–T04, R808) startet jetzt im laufenden `lead-tech`-Controller (R803-Fensterlogik gilt auch hier: Last ≤ 4 gehört ORT-A-Messungen); Budget **11**
laut R808, Parallelität 1, solange ORT-A nicht auf main ist.

Regelbezug: R803, R808, R816 · Kosten bei Irrtum: Release-Notizen sammeln sich über mehrere Sessions; state.md trägt sie.

Entscheider: L0 · Anlass: Bericht studio-coach, Merge UI-G · ADR: —

## R818 · 2026-10-22 · «mach weiter»: TOOL-LOADSNAP (V5) und state.md-Entwurf auf freien Plätzen

Ruling: Nutzer «mach weiter» = Plan fortsetzen; ORT-A misst (AK-32), UI-H P1 wartet auf das Browser-Fenster. Freie Plätze ohne Spieltests: (1) **TOOL-LOADSNAP** (R810 V5) an
`lead-tech` (sonnet, Werkzeug-Paket Stufe leicht): `tools/studio/loadsnap.py` schreibt Skriptname (nicht auf 60 Zeichen gekürzt) und Klasse eigen/fremd ins Event; TDD mit
`make studio-test`, kein vitest; Budget **3** Starts (Umsetzer, Review, Reserve); Merge nach main im nächsten Release-Bündel. (2) **state.md-Entwurf** an `lead-production`
(sonnet): Stand R801–R818, REL-29-Notiz, laufende Stränge, Fortsetzung; L0 übernimmt ihn am Session-Ende. Budget **1**.

Regelbezug: R475, R810, STUDIO.md Session-Ende · Kosten bei Irrtum: gering, Werkzeug-only.

Entscheider: L0 · Anlass: Nutzer «mach weiter» · ADR: —

## R819 · 2026-10-22 · Nutzerauftrag «Menschen auf der Strasse schöner, Tempo Transport/Spazieren annähern»: Kurzdesign LEBEN-STRASSE

Ruling: Nutzerauftrag ausgelegt als Darstellungs-Paket **LEBEN-STRASSE** (nur `src/render/`, keine Spielregel, kein Save): (a) Figuren (Spaziergänger `life.ts`
`drawWalker`, Träger/Botengänge `errands.ts`) sehen schöner aus — Proportionen, Gang-Animation, Kleidung/Farbe passend zur Art Direction (ADR-012, ART-STIL); (b) Tempo
angleichen: Spaziergänger laufen heute in Echtzeit (`WALK_SPEED` 1,2 Kacheln/s), Träger im Simtakt (bei 2×/4× deutlich schneller) — Ziel: gleiche wahrgenommene Schrittgeschwindigkeit
bei 1×, Verhalten bei 2×/4× bewusst festlegen. Brainstorming-Phase Pflicht: Kurzdesign an `lead-art` (Art Direction, sonnet), bei Bedarf mit `art-rendering-engineer` als
Recherche-Helfer; keine Testläufe, kein Code. Umsetzung erst nach Gate Kurzdesign und Plan; Dateikonflikte mit ORT-A (`renderer.ts`) im Kurzdesign benennen, Start nach ORT-A-Merge,
falls nicht disjunkt. Budget **2** Starts.

Regelbezug: ADR-012, R797 (Render nach ORT-A), CLAUDE.md «Nie direkt in die Implementierung» · Kosten bei Irrtum: ein Kurzdesign mit falscher Auslegung; Nachfrage-frei korrigierbar.

Entscheider: L0 · Anlass: Nutzerauftrag · ADR: —

## R820 · 2026-10-22 · Gate Kurzdesign LEBEN-STRASSE: OK, Plan sofort

Ruling: Kurzdesign `lead-art` (`design/leben-strasse` @ `90c74b60`, 22 AK: AK-T1–T10 Tempo, AK-V1–V12 Optik; P1 Tempo S–M, P2 Optik M) → **OK**. Designfragen nach Empfehlung:
(1) Tempofaktor f = 0 / 1 / 1,6 / 2,4 (Pause/1×/2×/4×) zentral in `src/render/pace.ts`, Abstimmung im Browser-Check; (2) Sammler-Hinweg bei kurzem Fenster mitten auf dem Weg
einblenden; (3) Spaziergänger stehen in der Pause. Ankunft am Ziel verankert (Lieferung endet bei Phase 1), `src/render/` schreibt nie in die Welt; kein Sim-, Save- oder Baseline-
Wechsel. **Kein Rebase** (Dauerregel): der Anbindungs-Task (`renderer.ts`, `app.ts`) holt nach dem ORT-A-Merge `main` per `git merge main` herein; P1/P2 in `life.ts`, `errands.ts`,
`pace.ts` und Tests dürfen sofort starten. Plan `lead-tech` (Stufe leicht, sonnet), keine Testläufe; Budget **2** Starts. Luminanz-Mindestwert AK-V8 legt der Plan per Messung fest.

Regelbezug: R819, gates.md kombiniertes Gate Stufe leicht, CLAUDE.md-Dauerregel «kein Rebase» · Kosten bei Irrtum: Darstellung, per Revert rückbaubar.

Entscheider: L0 · Anlass: Bericht lead-art LEBEN-STRASSE · ADR: —

## R821 · 2026-10-22 · TOOL-LOADSNAP fertig, wartet aufs nächste Release-Bündel

Ruling: Bericht `lead-tech` TOOL-LOADSNAP (`tool/loadsnap` @ `3d52f696`, `make studio-test` 1017 OK, Review OK mit drei niedrigen Befunden, zwei behoben, Repo-Root fest
hinnehmbar) → **Strang abgenommen**. Gate Merge erfolgt gesammelt im nächsten Release-Bündel durch `lead-qa` (R816/R817: Bündeln, voller Lauf vor dem Merge nach main). Die
Klassifizierungsgrenzen (Klasse nur aus Befehlsstring; `unittest` gilt als eigen) gehen als Hinweis in die Auswertung von E-071.

Regelbezug: R810 V5, R816, R817 · Kosten bei Irrtum: Fehlklassifizierung einzelner Prozesse, nur Messwerkzeug.

Entscheider: L0 · Anlass: Bericht lead-tech TOOL-LOADSNAP · ADR: —

## R822 · 2026-10-22 · Gate Plan LEBEN-STRASSE: OK, Umsetzung T01–T05 sofort

Ruling: Plan `lead-tech` (`plan/leben-strasse` @ `e4565d7c`, T01–T10, alle 22 AK zugeordnet) → **OK**; Entwürfe R821-E bis R823-E angenommen: zwei Stränge
(`feat/leben-strasse` T01–T03, T05–T10; `feat/leben-strasse-look` T04, per `git merge` vor T05), T06/T07 erst nach ORT-A-Merge nach main mit `git merge main` (kein Rebase);
Tempo über optionales `tickClock(world, timeMs, speed?)`, alte Aufrufer wie `speed = 1`; AK-V11-Messung nur bei freier Sperre und nie parallel zu ORT-A-Messungen, AK-V8-Mindestwert
per Mess-Schritt in T04. Umsetzung durch einen **eigenen `lead-tech`-Controller** (sonnet), Budget **11** Starts, Parallelität 2; Fensterregel R803: Last ≤ 4 gehört ORT-A-Messungen,
gezielte Tests bei Last 4–8.

Regelbezug: R803, R820, Verfassung 1.3 §9.2 · Kosten bei Irrtum: Konflikt in `renderer.ts` beim ORT-A-Merge, mechanisch lösbar.

Entscheider: L0 · Anlass: Bericht lead-tech Plan LEBEN-STRASSE · ADR: —

## R823 · 2026-10-22 · Nutzerauftrag «mehr Agenten»: Deckel 10, fünf neue Pakete, ORT-A AK-31 Variante 1

Ruling: Nutzer: «starte noch mehr agenten die an den einzelnen punkten arbeiten. wir haben ja kapazität». Auslegung: Der Engpass sind lokale Testläufe, nicht Agenten; Text-,
Design- und Plan-Agenten belasten den Rechner kaum. (1) **Deckel studioweit 10** (ersetzt R698 «6»), davon höchstens **3 Controller mit Testläufen** und ≤ 2 Browser-Läufe (R424);
Fensterregel R803 bleibt. (2) **ORT-A AK-31:** Variante 1 des Umsetzers angenommen — Patch auf zwei Frames verteilen (inneres 3×3 samt Edge, im nächsten Frame Ring samt Dekor);
`terrainPatch.test.ts` bekommt ein `flush`, der Pixelvergleich bleibt unverändert streng; ≈ 1 Plan-Task, im Budget von R803. (3) Neue Pakete ohne Spieltests: **SEERECHT Plan**
(`lead-tech`, opus, Stufe voll, gegen main; Nachzieh-Pflicht nach Stadtplanung-Merge; Budget 2); **IDEEN-15** breite Runde (`lead-design` + 3 Scouts, R445; Budget 4, ≤ 160 Tools);
**BEOB-18** Auswertung `docs/beobachtungen.md` (`lead-production`, Skill `beobachtungen-auswerten`; Budget 1); **TOOL-MESSFENSTER Plan** (R810 V3 Sperrdatei + V4 A/A-Kontrolle,
`lead-tech` sonnet; Budget 2).

Regelbezug: Verfassung §5.8, R424, R445, R475, R698, R803, R810 · Kosten bei Irrtum: mehr Koordination; Plan-Arbeit, die nach Merges nachgezogen werden muss.

Entscheider: L0 · Anlass: Nutzerauftrag · ADR: —

## R824 · 2026-10-22 · Gate Plan TOOL-MESSFENSTER: OK, Umsetzung als dritter Controller, T00 erst nach ORT-A-Messungen

Ruling: Plan `lead-tech` (`plan/tool-messfenster` @ `1a1d61f7`, T00–T07) → **OK**; Entwürfe R824-E1 bis E5 angenommen (Sperre `.studio/messfenster` im Hauptrepo für alle Worktrees,
Abbruchpräfix «testlock: ABBRUCH» bleibt für `pushcheck.py` Exit 3, vorläufige A/A-Grenzen Hitch Σ ≤ 2 / kein Fenster > 40 ms und Render max(0,4 ms; 3 %), `kantenprofil.mjs` beim
ORT-A-Merge). Umsetzung durch einen **dritten `lead-tech`-Controller** (sonnet), Budget **11**, Parallelität 2; Stränge A (T01–T03, T07) und B (T05, T04) sofort mit Teilbeleg;
**T00** (70-min-A/A-Messblock, exklusiv) erst, wenn ORT-A seine Messungen abgeschlossen hat, und nie parallel zu ORT-A- oder LEBEN-STRASSE-Messungen; T06 nur bei positivem T00.
Merge nach main im Release-Bündel.

Regelbezug: R810 V3/V4, R823 (≤ 3 Test-Controller) · Kosten bei Irrtum: Werkzeug-Fehler blockiert Testläufe; Rücknahme per Revert vor dem Bündel-Merge.

Entscheider: L0 · Anlass: Bericht lead-tech Plan TOOL-MESSFENSTER · ADR: —

## R825 · 2026-10-22 · BEOB-18 abgenommen; Pakete P1–P3 eingeplant

Ruling: Bericht `lead-production` (`docs/beob-18` @ `9ea1fe33`, Marke 2026-10-22, Archiv auf 43,9 KB) → **abgenommen**; Merge im Release-Bündel (Konflikt am Dateiende mit
`feat/ort-a` erwartet, Auflösung: beide Abschnitte behalten). Pakete: **P1 UI-BEIPACK-FERN** (S, nach UI-HAEPPCHEN-H P1, gleiche Dateien), **P2 TOOL-DASH-REST** (XS, `refactor:`)
und **P3 PERSONA-SCOUT-PFLEGE** (XS, `lead-design`, inkl. I-154-Korrektur) auf das Board; P2 und P3 starten, sobald der Deckel 10 Plätze frei hat (Ideen-Scouts laufen gerade).
`perf.test.ts`-Pin AK-E0-15a auf der ZEITRESERVE-PFLEGE-Liste.

Regelbezug: R287, R288, R471, R823 · Kosten bei Irrtum: kleine Pakete warten länger.

Entscheider: L0 · Anlass: Bericht lead-production BEOB-18 · ADR: —

## R826 · 2026-10-22 · Dauerregel: Kapazität voll nutzen, gesteuert durch die Limit-Ampel

Ruling: Nutzer: «hast du meinen letzten auftrag generell verstanden? auch in zukünftigen sessions? voraussetzung sind natürlich das ampelsystem mit den limits». **Dauerregel für
jede Session:** L0 hält den Studio-Deckel von **10 Agenten** (R823) aktiv voll, solange die Limit-Ampel (`.studio/limits.json`, STUDIO.md «Limits und Sessiongrösse») es erlaubt:
**grün** (5-h-Fenster < 60 % und Woche < 80 %) → Deckel ausschöpfen, nach jedem Bericht nachfüllen, jeden Strang mit eigenem Agenten bearbeiten (Umsetzung, Pläne, Specs, Gates,
Pflege, Ideen); höchstens **3 Controller mit Testläufen**, ≤ 2 Browser-Läufe, Fensterregel R803. **gelb** (5-h 60–80 % oder Woche > 80 %) → keine neuen Wellen, Angefangenes abschliessen.
**rot** (5-h > 80 %) → Ende-Routine. Engpass Rechnerlast → zusätzliche Plätze mit testfreier Arbeit füllen, nicht leer lassen. Ersetzt R698; ergänzt R475 und R445. Handbuch-Minor
durch `studio-coach`.

Regelbezug: Verfassung §5.8, R69, R424, R445, R475, R698, R823 · Kosten bei Irrtum: höherer Verbrauch im 5-h-Fenster; die Ampel bremst rechtzeitig.

Entscheider: Nutzer (Auftrag), L0 (Auslegung) · Anlass: Nutzerfrage · ADR: —

## R827 · 2026-10-22 · Runden-Ruling IDEEN-15; Kurzdesigns auf den frei gewordenen Plätzen

Ruling: Rangliste `lead-design` (`docs/ideen-15` @ `0b5ae668`, Handoff `.studio/handoffs/2026-10-22-lead-design-IDEEN-15.md`, Pool 25/40) → **angenommen** wie Entwurf R-IDEEN-15:
eingeplant **UI-HAEPPCHEN-I** (I-170, I-168, I-167; Umsetzung nach Stadtplanung-Merge), **LEBEN-SEE** (I-157 Kielwasser, I-156 Anlege-Klang), Kurzdesign **AUFLAGEN-KERN**
Stufe voll (I-163 gegen I-161 mit Dominanz-Rechnung, dazu I-162; gebaut wird höchstens eine Auflage); I-159 nach ORT-A- und Stadtplanung-Merge; geparkt I-169, I-160, I-164, I-166
(Beipack); verworfen I-158. R805 (4) ergänzt: neue Auflagen sperren den Zukauf ihrer Zielgüter, Lohn ehrenhalber. Sofort gestartet (R826, Ampel grün): Kurzdesign UI-HAEPPCHEN-I
(`lead-design`, sonnet, 1), Kurzdesign LEBEN-SEE (`lead-art`, sonnet, 1), Kurzdesign AUFLAGEN-KERN (`lead-design`, opus, 2), Spec-Nachtrag I-119/I-121 gegen LEBEN-STRASSE plus P3
PERSONA-SCOUT-PFLEGE (`lead-design`, sonnet, 1). Alle ohne Testläufe; `docs/ideen-15` geht ins nächste Release-Bündel.

Regelbezug: R208, R445, R805, R825, R826 · Kosten bei Irrtum: Designarbeit, die nach Merges nachgezogen wird.

Entscheider: L0 · Anlass: Bericht lead-design IDEEN-15 · ADR: —

## R828 · 2026-10-22 · Gate Plan SEERECHT: BEDENKEN angenommen, ein Controller mit Parallelität 2, Start bei freiem Test-Slot

Ruling: Gate-Urteil `lead-qa` BEDENKEN (Handoff `.studio/handoffs/2026-10-22-lead-qa-gate-plan-SEERECHT.md`) → **Plan frei** (`plan/seerecht` @ `792d565d`) unter den Auflagen B1–B3,
N1–N4 (R-SR-P1): **ein** `lead-tech`-Controller mit Folgeinstanzen und Parallelität 2 statt drei Controllern (Instanz 1: T01, dann T02 ∥ T05; Instanz 2: T03 ∥ T04, dann T06, T07;
Instanz 3: T08, T09 nach Stadtplanung-Merge); T01 beginnt mit der Seed-Suche d 30/35, ohne Fund `blocked` mit Messwerten; Wächter AK-SR-21 mit geschärftem Muster (Fehltreffer
`src/ui/time.ts:24`, `src/render/sprites.ts:2067`); AK-SR-14-Reihenfolge als Review-Beleg; Risiko Wert 8 in den Plan-Index; T07 prüft die Fernkarte in der Pause; T01-Dateiliste
ergänzen. SR-E2–SR-E5 angenommen (v20 nach Stadtplanung, `isValidCouncil` vorn, Typform, AK-SR-18 in `farLate.test.ts`). R-SR-P2 Merge-Reihenfolge Stadtplanung → T09 → Gate
Merge; R-SR-P3 Balancing-Lauf in T09 verbindlich. Budget **21** Starts. **Start**, sobald einer der drei Test-Controller-Plätze frei wird (R826).

Regelbezug: R805, R814, R826, gates.md Gate Plan · Kosten bei Irrtum: Seed-Fixture blockiert T01; dann Fixture-Ruling.

Entscheider: L0 · Anlass: Gate-Urteil lead-qa Plan SEERECHT · ADR: —

## R829 · 2026-10-22 · Nachtrag I-119/I-121 und Persona-Scout 1.3 abgenommen; P2 TOOL-DASH-REST direkt

Ruling: (1) Spec-Nachtrag I-119/I-121 (`design/i119-i121` @ `7c5638a0`: AK-A6, A8, A9, B3, B5 nachgezogen, neu AK-A10, AK-B8; setzt auf LEBEN-STRASSE auf; `RUN_TICKS` 60 prüft der
Plan) → **abgenommen**; Plan erst nach Merge von LEBEN-STRASSE und ORT-A T20. (2) Persona `design-idea-scout` 1.3 (`f9865e84`) → **abgenommen** (P3 erledigt). (3) Frei gewordener
Platz: **P2 TOOL-DASH-REST** (XS, R825) direkt an `tech-ui-engineer` (sonnet) ohne Lead, `refactor:`, Teilbeleg `make studio-test`, Branch `tool/dash-rest`; Budget **1**; Merge im Bündel.

Regelbezug: R715, R825, R826, STUDIO.md «L0 briefet den Umsetzer direkt» · Kosten bei Irrtum: gering.

Entscheider: L0 · Anlass: Bericht lead-design I119-NACHTRAG · ADR: —

## R830 · 2026-10-22 · Gate Kurzdesign LEBEN-SEE: OK, Plan sofort

Ruling: Kurzdesign `lead-art` (`design/leben-see` @ `3fef2126`, 24 AK: W1–W13 Kielwasser, K1–K11 Klang; S + S; kein Save, keine Baseline, kein Asset) → **OK**. Designfragen nach
Empfehlung: gekrümmte Spur entlang der Fahrlinie, direkt vor dem Rumpf (ORT-A-Schattenblock unberührt), Werte zentral in `wake.ts`; **ein** Klang beim Anlegen (I-156 geändert,
weil Schiffe im selben Tick ablegen), synthetische Figur `shipDock`, kein Schalter vor dem Hörurteil; Rumpf-Spiegelung zurückgestellt. Kein Rebase: die `renderer.ts`-Zeilen holen
nach dem ORT-A-Merge `main` per `git merge main`. AK-W4 bindet an die zum Zeitpunkt vorhandene Fahrzeit-Variante. Das Hörurteil kommt als «Bitte testen» in die Release-Notiz.
Plan `lead-tech` (Stufe leicht, sonnet), keine Testläufe; Budget **2**.

Regelbezug: R827, gates.md kombiniertes Gate Stufe leicht · Kosten bei Irrtum: Klang oder Spur stört; rückbaubar.

Entscheider: L0 · Anlass: Bericht lead-art LEBEN-SEE · ADR: —

## R831 · 2026-10-22 · Gate Kurzdesign UI-HAEPPCHEN-I: OK, F1–F8 nach Empfehlung, Plan sofort

Ruling: Kurzdesign `lead-design` (`design/ui-haeppchen-i` @ `3da866fa`, AK-I1–I29; P1 I-168 Kasse leer, P2 I-167 Bestand im Tooltip, P3 I-170 Wachstumsbremse; kein Save, keine
Baseline, `src/sim` unberührt) → **OK**. Befund angenommen: Lärm senkt nur die Belegung, Park ist Gegenmittel, kein Grund → Lärm als eigene Zeile, Park als Hinweis; Korrektur I-170
in `docs/ideen.md` bei der nächsten Pool-Pflege. F1 kein Klick-Sprung, F2 eine Ursache je Haus, F3 Lärm eigene Zeile, F4 «ohne Mangel», F5 Spitzenstufe zeigen, F6 Geld-Chip färben
(Gelb ab 3:00, Rot ab 1:00), F7 «alle Inseln» nur bei mehr, F8 P1/P2 sofort nach Plan, P3 nach Stadtplanung-Merge. P3 über 4 ms Rechenzeit → zurück an L0. Kein Rebase (Konflikte mit
UI-BEIPACK-FERN per `git merge`). Plan `lead-tech` (Stufe leicht, sonnet), keine Testläufe; Budget **2**.

Regelbezug: R827, gates.md kombiniertes Gate Stufe leicht · Kosten bei Irrtum: UI-only, rückbaubar.

Entscheider: L0 · Anlass: Bericht lead-design UI-HAEPPCHEN-I · ADR: —

## R832 · 2026-10-22 · Gate Plan LEBEN-SEE: OK; Warteschlange für Test-Controller-Plätze

Ruling: Plan `lead-tech` (`plan/leben-see` @ `b5425214`, T01–T08, Strang A Kielwasser, Strang B Klang) → **OK**, Entwürfe angenommen: Budget **11**, Parallelität 3; Strang B und
T01/T02 sofort bei Start, T03 nach ORT-A-Merge per `git merge main`; AK-K9 nur bei Befund eine `app.ts`-Zeile; AK-W4 bindet ohne Seerecht-Fixture an 10 Ticks; Hörurteil `shipDock`
als «Bitte testen». **Reihenfolge für frei werdende Test-Controller-Plätze (≤ 3, R826):** 1. SEERECHT (R828), 2. LEBEN-SEE, 3. UI-HAEPPCHEN-I (nach Gate Plan), 4. UI-BEIPACK-FERN
(nach UI-H P1). Wird ein Platz frei, startet L0 ohne weiteres Ruling den nächsten.

Regelbezug: R826, R828, R830 · Kosten bei Irrtum: Wartezeit einzelner Pakete.

Entscheider: L0 · Anlass: Bericht lead-tech Plan LEBEN-SEE · ADR: —

## R833 · 2026-10-22 · Gate Plan UI-HAEPPCHEN-I: OK, in der Warteschlange Platz 3

Ruling: Plan `lead-tech` (`plan/ui-haeppchen-i` @ `cc2dbddd`, T01–T10, 29 AK zugeordnet) → **OK**; Entwürfe R832-E bis R835-E angenommen (Nummern im Plan sind Entwurfsnummern):
Lärm-Zeile T05 nach Stadtplanung-Merge auf eigenem Branch `feat/ui-haeppchen-i-a2`, damit P1/P3-Grundteil früher ins Bündel können; Rechenzeit AK-I27 zweistufig, über 4 ms
`blocked` und zurück an L0 (Rückfall 2000 ms oder nur sichtbarer Chip); Konfliktregeln (`hud.ts` per `git merge main`, README-Zeilen unten anfügen). Budget **16**, Parallelität 2.
Start laut R832 als Platz 3 der Warteschlange.

Regelbezug: R831, R832 · Kosten bei Irrtum: UI-only.

Entscheider: L0 · Anlass: Bericht lead-tech Plan UI-HAEPPCHEN-I · ADR: —

## R834 · 2026-10-22 · TOOL-DASH-REST abgenommen, wartet aufs Bündel

Ruling: Review `qa-code-reviewer` OK (`tool/dash-rest` @ `7a442f43`, alle Entfernungen per `rg` belegt, `make studio-test` 1009 OK) → **Strang abgenommen**; Gate Merge im nächsten
Release-Bündel. Stilhinweis `views.js:~213` (Pfeil mit Ausdruck) entfällt als Kann.

Regelbezug: R825, R829, Verfassung §9.1 · Kosten bei Irrtum: gering.

Entscheider: L0 · Anlass: Review TOOL-DASH-REST · ADR: —

## R835 · 2026-10-22 · Gate Kurzdesign UI-BEIPACK-FERN: OK; vor Seerecht T04; Nachtrag Seerecht-Plan

Ruling: Kurzdesign `lead-design` (`design/ui-beipack-fern` @ `651f0520`, AK-BF1–BF17, S, alle sechs Befunde bestätigt) → **OK**. F1 `Umschalt+R` ohne Marke ignorieren
(`councilToggleAllowed`), F2 «zu spät» hinter der Lagerzahl ohne eigene Farbe, F3 Format «27 s» einheitlich, F4 Chronik «bestanden (bei Spielzeit 12:34)». Keine Überschneidung mit
UI-H P1 → die Abhängigkeit aus R825/R832 entfällt; Reihenfolge: **Beipack vor Seerecht T04**. Seerecht-Plan bekommt einen Nachtrag (AK-SR-16 «30 s»/«24 s», T04 nutzt
`formatGameTime(ticks)`), als Fortsetzung des Plan-Leads. Plan UI-BEIPACK-FERN `lead-tech` (Stufe leicht, sonnet), Budget **2**; Warteschlange R832 neu: 1. SEERECHT, 2. LEBEN-SEE, 3. UI-BEIPACK-FERN (S, kurz), 4. UI-HAEPPCHEN-I.

Regelbezug: R825, R828, R832 · Kosten bei Irrtum: Format-Doppelumbau, falls Seerecht vorher startet; durch Nachtrag abgefangen.

Entscheider: L0 · Anlass: Bericht lead-design UI-BEIPACK-FERN · ADR: —

## R836 · 2026-10-22 · Gate Plan UI-BEIPACK-FERN: OK, Warteschlange Platz 3

Ruling: Plan `lead-tech` (`plan/ui-beipack-fern` @ `2bd4e3db`, T01–T05, ein Strang) → **OK**; Entwürfe R836-E bis R839-E angenommen (`farOrderParts` einzige Quelle, Beipack vor
Seerecht T04, Merge per `git merge main`, Seerecht-Nachtrag läuft beim Plan-Lead). Budget **4**, Parallelität 1. Start laut R835 als Platz 3 der Test-Warteschlange.

Regelbezug: R835 · Kosten bei Irrtum: UI-only.

Entscheider: L0 · Anlass: Bericht lead-tech Plan UI-BEIPACK-FERN · ADR: —

## R837 · 2026-10-22 · LEBEN-STRASSE T01–T05 abgenommen, Stopp vor T06; SEERECHT startet auf dem frei gewordenen Test-Platz

Ruling: Zwischenbericht `lead-tech` (`feat/leben-strasse` @ `66a944ba`, T01–T05, Reviews BEDENKEN alle behoben, Teilbeleg 172 Tests, `src/sim` ohne Diff; Handoff
`.studio/handoffs/2026-10-22-lead-tech-LEBEN-STRASSE.md`) → **abgenommen bis T05**. Entwürfe: E1 Träger-Geometrie bei Tempo 0 bleibt auf dem zuletzt gemerkten Tempo ≥ 1
(`tickClock` merkt `pace` je Welt; Ergänzung zu R822) → angenommen; E2 Arbeitssatz mischt zum Holzbraun (`wallTimber`) für ΔE ≥ 10, `MIN_TORSO_CONTRAST` 1,35 → angenommen,
Sichtprüfung in T08; E3 Posen-Sprung beim Tempowechsel → T08 prüft, Folge per Ruling. Abweichungen (frühe `renderer.ts`-Zeilen, `WalkerMotion`, Beinschwung 0,45·W) angenommen;
das ausgelassene Delta-Review holt das opus-Final-Review nach. Strang ruht bis zum ORT-A-Merge (T06 mit `git merge main`); Restbudget 5. Worktree `.worktrees/leben-strasse-look`
ist gemergt und darf per `git worktree remove` (ohne `--force`) weg. **Frei gewordener Test-Platz → SEERECHT** (R828/R832) an einen `lead-tech`-Controller (sonnet), Budget **21**;
T04 erst nach UI-BEIPACK-FERN auf main, T08/T09 nach Stadtplanung.

Regelbezug: R803, R822, R826, R828, R832, R835 · Kosten bei Irrtum: Farbe/Tempo im Browser-Check nachziehen.

Entscheider: L0 · Anlass: Zwischenbericht lead-tech LEBEN-STRASSE · ADR: —

## R838 · 2026-10-22 · SEERECHT T01/T02/T03/T05 abgenommen, Stopp vor T04; LEBEN-SEE startet

Ruling: Zwischenbericht `lead-tech` SEERECHT (Handoff `.studio/handoffs/2026-10-22-lead-tech-SEERECHT.md`): T01 `7221c731` (Seed-Pins `SEED_D30`/`SEED_D35` = Seed 1), T02 `7e2065b5`,
T03 `f3ec2633` (`feat/seerecht-render`), T05 `e7144698` (`feat/seerecht-save`), Reviews OK, Teilbeleg, `SAVE_VERSION` 18, Balancing ohne Diff → **abgenommen bis zu diesen Commits**.
Strang ruht bis UI-BEIPACK-FERN auf main (T04) bzw. Stadtplanung (T08/T09); Restbudget 13. Risiko Seed-Pins auf Seed 1 zur Kenntnis. **Frei gewordener Test-Platz → LEBEN-SEE**
(R832) an einen `lead-tech`-Controller (sonnet), Budget **11**; T03 (`renderer.ts`) erst nach ORT-A-Merge.

Regelbezug: R828, R832, R835 · Kosten bei Irrtum: Nachzug der Seed-Pins bei Generator-Änderung.

Entscheider: L0 · Anlass: Zwischenbericht lead-tech SEERECHT · ADR: —

## R839 · 2026-10-22 · Gate Spec AUFLAGEN-KERN: BEDENKEN angenommen, Nachtrag sofort, Plan nach Stadtplanung und Seerecht

Ruling: Gate-Urteil `lead-qa` BEDENKEN (Handoff `.studio/handoffs/2026-10-22-lead-qa-gate-spec-AUFLAGEN-KERN.md`) → Entwürfe R-1 bis R-7 **angenommen**: I-163 «Ausfuhrmeister»
wird gebaut, I-161 verworfen, G1/G2/G3' gelten; Rückfall «Vorprodukte ohne Baustoffe» als Defs-Änderung; Zielmengen vorläufig (Messlauf T5 mit ≥ 2 Seeds); R-6 nennt alle
Literal-Stellen (`balance.test.ts:32`, `balance-monument.test.ts:164`, `trial.test.ts`, `trial-save.test.ts`, `tests/ui/trial.test.ts:42`, `world.ts:159`). **Nachtrag jetzt** durch
`lead-design` (sonnet, Spec-Nachtrag): Präfix `AUF-` für alle 22 AK; `c0` als Summe der abgerundeten Hausgrenzen inkl. Lärmfaktor (Stadtplanung) plus drei neue AK (Gleichgewicht
mit/ohne Lärmhaus, Lärmquelle während der Auflage, Steuer «niedrig»); AK-U2 ganzzahlig (`e0` = 10/20/100); AK-K12 gegen bestehende Pins plus Determinismus-AK mit Speichern/Laden;
tiefe Kopie in `cloneTrial`; Randfälle K3/K5/K7/K10/B3; Rückfall R553 benannt; Nachträge in Anhang 03 «Testmatrix» (Grösse). Danach Wiedervorlage `lead-qa` nur zu Befunden 1–3.
**Plan** erst nach den Merges von Stadtplanung und Seerecht; Save v21. Budget Nachtrag **1**, Wiedervorlage **1**.

Regelbezug: R136, R553, R670, R805, R827, gates.md Gate Spec · Kosten bei Irrtum: Zählung ruht dauerhaft (G3') — durch die neuen AK abgefangen.

Entscheider: L0 · Anlass: Gate-Urteil lead-qa AUFLAGEN-KERN · ADR: —

## R840 · 2026-10-22 · AUFLAGEN-KERN Spec abgenommen

Ruling: Wiedervorlage `lead-qa` OK (Nachtrag `design/auflagen-kern` @ `6fe3caf3`, 26 AK `AK-AUF-*`, Befunde 1–3 erledigt) → **Spec abgenommen**. Befunde 6–8 (`cloneTrial`, Randfälle,
R553-Rückfall) prüft der Plan bzw. das Review T3. Plan erst nach den Merges von Stadtplanung und Seerecht nach main (Save v21). `design/auflagen-kern` geht ins nächste Release-Bündel.

Regelbezug: R839 · Kosten bei Irrtum: Nachtrag beim Plan.

Entscheider: L0 · Anlass: Wiedervorlage lead-qa · ADR: —

## R841 · 2026-10-22 · Freie Plätze (Ampel grün, 5-h 40 %): Bündel-Vorprüfung REL-30, Prozess-Retro REL-29, Doku-Audit

Ruling: Text-Plätze leer, Test-Plätze belegt (R826). Starten: (1) **Gate Merge REL-30 vorab** an `lead-qa` (sonnet): Teilbelege und Merge-Trockenlauf aller bündelfertigen Branches
(TOOL-LOADSNAP, TOOL-DASH-REST, `docs/beob-18`, `docs/ideen-15`, Design-/Plan-Branches), Merge-Reihenfolge und Konfliktauflösungen, Release-Notiz-Entwurf; keine Testläufe; Budget **1**.
(2) **Prozess-Aussensicht REL-29** an `studio-process-coach` (sonnet, R127/R316 nach jedem Release; inkl. Vorfall R815, Kapazitätswechsel R823/R826); Budget **1**. (3) **DOKU-AUDIT**
an `lead-production` (sonnet, Skill `doku-audit`) vor dem nächsten Release: README, arc42, `docs/index.md`, STUDIO-Querverweise gegen main; Befunde als Bericht, Trivial-Fixes auf
Branch `docs/doku-audit-1`; Budget **1**.

Regelbezug: R127, R316, R826 · Kosten bei Irrtum: gering, alles testfrei.

Entscheider: L0 · Anlass: freie Kapazität · ADR: —

## R842 · 2026-10-22 · Vorprüfung REL-30: OK, Bündel-Merge morgen mit dem Push

Ruling: Vorab-Urteil `lead-qa` OK (Handoff `.studio/handoffs/2026-10-22-lead-qa-gate-REL-30-vorab.md`; 12 Merges konfliktfrei, nur `tools/studio/` und `docs/`) → **angenommen**,
Auflagen A1–A4 übernommen (Nachtrag `b7fd0a6a` auf `plan/seerecht` prüft das finale Gate Merge; loadsnap-Grenzen in E-071; Konflikt `docs/beobachtungen.md` beim ORT-A-Merge bewusst
lösen; Auflagen-Kern-Nachträge nur in Anhängen). Der Bündel-Merge nach main erfolgt **mit dem Push am 2026-10-23** in einem Integrator-Lauf (ein `make push-check`, Verfassung 1.3
§7.1), weil ein Merge nach main heute einen eigenen vollen Lauf bräuchte; kommen UI-H P1, UI-BEIPACK-FERN oder TOOL-MESSFENSTER-Teile hinzu, gibt `lead-qa` ein Ergänzungsurteil.

Regelbezug: R816, R817, Verfassung §7.1 · Kosten bei Irrtum: Pläne liegen bis morgen nur auf Branches.

Entscheider: L0 · Anlass: Vorab-Urteil lead-qa REL-30 · ADR: —

## R843 · 2026-10-22 · DOKU-AUDIT-1 abgenommen; Nachzug offener Befunde 1 und 4

Ruling: Bericht `lead-production` (`docs/doku-audit-1` @ `5de6e00a`: Save-Version in README/arc42 auf 18, `tickTrial` im Tick-Diagramm, ADR-015 im Index) → **abgenommen**, ins Bündel
REL-30 (Ergänzungsurteil `lead-qa` beim Gate). Offene Befunde: (1) vier Module ohne arc42-Zeile und (4) `docs/studio/releases.json` endet bei REL-26 → **DOKU-AUDIT-1b** an `lead-production`
(sonnet, Budget **1**) auf demselben Branch: REL-27–REL-29 in `releases.json` aus `state.md`-Notizen nachtragen, README gegen die Pakete von REL-27–29 prüfen, je eine arc42-Zeile für
`render/errands.ts`, `render/homeBuildings.ts`, `ui/cameraView.ts`, `audio/buildSounds.ts` aus dem Code ableiten. (2) Spec-/Plan-Listen in `docs/index.md` → nächster HAUSHALT.
(3) ADR-011-Status → Beobachtung.

Regelbezug: R841 · Kosten bei Irrtum: gering.

Entscheider: L0 · Anlass: Bericht lead-production DOKU-AUDIT-1 · ADR: —

## R844 · 2026-10-22 · Prozess-Retro REL-29: V1–V4 angenommen, V5 als Messauftrag

Ruling: Retro `studio-process-coach` (`docs/studio/retros/2026-10-22-rel-29-prozess.md`, `4439a947`) → angenommen: **V1** Push-Sperre in `guard.py` (kein `git push … main` ohne
`push_check` Exit 0 für genau den Hash, ausser L0-Freigabedatei) und **V2** `pushcheck.py` führt die Einzel-Wiederholung roter Zeit-/Timeout-Dateien selbst aus und weist sie im Event aus,
dazu Pin `perf.test.ts` AK-E0-15a entschärfen → Werkzeugpaket **TOOL-PUSHSPERRE** (Plan jetzt an `lead-tech` sonnet, Budget 2; Umsetzung auf dem nächsten freien Test-Platz, Platz 3 der
Warteschlange vor UI-HAEPPCHEN-I, damit es vor dem Push am 2026-10-23 greift, falls möglich). **V3** Ruling-Entwürfe sofort in `rulings.md`; `hook.py` meldet beim Start, wenn die
Stand-Zeile von `state.md` hinter der letzten R-Nummer liegt (Hook-Teil ins Paket TOOL-PUSHSPERRE). **V4** Pflichtfelder «Verfassung berührt?» und «Überschneidung mit offenen
Paketen» in Ruling- und Plan-Vorlage → `studio-coach` (Handbuch-Minor 1.69, Budget 1). **V5** L0-Kontextschnitt nach Bündelende als Messauftrag bis REL-31. Retro-Event-Trigger
`meilenstein:REL-29` trägt der Coach nach.

Regelbezug: R127, R316, R815, R826 · Kosten bei Irrtum: Push-Sperre blockiert einen legitimen Push; Freigabedatei als Ausweg.

Entscheider: L0 · Anlass: Retro REL-29 · ADR: —

## R845 · 2026-10-22 · Gate Plan TOOL-PUSHSPERRE: OK, eigener Hook statt Guard-Änderung

Ruling: Plan `lead-tech` (`plan/tool-pushsperre` @ `f4affcdb`, T01–T05) → **OK**, Entwürfe angenommen: (1) `guard.py` bleibt unberührt (Verfassung §1.3); V1 als **eigener PreToolUse-Hook**
`tools/studio/pushgate.py` (Muster `waitguard.py`/`modelguard.py`) mit zusätzlichem Eintrag in `.claude/settings.json`, der keinen bestehenden Guard schwächt; Freigabedatei
`.studio/push-freigabe` (Hash + Grund, einmal gültig) nur durch L0. (2) V3-Hook: `stampcheck.py` schärfen (letzte `## R…`-Überschrift, Schwelle 2, Meldung «PFLICHT» am Kontextanfang).
(3) Pin `perf.test.ts` AK-E0-15a erst nach Messprotokoll (T04; Vorschlag Best-of-3), Annahme: unter Last 5,4 ≤ 1/10 rot, 11-fach langsamer Schritt bleibt rot. (4) T05
(`pushcheck.py`-Wiederholung inkl. Nachholen von `studio-test build pages-limit`) erst nach TOOL-MESSFENSTER auf main; Stränge A und P davor. Budget **10**, Parallelität 2. Start auf dem
nächsten freien Test-Platz (Warteschlange: TOOL-PUSHSPERRE, UI-BEIPACK-FERN, UI-HAEPPCHEN-I). Beobachtung: `LOAD_WAIT = 3.0` im Code gegen «Last ≤ 4» im Handbuch.

Verfassung berührt?: ja, §1.3 (geschützte Guard-Datei bleibt unverändert; neuer Hook ergänzt nur) · Überschneidung mit offenen Paketen: `pushcheck.py`, `tests/test_pushcheck.py` mit
TOOL-MESSFENSTER (`feat/tool-messfenster`), Reihenfolge Messfenster → T05.
Regelbezug: R815, R844 · Kosten bei Irrtum: Hook blockiert legitimen Push; Freigabedatei oder Entfernen des Eintrags.

Entscheider: L0 · Anlass: Bericht lead-tech Plan TOOL-PUSHSPERRE · ADR: —

## R846 · 2026-10-22 · LEBEN-SEE: Strang B Klang abgenommen fürs Bündel, Strang A ruht; TOOL-PUSHSPERRE startet

Ruling: Zwischenbericht `lead-tech` LEBEN-SEE (Handoff `.studio/handoffs/2026-10-22-lead-tech-LEBEN-SEE.md`): **Strang B Klang** (`feat/leben-see-klang` @ `4e1e23e8`, Final-Review opus OK,
Browser-Check OK, K9 ohne `app.ts`-Diff, `src/sim` ohne Diff) → **abgenommen**; T08-Doku (README-Zeile Klang) holt der Controller vor dem Bündel per Fortsetzung nach; geht mit Ergänzungsurteil
`lead-qa` in REL-30, Hörurteil `shipDock` als «Bitte testen». `play()` prüft `hidden` für alle Ereignisse → angenommen. **Strang A Kielwasser** (`bf9502af`, T01/T02 OK) ruht bis zum
ORT-A-Merge (T03); AK-W4 nach SEERECHT-Merge nachprüfen; AK-W10 Kontrast 4,063 → bestanden. **Frei gewordener Test-Platz → TOOL-PUSHSPERRE** (R845) an einen `lead-tech`-Controller
(sonnet), Budget **10**; Stränge A (T01–T03) und P (T04) sofort, T05 nach TOOL-MESSFENSTER.

Verfassung berührt?: nein · Regelbezug: R830, R832, R845 · Kosten bei Irrtum: Klang stört; Abschalten per Revert vor dem Push.

Entscheider: L0 · Anlass: Zwischenbericht lead-tech LEBEN-SEE · ADR: —

## R847 · 2026-10-22 · TOOL-MESSFENSTER A/B abgenommen fürs Bündel; T00 bleibt gesperrt; UI-BEIPACK-FERN startet

Ruling: Bericht `lead-tech` (`feat/tool-messfenster` @ `5c138f56`, Final-Review opus nach zwei Fix-Runden OK, Teilbeleg 99/99 + `test_pushcheck` 37 + `studio-test` 1014;
Handoff `.studio/handoffs/2026-10-22-lead-tech-TOOL-MESSFENSTER.md`) → **Stränge A/B abgenommen**, gehen mit Ergänzungsurteil `lead-qa` in REL-30 (vor TOOL-PUSHSPERRE T05).
Entwurf 2 (`smoke.mjs` ohne Sperre, später Warnung) angenommen. **T00** startet erst, wenn L0 das Ende der ORT-A-Messungen meldet; T06 nur bei positivem T00; Restbudget 6.
Befunde ausserhalb Scope → `docs/beobachtungen.md` (L0 trägt ein). **Frei gewordener Test-Platz → UI-BEIPACK-FERN** (R836) an einen `lead-tech`-Controller (sonnet), Budget **4**,
mit dem Ziel, noch ins Bündel REL-30 zu kommen (Voraussetzung für Seerecht T04).

Verfassung berührt?: nein · Überschneidung mit offenen Paketen: `pushcheck.py`/`tests/test_pushcheck.py` mit TOOL-PUSHSPERRE T05 (Reihenfolge Messfenster → T05)
Regelbezug: R824, R835, R836 · Kosten bei Irrtum: Sperre blockiert Testläufe; `make messfenster-frei` bzw. Revert.

Entscheider: L0 · Anlass: Bericht lead-tech TOOL-MESSFENSTER · ADR: —

## R848 · 2026-10-22 · TOOL-PUSHSPERRE A und P abgenommen fürs Bündel; Pin 15a bleibt 2,5 ms; UI-HAEPPCHEN-I startet

Ruling: Zwischenbericht `lead-tech` (Handoff `.studio/handoffs/2026-10-22-lead-tech-TOOL-PUSHSPERRE.md`): **Strang A** `tool/pushsperre` @ `d6efeb31` (`pushgate.py`, Freigabedatei,
Stand-Warnung; Opus-Review BEDENKEN mit zwei Umgehungen behoben, Delta-Review opus OK, `studio-test` 1047) und **Strang P** `tool/perf-pin` @ `de7fbe33` (Best-of-3, Messprotokoll)
→ **abgenommen**, gehen mit Ergänzungsurteil `lead-qa` in REL-30. **Pin AK-E0-15a bleibt 2,5 ms** (Best-of-3, unter Last 0/10 rot); die Empfehlung 3,5 ms wird **nicht** angenommen,
weil der Anstieg des Mittels von 1,59 ms (2026-10-05) auf ≈ 2,3 ms eine echte Sim-Verlangsamung sein kann, die ein höherer Pin verdecken würde → Ursachenklärung als Auftrag im
Pool-Paket ZEITRESERVE-PFLEGE (Vergleich per `git bisect`-Messreihe, Last ≤ 4). Freigabe wird nur bei tatsächlicher Freigabe verbraucht; «PFLICHT»-Text in `stale_warning()` →
angenommen. T05 nach TOOL-MESSFENSTER auf main; Restbudget 3. Befunde ausserhalb Scope → `docs/beobachtungen.md`. **Freier Test-Platz → UI-HAEPPCHEN-I** (R833) an einen
`lead-tech`-Controller (sonnet), Budget **16**; T05 (Lärm-Zeile) nach Stadtplanung.

Verfassung berührt?: ja, §1.3 (`guard.py` unverändert, zusätzlicher Hook-Eintrag in `.claude/settings.json`) · Überschneidung mit offenen Paketen: T05 mit TOOL-MESSFENSTER
(`pushcheck.py`); UI-HAEPPCHEN-I mit UI-BEIPACK-FERN (`hud.ts`, disjunkt)
Regelbezug: R815, R844, R845 · Kosten bei Irrtum: Pin bleibt knapp; Flake-Verdacht hält an, bis die Ursache geklärt ist.

Entscheider: L0 · Anlass: Zwischenbericht lead-tech TOOL-PUSHSPERRE · ADR: —

## R849 · 2026-10-22 · UI-HAEPPCHEN-I A und B abgenommen fürs Bündel; Limit-Ampel gelb

Ruling: Zwischenbericht `lead-tech` UI-HAEPPCHEN-I (Handoff `.studio/handoffs/2026-10-22-lead-tech-UI-HAEPPCHEN-I.md`): **Strang A** `feat/ui-haeppchen-i-a` @ `a83b8ee0` (Kasse leer,
Wachstumsbremse ohne Lärm; Final-Review opus BEDENKEN niedrig) und **Strang B** `feat/ui-haeppchen-i-b` @ `e085f342` (Bestand im Tooltip; Final-Review OK) → **abgenommen**,
Ergänzungsurteil `lead-qa` beim Bündel REL-30. R-E1 bis R-E3 angenommen (AK-I27 0,1 ms bei 423 Häusern; Vorab-Zeittest entfällt). Fehlende Tests AK-I22/AK-I25 kommen mit T05 nach
dem Stadtplanung-Merge (Branch `feat/ui-haeppchen-i-a2`); Restbudget 8. Der Plan schrieb `make check` je Strang vor → Plan-Vorlage und offene Pläne auf Teilbeleg prüfen (Beobachtung,
`studio-coach` beim nächsten Handbuch-Minor). **Limit-Ampel gelb** (5-h-Fenster 60 %, R826): keine neuen Wellen; laufende Arbeit abschliessen, Bündel REL-30 für morgen vorbereiten.

Verfassung berührt?: nein · Überschneidung mit offenen Paketen: UI-BEIPACK-FERN (`hud.ts`, disjunkt, `merge-tree` sauber); Stadtplanung für T05
Regelbezug: R826, R831, R833 · Kosten bei Irrtum: UI-only.

Entscheider: L0 · Anlass: Zwischenbericht lead-tech UI-HAEPPCHEN-I · ADR: —

## R850 · 2026-10-22 · UI-HAEPPCHEN-H P1: Gegenmassnahme zum pagehide-Verlust vor dem Bündel

Ruling: Bericht `lead-tech` (`feat/ui-haeppchen-h-p1` @ `51b4e7a2`, T01–T04, Final-Review opus OK, Playtest H11–H13 bestanden, Teilbeleg 49/49, `src/sim` ohne Diff). Entwurf «Regel 4 gilt,
README nennt den Verlust» **nicht angenommen**: Ein Rettungs-Feature darf beim Neuladen nach «Davor laden» nicht den neueren Stand überschreiben. **Spec-Änderung per Ruling** (Regel 4/10):
Beim Laden eines Autosave-Platzes setzt das Spiel den Zeiger `inselreich.save.auto.last` auf **diesen** Platz; `pagehide` und der nächste reguläre Autosave schreiben dann in den geladenen
Platz bzw. wechseln wie gewohnt, der andere (neuere) Stand bleibt erhalten, bis der Spieler weiterspielt und der Wechsel ihn regulär erreicht. Umsetzung als Fix-Runde (Fortsetzung des
Umsetzers, Test zuerst: «Davor laden → Neuladen → neuerer Stand noch ladbar»), Delta-Review, README-Satz. Danach Ergänzungsurteil `lead-qa` im Bündel REL-30. Risiko Mehrfach-Parsen bei
`newestAuto`/`otherAuto` und Testlücke «defekter Zeiger» → im selben Fix mit abdecken, falls ≤ 1 Task, sonst Beobachtung.

Verfassung berührt?: nein · Überschneidung mit offenen Paketen: UI-HAEPPCHEN-H P2 (später, `renderer.ts`), keine Dateiüberschneidung mit Beipack/I
Regelbezug: R807, R808, R817 · Kosten bei Irrtum: P1 verpasst das Bündel morgen; dann REL-31.

Entscheider: L0 · Anlass: Bericht lead-tech UI-HAEPPCHEN-H P1 · ADR: —

## R851 · 2026-10-22 · UI-HAEPPCHEN-H P1: Fix R850 angenommen; Beschriftung nach Speicherzeit

Ruling: Fix-Runde `lead-tech` (`feat/ui-haeppchen-h-p1` @ `027be9dc`: `markAutoLoaded(slot)` in `storage.ts`, Rot-Beleg, defekter Zeiger abgedeckt, Mehrfach-Parsen behoben, Spec-Regeln 4/10
mit Vermerk, Teilbeleg 53/53, Delta-Review opus BEDENKEN niedrig) → **angenommen**. Letzte kleine Runde: Beschriftung in Ladeliste und Startkarte nach **Speicherzeitpunkt** (zuletzt
geschrieben = «Autosave», der andere = «Autosave davor»), unabhängig vom Zeiger; der Zeiger bestimmt nur das Schreibziel. Ist das mehr als eine kleine Runde, geht es als Beobachtung und
«Bitte testen» ins Bündel. Danach Ergänzungsurteil `lead-qa` im Bündel REL-30.

Verfassung berührt?: nein · Überschneidung mit offenen Paketen: keine
Regelbezug: R850 · Kosten bei Irrtum: verwirrende Beschriftung, UI-only.

Entscheider: L0 · Anlass: Fix-Runde lead-tech UI-HAEPPCHEN-H P1 · ADR: —

## R852 · 2026-10-22 · UI-HAEPPCHEN-H P1 abgenommen fürs Bündel REL-30

Ruling: Runde R851 (`feat/ui-haeppchen-h-p1` @ `d97c562d`: Schlüssel `inselreich.save.auto.written` für die Beschriftung, Zeiger bleibt Schreibziel, Rückfall ohne Migration; Delta-Review opus OK,
Teilbeleg 56/56, `src/sim` ohne Diff) → **Strang P1 abgenommen**, geht mit Ergänzungsurteil `lead-qa` in REL-30. Alte Formulierung Spec Regel 2/6 → Beobachtung beim nächsten Spec-Kontakt.
«Bitte testen»: «Davor laden», Seite neu laden, beide Stände in der Liste richtig benannt und ladbar.

Verfassung berührt?: nein · Überschneidung mit offenen Paketen: keine
Regelbezug: R850, R851 · Kosten bei Irrtum: UI-only, Revert vor dem Push.

Entscheider: L0 · Anlass: Bericht lead-tech UI-HAEPPCHEN-H P1 · ADR: —

## R853 · 2026-10-22 · Vorfall: Controller schliefen nach Arbeiter-Ende ein; L0 leitet Arbeiter-Meldungen weiter

Ruling: Nutzerhinweis («ich habe die agenten nicht mehr arbeiten gesehen»). Befund: Zwei Controller standen still, bis L0 sie anschrieb. (a) UI-BEIPACK-FERN: Der Controller wartete auf
seinen Opus-Reviewer; dessen Abschlussmeldung kam bei L0 an statt beim Controller (≈ 11:10Z), L0 wertete sie als Info («lead-tech steuert selbst») und weckte niemanden → ≈ 2 h Stillstand
bis 13:10Z. (b) ORT-A: Der Umsetzer meldete sich nach einem Hintergrund-Messlauf nicht mehr; der Zwei-Frame-Fix (R823) blieb ≈ 2 h liegen, bis L0 um 12:01Z nachfragte. **Ab sofort:**
(1) Kommt bei L0 eine Abschluss- oder Zwischenmeldung eines Arbeiters an, der zu einem Lead gehört, leitet L0 sie im selben Zug per `SendMessage` an diesen Lead weiter («Ergebnis da,
bitte fortsetzen»). (2) Nach jeder Meldung prüft L0 die letzten Heartbeats der aktiven Agenten; ein aktiver oder wartender Agent ohne Heartbeat seit > 20 min ohne bekannte Wartebedingung
wird angeschrieben. (3) Leads warten auf Arbeiter nie nur passiv: Beim Warten nennen sie im Status, worauf, und fragen nach spätestens 30 min nach. Handbuch-Minor durch `studio-coach`
in der Ende-Routine; Vorfall in die Kurz-Retro.

Verfassung berührt?: nein · Überschneidung mit offenen Paketen: keine
Regelbezug: Verfassung §8.1, R803, R826, Handbuch 1.39 (Warten per Benachrichtigung) · Kosten bei Irrtum: einige zusätzliche Nachfragen.

Entscheider: L0 · Anlass: Nutzerhinweis · ADR: —

## R854 · 2026-10-22 · Nutzerauftrag Berichtshierarchie: Vordergrund-Regel technisch erzwingen

Ruling: Nutzer: «es würde doch mehr sinn machen wenn es eine klare hierarchie der delegationen und rückmeldungen gibt. die worker sollten sich nicht bei dir melden … sondern bei ihrem
auftraggeber/chef.» Befund: Die Hierarchie steht bereits im Handbuch (STUDIO.md «Berichtsweg L2 → L1 → L0», «Vordergrund-Regel»: Leads starten Arbeiter mit `run_in_background: false`,
das Ergebnis kommt als Rückgabewert direkt zum Lead). Heute haben Leads Arbeiter trotzdem **im Hintergrund** gestartet; dadurch landeten Arbeiter-Meldungen bei L0 und die Leads
schliefen ein (R853). Die Regel war nur Text. **Entscheid:** (1) **TOOL-VORDERGRUND**: `tools/studio/waitguard.py` bekommt Regel C — ein `Agent`/`Task`-Aufruf mit
`run_in_background: true` durch einen Aufrufer mit `agent_type` «lead-*» (und durch jeden Arbeiter) wird mit `deny` und Hinweis «Arbeiter im Vordergrund starten, parallel = mehrere
Aufrufe in einer Nachricht» abgelehnt; L0 (Hauptsession) bleibt frei, Leads im Hintergrund zu starten (ADR-007). TDD mit `make studio-test`, Umsetzer `tech-ui-engineer` direkt, Review
`qa-code-reviewer`; Budget **2**; wirkt nach dem Merge im Bündel REL-30. (2) Bis dahin weist L0 laufende Leads auf die Regel hin. (3) R853 (1) bleibt als Rückfall: landet doch eine
Arbeiter-Meldung bei L0, leitet L0 sie weiter. (4) Arbeiter senden nie per `SendMessage` an `main`; das ergänzt `studio-coach` in den Arbeiter-Personas.

Verfassung berührt?: nein (`guard.py` unberührt, eigenes Hook-Modul) · Überschneidung mit offenen Paketen: `waitguard.py` in keinem offenen Branch
Regelbezug: Verfassung §2, §8.1; ADR-007; R646/R647; R853 · Kosten bei Irrtum: ein Lead wird bei einem legitimen Hintergrundstart blockiert; Rückfall `MODE = "warn"`.

Entscheider: L0 · Anlass: Nutzerauftrag · ADR: —

## R855 · 2026-10-22 · UI-BEIPACK-FERN abgenommen fürs Bündel REL-30

Ruling: Bericht `lead-tech` (`feat/ui-beipack-fern` @ `9694e945`, Opus-Review BEDENKEN → H1/N1 behoben, Delta-Review opus OK, Playtest BF13–BF17 bestanden, Teilbeleg, `src/sim` nur
Kopfkommentar; Handoff `.studio/handoffs/2026-10-22-lead-tech-UI-BEIPACK-FERN.md`) → **abgenommen**, Ergänzungsurteil `lead-qa` im Bündel REL-30; Merge **vor** Seerecht T04.
R837-E/R838-E/R840-E (Entwurfsnummern) angenommen. N2, N3 und das überflüssige `as never` in `order.test.ts:769` → Beobachtung. Der volle Lauf kommt im Push-Check des Bündels.
Befund des Controllers: Arbeiter-Starts mit `run_in_background: false` liefen trotzdem asynchron → Prüfauftrag zur Benachrichtigungs-Zustellung (R854 wird ggf. nachgeschärft).

Verfassung berührt?: nein · Überschneidung mit offenen Paketen: UI-HAEPPCHEN-I (`hud.ts`), Stadtplanung (`app.ts`), Seerecht (`islandCard.ts`); Auflösung per `git merge main`
Regelbezug: R835, R836, R854 · Kosten bei Irrtum: UI-only.

Entscheider: L0 · Anlass: Bericht lead-tech UI-BEIPACK-FERN · ADR: —

## R856 · 2026-10-22 · Ursache der eingeschlafenen Leads: Claude-Code-Verhalten; Rückkanal per Adresse; Ende-Routine

Ruling: Befund `claude-code-guide` (Doku sub-agents, tools-reference, agent-teams; CLI 2.1.308): `run_in_background` ist am Agent-Werkzeug nicht dokumentiert; Subagent-Starts laufen
standardmässig im Hintergrund (seit v2.1.198); laut Doku sollte ein Lead auf seine Kinder warten, beobachtet ist das Gegenteil (Meldungen der Enkel landen in der Hauptsession, der Lead wird
nicht geweckt) — passt zu einem gemeldeten Fehlerbild («nested background subagent never re-woken», inoffiziell). **Folgerung:** Die Ursache liegt nicht (nur) in der Disziplin der Leads;
R854 Regel C (TOOL-VORDERGRUND, Review OK) bleibt als Schutz gegen ausdrückliche Hintergrund-Starts, löst die Zustellung aber nicht. **Entscheid:** (1) Standard bis zur Behebung: L0
leitet jede Arbeiter-Meldung sofort an den zuständigen Lead weiter (R853) — L0 ist dabei nur Poststelle, Empfänger bleibt der Lead. (2) Rückkanal-Muster als Paket für die nächste Session
(**TOOL-RUECKKANAL**, `studio-coach` + Werkzeug): L0 nennt jedem Lead nach dem Start seine Adresse (agentId); Leads schreiben sie in jedes Arbeiter-Briefing («Melde dein Ergebnis per
SendMessage an …»); Arbeiter-Personas bekommen das Werkzeug `SendMessage` (nur an den Auftraggeber, nie an `main`). (3) Fehlerbericht an Anthropic als Entwurf (`/feedback`, Freigabe
durch den Nutzer). (4) **Limit-Ampel 79 %**: Ende-Routine jetzt; ORT-A beendet den laufenden Messblock und übergibt.

Verfassung berührt?: nein · Überschneidung mit offenen Paketen: TOOL-VORDERGRUND (`waitguard.py`), Arbeiter-Personas
Regelbezug: R826, R853, R854, Verfassung §2 · Kosten bei Irrtum: L0 bleibt Poststelle, bis das Muster greift.

Entscheider: L0 · Anlass: Bericht claude-code-guide, Limit-Ampel · ADR: —

## R857 · 2026-10-22 · ORT-A C11 pausiert; AK-31 bestanden; AK-37 Referenz `de0a372a`

Ruling: Pausenbericht `lead-tech` (Handoff `.studio/handoffs/2026-10-22-lead-tech-ORT-A-C11.md`): Zwei-Frame-Patch `4db494e9` → **AK-31 bestanden** (Σover25 = 0 bei Seed 7, Seed 14, Fixture;
A/A 0). **AK-37:** Vergleichsreferenz ist `de0a372a` (Stand vor k2), nicht `ort-a-basis`; der dunklere Kern gegen die Basis stammt vom Hofsaum-Boden, nicht von T16 → mit n = 17/20 (Δ −0,4)
**bestanden**. AK-32 Seed 14/Fixture und AK-30 auf `4db494e9` laufen noch im Hintergrund (Umsetzer berichtet; Log `scratchpad/h10.log`); bestehen sie, folgt in der nächsten Session die
Abnahme k1/k2, Merge nach `feat/ort-a` (Teilbeleg, Verfassung 1.3), T18. Danach geben ORT-A-Messungen das Fenster für TOOL-MESSFENSTER T00 frei.

Verfassung berührt?: nein · Überschneidung mit offenen Paketen: LEBEN-STRASSE, LEBEN-SEE, UI-H P2, Stadtplanung warten auf den ORT-A-Merge
Regelbezug: R793, R800, R823 · Kosten bei Irrtum: AK-37 falsch referenziert; Nachmessung gegen die Basis jederzeit möglich.

Entscheider: L0 · Anlass: Pausenbericht lead-tech ORT-A · ADR: —

## R858 · 2026-10-22 · Kurz-Retro abgenommen; Briefing-Vorlage auf Teilbeleg

Ruling: Kurz-Retro `studio-coach` (`docs/studio/retros/2026-10-22-session-3b332328-ende.md`, Handbuch 1.70, `cbc9d360`) → **abgenommen**. Empfehlung angenommen:
`docs/studio/templates/briefing.md` (Z. 23, 81) verlangt noch «make check grün» → auf Teilbeleg (Verfassung 1.3 §9.2) umstellen und offene Pläne (Seerecht, LEBEN-_, UI-I, TOOL-_)
mitprüfen; erstes Paket der nächsten Session neben dem Bündel REL-30 (`studio-coach`, Budget 1). Rote Effizienz-Ampel (Steuerung 60,7 %, Cache-Write 29,3 %, L0-Kontext 516k) →
Messaufträge laut Retro; Hebel ist TOOL-RUECKKANAL (R856).

Verfassung berührt?: nein · Überschneidung mit offenen Paketen: alle offenen Pläne (nur DoD-Zeile)
Regelbezug: R849, R856 · Kosten bei Irrtum: ein überflüssiger voller Lauf je Strang.

Entscheider: L0 · Anlass: Kurz-Retro Session-Ende · ADR: —

## R859 · 2026-10-23 · Session-Start: «mach weiter» = Plan aus state.md; REL-30 zuerst

Ruling: Auslegung «mach weiter» als Fortsetzung des Plans aus `state.md` (Abschnitt «Fortsetzung») — Zweck der Anweisung: Arbeit ohne Rückfrage fortsetzen; Auslegung widerspricht ihm
nicht, weil keine neue Richtung genannt ist. **Reihenfolge:** (1) REL-30: `lead-qa` Ergänzungsurteil für die seit R842 fertigen Stränge (UI-H P1, UI-BEIPACK-FERN, UI-I A/B,
LEBEN-SEE Klang, TOOL-MESSFENSTER, TOOL-PUSHSPERRE A/P, TOOL-VORDERGRUND, Nachtrag `plan/seerecht` b7fd0a6a, `plan/tool-pushsperre`) mit merge-tree-Trockenlauf des ganzen Bündels; danach
`production-integrator` (seriell mergen, ein `make push-check`, Push nur bei Exit 0). Bis Exit 0 keine Umsetzer und Controller (R464); Gates, Doku, Pläne ohne Testlauf parallel.
(2) ORT-A: Log `h10.log` ausgewertet — AK-32 Seed 14 und Fixture Σover25 = 0 (bestanden), AK-30 Seed 7 Δ 0 % (bestanden), **AK-30 Seed 14 abgebrochen** (`unsettled top-level await`
in `perf.mjs`); Nachmessung erst nach dem Push (Last, R329). (3) `studio-coach`: Briefing-Vorlage auf Teilbeleg (R858) und TOOL-RUECKKANAL Doku-/Persona-Teil (R856). Limit-Ampel grün
(5 h 30 %, 7 Tage 33 %).

Verfassung berührt?: nein · Überschneidung mit offenen Paketen: REL-30-Bündel, ORT-A
Regelbezug: R826, R842, R857, R858, R464 · Kosten bei Irrtum: eine Session-Stunde in falscher Reihenfolge.

Entscheider: L0 · Anlass: Session-Start a5d45446 · ADR: —

## R860 · 2026-10-23 · REL-30 Gate Merge OK; Doku-Konflikte vorab; TOOL-RUECKKANAL abgenommen und ins Bündel

Ruling: (1) **Gate Merge REL-30: OK mit BEDENKEN niedrig** (`lead-qa`, Handoff `.studio/handoffs/2026-10-23-lead-qa-gate-REL-30.md`): UI-I A ohne Test für AK-I22/AK-I25 bis T05 (R849),
H P1 «Davor laden/Neuladen» nur per Unit-Test (Browser-Prüfung in «Bitte testen»), UI-BEIPACK ohne Abschlusslauf (deckt `make push-check`). Kein Save-Wechsel (v18). Reihenfolge laut
Handoff Abschnitt 2 (22 Branches, `--no-ff`). (2) **Konflikte vorab** durch `lead-production` (Integrator löst keine): `main` in `docs/beob-18` mergen (BEOB-18-Fassung plus die seither
angehängten Einträge), `docs/ideen-15` in `feat/ui-haeppchen-h-p1` mergen (ideen-15-Fassung, I-147 «umgesetzt»); reine Anhänge über `make merge-driver`. Neue Spitzen ersetzen die Hashes
der Liste. (3) **TOOL-RUECKKANAL** `docs/rueckkanal` @ `42626dd7` abgenommen (`studio-test` 1009 OK), als Branch 23 ins Bündel, wenn der merge-tree-Trockenlauf sauber ist, sonst
REL-31. Die Zusatzänderung im Handbuch (Persona-Änderung → `make studio-test`) wird angenommen. Plan-Fundstellen mit «make check» (`plan/seerecht`, `plan/leben-strasse`,
`plan/leben-see`, `plan/ui-haeppchen-i`) stellt der Plan-Lead vor dem nächsten Umsetzungsstart auf den Teilbeleg um. Probe-Meldung per `SendMessage` beim ersten Lead-Paket nach dem
Merge; bis dahin bleibt L0 Poststelle (R853). (4) **Push:** ein `make push-check` (`VITEST_MAX_WORKERS=5`) auf dem gebündelten Stand; bei Exit 0 Push genau des dort genannten
geprüften Hashes (`git push origin <hash>:main`); bei Exit ≠ 0 nie pushen, an L0 melden (R815). Danach CI und Pages prüfen.

Verfassung berührt?: nein · Überschneidung mit offenen Paketen: ORT-A (`docs/beobachtungen.md`), IDEEN-16 (zweigt von `docs/ideen-15` ab)
Regelbezug: R815, R816, R842, R856, R858 · Kosten bei Irrtum: ein Release mit zwei schwach belegten UI-Details; Revert vor dem nächsten Push möglich.

Entscheider: L0 · Anlass: Gate-Urteil lead-qa, Bericht studio-coach · ADR: —

## R861 · 2026-10-23 · Runden-Ruling IDEEN-16

Ruling: Rangliste `lead-design` (`docs/ideen-16` @ `66c4df45`, Handoff `.studio/handoffs/2026-10-23-lead-design-IDEEN-16.md`, Pool 27/40) **angenommen**: eingeplant **UI-HAEPPCHEN-J**
(I-176 Häppchen, I-139 und I-138 Beipack; Kurzdesign Stufe leicht, `sonnet`, nach UI-BEIPACK-FERN auf main, also nach dem Push REL-30). **I-183** Notration: Rechnung `design-economy-designer` (Handoff, `docs/ideen-16` @ `66c4df45`) → **geparkt** bis `BUY_RISE` > 0 (wie I-110, R722); feste Ration ist keine echte Wahl, ein Fischer schlägt beide. Nebenbefund für I-137: Dämpfer ab Siedlern spürbar machen. Geparkt: I-172, I-182, I-171, I-181,
I-116 (wie Entwurf). Verworfen: I-106 (gelöst), I-173 (Widerspruch R839/R840), I-184. `docs/ideen-16` geht ins Bündel REL-31. Takt der Ideen-Runden und Playtest: siehe R862 (Nutzerauftrag).

Verfassung berührt?: nein · Überschneidung mit offenen Paketen: UI-BEIPACK-FERN (REL-30), Erweiterung 1 (Nutzer-Session, O8/K5)
Regelbezug: R445, R599, R827, R839 · Kosten bei Irrtum: ein Kurzdesign mit geringem Spielwert.

Entscheider: L0 · Anlass: Bericht lead-design IDEEN-16 · ADR: —

## R862 · 2026-10-23 · Dauerauftrag (Nutzer): Fokus Spieltiefe, Erweiterungen, neue Modi; keine Playtests; Schweigen = ok

Ruling: Nutzer (Prompt 2026-10-23): «wenn du nichts hörst von mir ist alles gut. playtests brauchst du nicht tun. lass die kreativen köpfe im team nach neuen elementen suchen. vor allem
spieltiefe, erweiterungen, neue modi … etwas was den spieler länger am ball hält. dazu darf gerne recherchiert werden». **Auslegung:** (1) Schweigen des Nutzers = Zustimmung, Plan läuft
weiter. (2) Kein Playtest als Ideen-Input (Teil von R861-Entwurf gestrichen). (3) R445 geschärft: Freie Kapazität geht vorrangig an eine **Tiefen-Runde `TIEFE-1`** (`lead-design`, `opus`):
Web-Recherche zu Langzeitmotivation im Genre (Recherche-Agenten `general-purpose`, `sonnet (Recherche)`), daraus Vorschläge für Spieltiefe, neue Spielmodi und Erweiterungs-Themen
(Erweiterung 2 ff.; Erweiterung 1 bleibt Nutzer-Session R519 — lesen zum Abgleich, nicht ändern). Ergebnis: Recherchebericht, Ideen im Pool, Rangliste, Erweiterungs-Skizzen; Säulenwechsel
oder Erweiterungswahl gehen als Empfehlung in die Warteschlange (§5.3). Komfort-Häppchen (UI-HAEPPCHEN-J) laufen nachrangig weiter. (4) «höchstens eine Runde je Session» gilt für
klassische Ideen-Runden; TIEFE-1 ist ein Recherche-Paket und zählt nicht dagegen. Zweck der Anweisung: mehr Langzeitmotivation; Auslegung widerspricht ihm nicht, weil die Kapazität
dorthin statt in Playtests und Kleinkram fliesst.

Verfassung berührt?: nein · Überschneidung mit offenen Paketen: Erweiterung 1 (Nutzer-Session), IDEEN-16
Regelbezug: R445, R519, R861, Verfassung §5.3 · Kosten bei Irrtum: Recherche-Aufwand ohne Umsetzung; nichts Irreversibles.

Entscheider: L0 · Anlass: Nutzerauftrag · ADR: —

## R863 · 2026-10-23 · Dauerauftrag (Nutzer): Nutzeranweisungen gelten über die Session hinaus

Ruling: Nutzer (Prompt 2026-10-23): «nimm meine anweisungen in den sessions immer als generelle anweisungen wahr … auch in der nächsten session angewendet werden. ausser etwas hat
explizit nur was mit der laufenden session zu tun.» **Entscheid:** Jede Nutzeranweisung ist ein **Dauerauftrag**, ausser sie ist ausdrücklich auf die laufende Session beschränkt; im
Zweifel dauerhaft. L0 hält sie (1) als Ruling mit Vermerk «Dauerauftrag» fest, (2) trägt sie in `state.md` unter «Daueraufträge» ein, (3) lässt Regeln mit Dauerwirkung ins Handbuch
übernehmen (`studio-coach`, Paket DAUERAUFTRAG, `docs/dauerauftrag` @ `b966c88f`, Handbuch 1.72, ins Bündel REL-31) und (4) sichert sie im Gedächtnis. Rückwirkend Daueraufträge: R862 (Fokus Spieltiefe/Erweiterungen/Modi, Recherche erlaubt, keine
Playtests als Ideen-Input, Schweigen = Zustimmung) und R445. Zweck der Anweisung: Der Nutzer will nichts wiederholen müssen; Auslegung widerspricht ihm nicht.

Verfassung berührt?: nein (Handbuch, Output-Style) · Überschneidung mit offenen Paketen: TOOL-RUECKKANAL (STUDIO.md, Handbuch 1.71)
Regelbezug: R445, R862, Verfassung §5 · Kosten bei Irrtum: eine sessiongebundene Anweisung wirkt zu lange; Nutzer korrigiert per Wort.

Entscheider: L0 · Anlass: Nutzerauftrag · ADR: —

## R864 · 2026-10-23 · Runden-Ruling TIEFE-1: Ehrenbuch und Modus «Inselproben» starten; N-104

Ruling: Rangliste `lead-design` (`docs/tiefe-1` @ `8c79bfb4`, Handoff `.studio/handoffs/2026-10-23-lead-design-TIEFE-1.md`, Pool 37/40) **angenommen**: (1) **Kurzdesign I-186 Ehrenbuch**
(Meisterstücke über alle Partien, Lohn ehrenhalber) jetzt, `lead-design` `opus`. (2) **Brainstorming «Modus Inselproben»** (I-190 Inselprobe, I-191 Tagesinsel, I-192 Szenarien «Knappe
Zeiten», ein Szenario als Prüfling, Lösbarkeitsrechnung je Szenario) jetzt, Stufe voll, parallel. Keine Meta-Boni über Partien (Spielwerte bleiben je Partie gleich). (3) **I-187 Inselruf**
erst mit Erweiterung 1 O8/K5 (Nutzer-Session) und dem Ergebnis WIRTSCHAFT-TIEFE. (4) Baustein I-189 Expedition für I-194; geparkt I-193. (5) **N-104** (Reihenfolge der Erweiterungen nach
Erweiterung 1, Empfehlung «Neue Ufer») in der Warteschlange; Entwurf B (Jahreszeiten als Standard) nicht angelegt — erst wenn I-195 eingeplant wird, Empfehlung dann Schalter «aus».
(6) Recherche-Belege dünn (Seiten nicht abgerufen): die beiden Design-Pakete dürfen gezielt nachrecherchieren (WebFetch der genannten Quellen). (7) Beifund README «Spielstand-Version 13»
geprüft: falsch, README nennt v18 (`README.md:299`).

Verfassung berührt?: nein · Überschneidung mit offenen Paketen: Erweiterung 1 (Nutzer-Session), WIRTSCHAFT-TIEFE
Regelbezug: R208, R445, R722, R839, R862 · Kosten bei Irrtum: ein Kurzdesign und ein Brainstorming, rückbaubar.

Entscheider: L0 · Anlass: Bericht lead-design TIEFE-1 · ADR: —

## R865 · 2026-10-23 · WIRTSCHAFT-TIEFE: Favorit «Stadtrecht» (V4) ins Kurzdesign; «Wartung» (E1) nach Stadtplanung

Ruling: Bericht `lead-design` (`docs/wirtschaft-tiefe` @ `d63971a6`, Handoff `.studio/handoffs/2026-10-23-lead-design-WIRTSCHAFT-TIEFE.md`) **angenommen**. Befund: bis min 14 knapp, danach
+2500…+3200 Geld/min; Ursachen: Einwohner netto positiv (`tiers.ts:18-45`), keine laufende Senke ausser Unterhalt, feste Kaufpreise. Reine Bremsen (Aufschlag, Bedarf, Verwaltung, Verderb)
verworfen (3–30 %, keine Wahl). (1) **V4 «Stadtrecht»** (käufliche weitere Rats-Sitzungen, 5000 × 1,6^k plus Stein/Glas, je Sitzung A/B-Wahl) → Kurzdesign Stufe voll jetzt (design-only,
testfrei), Save v19 erwartet, Balancing-Läufe unverändert. (2) **E1 «Wartung»** nach Stadtplanung (R780), braucht neue Pins in drei Balancing-Läufen. (3) Geparkte I-110, I-111, I-130,
I-134, I-183 erst nach E1. (4) Hinweis an die Nutzer-Session (Erweiterung 1 O8/K5): Stiftungen auf der Stadtrecht-Leiter aufsetzen — im Bericht an den Nutzer. (5) Beifunde
(Werkzeug nach Endausbau ohne Verbrauch; veralteter Kommentar `tests/sim/merchantsController.ts:20-21`) nach `docs/beobachtungen.md`. Arbeiter liefen trotz Vorgabe im Hintergrund →
Beleg für TOOL-RUECKKANAL/Retro.

Verfassung berührt?: nein · Überschneidung mit offenen Paketen: Erweiterung 1, Inselproben (Szenario «Knappe Zeiten»), Stadtplanung C1
Regelbezug: R722, R780, R862 · Kosten bei Irrtum: ein Kurzdesign.

Entscheider: L0 · Anlass: Bericht lead-design WIRTSCHAFT-TIEFE · ADR: —

## R866 · 2026-10-23 · REL-30 live; ORT-A wieder auf; TOOL-MERGE-APPEND; Seerecht nach ORT-A-Messung

Ruling: Bericht `lead-production` (Handoff `.studio/handoffs/2026-10-23-lead-production-REL-30.md`): **REL-30 live**, Push `d2376904..bc9664d0` (Fast-Forward, geprüfter Hash), `make push-check`
Exit 0 (Startlast 4,42), `check-ci-perf` Exit 0, CI 39936129287 grün, Pages 39937129992 grün; 23 Branches inkl. `docs/rueckkanal`. Zusätzliche Vorab-Auflösungen in vier weiteren Branches
(`docs/beobachtungen.md`, Merge-Treiber versagt bei letzter Basiszeile im Konfliktblock) **nachträglich angenommen** — Zeilenverlust geprüft, keiner. (1) **TOOL-MERGE-APPEND** (lead-tech,
Werkzeug, Stufe leicht): `tools/studio/merge_append.py` behandelt Blöcke mit letzter Basiszeile als Anhang; Integrator-Persona: `timeout` fehlt auf macOS → Ersatz. (2) **ORT-A** wieder auf
(lead-tech): AK-30 Seed 14 auf `4db494e9` nachmessen (allein im Messfenster, Load ≤ 4), dann Abnahme k1/k2 (Teilbeleg), Merge nach `feat/ort-a`, T18. (3) **Seerecht T04** (UI-BEIPACK auf
main) startet erst nach Ende der ORT-A-Messung, damit die Messung allein läuft (Lastregel R329). Nächster Push frühestens 2026-10-24 (R816).

Verfassung berührt?: nein · Überschneidung mit offenen Paketen: ORT-A, SEERECHT, TOOL-PUSHSPERRE T05
Regelbezug: R815, R816, R329, R838, R857 · Kosten bei Irrtum: Seerecht startet eine Stunde später.

Entscheider: L0 · Anlass: Bericht lead-production REL-30 · ADR: —

## R867 · 2026-10-23 · I-186 Ehrenbuch: D1–D3 angenommen; Gate Spec BEDENKEN → Nachtrag N1–N6

Ruling: Kurzdesign `design/i186-ehrenbuch` @ `d993b5d9` (9 Meisterstücke, eigener Schlüssel `inselreich.ehrenbuch` v1, Save v18 und Baseline bitgleich). **D1** Partie-Merker im Buch,
**D2** Schwellen 9000/18 000 Ticks (rückbaubar), **D3** Stückzahl wächst mit Auflagen — angenommen. Gate Spec `lead-qa` (Handoff `.studio/handoffs/2026-10-23-lead-qa-gate-I-186.md`):
**BEDENKEN**, Nachtrag vor dem Plan: N1 Tracker für Vorher-Zustand bei Laden/Neue Insel (mit Browser-Check), N2 Auswertung je `step` bei mehreren Schritten je Frame, N3 Schwelle 18 000
belegen oder als Risiko mit Rückfall; N4/N5 mit; N6 AK-Kennungen `AK-EB-01…` (R417); N7–N9 in den Plan. Wiedervorlage beim Gate. Browser-Checks zur Abnahme bleiben trotz R862 —
R862 streicht Playtests als Ideen-Input, nicht den Nachweis.

Verfassung berührt?: nein · Überschneidung mit offenen Paketen: Modus Inselproben (Andockstellen A1–A3)
Regelbezug: R417, R553, R839, R862 · Kosten bei Irrtum: ein Nachtrag mehr.

Entscheider: L0 · Anlass: Bericht lead-design, Gate lead-qa · ADR: —

## R868 · 2026-10-23 · Prozess-Retro REL-30: V1 und V2 angenommen; Messaufträge bestätigt

Ruling: Retro `studio-process-coach` (`docs/retro-rel-30` @ `40a27899`, `docs/studio/retros/2026-10-23-rel-30-prozess.md`) **abgenommen**. **V1:** `lead-qa` prüft im Trockenlauf Dateien mit
Merge-Treiber per `git merge --no-commit` im Wegwerf-Worktree statt `merge-tree` (Messgrösse 0 Integrator-Stopps über 3 Releases). **V2:** Jeder Agent-Start gilt als asynchron (alle 9
Lead-Starts mit `background: False` liefen `async_launched`); der Lead beendet nach dem Start seinen Zug und wartet auf Meldung (Rückkanal R856), höchstens ein Heartbeat je 5 min;
«im Vordergrund» fällt aus Briefings und Vorlage; R854 Regel C (Waitguard) bleibt. Messgrösse ≤ 3 Status-Events je 10 min Wartezeit. Beide als Experiment, Umsetzung `studio-coach`.
Messaufträge L0-Kontext und Flake-Verdacht bis 2026-10-30 bestätigt. R769 V2 (Rulings zurückhalten bis Integrator-Bericht) bleibt.

Verfassung berührt?: nein · Überschneidung mit offenen Paketen: TOOL-MERGE-APPEND, DAUERAUFTRAG (STUDIO.md 1.72)
Regelbezug: R769, R854, R856 · Kosten bei Irrtum: zwei Experimente, rückbaubar.

Entscheider: L0 · Anlass: Prozess-Retro REL-30 · ADR: —

## R869 · 2026-10-23 · Nutzer: keine neuen Projekte, Laufendes abschliessen → Ende-Routine

Ruling: Nutzer: «starte keine neuen projekte mehr. schliesse noch vorhandene prozesse und themen ab». **Auslegung:** gilt für diese Session (Abschluss = Ende-Routine), nicht als
Dauer-Stopp des Studios — Zweck: geordnet herunterfahren; Auslegung widerspricht ihm nicht, weil ein dauerhafter Stopp das Studio stilllegen würde, was der Wortlaut «noch vorhandene»
nicht trägt (R863: im Zweifel dauerhaft; hier ist der Sessionbezug durch «abschliessen» gegeben). **Entscheid:** keine neuen Pakete und Arbeiter-Starts ausser zum Abschluss laufender
Themen. Laufende Pakete liefern ihr aktuelles Deliverable und enden: ORT-A bis Abnahme k1/k2 (ohne T18), Inselproben-Spec, Stadtrecht-Kurzdesign, Plan I-186 (ohne Gate Plan, ohne
Umsetzung), RETRO-REL-30-UMSETZUNG. Seerecht T04 startet nicht. Danach Ende-Routine (Metriken, Kurz-Retro, state.md, lernen.md).

Verfassung berührt?: nein · Überschneidung mit offenen Paketen: alle laufenden
Regelbezug: R863, STUDIO.md «Session-Start und -Ende» · Kosten bei Irrtum: nächste Session startet neue Arbeit, die der Nutzer nicht wollte — korrigierbar per Wort.

Entscheider: L0 · Anlass: Nutzerauftrag · ADR: —

## R870 · 2026-10-23 · Stadtrecht und Modus Inselproben: Entwürfe fertig, Vorentscheide; Gates nächste Session

Ruling: (1) **Stadtrecht** (`design/stadtrecht` @ `3ff27d0a`, Handoff `.studio/handoffs/2026-10-23-lead-design-STADTRECHT.md`): 6 käufliche Sitzungen ab Ziel 1, 5000 × 1,7^(k−1) Geld plus
Stein/Glas, Wahl A +2 % Steuer / B schnellere Kette, Feld `charter` mit Migration. R-1 (Baseline bitgleich) und R-2 (Werte, später per Werte-Ruling) angenommen; die Abweichung von der
Rechnung des Wirtschaftsdesigners (§4.2) angenommen. (2) **Modus Inselproben** (`design/modus-inselproben` @ `3a1264ee`, Handoff `.studio/handoffs/2026-10-23-lead-design-INSELPROBEN.md`):
5 Inselproben, Tagesinsel, Prüf-Szenario «Schuldbrief» (lösbar in 14,5–21,3 min je Strategie, robust in 9/9 Varianten). F1 (kein Warteschlangen-Eintrag zu N-101, Schuld ist Startlage,
kein Angebot), F2–F6 und F7 (Schuldbrief-Werte, keine Erstattung bei Abriss mit offener Schuld, Bestehen nach aktuellem Stand) angenommen. (3) **Save-Reihenfolge (R-3, R674):** Ehrenbuch
braucht keine Save-Version; Stadtrecht und Inselproben brauchen je eine — wer zuerst nach main merged, nimmt v19, der andere v20; Reihenfolge der Umsetzung: Ehrenbuch → Inselproben (F5)
→ Stadtrecht, sofern das Gate nichts anderes ergibt. (4) **Gates Spec** für beide bei `lead-qa` in der nächsten Session (R869: heute keine neuen Starts).

Verfassung berührt?: nein · Überschneidung mit offenen Paketen: I-186 Plan, Erweiterung 1 (Save, K5)
Regelbezug: R674, R722, R862, R865, R869 · Kosten bei Irrtum: Werte im Entwurf, vor dem Gate änderbar.

Entscheider: L0 · Anlass: Berichte lead-design · ADR: —

## R871 · 2026-10-23 · ORT-A k1/k2 abgenommen; Plan I-186 fertig; Bündel REL-31 vorbereitet

Ruling: (1) **ORT-A** (Handoff `.studio/handoffs/2026-10-23-lead-tech-ORT-A.md`): AK-30 +0,047 ms, AK-32 Seed 14 +0,1 ms / Fixture 0,0 ms, AK-37 Δ −0,4 → **bestanden**; **Referenz AK-37 ist
`de0a372a`** (Differenz zu `ort-a-basis` stammt vom U1-Hofsaum). k1/k2 in `feat/ort-a` @ `d52ad5b9` (mit main `7505fda6`), 4 veraltete Render-Tests angepasst (nur Tests), Teilbeleg Exit 0.
Nächste Session: T18 (T14 erledigt), Worktree `ort-a-vor-k2` entfernen (ohne `--force`), Merge nach main mit REL-31. (2) **Plan I-186** `plan/i186-ehrenbuch` @ `42e016cb` (T00–T09, ≈ 445 Tools,
16 Starts beantragt): ADR-016 für das Buchformat **ja**; AK-EB-06 per Diff-Lauf statt Versions-Pin **ja**; Gate Plan nächste Session. (3) **TOOL-MERGE-APPEND** `tool/merge-append` @ `6abfe75f`
abgenommen (1068 Studio-Tests OK, Rot-Beleg, Echtlauf); Reviewer bei Ein-Modul-Diff entfallen — hingenommen. (4) **RETRO-REL-30-UMSETZUNG** `docs/retro-rel-30-umsetzung` @ `2bcd30ca`
(Handbuch 1.73, E-072/E-073 passiv bis 2026-11-19) abgenommen; E-063 in der nächsten Session bewerten. ADR-007 braucht einen Nachtrag zu R868 (Beobachtung). (5) **Reihenfolge REL-31**
(frühestens 2026-10-24): `docs/ideen-16` → `docs/tiefe-1` → `docs/wirtschaft-tiefe` → `design/*` (i186, modus-inselproben, stadtrecht) → `plan/i186-ehrenbuch` → `docs/retro-rel-30` →
`docs/dauerauftrag` → `docs/retro-rel-30-umsetzung` → `tool/merge-append` → `feat/ort-a` (nach T18/Final-Review laut Plan) — Gate Merge Release vorab nach V1 (R868).

Verfassung berührt?: nein · Überschneidung mit offenen Paketen: alle REL-31-Stränge
Regelbezug: R857, R866, R867, R868, R869 · Kosten bei Irrtum: Reihenfolge im Bündel neu ordnen.

Entscheider: L0 · Anlass: Berichte lead-tech, studio-coach · ADR: —

## R872 · 2026-10-23 · Kurz-Retro Session a5d45446 abgenommen; E1 Messauftrag, E2 Schätzfaktor

Ruling: Kurz-Retro `studio-coach` (`docs/studio/retros/2026-10-23-session-a5d45446-ende.md`, `fd8023c6`) **abgenommen**. **E1:** `metrics.py` trennt den opus-Anteil nach Paketart (Messauftrag,
Schwelle opus-Anteil ohne Design-Pakete ≤ 60 % über 2 Sessions). **E2:** Minuten-Schätzung für Lead-Pakete mit Faktor 0,5 auf «Tools ÷ 6» (fünfte Session > 50 % Überschätzung); Schwelle
±30 % in 2 von 3 Sessions, Rückfall alte Regel. Beide setzt `studio-coach` in der nächsten Session um (`richtwerte.md`, `metrics.py`).

Verfassung berührt?: nein · Überschneidung mit offenen Paketen: keine
Regelbezug: R750 V2, R826 · Kosten bei Irrtum: eine Messung mehr, Schätzungen kurzzeitig zu knapp.

Entscheider: L0 · Anlass: Kurz-Retro Session-Ende · ADR: —

## R873 · 2026-10-25 · Session-Start 47d29586: «mach weiter» = Plan state.md; Welle 1

Ruling: (1) **Auslegung:** «mach weiter» ist der Auftrag, den Plan aus `state.md` («Fortsetzung beim nächsten Start») fortzusetzen; R862/R863/R826 gelten. Limit-Ampel grün (5 h 0 %, Woche 38 %).
(2) **REL-31 steht an** (frühestens 2026-10-24 erreicht): Gate Merge Release mit echtem Probe-Merge (R868 V1) an `lead-qa`, Reihenfolge R871 **ohne** `feat/ort-a` (T18 offen → REL-32). Bis
`make push-check` Exit 0 startet L0 keine Umsetzer und Controller (R464); ORT-A T18, SEERECHT T04, TOOL-MESSFENSTER T00 und die Ehrenbuch-Umsetzung folgen nach dem Push. (3) **Welle 1 testfrei**
(Deckel 10): Gate Plan I-186, Gate Spec Modus Inselproben, Gate Spec Stadtrecht (je `lead-qa`); HAUSHALT-03 (`lead-production`: `.studio/qa` laut Trockenlauf, Rulings-Archiv auf eigenem Branch,
Merge nach REL-31); R872 E1/E2 und E-063-Bewertung (`studio-coach`); Kurzdesign UI-HAEPPCHEN-J (`lead-design`, Stufe leicht); IDEEN-17 mit Schwerpunkt Spieltiefe/Modi (`lead-design`, R862);
ADR-007-Nachtrag R868 und Seerecht-Plan-DoD auf Teilbeleg (`lead-tech`, Doku); BEOB-19 (`lead-production`, 8 Einträge). Neue Branches gehen in REL-32.

Verfassung berührt?: nein · Überschneidung mit offenen Paketen: REL-31-Stränge (nur lesend für Gates); HAUSHALT-03 mit `rulings.md` (eigener Branch, `tool/merge-append`)
Regelbezug: R464, R826, R862, R863, R868 V1, R871 · Kosten bei Irrtum: ein verschobener Start, Gate erneut.

Entscheider: L0 · Anlass: Nutzer «mach weiter» · ADR: —

## R874 · 2026-10-25 · Gates Plan I-186, Spec Inselproben, Spec Stadtrecht: BEDENKEN mit Auflagen; Save-Reihenfolge

Ruling: (1) **Gate Plan I-186** (`.studio/handoffs/2026-10-25-lead-qa-gate-I-186.md`): BEDENKEN angenommen. Auflagen **A1** (T07: vier Browser-Schritte lesen `localStorage['inselreich.ehrenbuch']`
nach Seitenstart, «Los geht's», «Neue Insel», Fortsetzen) und **A2** (Controller-Starts ins Budget; Antrag **19 Starts** genehmigt) vor dem Umsetzungsstart; B3–B6 in den Task-Dateien mitnehmen
(B4: Diff-Beleg als `git diff main...feat/i186-ehrenbuch -- <Dateien>`), B7 entfällt. Nachtrag durch `lead-tech` ohne Zweitprüfung; Umsetzung nach dem REL-31-Push (R464). (2) **Gate Spec Modus
Inselproben** (`…-gate-INSELPROBEN.md`): BEDENKEN angenommen, Auflagen 1–4 (Lösbarkeits-AK je Probe 2–5; AK 14 mit definierter Referenz- und mindestens einer Gegenstrategie, Schuldbrief-Werte F7
gelten erst nach grünem Lauf als Ruling; Tick-Konvention und Reihenfolge `tickChallenge` im Wortlaut; AK 11 gegen `SAVE_VERSION + 1`), niedrige Befunde mitnehmen; Kennungen **AK-IP-nn**; F1–F7 wie
von `lead-design` empfohlen. Nacharbeit `lead-design` ohne Zweitprüfung, Spec-Grösse ≤ 40 KB (Anhang nutzen). (3) **Gate Spec Stadtrecht** (`…-gate-STADTRECHT.md`): BEDENKEN angenommen; B1–B9
nacharbeiten (E-C); Kennungen **AK-ST-nn** (E-B). (4) **Save-Reihenfolge (E-A, ersetzt die Nummern aus R870):** Stadtplanung → Inselproben → Seerecht → Stadtrecht; jede Spec formuliert ihre
Migration **versionsneutral** («main beim Merge + 1»), keine feste Versionsnummer in AK oder Tests. (5) **UI-Reihenfolge (E-D):** Seerecht-UI vor Stadtrecht-UI; `CouncilSide` wird für `charter`
nicht wiederverwendet.

Verfassung berührt?: nein · Überschneidung mit offenen Paketen: SEERECHT, Stadtplanung (Save), `src/ui/councilCard.ts`
Regelbezug: R417, R464, R553, R870, R871 · Kosten bei Irrtum: Spec-/Plan-Nachtrag erneut, Save-Nummern beim Merge anpassen.

Entscheider: L0 · Anlass: Gate-Berichte lead-qa · ADR: —

## R875 · 2026-10-25 · Gate Merge REL-31 BEDENKEN angenommen; Konfliktlösung und lernen.md; DOKU-R868 abgenommen

Ruling: (1) **Gate Merge REL-31** (`.studio/handoffs/2026-10-25-lead-qa-gate-REL-31.md`, Probe `f30b89d3`): BEDENKEN angenommen. `lead-production` führt die serielle Merge-Kette in
`.worktrees/integrate` von main @ HEAD (enthält R873–R875) in der Reihenfolge R871 durch und löst die 5 Konflikte **genau nach den Lösungen des Gate-Handoffs** (ideen.md: Branch-Zeile;
CHANGELOG: beide Einträge, 1.72 über 1.71, ggf. 1.73 oben; STUDIO.md: R856-Rückkanal von main behalten, Vordergrund- durch Start-Regel ersetzen; lernen.md: Branch-Zeile). Abweichender Konflikt →
stoppen und melden (§6). (2) **lernen.md 41 > 40 Zeilen:** ein `studio-coach`-Arbeiter (Start aus dem lead-production-Budget) kürzt im Integrate-Stand um mindestens eine Inhaltszeile (Veraltetes
streichen, nichts Neues), Commit «docs: lernen.md gekürzt (REL-31)». (3) Danach `production-integrator`: `make push-check; echo EXIT=$?`, Push nur bei Exit 0 per `git push origin <geprüfter
Hash>:main` (R816: erster Push am 2026-10-25), CI und Pages prüfen. `feat/ort-a` und `docs/doku-r868` gehen in REL-32. (4) **DOKU-R868** (`docs/doku-r868`) abgenommen: ADR-007-Nachtrag zu R868 V2
erfüllt den Vermerk aus R871; Merge mit REL-32 vor SEERECHT T06.

Verfassung berührt?: nein · Überschneidung mit offenen Paketen: COACH-R872 (lernen.md nicht, nur metrics/richtwerte), HAUSHALT-03 (rulings auf eigenem Branch)
Regelbezug: R464, R769 V2, R810, R816, R868 V1, R871 · Kosten bei Irrtum: Merge-Kette im Integrate neu aufsetzen; Push einen Tag später.

Entscheider: L0 · Anlass: Gate-Bericht lead-qa, Bericht lead-tech · ADR: ADR-007 Nachtrag

## R876 · 2026-10-25 · HAUSHALT-03, BEOB-19, Kurzdesign UI-HAEPPCHEN-J abgenommen

Ruling: (1) **HAUSHALT-03** abgenommen: `.studio/qa` 1439 → 624 MB; Rulings-Archiv R700–R739 auf `docs/haushalt-03` @ `0b839c29` (inkl. Verweiszeile STUDIO.md 13, hingenommen); Merge mit
REL-32 **nach** allen Ruling-Commits dieser Session, `rulings.md`-Konflikt: Branch-Kopf plus alle neuen Rulings von main behalten. Worktrees > 150: nächste Aufräumrunde misst sie
(`aufraeumen.json`, Beobachtung). (2) **BEOB-19** abgenommen (`docs/beob-19` @ `a59bf87b`, Marke 2026-10-25). **P1 DOKU-RUNDE** angenommen ohne den ADR-007-Teil (erledigt mit DOKU-R868) und ohne
Seerecht-Plan (erledigt); Start an `studio-coach` nach COACH-R872 (STUDIO.md-Überschneidung). **P2 TOOL-REST-3** angenommen (ruff-Fix `loadsnap.py`, `LOAD_WAIT` gegen Handbuch abgleichen,
`pushgate`-Selbstschutz nur auf echte Push-Befehle); Start an `lead-tech` **nach** dem REL-31-Push (berührt `pushgate`). (3) **Kurzdesign UI-HAEPPCHEN-J** (`design/ui-haeppchen-j` @ `0d0daf84`)
abgenommen, F1 (keine Hover-Pause), F2 (nur Gebäudeanzahl), F3 (I-138/I-139 im Pool kürzen — mit IDEEN-17 nachführen), F4 (Chronik ohne Minute) **ja**; Gate Spec an `lead-qa`.

Verfassung berührt?: nein · Überschneidung mit offenen Paketen: REL-31 (pushgate), COACH-R872 (STUDIO.md)
Regelbezug: R287, R464, R685, R861 · Kosten bei Irrtum: Merge-Reihenfolge neu ordnen.

Entscheider: L0 · Anlass: Berichte lead-production, lead-design · ADR: —

## R877 · 2026-10-25 · REL-31 live; Hash ee51d4f1 freigegeben

Ruling: Erster Kandidat `468caf38` rot (`make conflicts`: BSD-`sed -i`-Backup `docs/ideen.md-e` mit Konfliktmarkern eingecheckt); Fix `ee51d4f1` von L0 vor dem Lauf geprüft (keine Backup-Dateien im Diff)
und per Nachricht freigegeben (R565 V2). **REL-31 live:** `make push-check` Exit 0 (13:22 min), Push `bc9664d0..ee51d4f1`, CI-Lauf 40184385005 grün, Pages-Lauf 40184943166 grün, `ci.py` Exit 0;
Hauptcheckout per ff-only nachgezogen. Reine Doku und Werkzeug, Save v18. Einzel-Exitcodes `make check`/`check-ci-perf` fehlen im Bericht (R459/E-058) — hingenommen, da in `push-check` enthalten.
Zwei Beobachtungen eingetragen (sed-Backups beim Konfliktlösen; Arbeiter-SendMessage an Lead-Namen kommt nicht an).

Verfassung berührt?: nein · Überschneidung mit offenen Paketen: keine
Regelbezug: R565 V2, R769 V2, R810, R815, R816 · Kosten bei Irrtum: Revert-Push am Folgetag.

Entscheider: L0 · Anlass: Bericht lead-production REL-31 · ADR: —

## R878 · 2026-10-25 · Nachträge, Pläne und Gates der Welle 1 abgenommen

Ruling: (1) **Plan I-186** `plan/i186-ehrenbuch` @ `c366c783` mit A1/A2/B3–B6 abgenommen; Umsetzung 19 Starts. (2) **Spec Stadtrecht** `design/stadtrecht` @ `6d77e150` (AK-ST-01…17; B7: `taxView`/`guide`
zeigen `taxPct + charterTaxPoints`, Prognose `effectiveTaxPct`) und **Plan Stadtrecht** `plan/stadtrecht` @ `c92cfff1` (Gate Plan BEDENKEN, B1–B8 eingearbeitet) abgenommen; ST-E1…E5 ja (ST-E4:
Vorgänger-Migrationen über die Faltkette getestet); 25 Starts / Par 1; T01-Frühstart ab main ja, Rest nach Seerecht-Merge. (3) **Save-Reihenfolge (ändert R874 (4)):** Die Save-Nummer folgt der
Merge-Reihenfolge (versionsneutral, Stadtplanung zuerst); Seerecht darf vor Inselproben mergen. (4) **Spec Inselproben** `design/modus-inselproben` @ `a7e5fff2` (AK-IP-01…31, Anhang 02) abgenommen;
Tickgrenzen Proben 2–5 und Strategie-Parameter erst nach erstem grünem Lauf festschreiben. **Plan Inselproben** `plan/inselproben` @ `8790f322`: E-IP-1 (P-5, Probe ohne grünen T07-Lauf vorerst
aus der Liste), E-IP-2, E-IP-3 (Pins mit Vermerk «Messwert» bis Ruling) ja; Gate Plan läuft. (5) **UI-HAEPPCHEN-J:** Gate Spec BEDENKEN (Auflagen 1–5 im Plan), Plan `plan/ui-haeppchen-j` @
`4483c575` Gate Plan **OK**; R-J-E (4 Starts / Par 1) übernommen; Playtest mit drei verschiedenen Warntexten, AK-J3 Pause per Leertaste belegen. (6) **IDEEN-17** `docs/ideen-17` @ `933964fa`
abgenommen: I-197 Kurzdesign, I-201 Rechnung, Rest parken, I-205 verwerfen; F3 aus UI-J (I-138/I-139 kürzen) beim nächsten Pool-Eingriff. (7) **I-197** `design/i197-i201` @ `8a1191f8`: Gate Spec
BEDENKEN, B1 (echter Charakterisierungstest AK-K3), B2 (Eingabegrenze **0–99 999 949**), B3; Kennungen AK-K1…K13; Plan `plan/i197-kartennummer` @ `928535c7` Gate Plan **OK**, 4 Starts, Umsetzung
nach dem Inselproben-UI-Task. (8) **I-201 Festanlass:** R-A (Aufstieg, Ernte, Markttag; Hafenfest entfällt), R-B (`feastKind` optional, kein Save-Sprung, unbekannte Art abgewiesen, Muster R260),
R-C (Abklingzeit je Insel und Art); Kurzdesign @ `a58f0b48`, Entwürfe 1–3 ja; Gate Spec BEDENKEN: Blattmodul `feastEffect`, Kennungen **AK-FE1…**, R553 zwei Seeds je Welt mit Rückfall,
Rangfolge mit Lage C2 — Nachtrag läuft. (9) **COACH-R872** `tool/coach-r872` @ `42813dbd` abgenommen (Handbuch 1.74, E-074 passiv, E-075 Messauftrag, Ausgang 69,1 %); **E-063 behalten,
abgeschlossen**, Platz an E-073; Briefing-Vorlage Lead-Fall «Tools ÷ 12» und Wortlaut «L0 rechnet» nachziehen (DOKU-RUNDE).

Verfassung berührt?: nein · Überschneidung mit offenen Paketen: Save-Kette Stadtplanung/Inselproben/Seerecht/Stadtrecht; `menu.ts`/`app.ts` (Inselproben, I-197)
Regelbezug: R417, R553, R860, R862, R870, R874 · Kosten bei Irrtum: Plan-Nachtrag, Save-Nummer beim Merge anpassen.

Entscheider: L0 · Anlass: Berichte lead-tech, lead-design, lead-qa, studio-coach · ADR: —

## R879 · 2026-10-25 · Welle 2: Umsetzung nach dem REL-31-Push; Rückkanal-Versäumnis

Ruling: (1) **Controller (≤ 3, R826):** I-186 Ehrenbuch (19 Starts, T00 zuerst), UI-HAEPPCHEN-J (4 Starts), ORT-A T18 mit Final-Review und Merge-Weg (4 Starts Rest). SEERECHT T04 und Stadtrecht T01
folgen auf den ersten freien Controller-Platz. (2) **Testfrei:** DOKU-RUNDE (`studio-coach`: ADR-011 Status, Stand-Warnschwelle STUDIO.md vs. `stampcheck.py`, Briefing-Vorlage nach R878 (9),
`design-idea-scout` erhält WebSearch/WebFetch für die erwünschte Recherche, R862); REL-32-Zwischenbündel lokal (`lead-production`: Doku-/Plan-Branches nach main per Teilbeleg, kein Push vor
2026-10-26). (3) **Rückkanal:** L0 hat in Welle 1 den Leads ihre agentId nicht genannt (R856); nachgeholt, sobald bemerkt. Ab sofort nennt L0 die Adresse unmittelbar nach jedem Lead-Start;
Arbeiter-Briefings benutzen nie den Rollennamen als Adresse. Für die Session-Retro.

Verfassung berührt?: nein · Überschneidung mit offenen Paketen: `app.ts` (UI-J, I-186), Seerecht-Plan (DOKU-R868)
Regelbezug: R464, R826, R856, R862, R868 V2 · Kosten bei Irrtum: ein Controller wartet.

Entscheider: L0 · Anlass: REL-31 live · ADR: —

## R880 · 2026-10-25 · REL-32a lokal; Plan Inselproben und Spec I-201 nachgebessert; TIEFE-2

Ruling: (1) **REL-32a** (`.studio/handoffs/2026-10-25-lead-production-REL-32a.md`) abgenommen: 11 Doku-/Plan-/Werkzeug-Branches lokal nach main, Ergebnis `97f1ef4a`, Teilbeleg (docs-check,
conflicts, studio-test 1072, tsc, lint) je Exit 0; kein Push (nächster frühestens 2026-10-26, R816). (2) **Gate Plan Inselproben** BEDENKEN angenommen, H1–H3 und N1–N5 eingearbeitet
(`plan/inselproben` @ `55309d8a`); **43 Starts / Par 2** genehmigt; Start bei freiem Controller-Platz vor Stadtrecht T01, T09 nach I-186 auf main, T14 nach Stadtplanung. (3) **Spec I-201**
Nachtrag `design/i197-i201` @ `a8c8fdfb` abgenommen (AK-FE1…FE21, Blattmodul `feastEffect`, C2-Band 0–800, Rohstoffmass `GOODS[g].sell`, Markttag bewusst Nische; Rückfall `cyclePct` 67–85,
`sellPct` 115–<130 nur per Ruling); Plan an `lead-tech` (opus). (4) **TIEFE-2** (Web-Recherche neue Achsen für Spätspiel/Wiederspielwert, R862) an `lead-design`.

Verfassung berührt?: nein · Überschneidung mit offenen Paketen: Save-Kette, `menu.ts`/`app.ts`
Regelbezug: R553, R816, R826, R862, R878 · Kosten bei Irrtum: Plan-Nachtrag; lokaler Revert vor dem Push.

Entscheider: L0 · Anlass: Berichte lead-production, lead-tech, lead-design · ADR: —

## R881 · 2026-10-25 · Abnahmen Welle 2 und Gate Merge REL-32 (Teil 1)

Ruling: (1) **Abgenommen:** DOKU-RUNDE `docs/doku-runde` @ `afd223fa` (Handbuch 1.75; Personas `design-idea-scout` 1.5 mit WebSearch/WebFetch, `production-integrator` 1.20, `lead-production` 1.15 —
Teil (f) bestätigt mit Regelbezug R877; E-065 beim nächsten Experiment-Eingriff auf Ist-Stand); TIEFE-2 `docs/tiefe-2` @ `d764745d` (T2-1: Härte-Freischaltung vereinbar mit R864; T2-2: K1 «Seegang»
und K3 «Bittschrift» in die nächste Ideen-Runde, K4 als I-197b, I-198 in K1; T2-3: K2/K5 parken); TOOL-REST-3 `tool/rest-3` @ `99d221aa` (`LOAD_WAIT` 4.0, `pushgate` nur bei schreibenden Befehlen,
kein Handbuch-Minor); **UI-HAEPPCHEN-J** `feat/ui-haeppchen-j` @ `a9265f85` (alle AK, Review und Playtest OK, sim-Diff leer; Auflage «Baustelle zählt nicht» entfällt, `councilPreview` zählt alle
Gebäude); **I-186 Ehrenbuch** `feat/i186-ehrenbuch` @ `0fa49aa0` (alle AK-EB, Final-Review nach Delta OK, kein Save-Wechsel; serielle Reihenfolge ohne A/B-Merges hingenommen; EB-03-Negativfall
Schwelle + `GROWTH_INTERVAL` − 1). (2) **Plan I-201** `plan/i201-festanlass` @ `b3f7958f` nach Gate Plan BEDENKEN abgenommen; R-I201-P: P-2/P-3/P-4/P-9/P-11 ja, 15 Starts, 3 Arbeiter, höchstens 2
gleichzeitige Testläufe. (3) **I-197b Partiebrief** `design/i197b-partiebrief` @ `34ae988d` nach Gate Spec BEDENKEN abgenommen: PB-1 kein Save-Feld, PB-2 ein Feld, PB-3 Start-Objekt
`{ seed?, crisisLevel, unlockMode }` stellt der I-197-Controller beim Umsetzungsstart um; Brief nimmt Karten bis 99 999 999 an, reine Zahleneingabe bleibt 0–99 999 949; Golden `IR1-4711-K2F0-1N`. Plan
I-197b als Folgetask beim I-197-Start. (4) **SEERECHT** T04–T08 gestartet (13 Starts Rest); **INSELPROBEN** Etappe 1 (Sim-Strang T00–T04, 12 von 43 Starts, Par 1). (5) **Gate Merge REL-32 Teil 1**
(`.studio/handoffs/2026-10-25-lead-qa-gate-REL-32.md`, Probe `c4948233`) BEDENKEN angenommen: lokaler Merge durch `lead-production` in der Gate-Reihenfolge, Konflikte genau nach Gate-Vorgabe
(STUDIO.md/CHANGELOG: doku-runde-Fassung, 1.75 oben; `docs/ideen.md` bei `plan/inselproben`: main-Stand). Push frühestens 2026-10-26 nach `make push-check`. Beobachtung: Plan-Branch setzte
`docs/ideen.md` per Merge auf alten Stand zurück (Retro).

Verfassung berührt?: nein · Überschneidung mit offenen Paketen: INSELPROBEN (ideen.md-Rückstand auf feat/inselproben gemeldet), SEERECHT/ORT-A (nicht im Bündel)
Regelbezug: R553, R816, R826, R856, R862, R864, R868 V1, R877, R880 · Kosten bei Irrtum: lokaler Revert vor dem Push.

Entscheider: L0 · Anlass: Berichte lead-tech, lead-design, lead-qa, studio-coach · ADR: ADR-016 (I-186)

## R882 · 2026-10-25 · REL-32b lokal; ORT-A AK-41/AK-07 für Weg-Objekte gelockert

Ruling: (1) **REL-32b** (`.studio/handoffs/2026-10-25-lead-production-REL-32b.md`) abgenommen: 8 Branches (doku-runde, rest-3, tiefe-2, plan-inselproben, plan-i201, design-i197b, UI-HAEPPCHEN-J,
I-186) lokal auf main `7c7ab4d2`, Konflikte nach Gate, Teilbeleg je Exit 0 (186 Vitest-Tests der Paketdateien). Push frühestens 2026-10-26 nach `make push-check` (R816). (2) **ORT-A** (`feat/ort-a` @
`1435bd0a`, Delta-Review ZURÜCK wegen AK-41): AK-41 und AK-07 werden **für die Weg-Objekte** auf Radius **r ≤ 7** gelockert, Bedingung ist die lokale Annahmeregel (Los-Maximum unter kollidierenden
Kandidaten) mit Test über die Probe (Seeds 1–20); Item-Kachel = freie Seitenkachel, Dichte lokal per 5×5-Fenster: ja. Budget +2 Starts; frischer opus-Delta-Review Pflicht; Spec-/Plan-Wortlaut im Branch
nachführen. Beobachtungen: Zyklus `ortsrand.ts` ↔ `roadside.ts`; Renderer-Test «L4 Deko-Culling» 4851 ms nahe 5000-ms-Timeout.

Verfassung berührt?: nein · Überschneidung mit offenen Paketen: Stadtplanung C1, LEBEN-STRASSE (warten auf ORT-A)
Regelbezug: R329, R673, R708, R793, R816, R871 · Kosten bei Irrtum: sichtbares Umspringen von Weg-Objekten bis 7 Kacheln weit; Rückkehr zu r ≤ 3 per Ruling.

Entscheider: L0 · Anlass: Berichte lead-production, lead-tech · ADR: —

## R883 · 2026-10-25 · SEERECHT bereit fürs Merge-Gate; Limit-Ampel gelb

Ruling: (1) **SEERECHT** `feat/seerecht` @ `8473afb0` abgenommen bis Merge-Gate: T04, T06, T07, T08 mit Reviews und Playtest OK; T09 nach R878 (3) vorgezogen: `SAVE_VERSION` 19, `migrateV18ToV19`,
Abweise-Test `SAVE_VERSION + 1`, Kurz-Review OK. Stadtplanung zieht beim späteren Merge auf main + 1 nach. Merge-Gate zusammen mit dem REL-32-Push am 2026-10-26 (ein `make push-check`).
(2) **Limit-Ampel gelb** (5-h-Fenster 60 %): keine neuen Wellen (STUDIO.md «Studio-Deckel»); ORT-A (Fix AK-41) und INSELPROBEN Etappe 1 schliessen den laufenden Task ab und berichten, danach
Ende-Routine.

Verfassung berührt?: nein · Überschneidung mit offenen Paketen: Stadtplanung (Save-Nummer), Stadtrecht (wartet auf Seerecht)
Regelbezug: R69, R826, R878 · Kosten bei Irrtum: Save-Nummern beim Merge tauschen.

Entscheider: L0 · Anlass: Bericht lead-tech SEERECHT, Limit-Ampel · ADR: —

## R884 · 2026-10-25 · ORT-A: Schranke Weg-Objekte r ≤ 10

Ruling: Zweites Delta-Review ORT-A ZURÜCK: r ≤ 7 (R882) hält bei Hausänderungen nicht (analytisch 9–10, Probe 4 Fälle r = 8 in 102 644 Änderungen). AK-41 und AK-07 gelten für die Weg-Objekte mit
**r ≤ 10** (Kontext 4 + Konflikt 6), ersetzt R882 (2) in diesem Punkt; kein Umbau der Ortsnähe-Prüfung. Abschluss mit dichtem Haus-Test (Seeds 1–20), korrigierten Kommentaren und Spec-Wortlaut und
drittem frischem opus-Delta-Review (letzter freier Start). Rein kosmetische Wirkung: Weg-Objekte können bei Bau/Abriss bis 10 Kacheln weit umspringen.

Verfassung berührt?: nein · Überschneidung mit offenen Paketen: Stadtplanung C1, LEBEN-STRASSE
Regelbezug: R673, R708, R826, R882 · Kosten bei Irrtum: sichtbares Umspringen; Umbau der Ortsnähe-Prüfung als eigenes Paket.

Entscheider: L0 · Anlass: Bericht lead-tech ORT-A · ADR: —

## R885 · 2026-10-25 · INSELPROBEN Etappe 1 abgenommen

Ruling: `feat/inselproben` @ `d6f6834f` (T00–T04, Task-Reviews nach Delta OK, Grundspiel bitgleich per Hash-Pins und Spiegel-Test) abgenommen. Entwürfe: (a) Reihenfolge-Pins in
`tests/sim/unlocks.test.ts`/`monument.test.ts` auf `slice(-3)` mit `tickChallenge` (Commit `6ae7c66f`) **bestätigt**; (b) Bestandstest AK-IP-02 mit ungültigem Datum 20260231 **bestätigt**; (c)
Tagesinsel-Karten: 62/730 Tage nutzen `seed + i`, Tage können dieselbe Karte teilen (Ziel und Krise unterscheiden sich) — **gewollt** (deterministisch, für alle gleich), Spec §5.3 beim nächsten Eingriff
vermerken. `SAVE_V_CHALLENGE` ist Platzhalter: Seerecht belegt 19 (R883), Inselproben nimmt beim Merge main + 1 (T14). Schwache Rot-Belege (Ladefehler) hingenommen, Mutationen belegen die Fixes.
Nächste Etappe (Mess-Strang T05–T07, UI-Strang T08–T11; 31 Starts Rest) in der Folgesession.

Verfassung berührt?: nein · Überschneidung mit offenen Paketen: SEERECHT (Save 19), I-197/I-197b (`menu.ts`/`app.ts`)
Regelbezug: R395, R878, R880, R883 · Kosten bei Irrtum: Revert `6ae7c66f`; Spec-Nachtrag.

Entscheider: L0 · Anlass: Bericht lead-tech INSELPROBEN · ADR: —

## R886 · 2026-10-25 · ORT-A T18 abgenommen; Kurz-Retro 47d29586; Session-Ende

Ruling: (1) **ORT-A T18** (`feat/ort-a` @ `7e2e8d12`) abgenommen: drittes frisches opus-Delta-Review OK, Schranke r ≤ 10 analytisch und empirisch belegt (dichter Haus-Test, Rot mit 7);
Wegänderungs-Test 5163 ms mit explizitem Timeout hingenommen (ZEITRESERVE-PFLEGE). Offen T19–T26; `plan/ort-a` auf R884 nachführen. (2) **Kurz-Retro** `docs/retro-47d29586` @ `b7e9fb6e`
(`docs/studio/retros/2026-10-25-session-47d29586-ende.md`) **abgenommen**. **V1** (gezielt stagen, `make conflicts` vor jedem Merge-Commit) ist mit DOKU-RUNDE (f) bereits umgesetzt; `.gitignore`-Muster
für `*-e`-Backups prüft `studio-coach`. **V2** (Rückkanal-Adresse) ist mit DOKU-RUNDE (e) umgesetzt; Messgrösse 0 «not reachable» über 3 Sessions gilt. **V3** (Plan-/Gate-Leads lesen Rulings und
Handoffs abschnittsweise, Schwelle Cache-Write-Wachstum ≤ 15 % in 2 von 3 Sessions) angenommen, Umsetzung `studio-coach` nächste Session. Messaufträge M1 (bis 2026-11-02), M2, M3 ohne Platz.
(3) **Session-Ende** bei gelber Limit-Ampel (5 h 64 %): Metriken `docs/studio/metriken/S-2026-10-25-47d29586.md`, `state.md` nachgeführt.

Verfassung berührt?: nein · Überschneidung mit offenen Paketen: ORT-A T19–T26
Regelbezug: R69, R316, R826, R877, R879, R884 · Kosten bei Irrtum: ein Messauftrag mehr.

Entscheider: L0 · Anlass: Berichte lead-tech ORT-A, studio-coach · ADR: —

## R887 · 2026-10-25 · Zusatz-Release REL-32 auf Nutzerauftrag, keine neue Entwicklung

Ruling: Nutzerauftrag «zusätzliches Release mit den fertigen Schritten, nur das, keine neuen Entwicklungen». Auslegung: (1) **Umfang REL-32** = main lokal (REL-32a/b, `c4d50a8d`) plus die
Branches, die laut state.md nur noch auf das Merge-Gate warten: `feat/seerecht` @ `8473afb0` (Save **v19**, R883), `docs/retro-47d29586` @ `b7e9fb6e`, `docs/haushalt-03` @ `0b839c29`. Nicht dabei:
ORT-A, INSELPROBEN, I-201, Stadtrecht, I-197 (nicht fertig). (2) Findet das Gate Mängel, bleibt der Branch draussen; **keine Nacharbeit, keine neuen Umsetzungs-, Plan- oder Ideen-Starts** in dieser
Session. (3) Der Push-Takt R816 (höchstens ein Push je Kalendertag; REL-31 heute live) wird auf ausdrücklichen Nutzerauftrag **einmalig für heute** aufgehoben; R816 gilt sonst unverändert (Auftrag
ist seiner Natur nach einmalig, R863 greift nicht). Volles `make push-check` Exit 0 auf genau dem Push-Hash bleibt Pflicht (Verfassung §7.2). (4) Ablauf: `lead-qa` Gate Merge (Urteil, kein Fix) →
`lead-production` mit `production-integrator` in `.worktrees/integrate` → `make push-check` → Browser-Ladeprobe → Push, CI, Pages.

Verfassung berührt?: nein (R816 ist Handbuch-Regel) · Überschneidung mit offenen Paketen: Stadtplanung, INSELPROBEN (Save main + 1 = 20 beim späteren Merge)
Regelbezug: R816, R817, R863, R883, R886 · Kosten bei Irrtum: zweiter Pages-Lauf heute; Seerecht-Revert per Hotfix.

Entscheider: L0 · Anlass: Nutzerauftrag · ADR: —

## R888 · 2026-10-25 · Gate Merge REL-32: Seerecht draussen, Hotfix für zwei rote Tests auf main

Ruling: Gate-Bericht `lead-qa` (`.studio/handoffs/2026-10-25-lead-qa-gate-REL-32.md`): (1) `docs/haushalt-03` @ `0b839c29` und `docs/retro-47d29586` @ `b7e9fb6e` **OK**, Merge in dieser Reihenfolge.
(2) `feat/seerecht` @ `8473afb0` **draussen** (R887 (2)): `tests/sim/imports.test.ts` rot (`src/sim/council.ts` importiert `./islands`); Fix im Strang in einer Folgesession, danach neues Gate.
(3) **main selbst rot** (`tests/sim/leverReads.test.ts` wegen `src/ui/council.ts:50`, `tests/ui/contrast.test.ts` wegen `.council-preview`; Herkunft UI-HAEPPCHEN-J, REL-32b). Auslegung von R887 (2):
Die Behebung eines Regressionsfehlers in bereits abgenommenem Release-Code ist **Release-Arbeit, keine neue Entwicklung** (Verfassung §7.2: ohne grünen vollen Lauf kein Push). Paket
**HOTFIX-REL32** an `lead-tech`, Umfang strikt auf die zwei Tests, eigener Branch von main, Task-Review, Teilbeleg. Kein weiterer Umbau. (4) Lehre für die Retro: Gate REL-32b lief nur mit
gezieltem Teilbeleg; die Struktur-Tests (`imports`, `leverReads`, `contrast`) prüfen Querschnittsregeln und gehören in jeden Teilbeleg mit `src/`-Änderungen.

Verfassung berührt?: nein · Überschneidung mit offenen Paketen: SEERECHT (`council.ts` sim), UI-HAEPPCHEN-J-Nacharbeiten (Plural `council.ts:50`)
Regelbezug: R810, R887, Verfassung §7.2 · Kosten bei Irrtum: ein kleiner Fix-Commit mehr; Push verschiebt sich auf morgen.

Entscheider: L0 · Anlass: Bericht lead-qa Gate REL-32 · ADR: —

## R889 · 2026-10-25 · REL-32 live

Ruling: REL-32 abgenommen und live: Push `ee51d4f1..38b9f9a0` (main lokal REL-32a/b, `docs/haushalt-03`, `docs/retro-47d29586`, `fix/hotfix-rel32` @ `d66efb2b`; ohne Seerecht, R888). `make push-check`
Exit 0 auf `38b9f9a0` (Startlast 8,8, Zeitreserve «nicht belastbar», Zeit-Pins nicht belastbar gemessen), CI-Lauf 40192693804 und Pages-Lauf 40193070787 grün; Ladeprobe `qa-playtester` OK (`.studio/qa/REL-32/`,
Kontrast Vorschau und offene Ehrenbuch-Zeile 6,70:1). HOTFIX-REL32 hat im selben Kontrast-Test zusätzlich `.honor-row--open` behoben (gleicher Test, im Umfang). Auf Nutzerauftrag keine weitere Arbeit in dieser
Session; nächster Push nach R816 frühestens 2026-10-26.

Verfassung berührt?: nein · Überschneidung mit offenen Paketen: SEERECHT (neues Gate)
Regelbezug: R816, R887, R888 · Kosten bei Irrtum: Hotfix-Release.

Entscheider: L0 · Anlass: Bericht lead-production REL-32 · ADR: —

## R890 · 2026-10-25 · Session-Start f8716d75: Plan aus state.md fortsetzen, Welle 1

Ruling: Nutzerauftrag «leg los» = Plan aus `state.md` „Fortsetzung“ fortsetzen (R863-Daueraufträge gelten). Limit-Ampel grün (5 h 1 %), Deckel 10 (R826), ≤ 3 Test-Controller. **Welle 1:**
(1) **SEERECHT** an `lead-tech` (Test-Controller 1): Fix `tests/sim/imports.test.ts`-Verstoss im Strang, Struktur-Tests (`imports`, `leverReads`, `contrast`) im Teilbeleg (R888 (4)), Plural «1 Häuser»
`src/ui/council.ts:50` als Trivial-Fix mit, dann Bericht für Gate Merge; Budget 4 Starts, Par 1. (2) **INSELPROBEN Etappe 2** an `lead-tech` (Test-Controller 2): T05–T11, Mess-Strang nur bei Load ≤ 4;
Budget 16 von 31 Rest, Par 2. (3) **ORT-A T19–T26** an `lead-tech` (Test-Controller 3): zuerst `plan/ort-a` auf R884 nachführen, T20b mit `lead-art` per Bericht an L0; Budget 12, Par 1.
(4) **COACH-R886** an `studio-coach`: V3 umsetzen, Messaufträge M1–M3, E-065 auf Ist-Stand, `.gitignore`-Muster `*-e` prüfen (testfrei). (5) **IDEEN-18** an `lead-design` mit TIEFE-2 K1 «Seegang» und K3
«Bittschrift» (R881, R862); Budget 2. (6) **HAUSHALT-04** an `lead-production`: Aufräumen der in state.md als aufräumbar genannten Worktrees/Branches (R888-Liste und „Pausierte Pakete“, nur gemergte, `git worktree
remove` ohne `--force`, `git branch -d` ohne `-D`), Bericht der Liste; Budget 0. I-201, Stadtrecht, I-197 warten auf einen freien Test-Controller-Platz.

Verfassung berührt?: nein · Überschneidung mit offenen Paketen: Seerecht/Inselproben/Stadtrecht teilen Save-Nummern (Seerecht 19, Rest main + 1 beim Merge)
Regelbezug: R826, R862, R863, R879, R884, R885, R888 · Kosten bei Irrtum: ein Paket wartet eine Welle länger.

Entscheider: L0 · Anlass: Nutzerauftrag «leg los» · ADR: —

## R891 · 2026-10-25 · HAUSHALT-04 abgenommen; TIEFE-3 auf freien Platz

Ruling: (1) **HAUSHALT-04** abgenommen (`.studio/handoffs/2026-10-25-lead-production-HAUSHALT-04.md`): 34 gemergte, saubere Worktrees samt Branches entfernt (202 → 168), `int/rel-32*` gelöscht,
`.worktrees/integrate` detached auf main; nichts mit `--force`. Weitere Runde nur mit neuer Liste per Ruling. (2) Freier Platz nach R862 an kreative Arbeit: **TIEFE-3** an `lead-design` — Web-Recherche
zu **neuen Spielmodi und Szenario-Formen** (Abgrenzung: TIEFE-1/-2 deckten Spätspiel und Wiederspielwert; Erweiterung 1 bleibt in der Nutzer-Session, R519), Ergebnis `docs/recherche/`, Budget 2.
Test-Controller-Plätze bleiben voll (SEERECHT, INSELPROBEN, ORT-A).

Verfassung berührt?: nein · Überschneidung mit offenen Paketen: IDEEN-18 (Dubletten meiden)
Regelbezug: R826, R862, R890 · Kosten bei Irrtum: eine Recherche ohne Folge-Spec.

Entscheider: L0 · Anlass: Bericht lead-production HAUSHALT-04 · ADR: —

## R892 · 2026-10-25 · COACH-R886 abgenommen

Ruling: `docs/coach-r886` @ `1c460542` **abgenommen** (Handbuch 1.76: V3 «Plan- und Gate-Leads lesen abschnittsweise» als E-076 passiv; M1–M3 mit Fristen in `experimente.md`; E-065 auf Ist-Stand,
R878 (9) nachgetragen, laufend genau 3; `.gitignore` `*-e`). Vorlagen-Fix «im Vordergrund» → asynchron nach R868 V2 **bestätigt**. `make studio-test` grün (1074). Merge mit dem nächsten Release-Bündel
(Doku-Branch, kein Spieleinfluss).

Verfassung berührt?: nein · Überschneidung mit offenen Paketen: keine
Regelbezug: R429, R868, R886 · Kosten bei Irrtum: Doku-Revert.

Entscheider: L0 · Anlass: Bericht studio-coach COACH-R886 · ADR: —

## R893 · 2026-10-25 · Gate Merge SEERECHT OK; IDEEN-18 entschieden; I-201 und I-210 gestartet

Ruling: (1) **SEERECHT** `feat/seerecht` @ `3167969e` Gate Merge **OK** (`.studio/handoffs/2026-10-25-lead-qa-gate-SEERECHT.md`: Struktur-Tests grün, Save v19 mit Migration und Abweisung,
Balancing-Diff leer, Probe-Merge sauber). Merge im nächsten Release-Bündel; `make push-check` auf dem Push-Hash Pflicht (R816: Push frühestens 2026-10-26). Schwache Tests AK-SR-12/-14 bleiben als Restrisiko.
(2) **IDEEN-18** `design/ideen-18` @ `6f7d0818` abgenommen: I-210 «Bittschrift» → Rechnung `design-economy-designer` (Dominiert «Ja» immer?), dann Spec voll (opus); I-209 «Seegang» (nimmt I-198 auf) →
Lösbarkeitsrechnung je Stufe nach Inselproben-Merge, dann Spec; I-211/I-212 **geparkt** (Paar, nach Krisen-Überarbeitung bzw. I-128); I-213 **verworfen**. Abweichung «auch `docs/ideen-archiv.md`
geändert» **bestätigt** (Persona R599 vor Briefing). Merge mit dem nächsten Release-Bündel. (3) Freie Plätze: **I-201** Controller (`lead-tech`, 15 Starts, ≤ 2 Testläufe, R-I201-P) und
**DESIGN-I210** Rechnung (`lead-design`, Budget 3).

Verfassung berührt?: nein · Überschneidung mit offenen Paketen: I-201 und SEERECHT beide in `src/sim/islands.ts`; I-209 nach INSELPROBEN
Regelbezug: R599, R722, R816, R862, R883 · Kosten bei Irrtum: Seerecht-Revert; eine Rechnung ohne Spec.

Entscheider: L0 · Anlass: Berichte lead-qa gate-seerecht, lead-design IDEEN-18 · ADR: —

## R894 · 2026-10-25 · TIEFE-3 abgenommen; Gründungsbrief-Rechnung

Ruling: `docs/tiefe-3` @ `1ab3968a` (`docs/recherche/2026-10-25-tiefe-3.md`) **abgenommen**; Entwürfe: **E1** gemeinsamer Regelbaukasten (Regel-Schalter als Def in `src/sim/defs/`) — ja, beim ersten
Paket der Gruppe Seegang/Gründungsbrief/Monatsprobe mitbauen, Architektur im jeweiligen Plan; **E2** T3-2 «Gründungsbrief» (1 aus 3 Briefen vor der Partie, Vorteil mit Haken, Seed-gebunden) — ja, Dominanz-Rechnung
sofort (`lead-design` mit `design-economy-designer`, Budget 2), Eintrag in IDEEN-19; **E3** T3-3 + T3-5 als Kurzdesign «Proben-Wertung» nach Inselproben live vormerken; **E4** T3-1, T3-4 geparkt. Belege
schwach (Suchtreffer) hingenommen, da nur Mechanik übernommen wird. Merge mit dem nächsten Release-Bündel.

Verfassung berührt?: nein · Überschneidung mit offenen Paketen: I-209 Seegang (Regelbaukasten), INSELPROBEN (Schnitt 2)
Regelbezug: R862, R893 · Kosten bei Irrtum: eine Rechnung ohne Spec.

Entscheider: L0 · Anlass: Bericht lead-design TIEFE-3 · ADR: —

## R895 · 2026-10-25 · INSELPROBEN T05: Diagnose vor Wertwechsel

Ruling: Messlauf AK-IP-14 (T05) rot: kEnd 4950 statt ≈ 18400 (−73 %), Ref und M70 scheitern mit Kasse < 0 (Schuld nie getilgt), Rang Ref < G1 < G2 verletzt. **Kein Wechsel von S0 oder Spielwerten auf
Vermutung** (R236 (b)). Auftrag an den INSELPROBEN-Controller: **Diagnose-Task** (`tech-sim-engineer`, sonnet, aus dem laufenden Budget): (a) K_end Vollpreis gegen Geld-only nachrechnen und mit Anhang-01-Modell
(K_win 13500) vergleichen, (b) Tilgungs-Controller der Messung (Reserve 150) gegen das Spec-Verhalten prüfen, (c) Befund mit Beleg vs. Vermutung getrennt. Danach Entwurf an L0: Messdefinition korrigieren
(Messwerkzeug-Fehler) oder S0/Spielwert-Ruling (Spec-Fehler) — Letzteres mit `lead-design`-Sicht. Messläufe nur bei Load ≤ 4. UI-Strang läuft weiter. Befund «`startProbe` setzt weder `run` noch
`honorBook.setRun`» → `docs/beobachtungen.md` im Strang, Bezug I-197/I-197b.

Verfassung berührt?: nein · Überschneidung mit offenen Paketen: I-197/I-197b (Startkarte), Gründungsbrief (Start-Objekt)
Regelbezug: R236, R329, R885 · Kosten bei Irrtum: ein Diagnose-Start mehr.

Entscheider: L0 · Anlass: Zwischenbericht lead-tech INSELPROBEN · ADR: —

## R896 · 2026-10-25 · Nutzer-Playtest: Input in fünf Pakete; Dauerauftrag Nachvollziehbarkeit

Ruling: Nutzer meldet Playtest-Befunde «nur als Inputs, Entscheidungen bei L0, mit Fokus auf Nachvollziehbarkeit und Logik». Auslegung: (0) **Dauerauftrag (R863):** Spielregeln und Ausbau-Bedingungen
müssen **fachlich erklärbar** sein (Ursache → Wirkung im Spielbild nachvollziehbar); Gate-Specs prüfen das als Kriterium. R862 «keine Playtests als Ideen-Input» meint Studio-Playtests; **Nutzer-Playtests sind
Input erster Ordnung** und gehen vor dem Pool. Pakete:
(1) **BUG-SCHIFF** (`lead-tech`, Diagnose nach systematic-debugging, ohne Fix): Handelsschiff ruckelt; Route fährt nicht Kontor ↔ Kontor, sondern «irgendwo an die Insel»; Auftragsschiff erscheint
plötzlich statt anzulegen. Ergebnis Ursachen mit Beleg und Fix-Vorschlag; Fix-Start nach freiem Test-Controller-Platz. (2) **HAFEN** (`lead-art` mit `lead-design`, Kurzdesign nach BUG-SCHIFF): Anlegestelle am
Kontor, Schiffe legen dort an, Schiffsoptik aufwerten. (3) **AUSBAU-LOGIK** (`lead-design`, Spec voll): Ausbau-Bedingungen nach Logik (Baustoffe Stoff/Ziegel/Holz, Fachkräfte/Gelehrte/Wissensstand,
Standortregeln wie «Fischer: höchstens 1 anderer im Radius 2») statt sachfremder Waren (z. B. Rum für die Weberei); zusätzliche Produktionsstufe; Stufenmerkmale **funktional sichtbar** (grösseres Netz/Boot beim
Fischer, grösserer Kessel/Schornstein bei der Brennerei) statt Fahne; QoL «gleiches Gebäude dieser Stufe bauen» (Pipette) als Teil-AK. (4) **GEBAEUDE-VARIANZ** (`lead-art`, Kurzdesign): echte Formvarianten
je Gebäudetyp (prozedural aus Bausteinen, nicht nur Dachfarbe), Drehung 90°, deterministisch aus Position. (5) **FLAECHE** (`lead-design` mit `lead-art`, Kurzdesign): Grössenverhältnisse — Wohnhaus wächst
mit Aufstieg über 1×1 hinaus; Flächenbedarf sichtbar und genau so gross wie für 100 % Effizienz nötig (Schäferei: umzäunte Weide, Schafe darauf). Überschneidung Stadtplanung/ORT-A prüfen.
Reihenfolge: (1) und (3) sofort (testfrei), (4) und (5) beim nächsten freien Platz, (2) nach (1). Save-Wirkungen entscheidet L0 je Spec.

Verfassung berührt?: nein · Überschneidung mit offenen Paketen: SEERECHT (Seewege), LEBEN-SEE, ORT-A, Stadtplanung, I-201 (Ausbau), Gründungsbrief
Regelbezug: R862, R863, R445 · Kosten bei Irrtum: Design-Arbeit, die vor der Umsetzung umgeplant wird.

Entscheider: L0 · Anlass: Nutzer-Playtest 2026-10-25 · ADR: —

## R897 · 2026-10-25 · INSELPROBEN T05: Messdefinition statt Kurvenanpassung

Ruling: Diagnose zu R895 (Beleg): kein Werkzeugfehler in Tilgung/Zins; Ursache ist, dass die Sim in Paketen baut und Einkommen erst mit fertigem Paket fliesst, das Anhang-01-Modell aber stetiges Einkommen
annimmt; K_end-Widerspruch steckt in der Spec (Anhang 02 C). Entscheid: (1) **kein S0-Wechsel** (Entwurf 1 ja). (2) **K_end** = «Geldanteil der Gebäude beim Sieg» in Anhang 02 C festschreiben, Spec
bereinigen (Entwurf 4 ja; §5.3-Vermerk aus R885 im selben Spec-Commit). (3) Statt Ref-`kSwitch` auf 0,80 zu schieben (Kurvenanpassung): **Mess-Controller schaltet erst nach Fertigstellung des
angefangenen Pakets auf Tilgen um** — das ist die nachvollziehbare Spielerstrategie (R896 (0)). Mit dieser Definition Ref/G1/G2/G3/M53/M70 neu messen. Halten Rang und flache Mitte, ist T05 fertig;
sonst Rückfall auf Entwurf 2+3 (Punkte 0,80/0,90), **keine Lockerung** des Tests. (4) Zu Entwurf 5: Eine Falle «halbes Paket, Unterhalt + Zins > Ertrag, Kasse negativ, Bauen gesperrt» ist nur
zulässig, wenn der Spieler sie im Spiel sieht. Auftrag: Eintrag in `docs/beobachtungen.md` (Fundort Inselproben/Bilanz-Anzeige) zur Prüfung, ob Krisen-/Bilanzwarnung dies schon zeigt; Design-Folge
nur bei Lücke.

Verfassung berührt?: nein · Überschneidung mit offenen Paketen: AUSBAU-LOGIK (Bilanz je Stufe)
Regelbezug: R236, R395, R885, R895, R896 · Kosten bei Irrtum: eine Messrunde mehr.

Entscheider: L0 · Anlass: Entwurf lead-tech INSELPROBEN · ADR: —
