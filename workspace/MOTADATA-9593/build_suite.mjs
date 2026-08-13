#!/usr/bin/env node
/*
 * MOTADATA-9593 — Credential Profile UI for Microsoft Graph API Mail Server vs Figma.
 * Generates manual-cases.json (for ado:publish) + the 10-column TFS-import CSV.
 *
 *   node workspace/MOTADATA-9593/build_suite.mjs
 *
 * GROUNDING (what each expected string is based on):
 *  - ui-kg src/modules/settings/system-settings/views/mail-server-settings.vue  (field order,
 *    labels, ids, radio options, v-if conditions, docs link, test-message block)
 *  - ui-kg src/modules/settings/system-settings/helpers/mail-server-settings.js (payload keys,
 *    the 10000000000002 basic sentinel, username/password inclusion rule)
 *  - ui-kg src/modules/settings/system-settings/mail-server-api.js             (REST endpoints)
 *  - knowledge/locators/catalog/settings_system_settings_mail_server_settings.json (5 radios /
 *    2 switches / button set, captured in the BASIC state)
 *  - knowledge/product/Settings/system-settings/mail-server-settings.md
 *  - knowledge/product/Settings/network-discovery/credential-profiles.md
 *  - knowledge/product/Settings/users-settings/roles.md
 *  - Jira MOTADATA-9593 description (the two reported defects)
 *
 * src: 'kg' = read out of the shipped source. 'doc' = product knowledge. 'jira' = ticket text.
 * 'figma' = MUST be confirmed against node-id 2610-47977. 'inferred' = neither — human gate.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AREA = 'Motadata\\Settings';
const ASSIGNEE_CSV = 'Ansh Garg';           // CSV import wants the display name
const STATE = 'Design';
const OUT_DIR = path.dirname(fileURLToPath(import.meta.url));

const NAV = "Login as admin (admin/admin); navigate Settings > System Settings > Mail Server Settings";
const OAUTH = "Set Authentication Type = OAuth (the non-Basic option)";

/* Every case: t=title, tags=[], steps=[[action, expected, src?]] */
const C = [];
const add = (t, tags, steps) => C.push({ id: `TC-${String(C.length + 1).padStart(3, '0')}`, title: t, tags, steps });

