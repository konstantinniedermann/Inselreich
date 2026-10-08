# Nutzerentscheid-Warteschlange

Hier stehen die Fragen, die laut [Verfassung §5](VERFASSUNG.md#5-autonomie-und-nutzerentscheid-warteschlange)
nur der Nutzer entscheidet: Folgeissues, Lizenz-Grenzfälle,
Änderungen der Verfassung und ein Richtungswechsel des Spiels. Das Team wartet nicht auf die
Antwort: Nur das betroffene Paket bleibt zurückgestellt, alles andere läuft weiter.

**Format** — ein Abschnitt je Eintrag, angelegt mit `python3 tools/studio/log.py queue …`
(Ablauf im Handbuch [STUDIO.md](STUDIO.md), Abschnitt „Autonomie"):

```markdown
## N-<nnn> · <status> · <JJJJ-MM-TT> · <Kurztitel>

- Frage: <was zu entscheiden ist>
- Empfehlung: <was das Team vorschlägt>
- Begründung: <warum>
- Kosten des Wartens: <was liegen bleibt, solange keine Antwort da ist>
- Blockiert: <Paket-ID> (oder „nichts")
- Von: <rolle>
- Antwort: –
```

**Status:**

| Status        | Bedeutung                                                   |
| ------------- | ----------------------------------------------------------- |
| `offen`       | wartet auf die Antwort des Nutzers                          |
| `beantwortet` | Antwort ist eingetragen, der Projektleiter setzt sie um     |
| `umgesetzt`   | Antwort ist umgesetzt, das blockierte Paket ist freigegeben |

**So antwortest du (Nutzer):** In einer beliebigen Session schreiben „`N-001: <Antwort>`" oder
die Zeile „Antwort" hier ausfüllen. Der Projektleiter trägt die Antwort ein, setzt sie um und
schliesst den Eintrag.

---

## N-001 · umgesetzt · 2026-09-30 · Verfassung 1.0 bestätigen

- Frage: Bestätigst du die Verfassung 1.0 (docs/studio/VERFASSUNG.md), insbesondere §5 Autonomie mit Vorrang vor ../CLAUDE.md und §7 Push auf main nach grünem Check?
- Empfehlung: bestätigen
- Begründung: Nutzerauftrag Session 1.5
- Kosten des Wartens: keine — gilt vorläufig
- Blockiert: nichts
- Von: studio-director
- Antwort: bestätigt mit zwei Änderungen: (1) §3/§5 — neue Abhängigkeiten darf L0 selbst schaffen, wenn er die Entscheidung tragen kann und keine Alternative Sinn macht; (2) neue Regel: möglichst hoch parallelisieren und delegieren, Effizienz ist oberstes Credo des Projektleiters

## N-90 · beantwortet · 2026-10-01 · Asset-Quellen im Netzwerk freigeben (Q-X1A-NETZ)

- Frage: Die Netzwerk-Policy der Cloud-Umgebung sperrt freesound.org, cdn.freesound.org, opengameart.org, fonts.google.com und archive.org. Ohne Zugriff kann X1a (Musik, Umgebungsklänge, Schrift) nicht neu erstellt werden. Hosts freigeben oder Originaldateien bereitstellen?
- Empfehlung: In den Umgebungseinstellungen (Umgebungsmenü in der Titelleiste, Edit, Network access) diese Hosts zu den erlaubten Domains hinzufügen.
- Begründung: Lizenzurteil und Dateien aus dem alten Container verloren (R107).
- Kosten des Wartens: Ton bleibt bei prozeduralen Rückfällen, Schrift bei Georgia; übrige M7-Pakete laufen weiter.
- Blockiert: M7-X1a, X1b, Musik in A3
- Von: lead-art
- Antwort: Ohne Nutzer gelöst (R119): lokale Assets feat/m7-assets @ 9ce9025, X1b @ 403dfea abgenommen

## N-91 · beantwortet · 2026-10-01 · Leistung auf deinem Rechner prüfen (nach dem Merge)

- Frage: Nach dem Merge von M7 auf Pages: Spiel mit ?perf=1 öffnen, Szenario Sturm, Zoom ganz heraus, 1920×1080 — liegen die Bilder pro Sekunde bei mindestens 30? (Cloud-Messung ohne GPU: 27 fps, Zeichenzeit nur 4 ms.)
- Empfehlung: Nach dem Merge kurz im Browser prüfen; ich liefere eine einfache Anleitung mit.
- Begründung: AK-U3-09/AK-R4-06 sind ohne Grafikkarte nicht bewertbar (R116).
- Kosten des Wartens: Keine Blockade; bei <30 fps folgt ein Leistungspaket.
- Blockiert: nichts (Nachprüfung)
- Von: lead-qa
- Antwort: Ohne Nutzer beantwortet (R119 c): INT-Check auf Mac M1 Pro, Sturm+Feuer, 1920x1080 DPR 2: 120 fps (Bildschirmgrenze), renderMedian 2,6 ms

## N-92 · umgesetzt · 2026-10-02 · Guard soll auch git pull --rebase blocken

- Frage: Der Guard-Hook (tools/studio/guard.py) blockt heute nur 'git rebase', nicht 'git pull --rebase'. In dieser Session hat L0 einmal 'pull --rebase' ausgeführt (Verstoss gegen Verfassung §6.3, zweiter Vorfall dieser Art). Darf das Team den Guard so erweitern? Dazu müsstest du in einem eigenen Prompt 'VERFASSUNG ÄNDERN' schreiben (gilt eine Session).
- Empfehlung: Freigeben: Guard um 'pull --rebase', 'pull -r' und 'config pull.rebase true' erweitern, mit Test.
- Begründung: Verfassung §1.3: Änderungen am Guard nur mit Nutzerfreigabe. Das Muster trat zweimal auf; Vorlagen allein (E-011) verhindern es nicht technisch.
- Kosten des Wartens: Gering: Bis dahin schützt nur die Regel in Briefing-Vorlage und lernen.md; ein erneuter Rebase lokaler, ungepushter Commits wäre ärgerlich, aber selten folgenschwer.
- Blockiert: nichts (E-011 läuft ohne Guard-Teil)
- Von: studio-director
- Antwort: Freigegeben (VERFASSUNG ÄNDERN, 2026-10-04)

## N-93 · umgesetzt · 2026-10-03 · Guard soll Persona-Starts ohne Modell blocken

- Frage: Darf guard.py die Regel 'general-purpose mit Persona-Zeile braucht model' bekommen? (Diff fertig und getestet, Scratchpad gp/guard-persona.diff + test_guard.diff)
- Empfehlung: Freigeben, zusammen mit N-92 in einem Guard-Commit
- Begründung: 41 Persona-Starts liefen ungewollt auf opus (Effizienz-Ampel rot); Handbuchregel allein hat das bisher nicht verhindert
- Kosten des Wartens: Bis zur Freigabe nur Handbuchregel, Risiko weiterer ungewollter opus-Starts in M10
- Blockiert: nichts (Guard-Matcher steht schon, Regel fehlt)
- Von: studio-director
- Antwort: Freigegeben (VERFASSUNG ÄNDERN, 2026-10-04)

## N-94 · umgesetzt · 2026-10-04 · Löschen ausserhalb des Repos: verboten lassen oder auf Nachfrage?

- Frage: Heute verbietet Verfassung §6.4 jedes Löschen ausserhalb von Repo und Temp-Ordner hart (Guard). Du wünschst: ausserhalb nur mit deiner Freigabe. Soll §6.4 so geändert werden, dass der Guard dort nachfragt statt sperrt?
- Empfehlung: Verboten lassen. Löschen ausserhalb des Repos kommt im Studio praktisch nicht vor; falls doch, meldet L0 den Pfad und du löschst selbst.
- Begründung: Eine Nachfrage-Stufe braucht eine Verfassungs- und Guard-Änderung (nur du, mit 'VERFASSUNG ÄNDERN') und schwächt den Schutz gegen Versehen; der Nutzen ist klein.
- Kosten des Wartens: Keine: nichts ist blockiert, Löschen im Repo ist seit R207 freigegeben.
- Blockiert: nichts
- Von: studio-director
- Antwort: Verboten lassen (Nutzer 2026-10-04)

## N-95 · beantwortet · 2026-10-05 · Spielstand-Feld ohne neue Versionsnummer (Fest in der Kapelle)

- Frage: Darf ein neues optionales Feld im Spielstand (Fest-Zeitpunkt an der Kapelle) ohne neue Save-Versionsnummer kommen? Die Verfassung sagt 'Save-Format versionieren und migrieren, mit Test für alte Spielstände'.
- Empfehlung: Ja: alte Spielstände laden nachweislich (Test), ungültige Werte werden abgewiesen; eine neue Nummer hätte eine leere Migration und kollidiert mit M12 (v7).
- Begründung: Auslegung einer festen Verfassungsregel ohne Präzedenz (R240 D-140)
- Kosten des Wartens: Keine: Arbeit läuft; bei Nein vor REL-04 Versionswechsel nachziehen (~1 Paket)
- Blockiert: nichts (Release REL-04 erst danach endgültig)
- Von: l0
- Antwort: Nutzer 2026-10-05: überlässt solche Entscheide L0; L0 entscheidet Ja (Empfehlung), R260

## N-96 · beantwortet · 2026-10-05 · Verfassung §3: Spielstände ohne Rückwärtskompatibilität (Wortlaut)

- Frage: Du hast entschieden: Spielstände müssen künftig nicht rückwärtskompatibel sein. Die Verfassung (§3, feste Regel 'Save-Format versionieren und migrieren, mit Test für alte Spielstände') ist schreibgeschützt; nur du gibst sie frei. Neuer Wortlaut: 'Save-Format versionieren; ältere Spielstände müssen nicht ladbar sein. Ein inkompatibler Spielstand wird mit Hinweis abgewiesen, nie ein Absturz; Test für das Abweisen.'
- Empfehlung: In einem eigenen Prompt 'VERFASSUNG ÄNDERN' schreiben; L0 setzt dann genau diesen Wortlaut (Version 1.2) und zieht Briefing-Vorlage nach.
- Begründung: Nur der Nutzer ändert die Verfassung (§1.2/§1.3, Guard-Hook).
- Kosten des Wartens: Keine: Dein Entscheid gilt ab sofort per Ruling R260; nur der Verfassungstext und der wörtlich kopierte Regelblock in Briefings bleiben bis dahin veraltet.
- Blockiert: nichts
- Von: l0
- Antwort: Nutzer 2026-10-05: VERFASSUNG ÄNDERN; Wortlaut gesetzt, Verfassung 1.2 (R261)

## N-97 · beantwortet · 2026-10-07 · Guard erweitern: pkill/killall -f sperren

- Frage: Darf L0 den Guard (tools/studio/guard.py, verfassungsgeschützt §1.3) so erweitern, dass pkill/killall mit -f bzw. auf allgemeine Namen gesperrt werden? Freigabe per 'VERFASSUNG ÄNDERN' in der Hauptsession.
- Empfehlung: Ja freigeben
- Begründung: Ein Engineer hat 'pkill -f vitest run' benutzt und damit evtl. fremde Testläufe beendet (R299); R263 verbietet es schon, aber nur auf Papier (Retro 2026-10-07).
- Kosten des Wartens: Gering: Regel bleibt Papier, Risiko eines erneuten Fremd-Abbruchs bei parallelen Läufen.
- Blockiert: TOOL-GUARD-PKILL
- Von: studio-coach
- Antwort: Nutzer 2026-10-07: VERFASSUNG ÄNDERN — L0 setzt Guard-Erweiterung selbst um (R305)

## N-98 · offen · 2026-10-08 · GitHub Actions wieder einschalten — mit Sparregeln?

- Frage: CI und Pages sind seit 2026-10-08 abgeschaltet (Nutzer-Stopp, R333). Wieder einschalten, und wenn ja, mit welchen Regeln?
- Empfehlung: Einschalten mit drei Regeln: (1) CI und Pages ignorieren reine Doku-Pushes (paths-ignore docs/**, **/\*.md, .studio/**, .claude/**) — 324 von 433 main-Pushes im Oktober waren docs:; (2) Pages nur noch manuell beim Release (workflow_dispatch durch den Integrator); (3) CI mit concurrency cancel-in-progress. Erwartung: rund 50–150 statt ~3500 min/Monat.
- Begründung: Ohne CI fehlt die zweite Prüfung auf frischer Linux-Maschine; ohne Pages geht kein Release mehr live.
- Kosten des Wartens: Bis zur Antwort: Releases bleiben lokal (make check, CI=true make check als Gate), Pages zeigt REL-07; keine Minuten.
- Blockiert: Pages-Deploy künftiger Releases, CI-Erfassung (ci.py)
- Von: l0
- Antwort: –
