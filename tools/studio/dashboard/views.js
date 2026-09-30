// Ansichten der Reiter Delegation, Aufwand, Qualität und Studio sowie die
// Warteschlangen-Karte und das Retro-Banner (Live). Wie app.js: nur textContent.

import {
  DEPARTMENT_LABEL,
  clock,
  el,
  empty,
  knownDepartment,
  storageGet,
  storageSet,
  svg,
  syncSelect,
} from './dom.js';

const NOT_MEASURED = 'nicht gemessen';
const NOT_RECORDED = 'nicht erfasst';
const EFFORT_GROUPS = [
  ['by_role', 'je Agent'],
  ['by_package', 'Paket'],
  ['by_lead', 'Lead'],
  ['by_milestone', 'Meilenstein'],
  ['by_model', 'Modell'],
];
const OUTCOME_TONE = { angenommen: 'done', nacharbeit: 'waiting', verworfen: 'failed' };
const QUEUE_TONE = { offen: 'waiting', beantwortet: 'done' };
const CHANGELOG_LIMIT = 10;
const DEPARTMENT_ORDER = ['production', 'design', 'tech', 'art', 'qa', 'extern'];

let effortBy = storageGet('studio.effortBy') || 'by_role';
let lastState = null;

// --- Hilfen -----------------------------------------------------------------

// Ein Teilbereich in eigenem try/catch: ein Fehler erscheint nur in seiner Karte.
function part(id, state, view) {
  const target = document.getElementById(id);
  if (!target) return;
  try {
    view(target, state);
  } catch (error) {
    console.error(`Studio-Dashboard: Ansicht ${id} fehlgeschlagen`, error);
    target.replaceChildren(empty('Ansicht nicht darstellbar'));
  }
}

