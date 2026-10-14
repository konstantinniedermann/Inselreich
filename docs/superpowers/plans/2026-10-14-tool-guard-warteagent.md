# Plan TOOL-GUARD-WARTEAGENT: Hook gegen Warte-Agenten und `sleep` im Hintergrund

Owner `lead-tech` · Stufe leicht · Werkzeug-Paket (kein Save, kein Spielwert, keine Dependency, kein ADR) · Auftrag R647 (2), R646 (6) · Branch `tool/guard-warteagent`.
Umsetzung (Phase B) erst nach L0-Freigabe; Phase A ist nur dieser Plan.

## Architektur

- Neues Modul `tools/studio/waitguard.py` (PreToolUse), pur + `main()` nach dem Muster `modelguard.py`. Eigenes Modul, weil `guard.py` verfassungsgeschützt ist (§1.3) und `modelguard.py` schon Budget trägt; die Regel ist Handbuch-Ebene.
- Konstante `MODE = "deny"` (Rückfall `"warn"`: `additionalContext` + `systemMessage`, kein Block). Fehler lassen zu (Hooks werfen nie). Event `kind: "wait_guard"` mit `mode`, `rule`, `persona`, `blocked` nach `events.jsonl` (Messbasis für die Retro-Zählung).
- Aufrufer ist Lead, wenn `payload["agent_type"]` mit `lead-` beginnt (Feld wie in `hook.py` Z. 123). Fehlt das Feld oder ist es kein Lead (L0 = Hauptsession, Arbeiter): zulassen. Das ist die wichtigste Fehlblock-Bremse.
- Verdrahtung: ein neuer Eintrag in `.claude/settings.json` unter `PreToolUse`, Matcher `Bash|Agent|Task`, Befehl `waitguard.py` mit `2>/dev/null || true` wie die Nachbarn. Dokumentation: Zeile in `docs/arc42.md` (Hook-Liste) und `docs/studio/STUDIO.md` (Guard-Tabelle) in einem Doku-Task.

## Heuristik

**Regel A, Agent-Start ohne Auftrag** (`Agent`/`Task` durch Lead, `fork` ausgenommen, `SendMessage` ist kein Agent-Start und nicht betroffen). Der Prompt ohne Kopfzeilen (`Persona:`, `Paket:`, `Modell:`, `Budget:`, `Meilenstein:` usw., erste 15 Zeilen wie `modelguard.header`) wird normalisiert. Verweigert wird nur, wenn **beides** gilt:

1. Rest-Text kurz: höchstens 200 Zeichen **und** höchstens 30 Wörter, und
2. er ist ein reiner Warte-/Poll-Text: jeder Satz trifft ein Warte-Muster (`warte|wait|sleep|poll|abwarten|ok|okay|ping|status abfragen|prüfe? ob .* fertig|schau nach ob .* (fertig|durch)|bis .* (fertig|durch|grün)`) und **kein** Arbeitsverb/Artefakt-Hinweis kommt vor (`schreib|implementier|prüf(e)? (den|die|das) (Diff|Code|Branch)|review|teste?|baue?|migrier|erstelle?|lies|analysier`, Pfade mit `/` oder `.py/.ts/.md`, Task-IDs `T\d+`, `AK-\d`).

Leerer oder fehlender Prompt (nach Kopfzeilen) zählt ebenfalls als «ohne Auftrag». Ein langer Prompt (> 200 Zeichen) wird nie blockiert, auch wenn er «warte» enthält: der legitime Fall «Arbeiter-Briefing mit Hinweis `warte auf blocked-by`» bleibt frei.

**Regel B, `sleep` im Hintergrund durch Lead** (`Bash` mit `run_in_background` wahr). Der Befehl wird an `;`, `&&`, `||`, `|` und Zeilenumbruch in Segmente zerlegt; verweigert wird, wenn **ein Segment** mit `sleep <zahl>` beginnt (ggf. nach `timeout`/`nice`/`env`-Präfix). Ein `sleep` im Vordergrund ist bereits durch die Harness-Regel blockiert und hier nicht Gegenstand.

**Abgrenzung legitimer Wartemuster (nicht blockieren):**

- Monitor-/Until-Schleifen: `until <Bedingung>; do sleep 2; done` und `while ...; do sleep ...` mit Bedingung. Das `sleep` steht dort _in_ einer Schleife, nie am Segmentanfang: die Zerlegung trennt `do sleep 2` am `;` nicht als `sleep`-Start ab, weil Segmente mit `do `/`then ` vorne ausgenommen werden (Schleifenkörper). Test fixiert das.
- Lange Bash-Läufe (`make check`, Tests, Browser) mit `run_in_background: true` (E-037): kein `sleep`, frei.
- `SendMessage`, Fortsetzen eines Arbeiters: kein Agent-Start, frei.
- Arbeiter und L0: nie betroffen (Regel nur für `lead-*`).

