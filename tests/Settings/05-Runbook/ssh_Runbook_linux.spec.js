
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
 * Created : 24 July 2026
 */ 

import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
import { login, logout, BASE_URL } from '../../fixtures/auth.js';

dotenv.config({ path: '.env', quiet: true });

const goparsingScript = `/*
* Copyright (c) Motadata 2025.  All rights reserved.
*/

package main

import (
"encoding/base64"
"encoding/json"
"fmt"
"motadatasdk/consts"
. "motadatasdk/globals"
"motadatasdk/utils"
"os"
)

// command": "ps -eo fname,pid,user,pcpu,pmem,vsz,rss,etime,nlwp,args | sort -k 4 -r | head -n $$$count$$$ | sed '1 d'"

func main() {

context, err := utils.LoadPluginContext(os.Args[2:][0])

if err != nil {

  bytes, _ := json.Marshal(MotadataMap{

   consts.Status: consts.StatusFail,

   consts.Errors: []MotadataStringMap{
    {
     consts.ErrorCode: consts.ErrorCodeInternalError,
     consts.Error:     fmt.Sprintf("%v", err),
     consts.Message:   "Failed to load context",
    }},
  })

  fmt.Println(base64.StdEncoding.EncodeToString(bytes) + consts.BlankString)

} else {

  result := make(MotadataMap)

  run(result, context)

  bytes, err := json.Marshal(result)

  if err != nil {

   bytes, _ = json.Marshal(MotadataMap{

    consts.Status: consts.StatusFail,

    consts.Errors: []MotadataStringMap{
     {
      consts.ErrorCode: consts.ErrorCodeInternalError,
      consts.Error:     fmt.Sprintf("%v", err),
      consts.Message:   "Invalid Result",
     }},
   })
  }

  fmt.Println(base64.StdEncoding.EncodeToString(bytes) + consts.BlankString)
}
}

func run(result, context MotadataMap) {

output := context.GetMotadataStringValue(consts.Result)

result[consts.Status] = consts.StatusFail

defer func() {

  if r := recover(); r != nil {

   result[consts.Errors] = []MotadataStringMap{
    {
     consts.ErrorCode: consts.ErrorCodeInternalError,
     consts.Message:   "Invalid Result",
     consts.Error:     fmt.Sprintf("%v", r),
    },
   }
  }
}()

if output.IsNotEmpty() {

  result[consts.Status] = consts.StatusSucceed
}
}
 `;

const sshScript = `ps -eo fname,pid,user,pcpu,pmem,vsz,rss,etime,nlwp,args | sort -k 4 -r | head -n $$$count$$$ | sed '1 d'`;


test.describe.serial('Motadata AIOps test case for ssh Runbook', () => {
  let page;

  test.beforeAll(async ({ browser }) => {
    // Create a single browser context and page shared across all tests
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
    await login(page);
  });

  test('Navigate to Runbook and Create a Custom Runbook which fetches all services for Windows', async () => {
    const actionbtn = page.locator("[data-cy='grid-action']");
    // await page.locator("//a[@href='/settings/']").click();
    // await page.locator("//input[@id='phone-number']").click();
    // await page.locator("//input[@placeholder='Search']").fill('runbook');
    // await page.getByRole('link', { name: 'Runbook' }).click();

    //directly go to runbook page to avoid search issue but what if Base url has / at end
    await page.goto(`${BASE_URL}/settings/plugin-library/runbooks`);
    // first test the default linux top 10 process runbook
    await expect(page.locator("input[name='search']")).toBeVisible({ timeout: 12000 });
    await page.locator("input[name='search']").fill("Linux Top 10 Processes");

    const runbookRow = page.locator("tr.k-master-row").filter({
      has: page.getByRole('link', {
        name: 'Linux Top 10 Processes',
        exact: true,
      }),
    });

    await expect(runbookRow).toHaveCount(1);
    await expect(runbookRow).toBeVisible({ timeout: 40000 });

    // Click the action button only for this row
    await runbookRow.locator("[data-cy='grid-action']").click();
    await page.locator("#assign").click();
    await expect(page.locator("input#assign-monitor-search")).toBeVisible({ timeout: 12000 });
    await page.locator("input#assign-monitor-search").fill("motadata234");
    const row = page.locator('tr.k-master-row').filter({
      hasText: 'motadata234',
    }).filter({
      hasText: '172.16.15.234',
    });
    await expect(row).toHaveCount(1);
    await row.locator("input[type='checkbox']").first().click();
    await page.getByRole('button', { name: 'Test' }).click();
    await expect(page.getByText('Successful')).toBeVisible({ timeout: 40000 });
    await page.locator("#submit-btn-id").click();
    await expect(page.getByRole('link', {
      name: ' Linux Top 10 Processes ',
      exact: true
    })).toBeEnabled({ timeout: 40000 });
    await page.locator("//div[@class='used-count-pill ant-tag rounded']").first().click();
    await expect(page.locator("input[name='used-count-search']")).toBeVisible({ timeout: 12000 });
    await page.locator("input[name='used-count-search']").fill("motadata234");
    // await expect(page.getByText('motadata234')).toBeVisible();
    const usedCountRow = page.locator('tr.k-master-row').filter({
      hasText: 'motadata234',
    }).filter({
      hasText: '172.16.15.234',
    });

    await expect(usedCountRow).toHaveCount(1);
    await expect(usedCountRow).toBeVisible();
    await page.locator("svg[data-icon='close']").first().click();
    // now clone the runbook and change the name,description and code
    await actionbtn.first().click();
    await page.locator("#clone").click();
    await page.locator("input[name='runbook-name']").fill("Cloned ssh runbook");
    await page.evaluate((code) => {
      const editor = document.querySelector('.CodeMirror').CodeMirror;
      editor.setValue(code);
    }, sshScript);
    await page.evaluate((code) => {
      const editor = document.querySelectorAll('.CodeMirror')[1].CodeMirror;
      editor.setValue(code);
    }, goparsingScript);
    await page.getByRole('button', { name: 'Test' }).click();
    await page.locator("//div[@id='test-monitor-picker-id']").click();
    await page.locator("input[type='checkbox']").click();
    await page.locator('#create-credential-profile-btn-id').click();
    await expect(page.locator('#test-message'))
      .toHaveText('Runbook Plugin tested successfully');
    await page.getByRole('button', { name: 'Create Runbook Plugin' }).click({ timeout: 600000 });
  });

  test('Logout from AIOps', async () => {
    await logout(page);
  });
});