# I-197b Partiebrief (Kurzdesign, Stufe leicht)

Stand 2026-10-25 · Paket design-I-197b · Quelle: TIEFE-2 K4 (`docs/superpowers/specs/2026-10-25-tiefe-2-recherche.md` auf Branch `docs/tiefe-2` @ d764745d), R880/T2-2 · Voraussetzung: I-197 Kartennummer (`2026-10-25-i197-kartennummer-design.md`, Plan liegt auf main, **Umsetzung muss vorher gemergt sein**) · Save: **nein** (`SAVE_VERSION` bleibt) · Spielwert in `src/sim/defs/`: keiner neu · Balancing/Baseline: unberührt · `src/sim/`: nicht berührt · Assets: keine.

## Spielerzweck

Der Spieler gibt einem Freund einen kurzen Text («IR1-4711-K2F0-1N»), der Freund tippt ihn in dasselbe Feld wie eine Kartennummer und bekommt dieselbe Startlage: gleiche Karte, gleiche Krisenstufe, gleiche Freischaltung. Säule: Insel besiedeln (Wiederspiel). Spürbar im ersten Spiel: das Menü zeigt den Brief der Partie, er lässt sich abschreiben und wieder eingeben. Reiner Komfort, kein Druck, kein Wert hängt am Brief.

## Befund vorab (Code, main @ fded33d8)

- Alles, was die Startlage ausser der Karte bestimmt, sind genau zwei Optionen: `crisisLevel` (`off | mild | normal`, `src/ui/settings.ts` `CRISIS_LEVEL_IDS`) und `unlockMode` (`stepwise | all`, `UNLOCK_MODE_IDS`); `createWorld(seed, { crisisLevel, unlockAll })` (`src/sim/world.ts:102`). Audio, Tag-Nacht, Bewegung sind Darstellung und gehören nicht in den Brief. Tempo ist Laufzeit, keine Startlage.
- `world.crisisLevel` steht im Spielstand. Die **Freischaltung steht nicht** im Spielstand (nur `world.unlocked`, im Lauf wachsend); ein Rückschluss «alles frei» ist unzuverlässig. Daher Regel 4.
- Seegang (K1) gibt es nicht; der Brief hat dafür eine Versionskennung (Regel 1), kein Feld.

## Regeln