/* ---------------------------------------------------------------- 1. UI / Figma parity — the reported defect */
add('Mail Server Settings screen opens with heading and docs link', ['Functional', 'UI'], [
  [NAV, "Screen loads at /settings/system-settings/mail-server-settings; heading 'Mail Server Settings' in primary colour", 'kg'],
  ["Read the sub-text under the heading", "Reads 'Configure mail servers for seamless email notifications from Motadata ObserveOps. For more information:' followed by a 'Mail Server Settings' link with an external-link icon", 'kg'],
]);
add("Docs link 'Mail Server Settings' opens vendor docs in a new tab", ['Functional', 'UI'], [
  [NAV, "Screen loads", 'kg'],
  ["Click the 'Mail Server Settings' link in the sub-text", "New browser tab opens https://docs.motadata.com/motadata-aiops-docs/system-settings-module/mail-server-settings; the settings tab is unchanged", 'kg'],
]);
add('Field order on the Mail Server form matches Figma', ['UI', 'Regression'], [
  [NAV, "Screen loads", 'kg'],
  ["Read the visible form fields top to bottom in the Basic state", "Order is exactly: SMTP Server, Use Proxy Server, Security Type, SMTP Server Port, Authentication Type, From Email, Authentication Requires", 'kg'],
  ["Compare that order against Figma node-id 2610-47977", "Order and grouping match the design; no field is transposed", 'figma'],
]);
add('Label / field alignment and spacing match Figma (the reported misalignment)', ['UI', 'Functional'], [
  [NAV, "Screen loads", 'kg'],
  [OAUTH, "OAuth-specific fields render", 'kg'],
  ["Overlay the rendered form on Figma node-id 2610-47977 at 100% zoom, 1920x1080", "Label column width, field width, vertical gaps and left indent match the design within tolerance; no label wraps or clips. THIS IS THE DEFECT REPORTED IN MOTADATA-9593 - expect a fail until fixed", 'jira'],
]);
add('Grant Type dropdown options match Figma (the reported mismatch)', ['UI', 'Functional'], [
  [NAV, "Screen loads", 'kg'],
  [OAUTH, "Credential Profiles picker appears", 'kg'],
  ["Open the credential create form and expand the Grant Type dropdown", "Dropdown lists exactly the Grant Type values defined in Figma node-id 2610-47977, in the design's order, with no extra/renamed/missing option. THIS IS THE DEFECT REPORTED IN MOTADATA-9593 - expect a fail until fixed", 'jira'],
]);
add('Grant Type dropdown has no duplicate or blank option', ['UI', 'Edge'], [
  [NAV + '; ' + OAUTH, "Credential Profiles picker appears", 'kg'],
  ["Open the credential create form and expand Grant Type", "No duplicate entries, no empty option, no raw enum key (e.g. CLIENT_CREDENTIALS) leaking as a label instead of its display text", 'inferred'],
]);
add('Security Type offers exactly None / SSL / TLS as buttons', ['UI', 'Functional'], [
  [NAV, "Screen loads", 'kg'],
  ["Inspect the Security Type control", "Renders as a button-style radio group with exactly three options in order: None, SSL, TLS; one is always selected", 'kg'],
]);
add('Authentication Type offers exactly two button options', ['UI', 'Functional'], [
  [NAV, "Screen loads", 'kg'],
  ["Inspect the Authentication Type control", "Renders as a button-style radio group with exactly two mutually exclusive options (Basic and the OAuth/Graph API option); total radios on the screen is 5 (3 Security Type + 2 Authentication Type)", 'kg'],
  ["Compare the two option labels against Figma", "Labels read exactly as designed (e.g. 'Basic' / 'OAuth') - not a raw key", 'figma'],
]);
add('Placeholders and info tooltips render as designed', ['UI', 'Functional'], [
  [NAV, "Screen loads", 'kg'],
  ["Inspect SMTP Server, SMTP Server Port and From Email placeholders", "SMTP Server shows 'e.g. smtp.google.com'; From Email shows 'Valid email address'", 'kg'],
  ["Hover the info icons on Use Proxy Server and From Email", "Both show their tooltip text; the icons are vertically aligned with their labels", 'kg'],
]);
add('DUPLICATE DOM ID: Security Type and Authentication Type both render id="security-type-id"', ['UI', 'Regression'], [
  [NAV, "Screen loads", 'kg'],
  ["In devtools run document.querySelectorAll('#security-type-id').length", "Must return 1. Source review of mail-server-settings.vue shows the id on BOTH the Security Type and the Authentication Type radio group - a duplicate-id defect that breaks automation and accessibility. Expect a fail until fixed", 'kg'],
]);
add('DUPLICATE DOM ID: Use Proxy Server and SMTP Server Port both render id="smtp-server-port-id"', ['UI', 'Regression'], [
  [NAV, "Screen loads", 'kg'],
  ["In devtools run document.querySelectorAll('#smtp-server-port-id').length", "Must return 1. Source review shows the id on BOTH the Use Proxy Server form item and the SMTP Server Port field - a duplicate-id defect. Expect a fail until fixed", 'kg'],
]);
add('Buttons Test / Save / Reset render in the designed order and style', ['UI', 'Functional'], [
  [NAV, "Screen loads", 'kg'],
  ["Inspect the action bar", "Shows 'Test', 'Save Mail Server Settings' (primary) and 'Reset'; Save is the visually primary action", 'kg'],
]);

