/*
 * Discovery selector catalog — the SINGLE place discovery locators live.
 *
 * This is the runtime mirror of knowledge/locators/selector-cookbook.md
 * (§16.1 Discovery Profile, §16.2 Create Credential drawer). Flows and specs import
 * from here — they NEVER inline an XPath/CSS string. That keeps the "one catalog,
 * verified, no positional XPath" rule enforceable in one file.
 *
 * Rule: add/verify a locator in the cookbook first, then reflect it here.
 */

/** Static selectors, grouped by screen (keys mirror the cookbook control names). */
export const S = {
  login: {
    // [harvest 2026-07-15] name-based inputs; placeholder 'Enter Username' is the alt.
    // 'Username' placeholder = FORGOT-PASSWORD page. Marker = .ant-avatar, not img[alt=Avatar].
    username: "input[name='username']",
    password: "input[name='password']",
    submit: "//button[@type='submit']",
    avatar: '.ant-avatar',
    logout: 'Logout', // getByText
  },
  nav: {
    settings_link: "//a[@href='/settings/']",
    search_focus: "//input[@id='phone-number']", // app's search focus trick
    search_input: "//input[@placeholder='Search']",
    discovery_profile_link:
      "//a[@href='/settings/network-discovery/network-discovery-profiles' and normalize-space()='Discovery Profile']",
    create_profile_btn: 'Create Discovery Profile', // getByRole button
  },
  profile: {
    db_subtype_trigger: "//input[@data-cy='dropdown-trigger-input']",
    subtype_option: (title) => `//span[@title='${title}']`,
    // name field differs by flow (network vs db) — one union locator, .first()
    name_field: "//input[@id='profile-id'] | //input[@name='profile-name']",
    ip_field:
      "//input[@id='ip-address-id'] | //input[@name='wireless-ip-address'] | //input[contains(@placeholder,'192.168')]",
    db_service_name: "//input[@id='db-service-name-id']",
    port: "//input[@id='port-id']",
    create_credential_btn: '#create-credential-btn-id',
    save_run_btn: '#save-run-btn-id',
    add_selected_btn: "//button[@id='add-selected-btn-id']",
    success_toast: 'provisioned successfully', // getByText
    close_results_x: "//i[@class='anticon text-neutral-light']//*[name()='svg'] | svg[data-icon='times']",
    result_search: "//input[@name='discovery-search']",
  },
  credential: {
    name: "//input[@id='credential-profile-name-id']",
    version_select: "//div[@id='version-id']//input[@placeholder='Select']",
    version_v2c: 'V2c', // getByRole menuitem
    community: "//input[@id='community-id']",
    username_generic: "//input[@id='username-id']",
    password_generic: "//input[@id='password-id']",
    protocol_from_snmp: "//div[@title='SNMP V1/V2c']//input[@placeholder='Select']",
    protocol_ssh_option: "//span[@title='SSH']",
    create_profile_btn: "//button[@id='create-credential-profile-btn-id']",
    // in-drawer credential test
    test_btn: "//button[@id='test-btn']",
    test_hostname_ip: "//input[@name='hostname-ip']",
    test_target_sql: "//input[@name='target']",
    test_port_sql: "//input[@name='port']",
    test_database_sql: "//input[@name='database-name']",
    run_test_btn: "//button[@id='run-test-btn']",
    test_message: '#message', // expect 'Successful'
    close_btn: "//button[@id='close-btn-id']",
  },
};

// --- disambiguation scopes (the cookbook's known Motadata duplicate traps) ---

/** The currently-open Ant Design drawer (credential profile, etc.). */
export const openDrawer = (page) => page.locator('.ant-drawer-open').last();

/** The visible Ant popover/dropdown (floating menus). */
export const visiblePopover = (page) =>
  page.locator('.ant-popover:visible, .ant-dropdown:visible').last();

/** A Kendo grid data row scoped by unique text (e.g. the discovered IP). */
export const gridRow = (page, text) =>
  page.locator('tr.k-master-row', { hasText: text }).first();

/**
 * The checkbox of a discovered row — the correct replacement for the fragile
 * `input[type="checkbox"]').nth(1)` used across the legacy discovery specs.
 */
export const discoveredRowCheckbox = (page, ip) =>
  gridRow(page, ip).locator('input[type="checkbox"]').first();