1. **Format** `IR<v>-<Karte>-K<k>F<f>-<Prüf>` , Grossbuchstaben, Bindestriche. `v` = Formatversion, jetzt `1`. `Karte` = 1–8 ASCII-Ziffern, 0 … 99 999 999 (L0-Entscheid: der Brief trägt `world.seed`, also auch genutzte Nummern über `SEED_MAX`; die reine Zahleneingabe bleibt bei I-197 mit 0 … 99 999 949; Ausgabe ohne führende Nullen). `k` = 0 `off`, 1 `mild`, 2 `normal`. `f` = 0 `stepwise`, 1 `all`. `Prüf` = 2 Zeichen. Beispiel `IR1-4711-K2F0-1N`.
2. **Prüfzeichen:** Nutzlast = Text vor dem letzten Bindestrich ohne Bindestriche (`IR14711K2F0`). `h = 0`; für jedes Zeichen `h = (h * 31 + Zeichencode) mod 1021`; `h` ist höchstens 1020, also 10 Bit; diese als zwei 5-Bit-Zeichen, **hohes Zeichen zuerst** (`h >> 5`, dann `h & 31`), aus dem Alphabet `0123456789ABCDEFGHJKMNPQRSTVWXYZ` (Crockford-32, ohne I, L, O, U). Fängt alle Einzelzeichenfehler und alle Vertauschungen zweier verschiedener Zeichen der Nutzlast (1021 ist prim, 31 hat dort die Ordnung 1020); kein Schutz gegen Absicht (kein Geheimnis, keine Sicherheitsfunktion).
3. **Eingabe, Normalisierung:** Das Kartenfeld aus I-197 nimmt **beides**: reine Zahl (I-197 unverändert) oder Brief. Erkennung: nach `trim()` beginnt der Text (ohne Beachtung der Gross-/Kleinschreibung) mit `IR`. Normalisiert wird vor der Prüfung: Grossbuchstaben, Leerzeichen und Zeilenumbrüche entfernt, `–` und `—` zu `-`, im Prüfteil `O→0`, `I`/`L→1`. Der Prüfteil gilt als Tippfehler-Schutz, nicht der Rest.
4. **Anzeige im Menü:** Unter «Karte N» eine Zeile «Partiebrief: IR1-…» (Textauswahl per Dreifachklick möglich, kein Knopf, keine Zwischenablage). Karte = `world.seed`, Krise = `world.crisisLevel`; Freischaltung = Merker der Sitzung (UI-Zustand, nicht gespeichert), gesetzt beim Start über «Neue Insel»/Brief. Nach **Laden** fehlt der Merker: die Zeile nimmt die Freischaltung der Menü-Auswahl und trägt den Zusatz «(Freischaltung nach Auswahl oben)». Kein Save-Wechsel.
5. **Wirkung beim Start:** gültiger Brief → Bestätigung nennt ihn («Partiebrief: Karte 4711, Krisen normal, Freischaltung schrittweise. Neue Insel beginnen? …»); nach Bestätigung `createWorld(karte, { crisisLevel, unlockAll })`. Die Menü-Auswahl (`inselreich.settings`) bleibt **unverändert**; der Brief gilt nur für diesen Start. Gleicher Brief ergibt eine bitgleiche Startwelt (Regel 6 aus I-197). Die genutzte Nummer (Karte nicht bebaubar, `seed + i`) steht im Brief der gestarteten Partie, nicht im eingegebenen.
6. **Abweisung statt Absturz:** Ungültiger Brief → Hinweis unter dem Feld (`role="alert"`, wie I-197), keine Bestätigung, laufende Partie unberührt, Fokus im Feld. Hinweistexte nach Fehlercode:
   - `format`: «Partiebrief nicht lesbar. Erwartet z. B. IR1-4711-K2F0-1N.»
   - `check`: «Partiebrief: Tippfehler? Die Prüfzeichen stimmen nicht.»
   - `version`: «Partiebrief stammt aus einer anderen Spielversion (IR2) und lässt sich hier nicht lesen.»
     Zweistellige Version (`IR10-…`) ist `format` (Version ist genau eine Ziffer). Reihenfolge der Prüfung: Format, Version, Prüfzeichen, (Der Wertebereich ergibt sich aus 1–8 Ziffern und ist Teil von `format`; einen eigenen Code `range` gibt es nicht. Neun Ziffern sind `format`.) (so meldet ein verfälschter Code «Tippfehler», ein fremder «andere Version»).
7. **Abgrenzung Proben/Ehrenbuch:** Der Brief startet immer eine **freie Partie**: kein `challenge`-Zustand, keine Bestzeit, kein Ehrenbuch-Eintrag, der Brief trägt weder Probe noch Tagesinsel noch Ziel. Die Karte der Tagesinsel als Brief (Nummer 20261025) ist eine freie Partie wie in I-197. Läuft eine Probe, ist «Neue Insel» mit Brief ein Abbruch ohne Eintrag (Inselproben §4.2). Der Spieler kann «ich hatte 41 Minuten» nur als Wort weitergeben; das Spiel vergleicht nichts.
8. **Technik (Vorgabe, kein Plan):** reine Funktionen in `src/ui/partiebrief.ts` (DOM-frei, kein Import aus `src/sim/` ausser Typen): `encodeBrief(b: Brief): string`, `decodeBrief(raw: string): { ok: true; brief: Brief } | { ok: false; code: 'format' | 'version' | 'check'; reason: string }`, mit `Brief = { seed: number; crisisLevel: CrisisLevel; unlockAll: boolean }`; `BRIEF_VERSION = 1` als Konstante. `parseSeedInput` (I-197) wird nicht umgebaut; das Menü ruft zuerst `looksLikeBrief(raw)`. `MenuActions.newIsland` bekommt statt eines Zahlparameters ein Start-Objekt `{ seed?, crisisLevel, unlockMode }` (Absprache mit der Umsetzung von I-197); `StartOptions` führt den Merker (`unlockAll`). **PB-3 (L0):** Der I-197-Plan trägt noch `seed?: number` als dritten Parameter; der I-197-Controller stellt ihn beim Umsetzungsstart auf das Start-Objekt `{ seed?, crisisLevel, unlockMode }` um (`newIsland`, `StartOptions`, Menü-Tests), damit I-197b kein Umbau wird.

## Nicht dazugehört

