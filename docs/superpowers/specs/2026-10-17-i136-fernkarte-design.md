# I-136 «Fernkarte mit Fahrzeit und roter Lagerzahl» (Kurzdesign, Stufe leicht)

Stand 2026-10-17 · Paket design-I-136 · Quelle: R776, I-136 (IDEEN-13), `docs/superpowers/specs/2026-10-16-i114-fernangebot-wahl.md` (Spielerwirkung «kürzere Fahrt», Regel 6), `docs/beobachtungen.md` «10-16 · I-114: Lagerzahl der Fernkarte ohne Rotfärbung bei Mangel» · Grösse S (≈ 40 Tools) · Save: nein · Baseline/Balancing: unberührt · Spielwert: keiner neu · Assets: keine

## Spielerzweck

Auf beiden Fernkarten sieht der Spieler «≈ 27 s Fahrt» und eine rote Lagerzahl, wenn das Gut auf der Fern-Insel fehlt, und wählt nach Fahrzeit, Prämie und Lager statt zu raten. Säule: Wirtschaft, Steuern und Handel (Handelsrouten planen). Heute nennt die Spielerwirkung von I-114 «kürzere Fahrt», die Karte zeigt aber keine Fahrzeit: `farOfferText` (`src/ui/farOrder.ts:34-42`) liefert «Fernangebot X: n Gut · Prämie · Frist · Lager s/n», die Lagerzahl ist ungefärbt.

Nicht dazu: keine Sim-Änderung, keine Fahrzeit auf Seekarten-Marken (`farMark`, I-101) und im Fernauftrag (`farOrderText`; Beipack-Kandidat, gleiche Teilung), keine Navigation per Klick (I-124), keine Schiffs-Zuordnung oder Ankunftsprognose eines bestimmten Schiffs, kein Ton.

## Kernfrage: S oder M? Antwort S

Die Fahrzeit ist vorhandene Mathematik, keine Schätzung: `depart` setzt `ship.left = laneTicks(world.islands, ship.port, to)` (`src/sim/ships.ts:142-145`); `laneTicks` (`src/sim/islands.ts:75-82`) = `travelTicks(lane.d)` = `SHIP_TICKS_PER_SEA_TILE (10, src/sim/defs/sea.ts:94) * d` mit `d` = aufgerundete Seeweglänge `seaLanes` (`islands.ts:351-360`). Die Anzeige `Fahrzeit 0:27` der Inselkarte (`src/ui/islandCard.ts:69-78`) nutzt dieselbe Grösse. Das Schiff hat keine Ladezeit (`handleDocked` lädt und fährt im selben Tick ab, `ships.ts:179-201`), Tempo ist konstant. Die Fahrzeit einer Einzelfahrt Heimat → Fern-Insel ist daher **exakt**; «≈» gilt nur, weil das Schiff vorher zur Heimat kommen und der Spieler es erst losschicken muss (Tooltip nennt das). Keine neue Sim-Logik, keine neue Konstante.

**Befund (Leistung):** `seaLanes` rechnet je Aufruf `seaLength` für alle Inselpaare. `updateNoticeStack` läuft je Frame (`src/ui/hud.ts:~619-640`). `islandCard` löst das mit `WeakMap<World, Lane[]>` (`islandCard.ts:~80-90`). Die neue Fahrzeit-Funktion muss denselben Cache nutzen (gemeinsamer Helfer), nie `laneTicks` je Frame aufrufen.

## Regeln

