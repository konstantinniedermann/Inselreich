// Studio-Dashboard: pollt /api/state alle 2 s und zeichnet alle Ansichten neu.
// Sicherheit: Daten ausschliesslich per textContent/Attribut, nie per innerHTML.

import {
  DEPARTMENT_LABEL,
  INACTIVE,
  STATUS,
  PACKAGE_STATUS,
  ago,
  clock,
  deptChip,
  el,
  empty,
  knownDepartment,
  knownStatus,
  statusBadge,
  statusText,
  storageGet,
  storageSet,
  svg,
  syncSelect,
} from './dom.js';
import { applyFocus, dropMissing, openNodes, toggleNode } from './focus.js';
import {
  renderDelegation,
  renderEffort,
  renderQuality,
  renderStudio,
  renderQueue,
  renderBanner,
} from './views.js';

const POLL_MS = 2000;
const FETCH_TIMEOUT_MS = 6000;
// Periode der Inaktiv-Animation (style.css); Phase an die Uhr gekoppelt, damit
// das Neuzeichnen alle 2 s die Animation nicht sichtbar neu startet.
const INACTIVE_PULSE_MS = 2000;

// --- Zustand und Poll-Schleife ---------------------------------------------

// ?session=<id|all|latest> verlinkt eine bestimmte Session (hat Vorrang vor der gespeicherten Wahl).
let selectedSession =
  new URLSearchParams(window.location.search).get('session') ||
  storageGet('studio.session') ||
  'latest';
let hideHeartbeats = storageGet('studio.hideHeartbeats') === '1';
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
  try {
    let state;
    try {
      const query = new URLSearchParams({ session: selectedSession });
      if (hideHeartbeats) query.set('heartbeats', '0');
      const res = await fetch(`/api/state?${query}`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      if (!res.ok) throw new Error(String(res.status));
      state = await res.json();
    } catch {
      if (seq === requestSeq) setConn(false, 'keine Verbindung zum Server');
      return;
    }
    if (seq !== requestSeq) return;
    lastState = state;
    try {
      render(state);
      setConn(true, `live · ${clock(Date.now() / 1000)}`);
    } catch (error) {
      setConn(false, 'Anzeigefehler');
      console.error('Studio-Dashboard: Anzeigefehler', error);
    }
  } finally {
    if (seq === requestSeq) timer = setTimeout(poll, POLL_MS);
  }
}

// Sichtbarer Zustand in #conn (ohne Ansage); Screenreader hören nur den Wechsel
// in einen Fehlerzustand über die separate Live-Region #conn-alert.
function setConn(ok, text) {
  const conn = document.getElementById('conn');
  const alert = document.getElementById('conn-alert');
  conn.textContent = text;
  conn.dataset.ok = String(ok);
  document.body.dataset.stale = String(!ok);
  if (ok) alert.textContent = '';
  else if (alert.textContent !== text) alert.textContent = text;
}

// Jede Ansicht in eigenem try/catch: eine kaputte Ansicht verhindert die anderen nicht.
const VIEWS = [
  ['sessions', renderSessions],
  ['org', renderOrg],
  ['counts', renderCounts],
  ['decisions', renderDecisions],
  ['queue', renderQueue],
  ['budgets', renderBudgets],
  ['board', renderBoard],
  ['pulse', renderPulse],
  ['chronicle', renderChronicle],
  ['feed', renderFeed],
  ['banner', renderBanner],
  ['delegation', renderDelegation],
  ['effort', renderEffort],
  ['quality', renderQuality],
  ['studio', renderStudio],
];

function treeKeys(nodes, keys = new Set()) {
  for (const node of nodes || []) {
    keys.add(node.key);
    treeKeys(node.children, keys);
  }
  return keys;
}

