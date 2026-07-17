/**
 * Custom Playwright reporter → a single self-contained HTML run report, built for
 * a QA engineer to capture a bug in seconds:
 *
 *   - every report is a row: rendered screenshot, plain-English verdict, and the
 *     preview-vs-PDF row×col evidence (passes included — a pass you can look at
 *     beats a green tick);
 *   - a bug-TYPE badge (UI bug / Export bug / No export / Load timeout / No data)
 *     so you know what kind of defect it is at a glance;
 *   - "↗ open" deep-links straight to the report in the app to reproduce;
 *   - "Copy bug" / "Copy all failures" put a paste-ready, repro-stepped bug on
 *     your clipboard for Jira / ServiceOps;
 *   - the exported PDF is linked next to each failure when REPORT_SAVE_ARTIFACTS=1.
 *
 * It works across workers because it consumes the `report-verdict` /
 * `report-screenshot` attachments each test emits (see _core/validate.js).
 *
 * Register it (playwright.config):
 *   reporter: [['line'], ['./tests/Reports/_core/html-reporter.js']]
 * Options / env: outputDir → REPORT_HTML_DIR (default test-results/report-regression)
 */
const fs = require('node:fs');
const path = require('node:path');

const STATUS_META = {
  ok: { label: 'PASS', cls: 'pass', group: 'pass' },
  timeout: { label: 'TIMEOUT', cls: 'timeout', group: 'fail' },
  faulty: { label: 'FAIL', cls: 'fail', group: 'fail' },
  no_pdf: { label: 'NO PDF', cls: 'fail', group: 'fail' },
  error: { label: 'ERROR', cls: 'error', group: 'fail' },
  // creation-matrix statuses (rows sourced from the `creation-results` attachment)
  created: { label: 'CREATED', cls: 'pass', group: 'pass' },
  skipped: { label: 'N/A', cls: 'warn', group: 'skip' },
  failed_create: { label: 'CREATE FAIL', cls: 'fail', group: 'fail' },
};

/**
 * The bug TYPE — what a QA engineer actually files. Derived from status + which
 * side was empty, so a glance tells you whether it's a UI defect, an export
 * defect, a missing export, or a slow/broken load.
 */
function bugType(r) {
  if (r.status === 'ok') return { key: 'pass', label: 'Pass', cls: 'pass', hint: 'Data rendered on screen and in the exported PDF' };
  if (r.status === 'created') return { key: 'created', label: 'Created', cls: 'pass', hint: 'Report created via the creation wizard (not separately validated)' };
  if (r.status === 'skipped') return { key: 'skipped', label: 'Not available', cls: 'warn', hint: 'Report type/tile not available on this instance — scenario skipped' };
  if (r.status === 'failed_create') return { key: 'create_fail', label: 'Create failed', cls: 'fail', hint: 'The creation wizard did not produce a report id' };
  if (r.status === 'no_pdf') return { key: 'no_export', label: 'No export', cls: 'fail', hint: 'Export As PDF produced no file — button missing or the server never delivered it' };
  if (r.status === 'timeout') return { key: 'timeout', label: 'Load timeout', cls: 'timeout', hint: 'The report data never rendered within the time budget' };
  if (r.status === 'error') return { key: 'error', label: 'Error', cls: 'error', hint: 'The check threw before it could finish' };
  if (r.where === 'both') return { key: 'no_data', label: 'No data', cls: 'fail', hint: 'Both the UI preview and the exported PDF are empty' };
  if (r.where === 'preview') return { key: 'ui_bug', label: 'UI bug', cls: 'fail', hint: 'Data is missing on screen but present in the exported PDF' };
  if (r.where === 'pdf') return { key: 'export_bug', label: 'Export bug', cls: 'fail', hint: 'Data is on screen but lost in the exported PDF' };
  return { key: 'shape', label: 'Shape mismatch', cls: 'warn', hint: 'The UI preview and the exported PDF have different row/column counts' };
}

class ReportRegressionHtmlReporter {
  constructor(options = {}) {
    this.outputDir = path.resolve(
      process.cwd(),
      options.outputDir || process.env.REPORT_HTML_DIR || 'test-results/report-regression',
    );
    this.rows = new Map();
    this.startedAt = Date.now();
  }

