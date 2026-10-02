> **Task-ID:** Task 1 (Paket M10-S1A) — Teil 5 von 5
> **AK-IDs:** AK-S1-01, -02, -03, -04, -05 (a, b, Strukturteil c), -10, -11, -12, -13, -14 (a, b, c1, d–g), -15, -16 (BG-1), -20 (Fixture), `RF-1`
> **blocked-by:** Gate Plan, Gate Merge M8
> **Gemeinsame Regeln:** [index.md](index.md) (Global Constraints) · Orga: [orga-06-schnittstellen.md](orga-06-schnittstellen.md) · [orga-07-datei-ownership.md](orga-07-datei-ownership.md) · [orga-11-bitgleich.md](orga-11-bitgleich.md) · [orga-12-geaenderte-tests.md](orga-12-geaenderte-tests.md)
> **Teile:** [T01a-freischalt-modell.md](T01a-freischalt-modell.md) · [T01b-freischalt-modell.md](T01b-freischalt-modell.md) · [T01c-freischalt-modell.md](T01c-freischalt-modell.md) · [T01d-freischalt-modell.md](T01d-freischalt-modell.md) · **T01e-freischalt-modell.md** (diese)

- [ ] **Schritt 8: BG-1** ausführen (ohne die AK-S1-17-Zeile), Ausgabe in den Bericht; Testzählbefehl.
- [ ] **Review-Zusatz (R164 QA 4, nur bei Task 1):** Der Reviewer führt den Abdeckungs-Grep aus dem Plankopf gegen die
      echte Vitest-Ausgabe aus und belegt im Bericht, dass er `AK-S1-01` trifft (Ausgabezeile zitieren). Trifft er
      nicht, korrigiert der Controller das Muster im Ledger (gilt dann für alle weiteren Reviews und das
      Final-Review) und meldet die Korrektur im Schlussbericht.
- [ ] **Schritt 9: Commit.**

```bash
git add src/sim tests/sim
git commit -m "feat: M10-S1A Freischaltbaum, tickUnlocks, Save v5 mit Migration v4 (Spec 4, 8)"
```

---
