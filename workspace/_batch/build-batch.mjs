#!/usr/bin/env node
/*
 * build-batch — authored suites for the 8.2.8 batch. Writes workspace/<KEY>/manual-cases.json
 * for every KEY in SUITES, then each is validated/emitted/published by:
 *
 *   node scripts/cases.mjs <KEY> --resume --publish
 *
 *   node workspace/_batch/build-batch.mjs            # all
 *   node workspace/_batch/build-batch.mjs 9575 9642  # a subset
 *
 * GROUNDING read live out of the knowledge graphs via scripts/kg.mjs:
 *  - nms/CollectorResponseProcessor.java L166-L205 — the AVAILABILITY/ABORT path, the exact
 *    9-plugin case list, the tautological `|| ` guard at L191, ObjectStatusCacheStore.updateItem
 *  - store/SNMPDeviceCatalogConfigStore.java L37-L72 — TBL_SNMP_DEVICE_CATALOG, OID->type lookup
 *    returning null on no match, CONFIG_TEMPLATE_CATALOG_IDS multi-value reference
 *  - nms/DiscoveryEngine.java .runPingCheck()/.runPortCheck(), NMSConstants .pingCheckRequire()/
 *    .portCheckRequire(), MotadataConfigUtil .getPingCheckTimeoutSeconds()/.getPingCheckPackets()
 *  - knowledge/product/** for screen navigation and existing behaviour
 *
 * source tags: kg = read from shipped source · doc = knowledge/** · jira = stated in the ticket
 *              figma = must be confirmed against the ticket's design · inferred = unverified
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SUITES = {};
const suite = (key, cases) => { SUITES[key] = cases; };
/* c(title, tags, steps) — steps are [action, expected, source] */
const c = (title, tags, steps) => ({ title, tags, steps });

/* ================================================================ MOTADATA-9575
 * Tautological || guard overwrites a reported DOWN with UNKNOWN. */
const PLUGINS = 'PING, PORT, NTP, RADIUS, FTP, URL, DOMAIN, EMAIL, CERTIFICATE';
const REPRO = 'Provision an availability/service-check monitor and force the probe to return an event whose top-level status is DOWN with a null result body (probe timed out or errored before producing a body)';

suite('MOTADATA-9575', [
  c('DOWN from a bodyless probe result is preserved, not overwritten with UNKNOWN', ['Regression', 'Functional'], [
    [REPRO + ' on a PING monitor', 'The collector emits status=DOWN with result=null', 'jira'],
    ['Read the object status recorded in ObjectStatusCacheStore for that monitor', 'Status is DOWN. The guard at CollectorResponseProcessor.java:191 / ResponseProcessor.java:634 must read !isUP && !isDOWN; with the shipped || it is a tautology and always overwrites to UNKNOWN. Expect a fail until fixed', 'kg'],
    ['Open the monitor availability history for that interval', 'A DOWN interval is recorded — not an UNKNOWN gap', 'jira'],
  ]),
  c('UP from a bodyless probe result is preserved, not overwritten with UNKNOWN', ['Regression', 'Functional'], [
    ['Force a successful probe whose event carries status=UP with a null result body', 'Event reaches the PING..CERTIFICATE case branch', 'kg'],
    ['Read the recorded object status', 'Status is UP. The tautological guard clobbers UP to UNKNOWN just as it does DOWN — both rows of the truth table evaluate true', 'kg'],
  ]),
  c('An explicit status in the result body still wins over the event status', ['Regression', 'Functional'], [
    ['Force a probe whose result body contains status=DOWN while the event top-level status is UP', 'The first branch fires because result != null && result.containsKey(STATUS)', 'kg'],
    ['Read the recorded object status', 'Status is DOWN — taken from the result body, and the UNKNOWN normalisation branch is never reached', 'kg'],
  ]),
  c('A genuinely indeterminate status is still normalised to UNKNOWN', ['Regression', 'Edge'], [
    ['Force a probe whose event status is neither UP nor DOWN (e.g. an empty or garbage status) with a null result body', 'The normalisation branch is reached', 'kg'],
    ['Read the recorded object status', 'Status is UNKNOWN. Fixing || to && must NOT remove this behaviour — the branch has to still fire for a value that is neither UP nor DOWN', 'kg'],
  ]),
  c('DOWN-triggered alert policy fires for a bodyless DOWN probe', ['Impacted', 'Regression'], [
    ['Create an availability alert policy that triggers on DOWN for a PING monitor, then ' + REPRO.toLowerCase(), 'Policy is active and the probe reports DOWN', 'jira'],
    ['Check Active Alerts', 'A DOWN alert is raised for the monitor. This is the customer-visible symptom of the bug — a real outage currently produces no alert', 'jira'],
  ]),
  c('Availability report shows downtime, not an UNKNOWN gap', ['Impacted', 'Reports'], [
    ['Produce a bodyless DOWN interval on a monitor, then run the availability report for that window', 'Report generates', 'jira'],
    ['Inspect the interval', 'It is counted as downtime. Currently it lands as UNKNOWN, which understates the outage', 'jira'],
  ]),
  c('SLO/availability percentage accounts for the DOWN interval', ['Impacted', 'Regression'], [
    ['Note the availability percentage for a monitor, force a 10-minute bodyless DOWN interval, then re-read it', 'Percentage is recalculated', 'inferred'],
    ['Compare', 'Availability drops by the outage duration. An UNKNOWN gap must not silently preserve a 100% figure', 'jira'],
  ]),
  ...['PING', 'PORT', 'NTP', 'RADIUS', 'FTP', 'URL', 'DOMAIN', 'EMAIL', 'CERTIFICATE'].map((p) =>
    c(`${p} monitor preserves a reported DOWN through the shared normalisation branch`, ['Regression'], [
      [`Provision a ${p} service-check monitor and force a bodyless DOWN probe result`, 'Probe reports DOWN with result=null', 'kg'],
      ['Read the recorded object status', `Status is DOWN. All of ${PLUGINS} share the one case branch, so every plugin in the family regresses together and must be verified together`, 'kg'],
    ])),
  c('EdgeCollector topology preserves a reported DOWN', ['Regression', 'Impacted'], [
    ['Deploy with an EdgeCollector and route an availability monitor through it, then force a bodyless DOWN', 'Event flows through CollectorResponseProcessor', 'kg'],
    ['Read the recorded object status', 'Status is DOWN. This is the collector-side copy of the defect at CollectorResponseProcessor.java:191', 'kg'],
  ]),
  c('Standalone/Primary topology preserves a reported DOWN', ['Regression', 'Impacted'], [
    ['On a Standalone or Primary deployment, force a bodyless DOWN on an availability monitor', 'Event flows through ResponseProcessor', 'kg'],
    ['Read the recorded object status', 'Status is DOWN. This is the app-side copy at ResponseProcessor.java:634 — no deployment topology is unaffected, so both must be fixed and both tested', 'jira'],
  ]),
  c('AVAILABILITY plugin ABORT carries forward the previous status', ['Regression', 'Edge'], [
    ['Drive an AVAILABILITY-plugin monitor to a known UP state, then force an event with status=ABORT (poller over-utilisation)', 'The ABORT branch fires', 'kg'],
    ['Read the recorded object status', 'The previously cached status (UP) is carried forward from ObjectStatusCacheStore, not reset. Only an object with no cached entry becomes UNKNOWN', 'kg'],
  ]),
  c('AVAILABILITY plugin ABORT on a never-polled object yields UNKNOWN', ['Edge', 'Regression'], [
    ['Force an ABORT event for an AVAILABILITY monitor that has no entry in ObjectStatusCacheStore yet', 'The ABORT branch fires and existItem() is false', 'kg'],
    ['Read the recorded object status', 'Status is UNKNOWN — the documented fallback when nothing was cached', 'kg'],
  ]),
  c('AVAILABILITY plugin non-ABORT failure records DOWN', ['Regression'], [
    ['Force a non-ABORT failure event for an AVAILABILITY-plugin monitor', 'The else branch fires', 'kg'],
    ['Read the recorded object status', 'Status is DOWN — written unconditionally by that branch, independent of the PING..CERTIFICATE guard', 'kg'],
  ]),
  c('Status transition UP to DOWN to UP is recorded with correct timestamps', ['Regression', 'Edge'], [
    ['Drive a monitor UP, then bodyless DOWN, then UP again across three polls', 'Three events processed', 'kg'],
    ['Inspect the availability history', 'Exactly one DOWN interval bounded by the two poll timestamps; ObjectStatusCacheStore.updateItem is called with each event timestamp, so no interval is lost or merged', 'kg'],
  ]),
  c('Fix does not introduce flapping on repeated identical DOWN polls', ['Regression', 'Edge'], [
    ['Force five consecutive bodyless DOWN probes on one monitor', 'All five processed', 'inferred'],
    ['Check Active Alerts and availability history', 'One continuous DOWN interval and one alert — not five alerts and not five intervals', 'inferred'],
  ]),
  c('Concurrent probe results for many monitors do not cross-contaminate status', ['Edge', 'Regression'], [
    ['Force bodyless results simultaneously across 50 monitors — half DOWN, half UP', 'All processed', 'inferred'],
    ['Read every recorded status', 'Each monitor holds its own reported status; no monitor picks up another\'s value and none is UNKNOWN', 'inferred'],
  ]),
  c('default plugin branch still handles a failed ping check by error code', ['Regression'], [
    ['Force an event for a non-availability plugin carrying pingCheckStatus=NO and a known error code', 'The default branch fires', 'kg'],
    ['Inspect the resulting status and error handling', 'The error-code switch drives the outcome; the UP/DOWN normalisation guard is not involved and its fix must not change this path', 'kg'],
  ]),
  c('Monitor status tile and inventory reflect DOWN immediately', ['Impacted', 'Dashboard'], [
    ['Force a bodyless DOWN on a monitored device and watch the Monitors inventory and dashboard severity tiles', 'Status propagates', 'inferred'],
    ['Compare tile counts before and after', 'The device moves into the DOWN count, not into UNKNOWN', 'inferred'],
  ]),
  c('Existing UNKNOWN behaviour for an unreachable collector is unchanged', ['Regression', 'Impacted'], [
    ['Stop the collector polling a monitor so no probe result arrives at all', 'No event is produced', 'inferred'],
    ['Read the recorded object status', 'The pre-existing no-data handling applies unchanged; the || to && fix must not alter the genuinely-unknown case', 'inferred'],
  ]),
  c('Unit test coverage exists for all three truth-table rows', ['Regression', 'API'], [
    ['Review the automated tests covering the normalisation branch after the fix', 'Tests exist', 'inferred'],
    ['Confirm the cases asserted', 'UP stays UP, DOWN stays DOWN, and a neither-UP-nor-DOWN value becomes UNKNOWN — the three rows the ticket tabulates. A fix without all three is under-tested', 'jira'],
  ]),
  c('Both call sites are fixed, not just one', ['Regression', 'Security'], [
    ['Review ResponseProcessor.java around line 634 and CollectorResponseProcessor.java around line 191', 'Both sites visible', 'kg'],
    ['Compare the guards', 'Both read && — the code is byte-identical in the two files, so fixing one and shipping leaves half the deployments broken', 'jira'],
  ]),
]);

