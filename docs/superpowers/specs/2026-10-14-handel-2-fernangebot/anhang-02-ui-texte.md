# Anhang 02 · UI-Texte (Handel 2 · Fernangebot)

Stand: 2026-10-14 · Paket `design-handel-2` · Autor: design-spec-author. Wortlaut verbindlich für H2-UI und AK-H2-28.
Platzhalter in spitzen Klammern werden aus dem Zustand gebildet, nie hart im Code: `<Insel>` = `islandName(world, i)`,
`<Gut>` = `GOODS[g].name`, `<Menge>` und `<Wert>` aus `farOffer` bzw. `order`, `<x>` = Lager des Guts auf der
Fern-Insel, Zeiten `m:ss` über `formatGameTime` wie bisher. Beispiel jeweils Felsbucht, 15 Rum, 450, Frist 1700.

## T.1 Auftragskarte

| ID   | Zustand                                 | Text (Wortlaut)                                                                     | Bedienung / Darstellung                         |
| ---- | --------------------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------- |
| T-01 | Zufallsauftrag (mit oder ohne Angebot)  | unverändert: «Auftrag: 12 Holz · 84 · noch 1:00 · Lager x/12»                       | Auftragskarte, Knopf **Liefern** (aktive Insel) |
| T-02 | Fernangebot (eigene Karte, T.5)         | «Fernangebot <Insel>: <Menge> <Gut> · <Wert> · Frist m:ss · Lager x/<Menge>»        | **Fernkarte** mit Knopf **Annehmen**            |
| T-03 | Tooltip auf **Annehmen**                | «Ersetzt den Auftrag. Liefern nur am Kontor <Insel>. Der nächste Auftrag entfällt.» | —                                               |
| T-04 | Fernauftrag aktiv                       | «Fernauftrag <Insel>: <Menge> <Gut> · <Wert> · noch m:ss · Lager x/<Menge>»         | Knopf **Liefern** (liefert von der Fern-Insel)  |
| T-05 | Fernauftrag aktiv, knapp                | wie T-04                                                                            | Warnfarbe, wenn kein Kontor auf der Fern-Insel  |
| T-06 | kein Auftrag, nächster Auftrag entfällt | «Nächster Auftrag in m:ss» (Zeit bis `nextOrderTick`, R11)                          | wie heute                                       |

- «Frist m:ss» in T-02 ist die Restzeit bis `P + FAR_ORDER_DURATION`, also die Frist, die nach dem Annehmen gilt
  (Beispiel bei Periodenbeginn: «Frist 2:50»).
- «Lager x/<Menge>» in T-02 und T-04 liest immer das Lager der **Fern-Insel**, unabhängig von der aktiven Insel.
- Fehlt das Fernangebot, gibt es keine Fernkarte (kein leerer Platzhalter); die Auftragskarte ist bitgleich zu heute.
- Ein angenommener Fernauftrag steht **in der Auftragskarte** (T-04), nicht in der Fernkarte: `world.order` bleibt die
  eine Quelle, die Fernkarte zeigt nur ein offenes Angebot und verschwindet beim Annehmen.

## T.2 Meldungen

| ID   | Ereignis              | Text (Wortlaut)                                      | Art, Klang              |
| ---- | --------------------- | ---------------------------------------------------- | ----------------------- |
| T-07 | Annehmen erfolgreich  | «Fernauftrag angenommen: <Menge> <Gut> nach <Insel>» | Info, kein Klang        |
| T-08 | Fernauftrag geliefert | «Fernauftrag geliefert: <Menge> <Gut>, +<Wert>»      | Info, Klang `orderDone` |
| T-09 | Aktion fehlgeschlagen | Grund aus `Result.reason` (T.3)                      | Warnung, Klang `error`  |

Ereignis-Log (R633 A2 / R634): Die UI vergleicht nach jedem Schritt den Auftrag vor und nach dem Schritt (wie
`orderMessageFor`) und legt Einträge im `eventLog` an (`LogEntry`, `src/ui/crisisLog.ts`); die Sim bleibt unverändert
(R14). `Meldung` = `toast` ungleich `null`; nur solche Einträge zählen für den «Neu»-Zähler von I-100.

| ID   | Ereignis                              | Eintragstext (Wortlaut)                                   | `toast`, Klang      |
| ---- | ------------------------------------- | --------------------------------------------------------- | ------------------- |
| T-16 | Fernauftrag geliefert (Spieleraktion) | wie T-08: «Fernauftrag geliefert: <Menge> <Gut>, +<Wert>» | `info`, `orderDone` |
| T-17 | angenommener Fernauftrag verfallen    | «Fernauftrag verfallen: <Menge> <Gut> nach <Insel>»       | `info`, kein Klang  |
| T-18 | Fernangebot unangenommen verfallen    | «Fernangebot verfallen: <Menge> <Gut> nach <Insel>»       | `null` (nur Log)    |

- **Erkennung T-17:** Auftrag vor dem Schritt hat `island`, `world.tick > due` des alten Auftrags, und `world.order` ist
  `null` oder hat eine andere `period`. Die Lieferung setzt den Merker «alter Auftrag» in der UI auf `null`
  (Aktionshandler), damit eine Lieferung im Tick `due` nicht als Verfall zählt.
