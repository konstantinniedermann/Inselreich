# UI-HAEPPCHEN-G: I-155 «Zu spät»-Warnung und I-148 «Wo war ich?»-Karte (Kurzdesign, Stufe leicht)

Stand 2026-10-21 · Paket UI-HAEPPCHEN-G · Quelle: R797, `docs/ideen.md` I-155 und I-148 (IDEEN-14, Branch `docs/ideen-14`), Vorlage `docs/superpowers/specs/2026-10-17-i136-fernkarte-design.md` · Grösse je S · Save: nein (`SAVE_VERSION` unverändert) · Baseline/Balancing: unberührt · Spielwert in `src/sim/defs/`: keiner neu (eine Darstellungsfarbe in `src/render/seaMap.ts` `COLORS`, wie `markWarn`) · Assets: keine

Zwei unabhängige Teile P1 (I-155) und P2 (I-148); Quelldateien überschneiden sich nicht, ein Plan, zwei Pakete.

## Teil P1: I-155 «Zu spät» an der Fern-Marke

### Spielerzweck

Der Spieler sieht an der Fern-Marke der Seekarte sofort, dass die Restzeit nicht mehr für die Fahrt reicht («zu spät», Warnfarbe), und lässt den Fernauftrag oder das Fernangebot fallen, statt Ware vergeblich loszuschicken. Säule: Wirtschaft, Steuern und Handel (Handelsrouten planen). Heute stehen Restzeit (`farMark.text`, I-101) und Fahrzeit (`homeTravelTicks`, I-136) nie zusammen.

Nicht dazu: keine Sim-Änderung, kein Ton, keine Klick-Navigation (I-124 geparkt), keine Warnung auf den Fernkarten im HUD (`farOfferText`) und auf der Auftragskarte (`farOrderText`; der Tooltip der Marke genügt), keine Schiffs-Zuordnung, keine Vorhersage, welches Schiff wann ankommt, keine Stammkunden-Warnung (I-122).

### Regeln

1. **Zu spät, wenn drei Bedingungen zugleich gelten:** (a) `Rest < Fahrzeit`, strikt (`Rest = due − tick` bzw. `farOfferDue − tick`, Fahrzeit = `homeTravelTicks(world, island)` aus `src/ui/homeTravel.ts`, die Formel von I-136 mit dem gemeinsamen Lane-Cache, `SHIP_TICKS_PER_SEA_TILE × d`); (b) `have < amount` mit `have = Lager der Fern-Insel + Ladung der Schiffe, die zu dieser Insel unterwegs sind, zählbar nur wenn ihre Restfahrt ≤ Rest` (sonst gäbe es Fehlalarm, wenn die Ware schon schwimmt); (c) die Fern-Insel hat ein Kontor (sonst gilt die bestehende Kontor-Warnung `warn`, sie hat Vorrang). Die Fahrzeit ist eine Untergrenze (ein Schiff muss erst bereitstehen); «zu spät» heisst also sicher zu spät für Ware aus der Heimat, nie «vielleicht».
2. **Reine Funktion** `farLate(world, mark-Eingaben, lanes?)` in `src/ui/farOrder.ts`, liest nur die Welt, schreibt nichts, nutzt `laneCache`, nie `laneTicks` je Frame (Befund I-136).
3. **Marke:** `MapMark` bekommt `late: boolean` und `tip: string | null` (Fahrzeit-Satz); `farMark` setzt beides. Bei `late` hängt der Markentext « · zu spät» an («12 Gewürz · 0:30 · zu spät»), die Farbe ist ein Bernstein `COLORS.markLate` (neben `markWarn`, `src/render/seaMap.ts`), nicht nur Farbe: das Textwort trägt die Warnung. Die Zeichenhilfe `warn` bleibt unverändert (Kontor fehlt, Rot).
4. **Tooltip:** `seaMapTip` (Hover auf die Insel) nennt bei jeder Fern-Marke mit bekannter Fahrzeit «Fahrzeit ≈ {t}, Rest {r}», auch ohne `late`; bei `late` zusätzlich «zu spät für Ware aus der Heimat». Zeitform `formatGameTime` wie «Frist».
5. **Anzeige-Schlüssel:** `seaMapKey` nimmt `late` auf, damit die Karte neu zeichnet, wenn das Flag kippt (Text ändert sich ohnehin sekündlich).
6. **Randfälle:** Fahrzeit `null` (keine Lane) → nie `late`, Tooltip ohne Fahrzeit. Lager reicht schon (`have ≥ amount`) → nie `late`. Fernauftrag und Fernangebot gelten gleich (Vorrang des Auftrags wie bisher in `farMark`). Fernauftrag, dessen Ware unterwegs ankommt, bevor die Frist abläuft → kein `late`. Frist bereits abgelaufen: `Rest ≤ 0`, Marke verschwindet mit dem Auftrag wie heute.

