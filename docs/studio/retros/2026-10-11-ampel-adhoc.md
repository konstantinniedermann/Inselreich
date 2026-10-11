# Retro ampel-adhoc — 2026-10-11

- Art: adhoc (Kurz-Retro, `studio-coach`), Paket RETRO-AMPEL-1011
- Auslöser: `ampel:steuerung:S-2026-10-11-dc50be15`, `ampel:cache_write_5m:S-2026-10-10-f52039fc`
- Belege: `docs/studio/metriken/S-2026-10-10-5a00a316.md`, `…-f52039fc.md`, `S-2026-10-11-dc50be15.md`;
  [session-dc50be15-ende](2026-10-11-session-dc50be15-ende.md) B1/B3; `docs/studio/experimente.md` (E-049, E-054, E-057);
  `tools/studio/effort.py` (`ampel_incidents`). Nur Verweis: Plan-Modell (E-054, R523), L0-Kontext-Messauftrag (dc50be15).

## Befunde

### B1 · Steuerungsanteil: roh rot, bereinigt grün

- Beobachtung: roh 58,3 % (f52039fc), 66,2 % (dc50be15); bereinigt 23,4 % und 30,1 %, beide grün.
- Nach Rolle (Kostenanteil %, L0 · Leads · davon Plan/Design/Gate/Budget keins · Lead-Rest): 5a00a316: 19,3 · 29,6 ·
  0/0/0/0 · 29,6 (gelb); f52039fc: 12,2 · 46,1 · 2,8/22,7/9,5/0 · 11,1; dc50be15: 19,8 · 46,4 · 32,1/0,5/3,1/0,4 · 10,3.
- Deutung: Lead-Rest 10–11 Punkte, L0 12–20; rot machen Plan/Design-Leads (35–36 Punkte), die R475 gewollt hat.
  `effort.ampel_incidents` liest nur die Rohzeile, jeder Vorarbeits-Strang löst so einen Vorfall aus. L0-Anteil steigt
  (12,2 → 19,8 %, Kontext Max 272k → 379k): Messauftrag dc50be15, kein neuer.

### B2 · Cache-Write 5 min: dritte Retro in Folge, Hebel Pflicht (R316)

- Beobachtung: 27,2 % (5a00a316), 26,8 % (f52039fc) rot, 21,6 % (dc50be15) gelb; E-054 und E-057 laufen.
- Beleg (Cache-Write-Tokens je Rolle, Metrik-Dateien): lead-tech 3,31 von 4,47 M (74 %) in 5a00a316; lead-design 2,56 M
  und lead-tech 1,94 M von 5,53 M (81 %) in f52039fc; lead-tech 4,55 M (66 %) in dc50be15.
- Deutung: Vorarbeits-Leads (Plan, Design) schreiben den Hauptteil; 105 und 96 Turns bei `plan-m13-e2`, `plan-i048`
  gegen 55 bei `plan-tool-buendel-6`. Erstfassung gegen Nachtrag ist nicht trennbar (Ursache offen, V2 misst).

## Effizienz-Ampel

Steuerung rot (bereinigt 44,0 % gelb): V1. Cache-Write rot: V2. L0-Kontext Max 774k ist Historie (Session 379k,
Messauftrag dc50be15). Flake-Verdacht 5 (`terrain.test.ts`) ausserhalb dieser Retro. opus/Datei gelb: E-061, E-057.

## Vorschläge

- **V1 · Steuerungs-Auslöser liest die bereinigte Zeile.** `effort.ampel_incidents` meldet `steuerung` nur bei
  bereinigt rot in zwei Sessions; Rohzeile, Schwellen und Ausgabe bleiben (Messbarkeit gewahrt). Messgrösse: Rückrechnung
  auf die letzten 10 Metrik-Dateien ohne verpassten Fall, Vorfälle ≤ 1 je 5 Sessions. Regelbezug R316, E-049/R523. Kosten
  bei Irrtum: ein Steuerungsproblem versteckt sich im Planteil; Rückfall ein Revert. Werkzeug-Task, Ruling nötig.
- **V2 · Cache-Write: Messauftrag plus Turnkappe für Plan-Instanzen.** Messauftrag (Frist nächste Session-Retro):
  Plan-Instanzen > 60 Turns in Erstfassung und Nachtrag trennen. Experiment (wartet, drei laufen: E-057, E-059, E-061):
  Plan-Briefing „höchstens 60 Turns, Rest als frische Instanz mit Übergabe“; Messgrösse Cache-Write-Tokens je Plan
  ≤ 1,5 M, Gate-Plan-Befunde blockierend 0, über 3 Pläne. Rückfall: Satz entfernen. Kosten bei Irrtum: ≈ 0,2 M je Plan.

## lernen.md

Ergänzt (ohne neue Zeile): Auslöser liest die Rohzeile, E-049 bereinigt war in beiden Sessions grün.
