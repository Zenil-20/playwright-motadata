
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

// const goCode = `/* 
// * Copyright (c) Motadata 2025.  All rights reserved. 
// */ 

// package main 

// import ( 
//     "encoding/base64" 
//     "encoding/json" 
//     "fmt" 
//     "motadatasdk/clients/winrmclient" 
//     "motadatasdk/consts" 
//     . "motadatasdk/globals" 
//     "motadatasdk/utils" 
//     "os" 
//     "strings" 
// ) 

// const ( 
//     ActiveServices = "active.services" 
// ) 

// var loggerObj = NewLogger("SDK/Windows Active Service", "Windows Active Service") 

// func main() { 

//     context, err := utils.LoadPluginContext(os.Args[2:][0]) 

//     if err != nil { 

//         bytes, _ := json.Marshal(MotadataMap{ 

//             consts.Status: consts.StatusFail, 

//             consts.Errors: []MotadataStringMap{ 
//                 { 
//                     consts.ErrorCode: consts.ErrorCodeInternalError, 
//                     consts.Error:     fmt.Sprintf("%v", err), 
//                     consts.Message:   "Failed to load context", 
//                 }}, 
//         }) 

//         fmt.Println(base64.StdEncoding.EncodeToString(bytes) + consts.BlankString) 

//     } else { 

//         result := make(MotadataMap) 

//         run(result, context) 

//         bytes, err := json.Marshal(result) 

//         if err != nil { 

//             bytes, _ = json.Marshal(MotadataMap{ 

//                 consts.Status: consts.StatusFail, 

//                 consts.Errors: []MotadataStringMap{ 
//                     { 
//                         consts.ErrorCode: consts.ErrorCodeInternalError, 
//                         consts.Error:     fmt.Sprintf("%v", err), 
//                         consts.Message:   "Invalid Result", 
//                     }}, 
//             }) 
//         } 

//         fmt.Println(base64.StdEncoding.EncodeToString(bytes) + consts.BlankString) 
//     } 
// } 

// func run(result, context MotadataMap) { 

//     client := &winrmclient.WinRMClient{} 

//     client.SetContext(context, false, &loggerObj) 

//     result[consts.Status] = consts.StatusFail 

//     defer cleanUp(client, result) 

//     if client.Init() { 

//         output := client.ExecuteCommand(MotadataString( 
//             fmt.Sprintf("Get-Service | Where-Object {$_.Status -eq 'Running'} | Select-Object -ExpandProperty Name"))) 

//         if output.IsNotEmpty() && client.GetErrors() == nil { 

//             services := strings.Split(output.ToString(), "\\r\\n")

//             result[consts.Result] = make(MotadataMap) 

//             result.GetMapValue(consts.Result)[ActiveServices] = services 

//             result[consts.Status] = consts.StatusSucceed 

//         } else { 

//             result[consts.Errors] = []MotadataStringMap{ 
//                 { 
//                     consts.ErrorCode: consts.ErrorCodeFailedToRetrieveRunningService, 
//                     consts.Message:   "Failed to retrieve running services", 
//                 }, 
//             } 
//         } 

//     } 

//     if len(client.GetErrors()) > 0 { 

//         result[consts.Errors] = append(context.GetStringMapSliceValue(consts.Errors), client.GetErrors()...) 
//     } 
// } 

// func cleanUp(client *winrmclient.WinRMClient, result MotadataMap) { 

//     if r := recover(); r != nil { 

//         result[consts.Errors] = []MotadataStringMap{ 
//             { 
//                 consts.ErrorCode: consts.ErrorCodeInternalError, 
//                 consts.Message:   "Invalid Result", 
//                 consts.Error:     fmt.Sprintf("%v", r), 
//             }, 
//         } 
//     } 

//     client.Destroy() 
// }`;