function render(state) {
  const rowIds = new Set(((state.graph && state.graph.rows) || []).map((r) => r.id));
  dropMissing(treeKeys(state.tree), rowIds);
  for (const [id, view] of VIEWS) {
    try {
      view(state);
    } catch (error) {
      console.error(`Studio-Dashboard: Ansicht ${id} fehlgeschlagen`, error);
      const target = document.getElementById(id);
      if (target && id !== 'sessions') {
        target.replaceChildren(empty(`Ansicht nicht darstellbar (${id})`));
      }
    }
  }
  applyFocus(); // Kacheln und Graph sind neu gezeichnet: Fokus-Klassen wieder setzen
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

// Kachel (K1–K3): zugeklappt Emoji + Name, Titel, Status + Kurzaufgabe; Details aufgeklappt.
function nodeCard(node, showSession) {
  const status = knownStatus(node.status);
  const idle = Number(node.idle_seconds) || 0;
  const classes = [
    'node',
    `st-${status}`,
    `dep-${knownDepartment(node.department)}`,
    node.inactive ? 'inactive' : '',
  ]
    .join(' ')
    .trim();
  const state = statusText(node.status, node.inactive ? idle : null);
  const meta = [
    node.model,
    node.package,
    showSession ? `Session ${String(node.session_id).slice(0, 8)}` : '',
  ]
    .filter(Boolean)
    .join(' · ');
  const card = el(
    'details',
    {
      class: classes,
      'data-level': String(node.level),
      'data-key': node.key,
      open: openNodes.has(node.key) ? '' : null,
    },
    el(
      'summary',
      { class: 'node-summary' },
      el('span', { class: 'node-name' }, `${node.emoji || ''} ${node.name || node.role}`.trim()),
      el('span', { class: 'node-title' }, node.title || node.role || ''),
      el(
        'span',
        { class: 'node-status' },
        node.task_short ? `${state} · ${node.task_short}` : state,
      ),
    ),
    el(
      'div',
      { class: 'node-details' },
      meta ? el('p', { class: 'node-meta' }, meta) : null,
      node.task ? el('p', { class: 'task' }, node.task) : null,
      node.summary ? el('p', { class: 'summary' }, `Ergebnis: ${node.summary}`) : null,
      el('p', { class: 'seen' }, `Lebenszeichen ${ago(idle)}`),
    ),
  );
  if (node.inactive) card.style.animationDelay = `-${Date.now() % INACTIVE_PULSE_MS}ms`;
  return card;
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
  const tiles = Object.keys(STATUS).map((status) =>
    countTile(`st-${status}`, statusText(status), counts[status] || 0),
  );
  tiles.push(
    countTile('tile-inactive', `${INACTIVE.emoji} ${INACTIVE.label}`, counts.inactive || 0),
  );
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
        f.kind === 'heartbeat' && Number(f.count) > 1
          ? el(
              'span',
              { class: 'run', title: `erster Aufruf ${clock(f.first_t)}` },
              `${f.count} Aufrufe seit ${clock(f.first_t, false)} · zuletzt ${ago(state.now - f.t)}`,
            )
          : null,
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
const heartbeatToggle = document.getElementById('hide-heartbeats');
heartbeatToggle.checked = hideHeartbeats;
heartbeatToggle.addEventListener('change', (event) => {
  hideHeartbeats = event.target.checked;
  storageSet('studio.hideHeartbeats', hideHeartbeats ? '1' : '0');
  poll();
});
document.getElementById('chron-dept').addEventListener('change', (event) => {
  chronDept = event.target.value;
  if (lastState) renderChronicle(lastState);
});
const TABS = ['live', 'delegation', 'aufwand', 'qualitaet', 'studio'];

// Reiter über den URL-Hash; unbekannter Hash fällt auf #live zurück.
function showTab() {
  const wanted = window.location.hash.slice(1);
  const tab = TABS.includes(wanted) ? wanted : 'live';
  for (const section of document.querySelectorAll('[data-tab]')) {
    section.hidden = section.dataset.tab !== tab;
  }
  for (const link of document.querySelectorAll('.tabs a')) {
    if (link.getAttribute('href') === `#${tab}`) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
}
window.addEventListener('hashchange', showTab);
// Kachel-Klick = Agent fokussieren (K5, P28); das native Auf-/Zuklappen übernimmt focus.js.
document.getElementById('org').addEventListener('click', (event) => {
  const summary = event.target.closest('summary');
  if (!summary) return;
  event.preventDefault();
  toggleNode(summary.parentElement.dataset.key);
});
showTab();
setupTheme();
poll();
