/**
 * Structural preview-vs-PDF compare — port of compare_batch.py.
 *
 * Content comparison isn't feasible: PDF exports reorder columns/rows and
 * sometimes inject a leading "Sr. No." column absent from the preview. So the
 * check is purely structural — rows × cols — with a tolerance for that extra
 * serial-number column.
 *
 * Note on when this runs: the parallel Python runner forced
 * DISABLE_ROW_COL_COMPARE=1, i.e. the *default* regression only asserts "not
 * empty" (reason 'no_data'). The full row/col assertion is the deeper mode,
 * enabled here via `compareShape` when REPORT_COMPARE_SHAPE=1.
 */
const SR_NO_VARIANTS = new Set([
  'srno', 'sno', 'sr', 'srl', 'srlno', 'serial', 'serialno', 'serialnumber',
  'slno', 'no', 'index', 'idx',
]);

function normLabel(s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function isSrNoLabel(label) {
  if ((label || '').trim() === '#') return true;
  return SR_NO_VARIANTS.has(normLabel(label));
}

function previewShape(rows) {
  if (!rows.length) return [0, 0];
  return [rows.length, Math.max(...rows.map((r) => r.length))];
}

/**
 * Compare one preview table against the PDF's extracted rows/header.
 * @param {string[][]} preview  preview table rows (shape only)
 * @param {{header:string[], cols:number, dataRows:string[][]}} pdf
 * @param {boolean} compareShape  false → only no-data can fail (the smoke default)
 */
function comparePair(preview, pdf, compareShape) {
  const [pRows, pCols] = previewShape(preview);
  const eRows = pdf.dataRows.length;
  const eCols = pdf.cols;
  const eFirst = pdf.header[0] || '';

  const result = {
    previewRows: pRows,
    previewCols: pCols,
    pdfRows: eRows,
    pdfCols: eCols,
    pdfSrNo: false,
    status: 'fail',
    reason: '',
  };

  if (pRows === 0 && eRows === 0) {
    result.reason = 'no_data';
    return result;
  }

  if (!compareShape) {
    result.status = 'pass';
    result.reason = 'bypass';
    return result;
  }

  let colOk = pCols === eCols;
  if (!colOk && eCols === pCols + 1 && isSrNoLabel(eFirst)) {
    colOk = true;
    result.pdfSrNo = true;
  }
  const rowOk = pRows === eRows;

  if (rowOk && colOk) {
    result.status = 'pass';
    return result;
  }
  if (!rowOk && !colOk) result.reason = 'rows_cols';
  else if (!rowOk) result.reason = 'rows';
  else result.reason = 'cols';
  return result;
}

module.exports = { comparePair, isSrNoLabel };
