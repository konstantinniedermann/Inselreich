# I-108 · Kopfzeile zeigt Einnahmen und Unterhalt getrennt (Kurzdesign, Stufe leicht)

Stand: 2026-10-16 · Paket design-I-108 · Meilenstein M14 · Bezug: R653, R676, `docs/ideen.md` I-108 · Kein Save, kein neuer Spielwert, kein `src/sim/`.

## Spielerzweck (ein Satz)

Der Spieler liest in der Kopfzeile «+540 / −780» statt nur «−240», sieht sofort, ob die Einnahmen zu schwach oder der Unterhalt zu hoch ist, und öffnet per Klick die Unterhaltskarte (Säule: Wirtschaft über Steuern und Handel).

## Ist-Stand

`balanceView(world)` (`src/ui/hud.ts`) zeigt den Chip `Bilanz ±N / min` aus `balanceText(stats)`; Steuern und Unterhalt stehen nur im Tooltip (`balanceTooltip`). Der Chip ist ein Knopf (Betriebsliste, I-062), Klasse `negative` bei `taxes − upkeep < 0`, Aktualisierung gedrosselt über `balanceDue`.

## Entwurf

- Chip-Text (sichtbar): `+{Einnahmen} / −{Unterhalt}` je Minute, z. B. `+540 / −780`. Waage-Symbol bleibt. Die Netto-Bilanz steht nicht mehr im Chip, sondern an erster Stelle im Tooltip («Bilanz −240 / min · Steuern +540 / min · Unterhalt −780 / min») und im `aria-label`.
- Farbe: Einnahmen-Teil neutral, Unterhalt-Teil neutral; die Klasse `negative` am Chip bleibt (Netto < 0) und färbt wie bisher. Kein Farbpaar als einziger Träger: Vorzeichen +/− tragen die Information.
- Klick/Enter/Leertaste öffnen unverändert die Betriebsliste nach Unterhalt (I-062).
- Zahlen: ganze Zahlen je Minute wie bisher (`perMinute(x, UPKEEP_INTERVAL)`); ab 10 000 Kurzform `12,3k` je Teil (reiner Helfer), Tooltip behält die volle Zahl.
- Datenquelle: nur `world.stats.taxes` und `world.stats.upkeep`; es entsteht kein neuer Zustand.

Verworfen: Netto zusätzlich im Chip («+540 / −780 = −240»): zu breit neben den Gut-Chips (I-109). Zwei getrennte Chips: belegen zwei Plätze, ohne Gewinn.

## Abnahmekriterien

Reine Helfer in `src/ui/hud.ts` (oder neuem `src/ui/balanceFlow.ts`), Vitest in `tests/ui/`:

1. `flowText({taxes, upkeep})` liefert `+{E} / −{U}` je Minute (typografisches Minus U+2212), z. B. taxes/upkeep so, dass `+540 / −780`.
2. Unterhalt 0: `+540 / −0`; Einnahmen 0 (keine Amtsstube): `+0 / −780`; beide 0: `+0 / −0`. Nie `NaN`, nie `-0`.
3. Teile ≥ 10 000 werden zu `12,3k` gekürzt (ab 10 000, eine Nachkommastelle, abgeschnitten nicht gerundet über die Grenze); < 10 000 bleibt die ganze Zahl. Jeder Teil höchstens 6 Zeichen, der Chip-Text höchstens 17 Zeichen (R683, Maximum `+999,9k / −999,9k`) bis 999 999.
4. `balanceTooltip` beginnt mit der Netto-Bilanz (`Bilanz −240 / min`), nennt danach Steuern und Unterhalt mit vollen Zahlen und behält die Zeile «Steuer: … (keine Amtsstube)», wenn keine Amtsstube aktiv ist.
5. `balanceView(world).label` (aria-label) enthält Netto, Einnahmen und Unterhalt in Klartext.
6. Negative Bilanz (Unterhalt > Einnahmen): `negative`-Klasse gesetzt; bei Netto ≥ 0 entfernt. Chip-Text ändert sich dadurch nicht.
7. Das Ergebnis hängt nur von `stats`, nicht von Tempo oder Pause: gleicher `stats`-Stand liefert bei Pause, 1× und 4× denselben Text (Test mit gleichem Eingang; kein Zugriff auf die Spielgeschwindigkeit im Helfer).
8. Drosselung: `balanceDue` und sein Intervall bleiben unverändert; bestehende Tests dazu bleiben grün.
9. Klick auf den Chip öffnet weiter die Betriebsliste (bestehender Test bleibt grün).
10. Keine Änderung an `src/sim/`, an Save-Format, an `src/sim/defs/`; Balancing-Test unverändert grün.

Browser-Check bei 1280 px (qa-playtester, Screenshot `.studio/qa/<paket>/`):

11. Frühe Partie (wenige Chips) und späte Partie (alle vier Bevölkerungs-Chips, alle Gut-Chips mit Reichweite aus I-109, Geld, Steuerstufe, Tempo): Die Kopfzeile bricht nicht um, kein Chip wird abgeschnitten, der Bilanz-Chip bleibt vollständig lesbar.
12. Bei breiter Zahl (`12,3k / −9,8k`) bleibt die Kopfzeile bei 1280 px einzeilig; ist die Zeile voll, verdrängt der Bilanz-Chip keinen Gut-Chip (Reichweite bleibt sichtbar).
13. Tempo 4× und Pause: Anzeige springt nicht unruhig (höchstens eine Aktualisierung je `balanceDue`-Intervall); in Pause bleibt der Wert stehen.
14. Tooltip erscheint bei Maus und Tastaturfokus; Fokusring sichtbar (bestehendes `focus-visible`).

## Randfälle

Negative Bilanz (Standardfall im Mangel, `negative`), Amtsstube fehlt (Einnahmen 0), Pause und 4× (stats unverändert, kein Mehraufwand), sehr grosse Zahlen (Kurzform, Tooltip voll), Spielstand laden (stats aus der Welt; erste Anzeige sofort, da `balanceDue` mit `-Infinity` startet).

## Nicht dazugehört

Verlaufsgrafik, Trendpfeil für Geld, Aufschlüsselung je Gebäude (liegt in der Unterhaltskarte, I-089/I-067), neue Spielwerte, Save-Änderung, neue Chips.

## Überschneidung mit laufendem UI-HAEPPCHEN-E

Berührte Dateien: `src/ui/hud.ts` (Helfer, `balanceView`, `balanceTooltip`), `src/style.css` (Breite von `.hud-balance`, evtl. `white-space: nowrap`), Tests unter `tests/ui/`. UI-HAEPPCHEN-E ändert `app.ts`, `style.css`, `hud.ts`: Überschneidung in `style.css` und `hud.ts`. Empfehlung an lead-tech: I-108 nach dem Merge von UI-HAEPPCHEN-E umsetzen (oder im selben Branch bündeln); der neue Helfer in eigener Datei `src/ui/balanceFlow.ts` hält den Konfliktbereich in `hud.ts` auf wenige Zeilen.

## Aufwand

S, etwa 60 Tools (Idee: ≈ 60). Selbstprüfung Gate Brainstorming: Säule gestärkt, keine Wahl nötig (reine Anzeige), keine Rückkopplung, Randfälle genannt, einfachere Variante (nur Tooltip) bereits Ist-Stand und löst das Problem nicht. OK.
