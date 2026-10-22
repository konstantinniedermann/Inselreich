# T03 Fernkarten-DOM, Rot-Klasse, Tooltips, Frame-Cache (AK-F2, AK-F5, AK-F6, AK-F10 Vitest)

Dateien: `src/ui/hud.ts` (nur `farCard`, `updateFarCard`), `src/style.css` (ein Selektor), `tests/ui/hud.test.ts` (nur Fernkarten-Block um Zeile 575-640), `tests/ui/homeTravelFrame.test.ts` (neu). Kleine Hunks (Konflikt Stadtplanung, Index). Blockiert von T02.

## Soll

- `farCard(actions, which)`: `far-text[-2]` (Container, bleibt `data-field`) mit Kindern `<span data-field="far-lead[-2]">` und `<span data-field="far-stock[-2]">`.
- `updateFarCard`: `p = farOfferParts(...)`; schreibt `far-lead.textContent = farOfferLead(p)`, `far-lead.title` = Fahrzeit-Tooltip («Fahrzeit einer Einzelfahrt von der Heimat; ein Schiff muss erst bereitstehen.») nur wenn `p.travel !== null`, `far-stock.textContent = p.stock`, `far-stock.title = p.tip`, `classList.toggle('far-stock--low', p.short)`; **jede** Zuweisung nur bei Differenz. Sichtbar-Logik der Karte unverändert (Karte 2 nur bei Wahl-Angebot).
- CSS: `.notice-stack .far-card .far-stock--low { color: var(--tone-bad); }`.

## Schritte (Tests zuerst, rot belegen)

- [ ] **hud.test.ts anpassen (AK-F6, Auflage 7):** Zeile ~595 vergleicht `far-lead.textContent + far-stock.textContent` mit `farOfferText(w)`; zusätzlich: Container hat genau diese zwei Kinder und kein weiteres Textfeld (`far-text.children.length === 2`), Kind-Reihenfolge lead, stock. Der Test der Karte 2 (`far-card-2`) prüft dasselbe mit `-2`.
- [ ] **Rot-Klasse (Regel 4/7, Auflage 4):** Fern-Lager 3 von 12: `far-stock` hat `classList.contains('far-stock--low')`, `title === 'Fehlt 9 {Gut}'` (Literal); danach `w.islands[i].stock[good] = 12`, `updateNoticeStack` → Klasse **weg** (Wechsel `short` → nicht `short`) und `title === ''`; beide Karten.
- [ ] **Randfälle:** Fern-Insel ohne Kontor → `Lager 0/n`, Klasse gesetzt; nur ein Fernangebot → Karte 2 versteckt, Karte 1 mit Fahrzeit im `far-lead`; Welt ohne Schiff → `far-lead` enthält «≈ » und «Fahrt».
- [ ] **AK-F10 Vitest:** nach erstem `updateNoticeStack` Setter zählen (`Object.defineProperty(el, 'textContent', { set })`, ebenso `title`) auf `far-stock` und `far-lead`; zweiter Aufruf mit unveränderter Welt: 0 Schreibzugriffe auf `far-stock`-Text/-Titel und auf `far-lead`-Titel (der `far-lead`-Text ändert sich nur mit der Frist).
- [ ] **AK-F2 Frame-Pfad (Auflage 2):** neue Datei `tests/ui/homeTravelFrame.test.ts` mit `vi.mock('../../src/sim/islands', async (orig) => ({ ...(await orig()), seaLanes: vi.fn((await orig()).seaLanes) }))` (nur in dieser Datei, hoisted); Welt bauen, `seaLanes.mockClear()`, `renderNoticeStack` und `updateNoticeStack` fünfmal mit derselben Welt → `seaLanes` genau **1**-mal; neue Welt → +1. Rot: ohne Cache wäre die Zahl > 1.
- [ ] Umsetzen, grün: `npx vitest run tests/ui/hud.test.ts tests/ui/farOrder.test.ts tests/ui/farChoice.test.ts tests/ui/homeTravel.test.ts tests/ui/homeTravelFrame.test.ts`.
- [ ] Je-Task-Prüfungen aus dem Index; `make zeittests` ist hier Pflicht (neue Datei mit Mock). Commit `feat: I-136 T03 Fernkarte mit roter Lagerzahl`.