/* ---------------------------------------------------------------- 2. Conditional-field logic (grounded in v-if) */
add('Selecting OAuth hides the Authentication Requires toggle', ['Functional', 'Regression'], [
  [NAV, "Basic is selected; the 'Authentication Requires' toggle is visible", 'kg'],
  [OAUTH, "The 'Authentication Requires' toggle is removed from the form (it is Basic-only)", 'kg'],
]);
add('Selecting OAuth hides the Password field', ['Functional', 'Regression'], [
  [NAV + "; set Authentication Type = Basic and Authentication Requires = ON", "User Name and Password fields are visible", 'kg'],
  [OAUTH, "Password field is removed; the secret now comes from the Credential Profile, not this form", 'kg'],
]);
add('User Name is shown for OAuth and for Basic-with-auth, hidden for Basic-without-auth', ['Functional', 'Edge'], [
  [NAV + "; Authentication Type = Basic, Authentication Requires = OFF", "User Name is hidden", 'kg'],
  ["Turn Authentication Requires ON", "User Name appears and is mandatory", 'kg'],
  ["Turn Authentication Requires OFF, then switch Authentication Type to OAuth", "User Name appears again and is mandatory (OAuth always needs it)", 'kg'],
]);
add('Credential Profiles picker appears only for OAuth', ['Functional'], [
  [NAV, "Authentication Type = Basic; no Credential Profiles field", 'kg'],
  [OAUTH, "'Credential Profiles' field appears, is mandatory, and offers a create-new affordance", 'kg'],
  ["Switch back to Basic", "Credential Profiles field is removed again", 'kg'],
]);
add('Credential Profiles picker lists only HTTP(S)-protocol profiles', ['Functional', 'Impacted'], [
  [NAV + '; ' + OAUTH, "Credential Profiles picker appears", 'kg'],
  ["Open the picker with SNMP, SSH and HTTP(S) profiles all existing in the system", "Only HTTP(S) profiles are listed; SNMP/SSH/WinRM profiles are filtered out (picker is scoped to available-protocols HTTP_HTTPS)", 'kg'],
]);
add('Create a credential profile inline from the Mail Server screen', ['Functional'], [
  [NAV + '; ' + OAUTH, "Credential Profiles picker appears", 'kg'],
  ["Use the create affordance in the picker, fill the Graph API fields (Grant Type, Tenant/Client ID, Client Secret) and save", "Profile is created, the picker auto-selects it, and the drawer closes without losing the rest of the mail-server form state", 'inferred'],
  ["Navigate to Settings > Discovery > Credential Profiles", "The new profile is listed with protocol HTTP(S) and Used Count reflecting the mail-server reference", 'doc'],
]);
add('Mail server form state survives the inline credential-create drawer', ['Edge', 'Regression'], [
  [NAV, "Screen loads", 'kg'],
  ["Fill SMTP Server, Port, From Email and Security Type = TLS, then switch to OAuth and open the inline credential-create drawer", "Drawer opens over the form", 'kg'],
  ["Cancel the drawer", "All previously entered mail-server values are still populated; nothing is reset", 'inferred'],
]);

/* ---------------------------------------------------------------- 3. Happy path / functional */
add('Save a Graph API (OAuth) mail server configuration end to end', ['Functional'], [
  [NAV, "Screen loads", 'kg'],
  ["Enter SMTP Server = smtp.office365.com, SMTP Server Port = 587, Security Type = TLS, From Email = alerts@example.com", "Fields accept the values with no validation error", 'kg'],
  [OAUTH + ", enter User Name and select a Graph API credential profile", "OAuth fields populate; Password field is absent", 'kg'],
  ["Click 'Save Mail Server Settings'", "Success toast; settings persist", 'doc'],
  ["Reload the page", "OAuth is still selected, the same credential profile is selected, and all values round-trip unchanged", 'kg'],
]);
add('Test succeeds for a valid Graph API configuration', ['Functional'], [
  [NAV + "; configure a valid OAuth Graph API mail server", "Form is complete", 'kg'],
  ["Click 'Test'", "Test-message area shows a green success message with a check-circle icon", 'kg'],
]);
add('Test fails clearly for an invalid Graph API credential', ['Negative', 'Functional'], [
  [NAV + '; ' + OAUTH + ", select a credential profile holding a wrong Client Secret", "Form is complete", 'kg'],
  ["Click 'Test'", "Test-message area shows a red failure message with a times-circle icon and an expandable error detail; nothing is saved", 'kg'],
]);
add('Reset reverts the form to the last saved values', ['Functional'], [
  [NAV + "; note the saved configuration", "Saved values shown", 'kg'],
  ["Change SMTP Server, Port and Authentication Type, then click 'Reset'", "All fields revert to the last saved values; no save request is sent", 'doc'],
]);
add('Switch an existing Basic configuration to OAuth', ['Functional', 'Regression'], [
  [NAV + " on a system already saved with Basic auth", "Basic is selected with User Name/Password populated", 'kg'],
  [OAUTH + ", enter User Name, select a Graph API credential profile and Save", "Save succeeds; on reload the configuration is OAuth with the chosen credential profile", 'kg'],
]);
add('Switch an existing OAuth configuration back to Basic', ['Functional', 'Regression'], [
  [NAV + " on a system already saved with OAuth", "OAuth is selected with a credential profile", 'kg'],
  ["Switch to Basic, turn Authentication Requires ON, enter User Name + Password and Save", "Save succeeds; on reload the configuration is Basic and no credential profile is bound", 'kg'],
]);

