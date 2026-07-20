/*
 * Copyright (c) 2026 Motadata. All Rights Reserved.
 *
 * Shared UI helpers for the SNMP-trap CONFIG screens (Listener / Profile / Forwarder / Trap Policy).
 * Locators come from the live harvest (cookbook §16b) — verified count()===1 on 172.16.15.151.
 *
 * These wrap the repetitive Ant-Design patterns (open drawer, pick a dropdown option, submit the
 * drawer, find/delete a row) so the specs read as intent, not selector plumbing.
 *
 * NOTE (grounding honesty): field locators are verified. DROPDOWN OPTION VALUES (protocol, security
 * level, trigger condition, varbind, etc.) were not enumerated during the read-only harvest, so
 * `selectAntOption` picks by visible text and callers pass the value — adjust the value strings once
 * confirmed live. Every such spot is commented.
 *
 * Author  : Zenil Kapadia
 * Created : 7 July 2026
 */

import { expect } from '@playwright/test';
import { AIOPS_URL } from './trap-fixtures.js';

/**
 * Click by dispatching the DOM click on the element, bypassing the floating Vue dev-tools overlay
 * ('cp-empty') that intercepts real pointer events over footers in this 8.2.6 DEV build. Use for any
 * footer/submit button that a normal .click() reports as "subtree intercepts pointer events".
 */
export async function clickThroughOverlay(locator) {
  await locator.scrollIntoViewIfNeeded().catch(() => {});
  await locator.evaluate((el) => {
    // Prefer the nearest real clickable ancestor (an <svg> icon has no .click()); fall back to a
    // bubbling synthetic MouseEvent so the framework's @click handler still fires past the overlay.
    const target = el.closest('button, a, [role="button"]') || el;
    if (typeof target.click === 'function') target.click();
    else target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  });
}

/** Direct-route navigation (the app supports deep links; avoids the Settings-search quirk). */
export async function gotoSettings(page, route) {
  await page.goto(`${AIOPS_URL}${route}`, { timeout: 120000 });
  // Every trap settings list renders its own search box — use it as the "page ready" signal.
  await page.waitForTimeout(1500);
}

/**
 * Open a "Create ..." drawer/form via the page's create button. The label differs per screen
 * ('Create SNMP Trap Listener' etc.) but the create trigger is always the first create/new button.
 */
export async function openCreate(page) {
  await page.getByRole('button', { name: /create|new|add/i }).first().click();
  // Drawer-open signal: the create drawer's heading is 'Create SNMP Trap <X> Profile' (verified in
  // the page snapshot). Waiting on this VISIBLE heading avoids matching the many hidden background
  // <form> elements the page carries. Regex covers Listener / Profile / Forwarder drawers.
  await expect(page.getByRole('heading', { name: /Create SNMP Trap/i }).first()).toBeVisible({ timeout: 30000 });
}

/**
 * Pick an option from an Ant select. Opens the trigger, optionally types to filter (some selects
 * render a search box in a floating popover — cookbook: input[data-cy='dropdown-search-input'].last()),
 * then clicks the option by its title/text (cookbook global: //span[@title='<value>'] .first()).
 *
 * @param {import('@playwright/test').Locator} trigger  the select's input/trigger locator
 * @param {string} value  the visible option text to choose
 */
export async function selectAntOption(page, trigger, value) {
  await trigger.click();
  const search = page.locator("input[data-cy='dropdown-search-input']").last();
  if (await search.isVisible().catch(() => false)) await search.fill(value);
  // Prefer the exact-title span; fall back to the ant option row by text.
  const opt = page
    .locator(`//span[@title='${value}']`)
    .or(page.locator('.ant-select-item-option', { hasText: value }))
    .first();
  await opt.click();
}

/**
 * Pick an option from Motadata's BESPOKE picker widget (NOT a plain Ant select) — the one used by
 * Trap Policy form fields and the listener's Security Level. Harvested live 2026-07-08:
 *   trigger : input[data-cy='dropdown-trigger-input'] (placeholder varies per field)
 *   portal  : .ant-popover.picker-overlay.open (floating; virtualized vue-recycle-scroller inside)
 *   search  : input[data-cy='dropdown-search-input'] (present in every picker)
 *   options : .scroll-dropdown-menu-item
 *
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').Locator} trigger  the picker's trigger input
 * @param {string} optionText  visible option text
 * @param {{exact?: boolean}} [opts]  exact=true matches the whole option text (needed for numeric
 *                                    options like Varbind '2', where hasText('2') would also hit '12')
 */
