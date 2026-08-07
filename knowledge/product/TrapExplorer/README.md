---
module: TrapExplorer
scope: module-overview                # cross-screen; the six screen docs hold per-screen detail
routes: ["/trap-explorer/", "/trap-explorer/live-trap-viewer", "/settings/snmp-trap/*", "/settings/policy-settings/trap"]
build: 8.2.6                          # screen docs; live observations below are tagged 8.2.3
status: draft
sources: [docs, live, tfs, kb]        # docs.motadata.com trap-management · live app 8.2.3 (2026-04-05) · ADO suites 19124/2803 · known_issues/customer-issue-kb.md §7
verified: 2026-08-07
---

# Trap Explorer — Module Overview

Cross-screen view of SNMP trap management: how the six screens fit together, what order they must be
configured in, and where test coverage stands. **Per-screen detail lives in the screen docs** (§6) —
this file holds only what no single screen owns.

> **Provenance.** Screen docs are verified against build **8.2.6** (2026-07-09). Live observations in
> this file are from build **8.2.3** (2026-04-05) and are tagged `(observed 8.2.3)`. Where the two
> disagree, 8.2.6 wins — see [§8](#8-open-conflicts--documentation-gaps).
>
> Doc sources: [Overview](https://docs.motadata.com/motadata-aiops-docs/trap-management/SNMP-trap-overview/) ·
> [Listener](https://docs.motadata.com/motadata-aiops-docs/trap-management/SNMP-Trap-Listener/) ·
> [Profile](https://docs.motadata.com/motadata-aiops-docs/trap-management/SNMP-Trap-Profile/) ·
> [Processing](https://docs.motadata.com/motadata-aiops-docs/trap-management/Trap-Processing/) ·
> [Explorer](https://docs.motadata.com/motadata-aiops-docs/trap-management/SNMP-Trap-Explorer/) ·
> [Forwarder](https://docs.motadata.com/motadata-aiops-docs/trap-management/SNMP-Trap-Forwarder/)

## 1. Architecture

```
Network Devices
      │ (SNMP trap — UDP)
      ▼
[1. Trap Listener] ──── port 1620 (v1/v2c) · 1630 (v3)   (observed 8.2.3)
      │
      ▼
[2. Trap Processing Engine] ──── OID matched against Trap Profiles
      │
      ├──────────────┬──────────────┐
      ▼              ▼              ▼
[3. Explorer]   [4. Forwarder]  [5. Trap Alerts]
   (view)          (route)         (policy)

[6. Trap Profile] ──── the OID→metadata mapping every stage above reads
```

## 2. Processing pipeline

| # | Step | Key detail |
|---|---|---|
| 1 | Reception | Listener receives the trap over UDP on its configured port |
| 2 | Parsing | Source IP, OID, variable bindings, timestamp, version extracted; version-specific auth validated |
| 3 | Profile matching | OID matched against the Trap Profile catalog → name + severity + message assigned |
| 4 | Ingestion | Stored and shown in Trap Explorer. **Unmatched OIDs are still ingested, but with no metadata** |
| 5 | Forwarding | OID checked against forwarder mappings. **Non-blocking** — local ingestion happens regardless |
| 6 | Alert evaluation | Trap alert rules evaluated; an alert is raised if conditions match |

Two consequences worth testing directly: an unmatched OID yields a visible row with blank
name/severity/message (step 4, not a drop), whereas a profile with **Filter = Yes** *is* a silent drop
(step 3) — see `Settings/snmp-trap/snmp-trap-profiles.md` §9.

## 3. Prerequisite chain

Strictly sequential — each link is a precondition for the next, and skipping one produces a silent
empty screen rather than an error:

```
1. Listener configured + UDP port open   → traps can be received at all
2. Trap Profiles exist                   → received traps gain name / severity / message
3. Explorer becomes useful               → requires 1 + 2
4. Forwarders                            → require ≥ 1 Trap Profile mapped
5. Trap alert policies                   → require active trap ingestion
```

This chain is why the KB's trap-invisibility bug (PQD-33528) presents identically at every screen: a
listener credential mismatch at link 1 empties links 3–5 with no error anywhere.

## 4. Retention and correlation

| Data | Default retention |
|---|---|
| Trap raw data | 7 days |
| Trap aggregated data | 180 days |

AIOps correlates traps with performance metrics, configuration data, log information, inventory
details, and geographic location.

## 5. Cross-screen constraints

| Constraint | Impact | Owning screen doc |
|---|---|---|
| Port exclusivity | Each listener port is unique; it cannot be reused across profiles | snmp-trap-listener |
| v3 requires an explicit toggle | The v3 listener does not activate until toggled on | snmp-trap-listener |
| Inbuilt profiles are protected | Cannot be deleted — clone or view only | snmp-trap-profiles |
| **Filter = Yes is destructive** | Matching traps are dropped silently, with no Explorer visibility | snmp-trap-profiles |
| No profile ⇒ no metadata | Trap is still visible, but name/severity/message are blank | snmp-trap-profiles |
| Acknowledgment is transient | Re-receiving the same trap **overrides** the acknowledgment | trap-explorer |
| Forwarding is non-blocking | Local ingestion always occurs, even if forwarding fails | snmp-trap-forwarder |
| Alerts are a separate system | Trap alerts are managed apart from Metric/Log/Flow policies | policy-settings/trap |

## 6. Screen index

Seven screens across three areas:

| Screen | Doc | Route |
|---|---|---|
| Trap Explorer | `TrapExplorer/trap-explorer.md` | `/trap-explorer/` |
| Live Trap Viewer | `TrapExplorer/live-trap-viewer.md` | `/trap-explorer/live-trap-viewer` |
| SNMP Trap settings (landing) | `Settings/snmp-trap/overview.md` | `/settings/snmp-trap/` → profiles grid |
| Trap Listener | `Settings/snmp-trap/snmp-trap-listener.md` | `/settings/snmp-trap/snmp-trap-listener` |
| Trap Profiles | `Settings/snmp-trap/snmp-trap-profiles.md` | `/settings/snmp-trap/snmp-trap-profiles` |
| Trap Forwarder | `Settings/snmp-trap/snmp-trap-forwarder.md` | `/settings/snmp-trap/snmp-trap-forwarder` |
| Trap alert policy | `Settings/policy-settings/trap.md` | `/settings/policy-settings/trap` |

Note the architecture in §1 has **six** components while there are **seven** screens — the Trap
Processing Engine is a backend stage with no UI, and the Settings landing screen is UI with no
distinct backend component.

## 7. Test coverage

### 7.1 Existing suites (Azure DevOps)

| Suite | Suite ID | ≈ Cases | Covers |
|---|---|---|---|
| Trap Explorer | 19124 | 28 | Explorer UI, table columns, filters, timeline chart |
| Settings — SNMP Trap | 2803 | 55 | Listener config, Profile CRUD, Forwarder config (largest settings suite) |

≈ **83 cases across 2 suites.**

### 7.2 Coverage gaps

| Gap | Risk | Recommendation |
|---|---|---|
| Live Trap Viewer has no suite | HIGH — real-time streaming UI wholly untested | New suite: `Trap Explorer — Live Viewer` |
| Acknowledgment / re-receipt reset | HIGH — documented transient behavior, easy to regress | New suite: `Trap Explorer — Acknowledgment` |
| Explorer → alert creation | HIGH — cross-module workflow | New suite: `Trap Explorer — Alert Creation` |
| `Filter = Yes` silent drop | HIGH — data-loss scenario | Add to `Settings — SNMP Trap` |
| High-volume trap ingestion | HIGH — performance/reliability | New suite: `Trap Explorer — Load Test` |
| Unmatched OID degradation | MEDIUM — graceful-degradation path | Add to `Trap Explorer` |
| SNMPv3 security levels | MEDIUM — 3 levels + conditional fields | Add to `Settings — SNMP Trap` |
| Forwarder non-blocking behavior | MEDIUM | Add to `Settings — SNMP Trap` |
| MIB management | LOW — may not exist in product | Investigate first, then create if applicable |

### 7.3 QA priorities

**P0 — critical path**
1. Listener port binding — UDP 1620/1630 bind; port-conflict handling
2. Trap reception — v1, v2c, v3 all received; wrong credentials rejected
3. Profile matching — correct OID match · unmatched ⇒ blank metadata · `Filter = Yes` ⇒ dropped
4. Acknowledgment reset — a re-received trap overrides ack status
5. Explorer display — all columns populate; timestamp and count accurate

**P1 — functional coverage**
6. SNMPv3 — all three security levels; conditional field display
7. Forwarder — OID-based routing; multi-profile; non-blocking; unreachable destination
8. Alerts — creation from the Explorer Action column; severity colors; trigger/clear rules; email placeholders
9. Filters — each independently and combined; empty-result state
10. Live Trap Viewer — real-time streaming; behavior under volume

**P2 — edge cases**
11. Deleting an inbuilt profile must fail
12. Used Count accuracy after forwarder changes
13. Two listeners on one port must be rejected
14. Thousands of traps/second — no loss; graph accuracy
15. Editing a profile while traps are arriving
16. Deleting a forwarder mid-forward
17. Malformed OID at profile creation
18. SNMPv3 wrong username / password / privacy protocol

## 8. Open conflicts / documentation gaps

**Conflict — default listener port.** `snmp-trap-listener.md` §8 assumes the SNMP standard **162**
(marked `TODO(source: docs)`, i.e. never verified). The live app shows the shipped **Default** listener
on **1620 (v1/v2c) and 1630 (v3)** (observed 8.2.3), which the trap-management docs corroborate. The
1620/1630 pair is recorded as the observed default; the `162` assumption is retained as unconfirmed.
**Re-verify on 8.2.6 before writing port-binding tests.**

Undocumented, in product-doc order — each is an unknown, not a known absence:

- MIB upload/import UI
- Trap deduplication logic
- Retention purge schedule details
- Rate limiting
- SNMP INFORM support
- Trap source whitelist/blacklist
- Multi-server / HA listener behavior
- Variable-binding display detail
- Trap-to-incident auto-creation
