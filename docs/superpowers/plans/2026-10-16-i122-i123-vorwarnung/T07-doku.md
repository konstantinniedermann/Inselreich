# T07 · Doku (D1, E-017)

`tech-ui-engineer` mit ausdrücklicher D1-Erlaubnis im Briefing · ≈ 15 Tools · blocked-by: T06 (darf parallel zum Review laufen)

Dateien: `README.md` (Spielanleitung, Abschnitt Aufträge/Stammkunde: Vorwarnung 30 s Spielzeit vor der Lieferung, einmaliges Aufleuchten, leiser Ton, «Fehlt …»; Lager-Chip rechnet mit Stammkunde), `docs/spielwerte.md` (Vertragswerte: `CONTRACT_WARN_TICKS = 300`, nur Anzeige und Klang, kein Spieleffekt), `docs/arc42.md` (Bausteinsicht Sim: `contractWarning`, `nextSettleTick` als reine Lesefunktionen, nicht gespeichert; UI: `shouldWarnNow`, `warnedPeriod` als Darstellungsmerker; Audio: `contractWarn`; Hinweis kein Save-Wechsel), `docs/ideen.md` (Status I-122, I-123 umgesetzt, nur falls nicht von lead-production gepflegt; sonst Hinweis im Bericht).

Beobachtungen aus T01/T06 (Probe farSkip bestätigt/widerlegt, Umbruch der Vertragskarte) werden vom Controller als Liste im Bericht an L0 gemeldet; Eintrag in `docs/beobachtungen.md` durch L0.

## Prüfschritte

`make docs-check; echo EXIT=$?` · Verweise auf Spec und Plan geprüft. Commit `docs: Vorwarnung und Reichweite mit Stammkunde (I-122, I-123)`.