  printsToStdio() {
    return false;
  }

  onBegin() {
    this.startedAt = Date.now();
    // NB: the folder is cleared in onEnd, only when report-module tests actually
    // ran — so running an unrelated suite (Settings, Dashboard…) never wipes the
    // last report-regression report.
  }

  onTestEnd(test, result) {
    // Only the report-module tests belong in this report. When the WHOLE
    // framework runs, this reporter still fires for every Settings/Dashboard/…
    // test; skip anything that isn't under tests/Reports so the table stays
    // exactly the report catalogue. (A report test that died before emitting a
    // verdict is still under tests/Reports, so it keeps its row.)
    const file = (test.location && test.location.file) || '';

    // Creation-matrix results: one row per scenario (every category, incl. the
    // ones skipped as "not available on this instance"). Additive — this fires
    // only for the matrix spec's `creation-results` attachment; validation rows
    // below are unaffected.
    const creation = readJsonAttachment(result, 'creation-results');
    if (Array.isArray(creation) && creation.length) {
      creation.forEach((rec, idx) => {
        let status;
        if (rec.status === 'skipped') status = 'skipped';
        else if (rec.status === 'failed') status = 'failed_create';
        else status = rec.validation || 'created'; // 'created', or the validation verdict when chained
        this.rows.set(`${test.id}#c${idx}`, {
          title: rec.name || `${rec.category}-${rec.scenario}`,
          id: rec.id || '',
          name: rec.name || `${rec.category}/${rec.scenario}`,
          url: rec.url || '',
          status,
          where: rec.where || '',
          reason: rec.reason || rec.validationReason || '',
          preview: rec.preview || { rows: 0, cols: 0 },
          pdf: rec.pdf || { rows: 0, cols: 0 },
          shapeMatch: null,
          srNoColumn: false,
          loadMs: 0,
          durationMs: 0,
          startedAt: result.startTime ? new Date(result.startTime).getTime() : null,
          shotPath: rec.shotPath || null,
          pdfPath: null,
        });
      });
    }

    // Only the report-VALIDATION tests belong here (each is one report + verdict).
    // A validation test that died before emitting a verdict is still in that file,
    // so it keeps its row; the creation spec and every other suite are excluded.
    const isValidation = /report-validation\.spec\./.test(file);
    if (!isValidation && !findAttachment(result, 'report-verdict')) return;

    const verdict = readJsonAttachment(result, 'report-verdict');
    const shot = findAttachment(result, 'report-screenshot') || findAttachment(result, 'screenshot');
    const pdf = (result.attachments || []).find((a) => a.name && /\.pdf$/i.test(a.name) && a.path);

    const status = verdict ? verdict.status : result.status === 'passed' ? 'ok' : 'error';
    const reason = verdict
      ? verdict.reason
      : result.status === 'timedOut'
        ? `Test exceeded PER_REPORT_TIMEOUT (${Math.round(result.duration / 1000)}s) — the whole check stalled, not just the data load`
        : cleanError(result.error && (result.error.message || String(result.error)));

    this.rows.set(test.id, {
      title: test.title,
      id: verdict ? verdict.id : idFromTitle(test.title),
      name: verdict ? verdict.name : test.title,
      url: verdict ? verdict.url || '' : '',
      status,
      where: (verdict && verdict.where) || '',
      reason: reason || '',
      preview: (verdict && verdict.preview) || { rows: 0, cols: 0 },
      pdf: (verdict && verdict.pdf) || { rows: 0, cols: 0 },
      shapeMatch: verdict ? verdict.shapeMatch : null,
      srNoColumn: !!(verdict && verdict.srNoColumn),
      loadMs: (verdict && verdict.loadMs) || 0,
      durationMs: result.duration,
      startedAt: result.startTime ? new Date(result.startTime).getTime() : null,
      shotPath: shot && shot.path ? shot.path : null,
      pdfPath: pdf ? pdf.path : null,
    });
  }

