---
name: playwright-test-step
description: Structure ObserveOps specs so a failure explains itself — group discovery/policy/alert phases with test.step, attach trace/screenshot/API-payload evidence via testInfo.attach, link Jira/PQD tickets with annotations, and gate soft assertions with a hard check. Use for non-trivial flows, data-driven scenarios, or when a CI failure gives only a line number.
---

# test.step & reporting for ObserveOps specs

An ObserveOps E2E — log in, navigate Settings, create a discovery profile, provision, verify a grid
row — is long. As a flat wall of actions, a CI failure gives a line number and nothing else. Wrap
each phase in `test.step` so the HTML report reads like the test plan, attach the artifact that
explains a failure (the trace, a "No data found" screenshot, the AIOps payload), and annotate with
the Jira/PQD/MOTADATA ticket for traceability. This matches our provenance rule: every result is
evidenced, and quarantined failures are documented, not hidden.

## When to use / When NOT

Use for any multi-phase flow (discovery, policy create, alerts), for data-driven scenarios where you
need to see which CSV row broke, and whenever a failure is hard to debug from output alone. Do NOT
sprinkle steps over trivial single-action helpers, and never leave `expect.soft` without a closing
hard gate.

## Patterns

### 1 — Structure a discovery flow with `test.step`
```js
test('Network discovery provisions a monitor', async ({ page }) => {
  await test.step('Log in', async () => {
    await page.goto(process.env.Motadata_Aiops, { timeout: 500000 });
    await page.locator("//input[@placeholder='Username']").fill(process.env.Motadata_Username);
    await page.locator("//input[@placeholder='Password']").fill(process.env.Motadata_Password);
    await page.locator("//button[@type='submit']").click();
    await expect(page.locator("//img[@alt='Avatar']")).toBeVisible();   // smart wait
  });

  await test.step('Open Discovery Profile', async () => {
    await page.locator("//a[@href='/settings/']").click();
    await page.locator("//input[@id='phone-number']").click();          // required focus quirk
    await page.locator("//input[@placeholder='Search']").fill('Discovery Profile');
    await page.getByRole('link', { name: 'Discovery Profile' }).click();
  });

  const ip = await test.step('Create + run profile', async () => {
    await page.getByRole('button', { name: 'Create Discovery Profile' }).click();
    await page.locator("input[name='profile-name']").fill(`auto-${Date.now()}`);
    await page.locator("//input[@id='ip-address-id']").fill(process.env.DEVICE_IP);
    await page.locator('#save-run-btn-id').click();
    return process.env.DEVICE_IP;
  });

  await test.step(`Verify ${ip} provisioned`, async () => {
    const row = page.locator('tr.k-master-row').filter({ hasText: ip });
    await expect(row).toBeVisible({ timeout: 60_000 });
  });
});
```

### 2 — Attach evidence at the moment it matters
```js
await test.step('Capture provision result', async () => {
  await testInfo.attach('discovery-grid.png', {
    body: await page.screenshot({ fullPage: true }), contentType: 'image/png',
  });
  await testInfo.attach('provision.json', {                 // the AIOps payload behind the grid
    body: JSON.stringify(payload, null, 2), contentType: 'application/json',
  });
});
```

### 3 — Soft assertions across a policy form, then a hard gate
```js
await test.step('Verify all policy fields at once', async () => {
  await expect.soft(page.locator("input[name='profile-name']")).toHaveValue('CPU > 90');
  await expect.soft(page.getByRole('switch', { name: /enabled/i })).toBeChecked();
  await expect.soft(page.getByText('metric', { exact: true })).toBeVisible();
});
expect(test.info().errors).toHaveLength(0);                 // hard gate — still fails the test
```

### 4 — Annotate for Jira/PQD traceability & known issues
```js
test.info().annotations.push(
  { type: 'issue', description: 'MOTADATA-8503' },          // link the ticket
  { type: 'suite', description: 'settings-policy-regression' },
);
// Known-bug quarantine (documented in knowledge/known_issues/customer-issue-kb.md):
test.info().annotations.push({ type: 'known-issue', description: 'Widget popover flake — MOTADATA-8898' });
```

### 5 — Box a shared helper so failures point at the caller
```js
async function loginToAiops(page) {
  await test.step('Log in to AIOps', async () => {
    /* canonical login block */
  }, { box: true });                                        // error surfaces at the call site
}
```

### 6 — Reporters (playwright.config)
```js
reporter: [
  ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ['json', { outputFile: 'test-results/results.json' }],    // feeds framework/core reporters
  ['list'],
],
use: { trace: 'retain-on-failure', screenshot: 'only-on-failure', video: 'retain-on-failure' },
```

## Rules & anti-patterns

- **Name steps by intent** ("Create + run profile"), not mechanics ("click #save-run-btn-id").
- **Attach, don't `console.log`** — logs aren't in the report; the trace/screenshot/payload are the
  evidence the failure-triager and reporter agents consume.
- **`trace: 'retain-on-failure'`** so a failing spec carries the a11y snapshot the triager reads
  (`error-context.md`) — never rely on screenshots/video for diagnosis.
- **End soft-assertion blocks with a hard gate** so a spec never goes green with a silent defect.
- **Always give `test.skip()` a reason** (e.g. empty "No data found" grid → seed-data missing) so
  the report explains the skip; quarantine-not-mask.
- **Link the ticket** (`MOTADATA-*` / PQD) via annotations so every run is traceable back to the
  requirement.

Adapted from qaskills/seed-skills/playwright-test-step
