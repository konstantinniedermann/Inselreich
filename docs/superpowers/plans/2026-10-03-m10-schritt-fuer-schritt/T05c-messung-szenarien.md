> **Task-ID:** Task 5 (Paket M10-B1) — Teil 3 von 3
> **AK-IDs:** AK-B1-01, -02 (BG-2), -03, -04 (Messwerte im Bericht)
> **blocked-by:** Task 4
> **Gemeinsame Regeln:** [index.md](index.md) (Global Constraints) · Orga: [orga-06-schnittstellen.md](orga-06-schnittstellen.md) · [orga-07-datei-ownership.md](orga-07-datei-ownership.md) · [orga-11-bitgleich.md](orga-11-bitgleich.md)
> **Teile:** [T05a-messung-szenarien.md](T05a-messung-szenarien.md) · [T05b-messung-szenarien.md](T05b-messung-szenarien.md) · **T05c-messung-szenarien.md** (diese)

- [ ] **Schritt 5: BG-2** (Abschnitt „Bitgleich-Messung"): `VITE_BALANCE_LOG=1 npx vitest run tests/sim/unlock-timeline.test.ts --silent=false`
      und `VITE_BALANCE_LOG=1 npx vitest run tests/sim/balance-merchants.test.ts --silent=false`; Werte in den Bericht
      (AK-B1-04): „Freischalt-Ticks Seed 3: U2 150, U3 350, U4 550, U5 3850 / 4750, U6 6050 / 7050, U1 nie; M8-B1:
      erster Kaufmann …, zweites Ziel …, Bürger-Endzustand … / …; Baseline unverändert". Abweichung: nicht nachstellen.
- [ ] **Schritt 6: Commit.** `git add tests/sim && git commit -m "test: M10-B1 Freischalt-Ticks, Szenarien m10-* mit Prüfpunkten (Spec 9.3, 18.1)"`

---
