# T02 · P2 «Wo war ich?»-Karte beim Laden (I-148)

Umsetzer `tech-ui-engineer` · ≈ 45 Tools · AK G11 bis G18 · blocked-by: T01 (`farLate`) · Spec: Teil P2 (Regeln 1 bis 6)

## Dateien

- neu: `src/ui/resumeCard.ts`, `tests/ui/resumeCard.test.ts`
- ändern: `src/ui/app.ts` (**eigener Commit**: ein Import, ein Aufruf als letzte Anweisung von `loadSlotPaused`, Z. ≈ 480 bis 500), `src/style.css` (ein Block am Dateiende, Klasse `card--resume`)
- nicht ändern: `src/sim/`, `src/ui/modal.ts`, `src/ui/pauseOverlay.ts`, `src/ui/problems.ts` (nur nutzen). Der `app.ts`-Hunk liegt neben dem Stadtplanung-Hunk (`loadSupplyNotice`); **kein Umbau von `loadSlotPaused`**, nur anhängen.

## Verhalten

1. **`resumeCardView(world: World): ResumeCardView | null`** (DOM-frei): `{ title: 'Wo war ich?', clock: string, deadlines: string[], problems: string }`; `null`, wenn `deadlines` leer **und** `n = problemList(world, HOME).length === 0` (stumm, Regel 4; `problemList` genau einmal). `clock = \`Spielzeit ${formatClock(world.tick)} · pausiert\``.
2. **Fristzeilen**, intern als `{ rest: number; order: number; text: string }`, sortiert aufsteigend nach `rest`, bei Gleichstand nach `order` (Auftrag 0, Fernauftrag 1, Fernangebot 2, Stammkunde 3, Auflage 4):
   - Zufallsauftrag (`world.order` ohne `island`): `Auftrag ${amount} ${GOODS[good].name} · ${reward} · noch ${formatGameTime(due − tick)}`.
   - Fernauftrag (`world.order` mit `island`): `farOrderText(world, o)` plus « · zu spät», wenn `farLate(world, {island, amount, good}, due − tick)`; `rest = due − tick`.
   - Fernangebot (`world.farOffer !== null`, kein Fernauftrag): `Fernangebot ${islandName(world, f.island)}: ${f.amount} ${GOODS[f.good].name} · Frist ${formatGameTime(rest)}`, `rest = farOfferDue(world)! − tick`.
   - Stammkunde (`world.contract`): `Stammkunde ${GOODS[c.good].name}: nächste Lieferung in ${formatGameTime(rest)}`, `rest = nextSettleTick(world) − tick`; plus « · Lager reicht nicht», wenn `world.islands[c.island].stock[c.good] < c.amount`.
   - Auflage (`world.trial.active !== null`): `Auflage ${TRIALS[active].name}: noch ${formatGameTime(rest)}`, `rest = TRIAL_DURATION_TICKS − trial.ticks`.
3. **Problemzeile:** `n === 0` → `NO_PROBLEM_TEXT`; `n === 1` → `1 Problem offen — . springt hin`; sonst `${n} Probleme offen — . springt hin`.
4. **`openResumeCard(host: HTMLElement, world: World): ModalHandle | null`** (Muster `openUpkeepCard`): `view = resumeCardView(world)`; `null` → nichts öffnen. Sonst `closeAllModals()`, dann `openModal({ host, className: 'card--resume', label: 'Wo war ich?', restoreFocus: 'body' })`; Inhalt `h2`, Uhrzeile, Liste `ul` der Fristzeilen, Problemzeile `p`, Knopf «Weiter» (schliesst, **setzt kein Tempo**, `.focus()` auf den Knopf). Esc und Hintergrund schliessen über `openModal`-Standard. Einmal gebaut, nie aktualisiert.
5. **`app.ts`:** letzte Anweisung von `loadSlotPaused` (nach dem Alt-Stand-Hinweis): `openResumeCard(root, r.world);` (Host wie die anderen Karten in `app.ts`; im Code prüfen, welcher Host `openUpkeepCard`/`openSettings` bekommt). Nie aus `restart` heraus. Die Karte darf die Meldung «Pausiert — P oder 1× setzt fort» nicht ersetzen.
6. **CSS:** Block am **Dateiende**: `.card--resume` (Breite wie `.card--upkeep`), `.resume-list`, ein Stil für die Fristzeilen. Nur vorhandene Variablen und Karten-Muster, desktop-first.

## Testfälle (rot zuerst; Beleg im Bericht)

`tests/ui/resumeCard.test.ts`, Welten aus `tests/sim/farHelpers.ts`; Stammkunde über `acceptContract` (Weg in `tests/sim/contractWarning.test.ts` ablesen), **keine `Contract`-Literale**; Auflage über `world.trial` setzen wie `tests/ui/trial.test.ts`; Zeiten immer `formatGameTime(...)`:

- **AK-G11** frische Welt (`createWorld`, kein Auftrag/Vertrag/Problem) → `null`.
- **AK-G12** je Fristzeile ein Test: Text enthält `formatGameTime(due − tick)` bzw. `nextSettleTick − tick` bzw. `TRIAL_DURATION_TICKS − trial.ticks`.
- **AK-G13** mehrere Fristen: Reihenfolge nach `rest`; Gleichstand folgt der festen Folge (Welt so bauen, dass zwei `rest` gleich sind, sonst Hilfsfunktion `sortLines` exportieren und direkt testen).
- **AK-G14** Fernauftrag mit `farLate` wahr (Frist unter Fahrzeit, Lager 0) trägt « · zu spät»; Lager gefüllt nicht.
- **AK-G15** Stammkunde Lager < Menge → « · Lager reicht nicht»; Lager ≥ Menge → ohne.
- **AK-G16** Problemzeile: 0 → `NO_PROBLEM_TEXT` (Karte erscheint dann nur mit Frist); n = 1 → «1 Problem offen»; n ≥ 2 → «n Probleme offen». Probleme über eine Welt mit bekanntem Problem (Muster `tests/ui/problems.test.ts`).
- **AK-G17** `serialize(world)` (aus `src/sim/save`, Name im Code prüfen) vor/nach `resumeCardView` gleich; `problemList` einmal (`vi.mock`-frei: Wrapper-Zählung oder `vi.spyOn` auf das Modul-Objekt, sonst im Bericht begründen und über den Quelltext-Lesezugriff prüfen).
- **DOM (FakeElement, Muster `tests/ui/trialCard.test.ts`):** `openResumeCard` mit leerer Welt → `null`, kein Modal; mit Frist: Modal offen, Knopf «Weiter» schliesst, Tempo unverändert (kein Aufruf eines Tempo-Callbacks, es gibt keinen); zweites Öffnen ersetzt die Karte (genau ein `.card--resume`).
- **AK-G18** nur Lauf: `git diff main -- src/sim` leer, `balance.test.ts` grün, `SAVE_VERSION` unverändert.

## Prüfschritte / Task-Review

Gezielte Tests laut index.md (Exit 0), `npx tsc --noEmit; echo EXIT=$?`, eslint/prettier. Reviewer: `src/ui/imports.test.ts` grün (UI importiert nur erlaubte Module); `app.ts`-Diff höchstens Import und ein Aufruf in eigenem Commit; `restart` unberührt; Karte beim neuen Spiel nie; CSS nur am Dateiende.
