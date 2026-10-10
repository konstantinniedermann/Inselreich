# T04 · Doku und Entwurf der Release-Notiz

Strang UI · Worktree `.worktrees/rel-17` · Umsetzer `tech-ui-engineer` (sonnet, Fortsetzung per SendMessage) · AK-R17-17 (`ak.md`) · blocked-by T03 (Review OK) · Grösse S (≈ 10 Tools)

**Stand nach REL-16-Merge (B4):** REL-16 hat dieselben drei Dateien schon geändert (`README.md` +1/-1, `docs/arc42.md` 98 Zeilen, `docs/beobachtungen.md` +12, Eintrag „REL-16 (R454): Bauschild-Randfälle“). Zeilenangaben unten sind Planzeit-Werte: Abschnitte per grep finden (`### Tastatur und Maus`, `### Abriss`, `Wann eine Aktion wirkt`, Tabelle `src/ui/`, `Ziel je Werkzeug`). Beobachtungen nur anhängen.

Das Briefing erlaubt ausdrücklich die Doku-Dateien unten (E-017, D1). Kein Code.

**Files:**

- Modify: `README.md`, `docs/arc42.md`, `docs/beobachtungen.md` (nur anhängen)
- Nicht ändern: `docs/studio/state.md` (Release-Notiz trägt L0 beim Gate ein), `docs/ideen.md`, `docs/superpowers/specs/`, `docs/superpowers/plans/2026-10-10-rel-16/`

## Schritte

- [ ] **Schritt 1: README, Tastentabelle** (Abschnitt „### Tastatur und Maus“, Z. ~124–148). Neue Tabellenzeile nach `?`: Eingabe `` `.` / `,` ``, Wirkung „Zum nächsten / vorigen Problem springen (öffnet das Info-Panel, Werkzeug bleibt)“. Im Absatz darunter ein Satz: „Probleme sind, nach Dringlichkeit: nicht angebundene Gebäude und Häuser ausserhalb der Versorgung, stehende Betriebe (wartet auf Ware, kein Wald, kein Dienst), Häuser ohne Dienst, fehlende Waren (ein Eintrag je Gut und Insel). Die Meldung zählt mit („Problem 2 von 5: …“); ohne Problem: «Alles versorgt, kein Problem offen». «Lager voll» und Brände zählen nicht.“
- [ ] **Schritt 2: README, Abriss.** Bullet „**Abriss:**“ (Z. ~98): „Werkzeug wählen, dann auf einen Gebäudekörper klicken (reisst dieses Gebäude ab) oder über Wege ziehen (reisst nur Wege ab, Gebäude bleiben stehen) — oder im Info-Panel «Abreissen».“ Bullet „**Wann eine Aktion wirkt:**“: Abriss-Zug wirkt wie der Weg-Zug sofort je Kachel. Abschnitt „### Abriss“ (Z. ~393): Satz „Ein Weg erstattet wie jeder Abriss die Hälfte (2 Geld). Trennt ein Abriss Gebäude vom Kontor, meldet das Spiel am Ende des Zugs „Abriss trennt n Gebäude vom Kontor“; `.` springt zu ihnen.“
- [ ] **Schritt 3: arc42.** Ebene 2 `src/ui/` (Tabelle ab Z. ~255): neue Zeile `problems.ts` („rein: Problem-Liste in vier Klassen, Reihenfolge Klasse → Anker-Insel → Abstand zum Sprungpunkt → ID, Umlauf mit Cursor (`problemStep`), Menge „nicht angebunden“ für die Trenn-Warnung; liest `houseDiagnosis`, `state`, `connected`; nicht im Spielstand; Baustein für I-043“). Zeile `input.ts`: „Weg-Ziehen“ → „Zieh-Werkzeuge (Weg, Roden, Aufforsten, Abriss nur für Wege über die Bodenkachel)“. Zeile `hotkeys.ts`: `.`/`,` (`problemNext`/`problemPrev`). Zeile `app.ts`: „Problem-Sprung (`jumpToProblem`), Trenn-Warnung am Ende eines Abriss-Zugs“. Abschnitt „Ziel je Werkzeug“ (Z. ~764): „Abreissen auf das vorderste Gebäude unter dem Zeiger, sonst die Bodenkachel; im Abriss-Zug immer die Bodenkachel (`strokePickTool`)“. Zeile `messages.ts` (falls vorhanden): `replaceMessage(slot, …)`.
- [ ] **Schritt 4: Beobachtungen** (`docs/beobachtungen.md`, nur anhängen, Format der Datei): (a) „Log-Klick auf Fremdinseln: `resolveLogClick` zentriert auf Insel-Kacheln ohne `ox/oy` (`app.ts` Z. ~687), der Problem-Sprung rechnet mit Archipel-Kacheln; prüfen, ob Krisen auf Fremdinseln vorkommen“ (Ursprung REL-17 Plan); (b) „`unconnectedIds` (`hints.ts`) zählt die Amtsstube mit, `cutOffIds` (`problems.ts`) nicht (`needsConnection`); bei I-043 vereinheitlichen“; (c) „Weg-Zug und Tasten `0`/`9`: ein Inselsprung mitten im Zug bricht den Zug nicht ab (nur `.`/`,` tun das, E6); prüfen“. Weitere Befunde aus T01–T03 dazu; (d) **Touch-Schwelle ungeprüft (B5):** AK-R17-16 verlangt „Touch-Schwelle wie Weg“ für den Abriss-Zug; es gibt keinen Touch-Beleg (Desktop-first, kein Touch-Lauf in T05), Eintrag «ungeprüft».
- [ ] **Schritt 5: Entwurf Release-Notiz** — nicht in eine Datei, sondern in den Bericht (≤ 10 Zeilen, „Neu“ / „Bitte testen“, Ideen I-041/I-042 als „vom Studio vorgeschlagen“), Muster `docs/studio/state.md` letzter Release-Eintrag.

```bash
make docs-check; echo EXIT=$?
```

## Commit

`docs: README und arc42 zu Problem-Sprung und Abriss-Zug (REL-17)`; Trailer der Session.

## Bericht

Geänderte Abschnitte mit Zeilen, Beobachtungs-Einträge (Titel), Release-Notiz-Entwurf wörtlich, `make docs-check` Exit-Code.
