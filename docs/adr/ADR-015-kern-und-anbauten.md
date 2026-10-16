# ADR-015: Kern und Anbauten — Lockerung von «Silhouette = Identität»

Status: angenommen (R688) · Datum: 2026-10-16 · Paket: design-ortsrand · Autor: lead-art · Grundlage:
[Ortsrand-Brainstorming](../superpowers/specs/2026-10-16-ortsrand-brainstorming.md) (Idee G1), Nutzerentscheid N2
vom 2026-10-16 · Betrifft: `src/render/variants.ts` (Kopfkommentar), H-R7 (Programm Nutzerfeedback G1/G8)

## Kontext

Die Art-Direction-Regel aus dem Programm Nutzerfeedback (G1/G8, H-R7) lautet: «Die Silhouette ist die Identität, die
Oberfläche trägt die Varianz.» `variants.ts` setzt sie streng um. Eine Variante ändert nur Farbtöne, Fensterläden und
Material, «nie Dachform, Firstrichtung, Höhe oder Umriss». Tests verriegeln das (`tests/render/variants.test.ts`
H-R7 AK3/AK4: Hülle und überdeckte Fläche in allen Varianten gleich, Picking kennt die Variante nicht).

Der Nutzer findet die Gebäude zu gleichförmig («zwei Holzfällerhäuser können eigentlich ganz verschieden aussehen»).
Er hat entschieden: Kern + Anbauten. Der Grundkörper bleibt erkennbar, Anbauten wechseln (Schuppen, Vordach,
Holzstapel, Zaun, Ausrichtung). Die Regel wird gelockert, nicht aufgehoben.

Randbedingungen:

- Der Gebäude-Sprite-Cache ist ausgereizt. Die volle Matrix aller Typen × Stufen × 4 Varianten liegt bei Zoom 2 /
  DPR 2 bei ≈ 1,36 × `SPRITE_CACHE_MAX_BYTES` (64 MiB, LRU-gedeckelt, Testschranke 1,4). Mehr Varianten oder grössere
  Hüllen im Cache sind nicht tragbar.
- Picking prüft die gezeichneten Kern-Polygone (R113). Eine Hülle, die je Variante wechselt, verlangt Picking je
  Variante.
- Ein Anbau, der auf eine freie Nachbarkachel reicht, muss weichen, sobald dort gebaut wird (Nutzerentscheid N1). Der
  Cache-Schlüssel kennt keine Nachbarn.

## Entscheidung

1. **Kern = Identität.** Dachform, Firstrichtung, Höhe und Umriss des **Kerns** bleiben je Typ und Stufe fest. Der
   Kern ist das heutige Sprite samt Farbvariante. Alles, was H-R7 heute verlangt, gilt für den Kern unverändert
   (AK1–AK7 bleiben grün).
2. **Anbauten tragen die Gestaltvarianz.** Ein Gebäude darf 0–2 Anbauten haben (Schuppen, Vordach, überdachter
   Holzstoss, Zaungarten, Backofen, Laube u. ä.). Für sie gilt:
   - Sie stehen an einer Seite des Kerns, deren Nachbarkachel frei ist, und weichen, sobald diese Kachel bebaut wird.
   - Ihre Höhe ist höchstens 0,6 × Traufhöhe des Kerns, nie über dem First. Auf den Vorderkacheln (+x, +y, +x+y)
     sind nur flache Anbauten erlaubt (Zaungarten, Beet). Kein Anbau verdeckt Tür, Fenster oder Signale.
   - Dachfamilie und Wandton folgen dem Kern. Ein Anbau darf ein Gebäude nicht wie einen anderen Typ aussehen
     lassen.
   - Sie sind deterministisch aus `hash2(seed + Salz, x, y)` und den freien Seiten. Es gibt keinen Sim-Zufall und kein
     Save-Feld.
   - Sie sind eigene `decor`-Elemente im sortierten Durchgang, **nicht** Teil des Gebäude-Sprites. `VARIANT_COUNT`,
     `spriteKey` und `SPRITE_CACHE_MAX_BYTES` bleiben unverändert. Sie sind nicht pickbar, Picking bleibt am Kern.
3. **«Ausrichtung»** heisst die Seite, an der Anbauten und Hofkram liegen. Eine Spiegelung des Kerns (Firstrichtung)
   ist **nicht** Teil dieser Lockerung.
4. Der Kopfkommentar von `variants.ts` wird beim Umsetzen auf «Kern = Identität, Oberfläche und Anbauten tragen die
   Varianz» angepasst und verweist auf dieses ADR.

## Begründung

- Die Nutzerwirkung «verschieden gebaut» entsteht durch die Gestalt am Rand, nicht durch den Farbton. Anbauten
  liefern Gestalt, ohne die Wiedererkennung des Typs anzutasten.
- Ausserhalb des Sprite-Caches kosten Anbauten nur kleine, geteilte Stempel. Das Cache-Budget der Kerne bleibt
  unberührt.
- Weil Anbauten an freien Seiten hängen, reagieren sie natürlich auf die Bebauung: Eine allein stehende Hütte wächst
  in die Breite, im dichten Ort bleibt der Kern. Das ist das Bild «gewachsene Siedlung».

## Verworfene Alternativen

- **Anbauten im Kern-Sprite** (mehr Varianten mit eigener Hülle): sprengt das Cache-Budget (≈ ×1,5–2), bricht
  AK3/AK4 und braucht Picking je Variante. Kann nicht auf Nachbarn reagieren.
- **Kern spiegeln** (Firstrichtung je Gebäude): verdoppelt den Cache, braucht gespiegelte Geometrie bei unverändertem
  Licht (Stilrahmen S1) in allen Silhouetten-Zeichnern und ändert die Identität. Bleibt Option für ein späteres
  Paket mit eigenem Budgetantrag.
- **Regel unverändert lassen:** widerspricht Nutzerentscheid N2.

## Konsequenzen

- Positiv: sichtbare Gestaltvarianz je Gebäude, kein Cache-Mehrbedarf im Gebäude-Cache, Picking und H-R7-Tests
  unverändert.
- Negativ: Ein Klick auf einen Anbau trifft die freie Bodenkachel statt des Gebäudes. Das ist gewollt (der Platz ist
  bebaubar), muss aber im Playtest beobachtet werden. Die Typ-Erkennbarkeit braucht einen Blindtest je Release.
- Neu zu prüfen: Höhenregel, Weichen beim Bebauen, Typ-Erkennbarkeit über alle Anbau-Kombinationen (Abnahme A2, A7,
  A8 im Brainstorming).
