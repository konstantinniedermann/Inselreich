# Retro session f2a404fd-ende — 2026-10-11

- Art: session (Kurz-Retro, `studio-coach`, sonnet) · Auslöser: Session-Ende f2a404fd (R537–R552); Messauftrag R538 V2
- Datenbasis: `docs/studio/metriken/S-2026-10-11-f2a404fd.md`; `metrics.py --efficiency` (Historie); `docs/studio/rulings.md`
  R538, R542–R552; `docs/beobachtungen.md` („Seed wirkt nicht“); `docs/studio/gates.md`. Offene Vorfälle: keine.

## Effizienz-Ampel (Session / Historie)

- ROT Steuerung 53,6 % / 52,1 %, bereinigt 50,3 % (2 Instanzen herausgerechnet). Ursache: Fortsetzungs-Session ohne Plan-
  und Design-Phasen, L0 25,5 % bei einer Instanz. Hebel: R538 V1 (erst zwei rote bereinigte Sessions); dies ist die erste.
- ROT Cache-Write 5 min 26,1 % / 28,3 %. `rewrite_stats`: 12 Neuschreibungen = 0,64 M von 9,9 M (6,5 %). Ursache:
  Kontextaufbau, lead-tech 2,45 M von 3,25 M Cache-Write. Hebel: E-062 (wartet auf Platz); Messauftrag: je Lead-Phase trennen.
- GELB Produktivanteil 18,9 %; L0-Kontext Max 258k (Historie ROT 774k): Messauftrag R523 V2 läuft.
- ROT Flake-Verdacht 7 (Historie, `terrain.test.ts`): Prüfung in TOOL-BUENDEL-8 (R538 V3). Historie GELB opus 70,3 %
  (Session 47,3 % grün) und Grösste Datei 66,7 KB (Altlast-Diff, Session 28 KB): kein neuer Hebel.

## Messauftrag R538 V2 (Plan-Instanzen > 60 Turns)

- Beobachtung: keine Plan-Instanz über 60 Turns in dieser Session (`lead_stats`: grösste UI-TEXTE-1, 60 Turns,
  Umsetzung). Erstfassung gegen Nachtrag ist nicht trennbar. Deutung: kein Datenpunkt; E-062 bleibt wartend, Auftrag geht
  auf die nächste Session mit Plan (M14-E1).

## Prozessbefunde

- B1 · I-048 Schritt B (R549, R551). Beobachtung: Spec/Plan kalibrierten am Werkzeug und an Einzellauf-Gates; der
  Controller-Seed ist wirkungslos (Seeds 3/5/7/11 bitgleich); 27 Konfigurationen und die Totzone-Probe ohne Formel.
  Deutung: Gate Plan fragt Determinismus und Save (`gates.md` Z. 111), nicht, ob eine Wertgrenze mehr als einen
  unabhängigen Lauf trägt. **V1:** Prüffrage im Gate Plan/Spec „Worauf stützt sich jede Wertgrenze: mehr als ein Lauf
  (Start- oder Controller-Variante)? Sonst als Risiko benennen.“ Regelbezug gates.md Gate Plan, R547, R551. Kosten bei
  Irrtum: eine Frage je Plan. Messung: Kalibrier-Stopps ≤ 0 in den nächsten 2 Wertpaketen.
- B2 · Final-Review ZURÜCK ohne Re-Review (UI-TEXTE-1, R552). Beobachtung: Das Delta-Review kam erst, weil L0 es
  nachforderte. STUDIO.md Z. 361–368 regelt die Fix-Runde, `lead-tech.md` Z. 108 nicht das Re-Review. **V2:** Nach
  Final-Review ZURÜCK plant der Controller das Delta-Review (opus, `git diff <final-review-commit>..HEAD`) im Budget ein
  (STUDIO.md + `lead-tech.md`, L0-Ruling). Regelbezug Verfassung §9, R330 (4), R552. Kosten bei Irrtum: ein Delta-Review
  (≈ 8 Tools) je ZURÜCK. Messung: 2 von 2 ZURÜCK ohne Nachforderung durch L0.
- B3 · Genusfehler «Nur ein Amtsstube» (R550). Beobachtung: überstand Gate Spec (prüft AK-Eindeutigkeit, `gates.md`
  Z. 79–86) und Zwischenreview. Deutung: Einzelfall; der AK-Test über alle Defs (R550) fängt die Klasse bereits. **V3:**
  nur beobachten, bei zweitem Fall Gate-Frage „Vorlage mit eingesetztem Namen: ungünstigstes Genus als Beispiel im AK“.
- B4 · E-060 `deny` (R542, R543, R546). Beobachtung: Echtlauf 1 mit 5 Fehlblocks, nach TOOL-E060-FIX Echtlauf 2 mit 0
  (`experimente.md`). Deutung: Echtlauf vor Verschärfung hat Stillstand verhindert; Messung ab 2026-10-11 läuft, kein Befund.

## Vorschläge

V1 Gate-Frage Robustheit (annehmen empfohlen) · V2 Delta-Review nach ZURÜCK (annehmen, Handbuch-Minor) · V3 beobachten.
Keine neuen Experimente (E-057, E-060, E-061 laufen; E-062 wartet). `lernen.md` unverändert (kein belegter neuer Fall, 40 Zeilen).
