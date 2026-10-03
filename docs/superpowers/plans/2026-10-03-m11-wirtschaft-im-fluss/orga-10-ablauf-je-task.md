> Teil des Plans M11, Einstieg und Task-Tabelle: [index.md](index.md). **Gemeinsame Regeln:** index.md (Global Constraints).

### Ablauf je Task (Controller)

1. **Vorbereiten:** Ledger `.superpowers/sdd/m11/ledger.md` lesen (letzter geprüfter SHA, offene Rulings). Worktree auf den
   Stand des Vorgängers bringen (`git merge --no-edit <SHA>`, nie rebasen). Dem Arbeiter nur die Task-Datei (alle Teile) und
   die AK-IDs geben, nie den ganzen Plan oder die ganze Spec.
2. **Implementierer** (`tech-*`, Briefing nach `docs/studio/templates/briefing.md`, `Budget: keins, keine Agenten starten`):
   Test zuerst, **roter Lauf im Bericht** (Rot-Beleg-Tabelle der Task-Datei), Umsetzung, `npx vitest run`, `npx tsc --noEmit`,
   `make check`, Testzählbefehl, Doku-Schritt (nur die in „Erwartete Dateien" genannten Doku-Dateien), Commit, Push.
3. **Review** (`qa-code-reviewer`): Urteil OK / BEDENKEN / ZURÜCK gegen Task-Datei und AK; prüft Rot-Beleg, Ownership
   (`git diff --stat`), Testzählung, „Tick"-Grep in neuen Texten, Doku-Konsistenz. Fix-Runde per `SendMessage` an denselben
   Arbeiter, bis OK. BEDENKEN nur behoben oder als Beobachtung/Ruling festgehalten.
4. **UI-Tasks (T10 bis T12):** zusätzlich `qa-playtester` (Headless-Chrome, Szenen aus B1 bzw. in der Task-Datei beschrieben,
   1280 × 800 und 1920 × 1080, Screenshots unter `.studio/qa/<paket>/`).
5. **Abnahme:** SHA ins Ledger, `log.py result`, Board-Paket auf `done`, nächster Task. Nach dem sechsten Arbeiter-Start oder
   200k Kontext Übergabe an die nächste Instanz ([orga-13](orga-13-e010-controller-wechsel.md)).
6. **Stopp-Regeln:** Abweicht ein Haupt-Pin (R74): Stopp, Bericht an L0, nicht nachstellen. Rot-Beleg unmöglich (Test schon
   grün): Mutationsprobe im Bericht belegen und zurücknehmen (orga-05 P-12).
