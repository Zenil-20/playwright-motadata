# Motadata AIOps (ObserveOps) — QA Product & Test-Coverage Guide

**Audience:** Any QA engineer joining this project.
**Purpose:** This is the single source of truth for understanding the **product from a testing perspective** — what Motadata AIOps does, the business workflows behind each area, and exactly which parts are covered by the current test suite.

> **Scope rule (read first).** This document describes **only** product behaviour that is **currently covered by existing tests**. It deliberately does **not** describe product features, modules, or workflows that have no test coverage yet, and it contains **no** automation-framework, tooling, or code-level detail. It is a **living document**: whenever coverage for a new module, feature, workflow, or scenario is added, add it here; whenever coverage is removed, remove it here. Never list future or aspirational functionality.

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Core Concepts & Terminology](#2-core-concepts--terminology)
3. [The End-to-End Monitoring Lifecycle (Data Flow)](#3-the-end-to-end-monitoring-lifecycle-data-flow)
4. [Coverage at a Glance](#4-coverage-at-a-glance)
5. [Modules & Test Coverage](#5-modules--test-coverage)
   - [5.1 Discovery — Infrastructure](#51-discovery--infrastructure)
   - [5.2 Discovery — Databases](#52-discovery--databases)
   - [5.3 Service Checks (Agentless)](#53-service-checks-agentless)
   - [5.4 Rediscovery](#54-rediscovery)
   - [5.5 Monitoring Configuration](#55-monitoring-configuration)
   - [5.6 Dashboards](#56-dashboards)
   - [5.7 Metric Explorer](#57-metric-explorer)
   - [5.8 Policies & Alerting](#58-policies--alerting)
   - [5.9 Service Level Objectives (SLO)](#59-service-level-objectives-slo)
   - [5.10 SNMP Trap Management](#510-snmp-trap-management)
   - [5.11 NCCM — Network Config & Change Management](#511-nccm--network-config--change-management)
   - [5.12 Runbooks (Automation)](#512-runbooks-automation)
   - [5.13 Integrations (ITSM)](#513-integrations-itsm)
   - [5.14 APM — Application Performance Monitoring](#514-apm--application-performance-monitoring)
   - [5.15 Real User Monitoring (RUM)](#515-real-user-monitoring-rum)
   - [5.16 Platform Administration](#516-platform-administration)
6. [Module Dependencies](#6-module-dependencies)
7. [Cross-Cutting Behaviours](#7-cross-cutting-behaviours)
8. [Assumptions & Preconditions](#8-assumptions--preconditions)
9. [Known Limitations & Coverage Gaps](#9-known-limitations--coverage-gaps)
10. [Testing Scope Summary](#10-testing-scope-summary)
11. [Maintaining This Document](#11-maintaining-this-document)

---

## 1. Product Overview

**Motadata AIOps** (branded **ObserveOps** in the UI) is an IT **observability and operations** platform. It brings IT assets — servers, network devices, hypervisors, hyper-converged infrastructure, containers, databases, wireless controllers, WAN links, and synthetic services — under continuous monitoring, then visualises their health, detects problems, raises alerts, and helps operators remediate and integrate with external ticketing systems.

The tested product surface follows one coherent operational story:

> **Discover** assets → **Provision** them into monitoring → **Collect** their metrics → **Visualise** them on dashboards and in ad-hoc analytics → **Detect** problems with policies, SLOs, and traps → **Alert** the right people → **Remediate** via runbooks and configuration sync → **Integrate** with ITSM tools.

Everything in this guide maps to one of those stages.

---

## 2. Core Concepts & Terminology

| Term | Meaning (as used in the product) |
|---|---|
| **Monitor** | A discovered, provisioned asset (device, database, service, or virtual entity) that the platform continuously polls for data. The central object almost everything attaches to. |
| **Discovery Profile** | A named scan definition: a category (Server, Network, Virtualization, HCI, Container Orchestration, Wireless, Database, Service Check, etc.), a target, and a credential. |
| **Target** | What a profile scans: a single **IP/Host**, an **IP Range** (optionally with an excluded sub-range), a **CIDR** block, or a **CSV/spreadsheet import**. |
| **Credential Profile** | A reusable, named set of authentication details and protocol (SSH, WMI, SNMP v1/v2c/v3, HTTP/HTTPS, API, JDBC, Basic auth, etc.). Can often be **Tested** against a live target before saving. |
| **Collector** | The engine that performs a scan/poll; selectable on a profile. |
| **Provisioning** | Accepting a discovered object into active monitoring (turning it into a Monitor). **Consumes a license.** Confirmed by a "provisioned successfully" / **Provision Status** result. |
| **KPI / Metric / Counter** | A measured performance indicator (e.g. CPU %, latency, availability status). |
| **Instance** | A specific sub-component of a monitor (a process, application, interface) that has its own instance-level KPIs. |
| **Dashboard** | A monitor's detail view, organised into **tabs** and **widgets** (KPI tiles, gauges, trend charts, availability panels, data grids). |
| **Policy** | Threshold/state rules on a monitor that raise an **Alert** at a severity when breached. |
| **Alert** | The event a policy or trap raises (Warning / Major / Critical / Down), surfaced on a monitor's Active Alerts / the Alerts area. |
| **SLO** | Service Level Objective — a target for availability or performance of a service over a time window. |
| **Runbook** | An automated remediation/data-collection action run against a device using a credential. |
| **SNMP Trap** | An unsolicited event a network device pushes to the platform's trap listener. |
| **NCCM** | Network Configuration & Change Management — backup, versioning, drift detection, and sync of device configs. |
| **Rediscovery** | Re-scanning an already-monitored host to find and onboard additional entities on it (interfaces, processes, services, files, VMs, access points, applications). |
| **Tags / Groups** | Labels and groupings applied to monitors for organisation and rule-based automation. |
| **Rediscover Scheduler** | A timed job that triggers a re-scan of a known host for a given entity type. |

---

## 3. The End-to-End Monitoring Lifecycle (Data Flow)

The tests collectively validate this pipeline. Each box is a product stage; the modules in [Section 5](#5-modules--test-coverage) implement these stages.

```
                         ┌──────────────────────────────────────────────┐
                         │                 CREDENTIALS                   │
                         │  (reusable Credential Profiles: SSH/WMI/SNMP/ │
                         │   API/JDBC/HTTP — Tested before use)          │
                         └───────────────────────┬──────────────────────┘
                                                 │ used by
        ┌───────────────┐   discover    ┌────────▼─────────┐  provision   ┌──────────────┐
        │  TARGETS      │──────────────▶│    DISCOVERY     │─────────────▶│   MONITORS   │
        │ IP / Range /  │               │  (+ Service      │  (license)   │ (polled for  │
        │ CIDR / CSV    │               │   Checks)        │              │   metrics)   │
        └───────────────┘               └──────────────────┘              └──────┬───────┘
                                                                                 │
                    ┌────────────────────────────────────────────────────────────┼───────────────────────────┐
                    │ collected metrics/state feed everything below              │                           │
                    ▼                        ▼                        ▼           ▼                           ▼
         ┌──────────────────┐    ┌────────────────────┐   ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
         │  REDISCOVERY     │    │  VISUALISE         │   │  DETECT          │  │  TRAPS           │  │  NCCM            │
         │  onboard extra   │    │  Dashboards +      │   │  Policies + SLOs │  │  device-pushed   │  │  config backup / │
         │  entities/apps   │    │  Metric Explorer   │   │  → ALERTS        │  │  events → ALERTS │  │  drift → SYNC    │
         └──────────────────┘    └────────────────────┘   └────────┬─────────┘  └────────┬─────────┘  └──────────────────┘
                                                                    │                     │
                                                                    ▼                     ▼
                                                          ┌───────────────────────────────────────┐
                                                          │  REMEDIATE & INTEGRATE                 │
                                                          │  Runbooks · ITSM (Jira/ServiceNow/     │
                                                          │  ServiceOps ticket sync)               │
                                                          └───────────────────────────────────────┘
```

---

## 4. Coverage at a Glance

| Product Area | Covered? | Depth |
|---|---|---|
| Infrastructure Discovery (Server, Network, Virtualization, HCI, Cloud/Container, Wireless, WAN) | ✅ | Discover → provision → verify in inventory |
| Database Discovery | ✅ | Discover → provision (some with credential Test) |
| Service Checks (agentless) | ✅ | Create → provision |
| Rediscovery (interfaces, processes, services, files, APs, VMs, applications) | ✅ | Re-scan → onboard → verify |
| Monitoring Configuration (agent, device settings, monitoring hours, custom fields, metric plugin) | ✅ | Lifecycle actions & assignment |
| Dashboards (Server/Apps, Network, Virtualization, Database, Service Check) | ✅ | Widget/KPI/tab verification |
| Metric Explorer | ✅ | Compare, Forecast, Anomaly, Saved Views |
| Policies (Metric, NetRoute) | ✅ | Full lifecycle; Metric also verifies **alert fires** |
| Availability Policy | ⚠️ | Create → disable → delete only (no alert-fire) |
| SLO (Profile + Penalty) | ✅ | Create & verify |
| SNMP Trap Management | ✅ | Config, live, explorer, routing, policy-trigger, propagation |
| NCCM | ✅ | Discovery + full config lifecycle (baseline, backup, conflict, sync, compare) |
| Runbooks | ✅ | Create & test (Database, Custom) |
| Integrations (Jira, ServiceNow, Motadata ServiceOps) | ✅ | Configure, test, profile mapping |
| APM registration | ✅ | Trace-service creation per runtime |
| RUM registration | ✅ | App registration per framework |
| Platform Admin (Proxy, Storage Backup, Rule-Based Tags, LDAP, User/RBAC) | ✅ | Configure/test/verify |

Legend: ✅ covered · ⚠️ partially covered (see [Known Limitations](#9-known-limitations--coverage-gaps)).

---

## 5. Modules & Test Coverage

### 5.1 Discovery — Infrastructure

**What it is.** Finding physical/virtual assets on the network and bringing them under monitoring. An operator creates a Discovery Profile (category + target + credential), optionally **Tests** the credential, runs it, reviews **Discovered Objects** (and a **Failed Objects** count), then **selects and provisions** them. Several tests go further and confirm the provisioned device appears in inventory with the correct type icon, identity, and tags.

**Covered scenarios:**

| Category | Device / Type | Protocol | Discovery Method | Verified |
|---|---|---|---|---|
| **Server** | Linux | SSH | Single IP | Discovered & provisioned |
| **Server** | Linux | SSH | IP Range **with exclusion** | Objects returned, host provisioned |
| **Server** | Windows | WMI | Single IP | Provisioned (also drives PostgreSQL rediscovery) |
| **Server** | Windows | WMI | CIDR | Device in CIDR provisioned |
| **Server** | Any host (Ping) | ICMP (no cred) | IP Range /24, **with notification email** | At least one host provisions (dynamic counts) |
| **Network** | Router/switch | SNMP **v1** | Single IP | Provisioned |
| **Network** | Router/switch | SNMP **v2c** | Single IP | Provisioned |
| **Network** | Router/switch | SNMP **v3** (SecurityUser, Auth+Priv, SHA/AES) | Single IP | Provisioned |
| **Network** | Bulk devices | SNMP profile | **CSV/spreadsheet import** + **Run Topology** | Discovered/Failed summary; first result provisioned |
| **Virtualization** | vCenter (VMware) | API | Single IP | Provisioned |
| **Virtualization** | ESXi host (×2) | API | Single host | Provisioned |
| **Virtualization** | Citrix Xen | HTTP/HTTPS | Single IP, **with tags** | Provisioned; tags persist in Monitor Settings |
| **Virtualization** | Proxmox VE | HTTP/HTTPS | Single IP, **inline rename** + tags | Provisioned; verified in Monitor Settings |
| **HCI** | Nutanix (Prism) | API | Single IP | Provisioned; verified in inventory |
| **Cloud/Container** | Kubernetes cluster | SSH to master | Single IP, **inline rename** | Node provisioned |
| **Cloud/Container** | Docker containers | Docker (port 2375) | On an already-provisioned Linux host | All containers provisioned |
| **Wireless** | Cisco WLC | SNMP v2c | Single IP | Provisioned |
| **Wireless** | Aruba | SNMP v2c | Single IP | Provisioned |
| **Wireless** | Ruckus (SmartZone) | HTTPS (port 8443) | Single IP | Provisioned |
| **WAN / IPSLA** | WAN links | SNMP v1/v2c, ICMP | IP Range, then per-device & **bulk CSV** WAN-link config | Range provisioned; WAN links configured, rediscovered, provisioned |

**Notable scenarios:** IP-range with exclusions; CIDR; CSV/spreadsheet bulk import with topology; notification-on-profile; inline rename before provisioning; tag persistence; deliberate SNMP v1/v2c/v3 coverage; "at least one provisioned" tolerance for dynamic host counts.

### 5.2 Discovery — Databases

**What it is.** Onboarding a database server as a monitor **without an agent**. The operator picks category **Database**, a **Database Type**, and supplies host, port, the **service/instance/database name**, and a DB credential (**JDBC** is the default protocol for relational engines). Some flows **Test** the credential (a "Successful" result confirms reachability + valid login) before provisioning.

| DB Type | Protocol | Key inputs | Verified |
|---|---|---|---|
| SQL Server | JDBC | Host, port, instance; credential **Test** | Test "Successful"; discovered, provisioned; searchable with icon |
| Oracle RAC Cluster | JDBC (default) | Host, port, DB service name | **Two** objects (cluster + service) discovered; **both** provisioned |
| MongoDB | Native DB port | Host, port; credential | Provisioned (non-blocking checks); searchable with icon |
| Elasticsearch | HTTP/API | Host; credential | Provisioned; row scoped to target IP |
| Sybase (rediscover) | JDBC | Stage 1: Linux host + SSH; Stage 2: JDBC instance + DB credential | Host provisioned; Sybase rediscovered & provisioned; editable metric collection |
| RabbitMQ (rediscover) | Management API (Basic) | Stage 1: Linux host + SSH; Stage 2: Basic-auth credential | Host provisioned; RabbitMQ rediscovered & provisioned; editable metric collection |

### 5.3 Service Checks (Agentless)

**What it is.** Synthetic **availability/health checks** from the platform to a target — no agent on the target. The operator picks a **Service Type**, enters the target and protocol-specific parameters, runs it, and provisions the resulting monitor.

| Check Type | Monitors (plain words) | Verified |
|---|---|---|
| Ping | ICMP reachability of a host | Provisioned |
| DNS | A lookup name resolves to the expected record (A) on a DNS server | Provisioned |
| Port | A specific TCP port is open/listening | Provisioned |
| URL | HTTP/HTTPS endpoint availability (scheme + method) | Provisioned |
| FTP | FTP login/availability (username + password) | Provisioned |
| NTP | Time-sync source reachability | Provisioned |
| SSL Certificate | Certificate presence/validity on an HTTPS endpoint | Provisioned |
| Email | Mail server round-trip / SMTP with TLS | Provisioned |
| RADIUS | RADIUS authentication (username + password + shared secret) | Provisioned |
| Domain | Domain reachability / expiry | Provisioned |

### 5.4 Rediscovery

**What it is.** Re-scanning an **already-monitored host** to find entities on it that are not yet being collected, then onboarding them. The pattern: remove/define an entity, create a **Rediscover Scheduler** for that entity type against the monitor, run it on demand, provision the found entity, and confirm it reappears under the correct Monitor Settings tab.

| Entity | Re-discovers / onboards | Verified |
|---|---|---|
| Access Point | Ruckus APs on a wireless controller | AP reappears under the AP tab |
| File / Directory | Files/folders (e.g. a Windows directory) | Path onboarded, appears under Windows Directory tab |
| Interface | Network interfaces/ports on a firewall monitor | Interface reappears under Network Interface |
| Process | OS processes (e.g. a Windows process) | Process onboarded, appears under Windows Process |
| Service | OS services (e.g. a Windows service) | Service onboarded, appears under Windows Service |
| Virtualization | Guest VMs on an ESXi host | VM reappears under VMware ESXi VM |
| **Application** | Apps discovered on a host (see below) | App onboarded; form closes on the license-consuming "Add Instance" confirmation |

**Application Rediscovery** onboards applications found on a host, **excluding MongoDB**, in four shapes:
- **HTTP, no credential** — Nginx, Apache HTTP, Light Httpd (port only)
- **HTTP with Basic auth** — Apache Tomcat, WildFly (port + HTTP/HTTPS credential)
- **JDBC** — MySQL, MariaDB, PostgreSQL (port + database/instance + JDBC credential)
- **SSH, reuses host credential** — HAProxy (no fields, just run)

It is **idempotent** — already-onboarded apps are skipped.

### 5.5 Monitoring Configuration

**What it is.** Managing how existing monitors are collected and organised.

| Area | What it does | Verified |
|---|---|---|
| **Agent Monitoring** | Manage a host running the Motadata agent (publishes/subscribes metrics to collectors) | Locate agent, tag it, **export** its config, edit to add a collector, **re-import**, confirm agent **restarts** |
| **Device Monitor Settings** | Lifecycle actions on monitors | Bulk interface-speed change; bulk tag; **Disable/Enable** (Poll Now blocked while disabled); **On/Off Maintenance** (Poll Now blocked while in maintenance); update poll/collection time; Docker & Docker Container tabs present |
| **Monitoring Hour** | Named business-hours schedules | Create a Mon–Fri schedule and **assign** it to a device |
| **Custom Monitoring Field** | User-defined fields on monitors | Rename a field, assign it (with value) to a device, confirm it shows as an inventory column |
| **Metric Plugin** | User-authored custom metric collector (e.g. hardware sensors) | Create plugin for a firewall monitor, **Test** ("tested successfully"), save, assign/unassign monitors |

### 5.6 Dashboards

**What it is.** Each monitor has a dedicated **dashboard** — an Overview plus type-specific tabs, populated with widgets (KPI tiles, gauges, charts, availability panels, grids). Tests open a monitor's dashboard, confirm identity and data are present (no empty-state placeholders), and drill through tabs.

| Dashboard | Shows | Verified |
|---|---|---|
| **Server & Apps** | Linux/Windows health: CPU, Memory, Disk, IOPS, Network, Response Time, availability; Active Process, Services, Installed Software, Metric Explorer, Active Alerts, Configured Policy tabs | Deep pass on Linux (KPI value formats, >5 charts, interface & process grids with live rows); lighter data-driven pass on Windows |
| **Network** | Network device availability KPIs, Metric Explorer, Configured Policy | Identity, tabs, Overview widgets render |
| **Virtualization** | vCenter/ESXi: cluster/host/datastore/VM counts, CPU/Memory/datastore utilisation; per-entity tabs | Count widgets & utilisation KPIs; drill into each tab |
| **Database** | Elasticsearch: CPU, heap/non-heap memory, disk & network I/O, search/segment time; Memory, I/O, Network, Thread tabs | KPI widgets & Overview render; each tab shows content |
| **Service Check** | URL/FTP, DNS, Email monitors: availability + protocol panels (DNS latency, email response time) | Availability KPIs & protocol panels render; Metric Explorer & Policy tabs |

### 5.7 Metric Explorer

**What it is.** An ad-hoc analytics workspace to plot and analyse KPIs at **metric level** (device-wide) and **instance level** (a specific component). Selected KPIs render as trend charts with analytical **Actions**.

**Covered:** **Compare** (plots a KPI trend, confirms data series), **Forecast** (predictive chart), **Anomaly** (anomaly detection with an Anomaly tag and adjustable **granularity**, including Raw), **time-granularity changes** re-plotting the chart, and **saving/updating a named Saved View**. Enforces monitor selection by IP and fails fast on empty data.

### 5.8 Policies & Alerting

**What it is.** A **policy** attaches threshold/state rules to monitors; a breach raises an **alert** at a severity. **NetRoute Settings** first defines a monitored network path that a NetRoute policy can target.

| Policy Type | What it does | Verified |
|---|---|---|
| **Metric policy** | Alerts when a numeric metric breaches a threshold operator | Full lifecycle: create (always-breaching Critical) → appears in list → **Critical alert actually fires** on the monitor's Active Alerts → disable → delete (with safety cleanup) |
| **NetRoute policy** | Alerts on a network-path metric | Create with **Source-to-destination** and, separately, **Hop-to-Hop** route evaluation; both confirmed in list |
| **Availability policy** | Alerts on up/down state change | Create → disable → delete only (**no alert-fire** step — see limitations) |
| **NetRoute Settings** | Define a monitored route (name, destination, port, source monitor) | Route appears in the NetRoute list |

### 5.9 Service Level Objectives (SLO)

**What it is.** An SLO sets a target for a service's availability or performance over a window, with target/warning thresholds, frequency, and recipients. A **Penalty Profile** attaches financial penalties to breach bands.

**Covered:**
- **SLO Profile** — **Availability** SLOs (target/warning % on monitors/interfaces) and **Performance** SLOs (one or more metric conditions, including a multi-metric CPU/disk/memory case), for both Monitor and Interface scope; each confirmed in the list. Duplicate names are skipped cleanly.
- **SLO Penalty Profile** — name, description, contract amount, currency, and **10 non-overlapping SLO % bands** with rising penalties; confirmed in the list.

### 5.10 SNMP Trap Management

**What it is.** Devices push **traps** (event notifications) to the platform's **listener**; the processor matches them to profiles/policies and translates them. Traps appear in **Trap Explorer** after a fixed ~5-minute datastore flush, or in real time in the **Live Trap Viewer**.

| Test area | Verified |
|---|---|
| **Trap Config** | Create/confirm/delete + required-field validation for **Listener** (v1/v2c and v3), **Profile** (manual OID + translator, plus **bulk CSV**), **Forwarder**, and **Policy**; empty-required submits are rejected |
| **Live Trap** | Real-time path: fire a trap, confirm it streams in within seconds with correct Received Time, OID, Source, Message |
| **Trap Explorer** | Chart renders; **acknowledge** persists across reload; **create policy from a trap** (OID prefilled); trap detail page echoes Source/OID/Version/Vendor/Count; filter by OID; **CSV & PDF export** |
| **Trap Routing** | Version↔port routing: valid version/port/credential combinations **deliver**, mismatched ones are **silently dropped** |
| **Trap Policy Trigger** | End-to-end: policy triggered by OID **and** a varbind-content filter → fire matching trap → after ~5-min flush a **Critical alert** appears → delete policy |
| **Trap Propagation** | Fire a burst of distinct traps, absorb one flush, confirm each appears in Trap Explorer with correct Source and translated name |

### 5.11 NCCM — Network Config & Change Management

**What it is.** Backing up, versioning, drift-detecting, and syncing network-device **configurations**.

- **Device NCCM Discovery** — bring a device under NCCM via a discovery profile with an SNMP/SSH credential (enable password/prompt, config transfer protocol e.g. TFTP) and the **Network Config Management** toggle on; **Test** ("Successful"), run, provision; also edit/attach credentials from Device Inventory.
- **Perform NCCM Actions** — full config lifecycle: **Set as Baseline** (v1.0) → **Runbook remediation** ("Runbook Successful") → **Backup Now** detects **Conflict** (v2.0, listed in Baseline-Running and Startup-Running conflict summaries) → **conflict diff** shows the inserted line → **Sync** brings it back In Sync ("Sync Successful") → **Compare** confirms diff counts (Modified/Inserted/Deleted) resolve to 0.

### 5.12 Runbooks (Automation)

**What it is.** An automated remediation/data-collection action run against a device using a stored credential.

- **Database Runbook (Windows)** — queries a target database with a SQL script; assign to a Windows device, attach credential, **Test**, confirm created & listed.
- **Custom Runbook (Windows)** — a user plugin script that retrieves running Windows services via remote execution; assign device + credential, **Test**, confirm creation (after async plugin build).

### 5.13 Integrations (ITSM)

**What it is.** Connecting AIOps to an external ticketing system so alerts create and sync tickets/incidents. Each test configures the connection (server URL + credential, duplicate handling), toggles **Auto Sync** / **Use Proxy**, runs **Test** ("succeeded"), saves, and creates an **Integration Profile** mapping alerts to ticket fields.

| Integration | Verified |
|---|---|
| **Atlassian Jira** | Setup + profile mapping to Project, Issue Type (Task), auto-close on a "done" status |
| **ServiceNow** | Alerts as **Incidents**, new ticket on re-occurrence, Fail-Over Email, profile with **Auto Close Ticket** |
| **Motadata ServiceOps** | OAuth-style credentials (Client ID/Secret), Source field, rich profile: Severity→Impact/Urgency, Location/Category/Department, Technician Group/Assignee/Vendor, status, and **custom fields** (text, dropdown, multi-select, number, dependent hierarchy, checkbox) |

### 5.14 APM — Application Performance Monitoring

**What it is.** Registering application **Trace Services** so an APM agent can instrument them for distributed tracing.

**Covered:** registering a Trace Service for each supported runtime — **Java, .NET, NodeJS, Python, Ruby, PHP, Go** — selecting the APM agent, language, service name (and executable/jar path where required); confirms "Trace Service created successfully" and the row in the registration grid.

### 5.15 Real User Monitoring (RUM)

**What it is.** Onboarding front-end web applications for browser/real-user telemetry.

**Covered:** registering five framework types — **Vue, React, JavaScript, Angular, Next.JS** — each with application type, name, Nginx deployment, domain, version, environment, session sample rate, and privacy level; captures the generated registration/instrumentation snippets; grid entries appear as `<name>@<version>:<environment>`. Skips if all five already exist.

### 5.16 Platform Administration

**What it is.** System- and user-level administration.

| Area | Verified |
|---|---|
| **Proxy Server** | Enable proxy, enter host/port/timeout, **Test** ("tested successfully"), save (skips if already enabled) |
| **Storage Backup Profile** | Create Storage Profiles over **SCP/SFTP, TFTP, FTP** (each connectivity-tested), attach to Config DB Backup Profile, run backup, swap transports and re-run |
| **Rule-Based Tags** | Dynamic tagging rules per object type (Monitor, Interface, VM, Access Point, Process, Service): static + dynamic tags, Include/Exclude conditions, preview, bulk rerun, clone, flip; tags surface in Inventory & Monitor Settings |
| **Multi-LDAP Server Sync** | Configure **multiple** LDAP/AD servers, **Test Credentials**, save, and **sync** each ("synced successfully") |
| **User Login (RBAC)** | Admin creates a Local Auth user (group, role, session expiry, force password change), then that user logs in, is forced through first-login password change, and re-authenticates |

---

## 6. Module Dependencies

Understanding what must exist before a module can be exercised:

```
Credential Profiles ─────────────► used by Discovery, Rediscovery, NCCM,
                                    Runbooks, Integrations, Metric Plugin,
                                    Storage Profiles, LDAP, Traps (v3 auth)

Discovery + Provisioning ─────────► produces MONITORS, required by:
     ├─► Dashboards & Metric Explorer   (need a provisioned monitor with data)
     ├─► Rediscovery                    (needs an already-monitored host)
     ├─► Policies                       (need a monitor / interface / group)
     ├─► Monitoring Configuration       (act on existing monitors)
     └─► NCCM Actions                   (need an NCCM-managed device)

NetRoute Settings ────────────────► NetRoute policy needs a defined route
Business service + source scope ──► SLO Profiles
Trap Listener + Trap Policy ──────► must exist BEFORE a trap arrives (no retro-match)
```

**Key ordering rules the tests rely on:**
- A **policy** fails fast if its target monitor isn't provisioned.
- A **NetRoute policy** needs a NetRoute defined first.
- **Trap policies** act at processing time — they must exist *before* the matching trap is received.
- **Application/DB rediscovery** needs the host already monitored and the apps actually running on it.

---

## 7. Cross-Cutting Behaviours

- **Credential Profiles are shared plumbing** across Discovery, Rediscovery, NCCM, Runbooks, Integrations, Metric Plugin, and Storage Profiles. Most flows handle an already-existing / "not unique" profile gracefully.
- **Provisioning consumes a license** — onboarding steps confirm the license-consuming "Add Instance" / Provision confirmation.
- **Trap flush latency (~5 minutes)** — stored traps and trap-triggered alerts take a fixed ~5 minutes to surface; the Live Trap Viewer bypasses this for real-time checks.
- **Real alert latency** — a metric policy's Critical alert can take ~2 minutes of real breach time to appear.
- **Idempotency & cleanup** — rediscovery, SLO, integrations, monitoring-hour, custom-field, proxy, RUM, and policy areas detect pre-existing state and skip or clean up, keeping the shared environment reusable. Forever-firing test policies are always disabled/deleted afterwards.
- **Dynamic-result tolerance** — range/ping scans assert "at least one provisioned" because live host counts vary.
- **Notifications** — discovery profiles and rediscover schedulers can attach notification recipients (email).

---

## 8. Assumptions & Preconditions

The test suite assumes:
1. A **live, reachable Motadata AIOps environment** with a valid admin login.
2. **Target assets are reachable** with the expected credentials/protocols (servers, network gear, hypervisors, databases, wireless controllers, trap senders, LDAP/AD, ITSM endpoints).
3. Some flows require **pre-existing monitors** (e.g. a policy's target monitor, an NCCM-managed device, a host that hosts the apps/DBs to rediscover).
4. **Sufficient license capacity** to provision new monitors.
5. A **shared environment** — data hygiene matters; duplicate-guarded flows must have prior test data cleaned before a clean re-run.
6. Certain areas depend on **specific well-known hosts/services** being present in the environment (e.g. a Linux host that runs the Dockerised applications used by Application Rediscovery, a device that pushes SNMP traps).

---

## 9. Known Limitations & Coverage Gaps

Within the areas that **are** covered, note the following boundaries:

- **Availability Policy** — only the create → disable → delete lifecycle is covered; **no alert-fire** verification (a DOWN state cannot be forced deterministically).
- **Application Rediscovery** — **MongoDB is intentionally excluded**. Coverage requires the target host to actually have the applications discovered on it (environment-dependent). Onboarding is one-shot per app: once onboarded, an app no longer appears for re-onboarding.
- **RabbitMQ & Sybase** — covered via the **host-then-app rediscovery** flow on their own hosts; they are **not** part of the multi-application onboarding matrix.
- **MongoDB Database Discovery** — uses non-blocking (soft) assertions.
- **Trap Propagation** — the "policy-matched trap raises an alert" step is scaffolded but not yet active (the dedicated **Trap Policy Trigger** test covers alerting instead).
- **Dashboards** — the Linux server dashboard gets the deepest verification; other dashboards are verified more lightly (presence of tabs/widgets/data rather than exhaustive value checks).
- **Dynamic counts** — range/ping discovery only assert "at least one" provisioned, not exact totals.

> Anything **not listed anywhere in Section 5 is not currently covered by tests** and must not be assumed to work from this document.

---

## 10. Testing Scope Summary

Coverage depth by area:

| Depth | Meaning | Areas |
|---|---|---|
| **End-to-end (with outcome)** | Drives the full business outcome and verifies the result event | Metric Policy (alert fires), NCCM (baseline→conflict→sync→compare), Trap Policy Trigger (alert), Trap Propagation, Application Rediscovery |
| **Create → Provision → Verify** | Onboards and confirms the entity exists/monitors | All Discovery, Database Discovery, Service Checks, Rediscovery, Dashboards, Metric Explorer |
| **Full config lifecycle** | Create → verify → disable/delete or assign | Policies, Monitoring Configuration, Rule-Based Tags |
| **Configure & Test** | Sets up and validates connectivity/creation | Integrations, Runbooks, SLO, Storage Backup, Proxy, LDAP, Metric Plugin, APM, RUM, User/RBAC |

---

## 11. Maintaining This Document

This README is a **living document** and must stay synchronised with actual test coverage:

- **When coverage is added** — for a new module, feature, workflow, or scenario — add it to the relevant part of [Section 5](#5-modules--test-coverage), update [Coverage at a Glance](#4-coverage-at-a-glance) and the [Testing Scope Summary](#10-testing-scope-summary), and record any new dependency or limitation.
- **When coverage changes or is removed** — update or delete the corresponding entry so the document never overstates what is tested.
- **Never add** product features, modules, or workflows that have **no** test coverage, and never describe planned/future behaviour.
- Keep entries **product-focused** — describe business behaviour and verified outcomes, not tooling or implementation.

When in doubt, the rule is simple: **if there is no test for it, it does not belong in this document.**
