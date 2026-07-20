# Motadata Selector Cookbook

Append-only store of **verified** locators (`count() === 1` confirmed on the live app), organized to mirror the Motadata left-sidebar module structure. The resolver greps the ONE screen it needs — never the whole file. Misses are harvested by `motadata-explorer` and written back under the correct module.

Build: 8.2.4 · Legend: ✅ harvested · 🟡 partial · ⬜ not yet harvested

## Module coverage map (sidebar order)

| # | Module | Status | Screens covered |
|---|---|---|---|
| 0 | **Global / cross-screen** | ✅ | login, logout, settings-nav, confirm, grid search, column eye |
| 1 | Dashboards | 🟡 | Add Widget — Chart config (metric-description popover) [MOTADATA-8898] |
| 2 | Monitors (Inventory) | ⬜ | — |
| 3 | Alerts | 🟡 | Network Config category tab, alert-by-name link, row severity (2026-07-15) |
| 4 | SLO | ⬜ | — |
| 5 | Reports | 🟡 | NCCM report search + exact-name link + Export-as-PDF (2026-07-15) |
| 6 | Topology | ⬜ | — |
| 7 | **NCCM** | ✅ | Explorer, Conflict drawer, Compare modal, Tag Inventory (filter) |
| 8 | NetRoute | ⬜ | — |
| 9 | Metric Explorer | ⬜ | — |
| 10 | Log Explorer | ⬜ | — |
| 11 | APM Explorer | ⬜ | — |
| 12 | RUM Explorer | ⬜ | — |
| 13 | Flow Explorer | ⬜ | — |
| 14 | Trap Explorer | ⬜ | — |
| 15 | Audits | ⬜ | — |
| 16 | **Settings** | ✅ | Discovery Profile, Create-Credential drawer, Runbook (+create/CodeMirror), Create Policy, Storage Profile, Firmware Profile, Device Template (2026-07-13), RBAC Role+permission tree & User pickers (chrome-harvest 2026-07-15) |

> When you harvest a new screen, add its row's screens + flip the status, then append the screen block under that module's `#` heading below. Keep modules in sidebar order.

---

# 0. Global / cross-screen

```yaml
login:                                                # [chrome-harvest 2026-07-15] — corrected
  username:   "input[name='username']"                # placeholder 'Enter Username'
  password:   "input[name='password']"
  submit:     "button[type=submit] 'Sign in'"         # getByRole('button',{name:/sign in/i})
  success:    "left /login route"                     # img[alt=Avatar] does NOT exist this build
logout:
  avatar:     ".ant-avatar"                           # initials circle 'MA' (NOT img[alt=Avatar])
  confirm:    "a[href='/settings/my-account/my-profile']"
  menu_item:  "page.getByText('Logout', {exact:true})"
settings_nav:                                         # the #phone-number focus is REQUIRED
  settings_link: "//a[@href='/settings/']"
  search_focus:  "//input[@id='phone-number']"
  search_input:  "//input[@placeholder='Search']"
  result_link:   "page.getByRole('link', { name: '<Exact Name>' })"
module_nav:                                           # top-level sidebar links
  by_name: "page.getByRole('link', { name: /<Module>/i })"   # e.g. /NCCM/i, /NetRoute/i
confirm:
  yes: "#confirm-yes"
  no:  "#confirm-no"
grid:
  search: "//input[@name='search']"                   # grid's OWN search (NOT settings sidebar)
  master_row: "tr.k-master-row  hasText:<unique>"
  column_eye_button: "#btn-show-hide-columns"
  column_search_in_popover: "input[data-cy='dropdown-search-input']"   # use .last()
# verified 2026-05-27
```

---

# 1. Dashboards

## 1.1 Add Widget — Chart config (metric-description popover)   (Dashboard > "+" > Add New Widget > Chart)   [MOTADATA-8898]