  async onEnd() {
    const rows = [...this.rows.values()];
    if (!rows.length) return; // no report-module tests ran — leave any prior report untouched

    // Now that we know reports ran, drop the previous report and rebuild it.
    clearOutputDir(this.outputDir);

    const shotsDir = path.join(this.outputDir, 'screenshots');
    const pdfsDir = path.join(this.outputDir, 'pdfs');
    await fs.promises.mkdir(shotsDir, { recursive: true });

    for (const r of rows) {
      r.shot = null;
      r.pdf_href = null;
      const base = slug(`${r.name}__${r.id}`);
      if (r.shotPath && fs.existsSync(r.shotPath)) {
        try {
          await fs.promises.copyFile(r.shotPath, path.join(shotsDir, `${base}.png`));
          r.shot = `screenshots/${base}.png`;
        } catch {
          /* screenshot is nice-to-have */
        }
      }
      if (r.pdfPath && fs.existsSync(r.pdfPath)) {
        try {
          await fs.promises.mkdir(pdfsDir, { recursive: true });
          await fs.promises.copyFile(r.pdfPath, path.join(pdfsDir, `${base}.pdf`));
          r.pdf_href = `pdfs/${base}.pdf`;
        } catch {
          /* pdf link is nice-to-have */
        }
      }
    }

    // Failures first (highest bug value), then by name.
    const rank = (r) => ((STATUS_META[r.status] || STATUS_META.error).group === 'fail' ? 0 : 1);
    rows.sort((a, b) => rank(a) - rank(b) || String(a.name).localeCompare(String(b.name)));

    const baseUrl = deriveBaseUrl(rows);
    const html = renderHtml(rows, {
      startedAt: this.startedAt,
      durationMs: Date.now() - this.startedAt,
      readyTimeoutS: Number(process.env.REPORT_READY_TIMEOUT || 10),
      compareShape: ['1', 'true', 'yes'].includes((process.env.REPORT_COMPARE_SHAPE || '').toLowerCase()),
      baseUrl,
    });

    const file = path.join(this.outputDir, 'index.html');
    await fs.promises.writeFile(file, html, 'utf-8');

    const failed = rows.filter((r) => (STATUS_META[r.status] || STATUS_META.error).group === 'fail').length;
    process.stdout.write(`\nReport regression: ${rows.length - failed} passed, ${failed} failed → file://${file}\n`);
  }
}

/* ---------------------------------------------------------------- helpers -- */

function clearOutputDir(dir) {
  for (const entry of ['index.html', 'screenshots', 'pdfs']) {
    try {
      fs.rmSync(path.join(dir, entry), { recursive: true, force: true });
    } catch {
      /* nothing to clear */
    }
  }
}

function findAttachment(result, name) {
  return (result.attachments || []).find((a) => a.name === name);
}

