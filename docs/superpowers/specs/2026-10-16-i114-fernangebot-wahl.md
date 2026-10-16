# I-114 «Fernangebot zur Wahl» (Kurzdesign, Stufe leicht)

Stand 2026-10-16 · Paket design-I-114 · Quelle: I-114 (IDEEN-11, R692), Handel 2 (`2026-10-14-handel-2-fernangebot.md`, R1–R15) · Save: **nein** (Variante A) · neuer Spielwert: nein · Sim-Änderung: eine Lesefunktion, ein optionaler Parameter

## Spielerzweck

Der Spieler sieht ab zwei Fremdkontoren zwei Fernkarten, etwa «Möweninsel: 20 Stoff · 440» und «Felsbucht: 15 Rum · 450», und nimmt die mit dem volleren Lager oder der kürzeren Fahrt. Säule: Wirtschaft, Steuern und Handel. Kurze Schleife: Lager und Schiff gegen die zwei Karten abwägen; Ziel-Belohnung: die gewählte Lieferung kommt pünktlich an. Heute gilt «nimm, was kommt» (Rotation `e[k mod n]`, R2).

## Regeln

1. **Zweitangebot ist abgeleitet, nicht gespeichert.** Neue reine Lesefunktion `farAlternative(world): FarOffer | null` in `src/sim/orders.ts`. Sie liefert die Insel `e[(k + 1) mod n]` mit `e = farEligible(world)`, `n = e.length`, `k = world.order.period`, Gut `farGood`, Menge `GOODS[g].order.far`, Prämie `Menge × orderUnitReward(g)` (dieselbe Formel wie `offerFarOrder`). Kein Zufall, kein Weltzugriff ausser Lesen (ADR-010, R13).
2. **Wann `null`.** `world.farOffer === null` (also bei Vertrag, Sperre, Fernauftrag, ohne Auftrag) · `n < 2` · berechnete Insel gleich `farOffer.island` (Kontorlage hat sich seit dem Angebot verschoben). Dann zeigt die UI genau eine Karte, wie heute (Ein-Kontor-Fall bitgleich).
3. **Annehmen mit Wahl.** `acceptFarOrder(world, pick: 0 | 1 = 0): Result`. `pick = 0` ist das gespeicherte `farOffer`, Verhalten unverändert (alle Handel-2-Tests bleiben grün). `pick = 1` nimmt `farAlternative(world)`; ist sie `null`, `fail('Kein zweites Angebot')`. Alle übrigen Prüfungen (Sperre, Vertrag, Kontor auf der gewählten Insel, Auftrag) und alle Folgen (Ersatz des Zufallsauftrags, Frist `FAR_ORDER_DURATION`, `farOffer = null`, `farSkip = period + 1`) wie R5/R7. Höchstens eines annehmbar.
4. **Unverändert.** Menge, Prämie, Frist 2:50, Sperre der Folgeperiode, Verfall ohne Strafe (R8), Vertragsangebot nach Lieferung (R9), `PREFER_PCT` ungelesen (R10).
5. **Anzeige.** Zwei Fernkarten im Format `farOfferText` (Insel, Menge Gut · Prämie · Frist · Lager `x/y` der jeweiligen Insel), je mit eigenem «Annehmen»; Tooltip je Karte wie `farAcceptTooltip` für ihre Insel. Gut ohne Lager fällt nicht aus (Wahl bleibt, Lager rot ist Information). Platz im Kartenstapel bei 1280 px: Browser-Check (UI-Mass entscheidet Tech, Fallback: die zweite Karte kompakt unter der ersten).
6. **Fahrzeit** ist kein Sim-Wert; die Wahl stützt sich auf Lager und die ohnehin sichtbare Lage (I-101-Marke). Keine neue Entfernungsangabe.

## Abgrenzung

Nicht dazugehörig: dritte Karte, Ablehnen/Neu-Würfeln, Tausch nach dem Annehmen (I-093 verworfen), Prämienaufschlag für die weitere Fahrt, Gunst je Insel (I-116, bis I-114 live geparkt), Vorschau der Inseln (I-102 Ziffer 7).

## Entartung und Wahl

