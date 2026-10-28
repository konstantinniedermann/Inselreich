# Anhang 05 · Anzeige auf der Insel und in der Chronik

Gehört zu [I-210 Bittschrift](../2026-10-25-i210-bittschrift-design.md) §5.2 (Browser-Checks AK-BS-20, AK-BS-21).

## 1 Auf der Insel (Panels)

- Haus in Überbelegung: Belegung «23 / 20 (Weberfamilien bis 31:40)».
- Haus unter Genügsamkeit: Zeile «Genügsam: Stoffbedarf −10 % bis 14:20».
- Haus im Radius einer geweihten Glocke: Aufstiegsuhr wie beim Aufstiegsfest, Zeile «Glockenweihe bis …».
- Kapelle mit Gutschein: Festknöpfe zeigen «Festtrunk: ohne Rum, ohne Abklingzeit».
- Betrieb mit Taktlohn: «Bittschrift: Zyklus 80 % bis …».
- Lagerzeile auf HOME bei Speicherbau: «Lager 120 (Speicher bis …)».
- Kopfleiste: Chip der laufenden Wirkungen mit Restzeit (Tooltip mit allen Einträgen).

## 2 Chronik (Ereignis-Log und Inselchronik)

Aus `StepReport.petitions` (Muster `ui/crisisLog.ts`, kein Teil des Spielstands):

- «Bittschrift: Weberfamilien bitten um 10 Stoff» (gezogen),
- **Dank** (Nachspiel «Ja»): `thanks`-Text plus Wirkung, z. B. «Die Weberfamilien ziehen ein und danken: Häuser ab Stufe 2
  nehmen bis 31:40 mehr Bewohner auf»,
- **Klage** (Nachspiel «Nein»): nur `lament`-Text, z. B. «Die Weberfamilien ziehen weiter. In der Stadt wird sparsamer
  mit Stoff umgegangen.»,
- **Verfallen**: «Die Kapelle steht nicht mehr: die Glockenweihe fällt aus, die Gabe ist verloren»,
- **Vorbei**: «Die Weberfamilien ziehen weiter» bzw. «Der Speicher ist abgebaut, 12 Stoff verdorben».
