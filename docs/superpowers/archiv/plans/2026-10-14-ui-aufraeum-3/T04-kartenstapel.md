# T04 · Kartenstapel oben rechts ordnen (I-099)

Umsetzer `tech-ui-engineer` · Schätzung 50 Tools · AK-UA3-11 bis 14 · blocked-by: T03

## Dateien

- ändern: `src/ui/crisis.ts` (`crisisCardText`: Stufe aus und keine Krise → `text: ''`), `src/style.css` (`.notice-stack` Abstand als `--stack-gap`, Karten gleiche Breite/Rand), ggf. `src/ui/hud.ts` (`updateNoticeStack`, nur falls die Ausblendung nicht schon greift)
- ändern: `tests/ui/crisis.test.ts` (Z. 18 «Krisen: aus»), `tests/ui/hud.test.ts`

## Testfälle (rot zuerst)

- **AK-UA3-11** Stufe aus ohne Krise: `crisisCardText(...).text === ''`; `updateNoticeStack` lässt die Krisenkarte `hidden`.
- **AK-UA3-12** Stufe an ohne Krise: Text «Krisen: <Stufe> · nächste Krise in …» unverändert (bestehender Test); laufende Krise (Brand, Sturm, Boom) unverändert.
- **AK-UA3-13** Quelltext/CSS-Test: `.notice-stack` nutzt `gap: var(--stack-gap)` und die Variable ist einmal definiert (bestehender Stil: Quelltext-Test wie `input.test.ts`); kein Pixelabstand an Einzelkarten.
- **AK-UA3-14** Browser 1280×720 und 1920×1080: Auftrags-/Vertrags- und Krisenkarte in einer Spalte mit gleichem Abstand, keine Verdeckung der Bauleiste; die Krisenstufe bleibt in Menü/Einstellungen lesbar (Screenshot, Spielbeleg).

## Schritte

1. Tests (Rot), 2. `crisis.ts`, 3. CSS, 4. grün. Spec-Delta zu M6 («Krisenkarte zeigt Stufe aus») im Task-Bericht nennen; Test in `crisis.test.ts` bewusst nachgezogen.

## Prüfschritte / Task-Review

Reviewer: Screenreader-Text der Krisenkarte (`aria-live`?) verliert nichts; `crisisFx`/`crisisLog` nutzen `crisisCardText` nicht anders (grep).
