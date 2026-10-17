# I-132 · Meisterprüfung «Eigenversorgung» (Kurzdesign, Stufe voll)

Stand 2026-10-16 · Paket `design-I-132-I-133` · Prozessstufe voll · Auftrag R737 (Priorität 2, mit I-133 als Auflage
«Sturmjahr») · Rechnung: [anhang-01-rechnung.md](2026-10-16-i132-meisterpruefung/anhang-01-rechnung.md). Messwerte stammen
aus Läufen am Stand K'-arm (Seed 3, 60 Kaufleute, 75 Einwohner); alles andere ist als Schätzung gekennzeichnet.
Plan: `docs/superpowers/plans/2026-10-17-i132-meisterpruefung.md`

## 1 Spielerzweck (ein Satz)

Nach dem Denkmal legt sich der Spieler freiwillig die Auflage «Eigenversorgung» auf (kein Zukauf am Kontor) und hält seine
Kaufmannsstadt 15 Minuten aus eigenen Ketten versorgt, um ein Abzeichen in der Inselchronik zu bekommen.

Säule: Produktionsketten (Wirtschaft). Wenn es misslingt, leidet nichts: Die Auflage ist freiwillig, kostet nichts und ändert
keinen Spielwert. Spürbar: Wer nach dem Wahlziel die Auflage startet, merkt in der ersten Minute, welche Güter bisher am
Zukauf hingen (im Referenzstand Gewürz und Stein, Anhang §1.1), und baut Plantagen, Steinbrüche und Schiffsrouten aus.
Leitbefund R722 (Geld nur früh knapp) gilt: Der Engpass der Auflage ist Logistik, nicht Geld (Anhang §2.3, §2.4).

## 2 Varianten und Empfehlung

| Variante                                | Kurz                                    | Urteil aus der Rechnung                                                                   |
| --------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------- |
| **S: nur A1 «Eigenversorgung» (empf.)** | Zukauf gesperrt                         | schaffbar, nicht trivial, Engpass Logistik (Gewürz und Stein per Schiff), keine Geldsenke |
| M: A1 + A2 «Genügsam» + A3 «Sturmjahr»  | wie Pool-Eintrag                        | A2 und A3 trivial (unten); M wäre zwei Scheinprüfungen neben einer echten                 |
| M': A1 + A2' «Wachstum» (E ≥ 120 % E0)  | Ersatz für A2, Engpass Ketten und Platz | nur gerechnet, nicht gemessen (Anhang §3); erst nach Playtest von S als eigene Idee       |

- **A2 «Genügsam» (Steuer fest niedrig): streichen.** Kaufleute haben kein «niedrig»; es trifft nur Stufe 1 bis 3. Messung:
  Kasse Δ +40 230 statt +45 900 in 9000 Ticks, nie unter 2454 (Anhang §3). Der Engpass wäre Geld, und Geld ist im
  Spätspiel Überschuss.
- **A3 «Sturmjahr» (I-133): streichen.** Mit drei Feuerwachen (rund 1000 Geld) fällt die Stadt auch bei Periode 300 nie
  unter 93 % (16 Seeds); selbst 41 % Sturmzeit kostet höchstens 7 Einwohner. Die Einbrüche kommen aus Bränden auf
  Kapelle, Schule oder Bad, nicht aus dem Sturm (Anhang §5). Prüfgegenstand wäre «drei Feuerwachen bauen», einmalig und
  billig. Nebenbefund für den Fall, dass I-133 später allein kommt: Periode 300 braucht eine Ausfall-Regel, weil das
  Sturmfenster (bis Start + 500) länger ist als die Periode (Anhang §4).

**Empfehlung S.** Das Gerüst (Auflagen-Tabelle in den Defs, ein aktives Feld, Abzeichen-Liste) bleibt so geschnitten, dass
eine zweite Auflage später nur einen Defs-Eintrag und ihre Regel braucht. Kein Vorgriff darüber hinaus (YAGNI).

## 3 Regeln

### 3.1 Werte (neu `src/sim/defs/trials.ts`, Anhang §8)

