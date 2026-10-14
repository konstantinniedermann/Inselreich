// Karte «Versionen und Releases»: Live-Stand, Stufen je Paket, Abhängigkeiten (Daten: /api/state).
// Daten: docs/studio/releases.json, vom Server mit kritischem Pfad (chain) und Session-Paketen angereichert.
// Sicherheit: nur textContent/Attribute (el/svg aus dom.js), nie innerHTML.

import { el, svg, empty } from './dom.js';

const STAGES = [
  ['1 · Idee / Input', 'Pool, Befund, Auftrag'],
  ['2 · Design', 'Kurzdesign, Spec, Gate Spec'],
  ['3 · Plan', 'Plan, Gate Plan'],
  ['4 · Umsetzung', 'Code, Reviews, Merge'],
  ['5 · Release', 'Check, Push, live'],
];
const SYMBOL = { done: '✓', running: '▶', waiting: '⏸', back: '✗', user: '◆', idea: '○' };
const STATE_CLASS = {
  done: 'd-done',
  running: 'd-run',
  waiting: 'd-wait',
  back: 'd-back',
  user: 'd-user',
  idea: 'd-idea',
};
const GATE_CLASS = { live: 'd-done', check: 'd-wait', planned: 'd-idea', later: 'd-idea' };
const GROUP_ORDER = ['check', 'planned', 'later', 'pool', 'live'];
const CONCLUSION = { success: 'grün', failure: 'rot', cancelled: 'abgebrochen' };

// --- reine Hilfen (ohne DOM) -------------------------------------------------

export function baseId(target) {
  return String(target).split(':')[0];
}

// Knoten-ID -> Paket: erst exakt, dann ohne Zusatz nach dem Doppelpunkt (wie releases.py).
export function findItem(items, target) {
  for (const key of [target, baseId(target)]) {
    const hit = items.find((i) => i.pkg === key);
    if (hit) return hit;
  }
  return null;
}

// Paket ist in der Session, wenn eine Session-Paket-ID gleich ist oder mit «<pkg>-» beginnt.
export function inSession(pkg, sessionPackages) {
  const id = baseId(pkg).toLowerCase();
  return (sessionPackages || []).some((p) => {
    const s = String(p).toLowerCase();
    return s === id || s.startsWith(`${id}-`);
  });
}

export function clampStage(value) {
  const n = Math.round(Number(value));
  return Number.isFinite(n) ? Math.min(5, Math.max(1, n)) : 1;
}

export function groupsOf(data) {
  const groups = (data.releases || []).map((r) => ({
    key: r.id,
    status: r.status,
    title: r.status === 'later' ? r.title : `${r.id} ${r.title}`.trim(),
    release: r,
    items: r.items || [],
  }));
  if ((data.pool || []).length) {
    groups.push({ key: 'pool', status: 'pool', title: 'Pool / Themen', items: data.pool });
  }
  const rank = (g) => GROUP_ORDER.indexOf(g.status);
  return groups
    .filter((g) => g.status !== 'past')
    .sort((a, b) => (rank(a) < 0 ? 99 : rank(a)) - (rank(b) < 0 ? 99 : rank(b)));
}

export function germanDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
  return m ? `${m[3]}.${m[2]}.${m[1]}` : '';
}

// --- Zustand zwischen den 2-s-Zeichnungen ---------------------------------------

let onlyToday = false;
let pastOpen = false;
let focusOn = false;
let lastSignature = '';
let observer = null;

function lastRelease(data, status) {
  return [...(data.releases || [])].reverse().find((r) => r.status === status);
}

function ciMeta(label, run) {
  if (!run) return el('span', { class: 'rv-unk' }, `${label} unbekannt`);
  const word = CONCLUSION[run.conclusion] || run.conclusion || 'offen';
  return el(
    'span',
    { class: run.conclusion === 'success' ? 'rv-ok' : 'rv-bad' },
    `${label} ${word}`,
  );
}