function readJsonAttachment(result, name) {
  const a = findAttachment(result, name);
  if (!a) return null;
  try {
    const raw = a.body ? a.body.toString('utf-8') : a.path ? fs.readFileSync(a.path, 'utf-8') : '';
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function deriveBaseUrl(rows) {
  const env = (process.env.Motadata_Aiops || '').replace(/\/+$/, '');
  if (env) return env;
  const withUrl = rows.find((r) => r.url);
  if (withUrl) {
    const m = /^(https?:\/\/[^/]+)/.exec(withUrl.url);
    if (m) return m[1];
  }
  return '';
}

function idFromTitle(title) {
  const m = /\[([^\]]+)\]\s*$/.exec(title || '');
  return m ? m[1] : '';
}

function cleanError(msg) {
  if (!msg) return 'Test failed';
  const plain = String(msg).replace(/\[[0-9;]*m/g, '').trim();
  return plain.split('\n').slice(0, 3).join(' ').slice(0, 400);
}

function slug(s) {
  return String(s).replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 120) || 'report';
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function shape(s) {
  if (!s || (!s.rows && !s.cols)) return '<span class="dim">—</span>';
  return `<span class="num">${s.rows}</span> <span class="x">x</span> <span class="num">${s.cols}</span>`;
}

function renderHtml(rows, meta) {
  const total = rows.length;
  const passed = rows.filter((r) => r.status === 'ok').length;
  const failed = total - passed;

  // Bug-type tallies for the clickable summary chips.
  const typeCounts = new Map();
  for (const r of rows) {
    const t = bugType(r);
    if (t.key === 'pass') continue;
    typeCounts.set(t.key, { label: t.label, cls: t.cls, n: (typeCounts.get(t.key)?.n || 0) + 1 });
  }

  const cards = [
    `<button class="card" data-f="all"><div class="n">${total}</div><div class="l">Reports</div></button>`,
    `<button class="card ok" data-f="pass"><div class="n">${passed}</div><div class="l">Passed</div></button>`,
    `<button class="card bad" data-f="fail"><div class="n">${failed}</div><div class="l">Failed</div></button>`,
    ...[...typeCounts.entries()].map(
      ([key, v]) =>
        `<button class="card sub ${v.cls}" data-type="${esc(key)}"><div class="n">${v.n}</div><div class="l">${esc(v.label)}</div></button>`,
    ),
  ].join('');

  // Per-row bug payload for the copy buttons (kept out of the DOM text).
  const payloads = [];

  const bodyRows = rows.map((r, i) => {
    const m = STATUS_META[r.status] || STATUS_META.error;
    const t = bugType(r);
    const url = r.url || (meta.baseUrl && r.id ? `${meta.baseUrl}/reports/view/${r.id}` : '');
    const isFail = m.group === 'fail';

    payloads.push({
      i,
      name: r.name,
      id: r.id,
      type: t.label,
      hint: t.hint,
      reason: r.reason,
      url,
      server: meta.baseUrl,
      preview: r.preview,
      pdf: r.pdf,
      loadMs: r.loadMs,
      status: m.label,
    });

    const mismatch =
      r.shapeMatch === false
        ? `<span class="warn" title="preview and exported PDF do not have the same shape">mismatch</span>`
        : r.srNoColumn
          ? `<span class="dim" title="PDF adds a leading Sr. No. column — tolerated">+Sr.No</span>`
          : '';
    const thumb = r.shot
      ? `<img class="thumb" src="${esc(r.shot)}" loading="lazy" alt="${esc(r.name)}" data-full="${esc(r.shot)}" data-cap="${esc(r.name)} — ${esc(t.label)}${r.reason ? `: ${esc(r.reason)}` : ''}">`
      : '<span class="dim">no shot</span>';

    const links = [
      url ? `<a class="lnk" href="${esc(url)}" target="_blank" rel="noopener" title="Open this report in the app to reproduce">↗ open</a>` : '',
      r.pdf_href ? `<a class="lnk" href="${esc(r.pdf_href)}" target="_blank" title="The PDF this report exported">PDF</a>` : '',
      isFail ? `<button class="copy" data-i="${i}" title="Copy a paste-ready bug report to the clipboard">Copy bug</button>` : '',
    ]
      .filter(Boolean)
      .join(' ');

    return `<tr data-group="${m.group}" data-type="${esc(t.key)}" data-q="${esc(`${r.name} ${r.id} ${t.label} ${r.reason}`.toLowerCase())}" data-name="${esc(String(r.name).toLowerCase())}" data-load="${r.loadMs}" data-rank="${isFail ? 0 : 1}">
  <td class="i">${i + 1}</td>
  <td class="nm"><div class="t">${esc(r.name)}</div><div class="id">id ${esc(r.id)}</div></td>
  <td><span class="badge ${t.cls}" title="${esc(t.hint)}">${esc(t.label)}</span></td>
  <td class="rsn">${r.reason ? esc(r.reason) : '<span class="dim">—</span>'}</td>
  <td class="sh">${shape(r.preview)}</td>
  <td class="sh">${shape(r.pdf)} ${mismatch}</td>
  <td class="ms">${(r.loadMs / 1000).toFixed(1)}s</td>
  <td class="pic">${thumb}</td>
  <td class="act">${links || '<span class="dim">—</span>'}</td>
</tr>`;
  });

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Report Regression — ${passed}/${total} passed</title>
<style>
  :root { color-scheme: light dark; --bg:#0f1115; --panel:#171a21; --line:#272c36; --fg:#e6e8ee; --dim:#8b93a3;
          --pass:#2ea86b; --fail:#e5484d; --warn:#f5a524; --info:#4c8dff; }
  @media (prefers-color-scheme: light) { :root { --bg:#f6f7f9; --panel:#fff; --line:#e3e6ea; --fg:#1b1f27; --dim:#6b7280; } }
  * { box-sizing: border-box; }
  body { margin:0; padding:28px; background:var(--bg); color:var(--fg);
         font:14px/1.5 -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
  a { color:var(--info); }
  h1 { margin:0 0 4px; font-size:20px; letter-spacing:-0.01em; }
  .meta { color:var(--dim); font-size:12.5px; margin-bottom:16px; }
  .meta b { color:var(--fg); font-weight:600; }
  .cards { display:flex; flex-wrap:wrap; gap:10px; margin-bottom:16px; }
  .card { background:var(--panel); border:1px solid var(--line); border-radius:10px; padding:12px 16px; min-width:104px;
          text-align:left; cursor:pointer; font:inherit; color:inherit; }
  .card:hover { border-color:var(--info); }
  .card.sel { border-color:var(--info); box-shadow:0 0 0 1px var(--info) inset; }
  .card .n { font-size:22px; font-weight:650; }
  .card .l { color:var(--dim); font-size:12px; text-transform:uppercase; letter-spacing:.04em; }
  .card.ok .n { color:var(--pass); } .card.bad .n { color:var(--fail); }
  .card.sub .n { font-size:18px; } .card.sub.fail .n { color:var(--fail); } .card.sub.warn .n { color:var(--warn); }
  .card.sub.timeout .n { color:var(--warn); } .card.sub.error .n { color:var(--fail); }
  .bar { display:flex; gap:8px; align-items:center; margin-bottom:12px; flex-wrap:wrap; }
  button { background:var(--panel); color:var(--fg); border:1px solid var(--line); border-radius:8px;
           padding:6px 12px; font:inherit; cursor:pointer; }
  button:hover { border-color:var(--info); }
  input { background:var(--panel); color:var(--fg); border:1px solid var(--line); border-radius:8px;
          padding:6px 12px; font:inherit; min-width:240px; }
  .wrap { overflow-x:auto; border:1px solid var(--line); border-radius:10px; background:var(--panel); }
  table { border-collapse:collapse; width:100%; min-width:1040px; }
  th, td { text-align:left; padding:10px 12px; border-bottom:1px solid var(--line); vertical-align:top; }
  th { font-size:11.5px; text-transform:uppercase; letter-spacing:.05em; color:var(--dim); font-weight:600;
       position:sticky; top:0; background:var(--panel); cursor:pointer; white-space:nowrap; }
  th.sortable::after { content:' ⇅'; color:var(--dim); font-size:10px; }
  tr:last-child td { border-bottom:0; }
  td.i { color:var(--dim); font-variant-numeric:tabular-nums; }
  .nm .t { font-weight:600; } .nm .id { color:var(--dim); font-size:12px; }
  .badge { display:inline-block; padding:2px 8px; border-radius:999px; font-size:11px; font-weight:700; letter-spacing:.03em; cursor:help; }
  .badge.pass { background:rgba(46,168,107,.16); color:var(--pass); }
  .badge.fail { background:rgba(229,72,77,.16); color:var(--fail); }
  .badge.timeout { background:rgba(245,165,36,.18); color:var(--warn); }
  .badge.warn { background:rgba(245,165,36,.18); color:var(--warn); }
  .badge.error { background:rgba(229,72,77,.16); color:var(--fail); }
  .rsn { max-width:400px; }
  .sh { white-space:nowrap; font-variant-numeric:tabular-nums; } .sh .num { font-weight:650; } .sh .x { color:var(--dim); }
  .ms { color:var(--dim); font-variant-numeric:tabular-nums; white-space:nowrap; }
  .warn { color:var(--warn); font-size:11px; font-weight:700; margin-left:4px; }
  .dim { color:var(--dim); }
  .act { white-space:nowrap; }
  .act .lnk { display:inline-block; margin-right:8px; text-decoration:none; font-size:12.5px; }
  .act .lnk:hover { text-decoration:underline; }
  .copy { padding:3px 8px; font-size:12px; border-radius:6px; }
  .copy.done { border-color:var(--pass); color:var(--pass); }
  .thumb { width:150px; height:92px; object-fit:cover; object-position:top left; border:1px solid var(--line);
           border-radius:6px; cursor:zoom-in; display:block; background:#fff; }
  #lb { position:fixed; inset:0; background:rgba(0,0,0,.9); display:none; z-index:9; padding:24px; overflow:auto; }
  #lb.on { display:block; }
  #lb .cap { color:#fff; text-align:center; margin-bottom:12px; font-size:13px; }
  #lb img { max-width:100%; display:block; margin:0 auto; border-radius:6px; }
  #lb .nav { position:fixed; top:50%; transform:translateY(-50%); color:#fff; font-size:34px; cursor:pointer;
             padding:0 18px; user-select:none; opacity:.7; } #lb .nav:hover { opacity:1; }
  #lb #prev { left:8px; } #lb #next { right:8px; } #lb #close { position:fixed; top:12px; right:20px; color:#fff; font-size:26px; cursor:pointer; }
  .toast { position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:var(--pass); color:#fff;
           padding:10px 18px; border-radius:8px; font-size:13px; opacity:0; transition:opacity .2s; pointer-events:none; }
  .toast.on { opacity:1; }
</style>
</head>
<body>
  <h1>Report Regression</h1>
  <div class="meta">
    <b>${passed}/${total}</b> passed &middot;
    server <b>${esc(meta.baseUrl || 'n/a')}</b> &middot;
    ${new Date(meta.startedAt).toLocaleString()} &middot; ran ${(meta.durationMs / 1000).toFixed(0)}s &middot;
    data timeout ${meta.readyTimeoutS}s/report &middot;
    shape compare ${meta.compareShape ? 'enforced' : 'reported only'}
  </div>
  <div class="cards">${cards}</div>
  <div class="bar">
    <input id="q" type="search" placeholder="Filter by name, id, type, reason…">
    <button id="copyall" title="Copy every failure as a paste-ready bug list">Copy all failures (${failed})</button>
    <span class="dim" id="shown"></span>
  </div>
  <div class="wrap">
    <table>
      <thead><tr>
        <th data-sort="rank" class="sortable">#</th>
        <th data-sort="name" class="sortable">Report</th>
        <th data-sort="type" class="sortable">Bug type</th>
        <th>Reason</th>
        <th>Preview<br>rows x cols</th><th>Export (PDF)<br>rows x cols</th>
        <th data-sort="load" class="sortable">Load</th>
        <th>Screenshot</th><th>Actions</th>
      </tr></thead>
      <tbody>
${bodyRows.join('\n')}
      </tbody>
    </table>
  </div>
  <div id="lb"><span id="close">×</span><span class="nav" id="prev">‹</span><span class="nav" id="next">›</span><div class="cap"></div><img alt=""></div>
  <div class="toast" id="toast"></div>
<script>
  var DATA = ${JSON.stringify(payloads).replace(/</g, '\\u003c')};
  var META = { server: ${JSON.stringify(meta.baseUrl || '').replace(/</g, '\\u003c')}, when: ${JSON.stringify(new Date(meta.startedAt).toLocaleString())} };
  var rows = Array.prototype.slice.call(document.querySelectorAll('tbody tr'));
  var tbody = document.querySelector('tbody');
  var group = 'all', typeF = '', q = '';

  function apply() {
    var shown = 0;
    rows.forEach(function (r) {
      var okG = group === 'all' || r.dataset.group === group;
      var okT = !typeF || r.dataset.type === typeF;
      var okQ = !q || r.dataset.q.indexOf(q) !== -1;
      var vis = okG && okT && okQ;
      r.style.display = vis ? '' : 'none';
      if (vis) shown++;
    });
    document.getElementById('shown').textContent = shown + ' shown';
  }
  function selectCard(el) {
    document.querySelectorAll('.card').forEach(function (c) { c.classList.remove('sel'); });
    if (el) el.classList.add('sel');
  }
  document.querySelectorAll('.card[data-f]').forEach(function (b) {
    b.onclick = function () { group = b.dataset.f; typeF = ''; selectCard(b); apply(); };
  });
  document.querySelectorAll('.card[data-type]').forEach(function (b) {
    b.onclick = function () { group = 'all'; typeF = b.dataset.type; selectCard(b); apply(); };
  });
  document.getElementById('q').oninput = function (e) { q = e.target.value.toLowerCase().trim(); apply(); };

  // Sortable columns.
  document.querySelectorAll('th[data-sort]').forEach(function (th) {
    var asc = true;
    th.onclick = function () {
      var key = th.dataset.sort;
      var sorted = rows.slice().sort(function (a, b) {
        var va = key === 'name' || key === 'type' ? a.dataset[key] || a.dataset.name : Number(a.dataset[key] || 0);
        var vb = key === 'name' || key === 'type' ? b.dataset[key] || b.dataset.name : Number(b.dataset[key] || 0);
        return (va < vb ? -1 : va > vb ? 1 : 0) * (asc ? 1 : -1);
      });
      asc = !asc;
      sorted.forEach(function (r) { tbody.appendChild(r); });
    };
  });

  // ----- copy bug -----
  function bugText(d) {
    var repro = d.url
      ? '  1. Open ' + d.url + '\\n  2. Click "Export As PDF"\\n  3. Observe: ' + (d.reason || d.type)
      : '  Observe: ' + (d.reason || d.type);
    return [
      '🐞 Report Regression — ' + d.name + ' [id ' + d.id + ']',
      'Type: ' + d.type + ' — ' + d.hint,
      'Server: ' + (d.server || 'n/a'),
      'Reproduce:',
      repro,
      'Evidence: preview ' + d.preview.rows + 'x' + d.preview.cols + ' rows·cols | PDF ' + d.pdf.rows + 'x' + d.pdf.cols +
        ' | loaded in ' + (d.loadMs / 1000).toFixed(1) + 's',
      'Run: ' + META.when,
    ].join('\\n');
  }
  function toast(msg) {
    var t = document.getElementById('toast');
    t.textContent = msg; t.classList.add('on');
    setTimeout(function () { t.classList.remove('on'); }, 1600);
  }
  function copy(text, cb) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(cb, function () { fallback(text, cb); });
    } else { fallback(text, cb); }
  }
  function fallback(text, cb) {
    var ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta); cb();
  }
  document.querySelectorAll('button.copy').forEach(function (b) {
    b.onclick = function () {
      var d = DATA[Number(b.dataset.i)];
      copy(bugText(d), function () {
        b.textContent = 'Copied'; b.classList.add('done');
        toast('Bug copied to clipboard');
        setTimeout(function () { b.textContent = 'Copy bug'; b.classList.remove('done'); }, 1400);
      });
    };
  });
  document.getElementById('copyall').onclick = function () {
    var fails = DATA.filter(function (d) { return d.status !== 'PASS'; });
    var all = fails.map(bugText).join('\\n\\n' + '─'.repeat(48) + '\\n\\n');
    copy(all, function () { toast(fails.length + ' failures copied to clipboard'); });
  };

  // ----- lightbox with prev/next -----
  var lb = document.getElementById('lb'), lbImg = lb.querySelector('img'), lbCap = lb.querySelector('.cap');
  var thumbs = Array.prototype.slice.call(document.querySelectorAll('img.thumb')), cur = -1;
  // Cycle only through the CURRENTLY VISIBLE thumbnails (respects the active
  // filter), recomputed each call so prev/next stay correct after filtering.
  function showLb(idx) {
    var visible = thumbs.filter(function (t) { return t.closest('tr').style.display !== 'none'; });
    if (!visible.length) return;
    cur = (idx + visible.length) % visible.length;
    var img = visible[cur];
    lbImg.src = img.dataset.full;
    lbCap.textContent = img.dataset.cap;
    lb.classList.add('on');
  }
  thumbs.forEach(function (img) {
    img.onclick = function () {
      var visible = thumbs.filter(function (t) { return t.closest('tr').style.display !== 'none'; });
      showLb(visible.indexOf(img));
    };
  });
  document.getElementById('close').onclick = function (e) { e.stopPropagation(); lb.classList.remove('on'); };
  document.getElementById('next').onclick = function (e) { e.stopPropagation(); showLb(cur + 1); };
  document.getElementById('prev').onclick = function (e) { e.stopPropagation(); showLb(cur - 1); };
  lb.onclick = function (e) { if (e.target === lb) lb.classList.remove('on'); };
  document.onkeydown = function (e) {
    if (!lb.classList.contains('on')) return;
    if (e.key === 'Escape') lb.classList.remove('on');
    if (e.key === 'ArrowRight') showLb(cur + 1);
    if (e.key === 'ArrowLeft') showLb(cur - 1);
  };
  apply();
</script>
</body>
</html>
`;
}

module.exports = ReportRegressionHtmlReporter;
