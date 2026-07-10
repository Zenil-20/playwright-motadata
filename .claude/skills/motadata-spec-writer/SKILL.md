---
name: motadata-spec-writer
description: Deterministically assemble a Motadata Playwright .spec.js from a resolved test case whose every step already carries a verified locator. Use when turning resolved-cases.yaml into runnable code. Provides the canonical skeleton, the action→Playwright mapping, the smart-wait policy, and the hard rule that NO locator may be invented — missing locators error back to resolution.
---

# Motadata Spec Writer

Mechanical templating only. Reason about *structure*, never about the UI.

## Skeleton (copy verbatim, fill the middle)

```js
/*
 * Copyright (c) 2026 Motadata. All Rights Reserved.
 * ... (full header preserved)
 * Author  : Zenil Kapadia
 * Created : <today>
 */
import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
dotenv.config({ path: '.env', quiet: true });

const <CONST> = '<value>';

test.describe.serial('<Feature> flow', () => {
  let page;
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    page.setDefaultTimeout(500000);
  });
  test.afterAll(async () => { if (page) await page.close(); });

  test('Login to Motadata AIOps', async () => {
    await page.goto(process.env.Motadata_Aiops, { timeout: 500000 });
    await page.locator("//input[@placeholder='Username']").fill(process.env.Motadata_Username);
    await page.locator("//input[@placeholder='Password']").fill(process.env.Motadata_Password);
    await page.locator("//button[@type='submit']").click();
    await expect(page.locator("//img[@alt='Avatar']")).toBeVisible();
  });

  // ... feature tests ...

  test('Logout from AIOps', async () => {
    await page.locator("//img[@alt='Avatar']").click();
    await page.getByText('Logout').click();
    await page.context().clearCookies();
    await page.context().clearPermissions();
  });
});
```

## Action → code mapping

| action | code |
|---|---|
| navigate (settings) | the `#phone-number` Settings-search block + `getByRole('link',{name})` |
| navigate (module) | `getByRole('link',{name:/X/i}).click()` + tab click |
| click | `await <loc>.click();` |
| fill | `await <loc>.fill(<value>);` |
| select | `await <loc>.click(); await page.locator("//span[@title='<value>']").click();` |
| check/uncheck | `await <loc>.check();` / `.uncheck();` |
| expect_toast | `await expect(page.locator('.ant-notification-notice-message',{hasText:/<v>/i}).first()).toBeVisible({timeout});` |
| expect_text | `await expect(<loc>).toContainText(<v>);` |
| expect_row | `await expect(page.locator('tr.k-master-row',{hasText:<v>}).first()).toBeVisible();` |
| wait_status | `await expect.poll(async()=>..., {timeout, intervals:[2000,3000,5000]}).toMatch(<v>);` |

## Non-negotiable rules

1. **Never invent a locator.** A step missing `locator:` → return an error naming the step. Do not improvise.
2. **No `waitForLoadState('networkidle')`** — banned.
3. **Long async jobs** (discovery/backup/sync/runbook): timeout 1.5× known max; poll for status flips, don't hard-wait.
4. **Secrets via env**, data via top-of-file consts. Never inline credentials.
5. **Strip `test.only`** before declaring done unless explicitly told to keep a focused run.
6. Output to the feature **workspace**, not the user's `tests/` tree, unless the orchestrator says to land it.