```yaml
open_widget_picker:
  add_widget_plus:   "svg[data-icon='plus']"                    # .first(); dashboard top-right. confidence: medium (icon-only; scope to dashboard header if it drifts)
  add_widget_item:   "page.getByText('Add New Widget', { exact: false }).first()"
  widget_type_tab:   "page.getByText('<Type>', { exact: true }).first()"   # 'Chart','Grid','Top N','Gauge','Pie',... ; also role=tab
category_group:
  # Each data category is added as its own counter GROUP via an add-group button.
  # The Metric group exists by default. Vertical teal/coloured label on the group = its category.
  add_group_button: "page.locator('button.add-group-btn').filter({ hasText: /^<Category>$/ })"  # Metric|Log|Flow|APM|NetRoute|RUM  (exact)
  # NOTE: li#metric-explorer / li#apm / li#rum / li#log / li#flow / li#netroute are the GLOBAL
  # left-nav Explorer links — they navigate AWAY. Do NOT use them to switch the widget category.
counter_dropdown:
  trigger:          "[data-cy='dropdown-trigger-input'][placeholder='Select Counter']"  # one PER group; scope: .first() for Metric group, .last() for a freshly-added group
  search:           "input[placeholder='Search']"               # inside the open counter popover (scope to popover)
  option:           ".scroll-dropdown-menu-item"                 # counter rows; hover to surface that counter's description
  selected_value:   "[data-cy='dropdown-trigger-input'][placeholder='Select Counter']  (value)"
metric_description_popover:                                       # THE feature under test (MOTADATA-8898)
  # Floating card to the RIGHT of the counter list. Appears on HOVER/highlight of a counter option
  # (and for the currently-selected counter). Header = counter name.
  trigger_gesture:  "hover the counter option (.scroll-dropdown-menu-item)"
  container_hint:   "visible div, x>360, contains 'Description' + ('Interpretation' | 'Possible Values')"
  numeric_metric_shape: "Description: <text>  +  Interpretation { High Values: <text>, Low Values: <text> }"
  dimension_field_shape: "Description: <text>  +  Possible Values { Type: <text>, Values: <list> }"   # e.g. Flow 'tag', APM 'service.language'
# Data presence on 172.16.15.86 (build 8.2.5), verified 2026-06-02:
#   Metric ✅ rich (e.g. system.cpu.percent, system.file.modified.duration.minutes)
#   APM    ✅ (service.language)        RUM ✅ (rum.service.largest.contentful.paint.us)
#   NetRoute ✅ (netroute.latency.ms)   Flow ✅ (tag, volume.bytes)
#   Log    ❌ EMPTY for all 4 counters (event.source/.category/.source.type/.severity) —
#          popover header renders but body is blank; NO 'unavailable' message (see A7 finding).
# verified 2026-06-02
```

# 2. Monitors (Inventory)   ⬜ not yet harvested
# 3. Alerts   ⬜ not yet harvested
# 4. SLO   ⬜ not yet harvested
# 5. Reports   ⬜ not yet harvested
# 6. Topology   ⬜ not yet harvested

---

# 7. NCCM

## 7.1 NCCM Explorer   (NCCM > Explorer tab)

```yaml
screen: NCCM Explorer
controls:
  nccm_link:    "page.getByRole('link', { name: /NCCM/i })"
  explorer_tab: "page.getByRole('tab', { name: 'Explorer' })"
  overview_tab: "page.getByRole('tab', { name: 'Overview' })"
  search:       "//input[@name='search']"
  device_row:   "tr.k-master-row hasText:<IP>"
  row_action_menu: "tr...locator(\"a[data-cy='grid-action']\")"
  action_set_baseline: "//span[normalize-space()='Set as Baseline']"
  action_backup_menuitem: "//span[normalize-space()='Backup Now']"
  action_sync:    "a#sync"
  action_backup:  "a#backup"
  action_compare: "a#compare"
  baseline_version_tag: "row.locator(\"div.ant-tag[title='1.0']\")"          # title=<version>
  current_version_tag:  "row.locator(\"div.ant-tag[title='2.0']\")"
  conflict_detected_btn:  { locator: "button.button-transparent span.text-secondary-red  hasText:'Conflict Detected'", conditional: true, trigger: "backup diverges from baseline" }
  backup_successful_btn:  { locator: "button.button-transparent span.text-primary  hasText:'Backup Successful'",  conditional: true, trigger: "after Backup Now completes" }
  runbook_successful_btn: { locator: "button.button-transparent span.text-primary  hasText:'Runbook Successful'", conditional: true, trigger: "after runbook run completes" }
  sync_successful_btn:    { locator: "button.button-transparent span.text-primary  hasText:'Sync Successful'",    conditional: true, trigger: "after Sync completes" }
  in_sync_cell:           { locator: "span.text-secondary-green  hasText:'In Sync'", conditional: true, trigger: "after successful sync" }
toasts:
  backup_queued: ".ant-notification-notice-message  hasText:/Config backup operation queued/i"
  sync_queued:   ".ant-notification-notice-message  hasText:/Config sync operation queued/i"
# verified 2026-05-27
```

## 7.2 NCCM Conflict drawer   (from 'Conflict Detected' button)

```yaml
screen: NCCM Conflict drawer
container_scope: ".ant-drawer-open (use .last())"
controls:
  inserted_btn:   "drawer.getByRole('button', { name: /Inserted/i })"
  inserted_line:  "span.insert.changesScroll  hasText:'logging host <automationIp>'"
  close_drawer:   "//div[@class='col text-right']//button[@type='button']"
# verified 2026-05-27
```

## 7.3 NCCM Compare modal   (row action > Compare)

```yaml
screen: NCCM Comparison View (modal)
container_scope: ".ant-modal:visible (use .last())"
controls:
  left_startup_radio: "input[type='radio'][value='startup.config']"
  version_dropdown:   "//label[normalize-space()='Version']/ancestor::div[contains(@class,'ant-form-item')][1]//input[@placeholder='Select']"   # left panel = .first()
  version_option:     "//li[contains(@class,'ant-dropdown-menu-item')]//span[@title='<version>']"
  count_modified: "getByRole('button',{name:/Modified/i}).locator('span.count.replace')"
  count_inserted: "getByRole('button',{name:/Inserted/i}).locator('span.count.insert')"
  count_deleted:  "getByRole('button',{name:/Deleted/i}).locator('span.count.delete')"
# verified 2026-05-27
```