/* ================================================================ MOTADATA-9642
 * Linux (SNMP) / Windows (SNMP) missing from the device-type mapping. */
suite('MOTADATA-9642', [
  c('Add a Metric Group to a Linux (SNMP) device from the Device Catalogue', ['Functional'], [
    ['Login as admin (admin/admin); onboard a device as Linux (SNMP) and open its Device Catalogue', 'Device is in inventory with type Linux (SNMP)', 'jira'],
    ['Add / associate a new Metric Group', 'The Metric Group is created and associated successfully. This is the reported failure — currently the device type is absent from the supported mapping', 'jira'],
  ]),
  c('Add a Metric Group to a Windows (SNMP) device from the Device Catalogue', ['Functional'], [
    ['Onboard a device as Windows (SNMP) and open its Device Catalogue', 'Device is in inventory with type Windows (SNMP)', 'jira'],
    ['Add / associate a new Metric Group', 'The Metric Group is created and associated successfully', 'jira'],
  ]),
  c('Linux (SNMP) and Windows (SNMP) appear in the supported device-type list', ['Functional', 'UI'], [
    ['Open the device-type selector used when creating or assigning a Metric Group', 'Selector lists supported types', 'jira'],
    ['Look for Linux (SNMP) and Windows (SNMP)', 'Both are present and selectable alongside the previously supported types', 'jira'],
  ]),
  c('Test OID resolves for a Linux (SNMP) device', ['Functional'], [
    ['While creating a Metric Group for a Linux (SNMP) device, use the test-OID facility', 'Test runs against the device', 'jira'],
    ['Inspect the result', 'The device type is identified and the OID returns a value. The ticket states the test environment currently cannot identify these types for test OID', 'jira'],
  ]),
  c('Test OID resolves for a Windows (SNMP) device', ['Functional'], [
    ['While creating a Metric Group for a Windows (SNMP) device, use the test-OID facility', 'Test runs against the device', 'jira'],
    ['Inspect the result', 'The device type is identified and the OID returns a value', 'jira'],
  ]),
  c('SNMP device catalogue lookup returns a type for the new device types', ['Regression', 'API'], [
    ['Inspect the SNMP device catalogue entry whose OID matches a Linux (SNMP) device', 'A catalogue row exists in the SNMP device catalog', 'kg'],
    ['Verify the type resolution for that OID', 'getSNMPDeviceType(oid) returns the device type rather than null — the store matches on SNMP_DEVICE_CATALOG_OID case-insensitively and returns null when no row matches, which is the shape of the reported bug', 'kg'],
  ]),
  c('Unknown OID still resolves to no type without erroring', ['Edge', 'Negative'], [
    ['Query the catalogue with an OID that matches no catalogue row', 'Lookup completes', 'kg'],
    ['Inspect the outcome', 'No type is returned and the caller degrades gracefully — no exception, no partial Metric Group created', 'kg'],
  ]),
  c('OID matching is case-insensitive', ['Edge', 'Regression'], [
    ['Query the catalogue with the same OID in differing case', 'Both lookups complete', 'kg'],
    ['Compare results', 'Both resolve to the same device type — the store compares with equalsIgnoreCase', 'kg'],
  ]),
  c('Metric Group assignment survives a config-template reference', ['Impacted', 'Regression'], [
    ['Associate a Metric Group with a Linux (SNMP) device via a config template', 'Association saved', 'kg'],
    ['Re-open the config template', 'The catalogue id is retained in the template\'s multi-value catalog-ids reference; the association is not dropped on reload', 'kg'],
  ]),
  c('Polling collects the new Metric Group for Linux (SNMP)', ['Impacted', 'Functional'], [
    ['Associate a Metric Group with a Linux (SNMP) device and wait for one poll cycle', 'Poll completes', 'inferred'],
    ['Open Metric Explorer for that device and counter', 'Data points are present for the newly associated group', 'inferred'],
  ]),
  c('Previously supported device types still accept Metric Groups', ['Regression'], [
    ['Repeat the Metric Group association on a device type that already worked before this change (e.g. a network SNMP device)', 'Association succeeds', 'inferred'],
    ['Confirm behaviour', 'Unchanged — extending the mapping must not disturb existing types', 'jira'],
  ]),
  c('Duplicate Metric Group name is rejected for the new device types', ['Negative'], [
    ['Create a Metric Group for a Linux (SNMP) device reusing an existing group name', 'Submission attempted', 'inferred'],
    ['Inspect the result', 'A duplicate/not-unique validation error is shown and no second group is created', 'inferred'],
  ]),
  c('Metric Group create is rejected with a blank name or no counters', ['Negative'], [
    ['Attempt to create a Metric Group for a Windows (SNMP) device with a blank name, then with no counters selected', 'Both submissions attempted', 'inferred'],
    ['Inspect the result', 'Each raises its own required-field validation; nothing is created', 'inferred'],
  ]),
  c('Invalid OID is rejected when adding a counter', ['Negative', 'Edge'], [
    ['Add a counter to a Metric Group using a malformed OID (e.g. 1.3.6.1.abc) and test it', 'Test runs', 'inferred'],
    ['Inspect the result', 'A clear invalid-OID error is returned; the counter is not saved with an unusable OID', 'inferred'],
  ]),
  c('OID that the device does not expose fails clearly', ['Negative', 'Edge'], [
    ['Test a well-formed OID that the Linux (SNMP) target does not implement', 'Test runs', 'inferred'],
    ['Inspect the result', 'A no-such-object / no-data error is reported rather than a silent success or a zero value', 'inferred'],
  ]),
  c('RBAC: a non-admin cannot create or assign Metric Groups', ['Security', 'Negative'], [
    ['Log in as a user whose role lacks metric-configuration rights and open a Linux (SNMP) device catalogue', 'Screen opens or is blocked per role', 'doc'],
    ['Attempt to add a Metric Group', 'The action is unavailable or rejected; no group is created', 'doc'],
  ]),
  c('XSS payload in a Metric Group name is neutralised', ['Security', 'Negative'], [
    ['Create a Metric Group named <script>alert(1)</script> for a Windows (SNMP) device', 'Submission attempted', 'inferred'],
    ['View the group in the catalogue and in Metric Explorer', 'Either validation rejects it or it renders escaped as literal text; no script executes', 'inferred'],
  ]),
  c('SNMP credential failure during test OID is reported distinguishably', ['Negative', 'Impacted'], [
    ['Point a Linux (SNMP) device at a wrong SNMP community and run test OID', 'Test runs', 'doc'],
    ['Inspect the error', 'The message identifies a credential/authentication failure rather than a generic timeout — credential errors are a documented top cause of missing data', 'doc'],
  ]),
  c('Unicode and long Metric Group names round-trip', ['Edge'], [
    ['Create Metric Groups for a Linux (SNMP) device with a 255-character name and with a Devanagari name', 'Submissions attempted', 'inferred'],
    ['Reload the catalogue', 'Either both are accepted and display intact, or a clear max-length validation fires — no silent truncation or mojibake', 'inferred'],
  ]),
  c('Audit records Metric Group create and assignment', ['Audit', 'Functional'], [
    ['Create and then assign a Metric Group to a Linux (SNMP) device', 'Both actions complete', 'inferred'],
    ['Open the audit trail', 'Separate records exist for create and assign, naming the actor, the device and the timestamp', 'inferred'],
  ]),
  c('Upgrade path adds the mapping for existing installs', ['Regression', 'Lifecycle'], [
    ['Upgrade an install that already has Linux (SNMP) and Windows (SNMP) devices onboarded', 'Upgrade completes', 'kg'],
    ['Open the Device Catalogue for one of those pre-existing devices', 'Metric Groups can now be added without re-onboarding — the mapping is applied by patch, consistent with how metric-group attachment patches ship', 'kg'],
  ]),
]);

