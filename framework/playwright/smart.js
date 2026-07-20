/*
 * Copyright (c) 2026 Motadata. All Rights Reserved.
 *
 * Smart action layer — makes automation DIAGNOSE why an action can't proceed instead of
 * blind-retrying one locator until timeout. Pairs with resolver.js (self-heal primary→
 * fallback). The point: when a click/find fails, report the REAL blocker — wrong screen,
 * empty grid, a modal/drawer/overlay covering the target, a spinner still loading, or a
 * visible error toast — so triage finds the cause, not "locator timed out".
 */
import { resolve } from './resolver.js';

/**
 * Inspect the live page in ONE DOM pass and return a human-readable blocker report.
 * @param {import('@playwright/test').Page} page
 * @param {string} [want] what we were trying to reach (for the message)
 */
export async function diagnose(page, want) {
  let sig = {};
  try {
    sig = await page.evaluate(() => {
      const vis = (el) => !!(el && (el.offsetWidth || el.offsetHeight || el.getClientRects().length));
      const txt = (sel) => { const e = document.querySelector(sel); return e ? (e.textContent || '').trim().slice(0, 140) : null; };
      const cnt = (sel) => document.querySelectorAll(sel).length;
      return {
        route: location.hash || location.pathname,
        modalOpen: [...document.querySelectorAll('.ant-modal')].some(vis),
        drawerOpen: cnt('.ant-drawer-open') > 0,
        popoverOpen: [...document.querySelectorAll('.ant-popover, .ant-dropdown')].some(
          (e) => vis(e) && !e.classList.contains('ant-popover-hidden') && !e.classList.contains('ant-dropdown-hidden')),
        spinning: cnt('.ant-spin-spinning') > 0,
        noRecords: /no records available|no data found/i.test(document.body.innerText || ''),
        errorToast: txt('.ant-notification-notice-error, .ant-message-error'),
        fieldError: txt('.ant-form-item-explain-error'),
        maskOpen: [...document.querySelectorAll('.ant-modal-mask, .ant-drawer-mask')].some(vis),
      };
    });
  } catch { /* page navigating/closed — fall through */ }

  const reasons = [];
  if (sig.errorToast) reasons.push(`app error toast: "${sig.errorToast}"`);
  if (sig.fieldError) reasons.push(`form validation error: "${sig.fieldError}"`);
  if (sig.noRecords) reasons.push('grid shows "No records available" (target row not present — check discovery/precondition)');
  if (sig.spinning) reasons.push('a loading spinner is still active (data not settled)');
  if (sig.modalOpen) reasons.push('a modal is open (may be covering the target)');
  if (sig.drawerOpen) reasons.push('a drawer is open (may be covering the target)');
  if (sig.popoverOpen) reasons.push('a popover/dropdown is open');
  if (sig.maskOpen) reasons.push('an overlay mask is intercepting clicks');
  if (sig.route) reasons.push(`current screen: ${sig.route}`);

  const head = want ? `Could not ${want}. ` : 'Action blocked. ';
  return head + (reasons.length ? 'Likely cause → ' + reasons.join('; ') : 'no obvious blocker detected (locator may be wrong for this build).');
}

/**
 * Self-healing + diagnostic click. Resolves primary→fallback, waits for the element to be
 * actionable, clicks; on failure throws an error enriched with a live DOM diagnosis.
 * @param {import('@playwright/test').Page} page
 * @param {{primary:string|Function, fallback?:string|Function, name?:string}} spec
 * @param {{ want?:string, timeout?:number }} [opts]
 */
export async function smartClick(page, spec, opts = {}) {
  const { want = spec.name || 'click element', timeout = 90000 } = opts;
  const loc = await resolve(page, spec);
  try {
    await loc.first().click({ timeout });
  } catch (e) {
    throw new Error(await diagnose(page, want) + `\n(underlying: ${e.message.split('\n')[0]})`);
  }
}

/**
 * Self-healing + diagnostic "wait for element". Use before acting on a row/control that
 * depends on async data (e.g. a device appearing in NCCM Explorer after discovery).
 * @returns the resolved Locator (visible) or throws with a diagnosis.
 */
export async function smartWaitVisible(page, spec, opts = {}) {
  const { want = spec.name || 'find element', timeout = 90000 } = opts;
  const loc = await resolve(page, spec);
  try {
    await loc.first().waitFor({ state: 'visible', timeout });
    return loc.first();
  } catch (e) {
    throw new Error(await diagnose(page, want) + `\n(underlying: ${e.message.split('\n')[0]})`);
  }
}

/**
 * Guard: ensure the app is on an expected screen before acting; if a route hint is given
 * and the current route doesn't include it, run the provided navigation thunk once.
 * @param {import('@playwright/test').Page} page
 * @param {string} routeHint substring expected in location.hash/pathname
 * @param {() => Promise<void>} navigate thunk to reach the screen
 */
export async function ensureScreen(page, routeHint, navigate) {
  const here = await page.evaluate(() => location.hash || location.pathname).catch(() => '');
  if (routeHint && !here.toLowerCase().includes(routeHint.toLowerCase())) {
    await navigate();
  }
}
