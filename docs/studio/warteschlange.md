# Nutzerentscheid-Warteschlange

Hier stehen die Fragen, die laut [Verfassung §5](VERFASSUNG.md#5-autonomie-und-nutzerentscheid-warteschlange)
nur der Nutzer entscheidet: Folgeissues, Lizenz-Grenzfälle,
Änderungen der Verfassung und ein Richtungswechsel des Spiels. Das Team wartet nicht auf die
Antwort: Nur das betroffene Paket bleibt zurückgestellt, alles andere läuft weiter.

**Format** — ein Abschnitt je Eintrag, angelegt mit `python3 tools/studio/log.py queue …`
(Ablauf im Handbuch [STUDIO.md](STUDIO.md), Abschnitt „Autonomie"):

```markdown
## N-<nnn> · <status> · <JJJJ-MM-TT> · <Kurztitel>

- Frage: <was zu entscheiden ist>
- Empfehlung: <was das Team vorschlägt>
- Begründung: <warum>
- Kosten des Wartens: <was liegen bleibt, solange keine Antwort da ist>
- Blockiert: <Paket-ID> (oder „nichts")
- Von: <rolle>
- Antwort: –
```

**Status:**

| Status        | Bedeutung                                                   |
| ------------- | ----------------------------------------------------------- |
| `offen`       | wartet auf die Antwort des Nutzers                          |
| `beantwortet` | Antwort ist eingetragen, der Projektleiter setzt sie um     |
| `umgesetzt`   | Antwort ist umgesetzt, das blockierte Paket ist freigegeben |

**So antwortest du (Nutzer):** In einer beliebigen Session schreiben „`N-001: <Antwort>`" oder
die Zeile „Antwort" hier ausfüllen. Der Projektleiter trägt die Antwort ein, setzt sie um und
schliesst den Eintrag.

---

## N-001 · umgesetzt · 2026-09-30 · Verfassung 1.0 bestätigen

- Frage: Bestätigst du die Verfassung 1.0 (docs/studio/VERFASSUNG.md), insbesondere §5 Autonomie mit Vorrang vor ../CLAUDE.md und §7 Push auf main nach grünem Check?
- Empfehlung: bestätigen
- Begründung: Nutzerauftrag Session 1.5
- Kosten des Wartens: keine — gilt vorläufig
- Blockiert: nichts
- Von: studio-director
- Antwort: bestätigt mit zwei Änderungen: (1) §3/§5 — neue Abhängigkeiten darf L0 selbst schaffen, wenn er die Entscheidung tragen kann und keine Alternative Sinn macht; (2) neue Regel: möglichst hoch parallelisieren und delegieren, Effizienz ist oberstes Credo des Projektleiters

## N-90 · offen · 2026-10-01 · Asset-Quellen im Netzwerk freigeben (Q-X1A-NETZ)

- Frage: Die Netzwerk-Policy der Cloud-Umgebung sperrt freesound.org, cdn.freesound.org, opengameart.org, fonts.google.com und archive.org. Ohne Zugriff kann X1a (Musik, Umgebungsklänge, Schrift) nicht neu erstellt werden. Hosts freigeben oder Originaldateien bereitstellen?
- Empfehlung: In den Umgebungseinstellungen (Umgebungsmenü in der Titelleiste, Edit, Network access) diese Hosts zu den erlaubten Domains hinzufügen.
- Begründung: Lizenzurteil und Dateien aus dem alten Container verloren (R107).
- Kosten des Wartens: Ton bleibt bei prozeduralen Rückfällen, Schrift bei Georgia; übrige M7-Pakete laufen weiter.
- Blockiert: M7-X1a, X1b, Musik in A3
- Von: lead-art
- Antwort: –

## N-91 · offen · 2026-10-01 · Leistung auf deinem Rechner prüfen (nach dem Merge)

- Frage: Nach dem Merge von M7 auf Pages: Spiel mit ?perf=1 öffnen, Szenario Sturm, Zoom ganz heraus, 1920×1080 — liegen die Bilder pro Sekunde bei mindestens 30? (Cloud-Messung ohne GPU: 27 fps, Zeichenzeit nur 4 ms.)
- Empfehlung: Nach dem Merge kurz im Browser prüfen; ich liefere eine einfache Anleitung mit.
- Begründung: AK-U3-09/AK-R4-06 sind ohne Grafikkarte nicht bewertbar (R116).
- Kosten des Wartens: Keine Blockade; bei <30 fps folgt ein Leistungspaket.
- Blockiert: nichts (Nachprüfung)
- Von: lead-qa
- Antwort: –