/* ================================================================ MOTADATA-9603
 * OOTB kubernetes.container.memory.percent KPI. */
const KPI = 'kubernetes.container.memory.percent';
suite('MOTADATA-9603', [
  c(`${KPI} is available OOTB with no manual configuration`, ['Functional'], [
    ['Login as admin; on a fresh install with Kubernetes container monitoring configured, open Metric Explorer for a container object', 'Counter list loads', 'jira'],
    [`Search the counter list for ${KPI}`, 'The KPI is present without any derived counter having been created by hand', 'jira'],
  ]),
  c('KPI value equals bytes divided by limit bytes times 100', ['Functional', 'Regression'], [
    ['For one container, read kubernetes.container.memory.bytes and kubernetes.container.memory.limit.bytes for the same collection interval', 'Both source values available', 'jira'],
    [`Read ${KPI} for that interval and compute (bytes / limit.bytes) * 100`, 'The KPI matches the computed value at the documented precision', 'jira'],
  ]),
  c('KPI is derived without any new collection', ['Regression', 'Impacted'], [
    ['Compare the collection configuration and poll traffic for the container plugin before and after the KPI is enabled', 'Both captured', 'jira'],
    ['Compare', 'No additional OID/API call or poll is introduced — the KPI is computed from the two counters already collected', 'jira'],
  ]),
  c('Zero memory limit does not raise a division-by-zero or emit a bad value', ['Edge', 'Negative'], [
    ['Configure or simulate a container whose kubernetes.container.memory.limit.bytes is 0 for an interval', 'Interval is collected', 'jira'],
    [`Inspect ${KPI} for that interval`, 'No value is emitted for the interval and no error/exception is logged — the KPI must not record 0, infinity or NaN', 'jira'],
  ]),
  c('KPI is not computed when one source counter is missing for the interval', ['Edge', 'Regression'], [
    ['Force an interval where memory.bytes is collected but limit.bytes is absent (or vice versa)', 'Interval is collected partially', 'jira'],
    [`Inspect ${KPI}`, 'No value is emitted for that interval — the KPI computes only when both sources are valid for the same container and the same interval', 'jira'],
  ]),
  c('Source counters are unchanged in definition and value', ['Regression', 'Impacted'], [
    ['Record the definition, unit and a sample of values for kubernetes.container.memory.bytes and kubernetes.container.memory.limit.bytes before the change', 'Baseline captured', 'jira'],
    ['Compare after the KPI ships', 'Both are byte-identical in definition, collection and values — adding the derived KPI must not alter them', 'jira'],
  ]),
  c('limit.bytes is exposed OOTB alongside the new KPI', ['Functional', 'Regression'], [
    ['Open the counter list for a Kubernetes container object', 'Counter list loads', 'jira'],
    ['Look for kubernetes.container.memory.limit.bytes', 'It is now an OOTB counter rather than internal-only, per the agreement recorded on the ticket', 'jira'],
  ]),
  c('KPI is selectable in Metric Explorer', ['Functional'], [
    [`Open Metric Explorer, pick a container object and select ${KPI}`, 'Chart renders', 'jira'],
    ['Inspect the chart', 'Values plot as a percentage with a % unit and a sensible 0-100 axis', 'inferred'],
  ]),
  c('KPI is usable in a dashboard widget', ['Functional', 'Dashboard'], [
    [`Create a dashboard widget on ${KPI} for a container`, 'Widget saves', 'jira'],
    ['View the dashboard', 'The widget renders the same values as Metric Explorer for the same window', 'inferred'],
  ]),
  c('KPI is usable in a report', ['Functional', 'Reports'], [
    [`Build a report including ${KPI} and run it`, 'Report generates', 'jira'],
    ['Compare against Metric Explorer for the same window', 'Values and unit agree', 'inferred'],
  ]),
  c('KPI is usable in an alert policy and breaches correctly', ['Functional', 'Impacted'], [
    [`Create a metric alert policy on ${KPI} with a threshold of 80% critical, then drive a container above it`, 'Policy is active', 'jira'],
    ['Check Active Alerts', 'A critical alert is raised with the converted percentage in the alert, and clears when utilisation drops below the threshold', 'inferred'],
  ]),
  c('KPI appears for every container in a multi-container pod', ['Edge', 'Functional'], [
    ['Monitor a pod running three containers with different memory limits', 'All three are discovered', 'inferred'],
    [`Read ${KPI} per container`, 'Each container has its own value computed from its own limit — values are not shared or aggregated across containers in the pod', 'inferred'],
  ]),
  c('Container with no memory limit set is handled', ['Edge', 'Negative'], [
    ['Monitor a container that declares no memory limit in its spec', 'Container is discovered', 'inferred'],
    [`Inspect ${KPI}`, 'The KPI is absent or explicitly not-applicable for that container, and no invalid value is stored', 'jira'],
  ]),
  c('Utilisation above 100% is represented faithfully', ['Edge'], [
    ['Drive a container to use more than its declared limit if the runtime permits', 'Interval collected', 'inferred'],
    [`Inspect ${KPI}`, 'The value is reported as computed rather than silently clamped to 100, or clamping is documented and consistent between UI, reports and alerts', 'inferred'],
  ]),
  c('Precision matches the UI and Reports convention', ['Regression', 'Edge'], [
    [`Read the same ${KPI} interval in Metric Explorer, a report and an alert`, 'All three render the value', 'jira'],
    ['Compare the decimal places', 'Identical precision in all three — the ticket requires the conversion precision to match existing UI/Reports behaviour', 'jira'],
  ]),
  c('Historical data is not back-filled or corrupted', ['Regression', 'Lifecycle'], [
    ['Note the stored history for the two source counters before enabling the KPI', 'Baseline captured', 'inferred'],
    [`Enable the KPI and re-inspect`, 'Source history is untouched; the KPI has data only from the point it became available, with no fabricated retro values', 'inferred'],
  ]),
  c('KPI survives an upgrade of an install with existing Kubernetes monitors', ['Regression', 'Lifecycle'], [
    ['Upgrade an install already monitoring Kubernetes containers', 'Upgrade completes', 'inferred'],
    [`Check ${KPI} on a pre-existing container object`, 'The KPI is present and collecting without re-onboarding the cluster', 'inferred'],
  ]),
  c('RBAC: KPI visibility follows existing counter permissions', ['Security'], [
    [`Log in as a user whose role can view the container object, then as one who cannot`, 'Both sessions established', 'doc'],
    [`Attempt to read ${KPI}`, 'Visibility matches the existing per-object permission model — the new KPI introduces no privilege bypass', 'inferred'],
  ]),
  c('API exposes the KPI under its documented name', ['API', 'Functional'], [
    [`Query the metric API for ${KPI} on a container object`, 'HTTP 200', 'inferred'],
    ['Inspect the payload', `The counter is named exactly ${KPI} with a percent unit — no alternative spelling or alias`, 'jira'],
  ]),
  c('No duplicate or shadow counter is introduced', ['Regression', 'Negative'], [
    ['Search the counter list for names containing kubernetes.container.memory', 'All matches listed', 'inferred'],
    ['Review the list', 'Exactly the expected set — bytes, limit.bytes, limit.percent and the new percent. No duplicate, no leftover manually-derived counter shadowing the OOTB one', 'jira'],
  ]),
  c('Existing limit.percent counter is unaffected', ['Regression', 'Impacted'], [
    ['Record values for the pre-existing kubernetes.container.memory.limit.percent counter', 'Baseline captured', 'jira'],
    ['Compare after the new KPI ships', 'Unchanged, and clearly distinguishable from the new percent KPI in every selector so users do not pick the wrong one', 'inferred'],
  ]),
]);

