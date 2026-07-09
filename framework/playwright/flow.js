/*
 * Reusable Discovery flow — the common path extracted from the ~30 per-device specs.
 * PURE LOGIC ONLY: every locator comes from ./selectors.js (the catalog). No XPath
 * or CSS string appears in this file — that separation is the whole point.
 *
 * Driven by a device row (tests/_data/discovery-devices.csv), this is observeops-qa's
 * "max coverage, min automation" applied here: one flow, many device rows.
 */

import { expect } from '@playwright/test';
import { S, discoveredRowCheckbox } from './selectors.js';

/** Read an env var by name; empty string if unset. */
export const env = (name) => (name ? (process.env[name] || '') : '');

/** Log in and confirm via the avatar (smart wait — no networkidle). */
export async function login(page) {
  await page.goto(process.env.Motadata_Aiops, { timeout: 120000 });
  await page.locator(S.login.username).fill(process.env.Motadata_Username || 'admin');
  await page.locator(S.login.password).fill(process.env.Motadata_Password || 'admin');
  await page.locator(S.login.submit).click();
  await expect(page.locator(S.login.avatar)).toBeVisible({ timeout: 120000 });
}

/** Log out and clear session. */
export async function logout(page) {
  await page.locator(S.login.avatar).click();
  await page.getByText(S.login.logout).click();
  await page.context().clearCookies();
  await page.context().clearPermissions();
}

/** Settings → search → Discovery Profile → Create Discovery Profile (opens the wizard). */
export async function openDiscoveryWizard(page) {
  await page.locator(S.nav.settings_link).click();
  await page.locator(S.nav.search_focus).click();
  await page.locator(S.nav.search_input).fill('discovery profile');
  await page.locator(S.nav.discovery_profile_link).click();
  await page.getByRole('button', { name: S.nav.create_profile_btn }).click();
}

/** Pick device category + subtype (Database uses a dropdown; others use a named link). */
export async function selectDeviceType(page, row) {
  await page.getByText(row.category, { exact: true }).click();
  if (row.category === 'Database') {
    await page.locator(S.profile.db_subtype_trigger).first().click();
    await page.locator(S.profile.subtype_option(row.subtype)).click();
  } else {
    await page.getByRole('link', { name: row.subtype }).click();
  }
}

/** Fill the main discovery form (profile name, IP/host, optional DB port/instance). */
export async function fillProfile(page, row) {
  await page.locator(S.profile.name_field).first().fill(row.profile_name || `${row.key}-auto`);
  await page.locator(S.profile.ip_field).first().fill(env(row.ip_env));
  if (row.instance_env) await page.locator(S.profile.db_service_name).fill(env(row.instance_env));
  if (row.port_env) await page.locator(S.profile.port).fill(env(row.port_env));
}

/** Create (and for SNMP/DB, test) the credential profile — protocol-aware. */
export async function createCredential(page, row) {
  await page.locator(S.profile.create_credential_btn).click();
  await page.locator(S.credential.name).fill(`${row.key}-cred`);

  switch (row.cred_type) {
    case 'snmp_v2c':
      await page.locator(S.credential.version_select).click();
      await page.getByRole('menuitem', { name: S.credential.version_v2c }).click();
      await page.locator(S.credential.community).fill(env(row.community_env) || 'public');
      await testCredential(page, row, 'snmp');
      break;
    case 'ssh':
      await page.locator(S.credential.protocol_from_snmp).click();
      await page.locator(S.credential.protocol_ssh_option).click();
      await page.locator(S.credential.username_generic).first().fill(env(row.user_env));
      await page.locator(S.credential.password_generic).first().fill(env(row.pass_env));
      break;
    case 'userpass':
    default:
      await page.locator(S.credential.username_generic).first().fill(env(row.user_env));
      await page.locator(S.credential.password_generic).first().fill(env(row.pass_env));
      if (row.test === 'yes') await testCredential(page, row, 'db');
      break;
  }
  await page.locator(S.credential.create_profile_btn).click();
}

/** Run the in-drawer credential test and assert 'Successful'. */
async function testCredential(page, row, kind) {
  await page.locator(S.credential.test_btn).click();
  const ip = env(row.ip_env);
  if (kind === 'db' && row.instance_env) {
    await page.locator(S.credential.test_target_sql).fill(ip);
    if (row.port_env) await page.locator(S.credential.test_port_sql).fill(env(row.port_env));
    await page.locator(S.credential.test_database_sql).fill(env(row.instance_env));
  } else {
    await page.locator(S.credential.test_hostname_ip).fill(ip);
  }
  await page.locator(S.credential.run_test_btn).click();
  await expect(page.locator(S.credential.test_message)).toHaveText(/Successful/i, { timeout: 60000 });
  await page.locator(S.credential.close_btn).click();
}

/** Save & Run, then provision the discovered row (scoped checkbox — not nth(1)). */
export async function saveRunAndProvision(page, row) {
  const ip = env(row.ip_env);
  await page.locator(S.profile.save_run_btn).click();
  await expect(page.getByText(ip, { exact: true }).first()).toBeVisible({ timeout: 480000 });

  await discoveredRowCheckbox(page, ip).check();
  await page.locator(S.profile.add_selected_btn).click();
  await expect(page.getByText(S.profile.success_toast).first()).toBeVisible({ timeout: 120000 });
  await page.locator(S.profile.close_results_x).first().click();
}

/** Optional post-discovery grid verification (used by the DB specs). */
export async function verifyInGrid(page, row) {
  if (!row.verify_text) return;
  const ip = env(row.ip_env);
  await page.locator(S.profile.result_search).fill(ip);
  await expect(page.getByRole('gridcell', { name: ip })).toBeVisible();
}

/** Full end-to-end discovery for one device row. */
export async function discoverDevice(page, row) {
  await openDiscoveryWizard(page);
  await selectDeviceType(page, row);
  await fillProfile(page, row);
  await createCredential(page, row);
  await saveRunAndProvision(page, row);
  await verifyInGrid(page, row);
}
