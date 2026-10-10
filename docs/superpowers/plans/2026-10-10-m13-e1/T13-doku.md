# T13 · Doku: README, arc42, Beobachtungen (E-017)

Strang ui · Worktree `.worktrees/m13-e1-ui` · Umsetzer `tech-ui-engineer` (sonnet; erster Task der Controller-Instanz D, neuer Start mit Ledger) · Spec §11, Anhang 05 · blocked-by T12, T08 · Grösse S (≈ 15 Tools)

**Briefing-Erlaubnis (E-017):** Dieser Umsetzer darf ausdrücklich `README.md`, `docs/arc42.md` und `docs/beobachtungen.md` ändern; sonst nichts.

**Vorbereitung (Controller D):** `git merge --no-ff feat/m13-e1-sim` (Stand T08, Sim fertig) und `git merge main` (REL-17-Doku und ggf. TOOL-BUENDEL-3 in `docs/arc42.md` liegen dann vor; Konflikte in Doku-Dateien löst der Controller, nicht der Umsetzer).

**Files:**

- Modify: `README.md`, `docs/arc42.md`, `docs/beobachtungen.md` (nur anhängen)
- Lesen: Anhang 05, Spec §3 (Tabelle der Edikte, Werte über `src/sim/defs/edicts.ts`), §8, Diff `git diff main...HEAD --stat`

## Inhalt (Anhang 05)

- **README**, Abschnitt Amtsstube → neuer Unterabschnitt «Edikte»: Tabelle der drei Edikte (Name, Wirkung wie `edictEffectText`, Preis 600 Geld), Sperre 5 min, Aufheben kostenlos (sperrt ebenfalls), ruht ohne wirkende Amtsstube (Brand, kein Weg), Abriss beendet das Edikt ohne Erstattung, Freischaltung nach dem Bürger-Ziel; Stapelregel in einem Satz («Fest, niedrige Steuer und Wohlfahrt verkürzen die Aufstiegs-Wartezeit nicht unter 15 s; sie addieren sich nicht»); der B2-Satz **wörtlich**: «Im späten Spiel sind Edikte eine Feinsteuerung von wenigen Prozent; spürbar werden sie beim Zukauf und bei vielen neuen Häusern.»
- **README**, Abschnitt Betriebe → «Stilllegen»: Knopf im Betriebs-Panel, halber Unterhalt (aufgerundet), keine Erzeugung und kein Verbrauch, Kette läuft leer, «Wieder anfahren» mit einem Klick, nicht in der Problemliste. Kontor: Kaufpreise mit Edikt Handel −20 % (aufgerundet).
- **README** Spielstand: Version 11, ältere Stände laden weiter (Kette), neuere werden mit Hinweis abgewiesen.
- **`docs/arc42.md`:** Bausteine (`src/sim/edicts.ts`, `src/sim/defs/edicts.ts`, `src/sim/pause.ts`, `buildingUpkeep` in `levels.ts`; UI `edictView.ts`, `edictSection.ts`); Importregel (`townhall.ts` bleibt Blatt, `edicts.ts` darüber); Tick-Ablauf (Wachstumstakt aus `growthInterval`, Unterhalt wirksam, Stilllegen in `advance` nach dem Ausfall); Persistenz (Version 11, `migrateV10ToV11`, Prüfung C1–C7, Kette v1 … v11, `foldBackToV10` für Hash-Pins). Mermaid nur, wenn ein bestehendes Diagramm die Module aufzählt (kein `\n` in Labels).
- **`docs/beobachtungen.md`** (anhängen, Format der Datei): Befunde aus den Ledgern `.superpowers/sdd/m13-e1-sim/ledger.md` und `…-ui/ledger.md`, die nicht behoben wurden (z. B. Statusmarke «stillgelegt» P-4, Ausbau-Vorschau nominal, Spec-Befund P-2 an `lead-design`).
- Keine Zahl erfinden: jede Zahl gegen `src/sim/defs/` prüfen. Kein ADR (Spec §11).

## Schritte

- [ ] **Schritt 1: Prüfliste (statt Test).** Vorher: `grep -n "Edikt\|stilleg" README.md docs/arc42.md; echo EXIT=$?` → keine Treffer (Ausgangslage belegt).
- [ ] **Schritt 2: Schreiben.**
- [ ] **Schritt 3: Prüfen.**

```bash
make docs-check; echo EXIT=$?
grep -c "Feinsteuerung von wenigen Prozent" README.md; echo EXIT=$?   # 1
grep -n "SAVE_VERSION\|Version 11\|migrateV10ToV11" docs/arc42.md; echo EXIT=$?
```

- [ ] **Schritt 4: Commit.** `docs: Edikte und Stilllegen in README und arc42 (M13-E1 T13)`.

## Bericht

Liste der geänderten Abschnitte (Überschrift → Inhalt in einem Satz), Exit-Codes, eingetragene Beobachtungen (Titel). Danach Controller D: `make check` im UI-Worktree, `git merge-tree --write-tree main feat/m13-e1-ui; echo EXIT=$?`, dann T14.