function liveBar(data, live) {
  const rel = data && lastRelease(data, 'live');
  const meta = el('span', { class: 'rv-meta' });
  if (rel) {
    meta.append(
      el('code', {}, rel.hash || '–'),
      el('span', {}, germanDate(rel.date)),
      el('span', {}, rel.save ? `Save ${rel.save}` : ''),
    );
  }
  if (live) {
    meta.append(ciMeta('CI', live.ci), ciMeta('Pages', live.pages));
    if (live.ahead > 0) {
      meta.append(
        el(
          'span',
          {},
          `main lokal ${live.ahead} Commit${live.ahead === 1 ? '' : 's'} vor origin (ungepusht)`,
        ),
      );
    } else if (live.ahead === 0) {
      meta.append(el('span', {}, 'main = origin/main'));
    }
    if (live.origin) meta.append(el('span', {}, `origin/main ${live.origin}`));
  }
  return el(
    'div',
    { class: 'rv-live' },
    el('strong', {}, rel ? `Live: ${rel.id} «${rel.title}»` : 'Live: –'),
    meta,
  );
}

const WORK_STATUS = {
  active: 'arbeitet',
  delegated: 'lässt arbeiten',
  waiting: 'wartet',
  blocked: 'steckt fest',
  review: 'im Review',
};

function nowBar(state) {
  const work = Array.isArray(state.working_now) ? state.working_now : [];
  const progress = state.releases && state.releases.goal_progress;
  const warnings = (state.releases && state.releases.goal_warnings) || [];
  const head = el('div', { class: 'rv-now-head' }, el('strong', {}, 'Jetzt in Arbeit'));
  if (progress && progress.total > 0) {
    const all = progress.reached >= progress.total;
    head.append(
      el(
        'span',
        { class: all ? 'rv-count all' : 'rv-count' },
        `${progress.reached} von ${progress.total} am Tagesziel`,
      ),
    );
  }
  const box = el('div', { class: 'rv-now' }, head);
  if (!work.length) box.append(el('span', { class: 'rv-now-empty' }, 'Gerade arbeitet niemand'));
  for (const w of work) {
    const line = el(
      'div',
      { class: `rv-now-row st-${WORK_STATUS[w.status] ? w.status : 'active'}` },
      el('code', {}, w.package || '–'),
      el('span', { class: 'rv-owner' }, w.owner || ''),
    );
    for (const a of w.agents || []) {
      line.append(
        el('span', { class: 'rv-agent' }, `${a.role} · ${WORK_STATUS[a.status] || a.status}`),
      );
    }
    line.append(el('span', { class: 'rv-now-st' }, WORK_STATUS[w.status] || w.status || ''));
    box.append(line);
  }
  for (const text of warnings) box.append(el('div', { class: 'rv-goal-warn' }, `⚠ ${text}`));
  return box;
}

function chainRow(steps) {
  const row = el('div', { class: 'rv-chain', id: 'rv-chain' }, el('b', {}, 'Kritischer Pfad'));
  const hardSteps = steps.filter((s) => s.hard);
  hardSteps.forEach((s, i) => {
    if (i) row.append(el('span', { class: 'rv-ar' }, '→'));
    row.append(el('span', { class: 'rv-st hard', 'data-ch': s.ref }, s.label));
  });
  for (const s of steps.filter((x) => !x.hard)) {
    row.append(el('span', { class: 'rv-soft', 'data-ch': s.ref }, `⇄ ${s.label}`));
  }
  return row;
}

function legend() {
  const dot = (cls, text) => el('span', { class: `rv-dot ${cls}` }, text);
  const line = (cls, text) =>
    el('span', { class: 'rv-sess' }, el('i', { class: `rv-line ${cls}` }), text);
  return el(
    'span',
    { class: 'rv-lg' },
    dot('d-done', '✓ fertig'),
    dot('d-run', '▶ läuft'),
    dot('d-wait', '⏸ wartet'),
    dot('d-user', '◆ Nutzer-Session'),
    dot('d-idea', '○ Idee'),
    el('span', { class: 'rv-sess' }, el('span', { class: 'rv-s' }, 'S'), 'in dieser Session'),
    line('hard', 'harte Sperre (Pfeil zum Auslöser)'),
    line('soft', 'weiche Kopplung'),
  );
}

function stageHeader() {
  const head = el('div', { class: 'rv-stages' }, el('div'));
  for (const [name, hint] of STAGES)
    head.append(el('div', {}, el('b', {}, name), el('small', {}, hint)));
  return head;
}

