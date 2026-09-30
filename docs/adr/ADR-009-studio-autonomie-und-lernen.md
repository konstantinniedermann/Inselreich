# ADR-009: Studio-Autonomie, Verfassung und Selbstverbesserung

Status: akzeptiert · Datum: 2026-09-30 · Spec:
[Studio 1.5](../superpowers/specs/2026-09-30-studio-autonomie-design.md) · Rulings: R22–R37

## Kontext

Das Studio (ADR-007, ADR-008) lief bisher so, dass die Hauptsession nur über CLAUDE.md und das
Handbuch zum Studio-Direktor (L0) wurde und bei Unklarheiten beim Nutzer nachfragte. Der Nutzer hat
in Session 1.5 einen anderen Betrieb verlangt:

- **Jede neue Session ist automatisch der Projektleiter (L0)** — auch nach `/clear`, `/compact`
  und `--resume`.
- **L0 handelt selbstständig und wartet nie untätig.** Nur wenige Vorbehalte (neue
  Laufzeit-Abhängigkeiten, Folgeissues, Lizenz-Grenzfälle, Verfassung, Richtungswechsel) entscheidet
  der Nutzer; sie gehen in eine Warteschlange, um die herum weitergearbeitet wird.
- **Irreversible Aktionen sind verboten statt nachgefragt.**
- **Die Nutzerregeln sind vom Team nicht änderbar**, die Arbeitsweise dagegen schon — aber nur
  nachvollziehbar, versioniert und auf Datenbasis.
- **Aufwand und Qualität sind messbar**; nicht Messbares wird nie geschätzt eingetragen.

Das kollidiert mit der übergeordneten `../CLAUDE.md`, die „jeden Schritt erklären, vor grossen
Änderungen nachfragen" und „beim Start warten, bis der Nutzer entscheidet" verlangt. Ausserdem
fehlte bisher eine Messung von Tokens, Dauer und Ergebnisqualität je Delegation, ohne die sich
keine Verbesserung der Arbeitsweise belegen lässt.

## Optionen

### Wie wird jede Session zum Projektleiter?

1. **`"agent"`-Setting** in `.claude/settings.json`: macht eine Persona zur Hauptsession, ersetzt
   laut Doku aber den Standard-Systemprompt von Claude Code vollständig (Risiko für die
   Werkzeugnutzung, R4).
2. **`--append-system-prompt`**: wirkt nur, wenn der Nutzer die Session mit dieser Option startet
   — nicht automatisch.
3. **Output-Style** mit `keep-coding-instructions: true` und `"outputStyle"` in den
   Projekt-Settings: ergänzt den Systemprompt, behält die Software-Engineering-Anweisungen, gilt
   nur für die Hauptsession (nicht für Subagenten).
4. **Nur SessionStart-Hook**: liefert Kontext, aber keine dauerhafte Rolle im Systemprompt; nach
   langen Sessions kann die Rolle verrutschen.

### Wie werden Verfassung und irreversible Aktionen geschützt?

1. **Konvention**: Regel in Verfassung und Handbuch, kein technischer Schutz.
2. **Guard-Hook** (`PreToolUse`, Antwort `permissionDecision: "deny"`): verweigert Schreibzugriffe
   auf die Verfassung und erkannte irreversible Befehle; Freigabe durch eine Nutzer-Phrase.

### Wie wird der Aufwand gemessen?

1. **OpenTelemetry** von Claude Code: braucht einen Collector (neue Abhängigkeit) und
   Konfiguration beim Nutzer.
2. **Transkripte und Hooks**: Tokens aus den lokalen Transkripten je Message-ID dedupliziert, Dauer
   und Tool-Aufrufe aus Hooks und dem Agent-Ergebnis, Kosten aus dem `cost-state` der Session.
3. **Schätzung** aus Modell und Laufzeit: einfach, aber kein Messwert.

## Entscheidung