- **Dominanz:** beide Prämien sind `far × orderUnitReward(g)`; sie unterscheiden sich nur über das Gut. Liegt die höhere Prämie auf der Insel mit leerem Lager, gewinnt nicht automatisch die höhere Karte: echte Wahl zwischen Prämie, Lagerstand und Fahrt. Haben beide Karten dasselbe Gut (zwei Inseln gleicher Art), unterscheiden sie nur Lager und Fahrt, ebenfalls Wahl.
- **Kein Mehrverdienst pro Periode:** weiter höchstens ein Fernauftrag, Folgeperiode gesperrt. Balancing: Erwartungswert steigt höchstens um die Differenz zur besseren der zwei Karten (Grössenordnung ≤ 10 % einer Fernprämie, ca. 450); Balancing-Test und Baseline unberührt, weil die Controller-Baseline nie annimmt (zu prüfen AK-9).
- **Drift:** Gründet oder verliert der Spieler im Angebotsfenster ein Kontor, verschiebt sich `e`; die Zweitkarte kann wechseln oder verschwinden, das gespeicherte Erstangebot nie. Das ist sichtbar (Refresh) und harmlos (Wahl, keine Strafe).
- Abriss des Ziel-Kontors: Annehmen scheitert mit Kontor-Fehler wie R5. Leeres Lager: Annahme erlaubt, Lieferung scheitert wie heute.

## Varianten

| Var | Inhalt                                                       | Save                                                | Urteil                              |
| --- | ------------------------------------------------------------ | --------------------------------------------------- | ----------------------------------- |
| A   | Zweitangebot abgeleitet (oben)                               | nein                                                | **Empfehlung**                      |
| B   | `farOffer2` gespeichert, nur beim Periodenbeginn eingefroren | ja (Version +1, Migration, `foldBack`, Validierung) | kein Mehrwert ausser Drift-Freiheit |
| C   | Nur Anzeige beider Inseln, Annehmen bleibt `farOffer`        | nein                                                | keine Wahl, verworfen               |

## Save-Urteil

**Stufe leicht reicht, kein Save-Wechsel (Variante A).** `FarOffer`/`farOffer`/`farSkip` bleiben, `types.ts` und `defs/` ohne Diff, Version unverändert. Stufe voll nur, wenn L0 Variante B (Drift-Freiheit) will.

## Abnahmekriterien

| ID    | Prüfung                                                                                                                                                               | Art                                       |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| AK-1  | Zwei wählbare Inseln, Fernangebot offen: `farAlternative` liefert `e[(k+1) mod n]` mit Gut, Menge, Prämie nach Formel; Insel ungleich `farOffer.island`               | Vitest `tests/sim/orders.test.ts`         |
| AK-2  | Ein wählbares Kontor, kein Angebot, Vertrag, Sperre, Fernauftrag: `farAlternative === null`                                                                           | Vitest                                    |
| AK-3  | `farAlternative` zustandsfrei: `JSON.stringify(world)` vor und nach Aufruf gleich                                                                                     | Vitest                                    |
| AK-4  | `acceptFarOrder(world)` und `acceptFarOrder(world, 0)` bitgleich zum bisherigen Verhalten (alle Handel-2-Tests grün)                                                  | Vitest                                    |
| AK-5  | `acceptFarOrder(world, 1)`: Auftrag mit Insel, Gut, Menge, Prämie der Zweitkarte, `due`, `farOffer === null`, `farSkip === period + 1`                                | Vitest                                    |
| AK-6  | `pick = 1` ohne Zweitangebot: `{ ok: false, reason: 'Kein zweites Angebot' }`, Welt unverändert; bei Zweitkarte ohne Kontor (Abriss): Kontor-Fehler, Welt unverändert | Vitest                                    |
| AK-7  | Kontor gegründet nach dem Angebot, `e` verschoben: Erstangebot bleibt gleich, Zweitkarte folgt `e`, nie gleich der Erstinsel                                          | Vitest                                    |
| AK-8  | Determinismus: gleicher Seed, gleiche Eingaben, `pick` 0 vs 1 reproduzierbar; kein RNG-Zug in `farAlternative`                                                        | Vitest                                    |
| AK-9  | Save: Version unverändert, Spielstand mit offenem Fernangebot lädt, Rundreise gleich; Balancing-Test und Baseline (Seed 3, ohne Fremdkontor) bitgleich                | Vitest                                    |
| AK-10 | UI: zwei Karten mit je eigenem Annehmen ab zwei Kontoren, eine Karte bei einem; Textformat wie `farOfferText`; Tooltip je Insel                                       | Vitest `tests/ui/` (reine Textfunktionen) |
| AK-11 | Browser 1280 px: Auftrags- plus zwei Fernkarten ohne Überlappung mit Nachbarkarten; Annehmen der Zweitkarte setzt Fernauftrag der Zweitinsel                          | Browser-Check                             |

## Grösse und Folgen

S, ca. 1 Sim-Paket plus 1 UI-Paket (`src/ui/farOrder.ts`, `hud.ts`, `app.ts`, `style.css`); README-Spielanleitung und `docs/spielwerte.md` «Fernangebot» um zwei Sätze ergänzen. Überschneidung `hud.ts`/`style.css` mit laufenden UI-Häppchen: Plan lead-tech ordnet.
