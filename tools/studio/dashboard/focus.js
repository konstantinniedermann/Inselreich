// Fokus auf eine Graph-Zeile über das Neuzeichnen hinweg (Spec Prozess-Graph, P14).
// Der frühere Agent-Fokus über die Organigramm-Kacheln entfiel mit dem Organigramm.

let focusedRow = null;

// Zeilen-Klick: Zeilen-Fokus setzen oder (gleiche Zeile) aufheben.
export function toggleRow(id) {
  focusedRow = focusedRow === id ? null : id;
  applyFocus();
}

// Verschwundene Zeile still verwerfen (K6, P34).
export function dropMissing(rowIds) {
  if (focusedRow !== null && !rowIds.has(focusedRow)) focusedRow = null;
}

// Klasse .focused auf die fokussierte Graph-Zeile setzen.
export function applyFocus() {
  for (const row of document.querySelectorAll('#graph .graph-row')) {
    row.classList.toggle('focused', focusedRow !== null && row.dataset.id === focusedRow);
  }
}
