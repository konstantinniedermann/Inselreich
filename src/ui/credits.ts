// Credits (Spec 9.3): Liste aus Manifest und Schriften; nur createElement/textContent, kein innerHTML.

export interface CreditEntry {
  title: string;
  author: string;
  license: string;
  link: string;
  /** Bei CC BY: Vermerk über Änderungen am Werk. */
  changes?: string;
}

export interface FontCredit extends CreditEntry {
  id: string;
  files: string[];
}

/** Schriften mit Nachweis; Quelle der Wahrheit ist `docs/CREDITS.md` (Abschnitt Schriften, R109). */
export const FONT_CREDITS: readonly FontCredit[] = [
  {
    id: 'FO1',
    files: ['fonts/eb-garamond-400.woff2', 'fonts/eb-garamond-700.woff2'],
    title: 'EB Garamond (Schnitte 400 und 700, Subset latin)',
    author: 'The EB Garamond Project Authors (Georg Duffner, Octavio Pardo)',
    license: 'OFL-1.1',
    link: 'https://fontsource.org/fonts/eb-garamond',
  },
];

/** Lizenzkennung -> Link zum Lizenztext. */
export const LICENSE_LINKS: Record<string, string> = {
  'CC0-1.0': 'https://creativecommons.org/publicdomain/zero/1.0/',
  'CC-BY-4.0': 'https://creativecommons.org/licenses/by/4.0/',
  'OFL-1.1': 'https://openfontlicense.org/open-font-license-official-text/',
  MIT: 'https://opensource.org/license/mit',
};

/** Manifest-Einträge (Audio/Grafik) und Schriften zu einer Liste, nach Titel sortiert. */
export function creditEntries(
  manifest: readonly CreditEntry[],
  fonts: readonly CreditEntry[],
): CreditEntry[] {
  return [...manifest, ...fonts].sort((a, b) => a.title.localeCompare(b.title, 'de'));
}

/** Nur http(s)-Links werden verlinkt; alles andere erscheint als Text. */
const isWebLink = (u: string): boolean => /^https?:\/\//i.test(u);

function link(doc: Document, href: string, text: string): HTMLElement {
  if (!isWebLink(href)) {
    const span = doc.createElement('span');
    span.textContent = text;
    return span;
  }
  const a = doc.createElement('a');
  a.textContent = text;
  a.setAttribute('href', href);
  a.setAttribute('target', '_blank');
  a.setAttribute('rel', 'noopener');
  return a;
}

export function renderCredits(doc: Document, entries: readonly CreditEntry[]): HTMLElement {
  const root = doc.createElement('div');
  root.className = 'credits';
  const intro = doc.createElement('p');
  intro.textContent =
    entries.length > 0
      ? 'Grafik und Spiel: eigene Arbeit (prozedural). Musik, Klänge und Schrift: offen lizenziert, siehe unten.'
      : 'Grafik, Klang und Spiel: eigene Arbeit (prozedural). Fremde Assets sind derzeit nicht eingebunden.';
  root.appendChild(intro);
  const list = doc.createElement('ul');
  list.className = 'credits-list';
  for (const e of entries) {
    const li = doc.createElement('li');
    li.className = 'credits-item';
    const title = doc.createElement('strong');
    title.textContent = e.title;
    li.appendChild(title);
    li.appendChild(doc.createTextNode(` — ${e.author} · `));
    li.appendChild(link(doc, LICENSE_LINKS[e.license] ?? '', e.license));
    li.appendChild(doc.createTextNode(' · '));
    li.appendChild(link(doc, e.link, 'Quelle'));
    if (e.changes) li.appendChild(doc.createTextNode(` · Änderungen: ${e.changes}`));
    list.appendChild(li);
  }
  root.appendChild(list);
  return root;
}
