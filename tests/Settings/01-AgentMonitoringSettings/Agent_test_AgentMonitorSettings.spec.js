// /*
//  * Copyright (c) 2026 Motadata. All Rights Reserved.
//  *
//  * This software and associated documentation are the confidential and
//  proprietary information of Motadata.
//  *
//  * Unauthorized use, reproduction, disclosure, or distribution of this
//  * material is strictly prohibited.
//  *
//  * You shall use this software only in accordance with the terms of the
//  * license agreement entered into with Motadata.
//  *
//  * Author  : Zenil Kapadia
//  * Created : 3 March 2026
//  */

import { test, expect } from '@playwright/test';
import { Client } from 'ssh2';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { login, logout } from '../../fixtures/auth.js';

dotenv.config({ path: path.resolve(process.cwd(), '.env'), quiet: true });

const MOTADATA_URL =
  process.env.Motadata_Aiops ||
  process.env.SERVER_URL ||
  process.env.Server_url ||
  process.env.server_url;

/** Pull the first IPv4 out of a URL (or any string). */
function extractIp(url) {
  const match = String(url || '').match(/([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)/);
  return match ? match[1] : '';
}

/*
 * The AIOps master IP, DERIVED from the configured URL — never hardcoded.
 *
 * The agent's event publisher/subscriber host lists must point at whichever AIOps
 * instance this run targets. A literal IP here silently binds the suite to one
 * environment: when Motadata_Aiops moved to another instance, the exported agent
 * config was still being pointed at the old box, so the agent published its events
 * somewhere the run under test could never see them.
 */
const MASTER_IP = extractIp(MOTADATA_URL);

// Parse the first balanced JSON object from a string, ignoring trailing garbage.
function parseFirstJsonObject(text) {
  const start = text.indexOf('{');
  if (start === -1) throw new Error('No JSON object found in content');

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') { inString = true; continue; }
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return JSON.parse(text.slice(start, i + 1));
    }
  }
  throw new Error('Unterminated JSON object in content');
}

// Utility to execute SSH command
async function executeCommand({ host, username, password, command }) {
  return new Promise((resolve, reject) => {
    const conn = new Client();

    conn
      .on('ready', () => {
        conn.exec(command, (err, stream) => {
          if (err) return reject(err);

          let data = '';

          stream.on('data', (chunk) => {
            data += chunk;
          });

          stream.on('close', () => {
            conn.end();
            resolve(data);
          });
        });
      })
      .on('error', reject)
      .connect({ host, username, password });
  });
}

// Utility to upload a file via SSH (SFTP)
async function uploadFile({ host, username, password, localPath, remotePath }) {
  return new Promise((resolve, reject) => {
    const conn = new Client();

    conn
      .on('ready', () => {
        conn.sftp((err, sftp) => {
          if (err) return reject(err);

          sftp.fastPut(localPath, remotePath, (err2) => {
            conn.end();
            if (err2) return reject(err2);
            resolve();
          });
        });
      })
      .on('error', reject)
      .connect({ host, username, password });
  });
}

const REMOTE_AGENT_CONFIG = '/motadata/motadata/config/agent.json';

/*
 * Restart the motadata service and wait until it is genuinely back up.
 *
 * `stop` is tolerated with `|| true`: on a host whose service is currently INACTIVE
 * (172.16.12.90 was) a failing stop inside an `&&` chain aborts the whole command before
 * `start` ever runs — so the agent would never come back and never register.
 */
const RESTART_MOTADATA_AND_WAIT = `
service motadata stop || true
sleep 3
service motadata start

echo "Waiting for Motadata services to be fully ready..."

max_attempts=40
attempt=1

while [ $attempt -le $max_attempts ]; do

  if systemctl is-active --quiet motadata \\
    && pgrep -f motadata-manager > /dev/null \\
    && pgrep -f motadata-agent > /dev/null \\
    && pgrep -f motadata-metric-agent > /dev/null; then

      echo "motadata service + manager + agent + metric-agent all running"
      echo "Motadata fully started"
      systemctl status motadata --no-pager
      exit 0
  fi

  echo "Attempt $attempt/$max_attempts - Motadata still starting..."
  sleep 3
  attempt=$((attempt+1))

done

echo "ERROR: Motadata failed to start within expected time"
systemctl status motadata --no-pager
exit 1
`;

