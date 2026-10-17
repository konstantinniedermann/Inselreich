# I-144 · Zukauf-Ordnung (Design-Vorlage, Gate Brainstorming)

Stand 2026-10-17 · Paket `design-I-144` · Prozessstufe voll · Auftrag R776 · Rechnung und Messung:
[2026-10-17-i144-rechnung.md](2026-10-17-i144-rechnung.md) (design-economy-designer, Seed 3, Wrapper um `buy`/`buyPrice`
plus Replay; mit Fassung «fest» alle Pins bitgleich zu main `a7b03b9e`). Abschnittsverweise «R §…» zeigen in die Rechnung.

**Empfehlung: verwerfen (alle drei Fassungen).** Keine Fassung öffnet ein Fenster echter Wahl zwischen Bauen und Kaufen.
Der Ausgangsbefund stimmt zwar (Fenster ≈ 0 ab min 15 bzw. 19), aber die Ursache ist nicht der Kaufpreis, sondern dass
Geld danach nichts mehr bindet. Eine Regel am Kontor ändert das nicht.

## 1 Spielerzweck (Zielsatz der Idee)

«Geld kauft nicht jede Kette frei; im Mittel- und Spätspiel entscheidet der Spieler, welche Kette er selbst baut und
welche er zukauft.» Säule: Produktionsketten, mit Wirtschaft, Steuern und Handel. Geht die Regel schief, leidet die
Säule Wirtschaft: Zukauf wird nutzlos oder das Frühspiel läuft fest (Werkzeug, Stein).

## 2 Befund (R Teil 1)

- Der Basis-Controller kauft nur Baugüter: Holz, Werkzeug und Stein für 6445 Geld bis min 14. Konsumgüter kauft er
  nicht. Kein gemessener Lauf kauft Konsumgüter schneller als 28 je Minute (Kaufleute- und Edikt-Läufe).
- **Den vollen Bedarf zu kaufen ist schon heute 1,6- bis 2,7-mal so teuer wie selbst bauen** (Q-Werte R §1.3). Der
  Preis ist also schon eine Bremse. Kaufen gewinnt nur aus Bequemlichkeit: kein Platz, kein Anlauf, kein Unterhalt im
  Leerlauf.
- **Wahl gibt es, solange die Kasse bindet.** Ein Spieler, der zu Kaufleuten geht (Typ K), hat bis min 19,2 je Gut
  4,2 min Wahl. Ein Spieler, der danach auf das Denkmal spart (Typ K+D), hat heute schon 6–13 min Wahl je Gut. Nach dem
  Ziel (Typ K ab min 19,2) ist das Fenster 0. Dort ist Geld im Überfluss, gerechnet ≈ 4400/min im Kaufleute-Endzustand.
- **Freikauf-Test** mit 60 Bürgern: Eine ganze Kette zuzukaufen hält die Bilanz positiv (Rum +600/min, Stoff
  +1140/min). Zwei Ketten zugleich drücken sie ins Minus (Rum und Stoff −660/min). Geld kauft heute also eine Kette
  frei, aber nicht alle.

## 3 Fassungen und Urteil (R §V)

| Fassung                                                  | Wahlfenster ab min 19,2         | Baseline / Pins                                     | Frühspiel              | Save             | Entartung                                 | Urteil                     |
| -------------------------------------------------------- | ------------------------------- | --------------------------------------------------- | ---------------------- | ---------------- | ----------------------------------------- | -------------------------- |
| (A) 2 harte Plätze, Start Werkzeug + Holz                | 0                               | **kein Sieg** (Stein nicht kaufbar)                 | **läuft fest** (Stein) | neues Feld       | Steinbruch-Zwang                          | verwerfen                  |
| (A) Baugüter immer frei, 2 Plätze für den Rest           | 0 (nur Belegungswahl)           | bitgleich                                           | ok                     | neues Feld       | **immer «Gewürz + X»**, Fremdkontor-Umweg | verwerfen                  |
| (A) 3 Plätze Werkzeug/Holz/Stein                         | 0                               | Kaufleute-Lauf kippt (Gewürz, Tick 8200)            | ok                     | neues Feld       | wie oben                                  | verwerfen                  |
| (B) Staffel Stoff/Rum/Glas/Gewürz, Anstieg 2, Deckel 160 | 0; unter K+D **kleiner** (2–12) | Basis bitgleich, 3 Geld-Pins −100                   | ok                     | keins (`buyPct`) | Kauf in Häppchen unter dem Knie (≤ 9 %)   | als Wahl verwerfen         |
| (C) `BUY_RISE` 2 global                                  | 0                               | **Sieg 8450 > 7500**, Kaufleute-Ziel nicht erreicht | +2:50 min              | keins            | trifft Baugüter                           | verwerfen (R571 bestätigt) |