function itemRow(item, ctx) {
  const start = clampStage(item.startStage);
  const stage = Math.max(start, clampStage(item.stage));
  const state = STATE_CLASS[item.state] ? item.state : 'idea';
  const wait = item.waitsFor && item.waitsFor.target ? item.waitsFor : null;
  const frees = (item.frees || []).map((id) => {
    const hit = findItem(ctx.items, id);
    return hit ? hit.name : id;
  });
  const two = !!wait || frees.length > 0;
  const mine = inSession(item.pkg, ctx.sessionPackages);
  const inChain = ctx.chainRefs.has(item.pkg);
  const row = el('div', {
    class: ['rv-row', STATE_CLASS[state], two && 'two', mine ? 'mine' : 'old', inChain && 'dep-row']
      .filter(Boolean)
      .join(' '),
    'data-pkg': item.pkg,
    tabindex: inChain ? '0' : null,
  });
  row.append(
    el(
      'div',
      { class: 'rv-name' },
      el('span', { class: mine ? 'rv-s' : 'rv-s none', title: 'in dieser Session' }, 'S'),
      el('span', {}, item.name || item.pkg, el('small', {}, item.kind || '')),
    ),
  );
  const bar = el('div', {
    class: state === 'idea' ? 'rv-bar dashed' : 'rv-bar',
    style: `grid-column: ${start + 1} / ${stage + 2}`,
  });
  if (stage === 5 || two) bar.append(el('span', { class: 'rv-lbl' }, item.note || ''));
  if (wait && wait.hard && item.state === 'waiting') {
    bar.append(el('span', { class: 'rv-barrier', 'data-stop': item.pkg, title: 'harte Sperre' }));
  }
  bar.append(el('span', { class: 'rv-mk', 'data-mk': item.pkg }, SYMBOL[state]));
  row.append(bar);
  const goal = Number.isInteger(item.goalStage) && item.goalStage >= 1 && item.goalStage <= 5;
  // R656: Ziel = Zielstufe abgeschlossen (wie goal_reached in releases.py).
  const goalDone =
    goal && (stage > item.goalStage || (stage === item.goalStage && item.state === 'done'));
  const goalOpen = goal && !goalDone;
  if (goalDone) bar.append(el('span', { class: 'rv-goal-ok' }, '✓ Ziel erreicht'));
  if (goalOpen) {
    row.append(
      el(
        'div',
        {
          class: 'rv-goal',
          style: `grid-column: ${stage + 2} / ${item.goalStage + 2}`,
          title: `Ziel heute: Stufe ${item.goalStage} · ${STAGES[item.goalStage - 1][0]}`,
        },
        el('span', {}, 'Ziel heute'),
      ),
    );
  }
  const wantsGhost = ctx.items.some(
    (o) => o.waitsFor && String(o.waitsFor.target).startsWith(`${item.pkg}:`) && stage < 5,
  );
  if (wantsGhost) {
    row.append(
      el(
        'div',
        { class: 'rv-bar ghost d-idea', style: `grid-column: ${stage + 2} / ${stage + 3}` },
        el('span', { class: 'rv-lbl' }, item.ghost || '…'),
        el('span', { class: 'rv-mk', 'data-mk': `${item.pkg}#g` }, '○'),
      ),
    );
  }
  const afterFrom = goalOpen ? item.goalStage : stage;
  if (!two && afterFrom < 5) {
    row.append(
      el('div', { class: 'rv-after', style: `grid-column: ${afterFrom + 2} / 7` }, item.note || ''),
    );
  }
  if (two) {
    const chips = el('div', {
      class: 'rv-chips',
      style: `grid-column: ${Math.min(start, 3) + 1} / 7`,
    });
    if (wait) {
      chips.append(
        wait.hard
          ? el('span', { class: 'rv-c wait' }, `⏸ wartet auf: ${wait.label || wait.target}`)
          : el('span', { class: 'rv-c soft' }, `⇄ ${wait.label || wait.target}`),
      );
    }
    for (const name of frees)
      chips.append(el('span', { class: 'rv-c give' }, `gibt frei: ${name}`));
    row.append(chips);
  }
  return row;
}

