# I-094 Darlehen beim Händler — Kurz-Spec (Vorlage: verwerfen)

Stand 2026-10-16 · Paket `design-I-091-I-094` · Prozessstufe leicht · Auftrag R663 · Rechnung:
[2026-10-16-i091-i094-rechnung.md](2026-10-16-i091-i094-rechnung.md) (Teil A).

## 1 Empfehlung

**Verwerfen.** R663 erlaubt diese Empfehlung, wenn die Rechnung zeigt, dass das Darlehen entartet und kein Hebel hilft.
Genau das ist der Befund: Kein Hebel und keine Kombination schafft ein Fenster echter Wahl. Gefordert waren rund
5 Minuten, gemessen wurden 0. Die Spec enthält deshalb keine Abnahmekriterien, sondern die Begründung und die
Fassung, die bei einem Gegenentscheid zu prüfen wäre.

Geplantes Spielerlebnis (Idee): «Der Spieler nimmt 2000 Geld auf, zahlt 2400 in zehn Raten und zieht einen Ausbau vor.»
Säule: Wirtschaft über Steuern und Handel. Prüffrage 2 (echte Wahl) scheitert, Prüffrage 3 (Rückkopplung) zeigt eine
nicht lesbare Abwärtsspirale.

## 2 Befund der Rechnung (Kurzfassung)

- **Geldkurve** (Controller, gemessen, Rechnung A1): Geld bremst den Aufbau von Minute 1,5 bis 14. Ware bremst nie
  selbst, weil sie zugekauft wird. Ab Minute 14 kommen rund +2500 / min herein, und es gibt nichts mehr zu kaufen.
- **Dominanzformel** (A3): Ein Darlehen lohnt nur, wenn ohne es ein Kauf am Geld wartet.
  - Bei einem einzelnen grossen Kauf: lohnt, wenn der Ertrag y / min grösser ist als Aufschlag × Bilanz.
  - Bei dauerhaft knappem Geld: lohnt, wenn die Rendite r grösser ist als 2 · Aufschlag ÷ Laufzeit (bei 20 % und
    10 min: 0,04 / min).
  - Die Scout-Regel «ab Ausbau > 40 / min immer richtig» zählt den Ertrag über die ganze Laufzeit statt nur den
    Zeitvorsprung. Sie ist an beiden Enden falsch.
- **Vor dem Bürger-Ziel (U3–U5): Pflichtzug.** Der Bürger-Aufstieg bringt r = 0,42, also das Zehnfache der Schwelle.
  20 von 20 Läufen mit L ≤ 1000 waren positiv. Bei L = 2000 kippt das Ergebnis unlesbar: In derselben Lage ergeben
  20 % Aufschlag +3277 und 30 % −27 761 (Raten drücken das Geld ins Minus, 11 min Bau-Sperre).
- **Ab dem Bürger-Ziel (U6, Scout-Freischaltung): wirkungslos.** Jeder Ausbau ist billiger als die Kasse, der
  Zeitvorsprung ist also 0. Höchstens 0,2 min Bilanz Gewinn, beim Kaufleute-Paket +357.
- **Hebel** (A4): Freischaltfenster, Aufschlag 10–150 %, Laufzeit 3–20 min, fester oder relativer Deckel, Sperre bei
  negativer Bilanz oder negativem Geld, Rate wie Unterhalt, Verzugsstrafe und die Kombination U5 + Deckel 2 × Bilanz
  - 30 % + Sperre «Rate ≤ ½ Bilanz» ergeben jeweils ein Wahlfenster von **0 min**. Wo Geld bindet, dominiert das
    Darlehen. Wo es nicht bindet, ist es Kleingeld. Ein Aufschlag dazwischen erzeugt Glücksspiel statt Wahl.
- **Spätspiel-Geldüberschuss** (A5): Als Senke höchstens 0,8 % der Bilanz, und niemand nimmt ein Darlehen ohne Zweck.
  Als Quelle +2 bis +12 % Kasse bei Minute 25, aber nur bei Freischaltung vor U6. Das Überschussproblem bleibt also
  unberührt oder wird leicht schlimmer.

## 3 Selbstprüfung (Gate Brainstorming)

| Frage                | Ergebnis                                                                                  |
| -------------------- | ----------------------------------------------------------------------------------------- |
| Säule gestärkt?      | nein: Geld fehlt nur im Abschnitt, in dem das Darlehen Pflicht wäre                       |
| echte Wahl?          | nein: 0 min Fenster bei jedem Hebel                                                       |
| Rückkopplung         | Abwärtsspirale (Rate > Bilanz → Bau-Sperre), Kipppunkt nicht lesbar                       |
| Randfälle            | Raten bei negativem Geld vertiefen die Sperre; vorzeitige Tilgung ändert nichts am Befund |
| einfachere Variante? | siehe Abschnitt 4                                                                         |

Urteil: **ZURÜCK**. Die Idee wird nicht als Spec weitergeführt.

## 4 Falls das Spielerlebnis gewünscht bleibt

- **Vorschuss des Stammkunden** (Skizze der Rechnung A6, nicht gerechnet): Beim Annehmen eines Vertrags zahlt der
  Kunde die nächsten drei Lieferungen im Voraus. Die Lieferungen zahlen dann 0. Es gibt keinen Zins und keinen neuen
  Geldfluss. Das bindet den Vorschuss an Ware statt an Geld und vermeidet die Spirale. Weil es I-047 und I-091 berührt,
  gehört es als neue Idee in eine Ideen-Runde und nicht in dieses Paket.
- Wird I-094 gegen die Empfehlung umgesetzt, wäre die Fassung mit der kleinsten Schadwirkung: Freischaltung U6,
  L = 2000, 20 %, 10 min. Diese Fassung ist wirkungslos, aber ungefährlich. Save-Feld `loan: { left, rate } | null`
  (Rechnung B5), Balancing-Test unverändert (Controller nimmt nichts auf, Teil C).

## 5 Folgen

- `docs/ideen.md`: I-094 «Empfehlung verwerfen (R663, Rechnung)». Nach dem L0-Entscheid kommt die Idee ins Archiv.
- Kein Save-Bedarf, keine Def-Einträge, keine Änderung am Balancing-Test.
