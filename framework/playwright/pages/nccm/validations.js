/*
 * Copyright (c) 2026 Motadata. All Rights Reserved.
 *
 * NCCM assertion helpers. Each mirrors an assertion already proven in the three
 * working specs (PerformNccmActions / DeviceNccmDiscovery / nccmtest). Import LOC —
 * no literal selectors here.
 *
 * All row-scoped helpers take an already-scoped `row` Locator (tr.k-master-row) so the
 * caller keeps the count()===1 guarantee; modal/drawer helpers take the container Locator.
 */

import { expect } from '@playwright/test';
import { LOC } from './locators.js';

/** Discovery: device provisioned successfully (toast). */
export async function assertProvisioned(page, ip) {
  await expect(page.getByText(LOC.discovery.provisionedToastText).first()).toBeVisible({ timeout: 90000 });
  // Optional: the discovered row is present.
  if (ip) {
    await expect(page.getByText(ip, { exact: true }).first()).toBeVisible();
  }
}

/** Explorer row shows the "Conflict Detected" button (running ≠ baseline). */
export async function assertConflictDetected(row) {
  await expect(
    row.locator(LOC.explorer.conflictDetectedBtn, { hasText: 'Conflict Detected' }).first()
  ).toBeVisible({ timeout: 90000 });
}

/** Explorer row's version tag (Baseline/Current) equals `v` (e.g. '2.0'). */
export async function assertVersion(row, v) {
  await expect(row.locator(LOC.explorer.versionTagByTitle(v)).first()).toBeVisible({ timeout: 30000 });
}

/** Explorer row shows the "In Sync" green cell. */
export async function assertInSync(row) {
  await expect(row.locator(LOC.explorer.inSyncCell, { hasText: 'In Sync' }).first())
    .toBeVisible({ timeout: 30000 });
}

/** Explorer row shows "Backup Successful". */
export async function assertBackupSuccessful(row) {
  await expect(
    row.locator(LOC.explorer.backupSuccessfulBtn, { hasText: 'Backup Successful' }).first()
  ).toBeVisible({ timeout: 90000 });
}

/** Explorer row shows "Sync Successful". */
export async function assertSyncSuccessful(row) {
  await expect(
    row.locator(LOC.explorer.syncSuccessfulBtn, { hasText: 'Sync Successful' }).first()
  ).toBeVisible({ timeout: 90000 });
}

/** Compare modal: Modified / Inserted / Deleted diff counts are all 0. */
export async function assertCompareZero(modal) {
  await expect(
    modal.getByRole('button', { name: LOC.compare.countModifiedBtnName }).locator(LOC.compare.countModified)
  ).toHaveText(/^\s*0\s*$/, { timeout: 60000 });
  await expect(
    modal.getByRole('button', { name: LOC.compare.countInsertedBtnName }).locator(LOC.compare.countInserted)
  ).toHaveText(/^\s*0\s*$/);
  await expect(
    modal.getByRole('button', { name: LOC.compare.countDeletedBtnName }).locator(LOC.compare.countDeleted)
  ).toHaveText(/^\s*0\s*$/);
}

/** Explorer row shows "Runbook Successful" under Last Performed Activity. */
export async function assertRunbookSuccessful(row) {
  await expect(
    row.locator(LOC.explorer.runbookSuccessfulBtn, { hasText: 'Runbook Successful' }).first()
  ).toBeVisible({ timeout: 90000 });
}

/** Explorer row's Baseline Version tag equals `v` (e.g. '1.0'). */
export async function assertBaselineVersion(row, v) {
  const tag = row.locator(LOC.baseline.versionTagByTitle(v)).first();
  await expect(tag).toBeVisible({ timeout: 30000 });
  await expect(tag).toHaveText(new RegExp(`\\s*${v.replace('.', '\\.')}\\s*`));
}

/** Generic notification-toast assertion by regex (backup/sync queued, etc.). */
export async function assertToast(page, re) {
  await expect(
    page.locator(LOC.explorer.notificationMessage, { hasText: re }).first()
  ).toBeVisible({ timeout: 30000 });
}

/** Storage-profile test succeeded ("Storage Profile tested successfully"). [endtest] */
export async function assertStorageProfileTested(page) {
  await expect(page.locator(LOC.storageProfile.testMessage))
    .toContainText('Storage Profile tested successfully', { timeout: 90000 });
}

/** Restore reached "Successful". [endtest] */
export async function assertRestoreSuccessful(page) {
  await expect(page.locator(LOC.restore.successText)).toBeVisible({ timeout: 90000 });
}

/** Firmware upgrade reached "Successful". [endtest] */
export async function assertFirmwareSuccessful(page) {
  await expect(page.locator(LOC.firmware.successText)).toBeVisible({ timeout: 90000 });
}

/** Network Config Policy grid shows a row with the given policy name. [endtest] */
export async function assertPolicyRow(page, name) {
  await expect(page.locator(LOC.policy.policyRow(name)).first()).toBeVisible({ timeout: 60000 });
}

/** Grid is empty ("No records available") — e.g. after deleting a policy. [endtest] */
export async function assertNoRecords(page) {
  await expect(page.locator(LOC.policy.noRecords).first()).toBeVisible({ timeout: 30000 });
}

export default {
  assertProvisioned,
  assertConflictDetected,
  assertVersion,
  assertInSync,
  assertBackupSuccessful,
  assertSyncSuccessful,
  assertCompareZero,
  assertRunbookSuccessful,
  assertBaselineVersion,
  assertToast,
  assertStorageProfileTested,
  assertRestoreSuccessful,
  assertFirmwareSuccessful,
  assertPolicyRow,
  assertNoRecords,
};

/* ── Validation / negative-test assertions ──────────────────────────────────
 * Assert the product REJECTS bad input. AntDesign structural markers (stable);
 * exact error strings to be tightened from the live recording.
 * ------------------------------------------------------------------------- */

/** A field-level validation error is shown (empty/invalid input). Optionally match text. */
export async function assertFieldError(scope, text) {
  const err = scope.locator(LOC.validation.fieldError).first();
  await expect(err).toBeVisible({ timeout: 30000 });
  if (text) await expect(err).toContainText(text);
}

/** A reject/duplicate error toast is shown (e.g. "name already exists"). */
export async function assertRejectedToast(page, text) {
  const t = page.locator(LOC.validation.toastError).first();
  await expect(t).toBeVisible({ timeout: 30000 });
  if (text) await expect(t).toContainText(text);
}

/** The create/save action was BLOCKED — the drawer/modal is still open (not dismissed). */
export async function assertNotSaved(container) {
  await expect(container).toBeVisible({ timeout: 15000 });
}

/** An injected payload was NOT reflected verbatim into the DOM (basic XSS-safety check). */
export async function assertNoScriptInjected(page, marker = '__xss_probe__') {
  // If the app rendered our <script>/<img onerror> raw, the marker text/attr would appear.
  const raw = await page.locator(`text=${marker}`).count();
  expect(raw, `payload "${marker}" appears to be reflected unsanitised`).toBe(0);
}
