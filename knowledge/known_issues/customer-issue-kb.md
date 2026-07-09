# Customer Issue Knowledge Base — Motadata ObserveOps (AIOps)

**Source:** `issues_knowledge.json` (support-portal PQD export) | **Export date:** 2026-07-03
**Records:** 496 exported / 334 knowledge-bearing (rows with technical substance; admin/chatter-only rows dropped)

**How to use this:** This file distills historical customer defects into recurring *Symptom → Diagnosis → Solution* patterns, grouped by product area and ordered by frequency. It feeds the `test_case_generation` skill (each pattern implies concrete negative/regression scenarios) and the `regression_analysis` skill (map a new Jira/PQD ticket to a pattern here to find prior fixes, fix versions, and known-fragile areas). Rows whose `module` was `NotInUse`/blank were reclassified from subject + diagnosis text. Counts are per underlying ticket; example IDs are representative, not exhaustive.

---

## 1. Discovery & Monitoring Data (Monitors, Templates, KPIs, Credentials) — ~72 issues

> Hotspot: the single biggest source of tickets — device-specific OIDs/commands, credential/permission failures, and per-OS output parsing dominate "data missing / data wrong" complaints.

**Vendor device doesn't respond to default OIDs → missing/false CPU, memory, HW-sensor, VLAN KPIs** (8x; e.g. PQD-27244, PQD-31043, PQD-35401, PQD-41015)
- Symptom: False CPU utilization, blank HW sensor/STP/VLAN widgets, no memory data for specific device models (Cisco, D-Link, Juniper, Hitachi).
- Diagnosis: Default template OIDs not implemented on that model; sometimes SNMP walk returns only a handful of lines.
- Solution: Update OID per metric group via Monitor Settings → Metric Settings, add SNMP Device Catalogue entries, or ship a custom plugin (D-Link fix mapped vendor OIDs incl. computed memory %, uptime/100 conversion).

**Credential / permission problems block discovery or specific KPIs** (13x; e.g. PQD-30159, PQD-32697, PQD-38137, PQD-39521)
- Symptom: Discovery fails, "Invalid credential", or GUI shows partial data while SSH to the device works.
- Diagnosis: Read-only instead of admin credentials (Cisco WLC); customer changed the credential profile (ESXi timeout); WinRM unconfigured / AD domain username format wrong; PAM `pam_faillock` locking root after AIOps SSH polls; restricted security policies limiting SSH sessions (PQD-34864: only 2 of 12 polls/hour succeeded).
- Solution: Correct credential profile scope; follow WinRM/non-admin SOPs; prefer SSH key-based auth; whitelist AIOps poller in security policy.

**Antivirus/EDR or firewall blocks discovery, agent, or upgrade traffic** (7x; e.g. PQD-35176, PQD-36964, PQD-34926, PQD-38908)
- Symptom: One Windows device never discovers; report data inconsistent; agent upgrade stuck.
- Diagnosis: AV/EDR (e.g. SentinelOne) blocking AIOps requests or the upgrade .exe; Event ID 1000 file-placement blocks.
- Solution: Whitelist `/motadata` path and executables in the AV; documented AV-exclusion list added to install guides (PQD-35804).

**SSH/TLS algorithm & auth-protocol mismatches** (5x; e.g. PQD-29912, PQD-31138 [MOTADATA-6362-era], PQD-33284 [MOTADATA-7069], PQD-36217 [MOTADATA-7707])
- Symptom: Linux VM can't be added; Cisco ACI discovery fails; Dell EMC Unity KPIs empty; Windows secure (HTTPS/5986) discovery fails.
- Diagnosis: KEX algorithm not offered by client (`diffie-hellman-group-exchange-sha256` missing); Go 1.24 upgrade dropped TLS_RSA ciphers needed by ACI; Unity CAS auth causes curl redirect loop; Go PluginEngine lacks WinRM-HTTPS.
- Solution: Add KEX to `ssh_config`; updated pluginengine with required ciphers; curl `-L` + cookie jar or local API user; set `"plugin.engine": "python"` for HTTPS WinRM (productized 8.1.3).

**Per-OS command-output parsing quirks → wrong/negative/missing metrics** (9x; e.g. PQD-31143 [MOTADATA-6362], PQD-33218 [MOTADATA-6838], PQD-38371 [MOTADATA-8063], PQD-41672 [MOTADATA-8671])
- Symptom: HP-UX memory missing on one hardware model; AIX network in/out static; Solaris memory missing; long filesystem names break disk-volume rows; negative disk/memory values (PQD-34190, PQD-32826 [MOTADATA-7159]); corrupted Windows partition aborts whole disk collection (PQD-32764 [MOTADATA-6688]).
- Diagnosis: Command output varies by OS/hardware revision; unwanted banner text; line-wrap on long values; static `ifconfig -a` counters; hot-memory reload changing "static" totals; exception on one bad partition killed the whole plugin.
- Solution: Plugin command changes (`top` for HP-UX, `entstat en0` for AIX), ignore junk text (8.2.0), re-poll on negative values, skip corrupted partitions (agent 8.0.25), handle wrapped rows (8.2.3).