/* ---------------------------------------------------------------- 4. Negative / validation */
add('Save is rejected when SMTP Server is blank', ['Negative'], [
  [NAV, "Screen loads", 'kg'],
  ["Clear SMTP Server and click 'Save Mail Server Settings'", "Required-field validation fires on SMTP Server; no PUT request is sent", 'kg'],
]);
add('Save is rejected when SMTP Server Port is blank or non-numeric', ['Negative'], [
  [NAV, "Screen loads", 'kg'],
  ["Clear SMTP Server Port and Save", "Required validation fires on SMTP Server Port", 'kg'],
  ["Enter 'abcd' in SMTP Server Port and Save", "Port-format validation fires; the value is rejected", 'kg'],
]);
add('SMTP Server Port rejects out-of-range values', ['Negative', 'Edge'], [
  [NAV, "Screen loads", 'kg'],
  ["Enter 0, then 65536, then -1 in SMTP Server Port and attempt Save each time", "Each is rejected by port validation; only 1-65535 is accepted", 'kg'],
]);
add('From Email rejects a malformed address', ['Negative'], [
  [NAV, "Screen loads", 'kg'],
  ["Enter 'alerts@@example', then 'alerts example.com', then 'alerts@' in From Email and Save", "Email-format validation fires each time; no save occurs", 'kg'],
]);
add('From Email required-ness matches Figma (source has format-only validation)', ['Negative', 'Regression'], [
  [NAV, "Screen loads", 'kg'],
  ["Clear From Email completely and click 'Save Mail Server Settings'", "Source review shows From Email carries an email-format rule but NOT a required rule, while the product doc marks it mandatory. Confirm against Figma which is correct - if mandatory, a blank value must block Save. Expect a discrepancy", 'kg'],
]);
add('Save is rejected when OAuth is selected with no credential profile', ['Negative'], [
  [NAV + '; ' + OAUTH, "Credential Profiles field appears", 'kg'],
  ["Leave Credential Profiles empty and Save", "Required-field validation fires on Credential Profiles; no PUT is sent", 'kg'],
]);
add('Save is rejected when OAuth is selected with a blank User Name', ['Negative'], [
  [NAV + '; ' + OAUTH, "User Name is visible and mandatory", 'kg'],
  ["Clear User Name and Save", "Required validation fires on User Name", 'kg'],
]);
add('Credential create is rejected when Grant Type is not chosen', ['Negative'], [
  [NAV + '; ' + OAUTH, "Credential Profiles picker appears", 'kg'],
  ["Open the inline credential-create form, leave Grant Type unselected, fill everything else and submit", "Grant Type required validation fires; the profile is not created", 'inferred'],
]);
add('Credential create is rejected when Client Secret / Tenant ID are blank', ['Negative'], [
  [NAV + '; ' + OAUTH, "Credential Profiles picker appears", 'kg'],
  ["Open the inline credential-create form, select a Grant Type, leave the Graph API secret fields blank and submit", "Each required Graph API field raises its own validation message; nothing is created", 'inferred'],
]);
add('Duplicate credential profile name is rejected', ['Negative', 'Regression'], [
  [NAV + '; ' + OAUTH, "Credential Profiles picker appears", 'kg'],
  ["Create a credential profile reusing the name of an existing profile", "A not-unique / duplicate-name error is shown; no second profile is created", 'doc'],
]);

