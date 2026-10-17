# T2 Worker-Deckel (R757)

Befund: `testrun.py` `LOAD_CAP = 8.0` (`load >= LOAD_CAP`), aber `tools/testlock/testlock.ts` `LOAD_MAX = 8` bricht bei Last > 8 ab; der Deckel wirkt nur bei Last genau 8.
Entscheid: `LOAD_CAP = 6.0` (Band 6 bis 8 = 4 statt voller Worker; darüber bricht Testlock ab). Kommentar in testrun.py nennt die Kopplung an `LOAD_MAX`.
Tests: Last 6.0 und 7.5 setzen `VITEST_MAX_WORKERS=4`, Last 5.9 nicht; Test, der `testrun.LOAD_CAP < 8` (Testlock-Grenze aus testlock.ts per Regex gelesen) absichert. Rot-Beleg: vor Änderung rot.