**SNMP transport/network-side failures** (6x; e.g. PQD-34689, PQD-33921, PQD-37852, PQD-31208)
- Symptom: Device never discovered or interfaces missing despite device up.
- Diagnosis: SNMP response returned from a different IP than queried (NAT/routing); SNMP walk taking 24+ minutes (network latency or 4000-interface device); mandatory Interface-Alias OID (.1.3.6.1.2.1.31.1.1.1.18) not implemented on the device.
- Solution: Fix device NAT/binding so response IP = request IP; increase backend timeout for huge devices; custom exe removing the alias-OID prerequisite.

**Slow-responding targets killed by internal timeout** (3x; e.g. PQD-29383, PQD-37125)
- Symptom: Hyper-V / Hyper-V Cluster data missing; huge switch never provisions.
- Diagnosis: Device responded in 30-40 min while process force-terminates at 7 min.
- Solution: Raise per-monitor timeout (30-40 min) and stretch poller interval (1-2 h).

**Interface speed = 0 → division by zero → 100% utilization** (2x; PQD-31144)
- Symptom: Loopback/VPN interfaces pinned at 100% utilization.
- Diagnosis: Utilization = Δtraffic ÷ speed; speed 0 (not fetched at discovery, not set manually).
- Solution: Configure interface speed manually or via bulk speed configuration.

**Stale/duplicate monitor records after re-provisioning or hardware swap** (6x; e.g. PQD-40358, PQD-40196, PQD-37767, PQD-31977)
- Symptom: Serial numbers/data mapped wrong after firewall vendor swap on same IP; device can't be deleted; same device under two clusters; deleted processes still listed.
- Diagnosis: Monitors not re-provisioned after hardware change; legacy multi-entry-point records in PostgreSQL; duplicate Object ID from CSV import mishap.
- Solution: Delete + re-provision, purge legacy DB rows, clean SNMP Device Catalogue; improvement in 8.0.26.

**Tag handling defects** (4x; e.g. PQD-32287 [MOTADATA-6551], PQD-34441, PQD-32063)
- Symptom: "Tag Error" after upgrade; uppercase CSV tags accepted inconsistently; no bulk hierarchical tagging.
- Diagnosis: Blank tags introduced by an upgrade; CSV tags not lowercased; feature gap.
- Solution: Fix in 8.0.25; auto-lowercase in next release; rule-based tagging as workaround.

**Discovery scheduler overload / stuck** (3x; PQD-34444 [MOTADATA-7320], PQD-37769)
- Symptom: Auto scheduler stuck "Running"; secondary app slow to show Running.
- Diagnosis: 2,600-2,800 discovery schedulers configured; profiles still scheduled after all devices added.
- Solution: 8.1.0 supports group name in CSV (512 devices/CSV) to consolidate schedulers; disable completed profiles.

**Virtualization (VMware/Hyper-V/Nutanix) data gaps** (9x; e.g. PQD-37246, PQD-38759 [MOTADATA-8141], PQD-39248 [MOTADATA-8327], PQD-39152 [MOTADATA-8483])
- Symptom: ESXi 6.0 discovery fails; vCenter CPU/memory wrong or missing; VM disk capacity shows 00; deleted VMs linger; ESXi HW-sensor battery/power/voltage absent; ESXi VMs wrongly down on dashboards (MOTADATA-6232).
- Diagnosis: Version support gap (ESXi 6 added 8.2.1); vCenter has no direct utilization API — derived from cluster data that depends on user permissions; no-datastore VMs return 0 bytes; vMotion moves leave stale topology links (PQD-31827).
- Solution: Upgrades to 8.2.0-8.2.3 (host-level fallback for cluster data, datastore edge-cases, appliance-API support for Photon-shell vCenter — PQD-40372 [MOTADATA-8664]).

---

## 2. HA / DC-DR / Upgrade / Backup — ~48 issues

> Hotspot: HA/DR setups break mostly through manual misconfiguration of `motadata.json`, unreachable/time-skewed Observer, and upgrades executed without the documented SOP.

**Observer unreachable or time-desynced → HA "disconnected", services won't start** (6x; e.g. PQD-30326, PQD-30566, PQD-34270, PQD-34964)
- Symptom: Primary/Secondary services fail to start; HA shows Disconnected; DR won't register.
- Diagnosis: Observer server unreachable at service start; wrong timezone on Observer; NTP enabled only on some servers.
- Solution: Ensure observer reachable + `motadata-observer` active before starting apps; sync time/NTP across all servers; re-sync events directory after observer IP change.

**Manual motadata.json edits → dual-primary / VIP on both nodes / wrong roles** (6x; e.g. PQD-28592, PQD-38191, PQD-41310, PQD-31229)
- Symptom: UI inaccessible via VIP; secondary unreachable; backlog queues growing both ways; standalone install behaves as distributed.
- Diagnosis: `%s` replaced with constants, comments added to JSON, `ha.mode` ACTIVE on both, publisher/subscriber hosts pointing at wrong server, `installation.type` 1 instead of 0.
- Solution: Never hand-edit `/motadata/motadata/config/*`; rerun post-installation script per HA doc; clear backlogs, resync ConfigDB/ReportDB, correct params, restart in order APP→DB→Collector.