/* ================================================================ MOTADATA-9467
 * Human-readable metric values in alert email templates. */
suite('MOTADATA-9467', [
  c('Throughput value in an alert email is converted, not raw bps', ['Functional', 'Regression'], [
    ['Login as admin; create a metric alert policy on a network throughput counter with an email notification, then breach it at roughly 21890802 bps', 'Alert fires and the email is delivered', 'jira'],
    ['Read the metric value in the email', 'It reads as a converted unit (e.g. 20.88 Mbps), not the raw 21890802. This is the reported defect', 'jira'],
  ]),
  c('Email value matches what the UI shows for the same alert', ['Functional', 'Regression'], [
    ['Breach a throughput policy and open the resulting alert in Active Alerts', 'Alert detail shows the converted value', 'jira'],
    ['Compare against the email for the same alert', 'Value, unit and precision are identical. The ticket requires the email to reuse the UI/Reports conversion logic, not a second implementation', 'jira'],
  ]),
  c('Email value matches what a report shows for the same interval', ['Functional', 'Reports'], [
    ['Run a report covering the breach interval for the same counter', 'Report renders the converted value', 'jira'],
    ['Compare against the email', 'Identical value, unit and precision across UI, report and email', 'jira'],
  ]),
  ...[['bps', 'Kbps', '1500 bps'], ['Kbps', 'Mbps', '2500 Kbps'], ['Mbps', 'Gbps', '4096 Mbps'], ['Gbps', 'Tbps', '2048 Gbps']].map(([from, to, sample]) =>
    c(`Throughput converts from ${from} to ${to} at the boundary`, ['Functional', 'Edge'], [
      [`Breach a throughput policy at a value around ${sample}`, 'Alert email is delivered', 'jira'],
      ['Read the value and unit in the email', `It is expressed in ${to} with the numeric value scaled accordingly, matching the UI for the same input`, 'jira'],
    ])),
  c('Converted value always carries its unit', ['Functional', 'UI'], [
    ['Breach policies on several convertible counters and collect the emails', 'Emails delivered', 'jira'],
    ['Inspect each metric value', 'Every converted value shows both the number and its unit — never a bare number whose scale the reader has to guess', 'jira'],
  ]),
  c('Byte/storage counters are converted in email', ['Functional'], [
    ['Breach a policy on a disk or memory counter reported in bytes', 'Alert email delivered', 'jira'],
    ['Read the value', 'Expressed in the appropriate KB/MB/GB/TB unit, matching the UI', 'jira'],
  ]),
  c('Time/duration counters are converted in email', ['Functional'], [
    ['Breach a policy on a counter reported in milliseconds or seconds', 'Alert email delivered', 'jira'],
    ['Read the value', 'Expressed in the unit the UI uses for that counter with matching precision', 'jira'],
  ]),
  c('Percentage counters are not double-converted', ['Regression', 'Negative'], [
    ['Breach a policy on a CPU or memory percentage counter', 'Alert email delivered', 'jira'],
    ['Read the value', 'Shown as a percentage exactly as the UI shows it — not rescaled or given a throughput unit', 'inferred'],
  ]),
  c('Unitless counters are unchanged', ['Regression'], [
    ['Breach a policy on a unitless counter such as a session or error count', 'Alert email delivered', 'jira'],
    ['Read the value', 'Rendered as the plain number with no invented unit', 'jira'],
  ]),
  c('Zero and very small values render sensibly', ['Edge'], [
    ['Breach a throughput policy at 0 bps, then at 1 bps', 'Both emails delivered', 'inferred'],
    ['Read both values', 'Rendered as 0 bps and 1 bps in the base unit — not as 0.000001 Mbps or an empty value', 'inferred'],
  ]),
  c('Very large values scale to the top unit without overflow', ['Edge'], [
    ['Breach a throughput policy at a value in the Tbps range', 'Email delivered', 'jira'],
    ['Read the value', 'Scaled to the highest supported unit, readable, with no scientific notation or truncation', 'jira'],
  ]),
  c('Negative or invalid metric values do not break the template', ['Edge', 'Negative'], [
    ['Force an alert whose metric value is negative or null', 'Email delivered', 'inferred'],
    ['Inspect the email', 'The template renders a safe placeholder and still delivers; it does not fail to send or print a stack trace', 'inferred'],
  ]),
  c('Decimal precision matches the UI rather than being rounded away', ['Regression', 'Edge'], [
    ['Breach a policy at a value with meaningful decimals (e.g. 20.88 Mbps)', 'Email delivered', 'jira'],
    ['Compare the decimals against the UI', 'Same number of decimal places; the conversion precision must match existing UI/Reports behaviour', 'jira'],
  ]),
  c('Scope is metric notifications only, as implemented', ['Regression', 'Impacted'], [
    ['Trigger an availability/service-check alert email and a metric alert email', 'Both delivered', 'jira'],
    ['Compare the value rendering', 'Conversion applies to metric-related notification data. The dev comment on the ticket limits the delivered scope to metric notifications — confirm any non-metric template is intentionally unchanged rather than silently missed', 'jira'],
  ]),
  c('Teams and Slack channels are consistent with email or explicitly out of scope', ['Impacted', 'Workflow'], [
    ['Configure a policy to notify by email, Microsoft Teams and Slack, then breach it', 'All three notifications are delivered', 'jira'],
    ['Compare the metric value across channels', 'Either all three show the converted value, or the ticket\'s stated backend-conversion intent is not yet met for the other channels — the reviewer comment warns that email-only conversion creates exactly this inconsistency', 'jira'],
  ]),
  c('Alert email macros other than the metric value are unaffected', ['Regression'], [
    ['Breach a policy whose email template uses monitor name, severity, timestamp and policy name macros', 'Email delivered', 'inferred'],
    ['Inspect every macro', 'All resolve as before; only the metric value rendering changed', 'inferred'],
  ]),
  c('A custom email template picks up conversion too', ['Functional', 'Impacted'], [
    ['Customise the alert email template for a policy, keeping the metric value macro, then breach it', 'Email delivered', 'inferred'],
    ['Read the value', 'Converted the same way as the default template — conversion lives in the value rendering, not in one hard-coded template', 'jira'],
  ]),
  c('Clear/recovery email uses the same conversion', ['Regression', 'Functional'], [
    ['Breach a throughput policy then let it recover so a clear email is sent', 'Both emails delivered', 'inferred'],
    ['Compare value rendering in the breach and clear emails', 'Both converted identically', 'inferred'],
  ]),
  c('No conversion is applied twice on a re-notified alert', ['Edge', 'Regression'], [
    ['Configure repeat notification on a breached policy and let it re-notify several times', 'Multiple emails delivered', 'inferred'],
    ['Compare the values', 'Every email shows the same converted value — the number is not rescaled again on each send', 'inferred'],
  ]),
  c('XSS/injection through a metric or monitor name in email is neutralised', ['Security', 'Negative'], [
    ['Name a monitor <script>alert(1)</script> and breach a policy on it so an email is sent', 'Email delivered', 'inferred'],
    ['Open the email in an HTML-rendering client', 'The name is escaped as literal text; no script or remote content executes from the template', 'inferred'],
  ]),
  c('Existing alerts and history are not rewritten', ['Regression', 'Impacted'], [
    ['Note the stored raw values for alerts raised before the change', 'Baseline captured', 'jira'],
    ['Re-inspect after the change', 'Stored data is untouched — conversion happens at render time only, so historical accuracy and any downstream integration consuming raw values are preserved', 'jira'],
  ]),
  c('Email rendering does not measurably slow notification delivery', ['Non-Functional'], [
    ['Breach 50 policies with email notification simultaneously', 'All emails are delivered', 'inferred'],
    ['Measure the delivery latency against a pre-change baseline', 'No material regression from the added conversion work', 'inferred'],
  ]),
]);

