# Ad-hoc-Retro: Push-Gate REL-10 scheitert am Zeitreserve-Gate (PUSH-REL-10)

Art: adhoc · Datum: 2026-10-09 · Auslöser: Integrator-Lauf PUSH-REL-10 ohne Push, dritte Verschiebung (R385, R386, R391)

## Beobachtung (Belege)

- `make test` lief zweimal grün (2669 Tests). Last Start 2,7 → Ende 10,3 und Start 1,3 → Ende 7,1.
  `zeitreserve-push` endete mit Exit 2 „nicht belastbar“, kein Push (R394).
- Vitest lastet die 10 Kerne selbst aus. `loadMax ≤ 4` ist mit vollem Lauf nicht erreichbar (R394, bestätigt B10 aus
  `retros/2026-10-08-session-29c3791b-ende.md`).
- R392 verlangte als Vorbedingung für V7 den Beleg, woher die E-043-Faktoren stammen. R393 fand: Einzeltests (Faktor 4,
  R302) bzw. E-043 (`afb14a8`), Last erst seit `c69938d` mitgemessen. Daraus folgte dort „nicht belegbar ⇒ V7 entfällt“.
- R394 (gleicher Tag) liest dieselbe Tatsache anders: Einzeltests ohne Eigenlast ⇒ Faktoren überschätzen unter Last,
  das Urteil wird strenger, nie lascher. V7 wird als TOOL-GATES-2b umgesetzt (`3d5c1af`).
- TOOL-GATES-2: Test und Skript in einem Schritt angelegt, 4 von 5 Fällen ohne Rot-Phase (R393).

## Deutung

- Ursache 1: Die Vorbedingung wurde als Beweisfrage gelesen („belegt / nicht belegt“) statt als Richtungsfrage („in
  welche Richtung irrt die Annahme, und ist das tragbar?“). Die Richtung (Überschätzung = strenger) war aus den eigenen
  Daten in R393 ablesbar.
- Ursache 2: Beim Entfall von V7 wurde nicht geprüft, ob das abhängige Gate (`zeitreserve-push` in REL-10) danach noch
  erfüllbar ist. B10 hatte genau diese Unerfüllbarkeit schon beschrieben; R392 band V7 ausdrücklich „vor dem Push-Gate“.
- Ursache 3: lead-tech meldete das beim Abnahmebericht nicht als Risiko. Der Briefing-Text fragte nur nach dem Beleg.
- Muster, kein Einzelfall: Es ist die dritte Verschiebung am selben Gate; R391 und R394 mussten das Gate nachträglich
  entschärfen. Kostenfolge: ein Integrator-Start, zwei Volllaeufe `make test`, ein Paket TOOL-GATES-2b (≈ 15 Tools).
- Zweiter Prozesspunkt (Test und Skript gleichzeitig) ist ein Einzelfall in diesem Paket. Er ist unabhängig vom Vorfall und
  bleibt eine Beobachtung, bis ein zweites Paket es zeigt.

## Effizienz-Ampel

Nicht neu ausgewertet (Ad-hoc, Lastschonung vor dem Push-Gate). Stand und Hebel E-038 (ab 2026-10-22) laut R392 unverändert.

## Vorschläge (L0 entscheidet per Ruling)

- **V1 · Gate-Zeile „Vorbedingung entfällt ⇒ Wirkung auf das abhängige Gate prüfen“.** Briefing-Vorlage und Abnahme-
  Checkliste (Handbuch, Minor): Entfällt oder ändert sich eine Vorbedingung oder ein Werkzeug-Paket, nennt die Abnahme
  (a) die Richtung des Fehlers (strenger/lascher) und (b) ob das abhängige Gate danach erfüllbar ist, mit einem
  Beleg (Messdatei oder Probelauf). Messgrösse: 0 Gate-Abbrüche in den nächsten 5 Push-Gates, deren Ursache ein zuvor
  entfallenes Werkzeug-Paket ist. Rückfall: Zeile streichen (Handbuch zurück auf die Vorversion). Eigene Wirkung bleibt
  messbar (Abbrüche stehen in den Integrator-Berichten).
- **V2 · Rot-Beleg im Abnahmebericht für Werkzeug-Pakete.** Pflichtzeile: „je Testfall rot gesehen: ja/nein“. Messgrösse:
  Anteil Fälle ohne Rot-Phase ≤ 20 % in den nächsten 3 Werkzeug-Paketen (Ausgang 4/5). Rückfall: Zeile streichen.
  Empfehlung: erst bei zweitem Fall annehmen (Einzelfall), sonst nur beobachten.

Empfehlung: V1 annehmen, V2 zurückstellen.

## Vorschlag Zeile für `lernen.md` (nicht eingetragen)

„Entfällt eine Vorbedingung, prüfen: in welche Richtung irrt die Annahme, und ist das abhängige Gate danach noch
erfüllbar? ‚Nicht belegbar‘ allein ist kein Entscheidungsgrund (Beleg: R393 gegen R394).“