---

# 8. NetRoute   ⬜ not yet harvested
# 9. Metric Explorer   ⬜ not yet harvested
# 10. Log Explorer   ⬜ not yet harvested
# 11. APM Explorer   ⬜ not yet harvested
# 12. RUM Explorer   ⬜ not yet harvested
# 13. Flow Explorer   ⬜ not yet harvested
# 14. Trap Explorer   ⬜ not yet harvested
# 15. Audits   ⬜ not yet harvested

---

# 16. Settings

## 16.1 Discovery Profile   (Settings > Discovery Profile)

```yaml
screen: Discovery Profile
controls:
  discovery_profile_link: "//a[@href='/settings/network-discovery/network-discovery-profiles' and normalize-space()='Discovery Profile']"
  create_btn:        "page.getByRole('button', { name: 'Create Discovery Profile' })"
  type_network:      "page.getByText('Network', { exact: true })"
  type_database:     "page.getByText('Database', { exact: true })"
  subtype_dropdown:  "//input[@data-cy='dropdown-trigger-input']  (.first())"      # e.g. SQL Server, MongoDB
  subtype_option:    "//span[@title='<SubType>']"                                  # 'SQL Server', 'MongoDB'
  profile_name:      "input[name='profile-name']"        # Network flow
  profile_name_db:   "//input[@id='profile-id']"         # Database flow
  ip_address:        "//input[@id='ip-address-id']"
  db_service_name:   "//input[@id='db-service-name-id']" # DB flow: instance/db name (SQL Server = MSSQLSERVER)
  port_db:           "//input[@id='port-id']"            # DB flow: port (ant-input-number-input; SQL Server = 1444)
  network_config_toggle: "//label[normalize-space()='Network Config Management']/ancestor::div[contains(@class,'ant-form-item')]//button[@role='switch']"   # aria-checked gates state
  credential_picker: "//div[@id='credential-profile-picker-id']"
  default_snmp_row:  ".ant-popover:visible,.ant-dropdown:visible >> tr,li,div[role=option]  hasText:/default\\s*snmp/i"   # scope to visible popover, .last()
  create_credential_plus: "//button[@id='create-credential-btn-id']"
  save_and_run:      "#save-run-btn-id"
  add_selected:      "//button[@id='add-selected-btn-id']"
  discovered_row:    "tr.k-master-row hasText:<IP>"
  success_toast:     "page.getByText('provisioned successfully').first()"
  close_results_x:   "svg[data-icon='times']  |  //i[@class='anticon text-neutral-light']//*[name()='svg']"
  result_search:     "//input[@name='discovery-search']"
# verified 2026-05-27
```

## 16.2 Create Credential drawer   (opened from Discovery picker / + button)

```yaml
screen: Create Credential Profile (drawer)
container_scope: ".ant-drawer-open (use .last())"
controls:
  name:           "//input[@id='credential-profile-name-id']"
  username_generic: "//input[@id='username-id']"        # DB/simple creds (MongoDB, SQL Server)
  password_generic: "//input[@id='password-id']"
  protocol_change_from_snmp: "//div[@title='SNMP V1/V2c']//input[@placeholder='Select']"
  protocol_ssh_option:       "//span[@title='SSH']"
  username_ssh:   "drawer.locator(\"input[name='username']\").first()"   # DUP: hidden+visible -> .first()
  password_ssh:   "drawer.locator(\"input[type='password']\").first()"   # DUP -> .first()
  config_transfer_protocol: "//label[normalize-space()='Config Transfer Protocol']/ancestor::div[contains(@class,'ant-form-item')]//input[@placeholder='Select']"
  config_transfer_tftp:     "//li[@role='menuitem']//span[normalize-space()='TFTP'] | //span[@title='TFTP']"
  enable_password: "//label[normalize-space()='Enable Password']/ancestor::div[contains(@class,'ant-form-item')]//input"
  enable_prompt:   "//label[normalize-space()='Enable Prompt']/ancestor::div[contains(@class,'ant-form-item')]//input"
  cli_options_checkbox: "page.getByRole('checkbox', { name: 'Cli options' })"   # NOT bare input[type=checkbox]
  test_btn:       "//button[@id='test-btn']"
  hostname_ip:    "input[name='hostname-ip']"            # SSH/network cred test dialog
  # SQL Server (DB) cred test dialog uses target/port/database-name instead of hostname-ip:
  test_target_sql:   "//input[@name='target']"          # verified 2026-05-29
  test_port_sql:     "//input[@name='port']"            # verified 2026-05-29
  test_database_sql: "//input[@name='database-name']"   # verified 2026-05-29
  run_test_btn:   "//button[@id='run-test-btn']"
  test_result_msg: "#message"                           # expect 'Successful'
  close_btn:      "//button[@id='close-btn-id']"
  create_profile_btn: "//button[@id='create-credential-profile-btn-id']"
# verified 2026-05-27
```

