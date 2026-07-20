/*
 * Copyright (c) 2026 Motadata. All Rights Reserved.
 *
 * This software and associated documentation are the confidential and
 * proprietary information of Motadata.
 *
 * Unauthorized use, reproduction, disclosure, or distribution of this
 * material is strictly prohibited.
 *
 * You shall use this software only in accordance with the terms of the
 * license agreement entered into with Motadata.
 *
 * Author  : Zenil Kapadia
 * Created : 29 April 2026
 */

// SLO CONSTANTS
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);

const SLO_CONSTANTS = {
    SLO_NAME: "Automation SLO Availability",
    SLO_TYPE: "Availability",
    SLO_DESC: "This is an SLO of Availability created for automation testing purposes.",
    BUSINESS_SERVICE: "Automation Business Service",
    TARGET: "79.67",
    WARNING: "89.34",
    FREQUENCY: "Daily",
    SLO_FOR: "Monitor",
    SOURCE_FILTER: "Monitor",
    START_DATE: tomorrow.getDate()
};

const SLO_CONSTANTS_1 = {
    SLO_NAME: "Automation SLO Performance",
    SLO_TYPE: "Performance",
    SLO_DESC: "This is an SLO of Performance created for automation testing purposes.",
    BUSINESS_SERVICE: "Automation Business Service",
    TARGET: "79.89",
    WARNING: "89.54",
    FREQUENCY: "Daily",
    SLO_FOR: "Monitor",
    SOURCE_FILTER: "Monitor",
    START_DATE: tomorrow.getDate()
};

import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
import { NodeSSH } from 'node-ssh';
import { login, logout } from '../../fixtures/auth.js';

dotenv.config({ path: '.env', quiet: true });

// ---------------------------------------------------------------------------
// SLO Performance condition helpers (multi-metric).
//
// Availability SLOs are unchanged. A Performance SLO now supports MULTIPLE metric
// conditions: each condition is a self-contained card (Counter, Operator, Value,
// Source Filter, Source). Extra conditions are added with the "Add New Condition"
// link, and each card must use a DIFFERENT counter (the UI removes an already-picked
// counter from the remaining cards).
// ---------------------------------------------------------------------------

// Select a main-form dropdown by its visible label (e.g. 'Frequency', 'SLO For').
async function selectFormDropdown(page, label, optionTitle, { search } = {}) {
  const item = page
    .locator(`xpath=//div[contains(@class,'ant-form-item')][.//label[normalize-space()='${label}']]`)
    .first();
  await item.locator("[data-cy='dropdown-trigger-input']").first().click();
  if (search) await page.locator("//input[@data-cy='dropdown-search-input']").last().fill(search);
  await page.locator(`//span[@title='${optionTitle}']`).last().click();
}

// Open the Source picker and tick "Select All" (the first checkbox = every
// monitor/group). `root` is the page (main form) or a condition card. Clicking the
// Ant wrapper LABEL is required — clicking the hidden <input> doesn't fire Ant's
// select-all handler.
async function pickAllSources(page, root) {
  const sourceInput = root
    .locator(`xpath=.//div[contains(@class,'ant-form-item')][.//label[normalize-space()='Source']]`)
    .first()
    .locator('input')
    .first();
  await sourceInput.click();
  const picker = page.locator('.ant-popover:visible').last();
  // Wait for the list/grid DATA to load — the second checkbox is the first real row
  // (the first is Select-All). Clicking Select-All before rows exist selects nothing
  // (the Monitor grid loads slower than the Group list).
  await expect(picker.getByRole('checkbox').nth(1)).toBeVisible();
  await picker.locator('label.ant-checkbox-wrapper').first().click();
  // Wait for the selection to COMMIT (the trigger shows e.g. "xen71master (+26)")
  // before closing — otherwise Escape can fire before the slower Monitor grid commits.
  await expect(sourceInput).not.toHaveValue('');
  await page.keyboard.press('Escape');
}