function fmtDuration(seconds) {
  if (seconds === null || seconds === undefined) return null;
  const total = Math.round(seconds);
  const mm = String(Math.floor(total / 60)).padStart(2, '0');
  const ss = String(total % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

function fmtCount(value, lowerBound = false) {
  if (value === null || value === undefined) return NOT_MEASURED;
  const text = Number(value).toLocaleString('de-CH');
  return lowerBound ? `≥ ${text}` : text;
}

// Minuten auf eine Nachkommastelle (Schätzungen wie „0.6 min").
function fmtMinutes(value) {
  return (Math.round(Number(value) * 10) / 10).toLocaleString('de-CH');
}

// Aufteilung der eingehenden Tokens (Tooltip; gleich in Delegation und Aufwand).
function tokenDetail(row) {
  return (
    `Input ${fmtCount(row.input)} + Cache-Schreiben ${fmtCount(row.cache_write)}` +
    ` + Cache-Lesen ${fmtCount(row.cache_read)}`
  );
}

function fmtShare(value) {
  return value === null || value === undefined ? NOT_RECORDED : `${Math.round(value * 100)} %`;
}

function fmtNumber(value, digits = 1) {
  return value === null || value === undefined ? NOT_RECORDED : Number(value).toFixed(digits);
}

function fmtRecorded(value) {
  return value === null || value === undefined ? NOT_RECORDED : String(value);
}

function isMissing(value) {
  return value === null || value === undefined;
}

function tone(cls, text) {
  return el('span', { class: `badge st-${cls}` }, text);
}

// Ebene und Bereich wie classify() in model.py.
function classify(name) {
  if (name === 'main' || name === 'studio-director') return { level: 0, department: 'studio' };
  if (name.startsWith('lead-')) {
    return { level: 1, department: knownDepartment(name.slice('lead-'.length)) };
  }
  if (name.startsWith('studio-')) return { level: 1, department: 'studio' };
  return { level: 2, department: knownDepartment(name.split('-')[0]) };
}

function roleChip(role) {
  if (!role) return el('span', { class: 'chip' }, '–');
  const { department } = classify(role);
  return el('span', { class: `chip dep dep-${department}` }, role);
}

function tile(label, rawValue, options = {}) {
  const value = String(rawValue);
  const small = value === NOT_RECORDED || value === NOT_MEASURED;
  return el(
    'div',
    { class: `tile${options.cls ? ` ${options.cls}` : ''}${small ? ' zero' : ''}` },
    el('span', { class: `tile-value${value.length > 6 || small ? ' small' : ''}` }, value),
    el('span', { class: 'tile-label' }, label),
    options.note ? el('span', { class: 'tile-note' }, options.note) : null,
  );
}

// Archivpfad nur relativ und ohne Verzeichnis-Tricks (Server prüft zusätzlich).
function archiveLink(path, label) {
  if (typeof path !== 'string' || !path || path.startsWith('/') || path.startsWith('.')) {
    return null;
  }
  return el(
    'a',
    { class: 'doc-link', href: `/archiv/${encodeURI(path)}`, target: '_blank', rel: 'noopener' },
    label,
  );
}

function dataTable(columns, rows) {
  return el(
    'table',
    { class: 'board data' },
    el(
      'thead',
      {},
      el(
        'tr',
        {},
        ...columns.map((c) => el('th', { scope: 'col', class: c.num ? 'num' : null }, c.label)),
      ),
    ),
    el(
      'tbody',
      {},
      ...rows.map((cells) =>
        el(
          'tr',
          {},
          ...cells.map((content, i) =>
            el(
              'td',
              { 'data-label': columns[i].label, class: columns[i].num ? 'num' : null },
              el('div', { class: 'cell' }, ...(Array.isArray(content) ? content : [content])),
            ),
          ),
        ),
      ),
    ),
  );
}

// Feldnamen laut studio_docs.py (festes Format von warteschlange.md/experimente.md).
const Q_QUESTION = 'Frage';
const Q_RECOMMENDATION = 'Empfehlung';
const Q_COST = 'Kosten des Wartens';
const Q_BLOCKS = 'Blockiert';
const Q_ANSWER = 'Antwort';
const E_MEASURE = 'Messgrösse';
const E_PERIOD = 'Zeitraum';

function field(fields, key) {
  const value = fields ? fields[key] : '';
  return value && value !== '–' ? value : '';
}

// --- Live: Banner und Warteschlange ----------------------------------------

export function renderBanner(state) {
  const container = document.getElementById('banner');
  const count = (state.incidents || []).length;
  if (!count) {
    container.replaceChildren();
    return;
  }
  container.replaceChildren(
    el(
      'a',
      { class: 'banner', href: '#qualitaet' },
      el('strong', {}, `Retro fällig: ${count} ${count === 1 ? 'Vorfall' : 'Vorfälle'}`),
      el('span', {}, 'Details im Reiter Qualität'),
    ),
  );
}

export function renderQueue(state) {
  const container = document.getElementById('queue');
  const entries = ((state.docs || {}).queue || []).filter((q) => q.status in QUEUE_TONE);
  if (!entries.length) {
    container.replaceChildren(empty('Keine offenen Nutzerentscheide'));
    return;
  }
  const row = (label, text) =>
    text ? el('p', { class: 'kv' }, el('span', { class: 'k' }, label), el('span', {}, text)) : null;
  container.replaceChildren(
    el(
      'ul',
      { class: 'list' },
      ...entries.map((q) => {
        // Eine eingetragene Antwort zählt, auch wenn der Status noch «offen» ist.
        const answer = field(q.fields, Q_ANSWER);
        const status = answer ? 'beantwortet' : q.status;
        return el(
          'li',
          { class: 'decision' },
          el(
            'p',
            { class: 'question' },
            el('span', { class: 'chip id' }, q.id),
            el('strong', {}, q.title),
            tone(QUEUE_TONE[status], status),
          ),
          row('Frage', field(q.fields, Q_QUESTION)),
          row('Empfehlung', field(q.fields, Q_RECOMMENDATION)),
          row('Kosten des Wartens', field(q.fields, Q_COST)),
          row('Blockiert', field(q.fields, Q_BLOCKS)),
          row('Antwort', answer),
        );
      }),
    ),
  );
}

// --- Delegation -------------------------------------------------------------

const LIVE_STATUS = ['active', 'delegated', 'waiting', 'blocked'];

function outcomeBadge(outcome, status) {
  if (!outcome) {
    return LIVE_STATUS.includes(status)
      ? tone('active', 'läuft')
      : el('span', { class: 'badge st-idle' }, 'kein Ergebnis');
  }
  return tone(OUTCOME_TONE[outcome] || 'idle', outcome);
}

function actuals(d) {
  const duration = fmtDuration(d.duration_s);
  const running = LIVE_STATUS.includes(d.status);
  return el(
    'p',
    { class: 'actuals' },
    el('span', {}, `Dauer: ${duration || (running ? 'läuft' : NOT_MEASURED)}`),
    el('span', {}, d.tool_calls === 1 ? '1 Tool-Aufruf' : `${fmtCount(d.tool_calls)} Tool-Aufrufe`),
    isMissing(d.tokens_in) && isMissing(d.tokens_out)
      ? el('span', {}, `Tokens ${NOT_MEASURED}`)
      : el(
          'span',
          { title: tokenDetail(d) },
          `Tokens ${fmtCount(d.tokens_in)} ein / ${fmtCount(d.tokens_out, d.output_lower_bound)} aus`,
        ),
  );
}

function estimateText(estimate) {
  if (!estimate) return 'keine Schätzung';
  const parts = [];
  if (!isMissing(estimate.minutes)) parts.push(`${fmtMinutes(estimate.minutes)} min`);
  if (!isMissing(estimate.tools)) parts.push(`${estimate.tools} Tools`);
  return parts.length ? `Schätzung ${parts.join(' · ')}` : 'keine Schätzung';
}

export function renderDelegation(state) {
  part('delegation', state, (container) => {
    const rows = state.delegations || [];
    if (!rows.length) {
      container.replaceChildren(empty('Noch keine Delegationen'));
      return;
    }
    container.replaceChildren(
      el(
        'ol',
        { class: 'list timeline' },
        ...rows.map((d) => {
          const links = [archiveLink(d.briefing, 'Briefing'), archiveLink(d.report, 'Bericht')];
          return el(
            'li',
            { class: 'deleg' },
            el(
              'div',
              { class: 'deleg-head' },
              Number.isFinite(d.t)
                ? el('time', { title: new Date(d.t * 1000).toLocaleString('de-CH') }, clock(d.t))
                : el('span', {}, '–'),
              roleChip(d.from),
              el('span', { class: 'arrow', 'aria-label': 'delegiert an' }, '→'),
              roleChip(d.to),
              outcomeBadge(d.outcome, d.status),
            ),
            el(
              'div',
              { class: 'chips' },
              d.package ? el('span', { class: 'chip pkg' }, d.package) : null,
              d.milestone ? el('span', { class: 'chip id' }, d.milestone) : null,
              d.model ? el('span', { class: 'chip model' }, d.model) : null,
              el('span', { class: 'chip' }, estimateText(d.estimate)),
            ),
            actuals(d),
            links.some(Boolean) ? el('p', { class: 'links' }, ...links) : null,
          );
        }),
      ),
    );
  });
}

// --- Aufwand ----------------------------------------------------------------

function inputTotal(row) {
  return isMissing(row.input)
    ? null
    : (row.input || 0) + (row.cache_write || 0) + (row.cache_read || 0);
}

function inputCell(row) {
  const total = inputTotal(row);
  if (total === null) return NOT_MEASURED;
  return el('span', { title: tokenDetail(row) }, fmtCount(total));
}

function effortTable(rows) {
  const columns = [
    { label: 'Schlüssel' },
    { label: 'Agenten', num: true },
    { label: 'Dauer', num: true },
    { label: 'Tool-Aufrufe', num: true },
    { label: 'Tokens ein', num: true },
    { label: 'Tokens aus', num: true },
  ];
  return dataTable(
    columns,
    rows.map((r) => [
      el('strong', {}, r.key),
      String(r.agents),
      fmtDuration(r.duration_s) || NOT_MEASURED,
      fmtCount(r.tool_calls),
      inputCell(r),
      fmtCount(r.output, r.output_lower_bound),
    ]),
  );
}

function estimateTiles(est) {
  if (!est || !est.count) return empty('keine Schätzungen erfasst');
  const pct = est.deviation_pct;
  const sign = pct > 0 ? '+' : '';
  return el(
    'div',
    { class: 'counts' },
    tile('Minuten geschätzt', fmtCount(est.estimated_min)),
    tile('Minuten Ist', fmtCount(est.actual_min)),
    tile('Tools geschätzt', fmtCount(est.estimated_tools)),
    tile('Tools Ist', fmtCount(est.actual_tools)),
    tile(
      `Abweichung (${est.count} Delegationen)`,
      isMissing(pct) ? NOT_MEASURED : `${sign}${pct} %`,
    ),
  );
}

function costList(costs) {
  if (!costs.length) return empty('Keine Sitzungskosten erfasst');
  const usd = (n) => (isMissing(n) ? NOT_MEASURED : `${Number(n).toFixed(2)} USD`);
  return el(
    'div',
    {},
    el(
      'ul',
      { class: 'list costs' },
      ...costs.map((c) =>
        el(
          'li',
          { class: 'cost' },
          el('span', { class: 'chip id' }, `Session ${String(c.session_id).slice(0, 8)}`),
          el('strong', {}, usd((c.cost || {}).total_usd)),
          ...Object.entries((c.cost || {}).models || {}).map(([model, item]) =>
            el('span', { class: 'chip model' }, `${model} ${usd((item || {}).usd)}`),
          ),
        ),
      ),
    ),
    el('p', { class: 'note' }, 'Sitzungssumme laut Claude Code'),
  );
}

export function renderEffort(state) {
  lastState = state;
  const select = document.getElementById('effort-by');
  effortBy = syncSelect(select, EFFORT_GROUPS, effortBy);
  part('effort', state, (container) => {
    const rows = ((state.effort || {})[effortBy] || []).filter(Boolean);
    container.replaceChildren(rows.length ? effortTable(rows) : empty('Noch kein Aufwand erfasst'));
  });
  part('estimate', state, (container) => {
    container.replaceChildren(estimateTiles((state.effort || {}).estimate_vs_actual));
  });
  part('costs', state, (container) => {
    container.replaceChildren(costList(state.session_costs || []));
  });
}

const effortSelect = document.getElementById('effort-by');
if (effortSelect) {
  effortSelect.addEventListener('change', (event) => {
    effortBy = event.target.value;
    storageSet('studio.effortBy', effortBy);
    if (lastState) renderEffort(lastState);
  });
}

// --- Qualität ---------------------------------------------------------------

function qualityTiles(q) {
  const bad = (n) => (n ? 'attention' : '');
  return el(
    'div',
    { class: 'counts' },
    tile('Annahmequote erster Wurf', fmtShare(q.first_pass_rate)),
    tile(
      'Review-Runden Ø / Max',
      isMissing(q.review_rounds_mean)
        ? NOT_RECORDED
        : `${fmtNumber(q.review_rounds_mean)} / ${fmtRecorded(q.review_rounds_max)}`,
    ),
    tile('Nacharbeit', fmtRecorded(q.rework), {
      note: isMissing(q.rework_share) ? null : fmtShare(q.rework_share),
    }),
    tile('verworfen', fmtRecorded(q.rejected)),
    tile('CI-Fehlschläge (main)', fmtRecorded(q.ci_failures), { cls: bad(q.ci_failures) }),
    tile('Eskalationen', fmtRecorded(q.escalations)),
    tile('gescheiterte Agenten', fmtRecorded(q.failed_agents), { cls: bad(q.failed_agents) }),
    tile('Agenten mit Lücke', fmtRecorded(q.gap_agents)),
  );
}

function incidentList(incidents) {
  if (!incidents.length) return empty('Keine offenen Vorfälle');
  return el(
    'ul',
    { class: 'list' },
    ...incidents.map((i) =>
      el(
        'li',
        { class: 'incident' },
        el('span', { class: 'chip kind' }, i.kind),
        el('span', { class: 'text' }, i.text),
        i.t ? el('time', {}, clock(i.t, false)) : null,
      ),
    ),
  );
}

// Kleine Linie über die Meilensteine; Punkte ohne Wert werden übersprungen.
function sparkline(title, points, format) {
  const width = 240;
  const height = 64;
  const pad = 6;
  const values = points.map((p) => p.value).filter((v) => !isMissing(v));
  const last = values[values.length - 1];
  const box = el(
    'figure',
    { class: 'spark' },
    el('figcaption', {}, values.length ? `${title} · zuletzt ${format(last)}` : title),
  );
  if (values.length < 2) {
    box.append(el('p', { class: 'empty' }, NOT_RECORDED));
    return box;
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const step = (width - 2 * pad) / (points.length - 1);
  const coords = points
    .map((p, i) => [pad + i * step, p.value])
    .filter(([, v]) => !isMissing(v))
    .map(([x, v]) => [x, height - pad - ((v - min) / span) * (height - 2 * pad), v]);
  const chart = svg('svg', {
    viewBox: `0 0 ${width} ${height}`,
    class: 'spark-chart',
    role: 'img',
    'aria-label': `${title}: ${points.map((p) => `${p.label} ${isMissing(p.value) ? NOT_RECORDED : format(p.value)}`).join(', ')}`,
  });
  chart.append(
    svg('polyline', { points: coords.map(([x, y]) => `${x},${y}`).join(' '), class: 'spark-line' }),
  );
  for (const [x, y, v] of coords) {
    chart.append(
      svg('circle', { cx: x, cy: y, r: 3, class: 'spark-dot' }, svg('title', {}, format(v))),
    );
  }
  box.append(chart);
  return box;
}

function historyView(history) {
  const items = history.filter((h) => h && h.kind === 'milestone');
  if (!items.length) return empty('Noch keine Meilenstein-Verdichtung');
  const q = (h) => h.quality || {};
  const columns = [
    { label: 'Kennung' },
    { label: 'Datum' },
    { label: 'Annahmequote', num: true },
    { label: 'Review-Runden Ø', num: true },
    { label: 'Nacharbeit', num: true },
    { label: 'CI rot', num: true },
    { label: 'Tokens aus', num: true },
  ];
  const table = dataTable(
    columns,
    items.map((h) => [
      el('strong', {}, h.kennung),
      String(h.created || '').slice(0, 10) || '–',
      fmtShare(q(h).first_pass_rate),
      fmtNumber(q(h).review_rounds_mean),
      fmtRecorded(q(h).rework),
      fmtRecorded(q(h).ci_failures),
      fmtCount((h.totals || {}).output, (h.totals || {}).output_lower_bound),
    ]),
  );
  const wrap = el('div', {}, table);
  if (items.length < 2) {
    wrap.append(el('p', { class: 'note' }, 'Verlauf ab zwei Meilensteinen'));
    return wrap;
  }
  wrap.append(
    el(
      'div',
      { class: 'sparks' },
      sparkline(
        'Annahmequote',
        items.map((h) => ({ label: h.kennung, value: q(h).first_pass_rate })),
        (v) => `${Math.round(v * 100)} %`,
      ),
      sparkline(
        'Tokens aus',
        items.map((h) => ({ label: h.kennung, value: (h.totals || {}).output })),
        (v) => Number(v).toLocaleString('de-CH'),
      ),
    ),
  );
  return wrap;
}

export function renderQuality(state) {
  part('quality', state, (container) => {
    container.replaceChildren(qualityTiles(state.quality || {}));
  });
  part('incidents', state, (container) => {
    container.replaceChildren(incidentList(state.incidents || []));
  });
  part('history', state, (container) => {
    container.replaceChildren(historyView((state.docs || {}).history || []));
  });
}

// --- Studio -----------------------------------------------------------------

function experimentList(items) {
  if (!items.length) return empty('Keine Experimente');
  return el(
    'ul',
    { class: 'list' },
    ...items.map((e) =>
      el(
        'li',
        { class: 'experiment' },
        el(
          'p',
          { class: 'question' },
          el('span', { class: 'chip id' }, e.id),
          tone(e.status === 'laufend' ? 'active' : 'idle', e.status),
          el('strong', {}, e.title),
        ),
        el('p', { class: 'meta' }, `Messgrösse: ${field(e.fields, E_MEASURE) || '–'}`),
        el('p', { class: 'meta' }, `Zeitraum: ${field(e.fields, E_PERIOD) || '–'}`),
      ),
    ),
  );
}

function changelogList(items) {
  if (!items.length) return empty('Kein Changelog');
  return el(
    'ul',
    { class: 'list' },
    ...items
      .slice(0, CHANGELOG_LIMIT)
      .map((c) =>
        el(
          'li',
          { class: 'entry' },
          el(
            'div',
            { class: 'meta' },
            el('time', {}, c.date),
            el('span', { class: 'role' }, c.subject),
            el('span', { class: 'chip id' }, `v${c.version}`),
          ),
          (c.lines || [])[0] ? el('p', { class: 'text' }, c.lines[0].replace(/^-\s*/, '')) : null,
        ),
      ),
  );
}

function personaCard(p) {
  return el(
    'article',
    { class: 'persona-card' },
    el('span', { class: 'role' }, p.name),
    el(
      'div',
      { class: 'chips' },
      el('span', { class: 'chip id' }, p.version ? `v${p.version}` : 'ohne Version'),
      el(
        'span',
        { class: 'chip model' },
        !p.model || p.model === 'inherit' ? 'erbt Modell' : p.model,
      ),
    ),
  );
}

function orgChart(personas) {
  if (!personas.length) return empty('Keine Personas gefunden');
  const level = (n) => personas.filter((p) => classify(p.name).level === n);
  const l0 = level(0);
  // Der Direktor ist die Hauptsession und hat evtl. keine Persona-Datei.
  if (!l0.length) l0.push({ name: 'studio-director', version: '', model: 'Hauptsession' });
  const l1 = level(1);
  const l2 = level(2);
  const lane = (title, cards) =>
    el(
      'div',
      { class: 'lane' },
      el('h3', {}, title),
      cards.length
        ? el('div', { class: 'persona-row' }, ...cards.map(personaCard))
        : el('p', { class: 'empty' }, '–'),
    );
  const departments = DEPARTMENT_ORDER.filter((d) =>
    l2.some((p) => classify(p.name).department === d),
  );
  return el(
    'div',
    { class: 'orgchart' },
    lane('L0 · Direktion', l0),
    lane('L1 · Leads und Studio-Rollen', l1),
    ...departments.map((d) =>
      lane(
        `L2 · ${DEPARTMENT_LABEL[d]}`,
        l2.filter((p) => classify(p.name).department === d),
      ),
    ),
  );
}

export function renderStudio(state) {
  const docs = state.docs || {};
  part('versions', state, (container) => {
    const version = (v) => (v ? `v${v}` : 'nicht vorhanden');
    container.replaceChildren(
      tile('Verfassung', version(docs.constitution_version)),
      tile('Handbuch', version(docs.handbook_version)),
    );
  });
  part('experiments', state, (container) => {
    container.replaceChildren(experimentList(docs.experiments || []));
  });
  part('changelog', state, (container) => {
    container.replaceChildren(changelogList(docs.changelog || []));
  });
  part('personas', state, (container) => {
    container.replaceChildren(orgChart(docs.personas || []));
  });
  part('lernen', state, (container) => {
    container.replaceChildren(
      docs.lernen ? el('pre', { class: 'lernen' }, docs.lernen) : empty('Noch nichts festgehalten'),
    );
  });
}