## 16.3 Runbook   (Settings > Runbook / Plugin Library)

```yaml
screen: Runbook
controls:
  runbook_link:     "page.getByRole('link', { name: 'Runbook', exact: true })"
  grid_search:      "//input[@name='search']"
  runbook_row:      "tr.k-master-row hasText:<runbook name>"
  row_action_menu:  "row.locator(\"a[data-cy='grid-action']\")"
  action_assign_monitor: "//span[normalize-space()='Assign Monitor']"
  run_play_btn:     "row.locator(\"[data-cy='run']\")"
  run_spinner:      "svg.fa-spin, [class*='loading-icon'], svg[data-icon='sync']"   # wait count()==0
  run_idle_icon:    "svg[data-icon='play-circle']"                                  # returns when done
assign_monitor_drawer:
  container_scope:  ".ant-drawer-open (use .last())"
  heading:          "drawer.getByRole('heading', { name: 'Assign Monitor' })"
  search:           "//input[@placeholder='Search']  (drawer-scoped, .first())"
  monitor_row:      "drawer tr.k-master-row hasText:<IP>"
  row_checkbox:     "monitorRow.locator('input[type=checkbox]').first()"
  test_btn:         "drawer.getByRole('button', { name: /^Test$/ })"
  test_success_cell: "monitorRow td hasText:/Successful/i"
  assign_btn:       "drawer.getByRole('button', { name: /^Assign Monitor$/ })"
# verified 2026-05-27
```

## 16.4 Policy Settings — Create Policy (unified)   (Settings > Policy Settings > Create Policy)   [MOTADATA-8503]

Verified live against build 8.2.4 + cross-checked vs Figma (node 30368:222640).

```yaml
screen: Policy Settings (Create Policy)
nav:
  policy_settings_link: "a[href=\"/settings/policy-settings/\"]"
  create_policy_btn:    "page.getByRole('button', { name: 'Create Policy' })"
  # IN-PANEL module switch links have NO href; the global sidebar ones have href=/netroute/ etc.
  # So scope to the hrefless link to avoid leaving the page (the NetRoute nav quirk).
  module_link:          "page.locator('a:not([href]), [role=\"menuitem\"]').filter({ hasText: '<Module>' })"
  # modules: Availability | Metric | Log | Flow | APM | Trap | Network Config | NetRoute | Real User Monitoring
  # NOTE: RUM module label = 'Real User Monitoring' (URL slug also 'Real User Monitoring')
basic_fields:
  policy_name:  "input#policy-name"                       # required; gates Create Policy (B1)
  tags:         "[role='combobox']  (click, then keyboard type + Enter per tag)"
set_conditions:
  # four CARDS (not tabs), in order (A2). Click the card by its title text.
  threshold_card: "page.getByText('Threshold Alert', { exact: true })"
  baseline_card:  "page.getByText('Baseline Alert', { exact: true })"
  anomaly_card:   "page.getByText('Anomaly', { exact: true })"
  forecast_card:  "page.getByText('Forecast', { exact: true })"
form:
  counter_metric:  "//input[@placeholder='Select Metric']"     # Metric module (readonly dropdown)
  counter_other:   "//input[@placeholder='Select Counter']"    # APM/RUM/NetRoute
  counter_search:  "//input[@placeholder='Search']  (popover, .last())"
  counter_option:  "//span[@title='<counter>']"
  source_filter:   "//input[@placeholder='Everywhere']  | //input[@placeholder='Select']  (Source Filter)"
  source_filter_option: "//span[@title='<filter>']"            # e.g. 'Monitor','Service','Application','Interface','Group'
  source_input:    "readonly Source input beside Source Filter"
  assign_search:   "//input[@id='assign-monitor-search']"      # when Source opens a monitor picker
  severity_critical: "//input[@name='critical']"               # placeholder 'Value'
  severity_major:    "//input[@name='major']"                  # NEW in unified build
  severity_warning:  "//input[@name='warning']"
  operator_dropdown: "//input[@placeholder='Select']  (Equals/Greater/Less; scope per severity row)"
  notify_within:     "label 'Notify if Threshold value breach within' -> dropdown (e.g. 5 min)"
  abnormality_occurrence: "label 'Abnormality Occurrence' -> dropdown"
  auto_clear:        "label 'Auto Clear' -> dropdown (e.g. Never)"
apm_only:
  policy_type_toggle: "Trace Metrics | Trace Analytics  (getByText, exact)"   # D1, required, filters counters
accordions:           # shipped labels (differ from ticket wording)
  modify_default_alert_btn: "page.getByText('Modify Default Alert')"
  notification:  "page.getByText('Notification', { exact: true })"
  take_action:   "page.getByText('Take Action', { exact: true })"
  declare_incident: "page.getByText('Declare Incident', { exact: true })"
submit:
  create_policy_btn: "page.getByRole('button', { name: 'Create Policy' })"   # disabled until name (B1)
  reset_btn:         "page.getByRole('button', { name: 'Reset' })"
success: "toast + redirect to policy list; new policy row visible (confirmed)"
gotchas:
  - "Deep-link URLs (/policies/<mod>/create) do NOT hydrate — navigate by clicking Create Policy + module link."
  - "Module links are hrefless; getByRole('link',{name:'NetRoute'}) hits the GLOBAL sidebar -> scope to hrefless."
  - "Form inputs render lazily; wait for the Counter input before harvesting/filling."
# verified 2026-05-27
```