/* ================================================================ MOTADATA-9631
 * Bulk approval workflow for NCCM with device-level approval + execution tracking. */
const OPS = ['Firmware Upgrade', 'Configuration Sync', 'Backup Restore', 'Runbook Execution'];
const NCCM_APPR = 'Login as admin (admin/admin); navigate NCCM > Approval';

suite('MOTADATA-9631', [
  c('AC1 One bulk request is created for a multi-device NCCM operation', ['Functional'], [
    ['Login as admin (admin/admin); run a Runbook Execution against 100 NCCM devices', 'Operation is submitted for approval', 'jira'],
    [NCCM_APPR, 'Exactly ONE approval request represents all 100 devices — not 100 individual requests', 'jira'],
  ]),
  c('AC2 Bulk badge is shown in the approval listing', ['Functional', 'UI'], [
    [NCCM_APPR + ' with a bulk request present', 'Listing loads', 'jira'],
    ['Inspect the bulk request row', 'A "Bulk" badge distinguishes it from single-device requests', 'jira'],
  ]),
  c('AC3 Parent request shows aggregated Pending / Approved / Rejected counters', ['Functional', 'UI'], [
    ['Create a bulk request over 100 devices, approve 50 and reject 30', 'Actions complete', 'jira'],
    ['Read the parent request row', 'Counters read Pending 20 | Approved 50 | Rejected 30 and total 100', 'jira'],
  ]),
  c('AC3 Counters update live as device decisions are made', ['Functional', 'Regression'], [
    ['Open a bulk request with all devices pending and note the counters', 'Pending equals the device count', 'jira'],
    ['Approve 5 devices and re-read the parent row', 'Pending drops by 5 and Approved rises by 5 without a manual refresh, and the three counters always sum to the device total', 'inferred'],
  ]),
  c('AC4 Clicking a bulk request opens a drawer listing all its devices', ['Functional'], [
    [NCCM_APPR + ' and click a bulk request', 'A drawer opens', 'jira'],
    ['Inspect the drawer', 'Every device in the request is listed with its own status', 'jira'],
  ]),
  c('AC5 Approver can select all pending devices at once', ['Functional'], [
    ['Open a bulk request drawer containing pending, approved and rejected devices', 'Drawer lists all devices', 'jira'],
    ['Use Select All Pending', 'Only the pending devices become selected; approved and rejected devices are not selected', 'jira'],
  ]),
  c('AC5 Approver can select an individual pending device', ['Functional'], [
    ['Open a bulk request drawer', 'Drawer lists devices', 'jira'],
    ['Tick one pending device', 'That device alone is selected and the approve/reject actions become available', 'jira'],
  ]),
  c('AC5 Approver can multi-select several pending devices', ['Functional'], [
    ['Open a bulk request drawer with at least 5 pending devices', 'Drawer lists devices', 'jira'],
    ['Tick three pending devices', 'All three are selected and a single approve action applies to exactly those three', 'jira'],
  ]),
  c('AC6 Already approved devices are visible but not selectable', ['Functional', 'Negative'], [
    ['Open a bulk request drawer containing previously approved devices', 'Drawer lists them', 'jira'],
    ['Attempt to select an approved device', 'It is displayed with Approved status but its selection control is disabled', 'jira'],
  ]),
  c('AC7 Already rejected devices are visible but not selectable', ['Functional', 'Negative'], [
    ['Open a bulk request drawer containing previously rejected devices', 'Drawer lists them', 'jira'],
    ['Attempt to select a rejected device', 'It is displayed with Rejected status but its selection control is disabled', 'jira'],
  ]),
  c('AC8 Only pending devices remain selectable', ['Functional', 'Regression'], [
    ['Open a drawer with a mix of pending, approved and rejected devices', 'Drawer lists all', 'jira'],
    ['Use Select All Pending and count the selection', 'The selected count equals the Pending counter exactly', 'jira'],
  ]),
  c('AC9/AC10 Clicking a device name shows its requested change comparison', ['Functional'], [
    ['Open a bulk request drawer and click a device name', 'A comparison view opens', 'jira'],
    ['Inspect the comparison', 'It shows the requested change for that specific device — running vs proposed configuration', 'jira'],
  ]),
  c('AC11 Comparison matches the existing single-device approval experience', ['Functional', 'Regression'], [
    ['Open the comparison for a device inside a bulk request, then open a single-device approval comparison', 'Both views open', 'jira'],
    ['Compare the two', 'Same layout, same diff rendering and same controls — the bulk drawer reuses the existing experience rather than a divergent one', 'jira'],
  ]),
  c('AC12/AC13 Approval requires a mandatory comment', ['Functional', 'Negative'], [
    ['Select pending devices in a bulk drawer and trigger Approve, leaving the comment blank', 'Approve dialog opens', 'jira'],
    ['Submit without a comment', 'Validation blocks submission — the approval comment is mandatory and nothing is approved', 'jira'],
  ]),
  c('AC14 Approved device status becomes Approved and its task executes automatically', ['Functional', 'Workflow'], [
    ['Approve two selected pending devices with a comment', 'Approval is accepted', 'jira'],
    ['Watch those two devices in the drawer', 'Each becomes Approved and its requested task starts executing automatically without a further trigger', 'jira'],
  ]),
  c('AC14 Execution status is recorded per device', ['Functional', 'Workflow'], [
    ['Approve devices so their tasks execute, letting at least one succeed and one fail', 'Executions complete', 'jira'],
    ['Inspect each device row', 'Each carries its own execution status; a failure on one device does not hide or alter another device\'s status', 'jira'],
  ]),
  c('AC15 Approved devices are no longer selectable', ['Functional', 'Regression'], [
    ['Approve a selection of devices', 'They become Approved', 'jira'],
    ['Attempt to select them again', 'Their selection controls are disabled — an approved device cannot be re-approved or then rejected', 'jira'],
  ]),
  c('AC16/AC17 Rejection applies to selected pending devices with a comment', ['Functional', 'Negative'], [
    ['Select pending devices, trigger Reject and submit with a comment', 'Rejection is accepted', 'jira'],
    ['Inspect those devices', 'Each becomes Rejected, no task executes for them, and they are no longer selectable', 'jira'],
  ]),
  c('Partial approval leaves the remaining devices pending', ['Functional', 'Impacted'], [
    ['On a 100-device bulk request approve 40 and take no action on the other 60', 'Approval completes', 'jira'],
    ['Read the parent counters', 'Pending 60 | Approved 40 | Rejected 0 — the risk-based partial-approval business case', 'jira'],
  ]),
  c('Devices in one bulk request can have different outcomes', ['Functional', 'Impacted'], [
    ['On one bulk request approve some devices, reject others and leave the rest pending', 'All actions complete', 'jira'],
    ['Inspect the drawer', 'Three distinct device states coexist under a single approval workflow', 'jira'],
  ]),
  ...OPS.map((op) => c(`Bulk approval works for ${op}`, ['Functional'], [
    [`Run ${op} against 10 NCCM devices as a single operation`, 'One bulk approval request is created', 'jira'],
    ['Approve 5 devices and inspect the result', `Only the 5 approved devices have their ${op} executed; the other 5 stay pending with no execution`, 'jira'],
  ])),
  c('Reminder can be sent only for devices still pending', ['Functional', 'Impacted'], [
    ['On a bulk request with pending, approved and rejected devices, send a reminder', 'Reminder is sent', 'jira'],
    ['Inspect who was reminded', 'Only the pending devices are included; approved and rejected devices are unaffected', 'jira'],
  ]),
  c('Cancellation is available per device and leaves decided devices alone', ['Functional', 'Lifecycle'], [
    ['Cancel a subset of pending devices in a bulk request', 'Cancellation completes', 'jira'],
    ['Inspect the request', 'Only the cancelled devices change state; approved, rejected and other pending devices are untouched, and cancelled devices execute nothing', 'jira'],
  ]),
  c('Per-device audit trail records approver, comment and outcome', ['Audit', 'Functional'], [
    ['Approve some devices and reject others with distinct comments', 'Actions complete', 'jira'],
    ['Open the audit trail for the request', 'Every device has its own record with approver identity, decision, comment, timestamp and execution status', 'jira'],
  ]),
  c('GAP Notification behaviour for bulk actions is not agreed', ['Negative', 'Workflow'], [
    ['Approve devices in a bulk request and collect the resulting notifications', 'Notifications are delivered', 'jira'],
    ['Count the emails', 'The ticket comments CONFLICT — one states bulk notifications trigger individually per device, another states bulk approval sends a single email, and the latest comment asks for templates that have not been supplied. This case cannot pass until the team fixes the expected behaviour', 'jira'],
  ]),
  c('Single-device approval flow is unchanged', ['Regression', 'Impacted'], [
    ['Run an NCCM operation against exactly one device', 'An approval request is created', 'jira'],
    ['Inspect the listing and approve it', 'It behaves as before with no Bulk badge and no drawer regression — introducing bulk must not alter the single-device path', 'jira'],
  ]),
  c('A single-device operation does not create a bulk request', ['Edge', 'Regression'], [
    ['Run an operation against one device, then against two devices', 'Both are submitted', 'inferred'],
    ['Compare the listings', 'The one-device operation produces a normal request; the two-device operation produces a bulk request. Confirm with the team whether the bulk threshold is 2 or configurable — the ticket says "multiple" without defining it', 'inferred'],
  ]),
  c('Concurrent approvals by two approvers do not double-execute a device', ['Edge', 'Security'], [
    ['Open the same bulk request as two approvers and approve the same device simultaneously', 'Both submit', 'inferred'],
    ['Inspect the device', 'It is approved once and its task executes once; the second submission is rejected or ignored as already-decided', 'inferred'],
  ]),
  c('Bulk request with a large device count stays usable', ['Non-Functional', 'Edge'], [
    ['Create a bulk request over 500 devices and open the drawer', 'Drawer opens', 'inferred'],
    ['Scroll, select all pending and approve', 'The drawer paginates or virtualises rather than hanging; counters stay correct and the approve action completes within a reasonable time', 'inferred'],
  ]),
  c('RBAC: a user without approval rights cannot approve or reject', ['Security', 'Negative'], [
    ['Log in as a user whose role lacks NCCM approval rights and open the approval listing', 'Access reflects the role', 'doc'],
    ['Attempt to approve or reject devices in a bulk request', 'The actions are unavailable or rejected; no device state changes', 'doc'],
  ]),
  c('RBAC: a requester cannot approve their own bulk request', ['Security', 'Negative'], [
    ['As a requester, raise a bulk NCCM operation and open the resulting request', 'Request is visible', 'inferred'],
    ['Attempt to approve it', 'Self-approval is blocked, or is explicitly permitted by documented policy — confirm the intended separation of duties with the team', 'inferred'],
  ]),
  c('XSS payload in the approval comment is neutralised', ['Security', 'Negative'], [
    ['Approve a device with the comment <script>alert(1)</script>', 'Comment is submitted', 'inferred'],
    ['View the comment in the drawer and the audit trail', 'Rendered escaped as literal text; no script executes', 'inferred'],
  ]),
  c('Execution failure on an approved device is surfaced, not swallowed', ['Negative', 'Workflow'], [
    ['Approve a device whose task will fail (e.g. make it unreachable first)', 'Approval succeeds and execution is attempted', 'jira'],
    ['Inspect the device row', 'Execution status shows the failure with a reason; the device stays Approved and the failure does not block other devices\' executions', 'jira'],
  ]),
]);

