# Retro adhoc Prozess-Retro M7-UX (Aussensicht) — 2026-10-02

- Datum: 2026-10-02
- Art: adhoc (Prozess-Aussensicht nach Release, R127, Auftrag R135)
- Rolle: `studio-process-coach`
- Zeitraum: Session 2042a460 (06:49–09:25 UTC): PAGES-LIMIT (R130/R131) und M7-UX bis Merge (R132–R135)
- Auslöser: Release M7-UX (main @ 03b34e1); bekannte Befunde 1–6 aus dem Auftrag L0
- Datenbasis: `docs/studio/rulings.md` R124/R125/R130–R135, Ledger
  `.worktrees/m7-ux/.superpowers/sdd/2026-10-01-m7-ux/progress.md`, `.studio/events.jsonl` (1 880 Events am 2026-10-02),
  `python3 tools/studio/metrics.py --milestone M7-UX`, `.studio/archiv/berichte/20261002-091144-qa-code-reviewer-a0de9b372926e0464.md`
  (Final-Review), `…-091327-lead-qa-ac9d0b472bf9fc0f0.md` (Urteil), `.studio/qa/M7-UX-*`, Specs M5/M6/M7/M7-UX, `docs/studio/lernen.md`
- Umfang: ein Start, 18 Werkzeugaufrufe, keine Lead-Befragung (Ledger und Archiv reichen)

## Beobachtung

### B0 · Eckzahlen

- M7-UX: 33 Agenten, 164 min, 1 017 Tool-Aufrufe, Cache-Read 97,5 Mio., Output ≥ 0,70 Mio. Tokens (Metrik M7-UX).
- Budget lead-tech 34, verbraucht 26 (Ledger „Starts verbraucht: 26"); Schätzung 196 min / 1 100 Aufrufe, Ist 122,5 min /
  709 (−37,5 %).
- Qualität: Erstabnahme 59 %, Nacharbeit 6 von 23 Ergebnissen (26 %), Review-Runden Mittel 1,45, Maximum 3.
- Tasks ohne Fix-Runde: 1, 5, 9. Die Bauleiste (Task 3, `buildMenu.ts`) wurde viermal nachgearbeitet: QA-UX1 Fix 1, QA-UX2
  Fix 2 (`tabOrder`), R132 (AK-UX-16), R133 (H1) (Ledger).
- Token-Schwerpunkt: Der M7-UX-Controller `a87691dd00658829f` (opus) liest 50,2 Mio. Cache-Tokens in 219 Nachrichten, das sind
  51 % des Meilensteins und im Mittel rund 229 000 je Nachricht. Alle 28 Sonnet-Agenten zusammen lesen 29,6 Mio.
  (`events.jsonl`, `usage` je agent_id).
- Gate-Strecke: Paket M7-UX `review` 09:01:56, Final-Review-Bericht 09:11:44, Urteil lead-qa 09:13:27, Nachprüfung
  Playtester ab 09:17:28, Integrator ab 09:22:28, `done` 09:24:36. Die H1-Schleife kostete rund 11 min und 1 Start
  (`a87424235a80c7d96`).

### B1 · Push vor Nachprüfung (Task 7)

- Ledger: „Branch feat/m7-ux-guide gepusht VOR der Nachprüfung (Abweichung R107 …) — Controller-Fehler". Danach:
  „Nachprüfung OK". R107 (2) verlangt den Push „nach jedem abgenommenen Commit".
- Von 15 Push-Vermerken im Ledger ist dies der einzige vor der Abnahme. Er betraf den zweiten Worktree
  (`.worktrees/m7-ux-guide`, parallel Task 6 ∥ 7). Ein Schaden ist nicht eingetreten: Feature-Branch, Inhalt danach
  abgenommen.

### B2 · H1 Tab-Kreislauf: Entstehung und spätes Auffinden

- Kette laut Ledger: QA-UX2 Befund 2 (Fokus fällt nach Kategorie-Toggle auf `body`) → Fix-Runde 2 an den Task-3-Implementierer
  → „Fokus-Erhalt + tabOrder" (f27492d) → „Code-Nachprüfung OK" → Controller-Ruling „Eigene Tab-Reihenfolge … bleibt —
  AK-UX-20 … geht mit DOM-Reihenfolge allein nicht; Spec L2 … weicht leicht ab, AK hat Vorrang — falls falsch: Handler
  entfernen, ~20 Zeilen" → Minor (deferred) „kein DOM-Test für tabOrder-Handler".
- QA-UX2-Nachtest (`fix1-05-tab-folge`) und QA-UX5 (`ux2a-*`, `ux5-d-*`) prüften den Vorwärtsweg aus AK-UX-20 (Tab erreicht
  Produktion, Enter, Tab erreicht Fischerhütte). Den Weg über den letzten Eintrag hinaus prüfte erst der Final-Review
  (`buildMenu.ts:281–291`, Kernzeile 289).
- Spec-Wortlaut: AK-UX-20 „weiteres Tab erreicht Fischerhütte" und L2 Z. 137 „Tab nach dem letzten Kategorie-Knopf ihre
  Einträge" widersprechen sich. R134 legt AK-UX-20 aus, der Spec-Wortlaut bleibt stehen.
- Die Behebung (R133) war genau der Rückfall, den das Controller-Ruling selbst genannt hatte.

### B3 · AK-UX-16 gegen AK-U2-02

- Die Kennung `AK-U2-02` gibt es dreimal mit drei Bedeutungen: M5 (Tastenwahl, `m5-spielerlebnis-design.md:886`), M6
  (Kartentext, `m6-krisen-design.md:1139`), M7 (Kontrast ≥ 4,5 : 1, `m7-stimmung-design.md:1103`).
- Die M7-UX-Spec führt in ihrer Tabelle der alten AK (`m7-ux-design.md:369`) „M6 13.3, **AK-U2-02**" (Kartentext). Das
  M7-Kontrast-AK steht dort nicht, also schützte AK-UX-30 es nur über die Testsuite.
- Gefunden hat den Widerspruch der Task-3-Implementierer über den bestehenden Test „Keine Opacity auf Text"
  (`tests/ui/contrast.test.ts`), nicht das Spec-Gate (R124 (4)) und nicht das Plan-Gate (R125).
- Folgekosten: ein Controller-Ruling, R132 mit einem Start lead-design, ein Fix, ein Review und ein QA-Bild per SendMessage.

### B4 · Drei Merge-Gate-Runden, Doku-Rest N4

- R133 BEDENKEN (H1, N3 README, N4 arc42 `hotkeys.ts`) → Fix ab07900/6b408ec. Laut Ledger: „Review OK (… README/arc42
  stimmen)". Danach folgte trotzdem R134 mit der arc42-Zeile für `buildMenu` („Tab über DOM-Reihenfolge", 8246625). R135
  nennt sie als „Auflage arc42 erfüllt und von L0 gesichtet".