Kein Speichern der Briefe, keine Liste, kein Teilen-/Kopieren-Knopf, kein QR, kein Link/URL-Parameter, kein Brief für Seegang (K1), keine Wertung oder Vergleichstabelle, keine Zeit oder Punktzahl im Brief, keine Audio-/Anzeige-Einstellungen, keine Sim-, Save-, Balancing-Änderung, keine Proben im Brief.

## Randfälle

- Karte 0 ergibt `IR1-0-K0F0-…` und liest als 0 (nie «fehlt»).
- Kleinschreibung, Leerzeichen, Zeilenumbruch beim Einfügen, `O` statt `0` im Prüfteil: gültig.
- Ein Zeichen vertauscht oder falsch: `check`. Zu kurz, leer nach `IR`, falsche Trennung: `format`. `IR2-…` / `IR0-…` mit sonst gültigem Aufbau: `version`.
- Brief mit gültigen Prüfzeichen, aber neunstelliger Karte oder `K3`: `format` (kein Absturz).
- Neun Ziffern oder 10 000 Zeichen Eingabe: abgewiesen vor jeder Berechnung: rohe Länge > 256 sofort `format`, nach Entfernen der Leerzeichen > 32 `format`.
- Brief eingegeben, Karte nicht bebaubar: Info-Meldung wie I-197 Regel 5.
- Spielstand-Laden bleibt unbeeinflusst; geladene Welten ignorieren Briefe.
- Brief und Dropdowns widersprechen sich: Brief gewinnt für diesen Start, Dropdowns bleiben.

## Abnahmekriterien

Vitest (`tests/ui/partiebrief.test.ts`, DOM-frei):

- **AK-PB1** Rundlauf: für alle 3 Krisenstufen × 2 Freischaltungen und die Karten 0, 1, 4711, 99999, 99999949, 99999998, 99999999 gilt `decodeBrief(encodeBrief(b))` gleich `b`, und `encodeBrief(decodeBrief(s).brief) === s` (bitgleich).
- **AK-PB2** Format: `encodeBrief({seed:4711, crisisLevel:'normal', unlockAll:false})` beginnt mit `IR1-4711-K2F0-` und hat danach genau 2 Zeichen aus dem Alphabet; `BRIEF_VERSION === 1`. Golden-Wert festgeschrieben: der Brief ist genau `IR1-4711-K2F0-1N` (Nutzlast `IR14711K2F0`, h = 53, hohes Zeichen `1`, niedriges `N`).
- **AK-PB3** Normalisierung: Kleinschreibung, Leerzeichen, `\n`, `–` statt `-`, `O` statt `0` im Prüfteil ergeben dasselbe Ergebnis wie die Grundform.
- **AK-PB4** Tippfehler: für einen gültigen Brief wird jede Einzelzeichen-Änderung der Nutzlast (jede Stelle × jedes Zeichen aus `0-9A-Z`) mit `check`, `format` oder `version` abgewiesen (`version`, wenn die Versionsziffer geändert wird), nie als gültig angenommen; Ausgangsbriefe: Karte 0, Karte 4711, 8-stellige Karte (99999999) und `K0F1`; jede Vertauschung zweier benachbarter **verschiedener** Zeichen der Nutzlast wird abgewiesen.
- **AK-PB5** Fehlercodes mit nicht leerem `reason` (genau die Texte aus Regel 6): `''`, `'IR'`, `'IR1-4711'`, `'IR1-4711-K2F0'`, 10 000 Zeichen → `format`; gültig aufgebauter Brief mit `IR2` und `IR0` → `version`; falsche Prüfzeichen → `check`; `IR1-100000000-K2F0-<korrekt berechnet>` (neun Ziffern) → `format`; `IR10-…` → `format`; `K3` → `format`; 300 Zeichen Leerraum und 40 Zeichen nach Entfernen der Leerzeichen → `format`. Der Aufruf wirft nie (`expect(() => …).not.toThrow()` über eine Reihe zufälliger Zeichenketten aus festem Seed).
- **AK-PB6** Versionskennung: Der Code trägt `IR1`; ein künftig höherer Wert wird nicht still als `IR1` gelesen (`version`-Test aus AK-PB5, Prüfzeichen zu `IR2` korrekt berechnet, damit nicht `check` greift).
- **AK-PB7** Startwelt: `createWorld(b.seed, {crisisLevel, unlockAll})` aus zwei Dekodierungen desselben Briefs ergibt `serialize`-gleiche Welten; zwei verschiedene Freischaltungen ergeben gleiches Terrain, andere `unlocked`.
- **AK-PB8** Keine Save-Folge: `SAVE_VERSION`, Replay-Hash/Baseline und `tests/sim/balance.test.ts` unverändert grün; kein Treffer von `challenge`/Bestzeit in `partiebrief.ts` (Import-Prüfung: keine Abhängigkeit von Proben-Modulen).
- **AK-PB9** Menü-Zeile: reine Funktion `briefLine(world, unlockMerker | null, menuUnlock)` liefert den Brief der Partie; mit `null`-Merker enthält der Text den Zusatz «Freischaltung nach Auswahl oben».