/*
 * Verify the agent is actually RUNNING, and start it if it is not.
 *
 * Pointing agent.json at the master is only half the job: an agent whose service is down
 * never reports, so it shows in Agent Monitor Settings with 0 metrics / "Not Running" and
 * anything depending on it fails. This runs even when the config needed no change — the
 * old code skipped the restart in that case and therefore never noticed a dead agent.
 */
const ENSURE_MOTADATA_RUNNING = `
if ! systemctl is-active --quiet motadata; then
  echo "motadata is INACTIVE - starting it"
  service motadata start || true
fi

max_attempts=20
attempt=1

while [ $attempt -le $max_attempts ]; do
  if systemctl is-active --quiet motadata \\
    && pgrep -f motadata-agent > /dev/null; then
      echo "RUNNING: motadata service and motadata-agent are up"
      exit 0
  fi
  echo "Attempt $attempt/$max_attempts - waiting for motadata to come up..."
  sleep 3
  attempt=$((attempt+1))
done

echo "NOT RUNNING: motadata did not come up"
systemctl status motadata --no-pager | head -12
exit 1
`;

/**
 * Register one agent host with the AIOps master THIS run targets.
 *
 * An agent only appears in Agent Monitor Settings if its agent.json publishes to that
 * master — so this is the registration step. The master IP is APPENDED, never replacing
 * what is already there: Motadata supports multi-master and other environments may rely
 * on the existing hosts.
 *
 * Never throws — returns a status line instead, so one unreachable host cannot skip the
 * whole spec. The UI test then reports the real problem itself with a clear message.
 */
async function registerAgentWithMaster({ host, username, password, label }, masterIp) {
  if (!host || !password) return `${label}: SKIPPED - host/password missing in .env`;

  const localConfigPath = path.join(__dirname, `agent.${host}.json`);

  try {
    await new Promise((resolve, reject) => {
      const conn = new Client();
      conn
        .on('ready', () => {
          conn.sftp((err, sftp) => {
            if (err) return reject(err);
            sftp.fastGet(REMOTE_AGENT_CONFIG, localConfigPath, (err2) => {
              conn.end();
              if (err2) return reject(err2);
              resolve();
            });
          });
        })
        .on('error', reject)
        .connect({ host, username, password });
    });

    const configData = parseFirstJsonObject(
      fs.readFileSync(localConfigPath, 'utf-8')
    );
    const agentObj = configData.agent;

    if (!agentObj) throw new Error('no "agent" key in agent.json');

    let updated = false;

    for (const key of ['event.publisher.hosts', 'event.subscriber.hosts']) {
      const arr = (Array.isArray(agentObj[key]) ? agentObj[key] : [])
        .map(String)
        .map((ip) => ip.trim());

      console.log(`[${label}] ${key} before:`, arr);

      if (!arr.includes(masterIp)) {
        arr.push(masterIp);
        updated = true;
      }

      agentObj[key] = Array.from(new Set(arr));
    }

    if (!updated) {
      // Config was already correct — but still confirm the agent is actually up, and
      // start it if not. A registered-but-dead agent reports nothing.
      const state = await executeCommand({
        host,
        username,
        password,
        command: ENSURE_MOTADATA_RUNNING,
      });
      const running = /RUNNING:/.test(state);
      console.log(`[${label}] running check:\n${state}`);
      return running
        ? `${label}: already publishes to ${masterIp}, agent RUNNING`
        : `${label}: already publishes to ${masterIp} but agent is NOT RUNNING`;
    }

    fs.writeFileSync(localConfigPath, JSON.stringify(configData, null, 2));

    await uploadFile({
      host,
      username,
      password,
      localPath: localConfigPath,
      remotePath: REMOTE_AGENT_CONFIG,
    });

    const out = await executeCommand({
      host,
      username,
      password,
      command: RESTART_MOTADATA_AND_WAIT,
    });

    console.log(`[${label}] restart output:\n${out}`);

    return `${label}: ${masterIp} added, service restarted`;
  } catch (e) {
    return `${label}: FAILED - ${e.message}`;
  } finally {
    if (fs.existsSync(localConfigPath)) fs.unlinkSync(localConfigPath);
  }
}