- Der Rest war die arc42-Beschreibung genau des Handlers, den der H1-Fix entfernt hatte. N4 hatte eine andere Zeile genannt
  (`arc42.md:199`, `hotkeys.ts`). D1 (arc42) gehört dem Controller, der Code-Fix dem Implementierer (Ledger „D1-Ownership").

### B5 · Parallelbetrieb PAGES-LIMIT ∥ M7-UX

- Zwei lead-tech-Instanzen starteten im Abstand von 7 s (06:52:01 und 06:52:08). PAGES-LIMIT lief von `active` 06:51:43 bis
  `done` 07:03:42 (12 min, Budget 3), M7-UX lief weiter, ohne zu warten.
- Konfliktpunkt `docs/arc42.md`: Der Ledger sah ihn im Preflight voraus („mögliche Kollision mit PAGES-LIMIT … im
  Schlussbericht genannt"), die Probe-Merge war konfliktfrei (R135). Task 6 ∥ 7 lief im zweiten Worktree, Merge
  `--no-ff` grün, 808 Tests (Ledger).
- Eine zweite L0-Session (`2a96d607`, 07:24–07:25) beantwortete nur eine Nutzerfrage, ohne Spawn und ohne Commit
  (`events.jsonl`). Doppelarbeit wie in Prozess-Retro 1 B2 trat nicht auf.

### B6 · Hinweis „Agent unbekannt ist inaktiv"

- Ein Agent `a36f22dab59268885` hat genau einen Heartbeat (06:52:42, Bash) und keine Rolle. 4 s vorher hatte der
  PAGES-LIMIT-Lead einen synchronen eingebauten Agenten gestartet (`a7d9b72887c62e91b`, 18,9 s, 3 Tools, ohne
  `agent_start`).
- Zusätzlich gibt es 264 `agent_stop`-Events ohne vorheriges `agent_start` und ohne Rolle, jedes mit einer
  Einzeilen-Zusammenfassung („Reading arc42.md deployment section", „Logging verdict via log.py"). Jedes schreibt einen
  Archivbericht `.studio/archiv/berichte/20261002-*-agent-<id>.md`. Das sind 264 von 391 Archivberichten des Tages (68 %).
- Die Metrik zählt sie nicht (33 Agenten), `model.py:671` legt für unbekannte agent_id keinen Knoten an.

## Deutung

- **B1 · Einzelfall, kein Muster.** 5-Why: Push vor Abnahme → Push gehört im Ablauf des Controllers zum Commit → R107 bindet
  den Push an die Abnahme, ein Werkzeug prüft das nicht → im zweiten Worktree lief die Abfolge doppelt → Wurzel: R107
  verknüpft zwei Ziele (kein Verlust und nur geprüfter Stand), aber nur das erste braucht den frühen Push. Das zweite
  sichert schon das Merge-Gate, weil es eine SHA abnimmt (R131, R135). Der Verstoss hatte keine Wirkung. Keine Massnahme;
  falls er wiederkommt, R107 auf „nach jedem Commit" vereinfachen statt eine Kontrolle einzuführen.
- **B2 · Muster: Nachprüfungen prüfen den Befund, nicht die Nebenwirkung.** 5-Why: H1 erst im Final-Review → die
  Task-Nachprüfung (SendMessage) beantwortet „ist Befund 2 behoben?" und QA prüft den AK-Pfad vorwärts → niemand hat den
  negativen Pfad (über das Ende hinaus, Shift+Tab) als Prüfschritt → der neue Code entstand in einer Fix-Runde, für die es
  weder einen Plan-Prüfschritt noch einen Test gab (Minor „kein DOM-Test" wurde zurückgestellt) → der Controller löste einen
  Spec-Widerspruch (AK-UX-20 gegen L2) selbst, und zwar mit **mehr** Code statt mit dem Plattform-Standard, und war damit
  Urheber und Prüfer zugleich → **Wurzel: ein Spec-interner Widerspruch kam bis in die Umsetzung, und dort fehlt eine
  Vorgabe, wie er ohne Eskalation entschieden wird.** Der Final-Review mit Opus und vollem Diff fand es, weil er den Code
  liest statt den Befund abzuhaken. Die Task-Ebene ist auf Tempo (Sonnet, Delta) ausgelegt, das ist an sich richtig.
- **B3 · Muster, gleiche Wurzel wie B2: Die AK-Konsistenz prüft im Gate niemand mechanisch.** 5-Why: Widerspruch erst in
  Task 3 → die Gates lasen die Tabelle der alten AK und fanden sie vollständig → die Tabelle verwies über die Kennung auf das
  M6-AK → `AK-U2-02` ist über drei Specs mehrdeutig → **Wurzel: AK-Kennungen sind nur innerhalb einer Spec eindeutig, und
  Querverweise tragen keinen Meilenstein.** Positiv: Das Netz aus AK-UX-30 und der Testsuite hat gegriffen. Der Fehler kam
  nicht auf main.
- **B4 · Einzelfall mit erkennbarem Mechanismus.** Der Fix-Auftrag listete die Befunde (H1, N3, N4) auf, nicht alle Stellen,
  die das entfernte Symbol `tabOrder` nennen. Die Doku-Ownership (Controller) und die Code-Ownership (Implementierer) sind
  getrennt, und die Nachprüfung prüfte die Liste. Das ist dieselbe Lücke wie in B2: Die Prüfung beschränkt sich auf den
  Befund und schaut nicht auf die Nebenwirkung. Die dritte Gate-Runde kostete wenig (eine Zeile, L0-Sichtung), ist aber
  vermeidbar.
- **B5 · Was funktioniert hat:** (1) Getrennte Pfade schon im Ruling (R130 „getrennte Pfade"). (2) Exklusive Worktrees je
  Strang (E-006). (3) Ein Preflight-Scan, der die einzige gemeinsame Datei vorab benennt und die Auflösung auf das Merge-Gate
  legt, statt zu koordinieren. (4) Kleines Paket mit eigener Lead-Instanz statt Einschub in den laufenden Controller.
  (5) Nur eine aktive L0-Session (Prozess-Retro 1 V1 wirkt). Der Parallelbetrieb kostete null Wartezeit für M7-UX und kein
  Merge-Konflikt.
- **B6 · Messartefakt, aber lernen.md erklärt es nur zum Teil.** Der eine Heartbeat ohne Rolle passt zur zweiten Aussage in
  `lernen.md:10` (eingebauter Agent, Vordergrund-`spawned` liegt vor) und ist bekannt. Die 264 verwaisten `agent_stop` sind
  eine andere Quelle: interne Hilfsagenten der Laufzeit (Einzeilen-Zusammenfassungen), die nur SubagentStop senden. Die
  dritte Aussage in `lernen.md:10` (Hintergrund-Start verliert Hook-Events) wird von den Daten nicht gestützt: Jeder der 30
  `spawned` mit `async_launched` hat ein `agent_start`. Schaden: Zwei Drittel des Archivs sind Rauschen, und jede Retro, die
  `berichte/` liest, bezahlt dafür.
- **Token-Schwerpunkt (B0):** Die Hälfte der Cache-Tokens entfällt auf einen einzigen langen Controller-Kontext. Die
  Cache-Last wächst mit Kontextlänge mal Nachrichtenzahl. Der Ledger ist bereits eine vollständige Übergabe (alle Rulings,
  Bases, Minors), ein Controller-Wechsel wäre also technisch billig. Ob er Information verliert, ist ungeprüft.

## Vorschläge

Nach Hebel sortiert. Kein Vorschlag ist umgesetzt, L0 entscheidet.

### V1 · Spec-Gate: AK-Konsistenz mechanisch prüfen (B2, B3)

- Inhalt: (a) Ein Einzeiler im Spec-Gate listet doppelte AK-Kennungen über alle Specs:
  `grep -ho 'AK-[A-Z0-9]*-[0-9]*' docs/superpowers/specs/*.md | sort | uniq -c`, gefiltert auf Kennungen aus mehreren
  Dateien. Querverweise auf alte AK tragen ab sofort den Meilenstein (`M7:AK-U2-02`); alte Specs werden nicht umnummeriert.
  (b) Eine Prüffrage für den Gate-Prüfer: „Widerspricht ein AK-Wortlaut der Prosa (L-Abschnitt) derselben Spec?"
- Erwartete Einsparung: In M7-UX wären B3 (1 Start lead-design, 1 Controller-Ruling, R132, 3 SendMessage-Runden) und der
  Auslöser von B2 (Controller-Ruling, R133-Runde, R134, 1 Nachprüf-Start, rund 11 min Gate-Schleife) vorab sichtbar
  gewesen. Grob 2 Starts, 2 Rulings und eine Gate-Runde je Meilenstein mit UI-AK.
- Messgrösse mit Schwelle: Widersprüche zwischen AK und Spec, die erst nach dem Spec-Gate gefunden werden (Ledger-Rulings mit
  „Widerspruch"/„weicht ab" plus Final-Review-Befunde). Ziel ≤ 1 je Meilenstein über die nächsten 2 Meilensteine; M7-UX
  hatte 2.
- Rückfallzustand: Gate wie bisher ohne Grep und Prüffrage.
- Aufwand: studio-coach rund 15 min (Zeile in `docs/studio/gates.md`, Abschnitt Spec-Gate, und Hinweis in der Spec-Vorlage
  bzw. `STUDIO.md` „Gates und Dokumentation"). Je Gate 1 Tool-Aufruf.

### V2 · Vorrangregel für Spec-Widersprüche in der Umsetzung: die Variante mit weniger Code (B2)

- Inhalt: Findet der Controller einen Widerspruch zwischen AK und Spec-Prosa, gilt ohne Eskalation die Variante, die mit
  Plattform-Standard und weniger Code auskommt. Eigenes Verhalten (zusätzlicher Handler, eigene Reihenfolge) nur per
  Rückfrage an lead-design im Bericht. Das ist keine neue Stufe, sondern eine Voreinstellung für Rulings, die heute schon
  fallen.
- Erwartete Einsparung: H1 wäre nicht entstanden (Ruling „eigene Tab-Reihenfolge" fiel weg, R133 bestätigt
  DOM-Reihenfolge). Dazu eine Gate-Runde, ein Nachprüf-Start und R134.
- Messgrösse mit Schwelle: zurückgenommene Controller-Rulings je Meilenstein (Ledger „Ruling zurückgenommen"). Ziel 0,
  M7-UX hatte 1.
- Rückfallzustand: freie Abwägung des Controllers wie bisher.
- Aufwand: ein Satz in `docs/studio/STUDIO.md`, Abschnitt „Umsetzungszyklus" (Rulings im Ledger), umgesetzt vom
  studio-coach in rund 5 min.

### V3 · Nachprüfung einer Fix-Runde: zwei feste Fragen (B2, B4)

- Inhalt: Jede Nachprüfung einer Fix-Runde (Review oder QA, per SendMessage) beantwortet zusätzlich: (1) „Welches neue
  Verhalten hat der Fix eingeführt, und ist der Gegenweg geprüft (rückwärts, über das Ende hinaus, Abbruch)?" (2) „Alle
  Fundstellen geänderter oder entfernter Symbole in `README.md`/`docs/` per `grep -rn <symbol>` nachgeführt?" Die Fragen
  stehen im Fix-Briefing des Controllers, nicht in einer neuen Rolle.
- Erwartete Einsparung: H1 auf Task-Ebene statt im Final-Review, also rund 11 min Gate-Schleife und 1 Start weniger. Der
  Doku-Rest N4/R134 und eine Gate-Runde fallen weg. Kosten: etwa 2 Tool-Aufrufe je Nachprüfung, bei 11 Fix-Runden in M7-UX
  also rund 22 Aufrufe (2 % der 1 017).
- Messgrösse mit Schwelle: Final-Review-Befunde der Stufe „hoch", die in einer Fix-Runde entstanden sind, plus Merge-Gate-Runden.
  Ziel 0 Befunde und ≤ 2 Runden je Meilenstein; M7-UX hatte 1 Befund und 3 Runden.
- Rückfallzustand: Nachprüfung nur gegen den Befund.
- Aufwand: zwei Zeilen in `docs/studio/STUDIO.md` „Umsetzungszyklus" (Fix-Runden) und im SDD-Fix-Briefing, studio-coach
  rund 10 min.

### V4 · Experiment: Controller-Wechsel nach der Hälfte der Tasks (B0)

- Inhalt: Bei Plänen mit mehr als 6 Tasks übergibt der Controller nach dem mittleren QA-Block (in M7-UX nach QA-UX3) an
  eine frische lead-tech-Instanz. Übergabe ist allein der Ledger, dazu ein Satz Status. Als Experiment nach
  `docs/studio/templates/experiment.md` für einen Meilenstein.
- Erwartete Einsparung: Der Controller-Kontext ist heute im Mittel rund 229 000 Tokens je Nachricht (50,2 Mio. auf 219
  Nachrichten). Bei zwei Hälften mit kürzerem Kontext ist eine Senkung der Controller-Cache-Last um 25–40 % plausibel, also
  12–20 Mio. Tokens je Meilenstein. Kosten: 1 zusätzlicher Opus-Start plus Einlesen des Ledgers.
- Messgrösse mit Schwelle: Cache-Read des Controllers je abgeschlossenem Task (`usage` je agent_id, M7-UX rund 5,0 Mio. je
  Task). Behalten bei ≤ 3,5 Mio. je Task, und die Rulings der zweiten Hälfte widersprechen keinem der ersten (Final-Review).
- Rückfallzustand: ein Controller je Meilenstein wie bisher.
- Aufwand: studio-coach legt das Experiment an (rund 10 min). Messung mit vorhandenem `metrics.py` und `usage`-Events, die
  Messbarkeit bleibt also erhalten.

### V5 · Verwaiste `agent_stop` nicht archivieren, lernen.md richtigstellen (B6)

- Inhalt: Der Hook schreibt für `agent_stop` ohne vorheriges `agent_start` und ohne Rolle keinen Archivbericht, sondern
  erhöht nur einen Zähler „interne Hilfsagenten" im Event. `lernen.md:10` bekommt die Ursache „interne Hilfsagenten senden
  nur SubagentStop", und die Aussage zu Hintergrund-Starts wird gestrichen oder als widerlegt markiert.
- Erwartete Einsparung: 264 von 391 Archivberichten je Session (68 %) entfallen. Retros und Lead-Auswertungen, die
  `berichte/` lesen, sparen Lese- und Filteraufwand. Eine Fehldeutung „Agent unbekannt" fällt weg.
- Messgrösse mit Schwelle: Anteil `*-agent-<id>.md` im Archiv je Session, Ziel < 5 %. Die Metrik-Agentenzahl bleibt
  unverändert (Gegenprobe: M7-UX 33).
- Rückfallzustand: Archiv wie bisher.
- Aufwand: kleine Änderung in `tools/studio/` (Hook-Pfad für `agent_stop`) mit Test, rund 30 min (studio-coach bzw.
  Tools-Verantwortlicher); 1 Zeile in `lernen.md`.

## Bewertung laufender Experimente

- E-006 „Exklusive Arbeitsbäume": In dieser Session gab es drei Worktrees (m7-ux, m7-ux-guide, pages-limit) ohne Konflikt
  und ohne Wartezeit (B5). Das spricht für Behalten; die formale Bewertung gegen die Schwelle macht der studio-coach in
  `experimente.md`.

## Änderungen an lernen.md

- keine (Vorschlag V5 betrifft `lernen.md:10`, Umsetzung erst nach L0-Entscheid)