/* ================================================================ MOTADATA-9632
 * Approval Notification section in the Alerts & Notifications bell. */
suite('MOTADATA-9632', [
  c('Approver receives a bell notification when a new NCCM approval request is raised', ['Functional'], [
    ['Login as an approver; have another user raise a new NCCM approval request', 'Request is created', 'jira'],
    ['Open Alerts and Notifications (bell icon)', 'A notification for the new approval request is present', 'jira'],
  ]),
  c('Notifications appear under a section named "Approval Notification"', ['Functional', 'UI'], [
    ['Open the bell as a user with approval rights and at least one pending request', 'Panel opens', 'jira'],
    ['Read the section headings', 'A section titled exactly "Approval Notification" exists alongside the existing sections', 'jira'],
  ]),
  c('Approval Notification section shows the pending count', ['Functional', 'UI'], [
    ['Ensure exactly 3 approval requests are pending for the logged-in approver, then open the bell', 'Panel opens', 'jira'],
    ['Read the section header count', 'It reads 3, matching the pending approval requests', 'jira'],
  ]),
  c('Each entry shows Request Name, Requested By, Timestamp, Description and Status', ['Functional', 'UI'], [
    ['Open the Approval Notification section', 'Entries are listed', 'jira'],
    ['Inspect one entry', 'All five fields are present and populated: Request Name, Requested By, Timestamp, Description, Status', 'jira'],
  ]),
  c('Section layout matches the Figma reference', ['UI', 'Functional'], [
    ['Open the Approval Notification section', 'Section renders', 'jira'],
    ['Compare against Figma node-id 8640-112388 in the NCCM file', 'Section placement, count badge, row layout, field order and spacing match the design', 'figma'],
  ]),
  c('Only users with approval rights receive the notification', ['Security', 'Negative'], [
    ['Raise an NCCM approval request, then open the bell as a user WITHOUT approval rights', 'Panel opens', 'jira'],
    ['Look for an Approval Notification section or entry', 'Neither is shown — the notification targets only users holding approval rights', 'jira'],
  ]),
  c('Count decreases once a request is approved or rejected', ['Functional', 'Regression'], [
    ['Note the Approval Notification count, then approve one of the pending requests', 'Approval completes', 'inferred'],
    ['Re-open the bell', 'The count has decreased by one and the decided request is no longer listed as pending', 'inferred'],
  ]),
  c('Clicking a notification navigates to the approval request', ['Functional'], [
    ['Open the Approval Notification section and click an entry', 'Navigation occurs', 'inferred'],
    ['Inspect the destination', 'The corresponding NCCM approval request opens ready to action — confirm the intended target screen against Figma', 'inferred'],
  ]),
  c('Section is absent or empty-stated when nothing is pending', ['Edge', 'UI'], [
    ['As an approver with no pending approval requests, open the bell', 'Panel opens', 'inferred'],
    ['Inspect the Approval Notification area', 'Either the section is hidden or it shows a zero count with an empty state — not a broken or blank block', 'inferred'],
  ]),
  c('Existing notification sections are unaffected', ['Regression', 'Impacted'], [
    ['Note the bell contents (alerts and other existing sections) before the change', 'Baseline captured', 'jira'],
    ['Re-open the bell after the change', 'All pre-existing sections and their counts behave as before; only the new section is added', 'jira'],
  ]),
  c('Notification arrives in real time without a page reload', ['Functional', 'Non-Functional'], [
    ['Keep the bell panel open as an approver while another user raises a request', 'Request is created', 'inferred'],
    ['Watch the panel', 'The new entry and the incremented count appear without a manual refresh', 'inferred'],
  ]),
  c('Long request names and descriptions do not break the layout', ['Edge', 'UI'], [
    ['Raise a request with a 255-character name and a long multi-line description', 'Request is created', 'inferred'],
    ['Open the Approval Notification section', 'Text truncates or wraps within the row; the panel does not overflow horizontally and the other fields stay readable', 'inferred'],
  ]),
  c('Timestamp respects the user timezone and format convention', ['Edge', 'UI'], [
    ['Raise a request, then view its notification as users in two different timezone settings', 'Both see the entry', 'inferred'],
    ['Compare the timestamps', 'Each renders in the viewing user\'s timezone using the product\'s standard date-time format', 'inferred'],
  ]),
  c('Many pending approvals paginate or scroll rather than flooding the panel', ['Edge', 'Non-Functional'], [
    ['Create 50 pending approval requests for one approver and open the bell', 'Panel opens', 'inferred'],
    ['Inspect the section', 'Entries scroll or paginate with the true count shown; the panel opens promptly and stays usable', 'inferred'],
  ]),
  c('XSS payload in the request name or description is neutralised', ['Security', 'Negative'], [
    ['Raise an approval request whose description contains <img src=x onerror=alert(1)>', 'Request is created', 'inferred'],
    ['Open the Approval Notification section', 'The value renders escaped as literal text; no script executes', 'inferred'],
  ]),
  c('Bulk approval requests are represented sensibly in the section', ['Impacted', 'Edge'], [
    ['Raise a bulk NCCM approval request spanning 20 devices (see MOTADATA-9631) and open the bell', 'Notification appears', 'inferred'],
    ['Inspect the entry', 'One entry represents the bulk request rather than 20 separate entries — confirm the intended behaviour with the team, as the bulk ticket has an unresolved per-device vs single notification dispute', 'jira'],
  ]),
]);

/* ================================================================ MOTADATA-9653
 * NCCM connectivity validation must run from the device's assigned collector. */