---

## 9.1 Edit Backup Profile drawer   (Settings > System Settings > Backup Profile > row action > edit)

Verified live against build 8.2.5 (a11y tree from failing-test trace).

```yaml
screen: Backup Profile (Edit drawer)
container_scope: Edit Backup Profile drawer
controls:
  storage_profile_dropdown:
    # Scope by the field LABEL — the wrapper's title attr is the selected value, which changes on swap.
    locator:     "xpath=//*[normalize-space(text())='Storage Profile Name']/ancestor::div[.//input[@placeholder='Select']][1]//input[@placeholder='Select']"
    confidence:  high
    fallback:    "page.getByText('Storage Profile Name', { exact: true }).locator('xpath=following::input[@placeholder=\"Select\"][1]')"
    conditional: false
  storage_profile_search:  "//input[@data-cy='dropdown-search-input']  (popover, .last())"
  storage_profile_option:  "//span[@title='<profile name>']"
  submit_btn:              "#btn-submit-trap-forwarding"
gotchas:
  - "Drawer has FOUR placeholder='Select' inputs (Database Type, Storage Profile, Hours, Notify) — a bare //input[@placeholder='Select'] is ambiguous; always scope by label group."
  - "BANNED locator that broke the test: //div[@title='Config DB Backup Storage Profile'] — no such title exists."
# verified 2026-05-29
```

---

## 13.1 Metric Settings drawer — Docker tabs   (Settings > Monitor Settings > Device Monitor Settings > row action > Metric Settings)

Verified live against build 8.3.0 (a11y tree, monitor 172.16.15.234 / motadata234).

```yaml
screen: Device Monitor Settings (Metric Settings drawer)
container_scope: div.ant-drawer-open
controls:
  open_metric_settings:    "row.locator('svg[data-icon=\"ellipsis-v\"]').click() -> page.getByText('Metric Settings', { exact: false }).first()"
  docker_container_tab:
    locator:     "drawer.getByRole('tab', { name: 'Docker Container', exact: true })"
    confidence:  high
    conditional: true
    trigger:     "monitor must run Docker containers; tab only present for docker-capable monitors"
  docker_tab:
    locator:     "drawer.getByRole('tab', { name: 'Docker', exact: true })"
    confidence:  high
    conditional: true
    trigger:     "docker-capable monitor; use exact:true so it does NOT match 'Docker Container'"
  active_tab_check:          "expect(tab).toHaveAttribute('aria-selected', 'true')"
  container_name_header:     "drawer.locator('th', { hasText: /Container Name/i }).first()"
gotchas:
  - "Container NAME values are dynamic — never assert on them. Assert tab selection + the static 'Container Name' column header only."
  - "Tabs are ant-tabs (<div role='tab'>) — getByRole('tab') works; exact:true is required to disambiguate 'Docker' from 'Docker Container'."
# verified 2026-06-03
```

---

## Append format for new entries

Place the block under the correct module `#` heading (sidebar order). Update the coverage map row + status.

```yaml
## <module#>.<n> <Screen Name>   (<navigation path>)
screen: <key the manual-author must use>
container_scope: <if inside drawer/popover/modal>
controls:
  <control_key>:
    locator:     "<verified primary locator>"
    confidence:  high | medium | low        # reject-tier (positional xpath) is NEVER stored
    fallback:    "<second verified locator, different strategy>"   # optional, self-heal
    conditional: false                       # true if only present in a specific state
    trigger:     "<what makes it appear>"    # required when conditional: true
# verified YYYY-MM-DD
```

Rules:
- Conditional controls (discovered row, Conflict/Sync/Backup badges) MUST set `conditional: true` + `trigger`, verified against the seeded state — never an empty screen.
- Positional/index XPath (`//div[13]//span[1]`) is BANNED. Re-scope to role/label/data-cy/row first.
- Prefer storing `locator` + `fallback` so a single locator rot is self-healable.

---

## NCCM / Settings — live harvest 2026-07-13 (172.16.15.156)

Captured by `scripts/harvest-locators.mjs` (read-only DOM dump → `knowledge/locators/harvest/*.json`). All `count()===1` id/name/data-cy read from the rendered drawer/form. Folded into `framework/playwright/pages/nccm/locators.js` (provenance `[harvest]`).

