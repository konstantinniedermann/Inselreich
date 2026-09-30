// Studio-Dashboard: pollt /api/state alle 2 s und zeichnet alle Ansichten neu.
// Sicherheit: Daten ausschliesslich per textContent/Attribut, nie per innerHTML.

const POLL_MS = 2000;
const FETCH_TIMEOUT_MS = 6000;
const SVG_NS = 'http://www.w3.org/2000/svg';
const STATUS_LABEL = {
  active: 'aktiv',
  delegated: 'delegiert',
  waiting: 'wartet',
  blocked: 'blockiert',
  idle: 'bereit',
  done: 'fertig',
  failed: 'fehlgeschlagen',
  ended: 'beendet',
};
const PACKAGE_STATUS = {
  open: { label: 'offen', tone: 'idle' },
  active: { label: 'in Arbeit', tone: 'active' },
  review: { label: 'im Review', tone: 'waiting' },
  blocked: { label: 'blockiert', tone: 'blocked' },
  done: { label: 'fertig', tone: 'done' },
};
const DEPARTMENT_LABEL = {
  studio: 'Studio',
  production: 'Produktion',
  design: 'Design',
  tech: 'Technik',
  art: 'Grafik',
  qa: 'QA',
  extern: 'Extern',
};
const LEVEL_LABEL = ['L0', 'L1', 'L2'];

// --- Hilfen -----------------------------------------------------------------

function el(tag, attrs = {}, ...children) {
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

function svg(tag, attrs = {}, ...children) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  for (const child of children) {
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

function ago(seconds) {
  const s = Math.max(0, Number(seconds) || 0);
  if (s < 60) return `vor ${Math.round(s)} s`;
  if (s < 3600) return `vor ${Math.round(s / 60)} min`;
  return `vor ${Math.round(s / 3600)} h`;
}

function clock(epochSeconds, withSeconds = true) {
  const date = new Date(epochSeconds * 1000);
  return date.toLocaleTimeString('de-CH', {
    hour: '2-digit',
    minute: '2-digit',
    ...(withSeconds ? { second: '2-digit' } : {}),
  });
}

function knownStatus(status) {
  return Object.hasOwn(STATUS_LABEL, status) ? status : 'idle';
}

function knownDepartment(department) {
  return Object.hasOwn(DEPARTMENT_LABEL, department) ? department : 'extern';
}

function statusBadge(status) {
  const known = Object.hasOwn(STATUS_LABEL, status);
  return el(
    'span',
    { class: `badge st-${known ? status : 'idle'}` },
    known ? STATUS_LABEL[status] : status || '–',
  );
}

function deptChip(department) {
  const dep = knownDepartment(department);
  return el('span', { class: `chip dep dep-${dep}` }, DEPARTMENT_LABEL[dep]);
}

function empty(text) {
  return el('p', { class: 'empty' }, text);
}

function storageGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function storageSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* Speicher gesperrt: Einstellung gilt nur bis zum Neuladen */
  }
}

