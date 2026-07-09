/*
 * Minimal, dependency-free CSV parse/serialize.
 * Handles quoted fields, embedded commas/newlines, and "" escapes.
 * Ported from observeops-qa framework/services/csv_service.py (Python -> JS).
 */

/** Parse CSV text into an array of row objects keyed by the header row. */
export function parseCsv(text) {
  const rows = parseRows(text);
  if (rows.length === 0) return [];
  const headers = rows[0];
  return rows.slice(1)
    .filter((r) => r.length && !(r.length === 1 && r[0] === ''))
    .map((r) => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = (r[i] ?? '').trim(); });
      return obj;
    });
}

/** Parse CSV text into an array of string arrays (raw cells). */
export function parseRows(text) {
  const out = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  // strip BOM
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field); field = '';
    } else if (c === '\n') {
      row.push(field); field = ''; out.push(row); row = [];
    } else if (c === '\r') {
      // ignore; handled on \n
    } else {
      field += c;
    }
  }
  // flush last field/row
  if (field.length || row.length) { row.push(field); out.push(row); }
  return out;
}

/** Serialize an array of row objects to CSV text using the given column order. */
export function toCsv(rows, columns) {
  const cols = columns || (rows[0] ? Object.keys(rows[0]) : []);
  const esc = (v) => {
    const s = v == null ? '' : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [cols.join(',')];
  for (const r of rows) lines.push(cols.map((c) => esc(r[c])).join(','));
  return lines.join('\n') + '\n';
}
