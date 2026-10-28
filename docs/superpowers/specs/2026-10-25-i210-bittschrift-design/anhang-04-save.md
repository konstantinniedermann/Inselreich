# Anhang 04 · Save-Prüfregeln `petitions`

Gehört zu [I-210 Bittschrift](../2026-10-25-i210-bittschrift-design.md) §6 und AK-BS-15. Verstösst ein Stand gegen eine
Regel, liefert `deserialize` `{ ok: false, reason: 'Beschädigter Spielstand' }`, nie einen Wurf.

- `on` boolean; `next` null oder ganze Zahl > `tick`; bei `on: false` sind `open` und `effects` leer und `next` null;
- `open.length ≤ PETITION_MAX_OPEN`; je Marke `id ∈ PETITION_IDS`, keine Id doppelt, `drawnAt` ganz und
  `tick − PETITION_ANSWER − max(delay) ≤ drawnAt ≤ tick`, `amount` ganz ≥ 0;
- ohne `answer` gilt `drawnAt + PETITION_ANSWER > tick` und kein `dueTick`; mit `answer ∈ {'yes','no'}` gilt
  `tick < dueTick ≤ tick + max(delay)`;
- `anchor` nur bei Bitten mit Anker, ganze Zahl (ein inzwischen abgerissener Anker ist gültig, Spec §3.4);
- `effects.length ≤ 2 × PETITION_IDS.length`; je Eintrag `id` gültig, `answer` gültig, `tick < until ≤ tick + Dauer`
  (Dauer = `duration` bei «Ja», `FRUGAL_TICKS` bei «Nein»).
