> Teil des Plans M11, Einstieg und Task-Tabelle: [index.md](index.md). **Gemeinsame Regeln:** index.md (Global Constraints).

### Bitgleich und Neupin

- **Bricht (bewusst, R185/R187/R189):** Geldverlauf, Siegtick, Fingerabdruck durch S10 (T01) und Dämpfung (T02). Neupin
  einmal in **T03**, nach beiden Brüchen. Soll: Spec 14 (M-01 … M-15), Verfahren: Spec Anhang 02 C.
- **Bleibt bitgleich zu T03** (Prüfung in T09 und B1): S2 (Controller baut nie), S3 (Controller rodet nie, A9, M-09), S4 `eff`
  und S12 `level` (normalisiert), R161. Ein Pin, der nach T04 bis T09 wackelt, ist ein Fehler des Tasks, nicht ein Neupin.
- **Messung:** `VITE_BALANCE_LOG=1 npx vitest run tests/sim/balance`; Messbefehl und Commit stehen im Testkommentar.
- **Abweichung eines Haupt-Pins** (M-01 bis M-04, M-07, M-08, M-10, M-11): nicht nachstellen, Stopp, Meldung an L0 (R74).
  **Neupin mit Beleg** (kein R74-Fall): M-05 Gebäudezahlen, M-06 Fingerabdruck.
- `normalized()` (`tests/sim/balance-crises.test.ts`) entfernt zusätzlich `taxCarry`, `upkeepCarry`, je Gebäude `eff`, `level`
  (T03, AK-BAS-04).
- Messstände je Welle: nach T01 (Fluss; Pins noch alt/rot, nur Protokoll), nach T02 (Dämpfung), **nach T03 (Pin)**, nach T09
  (bitgleich zu T03), nach B1 (M-15).