/* ---------------------------------------------------------------- 5. Security */
add('RBAC: a non-admin role cannot open Mail Server Settings', ['Security', 'Negative'], [
  ["Create a role without system-settings permission and a user bound to it (Settings > User Settings > Role, then User Profile)", "Role and user exist", 'doc'],
  ["Log in as that user and navigate to /settings/system-settings/mail-server-settings directly by URL", "Access is denied or the screen is not reachable from the nav; the mail server configuration is never rendered", 'doc'],
]);
add('RBAC: a read-only role cannot save or test the mail server', ['Security', 'Negative'], [
  ["Log in as a user whose role grants view-only access to System Settings", "Mail Server Settings opens read-only", 'inferred'],
  ["Attempt to edit a field, then Test, then Save", "Controls are disabled or the requests are rejected with 403; the saved configuration is unchanged", 'inferred'],
]);
add('RBAC: a non-admin cannot create a credential profile from the picker', ['Security', 'Negative'], [
  ["Log in as a non-admin user that can reach a screen with a credential picker", "Screen opens", 'doc'],
  ["Attempt to use the create-credential affordance", "Creation is blocked - credential profiles manage secrets and are admin-level", 'doc'],
]);
add('Client Secret is masked in the UI and never echoed back', ['Security'], [
  [NAV + '; ' + OAUTH, "Credential Profiles picker appears", 'kg'],
  ["Create a Graph API credential with a known Client Secret, save, then reopen it for edit", "The secret renders masked (dots), is not selectable as plain text, and the GET response does not return the secret value in clear text", 'inferred'],
]);
add('Mail server GET response does not leak the credential secret', ['Security', 'API'], [
  [NAV + " with an OAuth configuration saved", "Screen loads", 'kg'],
  ["Inspect the GET /settings/mail-server-configuration response in devtools", "It returns mail.server.credential.profile as an ID reference only; no client secret or password value appears in the payload", 'kg'],
]);
add('XSS payload in the credential profile name is neutralised', ['Security', 'Negative'], [
  [NAV + '; ' + OAUTH, "Credential Profiles picker appears", 'kg'],
  ["Create a credential profile named <script>alert('xss')</script> and select it", "The value is either rejected by validation or rendered escaped as literal text in the picker, the grid and the mail-server form; no dialog executes", 'inferred'],
]);
add('XSS payload in SMTP Server / From Email is neutralised', ['Security', 'Negative'], [
  [NAV, "Screen loads", 'kg'],
  ["Enter <img src=x onerror=alert(1)> in SMTP Server and \"><svg onload=alert(1)> in From Email, then Save", "Validation rejects the values, or they are stored and rendered escaped; no script executes on save or on reload", 'inferred'],
]);
add('SQL-injection literal in SMTP Server is handled safely', ['Security', 'Negative'], [
  [NAV, "Screen loads", 'kg'],
  ["Enter smtp.test.com'; DROP TABLE settings;-- in SMTP Server and Save", "The value is rejected or stored verbatim as data; the application stays functional and no database error is surfaced", 'inferred'],
]);
add('Credential profile export/grid does not expose secrets (CSV injection safe)', ['Security', 'Reports'], [
  ["Create a credential profile whose name begins with =cmd|' /C calc'!A0", "Profile is created or rejected by validation", 'inferred'],
  ["Export the Credential Profiles grid to CSV and open it in Excel", "The leading =/+/-/@ is neutralised so no formula executes, and no secret column is present in the export", 'inferred'],
]);

/* ---------------------------------------------------------------- 6. Regression — payload contract */
add('REGRESSION: Basic auth writes the 10000000000002 credential sentinel', ['Regression', 'API'], [
  [NAV, "Screen loads", 'kg'],
  ["Set Authentication Type = Basic, complete the form and Save while watching the network tab", "The PUT payload contains mail.server.credential.profile = 10000000000002 - the sentinel that marks 'not OAuth'", 'kg'],
]);
add('REGRESSION: OAuth writes the selected credential profile id, not the sentinel', ['Regression', 'API'], [
  [NAV + '; ' + OAUTH, "Credential Profiles field appears", 'kg'],
  ["Select a Graph API credential profile and Save while watching the network tab", "The PUT payload sets mail.server.credential.profile to the selected profile's id and NOT 10000000000002", 'kg'],
]);
add('REGRESSION: switching OAuth to Basic clears the stored credential profile', ['Regression', 'Impacted'], [
  [NAV + " on a system saved with OAuth and a credential profile", "OAuth configuration loaded", 'kg'],
  ["Switch to Basic and Save", "PUT sends the 10000000000002 sentinel; on reload the screen shows Basic and the previously bound credential profile is no longer referenced", 'kg'],
  ["Open Settings > Discovery > Credential Profiles", "That profile's Used Count has decreased by one", 'doc'],
]);
add('REGRESSION: authentication flag is yes/no, port is an integer', ['Regression', 'API'], [
  [NAV, "Screen loads", 'kg'],
  ["Save with Authentication Requires ON, then again with it OFF, inspecting each PUT payload", "mail.server.authentication is the string 'yes' then 'no' (never boolean); proxy.enabled follows the same yes/no form; mail.server.port is sent as an integer, not a quoted string", 'kg'],
]);
add('REGRESSION: OAuth sends username/password keys even with the auth toggle hidden', ['Regression', 'API'], [
  [NAV + '; ' + OAUTH, "The Authentication Requires toggle is hidden and Password is absent", 'kg'],
  ["Complete the OAuth form and Save, inspecting the PUT payload", "Per the transform, username and password keys are still included when type is oauth. Confirm the intended contract - a hidden Password field means the password key carries a stale or empty value, which is a regression risk worth an explicit product decision", 'kg'],
]);
add('REGRESSION: reload after save re-derives the auth type from the credential id', ['Regression'], [
  ["Save a Basic configuration, then hard-reload the screen", "Authentication Type shows Basic (derived from credential id == 10000000000002)", 'kg'],
  ["Save an OAuth configuration, then hard-reload", "Authentication Type shows OAuth (derived from a credential id != 10000000000002); the correct profile is preselected", 'kg'],
]);

