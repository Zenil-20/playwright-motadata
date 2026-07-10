# Feature: Unified Create Policy UI (Set Conditions)
Jira: MOTADATA-8503   Figma: DPReGBjeIv7nogzeNs9Uel (node 30368-222640)

## Goal
One consistent Create Policy flow for Metric, APM, RUM, NetRoute. A single "Set Conditions" section exposes four tabs — Threshold | Baseline | Anomaly | Forecast — replacing the old separate Anomaly/Forecast flows. Baseline newly supported for APM/RUM/NetRoute.

## In-scope screens
- Policy Settings > Create Policy (unified)   # canonical screen key
- Monitors (breach validation only — backend-dependent)

## User journeys
1. Policies → Create Policy → pick module → name + tag → Set Conditions tab → pick Counter + Source Filter + Source → set tab-specific params → expand notify/action accordions → Create Policy → success + appears in list.
2. Edit existing Threshold policy → renders in unified screen → change values → save → persists.

## Edge cases
- Create Policy disabled until Policy Name present (B1).
- Counter mandatory on all four tabs (B2).
- Source required when Source Filter ≠ Everywhere/All (B3).
- Operator dropdown persists (B4); tab-specific params (Notify-if-breach / Abnormality Occurrence / Auto Clear) persist (B5).
- APM Policy Type switch filters counters (D1); RUM/NetRoute show only eligible counters (D2,D3); Metric no regression (D4).
- Backward compat: existing Threshold + Anomaly/Forecast policies still work (F1,F2).

## Data dependencies
- Metric: counter CPU (system.cpu.percent), source Group/Monitor → a Linux monitor ({{env.Sybase_linux_ip}} exists in suite).
- APM/RUM/NetRoute: require seeded service/application/interface sources — NOT confirmed present in sandbox.

## Out of scope (this pipeline pass)
- Backend breach/alert generation (UC1 "simulate breach"), baseline-window evaluation, forecast-horizon math — these are not UI-deterministic.

## Coverage reality
- UC1 (Metric Threshold) is automatable now from verified existing locators.
- The new "Set Conditions" tabs, module pickers for APM/RUM/NetRoute, and APM Policy Type switch are NOT in any existing spec/cookbook → require live harvest before automation. Manual cases cover them fully.
