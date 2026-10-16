# I-048 Schritt B — Designfrage: Staffel statt Preisformel, oder Verzicht

Datum: 2026-10-11 · Paket design-I048-B · Prozessstufe leicht · Status: **Option 2 angenommen (R555), Last-Probe 2026-10-12: Abbruch R555 (c) → Option 1 (Verzicht)** · Kein
Spec-Nachtrag, keine Werte, kein Code (R551).

Grundlage: [Spec I-048](2026-10-10-i048-zukauf-aufschlag-design.md) (Z2–Z4, §6, P-5),
[Anhang 01](2026-10-10-i048-zukauf-aufschlag-design/anhang-01-werte-bilanzen.md) (a, c, f, g); Rulings R547, R549,
R551, R553 V1; Handoff `.studio/handoffs/2026-10-11-lead-design-D-I048-B-WERTE.md`; Beobachtung «Balancing-Controller:
Seed wirkt nicht auf die Heimkolonie». Stand `main`: `BUY_RISE` 0, `BUY_CAP` 160, `BUY_RECOVERY_INTERVAL` 10,
`SELL_RECOVERY_INTERVAL` 10 (Mechanik eingebaut, inaktiv).

## Ergebnis Last-Probe (R555 c, 2026-10-12)

Abbruchkriterium erfüllt. Der Basis-Controller kauft Holz in Spitzen von 71–90 Stück je Minute (Ensemble-Phasen
0–80, auch in den Krisenstufen). Der reiche Lauf aus `balance-edicts` kauft 292 Holz, 107 Werkzeug und 120 Stein je
Minute. Ein bitgleiches Kontingent läge über dem Bedarf einer Stadt-Insel. In `balance-merchants` bisse es nicht
(Gewürz ≤ 28/min). Damit gilt **Option 1**: Die Mechanik bleibt mit `BUY_RISE` 0 inaktiv, und es kommen keine Werte und kein
Spec-Nachtrag zur Staffel. Zahlen und Messweg stehen in
[Anhang 02](2026-10-10-i048-zukauf-aufschlag-design/anhang-02-last-probe.md).

## Befund in einem Absatz

Der Zielsatz der Spec lautet: «Wer klein zukauft, merkt nichts; wer jeden Engpass mit Geld löst, zahlt drauf.» Der
Balancing-Controller ist genau dieser Kleinkäufer (≈ 15 Einheiten/min über alle Güter, Lose ≤ 10 je Bau). Die Formel
Z2 lässt den Anteil schon innerhalb eines Loses steigen und trifft ihn deshalb mit 5–11 % (D-150). Jede Wirkung auf
den Controller verschiebt chaotische Einzelläufe: Die Antwort ist nicht monoton (R549), der Seed ändert die
Heimkolonie nicht (R551). Gemessen wurde der Biss bisher **am Controller**, also am falschen Spieler. Das ist der
eigentliche Fehler, und er liegt im Massstab, nicht in einem Wert.

## Optionen

### Option 1 — Verzicht: Mechanik bleibt inaktiv

- **Spielgefühl:** wie heute. Bauen statt Kaufen bleibt nur über die Stückkosten eine Wahl: Ab 5/min ist Eigenbau
  schon heute 2–5× billiger (Anhang c). Die Lücke «Geld löst jeden Mangel» bleibt für reiche Spieler offen. Die
  Anzeige «Kauf 100 %» zeigt einen Wert, der sich nie ändert; sie sollte dann entfallen oder bleiben, mit Hinweis.
- **Grenzen:** unberührt, die Baseline bleibt bitgleich.
- **Messbarkeit:** nichts zu messen.
- **Aufwand:** ≈ 0; optional ein Häppchen «Anzeige Kauf % ausblenden» (UI, ≈ 15 Tools). I-047 ist sofort frei
  (R486 O3).

### Option 2 — Kontingent-Staffel (Empfehlung)

Regel: Je Gut gibt es weltweit ein **Kaufkontingent** zum Listenpreis. Ein Zähler je Gut steigt um 1 je gekaufte
Einheit und sinkt um 1 je Erholungsintervall (wie `buyPct` heute). Einheiten, die den Zähler über das Kontingent
heben, kosten eine feste **Stufe** über dem Listenpreis, optional mit einer zweiten Stufe. Unterhalb des Kontingents
wird kein Anstieg innerhalb des Loses verrechnet. Edikt Handel bleibt multiplikativ. Der Denkmal-Zukauf zahlt die
gültige Stufe und hebt den Zähler nicht (R489 analog).

- **Spielgefühl:** Die Regel ist lesbar: «Kauf: noch 18 zum Listenpreis», darüber «Kauf 150 %». Im ersten
  15-min-Spiel sieht man das Kontingent, zahlt aber selten drauf. Der Biss liegt im **Stadtmassstab**: eine Insel nur
  aus dem Kontor versorgen (Gewürz vor Kontor II, Stoff/Rum/Glas ohne Kette, Anhang f). Verteilt und klein kaufen
  ist erlaubtes Planen und kein Exploit. Entartung: keine Arbitrage (Verkauf < Kauf, Anhang d); ein Zähler je Welt,
  also auch kein Umweg über ein zweites Kontor.
