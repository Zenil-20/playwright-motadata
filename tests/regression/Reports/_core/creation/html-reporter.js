/**
 * Creation-matrix HTML reporter — one self-contained page for a creation run:
 * one row per SCENARIO (created / failed / skipped), with the report id, what
 * the wizard actually picked (counter, monitors, range, severity, …), the
 * failure reason, a full-page screenshot (filled step-2 form on success, the
 * failure state on failure), a deep-link to the created report, and — when the
 * run chained validation (CREATE_VALIDATE=1) — the validation verdict.
 *
 * It consumes the `creation-results` JSON attachment each category test emits
 * (see report-creation-matrix.spec.js), so it works across workers. It is a
 * SEPARATE reporter from _core/html-reporter.js (the validation run report) —
 * register both; each only renders when its own tests ran, and they write to
 * different folders.
 *
 * Register it (playwright.config):
 *   reporter: [['line'],
 *              ['./tests/Reports/_core/html-reporter.js'],
 *              ['./tests/Reports/_core/creation/html-reporter.js']]
 * …or on the command line:
 *   npx playwright test --project=reports report-creation-matrix.spec.js \
 *     --reporter=line,./tests/Reports/_core/creation/html-reporter.js
 *
 * Options / env: outputDir → CREATE_HTML_DIR (default test-results/report-creation)
 */
const fs = require('node:fs');
const path = require('node:path');

const STATUS_META = {
  created: { label: 'CREATED', cls: 'pass', group: 'pass' },
  failed: { label: 'FAILED', cls: 'fail', group: 'fail' },
  skipped: { label: 'SKIPPED', cls: 'skip', group: 'skip' },
};

class ReportCreationHtmlReporter {
  constructor(options = {}) {
    this.outputDir = path.resolve(
      process.cwd(),
      options.outputDir || process.env.CREATE_HTML_DIR || 'test-results/report-creation',
    );
    this.rows = [];
    this.startedAt = Date.now();
  }

  printsToStdio() {
    return false;
  }

  onBegin() {
    this.startedAt = Date.now();
    // Folder is cleared in onEnd, and only when creation tests actually ran —
    // running any other suite never wipes the last creation report.
  }

  onTestEnd(test, result) {
    const att = (result.attachments || []).find((a) => a.name === 'creation-results');
    if (!att) return;
    try {
      const raw = att.body ? att.body.toString('utf-8') : att.path ? fs.readFileSync(att.path, 'utf-8') : '';
      const records = raw ? JSON.parse(raw) : [];
      if (Array.isArray(records)) this.rows.push(...records);
    } catch {
      /* unreadable attachment — the category still shows in Playwright's own output */
    }
  }

  async onEnd() {
    const rows = this.rows;
    if (!rows.length) return; // no creation tests ran — leave any prior report untouched

    clearOutputDir(this.outputDir);
    const shotsDir = path.join(this.outputDir, 'screenshots');
    await fs.promises.mkdir(shotsDir, { recursive: true });

    for (const r of rows) {
      r.shot = null;
      if (r.shotPath && fs.existsSync(r.shotPath)) {
        const base = slug(`${r.category}__${r.scenario}`);
        try {
          await fs.promises.copyFile(r.shotPath, path.join(shotsDir, `${base}.png`));
          r.shot = `screenshots/${base}.png`;
        } catch {
          /* screenshot is nice-to-have */
        }
      }
    }

    // Failures first, then category/scenario order.
    const rank = (r) => ((STATUS_META[r.status] || STATUS_META.failed).group === 'fail' ? 0 : r.status === 'skipped' ? 1 : 2);
    rows.sort(
      (a, b) => rank(a) - rank(b) || String(a.category).localeCompare(String(b.category)) || String(a.scenario).localeCompare(String(b.scenario)),
    );

    const html = renderHtml(rows, {
      startedAt: this.startedAt,
      durationMs: Date.now() - this.startedAt,
      baseUrl: (process.env.Motadata_Aiops || '').replace(/\/+$/, ''),
      idsFile: process.env.CREATE_OUT || '_data/created-report-ids.local.json',
    });
    const file = path.join(this.outputDir, 'index.html');
    await fs.promises.writeFile(file, html, 'utf-8');

    const created = rows.filter((r) => r.status === 'created').length;
    const failed = rows.filter((r) => r.status === 'failed').length;
    const skipped = rows.filter((r) => r.status === 'skipped').length;
    process.stdout.write(`\nReport creation: ${created} created, ${failed} failed, ${skipped} skipped → file://${file}\n`);
  }
}

/* ---------------------------------------------------------------- helpers -- */

