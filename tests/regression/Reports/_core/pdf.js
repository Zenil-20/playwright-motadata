/**
 * PDF text + table extraction — the JavaScript replacement for pdfplumber.
 *
 * The Python harness used `pdfplumber.extract_text()` (for the "no data" check)
 * and `pdfplumber.extract_tables()` (for the structural row×col compare). Here
 * we drive pdfjs-dist's text layer:
 *
 *   - `pdfText()`   joins every text item → plain text for the no-data check.
 *   - `pdfTables()` clusters text items by their y-position into rows and by
 *     x-position into columns, reconstructing the table shape pdfplumber gave
 *     us for free. pdfjs exposes each glyph run's page coordinates via
 *     `item.transform` ([a,b,c,d,e,f] where e=x, f=y), enough to recover
 *     rows/cols without a full geometric table detector.
 *
 * pdfjs ships as ESM-only (.mjs). These files load as CommonJS, so a static
 * require would fail; a lazy dynamic import() loads pdfjs as native ESM. pdfjs
 * runs main-thread in Node — the DOMMatrix/Path2D polyfill warnings it prints
 * only affect canvas rendering, which we never do.
 */
let _pdfjs = null;
function pdfjs() {
  if (!_pdfjs) _pdfjs = import('pdfjs-dist/legacy/build/pdf.mjs');
  return _pdfjs;
}

async function loadPages(data) {
  const { getDocument } = await pdfjs();
  // pdfjs transfers the backing ArrayBuffer to its (loopback) worker; a buffer
  // that came from Node's pooled allocator can throw DataCloneError there.
  // Hand it a standalone copy so the transfer always succeeds.
  const bytes = Uint8Array.from(data);
  const doc = await getDocument({
    data: bytes,
    isEvalSupported: false,
    useSystemFonts: false,
    verbosity: 0,
  }).promise;
  const pages = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    pages.push(content.items.filter((it) => 'str' in it));
  }
  await doc.destroy();
  return pages;
}

/** Full plain-text of the PDF (all pages), for the "no data" marker check. */
async function pdfText(data) {
  return textFromPages(await loadPages(data));
}

function textFromPages(pages) {
  const out = [];
  for (const items of pages) {
    let line = '';
    for (const it of items) {
      line += it.str;
      if (it.hasEOL) {
        out.push(line);
        line = '';
      }
    }
    if (line) out.push(line);
  }
  return out.join('\n');
}

/**
 * Text AND table shape from a single parse. Every report now needs both (the
 * no-data check wants the text, the HTML report wants the row×col counts even
 * on a pass), and parsing the document twice is the one thing that would make
 * always-on counting expensive.
 */
async function pdfTextAndTables(data) {
  const pages = await loadPages(data);
  return { text: textFromPages(pages), ...tablesFromPages(pages) };
}

/**
 * Reconstruct table rows from the text layer. Returns the deduped DATA rows
 * (header excluded) plus the header cells and column count — the same triple
 * compare_batch.py's `extract_pdf_rows` produced.
 *
 * Strategy: group items by rounded y (a visual row), sort each row's items by
 * x, and split into cells wherever the horizontal gap between consecutive items
 * exceeds a threshold (columns are separated by whitespace far wider than the
 * inter-glyph gap). Rows with < 2 cells are treated as prose, not table rows.
 */
async function pdfTables(data) {
  return tablesFromPages(await loadPages(data));
}

function tablesFromPages(pages) {
  const allRows = [];
  for (const items of pages) {
    // Bucket by y (rounded; PDF y grows upward so higher y = higher on page).
    const byY = new Map();
    for (const it of items) {
      if (!it.str.trim()) continue;
      const y = Math.round(it.transform[5]);
      if (!byY.has(y)) byY.set(y, []);
      byY.get(y).push(it);
    }
    const ys = [...byY.keys()].sort((a, b) => b - a);
    for (const y of ys) {
      const row = byY.get(y).sort((a, b) => a.transform[4] - b.transform[4]);
      const cells = [];
      let cur = '';
      let prevEnd = -Infinity;
      for (const it of row) {
        const x = it.transform[4];
        if (cur && x - prevEnd > 12) {
          cells.push(cur.trim());
          cur = '';
        }
        cur += it.str;
        prevEnd = x + it.width;
      }
      if (cur.trim()) cells.push(cur.trim());
      const clean = cells.map((c) => c.replace(/\s+/g, ' ').trim()).filter(Boolean);
      if (clean.length >= 2) allRows.push(clean);
    }
  }

  if (allRows.length === 0) return { header: [], cols: 0, dataRows: [] };

  // First qualifying row is the header (pdfplumber's table[0]); it repeats on
  // every page, so dedupe by content and drop any row equal to the header.
  const header = allRows[0];
  const headerKey = header.join('|');
  const seen = new Set();
  const dataRows = [];
  let cols = header.length;
  for (const row of allRows) {
    const key = row.join('|');
    if (key === headerKey) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    dataRows.push(row);
    if (row.length > cols) cols = row.length;
  }
  return { header, cols, dataRows };
}

module.exports = { pdfText, pdfTables, pdfTextAndTables };
