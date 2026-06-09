/*
 * Sync the captured RUM UI values into the load generator's config.json on the
 * .234 box and restart the rum-ui / rum-load services. Pure Node (node-ssh) —
 * no Python required, so it runs anywhere `npx playwright test` runs.
 *
 * Used two ways:
 *   1. Imported by RumApplicationRegistration.spec.js as the final pipeline step
 *      (so the whole flow is one `npx playwright test`).
 *   2. Standalone:  node tests/Settings/14-RealUserMonitoring/loadGeneratorSync.js
 *
 * Rules:
 *   - Only the per-app VALUES change. `run`, `server`, `generator` are untouched.
 *   - collector IP is DERIVED DYNAMICALLY from .env Motadata_Aiops -> https://<ip>:9477.
 *   - config.json.bak is written before overwriting.
 *
 * CommonJS on purpose: the project is `"type": "commonjs"`, and Playwright
 * transforms the spec's ESM import into require() — so a CJS module is the one
 * form that loads cleanly both under Playwright and via plain `node`.
 */

const { readFileSync, writeFileSync } = require('fs');
const path = require('path');
const os = require('os');
const { NodeSSH } = require('node-ssh');

// --- target load-generator box ---
const SSH_HOST = '172.16.15.234';
const SSH_USER = 'motadata';
const SSH_PASS = 'motadata'; // also the sudo password
const REMOTE = '/home/motadata/rum-test-site/config.json';
const SERVICES = ['rum-ui', 'rum-load'];

// applicationType (from UI) -> config.json apps key
const TYPE_TO_KEY = { Vue: 'vue', React: 'react', JS: 'js', Angular: 'angular', 'Next.js': 'nextjs' };

const REPO_ROOT = path.resolve(__dirname, '../../..');
const CAPTURED = path.join(REPO_ROOT, 'tests/Settings/14-RealUserMonitoring/rum-configs/rum-applications.json');

function collectorFromEnv() {
  require('dotenv').config({ path: path.join(REPO_ROOT, '.env'), quiet: true });
  const aiops = process.env.Motadata_Aiops;
  if (!aiops) throw new Error('Motadata_Aiops not set in .env');
  const ip = new URL(aiops).hostname;
  return `https://${ip}:9477`;
}

async function syncLoadGeneratorConfig() {
  const collector = collectorFromEnv();
  const ui = JSON.parse(readFileSync(CAPTURED, 'utf8'));
  const uiByKey = Object.fromEntries(ui.map((a) => [TYPE_TO_KEY[a.applicationType], a]));

  const ssh = new NodeSSH();
  await ssh.connect({ host: SSH_HOST, username: SSH_USER, password: SSH_PASS, readyTimeout: 20000 });
  try {
    // read current config + backup
    const { stdout } = await ssh.execCommand(`cat ${REMOTE}`);
    const cfg = JSON.parse(stdout);
    await ssh.execCommand(`cp ${REMOTE} ${REMOTE}.bak`);

    for (const [key, app] of Object.entries(cfg.apps || {})) {
      const u = uiByKey[key];
      if (!u) continue;
      app.id = String(u.applicationId);
      app.token = u.clientToken;
      app.service = u.service;
      app.env = u.env;
      app.version = u.version;
      app.sampleRate = u.sessionSampleRate;
      app.privacy = u.defaultPrivacyLevel;
      app.collector = collector; // only the IP is dynamic; :9477 kept
    }

    // write back via a local temp file + putFile (reliable for arbitrary JSON)
    const out = `${JSON.stringify(cfg, null, 2)}\n`;
    const tmp = path.join(os.tmpdir(), `rum-config-${process.pid}.json`);
    writeFileSync(tmp, out);
    await ssh.putFile(tmp, REMOTE);

    // config first, THEN restart
    await ssh.execCommand(`echo ${SSH_PASS} | sudo -S systemctl restart ${SERVICES.join(' ')}`);
    const status = await ssh.execCommand(`systemctl is-active ${SERVICES.join(' ')}`);
    const states = status.stdout.trim().split(/\s+/);
    const services = Object.fromEntries(SERVICES.map((s, i) => [s, states[i]]));

    return { collector, apps: cfg.apps, services };
  } finally {
    ssh.dispose();
  }
}

module.exports = { syncLoadGeneratorConfig };

// --- run directly: node loadGeneratorSync.js ---
if (require.main === module) {
  syncLoadGeneratorConfig()
    .then((res) => {
      console.log('collector (from .env) =', res.collector);
      for (const [k, a] of Object.entries(res.apps)) {
        console.log(`  ${k.padEnd(8)} id=${String(a.id).padStart(3)}  ${a.service}  rate=${a.sampleRate}  ${a.collector}`);
      }
      console.log('services:', res.services);
      process.exit(SERVICES.every((s) => res.services[s] === 'active') ? 0 : 1);
    })
    .catch((e) => {
      console.error('SYNC FAILED:', e.message);
      process.exit(1);
    });
}