**Invalid Hardware Key / license corruption after NIC/MAC/host changes** (5x; e.g. PQD-26509, PQD-29587, PQD-31170, PQD-39926)
- Symptom: App won't start; secondary down; "Invalid HW key"; app service killed repeatedly.
- Diagnosis: License is bound to hardware — MAC flush, eth0→bond change, or server migration invalidates the key and can corrupt `license.lic` + config files.
- Solution: Regenerate license for the new hardware key, clean corrupted files (backup dir), restart to auto-generate demo license, then apply new license.

**Upgrade executed without SOP / patch bugs during upgrade** (10x; e.g. PQD-28399, PQD-34609 [MOTADATA-7275], PQD-38577 [MOTADATA-8097], PQD-35982/PQD-35984 [MOTADATA-7641])
- Symptom: Upgrade fails; service won't start post-patch; default-policy notifications/actions wiped after 8.0.26→8.1.0; tickets/alerts stop post-upgrade.
- Diagnosis: Version jumps skipping intermediate patches; password-policy table ID mismatch (from ≤8.0.4 installs); NullPointerException when only one severity configured in integration profile; bundle-upgrade wiping policy actions; duplicated cron jobs created by upgrade (PQD-37540, PQD-35799).
- Solution: Follow docs.motadata.com upgrade chain version-by-version; SQL fix for password-policy table; re-released bundle patches; manual cron cleanup.

**Standalone→DC-DR / HA migration activities need engineering + prerequisite checklists** (9x; e.g. PQD-27855, PQD-32052, PQD-35745, PQD-40106)
- Symptom: DC/DR not configured per SOP; DR sync pending; PostgreSQL permission/library failures during migration.
- Diagnosis: Manual config-directory changes without engineering coordination; missing prerequisites; missing lib file / dir permissions on DB side.
- Solution: Follow "Standalone to DC & DR Configuration" / HA-over-WAN SOPs; validate prerequisites; engineering executes config changes; manual ConfigDB/ReportDB sync when needed (PQD-33442, PQD-37518).

**Kernel / OS-level upgrade side effects** (4x; PQD-37580, PQD-39809, PQD-37159, PQD-35190)
- Symptom: Kernel upgrade fails; datastore segfaults after kernel upgrade; availability report broken by kernel version change.
- Diagnosis: ESXi Secure Boot enabled blocks kernel upgrade; MMAP/WAL mapping inconsistent after kernel change; only LTS kernels supported.
- Solution: Disable Secure Boot first; restart motadata service after kernel updates to flush unmapped stores; kernel fix in 8.1.0.

**Backup/restore mistakes destroy installs** (5x; e.g. PQD-30741, PQD-40534, PQD-38990)
- Symptom: Primary "unreachable" after restore; datastore worker killed; UI-based config restore unavailable.
- Diagnosis: ConfigDB backup unzipped straight into `/motadata/motadata/` (overwrote VERSION/license/config); customer restored an older VM snapshot → datastore version incompatible with app, data since snapshot lost.
- Solution: Follow documented restore procedure; never restore VM snapshots of prod; migrate data from healthy secondary; UI restore delivered in 8.2.0.

---

## 3. Platform / DB / Services (datastore, memory, service startup, GUI access) — ~46 issues

> Hotspot: abrupt shutdowns corrupt append-only stores/caches, and undersized hardware or connection leaks drive OOM kills — the most severe (P1) outage class in the dataset.

**Cache/config-store corruption after abrupt shutdown or power cut** (9x; e.g. PQD-30621, PQD-30826, PQD-39522, PQD-39829)
- Symptom: GUI stuck on loading; master app "not reachable"; service start fails with `Failed to decode: Illegal character (CTRL-CHAR, code 0)`.
- Diagnosis: Abnormal termination leaves partial bytes in append-only temp files / `remote-event-processor-cache`; store open→merge panics; 8.0.17 lock bug corrupted stores.
- Solution: Move/rename corrupted store or cache file (auto-recreated on start), restart services; always stop services cleanly before VM restarts; backup cache files before planned restarts.

**OOM kills of app/datastore workers** (9x; e.g. PQD-38278 [MOTADATA-8024], PQD-38617 [MOTADATA-8214], PQD-37340, PQD-40548)
- Symptom: Application/datastore down, OOM-killer in syslog, event folders growing, GUI down with disk full (PQD-30826).
- Diagnosis: Port-connectivity check feature (8.1.3) leaking connections until ZMQ ports maxed; custom Go plugin scripts spawning processes / cron jobs; dummy ticks during topology runs; special characters producing negative timers; thousands of stale TCP connections from agents removed in UI but still installed on endpoints; default heap (XMX 4000) too small for 80 agents (PQD-33783: XMX→18000 + `"eventloop.workers":10`).
- Solution: Hotfixes 8.1.3-8.2.0; migrate custom Go scripts to Python; fully uninstall deleted agents; tune XMX/workers; move flow index store out of memory.

**Undersized hardware vs. deployment scale** (6x; e.g. PQD-34637, PQD-36850, PQD-39017, PQD-38620)
- Symptom: Deployment issues, GUI "Invalid Action", datastore down, dashboards empty.
- Diagnosis: App server at 4C/8GB vs 16C/16GB baseline; 6.6M instances; load beyond sized capacity.
- Solution: Resize per hardware sheet; disable runaway metric groups; upgrade to fix versions before re-enabling.

