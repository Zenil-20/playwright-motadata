---
screen: Flow · sampling-rate
module: Settings
category: flow-settings
route: "/settings/flow-settings/sampling-rate"
build: 8.2.6
status: draft
sources: [catalog]            # catalog/settings_flow_settings_sampling_rate.json. No screenshot depicts this screen — Flow.png is the analytics dashboard, not a settings screen.
verified: 2026-07-09
---

# Flow · Sampling Rate

## 1. Purpose
Per-interface view of the flow **sampling rate** — the 1-in-N ratio at which an exporter samples packets for
sFlow/NetFlow. Because analytics scale observed bytes/packets **up by the sampling rate** to estimate real
volume, an accurate rate per interface is essential; this screen lets an admin see the exporter-reported
rate and set a **Custom Sampling Rate** override where it is wrong or missing.

- **Business objective:** keep flow volume estimates accurate — a wrong sampling rate directly scales flow
  traffic figures up or down.
- **Screen description:** a searchable grid of interfaces (index, source, name/description/alias, speed) with
  the reported **Sampling Rate**, an editable **Custom Sampling Rate**, and per-row Actions. There is **no
  Create button** — rows come from discovered flow-exporting interfaces; you edit, not add.
- **Primary use cases:** override the sampling rate for an interface whose exporter reports it wrongly (or
  not at all); review sampling across interfaces.
- **Who uses it:** network / NOC admins. TODO(source: KG/docs) — exact role.
- **Dependencies:** the Flow module; interfaces that are discovered and exporting flow; the Flow analytics
  that applies the rate to scale volumes.

## 2. Navigation
```
Settings → Flow (Flow Settings) → Sampling Rate
```
- **Breadcrumb:** Settings › Flow › Sampling Rate
- **Sibling screens (Flow Settings):** Flow Settings · Sampling Rate · Application Mapping ·
  Protocol Mapping · AS Mapping · Domain Mapping · Geolocation Mapping · IP Mapping
- **URL:** `/settings/flow-settings/sampling-rate`

## 3. Actions
- **Search** the grid — `input[name="search-sampling-rate"]` (placeholder _Search_).
- **Per-row Actions** — edit the **Custom Sampling Rate** for an interface (`[data-cy='grid-action']`).
- No create/add action (catalog shows zero buttons) — this screen edits discovered interfaces only.
- TODO(source: KG/docs) — whether the edit is inline or a drawer, and whether bulk edit exists.

## 4. Components
| Component | Control (from catalog) |
|---|---|
| Search box | `input[name="search-sampling-rate"]` (text, placeholder _Search_) |
| Global Settings search | unnamed `input` (placeholder _Search_) — shared Settings shell |
| Grid | columns: **Interface Index**, **Source**, **Interface Name**, **Interface Description**, **Interface Alias**, **Interface Speed**, **Sampling Rate**, **Custom Sampling Rate**, **Actions** |
| Row actions | `[data-cy='grid-action']` (edit) |

> No `buttons`/`buttonIds` were captured — consistent with an edit-only (no-create) grid. The edit control's
> fields + ids were **not captured** in the list-state sweep. TODO(source: catalog live-form sweep).

_Locators: raw sweep in `knowledge/locators/catalog/settings_flow_settings_sampling_rate.json`; promote
verified ones into the cookbook (Settings > Flow > Sampling Rate)._

## 5. Permissions
- Settings configuration screen → expected **Admin**-level write. Generic RBAC reasoning only.
  TODO(source: KG/docs). Requires the **Flow** module/license. TODO(source: docs).

## 6. Entry Conditions
- Logged in; Settings reachable; **Flow module enabled**.
- At least one discovered, flow-exporting interface for the grid to be non-empty. TODO(source: docs).

## 7. Exit Conditions
- **On Custom Sampling Rate save (success):** toast; the Custom Sampling Rate cell updates; subsequent flow
  volume for that interface is scaled by the new rate in analytics.
- **On clear/reset override:** interface reverts to the exporter-reported Sampling Rate.
- Good assertions: Custom Sampling Rate cell reflects the saved value; volume figures scale accordingly.
  TODO(source: docs) — forward-only vs retroactive scaling.

## 8. Validations
- **Custom Sampling Rate** — expected positive integer (a 1-in-N ratio; N ≥ 1). TODO(source: docs) — exact
  range and whether 0/blank means "use reported rate".
- Other columns (Index, Source, Name, Description, Alias, Speed) are read-only discovered attributes.
- Inline errors not captured. TODO(source: catalog live-form sweep).

## 9. Business Rules
- Effective rate = **Custom Sampling Rate** if set, else the exporter-reported **Sampling Rate**; analytics
  scale observed volume by this rate (reasoned from column names + how sFlow/NetFlow sampling works — mark
  the scaling detail TODO(source: KG) for confirmation).
- Rows are **discovered, not user-created** (no create action). TODO(source: KG) — refresh/rediscovery
  cadence for the interface list, and whether Interface Speed = 0 interacts with sampling as it does with
  utilization (see KB §1 `PQD-31144`, division-by-zero at speed 0 — related area, not this screen's bug).

## 10. Known Bugs
None recorded for this screen.

## 11. Edge Cases
- Custom Sampling Rate = 0, negative, non-integer, or extremely large.
- Interface with no exporter-reported rate (blank Sampling Rate) then a custom override.
- Interface Speed = 0 or missing (see related utilization bug PQD-31144).
- Override an interface, then rediscovery updates the interface list — does the override persist?
- Duplicate interface index across different sources (Interface Index alone is not unique).
- Search: no match, partial (name vs index vs alias), case sensitivity.
- Empty grid (Flow enabled, no exporting interfaces yet).