| Konstante              | Wert                          | Bedeutung                                                                                    |
| ---------------------- | ----------------------------- | -------------------------------------------------------------------------------------------- |
| `TRIALS`               | `{ selfSupply: { name, … } }` | Auflagen-Tabelle; ein Eintrag «Eigenversorgung» mit Name, Kurztext, Regeltext                |
| `TRIAL_DURATION_TICKS` | 9000                          | 15 min Spielzeit bei 1×                                                                      |
| `TRIAL_MIN_MERCHANTS`  | = `WIN_MERCHANTS` (60)        | Startbedingung; gelesen aus `tiers.ts`, kein zweiter Wert                                    |
| `TRIAL_MAX_MERCHANTS`  | 150                           | Startbedingung; darüber tragen 4 Schiffe Gewürz und Stein nicht (Schätzung 154, Anhang §2.3) |
| `TRIAL_FAIL_POP_PCT`   | 70                            | nicht bestanden, sobald Einwohner gesamt < 70 % von E0                                       |

### 3.2 Ablauf

1. **Angebot:** Ab `monumentDone` (Wahlziel erreicht) ist die Auflage wählbar. Ein späterer Abriss des Denkmals ändert das
   nicht (`monumentDone` bleibt).
2. **Start:** Sim-Aktion `startTrial(world, id)`, Ergebnis `{ ok, reason }`, wirft nie. Gründe (Reihenfolge der Prüfung):
   unbekannte Auflage · Wahlziel nicht erreicht · eine Auflage läuft schon · bereits bestanden · Kasse negativ · weniger als
   60 Kaufleute · mehr als 150 Kaufleute. Bei Erfolg: `active = id`, `ticks = 0`, `e0` = Einwohner gesamt (alle Inseln).
3. **Regel A1 «Eigenversorgung»:** Solange sie aktiv ist, liefern `buy` (jedes Kontor, Heimat und Fremdinsel) und der
   Denkmal-Zukauf (`monumentBuyBlock`, damit auch `buyMonumentUnit`) `{ ok: false, reason: 'Auflage Eigenversorgung: kein Zukauf' }`
   bzw. 0 ohne Weltänderung. Frei bleiben: Verkauf, Aufträge, Stammkunde, Fernangebot, Schiffskauf, Schiffsrouten, Bauen.
4. **Zählen:** Ein Schritt `tickTrial` je Sim-Tick nach dem Bevölkerungsschritt: Ist eine Auflage aktiv und sind die
   Einwohner gesamt × 100 < `e0` × 70, endet sie als «nicht bestanden» (`active = null`, `ticks = 0`). Sonst `ticks += 1`;
   bei `ticks = 9000` ist sie «bestanden»: Eintrag `{ id, tick }` in `passed`, `active = null`, `ticks = 0`.
5. **Pause und Tempo:** gezählt werden Sim-Ticks. Die Pause hält den Zähler an, 2× und 4× zählen entsprechend schneller.
6. **Abbruch:** `abortTrial(world)` beendet die aktive Auflage ohne Kosten und ohne Eintrag (`active = null`, `ticks = 0`);
   Grund bei `ok: false`: keine Auflage aktiv. Neustart danach jederzeit, Zähler beginnt neu.
7. **Abzeichen:** je Auflage höchstens einmal je Partie; nach dem Bestehen ist dieselbe Auflage nicht mehr startbar.
   Lohn ist nur der Eintrag: kein Geld, kein Spielwert, keine Freischaltung.
8. **Krisen:** laufen unverändert weiter und zählen mit (ein Brand auf der Kapelle ist Teil der Prüfung). Keine eigene
   Krisenregel.
9. **Kasse:** kein Abbruchkriterium (redundant, Anhang §6); nur Startbedingung «Kasse ≥ 0».
10. **Steuer, Ausgabesperre, Abriss:** bleiben frei. Wer mit «hoch» oder Abriss die Einwohnerzahl senkt, haushaltet innerhalb
    der Schwelle (höchstens −30 %); die Kernaufgabe, Gewürz und Stein selbst herzustellen, bleibt (siehe Entscheidungsbedarf E2).

### 3.3 Bedienung (UI, desktop-first)