**PostgreSQL startup / bootstrap defects** (6x; e.g. PQD-33240/PQD-33283 [MOTADATA-6833], PQD-35439, PQD-40636/PQD-41117)
- Symptom: Default admin login fails on fresh ISO; app killed with DBSERVICEPROVIDER port-5432 errors; install fails on RHEL 10.0.
- Diagnosis: 8.0.24 ISO created PG tables in parallel/incorrectly; customer deleted `/motadata/logs/postgresql/` when the `/` partition filled; RHEL 10.1 documented as supported, 10.0 is not.
- Solution: Fixed ISO re-released; recreate dir with postgres ownership and restart; install only on documented OS versions.

**GUI inaccessible due to environment config** (5x; e.g. PQD-38209, PQD-30253, PQD-28477)
- Symptom: UI never loads by URL; report export fails over HTTPS.
- Diagnosis: WS/WSS blocked at firewall (only HTTPS/443 allowed); stale DNS/browser cache after public-IP change; invalid SSL certificate breaking downloads.
- Solution: Open WS/WSS; clear browser cache; temporary `"https": "no", "http.server.port": 8443` in motadata.json until cert fixed.

**Hostname / dual-NIC / IP-resolution confusion** (6x; e.g. PQD-27130, PQD-33632, PQD-35468, PQD-39258)
- Symptom: DB not responding; wrong IPs on Health screen; dashboard data missing; DB invisible in health monitoring.
- Diagnosis: Hostname not set by post-install script; two NICs both registering; stale deployment-settings entries with old hostname duplicating APP/DB rows; VPN/firewall IP resolution.
- Solution: Fix hostname; set physical IP in PostgreSQL; add `"local.host": "<SERVER-IP>"` to motadata-datastore.json; purge duplicate deployment entries (permanent fix 8.1.0).

**Metric pipeline stalls (queue full / aggregation stall)** (4x; PQD-38255 [MOTADATA-8024], PQD-39472, PQD-39020)
- Symptom: Polling data stops for all devices; DR data loss for a day; widget exceptions on long timelines.
- Diagnosis: Receiving queue full from repeated connection requests; random memory spike stalled aggregation event queue (CPU metrics never flushed); missing columns inflating `columnPoolElementSize`.
- Solution: Connection-handling fix; datastore memory tuning; fixed in 8.2.0.

**Environment/VAPT-driven platform constraints** (6x; e.g. PQD-30299, PQD-29307, PQD-39676)
- Symptom: Service breaks after OS hardening; core dumps filling disk.
- Diagnosis: CIS rules limiting user resources and `/tmp` conflict with the app; core dumps enabled.
- Solution: Exempt user-limit and public-directory rules; disable core dumps via limits.conf/sysctl; stage hardening on staging first.

---

## 4. Reports — ~24 issues

> Hotspot: availability numbers diverging between raw and aggregated layers, plus export-format defects.

**Availability/trend data wrong or missing for longer time ranges** (8x; e.g. PQD-32430 [MOTADATA-6639], PQD-38241 [MOTADATA-8012], PQD-27377, PQD-39031 [MOTADATA-8274])
- Symptom: Wrong last-quarter availability; tag-filtered interface report ignores filter; monthly/quarterly report empty.
- Diagnosis: Raw vs. aggregation retention mismatch — queries landing on the wrong layer; tag >200 interfaces switches to aggregated data where the bug lived; long durations need batch processing.
- Solution: Auto-route queries older than raw retention to aggregation (8.0.24); fix in 8.2.0 (pre-filter workaround); custom batching script; time units capped at Days (8.2.1).

**Export/format defects** (7x; e.g. PQD-38909 [MOTADATA-8254], PQD-37595 [MOTADATA-7908], PQD-36889 [MOTADATA-7839], PQD-32782)
- Symptom: Scheduled PDF arrives as XLSX; exported group list shows tag IDs instead of values; multiple suffixes in availability export; no serial-number column / ordering.
- Diagnosis: Format selection ignored in scheduler; tag resolution bug; missing "Between" operator caused wrong ranges.
- Solution: Fixes in 8.1.3-8.2.0; ascending-order released 8.0.26.

**Report content/permission gotchas** (6x; e.g. PQD-38798, PQD-38219, PQD-34926)
- Symptom: Read-only user can't download reports; parent group doesn't include child groups; availability report inconsistent.
- Diagnosis: Role missing "Query" permission; explicit-selection design (intentional); EDR agent interfering with data collection + disk-space-starved server (PQD-34910 [MOTADATA-7361]).
- Solution: Grant Query permission; select nested groups explicitly; whitelist /motadata, fix hardware.

**Custom report scripts as stopgap for feature gaps** (5x; e.g. PQD-34124 [MOTADATA-7293], PQD-35662 [MOTADATA-7509], PQD-39579 [MOTADATA-8368])
- Symptom: Needed KPI/attribute (Oracle metrics, reachability, VLAN traffic, penalty calc) not in product reports.
- Diagnosis: Feature gaps; reachability supports only result-by-monitor.
- Solution: Engineering-provided Go/Python custom scripts + backend file SOPs; some later productized.

---

## 5. Alerts / Policies / Notifications — ~22 issues

> Hotspot: interaction between poller interval and occurrence/flap windows, and re-notification logic bugs.

