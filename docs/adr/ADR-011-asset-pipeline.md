# ADR-011: Asset-Pipeline — Ablage, Formate, Laden und Nachweis fremder Assets

Status: vorgeschlagen (angenommen mit dem Gate Plan M7) · Datum: 2026-09-30 · Spec:
[M7 Stimmung](../superpowers/specs/2026-09-30-m7-stimmung-design.md) (Abschnitte 2.3, 7.6, 8) · Rulings R77, R83,
R84 · Plan: [M7 Stimmung](../superpowers/plans/2026-09-30-m7-stimmung.md)

## Kontext

Bis M5 war alles prozedural oder synthetisch; das Bundle war die einzige Auslieferung. M7 bringt erstmals fremde,
offen lizenzierte Dateien ins Spiel: Musik, Umgebungsklänge, Signaltöne und eine Schrift (etwa 11 MB). Später kann
nach Spec 2.3 per Ruling fremde CC0-Grafik dazukommen. Ohne feste Regeln drohen drei Schäden:

- **Ladezeit:** 11 MB beim Start würden das sofort spielbare Spiel (M1-Versprechen) um Sekunden verzögern.
- **Lizenz:** Eine Datei ohne Nachweis oder mit veränderter Fassung verletzt ADR-006 und die Pflichten aus dem
  Lizenzurteil (Attribution, Änderungsvermerk, OFL neben der Schrift).
- **Unbemerkte Änderung:** Eine ersetzte oder neu kodierte Datei fällt im Review nicht auf (Binärdiff).

Die Entscheidung soll **formatneutral** sein, damit die Grafik-Tür aus Spec 2.3 ohne neues ADR dieselben Regeln
nutzt.

## Entscheidung

1. **Ablage:** Statische Assets liegen unter `public/<art>/<gruppe>/` (`public/audio/music`, `public/audio/amb`,
   `public/audio/sfx`, `public/fonts`; künftig z. B. `public/gfx/terrain`). Vite kopiert `public/` unverändert ins
   Build. Nichts davon wird in das JavaScript-Bundle importiert.
2. **Formate:** je Art genau ein Format, das alle Zielbrowser (Chrome, Firefox, Safari) ohne Rückfallkette spielen
   bzw. anzeigen: Audio MP3 (Musik Stereo 128 kbit/s CBR, Umgebung Mono 64 kbit/s, Signale Mono 96 kbit/s), Schrift
   WOFF2 (Latin-Subset), Grafik künftig PNG oder WebP (verlustfrei). Neue Formate brauchen einen Nachtrag hier.
3. **Grössenbudget:** `public/` gesamt ≤ 12 MB, Musik ≤ 9 MB, Umgebung und Signale ≤ 2,2 MB, Schrift ≤ 150 KB,
   jedes Musikstück ≤ 2,6 MB (Spec 8). Ein Vitest prüft das in CI (`tests/assets/assets.test.ts`). Eine
   Überschreitung ist ein roter Test, keine Warnung.
4. **Laden nach Bedarf, nie beim Start:** Beim Seitenaufruf lädt nichts aus dem Budget ausser der Schrift per CSS
   mit `font-display: swap`. Audio lädt erst nach der ersten Interaktion (`unlock()`), und nur, was gebraucht wird:
   Umgebungsschichten, deren Zielpegel einmal > 0 war, als ganz dekodierter `AudioBuffer` (kurze Schleifen), Musik
   **gestreamt** über ein Media-Element (`preload = 'none'`, nie ganz dekodiert). Fehlschläge fallen still auf den
   synthetischen Rückfall bzw. auf „keine Musik" zurück und werfen nie.
5. **Ein Manifest je Modul als Quelle der Wahrheit:** `src/audio/manifest.ts` listet jede Audiodatei mit `id`,
   `kind`, `file`, `phase?`, `title`, `author`, `license`, `link`, `changes?`; `src/ui/credits.ts` listet die
   Schrift und bildet mit dem Manifest den Credits-Dialog. Pfade werden über `import.meta.env.BASE_URL` aufgelöst
   (Pages-Unterpfad). Der Code kennt keine Dateinamen ausserhalb der Manifeste.
6. **Nachweis:** Jede Datei unter `public/` hat eine Zeile in `docs/CREDITS.md` (Quelle, Autor, Lizenz, Link,
   Änderungen) und einen Lizenztext in `docs/licenses/`; Lizenzen mit Beilagepflicht (OFL) liegen zusätzlich neben
   der Datei unter `public/`. Vor dem Einbau steht ein OK von `art-license-checker` (Veto, ADR-006).
7. **Reproduzierbarer Schnitt:** `tools/assets/m7-audio.sh` erzeugt jede Zieldatei aus einem lokalen Ordner mit
   Originalen (Argument), ohne Netzzugriff. Jede Zeile nennt Quelle, Schnittpunkte und Kodierparameter und
   dokumentiert damit die Änderungen für CC BY. Werkzeuge wie `ffmpeg` sind lokal, keine Projekt-Abhängigkeit
   (ADR-001), und laufen nicht in CI.
8. **Integrität:** `tests/assets/sha256.json` hält die SHA-256 jeder Datei unter `public/`. Ein Vitest vergleicht
   Liste und Dateien in beide Richtungen; jede neue oder geänderte Datei braucht einen bewussten Eintrag im selben
   Commit.
9. **Tests ohne Netz:** Die Audio-Module bekommen Netz und Medien über eine Injektion
   (`io = { fetchBuffer, mediaFactory, baseUrl }`); Vitest nutzt Fakes. Die Asset-Tests lesen nur das
   Dateisystem.

## Alternativen

- **Assets ins Bundle importieren** (Vite-Hashing): verworfen. Das Bundle würde um 11 MB wachsen und beim Start
  geladen; Streaming der Musik wäre unmöglich.
- **Mehrere Formate je Datei** (Ogg Vorbis plus MP3 als Rückfall): verworfen. Doppelte Grösse im Repo, doppelte
  Nachweise; MP3 läuft heute in allen Zielbrowsern.
- **Assets vom Original-Host laden** (Hotlink, z. B. `cdn.freesound.org`): verworfen. Fremde Verfügbarkeit,
  Tracking, und das Lizenzurteil verlangt Selbst-Hosting.
- **Git LFS:** verworfen. 11 MB rechtfertigen keinen zusätzlichen Dienst; Pages und CI müssten LFS können.
- **Nachweis nur in `docs/CREDITS.md`:** verworfen. Ohne Manifest-Test und Prüfsumme merkt niemand, wenn Datei und
  Nachweis auseinanderlaufen.

## Konsequenzen

- Das Spiel bleibt beim Start so schnell wie in M5; Ton und Musik kommen nach der ersten Interaktion.
- Jede neue Asset-Datei berührt mindestens fünf Stellen: Datei, Manifest, `docs/CREDITS.md`, Lizenztext,
  `sha256.json`. Die Tests erzwingen das.
- Das Repo wächst um etwa 11 MB Binärdaten. Ersetzte Dateien bleiben in der Git-Historie; deshalb werden Assets
  erst nach dem Lizenz-OK und dem Schnitt committet, nicht als Zwischenstände.
- Fremde Grafik (Spec 2.3) nutzt dieselben Regeln mit Unterordner `public/gfx/`, einem eigenen Budget-Posten (per
  Ruling) und einem Manifest im Render-Modul.
- arc42 §7 (Verteilung) und §8 (Assets und Laden) beschreiben die Pipeline (Paket D1).