### Runbook — Create form (Settings > Runbook > Create Runbook)
```yaml
- key: runbook.name
    locator: "input[name='runbook-name']"
    confidence: high
- key: runbook.description
    locator: "input[name='runbook-description']"
    confidence: high
- key: runbook.port
    locator: "input[name='port']"
    confidence: high
- key: runbook.timeout
    locator: "input[name='timeout']"
    confidence: high
- key: runbook.scriptEditor
    locator: ".CodeMirror"                 # SSH Script — set via cm.CodeMirror.setValue()
    confidence: high
    conditional: false
- key: runbook.createCredentialPlus
    locator: "#create-credential-btn-id"
    confidence: high
# verified 2026-07-13  (labels: Runbook Category, Monitor, Group, Credential Profile, GO)
```

### Storage Profile — Create drawer (Settings > Storage Profile)
```yaml
- key: storageProfile.name
    locator: "#storage-profile-name"
    confidence: high
- key: storageProfile.ipHost
    locator: "#ip-host"
    confidence: high
- key: storageProfile.port
    locator: "#port-id"
    confidence: high
- key: storageProfile.userName          # conditional: SCP/FTP only (not TFTP)
    locator: "#user-name"
    confidence: high
    conditional: true
    trigger: "protocol = SCP or FTP"
- key: storageProfile.password
    locator: "#password"
    confidence: high
    conditional: true
    trigger: "protocol = SCP or FTP"
- key: storageProfile.path
    locator: "#path"
    confidence: high
    conditional: true
    trigger: "protocol = SCP or FTP"
- key: storageProfile.createBtn / testBtn / resetBtn / externalStorageBtn
    locator: "#create-storage-btn | #test-btn | #reset-btn | #external-storage-btn"
    confidence: high
# verified 2026-07-13
```

### Firmware Profile — Create (Settings > Firmware > Create Firmware Profile)
```yaml
- key: firmwareProfile.createBtn
    locator: "#create-firmware-profile-btn"
    confidence: high
- key: firmwareProfile.testBtn
    locator: "#test-btn"
    confidence: high
- key: firmwareProfile.credentialPicker
    locator: "[data-cy='dropdown-trigger-input']"
    confidence: medium                    # label-scope Vendor/Server URL/Customer ID (see locators.js)
# verified 2026-07-13  (labels: Profile Name, Vendor, Server URL/API, Customer ID, Credential Profile, Auto Sync)
```

### Device Template — Create form (Settings > Device Template)
```yaml
- key: deviceTemplate.addOperationBtn
    locator: "getByRole button 'Add Operation'"
    confidence: high
- key: deviceTemplate.removeMetricGroupBtn
    locator: "#remove-metric-group"
    confidence: high
# verified 2026-07-13  (labels: Device Template Name, Vendor, OS Type, Command, Timeout (ms), Prompt)
```

### NCM Policy / Approval — confirmed openers
```yaml
- key: policy.nameInput
    locator: "#policy-name"
    confidence: high
- key: approval.rowActionMenu
    locator: "a[data-cy='grid-action']"    # Approve/Reject items need a PENDING request row
    confidence: medium
    conditional: true
    trigger: "row has a pending change request"
# verified 2026-07-13
```

---

## RBAC / Tags — Claude-in-Chrome harvest 2026-07-15 (172.16.15.156)

Verified count()===1 via the browser extension. **Gotcha:** several Ant wrappers reuse
the same `id` on the wrapper div AND the inner input → a bare `#id` matches 2–3 elements.
Scope by tag: `input#role-name`, `div#groups`, `span#role-picker`.

### RBAC — Role create (Settings > Role > Create Role)
```yaml
- key: rbac.roleName
    locator: "input#role-name"          # NOT #role-name (matches wrapper+input)
    confidence: high
- key: rbac.roleDescription
    locator: "input[name='role-description']"
    confidence: high
- key: rbac.permCheckbox(module,col)    # collapse-header per module; cols 1=All 2=Read 3=R&W 4=Delete
    locator: "//div[contains(@class,'ant-collapse-header')][.//div[contains(@class,'fixed-size')][normalize-space(text())='NCCM']]//div[contains(@class,'fixed-size')][3]//input[@type='checkbox']"
    confidence: high                     # example: NCCM Read&Write (col index 3)
# verified 2026-07-15
```

### RBAC — User create pickers (Settings > User > Create User)
```yaml
- key: rbac.groupsTrigger
    locator: "div#groups"
    confidence: high
- key: rbac.groupsPopover               # checkbox-tree overlay, own Search + Select All
    locator: ".ant-popover.picker-overlay.open"
    confidence: high
    conditional: true
    trigger: "Groups trigger clicked"
- key: rbac.roleTrigger
    locator: "span#role-picker"
    confidence: high
- key: rbac.rolePopover                  # SIMPLE single-select list (.ant-popover-content), NOT picker-overlay
    locator: ".ant-popover-content"
    confidence: high
    conditional: true
    trigger: "Role trigger clicked"
# NOTE: Password / Confirm Password field locators NOT yet harvested → user submit blocked.
# verified 2026-07-15
```