**Poller interval vs. occurrence/flap window mismatch → false or missing alerts** (4x; PQD-28890, PQD-35099, PQD-35984 [MOTADATA-7641])
- Symptom: Wrong alerts after upgrade; alert "not generated" for identical condition.
- Diagnosis: Poller 600s with 5-min/3-flap policy can never satisfy the window; 3-occurrences-in-1-hour met in one report but polls >1h apart in the other.
- Solution: Align poller interval with policy windows (flap count reduced 3→1); education + demo of occurrence math.

**Re-notification / duplicate-alert engine bugs** (4x; PQD-38455 [MOTADATA-8110], PQD-39314 [MOTADATA-8326], PQD-41707 [MOTADATA-8716])
- Symptom: Random duplicate re-notification emails on severity change; original vs. re-notification email content differs; policy triggers but no email/incident.
- Diagnosis: Re-notification configured for one severity of a multi-threshold policy; NullPointerException in `updateRenotificationTimer` when policy-config copy loses data mid-cycle.
- Solution: Fixes in 8.2.0/8.2.1; hotfix + null-checks (8.2.1/8.2.2).

**Notification channel failures (email/SMS)** (5x; e.g. PQD-29942, PQD-40517, PQD-33551 [MOTADATA-7016], PQD-35649 [MOTADATA-7543])
- Symptom: SMS triggered but not delivered; alert emails missing; noisy "Email Service Unavailable" alerts.
- Diagnosis: SMS template not whitelisted at gateway; AIOps IP not whitelisted on mail server; 3-retry socket-break produced a cosmetic alert.
- Solution: Whitelist gateway/template and server IP; suppress false alert (8.0.18 hotfix, permanent 8.0.26); availability-mail hotfix exe.

**Policy configuration & semantics issues** (9x; e.g. PQD-39541 [MOTADATA-8585], PQD-39582 [MOTADATA-8359], PQD-35900 [MOTADATA-7644], PQD-37289)
- Symptom: Filters cleared when adding a server to a policy; disk policy ignores exclude/starts-with prefilters; deleted dependency child stays suspended/unreachable; SQL failover alert never fires; trap policy can't add source; alert-time misalignment (PQD-32692).
- Diagnosis: Dynamic filter revalidation wiped config (redesigned 8.2.3); prefilter operator bug (8.2.1); availability-correlation suspension persists after dependency removal; wrong KPI used (`mssql.replica.sync.health` vs `mssql.alwayson.role`); macro misunderstandings ($$$instance$$$).
- Solution: Version fixes noted; use correct KPI/macros; bulk metric-collection option to un-suspend groups.

---

## 6. Agents — ~17 issues

> Hotspot: agent lifecycle (install/upgrade/uninstall) and environment blockers (PowerShell, ports, AV) rather than steady-state collection.

**Agent installed but not visible / not reporting** (5x; e.g. PQD-29673, PQD-27359, PQD-39434, PQD-39717)
- Symptom: Agent absent from GUI; logs not collected; DR app data missing.
- Diagnosis: Required ports closed; hostname problems; missing agent configuration.
- Solution: Open documented agent ports; fix hostname; apply agent config per install guide.

**PowerShell dependency & restricted endpoints** (4x; PQD-35187, PQD-36066 [MOTADATA-7668], PQD-29943)
- Symptom: 8.0.25 agent install fails; security teams object to PowerShell execution; endpoint slowness.
- Diagnosis: Agent used PowerShell for OS detection; polling reset to aggressive 10s defaults after reinstall/upgrade.
- Solution: Install 8.1.2+ agent (PowerShell removed); restore poller values in agent.json (e.g. 600s); backup agent config before upgrades.

**Registration & identity conflicts** (4x; e.g. PQD-34966, PQD-32591, PQD-39053, PQD-41189)
- Symptom: "Already provisioned" on register; phantom second slave entry; Health shows 8.1.3 while settings show 8.0.24; agent down after reboot.
- Diagnosis: Agent still registered to another HA server; stale deployment entries; PostgreSQL version row not migrated; heartbeat drop after restart.
- Solution: Deregister first; purge stale entries; correct version row in PG; switch availability method Heartbeat→Ping.

**Agent resource / traffic anomalies** (4x; e.g. PQD-30606, PQD-34963, PQD-40522, PQD-35808)
- Symptom: High bandwidth from agent (ZMQ); 100% CPU; SCADA process storm from 60s port polling; agent doesn't auto-start after reboot.
- Diagnosis: ZMQ chatter (fixed in newer agent); port monitoring reconnects every poll; endpoint AV/policy blocking auto-start.
- Solution: Upgrade agent; remove port from monitoring AND Application Mapping (nightly 2:15 AM rediscovery re-adds it; GUI toggle, default-off, from 8.2.1 — PQD-39936 [MOTADATA-8460]).

---

## 7. Log / Flow / Trap Explorers — ~16 issues

> Hotspot: source-side misconfiguration (flow version, community strings) and parser assignment by IP.