/* ---------------------------------------------------------------- 7. Impacted areas */
add('IMPACTED: Single Sign-On credential picker is unaffected by the mail-server change', ['Impacted', 'Regression'], [
  ["Navigate Settings > User Settings > Single Sign-On", "SSO screen loads with its own credential-profile picker", 'kg'],
  ["Select a Graph API / HTTP(S) credential profile there", "The picker lists and selects profiles correctly and its credential-profile-mismatch guard still fires when the profile does not match the configured SSO provider", 'kg'],
]);
add('IMPACTED: a credential profile used by Mail Server cannot be silently deleted', ['Impacted', 'Negative'], [
  ["Bind a Graph API credential profile to the mail server and save", "Configuration saved", 'kg'],
  ["Go to Settings > Discovery > Credential Profiles and attempt to delete that profile", "Deletion is blocked or warned because Used Count > 0, and the mail server configuration keeps working", 'doc'],
]);
add('IMPACTED: editing the bound credential profile takes effect on the next Test', ['Impacted', 'Regression'], [
  ["Bind a working Graph API credential and confirm Test succeeds", "Test is green", 'kg'],
  ["Edit that credential profile to hold an invalid Client Secret, return to Mail Server Settings and click Test", "Test now fails with a clear error - the change is picked up without re-selecting the profile. (Editing a live credential profile is a known regression trigger.)", 'doc'],
]);
add('IMPACTED: alert notification email is delivered via the Graph API configuration', ['Impacted', 'Workflow'], [
  ["Configure and save a working Graph API mail server", "Configuration saved and Test green", 'kg'],
  ["Trigger an alert whose policy has an email notification to a mailbox you can read", "The email is delivered through Graph API, arrives from the configured From Email, and the alert's Notification log records success", 'doc'],
]);
add('IMPACTED: scheduled report email is delivered via the Graph API configuration', ['Impacted', 'Reports'], [
  ["With the Graph API mail server saved, schedule a report to a reachable mailbox with the nearest run time", "Schedule created", 'doc'],
  ["Wait for the scheduled run", "The report email is delivered with its attachment and the From Email matches the configuration", 'doc'],
]);
add('IMPACTED: other credential pickers still filter by their own protocol', ['Impacted', 'Regression'], [
  ["Open Settings > Discovery > Network Discovery Profiles create, and Settings > Utility > SNMP Walk", "Both screens load with credential pickers", 'kg'],
  ["Open each credential picker with a Graph API HTTP(S) profile existing in the system", "SNMP/SSH-scoped pickers do NOT offer the HTTP(S) Graph API profile; each picker still lists only its own protocols", 'kg'],
]);
add('AUDIT: mail server update is recorded with the secret masked', ['Audit', 'Security'], [
  ["Save a change to the mail server configuration", "Save succeeds", 'doc'],
  ["Open the audit trail and locate the mail-server update entry", "An audit record exists naming the actor, timestamp and the changed setting; no client secret or password value appears in clear text in the audit entry", 'inferred'],
]);
add('AUDIT: credential profile create/update/delete is recorded', ['Audit', 'Functional'], [
  ["Create, then edit, then delete a Graph API credential profile", "All three actions complete", 'doc'],
  ["Open the audit trail", "Three separate records exist with actor and timestamp; secret values are masked", 'inferred'],
]);

