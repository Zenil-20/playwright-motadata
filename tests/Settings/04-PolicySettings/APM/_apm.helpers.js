/*
 * Copyright (c) 2026 Motadata. All Rights Reserved.
 *
 * Shared helper for the APM policy specs.
 *
 * Author  : Zenil Kapadia
 * Created : 15 July 2026
 */

import { expect } from '@playwright/test';

/**
 * Select an APM policy **Counter**, tolerating the propagation lag between APM
 * service registration (tests/Settings/07-APM/application_registration.spec.js)
 * and its trace data becoming usable.
 *
 * WHY: the trace-derived counters used by these policies
 * (service.span.duration.us, service.trace.error.rate, service.traces.per.min, …)
 * only appear in the Counter dropdown AFTER the registered service has reported
 * traces — a fixed ~4-5 min floor after registration. Selecting the counter
 * immediately (as the inline flow did) fails when the policy project runs before
 * that data has propagated.
 *
 * HOW: poll the Counter dropdown — reopen + re-search each round — until the
 * option is actually selectable, up to `timeout` (default 10 min, ≈ 2× the known
 * 4-5 min floor), then click it. This is a smart wait, NOT a blind sleep: it
 * returns the instant the option appears, so a warm environment pays ~0 extra
 * wait. Ordering (registration BEFORE this) is guaranteed separately by the
 * `dependencies: ['settings_07_apm']` project wiring in playwright.config.js.
 *
 * PRECONDITION: the Create-Policy form is open and (for Trace Analytics specs)
 * the policy type already chosen, so the "Select Counter" control is visible.
 * NOTE: the caller's test must raise its own timeout (test.setTimeout) above this
 * `timeout`, because Playwright's per-test cap (config `timeout`) would otherwise
 * kill the wait — page.setDefaultTimeout only affects action timeouts, not the test.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} counter  exact counter name, e.g. 'service.span.duration.us'
 * @param {{ timeout?: number }} [opts]
 */
export async function selectApmCounter(page, counter, { timeout = 10 * 60_000 } = {}) {
  const counterInput = page.locator("//input[@placeholder='Select Counter']");
  const searchInput = page.locator("//input[@placeholder='Search']");
  const option = page.getByText(counter, { exact: true }).first();

  await expect
    .poll(
      async () => {
        // (Re)open the Counter dropdown and search for the counter each round.
        await counterInput.click();
        await searchInput.fill(counter);
        // isVisible() returns immediately (no wait), so a missing option makes
        // this round fail fast rather than blocking the whole timeout.
        const present = await option.isVisible().catch(() => false);
        // Close the dropdown ONLY when retrying, so the successful round leaves
        // it open + filtered for the click() below.
        if (!present) await page.keyboard.press('Escape').catch(() => {});
        return present;
      },
      {
        timeout,
        intervals: [15_000, 30_000, 30_000],
        message:
          `APM counter "${counter}" did not appear within ${Math.round(timeout / 60000)} min. ` +
          'Confirm 07-APM registered a service and its trace data propagated (~4-5 min floor).',
      },
    )
    .toBe(true);

  // Data has propagated and the option is showing — select it.
  await option.click();
}