- **Grenzen:** Liegt das Kontingent über der grössten Last je Gut, die der Controller im Erholungsfenster kauft,
  bleiben `balance`, `balance-edicts` (arm/reich), `balance-crises`, `balance-upgrade`, `unlock-timeline` und
  `balance-monument` **bitgleich**: Mehrkosten genau 0, kein Sieg-Tick-Versatz. Wirkung gibt es nur in
  `balance-merchants` (`feedSpice` kauft Gewürz dauerhaft über 30/min, Anhang g), also dort, wo sie gewollt ist.
  Ziel 2 ≤ 12000 muss dort neu gemessen werden.
- **Messbarkeit mit dem heutigen Einlauf-Controller:** Bitgleichheit ist eine Ja/Nein-Prüfung (Pins unverändert,
  Mehrkosten = 0) und hängt nicht an einem Feinwert. Den Biss belegen Szenario-Tests am reinen Kern `buyQuote`
  (Grosskauf 100 Stück, Dauerkauf 60/min), deterministisch und ohne Controller. **Risiko (R553 V1):** Die Last je Gut
  stammt aus einem einzigen Lauf. R551 legt nahe, dass Krisen-Lasten über 15 Einheiten liegen (`BUY_RISE` 2 riss
  Krisen bei jedem `BUY_FREE` ≤ 30). Ein anderer Lauf kann darüber liegen. **Rückfall:** Ein Test «Controller-Zähler
  bleibt unter dem Kontingent» schlägt laut an, dann Kontingent anheben oder Option 1. Die Neumessung von
  `balance-merchants` setzt die Ensemble-Messung voraus (plan-TOOL-GATE-ENSEMBLE).
- **Aufwand:** Probe «grösste Controller-Last je Gut im Fenster, alle Szenarien» (lead-tech, ≈ 15 Tools, nach
  Ensemble); Werte Kontingent/Stufe (`design-economy-designer`, ≈ 30 Tools); Spec-Nachtrag Z2–Z4, §6, §7, AK
  (`design-spec-author` opus, neue Werte); Umsetzung auf `feat/i048-b` (Kern tauschen, UI-Text, Save-Bedeutung des
  Felds ändert sich → Versionsfrage [Tech]) ≈ 80–120 Tools. Insgesamt ≈ 1 Paket.

### Option 3 — Losweise statt stückweise

Regel: Z2 bleibt, aber das ganze Los zahlt den Anteil **vor** dem Kauf. Der Anstieg `n × BUY_RISE` gilt erst danach.

- **Spielgefühl:** Das erste Los ist immer zum Listenpreis, erst Wiederholungen werden teurer. Kleinste
  Code-Änderung (eine Zeile im Kern), `buyPct`, Save und UI bleiben.
- **Grenzen:** Der Controller kauft dasselbe Gut oft innerhalb von 20 s nach und zahlt dann weiter drauf. Das
  verschiebt alle Klasse-N-Läufe chaotisch, wie bei D-150. Ob die Grenzen halten, ist offen.
- **Messbarkeit:** Mit dem heutigen Controller nicht entscheidbar (Einzellauf, nicht monoton); geht nur mit
  Ensemble-Median.
- **Lücke:** Über `buy` mit n = 100 wird ein Grosskauf zum Listenpreis möglich (die UI bietet nur 1/10, der Kern
  nicht). Das widerspricht dem Zielsatz.
- **Aufwand:** Code ≈ 30 Tools, Messung ≈ 50+ Tools, Ergebnis ungewiss.

## Empfehlung

**Option 2**, unter zwei Bedingungen: (a) L0 stellt den Biss-Massstab um, weg von «Mehrkosten des Controllers»
(R547-Assert ≤ 15 %) hin zu «Controller bitgleich, Biss per Szenario-Test am Kern»; (b) Werte, Probe und Neumessung
`balance-merchants` erst nach der Ensemble-Messung. Ist die Controller-Last je Gut so hoch, dass das Kontingent über
dem Bedarf einer Stadt-Insel läge (Anhang c: > 30/min), gilt **Option 1**. Option 3 ist nicht empfohlen.

**Selbstprüfung Gate Brainstorming: BEDENKEN.** Säule Wirtschaft gestärkt; echte Wahl im Stadtmassstab (Anhang c/f);
Rückkopplung gewollt (Bremse nur über dem Kontingent). Bedenken: Im ersten 15-min-Spiel ist die Regel nur sichtbar,
aber selten spürbar (Abweichung vom Qualitätsmassstab). Das Kontingent beruht auf einem Einzellauf (Risiko mit
Rückfall oben). Einfachere Variante mit demselben Erlebnis: keine; Option 1 ist einfacher, liefert aber kein
Erlebnis.

**Nicht dazu:** Verkaufserholung (P-2 bleibt zurückgenommen), I-006, Märkte je Insel, Controller-Strategie,
Kalibrierung des Controllers.