**Flow data mismatch or absent** (5x; e.g. PQD-30304 [MOTADATA-6334], PQD-36645, PQD-39746, PQD-29136)
- Symptom: NetFlow volume 0 bytes; flow size differs from other NMS; flow not supported.
- Diagnosis: Bi-directional ASA/PaloAlto templates (Initiator/Responder octets) unparsed by pmacct (`tmp_asa_bi_flow` needed); customer compared NetFlow v5 vs v9 feeds; CloudGenix supports NetFlow v9 not sFlow; switch flow config wrong.
- Solution: Enable `tmp_asa_bi_flow` (productized 8.0.22); align flow versions; reconfigure exporters per vendor standard.

**Logs land in "Others" / not parsed / not searchable** (6x; e.g. PQD-35659, PQD-38164 [MOTADATA-8029], PQD-36867, PQD-41651)
- Symptom: Logs bypass assigned parser; filter/search dead in Log module; AD/Exchange logs missing.
- Diagnosis: Parser assignment is per source-IP — dynamic dual-WAN IPs break it; `windows.event.provider` non-indexable; only Event/Application/Security event sources enabled by default.
- Solution: Feature request for name-based grouping; hotfix + config parameter to index fields (8.1.3 patch); add event sources with event IDs in agent settings; Linux AuditD parser default from 8.2.2; verify forwarding with tcpdump both ends (PQD-41047).

**Traps not visible** (2x; PQD-33528)
- Symptom: Traps in tcpdump but not in Trap Explorer.
- Diagnosis: Wrong SNMPv2c community string; SNMPv3 traps sent with blank username.
- Solution: Correct community/v3 credentials on device and receiver; validate in Live Trap screen.

**Log licensing/quota & pipeline** (3x; PQD-34767, PQD-35039, PQD-37669 [MOTADATA-7925])
- Symptom: Daily log quota not reset at midnight; logs absent from portal; log alert fires but no logs found.
- Diagnosis: Scheduler stalled at reset; verticles not started because service wasn't restarted after license apply; default numeric-event-ID alert matched any log containing the value.
- Solution: Restart after license apply; default alert removed in 8.2.0.

---

## 8. Topology & Dependency Mapper — ~15 issues

> Hotspot: LLDP/SNMP string parsing — a classic regression chain: 16-char names misread as IPv6 (fixed 8.0.19) whose fix broke ASCII octet parsing (8.1.0), combined fix in 8.1.2.

**Name/IP parsing misclassification breaks topology** (4x; PQD-29906, PQD-36424 [MOTADATA-7745], PQD-41316)
- Symptom: Devices missing from topology; topology not built per neighbour list.
- Diagnosis: 16-character device names parsed as IPv6; later fix regressed ASCII A.B.C.D octet parsing (worked 8.0.15, broke 8.1.0).
- Solution: Combined parser fix in 8.1.2 — treat as the canonical "fix-introduced-regression" case.

**Interface-name mismatches prevent neighbour mapping** (3x; PQD-33405 [MOTADATA-6884], PQD-37125)
- Symptom: TP-Link/HFCL topology empty; "interface not provisioned".
- Diagnosis: LLDP returns full names vs discovered short names; ` ` garbage in interface names; wrong LLDP OID data.
- Solution: Normalize names, fall back to interface-description OID (.1.0.8802.1.1.2.1.4.1.1.8), trim control chars (custom scripts).

**Monitor name must equal hostname** (2x; PQD-36818, PQD-36965)
- Symptom: Topology missing for scanned switches.
- Diagnosis: Customer renamed monitors; topology maps by monitor name = hostname.
- Solution: Restore names, rerun discovery; improvement requested to map by hostname.

**Topology maintenance behaviors** (6x; e.g. PQD-30386, PQD-36665, PQD-31827, PQD-38710 [MOTADATA-8179], PQD-40859 [MOTADATA-8544])
- Symptom: New scan overwrites existing topology; layout scrambles on device add; stale vMotion links; wrong port connectivity vs dependency mapper; duplicate-connection error on legitimate same-index interfaces; wrong status colour in manual view (PQD-33789 [MOTADATA-7130]).
- Diagnosis: Scheduler replace-by-design; auto-relayout; uniqueness validated on interface index only, not device+interface.
- Solution: Include/Exclude filters with groups/tags; static-layout improvement 8.2.1; fixes 8.2.0-8.2.2 (+8.2.1 hotfix exe).

---

## 9. Security / VAPT / Hardening — ~12 issues

> Hotspot: recurring bank/government VAPT audits — weak ciphers, OS package CVEs, CIS compliance.

**Weak cipher / TLS findings** (5x; e.g. PQD-28704, PQD-35807 [MOTADATA-7566], PQD-38370 [MOTADATA-8035])
- Symptom: VAPT flags weak TLS/SSH ciphers, SWEET32, self-signed certs.
- Diagnosis: Defaults favour compatibility (weak ciphers allowed).
- Solution: `jdk.tls.disabledAlgorithms` additions; SOP_Update_Secure_Cipher_Configuration; trusted-CA certs; strong-cipher SOP tied to 8.2.0.

**Vulnerable OS packages / runtime components** (4x; e.g. PQD-36027 [MOTADATA-7697], PQD-28532 [MOTADATA-5127])
- Symptom: Audit flags curl/OpenSSH/OpenSSL/urllib versions; Node.js CVEs.
- Diagnosis: OS-level packages; Node.js only used by Reports module.
- Solution: QA-sanity-tested package updates published; Node.js removed from product entirely.

