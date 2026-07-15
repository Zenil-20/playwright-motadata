/*
 * Copyright (c) 2026 Motadata. All Rights Reserved.
 *
 * Trap Explorer (Trap Viewer) helpers — the VERIFY surface for propagation tests.
 *
 * Locators are the ones harvested live with real data on 172.16.15.68 (cookbook §14): the grid is
 * a Kendo grid (.k-grid / tr.k-master-row) with columns
 *   [ TRAP NAME, TRAP OID, SOURCE, COUNT, MESSAGE, TIMESTAMP, ACKNOWLEDGED, ACTION ].
 *
 * THE 5-MINUTE REALITY: a trap is cached on arrival but only written to the datastore (and thus
 * shown here) on a fixed ~5-minute flush — it is architectural and CANNOT be shortened (see memory
 * project_trap_flow). We therefore do NOT blind-sleep; we POLL the grid until the trap's OID row
 * appears, with a ceiling comfortably past 5 minutes. Polling before the flush simply finds nothing
 * and retries — no wasted assertion, no flake.
 *
 * Author  : Zenil Kapadia
 * Created : 7 July 2026
 */

import { expect } from '@playwright/test';
import { AIOPS_URL } from './trap-fixtures.js';

// Kendo grid column order on Trap Explorer (verified 2026-07-07). Index = <td> position.
const COL = { NAME: 0, OID: 1, SOURCE: 2, COUNT: 3, MESSAGE: 4, TIMESTAMP: 5, ACK: 6, ACTION: 7 };

/** Navigate to Trap Explorer via the left-nav module icon (fallback: the route). */
export async function openTrapExplorer(page) {
  // li#trap-viewer is the left-sidebar Trap Explorer icon (harvested, count 1).
  const nav = page.locator("li[id='trap-viewer']");
  if (await nav.isVisible().catch(() => false)) await nav.click().catch(() => {});
  else await page.goto(`${AIOPS_URL}/trap-explorer`).catch(() => {});
  // IMPORTANT: on a server with no traps yet, this screen renders NO grid at all (verified live) —
  // so we do NOT hard-wait for .k-grid here (that would fail every poll before the 5-min flush).
  // Just let the SPA settle; waitForTrapByOid counts rows and retries until they appear.
  await page.waitForTimeout(2500);
}

/** Type a term into the grid's OWN search box to filter rows (no-op if the box isn't rendered yet). */
export async function searchTrap(page, term) {
  const search = page.locator("input[name='search']").first();
  if (!(await search.isVisible().catch(() => false))) return; // grid/search absent (empty screen)
  await search.fill('');
  await search.fill(term);
  await page.waitForTimeout(1500); // grid re-queries client-side on input
}

/** A single trap row matched by its OID appearing anywhere in the row (TRAP OID column). */
export function rowByOid(page, oid) {
  return page.locator('tr.k-master-row', { hasText: oid }).first();
}

/** Read the visible cells of a row into a labelled object (for assertions on name/source/message). */
export async function readRow(row) {
  const tds = row.locator('td');
  const cell = async (i) => (await tds.nth(i).innerText().catch(() => '')).trim().replace(/\s+/g, ' ');
  return {
    name: await cell(COL.NAME),
    oid: await cell(COL.OID),
    source: await cell(COL.SOURCE),
    count: await cell(COL.COUNT),
    message: await cell(COL.MESSAGE),
    timestamp: await cell(COL.TIMESTAMP),
  };
}

/**
 * Wait for a trap with `oid` to surface in Trap Explorer, absorbing the fixed ~5-min flush.
 *
 * Implementation: poll every 45s up to `timeoutMs` (default 7 min). On each tick we re-open the
 * explorer, search the OID, and count matching rows. Returns the matched row's cells once present.
 *
 * NOTE ON DETERMINISM: all NetForge traps share SOURCE = 172.16.12.36, so the OID is our primary
 * discriminator. Pass distinct OIDs per fixture (TRAP_BATCH does) and run propagation tests
 * serially so two in-flight traps of the same OID can't be confused.
 *
 * @returns {Promise<object>} the matched row cells (throws via expect if it never arrives)
 */
export async function waitForTrapByOid(page, oid, { timeoutMs = 10 * 60 * 1000 } = {}) {
  await expect
    .poll(async () => {
      // Re-open Trap Explorer each tick and count rows whose text contains the OID. We do NOT use the
      // grid search box here: it was observed to filter the just-flushed rows OUT (the OID column did
      // not match the typed query), whereas an unfiltered hasText(oid) match reliably finds them
      // (recent traps sort to the top / page 1). Wrapped so a pre-flush EMPTY screen counts as 0.
      try {
        await openTrapExplorer(page);
        return await page.locator('tr.k-master-row', { hasText: oid }).count();
      } catch {
        return 0;
      }
    }, {
      // Floor is ~5 min (datastore flush); ceiling gives generous headroom for scheduler jitter.
      timeout: timeoutMs,
      intervals: [45000], // ~13 polls across 10 min; pre-flush polls simply find 0 rows
      message: `trap OID ${oid} never appeared in Trap Explorer within ${Math.round(timeoutMs / 60000)} min`,
    })
    .toBeGreaterThan(0);

  return readRow(rowByOid(page, oid));
}
