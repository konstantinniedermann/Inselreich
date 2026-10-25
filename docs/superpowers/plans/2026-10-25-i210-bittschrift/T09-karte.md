# T09 Karte, Neues Spiel, Chip

Persona `tech-ui-engineer` · Strang C · Tools ≈ 60 · AK-BS-24, AK-BS-25; Vitest-Teil von AK-BS-19 und AK-BS-22 · blocked-by T04.

**Worktree:** `.worktrees/i210-ui`, Branch `feat/i210-ui` vom T04-Hash auf `feat/i210` (zuerst `git worktree list`). Kein `src/sim/`-Diff; fehlt eine Abfrage, meldest du sie an den Controller (sie gehört Strang A).

**Files:** Create `src/ui/petition.ts` (DOM-frei), `src/ui/petitionCard.ts` (DOM), `tests/ui/petition.test.ts`. Modify `src/ui/settings.ts` (`petitionsOn`), `src/ui/menu.ts` (Kästchen «Bittschriften» im Bereich «Neue Insel», neben der Krisen-Auswahl), `src/ui/app.ts` (`createWorld(…, { petitionsOn: settings.petitionsOn })`, Karte und Chip verdrahten; 72 KB, nur per `rg` und abschnittsweise), `src/ui/hud.ts` (Chip, 36 KB, abschnittsweise), `src/style.css`, `tests/ui/settings.test.ts` (Zusatz, falls vorhanden).

## Interfaces

- Consumes: `petitionPreview`, `PetitionPreview`, `PetitionReserveLine` (T04), `answerPetition`, `PETITIONS`, `GOODS[g].name`, `DEFAULT_NEW_GAME_PETITIONS_ON`, `FRUGAL_PCT`, `FRUGAL_TICKS`, `formatClock` (`src/ui/time.ts`), `TIERS`.
- Produces (`src/ui/petition.ts`):

```ts
export interface PetitionCardModel {
  title: string;
  text: string;
  deadline: string; // «Antwort bis 1:43» (Rest per formatClock)
  yes: { cost: string; blocked: string | null; reward: string; lines: string[] }; // lines: Reserve/Takt/Lager/B6-Hinweis
  no: { effect: string; nearFull: string | null; why: string; tail: 'Keine weitere Folge' };
}
export function petitionCardModel(world: World, drawnAt: number): PetitionCardModel | null;
export function petitionChip(world: World): { label: string; drawnAt: number } | null; // erste unbeantwortete Marke: «Bittschrift 1:43»
```

Texte (Spec §5.1, Zahlen mit Komma, eine Nachkommastelle):

- `cost`: «jetzt −10 Stoff» (mehrere Waren mit «, »); B8: «jetzt nichts».
- `reward` bei `overcrowd`: «in 8 min für 10 min: bis +8 Einwohner (Häuser ab Stufe 2)». Die Stufenangabe kommt aus `reward.tiers`: «Häuser ab Stufe 2», «nur Stufe 3», «alle Häuser». Bei `cycle`: «in 2 min für 10 min: Zyklus 80 % für alle Gewürzplantagen». Bei `storage`: «… Lager 120 für Stoff, Rum, Nahrung». Bei `upgradeWait` und `feastVoucher` steht der Text nach Spec §8 (B4, B5); deren Wirkung entsteht in T11.
- `lines` je Reserve: «Stoff · Lager 31 · heute netto ±0 je 100 T · Mehrbedarf 1,6 → Lücke 1,6 · Lager reicht ≈ 3 min» bzw. «… · kein Engpass». Bei B6/B7: Zahl der Betriebe, Eingangsware mit Lager und netto. Bei B9: die drei Lagerbestände. **Nur bei B6** zusätzlich «Wirkung hängt am Schiffsraum: Gewürz im Fremdlager 20 · 1 Schiff mit Gewürzroute» (AK-BS-25).
- `no.effect`: «für 3 min −10 % Stoffbedarf (spart ≈ 18 Stoff)»; `nearFull`: «Lager fast voll: Ersparnis verfällt teilweise» oder `null`; `why`: «Warum Stoff: » + `PETITIONS[id].noReason` (AK-BS-24).
- `blocked`: Sperrgrund aus `preview.yesBlock` (AK-BS-22: statt des Knopfs).

DOM (`petitionCard.ts`, Muster `councilCard.ts`/`trialCard.ts`): Rahmen mit Kopf, zwei Spalten, Knöpfe «Ja» und «Nein» (`data-testid` `petition-yes`, `petition-no`, `petition-block`). Klick ruft `answerPetition` und meldet einen Misserfolg mit `reason` über den bestehenden Meldungsweg. Die Karte öffnet beim Ereignis `drawn` als Meldung und bleibt über den Chip erreichbar. Das Spiel pausiert nicht. Nach der Frist schliesst sie mit «Keine Antwort: abgelehnt» (Ereignis `timeout`, T10 liefert den Logtext). Kartenformat so allgemein halten, dass «Neue Ufer» N4 Rahmen und Knöpfe übernehmen kann (Spec §10); keine Abstraktion auf Vorrat.

## Schritte

- [ ] **Tests zuerst** `tests/ui/petition.test.ts` (Welten aus `createWorld(…, { petitionsOn: true })` und Helfern, Marke gesetzt):
  - `AK-BS-24`: für alle 9 Ids enthält `no.why` `GOODS[PETITIONS[id].no].name` und ist länger als «Warum X: »; bei B5 enthält es «Zuckerrohr» oder «Rum», bei B7 «Wolle», bei B8 «Nahrung», bei B9 «Nahrung» und «Speicher».
  - `AK-BS-25`: B6-Modell enthält in `yes.lines` eine Zeile mit «Wirkung hängt am Schiffsraum» und den Zahlen aus `preview.spiceRoute`; für die anderen 8 Ids fehlt die Zeile.
  - `AK-BS-18-Text`: P1-Welt aus T04 → `cost` «jetzt −10 Stoff», `reward` enthält «bis +8 Einwohner (Häuser ab Stufe 2)», Stoffzeile enthält «Mehrbedarf 1,6» und «Lücke 1,6», `no.effect` enthält «spart ≈ 18 Stoff».
  - `AK-BS-22`: Stoff 5 → `yes.blocked` «Zu wenig Stoff (5 / 10)»; `no` unverändert.
  - `AK-BS-19 Vorbelegung`: `DEFAULT_SETTINGS.petitionsOn === DEFAULT_NEW_GAME_PETITIONS_ON` (true); `parseSettings` mit `petitionsOn: 'x'` → Standard; mit `false` → `false`.
  - `Chip`: offene Marke mit Rest 1030 T → «Bittschrift 1:43»; beantwortete Marke → `null`.
- [ ] Rot: `npx vitest run tests/ui/petition.test.ts tests/ui/settings.test.ts; echo EXIT=$?`.
- [ ] Umsetzen (Helfer, DOM, Einstellungen, Menü, `app.ts`, `hud.ts`, CSS).
- [ ] Grün plus Teilbeleg: `npx vitest related --run src/ui/settings.ts src/ui/menu.ts src/ui/hud.ts; echo EXIT=$?`, `npx tsc --noEmit`, `make lint`, `make conflicts`, je `; echo EXIT=$?`. Kurzer Sichtcheck im Dev-Server nur, wenn das Messfenster frei ist; der Browser-Check selbst ist T13.
- [ ] Commit `feat: I-210 Bittschrift-Karte, Kästchen Neue Insel und Chip`.