- **(A)** bindet ohne Geld, aber die neue Wahl ist keine. Gewürz bringt einem Platz +1360 Geld und spart Kolonie, Schiff
  und Route. Werkzeug bringt +860. Stoff, Rum und Glas haben negativen Geldwert (R §A.b). Also belegt jeder «Gewürz + X».
  Mit Plätzen je Insel öffnet jedes Kontor II zwei weitere Plätze. Das kostet im Kaufleute-Endzustand nur 0,75–1,4 min
  Überschuss, also hebelt der Umweg die Regel aus. Globale Plätze verhindern das, nehmen aber dem Inselspiel jede Rolle.
- **(B)** macht den Zukauf einer ganzen Kette teuer: Rum mit 60 Bürgern kippt von +600 auf −1099/min. Ein Wahlfenster
  öffnet sie nicht, denn sie trifft den Käufer und macht die Kasse des Bauenden nicht knapp. Wo die Kasse bindet (K+D),
  hebt sie Q über 1,5, und Bauen dominiert dann früher. Das **schliesst** Fenster, statt welche zu öffnen.
- **(C)** reisst das Sieg-Gate wie in der Last-Probe I-048. Das bestätigt R571.

## 4 Selbstprüfung Gate Brainstorming

| Prüffrage                    | Befund                                                                                                                                                                                                           | Urteil   |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| 1 Säulen                     | Keine Fassung stärkt «Produktionsketten» spürbar. (A) schadet ihr in der harten Form (Festlauf), (C) schwächt «Wirtschaft» (Sieg +2:50 min). (B) ist neutral.                                                    | ZURÜCK   |
| 2 Spielerzweck, 15-min-Spiel | Der Zielsatz ist in einem Satz sagbar, aber im 15-min-Spiel nicht spürbar: Bis min 15–19 bindet die Kasse ohnehin, und das Wahlfenster existiert heute schon (4,2 min je Gut). Danach öffnet keine Fassung eins. | ZURÜCK   |
| 3 Scope                      | Klar begrenzt (nur Kauf am Kontor; Verträge, Aufträge, Stammkunde, Fernangebot unberührt). (A) bräuchte Save, Handelsdialog und ≈ 2 Pakete für eine entartete Wahl.                                              | OK       |
| 4 Nur Mechaniken             | Handelsprivilegien und Nachfragepreis als Genre-Mechanik; keine fremden Namen oder Inhalte.                                                                                                                      | OK       |
| 5 Einfachere Variante        | Für «kein Freikauf einer Kette» gibt es (B) als billige Variante (kein Save, Basis bitgleich). Für das eigentliche Ziel, «Wahl im Spätspiel», gibt es keine Variante am Kontor. Der Hebel liegt woanders (§5).   | BEDENKEN |

**Gesamturteil: ZURÜCK, Empfehlung verwerfen.** Das gleiche Muster wie bei I-094 und I-110 (R722): Die Regel trifft
eine Grösse, die nicht der Engpass ist.

## 5 Was das Ergebnis über das Spätspiel sagt (Hinweis, kein Pitch)