**Application-level VAPT points** (3x; PQD-41192 [MOTADATA-8587], PQD-32083 [MOTADATA-5979])
- Symptom: Concurrent admin sessions, clear-text password claims, CORS.
- Diagnosis: Mixed true findings and false positives.
- Solution: `"allow.concurrent.sessions": "no"` in motadata.json (8.1.3); CIS compliance script for Ubuntu 24.04 (8.0.24); item-by-item disposition sheets.

---

## 10. Dashboards / Widgets — ~11 issues

> Hotspot: widget query/ordering defects surfacing after backend metric renames.

**Widget shows wrong/empty/erratic data** (6x; e.g. PQD-36959 [MOTADATA-7853], PQD-31681 [MOTADATA-6487], PQD-37423/PQD-37509 [MOTADATA-7158], PQD-33125 [MOTADATA-6811])
- Symptom: Wireless client-summary loader spins; Nutanix VM CPU/memory widget errors; gauge widgets reorder randomly; availability-duration mismatch.
- Diagnosis: Upgrade renamed metric→state.metric breaking widget query; up/down ordering follows first-qualified device; instance duration flap needed `status.flap.instances` config (default from 8.0.25).
- Solution: Widget query updates; ordering fix 8.2.0; config param removed/productized.

**Dashboard behavior defects** (5x; PQD-32395 [MOTADATA-6574], PQD-37765 [MOTADATA-7939], PQD-34677 [MOTADATA-7300], PQD-32627 [MOTADATA-6645])
- Symptom: Editing a cloned dashboard changes the original; no auto-refresh; tag drill-down error page; UI "Robot" error on tag textbox.
- Diagnosis: Clone shared state; drill-down only valid for Monitor/Interface result-by.
- Solution: Fixes 8.0.25-8.1.3.

---

## 11. Integrations (ServiceOps, LDAP/AD, SSO, SMTP) — ~10 issues

> Hotspot: field-mapping and identifier-format mistakes on the external system side.

**ServiceOps ticket lifecycle failures** (3x; PQD-30723 [MOTADATA-6190], PQD-40376 [MOTADATA-8563])
- Symptom: Tickets created but auto-close fails; integration circuit-breaker trips.
- Diagnosis: Mandatory custom field in ServiceOps close-rules unpopulated by AIOps; AIOps tried to close an already-manually-closed ticket.
- Solution: Relax/populate mandatory close fields; ServiceOps workflow sends ACK back to AIOps on manual close (bi-directional sync).

**LDAP/AD sync failures** (4x; PQD-30127 [MOTADATA-6010], PQD-37328, PQD-39839, PQD-38845)
- Symptom: "Invalid Credential" on LDAP integration; group sync fails; duplicate users appear.
- Diagnosis: Wrong CN (must be the container of the group); CN used where Group Name expected; AD-side config changes spawning duplicates.
- Solution: Correct CN/Group Name usage; patched executables (8.0.20-era); dedupe + upgrade.

**SSO / OAuth SMTP config** (3x; PQD-36619 [MOTADATA-7744], PQD-38421)
- Symptom: Azure AD SSO redirect fails; OAuth2.0 SMTP config errors.
- Diagnosis: SSO redirect only supported local/VIP IP — NAT'd public domain unsupported; wrong Azure auth/token URLs.
- Solution: Early-release SSO bundle (backend file swap, later productized); follow Azure OAuth doc.

---

## 12. Licensing — ~8 issues

> Hotspot: license bound to hardware key plus counting bugs in legacy code.

**"License Exceeded" despite unused capacity / consumption mismatch** (4x; PQD-32834, PQD-34489, PQD-36926)
- Symptom: Cannot add monitors though capacity remains; counts differ between screens; APM count confusion.
- Diagnosis: Random cache issue (restart clears); legacy counting code adding extras post-consumption; APM counts registered agent applications.
- Solution: License code fully refactored in 8.0.26; restart as interim workaround.

**License expiry / invalid key halting collection** (4x; PQD-31783, PQD-39926, PQD-29587, PQD-26509)
- Symptom: Polling silently stops; secondary app killed.
- Diagnosis: Expired license stopped polls (noticed only via stale data); invalid HW key from MAC/NIC changes.
- Solution: Renew/regenerate license; treat license state as a first-class health alarm.

---

## 13. NCM / Configuration Management — ~7 issues

> Hotspot: per-vendor CLI dialect quirks in command templates.

**Firmware upgrade / config backup fails on specific vendors** (5x; PQD-31539, PQD-33382 [MOTADATA-6866], PQD-38572, PQD-39653)
- Symptom: Cisco firmware upgrade fails; FortiGate NCM dead; Cisco ISE config fetch shows "More"; NTPC firmware fail.
- Diagnosis: Template commands not per user-guide; TFTP unreachable (FTP worked); FortiGate needs "a" confirmation after enable; ISE ignores `terminal length 0`; TP-Link needs `\r\n` line endings + prompt changes after enable (PQD-33405).
- Solution: Fix template command sequences; switch TFTP→FTP; vendor-specific command handling (8.0.25 for TP-Link); KB templates published.

---

## 14. Sizing / Audit / Ops Requests (non-defect) — ~12 issues

