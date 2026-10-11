# T05 — Doku (D1) und T06 — Browser-Check

## T05 (Umsetzer, nach T02; AK-UT-04)

Dateien: `README.md`, `docs/arc42.md` (nur bei geänderter Beschreibung). Kein Test (Prüfart B/Lesen).

- [ ] `README.md` Abschnitt «Stilllegen» (`grep -n 'Stilllegen' README.md`, Zeile ~454–460; nur diesen Abschnitt lesen, Datei > 30 KB, E-057): «zahlt **N % des Unterhalts** (je Betrieb aufgerundet)», N aus dem Entscheid zum Blocker (Empfehlung A: 50, sonst Spec-Wert 60 bei Option B).
- [ ] README Zeile ~53 «**Bau pausieren:**» → «**Bau anhalten:**»; Tastenhinweis Abriss «Entf / ⌫», falls die Spielanleitung «Entf» nennt (`grep -n 'Entf' README.md`).
- [ ] arc42: `grep -n 'halber Unterhalt\|pausier' docs/arc42.md`; nur Treffer zu den hier geänderten Texten anpassen.
- [ ] Controller: `make docs-check; echo EXIT=$?` → 0; Commit `docs: README Stilllegen und Bau anhalten (AK-UT-04)`.

## T06 Browser-Check (`qa-playtester`, 1280×800, Ablage `.studio/qa/ui-texte-1/`)

- [ ] Stilllegen: Panel-Status und Kacheln «Stillgelegt» (AK-UT-01/14), Hover kurz «Stillgelegt» (AK-UT-03).
- [ ] Kontor mit Edikt Handel: «Kaufen» und «Edikt Handel: −20 %» in zwei Zeilen, Screenshot (AK-UT-09).
- [ ] Menü: Reihenfolge Titel, «Speichern», Knopf, «Laden», Liste (AK-UT-10).
- [ ] Edikt-Panel: gesperrte Karten und «lohnt, wenn …» lesbar, gestrichelter Rand sichtbar (AK-UT-13); README Lesen (AK-UT-04).
- [ ] Denkmal «Bau anhalten»/«fortsetzen» und Abriss-Knopf «Entf / ⌫» (AK-UT-07/08). Report als Datei; Fixes im Baum durch den Umsetzer (SendMessage).
