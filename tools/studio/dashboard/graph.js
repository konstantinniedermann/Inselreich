// Prozess-Graph: zeichnet state.graph (Spalten, Spuren, Punkte, Pfeile, Zeilen).
// Das Modell rechnet alles; hier wird nur gezeichnet (Spec Prozess-Graph, Abschnitt G).
// Sicherheit: Texte nur per textContent/Attribut (G12).

import { STATUS, clock, el, empty, knownDepartment, svg } from './dom.js';
import { applyFocus, toggleRow } from './focus.js';

export const GRAPH_COL_PX = 14;
export const GRAPH_ROW_PX = 28;
const LANE_PAD = 4; // Rand links und rechts: Breite = Spalten × 14 + 8 (G3)

let signature = '';
let shownSession = null;
let knownIds = new Set();
let pendingNew = 0;

function laneX(col) {
  return LANE_PAD + GRAPH_COL_PX * col + GRAPH_COL_PX / 2;
}

function agentKey(graph, lane) {
  return lane && lane.key !== null ? `${graph.session}:${lane.key}` : '';
}

function depClass(lane) {
  return `dep-${knownDepartment(lane ? lane.department : null)}`;
}

function arrowShape(graph, row, mid) {
  const { from_col: from, to_col: to, style } = row.arrow;
  const x1 = laneX(from);
  const attrs = {
    class: `arrow ${style} ${depClass(row.lanes[from])}`,
    'data-agents': [row.from, row.to].filter(Boolean).join(' '),
  };
  if (to === null) {
    // Stummel: Ziel ohne Spur; „?" nur bei unzuordenbarem Empfänger (G5, P23)
    const stub = { x1, y1: mid, x2: x1 + GRAPH_COL_PX, y2: mid };
    if (style === 'message') stub['marker-end'] = 'url(#graph-arrow)';
    const parts = [svg('line', stub)];
    if (row.to === '?') {
      parts.push(
        svg('text', { class: 'graph-unknown', x: x1 + GRAPH_COL_PX + 3, y: mid + 4 }, '?'),
      );
    }
    return svg('g', attrs, ...parts);
  }
  const x2 = laneX(to);
  if (style === 'message') {
    const end = x2 - Math.sign(x2 - x1) * 5;
    return svg('line', {
      ...attrs,
      x1,
      y1: mid,
      x2: end,
      y2: mid,
      'marker-end': 'url(#graph-arrow)',
    });
  }
  const half = GRAPH_ROW_PX / 2;
  const d =
    style === 'branch'
      ? `M ${x1} ${mid} Q ${x2} ${mid} ${x2} ${mid - half}`
      : `M ${x1} ${mid + half} Q ${x1} ${mid} ${x2} ${mid}`;
  return svg('path', { ...attrs, d });
}

function drawRow(canvas, graph, row, r) {
  const top = GRAPH_ROW_PX * r;
  const mid = top + GRAPH_ROW_PX / 2;
  row.lanes.forEach((lane, col) => {
    for (const [style, y1, y2] of [
      [lane.up, top, mid],
      [lane.down, mid, top + GRAPH_ROW_PX],
    ]) {
      if (style === 'none') continue;
      const cls = `lane ${depClass(lane)}${style === 'dashed' ? ' dashed' : ''}`;
      const x = laneX(col);
      canvas.append(
        svg('line', {
          class: cls,
          x1: x,
          y1,
          x2: x,
          y2,
          'data-agents': agentKey(graph, lane),
        }),
      );
    }
  });
  if (row.arrow) canvas.append(arrowShape(graph, row, mid));
  if (row.dot !== null) {
    const lane = row.lanes[row.dot];
    canvas.append(
      svg('circle', {
        class: `graph-dot ${depClass(lane)}`,
        cx: laneX(row.dot),
        cy: mid,
        r: 4,
        'data-agents': agentKey(graph, lane),
      }),
    );
  }
}

function rowItem(row) {
  if (row.kind === 'pause') {
    return el('li', { class: 'graph-row pause', 'data-id': row.id, 'data-agents': '' }, row.text);
  }
  const known = row.kind === 'status' && Object.hasOwn(STATUS, row.status);
  const prefix = known ? `${STATUS[row.status].emoji} ${STATUS[row.status].label} · ` : '';
  return el(
    'li',
    {
      class: `graph-row kind-${row.kind}`,
      'data-id': row.id,
      'data-agents': [row.from, row.to].filter(Boolean).join(' '),
    },
    el('time', { title: clock(row.t) }, row.time),
    el('span', { class: 'g-label' }, row.label),
    el('span', { class: 'g-text', title: row.text }, prefix + row.text),
  );
}

