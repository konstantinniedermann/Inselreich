# T06 — Präparierter Spielstand und Browser-Check (AK-SK-29)

Paket I047-UI. Zwei Schritte: (A) `tech-ui-engineer` (Fortsetzung nach T05) erzeugt den Stand; (B) `qa-playtester`
prüft im Browser. Ablage `.studio/qa/i047-ui/`. Schätzung (A) ≈ 6 Tools, (B) ≈ 30 Tools.

## (A) Stand erzeugen — Schreibpfad in `tests/sim/save-contract.test.ts`

Nur hinter `SCENARIO_OUT` (sonst übersprungen, kostet im normalen Lauf nichts; Muster
`tests/sim/scenario-saves.test.ts:898`):

- [ ] `it.skipIf(!process.env.SCENARIO_OUT)('schreibt i047-stammkunde.json (AK-SK-29)', …)`:
  1. `w = createWorld(3)`; `{ layout, t } = startColony(w)`; `runColony(w, layout, t, {}, (x) => maxHouseTier(x) >= 3)`.
  2. Schritte bis zum nächsten Periodenbeginn `T` (`step` bis `(w.tick − ORDER_FIRST_TICK) % ORDER_PERIOD === 0`).
  3. `k = (T − ORDER_FIRST_TICK) / ORDER_PERIOD`; Auftrag setzen: `w.order = { period: k, good: 'rum', amount: 8,`
     `reward: 8 * orderUnitReward('rum'), due: T + ORDER_DURATION }`; `home(w).stock.rum = 12`;
     `contract`/`contractOffer` bleiben `null`. Zusätzlich lange Krise: `w.crisis = { period: k, kind: 'boom', from: T,
until: T + 99999, good: 'wood' }` (Feldnamen am Typ `Crisis` prüfen; Gut ≠ Rum).
  4. Prüfen: `functionLock(w, 'orders') === null`, `maxHouseTier(w) >= 3`, `home(w).kontorId !== null`,
     `deserialize(serialize(w)).ok`, `w.version === SAVE_VERSION`.
  5. `writeFileSync(join(out, 'i047-stammkunde.json'), serialize(w))`.
- [ ] Lauf: `mkdir -p .studio/qa/i047-ui && SCENARIO_OUT=.studio/qa/i047-ui npx vitest run
tests/sim/save-contract.test.ts -t "i047-stammkunde"; echo EXIT=$?` → `EXIT=0`, Datei vorhanden.
- [ ] Ohne `SCENARIO_OUT`: derselbe Lauf meldet den Test als übersprungen.
- [ ] Commit `test: präparierter Stand für den Stammkunde-Browser-Check (AK-SK-29)`.

## (B) Browser-Check (qa-playtester, Dev-Build `make dev`)

Laden: Inhalt der Datei in `localStorage['inselreich.save.v1']`, dann Menü «Laden». Zeit per Tempo-Taste oder Warten;
Klang über `window.__inselDev.contractSounds()` (Dev-Sonde aus T05), nicht nach Gehör. Je Zustand ein Screenshot bei
**1280×720** und **1920×1080**, Namen `<nn>-<zustand>-<breite>x<höhe>.png`.

- [ ] 01 Auftragskarte zeigt «Auftrag: 8 Rum …»; **Liefern** → Meldung «Auftrag geliefert …», Karte zeigt «Stammkunde:
      5 Rum alle 1:30 zu 27 je Stück · Angebot noch m:ss» mit **Annehmen**/**Ablehnen**; Countdown läuft.
- [ ] 02 **Annehmen** → Meldung «Stammkunde: 5 Rum alle 1:30 vereinbart», Karte «Stammkunde: 5 Rum · nächste
      Lieferung m:ss · Lager 4/5» (12 − 8 = 4, also Warnfarbe sichtbar) und Knopf **Kündigen**.
- [ ] 03 Rum auf **≥ 10** bringen (Puffer gegen Verbrauch bis zum Periodenbeginn, R589 6) (Kontor «Kaufen» 1–2 Rum), Warnfarbe weg; am nächsten Periodenbeginn Meldung «Stammkunde:
      5 Rum geliefert, +135»; `contractSounds()` endet mit `'orderDone'`.
- [ ] 04 Rum am Kontor auf 0 verkaufen → Warnfarbe; am nächsten Periodenbeginn Warnmeldung «Stammkunde abgesprungen: zu
      wenig Rum. Strafe 135», `contractSounds()` endet mit `'error'`; danach Auftragskarte mit Zufallsauftrag (Meldung
      «Neuer Auftrag …»).
- [ ] 05 Neuen Auftrag liefern (bei Bedarf Ware kaufen), erneut **Annehmen**, dann **Kündigen** → «Stammkunde
      gekündigt», Karte «Nächster Auftrag in m:ss».
- [ ] 06 Bei 1280×720 überlappt die Auftragskarte (mit drei Zeilen und zwei Knöpfen) die Krisenkarte nicht.
      **Reproduzierbar (R589 1):** der präparierte Stand (A) trägt eine lange Krise (Boom auf ein anderes Gut als Rum, `until` weit in der Zukunft), damit die Krisenkarte in den Zuständen 01 und 02 sichtbar ist; beide Rechtecke per
      `getBoundingClientRect` messen (kein Überlappen), Werte in den Report. Konsole ohne Fehler.
- [ ] Schritt 03 vor 04 nötig, weil 02 mit Lager 4/5 startet; ist kein Rum kaufbar, Bestand über
      `__inselDev.world().islands[0].stock.rum` setzen und im Report vermerken.
- [ ] Playtest-Report als Schlussbericht: je Schritt OK/Befund mit Screenshot-Pfad, Urteil OK/BEDENKEN/ZURÜCK.
      Zusätzlich Beobachtung zur Balance-Prüfung aus Spec B.5 (Vertrag dauerhaft attraktiver als Aufträge?) als Satz.