/* ---------------------------------------------------------------- 8. API */
add('API: GET returns the mail server configuration', ['API', 'Functional'], [
  ["Call GET /settings/mail-server-configuration with a valid admin session", "HTTP 200; result[0] carries mail.server.host, mail.server.port, mail.server.sender, mail.server.protocol, mail.server.authentication, mail.server.credential.profile and proxy.enabled", 'kg'],
]);
add('API: PUT persists an OAuth configuration', ['API', 'Functional'], [
  ["Call PUT /settings/mail-server-configuration/{id} with mail.server.credential.profile set to a valid HTTP(S) profile id", "HTTP 200; a subsequent GET returns the new values and the UI reflects OAuth on reload", 'kg'],
]);
add('API: PUT rejects an invalid credential profile id', ['API', 'Negative'], [
  ["Call PUT /settings/mail-server-configuration/{id} with mail.server.credential.profile = 999999999999 (non-existent)", "The request is rejected with a validation error; the stored configuration is unchanged", 'inferred'],
]);
add('API: PUT rejects a credential profile of the wrong protocol', ['API', 'Negative', 'Security'], [
  ["Call PUT with mail.server.credential.profile set to an SNMP profile id, bypassing the UI filter", "The server rejects the mismatch rather than storing an unusable configuration", 'inferred'],
]);
add('API: unauthenticated and non-admin calls are rejected', ['API', 'Security'], [
  ["Call GET and PUT /settings/mail-server-configuration with no session, then with a non-admin token", "No session returns 401; non-admin returns 403; neither reads nor writes the configuration", 'inferred'],
]);
add('API: concurrent PUTs do not corrupt the configuration', ['API', 'Edge'], [
  ["Fire two PUTs simultaneously with different SMTP hosts", "One wins deterministically, the other is rejected or safely overwritten; a following GET returns one internally consistent configuration, never a mix", 'inferred'],
]);

/* ---------------------------------------------------------------- 9. Edge */
add('EDGE: maximum-length values are accepted or cleanly rejected', ['Edge'], [
  [NAV, "Screen loads", 'kg'],
  ["Enter a 255-character hostname in SMTP Server and a 255-character local part in From Email, then Save", "Either both are accepted and round-trip intact after reload, or a clear max-length validation fires; no silent truncation", 'inferred'],
]);
add('EDGE: unicode and trailing whitespace in the credential profile name', ['Edge'], [
  [NAV + '; ' + OAUTH, "Credential Profiles picker appears", 'kg'],
  ["Create profiles named 'Grafico Correo' with accents, one in Devanagari, and one with a trailing space", "All render correctly in the picker and grid; the trailing space is trimmed or preserved consistently between create, list and select", 'inferred'],
]);
add('EDGE: Use Proxy Server ON with no proxy configured', ['Edge', 'Negative'], [
  ["Ensure Settings > System Settings > Proxy Server is unconfigured, then open Mail Server Settings", "Screen loads", 'doc'],
  ["Turn Use Proxy Server ON, complete the OAuth form and click Test", "A clear error states the proxy is not configured; the failure is not silent", 'doc'],
]);
add('EDGE: Security Type mismatched with the port', ['Edge', 'Negative'], [
  [NAV, "Screen loads", 'kg'],
  ["Set Security Type = TLS with port 25, and Security Type = None with port 465, testing each", "Test fails with a clear transport error for the mismatched pair rather than hanging or reporting success", 'doc'],
]);
add('EDGE: Test on an unreachable SMTP host fails within a bounded time', ['Edge', 'Negative'], [
  [NAV, "Screen loads", 'kg'],
  ["Set SMTP Server to an unroutable address (e.g. 10.255.255.1) and click Test", "Test fails with a reachability error inside a sensible timeout; the UI is not left spinning indefinitely", 'doc'],
]);
add('EDGE: rapid Authentication Type toggling leaves consistent state', ['Edge'], [
  [NAV, "Screen loads", 'kg'],
  ["Toggle Authentication Type between Basic and OAuth ten times quickly, then Save", "The form matches the finally selected type - no orphaned Password or Credential Profiles field, no stale validation error, and the payload matches the visible state", 'kg'],
]);
add('EDGE: concurrent edit from two admin sessions', ['Edge', 'Impacted'], [
  ["Open Mail Server Settings as admin in two browsers", "Both show the same saved configuration", 'kg'],
  ["Save a different SMTP host in each, second shortly after the first, then reload both", "The last write wins or a conflict is reported; both sessions converge on the same configuration with no partial merge", 'inferred'],
]);
add('EDGE: double-clicking Save does not double-submit', ['Edge', 'Regression'], [
  [NAV + "; complete a valid OAuth configuration", "Form is valid", 'kg'],
  ["Double-click 'Save Mail Server Settings' rapidly", "Exactly one PUT is issued (button disables while in flight); no duplicate audit entry", 'inferred'],
]);
add('EDGE: unsaved changes are handled on navigate-away', ['Edge'], [
  [NAV + "; change SMTP Server without saving", "Field is dirty", 'kg'],
  ["Navigate to another Settings screen", "Either an unsaved-changes prompt appears or the change is discarded predictably; the saved configuration is untouched", 'inferred'],
]);

