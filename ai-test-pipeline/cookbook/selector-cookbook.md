# Motadata Selector Cookbook

Append-only store of **verified** locators (`count() === 1` confirmed on the live app), organized to mirror the Motadata left-sidebar module structure. The resolver greps the ONE screen it needs — never the whole file. Misses are harvested by `motadata-explorer` and written back under the correct module.

Build: 8.2.4 · Legend: ✅ harvested · 🟡 partial · ⬜ not yet harvested

## Module coverage map (sidebar order)

| # | Module | Status | Screens covered |
|---|---|---|---|
| 0 | **Global / cross-screen** | ✅ | login, logout, settings-nav, confirm, grid search, column eye |
| 1 | Dashboards | 🟡 | Add Widget — Chart config (metric-description popover) [MOTADATA-8898] |
| 2 | Monitors (Inventory) | ⬜ | — |
| 3 | Alerts | ⬜ | — |
| 4 | SLO | ⬜ | — |
| 5 | Reports | ⬜ | — |
| 6 | Topology | ⬜ | — |
| 7 | **NCCM** | ✅ | Explorer, Conflict drawer, Compare modal |
| 8 | NetRoute | ⬜ | — |
| 9 | Metric Explorer | ⬜ | — |
| 10 | Log Explorer | ⬜ | — |
| 11 | APM Explorer | ⬜ | — |
| 12 | RUM Explorer | ⬜ | — |
| 13 | Flow Explorer | ⬜ | — |
| 14 | Trap Explorer | ⬜ | — |
| 15 | Audits | ⬜ | — |
| 16 | **Settings** | 🟡 | Discovery Profile, Create-Credential drawer, Runbook, Create Policy (unified) |

> When you harvest a new screen, add its row's screens + flip the status, then append the screen block under that module's `#` heading below. Keep modules in sidebar order.

---

# 0. Global / cross-screen

```yaml
login:
  username:   "//input[@placeholder='Username']"
  password:   "//input[@placeholder='Password']"
  submit:     "//button[@type='submit']"
  logged_in_marker: "//img[@alt='Avatar']"          # smart wait; never networkidle
logout:
  avatar:     "//img[@alt='Avatar']"
  menu_item:  "page.getByText('Logout')"
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

## 16.RUM Register Application   (Settings → Real User Monitoring → Application → Create Application)
screen: rum-register-application
container_scope: .ant-drawer-open   (drawer titled "Register Application")
controls:
  create_application_btn:
    locator:     "getByRole('button', { name: 'Create Application' })"
    confidence:  high
  application_name:
    locator:     "page.locator('input#rum-application-name-id')"
    confidence:  high
  application_type_trigger:
    locator:     "page.locator('[data-cy=\"dropdown-trigger-input\"]').first()"
    confidence:  high
    fallback:    "page.locator('.ant-drawer-open [data-cy=\"dropdown-trigger-input\"]').first()"
  application_type_option:
    locator:     "page.locator('.virtual-scrollable-dropdown-menu span[title=\"<JS|React|Vue|Angular|Next.js>\"]').last()"
    confidence:  high
    conditional: true
    trigger:     "application_type_trigger clicked (floating ant-dropdown-menu open)"
  deployment_nginx:
    locator:     "page.locator('.ant-drawer-open label').filter({ hasText: /^Nginx$/ })"
    confidence:  high      # Nginx is the DEFAULT selected toggle; Apache http | Other are siblings
  domain_ip:
    locator:     "page.locator('input#domain-name-id')"
    confidence:  high      # placeholder https://motadata.com
  version:
    locator:     "page.locator('input#version-id')"
    confidence:  high      # REQUIRED. '1.0.0' shown is PLACEHOLDER ONLY — must be filled or submit silently fails
  environment:
    locator:     "page.locator('input#environment-id')"
    confidence:  high      # free-text input (no popover); type e.g. 'dev'
  session_sample_rate:
    locator:     "page.locator('input#session-sample-rate-id')"
    confidence:  high      # defaults to 60
  privacy_trigger:
    locator:     "page.locator('[data-cy=\"dropdown-trigger-input\"]').last()"
    confidence:  high
  privacy_option:
    locator:     "page.locator('.virtual-scrollable-dropdown-menu span[title=\"<All text available by default|All user input masked by default|All text masked by default>\"]').last()"
    confidence:  high
    conditional: true
    trigger:     "privacy_trigger clicked"
    # 'All text available by default' => defaultPrivacyLevel 'allow'
  tags:
    locator:     "page.locator('#tags')"
    confidence:  medium    # ant-select multiple, optional
  register_submit_btn:
    locator:     "page.locator('#rum-application-submit-btn')"
    confidence:  high
  reset_btn:
    locator:     "page.locator('#rum-application-reset-btn')"
    confidence:  high
# --- post-submit output drawer (title "Steps to Register Application") ---
  steps_drawer_title:
    locator:     "page.getByText('Steps to Register Application')"
    confidence:  high
    conditional: true
    trigger:     "register_submit_btn clicked with all required fields valid"
  steps_code_blocks:
    locator:     "page.locator('.ant-drawer-open pre')"
    confidence:  high      # [0]=nginx /api/v2/rum config, [1]=main.js motadataRum.init({...}) snippet
  steps_copy_icon:
    locator:     "page.locator('.ant-drawer-open .copy-icon')"
    confidence:  medium    # two copy buttons, one per pre block
# verified 2026-06-09

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
