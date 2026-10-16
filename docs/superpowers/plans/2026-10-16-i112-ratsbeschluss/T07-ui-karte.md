# T07 · Rats-Karte, Marke, Hinweis

`tech-ui-engineer` · ≈ 45 Tools · AK 14–16 (Code), 17 (Anzeige über `placementZone`, kein eigener Code) · blocked-by: T06 · Strang U

Dateien: `src/ui/councilCard.ts` (neu), `src/ui/hud.ts`, `src/ui/app.ts`, `index.html`, `src/style.css` (nur neue `.council-*`-Regeln).
Kein Modal (`modal.ts` nicht verwenden), keine Pause.

## Umsetzung

1. Kopfzeile (`hud.ts`): Marke `data-field="council-badge"` als Knopf; Text aus `councilBadge`, `hidden` bei `null`, Klasse
   `council-badge--active` bei `councilBadgeActive`. Schreiben nur bei Änderung (Muster `setField`). Kopfzeile bleibt einzeilig bei 1280 px.
2. Rats-Karte (`councilCard.ts`): Karte im bestehenden Karten-Stil (Card-UI, CSS Grid, zwei Spalten je Stufe), Inhalt aus `councilCards`;
   Klick auf eine Karte markiert die Seite (`aria-pressed`), erst der Knopf «Beschluss fassen» ruft `actions.decree(tier, side)`.
   Ohne Markierung ist der Knopf deaktiviert. `Esc` schliesst ohne Wahl (bestehender Esc-Weg in `app.ts` bzw. `input.ts`, Reihenfolge:
   offene Rats-Karte zuerst). Gefasste Beschlüsse als Liste unter den Karten. Die Karte überdeckt die Spielfläche nicht ganz; Spiel läuft weiter.
3. `app.ts`: Aktion `decree` analog `setEdict` (`r.ok` → Meldung «Beschluss gefasst: <Name>» und `sound.play('build')`, sonst
   `showError(friendlyReason(world, r.reason))`, dann `refresh()`). Klick auf die Marke und `Umschalt + R` öffnen/schliessen die Karte.
4. Hinweis: je Frame-Refresh `councilOpened(prevCouncil, world.council)`; für jede neue Stufe einmal `showMessage(COUNCIL_OPEN_MESSAGE)`;
   `prevCouncil` beim Laden und bei «Neue Insel» auf den geladenen Stand setzen (kein Hinweis für Altes).
5. Reichweitenkreis (AK 17): keine Änderung nötig, wenn Bau-Vorschau und Auswahl `placementZone`/`coverageSources` nutzen; T07 prüft das
   per `rg -n "placementZone|coverageSources" src/ui src/render` und meldet abweichende Leser an den Controller (dann T01-Nachtrag).

## Tests

DOM-Teile prüft T08 im Browser. Reine Logik liegt in T06. Wo `app.ts` eine neue reine Funktion braucht (z. B. Esc-Reihenfolge), in
`src/ui/council.ts` ablegen und in `tests/ui/council.test.ts` testen (rot belegen).

## Prüfschritte

Allgemeine Prüfungen laut Plan-Index · `npx vitest run tests/ui; echo EXIT=$?` · Strangende U: `make check; echo EXIT=$?` (Hintergrund, E-037) ·
kurzer Selbst-Check im Dev-Server (`make dev`) mit Bildschirmfoto in `.studio/qa/i112/t07-selbst.png`. Commit `feat: Rats-Karte und Marke (I-112)`.