Ein Wahlfenster im Spätspiel entsteht nur, wenn das Geld nach dem Kaufleute-Ziel noch irgendwo gebunden ist. Beim
Denkmal-Spieler ist das heute schon so: 6–13 min Wahl je Gut, ohne neue Regel. Reine Geld-Senken tragen laut R776
nicht. Gebraucht wird ein Ziel, auf das man spart und das eine Abwägung verlangt, wie das Denkmal. Die Kandidaten sind
bekannt: Denkmal als sichtbares Folgeziel und Erweiterung 1 (läuft in der Nutzer-Session, hier nicht angefasst). Eine
Rechnung dazu liegt ausserhalb dieses Pakets. Prüfen sollte man sie erst nach dem nächsten Playtest im Spätspiel.

## 6 Rückfallebene (B), nur falls L0 den Freikauf einer Kette trotzdem abstellen will

Ich empfehle das nicht: Der Nutzen ist klein, und die Wahl unter K+D schrumpft. Die Skizze liegt bei, damit L0 ohne
neue Runde entscheiden kann.

- **Regel:** Kaufanstieg je Gut für Stoff, Rum, Glas und Gewürz 2 Punkte je gekaufter Einheit, Deckel 160 %, Erholung
  wie heute 1 Punkt je 10 Ticks. Daraus folgt ein Knie bei 30 Einheiten je Minute. Baugüter und Rohstoffe bleiben fest.
  Werte in `src/sim/defs/goods.ts` als Feld je Gut (z. B. `GoodDef.buyRise`), das globale `BUY_RISE` entfällt oder
  bleibt 0.
- **Save:** keiner (vorhandenes `buyPct`, Validierung 100..`BUY_CAP`). **Baseline:** Basis-Controller und Ensemble
  bitgleich, Sieg 6750 und Kaufleute 11 500 unverändert. **Balancing-Ruling nötig:** `balance-edicts` Pins
  `MONEY_K/S/W` 56 068 / 54 706 / 60 446 → 55 968 / 54 606 / 60 346.
- **AK-Entwürfe:** (1) Gleiche Saat, Kauf von 100 Rum in Losen zu 10 ohne Pause: Preis steigt bis Deckel, Summe wie
  `buyQuote` mit Anstieg 2 (Vitest). (2) Holz, Werkzeug, Stein: Preis nach 100 Käufen weiter 100 % (Vitest).
  (3) Basis-Controller: `winTick` 6750, Kaufleute-Lauf 11 500 / 320 bitgleich. (4) Handelsdialog zeigt «Preis … %» nur
  für die vier Güter (Browser-Check). (5) Offener Punkt vor dem Plan: AK-Z3-05 (`goal3`, Gewürz 48/min, über dem Knie)
  unter (B) einmal laufen lassen.
- **Aufwand:** ≈ 1 Paket (Sim und Anzeige), ≈ 100 Tools.

## 7 Nicht im Scope

Verträge, Aufträge, Stammkunde, Fernangebot, Verkaufssättigung, Bau- und Ausbaukosten; Erweiterung 1; Stadtplanung;
I-132 «Eigenversorgung» (sperrt weiter allen Zukauf, unberührt).

## 8 Folgen für geparkte Ideen (Entwurf für L0)

- **I-111** (geparkt bis I-144 entschieden): Die Parkbedingung ist mit dem Entscheid erfüllt. Die Gründe gegen I-111
  («Belohnung wiegt nichts») gelten weiter, weil Geld nach dem Ziel nichts bindet. Empfehlung: verwerfen oder an
  einen Spätspiel-Anlass parken.
- **I-110, I-130, I-134** (geparkt bis `BUY_RISE` > 0, R722/R737): (C) reisst das Sieg-Gate, (B) gilt nur für
  Konsumgüter und träfe deren Hebel (frühes Werkzeug, Inselpreise) nicht. Die Parkbedingung tritt also absehbar nie
  ein. Empfehlung: Status «verworfen (I-144)» oder neue Parkbedingung «Spätspiel-Bindung nach dem Kaufleute-Ziel»;
  L0 entscheidet.
