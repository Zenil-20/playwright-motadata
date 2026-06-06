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

dotenv.config({ path: '.env', quiet: true });

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
        await page.goto(process.env.Motadata_Aiops, { timeout: 500000 });
        await page.locator("//input[@placeholder='Username']").fill(process.env.Motadata_Username);
        await page.locator("//input[@placeholder='Password']").fill(process.env.Motadata_Password);
        await page.locator("//button[@type='submit']").click();
        await page.waitForLoadState('networkidle');
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

            await page.locator("//img[@alt='Avatar']").click();
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
        //frequency
        await page.locator('[data-cy="dropdown-trigger-input"]').nth(0).click();
        await page.locator("//span[@title='Daily']").click();
        //SLO For
        await page.locator('[data-cy="dropdown-trigger-input"]').nth(2).click();
        await page.locator("//span[@title='Monitor']").click();
        //Source Filter
        await page.locator('[data-cy="dropdown-trigger-input"]').nth(4).click();
        await page.locator("//span[@title='Group']").click();
        //Source
        await page.locator("//input[@placeholder=' ']").click();
        await page.locator("//div[@class='w-full']//input[@type='checkbox']").click();
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
        //frequency
        await page.locator('[data-cy="dropdown-trigger-input"]').nth(0).click();
        await page.locator("//span[@title='Daily']").click();
        //SLO For
        await page.locator('[data-cy="dropdown-trigger-input"]').nth(2).click();
        await page.locator("//span[@title='Interface']").click();
        //Source Filter
        await page.locator('[data-cy="dropdown-trigger-input"]').nth(4).click();
        await page.locator("//span[@title='Group']").click();
        //Source
        await page.locator("//input[@placeholder=' ']").click();
        await page.locator("//div[@class='w-full']//input[@type='checkbox']").click();
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
        //frequency
        await page.locator('[data-cy="dropdown-trigger-input"]').nth(0).click();
        await page.locator("//span[@title='Daily']").click();
        //SLO For
        await page.locator('[data-cy="dropdown-trigger-input"]').nth(2).click();
        await page.locator("//span[@title='Interface']").click();
        //counter
        await page.locator('[data-cy="dropdown-trigger-input"]').nth(4).click();
        await page.locator("//input[@data-cy='dropdown-search-input']").fill('interface.error.packets');
        await page.locator("//span[@title='interface.error.packets']").click();
        //Operator
        await page.locator('[data-cy="dropdown-trigger-input"]').nth(6).click();
        await page.locator("//input[@data-cy='dropdown-search-input']").fill("greater than");
        await page.locator("//span[@title='Greater Than or Equal']").click();
        //value
        await page.locator('div.ant-row.ant-form-item', {
            has: page.locator('label.ant-form-item-required', { hasText: /^\s*Value\s*$/ }),
        }).locator('input.ant-input').fill('0');
        //Source Filter
        await page.locator('[data-cy="dropdown-trigger-input"]').nth(8).click();
        await page.locator("//span[@title='Group']").click();
        //Source
        await page.locator("//input[@placeholder=' ']").click();
        await page.locator("//div[@class='w-full']//input[@type='checkbox']").click();
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
        //frequency
        await page.locator('[data-cy="dropdown-trigger-input"]').nth(0).click();
        await page.locator("//span[@title='Daily']").click();
        //SLO For
        await page.locator('[data-cy="dropdown-trigger-input"]').nth(2).click();
        await page.locator("//span[@title='Monitor']").click();
        //counter
        await page.locator('[data-cy="dropdown-trigger-input"]').nth(4).click();
        await page.locator("//input[@data-cy='dropdown-search-input']").fill('ping.min.latency.ms');
        await page.locator("//span[@title='ping.min.latency.ms']").click();
        //Operator
        await page.locator('[data-cy="dropdown-trigger-input"]').nth(6).click();
        await page.locator("//input[@data-cy='dropdown-search-input']").fill("greater than");
        await page.locator("//span[@title='Greater Than or Equal']").click();
        //value
        await page.locator('div.ant-row.ant-form-item', {
            has: page.locator('label.ant-form-item-required', { hasText: /^\s*Value\s*$/ }),
        }).locator('input.ant-input').fill('1');
        //Source Filter
        await page.locator('[data-cy="dropdown-trigger-input"]').nth(8).click();
        await page.locator("//span[@title='Group']").click();
        //Source
        await page.locator("//input[@placeholder=' ']").click();
        await page.locator("//div[@class='w-full']//input[@type='checkbox']").click();
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
        await page.locator("//img[@alt='Avatar']").click();
        await page.getByText('Logout').click();
        await page.context().clearCookies();
        await page.context().clearPermissions();
    });
});