/* ---------------------------------------------------------------- 10. Non-functional */
add('NON-FUNCTIONAL: screen and Grant Type dropdown render within budget', ['Non-Functional', 'UI'], [
  [NAV + " on a system with 200+ credential profiles", "Screen becomes interactive within 3 seconds", 'inferred'],
  [OAUTH + " and open the Credential Profiles picker, then the Grant Type dropdown", "Each opens within 1 second with no visible layout shift", 'inferred'],
]);
add('NON-FUNCTIONAL: layout holds at 1366x768 and at 125% browser zoom', ['Non-Functional', 'UI'], [
  [NAV + '; ' + OAUTH, "OAuth fields render", 'kg'],
  ["View at 1920x1080, then 1366x768, then at 125% and 150% zoom", "No horizontal scrollbar, no overlapping labels, no clipped dropdown; the form stays usable at each size", 'inferred'],
]);
add('NON-FUNCTIONAL: form is keyboard navigable and screen-reader labelled', ['Non-Functional', 'UI'], [
  [NAV + '; ' + OAUTH, "OAuth fields render", 'kg'],
  ["Tab through every control and operate the radio groups, switches and dropdowns with the keyboard only", "Focus order follows the visual order, focus is always visible, every field has a programmatic label, and the duplicate DOM ids noted separately do not break label association", 'inferred'],
]);
add('NON-FUNCTIONAL: behaviour is consistent across supported browsers', ['Non-Functional', 'UI'], [
  ["Repeat the OAuth save-and-test happy path in Chrome, Edge and Firefox", "Layout, Grant Type options, validation and save behaviour are identical in all three", 'inferred'],
]);

/* ---------------------------------------------------------------- emit */
const csvCell = (s) => `"${String(s ?? '').replace(/"/g, '""')}"`;
const HEADER = ['ID', 'Work Item Type', 'Title', 'Test Step', 'Step Action', 'Step Expected', 'Area Path', 'Assigned To', 'State', 'Tags'];
const rows = [HEADER.map(csvCell).join(',')];
for (const c of C) {
  rows.push(['', 'Test Case', c.title, '', '', '', AREA, ASSIGNEE_CSV, STATE, c.tags.join('; ')].map(csvCell).join(','));
  c.steps.forEach(([action, expected], i) => {
    rows.push(['', '', '', String(i + 1), action, expected, '', '', '', ''].map(csvCell).join(','));
  });
}
const csv = '﻿' + rows.join('\r\n') + '\r\n';

const json = C.map((c) => ({
  id: c.id,
  title: c.title,
  tags: c.tags,
  steps: c.steps.map(([action, expected, src]) => ({ action, expected, source: src || 'inferred' })),
}));

fs.writeFileSync(path.join(OUT_DIR, 'manual-cases.json'), JSON.stringify(json, null, 1));
fs.writeFileSync(path.join(OUT_DIR, 'MOTADATA-9593_testcases.csv'), csv);

const byTag = {};
for (const c of C) for (const t of c.tags) byTag[t] = (byTag[t] || 0) + 1;
const bySrc = {};
for (const c of C) for (const s of c.steps) bySrc[s[2] || 'inferred'] = (bySrc[s[2] || 'inferred'] || 0) + 1;
console.log(`cases: ${C.length}   steps: ${C.reduce((n, c) => n + c.steps.length, 0)}`);
console.log('by tag:', JSON.stringify(byTag, null, 0));
console.log('by grounding:', JSON.stringify(bySrc, null, 0));
