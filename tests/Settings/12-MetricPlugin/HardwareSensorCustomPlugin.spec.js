const { test, expect } = require('@playwright/test');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({
	path: path.resolve(process.cwd(), '.env'),
	quiet: true
});

const goCode = `/*
 * Copyright (c) Motadata 2026. All rights reserved.
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
				},
			},
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
			TemperatureCelsius:      20 + rand.Intn(20),
			TemperatureSensorStatus: GetRandomFromArray(GetPositiveStatuses()),
		})
	}

	// 5 temperature sensors with negative status
	for i := 6; i <= 10; i++ {
		temperatureSensors = append(temperatureSensors, MotadataMap{
			Temperature:             fmt.Sprintf("Temperature Sensor %d", i),
			TemperatureCelsius:      0,
			TemperatureSensorStatus: GetRandomFromArray(GetNegativeStatuses()),
		})
	}

	// Generate voltage sensors
	var voltageSensors []MotadataMap

	// 5 voltage sensors with positive status
	for i := 1; i <= 5; i++ {
		voltageSensors = append(voltageSensors, MotadataMap{
			VoltageSensor:       fmt.Sprintf("Voltage Sensor %d", i),
			VoltageMilliVolts:   3300 + rand.Intn(500),
			VoltageSensorStatus: GetRandomFromArray(GetPositiveStatuses()),
		})
	}

	// 5 voltage sensors with negative status
	for i := 6; i <= 10; i++ {
		voltageSensors = append(voltageSensors, MotadataMap{
			VoltageSensor:       fmt.Sprintf("Voltage Sensor %d", i),
			VoltageMilliVolts:   0,
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
		await page.goto(process.env.Motadata_Aiops, {
			timeout: 500000
		});

		await page
			.locator("//input[@placeholder='Username']")
			.fill(process.env.Motadata_Username);

		await page
			.locator("//input[@placeholder='Password']")
			.fill(process.env.Motadata_Password);

		await page
			.locator("//button[@type='submit']")
			.click();

		await page.waitForLoadState('networkidle');
	});

	test('Navigate to Metric Plugin and Create a Custom Metric Plugin which fetches hardware sensor data', async () => {
		await page.locator("//a[@href='/settings/']").click();

		await page.locator("//input[@id='phone-number']").click();

		await page
			.locator("//input[@placeholder='Search']")
			.fill('plugin');

		await page
			.getByRole('link', {
				name: 'Metric',
				exact: true
			})
			.click({ timeout: 10000 });

		await page
			.getByRole('button', {
				name: 'Create Metric Plugin'
			})
			.click();

		await page
			.getByRole('menuitem', {
				name: ' Custom '
			})
			.click();

		await page.evaluate((code) => {
			const editor = document.querySelector('.CodeMirror').CodeMirror;
			editor.setValue(code);
		}, goCode);

		await page
			.locator("//input[@placeholder='Must be unique']")
			.fill("Hardware Sensor Custom Script");

		await page
			.locator('[data-cy="dropdown-trigger-input"]')
			.first()
			.click();

		await page
			.locator("//input[@placeholder='Search']")
			.fill('firewall');

		await page
			.locator('span', { hasText: 'Firewall' })
			.click();

		await page
			.locator("//input[@readonly='readonly']")
			.click();

		await page
			.locator("//input[@id='assign-monitor-search']")
			.fill("fg_firewall.mindarray.com");

		const row = page.locator('tr', {
			hasText: 'fg_firewall.mindarray.com'
		});

		await expect(row).toBeVisible({ timeout: 5000 });

		const checkbox = row.locator('input[type="checkbox"]');

		await expect(checkbox).toBeVisible({ timeout: 5000 });

		await checkbox.click();

        await page.locator("//input[@readonly='readonly']").click();

		const input = page.locator(
			'//div[@class="col min-h-0 flex-col flex overflow-auto h-100 ant-col-9 fixed-size"]//div[1]//div[2]//div[1]//div[1]//div[2]//div[1]//span[1]//input[1]'
		);

		await input.fill(
			'This is a custom metric plugin that retrieves hardware sensor data such as temperature, voltage, power supply status, and fan status from a firewall device. The plugin executes a Go script that simulates the retrieval of this data and returns it in a structured format. The metric plugin is assigned to the device "fg_firewall.mindarray.com" and is categorized under "Firewall".'
		);

		await page
			.getByRole('button', { name: 'Test' })
			.click();

		await page
			.locator("//div[@id='test-monitor-picker-id']")
			.click();

		const checkbox1 = row.locator('input[type="checkbox"]');

		await expect(checkbox1).toBeVisible({ timeout: 5000 });

		await checkbox1.click();

		await page
			.locator("//button[@id='create-credential-profile-btn-id']")
			.click();

		const successMessage = page.getByText(
			'Metric Plugin tested successfully',
			{ exact: true }
		);

		await expect(successMessage).toBeVisible({
			timeout: 15000
		});

		await page
			.getByRole('button', {
				name: 'Create Metric Plugin'
			})
			.click({ timeout: 400000 });
	});

	test('Test Assign and unassign monitors functionality of the Metric Plugin', async () => {
		await page
			.locator("//input[@name='search']")
			.fill("Hardware Sensor Custom Script");

		const pluginRow = page
			.locator('tr.k-master-row')
			.filter({
				hasText: 'Hardware Sensor Custom Script'
			});

		await expect(pluginRow).toHaveCount(1);
		await expect(pluginRow).toBeVisible();

		const usedCount = pluginRow.locator('.used-count-pill');

		await expect(usedCount).toHaveText('1');

		await pluginRow
			.locator('[data-cy="grid-action"]')
			.click();
        //Unassign the monitor from the plugin
		await page
			.getByRole('link', {
				name: 'Remove Monitors'
			})
			.click();

		await page
			.locator("input[type='checkbox']")
			.first()
			.click();

		await page
			.getByRole('button', {
				name: 'Unassign Monitor'
			})
			.click();

		// Again Assign the monitor back to the plugin
		await pluginRow
			.locator('[data-cy="grid-action"]')
			.click();

		await page
			.getByRole('link', {
				name: ' Assign Monitors '
			})
			.click();

		await page
			.locator("//input[@id='assign-monitor-search']")
			.fill("fg_firewall.mindarray.com");

		const monitorRow = page
			.locator('tr.k-master-row')
			.filter({
				hasText: 'fg_firewall.mindarray.com'
			});

		await expect(monitorRow).toHaveCount(1);
		await expect(monitorRow).toBeVisible();

		if (await monitorRow.count() === 1) {
			await monitorRow
				.locator('input[type="checkbox"]')
				.click();

			await page
				.getByRole('button', {
					name: 'Test'
				})
				.click();

			await page
				.getByRole('button', {
					name: 'Test Credential'
				})
				.click();

			await expect(
				page.getByText('Successful', {
					exact: true
				})
			).toBeVisible({
				timeout: 40000
			});

			await page
				.locator("//button[@id='submit-btn-id']")
				.click();
		}
	});

	test('Logout from AIOps', async () => {
		await page
			.locator("//img[@alt='Avatar']")
			.click();

		await page
			.getByText('Logout')
			.click();

		await page.context().clearCookies();
		await page.context().clearPermissions();
	});
});