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
