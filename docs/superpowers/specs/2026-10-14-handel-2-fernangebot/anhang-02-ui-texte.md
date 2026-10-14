# Anhang 02 · UI-Texte (Handel 2 · Fernangebot)

Stand: 2026-10-14 · Paket `design-handel-2` · Autor: design-spec-author. Wortlaut verbindlich für H2-UI und AK-H2-28.
Platzhalter in spitzen Klammern werden aus dem Zustand gebildet, nie hart im Code: `<Insel>` = `islandName(world, i)`,
`<Gut>` = `GOODS[g].name`, `<Menge>` und `<Wert>` aus `farOffer` bzw. `order`, `<x>` = Lager des Guts auf der
Fern-Insel, Zeiten `m:ss` über `formatGameTime` wie bisher. Beispiel jeweils Felsbucht, 15 Rum, 450, Frist 1700.

## T.1 Auftragskarte

| ID   | Zustand                                 | Text (Wortlaut)                                                                     | Bedienung / Darstellung                         |
| ---- | --------------------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------- |
| T-01 | Zufallsauftrag mit Fernangebot, Zeile 1 | unverändert: «Auftrag: 12 Holz · 84 · noch 1:00 · Lager x/12»                       | Knopf **Liefern** wie heute (aktive Insel)      |
| T-02 | Zufallsauftrag mit Fernangebot, Zeile 2 | «Fernangebot <Insel>: <Menge> <Gut> · <Wert> · Frist m:ss · Lager x/<Menge>»        | Knopf **Annehmen**; Zeile in gedämpfter Schrift |
| T-03 | Tooltip auf **Annehmen**                | «Ersetzt den Auftrag. Liefern nur am Kontor <Insel>. Der nächste Auftrag entfällt.» | —                                               |
| T-04 | Fernauftrag aktiv                       | «Fernauftrag <Insel>: <Menge> <Gut> · <Wert> · noch m:ss · Lager x/<Menge>»         | Knopf **Liefern** (liefert von der Fern-Insel)  |
| T-05 | Fernauftrag aktiv, knapp                | wie T-04                                                                            | Warnfarbe, wenn kein Kontor auf der Fern-Insel  |
| T-06 | kein Auftrag, nächster Auftrag entfällt | «Nächster Auftrag in m:ss» (Zeit bis `nextOrderTick`, R11)                          | wie heute                                       |

- «Frist m:ss» in T-02 ist die Restzeit bis `P + FAR_ORDER_DURATION`, also die Frist, die nach dem Annehmen gilt
  (Beispiel bei Periodenbeginn: «Frist 2:50»).
- «Lager x/<Menge>» in T-02 und T-04 liest immer das Lager der **Fern-Insel**, unabhängig von der aktiven Insel.
- Fehlt das Fernangebot, ist die Karte bitgleich zu heute (keine leere zweite Zeile).

## T.2 Meldungen

| ID   | Ereignis              | Text (Wortlaut)                                      | Art, Klang              |
| ---- | --------------------- | ---------------------------------------------------- | ----------------------- |
| T-07 | Annehmen erfolgreich  | «Fernauftrag angenommen: <Menge> <Gut> nach <Insel>» | Info, kein Klang        |
| T-08 | Fernauftrag geliefert | «Fernauftrag geliefert: <Menge> <Gut>, +<Wert>»      | Info, Klang `orderDone` |
| T-09 | Aktion fehlgeschlagen | Grund aus `Result.reason` (T.3)                      | Warnung, Klang `error`  |

Der Verfall eines Fernauftrags erzeugt wie der Verfall eines Zufallsauftrags keine Meldung.

## T.3 Fehlgründe der Sim (wörtlich, aus `src/sim/orders.ts`)

| ID   | Aktion           | Grund                                                                   |
| ---- | ---------------- | ----------------------------------------------------------------------- |
| T-10 | `acceptFarOrder` | Sperrgrund aus `functionLock(world, 'orders')`                          |
| T-11 | `acceptFarOrder` | «Kein Fernangebot»                                                      |
| T-12 | `acceptFarOrder` | «Vertrag läuft»                                                         |
| T-13 | `acceptFarOrder` | «Kein Kontor auf <Insel>» (`noKontorTrade`, unverändert)                |
| T-14 | `deliverOrder`   | «Nur auf <Insel>»                                                       |
| T-15 | `deliverOrder`   | «Kein Kontor auf <Insel>», «Nicht genug Ware auf <Insel>» (unverändert) |

## T.4 Doku-Texte (Vorlage für H2-UI, nicht Teil dieser Spec-Änderung)

README, Abschnitt Handelsaufträge, neuer Unterabschnitt «Fernangebot» (Vorschlag):

> Hast du ein Kontor auf einer fernen Insel, steht neben dem Auftrag oft ein **Fernangebot**: eine grosse Menge des
> Guts, das diese Insel mag (Möweninsel Stoff, Felsbucht Rum, Weidenau Glas). **Annehmen** ersetzt den Auftrag. Du
> hast dann 2:50 ab Auftragsbeginn Zeit und lieferst nur am Kontor dieser Insel; der nächste Auftrag entfällt. Ein
> verpasster Fernauftrag kostet nichts ausser diesem Auftrag.