function graphView(graph) {
  const rows = graph.rows;
  const width = graph.columns * GRAPH_COL_PX + 2 * LANE_PAD;
  const height = rows.length * GRAPH_ROW_PX;
  const canvas = svg(
    'svg',
    {
      class: 'graph-svg',
      width,
      height,
      viewBox: `0 0 ${width} ${height}`,
      'aria-hidden': 'true',
    },
    svg(
      'defs',
      {},
      svg(
        'marker',
        {
          id: 'graph-arrow',
          viewBox: '0 0 6 6',
          refX: 5,
          refY: 3,
          markerWidth: 6,
          markerHeight: 6,
          orient: 'auto',
        },
        svg('path', { class: 'graph-arrowhead', d: 'M0,0 L6,3 L0,6 z' }),
      ),
    ),
  );
  rows.forEach((row, r) => drawRow(canvas, graph, row, r));
  return el(
    'div',
    { class: 'graph-grid' },
    el('div', { class: 'graph-lanes' }, canvas),
    el('ol', { class: 'graph-rows' }, ...rows.map(rowItem)),
  );
}

// P33: oberste sichtbare Zeile und ihr Abstand zum oberen Rand.
function captureAnchor(body) {
  if (body.scrollTop <= 0) return null;
  for (const item of body.querySelectorAll('.graph-row')) {
    if (item.offsetTop + GRAPH_ROW_PX > body.scrollTop) {
      return { id: item.dataset.id, offset: item.offsetTop - body.scrollTop };
    }
  }
  return null;
}

function restoreAnchor(body, anchor, oldRows, rows) {
  const t = (oldRows.find((r) => r.id === anchor.id) || {}).t;
  const target =
    rows.find((r) => r.id === anchor.id) || rows.find((r) => t !== undefined && r.t <= t);
  if (!target) return;
  for (const item of body.querySelectorAll('.graph-row')) {
    if (item.dataset.id === target.id) {
      body.scrollTop = item.offsetTop - anchor.offset;
      return;
    }
  }
}

function updateHint() {
  const hint = document.getElementById('graph-new');
  hint.hidden = pendingNew === 0;
  hint.textContent = `▲ ${pendingNew} neue Ereignisse`;
}

let lastRows = [];

export function renderGraph(state) {
  const body = document.getElementById('graph');
  const graph = state.graph;
  if (!graph) {
    signature = '';
    shownSession = null;
    knownIds = new Set();
    lastRows = [];
    pendingNew = 0;
    updateHint();
    body.replaceChildren(
      empty('Prozess-Graph nur für eine einzelne Session — oben eine Session wählen'),
    );
    return;
  }
  const rows = graph.rows || [];
  const sameSession = graph.session === shownSession;
  const next = JSON.stringify(graph);
  if (sameSession && next === signature) {
    applyFocus(); // P35: nur Fokus-Klassen auffrischen
    return;
  }
  const anchor = sameSession ? captureAnchor(body) : null;
  const fresh = sameSession ? rows.filter((r) => !knownIds.has(r.id)).length : 0;
  body.replaceChildren(rows.length ? graphView(graph) : empty('Noch keine Ereignisse'));
  if (graph.truncated) {
    body.append(
      el('p', { class: 'graph-note' }, 'Ältere Ereignisse ausgeblendet (höchstens 300 Zeilen)'),
    );
  }
  if (!sameSession) {
    body.scrollTop = 0; // G7: Sessionwechsel ohne Hinweis
    pendingNew = 0;
  } else if (anchor) {
    restoreAnchor(body, anchor, lastRows, rows);
    pendingNew += fresh;
  } else {
    pendingNew = 0;
  }
  signature = next;
  shownSession = graph.session;
  knownIds = new Set(rows.map((r) => r.id));
  lastRows = rows;
  updateHint();
  applyFocus();
}

export function setupGraph() {
  const body = document.getElementById('graph');
  body.addEventListener('click', (event) => {
    const item = event.target.closest('.graph-row');
    if (item && !item.classList.contains('pause')) toggleRow(item.dataset.id);
  });
  body.addEventListener('scroll', () => {
    if (body.scrollTop === 0 && pendingNew) {
      pendingNew = 0;
      updateHint();
    }
  });
  document.getElementById('graph-new').addEventListener('click', () => {
    body.scrollTop = 0;
    pendingNew = 0;
    updateHint();
  });
}