### Abnahmekriterien

Vitest (`tests/ui/farOrder.test.ts`, `tests/ui/seaMapView.test.ts`, `tests/render/seaMap*.test.ts` mit Fake-Kontext):

- AK-G1 Fahrzeit: `farLate` benutzt `homeTravelTicks`; Fremdinsel d=25 (250 Ticks), Rest 249, Lager 0 < Menge → `late`; Rest 250 → nicht `late` (strikt).
- AK-G2 Lager: Lager = Menge → nicht `late`; Lager < Menge → `late`; Ware auf einem Schiff mit `to` = Insel und `left ≤ Rest` zählt zum Lager; mit `left > Rest` nicht; Schiff mit anderem Ziel zählt nie.
- AK-G3 Kontor fehlt: `warn` wahr, `late` falsch (Vorrang), Zeichner nimmt `markWarn`.
- AK-G4 Ohne Lane: `late` falsch, Tooltip ohne Fahrzeit-Satz, kein Wurf.
- AK-G5 `farMark.text` endet bei `late` mit « · zu spät», sonst zeichengleich zur Vorgängerform; Auftrag und Angebot (`kind`) beide geprüft.
- AK-G6 Zeichner: bei `late` nutzt `seaMap` den Strichfarbwert `markLate` (Fake-Kontext), bei `warn` `markWarn`, sonst `markFill`.
- AK-G7 `seaMapTip` enthält «Fahrzeit ≈ {t}, Rest {r}» genau einmal; bei `late` zusätzlich den Zusatz.
- AK-G8 Cache: ein Frame mit `farMark` und `seaMapKey` ruft `seaLanes` pro Welt höchstens einmal (injizierte Zählung, Muster AK-F2 von I-136).
- AK-G9 Sim unberührt: Replay-Hash/Baseline bitgleich, `tests/sim/balance.test.ts` unverändert, `SAVE_VERSION` unverändert (kein eigener Test, nur der Lauf).

Browser-Check (`qa-playtester`, Headless): AK-G10 Fernauftrag mit kleiner Restzeit und fehlender Ware: Marke zeigt «zu spät» in Bernstein, Hover nennt Fahrzeit und Rest; Ware per Schiff liefern oder Auftrag mit Lager erfüllbar machen → Marke wieder normal ohne Neuladen.

## Teil P2: I-148 «Wo war ich?»-Karte beim Fortsetzen

### Spielerzweck

Wer ein Spiel lädt (Fortsetzen oder Laden), sieht auf einen Blick, welche Fristen weiterlaufen und wie viele Probleme offen sind, und weiss, wo er wieder einsteigt. Das geladene Spiel bleibt pausiert (README «Ein geladenes Spiel pausiert»). Säule: Bedienung, Handel und Aufträge. Heute nennt nur ein Toast «Pausiert — P oder 1× setzt fort», die laufenden Fristen muss der Spieler an mehreren Stellen suchen.

