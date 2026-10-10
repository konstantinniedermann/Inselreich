# T03 · Doku UI, Beobachtungen, Release-Notiz

Strang `ui` · Worktree `.worktrees/rel-16-ui` · Branch `fix/rel-16-ui` · Umsetzer `tech-ui-engineer` (sonnet, per SendMessage fortgesetzt; D1-Dateien ausdrücklich erlaubt, E-017) · AK-R16-07 · Grösse S (≈ 10 Tools) · blocked-by T01+T02 (Review OK) · Review: derselbe `qa-code-reviewer` per SendMessage

**Files:**

- Modify: `README.md` (Abschnitt Bedienung, Eintrag **Cursor-Hinweis**, Z. ~59–62)
- Modify: `docs/arc42.md` — **nur** diese Stellen (Ownership `ui`, Index E4): Bausteintabelle `src/ui`, Zeile `hints.ts` (Z. ~271) und `hud.ts` (Z. ~265); Absatz „Vor dem Klick zeigt der Cursor-Hinweis …“ (Z. ~482); Liste „Laden und «Neu» beenden das laufende Spiel über `dispose()` …“ (Z. ~964). Den Abschnitt „Studio-Werkzeuge“ (Z. ~582–596) **nicht** anfassen (gehört Strang `py`).
- Modify: `docs/beobachtungen.md` — nur neue Einträge am Dateiende (Abschnitt „Offen“); die Tabellen „Ausgewertet …“ bleiben unverändert (die nächste Auswertung durch `lead-production` hakt REL-16 (1)/(2) ab).

## Schritte

- [ ] **Schritt 1: README.** Im Eintrag **Cursor-Hinweis** nach „… oder warum nicht“ sinngemäss ergänzen: „über Wasser oder Gebirge nennt es das Gelände («Kein Bauland: Gebirge»), über einem Gebäude oder Weg, was dort steht («Platz belegt: Wohnhaus»); dieselbe Meldung erscheint beim Klick.“ Prüfen, ob README weitere Stellen mit „Kein Bauland“ oder „Hier steht schon“ hat (`grep -n "Kein Bauland\|Hier steht schon" README.md`), sonst nichts ändern. Spielwerte sind nicht betroffen.

- [ ] **Schritt 2: arc42.** `hints.ts`-Zeile: „… `REASON_TABLE` nennt mit Grundriss (`ReasonCtx.at`) Gelände bzw. Belegung“. `hud.ts`-Zeile: „… `unbindIslandMenu` meldet sie beim Spielende ab“. Cursor-Hinweis-Absatz: ein Halbsatz zu Gelände/Belegung. `dispose`-Liste: „Inselmenü-Listener (`unbindIslandMenu`)“ ergänzen.

- [ ] **Schritt 3: Beobachtungen** (nur, was im Paket neu aufgefallen ist; Format: Überschrift Ebene 3 `### 2026-10-10 · REL-16: <Titel>` (nur Ebene 2/3 zählt für die Marke R287) und eine Zeile mit **Fundort**, Beobachtung, Ursprung, Einschätzung). Kein Eintrag für die zwei erledigten Kandidaten.

- [ ] **Schritt 4: Prüfen und Commit**

```bash
make docs-check; echo EXIT=$?
make lint; echo EXIT=$?
```

Commit `docs: REL-16 README, arc42, Beobachtungen` mit Session-Trailer.

- [ ] **Schritt 5 (Controller): Strang-Ende.** `uptime`, dann `make check; echo EXIT=$?` (Testsperre; Exit 3 → `waiting` loggen, später erneut), `log.py result` mit Häppchen-ID UI-REL16, Bericht an L0 „release-reif“ mit dem Release-Notiz-Entwurf unten.

## Release-Notiz-Entwurf (für `docs/studio/state.md`, schreibt L0 bzw. `lead-production` beim Release)

**Neu**

- Das Bauschild nennt den Grund genau: über Wasser oder Gebirge «Kein Bauland: Wasser» bzw. «Kein Bauland: Gebirge», über einem Gebäude oder Weg «Platz belegt: Wohnhaus» bzw. «Platz belegt: Weg». Dieselbe Meldung erscheint beim Klick.
- Neue Insel und Laden räumen das Inselmenü des alten Spiels vollständig ab, auch wenn ein Start fehlschlägt.

**Bitte testen**

- Wohnhaus- und Weg-Werkzeug am Fuss eines Berges, an der Küste und über bestehenden Häusern und Wegen: Passt das Schild zur Kachel unter dem Zeiger?
- Nach «Neue Insel» das Inselmenü öffnen und mit Esc bzw. einem Klick daneben schliessen.

## Abnahme (Reviewer, per SendMessage)

- README und arc42 stimmen mit dem Code aus T01/T02 überein (Texte wörtlich); keine arc42-Änderung ausserhalb der vier Stellen; `make docs-check` Exit 0.
