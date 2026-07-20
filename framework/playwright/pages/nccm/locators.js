/*
 * Copyright (c) 2026 Motadata. All Rights Reserved.
 *
 * NCCM Page-Object locators.
 *
 * Provenance legend (per control):
 *   [spec]      - copied verbatim from a working tests/regression/nccm/*.spec.js
 *   [cookbook]  - from knowledge/locators/selector-cookbook.md (verified, count()===1)
 *   [endtest]   - re-scoped from tests/_endtest/nccm-endtest-flows.json (parameter2 selector);
 *                 positional XPath was re-scoped to role/label/id/name. Where that was not
 *                 possible the entry is marked TODO(cookbook) and should be harvested live
 *                 via the motadata-explorer skill before being trusted.
 *   [harvest]   - captured LIVE against 172.16.15.156 by scripts/harvest-locators.mjs
 *                 (2026-07-13). Real id/name/data-cy read from the rendered DOM →
 *                 knowledge/locators/harvest/*.json. Highest-confidence provenance.
 *   [chrome-harvest] - captured LIVE via the Claude-in-Chrome extension (2026-07-15),
 *                 each verified count()===1. RBAC role/permission tree, user group/role
 *                 pickers, tag filter panel. NOTE: several Ant wrappers reuse the same
 *                 id on div+input (#role-name, #groups, #role-picker) → scope by tag
 *                 (input#role-name, div#groups, span#role-picker).
 *
 * Conventions (mirror the rest of the platform):
 *   - AntDesign duplicate scoping: '.ant-drawer-open', '.ant-popover:visible', 'tr.k-master-row'
 *   - Smart waits only (no networkidle / blind timeout) — enforced in page.js, not here.
 *   - count()===1 gate — enforced in page.js/validations.js helpers.
 */