// --- Backend SSH/config logic in beforeAll ---
let backendSetupDone = false;

test.beforeAll(async () => {
  // Two SSH round-trips, each of which may restart the motadata service and wait up to
  // 2 min for it to come back. That is far past the 120s default hook budget, and a hook
  // timeout here skips the test with no useful message.
  test.setTimeout(15 * 60 * 1000);

  // Get master IP from SERVER_URL or Motadata_Aiops env
  const serverUrl =
    process.env.SERVER_URL ||
    process.env.Server_url ||
    process.env.server_url;

  const masterIp = extractIp(serverUrl) || MASTER_IP;

  console.log('Extracted masterIp:', masterIp);

  if (!masterIp)
    throw new Error('Master IP not found in SERVER_URL or Motadata_Aiops env');

  // APM/multimaster host whose agent.json event hosts get the automation IP appended.
  const sshConfig = {
    host: process.env.Agent_APM_ip,
    username: process.env.Agent_APM_username || 'root',
    password: process.env.Agent_APM_password,
  };

  if (!sshConfig.host || !sshConfig.password) {
    throw new Error(
      'Set Agent_APM_ip / Agent_APM_username / Agent_APM_password in .env'
    );
  }

  const remoteConfigPath = '/motadata/motadata/config/agent.json';
  const localConfigPath = path.join(__dirname, 'agent.json');

  if (!remoteConfigPath || !localConfigPath) {
    throw new Error(
      'Remote or local config path is not defined or does not exist'
    );
  }

  // Download config file
  await new Promise((resolve, reject) => {
    const conn = new Client();

    conn
      .on('ready', () => {
        conn.sftp((err, sftp) => {
          if (err) return reject(err);

          sftp.fastGet(remoteConfigPath, localConfigPath, (err2) => {
            conn.end();
            if (err2) return reject(err2);
            resolve();
          });
        });
      })
      .on('error', reject)
      .connect(sshConfig);
  });

  // Update config file: append masterIp to hosts arrays if not present
  const rawContent = fs.readFileSync(localConfigPath, 'utf-8');
  const configData = parseFirstJsonObject(rawContent);

  let updated = false;
  const cleanIp = masterIp.trim();

  const agentObj = configData.agent;

  if (!agentObj) throw new Error('No "agent" key found in config JSON');

  for (const key of ['event.publisher.hosts', 'event.subscriber.hosts']) {
    let arr = (Array.isArray(agentObj[key]) ? agentObj[key] : [])
      .map(String)
      .map((ip) => ip.trim());

    console.log(`Key "${key}" current values:`, arr);

    if (!arr.includes(cleanIp)) {
      arr.push(cleanIp);
      updated = true;
    }

    agentObj[key] = Array.from(new Set(arr));
  }

  console.log('Updated publisher.hosts:', agentObj['event.publisher.hosts']);
  console.log('Updated subscriber.hosts:', agentObj['event.subscriber.hosts']);

  if (updated) {
    fs.writeFileSync(localConfigPath, JSON.stringify(configData, null, 2));

    // Upload config file back
    await uploadFile({
      ...sshConfig,
      localPath: localConfigPath,
      remotePath: remoteConfigPath,
    });

    // Restart motadata and wait for it to come back — same routine as
    // registerAgentWithMaster, so both hosts get the tolerant `stop || true`.
    const restartResult = await executeCommand({
      ...sshConfig,
      command: RESTART_MOTADATA_AND_WAIT,
    });

    console.log('Motadata Status Output:', restartResult);
  } else {
    // No config change was needed — but the job for this host is "points at the master
    // AND is running", so verify (and start) the agent rather than skipping out. Without
    // this, a dead apmagentanant went unnoticed here and surfaced later as an APM
    // registration failure.
    const state = await executeCommand({
      ...sshConfig,
      command: ENSURE_MOTADATA_RUNNING,
    });

    console.log(
      `Master IP already present in both arrays — no config change needed.\n` +
        `APM agent (${sshConfig.host}) running check:\n${state}`
    );

    if (!/RUNNING:/.test(state)) {
      console.warn(
        `WARNING: APM agent on ${sshConfig.host} is NOT RUNNING. ` +
          `Specs that depend on it (e.g. 07-APM application registration, which looks for ` +
          `"${process.env.APM_Agent}") will fail until it is up.`
      );
    }
  }

  if (fs.existsSync(localConfigPath)) {
    fs.unlinkSync(localConfigPath);
  }

  /*
   * ALSO register the agent the UI test actually looks for.
   *
   * The block above only reconfigures Agent_APM_ip. Agent_ip — the host searched for in
   * Agent Monitor Settings — was never pointed at the master, so it published to an
   * unrelated one (172.16.12.90 was still publishing to 172.16.15.59) and simply never
   * appeared in the grid. The test then failed as an opaque 120s timeout.
   *
   * Registering it here is what makes the spec self-sufficient on any target instance.
   */
  const registration = await registerAgentWithMaster(
    {
      host: process.env.Agent_ip,
      username: process.env.Agent_username || 'root',
      password: process.env.Agent_password,
      label: `monitored agent ${process.env.Agent_ip}`,
    },
    cleanIp
  );

  console.log(`\n=== agent registration ===\n  ${registration}\n`);

  backendSetupDone = true;
});

