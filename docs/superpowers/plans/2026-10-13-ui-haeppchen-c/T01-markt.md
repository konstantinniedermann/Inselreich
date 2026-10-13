# T01 · Marktvergleich auf der Angebotskarte (AK-HC-01 bis AK-HC-05)

Umsetzer `tech-ui-engineer`. Dateien: nur `src/ui/order.ts`, `tests/ui/order.test.ts`.

1. Zeitmessung `order.test.ts` vorab (`.studio/qa/ui-haeppchen-c/zeit-vor.json`).
2. **Rot zuerst:** in `tests/ui/order.test.ts` den Angebots-Wortlaut (um Zeile 113 und 120) auf den neuen Text umstellen und Tests für AK-HC-01 bis 04 ergänzen (Holz, Rum; Boom per `world.crisis`; `sellPct` gesenkt; Erzeugung 0 und > 0 mit gebautem, angebundenem Holzfäller auf der Lieferinsel; Fremdinsel). Roten Lauf festhalten.
3. `orderCardText`, Zweig `offer`: `sellPrice(world, offer.good, 1)` und `perMinute(goodsBalance(world, offer.island)[offer.good].produced, GOODS_BALANCE_TICKS)` einsetzen. Format: `… zu 6 je Stück · Markt jetzt ≈ 5 · Erzeugung 31 / min · Angebot noch m:ss`; bei 0 «keine Erzeugung». Keine Formel in `src/ui/`; Auftrags- und Vertragszweige unverändert.
4. Rechenzeit: `goodsBalance` läuft über alle Gebäude (≈ 1000), aber nur bei offenem Angebot; Messung ins Review (Ziel < 1 ms je Aufruf).
5. Browser-Beleg AK-HC-05. Neue Tests lokal × 3 (R593). `make check` Exit 0.