### Tags — Tag Inventory (NCCM Explorer toolbar)  — READ-ONLY filter, NOT a creator
```yaml
- key: tags.tagInventoryBtn
    locator: "#btn-tag-inventory"
    confidence: high
- key: tags.tagPopover
    locator: ".ant-popover.picker-overlay"
    confidence: high
    conditional: true
    trigger: "#btn-tag-inventory clicked"
- key: tags.tagChipCheckboxByName(name)  # selecting filters grid immediately (no Apply)
    locator: "//div[contains(@class,'ant-popover') and contains(@class,'picker-overlay')]//div[contains(@class,'item-view')][normalize-space(.)='dynamic']//input[@type='checkbox']"
    confidence: high
    conditional: true
# Tag CREATION is not on this control — tags are created at DISCOVERY time. verified 2026-07-15
```

### Approval — /ncm-approval  (grid EMPTY at harvest — cannot verify row actions)
```yaml
- key: approval.filterDropdown
    locator: "#filter-btn"
    confidence: high
- key: approval.rowActionMenu / Approve / Reject
    locator: "a[data-cy='grid-action']"  # + //span[normalize-space()='Approve'|'Reject']
    confidence: low
    conditional: true
    trigger: "a row with a PENDING change request must exist (none at harvest time)"
# verified 2026-07-15 (opener spec only; unverified against a live row)
```

---

## NCCM / Settings — Claude-in-Chrome harvest #2, 2026-07-15 (Tier A + B)

Second extension pass. Several important CORRECTIONS to earlier assumptions.

### User create — Password (Settings > User > Create User)
```yaml
- key: rbac.authTypeTrigger              # label-scoped (6 dropdown-triggers in this drawer)
    locator: "//div[contains(@class,'ant-form-item') and .//label[contains(.,'Authentication Type')]]//input[@data-cy='dropdown-trigger-input']"
    confidence: high
- key: rbac.authTypeLocalOption
    locator: "div#System"                # 'Local Authentication'
    confidence: high
    conditional: true
    trigger: "auth-type dropdown open"
- key: rbac.password / rbac.confirmPassword
    locator: "input[name='password'] | input[name='confirm-password']"
    confidence: high
    conditional: true
    trigger: "Authentication Type = Local"
```

### Runbook grid — NO DELETE ACTION (correction)
```yaml
# This build's runbook grid-action (⋮) menu = Assign Monitor, Remove Assigned Monitor,
# Clone Runbook, Schedule Runbook.  There is NO Delete or Edit. Runbooks can't be UI-deleted.
- key: runbook.actionAssignMonitorItem
    locator: "//div[contains(@class,'ant-popover') and not(contains(@class,'ant-popover-hidden'))]//li[contains(@class,'ant-dropdown-menu-item') and contains(.,'Assign Monitor')]"
    confidence: high
```

### Reports (left nav Reports > NCCM)
```yaml
- key: reports.search
    locator: ".ant-col-10 input[name='search']"   # narrow category search also uses name=search
    confidence: high
- key: reports.reportByNameText(name)             # EXACT text (substring collides with row titles)
    locator: "//a[normalize-space(.)='NCM Device Inventory']"
    confidence: high
- key: reports.exportPdfBtn
    locator: "button[title='Export As PDF']"
    confidence: high
```

### Alerts (left nav Alerts > Network Config tab)
```yaml
- key: alerts.networkConfigTab
    locator: "//div[contains(@class,'ant-tabs-tab')][contains(.,'Network Config')]"
    confidence: high
- key: alerts.alertByNameText(name)               # exact text; names are policy-defined
    locator: "//a[normalize-space(.)='<alert name>']"
    confidence: high
    conditional: true
    trigger: "date range >= Last Week"
- key: alerts.rowSeverityCritical                 # scope to the alert's row (summary badge also matches)
    locator: "div.severity-dot.critical"
    confidence: medium
```

### Explorer row-action menu — full item set + bulk toolbar
```yaml
# Menu items: Backup Now, Compare, Download Backup, Set as Baseline / Remove Baseline,
#             SSH Terminal, View, Sync, Restore, Execute Runbook, Get Hardware Details, Firmware Upgrade
- key: explorer.bulkBackupBtn                     # appears when 2+ row checkboxes ticked
    locator: "#bulk-action-bulk_backup"
    confidence: high
    conditional: true
    trigger: "2+ Explorer rows selected"
- key: explorer.actionRemoveBaseline / actionSshTerminal / actionExecuteRunbook / actionDownloadBackup
    locator: "//div[contains(@class,'ant-popover') and not(contains(@class,'ant-popover-hidden'))]//li[contains(@class,'ant-dropdown-menu-item') and contains(.,'<Item>')]"
    confidence: high
    conditional: true
    trigger: "row grid-action (⋮) open"
```

### Restore modal (Explorer row > Restore) — no .ant-modal-footer in this build
```yaml
- key: restore.versionSelect
    locator: "//div[contains(@class,'ant-modal')]//div[contains(@class,'ant-form-item') and .//label[contains(.,'Version')]]//input[@data-cy='dropdown-trigger-input']"
    confidence: high
- key: restore.runningRadio / startupRadio
    locator: "input[value='running.config'] | input[value='startup.config']"
    confidence: high
- key: restore.restoreConfirmBtn                  # scope by exact text (global primary btn = 14)
    locator: "//div[contains(@class,'ant-modal')]//button[normalize-space(.)='Restore']"
    confidence: high
```

