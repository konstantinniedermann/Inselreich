# Studio-Stand

Übergabe zwischen Sessions. L0 liest diese Datei beim Session-Start und führt sie beim
Session-Ende nach (STUDIO.md, „Session-Start und -Ende"). Nur aktueller Stand, keine Historie —
Historie steht in [rulings.md](rulings.md), Git und im Dashboard-Archiv.

Stand: 2026-09-30 (Übergabe Session 664ac8d3 bei 77 % Kontext)

## Aktuelles Projekt und Phase

- Projekt: **Inselreich** (Aufbau-Strategiespiel im Browser). M1–M5 fertig und live.
- **Nutzerauftrag nach M5-Playtest** („mehr Tiefe, bessere Grafik, Ambiente, Musik, die Stimmung
  muss rüberkommen"): Programm in zwei Strängen (R73):
  - **M7 „Stimmung"** (lead-art) — Phase Spec; Gate Brainstorming bestanden mit Auflagen (R77):
    Vertical Slice zuerst, Vorher/Nachher-Bilder an den Nutzer.
  - **M6 „Krisen und Stadtdienste"** (lead-design) — Phase Spec; Entscheide R74; K-C → M8.
- **Desktop-first** ist Dauerregel (R78, Projekt-CLAUDE.md); Mobil kein Ziel.
- Studio: Verfassung 1.1, Handbuch 1.7 (R75: E-001 angepasst, E-003 läuft). Limit-Sensor in
  Betrieb (R80) — Hook-Zeile zeigt Woche/Kontext.

## Parallele Sessions

| Session         | Stand     | besitzt     | bis |
| --------------- | --------- | ----------- | --- |
| 664ac8d3 (R73…) | übergeben | nichts mehr | –   |

## Seit letzter Session erledigt

- Rulings R73–R80. M5-NACHLESE gemergt (5a710cf), STUDIO-LIMIT gemergt (57d1022), CI/Pages grün.
- Handbuch 1.7, Personas Desktop-first (tech-ui-engineer 1.5, qa-playtester 1.5).
- Gemergte M5-Worktrees aufgeräumt; Beobachtungen Mobil und Limit-Restbefunde eingetragen.

## Pausierte Pakete

- **M7-SPEC** (lead-art): Vorschlag `.studio/handoffs/2026-09-30-lead-art-l0-m7-vorschlag.md`,
  Schnittstelle M6 `.studio/handoffs/2026-09-30-lead-art-lead-design.md`, Übergabe
  `.studio/handoffs/m7-spec.md` (vom Lead beim Pausieren). Auflagen R77 + R78 (Frame-Budget
  Desktop 1920×1080, ≥ 60 fps Ziel, ≥ 30 fps Untergrenze; kein Mobil-HUD). Nächster Schritt:
  Spec fertig → Gate Spec (lead-tech, lead-qa) → Plan mit Vertical Slice als erstem Render-Paket.
- **M6-SPEC** (lead-design): Branch `docs/m6-spec` (`.worktrees/m6-spec`), Übergabe
  `.studio/handoffs/m6-spec.md` (inkl. Tiefe-Empfehlung M6 vs. M8). Nächster Schritt: Spec fertig
  → Gate Spec (lead-tech, lead-qa).
- Nutzer-Spielstand angefragt (Anleitung im Chat): `.studio/playtest/nutzer-save.json` — liegt er
  vor, an lead-design (Tiefe) und lead-art geben.

## Budget

keine Freigaben (nach Session-Wechsel neu loggen)

## Offene Entscheide

- L0: Aufräumen Worktrees/Branches `fix/m5-nachlese` und `feat/studio-limit` (gemergt, §6: nur
  lokal, `-d`); Handbuch „Limits und Sessiongrösse" von „in Arbeit" auf „in Betrieb" (Coach, R80);
  Paket `log.py result --package` (R75, jetzt frei); Beobachtung „Integrator läuft trotz
  Vordergrund im Hintergrund" (zweimal in dieser Session) → Coach.
- Nutzer: keine offenen Warteschlangen-Einträge. Vorher/Nachher-Bilder des Vertical Slice kommen
  im Bericht (nicht blockierend).

## Nächste Schritte

1. Übergaben m7-spec.md und m6-spec.md lesen, beide Leads neu briefen (Budget neu loggen).
2. Gate Spec für M6 und M7 parallel (lead-tech, lead-qa).
3. Pläne; M7 startet mit dem Vertical Slice, M6-Sim parallel (R73: M7 Vorrang in render/audio).