// --- UI Tests ---
// Not serial: each test runs and reports independently, so one failure does not
// skip the others. Each test gets a FRESH context and logs in via beforeEach, so no
// test depends on a preceding "Login" test — and there must NOT be one. `login()` is
// not idempotent: it always goto()s the base URL and fills the username field, which
// never renders on an already-authenticated page, so a second login just hangs until
// the test timeout.
test.describe(
  'Motadata AIOps for Agent Monitoring Settings and Agent testing',
  () => {
    let context;
    let page;

    // Fresh context + login before EACH test -> every test is fully independent.
    test.beforeEach(async ({ browser }) => {
      context = await browser.newContext();
      page = await context.newPage();
      // Keep the default UNDER the 120s test timeout. A 500s default cannot ever be
      // reached, so every hang surfaced as a bare "Test timeout exceeded" with no clue
      // which locator stalled; 60s fails fast with the actual locator in the error.
      page.setDefaultTimeout(60000);

      await login(page);
    });

    test.afterEach(async () => {
      if (context) await context.close();
    });

    test(
      'Navigate to Agent Monitor Settings and Test All Agent Functionality',
      async () => {
        await page.locator("//a[@href='/settings/']").click();

        await page.locator("//input[@id='phone-number']").click();

        await page
          .locator("//input[@placeholder='Search']")
          .fill('Agent Monitor Settings');

        await page
          .getByRole('link', { name: 'Agent Monitor Settings' })
          .click();

        // Agent host comes from .env (Agent_ip) — same reason MASTER_IP is derived:
        // a literal here breaks silently whenever the target instance changes.
        const agentIp = process.env.Agent_ip;
        expect(agentIp, 'Set Agent_ip in .env').toBeTruthy();

        await page.locator('input[name="search-agent"]').fill(agentIp);

        const row = page.locator('tr', { hasText: agentIp });

        await expect(
          row,
          `Agent ${agentIp} is not present on ${MOTADATA_URL}. ` +
            `Agent Monitor Settings can only be exercised against an instance where this agent is registered.`
        ).toBeVisible({ timeout: 120000 });

        // Add Tags
        const rowCheckbox = row.locator('input[type="checkbox"]').first();
        await expect(rowCheckbox).toBeVisible({ timeout: 10000 });
        await rowCheckbox.check();

        // Export Agent Config
        await row.locator('svg[data-icon="ellipsis-v"]').click();

        const [download] = await Promise.all([
          page.waitForEvent('download'),
          page.getByText('Export Agent Configuration').click(),
        ]);

        const fileName = download.suggestedFilename();
        const downloadPath = path.join(__dirname, fileName);

        await download.saveAs(downloadPath);

        console.log('Downloaded file name:', fileName);

        // The export is named after the agent's host (e.g. suse15.json), so pinning one
        // literal name ties the spec to a single machine. Assert the shape by default;
        // set Agent_Config_File in .env to pin an exact name.
        if (process.env.Agent_Config_File) {
          expect(fileName).toBe(process.env.Agent_Config_File);
        } else {
          expect(fileName).toMatch(/\.json$/i);
        }

        const downloadedConfig = parseFirstJsonObject(
          fs.readFileSync(downloadPath, 'utf-8')
        );

        const agentConfig = downloadedConfig.agent;

        // Did we actually alter the file? The app only restarts the agent — and only
        // shows the "restarted successfully" toast — when the imported config DIFFERS
        // from the current one. beforeAll already ensures MASTER_IP is present, so
        // appending it again changes nothing; asserting on a restart in that case waits
        // forever for a toast that will never appear.
        let configChanged = false;

        // Optional extra event host, e.g. a collector or automation host. Set
        // Agent_Extra_Event_Host in .env to exercise the full export -> edit -> import ->
        // restart path. Left unset, the test verifies the round-trip without forcing a
        // restart. NEVER hardcode an IP here.
        const extraEventHost = (process.env.Agent_Extra_Event_Host || '').trim();

        if (agentConfig) {
          for (const key of [
            'event.publisher.hosts',
            'event.subscriber.hosts',
          ]) {
            let arr = (Array.isArray(agentConfig[key])
              ? agentConfig[key]
              : [])
              .map(String)
              .map((ip) => ip.trim());

            const before = arr.length;

            // Point the agent at the AIOps instance THIS run targets (derived from
            // Motadata_Aiops), not at a hardcoded box.
            for (const host of [MASTER_IP, extraEventHost].filter(Boolean)) {
              if (!arr.includes(host)) {
                arr.push(host);
                console.log(`Added ${host} to "${key}"`);
              } else {
                console.log(`${host} already present in "${key}", skipping.`);
              }
            }

            agentConfig[key] = Array.from(new Set(arr));

            if (agentConfig[key].length !== before) configChanged = true;
          }

          fs.writeFileSync(
            downloadPath,
            JSON.stringify(downloadedConfig, null, 2)
          );

          console.log(
            'Updated publisher.hosts:',
            agentConfig['event.publisher.hosts']
          );

          console.log(
            'Updated subscriber.hosts:',
            agentConfig['event.subscriber.hosts']
          );
        }

        // Import the modified agent config file
        await row.locator('svg[data-icon="ellipsis-v"]').click();

        await page.getByText('Import Agent Configuration').click();

        const fileInput = page.locator('input[type="file"]');

        await fileInput.setInputFiles(downloadPath);

        await page.locator('#save-btn').click();

        const notice = page.locator('.ant-notification-notice');

        if (configChanged) {
          // A real change was imported, so the agent must restart and say so.
          // 120s, not 300s: an unreachable restart should fail in two minutes, not five.
          await expect(
            notice.filter({ hasText: 'restarted successfully' }).first(),
            'Config was modified, so the agent was expected to restart'
          ).toBeVisible({ timeout: 120000 });
        } else {
          // Nothing changed (beforeAll had already registered this master), so the app
          // may legitimately show nothing. Verify the import was ACCEPTED rather than
          // rejected, and never block on a restart that will not happen.
          const appeared = await notice
            .first()
            .waitFor({ state: 'visible', timeout: 20000 })
            .then(() => true)
            .catch(() => false);

          if (appeared) {
            const text = (await notice.first().innerText()).replace(/\s+/g, ' ').trim();
            console.log('Import notification:', text);
            expect(text, `Import was rejected: ${text}`).not.toMatch(
              /fail|error|invalid|unable/i
            );
          } else {
            console.log(
              'Config already current — import accepted with no restart notification. ' +
                'Set Agent_Extra_Event_Host in .env to force a real change and exercise the restart path.'
            );
          }
        }

        if (fs.existsSync(downloadPath)) {
          fs.unlinkSync(downloadPath);
          console.log('Cleaned up local file:', downloadPath);
        }
      }
    );
  }
);
