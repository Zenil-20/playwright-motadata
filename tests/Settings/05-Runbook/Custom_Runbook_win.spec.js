
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
 * Created : 24 February 2026
 */ 

import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({ path: '.env', quiet: true });

const goCode = `/* 
* Copyright (c) Motadata 2025.  All rights reserved. 
*/ 

package main 

import ( 
    "encoding/base64" 
    "encoding/json" 
    "fmt" 
    "motadatasdk/clients/winrmclient" 
    "motadatasdk/consts" 
    . "motadatasdk/globals" 
    "motadatasdk/utils" 
    "os" 
    "strings" 
) 

const ( 
    ActiveServices = "active.services" 
) 

var loggerObj = NewLogger("SDK/Windows Active Service", "Windows Active Service") 

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

    client := &winrmclient.WinRMClient{} 

    client.SetContext(context, false, &loggerObj) 

    result[consts.Status] = consts.StatusFail 

    defer cleanUp(client, result) 

    if client.Init() { 

        output := client.ExecuteCommand(MotadataString( 
            fmt.Sprintf("Get-Service | Where-Object {$_.Status -eq 'Running'} | Select-Object -ExpandProperty Name"))) 

        if output.IsNotEmpty() && client.GetErrors() == nil { 

            services := strings.Split(output.ToString(), "\\r\\n")

            result[consts.Result] = make(MotadataMap) 

            result.GetMapValue(consts.Result)[ActiveServices] = services 

            result[consts.Status] = consts.StatusSucceed 

        } else { 

            result[consts.Errors] = []MotadataStringMap{ 
                { 
                    consts.ErrorCode: consts.ErrorCodeFailedToRetrieveRunningService, 
                    consts.Message:   "Failed to retrieve running services", 
                }, 
            } 
        } 

    } 

    if len(client.GetErrors()) > 0 { 

        result[consts.Errors] = append(context.GetStringMapSliceValue(consts.Errors), client.GetErrors()...) 
    } 
} 

func cleanUp(client *winrmclient.WinRMClient, result MotadataMap) { 

    if r := recover(); r != nil { 

        result[consts.Errors] = []MotadataStringMap{ 
            { 
                consts.ErrorCode: consts.ErrorCodeInternalError, 
                consts.Message:   "Invalid Result", 
                consts.Error:     fmt.Sprintf("%v", r), 
            }, 
        } 
    } 

    client.Destroy() 
}`;

test.describe.serial('Motadata AIOps Create Netroute', () => {
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
        await page.goto(process.env.Motadata_Aiops, { timeout: 500000 });
         await page.locator("//input[@placeholder='Username']").fill(process.env.Motadata_Username);
        await page.locator("//input[@placeholder='Password']").fill(process.env.Motadata_Password);
        await page.locator("//button[@type='submit']").click();
        await page.waitForLoadState('networkidle');
    });

    test('Navigate to Runbook and Create a Custom Runbook which fetches all services for Windows', async () => {
        await page.locator("//a[@href='/settings/']").click();
        await page.locator("//input[@id='phone-number']").click();
        await page.locator("//input[@placeholder='Search']").fill('runbook');
        await page.getByRole('link', { name: 'Runbook' }).click();
        await page.locator("//button[@id='create-runbook-btn']").click();
        await page.getByRole('menuitem', { name: 'Custom' }).click();
        await page.evaluate((code) => {
            const editor = document.querySelector('.CodeMirror').CodeMirror;
            editor.setValue(code);
        }, goCode);
        await page.locator("//input[@name='runbook-name']").fill("windows service manish");
        await page.locator('[data-cy="dropdown-trigger-input"]').first().click();
        await page.locator("//input[@placeholder='Search']").fill('integration');
        await page.locator("//span[@title='Integration']").click();
        await page.locator("//input[@readonly='readonly']").click();
        await page.locator("//input[@id='assign-monitor-search']").fill("WIN-4PJMESL4SHA");
        // Wait for the row with the searched device to appear
        const row = page.locator('tr', { hasText: 'WIN-4PJMESL4SHA' });
        await expect(row).toBeVisible({ timeout: 5000 });
        // Click the checkbox inside that row
        const checkbox = row.locator('input[type="checkbox"]');
        await expect(checkbox).toBeVisible({ timeout: 5000 });
        await checkbox.click();
          await page.locator("//input[@name='runbook-description']").fill("runbook to get active services of windows device");
          await page.locator("//div[@id='credential-profile-picker-id']").click();
          await page.locator("//input[@placeholder='Search']").fill("172.16.10.134-Device");
          await page.locator("//span[@title='172.16.10.134-Device']").click();
          await page.getByRole('button', { name: 'Test' }).click();
          await page.locator("//div[@id='test-monitor-picker-id']").click();
          const checkbox1 = row.locator('input[type="checkbox"]');
        await expect(checkbox1).toBeVisible({ timeout: 5000 });
        await checkbox1.click();
          await page.locator("//button[@id='create-credential-profile-btn-id']").click();
          await page.getByRole('button', { name: 'Create Runbook Plugin' }).click({ timeout: 300000 });
    });

    test('Logout from AIOps', async () => {
        await page.locator("//img[@alt='Avatar']").click();
        await page.getByText('Logout').click();
        await page.context().clearCookies();
        await page.context().clearPermissions();
    });
});