Hardware-sizing calculators (PQD-35282 [MOTADATA-7743], PQD-36864, PQD-38336 BSNL 300k nodes, PQD-38600 RBI), system audits (PQD-29963, PQD-35026), sanity-report requests (PQD-35098, PQD-35158) and DB migrations (PQD-35516). Not defects, but they encode the reference deployment matrices (App/DB/Collector/Observer core-RAM-disk-I/O per monitor count) useful for perf-test environment sizing.

---

## Top 10 recurring root-cause themes

1. **Manual config-file edits & skipped SOPs** — hand-edited `motadata.json`/config dirs and upgrades done out of sequence cause dual-primary HA, wiped policies, failed patches (the #1 preventable outage source).
2. **Cache/store corruption on abrupt shutdown** — power cuts, forced restarts, and kernel upgrades leave partial writes in append-only stores/caches; recovery is always "rename file + restart".
3. **Hardware-bound licensing** — any MAC/NIC/VM change invalidates the HW key, corrupts license/config files and kills services; expiry silently halts polling.
4. **Version mismatch after upgrade** — agent vs server, datastore vs app (VM snapshot restores), DC vs DR, ISO patch chains skipped; also fix-introduced regressions (IPv6/ASCII topology parser 8.0.19→8.1.0→8.1.2).
5. **Credential/permission drift** — changed profiles, read-only vs admin, WinRM/AD formats, PAM lockouts, sudo restrictions; the top cause of "data missing for one device".
6. **Device/vendor heterogeneity** — non-standard OIDs, CLI dialects (FortiGate "a", ISE "More", TP-Link `\r\n`), odd command output (HP-UX/AIX/Solaris) require template/plugin overrides.
7. **Environment interference** — antivirus/EDR, firewalls (WS/WSS, agent ports), NAT (SNMP response IP, SSO redirect), OS hardening and Secure Boot breaking product operations.
8. **Poller-interval vs policy-window math** — alerts falsely missing/firing when occurrence/flap windows can't be satisfied by the configured poll cadence.
9. **Resource exhaustion & leaks** — OOM from connection leaks, Go plugin process storms, stale agent connections, undersized hardware vs monitor count.
10. **Raw vs aggregated data-layer divergence** — retention differences and >200-instance thresholds produce inconsistent report/availability numbers depending on which layer answers the query.

## QA implications — regression-test ideas

1. **Upgrade matrix test:** upgrade N-2→N with default policies carrying notifications/actions; assert none are wiped and alerts/tickets still generate post-upgrade (MOTADATA-7641 class).
2. **Abrupt-kill resilience:** `kill -9` / power-cycle app and datastore mid-write; verify service auto-recovers or clearly names the corrupted cache/store file; verify restart-after-kernel-update flushes MMAP stores.
3. **HA bring-up ordering:** start Primary/Secondary with Observer down, with time skew (>NTP drift), and with wrong timezone; expect explicit diagnostics, no dual-primary/dual-VIP state.
4. **License lifecycle:** change VM MAC/NIC bonding and reboot — assert graceful "invalid key" handling without config corruption; let a license expire — assert an alert fires rather than silent polling stop.
5. **Poller/policy interaction suite:** for each policy (X occurrences in Y window, flap counts), parametrize poller intervals that can/cannot satisfy the window; assert alert fires exactly when mathematically possible.
6. **Re-notification permutations:** multi-threshold policies with re-notification on a subset of severities; cycle severity up/down; assert no duplicate or missing notifications and identical content between original and re-notification mails.
7. **Interface speed = 0:** provision a device whose ifSpeed is 0; assert utilization is not 100%/infinite and a validation nudge appears.
8. **Raw-vs-aggregation consistency:** run the same availability/interface report for a range inside raw retention, straddling the boundary, and fully aggregated; values must match; repeat with tag covering >200 instances.
9. **Report export fidelity:** schedule reports in every format (PDF/XLSX), with Between operators, tags, and parent/child groups; verify format, tag *values* (not IDs), ordering, and suffix-free filenames.
10. **Parser regression pack for topology:** device names of exactly 16 chars, names with ` `/garbage, IPs with alpha-looking octets, LLDP full-vs-short interface names, duplicate interface indexes on different devices — all must map correctly (8.1.2 combined fix must never regress).
11. **Discovery negative suite:** wrong community string, blank SNMPv3 username, response-IP ≠ request-IP, read-only credentials, WinRM AD username formats, restricted shells (`appliancesh`), PAM lockout policies — each should fail with a distinguishable error, not silent data gaps.
12. **Agent lifecycle:** install→delete from UI without endpoint uninstall (assert no TCP connection storm/OOM), re-register agent already bound to another HA node, upgrade agent and assert poller intervals in agent.json survive.
13. **Scale guardrails:** 2,500+ discovery schedulers, 4,000-interface device (25-min SNMP walk), 6M+ instances — assert defined behavior (timeouts, warnings) instead of stuck "Running" states or datastore OOM.
14. **Environment blockers smoke test:** run discovery/upgrade with a simulated EDR blocking `/motadata` executables and with WS/WSS blocked at a proxy; assert actionable errors referencing whitelisting docs.
15. **Cloned-object independence:** clone dashboards/policies/templates, edit the clone, assert the original is untouched (MOTADATA-6574 class); delete parent-child dependency entries and assert child monitors resume from suspension.