### SSH Terminal — open via ROW ACTION, not the drawer header button
```yaml
- key: sshTerminal.openViaRowAction              # explorer.actionSshTerminal — RELIABLE
    note: "device-detail drawer header button[title='Terminal'] only closed the drawer — do not use"
- key: sshTerminal.terminalInput
    locator: "textarea.xterm-helper-textarea"
    confidence: high
    conditional: true
    trigger: "SSH Terminal panel open"
```

### Approval — CORRECTED: device-detail drawer > Approval TAB (not a route, not a menu item)
```yaml
- key: approval.detailApprovalTab
    locator: "//div[contains(@class,'ant-drawer-open')]//div[contains(@class,'ant-tabs-tab')][contains(.,'Approval')]"
    confidence: high
    conditional: true
    trigger: "device-name link clicked (detail drawer open)"
- key: approval.grid
    locator: ".ant-drawer-open .k-grid"
    confidence: high
# Approve/Reject: still need a PENDING request row (none in env). verified 2026-07-15
```

---

## NCM Device Template editor — Claude-in-Chrome harvest, 2026-07-15 (LAST gap)

Clone flow: Settings > Device Template > row action > Clone. Apply flow: Settings >
Network Config > Device Inventory > row action > Update Template > Re-run Discovery.

```yaml
- key: deviceTemplate.nameInput
    locator: "//div[contains(@class,'ant-form-item') and .//label[contains(.,'Device Template Name')]]//input"
    confidence: high
- key: deviceTemplate.vendorTrigger + vendorOptionCisco
    locator: "…label 'Vendor'…input[@data-cy='dropdown-trigger-input']  →  div#Cisco-Systems"
    confidence: high      # readonly trigger; type 'Cisco Systems' in popup search first
- key: deviceTemplate.osTypeInput
    locator: "…label 'OS Type'…input"     # plain editable text, NOT a picker
    confidence: high
- key: deviceTemplate.protocolTab(name)
    locator: "//button[contains(@class,'ant-btn') and .//span[normalize-space(.)='TFTP']]"
    confidence: high      # sticky tab-bar; 'No protocol'|'TFTP'|'SCP/SFTP'
- key: deviceTemplate.opCard(protocol, op)   # unique command-operation card
    locator: "//div[contains(@class,'ant-collapse-item') and .//div[contains(@class,'ant-collapse-header') and contains(.,'TFTP')]]//div[contains(@class,'metric-group-item') and .//h6[normalize-space(.)='Backup Running Configuration']]"
    confidence: high
- key: deviceTemplate.opCommandCell           # relative to opCard; .nth(0)=primary command
    locator: "input[placeholder='Write text here']"
    confidence: high
- key: deviceTemplate.opDropdownTrigger        # relative to op row; .nth(0)=Prompt .nth(1)=Prompt Command
    locator: "[data-cy='dropdown-trigger-input']"
    confidence: medium    # per-row indexing needs a live dry-run to confirm
- key: deviceTemplate.fwSequenceOptionByLabel(label) + fwSequenceClearBtn
    locator: "…popover…div.cursor-pointer contains '<label>'…input[type=checkbox]   |   button 'Clear'"
    confidence: high      # 'Backup Existing Firmware Image' etc.; Clear = unselect all
- key: deviceTemplate.saveBtn
    locator: "//button[normalize-space(.)='Save']"
    confidence: high
- key: deviceTemplate.inventoryUpdateTemplateItem + rerunDiscoveryBtn
    locator: "Device Inventory row menu 'Update Template' → drawer 'Re-run Discovery'"
    confidence: high      # template grid row menu only has Clone/Download JSON — apply is via Device Inventory
# fuzzy spots (dry-run to confirm): firmware-sequence TRIGGER (label-scoped guess),
# and which opCard holds the added 'terminal length 0' command. verified 2026-07-15
```

---

## Login / Logout — Claude-in-Chrome harvest, 2026-07-15 (CORRECTION)

```yaml
login:
  username:  "input[name='username']"          # placeholder 'Enter Username' (NOT 'Username')
  password:  "input[name='password']"          # placeholder = bullet dots
  sign_in:   "button[type=submit] text 'Sign in'"   # getByRole('button',{name:/sign in/i})
  forgot:    "text 'Forgot password?'"
  # 'Username' placeholder = the FORGOT-PASSWORD page, not login.
  success:   "left /login route (avatar img[alt=Avatar] does NOT exist this build)"
logout:
  avatar:      ".ant-avatar"                    # top-right initials circle ('MA'), NOT img[alt=Avatar]
  confirm_open: "a[href='/settings/my-account/my-profile']"   # My Profile link in dropdown
  logout_link: "text 'Logout'"                  # red, bottom of dropdown
# verified 2026-07-15
```
