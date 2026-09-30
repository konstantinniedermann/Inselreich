// Fokus und offene Kacheln über das Neuzeichnen hinweg (Spec Prozess-Graph, P14, P28).
// Genau ein Fokus: ein Agent (Kachel-Klick) oder eine Graph-Zeile (Zeilen-Klick).

export const openNodes = new Set();
let focus = null; // { type: 'agent' | 'row', key }

// Kachel-Klick: zugeklappt → aufklappen und Agent-Fokus; aufgeklappt → zuklappen,
// Fokus nur aufheben, wenn diese Kachel ihn hatte.
export function toggleNode(key) {
  if (openNodes.has(key)) {
    openNodes.delete(key);
    if (focus?.type === 'agent' && focus.key === key) focus = null;
  } else {
    openNodes.add(key);
    focus = { type: 'agent', key };
  }
  applyFocus();
}

// Zeilen-Klick: Zeilen-Fokus setzen oder (gleiche Zeile) aufheben; Kacheln bleiben offen.
export function toggleRow(id) {
  focus = focus?.type === 'row' && focus.key === id ? null : { type: 'row', key: id };
  applyFocus();
}

// Verschwundene Schlüssel still verwerfen (K6, P34).
export function dropMissing(agentKeys, rowIds) {
  for (const key of [...openNodes]) if (!agentKeys.has(key)) openNodes.delete(key);
  if (focus?.type === 'agent' && !agentKeys.has(focus.key)) focus = null;
  if (focus?.type === 'row' && !rowIds.has(focus.key)) focus = null;
}

// Klassen setzen: .open-Zustand, .highlight (Kacheln einer fokussierten Zeile),
// .focused (Zeile), .dim (alles ausser dem fokussierten Agenten, G8).
export function applyFocus() {
  const agent = focus?.type === 'agent' ? focus.key : null;
  const rowId = focus?.type === 'row' ? focus.key : null;
  const involved = new Set();
  for (const row of document.querySelectorAll('#graph .graph-row')) {
    const hit = rowId !== null && row.dataset.id === rowId;
    row.classList.toggle('focused', hit);
    if (hit) for (const key of row.dataset.agents.split(' ')) involved.add(key);
  }
  for (const card of document.querySelectorAll('#org .node')) {
    card.open = openNodes.has(card.dataset.key);
    card.classList.toggle('highlight', involved.has(card.dataset.key));
  }
  for (const item of document.querySelectorAll('#graph [data-agents]')) {
    const mine = item.dataset.agents.split(' ').includes(agent);
    item.classList.toggle('dim', agent !== null && !mine);
  }
}