- **Chip «Ziel»:** Nach dem Wahlziel zeigt er «Meisterprüfung» (neutral). Während der Auflage: «Eigenversorgung m:ss / 15:00»
  (Restzeit oder Fortschritt nach Wahl von Tech, Spielzeit bei 1×). Nach dem Bestehen: «Meisterprüfung ✓».
- **Auflagen-Karte** (Klick auf den Chip; kein Modal, Spiel läuft weiter): Name, Regeltext aus den Defs, Bedingung
  («15 Minuten, Einwohner nicht unter 70 % des Starts»), dazu eine **Vorschau «Ohne Zukauf fehlen»**: je Gut mit negativer
  reichsweiter Bilanz (Summe `goodsBalance` über alle Inseln) die Menge je Minute, z. B. «Gewürz −36 / min, Stein −36 / min»;
  ohne Defizit «Deine Ketten decken den Bedarf». Ein Hinweis «Feuerwachen schützen Kapelle, Schule und Bad». Knöpfe
  «Auflage beginnen» (blass mit Grund, wenn `startTrial` scheitern würde) bzw. während der Auflage «Abbrechen» mit
  Bestätigung im selben Knopf (zweiter Klick). `Esc` schliesst.
- **Handel:** Kauf-Knöpfe sind während der Auflage blass und nennen beim Klick den Grund (bestehendes Muster). Der Schalter
  «zukaufen» am Denkmal zeigt denselben Grund.
- **Meldungen:** Start, Bestanden («Meisterprüfung bestanden: Eigenversorgung») und Nicht bestanden («… nicht bestanden:
  Einwohner unter 70 %») über den bestehenden Meldungsweg; die UI erkennt die Übergänge am Zustand (wie das Krisen-Log).
- **Inselchronik:** Zeile «Meisterprüfung» unter «Wahlziel»: «Eigenversorgung bestanden (m:ss)» oder «offen».

## 4 Save-Urteil

**Save betroffen.** Neues Weltfeld `trial: { active: TrialId | null; ticks: number; e0: number; passed: { id: TrialId; tick: number }[] }`,
in `createWorld` `{ active: null, ticks: 0, e0: 0, passed: [] }`. `SAVE_VERSION` = Stand auf main beim Merge + 1 (R674).
**Migration** statt Abweisen, analog R711 R-4: `migrateVnToVn+1` setzt das Feld mit Startwerten, verlustfrei, wirft nie.
Strukturprüfung: `active` ∈ Ids oder `null`; `ticks` ganz, 0 ≤ ticks < 9000, bei `active = null` gleich 0; `e0` ganz ≥ 0;
`passed` ohne doppelte Id, `tick` ganz ≥ 0; `active` nicht in `passed`. Ein Stand, der die Prüfung nicht besteht, wird mit
Hinweis abgewiesen (Feste Regel), Test dafür.

**Baseline:** Der Balancing-Controller startet nie eine Auflage. Mit `active = null` ist `tickTrial` ein früher Rücksprung
und `buy`/`monumentBuyBlock` prüfen nur das Feld; `tests/sim/balance*.test.ts` bleiben bitgleich (Ruling-Entwurf E4).

## 5 Abgleich mit I-112 (Ratsbeschluss, in Umsetzung)

- **Reihenfolge:** I-112 zuerst mergen (v17, wenn nichts dazwischenkommt), I-132 danach mit main + 1. Der Plan für I-132
  entsteht erst ab main nach dem I-112-Merge, damit die Migrationskette ohne Konflikt anschliesst.
- **Konfliktfläche** (Dateien, die `feat/i112` schon ändert): `src/sim/save.ts` (Migrationskette, Strukturprüfung),
  `src/sim/types.ts` (World), `src/sim/world.ts` (`createWorld`), `src/sim/tick.ts` (Schrittfolge), `src/ui/hud.ts`
  (Kopfzeile: Marke «Rat» neben Chip «Ziel»), `src/ui/inspect.ts` (Inselchronik), `src/ui/app.ts`, `src/ui/hotkeys.ts`,
  `src/style.css`, `tests/sim/helpers.ts`. Alles additiv; kein gemeinsamer Wert.