1. **Fahrzeit-Helfer.** Neu in `src/ui/` (DOM-frei, liest nur die Welt): `homeTravelTicks(world, island): number | null`; `null`, wenn `island === HOME`, die Insel fehlt oder keine Lane Heimat–Insel existiert. Der Lane-Cache (`WeakMap<World, Lane[]>`) wird aus `islandCard.ts` in diesen Helfer verschoben, `islandCard` nutzt ihn mit; Ergebnis `travelTicks(lane.d)`. Kein neuer Wert in `defs/`.
2. **Teile statt String.** Neu `farOfferParts(world, which): { head, travel, stock, short } | null` in `src/ui/farOrder.ts` (Muster `farOfferOf`); `farOfferText` setzt die Teile zusammen und bleibt zeichengleich zur Vorgänger-Form plus Fahrzeit-Segment (Tests dürfen `textContent === farOfferText` weiter vergleichen, `tests/ui/hud.test.ts:593`).
3. **Text.** Reihenfolge: `Fernangebot {Insel}: {n} {Gut} · {Prämie} · Frist {t} · ≈ {Fahrzeit} Fahrt · Lager {s}/{n}`; Fahrzeit mit `formatGameTime(travelTicks)` (gleiche Zeitform wie «Frist»). `travel` entfällt samt « · », wenn `homeTravelTicks` `null` ist (kein «–», es gibt nichts zu zeigen).
4. **Rot.** `short = stock < amount` (Lager der Fern-Insel, wie heute `stockOn`). Der Lager-Teil sitzt in einem eigenen `<span data-field="far-stock[-2]">`; bei `short` trägt er die Klasse `far-stock--low` (`color: var(--signal-red)`, `src/style.css` neben `.notice-stack .far-card`, ~Zeile 947-970). Nicht allein Farbe: die Zahl «3/12» bleibt sichtbar; der Tooltip des Spans nennt «Fehlt {n−s} {Gut}».
5. **Tooltip Fahrzeit.** Auf der Karte (Text-Span) Zusatz: «Fahrzeit einer Einzelfahrt von der Heimat; ein Schiff muss erst bereitstehen.» Der Annehmen-Tooltip `farAcceptTooltip` bleibt unverändert.
6. **Beide Karten gleich.** Gilt für Karte 0 und Karte 1 (`which`); Felder tragen `-2` (Muster `farCard`, `hud.ts:602-622`).
7. **Zustand.** `updateFarCard` setzt Klasse und Texte nur bei Änderung (kein Flackern, kein DOM-Schreiben je Frame ohne Differenz, wie `setField`).

## Abnahmekriterien

Vitest (`tests/ui/farOrder.test.ts`, `tests/ui/farChoice.test.ts`, `tests/ui/hud.test.ts`):

- AK-F1 `homeTravelTicks`: Welt mit Fremdinsel d=25 → 250; entspricht `laneTicks(world.islands, 0, i)` (Gleichheit für alle Fremdinseln); `island === 0` → `null`; unbekannte Insel → `null`.
- AK-F2 Cache: zwei Aufrufe derselben Welt rufen `seaLanes` einmal (Spion/Zähler); eine andere Welt rechnet neu.
- AK-F3 `farOfferText(world, 0|1)` enthält `≈ {formatGameTime(travelTicks)} Fahrt` genau einmal, zwischen «Frist» und «Lager»; beide Karten zeigen die Fahrzeit ihrer eigenen Insel (zwei verschiedene Inseln → zwei verschiedene Werte, wenn `d` verschieden).
- AK-F4 Ohne Lane (`null`) entfällt das Segment, der Text sonst unverändert zur bisherigen Form.
- AK-F5 `farOfferParts.short`: Lager 3 / Menge 12 → `true`; 12/12 → `false`; 20/12 → `false`; Lager der **Fern-Insel** zählt, nicht das der Heimat.
- AK-F6 Bestehende Tests grün: `textContent` von `far-lead` plus `far-stock` = `farOfferText` (Zwei-Span-Prüfung, hud.test.ts um Zeile 593; der Container `far-text` hat genau diese zwei Kinder), Sichtbarkeit Karte 2 nur bei Wahl-Angebot (I-114).
- AK-F7 Sim unberührt: Replay-Hash/Baseline bitgleich, `tests/sim/balance.test.ts` unverändert, `SAVE_VERSION` unverändert (kein Test nötig ausser dem Lauf).

Browser-Check (`qa-playtester`, Headless):

