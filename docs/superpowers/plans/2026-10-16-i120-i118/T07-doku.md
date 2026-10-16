# T07 Doku (Strang R)

Dateien: `docs/arc42.md`, `README.md` (D1 ausdrücklich erlaubt). blocked-by T06.

1. arc42: Modulverzeichnis `src/render/aufstieg.ts` (Erkennung, Deckel), `fx.ts` `drawRiseGlow`, `viewStats` um `suppliedShare`/`houses`, Brücke Render→Audio (Zahlen statt Import; `src/audio/` bleibt grenzfrei), Funkel-Uhr nur bei `speed > 0`. Kein ADR (reversibel, keine Abhängigkeit, kein Save).
2. README Spielanleitung: ein Satz je Teil («Die Stadt klingt voller, wenn die Häuser im Bild versorgt sind», «Ein Aufstieg lässt das Haus kurz aufleuchten; bei «Bewegung reduzieren» nur als ruhiger Schein»).
3. `make docs-check; echo EXIT=$?`. Commit `docs: I-120 + I-118 arc42, README`.