function groupBox(group, ctx) {
  const cls = group.status === 'live' ? 'live-g' : 'future';
  const box = el('div', { class: `rv-grp ${cls}` });
  const head = el('div', { class: 'rv-gh' }, el('strong', {}, group.title));
  const rel = group.release;
  if (rel && rel.gate) {
    head.append(
      el(
        'span',
        { class: `rv-gate ${GATE_CLASS[rel.status] || 'd-idea'}` },
        `${rel.status === 'live' ? 'LIVE · ' : ''}${rel.gate}`,
      ),
    );
  }
  const facts = rel
    ? [rel.hash, germanDate(rel.date), rel.save && `Save ${rel.save}`].filter(Boolean)
    : [];
  if (facts.length) head.append(el('code', {}, facts.join(' · ')));
  box.append(head);
  for (const item of group.items) box.append(itemRow(item, ctx));
  return box;
}

// --- Pfeile -----------------------------------------------------------------

function roundedPath(points, radius) {
  let d = `M${points[0][0]} ${points[0][1]}`;
  for (let i = 1; i < points.length - 1; i++) {
    const [p, a, n] = [points[i], points[i - 1], points[i + 1]];
    const da = Math.hypot(p[0] - a[0], p[1] - a[1]) || 1;
    const dn = Math.hypot(n[0] - p[0], n[1] - p[1]) || 1;
    const r = Math.min(radius, da / 2, dn / 2);
    const p1 = [p[0] + ((a[0] - p[0]) / da) * r, p[1] + ((a[1] - p[1]) / da) * r];
    const p2 = [p[0] + ((n[0] - p[0]) / dn) * r, p[1] + ((n[1] - p[1]) / dn) * r];
    d += ` L${p1[0]} ${p1[1]} Q${p[0]} ${p[1]} ${p2[0]} ${p2[1]}`;
  }
  const last = points[points.length - 1];
  return `${d} L${last[0]} ${last[1]}`;
}

function arrowDefs() {
  const marker = (kind) =>
    svg(
      'marker',
      {
        id: `rv-ah-${kind}`,
        viewBox: '0 0 10 10',
        refX: 8,
        refY: 5,
        markerWidth: 7,
        markerHeight: 7,
        orient: 'auto-start-reverse',
      },
      svg('path', { d: 'M0 0L10 5L0 10z', class: `rv-head ${kind}` }),
    );
  return svg('defs', {}, marker('hard'), marker('soft'));
}

function visible(node) {
  return !!node && node.getClientRects().length > 0;
}

