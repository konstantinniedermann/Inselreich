// Gemeinsame Hilfen des Studio-Dashboards: sichere DOM-Erzeugung (nur textContent/Attribute).

export const SVG_NS = 'http://www.w3.org/2000/svg';
// Eine Status-Tabelle für Kacheln, Status-Karte, Feed und Prozess-Graph (Spec Prozess-Graph, K4).
export const STATUS = {
  active: { emoji: '🔨', label: 'arbeitet' },
  delegated: { emoji: '📣', label: 'lässt arbeiten' },
  waiting: { emoji: '⏳', label: 'wartet' },
  blocked: { emoji: '🚧', label: 'steckt fest' },
  idle: { emoji: '☕', label: 'bereit' },
  done: { emoji: '✅', label: 'fertig' },
  failed: { emoji: '💥', label: 'gescheitert' },
  ended: { emoji: '🌙', label: 'Feierabend' },
};
export const INACTIVE = { emoji: '💤', label: 'döst' };
export const PACKAGE_STATUS = {
  open: { label: 'offen', tone: 'idle' },
  active: { label: 'in Arbeit', tone: 'active' },
  review: { label: 'im Review', tone: 'waiting' },
  blocked: { label: 'blockiert', tone: 'blocked' },
  done: { label: 'fertig', tone: 'done' },
};
export const DEPARTMENT_LABEL = {
  studio: 'Studio',
  production: 'Produktion',
  design: 'Design',
  tech: 'Technik',
  art: 'Grafik',
  qa: 'QA',
  extern: 'Extern',
};

// --- Hilfen -----------------------------------------------------------------

export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null || value === false) continue;
    if (key === 'class') node.className = value;
    else node.setAttribute(key, value);
  }
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

export function svg(tag, attrs = {}, ...children) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  for (const child of children) {
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

export function ago(seconds) {
  const s = Math.max(0, Number(seconds) || 0);
  if (s < 60) return `vor ${Math.round(s)} s`;
  if (s < 3600) return `vor ${Math.round(s / 60)} min`;
  return `vor ${Math.round(s / 3600)} h`;
}

export function clock(epochSeconds, withSeconds = true) {
  const date = new Date(epochSeconds * 1000);
  return date.toLocaleTimeString('de-CH', {
    hour: '2-digit',
    minute: '2-digit',
    ...(withSeconds ? { second: '2-digit' } : {}),
  });
}

export function knownStatus(status) {
  return Object.hasOwn(STATUS, status) ? status : 'idle';
}

// „✅ fertig"; mit idleSeconds (inaktiver Knoten) „💤 döst seit n min" (P13).
export function statusText(status, idleSeconds = null) {
  if (idleSeconds !== null) {
    return `${INACTIVE.emoji} ${INACTIVE.label} seit ${Math.floor(idleSeconds / 60)} min`;
  }
  if (!Object.hasOwn(STATUS, status)) return status || '–';
  return `${STATUS[status].emoji} ${STATUS[status].label}`;
}

export function knownDepartment(department) {
  return Object.hasOwn(DEPARTMENT_LABEL, department) ? department : 'extern';
}

export function statusBadge(status) {
  return el('span', { class: `badge st-${knownStatus(status)}` }, statusText(status));
}

export function deptChip(department) {
  const dep = knownDepartment(department);
  return el('span', { class: `chip dep dep-${dep}` }, DEPARTMENT_LABEL[dep]);
}

export function empty(text) {
  return el('p', { class: 'empty' }, text);
}

export function storageGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function storageSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* Speicher gesperrt: Einstellung gilt nur bis zum Neuladen */
  }
}

// Ein <select> nur neu aufbauen, wenn sich die Optionen ändern (sonst schliesst
// sich ein offenes Auswahlmenü bei jedem Poll); Auswahl bleibt erhalten.
export function syncSelect(select, options, wanted) {
  const signature = JSON.stringify(options);
  if (select.dataset.signature !== signature) {
    select.replaceChildren(...options.map(([value, label]) => el('option', { value }, label)));
    select.dataset.signature = signature;
  }
  const values = options.map(([value]) => value);
  const chosen = values.includes(wanted) ? wanted : values[0];
  if (select.value !== chosen) select.value = chosen;
  return chosen;
}