function clearOutputDir(dir) {
  for (const entry of ['index.html', 'screenshots']) {
    try {
      fs.rmSync(path.join(dir, entry), { recursive: true, force: true });
    } catch {
      /* nothing to clear */
    }
  }
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

function pickedHtml(picked) {
  const entries = Object.entries(picked || {});
  if (!entries.length) return '<span class="dim">—</span>';
  return entries.map(([k, v]) => `<span class="kv"><b>${esc(k)}</b> ${esc(v)}</span>`).join(' ');
}

function renderHtml(rows, meta) {
  const total = rows.length;
  const created = rows.filter((r) => r.status === 'created').length;
  const failed = rows.filter((r) => r.status === 'failed').length;
  const skipped = rows.filter((r) => r.status === 'skipped').length;
  const hasValidation = rows.some((r) => r.validation);
  const categories = [...new Set(rows.map((r) => r.category))];

  const cards = [
    `<button class="card" data-f="all"><div class="n">${total}</div><div class="l">Scenarios</div></button>`,
    `<button class="card ok" data-f="pass"><div class="n">${created}</div><div class="l">Created</div></button>`,
    `<button class="card bad" data-f="fail"><div class="n">${failed}</div><div class="l">Failed</div></button>`,
    `<button class="card mid" data-f="skip"><div class="n">${skipped}</div><div class="l">Skipped</div></button>`,
  ].join('');

  const catOptions = ['<option value="">All categories</option>']
    .concat(categories.map((c) => `<option value="${esc(c)}">${esc(c)}</option>`))
    .join('');

  const bodyRows = rows.map((r, i) => {
    const m = STATUS_META[r.status] || STATUS_META.failed;
    const url = meta.baseUrl && r.id ? `${meta.baseUrl}/reports/view/${r.id}` : '';
    const thumb = r.shot
      ? `<img class="thumb" src="${esc(r.shot)}" loading="lazy" alt="${esc(r.scenario)}" data-full="${esc(r.shot)}" data-cap="${esc(r.category)} / ${esc(r.scenario)} — ${esc(m.label)}${r.reason ? `: ${esc(r.reason)}` : ''}">`
      : '<span class="dim">no shot</span>';
    const validation = r.validation
      ? r.validation === 'ok'
        ? '<span class="badge pass">OK</span>'
        : `<span class="badge fail" title="${esc(r.validationReason || '')}">${esc(r.validation.toUpperCase())}</span>`
      : '<span class="dim">—</span>';

    return `<tr data-group="${m.group}" data-cat="${esc(r.category)}" data-q="${esc(`${r.category} ${r.scenario} ${r.name} ${r.id || ''} ${r.reason || ''}`.toLowerCase())}">
  <td class="i">${i + 1}</td>
  <td class="nm"><div class="t">${esc(r.category)}</div><div class="id">${esc(r.scenario)}</div></td>
  <td class="nm"><div class="t">${esc(r.name)}</div><div class="id">${r.id ? `id ${esc(r.id)}` : '<span class="dim">no id</span>'}</div></td>
  <td><span class="badge ${m.cls}">${m.label}</span></td>
  ${hasValidation ? `<td>${validation}</td>` : ''}
  <td class="pk">${pickedHtml(r.picked)}${r.reason ? `<div class="reason">${esc(r.reason)}</div>` : ''}</td>
  <td class="pic">${thumb}</td>
  <td class="act">${url ? `<a class="lnk" href="${esc(url)}" target="_blank" rel="noopener" title="Open the created report in the app">↗ open</a>` : '<span class="dim">—</span>'}</td>
</tr>`;
  });

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Report Creation — ${created}/${total} created</title>
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
  .card.ok .n { color:var(--pass); } .card.bad .n { color:var(--fail); } .card.mid .n { color:var(--warn); }
  .bar { display:flex; gap:8px; align-items:center; margin-bottom:12px; flex-wrap:wrap; }
  input, select { background:var(--panel); color:var(--fg); border:1px solid var(--line); border-radius:8px;
          padding:6px 12px; font:inherit; }
  input { min-width:240px; }
  .wrap { overflow-x:auto; border:1px solid var(--line); border-radius:10px; background:var(--panel); }
  table { border-collapse:collapse; width:100%; min-width:1000px; }
  th, td { text-align:left; padding:10px 12px; border-bottom:1px solid var(--line); vertical-align:top; }
  th { font-size:11.5px; text-transform:uppercase; letter-spacing:.05em; color:var(--dim); font-weight:600;
       position:sticky; top:0; background:var(--panel); white-space:nowrap; }
  tr:last-child td { border-bottom:0; }
  td.i { color:var(--dim); font-variant-numeric:tabular-nums; }
  .nm .t { font-weight:600; } .nm .id { color:var(--dim); font-size:12px; }
  .badge { display:inline-block; padding:2px 8px; border-radius:999px; font-size:11px; font-weight:700; letter-spacing:.03em; }
  .badge.pass { background:rgba(46,168,107,.16); color:var(--pass); }
  .badge.fail { background:rgba(229,72,77,.16); color:var(--fail); }
  .badge.skip { background:rgba(245,165,36,.18); color:var(--warn); }
  .pk { max-width:420px; }
  .pk .kv { display:inline-block; background:rgba(76,141,255,.10); border-radius:6px; padding:1px 7px; margin:1px 3px 1px 0; font-size:12px; }
  .pk .kv b { font-weight:600; color:var(--dim); }
  .pk .reason { color:var(--fail); font-size:12.5px; margin-top:4px; }
  .dim { color:var(--dim); }
  .act { white-space:nowrap; }
  .act .lnk { text-decoration:none; font-size:12.5px; } .act .lnk:hover { text-decoration:underline; }
  .thumb { width:150px; height:92px; object-fit:cover; object-position:top left; border:1px solid var(--line);
           border-radius:6px; cursor:zoom-in; display:block; background:#fff; }
  #lb { position:fixed; inset:0; background:rgba(0,0,0,.9); display:none; z-index:9; padding:24px; overflow:auto; }
  #lb.on { display:block; }
  #lb .cap { color:#fff; text-align:center; margin-bottom:12px; font-size:13px; }
  #lb img { max-width:100%; display:block; margin:0 auto; border-radius:6px; }
  #lb .nav { position:fixed; top:50%; transform:translateY(-50%); color:#fff; font-size:34px; cursor:pointer;
             padding:0 18px; user-select:none; opacity:.7; } #lb .nav:hover { opacity:1; }
  #lb #prev { left:8px; } #lb #next { right:8px; } #lb #close { position:fixed; top:12px; right:20px; color:#fff; font-size:26px; cursor:pointer; }
</style>
</head>
<body>
  <h1>Report Creation Matrix</h1>
  <div class="meta">
    <b>${created}/${total}</b> created${failed ? ` &middot; <b>${failed}</b> failed` : ''}${skipped ? ` &middot; ${skipped} skipped` : ''} &middot;
    ${categories.length} categories &middot;
    server <b>${esc(meta.baseUrl || 'n/a')}</b> &middot;
    ids → <b>${esc(meta.idsFile)}</b> &middot;
    ${new Date(meta.startedAt).toLocaleString()} &middot; ran ${(meta.durationMs / 1000).toFixed(0)}s
  </div>
  <div class="cards">${cards}</div>
  <div class="bar">
    <select id="cat">${catOptions}</select>
    <input id="q" type="search" placeholder="Filter by category, scenario, name, id, reason…">
    <span class="dim" id="shown"></span>
  </div>
  <div class="wrap">
    <table>
      <thead><tr>
        <th>#</th><th>Category / Scenario</th><th>Report</th><th>Status</th>${hasValidation ? '<th>Validation</th>' : ''}
        <th>Wizard picks / reason</th><th>Screenshot</th><th>Actions</th>
      </tr></thead>
      <tbody>
${bodyRows.join('\n')}
      </tbody>
    </table>
  </div>
  <div id="lb"><span id="close">×</span><span class="nav" id="prev">‹</span><span class="nav" id="next">›</span><div class="cap"></div><img alt=""></div>
<script>
  var rows = Array.prototype.slice.call(document.querySelectorAll('tbody tr'));
  var group = 'all', cat = '', q = '';
  function apply() {
    var shown = 0;
    rows.forEach(function (r) {
      var vis = (group === 'all' || r.dataset.group === group)
        && (!cat || r.dataset.cat === cat)
        && (!q || r.dataset.q.indexOf(q) !== -1);
      r.style.display = vis ? '' : 'none';
      if (vis) shown++;
    });
    document.getElementById('shown').textContent = shown + ' shown';
  }
  document.querySelectorAll('.card[data-f]').forEach(function (b) {
    b.onclick = function () {
      group = b.dataset.f;
      document.querySelectorAll('.card').forEach(function (c) { c.classList.remove('sel'); });
      b.classList.add('sel');
      apply();
    };
  });
  document.getElementById('cat').onchange = function (e) { cat = e.target.value; apply(); };
  document.getElementById('q').oninput = function (e) { q = e.target.value.toLowerCase().trim(); apply(); };

  var lb = document.getElementById('lb'), lbImg = lb.querySelector('img'), lbCap = lb.querySelector('.cap');
  var thumbs = Array.prototype.slice.call(document.querySelectorAll('img.thumb')), cur = -1;
  function visibleThumbs() { return thumbs.filter(function (t) { return t.closest('tr').style.display !== 'none'; }); }
  function showLb(idx) {
    var v = visibleThumbs();
    if (!v.length) return;
    cur = (idx + v.length) % v.length;
    lbImg.src = v[cur].dataset.full;
    lbCap.textContent = v[cur].dataset.cap;
    lb.classList.add('on');
  }
  thumbs.forEach(function (img) { img.onclick = function () { showLb(visibleThumbs().indexOf(img)); }; });
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

module.exports = ReportCreationHtmlReporter;
