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
 * Created : 07 May 2026
 */

import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
import { login, logout } from '../../fixtures/auth.js';

dotenv.config({ path: '.env', quiet: true });

const PENALTY_PROFILE = {
    NAME: 'Automation Penalty Profile',
    DESCRIPTION: 'This is a Penalty Profile created for automation testing purposes.',
    CONTRACT_AMOUNT: '10999',
    CURRENCY: 'Indian Rupee',
};

// 10 condition rows (upper-bound, lower-bound, penalty %)
// Bounds are non-overlapping; penalty % increases as SLO drops.
const CONDITION_ROWS = [
    { upper: '100', lower: '95', penalty: '5.56' },
    { upper: '95',  lower: '90', penalty: '14.98' },
    { upper: '90',  lower: '85', penalty: '27.98' },
    { upper: '85',  lower: '80', penalty: '34.56' },
    { upper: '80',  lower: '75', penalty: '45.67' },
    { upper: '75',  lower: '70', penalty: '55.78' },
    { upper: '70',  lower: '65', penalty: '67.89' },
    { upper: '65',  lower: '60', penalty: '78.45' },
    { upper: '60',  lower: '55.55', penalty: '89.23' },
    { upper: '55.54',  lower: '0',  penalty: '98.67' },
];

test.describe.serial('Motadata AIOps Penalty Profile Creation TestCase', () => {
    let page;
    let suiteSkipped = false;

    test.beforeAll(async ({ browser }) => {
        const context = await browser.newContext();
        page = await context.newPage();
        page.setDefaultTimeout(500000);
    });

    test.beforeEach(async ({}, testInfo) => {
        if (suiteSkipped && testInfo.title !== 'Pre-check: ensure automation Penalty Profile does not already exist') {
            test.skip(true, 'Suite skipped: automation Penalty Profile already exists.');
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

    test('Pre-check: ensure automation Penalty Profile does not already exist', async () => {
        await page.locator("//a[@href='/settings/']").click();
        await page.locator("//input[@id='phone-number']").click();
        await page.locator("//input[@placeholder='Search']").fill('penalty profile');
        await page.getByRole('link', { name: 'Penalty Profile' }).click();

        // Try to find an existing row with our profile name
        const searchBox = page.locator("//input[@placeholder='Search']").last();
        await searchBox.fill(PENALTY_PROFILE.NAME);

        const existingRow = page.locator('tr', { hasText: PENALTY_PROFILE.NAME });
        const exists = await existingRow.first().isVisible({ timeout: 3000 }).catch(() => false);

        if (exists) {
            console.log('================================================================');
            console.log(`SKIPPING: Penalty Profile "${PENALTY_PROFILE.NAME}" already exists.`);
            console.log('Please delete it before re-running this suite.');
            console.log('Logging out now...');
            console.log('================================================================');

            await page.locator("#user-avatar").click();
            await page.getByText('Logout').click();
            await page.context().clearCookies();
            await page.context().clearPermissions();

            suiteSkipped = true;
            test.skip(true, `Duplicate Penalty Profile detected: ${PENALTY_PROFILE.NAME}. Skipped suite.`);
        }
    });

    test('Navigate to Penalty Profile and create a new Penalty Profile', async () => {
        test.setTimeout(300000);

        // Open Create drawer
        await page.locator('#create-penalty-profile-btn-id').click();

        // Penalty Profile Name
        await page.locator("//input[@id='penalty-profile-name-id']").fill(PENALTY_PROFILE.NAME);

        // Description
        await page.locator("//input[@id='penalty-profile-description-id']").fill(PENALTY_PROFILE.DESCRIPTION);

        // Contract Amount
        await page.locator("//input[@id='contract-amount-id']").fill(PENALTY_PROFILE.CONTRACT_AMOUNT);

        // Currency dropdown
        await page.locator("//input[@placeholder='Select']").click();
        await page.locator("//input[@data-cy='dropdown-search-input']").fill(PENALTY_PROFILE.CURRENCY);
        await page.locator(`//span[@title='${PENALTY_PROFILE.CURRENCY}']`).first().click();

        // Fill 10 condition rows. Only one row exists initially; click the
        // "+" icon (last visible plus-circle) after each fill to spawn the
        // next row. Max is 10 rows (indices 0-9), so click "+" 9 times.
        const addRowBtn = page.locator('.ant-drawer-open i.anticon:has(svg.fa-plus-circle)').last();
        for (let i = 0; i < CONDITION_ROWS.length; i++) {
            const row = CONDITION_ROWS[i];
            await page.locator(`//input[@id='slo-upper-bound-${i}']`).fill(row.upper);
            await page.locator(`//input[@id='slo-lower-bound-${i}']`).fill(row.lower);
            await page.locator(`//input[@id='penalty-percent-${i}']`).fill(row.penalty);
            if (i < CONDITION_ROWS.length - 1) {
                await addRowBtn.click();
                // Wait for the next row's input to be present before continuing
                await page.locator(`//input[@id='slo-upper-bound-${i + 1}']`).waitFor({ state: 'visible' });
            }
        }

        // Submit — scope to the drawer/modal so we don't click the parent page button
        await page
            .locator('.ant-drawer-open, .ant-modal')
            .getByRole('button', { name: 'Create Penalty Profile' })
            .click();

        // Verify the profile appears in the list
        const searchBox = page.locator("//input[@placeholder='Search']").last();
        await searchBox.fill(PENALTY_PROFILE.NAME);
        await expect(
            page.locator('tbody tr', { hasText: PENALTY_PROFILE.NAME })
        ).toBeVisible({ timeout: 20000 });
    });

    test('Logout from AIOps', async () => {
    await logout(page);
  });
});