suite('MOTADATA-9653', [
  c('NCCM onboarding validates connectivity from the assigned collector', ['Functional'], [
    ['Login as admin; discover a branch device through a branch Collector so it is in Inventory with that Collector assigned, and confirm polling works', 'Device is monitored successfully through its Collector', 'jira'],
    ['Onboard that device for NCCM from the Inventory screen', 'Connectivity validation runs from the assigned Collector and succeeds. Today it runs from the Main/Master server and fails with Ping/Port errors — the reported defect', 'jira'],
  ]),
  c('Branch device unreachable from master still onboards for NCCM', ['Functional', 'Regression'], [
    ['Set up a device reachable from its branch Collector but NOT from the Main/Master server', 'Device polls fine via the Collector', 'jira'],
    ['Onboard it for NCCM', 'Onboarding completes — reachability from the master is not required when a Collector is assigned', 'jira'],
  ]),
  c('Ping check is executed by the assigned collector, not the master', ['Regression', 'API'], [
    ['Onboard a Collector-assigned device for NCCM while watching where the ping originates', 'Validation runs', 'kg'],
    ['Inspect the source of the ping', 'The ping check executes on the assigned Collector. The discovery engine\'s ping-check routine must be dispatched to the Collector rather than run locally on the master', 'kg'],
  ]),
  c('Port check is executed by the assigned collector, not the master', ['Regression', 'API'], [
    ['Onboard a Collector-assigned device for NCCM whose SSH/Telnet port is reachable only from the Collector', 'Validation runs', 'kg'],
    ['Inspect the source of the port check', 'The port check executes on the assigned Collector and reports the port open', 'kg'],
  ]),
  c('Device with no collector assigned still validates from the master', ['Regression', 'Edge'], [
    ['Onboard a device that has no specific Collector assigned (master-polled)', 'Validation runs', 'jira'],
    ['Inspect the outcome', 'Validation runs from the Main/Master server exactly as before — the change must not break the default topology', 'jira'],
  ]),
  c('Genuine unreachability from the collector still fails clearly', ['Negative', 'Functional'], [
    ['Assign a Collector to a device, then make the device unreachable from that Collector too', 'Device is down from the Collector', 'jira'],
    ['Onboard it for NCCM', 'Onboarding fails with a Ping/Port connectivity error that names the Collector it was attempted from — the fix must not mask real failures', 'jira'],
  ]),
  c('Error message identifies which collector performed the check', ['Negative', 'UI'], [
    ['Trigger a failing NCCM connectivity validation on a Collector-assigned device', 'Validation fails', 'inferred'],
    ['Read the error', 'It states the Collector used, so an operator can tell a wrong-collector problem from a genuine unreachability', 'inferred'],
  ]),
  c('Ping check honours the configured timeout and packet count', ['Edge', 'Regression'], [
    ['Note the configured ping-check timeout and packet count, then onboard a device that drops ICMP', 'Validation runs', 'kg'],
    ['Measure the failure', 'It fails after the configured timeout using the configured packet count — the same configuration values as the existing discovery ping check, applied on the Collector', 'kg'],
  ]),
  c('Validation is skipped when ping check is not required', ['Edge', 'Regression'], [
    ['Onboard a device of a type/profile where ping check is not required', 'Onboarding proceeds', 'kg'],
    ['Inspect the flow', 'The ping check is skipped per the existing require-check logic rather than being forced and failing', 'kg'],
  ]),
  c('Multiple branches each validate through their own collector', ['Functional', 'Impacted'], [
    ['Assign Collector A to a device in branch A and Collector B to a device in branch B', 'Both poll successfully', 'jira'],
    ['Onboard both for NCCM', 'Each validates from its own Collector; neither is validated from the other branch\'s Collector or from the master', 'jira'],
  ]),
  c('Reassigning a device to another collector changes the validation source', ['Impacted', 'Regression'], [
    ['Onboard a device for NCCM via Collector A, then reassign it to Collector B', 'Reassignment saved', 'inferred'],
    ['Re-run NCCM connectivity validation', 'The check now runs from Collector B without needing to re-onboard the device', 'inferred'],
  ]),
  c('Collector down during onboarding produces a clear error', ['Negative', 'Edge'], [
    ['Stop the assigned Collector, then onboard its device for NCCM', 'Validation is attempted', 'inferred'],
    ['Read the error', 'It reports that the assigned Collector is unavailable rather than silently falling back to the master or hanging indefinitely', 'inferred'],
  ]),
  c('No silent fallback to the master when the collector check fails', ['Security', 'Regression'], [
    ['Make a device reachable from the master but not from its assigned Collector, then onboard it', 'Validation runs', 'inferred'],
    ['Inspect the outcome', 'Validation fails on the Collector result and does not quietly retry from the master — a silent fallback would reintroduce the bug in reverse and mislead the operator', 'inferred'],
  ]),
  c('Subsequent NCCM operations also use the assigned collector', ['Impacted', 'Functional'], [
    ['Onboard a branch device for NCCM through its Collector, then run a configuration backup on it', 'Operation runs', 'jira'],
    ['Inspect the operation', 'Backup connects through the assigned Collector too — onboarding validation and ongoing NCCM operations must agree on the path', 'inferred'],
  ]),
  c('Monitoring and polling are unaffected by the change', ['Regression', 'Impacted'], [
    ['Record polling health for a Collector-assigned device before the change', 'Baseline captured', 'jira'],
    ['Re-check after onboarding it for NCCM', 'Polling continues through the same Collector with no gap or duplication', 'jira'],
  ]),
  c('Bulk NCCM onboarding from Inventory respects per-device collectors', ['Edge', 'Functional'], [
    ['Select devices spanning two different Collectors in Inventory and onboard them for NCCM together', 'Bulk onboarding runs', 'inferred'],
    ['Inspect each device', 'Each is validated from its own assigned Collector; a single shared path is not used for the whole selection', 'inferred'],
  ]),
  c('Credential errors remain distinguishable from connectivity errors', ['Negative', 'Impacted'], [
    ['Onboard a Collector-reachable device for NCCM with wrong device credentials', 'Validation runs', 'doc'],
    ['Read the error', 'It reports a credential/authentication failure, not a Ping/Port connectivity failure — distinguishable credential errors are an existing documented requirement', 'doc'],
  ]),
  c('Audit records which collector performed the validation', ['Audit', 'Functional'], [
    ['Onboard a Collector-assigned device for NCCM', 'Onboarding completes', 'inferred'],
    ['Open the audit trail', 'The record names the device, the actor and the Collector used for validation', 'inferred'],
  ]),
  c('HA/failover: validation follows the surviving collector', ['Edge', 'Non-Functional'], [
    ['In a deployment with redundant Collectors, fail over the Collector assigned to a device', 'Failover completes', 'inferred'],
    ['Onboard or re-validate the device for NCCM', 'Validation runs from the surviving Collector rather than falling back to the master', 'inferred'],
  ]),
]);

/* ================================================================ MOTADATA-3818
 * Detailed NCM compliance reports. Reopened by PMG — three named defects. */
