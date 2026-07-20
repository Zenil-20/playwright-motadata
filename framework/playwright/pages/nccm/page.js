/*
 * Copyright (c) 2026 Motadata. All Rights Reserved.
 *
 * NccmPage — Page Object wrapping the verified NCCM flows.
 *
 * Ported observeops-qa style: no literal selectors here — every locator is imported
 * from ./locators.js (LOC). Step sequences are lifted from the three working specs
 * (DeviceNccmDiscovery, PerformNccmActions, nccmtest) and, for areas those specs do
 * not cover, from the Endtest step structure (best-effort; see TODO(cookbook) markers
 * in locators.js).
 *
 * Wait policy: smart waits only (expect(...).toBeVisible / toHaveText / toHaveCount /
 * toBeHidden). No networkidle, no blind waitForTimeout. AntDesign duplicates are scoped
 * to .ant-drawer-open / .ant-popover:visible / tr.k-master-row.
 */

import { expect } from '@playwright/test';
import { LOC } from './locators.js';
import { diagnose, smartWaitVisible } from '../../smart.js';

export class NccmPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
  }

  // ── helpers ──────────────────────────────────────────────────────────────
  /** The single visible drawer (AntDesign dup-scoping). */
  drawer() {
    return this.page.locator(LOC.grid.openDrawer).last();
  }

  /** The single visible modal. */
  modal() {
    return this.page.locator(LOC.grid.visibleModal + ', ' + LOC.grid.openDrawer).last();
  }

  /** A grid row scoped by unique text (usually an IP). count()===1 gate on visibility. */
  row(hasText) {
    return this.page.locator(LOC.grid.masterRow, { hasText }).first();
  }

  /** The visible AntDesign popover/dropdown. */
  popover() {
    return this.page.locator(LOC.grid.visiblePopover).last();
  }

  // ── auth ─────────────────────────────────────────────────────────────────
  async login(url = process.env.Motadata_Aiops, user = process.env.Motadata_Username, pass = process.env.Motadata_Password) {
    await this.page.goto(url, { timeout: 90000, waitUntil: 'domcontentloaded' });
    // Username: prefer name='username', fall back to the placeholder variant.
    let u = this.page.locator(LOC.login.username);
    if (!(await u.count())) u = this.page.locator(LOC.login.usernameAlt);
    await u.first().waitFor({ state: 'visible', timeout: 60000 });
    await u.first().fill(user);
    // Password: same fallback.
    let p = this.page.locator(LOC.login.password);
    if (!(await p.count())) p = this.page.locator(LOC.login.passwordAlt);
    await p.first().fill(pass);
    // Submit: prefer the "Sign in" button, fall back to type=submit.
    const signIn = this.page.getByRole('button', { name: LOC.login.signInButtonName }).first();
    if (await signIn.count()) await signIn.click();
    else await this.page.locator(LOC.login.submit).click();
    // Success = we left the /login route (avatar marker doesn't always render).
    await this.page.waitForFunction(() => !location.pathname.includes('/login'), null, { timeout: 90000 })
      .catch(() => {});
    await this.page.waitForTimeout(2500); // let the SPA mount (never network-idles)
  }

  async logout() {
    await this.page.locator(LOC.logout.avatar).first().click();
    // Confirm the dropdown opened (My Profile link), then click the red Logout link.
    await expect(this.page.locator(LOC.logout.myProfileHref)).toBeVisible({ timeout: 10000 });
    await this.page.getByText(LOC.logout.menuItemText, { exact: true }).click();
    await this.page.context().clearCookies();
    await this.page.context().clearPermissions();
  }

  // ── navigation ─────────────────────────────────────────────────────────────
  async openSettingsSearch(term) {
    await this.page.locator(LOC.nav.settingsLink).click();
    await this.page.locator(LOC.nav.settingsSearchFocus).click();     // REQUIRED focus
    await this.page.locator(LOC.nav.settingsSearch).fill(term);
  }

  async openNccmExplorer() {
    await this.page.getByRole('link', { name: LOC.nav.nccmLinkName }).click();
    await this.page.getByRole('tab', { name: LOC.nav.explorerTabName }).click();
  }

  async openNccmOverview() {
    await this.page.getByRole('link', { name: LOC.nav.nccmLinkName }).click();
    await this.page.getByRole('tab', { name: LOC.nav.overviewTabName }).click();
  }

  // ── Discovery ───────────────────────────────────────────────────────────
  async openDiscoveryWizard() {
    await this.openSettingsSearch('discovery profile');
    await this.page.locator(LOC.discovery.profileLink).click();
    await this.page.getByRole('button', { name: LOC.discovery.createBtnName }).click();
    await this.page.getByText(LOC.discovery.typeNetworkText, { exact: true }).click();
  }

  /** Tick the pre-existing "default snmp" credential inside the picker popover. */
  async pickDefaultSnmp() {
    await this.page.locator(LOC.discovery.credentialPicker).click();
    const pop = this.popover();
    const snmpRow = pop
      .locator('li, div[role="option"], tr', { hasText: LOC.discovery.defaultSnmpRowText })
      .first();
    await expect(snmpRow).toBeVisible({ timeout: 60000 });
    await snmpRow.locator('input[type="checkbox"]').first().check();
    // Dismiss the popover so it doesn't overlay Save & Run.
    await this.page.locator(LOC.discovery.profileName).click();
  }

  /** Enable the "Network Config Management" toggle (idempotent via aria-checked). */
  async enableNccmToggle() {
    const toggle = this.page.locator(LOC.discovery.nccmToggle).first();
    await expect(toggle).toBeVisible();
    if ((await toggle.getAttribute('aria-checked')) !== 'true') {
      await toggle.click();
    }
    await expect(toggle).toHaveAttribute('aria-checked', 'true');
  }

  /**
   * Full discover+provision of one device.
   * @param {{ profileName:string, ip:string, ncm?:boolean, credential?:object }} row
   */
  async discoverDevice(row) {
    await this.openDiscoveryWizard();
    await this.page.locator(LOC.discovery.profileName).fill(row.profileName);
    await this.page.locator(LOC.discovery.ipAddress).fill(row.ip);
    if (row.ncm) await this.enableNccmToggle();
    await this.pickDefaultSnmp();
    if (row.credential) await this.createCredential(row.credential);
    await this.page.locator(LOC.discovery.saveAndRun).click();

    await expect(this.page.getByText(row.ip, { exact: true }).first()).toBeVisible({ timeout: 90000 });
    const discovered = this.row(row.ip);
    await discovered.locator('input[type="checkbox"]').first().check();
    await this.page.locator(LOC.discovery.addSelected).click();
    await expect(this.page.getByText(LOC.discovery.provisionedToastText).first()).toBeVisible({ timeout: 90000 });
    await this.page.locator(LOC.discovery.closeResultsX).click();
  }

  /**
   * Create a new SSH (optionally SSH/TFTP) credential from the discovery picker "+".
   * @param {{ name:string, protocol?:string, user:string, pass:string, enablePass?:string,
   *           enablePrompt?:string, transferProtocol?:string, testIp:string }} cfg
   */
  async createCredential(cfg) {
    await this.page.locator(LOC.discovery.createCredentialPlus).click();
    await this.page.locator(LOC.credential.name).fill(cfg.name);

    // Change protocol SNMP V1/V2c → SSH.
    await this.page.locator(LOC.credential.protocolChangeFromSnmp).click();
    await this.page.locator(LOC.credential.protocolSshOption).click();

    const d = this.drawer();
    await d.locator(LOC.credential.usernameSsh).first().fill(cfg.user);
    await d.locator(LOC.credential.passwordSsh).first().fill(cfg.pass);

    // Config Transfer Protocol must be set explicitly — TFTP OR "No Protocol". Skipping it
    // (as happens when cfg.transferProtocol is undefined) leaves the form invalid and the
    // Test panel never opens (hostname-ip times out). Verified vs DeviceNccmDiscovery.spec.js.
    // Both TFTP and 'No Protocol' live in the SAME "Config Transfer Protocol" dropdown
    // (label-scoped — NOT #protocol, which is the main Protocol field on this build).
    if (cfg.transferProtocol) {
      await d.locator(LOC.credential.configTransferProtocol).first().click();
      const opt = /tftp/i.test(cfg.transferProtocol)
        ? LOC.credential.configTransferTftp
        : LOC.credential.protocolNoProtocolOption;
      await this.page.locator(opt).first().click();
    }
    if (cfg.enablePass) {
      await d.locator(LOC.credential.enablePassword).first().fill(cfg.enablePass);
    }
    if (cfg.enablePrompt) {
      await d.locator(LOC.credential.enablePrompt).first().fill(cfg.enablePrompt);
    }

    // Test against device.
    await this.page.locator(LOC.credential.testBtn).click();
    await this.page.locator(LOC.credential.hostnameIp).fill(cfg.testIp);
    await this.page.locator(LOC.credential.runTestBtn).click();
    await expect(this.page.locator(LOC.credential.testResultMsg)).toHaveText('Successful', { timeout: 90000 });
    await this.page.locator(LOC.credential.closeBtn).click();
    await this.page.locator(LOC.credential.createProfileBtn).click();
  }

  // ── Device Inventory: NCM manage + change credential ──────────────────────
  /**
   * From Device Inventory, turn on NCM management and attach a fresh TFTP credential.
   * Mirrors DeviceNccmDiscovery "change the credentials attached from device inventory".
   * @param {{ ip:string, credName:string, user:string, pass:string }} row
   */
  async changeCredentialFromInventory(row) {
    await this.page.locator(LOC.nav.settingsSearch).first().fill('device inventory');
    await this.page.getByRole('link', { name: LOC.deviceInventory.inventoryLinkName }).click();
    await this.page.locator(LOC.deviceInventory.search).first().fill(row.ip);

    const ipCells = this.page.locator(LOC.deviceInventory.ipCell, { hasText: row.ip });
    await expect(ipCells).toHaveCount(1);

    const deviceRow = this.page.getByRole('row', { name: row.ip });
    const toggle = deviceRow.getByRole(LOC.deviceInventory.manageSwitchRole);
    if ((await toggle.textContent())?.trim() === 'OFF') {
      await toggle.click();
      await deviceRow.getByRole('button', { name: LOC.deviceInventory.addCredentialBtnName }).click();
      await this.page.getByRole('button', { name: LOC.deviceInventory.createCredentialProfileBtnName }).click();

      await this.page.locator(LOC.credential.nameMustBeUnique).fill(row.credName);
      await this.page.locator(LOC.credential.usernameGeneric).first().fill(row.user);
      await this.page.locator(LOC.credential.passwordSsh).first().fill(row.pass);

      // Config transfer protocol + enable password/prompt live in positional cells in
      // the source spec — kept as best-effort. TODO(cookbook): re-scope by label.
      await this.page.locator(LOC.credential.testBtn).click();
      await this.page.locator(LOC.credential.hostnameIp).fill(row.ip);
      await this.page.locator(LOC.credential.runTestBtn).click();
      await expect(this.page.locator(LOC.credential.testSuccessIcon)).toBeVisible({ timeout: 90000 });
      await this.page.locator(LOC.credential.closeBtn).click();
      await this.page.getByRole('button', { name: LOC.deviceInventory.createCredentialsProfileBtnName }).click();
      await this.page.getByRole('button', { name: LOC.discovery.runDiscoveryBtnName }).click();

      const successStatus = this.page.locator('td', { hasText: LOC.deviceInventory.successStatusCellText });
      await expect(successStatus).toContainText('Successful', { timeout: 90000 });
    }
    await expect(toggle).toContainText('ON');
  }

  /**
   * Open NCCM Explorer, search an IP, and wait for its row to appear. NCCM Explorer
   * populates ASYNC after discovery (device shows once its first NCM backup registers),
   * so this tolerates that delay and fails with a clear reason if the grid stays empty.
   * @param {string} ip @param {number} timeout
   */
  async openExplorerRow(ip, timeout = 90000) {
    await this.openNccmExplorer();
    await this.page.locator(LOC.explorer.search).first().fill(ip);
    const row = this.row(ip);
    try {
      await expect(row).toBeVisible({ timeout });
    } catch {
      // SMART: report the real blocker (empty grid vs wrong screen vs spinner) — not a
      // bare timeout. diagnose() reads the live DOM to say WHY the row isn't here.
      throw new Error(await diagnose(this.page, `find device ${ip} in NCCM Explorer`));
    }
    return row;
  }

  /**
   * Click a row's action-menu item with diagnosis. If the row/menu isn't reachable, the
   * error explains why (grid empty, menu didn't open, overlay covering it) — not a timeout.
   * @param {string} ip @param {string} itemSpec locator string for the menu item
   * @param {string} want human label for the item
   */
  async rowAction(ip, itemSpec, want) {
    const row = await this.openExplorerRow(ip);
    await row.locator(LOC.explorer.rowActionMenu).click();
    await smartWaitVisible(this.page, { primary: itemSpec, name: want }, { want: `open "${want}"` });
    await this.page.locator(itemSpec).first().click();
  }

  // ── Baseline ──────────────────────────────────────────────────────────────
  async setBaseline(ip) {
    const row = await this.openExplorerRow(ip);
    await row.locator(LOC.explorer.rowActionMenu).click();
    await this.page.locator(LOC.baseline.setAction).click();
  }

  // ── Backup ──────────────────────────────────────────────────────────────
  async backupNow(ip) {
    const row = this.row(ip);
    await row.locator(LOC.explorer.rowActionMenu).click();
    await this.page.locator(LOC.explorer.actionBackupMenuitem).click();
    await expect(
      this.page.locator(LOC.explorer.notificationMessage, { hasText: LOC.explorer.backupQueuedToast }).first()
    ).toBeVisible({ timeout: 30000 });
  }

  /** Backup via the row action menu's a#backup item (post-conflict re-backup). */
  async backupViaAction(ip) {
    const row = this.row(ip);
    await row.locator(LOC.explorer.rowActionMenu).click();
    await this.page.locator(LOC.explorer.actionBackup).click();
    await expect(
      this.page.locator(LOC.explorer.notificationMessage, { hasText: LOC.explorer.backupQueuedToast }).first()
    ).toBeVisible({ timeout: 30000 });
  }

  // ── Sync ──────────────────────────────────────────────────────────────────
  async syncConfig(ip) {
    const row = this.row(ip);
    await row.locator(LOC.explorer.rowActionMenu).click();
    await this.page.locator(LOC.sync.action).click();
    await expect(
      this.page.locator(LOC.explorer.notificationMessage, { hasText: LOC.sync.queuedToast }).first()
    ).toBeVisible({ timeout: 30000 });
  }

  // ── Restore ────────────────────────────────────────────────────────────── [endtest]
  /**
   * Restore a running/startup config version.
   * @param {string} ip @param {string} version e.g. '1.0' @param {'running'|'startup'} type
   */
  async restoreConfig(ip, version, type = 'running') {
    const row = this.row(ip);
    await row.locator(LOC.explorer.rowActionMenu).click();
    await this.page.locator(LOC.restore.actionText).click();
    const m = this.modal();
    // Running/Startup radios use value, not label [chrome-harvest].
    const radio = type === 'startup' ? LOC.restore.startupRadio : LOC.restore.runningRadio;
    if (await m.locator(radio).count()) await m.locator(radio).first().check({ force: true });
    await m.locator(LOC.restore.versionSelect).first().click();
    await this.page.locator(LOC.restore.versionOptionByTitle(version)).first().click();
    await m.locator(LOC.restore.restoreConfirmBtn).first().click();
    if (await this.page.locator(LOC.restore.confirmYes).count()) {
      await this.page.locator(LOC.restore.confirmYes).click();
    }
  }

  /** Bulk Backup Now on 2+ devices via the Explorer multi-select toolbar. [chrome-harvest] */
  async bulkBackup(ipList) {
    await this.openNccmExplorer();
    for (const ip of ipList) {
      const row = this.row(ip);
      await expect(row).toBeVisible({ timeout: 30000 });
      await row.locator('input[type="checkbox"]').first().check();
    }
    await this.page.locator(LOC.explorer.bulkBackupBtn).click();
    await expect(
      this.page.locator(LOC.explorer.notificationMessage, { hasText: LOC.explorer.backupQueuedToast }).first()
    ).toBeVisible({ timeout: 60000 });
  }

  /** Remove the baseline from a device that currently has one. [chrome-harvest] */
  async removeBaseline(ip) {
    const row = this.row(ip);
    await row.locator(LOC.explorer.rowActionMenu).click();
    await this.page.locator(LOC.explorer.actionRemoveBaseline).click();
    if (await this.page.locator(LOC.confirm.yes).count()) {
      await this.page.locator(LOC.confirm.yes).click();
    }
  }

  // ── Compare ────────────────────────────────────────────────────────────────
  /** Open the Compare modal, set left panel to Startup @ version, return the modal. */
  async compareConfig(ip, version = '2.0') {
    const row = this.row(ip);
    await row.locator(LOC.explorer.rowActionMenu).click();
    await this.page.locator(LOC.compare.action).click();
    const m = this.page.locator(LOC.grid.visibleModal + ', ' + LOC.grid.openDrawer).last();
    await expect(m).toBeVisible({ timeout: 15000 });
    await m.locator(LOC.compare.leftStartupRadio).first().check({ force: true });
    await m.locator(LOC.compare.versionDropdown).first().click();
    await this.page.locator(LOC.compare.versionOptionByTitle(version)).first().click();
    return m;
  }

  // ── Runbook ─────────────────────────────────────────────────────────────
  async openRunbookSettings() {
    await this.openSettingsSearch('runbook');
    await this.page.getByRole('link', { name: LOC.runbook.runbookLinkName, exact: true }).click();
  }

  /**
   * Assign a monitor (device IP) to a runbook and confirm.
   * @param {string} runbookName @param {string} ip
   */
  async assignRunbook(runbookName, ip) {
    await this.openRunbookSettings();
    await this.page.locator(LOC.runbook.gridSearch).fill(runbookName);
    const rbRow = this.page.locator(LOC.runbook.row, { hasText: runbookName }).first();
    await expect(rbRow).toBeVisible({ timeout: 30000 });
    await rbRow.locator(LOC.runbook.rowActionMenu).click();
    await this.page.locator(LOC.runbook.actionAssignMonitor).click();

    const d = this.drawer();
    await expect(d.getByRole('heading', { name: LOC.runbook.assignHeadingName })).toBeVisible({ timeout: 15000 });
    await d.locator(LOC.runbook.assignSearch).first().fill(ip);
    const mRow = d.locator(LOC.runbook.monitorRow, { hasText: ip }).first();
    await expect(mRow).toBeVisible({ timeout: 15000 });
    await mRow.locator('input[type="checkbox"]').first().check();
    await d.getByRole('button', { name: LOC.runbook.testBtnName }).click();
    await expect(mRow.locator('td', { hasText: LOC.runbook.testSuccessCellText })).toBeVisible({ timeout: 90000 });
    await d.getByRole('button', { name: LOC.runbook.assignBtnName }).click();
    await expect(d).toBeHidden({ timeout: 30000 });
    return rbRow;
  }

  /** Trigger a runbook via its row Run (play) button and wait for completion. */
  async runRunbook(runbookName) {
    const rbRow = this.page.locator(LOC.runbook.row, { hasText: runbookName }).first();
    await rbRow.locator(LOC.runbook.runPlayBtn).click();
    await expect(rbRow.locator(LOC.runbook.runSpinner)).toHaveCount(0, { timeout: 90000 });
    await expect(rbRow.locator(LOC.runbook.runIdleIcon)).toBeVisible({ timeout: 60000 });
  }

  /** Assign + run in one call (PerformNccmActions sequence). */
  async assignAndRunRunbook(runbookName, ip) {
    await this.assignRunbook(runbookName, ip);
    await this.runRunbook(runbookName);
  }

  // createRunbook / deleteRunbook / firmwareUpgrade / createStorageProfile / tagDevice /
  // createPolicy live below as best-effort ports (Endtest step structure). Locators that
  // could not be re-scoped from positional XPath are marked TODO(cookbook) in locators.js.

  /**
   * Create a runbook (SSH-script type). Locators [harvest 2026-07-13].
   * @param {{ name:string, description?:string, script:string,
   *           category?:string, port?:string, timeout?:string }} cfg
   */
  async createRunbook(cfg) {
    if (!cfg || !cfg.name || !cfg.script) {
      throw new Error('createRunbook: cfg.name and cfg.script are required');
    }
    await this.openRunbookSettings();
    await this.page.getByRole('button', { name: LOC.runbook.createBtnName }).click();
    const d = this.drawer();
    await expect(d.locator(LOC.runbook.name)).toBeVisible({ timeout: 20000 });
    await d.locator(LOC.runbook.name).fill(cfg.name);
    if (cfg.description) await d.locator(LOC.runbook.description).fill(cfg.description);
    if (cfg.category) {
      await d.locator(LOC.runbook.categorySelect).click();
      await this.page.locator(`//span[@title='${cfg.category}']`).first().click();
    }
    if (cfg.port) await d.locator(LOC.runbook.port).fill(cfg.port);
    if (cfg.timeout) await d.locator(LOC.runbook.timeout).fill(cfg.timeout);
    // SSH Script lives in a CodeMirror editor — set value through the CM API.
    await d.locator(LOC.runbook.scriptEditor).first().click();
    await this.page.evaluate((code) => {
      const cm = document.querySelector('.CodeMirror');
      if (cm && cm.CodeMirror) cm.CodeMirror.setValue(code);
    }, cfg.script);
    await d.getByRole('button', { name: LOC.runbook.createBtnName }).click();
    await expect(d).toBeHidden({ timeout: 30000 });
  }

  /**
   * @deprecated This build's runbook grid-action menu has NO Delete item [chrome-harvest
   * 2026-07-15] — only Assign Monitor, Remove Assigned Monitor, Clone Runbook, Schedule
   * Runbook. Runbooks cannot be deleted from the UI here.
   */
  async deleteRunbook() {
    throw new Error('deleteRunbook: no Delete action exists in the runbook grid menu (this build). Available: Assign/Remove Monitor, Clone, Schedule.');
  }

  // ── NCM Device Template clone/edit/apply ──────────────────── [chrome-harvest 2026-07-15]
  /** Open Settings > Device Template, clone the default Cisco template, set its name; return drawer. */
  async cloneCiscoTemplate(newName) {
    await this.openSettingsSearch('template');
    await this.page.getByRole('link', { name: /Device Template/i }).first().click();
    const T = LOC.deviceTemplate;
    const row = this.page.locator(T.grid, { hasText: /cisco/i }).first();
    await expect(row).toBeVisible({ timeout: 30000 });
    await row.locator(T.rowActionMenu).click();
    await this.page.locator(T.cloneActionItem).click();
    const d = this.drawer();
    await expect(d.locator(T.nameInput)).toBeVisible({ timeout: 20000 });
    await d.locator(T.nameInput).fill(newName); // fill clears the pre-filled clone name
    return d;
  }

  /**
   * Clone "backup failed": in the TFTP section change the Backup-Running-Configuration
   * primary command from `copy running-config tftp:` to `cpy running-config tftp:`, save.
   */
  async cloneTemplateBackupFailed(newName = 'backup failed') {
    const T = LOC.deviceTemplate;
    await this.cloneCiscoTemplate(newName);
    await this.page.locator(T.protocolTab('TFTP')).click();
    await this.page.locator(T.protocolAccordionHeader('TFTP')).first().click().catch(() => {});
    const card = this.page.locator(T.opCard('TFTP', 'Backup Running Configuration')).first();
    await expect(card).toBeVisible({ timeout: 15000 });
    await card.locator(T.opCommandCell).first().fill('cpy running-config tftp:');
    await this.page.locator(T.saveBtn).click();
  }

  /**
   * Clone "firmware pass": unselect all firmware-sequence options, select only
   * "Backup Existing Firmware Image", add command `terminal length 0` (prompt '#',
   * prompt-command 'No Command'), save.
   * NOTE: the firmware-sequence TRIGGER + the exact card for the added command are the
   * fuzziest parts of the harvest — dry-run and adjust opCard('...') if it misses.
   */
  async cloneTemplateFirmwarePass(newName = 'firmware pass') {
    const T = LOC.deviceTemplate;
    await this.cloneCiscoTemplate(newName);
    // Open the "Choose your Firmware Upgrade Sequence" multi-select (label-scoped trigger).
    const seqTrigger = this.page.locator(
      "//div[.//label[contains(.,'Firmware Upgrade Sequence')] or .//*[contains(text(),'Firmware Upgrade Sequence')]]//input[@data-cy='dropdown-trigger-input']"
    ).first();
    await seqTrigger.click();
    await this.page.locator(T.fwSequenceClearBtn).click();                 // unselect all
    await this.page.locator(T.fwSequenceOptionByLabel('Backup Existing Firmware Image')).check();
    await this.page.keyboard.press('Escape');
    // Add command `terminal length 0` with prompt '#' + prompt-command 'No Command' in its op card.
    const card = this.page.locator(T.opCard('TFTP', 'Backup Existing Firmware Image')).first();
    if (await card.count()) {
      await card.locator(T.opCommandCell).first().fill('terminal length 0');
      const triggers = card.locator(T.opDropdownTrigger);
      await triggers.nth(0).click();                                       // Prompt
      await this.page.locator(T.popoverOptionByText('#')).first().click();
      await triggers.nth(1).click();                                       // Prompt Command
      await this.page.locator(T.popoverOptionByText('No Command')).first().click();
    }
    await this.page.locator(T.saveBtn).click();
  }

  /**
   * Apply a template to a device via Settings > Network Config > Device Inventory >
   * row action > Update Template > tick the template > Re-run Discovery.
   */
  async applyTemplateToDevice(ip, templateName) {
    const T = LOC.deviceTemplate;
    await this.openSettingsSearch('device inventory');
    await this.page.getByRole('link', { name: /Device Inventory/i }).first().click();
    const search = this.page.locator(LOC.deviceInventory.search).first();
    await search.fill(ip);
    const row = this.page.locator('tr.k-master-row', { hasText: ip }).first();
    await expect(row).toBeVisible({ timeout: 30000 });
    await row.locator(LOC.explorer.rowActionMenu).click();
    await this.page.locator(T.inventoryUpdateTemplateItem).click();
    await this.page.locator(T.updateTemplateRowByName(templateName)).check();
    await this.page.locator(T.rerunDiscoveryBtn).click();
  }

  // ── Firmware Upgrade ──────────────────── [endtest + chrome-harvest 2026-07-15]
  /**
   * Run a firmware upgrade from the Explorer row action. If `binPath` is given (env
   * NCCM_FIRMWARE_BIN_PATH), the .bin is uploaded via the modal's file input first.
   * @param {{ ip:string, image:string, binPath?:string }} row
   */
  async firmwareUpgrade(row) {
    const r = this.row(row.ip);
    await r.locator(LOC.explorer.rowActionMenu).click();
    await this.page.locator(LOC.firmware.actionText).click();
    const modal = this.modal();
    // Upload the image if a path is provided and the modal exposes a file input.
    const binPath = row.binPath || process.env.NCCM_FIRMWARE_BIN_PATH;
    if (binPath) {
      const fileInput = modal.locator('input[type="file"]');
      if (await fileInput.count()) await fileInput.first().setInputFiles(binPath);
    }
    await modal.locator(LOC.firmware.imageSelect).first().click();
    await this.page.locator(LOC.firmware.imageOptionByName(row.image)).click();
    // Caller confirms the run; success surfaces via LOC.firmware.successText.
  }

  // ── Storage Profile ───────────────────────────────────────────────────── [endtest]
  /**
   * @param {{ name:string, protocol:'TFTP'|'SCP'|'FTP', host:string, port?:string,
   *           user?:string, password?:string, path?:string }} row
   * Field ids [harvest 2026-07-13]: #storage-profile-name #ip-host #port-id
   *           #user-name #password #path. SCP/FTP require user+password (+ optional path);
   *           TFTP does not render those fields.
   */
  async createStorageProfile(row) {
    await this.openSettingsSearch('storage');
    await this.page.locator(LOC.storageProfile.linkText).click();
    await this.page.locator(LOC.storageProfile.createBtn).click();
    await this.page.locator(LOC.storageProfile.name).fill(row.name);
    await this.page.locator(LOC.storageProfile.protocolSelect).first().click();
    await this.page.locator(LOC.storageProfile.protocolSearch).fill(row.protocol);
    await this.page.locator(LOC.storageProfile.protocolOptionByTitle(row.protocol)).click();
    await this.page.locator(LOC.storageProfile.ipHost).fill(row.host);
    if (row.port) {
      await this.page.locator(LOC.storageProfile.port).fill(row.port);
    }
    // Auth fields only render for SCP/FTP (not TFTP).
    if (row.user && await this.page.locator(LOC.storageProfile.userName).count()) {
      await this.page.locator(LOC.storageProfile.userName).fill(row.user);
    }
    if (row.password && await this.page.locator(LOC.storageProfile.password).count()) {
      await this.page.locator(LOC.storageProfile.password).fill(row.password);
    }
    if (row.path && await this.page.locator(LOC.storageProfile.path).count()) {
      await this.page.locator(LOC.storageProfile.path).fill(row.path);
    }
    await this.page.locator(LOC.storageProfile.testBtn).click();
    await expect(this.page.locator(LOC.storageProfile.testMessage))
      .toContainText('Storage Profile tested successfully', { timeout: 90000 });
    await this.page.locator(LOC.storageProfile.closeBtn).click();
  }

  // ── Tags ──────────────────────────────────────────────────────────────── [chrome-harvest]
  /**
   * Filter the Explorer grid by an existing tag chip via the Tag Inventory panel.
   * NOTE: this control is READ-ONLY — it filters by existing tags; it does NOT create
   * tags (tags are created at discovery time). Selecting a chip filters immediately.
   * @param {string} tagName an existing tag chip label (e.g. 'dynamic')
   */
  async filterByTag(tagName) {
    await this.openNccmExplorer();
    await this.page.locator(LOC.tags.tagInventoryBtn).click();
    const panel = this.page.locator(LOC.tags.tagPopover).first();
    await expect(panel).toBeVisible({ timeout: 15000 });
    await panel.locator(LOC.tags.tagSearch).fill(tagName);
    const chk = this.page.locator(LOC.tags.tagChipCheckboxByName(tagName)).first();
    await expect(chk).toBeVisible({ timeout: 15000 });
    await chk.check();
    // Selection filters the grid immediately (no Apply button).
  }

  /** @deprecated tag CREATION is not exposed on this screen — use discovery-time tagging. */
  async tagDevice() {
    throw new Error('tagDevice: tag creation is not available on #btn-tag-inventory (read-only filter). Tags are created in the discovery profile. Use filterByTag() to filter.');
  }

  // ── RBAC ──────────────────────────────────────────────────────────────── [chrome-harvest]
  /** Settings → User Settings → Role. */
  async openRoleSettings() {
    await this.openSettingsSearch('role');
    await this.page.locator(LOC.rbac.roleLinkText).click();
  }

  /** Settings → User Settings → User. */
  async openUserSettings() {
    await this.openSettingsSearch('user');
    await this.page.locator(LOC.rbac.userLinkText).click();
  }

  /**
   * Create an RBAC role with a permission level on a given module.
   * @param {{ name:string, description?:string, module?:string,
   *           permission?:'read'|'readwrite'|'delete'|'all' }} cfg  (module defaults 'NCCM')
   */
  async createRole(cfg) {
    if (!cfg || !cfg.name) throw new Error('createRole: cfg.name required');
    const moduleName = cfg.module || 'NCCM';
    const perm = cfg.permission || 'read';
    await this.openRoleSettings();
    await this.page.getByRole('button', { name: LOC.rbac.createRoleBtnName }).click();
    const d = this.drawer();
    await expect(d.locator(LOC.rbac.roleName)).toBeVisible({ timeout: 20000 });
    await d.locator(LOC.rbac.roleName).fill(cfg.name);
    if (cfg.description) await d.locator(LOC.rbac.roleDescription).fill(cfg.description);
    const box = this.page.locator(LOC.rbac.permCheckbox(moduleName, perm)).first();
    await expect(box).toBeVisible({ timeout: 15000 });
    await box.check();
    await d.getByRole('button', { name: LOC.rbac.createRoleBtnName }).click();
    await expect(d).toBeHidden({ timeout: 30000 });
  }

  /**
   * Create a user with Local Authentication, assigning a role and (optionally) groups.
   * The test-user password is read from cfg.password or NCCM_TEST_USER_PASSWORD (test data,
   * never a real credential). [chrome-harvest]
   * @param {{ firstName?:string, lastName?:string, email:string, userName?:string,
   *           role:string, groups?:string[], password?:string, submit?:boolean }} cfg
   */
  async createUser(cfg) {
    if (!cfg || !cfg.email || !cfg.role) throw new Error('createUser: cfg.email and cfg.role required');
    const pass = cfg.password || process.env.NCCM_TEST_USER_PASSWORD;
    await this.openUserSettings();
    await this.page.locator(LOC.rbac.createUserBtn).click();
    const d = this.drawer();
    await expect(d.locator(LOC.rbac.firstName)).toBeVisible({ timeout: 20000 });
    if (cfg.firstName) await d.locator(LOC.rbac.firstName).fill(cfg.firstName);
    if (cfg.lastName) await d.locator(LOC.rbac.lastName).fill(cfg.lastName);
    await d.locator(LOC.rbac.emailAddress).fill(cfg.email);
    // Ensure Local Authentication so password fields render.
    await d.locator(LOC.rbac.authTypeTrigger).click();
    if (await this.page.locator(LOC.rbac.authTypeLocalOption).count()) {
      await this.page.locator(LOC.rbac.authTypeLocalOption).click();
    }
    if (pass && await d.locator(LOC.rbac.password).count()) {
      await d.locator(LOC.rbac.password).fill(pass);
      await d.locator(LOC.rbac.confirmPassword).fill(pass);
    }
    // Groups (checkbox-tree overlay) — optional.
    for (const g of cfg.groups || []) {
      await d.locator(LOC.rbac.groupsTrigger).click();
      const pop = this.page.locator(LOC.rbac.groupsPopover).first();
      await expect(pop).toBeVisible({ timeout: 10000 });
      await this.page.locator(LOC.rbac.groupOptionByName(g)).first().click();
      await this.page.keyboard.press('Escape'); // close overlay before next control
    }
    // Role (simple single-select list).
    await d.locator(LOC.rbac.roleTrigger).click();
    await expect(this.page.locator(LOC.rbac.rolePopover).first()).toBeVisible({ timeout: 10000 });
    await this.page.locator(LOC.rbac.roleOptionByName(cfg.role)).first().click();
    // Submit only when explicitly asked AND a password was provided.
    if (cfg.submit && pass) {
      await d.getByRole('button', { name: /^\s*Create User\s*$/ }).click();
      await expect(d).toBeHidden({ timeout: 30000 });
    }
  }

  // ── Policy ────────────────────────────────────────────────────────────── [endtest]
  /** Navigate Settings → search → open the Network Config Policy settings screen. */
  async openPolicySettings() {
    await this.openSettingsSearch(LOC.policy.settingsSearch);
    const link = this.page.locator(LOC.policy.ncPolicyLink).first();
    await expect(link).toBeVisible({ timeout: 30000 });
    await link.click();
  }

  /**
   * Create a Network Config policy.
   * @param {{ name:string,
   *           conflictType:'FailedBackup'|'RunningConfigConflict',
   *           deviceIp:string,
   *           severity?:string,
   *           notify?:string }} cfg
   */
  async createPolicy(cfg) {
    const isRunning = /running/i.test(cfg.conflictType);

    await this.openPolicySettings();
    await this.page.locator(LOC.policy.createBtn).click();
    await this.page.locator(LOC.policy.nameInput).fill(cfg.name);

    // Conflict / evaluation-criteria select.
    await this.page.locator(LOC.policy.conflictSelect).click();
    if (isRunning) {
      await this.page.locator(LOC.policy.conflictOption('Config Conflict')).first().click();
      // Second (conflict-detection) select is present only for the running-conflict path.
      await this.page.locator(LOC.policy.secondSelect).first().click();
      await this.page.locator(LOC.policy.runningConflictOption).click();
    } else {
      await this.page.locator(LOC.policy.conflictOption('Failed Action')).first().click();
    }

    // Entity / source filter → Network Config Device.
    await this.page.locator(LOC.policy.entitySelect).click();
    await this.page.locator(LOC.policy.entityDeviceOption).click();

    // Assign-monitor picker: open, search the device IP, tick its row.
    await this.page.locator(LOC.policy.assignPicker).first().click();
    await this.page.locator(LOC.policy.assignSearch).fill(cfg.deviceIp);
    const rowCheckbox = this.page.locator(LOC.policy.assignRow(cfg.deviceIp)).first();
    await expect(rowCheckbox).toBeVisible({ timeout: 60000 });
    await rowCheckbox.check();

    // Severity.
    if (cfg.severity) {
      await this.page.locator(LOC.policy.severity(cfg.severity)).first().click();
    }

    // Notify (optional).
    if (cfg.notify) {
      await this.page.locator(LOC.policy.expandNotify).first().click();
      await this.page.locator(LOC.policy.notifyInput).fill(cfg.notify);
      await this.page.locator(LOC.policy.addRecipientBtn).first().click();
    }

    // Save.
    await this.page.locator(LOC.policy.saveBtn).first().click();
    await expect(this.page.locator(LOC.policy.policyRow(cfg.name)).first())
      .toBeVisible({ timeout: 60000 });
  }

  /**
   * Trigger assigned policies by running Backup Now on each device in the Explorer.
   * @param {string[]} ipList device IPs assigned to the policy
   */
  async triggerPolicy(ipList) {
    await this.page.locator(LOC.nav.nccmHref).click();
    await this.page.locator(LOC.nav.explorerTabDiv).click();

    for (const ip of ipList) {
      const search = this.page.locator(LOC.explorer.search).first();
      await search.fill(ip);
      const row = this.row(ip);
      await expect(row).toBeVisible({ timeout: 60000 });
      await row.locator(LOC.explorer.rowActionMenu).click();
      await this.page.locator(LOC.explorer.actionBackupMenuitem).click();
      await expect(
        this.page.locator(LOC.explorer.notificationMessage, { hasText: LOC.explorer.backupQueuedToast }).first()
      ).toBeVisible({ timeout: 60000 });
      await search.fill('');
    }
  }

  /**
   * Delete a policy by name and confirm; leaves the grid filtered on that name.
   * @param {string} name
   */
  async deletePolicy(name) {
    await this.openPolicySettings();
    await this.page.locator(LOC.grid.search).first().fill(name);
    const row = this.row(name);
    await expect(row).toBeVisible({ timeout: 30000 });
    await row.locator(LOC.explorer.rowActionMenu).click();
    await this.page.locator(LOC.policy.deleteAction).first().click();
    await this.page.locator(LOC.policy.deleteConfirm).click();
    await expect(this.page.locator(LOC.policy.noRecords).first())
      .toBeVisible({ timeout: 30000 });
  }

  // ── SSH Terminal ──────────────────────────────────────────────── [chrome-harvest]
  /**
   * Open the SSH terminal for a device via its Explorer ROW-ACTION menu (reliable — the
   * device-detail drawer's header Terminal button only closed the drawer in testing).
   * @param {string} ip device IP @param {string[]} commands
   */
  async openSshTerminal(ip, commands = []) {
    const row = this.row(ip);
    await row.locator(LOC.explorer.rowActionMenu).click();
    await this.page.locator(LOC.explorer.actionSshTerminal).click();
    const term = this.page.locator(LOC.sshTerminal.terminalInput);
    await expect(term).toBeVisible({ timeout: 30000 });
    for (const cmd of commands) {
      await term.fill(cmd);
      await term.press('Enter');
    }
  }

  // ── Approval (device-detail drawer → Approval tab) ────────────── [chrome-harvest]
  /**
   * Open a device's Approval tab and return the approvals grid locator.
   * Approve/Reject controls only exist for a PENDING request row.
   * @param {string} fqdn device-name link text
   */
  async openApprovalTab(fqdn) {
    await this.openNccmExplorer();
    await this.page.locator(LOC.explorer.deviceNameLink(fqdn)).click();
    const tab = this.page.locator(LOC.approval.detailApprovalTab);
    await expect(tab).toBeVisible({ timeout: 20000 });
    await tab.click();
    return this.page.locator(LOC.approval.grid).first();
  }

  // ── Reports ───────────────────────────────────────────────────── [chrome-harvest]
  /** Open Reports → NCCM, search a report by name. Returns the report link locator. */
  async openNccmReport(name) {
    await this.page.locator(LOC.reports.reportsLink).click();
    await this.page.locator(LOC.reports.nccmCategoryText).first().click();
    await this.page.locator(LOC.reports.search).fill(name);
    const link = this.page.locator(LOC.reports.reportByNameText(name)).first();
    await expect(link).toBeVisible({ timeout: 30000 });
    return link;
  }

  // ── Alerts ────────────────────────────────────────────────────── [chrome-harvest]
  /** Open Alerts → Network Config category. */
  async openNetworkConfigAlerts() {
    await this.page.locator(LOC.alerts.alertsLink).click();
    await this.page.locator(LOC.alerts.networkConfigTab).first().click();
  }
}

export default NccmPage;