- **Projektleiter:** Output-Style „Projektleiter" (Option 3) plus SessionStart-Hook ohne Matcher
  (alle Quellen) plus Dauerregel in CLAUDE.md — drei Schichten, jede für sich wirksam (R23). Das
  `"agent"`-Setting bleibt ungenutzt (R4). Weil nur der Output-Style den Systemprompt ergänzt statt
  ersetzt, ohne Startoption des Nutzers automatisch greift und die Rolle dauerhaft hält — das
  `"agent"`-Setting ersetzt den Systemprompt, `--append-system-prompt` wirkt nur beim Start mit
  Option, und ein Hook allein liefert nur einmaligen Kontext.
- **Verfassung** `docs/studio/VERFASSUNG.md` mit den Nutzerregeln; Rangfolge: Verfassung vor
  Handbuch vor Persona vor Briefing. In diesem Repo ersetzt ihre Autonomie-Regel (§5) das Nachfragen und Warten
  aus `../CLAUDE.md`. Nutzer-Vorbehalte gehen in die committete Warteschlange
  `docs/studio/warteschlange.md` (R26); die Verfassung selbst wartet dort als N-001 auf die
  Bestätigung und gilt bis dahin vorläufig (R33). Weil nur eine getrennte, vom Team nicht
  änderbare Datei die Nutzerregeln vor der Selbstverbesserung des Handbuchs schützt.
- **Schutz:** Guard-Hook `tools/studio/guard.py` (Option 2) für die Verfassung (Freigabe nur mit
  `VERFASSUNG ÄNDERN`, nur Hauptsession, R24) und für irreversible Aktionen (R25). Weil eine reine
  Konvention genau bei einem Versehen versagt, das sie verhindern soll; der Guard fängt die
  häufigen Formen ab, bevor Schaden entsteht.
- **Messung:** Transkripte und Hooks (Option 2, R27); Kosten nur als berechnete Sitzungssumme.
  Verdichtete Metriken werden je Session und Meilenstein als Markdown mit JSON-Rohwerten committet
  (R30). Weil Transkripte und Hooks lokal ohne neue Abhängigkeit vorliegen und echte Messwerte
  liefern — OpenTelemetry bräuchte einen Collector, und eine Schätzung ist kein Messwert.
- **Selbstverbesserung:** Das Handbuch `docs/studio/STUDIO.md` und die Personas tragen Versionen
  mit CHANGELOG. Ein unabhängiger `studio-coach` (Stabsstelle, R28) wertet aus, moderiert Retros und
  schlägt Experimente vor; L0 entscheidet je Vorschlag per Ruling. Leitplanken prüft ein
  Konsistenztest in `make check` (R29). Weil nur eine Stelle ausserhalb der Produktion die
  Arbeitsweise unbefangen bewertet, und Versionen mit CHANGELOG jede Änderung einer Datenbasis und
  einem Ruling zuordnen.

## Konsequenzen

- Die erste Antwort jeder Session ist der Start-Bericht des Projektleiters; der Nutzer wird nur
  noch über die Warteschlange gefragt.
- Der Guard ist ein **Schutz gegen Versehen, nicht gegen Absicht**: Konstrukte wie `$(…)` oder
  Skripte erkennt er nicht; Fehler im Guard lassen die Aktion zu, damit ein Hook die Session nie
  lahmlegt. Das Verwerfen ungesicherter Änderungen im Arbeitsbaum bleibt bewusst erlaubt.
- Die Guard-Einträge in `.claude/settings.json` schützt die Verfassung als Regel (§1.3), nicht
  technisch.
- Der Nutzer kann den Output-Style lokal per `/output-style` überschreiben; dann tragen nur noch
  Hook und CLAUDE.md die Rolle.
- Die Messung hängt am Transkriptformat von Claude Code; nach Updates kann sie ausfallen und zeigt
  dann „nicht gemessen". Output-Tokens können eine Untergrenze sein.
- Handbuch und Personas ändern sich nur über die Verbesserungsschleife; jede Änderung kostet ein
  Ruling, eine Version und einen CHANGELOG-Eintrag.
- Retros kosten zusätzliche Coach-Starts im Budget (Kurz-Retro ≤ 1 Start, ≤ 15 Tool-Aufrufe).