## Fehlblock-Risiko

| Risiko                                                                   | Wahrscheinlichkeit | Gegenmassnahme                                                                          |
| ------------------------------------------------------------------------ | ------------------ | --------------------------------------------------------------------------------------- |
| Kurzer, aber echter Auftrag («Review T02, AK-3») wird als Warten gelesen | niedrig            | Doppelbedingung (Warte-Muster **und** kein Arbeitsverb/Pfad/ID); bei Zweifel zulassen   |
| Langer Prompt mit eingebettetem «warte»                                  | ausgeschlossen     | Längenschwelle 200 Zeichen/30 Wörter                                                    |
| `until`-Schleife mit `sleep` blockiert                                   | niedrig            | Schleifenkörper ausgenommen, Testfall                                                   |
| `agent_type` fehlt in der Payload (Harness-Version)                      | mittel             | Fehlt → zulassen; Phase B prüft den echten Payload per Event-Datei, bevor `deny` bleibt |
| Falsch-Negative (Warte-Agent mit langem Füllprompt)                      | hoch, hingenommen  | Guard ist Bremse, kein Beweis; die Retro-Zählung über `wait_guard`-Events bleibt        |

Rückfall: `MODE = "warn"` in einer Zeile; Entscheid per Ruling von L0.

## Testfälle (`tools/studio/tests/test_waitguard.py`, unittest wie die Nachbarn)

Negativ (muss blocken), je Beleg der Retro: `«warte»`, `«ok»`, `«Warte auf den Abschluss von tool-dash-versionen und melde dich dann.»`, `«Prüfe ob die Tests fertig sind.»`, `«sleep 240»`, Kopfzeilen mit leerem Rest; Bash `sleep 30` mit `run_in_background`, `make check; sleep 60` mit `run_in_background`.
Positiv (muss frei bleiben): Briefing mit Kopfzeilen und Task-Text (> 200 Zeichen); kurzer echter Auftrag «Implementiere T02 in tools/studio/x.py, AK-3»; «Prüfe den Diff von tool/x gegen Plan»; `fork`; `SendMessage`; Aufrufer `main`/Arbeiter (`agent_type` fehlt/`tech-sim-engineer`) mit Warteprompt; Bash `until [ -f x ]; do sleep 2; done` mit `run_in_background`; `make check` im Hintergrund; `sleep 1` im Vordergrund (nicht Regelgegenstand); Modus `warn` liefert Hinweis ohne `deny`; kaputte Payload/Exception → Exit 0 ohne Ausgabe.

## Task-Tabelle

| Task | Titel                                          | Datei                                                                                        | Modell | Tools |
| ---- | ---------------------------------------------- | -------------------------------------------------------------------------------------------- | ------ | ----- |
| T01  | `waitguard.py` + Tests (rot zuerst), Settings  | `tools/studio/waitguard.py`, `tools/studio/tests/test_waitguard.py`, `.claude/settings.json` | sonnet | ~30   |
| T02  | Doku (arc42 Hook-Liste, STUDIO.md Guard-Zeile) | `docs/arc42.md`, `docs/studio/STUDIO.md`                                                     | sonnet | ~8    |

Ein Strang, ein Worktree. Phase B: 1 Umsetzer (`general-purpose` mit Persona `tech-tools` laut Roster bzw. L0-Briefing), 1 Review `qa-code-reviewer` (gilt als Final-Review, Werkzeug-Paket), Prüfungen `make studio-test`, `make studio-lint`, `make docs-check`. Rot-Beleg (Test vor Code) im Bericht nachweisen (Lücke aus R647). Hinweis: `.claude/settings.json` kann vom Guard geschützt sein; sonst ändert L0 die Verdrahtung.

## Datei-Ownership

Umsetzer: `tools/studio/waitguard.py`, `tools/studio/tests/test_waitguard.py`, `.claude/settings.json` (nur der eine Eintrag), `docs/arc42.md`, `docs/studio/STUDIO.md` (nur Guard-Zeile). Nichts sonst.

## Budgetantrag (Phase B)

1 Umsetzer + 1 Review + 1 Fix-Reserve = 3 Starts, Parallelität 1, ca. 30 + 15 + 10 Tools.