Browser-Check (`qa-playtester`, Headless, nach I-197-Merge):

- **AK-PB10** (Vorbedingung bebaubare Karte, z. B. 4711) Menü zeigt «Partiebrief: IR1-…»; Brief abschreiben, «Neue Insel» mit Brief im Karten-Feld: Bestätigung nennt Karte, Krisen, Freischaltung; nach Start zeigt das Menü denselben Brief und `Karte N`; zweimal wiederholt: gleiche Kontor-Lage.
- **AK-PB11** Brief mit einem geänderten Zeichen: Hinweis «Tippfehler?», Partie läuft weiter (Tick läuft, Gebäude stehen), Fokus im Feld. `IR2-…`: Hinweis «andere Spielversion».
- **AK-PB12** Menü-Auswahl (Krisen, Freischaltung) nach dem Start mit Brief unverändert; Seite neu laden: Feld leer, Auswahl wie vorher.
- **AK-PB13** (nachgezogen nach dem Inselproben-Merge, kein Merge-Kriterium für I-197b) Brief startet keine Probe, kein Bestzeit-Eintrag; Brief während laufender Probe bricht sie ohne Eintrag ab.
- **AK-PB14** Nach Laden eines Spielstands zeigt die Zeile den Zusatz «Freischaltung nach Auswahl oben».

## Zuschnitt

Ein Häppchen (S, ≈ 40 Tools): `src/ui/partiebrief.ts` (neu), `src/ui/menu.ts`, `src/ui/app.ts` (Merker, Start-Objekt), README-Spielanleitung (ein Satz), Tests oben. **Reihenfolge: nach I-197** (gleicher Neue-Insel-Block, gleiche Signatur `newIsland`); nach den Inselproben nur AK-PB13 nachziehen. Prozess: Stufe leicht, ein Umsetzer auf sonnet; Gate Spec durch L0.

## Selbstprüfung (Gate Brainstorming)

1. Säule Insel besiedeln (Wiederspiel); misslingt der Brief, bleibt die Kartennummer (I-197) unberührt.
2. Echte Wahl: Brief oder Zahl oder Zufall; keine dominante Option, da der Brief nie Vorteil (nur Startlage) oder Wertung bringt.
3. Rückkopplung: Teilen verlängert die Spieldauer ohne Inhalt; keine Wirtschaftsrückkopplung. R864 (keine Meta-Boni) gewahrt: der Brief öffnet nichts, was das Menü nicht ohnehin erlaubt.
4. Randfälle oben (Tippfehler, Version, Bereich, Länge, Karte 0, Probe, Laden).
5. Einfachere Variante: Nur Kartennummer (I-197) und die Optionen mündlich nennen: gibt aber keine geprüfte Weitergabe. Ein Zeichenstrang ohne Prüfzeichen wäre einfacher, fängt aber keinen Tippfehler. Urteil: OK.

## Entscheidungsbedarf (Entwurf an L0, R471)

| Nr.  | Frage                                                                                                               | Empfehlung                                                                                           |
| ---- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| PB-1 | Freischaltung nach Laden unbekannt (steht nicht im Spielstand). Zusatz «nach Auswahl oben» annehmen oder Save-Feld? | Zusatz annehmen; ein Save-Feld wäre ein Save-Wechsel für ein Komfortmerkmal.                         |
| PB-2 | Ein Feld für Zahl und Brief oder ein zweites Feld?                                                                  | ein Feld (weniger Menü, I-197 bleibt unberührt).                                                     |
| PB-3 | Umsetzung erst nach I-197 und Signaturabsprache `newIsland`; sonst mit I-197 bündeln?                               | nach I-197 getrennt; ist I-197 noch nicht gemergt, das Start-Objekt gleich im I-197-Paket einplanen. |