- **Erkennung T-18:** Angebot vor dem Schritt war da, nach dem Schritt nicht, und `world.tick >` Frist des
  Zufallsauftrags (`due`), ohne Annehmen und ohne Lieferung des Zufallsauftrags (R4 a gegen R4 b, c).
- T-16 und T-08 sind derselbe Text und **ein** Eintrag, keine Doppelmeldung. T-07 (Annehmen) bleibt Meldung ohne
  Log-Eintrag. Zufallsaufträge und Stammkunde bekommen keinen neuen Eintrag (nicht Teil dieser Spec).
- Der Verfall eines **Zufallsauftrags** bleibt ohne Meldung und Eintrag wie heute.
- **Grenze (nicht in diesem Paket gelöst):** `crisisLogVisible` verlangt `crisisLevel !== 'off'` und
  `tick ≥ CRISIS_FIRST_TICK`; ohne Krisen ist das Log unsichtbar. Einträge entstehen trotzdem (T-16, T-17 haben ihre
  Meldung), T-18 ist dann nirgends zu sehen. Das Log wird nicht gespeichert (leer nach Laden). Beobachtung 2026-10-14
  «keine Auftragsereignisse im Ereignis-Log».

## T.3 Fehlgründe der Sim (wörtlich, aus `src/sim/orders.ts`)

| ID   | Aktion           | Grund                                                                   |
| ---- | ---------------- | ----------------------------------------------------------------------- |
| T-10 | `acceptFarOrder` | Sperrgrund aus `functionLock(world, 'orders')`                          |
| T-11 | `acceptFarOrder` | «Kein Fernangebot»                                                      |
| T-12 | `acceptFarOrder` | «Vertrag läuft»                                                         |
| T-13 | `acceptFarOrder` | «Kein Kontor auf <Insel>» (`noKontorTrade`, unverändert)                |
| T-14 | `deliverOrder`   | «Nur auf <Insel>»                                                       |
| T-15 | `deliverOrder`   | «Kein Kontor auf <Insel>», «Nicht genug Ware auf <Insel>» (unverändert) |

## T.5 Fernkarte: Lage und Höhe bei 1280×720 (R634 (2b))

Gemessen an den Playtest-Screenshots (`.studio/qa/playtest-i047/`, 1280×720, Kartenfläche y 84–660): Der Kartenslot
oben rechts liegt bei x 676–976 (300 px breit), erste Karte ab y 92, Abstand zwischen Karten 7 px.

| Karte (heute)                                  | Höhe      | Beleg                                          |
| ---------------------------------------------- | --------- | ---------------------------------------------- |
| Auftragskarte mit **Liefern**                  | 91 px     | `krise/auftragskarte`, y 92–183                |
| «Nächster Auftrag in m:ss» (ohne Knopf)        | ≈ 33 px   | `auftragskarte`, y 92–125                      |
| Stammkunde-Angebot oder -Vertrag mit 2 Knöpfen | 92–109 px | `vertragskarte` 92–183, `angebotskarte` 92–201 |
| Krisenkarte «aus» / mit Krisenstand            | 38 px     | `vertragskarte`, y 190–228                     |
| Krisenkarte bei Sturmwarnung (6 Zeilen)        | 100 px    | `krise/auftragskarte`, y 190–290               |

- **Reihenfolge von oben:** (1) Auftrags-/Stammkunde-Karte (eine, wie heute), (2) **Fernkarte**, (3) Krisenkarte. Die
  Fernkarte sitzt unter der Auftragskarte, weil das Angebot den Auftrag ersetzt; die Krisenkarte bleibt zuunterst.
- **Breite 300 px** wie die anderen Karten. T-02 hat ≤ 70 Zeichen, bricht auf zwei Zeilen um; Höhe der Fernkarte
  **≤ 110 px** (zwei Textzeilen plus Knopfzeile, vergleichbar mit der Stammkunde-Angebotskarte mit 109 px).
- **Nie vier Karten:** Fernangebot und Stammkunde-Angebot oder -Vertrag schliessen sich aus (R15). Höchststapel im Slot
  ist damit Auftrag 91 + 7 + Fern 110 + 7 + Sturm 100 = **315 px**, Unterkante y 407 von 660: 253 px Luft, keine
  Überdeckung der Toast-Spalte links (x 352–642) und der Bedienleiste unten.
- Zusätzliche Meldungen (Toasts oben Mitte) liegen in einer eigenen Spalte und bleiben unberührt.
- Der Stapel wird nicht gekappt: Die Fernkarte erscheint immer, solange `farOffer` besteht. Bei Fenstern unter
  1280 px gilt nur «stürzt nicht ab» (CLAUDE.md, Desktop-first).

## T.4 Doku-Texte (Vorlage für H2-UI, nicht Teil dieser Spec-Änderung)

README, Abschnitt Handelsaufträge, neuer Unterabschnitt «Fernangebot» (Vorschlag):

> Hast du ein Kontor auf einer fernen Insel, steht neben dem Auftrag oft ein **Fernangebot**: eine grosse Menge des
> Guts, das diese Insel mag (Möweninsel Stoff, Felsbucht Rum, Weidenau Glas). **Annehmen** ersetzt den Auftrag. Du
> hast dann 2:50 ab Auftragsbeginn Zeit und lieferst nur am Kontor dieser Insel; der nächste Auftrag entfällt. Ein
> verpasster Fernauftrag kostet nichts ausser diesem Auftrag.