// Fill the Nth (0-based) Performance "SLO Condition" card. Generic + scoped to the
// card, so it works for one condition or many.
async function fillSloCondition(page, index, { counter, operator, value, sourceFilter, source }) {
  const card = page.locator('.bordered.rounded.relative').nth(index);
  const field = (label) =>
    card.locator(`xpath=.//div[contains(@class,'ant-form-item')][.//label[normalize-space()='${label}']]`).first();
  const openDropdown = (label) => field(label).locator("[data-cy='dropdown-trigger-input']").first().click();
  const searchInput = () => page.locator("//input[@data-cy='dropdown-search-input']").last();
  const pickOption = (title) => page.locator(`//span[@title='${title}']`).last().click();

  // Counter + Operator are searchable dropdowns.
  await openDropdown('Counter');
  await searchInput().fill(counter);
  await pickOption(counter);

  await openDropdown('Operator');
  await searchInput().fill(operator);
  await pickOption(operator);

  await field('Value').locator('input.ant-input').fill(value);

  // Source Filter is a plain menu (Monitor / Group / ...).
  await openDropdown('Source Filter');
  await pickOption(sourceFilter);

  // Source: Select All (`source` just documents the label that then shows, e.g.
  // "xen71master (+26)" / "Oracle WebLogic (+153)").
  await pickAllSources(page, card);
}

// Add Performance conditions in order (first card exists by default; the rest are
// added via "Add New Condition"). Pass an array of condition objects.
async function fillSloConditions(page, conditions) {
  for (let i = 0; i < conditions.length; i++) {
    if (i > 0) await page.getByText('Add New Condition', { exact: false }).click();
    await fillSloCondition(page, i, conditions[i]);
  }
}

// The 3 multi-metric Performance conditions (each a distinct metric, per the spec).
const PERFORMANCE_CONDITIONS = [
  { counter: 'system.cpu.percent',         operator: 'Greater Than',          value: '49', sourceFilter: 'Monitor', source: 'xen71master' },
  { counter: 'system.disk.used.percent',   operator: 'Greater Than or Equal', value: '55', sourceFilter: 'Group',   source: 'Oracle WebLogic' },
  { counter: 'system.memory.used.percent', operator: 'Greater Than',          value: '45', sourceFilter: 'Group',   source: 'Oracle WebLogic' },
];