export const LOC = {
  // ─────────────────────────────────────────────────────────────────────────
  // Global / cross-screen
  // ─────────────────────────────────────────────────────────────────────────
  login: {
    // [chrome-harvest 2026-07-15] login page: name='username'/'password' inputs,
    // placeholder 'Enter Username' / bullet-dots, "Sign in" (type=submit) button.
    // (placeholder 'Username' is the FORGOT-PASSWORD page, not login.)
    username: "input[name='username']",                      // [harvest]
    password: "input[name='password']",                      // [harvest]
    usernameAlt: "//input[@placeholder='Enter Username']",   // [chrome-harvest] fallback
    passwordAlt: "input[type='password']",                   // [chrome-harvest] fallback
    signInButtonName: /sign in|log ?in/i,                    // [harvest] getByRole('button')
    submit: "//button[@type='submit']",                      // [spec] fallback
    forgotPasswordText: 'Forgot password?',                  // [chrome-harvest]
    // Post-login marker = the profile avatar (AntD initials circle 'MA'), NOT img[alt=Avatar]:
    loggedInMarker: '.ant-avatar',                           // [chrome-harvest] smart wait; never networkidle
  },

  logout: {
    // Profile trigger = AntDesign avatar (initials 'MA'); dropdown has My Profile + Logout.
    avatar: '.ant-avatar',                                   // [chrome-harvest]
    myProfileHref: "a[href='/settings/my-account/my-profile']", // [chrome-harvest] confirms dropdown open
    menuItemText: 'Logout',                                  // [chrome-harvest] red link, bottom of dropdown
  },

  nav: {
    settingsLink: "//a[@href='/settings/']",                 // [spec]
    settingsSearchFocus: "//input[@id='phone-number']",      // [spec] REQUIRED focus before search
    settingsSearch: "//input[@placeholder='Search']",        // [spec]
    // Top-level sidebar module link. page.getByRole('link', { name: /NCCM/i })
    nccmLinkName: /NCCM/i,                                   // [spec]
    nccmHref: "//a[@href='/nccm/']",                         // [endtest] direct module root
    explorerTabName: 'Explorer',                             // [spec] getByRole('tab',{name})
    overviewTabName: 'Overview',                             // [spec]
    complianceTabName: 'Compliance',                         // [cookbook/doc]
    // Tab strip variant used by some endtest flows (div, not role=tab):
    explorerTabDiv: "//div[normalize-space()='Explorer']",   // [endtest] fallback
    overviewTabDiv: "//div[normalize-space()='Overview']",   // [endtest] fallback
  },

  confirm: {
    yes: '#confirm-yes',                                      // [cookbook/endtest]
    no: '#confirm-no',                                        // [cookbook]
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Validation / negative-test markers (AntDesign standard — high confidence).
  // NOTE: exact error TEXT/markers to be confirmed by the live recording; the
  // AntD structural classes below are stable across the app.
  // ─────────────────────────────────────────────────────────────────────────
  validation: {
    fieldError: '.ant-form-item-explain-error',              // field-level error text
    fieldHasError: '.ant-form-item-has-error',               // form-item error state
    toastError: '.ant-notification-notice-error, .ant-message-error', // duplicate/reject toast
    // A disabled primary submit (some forms block submit instead of showing a toast):
    disabledPrimaryBtn: 'button.ant-btn-primary[disabled], button.ant-btn-primary.ant-btn-disabled',
  },

  // Grid primitives reused across screens.
  grid: {
    search: "//input[@name='search']",                       // [spec] grid's OWN search
    masterRow: 'tr.k-master-row',                            // [spec] scope with { hasText: <IP> }
    rowActionMenu: "a[data-cy='grid-action']",               // [spec] per-row action trigger
    columnEyeButton: '#btn-show-hide-columns',               // [spec]
    columnSearchInPopover: "input[data-cy='dropdown-search-input']", // [spec] use .last()
    // "excluded-header-icon" is the endtest variant of the row/grid action opener:
    excludedHeaderIcon: "i[class='anticon excluded-header-icon']", // [endtest]
    visiblePopover: '.ant-popover:visible, .ant-dropdown:visible', // [spec]
    openDrawer: '.ant-drawer-open',                          // [spec] use .last()
    visibleModal: '.ant-modal:visible',                      // [spec] use .last()
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Discovery Profile (Settings > Network Discovery > Discovery Profile)
  // ─────────────────────────────────────────────────────────────────────────
  discovery: {
    profileLink:
      "//a[@href='/settings/network-discovery/network-discovery-profiles' and normalize-space()='Discovery Profile']", // [spec]
    createBtnName: 'Create Discovery Profile',               // [spec] getByRole('button',{name})
    createBtnId: '#create-network-discovery-profile-btn',    // [endtest] id variant
    typeNetworkText: 'Network',                              // [spec] getByText('Network',{exact:true})
    profileName: 'input[name="profile-name"]',               // [spec]
    profileNameId: "//input[@id='profile-id']",              // [endtest] id variant
    ipAddress: "//input[@id='ip-address-id']",               // [spec]
    ipRange: "input[type='text'][name='ip-range']",          // [endtest]
    // Network Config Management (NCM) toggle — gated by aria-checked:
    nccmToggle:
      "//label[normalize-space()='Network Config Management']/ancestor::div[contains(@class,'ant-form-item')]//button[@role='switch']", // [spec]
    credentialPicker: "//div[@id='credential-profile-picker-id']", // [spec]
    credentialPickerInput:
      "//div[@id='credential-profile-picker-id']//input[@placeholder='Select']", // [endtest]
    // Existing "default snmp" row inside the visible picker popover:
    defaultSnmpRowText: /default\s*snmp/i,                   // [spec]
    createCredentialPlus: "//button[@id='create-credential-btn-id']", // [spec]
    saveAndRun: '#save-run-btn-id',                          // [spec]
    addSelected: "//button[@id='add-selected-btn-id']",      // [spec]
    provisionedToastText: 'provisioned successfully',        // [spec]
    closeResultsX: 'svg[data-icon="times"]',                 // [spec]
    runDiscoveryBtnName: 'Run Discovery',                    // [spec] getByRole('button',{name})
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Create Credential Profile (drawer, opened from Discovery picker / + button)
  //   container_scope: LOC.grid.openDrawer (.last())
  // ─────────────────────────────────────────────────────────────────────────
  credential: {
    name: "//input[@id='credential-profile-name-id']",       // [spec]
    // "Must be unique" name field variant (device-inventory Add Credential flow):
    nameMustBeUnique: 'input[placeholder="Must be unique"]',  // [spec]
    protocolChangeFromSnmp: "//div[@title='SNMP V1/V2c']//input[@placeholder='Select']", // [spec]
    protocolSshOption: "//span[@title='SSH']",               // [spec]
    protocolSshText: "//span[text() = ' SSH ']",             // [endtest] text variant
    usernameSsh: "input[name='username']",                   // [spec] drawer-scoped, .first()
    usernameGeneric: 'input[type="text"][name="username"]',  // [spec] device-inventory variant
    passwordSsh: "input[type='password']",                   // [spec] drawer-scoped, .first()
    // Text-based (label may be a div/generic, not a <label> tag on this build).
    // NOTE: '#protocol' is the MAIN Protocol field, NOT this one — do not use it here.
    configTransferProtocol:
      "//div[contains(@class,'ant-form-item')][.//*[normalize-space(text())='Config Transfer Protocol']]//input[@placeholder='Select']", // [spec]
    configTransferTftp:
      "//li[@role='menuitem']//span[normalize-space()='TFTP'] | //span[@title='TFTP']", // [spec]
    enablePassword:
      "//label[normalize-space()='Enable Password']/ancestor::div[contains(@class,'ant-form-item')]//input", // [spec]
    enablePrompt:
      "//label[normalize-space()='Enable Prompt']/ancestor::div[contains(@class,'ant-form-item')]//input", // [spec]
    // Option renders as a menuitem on this build (like SSH/Telnet) — match title, menuitem, or text:
    protocolNoProtocolOption:
      "//span[@title='No Protocol'] | //li[@role='menuitem'][normalize-space()='No Protocol'] | //li[contains(@class,'ant-dropdown-menu-item')][normalize-space()='No Protocol']", // [spec]
    testBtn: "//button[@id='test-btn']",                     // [spec]
    hostnameIp: "input[name='hostname-ip']",                 // [spec]
    runTestBtn: "//button[@id='run-test-btn']",              // [spec]
    testResultMsg: '#message',                               // [spec] expect 'Successful'
    // Credential-test success icon (device-inventory Add Credential flow):
    testSuccessIcon: "//i[@class='anticon mr-1 text-secondary-green']//*[name()='svg']", // [spec]
    closeBtn: "//button[@id='close-btn-id']",                // [spec]
    createProfileBtn: "//button[@id='create-credential-profile-btn-id']", // [spec]
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Device Inventory (Settings > ... > Device Inventory) — NCM manage toggle
  // ─────────────────────────────────────────────────────────────────────────
  deviceInventory: {
    inventoryLinkName: 'Device Inventory',                   // [spec] getByRole('link',{name})
    search: "//input[@name='search']",                       // [spec] (also //input[@placeholder='Search'])
    ipCell: 'td',                                            // [spec] scope with { hasText: <IP> }
    // Row-scoped NCM manage switch (textContent 'ON'/'OFF'):
    manageSwitchRole: 'switch',                              // [spec] deviceRow.getByRole('switch')
    addCredentialBtnName: 'Add Credential',                  // [spec] getByRole('button',{name})
    createCredentialProfileBtnName: 'Create Credential Profile',  // [spec]
    createCredentialsProfileBtnName: 'Create Credentials Profile', // [spec] (submit; note plural)
    successStatusCellText: 'Successful',                     // [spec] td hasText:'Successful'
  },

  // ─────────────────────────────────────────────────────────────────────────
  // NCCM Explorer grid (NCCM > Explorer tab)  route /nccm/explorer
  // ─────────────────────────────────────────────────────────────────────────
  explorer: {
    search: "//input[@name='search']",                       // [spec]
    deviceGridcellName: null,                               // use page.getByRole('gridcell',{name:<IP>})  [spec]
    row: 'tr.k-master-row',                                  // [spec] { hasText: <IP> }
    rowActionMenu: "a[data-cy='grid-action']",              // [spec]
    // Row action-menu items:
    actionSetBaseline: "//span[normalize-space()='Set as Baseline']",   // [spec]
    actionBackupMenuitem: "//span[normalize-space()='Backup Now']",     // [spec]
    actionSync: 'a#sync',                                    // [spec]
    actionBackup: 'a#backup',                                // [spec]
    actionCompare: 'a#compare',                              // [spec]
    actionRestoreText: "//span[normalize-space()='Restore']",           // [endtest]
    actionFirmwareUpgradeText: "//span[text() = ' Firmware Upgrade ']", // [endtest]
    // Explorer toolbar buttons (from explorer.md catalog):
    compareBtn: '#compare-btn',                              // [doc]
    tagInventoryBtn: '#btn-tag-inventory',                   // [doc]
    columnEyeButton: '#btn-show-hide-columns',               // [spec]
    // Bulk-action bar — appears when 2+ row checkboxes are ticked [chrome-harvest]:
    bulkBackupBtn: '#bulk-action-bulk_backup',               // [chrome-harvest]
    // Row-action menu items confirmed live (menu opens on a[data-cy='grid-action']):
    //   Backup Now, Compare, Download Backup, Set as Baseline/Remove Baseline, SSH Terminal,
    //   View, Sync, Restore, Execute Runbook, Get Hardware Details, Firmware Upgrade.
    actionRemoveBaseline:                                    // [chrome-harvest] (row has a baseline)
      "//div[contains(@class,'ant-popover') and not(contains(@class,'ant-popover-hidden'))]//li[contains(@class,'ant-dropdown-menu-item') and contains(.,'Remove Baseline')]",
    actionSshTerminal:                                       // [chrome-harvest] reliable terminal opener
      "//div[contains(@class,'ant-popover') and not(contains(@class,'ant-popover-hidden'))]//li[contains(@class,'ant-dropdown-menu-item') and contains(.,'SSH Terminal')]",
    actionExecuteRunbook:                                    // [chrome-harvest]
      "//div[contains(@class,'ant-popover') and not(contains(@class,'ant-popover-hidden'))]//li[contains(@class,'ant-dropdown-menu-item') and contains(.,'Execute Runbook')]",
    actionDownloadBackup:                                    // [chrome-harvest]
      "//div[contains(@class,'ant-popover') and not(contains(@class,'ant-popover-hidden'))]//li[contains(@class,'ant-dropdown-menu-item') and contains(.,'Download Backup')]",
    // Status filter chips (labels, not commands):
    chipBackupSuccessful: 'Backup Successful',               // [doc]
    chipConflictDetected: 'Conflict Detected',               // [doc]
    chipBackupFailed: 'Backup Failed',                       // [doc]
    // Per-row conditional status buttons (present only in the matching state):
    conflictDetectedBtn:
      "button.button-transparent span.text-secondary-red", // [spec] hasText:'Conflict Detected'
    backupSuccessfulBtn:
      'button.button-transparent span.text-primary',       // [spec] hasText:'Backup Successful'
    runbookSuccessfulBtn:
      'button.button-transparent span.text-primary',       // [spec] hasText:'Runbook Successful'
    syncSuccessfulBtn:
      'button.button-transparent span.text-primary',       // [spec] hasText:'Sync Successful'
    inSyncCell: 'span.text-secondary-green',               // [spec] hasText:'In Sync'
    // Baseline / current version tags inside a row cell (title = version):
    versionTagByTitle: (v) => `div.ant-tag[title='${v}']`,  // [spec]
    baselineVersionHeaderText: 'Baseline Version',          // [spec] th.k-header
    // Device-detail link opens the per-device config view (used by download/terminal):
    deviceNameLink: (fqdn) => `//a[text() = ' ${fqdn} ']`,  // [endtest] TODO(cookbook): prefer role=link
    // Toasts:
    backupQueuedToast: /Config backup operation queued/i,   // [spec]
    syncQueuedToast: /Config sync operation queued/i,       // [spec]
    notificationMessage: '.ant-notification-notice-message', // [spec]
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Backup / Conflict drawer (from 'Conflict Detected' / 'Backup Successful')
  //   container_scope: LOC.grid.openDrawer or LOC.grid.visibleModal (.last())
  // ─────────────────────────────────────────────────────────────────────────
  backup: {
    insertedBtnName: /Inserted/i,                           // [spec] drawer.getByRole('button')
    insertedLine: 'span.insert.changesScroll',             // [spec] hasText:'logging host <ip>'
    closeDrawer: "//div[@class='col text-right']//button[@type='button']", // [spec]
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Sync (row action > Sync) — see explorer.actionSync + toasts above
  // ─────────────────────────────────────────────────────────────────────────
  sync: {
    action: 'a#sync',                                       // [spec]
    queuedToast: /Config sync operation queued/i,          // [spec]
    successBtnText: 'Sync Successful',                     // [spec]
    inSyncText: 'In Sync',                                 // [spec]
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Restore (row action > Restore)   [endtest]
  //   container_scope: LOC.grid.visibleModal (.last())
  // ─────────────────────────────────────────────────────────────────────────
  restore: {
    actionText: "//span[normalize-space()='Restore']",      // [endtest]
    // Running vs Startup config type toggle inside the restore modal:
    startupText: "//span[normalize-space(text())='Startup']", // [endtest]
    // Version select — scoped to the modal's "Version" form-item [chrome-harvest]:
    versionSelect:
      "//div[contains(@class,'ant-modal')]//div[contains(@class,'ant-form-item') and .//label[contains(.,'Version')]]//input[@data-cy='dropdown-trigger-input']",
    versionOptionByTitle: (v) => `//span[contains(@title,'${v}')]`, // [endtest]
    // Running/Startup config radios (no name attr — use value) [chrome-harvest]:
    runningRadio: "input[value='running.config']",         // [chrome-harvest]
    startupRadio: "input[value='startup.config']",         // [chrome-harvest]
    // Primary "Restore" button — this build has NO .ant-modal-footer; scope by exact text
    // inside .ant-modal (global button.ant-btn-primary matches 14). [chrome-harvest]:
    restoreConfirmBtn: "//div[contains(@class,'ant-modal')]//button[normalize-space(.)='Restore']", // [chrome-harvest]
    confirmYes: '#confirm-yes',                            // [endtest]
    successText: "//span[normalize-space(text())='Successful']", // [endtest]
    closeBtn:
      "//div[contains(@class,'row flex justify-end w-full ant-row-flex')]//button[contains(@type,'button')]", // [endtest]
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Compare modal (row action > Compare)
  //   container_scope: LOC.grid.visibleModal (.last())
  // ─────────────────────────────────────────────────────────────────────────
  compare: {
    action: 'a#compare',                                   // [spec]
    leftStartupRadio: "input[type='radio'][value='startup.config']", // [spec]
    versionDropdown:
      "//label[normalize-space()='Version']/ancestor::div[contains(@class,'ant-form-item')][1]//input[@placeholder='Select']", // [spec]
    versionOptionByTitle: (v) => `//li[contains(@class,'ant-dropdown-menu-item')]//span[@title='${v}']`, // [spec]
    countModifiedBtnName: /Modified/i,                     // [spec]
    countModified: 'span.count.replace',                   // [spec]
    countInsertedBtnName: /Inserted/i,                     // [spec]
    countInserted: 'span.count.insert',                    // [spec]
    countDeletedBtnName: /Deleted/i,                       // [spec]
    countDeleted: 'span.count.delete',                     // [spec]
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Baseline (row action > Set as Baseline) — verified in Explorer
  // ─────────────────────────────────────────────────────────────────────────
  baseline: {
    setAction: "//span[normalize-space()='Set as Baseline']", // [spec]
    versionTagByTitle: (v) => `div.ant-tag[title='${v}']`,  // [spec]
    columnHeaderText: 'Baseline Version',                   // [spec]
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Runbook (Settings > Runbook)
  // ─────────────────────────────────────────────────────────────────────────
  runbook: {
    runbookLinkName: 'Runbook',                             // [spec] getByRole('link',{name,exact})
    gridSearch: "//input[@name='search']",                  // [spec]
    row: 'tr.k-master-row',                                 // [spec] { hasText: <runbook name> }
    rowActionMenu: "a[data-cy='grid-action']",              // [spec]
    actionAssignMonitor: "//span[normalize-space()='Assign Monitor']", // [spec]
    runPlayBtn: "[data-cy='run']",                          // [spec]
    runSpinner: "svg.fa-spin, [class*='loading-icon'], svg[data-icon='sync']", // [spec] wait count()==0
    runIdleIcon: "svg[data-icon='play-circle']",            // [spec] returns when done
    // Assign Monitor drawer (container_scope: LOC.grid.openDrawer .last()):
    assignHeadingName: 'Assign Monitor',                    // [spec] drawer.getByRole('heading')
    assignSearch: "//input[@placeholder='Search']",         // [spec] drawer-scoped, .first()
    monitorRow: 'tr.k-master-row',                          // [spec] { hasText: <IP> }
    testBtnName: /^\s*Test\s*$/,                            // [spec] drawer.getByRole('button')
    testSuccessCellText: /^\s*Successful\s*$/i,             // [spec]
    assignBtnName: /^\s*Assign Monitor\s*$/,                // [spec]
    // Runbook grid row-action menu items [chrome-harvest 2026-07-15]. NOTE: this build's
    // menu has NO Delete/Edit — only: Assign Monitor, Remove Assigned Monitor, Clone
    // Runbook, Schedule Runbook. So a runbook cannot be deleted via the UI.
    actionAssignMonitorItem:                               // [chrome-harvest] (menu open)
      "//div[contains(@class,'ant-popover') and not(contains(@class,'ant-popover-hidden'))]//li[contains(@class,'ant-dropdown-menu-item') and contains(.,'Assign Monitor')]",
    noDeleteAction: true,                                  // [chrome-harvest] documented: no UI delete
    // ── Runbook create form (Settings > Runbook > Create) — [harvest 2026-07-13] ──
    createBtnName: 'Create Runbook',                        // [spec]
    name: "input[name='runbook-name']",                    // [harvest]
    description: "input[name='runbook-description']",       // [harvest]
    categorySelect:                                        // [harvest] label 'Runbook Category'
      "//label[normalize-space()='Runbook Category']/ancestor::div[contains(@class,'ant-form-item')]//input[@placeholder='Select']",
    credentialPicker: "[data-cy='dropdown-trigger-input']", // [harvest] Credential Profile picker
    createCredentialPlus: "#create-credential-btn-id",     // [harvest] button id
    port: "input[name='port']",                            // [harvest]
    timeout: "input[name='timeout']",                      // [harvest]
    // SSH Script editor is CodeMirror (2 instances: script + optional). Fill via .CodeMirror API.
    scriptEditor: '.CodeMirror',                           // [harvest] labels 'SSH Script'/'Script Language'
    addVariableBtnName: 'Add Variable',                    // [harvest]
    testBtnCreateName: /^\s*Test\s*$/,                     // [harvest] test button on create form
    goBtnName: /^\s*GO\s*$/,                               // [harvest]
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Firmware Upgrade (Explorer row action > Firmware Upgrade)   [endtest]
  // ─────────────────────────────────────────────────────────────────────────
  firmware: {
    actionText: "//span[text() = ' Firmware Upgrade ']",    // [endtest]
    imageSelect: 'input[placeholder="Select"]',             // [endtest] scope to firmware modal
    imageOptionByName: (name) => `//span[text() = ' ${name} ']`, // [endtest] e.g. c800m-universalk9-mz...bin
    successText: "//div[text() = ' Successful ']",          // [endtest]
    // Overview firmware widgets:
    overviewWidgetText: "//div[text() = ' Firmware Upgrade Overview ']",       // [endtest]
    failedSummaryText: "//div[text() = ' Failed Firmware Upgrade Summary ']",  // [endtest]
    successSummaryTitle: "//span[@title='Firmware Upgrade Success Summary']",  // [endtest]
    failedSummaryTitle: "//span[@title='Firmware Upgrade Failed Summary']",    // [endtest]
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Firmware Profile (Settings > Firmware > Create Firmware Profile)  [harvest 2026-07-13]
  // ─────────────────────────────────────────────────────────────────────────
  firmwareProfile: {
    gridSearch: "input[name='search']",                    // [harvest] (name=search)
    createBtn: '#create-firmware-profile-btn',             // [harvest]
    // Form labels: Profile Name, Vendor, Description, Server URL/API, Customer ID, Credential Profile, Auto Sync
    profileName:                                           // [harvest] label 'Profile Name'
      "//label[normalize-space()='Profile Name']/ancestor::div[contains(@class,'ant-form-item')]//input",
    vendorSelect:                                          // [harvest] label 'Vendor'
      "//label[normalize-space()='Vendor']/ancestor::div[contains(@class,'ant-form-item')]//input[@placeholder='Select']",
    serverUrl:                                             // [harvest] label 'Server URL/API'
      "//label[contains(normalize-space(),'Server URL')]/ancestor::div[contains(@class,'ant-form-item')]//input",
    customerId:                                            // [harvest] label 'Customer ID'
      "//label[normalize-space()='Customer ID']/ancestor::div[contains(@class,'ant-form-item')]//input",
    credentialPicker: "[data-cy='dropdown-trigger-input']", // [harvest] Credential Profile
    createCredentialPlus: '#create-credential-btn-id',     // [harvest]
    autoSyncToggle:                                        // [harvest] label 'Auto Sync'
      "//label[normalize-space()='Auto Sync']/ancestor::div[contains(@class,'ant-form-item')]//button[@role='switch']",
    testBtn: '#test-btn',                                  // [harvest]
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Device / Monitor Template (custom NCM template for firmware/hardware) [endtest]
  //   Reached via Device Inventory row action > Update Template (re-discovery)
  // ─────────────────────────────────────────────────────────────────────────
  deviceTemplate: {
    updateTemplateText: "//span[text() = ' Update Template ']", // [endtest]
    templateRowCheckboxByName: (name) =>
      `//span[text()=' ${name}']//parent::td//preceding-sibling::td//input[@type='checkbox']`, // [endtest]
    scheduleBtn: '#btn-schedule',                           // [endtest] Re-run Discovery
    successText: "//div[text() = ' Successful ']",          // [endtest]
    // The template editor itself uses a CodeMirror editor (ExecuteJS in endtest).
    codeMirror: '.CodeMirror',                              // [endtest]
    // ── Device Template create form — [harvest 2026-07-13] ──
    // Labels: Device Template Name, Description, Vendor, OS Type, Delay Time (ms),
    //         Command, Timeout (ms), Prompt, Prompt Command
    templateName:                                          // [harvest]
      "//label[contains(normalize-space(),'Device Template Name')]/ancestor::div[contains(@class,'ant-form-item')]//input",
    vendorSelect:                                          // [harvest]
      "//label[normalize-space()='Vendor']/ancestor::div[contains(@class,'ant-form-item')]//input[@placeholder='Select']",
    osTypeSelect:                                          // [harvest]
      "//label[normalize-space()='OS Type']/ancestor::div[contains(@class,'ant-form-item')]//input[@placeholder='Select']",
    addOperationBtnName: 'Add Operation',                  // [harvest]
    removeMetricGroupBtn: '#remove-metric-group',          // [harvest]
    saveBtnName: /^\s*Save\s*$/,                            // [harvest]
    resetBtnName: /^\s*Reset\s*$/,                          // [harvest]

    // ── Clone + edit flow (Settings > Device Template) — [chrome-harvest 2026-07-15] ──
    grid: 'tr.k-master-row',                               // template rows
    rowActionMenu: "a[data-cy='grid-action']",
    cloneActionItem:                                       // grid row menu: Clone (also Download JSON)
      "//div[contains(@class,'ant-popover') and not(contains(@class,'ant-popover-hidden'))]//li[contains(@class,'ant-dropdown-menu-item') and contains(.,'Clone')]",
    // Clone drawer form fields (label-scoped):
    nameInput:                                             // [chrome-harvest] 'Device Template Name'
      "//div[contains(@class,'ant-form-item') and .//label[contains(.,'Device Template Name')]]//input",
    descriptionInput:                                      // [chrome-harvest]
      "//div[contains(@class,'ant-form-item') and .//label[normalize-space(.)='Description']]//input",
    vendorTrigger:                                         // [chrome-harvest] readonly picker
      "//div[contains(@class,'ant-form-item') and .//label[contains(.,'Vendor')]]//input[@data-cy='dropdown-trigger-input']",
    vendorOptionCisco: 'div#Cisco-Systems',               // [chrome-harvest] type 'Cisco Systems' in popup search first
    osTypeInput:                                           // [chrome-harvest] plain editable text (NOT a picker)
      "//div[contains(@class,'ant-form-item') and .//label[contains(.,'OS Type')]]//input",
    // Protocol sticky tab-bar (No protocol / TFTP / SCP/SFTP) — scope to button:
    protocolTab: (name) => `//button[contains(@class,'ant-btn') and .//span[normalize-space(.)='${name}']]`, // [chrome-harvest]
    protocolAccordionHeader: (name) => `//div[contains(@class,'ant-collapse-header') and contains(.,'${name}')]`, // [chrome-harvest]
    // A command-operation card, scoped uniquely by protocol + operation h6 label:
    opCard: (protocol, op) =>
      `//div[contains(@class,'ant-collapse-item') and .//div[contains(@class,'ant-collapse-header') and contains(.,'${protocol}')]]//div[contains(@class,'metric-group-item') and .//h6[normalize-space(.)='${op}']]`, // [chrome-harvest]
    // Within opCard: the command text cells ('Write text here') — .nth(0)=primary command:
    opCommandCell: "input[placeholder='Write text here']", // [chrome-harvest] relative to opCard
    // Within a command row: Prompt / Prompt Command are dropdown-trigger-inputs (Prompt=.nth(0), PromptCommand=.nth(1)):
    opDropdownTrigger: "[data-cy='dropdown-trigger-input']", // [chrome-harvest] relative to opCard row
    // Firmware upgrade sequence multi-select popover:
    fwSequenceOptionByLabel: (label) =>                   // [chrome-harvest] generic — any option label
      `//div[contains(@class,'ant-popover') and not(contains(@class,'ant-popover-hidden'))]//div[contains(@class,'cursor-pointer') and contains(.,'${label}')]//input[@type='checkbox']`,
    fwSequenceClearBtn:                                   // [chrome-harvest] 'Clear' = unselect all
      "//div[contains(@class,'ant-popover') and not(contains(@class,'ant-popover-hidden'))]//button[normalize-space(.)='Clear']",
    saveBtn: "//button[normalize-space(.)='Save']",       // [chrome-harvest]
    // Popover option pick-by-value (Prompt '#', PromptCommand 'No Command') after opening a trigger:
    popoverOptionByText: (v) =>
      `//div[contains(@class,'ant-popover') and not(contains(@class,'ant-popover-hidden'))]//*[self::li or self::div or self::span][normalize-space(text())='${v}']`,

    // ── Apply template to a device (Device Inventory row > Update Template) — [chrome-harvest] ──
    // NOTE: the Device Template grid's row menu only has Clone/Download JSON. Applying a
    // template is done from Settings > Network Config Settings > Device Inventory instead:
    inventoryUpdateTemplateItem:                          // [chrome-harvest] Device Inventory row menu
      "//div[contains(@class,'ant-popover') and not(contains(@class,'ant-popover-hidden'))]//li[contains(@class,'ant-dropdown-menu-item') and contains(.,'Update Template')]",
    updateTemplateRowByName: (name) =>                    // template checkbox in the Update-Template drawer
      `//div[contains(@class,'ant-drawer-open')]//tr[contains(@class,'k-master-row') and contains(.,'${name}')]//input[@type='checkbox']`,
    rerunDiscoveryBtn:                                    // [chrome-harvest] apply button in the drawer
      "//div[contains(@class,'ant-drawer-open')]//button[contains(.,'Re-run Discovery')]",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Storage Profile (Settings > Storage Profile)   [endtest]
  // ─────────────────────────────────────────────────────────────────────────
  storageProfile: {
    linkText: '//a[text() = "Storage Profile"]',            // [endtest]
    gridSearch: '#storage-search',                          // [harvest]
    createBtn: '#create-storage-btn',                       // [endtest+harvest] confirmed
    name: '#storage-profile-name',                          // [harvest] (was placeholder='Must be unique')
    // Storage Destination select (protocol: TFTP/SCP/FTP):
    protocolSelect: 'input[placeholder="Select"]',          // [endtest] scope to drawer
    protocolSearch: 'input[placeholder="Search"][type="text"][data-cy="dropdown-search-input"]', // [endtest]
    protocolOptionByTitle: (v) => `//span[@title='${v}']`,  // [endtest] TFTP | SCP | FTP
    ipHost: '#ip-host',                                     // [harvest] (name=ip-host id=ip-host)
    port: '#port-id',                                       // [harvest] confirmed
    userName: '#user-name',                                 // [harvest]
    password: '#password',                                  // [harvest]
    path: '#path',                                          // [harvest]
    testBtn: '#test-btn',                                   // [endtest+harvest] confirmed
    resetBtn: '#reset-btn',                                 // [harvest]
    testMessage: "//div[@id='test-message']",               // [endtest] expect 'Storage Profile tested successfully'
    closeBtn: '#close-id',                                  // [endtest]
    externalStorageBtn: '#external-storage-btn',            // [endtest+harvest] confirmed
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Tags (Explorer tag inventory / discovery tag)   [endtest, partial]
  // ─────────────────────────────────────────────────────────────────────────
  tags: {
    // NOTE [chrome-harvest 2026-07-15]: #btn-tag-inventory is a READ-ONLY filter/browse
    // panel — it does NOT create tags. Tags are created at DISCOVERY time (discovery
    // profile), not here. So this models tag *filtering*, not tag *creation*.
    tagInventoryBtn: '#btn-tag-inventory',                  // [chrome-harvest] confirmed
    // Popover opens on click (checkbox-tree overlay with its own Search):
    tagPopover: '.ant-popover.picker-overlay',              // [chrome-harvest] conditional: btn open
    tagSearch: ".ant-popover.picker-overlay input.ant-input[placeholder='Search']", // [chrome-harvest]
    // Selecting a chip checkbox filters the grid immediately (no Apply button):
    tagChipCheckboxByName: (name) =>                        // [chrome-harvest] popover must be open
      `//div[contains(@class,'ant-popover') and contains(@class,'picker-overlay')]//div[contains(@class,'item-view')][normalize-space(.)='${name}']//input[@type='checkbox']`,
    // Tag creation input does NOT exist on this control (see note above):
    tagInput: null,                                         // by-design absent; tags created in discovery
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Network Config Policy (Settings > Network Config Policy > Create Policy) [endtest]
  // ─────────────────────────────────────────────────────────────────────────
  policy: {
    // ── navigation ──
    settingsSearch: 'network config policy',                // [endtest] Settings search term (nav.settingsSearch input)
    // Settings result / Policy-Settings link — text-scoped, not the raw positional XPath:
    ncPolicyLink: "//a[normalize-space()='Network Config Policy']", // [endtest] verified in delete flow

    // ── create-policy form ──
    createBtn: "#create-policy-btn",                        // [endtest]
    nameInput: "#policy-name",                              // [endtest]
    // Conflict/evaluation-criteria select (opens on the pristine "Config Conflict" cell):
    conflictSelect: "//div[@title='Config Conflict']//input[@placeholder='Select']", // [endtest]
    // Conflict option by title:
    //   FailedBackup            → 'Failed Action'
    //   RunningConfigConflict   → 'Config Conflict' (contains)
    conflictOption: (title) => `//span[contains(@title,'${title}')]`, // [endtest]
    // Second (conflict-detection) select — only for RunningConfigConflict:
    secondSelect:
      "//div[@class='col ant-col-3 fixed-size']//div[@class='form-item-pristine']//input[@placeholder='Select']", // [endtest]
    runningConflictOption: "//span[@title='Startup - Running Conflict']", // [endtest]
    // Entity / source-filter select:
    entitySelect: "//div[@id='entity']//input[@placeholder='Select']", // [endtest]
    entityDeviceOption: "//span[@title='Network Config Device']",       // [endtest]
    // Assign-monitor picker (readonly source field opens the device-picker popover):
    assignPicker: "//input[@readonly='readonly']",          // [endtest]
    assignSearch: "#assign-monitor-search",                 // [endtest]
    // Device row checkbox in the picker — re-scoped from the endtest positional row XPath:
    assignRow: (ip) => `tr.k-master-row:has-text('${ip}') input[type="checkbox"]`, // [endtest]
    // Severity chip by name (Critical / Major / …):
    severity: (name) => `//span[normalize-space()='${name}']`, // [endtest]
    // Notify: expand the notify section, fill recipient, click the add-recipient circle:
    expandNotify: "//div[@id='expand']//i[@class='anticon']//*[name()='svg']", // [endtest]
    notifyInput: "//input[@placeholder='@User or Email or /Handle or #User Profile']", // [endtest]
    addRecipientBtn:
      "//button[contains(@class,'ant-btn-primary')][contains(@class,'ant-btn-circle')]", // [endtest]
    // Save/create — primary shadowed footer button (re-scoped from positional class chain):
    saveBtn: "//button[contains(@class,'ant-btn-primary')][contains(@class,'button-shadow')]", // [endtest]
    // Grid row / assertions:
    policyRow: (name) => `//td[normalize-space()='${name}']`, // [endtest]
    // Delete: row action opener → red delete item → confirm-yes:
    deleteAction: "//span[contains(@class,'text-secondary-red')]", // [endtest]
    deleteConfirm: "#confirm-yes",                          // [endtest]
    noRecords: "//td[normalize-space()='No records available']", // [endtest]
  },

  // ─────────────────────────────────────────────────────────────────────────
  // NCM Approval queue (route /ncm-approval)   [doc; row actions not captured]
  // ─────────────────────────────────────────────────────────────────────────
  approval: {
    search: 'input[name="search"]',                         // [doc]
    filterBtn: '#filter-btn',                               // [doc]
    // CORRECTED PATH [chrome-harvest 2026-07-15]: Approval is NOT the /ncm-approval route
    // and NOT a grid-action menu item. It is a TAB in the device-detail drawer:
    //   Explorer → click device-name link → drawer → "Approval" tab.
    detailApprovalTab:                                      // [chrome-harvest]
      "//div[contains(@class,'ant-drawer-open')]//div[contains(@class,'ant-tabs-tab')][contains(.,'Approval')]",
    grid: '.ant-drawer-open .k-grid',                       // [chrome-harvest] approvals grid in the tab
    noRecords: "//td[normalize-space()='No records available']", // [chrome-harvest] empty state
    // Approve/Reject only exist for a PENDING request row (none in env at harvest):
    rowActionMenu: "a[data-cy='grid-action']",              // conditional: pending request
    approveActionText: "//span[normalize-space()='Approve']", // TODO: needs pending request row
    rejectActionText: "//span[normalize-space()='Reject']",   // TODO: needs pending request row
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Reports (Reports > NCCM)   [endtest]
  // ─────────────────────────────────────────────────────────────────────────
  reports: {
    reportsLink: 'a[href="/reports/"]',                     // [endtest]
    nccmCategoryText: "//div[normalize-space()='NCCM']",    // [endtest]
    // Result-list search — scoped to the wide result column (a narrower category-panel
    // search also uses name='search'). [chrome-harvest] replaces positional index.
    search: ".ant-col-10 input[name='search']",             // [chrome-harvest]
    // Exact-text link (a substring match collides with "QASRV156 config NCM Device Inventory 94"):
    reportByNameText: (name) => `//a[normalize-space(.)='${name}']`, // [chrome-harvest]
    exportPdfBtn: "button[title='Export As PDF']",          // [chrome-harvest] confirmed
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Overview widgets (NCCM > Overview tab)   [endtest]
  // ─────────────────────────────────────────────────────────────────────────
  widgets: {
    deviceOverviewText: "//div[text() = ' Device Overview ']",   // [endtest]
    deviceSummaryText: "//div[text() = ' Device Summary ']",     // [endtest]
    backupSummaryText: "//div[text() = ' Backup Summary ']",     // [endtest]
    failedBackupSummaryText: "//div[text() = ' Failed Backup Summary ']", // [endtest]
    baselineRunningConflictSummaryTitle: "Baseline-Running Conflict Summary", // [spec]
    startupRunningConflictSummaryTitle: "Startup-Running Conflict Summary",   // [spec]
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Alerts (Alerts > Network Config)   [endtest]
  // ─────────────────────────────────────────────────────────────────────────
  alerts: {
    alertsLink: "//a[@href='/alerts/']",                    // [endtest]
    // Category is an ant-tabs-tab (Metric/Log/Flow/Trap/NetRoute/APM/Network Config/RUM):
    networkConfigTab: "//div[contains(@class,'ant-tabs-tab')][contains(.,'Network Config')]", // [chrome-harvest]
    networkConfigCategoryText: "//div[normalize-space()='Network Config']", // [endtest] fallback
    // Exact-text alert link. NOTE: alert NAMES are policy-defined (env had 'ncm raj1',
    // not 'FailedBackup') — pass the real alert/policy name. Needs date range ≥ Last Week.
    alertByNameText: (name) => `//a[normalize-space(.)='${name}']`, // [chrome-harvest]
    // Severity dot lives in the row — scope to the alert's row, not global (summary badge also matches):
    rowSeverityCritical: 'div.severity-dot.critical',       // [chrome-harvest] scope: within alert row
    criticalSeverityText: "//span[@class='text critical']", // [endtest] fallback
  },

  // ─────────────────────────────────────────────────────────────────────────
  // RBAC (Settings > User Settings > User / Role)   [endtest]
  // ─────────────────────────────────────────────────────────────────────────
  rbac: {
    userSettingsText: '//div[text() = "User Settings "]',   // [endtest]
    userLinkText: '//a[text() = "User"]',                   // [endtest]
    roleLinkText: '//a[text() = "Role"]',                   // [chrome-harvest]
    // ── User create form ──
    createUserBtn: '#create-user-btn',                      // [endtest]
    firstName: 'input[type="text"][name="first-name"]',     // [endtest]
    lastName: 'input[type="text"][name="last-name"]',       // [endtest]
    emailAddress: 'input[type="text"][name="email-address"]', // [endtest]
    // Authentication Type picker → choose Local before password fields render. [chrome-harvest]
    authTypeTrigger:                                        // [chrome-harvest] label-scoped (6 dropdowns in drawer)
      "//div[contains(@class,'ant-form-item') and .//label[contains(.,'Authentication Type')]]//input[@data-cy='dropdown-trigger-input']",
    authTypeLocalOption: 'div#System',                     // [chrome-harvest] 'Local Authentication' (popup open)
    password: "input[name='password']",                     // [chrome-harvest] conditional: Local auth
    confirmPassword: "input[name='confirm-password']",      // [chrome-harvest] conditional: Local auth
    // Groups picker — NOTE: #groups is reused on wrapper + input, so scope by tag.
    groupsTrigger: 'div#groups',                            // [chrome-harvest]
    // Group popover is a checkbox-tree overlay (its own Search + Select All):
    groupsPopover: '.ant-popover.picker-overlay.open',      // [chrome-harvest] conditional: trigger open
    groupOptionByName: (name) =>                            // [chrome-harvest] popover must be open
      `//div[contains(@class,'ant-popover') and contains(@class,'picker-overlay') and contains(@class,'open')]//label[normalize-space(.)='${name}']`,
    // Role picker — trigger id reused on wrapper+span, scope to span.
    roleTrigger: 'span#role-picker',                        // [chrome-harvest]
    // Role dropdown is a SIMPLE single-select list (.ant-popover-content), NOT picker-overlay:
    rolePopover: '.ant-popover-content',                    // [chrome-harvest] conditional: trigger open
    roleOptionByName: (name) =>                             // [chrome-harvest] popover must be open
      `//div[contains(@class,'ant-popover') and not(contains(@class,'ant-popover-hidden'))]//*[self::li or self::div or self::span][normalize-space(text())='${name}']`,

    // ── Role create form (Settings → Role → Create Role) ── [chrome-harvest]
    createRoleBtnName: 'Create Role',                       // getByRole('button')
    roleName: 'input#role-name',                            // [chrome-harvest] (#role-name reused → scope input)
    roleDescription: "input[name='role-description']",      // [chrome-harvest]
    // Permission matrix: collapse-header per module; columns
    //   [1]=All Module  [2]=Read  [3]=Read & Write  [4]=Delete.
    // permCheckbox('NCCM','read'|'readwrite'|'delete') → the module's column checkbox.
    permCol: { all: 1, read: 2, readwrite: 3, delete: 4 },  // [chrome-harvest]
    permCheckbox: (module, col) => {
      const idx = { all: 1, read: 2, readwrite: 3, delete: 4 }[col] || 2;
      return `//div[contains(@class,'ant-collapse-header')][.//div[contains(@class,'fixed-size')][normalize-space(text())='${module}']]//div[contains(@class,'fixed-size')][${idx}]//input[@type='checkbox']`;
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // SSH Terminal (Explorer device-detail > Terminal)   [endtest]
  // ─────────────────────────────────────────────────────────────────────────
  sshTerminal: {
    // OPEN via the Explorer row-action menu item — reliable. The device-detail drawer's
    // header Terminal button (button[title='Terminal']) only closed the drawer in testing. [chrome-harvest]
    openViaRowAction: 'actionSshTerminal',                  // see explorer.actionSshTerminal
    terminalBtn: 'button[type="button"][title="Terminal"]', // [endtest] (unreliable — see note)
    terminalInput: 'textarea.xterm-helper-textarea',        // [chrome-harvest] focus + type here
    terminalHelperTextarea: 'textarea.xterm-helper-textarea', // [chrome-harvest]
    promptTextByName: (name) => `//span[text() = "${name}"]`, // [endtest] e.g. 'ospf1#'
    headingText: '.ant-drawer-open .ant-drawer-title',      // [chrome-harvest] "Terminal - <device>"
    closeIcon: '.ant-drawer-open .ant-drawer-close',        // [chrome-harvest]
  },
};

export default LOC;
