# T02 · Freigabedatei, Selbstschutz, Registrierung (V1)

Strang A · blocked-by T1 · Test-first (`make studio-test`).

**Freigabe:** Datei `<studio_home>/push-freigabe` (also `.studio/push-freigabe`, vom Hauptrepo aus, `paths.studio_home()`), eine Zeile: `<Hash oder Kurzhash ≥ 7 Zeichen> <Ruling oder Grund>`. Der Hook erlaubt den main-Push, wenn der aufgelöste Hash mit dem Präfix beginnt, und **verbraucht** die Datei dabei (löschen, Ereignis `kind: "push_freigabe"` mit Hash und Grund schreiben); einmal gültig. Leere, kaputte oder nicht passende Datei: bleibt liegen, Regel aus T1 gilt. Löschfehler → trotzdem erlauben, Ereignis mit `used: false`.

**Selbstschutz (best effort, wie der Guard):** Hat die Hook-Eingabe `agent_id` und nennt der Bash-Befehl oder `file_path` den Text `push-freigabe`, weist der Hook ab («Freigabe legt nur L0 an»). L0 (kein `agent_id`) darf schreiben. Der Hook warnt im Text, dass das kein Schutz gegen Absicht ist (Verfassung §1.3: Schutz gegen Versehen).

**Registrierung:** Neuer Eintrag in `.claude/settings.json` unter `PreToolUse`, Matcher `Bash|Write|Edit|MultiEdit`, Befehl `python3 "$CLAUDE_PROJECT_DIR/tools/studio/pushgate.py" 2>/dev/null || true`, Timeout 5 (Form wie `waitguard`). Bestehende Einträge unverändert (Diff prüfen: nur Zeilen hinzugefügt). Ein Test liest `settings.json` und prüft, dass `pushgate.py` registriert ist und `guard.py` weiterhin vorkommt.

**Tests (rot zuerst):** Freigabe mit Kurzhash erlaubt und verbraucht; zweiter Push desselben Hashs abgewiesen; Freigabe für anderen Hash = keine Wirkung; Agent schreibt `echo x > .studio/push-freigabe` = abgewiesen, ohne `agent_id` erlaubt; Löschfehler (Verzeichnis schreibgeschützt) erlaubt trotzdem.
Nach dem Merge: Handbuch-Zeile (STUDIO.md, Push-Absatz) und `production-integrator.md` ergänzt `studio-coach`; nicht Teil dieses Tasks.