- **Spielwirkung:** Glasrecht (Glashütte schneller) ändert den Steinbedarf je Glas nicht; Hofrecht (22 je Kaufmannshaus)
  erhöht den Gewürzbedarf je Haus, die Obergrenze zählt aber Kaufleute, nicht Häuser. Kein Stapelfall.
- **Kopfzeile:** Rats-Marke und Ziel-Chip stehen nebeneinander; Browser-Check prüft, dass die Kopfzeile bei 1280 px
  einzeilig bleibt.

## 6 Abnahmekriterien

Vitest gegen `src/sim/` (`tests/sim/trial.test.ts`, neu; Szenarien mit gesetzten Häusern und `monumentDone`):

1. Neue Welt: `trial` = `{ active: null, ticks: 0, e0: 0, passed: [] }`.
2. `startTrial` liefert `ok: false` mit dem jeweiligen Grund und lässt die Welt unverändert: unbekannte Id; `monumentDone`
   false; Auflage läuft; bereits bestanden; Kasse < 0; 59 Kaufleute; 151 Kaufleute. Wirft nie (auch bei `undefined`, Zahl).
3. Erfolgreicher Start mit 60 und mit 150 Kaufleuten: `active = 'selfSupply'`, `ticks = 0`, `e0` = Einwohner aller Inseln.
4. Während A1: `buy` an Heimat- und Fremdkontor liefert `ok: false` mit Grund «Auflage Eigenversorgung: kein Zukauf», Geld
   und Lager unverändert; `buyMonumentUnit` liefert 0, Geld unverändert; `sell` und `buyShip` arbeiten wie ohne Auflage.
5. Nach `abortTrial` arbeitet `buy` wieder; `abortTrial` ohne aktive Auflage liefert `ok: false`.
6. Bestehen: Szenario mit Selbstversorgung (alle Bedarfsgüter mit Überschuss, keine Krisen) läuft 9000 Ticks; danach
   `active = null`, `passed` enthält `{ id: 'selfSupply', tick }` mit dem Tick des Bestehens; nach 8999 Ticks noch aktiv.
7. Nicht bestanden: Referenzstand ohne Gewürz (Anhang §2.1) endet, sobald Einwohner × 100 < e0 × 70; `passed` bleibt leer;
   Grenzfall genau 70 % läuft weiter.
8. Pause: `ticks` wächst genau um die Zahl der `step`-Aufrufe (die Pause ruft `step` nicht auf); kein Zählen über die
   Uhrzeit.
9. Bestanden ist nicht erneut startbar (Grund «bereits bestanden»); nach «nicht bestanden» und nach Abbruch ist ein Neustart
   möglich, `ticks` beginnt bei 0.
10. Denkmal abgerissen nach `monumentDone`: Start bleibt möglich.
11. Determinismus: zwei Läufe mit gleichem Seed und gleicher Aktionsfolge inkl. `startTrial`/`abortTrial` liefern gleiche
    Welt-Hashes.
12. Save: Speichern und Laden erhält `trial` (inaktiv, aktiv mit Zähler, mit `passed`); Migration vom Vorgänger setzt die
    Startwerte; ungültige Strukturen (Zähler ≥ 9000, `active` in `passed`, unbekannte Id) werden mit Hinweis abgewiesen.
13. Werte nur in `src/sim/defs/trials.ts`; ein Test liest die Tabelle und die Konstanten.
14. Balancing-Tests unverändert grün; der Controller ruft `startTrial` nie auf, `trial` steht am Ende auf den Startwerten.

Reine UI-Helfer (`tests/ui/trial.test.ts`, neu):

15. `trialChip(world)`: nichts vor `monumentDone`; «Meisterprüfung»; während der Auflage Name und Zeit aus `ticks`;
    nach dem Bestehen mit Haken.
16. `selfSupplyPreview(world)`: listet genau die Güter mit negativer Summe über alle Inseln, Menge je Minute gerundet;
    leere Liste, wenn keine Defizite.
17. `trialStartReason(world)`: derselbe Grund wie `startTrial` ohne Weltänderung (für den blassen Knopf).

Browser-Check bei 1280 px (qa-playtester, Screenshots `.studio/qa/<paket>/`, Spielstand mit `monumentDone`):