function drawArrows(box, items) {
  const layer = box.querySelector('#rv-dep');
  if (!layer) return;
  layer.querySelectorAll('.dep').forEach((p) => p.remove());
  const origin = box.getBoundingClientRect();
  if (!origin.width) return;
  const rel = (node) => {
    const r = node.getBoundingClientRect();
    return {
      l: r.left - origin.left,
      r: r.right - origin.left,
      t: r.top - origin.top,
      b: r.bottom - origin.top,
      cx: (r.left + r.right) / 2 - origin.left,
      cy: (r.top + r.bottom) / 2 - origin.top,
    };
  };
  const firstGroup = box.querySelector('.rv-grp');
  if (!firstGroup) return;
  const edge = rel(firstGroup).r;
  const channel = { hard: edge + 30, soft: edge + 78 };
  for (const item of items) {
    const wait = item.waitsFor;
    if (!wait || !wait.target) continue;
    const owner = findItem(items, wait.target);
    if (!owner) continue;
    const hasSuffix = String(wait.target).includes(':') && owner.pkg !== wait.target;
    const ghost = hasSuffix && box.querySelector(`[data-mk="${CSS.escape(`${owner.pkg}#g`)}"]`);
    const target = ghost || box.querySelector(`[data-mk="${CSS.escape(owner.pkg)}"]`);
    const from = box.querySelector(`[data-mk="${CSS.escape(item.pkg)}"]`);
    if (!visible(target) || !visible(from)) continue;
    const t = rel(target);
    const own = rel(from);
    let points;
    if (wait.hard) {
      const stop = box.querySelector(`[data-stop="${CSS.escape(item.pkg)}"]`);
      const head = rel(from.closest('.rv-grp').querySelector('.rv-gh'));
      const s = stop ? rel(stop) : { cx: own.cx, t: own.t };
      points = ghost
        ? [
            [s.cx, s.t],
            [s.cx, head.cy],
            [t.cx, head.cy],
            [t.cx, t.b + 5],
          ]
        : [
            [s.cx, s.t],
            [s.cx, head.cy],
            [channel.hard, head.cy],
            [channel.hard, t.cy],
            [t.r + 4, t.cy],
          ];
    } else {
      points = [
        [own.r + 5, own.cy],
        [channel.soft, own.cy],
        [channel.soft, t.cy],
        [t.r + 5, t.cy],
      ];
    }
    const kind = wait.hard ? 'hard' : 'soft';
    const path = svg('path', {
      d: roundedPath(points, 12),
      class: `dep ${kind}`,
      'data-ids': `${item.pkg} ${owner.pkg}`,
      'marker-end': `url(#rv-ah-${kind})`,
    });
    if (!wait.hard) path.setAttribute('marker-start', `url(#rv-ah-${kind})`);
    layer.append(path);
  }
  layer.setAttribute('height', String(origin.height));
}

// --- Fokus (Hover/Tastatur): ganze Kette hervorheben -----------------------------

function applyChainFocus(root) {
  root.classList.toggle('focus', focusOn);
  for (const node of root.querySelectorAll('.rv-row.dep-row, .rv-chain .rv-st, #rv-dep .dep')) {
    node.classList.toggle('on', focusOn);
  }
}

// --- Aufbau -----------------------------------------------------------------

export function renderReleases(state) {
  const root = document.getElementById('releases');
  const data = state.releases;
  const signature = JSON.stringify([data, state.releases_error, state.live, state.working_now]);
  const first = root.dataset.ready !== '1';
  if (!first && signature === lastSignature) return;
  lastSignature = signature;
  root.dataset.ready = '1';
  const parts = [nowBar(state), liveBar(data, state.live)];
  if (!data) {
    parts.push(
      empty(`Keine Release-Daten: ${state.releases_error || 'releases.json nicht lesbar'}`),
    );
    root.replaceChildren(...parts);
    return;
  }
  const groups = groupsOf(data);
  const items = groups.flatMap((g) => g.items);
  const chain = data.chain || [];
  const ctx = {
    items,
    sessionPackages: data.session_packages || [],
    chainRefs: new Set(chain.map((s) => s.ref)),
  };
  const only = el('input', { type: 'checkbox', id: 'rv-only' });
  only.checked = onlyToday;
  const boxes = el('div', {
    id: 'rv-groups',
    class: onlyToday ? 'rv-groups hide-old' : 'rv-groups',
  });
  for (const g of groups) boxes.append(groupBox(g, ctx));
  boxes.append(svg('svg', { id: 'rv-dep', 'aria-hidden': 'true' }, arrowDefs()));
  const stages = stageHeader();
  const past = el(
    'details',
    { class: 'rv-past' },
    el(
      'summary',
      {},
      `Früher: ${data.pastSummary || 'ältere Releases'} (alles live, ausgeliefert)`,
    ),
  );
  past.open = pastOpen;
  past.addEventListener('toggle', () => {
    pastOpen = past.open;
  });
  parts.push(
    chain.length ? chainRow(chain) : null,
    el('div', { class: 'rv-tools' }, el('label', {}, only, ' nur Pakete von heute (S)'), legend()),
    el('div', { class: 'rv-wrap' }, stages, boxes),
    past,
  );
  root.replaceChildren(...parts.filter(Boolean));
  const redraw = () => {
    for (const g of boxes.querySelectorAll('.rv-grp')) {
      g.hidden = onlyToday && !g.querySelector('.rv-row.mine');
    }
    drawArrows(boxes, items);
    applyChainFocus(root);
  };
  only.addEventListener('change', () => {
    onlyToday = only.checked;
    boxes.classList.toggle('hide-old', onlyToday);
    redraw();
  });
  for (const row of boxes.querySelectorAll('.rv-row.dep-row')) {
    const set = (on) => () => {
      focusOn = on;
      applyChainFocus(root);
    };
    row.addEventListener('mouseenter', set(true));
    row.addEventListener('mouseleave', set(false));
    row.addEventListener('focus', set(true));
    row.addEventListener('blur', set(false));
  }
  if (observer) observer.disconnect();
  observer = new ResizeObserver(redraw); // Tab sichtbar / Fenster geändert
  observer.observe(boxes);
  redraw();
}