// Ein <select> nur neu aufbauen, wenn sich die Optionen ändern (sonst schliesst
// sich ein offenes Auswahlmenü bei jedem Poll); Auswahl bleibt erhalten.
function syncSelect(select, options, wanted) {
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

// --- Zustand und Poll-Schleife ---------------------------------------------

let selectedSession = storageGet('studio.session') || 'latest';
let chronDept = 'all';
let lastState = null;
let timer = null;
let requestSeq = 0;

// Genau eine Schleife: jeder Aufruf stoppt den geplanten Timer, und nur die
// jüngste Anfrage darf zeichnen und den nächsten Durchlauf planen.
async function poll() {
  clearTimeout(timer);
  timer = null;
  const seq = ++requestSeq;
  const conn = document.getElementById('conn');
  try {
    const res = await fetch(`/api/state?session=${encodeURIComponent(selectedSession)}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(String(res.status));
    const state = await res.json();
    if (seq !== requestSeq) return;
    lastState = state;
    render(state);
    conn.textContent = `live · ${clock(Date.now() / 1000)}`;
    conn.dataset.ok = 'true';
    document.body.dataset.stale = 'false';
  } catch {
    if (seq !== requestSeq) return;
    conn.textContent = 'keine Verbindung zum Server';
    conn.dataset.ok = 'false';
    document.body.dataset.stale = 'true';
  } finally {
    if (seq === requestSeq) timer = setTimeout(poll, POLL_MS);
  }
}

function render(state) {
  renderSessions(state);
  renderOrg(state);
  renderCounts(state);
  renderDecisions(state);
  renderBudgets(state);
  renderBoard(state);
  renderPulse(state);
  renderChronicle(state);
  renderFeed(state);
}

// --- Ansichten --------------------------------------------------------------

function renderSessions(state) {
  const options = [
    ['latest', 'Neueste'],
    ['all', 'Alle'],
    ...(state.sessions || []).map((s) => [
      String(s.id),
      `${String(s.id).slice(0, 8)} · ${clock(s.last, false)}${s.ended ? ' (beendet)' : ''}`,
    ]),
  ];
  const chosen = syncSelect(document.getElementById('session'), options, selectedSession);
  if (chosen !== selectedSession) {
    // gespeicherte Session gibt es nicht mehr (z. B. archiviert)
    selectedSession = chosen;
    storageSet('studio.session', chosen);
  }
}

function nodeCard(node, showSession) {
  const status = knownStatus(node.status);
  const level = LEVEL_LABEL[node.level] ?? `L${node.level}`;
  const idle = Number(node.idle_seconds) || 0;
  const classes = ['node', `st-${status}`, node.inactive ? 'inactive' : ''].join(' ').trim();
  const chips = el(
    'div',
    { class: 'chips' },
    deptChip(node.department),
    node.model ? el('span', { class: 'chip model' }, node.model) : null,
    node.package ? el('span', { class: 'chip pkg' }, node.package) : null,
    showSession
      ? el('span', { class: 'chip' }, `Session ${String(node.session_id).slice(0, 8)}`)
      : null,
  );
  return el(
    'article',
    { class: classes, 'data-level': String(node.level) },
    el(
      'div',
      { class: 'node-head' },
      el('span', { class: 'level' }, level),
      el('span', { class: 'role' }, node.role || 'unbekannt'),
      statusBadge(node.status),
    ),
    node.persona ? el('p', { class: 'persona' }, node.persona) : null,
    chips,
    node.task ? el('p', { class: 'task' }, node.task) : null,
    node.summary ? el('p', { class: 'summary' }, `Ergebnis: ${node.summary}`) : null,
    el(
      'p',
      { class: 'seen' },
      `Lebenszeichen ${ago(idle)}`,
      node.inactive
        ? el('strong', { class: 'inactive-note' }, `inaktiv seit ${Math.floor(idle / 60)} min`)
        : null,
    ),
  );
}

function orgBranch(node, showSession) {
  const item = el('li', {}, nodeCard(node, showSession));
  const children = node.children || [];
  if (children.length) {
    const depth = Math.min((Number(node.level) || 0) + 1, 2);
    item.append(
      el('ul', { class: `org org-l${depth}` }, ...children.map((c) => orgBranch(c, false))),
    );
  }
  return item;
}

function renderOrg(state) {
  const container = document.getElementById('org');
  const roots = state.tree || [];
  if (!roots.length) {
    container.replaceChildren(empty('Noch keine Aktivität'));
    return;
  }
  const showSession = roots.length > 1;
  container.replaceChildren(
    el('ul', { class: 'org org-root' }, ...roots.map((r) => orgBranch(r, showSession))),
  );
}

function renderCounts(state) {
  const counts = state.counts || {};
  const tiles = Object.keys(STATUS_LABEL).map((status) =>
    countTile(`st-${status}`, STATUS_LABEL[status], counts[status] || 0),
  );
  tiles.push(countTile('tile-inactive', 'inaktiv', counts.inactive || 0));
  document.getElementById('counts').replaceChildren(...tiles);
}

function countTile(cls, label, value) {
  return el(
    'div',
    { class: `tile ${cls}${value ? '' : ' zero'}` },
    el('span', { class: 'tile-value' }, value),
    el('span', { class: 'tile-label' }, label),
  );
}

function renderDecisions(state) {
  const container = document.getElementById('decisions');
  const decisions = state.decisions || [];
  if (!decisions.length) {
    container.replaceChildren(empty('Keine offenen Entscheide'));
    return;
  }
  const group = (target, title) => {
    const items = decisions.filter((d) =>
      target === 'user' ? d.for === 'user' : d.for !== 'user',
    );
    if (!items.length) return null;
    return el(
      'div',
      { class: `decision-group for-${target}` },
      el('h3', {}, title, el('span', { class: 'count' }, items.length)),
      el(
        'ul',
        { class: 'list' },
        ...items.map((d) => {
          const t = Date.parse(d.ts) / 1000;
          return el(
            'li',
            { class: 'decision' },
            el('p', { class: 'question' }, el('span', { class: 'chip id' }, d.id), d.question),
            d.recommendation
              ? el('p', { class: 'recommendation' }, `Empfehlung: ${d.recommendation}`)
              : null,
            el(
              'p',
              { class: 'meta' },
              `von ${d.from || 'unbekannt'}`,
              Number.isFinite(t) ? ` · ${ago(state.now - t)}` : '',
            ),
          );
        }),
      ),
    );
  };
  container.replaceChildren(
    ...[group('user', 'Wartet auf dich'), group('l0', 'Wartet auf L0')].filter(Boolean),
  );
}

function barFill(share) {
  const fill = el('span', { class: 'bar-fill' });
  fill.style.width = `${(share * 100).toFixed(1)}%`;
  return fill;
}

function renderBudgets(state) {
  const container = document.getElementById('budgets');
  const rows = state.budgets || [];
  if (!rows.length) {
    container.replaceChildren(empty('Keine Budgetfreigaben'));
    return;
  }
  container.replaceChildren(
    el(
      'ul',
      { class: 'list budgets' },
      ...rows.map((b) => {
        const used = Number(b.used) || 0;
        const granted = Number(b.granted) || 0;
        const share = Math.min(used / Math.max(granted, 1), 1);
        const unlimited = !Number(b.parallel);
        const parallelMax = unlimited ? '∞' : b.parallel;
        const mix = Object.entries(b.model_mix || {});
        return el(
          'li',
          { class: `budget${b.overrun ? ' overrun' : ''}` },
          el(
            'div',
            { class: 'budget-head' },
            el('span', { class: 'role' }, b.lead),
            b.overrun ? el('span', { class: 'badge st-failed' }, 'überschritten') : null,
          ),
          el(
            'div',
            {
              class: 'bar',
              role: 'meter',
              'aria-label': `${b.lead}: ${used} von ${granted} Starts`,
              'aria-valuemin': '0',
              'aria-valuemax': String(Math.max(granted, 1)),
              'aria-valuenow': String(Math.min(used, Math.max(granted, 1))),
            },
            barFill(share),
          ),
          el(
            'p',
            { class: 'budget-text' },
            `${used} / ${granted} Starts · parallel ${b.parallel_used} / `,
            el('span', { title: unlimited ? 'ohne Limit' : null }, parallelMax),
            ` · ${b.phase}`,
          ),
          mix.length
            ? el(
                'div',
                { class: 'chips' },
                ...mix.map(([model, n]) => el('span', { class: 'chip model' }, `${model} ${n}`)),
              )
            : null,
        );
      }),
    ),
  );
}

function renderBoard(state) {
  const container = document.getElementById('board');
  const items = state.board || [];
  if (!items.length) {
    container.replaceChildren(empty('Keine Pakete'));
    return;
  }
  const columns = ['Paket', 'Titel', 'Owner', 'Status', 'blockiert durch', 'blockiert'];
  const cell = (label, ...content) =>
    el('td', { 'data-label': label }, el('div', { class: 'cell' }, ...content));
  const refs = (list) => (list && list.length ? list.join(', ') : '–');
  container.replaceChildren(
    el(
      'table',
      { class: 'board' },
      el('thead', {}, el('tr', {}, ...columns.map((c) => el('th', { scope: 'col' }, c)))),
      el(
        'tbody',
        {},
        ...items.map((p) => {
          const pkg = PACKAGE_STATUS[p.status] || { label: p.status || '–', tone: 'idle' };
          return el(
            'tr',
            { class: `pkg-${pkg.tone}` },
            cell(
              'Paket',
              el('span', { class: 'pkg-id' }, p.id),
              p.milestone ? el('span', { class: 'milestone' }, p.milestone) : null,
            ),
            cell('Titel', p.title || '–'),
            cell('Owner', p.owner || '–'),
            cell('Status', el('span', { class: `badge st-${pkg.tone}` }, pkg.label)),
            cell('blockiert durch', refs(p.blocked_by)),
            cell('blockiert', refs(p.blocks)),
          );
        }),
      ),
    ),
  );
}

function renderPulse(state) {
  const container = document.getElementById('pulse');
  const minutes = state.pulse || [];
  const departments = (state.departments || Object.keys(DEPARTMENT_LABEL)).map(knownDepartment);
  const max = Math.max(1, ...minutes.map((m) => Number(m.total) || 0));
  const width = 600;
  const height = 120;
  const slot = width / Math.max(minutes.length, 1);
  const chart = svg('svg', {
    viewBox: `0 0 ${width} ${height}`,
    preserveAspectRatio: 'none',
    class: 'pulse-chart',
    role: 'img',
    'aria-label': 'Events je Minute und Bereich, letzte 60 Minuten',
  });
  chart.append(
    svg('line', { x1: 0, x2: width, y1: height - 0.5, y2: height - 0.5, class: 'axis' }),
  );
  minutes.forEach((m, i) => {
    const x = i * slot + 1;
    const group = svg('g', {});
    const detail = departments
      .filter((d) => m.by && m.by[d])
      .map((d) => `${DEPARTMENT_LABEL[d]} ${m.by[d]}`)
      .join(', ');
    group.append(svg('title', {}, `${m.minute}: ${m.total} Events${detail ? ` (${detail})` : ''}`));
    group.append(svg('rect', { x: i * slot, y: 0, width: slot, height, class: 'hit' }));
    let y = height - 1;
    for (const d of departments) {
      const n = Number(m.by && m.by[d]) || 0;
      if (!n) continue;
      const h = (n / max) * (height - 8);
      y -= h;
      group.append(
        svg('rect', { x, y, width: Math.max(slot - 2, 1), height: h, class: `seg dep-${d}` }),
      );
    }
    chart.append(group);
  });
  const total = minutes.reduce((sum, m) => sum + (Number(m.total) || 0), 0);
  const first = minutes[0]?.minute ?? '';
  const last = minutes[minutes.length - 1]?.minute ?? '';
  container.replaceChildren(
    el(
      'p',
      { class: 'pulse-summary' },
      total ? `${total} Events · Spitze ${max} je Minute` : 'Keine Aktivität in den letzten 60 min',
    ),
    chart,
    el('div', { class: 'axis-labels' }, el('span', {}, first), el('span', {}, last)),
    el(
      'ul',
      { class: 'legend' },
      ...departments.map((d) =>
        el('li', {}, el('span', { class: `dot dep-${d}` }), DEPARTMENT_LABEL[d]),
      ),
    ),
  );
}

function renderChronicle(state) {
  const departments = state.departments || Object.keys(DEPARTMENT_LABEL);
  chronDept = syncSelect(
    document.getElementById('chron-dept'),
    [['all', 'Alle'], ...departments.map((d) => [d, DEPARTMENT_LABEL[d] || d])],
    chronDept,
  );
  const entries = (state.chronicle || []).filter(
    (c) => chronDept === 'all' || c.department === chronDept,
  );
  const list = document.getElementById('chronicle');
  if (!entries.length) {
    list.replaceChildren(el('li', { class: 'empty' }, 'Noch keine Einträge'));
    return;
  }
  list.replaceChildren(
    ...entries.map((c) =>
      el(
        'li',
        { class: 'entry' },
        el(
          'div',
          { class: 'meta' },
          el('time', { title: ago(state.now - c.t) }, clock(c.t, false)),
          deptChip(c.department),
          el('span', { class: 'role' }, c.role),
        ),
        el('p', { class: 'text' }, c.text),
      ),
    ),
  );
}

function renderFeed(state) {
  const list = document.getElementById('feed');
  const events = state.feed || [];
  if (!events.length) {
    list.replaceChildren(el('li', { class: 'empty' }, 'Noch keine Events'));
    return;
  }
  list.replaceChildren(
    ...events.map((f) => {
      const dep = knownDepartment(f.department);
      return el(
        'li',
        { class: 'feed-row' },
        el('time', { title: ago(state.now - f.t) }, clock(f.t)),
        el('span', { class: `dot dep-${dep}`, title: DEPARTMENT_LABEL[dep] }),
        el('span', { class: 'role' }, f.role),
        el('span', { class: 'chip kind' }, f.kind),
        f.status ? statusBadge(f.status) : null,
        f.text ? el('span', { class: 'text' }, f.text) : null,
      );
    }),
  );
}

// --- Bedienung --------------------------------------------------------------

function setupTheme() {
  const forced = new URLSearchParams(window.location.search).get('theme');
  const saved = storageGet('studio.theme');
  const initial = forced === 'light' || forced === 'dark' ? forced : saved;
  if (initial === 'light' || initial === 'dark') document.documentElement.dataset.theme = initial;
  document.getElementById('theme').addEventListener('click', () => {
    const dark =
      document.documentElement.dataset.theme === 'dark' ||
      (!document.documentElement.dataset.theme &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);
    const next = dark ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    storageSet('studio.theme', next);
  });
}

document.getElementById('session').addEventListener('change', (event) => {
  selectedSession = event.target.value;
  storageSet('studio.session', selectedSession);
  poll();
});
document.getElementById('chron-dept').addEventListener('change', (event) => {
  chronDept = event.target.value;
  if (lastState) renderChronicle(lastState);
});
setupTheme();
poll();
