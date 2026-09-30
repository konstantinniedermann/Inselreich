# ADR-006: Eigene oder offen lizenzierte Inhalte mit Nachweis

Status: akzeptiert · Datum: 2026-09-30 · löst ADR-004 ab

## Kontext

[ADR-004](ADR-004-eigene-assets.md) erlaubte nur Eigenes. Für Grafik, Animation, Wetter, Musik und
Sound fehlt die Kapazität, alles prozedural zu erzeugen. Offen lizenzierte Werke sind rechtlich sauber
nutzbar, wenn der Nachweis stimmt. „Anno 1602" bleibt eine geschützte Marke mit geschützten Inhalten;
Spielmechaniken als solche sind nicht geschützt.

## Entscheidung

- Inhalte sind eigen oder offen lizenziert, jeweils mit Nachweis.
- Mechaniken, Regeln und Ideen anderer Spiele sind frei verwendbar.
- Nie übernommen werden Grafiken, Musik, Sounds, Texte, Namen und Marken aus kommerziellen oder nicht
  frei lizenzierten Spielen.
- Erlaubt sind CC0, CC-BY, CC-BY-SA, MIT, OFL oder vergleichbar Freies.
- Nicht erlaubt sind NC, ND, GPL-Zwang für Assets und „free for personal use".
- Die Lizenz wird vor dem Einbau geprüft (`art-license-checker`, Vetorecht).
- Der Nachweis steht in `docs/CREDITS.md` (Quelle, Autor, Lizenz, Link), die Lizenztexte in
  `docs/licenses/`, die Attribution im Spiel (Info-Panel, spätere Projektarbeit).
- Assets liegen unter `public/`; die Gesamtgrösse bleibt im Blick.
- Ohne passende Quelle gibt es prozedurale Grafik und synthetisches Audio.
- Der Titel „Inselreich" bleibt eigen.

## Konsequenzen

- Ein Asset-Import-Workflow ist nötig: Lizenz prüfen, Nachweis eintragen, Lizenztext ablegen.
- CC-BY-SA-Assets stehen unter Share-Alike. Das gilt nur für das Asset selbst, nicht für den Code.
- Lizenz-Grenzfälle entscheidet der Nutzer.