export async function pickFromPicker(page, trigger, optionText, opts = {}) {
  await trigger.click();
  const search = page.locator("input[data-cy='dropdown-search-input']").last();
  await search.waitFor({ state: 'visible', timeout: 10000 });
  await search.fill(optionText);
  await page.waitForTimeout(400); // virtualized list re-render
  const matcher = opts.exact
    ? new RegExp(`^\\s*${optionText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`)
    : optionText;
  const option = page.locator('.scroll-dropdown-menu-item').filter({ hasText: matcher }).first();
  await option.waitFor({ state: 'visible', timeout: 10000 });
  // DOM-dispatch like clickThroughOverlay: the floating dev-tools widget on this build can sit
  // over the popover's lower edge and swallow pointer clicks.
  await option.evaluate((el) => el.click());
  // the popover closes on selection; make sure it is gone so the next picker doesn't grab it
  await page.locator('.ant-popover.picker-overlay.open').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
}

/**
 * Submit the open create drawer. The harvested submit text matches TWO nodes (drawer title +
 * button), so we scope to the drawer's primary button and fall back to the last text match.
 */
export async function submitCreate(page, _buttonText) {
  // Submit = the drawer footer's PRIMARY button (stable ids exist per screen, e.g.
  // #btn-submit-trap-listener); 'Reset' is the default-styled sibling. Scoping to .ant-drawer-open
  // avoids the list-page 'Create SNMP Trap <X>' button (same text) behind the drawer mask.
  //
  // This 8.2.6 DEV build renders a floating Vue dev-tools widget (a 'cp-empty' overlay) that can
  // intercept pointer events over the bottom-right footer. Scroll the button into view and force
  // the click past that dev-only overlay (it is absent in production builds). _buttonText kept for
  // call-site readability.
  const submit = page.locator('.ant-drawer-open button.ant-btn-primary').last();
  await submit.scrollIntoViewIfNeeded().catch(() => {});
  // A real pointer click (even force:true) still lands on the dev-tools overlay that sits over the
  // footer, so the button's handler never fires. Dispatch the click ON the element itself — Vue's
  // @click handler runs regardless of what's painted on top. We do NOT wait for the drawer here:
  // validation tests expect it to STAY open (error shown). Use submitAndExpectSaved for create flows.
  await submit.evaluate((el) => el.click());
}

/**
 * Submit a create drawer AND wait for the save to succeed — the drawer closes on success. If a
 * required field is missing the drawer stays open (this throws), which is the correct failure.
 */
export async function submitAndExpectSaved(page, buttonText) {
  await submitCreate(page, buttonText);
  // Success = the drawer closes. If the server rejects the save (duplicate name, port already in
  // use, etc.) it shows an error notification — surface that message immediately instead of waiting
  // out the full timeout with an opaque "drawer didn't close".
  const saved = page.locator('.ant-drawer-open').waitFor({ state: 'hidden', timeout: 30000 }).then(() => 'saved');
  const failed = page
    .locator('.ant-notification-notice-error, .ant-notification-notice:has(.anticon-close-circle)')
    .first().waitFor({ state: 'visible', timeout: 30000 })
    .then(async () => {
      const msg = await page.locator('.ant-notification-notice-message, .ant-notification-notice-description')
        .first().innerText().catch(() => '(no message)');
      throw new Error(`create was rejected by the server: ${msg.replace(/\s+/g, ' ').trim()}`);
    });
  await Promise.race([saved, failed]);
}

/** Find a row in the current list grid by unique text (e.g. the name we just created). */
export function listRow(page, uniqueText) {
  return page.locator('tr.k-master-row', { hasText: uniqueText }).first();
}

/** True if a row with `uniqueText` exists — used to assert create succeeded / skip-if-exists.
 *  Polls for a few seconds because the Kendo grid loads/filters asynchronously (and more slowly
 *  under concurrent load), so a single fixed wait can miss a row that is about to render. */
export async function rowExists(page, searchLocator, uniqueText) {
  // These grids are SEARCH-TO-LOAD: the profile list renders 0 rows until a search term is applied
  // (verified live: "0 - 0 of 0 items" on load). So we MUST wait for the search box to render and
  // then apply the filter — an early `if (visible)` check would skip the fill on a slow reload and
  // leave the grid empty, falsely concluding the row is absent. Poll for backend indexing lag.
  await searchLocator.waitFor({ state: 'visible', timeout: 30000 }).catch(() => {});
  await searchLocator.fill(uniqueText);
  await searchLocator.press('Enter').catch(() => {});
  for (let i = 0; i < 15; i++) {
    if ((await page.locator('tr.k-master-row', { hasText: uniqueText }).count()) > 0) return true;
    await page.waitForTimeout(1000);
  }
  return false;
}

/**
 * Delete a row via its kebab/grid-action menu (cookbook: a[data-cy='grid-action']) then confirm
 * (cookbook global: #confirm-yes). Best-effort — used in cleanup so it swallows its own errors.
 */
export async function deleteRow(page, uniqueText) {
  try {
    const row = listRow(page, uniqueText);
    await row.locator("a[data-cy='grid-action']").click({ timeout: 10000 });
    await page.getByText('Delete', { exact: false }).first().click({ timeout: 10000 });
    await page.locator('#confirm-yes').click({ timeout: 10000 });
    await page.waitForTimeout(1000);
  } catch { /* cleanup must never fail the test */ }
}