const RPT = 'Login as admin (admin/admin); navigate Reports';
suite('MOTADATA-3818', [
  c('Compliance reports are listed under the NCM tab', ['Functional', 'Reports'], [
    [RPT, 'Reports section loads', 'jira'],
    ['Open the NCM tab', 'Compliance reports are listed there', 'jira'],
  ]),
  c('A new "Compliance" category lists all compliance reports', ['Functional', 'Reports'], [
    [RPT + ' > NCM', 'Categories are listed', 'jira'],
    ['Click the "Compliance" category', 'All compliance reports are shown under it', 'jira'],
  ]),
  c('Executive Summary report renders as designed', ['Functional', 'Reports'], [
    [RPT + ' > NCM > Compliance and run the Executive Summary report', 'Report generates', 'jira'],
    ['Compare against Figma node-id 4685-48025 in the Reports file and the attached sample PDF', 'Sections, tables and figures match the design', 'figma'],
  ]),
  c('Audit Policy report renders as designed', ['Functional', 'Reports'], [
    [RPT + ' > NCM > Compliance and run the Audit Policy report', 'Report generates', 'jira'],
    ['Compare against Figma node-id 4685-48025 and the attached sample', 'Layout and content match. QA recorded that only the Executive Summary existed at one point — confirm this report is now actually present', 'jira'],
  ]),
  c('GAP All three designed reports exist', ['Negative', 'Reports'], [
    [RPT + ' > NCM > Compliance and list the available reports', 'List loads', 'jira'],
    ['Compare against the wireframe', 'The wireframe calls for three reports — Executive Summary, Audit Policy (CIS Cisco) and a per-device CIS report. QA logged that only Executive Summary was available. This case fails until all three ship', 'jira'],
  ]),
  c('Per-device compliance summary downloads from the PDF icon on the per-device screen', ['Functional', 'Reports'], [
    ['Open NCM compliance and drill into a single device\'s compliance screen', 'Per-device compliance screen loads', 'jira'],
    ['Click the PDF icon', 'The per-device compliance summary PDF downloads. This is the only entry point specified for it', 'jira'],
  ]),
  c('The same per-device report downloads from Export PDF on the NCM compliance tab', ['Functional', 'Reports'], [
    ['Open the NCM compliance tab', 'Tab loads with an Export PDF button', 'jira'],
    ['Click Export PDF', 'The same report content downloads as from the per-device PDF icon — identical data, not a different report', 'jira'],
  ]),
  c('GAP Device rule-level report exists', ['Negative', 'Reports'], [
    ['Look for a device rule-level compliance report', 'Report list is inspected', 'jira'],
    ['Confirm availability', 'PMG reopened this ticket specifically because the device rule-level report is missing; the developer states it was agreed for a future sprint. This case fails until the scope disagreement is settled by the team', 'jira'],
  ]),
  c('REOPENED Exported PDF matches the expected PDF format', ['Negative', 'Reports', 'UI'], [
    ['Export the Executive Summary PDF', 'PDF downloads', 'jira'],
    ['Compare page by page against the attached expected PDF', 'Layout, sections and tables match. PMG reopened the ticket stating the report PDF does not match the expected PDF. Expect a fail until fixed', 'jira'],
  ]),
  c('REOPENED Large numbers render readably in the compliance UI', ['Negative', 'UI'], [
    ['Open the NCM compliance screens on a dataset producing large counts', 'Screens load', 'jira'],
    ['Inspect the numeric fields and tiles', 'Values are formatted/abbreviated and fit their containers. PMG reopened the ticket stating some numbers are very huge in the UI. Expect a fail until fixed', 'jira'],
  ]),
  c('Long reports paginate rather than overflowing', ['Edge', 'Reports'], [
    ['Run a compliance report over enough devices and policies to exceed one page', 'Report generates', 'jira'],
    ['Inspect the PDF', 'Content paginates with repeated headers and no clipped rows — the ticket requires pagination when length exceeds the sample', 'jira'],
  ]),
  c('Last scan time is present in each report', ['Functional', 'Reports'], [
    ['Run each compliance report', 'Reports generate', 'jira'],
    ['Look for the last scan time', 'Each report shows the last scan time for the data it presents, as requested in the ticket comments', 'jira'],
  ]),
  c('Report data matches the compliance screen for the same policy', ['Functional', 'Regression'], [
    ['Note pass/fail counts for a compliance policy on the NCM compliance screen', 'Counts recorded', 'inferred'],
    ['Run the report for the same policy and window', 'Report figures match the screen exactly — no double counting and no stale cached figures', 'inferred'],
  ]),
  c('Custom compliance category report can be built and run', ['Functional', 'Reports'], [
    ['Create a custom report against a custom compliance category', 'Report is saved', 'jira'],
    ['Run it', 'It generates with the expected compliance data, as QA verified for custom compliance category reports', 'jira'],
  ]),
  c('Scheduled compliance report is delivered by email', ['Functional', 'Reports', 'Impacted'], [
    ['Schedule a compliance report to a reachable mailbox at the nearest run time', 'Schedule is created', 'jira'],
    ['Wait for the run', 'The email arrives with the report attached and its content matches an on-demand run of the same report', 'jira'],
  ]),
  c('GAP CSV and XLSX export support', ['Negative', 'Reports'], [
    ['Attempt to export a compliance report as CSV and as XLSX', 'Export is attempted', 'jira'],
    ['Inspect the result', 'QA logged that CSV and XLSX are not supported and raised MOTADATA-8430 separately. Confirm whether these formats are in scope here; if not, the option should not be offered', 'jira'],
  ]),
  c('Compliance policy run completes without a hanging loader', ['Negative', 'Regression'], [
    ['Run a compliance policy against a device set including one with no matching rule data', 'Policy run starts', 'jira'],
    ['Watch the screen', 'The run completes or fails with a message. QA hit a permanent loader caused by an ArrayIndexOutOfBounds in the compliance rule engine, tracked as MOTADATA-8440 — verify it does not reproduce through the report path', 'jira'],
  ]),
  c('Report generation works in an HA deployment', ['Non-Functional', 'Reports'], [
    ['Run and schedule a compliance report on an HA deployment, then fail over', 'Failover completes', 'jira'],
    ['Re-run and check the schedule', 'Reports generate on the surviving node and schedules still fire — the developer flagged HA as needing verification', 'jira'],
  ]),
  c('Report reflects the necessary backend config data', ['Regression', 'Impacted'], [
    ['Run a compliance report after a fresh compliance scan', 'Report generates', 'jira'],
    ['Compare its figures with the scan results', 'Values come from the populated compliance config data and are current — the backend was changed to write the data the report needs', 'jira'],
  ]),
  c('Empty state: report over a policy with no scanned devices', ['Edge', 'Negative'], [
    ['Run a compliance report for a policy that has never been scanned', 'Report generates', 'inferred'],
    ['Inspect the output', 'A clear empty/no-data state rather than a blank page, a zero-filled table implying compliance, or an error', 'inferred'],
  ]),
  c('RBAC: a user without compliance rights cannot run or download the reports', ['Security', 'Negative'], [
    ['Log in as a user whose role lacks NCM compliance access and open Reports', 'Reports section loads per role', 'doc'],
    ['Attempt to run and to download a compliance report', 'The Compliance category and its exports are unavailable or rejected; no report data is disclosed', 'doc'],
  ]),
  c('RBAC: scheduled report recipients cannot be used to leak restricted data', ['Security', 'Negative'], [
    ['As a restricted user, attempt to schedule a compliance report to an external address', 'Attempt is made', 'inferred'],
    ['Inspect the outcome', 'Either scheduling is blocked for that role or the report content is scoped to what the user may see — a schedule must not widen data access', 'inferred'],
  ]),
  c('CSV-injection safety in any tabular compliance export', ['Security', 'Reports'], [
    ['Create a compliance policy or device name beginning with =cmd|\' /C calc\'!A0 and include it in an export', 'Export is produced', 'inferred'],
    ['Open the export in Excel', 'The leading =/+/-/@ is neutralised and no formula executes', 'inferred'],
  ]),
  c('XSS payload in a policy or device name is escaped in the report', ['Security', 'Negative'], [
    ['Name a compliance policy <script>alert(1)</script> and run a report including it', 'Report generates', 'inferred'],
    ['Open the HTML report and the PDF', 'The name renders as literal escaped text in both; no script executes and the PDF is not corrupted', 'inferred'],
  ]),
  c('Report generation time is acceptable at scale', ['Non-Functional', 'Reports'], [
    ['Run the Executive Summary over the largest available device and policy set', 'Report generates', 'inferred'],
    ['Measure the duration', 'It completes within an acceptable window without timing out or blocking other report runs', 'inferred'],
  ]),
  c('Report template changes do not break other report categories', ['Regression', 'Impacted'], [
    ['Run reports from other categories (NCM non-compliance, availability, metric) after the compliance templates ship', 'Reports generate', 'jira'],
    ['Inspect each', 'All unaffected. The team chose separate per-report HTML templates for compliance, so no shared generic template should have regressed', 'jira'],
  ]),
]);

/* ---------------------------------------------------------------- emit */
const wanted = process.argv.slice(2).map((a) => (/^MOTADATA-/i.test(a) ? a.toUpperCase() : `MOTADATA-${a}`));
const keys = wanted.length ? wanted : Object.keys(SUITES);

let grand = 0;
for (const key of keys) {
  const cases = SUITES[key];
  if (!cases) { console.error(`no suite defined for ${key}`); process.exitCode = 1; continue; }
  const dir = path.join(ROOT, 'workspace', key);
  fs.mkdirSync(dir, { recursive: true });
  const json = cases.map((x, i) => ({
    id: `TC-${String(i + 1).padStart(3, '0')}`,
    title: x.title,
    tags: x.tags,
    steps: x.steps.map(([action, expected, source]) => ({ action, expected, source: source || 'inferred' })),
  }));
  fs.writeFileSync(path.join(dir, 'manual-cases.json'), JSON.stringify(json, null, 1));
  const bySrc = {};
  let steps = 0;
  for (const x of json) for (const s of x.steps) { steps++; bySrc[s.source] = (bySrc[s.source] || 0) + 1; }
  grand += json.length;
  console.log(`${key.padEnd(15)} ${String(json.length).padStart(3)} cases ${String(steps).padStart(4)} steps   ${Object.entries(bySrc).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(' · ')}`);
}
console.log(`${''.padEnd(15)} ${String(grand).padStart(3)} cases total`);
