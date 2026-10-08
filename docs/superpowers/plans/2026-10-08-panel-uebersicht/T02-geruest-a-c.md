# T02 — Gerüst Teil A und C in `inspect.ts`

Spec §3 (G-2, G-3), §5, §7, Anhang 02 (B.1-B.3). Zonen `data-zone` head/stats/upgrade, Chips mit `data-tone`, Kacheln `data-stat`/`stat-*`, Pips, Balken mit `role=progressbar`,
Ausbau-Karte (`next`/`locked`/`max` nur über `hidden`), `<kbd data-field="upgrade-key">`. Kopf-Gerüst auch für Amtsstube und Kontor (nur Titel, C-2). `updateInspect` via `setField`; keine Knoten-Neuerzeugung.
`tests/ui/inspect.test.ts` bleibt ohne geänderte Erwartungen. Falls DOM-Test machbar (jsdom/Fake vorhanden?) Strukturtest ergänzen, sonst nur Browser-Check. Commit `feat:`.
