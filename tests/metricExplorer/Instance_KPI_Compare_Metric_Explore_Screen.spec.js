const { test, expect } = require('@playwright/test');
const dotenv = require('dotenv');
const path = require('path');
const { login, logout } = require('../fixtures/auth.js');

dotenv.config({
  path: path.resolve(process.cwd(), '.env'),
  quiet: true
});

test.describe.serial('Motadata AIOps Metric Explorer Compare Data verification', () => {
  let page;
  let context;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
    page.setDefaultTimeout(500000);
  });

  test.afterAll(async () => {
    if (page) await page.close();
    if (context) await context.close();
  });

  test('Login to Motadata AIOps', async () => {
    await login(page);
  });

  test('Instance_KPI_Compare_Metric_Explore_Screen', async () => {
    await page.getByRole('link', { name: 'Metric Explorer' }).click();

    await page.getByPlaceholder('Select').first().click();
    await page.locator('//input[@id="assign-monitor-search"]').fill('172.16.15.132');

    const ipRow = page.locator('tr.k-master-row').filter({ hasText: '172.16.15.132' });
    await expect(ipRow).toHaveCount(1);

    await ipRow.locator('input[type="checkbox"]').click();

    await page.getByRole('tab', { name: 'Instance' }).click();
    await page.locator('input[data-cy="dropdown-trigger-input"]').nth(1).click();

    await page.locator("//input[@placeholder='Search']").fill('system.process');
    await page.locator('span[title="system.process"]').click({ timeout: 10000, force: true });

    await page.locator('input[data-cy="dropdown-trigger-input"]').nth(2).click();

    await page.locator('input[data-cy="dropdown-search-input"]').fill('motadata|./motadata APP');

    const appRow = page.locator('tr.k-master-row').filter({ hasText: './motadata APP' });
    await expect(appRow).toHaveCount(1);

    await appRow.locator('input[type="checkbox"]').click();

    await page.locator('//input[@placeholder="Search"]').fill('system.process.memory.used.bytes');

    await page.locator('div[title="system.process.memory.used.bytes"]').locator('xpath=preceding-sibling::span[1]').click();

    const noData = page.locator('h5', { hasText: 'No data found' });

    if (await noData.count() > 0) {
      console.error('No data found - failing test immediately');

      try {
        await page.locator("#user-avatar").click();
        await page.getByText('Logout').click();
      } catch (e) {}

      throw new Error('Test failed: No data found on compare screen');
    }

    await page.getByRole('button', { name: 'Actions' }).click();
    await page.getByText('Compare', { exact: true }).click();

    await page.waitForTimeout(4000);

    await expect(page.locator('.highcharts-container').first()).toBeVisible();

    await expect(page.locator('div.ant-tag').filter({ hasText: 'motadata|./motadata APP' })).toBeVisible();

    const path = page.locator('path.highcharts-tracker-line').first();
    const d = await path.getAttribute('d');

    expect(d).toBeTruthy();

    await page.locator('button.squared-button:has(svg[data-icon="times"])').click();
  });

  test('Metric_KPI_Forecast_Metric_Explore_Screen', async () => {
      await page.reload({ waitUntil: 'networkidle' });

      await page.getByPlaceholder('Select').first().click();
      await page.locator('//input[@id="assign-monitor-search"]').fill('172.16.15.132');

      const ipRow = page.locator('tr.k-master-row').filter({ hasText: '172.16.15.132' });
      await expect(ipRow).toHaveCount(1);

      await ipRow.locator('input[type="checkbox"]').click();

      // select metric
      await page.locator("//input[@placeholder='Search']").fill('system.cpu.percent');
      await page.locator('div[title="system.cpu.percent"]').locator('xpath=preceding-sibling::span[1]').click();

      // open Actions -> Forecast
      await page.waitForTimeout(3000);
      await page.locator('//button[@title="Actions"]').click();
      await page.waitForTimeout(1000);
      await page.locator('//span[normalize-space()="Forecast"]').click();

      // Check "No data found"
      const noData = page.locator('h5', { hasText: 'No data found' });

      if (await noData.count() > 0) {
        console.error('No data found - failing test immediately');

        try {
          await page.locator("#user-avatar").click();
          await page.getByText('Logout').click();
        } catch (e) {}

        throw new Error('Test failed: No data found on forecast screen');
      }

      const chartBg = page.locator('rect.highcharts-background');
      await expect(chartBg.first()).toBeVisible();

      await page.locator('button.squared-button:has(svg[data-icon="times"])').click();
    });

  test('Instance_KPI_Anomaly_Metric_Explore_Screen', async () => {
    await page.reload({ waitUntil: 'networkidle' });

    await page.getByPlaceholder('Select').first().click();
    await page.locator('//input[@id="assign-monitor-search"]').fill('172.16.15.132');

    const ipRow = page.locator('tr.k-master-row').filter({ hasText: '172.16.15.132' });
    await expect(ipRow).toHaveCount(1);

    await ipRow.locator('input[type="checkbox"]').click();

    await page.getByRole('tab', { name: 'Instance' }).click();

    await page.locator('input[data-cy="dropdown-trigger-input"]').nth(1).click();

    await page.locator("//input[@placeholder='Search']").fill('system.process');
    await page.locator('span[title="system.process"]').click({ timeout: 10000, force: true });

    await page.locator('input[data-cy="dropdown-trigger-input"]').nth(2).click();

    await page.locator('input[data-cy="dropdown-search-input"]').fill('motadata|./motadata APP');

    const appRow = page.locator('tr.k-master-row').filter({ hasText: './motadata APP' });
    await expect(appRow).toHaveCount(1);

    await appRow.locator('input[type="checkbox"]').click();

    await page.locator('//input[@placeholder="Search"]').fill('system.process.memory.used.bytes');

    await page.locator('div[title="system.process.memory.used.bytes"]').locator('xpath=preceding-sibling::span[1]').click();

    await page.getByRole('button', { name: 'Actions' }).click();
    await page.getByText('Anomaly', { exact: true }).click();

    await page.locator('path.highcharts-tracker-area').first().hover();

    await page.getByRole('button', { name: 'Stick Back' }).click();

    const anomalyTag = page.locator('div.ant-tag.rounded').filter({ hasText: /Anomaly/ });
    await expect(anomalyTag).toBeVisible();

    await expect(page.locator('div.ant-tag').filter({ hasText: 'motadata|./motadata APP' })).toBeVisible();

    await page.locator("//button[@title='granularity']").click();
    await page.locator("//input[@placeholder='Granularity']").fill('90');
    await page.getByRole('button', { name: 'Apply' }).click();
  });

  test('Instance_KPI_Forecast_Metric_Explore_Screen', async () => {
    await page.reload({ waitUntil: 'networkidle' });

    await page.locator('//input[@placeholder="Select"]').click();
    await page.locator('//input[@id="assign-monitor-search"]').fill("172.16.15.132");

    await page.waitForTimeout(2000);
    await page.locator('//input[@type="checkbox"]').click();

    await page.waitForTimeout(1000);
    await page.locator('//div[normalize-space()="Instance"]').click();

    await page.locator('//div[@class="ant-form-item-control"]//input[@placeholder="Select"]').click();

    await page.locator("//input[@placeholder='Search']").fill('system.process');
    await page.locator('span[title="system.process"]').click({ timeout: 10000, force: true });

    await page.locator('input[data-cy="dropdown-trigger-input"]').nth(2).click();

    await page.locator('input[data-cy="dropdown-search-input"]').fill('motadata|./motadata APP');

    const appRow = page.locator('tr.k-master-row').filter({ hasText: './motadata APP' });
    await expect(appRow).toHaveCount(1);

    await appRow.locator('input[type="checkbox"]').click();

    await page.locator('//input[@placeholder="Search"]').fill('system.process.memory.used.bytes');

    await page.locator('div[title="system.process.memory.used.bytes"]').locator('xpath=preceding-sibling::span[1]').click();

    await page.waitForTimeout(3000);

    await page.locator('//button[@title="Actions"]').click();

    await page.waitForTimeout(1000);

    await page.locator('//span[normalize-space()="Forecast"]').click();

    //Check "No data found"
const noData = page.locator('h5', { hasText: 'No data found' });

if (await noData.count() > 0) {
  console.error('❌ No data found - failing test');

  // optional logout before fail
  try {
    await page.locator("#user-avatar").click();
    await page.getByText('Logout').click();
  } catch (e) {
    console.error('Logout failed or UI not available');
  }

  throw new Error('Test failed: No data found on chart screen');
}


// 2. Validate Highcharts chart loaded
const chartBg = page.locator('rect.highcharts-background');

await expect(chartBg.first()).toBeVisible();
await page.locator('button.squared-button:has(svg[data-icon="times"])').click();
  });

  test('Metric_KPI_Compare_Metric_Explore_Screen', async () => {
      await page.reload({ waitUntil: 'networkidle' });

      await page.getByPlaceholder('Select').first().click();
      await page.locator('//input[@id="assign-monitor-search"]').fill('172.16.15.132');

      const ipRow = page.locator('tr.k-master-row').filter({ hasText: '172.16.15.132' });
      await expect(ipRow).toHaveCount(1);

      await ipRow.locator('input[type="checkbox"]').click();

      // select metric
      await page.locator("//input[@placeholder='Search']").fill('system.cpu.percent');
      await page.locator('div[title="system.cpu.percent"]').locator('xpath=preceding-sibling::span[1]').click();

      // open Actions -> Forecast
      await page.waitForTimeout(3000);
      await page.locator('//button[@title="Actions"]').click();
      await page.waitForTimeout(1000);
      await page.locator('//span[normalize-space()="Compare"]').click();

      // Check "No data found"
      const noData = page.locator('h5', { hasText: 'No data found' });

      if (await noData.count() > 0) {
        console.error('No data found - failing test immediately');

        try {
          await page.locator("#user-avatar").click();
          await page.getByText('Logout').click();
        } catch (e) {}

        throw new Error('Test failed: No data found on compare screen');
      }

      const chartBg = page.locator('rect.highcharts-background');
      await expect(chartBg.first()).toBeVisible();

      await page.locator('button.squared-button:has(svg[data-icon="times"])').click();
    });

  test('Metric_KPI_Anomaly_Metric_Explore_Screen', async () => {
  await page.reload({ waitUntil: 'networkidle' });

  await page.getByPlaceholder('Select').first().click();
  await page.locator('//input[@id="assign-monitor-search"]').fill('172.16.15.132');

  const ipRow = page.locator('tr.k-master-row').filter({ hasText: '172.16.15.132' });
  await expect(ipRow).toHaveCount(1);

  await ipRow.locator('input[type="checkbox"]').click();

  await page.getByRole('tab', { name: 'Instance' }).click();

  await page.locator('input[data-cy="dropdown-trigger-input"]').nth(1).click();

  await page.locator("//input[@placeholder='Search']").fill('system.process');
  await page.locator('span[title="system.process"]').click({ timeout: 10000, force: true });

  await page.locator('input[data-cy="dropdown-trigger-input"]').nth(2).click();

  await page.locator('input[data-cy="dropdown-search-input"]').fill('motadata|./motadata APP');

  const appRow = page.locator('tr.k-master-row').filter({ hasText: './motadata APP' });
  await expect(appRow).toHaveCount(1);

  await appRow.locator('input[type="checkbox"]').click();

  await page.locator('//input[@placeholder="Search"]').fill('system.process.memory.used.bytes');

  await page.locator('div[title="system.process.memory.used.bytes"]')
    .locator('xpath=preceding-sibling::span[1]')
    .click();
  // WAIT FOR UI TO UPDATE
  await page.waitForTimeout(2000);
  // FAIL FAST: NO DATA FOUND
  const noData = page.locator('h5', { hasText: 'No data found' });

  if (await noData.isVisible().catch(() => false)) {
    console.error('No data found - failing test immediately');

    try {
      await page.locator("#user-avatar").click();
      await page.getByText('Logout').click();
    } catch (e) {}

    throw new Error('Test failed: No data found on compare screen');
  }

  // OPEN ANOMALY DETECTION

  await page.getByRole('button', { name: 'Actions' }).click();
  await page.getByText('Anomaly', { exact: true }).click();

  // WAIT FOR CHART LOAD

  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // CHART ASSERTIONS

  const chartContainer = page.locator('.highcharts-container').first();
  await expect(chartContainer).toBeVisible({ timeout: 15000 });

  const chartBg = page.locator('rect.highcharts-background').first();
  await expect(chartBg).toBeVisible({ timeout: 15000 });

  const path = page.locator('path.highcharts-tracker-line').first();
  await expect(path).toBeVisible({ timeout: 15000 });

  const d = await path.getAttribute('d');
  expect(d && d.length > 0).toBeTruthy();

  // CLOSE PANEL
  await page.locator('button.squared-button:has(svg[data-icon="times"])').click();
  //granuality->raw
  await page.locator("//button[@title='granularity']").click();
  await page.locator("//span[normalize-space()='Raw']").click();
  await page.getByRole('button', { name: 'Apply' }).click();
   
  // CHART ASSERTIONS AFTER GRANUALITY RAW APPLIED

  const chartAfterRaw= page.locator('.highcharts-container').first();
  await expect(chartAfterRaw).toBeVisible({ timeout: 15000 });

  const chartBgAfterRaw = page.locator('rect.highcharts-background').first();
  await expect(chartBgAfterRaw).toBeVisible({ timeout: 15000 });

  const pathRaw = page.locator('path.highcharts-tracker-line').first();
  await expect(pathRaw).toBeVisible({ timeout: 15000 });

  const dRaw = await pathRaw.getAttribute('d');
  expect(dRaw && dRaw.length > 0).toBeTruthy();

  const saveBtn = page.getByRole('button', { name: 'Save View' });
  const updateBtn = page.getByRole('button', { name: 'Update View' });

  if(saveBtn.isVisible()){
    await saveBtn.click();
    await page.locator("//div[@class='row ant-row-flex']//div[1]//div[1]//div[1]//div[2]//div[1]//span[1]//input[1]").fill("test view");
    await page.locator("//div[@class='ant-drawer-body']//div[2]//div[1]//div[1]//div[2]//div[1]//span[1]//input[1]").fill("test description");
    await page.getByRole('button', { name: 'Save', exact: true }).click();
  }
  else {
    await updateBtn.click();
    await page.locator("//div[@class='ant-form-item-control has-error']//input[@type='text']").fill("test view");
    await page.locator("//div[@class='form-item-pristine']//input[@type='text']").fill("test description");
    await page.getByRole('button', { name: 'Save', exact: true }).click();
  }
});

  test('Logout from AIOps', async () => {
    await logout(page);
  });
});