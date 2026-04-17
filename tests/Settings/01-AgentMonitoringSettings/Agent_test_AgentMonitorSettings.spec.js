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

dotenv.config({ path: path.resolve(process.cwd(), '.env'), quiet: true });

const MOTADATA_URL =
  process.env.Motadata_Aiops ||
  process.env.SERVER_URL ||
  process.env.Server_url ||
  process.env.server_url;

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

// --- Backend SSH/config logic in beforeAll ---
let backendSetupDone = false;

test.beforeAll(async () => {
  // Get master IP from SERVER_URL or Motadata_Aiops env
  let masterIp = '';

  const serverUrl =
    process.env.SERVER_URL ||
    process.env.Server_url ||
    process.env.server_url;

  const aiopsUrl = MOTADATA_URL;

  if (serverUrl) {
    const match = serverUrl.match(/([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)/);
    if (match) masterIp = match[1];
  }

  if (!masterIp && aiopsUrl) {
    const match = aiopsUrl.match(/([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)/);
    if (match) masterIp = match[1];
  }

  console.log('Extracted masterIp:', masterIp);

  if (!masterIp)
    throw new Error('Master IP not found in SERVER_URL or Motadata_Aiops env');

  const sshConfig = {
    host: process.env.Agent_ip || '172.16.8.61',
    username: process.env.Agent_username || 'root',
    password: process.env.Agent_password || 'Mind@123',
  };

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
  const configData = JSON.parse(rawContent);

  let updated = false;
  const cleanIp = masterIp.trim();

  // Helper: get/set value by dotted key path (handles nested objects)
  function getByPath(obj, keyPath) {
    if (obj.hasOwnProperty(keyPath))
      return { ref: obj, key: keyPath, value: obj[keyPath] };

    const parts = keyPath.split('.');
    let current = obj;

    for (let i = 0; i < parts.length - 1; i++) {
      if (current && typeof current === 'object' && parts[i] in current) {
        current = current[parts[i]];
      } else {
        return null;
      }
    }

    const lastKey = parts[parts.length - 1];

    if (current && typeof current === 'object' && lastKey in current) {
      return { ref: current, key: lastKey, value: current[lastKey] };
    }

    return null;
  }

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

    // Restart motadata service
    const restartResult = await executeCommand({
      ...sshConfig,
      command: `
      service motadata restart &&

echo "Waiting for Motadata services to be fully ready..."

max_attempts=40
attempt=1

while [ $attempt -le $max_attempts ]; do

  if systemctl is-active --quiet motadata \
    && pgrep -f motadata-manager > /dev/null \
    && pgrep -f motadata-agent > /dev/null \
    && pgrep -f metricagent > /dev/null; then

      echo "✓ motadata service running"
      echo "✓ motadata-manager process running"
      echo "✓ motadata-agent process running"
      echo "✓ metricagent process running"

      echo "Motadata fully started"
      systemctl status motadata --no-pager
      exit 0
  fi

  echo "Attempt $attempt/$max_attempts → Motadata still starting..."
  sleep 3
  attempt=$((attempt+1))

done

echo "ERROR: Motadata failed to start within expected time"
systemctl status motadata --no-pager
exit 1
`,
    });

    console.log('Motadata Status Output:', restartResult);
  } else {
    console.log(
      'Master IP already present in both arrays, skipping config update and restart.'
    );
  }

  if (fs.existsSync(localConfigPath)) {
    fs.unlinkSync(localConfigPath);
  }

  backendSetupDone = true;
});

// --- UI Tests ---
test.describe.serial(
  'Motadata AIOps for Agent Monitoring Settings and Agent testing',
  () => {
    let page;

    test.beforeAll(async ({ browser }) => {
      const context = await browser.newContext();
      page = await context.newPage();
      page.setDefaultTimeout(500000);
    });

    test.afterAll(async () => {
      if (page) {
        await page.close();
      }
    });

    test('Login to Motadata AIOps', async () => {
      await page.goto(MOTADATA_URL, { timeout: 500000 });

       await page.locator("//input[@placeholder='Username']").fill(process.env.Motadata_Username);
      await page.locator("//input[@placeholder='Password']").fill(process.env.Motadata_Password);

      await page.locator("//button[@type='submit']").click();

      await page.waitForLoadState('networkidle');
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

        await page.locator('input[name="search-agent"]').fill('172.16.8.61');

        const row = page.locator('tr', { hasText: '172.16.8.61' });

        await row.waitFor({ state: 'visible', timeout: 120000 });

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

        expect(fileName).toBe('motadata8.61.json');

        const downloadedConfig = JSON.parse(
          fs.readFileSync(downloadPath, 'utf-8')
        );

        const agentConfig = downloadedConfig.agent;

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

            if (!arr.includes('172.16.14.71')) {
              arr.push('172.16.14.71');
              console.log(`Added 172.16.14.71 to "${key}"`);
            } else {
              console.log(
                `172.16.14.71 already present in "${key}", skipping.`
              );
            }

            agentConfig[key] = Array.from(new Set(arr));
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

        await expect(
          page
            .locator('.ant-notification-notice')
            .filter({ hasText: 'restarted successfully' })
            .first()
        ).toBeVisible({ timeout: 300000 });

        if (fs.existsSync(downloadPath)) {
          fs.unlinkSync(downloadPath);
          console.log('Cleaned up local file:', downloadPath);
        }
      }
    );
  }
);