18. Chip «Meisterprüfung» sichtbar; Auflagen-Karte öffnet, Vorschau nennt die Defizite, Spiel läuft weiter, `Esc` schliesst.
19. Nach dem Start: Kauf-Knöpfe blass, Klick nennt den Grund; Chip zeigt die Zeit; Kopfzeile einzeilig (mit Rats-Marke).
20. Abbruch mit zweitem Klick; Meldung bei «nicht bestanden» (Spielstand ohne Gewürz, 4×); Inselchronik zeigt die Zeile.

## 7 Randfälle

- Start mit leerem Gewürzlager: zulässig; die Vorschau warnt, die Auflage scheitert nach rund 40 s (Anhang §6, 70 %).
- Vor dem Start vollgekauftes Lager: trägt Heimat-Gewürz und -Stein 1799 Ticks, also 20 % der Dauer (Anhang §7); kein
  Gegenmittel nötig.
- Schiff mit Ladung beim Start: Ladung zählt, sie ist bereits gekauft oder erzeugt.
- Neue Häuser während der Auflage: erhöhen die Einwohner, `e0` bleibt; wachsen ist erlaubt.
- Kaufleute steigen während der Auflage über 150: kein Abbruch (Obergrenze gilt nur beim Start).
- Kasse wird durch eine Brandinstandsetzung negativ: kein Abbruch; Bauen und Kaufen sind dann ohnehin gesperrt.
- Laden eines Stands mit aktiver Auflage: läuft mit `ticks` und `e0` weiter.
- «Alles frei»-Spiel: Auflage erst nach `monumentDone`, wie sonst.
- Ein Spieler, der das Gewürz schon über Plantage und Schiff bezieht, braucht nur den Stein: leichter, gewollt (Prüfung dessen,
  was er gebaut hat).

## 8 Nicht dazugehört

Keine Auflagen «Genügsam» und «Sturmjahr», keine Krisenstufe «stürmisch», keine Rangliste oder Bestzeit, kein Geld- oder
Spielwert-Lohn, keine Freischaltung durch das Abzeichen, keine Auflage vor dem Wahlziel, kein Controller-Lauf mit Auflage im
Balancing-Test, keine eigene Grafik oder Musik (bestehender Meldungs- und Glockenweg), keine Sperre von Verkauf, Steuer oder
Abriss.

## 9 Grösse und Paketzuschnitt

**S**, ein Umsetzungspaket `I-132` nach dem I-112-Merge, Schätzung 4 Tasks: T1 Defs, Weltfeld, Save mit Migration (AK 1,
12, 13); T2 Aktionen, Sperren, `tickTrial` (AK 2 bis 11, 14); T3 UI Chip, Karte, Handel, Chronik, Meldungen (AK 15 bis 17);
T4 Doku (`docs/spielwerte.md` neuer Abschnitt «Meisterprüfung», README-Kurzhinweis) und Browser-Check (AK 18 bis 20).
Plan durch lead-tech.

## 10 Selbstprüfung Gate Brainstorming

| Prüffrage                        | Urteil                                                                                        |
| -------------------------------- | --------------------------------------------------------------------------------------------- |
| Säule und Schaden bei Misslingen | Produktionsketten; misslingt sie, bleibt das Spätspiel wie heute                              |
| Echte Wahl                       | ja: Ausbaupfad offen (Felsbucht-Kombi oder Gewürzinsel + Heimat-Stein), Zeitpunkt frei        |
| Rückkopplungen                   | Bremse nur freiwillig; Bilanz je Einwohner steigt sogar (6,8 → 9,6, Anhang §2.4), keine Senke |
| Entartete Strategien             | Lager füllen: 20 %; Trimmen: ≤ 30 % durch Schwelle gedeckelt; grosse Stadt: Startgrenze 150   |
| Einfachere Variante              | S ist die einfachste; Sturmjahr und Genügsam fallen weg                                       |

Urteil: **OK** für Variante S; BEDENKEN nur zur Schätzung der Obergrenze (Playtest-Trigger: Spieler mit 120 bis 150
Kaufleuten scheitert mit 4 Schiffen trotz voller Ketten → Grenze senken oder Ruling «A1 sperrt nur Gewürz und Stein»).