Nicht dazu: kein Sprung per Klick (Tasten `.`/`,` springen schon, I-042; die Karte nennt nur den Weg), keine Aktion, keine Sim-Änderung, kein Eintrag im Spielstand, keine neue Einstellung, keine Karte beim neuen Spiel («Los geht's»/«Neue Insel»), keine Zeitreise («Seit dem Speichern…»), keine Krisen-/Sturm- oder Ratsbeschluss-Zeilen (spätere Idee).

### Regeln

1. **Auslöser:** am Ende von `loadSlotPaused` in `src/ui/app.ts` (Startkarte «Fortsetzen», Startkarte «Gespeichertes Spiel laden» und Menü «Laden» gehen alle dort durch), nach `restart` und nach der Meldung des Alt-Stand-Hinweises. Kein Aufruf aus `restart` allgemein, sonst erschiene die Karte beim neuen Spiel.
2. **Inhalt:** `resumeCardView(world)` (DOM-frei, `src/ui/resumeCard.ts`, liest nur die Welt) liefert Titel «Wo war ich?», Zeile «Spielzeit {formatClock(tick)} · pausiert», die Fristzeilen aufsteigend nach Restzeit und die Problemzeile. Fristzeilen, jede nur wenn der Zustand besteht:
   - Zufallsauftrag (`world.order` ohne `island`): «Auftrag {n} {Gut} · {Prämie} · noch {t}».
   - Fernauftrag (`world.order` mit `island`): vorhandener Text `farOrderText` plus « · zu spät» bei `farLate` (P1; nur bei P1 zuvor oder gemeinsam geliefert).
   - Fernangebot (`world.farOffer`, kein Fernauftrag): «Fernangebot {Insel}: {n} {Gut} · Frist {t}».
   - Stammkunde (`world.contract`): «Stammkunde {Gut}: nächste Lieferung in {t}» (`nextSettleTick − tick`), mit « · Lager reicht nicht» wenn Lager der Vertrags-Insel < Menge.
   - Auflage (`world.trial.active`): «Auflage {Name}: noch {t}» (`TRIAL_DURATION_TICKS − trial.ticks`).
     Zeit immer `formatGameTime`, wie im restlichen HUD.
3. **Probleme:** «{n} Probleme offen — `.` springt hin» bzw. `NO_PROBLEM_TEXT` («Alles versorgt, kein Problem offen») bei 0, `n = problemList(world, HOME).length` (einmal beim Öffnen gerechnet, nicht je Frame).
4. **Erscheinen:** nur wenn mindestens eine Fristzeile besteht oder `n ≥ 1`; sonst stumm (Toast genügt). Kein Eintrag, wenn eine Funktion gesperrt ist (`functionLock`): die Zeile fehlt dann, weil der Zustand (Auftrag, Vertrag, Auflage) im Spielstand nicht besteht.
5. **Bedienung:** Modal über `openModal` (`src/ui/modal.ts`): Esc, Klick auf den Hintergrund und Knopf «Weiter» schliessen; Fokus zurück an den Body. Schliessen setzt **kein** Tempo (Spiel bleibt pausiert, Pause-Overlay erscheint danach wieder, `pauseOverlayView` blendet es nur bei offenem Modal aus). Ein zweites Laden ersetzt die Karte (`closeAllModals` vor dem Öffnen).
6. **Kein Dauerschreiben:** die Karte wird einmal gebaut und nie aktualisiert (Momentaufnahme beim Laden, Spiel pausiert).

### Abnahmekriterien

Vitest (`tests/ui/resumeCard.test.ts`, `tests/ui/app*.test.ts` soweit der Lade-Pfad testbar ist):

- AK-G11 `resumeCardView` einer frischen Welt (kein Auftrag, kein Vertrag, kein Problem) → `null` (kein Erscheinen).
- AK-G12 Jede Fristzeile einzeln: Zufallsauftrag, Fernauftrag, Fernangebot, Stammkunde, Auflage; Text enthält die Restzeit nach `formatGameTime` und die Zählung stimmt (`due − tick`, `nextSettleTick − tick`, `TRIAL_DURATION_TICKS − trial.ticks`).
- AK-G13 Mehrere Fristen: Reihenfolge aufsteigend nach Restzeit; bei gleicher Restzeit stabile Reihenfolge (Auftrag, Fernauftrag, Fernangebot, Stammkunde, Auflage).
- AK-G14 Fernauftrag mit `farLate` wahr trägt « · zu spät»; ohne Ware-Mangel nicht.
- AK-G15 Stammkunde: Lager < Menge → « · Lager reicht nicht»; Lager ≥ Menge → ohne.
- AK-G16 Problemzeile: 0 Probleme → `NO_PROBLEM_TEXT`; n ≥ 1 → «{n} Probleme offen …»; Singular «1 Problem offen» bei n = 1.
- AK-G17 Reine Lesefunktion: `resumeCardView` mutiert die Welt nicht (Welt vorher/nachher `serialize`-gleich) und ruft `problemList` einmal.
- AK-G18 Sim unberührt: Replay-Hash/Baseline bitgleich, `tests/sim/balance.test.ts` unverändert, `SAVE_VERSION` unverändert.

Browser-Check (`qa-playtester`, Headless): AK-G19 Spiel mit laufendem Fernauftrag, Stammkunde und einem offenen Problem speichern, Seite neu laden, «Fortsetzen»: Karte «Wo war ich?» erscheint mit den Zeilen; Esc schliesst, Spiel bleibt pausiert (Pause-Overlay sichtbar, Tick läuft nicht weiter); P setzt fort. AK-G20 Neues Spiel («Los geht's», «Neue Insel») zeigt die Karte nicht. AK-G21 Laden aus dem Menü zeigt sie ebenfalls; ein Spielstand ohne Fristen und Probleme zeigt sie nicht.

## Zuschnitt, Dateien, Konflikte

P1 (tech-ui-engineer): `src/ui/farOrder.ts` (`farLate`, `farMark`), `src/ui/seaMapView.ts` (Key, Tip), `src/render/seaMap.ts` (`MapMark`, `COLORS.markLate`, Zeichner), Tests `tests/ui/farOrder.test.ts`, `tests/ui/seaMapView.test.ts`, `tests/render/seaMap*.test.ts`. P2 (tech-ui-engineer): neu `src/ui/resumeCard.ts`, `src/ui/app.ts` (ein Aufruf in `loadSlotPaused`), `src/style.css` (ein Block), Test `tests/ui/resumeCard.test.ts`. P2 liest `farLate` von P1: P1 vor P2 oder in einem Worktree nacheinander; die übrigen Dateien sind disjunkt. Kein `src/sim/`, kein `src/audio/`, kein Save. Konflikte mit laufenden Strängen: **Stadtplanung** berührt `src/ui/app.ts` (T08) und `src/style.css`: Merge-Reihenfolge klären, kleine Hunks; **ORT-A** berührt nur `src/render/roadside.ts`, `roadShape.ts`, `ortsrand.ts`, keine Überschneidung mit `seaMap.ts`. Testsperre durch ORT-A belegt: Tests laufen erst bei freier Sperre.

## Selbstprüfung (Gate Brainstorming)

| Frage               | Befund                                                                                                                                                                             |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Säule               | P1 Wirtschaft, Steuern und Handel (Fernhandel planen); P2 Bedienung/Handel. Bei Fehlschlag bleibt das Spiel gleich, nur die Information fehlt.                                     |
| Echte Wahl          | P1: Auftrag fallen lassen oder anderen Weg suchen; Information, keine neue Option. Keine dominante Strategie, kein Zwang. P2: reine Lesefunktion.                                  |
| Rückkopplung        | Keine neue. P1 verkürzt Fehlentscheide; P2 verkürzt den Wiedereinstieg.                                                                                                            |
| Randfälle           | Keine Lane, Ware schon unterwegs, Lager reicht, kein Kontor, abgelaufene Frist, leerer Spielstand, Neues Spiel, zweites Laden, gesperrte Funktion benannt.                         |
| Einfachere Variante | P1 nur mit `Rest < Fahrzeit` (ohne Lagerprüfung) wäre kleiner, warnt aber falsch bei vollem Fern-Lager; die Lagerprüfung ist eine Zeile. P2 ohne Fristzeilen wäre bloss der Toast. |