- AK-F8 Zwei Fernkarten sichtbar: beide zeigen «≈ … Fahrt»; Insel mit grösserem Seeweg zeigt die längere Zeit; Wert stimmt mit «Fahrzeit» der Inselkarte (Bauen/Inselkarte) überein.
- AK-F9 Lager der Fern-Insel unter der Menge: Zahl rot (computed color = `--signal-red`); Ware per Schiff liefern: Zahl wird normal, ohne Neuladen.
- AK-F10 Kein Dauerschreiben (Vitest, `tests/ui/hud.test.ts`): zweiter `updateNoticeStack` mit unveränderter Welt schreibt weder Text noch Titel von `far-stock` und keinen Titel von `far-lead`. Browser: DOM-Beobachter auf `far-stock` (Text und `class`) meldet über 10 s keine Mutation; die tickende Fristzahl liegt im eigenen Span `far-lead` und ist ausgenommen (Plan I-136, P-2).

## Randfälle

Kein Schiff vorhanden: Fahrzeit steht trotzdem (Lane existiert), Tooltip nennt «ein Schiff muss erst bereitstehen». Nur ein Fremdkontor: eine Karte wie heute (I-114), mit Fahrzeit. Fern-Insel ohne Kontor: Lager 0/n (rot), Warnung `warn` der Seekarte bleibt (`farMark`). Laden/Neustart: Cache hängt am Weltobjekt, neue Welt rechnet neu. Spielgeschwindigkeit: Ticks, Anzeige in Spielzeit wie «Frist». Entartung: bei gleicher Prämie gewinnt die kürzere Fahrt; gewollt, Prämie unterscheidet sich je Gut/Menge (I-114).

## Selbstprüfung (Gate Brainstorming)

| Frage               | Befund                                                                                                                            |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Säule               | Wirtschaft, Steuern und Handel; leidet bei Fehlschlag nicht (Anzeige), nur die Wahl aus I-114 bliebe geraten.                     |
| Echte Wahl          | Ja: Fahrzeit, Prämie, Menge und Fern-Lager ziehen in verschiedene Richtungen; keine Option dominiert dauerhaft.                   |
| Rückkopplung        | Keine neue. Information verkürzt nur die Entscheidung; keine Wachstumsschleife.                                                   |
| Randfälle           | Kein Schiff, keine Lane, kein Kontor, zwei Karten, Laden, Frame-Kosten (Cache) benannt.                                           |
| Einfachere Variante | Nur Fahrzeit ohne Rot wäre kleiner, lässt aber den Beobachtungs-Eintrag offen; beide Teile teilen Datei und Test, daher zusammen. |

## Zuschnitt, Dateien, Konflikte

Ein Paket, S. Dateien: `src/ui/farOrder.ts`, `src/ui/hud.ts` (`farCard`, `updateFarCard`), `src/ui/islandCard.ts` (Cache auslagern), neuer Helfer in `src/ui/` (z. B. `homeTravel.ts`), `src/style.css` (ein Selektor), Tests `tests/ui/{farOrder,farChoice,hud}.test.ts`. Kein `src/sim/`, kein `src/render/`, kein `src/audio/`.

Konfliktprüfung: **ORT-A** (Spec `2026-10-16-ort-a-wege-und-kanten.md`, Dateien `src/render/roadside.ts`, `roadShape.ts`, `ortsrand.ts`) und **Stadtplanung** (Plan `plan/stadtplanung`, T00-T20: `src/ui/panelView.ts`, `app.ts`, `texts.ts`, `noiseTexts.ts`, `taxView.ts`, `inspect.ts`, `src/sim/…`, `src/render/planLayer.ts`, `renderer.ts`; per `rg` kein Treffer auf `hud.ts`, `farOrder.ts`, `islandCard.ts`, `style.css`; T06 nennt nur Tests `tests/sim/farOrder-save.test.ts` zum Save-Faltenwurf). Keine Überschneidung der Quelldateien; I-136 darf lastfrei parallel laufen. Rest-Risiko: `src/style.css` und `tests/ui/hud.test.ts` könnten bei späteren Stadtplanung-Tasks (T08 UI-Verdrahtung) berührt werden: Merge-Reihenfolge klären, kleine Hunks. Der Push-Sperre (R464) ist zu folgen: Umsetzung erst nach REL-27.