const goCode = `/*
* Copyright (c) Motadata 2024. All rights reserved.
*/
 
package main
 
import (
"encoding/base64"
"encoding/json"
"fmt"
"math/rand"
"motadatasdk/consts"
)
 
const (
// entities
Fan             = "fan.sensor"
FanSensorStatus = "fan.sensor.status"
 
Temperature             = "temperature.sensor"
TemperatureSensorStatus = "temperature.sensor.status"
TemperatureCelsius      = "temperature.sensor.reading.celsius"
 
PowerSupply             = "power.supply.sensor"
PowerSupplySensorStatus = "power.supply.sensor.status"
 
VoltageSensor       = "voltage.sensor"
VoltageMilliVolts   = "voltage.sensor.reading.mill.volts"
VoltageSensorStatus = "voltage.sensor.status"
)
 
// MotadataMap represents a map of string to interface
type MotadataMap map[string]interface{}
 
// MotadataStringMap represents a map of string to string
type MotadataStringMap map[string]string
 
const (
StatusSucceed          = "SUCCEED"
StatusFail             = "FAIL"
Result                 = "result"
Status                 = "status"
Errors                 = "errors"
ErrorCode              = "errorCode"
Error                  = "error"
Message                = "message"
ErrorCodeInternalError = "INTERNAL_ERROR"
BlankString            = ""
)
 
// GetPositiveStatuses returns an array of positive status values
func GetPositiveStatuses() []string {
return []string{
  "Present",
  "Up",
  "OKAY",
  "Enabled",
  "Functioning",
  "Ready",
}
}
 
// GetNegativeStatuses returns an array of negative status values
func GetNegativeStatuses() []string {
return []string{
  "Not Present",
  "Absent",
  "Unsupported",
  "Unresponsive",
  "Stalled",
}
}
 
// GetRandomFromArray returns a random value from an array
func GetRandomFromArray(array []string) string {
return array[rand.Intn(len(array))]
}
 
func main() {
result := make(MotadataMap)
 
run(result)
 
bytes, err := json.Marshal(result)
 
if err != nil {
  bytes, _ = json.Marshal(MotadataMap{
   Status: StatusFail,
   Errors: []MotadataStringMap{
    {
     ErrorCode: ErrorCodeInternalError,
     Error:     fmt.Sprintf("%v", err),
     Message:   "Invalid Result",
    }},
  })
}
 
fmt.Println(base64.StdEncoding.EncodeToString(bytes) + BlankString)
}
 
// run generates dummy data for hardware sensors
func run(result MotadataMap) {
metrics := make(MotadataMap)
 
// Generate temperature sensors
var temperatureSensors []MotadataMap
 
// 5 temperature sensors with positive status
for i := 1; i <= 5; i++ {
  temperatureSensors = append(temperatureSensors, MotadataMap{
   Temperature:             fmt.Sprintf("Temperature Sensor %d", i),
   TemperatureCelsius:      20 + rand.Intn(20), // Random temperature between 20-40°C
   TemperatureSensorStatus: GetRandomFromArray(GetPositiveStatuses()),
  })
}
 
// 5 temperature sensors with negative status
for i := 6; i <= 10; i++ {
  temperatureSensors = append(temperatureSensors, MotadataMap{
   Temperature:             fmt.Sprintf("Temperature Sensor %d", i),
   TemperatureCelsius:      0, // No reading for negative status
   TemperatureSensorStatus: GetRandomFromArray(GetNegativeStatuses()),
  })
}
 
// Generate voltage sensors
var voltageSensors []MotadataMap
 
// 5 voltage sensors with positive status
for i := 1; i <= 5; i++ {
  voltageSensors = append(voltageSensors, MotadataMap{
   VoltageSensor:       fmt.Sprintf("Voltage Sensor %d", i),
   VoltageMilliVolts:   3300 + rand.Intn(500), // Random voltage around 3300-3800 mV
   VoltageSensorStatus: GetRandomFromArray(GetPositiveStatuses()),
  })
}
 
// 5 voltage sensors with negative status
for i := 6; i <= 10; i++ {
  voltageSensors = append(voltageSensors, MotadataMap{
   VoltageSensor:       fmt.Sprintf("Voltage Sensor %d", i),
   VoltageMilliVolts:   0, // No reading for negative status
   VoltageSensorStatus: GetRandomFromArray(GetNegativeStatuses()),
  })
}
 
// Generate power supply sensors
var powerSupplySensors []MotadataMap
 
// 5 power supply sensors with positive status
for i := 1; i <= 5; i++ {
  powerSupplySensors = append(powerSupplySensors, MotadataMap{
   PowerSupply:             fmt.Sprintf("Power Supply %d", i),
   PowerSupplySensorStatus: GetRandomFromArray(GetPositiveStatuses()),
  })
}
 
// 5 power supply sensors with negative status
for i := 6; i <= 10; i++ {
  powerSupplySensors = append(powerSupplySensors, MotadataMap{
   PowerSupply:             fmt.Sprintf("Power Supply %d", i),
   PowerSupplySensorStatus: GetRandomFromArray(GetNegativeStatuses()),
  })
}
 
// Generate fan sensors
var fanSensors []MotadataMap
 
// 5 fan sensors with positive status
for i := 1; i <= 5; i++ {
  fanSensors = append(fanSensors, MotadataMap{
   Fan:             fmt.Sprintf("Fan %d", i),
   FanSensorStatus: GetRandomFromArray(GetPositiveStatuses()),
  })
}
 
// 5 fan sensors with negative status
for i := 6; i <= 10; i++ {
  fanSensors = append(fanSensors, MotadataMap{
   Fan:             fmt.Sprintf("Fan %d", i),
   FanSensorStatus: GetRandomFromArray(GetNegativeStatuses()),
  })
}
 
// Add all sensors to metrics
metrics[Temperature] = temperatureSensors
metrics[VoltageSensor] = voltageSensors
metrics[PowerSupply] = powerSupplySensors
metrics[Fan] = fanSensors
 
// Set result and status
result[Result] = metrics
result[Status] = consts.StatusSucceed
}`;

test.describe.serial('Motadata AIOps', () => {
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
        await page.locator("//input[@name='runbook-name']").fill("Hardware Sensor Custom Script");
        await page.locator('[data-cy="dropdown-trigger-input"]').first().click();
        await page.locator("//input[@placeholder='Search']").fill('integration');
        await page.locator("//span[@title='Integration']").click();
        await page.locator("//input[@readonly='readonly']").click();
        await page.locator("//input[@id='assign-monitor-search']").fill("fg_firewall.mindarray.com");
        // Wait for the row with the searched device to appear
        const row = page.locator('tr', { hasText: 'fg_firewall.mindarray.com' });
        await expect(row).toBeVisible({ timeout: 5000 });
        // Click the checkbox inside that row
        const checkbox = row.locator('input[type="checkbox"]');
        await expect(checkbox).toBeVisible({ timeout: 5000 });
        await checkbox.click();
          await page.locator("//input[@name='runbook-description']").fill("runbook to get active services of windows device");
        //   await page.locator("//div[@id='credential-profile-picker-id']").click();
        //   await page.locator("//input[@placeholder='Search']").fill("172.16.10.134-Device");
        //   await page.locator("//span[@title='172.16.10.134-Device']").click();
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