test.describe.serial('Motadata AIOps SLO Profile Creation TestCase', () => {
    let page;
    let suiteSkipped = false;

    test.beforeAll(async ({ browser }) => {
        // Create a single browser context and page shared across all tests
        const context = await browser.newContext();
        page = await context.newPage();
        page.setDefaultTimeout(500000);
    });

    test.beforeEach(async ({}, testInfo) => {
        // If the pre-check found duplicates, skip every remaining test in the suite
        // so the run is reported as passed/skipped instead of failed/interrupted.
        if (suiteSkipped && testInfo.title !== 'Pre-check: ensure automation SLO profiles do not already exist') {
            test.skip(true, 'Suite skipped: automation SLO profiles already exist.');
        }
    });

    test.afterAll(async () => {
        if (page) {
            await page.close();
        }
    });

    test('Login to Motadata AIOps', async () => {
    await login(page);
  });

    test('Pre-check: ensure automation SLO profiles do not already exist', async () => {
        const sloNames = [
            "Automation SLO Availability Monitor",
            "Automation SLO Availability Interface",
            "Automation SLO Performance Interface",
            "Automation SLO Performance monitor",
        ];

        await page.locator("//a[@href='/settings/']").click();
        await page.locator("//input[@id='phone-number']").click();
        await page.locator("//input[@placeholder='Search']").fill('slo profile');
        await page.getByText('SLO Profile').click();

        const existing = [];
        for (const name of sloNames) {
            const searchBox = page.locator("//input[@name='search-slo-profile']");
            await searchBox.fill('');
            await searchBox.fill(name);
            const row = page.locator('tr', { hasText: name });
            if (await row.first().isVisible({ timeout: 3000 }).catch(() => false)) {
                existing.push(name);
            }
        }

        if (existing.length > 0) {
            console.log('================================================================');
            console.log('SKIPPING: The following automation SLO Profile(s) already exist:');
            existing.forEach((n) => console.log(`  - ${n}`));
            console.log('Please delete them before re-running the SLO automation suite.');
            console.log('Logging out now...');
            console.log('================================================================');

            await page.locator("#user-avatar").click();
            await page.getByText('Logout').click();
            await page.context().clearCookies();
            await page.context().clearPermissions();

            suiteSkipped = true;
            test.skip(true, `Duplicate SLO Profile(s) detected: ${existing.join(', ')}. Skipped suite.`);
        }
    });

    test('Go to SLO Profile and create a new SLO Profile for Availability', async () => {
        await page.locator("//a[@href='/settings/']").click();
        await page.locator("//input[@id='phone-number']").click();
        await page.locator("//input[@placeholder='Search']").fill('slo profile');
        await page.getByText('SLO Profile').click();
        await page.getByRole('button', { name: 'Create SLO Profile' }).click();
        await page.locator('input#slo-name-id').fill("Automation SLO Availability Monitor");
        await page.locator('input#slo-description-id').fill(SLO_CONSTANTS.SLO_DESC);
        await page.locator("input#business-service-name-id").fill(SLO_CONSTANTS.BUSINESS_SERVICE);
        await page.locator("input#slo-target-id").fill(SLO_CONSTANTS.TARGET);
        await page.locator("input#slo-warning-id").fill(SLO_CONSTANTS.WARNING);
        await selectFormDropdown(page, 'SLO For', 'Monitor');
        await selectFormDropdown(page, 'Source Filter', 'Group');
        await pickAllSources(page, page);
        await selectFormDropdown(page, 'Frequency', 'Daily');
        //Start Date
        await page.locator("//i[@class='anticon ant-calendar-picker-icon']//*[name()='svg']").click();
        await page.locator('td.ant-calendar-cell:not(.ant-calendar-last-month-cell):not(.ant-calendar-next-month-btn-day) div.ant-calendar-date:not([aria-disabled="true"])', {
            hasText: new RegExp(`^${SLO_CONSTANTS.START_DATE}$`),
        }).click();

        await page.locator("//input[@placeholder='@User or Email or /Handle or #User Profile']").fill("zenil.kapadia@motadata.com");
        await page.locator("//button[@type='submit']").click();

        await page.locator("//button[@id='credential-profile-submit-btn']").click();

        await page.locator("//input[@name='search-slo-profile']").fill("Automation SLO Availability Monitor");
        const sloProfileRow = page.locator('tr', { hasText: "Automation SLO Availability Monitor" });
        await expect(sloProfileRow).toBeVisible({ timeout: 5000 });
    });

    test('Go to SLO Profile and create a new SLO Profile for Availability interface', async () => {
        await page.locator("//a[@href='/settings/']").click();
        await page.locator("//input[@id='phone-number']").click();
        await page.locator("//input[@placeholder='Search']").fill('slo profile');
        await page.getByText('SLO Profile').click();
        await page.getByRole('button', { name: 'Create SLO Profile' }).click();
        await page.locator('input#slo-name-id').fill("Automation SLO Availability Interface");
        await page.locator('input#slo-description-id').fill(SLO_CONSTANTS.SLO_DESC);
        await page.locator("input#business-service-name-id").fill(SLO_CONSTANTS.BUSINESS_SERVICE);
        await page.locator("input#slo-target-id").fill(SLO_CONSTANTS.TARGET);
        await page.locator("input#slo-warning-id").fill(SLO_CONSTANTS.WARNING);
        await selectFormDropdown(page, 'SLO For', 'Interface');
        await selectFormDropdown(page, 'Source Filter', 'Group');
        await pickAllSources(page, page);
        await selectFormDropdown(page, 'Frequency', 'Daily');
        //Start Date
        await page.locator("//i[@class='anticon ant-calendar-picker-icon']//*[name()='svg']").click();
        await page.locator('td.ant-calendar-cell:not(.ant-calendar-last-month-cell):not(.ant-calendar-next-month-btn-day) div.ant-calendar-date:not([aria-disabled="true"])', {
            hasText: new RegExp(`^${SLO_CONSTANTS.START_DATE}$`),
        }).click();

        await page.locator("//input[@placeholder='@User or Email or /Handle or #User Profile']").fill("zenil.kapadia@motadata.com");
        await page.locator("//button[@type='submit']").click();

        await page.locator("//button[@id='credential-profile-submit-btn']").click();

        await page.locator("//input[@name='search-slo-profile']").fill("Automation SLO Availability Interface");
        const sloProfileRow = page.locator('tr', { hasText: "Automation SLO Availability Interface" });
        await expect(sloProfileRow).toBeVisible({ timeout: 5000 });
    });

    test('Go to SLO Profile and create a new SLO Profile for Performance instance', async () => {
        await page.locator("//a[@href='/settings/']").click();
        await page.locator("//input[@id='phone-number']").click();
        await page.locator("//input[@placeholder='Search']").fill('slo profile');
        await page.getByText('SLO Profile').click();
        await page.getByRole('button', { name: 'Create SLO Profile' }).click();
        await page.locator('input#slo-name-id').fill("Automation SLO Performance Interface");
        await page.locator('input#slo-description-id').fill(SLO_CONSTANTS_1.SLO_DESC);
        await page.locator("//span[normalize-space()='Performance']").click();
        await page.locator("input#business-service-name-id").fill(SLO_CONSTANTS_1.BUSINESS_SERVICE);
        await page.locator("input#slo-target-id").fill(SLO_CONSTANTS_1.TARGET);
        await page.locator("input#slo-warning-id").fill(SLO_CONSTANTS_1.WARNING);
        await selectFormDropdown(page, 'Frequency', 'Daily');
        await selectFormDropdown(page, 'SLO For', 'Interface');

        // Single Performance condition (same generic helper as the multi-metric test).
        await fillSloCondition(page, 0, {
            counter: 'interface.error.packets',
            operator: 'Greater Than or Equal',
            value: '0',
            sourceFilter: 'Group',
            source: 'Oracle WebLogic',
        });
        //Start Date
        await page.locator("//i[@class='anticon ant-calendar-picker-icon']//*[name()='svg']").click();
        await page.locator('td.ant-calendar-cell:not(.ant-calendar-last-month-cell):not(.ant-calendar-next-month-btn-day) div.ant-calendar-date:not([aria-disabled="true"])', {
            hasText: new RegExp(`^${SLO_CONSTANTS_1.START_DATE}$`),
        }).click();

        await page.locator("//input[@placeholder='@User or Email or /Handle or #User Profile']").fill("zenil.kapadia@gmail.com");
        await page.locator("//button[@type='submit']").click();

        await page.locator("//button[@id='credential-profile-submit-btn']").click();

        await page.locator("//input[@name='search-slo-profile']").fill("Automation SLO Performance Interface");
        const sloProfileRow = page.locator('tr', { hasText: "Automation SLO Performance Interface" });
        await expect(sloProfileRow).toBeVisible({ timeout: 5000 });
    });

    test('Go to SLO Profile and create a new SLO Profile for Performance monitor', async () => {
        await page.locator("//a[@href='/settings/']").click();
        await page.locator("//input[@id='phone-number']").click();
        await page.locator("//input[@placeholder='Search']").fill('slo profile');
        await page.getByText('SLO Profile').click();
        await page.getByRole('button', { name: 'Create SLO Profile' }).click();
        await page.locator('input#slo-name-id').fill("Automation SLO Performance monitor");
        await page.locator('input#slo-description-id').fill(SLO_CONSTANTS_1.SLO_DESC);
        await page.locator("//span[normalize-space()='Performance']").click();
        await page.locator("input#business-service-name-id").fill(SLO_CONSTANTS_1.BUSINESS_SERVICE);
        await page.locator("input#slo-target-id").fill(SLO_CONSTANTS_1.TARGET);
        await page.locator("input#slo-warning-id").fill(SLO_CONSTANTS_1.WARNING);
        // Frequency + SLO For (SLO For must be set before the counters — it
        // determines which counters are available).
        await selectFormDropdown(page, 'Frequency', 'Daily');
        await selectFormDropdown(page, 'SLO For', 'Monitor');

        // Multi-metric: three distinct conditions (cpu / disk / memory).
        await fillSloConditions(page, PERFORMANCE_CONDITIONS);
        //Start Date
        await page.locator("//i[@class='anticon ant-calendar-picker-icon']//*[name()='svg']").click();
        await page.locator('td.ant-calendar-cell:not(.ant-calendar-last-month-cell):not(.ant-calendar-next-month-btn-day) div.ant-calendar-date:not([aria-disabled="true"])', {
            hasText: new RegExp(`^${SLO_CONSTANTS_1.START_DATE}$`),
        }).click();

        await page.locator("//input[@placeholder='@User or Email or /Handle or #User Profile']").fill("zenil.kapadia@motadata.com");
        await page.locator("//button[@type='submit']").click();

        await page.locator("//button[@id='credential-profile-submit-btn']").click();

        await page.locator("//input[@name='search-slo-profile']").fill("Automation SLO Performance monitor");
        const sloProfileRow = page.locator('tr', { hasText: "Automation SLO Performance monitor" });
        await expect(sloProfileRow).toBeVisible({ timeout: 5000 });
    });

    test('Update slo.profile.start.time via SSH+psql for automation SLOs', async () => {
        const sshHost = new URL(process.env.Motadata_Aiops).hostname;
        const ssh = new NodeSSH();
        await ssh.connect({
            host: sshHost,
            username: 'motadata',
            password: 'motadata',
        });

        const psql = (sql) => ssh.execCommand(
            `echo 'motadata' | sudo -S -u motadata env PGPASSWORD='TRACEorg@2025' psql -v ON_ERROR_STOP=1 -At -c "${sql.replace(/"/g, '\\"')}"`
        );

        // Step 1: ask Postgres for today's midnight epoch in Asia/Kolkata.
        const epochSelect = `SELECT EXTRACT(EPOCH FROM (date_trunc('day', now() AT TIME ZONE 'Asia/Kolkata') AT TIME ZONE 'Asia/Kolkata'))::bigint;`;
        const epochRun = await psql(epochSelect);
        expect(epochRun.code, `SELECT failed: ${epochRun.stderr}`).toBe(0);

        const epoch = epochRun.stdout.trim().split('\n').pop().trim();
        expect(epoch, `unexpected SELECT output: ${epochRun.stdout}`).toMatch(/^\d+$/);
        console.log('Computed epoch (Asia/Kolkata midnight):', epoch);

        // Step 2: plug that literal value into the update. Scoped to this suite's profiles only.
        const updateSql = `UPDATE tbl_config_slo_profile SET record = jsonb_set(record::jsonb, '{slo.profile.start.time}', '${epoch}'::jsonb) WHERE record->>'slo.profile.name' LIKE 'Automation SLO%' RETURNING id, record->>'slo.profile.name' AS name, record->>'slo.profile.start.time' AS start_time;`;
        const updateRun = await psql(updateSql);

        ssh.dispose();

        console.log('psql update stdout:\n', updateRun.stdout);
        if (updateRun.stderr) console.log('psql update stderr:\n', updateRun.stderr);
        expect(updateRun.code, `UPDATE failed: ${updateRun.stderr}`).toBe(0);
        expect(updateRun.stdout).toMatch(/Automation SLO/);
        expect(updateRun.stdout).toContain(epoch);
    });

    test('Logout from AIOps', async () => {
    await logout(page);
  });
});
